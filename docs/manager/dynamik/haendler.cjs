'use strict';
// Kann ein Mensch den Markt ausnutzen? Zwei Bots am selben Verein und Startwert:
//   Verwalter: verlaengert nur auslaufende Vertraege.
//   Haendler:  dazu holt er Vereinslose abloesefrei (ein Jahr), setzt sie auf die
//              Transferliste und nimmt jedes Angebot der KI-Vereine an.
// Aufruf: node haendler.cjs <saisons> <startwerte,...>
const pfad = require('path');
const M = pfad.join(__dirname, '../../../server/spiele/manager');
const { Karriere } = require(pfad.join(M, 'karriere.js'));
const kader = require(pfad.join(M, 'kader.js'));
const vertraege = require(pfad.join(M, 'vertraege.js'));

const saisons = Number(process.argv[2] || 8);
const startwerte = (process.argv[3] || '4711,77').split(',').map(Number);
const TERMINE = 42;

function vereinWaehlen(startwert, liga, rang) {
  const probe = Karriere.neu({ startwert, vereinId: null });
  const liste = probe.vereine.filter((v) => v.liga === liga).sort((a, b) => kader.niveau(b) - kader.niveau(a));
  return liste[rang].id;
}

function lauf(startwert, vereinId, handeln) {
  const k = Karriere.neu({ startwert, vereinId, name: 'Bot' });
  const m = k.manager[0];
  const ware = new Map(); // spielerId -> { gehalt, seit }
  const st = { geholt: 0, verkauft: 0, erloes: 0, gehalt: 0, entlassen: 0, plaetze: [], konto: [], angebote: 0, faktor: [] };
  let uhr = 0;
  const abrechnen = (id) => {
    const w = ware.get(id);
    if (!w) return;
    st.gehalt += (w.gehalt / TERMINE) * (uhr - w.seit);
    ware.delete(id);
  };
  while (k.saison <= saisons) {
    if (m.status === 'entlassen') {
      st.entlassen += 1;
      for (const id of [...ware.keys()]) abrechnen(id);
      k.stelleAntreten('m1', m.stellen[0]);
    }
    const verein = k.vereinVon(m.vereinId);
    // Auslaufende Vertraege verlaengern (nicht die Ware, nicht die Alten).
    for (const s of verein.spieler) {
      if (ware.has(s.id) || !s.vertrag || s.vertrag.bis > k.saison || s.alter > 31 || s.karriereende) continue;
      if (k.termin >= 30) k.verlaengern('m1', s.id, Math.min(2, vertraege.laufzeitMax(s)));
    }
    if (handeln) {
      // Angebote auf Ware annehmen, das hoechste je Spieler.
      const beste = new Map();
      for (const a of m.angebote) {
        if (!ware.has(a.spielerId)) continue;
        st.angebote += 1;
        if (!beste.has(a.spielerId) || beste.get(a.spielerId).gebot < a.gebot) beste.set(a.spielerId, a);
      }
      for (const a of beste.values()) {
        const r = k.angebotAnnehmen('m1', a.id);
        if (r.ok) {
          st.verkauft += 1;
          st.erloes += r.erloes;
          st.faktor.push(a.gebot / a.wert);
          abrechnen(a.spielerId);
        }
      }
      // Vereinslose holen: die wertvollsten zuerst, ein Jahr, auf die Liste.
      // Nicht in den letzten Terminen der Saison - der Vertrag endete gleich.
      if (k.termin <= 22) {
        const kandidaten = [...k.freie]
          .filter((s) => s.alter <= 30 && s.staerke >= 58)
          .sort((a, b) => kader.marktwert(b) - kader.marktwert(a));
        for (const s of kandidaten) {
          if (verein.spieler.length >= kader.KADER_MAX || verein.konto <= 0 || ware.size >= 4) break;
          const r = k.kaufen('m1', s.id, 0, 1);
          if (!r.ok) continue;
          k.transferlisteSetzen('m1', s.id, true);
          ware.set(s.id, { gehalt: s.vertrag.gehalt, seit: uhr });
          st.geholt += 1;
        }
      }
    }
    const vorher = k.saison;
    const r = k.weiter();
    if (r.fehler) throw new Error(r.fehler);
    uhr += 1;
    if (k.saison !== vorher) {
      // Saisonwechsel: Ware mit abgelaufenem Vertrag ist weg.
      const da = new Set(k.vereinVon(m.vereinId).spieler.map((s) => s.id));
      for (const id of [...ware.keys()]) if (!da.has(id)) abrechnen(id);
      st.konto.push(Math.round(k.vereinVon(m.vereinId).konto));
    }
  }
  for (const id of [...ware.keys()]) abrechnen(id);
  return st;
}

const mittel = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0);
for (const [liga, rang, name] of [[1, 8, 'Liga 1, Mitte'], [1, 0, 'Liga 1, Bester'], [2, 8, 'Liga 2, Mitte']]) {
  console.log(`\n== ${name}, ${saisons} Saisons ==`);
  const summe = { geholt: 0, verkauft: 0, erloes: 0, gehalt: 0, vorsprung: [], faktor: [] };
  for (const startwert of startwerte) {
    const vereinId = vereinWaehlen(startwert, liga, rang);
    const ruhig = lauf(startwert, vereinId, false);
    const handel = lauf(startwert, vereinId, true);
    const gewinn = handel.erloes - handel.gehalt;
    console.log(`Startwert ${startwert}: geholt ${handel.geholt}, verkauft ${handel.verkauft}, Angebote ${handel.angebote}, `
      + `Erloes ${Math.round(handel.erloes)} T, Gehalt der Ware ${Math.round(handel.gehalt)} T, Gewinn ${Math.round(gewinn)} T `
      + `(${Math.round(gewinn / saisons)} T je Saison); Konto am Ende: Verwalter ${ruhig.konto.at(-1)} T, Haendler ${handel.konto.at(-1)} T; `
      + `entlassen: Verwalter ${ruhig.entlassen}, Haendler ${handel.entlassen}`);
    console.log(`   Konto je Saison Verwalter: ${ruhig.konto.join(' ')}`);
    console.log(`   Konto je Saison Haendler:  ${handel.konto.join(' ')}`);
    summe.geholt += handel.geholt; summe.verkauft += handel.verkauft; summe.erloes += handel.erloes; summe.gehalt += handel.gehalt;
    summe.faktor.push(...handel.faktor);
    if (!ruhig.entlassen && !handel.entlassen) summe.vorsprung.push(handel.konto.at(-1) - ruhig.konto.at(-1));
  }
  const n = startwerte.length * saisons;
  console.log(`Mittel je Saison: geholt ${(summe.geholt / n).toFixed(1)}, verkauft ${(summe.verkauft / n).toFixed(1)}, `
    + `Erloes ${Math.round(summe.erloes / n)} T, Gehalt ${Math.round(summe.gehalt / n)} T, Gewinn ${Math.round((summe.erloes - summe.gehalt) / n)} T; `
    + `Gebot/Marktwert ${mittel(summe.faktor).toFixed(2)}; Kontovorsprung ohne Entlassung ${Math.round(mittel(summe.vorsprung))} T (${summe.vorsprung.length} Laeufe)`);
}
