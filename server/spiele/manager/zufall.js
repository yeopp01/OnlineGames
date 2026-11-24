// @ts-check
'use strict';

// Zufall mit Startwert - derselbe Wert ergibt dieselbe Saison. Gleiche
// Bauart wie in karte.js: ein Fehler laesst sich wiederholen, statt ihn
// zu suchen.
//
// Der Stand ist ein Wert (`{ a }`), kein verstecktes Innenleben: ein Spiel,
// das mitten in der zweiten Halbzeit gesichert wird, nimmt ihn mit und zieht
// nach dem Laden dieselbe Folge weiter (→ docs/manager/plan.md, M0.5).

/** Die naechste Zahl aus einem Stand, von 0 bis unter 1. Der Stand rueckt weiter. */
function ziehen(stand) {
  stand.a = (stand.a + 0x6d2b79f5) >>> 0;
  const a = stand.a;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Eine Zufallsquelle als Funktion. `quelle.stand` ist ihr Stand - wer ihn
 * weiterzieht, zieht die Quelle mit.
 */
function zufallAus(startwert) {
  const stand = { a: startwert >>> 0 };
  const quelle = () => ziehen(stand);
  quelle.stand = stand;
  return quelle;
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

module.exports = { zufallAus, ziehen, zahl, umMitte, eines };
