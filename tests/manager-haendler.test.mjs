// Der Haendler-Hebel (→ docs/manager/dynamik/plan.md, Schritt 6): ein
// Mensch holt Vereinslose abloesefrei, setzt sie auf die Transferliste und
// verkauft sie an die Vereine des Servers. Bis Schritt 6 brachte das in
// der Mitte der ersten Liga 23 Mio je Saison - mehr, als der Verein im
// Spielbetrieb einnimmt. Seitdem verkauft, wer satt ist, nicht mehr, und
// niemand bietet auf einen Spieler, wenn ein vergleichbarer Vereinsloser
// zu haben ist (transfer.MARKT).
//
// Der Bot ist derselbe wie in docs/manager/dynamik/haendler.cjs, kuerzer
// gefahren: er verlaengert, was im letzten Vertragsjahr steht, holt bis
// zum 22. Termin bis zu vier Vereinslose ab 58 Staerke und hoechstens 30
// Jahren, setzt sie auf die Liste und nimmt je Spieler das beste Angebot.
// Gezaehlt wird gegen ihn: Erloes minus das Gehalt der Ware, solange er sie
// haelt - ein Handgeld zieht er nicht ab, der Gewinn ist eher zu hoch.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Karriere } = require('../server/spiele/manager/karriere.js');
const kader = require('../server/spiele/manager/kader.js');
const vertraege = require('../server/spiele/manager/vertraege.js');
const { TERMINE_JE_SAISON } = require('../server/spiele/manager/kalender.js');

const SAISONS = 12;
const STARTWERTE = [4711, 77, 1234];
// Gesetzt: der Gewinn je Saison hoechstens ein Zehntel dessen, was der
// Verein ohne Abloesen einnimmt. Kein Wert aus Anstoss 3.
const ANTEIL_HOECHSTENS = 0.1;

/** Der Verein auf Rang `rang` (0 = der staerkste) der Liga beim Start. */
function vereinAufRang(startwert, liga, rang) {
  const probe = Karriere.neu({ startwert, vereinId: null });
  return probe.vereine.filter((v) => v.liga === liga).sort((a, b) => kader.niveau(b) - kader.niveau(a))[rang].id;
}

function handeln(startwert, liga, rang) {
  const k = Karriere.neu({ startwert, vereinId: vereinAufRang(startwert, liga, rang), name: 'Bot' });
  const m = k.manager[0];
  const ware = new Map();
  let erloes = 0; let gehalt = 0; let einnahmen = 0; let geholt = 0; let uhr = 0;
  const buchen = k.buchen.bind(k);
  k.buchen = (verein, kat, betrag, zweck) => {
    if (verein.id === m.vereinId && kat !== 'transfers' && betrag > 0) einnahmen += betrag;
    return buchen(verein, kat, betrag, zweck);
  };
  const abrechnen = (id) => {
    const w = ware.get(id);
    if (!w) return;
    gehalt += (w.gehalt / TERMINE_JE_SAISON) * (uhr - w.seit);
    ware.delete(id);
  };
  while (k.saison <= SAISONS) {
    if (m.status === 'entlassen') {
      for (const id of [...ware.keys()]) abrechnen(id);
      k.stelleAntreten('m1', m.stellen[0]);
    }
    const verein = k.vereinVon(m.vereinId);
    for (const s of verein.spieler) {
      if (ware.has(s.id) || !s.vertrag || s.vertrag.bis > k.saison || s.alter > 31 || s.karriereende) continue;
      if (k.termin >= 30) k.verlaengern('m1', s.id, Math.min(2, vertraege.laufzeitMax(s)));
    }
    const beste = new Map();
    for (const a of m.angebote) {
      if (ware.has(a.spielerId) && (!beste.has(a.spielerId) || beste.get(a.spielerId).gebot < a.gebot)) beste.set(a.spielerId, a);
    }
    for (const a of beste.values()) {
      const r = k.angebotAnnehmen('m1', a.id);
      if (r.ok) { erloes += r.erloes; abrechnen(a.spielerId); }
    }
    if (k.termin <= 22) {
      const kandidaten = [...k.freie].filter((s) => s.alter <= 30 && s.staerke >= 58).sort((a, b) => kader.marktwert(b) - kader.marktwert(a));
      for (const s of kandidaten) {
        if (verein.spieler.length >= kader.KADER_MAX || verein.konto <= 0 || ware.size >= 4) break;
        if (!k.kaufen('m1', s.id, 0, 1).ok) continue;
        k.transferlisteSetzen('m1', s.id, true);
        ware.set(s.id, { gehalt: s.vertrag.gehalt, seit: uhr });
        geholt += 1;
      }
    }
    const saison = k.saison;
    const r = k.weiter();
    if (r.fehler) throw new Error(r.fehler);
    uhr += 1;
    if (k.saison !== saison) {
      const da = new Set(k.vereinVon(m.vereinId).spieler.map((s) => s.id));
      for (const id of [...ware.keys()]) if (!da.has(id)) abrechnen(id);
    }
  }
  for (const id of [...ware.keys()]) abrechnen(id);
  return { gewinn: (erloes - gehalt) / SAISONS, einnahmen: einnahmen / SAISONS, geholt };
}

function pruefen(liga, rang) {
  const laeufe = STARTWERTE.map((s) => handeln(s, liga, rang));
  for (const [i, l] of laeufe.entries()) assert.ok(l.geholt >= SAISONS, `Startwert ${STARTWERTE[i]}: der Bot hat nur ${l.geholt} Vereinslose geholt - so misst der Test nichts`);
  const gewinn = laeufe.reduce((a, l) => a + l.gewinn, 0) / laeufe.length;
  const einnahmen = laeufe.reduce((a, l) => a + l.einnahmen, 0) / laeufe.length;
  const je = laeufe.map((l) => `${(l.gewinn / 1000).toFixed(1)}`).join(' / ');
  assert.ok(gewinn <= ANTEIL_HOECHSTENS * einnahmen,
    `Gewinn je Saison im Mittel ${(gewinn / 1000).toFixed(2)} Mio (${je}) bei ${(einnahmen / 1000).toFixed(1)} Mio Einnahmen - ${(100 * gewinn / einnahmen).toFixed(1)} %, erlaubt ${ANTEIL_HOECHSTENS * 100} %`);
}

test('transfer AC-28: wer in der Mitte der ersten Liga Vereinslose weiterverkauft, verdient hoechstens ein Zehntel der Einnahmen', () => {
  pruefen(1, 8);
});

test('transfer AC-28: wer in der Mitte der zweiten Liga Vereinslose weiterverkauft, verdient hoechstens ein Zehntel der Einnahmen', () => {
  pruefen(2, 8);
});
