'use strict';

// Die Werte des Strategiespiels an einer Stelle (→ specs/10-strategie/bauen.md
// AC-20, docs/strategie/vorlage-aoe2.md). Die Simulation liest sie hier und
// verzweigt nicht nach Einheit oder Volk.

// Einheiten: Leben, Tempo in Feldern je Sekunde, Sicht in Feldern, Tragkraft.
const EINHEITEN = {
  // kosten und zeit (Sekunden): Ausbildung (bauen AC-8). kuerzel: so geht die
  // Art ueber die Leitung - ein Zustand bleibt unter 1 kB (uebertragung AC-7).
  // baut: welche Gebaeude er errichten kann (bauen AC-1).
  dorfbewohner: {
    leben: 25, tempo: 0.8, sicht: 4, tragkraft: 10, kosten: { nahrung: 50 }, zeit: 25, kuerzel: 'd',
    baut: ['haus', 'muehle', 'holzfaellerlager', 'bergbaulager'],
  },
  spaeherreiter: { leben: 45, tempo: 1.2, sicht: 4, tragkraft: 0, kuerzel: 's' },
  miliz: { leben: 40, tempo: 0.9, sicht: 4, tragkraft: 0, kuerzel: 'm' },
};

// Sammelraten je Sekunde, nach dem Vorrat, an dem gearbeitet wird
// (einheiten AC-15). Schlüssel ist die Feldart aus karte.js.
const SAMMELN = {
  1: { rohstoff: 'holz', rate: 0.39 }, // Baum
  2: { rohstoff: 'nahrung', rate: 0.31 }, // Beerenstrauch
  4: { rohstoff: 'gold', rate: 0.38 }, // Goldfeld
  5: { rohstoff: 'stein', rate: 0.36 }, // Steinfeld
};

// Gebaeude der Dunklen Zeit (bauen AC-20): Groesse in Feldern (quadratisch),
// Kosten, Bauzeit in Sekunden, Leben, Wohnraum, welche Rohstoffe dort
// abgegeben werden (einheiten AC-16) und was sie ausbilden.
// Farm und Kaserne kommen mit Schritt A7.
const ALLE = ['holz', 'nahrung', 'gold', 'stein'];
const GEBAEUDE = {
  dorfzentrum: {
    groesse: 4, kosten: { holz: 275, stein: 100 }, bauzeit: 150, leben: 2400, wohnraum: 5,
    annahme: ALLE, bildetAus: ['dorfbewohner'],
  },
  haus: { groesse: 2, kosten: { holz: 25 }, bauzeit: 25, leben: 550, wohnraum: 5, annahme: [], bildetAus: [] },
  muehle: { groesse: 2, kosten: { holz: 100 }, bauzeit: 35, leben: 1000, wohnraum: 0, annahme: ['nahrung'], bildetAus: [] },
  holzfaellerlager: { groesse: 2, kosten: { holz: 100 }, bauzeit: 35, leben: 1000, wohnraum: 0, annahme: ['holz'], bildetAus: [] },
  bergbaulager: { groesse: 2, kosten: { holz: 100 }, bauzeit: 35, leben: 1000, wohnraum: 0, annahme: ['gold', 'stein'], bildetAus: [] },
};

// Auftraege je Gebaeude (bauen AC-10).
const SCHLANGE_MAX = 15;

// Womit jeder Spieler beginnt, neben seinem Dorfzentrum (bauen AC-22).
const STARTAUFSTELLUNG = ['dorfbewohner', 'dorfbewohner', 'dorfbewohner', 'spaeherreiter'];

// Mehr Wohnraum zaehlt nicht, wie in der Vorlage.
const BEVOELKERUNG_MAX = 200;

module.exports = { EINHEITEN, SAMMELN, GEBAEUDE, BEVOELKERUNG_MAX, SCHLANGE_MAX, STARTAUFSTELLUNG };
