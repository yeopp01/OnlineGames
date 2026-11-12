// Waechter: die Simulation nennt kein einzelnes Haus (→ specs/10-strategie/spielziel.md
// AC-17). Ein Haus ist ein Eintrag in `HAEUSER`, keine Verzweigung - auch kein
// Name im Kommentar, denn wer dort "Wehrstein baut Tuerme" liest, schreibt als
// Naechstes `if (haus === 'wehrstein')`.
//
// Warum er hier steht und nicht mehr in tests/strategie-haeuser.test.mjs: in
// Runde 175 fiel `npm run check` nach sieben Minuten an genau diesem Test, wegen
// eines Kommentars in ki.js. Alle Waechter zusammen laufen in Sekunden
// (`npm run waechter`) - vor dem Check, nicht in ihm (Rueckschau nach Runde 178).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { quelltext } from './quelltext.mjs';

const require = createRequire(import.meta.url);
const { HAEUSER } = require('../server/spiele/strategie/daten.js');

test('spielziel AC-17: die Simulation nennt kein einzelnes Haus', () => {
  // Weder Welt noch KI noch Pruefstand schreiben den Schluessel eines Hauses aus.
  for (const datei of ['welt.js', 'ki.js', 'pruefstand.js']) {
    const quelle = quelltext(`server/spiele/strategie/${datei}`).toLowerCase();
    for (const haus of Object.keys(HAEUSER)) {
      assert.ok(!quelle.includes(haus), `${datei} nennt ${haus}`);
    }
  }
});
