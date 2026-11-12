#!/usr/bin/env node
// Die Bildnachweise ausdruecklich neu erzeugen.
//
//   npm run qa:nachweis                  # alle
//   npm run qa:nachweis -- transfer      # nur aus passenden Testdateien
//
// Meist will man danach ohnehin pruefen. Dafuer gibt es
// `npm run check:alles:neu` (und `:neu:kurz`): **ein** Browserlauf, der jedes
// Bild neu schreibt, danach `npm run check` ohne Browser. Vorher waren es
// zwei Browserlaeufe hintereinander - erst Bilder, dann `check:alles` -, und
// das kostete in den Runden 76 und 77 je neun Minuten umsonst (Rueckschau
// nach Runde 78).
//
// Der gewoehnliche Lauf (`npm run test:e2e`) schreibt nur Bilder, die FEHLEN.
// Warum, steht in scripts/qa-nachweis.mjs. Dieser Aufruf ist die Ansage
// "jetzt bitte doch alle" - nach einer Aenderung an der Oberflaeche, vor
// dem Einchecken.
//
// Ein eigenes Skript und kein `QA_NACHWEIS=1 npm run test:e2e`: das setzt
// unter Windows keine Umgebungsvariable, sondern bricht ab.
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { WURZEL } from './specs-lesen.mjs';
import { waisenRaeumen } from './qa-waisen.mjs';

// Vor dem Lauf: Bilder ohne Erzeuger weg (Rueckschau nach Runde 168). Hat
// ein Test seine Unterschrift geaendert, schreibt dieser Lauf das Bild unter
// dem neuen Namen; das alte bliebe liegen, und `specs:board` braeche ab.
for (const w of await waisenRaeumen()) console.log(`Waise geloescht: ${w.png}
  ${w.grund}`);

const kind = spawn(
  process.execPath,
  [
    join(WURZEL, 'node_modules', '@playwright', 'test', 'cli.js'),
    'test',
    '--config',
    join(WURZEL, 'e2e', 'playwright.config.mjs'),
    ...process.argv.slice(2),
  ],
  { cwd: WURZEL, stdio: 'inherit', env: { ...process.env, QA_NACHWEIS: '1' } },
);

kind.on('exit', (code) => process.exit(code ?? 1));
