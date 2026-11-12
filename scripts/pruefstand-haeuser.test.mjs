// Die Haeuser gegeneinander (Runde 176): jede Paarung gleich oft, die Seiten
// abwechselnd, und gezaehlt wird je Haus und je Paarung.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paarungen, auswerten } from './pruefstand-haeuser.mjs';

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
  assert.deepEqual(haus.a, { siege: 2, partien: 4 });
  assert.deepEqual(haus.b, { siege: 1, partien: 3 });
  assert.deepEqual(haus.c, { siege: 0, partien: 1 });
  assert.deepEqual(paar['a - b'], { a: 2, b: 1 });
  assert.deepEqual(paar['a - c'], { a: 0, c: 0 });
  assert.equal(links, 2);
});
