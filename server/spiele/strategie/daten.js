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
    baut: ['haus', 'muehle', 'holzfaellerlager', 'bergbaulager', 'farm', 'kaserne', 'schiessanlage', 'stall', 'schmiede'],
  },
  // Ausgebildet wird er im Stall, also ab der Feudalzeit; zu Beginn steht
  // einer in der Startaufstellung (bauen AC-22).
  spaeherreiter: { leben: 45, tempo: 1.2, sicht: 4, tragkraft: 0, kosten: { nahrung: 80 }, zeit: 30, kuerzel: 's' },
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
// `zeitalter` fehlt hier ueberall: ohne Angabe gehoert ein Gebaeude der
// Dunklen Zeit (Stufe 0). Die Gebaeude der Feudalzeit tragen Stufe 1.
const ALLE = ['holz', 'nahrung', 'gold', 'stein'];
const GEBAEUDE = {
  dorfzentrum: {
    groesse: 4, kosten: { holz: 275, stein: 100 }, bauzeit: 150, leben: 2400, wohnraum: 5,
    annahme: ALLE, bildetAus: ['dorfbewohner', 'webstuhl', 'feudalzeit', 'ritterzeit', 'imperialzeit'],
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
  // Gebaeude der Feudalzeit (bauen AC-24): `zeitalter: 1` sperrt sie, bis die
  // Feudalzeit erreicht ist. Was sie ausbilden, kommt mit Schritt B4 - der
  // Spaeherreiter steht schon und zieht deshalb in den Stall ein.
  schiessanlage: {
    groesse: 3, kosten: { holz: 175 }, bauzeit: 50, leben: 1000, wohnraum: 0, annahme: [], bildetAus: [], zeitalter: 1,
  },
  stall: {
    groesse: 3, kosten: { holz: 175 }, bauzeit: 50, leben: 1000, wohnraum: 0, annahme: [], bildetAus: ['spaeherreiter'], zeitalter: 1,
  },
  schmiede: {
    groesse: 3, kosten: { holz: 150 }, bauzeit: 40, leben: 1200, wohnraum: 0, annahme: [], bildetAus: [], zeitalter: 1,
  },
};

// Auftraege je Gebaeude (bauen AC-10).
const SCHLANGE_MAX = 15;

// Womit jeder Spieler beginnt, neben seinem Dorfzentrum (bauen AC-22).
const STARTAUFSTELLUNG = ['dorfbewohner', 'dorfbewohner', 'dorfbewohner', 'spaeherreiter'];

// Mehr Wohnraum zaehlt nicht, wie in der Vorlage.
const BEVOELKERUNG_MAX = 200;

// Die vier Zeitalter (spielziel AC-1). `stufe` ist der Index: 0 ist die
// Dunkle Zeit, in der jede Partie beginnt.
// `genitiv` steht in Meldungen („Gebäude der Dunklen Zeit"), deshalb gebeugt
// und mit echten Umlauten - es ist ein Text für den Bildschirm.
const ZEITALTER = [
  { id: 'dunkel', name: 'Dunkle Zeit', genitiv: 'der Dunklen Zeit' },
  { id: 'feudal', name: 'Feudalzeit', genitiv: 'der Feudalzeit' },
  { id: 'ritter', name: 'Ritterzeit', genitiv: 'der Ritterzeit' },
  { id: 'imperial', name: 'Imperialzeit', genitiv: 'der Imperialzeit' },
];

// Der Aufstieg ist ein Auftrag im Dorfzentrum wie eine Verbesserung: bezahlt
// beim Einreihen, mit einer Dauer, und ein Abbruch erstattet voll (bauen
// AC-23). `voraussetzung` ist die Zahl fertiger eigener Gebaeude des
// **laufenden** Zeitalters ausser Haeusern - das Dorfzentrum zaehlt mit.
// Werte aus der Vorlage (docs/strategie/vorlage-aoe2.md).
const AUFSTIEGE = {
  feudalzeit: { name: 'Feudalzeit', stufe: 1, kosten: { nahrung: 500 }, zeit: 130, voraussetzung: 2 },
  ritterzeit: { name: 'Ritterzeit', stufe: 2, kosten: { nahrung: 800, gold: 200 }, zeit: 160, voraussetzung: 2 },
  imperialzeit: { name: 'Imperialzeit', stufe: 3, kosten: { nahrung: 1000, gold: 800 }, zeit: 190, voraussetzung: 2 },
};

// Verbesserungen: einmal je Partie, im Gebaeude wie eine Einheit eingereiht.
// `wirkung` gibt je Einheitenart Zuschlaege (bauen AC-21). Ruestung wirkt ab
// Stufe B mit dem Kampf; sie steht schon hier, damit die Werte an einer Stelle sind.
const VERBESSERUNGEN = {
  webstuhl: {
    name: 'Webstuhl', kosten: { gold: 50 }, zeit: 25,
    wirkung: { dorfbewohner: { leben: 15, nahruestung: 1, fernruestung: 2 } },
  },
};

module.exports = {
  EINHEITEN, SAMMELN, TIERE, GEBAEUDE, VERBESSERUNGEN, ZEITALTER, AUFSTIEGE,
  BEVOELKERUNG_MAX, SCHLANGE_MAX, STARTAUFSTELLUNG,
};
