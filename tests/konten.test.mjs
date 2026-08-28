// Konten, Sitzungen und Einladungscodes - ueber den echten Anfrageweg:
// HTTP fuer die Anmeldung, WebSocket fuer das Spiel.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { kunde, istTyp, konto, anmelden, beenden } from './hilfe.mjs';

const require = createRequire(import.meta.url);
const { starten } = require('../server/index.js');

const HAFEN = 4196;
const HERKUNFT = { 'Content-Type': 'application/json', Origin: `http://localhost:${HAFEN}` };
let laufend;

before(async () => {
  laufend = await starten(HAFEN, {
    schutz: { verbindungenJeAdresse: 200, verbindungenJeMinute: 500, raeumeJeAdresse: 100 },
    konten: {
      datei: ':memory:',
      geheimnis: 'q'.repeat(48),
      // Die Bremse gegen Rateversuche hat einen eigenen Test mit eigenen
      // Werten - hier wuerde sie nur die uebrigen Faelle stoeren.
      mehr: { rateLimit: { enabled: false } },
    },
  });
});

after(() => beenden(laufend));

test('konten AC-2 / konten AC-18: Registrieren mit Mail, Kennwort und gueltigem Einladungscode', async () => {
  const ohne = await konto(HAFEN, laufend, { einladung: '' });
  assert.equal(ohne.status, 403);
  assert.match(ohne.koerper.message, /Einladungscode/);

  const falsch = await konto(HAFEN, laufend, { einladung: 'XXXXXXXX' });
  assert.equal(falsch.status, 403);

  const richtig = await konto(HAFEN, laufend);
  assert.equal(richtig.status, 200);
  assert.ok(richtig.kekse.includes('session_token'));
});

test('konten AC-19: ein Einladungscode gilt genau einmal', async () => {
  const code = laufend.zugang.einladungen.anlegen('einmalig');
  const erste = await konto(HAFEN, laufend, { einladung: code, email: 'eins@example.test' });
  assert.equal(erste.status, 200);

  const zweite = await konto(HAFEN, laufend, { einladung: code, email: 'zwei@example.test' });
  assert.equal(zweite.status, 403, 'derselbe Code darf kein zweites Konto anlegen');
});

test('konten AC-19: ein abgelaufener Einladungscode wird abgewiesen', () => {
  const { Einladungen } = require('../server/konten.js');
  let jetzt = 0;
  const einladungen = new Einladungen(laufend.zugang.db, () => jetzt);
  const code = einladungen.anlegen('laeuft ab', 14);

  jetzt = 13 * 24 * 60 * 60 * 1000;
  assert.equal(einladungen.pruefen(code), null, 'nach 13 Tagen noch gueltig');

  jetzt = 15 * 24 * 60 * 60 * 1000;
  assert.ok(einladungen.pruefen(code), 'nach 15 Tagen abgelaufen');
});

test('konten AC-3: Kennwoerter liegen nie im Klartext', async () => {
  const kennwort = 'sehrGeheimesKennwort';
  const angelegt = await konto(HAFEN, laufend, { email: 'klartext@example.test', kennwort });
  assert.equal(angelegt.status, 200);

  // Jede Spalte jeder Tabelle nach dem Kennwort durchsuchen.
  const tabellen = laufend.zugang.db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  for (const { name } of tabellen) {
    for (const zeile of laufend.zugang.db.prepare(`SELECT * FROM "${name}"`).all()) {
      for (const [spalte, wert] of Object.entries(zeile)) {
        assert.equal(
          String(wert ?? '').includes(kennwort), false,
          `${name}.${spalte} enthaelt das Kennwort im Klartext`,
        );
      }
    }
  }
});

test('konten AC-16: eine Partie eroeffnet nur, wer angemeldet ist', async () => {
  const fremder = kunde(HAFEN);
  await fremder.offen();
  fremder.senden({ typ: 'erstellen', name: 'Fremd' });
  const abgelehnt = await fremder.warteAuf(istTyp('fehler'));
  assert.match(abgelehnt.text, /Anmeldung/);
  assert.equal(fremder.eingang.some((n) => n.typ === 'du'), false);
  fremder.zu();
});

test('konten AC-9 / konten AC-17: die Spielverbindung erbt die Anmeldung, der Name kommt aus dem Konto', async () => {
  const angelegt = await konto(HAFEN, laufend, { name: 'Gastgeberin', email: 'wirt@example.test' });
  const wirt = kunde(HAFEN, angelegt.kekse);
  await wirt.offen();

  // Kein zweiter Anmeldeschritt, und der mitgeschickte Name wird ignoriert.
  wirt.senden({ typ: 'erstellen', name: 'Erfundener Name' });
  const du = await wirt.warteAuf(istTyp('du'));
  assert.ok(du.code);

  const raum = await wirt.warteAuf(istTyp('raum'));
  assert.equal(raum.spieler[0].name, 'Gastgeberin');
  wirt.zu();
});

test('konten AC-9: eine langsame Sitzungspruefung verschluckt keine Nachricht', async () => {
  // Genau der Fehler, der nur auf einer langsameren Maschine auftrat: die
  // Zuhoerer der Verbindung standen erst nach der Sitzungspruefung, und die
  // erste Nachricht war da schon vorbei.
  const echt = laufend.zugang.sitzung;
  laufend.zugang.sitzung = async (kopf) => {
    await new Promise((fertig) => setTimeout(fertig, 300));
    return echt(kopf);
  };
  try {
    const angelegt = await konto(HAFEN, laufend, { name: 'Traege', email: 'traege@example.test' });
    const wirt = kunde(HAFEN, angelegt.kekse);
    await wirt.offen();
    // Sofort, ohne dem Server Zeit zu lassen.
    wirt.senden({ typ: 'erstellen' });
    const du = await wirt.warteAuf(istTyp('du'), 3000);
    assert.ok(du.code, 'die Partie entsteht trotzdem');
    wirt.zu();
  } finally {
    laufend.zugang.sitzung = echt;
  }
});

test('konten AC-1: beitreten geht ohne Konto', async () => {
  const angelegt = await konto(HAFEN, laufend, { name: 'Wirtin', email: 'wirtin@example.test' });
  const wirt = kunde(HAFEN, angelegt.kekse);
  await wirt.offen();
  wirt.senden({ typ: 'erstellen' });
  const du = await wirt.warteAuf(istTyp('du'));

  const gast = kunde(HAFEN); // ohne jedes Konto
  await gast.offen();
  gast.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  const raum = await gast.warteAuf((n) => n.typ === 'raum' && n.spieler.length === 2);
  assert.deepEqual(raum.spieler.map((s) => s.name), ['Wirtin', 'Bert']);

  wirt.zu();
  gast.zu();
});

test('konten AC-7 / konten AC-8: die Sitzung ueberlebt, und ihr Keks ist abgesichert', async () => {
  const angelegt = await konto(HAFEN, laufend, { email: 'sitzung@example.test' });
  const antwort = await fetch(`http://localhost:${HAFEN}/api/auth/get-session`, {
    headers: { cookie: angelegt.kekse, Origin: `http://localhost:${HAFEN}` },
  });
  const sitzung = await antwort.json();
  assert.equal(sitzung.user.email, 'sitzung@example.test');

  // Der rohe Set-Cookie-Kopf aus der Registrierung.
  const roh = await fetch(`http://localhost:${HAFEN}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: HERKUNFT,
    body: JSON.stringify({ email: 'sitzung@example.test', password: 'einLangesKennwort' }),
  });
  const keks = roh.headers.getSetCookie().find((k) => k.includes('session_token'));
  assert.match(keks, /HttpOnly/i, 'kein Zugriff aus JavaScript');
  assert.match(keks, /SameSite=Lax/i);
});

test('konten AC-10: Abmelden macht die Sitzung serverseitig ungueltig', async () => {
  const angelegt = await konto(HAFEN, laufend, { email: 'abmelden@example.test' });

  await fetch(`http://localhost:${HAFEN}/api/auth/sign-out`, {
    method: 'POST',
    headers: { ...HERKUNFT, cookie: angelegt.kekse },
    body: '{}',
  });

  // Derselbe Keks - er darf jetzt nichts mehr wert sein, auch nicht am Spiel.
  const danach = kunde(HAFEN, angelegt.kekse);
  await danach.offen();
  danach.senden({ typ: 'erstellen' });
  const abgelehnt = await danach.warteAuf(istTyp('fehler'));
  assert.match(abgelehnt.text, /Anmeldung/);
  danach.zu();
});

test('konten AC-12: unbekannte Mailadresse und falsches Kennwort ergeben dieselbe Antwort', async () => {
  await konto(HAFEN, laufend, { email: 'echt@example.test', kennwort: 'einLangesKennwort' });

  const unbekannt = await anmelden(HAFEN, { email: 'gibtesnicht@example.test', kennwort: 'einLangesKennwort' });
  const falsch = await anmelden(HAFEN, { email: 'echt@example.test', kennwort: 'einAnderesKennwort' });

  assert.equal(unbekannt.status, falsch.status, 'derselbe Statuscode');
  assert.equal(unbekannt.ok, false);
  assert.equal(falsch.ok, false);
});

test('konten AC-11: zu viele Anmeldeversuche werden gebremst', async (t) => {
  // Eigener Server mit winzigen Werten, damit die Bremse im Test ausloest
  // statt erst nach einer Stunde.
  const hafen = 4195;
  const eigener = await starten(hafen, {
    schutz: { verbindungenJeAdresse: 50, verbindungenJeMinute: 200 },
    konten: {
      datei: ':memory:',
      geheimnis: 'r'.repeat(48),
      mehr: {
        rateLimit: {
          enabled: true,
          window: 60,
          max: 100,
          customRules: { '/sign-in/email': { window: 60 * 60, max: 2 } },
        },
      },
    },
  });
  t.after(() => beenden(eigener));

  await konto(hafen, eigener, { email: 'bremse@example.test' });

  const stati = [];
  for (let i = 0; i < 4; i++) {
    const versuch = await anmelden(hafen, {
      email: 'bremse@example.test',
      kennwort: 'falschesKennwort',
    });
    stati.push(versuch.status);
  }

  assert.equal(stati.includes(429), true, `nach zwei Versuchen wird gebremst, war ${stati}`);
  assert.equal(stati.at(-1), 429, 'und es bleibt dabei');
});

test('konten AC-13: zwei Konten duerfen denselben Anzeigenamen fuehren', async () => {
  const eine = await konto(HAFEN, laufend, { name: 'Anna', email: 'anna-eins@example.test' });
  const andere = await konto(HAFEN, laufend, { name: 'Anna', email: 'anna-zwei@example.test' });
  assert.equal(eine.status, 200);
  assert.equal(andere.status, 200, 'derselbe Name ist kein Hinderungsgrund');
  assert.notEqual(eine.koerper.user.id, andere.koerper.user.id);
});
