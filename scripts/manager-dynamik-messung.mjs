// Die Spieldynamik des Managerspiels ueber viele Saisons ohne Menschen - die
// eine Stelle, aus der `npm run manager:dynamik` (Tabellen und Baender) und
// tests/manager-welt-baender.test.mjs (die Baender als Kriterien) lesen
// (→ docs/manager/dynamik/plan.md, Schritt 0).
//
// Beobachtet wird nur von aussen: die Buchungen ueber die eine Karriere
// (`k.buchen` am Objekt, nicht am Prototyp), die Wechsel aus der Akte jedes
// Spielers (`laufbahn.wechsel`: Saison, Termin, von, zu, Abloese). Am Spiel
// aendert diese Datei nichts - der Fingerabdruck bleibt (spielziel AC-17).
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const kader = require('../server/spiele/manager/kader.js');
const finanzen = require('../server/spiele/manager/finanzen.js');
const { gehaltswunsch } = require('../server/spiele/manager/vertraege.js');
const { Karriere } = require('../server/spiele/manager/karriere.js');

export const mittel = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : NaN);
export const median = (l) => {
  if (!l.length) return NaN;
  const s = [...l].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Eine Welt ohne Menschen ueber `saisons` Saisons, Saison fuer Saison
 * festgehalten. Unter einer Sekunde je Saison.
 *
 * Je Saison (`saisons[i]`):
 * - `ligen[1|2]`: Vereine nach der Liga zu Saisonbeginn, ihre Buchungen je
 *   Posten (`posten[kategorie] = {ein, aus}` je Verein gemittelt), das Konto
 *   am Saisonende (`konten`) und das kleinste der Saison (`kontoMin`, nach
 *   jedem Termin gelesen), das Niveau am letzten Spieltag
 * - `spieler`: jeder Vereinsspieler am letzten Termin der Saison, vor dem
 *   Altern - Liga, Alter, Staerke, Talent, Vertragsgehalt, Gehaltswunsch,
 *   Marktwert
 * - `ligen[1|2].wechsel`: jeder Wechsel in einen Verein dieser Liga (zu
 *   Saisonbeginn), den die Akten fuer diese Saison nennen - abloesefrei, wenn
 *   kein Verkaeufer dasteht
 *
 * Dazu `jugend`: jeder, der als Siebzehnjaehriger aus der Jugend kam, mit
 * Jahrgang (erste Saison im Verein), Talent und Staerke je Alter, solange er
 * zu Saisonbeginn in einem Verein steht.
 */
export function weltVerfolgen({ startwert, saisons }) {
  const k = Karriere.neu({ startwert, vereinId: null, name: 'Messung' });
  const ersteSaison = k.saison;
  const startniveau = new Map(k.vereine.map((v) => [v.id, kader.niveau(v)]));
  let buch = new Map();
  const echtBuchen = k.buchen.bind(k);
  k.buchen = (verein, kategorie, betrag, zweck) => {
    const g = Math.round(betrag);
    if (g) {
      const v = buch.get(verein.id) || buch.set(verein.id, {}).get(verein.id);
      const p = v[kategorie] || (v[kategorie] = { ein: 0, aus: 0 });
      if (g > 0) p.ein += g; else p.aus -= g;
    }
    return echtBuchen(verein, kategorie, betrag, zweck);
  };

  const gesehen = new Map(); // Spieler-Id -> Zahl der Wechsel, die schon gezaehlt sind
  const jugend = new Map(); // Spieler-Id -> Lebenslauf
  const ergebnis = [];
  const meister = [];
  const wechsel = []; // ueber alle Saisons; verteilt wird am Ende nach der Saison in der Akte
  const ligaJe = new Map(); // Saison -> (Verein-Id -> Liga zu Saisonbeginn)

  for (let n = 0; n < saisons; n++) {
    buch = new Map();
    const saison = k.saison;
    const ligaVor = new Map(k.vereine.map((v) => [v.id, v.liga]));
    ligaJe.set(saison, ligaVor);
    const kontoMin = new Map(k.vereine.map((v) => [v.id, v.konto]));
    for (const v of k.vereine) {
      for (const s of v.spieler) {
        if (!gesehen.has(s.id)) gesehen.set(s.id, s.laufbahn.wechsel?.length || 0);
        if (s.jugend && s.alter === 17 && !jugend.has(s.id)) {
          jugend.set(s.id, { jahrgang: saison, talent: s.talent, staerke17: s.staerke, niveau: kader.niveau(v), verlauf: {}, anteil: {} });
        }
        const l = jugend.get(s.id);
        if (l) l.verlauf[s.alter] = s.staerke;
      }
    }
    let amEnde = null;
    while (k.saison === saison) {
      if (k.termine[k.termin].art === 'saisonende') {
        amEnde = {
          niveau: new Map(k.vereine.map((v) => [v.id, kader.niveau(v)])),
          kader: k.vereine.map((v) => v.spieler.length),
          spieler: k.vereine.flatMap((v) => v.spieler.map((s) => ({
            id: s.id, liga: v.liga, alter: s.alter, staerke: s.staerke, talent: s.talent,
            gehalt: s.vertrag?.gehalt ?? 0, wunsch: gehaltswunsch(s), wert: kader.marktwert(s),
          }))),
          ruf: new Map(k.vereine.map((v) => [v.id, v.reputation])),
          stadion: new Map(k.vereine.map((v) => [v.id, v.stadion.plaetze])),
          freie: k.freie.map((s) => s.staerke),
        };
        for (const v of k.vereine) {
          const moeglich = Math.max(1, k.pflichtspiele(v) * 90);
          for (const s of v.spieler) {
            const l = jugend.get(s.id);
            if (l) l.anteil[s.alter] = s.saison.minuten / moeglich;
          }
        }
      }
      const r = k.weiter();
      if (!r.ok) throw new Error(`weiter() abgewiesen in Saison ${k.saison}: ${r.fehler}`);
      for (const v of k.vereine) {
        if (v.konto < kontoMin.get(v.id)) kontoMin.set(v.id, v.konto);
        for (const s of v.spieler) {
          const akte = s.laufbahn.wechsel || [];
          const bisher = gesehen.get(s.id) ?? 0;
          for (const [wann, , von, zu, abloese] of akte.slice(bisher)) {
            if (zu === null) continue;
            wechsel.push({ saison: wann, von, zu, abloese, frei: von === null, staerke: s.staerke, alter: s.alter });
          }
          gesehen.set(s.id, akte.length);
        }
      }
    }
    meister.push(k.historie[0].meister[1]);
    const ligen = {};
    for (const liga of [1, 2]) {
      const ids = k.vereine.filter((v) => ligaVor.get(v.id) === liga).map((v) => v.id);
      const posten = {};
      for (const id of ids) {
        for (const [kat, p] of Object.entries(buch.get(id) || {})) {
          const z = posten[kat] || (posten[kat] = { ein: 0, aus: 0 });
          z.ein += p.ein / ids.length;
          z.aus += p.aus / ids.length;
        }
      }
      const einnahmen = ids.map((id) => Object.entries(buch.get(id) || {}).filter(([kat]) => kat !== 'transfers').reduce((s, [, p]) => s + p.ein, 0));
      ligen[liga] = {
        vereine: ids.length,
        posten,
        quote: mittel(ids.map((id, i) => (buch.get(id)?.gehaelter?.aus || 0) / Math.max(1, einnahmen[i]))),
        konten: ids.map((id) => k.vereinVon(id).konto),
        kontoMin: ids.map((id) => kontoMin.get(id)),
        niveau: ids.map((id) => amEnde.niveau.get(id)),
        ruf: mittel(ids.map((id) => amEnde.ruf.get(id))),
        stadion: mittel(ids.map((id) => amEnde.stadion.get(id))),
      };
    }
    ergebnis.push({ saison: saison - ersteSaison + 1, ligen, spieler: amEnde.spieler, kader: amEnde.kader, freie: amEnde.freie });
  }
  for (const [i, x] of ergebnis.entries()) {
    const saison = ersteSaison + i;
    const ligaVor = ligaJe.get(saison);
    for (const liga of [1, 2]) x.ligen[liga].wechsel = wechsel.filter((w) => w.saison === saison && ligaVor.get(w.zu) === liga);
  }
  const reich = k.vereine
    .map((v) => ({ name: v.name, konto: v.konto, liga: v.liga, niveau: kader.niveau(v), start: startniveau.get(v.id), stadion: v.stadion.plaetze, ruf: v.reputation }))
    .sort((a, b) => b.konto - a.konto);
  return { startwert, saisons: ergebnis, jugend: [...jugend.values()].map((l) => ({ ...l, jahrgang: l.jahrgang - ersteSaison + 1 })), meister, reich };
}

// ------------------------------------------------------------ Die Baender

/** Die Grenzen der fuenf Baender (→ docs/manager/dynamik/plan.md). */
export const GRENZEN = {
  tiefImMinus: { hoechstens: 2, konto: finanzen.PUNKTABZUG_GRENZE },
  gehaltAnteil: { alter: [24, 28], von: 0.15, bis: 0.25 },
  sterne: { staerke: 85, abSaison: 5, von: 3, bis: 8 },
  alter: { von: 25.5, bis: 27 },
};

const zahl = (x, n = 1) => x.toFixed(n).replace('.', ',');

/**
 * Die fuenf Baender ueber eine verfolgte Welt. Je Band die gemessene Reihe
 * (ein Wert je Saison, bei den Ligen je Liga), die Pruefung einer Saison
 * (`pruefen`), ob es in jeder Saison haelt, und wenn nicht, die erste
 * Saison, in der es reisst.
 *
 * Gemessen wird:
 * 1. je Liga (nach der Liga zu Saisonbeginn) die Vereine, deren Konto nach
 *    irgendeinem Termin der Saison unter der Abzugsgrenze stand
 * 2. je Liga der Median der Konten am Saisonende
 * 3. das Vertragsgehalt (`vertrag.gehalt`, was der Verein zahlt) geteilt
 *    durch den Marktwert, gemittelt ueber alle Vereinsspieler von 24 bis 28
 *    am letzten Termin der Saison; der Gehaltswunsch steht daneben
 * 4. Spieler der ersten Liga ab Staerke 85 am letzten Termin, ab Saison 5
 * 5. das mittlere Alter aller Vereinsspieler am letzten Termin, vor dem Altern
 */
export function baenderPruefen(welt) {
  const s = welt.saisons;
  const je = (f) => s.map((x) => ({ saison: x.saison, ...f(x) }));
  const band = (kriterium, titel, grenze, reihe, pruefen, zeigen) => {
    const riss = reihe.find((r) => !pruefen(r));
    return { kriterium, titel, grenze, reihe, pruefen, haelt: !riss, riss: riss ? { saison: riss.saison, wert: zeigen(riss) } : null };
  };
  const { tiefImMinus, gehaltAnteil, sterne, alter } = GRENZEN;
  const altersgruppe = (x) => x.spieler.filter((p) => p.alter >= gehaltAnteil.alter[0] && p.alter <= gehaltAnteil.alter[1] && p.wert > 0);
  return [
    band('finanzen AC-17', 'Höchstens zwei tief im Minus', `je Liga höchstens ${tiefImMinus.hoechstens} unter ${tiefImMinus.konto / 1000} Mio`,
      je((x) => ({ 1: x.ligen[1].kontoMin.filter((k) => k < tiefImMinus.konto).length, 2: x.ligen[2].kontoMin.filter((k) => k < tiefImMinus.konto).length })),
      (r) => r[1] <= tiefImMinus.hoechstens && r[2] <= tiefImMinus.hoechstens,
      (r) => `${r[1]} in Liga 1, ${r[2]} in Liga 2`),
    band('finanzen AC-18', 'Der Median bleibt im Plus', 'Median je Liga über 0',
      je((x) => ({ 1: median(x.ligen[1].konten), 2: median(x.ligen[2].konten) })),
      (r) => r[1] > 0 && r[2] > 0,
      (r) => `Liga 1 ${zahl(r[1] / 1000)} Mio, Liga 2 ${zahl(r[2] / 1000)} Mio`),
    band('transfer AC-26', 'Gehalt ein Fünftel des Werts', `${gehaltAnteil.alter.join(' bis ')} Jahre: ${gehaltAnteil.von * 100} bis ${gehaltAnteil.bis * 100} % des Marktwerts`,
      je((x) => {
        const g = altersgruppe(x);
        return { wert: mittel(g.map((p) => p.gehalt / p.wert)), wunsch: mittel(g.map((p) => p.wunsch / p.wert)), spieler: g.length };
      }),
      (r) => r.wert >= gehaltAnteil.von && r.wert <= gehaltAnteil.bis,
      (r) => `${zahl(100 * r.wert, 0)} %`),
    band('kader AC-23', 'Sterne in einem Band', `Liga 1 ab Stärke ${sterne.staerke}: ${sterne.von} bis ${sterne.bis} ab Saison ${sterne.abSaison}`,
      je((x) => ({ wert: x.spieler.filter((p) => p.liga === 1 && p.staerke >= sterne.staerke).length })),
      (r) => r.saison < sterne.abSaison || (r.wert >= sterne.von && r.wert <= sterne.bis),
      (r) => `${r.wert}`),
    band('kader AC-24', 'Durchschnittsalter bleibt im Band', `Mittel ${zahl(alter.von)} bis ${zahl(alter.bis)} Jahre`,
      je((x) => ({ wert: mittel(x.spieler.map((p) => p.alter)) })),
      (r) => r.wert >= alter.von && r.wert <= alter.bis,
      (r) => `${zahl(r.wert)} Jahre`),
  ];
}
