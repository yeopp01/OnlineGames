#!/usr/bin/env node
// Eine Gegenprobe gegen die alte Zeile (Rueckschau nach Runde 113): in einer
// Produktdatei einen Text ersetzen, einen Befehl laufen lassen, die Datei
// zurueckschreiben - immer, auch wenn der Befehl faellt, abbricht oder mit
// Strg+C beendet wird.
//
//   npm run gegenprobe -- <datei> <alt> <neu> -- <befehl ...>
//   npm run gegenprobe -- server/spiele/strategie/ki.js "this.erkunden(eigene);" "" -- node --test tests/strategie-ki-sicht.test.mjs
//   npm run gegenprobe -- <datei> --datei <ersatz.js> -- <befehl ...>   die ganze Datei tauschen
//
// `alt` muss genau einmal in der Datei stehen, sonst passiert nichts. Am Ende
// steht, ob der Befehl gefallen ist - bei einer Gegenprobe ist das der
// erwartete Ausgang - und dass die Datei wieder so ist wie vorher.
//
// Warum: in den Runden 110 bis 112 lief jede Gegenprobe und jeder Versuch
// "ohne diesen Teil" von Hand - Kopie, `sed`, zurueckkopieren -, acht Mal.
// In Runde 112 schob ein Zeitlimit den Befehl in den Hintergrund, bevor das
// Zurueckkopieren lief, und die KI-Datei blieb veraendert liegen.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const argumente = process.argv.slice(2);
const trenner = argumente.indexOf('--');
if (trenner < 2 || trenner === argumente.length - 1) {
  console.error('Aufruf: npm run gegenprobe -- <datei> <alt> <neu> -- <befehl ...>');
  console.error('    oder npm run gegenprobe -- <datei> --datei <ersatz> -- <befehl ...>');
  process.exit(2);
}
const [datei, ...aenderung] = argumente.slice(0, trenner);
const befehl = argumente.slice(trenner + 1);
const pfad = join(WURZEL, datei);
const vorher = readFileSync(pfad, 'utf8');

let nachher;
if (aenderung[0] === '--datei') {
  nachher = readFileSync(join(WURZEL, aenderung[1]), 'utf8');
} else {
  const [alt, neu = ''] = aenderung;
  const anzahl = vorher.split(alt).length - 1;
  if (anzahl !== 1) {
    console.error(`"${alt}" steht ${anzahl}-mal in ${datei}, nicht genau einmal - nichts geaendert.`);
    process.exit(2);
  }
  nachher = vorher.replace(alt, neu);
}

let zurueck = false;
const zurueckschreiben = () => {
  if (zurueck) return;
  writeFileSync(pfad, vorher, 'utf8');
  zurueck = true;
};
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    zurueckschreiben();
    process.exit(130);
  });
}
process.on('exit', zurueckschreiben);

writeFileSync(pfad, nachher, 'utf8');
let code;
try {
  const lauf = spawnSync(befehl.join(' '), { cwd: WURZEL, stdio: 'inherit', shell: true });
  code = lauf.status ?? 1;
} finally {
  zurueckschreiben();
}
const gleich = readFileSync(pfad, 'utf8') === vorher;
console.log(`\nGegenprobe: der Befehl ist ${code === 0 ? 'GRUEN' : 'GEFALLEN'} (${code}). ${datei} ist ${gleich ? 'wieder wie vorher' : 'NICHT WIE VORHER - von Hand pruefen'}.`);
process.exit(gleich ? 0 : 3);
