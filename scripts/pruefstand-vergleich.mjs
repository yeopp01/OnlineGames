#!/usr/bin/env node
// Vorher und nachher im Pruefstand (Rueckschau nach Runde 92): derselbe Satz
// Partien mit dem Arbeitsstand und mit einem eingecheckten Stand, Zeile neben
// Zeile.
//
//   npm run pruefstand:vergleich                          Arbeitsstand gegen HEAD, 20 Partien, 22 min
//   npm run pruefstand:vergleich -- --gegen HEAD~3 --minuten 30 --partien 20
//
// Warum es das gibt: in den Runden 89 bis 92 wurde jede Wirkung von Hand
// verglichen - mit `git stash`, mit Kopien des Ordners im Temp-Verzeichnis, mit
// Wegwerfskripten. Drei Abhilfen fuer die Beeren, eine groessere Ruecklage und
// zwei Hebel fuer fahrplan AC-11 zeigten so, dass sie nichts bringen. Das
// Werkzeug macht den Vergleich zu einem Befehl.
//
// Der eingecheckte Stand wird aus Git in einen eigenen Ordner geschrieben
// (nur server/spiele/strategie/) und dort geladen; der Arbeitsstand bleibt,
// wie er ist.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const WURZEL = fileURLToPath(new URL('../', import.meta.url));
const ORDNER = 'server/spiele/strategie';

const argumente = process.argv.slice(2);
const wert = (name, vorgabe) => {
  const i = argumente.indexOf(`--${name}`);
  return i >= 0 ? argumente[i + 1] : vorgabe;
};
const gegen = wert('gegen', 'HEAD');
const minuten = Number(wert('minuten', 22));
const partien = Number(wert('partien', 20));
const erster = Number(wert('startwert', 1));

// Den Stand `gegen` in einen Temp-Ordner schreiben.
const git = (...a) => execFileSync('git', a, { cwd: WURZEL, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const ziel = mkdtempSync(join(tmpdir(), 'pruefstand-vergleich-'));
for (const datei of git('ls-tree', '-r', '--name-only', gegen, ORDNER).split('\n').filter(Boolean)) {
  const pfad = join(ziel, datei);
  mkdirSync(join(pfad, '..'), { recursive: true });
  writeFileSync(pfad, git('show', `${gegen}:${datei}`));
}

const laden = (wurzel) => createRequire(pathToFileURL(join(wurzel, 'x.mjs')).href)(`./${ORDNER}/pruefstand.js`);
const staende = [
  { name: gegen, pruefstand: laden(ziel) },
  { name: 'Arbeitsstand', pruefstand: laden(WURZEL) },
];

const median = (a) => {
  const z = a.filter((x) => x !== null && Number.isFinite(x)).sort((x, y) => x - y);
  return z.length ? z[Math.floor(z.length / 2)] : null;
};
const zahl = (x, stellen = 1) => (x === null ? '-' : x.toFixed(stellen));

for (const stand of staende) {
  const t0 = performance.now();
  const werte = { feudal: [], angriff: [], dorf: [], kampf: [], angriffe: [], untaetig: [], sieger: 0, ende: [] };
  let widerspruch = null;
  for (let startwert = erster; startwert < erster + partien; startwert++) {
    try {
      const r = stand.pruefstand.partieSpielen({ startwert, minuten });
      if (r.ende?.sieger) {
        werte.sieger += 1;
        werte.ende.push(r.ende.takt / 600);
      }
      for (const p of r.spieler) {
        werte.feudal.push(p.feudalMinute);
        werte.angriff.push(p.angriffMinute);
        werte.dorf.push(p.dorfbewohner);
        werte.kampf.push(p.kampf);
        werte.angriffe.push(p.angriffe);
        werte.untaetig.push(p.untaetigMax);
      }
    } catch (fehler) {
      widerspruch = fehler.message;
      break;
    }
  }
  // Die Rechenzeit ist zwischen den Staenden nicht vergleichbar: der erste Lauf
  // waermt V8 auf (gemessen: 6,8 s gegen 1,9 s fuer dieselbe Arbeit).
  const sek = ((performance.now() - t0) / 1000).toFixed(1);
  console.log(`${stand.name.padEnd(13)} ${partien} Partien, ${minuten} min, ${sek} s Rechenzeit (nur innerhalb eines Standes vergleichbar)`
    + (widerspruch ? `\n  WIDERSPRUCH: ${widerspruch}` : '')
    + `\n  Feudalzeit Median ${zahl(median(werte.feudal))} min, erstes Heer Median ${zahl(median(werte.angriff))} min`
    + `\n  Dorfbewohner am Ende ${Math.min(...werte.dorf)} bis ${Math.max(...werte.dorf)}, Median ${median(werte.dorf)}`
    + `; Kampfeinheiten Median ${median(werte.kampf)}; Angriffe Median ${median(werte.angriffe)}`
    + `\n  laengste Untaetigkeit ${zahl(Math.max(...werte.untaetig))} s`
    + `; mit Sieger ${werte.sieger}/${partien}${werte.ende.length ? `, Ende Median ${zahl(median(werte.ende))} min` : ''}`
    // fahrplan AC-11 fragt nach dieser Zahl: entschieden vor Spielminute 60.
    + `, vor Minute 60: ${werte.ende.filter((m) => m < 60).length}/${partien}`
    + (werte.ende.length ? `
  Enden ${[...werte.ende].sort((a, b) => a - b).map((m) => m.toFixed(1)).join(' ')}` : ''));
}
rmSync(ziel, { recursive: true, force: true });
