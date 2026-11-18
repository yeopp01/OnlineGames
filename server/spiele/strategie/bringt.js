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

const { EINHEITEN, KLASSEN, HANDEL, ZEITALTER, VERBESSERUNGEN, SCHIESSENDE } = require('./daten.js');

const ROHSTOFFE = { holz: 'Holz', nahrung: 'Nahrung', gold: 'Gold', stein: 'Stein' };
const FELDER = [['leben', 'Leben'], ['angriff', 'Angriff'], ['reichweite', 'Reichweite'], ['sicht', 'Sicht'], ['tempo', 'Tempo'], ['tragkraft', 'Tragkraft']];

const mit = (zahl) => `${zahl > 0 ? '+' : '−'}${String(Math.abs(zahl)).replace('.', ',')}`;
const prozent = (anteil) => `${Math.round(anteil * 100)} %`;

function aufzaehlung(namen) {
  if (namen.length < 2) return namen.join('');
  return `${namen.slice(0, -1).join(', ')} und ${namen.at(-1)}`;
}

const ohneArtikel = (name) => name.replace(/^(Der|Die|Das) /, '');

/** Was schiesst, beim Namen - gelesen aus den Daten, nicht aufgezaehlt. */
function schiessende(bauwerkNamen) {
  return [...SCHIESSENDE].map((art) => ohneArtikel(bauwerkNamen[art] || art));
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
  if (w.tempoAnteil) teile.push(`+${prozent(w.tempoAnteil)} Tempo`);
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
  // Wen eine Zeile meint: die Klasse - oder, hebt die Verbesserung eine
  // Einheit (einheiten AC-69), diese beim neuen Namen: "Elite-Riese: +40 Leben".
  const wer = (schluessel) => (EINHEITEN[schluessel] && verbesserung.nennt?.[schluessel]) || wen(schluessel);
  for (const [art, w] of Object.entries(verbesserung.bauwerk || {})) {
    // Hat die Vorstufe es schon umbenannt, heisst es im Satz so: "Der
    // Wehrturm wird Bergfried" (bauen AC-50) - mit dem Artikel, den es hatte.
    const davor = VERBESSERUNGEN[verbesserung.vorstufe || '']?.nennt?.[art];
    const grundname = bauwerkNamen[art] || art;
    const wer = davor ? grundname.replace(ohneArtikel(grundname), davor) : grundname;
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
    gruppen.get(text).push(wer(schluessel));
  }
  for (const [text, namen] of gruppen) zeilen.push(`${aufzaehlung(namen)}: ${text}`);
  for (const [rohstoff, faktor] of Object.entries(verbesserung.sammeln || {})) {
    if (faktor !== 1) zeilen.push(`${ROHSTOFFE[rohstoff] || rohstoff} wird ${prozent(faktor - 1)} schneller gesammelt`);
  }
  if (verbesserung.farm?.nahrung) zeilen.push(`Jede neue Farm trägt ${verbesserung.farm.nahrung} Nahrung mehr`);
  if (verbesserung.gebaeude) {
    const { sicht, angriff, ...rest } = verbesserung.gebaeude;
    const text = zuschlaege(rest);
    if (text) zeilen.push(`Gebäude: ${text}`);
    if (sicht) zeilen.push(`Gebäude sehen ${sicht} Felder weiter`);
    // Angriff gilt nur dem, was schiesst (bauen AC-50, Chemie).
    if (angriff) zeilen.push(`${aufzaehlung(schiessende(bauwerkNamen))}: ${mit(angriff)} Angriff`);
  }
  // Schnellere Ausbildung je Gebaeude (bauen AC-50, Wehrpflicht): gleiche
  // Faktoren in einer Zeile.
  const schneller = new Map();
  for (const [art, faktor] of Object.entries(verbesserung.ausbildung || {})) {
    if (faktor === 1) continue;
    if (!schneller.has(faktor)) schneller.set(faktor, []);
    schneller.get(faktor).push(ohneArtikel(bauwerkNamen[art] || art));
  }
  for (const [faktor, namen] of schneller) {
    zeilen.push(`${aufzaehlung(namen)} ${namen.length > 1 ? 'bilden' : 'bildet'} ${prozent(faktor - 1)} schneller aus`);
  }
  // Ein Anteil mehr Schaden gegen eine Klasse (bauen AC-50).
  for (const [schluessel, anteile] of Object.entries(verbesserung.bonusAnteil || {})) {
    for (const [klasse, anteil] of Object.entries(anteile)) zeilen.push(`${wen(schluessel)}: +${prozent(anteil)} Schaden an ${KLASSEN[klasse]?.name || klasse}n`);
  }
  // Die ganze Karte (bauen AC-52).
  if (verbesserung.karte) {
    zeilen.push('Die ganze Karte gilt als erkundet: Gelände, Wald, Gold, Stein und Beeren – für dich und deine Verbündeten');
    zeilen.push('Fremde Einheiten und Gebäude zeigt sie nicht');
  }
  // Ein Zuschlag je Klasse des Ziels (bauen AC-54, AC-56).
  for (const [schluessel, boni] of Object.entries(verbesserung.bonus || {})) {
    for (const [klasse, zahl] of Object.entries(boni)) zeilen.push(`${wer(schluessel)}: ${mit(zahl)} Angriff gegen ${KLASSEN[klasse]?.name || klasse}`);
  }
  // Reichweite und Ruhe des Bekehrens (bauen AC-55), mit den Zahlen davor
  // und danach - gelesen an dem, der bekehrt.
  const bekehrer = Object.values(EINHEITEN).find((e) => e.bekehren)?.bekehren;
  if (bekehrer && verbesserung.bekehren?.reichweite) {
    zeilen.push(`Mönche bekehren aus ${bekehrer.reichweite + verbesserung.bekehren.reichweite} statt ${bekehrer.reichweite} Feldern`);
  }
  if (bekehrer && verbesserung.bekehren?.ruhe) {
    zeilen.push(`Mönche ruhen nach einer Bekehrung ${bekehrer.ruhe + verbesserung.bekehren.ruhe} statt ${bekehrer.ruhe} Sekunden`);
  }
  if (verbesserung.bautempo && verbesserung.bautempo !== 1) zeilen.push(`Dorfbewohner bauen ${prozent(verbesserung.bautempo - 1)} schneller`);
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
 * `gebaeude.reichweite` gilt nur dem, was schiesst, `handel` und `ausbildung`;
 * dazu `preis` je Einheitenart (einheiten AC-44).
 *
 * `einheitNamen`: wie eine Einheit im Satz heisst, im vierten Fall ("Den
 * Söldner") - so stehen sie in den Meldungen der Welt.
 * @param {import('./daten.js').Wirkungen} [wirkungen]
 * @param {Record<string, string>} [bauwerkNamen]
 * @param {Record<string, string>} [einheitNamen]
 */
function hausZeilen(wirkungen, bauwerkNamen = {}, einheitNamen = {}) {
  const { gebaeude, handel, ausbildung, preis, ...rest } = wirkungen || {};
  const zeilen = bringt(/** @type {any} */ (rest), bauwerkNamen);
  if (gebaeude) {
    const { reichweite, sicht, ...uebrig } = gebaeude;
    const text = zuschlaege(uebrig);
    if (text) zeilen.push(`Gebäude: ${text}`);
    if (sicht) zeilen.push(`Gebäude sehen ${sicht} Felder weiter`);
    if (reichweite) {
      // Nur was schiesst.
      zeilen.push(`${aufzaehlung(schiessende(bauwerkNamen))}: ${mit(reichweite)} Reichweite`);
    }
  }
  if (handel?.gebuehr) zeilen.push(`Am Markt ${prozent(HANDEL.gebuehr + handel.gebuehr)} Gebühr statt ${prozent(HANDEL.gebuehr)}`);
  if (handel?.karrenAnteil) zeilen.push(`Marktkarren bringen ${prozent(handel.karrenAnteil)} mehr Gold je Fahrt`);
  if (handel?.verbuendetAnteil) zeilen.push(`Marktkarren zwischen Verbündeten bringen ${prozent(handel.verbuendetAnteil)} mehr Gold je Fahrt`);
  for (const [art, faktor] of Object.entries(ausbildung || {})) {
    if (faktor !== 1) zeilen.push(`${bauwerkNamen[art] || art} bildet ${prozent(faktor - 1)} schneller aus`);
  }
  for (const [art, faktor] of Object.entries(preis || {})) {
    if (faktor !== 1) zeilen.push(`${einheitNamen[art] || art} gibt es ${prozent(Math.abs(1 - faktor))} ${faktor < 1 ? 'billiger' : 'teurer'}`);
  }
  return zeilen;
}

/**
 * Was ein Haus bringt, in Worten (bedienung AC-69): `bringt` sind die Boni
 * des Hauses selbst - die spaeteren mit ihrem Zeitalter davor -, `mannschaft`
 * die, die im Buendnis auch den Verbuendeten gelten (spielziel AC-25).
 * @param {import('./daten.js').Haus} haus
 * @param {Record<string, string>} [bauwerkNamen]
 * @param {Record<string, string>} [einheitNamen]
 */
function hausBringt(haus, bauwerkNamen = {}, einheitNamen = {}) {
  const zeilen = hausZeilen(haus.boni, bauwerkNamen, einheitNamen);
  for (const [stufe, boni] of Object.entries(haus.boniAb || {})) {
    const ab = ZEITALTER[Number(stufe)]?.ab || '';
    for (const zeile of hausZeilen(boni, bauwerkNamen, einheitNamen)) zeilen.push(`${ab.charAt(0).toUpperCase()}${ab.slice(1)} – ${zeile}`);
  }
  return { bringt: zeilen, mannschaft: hausZeilen(haus.mannschaft, bauwerkNamen) };
}

module.exports = { bringt, staerkt, hausBringt };
