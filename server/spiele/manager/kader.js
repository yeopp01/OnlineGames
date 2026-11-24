// @ts-check
'use strict';

// Vereine und Spieler: Erzeugung, Werte, Aufstellung, Training, Entwicklung.
// Alle Namen sind erfunden - echte Vereine und Spieler sind lizenzpflichtig,
// und erfundene kosten nichts (→ docs/adr/0008-zweites-spiel-manager.md).
const { zufallAus, zahl, umMitte, eines } = require('./zufall');
const neigungen = require('./neigungen');

/** @typedef {import('./daten').Verein} Verein */
/** @typedef {import('./daten').Zufall} Zufall */

const TOR = 'TOR';
const ABW = 'ABW';
const MIT = 'MIT';
const ANG = 'ANG';
const POSITIONEN = [TOR, ABW, MIT, ANG];

// Wie viele je Position zu Beginn im Kader stehen.
const KADERPLAN = { [TOR]: 3, [ABW]: 7, [MIT]: 7, [ANG]: 3 };
// Unter diese Zahl darf kein Verein durch einen Verkauf fallen - sonst
// steht am Ende eine Mannschaft ohne Torwart auf dem Platz.
const MINDESTBESTAND = { [TOR]: 2, [ABW]: 5, [MIT]: 5, [ANG]: 2 };
const KADER_MAX = 26;
const BANK = 7;
const VEREINE_JE_LIGA = 18;

// ------------------------------------------------------------ Rollen

// Zwoelf Positionen auf dem Platz. `position` bleibt der Mannschaftsteil -
// nach ihm rechnen Markt, Mindestbestand und Handel -, die Rolle sagt, wo
// einer darin zu Hause ist.
const ROLLEN = ['TW', 'LV', 'IV', 'RV', 'DM', 'LM', 'ZM', 'RM', 'OM', 'LA', 'ST', 'RA'];
const TEIL = {
  TW: TOR, LV: ABW, IV: ABW, RV: ABW, DM: MIT, LM: MIT, ZM: MIT, RM: MIT, OM: MIT, LA: ANG, ST: ANG, RA: ANG,
};
// Wer keine Rolle mitbringt, hat die gewoehnlichste seines Mannschaftsteils.
const STAMMROLLE = { [TOR]: 'TW', [ABW]: 'IV', [MIT]: 'ZM', [ANG]: 'ST' };
// Wo eine Rolle auf dem Platz liegt: quer von links (0) nach rechts (2),
// laengs von hinten (0) nach vorn (4).
const LAGE = {
  LV: [0, 0], IV: [1, 0], RV: [2, 0], DM: [1, 1], LM: [0, 2], ZM: [1, 2], RM: [2, 2], OM: [1, 3], LA: [0, 4], ST: [1, 4], RA: [2, 4],
};
// Was eine fremde Position kostet: je Schritt quer, je Schritt laengs,
// hoechstens. Die zweite Position kostet fast nichts; ein Feldspieler im Tor
// oder ein Torwart im Feld fast alles.
const ABZUG_QUER = 0.05;
const ABZUG_LAENGS = 0.08;
const ABZUG_HOECHSTENS = 0.35;
const NEBENROLLE = 0.97;
const FALSCHES_FACH = 0.25;
// Die Nachbarn einer Rolle - aus ihnen kommt die zweite Position.
const NACHBARN = {
  LV: ['IV', 'LM'], IV: ['LV', 'RV', 'DM'], RV: ['IV', 'RM'], DM: ['IV', 'ZM'], LM: ['ZM', 'LA', 'LV'],
  ZM: ['DM', 'OM', 'LM', 'RM'], RM: ['ZM', 'RA', 'RV'], OM: ['ZM', 'ST'], LA: ['ST', 'LM'], ST: ['LA', 'RA', 'OM'], RA: ['ST', 'RM'],
};
// Die Rollen eines Kaders von zwanzig - der Plan fuer den Start und das Mass
// fuer Jugend und Nachruecker.
const ROLLENPLAN = {
  [TOR]: ['TW', 'TW', 'TW'],
  [ABW]: ['IV', 'IV', 'LV', 'RV', 'IV', 'LV', 'RV'],
  [MIT]: ['ZM', 'ZM', 'LM', 'RM', 'DM', 'OM', 'ZM'],
  [ANG]: ['ST', 'ST', 'LA', 'RA'],
};

/**
 * Eine feste Zahl zwischen 0 und 1 aus Kennung und Salz. Die Rollen haengen an
 * ihr statt am Zufall der Welt: so bleibt jede Welt, wie sie war, und bekommt
 * nur Rollen dazu.
 */
function streuung(text, salz) {
  let h = (2166136261 ^ salz) >>> 0;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/** Rolle und, bei etwa jedem Dritten, eine zweite Position gleich daneben. */
function rollen(id, rolle) {
  const nachbarn = NACHBARN[rolle];
  const zweite = nachbarn && streuung(id, 11) < 0.35 ? nachbarn[Math.floor(streuung(id, 12) * nachbarn.length)] : null;
  return { rolle, nebenrolle: zweite };
}

/**
 * Die Rolle fuer einen Neuen: im Verein die, von der es gemessen am Plan am
 * wenigsten gibt; ohne Verein nach den Anteilen des Plans.
 */
function rolleNachBedarf(kader, position, id) {
  const plan = ROLLENPLAN[position];
  if (!kader) return plan[Math.floor(streuung(id, 7) * plan.length)];
  return [...new Set(plan)]
    .map((rolle, i) => ({
      rolle,
      luecke: plan.filter((r) => r === rolle).length - kader.filter((s) => s.rolle === rolle).length + streuung(id, i) * 0.5,
    }))
    .sort((a, b) => b.luecke - a.luecke)[0].rolle;
}

/**
 * Wie gut ein Spieler auf einem Platz ist, von 0,25 bis 1: auf seiner Rolle
 * ganz, auf seiner zweiten fast, sonst je Schritt quer und laengs weniger.
 */
function eignung(spieler, platz) {
  const rolle = spieler.rolle || STAMMROLLE[spieler.position];
  if (rolle === platz) return 1;
  if (rolle === 'TW' || platz === 'TW') return FALSCHES_FACH;
  if (spieler.nebenrolle === platz) return NEBENROLLE;
  const [x1, y1] = LAGE[rolle];
  const [x2, y2] = LAGE[platz];
  return 1 - Math.min(ABZUG_HOECHSTENS, ABZUG_QUER * Math.abs(x1 - x2) + ABZUG_LAENGS * Math.abs(y1 - y2));
}

/** Die Eignung jeder Rolle auf jedem Platz - fuer die Anzeige im Browser. */
function eignungstabelle() {
  return Object.fromEntries(ROLLEN.map((rolle) => [rolle, Object.fromEntries(ROLLEN.map((platz) => [platz, eignung({ rolle }, platz)]))]));
}

/** Ins Tor gehoert ein Torwart, ins Feld keiner. */
const passtInsFach = (spieler, platz) => (platz === 'TW') === (spieler.position === TOR);

/** Rolle und zweite Position fuer einen, der noch keine hat - nach Bedarf im Kader oder, ohne Kader, nach dem Plan. */
const rollenFuer = (spieler, kaderliste) => rollen(spieler.id, rolleNachBedarf(kaderliste, spieler.position, spieler.id));

const ORTE = [
  'Ahlbeck', 'Bergstadt', 'Cronau', 'Dahlbruch', 'Eichwalde', 'Falkenau',
  'Grunbach', 'Hohenfeld', 'Immenstedt', 'Jarnitz', 'Kaltenberg', 'Lindhorst',
  'Moorbeck', 'Nordheim', 'Osterloh', 'Prenzau', 'Quellrode', 'Rethen',
  'Steinfurt', 'Tannroda', 'Uhlenbrook', 'Vosswinkel', 'Wehrshausen', 'Zellin',
  'Altenmark', 'Brackwede', 'Dornstadt', 'Elsterau', 'Fichtenhain', 'Gottorp',
  'Hallwangen', 'Isenbruck', 'Kesselstein', 'Lauterbrunn', 'Marienfels', 'Neudorf',
  'Oberwiesen', 'Pfaffenrode', 'Rabenau', 'Sonnewalde', 'Trebbin', 'Wolfsried',
];
const ZUSAETZE = ['FC', 'SV', 'VfB', 'SC', 'TSV', 'Eintracht', 'Union', 'Borussia', 'Fortuna', 'Rot-Weiß'];

// 60 mal 60 sind 3.600 Namen - genug fuer tausend Spieler zugleich, auch
// nach vielen Saisons mit Jugend und Karriereenden.
const VORNAMEN = [
  'Arne', 'Bela', 'Cem', 'Dennis', 'Elias', 'Falk', 'Gerrit', 'Hendrik',
  'Ilja', 'Jannis', 'Kai', 'Lasse', 'Malte', 'Nico', 'Ole', 'Piet',
  'Quirin', 'Ruben', 'Sven', 'Timo', 'Ulf', 'Vito', 'Wanja', 'Yannick',
  'Aaron', 'Boris', 'Colin', 'Davor', 'Emre', 'Fabio', 'Goran', 'Hugo',
  'Ivan', 'Joris', 'Kevin', 'Levin', 'Mirko', 'Noah', 'Oskar', 'Pascal',
  'Rasmus', 'Silas', 'Tarek', 'Urs', 'Viktor', 'Willi', 'Adem', 'Bastian',
  'Carlo', 'Dario', 'Enno', 'Finn', 'Gustav', 'Henrik', 'Jonte', 'Keno',
  'Linus', 'Mats', 'Nils', 'Paul',
];
const NACHNAMEN = [
  'Ahrens', 'Bruhn', 'Clausen', 'Dettmer', 'Ehlers', 'Freytag', 'Gerdes',
  'Hollmann', 'Ibsen', 'Jansen', 'Kortmann', 'Ledermann', 'Meinhardt',
  'Nowak', 'Ostermann', 'Petzold', 'Quandt', 'Rehberg', 'Suhr', 'Thelen',
  'Ulbricht', 'Vogler', 'Wendland', 'Zerbst', 'Bittner', 'Drescher',
  'Eggers', 'Fassbender', 'Grothe', 'Hammer', 'Illig', 'Kaltenbach',
  'Lorenzen', 'Marquardt', 'Niemeyer', 'Oswald', 'Pieper', 'Rademacher',
  'Stolze', 'Tiedemann', 'Albers', 'Brandt', 'Conrad', 'Dierks', 'Engel',
  'Fuchs', 'Graf', 'Hansen', 'Imhof', 'Jäger', 'Kruse', 'Lange', 'Maas',
  'Nagel', 'Otte', 'Pohl', 'Reuter', 'Sander', 'Timm', 'Voss',
];

// ------------------------------------------------------------ Werte

/**
 * Jahresgehalt in Tausend. Waechst mit der vierten Potenz der Staerke: ein
 * Star kostet ein Vielfaches, und die zweite Liga kann sich ihre schwaecheren
 * Kader leisten.
 */
function jahresgehalt(staerke) {
  return Math.round((staerke / 10) ** 4 * 0.6);
}

/**
 * Der Marktwert im Verhaeltnis zum Gehalt (Schritt 3 der Spieldynamik,
 * docs/manager/dynamik/plan.md): mit 24 bis 28 ist ein Jahresgehalt rund ein
 * Fuenftel des Werts (transfer AC-26). Das Gehalt bleibt, der Wert steigt.
 */
const WERT_JE_GEHALT = 2.3;

/**
 * Altersfaktor des Marktwerts, linear zwischen den Stuetzpunkten, ausserhalb
 * der erste und der letzte Wert. Bis 30 aus der Gegenprobe m3; danach je Jahr
 * ein Punkt, damit kein Geburtstag mehr als 15 % kostet (transfer AC-27) -
 * die Werte ab 31 sind gesetzt, nicht aus einer Vorlage.
 */
const ALTERSPUNKTE = [[21, 1.35], [26, 1.15], [30, 0.75], [31, 0.65], [32, 0.56], [33, 0.48], [34, 0.41], [35, 0.35]];

function altersfaktor(alter) {
  if (alter <= ALTERSPUNKTE[0][0]) return ALTERSPUNKTE[0][1];
  for (let i = 1; i < ALTERSPUNKTE.length; i++) {
    const [bis, nach] = ALTERSPUNKTE[i];
    const [von, vor] = ALTERSPUNKTE[i - 1];
    if (alter <= bis) return vor + ((nach - vor) * (alter - von)) / (bis - von);
  }
  return ALTERSPUNKTE[ALTERSPUNKTE.length - 1][1];
}

/**
 * Marktwert in Tausend. Waechst mit der vierten Potenz der Staerke wie das
 * Gehalt, aber um `WERT_JE_GEHALT` hoeher: ein Spitzenspieler ist nicht
 * doppelt so viel wert wie ein guter, sondern ein Vielfaches. Alter
 * (`altersfaktor`) und ungenutztes Talent verschieben ihn.
 */
function marktwert(spieler) {
  const grund = (spieler.staerke / 10) ** 4 / 0.9;
  const luft = 1 + Math.max(0, spieler.talent - spieler.staerke) / 60;
  return Math.max(20, Math.round(grund * altersfaktor(spieler.alter) * luft * WERT_JE_GEHALT));
}

/**
 * Tagesform: Staerke, gedaempft durch Frische und Moral. Die Frische wiegt
 * schwer genug, dass Konditionstraining eine echte Wahl gegen Technik ist.
 */
function tagesform(spieler, frische = spieler.kondition) {
  // `form` traegt nur ein Platzspieler mit Neigung `heim` (spieltag.js, kader AC-31).
  return spieler.staerke * (0.6 + (frische / 100) * 0.4) * (0.9 + (spieler.moral / 100) * 0.2) * (spieler.form ?? 1);
}

/** Wie gut ein Verein ist: der Schnitt seiner fuenfzehn Besten. */
function niveau(verein) {
  const besten = verein.spieler.map((s) => s.staerke).sort((a, b) => b - a).slice(0, 15);
  if (!besten.length) return 0;
  return besten.reduce((a, b) => a + b, 0) / besten.length;
}

const leereSaisonwerte = () => ({
  spiele: 0, minuten: 0, tore: 0, vorlagen: 0, notenSumme: 0, noten: 0, gelbe: 0, platzverweise: 0,
});

// ------------------------------------------------------------ Erzeugung

/** Vergibt Namen, die gerade niemand in der Welt traegt. */
function namensgeber(zufall, vergeben) {
  return () => {
    let name;
    let versuche = 0;
    do {
      name = `${eines(zufall, VORNAMEN)} ${eines(zufall, NACHNAMEN)}`;
      versuche += 1;
    } while (vergeben.has(name) && versuche < 500);
    vergeben.add(name);
    return name;
  };
}

// Die Startwelt (→ docs/manager/dynamik/plan.md, Schritt 4). Gesetzt und
// gegen die Baender kader AC-23 bis AC-25 gemessen, nicht aus einer Vorlage.
const STARTWELT = {
  // 17 bis 32 statt 18 bis 33: sonst liegt das Alter in Saison 2 ueber 25.
  alter: [17, 32],
  // Das Talent eines Spielers in einem Verein haengt zu 55 % am Ruf des
  // Vereins - wie das der Jugend (JUGEND.talentMitte) - und nur zu 45 % an
  // der Guete der Startelf. Sonst bringt die Startgeneration eine Welle von
  // Sternen, die mit ihr wieder ausstirbt (kader AC-23).
  talentNachGuete: 0.45,
  talentStreuung: 9.6,
};

function spielerErzeugen(zufall, {
  id, name, position, rolle = rolleNachBedarf(null, position, id), guete,
  alter = zahl(zufall, STARTWELT.alter[0], STARTWELT.alter[1]), saison = 1, reputation = null,
}) {
  // Junge Spieler sind schwaecher als ihr Talent, alte staerker als ihre Zukunft.
  const scheitel = 27;
  const abzugJugend = Math.max(0, scheitel - alter) * 1.6;
  const abzugAlter = Math.max(0, alter - 30) * 2.2;
  const staerke = Math.round(Math.min(99, Math.max(20, umMitte(zufall, guete, 9) - abzugJugend - abzugAlter)));
  const nachGuete = guete + (scheitel - alter) * 1.4;
  // Vereinslose haben keinen Ruf - bei ihnen zaehlt nur die Guete.
  const talent = reputation === null
    ? Math.round(Math.min(99, Math.max(staerke, umMitte(zufall, nachGuete, 8))))
    : Math.round(Math.max(staerke, Math.min(97, Math.max(50, umMitte(zufall,
      STARTWELT.talentNachGuete * nachGuete + (1 - STARTWELT.talentNachGuete) * JUGEND.talentMitte(reputation),
      STARTWELT.talentStreuung)))));
  const laufzeit = alter >= 32 ? 1 : zahl(zufall, 1, 4);
  return {
    id,
    name,
    position,
    ...rollen(id, rolle),
    alter,
    staerke,
    talent,
    kondition: zahl(zufall, 85, 100),
    moral: zahl(zufall, 45, 75),
    vertrag: { bis: saison + laufzeit - 1, gehalt: jahresgehalt(staerke) },
    gelbe: 0,
    sperre: 0,
    verletzt: 0,
    saison: leereSaisonwerte(),
    laufbahn: { spiele: 0, tore: 0 },
    transferliste: null,
  };
}

function vereinErzeugen(zufall, { id, name, liga, guete, neueId, neuerName }) {
  const spieler = [];
  const erste = liga === 1;
  const reputation = erste ? Math.round(40 + (guete - 62) * 2.2) : Math.round(15 + (guete - 46) * 1.6);
  for (const position of POSITIONEN) {
    for (let i = 0; i < KADERPLAN[position]; i++) {
      const id = neueId();
      // Der dritte Stuermer ist Links- oder Rechtsaussen - welcher, entscheidet die Kennung.
      const rolle = position === ANG && i === 2 ? (streuung(id, 3) < 0.5 ? 'LA' : 'RA') : ROLLENPLAN[position][i];
      spieler.push(spielerErzeugen(zufall, {
        id, name: neuerName(), position, rolle, guete, reputation,
      }));
    }
  }
  return {
    id,
    name,
    liga,
    spieler,
    konto: Math.round(STARTKONTO[liga](guete)),
    // Plaetze in Fuenfhunderterschritten - ein Stadion hat keine krummen Zahlen.
    stadion: { plaetze: Math.round(STADIONPLAETZE[liga](guete) / 500) * 500, ausbau: null },
    reputation,
    eintritt: EINTRITT[liga],
    sponsor: null,
    taktik: { system: '4-4-2', ausrichtung: 3, haerte: 3, pressing: 3 },
    training: 50,
    schwerpunkt: 'keiner',
    // Was die Mannschaft eingeuebt hat, von 0 bis 100: Systeme, Pressing, Abwehr, Angriff.
    einstudiert: { systeme: { '4-4-2': 70 }, pressing: 20, abwehr: 20, angriff: 20 },
    technikSumme: 0,
    trainingswochen: 0,
    wechselregel: 'auto',
    aufstellung: null,
    abzug: 0,
    tvRang: 9,
  };
}

// Startwerte je Liga, aus der Guete des Vereins. Ausgerichtet an der
// Messung ueber mehrere Saisons (→ specs/15-manager/finanzen.md). Das
// Startkonto waechst mit dem Marktwert (`WERT_JE_GEHALT`): sonst kann im
// ersten Fenster fast kein Verein mehr ein Gebot zahlen (hoechstens 70 % des
// Kontos, transfer AC-11) - ein Verein der ersten Liga bekam in 30
// Startwerten 27-mal kein einziges Angebot statt 9-mal.
const STARTKONTO = { 1: (g) => g * 110 * WERT_JE_GEHALT, 2: (g) => g * 60 * WERT_JE_GEHALT };
const STADIONPLAETZE = { 1: (g) => g * 380, 2: (g) => g * 230 };
const EINTRITT = { 1: 22, 2: 14 };

/**
 * Wenn ein Verein keine elf einsatzbereiten Spieler mehr hat - oder keinen
 * Torwart -, rueckt die A-Jugend nach. Ein Spiel faellt nie aus, und ein
 * Verein ohne Geld bleibt spielfaehig.
 *
 * @returns {object[]} die Nachgerueckten
 */
function notfallJugend(verein, { neueId, neuerName, saison }) {
  const neu = [];
  const bereit = () => verein.spieler.filter(einsatzbereit);
  const nachruecken = (position) => {
    const id = neueId();
    const spieler = {
      id, name: neuerName(), position, ...rollen(id, rolleNachBedarf(verein.spieler, position, id)), alter: 18, staerke: 34, talent: 58,
      kondition: 95, moral: 70, vertrag: { bis: saison, gehalt: jahresgehalt(34) },
      gelbe: 0, sperre: 0, verletzt: 0, saison: leereSaisonwerte(), laufbahn: { spiele: 0, tore: 0 },
      transferliste: null, jugend: true,
    };
    verein.spieler.push(spieler);
    neu.push(spieler);
  };
  if (!bereit().some((s) => s.position === TOR)) nachruecken(TOR);
  while (bereit().length < 11) {
    const duennste = [ABW, MIT, ANG]
      .map((p) => ({ p, zahl: bereit().filter((s) => s.position === p).length - (p === ANG ? 2 : 4) }))
      .sort((a, b) => a.zahl - b.zahl)[0].p;
    nachruecken(duennste);
  }
  return neu;
}

/**
 * Die Welt zum Start: zwei Ligen zu je achtzehn Vereinen, dazu die
 * Vereinslosen. Derselbe Startwert ergibt dieselbe Welt.
 */
function weltErzeugen(startwert) {
  const zufall = zufallAus(startwert);
  const orte = [...ORTE];
  for (let i = orte.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [orte[i], orte[j]] = [orte[j], orte[i]];
  }
  let zaehler = 0;
  const neueId = () => `p${++zaehler}`;
  const namen = new Set();
  const neuerName = namensgeber(zufall, namen);

  const vereine = [];
  for (const liga of [1, 2]) {
    for (let i = 0; i < VEREINE_JE_LIGA; i++) {
      // Die erste Liga reicht von 82 bis 62, die zweite von 64 bis 46 - die
      // Besten der zweiten sind so gut wie die Schwaechsten der ersten.
      const guete = liga === 1 ? 82 - (i * 20) / 17 : 64 - (i * 18) / 17;
      const index = vereine.length;
      vereine.push(vereinErzeugen(zufall, {
        id: `v${index + 1}`,
        name: `${eines(zufall, ZUSAETZE)} ${orte[index]}`,
        liga,
        guete,
        neueId,
        neuerName,
      }));
    }
  }
  const freie = freieErzeugen(zufall, 40, { neueId, neuerName, saison: 1 });
  return { vereine, freie, zaehler, namen };
}

/** Vertragslose fuer den Markt - dieselbe Bauart, nur ohne Verein. */
function freieErzeugen(zufall, anzahl, { neueId, neuerName, saison }) {
  const liste = [];
  for (let i = 0; i < anzahl; i++) {
    const position = POSITIONEN[Math.floor(zufall() * POSITIONEN.length)];
    const spieler = spielerErzeugen(zufall, {
      id: neueId(), name: neuerName(), position, guete: umMitte(zufall, 50, 10), saison,
    });
    spieler.vertrag = null;
    liste.push(spieler);
  }
  return liste;
}

// Die Jugend (→ docs/manager/dynamik/plan.md, Schritt 4). Gesetzt und gegen
// kader AC-23 bis AC-25 gemessen. Bis Schritt 3 kam ein Siebzehnjaehriger 18
// bis 32 unter seinem Talent an, im Mittel 22 unter dem Niveau seines Vereins
// (kader AC-25); jetzt 5 bis 17. Damit er dafuer nicht zum Stern wird, liegt
// die Mitte des Talents 3 tiefer, und es streut weiter (15 statt 12).
const JUGEND = {
  talentMitte: (reputation) => 45 + reputation * 0.4,
  talentVersatz: -3,
  talentStreuung: 15,
  talentGrenzen: [50, 97],
  unterTalent: [5, 17],
};

/** Zwei Jugendspieler je Saison: siebzehn, schwaecher als ihr Talent. */
function jugendErzeugen(verein, zufall, { neueId, neuerName, saison }) {
  const liste = [];
  for (let i = 0; i < 2; i++) {
    // Die Position, auf der es am duennsten ist.
    const bedarf = POSITIONEN
      .map((p) => ({ p, luecke: KADERPLAN[p] - verein.spieler.filter((s) => s.position === p).length + zufall() }))
      .sort((a, b) => b.luecke - a.luecke)[0].p;
    const mitte = JUGEND.talentMitte(verein.reputation) + JUGEND.talentVersatz;
    const talent = Math.round(Math.min(JUGEND.talentGrenzen[1],
      Math.max(JUGEND.talentGrenzen[0], umMitte(zufall, mitte, JUGEND.talentStreuung))));
    const staerke = Math.max(30, talent - zahl(zufall, JUGEND.unterTalent[0], JUGEND.unterTalent[1]));
    const id = neueId();
    liste.push({
      id,
      name: neuerName(),
      position: bedarf,
      ...rollen(id, rolleNachBedarf([...verein.spieler, ...liste], bedarf, id)),
      alter: 17,
      staerke,
      talent,
      kondition: 90,
      moral: 65,
      vertrag: { bis: saison + 2, gehalt: jahresgehalt(staerke) },
      gelbe: 0,
      sperre: 0,
      verletzt: 0,
      saison: leereSaisonwerte(),
      laufbahn: { spiele: 0, tore: 0 },
      transferliste: null,
      jugend: true,
    });
  }
  // Der Staerkere zuerst: hat der Kader nur fuer einen Platz, kommt er.
  return liste.sort((a, b) => b.staerke - a.staerke);
}

// ------------------------------------------------------- Verfuegbarkeit

const einsatzbereit = (spieler) => spieler.verletzt === 0 && spieler.sperre === 0;

function ausfallgrund(spieler) {
  if (spieler.verletzt > 0) return `verletzt, noch ${spieler.verletzt} ${spieler.verletzt === 1 ? 'Woche' : 'Wochen'}`;
  if (spieler.sperre > 0) return `gesperrt, noch ${spieler.sperre} ${spieler.sperre === 1 ? 'Spiel' : 'Spiele'}`;
  return null;
}

// ---------------------------------------------------------- Aufstellung

// Elf feste Plaetze je System, von hinten nach vorn und je Reihe von links
// nach rechts. Wer auf einem Platz steht, zaehlt fuer dessen Mannschaftsteil.
const PLAETZE = {
  '4-4-2': ['TW', 'LV', 'IV', 'IV', 'RV', 'LM', 'ZM', 'ZM', 'RM', 'ST', 'ST'],
  '3-5-2': ['TW', 'IV', 'IV', 'IV', 'LM', 'ZM', 'DM', 'ZM', 'RM', 'ST', 'ST'],
  '4-3-3': ['TW', 'LV', 'IV', 'IV', 'RV', 'ZM', 'DM', 'ZM', 'LA', 'ST', 'RA'],
  '5-3-2': ['TW', 'LV', 'IV', 'IV', 'IV', 'RV', 'ZM', 'DM', 'ZM', 'ST', 'ST'],
  '4-5-1': ['TW', 'LV', 'IV', 'IV', 'RV', 'LM', 'ZM', 'OM', 'ZM', 'RM', 'ST'],
};
const SYSTEME_NAMEN = Object.keys(PLAETZE);
// Wie viele Plaetze je Mannschaftsteil - danach planen Markt und Handel.
const SYSTEME = Object.fromEntries(SYSTEME_NAMEN.map((name) => [name, Object.fromEntries(
  [ABW, MIT, ANG].map((teil) => [teil, PLAETZE[name].filter((platz) => TEIL[platz] === teil).length]),
)]));

/**
 * Verteilt Spieler so auf Plaetze, dass Tagesform mal Eignung zusammen
 * moeglichst gross ist: erst immer das beste Paar aus Platz und Spieler, dann
 * nachbessern - zwei Plaetze tauschen oder einen von draussen hereinholen -,
 * solange es mehr bringt. Das trifft nicht in jedem denkbaren Kader das
 * Hoechste, aber nie etwas, das ein einzelner Tausch noch verbessern koennte.
 *
 * @returns {Array<object|null>} je Platz ein Spieler, null wenn niemand mehr da ist
 */
function plaetzeBesetzen(plaetze, kandidaten) {
  const formen = kandidaten.map((s) => tagesform(s));
  const wert = plaetze.map((platz) => kandidaten.map((s, j) => formen[j] * eignung(s, platz)));
  const besetzt = plaetze.map(() => -1);
  const vergeben = kandidaten.map(() => false);
  for (let n = 0; n < Math.min(plaetze.length, kandidaten.length); n++) {
    let bester = { i: -1, j: -1, w: -Infinity };
    for (let i = 0; i < plaetze.length; i++) {
      if (besetzt[i] >= 0) continue;
      for (let j = 0; j < kandidaten.length; j++) {
        if (!vergeben[j] && wert[i][j] > bester.w) bester = { i, j, w: wert[i][j] };
      }
    }
    besetzt[bester.i] = bester.j;
    vergeben[bester.j] = true;
  }
  const w = (i, j) => (j < 0 ? 0 : wert[i][j]);
  for (let runde = 0; runde < 20; runde++) {
    let besser = false;
    for (let i = 0; i < plaetze.length; i++) {
      for (let k = i + 1; k < plaetze.length; k++) {
        if (w(i, besetzt[k]) + w(k, besetzt[i]) > w(i, besetzt[i]) + w(k, besetzt[k]) + 1e-9) {
          [besetzt[i], besetzt[k]] = [besetzt[k], besetzt[i]];
          besser = true;
        }
      }
      for (let j = 0; j < kandidaten.length; j++) {
        if (vergeben[j] || wert[i][j] <= w(i, besetzt[i]) + 1e-9) continue;
        if (besetzt[i] >= 0) vergeben[besetzt[i]] = false;
        besetzt[i] = j;
        vergeben[j] = true;
        besser = true;
      }
    }
    if (!besser) break;
  }
  return besetzt.map((j) => (j < 0 ? null : kandidaten[j]));
}

/**
 * Die beste Elf fuer ein System, Platz fuer Platz in der Reihenfolge von
 * `PLAETZE`. Wer auf einer fremden Position steht, bringt dort weniger - und
 * steht nur da, wenn niemand Besseres fuer den Platz da ist.
 */
function elfStellen(verein, system = '4-4-2') {
  const plaetze = PLAETZE[system] || PLAETZE['4-4-2'];
  return plaetzeBesetzen(plaetze, verein.spieler.filter(einsatzbereit)).filter(Boolean);
}

/** Was eine Elf auf ihren Plaetzen zusammen bringt: Tagesform mal Eignung. */
function elfWert(verein, system) {
  const plaetze = PLAETZE[system] || PLAETZE['4-4-2'];
  return elfStellen(verein, system).reduce((summe, s, i) => summe + tagesform(s) * eignung(s, plaetze[i]), 0);
}

/** Die Bank: die sieben Besten, die nicht in der Elf stehen, ein Torwart zuerst. */
function bankStellen(verein, elf) {
  const drin = new Set(elf.map((s) => s.id));
  const uebrig = verein.spieler.filter((s) => einsatzbereit(s) && !drin.has(s.id))
    .sort((a, b) => tagesform(b) - tagesform(a));
  const torwart = uebrig.find((s) => s.position === TOR);
  const bank = torwart ? [torwart] : [];
  for (const spieler of uebrig) {
    if (bank.length >= BANK) break;
    if (spieler !== torwart) bank.push(spieler);
  }
  return bank;
}

/**
 * Das System, in dem die beste Elf am staerksten ist - so waehlt die KI. Wer
 * schon ein System spielt, bleibt dabei, solange ein anderes nicht deutlich
 * mehr bringt: ein neues System muss sich erst einspielen.
 */
function bestesSystem(verein, bisher = null) {
  const wert = (system) => elfWert(verein, system);
  let bestes = '4-4-2';
  let hoechster = -Infinity;
  for (const system of SYSTEME_NAMEN) {
    const summe = wert(system);
    if (summe > hoechster + 1e-9) {
      hoechster = summe;
      bestes = system;
    }
  }
  if (bisher && PLAETZE[bisher] && wert(bisher) * 1.03 >= hoechster) return bisher;
  return bestes;
}

/**
 * Prueft eine von Hand gestellte Elf, Platz fuer Platz: `ids[i]` steht auf
 * `PLAETZE[system][i]`. Der Server glaubt dem Browser nichts - jede Nummer
 * wird gegen Kader, Ausfaelle und das Tor geprueft. Eine fremde Position ist
 * kein Fehler, sie kostet nur Staerke.
 */
function elfPruefen(verein, ids, system) {
  const plaetze = PLAETZE[system];
  if (!plaetze) return { ok: false, fehler: `Unbekanntes System: ${system}` };
  if (!Array.isArray(ids) || ids.length !== 11) return { ok: false, fehler: 'Eine Aufstellung braucht genau elf Spieler.' };
  if (new Set(ids).size !== ids.length) return { ok: false, fehler: 'Ein Spieler steht zweimal in der Aufstellung.' };

  const elf = [];
  for (const [i, id] of ids.entries()) {
    const spieler = verein.spieler.find((s) => s.id === id);
    if (!spieler) return { ok: false, fehler: 'Ein Spieler gehört nicht zum Kader.' };
    const grund = ausfallgrund(spieler);
    if (grund) return { ok: false, fehler: `${spieler.name} ist ${grund}.` };
    if (!passtInsFach(spieler, plaetze[i])) {
      return { ok: false, fehler: 'Es muss genau ein Torwart aufgestellt sein - im Tor, nicht im Feld.' };
    }
    elf.push(spieler);
  }
  return { ok: true, elf };
}

/**
 * Die Elf fuer das naechste Spiel aus der gemerkten Aufstellung. Faellt
 * jemand aus, rueckt auf seinen Platz, wer dort am meisten bringt; gibt es
 * keinen, wird die gemerkte Aufstellung verworfen und die beste Elf gestellt.
 *
 * @returns {{ elf: object[], system: string, nachgerueckt: Array<{raus: string, rein: string, platz: string}>, verworfen: boolean }}
 */
function elfFuerSpiel(verein) {
  const merk = verein.aufstellung;
  if (!merk || !PLAETZE[merk.system]) {
    const system = PLAETZE[verein.taktik.system] ? verein.taktik.system : '4-4-2';
    return { elf: elfStellen(verein, system), system, nachgerueckt: [], verworfen: false };
  }
  const plaetze = PLAETZE[merk.system];
  const verwerfen = (nachgerueckt) => ({ elf: elfStellen(verein, merk.system), system: merk.system, nachgerueckt, verworfen: true });
  const nachgerueckt = [];
  const ids = [];
  for (const [i, id] of merk.ids.entries()) {
    const spieler = verein.spieler.find((s) => s.id === id);
    if (spieler && einsatzbereit(spieler)) {
      ids.push(id);
      continue;
    }
    const platz = plaetze[i];
    const wert = (s) => tagesform(s) * eignung(s, platz);
    const ersatz = spieler && verein.spieler
      .filter((s) => einsatzbereit(s) && passtInsFach(s, platz) && !merk.ids.includes(s.id) && !ids.includes(s.id))
      .sort((a, b) => wert(b) - wert(a))[0];
    if (!ersatz) return verwerfen(nachgerueckt);
    ids.push(ersatz.id);
    nachgerueckt.push({ raus: spieler.name, rein: ersatz.name, platz });
  }
  const geprueft = elfPruefen(verein, ids, merk.system);
  if (!geprueft.ok) return verwerfen(nachgerueckt);
  return {
    elf: geprueft.elf, system: merk.system, nachgerueckt, verworfen: false,
  };
}

// ------------------------------------------------- Training, Entwicklung

const SCHWERPUNKTE = ['keiner', 'system', 'pressing', 'abwehr', 'angriff'];
// Was eine Woche mit Schwerpunkt einbringt, und was eine Woche ohne kostet.
const UEBEN = 8;
const VERGESSEN = 2;

/**
 * Eine Woche Training. Der Regler laeuft von 0 (nur Kondition) bis 100 (nur
 * Technik). Kondition wirkt sofort; die Technik sammelt sich ueber die Saison
 * und bestimmt zur Winterpause und am Saisonende, wie weit sich die Spieler
 * entwickeln.
 *
 * Dazu ein Schwerpunkt: das System einspielen, Pressing, Abwehr oder Angriff
 * ueben. Was geuebt wird, sitzt Woche fuer Woche besser; was nicht geuebt
 * wird, verblasst. Die Zeit dafuer fehlt beim Rest - ein Viertel weniger
 * Technik und etwas weniger Erholung.
 */
function trainieren(verein) {
  const technik = Math.min(100, Math.max(0, verein.training)) / 100;
  const schwerpunkt = SCHWERPUNKTE.includes(verein.schwerpunkt) ? verein.schwerpunkt : 'keiner';
  const zeit = schwerpunkt === 'keiner' ? 1 : 0.75;
  verein.technikSumme += technik * zeit;
  verein.trainingswochen += 1;
  for (const spieler of verein.spieler) {
    // Erholt wird ein Anteil dessen, was fehlt: wer jede Woche spielt, pendelt
    // sich ein - bei Konditionstraining hoeher, bei Technik tiefer.
    const anteil = spieler.verletzt > 0 ? 0.1 : (0.22 + 0.28 * (1 - technik)) * (0.85 + 0.15 * zeit);
    spieler.kondition = Math.min(100, Math.round(spieler.kondition + (100 - spieler.kondition) * anteil));
    // Die Stimmung kehrt langsam zur Mitte zurueck.
    if (spieler.moral > 56) spieler.moral -= 1;
    else if (spieler.moral < 54) spieler.moral += 1;
  }

  const e = verein.einstudiert || (verein.einstudiert = { systeme: {}, pressing: 0, abwehr: 0, angriff: 0 });
  const aktuell = verein.taktik.system;
  for (const system of Object.keys(e.systeme)) {
    if (system !== aktuell) e.systeme[system] = Math.max(0, e.systeme[system] - VERGESSEN);
  }
  e.systeme[aktuell] = Math.min(100, (e.systeme[aktuell] ?? 0) + (schwerpunkt === 'system' ? UEBEN : 1));
  for (const art of ['pressing', 'abwehr', 'angriff']) {
    e[art] = Math.min(100, Math.max(0, (e[art] ?? 0) + (schwerpunkt === art ? UEBEN : -VERGESSEN)));
  }
}

/** Nach welcher Regel ein Spieler sich entwickelt - die Stufen von `entwickeln`. */
const altersstufe = (alter) => (alter <= 20 ? 'jung' : alter <= 24 ? 'reifend' : alter <= 28 ? 'bestes' : alter <= 31 ? 'nachlassend' : 'alt');

/**
 * Die Stellwerte der Entwicklung (kader AC-26, AC-29, AC-30) - gesetzt und
 * gemessen in Schritt 5 (→ docs/manager/dynamik/plan.md).
 * - `mitte`: ab 25 der Anteil an allen Pflichtspielminuten, der weder hebt
 *   noch senkt - 70 %, ein Stammspieler mit Pausen
 * - `einsatz`: Punkte je Saison je vollem Anteil unter der Mitte - wer nie
 *   spielt, verliert 3,85 Punkte im Jahr
 * - `einsatzOben`: dasselbe darueber, kleiner, weil die meisten Stammspieler
 *   ab 25 schon am Talent stehen - wer jede Minute spielt, gewinnt 0,45
 * - `streuungBestes`, `streuungNachlassend`: Varianz des Zufalls mit 25 bis
 *   28 und mit 29 bis 31; kleiner als frueher (2/3 und 1/3), sonst ging der
 *   Einsatz im Rauschen unter (kader AC-26 riss in einzelnen Saisons)
 * - `leistung`: Punkte je Saison je Note besser als 3,5 im Schnitt der Saison
 *   bis dahin, gezaehlt ab `mindestNoten` benoteten Spielen
 * Gemessen ueber acht Startwerte und zwanzig Saisons (plan.md, Schritt 5):
 * kader AC-25 haelt an allen acht, AC-26 an fuenf (sonst 0,88 bis 0,96),
 * AC-24 an keinem (in 3 bis 8 Saisons 22,7 bis 23,0). Mit `einsatz` 7 hielt
 * AC-26 an allen acht, dafuer rissen transfer AC-28 und AC-31.
 */
const ENTWICKLUNG = {
  mitte: 0.7, einsatz: 5.5, einsatzOben: 1.5,
  streuungBestes: 0.3, streuungNachlassend: 0.15,
  leistung: 0.6, mindestNoten: 5,
};

/**
 * Ein stetiger Zufall um eine Mitte, mit derselben Varianz wie ein ganzzahliger
 * Wuerfel: die Summe zweier gleichverteilter Werte, ein Dreieck.
 * @param {Zufall} zufall
 * @param {number} mitte
 * @param {number} varianz
 */
const stetig = (zufall, mitte, varianz) => mitte + (zufall() + zufall() - 1) * Math.sqrt(6 * varianz);

/**
 * Auf eine ganze Zahl, ohne den Bruchteil zu verlieren: aufgerundet mit der
 * Wahrscheinlichkeit des Bruchteils. Im Mittel kommt genau an, was gerechnet
 * wurde - auch ueber die Winterpause, ohne einen Rest am Spieler zu speichern.
 * @param {number} wert
 * @param {Zufall} zufall
 */
const zufaelligGerundet = (wert, zufall) => Math.floor(wert + zufall());

/**
 * Entwicklung: Junge wachsen auf ihr Talent zu - schneller, wer spielt und wer
 * Technik trainiert hat. Ab 29 geht es abwaerts, auch mit Training. Ab 25
 * zaehlt der Spielanteil fuer sich: wer spielt, haelt sich, wer sitzt, baut
 * ab (kader AC-26). Fuer jeden zaehlen die Noten der Saison und sein Fleiss
 * (`neigungen.fleiss`). Zur Winterpause gibt es einen Teil davon, am
 * Saisonende den Rest; erst dann ist jeder ein Jahr aelter.
 *
 * @param {Verein} verein
 * @param {Zufall} zufall
 * @param {number} spieleDesVereins  wie viele Pflichtspiele der Verein bestritt
 * @param {{anteil?: number, altern?: boolean, startwert?: number|null}} [schritt]
 *   `startwert` der Karriere fuer die Neigungen; ohne ihn rechnet jeder neutral
 * @returns {object[]} jeder Spieler mit Staerke vorher und nachher und dem, wonach gerechnet wurde:
 *   Alter und Talent vor dem Schritt, Anteil an der Spielzeit, Techniktraining, Altersstufe
 */
function entwickeln(verein, zufall, spieleDesVereins, { anteil = 1, altern = true, startwert = null } = {}) {
  const technik = verein.trainingswochen ? verein.technikSumme / verein.trainingswochen : 0.5;
  const moeglicheMinuten = Math.max(1, spieleDesVereins * 90 * 0.6);
  const eintraege = [];
  for (const spieler of verein.spieler) {
    const spielanteil = Math.min(1, spieler.saison.minuten / moeglicheMinuten);
    const anteilVoll = Math.min(1, spieler.saison.minuten / Math.max(1, spieleDesVereins * 90));
    const luft = Math.max(0, spieler.talent - spieler.staerke);
    let plus;
    if (spieler.alter <= 20) plus = luft * (0.2 + 0.15 * spielanteil + 0.15 * technik) + stetig(zufall, 0.5, 1.25);
    else if (spieler.alter <= 24) plus = luft * (0.1 + 0.12 * spielanteil + 0.1 * technik) + stetig(zufall, 0, 2 / 3);
    else {
      if (spieler.alter <= 28) plus = stetig(zufall, 0, ENTWICKLUNG.streuungBestes) + (technik > 0.6 && luft > 0 ? 1 : 0);
      // Der Abbau ist seit Schritt 4 halb so stark (→ docs/manager/dynamik/plan.md):
      // im Mittel 1 statt 2 mit 29 bis 31, 2 statt 3,5 ab 32 - gesetzt, gegen
      // kader AC-23 und AC-24 gemessen, damit die Spitze nicht mit 30 abtritt.
      else if (spieler.alter <= 31) plus = stetig(zufall, -1, ENTWICKLUNG.streuungNachlassend);
      else plus = -1 - 2 * zufall();
      // Ab 25 zaehlt die Spielzeit fuer sich (kader AC-26): ueber der Mitte
      // ein wenig mehr, darunter deutlich weniger - gemessen am Anteil an
      // allen Minuten, nicht an 60 % davon wie bei den Jungen.
      const ueber = anteilVoll - ENTWICKLUNG.mitte;
      plus += (ueber >= 0 ? ENTWICKLUNG.einsatzOben : ENTWICKLUNG.einsatz) * ueber;
    }
    const { notenSumme, noten } = spieler.saison;
    if (noten >= ENTWICKLUNG.mindestNoten) plus += ENTWICKLUNG.leistung * (3.5 - notenSumme / noten);
    plus += neigungen.fleiss(startwert, spieler.id);
    plus = zufaelligGerundet(plus * anteil, zufall);
    const vorher = spieler.staerke;
    const { alter, talent } = spieler;
    const obergrenze = Math.max(spieler.staerke, spieler.talent);
    spieler.staerke = Math.max(20, Math.min(99, obergrenze, spieler.staerke + plus));
    if (altern) {
      if (spieler.alter >= 29) spieler.talent = Math.max(spieler.staerke, spieler.talent - 2);
      spieler.alter += 1;
    }
    eintraege.push({
      spieler, vorher, nachher: spieler.staerke, alter, talent, spielanteil, technik, stufe: altersstufe(alter),
    });
  }
  if (altern) {
    verein.technikSumme = 0;
    verein.trainingswochen = 0;
  }
  return eintraege;
}

/**
 * Hoert ein Spieler auf? Ab 33 immer wahrscheinlicher, mit 36 sicher (kader
 * AC-17). Seit Schritt 4 sanfter davor - 8, 20 und 35 % statt 15, 35 und 60 % -,
 * gesetzt und gegen kader AC-24 gemessen: ein Jahr spaeter haette das Alter
 * besser gehalten, aber kader AC-17 gebrochen.
 */
function hoertAuf(spieler, zufall) {
  const quote = spieler.alter >= 36 ? 1
    : spieler.alter === 35 ? 0.35
      : spieler.alter === 34 ? 0.2
        : spieler.alter === 33 ? 0.08
          : spieler.alter >= 30 && spieler.staerke < 35 ? 0.5
            : 0;
  return zufall() < quote;
}

module.exports = {
  TOR, ABW, MIT, ANG, POSITIONEN, KADERPLAN, MINDESTBESTAND, KADER_MAX, BANK, VEREINE_JE_LIGA, EINTRITT,
  SYSTEME, SYSTEME_NAMEN, SCHWERPUNKTE,
  ROLLEN, TEIL, PLAETZE, ROLLENPLAN, NEBENROLLE, FALSCHES_FACH, ABZUG_QUER, ABZUG_LAENGS, ABZUG_HOECHSTENS,
  eignung, eignungstabelle, passtInsFach, rollen, rolleNachBedarf, rollenFuer,
  jahresgehalt, marktwert, tagesform, niveau, leereSaisonwerte,
  namensgeber, spielerErzeugen, weltErzeugen, freieErzeugen, jugendErzeugen, notfallJugend,
  einsatzbereit, ausfallgrund,
  plaetzeBesetzen, elfStellen, elfWert, bankStellen, bestesSystem, elfPruefen, elfFuerSpiel,
  trainieren, entwickeln, altersstufe, hoertAuf, ENTWICKLUNG,
};
