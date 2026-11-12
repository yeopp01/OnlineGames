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
// Je Haus zaehlt es mit, was es herstellt: Kampfeinheiten und Dorfbewohner,
// die nach dem Start dazukamen, und fertige Gebaeude, die Einheiten
// ausbilden. In Runde 177 stand die Frage "verliert es, weil es das Falsche
// ausbildet, oder weil es zu wenig ausbildet?" erst nach einer Runde Bauen -
// die Antwort war 127 gegen 226 Kampfeinheiten, gezaehlt mit einem
// Wegwerfskript.
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

/**
 * Zaehlt, was seit dem letzten Aufruf dazukam, je Spieler in `stand.je`:
 * `kampf` (Einheiten mit Angriff, keine Dorfbewohner), `dorf`, `gebaeude`
 * (fertige, die Einheiten ausbilden, ohne Dorfzentrum) und `arten`. Was beim
 * ersten Aufruf steht, ist der Start und zaehlt nicht.
 */
export function zaehlen(welt, stand, { EINHEITEN, GEBAEUDE }) {
  stand.einheiten ??= new Set();
  stand.gebaeude ??= new Set();
  stand.je ??= {};
  const erstes = !stand.begonnen;
  stand.begonnen = true;
  const von = (id) => (stand.je[id] ??= { kampf: 0, dorf: 0, gebaeude: 0, arten: {} });
  for (const e of welt.einheiten.values()) {
    if (stand.einheiten.has(e.id)) continue;
    stand.einheiten.add(e.id);
    if (erstes) continue;
    const werte = EINHEITEN[e.art];
    const z = von(e.besitzer);
    if ((werte.klassen || []).includes('dorf')) z.dorf += 1;
    else if (werte.angriff > 0) z.kampf += 1;
    z.arten[e.art] = (z.arten[e.art] || 0) + 1;
  }
  for (const g of welt.gebaeude.values()) {
    if (!g.fertig || stand.gebaeude.has(g.id)) continue;
    stand.gebaeude.add(g.id);
    if (erstes || g.art === 'dorfzentrum') continue;
    if (!(GEBAEUDE[g.art].bildetAus || []).some((art) => EINHEITEN[art])) continue;
    von(g.besitzer).gebaeude += 1;
  }
}

/**
 * Siege je Haus und je Paarung aus den Enden `{ haeuser, sieger, zaehlung }`;
 * mit `zaehlung` (je Spieler aus `zaehlen`) dazu die Summen je Haus.
 */
export function auswerten(enden) {
  const haus = {};
  const paar = {};
  let links = 0;
  for (const { haeuser, sieger, zaehlung } of enden) {
    const name = Object.values(haeuser).sort().join(' - ');
    paar[name] ??= Object.fromEntries(Object.values(haeuser).sort().map((h) => [h, 0]));
    for (const [spieler, h] of Object.entries(haeuser)) {
      haus[h] ??= { siege: 0, partien: 0, kampf: 0, dorf: 0, gebaeude: 0 };
      haus[h].partien += 1;
      const z = zaehlung && zaehlung[spieler];
      if (z) for (const k of ['kampf', 'dorf', 'gebaeude']) haus[h][k] += z[k];
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
  const daten = laden('daten.js');
  parentPort.postMessage(workerData.startwerte.map((startwert) => {
    const haeuser = workerData.haeuser[startwert];
    const stand = {};
    // Alle fuenf Spielsekunden: eine Einheit lebt laenger, und ein Gebaeude
    // faellt nicht im selben Atemzug, in dem es fertig wird.
    const eingriff = (welt) => { if (welt.takt % 50 === 0) zaehlen(welt, stand, daten); };
    const { ende } = partieSpielen({ startwert, minuten: workerData.minuten, einstellungen: { haeuser }, eingriff });
    return { startwert, haeuser, takt: ende ? ende.takt : null, sieger: ende ? ende.sieger : null, zaehlung: stand.je || {} };
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
  console.log('  Haus          Siege        je Partie: Kampfeinheiten, Dorfbewohner, Ausbildungsgebaeude');
  for (const [h, { siege, partien, kampf, dorf, gebaeude }] of Object.entries(haus).sort((a, b) => b[1].siege / b[1].partien - a[1].siege / a[1].partien)) {
    const je = (n) => (n / partien).toFixed(0).padStart(4);
    console.log(`  ${h.padEnd(12)} ${String(siege).padStart(3)} von ${partien}  ${(100 * siege / partien).toFixed(0).padStart(3)} %   ${je(kampf)} ${je(dorf)} ${(gebaeude / partien).toFixed(1).padStart(5)}`);
  }
  for (const [name, s] of Object.entries(paar)) {
    const [a, b] = Object.keys(s);
    console.log(`  ${name.padEnd(26)} ${String(s[a]).padStart(2)} : ${s[b]}`);
  }
  const min = enden.map((e) => (e.takt ? e.takt / 600 : Infinity)).sort((x, y) => x - y);
  console.log(`  vor Minute 60: ${min.filter((m) => m < 60).length} von ${min.length}, Median ${min[Math.floor(min.length / 2)].toFixed(1)}`);
}
