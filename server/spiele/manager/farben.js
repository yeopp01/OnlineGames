// @ts-check
// Die Farben der Vereine (bedienung AC-22). Jeder Verein hat zwei: die erste
// dunkel mit weisser Schrift - sie traegt der Kopf, die Anzeigetafel und das
// Verlaufsband -, die zweite hell mit dunkler Schrift, fuer Knoepfe und
// Leisten darauf. Sind sich zwei Vereine einer Begegnung zu aehnlich, spielt
// der Gast in seiner zweiten Farbe, wie im Ausweichtrikot.
//
// Die Farben stehen nicht im Spielstand: sie folgen aus dem Startwert und
// der Kennung des Vereins, aus einer eigenen Zufallsquelle. So zieht die Welt
// keine Zahl mehr als vorher, und alte Spielstaende bekommen sie ohne neue
// Fassung.
'use strict';

const { zufallAus } = require('./zufall.js');

/** Schrift auf der ersten und der zweiten Farbe. */
const WEISS = '#ffffff';
const TINTE = '#1c2128'; // --schrift in manager.css

// Je Verein ein Paar, sechsunddreissig fuer sechsunddreissig Vereine. Achtzehn
// dunkle Grundfarben, jede mit zwei hellen - welcher Verein welches Paar
// bekommt, mischt der Startwert.
const PAARE = [
  ['#0f4c81', '#f2c230'], ['#0f4c81', '#ffffff'],
  ['#7a1f2b', '#f1ece0'], ['#7a1f2b', '#f2c230'],
  ['#1f5f3a', '#ffffff'], ['#1f5f3a', '#f2c230'],
  ['#b3261e', '#ffffff'], ['#b3261e', '#cfd6dc'],
  ['#3b2a6b', '#ffffff'], ['#3b2a6b', '#f6b26b'],
  ['#1c2128', '#f2c230'], ['#1c2128', '#ffffff'],
  ['#8a4a12', '#f1ece0'], ['#8a4a12', '#9fd3f5'],
  ['#0e6b6b', '#ffffff'], ['#0e6b6b', '#f6b26b'],
  ['#a8380a', '#f1ece0'], ['#a8380a', '#ffffff'],
  ['#1e3a8a', '#9fd3f5'], ['#1e3a8a', '#f4a3a3'],
  ['#5c5f66', '#f2c230'], ['#5c5f66', '#ffffff'],
  ['#9d174d', '#ffffff'], ['#9d174d', '#cfd6dc'],
  ['#3f6212', '#c8e6a0'], ['#3f6212', '#ffffff'],
  ['#2a4d69', '#f6b26b'], ['#2a4d69', '#ffffff'],
  ['#7c2d92', '#e6e1f5'], ['#7c2d92', '#f2c230'],
  ['#0b3d2e', '#c8e6a0'], ['#0b3d2e', '#ffffff'],
  ['#8f5600', '#f2c230'], ['#8f5600', '#f1ece0'],
  ['#be123c', '#ffffff'], ['#be123c', '#f2c230'],
];

// Unter diesem Abstand im Lab-Raum (CIE76) gelten zwei Farben im Band als zu
// aehnlich. Gesetzt: 30 trennt Blau von Koenigsblau sicher, Rot von Weinrot
// knapp.
const AEHNLICH = 30;

/** Kanal von 0..255 nach linearem Licht. */
function linear(kanal) {
  const c = kanal / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** @param {string} hex */
function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Relative Leuchtdichte nach WCAG 2. */
function leuchtdichte(hex) {
  const [r, g, b] = rgb(hex).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Kontrast zweier Farben nach WCAG 2, von 1 bis 21. */
function kontrast(a, b) {
  const [hell, dunkel] = [leuchtdichte(a), leuchtdichte(b)].sort((x, y) => y - x);
  return (hell + 0.05) / (dunkel + 0.05);
}

/** Lab-Werte (D65) einer Farbe. */
function lab(hex) {
  const [r, g, b] = rgb(hex).map(linear);
  const x = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047;
  const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

/** Abstand zweier Farben im Lab-Raum (CIE76). */
function abstand(a, b) {
  const [l1, a1, b1] = lab(a);
  const [l2, a2, b2] = lab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** Die besser lesbare der beiden Schriften auf einer Farbe. */
function schriftAuf(hex) {
  return kontrast(hex, WEISS) >= kontrast(hex, TINTE) ? WEISS : TINTE;
}

// Eine Zufallsquelle nur fuer die Farben - nicht `quelle()` aus welt.js, damit
// dieses Rechenteil nichts von der Karriere braucht.
function farbzufall(startwert) {
  let h = Math.imul((startwert >>> 0) ^ 0x2c1b3c6d, 0x9e3779b1) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b) >>> 0;
  return zufallAus((h ^ (h >>> 13)) >>> 0);
}

/**
 * @typedef {{eins: string, zwei: string, schrift: string, schriftZwei: string}} Vereinsfarben
 * @typedef {{grund: string, akzent: string, schrift: string, ausweich: boolean}} Trikot
 */

const gemerkt = new Map();

/**
 * Die Farben aller Vereine einer Welt, nach Kennung `v1` bis `v36`.
 * @param {number} startwert
 * @returns {Map<string, Vereinsfarben>}
 */
function vereinsfarben(startwert) {
  const schon = gemerkt.get(startwert);
  if (schon) return schon;
  const zufall = farbzufall(startwert);
  const folge = PAARE.map((_, i) => i);
  for (let i = folge.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [folge[i], folge[j]] = [folge[j], folge[i]];
  }
  /** @type {Map<string, Vereinsfarben>} */
  const farben = new Map();
  folge.forEach((paar, i) => {
    const [eins, zwei] = PAARE[paar];
    farben.set(`v${i + 1}`, { eins, zwei, schrift: schriftAuf(eins), schriftZwei: schriftAuf(zwei) });
  });
  if (gemerkt.size > 100) gemerkt.clear();
  gemerkt.set(startwert, farben);
  return farben;
}

/**
 * Die Farben eines Vereins. Eine unbekannte Kennung (etwa ein spaeter
 * gegruendeter Verein) bekommt ein Paar aus ihrer Nummer.
 * @param {number} startwert
 * @param {string} vereinId
 * @returns {Vereinsfarben}
 */
function farbenVon(startwert, vereinId) {
  const bekannt = vereinsfarben(startwert).get(vereinId);
  if (bekannt) return bekannt;
  const nummer = Number(String(vereinId).replace(/\D/g, '')) || 0;
  const [eins, zwei] = PAARE[nummer % PAARE.length];
  return { eins, zwei, schrift: schriftAuf(eins), schriftZwei: schriftAuf(zwei) };
}

/**
 * Wer in welcher Farbe spielt: Heim immer in der ersten, der Gast in der
 * ersten, wenn sie sich genug von der des Heims abhebt, sonst in der zweiten.
 * @param {Vereinsfarben} heim
 * @param {Vereinsfarben} gast
 * @returns {{heim: Trikot, gast: Trikot}}
 */
function trikots(heim, gast) {
  const ausweich = abstand(heim.eins, gast.eins) < AEHNLICH;
  return {
    heim: { grund: heim.eins, akzent: heim.zwei, schrift: heim.schrift, ausweich: false },
    gast: ausweich
      ? { grund: gast.zwei, akzent: gast.eins, schrift: gast.schriftZwei, ausweich: true }
      : { grund: gast.eins, akzent: gast.zwei, schrift: gast.schrift, ausweich: false },
  };
}

module.exports = {
  PAARE, AEHNLICH, WEISS, TINTE, kontrast, abstand, schriftAuf, vereinsfarben, farbenVon, trikots,
};
