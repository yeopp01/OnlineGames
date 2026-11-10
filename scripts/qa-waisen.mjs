#!/usr/bin/env node
// Bildnachweise ohne Erzeuger zeigen - und auf Wunsch wegraeumen.
//
//   npm run qa:waisen               # nur zeigen
//   npm run qa:waisen -- --loeschen # Bild und Bezugsdatei loeschen
//
// Eine Waise ist ein Bild, dessen Unterschrift, Testname oder Testdatei in
// keinem Test mehr steht - fast immer, weil ein Test seine Unterschrift
// geaendert hat. Der Lauf schreibt das Bild dann unter dem neuen Namen, das
// alte bleibt liegen, und `npm run specs:board` bricht mit "Beanstandungen"
// ab. `npm run qa:nachweis` (und damit `check:alles:neu`) raeumt sie vor dem
// Lauf von selbst weg (Rueckschau nach Runde 168).
import { rm } from 'node:fs/promises';
import { relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { pfadNetz, waisenSuchen, WURZEL } from './specs-lesen.mjs';

/** Loescht jede Waise samt Bild; gibt die Liste zurueck. */
export async function waisenRaeumen(ordner) {
  const waisen = await waisenSuchen(ordner);
  for (const w of waisen) {
    await rm(w.json, { force: true });
    await rm(w.png, { force: true });
  }
  return waisen;
}

const direkt = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (direkt) {
  const loeschen = process.argv.includes('--loeschen');
  const waisen = loeschen ? await waisenRaeumen() : await waisenSuchen();
  for (const w of waisen) console.log(`${loeschen ? 'geloescht' : 'Waise'}: ${pfadNetz(relative(WURZEL, w.png))}\n  ${w.grund}`);
  console.log(waisen.length ? `${waisen.length} Waise(n)${loeschen ? ' geloescht' : ' - mit --loeschen wegraeumen'}.` : 'Keine Waisen.');
}
