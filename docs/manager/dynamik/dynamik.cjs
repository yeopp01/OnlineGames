// Messung der Spieldynamik des Managerspiels ohne Menschen.
// node dynamik.cjs [saisons] [startwerte,kommagetrennt]
'use strict';
const WURZEL = require('path').join(__dirname, '../../../server/spiele/manager') + '/';
const kader = require(WURZEL + 'kader.js');
const transfer = require(WURZEL + 'transfer.js');
const { Karriere } = require(WURZEL + 'karriere.js');

const SAISONS = Number(process.argv[2] || 20);
const STARTWERTE = String(process.argv[3] || '4711,20260910,77,1234').split(',').map(Number);

const mittel = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : NaN);
const median = (l) => { const s = [...l].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const z = (x, n = 1) => (Number.isFinite(x) ? x.toFixed(n) : '  -');
const sp = (t, n) => String(t).padStart(n);

// Buchungen aller Vereine mitschreiben.
let buch = null; // Map vereinId -> {kategorie: {ein, aus}}
const echtBuchen = Karriere.prototype.buchen;
Karriere.prototype.buchen = function (verein, kategorie, betrag, zweck) {
  const g = Math.round(betrag);
  if (buch && g) {
    const v = buch.get(verein.id) || buch.set(verein.id, {}).get(verein.id);
    const p = v[kategorie] || (v[kategorie] = { ein: 0, aus: 0 });
    if (g > 0) p.ein += g; else p.aus -= g;
  }
  return echtBuchen.call(this, verein, kategorie, betrag, zweck);
};
// Wechsel mitschreiben.
let wechselListe = null;
const echtWechseln = transfer.wechseln;
transfer.wechseln = function (welt, w) {
  if (wechselListe) wechselListe.push({ saison: welt.saison, abloese: w.abloese, frei: !w.verkaeufer, staerke: w.spieler.staerke, alter: w.spieler.alter, wert: kader.marktwert(w.spieler), kaeuferLiga: w.kaeufer.liga });
  return echtWechseln.call(this, welt, w);
};

const jeSaison = []; // Zeilen ueber alle Startwerte
const lebenslauf = new Map(); // key startwert:id -> {jugend, talent0, verlauf: {alter: staerke}, minuten: {alter: n}, zuletztImVerein}
const meister = [];
const rangFolge = [];

for (const startwert of STARTWERTE) {
  const k = Karriere.neu({ startwert, vereinId: null, name: 'Messung' });
  const guete0 = new Map(k.vereine.map((v) => [v.id, kader.niveau(v)]));
  let vorRang = null;
  for (let n = 0; n < SAISONS; n++) {
    buch = new Map();
    wechselListe = [];
    const saison = k.saison;
    // Stand zu Saisonbeginn (nach Sommermarkt) festhalten.
    const ligaVor = new Map(k.vereine.map((v) => [v.id, v.liga]));
    const gehaltVor = new Map(k.vereine.map((v) => [v.id, v.spieler.reduce((s, x) => s + (x.vertrag?.gehalt || 0), 0)]));
    const kontoVor = new Map(k.vereine.map((v) => [v.id, v.konto]));
    for (const v of k.vereine) {
      for (const s of v.spieler) {
        const key = `${startwert}:${s.id}`;
        const l = lebenslauf.get(key) || lebenslauf.set(key, { jugend: Boolean(s.jugend) && s.alter === 17, talent0: s.talent, alter0: s.alter, staerke0: s.staerke, verlauf: {}, anteil: {}, rep0: v.reputation, niveau0: kader.niveau(v) }).get(key);
        l.verlauf[s.alter] = s.staerke;
        l.imVerein = saison;
      }
    }
    let kontoMin = new Map(k.vereine.map((v) => [v.id, v.konto]));
    let abzuege = 0;
    let endstand = null;
    while (k.saison === saison) {
      // vor dem Saisonende die Tabellen und Minuten greifen
      if (k.termine[k.termin].art === 'saisonende') {
        endstand = { 1: [...k.tabellen[1]], 2: [...k.tabellen[2]] };
        abzuege = [...k.tabellen[1], ...k.tabellen[2]].filter((t) => t.abzug).length;
        for (const v of k.vereine) {
          const moeglich = Math.max(1, k.pflichtspiele(v) * 90);
          for (const s of v.spieler) {
            const l = lebenslauf.get(`${startwert}:${s.id}`);
            if (l) l.anteil[s.alter] = s.saison.minuten / moeglich;
          }
        }
        var niveauEnde = new Map(k.vereine.map((v) => [v.id, kader.niveau(v)]));
        var kaderEnde = k.vereine.map((v) => v.spieler.length);
        var spielerEnde = k.vereine.flatMap((v) => v.spieler.map((s) => ({ ...s, liga: v.liga })));
        var repEnde = new Map(k.vereine.map((v) => [v.id, v.reputation]));
        var stadionEnde = new Map(k.vereine.map((v) => [v.id, v.stadion.plaetze]));
      }
      const r = k.weiter();
      if (!r.ok) throw new Error(r.fehler);
      for (const v of k.vereine) if (v.konto < kontoMin.get(v.id)) kontoMin.set(v.id, v.konto);
    }
    const hist = k.historie[0];
    meister.push({ startwert, saison, meister: hist.meister[1] });
    const rang = new Map(hist.tabellen[1].map((t, i) => [t.id, i + 1]));
    if (vorRang) {
      // Rangkorrelation Vorjahr/dieses Jahr fuer die, die beide Male in Liga 1 waren
      const paare = [...rang].filter(([id]) => vorRang.has(id)).map(([id, r]) => [vorRang.get(id), r]);
      const mx = mittel(paare.map((p) => p[0])); const my = mittel(paare.map((p) => p[1]));
      const kov = mittel(paare.map((p) => (p[0] - mx) * (p[1] - my)));
      const sx = Math.sqrt(mittel(paare.map((p) => (p[0] - mx) ** 2))); const sy = Math.sqrt(mittel(paare.map((p) => (p[1] - my) ** 2)));
      rangFolge.push(kov / (sx * sy));
    }
    vorRang = rang;

    for (const liga of [1, 2]) {
      const ids = k.vereine.filter((v) => ligaVor.get(v.id) === liga).map((v) => v.id);
      const b = (kat, seite) => mittel(ids.map((id) => (buch.get(id)?.[kat]?.[seite]) || 0));
      const ein = ids.map((id) => Object.entries(buch.get(id) || {}).filter(([kat]) => kat !== 'transfers').reduce((s, [, p]) => s + p.ein, 0));
      const gehalt = ids.map((id) => buch.get(id)?.gehaelter?.aus || 0);
      const niv = ids.map((id) => niveauEnde.get(id)).sort((a, b2) => b2 - a);
      const sl = spielerEnde.filter((s) => s.liga === liga);
      jeSaison.push({
        startwert, saison, liga,
        zuschauer: b('zuschauer', 'ein'), fernsehen: b('fernsehen', 'ein'), sponsor: b('sponsor', 'ein'), praemien: b('praemien', 'ein'),
        transfersEin: b('transfers', 'ein'), transfersAus: b('transfers', 'aus'), gehaelter: b('gehaelter', 'aus'), stadion: b('stadion', 'aus'),
        abfindungen: b('abfindungen', 'aus'), zinsen: b('zinsen', 'aus'),
        quote: mittel(ids.map((id, i) => gehalt[i] / Math.max(1, ein[i]))),
        quoteMax: Math.max(...ids.map((id, i) => gehalt[i] / Math.max(1, ein[i]))),
        ergebnis: mittel(ids.map((id) => k.vereinVon(id).konto - kontoVor.get(id))),
        konten: ids.map((id) => k.vereinVon(id).konto),
        imMinus: ids.filter((id) => kontoMin.get(id) < 0).length,
        tiefImMinus: ids.filter((id) => kontoMin.get(id) < -3000).length,
        nivMittel: mittel(niv), nivTop: niv[0], nivBoden: niv.at(-1), nivTop3: mittel(niv.slice(0, 3)), nivBoden3: mittel(niv.slice(-3)),
        alter: mittel(sl.map((s) => s.alter)), talent: mittel(sl.map((s) => s.talent)),
        ab85: sl.filter((s) => s.staerke >= 85).length, ab90: sl.filter((s) => s.staerke >= 90).length, max: Math.max(...sl.map((s) => s.staerke)),
        rep: mittel(ids.map((id) => repEnde.get(id))), stadionMittel: mittel(ids.map((id) => stadionEnde.get(id))),
        kaderMin: Math.min(...kaderEnde), kaderMax: Math.max(...kaderEnde),
        wechsel: wechselListe.filter((w) => w.kaeuferLiga === liga),
        freie: k.freie.length, freieStaerke: mittel(k.freie.map((s) => s.staerke)), freieTop: k.freie.filter((s) => s.staerke >= 65).length,
      });
    }
  }
  // Reichtum gegen Startguete
  const reich = k.vereine.map((v) => ({ konto: v.konto, liga: v.liga, niveau: kader.niveau(v), start: guete0.get(v.id), stadion: v.stadion.plaetze, rep: v.reputation })).sort((a, b) => b.konto - a.konto);
  console.log(`\nStartwert ${startwert} nach ${SAISONS} Saisons: reichste und aermste Vereine`);
  for (const r of [...reich.slice(0, 4), ...reich.slice(-4)]) console.log(`  Liga ${r.liga}  Konto ${sp(z(r.konto / 1000), 7)} Mio  Niveau ${z(r.niveau)} (Start ${z(r.start)})  Stadion ${r.stadion}  Ruf ${r.rep}`);
}
buch = null; wechselListe = null;

const gruppen = (liga, feld, f = mittel) => {
  const aus = [];
  for (let s = 1; s <= SAISONS; s++) aus.push(f(jeSaison.filter((x) => x.liga === liga && x.saison === s).map((x) => x[feld])));
  return aus;
};
const zeile = (titel, werte, n = 1, teiler = 1) => console.log(`  ${titel.padEnd(26)} ${werte.map((w) => sp(z(w / teiler, n), 6)).join('')}`);
const kopf = () => console.log(`  ${'Saison'.padEnd(26)} ${Array.from({ length: SAISONS }, (_, i) => sp(i + 1, 6)).join('')}`);

for (const liga of [1, 2]) {
  console.log(`\n===== Liga ${liga}: Geld je Verein und Saison (Mio), Mittel ueber ${STARTWERTE.length} Startwerte =====`);
  kopf();
  for (const f of ['zuschauer', 'fernsehen', 'sponsor', 'praemien', 'gehaelter', 'transfersEin', 'transfersAus', 'stadion', 'abfindungen', 'zinsen', 'ergebnis']) zeile(f, gruppen(liga, f), 1, 1000);
  zeile('Gehalt/Einnahmen', gruppen(liga, 'quote'), 2);
  zeile('  hoechste Quote', gruppen(liga, 'quoteMax', (l) => Math.max(...l)), 2);
  zeile('Konto Median', gruppen(liga, 'konten', (l) => median(l.flat())), 1, 1000);
  zeile('Konto kleinstes', gruppen(liga, 'konten', (l) => Math.min(...l.flat())), 1, 1000);
  zeile('Konto groesstes', gruppen(liga, 'konten', (l) => Math.max(...l.flat())), 1, 1000);
  zeile('Vereine je im Minus', gruppen(liga, 'imMinus'), 1);
  zeile('Vereine unter -3 Mio', gruppen(liga, 'tiefImMinus'), 1);
  console.log(`  --- Staerke`);
  zeile('Niveau Mittel', gruppen(liga, 'nivMittel'));
  zeile('Niveau beste 3', gruppen(liga, 'nivTop3'));
  zeile('Niveau schwaechste 3', gruppen(liga, 'nivBoden3'));
  zeile('Alter Mittel', gruppen(liga, 'alter'));
  zeile('Talent Mittel', gruppen(liga, 'talent'));
  zeile('Spieler ab 85', gruppen(liga, 'ab85'));
  zeile('Spieler ab 90', gruppen(liga, 'ab90'));
  zeile('staerkster Spieler', gruppen(liga, 'max', (l) => Math.max(...l)), 0);
  zeile('Ruf Mittel', gruppen(liga, 'rep'));
  zeile('Stadion Mittel (Tsd)', gruppen(liga, 'stadionMittel'), 1, 1000);
  zeile('Kader kleinster', gruppen(liga, 'kaderMin', (l) => Math.min(...l)), 0);
  zeile('Kader groesster', gruppen(liga, 'kaderMax', (l) => Math.max(...l)), 0);
  console.log(`  --- Markt (Kaeufer aus dieser Liga)`);
  zeile('Wechsel je Verein', gruppen(liga, 'wechsel', (l) => mittel(l.map((w) => w.length)) / 18), 2);
  zeile('  davon abloesefrei %', gruppen(liga, 'wechsel', (l) => 100 * mittel(l.map((w) => w.filter((x) => x.frei).length / Math.max(1, w.length)))), 0);
  zeile('Abloese Mittel (Mio)', gruppen(liga, 'wechsel', (l) => mittel(l.flat().filter((x) => !x.frei).map((x) => x.abloese))), 2, 1000);
  zeile('Abloese hoechste (Mio)', gruppen(liga, 'wechsel', (l) => Math.max(0, ...l.flat().map((x) => x.abloese))), 1, 1000);
  zeile('Staerke gekauft', gruppen(liga, 'wechsel', (l) => mittel(l.flat().filter((x) => !x.frei).map((x) => x.staerke))));
  zeile('Staerke abloesefrei', gruppen(liga, 'wechsel', (l) => mittel(l.flat().filter((x) => x.frei).map((x) => x.staerke))));
}
console.log('\n===== Vereinslose =====');
kopf();
zeile('Anzahl', gruppen(1, 'freie'));
zeile('Staerke Mittel', gruppen(1, 'freieStaerke'));
zeile('davon ab 65', gruppen(1, 'freieTop'));

// --------------------------------------------------- Wettbewerb
console.log('\n===== Wettbewerb =====');
for (const sw of STARTWERTE) {
  const m = meister.filter((x) => x.startwert === sw).map((x) => x.meister);
  const zahl = {}; for (const n of m) zahl[n] = (zahl[n] || 0) + 1;
  console.log(`  Startwert ${sw}: ${Object.keys(zahl).length} verschiedene Meister in ${SAISONS} Saisons - ${Object.entries(zahl).sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n} ${c}`).join(', ')}`);
}
console.log(`  Rangkorrelation Liga 1 von Saison zu Saison: ${z(mittel(rangFolge), 2)}`);

// --------------------------------------------------- Entwicklung
console.log('\n===== Entwicklung: mittlere Staerke nach Alter (Spieler in Vereinen) =====');
const alle = [...lebenslauf.values()];
const nachAlter = {};
const zuwachs = {};
for (const l of alle) {
  for (const [a, s] of Object.entries(l.verlauf)) {
    (nachAlter[a] ||= []).push(s);
    const n = l.verlauf[Number(a) + 1];
    if (n !== undefined) (zuwachs[a] ||= []).push(n - s);
  }
}
console.log('  Alter   Anzahl  Staerke  Zuwachs bis zum naechsten Jahr (nur wer im Verein blieb)');
for (let a = 17; a <= 36; a++) if (nachAlter[a]) console.log(`  ${sp(a, 5)} ${sp(nachAlter[a].length, 8)} ${sp(z(mittel(nachAlter[a])), 8)} ${sp(z(mittel(zuwachs[a] || []), 2), 8)}`);

console.log('\n===== Jugend: was aus den 17-Jaehrigen wird (nur Jahrgaenge mit mindestens 8 Jahren Lauf) =====');
const jugend = alle.filter((l) => l.jugend && l.imVerein !== undefined);
const reif = jugend.filter((l) => true);
const stufen = [[50, 59], [60, 69], [70, 79], [80, 95]];
console.log(`  Jugendspieler gesamt: ${jugend.length}, Talent im Mittel ${z(mittel(jugend.map((l) => l.talent0)))}, Staerke mit 17 ${z(mittel(jugend.map((l) => l.staerke0)))}`);
console.log('  Talent     Anzahl  noch im Verein mit 19 / 21 / 24   Staerke mit 21 / 24 (wer blieb)   Spielanteil mit 17-19');
for (const [von, bis] of stufen) {
  const g = jugend.filter((l) => l.talent0 >= von && l.talent0 <= bis);
  const alt = (a, min) => g.filter((l) => Object.keys(l.verlauf).length && (Math.max(...Object.keys(l.verlauf).map(Number)) >= a));
  // nur wer frueh genug kam, dass er das Alter haette erreichen koennen: Naeherung ueber Zahl der moeglichen Jahre unbekannt -> Anteil an allen
  const s = (a) => { const w = g.map((l) => l.verlauf[a]).filter((x) => x !== undefined); return `${z(mittel(w))} (${w.length})`; };
  const ant = mittel(g.flatMap((l) => [17, 18, 19].map((a) => l.anteil[a]).filter((x) => x !== undefined)));
  console.log(`  ${von}-${bis}  ${sp(g.length, 8)}   ${sp(g.filter((l) => l.verlauf[19] !== undefined).length, 5)} / ${sp(g.filter((l) => l.verlauf[21] !== undefined).length, 5)} / ${sp(g.filter((l) => l.verlauf[24] !== undefined).length, 5)}          ${s(21)} / ${s(24)}        ${z(100 * ant, 0)} %`);
}
// Abstand zum Vereinsniveau
const abst = jugend.map((l) => l.talent0 - l.niveau0);
console.log(`  Talent minus Niveau des eigenen Vereins: Mittel ${z(mittel(abst))}, Anteil mit Talent ueber Niveau ${z(100 * abst.filter((x) => x > 0).length / abst.length, 0)} %`);
console.log(`  Staerke mit 17 minus Niveau des Vereins: Mittel ${z(mittel(jugend.map((l) => l.staerke0 - l.niveau0)))}`);
// Wie viele erreichen ihr Talent
const mit24 = jugend.filter((l) => l.verlauf[24] !== undefined);
console.log(`  Von denen, die mit 24 noch in einem Verein sind (${mit24.length}): Staerke/Talent ${z(100 * mittel(mit24.map((l) => l.verlauf[24] / l.talent0)), 0)} %, Rest zum Talent ${z(mittel(mit24.map((l) => l.talent0 - l.verlauf[24])))} Punkte`);
