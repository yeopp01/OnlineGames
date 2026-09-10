'use strict';

// Zufall mit Startwert - derselbe Wert ergibt dieselbe Saison. Gleiche
// Bauart wie in karte.js: ein Fehler laesst sich wiederholen, statt ihn
// zu suchen.
function zufallAus(startwert) {
  let a = startwert >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Ganze Zahl von bis einschliesslich.
function zahl(zufall, von, bis) {
  return von + Math.floor(zufall() * (bis - von + 1));
}

// Wert um eine Mitte, mittige Werte haeufiger als die Raender.
function umMitte(zufall, mitte, streuung) {
  const glocke = (zufall() + zufall() + zufall()) / 3 - 0.5;
  return mitte + glocke * 2 * streuung;
}

function eines(zufall, liste) {
  return liste[Math.floor(zufall() * liste.length)];
}

module.exports = { zufallAus, zahl, umMitte, eines };
