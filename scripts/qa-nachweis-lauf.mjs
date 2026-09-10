#!/usr/bin/env node
// Die Bildnachweise ausdruecklich neu erzeugen.
//
//   npm run qa:nachweis                  # alle
//   npm run qa:nachweis -- transfer      # nur aus passenden Testdateien
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
