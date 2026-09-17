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
    baut: ['haus', 'muehle', 'holzfaellerlager', 'bergbaulager', 'farm', 'kaserne'],
  },
  spaeherreiter: { leben: 45, tempo: 1.2, sicht: 4, tragkraft: 0, kuerzel: 's' },
  // Kaempfen kann die Miliz ab Stufe B; bis dahin laeuft sie (bauen AC-9).
  miliz: { leben: 40, tempo: 0.9, sicht: 4, tragkraft: 0, kosten: { nahrung: 60, gold: 20 }, zeit: 21, kuerzel: 'm' },
};

// Sammelraten je Sekunde, nach dem Vorrat, an dem gearbeitet wird
// (einheiten AC-15). Schlüssel ist die Feldart aus karte.js.
const SAMMELN = {
  1: { rohstoff: 'holz', rate: 0.39 }, // Baum
  2: { rohstoff: 'nahrung', rate: 0.31 }, // Beerenstrauch
  4: { rohstoff: 'gold', rate: 0.38 }, // Goldfeld
  5: { rohstoff: 'stein', rate: 0.36 }, // Steinfeld
};

// Tiere (einheiten AC-17): Nahrung am Kadaver, Rate beim Hueten je Sekunde, und
// wie viele Sekunden ein unbearbeiteter Kadaver fuer eine Nahrung braucht.
const TIERE = {
  // tempo in Feldern je Sekunde; sicht: so nah muss eine Einheit sein, damit ein
  // fremdes Schaf den Besitzer wechselt (einheiten AC-22).
  schaf: { nahrung: 100, rate: 0.33, verfall: 4, tempo: 0.7, sicht: 4 },
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
  // Eine Farm ist begehbar, traegt 175 Nahrung und wird mit 0,32 je Sekunde
  // bestellt - von hoechstens einem (einheiten AC-18).
  farm: {
    groesse: 3, kosten: { holz: 60 }, bauzeit: 15, leben: 480, wohnraum: 0, annahme: [], bildetAus: [],
    begehbar: true, nahrung: 175, rate: 0.32,
  },
  kaserne: { groesse: 3, kosten: { holz: 175 }, bauzeit: 50, leben: 1200, wohnraum: 0, annahme: [], bildetAus: ['miliz'] },
};

// Auftraege je Gebaeude (bauen AC-10).
const SCHLANGE_MAX = 15;

// Womit jeder Spieler beginnt, neben seinem Dorfzentrum (bauen AC-22).
const STARTAUFSTELLUNG = ['dorfbewohner', 'dorfbewohner', 'dorfbewohner', 'spaeherreiter'];

// Mehr Wohnraum zaehlt nicht, wie in der Vorlage.
const BEVOELKERUNG_MAX = 200;

module.exports = { EINHEITEN, SAMMELN, TIERE, GEBAEUDE, BEVOELKERUNG_MAX, SCHLANGE_MAX, STARTAUFSTELLUNG };
