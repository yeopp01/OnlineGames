// @ts-check
'use strict';

// Was eine Verbesserung bringt, in Worten (bedienung AC-55).
//
// Der Knopf zeigte nur, was sie kostet - "Webstuhl erforschen (50 Gold)" -,
// und wer sie nicht kannte, erforschte auf gut Glueck (das erste Spiel auf
// dem Server, 2026-11-12). Die Saetze entstehen hier aus denselben Daten, mit
// denen die Welt rechnet: aendert jemand eine Zahl in `VERBESSERUNGEN`, steht
// sie im selben Augenblick im Menue.
//
// Auf dem Server und nicht im Browser, weil der Browser keine Wirkung aus den
// Verbesserungen liest (tests/waechter-wirkungen.test.mjs, ADR-0001): er
// bekommt die fertigen Zeilen in `werte.verbesserungen[art].bringt`.

const { EINHEITEN, KLASSEN, GEBAEUDE, HANDEL, ZEITALTER } = require('./daten.js');

const ROHSTOFFE = { holz: 'Holz', nahrung: 'Nahrung', gold: 'Gold', stein: 'Stein' };
const FELDER = [['leben', 'Leben'], ['angriff', 'Angriff'], ['reichweite', 'Reichweite'], ['sicht', 'Sicht'], ['tempo', 'Tempo'], ['tragkraft', 'Tragkraft']];

const mit = (zahl) => `${zahl > 0 ? '+' : '−'}${String(Math.abs(zahl)).replace('.', ',')}`;
const prozent = (anteil) => `${Math.round(anteil * 100)} %`;

function aufzaehlung(namen) {
  if (namen.length < 2) return namen.join('');
  return `${namen.slice(0, -1).join(', ')} und ${namen.at(-1)}`;
}

/** Wen ein Schluessel der Wirkung meint: eine Klasse oder eine Einheitenart. */
function wen(schluessel) {
  if (KLASSEN[schluessel]) return KLASSEN[schluessel].name;
  const klasse = EINHEITEN[schluessel]?.klassen?.[0];
  return KLASSEN[klasse]?.name || schluessel;
}

/**
 * Zuschlaege als Text: "+15 Leben, +1 / +2 Rüstung". Mit `grund`, den Werten
 * der Einheit, steht das Tempo als Anteil da: "+0,08 Tempo" sagt niemandem
 * etwas, "+10 % Tempo" schon (bauen AC-44).
 * @param {Record<string, number>} w
 * @param {{tempo?: number}} [grund]
 */
function zuschlaege(w, grund) {
  const teile = [];
  if (w.lebenAnteil) teile.push(`+${prozent(w.lebenAnteil)} Leben`);
  for (const [feld, name] of FELDER) {
    if (!w[feld]) continue;
    if (feld === 'tempo' && grund?.tempo) teile.push(`+${prozent(w.tempo / grund.tempo)} ${name}`);
    else teile.push(`${mit(w[feld])} ${name}`);
  }
  const nah = w.nahruestung || 0;
  const fern = w.fernruestung || 0;
  // Dieselbe Reihenfolge wie an der Auswahl: gegen Nahkampf / gegen Fernkampf.
  if (nah && fern) teile.push(`${mit(nah)} / ${mit(fern)} Rüstung`);
  else if (nah) teile.push(`${mit(nah)} Rüstung gegen Nahkampf`);
  else if (fern) teile.push(`${mit(fern)} Rüstung gegen Fernkampf`);
  return teile.join(', ');
}

/**
 * Die Zeilen zu einer Verbesserung. Wer Einheiten austauscht (`wandelt`),
 * bekommt hier nichts dazu - die Namen und Werte der neuen Einheit kennt der
 * Browser aus seiner Tafel.
 *
 * `bauwerkNamen`: wie ein Gebaeude im Satz heisst ("Der Wachturm") - fuer
 * eine Verbesserung, die eine einzelne Gebaeudeart staerkt (bauen AC-38).
 * @param {import('./daten.js').Verbesserung} verbesserung
 * @param {Record<string, string>} [bauwerkNamen]
 */
function bringt(verbesserung, bauwerkNamen = {}) {
  const zeilen = [];
  for (const [art, w] of Object.entries(verbesserung.bauwerk || {})) {
    const wer = bauwerkNamen[art] || art;
    const neu = verbesserung.nennt?.[art];
    const text = zuschlaege(w);
    if (text) zeilen.push(`${wer}${neu ? ` wird ${neu}` : ''}: ${text} – auch jeder, der schon steht`);
  }
  // Gleiche Zuschlaege fuer mehrere Klassen in einer Zeile: "Infanterie und
  // Kavallerie: +1 Angriff".
  const gruppen = new Map();
  for (const [schluessel, w] of Object.entries(verbesserung.wirkung || {})) {
    const text = zuschlaege(w, EINHEITEN[schluessel]);
    if (!text) continue;
    if (!gruppen.has(text)) gruppen.set(text, []);
    gruppen.get(text).push(wen(schluessel));
  }
  for (const [text, namen] of gruppen) zeilen.push(`${aufzaehlung(namen)}: ${text}`);
  for (const [rohstoff, faktor] of Object.entries(verbesserung.sammeln || {})) {
    if (faktor !== 1) zeilen.push(`${ROHSTOFFE[rohstoff] || rohstoff} wird ${prozent(faktor - 1)} schneller gesammelt`);
  }
  if (verbesserung.farm?.nahrung) zeilen.push(`Jede neue Farm trägt ${verbesserung.farm.nahrung} Nahrung mehr`);
  if (verbesserung.gebaeude) {
    const { sicht, ...rest } = verbesserung.gebaeude;
    const text = zuschlaege(rest);
    if (text) zeilen.push(`Gebäude: ${text}`);
    if (sicht) zeilen.push(`Gebäude sehen ${sicht} Felder weiter`);
  }
  return zeilen;
}

/**
 * Was ein Zeitalter selbst staerkt, je Einheitenart: `[{ art, text }]`. Den
 * Namen der Art setzt der Browser davor - er kennt ihn, der Server nicht.
 */
function staerkt(wirkung) {
  return Object.entries(wirkung || {})
    .map(([art, w]) => ({ art, text: zuschlaege(w) }))
    .filter((eintrag) => eintrag.text);
}

/**
 * Die Zeilen zu einem Satz Boni eines Hauses. Dieselben Formen wie bei einer
 * Verbesserung und drei, die es nur bei den Haeusern gibt (daten.js):
 * `gebaeude.reichweite` gilt nur dem, was schiesst, `handel` und `ausbildung`.
 * @param {import('./daten.js').Wirkungen} [wirkungen]
 * @param {Record<string, string>} [bauwerkNamen]
 */
function hausZeilen(wirkungen, bauwerkNamen = {}) {
  const { gebaeude, handel, ausbildung, ...rest } = wirkungen || {};
  const zeilen = bringt(/** @type {any} */ (rest), bauwerkNamen);
  if (gebaeude) {
    const { reichweite, sicht, ...uebrig } = gebaeude;
    const text = zuschlaege(uebrig);
    if (text) zeilen.push(`Gebäude: ${text}`);
    if (sicht) zeilen.push(`Gebäude sehen ${sicht} Felder weiter`);
    if (reichweite) {
      // Nur was schiesst - gelesen aus den Daten, nicht aufgezaehlt.
      const schiesst = Object.entries(GEBAEUDE)
        .filter(([, g]) => (g.angriff || 0) > 0)
        .map(([art]) => (bauwerkNamen[art] || art).replace(/^(Der|Die|Das) /, ''));
      zeilen.push(`${aufzaehlung(schiesst)}: ${mit(reichweite)} Reichweite`);
    }
  }
  if (handel?.gebuehr) zeilen.push(`Am Markt ${prozent(HANDEL.gebuehr + handel.gebuehr)} Gebühr statt ${prozent(HANDEL.gebuehr)}`);
  if (handel?.karrenAnteil) zeilen.push(`Marktkarren bringen ${prozent(handel.karrenAnteil)} mehr Gold je Fahrt`);
  if (handel?.verbuendetAnteil) zeilen.push(`Marktkarren zwischen Verbündeten bringen ${prozent(handel.verbuendetAnteil)} mehr Gold je Fahrt`);
  for (const [art, faktor] of Object.entries(ausbildung || {})) {
    if (faktor !== 1) zeilen.push(`${bauwerkNamen[art] || art} bildet ${prozent(faktor - 1)} schneller aus`);
  }
  return zeilen;
}

/**
 * Was ein Haus bringt, in Worten (bedienung AC-69): `bringt` sind die Boni
 * des Hauses selbst - die spaeteren mit ihrem Zeitalter davor -, `mannschaft`
 * die, die im Buendnis auch den Verbuendeten gelten (spielziel AC-25).
 * @param {import('./daten.js').Haus} haus
 * @param {Record<string, string>} [bauwerkNamen]
 */
function hausBringt(haus, bauwerkNamen = {}) {
  const zeilen = hausZeilen(haus.boni, bauwerkNamen);
  for (const [stufe, boni] of Object.entries(haus.boniAb || {})) {
    const ab = ZEITALTER[Number(stufe)]?.ab || '';
    for (const zeile of hausZeilen(boni, bauwerkNamen)) zeilen.push(`${ab.charAt(0).toUpperCase()}${ab.slice(1)} – ${zeile}`);
  }
  return { bringt: zeilen, mannschaft: hausZeilen(haus.mannschaft, bauwerkNamen) };
}

module.exports = { bringt, staerkt, hausBringt };
