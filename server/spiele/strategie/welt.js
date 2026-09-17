'use strict';

const karten = require('./karte');
const { suchen, nachbarfeld } = require('./wege');

const TAKTE_PRO_SEKUNDE = 10;
const TEMPO = 3 / TAKTE_PRO_SEKUNDE; // Felder je Takt
const TRAGKRAFT = 10;
const SAMMELTAKTE = 20; // zwei Sekunden fuer eine volle Ladung
const ABLADEWEITE = 2.2;
const SAMMLER_ZU_BEGINN = 5;
const SUCHWEITE_ERSATZ = 12;

const FARBEN = ['#4a90d9', '#d94a4a', '#4ad98a', '#d9c04a', '#a44ad9', '#4ad9d0'];

// Startvorrat je Einstellung (karte AC-12); "wenig" ist die Vorlage.
const STARTVORRAT = {
  wenig: { holz: 200, nahrung: 200, gold: 100, stein: 200 },
  mittel: { holz: 500, nahrung: 500, gold: 500, stein: 500 },
  viel: { holz: 1000, nahrung: 1000, gold: 1000, stein: 1000 },
};
const ROHSTOFFE = ['holz', 'nahrung', 'gold', 'stein'];

class Welt {
  /**
   * @param {{id: string, name: string}[]} spielerListe
   * @param {number} startwert
   * @param {{kartengroesse?: string, vorrat?: string}} [einstellungen]
   */
  constructor(spielerListe, startwert, einstellungen = {}) {
    this.startwert = startwert;
    this.karte = karten.erzeugen(startwert, spielerListe.length, einstellungen);
    const start = STARTVORRAT[einstellungen.vorrat] || STARTVORRAT.wenig;
    this.takt = 0;
    this.naechsteId = 1;
    this.einheiten = new Map();
    this.feldAenderungen = [];

    this.spieler = spielerListe.map((eintrag, i) => ({
      id: eintrag.id,
      name: eintrag.name,
      farbe: FARBEN[i % FARBEN.length],
      ...start,
      basis: this.karte.basen[i],
    }));

    // Tiere gehoeren einem Spieler, stehen aber nicht in den Einheiten: sie
    // stehen still, bis jemand sie nutzt, und gehen deshalb nicht zehnmal je
    // Sekunde ueber die Leitung - einmal im Aufbau, danach nur bei Aenderung
    // (karte AC-16, uebertragung AC-7).
    this.tiere = new Map();
    this.tierAenderungen = [];
    for (const schaf of this.karte.schafe) {
      const id = this.naechsteId++;
      this.tiere.set(id, {
        id, art: 'schaf', besitzer: this.spieler[schaf.spieler].id, x: schaf.x, y: schaf.y, nahrung: karten.SCHAF_NAHRUNG,
      });
    }

    for (const spieler of this.spieler) {
      for (let i = 0; i < SAMMLER_ZU_BEGINN; i++) {
        const winkel = (i / SAMMLER_ZU_BEGINN) * Math.PI * 2;
        this.einheitAnlegen(
          spieler.id,
          spieler.basis.x + Math.cos(winkel) * 2,
          spieler.basis.y + Math.sin(winkel) * 2,
        );
      }
    }
  }

  einheitAnlegen(besitzer, x, y) {
    const einheit = {
      id: this.naechsteId++,
      besitzer,
      x,
      y,
      weg: [],
      auftrag: null, // { art: 'gehen' | 'sammeln', feld }
      ladung: 0,
      ladungsart: null,
      sammelrest: 0,
    };
    this.einheiten.set(einheit.id, einheit);
    return einheit;
  }

  spielerVon(id) {
    return this.spieler.find((s) => s.id === id) || null;
  }

  feldVon(einheit) {
    return { x: Math.round(einheit.x), y: Math.round(einheit.y) };
  }

  // Ein Befehl kommt aus dem Browser und ist damit erst einmal unglaubwuerdig:
  // nur eigene Einheiten, nur Felder auf der Karte.
  befehl(spielerId, einheitIds, ziel) {
    if (!Array.isArray(einheitIds) || !ziel) return;
    const g = this.karte.groesse;
    const zx = Math.round(Number(ziel.x));
    const zy = Math.round(Number(ziel.y));
    if (!Number.isInteger(zx) || !Number.isInteger(zy)) return;
    if (zx < 0 || zy < 0 || zx >= g || zy >= g) return;

    const art = this.karte.felder[zy * g + zx];
    const sammelbar = art === karten.WALD || art === karten.BEERE;

    for (const id of einheitIds.slice(0, 200)) {
      const einheit = this.einheiten.get(id);
      if (!einheit || einheit.besitzer !== spielerId) continue;
      einheit.sammelrest = 0;
      if (sammelbar) {
        einheit.auftrag = { art: 'sammeln', feld: { x: zx, y: zy } };
        this.wegZumVorrat(einheit);
      } else {
        einheit.auftrag = { art: 'gehen', feld: { x: zx, y: zy } };
        einheit.weg = suchen(this.karte, this.feldVon(einheit), { x: zx, y: zy });
      }
    }
  }

  wegZumVorrat(einheit) {
    const stand = nachbarfeld(this.karte, einheit.auftrag.feld, einheit);
    einheit.weg = stand ? suchen(this.karte, this.feldVon(einheit), stand) : [];
  }

  wegZurBasis(einheit) {
    const spieler = this.spielerVon(einheit.besitzer);
    einheit.weg = suchen(this.karte, this.feldVon(einheit), spieler.basis);
  }

  takten() {
    this.takt++;
    for (const einheit of this.einheiten.values()) this.einheitTakten(einheit);
  }

  einheitTakten(einheit) {
    if (einheit.sammelrest > 0) {
      einheit.sammelrest--;
      if (einheit.sammelrest === 0) this.ladungNehmen(einheit);
      return;
    }
    if (einheit.weg.length) {
      this.laufen(einheit);
      return;
    }
    if (!einheit.auftrag) return;

    if (einheit.auftrag.art !== 'sammeln') {
      einheit.auftrag = null;
      return;
    }
    if (einheit.ladung >= TRAGKRAFT) this.abladen(einheit);
    else this.sammelnBeginnen(einheit);
  }

  laufen(einheit) {
    const naechstes = einheit.weg[0];
    const dx = naechstes.x - einheit.x;
    const dy = naechstes.y - einheit.y;
    const abstand = Math.hypot(dx, dy);
    if (abstand <= TEMPO) {
      einheit.x = naechstes.x;
      einheit.y = naechstes.y;
      einheit.weg.shift();
      return;
    }
    einheit.x += (dx / abstand) * TEMPO;
    einheit.y += (dy / abstand) * TEMPO;
  }

  sammelnBeginnen(einheit) {
    const feld = einheit.auftrag.feld;
    const index = feld.y * this.karte.groesse + feld.x;
    const rest = this.karte.vorrat.get(index) || 0;

    if (rest <= 0) {
      // Vorrat aufgebraucht: der naechste gleicher Art in der Naehe uebernimmt,
      // damit die Sammler nicht einfach stehenbleiben.
      const ersatz = this.naechsterVorrat(einheit, einheit.zuletztGesammelt);
      if (!ersatz) {
        einheit.auftrag = null;
        return;
      }
      einheit.auftrag = { art: 'sammeln', feld: ersatz };
      this.wegZumVorrat(einheit);
      return;
    }
    if (Math.hypot(einheit.x - feld.x, einheit.y - feld.y) > 1.9) {
      this.wegZumVorrat(einheit);
      return;
    }
    einheit.zuletztGesammelt = this.karte.felder[index];
    einheit.sammelrest = SAMMELTAKTE;
  }

  ladungNehmen(einheit) {
    const feld = einheit.auftrag.feld;
    const index = feld.y * this.karte.groesse + feld.x;
    const rest = this.karte.vorrat.get(index) || 0;
    const menge = Math.min(TRAGKRAFT, rest);
    if (menge <= 0) return;

    this.karte.vorrat.set(index, rest - menge);
    // Das Bild zeigt, wie voll ein Vorrat noch ist - in Vierteln, und nur wenn
    // ein Viertel verloren geht, damit keine Nachricht je Ladung entsteht
    // (darstellung AC-3).
    const voll = karten.VORRAT[this.karte.felder[index]];
    const viertelVorher = Math.ceil((rest / voll) * 4);
    const viertelNachher = Math.ceil(((rest - menge) / voll) * 4);
    if (rest - menge > 0 && viertelNachher !== viertelVorher) {
      this.feldAenderungen.push({ i: index, a: this.karte.felder[index], v: viertelNachher });
    }
    einheit.ladung = menge;
    einheit.ladungsart = this.karte.felder[index] === karten.WALD ? 'holz' : 'nahrung';

    if (rest - menge <= 0) {
      this.karte.felder[index] = karten.GRAS;
      this.karte.vorrat.delete(index);
      this.feldAenderungen.push({ i: index, a: karten.GRAS });
    }
    this.wegZurBasis(einheit);
  }

  abladen(einheit) {
    const spieler = this.spielerVon(einheit.besitzer);
    const weg = Math.hypot(einheit.x - spieler.basis.x, einheit.y - spieler.basis.y);
    if (weg > ABLADEWEITE) {
      this.wegZurBasis(einheit);
      return;
    }
    spieler[einheit.ladungsart] += einheit.ladung;
    einheit.ladung = 0;
    einheit.ladungsart = null;
    this.wegZumVorrat(einheit);
  }

  naechsterVorrat(einheit, art) {
    let bestes = null;
    let besterAbstand = SUCHWEITE_ERSATZ;
    for (const index of this.karte.vorrat.keys()) {
      if (art !== undefined && this.karte.felder[index] !== art) continue;
      const x = index % this.karte.groesse;
      const y = (index / this.karte.groesse) | 0;
      const abstand = Math.hypot(x - einheit.x, y - einheit.y);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = { x, y };
      }
    }
    return bestes;
  }

  // Was der Browser braucht, um ein Bild zu zeichnen - mehr nicht.
  zustand() {
    const einheiten = [];
    for (const e of this.einheiten.values()) {
      einheiten.push({
        i: e.id,
        b: e.besitzer,
        x: Math.round(e.x * 100) / 100,
        y: Math.round(e.y * 100) / 100,
        l: e.ladung,
        a: e.ladungsart ? e.ladungsart[0] : null,
      });
    }
    const felder = this.feldAenderungen;
    this.feldAenderungen = [];
    const zustand = {
      typ: 'zustand',
      t: this.takt,
      spieler: this.spieler.map((s) => ({ id: s.id, holz: s.holz, nahrung: s.nahrung, gold: s.gold, stein: s.stein })),
      einheiten,
      felder,
    };
    // Tiere nur, wenn sich eines geaendert hat.
    if (this.tierAenderungen.length) {
      zustand.tiere = this.tierAenderungen.map((id) => this.tierFuerDraht(id));
      this.tierAenderungen = [];
    }
    return zustand;
  }

  tierFuerDraht(id) {
    const tier = this.tiere.get(id);
    if (!tier) return { i: id, weg: true };
    return { i: tier.id, art: tier.art, b: tier.besitzer, x: tier.x, y: tier.y, n: tier.nahrung };
  }

  // Einmalig beim Start: Karte und Spielerliste.
  aufbau() {
    return {
      typ: 'aufbau',
      takte: TAKTE_PRO_SEKUNDE,
      // Sichtbar, damit eine gute Karte wieder gespielt werden kann (auswahl AC-7).
      startwert: this.startwert,
      karte: {
        groesse: this.karte.groesse,
        felder: Buffer.from(this.karte.felder).toString('base64'),
      },
      spieler: this.spieler.map((s) => ({
        id: s.id,
        name: s.name,
        farbe: s.farbe,
        basis: s.basis,
      })),
      tiere: [...this.tiere.keys()].map((id) => this.tierFuerDraht(id)),
    };
  }
}

module.exports = { Welt, TAKTE_PRO_SEKUNDE, TRAGKRAFT, SAMMELTAKTE, STARTVORRAT, ROHSTOFFE };
