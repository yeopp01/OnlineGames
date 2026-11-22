// npm run manager:messen [-- --saisons 2 --startwerte 4711,20260910,77 --json]
// Die Kennzahlen des Managerspiels ohne Menschen, gemittelt ueber Startwerte.
// Wer an WIRKUNG in spieltag.js oder an der Welt dreht, misst vorher und nachher.
import { kennzahlen, laufen } from './manager-messung.mjs';

const argumente = process.argv.slice(2);
const wert = (name, vorgabe) => {
  const i = argumente.indexOf(`--${name}`);
  return i >= 0 ? argumente[i + 1] : vorgabe;
};
const saisons = Number(wert('saisons', 2));
const startwerte = String(wert('startwerte', '4711,20260910,77')).split(',').map(Number);

const je = startwerte.map((startwert) => ({ startwert, ...kennzahlen(laufen({ startwert, saisons }), saisons) }));
const mittel = {};
for (const schluessel of Object.keys(je[0]).filter((s) => s !== 'startwert')) {
  mittel[schluessel] = je.reduce((s, x) => s + x[schluessel], 0) / je.length;
}

if (argumente.includes('--json')) {
  console.log(JSON.stringify({ saisons, startwerte, mittel, je }, null, 2));
} else {
  const p = (x) => `${(x * 100).toFixed(1).replace('.', ',')} %`;
  const z = (x, n = 2) => x.toFixed(n).replace('.', ',');
  console.log(`Managerspiel ohne Menschen: ${saisons} Saisons, Startwerte ${startwerte.join(', ')}`);
  console.log(`  Spiele je Lauf      ${z(mittel.spiele, 0)}`);
  console.log(`  Tore je Spiel       ${z(mittel.toreJeSpiel)}   (Bundesliga 3,1)`);
  console.log(`  Heimsiege           ${p(mittel.heimsiege)}   (44 %)`);
  console.log(`  Unentschieden       ${p(mittel.unentschieden)}   (24 %)`);
  console.log(`  Favorit gewinnt     ${p(mittel.favoritGewinnt)}   (Niveau +0,5, jede Paarung; ohne Remis ${p(mittel.favoritGewinntEntschieden)})`);
  console.log(`  Gelb je Spiel       ${z(mittel.gelbJeSpiel)}`);
  console.log(`  Platzverweise       ${z(mittel.platzverweiseJeSpiel, 3)} je Spiel`);
  console.log(`  Wechsel je Spiel    ${z(mittel.wechselJeSpiel)}`);
  console.log(`  Verletzungen        ${z(mittel.verletzungenJeSpiel, 3)} je Spiel`);
  console.log(`  Stärke 1. Liga      ${z(mittel.staerkeErsteLiga, 1)}`);
  console.log(`  Kader               ${z(mittel.kaderMin, 1)} bis ${z(mittel.kaderMax, 1)} Spieler`);
  console.log(`  Vereinslose         ${z(mittel.vereinslose, 0)}`);
  // Konten rechnen in Tausend, wie im Spiel (geld() in public/manager/teile.js).
  console.log(`  Konto 1. Liga       ${z(mittel.kontoErsteLiga / 1000, 1)} Mio im Mittel`);
  console.log(`  Rechenzeit          ${z(mittel.msJeSaison, 0)} ms je Saison`);
  console.log(`  Spielstand          ${z(mittel.spielstandKB, 0)} KB`);
}
