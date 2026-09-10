// Das Managerspiel ueber den echten Anfrageweg: HTTP-Server, Anmeldung,
// Schutzschicht, SQLite. Was hier gruen ist, geht auch im Browser
// (→ docs/adr/0004-teststrategie.md).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beenden, konto } from './hilfe.mjs';

const require = createRequire(import.meta.url);
const { starten } = require('../server/index.js');
const { Spielstaende, LEERLAUF_MS, IM_SPEICHER } = require('../server/spiele/manager/spielstaende.js');
const { DatabaseSync } = require('node:sqlite');

const HAFEN = 4281;
const GEHEIMNIS = 'm'.repeat(48);
const WEIT = { rechnungenJeMinute: 1000, zuegeJeMinute: 20000 };
const ordner = mkdtempSync(join(tmpdir(), 'manager-netz-'));
const DATEI = join(ordner, 'konten.sqlite');

let laufend;
let anna;

before(async () => {
  laufend = await starten(HAFEN, { schutz: WEIT, konten: { datei: DATEI, geheimnis: GEHEIMNIS } });
  anna = await konto(HAFEN, laufend, { email: 'anna@manager.test', name: 'Anna' });
});

after(() => {
  if (laufend) beenden(laufend);
  try {
    rmSync(ordner, { recursive: true, force: true });
  } catch { /* Windows haelt die Datei gelegentlich noch einen Moment */ }
});

async function fragen(pfad, { methode = 'GET', koerper, kekse = anna.kekse, hafen = HAFEN } = {}) {
  const antwort = await fetch(`http://localhost:${hafen}/api/manager/${pfad}`, {
    method: methode,
    headers: {
      ...(kekse ? { cookie: kekse } : {}),
      ...(koerper !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: koerper !== undefined ? JSON.stringify(koerper) : undefined,
  });
  return { status: antwort.status, daten: await antwort.json() };
}

const anlegen = (koerper = {}, kekse = anna.kekse) => fragen('spielstaende', {
  methode: 'POST', kekse, koerper: { startwert: 4711, vereinId: 'v5', name: 'Testlauf', ...koerper },
});
const zug = (id, was, koerper = {}, kekse = anna.kekse) => fragen(`spielstaende/${id}/${was}`, { methode: 'POST', koerper, kekse });

test('karriere AC-23: ohne Anmeldung geht nichts', async () => {
  for (const [pfad, methode] of [['spielstaende', 'GET'], ['spielstaende', 'POST'], ['vereine?startwert=1', 'GET'], ['spielstaende/abc/weiter', 'POST']]) {
    const { status, daten } = await fragen(pfad, { methode, kekse: null, koerper: methode === 'POST' ? {} : undefined });
    assert.equal(status, 401, `${methode} ${pfad}`);
    assert.equal(daten.fehler, 'Zum Managerspiel ist eine Anmeldung noetig.');
  }
});

test('karriere AC-1: die Vereinswahl zeigt beide Ligen', async () => {
  const { status, daten } = await fragen('vereine?startwert=4711');
  assert.equal(status, 200);
  assert.equal(daten.vereine.length, 36);
  for (const nummer of [1, 2]) {
    const liga = daten.vereine.filter((v) => v.liga === nummer);
    assert.equal(liga.length, 18);
    assert.deepEqual(liga.map((v) => v.erwartet).sort((a, b) => a - b), Array.from({ length: 18 }, (_, i) => i + 1));
  }
  for (const verein of daten.vereine) {
    assert.ok(verein.name && verein.niveau > 0 && verein.konto > 0 && verein.plaetze > 0 && verein.kaderwert > 0);
  }
  assert.equal((await fragen('vereine?startwert=abc')).status, 400);
});

test('karriere AC-18: jeder Zug ueber den Server', async () => {
  const angelegt = await anlegen();
  assert.equal(angelegt.status, 200);
  const { id } = angelegt.daten;
  assert.equal(angelegt.daten.zustand.verein.id, 'v5');
  assert.equal(angelegt.daten.zustand.termin.index, 0);

  let antwort = await zug(id, 'taktik', { system: '4-3-3', ausrichtung: 4, haerte: 5, pressing: 4 });
  assert.deepEqual(antwort.daten.zustand.verein.taktik, { system: '4-3-3', ausrichtung: 4, haerte: 5, pressing: 4 });
  antwort = await zug(id, 'taktik', { haerte: 2 });
  assert.deepEqual(antwort.daten.zustand.verein.taktik, { system: '4-3-3', ausrichtung: 4, haerte: 2, pressing: 4 });
  antwort = await zug(id, 'schwerpunkt', { schwerpunkt: 'pressing' });
  assert.equal(antwort.daten.zustand.verein.schwerpunkt, 'pressing');
  assert.equal((await zug(id, 'schwerpunkt', { schwerpunkt: 'zaubern' })).status, 400);
  antwort = await zug(id, 'training', { wert: 80 });
  assert.equal(antwort.daten.zustand.verein.training, 80);
  antwort = await zug(id, 'aufstellung', {});
  assert.equal(antwort.daten.zustand.verein.aufstellung.ids.length, 11);
  const kaputt = await zug(id, 'aufstellung', { ids: ['a', 'b'], system: '4-3-3' });
  assert.equal(kaputt.status, 400);
  assert.match(kaputt.daten.fehler, /elf Spieler/);
  assert.ok(kaputt.daten.zustand, 'auch eine Absage bringt den Zustand');
  antwort = await zug(id, 'wechselregel', { regel: 'verletzung' });
  assert.equal(antwort.daten.zustand.verein.wechselregel, 'verletzung');
  antwort = await zug(id, 'eintritt', { preis: 30 });
  assert.equal(antwort.daten.zustand.verein.eintritt, 30);
  antwort = await zug(id, 'sponsor', { id: angelegt.daten.zustand.sponsorAngebote[0].id });
  assert.equal(antwort.daten.zustand.verein.sponsor.art, 'sicher');

  const markt = await fragen(`spielstaende/${id}/markt?position=ANG&anzahl=50`);
  assert.ok(markt.daten.markt.liste.length > 0 && markt.daten.markt.liste.every((s) => s.position === 'ANG'));
  assert.equal(markt.daten.markt.fenster.offen, true);
  const frei = (await fragen(`spielstaende/${id}/markt?liga=frei&anzahl=50`)).daten.markt.liste.find((s) => s.bereit);
  antwort = await zug(id, 'kaufen', { spielerId: frei.id, gebot: 0, laufzeit: 1 });
  assert.equal(antwort.status, 200);
  assert.equal(antwort.daten.zustand.verein.spieler.length, 21);

  antwort = await zug(id, 'weiter');
  assert.equal(antwort.daten.zustand.termin.index, 1);
  assert.equal(antwort.daten.bericht.art, 'vorbereitung');
  antwort = await zug(id, 'vorspulen', { bis: 'winterpause' });
  assert.equal(antwort.daten.zustand.naechster.art, 'winterpause');

  const fremd = await fragen(`spielstaende/${id}/verein/v1`);
  assert.equal(fremd.status, 200);
  assert.ok(fremd.daten.verein.spieler.length >= 16 && fremd.daten.verein.spieler.every((s) => s.forderung > 0));
  assert.equal((await zug(id, 'zaubern')).status, 404);
});

test('karriere AC-15: ein Konto sieht seine Spielstaende', async () => {
  const { daten } = await anlegen({ name: 'Zum Loeschen', vereinId: 'v22' });
  let liste = (await fragen('spielstaende')).daten.spielstaende;
  const eintrag = liste.find((s) => s.id === daten.id);
  assert.deepEqual(
    { name: eintrag.name, verein: eintrag.verein, liga: eintrag.liga, saison: eintrag.saison, datum: eintrag.datum, ladbar: eintrag.ladbar },
    { name: 'Zum Loeschen', verein: daten.zustand.verein.name, liga: 2, saison: 1, datum: 'Saisonvorbereitung', ladbar: true },
  );
  assert.equal((await fragen(`spielstaende/${daten.id}`, { methode: 'DELETE' })).status, 200);
  liste = (await fragen('spielstaende')).daten.spielstaende;
  assert.ok(!liste.some((s) => s.id === daten.id));
  assert.equal((await fragen(`spielstaende/${daten.id}`)).status, 404);
});

test('karriere AC-25: fuenf Spielstaende je Konto', async () => {
  const bert = await konto(HAFEN, laufend, { email: 'bert@manager.test', name: 'Bert' });
  for (let i = 0; i < 5; i++) assert.equal((await anlegen({ name: `Bert ${i}` }, bert.kekse)).status, 200);
  const sechster = await anlegen({ name: 'Bert 6' }, bert.kekse);
  assert.equal(sechster.status, 409);
  assert.equal(sechster.daten.fehler, 'Mehr als 5 Spielstaende je Konto gehen nicht. Loesche einen alten.');
});

test('karriere AC-24 und karriere AC-20: fremde und unbekannte Spielstaende sehen gleich aus', async () => {
  const carla = await konto(HAFEN, laufend, { email: 'carla@manager.test', name: 'Carla' });
  const annasId = (await fragen('spielstaende')).daten.spielstaende[0].id;
  const unbekannt = await fragen('spielstaende/gibtesnicht');
  assert.deepEqual(unbekannt, { status: 404, daten: { fehler: 'Diesen Spielstand gibt es nicht.' } });
  assert.deepEqual(await fragen(`spielstaende/${annasId}`, { kekse: carla.kekse }), unbekannt);
  assert.deepEqual(await zug(annasId, 'weiter', {}, carla.kekse), unbekannt);
  assert.deepEqual(await fragen(`spielstaende/${annasId}`, { methode: 'DELETE', kekse: carla.kekse }), unbekannt);
  assert.equal((await fragen(`spielstaende/${annasId}`)).status, 200, 'Anna hat ihren Spielstand verloren');
  assert.deepEqual((await fragen('spielstaende', { kekse: carla.kekse })).daten.spielstaende, []);
});

test('karriere AC-26: ein Stand aus fremder Fassung wird abgelehnt, die anderen bleiben', async () => {
  const dora = await konto(HAFEN, laufend, { email: 'dora@manager.test', name: 'Dora' });
  const alt = (await anlegen({ name: 'Alt' }, dora.kekse)).daten.id;
  const gut = (await anlegen({ name: 'Gut' }, dora.kekse)).daten.id;
  laufend.zugang.db.prepare('UPDATE manager_spielstand SET fassung = 0 WHERE id = ?').run(alt);
  laufend.manager.staende.offen.clear();

  const abgelehnt = await fragen(`spielstaende/${alt}`, { kekse: dora.kekse });
  assert.deepEqual(abgelehnt, { status: 409, daten: { fehler: 'Dieser Spielstand stammt aus einer anderen Fassung des Spiels.' } });
  assert.equal((await fragen(`spielstaende/${gut}`, { kekse: dora.kekse })).status, 200);
  const liste = (await fragen('spielstaende', { kekse: dora.kekse })).daten.spielstaende;
  assert.equal(liste.find((s) => s.id === alt).ladbar, false);
});

test('karriere AC-14 und manager AC-5: der Spielstand ueberlebt den Neustart', async () => {
  const { id } = (await anlegen({ name: 'Neustart' })).daten;
  await zug(id, 'aufstellung', {});
  await zug(id, 'vorspulen', { anzahl: 5 });
  const vorher = (await fragen(`spielstaende/${id}`)).daten.zustand;
  assert.equal(vorher.termin.index, 5);

  const zu = new Promise((fertig) => laufend.server.once('close', fertig));
  beenden(laufend);
  await zu;
  laufend = await starten(HAFEN, { schutz: WEIT, konten: { datei: DATEI, geheimnis: GEHEIMNIS } });

  // fetch haelt Verbindungen offen; die zum alten Server ist tot. Einmal
  // nachfassen ist dessen Sache, nicht die des Spielstands.
  const nachher = (await fragen(`spielstaende/${id}`).catch(() => fragen(`spielstaende/${id}`))).daten.zustand;
  assert.equal(nachher.termin.index, 5);
  assert.deepEqual(nachher.tabellen, vorher.tabellen);
  assert.deepEqual(nachher.verein, vorher.verein);
  const weiter = await zug(id, 'weiter');
  assert.equal(weiter.status, 200);
  assert.equal(weiter.daten.zustand.termin.index, 6);
});

test('karriere AC-19: Zuege werden gebremst, vor der Anmeldung', async () => {
  const eng = await starten(4282, { schutz: { zuegeJeMinute: 3 }, konten: { datei: ':memory:', geheimnis: GEHEIMNIS } });
  try {
    const status = [];
    for (let i = 0; i < 8; i++) status.push((await fragen('spielstaende', { kekse: null, hafen: 4282 })).status);
    assert.equal(status[0], 401);
    assert.ok(status.includes(429), `nach acht Anfragen: ${status.join(', ')}`);
  } finally {
    beenden(eng);
  }
});

test('pruefstand AC-6: der Pruefstand ist verschwunden', async () => {
  for (const datei of ['pruefstand.html', 'pruefstand.js', 'pruefstand.css']) {
    const antwort = await fetch(`http://localhost:${HAFEN}/${datei}`);
    await antwort.text();
    assert.equal(antwort.status, 404, datei);
  }
  const schnittstelle = await fragen('saison?startwert=4711&vereine=18');
  assert.equal(schnittstelle.status, 404);
});

test('karriere AC-22: der Arbeitsspeicher bleibt frei', () => {
  const db = new DatabaseSync(':memory:');
  let jetzt = 0;
  const staende = new Spielstaende(db, () => jetzt);
  try {
    const { id, karriere } = staende.anlegen('k1', { startwert: 1, vereinId: 'v3', name: 'Eins' });
    karriere.weiter();
    staende.schreiben('k1', id, karriere);
    assert.equal(staende.offen.size, 1);

    jetzt += LEERLAUF_MS + 1;
    staende.aufraeumen();
    assert.equal(staende.offen.size, 0);
    const wieder = staende.oeffnen('k1', id);
    assert.equal(wieder.karriere.termin, 1, 'aus der Datenbank kam ein anderer Stand');
    assert.notEqual(wieder.karriere, karriere);
    assert.equal(staende.oeffnen('k2', id), null);

    for (let i = 0; i < IM_SPEICHER + 2; i++) {
      jetzt += 1;
      assert.ok(staende.anlegen(`konto${Math.floor(i / 5)}`, { startwert: i, vereinId: 'v1', name: `Nr ${i}` }).id);
    }
    assert.ok(staende.offen.size <= IM_SPEICHER, `${staende.offen.size} Karrieren im Speicher`);
  } finally {
    staende.halt();
    db.close();
  }
});
