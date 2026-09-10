'use strict';

// Der Pokal: 32 Vereine, K.-o.-System in fuenf Runden. Wer unentschieden
// spielt, geht in die Verlaengerung und notfalls ins Elfmeterschiessen -
// ein Pokalspiel hat immer einen Sieger. Das Finale ist neutral, ohne
// Heimvorteil.
const { RUNDEN } = require('./kalender');

const TEILNEHMER = 32;
// Praemie in Tausend fuer das Erreichen einer Runde, dazu die fuer den Sieg.
const PRAEMIE = [250, 500, 1000, 2000, 3500];
const SIEGERPRAEMIE = 3500;

/**
 * Wer spielt mit: die ganze erste Liga und die vierzehn Besten der zweiten.
 *
 * @param {object[]} vereine
 * @param {string[]} rangZweite  Vereine der zweiten Liga, vom Besten abwaerts
 */
function teilnehmer(vereine, rangZweite) {
  const erste = vereine.filter((v) => v.liga === 1).map((v) => v.id);
  return [...erste, ...rangZweite.slice(0, TEILNEHMER - erste.length)];
}

/** Paarungen aus einem Topf. Wer zuerst gezogen wird, hat Heimrecht. */
function auslosen(ids, zufall) {
  const topf = ids.slice();
  for (let i = topf.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [topf[i], topf[j]] = [topf[j], topf[i]];
  }
  const paarungen = [];
  for (let i = 0; i + 1 < topf.length; i += 2) paarungen.push({ heim: topf[i], gast: topf[i + 1] });
  return paarungen;
}

function neuerPokal(ids, zufall) {
  return {
    runden: RUNDEN.map((name, i) => ({ name, paarungen: i === 0 ? auslosen(ids, zufall) : [] })),
    aktuell: 0,
    sieger: null,
  };
}

/** Die Sieger einer gespielten Runde, in der Reihenfolge der Paarungen. */
function siegerDerRunde(runde) {
  return runde.paarungen.map((p) => p.sieger);
}

module.exports = {
  TEILNEHMER, PRAEMIE, SIEGERPRAEMIE, RUNDEN, teilnehmer, auslosen, neuerPokal, siegerDerRunde,
};
