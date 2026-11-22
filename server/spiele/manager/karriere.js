// @ts-check
'use strict';

// Eine Karriere: ein Mensch fuehrt einen Verein durch Saison um Saison.
// Die Klasse setzt sich aus vier Teilen zusammen:
//   welt.js    der Zustand, neu(), sichern(), laden(), Buch und Post
//   ablauf.js  der Lauf der Termine und die Vereine ohne Menschen
//   zuege.js   was ein Manager befiehlt
//   sicht.js   was ein Manager sieht
// Wer eine Karriere braucht, holt sie hier - nie aus welt.js allein.
const { Karriere, FASSUNG, LADBARE_FASSUNGEN, TERMINE, geld, quelle, anheben } = require('./welt');
const { Ablauf } = require('./ablauf');
const { Zuege } = require('./zuege');
const { Sicht } = require('./sicht');

for (const teil of [Ablauf, Zuege, Sicht]) {
  for (const [name, beschreibung] of Object.entries(Object.getOwnPropertyDescriptors(teil.prototype))) {
    if (name === 'constructor') continue;
    if (Object.hasOwn(Karriere.prototype, name)) throw new Error(`Karriere.${name} steht zweimal`);
    Object.defineProperty(Karriere.prototype, name, beschreibung);
  }
}

/**
 * Die ganze Karriere fuer den Pruefer: Zustand und alle vier Teile. Wer
 * eine Karriere bekommt, schreibt `@param {GanzeKarriere}`.
 * @typedef {import('./daten').Karrierezustand & InstanceType<typeof Karriere> & InstanceType<typeof Ablauf> & InstanceType<typeof Zuege> & InstanceType<typeof Sicht>} GanzeKarriere
 */

/**
 * @type {{
 *   new (zustand: object): GanzeKarriere,
 *   neu(einstellungen: {startwert: number, vereinId?: string|null, name?: string}): GanzeKarriere,
 *   laden(daten: object): GanzeKarriere,
 * }}
 */
const GanzeKarriere = /** @type {any} */ (Karriere);

module.exports = {
  Karriere: GanzeKarriere, FASSUNG, LADBARE_FASSUNGEN, TERMINE, geld, quelle, anheben,
};
