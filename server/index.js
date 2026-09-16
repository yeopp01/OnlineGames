'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { WebSocketServer } = require('ws');
const { Raeume, MAX_SPIELER, codeZeigen } = require('./raeume');
const { Schutz, adresseVon } = require('./schutz');
const { konten } = require('./konten');
const { manager } = require('./spiele/manager/netz');
const verzeichnis = require('./spiele/verzeichnis');

const HAFEN = Number(process.env.PORT) || 4180;
// Nur einschalten, wenn wirklich ein Reverse Proxy davorsteht - sonst darf
// jeder seine Adresse selbst behaupten.
const HINTER_PROXY = process.env.HINTER_PROXY === '1';
const OEFFENTLICH = path.join(__dirname, '..', 'public');
const NACHRICHT_MAX = 8 * 1024;

const TYPEN = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

function ausliefern(anfrage, antwort) {
  const pfad = decodeURIComponent(new URL(anfrage.url, 'http://x').pathname);
  const datei = path.join(OEFFENTLICH, pfad === '/' ? 'index.html' : pfad);
  // Kein Ausbrechen aus dem oeffentlichen Ordner ueber ../
  if (!datei.startsWith(OEFFENTLICH)) {
    antwort.writeHead(403).end('Verboten');
    return;
  }
  fs.readFile(datei, (fehler, inhalt) => {
    if (fehler) {
      antwort.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Nicht gefunden');
      return;
    }
    antwort.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei)] || 'application/octet-stream' });
    antwort.end(inhalt);
  });
}

async function starten(hafen = HAFEN, einstellungen = {}) {
  const raeume = new Raeume();
  // Einmal beim Start gelesen: ein kaputter Steckbrief verhindert den Start,
  // statt spaeter eine leere Uebersicht zu zeigen.
  const spiele = JSON.stringify({ spiele: verzeichnis.lesen() });
  const schutz = new Schutz(einstellungen.schutz);
  const zugang = await konten({
    hafen,
    ...einstellungen.konten,
  });

  if (!zugang.geheimnisGesetzt && process.env.NODE_ENV === 'production') {
    console.warn('KONTEN_GEHEIMNIS ist nicht gesetzt - jeder Neustart meldet alle ab.');
  }

  // Das Managerspiel bringt seinen eigenen Anfrageweg mit - hier steht nur,
  // dass es ihn gibt (→ docs/adr/0006-mehrere-spiele.md).
  const spielManager = manager({
    schutz,
    adresseVon: (a) => adresseVon(a, HINTER_PROXY),
    db: zugang.db,
    sitzung: zugang.sitzung,
  });

  const server = http.createServer((anfrage, antwort) => {
    // Alles unter /api/auth gehoert Better Auth: anmelden, registrieren,
    // abmelden, Sitzung abfragen.
    if ((anfrage.url || '').startsWith('/api/auth')) {
      zugang.behandeln(anfrage, antwort).catch(() => {
        if (!antwort.headersSent) antwort.writeHead(500).end('Fehler');
      });
      return;
    }
    if (anfrage.method === 'GET' && (anfrage.url || '').split('?')[0] === '/api/spiele') {
      antwort.writeHead(200, { 'Content-Type': TYPEN['.json'], 'Cache-Control': 'no-store' }).end(spiele);
      return;
    }
    if (spielManager.behandeln(anfrage, antwort)) return;
    ausliefern(anfrage, antwort);
  });

  raeume.beimSchliessen = (raum) => {
    if (raum.adresse) schutz.raumZu(raum.adresse);
  };

  const wss = new WebSocketServer({
    server,
    maxPayload: NACHRICHT_MAX,
    // Abweisen, bevor der Handshake laeuft - eine abgelehnte Verbindung soll
    // billiger sein als eine angenommene.
    verifyClient: ({ req }, erlauben) => {
      const urteil = schutz.verbindungErlaubt(adresseVon(req, HINTER_PROXY));
      if (urteil.ok) erlauben(true);
      else erlauben(false, 429, urteil.grund);
    },
  });

  wss.on('connection', (draht, anfrage) => {
    let raum = null;
    let spieler = null;
    const adresse = adresseVon(anfrage, HINTER_PROXY);
    // Die Spielverbindung erbt die Anmeldung aus dem bestehenden Cookie -
    // kein zweiter Anmeldeschritt (→ specs konten AC-9).
    //
    // Wichtig: hier wird NICHT gewartet. Die Zuhoerer muessen stehen, bevor
    // die erste Nachricht eintreffen kann - sonst geht sie verloren, und zwar
    // nur auf langsameren Maschinen. Wer die Anmeldung braucht, wartet unten
    // an seiner Stelle auf das Versprechen.
    const sitzungBald = zugang.sitzung(anfrage.headers).catch(() => null);
    const eimer = schutz.eimerFuerVerbindung();
    schutz.verbindungOffen(adresse);

    const fehler = (text) => draht.send(JSON.stringify({ typ: 'fehler', text }));

    // Vier Zeichen sind 614.656 Codes. Bei hundert laufenden Partien trifft
    // jeder 6.150. Versuch - ohne Bremse findet ein Skript in Minuten eine
    // fremde Partie. Wer die Bremse ausloest, fliegt raus.
    // Eroeffnen verlangt ein Konto, Mitspielen nicht.
    async function eroeffnen() {
      const angemeldet = await sitzungBald;
      if (draht.readyState !== 1) return;
      if (raum) return;
      if (!angemeldet) {
        return fehler('Zum Eroeffnen einer Partie ist eine Anmeldung noetig.');
      }
      const erlaubt = schutz.raumErlaubt(adresse);
      if (!erlaubt.ok) return fehler(erlaubt.grund);

      raum = raeume.anlegen();
      raum.adresse = adresse;
      raum.eigentuemer = angemeldet.user.id;
      schutz.raumAuf(adresse);
      // Der Anzeigename kommt aus dem Konto, nicht aus der Nachricht.
      const ergebnis = raum.beitreten(angemeldet.user.name, draht);
      spieler = ergebnis.spieler;
      draht.send(JSON.stringify({
        typ: 'du',
        id: spieler.id,
        token: spieler.token,
        code: raum.code,
        anzeige: codeZeigen(raum.code),
      }));
      raum.senden(raum.vorraum());
    }

    const codeDaneben = () => {
      fehler('Diesen Raumcode gibt es nicht.');
      if (!schutz.fehlversuch(adresse)) draht.close(1008, 'zu viele Fehlversuche');
    };

    draht.on('message', (roh) => {
      // Wer schneller redet, als jede Bedienung es kann, wird getrennt.
      if (!schutz.nachrichtErlaubt(eimer)) {
        draht.close(1008, 'zu viele Nachrichten');
        return;
      }
      let nachricht;
      try {
        nachricht = JSON.parse(roh.toString());
      } catch {
        return fehler('Unverstaendliche Nachricht.');
      }
      if (!nachricht || typeof nachricht.typ !== 'string') return;

      switch (nachricht.typ) {
        case 'erstellen': {
          if (raum) return;
          eroeffnen();
          break;
        }
        case 'beitreten': {
          if (raum) return;
          const gesucht = raeume.finden(nachricht.code);
          if (!gesucht) return codeDaneben();
          const ergebnis = gesucht.beitreten(nachricht.name, draht);
          if (ergebnis.fehler) return fehler(ergebnis.fehler);
          raum = gesucht;
          spieler = ergebnis.spieler;
          draht.send(JSON.stringify({ typ: 'du', id: spieler.id, token: spieler.token, code: raum.code, anzeige: codeZeigen(raum.code) }));
          raum.senden(raum.vorraum());
          break;
        }
        case 'zurueck': {
          if (raum) return;
          const gesucht = raeume.finden(nachricht.code);
          if (!gesucht) return codeDaneben();
          const zurueck = gesucht.zurueckkehren(nachricht.token, draht);
          if (!zurueck) return fehler('Dieser Platz ist nicht mehr da.');
          raum = gesucht;
          spieler = zurueck;
          draht.send(JSON.stringify({ typ: 'du', id: spieler.id, token: spieler.token, code: raum.code, anzeige: codeZeigen(raum.code) }));
          if (raum.gestartet) draht.send(JSON.stringify(raum.welt.aufbau()));
          raum.senden(raum.vorraum());
          break;
        }
        case 'start': {
          if (!raum || !spieler) return;
          // Nur wer den Raum eroeffnet hat, startet die Partie.
          if (raum.spieler[0] !== spieler) return fehler('Nur der Gastgeber startet.');
          const startwert = Number.isInteger(nachricht.startwert)
            ? nachricht.startwert
            : Math.floor(Math.random() * 1e9);
          const ergebnis = raum.starten(startwert);
          if (ergebnis.fehler) return fehler(ergebnis.fehler);
          break;
        }
        case 'befehl': {
          if (!raum || !spieler || !raum.gestartet) return;
          raum.welt.befehl(spieler.id, nachricht.einheiten, nachricht.ziel);
          raum.beruehrt = Date.now();
          break;
        }
        default:
          fehler('Unbekannter Nachrichtentyp.');
      }
    });

    draht.on('close', () => {
      schutz.verbindungZu(adresse);
      if (!raum) return;
      raum.verlassen(draht);
      raum.senden(raum.vorraum());
      if (raum.leer) raeume.schliessen(raum);
    });
  });

  await new Promise((fertig) => server.listen(hafen, fertig));
  console.log(`OnlineGames laeuft auf http://localhost:${hafen}/ (bis zu ${MAX_SPIELER} Spieler je Raum)`);

  return { server, wss, raeume, schutz, zugang, manager: spielManager };
}

if (require.main === module) {
  starten().catch((fehler) => {
    console.error('Start fehlgeschlagen:', fehler.message);
    process.exit(1);
  });
}

module.exports = { starten };
