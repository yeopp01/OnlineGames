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

// Eine Partie je Startwert, einmal gerechnet: der Test zum Aufgeben braucht
// dieselben zehn Partien wie fahrplan AC-11 noch einmal.
const gespielt = new Map();
const partie = (startwert) => {
  if (!gespielt.has(startwert)) gespielt.set(startwert, partieSpielen({ startwert, minuten: 60 }));
  return gespielt.get(startwert);
};

test('fahrplan AC-11: KI gegen KI endet ueber zwanzig Startwerte mit einem Sieger, jede Partie vor Minute 60', () => {
  // Gemessen in Runde 97, Startwerte 1 bis 20: alle mit Sieger, Ende nach
  // 24,8 bis 53,3 Minuten, Median 33,8. Vorher (Runde 92) 4 von 20 vor Minute
  // 60, (Runde 95) 18, (Runde 96) 19 - die letzte war Startwert 5 mit 62,0.
  const enden = [];
  const sieger = new Set();
  for (let startwert = 1; startwert <= 20; startwert++) {
    const r = partie(startwert);
    assert.ok(r.ende?.sieger, `Startwert ${startwert}: kein Sieger bis Minute 60`);
    enden.push(r.ende.takt);
    sieger.add(r.ende.sieger);
  }
  // Gegenprobe zum Messaufbau: zwanzig verschiedene Partien, und nicht immer
  // dieselbe Seite vorn.
  assert.ok(new Set(enden).size >= 15, `${new Set(enden).size} verschiedene Enden`);
  assert.equal(sieger.size, 2, 'mal gewinnt die eine KI, mal die andere');
});

test('fahrplan AC-11 und ki AC-19: ohne Aufgeben dauert ueber zehn Startwerte keine Partie kuerzer, im Mittel zwei Minuten laenger', () => {
  // Gegenprobe zur Ursache: das Aufgeben verkuerzt die Partien, und nicht
  // irgendetwas anderes. Bis Runde 136 an einem Startwert (13, zuvor 5) -
  // in Runde 137 brach das, weil die Ritterzeit jede Partie verschob: mit
  // 42,3, ohne 44,5 Minuten. Gemessen in Runde 137 ueber die Startwerte 1
  // bis 20: ohne Aufgeben keine kuerzer, laenger um 0,0 bis 12,8 Minuten,
  // im Mittel 5,7; ueber 1 bis 10 im Mittel 5,0. Zwei Minuten sind weniger
  // als die Haelfte davon und fallen, wenn das Aufgeben nie greift (dann
  // ist jeder Unterschied null).
  const minuten = (ende) => (ende ? ende.takt / 600 : 90);
  const echt = Ki.prototype.aussichtslos;
  let summe = 0;
  for (let startwert = 1; startwert <= 10; startwert++) {
    const mit = partie(startwert).ende;
    assert.ok(mit, `Startwert ${startwert}: mit Aufgeben entschieden`);
    Ki.prototype.aussichtslos = () => false;
    let ohne;
    try {
      ohne = partieSpielen({ startwert, minuten: 90 }).ende;
    } finally {
      Ki.prototype.aussichtslos = echt;
    }
    const laenger = minuten(ohne) - minuten(mit);
    assert.ok(laenger >= 0, `Startwert ${startwert}: mit ${minuten(mit).toFixed(1)}, ohne ${minuten(ohne).toFixed(1)} Minuten`);
    summe += laenger;
  }
  assert.ok(summe / 10 >= 2, `im Mittel ${(summe / 10).toFixed(1)} Minuten laenger`);
});
