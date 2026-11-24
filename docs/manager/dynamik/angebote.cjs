'use strict';
// Wie viele Angebote bekommt ein Mensch, der nur verwaltet (transfer AC-31)?
// Der Verwalter verlaengert, was im letzten Vertragsjahr steht und hoechstens
// 31 ist, setzt niemanden auf die Liste und nimmt kein Angebot an - die Welt
// laeuft also wie ohne Angebote. Gezaehlt wird jedes neue Angebot im Postfach.
// Aufruf: node angebote.cjs [saisons=10] [startwerte=4711,20260910,77,1234,5,99,31337,2026] [managerordner]
const pfad = require('path');
const saisons = Number(process.argv[2] || 10);
const startwerte = (process.argv[3] || '4711,20260910,77,1234,5,99,31337,2026').split(',').map(Number);
const M = process.argv[4] ? pfad.resolve(process.argv[4]) : pfad.join(__dirname, '../../../server/spiele/manager');
const { Karriere } = require(pfad.join(M, 'karriere.js'));
const kader = require(pfad.join(M, 'kader.js'));
const vertraege = require(pfad.join(M, 'vertraege.js'));

function vereinAufRang(startwert, liga, rang) {
  const probe = Karriere.neu({ startwert, vereinId: null });
  return probe.vereine.filter((v) => v.liga === liga).sort((a, b) => kader.niveau(b) - kader.niveau(a))[rang].id;
}

function verwalten(startwert, liga, rang) {
  const k = Karriere.neu({ startwert, vereinId: vereinAufRang(startwert, liga, rang), name: 'Bot' });
  const m = k.manager[0];
  const gesehen = new Set();
  const spieler = new Set();
  while (k.saison <= saisons) {
    if (m.status === 'entlassen') k.stelleAntreten('m1', m.stellen[0]);
    const verein = k.vereinVon(m.vereinId);
    for (const s of verein.spieler) {
      if (!s.vertrag || s.vertrag.bis > k.saison || s.alter > 31 || s.karriereende) continue;
      if (k.termin >= 30) k.verlaengern('m1', s.id, Math.min(2, vertraege.laufzeitMax(s)));
    }
    for (const a of m.angebote) {
      if (gesehen.has(a.id)) continue;
      gesehen.add(a.id);
      spieler.add(a.spielerId);
    }
    const r = k.weiter();
    if (r.fehler) throw new Error(r.fehler);
  }
  return { angebote: gesehen.size / saisons, spieler: spieler.size / saisons };
}

for (const [liga, rang, name] of [[1, 0, 'L1 Bester'], [1, 8, 'L1 Mitte'], [2, 8, 'L2 Mitte']]) {
  const l = startwerte.map((s) => verwalten(s, liga, rang));
  const mittel = (f) => (l.reduce((a, x) => a + f(x), 0) / l.length).toFixed(2);
  console.log(`${name}: Angebote je Saison ${mittel((x) => x.angebote)} (je Startwert ${l.map((x) => x.angebote.toFixed(2)).join(' ')}, `
    + `kleinster ${Math.min(...l.map((x) => x.angebote)).toFixed(2)}), verschiedene Spieler je Saison ${mittel((x) => x.spieler)}`);
}
