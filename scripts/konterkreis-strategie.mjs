#!/usr/bin/env node
// Der Gefechtsstand des Strategiespiels (→ specs/10-strategie/fahrplan.md
// AC-9, AC-10): zwei Heere gleicher Kosten laufen aufeinander zu, der Rest
// ist die Simulation. Ohne Server, ohne Browser, jeder Takt geprueft.
//
//   npm run konterkreis:strategie
//   npm run konterkreis:strategie -- --startwerte 50 --budget 900 --minuten 8
//
// Je Paarung eine Zeile mit beiden Richtungen: wie oft der Konter gewinnt,
// wie lange das Gefecht dauert, wie viele uebrig bleiben. Ein Widerspruch in
// der Welt bricht ab und nennt Startwert und Takt; der Rueckgabewert ist 1.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { gefechtSpielen, kostenSumme, Widerspruch } = require('../server/spiele/strategie/pruefstand.js');

const argumente = process.argv.slice(2);
const zahl = (name, vorgabe) => {
  const i = argumente.indexOf(`--${name}`);
  const wert = i >= 0 ? Number(argumente[i + 1]) : vorgabe;
  if (!Number.isFinite(wert) || wert <= 0) {
    console.error(`--${name} braucht eine Zahl groesser null.`);
    process.exit(2);
  }
  return wert;
};
const startwerte = zahl('startwerte', 20);
const budget = zahl('budget', 600);
const minuten = zahl('minuten', 10);

// Der Konterkreis aus der Vorlage: links schlaegt rechts.
const KREIS = [
  ['speerkaempfer', 'spaeherreiter'],
  ['plaenkler', 'bogenschuetze'],
  ['bogenschuetze', 'speerkaempfer'],
  ['spaeherreiter', 'bogenschuetze'],
];

const mittelwert = (zahlen) => zahlen.reduce((a, b) => a + b, 0) / zahlen.length;

function reihe(links, rechts) {
  const dauer = [];
  let siege = 0;
  let ohneEnde = 0;
  const uebrig = [];
  for (let startwert = 1; startwert <= startwerte; startwert++) {
    const ergebnis = gefechtSpielen({ links, rechts, startwert, budget, minuten });
    if (ergebnis.sieger === 'links') siege += 1;
    if (!ergebnis.sieger) ohneEnde += 1;
    dauer.push(ergebnis.takte);
    uebrig.push(ergebnis.links.uebrig);
  }
  dauer.sort((a, b) => a - b);
  return { siege, ohneEnde, dauer, uebrig };
}

console.log(`Gefechtsstand: ${startwerte} Startwerte je Paarung, Budget ${budget}, bis zu ${minuten} Spielminuten`);
for (const art of new Set(KREIS.flat())) console.log(`  ${art}: ${kostenSumme(art)} Rohstoffe, also ${Math.floor(budget / kostenSumme(art))} Stueck`);
const beginn = Date.now();
let gebrochen = 0;
try {
  for (const [konter, ziel] of KREIS) {
    for (const [links, rechts] of [[konter, ziel], [ziel, konter]]) {
      const { siege, ohneEnde, dauer, uebrig } = reihe(links, rechts);
      const anteil = Math.round((siege / startwerte) * 100);
      const rolle = links === konter ? 'Konter' : 'gekontert';
      if (links === konter && anteil < 80) gebrochen += 1;
      console.log(`${links.padEnd(14)} gegen ${rechts.padEnd(14)} (${rolle.padEnd(9)}) ${String(siege).padStart(2)}/${startwerte} = ${String(anteil).padStart(3)} %, ohne Ende ${ohneEnde}, Takte ${dauer[0]} bis ${dauer[dauer.length - 1]} (Median ${dauer[dauer.length >> 1]}), uebrig ${mittelwert(uebrig).toFixed(1)}`);
    }
  }
} catch (fehler) {
  if (!(fehler instanceof Widerspruch)) throw fehler;
  console.error(fehler.message);
  process.exit(1);
}
console.log(`Fertig in ${((Date.now() - beginn) / 1000).toFixed(1)} s. Konter unter 80 %: ${gebrochen}.`);
if (gebrochen) process.exit(1);
