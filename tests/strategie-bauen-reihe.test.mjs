// Mehrere Bauten mit Umschalt (→ specs/10-strategie/bedienung.md AC-48):
// wer schon baut, baut eine mit Umschalt gesetzte Baustelle danach - hinten an
// seine Reihe, wie die Felder einer gezogenen Mauer (bauen AC-30).
//
// Gegen die Welt (ein Rechenteil, ADR-0004): `bauen` mit `anhaengen` ist
// dieselbe Stelle, die die Nachricht des Browsers erreicht.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a1', name: 'Anna' }, { id: 'b1', name: 'Bert' }];

function aufstellen() {
  const w = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const anna = w.spielerVon('a1');
  anna.holz = 1000;
  const dorfbewohner = [...w.einheiten.values()].filter((e) => e.besitzer === 'a1' && e.art === 'dorfbewohner');
  return { w, anna, dorfbewohner };
}

// Der naechste freie Platz fuer ein Haus um die Basis, Ring um Ring.
function freierPlatz(w, basis) {
  for (let r = 4; r < 20; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = Math.round(basis.x) + dx;
        const y = Math.round(basis.y) + dy;
        if (w.platzPruefen('haus', x, y)) return { x, y };
      }
    }
  }
  throw new Error('kein Platz fuer ein Haus');
}

function hausSetzen(w, einheit, anhaengen) {
  const antwort = w.bauen('a1', [einheit.id], 'haus', freierPlatz(w, w.spielerVon('a1').basis), anhaengen);
  assert.ok(antwort.gebaeude, antwort.fehler);
  return antwort.gebaeude;
}

test('bedienung AC-48: wer ein Haus baut, baut zwei mit Umschalt gesetzte der Reihe nach - ohne neuen Befehl', () => {
  const { w, dorfbewohner } = aufstellen();
  const bauer = dorfbewohner[0];
  const erstes = hausSetzen(w, bauer, false);
  const zweites = hausSetzen(w, bauer, true);
  const drittes = hausSetzen(w, bauer, true);
  assert.equal(bauer.auftrag.gebaeude, erstes, 'er bleibt am ersten');
  assert.deepEqual(bauer.auftrag.folge, [zweites, drittes], 'die beiden anderen warten hinten in seiner Reihe');

  // Takten, bis alle drei stehen, und mitschreiben, in welcher Reihenfolge.
  const fertig = [];
  const grenze = 3 * (GEBAEUDE.haus.bauzeit + 30) * TAKTE_PRO_SEKUNDE;
  for (let i = 0; i < grenze && fertig.length < 3; i++) {
    w.takten();
    for (const id of [erstes, zweites, drittes]) {
      if (!fertig.includes(id) && w.gebaeude.get(id)?.fertig) fertig.push(id);
    }
  }
  assert.deepEqual(fertig, [erstes, zweites, drittes], 'alle drei fertig, der Reihe nach');
});

test('bedienung AC-48: ohne Umschalt geht er sofort zur neuen Baustelle - die alte bleibt Baustelle', () => {
  const { w, dorfbewohner } = aufstellen();
  const bauer = dorfbewohner[0];
  const erstes = hausSetzen(w, bauer, false);
  const zweites = hausSetzen(w, bauer, false);
  assert.equal(bauer.auftrag.gebaeude, zweites);
  assert.equal(bauer.auftrag.folge, undefined, 'keine Reihe');
  const alt = w.gebaeude.get(erstes);
  assert.ok(alt && !alt.fertig, 'das erste steht weiter als Baustelle');
});

test('bedienung AC-48: wer nicht baut, beginnt mit Umschalt sofort - nur wer schon baut, haengt an', () => {
  const { w, dorfbewohner } = aufstellen();
  const [baut, frei] = dorfbewohner;
  const erstes = hausSetzen(w, baut, false);
  // Beide setzen gemeinsam mit Umschalt eine zweite: der eine haengt an, der
  // andere, der nichts tat, geht gleich hin.
  const antwort = w.bauen('a1', [baut.id, frei.id], 'haus', freierPlatz(w, w.spielerVon('a1').basis), true);
  assert.ok(antwort.gebaeude, antwort.fehler);
  assert.equal(baut.auftrag.gebaeude, erstes);
  assert.deepEqual(baut.auftrag.folge, [antwort.gebaeude]);
  assert.equal(frei.auftrag.gebaeude, antwort.gebaeude);
});
