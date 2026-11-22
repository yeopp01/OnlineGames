// @ts-check
'use strict';

const http = require('node:http');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { WebSocketServer } = require('ws');
const { Raeume, MAX_SPIELER, codeZeigen, plaetzePruefen } = require('./raeume');
const { Schutz, adresseVon } = require('./schutz');
const { konten } = require('./konten');
const { manager } = require('./spiele/manager/netz');
const verzeichnis = require('./spiele/verzeichnis');
const partieEinstellungen = require('./spiele/einstellungen');

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
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8',
};

// Datei -> { groesse, zeit, marke }: die Marke aus dem Inhalt, einmal gerechnet.
const MARKEN = new Map();

function ausliefern(anfrage, antwort) {
  const pfad = decodeURIComponent(new URL(anfrage.url, 'http://x').pathname);
  const datei = path.join(OEFFENTLICH, pfad === '/' ? 'index.html' : pfad);
  // Kein Ausbrechen aus dem oeffentlichen Ordner ueber ../
  if (!datei.startsWith(OEFFENTLICH)) {
    antwort.writeHead(403).end('Verboten');
    return;
  }
  const fehlt = () => antwort.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Nicht gefunden');
  // Jede Datei traegt eine Marke aus ihrem Inhalt (darstellung AC-25): der
  // Browser fragt bei jedem Aufruf nach, und was er schon hat, kommt nicht
  // noch einmal - die Bildtafeln sind ueber 20 MB. Gemerkt wird die Marke,
  // solange Groesse und Zeit der Datei stimmen; dann braucht die Antwort
  // "unveraendert" die Datei nicht zu lesen.
  fs.stat(datei, (fehler, stand) => {
    if (fehler || !stand.isFile()) return fehlt();
    const kennt = anfrage.headers['if-none-match'];
    const gemerkt = MARKEN.get(datei);
    const gilt = gemerkt && gemerkt.groesse === stand.size && gemerkt.zeit === stand.mtimeMs;
    const unveraendert = (marke) => antwort.writeHead(304, { ETag: marke, 'Cache-Control': 'no-cache' }).end();
    if (gilt && kennt === gemerkt.marke) return unveraendert(gemerkt.marke);
    fs.readFile(datei, (lesefehler, inhalt) => {
      if (lesefehler) return fehlt();
      const marke = gilt ? gemerkt.marke : `"${crypto.createHash('sha1').update(inhalt).digest('base64url')}"`;
      MARKEN.set(datei, { groesse: stand.size, zeit: stand.mtimeMs, marke });
      if (kennt === marke) return unveraendert(marke);
      antwort.writeHead(200, {
        'Content-Type': TYPEN[path.extname(datei)] || 'application/octet-stream',
        ETag: marke,
        'Cache-Control': 'no-cache',
      });
      antwort.end(inhalt);
    });
  });
}

// Der Betreiber fragt im Rechner selbst, ohne Proxy dazwischen.
function vomRechnerSelbst(anfrage) {
  const von = anfrage.socket?.remoteAddress || '';
  return ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(von) && !anfrage.headers['x-forwarded-for'];
}

// Was im Betrieb aus der Umgebung kommt (→ specs/20-betrieb): unter welcher
// Adresse der Server von aussen erreichbar ist - daran haengen die erlaubte
// Herkunft der Anmeldung und das Secure-Kennzeichen der Kekse - und wo die
// Konten liegen, ausserhalb des Programmordners (betrieb AC-7).
function kontenAusUmgebung(umgebung = process.env) {
  const konten = {};
  if (umgebung.OEFFENTLICHE_ADRESSE) konten.adresse = umgebung.OEFFENTLICHE_ADRESSE.replace(/\/+$/, '');
  if (umgebung.KONTEN_DATEI) konten.datei = umgebung.KONTEN_DATEI;
  return konten;
}

async function starten(hafen = HAFEN, einstellungen = {}) {
  const raeume = new Raeume();
  // Einmal beim Start gelesen: ein kaputter Steckbrief verhindert den Start,
  // statt spaeter eine leere Uebersicht zu zeigen.
  const spielliste = verzeichnis.lesen();
  const spiele = JSON.stringify({ spiele: spielliste });
  /** @type {Map<string, string>} */
  const nachgeschlagen = new Map();
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
    // Was ein Spiel zum Nachschlagen mitbringt (bedienung AC-81): einmal
    // gerechnet, dann gemerkt - die Daten aendern sich nur mit dem Server.
    const nachschlagen = anfrage.method === 'GET' ? /^\/api\/spiele\/([a-z]+)\/nachschlagen$/.exec((anfrage.url || '').split('?')[0]) : null;
    if (nachschlagen) {
      const spiel = spielliste.find((s) => s.art === nachschlagen[1] && s.nachschlagen);
      if (!spiel) {
        antwort.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Nicht gefunden');
        return;
      }
      if (!nachgeschlagen.has(spiel.art)) nachgeschlagen.set(spiel.art, JSON.stringify(spiel.nachschlagen.daten()));
      antwort.writeHead(200, { 'Content-Type': TYPEN['.json'], 'Cache-Control': 'no-store' }).end(nachgeschlagen.get(spiel.art));
      return;
    }
    // Zahlen fuer den Betreiber (→ specs betrieb AC-8): nur vom Rechner
    // selbst. Was ueber den Proxy kommt, traegt die Adresse des Fragenden im
    // Kopf und bekommt dieselbe Antwort wie jeder unbekannte Pfad.
    if (anfrage.method === 'GET' && (anfrage.url || '').split('?')[0] === '/betrieb/zahlen') {
      if (!vomRechnerSelbst(anfrage)) {
        antwort.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Nicht gefunden');
        return;
      }
      const zahlen = { ...raeume.zahlen(), verbunden: wss.clients.size };
      antwort.writeHead(200, { 'Content-Type': TYPEN['.json'], 'Cache-Control': 'no-store' }).end(JSON.stringify(zahlen));
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
    // Die Zustaende gehen gepackt hinaus (fahrplan AC-20): acht Spieler mit
    // je 200 Einheiten sind im Nebel rund 160 KB je Sekunde und Spieler als
    // JSON, gepackt rund 26 - der Browser entpackt von selbst. Kleine
    // Nachrichten bleiben ungepackt; `maxPayload` gilt fuer das Entpackte.
    perMessageDeflate: { threshold: 1024 },
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
    async function eroeffnen(nachricht) {
      const angemeldet = await sitzungBald;
      if (draht.readyState !== 1) return;
      if (raum) return;
      if (!angemeldet) {
        return fehler('Zum Eröffnen einer Partie ist eine Anmeldung nötig.');
      }
      // Ohne Angabe das Strategiespiel - so haben es aeltere Seiten geschickt.
      const spiel = verzeichnis.eroeffenbar(spielliste, nachricht.art === undefined ? 'strategie' : nachricht.art);
      if (!spiel) return fehler('Dieses Spiel lässt sich nicht eröffnen.');
      const geprueft = partieEinstellungen.pruefen(spiel.einstellungen, nachricht.einstellungen);
      if (geprueft.fehler) return fehler(geprueft.fehler);
      const platz = plaetzePruefen(spiel, geprueft.werte);
      if (platz) return fehler(platz.fehler);

      // Eine verlassene Partie wartet auf die Rueckkehr (raeume AC-17), aber
      // sie sperrt niemanden aus: steht eine Grenze im Weg, weicht zuerst
      // die aelteste verlassene desselben Anschlusses, dann irgendeine.
      let erlaubt = schutz.raumErlaubt(adresse);
      if (!erlaubt.ok && raeume.verlasseneSchliessen((r) => r.adresse === adresse)) erlaubt = schutz.raumErlaubt(adresse);
      if (!erlaubt.ok && raeume.verlasseneSchliessen()) erlaubt = schutz.raumErlaubt(adresse);
      if (!erlaubt.ok) return fehler(erlaubt.grund);

      raum = raeume.anlegen(spiel);
      raum.einstellungen = geprueft.werte;
      raum.einstellungsliste = spiel.einstellungen;
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
        return fehler('Unverständliche Nachricht.');
      }
      if (!nachricht || typeof nachricht.typ !== 'string') return;

      switch (nachricht.typ) {
        case 'erstellen': {
          if (raum) return;
          eroeffnen(nachricht);
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
          const zurueck = gesucht ? gesucht.zurueckkehren(nachricht.token, draht) : null;
          if (!zurueck) {
            // `platzWeg`: der Browser vergisst den gemerkten Platz - sonst
            // kaeme dieselbe Absage bei jedem Neuladen wieder (raeume AC-18).
            draht.send(JSON.stringify({ typ: 'fehler', text: 'Diese Partie gibt es nicht mehr.', platzWeg: true }));
            // Ein falscher Code bleibt ein Fehlversuch, auch auf diesem Weg.
            if (!gesucht && !schutz.fehlversuch(adresse)) draht.close(1008, 'zu viele Fehlversuche');
            return;
          }
          raum = gesucht;
          spieler = zurueck;
          draht.send(JSON.stringify({ typ: 'du', id: spieler.id, token: spieler.token, code: raum.code, anzeige: codeZeigen(raum.code) }));
          // Wer zurueckkommt, bekommt seinen eigenen Aufbau (kampf AC-13).
          if (raum.gestartet) draht.send(JSON.stringify(raum.welt.aufbauFuer ? raum.welt.aufbauFuer(spieler.id) : raum.welt.aufbau()));
          // Wer in eine angehaltene Partie zurueckkommt, sieht, dass sie steht.
          if (raum.pause) draht.send(JSON.stringify(raum.pausenstand()));
          raum.senden(raum.vorraum());
          break;
        }
        case 'start': {
          if (!raum || !spieler) return;
          // Nur wer den Raum eroeffnet hat, startet die Partie.
          if (raum.spieler[0] !== spieler) return fehler('Nur der Gastgeber startet.');
          // Ein eingestellter Startwert gilt; sonst der aus der Nachricht
          // (Tests), sonst zufaellig.
          const eingestellt = raum.einstellungen.startwert;
          const startwert = Number.isInteger(eingestellt)
            ? eingestellt
            : Number.isInteger(nachricht.startwert) ? nachricht.startwert : Math.floor(Math.random() * 1e9);
          const ergebnis = raum.starten(startwert);
          if (ergebnis.fehler) return fehler(ergebnis.fehler);
          break;
        }
        case 'einstellen': {
          if (!raum || !spieler) return;
          const ergebnis = raum.einstellen(spieler, nachricht.einstellungen);
          if (ergebnis.fehler) return fehler(ergebnis.fehler);
          raum.senden(raum.vorraum());
          break;
        }
        case 'platz': {
          // Die Wahl je Platz (spielauswahl AC-22) - was sie bedeutet, weiss
          // nur das Spiel.
          if (!raum || !spieler) return;
          const ergebnis = raum.waehlen(spieler, nachricht.platz, nachricht.wahl);
          if (ergebnis.fehler) return fehler(ergebnis.fehler);
          raum.senden(raum.vorraum());
          break;
        }
        case 'pause':
        case 'weiter': {
          // Anhalten und Fortsetzen (speichern AC-19 bis AC-21) - eine Sache
          // des Raums: das Spiel erfaehrt davon nichts (ADR-0006).
          if (!raum || !spieler || !raum.gestartet) return;
          const ergebnis = nachricht.typ === 'pause' ? raum.anhalten(spieler) : raum.fortsetzen(spieler);
          if (ergebnis.fehler) return fehler(ergebnis.fehler);
          raum.senden(raum.pausenstand());
          break;
        }
        case 'befehl': {
          if (!raum || !spieler || !raum.gestartet) return;
          // Angehalten: Befehle werden verworfen, nicht aufgehoben (AC-19).
          if (raum.pause) return;
          // Was der Befehl bedeutet, weiss nur das Spiel (ADR-0006).
          const ergebnis = raum.welt.nachricht(spieler.id, nachricht);
          raum.beruehrt = Date.now();
          if (ergebnis?.fehler) return fehler(ergebnis.fehler);
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
      // Eine laufende Partie bleibt stehen, auch wenn der letzte geht: wer
      // allein gegen den Computer spielt und neu laedt, kam sonst nie zurueck
      // - der Raum war im selben Augenblick weg (raeume AC-12, AC-17). Ihre
      // Uhr haelt an, bis jemand zurueckkehrt; geschlossen wird sie vom
      // Aufraeumen.
      if (raum.leer && !raum.laeuft) raeume.schliessen(raum);
    });
  });

  await new Promise((fertig) => server.listen(hafen, () => fertig(undefined)));
  console.log(`OnlineGames laeuft auf http://localhost:${hafen}/ (bis zu ${MAX_SPIELER} Spieler je Raum)`);

  return { server, wss, raeume, schutz, zugang, manager: spielManager };
}

if (require.main === module) {
  starten(HAFEN, { konten: kontenAusUmgebung() }).catch((fehler) => {
    console.error('Start fehlgeschlagen:', fehler.message);
    process.exit(1);
  });
}

module.exports = { starten };
