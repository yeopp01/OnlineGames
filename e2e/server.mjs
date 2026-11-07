// Der Server fuer den Browserlauf. Derselbe `starten()`-Aufruf wie in den
// Tests unter tests/ - Konten im Arbeitsspeicher, Grenzen weit, weil alle
// Browserfenster von derselben Adresse kommen und die Grenzen ihre eigenen
// Tests haben (tests/schutz.test.mjs).
import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { KONTO } from './helpers/konto.mjs';

const require = createRequire(import.meta.url);
const { starten } = require('../server/index.js');
const { Ki } = require('../server/spiele/strategie/ki.js');

const hafen = Number(process.env.E2E_HAFEN) || 4191;

const laufend = await starten(hafen, {
  schutz: {
    verbindungenJeAdresse: 200,
    verbindungenJeMinute: 2000,
    raeumeGesamt: 200,
    raeumeJeAdresse: 100,
    rechnungenJeMinute: 1000,
    zuegeJeMinute: 20000,
  },
  konten: {
    datei: ':memory:',
    geheimnis: randomBytes(32).toString('hex'),
    // Wie bei `schutz`: alle Tests kommen von einer Adresse, und Better Auth
    // faellt ohne weitergereichte Adresse auf einen gemeinsamen Eimer je Pfad
    // zurueck. Mit den echten Werten (30 je Minute) riss der Lauf, sobald er
    // laenger wurde - Runde 58. Dass die Grenze greift, pruefen
    // tests/konten.test.mjs und tests/schutz.test.mjs mit den echten Werten.
    mehr: { rateLimit: { enabled: true, window: 60, max: 5000, customRules: {} } },
  },
});

// Ein Konto zum Anmelden. Genau der Weg, den auch der Browser geht:
// Einladungscode, Registrieren - nur ohne Formular.
const einladung = laufend.zugang.einladungen.anlegen('Browserlauf');
const antwort = await fetch(`http://localhost:${hafen}/api/auth/sign-up/email`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: `http://localhost:${hafen}` },
  body: JSON.stringify({ email: KONTO.email, password: KONTO.kennwort, name: KONTO.name, einladung }),
});
if (!antwort.ok) {
  console.error(`Konto fuer den Browserlauf nicht angelegt: HTTP ${antwort.status} ${await antwort.text()}`);
  process.exit(1);
}

// Pruefgriffe: Zustaende, die ueber die Oberflaeche nur mit Glueck oder nach
// Stunden entstehen - ein Verletzter, ein Vorstand ohne Geduld. Sie aendern
// einen offenen Spielstand direkt und schreiben ihn zurueck. Es gibt sie nur
// in diesem Testserver, auf einem eigenen Hafen; der Spielserver kennt sie nicht.
const GRIFFE = {
  vertrauen: (k, { wert }) => { k.vorstand.vertrauen = wert; },
  konto: (k, { wert }) => { k.verein.konto = wert; },
  // Ein Feldspieler mit dem laengsten Vertrag wird so alt, dass er sicher aufhoert.
  altern: (k, { alter = 35 }) => {
    const spieler = k.verein.spieler
      .filter((s) => s.position !== 'TOR' && !(k.verein.aufstellung?.ids || []).includes(s.id))
      .sort((a, b) => (b.vertrag?.bis ?? 0) - (a.vertrag?.bis ?? 0))[0];
    spieler.alter = alter;
    return { spieler: spieler.name };
  },
  verletzen: (k, { position = 'MIT', wochen = 3 }) => {
    const spieler = k.verein.spieler
      .filter((s) => s.position === position && !(k.verein.aufstellung?.ids || []).includes(s.id))
      .sort((a, b) => b.staerke - a.staerke)[0];
    spieler.verletzt = wochen;
    return { spieler: spieler.name };
  },
};

const griffe = http.createServer(async (anfrage, antwortGriff) => {
  let roh = '';
  for await (const stueck of anfrage) roh += stueck;
  try {
    const { id, befehl, werte = {} } = JSON.parse(roh || '{}');
    // Der Zeitraffer gilt einem Raum, nicht einem Spielstand: eine Minute
    // Sammeln soll im Browserlauf keine Minute kosten.
    // Rohstoffe eines Spielers setzen, fuer Zustaende wie "zu wenig Holz".
    if (befehl === 'rohstoffe') {
      const raum = laufend.raeume.finden(id);
      const spieler = raum?.welt?.spieler.find((s) => s.name === werte.name);
      if (!spieler) throw new Error(`Spieler ${werte.name} gibt es in Raum ${id} nicht.`);
      for (const r of ['holz', 'nahrung', 'gold', 'stein']) if (Number.isInteger(werte[r])) spieler[r] = werte[r];
      antwortGriff.writeHead(200, { 'Content-Type': 'application/json', Connection: 'close' }).end(JSON.stringify({ ok: true }));
      return;
    }
    // Ein fertiges Gebaeude aufstellen, fuer Bilder mit vielen Gebaeuden - nur
    // wo die Spielregel einen Bauplatz erlaubt (bauen AC-3).
    if (befehl === 'gebaeude') {
      const raum = laufend.raeume.finden(id);
      const welt = raum?.welt;
      const spieler = welt?.spieler.find((s) => s.name === werte.name);
      if (!spieler) throw new Error(`Spieler ${werte.name} gibt es in Raum ${id} nicht.`);
      if (!welt.platzPruefen(werte.art, werte.x, werte.y)) throw new Error(`Kein Platz fuer ${werte.art} auf ${werte.x}, ${werte.y}.`);
      const gebaeude = welt.gebaeudeAnlegen(spieler.id, werte.art, werte.x, werte.y, true);
      antwortGriff.writeHead(200, { 'Content-Type': 'application/json', Connection: 'close' }).end(JSON.stringify({ ok: true, id: gebaeude.id }));
      return;
    }
    // Die Wirtschafts-KI spielt fuer einen Spieler im Raum - fuer Bilder einer
    // gewachsenen Partie (Rueckschau zum Ende einer Stufe). Sie schickt ihre
    // Befehle wie sonst ueber welt.nachricht.
    if (befehl === 'ki') {
      const welt = laufend.raeume.finden(id)?.welt;
      const spieler = welt?.spieler.find((s) => s.name === werte.name);
      if (!spieler) throw new Error(`Spieler ${werte.name} gibt es in Raum ${id} nicht.`);
      if (!welt.kis) {
        welt.kis = [];
        const takten = welt.takten.bind(welt);
        welt.takten = () => {
          for (const ki of welt.kis) ki.takt();
          takten();
        };
      }
      welt.kis.push(new Ki(welt, spieler.id));
      antwortGriff.writeHead(200, { 'Content-Type': 'application/json', Connection: 'close' }).end(JSON.stringify({ ok: true }));
      return;
    }
    // Viele Einheiten fuer einen Spieler, ringweise um einen Punkt auf freiem
    // Gras - fuer Messungen mit vollem Bild (darstellung AC-10).
    //
    // **Die Suche faengt beim Ring r = 1 an, nicht in der Mitte.** Eine
    // einzelne Einheit landet also nicht an (x, y), sondern einen Schritt
    // schraeg daneben; wer genau dort sucht, findet nichts (Runde 76, ein
    // Browserlauf). Richtig ist, mit anderthalb Feldern Spielraum zu suchen -
    // nicht, hier r = 0 zu setzen: das wurde in der Rueckschau nach Runde 78
    // versucht und wieder zurueckgenommen. Es rueckte in acht Bildern die
    // Einheiten um ein Feld zusammen, und weil Figuren noch uebereinander
    // stehen duerfen (einheiten AC-29 ist offen), verdeckten sie einander -
    // in `kampf AC-1` standen statt drei blauen Milizen zwei rote
    // uebereinander, und die Bildunterschrift stimmte nicht mehr.
    if (befehl === 'einheiten') {
      const welt = laufend.raeume.finden(id)?.welt;
      const spieler = welt?.spieler.find((s) => s.name === werte.name);
      if (!spieler) throw new Error(`Spieler ${werte.name} gibt es in Raum ${id} nicht.`);
      const um = { x: werte.x ?? spieler.basis.x, y: werte.y ?? spieler.basis.y };
      const belegt = new Set([...welt.einheiten.values()].map((e) => `${Math.round(e.x)},${Math.round(e.y)}`));
      let angelegt = 0;
      for (let r = 1; angelegt < werte.anzahl && r < 40; r++) {
        for (let dy = -r; dy <= r && angelegt < werte.anzahl; dy++) {
          for (let dx = -r; dx <= r && angelegt < werte.anzahl; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const x = um.x + dx;
            const y = um.y + dy;
            if (belegt.has(`${x},${y}`) || welt.karte.felder[y * welt.karte.groesse + x] !== 0 || welt.gebaeudeAn(x, y)) continue;
            welt.einheitAnlegen(spieler.id, x, y, werte.art || 'dorfbewohner');
            belegt.add(`${x},${y}`);
            angelegt += 1;
          }
        }
      }
      antwortGriff.writeHead(200, { 'Content-Type': 'application/json', Connection: 'close' }).end(JSON.stringify({ ok: true, angelegt }));
      return;
    }
    // Leben einer Einheit oder eines Gebaeudes setzen, fuer beschaedigte
    // Zustaende, solange es keinen Kampf gibt (darstellung AC-8).
    if (befehl === 'leben') {
      const welt = laufend.raeume.finden(id)?.welt;
      const ziel = welt?.einheiten.get(werte.id) || welt?.gebaeude.get(werte.id);
      if (!ziel) throw new Error(`Nichts mit der Nummer ${werte.id} in Raum ${id}.`);
      ziel.leben = Math.max(1, Math.round(Number(werte.leben)));
      if (welt.gebaeude.get(werte.id) === ziel) welt.gebaeudeGeaendert(ziel);
      antwortGriff.writeHead(200, { 'Content-Type': 'application/json', Connection: 'close' }).end(JSON.stringify({ ok: true }));
      return;
    }
    if (befehl === 'zeitraffer') {
      const raum = laufend.raeume.finden(id);
      if (!raum) throw new Error(`Raum ${id} gibt es nicht.`);
      // 0 haelt die Welt an: der Zustand geht weiter zum Browser, aber nichts
      // bewegt sich. Damit laesst sich ein Augenblick festhalten, der im Spiel
      // nur zwei Sekunden dauert - ein Gefallener etwa (kampf AC-10).
      const faktor = Number(werte.faktor);
      raum.zeitraffer = Math.max(0, Math.min(20, Number.isFinite(faktor) ? faktor : 1));
      antwortGriff.writeHead(200, { 'Content-Type': 'application/json', Connection: 'close' }).end(JSON.stringify({ ok: true }));
      return;
    }
    const eintrag = laufend.manager.staende.offen.get(id);
    if (!eintrag) throw new Error(`Spielstand ${id} liegt nicht im Speicher.`);
    if (!GRIFFE[befehl]) throw new Error(`Unbekannter Griff: ${befehl}`);
    const ergebnis = GRIFFE[befehl](eintrag.karriere, werte) || {};
    laufend.manager.staende.schreiben(eintrag.konto, id, eintrag.karriere);
    antwortGriff.writeHead(200, { 'Content-Type': 'application/json', Connection: 'close' }).end(JSON.stringify({ ok: true, ...ergebnis }));
  } catch (fehler) {
    antwortGriff.writeHead(400, { 'Content-Type': 'application/json', Connection: 'close' }).end(JSON.stringify({ fehler: fehler.message }));
  }
});
// Jede Antwort schliesst ihre Verbindung: eine wiederverwendete, die der Server
// nach seiner Wartezeit schon zugemacht hat, endete sonst in ECONNRESET (Runde 22).
griffe.listen(hafen + 1);

const beenden = () => {
  griffe.close();
  laufend.server.closeAllConnections?.();
  laufend.server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000).unref();
};
process.on('SIGTERM', beenden);
process.on('SIGINT', beenden);
