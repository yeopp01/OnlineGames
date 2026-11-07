#!/usr/bin/env node
// Der Pruefstand des Strategiespiels (→ specs/10-strategie/ki.md AC-7, AC-8):
// Partien KI gegen KI ohne Server und Browser, jeder Takt geprueft.
//
//   npm run pruefstand:strategie                      zwanzig Partien, je sechzehn Spielminuten
//   npm run pruefstand:strategie -- --partien 5 --minuten 3 --startwert 100 --spieler 4
//
// Je Partie eine Zeile: Startwert, Dauer, Kennzahlen je Spieler. Ein
// Widerspruch bricht ab und nennt Startwert und Takt; der Rueckgabewert ist
// dann 1.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { partieSpielen, Widerspruch } = require('../server/spiele/strategie/pruefstand.js');

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
const partien = zahl('partien', 20);
// Sechzehn Minuten, nicht zehn: in der zwoelften steigt die KI in die
// Feudalzeit auf (ki AC-9), und ein Lauf, der vorher endet, zeigt das nie.
const minuten = zahl('minuten', 16);
const erster = zahl('startwert', 1);
const spieler = zahl('spieler', 2);

const kurz = (p) => {
  const gebaeude = Object.entries(p.gebaeude).map(([art, n]) => `${n} ${art}`).join(', ');
  const feudal = p.feudalMinute === null ? 'Dunkle Zeit' : `Feudalzeit ab ${p.feudalMinute.toFixed(1)} min`;
  return `${p.name}: ${p.dorfbewohner} Dorfbewohner, ${p.kampf} Kampf (${p.einheiten}/${p.wohnraum}), ${feudal}, Holz ${p.holz}, Nahrung ${p.nahrung}, Gold ${p.gold}, Stein ${p.stein}; ${gebaeude}; abgewiesen ${p.abgewiesen}, laengste Untaetigkeit ${p.untaetigMax} s`;
};

console.log(`Pruefstand: ${partien} Partien, ${spieler} KI-Spieler, je ${minuten} Spielminuten, Startwerte ab ${erster}`);
const beginn = Date.now();
const dorfbewohner = [];
const feudalMinuten = [];
let ohneFeudalzeit = 0;
for (let n = 0; n < partien; n++) {
  const startwert = erster + n;
  try {
    const ergebnis = partieSpielen({ startwert, minuten, spieler });
    // Rechenzeit je Takt mitschreiben: ein Tempoverlust faellt so bei jedem Lauf auf
    // (Rueckschau nach Runde 54 - in Runde 51 kostete ein Takt 58 ms, unbemerkt).
    console.log(`Startwert ${startwert} · ${Math.round(ergebnis.dauerMs)} ms · ${ergebnis.takte} Takte · ${(ergebnis.dauerMs / ergebnis.takte).toFixed(3)} ms je Takt`);
    for (const p of ergebnis.spieler) {
      console.log(`  ${kurz(p)}`);
      dorfbewohner.push(p.dorfbewohner);
      if (p.feudalMinute === null) ohneFeudalzeit += 1;
      else feudalMinuten.push(p.feudalMinute);
    }
  } catch (fehler) {
    if (!(fehler instanceof Widerspruch)) throw fehler;
    console.error(fehler.message);
    console.error(`Nachspielen: npm run pruefstand:strategie -- --partien 1 --startwert ${fehler.startwert} --minuten ${minuten} --spieler ${spieler}`);
    process.exit(1);
  }
}
dorfbewohner.sort((a, b) => a - b);
const mitte = dorfbewohner[Math.floor(dorfbewohner.length / 2)];
console.log(`Fertig in ${((Date.now() - beginn) / 1000).toFixed(1)} s, keine Widersprueche. Dorfbewohner nach ${minuten} min: ${dorfbewohner[0]} bis ${dorfbewohner[dorfbewohner.length - 1]}, Median ${mitte}.`);
feudalMinuten.sort((a, b) => a - b);
if (feudalMinuten.length) {
  const m = feudalMinuten[Math.floor(feudalMinuten.length / 2)];
  console.log(`Feudalzeit: ${feudalMinuten[0].toFixed(1)} bis ${feudalMinuten[feudalMinuten.length - 1].toFixed(1)} min, Median ${m.toFixed(1)} min; ohne Aufstieg ${ohneFeudalzeit}.`);
} else {
  console.log(`Feudalzeit: kein Spieler ist in ${minuten} min aufgestiegen.`);
}
