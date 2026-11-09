// Waechter: `npm test` laeuft in zwei Abschnitten (Rueckschau nach Runde
// 152) - erst `tests/*.test.mjs` und `scripts/**`, danach `tests/partien/`,
// die ganzen Partien zu viert. Neben ihnen riss die Zeitmessung einheiten
// AC-31. Zwei Dinge koennen das still unterlaufen:
//
// 1. Eine Testdatei in einem anderen Unterordner von `tests/`. Die Belege
//    (scripts/specs-lesen.mjs) suchen rekursiv und faenden ihren Namen -
//    gelaufen waere sie nie. Ein Kriterium staende auf `fertig` mit einem
//    Test, den niemand faehrt.
// 2. Eine Zeitmessung in `tests/partien/`: dort laeuft sie neben vier
//    Prozessen, die je einen Kern voll auslasten.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = fileURLToPath(new URL('..', import.meta.url));
const TESTS = join(WURZEL, 'tests');
const ABSCHNITTE = ['tests', 'tests/partien'];

function dateien(ordner) {
  const raus = [];
  for (const eintrag of readdirSync(ordner)) {
    const pfad = join(ordner, eintrag);
    if (statSync(pfad).isDirectory()) raus.push(...dateien(pfad));
    else raus.push(pfad);
  }
  return raus;
}

const relativ = (pfad) => relative(WURZEL, pfad).split(sep).join('/');

test('jede Testdatei unter tests/ liegt in einem Ordner, den npm test faehrt', () => {
  const skript = JSON.parse(readFileSync(join(WURZEL, 'package.json'), 'utf8')).scripts.test;
  for (const ordner of ABSCHNITTE) assert.ok(skript.includes(`"${ordner}/*.test.mjs"`), `npm test faehrt ${ordner}/ nicht: ${skript}`);
  const fremd = dateien(TESTS)
    .filter((d) => d.endsWith('.test.mjs'))
    .map(relativ)
    .filter((d) => !ABSCHNITTE.includes(d.slice(0, d.lastIndexOf('/'))));
  assert.deepEqual(fremd, [], 'diese Testdateien liefen in keinem Abschnitt von npm test');
});

test('in tests/partien/ misst niemand Zeit', () => {
  const messend = dateien(join(TESTS, 'partien'))
    .filter((d) => d.endsWith('.mjs'))
    .filter((d) => /performance\.now|process\.hrtime/.test(readFileSync(d, 'utf8')))
    .map(relativ);
  assert.deepEqual(messend, [], 'Zeitmessungen gehoeren in den ersten Abschnitt, nicht neben die Partien zu viert');
});
