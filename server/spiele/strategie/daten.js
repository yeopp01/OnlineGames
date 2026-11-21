// @ts-check
'use strict';

// Die Werte des Strategiespiels an einer Stelle (→ specs/10-strategie/bauen.md
// AC-20, docs/strategie/vorlage-aoe2.md). Die Simulation liest sie hier und
// verzweigt nicht nach Einheit oder Volk.

// Die Formen der Tabellen, fuer den Pruefer (`npm run typen`): ein Feld, das
// hier nicht steht, ist in einer Tabelle unten und in jeder geprueften Datei,
// die es liest, ein Fehler. Wer ein neues Feld einfuehrt, traegt es hier ein.
// Was die Felder bedeuten, steht an den Tabellen.

/**
 * Mengen je Rohstoff - Kosten, Faktoren auf das Sammeln, Zuschlaege.
 * `gefallene` steht nur in Kosten (einheiten AC-49): bezahlt wird mit eigenen
 * Einheiten, die gestorben sind.
 * @typedef {{holz?: number, nahrung?: number, gold?: number, stein?: number, gefallene?: number}} Rohstoffe
 */

/**
 * @typedef {object} Einheitenwerte
 * @property {number} leben
 * @property {number} tempo Felder je Sekunde
 * @property {number} sicht Felder
 * @property {number} tragkraft
 * @property {Rohstoffe} kosten
 * @property {number} zeit Sekunden der Ausbildung
 * @property {string} kuerzel die Art auf der Leitung
 * @property {number} angriff
 * @property {number} nahruestung
 * @property {number} fernruestung
 * @property {number} reichweite Felder, 0 heisst Nahkampf
 * @property {number} nachladen Sekunden zwischen zwei Schlaegen
 * @property {string[]} klassen als was die Einheit getroffen wird
 * @property {Record<string, number>} [bonus] Zuschlag je Klasse des Ziels
 * @property {boolean} [wacht] fehlt es, wacht jede Einheit mit einem Angriff
 * @property {number} [getarnt] Felder: erst so nah an einer Einheit oder einem Gebaeude des Gegners zaehlt sie fuer ihn als gesehen (kampf AC-22)
 * @property {string[]} [baut]
 * @property {number} [zeitalter] fehlt es, gilt die Dunkle Zeit (0)
 * @property {string[]} [haeuser] nur diese Haeuser bilden sie aus; fehlt es, jedes (einheiten AC-42)
 * @property {string} [stufeVon] die Stufe davor - ausgebildet wird immer die erreichte (einheiten AC-24, AC-58)
 * @property {boolean} [nurGebaeude]
 * @property {number} [mindestreichweite]
 * @property {number} [flaeche]
 * @property {number} [geschoss] Felder je Sekunde
 * @property {{reichweite: number, je: number, nicht: string[]}} [heilen]
 * @property {{reichweite: number, frueh: number, spaet: number, chance: number, ruhe: number, nicht: string[]}} [bekehren]
 * @property {boolean} [handelt]
 * @property {{getroffenVon: string[]}} [fliegt] fliegt ohne Wegsuche; getroffen nur von Einheiten dieser Klassen und von Gebaeuden, die schiessen (kampf AC-23)
 * @property {boolean} [feuer] sein Geschoss ist Feuer, kein Stein - nur fuer das Bild (einheiten AC-52)
 * @property {boolean} [gerufen] wird nicht ausgebildet, sondern gerufen (bauen AC-35)
 */

/**
 * @typedef {object} Gebaeudewerte
 * @property {number} groesse Kantenlaenge in Feldern
 * @property {Rohstoffe} kosten
 * @property {number} bauzeit Sekunden
 * @property {number} leben
 * @property {number} wohnraum
 * @property {string[]} annahme welche Rohstoffe dort abgegeben werden
 * @property {string[]} bildetAus Einheiten, Verbesserungen und Aufstiege
 * @property {number} [zeitalter] fehlt es, gilt die Dunkle Zeit (0)
 * @property {boolean} [zumAufstieg]
 * @property {boolean} [bestand]
 * @property {number} [sicht] fehlt es, sind es acht Felder
 * @property {number} [nahruestung] fehlt es, ist es 0
 * @property {number} [fernruestung] fehlt es, ist es 7
 * @property {string[]} [klassen] fehlt es, ist es `gebaeude`
 * @property {number} [angriff] nur ein Gebaeude, das schiesst
 * @property {Record<string, number>} [bonus] Zuschlag je Klasse des Ziels - die Schadensformel liest ihn, noch traegt ihn keins
 * @property {number} [reichweite]
 * @property {number} [nachladen]
 * @property {number} [pfeile] Pfeile je Salve; fehlt es, ist es einer (bauen AC-32)
 * @property {boolean} [begehbar]
 * @property {number} [nahrung] die Farm
 * @property {number} [rate]
 * @property {boolean} [tor]
 * @property {number} [laenge] Felder in der Laenge, wenn es kein Quadrat ist (bauen AC-37)
 * @property {number} [pfeiler] Felder je Ende, die niemand betritt (bauen AC-37)
 * @property {string} [ersetzt]
 * @property {boolean} [gezogen]
 * @property {number} [seite] Seite im Baumenue (bedienung AC-64): fehlt es, ist es die erste (Wirtschaft), 1 ist die zweite (Militaer)
 * @property {boolean} [handel]
 * @property {number} [hoechstens] so viele je Spieler, Baustellen mitgezaehlt (bauen AC-51)
 * @property {boolean} [wunder] steht es fertig WUNDER_SEKUNDEN lang, gewinnt sein Besitzer (spielziel AC-29)
 */

/**
 * Was eine Verbesserung oder ein Haus bewirkt - dieselben Formen, gelesen in
 * `welt.wirkungen()`.
 *
 * @typedef {object} Wirkungen
 * @property {Record<string, Record<string, number>>} [wirkung] je Einheitenart oder Klasse; `tempoAnteil` ist ein Anteil am Tempo statt eines Zuschlags (bauen AC-46)
 * @property {Rohstoffe} [sammeln] Faktor je Rohstoff
 * @property {{nahrung?: number}} [farm]
 * @property {Record<string, number>} [gebaeude]
 * @property {Record<string, Record<string, number>>} [bauwerk] Zuschlaege je Gebaeudeart (bauen AC-38)
 * @property {Record<string, number>} [handel] nur bei Haeusern
 * @property {Record<string, number>} [preis] Faktor auf die Kosten je Einheitenart, nur bei Haeusern (einheiten AC-44)
 * @property {Record<string, number>} [ausbildung] Faktor je Gebaeudeart: im Mannschaftsbonus und bei der Wehrpflicht (bauen AC-50)
 * @property {Record<string, Record<string, number>>} [bonus] je Einheitenart oder Klasse des Angreifers ein Zuschlag je Klasse des Ziels (bauen AC-54, AC-56)
 * @property {{reichweite?: number, ruhe?: number}} [bekehren] Zuschlaege auf Reichweite und Ruhe des Bekehrens (bauen AC-55)
 * @property {number} [bautempo] Faktor auf das Bauen der Dorfbewohner (bauen AC-56)
 * @property {Record<string, Record<string, number>>} [bonusAnteil] je Einheitenart oder Klasse des Angreifers ein Anteil mehr Schaden je Klasse des Ziels (bauen AC-50)
 */

/**
 * @typedef {object} VerbesserungNurHier
 * @property {string} name
 * @property {Rohstoffe} kosten
 * @property {number} zeit Sekunden der Forschung
 * @property {number} [zeitalter]
 * @property {string} [zeichen] das Bild im Menue
 * @property {string} [vorstufe]
 * @property {Record<string, string>} [wandelt] tauscht eine Einheitenart aus
 * @property {Record<string, string>} [nennt] wie ein Gebaeude oder eine Einheit danach heisst (bauen AC-38, einheiten AC-69)
 * @property {string} [hebt] die Einheit, die sie auf ihre Elitestufe hebt - die Art bleibt (einheiten AC-69)
 * @property {string[]} [haeuser] nur diese Haeuser erforschen sie (einheiten AC-69)
 * @property {Record<string, string>} [bild] mit welchem Bild es danach steht (bauen AC-38)
 * @property {boolean} [karte] die ganze Karte gilt danach als erkundet (bauen AC-52)
 *
 * @typedef {VerbesserungNurHier & Wirkungen} Verbesserung
 */

/**
 * Wozu ein Haus den Computerspieler neigen laesst (ki AC-27). Ohne Haus ist
 * sie leer.
 * @typedef {{schwerpunkt?: string, goldKnapp?: number, anzahl?: number, steinSammler?: number}} Neigung
 */

/**
 * @typedef {object} Haus
 * @property {string} name
 * @property {string} sitz
 * @property {string} wahlspruch
 * @property {Wirkungen} boni
 * @property {Record<number, Wirkungen>} [boniAb] je Zeitalter, ab dem sie gelten
 * @property {Wirkungen} mannschaft
 * @property {Neigung} ki
 */

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
/** @type {Record<string, Einheitenwerte>} */
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
      'kloster', 'universitaet', 'belagerungswerkstatt', 'wachturm', 'steinmauer', 'tor', 'burg', 'markt', 'wunder'],
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
  // Bogen- und Armbrustschuetze kosten 30 Holz statt 25 der Vorlage
  // (Benutzer, 2026-11-12, Runde 202): Eschenbruch gewann mit seiner Neigung
  // zur Schiessanlage auch ohne Boni die meisten Partien (spielziel AC-18).
  // Erst stand hier 50 Gold - dann holte die KI ohne Gold in der Ritterzeit
  // nur noch in 3 von 8 Partien Gold mit Karren (ki AC-26), mit Holz in 7.
  bogenschuetze: {
    leben: 30, tempo: 0.96, sicht: 6, tragkraft: 0, kosten: { holz: 30, gold: 45 }, zeit: 35, kuerzel: 'b',
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
  // Der Ritter (einheiten AC-33), Werte aus der Vorlage: eine neue Einheit im
  // Stall.
  ritter: {
    leben: 100, tempo: 1.35, sicht: 4, tragkraft: 0, kosten: { nahrung: 60, gold: 75 }, zeit: 30, kuerzel: 'r',
    angriff: 10, nahruestung: 2, fernruestung: 2, reichweite: 0, nachladen: 1.8, klassen: ['kavallerie'], zeitalter: 2,
  },
  // **Zwei Schuetzenlinien nebeneinander** (einheiten AC-34, AC-58; Benutzer,
  // 2026-11-13) - eine Abweichung vom Original, in dem der Bogenschuetze zum
  // Armbrustschuetzen wird (docs/strategie/vorlage-aoe2.md).
  //
  // Die Bogenlinie: der `bogenschuetze` des Lehens heisst am Bildschirm
  // Kurzbogenschuetze; im Fuerstentum macht die Verbesserung `bogenstufe`
  // daraus den Bogenschuetzen - diese Einheit hier, mit den Werten, die bis
  // dahin der Armbrustschuetze trug. In der Krone folgt der
  // `langbogenschuetze` (einheiten AC-67). Der Bezeichner des Lehens bleibt, weil Tests, Bilder und
  // Nachweise an ihm haengen; deshalb traegt die zweite Stufe die Zwei.
  bogenschuetze2: {
    leben: 35, tempo: 0.96, sicht: 7, tragkraft: 0, kosten: { holz: 30, gold: 45 }, zeit: 27, kuerzel: 'j',
    angriff: 5, nahruestung: 0, fernruestung: 0, reichweite: 5, nachladen: 2,
    klassen: ['bogenschuetze'], bonus: { speer: 3 }, zeitalter: 2, stufeVon: 'bogenschuetze',
  },
  // Die Armbrustlinie: eine eigene Einheit der Schiessanlage ab dem
  // Fuerstentum, langsam und mit schwerem Bolzen. Alle Werte sind Startwerte
  // des Benutzers: 9 Angriff alle 3,5 Sekunden, Reichweite 5, 35 Holz und 55
  // Gold; Leben, Tempo, Sicht und Ausbildungszeit wie der Bogenschuetze
  // daneben. Der Unterschied kommt ohne Sonderregel aus `Angriff - Ruestung`:
  // gegen 2 Fernruestung macht der Bolzen 7 in 3,5 s (2,0 je Sekunde), der
  // Pfeil 3 in 2 s (1,5); gegen Ungeruestete liegen beide gleich (2,6 und
  // 2,5), und der Bogen ist billiger. Keinen Bonus gegen Speer - den hat die
  // Bogenlinie. In der Krone folgt die `schwerearmbrust` (einheiten AC-67).
  armbrustschuetze: {
    leben: 35, tempo: 0.96, sicht: 7, tragkraft: 0, kosten: { holz: 35, gold: 55 }, zeit: 27, kuerzel: 'a',
    angriff: 9, nahruestung: 0, fernruestung: 0, reichweite: 5, nachladen: 3.5,
    klassen: ['bogenschuetze'], zeitalter: 2,
  },
  // Die zweiten und dritten Stufen des Fuerstentums (einheiten AC-59 bis
  // AC-62): jede ersetzt ihre Vorstufe durch eine Verbesserung, wie der
  // Soldat die Miliz, und kostet dasselbe wie sie. Leben, Angriff, Ruestung,
  // Reichweite und Bonus aus den offenen Technikbaum-Daten zum Original
  // (SiegeEngineers/aoe2techtree, gelesen 2026-11-13); das Tempo bleibt das
  // der Vorstufe hier. Nicht uebernommen: die Zuschlaege des Originals gegen
  // Gebaeude, Moenche und Sonderklassen, die es hier nicht gibt.
  langschwertkaempfer: {
    leben: 60, tempo: 0.9, sicht: 4, tragkraft: 0, kosten: { nahrung: 60, gold: 20 }, zeit: 21, kuerzel: 'l',
    angriff: 9, nahruestung: 1, fernruestung: 1, reichweite: 0, nachladen: 2,
    klassen: ['infanterie'], zeitalter: 2, stufeVon: 'soldat',
  },
  pikenier: {
    leben: 55, tempo: 1.0, sicht: 4, tragkraft: 0, kosten: { nahrung: 35, holz: 25 }, zeit: 22, kuerzel: 'i',
    angriff: 4, nahruestung: 0, fernruestung: 0, reichweite: 0, nachladen: 3,
    klassen: ['infanterie', 'speer'], bonus: { kavallerie: 22 }, zeitalter: 2, stufeVon: 'speerkaempfer',
  },
  eliteplaenkler: {
    leben: 35, tempo: 0.96, sicht: 7, tragkraft: 0, kosten: { nahrung: 25, holz: 35 }, zeit: 22, kuerzel: 'e',
    angriff: 3, nahruestung: 0, fernruestung: 4, reichweite: 5, nachladen: 3,
    klassen: ['bogenschuetze'], bonus: { bogenschuetze: 4 }, zeitalter: 2, stufeVon: 'plaenkler',
  },
  // Tempo 1,55 und nicht die 1,5 des Originals: so schnell laeuft der
  // Spaeherreiter hier schon ab dem Lehen (einheiten AC-57), und eine
  // Verbesserung, die ihn bremst, verstuende niemand. Die Wirkung des Lehens
  // gilt der Art `spaeherreiter` und kommt hier nicht dazu.
  leichtekavallerie: {
    leben: 60, tempo: 1.55, sicht: 4, tragkraft: 0, kosten: { nahrung: 80 }, zeit: 30, kuerzel: 'v',
    angriff: 7, nahruestung: 0, fernruestung: 2, reichweite: 0, nachladen: 2,
    klassen: ['kavallerie'], zeitalter: 2, stufeVon: 'spaeherreiter',
  },
  // **Die Stufen der Krone** (einheiten AC-66), jede wie die des Fuerstentums:
  // eine Verbesserung tauscht die Vorstufe aus, Preis, Tempo und
  // Ausbildungszeit bleiben. **Eine Stufe je Linie, ausser beim Ritter** -
  // das Original hat beim Schwert und beim Ritter zwei (Champion, Paladin);
  // den Paladin gibt es hier (Benutzer, 2026-11-18), den Champion nicht.
  // Leben, Angriff, Ruestung und Bonus aus den offenen
  // Technikbaum-Daten zum Original (gelesen 2026-11-18,
  // docs/strategie/vorlage-aoe2.md). Jede hat ihre eigene gerenderte Figur
  // (darstellung AC-32).
  //
  // Die Kuerzel sind Grossbuchstaben: von a bis z ist jedes vergeben.
  zweihandkaempfer: {
    leben: 65, tempo: 0.9, sicht: 4, tragkraft: 0, kosten: { nahrung: 60, gold: 20 }, zeit: 21, kuerzel: 'Z',
    angriff: 12, nahruestung: 1, fernruestung: 1, reichweite: 0, nachladen: 2,
    klassen: ['infanterie'], zeitalter: 3, stufeVon: 'langschwertkaempfer',
  },
  hellebardier: {
    leben: 60, tempo: 1.0, sicht: 4, tragkraft: 0, kosten: { nahrung: 35, holz: 25 }, zeit: 22, kuerzel: 'H',
    angriff: 6, nahruestung: 0, fernruestung: 0, reichweite: 0, nachladen: 3,
    klassen: ['infanterie', 'speer'], bonus: { kavallerie: 32 }, zeitalter: 3, stufeVon: 'pikenier',
  },
  husar: {
    leben: 75, tempo: 1.55, sicht: 4, tragkraft: 0, kosten: { nahrung: 80 }, zeit: 30, kuerzel: 'U',
    angriff: 7, nahruestung: 0, fernruestung: 2, reichweite: 0, nachladen: 1.9,
    klassen: ['kavallerie'], zeitalter: 3, stufeVon: 'leichtekavallerie',
  },
  kavalier: {
    leben: 120, tempo: 1.35, sicht: 4, tragkraft: 0, kosten: { nahrung: 60, gold: 75 }, zeit: 30, kuerzel: 'K',
    angriff: 12, nahruestung: 2, fernruestung: 2, reichweite: 0, nachladen: 1.8,
    klassen: ['kavallerie'], zeitalter: 3, stufeVon: 'ritter',
  },
  paladin: {
    leben: 160, tempo: 1.35, sicht: 4, tragkraft: 0, kosten: { nahrung: 60, gold: 75 }, zeit: 30, kuerzel: 'P',
    angriff: 14, nahruestung: 2, fernruestung: 3, reichweite: 0, nachladen: 1.9,
    klassen: ['kavallerie'], zeitalter: 3, stufeVon: 'kavalier',
  },
  // Schuetzen und Belagerung der Krone (einheiten AC-67, AC-68). Der
  // Langbogenschuetze traegt die Werte des Arbalestenschuetzen der Vorlage,
  // die schwere Armbrust hat kein Vorbild - 12 Angriff alle 3,5 s sind ein
  // Startwert. Belagerungsramme und Onager aus den offenen Technikbaum-Daten
  // zum Original. Preis, Tempo und Ausbildungszeit bleiben die der Vorstufe;
  // gesetzt ist die Sicht des Onagers (Reichweite plus zwei wie beim
  // Mangonel).
  langbogenschuetze: {
    leben: 40, tempo: 0.96, sicht: 7, tragkraft: 0, kosten: { holz: 30, gold: 45 }, zeit: 27, kuerzel: 'L',
    angriff: 6, nahruestung: 0, fernruestung: 0, reichweite: 5, nachladen: 2,
    klassen: ['bogenschuetze'], bonus: { speer: 3 }, zeitalter: 3, stufeVon: 'bogenschuetze2',
  },
  schwerearmbrust: {
    leben: 40, tempo: 0.96, sicht: 7, tragkraft: 0, kosten: { holz: 35, gold: 55 }, zeit: 27, kuerzel: 'A',
    angriff: 12, nahruestung: 0, fernruestung: 0, reichweite: 5, nachladen: 3.5,
    klassen: ['bogenschuetze'], zeitalter: 3, stufeVon: 'armbrustschuetze',
  },
  belagerungsramme: {
    leben: 270, tempo: 0.5, sicht: 3, tragkraft: 0, kosten: { holz: 160, gold: 75 }, zeit: 36, kuerzel: 'R',
    angriff: 4, nahruestung: 0, fernruestung: 195, reichweite: 0, nachladen: 5,
    klassen: ['belagerung'], bonus: { gebaeude: 175 }, nurGebaeude: true, wacht: false, zeitalter: 3,
    stufeVon: 'ramme',
  },
  onager: {
    leben: 60, tempo: 0.6, sicht: 10, tragkraft: 0, kosten: { holz: 160, gold: 135 }, zeit: 46, kuerzel: 'O',
    angriff: 55, nahruestung: 0, fernruestung: 8, reichweite: 8, mindestreichweite: 3, nachladen: 6,
    flaeche: 1, geschoss: 7, klassen: ['belagerung', 'wurf'], zeitalter: 3, stufeVon: 'mangonel',
  },
  // **Einheiten der Haeuser** (ADR-0014, einheiten AC-42 bis AC-44). `haeuser`
  // nennt, wer sie ausbildet - gelesen neben `zeitalter`: im Menue, bei der
  // Ausbildung, in der Absage und von der KI. Fehlt es, bildet sie jedes Haus
  // aus. Alle Zahlen sind Startwerte aus der Spec; gesetzt, weil sie dort
  // nicht stehen: Sicht (Reichweite plus zwei wie bei Bogen und Armbrust, im
  // Nahkampf 4), Ausbildungszeit der Schuetzen (27 s wie ihre Nachbarn in der
  // Schiessanlage) und die Nachladezeit von Pavesenschuetze und Soeldner (2 s).
  //
  // Der Eibenschuetze, nur Eschenbruch: so viel Schaden wie kuenftig der
  // Langbogenschuetze, ein Feld weiter als jeder andere Schuetze, wenig Leben.
  // Keinen Bonus gegen Speer - den hat die Bogenlinie.
  eibenschuetze: {
    leben: 35, tempo: 0.96, sicht: 8, tragkraft: 0, kosten: { holz: 35, gold: 40 }, zeit: 27, kuerzel: 'y',
    angriff: 6, nahruestung: 0, fernruestung: 0, reichweite: 6, nachladen: 2,
    klassen: ['bogenschuetze'], zeitalter: 2, haeuser: ['eschenbruch'],
  },
  // Der Pavesenschuetze, nur Wehrstein: ein Schuetze hinter einem grossen
  // Schild - langsam, kurz, und Pfeile ritzen ihn nur.
  pavesenschuetze: {
    leben: 45, tempo: 0.85, sicht: 6, tragkraft: 0, kosten: { holz: 30, gold: 45 }, zeit: 27, kuerzel: 'z',
    angriff: 4, nahruestung: 1, fernruestung: 4, reichweite: 4, nachladen: 2,
    klassen: ['bogenschuetze'], zeitalter: 2, haeuser: ['wehrstein'],
  },
  // Der Soeldner, jedes Haus: kostet nur Gold und ist schnell da. Silberfurt
  // bekommt ihn billiger - das steht als `preis` in den Boni des Hauses.
  // 60 Leben statt der 55 aus der Spec: mit 55 faellt er einen Schlag frueher
  // als der Langschwertkaempfer und verliert gegen ihn 71 von 80 Gefechten;
  // mit 60 gewinnt er 44 von 80 (einheiten AC-44: keiner ueber 60 %).
  soeldner: {
    leben: 60, tempo: 1.0, sicht: 4, tragkraft: 0, kosten: { gold: 80 }, zeit: 18, kuerzel: 'q',
    angriff: 9, nahruestung: 1, fernruestung: 1, reichweite: 0, nachladen: 2,
    klassen: ['infanterie'], zeitalter: 2,
  },
  // **Aus der Burg** (einheiten AC-45 bis AC-47): je Haus eine Einheit, die
  // es sonst nirgends gibt. Kosten, Dauer und Tempo sind die Startwerte der
  // Spec; wo eine Entscheidung der Spec damit nicht hielt, steht es dabei.
  // Gemessen im Gefechtsstand, Budget 1200, jede Art auf beiden Seiten
  // (2026-11-18).
  //
  // Der Kriegswolf: schnell wie ein Ritter, aber kein Reiter - Klasse `tier`,
  // der Speer hat keinen Bonus gegen ihn, und die Schmiede ruestet ihn nicht.
  // Gegen Speerkaempfer und Pikeniere 40 von 40, gegen Langschwertkaempfer 0.
  kriegswolf: {
    leben: 55, tempo: 1.35, sicht: 5, tragkraft: 0, kosten: { nahrung: 60, gold: 30 }, zeit: 20, kuerzel: 'f',
    angriff: 7, nahruestung: 0, fernruestung: 1, reichweite: 0, nachladen: 1.5,
    klassen: ['tier'], zeitalter: 2, haeuser: ['eschenbruch'],
  },
  // Der Reiterschuetze: schiesst vom Pferd und wird als Reiter und als
  // Schuetze getroffen - Speer und Plaenkler haben beide ihren Bonus. Mit
  // zwei Klassen bekommt er auch beide Linien der Schmiede; das ist die eine
  // Regel der Wirkungen (Schluessel = Art oder Klasse), keine Ausnahme fuer
  // ihn. Reichweite 5 und Fernruestung 2 statt 4 und 0 aus der Spec: mit den
  // Startwerten verlor er gegen Armbrustschuetzen 40 von 40 - im Gefecht
  // haelt niemand Abstand, das Pferd nuetzt dort nichts. So gewinnt er 39 von
  // 40 und verliert gegen Plaenkler und Speerkaempfer 40 von 40.
  reiterschuetze: {
    leben: 60, tempo: 1.4, sicht: 6, tragkraft: 0, kosten: { holz: 40, gold: 70 }, zeit: 34, kuerzel: 'h',
    angriff: 5, nahruestung: 0, fernruestung: 2, reichweite: 5, nachladen: 2,
    klassen: ['kavallerie', 'bogenschuetze'], zeitalter: 2, haeuser: ['rappenstein'],
  },
  // Der Riese: viel Leben, langsam, +40 gegen Gebaeude - 50 je Schlag alle
  // drei Sekunden, zwei Drittel einer Ramme, aber er schlaegt auch Einheiten.
  // 180 Leben und keine Fernruestung statt 250 und 1 aus der Spec: mit den
  // Startwerten gewann er gegen Armbrustschuetzen 40 von 40, jetzt keines.
  // Speerkaempfer und Pikeniere haelt er auf (40 von 40), gegen
  // Langschwertkaempfer und Ritter verliert er.
  riese: {
    leben: 180, tempo: 0.6, sicht: 4, tragkraft: 0, kosten: { nahrung: 120, gold: 100 }, zeit: 40, kuerzel: 't',
    angriff: 10, nahruestung: 2, fernruestung: 0, reichweite: 0, nachladen: 3,
    klassen: ['infanterie'], bonus: { gebaeude: 40 }, zeitalter: 2, haeuser: ['wehrstein'],
  },
  // Der Meuchler (einheiten AC-48): **getarnt** - ein Gegner sieht ihn erst,
  // wenn eine seiner Einheiten oder eines seiner Gebaeude hoechstens `getarnt`
  // Felder entfernt steht (kampf AC-22). Er wacht nicht: wer von selbst auf
  // jeden losgeht, der in Sicht kommt, verraet sich. Getroffen, schlaegt er
  // zurueck wie ein Dorfbewohner. Ein Dorfbewohner (25 Leben) faellt nach
  // zwei Stichen. Gegen Soldaten gleicher Kosten 0 von 40.
  meuchler: {
    leben: 35, tempo: 1.1, sicht: 5, tragkraft: 0, kosten: { nahrung: 40, gold: 60 }, zeit: 25, kuerzel: 'u',
    angriff: 6, nahruestung: 0, fernruestung: 0, reichweite: 0, nachladen: 1.5,
    klassen: ['infanterie'], bonus: { dorf: 10, moench: 10 }, getarnt: 2, wacht: false,
    zeitalter: 2, haeuser: ['silberfurt'],
  },
  // Der Wiedergaenger (einheiten AC-49): kostet Gold **und einen Gefallenen** -
  // jede eigene Einheit, die stirbt, ist einer, und bezahlt wird er wie Holz
  // (`kosten`). Wer selbst aus einem Gefallenen entstand, zaehlt nicht noch
  // einmal. Untot: kein Moench bekehrt oder heilt ihn (`nicht` am Moench).
  wiedergaenger: {
    leben: 60, tempo: 0.7, sicht: 4, tragkraft: 0, kosten: { gold: 30, gefallene: 1 }, zeit: 10, kuerzel: 'x',
    angriff: 6, nahruestung: 1, fernruestung: 0, reichweite: 0, nachladen: 2,
    klassen: ['infanterie', 'untot'], zeitalter: 2, haeuser: ['distelhag'],
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
    flaeche: 1, geschoss: 7, klassen: ['belagerung', 'wurf'], zeitalter: 2,
  },
  // Der Moench (einheiten AC-37), Werte aus der Vorlage: 100 Gold, 51 s, 30
  // Leben, Tempo 0,7, keine Ruestung. Er greift nicht an - ohne `angriff`
  // wacht er nicht, und ein Befehl auf einen Gegner ist ein Gang dorthin.
  // `heilen`: wer steht, heilt eigene verletzte Einheiten in `reichweite`
  // Feldern um `je` Leben je Sekunde, eine nach der anderen. Nicht in der
  // Tabelle der Vorlage und deshalb gesetzt: Heilreichweite 4 wie im
  // Original, Sicht 11 - die Reichweite des Bekehrens (9, einheiten AC-38)
  // plus zwei wie bei Bogen und Armbrust.
  // `bekehren` (einheiten AC-38): ein Befehl auf eine fremde Einheit in
  // `reichweite` Feldern. Die Vorlage nennt nur die Reichweite; der Rest ist
  // gesetzt wie im Original: vor `frueh` Sekunden nie, danach je Sekunde mit
  // `chance`, nach `spaet` Sekunden sicher - gezogen aus dem Startwert der
  // Partie. Danach ruht der Moench `ruhe` Sekunden. Klassen in `nicht`
  // bekehrt er nicht, Gebaeude ohnehin nicht.
  moench: {
    leben: 30, tempo: 0.7, sicht: 11, tragkraft: 0, kosten: { gold: 100 }, zeit: 51, kuerzel: 'g',
    angriff: 0, nahruestung: 0, fernruestung: 0, reichweite: 0, nachladen: 0,
    klassen: ['moench'], heilen: { reichweite: 4, je: 1, nicht: ['belagerung', 'untot', 'drache'] },
    bekehren: { reichweite: 9, frueh: 4, spaet: 10, chance: 0.28, ruhe: 62, nicht: ['belagerung', 'moench', 'untot', 'drache'] },
    zeitalter: 2,
  },
  // Der Marktkarren (einheiten AC-39), Werte aus der Vorlage: 100 Holz, 50
  // Gold, 70 Leben, keine Ruestung, Tempo 1,0. Er greift nie an - ohne
  // `angriff` wacht er nicht, und ein Befehl auf einen Fremden ist ein Gang.
  // Am Markt erst ab der Ritterzeit (ADR-0013: in der Feudalzeit reicht das
  // Gold auf der Karte noch). Nicht in der Tabelle der Vorlage und deshalb
  // gesetzt, nach dem Fan-Wiki und **nicht geprueft**: 51 s Ausbildung, Sicht 7.
  // Was er handelt, kommt mit AC-40.
  marktkarren: {
    leben: 70, tempo: 1.0, sicht: 7, tragkraft: 0, kosten: { holz: 100, gold: 50 }, zeit: 51, kuerzel: 'c',
    angriff: 0, nahruestung: 0, fernruestung: 0, reichweite: 0, nachladen: 0,
    klassen: ['karren'], zeitalter: 2,
    // Pendelt zwischen zwei Maerkten und bringt Gold (einheiten AC-40) - wie
    // viel, steht unter `HANDEL.karren`.
    handelt: true,
  },
  // Der Drache (einheiten AC-52, ADR-0014) - statt des Trebuchets. Er wird
  // nicht ausgebildet, sondern am Kloster gerufen (bauen AC-35, `DRACHE.rufen`);
  // `kosten` ist der Preis des Rufens, damit er auf der Tafel und in den
  // Punkten zaehlt wie jede andere Einheit.
  // Startwerte aus ADR-0014: 500 Leben, Tempo 1,5, Ruestung 2 gegen Pfeile,
  // Feuer mit Reichweite 3 alle 3 Sekunden auf ein Feld Umkreis. Die ADR
  // nannte 15 Schaden an Einheiten und +200 gegen Gebaeude - gemessen
  // (tests/strategie-drache.test.mjs) verlor damit die Burg allein nie, und
  // zehn Armbrustschuetzen toeteten ihn einmal in zwanzig. Gesetzt deshalb
  // 8 und +660: acht Stoesse fuer die Burg, das Fenster ist +640 bis +680.
  // Nicht in der ADR und deshalb gesetzt: Sicht 10,
  // Nahruestung 0 (kein Nahkaempfer trifft ihn, kampf AC-23), das Feuer
  // fliegt 8 Felder je Sekunde. Es trifft wie der Stein des Mangonels alles
  // im Umkreis, eigene auch.
  // `fliegt` ist die Regel aus kampf AC-23: getroffen wird er nur von
  // Schuetzen - und von Tuermen und Burgen, die gelten als Gebaeude, die
  // schiessen.
  drache: {
    leben: 500, tempo: 1.5, sicht: 10, tragkraft: 0, kosten: { nahrung: 400, gold: 400 }, zeit: 180, kuerzel: 'D',
    angriff: 8, nahruestung: 0, fernruestung: 2, reichweite: 3, nachladen: 3,
    flaeche: 1, geschoss: 8, feuer: true, bonus: { gebaeude: 660 },
    klassen: ['drache'], fliegt: { getroffenVon: ['bogenschuetze'] }, gerufen: true, wacht: true, zeitalter: 2,
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
/** @type {Record<string, Gebaeudewerte>} */
const GEBAEUDE = {
  dorfzentrum: {
    groesse: 4, kosten: { holz: 275, stein: 100 }, bauzeit: 150, leben: 2400, wohnraum: 5,
    annahme: ALLE,
    bildetAus: ['dorfbewohner', 'webstuhl', 'stadtwache', 'stadtpatrouille', 'schubkarre', 'handkarren', 'feudalzeit', 'ritterzeit', 'imperialzeit'],
  },
  // `zumAufstieg: false`: zaehlt nicht zu den zwei Gebaeuden, die ein Aufstieg
  // verlangt (bauen AC-23) - Haeuser, Aussenposten, Tuerme und Mauern nicht,
  // wie in der Vorlage. Sonst hiesse die Ritterzeit zwei Mauerfelder fuer
  // zehn Stein.
  haus: { groesse: 2, kosten: { holz: 25 }, bauzeit: 25, leben: 550, wohnraum: 5, annahme: [], bildetAus: [], zumAufstieg: false },
  // Ein Turm nur zum Sehen (kampf AC-18, Wunsch des Benutzers: Gebaeude und
  // Forschung veraendern die Flaeche des Nebels). Werte aus der Vorlage, die
  // Sicht von zehn Feldern wie im Original.
  aussenposten: { seite: 1, groesse: 1, kosten: { holz: 25, stein: 25 }, bauzeit: 15, leben: 500, wohnraum: 0, annahme: [], bildetAus: [], sicht: 10, zumAufstieg: false },
  muehle: { groesse: 2, kosten: { holz: 100 }, bauzeit: 35, leben: 1000, wohnraum: 0, annahme: ['nahrung'], bildetAus: ['pferdekummet', 'schwererPflug', 'fruchtwechsel'] },
  holzfaellerlager: { groesse: 2, kosten: { holz: 100 }, bauzeit: 35, leben: 1000, wohnraum: 0, annahme: ['holz'], bildetAus: ['doppelaxt', 'bogensaege', 'zweimannsaege'] },
  bergbaulager: { groesse: 2, kosten: { holz: 100 }, bauzeit: 35, leben: 1000, wohnraum: 0, annahme: ['gold', 'stein'], bildetAus: ['goldbergbau', 'goldschacht', 'steinbergbau', 'steinschacht'] },
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
  kaserne: {
    seite: 1,
    groesse: 3, kosten: { holz: 175 }, bauzeit: 50, leben: 1200, wohnraum: 0, annahme: [],
    bildetAus: ['miliz', 'speerkaempfer', 'soeldner', 'soldatenstufe', 'langschwertstufe', 'zweihandstufe', 'pikenierstufe', 'hellebardierstufe', 'brandstiftung', 'knappen'],
  },
  // Gebaeude der Feudalzeit (bauen AC-24): `zeitalter: 1` sperrt sie, bis die
  // Feudalzeit erreicht ist. Die Schmiede bildet keine Einheiten aus - sie
  // forscht (bauen AC-25).
  schiessanlage: {
    seite: 1,
    groesse: 3, kosten: { holz: 175 }, bauzeit: 50, leben: 1000, wohnraum: 0, annahme: [],
    bildetAus: ['bogenschuetze', 'plaenkler', 'armbrustschuetze', 'eibenschuetze', 'pavesenschuetze', 'bogenstufe', 'langbogenstufe', 'armbruststufe', 'eliteplaenklerstufe'], zeitalter: 1,
  },
  stall: {
    seite: 1,
    groesse: 3, kosten: { holz: 175 }, bauzeit: 50, leben: 1000, wohnraum: 0, annahme: [],
    bildetAus: ['spaeherreiter', 'ritter', 'kavalleriestufe', 'husarenstufe', 'kavalierstufe', 'paladinstufe', 'pferdezucht', 'blutlinien'], zeitalter: 1,
  },
  // Angriff und Ruestung je Waffengattung (bauen AC-25, AC-34, AC-39): von
  // jeder Verbesserung steht nur die naechste Stufe im Menue, hoechstens
  // fuenf Knoepfe zugleich.
  schmiede: {
    groesse: 3, kosten: { holz: 150 }, bauzeit: 40, leben: 1200, wohnraum: 0, annahme: [],
    bildetAus: ['schmiedeangriff', 'befiedertePfeile', 'eisenguss', 'bodkinpfeil',
      'schuppenpanzer', 'kettenpanzer', 'schuppenharnisch', 'kettenharnisch', 'polsterruestung', 'lederruestung',
      'hochofen', 'armschiene', 'plattenpanzer', 'plattenharnisch', 'ringpanzer'],
    zeitalter: 1,
  },
  // Gebaeude der Ritterzeit (bauen AC-28), Werte aus der Vorlage. Was sie
  // ausbilden und erforschen, kommt mit ihren Schritten: der Moench (D8),
  // Ramme und Mangonel (D6). Die Universitaet forscht Mauerwerk (bauen AC-34).
  // Das Wunder (bauen AC-51, spielziel AC-29): Werte aus der Vorlage - fuenf
  // mal fuenf Felder, je 1000 Holz, Stein und Gold, 4800 Leben, 3/10
  // Ruestung. Die Bauzeit ist gesetzt: mit den 3500 Sekunden der Vorlage
  // brauchten zwanzig Bauer 7,98 Spielminuten, verlangt sind acht bis zwoelf
  // - 4400 zielt auf zehn (mit dem Tretkran rund 8,4). Es bildet nichts aus,
  // schiesst nicht, gibt keinen Wohnraum; wer eines hat, baut kein zweites.
  wunder: {
    groesse: 5, kosten: { holz: 1000, stein: 1000, gold: 1000 }, bauzeit: 4400, leben: 4800, wohnraum: 0, annahme: [],
    bildetAus: [], zeitalter: 3, nahruestung: 3, fernruestung: 10, hoechstens: 1, wunder: true,
  },
  kloster: { groesse: 3, kosten: { holz: 175 }, bauzeit: 40, leben: 2100, wohnraum: 0, annahme: [], bildetAus: ['moench', 'heiligkeit', 'inbrunst', 'buchdruck', 'erleuchtung'], zeitalter: 2 },
  universitaet: { groesse: 3, kosten: { holz: 200 }, bauzeit: 60, leben: 2100, wohnraum: 0, annahme: [], bildetAus: ['mauerwerk', 'wehrturm', 'tretkran', 'chemie', 'bergfried', 'architektur', 'belagerungsingenieure'], zeitalter: 2 },
  belagerungswerkstatt: { seite: 1, groesse: 3, kosten: { holz: 200 }, bauzeit: 40, leben: 2100, wohnraum: 0, annahme: [], bildetAus: ['ramme', 'mangonel', 'rammenstufe', 'onagerstufe'], zeitalter: 2 },
  // Ein Gebaeude, das schiesst (bauen AC-29): `angriff`, `reichweite` und
  // `nachladen` wie bei einer Einheit, Pfeile also Fernkampf. Werte aus der
  // Vorlage - 5 Angriff, Reichweite 8, alle zwei Sekunden ein Pfeil, Ruestung
  // 1/7. Im Original steht er ab der Feudalzeit, gebaut wird er mit den
  // Befestigungen der Stufe D. Ein Gebaeude ohne `angriff` schiesst nicht.
  // Sicht 9: ein Feld ueber die Reichweite, damit er sieht, worauf er
  // schiesst - und weniger als der Aussenposten, der das Gebaeude zum Sehen
  // ist (kampf AC-18).
  wachturm: {
    seite: 1,
    groesse: 1, kosten: { holz: 25, stein: 125 }, bauzeit: 80, leben: 1020, wohnraum: 0, annahme: [], bildetAus: [], zeitalter: 1,
    angriff: 5, reichweite: 8, nachladen: 2, nahruestung: 1, fernruestung: 7, sicht: 9, zumAufstieg: false,
  },
  // Die Steinmauer (bauen AC-30): ein Feld je Baustelle, gezogen statt
  // gesetzt (`gezogen`), Werte aus der Vorlage - 5 Stein, 8 Sekunden, 1800
  // Leben. Sie haelt niemanden im Spiel (`bestand: false`, wie in der
  // Vorlage) und zaehlt nicht zum Aufstieg. Sicht 2 statt der 8 eines
  // Gebaeudes: eine lange Mauer waere sonst ein Band aus Aussenposten und
  // deckte den Nebel auf (kampf AC-18 bleibt beim Aussenposten).
  // Ein Tor (bauen AC-31, AC-37): fuer die eigenen Einheiten begehbar, fuer
  // alle anderen eine Sperre wie die Mauer. Werte aus der Vorlage. Es ist das
  // eine Gebaeude, das kein Quadrat ist: `laenge` Felder in einer Reihe,
  // `groesse` tief, laengs x oder - `quer` am Gebaeude - laengs y. Bis
  // 2026-11-13 war es ein Feld ("Das Tor muss breiter sein", Benutzer).
  // Schraeg gibt es keines: in eine schraege Mauer passt es nicht. Die
  // `pfeiler` Felder an jedem Ende sind die Tuerme des Torhauses und fuer
  // niemanden begehbar, dazwischen liegt die Durchfahrt. Gesetzt wird es in
  // eine Luecke oder auf die eigene Mauer, deren Felder es ersetzt
  // (`ersetzt`), wie in der Vorlage.
  tor: { seite: 1, groesse: 1, laenge: 4, pfeiler: 1, kosten: { stein: 30 }, bauzeit: 70, leben: 2750, wohnraum: 0, annahme: [], bildetAus: [], zeitalter: 1,
    tor: true, ersetzt: 'steinmauer', bestand: false, zumAufstieg: false, sicht: 2 },
  steinmauer: {
    seite: 1,
    groesse: 1, kosten: { stein: 5 }, bauzeit: 8, leben: 1800, wohnraum: 0, annahme: [], bildetAus: [], zeitalter: 1,
    gezogen: true, bestand: false, zumAufstieg: false, sicht: 2,
  },
  // Die Burg (bauen AC-32): Kosten, Bauzeit, Leben und Wohnraum aus der
  // Vorlage, die Kampfwerte aus derselben Zeile darunter - 11 Angriff,
  // Reichweite 8, alle zwei Sekunden eine Salve, Ruestung 8/11. Sie schiesst
  // nach derselben Regel wie der Wachturm (`welt.tuermeTakten()` misst vom
  // Rand der Grundflaeche) - nur `pfeile` auf einmal statt einem: im Original
  // schiesst eine leere Burg eine Salve (das Wiki nennt fuenf Pfeile, ein
  // Beitrag zur Definitive Edition vier), hier vier. Bis 2026-11-13 stand
  // hier einer, falsch aus der Vorlage abgeschrieben (Benutzer: "Alle 2
  // sekunden ein pfeil is eher der wachturm oder?"). Sicht 9 statt der 11 des Originals: ein Feld ueber
  // die Reichweite wie beim Wachturm, und der Aussenposten bleibt das Gebaeude,
  // das am weitesten sieht (kampf AC-18). Die Spezialeinheit kommt mit den
  // Voelkern (Stufe E), der Unterschlupf ist nicht gebaut.
  burg: {
    seite: 1,
    groesse: 4, kosten: { stein: 650 }, bauzeit: 200, leben: 4800, wohnraum: 20, annahme: [],
    bildetAus: ['kriegswolf', 'reiterschuetze', 'riese', 'meuchler', 'wiedergaenger', 'sappeure', 'wehrpflicht',
      'elitekriegswolf', 'elitereiterschuetze', 'eliteriese', 'elitemeuchler', 'elitewiedergaenger'], zeitalter: 2,
    angriff: 11, reichweite: 8, nachladen: 2, pfeile: 4, nahruestung: 8, fernruestung: 11, sicht: 9,
  },
  // Der Markt (bauen AC-33): Kosten, Bauzeit und Leben aus der Vorlage, ab der
  // Feudalzeit wie dort. Vier mal vier Felder wie im Original. `handel` sagt,
  // dass an ihm getauscht wird - die Preise stehen unten in HANDEL. Karren und
  // Handel zwischen Maerkten gibt es nicht (ADR-0012).
  // Der Markt bildet ab der Ritterzeit den Marktkarren aus (einheiten AC-39) -
  // das Zeitalter steht an der Einheit, gebaut wird er schon in der Feudalzeit.
  markt: {
    groesse: 4, kosten: { holz: 175 }, bauzeit: 60, leben: 1300, wohnraum: 0, annahme: [], bildetAus: ['marktkarren', 'kartografie', 'karawane'], zeitalter: 1,
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
// Dunkle Zeit, in der jede Partie beginnt. Am Bildschirm heissen sie nach dem
// Rang des Hauses (bedienung AC-45, ADR-0014 Punkt 9): Landsitz, Lehen,
// Fuerstentum, Krone - in Bezeichnern und Specs bleiben die alten Namen als
// Arbeitsnamen. Die gebeugten Formen stehen hier, nicht in den Meldungen
// zusammengesetzt, denn sie folgen keiner Regel (das Lehen, aber die Krone):
// `artikel` am Satzanfang klein, `genitiv` („Gebäude des Lehens"), `ab`
// („gibt es erst ab dem Lehen") und `zum` („Aufstieg zum Lehen").
//
// `wirkung`: was das Zeitalter selbst staerkt, in der Form der Verbesserungen
// und gelesen ueber `welt.wirkungen()`. Der Spaeherreiter laeuft ab der
// Feudalzeit 1,55 statt 1,2 Felder je Sekunde, wie in der Vorlage (einheiten
// AC-57) - in der Dunklen Zeit ist er ein Kundschafter, danach ein Reiter.
const ZEITALTER = [
  { id: 'dunkel', name: 'Landsitz', artikel: 'der Landsitz', genitiv: 'des Landsitzes', ab: 'ab dem Landsitz', zum: 'zum Landsitz' },
  {
    id: 'feudal', name: 'Lehen', artikel: 'das Lehen', genitiv: 'des Lehens', ab: 'ab dem Lehen', zum: 'zum Lehen',
    wirkung: { spaeherreiter: { tempo: 0.35 } },
  },
  { id: 'ritter', name: 'Fürstentum', artikel: 'das Fürstentum', genitiv: 'des Fürstentums', ab: 'ab dem Fürstentum', zum: 'zum Fürstentum' },
  { id: 'imperial', name: 'Krone', artikel: 'die Krone', genitiv: 'der Krone', ab: 'ab der Krone', zum: 'zur Krone' },
];

// Der Aufstieg ist ein Auftrag im Dorfzentrum wie eine Verbesserung: bezahlt
// beim Einreihen, mit einer Dauer, und ein Abbruch erstattet voll (bauen
// AC-23). `voraussetzung` ist die Zahl fertiger eigener Gebaeude des
// **laufenden** Zeitalters ausser Haeusern - das Dorfzentrum zaehlt mit.
// Werte aus der Vorlage (docs/strategie/vorlage-aoe2.md).
// `oder` nennt ein Gebaeude, das allein genuegt: in die Krone fuehren zwei
// Gebaeude des Fuerstentums **oder eine Burg** (bauen AC-47) - wer nur die
// Burg baut, soll nicht daran haengen, dass sie als eines zaehlt.
// Name und Titel des Knopfes kommen aus `ZEITALTER`, damit es nur eine Stelle
// gibt, an der ein Zeitalter heisst.
const aufstieg = (stufe, werte) => ({ name: ZEITALTER[stufe].name, titel: `Aufstieg ${ZEITALTER[stufe].zum}`, stufe, ...werte });
const AUFSTIEGE = {
  feudalzeit: aufstieg(1, { kosten: { nahrung: 500 }, zeit: 130, voraussetzung: 2 }),
  ritterzeit: aufstieg(2, { kosten: { nahrung: 800, gold: 200 }, zeit: 160, voraussetzung: 2 }),
  imperialzeit: aufstieg(3, { kosten: { nahrung: 1000, gold: 800 }, zeit: 190, voraussetzung: 2, oder: { art: 'burg', text: 'eine Burg' } }),
};

// Verbesserungen: einmal je Partie, im Gebaeude wie eine Einheit eingereiht.
// `wirkung` gibt je Einheitenart Zuschlaege (bauen AC-21). Ruestung wirkt ab
// Stufe B mit dem Kampf; sie steht schon hier, damit die Werte an einer Stelle sind.
/** @type {Record<string, Verbesserung>} */
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
  // Die Stufen des Fuerstentums (einheiten AC-58 bis AC-62), jede wie die
  // Soldatenstufe: sie tauscht die Einheit aus, auch die stehenden und die in
  // den Schlangen. Kosten und Dauer aus den offenen Technikbaum-Daten zum
  // Original (SiegeEngineers/aoe2techtree, gelesen 2026-11-13). Die
  // Bogenstufe traegt, was bis 2026-11-13 die Verbesserung `armbrust`
  // kostete - die gibt es nicht mehr, der Armbrustschuetze ist eine eigene
  // Einheit (einheiten AC-34).
  bogenstufe: {
    name: 'Bogenschütze', kosten: { nahrung: 125, gold: 75 }, zeit: 35, zeitalter: 2,
    wirkung: {}, wandelt: { bogenschuetze: 'bogenschuetze2' },
  },
  langschwertstufe: {
    name: 'Langschwertkämpfer', kosten: { nahrung: 150, gold: 65 }, zeit: 40, zeitalter: 2,
    vorstufe: 'soldatenstufe', wirkung: {}, wandelt: { soldat: 'langschwertkaempfer' },
  },
  pikenierstufe: {
    name: 'Pikenier', kosten: { nahrung: 160, gold: 90 }, zeit: 35, zeitalter: 2,
    wirkung: {}, wandelt: { speerkaempfer: 'pikenier' },
  },
  eliteplaenklerstufe: {
    name: 'Eliteplänkler', kosten: { holz: 230, gold: 130 }, zeit: 50, zeitalter: 2,
    wirkung: {}, wandelt: { plaenkler: 'eliteplaenkler' },
  },
  kavalleriestufe: {
    name: 'Leichte Kavallerie', kosten: { nahrung: 150, gold: 50 }, zeit: 45, zeitalter: 2,
    wirkung: {}, wandelt: { spaeherreiter: 'leichtekavallerie' },
  },
  // Die Stufen der Krone (einheiten AC-66). Kosten und Dauer aus den offenen
  // Technikbaum-Daten zum Original (gelesen 2026-11-18). Jede verlangt ihre
  // Vorstufe - der Ritter hat keine, er ist die erste seiner Linie.
  zweihandstufe: {
    name: 'Zweihandkämpfer', kosten: { nahrung: 200, gold: 100 }, zeit: 45, zeitalter: 3,
    vorstufe: 'langschwertstufe', wirkung: {}, wandelt: { langschwertkaempfer: 'zweihandkaempfer' },
  },
  hellebardierstufe: {
    name: 'Hellebardier', kosten: { nahrung: 300, gold: 600 }, zeit: 50, zeitalter: 3,
    vorstufe: 'pikenierstufe', wirkung: {}, wandelt: { pikenier: 'hellebardier' },
  },
  husarenstufe: {
    name: 'Husar', kosten: { nahrung: 500, gold: 600 }, zeit: 50, zeitalter: 3,
    vorstufe: 'kavalleriestufe', wirkung: {}, wandelt: { leichtekavallerie: 'husar' },
  },
  kavalierstufe: {
    name: 'Kavalier', kosten: { nahrung: 300, gold: 300 }, zeit: 80, zeitalter: 3,
    wirkung: {}, wandelt: { ritter: 'kavalier' },
  },
  // Die zweite Stufe des Ritters und die teuerste Stufe im Spiel.
  paladinstufe: {
    name: 'Paladin', kosten: { nahrung: 1300, gold: 750 }, zeit: 170, zeitalter: 3,
    vorstufe: 'kavalierstufe', wirkung: {}, wandelt: { kavalier: 'paladin' },
  },
  // Schuetzen und Belagerung der Krone (einheiten AC-67, AC-68). Die
  // Armbrust und die beiden Belagerungswaffen haben im Fuerstentum keine
  // Verbesserung, sie sind dort Einheiten - deshalb ohne `vorstufe`.
  langbogenstufe: {
    name: 'Langbogenschütze', kosten: { nahrung: 450, gold: 350 }, zeit: 50, zeitalter: 3,
    vorstufe: 'bogenstufe', wirkung: {}, wandelt: { bogenschuetze2: 'langbogenschuetze' },
  },
  armbruststufe: {
    name: 'Schwere Armbrust', kosten: { nahrung: 400, gold: 350 }, zeit: 50, zeitalter: 3,
    wirkung: {}, wandelt: { armbrustschuetze: 'schwerearmbrust' },
  },
  rammenstufe: {
    name: 'Belagerungsramme', kosten: { nahrung: 1000 }, zeit: 75, zeitalter: 3,
    wirkung: {}, wandelt: { ramme: 'belagerungsramme' },
  },
  onagerstufe: {
    name: 'Onager', kosten: { nahrung: 800, gold: 500 }, zeit: 75, zeitalter: 3,
    wirkung: {}, wandelt: { mangonel: 'onager' },
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
  // Die Wirtschaft waechst mit den Zeitaltern (bauen AC-43, AC-44; Benutzer:
  // "Im Fürstentum muss es auch noch weiterentwicklungen für bergbau, mühle,
  // holzabbau, etc. geben"). Bis dahin gab es fuer Gold und Stein nichts und
  // nach dem Lehen nichts mehr. Dieselben Formen wie Doppelaxt und
  // Pferdekummet: `sammeln` ist ein Faktor, zwei Stufen multiplizieren sich;
  // `farm` ein Zuschlag. Kosten und Dauer aus den offenen Technikbaum-Daten
  // zum Original (SiegeEngineers/aoe2techtree, gelesen 2026-11-14). Die
  // Wirkungen nennt die Datei nicht: sie sind als Startwerte gesetzt - je
  // Stufe 15 % am Gold und am Stein, 20 % am Holz, 125 Nahrung je Farm.
  goldbergbau: {
    name: 'Goldbergbau', kosten: { nahrung: 100, holz: 75 }, zeit: 30, zeitalter: 1,
    zeichen: 'goldhacke',
    wirkung: {}, sammeln: { gold: 1.15 },
  },
  steinbergbau: {
    name: 'Steinbergbau', kosten: { nahrung: 100, holz: 75 }, zeit: 30, zeitalter: 1,
    zeichen: 'steinhacke',
    wirkung: {}, sammeln: { stein: 1.15 },
  },
  bogensaege: {
    name: 'Bogensäge', kosten: { nahrung: 150, holz: 100 }, zeit: 50, zeitalter: 2,
    vorstufe: 'doppelaxt', zeichen: 'saege',
    wirkung: {}, sammeln: { holz: 1.2 },
  },
  goldschacht: {
    name: 'Goldschacht', kosten: { nahrung: 175, holz: 75 }, zeit: 75, zeitalter: 2,
    vorstufe: 'goldbergbau', zeichen: 'goldschacht',
    wirkung: {}, sammeln: { gold: 1.15 },
  },
  steinschacht: {
    name: 'Steinschacht', kosten: { nahrung: 175, holz: 75 }, zeit: 75, zeitalter: 2,
    vorstufe: 'steinbergbau', zeichen: 'steinschacht',
    wirkung: {}, sammeln: { stein: 1.15 },
  },
  schwererPflug: {
    name: 'Schwerer Pflug', kosten: { nahrung: 125, holz: 125 }, zeit: 40, zeitalter: 2,
    vorstufe: 'pferdekummet', zeichen: 'pflug',
    wirkung: {}, farm: { nahrung: 125 },
  },
  // Schubkarre und Handkarren (bauen AC-44): der Dorfbewohner geht schneller
  // und traegt mehr - `tragkraft` ist ein Wert wie jeder andere und wird ueber
  // `welt.tragkraft()` gelesen. Die Vorlage nennt fuer den ersten +10 % Tempo
  // und +25 % Tragkraft (bei zehn sind das aufgerundet drei); der Handkarren
  // steht dort nicht, seine Wirkung ist gesetzt.
  schubkarre: {
    name: 'Schubkarre', kosten: { nahrung: 175, holz: 50 }, zeit: 75, zeitalter: 1,
    zeichen: 'schubkarre',
    wirkung: { dorfbewohner: { tempo: 0.08, tragkraft: 3 } },
  },
  handkarren: {
    name: 'Handkarren', kosten: { nahrung: 300, holz: 200 }, zeit: 55, zeitalter: 2,
    vorstufe: 'schubkarre', zeichen: 'handkarren',
    wirkung: { dorfbewohner: { tempo: 0.08, tragkraft: 5 } },
  },
  // Pferdezucht (bauen AC-46, Wunsch des Benutzers: "nochmal schnellere
  // Pferde"): jeder Reiter ist ein Zehntel schneller. Das Tempo ist sonst ein
  // Zuschlag in Feldern je Sekunde; hier ist es ein Anteil (`tempoAnteil`),
  // damit er fuer jede Reiterart dasselbe heisst - auch fuer die, die noch
  // kommen. Gerechnet wird er auf das Tempo mit allen Zuschlaegen
  // (`welt.einheitenwert`). 150 Nahrung, 40 Sekunden und +10 % sind die Werte
  // des Originals aus dem Gedaechtnis, nicht aus `vorlage-aoe2.md` -
  // Startwerte.
  pferdezucht: {
    name: 'Pferdezucht', kosten: { nahrung: 150 }, zeit: 40, zeitalter: 2,
    zeichen: 'hufeisen',
    wirkung: { kavallerie: { tempoAnteil: 0.1 } },
  },
  // **Verbesserungen mit eigenem Charakter** (bauen AC-52 bis AC-56, Wunsch
  // des Benutzers 2026-11-18: "so spannende Sachen wie Kartografie"). Preise
  // und Wirkungen nach dem Original aus dem Gedaechtnis, nicht aus
  // `vorlage-aoe2.md` - Startwerte. Keine davon erforscht die KI (ki AC-35).
  //
  // Kartografie (AC-52): im Original teilt sie die Sicht der Verbuendeten -
  // das gilt hier ohnehin (spielziel AC-19). Sie bekommt deshalb eine eigene
  // Wirkung: die ganze Karte gilt als erkundet (`karte`), fuer den Spieler
  // und alle, mit denen er die Sicht teilt. Was dort steht und geht, zeigt
  // sie nicht - gesehen wird weiter nur mit Augen.
  kartografie: {
    name: 'Kartografie', kosten: { nahrung: 100, gold: 100 }, zeit: 40, zeitalter: 1,
    zeichen: 'landkarte', wirkung: {}, karte: true,
  },
  // Blutlinien (AC-53): alles Berittene +20 Leben, auch wer schon steht.
  blutlinien: {
    name: 'Blutlinien', kosten: { nahrung: 150, gold: 100 }, zeit: 50, zeitalter: 1,
    zeichen: 'blutstropfen', wirkung: { kavallerie: { leben: 20 } },
  },
  // Karawane (AC-53): Marktkarren fahren um die Haelfte schneller - mehr
  // Fahrten je Minute, nicht mehr Gold je Fahrt.
  karawane: {
    name: 'Karawane', kosten: { nahrung: 200, gold: 200 }, zeit: 40, zeitalter: 3,
    zeichen: 'planwagen', wirkung: { marktkarren: { tempoAnteil: 0.5 } },
  },
  // Brandstiftung (AC-54): Fussvolk +2 Angriff gegen Gebaeude. Ein Zuschlag
  // je Klasse des Ziels steht als `bonus` an der Verbesserung, gelesen ueber
  // `welt.bonusVon()` - die Schadensformel liest ihn nicht aus der Tabelle.
  brandstiftung: {
    name: 'Brandstiftung', kosten: { nahrung: 75, gold: 25 }, zeit: 25, zeitalter: 1,
    zeichen: 'fackel', wirkung: {}, bonus: { infanterie: { gebaeude: 2 } },
  },
  // Knappen (AC-54): Fussvolk ein Zehntel schneller, als Anteil wie die Pferdezucht.
  knappen: {
    name: 'Knappen', kosten: { nahrung: 100 }, zeit: 40, zeitalter: 2,
    zeichen: 'stiefel', wirkung: { infanterie: { tempoAnteil: 0.1 } },
  },
  // Vier Lehren des Klosters (AC-55). Reichweite und Ruhe des Bekehrens sind
  // keine Werte der Einheit, sondern ihres `bekehren` - Zuschlaege darauf
  // stehen als `bekehren` an der Verbesserung, gelesen ueber `welt.bekehrwert()`.
  heiligkeit: {
    name: 'Heiligkeit', kosten: { gold: 175 }, zeit: 60, zeitalter: 2,
    zeichen: 'heiligenschein', wirkung: { moench: { leben: 15 } },
  },
  inbrunst: {
    name: 'Inbrunst', kosten: { gold: 140 }, zeit: 50, zeitalter: 2,
    zeichen: 'flammenherz', wirkung: { moench: { tempoAnteil: 0.15 } },
  },
  buchdruck: {
    name: 'Buchdruck', kosten: { gold: 200 }, zeit: 55, zeitalter: 3,
    zeichen: 'buch', wirkung: {}, bekehren: { reichweite: 3 },
  },
  erleuchtung: {
    name: 'Erleuchtung', kosten: { gold: 120 }, zeit: 65, zeitalter: 3,
    zeichen: 'sonne', wirkung: {}, bekehren: { ruhe: -21 },
  },
  // Tretkran (AC-56): Dorfbewohner bauen ein Fuenftel schneller (`bautempo`,
  // ein Faktor in `welt.baustelleTakten`). Repariert wird wie bisher.
  tretkran: {
    name: 'Tretkran', kosten: { nahrung: 300, holz: 200 }, zeit: 50, zeitalter: 2,
    zeichen: 'kran', wirkung: {}, bautempo: 1.2,
  },
  // Sappeure (AC-56): Dorfbewohner +15 Angriff gegen Gebaeude.
  sappeure: {
    name: 'Sappeure', kosten: { nahrung: 400, holz: 200 }, zeit: 10, zeitalter: 3,
    zeichen: 'bresche', wirkung: {}, bonus: { dorfbewohner: { gebaeude: 15 } },
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
  // Der Wehrturm (bauen AC-38): die Universitaet macht aus jedem Wachturm
  // einen - auch aus denen, die schon stehen. `bauwerk` gibt Zuschlaege je
  // Gebaeudeart, gelesen in `welt.gebaeudewert()`; `nennt` sagt, wie der Turm
  // danach heisst, `bild`, mit welchem Bild er steht - beides schickt der
  // Server je Spieler mit den Werten (`kw`). Werte aus den Technikbaum-Daten
  // zum Original: +480 Leben, +2 Angriff, +1/+1 Ruestung, 100 Nahrung und 250
  // Holz, 30 Sekunden.
  wehrturm: {
    name: 'Wehrturm', kosten: { nahrung: 100, holz: 250 }, zeit: 30, zeitalter: 2,
    zeichen: 'zinne',
    wirkung: {}, bauwerk: { wachturm: { leben: 480, angriff: 2, nahruestung: 1, fernruestung: 1 } },
    nennt: { wachturm: 'Wehrturm' }, bild: { wachturm: 'wehrturm' },
  },
  // Die Ruestungen der Schmiede (bauen AC-39), je Waffengattung zwei Stufen:
  // die erste ab dem Lehen, die zweite ab dem Fuerstentum und nur nach der
  // ersten. Jede gibt +1 / +1. Kosten und Dauer aus den Technikbaum-Daten zum
  // Original. Die dritten Stufen stehen unten bei der Krone.
  schuppenpanzer: {
    name: 'Schuppenpanzer', kosten: { nahrung: 100 }, zeit: 40, zeitalter: 1,
    zeichen: 'schuppen',
    wirkung: { infanterie: { nahruestung: 1, fernruestung: 1 } },
  },
  kettenpanzer: {
    name: 'Kettenpanzer', kosten: { nahrung: 200, gold: 100 }, zeit: 55, zeitalter: 2,
    vorstufe: 'schuppenpanzer', zeichen: 'kette',
    wirkung: { infanterie: { nahruestung: 1, fernruestung: 1 } },
  },
  schuppenharnisch: {
    name: 'Schuppenrossharnisch', kosten: { nahrung: 150 }, zeit: 45, zeitalter: 1,
    zeichen: 'rossschuppen',
    wirkung: { kavallerie: { nahruestung: 1, fernruestung: 1 } },
  },
  kettenharnisch: {
    name: 'Kettenrossharnisch', kosten: { nahrung: 250, gold: 150 }, zeit: 60, zeitalter: 2,
    vorstufe: 'schuppenharnisch', zeichen: 'rosskette',
    wirkung: { kavallerie: { nahruestung: 1, fernruestung: 1 } },
  },
  polsterruestung: {
    name: 'Gepolsterte Schützenrüstung', kosten: { nahrung: 100 }, zeit: 40, zeitalter: 1,
    zeichen: 'polster',
    wirkung: { bogenschuetze: { nahruestung: 1, fernruestung: 1 } },
  },
  lederruestung: {
    name: 'Lederne Schützenrüstung', kosten: { nahrung: 150, gold: 150 }, zeit: 55, zeitalter: 2,
    vorstufe: 'polsterruestung', zeichen: 'leder',
    wirkung: { bogenschuetze: { nahruestung: 1, fernruestung: 1 } },
  },
  // **Die Verbesserungen der Krone** (bauen AC-48 bis AC-50). Kosten und
  // Dauer aus den offenen Technikbaum-Daten zum Original (gelesen
  // 2026-11-18), die Wirkungen nach dem Original.
  //
  // Die Schmiede (AC-48): die dritte Stufe jeder Reihe, jede verlangt ihre
  // Vorstufe. Die Ruestungen geben +1 gegen Nah und +2 gegen Fern.
  hochofen: {
    name: 'Hochofen', kosten: { nahrung: 275, gold: 225 }, zeit: 100, zeitalter: 3,
    vorstufe: 'eisenguss', zeichen: 'hochofen',
    wirkung: { infanterie: { angriff: 2 }, kavallerie: { angriff: 2 } },
  },
  armschiene: {
    name: 'Armschiene', kosten: { nahrung: 300, gold: 200 }, zeit: 40, zeitalter: 3,
    vorstufe: 'bodkinpfeil', zeichen: 'armschiene',
    wirkung: { bogenschuetze: { angriff: 1, reichweite: 1 } },
  },
  plattenpanzer: {
    name: 'Plattenpanzer', kosten: { nahrung: 300, gold: 150 }, zeit: 70, zeitalter: 3,
    vorstufe: 'kettenpanzer', zeichen: 'platte',
    wirkung: { infanterie: { nahruestung: 1, fernruestung: 2 } },
  },
  plattenharnisch: {
    name: 'Plattenrossharnisch', kosten: { nahrung: 350, gold: 200 }, zeit: 75, zeitalter: 3,
    vorstufe: 'kettenharnisch', zeichen: 'rossplatte',
    wirkung: { kavallerie: { nahruestung: 1, fernruestung: 2 } },
  },
  ringpanzer: {
    name: 'Ringpanzer der Schützen', kosten: { nahrung: 250, gold: 250 }, zeit: 70, zeitalter: 3,
    vorstufe: 'lederruestung', zeichen: 'ringweste',
    wirkung: { bogenschuetze: { nahruestung: 1, fernruestung: 2 } },
  },
  // Die Wirtschaft (AC-49): die dritte Stufe fuer Farm und Holz, in den
  // Formen von Pferdekummet und Doppelaxt.
  fruchtwechsel: {
    name: 'Fruchtwechsel', kosten: { nahrung: 250, holz: 250 }, zeit: 70, zeitalter: 3,
    vorstufe: 'schwererPflug', zeichen: 'fruchtfolge',
    wirkung: {}, farm: { nahrung: 175 },
  },
  zweimannsaege: {
    name: 'Zweimannsäge', kosten: { nahrung: 300, holz: 200 }, zeit: 100, zeitalter: 3,
    vorstufe: 'bogensaege', zeichen: 'zugsaege',
    wirkung: {}, sammeln: { holz: 1.1 },
  },
  // Universitaet und Burg (AC-50). Chemie: alles, was Pfeile schiesst - die
  // Klasse der Schuetzen und jedes Gebaeude, das schiesst (`gebaeude.angriff`
  // gilt nur dem, siehe `welt.gebaeudewert`).
  chemie: {
    name: 'Chemie', kosten: { nahrung: 300, gold: 200 }, zeit: 100, zeitalter: 3,
    zeichen: 'kolben',
    wirkung: { bogenschuetze: { angriff: 1 } }, gebaeude: { angriff: 1 },
  },
  // Der Bergfried: die zweite Stufe des Turms nach dem Wehrturm (bauen AC-38).
  // Wer spaeter erforscht ist, nennt - die Wirkungen stehen in der Reihenfolge
  // der Forschung.
  bergfried: {
    name: 'Bergfried', kosten: { nahrung: 500, holz: 350 }, zeit: 75, zeitalter: 3,
    vorstufe: 'wehrturm', zeichen: 'bergfried',
    wirkung: {}, bauwerk: { wachturm: { leben: 750, angriff: 1, nahruestung: 1, fernruestung: 1 } },
    nennt: { wachturm: 'Bergfried' }, bild: { wachturm: 'bergfried' },
  },
  architektur: {
    name: 'Architektur', kosten: { nahrung: 300, holz: 200 }, zeit: 70, zeitalter: 3,
    vorstufe: 'mauerwerk', zeichen: 'zirkel',
    wirkung: {}, gebaeude: { lebenAnteil: 0.1, nahruestung: 1, fernruestung: 1 },
  },
  // Belagerungsingenieure: was wirft, wirft ein Feld weiter, und jede
  // Belagerungswaffe richtet an Gebaeuden ein Fuenftel mehr an. `bonusAnteil`
  // ist ein Anteil auf Angriff samt Zuschlag gegen die Klasse des Ziels,
  // gerechnet als weiterer Zuschlag in `welt.bonusVon()` - die Ramme stoesst
  // danach mit 152 statt 127, und die Leiste zeigt es als "+150 gegen Gebäude".
  belagerungsingenieure: {
    name: 'Belagerungsingenieure', kosten: { nahrung: 500, holz: 600 }, zeit: 45, zeitalter: 3,
    zeichen: 'zahnrad',
    wirkung: { wurf: { reichweite: 1 } }, bonusAnteil: { belagerung: { gebaeude: 0.2 } },
  },
  // Wehrpflicht: `ausbildung` wie im Mannschaftsbonus (`welt.ausbildungstempo`),
  // ein Faktor je Gebaeudeart - nur Einheiten, keine Forschung.
  wehrpflicht: {
    name: 'Wehrpflicht', kosten: { nahrung: 150, gold: 150 }, zeit: 60, zeitalter: 3,
    zeichen: 'trommel',
    wirkung: {}, ausbildung: { kaserne: 1.33, schiessanlage: 1.33, stall: 1.33, burg: 1.33 },
  },
  // **Die Elitestufen der fuenf Einheiten aus der Burg** (einheiten AC-69,
  // ADR-0014 Punkt 12). Keine neue Art und keine neue Figur, wie in der
  // Vorlage: `hebt` nennt die Einheit, die Wirkung traegt ihre Zuschlaege,
  // `nennt` ihren Namen danach. Tarnung, Preis in Gefallenen und jede andere
  // Regel haengen an der Art und bleiben. `haeuser` wie an der Einheit: nur
  // ihr Haus sieht und erforscht sie. Preis und Dauer sind Startwerte ohne
  // Vorbild, die Namen vorlaeufig.
  elitekriegswolf: {
    name: 'Elite-Kriegswolf', kosten: { nahrung: 500, gold: 400 }, zeit: 60, zeitalter: 3,
    haeuser: ['eschenbruch'], hebt: 'kriegswolf', nennt: { kriegswolf: 'Elite-Kriegswolf' },
    wirkung: { kriegswolf: { leben: 15, angriff: 2 } },
  },
  elitereiterschuetze: {
    name: 'Elite-Reiterschütze', kosten: { nahrung: 500, gold: 400 }, zeit: 60, zeitalter: 3,
    haeuser: ['rappenstein'], hebt: 'reiterschuetze', nennt: { reiterschuetze: 'Elite-Reiterschütze' },
    wirkung: { reiterschuetze: { leben: 15, angriff: 1 } },
  },
  eliteriese: {
    name: 'Elite-Riese', kosten: { nahrung: 500, gold: 400 }, zeit: 60, zeitalter: 3,
    haeuser: ['wehrstein'], hebt: 'riese', nennt: { riese: 'Elite-Riese' },
    wirkung: { riese: { leben: 40, angriff: 2 } }, bonus: { riese: { gebaeude: 10 } },
  },
  elitemeuchler: {
    name: 'Elite-Meuchler', kosten: { nahrung: 500, gold: 400 }, zeit: 60, zeitalter: 3,
    haeuser: ['silberfurt'], hebt: 'meuchler', nennt: { meuchler: 'Elite-Meuchler' },
    wirkung: { meuchler: { leben: 10, angriff: 2 } }, bonus: { meuchler: { dorf: 4, moench: 4 } },
  },
  elitewiedergaenger: {
    name: 'Elite-Wiedergänger', kosten: { nahrung: 500, gold: 400 }, zeit: 60, zeitalter: 3,
    haeuser: ['distelhag'], hebt: 'wiedergaenger', nennt: { wiedergaenger: 'Elite-Wiedergänger' },
    // Nahruestung statt der Fernruestung der ersten Fassung: mit +1 gegen Pfeile schlug er
    // den Langbogenschuetzen gleicher Kosten 23 von 40 statt 0 (einheiten AC-49 verlangt die Niederlage).
    wirkung: { wiedergaenger: { leben: 15, angriff: 2, nahruestung: 1 } },
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
  // Der Kriegswolf (einheiten AC-45): laeuft wie ein Reiter, ist aber keiner -
  // kein Bonus greift auf ihn, keine Verbesserung staerkt ihn.
  tier: { name: 'Tiere' },
  // Der Wiedergaenger (einheiten AC-49): kein Moench bekehrt oder heilt ihn.
  untot: { name: 'Untote' },
  // Belagerung (einheiten AC-35). `gebaeude` traegt jedes Gebaeude von selbst
  // (oben) - die Ramme hat ihren Bonus dagegen.
  belagerung: { name: 'Belagerung' },
  // Mangonel und Onager: was wirft. Die Belagerungsingenieure geben ihnen
  // Reichweite (bauen AC-50) - der Ramme nicht.
  wurf: { name: 'Wurfmaschinen' },
  // Der Moench (einheiten AC-37) - bekehrt keine Moenche (AC-38).
  moench: { name: 'Mönche' },
  // Der Marktkarren (einheiten AC-39) - noch greift kein Bonus auf ihn.
  karren: { name: 'Karren' },
  // Der Drache (einheiten AC-52): fliegt, und nur Schuetzen, Tuerme und
  // Burgen treffen ihn (kampf AC-23).
  drache: { name: 'Drachen' },
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
  // Der Karren (einheiten AC-40): je Fahrt `faktor * d * (d / S + sockel)`
  // Gold, `d` der Abstand der Maerkte von Mitte zu Mitte in Feldern, `S` die
  // Kantenlaenge der Karte. Die Form ist die der Vorlage - die Menge waechst
  // mit dem Abstand schneller als dieser, also lohnt die lange Strecke auch
  // je Minute. Der Faktor ist gemessen, nicht uebernommen: siehe Runde 161.
  // `fremdAnteil`: zum Markt eines anderen bringt die Fahrt so viel mehr als
  // zum eigenen in gleicher Entfernung (Benutzer, 2026-11-13: „nimm 20% mehr").
  karren: { faktor: 0.77, sockel: 0.3, fremdAnteil: 0.2 },
};

// Die fuenf Haeuser (ADR-0014, spielziel AC-16, AC-17). Ein Haus ist ein
// Eintrag: Name, Sitz, Wahlspruch und `boni`. Die Boni haben die Form einer
// Verbesserung - `wirkung` je Einheitenart oder Klasse, `sammeln` als Faktor,
// `farm`, `gebaeude` - und gelten von Beginn an. Gelesen werden sie dort, wo
// die Verbesserungen gelesen werden (`welt.wirkungen()`); die Simulation
// kennt kein einzelnes Haus.
//
// `preis` (einheiten AC-44) ist ein Faktor auf die Kosten einer Einheitenart:
// Silberfurt bekommt den Soeldner fuer 64 statt 80 Gold. Gelesen in
// `welt.auftragKosten()` - bezahlt, erstattet und gezeigt wird nur darueber.
// Im Mannschaftsbonus steht er nicht: der kommt und geht, und eine Absage
// muss erstatten, was bezahlt wurde.
//
// Zwei Formen gibt es nur bei den Haeusern (spielziel AC-26):
// `gebaeude.reichweite` (wie `angriff` und `nachladen`) gilt nur fuer ein
// Gebaeude, das schiesst - Wehrsteins "Turm und Burg +1 Reichweite"; ein Haus
// mit Reichweite 1 waere Unsinn in der Leiste. Und `handel`: `gebuehr` ist
// ein Zuschlag auf `HANDEL.gebuehr` (-0,15 macht aus 30 % 15 %),
// `karrenAnteil` ein Anteil am Gold je Fahrt.
//
// `mannschaft` ist der Mannschaftsbonus (spielziel AC-25): er gilt dem Haus
// selbst und allen, mit denen es die Sicht teilt, je Haus einmal, und endet
// mit der gemeinsamen Sicht. Er steht neben `boni`, nicht darin, und hat
// dieselben Formen und zwei eigene: `ausbildung` je Gebaeudeart als Faktor
// auf das Tempo der Ausbildung, und `handel.verbuendetAnteil`, ein Anteil am
// Gold je Fahrt nur zwischen zwei Verbuendeten. Weil er kommen und gehen
// kann, traegt er nichts, was beim Wechsel an stehenden Einheiten oder
// Gebaeuden nachgezogen werden muesste - kein Leben, keine Nahrung; darauf
// achtet tests/strategie-mannschaft.test.mjs. Alle Zahlen sind Startwerte
// (ADR-0014).
//
// `ki` sagt dem Computerspieler, wozu das Haus neigt (ki AC-27): der
// `schwerpunkt` ist ein Gebaeude - ein Militaergebaeude baut die KI zuerst,
// baut es nach und bedient es vor den anderen; was sie darin ausbildet,
// lesen die Daten des Gebaeudes (ki AC-17). `goldKnapp` verschiebt, ab
// welchem Gold in Reichweite sie zu handeln beginnt (ki AC-26, sonst 800).
// Ein Schwerpunkt, der nichts ausbildet (Wehrsteins Wachturm, ki AC-30), ist
// ein Bauwerk: davon baut die KI ab seinem Zeitalter, nach dem ersten
// Militaergebaeude und dem ersten Aufbruch, bis zu `anzahl` am Dorf und stellt
// `steinSammler` an den Stein, solange welche fehlen (`ki.bauwerkePruefen`).
// Silberfurt handelt frueher (ki AC-27): gleich mit der Ritterzeit, nicht erst,
// wenn das Gold in Reichweite knapp wird - jede Menge Gold ist "knapp".
// Gemessen in Runde 174: 6,5 Karren je Partie statt 0,8, und KI gegen KI
// endet weiter wie in fahrplan AC-11.
const GOLD_KNAPP_SILBERFURT = Infinity;

/** @type {Record<string, Haus>} */
const HAEUSER = {
  eschenbruch: {
    name: 'Eschenbruch', sitz: 'Waldland', wahlspruch: 'Weit sehen, weit treffen.',
    // Holz +5 % und die Reichweite erst ab dem Fuerstentum (Benutzer,
    // 2026-11-12, Runde 201): mit +15 % und Reichweite ab dem Lehen gewann
    // Eschenbruch 85 % seiner Partien, mit +10 % und Reichweite ab dem
    // Fuerstentum 80 % - beides ueber der Grenze von spielziel AC-18.
    boni: { sammeln: { holz: 1.05 } },
    boniAb: { 2: { wirkung: { bogenschuetze: { reichweite: 1 } } } }, // 2 = Fuerstentum (Ritterzeit)
    mannschaft: { ausbildung: { schiessanlage: 1.2 } },
    ki: { schwerpunkt: 'schiessanlage' },
  },
  rappenstein: {
    name: 'Rappenstein', sitz: 'Grasland', wahlspruch: 'Zuerst am Ziel.',
    boni: { wirkung: { kavallerie: { leben: 15, sicht: 2 } } },
    mannschaft: { wirkung: { kavallerie: { sicht: 2 } } },
    ki: { schwerpunkt: 'stall' },
  },
  wehrstein: {
    name: 'Wehrstein', sitz: 'Gebirge', wahlspruch: 'Stein vergisst nicht.',
    boni: { sammeln: { stein: 1.15 }, gebaeude: { lebenAnteil: 0.1, reichweite: 1 } },
    mannschaft: { gebaeude: { sicht: 2 } },
    ki: { schwerpunkt: 'wachturm', anzahl: 2, steinSammler: 3 },
  },
  silberfurt: {
    name: 'Silberfurt', sitz: 'Flussstadt', wahlspruch: 'Alles hat seinen Preis.',
    // Gold +15 % von Beginn an (Runde 202): die beiden Handelsboni greifen
    // erst mit einem Markt, und die KI handelt erst ab dem Fuerstentum -
    // bis dahin spielte Silberfurt ohne Haus (30 % Siege; mit +10 % und
    // Schuetzen fuer 30 Holz 25 %).
    boni: { sammeln: { gold: 1.15 }, handel: { gebuehr: -0.15, karrenAnteil: 0.2 }, preis: { soeldner: 0.8 } },
    mannschaft: { handel: { verbuendetAnteil: 0.2 } },
    ki: { schwerpunkt: 'markt', goldKnapp: GOLD_KNAPP_SILBERFURT },
  },
  distelhag: {
    name: 'Distelhag', sitz: 'Heide', wahlspruch: 'Wer uns greift, blutet.',
    // Fernruestung +2 statt +1 (Runde 202): gegen Eschenbruchs Schuetzen
    // stand Distelhag 0 bis 4 zu 20.
    boni: { wirkung: { infanterie: { nahruestung: 1, fernruestung: 2 } }, farm: { nahrung: 45 } },
    mannschaft: { ausbildung: { kaserne: 1.2 } },
    ki: { schwerpunkt: 'kaserne' },
  },
};

/**
 * Reparieren (bauen AC-45): wer bauen kann, gibt einem beschaedigten Gebaeude
 * `lebenJeSekunde` Leben zurueck; jeder weitere am selben Gebaeude nur den
 * Anteil `weitere` davon. Das ganze Leben eines Gebaeudes kostet den Anteil
 * `kostenanteil` seines Baupreises, bezahlt Punkt fuer Punkt.
 *
 * Halber Preis und 750 Leben je Minute sind die Regel des Originals; sie
 * stehen nicht in docs/strategie/vorlage-aoe2.md, und der Anteil der weiteren
 * ist gesetzt. Alles Startwerte.
 */
const REPARATUR = { lebenJeSekunde: 12.5, weitere: 0.5, kostenanteil: 0.5 };

/**
 * Abruesten (einheiten AC-50, ADR-0014): eine Einheit der Klassen in
 * `klassen` legt die Waffen ab und wird `wird` - nie umgekehrt, und nie, wer
 * eine Klasse aus `nie` traegt (der Wiedergaenger ist Infanterie und untot).
 * Bezahlt wird `kosten` beim Befehl; `sekunden` lang steht sie und arbeitet
 * nicht. Erstattet wird nichts, auch nicht, wenn ein neuer Befehl die
 * Lehrzeit abbricht - das ist gesetzt, nicht aus der ADR.
 *
 * 40 Nahrung und 20 Sekunden stehen in ADR-0014 (Benutzer, 2026-11-10); sie
 * sind Startwerte und stehen nicht in docs/strategie/vorlage-aoe2.md.
 * @type {{ kosten: Record<string, number>, sekunden: number, klassen: string[], nie: string[], wird: string }}
 */
const ABRUESTEN = {
  kosten: { nahrung: 40 },
  sekunden: 20,
  klassen: ['infanterie', 'bogenschuetze', 'kavallerie'],
  nie: ['untot', 'belagerung', 'moench', 'karren'],
  wird: 'dorfbewohner',
};

/**
 * Der Drache ausser seinen Kampfwerten (ADR-0014): Eier, Rufen, Fressen.
 *
 * `rufen` (bauen AC-35): ein Kloster mit Ei ruft ihn fuer `kosten`, bezahlt
 * beim Befehl; die Uhr von `sekunden` laeuft nur, solange `moenche` eigene
 * Moenche hoechstens `umkreis` Felder vom Rand des Klosters stehen. Aus der
 * ADR: 400 Nahrung, 400 Gold, 180 Sekunden, fuenf Moenche. Gesetzt: der
 * Umkreis.
 *
 * `fressen` (einheiten AC-54): `nahrungJeSekunde` so viel wie fuenf Bauern
 * ernten (5 x 0,32, aus der ADR); ist die Nahrung bei null, verliert er
 * `hungerJeSekunde` Leben - gesetzt: 5, also 100 Sekunden vom vollen Leben
 * bis zum Fall.
 *
 * `ei` (einheiten AC-51): wie nah ein Traeger am Ei stehen muss, um es
 * aufzuheben, in Feldern - gesetzt.
 * @type {{
 *   rufen: { kosten: Record<string, number>, sekunden: number, moenche: number, umkreis: number },
 *   fressen: { nahrungJeSekunde: number, hungerJeSekunde: number },
 *   ei: { greifen: number },
 *   gefallen: { sekunden: number },
 * }}
 */
const DRACHE = {
  rufen: { kosten: { nahrung: 400, gold: 400 }, sekunden: 180, moenche: 5, umkreis: 3 },
  fressen: { nahrungJeSekunde: 1.6, hungerJeSekunde: 5 },
  ei: { greifen: 1.5 },
  // So lange steht die Ansage, dass ein Drache fiel (einheiten AC-53) -
  // gesetzt, nicht aus der Vorlage.
  gefallen: { sekunden: 20 },
};

/** Ob eine Art abruesten kann (einheiten AC-50) - eine Frage der Klassen. */
function ruestetAb(art) {
  const klassen = EINHEITEN[art]?.klassen || [];
  return klassen.some((k) => ABRUESTEN.klassen.includes(k)) && !klassen.some((k) => ABRUESTEN.nie.includes(k));
}

// Die Gebaeude, die schiessen (bauen AC-29): wer hier einen Angriff hat.
// Das ist eine Eigenschaft der Art, kein Wert - der Angriff selbst wird nur
// ueber `welt.gebaeudewert()` gelesen (Waechter), und eine Verbesserung macht
// aus keinem Haus einen Turm.
const SCHIESSENDE = new Set(Object.keys(GEBAEUDE).filter((art) => (GEBAEUDE[art].angriff || 0) > 0));

module.exports = {
  EINHEITEN, SAMMELN, TIERE, GEBAEUDE, VERBESSERUNGEN, ZEITALTER, AUFSTIEGE, KLASSEN, HANDEL, HAEUSER, SCHIESSENDE,
  BEVOELKERUNG_MAX, SCHLANGE_MAX, STARTAUFSTELLUNG, REPARATUR, ABRUESTEN, ruestetAb, DRACHE,
};
