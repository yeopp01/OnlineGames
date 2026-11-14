// Das Baumenue auf zwei Seiten (→ specs/10-strategie/bedienung.md AC-64) - der
// Teil in den Daten: auf welcher Seite ein Gebaeude steht, sagt `seite` in
// GEBAEUDE, und der Aufbau reicht es dem Browser. Das Menue selbst prueft
// e2e/tests/strategie-baumenue.spec.mjs.
//
// Rueckmeldung des Benutzers: "gebäude muss man irgendwie beim dorfbewohner
// etwas organisieren, dass das nicht zu breit wird."
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

test('bedienung AC-64: jedes Gebaeude des Dorfbewohners steht auf einer von zwei Seiten, keine traegt mehr als zehn - und was ausbildet, schiesst oder sperrt, steht beim Militaer', () => {
  const { baut } = EINHEITEN.dorfbewohner;
  const seiten = [0, 1].map((s) => baut.filter((art) => (GEBAEUDE[art].seite || 0) === s));
  assert.equal(seiten[0].length + seiten[1].length, baut.length, 'eine dritte Seite gibt es nicht');
  for (const [s, arten] of seiten.entries()) {
    assert.ok(arten.length >= 1 && arten.length <= 10, `Seite ${s}: ${arten.length} Gebaeude`);
  }
  for (const art of baut) {
    const w = GEBAEUDE[art];
    const kaempfer = w.bildetAus.some((e) => (EINHEITEN[e]?.angriff || 0) > 0);
    if (kaempfer || w.angriff || w.tor || w.gezogen) assert.equal(w.seite, 1, `${art} gehoert zum Militaer`);
  }
  // Und die Wirtschaft bleibt Wirtschaft.
  for (const art of ['haus', 'muehle', 'holzfaellerlager', 'bergbaulager', 'farm', 'markt']) {
    assert.equal(GEBAEUDE[art].seite || 0, 0, `${art} gehoert zur Wirtschaft`);
  }
});

test('bedienung AC-64: der Aufbau nennt dem Browser die Seite jedes Gebaeudes', () => {
  const { werte } = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' }).aufbau();
  for (const [art, w] of Object.entries(GEBAEUDE)) {
    assert.equal(werte.gebaeude[art].seite, w.seite || 0, art);
  }
  assert.equal(werte.gebaeude.kaserne.seite, 1);
  assert.equal(werte.gebaeude.haus.seite, 0);
});
