#!/usr/bin/env node
// Die Bilder des Spiels neu rendern (ADR-0014).
//
//   npm run bilder                 alle Modelle
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
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');

function blenderFinden() {
  if (process.env.BLENDER) return process.env.BLENDER;
  const ordner = 'C:\\Program Files\\Blender Foundation';
  if (existsSync(ordner)) {
    const fassungen = readdirSync(ordner).filter((n) => existsSync(join(ordner, n, 'blender.exe'))).sort();
    if (fassungen.length) return join(ordner, fassungen.at(-1), 'blender.exe');
  }
  return 'blender';
}

const blender = blenderFinden();
const lauf = spawnSync(blender, ['-b', '-P', join(wurzel, 'grafik', 'bilder.py'), '--', ...process.argv.slice(2)], {
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
});
if (lauf.error) {
  console.error(`Blender laesst sich nicht starten (${blender}): ${lauf.error.message}`);
  console.error('Installieren (winget install BlenderFoundation.Blender) oder BLENDER auf die Datei setzen.');
  process.exit(1);
}
const zeilen = `${lauf.stdout}\n${lauf.stderr}`.split(/\r?\n/);
const wichtig = zeilen.filter((z) => /^BILD |Traceback|Error|^\s+File "|SystemExit|Kein Modell/.test(z));
console.log(wichtig.join('\n'));
if (lauf.status !== 0 || !wichtig.some((z) => z.startsWith('BILD '))) {
  console.error('Rendern fehlgeschlagen - die ganze Ausgabe:');
  console.error(zeilen.slice(-40).join('\n'));
  process.exit(1);
}

const ziel = join(wurzel, 'public', 'bilder');
let summe = 0;
for (const datei of readdirSync(ziel).sort()) {
  const groesse = statSync(join(ziel, datei)).size;
  summe += groesse;
  if (datei.endsWith('.png')) console.log(`${String(Math.round(groesse / 1024)).padStart(6)} KB  ${datei}`);
}
console.log(`${String(Math.round(summe / 1024)).padStart(6)} KB  zusammen`);
