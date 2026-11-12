// Das Werkzeug fuer Gegenproben (scripts/gegenprobe.mjs, Rueckschau nach
// Runde 113): es ersetzt, laesst laufen und schreibt die Datei immer zurueck.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKRIPT = join(WURZEL, 'scripts', 'gegenprobe.mjs');

function probe(inhalt) {
  const ordner = mkdtempSync(join(WURZEL, 'qa', '.gegenprobe-'));
  const datei = join(ordner, 'probe.txt');
  writeFileSync(datei, inhalt, 'utf8');
  return { ordner, datei, relativ: relative(WURZEL, datei).replaceAll('\\', '/') };
}

test('gegenprobe: der Befehl sieht die neue Zeile, danach steht die alte wieder da - auch wenn er faellt', () => {
  const { ordner, datei, relativ } = probe('a\nALT\nb\n');
  try {
    // Der Befehl faellt genau dann, wenn er die neue Zeile sieht.
    const pruefen = `node -e "process.exit(require('fs').readFileSync('${relativ}','utf8').includes('NEU') ? 1 : 0)"`;
    const lauf = spawnSync(process.execPath, [SKRIPT, relativ, 'ALT', 'NEU', '--', pruefen], { cwd: WURZEL, encoding: 'utf8' });
    assert.equal(lauf.status, 0, lauf.stderr);
    assert.match(lauf.stdout, /GEFALLEN/, 'der Befehl sah die neue Zeile');
    assert.equal(readFileSync(datei, 'utf8'), 'a\nALT\nb\n', 'zurueckgeschrieben');
  } finally {
    rmSync(ordner, { recursive: true, force: true });
  }
});

test('gegenprobe: steht der Text nicht genau einmal da, aendert sie nichts', () => {
  const { ordner, datei, relativ } = probe('ALT ALT\n');
  try {
    const lauf = spawnSync(process.execPath, [SKRIPT, relativ, 'ALT', 'NEU', '--', 'node -e "0"'], { cwd: WURZEL, encoding: 'utf8' });
    assert.equal(lauf.status, 2);
    // Die Absage traegt dasselbe Wort wie das Ergebnis: ein Filter auf
    // "Gegenprobe" verschluckt sie nicht (Rueckschau nach Runde 188).
    assert.match(lauf.stderr, /^Gegenprobe: NICHT GELAUFEN/m);
    assert.equal(readFileSync(datei, 'utf8'), 'ALT ALT\n');
  } finally {
    rmSync(ordner, { recursive: true, force: true });
  }
});
