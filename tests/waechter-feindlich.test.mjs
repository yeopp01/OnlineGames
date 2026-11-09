// Waechter: Kampfregeln fragen "Gegner oder nicht" an einer Stelle,
// `welt.feindlich(a, b)` (→ specs/10-strategie/spielziel.md AC-14, ADR-0013).
//
// Warum es diesen Waechter gibt: bis Runde 145 fragte jede Regel fuer sich
// "mir oder nicht mir" - `besitzer === einheit.besitzer` in der Wache, im
// Turm, im Rechtsklick, im Tor, beim Bekehren. Mit Teams ist das an jeder
// dieser Stellen falsch, und eine vergessene faellt erst auf, wenn zwei
// Verbuendete im Spiel aufeinander losgehen. Deshalb liest dieser Waechter
// die Rumpfe der Kampfregeln und verbietet darin jeden Vergleich mit einem
// Besitzer. Wer eine neue Kampfregel schreibt, traegt sie in `KAMPFREGELN`
// ein; eine Regel, die wirklich nur den eigenen Besitz meint (heilen, Lager,
// Bestand), gehoert nicht hierher.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Ohne Wagenruecklauf: unter Windows checkt git mit CRLF aus, und der Rumpf
// endete sonst erst am Dateiende.
const WELT = readFileSync(new URL('../server/spiele/strategie/welt.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const KAMPFREGELN = [
  'toreVon', 'feindAn', 'feindInSicht', 'wacheTakten', 'tuermeTakten', 'mauerImWeg',
  'angriffMelden', 'wehren', 'kannBekehren', 'bekehrenTakten', 'bekehrt',
];

/** Der Rumpf einer Methode der Welt, von ihrem Kopf bis zur schliessenden Klammer auf Einrueckung zwei. */
function rumpf(name) {
  const anfang = WELT.search(new RegExp(`\\n  ${name}\\(`));
  assert.ok(anfang >= 0, `${name}() gibt es`);
  const ende = WELT.indexOf('\n  }\n', anfang);
  return WELT.slice(anfang, ende);
}

// `x.besitzer === y`, `x.besitzer !== y`, `y === x.besitzer` - ohne Kommentare.
const VERGLEICH = /\bbesitzer\s*[!=]==|[!=]==\s*[\w.?]*\bbesitzer\b/;

test('spielziel AC-14: der Waechter erkennt einen Vergleich mit dem Besitzer', () => {
  // Gegenprobe: die Zeilen von Runde 145 waeren aufgefallen.
  assert.ok(VERGLEICH.test('if (anderer.besitzer === einheit.besitzer) continue;'));
  assert.ok(VERGLEICH.test('const feindBau = baustelle.besitzer !== spielerId;'));
  assert.ok(VERGLEICH.test('if (spielerId === g.besitzer) return;'));
  assert.ok(!VERGLEICH.test('if (!this.feindlich(einheit.besitzer, anderer.besitzer)) continue;'));
});

for (const name of KAMPFREGELN) {
  test(`spielziel AC-14: ${name}() fragt welt.feindlich statt den Besitzer zu vergleichen`, () => {
    const zeilen = rumpf(name).split('\n').map((z) => z.replace(/\/\/.*$/, ''));
    const treffer = zeilen.filter((z) => VERGLEICH.test(z)).map((z) => z.trim());
    assert.deepEqual(treffer, [], `in ${name}():\n${treffer.join('\n')}`);
  });
}
