'use strict';

// Die Welt einer Karriere: zwei Ligen zu je achtzehn Vereinen, ein Pokal,
// Vertraege, Jugend, Vorstand, Stadion - und 35 Vereine, die nach denselben
// Regeln spielen, handeln und wirtschaften wie der Mensch.
//
// Der Zustand ist ein reiner Datenwert - `sichern()` gibt ihn heraus,
// `laden()` nimmt ihn zurueck (→ docs/adr/0007-zwei-arten-von-partien.md).
// Der Zufall wird nicht mitgeschleppt: jeder Termin zieht seine Quellen aus
// Startwert, Saison, Termin und Zweck. Derselbe Spielstand ergibt mit
// denselben Zuegen dieselbe Fortsetzung.
const kader = require('./kader');
const liga = require('./liga');
const vorstand = require('./vorstand');
const { saisonKalender, terminTitel } = require('./kalender');
const { zufallAus } = require('./zufall');

// Die Fassung des Spielstands. Aendert sich seine Bauart, steigt sie - und
// ein alter Stand wird abgelehnt statt halb geladen (speichern AC-17).
const FASSUNG = 3;
// Aeltere Fassungen, die sich beim Laden anheben lassen (→ anheben).
const LADBARE_FASSUNGEN = [2, FASSUNG];
const TERMINE = saisonKalender();
const NACHRICHTEN_MAX = 160;
const BUCH_MAX = 260;
const TABELLEN_IN_HISTORIE = 10;
const FREIE_MIN = 45;
const FREIE_MAX = 90;
const ABSTIEGSKLAUSEL = 0.75;
const ZWECK = {
  liga: 1, pokal: 2, transfer: 3, saisonende: 4, auslosung: 5, sponsor: 6, jugend: 7, angebote: 8, start: 9, stellen: 10,
};

// Betraege stehen in Tausend. Ueber tausend wird daraus eine Million -
// dieselbe Regel wie in der Oberflaeche.
function geld(tausend) {
  const zahl = Math.round(tausend);
  if (Math.abs(zahl) >= 1000) return `${(zahl / 1000).toFixed(1).replace('.', ',')} Mio`;
  return `${zahl} T`;
}

/** Eine Zufallsquelle je Saison, Termin und Zweck. */
function quelle(startwert, saison, termin, zweck) {
  let h = (startwert >>> 0) ^ 0x5f3759df;
  h = Math.imul(h ^ saison, 0x9e3779b1) >>> 0;
  h = Math.imul(h ^ (termin + 17), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ zweck, 0xc2b2ae35) >>> 0;
  return zufallAus((h ^ (h >>> 16)) >>> 0);
}

function mischen(liste, zufall) {
  for (let i = liste.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [liste[i], liste[j]] = [liste[j], liste[i]];
  }
  return liste;
}

const zahlOder = (wert, sonst) => (Number.isFinite(wert) ? wert : sonst);

// Die Klasse traegt hier nur Zustand, Lesen, Buch und Post, Sichern und
// Laden. Ablauf, Zuege und Sicht setzt karriere.js dazu - wer eine
// Karriere braucht, holt sie dort.
class Karriere {
  /** @param {object} zustand  siehe `neu()` - oder das Ergebnis von `sichern()` */
  constructor(zustand) {
    Object.assign(this, zustand);
  }

  /**
   * @param {object} einstellungen
   * @param {number} einstellungen.startwert
   * @param {string|null} einstellungen.vereinId  der Verein des Menschen;
   *   ohne ihn laeuft die Welt allein (fuer Messungen und Tests)
   */
  static neu({ startwert, vereinId = null, name = 'Neue Karriere' }) {
    const welt = kader.weltErzeugen(startwert);
    const eigener = welt.vereine.find((v) => v.id === vereinId) || null;
    const karriere = new Karriere({
      fassung: FASSUNG,
      name,
      startwert,
      saison: 1,
      termin: 0,
      vereinId: eigener ? eigener.id : null,
      vereine: welt.vereine,
      freie: welt.freie,
      zaehler: welt.zaehler,
      status: 'laeuft',
      stellen: [],
      plaene: {},
      tabellen: {},
      torjaeger: {},
      pokal: null,
      vorstand: eigener ? { ziel: null, vertrauen: vorstand.VERTRAUEN_START } : null,
      sponsorAngebote: [],
      angebote: [],
      ticker: [],
      nachrichten: [],
      buch: [],
      kasse: null,
      vorjahr: null,
      historie: [],
      zuletzt: null,
      entwicklungen: [],
    });
    karriere.saisonVorbereiten();
    if (eigener) {
      karriere.melden('verein', `Willkommen bei ${eigener.name}. Der Vorstand erwartet in dieser Saison: `
        + `${karriere.vorstand.ziel.text} (Platz ${karriere.vorstand.ziel.platz} oder besser).`);
    }
    return karriere;
  }

  // --------------------------------------------------------------- Lesen

  get termine() {
    return TERMINE;
  }

  get verein() {
    return this.vereine.find((v) => v.id === this.vereinId) || null;
  }

  vereinVon(id) {
    return this.vereine.find((v) => v.id === id) || null;
  }

  platz(vereinId = this.vereinId) {
    const verein = this.vereinVon(vereinId);
    if (!verein) return null;
    return liga.sortiert(this.tabellen[verein.liga]).findIndex((z) => z.id === vereinId) + 1;
  }

  neueId() {
    this.zaehler += 1;
    return `p${this.zaehler}`;
  }

  erzeuger(zufall) {
    const vergeben = new Set([
      ...this.vereine.flatMap((v) => v.spieler.map((s) => s.name)),
      ...this.freie.map((s) => s.name),
    ]);
    return { neueId: () => this.neueId(), neuerName: kader.namensgeber(zufall, vergeben), saison: this.saison };
  }

  // ------------------------------------------------------ Buch und Post

  melden(art, text) {
    if (!this.vereinId) return;
    this.nachrichten.push({
      saison: this.saison, termin: this.termin, datum: terminTitel(TERMINE[this.termin]), art, text,
    });
    if (this.nachrichten.length > NACHRICHTEN_MAX) this.nachrichten.splice(0, this.nachrichten.length - NACHRICHTEN_MAX);
  }

  /** Geld bewegen. Beim Menschen mit Buchung und Saisonposten, bei allen anderen nur das Konto. */
  buchen(verein, kategorie, betrag, zweck) {
    const gerundet = Math.round(betrag);
    if (!gerundet) return;
    verein.konto += gerundet;
    if (verein.id !== this.vereinId || !this.kasse) return;
    const posten = this.kasse.posten[kategorie] || (this.kasse.posten[kategorie] = { ein: 0, aus: 0 });
    if (gerundet > 0) posten.ein += gerundet;
    else posten.aus -= gerundet;
    this.buch.push({
      saison: this.saison, datum: terminTitel(TERMINE[this.termin]), kategorie, betrag: gerundet, zweck,
    });
    if (this.buch.length > BUCH_MAX) this.buch.splice(0, this.buch.length - BUCH_MAX);
  }

  // --------------------------------------------------- Sichern und Laden

  sichern() {
    return JSON.parse(JSON.stringify(this));
  }

  static laden(daten) {
    if (!daten || !LADBARE_FASSUNGEN.includes(daten.fassung)) {
      const fehler = new Error('Dieser Spielstand stammt aus einer anderen Fassung des Spiels.');
      fehler.code = 'FASSUNG';
      throw fehler;
    }
    return new Karriere(anheben(JSON.parse(JSON.stringify(daten))));
  }
}

/**
 * Ein Spielstand der Fassung 2 kannte keine Positionen. Beim Laden bekommt
 * jeder Spieler eine, so wie ein Neuer im Verein: die, von der es im Kader
 * gemessen am Plan am wenigsten gibt - die Staerksten zuerst, damit sie die
 * tragenden Rollen bekommen. Gemerkte Aufstellungen passen zu keinen Plaetzen
 * und fallen weg. Danach ist es ein Stand der jetzigen Fassung.
 */
function anheben(daten) {
  if (daten.fassung === 2) {
    const verteilen = (spieler, imVerein) => {
      const vergeben = [];
      for (const s of [...spieler].sort((a, b) => b.staerke - a.staerke)) {
        if (!s.rolle) Object.assign(s, kader.rollenFuer(s, imVerein ? vergeben : null));
        vergeben.push(s);
      }
    };
    for (const verein of daten.vereine) {
      verteilen(verein.spieler, true);
      verein.aufstellung = null;
    }
    verteilen(daten.freie, false);
    daten.fassung = FASSUNG;
  }
  return daten;
}

module.exports = {
  Karriere, FASSUNG, LADBARE_FASSUNGEN, TERMINE, TABELLEN_IN_HISTORIE, FREIE_MIN, FREIE_MAX, ABSTIEGSKLAUSEL,
  ZWECK, geld, quelle, mischen, zahlOder, anheben,
};
