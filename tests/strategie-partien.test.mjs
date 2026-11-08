// Ganze Partien KI gegen KI (→ specs/10-strategie/fahrplan.md AC-11) - im
// Pruefstand ohne Browser (→ docs/adr/0004-teststrategie.md). Eine eigene
// Datei, weil zwanzig Partien rund 25 s rechnen: so laufen sie neben den
// anderen Dateien statt hinter den Messungen in strategie-ki.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Ki } = require('../server/spiele/strategie/ki.js');
const { partieSpielen } = require('../server/spiele/strategie/pruefstand.js');

test('fahrplan AC-11: KI gegen KI endet ueber zwanzig Startwerte mit einem Sieger, jede Partie vor Minute 60', () => {
  // Gemessen in Runde 97, Startwerte 1 bis 20: alle mit Sieger, Ende nach
  // 24,8 bis 53,3 Minuten, Median 33,8. Vorher (Runde 92) 4 von 20 vor Minute
  // 60, (Runde 95) 18, (Runde 96) 19 - die letzte war Startwert 5 mit 62,0.
  const enden = [];
  const sieger = new Set();
  for (let startwert = 1; startwert <= 20; startwert++) {
    const r = partieSpielen({ startwert, minuten: 60 });
    assert.ok(r.ende?.sieger, `Startwert ${startwert}: kein Sieger bis Minute 60`);
    enden.push(r.ende.takt);
    sieger.add(r.ende.sieger);
  }
  // Gegenprobe zum Messaufbau: zwanzig verschiedene Partien, und nicht immer
  // dieselbe Seite vorn.
  assert.ok(new Set(enden).size >= 15, `${new Set(enden).size} verschiedene Enden`);
  assert.equal(sieger.size, 2, 'mal gewinnt die eine KI, mal die andere');
});

test('fahrplan AC-11 und ki AC-19: ohne Aufgeben dauert Startwert 5 ueber 60 Minuten', () => {
  // Gegenprobe zur Ursache: dass Startwert 5 vor Minute 60 endet, liegt am
  // Aufgeben - ohne schleift der Sieger noch achteinhalb Minuten (Runde 97).
  const echt = Ki.prototype.aussichtslos;
  Ki.prototype.aussichtslos = () => false;
  try {
    const r = partieSpielen({ startwert: 5, minuten: 60 });
    assert.equal(r.ende, null, 'bis Minute 60 nicht entschieden');
  } finally {
    Ki.prototype.aussichtslos = echt;
  }
});
