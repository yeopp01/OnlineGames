#!/usr/bin/env node
// Welche Bildnachweise haben sich geaendert - und wie stark?
//
//   npm run qa:abweichung
//
// Wofuer: `npm run check:alles:neu` schreibt **jedes** Bild neu. Danach stehen
// Dutzende im `git status`, obwohl sich an den meisten nur der zufaellige
// Raumcode oder die laufende Spielzeit gedreht hat. Wer das mit einem
// pauschalen `git add` abtut, checkt irgendwann eine verdorbene Aufstellung
// mit ein; wer alle ansehen will, sieht keines richtig an.
//
// Gemessen in der Rueckschau nach Runde 78 (85 geaenderte Bilder): die
// Verteilung hat eine **Luecke**. Zehn Bilder lagen ueber 60 %, kein einziges
// zwischen 0,6 % und 60 %, die uebrigen 75 darunter - die meisten bei 0,08 %,
// das sind 135 x 18 Bildpunkte in 1280 x 720, also genau ein Raumcode.
//
// Der Grund fuer den Sprung: verschiebt sich die Kamera um drei Bildpunkte,
// aendert sich fast jeder Bildpunkt; aendert sich nur eine Beschriftung, fast
// keiner. Oben stehen also die Bilder, deren Kamera an laufenden Positionen
// haengt - und genau die sind die, bei denen eine Aufstellung kippen kann.
// Oben heisst nicht "kaputt", es heisst "ansehen". Darum die Grenze bei 1 %.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { bildAbweichung, pngLesen } from './png-lesen.mjs';
import { WURZEL } from './specs-lesen.mjs';

const ORDNER = 'qa/bildnachweise';
const GRENZE = Number(process.argv[2] ?? 1) / 100;

function git(...args) {
  return execFileSync('git', args, { cwd: WURZEL, encoding: 'utf8' });
}

/** Alle geaenderten und neuen Bilder unter qa/bildnachweise, ohne Doppelte. */
function betroffen() {
  const geaendert = git('diff', '--name-only', 'HEAD', '--', ORDNER);
  const neu = git('ls-files', '--others', '--exclude-standard', '--', ORDNER);
  const alle = `${geaendert}\n${neu}`.split('\n').map((z) => z.trim());
  return [...new Set(alle.filter((z) => z.endsWith('.png')))].sort();
}

/** Die eingecheckte Fassung einer Datei, oder null, wenn es keine gibt. */
function ausHead(pfad) {
  try {
    return execFileSync('git', ['show', `HEAD:${pfad}`], { cwd: WURZEL, maxBuffer: 64 << 20 });
  } catch {
    return null;
  }
}

const pfade = betroffen();
if (pfade.length === 0) {
  console.log('Keine geaenderten Bildnachweise.');
  process.exit(0);
}

const zeilen = [];
for (const pfad of pfade) {
  const jetzt = join(WURZEL, pfad);
  const vorher = ausHead(pfad);
  if (!existsSync(jetzt)) {
    zeilen.push({ pfad, anteil: 1, lage: 'geloescht' });
    continue;
  }
  if (!vorher) {
    zeilen.push({ pfad, anteil: 1, lage: 'neu' });
    continue;
  }
  try {
    const alt = pngLesen(vorher);
    const neu = pngLesen(jetzt);
    const anteil = bildAbweichung(alt, neu);
    const lage = (alt.breite !== neu.breite || alt.hoehe !== neu.hoehe)
      ? `${alt.breite}x${alt.hoehe} statt ${neu.breite}x${neu.hoehe}`
      : '';
    zeilen.push({ pfad, anteil, lage });
  } catch (fehler) {
    zeilen.push({ pfad, anteil: 1, lage: `nicht lesbar: ${fehler.message}` });
  }
}

zeilen.sort((a, b) => b.anteil - a.anteil);

const prozent = (anteil) => `${(anteil * 100).toFixed(2).padStart(6)} %`;
const kurz = (pfad) => relative(ORDNER, pfad).replaceAll('\\', '/');

const auffaellig = zeilen.filter((z) => z.anteil >= GRENZE);
const leise = zeilen.filter((z) => z.anteil < GRENZE);

console.log(`${zeilen.length} geaenderte Bildnachweise, Grenze ${(GRENZE * 100).toFixed(2)} %\n`);
console.log(`Ansehen (${auffaellig.length}):`);
for (const z of auffaellig) console.log(`  ${prozent(z.anteil)}  ${kurz(z.pfad)}${z.lage ? `  (${z.lage})` : ''}`);
if (auffaellig.length === 0) console.log('  - keines -');
console.log(`\nWohl nur Raumcode, Uhr oder Zaehler (${leise.length}):`);
for (const z of leise.slice(0, 5)) console.log(`  ${prozent(z.anteil)}  ${kurz(z.pfad)}`);
if (leise.length > 5) console.log(`  ... und ${leise.length - 5} weitere unter ${prozent(leise[5].anteil).trim()}`);
if (leise.length === 0) console.log('  - keines -');
console.log('\nDie oberen mit dem Read-Werkzeug ansehen, bevor etwas eingecheckt wird.');
