'use strict';

const karten = require('./karte');
const { suchen, nachbarfeld } = require('./wege');
const {
  EINHEITEN, SAMMELN, TIERE, GEBAEUDE, VERBESSERUNGEN, ZEITALTER, AUFSTIEGE,
  BEVOELKERUNG_MAX, SCHLANGE_MAX, STARTAUFSTELLUNG,
} = require('./daten');

const TAKTE_PRO_SEKUNDE = 10;
const SUCHWEITE_ERSATZ = 12;
// So lange liegt ein Toter noch im Bild, bevor er aus dem Zustand faellt
// (kampf AC-10): lang genug, um zu sehen, was passiert ist.
const TOT_SEKUNDEN = 2;
// Spielraum auf die Reichweite, damit ein Nahkaempfer auch schraeg (1,41
// Felder) zuschlaegt; am Rand einer Grundflaeche messen wir genauer.
const SCHLAGRAND = 0.5;
const SCHLAGRAND_BAU = 0.2;
// So oft sieht sich eine stehende Kampfeinheit um (kampf AC-2): zweimal je
// Sekunde. Jeder Takt waere fuenfmal so teuer und im Spiel nicht zu merken.
const WACHE_TAKTE = 5;
// So weit folgt eine Einheit einem Fluechtenden, gemessen von dem Platz, an
// dem sie stand (kampf AC-3).
const VERFOLGUNG_FELDER = 5;
// Zellengroesse des Suchrasters fuer die Wache. Groesser als jede Sichtweite,
// damit die eigene Zelle und ihre acht Nachbarn alles Sichtbare enthalten.
const RASTER_FELDER = 8;
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

// Namen der Gebaeude fuer Meldungen auf dem Bildschirm - mit echten Umlauten.
const GEBAEUDE_NAMEN = {
  dorfzentrum: 'Das Dorfzentrum',
  haus: 'Das Haus',
  muehle: 'Die Mühle',
  holzfaellerlager: 'Das Holzfällerlager',
  bergbaulager: 'Das Bergbaulager',
  farm: 'Die Farm',
  kaserne: 'Die Kaserne',
  schiessanlage: 'Die Schießanlage',
  stall: 'Der Stall',
  schmiede: 'Die Schmiede',
};

// Dasselbe für die Einheiten (einheiten AC-23).
const EINHEIT_NAMEN = {
  dorfbewohner: 'Den Dorfbewohner',
  spaeherreiter: 'Den Späherreiter',
  miliz: 'Die Miliz',
  speerkaempfer: 'Den Speerkämpfer',
  bogenschuetze: 'Den Bogenschützen',
  plaenkler: 'Den Plänkler',
  soldat: 'Den Soldaten',
};

// Welche Verbesserung eine Einheit zur naechsten Stufe macht - `wandelt`
// einmal umgedreht, damit die Absage den Namen nennen kann (einheiten AC-24).
const STUFE_DURCH = Object.fromEntries(
  Object.entries(VERBESSERUNGEN).flatMap(([v, w]) =>
    Object.values(w.wandelt || {}).map((nach) => [nach, v])),
);

function untaetigeListe(welt, spielerId) {
  const ids = welt.untaetigeVon(spielerId);
  return ids.length ? { u: ids } : {};
}

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
    // Die Schlaege dieses Taktes, abgerechnet an seinem Ende (kampf AC-10).
    this.schlaege = [];

    this.spieler = spielerListe.map((eintrag, i) => ({
      id: eintrag.id,
      name: eintrag.name,
      farbe: FARBEN[i % FARBEN.length],
      ...start,
      basis: this.karte.basen[i],
      verbesserungen: [], // erforscht, in der Reihenfolge des Abschlusses
      zeitalter: 0, // jede Partie beginnt in der Dunklen Zeit (spielziel AC-1)
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

  // Werte eines Auftrags in der Schlange: Einheit, Verbesserung oder Aufstieg.
  // Alle drei haben `kosten` und `zeit` - deshalb rechnet die Schlange mit
  // allen dreien gleich, und ein Abbruch erstattet voll (bauen AC-11, AC-23).
  auftragWerte(art) {
    return EINHEITEN[art] || VERBESSERUNGEN[art] || AUFSTIEGE[art];
  }

  // Ein Auftrag, der keinen Platz in der Bevoelkerung braucht: Verbesserung
  // oder Aufstieg. Er laeuft auch, wenn die Bevoelkerung voll ist.
  ohnePlatz(art) {
    return Boolean(VERBESSERUNGEN[art] || AUFSTIEGE[art]);
  }

  // Zeitalter eines Gebaeudes; ohne Angabe die Dunkle Zeit.
  gebaeudeZeitalter(art) {
    return GEBAEUDE[art].zeitalter || 0;
  }

  /**
   * Fertige eigene Gebaeude des laufenden Zeitalters, ausser Haeusern - die
   * Voraussetzung des Aufstiegs (bauen AC-23). Das Dorfzentrum zaehlt mit,
   * also fehlt noch ein gebautes.
   */
  gebaeudeDerZeit(spieler) {
    let zahl = 0;
    for (const g of this.gebaeude.values()) {
      if (g.besitzer !== spieler.id || !g.fertig || g.art === 'haus') continue;
      if (this.gebaeudeZeitalter(g.art) === spieler.zeitalter) zahl += 1;
    }
    return zahl;
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
      angriffslauf: null, // Marschziel, solange ein Angriffslauf laeuft (kampf AC-4)
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
    const spieler = this.spielerVon(spielerId);
    // Erst das Zeitalter, dann der Platz (bauen AC-24).
    const noetig = this.gebaeudeZeitalter(art);
    if (noetig > spieler.zeitalter) {
      return { fehler: `${GEBAEUDE_NAMEN[art] || art} gibt es erst in ${ZEITALTER[noetig].genitiv}.` };
    }
    const x = Math.round(Number(ziel.x));
    const y = Math.round(Number(ziel.y));
    if (!this.platzPruefen(art, x, y)) return { fehler: 'Hier ist kein Platz.' };
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
        return this.befehl(spielerId, nachricht.einheiten, nachricht.ziel, Boolean(nachricht.angriffslauf));
    }
  }

  // Bezahlt wird beim Einreihen (bauen AC-10). Die Absage sagt, warum
  // (bedienung AC-18).
  ausbilden(spielerId, gebaeudeId, art) {
    const gebaeude = this.gebaeude.get(gebaeudeId);
    if (!gebaeude || gebaeude.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebaeude.' };
    if (!gebaeude.fertig) return { fehler: 'Das Gebaeude ist noch nicht fertig.' };
    // Die zweite Stufe einer Einheit zaehlt als ihre Grundstufe: die Kaserne
    // bildet die Miliz aus, nach der Verbesserung kommt daraus ein Soldat
    // (einheiten AC-24).
    const grundstufe = EINHEITEN[art]?.stufeVon || art;
    if (!GEBAEUDE[gebaeude.art].bildetAus.includes(grundstufe)) return { fehler: 'Das bildet dieses Gebaeude nicht aus.' };
    if (gebaeude.schlange.length >= SCHLANGE_MAX) return { fehler: 'Die Warteschlange ist voll.' };
    const spieler = this.spielerVon(spielerId);
    // Welche Stufe dieser Spieler ausbildet, haengt an seinen Verbesserungen:
    // ohne sie gibt es den Soldaten nicht, mit ihr nur noch ihn.
    const stufe = this.einheitenStufe(spieler, grundstufe);
    if (art !== stufe && EINHEITEN[art]?.stufeVon) {
      const noch = VERBESSERUNGEN[STUFE_DURCH[art]]?.name || art;
      return { fehler: `${EINHEIT_NAMEN[art] || art} gibt es erst mit der Verbesserung „${noch}".` };
    }
    art = stufe;
    // Eine Einheit kann ein spaeteres Zeitalter verlangen als ihr Gebaeude:
    // die Kaserne steht in der Dunklen Zeit, der Speerkaempfer kommt erst mit
    // der Feudalzeit (einheiten AC-23).
    // Dasselbe gilt fuer eine Verbesserung: die Soldatenstufe gibt es erst in
    // der Feudalzeit (einheiten AC-24).
    const noetig = (EINHEITEN[art] || VERBESSERUNGEN[art])?.zeitalter || 0;
    if (noetig > spieler.zeitalter) {
      const wer = EINHEIT_NAMEN[art] || VERBESSERUNGEN[art]?.name || art;
      return { fehler: `${wer} gibt es erst in ${ZEITALTER[noetig].genitiv}.` };
    }
    // Der Aufstieg: nur der naechste, nur einmal, und nur mit genug Gebaeuden
    // des laufenden Zeitalters (bauen AC-23).
    if (AUFSTIEGE[art]) {
      const aufstieg = AUFSTIEGE[art];
      if (aufstieg.stufe <= spieler.zeitalter) return { fehler: `Die ${aufstieg.name} ist schon erreicht.` };
      if (aufstieg.stufe > spieler.zeitalter + 1) {
        return { fehler: `Erst die ${ZEITALTER[spieler.zeitalter + 1].name}, dann die ${aufstieg.name}.` };
      }
      const laeuft = [...this.gebaeude.values()].some((g) => g.besitzer === spielerId && g.schlange.includes(art));
      if (laeuft) return { fehler: `Der Aufstieg in die ${aufstieg.name} läuft schon.` };
      const haben = this.gebaeudeDerZeit(spieler);
      if (haben < aufstieg.voraussetzung) {
        return { fehler: `Erst ${aufstieg.voraussetzung} fertige Gebäude ${ZEITALTER[spieler.zeitalter].genitiv} außer Häusern — vorhanden: ${haben}.` };
      }
    }
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
    // `wandelt` tauscht die Einheit aus, statt sie aufzuwerten: jede Miliz
    // wird zum Soldaten, ohne neu ausgebildet zu werden - die stehenden, die
    // in den Warteschlangen und alle spaeteren (einheiten AC-24).
    for (const [von, nach] of Object.entries(VERBESSERUNGEN[art].wandelt || {})) {
      const mehr = this.lebenMax(spieler.id, nach) - this.lebenMax(spieler.id, von);
      for (const einheit of this.einheiten.values()) {
        if (einheit.besitzer !== spieler.id || einheit.art !== von) continue;
        einheit.art = nach;
        // Das Leben waechst mit, der Schaden bleibt stehen.
        einheit.leben += mehr;
      }
      for (const g of this.gebaeude.values()) {
        if (g.besitzer !== spieler.id || !g.schlange.includes(von)) continue;
        g.schlange = g.schlange.map((a) => (a === von ? nach : a));
        this.gebaeudeGeaendert(g);
      }
    }
  }

  // Welche Stufe einer Einheit dieser Spieler ausbildet (einheiten AC-24).
  einheitenStufe(spieler, art) {
    for (const v of spieler?.verbesserungen || []) {
      const nach = VERBESSERUNGEN[v].wandelt?.[art];
      if (nach) return nach;
    }
    return art;
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
    // Ein Toter zaehlt nicht mehr mit, auch wenn er noch liegt (kampf AC-10).
    for (const e of this.einheiten.values()) {
      if (e.tot) continue;
      zahl.set(e.besitzer, (zahl.get(e.besitzer) || 0) + 1);
    }
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
    const aufstieg = AUFSTIEGE[art];
    // Voll: der Auftrag wartet, statt anzufangen (bauen AC-15) - eine
    // Verbesserung und ein Aufstieg brauchen keinen Platz.
    const wartet = !this.ohnePlatz(art) && belegt >= this.wohnraum(spieler);
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
    // Der Aufstieg aendert nur die Stufe; was er oeffnet, haengt an den Daten
    // der Gebaeude und Einheiten (bauen AC-23, spielziel AC-1).
    if (aufstieg) {
      gebaeude.schlange.shift();
      gebaeude.fortschritt = 0;
      spieler.zeitalter = aufstieg.stufe;
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

  // Untaetig (einheiten AC-21): ein Dorfbewohner, der weder laeuft noch
  // sammelt, huetet, eine Farm bestellt oder baut. Dieselbe Regel nutzt der
  // Pruefstand (ki AC-6) - eine Stelle, nicht zwei.
  untaetig(einheit) {
    if (einheit.tot) return false;
    return einheit.art === 'dorfbewohner' && !einheit.weg.length && !einheit.sammelt && !einheit.baut;
  }

  /**
   * Woran ein Dorfbewohner gerade arbeitet (bedienung AC-32): Schaf und Farm
   * sind Nahrung, ein Vorratsfeld sagt es selbst; wer nur traegt, zaehlt zu
   * seiner Ladung. Zurueck kommt der Rohstoff oder null.
   */
  arbeitetAn(einheit) {
    if (einheit.art !== 'dorfbewohner') return null;
    const auftrag = einheit.auftrag;
    if (auftrag?.art === 'tier' || auftrag?.art === 'farm') return 'nahrung';
    if (auftrag?.art === 'sammeln') {
      const feld = this.karte.felder[auftrag.feld.y * this.karte.groesse + auftrag.feld.x];
      return SAMMELN[feld]?.rohstoff || einheit.ladungsart || null;
    }
    return einheit.ladung > 0 ? einheit.ladungsart : null;
  }

  /** Arbeiter je Rohstoff eines Spielers, in der Reihenfolge von ROHSTOFFE. */
  arbeiterVon(spielerId) {
    const zahl = { holz: 0, nahrung: 0, gold: 0, stein: 0 };
    for (const e of this.einheiten.values()) {
      if (e.besitzer !== spielerId) continue;
      const rohstoff = this.arbeitetAn(e);
      if (rohstoff) zahl[rohstoff] += 1;
    }
    return ROHSTOFFE.map((r) => zahl[r]);
  }

  untaetigeVon(spielerId) {
    const ids = [];
    for (const e of this.einheiten.values()) if (e.besitzer === spielerId && this.untaetig(e)) ids.push(e.id);
    return ids;
  }

  spielerVon(id) {
    return this.spieler.find((s) => s.id === id) || null;
  }

  feldVon(einheit) {
    return { x: Math.round(einheit.x), y: Math.round(einheit.y) };
  }

  // Ein Befehl kommt aus dem Browser und ist damit erst einmal unglaubwuerdig:
  // nur eigene Einheiten, nur Felder auf der Karte.
  /**
   * Ein Rechtsklick: hingehen, sammeln, bauen, angreifen - was aus dem
   * geklickten Feld zu lesen ist.
   *
   * @param {boolean} [angriffslauf] Der Angriffslauf (kampf AC-4): unterwegs
   *   wird angegriffen, was im Weg steht, und danach der Marsch fortgesetzt.
   *   Er ist der **einzige** Befehl, der nicht aus dem Feld folgt - deshalb
   *   kommt er als Angabe mit. Sammeln, Bauen und Schafe sind dabei aus: wer
   *   zum Gefecht laeuft, faengt unterwegs nicht an zu holzen.
   */
  befehl(spielerId, einheitIds, ziel, angriffslauf = false) {
    if (!Array.isArray(einheitIds) || !ziel) return;
    const g = this.karte.groesse;
    const zx = Math.round(Number(ziel.x));
    const zy = Math.round(Number(ziel.y));
    if (!Number.isInteger(zx) || !Number.isInteger(zy)) return;
    if (zx < 0 || zy < 0 || zx >= g || zy >= g) return;

    // Holz, Beeren, Gold und Stein sind sammelbar (einheiten AC-15) - beim
    // Angriffslauf nicht.
    const sammeln = angriffslauf ? null : SAMMELN[this.karte.felder[zy * g + zx]];
    // Eine eigene Baustelle: wer bauen kann, baut mit (bauen AC-2).
    const baustelle = this.gebaeudeAn(zx, zy);
    // Etwas Fremdes unter dem Klick wird angegriffen (kampf AC-1) - kein
    // eigener Knopf, keine eigene Betriebsart: der Server liest es aus dem Feld.
    const feind = this.feindAn(spielerId, Number(ziel.x), Number(ziel.y));
    const feindBau = !feind && baustelle && baustelle.besitzer !== spielerId ? baustelle : null;
    // Ein eigenes Schaf in der Naehe des Klicks (einheiten AC-17) - aber nur,
    // wenn auf dem Feld selbst nichts zu sammeln ist: neben Beeren weiden Schafe.
    const schaf = sammeln || angriffslauf ? null : this.tierAn(spielerId, Number(ziel.x), Number(ziel.y));
    // Ein Befehl fuer viele (einheiten AC-20): wer geht, bekommt ein eigenes Feld
    // um das Ziel; wer sammelt, einen eigenen Vorrat derselben Art daneben.
    const gruppe = einheitIds.slice(0, 200).map((id) => this.einheiten.get(id)).filter((e) => e && e.besitzer === spielerId);
    let aufstellung = null;
    let angriffsfelder = null;
    let vorraete = null;
    let naechsterVorrat = 0;

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
      einheit.unerreichbar = null;
      // Jeder neue Befehl beendet einen laufenden Angriffslauf.
      einheit.angriffslauf = null;
      if ((feind || feindBau) && EINHEITEN[einheit.art].angriff > 0) {
        const opfer = feind || feindBau;
        // Mehrere Angreifer stellen sich um das Ziel herum, statt uebereinander
        // zu stehen - dieselbe Aufstellung wie beim Gehen (einheiten AC-20).
        angriffsfelder ??= this.angriffsfelder(opfer, gruppe.length, Boolean(feindBau));
        this.angriffBeginnen(einheit, opfer, Boolean(feindBau), this.naechstesFreies(einheit, angriffsfelder));
      } else if (!angriffslauf && baustelle && !baustelle.fertig && baustelle.besitzer === spielerId
        && (EINHEITEN[einheit.art].baut || []).includes(baustelle.art)) {
        this.bauenBeginnen(einheit, baustelle);
      } else if (!angriffslauf && baustelle && baustelle.fertig && GEBAEUDE[baustelle.art].nahrung && baustelle.besitzer === spielerId
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
        vorraete ??= this.vorraeteUm({ x: zx, y: zy }, gruppe.length);
        const feld = vorraete[naechsterVorrat++ % vorraete.length];
        einheit.auftrag = { art: 'sammeln', feld };
        this.wegZumVorrat(einheit);
      } else {
        aufstellung ??= this.aufstellungUm({ x: zx, y: zy }, gruppe.length);
        const feld = this.naechstesFreies(einheit, aufstellung) || { x: zx, y: zy };
        // Der Angriffslauf merkt sich das Marschziel: nach jedem Gefecht
        // unterwegs geht es dorthin weiter (kampf AC-4).
        if (angriffslauf && EINHEITEN[einheit.art].angriff > 0) einheit.angriffslauf = feld;
        einheit.auftrag = { art: 'gehen', feld };
        einheit.weg = this.wegNach(einheit, feld);
      }
    }
  }

  // Freie Felder um ein Ziel, nach Abstand - das Ziel selbst zuerst, wenn frei
  // (einheiten AC-20). Genug fuer n Einheiten, oder so viele es gibt.
  aufstellungUm(ziel, n) {
    const felder = [];
    for (let r = 0; r < 12 && felder.length < n; r++) {
      const ring = [];
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (karten.begehbar(this.karte, ziel.x + dx, ziel.y + dy)) ring.push({ x: ziel.x + dx, y: ziel.y + dy, d: Math.hypot(dx, dy) });
        }
      }
      ring.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x);
      for (const f of ring) felder.push({ x: f.x, y: f.y, frei: true });
    }
    return felder;
  }

  // Das naechste noch freie Feld der Aufstellung - wer nahe steht, nimmt nahe Felder.
  naechstesFreies(einheit, aufstellung) {
    let bestes = null;
    let besterAbstand = Infinity;
    for (const f of aufstellung) {
      if (!f.frei) continue;
      const abstand = Math.hypot(f.x - einheit.x, f.y - einheit.y);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = f;
      }
    }
    if (!bestes) return null;
    bestes.frei = false;
    return { x: bestes.x, y: bestes.y };
  }

  // Vorraete derselben Art um ein Feld, das Feld selbst zuerst, dann nach
  // Abstand - Sammler verteilen sich darauf, statt alle an einem zu stehen.
  vorraeteUm(ziel, n) {
    const g = this.karte.groesse;
    const art = this.karte.felder[ziel.y * g + ziel.x];
    const felder = [];
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const x = ziel.x + dx;
        const y = ziel.y + dy;
        if (x < 0 || y < 0 || x >= g || y >= g) continue;
        const index = y * g + x;
        if (this.karte.felder[index] !== art || !(this.karte.vorrat.get(index) > 0)) continue;
        felder.push({ x, y, d: Math.hypot(dx, dy) });
      }
    }
    felder.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x);
    const auswahl = felder.slice(0, Math.max(1, n)).map(({ x, y }) => ({ x, y }));
    return auswahl.length ? auswahl : [ziel];
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

  // ---- Kampf (kampf AC-1, AC-6 bis AC-8, AC-10) ---------------------------

  // Die naechste fremde, lebende Einheit hoechstens ein Feld vom Klick
  // entfernt - gemessen wie beim eigenen Schaf (einheiten AC-17).
  feindAn(spielerId, x, y) {
    let bestes = null;
    let besterAbstand = 1.01;
    for (const einheit of this.einheiten.values()) {
      if (einheit.besitzer === spielerId || einheit.tot) continue;
      const abstand = Math.hypot(einheit.x - x, einheit.y - y);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = einheit;
      }
    }
    return bestes;
  }

  // Freie Felder um ein Ziel, auf die sich Angreifer verteilen. Das Ziel
  // selbst ist keines - darauf stellt sich niemand.
  angriffsfelder(ziel, anzahl, istGebaeude) {
    const mitte = istGebaeude ? { x: ziel.x, y: ziel.y } : this.feldVon(ziel);
    return this.aufstellungUm(mitte, anzahl + 1).filter((f) => f.x !== mitte.x || f.y !== mitte.y);
  }

  // Gemerkt wird das **Ziel**, nicht sein Platz: eine Einheit laeuft weg.
  // `heimat` steht nur in einem Angriff, den niemand befohlen hat - er begrenzt
  // die Verfolgung (kampf AC-3).
  angriffBeginnen(einheit, ziel, istGebaeude, stand = null, heimat = null) {
    // Die Seite, von der aus angegriffen wird, wird als Versatz zum Ziel
    // gemerkt - nicht als Feld. Ein Ziel laeuft weg, und ohne diesen Versatz
    // suchen danach zwei Angreifer dasselbe Nachbarfeld (Runde 64).
    let platz = null;
    if (stand && !istGebaeude) {
      const feld = this.feldVon(ziel);
      platz = { dx: stand.x - feld.x, dy: stand.y - feld.y };
    }
    einheit.auftrag = {
      art: 'angreifen',
      ziel: ziel.id,
      gebaeude: Boolean(istGebaeude),
      ...(platz ? { platz } : {}),
      ...(heimat ? { heimat } : {}),
    };
    einheit.nachladen = 0;
    einheit.weg = stand ? this.wegNach(einheit, stand) : [];
  }

  /**
   * Wohin ein Nahkaempfer laeuft, der sein Ziel neu suchen muss: auf die Seite,
   * die ihm beim Befehl zugewiesen wurde (`platz`), gemessen am jetzigen Feld
   * des Ziels. Nur die acht Felder rundum taugen - wer weiter aussen aufgestellt
   * war, nimmt wie bisher das naechste Nachbarfeld, sonst stuende er neben dem
   * Kampf.
   */
  angriffsplatz(einheit, ziel, platz) {
    const feld = this.feldVon(ziel);
    if (platz && Math.abs(platz.dx) <= 1 && Math.abs(platz.dy) <= 1) {
      const seite = { x: feld.x + platz.dx, y: feld.y + platz.dy };
      if (karten.begehbar(this.karte, seite.x, seite.y)) return seite;
    }
    return nachbarfeld(this.karte, feld, einheit);
  }

  /**
   * Ein grobes Raster aller lebenden Einheiten. Damit sucht eine Wache nur in
   * ihrer Zelle und den acht Nachbarn statt in der ganzen Partie: aus
   * Einheiten x Einheiten wird Einheiten x Nachbarschaft.
   */
  einheitenRaster() {
    const raster = new Map();
    for (const einheit of this.einheiten.values()) {
      if (einheit.tot) continue;
      const schluessel = `${Math.floor(einheit.x / RASTER_FELDER)},${Math.floor(einheit.y / RASTER_FELDER)}`;
      const zelle = raster.get(schluessel);
      if (zelle) zelle.push(einheit);
      else raster.set(schluessel, [einheit]);
    }
    return raster;
  }

  /** Die naechste fremde, lebende Einheit in Sichtweite - gesucht im Raster. */
  feindInSicht(einheit, raster, sicht) {
    const zx = Math.floor(einheit.x / RASTER_FELDER);
    const zy = Math.floor(einheit.y / RASTER_FELDER);
    let bestes = null;
    let besterAbstand = sicht;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const zelle = raster.get(`${zx + dx},${zy + dy}`);
        if (!zelle) continue;
        for (const anderer of zelle) {
          if (anderer.besitzer === einheit.besitzer) continue;
          const abstand = Math.hypot(anderer.x - einheit.x, anderer.y - einheit.y);
          if (abstand <= besterAbstand) {
            besterAbstand = abstand;
            bestes = anderer;
          }
        }
      }
    }
    return bestes;
  }

  /**
   * Was in die Sichtweite einer stehenden Kampfeinheit kommt, wird ohne Befehl
   * angegriffen (kampf AC-2). Stehend heisst: kein Auftrag und kein Weg - wer
   * unterwegs ist, geht weiter. Gebaeude bleiben ungeschoren; sonst liefe jede
   * Wache ins fremde Dorfzentrum, statt zu Hause zu wachen.
   */
  wacheTakten() {
    const wachen = [];
    for (const einheit of this.einheiten.values()) {
      if (einheit.tot || einheit.auftrag?.art === 'angreifen') continue;
      // Wer im Angriffslauf ist, sieht sich auch **unterwegs** um (kampf AC-4);
      // alle anderen nur im Stehen - ein Sammler soll seine Arbeit nicht
      // wegen eines Vorbeireitenden liegen lassen (kampf AC-2).
      if (einheit.angriffslauf) {
        if (EINHEITEN[einheit.art].angriff > 0) wachen.push(einheit);
        continue;
      }
      if (einheit.auftrag || einheit.weg.length) continue;
      if (!EINHEITEN[einheit.art].wacht) continue;
      wachen.push(einheit);
    }
    if (!wachen.length) return;
    const raster = this.einheitenRaster();
    const funde = [];
    for (const einheit of wachen) {
      const feind = this.feindInSicht(einheit, raster, EINHEITEN[einheit.art].sicht);
      if (feind) funde.push({ einheit, feind });
    }
    if (!funde.length) return;
    // Mehrere Waechter desselben Ziels verteilen sich darum, statt uebereinander
    // zu stehen: das Ziel wird einmal aufgestellt, jeder nimmt das naechste
    // noch freie Feld. Ohne das standen zwei Milizen, die zusammen losgeschickt
    // wurden, auf demselben Punkt (Runde 67) - `nachbarfeld` fragt die Karte,
    // nicht die Einheiten.
    const felderJeZiel = new Map();
    for (const { feind } of funde) {
      if (!felderJeZiel.has(feind.id)) felderJeZiel.set(feind.id, this.angriffsfelder(feind, 8, false));
    }
    for (const andere of this.einheiten.values()) {
      const auftrag = andere.auftrag;
      if (andere.tot || auftrag?.art !== 'angreifen' || auftrag.gebaeude || !auftrag.platz) continue;
      const felder = felderJeZiel.get(auftrag.ziel);
      const ziel = felder && this.einheiten.get(auftrag.ziel);
      if (!ziel) continue;
      const feld = this.feldVon(ziel);
      for (const f of felder) {
        if (f.x === feld.x + auftrag.platz.dx && f.y === feld.y + auftrag.platz.dy) f.frei = false;
      }
    }
    for (const { einheit, feind } of funde) {
      const stand = EINHEITEN[einheit.art].reichweite
        ? null
        : this.naechstesFreies(einheit, felderJeZiel.get(feind.id))
          || nachbarfeld(this.karte, this.feldVon(feind), einheit);
      this.angriffBeginnen(einheit, feind, false, stand, this.feldVon(einheit));
    }
  }

  /**
   * Nach einem Gefecht unterwegs geht es weiter zum Marschziel (kampf AC-4).
   * Ohne Angriffslauf tut das nichts - dann bleibt stehen, wer gekaempft hat.
   */
  marschFortsetzen(einheit) {
    if (!einheit.angriffslauf) return;
    const feld = einheit.angriffslauf;
    einheit.auftrag = { art: 'gehen', feld };
    einheit.weg = this.wegNach(einheit, feld);
  }

  // Ein Takt im Angriff: hinlaufen, bis das Ziel in Reichweite ist, dann
  // zuschlagen, sooft die Nachladezeit es erlaubt (kampf AC-1, AC-7).
  angriffTakten(einheit) {
    einheit.sammelt = false;
    einheit.baut = false;
    const auftrag = einheit.auftrag;
    const ziel = auftrag.gebaeude ? this.gebaeude.get(auftrag.ziel) : this.einheiten.get(auftrag.ziel);
    // Das Ziel ist gefallen, waehrend der Angreifer noch hinlief: stehenbleiben,
    // nicht auf das leere Feld weiterlaufen.
    if (!ziel || ziel.tot) {
      einheit.auftrag = null;
      einheit.weg = [];
      this.marschFortsetzen(einheit);
      return;
    }
    // Eine Verfolgung, die niemand befohlen hat, endet fuenf Felder vom
    // Ausgangsplatz (kampf AC-3) - sonst zieht ein einzelner Reiter ein ganzes
    // Heer quer ueber die Karte. Die Einheit kehrt dorthin zurueck.
    if (auftrag.heimat
      && Math.hypot(einheit.x - auftrag.heimat.x, einheit.y - auftrag.heimat.y) > VERFOLGUNG_FELDER) {
      einheit.auftrag = null;
      // Im Angriffslauf geht es nicht zurueck, sondern weiter: das Marschziel
      // ist der Sinn des Befehls, der Ausgangsplatz nur eine Zwischenstation.
      if (einheit.angriffslauf) this.marschFortsetzen(einheit);
      else einheit.weg = this.wegNach(einheit, auftrag.heimat);
      return;
    }
    const fern = EINHEITEN[einheit.art].reichweite;
    const reichweite = fern || 1;
    const abstand = auftrag.gebaeude
      ? this.abstandZu(einheit, ziel)
      : Math.hypot(ziel.x - einheit.x, ziel.y - einheit.y);
    const nahGenug = abstand <= reichweite + (auftrag.gebaeude ? SCHLAGRAND_BAU : SCHLAGRAND);
    // Ein Fernkaempfer bleibt stehen, sobald das Ziel in Reichweite ist. Ein
    // Nahkaempfer geht beim **ersten** Hinlaufen den Platz zu Ende, der ihm
    // zugewiesen wurde - sonst bleiben drei Angreifer dort stehen, wo der erste
    // gerade nah genug war, und stehen im Bild uebereinander (Runde 63). Wer
    // einmal angekommen war, schlaegt dagegen zu, sobald er wieder in
    // Reichweite ist: zwei, die hintereinander herlaufen, kaempfen sonst nie
    // (Runde 64).
    if (nahGenug) auftrag.angekommen = true;
    if (!nahGenug || (einheit.weg.length && !fern && !auftrag.angekommen)) {
      if (einheit.weg.length) {
        this.laufen(einheit);
        return;
      }
      // Kein Weg mehr: einen neuen suchen. Findet die Suche keinen, endet der
      // Auftrag - sonst rechnete die Einheit in jedem Takt die ganze Karte ab.
      const stand = auftrag.gebaeude
        ? this.randfeld(ziel, einheit)
        : this.angriffsplatz(einheit, ziel, auftrag.platz);
      einheit.weg = stand ? this.wegNach(einheit, stand) : [];
      if (!einheit.weg.length) einheit.auftrag = null;
      return;
    }
    einheit.weg = [];
    if (einheit.nachladen > 0) {
      einheit.nachladen--;
      return;
    }
    // Der erste Schlag kommt sofort, danach zaehlt die Nachladezeit aus den
    // Daten (kampf AC-7). Der Takt dieses Schlages geht mit ab, damit zwischen
    // zwei Treffern genau die Zeit der Vorlage liegt und nicht ein Takt mehr.
    einheit.nachladen = Math.round(EINHEITEN[einheit.art].nachladen * TAKTE_PRO_SEKUNDE) - 1;
    this.schlagen(einheit, ziel, auftrag.gebaeude);
  }

  /**
   * Schaden nach der Vorlage (kampf AC-6): Angriff minus die Ruestung des Ziels
   * in der Art dieses Angriffs - nah oder fern -, plus den Bonus des
   * Angreifers auf eine Ruestungsklasse des Ziels, mindestens 1. Eine Formel
   * fuer alle, ohne Zufall (kampf AC-8).
   */
  schaden(angreifer, ziel, istGebaeude) {
    const a = EINHEITEN[angreifer.art];
    const werte = istGebaeude ? GEBAEUDE[ziel.art] : EINHEITEN[ziel.art];
    const ruestung = (a.reichweite ? werte.fernruestung : werte.nahruestung) || 0;
    let bonus = 0;
    for (const klasse of werte.klassen || []) bonus += a.bonus?.[klasse] || 0;
    return Math.max(1, a.angriff - ruestung + bonus);
  }

  // Ein Schlag wird vorgemerkt, nicht sofort verrechnet: abgerechnet wird am
  // Ende des Taktes. So toeten zwei Einheiten, die einander den letzten Schlag
  // versetzen, sich beide - kein Vorrang fuer den, der zuerst dran war.
  schlagen(angreifer, ziel, istGebaeude) {
    this.schlaege.push({
      angreifer, ziel, schaden: this.schaden(angreifer, ziel, istGebaeude), gebaeude: istGebaeude,
    });
  }

  schlaegeAbrechnen() {
    if (!this.schlaege.length) return;
    for (const schlag of this.schlaege) schlag.ziel.leben -= schlag.schaden;
    for (const { angreifer, ziel, gebaeude } of this.schlaege) {
      if (gebaeude) {
        if (!this.gebaeude.has(ziel.id)) continue;
        this.gebaeudeGeaendert(ziel);
        if (ziel.leben <= 0) this.gebaeudeZerstoeren(ziel);
      } else if (ziel.leben <= 0 && !ziel.tot) {
        this.einheitSterben(ziel);
      } else {
        this.wehren(ziel, angreifer);
      }
    }
    this.schlaege = [];
  }

  /**
   * Wer getroffen wird und nicht von selbst wacht, laesst die Arbeit liegen und
   * schlaegt zurueck (kampf AC-2, zweiter Satz). Das betrifft den Dorfbewohner:
   * er arbeitet weiter, **bis** er getroffen wird. Auch diese Gegenwehr ist
   * eine Verfolgung, die niemand befohlen hat - sie endet nach fuenf Feldern.
   */
  wehren(einheit, angreifer) {
    if (einheit.tot || !angreifer || angreifer.tot) return;
    if (EINHEITEN[einheit.art].wacht) return;
    if (einheit.auftrag?.art === 'angreifen' || !EINHEITEN[einheit.art].angriff) return;
    const stand = nachbarfeld(this.karte, this.feldVon(angreifer), einheit);
    this.angriffBeginnen(einheit, angreifer, false, stand, this.feldVon(einheit));
  }

  // Ein Toter liegt noch zwei Sekunden im Bild (kampf AC-10), tut aber nichts
  // mehr: kein Auftrag, keine Bevoelkerung, kein Ziel fuer einen Angriff.
  einheitSterben(einheit) {
    this.farmVerlassen(einheit);
    einheit.leben = 0;
    einheit.tot = true;
    // Der Takt des Todes steht getrennt daneben: Takt 0 waere als Schalter
    // falsch gelesen worden.
    einheit.gefallen = this.takt;
    einheit.auftrag = null;
    einheit.weg = [];
    einheit.sammelt = false;
    einheit.baut = false;
  }

  // Ein Gebaeude ohne Leben verschwindet samt seinem Platz auf der Karte.
  // Truemmer gibt es nicht - die waeren eine Entscheidung fuer Stufe C.
  gebaeudeZerstoeren(gebaeude) {
    this.gebaeude.delete(gebaeude.id);
    this.freigeben(gebaeude);
    this.gebaeudeGeaendert(gebaeude);
  }

  takten() {
    this.takt++;
    const bevoelkerung = this.bevoelkerung();
    for (const gebaeude of this.gebaeude.values()) this.gebaeudeTakten(gebaeude, bevoelkerung);
    this.tiereTakten();
    // Zweimal je Sekunde sehen sich stehende Kampfeinheiten um (kampf AC-2).
    if (this.takt % WACHE_TAKTE === 0) this.wacheTakten();
    for (const einheit of this.einheiten.values()) this.einheitTakten(einheit);
    this.schlaegeAbrechnen();
  }

  einheitTakten(einheit) {
    // Ein Toter liegt zwei Sekunden, dann ist er weg (kampf AC-10).
    if (einheit.tot) {
      if (this.takt - einheit.gefallen >= TOT_SEKUNDEN * TAKTE_PRO_SEKUNDE) this.einheiten.delete(einheit.id);
      return;
    }
    // Angreifen geht vor dem Laufen: wer in Reichweite ist, schlaegt zu, statt
    // seinen Weg zu Ende zu gehen (kampf AC-1).
    if (einheit.auftrag?.art === 'angreifen') {
      this.angriffTakten(einheit);
      return;
    }
    if (einheit.weg.length) {
      einheit.sammelt = false;
      einheit.baut = false;
      this.laufen(einheit);
      return;
    }
    if (!einheit.auftrag) return;

    // Angekommen: der Gehauftrag ist erledigt. Er muss weg, sonst gilt die
    // Einheit fuer die Wache ewig als beschaeftigt und wehrt sich nie mehr
    // (kampf AC-2) - gefunden beim Bau des Angriffslaufs, Runde 67.
    if (einheit.auftrag.art === 'gehen') {
      einheit.auftrag = null;
      einheit.angriffslauf = null;
      return;
    }

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
      if (!einheit.weg.length) this.vorratUnerreichbar(einheit, index);
      return;
    }
    einheit.zuletztGesammelt = this.karte.felder[index];
    einheit.unerreichbar = null;
    einheit.sammelt = true;
  }

  // Kein Weg zum Vorrat (fahrplan AC-6): ein anderer derselben Art nimmt seinen
  // Platz ein, nach dreien gibt die Einheit auf. Vorher suchte sie in jedem
  // Takt neu ueber die ganze Karte - mit 800 Einheiten 98 % der Rechenzeit.
  vorratUnerreichbar(einheit, index) {
    einheit.unerreichbar ??= [];
    einheit.unerreichbar.push(index);
    const ersatz = einheit.unerreichbar.length <= 3
      ? this.naechsterVorrat(einheit, this.karte.felder[index], einheit.unerreichbar)
      : null;
    if (!ersatz) {
      einheit.auftrag = null;
      einheit.unerreichbar = null;
      return;
    }
    einheit.auftrag = { art: 'sammeln', feld: ersatz };
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

  naechsterVorrat(einheit, art, ausser = null) {
    let bestes = null;
    let besterAbstand = SUCHWEITE_ERSATZ;
    for (const index of this.karte.vorrat.keys()) {
      if (art !== undefined && this.karte.felder[index] !== art) continue;
      if (ausser && ausser.includes(index)) continue;
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
        // Arbeitet gerade: sammelt, huetet, bestellt eine Farm oder baut
        // (bedienung AC-31). Nur wenn es zutrifft - ein Zustand bleibt klein.
        ...(e.sammelt || e.baut ? { w: 1 } : {}),
        // Gefallen: der Browser legt ihn hin, bis der Server ihn nimmt
        // (kampf AC-10).
        ...(e.tot ? { s: 1 } : {}),
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
        // Zeitalter als Stufe, nur wenn es nicht die Dunkle Zeit ist
        // (bedienung AC-33) - ein Zustand bleibt klein.
        ...(s.zeitalter ? { z: s.zeitalter } : {}),
        // Untaetige Dorfbewohner, nur wenn es welche gibt (einheiten AC-21).
        ...untaetigeListe(this, s.id),
        // Arbeiter je Rohstoff, in der Reihenfolge holz, nahrung, gold, stein
        // (bedienung AC-32).
        a: this.arbeiterVon(s.id),
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
          // Ohne diese Zeile stuende der Speerkaempfer schon in der Dunklen
          // Zeit im Ausbildungsmenue (einheiten AC-23).
          zeitalter: w.zeitalter || 0,
          // Kampfwerte: die Leiste zeigt sie ab Stufe B5 an der Auswahl.
          angriff: w.angriff || 0, nahruestung: w.nahruestung || 0, fernruestung: w.fernruestung || 0,
          reichweite: w.reichweite || 0,
        }])),
        gebaeude: Object.fromEntries(Object.entries(GEBAEUDE).map(([art, w]) => [art, {
          leben: w.leben, bildetAus: w.bildetAus, groesse: w.groesse, kosten: w.kosten, bauzeit: w.bauzeit,
          wohnraum: w.wohnraum, annahme: w.annahme, begehbar: Boolean(w.begehbar), nahrung: w.nahrung || null,
          zeitalter: w.zeitalter || 0,
        }])),
        verbesserungen: VERBESSERUNGEN,
        // Die Zeitalter und was ein Aufstieg kostet (bauen AC-23, bedienung AC-33).
        zeitalter: ZEITALTER,
        aufstiege: AUFSTIEGE,
      },
    };
  }
}

module.exports = {
  Welt, TAKTE_PRO_SEKUNDE, STARTVORRAT, ROHSTOFFE, VERFOLGUNG_FELDER, WACHE_TAKTE,
};
