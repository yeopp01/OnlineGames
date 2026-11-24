'use strict';
// Was bewirken die Neigungen (kader AC-27 bis AC-33)? Gemessen in der Welt
// ohne Menschen, je Achse als Steigung: wie viel aendert sich etwas je
// Einheit Neigung. Dazu die Verteilung von `charakter()` und die Heimquote
// mit und ohne die Achse `heim`.
// Aufruf: node neigungen.cjs [saisons=5] [startwerte=4711,20260910,77,1234,5,99,31337,2026] [managerordner]
const pfad = require('path');
const saisons = Number(process.argv[2] || 5);
const startwerte = (process.argv[3] || '4711,20260910,77,1234,5,99,31337,2026').split(',').map(Number);
const M = process.argv[4] ? pfad.resolve(process.argv[4]) : pfad.join(__dirname, '../../../server/spiele/manager');
const spieltag = require(pfad.join(M, 'spieltag.js'));
const neigungen = require(pfad.join(M, 'neigungen.js'));
const vertraege = require(pfad.join(M, 'vertraege.js'));

// Die Begegnung beobachten, bevor ablauf.js sie beim Laden destrukturiert.
let beobachtet = null;
const echt = spieltag.begegnung;
spieltag.begegnung = (heim, gast, zufall, einstellungen) => {
  const ergebnis = echt(heim, gast, zufall, einstellungen);
  if (beobachtet) beobachtet.push({ ergebnis, heim: new Set(heim.spieler.map((s) => s.id)), neutral: !!einstellungen?.neutral });
  return ergebnis;
};
const { Karriere } = require(pfad.join(M, 'karriere.js'));

/** Steigung und Bestimmtheit einer Geraden durch Punkte [x, y]. */
function gerade(punkte) {
  const n = punkte.length;
  const mx = punkte.reduce((s, [x]) => s + x, 0) / n;
  const my = punkte.reduce((s, [, y]) => s + y, 0) / n;
  let sxy = 0; let sxx = 0; let syy = 0;
  for (const [x, y] of punkte) { sxy += (x - mx) * (y - my); sxx += (x - mx) ** 2; syy += (y - my) ** 2; }
  const steigung = sxy / sxx;
  // Standardfehler der Steigung - damit "keine Wirkung" von "zu wenig gemessen" zu trennen ist.
  const rest = Math.max(0, syy - steigung * sxy) / Math.max(1, n - 2);
  return { n, steigung, fehler: Math.sqrt(rest / sxx) };
}
const z = (x, s = 3) => x.toFixed(s).replace('.', ',');
const mittel = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
const streuung = (xs) => { const m = mittel(xs); return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1)); };

const verteilung = {};
let alle = 0;
const fleiss = []; const nerven = []; const heim = []; const gehalt = [];
const heimquote = { mit: [0, 0], ohne: [0, 0] };

function lauf(startwert, heimAn) {
  neigungen.NEIGUNGEN.wirkung.heim.form = heimAn ? 0.03 : 0;
  const k = Karriere.neu({ startwert, vereinId: null, name: 'Messung' });
  beobachtet = [];
  const messen = heimAn;
  if (messen) {
    for (const s of [...k.vereine.flatMap((v) => v.spieler), ...k.freie]) {
      const name = neigungen.charakter(s, startwert);
      verteilung[name] = (verteilung[name] || 0) + 1;
      alle++;
      const n = neigungen.neigung(startwert, s.id, 'wechsel');
      gehalt.push([n, vertraege.gehaltswunsch(s, startwert) / vertraege.gehaltswunsch(s, null) - 1]);
    }
  }
  const noten = new Map();
  for (let saison = 0; saison < saisons; saison++) {
    const vorher = new Map(k.vereine.flatMap((v) => v.spieler).map((s) => [s.id, s]).map(([id, s]) => [id, { staerke: s.staerke, alter: s.alter, talent: s.talent }]));
    const ende = k.saison + 1;
    while (k.saison < ende) {
      const r = k.weiter();
      if (!r.ok) throw new Error(r.fehler);
    }
    if (!messen) continue;
    // Fleiss: Staerke nach einem Jahr, nur wer nicht an seinem Talent anstoesst und unter 29 ist -
    // dort ist die Entwicklung offen nach oben und unten.
    for (const v of k.vereine) {
      for (const s of v.spieler) {
        const alt = vorher.get(s.id);
        if (!alt || alt.alter > 28 || alt.staerke >= alt.talent - 3) continue;
        fleiss.push([neigungen.neigung(startwert, s.id, 'entwicklung'), s.staerke - alt.staerke]);
      }
    }
  }
  let heimsiege = 0; let spiele = 0;
  for (const { ergebnis, heim: daheim, neutral } of beobachtet) {
    if (neutral) continue;
    spiele++;
    if (ergebnis.tore[0] > ergebnis.tore[1]) heimsiege++;
    if (!messen) continue;
    for (const [id, note] of Object.entries(ergebnis.noten)) {
      if (!noten.has(id)) noten.set(id, { daheim: [], auswaerts: [] });
      noten.get(id)[daheim.has(id) ? 'daheim' : 'auswaerts'].push(note);
    }
  }
  heimquote[heimAn ? 'mit' : 'ohne'][0] += heimsiege;
  heimquote[heimAn ? 'mit' : 'ohne'][1] += spiele;
  beobachtet = null;
  if (!messen) return;
  for (const [id, { daheim, auswaerts }] of noten) {
    const beide = [...daheim, ...auswaerts];
    if (beide.length >= 20) nerven.push([neigungen.neigung(startwert, id, 'nerven'), streuung(beide)]);
    if (daheim.length >= 10 && auswaerts.length >= 10) heim.push([neigungen.neigung(startwert, id, 'heim'), mittel(auswaerts) - mittel(daheim)]);
  }
}

for (const startwert of startwerte) {
  lauf(startwert, true);
  lauf(startwert, false);
}

console.log(`Neigungen: ${saisons} Saisons, Startwerte ${startwerte.join(', ')}`);
console.log(`\nCharakter ueber ${alle} Spieler zu Beginn (Vereine und Vereinslose):`);
for (const [name, zahl] of Object.entries(verteilung).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${name.padEnd(18)} ${String(zahl).padStart(5)}  ${z((zahl / alle) * 100, 1)} %`);
}
const zeile = (titel, g, einheit) => console.log(`  ${titel.padEnd(42)} ${z(g.steigung)} ± ${z(g.fehler)} ${einheit} je Einheit Neigung (n = ${g.n})`);
console.log('\nWirkung je Achse (Steigung einer Geraden, ± ein Standardfehler):');
zeile('entwicklung: Staerke nach einem Jahr, bis 28', gerade(fleiss), 'Punkte');
zeile('nerven: Streuung der Noten eines Spielers', gerade(nerven), 'Notenstufen');
zeile('heim: Note auswaerts minus daheim', gerade(heim), 'Notenstufen');
zeile('wechsel: Gehaltswunsch gegen ohne Neigung', gerade(gehalt), '(Anteil)');
const q = (x) => `${z((x[0] / x[1]) * 100, 2)} % von ${x[1]}`;
console.log(`\nHeimsiege mit heim.form 0,03: ${q(heimquote.mit)}`);
console.log(`Heimsiege mit heim.form 0:    ${q(heimquote.ohne)}`);
