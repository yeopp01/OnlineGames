// Zeichnet die Welt und nimmt Maus und Tastatur entgegen. Rechnen tut hier
// nichts - der Server schickt den Zustand, wir malen ihn.
//
// Isometrisch (→ specs/10-strategie/darstellung.md AC-1): ein Feld ist eine
// Raute, doppelt so breit wie hoch. Die Welt rechnet weiter in Feldern
// (x nach rechts unten, y nach links unten); nur zuBild und zuWelt kennen die
// Raute. Die Kamera liegt in Bildpunkten der Raute bei Vergroesserung 1.
import { FIGUREN, figurBildZeichnen } from './figuren.js';
import { GEBAEUDE, gebaeudeBildZeichnen, gebaeudeGetroffen } from './gebaeude.js';
import { KACHEL, kachelMassstab, kachelZeichnen } from './boden.js';
import {
  DINGE, GRAS, WALD, WASSER, dingBildZeichnen, grasBeginnen, grasSammeln, grasZeichnen, raute, wellenZeichnen,
} from './gelaende.js';

const HALB_B = 22; // halbe Rautenbreite in Bildpunkten bei Vergroesserung 1
const HALB_H = 11; // halbe Rautenhoehe
// Eine Figur ist etwas hoeher als eine Raute breit ist; ihr Koerper liegt ueber
// dem Fusspunkt, deshalb zielt ein Klick auf die Mitte des Koerpers.
const FIGUR_HOEHE = 1.3; // in halben Rautenbreiten * 2
const KOERPER_MITTE = 0.6; // Anteil der Figurenhoehe ueber dem Fusspunkt, auf den ein Klick zielt
const KLICK_WEITE = 16; // Bildpunkte bei Vergroesserung 1

/** Hoehe einer Figur in Bildpunkten bei einem Zoom - auch fuer die Schautafel. */
export function figurHoeheBei(zoom) {
  return Math.max(12, HALB_B * FIGUR_HOEHE * zoom);
}

// Schrittphase fuer die Beine: laeuft mit der Uhr, je Einheit versetzt, damit
// eine Gruppe nicht im Gleichschritt marschiert.

function jetztPhase(id) {
  return performance.now() / 110 + id * 1.7;
}

export class Ansicht {
  constructor(leinwand, befehlSenden) {
    this.leinwand = leinwand;
    this.stift = leinwand.getContext('2d');
    this.befehlSenden = befehlSenden;

    this.karte = null;
    this.fuellung = new Map(); // Feld → Viertel des Vorrats, der noch da ist (1 bis 4)
    this.spieler = new Map();
    this.ich = null;
    this.taktdauer = 100;

    this.vorher = new Map();
    this.nachher = new Map();
    this.empfangen = 0;
    this.ausgewaehlt = new Set();
    this.gebaeude = new Map();
    this.werte = { einheiten: {}, gebaeude: {} };
    this.arten = {};
    this.gewaehltesGebaeude = null; // id; entweder Einheiten oder ein Gebaeude
    this.beiAuswahl = () => {};
    // Nach jedem Bild und bei geaenderten Feldern - fuer die Uebersichtskarte (bedienung AC-11).
    this.nachBild = () => {};
    this.beiTaste = () => false;
    this.beiFeldern = () => {};
    // Die eigenen untaetigen Dorfbewohner, wie der Server sie meldet (einheiten AC-21).
    this.untaetige = [];
    this.letzterUntaetiger = null;
    // Platzieren eines Gebaeudes (bauen AC-4): welche Art, und wo der Zeiger ist.
    this.platzieren = null;
    this.zeiger = null;
    this.bauenSenden = () => {};
    this.sammelpunktSenden = () => {};
    this.verbesserungen = [];
    // Kurz eingeblendete Absagen (bedienung AC-18); app.js setzt die Anzeige.
    this.melden = () => {};
    this.blicke = new Map(); // Einheit → -1 links, 1 rechts
    this.tiere = new Map();
    this.vorraete = { holz: 0, nahrung: 0, gold: 0, stein: 0, bev: 0, raum: 0 };
    // Was im letzten Bild in welcher Reihenfolge gezeichnet wurde - fuer den
    // Browserlauf (darstellung AC-7).
    this.reihenfolge = [];

    this.kamera = { x: 0, y: 0, zoom: 1 };
    this.tasten = new Set();
    this.zug = null; // laufender Auswahlrahmen
    this.laeuft = false;

    this.binden();
  }

  aufbau(nachricht, ichId) {
    const roh = atob(nachricht.karte.felder);
    const felder = new Uint8Array(roh.length);
    for (let i = 0; i < roh.length; i++) felder[i] = roh.charCodeAt(i);

    this.karte = { groesse: nachricht.karte.groesse, felder };
    this.fuellung = new Map();
    this.taktdauer = 1000 / nachricht.takte;
    // Das Muster des Bodens haengt am Startwert: jede Karte ihr eigenes.
    // Die Werte der Arten kommen einmal mit dem Aufbau (bedienung AC-29); die
    // Art einer Einheit kommt danach nur als Kuerzel.
    this.werte = nachricht.werte || { einheiten: {}, gebaeude: {} };
    this.arten = Object.fromEntries(Object.entries(this.werte.einheiten).map(([art, w]) => [w.kuerzel, art]));
    this.salz = Number.isInteger(nachricht.startwert) ? nachricht.startwert % 65521 : 0;
    this.ich = ichId;
    this.spieler = new Map(nachricht.spieler.map((s) => [s.id, s]));
    // Tiere kommen einmal im Aufbau und danach nur bei Aenderung.
    this.tiere = new Map((nachricht.tiere || []).map((t) => [t.i, t]));
    // Gebaeude ebenso: einmal ganz, danach nur, was sich aendert.
    this.gebaeude = new Map((nachricht.gebaeude || []).map((g) => [g.i, g]));

    const meine = this.spieler.get(ichId);
    if (meine) this.blickAuf(meine.basis.x, meine.basis.y);

    this.groesseAnpassen();
    if (!this.laeuft) {
      this.laeuft = true;
      requestAnimationFrame(() => this.bild());
    }
  }

  zustand(nachricht) {
    for (const aenderung of nachricht.felder || []) {
      if (this.karte.felder[aenderung.i] !== aenderung.a) {
        this.kachelnVerwerfen(aenderung.i);
        this.beiFeldern();
      }
      this.karte.felder[aenderung.i] = aenderung.a;
      if (aenderung.v !== undefined) this.fuellung.set(aenderung.i, aenderung.v);
      else this.fuellung.delete(aenderung.i);
    }
    for (const tier of nachricht.tiere || []) {
      if (tier.weg) this.tiere.delete(tier.i);
      else {
        const alt = this.tiere.get(tier.i);
        // Die vorige Lage, damit ein getriebenes Schaf weich laeuft.
        if (alt) {
          tier.vx = alt.x;
          tier.vy = alt.y;
          tier.seit = performance.now();
        }
        this.tiere.set(tier.i, tier);
      }
    }
    for (const gebaeude of nachricht.gebaeude || []) {
      if (gebaeude.weg) this.gebaeude.delete(gebaeude.i);
      else this.gebaeude.set(gebaeude.i, gebaeude);
    }
    this.vorher = this.nachher;
    this.nachher = new Map(nachricht.einheiten.map((e) => [e.i, e]));
    this.empfangen = performance.now();

    const meine = nachricht.spieler.find((s) => s.id === this.ich);
    if (meine) {
      const { holz, nahrung, gold, stein, bev, raum } = meine;
      this.vorraete = { holz, nahrung, gold, stein, bev, raum };
      this.verbesserungen = meine.v || [];
      this.untaetige = meine.u || [];
    }

    // Eingesammelte Einheiten, die es nicht mehr gibt, fallen aus der Auswahl.
    for (const id of this.ausgewaehlt) {
      const tier = this.tiere.get(id);
      // Ein Schaf bleibt gewaehlt, solange es lebt und uns gehoert.
      if (tier ? (tier.g || tier.b !== this.ich) : !this.nachher.has(id)) this.ausgewaehlt.delete(id);
    }
    if (this.gewaehltesGebaeude && !this.gebaeude.has(this.gewaehltesGebaeude)) this.gewaehltesGebaeude = null;
  }

  // Die Mitte der Grundflaeche: der Server nennt das Ankerfeld, die Flaeche
  // reicht von x - groesse/2 (abgerundet) ueber groesse Felder.
  gebaeudeMitte(gebaeude) {
    const n = this.werte.gebaeude[gebaeude.art]?.groesse || 1;
    const versatz = -Math.floor(n / 2) + (n - 1) / 2;
    return { x: gebaeude.x + versatz, y: gebaeude.y + versatz, groesse: n };
  }

  // ---- Boden in Kacheln (darstellung AC-13) --------------------------------

  kachelnVerwerfen(index) {
    if (!this.kacheln) return;
    const g = this.karte.groesse;
    const x = index % g;
    const y = (index / g) | 0;
    const cx = Math.floor(((x - y) * HALB_B) / KACHEL);
    const cy = Math.floor(((x + y) * HALB_H) / KACHEL);
    for (const massstab of [0.5, 1, 2]) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) this.kacheln.delete(`${massstab}|${cx + dx}|${cy + dy}`);
      }
    }
  }

  bodenZeichnen(stift, zoom) {
    if (!this.kacheln) this.kacheln = new Map();
    const massstab = kachelMassstab(zoom);
    const breite = this.leinwand.clientWidth / zoom;
    const hoehe = this.leinwand.clientHeight / zoom;
    const cx0 = Math.floor(this.kamera.x / KACHEL);
    const cx1 = Math.floor((this.kamera.x + breite) / KACHEL);
    const cy0 = Math.max(0, Math.floor(this.kamera.y / KACHEL));
    const cy1 = Math.floor((this.kamera.y + hoehe) / KACHEL);
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const schluessel = `${massstab}|${cx}|${cy}`;
        let kachel = this.kacheln.get(schluessel);
        if (!kachel) {
          kachel = kachelZeichnen(this.karte, cx * KACHEL, cy * KACHEL, massstab, HALB_B, HALB_H, this.salz);
          this.kacheln.set(schluessel, kachel);
          // Hoechstens rund 150 Kacheln im Speicher; die aeltesten gehen zuerst.
          if (this.kacheln.size > 150) this.kacheln.delete(this.kacheln.keys().next().value);
        }
        const x = (cx * KACHEL - this.kamera.x) * zoom;
        const y = (cy * KACHEL - this.kamera.y) * zoom;
        // Eine Spur groesser, sonst schimmern die Kachelgrenzen.
        stift.drawImage(kachel, x, y, KACHEL * zoom + 1, KACHEL * zoom + 1);
      }
    }
  }

  // ---- Raute ------------------------------------------------------------

  /** Feld (auch gebrochen) zu Bildpunkt auf der Leinwand. */
  zuBild(wx, wy) {
    return {
      x: ((wx - wy) * HALB_B - this.kamera.x) * this.kamera.zoom,
      y: ((wx + wy) * HALB_H - this.kamera.y) * this.kamera.zoom,
    };
  }

  /** Bildpunkt auf der Leinwand zu Feld (gebrochen) - die Umkehrung von zuBild. */
  zuWelt(px, py) {
    const ix = px / this.kamera.zoom + this.kamera.x;
    const iy = py / this.kamera.zoom + this.kamera.y;
    return {
      x: (ix / HALB_B + iy / HALB_H) / 2,
      y: (iy / HALB_H - ix / HALB_B) / 2,
    };
  }

  blickAuf(x, y) {
    this.kamera.x = (x - y) * HALB_B - this.leinwand.clientWidth / 2 / this.kamera.zoom;
    this.kamera.y = (x + y) * HALB_H - this.leinwand.clientHeight / 2 / this.kamera.zoom;
  }

  groesseAnpassen() {
    const dichte = window.devicePixelRatio || 1;
    this.leinwand.width = this.leinwand.clientWidth * dichte;
    this.leinwand.height = this.leinwand.clientHeight * dichte;
    this.stift.setTransform(dichte, 0, 0, dichte, 0, 0);
  }

  binden() {
    window.addEventListener('resize', () => this.groesseAnpassen());

    this.leinwand.addEventListener('contextmenu', (e) => e.preventDefault());

    this.leinwand.addEventListener('pointerdown', (e) => {
      this.zeiger = { x: e.offsetX, y: e.offsetY };
      if (this.platzieren) {
        // Links setzt die Baustelle, rechts bricht ab.
        if (e.button === 0) this.platzierenKlick();
        else if (e.button === 2) this.platzierenBeenden();
        return;
      }
      if (e.button === 0) {
        this.zug = { vonX: e.offsetX, vonY: e.offsetY, bisX: e.offsetX, bisY: e.offsetY };
        this.leinwand.setPointerCapture(e.pointerId);
      } else if (e.button === 2) {
        this.befehlen(e.offsetX, e.offsetY);
      }
    });

    this.leinwand.addEventListener('pointermove', (e) => {
      this.zeiger = { x: e.offsetX, y: e.offsetY };
      if (!this.zug) return;
      this.zug.bisX = e.offsetX;
      this.zug.bisY = e.offsetY;
    });

    this.leinwand.addEventListener('pointerup', () => {
      if (!this.zug) return;
      this.auswaehlen(this.zug);
      this.zug = null;
    });

    this.leinwand.addEventListener('wheel', (e) => {
      e.preventDefault();
      // Der Punkt unter dem Zeiger bleibt stehen (bedienung AC-8).
      const ix = e.offsetX / this.kamera.zoom + this.kamera.x;
      const iy = e.offsetY / this.kamera.zoom + this.kamera.y;
      const faktor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      this.kamera.zoom = Math.min(2.5, Math.max(0.4, this.kamera.zoom * faktor));
      this.kamera.x = ix - e.offsetX / this.kamera.zoom;
      this.kamera.y = iy - e.offsetY / this.kamera.zoom;
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      // Tastenkuerzel zuerst (bedienung AC-27): was sie verbrauchen, sieht die Ansicht nicht.
      if (this.beiTaste(e)) return;
      // Esc hebt erst die Platzierung auf, dann die Auswahl (bedienung AC-15).
      if (e.key === 'Escape') {
        if (this.platzieren) this.platzierenBeenden();
        else {
          this.ausgewaehlt.clear();
          this.gewaehltesGebaeude = null;
          this.beiAuswahl();
        }
        return;
      }
      // Der naechste untaetige Dorfbewohner (bedienung AC-28).
      if (e.key === '.' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        this.naechsterUntaetiger();
        return;
      }
      this.tasten.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => this.tasten.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.tasten.clear());
  }

  // Ausgewaehlt wird im Bild, nicht auf der Karte: ein Rechteck auf dem
  // Bildschirm ist in der Raute kein Rechteck aus Feldern mehr.
  auswaehlen(rahmen) {
    this.auswahlTreffen(rahmen);
    this.beiAuswahl();
  }

  auswahlTreffen(rahmen) {
    const breite = Math.abs(rahmen.bisX - rahmen.vonX);
    const hoehe = Math.abs(rahmen.bisY - rahmen.vonY);
    this.ausgewaehlt.clear();
    this.gewaehltesGebaeude = null;

    const figur = this.figurenHoehe();
    if (breite < 5 && hoehe < 5) {
      // Ein Klick: die naechste eigene Einheit, gemessen an der Koerpermitte.
      let bestes = null;
      // Trifft die ganze Figur, vom Fuss bis zum Kopf.
      let besterAbstand = Math.max(KLICK_WEITE * this.kamera.zoom, figur * 0.75);
      for (const einheit of this.nachher.values()) {
        if (einheit.b !== this.ich) continue;
        const p = this.zuBild(einheit.x, einheit.y);
        const abstand = Math.hypot(p.x - rahmen.vonX, p.y - figur * KOERPER_MITTE - rahmen.vonY);
        if (abstand < besterAbstand) {
          besterAbstand = abstand;
          bestes = einheit;
        }
      }
      // Eigene lebende Schafe lassen sich auch waehlen (einheiten AC-22).
      for (const tier of this.tiere.values()) {
        if (tier.b !== this.ich || tier.g) continue;
        const p = this.zuBild(tier.x, tier.y);
        const abstand = Math.hypot(p.x - rahmen.vonX, p.y - figur * 0.3 - rahmen.vonY);
        if (abstand < besterAbstand) {
          besterAbstand = abstand;
          bestes = tier;
        }
      }
      if (bestes) {
        this.ausgewaehlt.add(bestes.i);
        return;
      }
      // Keine Einheit getroffen: vielleicht ein eigenes Gebaeude.
      const getroffen = this.gebaeudeUnter(rahmen.vonX, rahmen.vonY);
      if (getroffen) {
        this.gewaehltesGebaeude = getroffen.i;
        return;
      }
      return;
    }
    const links = Math.min(rahmen.vonX, rahmen.bisX);
    const rechts = Math.max(rahmen.vonX, rahmen.bisX);
    const oben = Math.min(rahmen.vonY, rahmen.bisY);
    const unten = Math.max(rahmen.vonY, rahmen.bisY);
    for (const einheit of this.nachher.values()) {
      if (einheit.b !== this.ich) continue;
      const p = this.zuBild(einheit.x, einheit.y);
      const mitte = p.y - figur * KOERPER_MITTE * 0.5;
      if (p.x >= links && p.x <= rechts && mitte >= oben && mitte <= unten) this.ausgewaehlt.add(einheit.i);
    }
    // Schafe nur, wenn der Rahmen keine Einheit trifft - wer Dorfbewohner
    // zusammenfasst, will die Schafe daneben nicht mitschicken.
    if (this.ausgewaehlt.size) return;
    for (const tier of this.tiere.values()) {
      if (tier.b !== this.ich || tier.g) continue;
      const p = this.zuBild(tier.x, tier.y);
      if (p.x >= links && p.x <= rechts && p.y >= oben && p.y <= unten + figur * 0.3) this.ausgewaehlt.add(tier.i);
    }
  }

  // ---- Bauplatz waehlen (bauen AC-4) ----------------------------------------

  platzierenBeginnen(art) {
    this.platzieren = { art };
    this.beiAuswahl();
  }

  platzierenBeenden() {
    this.platzieren = null;
    this.beiAuswahl();
  }

  // Wo die Baustelle unter dem Zeiger laege, und ob der Platz taugt - dieselbe
  // Regel wie auf dem Server (bauen AC-3), damit Gruen und Rot vor dem Klick
  // stimmen. Einheiten stehen nicht im Weg; sie gehen beiseite.
  platzLage() {
    if (!this.platzieren || !this.zeiger) return null;
    const art = this.platzieren.art;
    const n = this.werte.gebaeude[art]?.groesse || 1;
    const welt = this.zuWelt(this.zeiger.x, this.zeiger.y);
    const versatz = Math.floor(n / 2) - (n - 1) / 2;
    const x = Math.round(welt.x + versatz);
    const y = Math.round(welt.y + versatz);
    const x0 = x - Math.floor(n / 2);
    const y0 = y - Math.floor(n / 2);
    return { art, x, y, groesse: n, mitte: { x: x0 + (n - 1) / 2, y: y0 + (n - 1) / 2 }, taugt: this.platzTaugt(art, x, y) };
  }

  // Taugt der Platz fuer ein Gebaeude? Dieselbe Regel wie auf dem Server
  // (bauen AC-3). Auch die Browsertests fragen hier - so kann ihr Helfer nicht
  // von der Vorschau abweichen (Rueckschau Runde 35).
  platzTaugt(art, x, y, rand = 0) {
    const n = this.werte.gebaeude[art]?.groesse || 1;
    const x0 = x - Math.floor(n / 2) - rand;
    const y0 = y - Math.floor(n / 2) - rand;
    const m = n + 2 * rand;
    const g = this.karte.groesse;
    for (let fy = y0; fy < y0 + m; fy++) {
      for (let fx = x0; fx < x0 + m; fx++) {
        if (fx < 0 || fy < 0 || fx >= g || fy >= g || this.karte.felder[fy * g + fx] !== GRAS) return false;
      }
    }
    for (const tier of this.tiere.values()) {
      const tx = Math.round(tier.x);
      const ty = Math.round(tier.y);
      if (tx >= x0 && tx < x0 + m && ty >= y0 && ty < y0 + m) return false;
    }
    // Farmen liegen auf Gras, belegen ihren Platz aber trotzdem.
    for (const gebaeude of this.gebaeude.values()) {
      const k = this.werte.gebaeude[gebaeude.art]?.groesse || 1;
      const gx0 = gebaeude.x - Math.floor(k / 2);
      const gy0 = gebaeude.y - Math.floor(k / 2);
      if (gx0 < x0 + m && gx0 + k > x0 && gy0 < y0 + m && gy0 + k > y0) return false;
    }
    return true;
  }

  platzierenKlick() {
    const lage = this.platzLage();
    // Auf Rot baut nichts - und die Absage sagt es noch einmal in Worten.
    if (!lage) return;
    if (!lage.taugt) {
      this.melden('Hier ist kein Platz.');
      return;
    }
    this.bauenSenden([...this.ausgewaehlt], lage.art, { x: lage.x, y: lage.y });
    this.platzierenBeenden();
  }

  platzVorschau(e) {
    const lage = this.platzLage();
    if (!lage) return;
    const stift = this.stift;
    const p = this.zuBild(lage.mitte.x, lage.mitte.y);
    const spieler = this.spieler.get(this.ich);
    raute(stift, p.x, p.y, e * lage.groesse, (e * lage.groesse) / 2);
    stift.fillStyle = lage.taugt ? 'rgba(80, 220, 110, 0.35)' : 'rgba(235, 70, 60, 0.4)';
    stift.fill();
    stift.strokeStyle = lage.taugt ? '#5fe07a' : '#ff5a4a';
    stift.lineWidth = 2;
    stift.stroke();
    stift.globalAlpha = 0.55;
    gebaeudeBildZeichnen(stift, lage.art, p.x, p.y, e, spieler ? spieler.farbe : '#888888', lage.groesse);
    stift.globalAlpha = 1;
  }

  befehlen(px, py) {
    const ziel = this.zuWelt(px, py);
    // Ein eigenes Gebaeude gewaehlt: der Rechtsklick setzt seinen Sammelpunkt (bauen AC-13).
    if (this.gewaehltesGebaeude) {
      this.sammelpunktSenden(this.gewaehltesGebaeude, { x: Math.round(ziel.x), y: Math.round(ziel.y) });
      return;
    }
    if (!this.ausgewaehlt.size) return;
    this.befehlSenden([...this.ausgewaehlt], {
      x: Math.round(ziel.x),
      y: Math.round(ziel.y),
    });
  }

  schieben(dauer) {
    const tempo = (600 / this.kamera.zoom) * (dauer / 1000);
    if (this.tasten.has('w') || this.tasten.has('arrowup')) this.kamera.y -= tempo;
    if (this.tasten.has('s') || this.tasten.has('arrowdown')) this.kamera.y += tempo;
    if (this.tasten.has('a') || this.tasten.has('arrowleft')) this.kamera.x -= tempo;
    if (this.tasten.has('d') || this.tasten.has('arrowright')) this.kamera.x += tempo;

    // Die Karte als Raute: links und rechts je g Halbbreiten, unten 2g Halbhoehen.
    const g = this.karte.groesse;
    const breite = this.leinwand.clientWidth / this.kamera.zoom;
    const hoehe = this.leinwand.clientHeight / this.kamera.zoom;
    this.kamera.x = Math.max(-g * HALB_B - breite / 2, Math.min(g * HALB_B - breite / 2, this.kamera.x));
    this.kamera.y = Math.max(-hoehe / 2, Math.min(2 * g * HALB_H - hoehe / 2, this.kamera.y));
  }

  bild(jetzt = performance.now()) {
    if (!this.karte) return;
    const dauer = Math.min(50, jetzt - (this.letztesBild || jetzt));
    this.letztesBild = jetzt;
    this.schieben(dauer);
    this.zeichnen(jetzt);
    this.nachBild(jetzt);
    requestAnimationFrame((t) => this.bild(t));
  }

  // Der Server schickt zehn Bilder je Sekunde, der Schirm zeigt sechzig.
  // Dazwischen wird geschaetzt, sonst ruckelt jede Bewegung.
  anteil(jetzt) {
    return Math.min(1, (jetzt - this.empfangen) / this.taktdauer);
  }

  figurenHoehe() {
    return figurHoeheBei(this.kamera.zoom);
  }

  /** Welche Felder das Bild beruehrt - aus den vier Ecken der Leinwand. */
  sichtbareFelder() {
    const breite = this.leinwand.clientWidth;
    const hoehe = this.leinwand.clientHeight;
    const ecken = [this.zuWelt(0, 0), this.zuWelt(breite, 0), this.zuWelt(0, hoehe), this.zuWelt(breite, hoehe)];
    const g = this.karte.groesse;
    // Zwei Felder Rand, damit hohe Baeume am unteren Rand nicht abgeschnitten werden.
    return {
      vonX: Math.max(0, Math.floor(Math.min(...ecken.map((e) => e.x))) - 1),
      bisX: Math.min(g - 1, Math.ceil(Math.max(...ecken.map((e) => e.x))) + 2),
      vonY: Math.max(0, Math.floor(Math.min(...ecken.map((e) => e.y))) - 1),
      bisY: Math.min(g - 1, Math.ceil(Math.max(...ecken.map((e) => e.y))) + 2),
    };
  }

  zeichnen(jetzt) {
    const stift = this.stift;
    const zoom = this.kamera.zoom;
    stift.fillStyle = '#0f1216';
    stift.fillRect(0, 0, this.leinwand.clientWidth, this.leinwand.clientHeight);

    const g = this.karte.groesse;
    const { vonX, bisX, vonY, bisY } = this.sichtbareFelder();

    // 1. Boden: eine durchgehende Textur in vorgezeichneten Kacheln (AC-13).
    this.bodenZeichnen(stift, zoom);
    // Grasbueschel und Blumen (darstellung AC-12) - vor dem Wasser, damit das
    // Ufer sie ueberdeckt, und nur auf freiem Gras.
    const felder = this.karte.felder;
    // Erst ab rund Zoom 1,2: kleiner wirken Halme und Blumen wie Rauschen.
    if (HALB_B * zoom >= 26) {
      const gras = grasBeginnen();
      for (let y = vonY; y <= bisY; y++) {
        for (let x = vonX; x <= bisX; x++) {
          const index = y * g + x;
          if (felder[index] !== GRAS) continue;
          const p = this.zuBild(x, y);
          grasSammeln(gras, p.x, p.y, HALB_B * zoom, index, this.salz);
        }
      }
      grasZeichnen(stift, gras, HALB_B * zoom);
    }
    // Das Wasser liegt mit seinem Ufer in der Bodentextur (boden.js); darauf
    // nur ein leises Glitzern.
    for (let y = vonY; y <= bisY; y++) {
      for (let x = vonX; x <= bisX; x++) {
        if (felder[y * g + x] !== WASSER) continue;
        const p = this.zuBild(x, y);
        wellenZeichnen(stift, p.x, p.y, HALB_B * zoom, y * g + x, this.salz);
      }
    }

    // Flache Gebaeude (Farmen) gehoeren zum Boden: unter Figuren und Baeume.
    for (const gebaeude of this.gebaeude.values()) {
      if (!this.werte.gebaeude[gebaeude.art]?.begehbar) continue;
      const mitte = this.gebaeudeMitte(gebaeude);
      this.gebaeudeBild(gebaeude, this.zuBild(mitte.x, mitte.y), HALB_B * zoom);
    }

    // 2. Alles, was steht, nach Tiefe: was weiter unten im Bild steht, verdeckt,
    //    was dahinter steht (darstellung AC-7).
    const stehend = [];
    for (let y = vonY; y <= bisY; y++) {
      for (let x = vonX; x <= bisX; x++) {
        const index = y * g + x;
        const art = this.karte.felder[index];
        if (DINGE.includes(art)) stehend.push({ tiefe: x + y, x, y, art: 'vorrat', feld: art, index });
      }
    }
    for (const gebaeude of this.gebaeude.values()) {
      // Farmen liegen flach am Boden und sind schon gezeichnet.
      if (this.werte.gebaeude[gebaeude.art]?.begehbar) continue;
      const mitte = this.gebaeudeMitte(gebaeude);
      stehend.push({ tiefe: mitte.x + mitte.y, x: mitte.x, y: mitte.y, art: 'gebaeude', gebaeude });
    }
    for (const tier of this.tiere.values()) {
      const t = tier.seit === undefined ? 1 : Math.min(1, (jetzt - tier.seit) / this.taktdauer);
      const x = tier.vx === undefined ? tier.x : tier.vx + (tier.x - tier.vx) * t;
      const y = tier.vy === undefined ? tier.y : tier.vy + (tier.y - tier.vy) * t;
      stehend.push({ tiefe: x + y, x, y, art: 'tier', tier });
    }
    const anteil = this.anteil(jetzt);
    for (const einheit of this.nachher.values()) {
      const alt = this.vorher.get(einheit.i);
      const x = alt ? alt.x + (einheit.x - alt.x) * anteil : einheit.x;
      const y = alt ? alt.y + (einheit.y - alt.y) * anteil : einheit.y;
      stehend.push({ tiefe: x + y, x, y, art: 'einheit', einheit, alt });
    }
    // Gleiche Tiefe: der Vorrat zuerst, sonst verschwindet ein Sammler im Baum,
    // vor dem er steht.
    const rang = { vorrat: 0, gebaeude: 1, tier: 2, einheit: 3 };
    stehend.sort((a, b) => a.tiefe - b.tiefe || rang[a.art] - rang[b.art] || a.x - b.x);

    const e = HALB_B * zoom;
    this.verdeckte = [];
    // Lebensbalken sammeln die Zeichnungen unterwegs; gemalt werden sie danach,
    // ueber allem, damit kein Baum sie verdeckt (darstellung AC-8).
    this.lebensbalken = [];
    for (const ding of stehend) {
      const p = this.zuBild(ding.x, ding.y);
      if (ding.art === 'vorrat') {
        // Aus dem Zwischenspeicher: direkt gezeichnet kostete es bei Zoom 1 doppelt so viel (Runde 29).
        dingBildZeichnen(stift, ding.feld, p.x, p.y, e, ding.index, (this.fuellung.get(ding.index) || 4) / 4);
      } else if (ding.art === 'gebaeude') {
        this.gebaeudeBild(ding.gebaeude, p, e);
      } else if (ding.art === 'tier') {
        const spieler = this.spieler.get(ding.tier.b);
        if (this.ausgewaehlt.has(ding.tier.i)) {
          const r = Math.max(9, HALB_B * 0.9 * zoom);
          stift.strokeStyle = '#ffffff';
          stift.lineWidth = 2;
          stift.beginPath();
          stift.ellipse(p.x, p.y, r * 0.55, r * 0.26, 0, 0, Math.PI * 2);
          stift.stroke();
        }
        const laeuft = ding.tier.vx !== undefined && (ding.tier.vx !== ding.tier.x || ding.tier.vy !== ding.tier.y);
        figurBildZeichnen(stift, ding.tier.art, p.x, p.y, Math.max(9, HALB_B * 0.9 * zoom), spieler ? spieler.farbe : '#888888', {
          blick: ding.tier.i % 2 ? 1 : -1,
          // Geschlachtet: ein Kadaver, der mit der Nahrung kleiner wird (einheiten AC-17).
          liegt: Boolean(ding.tier.g),
          rest: (ding.tier.n ?? 100) / 100,
          schritt: laeuft ? jetztPhase(ding.tier.i) : 0,
        });
      } else {
        this.einheitZeichnen(ding.einheit, ding.alt, p);
      }
    }
    this.reihenfolge = stehend.map((d) => ({ art: d.art, tiefe: d.tiefe, id: d.einheit?.i }));
    // Verdeckte Einheiten als Umriss in Spielerfarbe, ueber allem (bedienung AC-30).
    this.umrisse = this.verdeckte.map((v) => v.einheit.i);
    for (const { einheit, punkt, hoehe, laeuft } of this.verdeckte) {
      const spieler = this.spieler.get(einheit.b);
      figurBildZeichnen(stift, this.arten[einheit.k] || 'dorfbewohner', punkt.x, punkt.y, hoehe, spieler ? spieler.farbe : '#888888', {
        blick: this.blicke.get(einheit.i) || 1,
        ladung: einheit.l > 0 ? einheit.a : null,
        schritt: laeuft ? jetztPhase(einheit.i) : 0,
        arbeit: einheit.w && !laeuft ? jetztPhase(einheit.i) : 0,
      }, true);
    }
    for (const balken of this.lebensbalken) this.lebensbalkenZeichnen(balken);

    for (const spieler of this.spieler.values()) this.namenZeichnen(spieler);
    if (this.platzieren) this.platzVorschau(e);
    this.sammelpunktZeichnen(e);
    if (this.zug) this.rahmenZeichnen();
  }

  /**
   * Waehlt den naechsten untaetigen Dorfbewohner und holt ihn ins Bild -
   * reihum, damit zweimal gedrueckt auch zwei verschiedene zeigt
   * (bedienung AC-28).
   */
  naechsterUntaetiger() {
    const liste = this.untaetige.filter((id) => this.nachher.has(id));
    if (!liste.length) return null;
    const bisher = liste.indexOf(this.letzterUntaetiger);
    const id = liste[(bisher + 1) % liste.length];
    this.letzterUntaetiger = id;
    const einheit = this.nachher.get(id);
    if (this.platzieren) this.platzierenBeenden();
    this.gewaehltesGebaeude = null;
    this.ausgewaehlt.clear();
    this.ausgewaehlt.add(id);
    this.blickAuf(einheit.x, einheit.y);
    this.beiAuswahl();
    return id;
  }

  /**
   * Das eigene Gebaeude unter einem Bildpunkt - von mehreren das vorderste, das
   * im Bild auch oben liegt (Runde 53: vorher gewann das zuerst gebaute, und ein
   * Klick auf die Kaserne waehlte das Haus dahinter).
   */
  gebaeudeUnter(px, py) {
    const e = HALB_B * this.kamera.zoom;
    let bestes = null;
    let tiefe = -Infinity;
    for (const gebaeude of this.gebaeude.values()) {
      if (gebaeude.b !== this.ich) continue;
      const mitte = this.gebaeudeMitte(gebaeude);
      const p = this.zuBild(mitte.x, mitte.y);
      if (!gebaeudeGetroffen(gebaeude.art, px - p.x, py - p.y, e, mitte.groesse)) continue;
      if (mitte.x + mitte.y > tiefe) {
        tiefe = mitte.x + mitte.y;
        bestes = gebaeude;
      }
    }
    return bestes;
  }

  /**
   * Steht die Einheit hinter einem Gebaeude, das sie verdeckt? Nur Gebaeude,
   * die tiefer im Bild stehen (groesseres x + y), liegen ueber ihr; flache
   * (Farmen) verdecken nichts (bedienung AC-30).
   */
  hinterGebaeude(einheit, punkt) {
    const e = HALB_B * this.kamera.zoom;
    const tiefe = einheit.x + einheit.y;
    for (const gebaeude of this.gebaeude.values()) {
      if (this.werte.gebaeude[gebaeude.art]?.begehbar) continue;
      const mitte = this.gebaeudeMitte(gebaeude);
      if (mitte.x + mitte.y <= tiefe) continue;
      const p = this.zuBild(mitte.x, mitte.y);
      // Etwas ueber dem Fusspunkt gemessen: dort steht der Koerper.
      if (gebaeudeGetroffen(gebaeude.art, punkt.x - p.x, punkt.y - this.figurenHoehe() * 0.5 - p.y, e, mitte.groesse)) return true;
    }
    return false;
  }

  /** Das volle Leben einer Einheit, mit den Verbesserungen ihres Besitzers (bauen AC-21). */
  lebenVoll(einheit) {
    const art = this.arten[einheit.k] || 'dorfbewohner';
    let voll = this.werte.einheiten[art]?.leben ?? 0;
    if (einheit.b === this.ich) {
      for (const v of this.verbesserungen) voll += this.werte.verbesserungen?.[v]?.wirkung?.[art]?.leben || 0;
    }
    return voll;
  }

  // Ein Lebensbalken (darstellung AC-8): dunkler Grund, darauf der Anteil in
  // Gruen, unter einem Drittel in Rot - schmal, damit er nichts zudeckt.
  lebensbalkenZeichnen({ x, y, breite, anteil }) {
    const stift = this.stift;
    const hoch = Math.min(5, Math.max(3, Math.round(breite / 9)));
    const links = Math.round(x - breite / 2);
    const oben = Math.round(y - hoch);
    stift.fillStyle = 'rgba(16, 18, 20, 0.8)';
    stift.fillRect(links - 1, oben - 1, breite + 2, hoch + 2);
    stift.fillStyle = anteil < 1 / 3 ? '#c8463c' : '#5daa45';
    stift.fillRect(links, oben, Math.max(1, Math.round(breite * Math.max(0, Math.min(1, anteil)))), hoch);
  }

  // Der Sammelpunkt des gewaehlten Gebaeudes: eine Fahne in Spielerfarbe und
  // eine gestrichelte Linie dorthin.
  sammelpunktZeichnen(e) {
    const gebaeude = this.gewaehltesGebaeude && this.gebaeude.get(this.gewaehltesGebaeude);
    if (!gebaeude?.p) return;
    const stift = this.stift;
    const mitte = this.gebaeudeMitte(gebaeude);
    const von = this.zuBild(mitte.x, mitte.y);
    const bis = this.zuBild(gebaeude.p.x, gebaeude.p.y);
    const farbe = this.spieler.get(gebaeude.b)?.farbe || '#888888';
    stift.save();
    stift.setLineDash([6, 5]);
    stift.strokeStyle = 'rgba(255,255,255,0.7)';
    stift.lineWidth = 1.5;
    stift.beginPath();
    stift.moveTo(von.x, von.y);
    stift.lineTo(bis.x, bis.y);
    stift.stroke();
    stift.setLineDash([]);
    const h = e * 1.3;
    stift.strokeStyle = '#3a2c1f';
    stift.lineWidth = Math.max(1.5, e * 0.08);
    stift.beginPath();
    stift.moveTo(bis.x, bis.y);
    stift.lineTo(bis.x, bis.y - h);
    stift.stroke();
    stift.fillStyle = farbe;
    stift.strokeStyle = 'rgba(15,18,22,0.85)';
    stift.lineWidth = 1;
    stift.beginPath();
    stift.moveTo(bis.x, bis.y - h);
    stift.quadraticCurveTo(bis.x + e * 0.4, bis.y - h - e * 0.05, bis.x + e * 0.75, bis.y - h + e * 0.2);
    stift.quadraticCurveTo(bis.x + e * 0.4, bis.y - h + e * 0.32, bis.x, bis.y - h + e * 0.45);
    stift.closePath();
    stift.fill();
    stift.stroke();
    stift.fillStyle = 'rgba(0,0,0,0.3)';
    stift.beginPath();
    stift.ellipse(bis.x, bis.y, e * 0.25, e * 0.1, 0, 0, Math.PI * 2);
    stift.fill();
    stift.restore();
  }

  gebaeudeBild(gebaeude, p, e) {
    const spieler = this.spieler.get(gebaeude.b);
    const stift = this.stift;
    const { groesse } = this.gebaeudeMitte(gebaeude);
    // Balken, wenn ausgewaehlt oder beschaedigt - eine Baustelle hat ihren
    // Fortschritt in der Auswahlleiste und zaehlt hier nicht als beschaedigt.
    const lebenVoll = this.werte.gebaeude[gebaeude.art]?.leben;
    const fertig = (gebaeude.u ?? 1) >= 1;
    const beschaedigt = fertig && lebenVoll && gebaeude.h < lebenVoll;
    if (lebenVoll && (this.gewaehltesGebaeude === gebaeude.i || beschaedigt)) {
      const zeichnung = GEBAEUDE[gebaeude.art];
      const m = zeichnung ? (e * groesse * 0.95) / zeichnung.halbeBreite : e;
      // Knapp ueber dem Dach - die Trefferhoehe reicht bis zur Fahnenspitze, drei
      // Viertel davon sind der First (Runde 42: ganz oben deckte er den Namen zu).
      const oben = zeichnung?.flach ? e * groesse * 0.6 : (zeichnung?.trefferOben ?? 3) * m * 0.75;
      this.lebensbalken.push({
        art: 'gebaeude', i: gebaeude.i, x: p.x, y: p.y - oben - 4, breite: Math.round(Math.min(e * groesse * 0.6, 140)), anteil: (gebaeude.h ?? lebenVoll) / lebenVoll,
      });
    }
    if (this.gewaehltesGebaeude === gebaeude.i) {
      // Ausgewaehlt: ein heller Rand um die Grundflaeche, wie die Ellipse bei Figuren.
      raute(stift, p.x, p.y, e * groesse, e * groesse / 2);
      stift.strokeStyle = '#ffffff';
      stift.lineWidth = 2;
      stift.stroke();
    }
    const voll = this.werte.gebaeude[gebaeude.art]?.nahrung;
    gebaeudeBildZeichnen(stift, gebaeude.art, p.x, p.y, e, spieler ? spieler.farbe : '#888888', groesse, gebaeude.u ?? 1, voll ? (gebaeude.n ?? voll) / voll : 1);
  }

  namenZeichnen(spieler) {
    if (this.kamera.zoom <= 0.6) return;
    const stift = this.stift;
    const p = this.zuBild(spieler.basis.x, spieler.basis.y);
    // Ueber der Fahne des Dorfzentrums.
    const oben = p.y - HALB_B * 7.6 * this.kamera.zoom - 4;
    stift.font = '600 12px system-ui, sans-serif';
    stift.textAlign = 'center';
    stift.lineWidth = 3;
    stift.strokeStyle = '#0f1216';
    stift.strokeText(spieler.name, p.x, oben);
    stift.fillStyle = '#e6e9ee';
    stift.fillText(spieler.name, p.x, oben);
  }

  einheitZeichnen(einheit, alt, punkt) {
    const hoehe = this.figurenHoehe();
    const spieler = this.spieler.get(einheit.b);
    const stift = this.stift;

    // Blickrichtung aus der Bewegung im Bild; wer steht, schaut weiter dorthin,
    // wohin er zuletzt ging.
    const dx = alt ? (einheit.x - alt.x) - (einheit.y - alt.y) : 0;
    const laeuft = alt && Math.hypot(einheit.x - alt.x, einheit.y - alt.y) > 0.001;
    if (Math.abs(dx) > 0.001) this.blicke.set(einheit.i, dx < 0 ? -1 : 1);

    if (this.ausgewaehlt.has(einheit.i)) {
      // Die Auswahl liegt als Ellipse am Boden, unter den Fuessen.
      stift.strokeStyle = '#ffffff';
      stift.lineWidth = 2;
      stift.beginPath();
      stift.ellipse(punkt.x, punkt.y, hoehe * 0.42, hoehe * 0.2, 0, 0, Math.PI * 2);
      stift.stroke();
      // Darueber, ueber dem Kopf, das Leben.
      const voll = this.lebenVoll(einheit);
      if (voll) {
        this.lebensbalken.push({
          art: 'einheit', i: einheit.i, x: punkt.x, y: punkt.y - hoehe * (FIGUREN[this.arten[einheit.k]]?.oben ?? 1) - 5, breite: Math.max(16, Math.round(hoehe * 0.9)), anteil: (einheit.h ?? voll) / voll,
        });
      }
    }

    // Ein Dorfbewohner mit Ladung traegt sie sichtbar: Holzbuendel oder
    // Beerenkorb auf dem Ruecken (bedienung AC-16, darstellung AC-6).
    figurBildZeichnen(stift, this.arten[einheit.k] || 'dorfbewohner', punkt.x, punkt.y, hoehe, spieler ? spieler.farbe : '#888888', {
      blick: this.blicke.get(einheit.i) || 1,
      ladung: einheit.l > 0 ? einheit.a : null,
      schritt: laeuft ? jetztPhase(einheit.i) : 0,
      // Wer arbeitet, bewegt sich dabei (bedienung AC-31).
      arbeit: einheit.w && !laeuft ? jetztPhase(einheit.i) : 0,
    });
    // Steht jemand hinter einem Gebaeude, kommt er danach als Umriss darueber.
    if (this.hinterGebaeude(einheit, punkt)) this.verdeckte.push({ einheit, punkt, hoehe, laeuft });
  }

  rahmenZeichnen() {
    const stift = this.stift;
    const x = Math.min(this.zug.vonX, this.zug.bisX);
    const y = Math.min(this.zug.vonY, this.zug.bisY);
    const breite = Math.abs(this.zug.bisX - this.zug.vonX);
    const hoehe = Math.abs(this.zug.bisY - this.zug.vonY);
    stift.strokeStyle = '#ffffffaa';
    stift.lineWidth = 1;
    stift.strokeRect(x + 0.5, y + 0.5, breite, hoehe);
    stift.fillStyle = '#ffffff14';
    stift.fillRect(x, y, breite, hoehe);
  }
}
