// @ts-check
'use strict';

// Neigungen: was einen Spieler neben Staerke und Talent ausmacht - fleissig
// oder bequem, treu oder kaeuflich, daheim stark, mit ruhigen Nerven. Jede
// Achse ist eine Zahl von -1 bis 1, meist nahe 0, selten deutlich.
//
// Gespeichert wird nichts: die Neigungen kommen allein aus der Kennung des
// Spielers und dem Startwert der Karriere, ueber einen Hash - kein Zug aus
// fremdem Zufall, kein Feld am Spieler, keine neue Fassung des Spielstands.
// Die rohen Zahlen verlassen den Server nie (kader AC-28); hinaus geht
// hoechstens `charakter()` fuer die eigenen Spieler.
//
// Was eine Neigung bewirkt, steht in `NEIGUNGEN` - gesetzt und gemessen
// (→ docs/manager/dynamik/plan.md, Schritt 5). Wer daran dreht, misst danach
// mit `npm run manager:dynamik` und `npm run manager:messen`.

/** @typedef {import('./daten').Spieler} Spieler */

/**
 * @typedef {'entwicklung'|'wechsel'|'heim'|'nerven'|'karten'|'moral'|'mitspieler'} Achse
 * @typedef {Record<Achse, number>} Neigungen
 */

/** @type {Achse[]} */
const ACHSEN = ['entwicklung', 'wechsel', 'heim', 'nerven', 'karten', 'moral', 'mitspieler'];

/**
 * Die eine Tabelle der Neigungen. Je Achse die Wirkung bei Neigung 1; bei -1
 * dieselbe in die andere Richtung, dazwischen anteilig.
 */
const NEIGUNGEN = {
  // Normalverteilt mit dieser Streuung, bei -1 und 1 abgeschnitten: zwei von
  // drei Spielern liegen innerhalb von +-0,35, einer von zwanzig jenseits 0,7.
  streuung: 0.35,
  // Ab dieser Abweichung hat ein Spieler einen Charakter, darunter ist er
  // ausgeglichen - gemessen 52,2 % von 6080 Spielern ueber acht Startwerte,
  // jeder der acht Namen 5,2 bis 6,7 % (kader AC-27).
  schwelle: 0.5,
  wirkung: {
    // Trainingsfleissig (+) gegen Lebemann (-): Punkte Staerke je Saison,
    // auf Winter und Sommer verteilt wie die Entwicklung selbst.
    entwicklung: { punkte: 0.5 },
    // Soeldner (+) gegen Vereinstreu (-): der Gehaltswunsch beim Verlaengern
    // um diesen Anteil (der Markt rechnet ohne), und um so viele Punkte
    // Abstand mehr, bevor er einen schwaecheren Verein ablehnt - der Soeldner
    // geht auch dorthin, der Treue seltener. Abstand 3 riss transfer AC-31
    // an Startwert 31337 (L2 Mitte 0 Angebote), 2 haelt an allen acht.
    wechsel: { gehalt: 0.06, abstand: 2 },
    // Daheim stark (+) oder auswaerts (-): die Tagesform daheim um diesen
    // Anteil hoeher, auswaerts um ihn tiefer; im neutralen Spiel nichts.
    heim: { form: 0.03 },
    // Ruhige Nerven (+, der Profi) gegen fahrige (-): die Streuung der Note
    // um diesen Anteil schmaler oder breiter. Am Ergebnis aendert das nichts.
    nerven: { note: 0.4 },
    // Angelegt, wirken noch nicht: Heisssporn, Sensibel, Anfuehrer.
    karten: {},
    moral: {},
    mitspieler: {},
  },
};

/**
 * Die Namen, die ein Charakter tragen kann: je Achse und Richtung. Nur die
 * Richtungen mit Namen zaehlen - ein Spieler, der nur daheim stark ist, ist
 * ausgeglichen. Profi heisst, wer die ruhigsten Nerven hat: er liefert
 * Woche fuer Woche dieselbe Leistung.
 * @type {[Achse, 1|-1, string][]}
 */
const NAMEN = [
  ['nerven', 1, 'Profi'],
  ['karten', 1, 'Heißsporn'],
  ['moral', 1, 'Sensibel'],
  ['wechsel', 1, 'Söldner'],
  ['wechsel', -1, 'Vereinstreu'],
  ['mitspieler', 1, 'Anführer'],
  ['entwicklung', 1, 'Trainingsfleißig'],
  ['entwicklung', -1, 'Lebemann'],
];
const AUSGEGLICHEN = 'Ausgeglichen';

/** Eine Zahl von 0 bis unter 1 aus einem Text und einem Salz - dieselbe Bauart wie `streuung` in kader.js. */
function hash(text, salz) {
  let h = (2166136261 ^ salz) >>> 0;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

/**
 * Die Neigung eines Spielers auf einer Achse, -1 bis 1. Ohne Startwert 0 -
 * so rechnen Teile, die keine Karriere kennen (Tests, die Vorschau), neutral.
 * @param {number|null|undefined} startwert
 * @param {string} id
 * @param {Achse} achse
 */
function neigung(startwert, id, achse) {
  if (startwert === null || startwert === undefined) return 0;
  const salz = (startwert >>> 0) ^ 0x5bd1e995;
  // Box-Muller aus zwei Werten des Hashs; 1 - u, damit der Logarithmus nie 0 sieht.
  const u = 1 - hash(`${id}|${achse}|a`, salz);
  const v = hash(`${id}|${achse}|b`, salz);
  const normal = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.max(-1, Math.min(1, normal * NEIGUNGEN.streuung));
}

/**
 * Alle Neigungen eines Spielers.
 * @param {number|null|undefined} startwert
 * @param {string} id
 * @returns {Neigungen}
 */
function neigungenVon(startwert, id) {
  return /** @type {Neigungen} */ (Object.fromEntries(ACHSEN.map((achse) => [achse, neigung(startwert, id, achse)])));
}

/**
 * Der Charakter eines Spielers: der Name seiner staerksten Abweichung, unter
 * `NEIGUNGEN.schwelle` "Ausgeglichen". Abgeleitet, nicht gespeichert.
 * @param {{id: string}} spieler
 * @param {number|null|undefined} startwert
 * @returns {string}
 */
function charakter(spieler, startwert) {
  const n = neigungenVon(startwert, spieler.id);
  let bester = AUSGEGLICHEN;
  let staerkste = NEIGUNGEN.schwelle;
  for (const [achse, richtung, name] of NAMEN) {
    const wert = n[achse] * richtung;
    if (wert >= staerkste) {
      staerkste = wert;
      bester = name;
    }
  }
  return bester;
}

// ------------------------------------------------------------ Wirkungen

/** Punkte Staerke je ganzer Saison aus dem Fleiss. */
const fleiss = (startwert, id) => neigung(startwert, id, 'entwicklung') * NEIGUNGEN.wirkung.entwicklung.punkte;

/** Faktor auf den Gehaltswunsch. */
const gehaltsfaktor = (startwert, id) => 1 + neigung(startwert, id, 'wechsel') * NEIGUNGEN.wirkung.wechsel.gehalt;

/** Wie viele Punkte Abstand er mehr hinnimmt, bevor er einen schwaecheren Verein ablehnt. */
const abstandMehr = (startwert, id) => neigung(startwert, id, 'wechsel') * NEIGUNGEN.wirkung.wechsel.abstand;

/** Faktor auf die Tagesform: daheim, auswaerts oder neutral (`null`). */
function heimform(startwert, id, daheim) {
  if (daheim === null) return 1;
  const n = neigung(startwert, id, 'heim') * NEIGUNGEN.wirkung.heim.form;
  return daheim ? 1 + n : 1 - n;
}

/** Faktor auf die Streuung der Note: kleiner mit ruhigen Nerven. */
const notenstreuung = (startwert, id) => 1 - neigung(startwert, id, 'nerven') * NEIGUNGEN.wirkung.nerven.note;

module.exports = {
  ACHSEN, NEIGUNGEN, NAMEN, AUSGEGLICHEN,
  neigung, neigungenVon, charakter,
  fleiss, gehaltsfaktor, abstandMehr, heimform, notenstreuung,
};
