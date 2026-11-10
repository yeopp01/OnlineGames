#!/usr/bin/env node
// Die Bilder des Spiels neu rendern (ADR-0014, darstellung AC-18).
//
//   npm run bilder                 alle Modelle aus grafik/verzeichnis.json
//   npm run bilder -- haus baum    nur diese
//
// Startet Blender ohne Oberflaeche mit grafik/bilder.py. Blender ist ein
// Werkzeug auf dem Rechner wie der Browser fuer Playwright: nicht in
// package.json, nicht in der CI. Die Bilder unter public/bilder/ sind
// eingecheckt; `npm run check` kommt ohne Blender aus.
//
// Wo Blender liegt: Umgebungsvariable BLENDER, sonst der uebliche Ort unter
// Windows, sonst `blender` im Pfad.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { BILDER, GRAFIK, bestandLesen, modelleWaehlen, quellenPruefen, verzeichnisPruefen } from './bilder-verzeichnis.mjs';

function blenderFinden() {
  if (process.env.BLENDER) return process.env.BLENDER;
  const ordner = 'C:\\Program Files\\Blender Foundation';
  if (existsSync(ordner)) {
    const fassungen = readdirSync(ordner).filter((n) => existsSync(join(ordner, n, 'blender.exe'))).sort();
    if (fassungen.length) return join(ordner, fassungen.at(-1), 'blender.exe');
  }
  return 'blender';
}

const argumente = process.argv.slice(2);
const schalter = argumente.filter((a) => a.startsWith('--'));
const { verzeichnis } = bestandLesen();
let namen;
try {
  namen = modelleWaehlen(verzeichnis, argumente.filter((a) => !a.startsWith('--')));
} catch (fehler) {
  console.error(fehler.message);
  process.exit(1);
}

const blender = blenderFinden();
const beginn = Date.now();
const lauf = spawnSync(blender, ['-b', '-P', join(GRAFIK, 'bilder.py'), '--', ...namen, ...schalter], {
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
});
if (lauf.error) {
  console.error(`Blender laesst sich nicht starten (${blender}): ${lauf.error.message}`);
  console.error('Installieren (winget install BlenderFoundation.Blender) oder BLENDER auf die Datei setzen.');
  process.exit(1);
}
const zeilen = `${lauf.stdout}\n${lauf.stderr}`.split(/\r?\n/);
const wichtig = zeilen.filter((z) => /^BILD |Traceback|Error|^\s+File "|SystemExit|Kein Modell|schwarz/.test(z));
console.log(wichtig.join('\n'));
if (lauf.status !== 0 || !wichtig.some((z) => z.startsWith('BILD '))) {
  console.error('Rendern fehlgeschlagen - die ganze Ausgabe:');
  console.error(zeilen.slice(-40).join('\n'));
  process.exit(1);
}

// Mit `--ziel=` schreibt die Kette woandershin (Vorschau, Messung) - dann ist
// unter public/bilder/ nichts neu, und zu pruefen gibt es dort nichts.
if (schalter.some((s) => s.startsWith('--ziel='))) process.exit(0);

let summe = 0;
for (const datei of readdirSync(BILDER).sort()) {
  const groesse = statSync(join(BILDER, datei)).size;
  summe += groesse;
  if (!datei.endsWith('.json')) console.log(`${String(Math.round(groesse / 1024)).padStart(6)} KB  ${datei}`);
}
console.log(`${String(Math.round(summe / 1024)).padStart(6)} KB  zusammen`);

// Hat der Lauf geschrieben, was das Verzeichnis verspricht? Ein Bild, das
// aelter ist als der Lauf, hat das Skript nicht (mehr) erzeugt.
const bestand = bestandLesen();
const funde = [...verzeichnisPruefen(bestand), ...quellenPruefen(bestand)];
for (const modell of verzeichnis.modelle.filter((m) => namen.includes(m.name))) {
  for (const bild of modell.bilder) {
    const pfad = join(BILDER, bild);
    if (existsSync(pfad) && statSync(pfad).mtimeMs < beginn - 2000) funde.push(`${modell.name}: ${bild} steht im Verzeichnis, wurde aber von grafik/${modell.skript} nicht neu geschrieben`);
  }
}
if (funde.length) {
  console.error(`Das Verzeichnis passt nicht zu den Bildern:\n  ${funde.join('\n  ')}`);
  process.exit(1);
}
