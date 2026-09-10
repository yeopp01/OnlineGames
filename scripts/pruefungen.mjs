// PRUEFUNGEN: wie viele Tests es gibt, je Art - und welche Waechter in
// `npm run check` laufen.
//
// Der Fortschritt zaehlt Zeilen und Abnahmekriterien. Beides sagt nichts
// darueber, wie viel davon abgesichert ist. Getrennt nach Art, weil jede
// Art eine andere Frage beantwortet (→ docs/adr/0004-teststrategie.md).
//
// Gezaehlt wird der Arbeitsbaum, nicht die Historie. Und nicht gezaehlt wird,
// ob ein Test etwas taugt: eine Zahl hier ist ein Bestand, kein Nachweis.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { WURZEL, dateien } from './specs-lesen.mjs';

// Ein Testfall: test( und it( samt Modifikatoren, die einen FALL erzeugen.
// Nicht dabei: test.describe, test.beforeAll - das sind Gruppe und Haken.
const FALL = /^[ \t]*(?:it|test)(?:\.(?:only|skip|todo|serial|each))*\s*\(/gm;
// Ein Test, der den Server startet, laeuft ueber den echten Anfrageweg.
const STARTET_SERVER = /\bstarten\s*\(/;

/** Die Arten in der Reihenfolge, in der sie im Bericht stehen. */
export const ARTEN = [
  {
    id: 'rechenteile',
    name: 'Rechenteile',
    ordner: 'tests',
    endung: '.test.mjs',
    passt: (text) => !STARTET_SERVER.test(text),
    lauf: 'npm test',
    was: 'reine Rechnung ohne Naht: Karte, Wege, Kader, Spieltag, Liga',
  },
  {
    id: 'anfrageweg',
    name: 'Anfrageweg',
    ordner: 'tests',
    endung: '.test.mjs',
    passt: (text) => STARTET_SERVER.test(text),
    lauf: 'npm test',
    was: 'gegen den laufenden Server, ueber HTTP und WebSocket',
  },
  {
    id: 'waechter',
    name: 'Waechter-Tests',
    ordner: 'scripts',
    endung: '.test.mjs',
    passt: () => true,
    lauf: 'npm test',
    was: 'die Waechter selbst - sie entscheiden ueber gruen und rot',
  },
  {
    id: 'e2e',
    name: 'Browser',
    ordner: 'e2e/tests',
    endung: '.spec.mjs',
    passt: () => true,
    lauf: 'npm run test:e2e',
    was: 'Oberflaeche in Chromium, Bildnachweise - nur oertlich, nicht in der CI',
  },
];

/** Die Skripte, die `npm run check` ausfuehrt - durch `npm run` hindurch aufgeloest. */
export async function waechterKette() {
  const { scripts = {} } = JSON.parse(await readFile(join(WURZEL, 'package.json'), 'utf8'));
  const gefunden = new Set();
  const besucht = new Set();
  const folgen = (name) => {
    if (besucht.has(name) || !scripts[name]) return;
    besucht.add(name);
    for (const t of scripts[name].matchAll(/node\s+(scripts\/[\w./-]+\.mjs)/g)) gefunden.add(t[1]);
    for (const t of scripts[name].matchAll(/npm run ([\w:-]+)/g)) folgen(t[1]);
  };
  folgen('check');
  return [...gefunden].sort();
}

export async function pruefungen() {
  const arten = [];
  for (const art of ARTEN) {
    let anzahl = 0;
    let faelle = 0;
    for (const datei of await dateien(join(WURZEL, art.ordner), art.endung)) {
      const text = await readFile(datei, 'utf8');
      if (!art.passt(text)) continue;
      anzahl += 1;
      faelle += (text.match(FALL) ?? []).length;
    }
    arten.push({ id: art.id, name: art.name, lauf: art.lauf, was: art.was, dateien: anzahl, faelle });
  }
  return {
    arten,
    dateien: arten.reduce((n, a) => n + a.dateien, 0),
    faelle: arten.reduce((n, a) => n + a.faelle, 0),
    waechter: await waechterKette(),
  };
}
