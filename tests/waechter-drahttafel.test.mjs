// Waechter: die Kuerzeltafel in `e2e/helpers/strategie.mjs` stimmt mit den
// Daten ueberein (→ Rueckschau nach Runde 72).
//
// Warum es diesen Waechter gibt: der Server schickt Einheiten mit einem
// Buchstaben statt dem Namen, damit ein Zustand klein bleibt. Welcher
// Buchstabe welche Art meint, steht als Tafel oben in der Browser-Hilfe -
// und die Tafel war seit Runde 70 falsch: sie nannte `p` den Plaenkler und
// `k` den Speerkaempfer, es ist umgekehrt. In Runde 72 hat ein Test danach
// gegriffen, die Zusicherung schlug fehl, und es kostete einen Browserlauf,
// bis die Ursache gefunden war.
//
// Eine Tafel, die von Hand gepflegt wird, veraltet. Diese hier nicht mehr:
// sie wird Zeile fuer Zeile gegen `daten.js` gelesen. Wer eine Einheit
// anlegt, traegt sie ein - oder dieser Test sagt, dass sie fehlt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { EINHEITEN } = require('../server/spiele/strategie/daten.js');

const HILFE = fileURLToPath(new URL('../e2e/helpers/strategie.mjs', import.meta.url));

test('waechter: die Kuerzeltafel der Browser-Hilfe nennt jede Einheit richtig', () => {
  const text = readFileSync(HILFE, 'utf8');
  const anfang = text.indexOf('// ### KUERZEL');
  const ende = text.indexOf('// ### ENDE KUERZEL');
  assert.ok(anfang >= 0 && ende > anfang, 'Der Abschnitt "### KUERZEL" fehlt in e2e/helpers/strategie.mjs.');

  // Zeilen der Form:   `d` = dorfbewohner
  const tafel = new Map();
  for (const [, kuerzel, art] of text.slice(anfang, ende).matchAll(/^\/\/\s+`(\w)` = (\w+)$/gm)) {
    assert.ok(!tafel.has(kuerzel), `Das Kuerzel \`${kuerzel}\` steht zweimal in der Tafel.`);
    tafel.set(kuerzel, art);
  }

  const daten = new Map();
  for (const [art, werte] of Object.entries(EINHEITEN)) if (werte.kuerzel) daten.set(werte.kuerzel, art);

  const fehler = [];
  for (const [kuerzel, art] of daten) {
    if (!tafel.has(kuerzel)) fehler.push(`\`${kuerzel}\` = ${art} fehlt in der Tafel.`);
    else if (tafel.get(kuerzel) !== art) fehler.push(`Die Tafel sagt \`${kuerzel}\` = ${tafel.get(kuerzel)}, die Daten sagen ${art}.`);
  }
  for (const [kuerzel, art] of tafel) {
    if (!daten.has(kuerzel)) fehler.push(`Die Tafel nennt \`${kuerzel}\` = ${art}, in den Daten gibt es das Kuerzel nicht.`);
  }

  assert.deepEqual(fehler, [
  ], [
    'Die Kuerzeltafel oben in e2e/helpers/strategie.mjs stimmt nicht mehr mit',
    'server/spiele/strategie/daten.js ueberein. Ein Browsertest, der danach',
    'greift, prueft dann die falsche Einheit - und das faellt erst im Lauf auf.',
    'Die Tafel nachziehen (Abschnitt "### KUERZEL", je Zeile "// `x` = art").',
    '', ...fehler,
  ].join('\n'));
});
