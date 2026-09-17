// Zeichnet die Welt und nimmt Maus und Tastatur entgegen. Rechnen tut hier
// nichts - der Server schickt den Zustand, wir malen ihn.
//
// Isometrisch (→ specs/10-strategie/darstellung.md AC-1): ein Feld ist eine
// Raute, doppelt so breit wie hoch. Die Welt rechnet weiter in Feldern
// (x nach rechts unten, y nach links unten); nur zuBild und zuWelt kennen die
// Raute. Die Kamera liegt in Bildpunkten der Raute bei Vergroesserung 1.
import { figurZeichnen } from './figuren.js';
import {
  DINGE, GRAS, WALD, WASSER, bodenFarbe, dingZeichnen, gewaesserZeichnen, raute, wellenZeichnen,
} from './gelaende.js';

const HALB_B = 22; // halbe Rautenbreite in Bildpunkten bei Vergroesserung 1
const HALB_H = 11; // halbe Rautenhoehe
// Eine Figur ist etwas hoeher als eine Raute breit ist; ihr Koerper liegt ueber
// dem Fusspunkt, deshalb zielt ein Klick auf die Mitte des Koerpers.
const FIGUR_HOEHE = 1.3; // in halben Rautenbreiten * 2
const KOERPER_MITTE = 0.6; // Anteil der Figurenhoehe ueber dem Fusspunkt, auf den ein Klick zielt
const KLICK_WEITE = 16; // Bildpunkte bei Vergroesserung 1

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
    this.salz = Number.isInteger(nachricht.startwert) ? nachricht.startwert % 65521 : 0;
    this.ich = ichId;
    this.spieler = new Map(nachricht.spieler.map((s) => [s.id, s]));
    // Tiere kommen einmal im Aufbau und danach nur bei Aenderung.
    this.tiere = new Map((nachricht.tiere || []).map((t) => [t.i, t]));

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
      this.karte.felder[aenderung.i] = aenderung.a;
      if (aenderung.v !== undefined) this.fuellung.set(aenderung.i, aenderung.v);
      else this.fuellung.delete(aenderung.i);
    }
    for (const tier of nachricht.tiere || []) {
      if (tier.weg) this.tiere.delete(tier.i);
      else this.tiere.set(tier.i, tier);
    }
    this.vorher = this.nachher;
    this.nachher = new Map(nachricht.einheiten.map((e) => [e.i, e]));
    this.empfangen = performance.now();

    const meine = nachricht.spieler.find((s) => s.id === this.ich);
    if (meine) {
      const { holz, nahrung, gold, stein, bev, raum } = meine;
      this.vorraete = { holz, nahrung, gold, stein, bev, raum };
    }

    // Eingesammelte Einheiten, die es nicht mehr gibt, fallen aus der Auswahl.
    for (const id of this.ausgewaehlt) {
      if (!this.nachher.has(id)) this.ausgewaehlt.delete(id);
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
      if (e.button === 0) {
        this.zug = { vonX: e.offsetX, vonY: e.offsetY, bisX: e.offsetX, bisY: e.offsetY };
        this.leinwand.setPointerCapture(e.pointerId);
      } else if (e.button === 2) {
        this.befehlen(e.offsetX, e.offsetY);
      }
    });

    this.leinwand.addEventListener('pointermove', (e) => {
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

    window.addEventListener('keydown', (e) => this.tasten.add(e.key.toLowerCase()));
    window.addEventListener('keyup', (e) => this.tasten.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.tasten.clear());
  }

  // Ausgewaehlt wird im Bild, nicht auf der Karte: ein Rechteck auf dem
  // Bildschirm ist in der Raute kein Rechteck aus Feldern mehr.
  auswaehlen(rahmen) {
    const breite = Math.abs(rahmen.bisX - rahmen.vonX);
    const hoehe = Math.abs(rahmen.bisY - rahmen.vonY);
    this.ausgewaehlt.clear();

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
      if (bestes) this.ausgewaehlt.add(bestes.i);
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
  }

  befehlen(px, py) {
    if (!this.ausgewaehlt.size) return;
    const ziel = this.zuWelt(px, py);
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
    requestAnimationFrame((t) => this.bild(t));
  }

  // Der Server schickt zehn Bilder je Sekunde, der Schirm zeigt sechzig.
  // Dazwischen wird geschaetzt, sonst ruckelt jede Bewegung.
  anteil(jetzt) {
    return Math.min(1, (jetzt - this.empfangen) / this.taktdauer);
  }

  figurenHoehe() {
    return Math.max(12, HALB_B * FIGUR_HOEHE * this.kamera.zoom);
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
    const hb = HALB_B * zoom + 0.6; // eine Spur groesser, sonst schimmern Fugen
    const hh = HALB_H * zoom + 0.3;

    // 1. Boden: jede Raute einzeln gefuellt. In Runde 13 im Browserlauf
    //    gemessen, weit herausgezoomt je Bild: einzeln 20 ms, vorgezeichnete
    //    Kacheln kopiert 30 ms, ein gemeinsamer Pfad 160 ms. Einzeln gewinnt.
    for (let y = vonY; y <= bisY; y++) {
      for (let x = vonX; x <= bisX; x++) {
        const index = y * g + x;
        const feld = this.karte.felder[index];
        // Unter dem Wasser liegt Gras; das Wasser selbst kommt gleich als weiche Flaeche.
        const boden = feld === WALD ? WALD : GRAS;
        const p = this.zuBild(x, y);
        raute(stift, p.x, p.y, hb, hh);
        stift.fillStyle = bodenFarbe(boden, index, this.salz);
        stift.fill();
      }
    }
    // Wasser als weiche Flaeche mit Sandufer ueber dem Gras, dann Wellen.
    const felder = this.karte.felder;
    const wasser = [];
    for (let y = vonY; y <= bisY; y++) {
      for (let x = vonX; x <= bisX; x++) {
        if (felder[y * g + x] === WASSER) wasser.push({ ...this.zuBild(x, y), index: y * g + x });
      }
    }
    gewaesserZeichnen(stift, wasser, HALB_B * zoom);
    for (const p of wasser) wellenZeichnen(stift, p.x, p.y, HALB_B * zoom, p.index, this.salz);
    for (const spieler of this.spieler.values()) this.basisZeichnen(spieler);

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
    for (const tier of this.tiere.values()) stehend.push({ tiefe: tier.x + tier.y, x: tier.x, y: tier.y, art: 'tier', tier });
    const anteil = this.anteil(jetzt);
    for (const einheit of this.nachher.values()) {
      const alt = this.vorher.get(einheit.i);
      const x = alt ? alt.x + (einheit.x - alt.x) * anteil : einheit.x;
      const y = alt ? alt.y + (einheit.y - alt.y) * anteil : einheit.y;
      stehend.push({ tiefe: x + y, x, y, art: 'einheit', einheit, alt });
    }
    // Gleiche Tiefe: der Vorrat zuerst, sonst verschwindet ein Sammler im Baum,
    // vor dem er steht.
    const rang = { vorrat: 0, tier: 1, einheit: 2 };
    stehend.sort((a, b) => a.tiefe - b.tiefe || rang[a.art] - rang[b.art] || a.x - b.x);

    const e = HALB_B * zoom;
    for (const ding of stehend) {
      const p = this.zuBild(ding.x, ding.y);
      if (ding.art === 'vorrat') {
        dingZeichnen(stift, ding.feld, p.x, p.y, e, ding.index, (this.fuellung.get(ding.index) || 4) / 4);
      } else if (ding.art === 'tier') {
        const spieler = this.spieler.get(ding.tier.b);
        figurZeichnen(stift, ding.tier.art, p.x, p.y, Math.max(9, HALB_B * 0.9 * zoom), spieler ? spieler.farbe : '#888888', {
          blick: ding.tier.i % 2 ? 1 : -1,
        });
      } else {
        this.einheitZeichnen(ding.einheit, ding.alt, p);
      }
    }
    this.reihenfolge = stehend.map((d) => ({ art: d.art, tiefe: d.tiefe }));

    for (const spieler of this.spieler.values()) this.namenZeichnen(spieler);
    if (this.zug) this.rahmenZeichnen();
  }

  // Der Platz der Basis: eine Raute aus 3 x 3 Feldern in Spielerfarbe. Das
  // Dorfzentrum als Gebaeude kommt mit Schritt A6.
  basisZeichnen(spieler) {
    const stift = this.stift;
    const p = this.zuBild(spieler.basis.x, spieler.basis.y);
    const zoom = this.kamera.zoom;
    raute(stift, p.x, p.y, HALB_B * 1.5 * zoom, HALB_H * 1.5 * zoom);
    stift.fillStyle = spieler.farbe;
    stift.globalAlpha = 0.25;
    stift.fill();
    stift.globalAlpha = 1;
    stift.strokeStyle = spieler.farbe;
    stift.lineWidth = 2;
    stift.stroke();
  }

  namenZeichnen(spieler) {
    if (this.kamera.zoom <= 0.6) return;
    const stift = this.stift;
    const p = this.zuBild(spieler.basis.x, spieler.basis.y);
    const oben = p.y - HALB_H * 1.5 * this.kamera.zoom - 10;
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
    }

    // Ein Dorfbewohner mit Ladung traegt sie sichtbar: Holzbuendel oder
    // Beerenkorb auf dem Ruecken (bedienung AC-16, darstellung AC-6).
    figurZeichnen(stift, 'dorfbewohner', punkt.x, punkt.y, hoehe, spieler ? spieler.farbe : '#888888', {
      blick: this.blicke.get(einheit.i) || 1,
      ladung: einheit.l > 0 ? einheit.a : null,
      schritt: laeuft ? jetztPhase(einheit.i) : 0,
    });
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
