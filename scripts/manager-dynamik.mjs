// npm run manager:dynamik [-- --saisons 20 --startwerte 4711,20260910,77,1234]
// Die Spieldynamik des Managerspiels ohne Menschen ueber viele Saisons: Geld
// je Liga, Staerke, Markt, Entwicklung, Jugend nach Jahrgang - und am Ende
// die Baender aus docs/manager/dynamik/plan.md, je Startwert "haelt"
// oder "reisst". Schreibt nichts, aendert nichts am Spiel.
import { baenderPruefen, median, mittel, weltVerfolgen } from './manager-dynamik-messung.mjs';

const argumente = process.argv.slice(2);
const wert = (name, vorgabe) => {
  const i = argumente.indexOf(`--${name}`);
  return i >= 0 ? argumente[i + 1] : vorgabe;
};
const SAISONS = Number(wert('saisons', 20));
const STARTWERTE = String(wert('startwerte', '4711,20260910,77,1234')).split(',').map(Number);

const z = (x, n = 1) => (Number.isFinite(x) ? x.toFixed(n).replace('.', ',') : '-');
const sp = (t, n) => String(t).padStart(n);
const BREITE = 28;

const welten = STARTWERTE.map((startwert) => {
  const beginn = performance.now();
  const welt = weltVerfolgen({ startwert, saisons: SAISONS });
  console.log(`Startwert ${startwert}: ${SAISONS} Saisons in ${z((performance.now() - beginn) / 1000)} s`);
  return welt;
});

/** Je Saison eine Zahl, gemittelt ueber die Startwerte (oder mit `zusammen` ueber alle Werte). */
const reihe = (f, zusammen = null) => Array.from({ length: SAISONS }, (_, i) => {
  const werte = welten.map((w) => f(w.saisons[i]));
  return zusammen ? zusammen(werte.flat()) : mittel(werte.filter(Number.isFinite));
});
const zeile = (titel, werte, n = 1, teiler = 1) => console.log(`  ${titel.padEnd(BREITE)}${werte.map((w) => sp(z(w / teiler, n), 7)).join('')}`);
const kopf = (titel) => {
  console.log(`\n===== ${titel} =====`);
  console.log(`  ${'Saison'.padEnd(BREITE)}${Array.from({ length: SAISONS }, (_, i) => sp(i + 1, 7)).join('')}`);
};

// ------------------------------------------------------------ Ligen
const POSTEN = ['zuschauer', 'fernsehen', 'sponsor', 'praemien', 'gehaelter', 'stadion', 'abfindungen', 'zinsen'];
for (const liga of [1, 2]) {
  const L = (x) => x.ligen[liga];
  kopf(`Liga ${liga}: je Verein und Saison (Geld in Mio), Mittel über ${STARTWERTE.length} Startwerte`);
  for (const p of POSTEN) {
    const seite = p === 'zuschauer' || p === 'fernsehen' || p === 'sponsor' || p === 'praemien' ? 'ein' : 'aus';
    zeile(p, reihe((x) => L(x).posten[p]?.[seite] ?? 0), 1, 1000);
  }
  zeile('transfers ein', reihe((x) => L(x).posten.transfers?.ein ?? 0), 1, 1000);
  zeile('transfers aus', reihe((x) => L(x).posten.transfers?.aus ?? 0), 1, 1000);
  zeile('Ergebnis', reihe((x) => Object.values(L(x).posten).reduce((s, q) => s + q.ein - q.aus, 0)), 1, 1000);
  zeile('Gehalt/Einnahmen', reihe((x) => L(x).quote), 2);
  zeile('Konto Median', reihe((x) => L(x).konten, median), 1, 1000);
  zeile('Konto kleinstes', reihe((x) => L(x).konten, (l) => Math.min(...l)), 1, 1000);
  zeile('Konto größtes', reihe((x) => L(x).konten, (l) => Math.max(...l)), 1, 1000);
  zeile('Vereine zeitweise im Minus', reihe((x) => L(x).kontoMin.filter((k) => k < 0).length));
  zeile('Vereine unter -3 Mio', reihe((x) => L(x).kontoMin.filter((k) => k < -3000).length));
  console.log('  --- Stärke');
  const sl = (x) => x.spieler.filter((p) => p.liga === liga);
  zeile('Niveau Mittel', reihe((x) => mittel(L(x).niveau)));
  zeile('Niveau beste 3', reihe((x) => mittel([...L(x).niveau].sort((a, b) => b - a).slice(0, 3))));
  zeile('Niveau schwächste 3', reihe((x) => mittel([...L(x).niveau].sort((a, b) => a - b).slice(0, 3))));
  zeile('Alter Mittel', reihe((x) => mittel(sl(x).map((p) => p.alter))));
  zeile('Spieler ab 85', reihe((x) => sl(x).filter((p) => p.staerke >= 85).length));
  zeile('Spieler ab 90', reihe((x) => sl(x).filter((p) => p.staerke >= 90).length));
  zeile('stärkster Spieler', reihe((x) => sl(x).map((p) => p.staerke), (l) => Math.max(...l)), 0);
  zeile('Gehalt/Marktwert 24-28', reihe((x) => mittel(sl(x).filter((p) => p.alter >= 24 && p.alter <= 28).map((p) => p.gehalt / p.wert))), 2);
  zeile('Ruf Mittel', reihe((x) => L(x).ruf));
  zeile('Stadion Mittel (Tsd)', reihe((x) => L(x).stadion), 1, 1000);
  console.log('  --- Markt (Käufer aus dieser Liga, aus den Akten)');
  zeile('Wechsel je Verein', reihe((x) => L(x).wechsel.length / L(x).vereine), 2);
  zeile('  davon ablösefrei %', reihe((x) => (L(x).wechsel.length ? 100 * L(x).wechsel.filter((w) => w.frei).length / L(x).wechsel.length : NaN)), 0);
  zeile('Ablöse Mittel (Mio)', reihe((x) => mittel(L(x).wechsel.filter((w) => !w.frei).map((w) => w.abloese))), 2, 1000);
  zeile('Ablöse höchste (Mio)', reihe((x) => L(x).wechsel.map((w) => w.abloese), (l) => Math.max(0, ...l)), 1, 1000);
  zeile('Stärke gekauft', reihe((x) => mittel(L(x).wechsel.filter((w) => !w.frei).map((w) => w.staerke))));
  zeile('Stärke ablösefrei', reihe((x) => mittel(L(x).wechsel.filter((w) => w.frei).map((w) => w.staerke))));
}
kopf('Vereinslose (am letzten Termin)');
zeile('Anzahl', reihe((x) => x.freie.length));
zeile('Stärke Mittel', reihe((x) => mittel(x.freie)));
zeile('davon ab 65', reihe((x) => x.freie.filter((s) => s >= 65).length));
zeile('Kader kleinster', reihe((x) => x.kader, (l) => Math.min(...l)), 0);
zeile('Kader größter', reihe((x) => x.kader, (l) => Math.max(...l)), 0);

// ------------------------------------------------------------ Wettbewerb und Reichtum
console.log('\n===== Wettbewerb und Reichtum =====');
for (const w of welten) {
  const zahl = {};
  for (const m of w.meister) zahl[m] = (zahl[m] || 0) + 1;
  const reich = w.reich[0];
  const arm = w.reich.at(-1);
  console.log(`  Startwert ${w.startwert}: ${Object.keys(zahl).length} verschiedene Meister - reichster ${reich.name} (Liga ${reich.liga}) ${z(reich.konto / 1000)} Mio, Stadion ${reich.stadion}, Ruf ${reich.ruf}; ärmster ${arm.name} (Liga ${arm.liga}) ${z(arm.konto / 1000)} Mio`);
}

// ------------------------------------------------------------ Entwicklung
console.log('\n===== Entwicklung: Stärke nach Alter am Saisonende, Zuwachs bis zum nächsten (wer im Verein blieb) =====');
const nachAlter = {};
const zuwachs = {};
for (const w of welten) {
  for (const [i, x] of w.saisons.entries()) {
    const naechste = w.saisons[i + 1] && new Map(w.saisons[i + 1].spieler.map((p) => [p.id, p.staerke]));
    for (const p of x.spieler) {
      (nachAlter[p.alter] ||= []).push(p.staerke);
      if (naechste?.has(p.id)) (zuwachs[p.alter] ||= []).push(naechste.get(p.id) - p.staerke);
    }
  }
}
console.log('  Alter   Anzahl  Stärke  Zuwachs');
for (let a = 17; a <= 36; a++) {
  if (nachAlter[a]) console.log(`  ${sp(a, 5)} ${sp(nachAlter[a].length, 8)} ${sp(z(mittel(nachAlter[a])), 7)} ${sp(z(mittel(zuwachs[a] || []), 2), 8)}`);
}

// ------------------------------------------------------------ Jugend nach Jahrgang
// Ein Jahrgang ist die Saison, in der einer als Siebzehnjaehriger zum ersten
// Mal im Verein steht. Mit A Jahren kann er nur gezaehlt werden, wenn
// Jahrgang + (A - 17) noch in der Messung liegt - sonst steht er nicht im
// Nenner.
console.log('\n===== Jugend nach Jahrgang: wer mit 19, 21, 24 zu Saisonbeginn noch in einem Verein steht =====');
const jugend = welten.flatMap((w) => w.jugend);
const ALTER = [19, 21, 24];
const erreichbar = (l, a) => l.jahrgang + (a - 17) <= SAISONS;
console.log(`  Jugendspieler ${jugend.length}, Talent im Mittel ${z(mittel(jugend.map((l) => l.talent)))}, Stärke mit 17 ${z(mittel(jugend.map((l) => l.staerke17)))}, `
  + `Stärke mit 17 minus Niveau des Vereins ${z(mittel(jugend.map((l) => l.staerke17 - l.niveau)))}`);
console.log(`  ${'Talent'.padEnd(8)}${'Anzahl'.padStart(7)}${ALTER.map((a) => `   im Verein mit ${a}`).join('')}   Stärke mit 21 / 24   Spielanteil 17-19`);
for (const [von, bis] of [[50, 59], [60, 69], [70, 79], [80, 99]]) {
  const g = jugend.filter((l) => l.talent >= von && l.talent <= bis);
  const anteil = (a) => {
    const nenner = g.filter((l) => erreichbar(l, a));
    const zaehler = nenner.filter((l) => l.verlauf[a] !== undefined).length;
    return `${sp(zaehler, 4)}/${sp(nenner.length, 4)} ${sp(nenner.length ? z(100 * zaehler / nenner.length, 0) : '-', 3)} %`;
  };
  const staerke = (a) => z(mittel(g.map((l) => l.verlauf[a]).filter((s) => s !== undefined)));
  const spielanteil = mittel(g.flatMap((l) => [17, 18, 19].map((a) => l.anteil[a]).filter((s) => s !== undefined)));
  console.log(`  ${`${von}-${bis}`.padEnd(8)}${sp(g.length, 7)}${ALTER.map((a) => `   ${anteil(a).padStart(15)}`).join('')}   ${sp(staerke(21), 6)} / ${sp(staerke(24), 6)}   ${sp(z(100 * spielanteil, 0), 10)} %`);
}

// ------------------------------------------------------------ Baender
console.log(`\n===== Die Bänder (docs/manager/dynamik/plan.md), je Startwert über ${SAISONS} Saisons =====`);
const jeWelt = welten.map((w) => baenderPruefen(w));
for (const [i, b] of jeWelt[0].entries()) {
  console.log(`  ${b.kriterium} ${b.titel} - ${b.grenze}`);
  for (const [j, baender] of jeWelt.entries()) {
    const x = baender[i];
    const gerissen = x.reihe.filter((r) => !x.pruefen(r)).length;
    const urteil = x.haelt ? 'hält' : `reißt (${x.riss.wo}: ${x.riss.wert}), gerissen in ${gerissen} von ${x.reihe.length}`;
    console.log(`    ${String(STARTWERTE[j]).padEnd(10)} ${urteil}`);
  }
}
