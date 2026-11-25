// @ts-check
// Die Uebersichtskarte unten rechts (→ specs/10-strategie/bedienung.md AC-11).
//
// Die ganze Karte als Raute, wie das Spielbild sie zeigt: Gelaende in seinen
// Farben, Gebaeude und Einheiten als Punkte in Spielerfarbe, der Ausschnitt
// der grossen Ansicht als Rahmen. Ein Klick - oder Ziehen - schiebt die
// Ansicht dorthin; ein Rechtsklick schickt die Auswahl hin (AC-53).
//
// Das Gelaende wird einmal in ein Bild gezeichnet und nur neu, wenn sich
// Felder aendern; Punkte und Rahmen fuenfmal je Sekunde - mehr sieht man auf
// so kleiner Flaeche nicht, und es kostet die grosse Ansicht nichts.

import { NEBELRAND } from './nebel.js';

const FARBEN = {
  0: '#6b7a3c', // Gras
  1: '#2f4a2a', // Wald
  2: '#6f3a3a', // Beeren
  3: '#2e5068', // Wasser
  4: '#c9a44a', // Gold
  5: '#9a9a92', // Stein
  6: '#7a6446', // bebaut
};
const NEU_ALLE_MS = 200;

export class Uebersicht {
  /**
   * @param {HTMLCanvasElement} leinwand
   * @param {import('./ansicht.js').Ansicht} ansicht
   */
  constructor(leinwand, ansicht) {
    this.leinwand = leinwand;
    this.ansicht = ansicht;
    this.stift = leinwand.getContext('2d');
    this.gelaende = null;
    this.gelaendeAlt = true;
    this.zuletzt = 0;
    // Was zuletzt gemalt wurde - fuer den Browserlauf (bedienung AC-11).
    this.punkte = [];
    this.rahmen = [];
    this.zielpunkt = null;
    this.nestpunkte = [];
    this.binden();
  }

  get breite() {
    return this.leinwand.clientWidth;
  }

  get hoehe() {
    return this.leinwand.clientHeight;
  }

  /** Feld (x, y) → Punkt auf der Uebersicht. */
  feldZuPunkt(x, y) {
    const g = this.ansicht.karte.groesse;
    return {
      x: ((x - y + g) / (2 * g)) * this.breite,
      y: ((x + y + 1) / (2 * g)) * this.hoehe,
    };
  }

  /** Punkt auf der Uebersicht → Feld (gebrochen). */
  punktZuFeld(px, py) {
    const g = this.ansicht.karte.groesse;
    const differenz = (px / this.breite) * 2 * g - g;
    const summe = (py / this.hoehe) * 2 * g - 1;
    return { x: (summe + differenz) / 2, y: (summe - differenz) / 2 };
  }

  feldGeaendert() {
    this.gelaendeAlt = true;
  }

  binden() {
    let zieht = false;
    const springen = (e) => {
      const rand = this.leinwand.getBoundingClientRect();
      const feld = this.punktZuFeld(e.clientX - rand.left, e.clientY - rand.top);
      const g = this.ansicht.karte.groesse;
      this.ansicht.blickAuf(Math.max(0, Math.min(g - 1, feld.x)), Math.max(0, Math.min(g - 1, feld.y)));
      this.zuletzt = 0;
    };
    this.leinwand.addEventListener('mousedown', (e) => {
      if (!this.ansicht.karte) return;
      // Rechts: die Auswahl geht zu diesem Feld - wie ein Rechtsklick im
      // Spielbild auf den Boden dort (bedienung AC-53). Mit Umschalt hinten
      // an die Reihe, mit einem gewaehlten Gebaeude sein Sammelpunkt.
      if (e.button === 2) {
        const rand = this.leinwand.getBoundingClientRect();
        const feld = this.punktZuFeld(e.clientX - rand.left, e.clientY - rand.top);
        const g = this.ansicht.karte.groesse;
        if (feld.x < -0.5 || feld.y < -0.5 || feld.x > g - 0.5 || feld.y > g - 0.5) return;
        this.ansicht.befehlenAufFeld(feld.x, feld.y, e.shiftKey);
        this.zuletzt = 0;
        e.preventDefault();
        return;
      }
      if (e.button !== 0) return;
      zieht = true;
      springen(e);
      e.preventDefault();
    });
    window.addEventListener('mousemove', (e) => { if (zieht) springen(e); });
    window.addEventListener('mouseup', () => { zieht = false; });
    this.leinwand.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  gelaendeZeichnen() {
    const { karte } = this.ansicht;
    const g = karte.groesse;
    const dichte = window.devicePixelRatio || 1;
    const bild = document.createElement('canvas');
    bild.width = Math.ceil(this.breite * dichte);
    bild.height = Math.ceil(this.hoehe * dichte);
    const s = bild.getContext('2d');
    s.scale(dichte, dichte);
    // Jedes Feld eine kleine Raute - bei 200 Feldern kleiner als ein Bildpunkt,
    // deshalb als Rechteck in Rautengroesse, das reicht fuer das Auge.
    const w = this.breite / g;
    const h = this.hoehe / g;
    let letzte = null;
    for (let y = 0; y < g; y++) {
      for (let x = 0; x < g; x++) {
        const farbe = FARBEN[karte.felder[y * g + x]] || FARBEN[0];
        if (farbe !== letzte) {
          s.fillStyle = farbe;
          letzte = farbe;
        }
        const p = this.feldZuPunkt(x, y);
        s.fillRect(p.x - w / 2, p.y - h / 2, w + 0.5, h + 0.5);
      }
    }
    this.gelaende = bild;
    this.gelaendeAlt = false;
  }

  zeichnen(jetzt = performance.now()) {
    const { ansicht } = this;
    if (!ansicht.karte || jetzt - this.zuletzt < NEU_ALLE_MS) return;
    this.zuletzt = jetzt;
    const dichte = window.devicePixelRatio || 1;
    if (this.leinwand.width !== Math.round(this.breite * dichte)) {
      this.leinwand.width = Math.round(this.breite * dichte);
      this.leinwand.height = Math.round(this.hoehe * dichte);
      this.gelaendeAlt = true;
    }
    if (this.gelaendeAlt) this.gelaendeZeichnen();
    const s = this.stift;
    s.setTransform(dichte, 0, 0, dichte, 0, 0);
    s.clearRect(0, 0, this.breite, this.hoehe);
    // Die Raute der Karte, darin das Gelaende.
    s.save();
    const ecken = [this.feldZuPunkt(-0.5, -0.5), this.feldZuPunkt(ansicht.karte.groesse - 0.5, -0.5),
      this.feldZuPunkt(ansicht.karte.groesse - 0.5, ansicht.karte.groesse - 0.5), this.feldZuPunkt(-0.5, ansicht.karte.groesse - 0.5)];
    s.beginPath();
    ecken.forEach((p, i) => (i ? s.lineTo(p.x, p.y) : s.moveTo(p.x, p.y)));
    s.closePath();
    s.clip();
    s.drawImage(this.gelaende, 0, 0, this.breite, this.hoehe);
    // Derselbe Nebel wie im Spielbild (darstellung AC-15), mit der Abbildung
    // von feldZuPunkt gestreckt.
    if (ansicht.nebelAn) {
      const g = ansicht.karte.groesse;
      s.save();
      s.transform(this.breite / (2 * g), this.hoehe / (2 * g), -this.breite / (2 * g), this.hoehe / (2 * g), this.breite / 2, this.hoehe / (2 * g));
      s.imageSmoothingEnabled = true;
      s.drawImage(ansicht.nebel.bild, -0.5 - NEBELRAND, -0.5 - NEBELRAND, g + 2 * NEBELRAND, g + 2 * NEBELRAND);
      s.restore();
    }
    s.restore();

    const punkte = [];
    const farbe = (id) => ansicht.spieler.get(id)?.farbe || '#888888';
    // Fremde Gebaeude nur, wie man sie sieht oder erinnert (kampf AC-12).
    for (const geb of ansicht.gezeigteGebaeude()) {
      const mitte = ansicht.gebaeudeMitte(geb);
      const p = this.feldZuPunkt(mitte.x, mitte.y);
      // Ein langes Gebaeude (das Tor) nach seiner Flaeche, nicht nach seiner
      // Laenge: sonst stuende es als Klotz in der Mauer.
      const groesse = Math.max(3, Math.sqrt(mitte.bx * mitte.by) * 1.2);
      s.fillStyle = farbe(geb.b);
      s.fillRect(p.x - groesse / 2, p.y - groesse / 2, groesse, groesse);
      s.strokeStyle = 'rgba(0,0,0,0.6)';
      s.lineWidth = 1;
      s.strokeRect(p.x - groesse / 2, p.y - groesse / 2, groesse, groesse);
      punkte.push({ art: 'gebaeude', i: geb.i, b: geb.b, x: p.x, y: p.y });
    }
    for (const e of ansicht.nachher.values()) {
      if (!ansicht.zuSehen(e.b, e.x, e.y)) continue;
      const p = this.feldZuPunkt(e.x, e.y);
      s.fillStyle = farbe(e.b);
      s.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
      punkte.push({ art: 'einheit', i: e.i, b: e.b, x: p.x, y: p.y });
    }
    this.punkte = punkte;
    // Ein Wunder (spielziel AC-29) sehen alle, auch im Nebel - der Sieg soll
    // eine Entscheidung sein, auf die die anderen antworten koennen.
    for (const w of ansicht.wunderuhren || []) {
      const p = this.feldZuPunkt(w.x, w.y);
      const groesse = Math.max(6, 5 * 1.2);
      s.fillStyle = farbe(w.wer);
      s.fillRect(p.x - groesse / 2, p.y - groesse / 2, groesse, groesse);
      s.strokeStyle = '#f2c14e';
      s.lineWidth = 2;
      s.strokeRect(p.x - groesse / 2 - 1, p.y - groesse / 2 - 1, groesse + 2, groesse + 2);
    }
    // Ein Ei, wo ein Drache fiel (einheiten AC-53): das sehen alle - ein
    // gluehender Ring, damit man es zwischen den Einheiten findet.
    for (const ei of ansicht.eier?.values() || []) {
      if (!ei.gefallen) continue;
      const p = this.feldZuPunkt(ei.x, ei.y);
      s.beginPath();
      s.arc(p.x, p.y, 4, 0, Math.PI * 2);
      s.fillStyle = '#2b2320';
      s.fill();
      s.strokeStyle = '#ff9a2e';
      s.lineWidth = 2;
      s.stroke();
    }
    // Die Nester mit der Kartografie (einheiten AC-73): ein Ei, das dort
    // liegt oder an das er sich erinnert - kleiner und ohne Glut als das
    // eines gefallenen Drachen.
    const nestpunkte = [];
    for (const nest of (ansicht.nebelAn && ansicht.nester?.values()) || []) {
      if (!nest.voll) continue;
      nestpunkte.push({ x: nest.x, y: nest.y });
      const p = this.feldZuPunkt(nest.x, nest.y);
      s.beginPath();
      s.arc(p.x, p.y, 3, 0, Math.PI * 2);
      s.fillStyle = '#2b2320';
      s.fill();
      s.strokeStyle = '#d9b46a';
      s.lineWidth = 1.5;
      s.stroke();
    }
    this.nestpunkte = nestpunkte;

    // Das Zeichen am Ziel eines Befehls steht auch hier (bedienung AC-53):
    // wer auf der Uebersicht schickt, sieht das Spielbild dort meist nicht.
    const zeichen = ansicht.zielzeichen;
    this.zielpunkt = null;
    if (zeichen) {
      const p = this.feldZuPunkt(zeichen.x, zeichen.y);
      this.zielpunkt = { x: p.x, y: p.y, feindlich: zeichen.feindlich };
      s.beginPath();
      s.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      s.strokeStyle = 'rgba(15,18,22,0.9)';
      s.lineWidth = 3.5;
      s.stroke();
      s.strokeStyle = zeichen.feindlich ? '#e23c2a' : zeichen.arbeit ? '#f2c14e' : '#ffffff';
      s.lineWidth = 1.5;
      s.stroke();
    }

    // Der Ausschnitt der grossen Ansicht: die vier Ecken des Bildes als Felder.
    const w = ansicht.leinwand.clientWidth;
    const h = ansicht.leinwand.clientHeight;
    this.rahmen = [[0, 0], [w, 0], [w, h], [0, h]].map(([x, y]) => {
      const feld = ansicht.zuWelt(x, y);
      return this.feldZuPunkt(feld.x, feld.y);
    });
    s.beginPath();
    this.rahmen.forEach((p, i) => (i ? s.lineTo(p.x, p.y) : s.moveTo(p.x, p.y)));
    s.closePath();
    s.strokeStyle = '#ffffff';
    s.lineWidth = 1.5;
    s.stroke();
  }
}
