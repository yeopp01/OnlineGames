#!/usr/bin/env node
// Macht die Regel aus specs/README.md pruefbar: Ein Kriterium auf `fertig`
// braucht einen Test, dessen Name es mit Kuerzel und Nummer nennt.
// Ohne diese Pruefung ist der Status im Board eine Behauptung.
import { lesen, testtext, belegt } from './specs-lesen.mjs';

const specs = await lesen();
const text = await testtext();
const fehler = specs.flatMap((s) => s.fehler);
let gezaehlt = 0;

for (const spec of specs) {
  for (const k of spec.kriterien) {
    if (k.status !== 'fertig') continue;
    if (belegt(text, spec.kuerzel, k.nummer)) gezaehlt += 1;
    else {
      fehler.push(
        `${spec.wo} ${k.nummer} (${k.kurz}): steht auf "fertig", `
        + `aber kein Test nennt "${spec.kuerzel} ${k.nummer}".`,
      );
    }
  }
}

if (fehler.length) {
  console.error('Nicht belegte Abnahmekriterien:');
  for (const f of fehler) console.error(`  ${f}`);
  console.error('\nEntweder einen Test schreiben, der das Kriterium nennt, oder den Status auf "in qa" setzen.');
  process.exit(1);
}

console.log(`Belege vollstaendig: ${gezaehlt} Kriterien auf "fertig", alle im Test genannt.`);
