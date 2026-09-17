// Zeichnet die Welt und nimmt Maus und Tastatur entgegen. Rechnen tut hier
// nichts - der Server schickt den Zustand, wir malen ihn.
import { figurZeichnen } from './figuren.js';

const FELD = 22; // Bildpunkte je Feld bei Vergroesserung 1
// Eine Figur ist etwas hoeher als ein Feld; ihr Koerper liegt ueber dem
// Fusspunkt, deshalb zielt ein Klick auf die Mitte des Koerpers.
const FIGUR_HOEHE = 1.2; // in Feldern
const KOERPER_MITTE = 0.5; // in Feldern ueber dem Fusspunkt
// Gras, Wald, Beere, Wasser, Gold, Stein - Formen dafuer kommen mit darstellung AC-3.
const FARBEN = ['#2f4636', '#1f3a24', '#4a3a52', '#1b2f4a', '#8a7a2e', '#5d636b'];
const GRAS = 0;

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
    this.spieler = new Map();
    this.ich = null;
    this.taktdauer = 100;

    this.vorher = new Map();
    this.nachher = new Map();
    this.empfangen = 0;
    this.ausgewaehlt = new Set();
    this.blicke = new Map(); // Einheit → -1 links, 1 rechts
    this.tiere = new Map();
    this.vorraete = { holz: 0, nahrung: 0 };

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
    this.taktdauer = 1000 / nachricht.takte;
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
    }
    for (const tier of nachricht.tiere || []) {
      if (tier.weg) this.tiere.delete(tier.i);
      else this.tiere.set(tier.i, tier);
    }
    this.vorher = this.nachher;
    this.nachher = new Map(nachricht.einheiten.map((e) => [e.i, e]));
    this.empfangen = performance.now();

    const meine = nachricht.spieler.find((s) => s.id === this.ich);
    if (meine) this.vorraete = { holz: meine.holz, nahrung: meine.nahrung };

    // Eingesammelte Einheiten, die es nicht mehr gibt, fallen aus der Auswahl.
    for (const id of this.ausgewaehlt) {
      if (!this.nachher.has(id)) this.ausgewaehlt.delete(id);
    }
  }

  blickAuf(x, y) {
    this.kamera.x = x * FELD - this.leinwand.clientWidth / 2 / this.kamera.zoom;
    this.kamera.y = y * FELD - this.leinwand.clientHeight / 2 / this.kamera.zoom;
  }

  groesseAnpassen() {
    const dichte = window.devicePixelRatio || 1;
    this.leinwand.width = this.leinwand.clientWidth * dichte;
    this.leinwand.height = this.leinwand.clientHeight * dichte;
    this.stift.setTransform(dichte, 0, 0, dichte, 0, 0);
  }

  // Bildpunkt zu Feldkoordinate und zurueck.
  zuWelt(px, py) {
    return {
      x: (px / this.kamera.zoom + this.kamera.x) / FELD,
      y: (py / this.kamera.zoom + this.kamera.y) / FELD,
    };
  }

  zuBild(wx, wy) {
    return {
      x: (wx * FELD - this.kamera.x) * this.kamera.zoom,
      y: (wy * FELD - this.kamera.y) * this.kamera.zoom,
    };
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

    this.leinwand.addEventListener('pointerup', (e) => {
      if (!this.zug) return;
      this.auswaehlen(this.zug);
      this.zug = null;
    });

    this.leinwand.addEventListener('wheel', (e) => {
      e.preventDefault();
      const vorher = this.zuWelt(e.offsetX, e.offsetY);
      const faktor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      this.kamera.zoom = Math.min(2.5, Math.max(0.4, this.kamera.zoom * faktor));
      const nachher = this.zuWelt(e.offsetX, e.offsetY);
      this.kamera.x += (vorher.x - nachher.x) * FELD;
      this.kamera.y += (vorher.y - nachher.y) * FELD;
    }, { passive: false });

    window.addEventListener('keydown', (e) => this.tasten.add(e.key.toLowerCase()));
    window.addEventListener('keyup', (e) => this.tasten.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.tasten.clear());
  }

  auswaehlen(rahmen) {
    const breite = Math.abs(rahmen.bisX - rahmen.vonX);
    const hoehe = Math.abs(rahmen.bisY - rahmen.vonY);
    const a = this.zuWelt(Math.min(rahmen.vonX, rahmen.bisX), Math.min(rahmen.vonY, rahmen.bisY));
    const b = this.zuWelt(Math.max(rahmen.vonX, rahmen.bisX), Math.max(rahmen.vonY, rahmen.bisY));

    this.ausgewaehlt.clear();
    // Ein Klick statt eines Rahmens: das naechste eigene Fussvolk in Reichweite.
    if (breite < 5 && hoehe < 5) {
      let bestes = null;
      let besterAbstand = 1.2;
      for (const einheit of this.nachher.values()) {
        if (einheit.b !== this.ich) continue;
        const abstand = Math.hypot(einheit.x - a.x, einheit.y - KOERPER_MITTE - a.y);
        if (abstand < besterAbstand) {
          besterAbstand = abstand;
          bestes = einheit;
        }
      }
      if (bestes) this.ausgewaehlt.add(bestes.i);
      return;
    }
    for (const einheit of this.nachher.values()) {
      if (einheit.b !== this.ich) continue;
      if (einheit.x >= a.x && einheit.x <= b.x && einheit.y >= a.y && einheit.y <= b.y) {
        this.ausgewaehlt.add(einheit.i);
      }
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

    const rand = this.karte.groesse * FELD;
    this.kamera.x = Math.max(-200, Math.min(rand - 100, this.kamera.x));
    this.kamera.y = Math.max(-200, Math.min(rand - 100, this.kamera.y));
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

  zeichnen(jetzt) {
    const stift = this.stift;
    const breite = this.leinwand.clientWidth;
    const hoehe = this.leinwand.clientHeight;
    stift.fillStyle = '#0f1216';
    stift.fillRect(0, 0, breite, hoehe);

    const zoom = this.kamera.zoom;
    const g = this.karte.groesse;
    const vonX = Math.max(0, Math.floor(this.kamera.x / FELD));
    const vonY = Math.max(0, Math.floor(this.kamera.y / FELD));
    const bisX = Math.min(g, Math.ceil((this.kamera.x + breite / zoom) / FELD) + 1);
    const bisY = Math.min(g, Math.ceil((this.kamera.y + hoehe / zoom) / FELD) + 1);
    const kante = FELD * zoom + 1;

    for (let y = vonY; y < bisY; y++) {
      for (let x = vonX; x < bisX; x++) {
        const art = this.karte.felder[y * g + x];
        const punkt = this.zuBild(x - 0.5, y - 0.5);
        stift.fillStyle = FARBEN[art] || FARBEN[GRAS];
        stift.fillRect(punkt.x, punkt.y, kante, kante);
      }
    }

    for (const spieler of this.spieler.values()) this.basisZeichnen(spieler);

    for (const tier of this.tiere.values()) {
      const punkt = this.zuBild(tier.x, tier.y);
      const spieler = this.spieler.get(tier.b);
      figurZeichnen(this.stift, tier.art, punkt.x, punkt.y, Math.max(9, FELD * 1.0 * this.kamera.zoom), spieler ? spieler.farbe : '#888888', {
        blick: tier.i % 2 ? 1 : -1,
      });
    }

    const anteil = this.anteil(jetzt);
    for (const einheit of this.nachher.values()) this.einheitZeichnen(einheit, anteil);
    for (const spieler of this.spieler.values()) this.namenZeichnen(spieler);

    if (this.zug) this.rahmenZeichnen();
  }

  basisZeichnen(spieler) {
    const stift = this.stift;
    const punkt = this.zuBild(spieler.basis.x, spieler.basis.y);
    const r = FELD * 1.5 * this.kamera.zoom;
    stift.fillStyle = spieler.farbe;
    stift.globalAlpha = 0.22;
    stift.fillRect(punkt.x - r, punkt.y - r, r * 2, r * 2);
    stift.globalAlpha = 1;
    stift.strokeStyle = spieler.farbe;
    stift.lineWidth = 2;
    stift.strokeRect(punkt.x - r, punkt.y - r, r * 2, r * 2);
  }

  namenZeichnen(spieler) {
    if (this.kamera.zoom <= 0.6) return;
    const stift = this.stift;
    const punkt = this.zuBild(spieler.basis.x, spieler.basis.y);
    const r = FELD * 1.5 * this.kamera.zoom;
    stift.font = '600 12px system-ui, sans-serif';
    stift.textAlign = 'center';
    stift.lineWidth = 3;
    stift.strokeStyle = '#0f1216';
    stift.strokeText(spieler.name, punkt.x, punkt.y - r - 10);
    stift.fillStyle = '#e6e9ee';
    stift.fillText(spieler.name, punkt.x, punkt.y - r - 10);
  }

  einheitZeichnen(einheit, anteil) {
    const alt = this.vorher.get(einheit.i);
    const x = alt ? alt.x + (einheit.x - alt.x) * anteil : einheit.x;
    const y = alt ? alt.y + (einheit.y - alt.y) * anteil : einheit.y;
    const punkt = this.zuBild(x, y);
    const hoehe = Math.max(12, FELD * FIGUR_HOEHE * this.kamera.zoom);
    const spieler = this.spieler.get(einheit.b);
    const stift = this.stift;

    // Blickrichtung aus der Bewegung; wer steht, schaut weiter dorthin, wohin
    // er zuletzt ging.
    const dx = alt ? einheit.x - alt.x : 0;
    const laeuft = alt && Math.hypot(dx, einheit.y - alt.y) > 0.001;
    if (Math.abs(dx) > 0.001) this.blicke.set(einheit.i, dx < 0 ? -1 : 1);

    if (this.ausgewaehlt.has(einheit.i)) {
      // Die Auswahl liegt als Ellipse am Boden, unter den Fuessen.
      stift.strokeStyle = '#ffffff';
      stift.lineWidth = 2;
      stift.beginPath();
      stift.ellipse(punkt.x, punkt.y, hoehe * 0.42, hoehe * 0.17, 0, 0, Math.PI * 2);
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
