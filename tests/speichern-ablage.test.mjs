// Die Ablage der Partiestaende (speichern AC-3, AC-4, AC-6, AC-12, AC-13,
// ADR-0017 Punkt 2 und 3).
//
// Zwei Teile. Vorn der Raum mit einem erfundenen Spiel und der Uhr von Hand:
// wann gesichert wird, ist eine Frage der Wanduhr, und echte Zeitgeber
// schwanken unter Windows um 15 ms und mehr. Hinten der echte Weg (ADR-0004):
// Server, WebSocket, Anmeldung, das Strategiespiel, die Ablage in SQLite und
// der Anfrageweg `/api/partien`.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { kunde as kundeMit, istTyp, konto, anmelden, beenden } from './hilfe.mjs';

const require = createRequire(import.meta.url);
const { Raeume } = require('../server/raeume.js');
const { Partiestaende, JE_KONTO } = require('../server/partiestaende.js');
const { starten } = require('../server/index.js');

const HAFEN = 4189;

// ---- Der Raum mit einem erfundenen Spiel ------------------------------------

function draht() {
  const eingang = [];
  return { readyState: 1, eingang, send: (text) => eingang.push(JSON.parse(text)), close() {} };
}

// Die Uhr in Schritten von 100 ms vorstellen: mit einem grossen Schritt kaeme
// jeder Schlag mit derselben Wanduhr an, und der Raum holt hoechstens eine
// Sekunde nach.
function laufen(t, ms) {
  for (let i = 0; i < ms; i += 100) t.mock.timers.tick(Math.min(100, ms - i));
}

// Ein Spiel, dessen Stand die Zahl seiner Takte ist.
function zaehlspiel({ kaputt = () => false } = {}) {
  return {
    art: 'zaehler',
    takte: 10,
    standFassung: 3,
    erzeugen() {
      return {
        takt: 0,
        vorbei: false,
        aufbau: () => ({ typ: 'aufbau' }),
        takten() { this.takt += 1; },
        zustand() { return { typ: 'zustand', t: this.takt }; },
        sichern() { return kaputt(this.takt) ? Buffer.from('kaputt') : Buffer.from(JSON.stringify({ takt: this.takt })); },
      };
    },
    laden(bytes) {
      const wert = JSON.parse(Buffer.from(bytes).toString('utf8'));
      if (!Number.isInteger(wert.takt)) throw new Error('kein Stand');
      return wert;
    },
  };
}

function aufgestellt(t, spiel = zaehlspiel()) {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'] });
  const db = new DatabaseSync(':memory:');
  const ablage = new Partiestaende(db);
  const raeume = new Raeume();
  raeume.ablage = ablage;
  const raum = raeume.anlegen(spiel);
  raum.eigentuemer = 'konto-anna';
  const anna = draht();
  raum.beitreten('Anna', anna);
  raum.beitreten('Bert', draht());
  assert.deepEqual(raum.starten(7), {});
  t.after(() => { raeume.halt(); db.close(); });
  const stand = () => ablage.oeffnen('konto-anna', raum.standId, (b) => zaehlspiel().laden(b));
  return { ablage, raeume, raum, anna, stand, db };
}

test('speichern AC-3: eine laufende Partie wird von selbst jede Minute abgelegt - ein Absturz kostet hoechstens eine Minute', (t) => {
  const { ablage, raum, stand } = aufgestellt(t);
  laufen(t, 59_000);
  assert.equal(raum.standId, null, 'vor der ersten Minute liegt nichts');
  assert.equal(ablage.liste('konto-anna').length, 0);

  laufen(t, 1000);
  assert.ok(raum.standId, 'nach einer Minute liegt der Stand');
  const erster = stand().geladen.takt;
  assert.equal(erster, 600, 'eine Minute sind 600 Takte');

  laufen(t, 60_000);
  const zweiter = stand();
  assert.equal(zweiter.geladen.takt, 1200, 'eine Minute spaeter der neue Stand');
  assert.equal(ablage.liste('konto-anna').length, 1, 'eine Partie hat einen Stand, nicht je Minute einen (ADR-0017 Punkt 1)');
  // Der Abstand ist die Wanduhr, nicht eine Zahl von Schlaegen: zu keinem
  // Zeitpunkt liegt der Stand mehr als eine Minute zurueck.
  for (let i = 0; i < 30; i++) {
    laufen(t, 7_000);
    assert.ok(raum.welt.takt - stand().geladen.takt <= 600, `Sekunde ${i * 7}: hoechstens eine Minute zurueck`);
  }
  const [zeile] = ablage.liste('konto-anna');
  assert.equal(zeile.art, 'zaehler');
  assert.equal(zeile.fassung, 3, 'die Fassung nennt der Steckbrief');
  assert.deepEqual(zeile.beteiligte.map((b) => b.name), ['Anna', 'Bert']);
});

test('speichern AC-3: eine entschiedene Partie nimmt ihren Stand mit, die Revanche bekommt einen neuen', (t) => {
  const { ablage, raum } = aufgestellt(t);
  laufen(t, 60_000);
  const alt = raum.standId;
  assert.ok(alt);
  raum.welt.vorbei = true;
  laufen(t, 100);
  assert.equal(ablage.liste('konto-anna').length, 0, 'beendet: kein Stand mehr (ADR-0017 Punkt 3)');
  assert.deepEqual(raum.starten(8), {});
  laufen(t, 60_000);
  assert.ok(raum.standId && raum.standId !== alt, 'die Revanche ist eine eigene Partie');
  assert.equal(ablage.liste('konto-anna').length, 1);
});

test('speichern AC-4: gesichert wird auch beim Anhalten und wenn der letzte Mensch geht', (t) => {
  const { raum, stand, anna } = aufgestellt(t);
  laufen(t, 5_000);
  assert.equal(raum.standId, null);
  assert.deepEqual(raum.anhalten({ id: raum.spieler[0].id, name: 'Anna' }), {});
  assert.equal(stand().geladen.takt, 50, 'beim Anhalten sofort, nicht erst zur vollen Minute');
  raum.fortsetzen();
  laufen(t, 3_000);

  raum.verlassen(anna);
  assert.equal(stand().geladen.takt, 50, 'Bert sitzt noch am Tisch - noch kein Anlass');
  raum.verlassen(raum.spieler[1].draht);
  assert.equal(stand().geladen.takt, 80, 'der letzte geht: gesichert, bevor die Uhr steht');
});

test('speichern AC-4: beim Herunterfahren sichern alle Raeume ihre laufende Partie', (t) => {
  const { raeume, raum, stand } = aufgestellt(t);
  const zweiter = raeume.anlegen(zaehlspiel());
  zweiter.beitreten('Cem', draht());
  zweiter.beitreten('Dora', draht());
  zweiter.starten(9); // ohne Eigentuemer: niemand, dem ein Stand gehoerte
  laufen(t, 12_300);
  assert.equal(raeume.allesSichern(), 1, 'eine Partie gesichert - die ohne Konto nicht');
  assert.equal(stand().geladen.takt, 123);
  assert.equal(zweiter.standId, null);
});

test('speichern AC-6: ein Stand, der sich nicht laden laesst, ersetzt den vorigen nicht', (t) => {
  // Ab Takt 900 schreibt das Spiel Unsinn: der Raum probt jeden neuen Stand
  // mit `laden`, bevor er ihn ablegt.
  const { raum, stand } = aufgestellt(t, zaehlspiel({ kaputt: (takt) => takt >= 900 }));
  const warnungen = t.mock.method(console, 'warn', () => {});
  laufen(t, 60_000);
  assert.equal(stand().geladen.takt, 600);
  laufen(t, 60_000);
  assert.equal(stand().geladen.takt, 600, 'der kaputte Stand ist nicht abgelegt, der vorige steht');
  assert.equal(stand().vorher, false);
  assert.equal(warnungen.mock.callCount(), 1, 'gesagt wird es im Protokoll - einmal, nicht je Takt');
  assert.ok(raum.laeuft, 'die Partie laeuft weiter');
});

test('speichern AC-6: ist der neueste Stand kaputt, oeffnet sich der vorige - mindestens einer wird zurueckgehalten', (t) => {
  const { db, raum, stand } = aufgestellt(t);
  laufen(t, 60_000);
  laufen(t, 60_000);
  assert.equal(stand().geladen.takt, 1200);
  // Kaputt auf der Platte, nach dem Schreiben - ein abgerissener Schreibvorgang.
  db.prepare('UPDATE partiestand SET wert = ? WHERE id = ?').run(Buffer.from('{"tak'), raum.standId);
  const offen = stand();
  assert.equal(offen.vorher, true, 'der vorige Stand ist noch da');
  assert.equal(offen.geladen.takt, 600);
  assert.match(offen.fehler, /JSON|Unexpected|unterminated/i, 'und warum der neueste nicht ging');
  // Ist auch der vorige kaputt, sagt das der Satz - geladen wird nichts.
  db.prepare('UPDATE partiestand SET vorher = ? WHERE id = ?').run(Buffer.from('x'), raum.standId);
  const nichts = stand();
  assert.ok(!('geladen' in nichts));
  assert.ok(nichts.fehler);
});

test('speichern AC-12: hoechstens fuenf Staende je Konto - eine sechste Partie wird nicht abgelegt, die fuenf bleiben', (t) => {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'] });
  const db = new DatabaseSync(':memory:');
  const ablage = new Partiestaende(db);
  const raeume = new Raeume();
  raeume.ablage = ablage;
  t.after(() => { raeume.halt(); db.close(); });
  const raumListe = [];
  for (let i = 0; i <= JE_KONTO; i++) {
    const raum = raeume.anlegen(zaehlspiel());
    raum.eigentuemer = 'konto-anna';
    raum.beitreten('Anna', draht());
    raum.beitreten('Bert', draht());
    raum.starten(i);
    raumListe.push(raum);
  }
  laufen(t, 60_000);
  assert.equal(ablage.liste('konto-anna').length, JE_KONTO);
  assert.equal(raumListe.filter((r) => r.standId).length, JE_KONTO);
  assert.equal(raumListe.at(-1).standId, null, 'die sechste hat keinen Stand');
  assert.deepEqual(ablage.ablegen('konto-anna', Buffer.from('{}'), { art: 'zaehler' }).fehler,
    'Mehr als 5 Spielstände je Konto gehen nicht. Lösche einen alten.');
});

// ---- Der echte Weg -----------------------------------------------------------

let ordner;
let laufend;

before(async () => {
  ordner = mkdtempSync(join(tmpdir(), 'partiestaende-'));
});

after(() => {
  if (laufend) beenden(laufend);
  rmSync(ordner, { recursive: true, force: true });
});

const EINSTELLUNGEN = (datei) => ({
  schutz: { verbindungenJeAdresse: 200, verbindungenJeMinute: 500, raeumeGesamt: 200, raeumeJeAdresse: 100 },
  konten: { datei, geheimnis: 'p'.repeat(48) },
});

async function api(pfad, kekse, { methode = 'GET', koerper } = {}) {
  const antwort = await fetch(`http://localhost:${HAFEN}${pfad}`, {
    method: methode,
    headers: { ...(kekse ? { Cookie: kekse } : {}), ...(koerper ? { 'Content-Type': 'application/json' } : {}) },
    body: koerper ? JSON.stringify(koerper) : undefined,
  });
  return { status: antwort.status, koerper: await antwort.json() };
}

// Allein gegen die KI, aufgedeckt, eine Weile gelaufen.
async function partieAllein(kekse) {
  const wer = kundeMit(HAFEN, kekse);
  await wer.offen();
  wer.senden({ typ: 'erstellen', name: 'egal', einstellungen: { ki: 1, sicht: 'aufgedeckt' } });
  const du = await wer.warteAuf(istTyp('du'));
  wer.senden({ typ: 'start', startwert: 7 });
  await wer.warteAuf((n) => n.typ === 'zustand' && n.t >= 2);
  return { wer, du, raum: laufend.raeume.finden(du.code) };
}

test('speichern AC-12 / speichern AC-13 / speichern AC-4: am Konto des Eroeffnenden, nur fuer ihn sichtbar und zu oeffnen, und ein Neustart kostet nichts', async () => {
  const datei = join(ordner, 'konten.db');
  laufend = await starten(HAFEN, EINSTELLUNGEN(datei));
  const anna = await konto(HAFEN, laufend, { name: 'Anna' });
  const bert = await konto(HAFEN, laufend, { name: 'Bert' });

  // Ohne Anmeldung gibt es keine Liste.
  assert.equal((await api('/api/partien')).status, 401);

  const { wer, raum } = await partieAllein(anna.kekse);
  raum.zeitraffer = 20;
  await wer.warteAuf((n) => n.typ === 'zustand' && n.t >= 200);
  // Anhalten sichert (AC-4) - ueber die Leitung, wie im Browser.
  wer.senden({ typ: 'pause' });
  await wer.warteAuf((n) => n.typ === 'pause' && n.name);
  const takt = raum.welt.takt;

  const listeAnna = await api('/api/partien', anna.kekse);
  assert.equal(listeAnna.status, 200);
  assert.equal(listeAnna.koerper.partien.length, 1, 'Annas Partie liegt an Annas Konto');
  const [partie] = listeAnna.koerper.partien;
  assert.equal(partie.art, 'strategie');
  assert.equal(partie.fassung, require('../server/spiele/strategie/stand.js').FASSUNG);
  assert.deepEqual(partie.beteiligte.map((b) => b.mensch), [true, false]);
  assert.ok(!('wert' in partie), 'die Liste traegt keine Bytes');
  assert.deepEqual((await api('/api/partien', bert.kekse)).koerper.partien, [], 'Bert sieht sie nicht');

  // Oeffnen, Umbenennen, Loeschen: Bert bekommt jedes Mal dieselbe Antwort
  // wie fuer einen Stand, den es nicht gibt - und es aendert sich nichts.
  const fremd = [
    await api(`/api/partien/${partie.id}`, bert.kekse),
    await api(`/api/partien/${partie.id}/name`, bert.kekse, { methode: 'POST', koerper: { name: 'Meins' } }),
    await api(`/api/partien/${partie.id}`, bert.kekse, { methode: 'DELETE' }),
  ];
  const keiner = await api('/api/partien/gibtesnicht', bert.kekse);
  for (const antwort of fremd) assert.deepEqual(antwort, keiner);
  assert.equal(keiner.status, 404);

  const offen = await api(`/api/partien/${partie.id}`, anna.kekse);
  assert.equal(offen.status, 200);
  assert.equal(offen.koerper.ladbar, true, 'Anna oeffnet ihren Stand - der Server laedt ihn');
  assert.equal(offen.koerper.vorher, false);
  assert.equal(offen.koerper.partie.name, null, 'Bert hat ihn nicht umbenannt');
  assert.equal((await api(`/api/partien/${partie.id}/name`, anna.kekse, { methode: 'POST', koerper: { name: '  Gegen   die KI ' } })).status, 200);
  assert.equal((await api('/api/partien', anna.kekse)).koerper.partien[0].name, 'Gegen die KI');

  // Herunterfahren sichert (AC-4): die Partie laeuft weiter, dann faehrt der
  // Server herunter - der Stand ist der letzte, nicht der vom Anhalten.
  wer.senden({ typ: 'weiter' });
  await wer.warteAuf((n) => n.typ === 'zustand' && n.t >= takt + 100);
  assert.equal(laufend.herunterfahren(), 1, 'eine laufende Partie gesichert');
  const beimHerunterfahren = raum.welt.takt;
  wer.zu();
  beenden(laufend);
  laufend = null;

  // Ein neuer Server auf derselben Datei: Anna meldet sich an, ihr Stand ist da.
  laufend = await starten(HAFEN, EINSTELLUNGEN(datei));
  const wieder = await anmelden(HAFEN, anna);
  assert.ok(wieder.ok);
  const nachher = await api(`/api/partien/${partie.id}`, wieder.kekse);
  assert.equal(nachher.koerper.ladbar, true);
  const geladen = require('../server/spiele/strategie/steckbrief.js').laden;
  const db = new DatabaseSync(datei, { readOnly: true });
  const { wert } = db.prepare('SELECT wert FROM partiestand WHERE id = ?').get(partie.id);
  db.close();
  assert.equal(geladen(wert).takt, beimHerunterfahren, 'gesichert ist der Takt, an dem der Server herunterfuhr');

  // Loeschen darf nur Anna, und danach ist er weg.
  assert.equal((await api(`/api/partien/${partie.id}`, wieder.kekse, { methode: 'DELETE' })).status, 200);
  assert.deepEqual((await api('/api/partien', wieder.kekse)).koerper.partien, []);
  assert.equal((await api(`/api/partien/${partie.id}`, wieder.kekse)).status, 404);
});
