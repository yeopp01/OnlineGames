#!/usr/bin/env node
// Der Unterschied fuer die Durchsicht als Datei (Rueckschau nach Runde 163).
// Der Pruefer (`feature-dev:code-reviewer`) hat keine Shell: wer ihm sagt
// "fuehre git diff aus", bekommt eine Durchsicht der ganzen Dateien statt
// des Unterschieds. Die Anweisung verlangte die Datei seit Runde 97 - von
// Runde 151 bis 162 lag trotzdem keine mehr im Temp-Ordner, und neue Dateien
// (der Test der Runde) fehlten in `git diff` ohnehin.
//
//   npm run durchsicht                       alles Geaenderte und Neue ausser docs/, specs/, qa/, *.md
//   npm run durchsicht -- <pfad> [<pfad> …]  nur diese Dateien oder Ordner
//   npm run durchsicht -- --aus <datei> …    wohin (Vorgabe: Temp-Ordner)
//
// Geaenderte Dateien kommen als `git diff HEAD` (vorgemerkt und nicht),
// neue, noch nicht verfolgte als Unterschied gegen leer. Am Ende stehen der
// Pfad - der gehoert in den Auftrag - und je Datei die Zahl der Zeilen.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const argumente = process.argv.slice(2);
let aus = join(tmpdir(), 'onlinegames-durchsicht.diff');
const pfade = [];
for (let i = 0; i < argumente.length; i++) {
  if (argumente[i] === '--aus') aus = resolve(argumente[++i]);
  else pfade.push(argumente[i]);
}

function git(...args) {
  const lauf = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (lauf.status !== 0) {
    console.error(`git ${args.join(' ')} fiel:\n${lauf.stderr}`);
    process.exit(2);
  }
  return lauf.stdout;
}

// Was nicht Produkt ist: Erkenntnisse, Specs, Bilder, Bericht.
const DOKUMENT = /^(docs|specs|qa)\/|\.md$/;
const zeilen = (text) => text.split('\n').filter((z) => z !== '');
const gewaehlt = (datei) => (pfade.length
  ? pfade.some((p) => datei === p.replaceAll('\\', '/') || datei.startsWith(p.replaceAll('\\', '/').replace(/\/?$/, '/')))
  : !DOKUMENT.test(datei));

const geaendert = zeilen(git('diff', 'HEAD', '--name-only')).filter(gewaehlt);
const neu = zeilen(git('ls-files', '--others', '--exclude-standard')).filter(gewaehlt);

const teile = [];
const uebersicht = [];
if (geaendert.length) {
  for (const datei of geaendert) {
    const teil = git('diff', 'HEAD', '--', datei);
    teile.push(teil);
    uebersicht.push(`  geaendert ${datei} (${zeilen(teil).length} Zeilen)`);
  }
}
for (const datei of neu) {
  const inhalt = readFileSync(datei, 'utf8').replace(/\r\n/g, '\n');
  const koerper = inhalt.endsWith('\n') ? inhalt.slice(0, -1) : inhalt;
  const reihen = koerper.split('\n');
  teile.push(`diff --git a/${datei} b/${datei}\nnew file\n--- /dev/null\n+++ b/${datei}\n@@ -0,0 +1,${reihen.length} @@\n${reihen.map((r) => `+${r}`).join('\n')}\n`);
  uebersicht.push(`  neu       ${datei} (${reihen.length} Zeilen)`);
}

if (!teile.length) {
  console.error('Nichts zur Durchsicht: keine geaenderte oder neue Datei' + (pfade.length ? ` unter ${pfade.join(', ')}` : ' ausser Dokumenten') + '.');
  process.exit(1);
}
writeFileSync(aus, teile.join(''), 'utf8');
console.log(uebersicht.join('\n'));
console.log(`\nDurchsicht: ${aus}`);
console.log('Diesen Pfad in den Auftrag schreiben - der Pruefer hat keine Shell.');
