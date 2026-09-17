'use strict';

const karten = require('./karte');
const { suchen, nachbarfeld } = require('./wege');
const {
  EINHEITEN, SAMMELN, GEBAEUDE, BEVOELKERUNG_MAX, SCHLANGE_MAX, STARTAUFSTELLUNG,
} = require('./daten');

const TAKTE_PRO_SEKUNDE = 10;
const ABLADEWEITE = 2.2;
const SUCHWEITE_ERSATZ = 12;
// Wo die Startaufstellung steht, relativ zur Basis: alle vor dem Dorfzentrum.
// Hinter ihm (dx + dy < 0) verdeckte es sie im Bild.
const STARTPLAETZE = [[2.5, 0.5], [0.5, 2.5], [2.2, 2.2], [3, -1]];

const FARBEN = ['#4a90d9', '#d94a4a', '#4ad98a', '#d9c04a', '#a44ad9', '#4ad9d0'];

// Startvorrat je Einstellung (karte AC-12); "wenig" ist die Vorlage.
const STARTVORRAT = {
  wenig: { holz: 200, nahrung: 200, gold: 100, stein: 200 },
  mittel: { holz: 500, nahrung: 500, gold: 500, stein: 500 },
  viel: { holz: 1000, nahrung: 1000, gold: 1000, stein: 1000 },
};
const ROHSTOFFE = ['holz', 'nahrung', 'gold', 'stein'];
const ROHSTOFF_NAMEN = { holz: 'Holz', nahrung: 'Nahrung', gold: 'Gold', stein: 'Stein' };

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
    this.gebaeude = new Map();
    // Gebaeude gehen wie Tiere nur bei Aenderung ueber die Leitung.
    this.gebaeudeAenderungen = new Set();
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
      this.gebaeudeAnlegen(spieler.id, 'dorfzentrum', spieler.basis.x, spieler.basis.y);
      STARTAUFSTELLUNG.forEach((art, i) => {
        const [dx, dy] = STARTPLAETZE[i % STARTPLAETZE.length];
        this.einheitAnlegen(spieler.id, spieler.basis.x + dx, spieler.basis.y + dy, art);
      });
    }
  }

  einheitAnlegen(besitzer, x, y, art = 'dorfbewohner') {
    const werte = EINHEITEN[art];
    const einheit = {
      id: this.naechsteId++,
      art,
      besitzer,
      x,
      y,
      leben: werte.leben,
      weg: [],
      auftrag: null, // { art: 'gehen' | 'sammeln', feld }
      ladung: 0,
      ladungsart: null,
      sammelt: false, // steht am Vorrat und arbeitet
      angefangen: 0, // Bruchteil der naechsten Einheit Rohstoff
    };
    this.einheiten.set(einheit.id, einheit);
    return einheit;
  }

  gebaeudeAnlegen(besitzer, art, x, y) {
    const gebaeude = {
      id: this.naechsteId++,
      art,
      besitzer,
      x,
      y,
      leben: GEBAEUDE[art].leben,
      schlange: [], // Arten der bezahlten Auftraege, der erste laeuft
      fortschritt: 0, // Takte am laufenden Auftrag
      wartet: false, // Bevoelkerung voll (bauen AC-15)
    };
    this.gebaeude.set(gebaeude.id, gebaeude);
    this.gebaeudeGeaendert(gebaeude);
    return gebaeude;
  }

  gebaeudeGeaendert(gebaeude) {
    this.gebaeudeAenderungen.add(gebaeude.id);
  }

  // Alles, was der Browser waehrend der Partie schickt, kommt hier an. Der
  // Server kennt die Arten nicht (ADR-0006).
  nachricht(spielerId, nachricht) {
    switch (nachricht.auftrag) {
      case 'ausbilden':
        return this.ausbilden(spielerId, nachricht.gebaeude, nachricht.einheit);
      case 'abbrechen':
        return this.abbrechen(spielerId, nachricht.gebaeude, nachricht.platz);
      default:
        return this.befehl(spielerId, nachricht.einheiten, nachricht.ziel);
    }
  }

  // Bezahlt wird beim Einreihen (bauen AC-10). Die Absage sagt, warum
  // (bedienung AC-18).
  ausbilden(spielerId, gebaeudeId, art) {
    const gebaeude = this.gebaeude.get(gebaeudeId);
    if (!gebaeude || gebaeude.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebaeude.' };
    if (!GEBAEUDE[gebaeude.art].bildetAus.includes(art)) return { fehler: 'Das bildet dieses Gebaeude nicht aus.' };
    if (gebaeude.schlange.length >= SCHLANGE_MAX) return { fehler: 'Die Warteschlange ist voll.' };
    const spieler = this.spielerVon(spielerId);
    const kosten = EINHEITEN[art].kosten;
    for (const [rohstoff, menge] of Object.entries(kosten)) {
      if (spieler[rohstoff] < menge) return { fehler: `Zu wenig ${ROHSTOFF_NAMEN[rohstoff]}.` };
    }
    for (const [rohstoff, menge] of Object.entries(kosten)) spieler[rohstoff] -= menge;
    gebaeude.schlange.push(art);
    this.gebaeudeGeaendert(gebaeude);
    return {};
  }

  // Jeder Auftrag, auch der laufende, erstattet die vollen Kosten (bauen AC-11).
  abbrechen(spielerId, gebaeudeId, platz) {
    const gebaeude = this.gebaeude.get(gebaeudeId);
    if (!gebaeude || gebaeude.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebaeude.' };
    if (!Number.isInteger(platz) || platz < 0 || platz >= gebaeude.schlange.length) return { fehler: 'Diesen Auftrag gibt es nicht.' };
    const [art] = gebaeude.schlange.splice(platz, 1);
    const spieler = this.spielerVon(spielerId);
    for (const [rohstoff, menge] of Object.entries(EINHEITEN[art].kosten)) spieler[rohstoff] += menge;
    if (platz === 0) {
      gebaeude.fortschritt = 0;
      gebaeude.wartet = false;
    }
    this.gebaeudeGeaendert(gebaeude);
    return {};
  }

  // Wohnraum aus den eigenen Gebaeuden, hoechstens 200 (bauen AC-14).
  wohnraum(spieler) {
    let raum = 0;
    for (const g of this.gebaeude.values()) {
      if (g.besitzer === spieler.id) raum += GEBAEUDE[g.art].wohnraum || 0;
    }
    return Math.min(BEVOELKERUNG_MAX, raum);
  }

  // Gezaehlt wird, was steht - eine verlorene Einheit gibt ihren Platz sofort
  // frei (bauen AC-16).
  bevoelkerung() {
    const zahl = new Map();
    for (const e of this.einheiten.values()) zahl.set(e.besitzer, (zahl.get(e.besitzer) || 0) + 1);
    return zahl;
  }

  gebaeudeTakten(gebaeude, bevoelkerung) {
    if (!gebaeude.schlange.length) return;
    const spieler = this.spielerVon(gebaeude.besitzer);
    const belegt = bevoelkerung.get(spieler.id) || 0;
    // Voll: der Auftrag wartet, statt anzufangen (bauen AC-15).
    const wartet = belegt >= this.wohnraum(spieler);
    if (wartet !== gebaeude.wartet) this.gebaeudeGeaendert(gebaeude);
    gebaeude.wartet = wartet;
    if (wartet) return;

    const art = gebaeude.schlange[0];
    gebaeude.fortschritt++;
    this.gebaeudeGeaendert(gebaeude);
    if (gebaeude.fortschritt < EINHEITEN[art].zeit * TAKTE_PRO_SEKUNDE) return;

    const feld = this.freiesFeldAm(gebaeude);
    if (!feld) return; // alles verstellt: im naechsten Takt wieder versuchen
    gebaeude.schlange.shift();
    gebaeude.fortschritt = 0;
    this.einheitAnlegen(spieler.id, feld.x, feld.y, art);
    bevoelkerung.set(spieler.id, belegt + 1);
  }

  // Ein begehbares Feld am Rand des Gebaeudes, auf dem niemand steht
  // (bauen AC-12). Gesucht wird ringweise nach aussen, immer in derselben
  // Reihenfolge - die Simulation bleibt deterministisch.
  freiesFeldAm(gebaeude) {
    const besetzt = new Set();
    for (const e of this.einheiten.values()) besetzt.add(`${Math.round(e.x)},${Math.round(e.y)}`);
    const mx = Math.round(gebaeude.x);
    const my = Math.round(gebaeude.y);
    for (let r = 2; r <= 8; r++) {
      // Vorn zuerst (dx + dy gross): dahinter verdeckte das Gebaeude den Neuen.
      const ring = [];
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) === r) ring.push([dx, dy]);
        }
      }
      ring.sort((a, b) => (b[0] + b[1]) - (a[0] + a[1]) || a[0] - b[0]);
      for (const [dx, dy] of ring) {
        const x = mx + dx;
        const y = my + dy;
        if (!karten.begehbar(this.karte, x, y) || besetzt.has(`${x},${y}`)) continue;
        return { x, y };
      }
    }
    return null;
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

    // Holz, Beeren, Gold und Stein sind sammelbar (einheiten AC-15).
    const sammeln = SAMMELN[this.karte.felder[zy * g + zx]];

    for (const id of einheitIds.slice(0, 200)) {
      const einheit = this.einheiten.get(id);
      if (!einheit || einheit.besitzer !== spielerId) continue;
      einheit.sammelt = false;
      if (sammeln && EINHEITEN[einheit.art].tragkraft > 0) {
        // Wer den Rohstoff wechselt, laesst die alte Ladung fallen.
        if (einheit.ladung > 0 && einheit.ladungsart !== sammeln.rohstoff) {
          einheit.ladung = 0;
          einheit.ladungsart = null;
        }
        einheit.angefangen = 0;
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
    const bevoelkerung = this.bevoelkerung();
    for (const gebaeude of this.gebaeude.values()) this.gebaeudeTakten(gebaeude, bevoelkerung);
    for (const einheit of this.einheiten.values()) this.einheitTakten(einheit);
  }

  einheitTakten(einheit) {
    if (einheit.weg.length) {
      einheit.sammelt = false;
      this.laufen(einheit);
      return;
    }
    if (!einheit.auftrag) return;

    if (einheit.auftrag.art !== 'sammeln') {
      einheit.auftrag = null;
      return;
    }
    if (einheit.ladung >= EINHEITEN[einheit.art].tragkraft) this.abladen(einheit);
    else if (einheit.sammelt) this.sammelnSchritt(einheit);
    else this.sammelnBeginnen(einheit);
  }

  // Tempo aus den Daten, in Feldern je Sekunde (einheiten AC-19).
  laufen(einheit) {
    const tempo = EINHEITEN[einheit.art].tempo / TAKTE_PRO_SEKUNDE;
    const naechstes = einheit.weg[0];
    const dx = naechstes.x - einheit.x;
    const dy = naechstes.y - einheit.y;
    const abstand = Math.hypot(dx, dy);
    if (abstand <= tempo) {
      einheit.x = naechstes.x;
      einheit.y = naechstes.y;
      einheit.weg.shift();
      return;
    }
    einheit.x += (dx / abstand) * tempo;
    einheit.y += (dy / abstand) * tempo;
  }

  // Steht die Einheit am Vorrat, faengt sie an zu arbeiten; sonst laeuft sie
  // hin, oder - ist der Vorrat leer - zum naechsten gleicher Art.
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
        einheit.sammelt = false;
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
    einheit.sammelt = true;
  }

  // Ein Takt Arbeit am Vorrat: die Rate der Vorlage, in ganzen Einheiten vom
  // Vorrat genommen (einheiten AC-15). Voll geht es zur Abgabe.
  sammelnSchritt(einheit) {
    const feld = einheit.auftrag.feld;
    const index = feld.y * this.karte.groesse + feld.x;
    const art = this.karte.felder[index];
    const sammeln = SAMMELN[art];
    const rest = this.karte.vorrat.get(index) || 0;
    if (!sammeln || rest <= 0) {
      einheit.sammelt = false;
      this.sammelnBeginnen(einheit);
      return;
    }

    einheit.angefangen += sammeln.rate / TAKTE_PRO_SEKUNDE;
    if (einheit.angefangen < 1) return;
    einheit.angefangen -= 1;

    this.karte.vorrat.set(index, rest - 1);
    einheit.ladung += 1;
    einheit.ladungsart = sammeln.rohstoff;

    // Das Bild zeigt, wie voll ein Vorrat noch ist - in Vierteln, und nur wenn
    // ein Viertel verloren geht, damit keine Nachricht je Einheit entsteht
    // (darstellung AC-3).
    const voll = karten.VORRAT[art];
    const viertelVorher = Math.ceil((rest / voll) * 4);
    const viertelNachher = Math.ceil(((rest - 1) / voll) * 4);
    if (rest - 1 > 0 && viertelNachher !== viertelVorher) {
      this.feldAenderungen.push({ i: index, a: art, v: viertelNachher });
    }
    if (rest - 1 <= 0) {
      this.karte.felder[index] = karten.GRAS;
      this.karte.vorrat.delete(index);
      this.feldAenderungen.push({ i: index, a: karten.GRAS });
      einheit.sammelt = false;
    }

    if (einheit.ladung >= EINHEITEN[einheit.art].tragkraft) {
      einheit.sammelt = false;
      this.wegZurBasis(einheit);
    }
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
    einheit.angefangen = 0;
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
    const bevoelkerung = this.bevoelkerung();
    for (const e of this.einheiten.values()) {
      einheiten.push({
        i: e.id,
        k: EINHEITEN[e.art].kuerzel,
        b: e.besitzer,
        x: Math.round(e.x * 100) / 100,
        y: Math.round(e.y * 100) / 100,
        l: e.ladung,
        a: e.ladungsart ? e.ladungsart[0] : null,
        // Leben nur, wenn es fehlt: das volle steht im Aufbau (bedienung AC-29),
        // und ein Zustand bleibt klein (uebertragung AC-7).
        ...(e.leben < EINHEITEN[e.art].leben ? { h: e.leben } : {}),
      });
    }
    const felder = this.feldAenderungen;
    this.feldAenderungen = [];
    const zustand = {
      typ: 'zustand',
      t: this.takt,
      spieler: this.spieler.map((s) => ({
        id: s.id,
        holz: s.holz,
        nahrung: s.nahrung,
        gold: s.gold,
        stein: s.stein,
        bev: bevoelkerung.get(s.id) || 0,
        raum: this.wohnraum(s),
      })),
      einheiten,
      felder,
    };
    if (this.gebaeudeAenderungen.size) {
      zustand.gebaeude = [...this.gebaeudeAenderungen].map((id) => this.gebaeudeFuerDraht(id));
      this.gebaeudeAenderungen.clear();
    }
    // Tiere nur, wenn sich eines geaendert hat.
    if (this.tierAenderungen.length) {
      zustand.tiere = this.tierAenderungen.map((id) => this.tierFuerDraht(id));
      this.tierAenderungen = [];
    }
    return zustand;
  }

  // Gebaeude mit Schlange und Fortschritt (bauen AC-10), fuer die
  // Ausbildungsleiste (bedienung AC-26).
  gebaeudeFuerDraht(id) {
    const g = this.gebaeude.get(id);
    if (!g) return { i: id, weg: true };
    const laufend = g.schlange[0];
    return {
      i: g.id,
      art: g.art,
      b: g.besitzer,
      x: g.x,
      y: g.y,
      h: g.leben,
      s: g.schlange,
      f: laufend ? Math.round((g.fortschritt / (EINHEITEN[laufend].zeit * TAKTE_PRO_SEKUNDE)) * 100) / 100 : 0,
      w: g.wartet,
    };
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
      gebaeude: [...this.gebaeude.keys()].map((id) => this.gebaeudeFuerDraht(id)),
      // Die Werte der Arten, einmal: der Browser zeigt Leben, Tragkraft und
      // Kosten, ohne sie selbst zu kennen (bedienung AC-26, AC-29).
      werte: {
        einheiten: Object.fromEntries(Object.entries(EINHEITEN).map(([art, w]) => [art, {
          kuerzel: w.kuerzel, leben: w.leben, tragkraft: w.tragkraft, kosten: w.kosten || null, zeit: w.zeit || null,
        }])),
        gebaeude: Object.fromEntries(Object.entries(GEBAEUDE).map(([art, w]) => [art, {
          leben: w.leben, bildetAus: w.bildetAus || [],
        }])),
      },
    };
  }
}

module.exports = { Welt, TAKTE_PRO_SEKUNDE, STARTVORRAT, ROHSTOFFE };
