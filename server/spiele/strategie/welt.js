// @ts-check
'use strict';

const karten = require('./karte');
const { suchen, nachbarfeld, erreichbar, NACHBARN: NACHBARFELDER } = require('./wege');
const {
  EINHEITEN, SAMMELN, TIERE, GEBAEUDE, VERBESSERUNGEN, ZEITALTER, AUFSTIEGE, KLASSEN, HANDEL, HAEUSER,
  BEVOELKERUNG_MAX, SCHLANGE_MAX, STARTAUFSTELLUNG, REPARATUR, SCHIESSENDE, ABRUESTEN, ruestetAb, DRACHE,
} = require('./daten');
const { bringt, staerkt, hausBringt } = require('./bringt');

const TAKTE_PRO_SEKUNDE = 10;
// Welche Werte die Auswahlleiste je Einheit zeigt (bedienung AC-35). Leben
// steht dabei, weil der Lebensbalken denselben Weg nimmt.
// `sicht` seit Runde 105: der Browser zeichnet den Nebel aus der Sicht der
// eigenen Einheiten (kampf AC-11), mit Verbesserungen.
const KAMPFFELDER = ['leben', 'angriff', 'nahruestung', 'fernruestung', 'reichweite', 'sicht', 'tempo'];
const GEBAEUDEFELDER = ['leben', 'nahruestung', 'fernruestung', 'sicht', 'angriff', 'reichweite', 'nachladen'];
// Die Gebaeude, die schiessen (bauen AC-29), stehen als `SCHIESSENDE` in den
// Daten - einmal gezaehlt, `tuermeTakten()` laeuft in jedem Takt.
// Werte eines Gebaeudes, die nur fuer eines gelten, das schiesst (gebaeudewert).
const SCHUSSFELDER = new Set(['angriff', 'reichweite', 'nachladen']);
const SUCHWEITE_ERSATZ = 12;
// Wer fliegt (einheiten AC-52) - einmal aus den Daten gelesen.
const FLIEGER = Object.keys(EINHEITEN).filter((art) => EINHEITEN[art].fliegt);
// So lange liegt ein Toter noch im Bild, bevor er aus dem Zustand faellt
// (kampf AC-10): lang genug, um zu sehen, was passiert ist.
const TOT_SEKUNDEN = 2;
// So viele Ziele haengt Umschalt hoechstens an einen Gang (bedienung AC-14):
// eine Grenze, damit ein Zustand nicht mit jedem Klick waechst (ADR-0005).
const WEGPUNKTE_MAX = 20;
// Wie weit ein Bauer nach getaner Arbeit von selbst zur naechsten eigenen
// Baustelle geht (bauen AC-36), in Feldern.
const BAU_NAEHE = 8;
// Spielraum auf die Reichweite, damit ein Nahkaempfer auch schraeg (1,41
// Felder) zuschlaegt; am Rand einer Grundflaeche messen wir genauer.
const SCHLAGRAND = 0.5;
const SCHLAGRAND_BAU = 0.2;
// So oft sieht sich eine stehende Kampfeinheit um (kampf AC-2): zweimal je
// Sekunde. Jeder Takt waere fuenfmal so teuer und im Spiel nicht zu merken.
const WACHE_TAKTE = 5;
// Zweimal je Sekunde rechnet der Server, was jeder Spieler sieht (kampf AC-15).
const SICHT_TAKTE = 5;
// Die Werte der Einstellung "Sicht" (kampf AC-16, steckbrief.js).
const SICHT_ARTEN = ['nebel', 'erkundet', 'aufgedeckt'];

// Naeher als ein halbes Feld, und zwei Figuren sind im Bild eine mit zwei
// Schwertern (einheiten AC-29; dieselbe Grenze misst `figurenFrei`).
const AUSWEICHEN_ABSTAND = 0.5;

// Wer am Vorrat oder am Tier arbeitet, steht nicht auf der Feldmitte, sondern
// auf einem von vier Plaetzen des Standfelds - den Vierteln, ein halbes Feld
// auseinander (einheiten AC-30). Vier Sammler teilen so das Feld, das dem
// Lager am naechsten liegt, statt aufeinander zu stehen; mit einem Sammler
// je Feld verlor die Wirtschafts-KI am Beerenbusch 13 bis 16 % (Runde 89).
const STANDPLAETZE = [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]];
// Wie weit vom Vorrat noch gearbeitet wird: das schraege Nachbarfeld samt
// seinem aeusseren Viertel (1,77). Am Tier zaehlt dessen Lage, nicht sein
// Feld - dort bleibt es bei anderthalb Feldern.
const SAMMELN_WEIT = 1.9;
const TIER_WEIT = 1.5;

// Die Meldung "Angriff" (kampf AC-14): ein Gefecht an derselben Stelle meldet
// sich einmal, solange es ohne Pause von zwanzig Sekunden weitergeht; ein
// Angriff fuenfzehn Felder weiter ist ein neuer.
const MELDUNG_PAUSE = 200;

// Hoechstens so viele Pfeile warten auf den naechsten Zustand (bedienung
// AC-40) - genug fuer zwanzig Takte Zeitraffer mit grossen Heeren.
const SCHUESSE_HOECHSTENS = 400;
// So schnell fliegt ein Pfeil, Felder je Sekunde (kampf AC-27): so lange
// wie im Bild (bedienung AC-40), dort seit Runde 122 sieben. Gesetzt, nicht
// aus der Vorlage - die nennt fuer Pfeile keine Geschwindigkeit.
const PFEIL_TEMPO = 7;
const MELDUNG_ABSTAND = 15;

// Wie lange einer, der keinen Weg zu irgendeinem Lager fand, wartet, bevor
// er wieder sucht - fuenf Sekunden (ki AC-10, Durchsicht Runde 91). Bis
// dahin stand er ohnehin.
const LAGER_SUCHE_PAUSE = 50;
// So weit folgt eine Einheit einem Fluechtenden, gemessen von dem Platz, an
// dem sie stand (kampf AC-3).
const VERFOLGUNG_FELDER = 5;
// Wie lange eine Partie hoechstens dauern darf, ist eine Einstellung
// (spielziel AC-22, ADR-0013): keine, 90 oder 120 Spielminuten, Vorgabe
// keine. Steht nach Ablauf keine Entscheidung, endet sie unentschieden
// (AC-5). Was diese Liste nicht kennt, heisst "keine Grenze".
const ZEITGRENZEN = [90, 120];
// Wie schnell die Partie laeuft (spielziel AC-23, ADR-0013): eine
// Spielsekunde bleibt TAKTE_PRO_SEKUNDE Takte, schneller heisst, der Raum
// rechnet mehr Takte je echte Sekunde (`takte(einstellungen)` im
// Steckbrief). Die Welt rechnet nichts anders - sie sagt es nur dem Browser,
// damit er die Bewegung zwischen zwei Zustaenden passend streckt.
const GESCHWINDIGKEITEN = [1, 1.5, 2];
// So lange laeuft die Frist, wenn einer sein Buendnis kuendigt (spielziel
// AC-21, ADR-0013): erst danach sind die frueheren Verbuendeten Gegner. Die
// Zahl steht im ADR - genug, um Truppen aus dem fremden Dorf zu holen.
const KUENDIGUNG_SEKUNDEN = 60;
// So lange muss ein fertiges Wunder stehen, bis sein Besitzer gewinnt
// (spielziel AC-29) - zehn Spielminuten wie in der Vorlage, als Takte
// gerechnet, also auch mit der Spielgeschwindigkeit.
const WUNDER_SEKUNDEN = 600;
// So lange liegen die Truemmer eines gefallenen Gebaeudes im Bild
// (darstellung AC-26). Reine Darstellung: der Platz ist sofort frei.
const RUINE_SEKUNDEN = 20;
// Zellengroesse des Suchrasters fuer die Wache. Groesser als jede Sichtweite,
// damit die eigene Zelle und ihre acht Nachbarn alles Sichtbare enthalten.
const RASTER_FELDER = 8;
// Wo die Startaufstellung steht, relativ zur Basis: alle vor dem Dorfzentrum.
// Hinter ihm (dx + dy < 0) verdeckte es sie im Bild.
const STARTPLAETZE = [[2.5, 0.5], [0.5, 2.5], [2.2, 2.2], [3, -1]];

const FARBEN = ['#4a90d9', '#d94a4a', '#4ad98a', '#d9c04a', '#a44ad9', '#4ad9d0'];

// Startvorrat je Einstellung (karte AC-12); "wenig" ist die Vorlage.
const STARTVORRAT = {
  wenig: { holz: 200, nahrung: 200, gold: 100, stein: 200 },
  mittel: { holz: 500, nahrung: 500, gold: 500, stein: 500 },
  viel: { holz: 1000, nahrung: 1000, gold: 1000, stein: 1000 },
};
const ROHSTOFFE = ['holz', 'nahrung', 'gold', 'stein'];
const ROHSTOFF_NAMEN = { holz: 'Holz', nahrung: 'Nahrung', gold: 'Gold', stein: 'Stein', gefallene: 'Gefallene' };
// Was mit Gefallenen bezahlt wird (einheiten AC-49) und welche Klassen kein
// Heiler heilt (einheiten AC-37) - beides aus den Daten gelesen.
const AUS_GEFALLENEN = Object.keys(EINHEITEN).filter((art) => EINHEITEN[art].kosten?.gefallene);
const UNHEILBAR = new Set(Object.values(EINHEITEN).flatMap((w) => w.heilen?.nicht || []));

// Namen der Gebaeude fuer Meldungen auf dem Bildschirm - mit echten Umlauten.
// Ein Satz beginnt gross, auch wenn er mit einer Form aus den Daten beginnt
// („Das Lehen ist schon erreicht.").
const grossAnfang = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const GEBAEUDE_NAMEN = {
  dorfzentrum: 'Das Dorfzentrum',
  haus: 'Das Haus',
  muehle: 'Die Mühle',
  holzfaellerlager: 'Das Holzfällerlager',
  bergbaulager: 'Das Bergbaulager',
  farm: 'Die Farm',
  kaserne: 'Die Kaserne',
  schiessanlage: 'Die Schießanlage',
  stall: 'Der Stall',
  schmiede: 'Die Schmiede',
  aussenposten: 'Der Außenposten',
  kloster: 'Das Kloster',
  universitaet: 'Die Universität',
  belagerungswerkstatt: 'Die Belagerungswerkstatt',
  wachturm: 'Der Wachturm',
  steinmauer: 'Die Steinmauer',
  tor: 'Das Tor',
  burg: 'Die Burg',
  markt: 'Der Markt',
  wunder: 'Das Wunder',
};

// Dasselbe für die Einheiten (einheiten AC-23).
const EINHEIT_NAMEN = {
  dorfbewohner: 'Den Dorfbewohner',
  spaeherreiter: 'Den Späherreiter',
  miliz: 'Die Miliz',
  speerkaempfer: 'Den Speerkämpfer',
  bogenschuetze: 'Den Kurzbogenschützen',
  plaenkler: 'Den Plänkler',
  soldat: 'Den Soldaten',
  ritter: 'Den Ritter',
  bogenschuetze2: 'Den Bogenschützen',
  armbrustschuetze: 'Den Armbrustschützen',
  langschwertkaempfer: 'Den Langschwertkämpfer',
  pikenier: 'Den Pikenier',
  eliteplaenkler: 'Den Eliteplänkler',
  leichtekavallerie: 'Die leichte Kavallerie',
  zweihandkaempfer: 'Den Zweihandkämpfer',
  hellebardier: 'Den Hellebardier',
  husar: 'Den Husaren',
  kavalier: 'Den Kavalier',
  paladin: 'Den Paladin',
  langbogenschuetze: 'Den Langbogenschützen',
  schwerearmbrust: 'Die schwere Armbrust',
  belagerungsramme: 'Die Belagerungsramme',
  onager: 'Den Onager',
  eibenschuetze: 'Den Eibenschützen',
  pavesenschuetze: 'Den Pavesenschützen',
  soeldner: 'Den Söldner',
  kriegswolf: 'Den Kriegswolf',
  reiterschuetze: 'Den Reiterschützen',
  riese: 'Den Riesen',
  meuchler: 'Den Meuchler',
  wiedergaenger: 'Den Wiedergänger',
  drache: 'Den Drachen',
  ramme: 'Die Ramme',
  mangonel: 'Den Mangonel',
  moench: 'Den Mönch',
  marktkarren: 'Den Marktkarren',
};

// Welche Verbesserung eine Einheit zur naechsten Stufe macht - `wandelt`
// einmal umgedreht, damit die Absage den Namen nennen kann (einheiten AC-24).
const STUFE_DURCH = Object.fromEntries(
  Object.entries(VERBESSERUNGEN).flatMap(([v, w]) =>
    Object.values(w.wandelt || {}).map((nach) => [nach, v])),
);

/**
 * Die erste Stufe einer Einheit: der Langschwertkaempfer ist die dritte der
 * Miliz (einheiten AC-59). Im Gebaeude steht immer die erste.
 */
function grundstufeVon(art) {
  let grund = art;
  while (EINHEITEN[grund]?.stufeVon) grund = EINHEITEN[grund].stufeVon;
  return grund;
}

/**
 * Unter welchen Schluesseln eine Verbesserung eine Einheit trifft: ihre eigene
 * Art und jede ihrer Klassen (bauen AC-25). So gilt "Nah +1 Angriff" der
 * Infanterie und der Kavallerie, ohne dass die Simulation nach Einheitenarten
 * fragt - und eine neue Einheit erbt die Verbesserungen ihrer Klasse von selbst.
 *
 * Doppelte sind herausgenommen: `bogenschuetze` ist zugleich Art und Klasse,
 * und ohne das zaehlte eine Verbesserung bei ihm zweimal.
 */
function wirkungsschluessel(art) {
  return [...new Set([art, ...(EINHEITEN[art]?.klassen || [])])];
}

/** Wer keinen Zuschlag hat (`welt.bonusVon()`) - ein Objekt fuer alle, damit sich vergleichen laesst. */
const OHNE_BONUS = /** @type {Record<string, number>} */ (Object.freeze({}));

/**
 * Das Team eines Spielers aus den Einstellungen (spielziel AC-14):
 * `einstellungen.teams` ist `{ <spielerId>: 1..4 }`. Alles andere - kein
 * Eintrag, 0, eine Zahl ausserhalb, ein Text - heisst: kein Team.
 */
function teamAus(teams, id) {
  const team = teams && Object.hasOwn(teams, id) ? teams[id] : null;
  return Number.isInteger(team) && team >= 1 && team <= 4 ? team : null;
}

/**
 * Das Haus eines Spielers aus den Einstellungen (spielziel AC-17):
 * `einstellungen.haeuser` ist `{ <spielerId>: <haus> }` mit einem Schluessel
 * aus `HAEUSER`. Alles andere heisst: kein Haus, keine Boni - so spielen
 * alle Partien, die keins waehlen, wie bis Stufe D.
 */
function hausAus(haeuser, id) {
  const haus = haeuser && Object.hasOwn(haeuser, id) ? haeuser[id] : null;
  return typeof haus === 'string' && Object.hasOwn(HAEUSER, haus) ? haus : null;
}

function untaetigeListe(welt, spielerId) {
  const ids = welt.untaetigeVon(spielerId);
  return ids.length ? { u: ids } : {};
}

// Alle Rohstoffe einer Kostenangabe zusammen - Holz, Nahrung, Gold und Stein
// zaehlen fuer die Punkte gleich (bedienung AC-47). Ein Gefallener, mit dem
// der Wiedergaenger bezahlt wird (einheiten AC-49), ist kein Rohstoff.
function kostenSumme(kosten) {
  let summe = 0;
  for (const rohstoff of ROHSTOFFE) summe += kosten?.[rohstoff] || 0;
  return summe;
}

/**
 * Eine Richtung auf der Karte als Achtel: 0 laengs +x, 2 laengs +y, 4 laengs
 * -x, 6 laengs -y. null, wenn beide Punkte aufeinander liegen.
 */
function achtel(dx, dy) {
  if (Math.abs(dx) + Math.abs(dy) < 0.01) return null;
  return ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
}

// Die Punkte im Zustand, nur wenn es welche gibt - ein Zustand bleibt klein.
function punkteFeld(punkte) {
  return punkte > 0 ? { pk: punkte } : {};
}

/**
 * Die Einstellungen einer Partie, wie der Steckbrief sie durchreicht. Was
 * fehlt oder nicht passt, faellt auf die Vorgabe zurueck.
 *
 * @typedef {object} Einstellungen
 * @property {string} [kartengroesse]
 * @property {string} [vorrat] ein Schluessel aus `STARTVORRAT`
 * @property {string} [sicht] 'nebel', 'erkundet' oder 'aufgedeckt' (kampf AC-16)
 * @property {Record<string, number>} [teams] je Spieler 1 bis 4 (spielziel AC-14)
 * @property {Record<string, string>} [haeuser] je Spieler ein Schluessel aus `HAEUSER` (spielziel AC-17)
 * @property {string} [buendnisse] 'fest' oder 'loesbar' (spielziel AC-21)
 * @property {number} [zeitgrenze] 90 oder 120 Spielminuten (spielziel AC-22)
 * @property {string} [drache] 'an' oder 'aus' (einheiten AC-52, ADR-0014)
 * @property {number} [tempo] 1, 1.5 oder 2 (spielziel AC-23)
 */

/**
 * Was je Takt ueber die Leitung geht (uebertragung AC-7). Beschrieben sind
 * bisher nur die Felder der obersten Ebene - was in den Listen steht, prueft
 * noch niemand.
 *
 * @typedef {object} Zustand
 * @property {'zustand'} typ
 * @property {number} t der Takt
 * @property {Record<string, any>[]} spieler
 * @property {Record<string, any>[]} einheiten
 * @property {any[]} felder
 * @property {number[][]} [p] Pfeile seit dem letzten Zustand (bedienung AC-40)
 * @property {[string, number][]} [bu] geloeste Buendnisse (spielziel AC-21)
 * @property {object} [ende] das Ende, sobald es feststeht (spielziel AC-5)
 * @property {Record<string, any>[]} [gebaeude] nur die geaenderten
 * @property {Record<string, any>[]} [tiere] nur die geaenderten
 * @property {[number, number]} [av] der Vorrat, den dieser Spieler ansieht: Feld und Rest (bedienung AC-63)
 */

// Ein Takt auf dem Weg (einheiten AC-70): `rest` Felder entlang `obj.weg`,
// und wer dabei einen Wegpunkt erreicht, geht mit dem Rest zum naechsten
// weiter. Am letzten Wegpunkt endet der Takt. `runden` (etwa 100) rundet
// eine Lage zwischen zwei Wegpunkten auf so viele Teile je Feld.
function wegGehen(obj, rest, runden = 0) {
  while (rest > 0 && obj.weg.length) {
    const naechstes = obj.weg[0];
    const dx = naechstes.x - obj.x;
    const dy = naechstes.y - obj.y;
    const abstand = Math.hypot(dx, dy);
    // Ein Milliardstel Feld Spiel: zehnmal 0,1 ergibt 0,9999999999999999,
    // und ohne die Zugabe kostete dieser Rest einen ganzen Takt mehr.
    if (abstand > rest + 1e-9) {
      obj.x += (dx / abstand) * rest;
      obj.y += (dy / abstand) * rest;
      if (runden) {
        obj.x = Math.round(obj.x * runden) / runden;
        obj.y = Math.round(obj.y * runden) / runden;
      }
      return;
    }
    obj.x = naechstes.x;
    obj.y = naechstes.y;
    obj.weg.shift();
    rest -= abstand;
  }
}

class Welt {
  /**
   * @param {{id: string, name: string}[]} spielerListe
   * @param {number} startwert
   * @param {Einstellungen} [einstellungen]
   */
  constructor(spielerListe, startwert, einstellungen = {}) {
    this.startwert = startwert;
    this.karte = karten.erzeugen(startwert, spielerListe.length, einstellungen);
    // Zufall der Partie (einheiten AC-38: wie lange ein Bekehren dauert) -
    // aus dem Startwert, aber nicht dieselbe Folge wie die der Karte.
    this.zufall = karten.zufallAus((startwert ^ 0x5bd1e995) >>> 0);
    // Die Reihenfolge, in der die Einheiten ihren Takt rechnen, je Takt neu
    // gemischt (kampf AC-26) - eine eigene Folge, damit sie die des Bekehrens
    // nicht verschiebt.
    this.reihenZufall = karten.zufallAus((startwert ^ 0x2c1b3c6d) >>> 0);
    /** @type {any[]} die Einheiten in der Reihenfolge des laufenden Takts */
    this.reihe = [];
    const start = STARTVORRAT[einstellungen.vorrat] || STARTVORRAT.wenig;
    this.takt = 0;
    this.naechsteId = 1;
    this.einheiten = new Map();
    this.gebaeude = new Map();
    // Reparieren (bauen AC-45): wer in diesem Takt an welchem Gebaeude
    // steht, und was jeder Spieler an Bruchteilen eines Rohstoffs schuldet.
    this.reparaturen = new Map();
    this.reparaturschuld = new Map();
    // Wem ein Gebaeude gehoert hat, auch nachdem es gefallen ist (kampf AC-13).
    this.gebaeudeBesitzer = new Map();
    // Die Tore je Besitzer als Feldnummern (bauen AC-31), angelegt mit dem
    // ersten Tor.
    /** @type {Map<string, Set<number>> | null} */
    this.tore = null;
    // Werte mit Verbesserungen, gemerkt je Spieler (`einheitenwert`). Geleert,
    // sobald dieser Spieler etwas erforscht.
    this.werteGemerkt = new Map();
    // Gebaeude gehen wie Tiere nur bei Aenderung ueber die Leitung.
    this.gebaeudeAenderungen = new Set();
    // Eben eingestuerzte Gebaeude: Nummer -> Takt (darstellung AC-26).
    /** @type {Map<number, number>} */
    this.eingestuerzt = new Map();
    // Wessen Kampfwerte sich geaendert haben (bedienung AC-35): der naechste
    // Zustand schickt ihm seine Tafel. Ohne das muesste sie in jedem Takt
    // mitfahren, oder der Browser muesste die Verbesserungen selbst
    // zusammenrechnen - und damit stuende die Regel zweimal im Haus.
    this.werteAenderungen = new Set();
    // Wessen Marktpreise sich geaendert haben (bauen AC-33) - wie die
    // Kampfwerte nur dann im Zustand.
    this.preisAenderungen = new Set();
    this.feldAenderungen = [];
    // Die Schlaege dieses Taktes, abgerechnet an seinem Ende (kampf AC-10).
    this.schlaege = [];
    // Steine im Flug (kampf AC-19): `{ x, y, takte, angreifer, gebaeude }`.
    // Sie schlagen ein, wenn `takte` abgelaufen ist, dort, wo das Ziel beim
    // Abwurf stand.
    this.einschlaege = [];
    // Pfeile im Flug (kampf AC-27): jeder trifft, wenn er ankommt - wie ein
    // Stein, aber sicher und genau das Ziel, auf das er geschossen wurde.
    this.pfeileImFlug = [];
    // Der Drache (ADR-0014) ist eine Einstellung beim Eroeffnen (einheiten
    // AC-52): abgeschaltet liegen keine Eier, und es gibt kein Rufen.
    this.drachenAn = einstellungen.drache !== 'aus';
    // Die Dracheneier (einheiten AC-51): jedes an genau einem Ort - am Boden
    // (`x`, `y`), bei einem Traeger (`traeger`) oder in einem Kloster
    // (`kloster`) - oder es ist ein Drache (`drache`, einheiten AC-52). Wo
    // sie liegen, sagt die Karte. `gefallen`: hier fiel ein Drache, das
    // sehen alle (AC-53).
    // `nest` ist der Platz aus der Karte: dort liegt es in seiner Mulde.
    /** @type {Map<number, {id: number, x: number, y: number, traeger: number | null, kloster: number | null, drache: number | null, gefallen: boolean, nest: {x: number, y: number}}>} */
    this.eier = new Map();
    /** Faelle des Drachen (einheiten AC-53): wer, wo, bis zu welchem Takt die Ansage steht. */
    this.drachenFaelle = [];
    if (this.drachenAn) {
      // Eigene Nummern, nicht aus `naechsteId`: sonst verschoeben die Eier
      // die Nummern jeder Einheit und jedes Gebaeudes, und eine Partie der
      // KI verliefe anders als ohne sie.
      for (const { x, y } of this.karte.eier || []) {
        const id = this.eier.size + 1;
        this.eier.set(id, { id, x, y, traeger: null, kloster: null, drache: null, gefallen: false, nest: { x, y } });
      }
    }
    // Das Ende der Partie, sobald es feststeht (spielziel AC-5, AC-20):
    // `{ gewinner, sieger, team, grund, takt }` mit `grund` "eroberung" oder
    // "zeit". `gewinner` sind alle, die gewonnen haben - ein Team samt
    // seinen Ausgeschiedenen; `sieger` steht nur, wenn es genau einer ist.
    this.ende = null;
    // Gezaehlt wird der Bestand nur, wenn etwas verloren ging - sonst liefe
    // die Suche ueber alle Einheiten und Gebaeude in jedem Takt mit.
    this.bestandPruefen = false;

    this.spieler = spielerListe.map((eintrag, i) => ({
      id: eintrag.id,
      name: eintrag.name,
      farbe: FARBEN[i % FARBEN.length],
      ...start,
      basis: this.karte.basen[i],
      verbesserungen: [], // erforscht, in der Reihenfolge des Abschlusses
      // Grundpreise am Markt, je Spieler (bauen AC-33).
      preise: { ...HANDEL.waren },
      zeitalter: 0, // jede Partie beginnt in der Dunklen Zeit (spielziel AC-1)
      aus: false, // ausgeschieden oder aufgegeben (spielziel AC-5, AC-6)
      // Aufgegeben und nicht besiegt (spielziel AC-27): das Bild sagt es,
      // sonst gewinnt jemand, ohne zu sehen, warum.
      aufgegeben: false,
      // Fuer die Tafel am Ende (spielziel AC-8). Gezaehlt wird waehrend der
      // ganzen Partie, nicht am Schluss ausgerechnet: wer frueh ausscheidet,
      // hat am Ende weder Einheiten noch Vorraete, und seine Zahlen waeren
      // sonst alle null.
      gesammelt: { holz: 0, nahrung: 0, gold: 0, stein: 0 },
      ausgebildet: 0, // Einheiten, die er aus einem Gebaeude bekommen hat
      ausgebildetWert: 0, // was sie gekostet haben, fuer die Punkte (bedienung AC-47)
      besiegtWert: 0, // was getoetete und zerstoerte des Gegners gekostet haben (bedienung AC-49)
      verloren: 0, // eigene Einheiten, die gefallen sind
      // Gefallene, mit denen noch nichts bezahlt ist (einheiten AC-49) -
      // gezaehlt nur fuer ein Haus, das damit etwas ausbildet.
      gefallene: 0,
      // Das Team (spielziel AC-14): 1 bis 4 oder keins. Wer keins hat,
      // spielt gegen alle.
      team: teamAus(einstellungen.teams, eintrag.id),
      // Das Haus (spielziel AC-17): ein Schluessel aus `HAEUSER` oder keins.
      // Seine Boni liest `wirkungen()`, nie eine Regel selbst.
      haus: hausAus(einstellungen.haeuser, eintrag.id),
      // Das Feld des Vorrats, den er gerade ansieht (bedienung AC-63).
      ansieht: /** @type {number | null} */ (null),
      // Leere Farmen (bauen AC-41, AC-42): ob sie von selbst neu ausgesaet
      // werden - und ob sie verschwinden, statt brachzuliegen (die KI).
      farmenErneuern: false,
      brachenRaeumen: false,
    }));
    // Die Wirkungen je Spieler (`wirkungen()`), gemerkt mit der Zahl der
    // Verbesserungen und dem Stand der Buendnisse, auf denen sie beruhen.
    // `buendnisStand` zaehlt jede Trennung einer Sicht (spielziel AC-25).
    this.wirkungenGemerkt = new Map();
    // Der Zuschlag je Klasse des Ziels, je Spieler und Art (`bonusVon()`) -
    // gemerkt, solange die Liste seiner Wirkungen dieselbe ist.
    this.bonusGemerkt = new Map();
    this.buendnisStand = 0;
    // Wer mit wem verbuendet ist, fragt jede Kampfregel - deshalb eine Map
    // statt `spielerVon` (das sucht in der Liste).
    this.teamVon = new Map(this.spieler.map((s) => [s.id, s.team]));
    this.mitTeams = this.spieler.some((s) => s.team);
    // Gibt es ueberhaupt zwei Gegner? Stehen alle in einem Team, entscheidet
    // keine Eroberung - sonst endete die Partie im ersten Takt mit "Ihr habt
    // gewonnen" (spielziel AC-20, Durchsicht Runde 150). Dann endet sie
    // erst mit der Zeit oder wenn niemand mehr steht.
    this.mitGegnern = this.spieler.some((a) => this.spieler.some((b) => this.feindlich(a.id, b.id)));
    // Ob ein Buendnis waehrend der Partie geloest werden kann (spielziel
    // AC-21, Einstellung "Bündnisse"). Alles ausser "fest" heisst lösbar -
    // die Vorgabe des Steckbriefs.
    this.buendnisse = einstellungen.buendnisse === 'fest' ? 'fest' : 'loesbar';
    // Die Zeitgrenze in Spielminuten oder null (spielziel AC-22).
    this.zeitgrenze = ZEITGRENZEN.includes(einstellungen.zeitgrenze) ? einstellungen.zeitgrenze : null;
    // Die Spielgeschwindigkeit (spielziel AC-23); was die Liste nicht kennt, ist 1.
    this.tempo = GESCHWINDIGKEITEN.includes(einstellungen.tempo) ? einstellungen.tempo : 1;
    // Gekuendigte Buendnisse, je `{ wer, bis }` mit `bis` als Takt, an dem
    // die Frist ablaeuft, und `vorbei`, sobald sie abgelaufen ist. Die Liste
    // geht mit jedem Zustand an alle: eine Kuendigung ist oeffentlich.
    this.kuendigungen = [];

    // Tiere gehoeren einem Spieler, stehen aber nicht in den Einheiten: sie
    // stehen still, bis jemand sie nutzt, und gehen deshalb nicht zehnmal je
    // Sekunde ueber die Leitung - einmal im Aufbau, danach nur bei Aenderung
    // (karte AC-16, uebertragung AC-7).
    this.tiere = new Map();
    this.tierAenderungen = [];
    for (const schaf of this.karte.schafe) {
      const id = this.naechsteId++;
      this.tiere.set(id, {
        id,
        art: 'schaf',
        besitzer: this.spieler[schaf.spieler].id,
        x: schaf.x,
        y: schaf.y,
        nahrung: TIERE.schaf.nahrung,
        geschlachtet: false,
        verfall: 0, // Takte ohne Arbeit seit der letzten verfallenen Nahrung
        weg: [],
      });
    }

    for (const spieler of this.spieler) {
      this.gebaeudeAnlegen(spieler.id, 'dorfzentrum', spieler.basis.x, spieler.basis.y);
      STARTAUFSTELLUNG.forEach((art, i) => {
        const [dx, dy] = STARTPLAETZE[i % STARTPLAETZE.length];
        this.einheitAnlegen(spieler.id, spieler.basis.x + dx, spieler.basis.y + dy, art);
      });
    }

    // Was jeder Spieler sieht (kampf AC-15): `sichtbar` traegt den Stempel der
    // letzten Rechnung, in der das Feld gesehen wurde - so muss nichts geleert
    // werden, und acht Spieler auf der groessten Karte kosten keine 320.000
    // Schreibvorgaenge je halbe Sekunde. `erkundet` bleibt, was einmal gesehen war.
    const felder = this.karte.groesse * this.karte.groesse;
    // Die Sicht als Einstellung der Partie (kampf AC-16): Nebel, eine von
    // Anfang an erkundete Karte, oder alles aufgedeckt.
    this.sichtArt = SICHT_ARTEN.includes(einstellungen.sicht) ? einstellungen.sicht : 'nebel';
    this.sichtStempel = 0;
    // Verbuendete sehen gemeinsam (spielziel AC-19): wer in einem Team ist,
    // teilt mit ihm dieselbe Sicht - ein Satz Felder je Team, nicht je
    // Spieler. So gilt jede Frage nach der Sicht (`sieht`, `erkundet`, was der
    // Server schickt) von selbst fuer das ganze Team, und die Rechnung wird
    // nicht teurer: jede Einheit markiert weiter genau einmal.
    const neueSicht = () => ({
      sichtbar: new Uint32Array(felder), gebaeude: new Uint8Array(felder), erkundet: new Uint8Array(felder),
      // Die Karte ist bekannt, ohne gesehen zu sein (Kartografie, bauen AC-52).
      karte: false,
    });
    const jeTeam = new Map();
    this.sichten = new Map(this.spieler.map((s) => {
      if (!s.team) return [s.id, neueSicht()];
      if (!jeTeam.has(s.team)) jeTeam.set(s.team, neueSicht());
      return [s.id, jeTeam.get(s.team)];
    }));
    this.gebaeudeSichtNeu = true;
    if (this.sichtArt !== 'nebel') for (const sicht of this.sichten.values()) sicht.erkundet.fill(1);
    this.sichtAktualisieren();
  }

  /**
   * Die Sicht aller Spieler neu (kampf AC-15). Jede lebende Einheit sieht ihre
   * Sichtweite aus den Daten, mit Verbesserungen (`einheitenwert`); jedes
   * Gebaeude acht Felder ueber seinen Rand (daten.js). Ein Feld zaehlt, wenn
   * seine Mitte hoechstens so weit entfernt ist.
   */
  sichtAktualisieren() {
    const g = this.karte.groesse;
    const stempel = ++this.sichtStempel;
    // Alles, was hoechstens r vom Rechteck (ax..bx, ay..by) entfernt ist - fuer
    // eine Einheit ist das Rechteck ein Punkt, fuer ein Gebaeude seine
    // Grundflaeche: "acht Felder ueber den Rand", in jeder Reihe gleich.
    const markieren = (ziel, wert, erkundet, ax, ay, bx, by, r) => {
      const x0 = Math.max(0, Math.floor(ax - r));
      const x1 = Math.min(g - 1, Math.ceil(bx + r));
      const y0 = Math.max(0, Math.floor(ay - r));
      const y1 = Math.min(g - 1, Math.ceil(by + r));
      const rr = r * r;
      for (let y = y0; y <= y1; y++) {
        const dy = y < ay ? ay - y : y > by ? y - by : 0;
        for (let x = x0; x <= x1; x++) {
          const dx = x < ax ? ax - x : x > bx ? x - bx : 0;
          if (dx * dx + dy * dy > rr) continue;
          const i = y * g + x;
          ziel[i] = wert;
          erkundet[i] = 1;
        }
      }
    };
    // Die Sichtweite je Besitzer und Art einmal je Rechnung - nicht je Einheit.
    const weite = new Map();
    const getarnte = [];
    for (const e of this.einheiten.values()) {
      if (e.tot) continue;
      if (EINHEITEN[e.art].getarnt) getarnte.push(e);
      const sicht = this.sichten.get(e.besitzer);
      if (!sicht) continue;
      const schluessel = `${e.besitzer}|${e.art}`;
      if (!weite.has(schluessel)) weite.set(schluessel, this.einheitenwert(e.besitzer, e.art, 'sicht'));
      markieren(sicht.sichtbar, stempel, sicht.erkundet, e.x, e.y, e.x, e.y, weite.get(schluessel));
    }
    // Gebaeude stehen still: ihre Sicht wird nur neu gerechnet, wenn eines
    // entsteht oder faellt. Jedes deckt mit acht Feldern Rand gut 400 Felder
    // ab, und so kostete die Sicht eine ganze Partie die Haelfte mehr
    // Rechenzeit (Runde 104, gemessen: 7,8 statt 5,0 s fuer fuenf Partien).
    if (this.gebaeudeSichtNeu) {
      this.gebaeudeSichtNeu = false;
      for (const sicht of new Set(this.sichten.values())) sicht.gebaeude.fill(0);
      for (const b of this.gebaeude.values()) {
        const sicht = this.sichten.get(b.besitzer);
        // Eine Baustelle sieht nichts (kampf AC-24): erst das fertige Gebaeude
        // deckt auf - sonst waere ein Fundament in der Ferne ein Spaeher fuer
        // ein paar Holz. Wer baut, sieht selbst.
        if (!sicht || !b.fertig) continue;
        const { x0, y0, x1, y1 } = this.grundflaeche(b.art, b.x, b.y, b.quer);
        markieren(sicht.gebaeude, 1, sicht.erkundet, x0, y0, x1, y1, this.gebaeudeSicht(b.besitzer, b.art));
      }
    }
    if (getarnte.length) this.tarnungRechnen(getarnte);
  }

  /**
   * Wer die Getarnten entdeckt hat (kampf AC-22): je getarnter Einheit die
   * Sichten, zu denen eine lebende Einheit oder ein fertiges Gebaeude gehoert,
   * das hoechstens `getarnt` Felder entfernt steht - vom Rand der
   * Grundflaeche gemessen wie die Reichweite eines Turms. Gerechnet mit der
   * Sicht, zweimal je Sekunde, und nur, wenn es Getarnte gibt.
   */
  tarnungRechnen(getarnte) {
    for (const g of getarnte) {
      const weit = EINHEITEN[g.art].getarnt;
      const eigene = this.sichten.get(g.besitzer);
      const entdeckt = new Set();
      for (const e of this.einheiten.values()) {
        if (e.tot) continue;
        const sicht = this.sichten.get(e.besitzer);
        if (!sicht || sicht === eigene || entdeckt.has(sicht)) continue;
        if (Math.hypot(e.x - g.x, e.y - g.y) <= weit) entdeckt.add(sicht);
      }
      for (const b of this.gebaeude.values()) {
        if (!b.fertig) continue;
        const sicht = this.sichten.get(b.besitzer);
        if (!sicht || sicht === eigene || entdeckt.has(sicht)) continue;
        const { x0, y0, x1, y1 } = this.grundflaeche(b.art, b.x, b.y, b.quer);
        if (Math.hypot(Math.max(x0 - g.x, 0, g.x - x1), Math.max(y0 - g.y, 0, g.y - y1)) <= weit) entdeckt.add(sicht);
      }
      g.entdeckt = entdeckt;
    }
  }

  /**
   * Zaehlt diese Einheit fuer den Spieler als gesehen? Die eine Stelle fuer
   * jede Frage nach einer fremden Einheit - was der Server schickt (kampf
   * AC-13), was ein Klick trifft (kampf AC-11), was die KI wahrnimmt (ki
   * AC-13). Eigene und die der Verbuendeten immer; ohne Nebel alle. Eine
   * Getarnte erst, wenn sie entdeckt ist (kampf AC-22, `tarnungRechnen`) -
   * dass sie in seiner Sicht steht, reicht nicht.
   */
  siehtEinheit(spielerId, einheit) {
    if (this.teiltSicht(spielerId, einheit.besitzer) || !this.nebelGiltFuer(spielerId)) return true;
    if (EINHEITEN[einheit.art].getarnt) return Boolean(einheit.entdeckt?.has(this.sichten.get(spielerId)));
    return this.sieht(spielerId, Math.round(einheit.x), Math.round(einheit.y));
  }

  /**
   * Ist diese Einheit vor dem Spieler verborgen, obwohl sie in seiner Sicht
   * stehen mag (kampf AC-22)? Das fragen Wache, Tuerme und der laufende
   * Angriff: sie greifen nicht an, was der Spieler nicht sieht. Fuer alle
   * anderen Einheiten aendert sich nichts - eine Wache fragte nie nach dem
   * Nebel, sie sieht selbst.
   */
  verborgen(spielerId, einheit) {
    return Boolean(EINHEITEN[einheit.art].getarnt) && !this.siehtEinheit(spielerId, einheit);
  }

  aufKarte(x, y) {
    const g = this.karte.groesse;
    return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < g && y < g;
  }

  // Wie weit ein Gebaeude sieht: der Wert aus den Daten und was die
  // Verbesserungen seines Besitzers dazugeben (kampf AC-17, Stadtwache).
  gebaeudeSicht(besitzer, art) {
    return this.gebaeudewert(besitzer, art, 'sicht');
  }

  /**
   * Ein Wert eines Gebaeudes mit den Verbesserungen seines Besitzers - Leben,
   * Ruestung, Sicht (kampf AC-17, bauen AC-34). Das Gegenstueck zu
   * `einheitenwert()`: wer `GEBAEUDE[art].leben` direkt liest, sieht das
   * Mauerwerk nicht. Leben waechst um einen Anteil des Grundwerts
   * (`lebenAnteil`), alles andere um einen Zuschlag. Angriff, Reichweite und
   * Nachladezeit nur bei einem Gebaeude, das schiesst (spielziel AC-26):
   * "Turm und Burg +1 Reichweite" gilt nicht dem Wohnhaus.
   *
   * `bauwerk` gibt Zuschlaege einer einzelnen Gebaeudeart (bauen AC-38, der
   * Wehrturm) - sie kommen zum Grundwert, bevor der Anteil des Mauerwerks
   * darauf rechnet.
   */
  gebaeudewert(besitzer, art, feld) {
    const wirkungen = this.wirkungen(besitzer);
    let grund = GEBAEUDE[art][feld] || 0;
    for (const w of wirkungen) grund += w.bauwerk?.[art]?.[feld] || 0;
    if (feld === 'leben') {
      let anteil = 0;
      for (const w of wirkungen) anteil += w.gebaeude?.lebenAnteil || 0;
      return Math.round(grund * (1 + anteil));
    }
    if (SCHUSSFELDER.has(feld) && !SCHIESSENDE.has(art)) return grund;
    let wert = grund;
    for (const w of wirkungen) wert += w.gebaeude?.[feld] || 0;
    return wert;
  }

  /**
   * Alles, was die Werte eines Spielers veraendert, in einer Form: zuerst die
   * Boni seines Hauses (von Beginn an), dann die Mannschaftsboni, dann jede
   * erforschte Verbesserung (spielziel AC-17, AC-25). Jede Lesestelle -
   * `einheitenwert`, `gebaeudewert`, `sammelrate`, `farmNahrung`,
   * `handelswert`, `ausbildungstempo` - laeuft ueber diese Liste; ein Haus
   * ist deshalb ein Eintrag in `HAEUSER` und keine Verzweigung.
   *
   * Der Mannschaftsbonus kommt von jedem Haus, das er selbst oder einer
   * traegt, mit dem er die Sicht teilt - je Haus einmal, auch wenn zwei
   * Verbuendete dasselbe haben. Gefragt wird `teiltSicht`, nicht
   * `feindlich`: in der Frist einer Kuendigung ist keiner mehr Verbuendeter
   * (ADR-0014 Punkt 6). Im Aufbau, bevor es Sichten gibt, gilt das Team.
   *
   * Gemerkt je Spieler, solange die Zahl seiner Verbesserungen und der Stand
   * der Buendnisse gleich bleiben: `sammelrate` fragt in jedem Takt fuer
   * jeden Sammler.
   */
  wirkungen(besitzer) {
    const spieler = this.spielerVon(besitzer);
    if (!spieler) return [];
    const n = spieler.verbesserungen.length;
    const stand = this.buendnisStand;
    const zeitalter = spieler.zeitalter;
    const da = this.wirkungenGemerkt.get(besitzer);
    if (da && da.n === n && da.stand === stand && da.zeitalter === zeitalter) return da.liste;
    const liste = [];
    // Was die erreichten Zeitalter selbst staerken (einheiten AC-57).
    for (let stufe = 1; stufe <= zeitalter; stufe++) if (ZEITALTER[stufe]?.wirkung) liste.push(ZEITALTER[stufe]);
    if (spieler.haus) liste.push(HAEUSER[spieler.haus].boni);
    // Boni, die erst ab einem Zeitalter gelten (`boniAb`), in der Form der
    // uebrigen - mit dem Aufstieg nachgetragen (`zeitalterWirkungen`).
    for (const [ab, boni] of Object.entries(spieler.haus ? HAEUSER[spieler.haus].boniAb || {} : {})) {
      if (zeitalter >= Number(ab)) liste.push(boni);
    }
    const haeuser = new Set();
    for (const s of this.spieler) {
      const mit = s === spieler
        || (this.sichten ? this.teiltSicht(besitzer, s.id) : Boolean(spieler.team) && s.team === spieler.team);
      if (mit && s.haus) haeuser.add(s.haus);
    }
    for (const haus of haeuser) if (HAEUSER[haus].mannschaft) liste.push(HAEUSER[haus].mannschaft);
    for (const v of spieler.verbesserungen) liste.push(VERBESSERUNGEN[v]);
    this.wirkungenGemerkt.set(besitzer, { n, stand, zeitalter, liste });
    return liste;
  }

  /**
   * Wie schnell ein Gebaeude dieses Spielers ausbildet, als Faktor auf den
   * Fortschritt je Takt (spielziel AC-25): 1,2 heisst 20 % schneller. Nur
   * Einheiten - Verbesserungen und Aufstiege laufen im alten Tempo.
   */
  ausbildungstempo(besitzer, gebaeudeArt) {
    let tempo = 1;
    for (const w of this.wirkungen(besitzer)) tempo *= w.ausbildung?.[gebaeudeArt] || 1;
    return tempo;
  }

  // Sieht dieser Spieler das Feld jetzt? Und hat er es je gesehen? (kampf AC-15)
  sieht(spielerId, x, y) {
    const sicht = this.sichten.get(spielerId);
    // Ausserhalb der Karte sieht niemand - sonst griffe x = -1 in die
    // Nachbarreihe (Durchsicht Runde 104).
    if (!this.aufKarte(x, y)) return false;
    if (this.sichtArt === 'aufgedeckt') return true;
    const i = y * this.karte.groesse + x;
    return Boolean(sicht) && (sicht.sichtbar[i] === this.sichtStempel || sicht.gebaeude[i] === 1);
  }

  erkundet(spielerId, x, y) {
    const sicht = this.sichten.get(spielerId);
    if (!this.aufKarte(x, y)) return false;
    return Boolean(sicht) && sicht.erkundet[y * this.karte.groesse + x] === 1;
  }

  // Werte eines Auftrags in der Schlange: Einheit, Verbesserung oder Aufstieg.
  // Alle drei haben `kosten` und `zeit` - deshalb rechnet die Schlange mit
  // allen dreien gleich, und ein Abbruch erstattet voll (bauen AC-11, AC-23).
  auftragWerte(art) {
    return EINHEITEN[art] || VERBESSERUNGEN[art] || AUFSTIEGE[art];
  }

  /**
   * Was ein Auftrag **diesen Spieler** kostet (einheiten AC-44): die Kosten
   * aus den Daten, mal dem `preis` aus seinen Wirkungen - ein Haus bekommt
   * den Soeldner billiger. Die eine Stelle: bezahlt, erstattet, gezaehlt und
   * gezeigt wird nur hierueber. Ohne Nachlass ist es dasselbe Objekt wie in
   * den Daten - daran erkennt `kampfwerte()`, ob es etwas zu schicken gibt.
   */
  auftragKosten(besitzer, art) {
    const kosten = this.auftragWerte(art).kosten;
    let faktor = 1;
    for (const w of this.wirkungen(besitzer)) faktor *= w.preis?.[art] ?? 1;
    if (faktor === 1) return kosten;
    return Object.fromEntries(Object.entries(kosten).map(([rohstoff, menge]) => [rohstoff, Math.round(menge * faktor)]));
  }

  /**
   * Ob das Haus dieses Spielers eine Einheit ausbildet (einheiten AC-42):
   * `haeuser` an der Einheit nennt, wer es darf; fehlt es, darf es jeder.
   * Gefragt wird ueberall, wo auch das Zeitalter gefragt wird.
   */
  hausBildetAus(spieler, art) {
    // Auch eine Verbesserung kann einem Haus gehoeren (einheiten AC-69).
    const nur = (EINHEITEN[art] || VERBESSERUNGEN[art])?.haeuser;
    return !nur || nur.includes(spieler.haus);
  }

  /**
   * Die Punkte eines Spielers (bedienung AC-47): ein Punkt je 10 gesammelte
   * Rohstoffe, je 10 Rohstoffe, die ausgebildete Einheiten gekostet haben, und
   * je 5, die Verbesserungen und Aufstiege gekostet haben - Wissen zaehlt
   * doppelt. Dazu je 5 Rohstoffe, die vernichtete Einheiten und Gebaeude des
   * Gegners gekostet haben (bedienung AC-49). Alles aus Zaehlern, die waehrend
   * der Partie wachsen; nichts geht zurueck, wenn eine Einheit faellt.
   */
  punkte(spieler) {
    const gesammelt = kostenSumme(spieler.gesammelt);
    let wissen = 0;
    for (const art of spieler.verbesserungen) wissen += kostenSumme(VERBESSERUNGEN[art].kosten);
    for (const aufstieg of Object.values(AUFSTIEGE)) {
      if (aufstieg.stufe <= spieler.zeitalter) wissen += kostenSumme(aufstieg.kosten);
    }
    return Math.floor((gesammelt + spieler.ausgebildetWert) / 10 + (wissen + spieler.besiegtWert) / 5);
  }

  // Ein Auftrag, der keinen Platz in der Bevoelkerung braucht: Verbesserung
  // oder Aufstieg. Er laeuft auch, wenn die Bevoelkerung voll ist.
  ohnePlatz(art) {
    return Boolean(VERBESSERUNGEN[art] || AUFSTIEGE[art]);
  }

  // Zeitalter eines Gebaeudes; ohne Angabe die Dunkle Zeit.
  gebaeudeZeitalter(art) {
    return GEBAEUDE[art].zeitalter || 0;
  }

  /**
   * Fertige eigene Gebaeude des laufenden Zeitalters, ausser denen mit
   * `zumAufstieg: false` (Haeuser, Tuerme, Mauern) - die Voraussetzung des
   * Aufstiegs (bauen AC-23). Das Dorfzentrum zaehlt mit, also fehlt noch ein
   * gebautes.
   */
  gebaeudeDerZeit(spieler) {
    let zahl = 0;
    for (const g of this.gebaeude.values()) {
      if (g.besitzer !== spieler.id || !g.fertig || GEBAEUDE[g.art].zumAufstieg === false) continue;
      if (this.gebaeudeZeitalter(g.art) === spieler.zeitalter) zahl += 1;
    }
    return zahl;
  }

  /**
   * Ein Wert einer Einheit mit allen Verbesserungen ihres Spielers - Leben,
   * Angriff, Ruestung, Reichweite, Sicht, Tempo, Nachladezeit (bauen AC-21,
   * AC-25). Eine Stelle fuer alle Werte: wer die Tabelle direkt liest, sieht
   * die Verbesserungen nicht. Darauf achtet `tests/waechter-werte.test.mjs`.
   *
   * `spieler.verbesserungen` aendert sich nur ueber `erforschen()` - dort wird
   * das Gedaechtnis dieses Spielers geleert.
   */
  einheitenwert(besitzer, art, feld) {
    const spieler = this.spielerVon(besitzer);
    // Ohne Verbesserung, Haus und Team wirkt nichts - auch kein
    // Mannschaftsbonus, denn den bringt nur ein Verbuendeter (spielziel AC-25).
    if (!spieler || (!spieler.verbesserungen.length && !spieler.haus && !spieler.team && !spieler.zeitalter)) return EINHEITEN[art][feld] || 0;
    // Gemerkt je Spieler: `laufen()` fragt das Tempo in jedem Takt fuer jede
    // Einheit, `wacheTakten()` zweimal je Sekunde die Sicht. Ohne Gedaechtnis
    // liefe darunter je Aufruf eine Schleife ueber alle Verbesserungen mit
    // (fahrplan AC-6: ein Takt mit 8 x 100 Einheiten unter 10 ms).
    // Mit dem Zeitalter, denn ein Haus kann Boni ab einem Zeitalter tragen
    // (`boniAb`) - auch wenn jemand die Stufe ohne Aufstieg setzt.
    let gemerkt = this.werteGemerkt.get(besitzer);
    // Nach einem Aufstieg neu: ein Zeitalter kann selbst staerken (einheiten AC-57).
    if (!gemerkt || gemerkt.zeitalter !== spieler.zeitalter) {
      this.werteGemerkt.set(besitzer, gemerkt = new Map());
      gemerkt.zeitalter = spieler.zeitalter;
    }
    const schluessel = `${art}|${feld}`;
    const da = gemerkt.get(schluessel);
    if (da !== undefined) return da;
    let wert = EINHEITEN[art][feld] || 0;
    const wirkungen = this.wirkungen(besitzer);
    for (const s of wirkungsschluessel(art)) {
      for (const w of wirkungen) wert += w.wirkung?.[s]?.[feld] || 0;
    }
    // Ein Anteil am Tempo (bauen AC-46, die Pferdezucht) rechnet auf alles,
    // was davor steht - auch auf den Zuschlag des Lehens fuer den Spaeher.
    if (feld === 'tempo') {
      let anteil = 0;
      for (const s of wirkungsschluessel(art)) {
        for (const w of wirkungen) anteil += w.wirkung?.[s]?.tempoAnteil || 0;
      }
      if (anteil) wert = Math.round(wert * (1 + anteil) * 1000) / 1000;
    }
    gemerkt.set(schluessel, wert);
    return wert;
  }

  /**
   * Der Zuschlag einer Einheit je Klasse des Ziels, mit den Verbesserungen
   * ihres Spielers (bauen AC-54, AC-56): nach der Brandstiftung hat das
   * Fussvolk +2 gegen Gebaeude. Wie `einheitenwert()` die eine Stelle - die
   * Schadensformel liest den Bonus nicht aus der Tabelle. Ohne Aenderung ist
   * es dasselbe Objekt wie in den Daten.
   * @returns {Record<string, number>}
   */
  bonusVon(besitzer, art) {
    const grund = EINHEITEN[art].bonus || OHNE_BONUS;
    const liste = this.wirkungen(besitzer);
    let gemerkt = this.bonusGemerkt.get(besitzer);
    if (!gemerkt || gemerkt.liste !== liste) this.bonusGemerkt.set(besitzer, gemerkt = { liste, je: new Map() });
    let bonus = gemerkt.je.get(art);
    if (bonus) return bonus;
    bonus = grund;
    for (const schluessel of wirkungsschluessel(art)) {
      for (const w of liste) {
        for (const [klasse, zahl] of Object.entries(w.bonus?.[schluessel] || {})) {
          if (bonus === grund) bonus = { ...grund };
          bonus[klasse] = (bonus[klasse] || 0) + zahl;
        }
      }
    }
    // Ein Anteil mehr Schaden gegen eine Klasse (bauen AC-50, die
    // Belagerungsingenieure): gerechnet auf Angriff samt Zuschlag und als
    // weiterer Zuschlag gefuehrt - so zeigt ihn die Leiste, und die
    // Schadensformel bleibt `Angriff - Ruestung + Bonus`.
    for (const schluessel of wirkungsschluessel(art)) {
      for (const w of liste) {
        for (const [klasse, anteil] of Object.entries(w.bonusAnteil?.[schluessel] || {})) {
          if (bonus === grund) bonus = { ...grund };
          const bisher = bonus[klasse] || 0;
          bonus[klasse] = bisher + Math.round((this.einheitenwert(besitzer, art, 'angriff') + bisher) * anteil);
        }
      }
    }
    gemerkt.je.set(art, bonus);
    return bonus;
  }

  /**
   * Reichweite oder Ruhe des Bekehrens mit den Verbesserungen des Spielers
   * (bauen AC-55): nach dem Buchdruck zwoelf statt neun Felder, nach der
   * Erleuchtung 41 statt 62 Sekunden Ruhe.
   * @param {'reichweite' | 'ruhe'} feld
   */
  bekehrwert(besitzer, art, feld) {
    let wert = EINHEITEN[art].bekehren[feld];
    for (const w of this.wirkungen(besitzer)) wert += w.bekehren?.[feld] || 0;
    return wert;
  }

  /** Wie schnell die Dorfbewohner dieses Spielers bauen - nach dem Tretkran das 1,2-fache (bauen AC-56). */
  bautempo(besitzer) {
    let faktor = 1;
    for (const w of this.wirkungen(besitzer)) faktor *= w.bautempo || 1;
    return faktor;
  }

  // Leben einer Einheit mit allen Verbesserungen ihres Spielers (bauen AC-21).
  lebenMax(besitzer, art) {
    return this.einheitenwert(besitzer, art, 'leben');
  }

  /**
   * Die Werte jeder Einheitenart, wie sie fuer diesen Spieler gelten - fuer
   * die Auswahlleiste (bedienung AC-35). Gelesen wird nur ueber
   * `einheitenwert()`, damit Verbesserungen sich zeigen: nach dem
   * Schmiedeangriff steht beim Speerkaempfer 4 Angriff, nicht 3.
   */
  kampfwerte(besitzer) {
    const tafel = {};
    for (const art of Object.keys(EINHEITEN)) {
      tafel[art] = {};
      for (const feld of KAMPFFELDER) tafel[art][feld] = this.einheitenwert(besitzer, art, feld);
      // Wer traegt, zeigt, wie viel - nach der Schubkarre 13 statt 10 (bauen AC-44).
      const tragkraft = this.einheitenwert(besitzer, art, 'tragkraft');
      if (tragkraft) tafel[art].tragkraft = tragkraft;
      // Was sie ihn kostet, wenn sein Haus den Preis aendert (einheiten AC-44).
      const kosten = this.auftragKosten(besitzer, art);
      if (kosten !== EINHEITEN[art].kosten) tafel[art].kosten = kosten;
      // Der Zuschlag je Klasse des Ziels, wenn eine Verbesserung ihn aendert
      // (bauen AC-54, AC-56) - die Leiste zeigt den des Besitzers.
      const bonus = this.bonusVon(besitzer, art);
      if (bonus !== (EINHEITEN[art].bonus || OHNE_BONUS)) tafel[art].bonus = bonus;
      // Wie sie bei diesem Spieler heisst, wenn eine Verbesserung sie hebt
      // (einheiten AC-69): sein Kriegswolf ist danach ein Elite-Kriegswolf.
      for (const w of this.wirkungen(besitzer)) if (w.nennt?.[art]) tafel[art].name = w.nennt[art];
      // Reichweite und Ruhe des Bekehrens (bauen AC-55).
      if (EINHEITEN[art].bekehren) {
        tafel[art].bekehren = { reichweite: this.bekehrwert(besitzer, art, 'reichweite'), ruhe: this.bekehrwert(besitzer, art, 'ruhe') };
      }
    }
    // Die Gebaeude in derselben Tafel (bauen AC-34): der Lebensbalken braucht
    // das volle Leben nach dem Mauerwerk. Die Namen von Einheiten und
    // Gebaeuden ueberschneiden sich nicht - darauf achtet ein Test.
    for (const art of Object.keys(GEBAEUDE)) {
      tafel[art] = {};
      for (const feld of GEBAEUDEFELDER) tafel[art][feld] = this.gebaeudewert(besitzer, art, feld);
      // Wie es bei diesem Spieler heisst, wenn eine Verbesserung es umbenennt
      // (bauen AC-38): sein Wachturm ist nach der Forschung ein Wehrturm.
      // Und mit welchem Bild es dann steht: der Wehrturm ist hoeher und hat ein Dach.
      for (const w of this.wirkungen(besitzer)) {
        if (w.nennt?.[art]) tafel[art].name = w.nennt[art];
        if (w.bild?.[art]) tafel[art].bild = w.bild[art];
      }
      // Was eine neue Farm traegt, mit Haus und Verbesserungen (bauen AC-26,
      // spielziel AC-17) - sonst rechnete der Browser es selbst und kennte
      // das Haus nicht (Durchsicht Runde 167).
      if (GEBAEUDE[art].nahrung) tafel[art].nahrung = this.farmNahrung(besitzer);
    }
    return tafel;
  }

  /**
   * Die Sammelrate eines Spielers an einem Rohstoff (bauen AC-26). Die
   * Doppelaxt ist ein Faktor, kein Zuschlag - "+20 % Holz" der Vorlage.
   */
  sammelrate(besitzer, rohstoff, grundrate) {
    let faktor = 1;
    for (const w of this.wirkungen(besitzer)) faktor *= w.sammeln?.[rohstoff] || 1;
    return grundrate * faktor;
  }

  // Wie viel Nahrung eine neue Farm dieses Spielers traegt (bauen AC-26).
  farmNahrung(besitzer) {
    let nahrung = GEBAEUDE.farm.nahrung;
    for (const w of this.wirkungen(besitzer)) nahrung += w.farm?.nahrung || 0;
    return nahrung;
  }

  /**
   * Wie viel einer tragen kann, bevor er zum Lager geht (bauen AC-44):
   * Schubkarre und Handkarren legen darauf. Gelesen wie jeder Wert ueber
   * `einheitenwert()` - die Tabelle allein kennt die Verbesserungen nicht.
   */
  tragkraft(einheit) {
    return this.einheitenwert(einheit.besitzer, einheit.art, 'tragkraft');
  }

  einheitAnlegen(besitzer, x, y, art = 'dorfbewohner') {
    const werte = { ...EINHEITEN[art], leben: this.lebenMax(besitzer, art) };
    const einheit = {
      id: this.naechsteId++,
      art,
      besitzer,
      x,
      y,
      leben: werte.leben,
      weg: [],
      auftrag: null, // { art: 'gehen' | 'sammeln', feld }
      angriffslauf: null, // Marschziel, solange ein Angriffslauf laeuft (kampf AC-4)
      wegpunkte: [], // die naechsten Ziele eines Gangs, mit Umschalt angehaengt (bedienung AC-14)
      angriffe: [], // die naechsten Angriffsziele, mit Umschalt angehaengt (bedienung AC-50)
      ladung: 0,
      ladungsart: null,
      sammelt: false, // steht am Vorrat und arbeitet
      baut: false, // steht an einer Baustelle und arbeitet
      angefangen: 0, // Bruchteil der naechsten Einheit Rohstoff
      /** @type {number | null} */
      schlagTakt: null, // der Takt ihres letzten Schlags oder Schusses (bedienung AC-72)
      fallrichtung: null, // gefallen: die Richtung zu dem, der sie traf, als Achtel (bedienung AC-76)
      taktX: x, // die Lage zu Beginn des laufenden Takts, fuer die Reichweite (kampf AC-26)
      reihe: 0, // der Platz in der Reihenfolge des laufenden Takts (kampf AC-26)
      taktY: y,
      /** @type {Set<object> | null} */
      entdeckt: null, // getarnt: die Sichten, die sie entdeckt haben (kampf AC-22)
    };
    this.einheiten.set(einheit.id, einheit);
    return einheit;
  }

  // x, y ist das Ankerfeld; die Grundflaeche reicht von x - groesse/2 (abgerundet)
  // ueber groesse Felder (grundflaeche). Fertig steht ein Gebaeude nur zu Beginn
  // da - alles andere ist erst eine Baustelle (bauen AC-1).
  // `quer`: ein langes Gebaeude (das Tor, bauen AC-37) liegt laengs y statt
  // laengs x. Nur dort steht das Feld am Gebaeude.
  gebaeudeAnlegen(besitzer, art, x, y, fertig = true, quer = false) {
    const gebaeude = {
      id: this.naechsteId++,
      art,
      besitzer,
      x,
      y,
      ...(GEBAEUDE[art].laenge && quer ? { quer: true } : {}),
      fertig,
      bau: fertig ? 1 : 0, // Anteil der Bauarbeit
      // Eine Baustelle beginnt mit einem Leben und waechst mit dem Bau
      // (bauen AC-7, `bauleben`).
      leben: fertig ? this.gebaeudewert(besitzer, art, 'leben') : this.bauleben(besitzer, art, 0),
      // Eine Farm traegt Nahrung, und nur einer arbeitet darauf (einheiten AC-18).
      ...(GEBAEUDE[art].nahrung ? { nahrung: this.farmNahrung(besitzer), arbeiter: null } : {}),
      schlange: [], // Arten der bezahlten Auftraege, der erste laeuft
      fortschritt: 0, // Takte am laufenden Auftrag, mit dem Tempo der Ausbildung (spielziel AC-25)
      wartet: false, // Bevoelkerung voll (bauen AC-15)
    };
    this.gebaeude.set(gebaeude.id, gebaeude);
    // Wem es gehoert, bleibt bekannt, auch wenn es faellt - der Auszug je
    // Spieler schickt das Verschwinden eigener Gebaeude immer (kampf AC-13).
    this.gebaeudeBesitzer.set(gebaeude.id, besitzer);
    this.gebaeudeSichtNeu = true;
    this.belegen(gebaeude);
    this.gebaeudeGeaendert(gebaeude);
    return gebaeude;
  }

  // Die eine Stelle, die weiss, welche Felder ein Gebaeude belegt. Fast alle
  // sind Quadrate aus `groesse`; ein langes (das Tor, bauen AC-37) hat
  // `laenge` Felder laengs x - oder laengs y, wenn es `quer` liegt - und ist
  // `groesse` tief.
  grundflaeche(art, x, y, quer = false) {
    const tief = GEBAEUDE[art].groesse;
    const lang = GEBAEUDE[art].laenge || tief;
    const bx = quer ? tief : lang;
    const by = quer ? lang : tief;
    const x0 = x - Math.floor(bx / 2);
    const y0 = y - Math.floor(by / 2);
    return { x0, y0, x1: x0 + bx - 1, y1: y0 + by - 1 };
  }

  // Taugt der Platz? Alle Felder auf der Karte, Gras, kein Tier darauf
  // (bauen AC-3). Einheiten stehen nicht im Weg - sie gehen beiseite.
  // `ausser`: die Gebaeude, die der Neubau ersetzt (ein Tor auf der Mauer,
  // bauen AC-31) - ihr Platz zaehlt als frei. `quer`: siehe `grundflaeche`.
  platzPruefen(art, x, y, ausser = null, quer = false) {
    if (!GEBAEUDE[art] || !Number.isInteger(x) || !Number.isInteger(y)) return false;
    const { x0, y0, x1, y1 } = this.grundflaeche(art, x, y, quer);
    const alte = (ausser || []).map((a) => this.grundflaeche(a.art, a.x, a.y, a.quer));
    for (let fy = y0; fy <= y1; fy++) {
      for (let fx = x0; fx <= x1; fx++) {
        if (alte.some((alt) => fx >= alt.x0 && fx <= alt.x1 && fy >= alt.y0 && fy <= alt.y1)) continue;
        if (!karten.begehbar(this.karte, fx, fy)) return false;
      }
    }
    for (const tier of this.tiere.values()) {
      const tx = Math.round(tier.x);
      const ty = Math.round(tier.y);
      if (tx >= x0 && tx <= x1 && ty >= y0 && ty <= y1) return false;
    }
    // Auf einem Ei am Boden baut niemand (einheiten AC-51): darunter liesse
    // es sich nicht mehr anklicken.
    for (const ei of this.eier?.values() || []) {
      if (this.eiAmBoden(ei) && ei.x >= x0 && ei.x <= x1 && ei.y >= y0 && ei.y <= y1) return false;
    }
    // Begehbare Gebaeude (Farmen) belegen kein Feld der Karte - sie werden hier
    // eigens ausgeschlossen, damit niemand ueber sie baut.
    for (const gebaeude of this.gebaeude.values()) {
      if (ausser && ausser.includes(gebaeude)) continue;
      const g = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y, gebaeude.quer);
      if (g.x0 <= x1 && g.x1 >= x0 && g.y0 <= y1 && g.y1 >= y0) return false;
    }
    return true;
  }

  /**
   * Die eigenen Gebaeude, die ein Neubau an dieser Stelle ersetzt - ein Tor
   * auf der eigenen Mauer (bauen AC-31, AC-37): jedes Mauerfeld, das ganz
   * unter seiner Grundflaeche liegt. Eine Liste, leer, wenn dort keines steht
   * oder die Art nichts ersetzt.
   */
  ersetzbar(spielerId, art, x, y, quer = false) {
    const ersetzt = GEBAEUDE[art]?.ersetzt;
    if (!ersetzt) return [];
    const { x0, y0, x1, y1 } = this.grundflaeche(art, x, y, quer);
    const alte = [];
    for (const alt of this.gebaeude.values()) {
      if (alt.besitzer !== spielerId || alt.art !== ersetzt) continue;
      const g = this.grundflaeche(alt.art, alt.x, alt.y, alt.quer);
      if (g.x0 >= x0 && g.x1 <= x1 && g.y0 >= y0 && g.y1 <= y1) alte.push(alt);
    }
    return alte;
  }

  /**
   * Wie ein langes Gebaeude liegt, wenn der Auftrag es nicht sagt (bauen
   * AC-37): laengs der eigenen Mauer, die es ersetzt - quer, wenn unter der
   * queren Grundflaeche mehr davon steht als unter der laengsen. Sonst
   * laengs x.
   */
  lageRaten(spielerId, art, x, y) {
    if (!GEBAEUDE[art]?.laenge) return false;
    return this.ersetzbar(spielerId, art, x, y, true).length > this.ersetzbar(spielerId, art, x, y, false).length;
  }

  /**
   * Die Tore, durch die ein Spieler gehen darf, als Feldnummern (bauen AC-31):
   * seine eigenen und die seiner Verbuendeten (spielziel AC-14).
   */
  toreVon(besitzer) {
    if (!this.tore) return null;
    if (!this.mitTeams) {
      const tore = this.tore.get(besitzer);
      return tore && tore.size ? tore : null;
    }
    // Ein Satz allein geht unveraendert zurueck; erst ein zweiter braucht
    // einen neuen, sonst stuenden fremde Tore in der eigenen Liste.
    let offen = null;
    let neu = false;
    for (const [wer, tore] of this.tore) {
      if (!tore.size || this.feindlich(besitzer, wer)) continue;
      if (!offen) {
        offen = tore;
        continue;
      }
      if (!neu) {
        offen = new Set(offen);
        neu = true;
      }
      for (const f of tore) offen.add(f);
    }
    return offen;
  }

  // Die Grundflaeche wird unbegehbar; wer darauf steht, geht zum naechsten
  // freien Feld daneben.
  belegen(gebaeude) {
    if (GEBAEUDE[gebaeude.art].begehbar) return;
    const g = this.karte.groesse;
    const { x0, y0, x1, y1 } = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y, gebaeude.quer);
    // Die Felder an den Enden eines langen Tors sind seine Tuerme (bauen
    // AC-37): begehbar ist nur die Durchfahrt dazwischen.
    const pfeiler = GEBAEUDE[gebaeude.art].pfeiler || 0;
    const durchfahrt = (fx, fy) => {
      const [stelle, lang] = gebaeude.quer ? [fy - y0, y1 - y0 + 1] : [fx - x0, x1 - x0 + 1];
      return stelle >= pfeiler && stelle < lang - pfeiler;
    };
    for (let fy = Math.max(0, y0); fy <= Math.min(g - 1, y1); fy++) {
      for (let fx = Math.max(0, x0); fx <= Math.min(g - 1, x1); fx++) {
        const i = fy * g + fx;
        this.karte.felder[i] = karten.BEBAUT;
        this.karte.vorrat.delete(i);
        this.feldAenderungen.push({ i, a: karten.BEBAUT });
        // Fuer den Besitzer bleibt ein Tor begehbar (bauen AC-31) - auf der
        // Karte ist es bebaut, die Wegsuche bekommt es eigens.
        if (GEBAEUDE[gebaeude.art].tor && durchfahrt(fx, fy)) {
          this.tore ??= new Map();
          if (!this.tore.has(gebaeude.besitzer)) this.tore.set(gebaeude.besitzer, new Set());
          this.tore.get(gebaeude.besitzer).add(i);
        }
      }
    }
    for (const einheit of this.einheiten.values()) {
      if (!this.aufGrundflaeche(einheit, gebaeude)) continue;
      const frei = this.randfeld(gebaeude, einheit);
      if (!frei) continue;
      einheit.x = frei.x;
      einheit.y = frei.y;
      einheit.weg = [];
    }
    // Wer unterwegs ist und dessen Weg ueber die neue Grundflaeche fuehrt, sucht
    // neu - sonst lief er durch das Gebaeude (bauen AC-3, vom Pruefstand
    // gefunden: Startwert 1, Takt 1015).
    //
    // Auch wer **schraeg an einer Ecke** vorbeigeht, sucht neu: auf halbem Weg
    // rundet seine Lage auf eines der beiden geraden Nachbarfelder, und liegt
    // das jetzt in der Grundflaeche, steht er im Gebaeude. Als der Weg
    // berechnet wurde, war die Ecke frei (Pruefstand, Startwert 3, Takt 52113:
    // ein Plaenkler im eben begonnenen Stall des Gegners - Runde 92).
    // Gerundet: der letzte Schritt eines Sammlers ist ein Platz im Feld, kein
    // Feld (einheiten AC-30) - ungerundet lag ein Platz am Rand der
    // Grundflaeche knapp draussen, und er ging in die Baustelle (Pruefstand,
    // Startwert 5, Takt 2578).
    const drin = (p) => {
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      return x >= x0 && x <= x1 && y >= y0 && y <= y1;
    };
    const feldVon = (p) => ({ x: Math.round(p.x), y: Math.round(p.y) });
    const ecke = (von, nach) => {
      const a = feldVon(von);
      const b = feldVon(nach);
      return a.x !== b.x && a.y !== b.y && (drin({ x: a.x, y: b.y }) || drin({ x: b.x, y: a.y }));
    };
    for (const einheit of this.einheiten.values()) {
      if (!einheit.weg.length) continue;
      const schritte = [{ x: Math.round(einheit.x), y: Math.round(einheit.y) }, ...einheit.weg];
      let betroffen = einheit.weg.some(drin);
      for (let i = 1; i < schritte.length && !betroffen; i++) betroffen = ecke(schritte[i - 1], schritte[i]);
      if (!betroffen) continue;
      // Das Ziel ist ein Feld - auch wenn der Weg auf einem Platz darin
      // endet (einheiten AC-30).
      einheit.weg = this.wegZumPlatz(einheit, einheit.weg[einheit.weg.length - 1]);
    }
  }

  freigeben(gebaeude) {
    if (GEBAEUDE[gebaeude.art].begehbar) return;
    const g = this.karte.groesse;
    const { x0, y0, x1, y1 } = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y, gebaeude.quer);
    for (let fy = y0; fy <= y1; fy++) {
      for (let fx = x0; fx <= x1; fx++) {
        const i = fy * g + fx;
        this.karte.felder[i] = karten.GRAS;
        this.feldAenderungen.push({ i, a: karten.GRAS });
        if (GEBAEUDE[gebaeude.art].tor) this.tore?.get(gebaeude.besitzer)?.delete(i);
      }
    }
    // Wer eine Mauer angreift, prueft danach, ob sein Ziel jetzt offen liegt
    // (kampf AC-21) - nur wenn wirklich eine Mauer oder ein Tor fiel.
    if (GEBAEUDE[gebaeude.art].gezogen || GEBAEUDE[gebaeude.art].tor) this.mauernGefallen = (this.mauernGefallen || 0) + 1;
  }

  aufGrundflaeche(einheit, gebaeude) {
    const { x0, y0, x1, y1 } = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y, gebaeude.quer);
    const ex = Math.round(einheit.x);
    const ey = Math.round(einheit.y);
    return ex >= x0 && ex <= x1 && ey >= y0 && ey <= y1;
  }

  // Abstand in Feldern von einer Einheit zum Rand der Grundflaeche.
  abstandZu(einheit, gebaeude) {
    const { x0, y0, x1, y1 } = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y, gebaeude.quer);
    const dx = Math.max(x0 - einheit.x, 0, einheit.x - x1);
    const dy = Math.max(y0 - einheit.y, 0, einheit.y - y1);
    return Math.max(dx, dy);
  }

  // Das begehbare Feld rund um die Grundflaeche, das `von` am naechsten liegt.
  randfeld(gebaeude, von) {
    const { x0, y0, x1, y1 } = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y, gebaeude.quer);
    let bestes = null;
    let besterAbstand = Infinity;
    for (let r = 1; r <= 3 && !bestes; r++) {
      for (let fy = y0 - r; fy <= y1 + r; fy++) {
        for (let fx = x0 - r; fx <= x1 + r; fx++) {
          if (fx > x0 - r && fx < x1 + r && fy > y0 - r && fy < y1 + r) continue;
          if (!karten.begehbar(this.karte, fx, fy)) continue;
          const abstand = Math.hypot(fx - von.x, fy - von.y);
          if (abstand < besterAbstand) {
            besterAbstand = abstand;
            bestes = { x: fx, y: fy };
          }
        }
      }
    }
    return bestes;
  }

  gebaeudeAn(x, y) {
    for (const gebaeude of this.gebaeude.values()) {
      const { x0, y0, x1, y1 } = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y, gebaeude.quer);
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return gebaeude;
    }
    return null;
  }

  // Ein Bauauftrag: der Platz wird geprueft, die Kosten gehen sofort ab
  // (bauen AC-5), die Baustelle entsteht, die Dorfbewohner gehen hin (AC-1).
  // `quer`: wie ein langes Gebaeude liegt (bauen AC-37) - true laengs y,
  // false laengs x; ohne Angabe laengs der eigenen Mauer darunter.
  bauen(spielerId, einheitIds, art, ziel, anhaengen = false, quer = undefined) {
    if (!Array.isArray(einheitIds) || !ziel || !GEBAEUDE[art]) return { fehler: 'Das lässt sich nicht bauen.' };
    const bauer = einheitIds.slice(0, 200)
      .map((id) => this.einheiten.get(id))
      .filter((e) => e && e.besitzer === spielerId && (EINHEITEN[e.art].baut || []).includes(art));
    if (!bauer.length) return { fehler: 'Niemand in der Auswahl kann das bauen.' };
    const spieler = this.spielerVon(spielerId);
    // Erst das Zeitalter, dann der Platz (bauen AC-24).
    const noetig = this.gebaeudeZeitalter(art);
    if (noetig > spieler.zeitalter) {
      return { fehler: `${GEBAEUDE_NAMEN[art] || art} gibt es erst ${ZEITALTER[noetig].ab}.` };
    }
    // Hoechstens so viele je Spieler (bauen AC-51) - die Baustelle zaehlt mit.
    const grenze = GEBAEUDE[art].hoechstens;
    if (grenze && [...this.gebaeude.values()].filter((g) => g.besitzer === spielerId && g.art === art).length >= grenze) {
      return { fehler: `${GEBAEUDE_NAMEN[art] || art} gibt es nur ${grenze === 1 ? 'einmal' : `${grenze}-mal`} je Spieler.` };
    }
    const x = Math.round(Number(ziel.x));
    const y = Math.round(Number(ziel.y));
    // Ein Tor auf der eigenen Mauer ersetzt ihre Felder dort (bauen AC-31).
    const liegtQuer = Boolean(GEBAEUDE[art].laenge) && (typeof quer === 'boolean' ? quer : this.lageRaten(spielerId, art, x, y));
    const alte = this.ersetzbar(spielerId, art, x, y, liegtQuer);
    if (!this.platzPruefen(art, x, y, alte, liegtQuer)) return { fehler: 'Hier ist kein Platz.' };
    const kosten = GEBAEUDE[art].kosten;
    for (const [rohstoff, menge] of Object.entries(kosten)) {
      if (spieler[rohstoff] < menge) return { fehler: `Zu wenig ${ROHSTOFF_NAMEN[rohstoff]}.` };
    }
    for (const [rohstoff, menge] of Object.entries(kosten)) spieler[rohstoff] -= menge;
    // Die Mauerfelder verschwinden ohne Erstattung, wie in der Vorlage; wer
    // daran baute, geht zum naechsten Feld seiner Mauer (welt.bauenWeiter).
    // Ersetzt, nicht eingestuerzt: keine Truemmer unter dem neuen Tor.
    for (const alt of alte) this.gebaeudeZerstoeren(alt, false);
    const baustelle = this.gebaeudeAnlegen(spielerId, art, x, y, false, liegtQuer);
    for (const einheit of bauer) {
      // Mit Umschalt (bedienung AC-48): wer schon baut, baut das danach -
      // hinten an seine Reihe, wie die Felder einer Mauer. Eine eigene Grenze
      // braucht sie nicht, jede Baustelle ist schon bezahlt.
      if (anhaengen && einheit.auftrag?.art === 'bauen') {
        einheit.auftrag.folge = [...(einheit.auftrag.folge || []), baustelle.id];
      } else {
        this.bauenBeginnen(einheit, baustelle);
      }
    }
    return { gebaeude: baustelle.id };
  }

  /**
   * Eine Mauer ziehen (bauen AC-30): von `von` nach `bis` eine Linie aus
   * Baustellen, ein Feld je Baustelle, bezahlt je Feld. Was nicht frei ist,
   * wird uebersprungen; reicht der Vorrat nicht, endet die Linie dort. Die
   * Bauleute gehen in der Reihenfolge der Linie von Feld zu Feld.
   */
  mauerZiehen(spielerId, einheitIds, art, von, bis) {
    if (!Array.isArray(einheitIds) || !von || !bis || !GEBAEUDE[art]?.gezogen) return { fehler: 'Das lässt sich nicht ziehen.' };
    const bauer = einheitIds.slice(0, 200)
      .map((id) => this.einheiten.get(id))
      .filter((e) => e && e.besitzer === spielerId && (EINHEITEN[e.art].baut || []).includes(art));
    if (!bauer.length) return { fehler: 'Niemand in der Auswahl kann das bauen.' };
    const spieler = this.spielerVon(spielerId);
    const noetig = this.gebaeudeZeitalter(art);
    if (noetig > spieler.zeitalter) {
      return { fehler: `${GEBAEUDE_NAMEN[art] || art} gibt es erst ${ZEITALTER[noetig].ab}.` };
    }
    const felder = mauerLinie(von, bis);
    if (!felder) return { fehler: 'Das lässt sich nicht ziehen.' };
    const kosten = GEBAEUDE[art].kosten;
    const bezahlbar = () => Object.entries(kosten).every(([rohstoff, menge]) => spieler[rohstoff] >= menge);
    const baustellen = [];
    let uebersprungen = 0;
    let zuWenig = false;
    for (const feld of felder) {
      if (!this.platzPruefen(art, feld.x, feld.y)) {
        uebersprungen += 1;
        continue;
      }
      if (!bezahlbar()) {
        zuWenig = true;
        break;
      }
      for (const [rohstoff, menge] of Object.entries(kosten)) spieler[rohstoff] -= menge;
      baustellen.push(this.gebaeudeAnlegen(spielerId, art, feld.x, feld.y, false));
    }
    if (!baustellen.length) {
      const rohstoff = Object.keys(kosten).find((r) => spieler[r] < kosten[r]);
      return { fehler: zuWenig ? `Zu wenig ${ROHSTOFF_NAMEN[rohstoff]}.` : 'Hier ist kein Platz.' };
    }
    const folge = baustellen.map((b) => b.id);
    for (const einheit of bauer) this.bauenBeginnen(einheit, baustellen[0], folge.slice(1));
    return { gebaeude: folge, uebersprungen, zuWenig };
  }

  /**
   * Eine gezogene Mauer weiterbauen (bauen AC-30): zum naechsten Feld der
   * Folge, das noch steht, nicht fertig ist und dem Bauer gehoert. Gilt, wenn
   * das laufende Feld fertig wird, abgerissen oder zerstoert ist oder nicht zu
   * erreichen - sonst blieben die uebrigen bezahlten Felder liegen
   * (Durchsicht in Runde 127). Ohne Folge endet der Auftrag; zurueck kommt,
   * ob es weitergeht.
   */
  bauenWeiter(einheit) {
    const folge = einheit.auftrag?.folge || [];
    einheit.baut = false;
    einheit.auftrag = null;
    const weiter = folge.findIndex((id) => {
      const naechste = this.gebaeude.get(id);
      return naechste && !naechste.fertig && naechste.besitzer === einheit.besitzer;
    });
    if (weiter < 0) return false;
    this.bauenBeginnen(einheit, this.gebaeude.get(folge[weiter]), folge.slice(weiter + 1));
    return true;
  }

  bauenBeginnen(einheit, baustelle, folge = []) {
    this.farmVerlassen(einheit);
    einheit.sammelt = false;
    einheit.baut = false;
    // `folge`: die naechsten Baustellen einer gezogenen Mauer (bauen AC-30).
    einheit.auftrag = { art: 'bauen', gebaeude: baustelle.id, ...(folge.length ? { folge } : {}) };
    einheit.weg = this.wegZurBaustelle(einheit, baustelle);
  }

  /**
   * Der Weg an den Rand einer Baustelle. Das naechste Randfeld genuegt nicht:
   * an einer Mauer liegt es oft auf der anderen Seite, ohne Weg dorthin - ein
   * Tor in einem Mauerring baute so niemand (Runde 128). Ist das naechste
   * nicht erreichbar, kommen die naechsten vier Randfelder dran, wie bei der
   * KI (eine vergebliche Suche durchflutet das ganze erreichbare Gebiet).
   * Leer heisst: kein Weg, oder schon am Platz.
   */
  wegZurBaustelle(einheit, baustelle) {
    const von = this.feldVon(einheit);
    const stand = this.randfeld(baustelle, einheit);
    if (!stand) return [];
    const weg = this.wegNach(einheit, stand);
    if (weg.length || (von.x === stand.x && von.y === stand.y)) return weg;
    for (const feld of this.randfelder(baustelle, einheit).slice(0, 4)) {
      if (feld.x === stand.x && feld.y === stand.y) continue;
      const anders = this.wegNach(einheit, feld);
      if (anders.length || (von.x === feld.x && von.y === feld.y)) return anders;
    }
    return [];
  }

  // Ein Weg zu einem Feld. Steht die Einheit schon auf dem Feld, aber nicht in
  // seiner Mitte, geht sie den Rest - die Suche allein lieferte dann keinen
  // Weg, und ein Bauer gab 0,04 Felder vor dem Ziel auf (Pruefstand, Runde 44).
  wegNach(einheit, ziel) {
    // Wer fliegt, sucht keinen Weg (einheiten AC-52): geradeaus, ueber
    // Mauern, Wald und Wasser.
    if (EINHEITEN[einheit.art].fliegt) {
      return einheit.x === ziel.x && einheit.y === ziel.y ? [] : [{ x: ziel.x, y: ziel.y }];
    }
    const feld = this.feldVon(einheit);
    if (feld.x === ziel.x && feld.y === ziel.y) {
      return einheit.x === ziel.x && einheit.y === ziel.y ? [] : [{ x: ziel.x, y: ziel.y }];
    }
    return suchen(this.karte, feld, ziel, this.toreVon(einheit.besitzer));
  }

  // Eine Baustelle abreissen: erstattet wird, was noch nicht verbaut ist
  // (bauen AC-6).
  abreissen(spielerId, gebaeudeId) {
    const gebaeude = this.gebaeude.get(gebaeudeId);
    if (!gebaeude || gebaeude.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebäude.' };
    if (gebaeude.fertig) return { fehler: 'Nur Baustellen lassen sich abreissen.' };
    const spieler = this.spielerVon(spielerId);
    for (const [rohstoff, menge] of Object.entries(GEBAEUDE[gebaeude.art].kosten)) {
      spieler[rohstoff] += Math.floor(menge * (1 - gebaeude.bau));
    }
    this.freigeben(gebaeude);
    this.gebaeude.delete(gebaeude.id);
    this.gebaeudeSichtNeu = true;
    this.gebaeudeGeaendert(gebaeude);
    for (const einheit of this.einheiten.values()) {
      if (einheit.auftrag?.art === 'bauen' && einheit.auftrag.gebaeude === gebaeude.id) this.bauenWeiter(einheit);
    }
    return {};
  }

  // Wer an einer Baustelle arbeitet, baut sie mit (bauen AC-2):
  // n Bauleute brauchen 3 t / (n + 2).
  baustelleTakten(gebaeude) {
    let bauleute = 0;
    for (const einheit of this.einheiten.values()) {
      if (einheit.baut && einheit.auftrag?.gebaeude === gebaeude.id) bauleute++;
    }
    if (!bauleute) return;
    const vorher = gebaeude.bau;
    // Mit dem Tretkran ein Fuenftel schneller (bauen AC-56).
    const tempo = this.bautempo(gebaeude.besitzer);
    gebaeude.bau = Math.min(1, gebaeude.bau + ((bauleute + 2) * tempo) / (3 * GEBAEUDE[gebaeude.art].bauzeit * TAKTE_PRO_SEKUNDE));
    // Ein Hauch Rechenspiel: 1 - 1e-9 zaehlt als fertig, sonst fehlt der
    // letzte Takt wegen der Rundung.
    if (gebaeude.bau >= 1 - 1e-9) gebaeude.bau = 1;
    // Das Leben waechst um das, was der Bau dazugibt - erlittener Schaden
    // bleibt abgezogen (bauen AC-7).
    gebaeude.leben += this.bauleben(gebaeude.besitzer, gebaeude.art, gebaeude.bau)
      - this.bauleben(gebaeude.besitzer, gebaeude.art, vorher);
    this.gebaeudeGeaendert(gebaeude);
    if (gebaeude.bau < 1) return;
    gebaeude.fertig = true;
    // Ab jetzt sieht es (kampf AC-24).
    this.gebaeudeSichtNeu = true;
    this.nachDemBau(gebaeude);
  }

  /**
   * Das Leben, das ein Bau bei diesem Anteil hat, ohne Schaden: der Anteil
   * am vollen Leben, wenigstens eines (bauen AC-7). Eine eben gesetzte
   * Baustelle faellt mit dem ersten Schlag, wie im Original; fertig traegt
   * sie das volle Leben aus `gebaeudewert`.
   */
  bauleben(besitzer, art, bau) {
    return Math.max(1, Math.round(this.gebaeudewert(besitzer, art, 'leben') * bau));
  }

  // Nach einem Lager oder einer Muehle sammeln die Bauleute am naechsten
  // passenden Vorrat (bauen AC-1); nach einem Haus stehen sie bereit.
  nachDemBau(gebaeude) {
    const annahme = GEBAEUDE[gebaeude.art].annahme;
    const arten = new Set(Object.entries(SAMMELN)
      .filter(([, s]) => annahme.includes(s.rohstoff))
      .map(([art]) => Number(art)));
    for (const einheit of this.einheiten.values()) {
      if (einheit.auftrag?.art !== 'bauen' || einheit.auftrag.gebaeude !== gebaeude.id) continue;
      if (this.bauenWeiter(einheit)) continue;
      // Nach einer Farm bestellt der erste Bauer sie gleich (bauen AC-1).
      if (GEBAEUDE[gebaeude.art].nahrung && !gebaeude.arbeiter) {
        this.farmBeginnen(einheit, gebaeude);
        continue;
      }
      const feld = arten.size && gebaeude.art !== 'dorfzentrum' ? this.naechsterVorratAus(einheit, arten) : null;
      if (feld) {
        einheit.auftrag = { art: 'sammeln', feld };
        this.wegZumVorrat(einheit);
        continue;
      }
      // Wer sonst nur bereitstuende, baut an der naechsten eigenen Baustelle
      // in der Naehe weiter (bauen AC-36): zwei Haeuser nebeneinander gesetzt
      // sind ein Auftrag, nicht zwei.
      const naechste = this.baustelleNahe(einheit);
      if (naechste) this.bauenBeginnen(einheit, naechste);
    }
  }

  /**
   * Die naechste eigene Baustelle, die diese Einheit bauen kann, hoechstens
   * BAU_NAEHE Felder entfernt (bauen AC-36). Bei gleichem Abstand die
   * aeltere - die Simulation bleibt deterministisch.
   */
  baustelleNahe(einheit) {
    const kann = EINHEITEN[einheit.art].baut || [];
    let beste = null;
    let abstand = BAU_NAEHE + 1e-9;
    for (const gebaeude of this.gebaeude.values()) {
      if (gebaeude.fertig || gebaeude.besitzer !== einheit.besitzer || !kann.includes(gebaeude.art)) continue;
      const d = Math.hypot(gebaeude.x - einheit.x, gebaeude.y - einheit.y);
      if (d < abstand) {
        abstand = d;
        beste = gebaeude;
      }
    }
    return beste;
  }

  /**
   * Ob diese Einheit dieses Gebaeude reparieren kann (bauen AC-45): sie baut
   * ueberhaupt etwas, das Gebaeude ist fertig, gehoert keinem Gegner und hat
   * Leben verloren. Eine Baustelle wird gebaut, nicht repariert - und eine
   * Farm auch nicht: der Rechtsklick auf sie bestellt sie (einheiten AC-18).
   */
  kannReparieren(einheit, gebaeude) {
    if (!gebaeude || !gebaeude.fertig || einheit.tot) return false;
    if (GEBAEUDE[gebaeude.art].nahrung) return false;
    if (!(EINHEITEN[einheit.art].baut || []).length) return false;
    if (this.feindlich(einheit.besitzer, gebaeude.besitzer)) return false;
    return gebaeude.leben < this.gebaeudewert(gebaeude.besitzer, gebaeude.art, 'leben');
  }

  /**
   * Ob ein Rechtsklick dieser Einheit auf dieses Gebaeude eine Reparatur ist
   * - in der Rangfolge von `befehl`: wer traegt, was das eigene Lager
   * annimmt, laedt zuerst ab (einheiten AC-56).
   */
  repariertHier(einheit, gebaeude) {
    if (!this.kannReparieren(einheit, gebaeude)) return false;
    return !(gebaeude.besitzer === einheit.besitzer && einheit.ladung > 0
      && (GEBAEUDE[gebaeude.art].annahme || []).includes(einheit.ladungsart));
  }

  reparierenBeginnen(einheit, gebaeude) {
    this.farmVerlassen(einheit);
    einheit.sammelt = false;
    einheit.baut = false;
    einheit.auftrag = { art: 'reparieren', gebaeude: gebaeude.id };
    einheit.weg = this.wegZurBaustelle(einheit, gebaeude);
  }

  /**
   * Ein Takt eines Reparierenden, der nicht mehr geht: steht er am Gebaeude,
   * meldet er sich fuer diesen Takt an - gerechnet wird je Gebaeude, nach
   * allen Einheiten (`reparaturenAbrechnen`), denn der zweite am selben
   * Gebaeude schafft weniger als der erste.
   */
  reparierenTakten(einheit) {
    const gebaeude = this.gebaeude.get(einheit.auftrag.gebaeude);
    if (!this.kannReparieren(einheit, gebaeude)) {
      // Fertig, gefallen oder inzwischen beim Gegner.
      einheit.baut = false;
      einheit.auftrag = null;
      return;
    }
    if (this.abstandZu(einheit, gebaeude) <= 1.2) {
      const leute = this.reparaturen.get(gebaeude.id);
      if (leute) leute.push(einheit);
      else this.reparaturen.set(gebaeude.id, [einheit]);
      return;
    }
    // Nicht angekommen und kein Weg mehr: noch einmal suchen, sonst aufgeben.
    einheit.baut = false;
    einheit.weg = this.wegZurBaustelle(einheit, gebaeude);
    if (!einheit.weg.length) einheit.auftrag = null;
  }

  /**
   * Die Reparaturen dieses Takts (bauen AC-45): der erste an einem Gebaeude
   * gibt `REPARATUR.lebenJeSekunde`, jeder weitere den Anteil `weitere`
   * davon. Jeder zahlt, was er selbst repariert - auch am Gebaeude eines
   * Verbuendeten. Wer nicht zahlen kann, steht und wartet (`baut` ist dann
   * falsch, er arbeitet sichtbar nicht).
   */
  reparaturenAbrechnen() {
    if (!this.reparaturen.size) return;
    for (const [id, leute] of this.reparaturen) {
      const gebaeude = this.gebaeude.get(id);
      if (!gebaeude) continue;
      const voll = this.gebaeudewert(gebaeude.besitzer, gebaeude.art, 'leben');
      let rate = REPARATUR.lebenJeSekunde / TAKTE_PRO_SEKUNDE;
      for (const einheit of leute) {
        // Bruchteile eines Lebenspunkts sammeln sich am Gebaeude (`flick`):
        // sein Leben bleibt eine ganze Zahl.
        const offen = voll - gebaeude.leben - (gebaeude.flick || 0);
        const punkte = Math.min(offen, rate);
        rate = REPARATUR.lebenJeSekunde * REPARATUR.weitere / TAKTE_PRO_SEKUNDE;
        if (punkte <= 0) {
          einheit.baut = false;
          continue;
        }
        if (this.reparaturBezahlen(einheit.besitzer, gebaeude.art, punkte / voll)) {
          einheit.baut = false;
          continue;
        }
        einheit.baut = true;
        gebaeude.flick = (gebaeude.flick || 0) + punkte;
      }
      const ganz = Math.floor((gebaeude.flick || 0) + 1e-9);
      if (ganz > 0) {
        gebaeude.leben = Math.min(voll, gebaeude.leben + ganz);
        gebaeude.flick -= ganz;
        this.gebaeudeGeaendert(gebaeude);
      }
      if (gebaeude.leben >= voll) gebaeude.flick = 0;
    }
    this.reparaturen.clear();
  }

  /**
   * Den Anteil `anteil` am vollen Leben eines Gebaeudes bezahlen: derselbe
   * Anteil vom `kostenanteil` des Baupreises. Bruchteile eines Rohstoffs
   * bleiben als Schuld stehen und werden faellig, sobald sie ein Ganzes
   * sind. Zurueck kommt der Rohstoff, der fehlt - dann ist nichts bezahlt -,
   * sonst null.
   */
  reparaturBezahlen(spielerId, art, anteil) {
    const spieler = this.spielerVon(spielerId);
    let schuld = this.reparaturschuld.get(spielerId);
    if (!schuld) {
      schuld = {};
      this.reparaturschuld.set(spielerId, schuld);
    }
    const faellig = [];
    for (const [rohstoff, menge] of Object.entries(GEBAEUDE[art].kosten)) {
      const neu = (schuld[rohstoff] || 0) + menge * REPARATUR.kostenanteil * anteil;
      const ganz = Math.floor(neu + 1e-9);
      if (ganz > spieler[rohstoff]) return rohstoff;
      faellig.push([rohstoff, neu, ganz]);
    }
    for (const [rohstoff, neu, ganz] of faellig) {
      spieler[rohstoff] -= ganz;
      schuld[rohstoff] = neu - ganz;
    }
    return null;
  }

  gebaeudeGeaendert(gebaeude) {
    this.gebaeudeAenderungen.add(gebaeude.id);
  }

  // Alles, was der Browser waehrend der Partie schickt, kommt hier an. Der
  // Server kennt die Arten nicht (ADR-0006).
  nachricht(spielerId, nachricht) {
    switch (nachricht.auftrag) {
      case 'ausbilden':
        return this.ausbilden(spielerId, nachricht.gebaeude, nachricht.einheit);
      case 'abbrechen':
        return this.abbrechen(spielerId, nachricht.gebaeude, nachricht.platz);
      case 'bauen':
        return this.bauen(spielerId, nachricht.einheiten, nachricht.art, nachricht.ziel, Boolean(nachricht.anhaengen),
          typeof nachricht.quer === 'boolean' ? nachricht.quer : undefined);
      case 'mauer':
        return this.mauerZiehen(spielerId, nachricht.einheiten, nachricht.art, nachricht.von, nachricht.bis);
      case 'abreissen':
        return this.abreissen(spielerId, nachricht.gebaeude);
      case 'sammelpunkt':
        return this.sammelpunktSetzen(spielerId, nachricht.gebaeude, nachricht.ziel);
      case 'handeln':
        return this.handeln(spielerId, nachricht.gebaeude, nachricht.ware, nachricht.richtung);
      case 'aufgeben':
        return this.aufgeben(spielerId);
      case 'kuendigen':
        return this.kuendigen(spielerId);
      case 'ansehen':
        return this.ansehen(spielerId, nachricht.feld);
      case 'farmen':
        return this.farmenEinstellen(spielerId, nachricht);
      case 'entlassen':
        return this.entlassen(spielerId, nachricht);
      case 'abruesten':
        return this.abruesten(spielerId, nachricht.einheiten);
      case 'rufen':
        return this.rufen(spielerId, nachricht.gebaeude);
      default:
        return this.befehl(spielerId, nachricht.einheiten, nachricht.ziel, Boolean(nachricht.angriffslauf),
          Boolean(nachricht.anhaengen));
    }
  }

  // Bezahlt wird beim Einreihen (bauen AC-10). Die Absage sagt, warum
  // (bedienung AC-18).
  ausbilden(spielerId, gebaeudeId, art) {
    const gebaeude = this.gebaeude.get(gebaeudeId);
    if (!gebaeude || gebaeude.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebäude.' };
    if (!gebaeude.fertig) return { fehler: 'Das Gebäude ist noch nicht fertig.' };
    // Jede spaetere Stufe einer Einheit zaehlt als ihre erste: die Kaserne
    // bildet die Miliz aus, nach der Verbesserung kommt daraus ein Soldat
    // (einheiten AC-24), nach der naechsten ein Langschwertkaempfer (AC-59).
    const grundstufe = grundstufeVon(art);
    if (!GEBAEUDE[gebaeude.art].bildetAus.includes(grundstufe)) return { fehler: 'Das bildet dieses Gebäude nicht aus.' };
    if (gebaeude.schlange.length >= SCHLANGE_MAX) return { fehler: 'Die Warteschlange ist voll.' };
    const spieler = this.spielerVon(spielerId);
    // Welche Stufe dieser Spieler ausbildet, haengt an seinen Verbesserungen:
    // ohne sie gibt es den Soldaten nicht, mit ihr nur noch ihn.
    const stufe = this.einheitenStufe(spieler, grundstufe);
    // Abgesagt wird nur eine Stufe, die er noch nicht erreicht hat; wer eine
    // fruehere nennt, bekommt die erreichte.
    let voraus = false;
    for (let davor = EINHEITEN[art]?.stufeVon; davor && !voraus; davor = EINHEITEN[davor]?.stufeVon) voraus = davor === stufe;
    if (voraus) {
      const noch = VERBESSERUNGEN[STUFE_DURCH[art]]?.name || art;
      return { fehler: `${EINHEIT_NAMEN[art] || art} gibt es erst mit der Verbesserung „${noch}".` };
    }
    art = stufe;
    // Eine Einheit kann ein spaeteres Zeitalter verlangen als ihr Gebaeude:
    // die Kaserne steht in der Dunklen Zeit, der Speerkaempfer kommt erst mit
    // der Feudalzeit (einheiten AC-23).
    // Dasselbe gilt fuer eine Verbesserung: die Soldatenstufe gibt es erst in
    // der Feudalzeit (einheiten AC-24).
    const noetig = (EINHEITEN[art] || VERBESSERUNGEN[art])?.zeitalter || 0;
    if (noetig > spieler.zeitalter) {
      const wer = EINHEIT_NAMEN[art] || VERBESSERUNGEN[art]?.name || art;
      return { fehler: `${wer} gibt es erst ${ZEITALTER[noetig].ab}.` };
    }
    // Und ein bestimmtes Haus (einheiten AC-42): den Eibenschuetzen bildet
    // nur sein Haus aus.
    if (!this.hausBildetAus(spieler, art)) {
      const wer = (EINHEITEN[art] || VERBESSERUNGEN[art]).haeuser.map((h) => HAEUSER[h]?.name || h).join(' oder ');
      if (!EINHEITEN[art]) return { fehler: `„${VERBESSERUNGEN[art].name}" erforscht nur Haus ${wer}.` };
      return { fehler: `${EINHEIT_NAMEN[art] || art} bildet nur Haus ${wer} aus.` };
    }
    // Der Aufstieg: nur der naechste, nur einmal, und nur mit genug Gebaeuden
    // des laufenden Zeitalters (bauen AC-23).
    if (AUFSTIEGE[art]) {
      const aufstieg = AUFSTIEGE[art];
      // Die Formen mit Artikel stehen in den Daten (bedienung AC-45).
      const ziel = ZEITALTER[aufstieg.stufe];
      if (aufstieg.stufe <= spieler.zeitalter) return { fehler: `${grossAnfang(ziel.artikel)} ist schon erreicht.` };
      if (aufstieg.stufe > spieler.zeitalter + 1) {
        return { fehler: `Erst ${ZEITALTER[spieler.zeitalter + 1].artikel}, dann ${ziel.artikel}.` };
      }
      const laeuft = [...this.gebaeude.values()].some((g) => g.besitzer === spielerId && g.schlange.includes(art));
      if (laeuft) return { fehler: `Der ${aufstieg.titel} läuft schon.` };
      const haben = this.gebaeudeDerZeit(spieler);
      // Ein Gebaeude kann allein genuegen: in die Krone fuehrt auch eine
      // fertige Burg (bauen AC-47).
      const stattdessen = aufstieg.oder
        && [...this.gebaeude.values()].some((g) => g.besitzer === spielerId && g.fertig && g.art === aufstieg.oder.art);
      if (haben < aufstieg.voraussetzung && !stattdessen) {
        const oder = aufstieg.oder ? ` oder ${aufstieg.oder.text}` : '';
        return { fehler: `Erst ${aufstieg.voraussetzung} fertige Gebäude ${ZEITALTER[spieler.zeitalter].genitiv} außer Häusern${oder} — vorhanden: ${haben}.` };
      }
    }
    // Eine Verbesserung kann eine andere voraussetzen: Eisenguss erst nach dem
    // Schmiedeangriff (bauen AC-34). Erforscht muss sie sein, eingereiht
    // reicht nicht - sonst liefe die zweite vor der ersten.
    const vorstufe = VERBESSERUNGEN[art]?.vorstufe;
    if (vorstufe && !spieler.verbesserungen.includes(vorstufe)) {
      return { fehler: `${VERBESSERUNGEN[art].name} gibt es erst nach „${VERBESSERUNGEN[vorstufe].name}".` };
    }
    // Eine Verbesserung gibt es einmal: erforscht oder schon irgendwo eingereiht.
    if (VERBESSERUNGEN[art]) {
      const eingereiht = [...this.gebaeude.values()].some((g) => g.besitzer === spielerId && g.schlange.includes(art));
      if (spieler.verbesserungen.includes(art) || eingereiht) return { fehler: `${VERBESSERUNGEN[art].name} gibt es nur einmal.` };
      // Kartografie (bauen AC-52) nur im Nebel - und nicht, wenn die Karte
      // schon bekannt ist, weil ein Verbuendeter sie erforscht hat.
      if (VERBESSERUNGEN[art].karte && (this.sichtArt !== 'nebel' || this.sichten?.get(spielerId)?.karte)) {
        return { fehler: 'Die Karte ist schon bekannt.' };
      }
    }
    const kosten = this.auftragKosten(spielerId, art);
    for (const [rohstoff, menge] of Object.entries(kosten)) {
      if (spieler[rohstoff] < menge) return { fehler: `Zu wenig ${ROHSTOFF_NAMEN[rohstoff]}.` };
    }
    for (const [rohstoff, menge] of Object.entries(kosten)) spieler[rohstoff] -= menge;
    gebaeude.schlange.push(art);
    this.gebaeudeGeaendert(gebaeude);
    return {};
  }

  // Jeder Auftrag, auch der laufende, erstattet die vollen Kosten (bauen AC-11).
  abbrechen(spielerId, gebaeudeId, platz) {
    const gebaeude = this.gebaeude.get(gebaeudeId);
    if (!gebaeude || gebaeude.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebäude.' };
    if (!Number.isInteger(platz) || platz < 0 || platz >= gebaeude.schlange.length) return { fehler: 'Diesen Auftrag gibt es nicht.' };
    const [art] = gebaeude.schlange.splice(platz, 1);
    const spieler = this.spielerVon(spielerId);
    for (const [rohstoff, menge] of Object.entries(this.auftragKosten(spielerId, art))) spieler[rohstoff] += menge;
    if (platz === 0) {
      gebaeude.fortschritt = 0;
      gebaeude.wartet = false;
    }
    this.gebaeudeGeaendert(gebaeude);
    return {};
  }

  /**
   * Kauf- und Verkaufspreis je Ware fuer diesen Spieler (bauen AC-33), in Gold
   * je `HANDEL.menge`: `{ holz: [kauf, verkauf], ... }`. Gerundet wird hier und
   * nur hier - was die Leiste zeigt, ist, was der Handel bucht.
   */
  handelspreise(spielerId) {
    const spieler = this.spielerVon(spielerId);
    // Ein Haus kann die Gebuehr senken (spielziel AC-26), nie unter null.
    const gebuehr = Math.max(0, HANDEL.gebuehr + this.handelswert(spielerId, 'gebuehr'));
    return Object.fromEntries(Object.keys(HANDEL.waren).map((ware) => {
      const grund = spieler.preise[ware];
      return [ware, [Math.round(grund * (1 + gebuehr)), Math.round(grund * (1 - gebuehr))]];
    }));
  }

  // Die Summe eines Handelsbonus aus Haus und Verbesserungen (spielziel AC-26).
  handelswert(spielerId, feld) {
    let summe = 0;
    for (const w of this.wirkungen(spielerId)) summe += w.handel?.[feld] || 0;
    return summe;
  }

  // Am Markt 100 einer Ware gegen Gold tauschen (bauen AC-33). Jeder Kauf
  // macht die Ware teurer, jeder Verkauf billiger - fuer diesen Spieler.
  handeln(spielerId, gebaeudeId, ware, richtung) {
    const gebaeude = this.gebaeude.get(gebaeudeId);
    if (!gebaeude || gebaeude.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebäude.' };
    if (!GEBAEUDE[gebaeude.art].handel) return { fehler: 'An diesem Gebäude wird nicht gehandelt.' };
    if (!gebaeude.fertig) return { fehler: 'Das Gebäude ist noch nicht fertig.' };
    if (!Object.hasOwn(HANDEL.waren, ware)) return { fehler: 'Diese Ware gibt es am Markt nicht.' };
    if (richtung !== 'kaufen' && richtung !== 'verkaufen') return { fehler: 'Kaufen oder verkaufen?' };
    const spieler = this.spielerVon(spielerId);
    const [kauf, verkauf] = this.handelspreise(spielerId)[ware];
    if (richtung === 'kaufen') {
      if (spieler.gold < kauf) return { fehler: 'Zu wenig Gold.' };
      spieler.gold -= kauf;
      spieler[ware] += HANDEL.menge;
      spieler.preise[ware] += HANDEL.schritt;
    } else {
      if (spieler[ware] < HANDEL.menge) return { fehler: `Zu wenig ${ROHSTOFF_NAMEN[ware]}.` };
      spieler[ware] -= HANDEL.menge;
      spieler.gold += verkauf;
      spieler.preise[ware] = Math.max(HANDEL.tiefst, spieler.preise[ware] - HANDEL.schritt);
    }
    this.preisAenderungen.add(spielerId);
    return {};
  }

  // Boni eines Hauses ab einem Zeitalter (`boniAb` in HAEUSER): mit dem
  // Aufstieg wirken sie wie eine eben erforschte Verbesserung - auf alle
  // Einheiten, die es schon gibt, und auf alle spaeteren. Formen, die an
  // Stehendem nachgetragen werden muessten (Leben der Gebaeude, Nahrung der
  // Farm), schliesst tests/strategie-haeuser.test.mjs aus.
  zeitalterWirkungen(spieler) {
    const neu = spieler.haus ? HAEUSER[spieler.haus].boniAb?.[spieler.zeitalter] : null;
    if (!neu) return;
    this.werteGemerkt.delete(spieler.id);
    this.werteAenderungen.add(spieler.id);
    if (neu.gebaeude) this.gebaeudeSichtNeu = true;
    for (const einheit of this.einheiten.values()) {
      if (einheit.besitzer !== spieler.id) continue;
      for (const schluessel of wirkungsschluessel(einheit.art)) einheit.leben += neu.wirkung?.[schluessel]?.leben || 0;
    }
  }

  // Eine Verbesserung wirkt sofort auf alle, die es schon gibt, und auf alle
  // spaeteren (bauen AC-21).
  erforschen(spieler, art) {
    // Mauerwerk legt auf jedes eigene Gebaeude Leben nach, auch auf die, die
    // schon stehen - der Schaden bleibt stehen (bauen AC-34).
    // Dasselbe, wenn eine Verbesserung einer Gebaeudeart Leben gibt - der
    // Wehrturm (bauen AC-38).
    const lebenVorher = new Map();
    const mehrLeben = (g) => VERBESSERUNGEN[art].gebaeude?.lebenAnteil || VERBESSERUNGEN[art].bauwerk?.[g.art]?.leben;
    for (const g of this.gebaeude.values()) {
      if (g.besitzer === spieler.id && !lebenVorher.has(g.art) && mehrLeben(g)) lebenVorher.set(g.art, this.gebaeudewert(spieler.id, g.art, 'leben'));
    }
    spieler.verbesserungen.push(art);
    for (const g of this.gebaeude.values()) {
      if (g.besitzer !== spieler.id || !lebenVorher.has(g.art)) continue;
      // Auf eine Baustelle nur der Anteil ihres Fortschritts - den Rest legt
      // der Bau selbst nach (bauen AC-7).
      // Gerechnet wie `bauleben`, damit am Ende genau das volle Leben steht.
      const anteil = (voll) => Math.max(1, Math.round(voll * g.bau));
      g.leben += anteil(this.gebaeudewert(spieler.id, g.art, 'leben')) - anteil(lebenVorher.get(g.art));
      this.gebaeudeGeaendert(g);
    }
    // Eine Verbesserung kann die Sicht der Gebaeude aendern (kampf AC-17).
    if (VERBESSERUNGEN[art].gebaeude) this.gebaeudeSichtNeu = true;
    this.werteGemerkt.delete(spieler.id);
    this.werteAenderungen.add(spieler.id);
    // Kartografie (bauen AC-52): die ganze Karte gilt als erkundet - fuer ihn
    // und jeden, mit dem er die Sicht teilt: sie haben dasselbe Sichtobjekt.
    // Gesehen ist damit nichts, was dort steht, schickt der Server weiter
    // erst, wenn ein Auge hinsieht (kampf AC-13).
    const sicht = this.sichten?.get(spieler.id);
    if (VERBESSERUNGEN[art].karte && sicht) {
      sicht.erkundet.fill(1);
      sicht.karte = true;
    }
    const wirkung = VERBESSERUNGEN[art].wirkung;
    for (const einheit of this.einheiten.values()) {
      if (einheit.besitzer !== spieler.id) continue;
      for (const schluessel of wirkungsschluessel(einheit.art)) einheit.leben += wirkung[schluessel]?.leben || 0;
    }
    // Pferdekummet legt auf jede Farm nach, auch auf die, die schon steht
    // (bauen AC-26) - sonst lohnte es sich erst beim naechsten Feld.
    const mehrNahrung = VERBESSERUNGEN[art].farm?.nahrung || 0;
    if (mehrNahrung) {
      for (const g of this.gebaeude.values()) {
        // Eine Brache bleibt leer, bis sie neu ausgesaet ist (bauen AC-41).
        if (g.besitzer !== spieler.id || g.nahrung === undefined || g.brach) continue;
        g.nahrung += mehrNahrung;
        this.gebaeudeGeaendert(g);
      }
    }
    // `wandelt` tauscht die Einheit aus, statt sie aufzuwerten: jede Miliz
    // wird zum Soldaten, ohne neu ausgebildet zu werden - die stehenden, die
    // in den Warteschlangen und alle spaeteren (einheiten AC-24).
    for (const [von, nach] of Object.entries(VERBESSERUNGEN[art].wandelt || {})) {
      const mehr = this.lebenMax(spieler.id, nach) - this.lebenMax(spieler.id, von);
      for (const einheit of this.einheiten.values()) {
        if (einheit.besitzer !== spieler.id || einheit.art !== von) continue;
        einheit.art = nach;
        // Das Leben waechst mit, der Schaden bleibt stehen.
        einheit.leben += mehr;
      }
      for (const g of this.gebaeude.values()) {
        if (g.besitzer !== spieler.id || !g.schlange.includes(von)) continue;
        g.schlange = g.schlange.map((a) => (a === von ? nach : a));
        this.gebaeudeGeaendert(g);
      }
    }
  }

  // Welche Stufe einer Einheit dieser Spieler ausbildet (einheiten AC-24) -
  // Stufe um Stufe, so weit seine Verbesserungen reichen (AC-59).
  einheitenStufe(spieler, art) {
    const erforscht = spieler?.verbesserungen || [];
    for (let weiter = true; weiter;) {
      weiter = false;
      for (const v of erforscht) {
        const nach = VERBESSERUNGEN[v].wandelt?.[art];
        if (nach) {
          art = nach;
          weiter = true;
          break;
        }
      }
    }
    return art;
  }

  // Rechtsklick mit ausgewaehltem Gebaeude (bauen AC-13).
  sammelpunktSetzen(spielerId, gebaeudeId, ziel) {
    const gebaeude = this.gebaeude.get(gebaeudeId);
    if (!gebaeude || gebaeude.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebäude.' };
    const g = this.karte.groesse;
    const x = Math.round(Number(ziel?.x));
    const y = Math.round(Number(ziel?.y));
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= g || y >= g) return { fehler: 'Dort geht kein Sammelpunkt.' };
    // Liegt er auf einem Vorrat, merkt er sich dessen Art (bauen AC-40): ist
    // der Baum gefaellt, gilt der naechste daneben.
    const art = this.karte.felder[y * g + x];
    gebaeude.sammelpunkt = SAMMELN[art] && this.karte.vorrat.has(y * g + x) ? { x, y, art } : { x, y };
    this.gebaeudeGeaendert(gebaeude);
    return {};
  }

  /**
   * Wohin eine neue Einheit vom Sammelpunkt aus geht. Lag er auf einem
   * Vorrat, den es nicht mehr gibt, wandert er zum naechsten derselben Art,
   * hoechstens SUCHWEITE_ERSATZ Felder weiter (bauen AC-40) - sonst stuende
   * jeder neue Dorfbewohner auf dem Stumpf.
   */
  sammelpunktZiel(gebaeude) {
    const punkt = gebaeude.sammelpunkt;
    if (punkt.art === undefined) return punkt;
    const index = punkt.y * this.karte.groesse + punkt.x;
    if (this.karte.felder[index] === punkt.art && this.karte.vorrat.has(index)) return punkt;
    const ersatz = this.naechsterVorrat(punkt, punkt.art);
    if (!ersatz) return punkt;
    gebaeude.sammelpunkt = { x: ersatz.x, y: ersatz.y, art: punkt.art };
    this.gebaeudeGeaendert(gebaeude);
    return gebaeude.sammelpunkt;
  }

  // Wohnraum aus den eigenen Gebaeuden, hoechstens 200 (bauen AC-14).
  wohnraum(spieler) {
    let raum = 0;
    for (const g of this.gebaeude.values()) {
      if (g.besitzer === spieler.id && g.fertig) raum += GEBAEUDE[g.art].wohnraum || 0;
    }
    return Math.min(BEVOELKERUNG_MAX, raum);
  }

  // Gezaehlt wird, was steht - eine verlorene Einheit gibt ihren Platz sofort
  // frei (bauen AC-16).
  bevoelkerung() {
    const zahl = new Map();
    // Ein Toter zaehlt nicht mehr mit, auch wenn er noch liegt (kampf AC-10).
    for (const e of this.einheiten.values()) {
      if (e.tot) continue;
      zahl.set(e.besitzer, (zahl.get(e.besitzer) || 0) + 1);
    }
    return zahl;
  }

  gebaeudeTakten(gebaeude, bevoelkerung) {
    if (!gebaeude.fertig) {
      this.baustelleTakten(gebaeude);
      return;
    }
    // Der Ruf des Drachen laeuft neben der Schlange (bauen AC-35).
    if (gebaeude.ruf) this.rufTakten(gebaeude, bevoelkerung);
    if (!gebaeude.schlange.length) return;
    const spieler = this.spielerVon(gebaeude.besitzer);
    const belegt = bevoelkerung.get(spieler.id) || 0;
    const art = gebaeude.schlange[0];
    const verbesserung = VERBESSERUNGEN[art];
    const aufstieg = AUFSTIEGE[art];
    // Voll: der Auftrag wartet, statt anzufangen (bauen AC-15) - eine
    // Verbesserung und ein Aufstieg brauchen keinen Platz.
    const wartet = !this.ohnePlatz(art) && belegt >= this.wohnraum(spieler);
    if (wartet !== gebaeude.wartet) this.gebaeudeGeaendert(gebaeude);
    gebaeude.wartet = wartet;
    if (wartet) return;

    // Eine Einheit kann schneller fertig werden (spielziel AC-25); der
    // Fortschritt ist dann kein ganzer Takt mehr. Der kleine Rand faengt die
    // Rundung der Summe ab: 175 mal 1,2 ergibt 209,99999 statt 210.
    gebaeude.fortschritt += EINHEITEN[art] ? this.ausbildungstempo(gebaeude.besitzer, gebaeude.art) : 1;
    this.gebaeudeGeaendert(gebaeude);
    if (gebaeude.fortschritt < this.auftragWerte(art).zeit * TAKTE_PRO_SEKUNDE - 1e-6) return;

    if (verbesserung) {
      gebaeude.schlange.shift();
      gebaeude.fortschritt = 0;
      this.erforschen(spieler, art);
      return;
    }
    // Der Aufstieg aendert nur die Stufe; was er oeffnet, haengt an den Daten
    // der Gebaeude und Einheiten (bauen AC-23, spielziel AC-1).
    if (aufstieg) {
      gebaeude.schlange.shift();
      gebaeude.fortschritt = 0;
      spieler.zeitalter = aufstieg.stufe;
      // Die Tafel der Werte geht neu hinaus - das Zeitalter kann sie aendern
      // (einheiten AC-57), und ein Haus kann Boni ab dieser Stufe tragen.
      this.werteAenderungen.add(spieler.id);
      this.zeitalterWirkungen(spieler);
      return;
    }
    const feld = this.freiesFeldAm(gebaeude);
    if (!feld) return; // alles verstellt: im naechsten Takt wieder versuchen
    gebaeude.schlange.shift();
    gebaeude.fortschritt = 0;
    const neu = this.einheitAnlegen(spieler.id, feld.x, feld.y, art);
    // Fuer die Tafel (spielziel AC-8): die drei vom Anfang zaehlen nicht mit,
    // die hat niemand ausgebildet.
    spieler.ausgebildet++;
    spieler.ausgebildetWert += kostenSumme(this.auftragKosten(spieler.id, art));
    bevoelkerung.set(spieler.id, belegt + 1);
    // Zum Sammelpunkt; liegt er auf einem Vorrat, wird dort gleich gesammelt (bauen AC-13).
    if (gebaeude.sammelpunkt) this.befehl(spieler.id, [neu.id], this.sammelpunktZiel(gebaeude));
  }

  // Ein begehbares Feld am Rand des Gebaeudes, auf dem niemand steht
  // (bauen AC-12). Gesucht wird ringweise nach aussen, immer in derselben
  // Reihenfolge - die Simulation bleibt deterministisch.
  freiesFeldAm(gebaeude) {
    const besetzt = new Set();
    for (const e of this.einheiten.values()) besetzt.add(`${Math.round(e.x)},${Math.round(e.y)}`);
    const mx = Math.round(gebaeude.x);
    const my = Math.round(gebaeude.y);
    for (let r = 2; r <= 8; r++) {
      // Vorn zuerst (dx + dy gross): dahinter verdeckte das Gebaeude den Neuen.
      const ring = [];
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r) ring.push([dx, dy]);
        }
      }
      ring.sort((a, b) => (b[0] + b[1]) - (a[0] + a[1]) || a[0] - b[0]);
      for (const [dx, dy] of ring) {
        const x = mx + dx;
        const y = my + dy;
        if (!karten.begehbar(this.karte, x, y) || besetzt.has(`${x},${y}`)) continue;
        return { x, y };
      }
    }
    return null;
  }

  // Untaetig (einheiten AC-21): ein Dorfbewohner, der weder laeuft noch
  // sammelt, huetet, eine Farm bestellt oder baut. Dieselbe Regel nutzt der
  // Pruefstand (ki AC-6) - eine Stelle, nicht zwei.
  untaetig(einheit) {
    if (einheit.tot) return false;
    // Wer kaempft, steht nicht herum - auch wenn er weder sammelt noch baut
    // noch laeuft (Runde 95: ein Dorfbewohner, der sich wehrte, zaehlte im
    // Pruefstand 22 Sekunden als untaetig, und der Knopf fuer Untaetige haette
    // ihn mitten aus dem Kampf geholt; bedienung AC-28, ki AC-10).
    if (einheit.auftrag?.art === 'angreifen') return false;
    return einheit.art === 'dorfbewohner' && !einheit.weg.length && !einheit.sammelt && !einheit.baut;
  }

  /**
   * Woran ein Dorfbewohner gerade arbeitet (bedienung AC-32): Schaf und Farm
   * sind Nahrung, ein Vorratsfeld sagt es selbst; wer nur traegt, zaehlt zu
   * seiner Ladung. Zurueck kommt der Rohstoff oder null.
   */
  arbeitetAn(einheit) {
    if (einheit.art !== 'dorfbewohner') return null;
    const auftrag = einheit.auftrag;
    if (auftrag?.art === 'tier' || auftrag?.art === 'farm') return 'nahrung';
    if (auftrag?.art === 'sammeln') {
      const feld = this.karte.felder[auftrag.feld.y * this.karte.groesse + auftrag.feld.x];
      return SAMMELN[feld]?.rohstoff || einheit.ladungsart || null;
    }
    return einheit.ladung > 0 ? einheit.ladungsart : null;
  }

  /** Arbeiter je Rohstoff eines Spielers, in der Reihenfolge von ROHSTOFFE. */
  arbeiterVon(spielerId) {
    const zahl = { holz: 0, nahrung: 0, gold: 0, stein: 0 };
    for (const e of this.einheiten.values()) {
      if (e.besitzer !== spielerId) continue;
      const rohstoff = this.arbeitetAn(e);
      if (rohstoff) zahl[rohstoff] += 1;
    }
    return ROHSTOFFE.map((r) => zahl[r]);
  }

  untaetigeVon(spielerId) {
    const ids = [];
    for (const e of this.einheiten.values()) if (e.besitzer === spielerId && this.untaetig(e)) ids.push(e.id);
    return ids;
  }

  spielerVon(id) {
    return this.spieler.find((s) => s.id === id) || null;
  }

  /**
   * Gegner oder nicht (spielziel AC-14) - die eine Stelle, an der jede
   * Kampfregel fragt: wen eine Wache angreift, worauf ein Turm schiesst, was
   * ein Rechtsklick tut, wessen Tor sich oeffnet. Niemand ist sein eigener
   * Gegner; ohne Teams ist jeder andere einer, wie bis Runde 145; mit Teams
   * ist es jeder, der nicht im selben Team ist. Wer kein Team hat, ist
   * allen Gegner.
   */
  feindlich(a, b) {
    if (a === b) return false;
    if (!this.mitTeams) return true;
    const team = this.teamVon.get(a);
    return !team || team !== this.teamVon.get(b);
  }

  /**
   * Sehen die beiden gemeinsam (spielziel AC-19, AC-21)? Fast immer
   * dasselbe wie "nicht feindlich" - ausser waehrend der Frist einer
   * Kuendigung: dann sind sie noch keine Gegner, sehen aber schon jeder
   * fuer sich. Fragen, was einer sieht und was der Server ihm schickt,
   * stellen deshalb diese Frage, Kampfregeln `feindlich`.
   */
  teiltSicht(a, b) {
    return this.sichten.get(a) === this.sichten.get(b);
  }

  feldVon(einheit) {
    return { x: Math.round(einheit.x), y: Math.round(einheit.y) };
  }

  // Ein Befehl kommt aus dem Browser und ist damit erst einmal unglaubwuerdig:
  // nur eigene Einheiten, nur Felder auf der Karte.
  /**
   * Ein Rechtsklick: hingehen, sammeln, bauen, angreifen - was aus dem
   * geklickten Feld zu lesen ist.
   *
   * @param {boolean} [angriffslauf] Der Angriffslauf (kampf AC-4): unterwegs
   *   wird angegriffen, was im Weg steht, und danach der Marsch fortgesetzt.
   *   Er ist der **einzige** Befehl, der nicht aus dem Feld folgt - deshalb
   *   kommt er als Angabe mit. Sammeln, Bauen und Schafe sind dabei aus: wer
   *   zum Gefecht laeuft, faengt unterwegs nicht an zu holzen.
   */
  befehl(spielerId, einheitIds, ziel, angriffslauf = false, anhaengen = false) {
    if (!Array.isArray(einheitIds) || !ziel) return;
    const g = this.karte.groesse;
    const zx = Math.round(Number(ziel.x));
    const zy = Math.round(Number(ziel.y));
    if (!Number.isInteger(zx) || !Number.isInteger(zy)) return;
    if (zx < 0 || zy < 0 || zx >= g || zy >= g) return;

    // Holz, Beeren, Gold und Stein sind sammelbar (einheiten AC-15) - beim
    // Angriffslauf nicht.
    const sammeln = angriffslauf ? null : SAMMELN[this.karte.felder[zy * g + zx]];
    // Eine eigene Baustelle: wer bauen kann, baut mit (bauen AC-2).
    const baustelle = this.gebaeudeAn(zx, zy);
    // Etwas Fremdes unter dem Klick wird angegriffen (kampf AC-1) - kein
    // eigener Knopf, keine eigene Betriebsart: der Server liest es aus dem Feld.
    const feind = this.feindAn(spielerId, Number(ziel.x), Number(ziel.y));
    const feindBau = !feind && baustelle && this.feindlich(spielerId, baustelle.besitzer) ? baustelle : null;
    // Ein fertiger Markt, der nicht einem Gegner gehoert, ist fuer den
    // Karren ein Handelsziel (einheiten AC-40) - der eines Verbuendeten oder
    // ein zweiter eigener (ADR-0013).
    const handelsziel = !angriffslauf && !feind && baustelle?.fertig && GEBAEUDE[baustelle.art].handel
      && !this.feindlich(spielerId, baustelle.besitzer) ? baustelle : null;
    // Ein eigenes Schaf in der Naehe des Klicks (einheiten AC-17) - aber nur,
    // wenn auf dem Feld selbst nichts zu sammeln ist: neben Beeren weiden Schafe.
    const schaf = sammeln || angriffslauf ? null : this.tierAn(spielerId, Number(ziel.x), Number(ziel.y));
    // Ein Verletzter unter dem Klick, der keinem Gegner gehoert: wer heilen
    // kann, heilt genau ihn (einheiten AC-65).
    const verletzter = angriffslauf || feind ? null : this.verletzterAn(spielerId, Number(ziel.x), Number(ziel.y));
    // Ein Ei am Boden, das der Spieler sieht (einheiten AC-51), und ein
    // eigenes Kloster, in das ein Traeger es bringt.
    const ei = angriffslauf || feind || sammeln || baustelle || schaf ? null : this.eiAn(spielerId, Number(ziel.x), Number(ziel.y));
    const kloster = !angriffslauf && baustelle?.fertig && baustelle.art === 'kloster' && baustelle.besitzer === spielerId ? baustelle : null;
    // Ein Gang auf freien Boden laesst sich anhaengen (bedienung AC-14) -
    // alles andere ist ein Befehl wie ohne Umschalt.
    const nurGehen = !angriffslauf && !sammeln && !baustelle && !feind && !schaf && !ei;
    // Ein Befehl fuer viele (einheiten AC-20): wer geht, bekommt ein eigenes Feld
    // um das Ziel; wer sammelt, einen eigenen Vorrat derselben Art daneben.
    const gruppe = einheitIds.slice(0, 200).map((id) => this.einheiten.get(id)).filter((e) => e && e.besitzer === spielerId);
    let aufstellung = null;
    let angriffsfelder = null;
    let vorraete = null;
    let naechsterVorrat = 0;
    // Was dieser Befehl schon geflutet und vergeben hat, wenn zum Ziel kein
    // Weg fuehrt (einheiten AC-64).
    const gebiete = [];

    // Eine Brache (bauen AC-41): der Rechtsklick eines Dorfbewohners saet sie
    // neu aus. Bezahlt wird hier, einmal und vor allem anderen - reicht es
    // nicht, geht niemand los, und die Absage sagt, was fehlt.
    if (baustelle?.brach && baustelle.besitzer === spielerId && !angriffslauf && !feind
      && gruppe.some((e) => this.tragkraft(e) > 0)) {
      const fehlt = this.aussaeen(this.spielerVon(spielerId), baustelle);
      if (fehlt) return { fehler: `Zu wenig ${ROHSTOFF_NAMEN[fehlt]}.` };
    }

    // Ein beschaedigtes Gebaeude (bauen AC-45): wer bauen kann, repariert.
    // Fehlt schon der erste Rohstoff dafuer, geht niemand los, und die
    // Absage sagt, was fehlt.
    const flicken = !angriffslauf && !feind && baustelle
      && gruppe.some((e) => this.repariertHier(e, baustelle)) ? baustelle : null;
    if (flicken) {
      const spieler = this.spielerVon(spielerId);
      const fehlt = Object.keys(GEBAEUDE[flicken.art].kosten).find((rohstoff) => spieler[rohstoff] < 1);
      if (fehlt) return { fehler: `Zu wenig ${ROHSTOFF_NAMEN[fehlt]} für die Reparatur.` };
    }

    for (const id of einheitIds.slice(0, 200)) {
      // Ein eigenes, lebendes Schaf wird getrieben (einheiten AC-22).
      const tier = this.tiere.get(id);
      if (tier) {
        if (tier.besitzer !== spielerId || tier.geschlachtet) continue;
        tier.weg = suchen(this.karte, { x: Math.round(tier.x), y: Math.round(tier.y) }, { x: zx, y: zy }, this.toreVon(tier.besitzer));
        continue;
      }
      const einheit = this.einheiten.get(id);
      if (!einheit || einheit.besitzer !== spielerId) continue;
      // Mit Umschalt kommt der Gang hinten an die Reihe (bedienung AC-14) -
      // fuer den, der gerade geht. Wer steht oder arbeitet, geht gleich los.
      // Jeder bekommt um den Punkt sein eigenes Feld, gewaehlt vom vorigen
      // Ziel aus, wie beim ersten Gang (einheiten AC-20).
      // Ein Gegner kommt hinten an die Reihe der Angriffe (bedienung AC-50) -
      // fuer den, der auf Befehl angreift. Wer sich von selbst wehrt (`heimat`)
      // oder im Angriffslauf kaempft, hat keinen Befehl, an den sich etwas
      // haengen liesse: fuer ihn ist es ein Befehl wie ohne Umschalt.
      const hinten = feind && this.kannTreffen(einheit, feind) ? feind : feindBau;
      if (anhaengen && hinten && einheit.auftrag?.art === 'angreifen' && !einheit.auftrag.heimat
        && !einheit.angriffslauf && this.einheitenwert(einheit.besitzer, einheit.art, 'angriff') > 0) {
        const schon = einheit.auftrag.ziel === hinten.id || einheit.angriffe.some((a) => a.ziel === hinten.id);
        if (!schon && einheit.angriffe.length < WEGPUNKTE_MAX) {
          einheit.angriffe.push({ ziel: hinten.id, gebaeude: hinten === feindBau });
        }
        continue;
      }
      if (anhaengen && nurGehen && einheit.auftrag?.art === 'gehen' && !einheit.angriffslauf
        && !this.kannHeilen(einheit, verletzter)) {
        if (einheit.wegpunkte.length >= WEGPUNKTE_MAX) continue;
        aufstellung ??= this.aufstellungUm({ x: zx, y: zy }, gruppe.length);
        const von = einheit.wegpunkte.at(-1) || einheit.auftrag.feld;
        einheit.wegpunkte.push(this.naechstesFreies(von, aufstellung) || { x: zx, y: zy });
        continue;
      }
      einheit.wegpunkte = [];
      einheit.angriffe = [];
      this.farmVerlassen(einheit);
      einheit.sammelt = false;
      einheit.baut = false;
      // Ein Moench, der eben noch bekehrte oder heilte, tut es nicht mehr
      // (einheiten AC-37, AC-38; tests/waechter-merker.test.mjs).
      einheit.bekehrt = false;
      einheit.heilt = null;
      einheit.unerreichbar = null;
      // Jeder neue Befehl beendet einen laufenden Angriffslauf.
      einheit.angriffslauf = null;
      // Ein Karren auf einen anderen Markt faehrt die Strecke (einheiten
      // AC-40); ohne eigenen zweiten Markt bleibt es ein Gang.
      if (handelsziel && EINHEITEN[einheit.art].handelt && this.handelBeginnen(einheit, handelsziel)) continue;
      // Wer ein Ei traegt, traegt nur das Ei (einheiten AC-51): er bringt es
      // in ein eigenes Kloster oder geht - sammeln, bauen, kaempfen tut er
      // nicht, sonst laege das Ei im Lager. Wer es holen kann, holt es.
      if (this.eiVon(einheit)) {
        if (kloster) this.eiBringenBeginnen(einheit, kloster);
        else {
          aufstellung ??= this.aufstellungUm({ x: zx, y: zy }, gruppe.length);
          this.gangBeginnen(einheit, this.naechstesFreies(einheit, aufstellung) || { x: zx, y: zy }, { x: zx, y: zy }, gebiete);
        }
        continue;
      }
      if (ei && this.eiHolen(einheit, ei)) continue;
      // Ein Moench bekehrt, wer sich bekehren laesst (einheiten AC-38) - wenn
      // er nicht ruht; sonst geht er nur hin.
      if (!angriffslauf && feind && this.kannBekehren(einheit, feind)) {
        this.bekehrenBeginnen(einheit, feind);
        continue;
      }
      // Ein Moench heilt, wen der Spieler ihm zeigt (einheiten AC-65).
      if (this.kannHeilen(einheit, verletzter)) {
        this.heilenBeginnen(einheit, verletzter);
        continue;
      }
      // Wer nur Gebaeude angreift (die Ramme, einheiten AC-35), geht zu einer
      // Einheit nur hin - und wer den Drachen nicht trifft (kampf AC-23), zu
      // ihm.
      if ((feindBau || (feind && this.kannTreffen(einheit, feind)))
        && this.einheitenwert(einheit.besitzer, einheit.art, 'angriff') > 0) {
        const opfer = feind || feindBau;
        // Mehrere Angreifer stellen sich um das Ziel herum, statt uebereinander
        // zu stehen - dieselbe Aufstellung wie beim Gehen (einheiten AC-20).
        angriffsfelder ??= this.angriffsfelderOhneBesetzte(opfer, gruppe.length, Boolean(feindBau), einheitIds);
        this.angriffBeginnen(einheit, opfer, Boolean(feindBau), this.naechstesFreies(einheit, angriffsfelder));
      } else if (!angriffslauf && baustelle && !baustelle.fertig && baustelle.besitzer === spielerId
        && (EINHEITEN[einheit.art].baut || []).includes(baustelle.art)) {
        this.bauenBeginnen(einheit, baustelle);
      } else if (!angriffslauf && baustelle && baustelle.fertig && GEBAEUDE[baustelle.art].nahrung && baustelle.besitzer === spielerId
        && !baustelle.brach && this.tragkraft(einheit) > 0
        && (!baustelle.arbeiter || baustelle.arbeiter === einheit.id || !this.einheiten.has(baustelle.arbeiter))) {
        this.farmBeginnen(einheit, baustelle);
      } else if (!angriffslauf && baustelle && baustelle.fertig && baustelle.besitzer === spielerId
        && einheit.ladung > 0 && GEBAEUDE[baustelle.art].annahme.includes(einheit.ladungsart)) {
        // Ein Rechtsklick auf ein eigenes Lager, das die Ladung annimmt: dort
        // wird abgeladen, danach geht es zurueck an die alte Arbeit
        // (einheiten AC-56).
        this.abgebenBeginnen(einheit, baustelle);
      } else if (flicken && this.repariertHier(einheit, flicken)) {
        this.reparierenBeginnen(einheit, flicken);
      } else if (schaf && this.tragkraft(einheit) > 0) {
        if (einheit.ladung > 0 && einheit.ladungsart !== 'nahrung') {
          einheit.ladung = 0;
          einheit.ladungsart = null;
        }
        einheit.angefangen = 0;
        einheit.auftrag = { art: 'tier', tier: schaf.id };
        this.wegZumTier(einheit, schaf);
      } else if (sammeln && this.tragkraft(einheit) > 0) {
        // Wer den Rohstoff wechselt, laesst die alte Ladung fallen.
        if (einheit.ladung > 0 && einheit.ladungsart !== sammeln.rohstoff) {
          einheit.ladung = 0;
          einheit.ladungsart = null;
        }
        einheit.angefangen = 0;
        vorraete ??= this.vorraeteUm({ x: zx, y: zy }, gruppe.length);
        const feld = vorraete[naechsterVorrat++ % vorraete.length];
        einheit.auftrag = { art: 'sammeln', feld };
        this.wegZumVorrat(einheit);
      } else {
        aufstellung ??= this.aufstellungUm({ x: zx, y: zy }, gruppe.length);
        // Fuehrt kein Weg zum Platz der Aufstellung, geht es so nah an den
        // Klick, wie es geht (einheiten AC-64).
        const feld = this.gangBeginnen(einheit, this.naechstesFreies(einheit, aufstellung) || { x: zx, y: zy }, { x: zx, y: zy }, gebiete);
        // Der Angriffslauf merkt sich das Marschziel: nach jedem Gefecht
        // unterwegs geht es dorthin weiter (kampf AC-4).
        if (angriffslauf && this.einheitenwert(einheit.besitzer, einheit.art, 'angriff') > 0) einheit.angriffslauf = feld;
      }
    }
  }

  /**
   * Der Gang zu einem Feld. Fuehrt kein Weg dorthin - eine Lichtung mitten im
   * Wald, das andere Ufer, hinter einer fremden Mauer -, geht es so nah an
   * `gemeint` heran, wie es geht (einheiten AC-64), statt stehenzubleiben.
   *
   * @param {{x: number, y: number}} feld wohin es gehen soll
   * @param {{x: number, y: number}} [gemeint] der Klick, von dem `feld` stammt
   * @param {{maske: Uint8Array, vergeben: Set<number>}[]} [gebiete] was dieser
   *   Befehl schon geflutet und vergeben hat
   * @returns {{x: number, y: number}} das Feld, zu dem es wirklich geht
   */
  gangBeginnen(einheit, feld, gemeint = feld, gebiete = []) {
    // Wer fliegt, braucht keinen Platz in der Aufstellung am Boden: er fliegt
    // genau dorthin, wo geklickt wurde, auch ueber Wasser (einheiten AC-52).
    if (EINHEITEN[einheit.art].fliegt) feld = { x: gemeint.x, y: gemeint.y };
    let weg = this.wegNach(einheit, feld);
    const hier = this.feldVon(einheit);
    if (!weg.length && (hier.x !== feld.x || hier.y !== feld.y)) {
      const nah = this.naechstesErreichbare(einheit, gemeint, gebiete);
      if (nah) {
        feld = nah;
        weg = this.wegNach(einheit, nah);
      }
    }
    einheit.auftrag = { art: 'gehen', feld };
    einheit.weg = weg;
    return feld;
  }

  /**
   * Das begehbare Feld, das `ziel` am naechsten liegt und zu dem die Einheit
   * einen Weg hat (einheiten AC-64) - bei gleichem Abstand das, das ihr
   * naeher ist. Eine Gruppe flutet ihr Gebiet einmal je Befehl, und jeder
   * bekommt ein eigenes Feld. Null, wenn sie nirgends hin kann.
   *
   * @param {{x: number, y: number}} ziel
   * @param {{maske: Uint8Array, vergeben: Set<number>}[]} [gebiete]
   * @returns {{x: number, y: number} | null}
   */
  naechstesErreichbare(einheit, ziel, gebiete = []) {
    const g = this.karte.groesse;
    const von = this.feldVon(einheit);
    const hier = von.y * g + von.x;
    let gebiet = gebiete.find((b) => b.maske[hier]);
    if (!gebiet) {
      gebiet = { maske: Uint8Array.from(erreichbar(this.karte, von, this.toreVon(einheit.besitzer))), vergeben: new Set() };
      gebiete.push(gebiet);
    }
    let bestes = -1;
    let amZiel = Infinity;
    let beiIhr = Infinity;
    for (let i = 0; i < gebiet.maske.length; i++) {
      // Nur Gras: in der Durchfahrt des eigenen Tors bleibt niemand stehen.
      if (!gebiet.maske[i] || this.karte.felder[i] !== karten.GRAS || gebiet.vergeben.has(i)) continue;
      const x = i % g;
      const y = (i / g) | 0;
      const d = (x - ziel.x) ** 2 + (y - ziel.y) ** 2;
      if (d > amZiel) continue;
      const e = (x - von.x) ** 2 + (y - von.y) ** 2;
      if (d < amZiel || e < beiIhr) {
        bestes = i;
        amZiel = d;
        beiIhr = e;
      }
    }
    if (bestes < 0) return null;
    gebiet.vergeben.add(bestes);
    return { x: bestes % g, y: (bestes / g) | 0 };
  }

  // Freie Felder um ein Ziel, nach Abstand - das Ziel selbst zuerst, wenn frei
  // (einheiten AC-20). Genug fuer n Einheiten, oder so viele es gibt. Die
  // Mitte steht an der Liste (`mitte`): `naechstesFreies` entscheidet daran
  // einen Gleichstand.
  aufstellungUm(ziel, n) {
    const felder = [];
    for (let r = 0; r < 12 && felder.length < n; r++) {
      const ring = [];
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (karten.begehbar(this.karte, ziel.x + dx, ziel.y + dy)) ring.push({ x: ziel.x + dx, y: ziel.y + dy, d: Math.hypot(dx, dy) });
        }
      }
      ring.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x);
      for (const f of ring) felder.push({ x: f.x, y: f.y, frei: true });
    }
    return Object.assign(felder, { mitte: { x: ziel.x, y: ziel.y } });
  }

  // Das naechste noch freie Feld der Aufstellung - wer nahe steht, nimmt nahe Felder.
  // Gleich nahe Felder entscheidet ihre Lage zur Linie von der Einheit zur
  // Mitte: erst das rechts davon, dann das zur Mitte hin. Die Reihenfolge der
  // Liste haengt an der Himmelsrichtung, diese Regel nicht - gespiegelte
  // Heere nehmen gespiegelte Felder (kampf AC-26).
  naechstesFreies(einheit, aufstellung) {
    const mitte = /** @type {{mitte?: {x: number, y: number}}} */ (aufstellung).mitte;
    const mx = mitte ? mitte.x - einheit.x : 0;
    const my = mitte ? mitte.y - einheit.y : 0;
    let bestes = null;
    let besterAbstand = Infinity;
    let besteLage = 0;
    for (const f of aufstellung) {
      if (!f.frei) continue;
      const fx = f.x - einheit.x;
      const fy = f.y - einheit.y;
      const abstand = Math.hypot(fx, fy);
      const lage = (fx * my - fy * mx) * 1e6 - (fx * mx + fy * my);
      if (abstand < besterAbstand - 1e-9 || (abstand <= besterAbstand + 1e-9 && lage < besteLage)) {
        besterAbstand = Math.min(abstand, besterAbstand);
        besteLage = lage;
        bestes = f;
      }
    }
    if (!bestes) return null;
    bestes.frei = false;
    return { x: bestes.x, y: bestes.y };
  }

  // Vorraete derselben Art um ein Feld, das Feld selbst zuerst, dann nach
  // Abstand - Sammler verteilen sich darauf, statt alle an einem zu stehen.
  vorraeteUm(ziel, n) {
    const g = this.karte.groesse;
    const art = this.karte.felder[ziel.y * g + ziel.x];
    const felder = [];
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const x = ziel.x + dx;
        const y = ziel.y + dy;
        if (x < 0 || y < 0 || x >= g || y >= g) continue;
        const index = y * g + x;
        if (this.karte.felder[index] !== art || !(this.karte.vorrat.get(index) > 0)) continue;
        felder.push({ x, y, d: Math.hypot(dx, dy) });
      }
    }
    felder.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x);
    const auswahl = felder.slice(0, Math.max(1, n)).map(({ x, y }) => ({ x, y }));
    return auswahl.length ? auswahl : [ziel];
  }

  // ---- Handel mit dem Karren (einheiten AC-40) -----------------------------

  /**
   * Schickt einen Karren auf die Strecke zwischen seinem Heimatmarkt und
   * `ziel`. Heimat ist der eigene fertige Markt, der ihm am naechsten steht -
   * nicht `ziel` selbst. Gibt es keinen, ist es keine Strecke (false).
   */
  handelBeginnen(einheit, ziel) {
    let heimat = null;
    let besterAbstand = Infinity;
    for (const g of this.gebaeude.values()) {
      if (g === ziel || g.besitzer !== einheit.besitzer || !g.fertig || !GEBAEUDE[g.art].handel) continue;
      const abstand = this.abstandZu(einheit, g);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        heimat = g;
      }
    }
    if (!heimat) return false;
    // Gold aus einer frueheren Strecke wird zuerst heimgebracht - zum neuen
    // Heimatmarkt; anderes traegt ein Karren nicht.
    if (einheit.ladungsart !== 'gold') {
      einheit.ladung = 0;
      einheit.ladungsart = null;
    }
    einheit.auftrag = { art: 'handel', heimat: heimat.id, ziel: ziel.id };
    einheit.weg = [];
    return true;
  }

  /**
   * Die beiden Maerkte der Strecke, solange sie gilt: beide stehen, die
   * Heimat gehoert ihm, das Ziel keinem Gegner - nach einer Kuendigung
   * (spielziel AC-21) wird der Verbuendete einer, und die Strecke endet.
   */
  strecke(einheit) {
    const heimat = this.gebaeude.get(einheit.auftrag.heimat);
    const ziel = this.gebaeude.get(einheit.auftrag.ziel);
    if (!heimat || !ziel || heimat.besitzer !== einheit.besitzer) return null;
    if (this.feindlich(einheit.besitzer, ziel.besitzer)) return null;
    return { heimat, ziel };
  }

  /**
   * Gold je Fahrt zwischen zwei Maerkten, nach `HANDEL.karren` - fuer den
   * Besitzer des Heimatmarkts, also mit seinem `karrenAnteil` (spielziel
   * AC-26), und zwischen zwei Verbuendeten mit `verbuendetAnteil` dazu
   * (spielziel AC-25). Verbuendet heisst hier: sie teilen die Sicht - in der
   * Frist einer Kuendigung faehrt der Karren weiter, aber ohne den Bonus.
   */
  handelsgewinn(heimat, ziel) {
    const mitte = (g) => {
      const { x0, y0, x1, y1 } = this.grundflaeche(g.art, g.x, g.y, g.quer);
      return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
    };
    const a = mitte(heimat);
    const b = mitte(ziel);
    const d = Math.hypot(a.x - b.x, a.y - b.y);
    const { faktor, sockel } = HANDEL.karren;
    let anteil = 1 + this.handelswert(heimat.besitzer, 'karrenAnteil');
    // Der Markt eines anderen bringt mehr als der zweite eigene (einheiten
    // AC-40): wer nur mit sich selbst handelt, soll es schlechter haben als
    // zwei, die einander die Maerkte hinstellen.
    // Er rechnet auf alles andere obendrauf, auch auf den Mannschaftsbonus.
    const fremd = ziel.besitzer !== heimat.besitzer ? 1 + HANDEL.karren.fremdAnteil : 1;
    if (ziel.besitzer !== heimat.besitzer && this.teiltSicht(heimat.besitzer, ziel.besitzer)) {
      anteil += this.handelswert(heimat.besitzer, 'verbuendetAnteil');
    }
    return Math.round(faktor * anteil * fremd * d * (d / this.karte.groesse + sockel));
  }

  // Leer zum Ziel, dort laedt er das Gold der Fahrt, beladen heim, dort
  // gehoert es dem Spieler - und wieder los.
  handelTakten(einheit) {
    const s = this.strecke(einheit);
    if (!s) {
      einheit.auftrag = null;
      return;
    }
    const { heimat, ziel } = s;
    const beladen = einheit.ladung > 0;
    const markt = beladen ? heimat : ziel;
    // Angekommen ist, wer am Rand steht. Der Weg endet auf einem Randfeld,
    // das bis zu drei Felder draussen liegen kann, wenn naeher alles belegt
    // ist (`randfeld`).
    if (this.abstandZu(einheit, markt) > 3.5) {
      const stand = this.randfeld(markt, einheit);
      einheit.weg = stand ? this.wegNach(einheit, stand) : [];
      // Kein Weg dorthin: er bleibt stehen, statt in jedem Takt zu suchen.
      if (!einheit.weg.length) einheit.auftrag = null;
      return;
    }
    if (!beladen) {
      einheit.ladung = this.handelsgewinn(heimat, ziel);
      einheit.ladungsart = 'gold';
      // Ein Weg von null Gold - zwei Maerkte nebeneinander - waere ein
      // Pendeln ohne Ende ohne Ertrag.
      if (!einheit.ladung) einheit.auftrag = null;
      return;
    }
    const spieler = this.spielerVon(einheit.besitzer);
    spieler.gold += einheit.ladung;
    // Fuer die Tafel (spielziel AC-8): Gold aus dem Handel ist gesammeltes.
    spieler.gesammelt.gold += einheit.ladung;
    einheit.ladung = 0;
    einheit.ladungsart = null;
  }

  // ---- Farm (einheiten AC-18) ----------------------------------------------

  farmBeginnen(einheit, farm) {
    this.farmVerlassen(einheit);
    if (einheit.ladung > 0 && einheit.ladungsart !== 'nahrung') {
      einheit.ladung = 0;
      einheit.ladungsart = null;
    }
    einheit.angefangen = 0;
    einheit.sammelt = false;
    einheit.auftrag = { art: 'farm', gebaeude: farm.id };
    farm.arbeiter = einheit.id;
    this.gebaeudeGeaendert(farm);
    this.wegZurFarm(einheit, farm);
  }

  // Wer etwas anderes tut, gibt seine Farm frei.
  farmVerlassen(einheit) {
    if (einheit.auftrag?.art !== 'farm') return;
    const farm = this.gebaeude.get(einheit.auftrag.gebaeude);
    if (farm && farm.arbeiter === einheit.id) {
      farm.arbeiter = null;
      this.gebaeudeGeaendert(farm);
    }
  }

  wegZurFarm(einheit, farm) {
    const ziel = { x: Math.round(farm.x), y: Math.round(farm.y) };
    if (this.aufGrundflaeche(einheit, farm)) {
      einheit.weg = [];
      return;
    }
    einheit.weg = suchen(this.karte, this.feldVon(einheit), ziel, this.toreVon(einheit.besitzer));
  }

  farmTakten(einheit) {
    const farm = this.gebaeude.get(einheit.auftrag.gebaeude);
    if (!farm || !farm.fertig || farm.arbeiter !== einheit.id) {
      einheit.auftrag = null;
      einheit.sammelt = false;
      return;
    }
    if (farm.brach) {
      this.bracheTakten(einheit, farm);
      return;
    }
    if (einheit.ladung >= this.tragkraft(einheit)) {
      einheit.sammelt = false;
      this.abladen(einheit);
      return;
    }
    if (!this.aufGrundflaeche(einheit, farm)) {
      einheit.sammelt = false;
      this.wegZurFarm(einheit, farm);
      if (!einheit.weg.length) einheit.auftrag = null;
      return;
    }
    einheit.sammelt = true;
    einheit.angefangen += GEBAEUDE[farm.art].rate / TAKTE_PRO_SEKUNDE;
    if (einheit.angefangen < 1) return;
    einheit.angefangen -= 1;
    farm.nahrung -= 1;
    einheit.ladung += 1;
    einheit.ladungsart = 'nahrung';
    this.gebaeudeGeaendert(farm);
    if (farm.nahrung <= 0) this.farmLeer(einheit, farm);
  }

  /**
   * Die letzte Nahrung ist geerntet (bauen AC-41, AC-42). Wer seine Farmen
   * von selbst erneuert, zahlt und erntet weiter. Sonst liegt die Farm brach,
   * bis ein Dorfbewohner sie neu aussaet - bis zum ersten Spiel auf dem
   * Server verschwand sie, und wer nicht hinsah, hatte auf einmal keine mehr.
   * Wer Brachen raeumt (die KI), verliert sie wie bis dahin jeder.
   */
  farmLeer(einheit, farm) {
    const spieler = this.spielerVon(farm.besitzer);
    if (spieler.farmenErneuern && !this.aussaeen(spieler, farm)) return;
    einheit.sammelt = false;
    if (spieler.brachenRaeumen) {
      this.gebaeude.delete(farm.id);
      this.gebaeudeSichtNeu = true;
      einheit.auftrag = einheit.ladung > 0 ? { art: 'farm', gebaeude: farm.id, leer: true } : null;
      return;
    }
    farm.nahrung = 0;
    farm.brach = true;
    this.gebaeudeGeaendert(farm);
    // Wer von selbst erneuert und es nicht bezahlen kann, behaelt die Farm
    // und wartet darauf (`bracheTakten`).
    if (spieler.farmenErneuern) return;
    farm.arbeiter = null;
    einheit.auftrag = einheit.ladung > 0 ? { art: 'farm', gebaeude: farm.id, leer: true } : null;
  }

  /**
   * Auf der eigenen Brache (bauen AC-42): neu aussaeen, sobald es reicht -
   * bis dahin die Ladung heimbringen und warten. Wer wartet, zaehlt als
   * untaetig (`untaetig`): so findet der Spieler ihn. Ist der Schalter
   * inzwischen aus, ist die Farm frei.
   */
  bracheTakten(einheit, farm) {
    const spieler = this.spielerVon(farm.besitzer);
    einheit.sammelt = false;
    if (!spieler.farmenErneuern) {
      farm.arbeiter = null;
      this.gebaeudeGeaendert(farm);
      einheit.auftrag = einheit.ladung > 0 ? { art: 'farm', gebaeude: farm.id, leer: true } : null;
      return;
    }
    // Erst heim, was er traegt - `abladen` fuehrt ihn danach zurueck.
    if (einheit.ladung > 0 && this.lagerFuer(einheit)) {
      this.abladen(einheit);
      return;
    }
    if (!this.aufGrundflaeche(einheit, farm)) {
      this.wegZurFarm(einheit, farm);
      if (!einheit.weg.length) {
        farm.arbeiter = null;
        this.gebaeudeGeaendert(farm);
        einheit.auftrag = null;
      }
      return;
    }
    this.aussaeen(spieler, farm);
  }

  /**
   * Eine Farm neu aussaeen (bauen AC-41): kostet, was die Farm kostet, und
   * sie traegt wieder voll. Zurueck kommt der Rohstoff, der fehlt - oder
   * null, dann ist bezahlt.
   */
  aussaeen(spieler, farm) {
    const kosten = Object.entries(GEBAEUDE[farm.art].kosten);
    for (const [rohstoff, menge] of kosten) if (spieler[rohstoff] < menge) return rohstoff;
    for (const [rohstoff, menge] of kosten) spieler[rohstoff] -= menge;
    farm.nahrung = this.farmNahrung(farm.besitzer);
    farm.brach = false;
    this.gebaeudeGeaendert(farm);
    return null;
  }

  /**
   * Wie ein Spieler mit leeren Farmen umgeht (bauen AC-42): `erneuern` saet
   * sie von selbst neu aus, `raeumen` laesst sie verschwinden, statt
   * brachzuliegen. Gesetzt wird nur, was als Wahrheitswert mitkommt.
   */
  farmenEinstellen(spielerId, nachricht) {
    const spieler = this.spielerVon(spielerId);
    if (!spieler) return { fehler: 'Diesen Spieler gibt es hier nicht.' };
    if (typeof nachricht.erneuern === 'boolean') spieler.farmenErneuern = nachricht.erneuern;
    if (typeof nachricht.raeumen === 'boolean') spieler.brachenRaeumen = nachricht.raeumen;
    return {};
  }

  /**
   * Etwas Eigenes entfernen (bedienung AC-75): eine Einheit oder ein Gebaeude
   * je Nachricht. Die Einheit faellt wie im Kampf (sie liegt zwei Sekunden,
   * zaehlt auf der Tafel als verloren), das Gebaeude stuerzt ein und
   * hinterlaesst Truemmer; eine Baustelle wird abgerissen und erstattet, was
   * nicht verbaut ist (bauen AC-6). Punkte bekommt dafuer niemand - es gibt
   * keinen Angreifer (bedienung AC-49).
   */
  entlassen(spielerId, nachricht) {
    if (nachricht.gebaeude !== undefined) {
      const gebaeude = this.gebaeude.get(nachricht.gebaeude);
      if (!gebaeude || gebaeude.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebäude.' };
      if (!gebaeude.fertig) return this.abreissen(spielerId, gebaeude.id);
      gebaeude.leben = 0;
      this.gebaeudeZerstoeren(gebaeude);
      return {};
    }
    const einheit = this.einheiten.get(nachricht.einheit);
    if (!einheit || einheit.besitzer !== spielerId || einheit.tot) return { fehler: 'Das ist nicht deine Einheit.' };
    this.einheitSterben(einheit);
    return {};
  }

  /**
   * Abruesten (einheiten AC-50): jede genannte eigene Einheit, die es darf
   * (`ruestetAb` - eine Frage der Klassen), bezahlt `ABRUESTEN.kosten` und
   * steht `ABRUESTEN.sekunden` lang: sie arbeitet nicht, wacht nicht und
   * schlaegt nicht zurueck (`wehren` laesst Waechter aus, die Wache Einheiten
   * mit Auftrag). Danach ist sie Dorfbewohner (`abruestenTakten`).
   *
   * Bezahlt wird je Einheit der Reihe nach: reicht es fuer die dritte nicht,
   * ruesten zwei ab, und die Absage sagt, was fehlt. Wer schon abruestet,
   * zahlt nicht zweimal.
   */
  abruesten(spielerId, einheitIds) {
    if (!Array.isArray(einheitIds)) return { fehler: 'Wer soll abrüsten?' };
    const spieler = this.spielerVon(spielerId);
    let fehlt = null;
    let gezahlt = 0;
    let darf = 0;
    for (const id of einheitIds.slice(0, 200)) {
      const einheit = this.einheiten.get(id);
      if (!einheit || einheit.besitzer !== spielerId || einheit.tot || !ruestetAb(einheit.art)) continue;
      darf++;
      if (einheit.auftrag?.art === 'abruesten') continue;
      fehlt = this.abruestenStarten(einheit);
      if (fehlt) break;
      gezahlt++;
    }
    if (!darf) return { fehler: 'Nur Fußvolk, Schützen und Reiter können abrüsten.' };
    if (fehlt && !gezahlt) return { fehler: `Zu wenig ${ROHSTOFF_NAMEN[fehlt]}.` };
    return {};
  }

  /**
   * Die Lehrzeit beginnt: bezahlen, anhalten. `folge` ist der Auftrag danach
   * - ein Soldat, der fuer ein Ei abruestet, holt es dann (einheiten AC-51).
   * Gibt zurueck, welcher Rohstoff fehlt, sonst null.
   */
  abruestenStarten(einheit, folge = null) {
    const spieler = this.spielerVon(einheit.besitzer);
    const fehlt = Object.keys(ABRUESTEN.kosten).find((r) => spieler[r] < ABRUESTEN.kosten[r]);
    if (fehlt) return fehlt;
    for (const [r, m] of Object.entries(ABRUESTEN.kosten)) spieler[r] -= m;
    this.anhalten(einheit);
    einheit.auftrag = { art: 'abruesten', bis: this.takt + ABRUESTEN.sekunden * TAKTE_PRO_SEKUNDE, ...(folge ? { folge } : {}) };
    return null;
  }

  // Alles fallen lassen, was eine Einheit gerade tut - der Weg, die Reihe,
  // die Arbeit. Eine Ladung bleibt, wie bei jedem neuen Befehl.
  anhalten(einheit) {
    this.farmVerlassen(einheit);
    einheit.weg = [];
    einheit.wegpunkte = [];
    einheit.angriffe = [];
    einheit.angriffslauf = null;
    einheit.sammelt = false;
    einheit.baut = false;
    einheit.bekehrt = false;
    einheit.heilt = null;
    einheit.unerreichbar = null;
  }

  // Die Lehrzeit ist um: aus dem Soldaten wird ein Dorfbewohner (einheiten
  // AC-50). Das Leben behaelt seinen Anteil - ein halb toter Ritter wird ein
  // halb toter Dorfbewohner, kein heiler.
  abruestenTakten(einheit) {
    if (this.takt < einheit.auftrag.bis) return;
    const anteil = einheit.leben / this.lebenMax(einheit.besitzer, einheit.art);
    einheit.art = ABRUESTEN.wird;
    einheit.leben = Math.max(1, Math.round(anteil * this.lebenMax(einheit.besitzer, einheit.art)));
    einheit.ladung = 0;
    einheit.ladungsart = null;
    einheit.auftrag = einheit.auftrag.folge || null;
  }

  // ---- Dracheneier (einheiten AC-51) ------------------------------------

  /** Das Ei am Boden hoechstens ein Feld vom Klick, wenn der Spieler es sieht. */
  eiAn(spielerId, x, y) {
    for (const ei of this.eier.values()) {
      if (!this.eiAmBoden(ei)) continue;
      // Wo ein Drache fiel, sieht jeder das Ei (einheiten AC-53).
      if (Math.hypot(ei.x - x, ei.y - y) <= 1.01 && (ei.gefallen || this.sieht(spielerId, ei.x, ei.y))) return ei;
    }
    return null;
  }

  /** Ob das Ei am Boden liegt - nicht getragen, nicht im Kloster, kein Drache. */
  eiAmBoden(ei) {
    return ei.traeger === null && ei.kloster === null && ei.drache === null;
  }

  /** Das Ei, das diese Einheit traegt - oder null. */
  eiVon(einheit) {
    for (const ei of this.eier.values()) if (ei.traeger === einheit.id) return ei;
    return null;
  }

  /** Wie viele Eier in diesem Kloster liegen. */
  eierIn(kloster) {
    let n = 0;
    for (const ei of this.eier.values()) if (ei.kloster === kloster.id) n++;
    return n;
  }

  /**
   * Ein Ei holen: ein Dorfbewohner geht hin und hebt es auf; wer abruesten
   * kann, geht hin und ruestet dafuer ab (einheiten AC-50). Alle anderen -
   * Moench, Ramme, Karren - gehen nur. Gibt zurueck, ob es ein Holen ist.
   */
  eiHolen(einheit, ei) {
    if (einheit.art !== ABRUESTEN.wird && !ruestetAb(einheit.art)) return false;
    einheit.auftrag = { art: 'ei', ei: ei.id };
    einheit.weg = this.wegNach(einheit, { x: ei.x, y: ei.y });
    return true;
  }

  eiTakten(einheit) {
    const ei = this.eier.get(einheit.auftrag.ei);
    // Schon aufgehoben oder im Kloster: dann gibt es nichts mehr zu holen.
    if (!ei || !this.eiAmBoden(ei)) {
      einheit.auftrag = null;
      return;
    }
    if (Math.hypot(einheit.x - ei.x, einheit.y - ei.y) > DRACHE.ei.greifen) {
      const weg = this.wegNach(einheit, { x: ei.x, y: ei.y });
      if (weg.length) einheit.weg = weg;
      else einheit.auftrag = null;
      return;
    }
    // Ein Soldat ruestet erst ab und hebt es danach auf (einheiten AC-50).
    if (einheit.art !== ABRUESTEN.wird) {
      if (this.abruestenStarten(einheit, { art: 'ei', ei: ei.id })) einheit.auftrag = null;
      return;
    }
    // Was er sonst traegt, laesst er fallen: das Ei ist seine Ladung.
    ei.traeger = einheit.id;
    ei.gefallen = false;
    einheit.ladung = 1;
    einheit.ladungsart = 'ei';
    einheit.angefangen = 0;
    const kloster = this.naechstesKloster(einheit);
    if (kloster) this.eiBringenBeginnen(einheit, kloster);
    else einheit.auftrag = null;
  }

  /** Das naechste eigene, fertige Kloster - oder null. */
  naechstesKloster(einheit) {
    let bestes = null;
    let weite = Infinity;
    for (const g of this.gebaeude.values()) {
      if (g.besitzer !== einheit.besitzer || g.art !== 'kloster' || !g.fertig) continue;
      const d = this.abstandZu(einheit, g);
      if (d < weite) {
        weite = d;
        bestes = g;
      }
    }
    return bestes;
  }

  eiBringenBeginnen(einheit, kloster) {
    einheit.auftrag = { art: 'eiBringen', kloster: kloster.id };
    einheit.weg = this.wegZurBaustelle(einheit, kloster);
  }

  eiBringenTakten(einheit) {
    const ei = this.eiVon(einheit);
    if (!ei) {
      einheit.auftrag = null;
      return;
    }
    let kloster = this.gebaeude.get(einheit.auftrag.kloster);
    if (!kloster || kloster.besitzer !== einheit.besitzer || !kloster.fertig) {
      kloster = this.naechstesKloster(einheit);
      if (!kloster) {
        einheit.auftrag = null;
        return;
      }
      einheit.auftrag.kloster = kloster.id;
    }
    if (this.abstandZu(einheit, kloster) > 1.2) {
      einheit.weg = this.wegZurBaustelle(einheit, kloster);
      if (!einheit.weg.length) einheit.auftrag = null;
      return;
    }
    ei.traeger = null;
    ei.kloster = kloster.id;
    einheit.ladung = 0;
    einheit.ladungsart = null;
    einheit.auftrag = null;
    this.gebaeudeGeaendert(kloster);
  }

  // ---- Der Drache (bauen AC-35, einheiten AC-52 bis AC-54) ---------------

  /** Der lebende Drache dieses Spielers - oder null. Es gibt hoechstens einen. */
  dracheVon(spielerId) {
    for (const e of this.einheiten.values()) if (!e.tot && e.besitzer === spielerId && EINHEITEN[e.art].gerufen) return e;
    return null;
  }

  /** Das Kloster, an dem dieser Spieler gerade ruft - oder null. */
  rufVon(spielerId) {
    for (const g of this.gebaeude.values()) if (g.ruf && g.besitzer === spielerId) return g;
    return null;
  }

  /**
   * Den Drachen rufen (bauen AC-35): ein eigenes, fertiges Kloster mit einem
   * Ei, bezahlt beim Beginn. Hoechstens ein Drache je Spieler - wer einen hat
   * oder schon ruft, ruft nicht. Ist die Einstellung "Drache" aus, gibt es
   * den Auftrag nicht.
   */
  rufen(spielerId, gebaeudeId) {
    if (!this.drachenAn) return { fehler: 'In dieser Partie gibt es keinen Drachen.' };
    const kloster = this.gebaeude.get(gebaeudeId);
    if (!kloster || kloster.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebäude.' };
    if (kloster.art !== 'kloster' || !kloster.fertig) return { fehler: 'Gerufen wird an einem fertigen Kloster.' };
    const spieler = this.spielerVon(spielerId);
    if (spieler.zeitalter < (EINHEITEN.drache.zeitalter || 0)) return { fehler: `Den Drachen gibt es erst ${ZEITALTER[EINHEITEN.drache.zeitalter].ab}.` };
    const ei = [...this.eier.values()].find((e) => e.kloster === kloster.id);
    if (!ei) return { fehler: 'Ohne Drachenei ruft niemand einen Drachen.' };
    if (this.dracheVon(spielerId)) return { fehler: 'Du hast schon einen Drachen.' };
    if (this.rufVon(spielerId)) return { fehler: 'Du rufst schon einen Drachen.' };
    const kosten = DRACHE.rufen.kosten;
    const fehlt = Object.keys(kosten).find((r) => spieler[r] < kosten[r]);
    if (fehlt) return { fehler: `Zu wenig ${ROHSTOFF_NAMEN[fehlt]}.` };
    for (const [r, m] of Object.entries(kosten)) spieler[r] -= m;
    kloster.ruf = { ei: ei.id, takte: 0, moenche: this.moencheAm(kloster) };
    this.gebaeudeGeaendert(kloster);
    return {};
  }

  /** Wie viele eigene, lebende Moenche am Kloster stehen (bauen AC-35). */
  moencheAm(kloster) {
    let n = 0;
    for (const e of this.einheiten.values()) {
      if (e.tot || e.besitzer !== kloster.besitzer || !EINHEITEN[e.art].heilen || e.weg.length) continue;
      if (this.abstandZu(e, kloster) <= DRACHE.rufen.umkreis) n++;
    }
    return n;
  }

  /**
   * Die Uhr des Rufs laeuft nur, solange `DRACHE.rufen.moenche` eigene Moenche
   * am Kloster stehen. Ist sie um, steigt der Drache aus dem Kloster - das
   * Ei ist nun er. Ist kein Wohnraum frei, wartet er wie jede Einheit
   * (bauen AC-15).
   */
  rufTakten(kloster, bevoelkerung) {
    const ruf = kloster.ruf;
    const moenche = this.takt % WACHE_TAKTE === 0 ? this.moencheAm(kloster) : ruf.moenche;
    if (moenche !== ruf.moenche) {
      ruf.moenche = moenche;
      this.gebaeudeGeaendert(kloster);
    }
    if (moenche < DRACHE.rufen.moenche) return;
    if (ruf.takte < DRACHE.rufen.sekunden * TAKTE_PRO_SEKUNDE) {
      ruf.takte++;
      return;
    }
    const spieler = this.spielerVon(kloster.besitzer);
    const belegt = bevoelkerung.get(spieler.id) || 0;
    if (belegt >= this.wohnraum(spieler)) return;
    const ei = this.eier.get(ruf.ei);
    const { x0, y0, x1, y1 } = this.grundflaeche(kloster.art, kloster.x, kloster.y, kloster.quer);
    const drache = this.einheitAnlegen(spieler.id, (x0 + x1) / 2, (y0 + y1) / 2, 'drache');
    kloster.ruf = null;
    if (ei) {
      ei.kloster = null;
      ei.drache = drache.id;
    }
    drache.hunger = 0;
    spieler.futter = 0;
    spieler.ausgebildet++;
    spieler.ausgebildetWert += kostenSumme(DRACHE.rufen.kosten);
    bevoelkerung.set(spieler.id, belegt + 1);
    this.gebaeudeGeaendert(kloster);
  }

  /**
   * Der Drache frisst (einheiten AC-54): je Sekunde `nahrungJeSekunde`
   * Nahrung, abgebucht in ganzen Stuecken. Ist keine da, hungert er und
   * verliert `hungerJeSekunde` Leben, bis er faellt - wo er gerade ist.
   * Kein Schlag, kein Angreifer: niemand bekommt Punkte, und gemeldet wird
   * kein Angriff.
   */
  drachenFuettern() {
    for (const drache of this.einheiten.values()) {
      if (drache.tot || !EINHEITEN[drache.art].gerufen) continue;
      const spieler = this.spielerVon(drache.besitzer);
      spieler.futter = (spieler.futter || 0) + DRACHE.fressen.nahrungJeSekunde / TAKTE_PRO_SEKUNDE;
      if (spieler.futter >= 1) {
        const stueck = Math.floor(spieler.futter);
        const gegessen = Math.min(stueck, Math.floor(spieler.nahrung));
        spieler.nahrung -= gegessen;
        spieler.futter -= stueck;
        // Was fehlte, ist Hunger.
        if (gegessen < stueck) drache.hungert = true;
        else drache.hungert = false;
      }
      if (!drache.hungert) continue;
      drache.hunger = (drache.hunger || 0) + DRACHE.fressen.hungerJeSekunde / TAKTE_PRO_SEKUNDE;
      if (drache.hunger < 1) continue;
      const verlust = Math.floor(drache.hunger);
      drache.hunger -= verlust;
      drache.leben -= verlust;
      if (drache.leben <= 0) {
        drache.fallrichtung = null;
        this.einheitSterben(drache);
      }
    }
  }

  /**
   * Faellt der Drache, liegt sein Ei dort (einheiten AC-53) - auf dem
   * naechsten Feld, auf dem man es aufheben kann, denn er stirbt auch ueber
   * Wasser und Wald. Alle sehen die Ansage, und das Ei steht fuer alle auf
   * der Karte, bis es einer aufhebt.
   */
  dracheFaellt(drache) {
    const ei = [...this.eier.values()].find((e) => e.drache === drache.id);
    const feld = this.freiesBodenfeld(drache);
    if (ei) {
      ei.drache = null;
      ei.gefallen = true;
      this.eiAblegen(ei, feld.x, feld.y);
    }
    this.drachenFaelle = this.drachenFaelle.filter((f) => f.bis > this.takt);
    this.drachenFaelle.push({ wer: drache.besitzer, x: feld.x, y: feld.y, bis: this.takt + DRACHE.gefallen.sekunden * TAKTE_PRO_SEKUNDE });
  }

  /** Das naechste begehbare Feld ohne Gebaeude, ringweise um einen Punkt. */
  freiesBodenfeld(um) {
    const mx = Math.round(um.x);
    const my = Math.round(um.y);
    for (let r = 0; r < this.karte.groesse; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = mx + dx;
          const y = my + dy;
          if (karten.begehbar(this.karte, x, y) && !this.gebaeudeAn(x, y)) return { x, y };
        }
      }
    }
    return { x: mx, y: my };
  }

  /** Das Ei liegt hier am Boden - der Traeger fiel, das Kloster stuerzte. */
  eiAblegen(ei, x, y) {
    ei.traeger = null;
    ei.kloster = null;
    ei.x = Math.round(x);
    ei.y = Math.round(y);
  }

  // Das naechste eigene Tier hoechstens ein Feld vom Klick entfernt.
  tierAn(spielerId, x, y) {
    let bestes = null;
    let besterAbstand = 1.01;
    for (const tier of this.tiere.values()) {
      if (tier.besitzer !== spielerId) continue;
      const abstand = Math.hypot(tier.x - x, tier.y - y);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = tier;
      }
    }
    return bestes;
  }

  // Neben das Tier, nicht darauf - sonst verdeckt der Hirte den Kadaver. Und
  // jeder auf seinen Platz (einheiten AC-30).
  wegZumTier(einheit, tier) {
    const stand = this.standplatz(einheit, tier, TIER_WEIT) || this.standplatz(einheit, tier, TIER_WEIT, true);
    einheit.auftrag.stand = stand;
    einheit.weg = stand ? this.wegZumPlatz(einheit, stand) : [];
  }

  // Am Tier: beim ersten Mal schlachten, dann Nahrung nehmen wie an einem
  // Vorrat. Ist es leer, geht es zum naechsten eigenen Tier in der Naehe.
  tierTakten(einheit) {
    let tier = this.tiere.get(einheit.auftrag.tier);
    if (!tier) {
      tier = this.naechstesTier(einheit);
      if (!tier) {
        einheit.auftrag = null;
        einheit.sammelt = false;
        return;
      }
      einheit.auftrag = { art: 'tier', tier: tier.id };
    }
    if (einheit.ladung >= this.tragkraft(einheit)) {
      einheit.sammelt = false;
      this.abladen(einheit);
      return;
    }
    // Ein Nachbarfeld, auch schraeg (Wurzel aus 2), gilt als am Tier -
    // gearbeitet wird vom eigenen Platz aus (einheiten AC-30).
    if (!this.amStand(einheit) || Math.hypot(einheit.x - tier.x, einheit.y - tier.y) > TIER_WEIT) {
      einheit.sammelt = false;
      this.wegZumTier(einheit, tier);
      if (einheit.weg.length) return;
      if (!this.amStand(einheit)) {
        einheit.auftrag = null;
        return;
      }
    }
    if (!tier.geschlachtet) {
      tier.geschlachtet = true;
      this.tierAenderungen.push(tier.id);
    }
    einheit.sammelt = true;
    einheit.angefangen += TIERE[tier.art].rate / TAKTE_PRO_SEKUNDE;
    if (einheit.angefangen < 1) return;
    einheit.angefangen -= 1;
    this.tierNahrungNehmen(tier);
    einheit.ladung += 1;
    einheit.ladungsart = 'nahrung';
    if (!this.tiere.has(tier.id) || einheit.ladung >= this.tragkraft(einheit)) einheit.sammelt = false;
  }

  tierNahrungNehmen(tier) {
    tier.nahrung -= 1;
    this.tierAenderungen.push(tier.id);
    if (tier.nahrung <= 0) this.tiere.delete(tier.id);
  }

  naechstesTier(einheit) {
    let bestes = null;
    let besterAbstand = SUCHWEITE_ERSATZ;
    for (const tier of this.tiere.values()) {
      if (tier.besitzer !== einheit.besitzer) continue;
      // Angefangene Kadaver zuerst: sie verlieren sonst Nahrung.
      const abstand = Math.hypot(tier.x - einheit.x, tier.y - einheit.y) - (tier.geschlachtet ? SUCHWEITE_ERSATZ : 0);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = tier;
      }
    }
    return bestes;
  }

  // Ein Kadaver, an dem niemand arbeitet, verliert je 4 Sekunden eine Nahrung.
  tiereTakten() {
    // Getriebene Schafe laufen; eine Aenderung geht nur, wenn sie sich bewegen.
    for (const tier of this.tiere.values()) {
      if (!tier.weg.length || tier.geschlachtet) continue;
      // Dieselbe Regel wie fuer Einheiten (einheiten AC-70): der Rest des
      // Takts geht am Wegpunkt weiter. Zwischen zwei Wegpunkten steht ein
      // Schaf auf Hundertstel gerundet - so wenig geht ueber die Leitung.
      wegGehen(tier, TIERE[tier.art].tempo / TAKTE_PRO_SEKUNDE, 100);
      this.tierAenderungen.push(tier.id);
    }
    // Einmal je Sekunde: fremde Schafe in Sichtweite wechseln den Besitzer,
    // wenn nur einer sie sieht und der alte Besitzer keine Einheit dort hat.
    if (this.takt % TAKTE_PRO_SEKUNDE === 0) this.schafeUebernehmen();
    const bearbeitet = new Set();
    for (const einheit of this.einheiten.values()) {
      if (einheit.sammelt && einheit.auftrag?.art === 'tier') bearbeitet.add(einheit.auftrag.tier);
    }
    for (const tier of [...this.tiere.values()]) {
      if (!tier.geschlachtet || bearbeitet.has(tier.id)) continue;
      tier.verfall += 1;
      if (tier.verfall < TIERE[tier.art].verfall * TAKTE_PRO_SEKUNDE) continue;
      tier.verfall = 0;
      this.tierNahrungNehmen(tier);
    }
  }

  schafeUebernehmen() {
    for (const tier of this.tiere.values()) {
      if (tier.geschlachtet) continue;
      const sicht = TIERE[tier.art].sicht;
      const nahe = new Set();
      for (const einheit of this.einheiten.values()) {
        if (Math.abs(einheit.x - tier.x) > sicht || Math.abs(einheit.y - tier.y) > sicht) continue;
        if (Math.hypot(einheit.x - tier.x, einheit.y - tier.y) <= sicht) nahe.add(einheit.besitzer);
      }
      if (nahe.size !== 1 || nahe.has(tier.besitzer)) continue;
      tier.besitzer = [...nahe][0];
      tier.weg = [];
      this.tierAenderungen.push(tier.id);
    }
  }

  // Zum Vorrat heisst: auf einen freien Platz neben ihm (einheiten AC-30).
  // Sind dort alle vergeben, nimmt der Sammler einen Vorrat derselben Art
  // daneben; erst wenn es auch dort keinen gibt, teilt er einen Platz. Hat
  // der Vorrat gar kein begehbares Nachbarfeld, bleibt es dabei: kein Weg
  // (ki AC-12 liest daran, dass ein Busch eingemauert ist).
  wegZumVorrat(einheit) {
    const auftrag = einheit.auftrag;
    // `seite`: das Feld am Vorrat, das `vorratErsatz` als erreichbar gefunden
    // hat (einheiten AC-63) - der Platz liegt dann auf diesem Feld; die
    // anderen Seiten sind zu, auch wenn sie in Luftlinie naeher liegen.
    const seite = auftrag.seite && karten.begehbar(this.karte, auftrag.seite.x, auftrag.seite.y) ? auftrag.seite : null;
    let stand = this.standplatz(einheit, auftrag.feld, SAMMELN_WEIT, false, seite);
    if (!stand) {
      const geteilt = this.standplatz(einheit, auftrag.feld, SAMMELN_WEIT, true, seite);
      if (geteilt) {
        for (const feld of this.vorraeteUm(auftrag.feld, 49)) {
          stand = this.standplatz(einheit, feld, SAMMELN_WEIT);
          if (!stand) continue;
          auftrag.feld = feld;
          // Ein anderer Vorrat: die erreichbare Seite des alten gilt nicht mehr.
          delete auftrag.seite;
          break;
        }
        stand ??= geteilt;
      }
    }
    auftrag.stand = stand;
    einheit.weg = stand ? this.wegZumPlatz(einheit, stand) : [];
  }

  /**
   * Der Platz eines Sammlers neben seinem Vorrat oder Tier (einheiten AC-30):
   * von den begehbaren Nachbarfeldern des Ziels der naechste freie der je vier
   * Plaetze (`STANDPLAETZE`), nicht weiter als `weit` vom Ziel. Vergeben ist
   * ein Platz, solange ein anderer ihn im Auftrag traegt - auch waehrend er
   * zum Lager geht: so bleibt die Verteilung stehen, statt bei jedem Gang zu
   * wechseln. Wer selbst neu waehlt (nach jedem Abladen), nimmt den jetzt
   * naechsten und rueckt damit von selbst auf, wenn einer frei geworden ist.
   *
   * @param {{x: number, y: number}} ziel das Feld des Vorrats oder die Lage des Tiers
   * @param {number} weit so weit vom Ziel darf der Platz liegen
   * @param {boolean} [geteilt] auch vergebene Plaetze - der letzte Ausweg
   * @param {{x: number, y: number} | null} [nur] nur Plaetze auf diesem Nachbarfeld (einheiten AC-63)
   * @returns {{x: number, y: number} | null}
   */
  standplatz(einheit, ziel, weit, geteilt = false, nur = null) {
    const nummer = (x, y) => Math.round(y * 4) * this.karte.groesse * 4 + Math.round(x * 4);
    const vergeben = new Set();
    if (!geteilt) {
      for (const o of this.einheiten.values()) {
        if (o === einheit || o.tot) continue;
        const s = o.auftrag?.stand || o.auftrag?.zurueck?.stand;
        if (s) vergeben.add(nummer(s.x, s.y));
      }
    }
    const fx = Math.round(ziel.x);
    const fy = Math.round(ziel.y);
    let bester = null;
    let naechster = Infinity;
    for (const [dx, dy] of NACHBARFELDER) {
      if (!karten.begehbar(this.karte, fx + dx, fy + dy)) continue;
      if (nur && (nur.x !== fx + dx || nur.y !== fy + dy)) continue;
      for (const [vx, vy] of STANDPLAETZE) {
        const x = fx + dx + vx;
        const y = fy + dy + vy;
        if (Math.hypot(x - ziel.x, y - ziel.y) > weit || vergeben.has(nummer(x, y))) continue;
        const abstand = Math.hypot(x - einheit.x, y - einheit.y);
        if (abstand < naechster) {
          naechster = abstand;
          bester = { x, y };
        }
      }
    }
    return bester;
  }

  // Steht die Einheit auf dem Platz, den ihr Auftrag nennt?
  amStand(einheit) {
    const stand = einheit.auftrag?.stand;
    return Boolean(stand) && einheit.x === stand.x && einheit.y === stand.y;
  }

  /**
   * Ein Weg, der auf einem Platz innerhalb eines Feldes endet (einheiten
   * AC-30): gesucht wird bis zum Feld, der letzte Schritt geht auf den Platz
   * statt auf die Feldmitte. Schraeg ist das letzte Stueck nur, wenn die Suche
   * es schraeg erlaubt hat - beide Ecken sind dann frei. Liegt der Platz auf
   * einer Feldmitte, ist es ein gewoehnlicher Weg.
   */
  wegZumPlatz(einheit, platz) {
    const feld = { x: Math.round(platz.x), y: Math.round(platz.y) };
    const von = this.feldVon(einheit);
    if (von.x === feld.x && von.y === feld.y) {
      return einheit.x === platz.x && einheit.y === platz.y ? [] : [{ x: platz.x, y: platz.y }];
    }
    const weg = suchen(this.karte, von, feld, this.toreVon(einheit.besitzer));
    if (weg.length) weg[weg.length - 1] = { x: platz.x, y: platz.y };
    return weg;
  }

  // Abgegeben wird am naechsten fertigen eigenen Gebaeude, das den Rohstoff
  // annimmt (einheiten AC-16) - gemessen an seinem Rand.
  lagerFuer(einheit) {
    // Wer zu einem bestimmten Lager geschickt wurde, gibt dort ab - solange
    // es steht und die Ladung annimmt (einheiten AC-56).
    const wunsch = einheit.auftrag?.art === 'abgeben' ? this.gebaeude.get(einheit.auftrag.gebaeude) : null;
    if (wunsch && wunsch.fertig && wunsch.besitzer === einheit.besitzer
      && GEBAEUDE[wunsch.art].annahme.includes(einheit.ladungsart)) return wunsch;
    let bestes = null;
    let besterAbstand = Infinity;
    for (const gebaeude of this.gebaeude.values()) {
      if (gebaeude.besitzer !== einheit.besitzer || !gebaeude.fertig) continue;
      if (!GEBAEUDE[gebaeude.art].annahme.includes(einheit.ladungsart)) continue;
      const abstand = this.abstandZu(einheit, gebaeude);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = gebaeude;
      }
    }
    return bestes;
  }

  /**
   * Die Ladung abgeben und sonst nichts (einheiten AC-55, AC-56). Ohne
   * `lager` am naechsten, das sie annimmt. Aus einer laufenden Arbeit heraus
   * - Sammeln, Tier, Farm - merkt sich der Auftrag sie als `zurueck`, und
   * `abladen` setzt sie danach fort.
   */
  abgebenBeginnen(einheit, lager = null) {
    const alt = einheit.auftrag;
    const zurueck = lager && alt && ['sammeln', 'tier', 'farm'].includes(alt.art) && !alt.leer ? alt : null;
    einheit.auftrag = { art: 'abgeben', ...(lager ? { gebaeude: lager.id } : {}), ...(zurueck ? { zurueck } : {}) };
    einheit.sammelt = false;
    this.wegZumLager(einheit);
  }

  wegZumLager(einheit) {
    // Wer eben keinen Weg zu irgendeinem Lager fand, sucht erst nach einer
    // Pause wieder - auch nicht den ersten Weg. Eine vergebliche Suche
    // durchflutet das ganze erreichbare Gebiet, und wer festsitzt, kommt in
    // jedem Takt hierher: 30 Holzfaeller vor einem abgeschnittenen Lager
    // kosteten 47 ms je Takt, schon vor Runde 91 (Durchsicht Runde 91,
    // gemessen).
    if (this.takt < (einheit.lagerSucheAb || 0)) {
      einheit.weg = [];
      return;
    }
    const lager = this.lagerFuer(einheit);
    const stand = lager && this.randfeld(lager, einheit);
    einheit.weg = stand ? suchen(this.karte, this.feldVon(einheit), stand, this.toreVon(einheit.besitzer)) : [];
    if (einheit.weg.length) return;
    if (!lager) {
      einheit.lagerSucheAb = this.takt + this.lagerPause(einheit);
      return;
    }
    // Kein Weg zum naechsten Rand des naechsten Lagers: andere Randfelder,
    // dann die anderen Lager, nach Abstand (ki AC-10). Die KI stellte ein
    // Holzfaellerlager in eine Waldluecke, deren Rand zum Holzfaeller hin
    // zugewachsen war; drei Holzfaeller standen beim Startwert 17 mit voller
    // Ladung 45 bis 53 Sekunden am Wald (Runde 91, gemessen).
    //
    // Je Lager nur **ein** weiteres Randfeld - das naechste, das nicht schon
    // versucht wurde; die Randfelder eines Lagers liegen fast immer im selben
    // Gebiet. Bleibt alles vergeblich, die Pause (siehe oben).
    const von = this.feldVon(einheit);
    const lagerListe = [...this.gebaeude.values()]
      .filter((g) => g.besitzer === einheit.besitzer && g.fertig && GEBAEUDE[g.art].annahme.includes(einheit.ladungsart))
      .sort((a, b) => this.abstandZu(einheit, a) - this.abstandZu(einheit, b))
      .slice(0, 3);
    for (const l of lagerListe) {
      const feld = this.randfelder(l, einheit).find((f) => l !== lager || f.x !== stand.x || f.y !== stand.y);
      if (!feld) continue;
      const weg = suchen(this.karte, von, feld, this.toreVon(einheit.besitzer));
      if (weg.length) {
        einheit.weg = weg;
        return;
      }
    }
    einheit.lagerSucheAb = this.takt + this.lagerPause(einheit);
  }

  // Die Pause nach einer vergeblichen Suche, nach der Nummer der Einheit
  // gestreut: sonst suchen alle, die zugleich festsassen, im selben Takt wieder
  // - 30 Holzfaeller vor einem abgeschnittenen Lager kosteten so 93 ms in einem
  // Takt (Durchsicht Runde 91, gemessen). Deterministisch, ohne Zufall.
  lagerPause(einheit) {
    let streu = 0;
    for (const zeichen of String(einheit.id)) streu = (streu * 31 + zeichen.charCodeAt(0)) % LAGER_SUCHE_PAUSE;
    return LAGER_SUCHE_PAUSE + streu;
  }

  // Alle begehbaren Felder unmittelbar um die Grundflaeche, nach Abstand zu `von`.
  randfelder(gebaeude, von) {
    const { x0, y0, x1, y1 } = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y, gebaeude.quer);
    const felder = [];
    for (let fy = Math.floor(y0) - 1; fy <= Math.ceil(y1) + 1; fy++) {
      for (let fx = Math.floor(x0) - 1; fx <= Math.ceil(x1) + 1; fx++) {
        if (fx > x0 - 1 && fx < x1 + 1 && fy > y0 - 1 && fy < y1 + 1) continue;
        if (!karten.begehbar(this.karte, fx, fy) || this.gebaeudeAn(fx, fy)) continue;
        felder.push({ x: fx, y: fy, d: Math.hypot(fx - von.x, fy - von.y) });
      }
    }
    return felder.sort((a, b) => a.d - b.d).map(({ x, y }) => ({ x, y }));
  }

  // ---- Kampf (kampf AC-1, AC-6 bis AC-8, AC-10) ---------------------------

  // Die naechste fremde, lebende Einheit hoechstens ein Feld vom Klick
  // entfernt - gemessen wie beim eigenen Schaf (einheiten AC-17). Nur wer
  // gesehen wird (kampf AC-11): ein Klick in den Nebel ist ein Gang dorthin,
  // auch wenn dort jemand steht - sonst verriete der Befehl, was der Server
  // nicht schickt (kampf AC-13), und der Spaeher der KI, ins unbekannte Dorf
  // geschickt, griffe den Hirten an, der zufaellig auf dem Feld steht.
  feindAn(spielerId, x, y) {
    let bestes = null;
    let besterAbstand = 1.01;
    for (const einheit of this.einheiten.values()) {
      if (einheit.tot || !this.feindlich(spielerId, einheit.besitzer)) continue;
      if (!this.siehtEinheit(spielerId, einheit)) continue;
      const abstand = Math.hypot(einheit.x - x, einheit.y - y);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = einheit;
      }
    }
    return bestes;
  }

  // Freie Felder um ein Ziel, auf die sich Angreifer verteilen. Das Ziel
  // selbst ist keines - darauf stellt sich niemand.
  angriffsfelder(ziel, anzahl, istGebaeude) {
    const mitte = istGebaeude ? { x: ziel.x, y: ziel.y } : this.feldVon(ziel);
    const felder = this.aufstellungUm(mitte, anzahl + 1).filter((f) => f.x !== mitte.x || f.y !== mitte.y);
    return Object.assign(felder, { mitte });
  }

  /**
   * Dieselben Angriffsfelder, aber die Plaetze derer, die dasselbe Ziel schon
   * angreifen, sind belegt (kampf AC-1: mehrere Angreifer verteilen sich).
   *
   * Ohne das gilt die Verteilung nur **innerhalb eines Befehls**: kommt ein
   * zweiter hinterher - und die KI setzt am Ziel einzeln nach (ki AC-11) -,
   * bekommt der Nachzuegler dasselbe Feld noch einmal, und zwei Angreifer
   * stehen uebereinander. Im Bild zu ki AC-11 waren es drei auf einem Punkt
   * (Runde 85). `wacheTakten` tut dasselbe schon lange, nur fuer Einheiten.
   *
   * @param {string[]} ausser Ids, die jetzt neu verteilt werden - ihr alter
   *   Platz zaehlt nicht als belegt.
   */
  angriffsfelderOhneBesetzte(ziel, anzahl, istGebaeude, ausser) {
    const felder = this.angriffsfelder(ziel, anzahl, istGebaeude);
    const neu = new Set(ausser);
    for (const andere of this.einheiten.values()) {
      if (andere.tot || neu.has(andere.id)) continue;
      const auftrag = andere.auftrag;
      if (auftrag?.art !== 'angreifen' || auftrag.ziel !== ziel.id) continue;
      if (Boolean(auftrag.gebaeude) !== Boolean(istGebaeude)) continue;
      // Wohin er unterwegs ist - und wenn er schon steht, wo er steht.
      const platz = andere.weg.length ? andere.weg[andere.weg.length - 1] : this.feldVon(andere);
      for (const f of felder) if (f.x === platz.x && f.y === platz.y) f.frei = false;
    }
    // Um ein **Gebaeude** auch die Felder, auf denen jemand stillsteht - wer
    // auch immer. Am Dorfzentrum schlachtet die KI ihre Schafe, und der
    // Dorfbewohner steht dort, bis das Schaf leer ist; Annas Miliz bekam genau
    // sein Feld und stand auf ihm (Runde 86, sieben von acht Laeufen). Nur bei
    // Gebaeuden: um ein Gebaeude ist Platz genug, und ein Gefecht zwischen
    // Einheiten soll sich nicht aendern - der Konterkreis haengt daran
    // (Runde 85: eine weite Fassung kippte ihn).
    if (istGebaeude) {
      for (const andere of this.einheiten.values()) {
        if (andere.tot || neu.has(andere.id) || andere.weg.length) continue;
        const platz = this.feldVon(andere);
        for (const f of felder) if (f.x === platz.x && f.y === platz.y) f.frei = false;
      }
    }
    return felder;
  }

  // Gemerkt wird das **Ziel**, nicht sein Platz: eine Einheit laeuft weg.
  // `heimat` steht nur in einem Angriff, den niemand befohlen hat - er begrenzt
  // die Verfolgung (kampf AC-3).
  angriffBeginnen(einheit, ziel, istGebaeude, stand = null, heimat = null) {
    // Die Seite, von der aus angegriffen wird, wird als Versatz zum Ziel
    // gemerkt - nicht als Feld. Ein Ziel laeuft weg, und ohne diesen Versatz
    // suchen danach zwei Angreifer dasselbe Nachbarfeld (Runde 64).
    let platz = null;
    if (stand && !istGebaeude) {
      const feld = this.feldVon(ziel);
      platz = { dx: stand.x - feld.x, dy: stand.y - feld.y };
    }
    // Ein Bauer, der sich wehrt, gibt seine Farm frei - vor dem neuen Auftrag,
    // denn `farmVerlassen` erkennt ihn am alten. `befehl()` tut das schon
    // immer; die Gegenwehr aus `wehren()` ging daran vorbei, und die Farm blieb
    // fuer jeden anderen gesperrt, solange er lebte (Durchsicht Runde 86).
    this.farmVerlassen(einheit);
    einheit.auftrag = {
      art: 'angreifen',
      ziel: ziel.id,
      gebaeude: Boolean(istGebaeude),
      ...(platz ? { platz } : {}),
      ...(heimat ? { heimat } : {}),
    };
    // Wer kaempft, sammelt nicht und baut nicht - das ist der Preis der
    // Gegenwehr (kampf AC-5). `befehl()` raeumt das beim Angriffsbefehl selbst
    // weg (samt Farm, siehe oben); die Gegenwehr aus `wehren()` ging bis Runde
    // 86 daran vorbei, und
    // ein getroffener Dorfbewohner trug auf dem Draht weiter `w` ("arbeitet
    // gerade", bedienung AC-31), waehrend er zurueckschlug.
    einheit.sammelt = false;
    einheit.baut = false;
    einheit.nachladen = 0;
    einheit.weg = stand ? this.wegNach(einheit, stand) : [];
  }

  /**
   * Ein Feld, von dem aus ein Ziel mindestens `mindest` Felder weit weg ist
   * (einheiten AC-36): vom Ziel weg in der Richtung, aus der die Einheit kommt,
   * zwei Felder ueber die Grenze hinaus; ist dort nichts frei, ein wenig
   * gedreht. Gemessen wird wie im Angriff - bei einem Gebaeude vom Rand.
   */
  abstandsplatz(einheit, ziel, istGebaeude, mindest) {
    let mitte = ziel;
    let rand = 0;
    if (istGebaeude) {
      const { x0, y0, x1, y1 } = this.grundflaeche(ziel.art, ziel.x, ziel.y, ziel.quer);
      mitte = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
      rand = (x1 - x0) / 2;
    }
    let richtung = Math.atan2(einheit.y - mitte.y, einheit.x - mitte.x);
    if (einheit.x === mitte.x && einheit.y === mitte.y) richtung = 0;
    for (const weite of [mindest + rand + 2, mindest + rand + 3]) {
      for (const drehung of [0, 0.5, -0.5, 1, -1, 1.6, -1.6]) {
        const x = Math.round(mitte.x + Math.cos(richtung + drehung) * weite);
        const y = Math.round(mitte.y + Math.sin(richtung + drehung) * weite);
        if (karten.begehbar(this.karte, x, y) && !this.gebaeudeAn(x, y)) return { x, y };
      }
    }
    return null;
  }

  /**
   * Wohin ein Nahkaempfer laeuft, der sein Ziel neu suchen muss: auf die Seite,
   * die ihm beim Befehl zugewiesen wurde (`platz`), gemessen am jetzigen Feld
   * des Ziels. Nur die acht Felder rundum taugen - wer weiter aussen aufgestellt
   * war, nimmt wie bisher das naechste Nachbarfeld, sonst stuende er neben dem
   * Kampf.
   */
  angriffsplatz(einheit, ziel, platz) {
    const feld = this.feldVon(ziel);
    if (platz && Math.abs(platz.dx) <= 1 && Math.abs(platz.dy) <= 1) {
      const seite = { x: feld.x + platz.dx, y: feld.y + platz.dy };
      if (karten.begehbar(this.karte, seite.x, seite.y)) return seite;
    }
    return nachbarfeld(this.karte, feld, einheit);
  }

  /**
   * Ein grobes Raster aller lebenden Einheiten. Damit sucht eine Wache nur in
   * ihrer Zelle und den acht Nachbarn statt in der ganzen Partie: aus
   * Einheiten x Einheiten wird Einheiten x Nachbarschaft.
   */
  einheitenRaster() {
    const raster = new Map();
    for (const einheit of this.einheiten.values()) {
      if (einheit.tot) continue;
      const schluessel = `${Math.floor(einheit.x / RASTER_FELDER)},${Math.floor(einheit.y / RASTER_FELDER)}`;
      const zelle = raster.get(schluessel);
      if (zelle) zelle.push(einheit);
      else raster.set(schluessel, [einheit]);
    }
    return raster;
  }

  /**
   * Ob ein Angreifer dieses Ziel treffen kann (kampf AC-23, einheiten
   * AC-35) - die eine Stelle fuer beide Regeln aus den Daten: wer
   * `nurGebaeude` traegt, trifft keine Einheit; wer `fliegt`, wird nur von
   * Einheiten mit einer Klasse aus `getroffenVon` getroffen, die keinen
   * Stein werfen, und von Gebaeuden, die schiessen. Ein Gebaeude trifft
   * jeder, der angreift.
   */
  kannTreffen(angreifer, ziel, istGebaeude = false) {
    const werte = EINHEITEN[angreifer.art];
    if (!werte || istGebaeude) return true;
    if (werte.nurGebaeude) return false;
    const fliegt = EINHEITEN[ziel.art]?.fliegt;
    if (!fliegt) return true;
    return !werte.geschoss && (werte.klassen || []).some((k) => fliegt.getroffenVon.includes(k));
  }

  /**
   * Die naechste fremde, lebende Einheit in Sichtweite - gesucht im Raster.
   * Wer eine Mindestreichweite hat (der Mangonel, einheiten AC-36), nimmt
   * niemanden, der naeher steht: auf den koennte er nicht werfen.
   */
  feindInSicht(einheit, raster, sicht) {
    const mindest = EINHEITEN[einheit.art]?.mindestreichweite || 0;
    const zx = Math.floor(einheit.x / RASTER_FELDER);
    const zy = Math.floor(einheit.y / RASTER_FELDER);
    let bestes = null;
    let besterAbstand = sicht;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const zelle = raster.get(`${zx + dx},${zy + dy}`);
        if (!zelle) continue;
        for (const anderer of zelle) {
          if (!this.feindlich(einheit.besitzer, anderer.besitzer)) continue;
          // Einen Getarnten erst, wenn er entdeckt ist (kampf AC-22).
          if (this.verborgen(einheit.besitzer, anderer)) continue;
          // Den Drachen laesst in Ruhe, wer ihn nicht trifft (kampf AC-23).
          if (EINHEITEN[anderer.art].fliegt && !this.kannTreffen(einheit, anderer)) continue;
          const abstand = Math.hypot(anderer.x - einheit.x, anderer.y - einheit.y);
          if (abstand < mindest) continue;
          // Bei gleichem Abstand der mit der kleineren Nummer, nicht der, den
          // das Raster zuletzt nennt - das hing an der Himmelsrichtung, und
          // gespiegelte Heere waehlten verschieden (kampf AC-26).
          if (abstand < besterAbstand - 1e-9
            || (abstand <= besterAbstand + 1e-9 && (!bestes || anderer.id < bestes.id))) {
            besterAbstand = Math.min(abstand, besterAbstand);
            bestes = anderer;
          }
        }
      }
    }
    return bestes;
  }

  /**
   * Was in die Sichtweite einer stehenden Kampfeinheit kommt, wird ohne Befehl
   * angegriffen (kampf AC-2). Stehend heisst: kein Auftrag und kein Weg - wer
   * unterwegs ist, geht weiter. Gebaeude bleiben ungeschoren; sonst liefe jede
   * Wache ins fremde Dorfzentrum, statt zu Hause zu wachen.
   */
  wacheTakten() {
    const wachen = [];
    for (const einheit of this.reiheJetzt()) {
      if (einheit.tot || einheit.auftrag?.art === 'angreifen') continue;
      // Wer im Angriffslauf ist, sieht sich auch **unterwegs** um (kampf AC-4);
      // alle anderen nur im Stehen - ein Sammler soll seine Arbeit nicht
      // wegen eines Vorbeireitenden liegen lassen (kampf AC-2).
      if (einheit.angriffslauf) {
        // Die Wache sucht Einheiten - eine Ramme greift keine an und faehrt
        // im Angriffslauf nur bis ans Ziel (einheiten AC-35).
        if (this.einheitenwert(einheit.besitzer, einheit.art, 'angriff') > 0 && !EINHEITEN[einheit.art].nurGebaeude) wachen.push(einheit);
        continue;
      }
      if (einheit.auftrag || einheit.weg.length) continue;
      if (!EINHEITEN[einheit.art].wacht) continue;
      wachen.push(einheit);
    }
    if (!wachen.length) return;
    const raster = this.einheitenRaster();
    const funde = [];
    for (const einheit of wachen) {
      const feind = this.feindInSicht(einheit, raster, this.einheitenwert(einheit.besitzer, einheit.art, 'sicht'));
      if (feind) funde.push({ einheit, feind });
    }
    if (!funde.length) return;
    // Mehrere Waechter desselben Ziels verteilen sich darum, statt uebereinander
    // zu stehen: das Ziel wird einmal aufgestellt, jeder nimmt das naechste
    // noch freie Feld. Ohne das standen zwei Milizen, die zusammen losgeschickt
    // wurden, auf demselben Punkt (Runde 67) - `nachbarfeld` fragt die Karte,
    // nicht die Einheiten.
    const felderJeZiel = new Map();
    for (const { feind } of funde) {
      if (!felderJeZiel.has(feind.id)) felderJeZiel.set(feind.id, this.angriffsfelder(feind, 8, false));
    }
    for (const andere of this.reiheJetzt()) {
      const auftrag = andere.auftrag;
      if (andere.tot || auftrag?.art !== 'angreifen' || auftrag.gebaeude || !auftrag.platz) continue;
      const felder = felderJeZiel.get(auftrag.ziel);
      const ziel = felder && this.einheiten.get(auftrag.ziel);
      if (!ziel) continue;
      const feld = this.feldVon(ziel);
      for (const f of felder) {
        if (f.x === feld.x + auftrag.platz.dx && f.y === feld.y + auftrag.platz.dy) f.frei = false;
      }
    }
    for (const { einheit, feind } of funde) {
      const stand = this.einheitenwert(einheit.besitzer, einheit.art, 'reichweite')
        ? null
        : this.naechstesFreies(einheit, felderJeZiel.get(feind.id))
          || nachbarfeld(this.karte, this.feldVon(feind), einheit);
      this.angriffBeginnen(einheit, feind, false, stand, this.feldVon(einheit));
    }
  }

  /**
   * Gebaeude, die schiessen (bauen AC-29, kampf AC-20): ein fertiger Turm
   * nimmt die naechste fremde Einheit in Reichweite und schiesst, sooft die
   * Nachladezeit es erlaubt - wie eine wachende Einheit (kampf AC-2), nur
   * ohne Beine. Ein Ziel behaelt er, solange es lebt und in Reichweite ist;
   * sonst verteilte er seine Pfeile auf alle, die gleich nah stehen. Gemessen
   * wird vom Rand der Grundflaeche, damit die Reichweite fuer einen Turm auf
   * einem Feld und eine Burg auf vier dasselbe heisst. Gebaeude beschiesst er
   * nicht - in der Vorlage auch nicht.
   */
  tuermeTakten() {
    if (!SCHIESSENDE.size) return;
    for (const turm of this.gebaeude.values()) {
      if (!SCHIESSENDE.has(turm.art) || !turm.fertig || turm.leben <= 0) continue;
      if (turm.nachladen > 0) {
        turm.nachladen--;
        continue;
      }
      const reichweite = this.gebaeudewert(turm.besitzer, turm.art, 'reichweite');
      // Die Grundflaeche einmal je Turm, nicht je Einheit: ein Turm ohne Ziel
      // sieht in jedem Takt alle Einheiten durch (Durchsicht Runde 125).
      const { x0, y0, x1, y1 } = this.grundflaeche(turm.art, turm.x, turm.y, turm.quer);
      const abstandVon = (e) => Math.hypot(Math.max(x0 - e.x, 0, e.x - x1), Math.max(y0 - e.y, 0, e.y - y1));
      let ziel = this.einheiten.get(turm.ziel);
      // Das Ziel bleibt, solange es lebt, in Reichweite steht und ein Gegner
      // ist: ein Bekehrter gehoert im selben Takt nicht mehr dazu (einheiten
      // AC-38) - sonst schoss der Turm weiter auf die eigene Einheit, bis sie
      // einmal aus der Reichweite ging.
      // Ein Getarnter, der wieder verborgen ist, ist auch keines mehr (kampf AC-22).
      if (!ziel || ziel.tot || abstandVon(ziel) > reichweite || !this.feindlich(turm.besitzer, ziel.besitzer)
        || this.verborgen(turm.besitzer, ziel)) {
        ziel = null;
        let bester = Infinity;
        for (const einheit of this.einheiten.values()) {
          if (einheit.tot || !this.feindlich(turm.besitzer, einheit.besitzer)) continue;
          if (this.verborgen(turm.besitzer, einheit)) continue;
          // Erst das Rechteck, dann die Luftlinie.
          if (einheit.x < x0 - reichweite || einheit.x > x1 + reichweite
            || einheit.y < y0 - reichweite || einheit.y > y1 + reichweite) continue;
          const abstand = abstandVon(einheit);
          if (abstand <= reichweite && abstand < bester) {
            bester = abstand;
            ziel = einheit;
          }
        }
      }
      turm.ziel = ziel?.id ?? null;
      if (!ziel) continue;
      // Der erste Pfeil sofort, danach die Nachladezeit aus den Daten - der
      // Takt des Schusses geht mit ab wie bei `angriffTakten()`.
      const nachladen = this.gebaeudewert(turm.besitzer, turm.art, 'nachladen');
      turm.nachladen = Math.round(nachladen * TAKTE_PRO_SEKUNDE) - 1;
      // Eine Salve (bauen AC-32): so viele Pfeile, wie `pfeile` in den Daten
      // sagt, alle auf dasselbe Ziel und jeder fuer sich gegen die Ruestung
      // gerechnet. Ohne den Eintrag ist es einer - der Wachturm.
      const pfeile = GEBAEUDE[turm.art].pfeile || 1;
      for (let i = 0; i < pfeile; i++) this.schlagen(turm, ziel, false);
    }
  }

  /**
   * Nach einem Gefecht unterwegs geht es weiter zum Marschziel (kampf AC-4).
   * Ohne Angriffslauf tut das nichts - dann bleibt stehen, wer gekaempft hat.
   */
  /**
   * Das naechste Ziel aus der Reihe der Angriffe (bedienung AC-50): wer
   * inzwischen gefallen, fort oder kein Gegner mehr ist, wird uebersprungen.
   *
   * @returns {boolean} ob ein neuer Angriff begonnen hat
   */
  naechsterAngriff(einheit) {
    while (einheit.angriffe.length) {
      const { ziel: id, gebaeude } = einheit.angriffe.shift();
      const ziel = gebaeude ? this.gebaeude.get(id) : this.einheiten.get(id);
      if (!ziel || ziel.tot || !this.feindlich(einheit.besitzer, ziel.besitzer)) continue;
      this.angriffBeginnen(einheit, ziel, gebaeude);
      return true;
    }
    return false;
  }

  marschFortsetzen(einheit) {
    if (!einheit.angriffslauf) return;
    const feld = einheit.angriffslauf;
    einheit.auftrag = { art: 'gehen', feld };
    einheit.weg = this.wegNach(einheit, feld);
  }

  // Ein Takt im Angriff: hinlaufen, bis das Ziel in Reichweite ist, dann
  // zuschlagen, sooft die Nachladezeit es erlaubt (kampf AC-1, AC-7).
  angriffTakten(einheit) {
    einheit.sammelt = false;
    einheit.baut = false;
    const auftrag = einheit.auftrag;
    const ziel = auftrag.gebaeude ? this.gebaeude.get(auftrag.ziel) : this.einheiten.get(auftrag.ziel);
    // Das Ziel ist gefallen, waehrend der Angreifer noch hinlief: stehenbleiben,
    // nicht auf das leere Feld weiterlaufen. Ebenso, wenn ein Getarnter wieder
    // verborgen ist (kampf AC-22): wen der Spieler nicht sieht, den verfolgt
    // auch seine Einheit nicht.
    if (!ziel || ziel.tot || (!auftrag.gebaeude && this.verborgen(einheit.besitzer, ziel))) {
      // Die Mauer ist gebrochen (kampf AC-21): weiter zum Ziel dahinter.
      const danach = auftrag.danach;
      const dahinter = danach && (danach.gebaeude ? this.gebaeude.get(danach.ziel) : this.einheiten.get(danach.ziel));
      if (dahinter && !dahinter.tot) {
        this.angriffBeginnen(einheit, dahinter, danach.gebaeude, null, auftrag.heimat);
        return;
      }
      // Steht noch ein Gegner in der Reihe, geht es dorthin (bedienung AC-50).
      if (this.naechsterAngriff(einheit)) return;
      einheit.auftrag = null;
      einheit.weg = [];
      this.marschFortsetzen(einheit);
      return;
    }
    // Ist anderswo eine Mauer gefallen, liegt das Ziel dahinter vielleicht
    // offen (kampf AC-21): dann dorthin, statt weiter auf diese Mauer zu
    // schlagen. In der Belagerung des Pruefstands schlugen sonst zwei
    // Soldaten noch Minuten auf ihr eigenes Feld ein, waehrend die anderen
    // laengst durch die Luecke waren (Runde 139).
    // Und ist das Ziel dahinter inzwischen gefallen, ist die Mauer kein Ziel
    // mehr: stehenbleiben wie bei jedem gefallenen Ziel (Durchsicht Runde 139).
    if (auftrag.danach) {
      const danach = auftrag.danach;
      const dahinter = danach.gebaeude ? this.gebaeude.get(danach.ziel) : this.einheiten.get(danach.ziel);
      if (!dahinter || dahinter.tot) {
        if (this.naechsterAngriff(einheit)) return;
        einheit.auftrag = null;
        einheit.weg = [];
        this.marschFortsetzen(einheit);
        return;
      }
    }
    if (auftrag.danach && auftrag.mauernStand !== (this.mauernGefallen || 0)) {
      auftrag.mauernStand = this.mauernGefallen || 0;
      const danach = auftrag.danach;
      const dahinter = danach.gebaeude ? this.gebaeude.get(danach.ziel) : this.einheiten.get(danach.ziel);
      if (dahinter && !dahinter.tot) {
        const stand = danach.gebaeude ? this.randfeld(dahinter, einheit) : this.angriffsplatz(einheit, dahinter, null);
        const weg = stand ? this.wegNach(einheit, stand) : [];
        if (weg.length) {
          this.angriffBeginnen(einheit, dahinter, danach.gebaeude, null, auftrag.heimat);
          einheit.weg = weg;
          return;
        }
      }
    }
    // Eine Verfolgung, die niemand befohlen hat, endet fuenf Felder vom
    // Ausgangsplatz (kampf AC-3) - sonst zieht ein einzelner Reiter ein ganzes
    // Heer quer ueber die Karte. Die Einheit kehrt dorthin zurueck.
    if (auftrag.heimat
      && Math.hypot(einheit.x - auftrag.heimat.x, einheit.y - auftrag.heimat.y) > VERFOLGUNG_FELDER) {
      einheit.auftrag = null;
      // Im Angriffslauf geht es nicht zurueck, sondern weiter: das Marschziel
      // ist der Sinn des Befehls, der Ausgangsplatz nur eine Zwischenstation.
      if (einheit.angriffslauf) this.marschFortsetzen(einheit);
      else einheit.weg = this.wegNach(einheit, auftrag.heimat);
      return;
    }
    const fern = this.einheitenwert(einheit.besitzer, einheit.art, 'reichweite');
    const reichweite = fern || 1;
    // Eine Einheit als Ziel misst von ihrer Lage zu Beginn des Takts (kampf
    // AC-26): wer vorher in der Liste steht und schon auf den anderen zuging,
    // braechte ihn sonst einen Takt frueher in Reichweite als sich selbst.
    const abstand = auftrag.gebaeude
      ? this.abstandZu(einheit, ziel)
      : Math.hypot((ziel.taktX ?? ziel.x) - einheit.x, (ziel.taktY ?? ziel.y) - einheit.y);
    // Zu nah fuer den Mangonel (einheiten AC-36): er faehrt zurueck, bis das
    // Ziel wieder weit genug weg ist, und wirft erst dann.
    const mindest = EINHEITEN[einheit.art].mindestreichweite || 0;
    if (mindest && abstand < mindest) {
      if (!auftrag.zurueck || !einheit.weg.length) {
        const stand = this.abstandsplatz(einheit, ziel, auftrag.gebaeude, mindest);
        einheit.weg = stand ? this.wegNach(einheit, stand) : [];
        auftrag.zurueck = true;
        if (!einheit.weg.length) {
          einheit.auftrag = null;
          return;
        }
      }
      // Nachgeladen wird auch unterwegs - sonst kostete das Zurueckfahren
      // einen ganzen Wurf.
      if (einheit.nachladen > 0) einheit.nachladen--;
      this.laufen(einheit);
      return;
    }
    auftrag.zurueck = false;
    const nahGenug = abstand <= reichweite + (auftrag.gebaeude ? SCHLAGRAND_BAU : SCHLAGRAND);
    // Ein Fernkaempfer bleibt stehen, sobald das Ziel in Reichweite ist. Ein
    // Nahkaempfer geht beim **ersten** Hinlaufen den Platz zu Ende, der ihm
    // zugewiesen wurde - sonst bleiben drei Angreifer dort stehen, wo der erste
    // gerade nah genug war, und stehen im Bild uebereinander (Runde 63). Wer
    // einmal angekommen war, schlaegt dagegen zu, sobald er wieder in
    // Reichweite ist: zwei, die hintereinander herlaufen, kaempfen sonst nie
    // (Runde 64).
    //
    // **Vor einem Gebaeude geht ein Nahkaempfer seinen Platz zu Ende**
    // (Runde 85): dort gilt `angekommen` erst, wenn sein Weg zu Ende ist.
    // Eine Grundflaeche ist breit, also ist jeder schon auf halbem Weg nah
    // genug - und weil `angekommen` im ersten solchen Takt stand, lief er
    // genau einen Takt weiter und blieb stehen. Drei Milizen am selben
    // Dorfzentrum standen deshalb auf demselben Punkt ihres gemeinsamen Wegs,
    // obwohl jede ihr eigenes Feld zugewiesen hatte (im Bild zu ki AC-11).
    //
    // **Nur fuer Gebaeude**, denn die laufen nicht weg. Fuer eine Einheit
    // bleibt es beim alten Verhalten: dort wuerde das Zuendeglaufen die
    // ersten Treffer verzoegern, und der Konterkreis kippte - Reiter gegen
    // Bogen fiel von 20/20 auf 14/20 (fahrplan AC-9, gemessen in Runde 85).
    if (nahGenug && (fern || !auftrag.gebaeude || !einheit.weg.length)) auftrag.angekommen = true;
    if (!nahGenug || (einheit.weg.length && !fern && !auftrag.angekommen)) {
      auftrag.tritt = false;
      if (einheit.weg.length) {
        this.laufen(einheit);
        return;
      }
      // Kein Weg mehr: einen neuen suchen. Findet die Suche keinen, endet der
      // Auftrag - sonst rechnete die Einheit in jedem Takt die ganze Karte ab.
      const stand = auftrag.gebaeude
        ? this.randfeld(ziel, einheit)
        : this.angriffsplatz(einheit, ziel, auftrag.platz);
      einheit.weg = stand ? this.wegNach(einheit, stand) : [];
      // Schon auf dem Platz, und das Ziel ist trotzdem zu weit: es laeuft
      // schraeg davon und steht gerade zwischen zwei Feldern (1,98 Felder
      // statt 1,5). Dann auf sein Feld zu - vorher galt es hier als
      // unerreichbar, der befohlene Angriff endete, und die Wache nahm den
      // Naechstbesten (kampf AC-25; im Spiel auf dem Server: der Spaeher
      // liess den fliehenden Dorfbewohner laufen und schlug einen anderen).
      if (!einheit.weg.length && stand && !auftrag.gebaeude) {
        const hier = this.feldVon(einheit);
        if (hier.x === stand.x && hier.y === stand.y) einheit.weg = this.wegNach(einheit, this.feldVon(ziel));
      }
      if (!einheit.weg.length) {
        // Versperrt eine fremde Mauer den Weg, wird sie angegriffen (kampf
        // AC-21) - aber nur einmal: wer schon eine Mauer angreift und sie
        // nicht erreicht, gibt auf, statt in jedem Takt neu zu suchen. Und
        // nur auf Befehl: wer sich von selbst wehrt (`heimat`, kampf AC-3),
        // bricht keine Mauer, um an einen Feind dahinter zu kommen - sonst
        // stuende eine Wache vor jedem fremden Ring und schluege los, und
        // jede, die einen Feind hinter Wasser sieht, suchte in jedem Takt
        // ein drittes Mal (Durchsicht Runde 139).
        const mauer = auftrag.danach || auftrag.heimat ? null : this.mauerImWeg(einheit, stand);
        if (mauer) {
          const danach = { ziel: auftrag.ziel, gebaeude: auftrag.gebaeude };
          this.angriffBeginnen(einheit, mauer, true, null, auftrag.heimat);
          einheit.auftrag.danach = danach;
          einheit.auftrag.mauernStand = this.mauernGefallen || 0;
        } else if (!this.naechsterAngriff(einheit)) {
          // Unerreichbar: das naechste Ziel der Reihe (bedienung AC-50), sonst steht er.
          einheit.auftrag = null;
        }
      }
      return;
    }
    // Der eine Schritt beiseite (einheiten AC-31): wer auf einem anderen
    // Kaempfer stand, geht auf ein freies Nachbarfeld, das sein Ziel in
    // Schlagweite behaelt - und schlaegt danach von dort. Ohne diese Ausnahme
    // loeschte die naechste Zeile den Schritt, bevor er begann.
    if (auftrag.tritt) {
      if (einheit.weg.length) {
        // Die Nachladezeit laeuft weiter: der Schritt kostet keinen Schlag.
        if (einheit.nachladen > 0) einheit.nachladen--;
        this.laufen(einheit);
        return;
      }
      auftrag.tritt = false;
    }
    einheit.weg = [];
    if (einheit.nachladen > 0) {
      einheit.nachladen--;
      return;
    }
    // Der erste Schlag kommt sofort, danach zaehlt die Nachladezeit aus den
    // Daten (kampf AC-7). Der Takt dieses Schlages geht mit ab, damit zwischen
    // zwei Treffern genau die Zeit der Vorlage liegt und nicht ein Takt mehr.
    const nachladen = this.einheitenwert(einheit.besitzer, einheit.art, 'nachladen');
    einheit.nachladen = Math.round(nachladen * TAKTE_PRO_SEKUNDE) - 1;
    // Wann sie zuschlug, geht mit dem Zustand hinaus: das Bild holt genau
    // dazu aus (bedienung AC-72).
    einheit.schlagTakt = this.takt;
    this.schlagen(einheit, ziel, auftrag.gebaeude);
  }

  /**
   * Die fremde Mauer, die einer Einheit den Weg zu `stand` versperrt (kampf
   * AC-21). Gefragt wird erst, wenn die gewoehnliche Suche keinen Weg fand -
   * gibt es einen aussen herum, geht die Einheit ihn, und hierher kommt sie
   * nie. Gesucht wird noch einmal, diesmal mit fremden Mauern und Toren als
   * begehbar; das erste davon auf dem Weg ist die Stelle, an der gebrochen
   * wird. Andere Gebaeude bleiben Hindernis: wer hinter Haeusern steht, ist
   * weiter unerreichbar (Grenzfall in kampf.md). Null: keine Mauer im Weg.
   */
  mauerImWeg(einheit, stand) {
    if (!stand) return null;
    const g = this.karte.groesse;
    const sperre = (b) => this.feindlich(einheit.besitzer, b.besitzer) && (GEBAEUDE[b.art].gezogen || GEBAEUDE[b.art].tor);
    const frei = new Set(this.toreVon(einheit.besitzer) || []);
    let mauern = 0;
    for (const b of this.gebaeude.values()) {
      if (!sperre(b)) continue;
      const { x0, y0, x1, y1 } = this.grundflaeche(b.art, b.x, b.y, b.quer);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) frei.add(y * g + x);
      mauern += 1;
    }
    if (!mauern) return null;
    // Auch ein schraeger Schritt an einer Mauer vorbei zaehlt: schraeg geht
    // es nur, wenn beide Seitenfelder frei sind (wege.js). Faellt die Ecke
    // eines Rings, fuehrt der Weg schraeg durch die Luecke, ohne ein
    // Mauerfeld zu betreten - und ohne diese Pruefung stand das ganze Heer
    // vor der offenen Ecke ohne Auftrag (Runde 139).
    let vorher = this.feldVon(einheit);
    for (const feld of suchen(this.karte, vorher, stand, frei)) {
      const kandidaten = [feld];
      if (feld.x !== vorher.x && feld.y !== vorher.y) kandidaten.push({ x: feld.x, y: vorher.y }, { x: vorher.x, y: feld.y });
      for (const k of kandidaten) {
        const b = this.gebaeudeAn(k.x, k.y);
        if (b && sperre(b)) return b;
      }
      vorher = feld;
    }
    return null;
  }

  /**
   * Schaden nach der Vorlage (kampf AC-6): Angriff minus die Ruestung des Ziels
   * in der Art dieses Angriffs - nah oder fern -, plus den Bonus des
   * Angreifers auf eine Ruestungsklasse des Ziels, mindestens 1. Eine Formel
   * fuer alle, ohne Zufall (kampf AC-8).
   */
  schaden(angreifer, ziel, istGebaeude) {
    // Auch ein Turm schiesst nach dieser Formel (kampf AC-20): seine Werte
    // kommen aus `gebaeudewert()`, die einer Einheit aus `einheitenwert()`.
    // Die Namen ueberschneiden sich nicht (bauen AC-34, Test).
    const vonGebaeude = !EINHEITEN[angreifer.art];
    const a = vonGebaeude ? GEBAEUDE[angreifer.art] : EINHEITEN[angreifer.art];
    const wert = (feld) => (vonGebaeude
      ? this.gebaeudewert(angreifer.besitzer, angreifer.art, feld)
      : this.einheitenwert(angreifer.besitzer, angreifer.art, feld));
    const werte = istGebaeude ? GEBAEUDE[ziel.art] : EINHEITEN[ziel.art];
    const fern = wert('reichweite');
    // Auch die Ruestung des Ziels kennt seine Verbesserungen: der Webstuhl
    // gibt dem Dorfbewohner +1/+2 (bauen AC-21). Bis Runde 68 las diese Zeile
    // die Tabelle und die Ruestung aus dem Webstuhl war wirkungslos.
    const feld = fern ? 'fernruestung' : 'nahruestung';
    // Ein Gebaeude ebenso: Mauerwerk gibt +1/+1 (bauen AC-34).
    const ruestung = istGebaeude
      ? this.gebaeudewert(ziel.besitzer, ziel.art, feld)
      : this.einheitenwert(ziel.besitzer, ziel.art, feld);
    // Der Zuschlag einer Einheit mit ihren Verbesserungen (bauen AC-54,
    // AC-56); ein Gebaeude traegt seinen in den Daten.
    const boni = vonGebaeude ? a.bonus : this.bonusVon(angreifer.besitzer, angreifer.art);
    let bonus = 0;
    for (const klasse of werte.klassen || []) bonus += boni?.[klasse] || 0;
    return Math.max(1, wert('angriff') - ruestung + bonus);
  }

  // Ein Schlag wird vorgemerkt, nicht sofort verrechnet: abgerechnet wird am
  // Ende des Taktes. So toeten zwei Einheiten, die einander den letzten Schlag
  // versetzen, sich beide - kein Vorrang fuer den, der zuerst dran war.
  schlagen(angreifer, ziel, istGebaeude) {
    // Ein Stein trifft nicht sofort, sondern nach seinem Flug, und nicht das
    // Ziel, sondern die Stelle, an der es beim Abwurf stand (kampf AC-19).
    const geschoss = EINHEITEN[angreifer.art]?.geschoss;
    if (geschoss) {
      this.steinWerfen(angreifer, ziel, istGebaeude, geschoss);
      return;
    }
    const schaden = this.schaden(angreifer, ziel, istGebaeude);
    // Ein Turm schiesst ebenso Pfeile, aus der Mitte seiner Grundflaeche.
    const vonGebaeude = !EINHEITEN[angreifer.art];
    const fern = vonGebaeude
      ? this.gebaeudewert(angreifer.besitzer, angreifer.art, 'reichweite')
      : this.einheitenwert(angreifer.besitzer, angreifer.art, 'reichweite');
    if (!(fern > 0)) {
      this.schlaege.push({ angreifer, ziel, schaden, gebaeude: istGebaeude });
      return;
    }
    const mitte = (g) => {
      const { x0, y0, x1, y1 } = this.grundflaeche(g.art, g.x, g.y, g.quer);
      return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
    };
    const von = vonGebaeude ? mitte(angreifer) : angreifer;
    const nach = istGebaeude ? mitte(ziel) : ziel;
    // Der Pfeil trifft, wenn er ankommt (kampf AC-27): so viele Takte, wie er
    // mit PFEIL_TEMPO Feldern je Sekunde braucht. Gerechnet ist der Schaden
    // beim Abschuss, abgerechnet wird er beim Ankommen - mit den Schlaegen
    // jenes Takts. Er trifft sicher, auch ein Ziel, das inzwischen gelaufen
    // ist; faellt es vorher, verpufft er.
    const takte = this.flugTakte(von, nach, PFEIL_TEMPO);
    this.pfeileImFlug.push({ angreifer, ziel, schaden, gebaeude: istGebaeude, takte });
    // Ein Schuss geht als Pfeil in den naechsten Zustand (bedienung AC-40):
    // von wo nach wo, als fuenfter Wert 0 (ein Pfeil), als sechster, wie viele
    // Takte nach diesem Zustand er einschlaegt - damit der Browser ihn dann
    // landen laesst. Der Pfeil ist Darstellung (ADR-0001).
    this.schussMerken(von, nach, 0, takte);
  }

  /**
   * Wie viele Takte ein Geschoss von `von` nach `nach` fliegt, mit `tempo`
   * Feldern je Sekunde - mindestens einer: dann trifft es im selben Takt.
   */
  flugTakte(von, nach, tempo) {
    return Math.max(1, Math.round((Math.hypot(nach.x - von.x, nach.y - von.y) / tempo) * TAKTE_PRO_SEKUNDE));
  }

  /**
   * Ein Geschoss fuer den naechsten Zustand: `[x0, y0, x1, y1, art, nach]` -
   * art 0 ein Pfeil, 1 ein Stein, 2 Feuer; `nach` die Takte vom Zustand bis
   * zum Einschlag (kampf AC-27).
   */
  schussMerken(von, nach, art, takte) {
    (this.schuesse ??= []).push([...[von.x, von.y, nach.x, nach.y].map((w) => Math.round(w * 10) / 10), art, takte - 1]);
    // Ohne Zustand - im Pruefstand fragt keiner danach - wuechse die Liste
    // eine ganze Partie lang. Was weiter zurueckliegt als die letzten
    // SCHUESSE_HOECHSTENS, sieht ohnehin keiner mehr fliegen.
    if (this.schuesse.length > SCHUESSE_HOECHSTENS) this.schuesse.splice(0, this.schuesse.length - SCHUESSE_HOECHSTENS);
  }

  /**
   * Ein Stein fliegt los (kampf AC-19). Er ist so lange unterwegs, wie er mit
   * `geschoss` Feldern je Sekunde braucht, und geht wie ein Pfeil in den
   * Zustand - als fuenfter Wert eine 1, damit der Browser einen Stein zeichnet.
   */
  steinWerfen(angreifer, ziel, istGebaeude, geschoss) {
    let nach = { x: ziel.x, y: ziel.y };
    if (istGebaeude) {
      const { x0, y0, x1, y1 } = this.grundflaeche(ziel.art, ziel.x, ziel.y, ziel.quer);
      nach = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
    }
    const takte = this.flugTakte(angreifer, nach, geschoss);
    this.einschlaege.push({
      x: nach.x,
      y: nach.y,
      takte,
      angreifer,
      gebaeude: istGebaeude ? ziel : null,
    });
    // Fuenfter Wert: 1 ist ein Stein, 2 das Feuer des Drachen (einheiten AC-52).
    this.schussMerken(angreifer, nach, EINHEITEN[angreifer.art].feuer ? 2 : 1, takte);
  }

  /**
   * Steine, die in diesem Takt ankommen (kampf AC-19): jede lebende Einheit im
   * Umkreis von `flaeche` Feldern um die Stelle des Einschlags wird getroffen,
   * auch eine eigene - in der Mitte mit vollem Schaden, am Rand mit der Haelfte,
   * dazwischen gleichmaessig. Ein Gebaeude als Ziel bekommt den vollen
   * Schaden. Abgerechnet wird mit den Schlaegen des Taktes, also gleichzeitig
   * mit allem anderen (kampf AC-10); auch ein Werfer, der inzwischen fiel,
   * trifft noch.
   */
  einschlaegeTakten() {
    this.einschlaege = this.fliegen(this.einschlaege, (stein) => this.steinTrifft(stein));
    this.pfeileImFlug = this.fliegen(this.pfeileImFlug, (pfeil) => this.pfeilTrifft(pfeil));
  }

  /**
   * Was fliegt, ist einen Takt weiter (kampf AC-19, AC-27): was ankommt,
   * schlaegt ein, der Rest bleibt in der Liste.
   */
  fliegen(liste, einschlagen) {
    if (!liste.length) return liste;
    const bleiben = [];
    for (const geschoss of liste) {
      geschoss.takte--;
      if (geschoss.takte > 0) bleiben.push(geschoss);
      else einschlagen(geschoss);
    }
    return bleiben;
  }

  /**
   * Ein Pfeil kommt an (kampf AC-27): er trifft sein Ziel mit dem Schaden,
   * der beim Abschuss gerechnet wurde - wenn es noch steht. Wer inzwischen
   * fiel oder fort ist, schluckt ihn: der Pfeil verpufft, kein zweites Ziel.
   * Ebenso, wer inzwischen kein Gegner mehr ist (bekehrt, verbuendet). Auch
   * ein Schuetze, der inzwischen fiel, trifft noch.
   */
  pfeilTrifft({ angreifer, ziel, schaden, gebaeude }) {
    const steht = gebaeude ? this.gebaeude.get(ziel.id) === ziel : !ziel.tot && this.einheiten.get(ziel.id) === ziel;
    if (!steht || !this.feindlich(angreifer.besitzer, ziel.besitzer)) return;
    this.schlaege.push({ angreifer, ziel, schaden, gebaeude });
  }

  /** Ein Stein schlaegt ein (kampf AC-19). */
  steinTrifft(stein) {
    const { angreifer } = stein;
    const flaeche = EINHEITEN[angreifer.art].flaeche;
    if (stein.gebaeude && this.gebaeude.has(stein.gebaeude.id)) {
      this.schlaege.push({
        angreifer, ziel: stein.gebaeude, schaden: this.schaden(angreifer, stein.gebaeude, true), gebaeude: true,
      });
    }
    for (const einheit of this.einheiten.values()) {
      // Wer fliegt, liegt nicht unter dem Einschlag (kampf AC-23) - auch
      // der Drache nicht unter seinem eigenen Feuer.
      if (einheit.tot || EINHEITEN[einheit.art].fliegt) continue;
      const abstand = Math.hypot(einheit.x - stein.x, einheit.y - stein.y);
      if (abstand > flaeche) continue;
      const anteil = 1 - 0.5 * (abstand / flaeche);
      this.schlaege.push({
        angreifer,
        ziel: einheit,
        schaden: Math.max(1, Math.round(this.schaden(angreifer, einheit, false) * anteil)),
        gebaeude: false,
      });
    }
  }

  schlaegeAbrechnen() {
    if (!this.schlaege.length) return;
    for (const schlag of this.schlaege) schlag.ziel.leben -= schlag.schaden;
    for (const { angreifer, ziel, gebaeude } of this.schlaege) {
      this.angriffMelden(ziel, gebaeude, angreifer);
      if (gebaeude) {
        if (!this.gebaeude.has(ziel.id)) continue;
        this.gebaeudeGeaendert(ziel);
        if (ziel.leben <= 0) {
          this.siegZaehlen(angreifer, ziel, GEBAEUDE[ziel.art].kosten);
          this.gebaeudeZerstoeren(ziel);
        }
      } else if (ziel.leben <= 0 && !ziel.tot) {
        this.siegZaehlen(angreifer, ziel, EINHEITEN[ziel.art].kosten);
        // Woher der Schlag kam (bedienung AC-76): dorthin gewandt faellt er,
        // also von dem weg, der ihn traf. Ein Turm ist ein Gebaeude mit Platz.
        ziel.fallrichtung = angreifer ? achtel(angreifer.x - ziel.x, angreifer.y - ziel.y) : null;
        this.einheitSterben(ziel);
      } else {
        this.wehren(ziel, angreifer);
      }
    }
    this.schlaege = [];
  }

  /**
   * Punkte fuer Siege im Kampf (bedienung AC-49): dem Besitzer des Schlags,
   * der das Ziel fallen laesst, die Kosten des Ziels - nur gegen Gegner. Wer
   * eigene oder verbuendete trifft (der Stein eines Mangonels), bekommt nichts.
   */
  siegZaehlen(angreifer, ziel, kosten) {
    if (!angreifer || !this.feindlich(angreifer.besitzer, ziel.besitzer)) return;
    const sieger = this.spielerVon(angreifer.besitzer);
    if (sieger) sieger.besiegtWert += kostenSumme(kosten);
  }

  /**
   * Wer getroffen wird, erfaehrt es (kampf AC-14): der Besitzer des Ziels
   * bekommt mit dem naechsten Zustand den Ort. Nur seiner - im Nebel sehen
   * die anderen den eigenen Spielereintrag nicht (kampf AC-13).
   */
  angriffMelden(ziel, gebaeude, angreifer) {
    const spieler = this.spielerVon(ziel.besitzer);
    if (!spieler || spieler.aus || (angreifer && !this.feindlich(angreifer.besitzer, ziel.besitzer))) return;
    let ort = { x: ziel.x, y: ziel.y };
    if (gebaeude) {
      const { x0, y0, x1, y1 } = this.grundflaeche(ziel.art, ziel.x, ziel.y, ziel.quer);
      ort = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
    }
    const alt = spieler.angriff;
    if (alt && this.takt - alt.takt < MELDUNG_PAUSE && Math.hypot(alt.x - ort.x, alt.y - ort.y) < MELDUNG_ABSTAND) {
      // Dasselbe Gefecht: nicht noch einmal melden, aber die Pause beginnt neu.
      alt.takt = this.takt;
      return;
    }
    spieler.angriff = { x: ort.x, y: ort.y, takt: this.takt, neu: true };
  }

  /**
   * Wer getroffen wird und nicht von selbst wacht, laesst die Arbeit liegen und
   * schlaegt zurueck (kampf AC-2, zweiter Satz). Das betrifft den Dorfbewohner:
   * er arbeitet weiter, **bis** er getroffen wird. Auch diese Gegenwehr ist
   * eine Verfolgung, die niemand befohlen hat - sie endet nach fuenf Feldern.
   */
  wehren(einheit, angreifer) {
    if (einheit.tot || !angreifer || angreifer.tot) return;
    // Von einem Turm getroffen, schlaegt niemand von selbst zurueck: ein
    // Dorfbewohner, der mit der Axt auf 1020 Leben Stein losgeht, stirbt nur
    // schneller. Wer den Turm angreifen soll, braucht einen Befehl (bauen AC-29).
    if (!EINHEITEN[angreifer.art]) return;
    // Vom eigenen Stein getroffen (kampf AC-19), oder von dem eines
    // Verbuendeten (spielziel AC-14), schlaegt niemand zurueck.
    if (!this.feindlich(einheit.besitzer, angreifer.besitzer)) return;
    if (EINHEITEN[einheit.art].wacht) return;
    // Eine Ramme schlaegt nicht zurueck: sie trifft nur Gebaeude (einheiten
    // AC-35). Und wen der Drache brennt, der wehrt sich nur, wenn er ihn
    // treffen kann (kampf AC-23).
    if (!this.kannTreffen(einheit, angreifer)) return;
    if (einheit.auftrag?.art === 'angreifen' || !this.einheitenwert(einheit.besitzer, einheit.art, 'angriff')) return;
    const stand = nachbarfeld(this.karte, this.feldVon(angreifer), einheit);
    this.angriffBeginnen(einheit, angreifer, false, stand, this.feldVon(einheit));
  }

  // Ein Toter liegt noch zwei Sekunden im Bild (kampf AC-10), tut aber nichts
  // mehr: kein Auftrag, keine Bevoelkerung, kein Ziel fuer einen Angriff.
  einheitSterben(einheit) {
    this.farmVerlassen(einheit);
    // Wer ein Ei traegt und faellt, laesst es liegen (einheiten AC-51).
    const ei = this.eiVon(einheit);
    if (ei) this.eiAblegen(ei, einheit.x, einheit.y);
    // Faellt der Drache, liegt dort sein Ei (einheiten AC-53).
    if (EINHEITEN[einheit.art].gerufen) this.dracheFaellt(einheit);
    // Fuer die Tafel (spielziel AC-8). Wer aufgibt, verliert damit alles auf
    // einmal - das ist richtig so: gefallen ist gefallen.
    const spieler = this.spielerVon(einheit.besitzer);
    if (spieler) spieler.verloren++;
    // Ein Gefallener fuer das Haus, das damit bezahlt (einheiten AC-49) - wer
    // selbst aus einem Gefallenen entstand, zaehlt nicht noch einmal.
    if (spieler && !EINHEITEN[einheit.art].kosten?.gefallene && AUS_GEFALLENEN.some((art) => this.hausBildetAus(spieler, art))) {
      spieler.gefallene++;
    }
    einheit.leben = 0;
    einheit.tot = true;
    // Der Takt des Todes steht getrennt daneben: Takt 0 waere als Schalter
    // falsch gelesen worden.
    einheit.gefallen = this.takt;
    einheit.auftrag = null;
    einheit.weg = [];
    einheit.wegpunkte = [];
    einheit.angriffe = [];
    einheit.sammelt = false;
    einheit.baut = false;
    einheit.bekehrt = false;
    einheit.heilt = null;
    this.bestandPruefen = true;
  }

  // Ein Gebaeude ohne Leben verschwindet samt seinem Platz auf der Karte.
  // Truemmer sind nur ein Bild (darstellung AC-26): der Server merkt sich,
  // wann es fiel, und sagt es mit dem Verschwinden - der Platz ist sofort
  // frei, begehbar und bebaubar.
  gebaeudeZerstoeren(gebaeude, truemmer = true) {
    const frist = RUINE_SEKUNDEN * TAKTE_PRO_SEKUNDE;
    for (const [id, takt] of this.eingestuerzt) if (this.takt - takt >= frist) this.eingestuerzt.delete(id);
    if (truemmer) this.eingestuerzt.set(gebaeude.id, this.takt);
    this.gebaeude.delete(gebaeude.id);
    // Faellt ein Kloster, liegen seine Eier am Boden (einheiten AC-51) - in
    // der Mitte seiner Grundflaeche, die eben frei wird.
    for (const ei of this.eier.values()) {
      if (ei.kloster !== gebaeude.id) continue;
      const { x0, y0, x1, y1 } = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y, gebaeude.quer);
      this.eiAblegen(ei, (x0 + x1) / 2, (y0 + y1) / 2);
    }
    this.gebaeudeSichtNeu = true;
    this.freigeben(gebaeude);
    this.gebaeudeGeaendert(gebaeude);
    this.bestandPruefen = true;
  }

  // ---- Partieende (spielziel AC-5, AC-6) ----------------------------------

  /** Die Partie ist entschieden. Der Raum haelt daran seine Uhr an. */
  get vorbei() {
    return this.ende !== null;
  }

  /**
   * Hat dieser Spieler noch etwas, das ihn im Spiel haelt? Eine lebende
   * Einheit oder ein Gebaeude, das zum Bestand zaehlt - Farmen (spaeter
   * Mauern und Tore) zaehlen nicht, die Zeile dazu steht an den Daten.
   * Eine Baustelle zaehlt: aus ihr kann noch ein Dorfzentrum werden.
   */
  imBestand(spielerId) {
    for (const e of this.einheiten.values()) if (e.besitzer === spielerId && !e.tot) return true;
    for (const g of this.gebaeude.values()) {
      if (g.besitzer === spielerId && GEBAEUDE[g.art].bestand !== false) return true;
    }
    return false;
  }

  /**
   * Wer nichts mehr hat, scheidet aus; bleiben nur Verbuendete uebrig - oder
   * einer allein -, ist die Partie entschieden (spielziel AC-20). Gerechnet **auf dem Server und in dem Takt**, in dem der
   * letzte Verlust abgerechnet wurde - deshalb steht der Aufruf am Ende von
   * `takten()`, hinter `schlaegeAbrechnen()`.
   *
   * Zwei Enden gibt es: "eroberung" (einer blieb uebrig) und "zeit" (nach
   * 90 Spielminuten ohne Entscheidung, unentschieden). Faellt der vorletzte
   * und der letzte im selben Takt, bleibt niemand uebrig - das ist dann auch
   * unentschieden, mit dem Grund "eroberung" und ohne Sieger.
   */
  endePruefen() {
    if (this.ende) return;
    if (this.bestandPruefen) {
      this.bestandPruefen = false;
      for (const spieler of this.spieler) {
        if (!spieler.aus && !this.imBestand(spieler.id)) spieler.aus = true;
      }
    }
    const uebrig = this.spieler.filter((s) => !s.aus);
    if (!uebrig.length) {
      this.endeSetzen([], 'eroberung');
      return;
    }
    // Keine zwei Uebrigen sind Gegner: dann gewinnt ihr Team, und zwar ganz,
    // auch wer daraus schon ausgeschieden ist. Wer kein Team hat, ist jedem
    // Gegner - er gewinnt nur allein. Gefragt wird `feindlich`, die eine
    // Stelle fuer "Gegner oder nicht" (spielziel AC-14).
    // Laeuft die Frist einer Kuendigung unter den Uebrigen, ist nichts
    // entschieden: in hoechstens 60 Sekunden sind sie Gegner, und wer
    // gekuendigt hat, gewaenne sonst mit dem Team, das er eben verlassen hat
    // (spielziel AC-21, Durchsicht Runde 154).
    const fristLaeuft = this.kuendigungen.some((k) => !k.vorbei && uebrig.some((s) => s.id === k.wer));
    if (this.mitGegnern && !fristLaeuft && uebrig.every((s) => !this.feindlich(uebrig[0].id, s.id))) {
      const team = uebrig[0].team || null;
      const gewinner = team ? this.spieler.filter((s) => s.team === team).map((s) => s.id) : [uebrig[0].id];
      this.endeSetzen(gewinner, 'eroberung', team);
      return;
    }
    if (this.zeitgrenze && this.takt >= this.zeitgrenze * 60 * TAKTE_PRO_SEKUNDE) {
      this.endeSetzen([], 'zeit');
      return;
    }
    // Das Wunder (spielziel AC-29): steht eines lange genug, gewinnt sein
    // Besitzer mit allen, die ihm in diesem Takt nicht feindlich sind - wer
    // gekuendigt hat, mit dem, der dann noch zu ihm haelt. Ausgeschiedene
    // eines Teams gewinnen mit (AC-20). Laeuft die Zeitgrenze im selben Takt
    // ab, steht oben das Unentschieden.
    const wunder = this.wunderReif();
    if (wunder) {
      const besitzer = wunder.besitzer;
      const gewinner = this.spieler.filter((s) => !this.feindlich(besitzer, s.id)).map((s) => s.id);
      const team = gewinner.length > 1 ? this.spielerVon(besitzer).team || null : null;
      this.endeSetzen(gewinner, 'wunder', team);
    }
  }

  /**
   * Die Wunder und ihre Uhren (spielziel AC-29): je fertigem Wunder der Takt,
   * in dem es fertig wurde. Faellt es, ist die Uhr mit ihm fort; ein neues
   * beginnt von vorn. Gesetzt wird beim ersten Blick, so gilt es auch fuer
   * eines, das ein Test fertig hinstellt.
   */
  wunderUhren() {
    const uhren = [];
    for (const g of this.gebaeude.values()) {
      if (!g.fertig || !GEBAEUDE[g.art].wunder) continue;
      g.wunderAb ??= this.takt;
      uhren.push({ gebaeude: g, rest: g.wunderAb + WUNDER_SEKUNDEN * TAKTE_PRO_SEKUNDE - this.takt });
    }
    return uhren;
  }

  /** Das Wunder, dessen Uhr abgelaufen ist - bei mehreren das zuerst fertige. */
  wunderReif() {
    let reif = null;
    for (const uhr of this.wunderUhren()) {
      if (uhr.rest > 0) continue;
      if (!reif || uhr.gebaeude.wunderAb < reif.wunderAb) reif = uhr.gebaeude;
    }
    return reif;
  }

  /**
   * Was alle von den Wundern wissen (spielziel AC-29), auch im Nebel: wem es
   * gehoert, wie lange noch, und wo seine Mitte steht - fuer die Ansage und
   * die Uebersichtskarte. `wu: [[besitzer, restSekunden, x, y]]`.
   */
  wunderFeld() {
    const uhren = this.wunderUhren();
    if (!uhren.length) return {};
    return {
      wu: uhren.map(({ gebaeude: g, rest }) => {
        const { x0, y0, x1, y1 } = this.grundflaeche(g.art, g.x, g.y, g.quer);
        return [g.besitzer, Math.max(0, Math.ceil(rest / TAKTE_PRO_SEKUNDE)), (x0 + x1) / 2, (y0 + y1) / 2];
      }),
    };
  }

  /**
   * Das Ende festhalten - mit der Tafel, die alle am Schluss sehen
   * (spielziel AC-8). Sie entsteht genau einmal, in dem Takt, in dem die
   * Partie entschieden ist, und geht danach mit jedem Zustand und jedem
   * Aufbau mit: so sieht sie auch, wer nach einem Abbruch zurueckkommt.
   *
   * Die Reihenfolge ist die der Spieler, nicht die des Ergebnisses - wer die
   * Tafel zeigt, sortiert sie, und bei allen steht dasselbe.
   */
  endeSetzen(gewinner, grund, team = null) {
    this.ende = {
      gewinner,
      // Gewinnt genau einer, steht er auch hier - wie bis Runde 149.
      sieger: gewinner.length === 1 ? gewinner[0] : null,
      ...(team ? { team } : {}),
      grund,
      takt: this.takt,
      tafel: this.spieler.map((s) => ({
        id: s.id,
        gesammelt: { ...s.gesammelt },
        ausgebildet: s.ausgebildet,
        verloren: s.verloren,
        zeitalter: s.zeitalter,
        ...(s.aus ? { aus: 1 } : {}),
        ...(s.aufgegeben ? { ag: 1 } : {}),
      })),
    };
  }

  /**
   * Aufgeben (spielziel AC-6): alles faellt, der Spieler gilt als
   * ausgeschieden, und die Partie laeuft fuer die anderen weiter. Ein eigener
   * Ausgang ist das nicht - es ist der schnelle Weg in AC-5, deshalb
   * entscheidet dieselbe Pruefung, ob damit eine Partie zu Ende ist.
   */
  aufgeben(spielerId) {
    const spieler = this.spielerVon(spielerId);
    if (!spieler) return { fehler: 'Diesen Spieler gibt es hier nicht.' };
    if (this.ende) return { fehler: 'Die Partie ist schon zu Ende.' };
    if (spieler.aus) return { fehler: 'Du bist schon ausgeschieden.' };
    // Die Einheiten fallen, wie sie im Kampf fallen: sie liegen zwei Sekunden
    // im Bild, statt zu verschwinden (kampf AC-10).
    for (const einheit of this.einheiten.values()) {
      if (einheit.besitzer === spielerId && !einheit.tot) this.einheitSterben(einheit);
    }
    for (const gebaeude of [...this.gebaeude.values()]) {
      if (gebaeude.besitzer === spielerId) this.gebaeudeZerstoeren(gebaeude);
    }
    spieler.aus = true;
    spieler.aufgegeben = true;
    // Sofort und nicht erst im naechsten Takt: wer aufgibt, soll nicht noch
    // ein Zehntel lang als Mitspieler zaehlen.
    this.endePruefen();
    return {};
  }

  /**
   * Ein Buendnis loesen (spielziel AC-21, ADR-0013 Punkt 3 und 4): wer
   * kuendigt, tritt aus seinem Team aus - gegenueber allen Verbuendeten
   * zugleich, also in beide Richtungen. Die gemeinsame Sicht endet sofort,
   * Gegner sind sie erst nach der Frist (`fristenTakten`). Zuruecknehmen
   * geht nicht: eine zweite Kuendigung gibt es nicht, und eine Nachricht,
   * die eine aufhebt, auch nicht.
   */
  kuendigen(spielerId) {
    const spieler = this.spielerVon(spielerId);
    if (!spieler) return { fehler: 'Diesen Spieler gibt es hier nicht.' };
    if (this.ende) return { fehler: 'Die Partie ist schon zu Ende.' };
    if (spieler.aus) return { fehler: 'Du bist schon ausgeschieden.' };
    if (this.buendnisse === 'fest') return { fehler: 'Die Bündnisse dieser Partie sind fest.' };
    if (this.kuendigungen.some((k) => k.wer === spielerId)) return { fehler: 'Du hast dein Bündnis schon gelöst.' };
    // Wer selbst schon gekuendigt hat, zaehlt nicht: ihm zu kuendigen
    // aenderte nichts (Durchsicht Runde 154).
    const verbuendete = this.spieler.filter((s) => s.id !== spielerId && !s.aus && !this.feindlich(spielerId, s.id)
      && !this.kuendigungen.some((k) => k.wer === s.id));
    if (!verbuendete.length) return { fehler: 'Du hast keinen Verbündeten.' };
    this.kuendigungen.push({ wer: spielerId, bis: this.takt + KUENDIGUNG_SEKUNDEN * TAKTE_PRO_SEKUNDE });
    this.sichtTrennen(spielerId);
    return {};
  }

  /**
   * Die Sicht eines Spielers von der seines Teams trennen (spielziel
   * AC-21): er nimmt mit, was er bis jetzt sah und erkundet hatte - eine
   * Abschrift -, und von da an rechnet jede Seite fuer sich. Was er von den
   * Gebaeuden der anderen wusste, bleibt beiden als Erinnerung im Nebel
   * (kampf AC-12): sonst erfuehre keiner je, wenn eines davon faellt, wo er
   * nicht hinsieht.
   */
  sichtTrennen(id) {
    const alt = this.sichten.get(id);
    const bisher = this.spieler.filter((s) => s.id !== id && this.sichten.get(s.id) === alt).map((s) => s.id);
    if (!bisher.length) return;
    // Auch die Karte nimmt er mit (bauen AC-52).
    this.sichten.set(id, { sichtbar: alt.sichtbar.slice(), gebaeude: alt.gebaeude.slice(), erkundet: alt.erkundet.slice(), karte: alt.karte });
    // Mit der Sicht endet der Mannschaftsbonus in beide Richtungen
    // (spielziel AC-25): alle Wirkungen und Werte neu, und jeder bekommt
    // seine Tafel neu - die Sicht der Reiter steht darin.
    this.buendnisStand += 1;
    this.werteGemerkt.clear();
    for (const s of this.spieler) this.werteAenderungen.add(s.id);
    if (this.bekannt) {
      for (const [wer, von] of [...bisher.map((b) => [id, b]), ...bisher.map((b) => [b, id])]) {
        const bekannt = this.bekannt.get(wer);
        if (!bekannt) continue;
        for (const g of this.gebaeude.values()) if (g.besitzer === von) bekannt.set(g.id, { art: g.art, x: g.x, y: g.y });
      }
    }
    // Sofort neu gerechnet: bis zur naechsten Rechnung saehe sonst das Team
    // noch, was seine Einheiten sehen.
    this.gebaeudeSichtNeu = true;
    this.sichtAktualisieren();
  }

  // Laeuft eine Frist ab, gehoert der Kuendigende keinem Team mehr an
  // (spielziel AC-21): von da an ist er jedem Gegner.
  fristenTakten() {
    for (const k of this.kuendigungen) {
      if (k.vorbei || this.takt < k.bis) continue;
      k.vorbei = true;
      this.spielerVon(k.wer).team = null;
      this.teamVon.set(k.wer, null);
      this.mitGegnern = this.spieler.some((a) => this.spieler.some((b) => this.feindlich(a.id, b.id)));
    }
  }

  /**
   * Die Einheiten in der Reihenfolge, in der sie diesen Takt rechnen (kampf
   * AC-26). Wer zuerst rechnet, geht zuerst und entscheidet nach der Lage
   * derer, die noch nicht gegangen sind - liefe die Liste immer in der
   * Reihenfolge des Anlegens, gewaenne bei gleichen Heeren der, dessen
   * Einheiten spaeter angelegt wurden: im Gefechtsstand die Seite rechts,
   * Miliz gegen Miliz 160 von 200. Deshalb je Takt neu gemischt, aus dem
   * Startwert - dieselbe Partie bleibt dieselbe.
   *
   * Dazu merkt sich jede Einheit, wo sie zu Beginn des Takts stand
   * (`taktX`, `taktY`): danach misst die Reichweite eines Angreifers,
   * nicht nach der Lage, in die das Ziel in diesem Takt schon gegangen ist.
   *
   * Die Map `einheiten` bleibt in der Reihenfolge des Anlegens - wer die
   * gemischte braucht (Wache, Ausweichen), fragt `reiheJetzt()`.
   */
  reihenfolge() {
    const reihe = [...this.einheiten.values()];
    for (let i = reihe.length - 1; i > 0; i--) {
      const j = Math.floor(this.reihenZufall() * (i + 1));
      const tausch = reihe[i];
      reihe[i] = reihe[j];
      reihe[j] = tausch;
    }
    for (const [i, einheit] of reihe.entries()) {
      einheit.reihe = i;
      einheit.taktX = einheit.x;
      einheit.taktY = einheit.y;
    }
    this.reihe = reihe;
    return reihe;
  }

  /**
   * Die gemischte Reihenfolge dieses Takts (kampf AC-26), ohne wen es nicht
   * mehr gibt; wer im Takt dazukam, steht hinten.
   */
  reiheJetzt() {
    const reihe = (this.reihe || []).filter((e) => this.einheiten.get(e.id) === e);
    if (reihe.length < this.einheiten.size) {
      const drin = new Set(reihe);
      for (const e of this.einheiten.values()) if (!drin.has(e)) reihe.push(e);
    }
    return reihe;
  }

  takten() {
    // Eine entschiedene Partie rechnet nicht weiter. Der Raum haelt seine Uhr
    // an (`vorbei`); dies ist die zweite Sperre, fuer den Pruefstand und fuer
    // Takte, die noch im Zeitraffer unterwegs sind.
    if (this.ende) return;
    this.takt++;
    const bevoelkerung = this.bevoelkerung();
    for (const gebaeude of this.gebaeude.values()) this.gebaeudeTakten(gebaeude, bevoelkerung);
    this.tiereTakten();
    const reihe = this.reihenfolge();
    // Zweimal je Sekunde sehen sich stehende Kampfeinheiten um (kampf AC-2).
    if (this.takt % WACHE_TAKTE === 0) this.wacheTakten();
    for (const einheit of reihe) this.einheitTakten(einheit);
    this.reparaturenAbrechnen();
    this.drachenFuettern();
    this.tuermeTakten();
    // Einmal je Sekunde heilen Moenche (einheiten AC-37).
    if (this.takt % TAKTE_PRO_SEKUNDE === 0) this.heilenTakten();
    // Ebenso oft treten Stehende auseinander (einheiten AC-29).
    if (this.takt % WACHE_TAKTE === 0) this.ausweichen();
    this.einschlaegeTakten();
    this.schlaegeAbrechnen();
    if (this.takt % SICHT_TAKTE === 0) this.sichtAktualisieren();
    if (this.kuendigungen.length) this.fristenTakten();
    this.endePruefen();
  }

  /**
   * Ob diese Einheit dieses Ziel bekehren kann (einheiten AC-38): sie hat
   * `bekehren` in den Daten und ruht nicht, das Ziel ist eine fremde,
   * lebende Einheit, und keine seiner Klassen steht in `nicht`.
   */
  kannBekehren(einheit, ziel) {
    const bekehren = EINHEITEN[einheit.art].bekehren;
    if (!bekehren || einheit.ruhtBis > this.takt) return false;
    if (!ziel || ziel.tot || !this.feindlich(einheit.besitzer, ziel.besitzer)) return false;
    return !EINHEITEN[ziel.art].klassen.some((k) => bekehren.nicht.includes(k));
  }

  /**
   * Wie viele Takte ein Bekehren dauert: vor `frueh` Sekunden nie, danach je
   * Sekunde mit `chance`, nach `spaet` sicher. Gezogen beim Befehl, aus dem
   * Zufall der Partie - dieselbe Partie, dieselbe Dauer.
   */
  bekehrDauer(bekehren) {
    let sekunden = bekehren.frueh;
    while (sekunden < bekehren.spaet && this.zufall() >= bekehren.chance) sekunden++;
    return sekunden * TAKTE_PRO_SEKUNDE;
  }

  bekehrenBeginnen(einheit, ziel) {
    einheit.auftrag = { art: 'bekehren', ziel: ziel.id, dauer: this.bekehrDauer(EINHEITEN[einheit.art].bekehren), fortschritt: 0 };
    einheit.weg = [];
    einheit.bekehrt = false;
  }

  /**
   * Ein Takt des Bekehrens: ausser Reichweite hingehen (der Weg wird
   * einmal je Sekunde neu gesucht, das Ziel laeuft), in Reichweite stehen
   * und zaehlen. Die Zeit laeuft nur in Reichweite. Ist die Dauer um,
   * gehoert das Ziel dem Spieler des Moenchs, und der Moench ruht.
   */
  bekehrenTakten(moench) {
    const auftrag = moench.auftrag;
    const bekehren = EINHEITEN[moench.art].bekehren;
    const ziel = this.einheiten.get(auftrag.ziel);
    // Auch ein Getarnter, der sich wieder verborgen hat, ist kein Ziel mehr
    // (kampf AC-22): sonst folgte der Moench einem, den sein Spieler nicht
    // sieht, und bekehrte ihn im Verborgenen.
    if (!ziel || ziel.tot || !this.feindlich(moench.besitzer, ziel.besitzer) || this.verborgen(moench.besitzer, ziel)) {
      moench.auftrag = null;
      moench.weg = [];
      moench.bekehrt = false;
      return;
    }
    if (Math.hypot(ziel.x - moench.x, ziel.y - moench.y) > this.bekehrwert(moench.besitzer, moench.art, 'reichweite')) {
      moench.bekehrt = false;
      if (!moench.weg.length || this.takt % TAKTE_PRO_SEKUNDE === 0) {
        moench.weg = this.wegNach(moench, this.feldVon(ziel));
        // Kein Weg dorthin (hinter einer Mauer): er gibt auf, statt fuer
        // immer zu warten - und heilt wieder.
        if (!moench.weg.length) {
          moench.auftrag = null;
          return;
        }
      }
      this.laufen(moench);
      return;
    }
    moench.weg = [];
    moench.bekehrt = true;
    auftrag.fortschritt++;
    if (auftrag.fortschritt < auftrag.dauer) return;
    this.bekehrt(ziel, moench.besitzer);
    moench.auftrag = null;
    moench.bekehrt = false;
    moench.ruhtBis = this.takt + this.bekehrwert(moench.besitzer, moench.art, 'ruhe') * TAKTE_PRO_SEKUNDE;
  }

  /**
   * Eine Einheit wechselt den Besitzer (einheiten AC-38). Fuer den alten
   * Spieler ist sie verloren (Tafel, spielziel AC-8); was sie tat, endet; wer
   * vom neuen Besitzer sie angriff, laesst ab. Ihr Leben bleibt, nur nie ueber
   * dem vollen Wert des neuen Besitzers.
   */
  bekehrt(einheit, neuerBesitzer) {
    const alter = this.spielerVon(einheit.besitzer);
    if (alter) alter.verloren++;
    this.farmVerlassen(einheit);
    einheit.besitzer = neuerBesitzer;
    einheit.auftrag = null;
    einheit.angriffslauf = null;
    einheit.weg = [];
    einheit.angriffe = [];
    einheit.sammelt = false;
    einheit.baut = false;
    einheit.leben = Math.min(einheit.leben, this.einheitenwert(neuerBesitzer, einheit.art, 'leben'));
    // Wer sie angriff, laesst ab - im Angriffslauf geht es weiter zum
    // Marschziel, wie wenn das Ziel gefallen waere. Das gilt auch fuer die
    // Verbuendeten des neuen Besitzers (spielziel AC-14).
    for (const andere of this.einheiten.values()) {
      const a = andere.auftrag;
      if (!this.feindlich(andere.besitzer, neuerBesitzer) && a?.art === 'angreifen' && !a.gebaeude && a.ziel === einheit.id) {
        andere.auftrag = null;
        andere.weg = [];
        if (!this.naechsterAngriff(andere)) this.marschFortsetzen(andere);
      }
    }
    // Ein Schlag aus diesem Takt, der noch nicht abgerechnet ist, trifft
    // keinen mehr, der jetzt dem Schlagenden oder seinem Verbuendeten gehoert.
    this.schlaege = this.schlaege.filter((s) => s.gebaeude || s.ziel !== einheit || this.feindlich(s.angreifer.besitzer, neuerBesitzer));
    this.bestandPruefen = true;
  }

  /**
   * Moenche heilen (einheiten AC-37): wer steht und `heilen` in den Daten hat,
   * gibt der naechsten eigenen verletzten Einheit in Reichweite `je` Leben -
   * einer je Sekunde, nicht allen auf einmal. Nicht geheilt werden: wer
   * kaempft, wer Belagerung ist, Gebaeude und der Moench selbst. Steht der
   * Heiler nicht mehr oder ist niemand verletzt, hoert er auf (`heilt`).
   */
  heilenTakten() {
    for (const moench of this.einheiten.values()) {
      const heilen = EINHEITEN[moench.art].heilen;
      // Wer auf Befehl heilt, hat seinen eigenen Takt (einheiten AC-65).
      if (!heilen || moench.auftrag?.art === 'heilen') continue;
      moench.heilt = null;
      if (moench.tot || moench.auftrag || moench.weg.length) continue;
      let bester = null;
      let abstand = Infinity;
      for (const e of this.einheiten.values()) {
        if (e.besitzer !== moench.besitzer || !this.kannHeilen(moench, e) || e.auftrag?.art === 'angreifen') continue;
        const d = Math.hypot(e.x - moench.x, e.y - moench.y);
        if (d <= heilen.reichweite && d < abstand) {
          bester = e;
          abstand = d;
        }
      }
      if (!bester) continue;
      bester.leben = Math.min(this.einheitenwert(bester.besitzer, bester.art, 'leben'), bester.leben + heilen.je);
      moench.heilt = bester.id;
    }
  }

  /**
   * Ob diese Einheit diese andere heilen kann (einheiten AC-37, AC-65): sie
   * hat `heilen` in den Daten, die andere lebt, gehoert keinem Gegner, ist
   * keine Belagerung, ist verletzt - und ist nicht sie selbst.
   */
  kannHeilen(einheit, ziel) {
    if (!ziel || ziel === einheit || ziel.tot || !EINHEITEN[einheit.art].heilen) return false;
    if (this.feindlich(einheit.besitzer, ziel.besitzer)) return false;
    // Wen er nicht heilt, steht in den Daten: Belagerung und Untote.
    if (EINHEITEN[ziel.art].klassen.some((k) => EINHEITEN[einheit.art].heilen.nicht.includes(k))) return false;
    return ziel.leben < this.einheitenwert(ziel.besitzer, ziel.art, 'leben');
  }

  /**
   * Der naechste Verletzte hoechstens ein Feld vom Klick, der keinem Gegner
   * gehoert und sich heilen laesst (einheiten AC-65) - gemessen wie `feindAn`.
   * Einen Verbuendeten nur, wenn der Spieler ihn sieht (kampf AC-11).
   */
  verletzterAn(spielerId, x, y) {
    let bestes = null;
    let besterAbstand = 1.01;
    for (const einheit of this.einheiten.values()) {
      if (einheit.tot || this.feindlich(spielerId, einheit.besitzer)) continue;
      if (EINHEITEN[einheit.art].klassen.some((k) => UNHEILBAR.has(k))) continue;
      if (einheit.leben >= this.einheitenwert(einheit.besitzer, einheit.art, 'leben')) continue;
      if (!this.siehtEinheit(spielerId, einheit)) continue;
      const abstand = Math.hypot(einheit.x - x, einheit.y - y);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = einheit;
      }
    }
    return bestes;
  }

  heilenBeginnen(einheit, ziel) {
    einheit.auftrag = { art: 'heilen', ziel: ziel.id, fortschritt: 0 };
    einheit.weg = [];
    einheit.heilt = null;
  }

  /**
   * Ein Takt des befohlenen Heilens (einheiten AC-65): ausser Reichweite
   * hingehen (der Weg wird einmal je Sekunde neu gesucht, das Ziel laeuft),
   * in Reichweite stehen und je Sekunde `je` Leben geben. Solange das Ziel
   * kaempft, wartet er bei ihm - die Regel aus AC-37 gilt auch hier. Ist es
   * voll, gefallen oder ein Gegner geworden, ist der Auftrag erledigt, und
   * er heilt wieder von selbst, wer in seiner Naehe verletzt ist.
   */
  heilauftragTakten(moench) {
    const auftrag = moench.auftrag;
    const heilen = EINHEITEN[moench.art].heilen;
    const ziel = this.einheiten.get(auftrag.ziel);
    if (!this.kannHeilen(moench, ziel)) {
      moench.auftrag = null;
      moench.weg = [];
      moench.heilt = null;
      return;
    }
    if (Math.hypot(ziel.x - moench.x, ziel.y - moench.y) > heilen.reichweite) {
      moench.heilt = null;
      if (!moench.weg.length || this.takt % TAKTE_PRO_SEKUNDE === 0) {
        moench.weg = this.wegNach(moench, this.feldVon(ziel));
        // Kein Weg dorthin: er gibt auf, statt fuer immer zu warten.
        if (!moench.weg.length) {
          moench.auftrag = null;
          return;
        }
      }
      this.laufen(moench);
      return;
    }
    moench.weg = [];
    if (ziel.auftrag?.art === 'angreifen') {
      moench.heilt = null;
      return;
    }
    moench.heilt = ziel.id;
    auftrag.fortschritt++;
    if (auftrag.fortschritt % TAKTE_PRO_SEKUNDE) return;
    ziel.leben = Math.min(this.einheitenwert(ziel.besitzer, ziel.art, 'leben'), ziel.leben + heilen.je);
  }

  /**
   * Keine zwei Einheiten uebereinander (einheiten AC-29). Stehen zwei naeher
   * als `AUSWEICHEN_ABSTAND` beieinander, tritt eine auf ein freies
   * Nachbarfeld - eines, auf dem sie ihre Arbeit weitertun kann. Gezogen wird,
   * wer die hoehere Nummer hat und ausweichen darf, sonst der andere; duerfen
   * beide nicht, bleibt es, wie es ist.
   *
   * Warum allgemein und nicht an jeder Stelle, die ein Ziel vergibt: das
   * wurde siebenmal versucht (Runden 56, 61, 63, 64, 67, 85, 86), und jede
   * Runde fand einen neuen Weg, auf dem zwei auf demselben Feld ankamen - ein
   * zweiter Befehl auf dasselbe Ziel, ein Schlachter am Dorfzentrum, ein
   * Geflohener auf der Wache. Hier zaehlt nur, wo sie **stehen**.
   */
  ausweichen() {
    const stehend = [];
    const raster = new Map();
    // Zahlen statt Zeichenketten als Schluessel: mit Kaempfern, die
    // ausweichen duerfen, fragt jeder Stehende acht Nachbarfelder ab, und
    // `${x},${y}` kostete dabei die Haelfte der Zeit (Runde 100, gemessen).
    const g = this.karte.groesse;
    const schluessel = (x, y) => y * g + x;
    for (const e of this.reiheJetzt()) {
      // Wer fliegt, steht niemandem im Weg (einheiten AC-52).
      if (e.tot || e.weg.length || EINHEITEN[e.art].fliegt) continue;
      stehend.push(e);
      const k = schluessel(Math.round(e.x), Math.round(e.y));
      if (!raster.has(k)) raster.set(k, []);
      raster.get(k).push(e);
    }
    // Der **erste** Nahe, nicht alle: 800 Stehende auf drei Feldern kosteten
    // sonst 7,6 ms je Durchgang (Durchsicht Runde 89, gemessen) - jedes Paar
    // wird trotzdem gesehen, von einer der beiden Seiten.
    // Die eigene Zelle zuerst: dort stehen fast immer die Paare. Anders herum
    // lief die Suche bei drei dichten Feldern nebeneinander an je 267
    // Einheiten der Nachbarzelle vorbei, die ein ganzes Feld weg stehen
    // (2,0 ms je Durchgang, gemessen).
    const NACHBARN = [[0, 0], [-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
    const ersterNaher = (e) => {
      const fx = Math.round(e.x);
      const fy = Math.round(e.y);
      for (const [dx, dy] of NACHBARN) {
        for (const o of raster.get(schluessel(fx + dx, fy + dy)) || []) {
          if (o !== e && !gezogen.has(o.id) && Math.hypot(o.x - e.x, o.y - e.y) < AUSWEICHEN_ABSTAND) return o;
        }
      }
      return null;
    };
    // Belegt ist, wo jemand steht oder geht, und wohin jemand unterwegs ist -
    // einmal je Durchgang gesammelt, nicht je Kandidatenfeld: sonst kostet ein
    // Haufen von 800 Einheiten quadratisch (einheiten AC-21: ein Takt unter
    // 1 ms).
    // Erst gebaut, wenn jemand ausweichen darf - stehen nur Angreifer
    // aufeinander, braucht es keiner.
    let belegt = null;
    const belegung = () => {
      if (belegt) return belegt;
      belegt = new Set();
      for (const o of this.einheiten.values()) {
        if (o.tot) continue;
        belegt.add(schluessel(Math.round(o.x), Math.round(o.y)));
        if (o.weg.length) {
          // Gerundet: ein Sammler geht auf einen Platz im Feld (einheiten AC-30).
          const ziel = o.weg[o.weg.length - 1];
          belegt.add(schluessel(Math.round(ziel.x), Math.round(ziel.y)));
        }
      }
      return belegt;
    };
    const gezogen = new Set();
    // Wer in diesem Durchgang keinen Platz fand, wird nicht noch einmal
    // gefragt: 800 angekommene Angreifer an einem Ziel fragten sonst jeden
    // Nachbarn neu (0,74 ms je Durchgang statt 0,09; Durchsicht Runde 100).
    const ohnePlatz = new Set();
    for (const e of stehend) {
      if (gezogen.has(e.id)) continue;
      const o = ersterNaher(e);
      if (!o) continue;
      // Die hoehere Nummer weicht - deterministisch, ohne Zufall. Findet sie
      // keinen Platz (ein Bauer an einer voll besetzten Baustelle), versucht es
      // der andere; sonst blieben beide aufeinander, obwohl einer Platz haette
      // (Durchsicht Runde 89). Gehoeren sie verschiedenen Spielern, weicht,
      // wer in diesem Takt spaeter an der Reihe ist: die Nummern des zweiten
      // Spielers sind im Gefechtsstand alle hoeher, und seine Seite trat
      // sonst immer beiseite (kampf AC-26).
      const spaeter = e.besitzer === o.besitzer ? o.id > e.id : o.reihe > e.reihe;
      for (const wer of spaeter ? [o, e] : [e, o]) {
        if (ohnePlatz.has(wer.id) || !this.darfAusweichen(wer)) continue;
        const feld = this.ausweichfeld(wer, belegung(), wer === e ? o : e);
        if (!feld) {
          ohnePlatz.add(wer.id);
          continue;
        }
        wer.weg = [feld];
        if (wer.auftrag?.art === 'angreifen') wer.auftrag.tritt = true;
        belegung().add(schluessel(feld.x, feld.y));
        gezogen.add(wer.id);
        break;
      }
    }
  }

  // Wer ausweichen darf: wer kaempft, erst wenn er an seinem Ziel angekommen
  // ist und es noch steht - dann auf ein Feld in Schlagweite (einheiten AC-31,
  // Runde 100); nicht der Bauer auf seiner Farm (eine Farm hat einen
  // Arbeiter) - und nicht, wer am Vorrat oder am Tier arbeitet: der hat
  // seinen eigenen Platz (einheiten AC-30, `standplatz`), und ein Schritt auf
  // ein ganzes Nachbarfeld kostete die Wirtschafts-KI im Median 0,4 Minuten
  // bis zu den ersten 500 Nahrung (Runde 89, gemessen).
  darfAusweichen(einheit) {
    const art = einheit.auftrag?.art;
    if (art === 'angreifen') return Boolean(einheit.auftrag.angekommen && this.angriffsziel(einheit.auftrag));
    return art !== 'farm' && art !== 'sammeln' && art !== 'tier';
  }

  // Das Ziel eines Angriffs, solange es steht.
  angriffsziel(auftrag) {
    const ziel = auftrag.gebaeude ? this.gebaeude.get(auftrag.ziel) : this.einheiten.get(auftrag.ziel);
    return ziel && !ziel.tot ? ziel : null;
  }

  /**
   * Das naechste freie Nachbarfeld, auf dem die Einheit ihre Arbeit behaelt:
   * wer baut, bleibt an der Baustelle (1,2 Felder, wie der Bauauftrag).
   * Sammler und Schlachter weichen nicht aus, sie haben ihren Platz
   * (einheiten AC-30). Frei
   * heisst: begehbar, kein Gebaeude, niemand steht dort oder ist dorthin
   * unterwegs.
   */
  ausweichfeld(einheit, belegt, anderer = null) {
    const fx = Math.round(einheit.x);
    const fy = Math.round(einheit.y);
    const auftrag = einheit.auftrag;
    // Gleich nahe Felder entscheidet die Lage zum Ziel des Angriffs, sonst zu
    // dem, dem ausgewichen wird: erst rechts der Linie dorthin, dann naeher
    // daran. Die Reihenfolge der Schleife hing an der Himmelsrichtung, und
    // gespiegelte Heere traten verschieden beiseite (kampf AC-26).
    const bezug = (auftrag?.art === 'angreifen' && this.angriffsziel(auftrag)) || anderer;
    const bx = bezug ? bezug.x - einheit.x : 0;
    const by = bezug ? bezug.y - einheit.y : 0;
    let besteLage = 0;
    /** @type {(x: number, y: number) => boolean} */
    let passt = () => true;
    if (auftrag?.art === 'bauen' || auftrag?.art === 'reparieren') {
      const baustelle = this.gebaeude.get(auftrag.gebaeude);
      passt = (x, y) => !baustelle || this.abstandZu({ x, y }, baustelle) <= 1.2;
    } else if (auftrag?.art === 'angreifen') {
      // Dieselbe Schlagweite wie in angriffTakten - wer dort steht, schlaegt.
      const ziel = this.angriffsziel(auftrag);
      const reichweite = this.einheitenwert(einheit.besitzer, einheit.art, 'reichweite') || 1;
      passt = (x, y) => Boolean(ziel) && (auftrag.gebaeude
        ? this.abstandZu({ x, y }, ziel) <= reichweite + SCHLAGRAND_BAU
        : Math.hypot(ziel.x - x, ziel.y - y) <= reichweite + SCHLAGRAND);
    }
    let bestes = null;
    let bester = Infinity;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const x = fx + dx;
        const y = fy + dy;
        if (belegt.has(y * this.karte.groesse + x)) continue;
        if (!karten.begehbar(this.karte, x, y) || this.gebaeudeAn(x, y) || !passt(x, y)) continue;
        // Schraeg nur, wenn beide Ecken frei sind: auf halbem Weg rundet die
        // Lage auf eines der beiden geraden Nachbarfelder - war das Wald,
        // stand die Einheit im Hindernis (Gefechtsstand, Startwert 8, Takt 109).
        if (dx && dy && (!karten.begehbar(this.karte, x, fy) || !karten.begehbar(this.karte, fx, y)
          || this.gebaeudeAn(x, fy) || this.gebaeudeAn(fx, y))) continue;
        const d = Math.hypot(x - einheit.x, y - einheit.y);
        const rx = x - einheit.x;
        const ry = y - einheit.y;
        const lage = (rx * by - ry * bx) * 1e6 - (rx * bx + ry * by);
        if (d < bester - 1e-9 || (d <= bester + 1e-9 && lage < besteLage)) {
          bester = Math.min(d, bester);
          besteLage = lage;
          bestes = { x, y };
        }
      }
    }
    return bestes;
  }

  einheitTakten(einheit) {
    // Ein Toter liegt zwei Sekunden, dann ist er weg (kampf AC-10).
    if (einheit.tot) {
      if (this.takt - einheit.gefallen >= TOT_SEKUNDEN * TAKTE_PRO_SEKUNDE) this.einheiten.delete(einheit.id);
      return;
    }
    // Die Reihe gilt nur fuer einen Gang: wer unterwegs etwas anderes tut -
    // getroffen zurueckschlaegt, ausweicht, gerufen wird -, vergisst sie,
    // statt spaeter alte Ziele abzulaufen (bedienung AC-14).
    if (einheit.wegpunkte.length && einheit.auftrag?.art !== 'gehen') einheit.wegpunkte = [];
    // Ebenso die Reihe der Angriffe: sie gilt nur, solange angegriffen wird
    // (bedienung AC-50).
    if (einheit.angriffe.length && einheit.auftrag?.art !== 'angreifen') einheit.angriffe = [];
    // Angreifen geht vor dem Laufen: wer in Reichweite ist, schlaegt zu, statt
    // seinen Weg zu Ende zu gehen (kampf AC-1).
    if (einheit.auftrag?.art === 'angreifen') {
      this.angriffTakten(einheit);
      return;
    }
    if (einheit.auftrag?.art === 'bekehren') {
      this.bekehrenTakten(einheit);
      return;
    }
    if (einheit.auftrag?.art === 'heilen') {
      this.heilauftragTakten(einheit);
      return;
    }
    if (einheit.auftrag?.art === 'abruesten') {
      this.abruestenTakten(einheit);
      return;
    }
    // Faellt ein Markt der Strecke, bleibt der Karren stehen - sofort, nicht
    // erst am Ende des Weges (einheiten AC-40).
    if (einheit.auftrag?.art === 'handel' && !this.strecke(einheit)) {
      einheit.auftrag = null;
      einheit.weg = [];
      return;
    }
    if (einheit.weg.length) {
      einheit.sammelt = false;
      einheit.baut = false;
      this.laufen(einheit);
      return;
    }
    if (!einheit.auftrag) return;

    // Angekommen: der Gehauftrag ist erledigt. Er muss weg, sonst gilt die
    // Einheit fuer die Wache ewig als beschaeftigt und wehrt sich nie mehr
    // (kampf AC-2) - gefunden beim Bau des Angriffslaufs, Runde 67.
    if (einheit.auftrag.art === 'gehen') {
      // Steht noch ein Ziel in der Reihe, geht es dorthin weiter
      // (bedienung AC-14).
      if (einheit.wegpunkte.length) {
        this.gangBeginnen(einheit, einheit.wegpunkte.shift());
        return;
      }
      einheit.auftrag = null;
      einheit.angriffslauf = null;
      return;
    }

    if (einheit.auftrag.art === 'bauen') {
      const baustelle = this.gebaeude.get(einheit.auftrag.gebaeude);
      if (!baustelle || baustelle.fertig) {
        this.bauenWeiter(einheit);
      } else if (this.abstandZu(einheit, baustelle) <= 1.2) {
        einheit.baut = true;
      } else if (!einheit.baut) {
        // Nicht angekommen und kein Weg mehr: noch einmal suchen, sonst das
        // naechste Feld einer Mauer, sonst aufgeben.
        einheit.weg = this.wegZurBaustelle(einheit, baustelle);
        if (!einheit.weg.length) this.bauenWeiter(einheit);
      }
      return;
    }
    if (einheit.auftrag.art === 'reparieren') {
      this.reparierenTakten(einheit);
      return;
    }
    if (einheit.auftrag.art === 'tier') {
      this.tierTakten(einheit);
      return;
    }
    if (einheit.auftrag.art === 'handel') {
      this.handelTakten(einheit);
      return;
    }
    if (einheit.auftrag.art === 'farm') {
      // Eine leer gewordene Farm: die letzte Ladung noch abgeben.
      if (einheit.auftrag.leer) {
        if (einheit.ladung > 0) this.abladen(einheit);
        else einheit.auftrag = null;
        return;
      }
      this.farmTakten(einheit);
      return;
    }
    if (einheit.auftrag.art === 'abgeben') {
      if (einheit.ladung > 0) this.abladen(einheit);
      else einheit.auftrag = null;
      return;
    }
    if (einheit.auftrag.art === 'ei') {
      this.eiTakten(einheit);
      return;
    }
    if (einheit.auftrag.art === 'eiBringen') {
      this.eiBringenTakten(einheit);
      return;
    }
    if (einheit.auftrag.art !== 'sammeln') {
      einheit.auftrag = null;
      return;
    }
    if (einheit.ladung >= this.tragkraft(einheit)) this.abladen(einheit);
    else if (einheit.sammelt) this.sammelnSchritt(einheit);
    else this.sammelnBeginnen(einheit);
  }

  // Tempo aus den Daten, in Feldern je Sekunde (einheiten AC-19). Wer in
  // einem Takt an einem Wegpunkt ankommt, geht mit dem Rest des Takts zum
  // naechsten weiter (einheiten AC-70): bis zum 2026-11-22 endete der Takt
  // am Wegpunkt, und Tempo 1,0 brauchte 11 statt 10 Takte je Feld - jede
  // Einheit war rund 9 % langsamer als ihr Wert in den Daten.
  laufen(einheit) {
    wegGehen(einheit, this.einheitenwert(einheit.besitzer, einheit.art, 'tempo') / TAKTE_PRO_SEKUNDE);
  }

  // Steht die Einheit am Vorrat, faengt sie an zu arbeiten; sonst laeuft sie
  // hin, oder - ist der Vorrat leer - zum naechsten gleicher Art.
  sammelnBeginnen(einheit) {
    const feld = einheit.auftrag.feld;
    const index = feld.y * this.karte.groesse + feld.x;
    const rest = this.karte.vorrat.get(index) || 0;

    if (rest <= 0) {
      // Vorrat aufgebraucht: der naechste gleicher Art in der Naehe uebernimmt,
      // damit die Sammler nicht einfach stehenbleiben.
      const ersatz = this.naechsterVorrat(einheit, einheit.zuletztGesammelt);
      if (!ersatz) {
        einheit.sammelt = false;
        // Nichts Gleiches mehr in der Naehe: was er traegt, bringt er noch
        // heim, statt damit stehenzubleiben (einheiten AC-55).
        if (einheit.ladung > 0) this.abgebenBeginnen(einheit);
        else einheit.auftrag = null;
        return;
      }
      einheit.auftrag = { art: 'sammeln', feld: ersatz };
      this.wegZumVorrat(einheit);
      return;
    }
    // Gearbeitet wird vom eigenen Platz aus (einheiten AC-30) - wer noch
    // keinen hat oder nicht darauf steht, geht hin.
    if (!this.amStand(einheit) || Math.hypot(einheit.x - feld.x, einheit.y - feld.y) > SAMMELN_WEIT) {
      this.wegZumVorrat(einheit);
      if (einheit.weg.length) return;
      if (!this.amStand(einheit)) {
        this.vorratUnerreichbar(einheit, index);
        return;
      }
      // Der Weg kann den Vorrat gewechselt haben (alle Plaetze vergeben).
      if (einheit.auftrag.feld !== feld) return;
    }
    einheit.zuletztGesammelt = this.karte.felder[index];
    einheit.unerreichbar = null;
    einheit.sammelt = true;
  }

  // Kein Weg zum Vorrat (fahrplan AC-6): ein anderer derselben Art nimmt seinen
  // Platz ein, nach dreien gibt die Einheit auf. Vorher suchte sie in jedem
  // Takt neu ueber die ganze Karte - mit 800 Einheiten 98 % der Rechenzeit.
  vorratUnerreichbar(einheit, index) {
    einheit.unerreichbar ??= [];
    einheit.unerreichbar.push(index);
    // Zuerst der Vorrat gleicher Art, der dem gewuenschten am naechsten liegt
    // und an den sie herankommt (einheiten AC-63) - auch derselbe von einer
    // anderen Seite. Gibt es dort keinen, wie bisher der naechste bei ihr.
    const nahe = einheit.unerreichbar.length <= 3 ? this.vorratErsatz(einheit, index) : null;
    if (nahe) {
      einheit.auftrag = { art: 'sammeln', feld: nahe.feld, seite: nahe.stand };
      return;
    }
    const ersatz = einheit.unerreichbar.length <= 3
      ? this.naechsterVorrat(einheit, this.karte.felder[index], einheit.unerreichbar)
      : null;
    if (!ersatz) {
      einheit.auftrag = null;
      einheit.unerreichbar = null;
      return;
    }
    einheit.auftrag = { art: 'sammeln', feld: ersatz };
  }

  /**
   * Der Vorrat derselben Art, der dem Feld `index` am naechsten liegt und an
   * den die Einheit herankommt, hoechstens SUCHWEITE_ERSATZ Felder davon
   * (einheiten AC-63): wer auf einen Baum mitten im Wald klickt, meint den
   * Wald dort - nicht den Baum neben dem Dorfbewohner. Geflutet wird einmal
   * je Fall, nicht je Takt. `stand` ist das erreichbare Feld am Vorrat, das
   * der Einheit am naechsten liegt.
   *
   * @returns {{feld: {x: number, y: number}, stand: {x: number, y: number}} | null}
   */
  vorratErsatz(einheit, index) {
    const g = this.karte.groesse;
    const art = this.karte.felder[index];
    const wx = index % g;
    const wy = (index / g) | 0;
    const da = erreichbar(this.karte, this.feldVon(einheit), this.toreVon(einheit.besitzer));
    let bestes = null;
    let bester = SUCHWEITE_ERSATZ;
    for (const i of this.karte.vorrat.keys()) {
      if (this.karte.felder[i] !== art || (i !== index && einheit.unerreichbar?.includes(i))) continue;
      const x = i % g;
      const y = (i / g) | 0;
      const abstand = Math.hypot(x - wx, y - wy);
      if (abstand >= bester) continue;
      let stand = null;
      let naehe = Infinity;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if ((!dx && !dy) || nx < 0 || ny < 0 || nx >= g || ny >= g || !da[ny * g + nx]) continue;
          const d = Math.hypot(nx - einheit.x, ny - einheit.y);
          if (d < naehe) {
            naehe = d;
            stand = { x: nx, y: ny };
          }
        }
      }
      if (!stand) continue;
      bester = abstand;
      bestes = { feld: { x, y }, stand };
    }
    return bestes;
  }

  /**
   * Jeder Vorrat, von dem schon genommen wurde, als [Feld, Viertel] - dieselbe
   * Zahl, die eine Feldaenderung als `v` traegt (darstellung AC-31).
   * @returns {number[][]}
   */
  angebrochen() {
    const raus = [];
    for (const [index, rest] of this.karte.vorrat) {
      const voll = karten.VORRAT[this.karte.felder[index]];
      if (voll && rest > 0 && rest < voll) raus.push([index, Math.ceil((rest / voll) * 4)]);
    }
    return raus;
  }

  // Ein Takt Arbeit am Vorrat: die Rate der Vorlage, in ganzen Einheiten vom
  // Vorrat genommen (einheiten AC-15). Voll geht es zur Abgabe.
  sammelnSchritt(einheit) {
    const feld = einheit.auftrag.feld;
    const index = feld.y * this.karte.groesse + feld.x;
    const art = this.karte.felder[index];
    const sammeln = SAMMELN[art];
    const rest = this.karte.vorrat.get(index) || 0;
    if (!sammeln || rest <= 0) {
      einheit.sammelt = false;
      this.sammelnBeginnen(einheit);
      return;
    }

    einheit.angefangen += this.sammelrate(einheit.besitzer, sammeln.rohstoff, sammeln.rate) / TAKTE_PRO_SEKUNDE;
    if (einheit.angefangen < 1) return;
    einheit.angefangen -= 1;

    this.karte.vorrat.set(index, rest - 1);
    einheit.ladung += 1;
    einheit.ladungsart = sammeln.rohstoff;

    // Das Bild zeigt, wie voll ein Vorrat noch ist - in Vierteln, und nur wenn
    // ein Viertel verloren geht, damit keine Nachricht je Einheit entsteht
    // (darstellung AC-3). Dazu das erste Stueck: von da an ist der Vorrat
    // angebrochen, und ein Baum liegt gefaellt da (darstellung AC-31).
    const voll = karten.VORRAT[art];
    const viertelVorher = Math.ceil((rest / voll) * 4);
    const viertelNachher = Math.ceil(((rest - 1) / voll) * 4);
    if (rest - 1 > 0 && (viertelNachher !== viertelVorher || rest === voll)) {
      this.feldAenderungen.push({ i: index, a: art, v: viertelNachher });
    }
    if (rest - 1 <= 0) {
      this.karte.felder[index] = karten.GRAS;
      this.karte.vorrat.delete(index);
      this.feldAenderungen.push({ i: index, a: karten.GRAS });
      einheit.sammelt = false;
    }

    if (einheit.ladung >= this.tragkraft(einheit)) {
      einheit.sammelt = false;
      this.wegZumLager(einheit);
    }
  }

  abladen(einheit) {
    const spieler = this.spielerVon(einheit.besitzer);
    const lager = this.lagerFuer(einheit);
    if (!lager) return; // nirgends abzugeben: er wartet mit seiner Ladung
    if (this.abstandZu(einheit, lager) > 1.2) {
      this.wegZumLager(einheit);
      return;
    }
    spieler[einheit.ladungsart] += einheit.ladung;
    // Mitgezaehlt fuer die Tafel (spielziel AC-8). Hier und nur hier: eine
    // Rueckerstattung aus einem abgebrochenen Auftrag ist nichts Gesammeltes.
    spieler.gesammelt[einheit.ladungsart] += einheit.ladung;
    einheit.ladung = 0;
    einheit.ladungsart = null;
    einheit.angefangen = 0;
    // Wer nur abgeben sollte, ist fertig - oder nimmt die Arbeit wieder auf,
    // aus der ihn der Befehl geholt hat (einheiten AC-55, AC-56).
    if (einheit.auftrag?.art === 'abgeben') {
      einheit.auftrag = einheit.auftrag.zurueck || null;
      if (!einheit.auftrag) return;
    }
    // Zurueck an die Arbeit: zum selben Vorrat, Tier oder zur selben Farm.
    if (einheit.auftrag?.art === 'farm') {
      const farm = this.gebaeude.get(einheit.auftrag.gebaeude);
      // Der Befehl zum Abladen hat die Farm freigegeben (`farmVerlassen`);
      // ist sie noch frei, gehoert sie wieder ihm (einheiten AC-56).
      if (farm && !einheit.auftrag.leer && !farm.arbeiter) {
        farm.arbeiter = einheit.id;
        this.gebaeudeGeaendert(farm);
      }
      if (farm && !einheit.auftrag.leer) this.wegZurFarm(einheit, farm);
      else einheit.auftrag = null;
      return;
    }
    if (einheit.auftrag?.art === 'tier') {
      const tier = this.tiere.get(einheit.auftrag.tier) || this.naechstesTier(einheit);
      if (tier) {
        einheit.auftrag = { art: 'tier', tier: tier.id };
        this.wegZumTier(einheit, tier);
      }
      return;
    }
    this.wegZumVorrat(einheit);
  }

  naechsterVorratAus(einheit, arten) {
    let bestes = null;
    let besterAbstand = SUCHWEITE_ERSATZ;
    for (const index of this.karte.vorrat.keys()) {
      if (!arten.has(this.karte.felder[index])) continue;
      const x = index % this.karte.groesse;
      const y = (index / this.karte.groesse) | 0;
      const abstand = Math.hypot(x - einheit.x, y - einheit.y);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = { x, y };
      }
    }
    return bestes;
  }

  naechsterVorrat(einheit, art, ausser = null) {
    let bestes = null;
    let besterAbstand = SUCHWEITE_ERSATZ;
    for (const index of this.karte.vorrat.keys()) {
      if (art !== undefined && this.karte.felder[index] !== art) continue;
      if (ausser && ausser.includes(index)) continue;
      const x = index % this.karte.groesse;
      const y = (index / this.karte.groesse) | 0;
      const abstand = Math.hypot(x - einheit.x, y - einheit.y);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = { x, y };
      }
    }
    return bestes;
  }

  /**
   * Wohin eine Einheit schaut, solange sie kaempft oder bekehrt (bedienung
   * AC-76): die Richtung zu ihrem Ziel als Achtel der Karte - 0 laengs +x,
   * 2 laengs +y, 4 laengs -x, 6 laengs -y. Bei einem Gebaeude zum naechsten
   * Punkt seiner Grundflaeche: ein Tor ist vier Felder lang. Wer gefallen
   * ist, traegt die Richtung zu dem, der ihn traf. Ohne Ziel: nichts - das
   * Bild behaelt die Richtung, in die sie zuletzt ging.
   */
  richtungFeld(einheit) {
    if (einheit.tot) return einheit.fallrichtung === null || einheit.fallrichtung === undefined ? {} : { zr: einheit.fallrichtung };
    const auftrag = einheit.auftrag;
    const kaempft = auftrag?.art === 'angreifen' && !einheit.weg.length;
    if (!kaempft && !(auftrag?.art === 'bekehren' && einheit.bekehrt) && !(auftrag?.art === 'heilen' && einheit.heilt)) return {};
    const ziel = auftrag.gebaeude ? this.gebaeude.get(auftrag.ziel) : this.einheiten.get(auftrag.ziel);
    if (!ziel) return {};
    let { x, y } = ziel;
    if (auftrag.gebaeude) {
      const { x0, y0, x1, y1 } = this.grundflaeche(ziel.art, ziel.x, ziel.y, ziel.quer);
      x = Math.min(Math.max(einheit.x, x0), x1);
      y = Math.min(Math.max(einheit.y, y0), y1);
    }
    const richtung = achtel(x - einheit.x, y - einheit.y);
    return richtung === null ? {} : { zr: richtung };
  }

  // Was der Browser braucht, um ein Bild zu zeichnen - mehr nicht.
  zustand() {
    const einheiten = [];
    const bevoelkerung = this.bevoelkerung();
    for (const e of this.einheiten.values()) {
      einheiten.push({
        i: e.id,
        k: EINHEITEN[e.art].kuerzel,
        b: e.besitzer,
        x: Math.round(e.x * 100) / 100,
        y: Math.round(e.y * 100) / 100,
        l: e.ladung,
        a: e.ladungsart ? e.ladungsart[0] : null,
        // Leben nur, wenn es fehlt: das volle steht im Aufbau (bedienung AC-29),
        // und ein Zustand bleibt klein (uebertragung AC-7).
        ...(e.leben < this.lebenMax(e.besitzer, e.art) ? { h: e.leben } : {}),
        // Arbeitet gerade: sammelt, huetet, bestellt eine Farm oder baut
        // (bedienung AC-31) - oder kaempft: hat ein Ziel und steht in
        // Reichweite, ohne Weg (bedienung AC-39). Nur wenn es zutrifft - ein
        // Zustand bleibt klein.
        // Ein Moench, der heilt, arbeitet auch (einheiten AC-37).
        ...(e.sammelt || e.baut || e.heilt || e.bekehrt || (e.auftrag?.art === 'angreifen' && !e.weg.length && !e.tot) ? { w: 1 } : {}),
        // Ein Moench, der gerade bekehrt (bedienung AC-74): `w` sagt nur,
        // dass er arbeitet - heilen und bekehren klingen verschieden.
        ...(e.bekehrt ? { bk: 1 } : {}),
        // Wer repariert (bauen AC-45): er haemmert, obwohl dort keine
        // Baustelle steht.
        ...(e.baut && e.auftrag?.art === 'reparieren' ? { rp: 1 } : {}),
        // Wer kaempft, nennt den Takt seines letzten Schlags (bedienung
        // AC-72): eine Schlagbewegung je Schlag, nicht eine je Bild. Die Zahl
        // aendert sich nur mit dem Schlag - der Zustand bleibt klein.
        ...(e.auftrag?.art === 'angreifen' && !e.weg.length && !e.tot && e.schlagTakt !== null ? { sl: e.schlagTakt } : {}),
        // Wohin sie dabei schaut (bedienung AC-76): zu ihrem Ziel - und wer
        // faellt, zu dem, der ihn traf. In Achteln; aendert sich selten.
        ...this.richtungFeld(e),
        // Ein Moench, der nach dem Bekehren ruht (einheiten AC-38): wie viele
        // Sekunden noch (bedienung AC-68) - in ganzen Sekunden, damit sich
        // der Zustand nur einmal je Sekunde aendert.
        ...(e.ruhtBis > this.takt ? { r: Math.ceil((e.ruhtBis - this.takt) / TAKTE_PRO_SEKUNDE) } : {}),
        // Wer abruestet (einheiten AC-50): wie viele Sekunden Lehrzeit noch -
        // ganze Sekunden, wie beim Moench.
        ...(e.auftrag?.art === 'abruesten' && !e.tot ? { ab: Math.ceil((e.auftrag.bis - this.takt) / TAKTE_PRO_SEKUNDE) } : {}),
        // Ein Karren auf der Strecke (einheiten AC-40): Heimat, Ziel und das
        // Gold je Fahrt - die Leiste nennt sie.
        ...(e.auftrag?.art === 'handel' ? { hd: this.streckeFuerDraht(e) } : {}),
        // Wie viele Ziele noch in der Reihe stehen (bedienung AC-14, AC-50) -
        // die Punkte selbst kennt der Browser, der sie geklickt hat. Gaenge
        // und Angriffe stehen nie zugleich in einer Reihe.
        ...(e.wegpunkte.length || e.angriffe.length ? { q: e.wegpunkte.length + e.angriffe.length } : {}),
        // Gefallen: der Browser legt ihn hin, bis der Server ihn nimmt
        // (kampf AC-10).
        ...(e.tot ? { s: 1 } : {}),
      });
    }
    const felder = this.feldAenderungen;
    this.feldAenderungen = [];
    // Pfeile seit dem letzten Zustand (bedienung AC-40), je [x0, y0, x1, y1].
    const schuesse = this.schuesse || [];
    this.schuesse = [];
    /** @type {Zustand} */
    const zustand = {
      typ: 'zustand',
      t: this.takt,
      spieler: this.spieler.map((s) => ({
        id: s.id,
        holz: s.holz,
        nahrung: s.nahrung,
        gold: s.gold,
        stein: s.stein,
        bev: bevoelkerung.get(s.id) || 0,
        raum: this.wohnraum(s),
        ...(s.verbesserungen.length ? { v: s.verbesserungen } : {}),
        // Die Kampfwerte dieses Spielers, nur wenn sich etwas geaendert hat
        // (bedienung AC-35) - wie Gebaeude und Tiere.
        ...(this.werteAenderungen.has(s.id) ? { kw: this.kampfwerte(s.id) } : {}),
        // Die Marktpreise, nur nach einem Handel (bauen AC-33).
        ...(this.preisAenderungen.has(s.id) ? { hp: this.handelspreise(s.id) } : {}),
        // Zeitalter als Stufe, nur wenn es nicht die Dunkle Zeit ist
        // (bedienung AC-33) - ein Zustand bleibt klein.
        ...(s.zeitalter ? { z: s.zeitalter } : {}),
        // Farmen werden von selbst neu ausgesaet (bauen AC-42) - nur wenn an.
        ...(s.farmenErneuern ? { fe: 1 } : {}),
        // Gefallene, mit denen sich bezahlen laesst (einheiten AC-49).
        ...(s.gefallene ? { gf: s.gefallene } : {}),
        // Die Karte ist bekannt (Kartografie, bauen AC-52) - fuer jeden, der
        // die Sicht des Forschers teilt.
        ...(this.sichten?.get(s.id)?.karte ? { ka: 1 } : {}),
        // Untaetige Dorfbewohner, nur wenn es welche gibt (einheiten AC-21).
        ...untaetigeListe(this, s.id),
        // Arbeiter je Rohstoff, in der Reihenfolge holz, nahrung, gold, stein
        // (bedienung AC-32).
        a: this.arbeiterVon(s.id),
        // Ausgeschieden, nur wenn es zutrifft (spielziel AC-5) - und ob durch
        // Aufgeben (spielziel AC-27).
        ...(s.aus ? { aus: 1 } : {}),
        ...(s.aufgegeben ? { ag: 1 } : {}),
        // Die Punkte (bedienung AC-47), sobald es welche gibt.
        ...punkteFeld(this.punkte(s)),
        // Ein neuer Angriff auf ihn, mit Ort (kampf AC-14) - einmal.
        ...(s.angriff?.neu ? { m: [Math.round(s.angriff.x), Math.round(s.angriff.y)] } : {}),
      })),
      einheiten,
      felder,
      ...(schuesse.length ? { p: schuesse } : {}),
      // Geloeste Buendnisse (spielziel AC-21), je [wer, Takt des
      // Fristendes] - an alle, denn eine Kuendigung ist oeffentlich. Ist
      // `t` ueber dem Fristende, gehoert `wer` keinem Team mehr an.
      ...(this.kuendigungen.length ? { bu: this.kuendigungen.map((k) => [k.wer, k.bis]) } : {}),
      // Der Ruf des Drachen (bauen AC-35), je [wer, Restsekunden, Moenche am
      // Kloster, x, y der Klostermitte] - an alle: der Gegner soll antworten
      // koennen. Und wo eben ein Drache fiel (einheiten AC-53), je [wer, x,
      // y, Restsekunden der Ansage].
      ...this.drachenFelder(),
      ...this.wunderFeld(),
      // Die Eier am Boden (einheiten AC-51), je [id, x, y, in der Mulde] -
      // hoechstens drei, deshalb in jedem Zustand. Getragene zeigt die
      // Ladung des Traegers, eingelagerte das Kloster.
      ...this.eierFeld(),
      // Das Ende, sobald es feststeht - danach schickt der Raum keinen
      // Zustand mehr (spielziel AC-5).
      ...(this.ende ? { ende: this.ende } : {}),
    };
    this.werteAenderungen.clear();
    this.preisAenderungen.clear();
    for (const s of this.spieler) if (s.angriff) s.angriff.neu = false;
    if (this.gebaeudeAenderungen.size) {
      zustand.gebaeude = [...this.gebaeudeAenderungen].map((id) => this.gebaeudeFuerDraht(id));
      this.gebaeudeAenderungen.clear();
    }
    // Tiere nur, wenn sich eines geaendert hat.
    if (this.tierAenderungen.length) {
      zustand.tiere = this.tierAenderungen.map((id) => this.tierFuerDraht(id));
      this.tierAenderungen = [];
    }
    return zustand;
  }

  drachenFelder() {
    const felder = {};
    const rufe = [];
    for (const g of this.gebaeude.values()) {
      if (!g.ruf) continue;
      const { x0, y0, x1, y1 } = this.grundflaeche(g.art, g.x, g.y, g.quer);
      const rest = Math.ceil((DRACHE.rufen.sekunden * TAKTE_PRO_SEKUNDE - g.ruf.takte) / TAKTE_PRO_SEKUNDE);
      rufe.push([g.besitzer, rest, g.ruf.moenche, (x0 + x1) / 2, (y0 + y1) / 2]);
    }
    if (rufe.length) felder.dr = rufe;
    const faelle = this.drachenFaelle.filter((f) => f.bis > this.takt);
    if (faelle.length) felder.df = faelle.map((f) => [f.wer, f.x, f.y, Math.ceil((f.bis - this.takt) / TAKTE_PRO_SEKUNDE)]);
    return felder;
  }

  eierFeld() {
    const ei = [];
    for (const e of this.eier.values()) {
      if (!this.eiAmBoden(e)) continue;
      // Fuenfter Wert: hier fiel ein Drache - das sehen alle (einheiten AC-53).
      ei.push([e.id, e.x, e.y, e.x === e.nest.x && e.y === e.nest.y ? 1 : 0, ...(e.gefallen ? [1] : [])]);
    }
    return ei.length ? { ei } : {};
  }

  streckeFuerDraht(einheit) {
    const s = this.strecke(einheit);
    return s ? [s.heimat.id, s.ziel.id, this.handelsgewinn(s.heimat, s.ziel)] : undefined;
  }

  /**
   * Jedem Spieler sein Auszug (kampf AC-13, fahrplan AC-13): der Zustand wird
   * einmal gerechnet und dann je Spieler gefiltert. Sonst laese ein
   * veraendertes Programm die ganze Karte mit - der Browser liess Fremdes nur
   * beim Zeichnen weg (kampf AC-11).
   *
   * @param {string[]} ids die Spieler, die einen Zustand bekommen
   * @returns {Map<string, object>}
   */
  zustandJeSpieler(ids) {
    const voll = this.zustand();
    return new Map(ids.map((id) => [id, this.mitAngesehenem(this.auszug(voll, id), id)]));
  }

  /**
   * Einen Vorrat ansehen (bedienung AC-63): der Spieler nennt ein Feld, und
   * solange er hinsieht, traegt sein Zustand den Rest dieses einen Vorrats.
   * Die Mengen aller Vorraete gingen sonst nie hinaus - Tausende Zahlen, von
   * denen er eine braucht. Ohne Feld oder mit einem, das es nicht gibt:
   * er sieht nichts mehr an. Kein Befehl - nichts in der Welt aendert sich.
   *
   * @param {string} spielerId
   * @param {{x: number, y: number} | undefined} feld
   */
  ansehen(spielerId, feld) {
    const spieler = this.spielerVon(spielerId);
    if (!spieler) return { fehler: 'Diesen Spieler gibt es hier nicht.' };
    const g = this.karte.groesse;
    const gueltig = Boolean(feld) && Number.isInteger(feld.x) && Number.isInteger(feld.y)
      && feld.x >= 0 && feld.y >= 0 && feld.x < g && feld.y < g;
    spieler.ansieht = gueltig ? feld.y * g + feld.x : null;
    return {};
  }

  /**
   * Der Rest des angesehenen Vorrats, nur fuer den, der hinsieht - und nur,
   * wenn er das Feld sieht (kampf AC-13): wie weit der Gegner seinen Wald
   * schon geschlagen hat, verriete sonst der Nebel. Ist der Vorrat leer,
   * sieht er nichts mehr an.
   */
  mitAngesehenem(auszug, id) {
    const spieler = this.spielerVon(id);
    const index = spieler?.ansieht;
    if (index === null || index === undefined) return auszug;
    const rest = this.karte.vorrat.get(index);
    if (!(rest > 0)) {
      spieler.ansieht = null;
      return auszug;
    }
    const g = this.karte.groesse;
    if (this.nebelGiltFuer(id) && !this.sieht(id, index % g, Math.floor(index / g))) return auszug;
    return { ...auszug, av: [index, rest] };
  }

  // Gilt fuer diesen Spieler der Nebel? Nicht, wenn alles aufgedeckt ist, nicht
  // nach dem Ende und nicht fuer den, der ausgeschieden ist und zusieht
  // (spielziel AC-7) - wie im Browser (`ansicht.nebelAn`).
  nebelGiltFuer(id) {
    const spieler = this.spielerVon(id);
    return Boolean(spieler) && !spieler.aus && !this.ende && this.sichtArt !== 'aufgedeckt';
  }

  // Sieht der Spieler ein Feld der Grundflaeche?
  siehtGebaeude(id, g) {
    const { x0, y0, x1, y1 } = this.grundflaeche(g.art, g.x, g.y, g.quer);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.sieht(id, x, y)) return true;
    return false;
  }

  /**
   * Was ein Spieler von fremden Gebaeuden weiss (kampf AC-12, AC-13): ein
   * Gebaeude, sobald er es sieht, und jede Aenderung, solange er es sieht. Was
   * im Nebel faellt, erfaehrt er erst, wenn er wieder hinsieht - bis dahin
   * steht es in seinem Browser so da, wie er es zuletzt sah.
   */
  gebaeudeFuer(id, aenderungen) {
    if (!this.bekannt) this.bekannt = new Map();
    if (!this.bekannt.has(id)) this.bekannt.set(id, new Map());
    const bekannt = this.bekannt.get(id);
    const geaendert = new Set(aenderungen.map((g) => g.i));
    const raus = [];
    for (const g of aenderungen) {
      // Eigene immer, auch das Verschwinden - und die der Verbuendeten
      // (spielziel AC-19): ihr Dorf faellt nicht im Nebel, man sieht es.
      if (this.teiltSicht(id, this.gebaeudeBesitzer.get(g.i))) raus.push(g);
    }
    for (const g of this.gebaeude.values()) {
      if (this.teiltSicht(id, g.besitzer)) continue;
      const alt = bekannt.get(g.id);
      if (!this.siehtGebaeude(id, g)) {
        // Im Nebel fertig geworden oder beschaedigt: beim naechsten Hinsehen
        // nachschicken, sonst stuende die Baustelle fuer immer da (Durchsicht
        // Runde 110).
        if (alt && geaendert.has(g.id)) alt.veraltet = true;
        continue;
      }
      if (!alt || alt.veraltet || geaendert.has(g.id)) raus.push(this.gebaeudeFuerDraht(g.id));
      bekannt.set(g.id, { art: g.art, x: g.x, y: g.y });
    }
    for (const [gid, ort] of bekannt) {
      if (this.gebaeude.has(gid) || !this.siehtGebaeude(id, ort)) continue;
      raus.push(this.gebaeudeWeg(gid));
      bekannt.delete(gid);
    }
    return raus;
  }

  /**
   * Feldaenderungen in Sicht (kampf AC-13): ein gefaellter Baum, ein neuer
   * Bauplatz im Nebel verriete, wo der Gegner arbeitet. Was im Nebel geschieht,
   * wartet, bis der Spieler wieder hinsieht - dann gilt der letzte Stand.
   */
  felderFuer(id, aenderungen) {
    if (!this.felderOffen) this.felderOffen = new Map();
    if (!this.felderOffen.has(id)) this.felderOffen.set(id, new Map());
    const offen = this.felderOffen.get(id);
    const g = this.karte.groesse;
    for (const f of aenderungen) offen.set(f.i, f);
    const raus = [];
    for (const [i, f] of offen) {
      if (!this.sieht(id, i % g, Math.floor(i / g))) continue;
      raus.push(f);
      offen.delete(i);
    }
    return raus;
  }

  // Der Nebel faellt fuer diesen Spieler (ausgeschieden, Ende): er bekommt
  // einmal alle Gebaeude und alles Aufgeschobene, denn sein Browser zeigt
  // jetzt alles (Durchsicht Runde 110).
  nebelAufheben(voll, id) {
    const offen = this.felderOffen?.get(id);
    // Was im Nebel fiel, steht in seinem Browser noch da.
    const weg = [...this.bekannt.get(id).keys()].filter((gid) => !this.gebaeude.has(gid)).map((gid) => this.gebaeudeWeg(gid));
    this.bekannt.delete(id);
    this.felderOffen?.delete(id);
    const neu = new Set((voll.gebaeude || []).map((g) => g.i));
    return {
      ...voll,
      felder: [...(offen ? offen.values() : []), ...voll.felder],
      gebaeude: [
        ...weg,
        ...[...this.gebaeude.keys()].filter((gid) => !neu.has(gid)).map((gid) => this.gebaeudeFuerDraht(gid)),
        ...(voll.gebaeude || []),
      ],
    };
  }

  auszug(voll, id) {
    if (!this.nebelGiltFuer(id)) return this.bekannt?.has(id) ? this.nebelAufheben(voll, id) : voll;
    const auszug = {
      ...voll,
      // Fremde Einheiten nur in Sicht; die eigenen und die der Verbuendeten
      // immer (spielziel AC-19).
      // Gefragt wird die Sicht, nicht das Team: waehrend der Frist einer
      // Kuendigung sind sie noch Verbuendete, sehen aber nicht mehr
      // gemeinsam (spielziel AC-21).
      // Eine Getarnte erst, wenn sie entdeckt ist (kampf AC-22) - gefragt
      // wird die eine Stelle; wer eben erst gefallen und schon geloescht ist,
      // nach seinem Feld.
      einheiten: voll.einheiten.filter((e) => {
        if (this.teiltSicht(id, e.b)) return true;
        const einheit = this.einheiten.get(e.i);
        return einheit ? this.siehtEinheit(id, einheit) : this.sieht(id, Math.round(e.x), Math.round(e.y));
      }),
      felder: this.felderFuer(id, voll.felder),
      // Von den anderen nur, was jeder sieht: wer draussen ist, das Zeitalter
      // und die Kampfwerte (die zeigt die Auswahl einer fremden Einheit) -
      // nicht ihre Vorraete und ihre Untaetigen. Wer mit ihm die Sicht teilt,
      // zeigt ihm dazu Vorraete und Bevoelkerung - fuer die Tafel auf `Tab`
      // (bedienung AC-20); Untaetige, Arbeiter und Angriffe bleiben seine.
      // Die Punkte sieht jeder (bedienung AC-47): sie sagen, wer vorne liegt,
      // nicht womit.
      spieler: voll.spieler.map((s) => (s.id === id ? s : {
        id: s.id, ...(s.aus ? { aus: 1 } : {}), ...(s.ag ? { ag: 1 } : {}), ...(s.z ? { z: s.z } : {}), ...(s.kw ? { kw: s.kw } : {}),
        ...punkteFeld(s.pk),
        ...(this.teiltSicht(id, s.id) ? {
          holz: s.holz, nahrung: s.nahrung, gold: s.gold, stein: s.stein, bev: s.bev, raum: s.raum,
        } : {}),
      })),
    };
    // Pfeile nur, wenn er Schuetzen oder Ziel sieht (kampf AC-13) - und gar
    // nicht, wenn keiner bleibt.
    const pfeile = (voll.p || []).filter(([x0, y0, x1, y1]) => this.sieht(id, Math.round(x0), Math.round(y0))
      || this.sieht(id, Math.round(x1), Math.round(y1)));
    if (pfeile.length) auszug.p = pfeile;
    else delete auszug.p;
    // Ein Ei am Boden nur, wo er hinsieht (einheiten AC-51).
    const eier = (voll.ei || []).filter(([, x, y, , gefallen]) => gefallen || this.sieht(id, x, y));
    if (eier.length) auszug.ei = eier;
    else delete auszug.ei;
    const gebaeude = this.gebaeudeFuer(id, voll.gebaeude || []);
    if (gebaeude.length) auszug.gebaeude = gebaeude;
    else delete auszug.gebaeude;
    return auszug;
  }

  /**
   * Der Aufbau je Spieler (kampf AC-13): fremde Gebaeude nur, wenn er sie
   * sieht. Wer zurueckkehrt, faengt mit seinem Wissen neu an - was er im Nebel
   * erinnerte, sieht er erst wieder, wenn er hinsieht.
   */
  aufbauFuer(id) {
    const voll = this.aufbau();
    if (!this.nebelGiltFuer(id)) return voll;
    if (!this.bekannt) this.bekannt = new Map();
    const bekannt = new Map();
    this.bekannt.set(id, bekannt);
    // Die Karte im Aufbau ist die heutige - Aufgeschobenes ist darin enthalten.
    this.felderOffen?.delete(id);
    const sichtbar = [...this.gebaeude.values()].filter((g) => this.teiltSicht(id, g.besitzer) || this.siehtGebaeude(id, g));
    for (const g of sichtbar) if (!this.teiltSicht(id, g.besitzer)) bekannt.set(g.id, { art: g.art, x: g.x, y: g.y });
    // Fremde Marktpreise verrieten, was der andere getauscht hat - wie seine
    // Vorraete bleiben sie bei ihm (bauen AC-33).
    const spieler = voll.spieler.map((s) => {
      if (s.id === id) return s;
      const { hp, ...rest } = s;
      return rest;
    });
    return { ...voll, spieler, gebaeude: sichtbar.map((g) => this.gebaeudeFuerDraht(g.id)) };
  }

  // Gebaeude mit Schlange und Fortschritt (bauen AC-10), fuer die
  // Ausbildungsleiste (bedienung AC-26).
  /**
   * Ein Gebaeude, das es nicht mehr gibt, fuer die Leitung. Ist es eben
   * eingestuerzt, steht dabei, wie viele Takte seine Truemmer noch liegen
   * (`z`, darstellung AC-26) - wer es erst spaeter bemerkt, sieht sie
   * entsprechend kuerzer oder gar nicht.
   * @param {number} id
   */
  gebaeudeWeg(id) {
    const takt = this.eingestuerzt.get(id);
    const rest = takt === undefined ? 0 : RUINE_SEKUNDEN * TAKTE_PRO_SEKUNDE - (this.takt - takt);
    return { i: id, weg: true, ...(rest > 0 ? { z: rest } : {}) };
  }

  gebaeudeFuerDraht(id) {
    const g = this.gebaeude.get(id);
    if (!g) return this.gebaeudeWeg(id);
    const laufend = g.schlange[0];
    return {
      i: g.id,
      art: g.art,
      b: g.besitzer,
      x: g.x,
      y: g.y,
      // Ein langes Gebaeude, das laengs y liegt (bauen AC-37).
      ...(g.quer ? { qu: 1 } : {}),
      h: g.leben,
      // Baufortschritt nur fuer Baustellen (darstellung AC-5).
      ...(g.fertig ? {} : { u: Math.round(g.bau * 100) / 100 }),
      ...(g.nahrung !== undefined ? { n: g.nahrung } : {}),
      // Eine leere Farm, die auf neue Saat wartet (bauen AC-41).
      ...(g.brach ? { br: 1 } : {}),
      s: g.schlange,
      f: laufend ? Math.round((g.fortschritt / (this.auftragWerte(laufend).zeit * TAKTE_PRO_SEKUNDE)) * 100) / 100 : 0,
      ...(g.sammelpunkt ? { p: { x: g.sammelpunkt.x, y: g.sammelpunkt.y } } : {}),
      w: g.wartet,
      // Eier im Kloster (einheiten AC-51) - die sieht jeder, der das Kloster sieht.
      ...(g.art === 'kloster' && this.eier?.size && this.eierIn(g) ? { e: this.eierIn(g) } : {}),
    };
  }

  tierFuerDraht(id) {
    const tier = this.tiere.get(id);
    if (!tier) return { i: id, weg: true };
    // g: geschlachtet - der Browser zeichnet dann einen Kadaver, der mit n kleiner wird.
    return { i: tier.id, art: tier.art, b: tier.besitzer, x: tier.x, y: tier.y, n: tier.nahrung, g: tier.geschlachtet };
  }

  // Einmalig beim Start: Karte und Spielerliste.
  aufbau() {
    return {
      typ: 'aufbau',
      takte: TAKTE_PRO_SEKUNDE,
      // Sichtbar, damit eine gute Karte wieder gespielt werden kann (auswahl AC-7).
      startwert: this.startwert,
      // Wie viel jeder sieht (kampf AC-16) - der Browser zeichnet danach.
      sicht: this.sichtArt,
      // Ob ein Buendnis geloest werden kann (spielziel AC-24): bei "fest"
      // zeigt der Browser den Knopf nicht.
      buendnisse: this.buendnisse,
      // Die Zeitgrenze in Spielminuten oder null (spielziel AC-22): der
      // Browser zeigt sie neben der Uhr.
      zeitgrenze: this.zeitgrenze,
      // Die Spielgeschwindigkeit (spielziel AC-23): `takte` bleibt die Zahl
      // je Spielsekunde (die Uhr im Bild), in echter Zeit kommen
      // `takte * tempo` Takte je Sekunde.
      tempo: this.tempo,
      karte: {
        groesse: this.karte.groesse,
        felder: Buffer.from(this.karte.felder).toString('base64'),
        // Was schon angebrochen ist, mit seinem Viertel (darstellung AC-31):
        // wer zurueckkehrt, saehe sonst jeden gefaellten Baum wieder stehen
        // und jeden halben Goldhaufen wieder voll.
        fuellung: this.angebrochen(),
      },
      spieler: this.spieler.map((s) => ({
        id: s.id,
        name: s.name,
        farbe: s.farbe,
        basis: s.basis,
        // Die Werte, wie sie fuer ihn gelten (bedienung AC-35). Im Aufbau fuer
        // jeden, damit auch einer, der nach einem Abbruch zurueckkehrt, die
        // schon erforschten Verbesserungen sieht (raeume AC-12).
        kw: this.kampfwerte(s.id),
        // Die Marktpreise, wie sie fuer ihn gelten (bauen AC-33).
        hp: this.handelspreise(s.id),
        // Das Team (spielziel AC-14): der Browser fragt damit, ob ein
        // Rechtsklick angreift oder hingeht - dieselbe Frage wie `feindlich`.
        ...(s.team ? { team: s.team } : {}),
        // Das Haus (spielauswahl AC-24), wie im Warteraum gewaehlt oder
        // aus dem Startwert gezogen.
        ...(s.haus ? { haus: s.haus } : {}),
        ...(s.aus ? { aus: 1 } : {}),
        ...(s.aufgegeben ? { ag: 1 } : {}),
      })),
      // Wer nach dem Ende zurueckkommt, sieht das Ende und nicht eine
      // Partie, die nicht mehr laeuft (spielziel AC-5).
      ...(this.ende ? { ende: this.ende } : {}),
      // Geloeste Buendnisse wie im Zustand (spielziel AC-21) - auch fuer
      // den, der nach einem Abbruch zurueckkommt.
      ...(this.kuendigungen.length ? { bu: this.kuendigungen.map((k) => [k.wer, k.bis]) } : {}),
      tiere: [...this.tiere.keys()].map((id) => this.tierFuerDraht(id)),
      gebaeude: [...this.gebaeude.keys()].map((id) => this.gebaeudeFuerDraht(id)),
      // Die Werte der Arten, einmal: der Browser zeigt Leben, Tragkraft und
      // Kosten, ohne sie selbst zu kennen (bedienung AC-26, AC-29).
      werte: {
        einheiten: Object.fromEntries(Object.entries(EINHEITEN).map(([art, w]) => [art, {
          kuerzel: w.kuerzel, leben: w.leben, tragkraft: w.tragkraft, kosten: w.kosten || null, zeit: w.zeit || null,
          baut: w.baut || [],
          // Ohne diese Zeile stuende der Speerkaempfer schon in der Dunklen
          // Zeit im Ausbildungsmenue (einheiten AC-23).
          zeitalter: w.zeitalter || 0,
          // Und nur bei den Haeusern, die sie ausbilden (einheiten AC-42).
          haeuser: w.haeuser || null,
          // Getarnt (kampf AC-22): die Tafel sagt, wie nah ein Gegner sein muss.
          getarnt: w.getarnt || 0,
          // Kampfwerte als Grundwerte; was fuer einen Spieler gilt, steht in
          // seiner Tafel `kw` (bedienung AC-35).
          angriff: w.angriff || 0, nahruestung: w.nahruestung || 0, fernruestung: w.fernruestung || 0,
          reichweite: w.reichweite || 0,
          // Sekunden zwischen zwei Schlaegen: das Bild holt danach aus
          // (bedienung AC-72).
          nachladen: w.nachladen || 0,
          sicht: w.sicht || 0,
          // Felder je Sekunde - das Menue nennt es (bedienung AC-55).
          tempo: w.tempo || 0,
          // Klassen und Bonus, damit die Leiste "+15 gegen Kavallerie"
          // schreiben kann (bedienung AC-35). Der Browser rechnet damit
          // keinen Schaden - das tut der Server (kampf AC-3).
          klassen: w.klassen || [],
          bonus: w.bonus || null,
          // Greift nur Gebaeude an (einheiten AC-35): das Zeichen am Ziel
          // bleibt dann bei einer Einheit gruen.
          nurGebaeude: Boolean(w.nurGebaeude),
          // Wer heilt, wie weit und wie viel (einheiten AC-37) - fuer die Leiste.
          heilen: w.heilen || null,
          // Wer bekehrt, wie weit und wen nicht (einheiten AC-38) - fuer das
          // Zeichen am Ziel und die Leiste.
          bekehren: w.bekehren ? { reichweite: w.bekehren.reichweite, ruhe: w.bekehren.ruhe, nicht: w.bekehren.nicht } : null,
          // Wer handelt (einheiten AC-40): die Leiste nennt seine Strecke.
          handelt: Boolean(w.handelt),
          // Wer die Waffen ablegen kann (einheiten AC-50): die Leiste
          // bietet es an. Entschieden wird auf dem Server.
          ruestetAb: ruestetAb(art),
          // Gerufen statt ausgebildet (bauen AC-35): kein Gebaeude hat ihn
          // in seiner Leiste.
          gerufen: Boolean(w.gerufen),
          // Wer fliegt, und ob diese Art einen Flieger trifft (kampf AC-23):
          // das Zeichen am Ziel und die Leiste fragen danach.
          fliegt: Boolean(w.fliegt),
          trifftFlieger: FLIEGER.some((f) => this.kannTreffen({ art }, { art: f })),
        }])),
        gebaeude: Object.fromEntries(Object.entries(GEBAEUDE).map(([art, w]) => [art, {
          // Ohne Nebel gibt es nichts aufzudecken: die Kartografie steht
          // dann nicht im Angebot (bauen AC-52).
          leben: w.leben, bildetAus: this.sichtArt === 'nebel' ? w.bildetAus : w.bildetAus.filter((a) => !VERBESSERUNGEN[a]?.karte),
          groesse: w.groesse, kosten: w.kosten, bauzeit: w.bauzeit,
          // Auf welcher Seite des Baumenues es steht (bedienung AC-64).
          seite: w.seite || 0,
          // Kein Quadrat (bauen AC-37): so viele Felder in einer Reihe, davon
          // an jedem Ende so viele Tuerme.
          laenge: w.laenge || null, pfeiler: w.pfeiler || 0,
          wohnraum: w.wohnraum, annahme: w.annahme, begehbar: Boolean(w.begehbar), nahrung: w.nahrung || null,
          // Ein Tor laesst Eigene durch und darf auf die eigene Mauer (bauen AC-31).
          tor: Boolean(w.tor), ersetzt: w.ersetzt || null,
          zeitalter: w.zeitalter || 0,
          // Acht Felder ueber den Rand (kampf AC-11, AC-15).
          sicht: w.sicht,
          // Ein Turm zeigt an der Auswahl, was er kann (bauen AC-29).
          angriff: w.angriff || 0, reichweite: w.reichweite || 0,
          // Die Burg schiesst eine Salve (bauen AC-32).
          pfeile: w.pfeile || 1,
          nahruestung: w.nahruestung, fernruestung: w.fernruestung,
          // Gezogen statt gesetzt, von Feld zu Feld (bauen AC-30).
          gezogen: Boolean(w.gezogen),
          // An ihm wird getauscht (bauen AC-33).
          handel: Boolean(w.handel),
        }])),
        // Wie viel ein Handel tauscht und welche Waren (bauen AC-33). Die
        // Preise rechnet der Server (`hp` je Spieler).
        handel: { menge: HANDEL.menge, waren: Object.keys(HANDEL.waren) },
        // Jede Verbesserung mit dem, was sie bringt, in Worten (bedienung
        // AC-55) - der Browser liest keine Wirkung aus den Daten.
        verbesserungen: Object.fromEntries(Object.entries(VERBESSERUNGEN).map(([art, v]) => [art, { ...v, bringt: bringt(v, GEBAEUDE_NAMEN) }])),
        // Die Haeuser mit dem, was sie bringen, in Worten (bedienung AC-69) -
        // welches jeder spielt, steht als `haus` am Spieler.
        // Wie voll ein Vorrat anfangs ist und was er gibt, je Feldart - und
        // die Nahrung eines Tiers (bedienung AC-63: "73 von 100").
        vorrat: Object.fromEntries(Object.entries(SAMMELN).map(([art, s]) => [art, { voll: karten.VORRAT[art], rohstoff: s.rohstoff }])),
        tiere: Object.fromEntries(Object.entries(TIERE).map(([art, t]) => [art, { nahrung: t.nahrung }])),
        haeuser: Object.fromEntries(Object.entries(HAEUSER).map(([art, haus]) => [art, {
          name: haus.name, wahlspruch: haus.wahlspruch, ...hausBringt(haus, GEBAEUDE_NAMEN, EINHEIT_NAMEN),
        }])),
        // Die Namen der Klassen, fuer den Bonus an der Auswahl (bedienung AC-35).
        klassen: KLASSEN,
        // Was Abruesten kostet und wie lang es dauert (einheiten AC-50).
        abruesten: { kosten: ABRUESTEN.kosten, sekunden: ABRUESTEN.sekunden },
        // Den Drachen rufen (bauen AC-35) - nur, wenn es ihn gibt.
        ...(this.drachenAn ? { drache: { kosten: DRACHE.rufen.kosten, sekunden: DRACHE.rufen.sekunden, moenche: DRACHE.rufen.moenche } } : {}),
        // Wie lang eine gezogene Mauer hoechstens ist (bauen AC-30).
        mauerMax: MAUER_MAX,
        // Wie viele Ziele mit Umschalt hoechstens warten (bedienung AC-14) -
        // der Browser zeichnet die Reihe und darf nicht mehr behalten, als
        // der Server annimmt (Durchsicht nach Runde 191).
        wegpunkteMax: WEGPUNKTE_MAX,
        // Die Zeitalter und was ein Aufstieg kostet (bauen AC-23, bedienung AC-33).
        zeitalter: ZEITALTER,
        // Mit dem, was der Aufstieg selbst staerkt, in Worten (bedienung AC-55).
        aufstiege: Object.fromEntries(Object.entries(AUFSTIEGE).map(([art, a]) => [art, { ...a, staerkt: staerkt(ZEITALTER[a.stufe].wirkung) }])),
      },
    };
  }
}

/**
 * Die Felder einer gezogenen Mauer von `von` nach `bis` (bauen AC-30), in
 * dieser Reihenfolge: eine Linie, in der jeder Schritt ein Nachbarfeld ist,
 * gerade oder schraeg. Schraeg genuegt als Sperre, weil die Wegsuche keine
 * Ecke schneidet (wege.js). Hoechstens `MAUER_MAX` Felder; die Ansicht
 * (`public/ansicht.js`) rechnet dieselbe Linie fuer die Vorschau.
 */
const MAUER_MAX = 60;
function mauerLinie(von, bis) {
  const x0 = Math.round(Number(von.x));
  const y0 = Math.round(Number(von.y));
  const x1 = Math.round(Number(bis.x));
  const y1 = Math.round(Number(bis.y));
  if (![x0, y0, x1, y1].every(Number.isInteger)) return null;
  const schritte = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  if (schritte + 1 > MAUER_MAX) return null;
  const felder = [];
  for (let i = 0; i <= schritte; i++) {
    const t = schritte ? i / schritte : 0;
    felder.push({ x: Math.round(x0 + (x1 - x0) * t), y: Math.round(y0 + (y1 - y0) * t) });
  }
  return felder;
}

module.exports = {
  mauerLinie, MAUER_MAX,
  Welt, TAKTE_PRO_SEKUNDE, STARTVORRAT, ROHSTOFFE, VERFOLGUNG_FELDER, WACHE_TAKTE,
  ZEITGRENZEN, GESCHWINDIGKEITEN, KUENDIGUNG_SEKUNDEN, WUNDER_SEKUNDEN, GEBAEUDE_NAMEN, EINHEIT_NAMEN,
};
