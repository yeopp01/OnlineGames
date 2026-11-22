// npm run manager:gleichstand [-- --neu]
// Rechnet die Fingerabdruecke der Gleichstandsprobe und vergleicht sie mit
// tests/manager-gleichstand.json. Mit --neu werden sie dort geschrieben.
import { readFileSync, writeFileSync } from 'node:fs';
import { GLEICHSTAND, gleichstandRechnen } from './manager-messung.mjs';

const DATEI = new URL('../tests/manager-gleichstand.json', import.meta.url);
const jetzt = gleichstandRechnen();

if (process.argv.includes('--neu')) {
  writeFileSync(DATEI, `${JSON.stringify({ laeufe: GLEICHSTAND, abdruecke: jetzt }, null, 2)}\n`);
  console.log('Fingerabdruecke neu geschrieben:', Object.keys(jetzt).length, 'Laeufe');
} else {
  const alt = JSON.parse(readFileSync(DATEI, 'utf8')).abdruecke;
  let abweichend = 0;
  for (const [lauf, abdruck] of Object.entries(jetzt)) {
    for (const teil of ['welt', 'mensch']) {
      const gleich = alt[lauf]?.[teil] === abdruck[teil];
      if (!gleich) abweichend++;
      console.log(`${gleich ? 'gleich ' : 'ANDERS '} ${lauf.padEnd(22)} ${teil.padEnd(6)} ${abdruck[teil]}`);
    }
  }
  process.exitCode = abweichend ? 1 : 0;
}
