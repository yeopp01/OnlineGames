// Ganze Partien KI gegen KI (→ specs/10-strategie/fahrplan.md AC-11) - im
// Pruefstand ohne Browser (→ docs/adr/0004-teststrategie.md). Eine eigene
// Datei, weil die Partien rechnen: so laufen sie neben den anderen Dateien
// statt hinter den Messungen in strategie-ki.test.mjs. Seit der Rueckschau
// nach Runde 173 in tests/partien/: zwanzig Partien bis Minute 90 rechnen
// unter Last 171 s und bestimmten allein die Dauer des ersten Abschnitts
// (vorher tests/strategie-partien.test.mjs). Die Messung von
// fahrplan AC-11 selbst steht seit Runde 165 in tests/partien/ki-im-nebel
// (vierzig Partien im Nebel bis Minute 90).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Ki } = require('../../server/spiele/strategie/ki.js');
const { partieSpielen } = require('../../server/spiele/strategie/pruefstand.js');

// Bis Minute 90: im Nebel endet Startwert 10 nach 68 Minuten (Runde 165).
const partie = (startwert) => partieSpielen({ startwert, minuten: 90 });

test('fahrplan AC-11 und ki AC-19: ohne Aufgeben dauert ueber zehn Startwerte keine Partie kuerzer, im Mittel zwei Minuten laenger', () => {
  // Gegenprobe zur Ursache: das Aufgeben verkuerzt die Partien, und nicht
  // irgendetwas anderes. Bis Runde 136 an einem Startwert (13, zuvor 5) -
  // in Runde 137 brach das, als die KI in die Ritterzeit aufstieg und jede
  // Partie anders verlief: mit 42,3, ohne 44,5 Minuten. Gemessen in Runde
  // 137 ueber die Startwerte 1 bis 20 (Stand ohne Ritterzeit): ohne
  // Aufgeben keine kuerzer, laenger um 0,4 bis 10,1 Minuten, ueber 1 bis 10
  // im Mittel 4,5 (mit der Ritterzeit 5,0). Zwei Minuten sind weniger als
  // die Haelfte davon und fallen, wenn das Aufgeben nie greift (dann ist
  // jeder Unterschied null).
  const minuten = (ende) => (ende ? ende.takt / 600 : 90);
  const echt = Ki.prototype.aussichtslos;
  let summe = 0;
  for (let startwert = 1; startwert <= 10; startwert++) {
    const mit = partie(startwert).ende;
    assert.ok(mit, `Startwert ${startwert}: mit Aufgeben entschieden`);
    // Ohne Aufgeben bis Minute 90; endet sie dann nicht, zaehlt sie als 90.
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
