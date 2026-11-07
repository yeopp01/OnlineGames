// Das Gleichgewicht der Feudalzeit (→ specs/10-strategie/fahrplan.md AC-9,
// AC-10). Geprueft wird im Gefechtsstand: zwei Heere gleicher Kosten stehen
// sich gegenueber, laufen mit Angriffslauf aufeinander zu, und danach rechnet
// nur noch die Simulation. Kein Server, kein Browser.
//
// Zum Nachsehen von Hand: `npm run konterkreis:strategie` gibt dieselben
// Paarungen in beiden Richtungen aus, mit Dauer und Ueberlebenden.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { gefechtSpielen, kostenSumme } = require('../server/spiele/strategie/pruefstand.js');

// Links schlaegt rechts - der Konterkreis der Feudalzeit aus der Vorlage
// (docs/strategie/vorlage-aoe2.md).
const KREIS = [
  ['speerkaempfer', 'spaeherreiter'],
  ['plaenkler', 'bogenschuetze'],
  ['bogenschuetze', 'speerkaempfer'],
  ['spaeherreiter', 'bogenschuetze'],
];

const STARTWERTE = 20;
// 600 Rohstoffe je Seite: sieben bis zehn Einheiten, je nach Preis. Genug,
// dass die Aufstellung zaehlt, klein genug fuer 0,2 s ueber alle Paarungen.
const BUDGET = 600;

test('fahrplan AC-9: bei gleichen Kosten gewinnt der Konter in mindestens 80 % der Gefechte', () => {
  // Die Schwelle steht im Kriterium: 80 %. Gemessen in Runde 71 gewinnt jeder
  // Konter 20 von 20 und verliert umgekehrt 0 von 20 - der Kreis ist also
  // deutlich schaerfer als verlangt. Geprueft wird die Schwelle, nicht der
  // Messwert: ein Konter, der auf 17 von 20 faellt, ist noch in Ordnung.
  const schwelle = Math.ceil(STARTWERTE * 0.8);
  const bericht = [];
  for (const [konter, ziel] of KREIS) {
    // Gleiche Kosten heisst gleiches Budget, nicht gleiche Stueckzahl: der
    // Reiter kostet 80, der Speerkaempfer 60.
    assert.ok(kostenSumme(konter) > 0 && kostenSumme(ziel) > 0);
    let siege = 0;
    let ohneEnde = 0;
    for (let startwert = 1; startwert <= STARTWERTE; startwert++) {
      const ergebnis = gefechtSpielen({ links: konter, rechts: ziel, startwert, budget: BUDGET });
      if (ergebnis.sieger === 'links') siege += 1;
      if (!ergebnis.sieger) ohneEnde += 1;
    }
    bericht.push(`${konter} gegen ${ziel}: ${siege}/${STARTWERTE}, ohne Ende ${ohneEnde}`);
    assert.ok(
      siege >= schwelle,
      `${konter} soll ${ziel} kontern, gewinnt aber nur ${siege} von ${STARTWERTE} (verlangt ${schwelle}).\n${bericht.join('\n')}`,
    );
    // Ein Gefecht, das in zehn Spielminuten nicht endet, ist kein Sieg des
    // Konters - es ist eine Messung, die nichts sagt. Deshalb hier mit.
    assert.equal(ohneEnde, 0, `${konter} gegen ${ziel}: ${ohneEnde} Gefechte ohne Ende`);
  }
});

test('fahrplan AC-9: umgekehrt gewinnt der Gekonterte so gut wie nie', () => {
  // Die Gegenprobe. Ohne sie wuerde der Test auch dann gruen sein, wenn
  // einfach immer die linke Seite gewinnt - etwa weil sie zuerst anlegt oder
  // zuerst befiehlt. Gemessen in Runde 71: 0 von 20 in allen vier Paarungen.
  for (const [konter, ziel] of KREIS) {
    let siege = 0;
    for (let startwert = 1; startwert <= STARTWERTE; startwert++) {
      const ergebnis = gefechtSpielen({ links: ziel, rechts: konter, startwert, budget: BUDGET });
      if (ergebnis.sieger === 'links') siege += 1;
    }
    assert.ok(
      siege <= STARTWERTE - Math.ceil(STARTWERTE * 0.8),
      `${ziel} wird von ${konter} gekontert, gewinnt als linke Seite aber ${siege} von ${STARTWERTE}`,
    );
  }
});

test('fahrplan AC-10: dasselbe Gefecht zweimal gerechnet verlaeuft Takt fuer Takt gleich', () => {
  // Die Spur ist je Takt eine Zahl aus Kennung, Leben und Ort aller Einheiten
  // (`gefechtSpielen` mit `spurFuehren`). Zwei Laeufe gleich heisst: gleiche
  // Tote, gleiche Wege, gleiche Treffer - nicht nur gleicher Sieger.
  for (const [links, rechts] of KREIS) {
    const eins = gefechtSpielen({ links, rechts, startwert: 7, budget: BUDGET, spurFuehren: true });
    const zwei = gefechtSpielen({ links, rechts, startwert: 7, budget: BUDGET, spurFuehren: true });
    assert.ok(eins.spur.length > 50, `zu kurze Spur: ${eins.spur.length} Takte`);
    assert.deepEqual(zwei.spur, eins.spur, `${links} gegen ${rechts}: der zweite Lauf weicht ab`);
    assert.equal(zwei.sieger, eins.sieger);
    assert.equal(zwei.takte, eins.takte);
  }
});

test('fahrplan AC-10: ein anderer Startwert ergibt ein anderes Gefecht', () => {
  // Die Gegenprobe zur Gleichheit: waere jedes Gefecht dasselbe, waere die
  // Pruefung oben wertlos. Der Startwert verschiebt die Heere quer zur
  // Laufrichtung (bis zu drei Felder je Seite), also treffen sie anders
  // aufeinander. Gemessen in Runde 71: Speer gegen Reiter dauert 65 bis 133
  // Takte, Reiter gegen Bogen 319 bis 416.
  const [links, rechts] = KREIS[0];
  const spuren = new Set();
  for (const startwert of [1, 2, 3, 4, 5]) {
    const { spur } = gefechtSpielen({ links, rechts, startwert, budget: BUDGET, spurFuehren: true });
    spuren.add(spur.join(','));
  }
  assert.ok(spuren.size >= 4, `fuenf Startwerte ergaben nur ${spuren.size} verschiedene Verlaeufe`);
});
