'use strict';

// Der Pruefstand (→ specs/10-strategie/ki.md AC-7, AC-8, fahrplan AC-4):
// Partien KI gegen KI ohne Server und Browser, so schnell die Maschine kann.
// Nach jedem Takt wird die Welt auf Widersprueche geprueft; der erste bricht
// die Partie mit Startwert und Takt ab - damit laesst sie sich nachspielen.

const karten = require('./karte');
const { Welt, TAKTE_PRO_SEKUNDE, ROHSTOFFE } = require('./welt');
const { BEVOELKERUNG_MAX, EINHEITEN } = require('./daten');
const { Ki } = require('./ki');

class Widerspruch extends Error {
  constructor(startwert, takt, befunde) {
    super(`Widerspruch bei Startwert ${startwert}, Takt ${takt}: ${befunde.join('; ')}`);
    this.startwert = startwert;
    this.takt = takt;
    this.befunde = befunde;
  }
}

/** Alles, was nie sein darf. Zurueck kommt eine Liste, leer heisst: in Ordnung. */
function pruefen(welt) {
  const befunde = [];
  const bevoelkerung = welt.bevoelkerung();
  for (const spieler of welt.spieler) {
    for (const r of ROHSTOFFE) {
      if (!(spieler[r] >= 0)) befunde.push(`${spieler.name}: ${r} ist ${spieler[r]}`);
    }
    const zahl = bevoelkerung.get(spieler.id) || 0;
    if (zahl > BEVOELKERUNG_MAX) befunde.push(`${spieler.name}: Bevoelkerung ${zahl} ueber ${BEVOELKERUNG_MAX}`);
  }
  for (const e of welt.einheiten.values()) {
    const x = Math.round(e.x);
    const y = Math.round(e.y);
    if (!karten.begehbar(welt.karte, x, y)) {
      befunde.push(`Einheit ${e.id} (${e.art}) steht auf ${x}, ${y} in einem Hindernis (Feld ${welt.karte.felder[y * welt.karte.groesse + x]})`);
    }
  }
  const liste = [...welt.gebaeude.values()].map((g) => ({ g, f: welt.grundflaeche(g.art, g.x, g.y) }));
  for (let i = 0; i < liste.length; i++) {
    for (let j = i + 1; j < liste.length; j++) {
      const a = liste[i].f;
      const b = liste[j].f;
      if (a.x0 <= b.x1 && a.x1 >= b.x0 && a.y0 <= b.y1 && a.y1 >= b.y0) {
        befunde.push(`Gebaeude ${liste[i].g.id} (${liste[i].g.art}) und ${liste[j].g.id} (${liste[j].g.art}) ueberlappen`);
      }
    }
  }
  return befunde;
}

/**
 * Wer steht herum? Ein Dorfbewohner, der weder laeuft noch sammelt, hueten
 * oder Farm bestellt noch baut. Gezaehlt in Takten je Einheit, die laengste
 * Strecke je Spieler bleibt.
 */
function untaetigkeitZaehlen(welt, untaetig) {
  for (const e of welt.einheiten.values()) {
    if (e.art !== 'dorfbewohner') continue;
    if (!welt.untaetig(e)) {
      untaetig.seit.delete(e.id);
      continue;
    }
    const n = (untaetig.seit.get(e.id) || 0) + 1;
    untaetig.seit.set(e.id, n);
    if (n > (untaetig.laengste.get(e.besitzer) || 0)) untaetig.laengste.set(e.besitzer, n);
  }
}

/** Kennzahlen eines Spielers am Ende einer Partie. */
function kennzahlen(welt, spieler, ki, untaetig) {
  const eigene = [...welt.einheiten.values()].filter((e) => e.besitzer === spieler.id);
  const gebaeude = {};
  for (const g of welt.gebaeude.values()) {
    if (g.besitzer === spieler.id && g.fertig) gebaeude[g.art] = (gebaeude[g.art] || 0) + 1;
  }
  return {
    name: spieler.name,
    dorfbewohner: eigene.filter((e) => e.art === 'dorfbewohner').length,
    einheiten: eigene.length,
    // Alles, was kein Dorfbewohner ist: die Klasse `dorf` sagt es, nicht die
    // Art - so zaehlt jede neue Kampfeinheit spaeterer Stufen mit (ki AC-9).
    kampf: eigene.filter((e) => !(EINHEITEN[e.art].klassen || []).includes('dorf')).length,
    wohnraum: welt.wohnraum(spieler),
    zeitalter: spieler.zeitalter,
    // In welcher Spielminute die Feudalzeit stand, `null` wenn gar nicht.
    feudalMinute: ki.feudalTakt === null ? null : ki.feudalTakt / (60 * TAKTE_PRO_SEKUNDE),
    gebaeude,
    ...Object.fromEntries(ROHSTOFFE.map((r) => [r, Math.floor(spieler[r])])),
    abgewiesen: ki.abgewiesen,
    // Laengste Zeit, die ein Dorfbewohner herumstand, in Sekunden (ki AC-6) -
    // von aussen gemessen, nicht nach der Meinung der KI.
    untaetigMax: (untaetig.laengste.get(spieler.id) || 0) / TAKTE_PRO_SEKUNDE,
  };
}

/**
 * Eine Partie KI gegen KI.
 * @param {{startwert: number, spieler?: number, minuten?: number, einstellungen?: object,
 *   eingriff?: (welt: Welt, takt: number) => void}} optionen
 *   `eingriff` ist nur fuer Tests: er laeuft vor der Pruefung jedes Takts.
 */
function partieSpielen({ startwert, spieler = 2, minuten = 10, einstellungen = {}, eingriff = null }) {
  const beginn = process.hrtime.bigint();
  const liste = Array.from({ length: spieler }, (_, i) => ({ id: `ki${i + 1}`, name: `KI ${i + 1}` }));
  const welt = new Welt(liste, startwert, einstellungen);
  const kis = welt.spieler.map((s) => new Ki(welt, s.id));
  const takte = Math.round(minuten * 60 * TAKTE_PRO_SEKUNDE);
  const untaetig = { seit: new Map(), laengste: new Map() };
  for (let t = 0; t < takte; t++) {
    for (const ki of kis) ki.takt();
    welt.takten();
    if (eingriff) eingriff(welt, welt.takt);
    const befunde = pruefen(welt);
    if (befunde.length) throw new Widerspruch(startwert, welt.takt, befunde);
    untaetigkeitZaehlen(welt, untaetig);
  }
  return {
    startwert,
    takte,
    dauerMs: Number(process.hrtime.bigint() - beginn) / 1e6,
    spieler: welt.spieler.map((s, i) => kennzahlen(welt, s, kis[i], untaetig)),
    welt,
  };
}

module.exports = { partieSpielen, pruefen, Widerspruch };
