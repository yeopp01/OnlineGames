// Wer kaempft, holt aus (→ specs/10-strategie/bedienung.md AC-39) - der Teil
// auf dem Server: eine Einheit, die ein Ziel hat und in Reichweite steht,
// traegt im Zustand dieselbe Marke wie ein arbeitender Dorfbewohner (`w`).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const eintrag = (welt, id) => welt.zustand().einheiten.find((e) => e.i === id);

test('bedienung AC-39: wer in Reichweite angreift, traegt die Marke - wer nur hinlaeuft, nicht', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const basis = welt.spielerVon('a').basis;
  const anna = welt.einheitAnlegen('a', basis.x, basis.y + 8, 'miliz');
  const bert = welt.einheitAnlegen('b', basis.x + 6, basis.y + 8, 'miliz');
  // Ein befohlener Angriff: erst laeuft Anna hin.
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [anna.id], ziel: { x: bert.x, y: bert.y } });
  welt.takten();
  assert.equal(anna.auftrag?.art, 'angreifen', 'sie greift an');
  assert.ok(anna.weg.length, 'und laeuft noch');
  assert.equal(eintrag(welt, anna.id).w, undefined, 'unterwegs: keine Marke');
  // Bis sie in Reichweite steht.
  let markiert = false;
  for (let t = 0; t < 10 * TAKTE_PRO_SEKUNDE && !markiert; t++) {
    welt.takten();
    markiert = eintrag(welt, anna.id)?.w === 1;
  }
  assert.ok(markiert, 'am Ziel: die Marke');
  assert.equal(anna.weg.length, 0, 'und sie steht');
  // Faellt das Ziel, endet der Kampf - und die Marke.
  bert.leben = 1;
  for (let t = 0; t < 10 * TAKTE_PRO_SEKUNDE; t++) welt.takten();
  assert.ok(!welt.einheiten.has(bert.id) || bert.tot, 'Bert ist gefallen');
  assert.equal(eintrag(welt, anna.id).w, undefined, 'nach dem Kampf keine Marke mehr');
});
