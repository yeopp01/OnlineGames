#!/usr/bin/env node
// Ein Kriterium auf `fertig` braucht einen Test, dessen NAME es mit Kuerzel
// und Nummer nennt - etwa `raeume AC-7: nur der Gastgeber startet`.
//
// Gezaehlt werden Namen aus tests/ und e2e/tests/, nicht irgendeine Stelle im
// Quelltext: ein Kommentar, der ein Kriterium erwaehnt, belegt nichts. Ohne
// diese Pruefung ist der Status im Board eine Behauptung.
//
// Das Bild oder die Begruendung (qa/ohne-bild.json) verlangt zusaetzlich
// scripts/spec-board.mjs. Ein fertiges Kriterium hat also beides: einen
// Test, der sagt, dass es gilt, und ein Bild, das zeigt, wie es aussieht -
// oder den Satz, warum es kein Aussehen hat.
import { belegeFuer, specsLesen, testnamen } from './specs-lesen.mjs';

const specs = await specsLesen();
const namen = await testnamen();
const fehler = specs.flatMap((s) => s.fehler);
let gezaehlt = 0;

for (const spec of specs) {
  for (const k of spec.kriterien) {
    if (k.status !== 'fertig') continue;
    if (belegeFuer(namen, spec.kuerzel, k.id).length) {
      gezaehlt += 1;
    } else {
      fehler.push(`${spec.wo} ${k.id} (${k.titel}): steht auf "fertig", aber kein Testname nennt "${spec.kuerzel} ${k.id}".`);
    }
  }
}

if (fehler.length) {
  console.error('Nicht belegte Abnahmekriterien:');
  for (const f of fehler) console.error(`  ${f}`);
  console.error('\nEntweder einen Test schreiben, dessen Name das Kriterium nennt, oder den Status auf `in-qa` setzen.');
  process.exit(1);
}

console.log(`Belege vollstaendig: ${gezaehlt} Kriterien auf "fertig", jedes von einem Testnamen genannt.`);
