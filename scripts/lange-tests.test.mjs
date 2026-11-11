// Lange Tests im ersten Abschnitt (Rueckschau nach Runde 173): gefunden wird
// nur, was im ersten Abschnitt und auf oberster Ebene zu lange rechnet.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { langeImErstenAbschnitt } from './lange-tests.mjs';

const AUSGABE = [
  '> node --test "tests/*.test.mjs"',
  '✔ kurz und oben (1200.5ms)',
  '✔ lang und oben (171000.25ms)',
  '  ✔ lang, aber eingerueckt (95000ms)',
  '✖ lang und gefallen (120000ms)',
  'ℹ tests 4',
  'ℹ duration_ms 205000.1',
  '> node --test "tests/partien/*.test.mjs"',
  '✔ lang im zweiten Abschnitt (174000ms)',
  'ℹ duration_ms 175000',
].join('\r\n');

test('lange Tests: nur oberste Ebene im ersten Abschnitt, laengster zuerst', () => {
  assert.deepEqual(langeImErstenAbschnitt(AUSGABE, 90_000), [
    { name: 'lang und oben', ms: 171000.25 },
    { name: 'lang und gefallen', ms: 120000 },
  ]);
  assert.deepEqual(langeImErstenAbschnitt(AUSGABE, 200_000), []);
});
