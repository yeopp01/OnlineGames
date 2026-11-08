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

test('fahrplan AC-11 und ki AC-19: ohne Aufgeben dauert Startwert 13 fast zehn Minuten laenger', () => {
  // Gegenprobe zur Ursache: das Aufgeben verkuerzt die Partien, und nicht
  // irgendetwas anderes. Gemessen in Runde 100 ueber die Startwerte 1 bis 20:
  // ohne Aufgeben jede Partie laenger, um 0,4 bis 10,0 Minuten; Startwert 13
  // endet nach 35,8 statt 45,8. (In Runde 97 war es Startwert 5 mit 53,3
  // statt ueber 60 - seit einheiten AC-31 verlaufen die Kaempfe anders.)
  const mit = partieSpielen({ startwert: 13, minuten: 60 }).ende;
  const echt = Ki.prototype.aussichtslos;
  Ki.prototype.aussichtslos = () => false;
  let ohne;
  try {
    ohne = partieSpielen({ startwert: 13, minuten: 90 }).ende;
  } finally {
    Ki.prototype.aussichtslos = echt;
  }
  assert.ok(mit, 'mit Aufgeben entschieden');
  const minuten = (ende) => (ende ? ende.takt / 600 : 90);
  assert.ok(minuten(ohne) - minuten(mit) >= 5, `mit ${minuten(mit).toFixed(1)}, ohne ${minuten(ohne).toFixed(1)} Minuten`);
});
