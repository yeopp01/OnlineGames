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

// Eine Schlagbewegung je Schlag (bedienung AC-72): der Zustand nennt den Takt
// des letzten Schlags. Gemessen am Leben des Ziels - jedes Mal, wenn es
// faellt, traegt der Angreifer genau diesen Takt.
for (const art of ['miliz', 'bogenschuetze', 'ramme']) {
  test(`bedienung AC-72: der Zustand nennt den Takt des letzten Schlags - ${art}, im Abstand der Nachladezeit`, () => {
    const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
    const basis = welt.spielerVon('a').basis;
    const anna = welt.einheitAnlegen('a', basis.x, basis.y + 9, art);
    // Ein Haus als Ziel: es haelt still und lange genug.
    const haus = welt.gebaeudeAnlegen('b', 'haus', basis.x + 4, basis.y + 9);
    haus.leben = 100000;
    welt.nachricht('a', { auftrag: 'befehl', einheiten: [anna.id], ziel: { x: haus.x, y: haus.y } });
    assert.equal(eintrag(welt, anna.id).sl, undefined, 'vor dem ersten Schlag keine Marke');
    const nachladen = Math.round(welt.einheitenwert('a', art, 'nachladen') * TAKTE_PRO_SEKUNDE);
    const schlaege = [];
    let leben = haus.leben;
    let marken = 0;
    for (let t = 0; t < 30 * TAKTE_PRO_SEKUNDE && schlaege.length < 4; t++) {
      welt.takten();
      const e = eintrag(welt, anna.id);
      if (e.sl !== undefined) {
        marken++;
        assert.equal(e.w, 1, 'die Marke nur an dem, der kaempft');
      }
      // Ein Nahkaempfer trifft im Takt des Schlags; ein Pfeil fliegt erst.
      if (e.sl !== undefined && e.sl !== schlaege.at(-1)) {
        assert.equal(e.sl, welt.takt, 'die Marke ist der Takt, in dem geschlagen wurde');
        schlaege.push(e.sl);
      }
      if (haus.leben < leben) leben = haus.leben;
    }
    assert.equal(schlaege.length, 4, `vier Schlaege gesehen: ${schlaege.join(', ')}`);
    assert.ok(leben < 100000, 'und das Haus hat Leben verloren');
    for (let i = 1; i < schlaege.length; i++) {
      assert.equal(schlaege[i] - schlaege[i - 1], nachladen, `zwischen zwei Schlaegen liegt die Nachladezeit (${nachladen} Takte)`);
    }
    assert.ok(marken > 3 * nachladen, 'die Marke steht in jedem Zustand des Gefechts, nicht nur im Takt des Schlags');
    // Geht sie weg, traegt sie keine Marke mehr.
    welt.nachricht('a', { auftrag: 'befehl', einheiten: [anna.id], ziel: { x: basis.x, y: basis.y + 14 } });
    welt.takten();
    assert.equal(eintrag(welt, anna.id).sl, undefined, 'unterwegs keine Marke');
  });
}
