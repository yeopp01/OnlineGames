// Die Haeuser gegeneinander (Runde 176): jede Paarung gleich oft, die Seiten
// abwechselnd, und gezaehlt wird je Haus und je Paarung.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { paarungen, auswerten, zaehlen } from './pruefstand-haeuser.mjs';

const require = createRequire(import.meta.url);
const { Welt } = require('../server/spiele/strategie/welt.js');
const daten = require('../server/spiele/strategie/daten.js');

test('pruefstand:haeuser - jede Paarung je-mal, jedes Haus gleich oft links und rechts', () => {
  const namen = ['a', 'b', 'c', 'd'];
  const haeuser = paarungen(namen, 4);
  const partien = Object.values(haeuser);
  assert.equal(partien.length, 6 * 4);
  assert.deepEqual(Object.keys(haeuser).map(Number), partien.map((_, i) => i + 1));
  for (const h of namen) {
    assert.equal(partien.filter((p) => p.ki1 === h).length, 6, `${h} links`);
    assert.equal(partien.filter((p) => p.ki2 === h).length, 6, `${h} rechts`);
  }
  const je = {};
  for (const { ki1, ki2 } of partien) je[[ki1, ki2].sort().join()] = (je[[ki1, ki2].sort().join()] || 0) + 1;
  assert.deepEqual(Object.values(je), [4, 4, 4, 4, 4, 4]);
});

test('pruefstand:haeuser - Siege zaehlen fuer das Haus des Siegers, ohne Sieger fuer keinen', () => {
  const enden = [
    { haeuser: { ki1: 'a', ki2: 'b' }, sieger: 'ki1' },
    { haeuser: { ki1: 'b', ki2: 'a' }, sieger: 'ki2' },
    { haeuser: { ki1: 'b', ki2: 'a' }, sieger: 'ki1' },
    { haeuser: { ki1: 'a', ki2: 'c' }, sieger: null },
  ];
  const { haus, paar, links } = auswerten(enden);
  assert.deepEqual([haus.a.siege, haus.a.partien], [2, 4]);
  assert.deepEqual([haus.b.siege, haus.b.partien], [1, 3]);
  assert.deepEqual([haus.c.siege, haus.c.partien], [0, 1]);
  assert.deepEqual(paar['a - b'], { a: 2, b: 1 });
  assert.deepEqual(paar['a - c'], { a: 0, c: 0 });
  assert.equal(links, 2);
});

test('pruefstand:haeuser - zaehlt, was nach dem Start dazukommt, je Spieler und Art', () => {
  const welt = new Welt([{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }], 4711, { sicht: 'aufgedeckt' });
  const stand = {};
  zaehlen(welt, stand, daten);
  assert.deepEqual(stand.je, {}, 'der Start zaehlt nicht');
  const { basis } = welt.spielerVon('a');
  welt.einheitAnlegen('a', basis.x + 6, basis.y + 6, 'speerkaempfer');
  welt.einheitAnlegen('a', basis.x + 6, basis.y + 7, 'dorfbewohner');
  welt.einheitAnlegen('b', basis.x + 7, basis.y + 6, 'marktkarren');
  welt.gebaeudeAnlegen('a', 'kaserne', basis.x + 9, basis.y + 9, true);
  welt.gebaeudeAnlegen('a', 'haus', basis.x + 13, basis.y + 9, true);
  zaehlen(welt, stand, daten);
  assert.equal(stand.je.a.kampf, 1);
  assert.equal(stand.je.a.dorf, 1);
  assert.equal(stand.je.a.gebaeude, 1, 'die Kaserne, nicht das Haus');
  assert.equal(stand.je.b.kampf, 0, 'der Karren greift nicht an');
  assert.equal(stand.je.b.arten.marktkarren, 1);
  zaehlen(welt, stand, daten);
  assert.equal(stand.je.a.kampf, 1, 'nichts doppelt');
  const { haus } = auswerten([{ haeuser: { a: 'x', b: 'y' }, sieger: 'a', zaehlung: stand.je }]);
  assert.equal(haus.x.kampf, 1);
  assert.equal(haus.y.kampf, 0);
});
