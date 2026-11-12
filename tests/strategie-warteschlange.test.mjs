// Ziele hintereinander mit Umschalt (→ specs/10-strategie/bedienung.md AC-14) -
// Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md).
//
// Ein Gang auf freien Boden mit `anhaengen` kommt hinten an die Reihe dessen,
// der gerade geht; wer steht, geht gleich los. Ein Befehl ohne Umschalt
// verwirft die Reihe, und wer unterwegs etwas anderes tut, vergisst sie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const abstand = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Ein freies Viereck neben Annas Basis: Mitte und Halbmesser r frei.
function freiesViereck(welt, r) {
  const a = welt.spielerVon('a');
  for (let d = 8; d < 40; d++) {
    for (const [dx, dy] of [[d, 0], [0, d], [d, d], [-d, d], [d, -d]]) {
      const x = a.basis.x + dx;
      const y = a.basis.y + dy;
      let frei = true;
      for (let oy = -r; oy <= r && frei; oy++) {
        for (let ox = -r; ox <= r && frei; ox++) {
          if (!karten.begehbar(welt.karte, x + ox, y + oy) || welt.gebaeudeAn(x + ox, y + oy)) frei = false;
        }
      }
      if (frei) return { x, y };
    }
  }
  throw new Error('kein freies Viereck');
}

// Drei Ecken eines Vierecks als Ziele, die vierte als Start.
function aufstellen(welt, art = 'miliz') {
  const m = freiesViereck(welt, 4);
  const start = { x: m.x - 3, y: m.y + 3 };
  const ziele = [{ x: m.x - 3, y: m.y - 3 }, { x: m.x + 3, y: m.y - 3 }, { x: m.x + 3, y: m.y + 3 }];
  const einheit = welt.einheitAnlegen('a', start.x, start.y, art);
  return { einheit, ziele };
}

const befehlen = (welt, ids, ziel, anhaengen = false) => welt.nachricht('a', {
  auftrag: 'befehl', einheiten: ids, ziel, ...(anhaengen ? { anhaengen: true } : {}),
});

// Laeuft, bis die Einheit steht, und merkt sich den ersten Takt an jedem Ziel.
function ablaufen(welt, einheit, ziele) {
  const erreicht = ziele.map(() => null);
  for (let t = 0; t < 60 * TAKTE_PRO_SEKUNDE; t++) {
    welt.takten();
    ziele.forEach((z, i) => { if (erreicht[i] === null && abstand(einheit, z) < 0.6) erreicht[i] = t; });
    if (!einheit.auftrag && !einheit.weg.length) break;
  }
  return erreicht;
}

test('bedienung AC-14: mit Umschalt geht eine Einheit drei Ziele der Reihe nach ab - ohne Umschalt nur das letzte', () => {
  const mit = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const a = aufstellen(mit);
  befehlen(mit, [a.einheit.id], a.ziele[0]);
  befehlen(mit, [a.einheit.id], a.ziele[1], true);
  befehlen(mit, [a.einheit.id], a.ziele[2], true);
  assert.equal(a.einheit.wegpunkte.length, 2, 'zwei Ziele warten');
  const erreicht = ablaufen(mit, a.einheit, a.ziele);
  assert.ok(erreicht.every((t) => t !== null), `jedes Ziel erreicht: ${erreicht}`);
  assert.ok(erreicht[0] < erreicht[1] && erreicht[1] < erreicht[2], `der Reihe nach: ${erreicht}`);
  assert.ok(abstand(a.einheit, a.ziele[2]) < 0.6, 'und am letzten steht sie');
  assert.equal(a.einheit.wegpunkte.length, 0);

  // Gegenprobe: dieselben drei Klicks ohne Umschalt - der letzte ersetzt die
  // anderen, die ersten zwei Ecken sieht sie nie.
  const ohne = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const o = aufstellen(ohne);
  for (const ziel of o.ziele) befehlen(ohne, [o.einheit.id], ziel);
  const nur = ablaufen(ohne, o.einheit, o.ziele);
  assert.deepEqual(nur.slice(0, 2), [null, null], `ohne Umschalt nicht ueber die Ecken: ${nur}`);
  assert.notEqual(nur[2], null);
});

test('bedienung AC-14: wer steht, geht mit Umschalt gleich los; ein Befehl ohne Umschalt verwirft die Reihe', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const { einheit, ziele } = aufstellen(welt);
  // Steht: Umschalt ist ein gewoehnlicher Gang, nichts wartet.
  befehlen(welt, [einheit.id], ziele[0], true);
  assert.equal(einheit.auftrag?.art, 'gehen');
  assert.deepEqual(einheit.auftrag.feld, ziele[0]);
  assert.equal(einheit.wegpunkte.length, 0);
  befehlen(welt, [einheit.id], ziele[1], true);
  assert.equal(einheit.wegpunkte.length, 1);
  // Der Browser erfaehrt, wie viele warten - und nur dann.
  const draht = () => welt.zustand().einheiten.find((e) => e.i === einheit.id);
  assert.equal(draht().q, 1);
  befehlen(welt, [einheit.id], ziele[2]);
  assert.equal(einheit.wegpunkte.length, 0, 'ohne Umschalt ist die Reihe fort');
  assert.deepEqual(einheit.auftrag.feld, ziele[2]);
  assert.equal(draht().q, undefined);
});

test('bedienung AC-14: Umschalt auf einen Vorrat ist ein Befehl wie ohne - und wer unterwegs etwas anderes tut, vergisst die Reihe', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const { einheit, ziele } = aufstellen(welt, 'dorfbewohner');
  befehlen(welt, [einheit.id], ziele[0]);
  befehlen(welt, [einheit.id], ziele[1], true);
  // Ein Wald in der Naehe: dorthin mit Umschalt heisst sammeln, sofort.
  const g = welt.karte.groesse;
  let wald = null;
  for (let i = 0; i < g * g && !wald; i++) {
    const x = i % g;
    const y = Math.floor(i / g);
    if (welt.karte.felder[i] === karten.WALD && abstand({ x, y }, einheit) < 30) wald = { x, y };
  }
  assert.ok(wald, 'ein Wald in der Naehe');
  befehlen(welt, [einheit.id], wald, true);
  assert.equal(einheit.auftrag?.art, 'sammeln');
  assert.equal(einheit.wegpunkte.length, 0);

  // Unterwegs unterbrochen: die Reihe gilt nicht mehr.
  befehlen(welt, [einheit.id], ziele[0]);
  befehlen(welt, [einheit.id], ziele[1], true);
  befehlen(welt, [einheit.id], ziele[2], true);
  einheit.auftrag = { art: 'angreifen', ziel: 'nirgends' };
  welt.takten();
  assert.equal(einheit.wegpunkte.length, 0);
});

test('bedienung AC-14: eine Gruppe steht an jedem Ziel nebeneinander, und mehr als zwanzig Ziele nimmt keiner an', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const { einheit, ziele } = aufstellen(welt);
  const gruppe = [einheit, ...[1, 2, 3].map((d) => welt.einheitAnlegen('a', einheit.x + (d % 2), einheit.y - Math.floor(d / 2), 'miliz'))];
  const ids = gruppe.map((e) => e.id);
  befehlen(welt, ids, ziele[0]);
  befehlen(welt, ids, ziele[1], true);
  // Jeder hat um das zweite Ziel ein eigenes Feld.
  const felder = gruppe.map((e) => `${e.wegpunkte[0].x},${e.wegpunkte[0].y}`);
  assert.equal(new Set(felder).size, gruppe.length, `eigene Felder: ${felder}`);
  ablaufen(welt, einheit, ziele);
  for (let t = 0; t < 20 * TAKTE_PRO_SEKUNDE; t++) welt.takten();
  for (let i = 0; i < gruppe.length; i++) {
    assert.ok(abstand(gruppe[i], ziele[1]) < 3, `${i} am zweiten Ziel`);
    for (let j = i + 1; j < gruppe.length; j++) assert.ok(abstand(gruppe[i], gruppe[j]) >= 0.9, `${i} und ${j} nebeneinander`);
  }

  // Die Grenze: ein Zustand waechst nicht mit jedem Klick.
  befehlen(welt, [einheit.id], ziele[0]);
  for (let n = 0; n < 30; n++) befehlen(welt, [einheit.id], ziele[n % 3], true);
  assert.equal(einheit.wegpunkte.length, 20);
});
