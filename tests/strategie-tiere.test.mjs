// Schafe schlachten und hueten (einheiten AC-17) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { TIERE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const sekunden = (welt, s) => { for (let i = 0; i < s * TAKTE_PRO_SEKUNDE; i++) welt.takten(); };

function aufbauen() {
  const welt = new Welt(ZWEI, 7);
  const dorfbewohner = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  const schafe = [...welt.tiere.values()].filter((t) => t.besitzer === 'a');
  const fremde = [...welt.tiere.values()].filter((t) => t.besitzer === 'b');
  return { welt, dorfbewohner, schafe, fremde, anna: welt.spielerVon('a') };
}

// Bis die Einheit am Tier arbeitet.
function anDieArbeit(welt, einheit) {
  for (let i = 0; i < 1500 && !einheit.sammelt; i++) welt.takten();
  assert.ok(einheit.sammelt, 'die Einheit arbeitet am Schaf');
}

test('einheiten AC-17: Rechtsklick auf ein eigenes Schaf - er schlachtet es und nimmt 0,33 Nahrung je Sekunde', () => {
  assert.deepEqual({ nahrung: TIERE.schaf.nahrung, rate: TIERE.schaf.rate, verfall: TIERE.schaf.verfall }, { nahrung: 100, rate: 0.33, verfall: 4 });
  const { welt, dorfbewohner: [hirte], schafe: [schaf] } = aufbauen();
  // Der Klick trifft das Schaf nicht genau, sondern knapp daneben.
  welt.befehl('a', [hirte.id], { x: schaf.x + 0.4, y: schaf.y - 0.3 });
  assert.deepEqual(hirte.auftrag, { art: 'tier', tier: schaf.id });
  assert.equal(schaf.geschlachtet, false, 'erst am Schaf wird geschlachtet');

  anDieArbeit(welt, hirte);
  assert.equal(schaf.geschlachtet, true);
  assert.ok(welt.zustand().tiere.some((t) => t.i === schaf.id && t.g === true), 'der Browser erfaehrt es');

  sekunden(welt, 20);
  assert.equal(hirte.ladungsart, 'nahrung');
  assert.equal(hirte.ladung, Math.floor(0.33 * 20), 'Rate der Vorlage');
  assert.equal(schaf.nahrung, 100 - hirte.ladung, 'was er traegt, fehlt dem Kadaver');
});

test('einheiten AC-17: voll zum Dorfzentrum, abgeben, und zurueck zum selben Schaf', () => {
  const { welt, dorfbewohner: [hirte], schafe: [schaf], anna } = aufbauen();
  welt.befehl('a', [hirte.id], schaf);
  anDieArbeit(welt, hirte);
  const nahrung = anna.nahrung;
  // Zehn Einheiten, dann der Weg und die Abgabe.
  let takte = 0;
  while (anna.nahrung === nahrung && takte < 120 * TAKTE_PRO_SEKUNDE) { welt.takten(); takte++; }
  assert.equal(anna.nahrung, nahrung + 10);
  assert.deepEqual(hirte.auftrag, { art: 'tier', tier: schaf.id }, 'es geht zurueck zum Kadaver');
  // Zurueck an der Arbeit - ob er dafuer laufen muss, haengt davon ab, wie nah
  // das Schaf am Dorfzentrum steht (bei Startwert 7 steht er schon daneben).
  for (let i = 0; i < 60 * TAKTE_PRO_SEKUNDE && !hirte.sammelt; i++) welt.takten();
  assert.equal(hirte.sammelt, true);
  assert.equal(hirte.auftrag.tier, schaf.id, 'am selben Schaf');
});

test('einheiten AC-17: ein liegengelassener Kadaver verliert je 4 Sekunden eine Nahrung, ein bearbeiteter nicht', () => {
  const { welt, dorfbewohner: [hirte], schafe: [schaf, zweites] } = aufbauen();
  welt.befehl('a', [hirte.id], schaf);
  anDieArbeit(welt, hirte);
  // Ein zweites geschlachtetes, an dem niemand arbeitet.
  zweites.geschlachtet = true;

  const vorher = { erstes: schaf.nahrung, zweites: zweites.nahrung, geholt: hirte.ladung };
  sekunden(welt, 20);
  assert.equal(zweites.nahrung, vorher.zweites - 5, 'zwanzig Sekunden, fuenf Nahrung verfallen');
  // Am bearbeiteten fehlt genau, was der Hirte genommen hat - nichts verfaellt.
  assert.equal(vorher.erstes - schaf.nahrung, hirte.ladung - vorher.geholt);

  // Ein lebendes Schaf verfaellt nie.
  const lebend = [...welt.tiere.values()].find((t) => t.besitzer === 'a' && !t.geschlachtet);
  const nahrung = lebend.nahrung;
  sekunden(welt, 20);
  assert.equal(lebend.nahrung, nahrung);
});

test('einheiten AC-17: ein leerer Kadaver verschwindet, der Hirte geht zum naechsten Schaf', () => {
  const { welt, dorfbewohner: [hirte], schafe: [schaf] } = aufbauen();
  welt.befehl('a', [hirte.id], schaf);
  anDieArbeit(welt, hirte);
  schaf.nahrung = 1;
  hirte.angefangen = 0.99;
  welt.zustand();
  welt.takten();
  assert.equal(welt.tiere.has(schaf.id), false, 'leer ist weg');
  assert.ok(welt.zustand().tiere.some((t) => t.i === schaf.id && t.weg), 'der Browser erfaehrt es');
  welt.takten();
  assert.equal(hirte.auftrag?.art, 'tier');
  assert.notEqual(hirte.auftrag.tier, schaf.id, 'ein anderes eigenes Schaf');
  assert.equal(welt.tiere.get(hirte.auftrag.tier).besitzer, 'a');
});

test('einheiten AC-17: fremde Schafe schlachtet niemand', () => {
  const { welt, dorfbewohner: [hirte], fremde: [fremdes] } = aufbauen();
  welt.befehl('a', [hirte.id], fremdes);
  assert.notEqual(hirte.auftrag?.art, 'tier');
  assert.equal(fremdes.geschlachtet, false);
});

// ---- Schafe waehlen und treiben (einheiten AC-22) ----------------------------------

test('einheiten AC-22: ein eigenes Schaf laesst sich mit 0,7 Feldern je Sekunde an einen Ort treiben', () => {
  const { welt, schafe: [schaf] } = aufbauen();
  const ziel = { x: Math.round(schaf.x) + 3, y: Math.round(schaf.y) };
  welt.befehl('a', [schaf.id], ziel);
  assert.ok(schaf.weg.length > 0, 'es hat einen Weg');
  welt.zustand();
  welt.takten();
  assert.ok(welt.zustand().tiere.some((t) => t.i === schaf.id), 'ein laufendes Schaf geht ueber die Leitung');
  sekunden(welt, 10);
  assert.deepEqual({ x: schaf.x, y: schaf.y }, ziel, 'drei Felder in zehn Sekunden sind geschafft');
  assert.equal(schaf.geschlachtet, false, 'getrieben wird es nicht geschlachtet');
  welt.zustand();
  welt.takten();
  assert.equal(welt.zustand().tiere, undefined, 'am Ziel steht es wieder still');
});

test('einheiten AC-22: fremde oder geschlachtete Schafe gehorchen nicht', () => {
  const { welt, schafe: [, zweites], fremde: [fremdes] } = aufbauen();
  welt.befehl('a', [fremdes.id], { x: fremdes.x + 3, y: fremdes.y });
  assert.equal(fremdes.weg.length, 0);
  zweites.geschlachtet = true;
  welt.befehl('a', [zweites.id], { x: zweites.x + 3, y: zweites.y });
  assert.equal(zweites.weg.length, 0);
});

test('einheiten AC-22: ein fremdes Schaf, das nur eigene Einheiten sehen, wechselt den Besitzer', () => {
  const { welt, dorfbewohner: [spaeher], fremde: [fremdes] } = aufbauen();
  // Berts Einheiten fort von seinem Schaf, Annas Dorfbewohner daneben.
  for (const e of welt.einheiten.values()) {
    if (e.besitzer === 'b' && Math.hypot(e.x - fremdes.x, e.y - fremdes.y) <= 6) { e.x += 30; e.y += 30; }
  }
  spaeher.x = fremdes.x + 2;
  spaeher.y = fremdes.y;
  sekunden(welt, 1.1);
  assert.equal(fremdes.besitzer, 'a', 'Anna hat es jetzt');

  // Stehen Einheiten beider daneben, bleibt es, wem es gehoert.
  const { welt: zweite, dorfbewohner: [anna], fremde: [bertsSchaf] } = aufbauen();
  anna.x = bertsSchaf.x + 2;
  anna.y = bertsSchaf.y;
  const bert = [...zweite.einheiten.values()].find((e) => e.besitzer === 'b');
  bert.x = bertsSchaf.x - 2;
  bert.y = bertsSchaf.y;
  sekunden(zweite, 1.1);
  assert.equal(bertsSchaf.besitzer, 'b');
});
