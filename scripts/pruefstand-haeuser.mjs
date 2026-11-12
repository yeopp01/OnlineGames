#!/usr/bin/env node
// Die Haeuser gegeneinander (spielziel AC-27, fahrplan AC-18): jede Paarung
// der fuenf Haeuser `--je` mal KI gegen KI, die Seiten abwechselnd, in vier
// Faeden nebeneinander.
//
//   npm run pruefstand:haeuser                      jede Paarung 20-mal, 200 Partien
//   npm run pruefstand:haeuser -- --nur eschenbruch nur die Paarungen eines Hauses
//   npm run pruefstand:haeuser -- --probe probe.cjs eine Austauschprobe wie bei pruefstand:vergleich
//
// Die Probe ist eine CommonJS-Datei `module.exports = (laden) => { ... }`;
// `laden('daten.js')` gibt die Module aus server/spiele/strategie/, und was
// sie dort aendert, gilt fuer jede Partie dieses Laufs - etwa
// `laden('daten.js').HAEUSER.eschenbruch.boni.sammeln.holz = 1.1`.
//
// Warum es das gibt: in Runde 176 gewann Eschenbruch 85 % seiner Partien und
// Distelhag 0 von 20 gegen Eschenbruch; jede Gegenprobe (ohne Holzbonus, ohne
// Reichweite, ohne Neigung) brauchte ein Wegwerfskript und 80 Partien.
//
// Zwanzig Partien je Paarung sind wenig: zwei gleich starke Haeuser enden
// in einer von vier Paarungen 13 zu 7 oder weiter auseinander. Belastbar ist
// die Quote je Haus ueber seine 80 Partien (Streuung rund 6 Punkte).
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const ORDNER = '../server/spiele/strategie/';

/** Je Paarung `je` Partien, die Seiten abwechselnd: Startwert -> { ki1, ki2 }. */
export function paarungen(namen, je) {
  const haeuser = {};
  let p = 0;
  for (let i = 0; i < namen.length; i++) {
    for (let k = i + 1; k < namen.length; k++, p++) {
      for (let j = 0; j < je; j++) {
        haeuser[p * je + j + 1] = j % 2 ? { ki1: namen[k], ki2: namen[i] } : { ki1: namen[i], ki2: namen[k] };
      }
    }
  }
  return haeuser;
}

/** Siege je Haus und je Paarung aus den Enden `{ haeuser, sieger }`. */
export function auswerten(enden) {
  const haus = {};
  const paar = {};
  let links = 0;
  for (const { haeuser, sieger } of enden) {
    const name = Object.values(haeuser).sort().join(' - ');
    paar[name] ??= Object.fromEntries(Object.values(haeuser).sort().map((h) => [h, 0]));
    for (const h of Object.values(haeuser)) {
      haus[h] ??= { siege: 0, partien: 0 };
      haus[h].partien += 1;
    }
    if (!sieger) continue;
    haus[haeuser[sieger]].siege += 1;
    paar[name][haeuser[sieger]] += 1;
    if (sieger === 'ki1') links += 1;
  }
  return { haus, paar, links };
}

if (!isMainThread) {
  const laden = (datei) => require(ORDNER + datei);
  if (workerData.probe) require(workerData.probe)(laden);
  const { partieSpielen } = laden('pruefstand.js');
  parentPort.postMessage(workerData.startwerte.map((startwert) => {
    const haeuser = workerData.haeuser[startwert];
    const { ende } = partieSpielen({ startwert, minuten: workerData.minuten, einstellungen: { haeuser } });
    return { startwert, haeuser, takt: ende ? ende.takt : null, sieger: ende ? ende.sieger : null };
  }));
} else if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const wert = (name, vorgabe) => {
    const i = process.argv.indexOf(`--${name}`);
    return i < 0 ? vorgabe : process.argv[i + 1];
  };
  const je = Number(wert('je', 20));
  const faeden = Number(wert('faeden', 4));
  const minuten = Number(wert('minuten', 90));
  const nur = wert('nur', null);
  const probe = wert('probe', null);
  const { HAEUSER } = require(ORDNER + 'daten.js');
  if (nur && !HAEUSER[nur]) {
    console.error(`Kein Haus "${nur}" - es gibt ${Object.keys(HAEUSER).join(', ')}.`);
    process.exit(1);
  }
  const haeuser = paarungen(Object.keys(HAEUSER), je);
  const startwerte = Object.keys(haeuser).map(Number).filter((s) => !nur || Object.values(haeuser[s]).includes(nur));
  const teile = Array.from({ length: faeden }, (_, i) => startwerte.filter((_, k) => k % faeden === i));
  const t0 = Date.now();
  const enden = (await Promise.all(teile.map((teil) => new Promise((ok, fehler) => {
    const faden = new Worker(new URL(import.meta.url), {
      workerData: { startwerte: teil, haeuser, minuten, probe: probe && resolve(probe) },
    });
    faden.once('message', ok);
    faden.once('error', fehler);
  })))).flat();
  const { haus, paar, links } = auswerten(enden);
  const ohne = enden.filter((e) => !e.sieger).length;
  console.log(`${enden.length} Partien${probe ? ` mit Probe ${probe}` : ''}, ${((Date.now() - t0) / 1000).toFixed(0)} s - ohne Sieger ${ohne}, links gewonnen ${links}`);
  for (const [h, { siege, partien }] of Object.entries(haus).sort((a, b) => b[1].siege / b[1].partien - a[1].siege / a[1].partien)) {
    console.log(`  ${h.padEnd(12)} ${String(siege).padStart(3)} von ${partien}  ${(100 * siege / partien).toFixed(0).padStart(3)} %`);
  }
  for (const [name, s] of Object.entries(paar)) {
    const [a, b] = Object.keys(s);
    console.log(`  ${name.padEnd(26)} ${String(s[a]).padStart(2)} : ${s[b]}`);
  }
  const min = enden.map((e) => (e.takt ? e.takt / 600 : Infinity)).sort((x, y) => x - y);
  console.log(`  vor Minute 60: ${min.filter((m) => m < 60).length} von ${min.length}, Median ${min[Math.floor(min.length / 2)].toFixed(1)}`);
}
