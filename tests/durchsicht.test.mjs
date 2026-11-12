// Der Unterschied fuer die Durchsicht als Datei (scripts/durchsicht.mjs,
// Rueckschau nach Runde 163): geaenderte und neue Dateien, ohne Dokumente.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SKRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'durchsicht.mjs');

function lager() {
  const ordner = mkdtempSync(join(tmpdir(), 'durchsicht-'));
  const git = (...args) => spawnSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: ordner, encoding: 'utf8' });
  git('init', '-q');
  mkdirSync(join(ordner, 'server'));
  mkdirSync(join(ordner, 'docs'));
  writeFileSync(join(ordner, 'server', 'ki.js'), 'const a = 1;\n');
  writeFileSync(join(ordner, 'docs', 'notiz.md'), 'alt\n');
  git('add', '.');
  git('commit', '-q', '-m', 'erster');
  return { ordner, git };
}

function durchsicht(ordner, ...args) {
  const aus = join(ordner, 'aus.diff');
  const lauf = spawnSync(process.execPath, [SKRIPT, '--aus', aus, ...args], { cwd: ordner, encoding: 'utf8' });
  return { lauf, aus };
}

test('durchsicht: Geaendertes und Neues stehen in der Datei, Dokumente nicht', () => {
  const { ordner } = lager();
  try {
    writeFileSync(join(ordner, 'server', 'ki.js'), 'const a = 2;\n');
    writeFileSync(join(ordner, 'docs', 'notiz.md'), 'neu\n');
    mkdirSync(join(ordner, 'tests'));
    writeFileSync(join(ordner, 'tests', 'neu.test.mjs'), 'test1\r\ntest2\r\n');
    const { lauf, aus } = durchsicht(ordner);
    assert.equal(lauf.status, 0, lauf.stderr);
    const text = readFileSync(aus, 'utf8');
    assert.match(text, /-const a = 1;\n\+const a = 2;/);
    assert.match(text, /\+\+\+ b\/tests\/neu\.test\.mjs\n@@ -0,0 \+1,2 @@\n\+test1\n\+test2\n/);
    assert.doesNotMatch(text, /notiz\.md/);
    assert.match(lauf.stdout, /Durchsicht: .*aus\.diff/);
  } finally {
    rmSync(ordner, { recursive: true, force: true });
  }
});

test('durchsicht: mit Pfaden nur diese, ohne Aenderung ein Fehler', () => {
  const { ordner } = lager();
  try {
    writeFileSync(join(ordner, 'server', 'ki.js'), 'const a = 2;\n');
    writeFileSync(join(ordner, 'docs', 'notiz.md'), 'neu\n');
    const nurDocs = durchsicht(ordner, 'docs');
    assert.equal(nurDocs.lauf.status, 0, nurDocs.lauf.stderr);
    const text = readFileSync(nurDocs.aus, 'utf8');
    assert.match(text, /notiz\.md/);
    assert.doesNotMatch(text, /ki\.js/);
    assert.equal(durchsicht(ordner, 'tests').lauf.status, 1, 'unter tests/ ist nichts geaendert');
  } finally {
    rmSync(ordner, { recursive: true, force: true });
  }
});
