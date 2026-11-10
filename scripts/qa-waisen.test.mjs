// Waisen raeumen (Rueckschau nach Runde 168): nur Bilder ohne Erzeuger
// verschwinden, eines mit Erzeuger bleibt - sonst loeschte der Lauf, der alle
// Bilder neu schreibt, vorher die Haelfte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { waisenRaeumen } from './qa-waisen.mjs';

// Diese Datei ist selbst der "Erzeuger": ihre Zeichenketten sind die
// Unterschriften, die es noch gibt.
const ERZEUGER = 'scripts/qa-waisen.test.mjs';
const LEBENDIG = 'Eine Unterschrift, die es in diesem Test gibt';

test('qa:waisen loescht Bilder ohne Erzeuger und laesst die anderen stehen', async () => {
  const ordner = await mkdtemp(join(tmpdir(), 'waisen-'));
  try {
    const paar = async (name, bezug) => {
      await writeFile(join(ordner, `${name}.json`), JSON.stringify(bezug));
      await writeFile(join(ordner, `${name}.png`), 'kein Bild');
    };
    await paar('lebt', { datei: ERZEUGER, pfad: [LEBENDIG], titel: LEBENDIG });
    await paar('alt', { datei: ERZEUGER, pfad: [LEBENDIG], titel: ['Eine Unterschrift', 'von gestern'].join(' ') });
    // (zusammengesetzt, sonst stuende sie hier als Zeichenkette und haette
    // einen Erzeuger)
    await paar('weg', { datei: 'e2e/tests/gibt-es-nicht.spec.mjs', pfad: ['x'], titel: 'x' });

    const geloescht = await waisenRaeumen(ordner);
    assert.deepEqual(geloescht.map((w) => w.json.replace(/^.*[\\/]/, '')).sort(), ['alt.json', 'weg.json']);
    assert.ok(existsSync(join(ordner, 'lebt.png')) && existsSync(join(ordner, 'lebt.json')), 'das Bild mit Erzeuger bleibt');
    for (const name of ['alt', 'weg']) {
      assert.ok(!existsSync(join(ordner, `${name}.png`)) && !existsSync(join(ordner, `${name}.json`)), `${name} ist weg`);
    }
  } finally {
    await rm(ordner, { recursive: true, force: true });
  }
});
