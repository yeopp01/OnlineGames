#!/usr/bin/env node
// Eine Partie KI gegen KI Minute fuer Minute (Rueckschau nach Runde 98).
//
//   npm run pruefstand:verlauf -- --startwert 5                 jede Minute, bis 90
//   npm run pruefstand:verlauf -- --startwert 5 --ab 40 --alle 2 --minuten 70
//
// Warum es das gibt: in den Runden 94 bis 97 begann jede Runde mit derselben
// Frage - warum endet diese Partie so spaet? - und jedes Mal mit einem neuen
// Wegwerfskript im Temp-Ordner, das je Minute Dorfbewohner, Heer, Gebaeude und
// Vorrat ausgab. Vier Skripte fuer eine Frage. Die Antwort war jedes Mal in
// diesen Zeilen zu sehen: eine Hausbaustelle ohne Bauer (Runde 94), ein Sieger,
// der je acht schickt, waehrend 85 daheim stehen (Runde 96), ein Verlierer
// ohne jede Einheit, dessen Gebaeude achteinhalb Minuten fallen (Runde 97).
//
// Je Spieler und Zeile:
//   z  Zeitalter · d  Dorfbewohner · k  Kampfeinheiten, darunter
//   daheim (unter 20 Feldern von der eigenen Basis) und draussen, und wie viele
//   davon auf eine Einheit oder ein Gebaeude einschlagen · g  Gebaeude mit
//   ihrem Leben zusammen · N H G S  der Vorrat.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { partieSpielen } = require('../server/spiele/strategie/pruefstand.js');
const { EINHEITEN } = require('../server/spiele/strategie/daten.js');
const { TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');

const argumente = process.argv.slice(2);
const wert = (name, vorgabe) => {
  const i = argumente.indexOf(`--${name}`);
  return i >= 0 ? Number(argumente[i + 1]) : vorgabe;
};
const startwert = wert('startwert', NaN);
if (!Number.isFinite(startwert)) {
  console.error('Bitte --startwert angeben, etwa: npm run pruefstand:verlauf -- --startwert 5');
  process.exit(1);
}
const minuten = wert('minuten', 90);
const ab = wert('ab', 0);
const alle = wert('alle', 1);
const TAKTE_JE_MINUTE = 60 * TAKTE_PRO_SEKUNDE;
const DAHEIM = 20;

function zeile(welt) {
  return welt.spieler.map((s) => {
    let dorf = 0;
    const kampf = { daheim: 0, draussen: 0, aufEinheit: 0, aufGebaeude: 0 };
    for (const e of welt.einheiten.values()) {
      if (e.besitzer !== s.id || e.tot) continue;
      if ((EINHEITEN[e.art].klassen || []).includes('dorf')) {
        dorf += 1;
        continue;
      }
      kampf[Math.hypot(e.x - s.basis.x, e.y - s.basis.y) < DAHEIM ? 'daheim' : 'draussen'] += 1;
      if (e.auftrag?.art === 'angreifen') kampf[welt.gebaeude.has(e.auftrag.ziel) ? 'aufGebaeude' : 'aufEinheit'] += 1;
    }
    let gebaeude = 0;
    let leben = 0;
    for (const g of welt.gebaeude.values()) {
      if (g.besitzer !== s.id) continue;
      gebaeude += 1;
      leben += g.leben;
    }
    const k = kampf.daheim + kampf.draussen;
    const r = (x) => Math.round(s[x]);
    return `${s.id}${s.aus ? ' AUS' : ''} z${s.zeitalter} d${dorf} k${k} (${kampf.daheim} daheim, ${kampf.draussen} draussen;`
      + ` ${kampf.aufEinheit} auf Einheit, ${kampf.aufGebaeude} auf Gebaeude) g${gebaeude}/${Math.round(leben)}`
      + ` N${r('nahrung')} H${r('holz')} G${r('gold')} S${r('stein')}`;
  }).join('  |  ');
}

const r = partieSpielen({
  startwert,
  minuten,
  eingriff: (welt, takt) => {
    if (takt % (alle * TAKTE_JE_MINUTE) !== 0 || takt < ab * TAKTE_JE_MINUTE) return;
    console.log(`${String(takt / TAKTE_JE_MINUTE).padStart(3)}  ${zeile(welt)}`);
  },
});
console.log(`Ende: ${r.ende ? `${(r.ende.takt / TAKTE_JE_MINUTE).toFixed(1)} min, Sieger ${r.sieger || '-'}` : `nach ${minuten} min nicht entschieden`}`);
console.log(`     ${zeile(r.welt)}`);
