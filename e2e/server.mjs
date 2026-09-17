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
  konten: { datei: ':memory:', geheimnis: randomBytes(32).toString('hex') },
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
    if (befehl === 'zeitraffer') {
      const raum = laufend.raeume.finden(id);
      if (!raum) throw new Error(`Raum ${id} gibt es nicht.`);
      raum.zeitraffer = Math.max(1, Math.min(20, Number(werte.faktor) || 1));
      antwortGriff.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true }));
      return;
    }
    const eintrag = laufend.manager.staende.offen.get(id);
    if (!eintrag) throw new Error(`Spielstand ${id} liegt nicht im Speicher.`);
    if (!GRIFFE[befehl]) throw new Error(`Unbekannter Griff: ${befehl}`);
    const ergebnis = GRIFFE[befehl](eintrag.karriere, werte) || {};
    laufend.manager.staende.schreiben(eintrag.konto, id, eintrag.karriere);
    antwortGriff.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ok: true, ...ergebnis }));
  } catch (fehler) {
    antwortGriff.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ fehler: fehler.message }));
  }
});
griffe.listen(hafen + 1);

const beenden = () => {
  griffe.close();
  laufend.server.closeAllConnections?.();
  laufend.server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000).unref();
};
process.on('SIGTERM', beenden);
process.on('SIGINT', beenden);
