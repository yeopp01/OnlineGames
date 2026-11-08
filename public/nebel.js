// Der Nebel im Bild (→ specs/10-strategie/kampf.md AC-11, AC-12,
// darstellung.md AC-15).
//
// Drei Stufen je Feld: **nie gesehen** (schwarz), **erkundet, aber jetzt
// unbeobachtet** (gedaempft) und **beobachtet** (frei). Die eigene Sicht rechnet
// der Browser aus den eigenen Einheiten und Gebaeuden - nach derselben Regel
// wie der Server (`welt.sichtAktualisieren`, kampf AC-15): eine Einheit sieht
// ihre Sichtweite, ein Gebaeude acht Felder ueber den Rand seiner Grundflaeche.
// Das kostet keine Uebertragung je Takt. Dass ein Browser Fremdes gar nicht
// erst bekommt, sichert der Server mit kampf AC-13 (C6c) - bis dahin laesst
// die Zeichnung es nur weg.
//
// Das Bild hat einen Bildpunkt je Feld und wird mit derselben Abbildung wie
// die Karte ueber das Spielbild gelegt; die Glaettung beim Strecken macht die
// Raender weich.

export const NIE = 255; // Deckkraft: nie gesehen
export const ERKUNDET = 150; // gesehen, jetzt unbeobachtet
export const BEOBACHTET = 0;
// So oft wird neu gerechnet: zweimal je Sekunde, wie auf dem Server.
const NEU_ALLE_TAKTE = 5;
// Die Farbe des Nichts - dieselbe wie der Grund der Leinwand.
const SCHWARZ = [15, 18, 22];

export class Nebel {
  /**
   * @param {number} groesse Seitenlaenge der Karte in Feldern
   * @param {boolean} erkundet die Karte ist von Anfang an bekannt (kampf AC-16)
   */
  constructor(groesse, erkundet = false) {
    this.groesse = groesse;
    this.sichtbar = new Uint8Array(groesse * groesse);
    this.gebaeude = new Uint8Array(groesse * groesse);
    this.erkundet = new Uint8Array(groesse * groesse);
    if (erkundet) this.erkundet.fill(1);
    this.gebaeudeSchluessel = null;
    this.takt = -Infinity;
    // Ein Bildpunkt Rand rundum, immer "nie gesehen": sonst mischt die
    // Glaettung am Kartenrand mit dem Durchsichtigen draussen, und eine
    // duenne Linie Gelaende scheint durch den Nebel (Runde 105, gesehen).
    const seite = groesse + 2;
    this.bild = document.createElement('canvas');
    this.bild.width = seite;
    this.bild.height = seite;
    this.punkte = this.bild.getContext('2d').createImageData(seite, seite);
    for (let i = 0; i < seite * seite; i++) {
      this.punkte.data[i * 4] = SCHWARZ[0];
      this.punkte.data[i * 4 + 1] = SCHWARZ[1];
      this.punkte.data[i * 4 + 2] = SCHWARZ[2];
      this.punkte.data[i * 4 + 3] = NIE;
    }
  }

  // Alles, was hoechstens r vom Rechteck (ax..bx, ay..by) entfernt ist.
  markieren(ziel, ax, ay, bx, by, r) {
    const g = this.groesse;
    const x0 = Math.max(0, Math.floor(ax - r));
    const x1 = Math.min(g - 1, Math.ceil(bx + r));
    const y0 = Math.max(0, Math.floor(ay - r));
    const y1 = Math.min(g - 1, Math.ceil(by + r));
    const rr = r * r;
    for (let y = y0; y <= y1; y++) {
      const dy = y < ay ? ay - y : y > by ? y - by : 0;
      for (let x = x0; x <= x1; x++) {
        const dx = x < ax ? ax - x : x > bx ? x - bx : 0;
        if (dx * dx + dy * dy > rr) continue;
        ziel[y * g + x] = 1;
        this.erkundet[y * g + x] = 1;
      }
    }
  }

  /**
   * Neu rechnen, wenn seit dem letzten Mal ein halbe Sekunde vergangen ist.
   * @param {import('./ansicht.js').Ansicht} ansicht
   * @param {boolean} sofort auch vor Ablauf der halben Sekunde
   */
  rechnen(ansicht, sofort = false) {
    if (!sofort && ansicht.takt - this.takt < NEU_ALLE_TAKTE) return false;
    this.takt = ansicht.takt;
    const ich = ansicht.ich;
    const werte = ansicht.einheitenwerte.get(ich) || {};
    this.sichtbar.fill(0);
    for (const e of ansicht.nachher.values()) {
      if (e.b !== ich || e.s) continue;
      const art = ansicht.arten[e.k];
      const r = werte[art]?.sicht ?? ansicht.werte.einheiten[art]?.sicht ?? 0;
      this.markieren(this.sichtbar, e.x, e.y, e.x, e.y, r);
    }
    // Gebaeude stehen still: neu nur, wenn eines dazukam oder fiel - wie auf
    // dem Server (Runde 104).
    const meine = [...ansicht.gebaeude.values()].filter((b) => b.b === ich);
    const schluessel = meine.map((b) => b.i).join(',');
    if (schluessel !== this.gebaeudeSchluessel) {
      this.gebaeudeSchluessel = schluessel;
      this.gebaeude.fill(0);
      for (const b of meine) {
        const groesse = ansicht.werte.gebaeude[b.art]?.groesse || 1;
        const x0 = b.x - Math.floor(groesse / 2);
        const y0 = b.y - Math.floor(groesse / 2);
        this.markieren(this.gebaeude, x0, y0, x0 + groesse - 1, y0 + groesse - 1, ansicht.werte.gebaeude[b.art]?.sicht ?? 8);
      }
    }
    const daten = this.punkte.data;
    const g = this.groesse;
    for (let y = 0; y < g; y++) {
      for (let x = 0; x < g; x++) {
        const i = y * g + x;
        daten[((y + 1) * (g + 2) + x + 1) * 4 + 3] = this.sichtbar[i] || this.gebaeude[i] ? BEOBACHTET : this.erkundet[i] ? ERKUNDET : NIE;
      }
    }
    this.bild.getContext('2d').putImageData(this.punkte, 0, 0);
    return true;
  }

  index(x, y) {
    const fx = Math.round(x);
    const fy = Math.round(y);
    if (fx < 0 || fy < 0 || fx >= this.groesse || fy >= this.groesse) return -1;
    return fy * this.groesse + fx;
  }

  sieht(x, y) {
    const i = this.index(x, y);
    return i >= 0 && (this.sichtbar[i] === 1 || this.gebaeude[i] === 1);
  }

  hatErkundet(x, y) {
    const i = this.index(x, y);
    return i >= 0 && this.erkundet[i] === 1;
  }

  // Die drei Stufen gezaehlt - fuer den Browserlauf (darstellung AC-15).
  zaehlen() {
    const z = { nie: 0, erkundet: 0, beobachtet: 0 };
    for (let i = 0; i < this.sichtbar.length; i++) {
      if (this.sichtbar[i] || this.gebaeude[i]) z.beobachtet += 1;
      else if (this.erkundet[i]) z.erkundet += 1;
      else z.nie += 1;
    }
    return z;
  }
}
