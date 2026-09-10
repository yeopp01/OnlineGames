'use strict';

// Vertraege: Laufzeit und Jahresgehalt. Ein Vertrag gilt bis einschliesslich
// der Saison `bis`. Wer am Saisonende ohne Vertrag dasteht, geht - an den
// Markt der Vereinslosen.
const { jahresgehalt, niveau } = require('./kader');

/**
 * Was ein Spieler verdienen will: nach Staerke, mehr fuer ungenutztes Talent,
 * mehr, wenn er unzufrieden ist, weniger im Alter.
 */
function gehaltswunsch(spieler) {
  const luft = Math.max(0, spieler.talent - spieler.staerke) / 100;
  const stimmung = spieler.moral < 35 ? 1.25 : spieler.moral > 70 ? 0.95 : 1;
  const alter = spieler.alter >= 31 ? 0.85 : 1;
  return Math.round(jahresgehalt(spieler.staerke) * (1 + luft) * stimmung * alter);
}

/** Wie lange ein Spieler noch unterschreibt. Mit 33 nur noch ein Jahr. */
function laufzeitMax(spieler) {
  if (spieler.alter >= 33) return 1;
  if (spieler.alter >= 31) return 2;
  return 4;
}

function laufzeitPruefen(spieler, laufzeit) {
  if (!Number.isInteger(laufzeit) || laufzeit < 1) return 'Die Laufzeit muss mindestens ein Jahr sein.';
  if (laufzeit > laufzeitMax(spieler)) return `${spieler.name} unterschreibt hoechstens fuer ${laufzeitMax(spieler)} ${laufzeitMax(spieler) === 1 ? 'Jahr' : 'Jahre'}.`;
  return null;
}

/**
 * Einen Vertrag verlaengern. Moeglich, solange er im laufenden oder naechsten
 * Jahr endet; wer tief unzufrieden ist, lehnt ab.
 */
function verlaengern(spieler, laufzeit, saison) {
  if (spieler.karriereende) return { fehler: `${spieler.name} hoert zum Saisonende auf und verlaengert nicht mehr.` };
  if (!spieler.vertrag) return { fehler: `${spieler.name} hat keinen Vertrag.` };
  if (spieler.vertrag.bis > saison + 1) return { fehler: `Der Vertrag von ${spieler.name} laeuft noch bis Saison ${spieler.vertrag.bis}.` };
  const falsch = laufzeitPruefen(spieler, laufzeit);
  if (falsch) return { fehler: falsch };
  if (spieler.moral < 25) return { fehler: `${spieler.name} will den Verein verlassen und verlaengert nicht.` };
  const gehalt = gehaltswunsch(spieler);
  spieler.vertrag = { bis: Math.max(spieler.vertrag.bis, saison) + laufzeit, gehalt };
  return { ok: true, bis: spieler.vertrag.bis, gehalt };
}

/** Die Abfindung bei Aufloesung: die Haelfte der restlichen Jahresgehaelter. */
function abfindung(spieler, saison) {
  if (!spieler.vertrag) return 0;
  return Math.round(spieler.vertrag.gehalt * Math.max(1, spieler.vertrag.bis - saison + 1) * 0.5);
}

/**
 * Will ein Spieler zu diesem Verein? Wer deutlich besser ist als der Verein,
 * geht nicht in die zweite Liga und nicht zu einem Verein ohne Ruf.
 */
function wechselbereit(spieler, verein) {
  const abstand = spieler.staerke - niveau(verein);
  if (abstand >= 14 && (verein.liga === 2 || verein.reputation < 50)) {
    return { ok: false, grund: `${spieler.name} sieht bei ${verein.name} keine Perspektive.` };
  }
  return { ok: true };
}

/** Ein neuer Vertrag fuer einen Neuzugang: ab dieser Saison, `laufzeit` Jahre. */
function neuerVertrag(spieler, laufzeit, saison) {
  return { bis: saison + laufzeit - 1, gehalt: gehaltswunsch(spieler) };
}

module.exports = {
  gehaltswunsch, laufzeitMax, laufzeitPruefen, verlaengern, abfindung, wechselbereit, neuerVertrag,
};
