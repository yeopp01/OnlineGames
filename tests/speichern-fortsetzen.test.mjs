// Aufhoeren und Fortsetzen (speichern AC-6 bis AC-9, AC-11, AC-27; S3 nach
// ADR-0017). Der echte Weg (ADR-0004): Server, WebSocket, Anmeldung, das
// Strategiespiel allein gegen die KI, die Ablage in SQLite und `/api/partien`.
// Die Kamera (AC-10) gehoert dem Browser - sie prueft
// e2e/tests/strategie-fortsetzen.spec.mjs.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { kunde as kundeMit, istTyp, konto, beenden, warte } from './hilfe.mjs';

const require = createRequire(import.meta.url);
const { starten } = require('../server/index.js');
const { laden } = require('../server/spiele/strategie/steckbrief.js');

const HAFEN = 4187;

let ordner;
let laufend;
let anna;

before(async () => {
  ordner = mkdtempSync(join(tmpdir(), 'fortsetzen-'));
  laufend = await starten(HAFEN, {
    schutz: { verbindungenJeAdresse: 200, verbindungenJeMinute: 500, raeumeGesamt: 200, raeumeJeAdresse: 100 },
    konten: { datei: join(ordner, 'konten.db'), geheimnis: 'f'.repeat(48) },
  });
  anna = await konto(HAFEN, laufend, { name: 'Anna' });
});

after(() => {
  if (laufend) beenden(laufend);
  rmSync(ordner, { recursive: true, force: true });
});

async function liste() {
  const antwort = await fetch(`http://localhost:${HAFEN}/api/partien`, { headers: { Cookie: anna.kekse } });
  assert.equal(antwort.status, 200);
  return antwort.json();
}

async function alleLoeschen() {
  for (const p of (await liste()).partien) {
    await fetch(`http://localhost:${HAFEN}/api/partien/${p.id}`, { method: 'DELETE', headers: { Cookie: anna.kekse } });
  }
}

function standLesen(id) {
  const zeile = laufend.zugang.db.prepare('SELECT wert FROM partiestand WHERE id = ?').get(id);
  return laden(zeile.wert);
}

async function verbunden() {
  const wer = kundeMit(HAFEN, anna.kekse);
  await wer.offen();
  return wer;
}

// Allein gegen die KI, aufgedeckt, eine Weile gelaufen.
async function partieAllein({ takte = 100 } = {}) {
  const wer = await verbunden();
  wer.senden({ typ: 'erstellen', name: 'Anna', einstellungen: { ki: 1, sicht: 'aufgedeckt' } });
  const du = await wer.warteAuf(istTyp('du'));
  wer.senden({ typ: 'start', startwert: 7 });
  await wer.warteAuf(istTyp('aufbau'));
  const raum = laufend.raeume.finden(du.code);
  raum.zeitraffer = 20;
  await wer.warteAuf((n) => n.typ === 'zustand' && n.t >= takte, 15_000);
  return { wer, du, raum };
}

async function aufhoeren(wer) {
  wer.senden({ typ: 'aufhoeren' });
  return wer.warteAuf(istTyp('aufgehoert'));
}

async function fortsetzen(id) {
  const wer = await verbunden();
  const zuende = wer.zuende();
  wer.senden({ typ: 'fortsetzen', id });
  const du = await wer.warteAuf((n) => n.typ === 'du' || n.typ === 'fehler');
  return { wer, du, zuende };
}

test('speichern AC-7: "Aufhören und später weiterspielen" sichert, schließt den Raum, und die Partie steht in der Liste', async () => {
  await alleLoeschen();
  const { wer, du, raum } = await partieAllein();
  const zuende = wer.zuende();
  const antwort = await aufhoeren(wer);
  const takt = raum.welt.takt;
  assert.ok(antwort.stand, 'die Antwort nennt den Stand');
  assert.equal(laufend.raeume.finden(du.code), null, 'der Raum ist geschlossen');
  assert.equal(standLesen(antwort.stand).takt, takt, 'gesichert ist genau der Takt, an dem aufgehoert wurde');
  await warte(300);
  assert.equal(raum.welt.takt, takt, 'und der Raum rechnet nicht weiter');

  const { partien, hoechstens } = await liste();
  assert.equal(hoechstens, 5);
  assert.equal(partien.length, 1);
  const [partie] = partien;
  assert.equal(partie.id, antwort.stand);
  // Was die Liste im Vorraum zeigt: Spielzeit und Karte sagt das Spiel, wer
  // mitspielte und wann, der Raum.
  const angaben = Object.fromEntries(partie.angaben.map((a) => [a.name, a.wert]));
  assert.match(angaben.Spielzeit, /^\d+:\d\d$/);
  assert.ok(['klein', 'normal', 'groß'].includes(angaben.Karte), `Karte ${angaben.Karte}`);
  assert.deepEqual(partie.beteiligte.map((b) => b.name), ['Anna', 'KI 1']);
  assert.ok(Math.abs(partie.geaendert - Date.now()) < 60_000);
  // Die Verbindung bleibt offen - der Browser laedt selbst neu.
  assert.equal(wer.draht.readyState, 1);
  wer.zu();
  await zuende;
  await alleLoeschen();
});

test('speichern AC-22: zu mehreren ist Aufhören erst ein Vorschlag - die Partie läuft weiter, bis alle zustimmen', async () => {
  const wer = await verbunden();
  wer.senden({ typ: 'erstellen', name: 'Anna', einstellungen: { ki: 1, sicht: 'aufgedeckt' } });
  const du = await wer.warteAuf(istTyp('du'));
  const bert = kundeMit(HAFEN);
  await bert.offen();
  bert.senden({ typ: 'beitreten', code: du.code, name: 'Bert' });
  await bert.warteAuf(istTyp('du'));
  wer.senden({ typ: 'start', startwert: 7 });
  await wer.warteAuf(istTyp('aufbau'));
  const raum = laufend.raeume.finden(du.code);
  assert.equal(raum.vorraum().sichert, true, 'gesichert wird sie - nur Aufhoeren verlangt Einigkeit (AC-22)');
  wer.senden({ typ: 'aufhoeren' });
  const frage = await bert.warteAuf(istTyp('aufhoerfrage'));
  assert.equal(frage.name, 'Anna');
  assert.deepEqual(frage.fehlen, ['Bert']);
  await warte(200);
  assert.equal(laufend.raeume.finden(du.code), raum, 'der Raum bleibt offen');
  assert.ok(raum.laeuft);
  wer.zu();
  bert.zu();
  laufend.raeume.schliessen(raum);
  await alleLoeschen();
});

test('speichern AC-9: Fortsetzen öffnet einen neuen Raum mit neuem Code, angehalten bis "Weiter" - der alte Code führt nirgendwohin', async () => {
  await alleLoeschen();
  const { wer, du: alt, raum: alterRaum } = await partieAllein();
  const { stand } = await aufhoeren(wer);
  const takt = alterRaum.welt.takt;
  wer.zu();

  const { wer: neu, du } = await fortsetzen(stand);
  assert.equal(du.typ, 'du', du.text);
  assert.notEqual(du.code, alt.code, 'ein neuer Code');
  assert.equal(du.stand, stand, 'derselbe Stand');
  assert.equal(du.id, alt.id, 'Anna sitzt auf ihrem alten Platz');
  assert.notEqual(du.token, alt.token, 'mit neuem Token - das alte gehoerte zum alten Raum');
  await neu.warteAuf(istTyp('aufbau'));
  const pause = await neu.warteAuf(istTyp('pause'));
  assert.equal(pause.name, 'Anna', 'angehalten, von ihr');
  assert.equal(pause.bis ?? null, null, 'allein ohne Frist (AC-20)');
  await neu.warteAuf((n) => n.typ === 'stand' && n.fortgesetzt);

  const raum = laufend.raeume.finden(du.code);
  assert.equal(raum.welt.takt, takt, 'dieselbe Welt, derselbe Takt');
  // Auch angehalten steht die Partie im Bild: ein Zustand kommt gleich mit.
  const ersterZustand = await neu.warteAuf(istTyp('zustand'));
  assert.equal(ersterZustand.t, takt, 'der Zustand des geladenen Takts');
  raum.zeitraffer = 20;
  await warte(1200);
  assert.equal(raum.welt.takt, takt, 'die Uhr steht, bis jemand "Weiter" sagt');
  // Weiter geht es mit "Weiter", wie nach jeder Pause.
  neu.senden({ typ: 'weiter' });
  await neu.warteAuf((n) => n.typ === 'zustand' && n.t > takt + 20);
  // Gesichert wird weiter in denselben Stand, nicht in einen zweiten.
  neu.senden({ typ: 'pause' });
  await neu.warteAuf((n) => n.typ === 'pause' && n.name && n !== pause);
  const { partien } = await liste();
  assert.equal(partien.length, 1);
  assert.ok(standLesen(stand).takt > takt);

  // Der alte Code: es gibt ihn nicht mehr, weder zum Beitreten noch zurueck.
  const fremd = kundeMit(HAFEN);
  await fremd.offen();
  fremd.senden({ typ: 'beitreten', code: alt.code, name: 'Cem' });
  assert.equal((await fremd.warteAuf(istTyp('fehler'))).text, 'Diesen Raumcode gibt es nicht.');
  fremd.zu();
  const zurueck = await verbunden();
  zurueck.senden({ typ: 'zurueck', code: alt.code, token: alt.token });
  assert.equal((await zurueck.warteAuf(istTyp('fehler'))).text, 'Diese Partie gibt es nicht mehr.');
  zurueck.zu();
  neu.zu();
  laufend.raeume.schliessen(raum);
  await alleLoeschen();
});

test('speichern AC-11: wird derselbe Stand ein zweites Mal geöffnet, endet die erste Sitzung - gesichert, mit Satz', async () => {
  await alleLoeschen();
  const { wer, raum: urRaum } = await partieAllein();
  const { stand } = await aufhoeren(wer);
  wer.zu();
  void urRaum;

  const erste = await fortsetzen(stand);
  const ersterRaum = laufend.raeume.finden(erste.du.code);
  ersterRaum.zeitraffer = 20;
  erste.wer.senden({ typ: 'weiter' });
  const vorher = ersterRaum.welt.takt;
  await erste.wer.warteAuf((n) => n.typ === 'zustand' && n.t > vorher + 50, 15_000);

  // Ein zweiter Browser oeffnet denselben Stand.
  const zweite = await fortsetzen(stand);
  assert.equal(zweite.du.typ, 'du', zweite.du.text);
  const abgeloest = await erste.wer.warteAuf(istTyp('abgeloest'));
  assert.match(abgeloest.text, /anderer Stelle fortgesetzt/);
  assert.equal(await erste.zuende, 4001, 'die erste Verbindung ist zu');
  const zuletzt = ersterRaum.welt.takt;
  await warte(300);
  assert.equal(ersterRaum.welt.takt, zuletzt, 'die erste Welt rechnet nicht mehr');
  assert.equal(laufend.raeume.finden(erste.du.code), null);

  const zweiterRaum = laufend.raeume.finden(zweite.du.code);
  assert.equal(zweiterRaum.welt.takt, zuletzt, 'geladen ist, was die erste Sitzung eben noch hatte - nichts geht verloren');
  const mitStand = [...laufend.raeume.nachCode.values()].filter((r) => r.standId === stand);
  assert.deepEqual(mitStand, [zweiterRaum], 'der Stand laeuft genau einmal');
  // Die alte Sitzung schreibt nicht mehr hinein, auch nicht beim Abreissen.
  zweiterRaum.sichern();
  assert.equal(standLesen(stand).takt, zuletzt);
  zweite.wer.zu();
  laufend.raeume.schliessen(zweiterRaum);
  await alleLoeschen();
});

test('speichern AC-8: allein und weggeklickt - nach zwei Minuten gesichert und geschlossen, zu mehreren nicht', async () => {
  await alleLoeschen();
  const raeume = laufend.raeume;
  assert.equal(raeume.wegMs, 2 * 60 * 1000, 'zwei Minuten');
  // Zwei Minuten warten kostet zwei Minuten - der Test kuerzt die Frist und
  // ruft das Aufraeumen selbst (sonst alle 15 Sekunden).
  raeume.wegMs = 600;
  try {
    const { wer, du, raum } = await partieAllein();
    wer.zu();
    while (!raum.leer) await warte(20);
    const takt = raum.welt.takt;
    raeume.aufraeumen();
    assert.equal(raeume.finden(du.code), raum, 'vor der Frist steht der Raum noch - ein Neuladen kehrt zurueck');
    await warte(700);
    raeume.aufraeumen();
    assert.equal(raeume.finden(du.code), null, 'nach der Frist ist er zu');
    const { partien } = await liste();
    assert.equal(partien.length, 1, 'und die Partie liegt in der Liste');
    assert.equal(standLesen(partien[0].id).takt, takt, 'mit dem Takt, an dem der letzte ging');

    // Zu mehreren gilt weiter raeume AC-17: die Partie wartet.
    const gastgeber = await verbunden();
    gastgeber.senden({ typ: 'erstellen', name: 'Anna', einstellungen: { ki: 1, sicht: 'aufgedeckt' } });
    const zweiDu = await gastgeber.warteAuf(istTyp('du'));
    const bert = kundeMit(HAFEN);
    await bert.offen();
    bert.senden({ typ: 'beitreten', code: zweiDu.code, name: 'Bert' });
    await bert.warteAuf(istTyp('du'));
    gastgeber.senden({ typ: 'start', startwert: 7 });
    await gastgeber.warteAuf(istTyp('aufbau'));
    const zuZweit = raeume.finden(zweiDu.code);
    gastgeber.zu();
    bert.zu();
    while (!zuZweit.leer) await warte(20);
    await warte(700);
    raeume.aufraeumen();
    assert.equal(raeume.finden(zweiDu.code), zuZweit, 'zu zweit wartet sie weiter');
    raeume.schliessen(zuZweit);
  } finally {
    raeume.wegMs = 2 * 60 * 1000;
  }
  await alleLoeschen();
});

test('speichern AC-27: liegen schon fünf Stände am Konto, sagt das Spiel beim Start, dass diese Partie nicht gesichert wird', async () => {
  await alleLoeschen();
  const ablage = laufend.ablage;
  // Fuenf echte Partien kosten fuenf Partien - die Grenze ist ein Wert der
  // Ablage, der Test setzt sie auf eins.
  ablage.jeKonto = 1;
  try {
    const { wer } = await partieAllein();
    const ersteHinweise = wer.eingang.filter((n) => n.typ === 'hinweis');
    assert.deepEqual(ersteHinweise, [], 'mit freiem Platz kein Hinweis');
    await aufhoeren(wer);
    wer.zu();
    assert.equal((await liste()).hoechstens, 1);

    const voll = await verbunden();
    voll.senden({ typ: 'erstellen', name: 'Anna', einstellungen: { ki: 1, sicht: 'aufgedeckt' } });
    const du = await voll.warteAuf(istTyp('du'));
    voll.senden({ typ: 'start', startwert: 8 });
    const hinweis = await voll.warteAuf(istTyp('hinweis'));
    assert.equal(hinweis.ohneStand, true);
    assert.match(hinweis.text, /nicht gesichert/);
    assert.match(hinweis.text, /1 Spielstände/);
    const raum = laufend.raeume.finden(du.code);
    raum.zeitraffer = 20;
    await voll.warteAuf((n) => n.typ === 'zustand' && n.t >= 100, 15_000);
    raum.sichern();
    assert.equal(voll.eingang.filter((n) => n.typ === 'hinweis').length, 1, 'einmal gesagt, nicht je Minute');
    // Aufhoeren geht dann nicht - es gaebe nichts, wohin.
    voll.senden({ typ: 'aufhoeren' });
    assert.match((await voll.warteAuf(istTyp('fehler'))).text, /nicht gesichert/);
    assert.equal(laufend.raeume.finden(du.code), raum, 'die Partie laeuft weiter');
    assert.equal((await liste()).partien.length, 1, 'der alte Stand bleibt, kein stilles Opfer');
    voll.zu();
    laufend.raeume.schliessen(raum);
  } finally {
    ablage.jeKonto = 5;
  }
  await alleLoeschen();
});

test('speichern AC-6: ist der neueste Stand kaputt, setzt Fortsetzen mit dem davor fort und sagt das im Spiel - sind beide kaputt, sagt es der Vorraum', async () => {
  await alleLoeschen();
  const { wer, raum: urRaum } = await partieAllein();
  const { stand } = await aufhoeren(wer);
  const ersterTakt = urRaum.welt.takt;
  wer.zu();

  // Einmal fortgesetzt und wieder aufgehoert: jetzt gibt es einen vorigen Stand.
  const erste = await fortsetzen(stand);
  const raum = laufend.raeume.finden(erste.du.code);
  raum.zeitraffer = 20;
  erste.wer.senden({ typ: 'weiter' });
  await erste.wer.warteAuf((n) => n.typ === 'zustand' && n.t > ersterTakt + 50, 15_000);
  await aufhoeren(erste.wer);
  erste.wer.zu();

  // Kaputt auf der Platte - ein abgerissener Schreibvorgang.
  const db = laufend.zugang.db;
  db.prepare('UPDATE partiestand SET wert = ? WHERE id = ?').run(Buffer.from('FASTkaputt'), stand);
  const zweite = await fortsetzen(stand);
  assert.equal(zweite.du.typ, 'du');
  const hinweis = await zweite.wer.warteAuf(istTyp('hinweis'));
  assert.match(hinweis.text, /letzte Stand ließ sich nicht laden/);
  assert.match(hinweis.text, /mit dem davor/);
  assert.ok(!hinweis.ohneStand, 'gesichert wird weiter');
  const zweiterRaum = laufend.raeume.finden(zweite.du.code);
  assert.equal(zweiterRaum.welt.takt, ersterTakt, 'geladen ist der vorige Stand');
  zweite.wer.zu();
  laufend.raeume.schliessen(zweiterRaum);

  // Beide kaputt: geladen wird nichts, der Satz steht im Vorraum, der Stand bleibt.
  db.prepare('UPDATE partiestand SET wert = ?, vorher = ? WHERE id = ?').run(Buffer.from('x'), Buffer.from('y'), stand);
  const dritte = await fortsetzen(stand);
  assert.equal(dritte.du.typ, 'fehler');
  assert.match(dritte.du.text, /lässt sich nicht laden/);
  assert.equal((await liste()).partien.length, 1, 'nichts wird angefasst');
  dritte.wer.zu();
  await alleLoeschen();
});
