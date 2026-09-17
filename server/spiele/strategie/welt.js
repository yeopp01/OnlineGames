'use strict';

const karten = require('./karte');
const { suchen, nachbarfeld } = require('./wege');
const {
  EINHEITEN, SAMMELN, TIERE, GEBAEUDE, VERBESSERUNGEN, BEVOELKERUNG_MAX, SCHLANGE_MAX, STARTAUFSTELLUNG,
} = require('./daten');

const TAKTE_PRO_SEKUNDE = 10;
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
      verbesserungen: [], // erforscht, in der Reihenfolge des Abschlusses
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
        id,
        art: 'schaf',
        besitzer: this.spieler[schaf.spieler].id,
        x: schaf.x,
        y: schaf.y,
        nahrung: TIERE.schaf.nahrung,
        geschlachtet: false,
        verfall: 0, // Takte ohne Arbeit seit der letzten verfallenen Nahrung
        weg: [],
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

  // Werte eines Auftrags in der Schlange: Einheit oder Verbesserung.
  auftragWerte(art) {
    return EINHEITEN[art] || VERBESSERUNGEN[art];
  }

  // Leben einer Einheit mit allen Verbesserungen ihres Spielers (bauen AC-21).
  lebenMax(besitzer, art) {
    const spieler = this.spielerVon(besitzer);
    let leben = EINHEITEN[art].leben;
    for (const v of spieler?.verbesserungen || []) leben += VERBESSERUNGEN[v].wirkung[art]?.leben || 0;
    return leben;
  }

  einheitAnlegen(besitzer, x, y, art = 'dorfbewohner') {
    const werte = { ...EINHEITEN[art], leben: this.lebenMax(besitzer, art) };
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
      baut: false, // steht an einer Baustelle und arbeitet
      angefangen: 0, // Bruchteil der naechsten Einheit Rohstoff
    };
    this.einheiten.set(einheit.id, einheit);
    return einheit;
  }

  // x, y ist das Ankerfeld; die Grundflaeche reicht von x - groesse/2 (abgerundet)
  // ueber groesse Felder (grundflaeche). Fertig steht ein Gebaeude nur zu Beginn
  // da - alles andere ist erst eine Baustelle (bauen AC-1).
  gebaeudeAnlegen(besitzer, art, x, y, fertig = true) {
    const gebaeude = {
      id: this.naechsteId++,
      art,
      besitzer,
      x,
      y,
      fertig,
      bau: fertig ? 1 : 0, // Anteil der Bauarbeit
      leben: GEBAEUDE[art].leben,
      // Eine Farm traegt Nahrung, und nur einer arbeitet darauf (einheiten AC-18).
      ...(GEBAEUDE[art].nahrung ? { nahrung: GEBAEUDE[art].nahrung, arbeiter: null } : {}),
      schlange: [], // Arten der bezahlten Auftraege, der erste laeuft
      fortschritt: 0, // Takte am laufenden Auftrag
      wartet: false, // Bevoelkerung voll (bauen AC-15)
    };
    this.gebaeude.set(gebaeude.id, gebaeude);
    this.belegen(gebaeude);
    this.gebaeudeGeaendert(gebaeude);
    return gebaeude;
  }

  grundflaeche(art, x, y) {
    const groesse = GEBAEUDE[art].groesse;
    const x0 = x - Math.floor(groesse / 2);
    const y0 = y - Math.floor(groesse / 2);
    return { x0, y0, x1: x0 + groesse - 1, y1: y0 + groesse - 1 };
  }

  // Taugt der Platz? Alle Felder auf der Karte, Gras, kein Tier darauf
  // (bauen AC-3). Einheiten stehen nicht im Weg - sie gehen beiseite.
  platzPruefen(art, x, y) {
    if (!GEBAEUDE[art] || !Number.isInteger(x) || !Number.isInteger(y)) return false;
    const { x0, y0, x1, y1 } = this.grundflaeche(art, x, y);
    for (let fy = y0; fy <= y1; fy++) {
      for (let fx = x0; fx <= x1; fx++) {
        if (!karten.begehbar(this.karte, fx, fy)) return false;
      }
    }
    for (const tier of this.tiere.values()) {
      const tx = Math.round(tier.x);
      const ty = Math.round(tier.y);
      if (tx >= x0 && tx <= x1 && ty >= y0 && ty <= y1) return false;
    }
    // Begehbare Gebaeude (Farmen) belegen kein Feld der Karte - sie werden hier
    // eigens ausgeschlossen, damit niemand ueber sie baut.
    for (const gebaeude of this.gebaeude.values()) {
      const g = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y);
      if (g.x0 <= x1 && g.x1 >= x0 && g.y0 <= y1 && g.y1 >= y0) return false;
    }
    return true;
  }

  // Die Grundflaeche wird unbegehbar; wer darauf steht, geht zum naechsten
  // freien Feld daneben.
  belegen(gebaeude) {
    if (GEBAEUDE[gebaeude.art].begehbar) return;
    const g = this.karte.groesse;
    const { x0, y0, x1, y1 } = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y);
    for (let fy = Math.max(0, y0); fy <= Math.min(g - 1, y1); fy++) {
      for (let fx = Math.max(0, x0); fx <= Math.min(g - 1, x1); fx++) {
        const i = fy * g + fx;
        this.karte.felder[i] = karten.BEBAUT;
        this.karte.vorrat.delete(i);
        this.feldAenderungen.push({ i, a: karten.BEBAUT });
      }
    }
    for (const einheit of this.einheiten.values()) {
      if (!this.aufGrundflaeche(einheit, gebaeude)) continue;
      const frei = this.randfeld(gebaeude, einheit);
      if (!frei) continue;
      einheit.x = frei.x;
      einheit.y = frei.y;
      einheit.weg = [];
    }
    // Wer unterwegs ist und dessen Weg ueber die neue Grundflaeche fuehrt, sucht
    // neu - sonst lief er durch das Gebaeude (bauen AC-3, vom Pruefstand
    // gefunden: Startwert 1, Takt 1015).
    for (const einheit of this.einheiten.values()) {
      if (!einheit.weg.some((p) => p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1)) continue;
      const ziel = einheit.weg[einheit.weg.length - 1];
      einheit.weg = suchen(this.karte, this.feldVon(einheit), ziel);
    }
  }

  freigeben(gebaeude) {
    if (GEBAEUDE[gebaeude.art].begehbar) return;
    const g = this.karte.groesse;
    const { x0, y0, x1, y1 } = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y);
    for (let fy = y0; fy <= y1; fy++) {
      for (let fx = x0; fx <= x1; fx++) {
        const i = fy * g + fx;
        this.karte.felder[i] = karten.GRAS;
        this.feldAenderungen.push({ i, a: karten.GRAS });
      }
    }
  }

  aufGrundflaeche(einheit, gebaeude) {
    const { x0, y0, x1, y1 } = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y);
    const ex = Math.round(einheit.x);
    const ey = Math.round(einheit.y);
    return ex >= x0 && ex <= x1 && ey >= y0 && ey <= y1;
  }

  // Abstand in Feldern von einer Einheit zum Rand der Grundflaeche.
  abstandZu(einheit, gebaeude) {
    const { x0, y0, x1, y1 } = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y);
    const dx = Math.max(x0 - einheit.x, 0, einheit.x - x1);
    const dy = Math.max(y0 - einheit.y, 0, einheit.y - y1);
    return Math.max(dx, dy);
  }

  // Das begehbare Feld rund um die Grundflaeche, das `von` am naechsten liegt.
  randfeld(gebaeude, von) {
    const { x0, y0, x1, y1 } = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y);
    let bestes = null;
    let besterAbstand = Infinity;
    for (let r = 1; r <= 3 && !bestes; r++) {
      for (let fy = y0 - r; fy <= y1 + r; fy++) {
        for (let fx = x0 - r; fx <= x1 + r; fx++) {
          if (fx > x0 - r && fx < x1 + r && fy > y0 - r && fy < y1 + r) continue;
          if (!karten.begehbar(this.karte, fx, fy)) continue;
          const abstand = Math.hypot(fx - von.x, fy - von.y);
          if (abstand < besterAbstand) {
            besterAbstand = abstand;
            bestes = { x: fx, y: fy };
          }
        }
      }
    }
    return bestes;
  }

  gebaeudeAn(x, y) {
    for (const gebaeude of this.gebaeude.values()) {
      const { x0, y0, x1, y1 } = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y);
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return gebaeude;
    }
    return null;
  }

  // Ein Bauauftrag: der Platz wird geprueft, die Kosten gehen sofort ab
  // (bauen AC-5), die Baustelle entsteht, die Dorfbewohner gehen hin (AC-1).
  bauen(spielerId, einheitIds, art, ziel) {
    if (!Array.isArray(einheitIds) || !ziel || !GEBAEUDE[art]) return { fehler: 'Das laesst sich nicht bauen.' };
    const bauer = einheitIds.slice(0, 200)
      .map((id) => this.einheiten.get(id))
      .filter((e) => e && e.besitzer === spielerId && (EINHEITEN[e.art].baut || []).includes(art));
    if (!bauer.length) return { fehler: 'Niemand in der Auswahl kann das bauen.' };
    const x = Math.round(Number(ziel.x));
    const y = Math.round(Number(ziel.y));
    if (!this.platzPruefen(art, x, y)) return { fehler: 'Hier ist kein Platz.' };
    const spieler = this.spielerVon(spielerId);
    const kosten = GEBAEUDE[art].kosten;
    for (const [rohstoff, menge] of Object.entries(kosten)) {
      if (spieler[rohstoff] < menge) return { fehler: `Zu wenig ${ROHSTOFF_NAMEN[rohstoff]}.` };
    }
    for (const [rohstoff, menge] of Object.entries(kosten)) spieler[rohstoff] -= menge;
    const baustelle = this.gebaeudeAnlegen(spielerId, art, x, y, false);
    for (const einheit of bauer) this.bauenBeginnen(einheit, baustelle);
    return { gebaeude: baustelle.id };
  }

  bauenBeginnen(einheit, baustelle) {
    this.farmVerlassen(einheit);
    einheit.sammelt = false;
    einheit.baut = false;
    einheit.auftrag = { art: 'bauen', gebaeude: baustelle.id };
    const stand = this.randfeld(baustelle, einheit);
    einheit.weg = stand ? this.wegNach(einheit, stand) : [];
  }

  // Ein Weg zu einem Feld. Steht die Einheit schon auf dem Feld, aber nicht in
  // seiner Mitte, geht sie den Rest - die Suche allein lieferte dann keinen
  // Weg, und ein Bauer gab 0,04 Felder vor dem Ziel auf (Pruefstand, Runde 44).
  wegNach(einheit, ziel) {
    const feld = this.feldVon(einheit);
    if (feld.x === ziel.x && feld.y === ziel.y) {
      return einheit.x === ziel.x && einheit.y === ziel.y ? [] : [{ x: ziel.x, y: ziel.y }];
    }
    return suchen(this.karte, feld, ziel);
  }

  // Eine Baustelle abreissen: erstattet wird, was noch nicht verbaut ist
  // (bauen AC-6).
  abreissen(spielerId, gebaeudeId) {
    const gebaeude = this.gebaeude.get(gebaeudeId);
    if (!gebaeude || gebaeude.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebaeude.' };
    if (gebaeude.fertig) return { fehler: 'Nur Baustellen lassen sich abreissen.' };
    const spieler = this.spielerVon(spielerId);
    for (const [rohstoff, menge] of Object.entries(GEBAEUDE[gebaeude.art].kosten)) {
      spieler[rohstoff] += Math.floor(menge * (1 - gebaeude.bau));
    }
    this.freigeben(gebaeude);
    this.gebaeude.delete(gebaeude.id);
    this.gebaeudeGeaendert(gebaeude);
    for (const einheit of this.einheiten.values()) {
      if (einheit.auftrag?.art === 'bauen' && einheit.auftrag.gebaeude === gebaeude.id) {
        einheit.auftrag = null;
        einheit.baut = false;
      }
    }
    return {};
  }

  // Wer an einer Baustelle arbeitet, baut sie mit (bauen AC-2):
  // n Bauleute brauchen 3 t / (n + 2).
  baustelleTakten(gebaeude) {
    let bauleute = 0;
    for (const einheit of this.einheiten.values()) {
      if (einheit.baut && einheit.auftrag?.gebaeude === gebaeude.id) bauleute++;
    }
    if (!bauleute) return;
    gebaeude.bau = Math.min(1, gebaeude.bau + (bauleute + 2) / (3 * GEBAEUDE[gebaeude.art].bauzeit * TAKTE_PRO_SEKUNDE));
    this.gebaeudeGeaendert(gebaeude);
    // Ein Hauch Rechenspiel: 1 - 1e-9 zaehlt als fertig, sonst fehlt der
    // letzte Takt wegen der Rundung.
    if (gebaeude.bau < 1 - 1e-9) return;
    gebaeude.bau = 1;
    gebaeude.fertig = true;
    this.nachDemBau(gebaeude);
  }

  // Nach einem Lager oder einer Muehle sammeln die Bauleute am naechsten
  // passenden Vorrat (bauen AC-1); nach einem Haus stehen sie bereit.
  nachDemBau(gebaeude) {
    const annahme = GEBAEUDE[gebaeude.art].annahme;
    const arten = new Set(Object.entries(SAMMELN)
      .filter(([, s]) => annahme.includes(s.rohstoff))
      .map(([art]) => Number(art)));
    for (const einheit of this.einheiten.values()) {
      if (einheit.auftrag?.art !== 'bauen' || einheit.auftrag.gebaeude !== gebaeude.id) continue;
      einheit.baut = false;
      einheit.auftrag = null;
      // Nach einer Farm bestellt der erste Bauer sie gleich (bauen AC-1).
      if (GEBAEUDE[gebaeude.art].nahrung && !gebaeude.arbeiter) {
        this.farmBeginnen(einheit, gebaeude);
        continue;
      }
      if (!arten.size || gebaeude.art === 'dorfzentrum') continue;
      const feld = this.naechsterVorratAus(einheit, arten);
      if (!feld) continue;
      einheit.auftrag = { art: 'sammeln', feld };
      this.wegZumVorrat(einheit);
    }
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
      case 'bauen':
        return this.bauen(spielerId, nachricht.einheiten, nachricht.art, nachricht.ziel);
      case 'abreissen':
        return this.abreissen(spielerId, nachricht.gebaeude);
      case 'sammelpunkt':
        return this.sammelpunktSetzen(spielerId, nachricht.gebaeude, nachricht.ziel);
      default:
        return this.befehl(spielerId, nachricht.einheiten, nachricht.ziel);
    }
  }

  // Bezahlt wird beim Einreihen (bauen AC-10). Die Absage sagt, warum
  // (bedienung AC-18).
  ausbilden(spielerId, gebaeudeId, art) {
    const gebaeude = this.gebaeude.get(gebaeudeId);
    if (!gebaeude || gebaeude.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebaeude.' };
    if (!gebaeude.fertig) return { fehler: 'Das Gebaeude ist noch nicht fertig.' };
    if (!GEBAEUDE[gebaeude.art].bildetAus.includes(art)) return { fehler: 'Das bildet dieses Gebaeude nicht aus.' };
    if (gebaeude.schlange.length >= SCHLANGE_MAX) return { fehler: 'Die Warteschlange ist voll.' };
    const spieler = this.spielerVon(spielerId);
    // Eine Verbesserung gibt es einmal: erforscht oder schon irgendwo eingereiht.
    if (VERBESSERUNGEN[art]) {
      const eingereiht = [...this.gebaeude.values()].some((g) => g.besitzer === spielerId && g.schlange.includes(art));
      if (spieler.verbesserungen.includes(art) || eingereiht) return { fehler: `${VERBESSERUNGEN[art].name} gibt es nur einmal.` };
    }
    const kosten = this.auftragWerte(art).kosten;
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
    for (const [rohstoff, menge] of Object.entries(this.auftragWerte(art).kosten)) spieler[rohstoff] += menge;
    if (platz === 0) {
      gebaeude.fortschritt = 0;
      gebaeude.wartet = false;
    }
    this.gebaeudeGeaendert(gebaeude);
    return {};
  }

  // Eine Verbesserung wirkt sofort auf alle, die es schon gibt, und auf alle
  // spaeteren (bauen AC-21).
  erforschen(spieler, art) {
    spieler.verbesserungen.push(art);
    for (const [einheitArt, wirkung] of Object.entries(VERBESSERUNGEN[art].wirkung)) {
      for (const einheit of this.einheiten.values()) {
        if (einheit.besitzer === spieler.id && einheit.art === einheitArt) einheit.leben += wirkung.leben || 0;
      }
    }
  }

  // Rechtsklick mit ausgewaehltem Gebaeude (bauen AC-13).
  sammelpunktSetzen(spielerId, gebaeudeId, ziel) {
    const gebaeude = this.gebaeude.get(gebaeudeId);
    if (!gebaeude || gebaeude.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebaeude.' };
    const g = this.karte.groesse;
    const x = Math.round(Number(ziel?.x));
    const y = Math.round(Number(ziel?.y));
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x >= g || y >= g) return { fehler: 'Dort geht kein Sammelpunkt.' };
    gebaeude.sammelpunkt = { x, y };
    this.gebaeudeGeaendert(gebaeude);
    return {};
  }

  // Wohnraum aus den eigenen Gebaeuden, hoechstens 200 (bauen AC-14).
  wohnraum(spieler) {
    let raum = 0;
    for (const g of this.gebaeude.values()) {
      if (g.besitzer === spieler.id && g.fertig) raum += GEBAEUDE[g.art].wohnraum || 0;
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
    if (!gebaeude.fertig) {
      this.baustelleTakten(gebaeude);
      return;
    }
    if (!gebaeude.schlange.length) return;
    const spieler = this.spielerVon(gebaeude.besitzer);
    const belegt = bevoelkerung.get(spieler.id) || 0;
    const art = gebaeude.schlange[0];
    const verbesserung = VERBESSERUNGEN[art];
    // Voll: der Auftrag wartet, statt anzufangen (bauen AC-15) - eine
    // Verbesserung braucht keinen Platz.
    const wartet = !verbesserung && belegt >= this.wohnraum(spieler);
    if (wartet !== gebaeude.wartet) this.gebaeudeGeaendert(gebaeude);
    gebaeude.wartet = wartet;
    if (wartet) return;

    gebaeude.fortschritt++;
    this.gebaeudeGeaendert(gebaeude);
    if (gebaeude.fortschritt < this.auftragWerte(art).zeit * TAKTE_PRO_SEKUNDE) return;

    if (verbesserung) {
      gebaeude.schlange.shift();
      gebaeude.fortschritt = 0;
      this.erforschen(spieler, art);
      return;
    }
    const feld = this.freiesFeldAm(gebaeude);
    if (!feld) return; // alles verstellt: im naechsten Takt wieder versuchen
    gebaeude.schlange.shift();
    gebaeude.fortschritt = 0;
    const neu = this.einheitAnlegen(spieler.id, feld.x, feld.y, art);
    bevoelkerung.set(spieler.id, belegt + 1);
    // Zum Sammelpunkt; liegt er auf einem Vorrat, wird dort gleich gesammelt (bauen AC-13).
    if (gebaeude.sammelpunkt) this.befehl(spieler.id, [neu.id], gebaeude.sammelpunkt);
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
    // Eine eigene Baustelle: wer bauen kann, baut mit (bauen AC-2).
    const baustelle = this.gebaeudeAn(zx, zy);
    // Ein eigenes Schaf in der Naehe des Klicks (einheiten AC-17) - aber nur,
    // wenn auf dem Feld selbst nichts zu sammeln ist: neben Beeren weiden Schafe.
    const schaf = sammeln ? null : this.tierAn(spielerId, Number(ziel.x), Number(ziel.y));

    for (const id of einheitIds.slice(0, 200)) {
      // Ein eigenes, lebendes Schaf wird getrieben (einheiten AC-22).
      const tier = this.tiere.get(id);
      if (tier) {
        if (tier.besitzer !== spielerId || tier.geschlachtet) continue;
        tier.weg = suchen(this.karte, { x: Math.round(tier.x), y: Math.round(tier.y) }, { x: zx, y: zy });
        continue;
      }
      const einheit = this.einheiten.get(id);
      if (!einheit || einheit.besitzer !== spielerId) continue;
      this.farmVerlassen(einheit);
      einheit.sammelt = false;
      einheit.baut = false;
      if (baustelle && !baustelle.fertig && baustelle.besitzer === spielerId
        && (EINHEITEN[einheit.art].baut || []).includes(baustelle.art)) {
        this.bauenBeginnen(einheit, baustelle);
      } else if (baustelle && baustelle.fertig && GEBAEUDE[baustelle.art].nahrung && baustelle.besitzer === spielerId
        && EINHEITEN[einheit.art].tragkraft > 0
        && (!baustelle.arbeiter || baustelle.arbeiter === einheit.id || !this.einheiten.has(baustelle.arbeiter))) {
        this.farmBeginnen(einheit, baustelle);
      } else if (schaf && EINHEITEN[einheit.art].tragkraft > 0) {
        if (einheit.ladung > 0 && einheit.ladungsart !== 'nahrung') {
          einheit.ladung = 0;
          einheit.ladungsart = null;
        }
        einheit.angefangen = 0;
        einheit.auftrag = { art: 'tier', tier: schaf.id };
        this.wegZumTier(einheit, schaf);
      } else if (sammeln && EINHEITEN[einheit.art].tragkraft > 0) {
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

  // ---- Farm (einheiten AC-18) ----------------------------------------------

  farmBeginnen(einheit, farm) {
    this.farmVerlassen(einheit);
    if (einheit.ladung > 0 && einheit.ladungsart !== 'nahrung') {
      einheit.ladung = 0;
      einheit.ladungsart = null;
    }
    einheit.angefangen = 0;
    einheit.sammelt = false;
    einheit.auftrag = { art: 'farm', gebaeude: farm.id };
    farm.arbeiter = einheit.id;
    this.gebaeudeGeaendert(farm);
    this.wegZurFarm(einheit, farm);
  }

  // Wer etwas anderes tut, gibt seine Farm frei.
  farmVerlassen(einheit) {
    if (einheit.auftrag?.art !== 'farm') return;
    const farm = this.gebaeude.get(einheit.auftrag.gebaeude);
    if (farm && farm.arbeiter === einheit.id) {
      farm.arbeiter = null;
      this.gebaeudeGeaendert(farm);
    }
  }

  wegZurFarm(einheit, farm) {
    const ziel = { x: Math.round(farm.x), y: Math.round(farm.y) };
    if (this.aufGrundflaeche(einheit, farm)) {
      einheit.weg = [];
      return;
    }
    einheit.weg = suchen(this.karte, this.feldVon(einheit), ziel);
  }

  farmTakten(einheit) {
    const farm = this.gebaeude.get(einheit.auftrag.gebaeude);
    if (!farm || !farm.fertig || farm.arbeiter !== einheit.id) {
      einheit.auftrag = null;
      einheit.sammelt = false;
      return;
    }
    if (einheit.ladung >= EINHEITEN[einheit.art].tragkraft) {
      einheit.sammelt = false;
      this.abladen(einheit);
      return;
    }
    if (!this.aufGrundflaeche(einheit, farm)) {
      einheit.sammelt = false;
      this.wegZurFarm(einheit, farm);
      if (!einheit.weg.length) einheit.auftrag = null;
      return;
    }
    einheit.sammelt = true;
    einheit.angefangen += GEBAEUDE[farm.art].rate / TAKTE_PRO_SEKUNDE;
    if (einheit.angefangen < 1) return;
    einheit.angefangen -= 1;
    farm.nahrung -= 1;
    einheit.ladung += 1;
    einheit.ladungsart = 'nahrung';
    this.gebaeudeGeaendert(farm);
    // Leer: die Farm ist weg, wie im Original muss eine neue her.
    if (farm.nahrung <= 0) {
      this.gebaeude.delete(farm.id);
      einheit.sammelt = false;
      einheit.auftrag = null;
      if (einheit.ladung > 0) einheit.auftrag = { art: 'farm', gebaeude: farm.id, leer: true };
    }
  }

  // Das naechste eigene Tier hoechstens ein Feld vom Klick entfernt.
  tierAn(spielerId, x, y) {
    let bestes = null;
    let besterAbstand = 1.01;
    for (const tier of this.tiere.values()) {
      if (tier.besitzer !== spielerId) continue;
      const abstand = Math.hypot(tier.x - x, tier.y - y);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = tier;
      }
    }
    return bestes;
  }

  // Neben das Tier, nicht darauf - sonst verdeckt der Hirte den Kadaver.
  wegZumTier(einheit, tier) {
    const feld = { x: Math.round(tier.x), y: Math.round(tier.y) };
    const stand = nachbarfeld(this.karte, feld, einheit);
    einheit.weg = stand ? suchen(this.karte, this.feldVon(einheit), stand) : [];
  }

  // Am Tier: beim ersten Mal schlachten, dann Nahrung nehmen wie an einem
  // Vorrat. Ist es leer, geht es zum naechsten eigenen Tier in der Naehe.
  tierTakten(einheit) {
    let tier = this.tiere.get(einheit.auftrag.tier);
    if (!tier) {
      tier = this.naechstesTier(einheit);
      if (!tier) {
        einheit.auftrag = null;
        einheit.sammelt = false;
        return;
      }
      einheit.auftrag = { art: 'tier', tier: tier.id };
    }
    if (einheit.ladung >= EINHEITEN[einheit.art].tragkraft) {
      einheit.sammelt = false;
      this.abladen(einheit);
      return;
    }
    // Ein Nachbarfeld, auch schraeg (Wurzel aus 2), gilt als am Tier.
    if (Math.hypot(einheit.x - tier.x, einheit.y - tier.y) > 1.5) {
      einheit.sammelt = false;
      this.wegZumTier(einheit, tier);
      if (!einheit.weg.length) einheit.auftrag = null;
      return;
    }
    if (!tier.geschlachtet) {
      tier.geschlachtet = true;
      this.tierAenderungen.push(tier.id);
    }
    einheit.sammelt = true;
    einheit.angefangen += TIERE[tier.art].rate / TAKTE_PRO_SEKUNDE;
    if (einheit.angefangen < 1) return;
    einheit.angefangen -= 1;
    this.tierNahrungNehmen(tier);
    einheit.ladung += 1;
    einheit.ladungsart = 'nahrung';
    if (!this.tiere.has(tier.id) || einheit.ladung >= EINHEITEN[einheit.art].tragkraft) einheit.sammelt = false;
  }

  tierNahrungNehmen(tier) {
    tier.nahrung -= 1;
    this.tierAenderungen.push(tier.id);
    if (tier.nahrung <= 0) this.tiere.delete(tier.id);
  }

  naechstesTier(einheit) {
    let bestes = null;
    let besterAbstand = SUCHWEITE_ERSATZ;
    for (const tier of this.tiere.values()) {
      if (tier.besitzer !== einheit.besitzer) continue;
      // Angefangene Kadaver zuerst: sie verlieren sonst Nahrung.
      const abstand = Math.hypot(tier.x - einheit.x, tier.y - einheit.y) - (tier.geschlachtet ? SUCHWEITE_ERSATZ : 0);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = tier;
      }
    }
    return bestes;
  }

  // Ein Kadaver, an dem niemand arbeitet, verliert je 4 Sekunden eine Nahrung.
  tiereTakten() {
    // Getriebene Schafe laufen; eine Aenderung geht nur, wenn sie sich bewegen.
    for (const tier of this.tiere.values()) {
      if (!tier.weg.length || tier.geschlachtet) continue;
      const tempo = TIERE[tier.art].tempo / TAKTE_PRO_SEKUNDE;
      const ziel = tier.weg[0];
      const dx = ziel.x - tier.x;
      const dy = ziel.y - tier.y;
      const abstand = Math.hypot(dx, dy);
      if (abstand <= tempo) {
        tier.x = ziel.x;
        tier.y = ziel.y;
        tier.weg.shift();
      } else {
        tier.x = Math.round((tier.x + (dx / abstand) * tempo) * 100) / 100;
        tier.y = Math.round((tier.y + (dy / abstand) * tempo) * 100) / 100;
      }
      this.tierAenderungen.push(tier.id);
    }
    // Einmal je Sekunde: fremde Schafe in Sichtweite wechseln den Besitzer,
    // wenn nur einer sie sieht und der alte Besitzer keine Einheit dort hat.
    if (this.takt % TAKTE_PRO_SEKUNDE === 0) this.schafeUebernehmen();
    const bearbeitet = new Set();
    for (const einheit of this.einheiten.values()) {
      if (einheit.sammelt && einheit.auftrag?.art === 'tier') bearbeitet.add(einheit.auftrag.tier);
    }
    for (const tier of [...this.tiere.values()]) {
      if (!tier.geschlachtet || bearbeitet.has(tier.id)) continue;
      tier.verfall += 1;
      if (tier.verfall < TIERE[tier.art].verfall * TAKTE_PRO_SEKUNDE) continue;
      tier.verfall = 0;
      this.tierNahrungNehmen(tier);
    }
  }

  schafeUebernehmen() {
    for (const tier of this.tiere.values()) {
      if (tier.geschlachtet) continue;
      const sicht = TIERE[tier.art].sicht;
      const nahe = new Set();
      for (const einheit of this.einheiten.values()) {
        if (Math.abs(einheit.x - tier.x) > sicht || Math.abs(einheit.y - tier.y) > sicht) continue;
        if (Math.hypot(einheit.x - tier.x, einheit.y - tier.y) <= sicht) nahe.add(einheit.besitzer);
      }
      if (nahe.size !== 1 || nahe.has(tier.besitzer)) continue;
      tier.besitzer = [...nahe][0];
      tier.weg = [];
      this.tierAenderungen.push(tier.id);
    }
  }

  wegZumVorrat(einheit) {
    const stand = nachbarfeld(this.karte, einheit.auftrag.feld, einheit);
    einheit.weg = stand ? suchen(this.karte, this.feldVon(einheit), stand) : [];
  }

  // Abgegeben wird am naechsten fertigen eigenen Gebaeude, das den Rohstoff
  // annimmt (einheiten AC-16) - gemessen an seinem Rand.
  lagerFuer(einheit) {
    let bestes = null;
    let besterAbstand = Infinity;
    for (const gebaeude of this.gebaeude.values()) {
      if (gebaeude.besitzer !== einheit.besitzer || !gebaeude.fertig) continue;
      if (!GEBAEUDE[gebaeude.art].annahme.includes(einheit.ladungsart)) continue;
      const abstand = this.abstandZu(einheit, gebaeude);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = gebaeude;
      }
    }
    return bestes;
  }

  wegZumLager(einheit) {
    const lager = this.lagerFuer(einheit);
    const stand = lager && this.randfeld(lager, einheit);
    einheit.weg = stand ? suchen(this.karte, this.feldVon(einheit), stand) : [];
  }

  takten() {
    this.takt++;
    const bevoelkerung = this.bevoelkerung();
    for (const gebaeude of this.gebaeude.values()) this.gebaeudeTakten(gebaeude, bevoelkerung);
    this.tiereTakten();
    for (const einheit of this.einheiten.values()) this.einheitTakten(einheit);
  }

  einheitTakten(einheit) {
    if (einheit.weg.length) {
      einheit.sammelt = false;
      einheit.baut = false;
      this.laufen(einheit);
      return;
    }
    if (!einheit.auftrag) return;

    if (einheit.auftrag.art === 'bauen') {
      const baustelle = this.gebaeude.get(einheit.auftrag.gebaeude);
      if (!baustelle || baustelle.fertig) {
        einheit.auftrag = null;
        einheit.baut = false;
      } else if (this.abstandZu(einheit, baustelle) <= 1.2) {
        einheit.baut = true;
      } else if (!einheit.baut) {
        // Nicht angekommen und kein Weg mehr: noch einmal suchen, sonst aufgeben.
        const stand = this.randfeld(baustelle, einheit);
        einheit.weg = stand ? this.wegNach(einheit, stand) : [];
        if (!einheit.weg.length) einheit.auftrag = null;
      }
      return;
    }
    if (einheit.auftrag.art === 'tier') {
      this.tierTakten(einheit);
      return;
    }
    if (einheit.auftrag.art === 'farm') {
      // Eine leer gewordene Farm: die letzte Ladung noch abgeben.
      if (einheit.auftrag.leer) {
        if (einheit.ladung > 0) this.abladen(einheit);
        else einheit.auftrag = null;
        return;
      }
      this.farmTakten(einheit);
      return;
    }
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
      this.wegZumLager(einheit);
    }
  }

  abladen(einheit) {
    const spieler = this.spielerVon(einheit.besitzer);
    const lager = this.lagerFuer(einheit);
    if (!lager) return; // nirgends abzugeben: er wartet mit seiner Ladung
    if (this.abstandZu(einheit, lager) > 1.2) {
      this.wegZumLager(einheit);
      return;
    }
    spieler[einheit.ladungsart] += einheit.ladung;
    einheit.ladung = 0;
    einheit.ladungsart = null;
    einheit.angefangen = 0;
    // Zurueck an die Arbeit: zum selben Vorrat, Tier oder zur selben Farm.
    if (einheit.auftrag?.art === 'farm') {
      const farm = this.gebaeude.get(einheit.auftrag.gebaeude);
      if (farm && !einheit.auftrag.leer) this.wegZurFarm(einheit, farm);
      else einheit.auftrag = null;
      return;
    }
    if (einheit.auftrag?.art === 'tier') {
      const tier = this.tiere.get(einheit.auftrag.tier) || this.naechstesTier(einheit);
      if (tier) {
        einheit.auftrag = { art: 'tier', tier: tier.id };
        this.wegZumTier(einheit, tier);
      }
      return;
    }
    this.wegZumVorrat(einheit);
  }

  naechsterVorratAus(einheit, arten) {
    let bestes = null;
    let besterAbstand = SUCHWEITE_ERSATZ;
    for (const index of this.karte.vorrat.keys()) {
      if (!arten.has(this.karte.felder[index])) continue;
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
        ...(e.leben < this.lebenMax(e.besitzer, e.art) ? { h: e.leben } : {}),
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
        ...(s.verbesserungen.length ? { v: s.verbesserungen } : {}),
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
      // Baufortschritt nur fuer Baustellen (darstellung AC-5).
      ...(g.fertig ? {} : { u: Math.round(g.bau * 100) / 100 }),
      ...(g.nahrung !== undefined ? { n: g.nahrung } : {}),
      s: g.schlange,
      f: laufend ? Math.round((g.fortschritt / (this.auftragWerte(laufend).zeit * TAKTE_PRO_SEKUNDE)) * 100) / 100 : 0,
      ...(g.sammelpunkt ? { p: g.sammelpunkt } : {}),
      w: g.wartet,
    };
  }

  tierFuerDraht(id) {
    const tier = this.tiere.get(id);
    if (!tier) return { i: id, weg: true };
    // g: geschlachtet - der Browser zeichnet dann einen Kadaver, der mit n kleiner wird.
    return { i: tier.id, art: tier.art, b: tier.besitzer, x: tier.x, y: tier.y, n: tier.nahrung, g: tier.geschlachtet };
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
          baut: w.baut || [],
        }])),
        gebaeude: Object.fromEntries(Object.entries(GEBAEUDE).map(([art, w]) => [art, {
          leben: w.leben, bildetAus: w.bildetAus, groesse: w.groesse, kosten: w.kosten, bauzeit: w.bauzeit,
          wohnraum: w.wohnraum, annahme: w.annahme, begehbar: Boolean(w.begehbar), nahrung: w.nahrung || null,
        }])),
        verbesserungen: VERBESSERUNGEN,
      },
    };
  }
}

module.exports = { Welt, TAKTE_PRO_SEKUNDE, STARTVORRAT, ROHSTOFFE };
