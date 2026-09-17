'use strict';

// Ein Computerspieler (→ specs/10-strategie/ki.md).
//
// Ehrlich (ki AC-1): die KI liest die Welt, aendert sie aber nie selbst - jeder
// Wunsch geht als Nachricht ueber `welt.nachricht`, denselben Weg, den der
// Server fuer den Browser nimmt. Was einem Menschen abgewiesen wird, wird ihr
// abgewiesen. Zufall nur aus dem Startwert (ki AC-2), entschieden wird alle
// halbe Sekunde, nicht in jedem Takt (ki AC-3).
//
// Stufe A, erster Schritt: die Grundwirtschaft - Dorfbewohner ausbilden, ein
// Haus, bevor der Wohnraum knapp wird, und wer nichts tut, geht sammeln. Der
// feste Plan der Dunklen Zeit (ki AC-4 bis AC-6) folgt.

const karten = require('./karte');
const { TAKTE_PRO_SEKUNDE } = require('./welt');
const { EINHEITEN, GEBAEUDE } = require('./daten');

const ENTSCHEIDEN_ALLE = TAKTE_PRO_SEKUNDE / 2;
// Wie die Dorfbewohner sich verteilen, solange es keinen Plan gibt: reihum.
const VERTEILUNG = [karten.BEERE, karten.WALD, karten.WALD, karten.BEERE, karten.GOLD, karten.WALD];

class Ki {
  /**
   * @param {import('./welt').Welt} welt
   * @param {string} spielerId
   */
  constructor(welt, spielerId) {
    this.welt = welt;
    this.spielerId = spielerId;
    const nummer = welt.spieler.findIndex((s) => s.id === spielerId);
    this.zufall = karten.zufallAus((welt.startwert * 31 + nummer * 7919) >>> 0);
    // Nicht alle KIs im selben Takt: jede bekommt einen festen Versatz.
    this.versatz = nummer % ENTSCHEIDEN_ALLE;
    this.zugeteilt = 0;
    this.abgewiesen = 0;
  }

  get spieler() {
    return this.welt.spielerVon(this.spielerId);
  }

  // Der einzige Weg in die Welt.
  senden(nachricht) {
    const antwort = this.welt.nachricht(this.spielerId, nachricht) || {};
    if (antwort.fehler) this.abgewiesen += 1;
    return antwort;
  }

  takt() {
    if (this.welt.takt % ENTSCHEIDEN_ALLE !== this.versatz) return;
    this.entscheiden();
  }

  entscheiden() {
    const eigene = [...this.welt.einheiten.values()].filter((e) => e.besitzer === this.spielerId);
    const zentrum = [...this.welt.gebaeude.values()].find((g) => g.besitzer === this.spielerId && g.art === 'dorfzentrum' && g.fertig);
    const dorfbewohner = eigene.filter((e) => e.art === 'dorfbewohner');

    // Wohnraum: ein Haus, wenn nur noch zwei Plaetze frei sind und keins im Bau ist.
    const raum = this.welt.wohnraum(this.spieler);
    const imBau = [...this.welt.gebaeude.values()].some((g) => g.besitzer === this.spielerId && !g.fertig && g.art === 'haus');
    if (raum - eigene.length <= 2 && !imBau && this.spieler.holz >= GEBAEUDE.haus.kosten.holz && dorfbewohner.length) {
      const platz = this.platzFuer('haus');
      if (platz) this.senden({ auftrag: 'bauen', einheiten: [this.bauer(dorfbewohner).id], art: 'haus', ziel: platz });
    }

    // Ohne Pause ausbilden: die Schlange nie leer, aber nicht auf Vorrat.
    if (zentrum && zentrum.schlange.length < 2 && this.spieler.nahrung >= EINHEITEN.dorfbewohner.kosten.nahrung) {
      this.senden({ auftrag: 'ausbilden', gebaeude: zentrum.id, einheit: 'dorfbewohner' });
    }

    // Wer nichts tut, geht sammeln.
    for (const einheit of dorfbewohner) {
      if (!this.untaetig(einheit)) continue;
      const art = VERTEILUNG[this.zugeteilt % VERTEILUNG.length];
      this.zugeteilt += 1;
      const ziel = this.naechstesFeld(einheit, art) || this.naechstesFeld(einheit, karten.WALD);
      if (ziel) this.senden({ auftrag: 'befehl', einheiten: [einheit.id], ziel });
    }
  }

  untaetig(einheit) {
    return !einheit.auftrag && !einheit.weg.length && !einheit.sammelt && !einheit.baut;
  }

  // Wer baut: ein Dorfbewohner, der gerade nichts traegt, sonst irgendeiner.
  bauer(dorfbewohner) {
    return dorfbewohner.find((e) => this.untaetig(e)) || dorfbewohner.find((e) => e.ladung === 0) || dorfbewohner[0];
  }

  naechstesFeld(einheit, art) {
    const { karte } = this.welt;
    let bestes = null;
    let besterAbstand = Infinity;
    for (const index of karte.vorrat.keys()) {
      if (karte.felder[index] !== art) continue;
      const x = index % karte.groesse;
      const y = (index / karte.groesse) | 0;
      const abstand = Math.hypot(x - einheit.x, y - einheit.y);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = { x, y };
      }
    }
    return bestes;
  }

  // Ein Bauplatz nahe der Basis, ringweise, der erste, den die Regel erlaubt -
  // mit einem Feld Abstand zu allem, damit Wege frei bleiben.
  platzFuer(art) {
    const { basis } = this.spieler;
    const n = GEBAEUDE[art].groesse;
    for (let r = 4; r < 16; r++) {
      const ring = [];
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) ring.push([dx, dy]);
      }
      const start = Math.floor(this.zufall() * ring.length);
      for (let i = 0; i < ring.length; i++) {
        const [dx, dy] = ring[(start + i) % ring.length];
        const x = basis.x + dx;
        const y = basis.y + dy;
        if (this.welt.platzPruefen(art, x, y) && this.randFrei(x, y, n)) return { x, y };
      }
    }
    return null;
  }

  randFrei(x, y, n) {
    const x0 = x - Math.floor(n / 2) - 1;
    const y0 = y - Math.floor(n / 2) - 1;
    for (let fy = y0; fy < y0 + n + 2; fy++) {
      for (let fx = x0; fx < x0 + n + 2; fx++) {
        if (!karten.begehbar(this.welt.karte, fx, fy)) return false;
      }
    }
    return true;
  }
}

module.exports = { Ki, ENTSCHEIDEN_ALLE };
