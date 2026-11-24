// Gespeicherte Partien zu mehreren (speichern AC-14, AC-22 bis AC-26; S4 nach
// ADR-0017). Der echte Weg (ADR-0004): Server, WebSocket, Anmeldung, das
// Strategiespiel zu dritt gegen die KI, die Ablage in SQLite, `/api/partien`
// und `/api/einladungen`. Anna eroeffnet (ihr gehoert der Stand), Bert spielt
// mit Konto mit, Carl ohne. Dora hat ein Konto, war aber nie dabei.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { kunde as kundeMit, istTyp, konto, beenden, warte } from './hilfe.mjs';

const require = createRequire(import.meta.url);
const { starten } = require('../server/index.js');

const HAFEN = 4186;

let ordner;
let laufend;
let anna;
let bert;
let dora;

before(async () => {
  ordner = mkdtempSync(join(tmpdir(), 'zu-mehreren-'));
  laufend = await starten(HAFEN, {
    schutz: { verbindungenJeAdresse: 200, verbindungenJeMinute: 500, raeumeGesamt: 200, raeumeJeAdresse: 100 },
    konten: { datei: join(ordner, 'konten.db'), geheimnis: 'm'.repeat(48) },
  });
  anna = await konto(HAFEN, laufend, { name: 'Anna', email: 'anna@example.test' });
  bert = await konto(HAFEN, laufend, { name: 'Bert', email: 'bert@example.test' });
  dora = await konto(HAFEN, laufend, { name: 'Dora', email: 'dora@example.test' });
});

after(() => {
  if (laufend) beenden(laufend);
  rmSync(ordner, { recursive: true, force: true });
});

const kontoId = (wer) => wer.koerper.user.id;

async function api(wer, pfad, optionen = {}) {
  const antwort = await fetch(`http://localhost:${HAFEN}${pfad}`, { ...optionen, headers: { Cookie: wer.kekse, ...(optionen.headers || {}) } });
  return { status: antwort.status, koerper: await antwort.json() };
}

async function alleLoeschen() {
  for (const wer of [anna, bert, dora]) {
    for (const p of (await api(wer, '/api/partien')).koerper.partien) {
      await api(wer, `/api/partien/${p.id}`, { method: 'DELETE' });
    }
  }
}

function zeileLesen(id) {
  return laufend.zugang.db.prepare('SELECT konto, plaetze, beteiligte FROM partiestand WHERE id = ?').get(id);
}

async function verbunden(wer = null) {
  const k = kundeMit(HAFEN, wer ? wer.kekse : null);
  await k.offen();
  return k;
}

// Zu dritt gegen eine KI, aufgedeckt, eine Weile gelaufen.
async function partieZuDritt() {
  const a = await verbunden(anna);
  a.senden({ typ: 'erstellen', name: 'Anna', einstellungen: { ki: 1, sicht: 'aufgedeckt' } });
  const duA = await a.warteAuf(istTyp('du'));
  const b = await verbunden(bert);
  b.senden({ typ: 'beitreten', code: duA.code, name: 'Bert' });
  const duB = await b.warteAuf(istTyp('du'));
  const c = await verbunden();
  c.senden({ typ: 'beitreten', code: duA.code, name: 'Carl' });
  const duC = await c.warteAuf(istTyp('du'));
  a.senden({ typ: 'start', startwert: 11 });
  await Promise.all([a, b, c].map((k) => k.warteAuf(istTyp('aufbau'))));
  const raum = laufend.raeume.finden(duA.code);
  raum.zeitraffer = 20;
  await a.warteAuf((n) => n.typ === 'zustand' && n.t >= 60, 15_000);
  return { a, b, c, duA, duB, duC, raum };
}

// Alle drei stimmen zu - gesichert, der Raum ist zu.
async function gemeinsamGesichert() {
  const partie = await partieZuDritt();
  const { a, b, c } = partie;
  for (const k of [a, b, c]) k.senden({ typ: 'aufhoeren' });
  const [ende] = await Promise.all([a, b, c].map((k) => k.warteAuf(istTyp('aufgehoert'))));
  for (const k of [a, b, c]) k.zu();
  return { ...partie, stand: ende.stand };
}

// Anna setzt aus ihrer Liste fort: sie landet im Warteraum, der auf die
// Plaetze von damals wartet.
async function annaSetztFort(stand) {
  const a = await verbunden(anna);
  a.senden({ typ: 'fortsetzen', id: stand });
  const du = await a.warteAuf((n) => n.typ === 'du' || n.typ === 'fehler');
  assert.equal(du.typ, 'du', du.text);
  const vorraum = await a.warteAuf((n) => n.typ === 'raum' && n.code === du.code);
  return { a, du, vorraum, raum: laufend.raeume.finden(du.code) };
}

async function beitreten(wer, code, name) {
  const k = await verbunden(wer);
  k.senden({ typ: 'beitreten', code, name });
  const antwort = await k.warteAuf((n) => n.typ === 'du' || n.typ === 'fehler');
  return { k, antwort };
}

test('speichern AC-26: die Plätze stehen mit Konto im Stand - gezeigt werden nur die Namen', async () => {
  await alleLoeschen();
  const { duA, duB, duC, stand } = await gemeinsamGesichert();
  const zeile = zeileLesen(stand);
  assert.equal(zeile.konto, kontoId(anna), 'der Stand liegt am Konto der Gastgeberin');
  assert.deepEqual(JSON.parse(zeile.plaetze), [
    { platz: duA.id, name: 'Anna', konto: kontoId(anna) },
    { platz: duB.id, name: 'Bert', konto: kontoId(bert) },
    { platz: duC.id, name: 'Carl', konto: null },
  ]);
  assert.deepEqual(JSON.parse(zeile.beteiligte).map((b) => b.name), ['Anna', 'Bert', 'Carl', 'KI 1']);
  // Die Konten gehen nicht in den Browser - weder in der Liste noch beim Oeffnen.
  const { koerper: liste } = await api(anna, '/api/partien');
  assert.equal(liste.partien.length, 1);
  assert.equal('plaetze' in liste.partien[0], false);
  assert.doesNotMatch(JSON.stringify(liste), new RegExp(kontoId(bert)));
  const { status, koerper: offen } = await api(anna, `/api/partien/${stand}`);
  assert.equal(status, 200);
  assert.equal(offen.ladbar, true);
  assert.equal(offen.partie.plaetze, undefined);
  assert.doesNotMatch(JSON.stringify(offen), new RegExp(kontoId(bert)));
  await alleLoeschen();
});

test('speichern AC-22: gesichert wird erst, wenn alle Verbundenen zustimmen - ein Nein verwirft den Vorschlag', async () => {
  await alleLoeschen();
  const { a, b, c, duA, raum } = await partieZuDritt();
  a.senden({ typ: 'aufhoeren' });
  const frage = await c.warteAuf((n) => n.typ === 'aufhoerfrage' && n.von === duA.id);
  assert.equal(frage.name, 'Anna');
  assert.deepEqual(frage.fehlen, ['Bert', 'Carl']);
  b.senden({ typ: 'aufhoeren' });
  await c.warteAuf((n) => n.typ === 'aufhoerfrage' && n.von && n.fehlen.length === 1);
  await warte(200);
  assert.equal(laufend.raeume.finden(duA.code), raum, 'zwei von dreien reichen nicht');
  assert.ok(raum.laeuft, 'und die Partie läuft weiter');
  assert.equal(a.eingang.some(istTyp('aufgehoert')), false);
  const takt = raum.welt.takt;

  // Carl will nicht: der Vorschlag ist weg, alle erfahren es.
  c.senden({ typ: 'aufhoerenNein' });
  const nein = await a.warteAuf((n) => n.typ === 'aufhoerfrage' && n.abgelehnt);
  assert.equal(nein.abgelehnt, 'Carl');
  assert.equal(raum.aufhoerWunsch, null);
  await a.warteAuf((n) => n.typ === 'zustand' && n.t > takt + 20, 10_000);
  assert.equal(laufend.raeume.finden(duA.code), raum);
  assert.equal((await api(anna, '/api/partien')).koerper.partien.length, 0, 'gesichert ist nichts');

  // Neuer Vorschlag, Bert stimmt zu, Carl geht: wer nicht verbunden ist,
  // stimmt nicht mit - jetzt sind alle Verbundenen einig.
  a.senden({ typ: 'aufhoeren' });
  b.senden({ typ: 'aufhoeren' });
  await a.warteAuf((n) => n.typ === 'aufhoerfrage' && n.von && n.fehlen.length === 1 && n.fehlen[0] === 'Carl');
  c.zu();
  const [endeA, endeB] = await Promise.all([a, b].map((k) => k.warteAuf(istTyp('aufgehoert'))));
  assert.equal(endeA.bei, 'Anna');
  assert.equal(endeA.deiner, true);
  assert.equal(endeB.bei, 'Anna', 'Bert erfährt, bei wem der Stand liegt');
  assert.equal(endeB.deiner, false);
  assert.equal(laufend.raeume.finden(duA.code), null, 'der Raum ist zu');
  assert.equal((await api(anna, '/api/partien')).koerper.partien[0].id, endeA.stand);
  a.zu();
  b.zu();
  await alleLoeschen();
});

test('speichern AC-23: der Stand liegt nur bei der Gastgeberin - Bert wird beim Fortsetzen mit neuem Code eingeladen', async () => {
  await alleLoeschen();
  const { duA, stand } = await gemeinsamGesichert();
  assert.deepEqual((await api(anna, '/api/partien')).koerper.partien.map((p) => p.id), [stand]);
  assert.deepEqual((await api(bert, '/api/partien')).koerper.partien, [], 'nicht in Berts Liste');
  assert.deepEqual((await api(bert, '/api/einladungen')).koerper.einladungen, [], 'solange niemand fortsetzt, keine Einladung');

  const { a, du } = await annaSetztFort(stand);
  assert.notEqual(du.code, duA.code, 'ein neuer Raum, ein neuer Code');
  assert.equal(a.eingang.some(istTyp('aufbau')), false, 'gestartet wird erst im Warteraum');
  const { koerper: fuerBert } = await api(bert, '/api/einladungen');
  assert.deepEqual(fuerBert.einladungen.map((e) => [e.code, e.von, e.art]), [[du.code, 'Anna', 'strategie']]);
  assert.match(fuerBert.einladungen[0].anzeige, /^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  assert.deepEqual((await api(anna, '/api/einladungen')).koerper.einladungen, [], 'die Besitzerin setzt aus ihrer Liste fort');
  assert.deepEqual((await api(dora, '/api/einladungen')).koerper.einladungen, [], 'wer nie dabei war, ist nicht eingeladen');
  const ohne = await fetch(`http://localhost:${HAFEN}/api/einladungen`);
  assert.equal(ohne.status, 401, 'Einladungen nur mit Anmeldung');

  // Ist Bert da, ist er nicht mehr eingeladen.
  const { k, antwort } = await beitreten(bert, du.code, 'Bert');
  assert.equal(antwort.typ, 'du');
  assert.deepEqual((await api(bert, '/api/einladungen')).koerper.einladungen, []);
  a.zu();
  k.zu();
  await warte(100);
  await alleLoeschen();
});

test('speichern AC-24: der Warteraum zeigt die Plätze von damals - Konto oder Name holt den eigenen zurück', async () => {
  await alleLoeschen();
  const { duA, duB, duC, stand } = await gemeinsamGesichert();
  const { a, du, vorraum, raum } = await annaSetztFort(stand);
  assert.equal(du.id, duA.id, 'Anna sitzt auf ihrem Platz');
  const menschen = vorraum.plaetze.filter((p) => p.mensch);
  assert.deepEqual(menschen.map((p) => [p.platz, p.name, Boolean(p.fehlt)]), [
    [duA.id, 'Anna', false], [duB.id, 'Bert', true], [duC.id, 'Carl', true],
  ]);
  assert.equal(vorraum.plaetze.filter((p) => !p.mensch).length, 1, 'die KI steht wie damals daneben');
  assert.ok(vorraum.fortsetzung, 'der Vorraum weiß, dass fortgesetzt wird');

  // Dora war nie dabei: abgewiesen, mit dem Satz, wer fehlt.
  const fremd = await beitreten(dora, du.code, 'Dora');
  assert.equal(fremd.antwort.typ, 'fehler');
  assert.match(fremd.antwort.text, /damals dabei/);
  assert.match(fremd.antwort.text, /Bert, Carl/);
  // Wer angemeldet ist, nimmt ueber den Namen keinen Platz, der einem Konto gehoert.
  const namensgleich = await beitreten(dora, du.code, 'Bert');
  assert.equal(namensgleich.antwort.typ, 'fehler');

  // Bert kommt mit seinem Konto - der Name, den er tippt, zaehlt nicht.
  const b = await beitreten(bert, du.code, 'Berti');
  assert.equal(b.antwort.typ, 'du', b.antwort.text);
  assert.equal(b.antwort.id, duB.id, 'Bert hat seinen Platz zurück');
  // Carl ohne Konto mit seinem Namen, gross oder klein.
  const c = await beitreten(null, du.code, 'carl');
  assert.equal(c.antwort.typ, 'du', c.antwort.text);
  assert.equal(c.antwort.id, duC.id);
  const voll = await beitreten(null, du.code, 'Erik');
  assert.equal(voll.antwort.typ, 'fehler');

  // Die Einstellungen gehoeren zum Stand.
  a.senden({ typ: 'einstellen', einstellungen: { sicht: 'nebel' } });
  const fest = await a.warteAuf((n) => n.typ === 'fehler' && /stehen fest/.test(n.text));
  assert.ok(fest);
  const vorStart = raum.fortsetzung.welt.takt;
  assert.ok(vorStart > 0, 'der Stand ist mitten in der Partie');
  a.senden({ typ: 'start' });
  const aufbau = await b.k.warteAuf(istTyp('aufbau'));
  assert.ok(aufbau);
  assert.equal(raum.welt.takt >= vorStart, true, 'weiter, wo aufgehört wurde');
  assert.deepEqual([...raum.welt.spieler.values()].map((s) => s.id).filter((id) => [duA.id, duB.id, duC.id].includes(id)).sort(),
    [duA.id, duB.id, duC.id].sort());
  for (const k of [a, b.k, c.k, fremd.k, namensgleich.k, voll.k]) k.zu();
  laufend.raeume.schliessen(raum);
  await alleLoeschen();
});

test('speichern AC-25: fehlt nur einer, legt die Gastgeberin seinen Platz still - seine Einheiten bleiben, die Partie läuft', async () => {
  await alleLoeschen();
  const { duB, duC, stand } = await gemeinsamGesichert();
  const { a, du, raum } = await annaSetztFort(stand);
  const carlsEinheiten = [...raum.fortsetzung.welt.einheiten.values()].filter((e) => e.besitzer === duC.id).length;
  assert.ok(carlsEinheiten > 0);

  // Fehlen zwei, geht es nicht.
  a.senden({ typ: 'stilllegen', platz: duC.id });
  const zuFrueh = await a.warteAuf((n) => n.typ === 'fehler' && /bis auf einen/.test(n.text));
  assert.ok(zuFrueh);
  assert.equal(raum.fortsetzung.stillgelegt, null);

  const b = await beitreten(bert, du.code, 'Bert');
  assert.equal(b.antwort.id, duB.id);
  a.senden({ typ: 'start' });
  const fehlt = await a.warteAuf((n) => n.typ === 'fehler' && /Es fehlen noch: Carl/.test(n.text));
  assert.ok(fehlt, 'ohne Carl startet es nicht von selbst');
  // Bert ist nicht die Besitzerin.
  b.k.senden({ typ: 'stilllegen', platz: duC.id });
  await b.k.warteAuf((n) => n.typ === 'fehler' && /Nur der Gastgeber/.test(n.text));
  assert.equal(raum.fortsetzung.stillgelegt, null);

  a.senden({ typ: 'stilllegen', platz: duC.id });
  const still = await b.k.warteAuf((n) => n.typ === 'raum' && n.fortsetzung && n.fortsetzung.stillgelegt === duC.id);
  assert.equal(still.plaetze.find((p) => p.platz === duC.id).stillgelegt, true, 'alle sehen den stillgelegten Platz');
  a.senden({ typ: 'start' });
  await a.warteAuf(istTyp('aufbau'));
  const takt = raum.welt.takt;
  // Fortgesetzt beginnt sie angehalten (AC-9) - weiter darf jeder am Tisch.
  b.k.senden({ typ: 'weiter' });
  await a.warteAuf((n) => n.typ === 'zustand' && n.t > takt + 20, 10_000);
  assert.ok(raum.laeuft, 'die Partie läuft ohne Carl');
  assert.equal([...raum.welt.einheiten.values()].filter((e) => e.besitzer === duC.id).length, carlsEinheiten,
    'Carls Einheiten stehen noch auf der Karte');
  assert.equal(raum.spieler.some((s) => s.id === duC.id), false, 'niemand sitzt an seinem Platz');

  // Beim naechsten Sichern gehoert Carl weiter dazu - sein Platz wartet wieder.
  a.senden({ typ: 'aufhoeren' });
  b.k.senden({ typ: 'aufhoeren' });
  const ende = await a.warteAuf(istTyp('aufgehoert'));
  const zeile = zeileLesen(ende.stand);
  assert.deepEqual(JSON.parse(zeile.plaetze).map((p) => p.name), ['Anna', 'Bert', 'Carl']);
  assert.deepEqual(JSON.parse(zeile.beteiligte).map((p) => p.name), ['Anna', 'Bert', 'Carl', 'KI 1']);
  a.zu();
  b.k.zu();
  await alleLoeschen();
});

test('speichern AC-14: Bert spielt mit, besitzt aber nichts - weder löschen noch umbenennen noch allein fortsetzen', async () => {
  await alleLoeschen();
  const { duB, stand } = await gemeinsamGesichert();
  assert.deepEqual((await api(bert, '/api/partien')).koerper.partien, []);
  assert.equal((await api(bert, `/api/partien/${stand}`)).status, 404);
  assert.equal((await api(bert, `/api/partien/${stand}`, { method: 'DELETE' })).status, 404);
  const umbenannt = await api(bert, `/api/partien/${stand}/name`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Meins' }),
  });
  assert.equal(umbenannt.status, 404);
  const zeile = laufend.zugang.db.prepare('SELECT name FROM partiestand WHERE id = ?').get(stand);
  assert.equal(zeile.name, null, 'der Name ist unverändert');
  const allein = await verbunden(bert);
  allein.senden({ typ: 'fortsetzen', id: stand });
  const nein = await allein.warteAuf(istTyp('fehler'));
  assert.equal(nein.text, 'Diesen Spielstand gibt es nicht.');
  allein.zu();

  // Geht Anna aus dem Warteraum, sitzt Bert vorn - starten darf er trotzdem nicht.
  const { a, du, raum } = await annaSetztFort(stand);
  const b = await beitreten(bert, du.code, 'Bert');
  assert.equal(b.antwort.id, duB.id);
  a.zu();
  await b.k.warteAuf((n) => n.typ === 'raum' && n.gastgeber === duB.id);
  b.k.senden({ typ: 'start' });
  const nichtSeins = await b.k.warteAuf((n) => n.typ === 'fehler' && /gehört/.test(n.text));
  assert.match(nichtSeins.text, /Fortsetzen darf nur, wem der Spielstand gehört/);
  assert.equal(raum.gestartet, false);
  b.k.zu();
  laufend.raeume.schliessen(raum);

  // In der laufenden Partie handelt Bert wie jeder: er bildet einen Dorfbewohner aus.
  const wieder = await annaSetztFort(stand);
  const b2 = await beitreten(bert, wieder.du.code, 'Bert');
  const c2 = await beitreten(null, wieder.du.code, 'Carl');
  wieder.a.senden({ typ: 'start' });
  await b2.k.warteAuf(istTyp('aufbau'));
  b2.k.senden({ typ: 'weiter' });
  await b2.k.warteAuf((n) => n.typ === 'pause' && n.name === null);
  const dorfzentrum = [...wieder.raum.welt.gebaeude.values()].find((g) => g.besitzer === duB.id && g.art === 'dorfzentrum');
  const vorher = dorfzentrum.schlange.length;
  b2.k.senden({ typ: 'befehl', auftrag: 'ausbilden', gebaeude: dorfzentrum.id, einheit: 'dorfbewohner' });
  await warte(300);
  assert.equal(dorfzentrum.schlange.length, vorher + 1, 'Berts Befehl gilt');
  for (const k of [wieder.a, b2.k, c2.k]) k.zu();
  await warte(100);
  laufend.raeume.schliessen(wieder.raum);
  await alleLoeschen();
});
