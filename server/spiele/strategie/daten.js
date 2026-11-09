'use strict';

// Die Werte des Strategiespiels an einer Stelle (→ specs/10-strategie/bauen.md
// AC-20, docs/strategie/vorlage-aoe2.md). Die Simulation liest sie hier und
// verzweigt nicht nach Einheit oder Volk.

// Einheiten: Leben, Tempo in Feldern je Sekunde, Sicht in Feldern, Tragkraft.
//
// Kampfwerte stehen bei jeder Einheit: `angriff`, `nahruestung`,
// `fernruestung`, `reichweite` (0 heisst Nahkampf), `nachladen` in Sekunden
// zwischen zwei Schlaegen (kampf AC-7) und `bonus` je Ruestungsklasse.
// `klassen` sagt, als was eine Einheit **getroffen** wird - der
// Speerkaempfer ist Infanterie *und* Speer,
// damit der Bogenschuetze seinen Bonus gegen ihn findet (einheiten AC-23).
// Der Kreis, auf den es ankommt: Speer schlaegt Reiter, Reiter schlaegt
// Bogen, Bogen schlaegt Speer, Plaenkler schlaegt Bogen.
const EINHEITEN = {
  // kosten und zeit (Sekunden): Ausbildung (bauen AC-8). kuerzel: so geht die
  // Art ueber die Leitung - ein Zustand bleibt unter 1 kB (uebertragung AC-7).
  // baut: welche Gebaeude er errichten kann (bauen AC-1).
  // `zeitalter` fehlt: wie bei den Gebaeuden heisst das Dunkle Zeit (Stufe 0).
  dorfbewohner: {
    leben: 25, tempo: 0.8, sicht: 4, tragkraft: 10, kosten: { nahrung: 50 }, zeit: 25, kuerzel: 'd',
    angriff: 3, nahruestung: 0, fernruestung: 0, reichweite: 0, nachladen: 2, klassen: ['dorf'],
    // Er wehrt sich nicht von selbst (kampf AC-2): ein Dorfbewohner, der jedem
    // Spaeher entgegenlaeuft, hoert auf zu arbeiten, und die Wirtschaft ist das
    // Spiel. Getroffen wird er trotzdem wehrhaft.
    wacht: false,
    baut: ['haus', 'muehle', 'holzfaellerlager', 'bergbaulager', 'farm', 'kaserne', 'schiessanlage', 'stall', 'schmiede', 'aussenposten',
      'kloster', 'universitaet', 'belagerungswerkstatt', 'wachturm', 'steinmauer', 'tor', 'burg', 'markt'],
  },
  // Ausgebildet wird er im Stall, also ab der Feudalzeit; zu Beginn steht
  // einer in der Startaufstellung (bauen AC-22).
  spaeherreiter: {
    leben: 45, tempo: 1.2, sicht: 4, tragkraft: 0, kosten: { nahrung: 80 }, zeit: 30, kuerzel: 's',
    angriff: 3, nahruestung: 0, fernruestung: 2, reichweite: 0, nachladen: 2, klassen: ['kavallerie'],
  },
  // Kaempfen kann die Miliz ab Stufe B; bis dahin laeuft sie (bauen AC-9).
  miliz: {
    leben: 40, tempo: 0.9, sicht: 4, tragkraft: 0, kosten: { nahrung: 60, gold: 20 }, zeit: 21, kuerzel: 'm',
    angriff: 4, nahruestung: 0, fernruestung: 1, reichweite: 0, nachladen: 2, klassen: ['infanterie'],
  },
  // Die drei Einheiten der Feudalzeit (einheiten AC-23). `zeitalter: 1` sperrt
  // sie bis zum Aufstieg - auch in der Kaserne, die schon in der Dunklen Zeit
  // steht.
  speerkaempfer: {
    leben: 45, tempo: 1.0, sicht: 4, tragkraft: 0, kosten: { nahrung: 35, holz: 25 }, zeit: 22, kuerzel: 'p',
    angriff: 3, nahruestung: 0, fernruestung: 0, reichweite: 0, nachladen: 3,
    klassen: ['infanterie', 'speer'], bonus: { kavallerie: 15 }, zeitalter: 1,
  },
  bogenschuetze: {
    leben: 30, tempo: 0.96, sicht: 6, tragkraft: 0, kosten: { holz: 25, gold: 45 }, zeit: 35, kuerzel: 'b',
    angriff: 4, nahruestung: 0, fernruestung: 0, reichweite: 4, nachladen: 2,
    klassen: ['bogenschuetze'], bonus: { speer: 3 }, zeitalter: 1,
  },
  plaenkler: {
    leben: 30, tempo: 0.96, sicht: 6, tragkraft: 0, kosten: { nahrung: 25, holz: 35 }, zeit: 22, kuerzel: 'k',
    angriff: 2, nahruestung: 0, fernruestung: 3, reichweite: 4, nachladen: 3,
    klassen: ['bogenschuetze'], bonus: { bogenschuetze: 3 }, zeitalter: 1,
  },
  // Die zweite Stufe der Miliz (einheiten AC-24). Sie wird nicht neben der
  // Miliz ausgebildet, sondern **statt** ihrer: wer die Verbesserung
  // `soldatenstufe` hat, bekommt in der Kaserne nur noch Soldaten, und seine
  // Milizen sind schon welche. Deshalb kostet sie dasselbe wie die Miliz.
  soldat: {
    leben: 45, tempo: 0.9, sicht: 4, tragkraft: 0, kosten: { nahrung: 60, gold: 20 }, zeit: 21, kuerzel: 'o',
    angriff: 6, nahruestung: 0, fernruestung: 1, reichweite: 0, nachladen: 2,
    klassen: ['infanterie'], zeitalter: 1, stufeVon: 'miliz',
  },
  // Die Einheiten der Ritterzeit (einheiten AC-33, AC-34), Werte aus der
  // Vorlage. Der Ritter ist eine neue Einheit im Stall; der Armbrustschuetze
  // ist die zweite Stufe des Bogenschuetzen, wie der Soldat die der Miliz -
  // er kostet dasselbe und ersetzt ihn mit der Verbesserung `armbrust`.
  ritter: {
    leben: 100, tempo: 1.35, sicht: 4, tragkraft: 0, kosten: { nahrung: 60, gold: 75 }, zeit: 30, kuerzel: 'r',
    angriff: 10, nahruestung: 2, fernruestung: 2, reichweite: 0, nachladen: 1.8, klassen: ['kavallerie'], zeitalter: 2,
  },
  armbrustschuetze: {
    leben: 35, tempo: 0.96, sicht: 7, tragkraft: 0, kosten: { holz: 25, gold: 45 }, zeit: 27, kuerzel: 'a',
    angriff: 5, nahruestung: 0, fernruestung: 0, reichweite: 5, nachladen: 2,
    klassen: ['bogenschuetze'], bonus: { speer: 3 }, zeitalter: 2, stufeVon: 'bogenschuetze',
  },
  // Die Ramme (einheiten AC-35), Werte aus der Vorlage. `nurGebaeude`: sie
  // greift nur Gebaeude an - ein Befehl auf eine Einheit ist ein Gang dorthin,
  // und sie wacht nicht und wehrt sich nicht. Der Bonus gilt der Klasse
  // `gebaeude`, die jedes Gebaeude von selbst traegt (unten). Nachladezeit 5 s
  // wie im Original - sie steht nicht in der Tabelle der Vorlage. Sicht 3.
  ramme: {
    leben: 175, tempo: 0.5, sicht: 3, tragkraft: 0, kosten: { holz: 160, gold: 75 }, zeit: 36, kuerzel: 'w',
    angriff: 2, nahruestung: 0, fernruestung: 180, reichweite: 0, nachladen: 5,
    klassen: ['belagerung'], bonus: { gebaeude: 125 }, nurGebaeude: true, wacht: false, zeitalter: 2,
  },
  // Der Mangonel (einheiten AC-36, kampf AC-19), Werte aus der Vorlage. Er
  // wirft einen Stein, der fliegt (`geschoss`, Felder je Sekunde - so schnell
  // wie ein gezeichneter Pfeil, bedienung AC-40) und dort einschlaegt, wo das
  // Ziel beim Abwurf stand: alle Einheiten im Umkreis von `flaeche` Feldern,
  // auch eigene. Naeher als `mindestreichweite` wirft er nicht. Nicht in der
  // Tabelle der Vorlage und deshalb gesetzt: Nachladezeit 6 s wie im
  // Original, Sicht 9 - Reichweite plus zwei wie Bogen und Armbrust.
  mangonel: {
    leben: 50, tempo: 0.6, sicht: 9, tragkraft: 0, kosten: { holz: 160, gold: 135 }, zeit: 46, kuerzel: 'n',
    angriff: 40, nahruestung: 0, fernruestung: 6, reichweite: 7, mindestreichweite: 3, nachladen: 6,
    flaeche: 1, geschoss: 7, klassen: ['belagerung'], zeitalter: 2,
  },
};

// Wer von selbst wacht, greift an, was in seine Sichtweite kommt, ohne Befehl
// (kampf AC-2). Jede Einheit mit einem Angriff tut das - ausser denen, bei
// denen `wacht: false` steht. So braucht eine neue Kampfeinheit keinen
// Eintrag, und die Simulation fragt nie nach der Art.
for (const einheit of Object.values(EINHEITEN)) {
  einheit.wacht ??= einheit.angriff > 0;
}

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
    annahme: ALLE, bildetAus: ['dorfbewohner', 'webstuhl', 'stadtwache', 'stadtpatrouille', 'feudalzeit', 'ritterzeit', 'imperialzeit'],
  },
  // `zumAufstieg: false`: zaehlt nicht zu den zwei Gebaeuden, die ein Aufstieg
  // verlangt (bauen AC-23) - Haeuser, Aussenposten, Tuerme und Mauern nicht,
  // wie in der Vorlage. Sonst hiesse die Ritterzeit zwei Mauerfelder fuer
  // zehn Stein.
  haus: { groesse: 2, kosten: { holz: 25 }, bauzeit: 25, leben: 550, wohnraum: 5, annahme: [], bildetAus: [], zumAufstieg: false },
  // Ein Turm nur zum Sehen (kampf AC-18, Wunsch des Benutzers: Gebaeude und
  // Forschung veraendern die Flaeche des Nebels). Werte aus der Vorlage, die
  // Sicht von zehn Feldern wie im Original.
  aussenposten: { groesse: 1, kosten: { holz: 25, stein: 25 }, bauzeit: 15, leben: 500, wohnraum: 0, annahme: [], bildetAus: [], sicht: 10, zumAufstieg: false },
  muehle: { groesse: 2, kosten: { holz: 100 }, bauzeit: 35, leben: 1000, wohnraum: 0, annahme: ['nahrung'], bildetAus: ['pferdekummet'] },
  holzfaellerlager: { groesse: 2, kosten: { holz: 100 }, bauzeit: 35, leben: 1000, wohnraum: 0, annahme: ['holz'], bildetAus: ['doppelaxt'] },
  bergbaulager: { groesse: 2, kosten: { holz: 100 }, bauzeit: 35, leben: 1000, wohnraum: 0, annahme: ['gold', 'stein'], bildetAus: [] },
  // Eine Farm ist begehbar, traegt 175 Nahrung und wird mit 0,32 je Sekunde
  // bestellt - von hoechstens einem (einheiten AC-18).
  //
  // `bestand: false` heisst: sie haelt niemanden im Spiel. Wer nur noch ein
  // Feld Weizen hat, ist ausgeschieden (spielziel AC-5). Mauern und Tore
  // bekommen in Stufe D dieselbe Zeile; alles ohne sie zaehlt zum Bestand.
  farm: {
    groesse: 3, kosten: { holz: 60 }, bauzeit: 15, leben: 480, wohnraum: 0, annahme: [], bildetAus: [],
    begehbar: true, nahrung: 175, rate: 0.32, bestand: false,
  },
  kaserne: { groesse: 3, kosten: { holz: 175 }, bauzeit: 50, leben: 1200, wohnraum: 0, annahme: [], bildetAus: ['miliz', 'speerkaempfer', 'soldatenstufe'] },
  // Gebaeude der Feudalzeit (bauen AC-24): `zeitalter: 1` sperrt sie, bis die
  // Feudalzeit erreicht ist. Die Schmiede bildet keine Einheiten aus - sie
  // forscht (bauen AC-25).
  schiessanlage: {
    groesse: 3, kosten: { holz: 175 }, bauzeit: 50, leben: 1000, wohnraum: 0, annahme: [],
    bildetAus: ['bogenschuetze', 'plaenkler', 'armbrust'], zeitalter: 1,
  },
  stall: {
    groesse: 3, kosten: { holz: 175 }, bauzeit: 50, leben: 1000, wohnraum: 0, annahme: [], bildetAus: ['spaeherreiter', 'ritter'], zeitalter: 1,
  },
  schmiede: {
    groesse: 3, kosten: { holz: 150 }, bauzeit: 40, leben: 1200, wohnraum: 0, annahme: [],
    bildetAus: ['schmiedeangriff', 'befiedertePfeile', 'eisenguss', 'bodkinpfeil'], zeitalter: 1,
  },
  // Gebaeude der Ritterzeit (bauen AC-28), Werte aus der Vorlage. Was sie
  // ausbilden und erforschen, kommt mit ihren Schritten: der Moench (D8),
  // Ramme und Mangonel (D6). Die Universitaet forscht Mauerwerk (bauen AC-34).
  kloster: { groesse: 3, kosten: { holz: 175 }, bauzeit: 40, leben: 2100, wohnraum: 0, annahme: [], bildetAus: [], zeitalter: 2 },
  universitaet: { groesse: 3, kosten: { holz: 200 }, bauzeit: 60, leben: 2100, wohnraum: 0, annahme: [], bildetAus: ['mauerwerk'], zeitalter: 2 },
  belagerungswerkstatt: { groesse: 3, kosten: { holz: 200 }, bauzeit: 40, leben: 2100, wohnraum: 0, annahme: [], bildetAus: ['ramme', 'mangonel'], zeitalter: 2 },
  // Ein Gebaeude, das schiesst (bauen AC-29): `angriff`, `reichweite` und
  // `nachladen` wie bei einer Einheit, Pfeile also Fernkampf. Werte aus der
  // Vorlage - 5 Angriff, Reichweite 8, alle zwei Sekunden ein Pfeil, Ruestung
  // 1/7. Im Original steht er ab der Feudalzeit, gebaut wird er mit den
  // Befestigungen der Stufe D. Ein Gebaeude ohne `angriff` schiesst nicht.
  // Sicht 9: ein Feld ueber die Reichweite, damit er sieht, worauf er
  // schiesst - und weniger als der Aussenposten, der das Gebaeude zum Sehen
  // ist (kampf AC-18).
  wachturm: {
    groesse: 1, kosten: { holz: 25, stein: 125 }, bauzeit: 80, leben: 1020, wohnraum: 0, annahme: [], bildetAus: [], zeitalter: 1,
    angriff: 5, reichweite: 8, nachladen: 2, nahruestung: 1, fernruestung: 7, sicht: 9, zumAufstieg: false,
  },
  // Die Steinmauer (bauen AC-30): ein Feld je Baustelle, gezogen statt
  // gesetzt (`gezogen`), Werte aus der Vorlage - 5 Stein, 8 Sekunden, 1800
  // Leben. Sie haelt niemanden im Spiel (`bestand: false`, wie in der
  // Vorlage) und zaehlt nicht zum Aufstieg. Sicht 2 statt der 8 eines
  // Gebaeudes: eine lange Mauer waere sonst ein Band aus Aussenposten und
  // deckte den Nebel auf (kampf AC-18 bleibt beim Aussenposten).
  // Ein Tor (bauen AC-31): fuer die eigenen Einheiten begehbar, fuer alle
  // anderen eine Sperre wie die Mauer. Werte aus der Vorlage. Abweichung: ein
  // Feld statt vier in einer Reihe - Gebaeude sind hier quadratisch, und ein
  // Feld passt in eine Mauer jeder Richtung, auch schraeg. Gesetzt wird es in
  // eine Luecke oder auf ein Feld der eigenen Mauer, das es ersetzt
  // (`ersetzt`), wie in der Vorlage.
  tor: { groesse: 1, kosten: { stein: 30 }, bauzeit: 70, leben: 2750, wohnraum: 0, annahme: [], bildetAus: [], zeitalter: 1,
    tor: true, ersetzt: 'steinmauer', bestand: false, zumAufstieg: false, sicht: 2 },
  steinmauer: {
    groesse: 1, kosten: { stein: 5 }, bauzeit: 8, leben: 1800, wohnraum: 0, annahme: [], bildetAus: [], zeitalter: 1,
    gezogen: true, bestand: false, zumAufstieg: false, sicht: 2,
  },
  // Die Burg (bauen AC-32): Kosten, Bauzeit, Leben und Wohnraum aus der
  // Vorlage, die Kampfwerte aus derselben Zeile darunter - 11 Angriff,
  // Reichweite 8, alle zwei Sekunden ein Pfeil, Ruestung 8/11. Sie schiesst
  // nach derselben Regel wie der Wachturm (`welt.tuermeTakten()` misst vom
  // Rand der Grundflaeche). Sicht 9 statt der 11 des Originals: ein Feld ueber
  // die Reichweite wie beim Wachturm, und der Aussenposten bleibt das Gebaeude,
  // das am weitesten sieht (kampf AC-18). Die Spezialeinheit kommt mit den
  // Voelkern (Stufe E), der Unterschlupf ist nicht gebaut.
  burg: {
    groesse: 4, kosten: { stein: 650 }, bauzeit: 200, leben: 4800, wohnraum: 20, annahme: [], bildetAus: [], zeitalter: 2,
    angriff: 11, reichweite: 8, nachladen: 2, nahruestung: 8, fernruestung: 11, sicht: 9,
  },
  // Der Markt (bauen AC-33): Kosten, Bauzeit und Leben aus der Vorlage, ab der
  // Feudalzeit wie dort. Vier mal vier Felder wie im Original. `handel` sagt,
  // dass an ihm getauscht wird - die Preise stehen unten in HANDEL. Karren und
  // Handel zwischen Maerkten gibt es nicht (ADR-0012).
  markt: {
    groesse: 4, kosten: { holz: 175 }, bauzeit: 60, leben: 1300, wohnraum: 0, annahme: [], bildetAus: [], zeitalter: 1,
    handel: true,
  },
};

// Jedes Gebaeude ist auch ein Ziel (kampf AC-1), also braucht es Ruestung und
// eine Ruestungsklasse. Nach dem Original: keine Nahruestung, aber 7
// Fernruestung - Pfeile richten an Mauerwerk kaum etwas aus, ein Rammbock
// umso mehr. Hier als Grundwert, damit nicht zehnmal dasselbe dasteht; ein
// Turm in einer spaeteren Stufe traegt seine eigenen Zahlen.
for (const gebaeude of Object.values(GEBAEUDE)) {
  gebaeude.nahruestung ??= 0;
  gebaeude.fernruestung ??= 7;
  gebaeude.klassen ??= ['gebaeude'];
  // Ein Gebaeude sieht acht Felder ueber seinen Rand hinaus (kampf AC-11, AC-15).
  gebaeude.sicht ??= 8;
}

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
  // Die erste Verbesserung, die eine Einheit **austauscht** statt sie
  // aufzuwerten: `wandelt` macht aus jeder Miliz einen Soldaten, auch aus
  // denen, die schon stehen oder gerade ausgebildet werden (einheiten AC-24).
  // Die Vorlage laesst die Kosten offen; genommen sind die des Originals.
  soldatenstufe: {
    name: 'Soldat', kosten: { nahrung: 100, gold: 40 }, zeit: 40, zeitalter: 1,
    wirkung: {}, wandelt: { miliz: 'soldat' },
  },
  // Die Armbrust (einheiten AC-34): jeder Bogenschuetze wird Armbrustschuetze,
  // wie Soldat die Miliz. Kosten aus dem Original, die Dauer ebenso.
  armbrust: {
    name: 'Armbrust', kosten: { nahrung: 125, gold: 75 }, zeit: 35, zeitalter: 2,
    wirkung: {}, wandelt: { bogenschuetze: 'armbrustschuetze' },
  },
  // Die Verbesserungen der Feudalzeit (bauen AC-25, AC-26). Kosten und Wirkung
  // stehen in der Vorlage; die Vorlage nennt keine Forschungsdauer, deshalb
  // sind die Zeiten die des Originals.
  //
  // **Ein Schluessel in `wirkung` ist eine Einheitenart oder eine ihrer
  // `klassen`.** Damit trifft "Nah +1 Angriff" genau Infanterie und
  // Kavallerie - der Dorfbewohner hat die Klasse `dorf` und bleibt aussen vor,
  // wie im Original. Ohne Klassen muesste jede neue Einheit hier nachgetragen
  // werden.
  schmiedeangriff: {
    name: 'Schmiedeangriff', kosten: { nahrung: 100 }, zeit: 50, zeitalter: 1,
    zeichen: 'amboss',
    wirkung: { infanterie: { angriff: 1 }, kavallerie: { angriff: 1 } },
  },
  befiedertePfeile: {
    name: 'Befiederte Pfeile', kosten: { nahrung: 100, gold: 50 }, zeit: 30, zeitalter: 1,
    zeichen: 'pfeil',
    wirkung: { bogenschuetze: { angriff: 1, reichweite: 1 } },
  },
  // Wirtschaft: kein Kampfwert, sondern ein Faktor auf die Sammelrate und ein
  // Zuschlag auf jede Farm - auch auf die, die schon stehen.
  doppelaxt: {
    name: 'Doppelaxt', kosten: { nahrung: 100, holz: 50 }, zeit: 50, zeitalter: 1,
    zeichen: 'axt',
    wirkung: {}, sammeln: { holz: 1.2 },
  },
  pferdekummet: {
    name: 'Pferdekummet', kosten: { nahrung: 75, holz: 75 }, zeit: 20, zeitalter: 1,
    zeichen: 'kummet',
    wirkung: {}, farm: { nahrung: 75 },
  },
  // Sicht fuer Gebaeude (kampf AC-17, Wunsch des Benutzers: Forschung
  // veraendert die Flaeche des Nebels). Kosten und Wirkung aus der Vorlage,
  // die Dauer die des Originals. `gebaeude` trifft jedes eigene Gebaeude, wie
  // `farm` jede Farm.
  stadtwache: {
    name: 'Stadtwache', kosten: { nahrung: 75 }, zeit: 25, zeitalter: 1,
    zeichen: 'laterne',
    wirkung: {}, gebaeude: { sicht: 4 },
  },
  // Die Verbesserungen der Ritterzeit (bauen AC-34). Kosten und Wirkung aus
  // der Spec, die Dauer die des Originals. `vorstufe` ist die Verbesserung,
  // die vorher erforscht sein muss: Eisenguss setzt den Schmiedeangriff
  // voraus, wie im Original - ohne sie steht der Knopf nicht im Menue, und
  // der Server sagt ab.
  eisenguss: {
    name: 'Eisenguss', kosten: { nahrung: 220, gold: 120 }, zeit: 75, zeitalter: 2,
    vorstufe: 'schmiedeangriff', zeichen: 'giesskelle',
    wirkung: { infanterie: { angriff: 1 }, kavallerie: { angriff: 1 } },
  },
  bodkinpfeil: {
    name: 'Bodkinpfeil', kosten: { nahrung: 200, gold: 100 }, zeit: 35, zeitalter: 2,
    vorstufe: 'befiedertePfeile', zeichen: 'bodkin',
    wirkung: { bogenschuetze: { angriff: 1, reichweite: 1 } },
  },
  // Mauerwerk wirkt auf Gebaeude statt Einheiten, deshalb unter `gebaeude`
  // wie die Sicht der Stadtwache. `lebenAnteil` ist ein Anteil des
  // Grundwerts - "+10 % Leben" -, die Ruestung ein Zuschlag.
  mauerwerk: {
    name: 'Mauerwerk', kosten: { holz: 175, stein: 150 }, zeit: 50, zeitalter: 2,
    zeichen: 'kelle',
    wirkung: {}, gebaeude: { lebenAnteil: 0.1, nahruestung: 1, fernruestung: 1 },
  },
  stadtpatrouille: {
    name: 'Stadtpatrouille', kosten: { nahrung: 300, gold: 100 }, zeit: 50, zeitalter: 2,
    vorstufe: 'stadtwache', zeichen: 'horn',
    wirkung: {}, gebaeude: { sicht: 4 },
  },
};

// Die Klassen, auf die Bonusschaden und Verbesserungen greifen (kampf AC-3,
// bauen AC-25). Hier stehen nur die **Namen**: welche Einheit zu welcher
// Klasse gehoert, steht als `klassen` an der Einheit. Die Leiste braucht den
// Namen, um "+15 gegen Kavallerie" zu schreiben (bedienung AC-35) - ohne
// Tabelle stuende dort "kavallerie".
const KLASSEN = {
  dorf: { name: 'Dorfbewohner' },
  infanterie: { name: 'Infanterie' },
  speer: { name: 'Speerkämpfer' },
  bogenschuetze: { name: 'Bogenschützen' },
  kavallerie: { name: 'Kavallerie' },
  // Belagerung (einheiten AC-35). `gebaeude` traegt jedes Gebaeude von selbst
  // (oben) - die Ramme hat ihren Bonus dagegen.
  belagerung: { name: 'Belagerung' },
  gebaeude: { name: 'Gebäude' },
};

// Der Handel am Markt (bauen AC-33). Getauscht werden immer `menge` Einheiten
// gegen Gold. Jede Ware hat einen Grundpreis in Gold je `menge`; gekauft wird
// zum Grundpreis plus `gebuehr`, verkauft zum Grundpreis minus `gebuehr`.
// Jeder Kauf hebt den Grundpreis dieser Ware um `schritt`, jeder Verkauf senkt
// ihn um `schritt`, nie unter `tiefst`. Die Preise gelten je Spieler.
//
// Aus der Vorlage: Grundpreis 100, Stein 130, Gebuehr 30 %. Schritt und
// Tiefstpreis sind dort nicht als Zahl genannt, wohl aber, wie viel man
// verkaufen muss, bis der Preis ganz unten ist - 4000 Nahrung oder Holz,
// 5500 Stein. Das sind 40 und 55 Verkaeufe zu je 100; nur Schritt 2 und
// Tiefstpreis 20 erfuellen beides: (100 - 20) / 2 = 40, (130 - 20) / 2 = 55.
// Nach oben ist der Preis offen - wer kauft, bezahlt mit Gold, und das ist
// endlich.
const HANDEL = {
  menge: 100,
  waren: { holz: 100, nahrung: 100, stein: 130 },
  gebuehr: 0.3,
  schritt: 2,
  tiefst: 20,
};

module.exports = {
  EINHEITEN, SAMMELN, TIERE, GEBAEUDE, VERBESSERUNGEN, ZEITALTER, AUFSTIEGE, KLASSEN, HANDEL,
  BEVOELKERUNG_MAX, SCHLANGE_MAX, STARTAUFSTELLUNG,
};
