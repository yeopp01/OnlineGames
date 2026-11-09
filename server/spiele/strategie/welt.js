'use strict';

const karten = require('./karte');
const { suchen, nachbarfeld } = require('./wege');
const {
  EINHEITEN, SAMMELN, TIERE, GEBAEUDE, VERBESSERUNGEN, ZEITALTER, AUFSTIEGE, KLASSEN, HANDEL,
  BEVOELKERUNG_MAX, SCHLANGE_MAX, STARTAUFSTELLUNG,
} = require('./daten');

const TAKTE_PRO_SEKUNDE = 10;
// Welche Werte die Auswahlleiste je Einheit zeigt (bedienung AC-35). Leben
// steht dabei, weil der Lebensbalken denselben Weg nimmt.
// `sicht` seit Runde 105: der Browser zeichnet den Nebel aus der Sicht der
// eigenen Einheiten (kampf AC-11), mit Verbesserungen.
const KAMPFFELDER = ['leben', 'angriff', 'nahruestung', 'fernruestung', 'reichweite', 'sicht'];
const GEBAEUDEFELDER = ['leben', 'nahruestung', 'fernruestung', 'sicht', 'angriff', 'reichweite', 'nachladen'];
// Die Gebaeude, die schiessen (bauen AC-29): wer in den Daten einen Angriff
// hat. Einmal gezaehlt - `tuermeTakten()` laeuft in jedem Takt.
const SCHIESSENDE = new Set(Object.keys(GEBAEUDE).filter((art) => GEBAEUDE[art].angriff > 0));
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
// Zweimal je Sekunde rechnet der Server, was jeder Spieler sieht (kampf AC-15).
const SICHT_TAKTE = 5;
// Die Werte der Einstellung "Sicht" (kampf AC-16, steckbrief.js).
const SICHT_ARTEN = ['nebel', 'erkundet', 'aufgedeckt'];

// Naeher als ein halbes Feld, und zwei Figuren sind im Bild eine mit zwei
// Schwertern (einheiten AC-29; dieselbe Grenze misst `figurenFrei`).
const AUSWEICHEN_ABSTAND = 0.5;

// Die Meldung "Angriff" (kampf AC-14): ein Gefecht an derselben Stelle meldet
// sich einmal, solange es ohne Pause von zwanzig Sekunden weitergeht; ein
// Angriff fuenfzehn Felder weiter ist ein neuer.
const MELDUNG_PAUSE = 200;

// Hoechstens so viele Pfeile warten auf den naechsten Zustand (bedienung
// AC-40) - genug fuer zwanzig Takte Zeitraffer mit grossen Heeren.
const SCHUESSE_HOECHSTENS = 400;
const MELDUNG_ABSTAND = 15;

// Wie lange einer, der keinen Weg zu irgendeinem Lager fand, wartet, bevor
// er wieder sucht - fuenf Sekunden (ki AC-10, Durchsicht Runde 91). Bis
// dahin stand er ohnehin.
const LAGER_SUCHE_PAUSE = 50;
// So weit folgt eine Einheit einem Fluechtenden, gemessen von dem Platz, an
// dem sie stand (kampf AC-3).
const VERFOLGUNG_FELDER = 5;
// So lange dauert eine Partie hoechstens (spielziel AC-5): steht nach 90
// Spielminuten keine Entscheidung, endet sie unentschieden. Die Zahl kommt
// aus der Vorlage; sie ist eine Grenze, keine erwartete Dauer - gespielt
// werden 25 bis 45 Minuten (AC-2).
const PARTIE_MINUTEN = 90;
// So lange laeuft die Frist, wenn einer sein Buendnis kuendigt (spielziel
// AC-21, ADR-0013): erst danach sind die frueheren Verbuendeten Gegner. Die
// Zahl steht im ADR - genug, um Truppen aus dem fremden Dorf zu holen.
const KUENDIGUNG_SEKUNDEN = 60;
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
  aussenposten: 'Der Außenposten',
  kloster: 'Das Kloster',
  universitaet: 'Die Universität',
  belagerungswerkstatt: 'Die Belagerungswerkstatt',
  wachturm: 'Der Wachturm',
  steinmauer: 'Die Steinmauer',
  tor: 'Das Tor',
  burg: 'Die Burg',
  markt: 'Der Markt',
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
  ritter: 'Den Ritter',
  armbrustschuetze: 'Den Armbrustschützen',
  ramme: 'Die Ramme',
  mangonel: 'Den Mangonel',
  moench: 'Den Mönch',
};

// Welche Verbesserung eine Einheit zur naechsten Stufe macht - `wandelt`
// einmal umgedreht, damit die Absage den Namen nennen kann (einheiten AC-24).
const STUFE_DURCH = Object.fromEntries(
  Object.entries(VERBESSERUNGEN).flatMap(([v, w]) =>
    Object.values(w.wandelt || {}).map((nach) => [nach, v])),
);

/**
 * Unter welchen Schluesseln eine Verbesserung eine Einheit trifft: ihre eigene
 * Art und jede ihrer Klassen (bauen AC-25). So gilt "Nah +1 Angriff" der
 * Infanterie und der Kavallerie, ohne dass die Simulation nach Einheitenarten
 * fragt - und eine neue Einheit erbt die Verbesserungen ihrer Klasse von selbst.
 *
 * Doppelte sind herausgenommen: `bogenschuetze` ist zugleich Art und Klasse,
 * und ohne das zaehlte eine Verbesserung bei ihm zweimal.
 */
function wirkungsschluessel(art) {
  return [...new Set([art, ...(EINHEITEN[art]?.klassen || [])])];
}

/**
 * Das Team eines Spielers aus den Einstellungen (spielziel AC-14):
 * `einstellungen.teams` ist `{ <spielerId>: 1..4 }`. Alles andere - kein
 * Eintrag, 0, eine Zahl ausserhalb, ein Text - heisst: kein Team.
 */
function teamAus(teams, id) {
  const team = teams && Object.hasOwn(teams, id) ? teams[id] : null;
  return Number.isInteger(team) && team >= 1 && team <= 4 ? team : null;
}

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
    // Zufall der Partie (einheiten AC-38: wie lange ein Bekehren dauert) -
    // aus dem Startwert, aber nicht dieselbe Folge wie die der Karte.
    this.zufall = karten.zufallAus((startwert ^ 0x5bd1e995) >>> 0);
    const start = STARTVORRAT[einstellungen.vorrat] || STARTVORRAT.wenig;
    this.takt = 0;
    this.naechsteId = 1;
    this.einheiten = new Map();
    this.gebaeude = new Map();
    // Werte mit Verbesserungen, gemerkt je Spieler (`einheitenwert`). Geleert,
    // sobald dieser Spieler etwas erforscht.
    this.werteGemerkt = new Map();
    // Gebaeude gehen wie Tiere nur bei Aenderung ueber die Leitung.
    this.gebaeudeAenderungen = new Set();
    // Wessen Kampfwerte sich geaendert haben (bedienung AC-35): der naechste
    // Zustand schickt ihm seine Tafel. Ohne das muesste sie in jedem Takt
    // mitfahren, oder der Browser muesste die Verbesserungen selbst
    // zusammenrechnen - und damit stuende die Regel zweimal im Haus.
    this.werteAenderungen = new Set();
    // Wessen Marktpreise sich geaendert haben (bauen AC-33) - wie die
    // Kampfwerte nur dann im Zustand.
    this.preisAenderungen = new Set();
    this.feldAenderungen = [];
    // Die Schlaege dieses Taktes, abgerechnet an seinem Ende (kampf AC-10).
    this.schlaege = [];
    // Steine im Flug (kampf AC-19): `{ x, y, takte, angreifer, gebaeude }`.
    // Sie schlagen ein, wenn `takte` abgelaufen ist, dort, wo das Ziel beim
    // Abwurf stand.
    this.einschlaege = [];
    // Das Ende der Partie, sobald es feststeht (spielziel AC-5, AC-20):
    // `{ gewinner, sieger, team, grund, takt }` mit `grund` "eroberung" oder
    // "zeit". `gewinner` sind alle, die gewonnen haben - ein Team samt
    // seinen Ausgeschiedenen; `sieger` steht nur, wenn es genau einer ist.
    this.ende = null;
    // Gezaehlt wird der Bestand nur, wenn etwas verloren ging - sonst liefe
    // die Suche ueber alle Einheiten und Gebaeude in jedem Takt mit.
    this.bestandPruefen = false;

    this.spieler = spielerListe.map((eintrag, i) => ({
      id: eintrag.id,
      name: eintrag.name,
      farbe: FARBEN[i % FARBEN.length],
      ...start,
      basis: this.karte.basen[i],
      verbesserungen: [], // erforscht, in der Reihenfolge des Abschlusses
      // Grundpreise am Markt, je Spieler (bauen AC-33).
      preise: { ...HANDEL.waren },
      zeitalter: 0, // jede Partie beginnt in der Dunklen Zeit (spielziel AC-1)
      aus: false, // ausgeschieden oder aufgegeben (spielziel AC-5, AC-6)
      // Fuer die Tafel am Ende (spielziel AC-8). Gezaehlt wird waehrend der
      // ganzen Partie, nicht am Schluss ausgerechnet: wer frueh ausscheidet,
      // hat am Ende weder Einheiten noch Vorraete, und seine Zahlen waeren
      // sonst alle null.
      gesammelt: { holz: 0, nahrung: 0, gold: 0, stein: 0 },
      ausgebildet: 0, // Einheiten, die er aus einem Gebaeude bekommen hat
      verloren: 0, // eigene Einheiten, die gefallen sind
      // Das Team (spielziel AC-14): 1 bis 4 oder keins. Wer keins hat,
      // spielt gegen alle.
      team: teamAus(einstellungen.teams, eintrag.id),
    }));
    // Wer mit wem verbuendet ist, fragt jede Kampfregel - deshalb eine Map
    // statt `spielerVon` (das sucht in der Liste).
    this.teamVon = new Map(this.spieler.map((s) => [s.id, s.team]));
    this.mitTeams = this.spieler.some((s) => s.team);
    // Gibt es ueberhaupt zwei Gegner? Stehen alle in einem Team, entscheidet
    // keine Eroberung - sonst endete die Partie im ersten Takt mit "Ihr habt
    // gewonnen" (spielziel AC-20, Durchsicht Runde 150). Dann endet sie
    // erst mit der Zeit oder wenn niemand mehr steht.
    this.mitGegnern = this.spieler.some((a) => this.spieler.some((b) => this.feindlich(a.id, b.id)));
    // Ob ein Buendnis waehrend der Partie geloest werden kann (spielziel
    // AC-21, Einstellung "Bündnisse"). Alles ausser "fest" heisst lösbar -
    // die Vorgabe des Steckbriefs.
    this.buendnisse = einstellungen.buendnisse === 'fest' ? 'fest' : 'loesbar';
    // Gekuendigte Buendnisse, je `{ wer, bis }` mit `bis` als Takt, an dem
    // die Frist ablaeuft, und `vorbei`, sobald sie abgelaufen ist. Die Liste
    // geht mit jedem Zustand an alle: eine Kuendigung ist oeffentlich.
    this.kuendigungen = [];

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

    // Was jeder Spieler sieht (kampf AC-15): `sichtbar` traegt den Stempel der
    // letzten Rechnung, in der das Feld gesehen wurde - so muss nichts geleert
    // werden, und acht Spieler auf der groessten Karte kosten keine 320.000
    // Schreibvorgaenge je halbe Sekunde. `erkundet` bleibt, was einmal gesehen war.
    const felder = this.karte.groesse * this.karte.groesse;
    // Die Sicht als Einstellung der Partie (kampf AC-16): Nebel, eine von
    // Anfang an erkundete Karte, oder alles aufgedeckt.
    this.sichtArt = SICHT_ARTEN.includes(einstellungen.sicht) ? einstellungen.sicht : 'nebel';
    this.sichtStempel = 0;
    // Verbuendete sehen gemeinsam (spielziel AC-19): wer in einem Team ist,
    // teilt mit ihm dieselbe Sicht - ein Satz Felder je Team, nicht je
    // Spieler. So gilt jede Frage nach der Sicht (`sieht`, `erkundet`, was der
    // Server schickt) von selbst fuer das ganze Team, und die Rechnung wird
    // nicht teurer: jede Einheit markiert weiter genau einmal.
    const neueSicht = () => ({
      sichtbar: new Uint32Array(felder), gebaeude: new Uint8Array(felder), erkundet: new Uint8Array(felder),
    });
    const jeTeam = new Map();
    this.sichten = new Map(this.spieler.map((s) => {
      if (!s.team) return [s.id, neueSicht()];
      if (!jeTeam.has(s.team)) jeTeam.set(s.team, neueSicht());
      return [s.id, jeTeam.get(s.team)];
    }));
    this.gebaeudeSichtNeu = true;
    if (this.sichtArt !== 'nebel') for (const sicht of this.sichten.values()) sicht.erkundet.fill(1);
    this.sichtAktualisieren();
  }

  /**
   * Die Sicht aller Spieler neu (kampf AC-15). Jede lebende Einheit sieht ihre
   * Sichtweite aus den Daten, mit Verbesserungen (`einheitenwert`); jedes
   * Gebaeude acht Felder ueber seinen Rand (daten.js). Ein Feld zaehlt, wenn
   * seine Mitte hoechstens so weit entfernt ist.
   */
  sichtAktualisieren() {
    const g = this.karte.groesse;
    const stempel = ++this.sichtStempel;
    // Alles, was hoechstens r vom Rechteck (ax..bx, ay..by) entfernt ist - fuer
    // eine Einheit ist das Rechteck ein Punkt, fuer ein Gebaeude seine
    // Grundflaeche: "acht Felder ueber den Rand", in jeder Reihe gleich.
    const markieren = (ziel, wert, erkundet, ax, ay, bx, by, r) => {
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
          const i = y * g + x;
          ziel[i] = wert;
          erkundet[i] = 1;
        }
      }
    };
    // Die Sichtweite je Besitzer und Art einmal je Rechnung - nicht je Einheit.
    const weite = new Map();
    for (const e of this.einheiten.values()) {
      if (e.tot) continue;
      const sicht = this.sichten.get(e.besitzer);
      if (!sicht) continue;
      const schluessel = `${e.besitzer}|${e.art}`;
      if (!weite.has(schluessel)) weite.set(schluessel, this.einheitenwert(e.besitzer, e.art, 'sicht'));
      markieren(sicht.sichtbar, stempel, sicht.erkundet, e.x, e.y, e.x, e.y, weite.get(schluessel));
    }
    // Gebaeude stehen still: ihre Sicht wird nur neu gerechnet, wenn eines
    // entsteht oder faellt. Jedes deckt mit acht Feldern Rand gut 400 Felder
    // ab, und so kostete die Sicht eine ganze Partie die Haelfte mehr
    // Rechenzeit (Runde 104, gemessen: 7,8 statt 5,0 s fuer fuenf Partien).
    if (this.gebaeudeSichtNeu) {
      this.gebaeudeSichtNeu = false;
      for (const sicht of new Set(this.sichten.values())) sicht.gebaeude.fill(0);
      for (const b of this.gebaeude.values()) {
        const sicht = this.sichten.get(b.besitzer);
        if (!sicht) continue;
        const { x0, y0, x1, y1 } = this.grundflaeche(b.art, b.x, b.y);
        markieren(sicht.gebaeude, 1, sicht.erkundet, x0, y0, x1, y1, this.gebaeudeSicht(b.besitzer, b.art));
      }
    }
  }

  aufKarte(x, y) {
    const g = this.karte.groesse;
    return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < g && y < g;
  }

  // Wie weit ein Gebaeude sieht: der Wert aus den Daten und was die
  // Verbesserungen seines Besitzers dazugeben (kampf AC-17, Stadtwache).
  gebaeudeSicht(besitzer, art) {
    return this.gebaeudewert(besitzer, art, 'sicht');
  }

  /**
   * Ein Wert eines Gebaeudes mit den Verbesserungen seines Besitzers - Leben,
   * Ruestung, Sicht (kampf AC-17, bauen AC-34). Das Gegenstueck zu
   * `einheitenwert()`: wer `GEBAEUDE[art].leben` direkt liest, sieht das
   * Mauerwerk nicht. Leben waechst um einen Anteil des Grundwerts
   * (`lebenAnteil`), alles andere um einen Zuschlag.
   */
  gebaeudewert(besitzer, art, feld) {
    const grund = GEBAEUDE[art][feld] || 0;
    const verbesserungen = this.spielerVon(besitzer)?.verbesserungen || [];
    if (feld === 'leben') {
      let anteil = 0;
      for (const v of verbesserungen) anteil += VERBESSERUNGEN[v].gebaeude?.lebenAnteil || 0;
      return Math.round(grund * (1 + anteil));
    }
    let wert = grund;
    for (const v of verbesserungen) wert += VERBESSERUNGEN[v].gebaeude?.[feld] || 0;
    return wert;
  }

  // Sieht dieser Spieler das Feld jetzt? Und hat er es je gesehen? (kampf AC-15)
  sieht(spielerId, x, y) {
    const sicht = this.sichten.get(spielerId);
    // Ausserhalb der Karte sieht niemand - sonst griffe x = -1 in die
    // Nachbarreihe (Durchsicht Runde 104).
    if (!this.aufKarte(x, y)) return false;
    if (this.sichtArt === 'aufgedeckt') return true;
    const i = y * this.karte.groesse + x;
    return Boolean(sicht) && (sicht.sichtbar[i] === this.sichtStempel || sicht.gebaeude[i] === 1);
  }

  erkundet(spielerId, x, y) {
    const sicht = this.sichten.get(spielerId);
    if (!this.aufKarte(x, y)) return false;
    return Boolean(sicht) && sicht.erkundet[y * this.karte.groesse + x] === 1;
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
   * Fertige eigene Gebaeude des laufenden Zeitalters, ausser denen mit
   * `zumAufstieg: false` (Haeuser, Tuerme, Mauern) - die Voraussetzung des
   * Aufstiegs (bauen AC-23). Das Dorfzentrum zaehlt mit, also fehlt noch ein
   * gebautes.
   */
  gebaeudeDerZeit(spieler) {
    let zahl = 0;
    for (const g of this.gebaeude.values()) {
      if (g.besitzer !== spieler.id || !g.fertig || GEBAEUDE[g.art].zumAufstieg === false) continue;
      if (this.gebaeudeZeitalter(g.art) === spieler.zeitalter) zahl += 1;
    }
    return zahl;
  }

  /**
   * Ein Wert einer Einheit mit allen Verbesserungen ihres Spielers - Leben,
   * Angriff, Ruestung, Reichweite, Sicht, Tempo, Nachladezeit (bauen AC-21,
   * AC-25). Eine Stelle fuer alle Werte: wer die Tabelle direkt liest, sieht
   * die Verbesserungen nicht. Darauf achtet `tests/waechter-werte.test.mjs`.
   *
   * `spieler.verbesserungen` aendert sich nur ueber `erforschen()` - dort wird
   * das Gedaechtnis dieses Spielers geleert.
   */
  einheitenwert(besitzer, art, feld) {
    const spieler = this.spielerVon(besitzer);
    if (!spieler?.verbesserungen?.length) return EINHEITEN[art][feld] || 0;
    // Gemerkt je Spieler: `laufen()` fragt das Tempo in jedem Takt fuer jede
    // Einheit, `wacheTakten()` zweimal je Sekunde die Sicht. Ohne Gedaechtnis
    // liefe darunter je Aufruf eine Schleife ueber alle Verbesserungen mit
    // (fahrplan AC-6: ein Takt mit 8 x 100 Einheiten unter 10 ms).
    let gemerkt = this.werteGemerkt.get(besitzer);
    if (!gemerkt) this.werteGemerkt.set(besitzer, gemerkt = new Map());
    const schluessel = `${art}|${feld}`;
    const da = gemerkt.get(schluessel);
    if (da !== undefined) return da;
    let wert = EINHEITEN[art][feld] || 0;
    for (const s of wirkungsschluessel(art)) {
      for (const v of spieler.verbesserungen) wert += VERBESSERUNGEN[v].wirkung[s]?.[feld] || 0;
    }
    gemerkt.set(schluessel, wert);
    return wert;
  }

  // Leben einer Einheit mit allen Verbesserungen ihres Spielers (bauen AC-21).
  lebenMax(besitzer, art) {
    return this.einheitenwert(besitzer, art, 'leben');
  }

  /**
   * Die Werte jeder Einheitenart, wie sie fuer diesen Spieler gelten - fuer
   * die Auswahlleiste (bedienung AC-35). Gelesen wird nur ueber
   * `einheitenwert()`, damit Verbesserungen sich zeigen: nach dem
   * Schmiedeangriff steht beim Speerkaempfer 4 Angriff, nicht 3.
   */
  kampfwerte(besitzer) {
    const tafel = {};
    for (const art of Object.keys(EINHEITEN)) {
      tafel[art] = {};
      for (const feld of KAMPFFELDER) tafel[art][feld] = this.einheitenwert(besitzer, art, feld);
    }
    // Die Gebaeude in derselben Tafel (bauen AC-34): der Lebensbalken braucht
    // das volle Leben nach dem Mauerwerk. Die Namen von Einheiten und
    // Gebaeuden ueberschneiden sich nicht - darauf achtet ein Test.
    for (const art of Object.keys(GEBAEUDE)) {
      tafel[art] = {};
      for (const feld of GEBAEUDEFELDER) tafel[art][feld] = this.gebaeudewert(besitzer, art, feld);
    }
    return tafel;
  }

  /**
   * Die Sammelrate eines Spielers an einem Rohstoff (bauen AC-26). Die
   * Doppelaxt ist ein Faktor, kein Zuschlag - "+20 % Holz" der Vorlage.
   */
  sammelrate(besitzer, rohstoff, grundrate) {
    let faktor = 1;
    for (const v of this.spielerVon(besitzer)?.verbesserungen || []) {
      faktor *= VERBESSERUNGEN[v].sammeln?.[rohstoff] || 1;
    }
    return grundrate * faktor;
  }

  // Wie viel Nahrung eine neue Farm dieses Spielers traegt (bauen AC-26).
  farmNahrung(besitzer) {
    let nahrung = GEBAEUDE.farm.nahrung;
    for (const v of this.spielerVon(besitzer)?.verbesserungen || []) nahrung += VERBESSERUNGEN[v].farm?.nahrung || 0;
    return nahrung;
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
      leben: this.gebaeudewert(besitzer, art, 'leben'),
      // Eine Farm traegt Nahrung, und nur einer arbeitet darauf (einheiten AC-18).
      ...(GEBAEUDE[art].nahrung ? { nahrung: this.farmNahrung(besitzer), arbeiter: null } : {}),
      schlange: [], // Arten der bezahlten Auftraege, der erste laeuft
      fortschritt: 0, // Takte am laufenden Auftrag
      wartet: false, // Bevoelkerung voll (bauen AC-15)
    };
    this.gebaeude.set(gebaeude.id, gebaeude);
    // Wem es gehoert, bleibt bekannt, auch wenn es faellt - der Auszug je
    // Spieler schickt das Verschwinden eigener Gebaeude immer (kampf AC-13).
    (this.gebaeudeBesitzer ??= new Map()).set(gebaeude.id, besitzer);
    this.gebaeudeSichtNeu = true;
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
  // `ausser`: ein Gebaeude, das der Neubau ersetzt (ein Tor auf der Mauer,
  // bauen AC-31) - sein Platz zaehlt als frei.
  platzPruefen(art, x, y, ausser = null) {
    if (!GEBAEUDE[art] || !Number.isInteger(x) || !Number.isInteger(y)) return false;
    const { x0, y0, x1, y1 } = this.grundflaeche(art, x, y);
    const alt = ausser ? this.grundflaeche(ausser.art, ausser.x, ausser.y) : null;
    for (let fy = y0; fy <= y1; fy++) {
      for (let fx = x0; fx <= x1; fx++) {
        if (alt && fx >= alt.x0 && fx <= alt.x1 && fy >= alt.y0 && fy <= alt.y1) continue;
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
      if (gebaeude === ausser) continue;
      const g = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y);
      if (g.x0 <= x1 && g.x1 >= x0 && g.y0 <= y1 && g.y1 >= y0) return false;
    }
    return true;
  }

  /**
   * Das eigene Gebaeude, das ein Neubau an dieser Stelle ersetzt - ein Tor auf
   * einem Feld der eigenen Mauer (bauen AC-31). Nur genau deckungsgleich:
   * gleicher Anker, gleiche Groesse. Sonst null.
   */
  ersetzbar(spielerId, art, x, y) {
    const ersetzt = GEBAEUDE[art]?.ersetzt;
    if (!ersetzt) return null;
    const alt = this.gebaeudeAn(x, y);
    if (!alt || alt.besitzer !== spielerId || alt.art !== ersetzt) return null;
    if (alt.x !== x || alt.y !== y || GEBAEUDE[alt.art].groesse !== GEBAEUDE[art].groesse) return null;
    return alt;
  }

  /**
   * Die Tore, durch die ein Spieler gehen darf, als Feldnummern (bauen AC-31):
   * seine eigenen und die seiner Verbuendeten (spielziel AC-14).
   */
  toreVon(besitzer) {
    if (!this.tore) return null;
    if (!this.mitTeams) {
      const tore = this.tore.get(besitzer);
      return tore && tore.size ? tore : null;
    }
    // Ein Satz allein geht unveraendert zurueck; erst ein zweiter braucht
    // einen neuen, sonst stuenden fremde Tore in der eigenen Liste.
    let offen = null;
    let neu = false;
    for (const [wer, tore] of this.tore) {
      if (!tore.size || this.feindlich(besitzer, wer)) continue;
      if (!offen) {
        offen = tore;
        continue;
      }
      if (!neu) {
        offen = new Set(offen);
        neu = true;
      }
      for (const f of tore) offen.add(f);
    }
    return offen;
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
        // Fuer den Besitzer bleibt ein Tor begehbar (bauen AC-31) - auf der
        // Karte ist es bebaut, die Wegsuche bekommt es eigens.
        if (GEBAEUDE[gebaeude.art].tor) {
          this.tore ??= new Map();
          if (!this.tore.has(gebaeude.besitzer)) this.tore.set(gebaeude.besitzer, new Set());
          this.tore.get(gebaeude.besitzer).add(i);
        }
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
    //
    // Auch wer **schraeg an einer Ecke** vorbeigeht, sucht neu: auf halbem Weg
    // rundet seine Lage auf eines der beiden geraden Nachbarfelder, und liegt
    // das jetzt in der Grundflaeche, steht er im Gebaeude. Als der Weg
    // berechnet wurde, war die Ecke frei (Pruefstand, Startwert 3, Takt 52113:
    // ein Plaenkler im eben begonnenen Stall des Gegners - Runde 92).
    const drin = (p) => p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1;
    const ecke = (a, b) => a.x !== b.x && a.y !== b.y && (drin({ x: a.x, y: b.y }) || drin({ x: b.x, y: a.y }));
    for (const einheit of this.einheiten.values()) {
      if (!einheit.weg.length) continue;
      const schritte = [{ x: Math.round(einheit.x), y: Math.round(einheit.y) }, ...einheit.weg];
      let betroffen = einheit.weg.some(drin);
      for (let i = 1; i < schritte.length && !betroffen; i++) betroffen = ecke(schritte[i - 1], schritte[i]);
      if (!betroffen) continue;
      const ziel = einheit.weg[einheit.weg.length - 1];
      einheit.weg = suchen(this.karte, this.feldVon(einheit), ziel, this.toreVon(einheit.besitzer));
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
        if (GEBAEUDE[gebaeude.art].tor) this.tore?.get(gebaeude.besitzer)?.delete(i);
      }
    }
    // Wer eine Mauer angreift, prueft danach, ob sein Ziel jetzt offen liegt
    // (kampf AC-21) - nur wenn wirklich eine Mauer oder ein Tor fiel.
    if (GEBAEUDE[gebaeude.art].gezogen || GEBAEUDE[gebaeude.art].tor) this.mauernGefallen = (this.mauernGefallen || 0) + 1;
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
    if (!Array.isArray(einheitIds) || !ziel || !GEBAEUDE[art]) return { fehler: 'Das lässt sich nicht bauen.' };
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
    // Ein Tor auf der eigenen Mauer ersetzt dieses Feld (bauen AC-31).
    const alt = this.ersetzbar(spielerId, art, x, y);
    if (!this.platzPruefen(art, x, y, alt)) return { fehler: 'Hier ist kein Platz.' };
    const kosten = GEBAEUDE[art].kosten;
    for (const [rohstoff, menge] of Object.entries(kosten)) {
      if (spieler[rohstoff] < menge) return { fehler: `Zu wenig ${ROHSTOFF_NAMEN[rohstoff]}.` };
    }
    for (const [rohstoff, menge] of Object.entries(kosten)) spieler[rohstoff] -= menge;
    // Das Mauerfeld verschwindet ohne Erstattung, wie in der Vorlage; wer daran
    // baute, geht zum naechsten Feld seiner Mauer (welt.bauenWeiter).
    if (alt) this.gebaeudeZerstoeren(alt);
    const baustelle = this.gebaeudeAnlegen(spielerId, art, x, y, false);
    for (const einheit of bauer) this.bauenBeginnen(einheit, baustelle);
    return { gebaeude: baustelle.id };
  }

  /**
   * Eine Mauer ziehen (bauen AC-30): von `von` nach `bis` eine Linie aus
   * Baustellen, ein Feld je Baustelle, bezahlt je Feld. Was nicht frei ist,
   * wird uebersprungen; reicht der Vorrat nicht, endet die Linie dort. Die
   * Bauleute gehen in der Reihenfolge der Linie von Feld zu Feld.
   */
  mauerZiehen(spielerId, einheitIds, art, von, bis) {
    if (!Array.isArray(einheitIds) || !von || !bis || !GEBAEUDE[art]?.gezogen) return { fehler: 'Das lässt sich nicht ziehen.' };
    const bauer = einheitIds.slice(0, 200)
      .map((id) => this.einheiten.get(id))
      .filter((e) => e && e.besitzer === spielerId && (EINHEITEN[e.art].baut || []).includes(art));
    if (!bauer.length) return { fehler: 'Niemand in der Auswahl kann das bauen.' };
    const spieler = this.spielerVon(spielerId);
    const noetig = this.gebaeudeZeitalter(art);
    if (noetig > spieler.zeitalter) {
      return { fehler: `${GEBAEUDE_NAMEN[art] || art} gibt es erst in ${ZEITALTER[noetig].genitiv}.` };
    }
    const felder = mauerLinie(von, bis);
    if (!felder) return { fehler: 'Das lässt sich nicht ziehen.' };
    const kosten = GEBAEUDE[art].kosten;
    const bezahlbar = () => Object.entries(kosten).every(([rohstoff, menge]) => spieler[rohstoff] >= menge);
    const baustellen = [];
    let uebersprungen = 0;
    let zuWenig = false;
    for (const feld of felder) {
      if (!this.platzPruefen(art, feld.x, feld.y)) {
        uebersprungen += 1;
        continue;
      }
      if (!bezahlbar()) {
        zuWenig = true;
        break;
      }
      for (const [rohstoff, menge] of Object.entries(kosten)) spieler[rohstoff] -= menge;
      baustellen.push(this.gebaeudeAnlegen(spielerId, art, feld.x, feld.y, false));
    }
    if (!baustellen.length) {
      const rohstoff = Object.keys(kosten).find((r) => spieler[r] < kosten[r]);
      return { fehler: zuWenig ? `Zu wenig ${ROHSTOFF_NAMEN[rohstoff]}.` : 'Hier ist kein Platz.' };
    }
    const folge = baustellen.map((b) => b.id);
    for (const einheit of bauer) this.bauenBeginnen(einheit, baustellen[0], folge.slice(1));
    return { gebaeude: folge, uebersprungen, zuWenig };
  }

  /**
   * Eine gezogene Mauer weiterbauen (bauen AC-30): zum naechsten Feld der
   * Folge, das noch steht, nicht fertig ist und dem Bauer gehoert. Gilt, wenn
   * das laufende Feld fertig wird, abgerissen oder zerstoert ist oder nicht zu
   * erreichen - sonst blieben die uebrigen bezahlten Felder liegen
   * (Durchsicht in Runde 127). Ohne Folge endet der Auftrag; zurueck kommt,
   * ob es weitergeht.
   */
  bauenWeiter(einheit) {
    const folge = einheit.auftrag?.folge || [];
    einheit.baut = false;
    einheit.auftrag = null;
    const weiter = folge.findIndex((id) => {
      const naechste = this.gebaeude.get(id);
      return naechste && !naechste.fertig && naechste.besitzer === einheit.besitzer;
    });
    if (weiter < 0) return false;
    this.bauenBeginnen(einheit, this.gebaeude.get(folge[weiter]), folge.slice(weiter + 1));
    return true;
  }

  bauenBeginnen(einheit, baustelle, folge = []) {
    this.farmVerlassen(einheit);
    einheit.sammelt = false;
    einheit.baut = false;
    // `folge`: die naechsten Baustellen einer gezogenen Mauer (bauen AC-30).
    einheit.auftrag = { art: 'bauen', gebaeude: baustelle.id, ...(folge.length ? { folge } : {}) };
    einheit.weg = this.wegZurBaustelle(einheit, baustelle);
  }

  /**
   * Der Weg an den Rand einer Baustelle. Das naechste Randfeld genuegt nicht:
   * an einer Mauer liegt es oft auf der anderen Seite, ohne Weg dorthin - ein
   * Tor in einem Mauerring baute so niemand (Runde 128). Ist das naechste
   * nicht erreichbar, kommen die naechsten vier Randfelder dran, wie bei der
   * KI (eine vergebliche Suche durchflutet das ganze erreichbare Gebiet).
   * Leer heisst: kein Weg, oder schon am Platz.
   */
  wegZurBaustelle(einheit, baustelle) {
    const von = this.feldVon(einheit);
    const stand = this.randfeld(baustelle, einheit);
    if (!stand) return [];
    const weg = this.wegNach(einheit, stand);
    if (weg.length || (von.x === stand.x && von.y === stand.y)) return weg;
    for (const feld of this.randfelder(baustelle, einheit).slice(0, 4)) {
      if (feld.x === stand.x && feld.y === stand.y) continue;
      const anders = this.wegNach(einheit, feld);
      if (anders.length || (von.x === feld.x && von.y === feld.y)) return anders;
    }
    return [];
  }

  // Ein Weg zu einem Feld. Steht die Einheit schon auf dem Feld, aber nicht in
  // seiner Mitte, geht sie den Rest - die Suche allein lieferte dann keinen
  // Weg, und ein Bauer gab 0,04 Felder vor dem Ziel auf (Pruefstand, Runde 44).
  wegNach(einheit, ziel) {
    const feld = this.feldVon(einheit);
    if (feld.x === ziel.x && feld.y === ziel.y) {
      return einheit.x === ziel.x && einheit.y === ziel.y ? [] : [{ x: ziel.x, y: ziel.y }];
    }
    return suchen(this.karte, feld, ziel, this.toreVon(einheit.besitzer));
  }

  // Eine Baustelle abreissen: erstattet wird, was noch nicht verbaut ist
  // (bauen AC-6).
  abreissen(spielerId, gebaeudeId) {
    const gebaeude = this.gebaeude.get(gebaeudeId);
    if (!gebaeude || gebaeude.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebäude.' };
    if (gebaeude.fertig) return { fehler: 'Nur Baustellen lassen sich abreissen.' };
    const spieler = this.spielerVon(spielerId);
    for (const [rohstoff, menge] of Object.entries(GEBAEUDE[gebaeude.art].kosten)) {
      spieler[rohstoff] += Math.floor(menge * (1 - gebaeude.bau));
    }
    this.freigeben(gebaeude);
    this.gebaeude.delete(gebaeude.id);
    this.gebaeudeSichtNeu = true;
    this.gebaeudeGeaendert(gebaeude);
    for (const einheit of this.einheiten.values()) {
      if (einheit.auftrag?.art === 'bauen' && einheit.auftrag.gebaeude === gebaeude.id) this.bauenWeiter(einheit);
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
      if (this.bauenWeiter(einheit)) continue;
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
      case 'mauer':
        return this.mauerZiehen(spielerId, nachricht.einheiten, nachricht.art, nachricht.von, nachricht.bis);
      case 'abreissen':
        return this.abreissen(spielerId, nachricht.gebaeude);
      case 'sammelpunkt':
        return this.sammelpunktSetzen(spielerId, nachricht.gebaeude, nachricht.ziel);
      case 'handeln':
        return this.handeln(spielerId, nachricht.gebaeude, nachricht.ware, nachricht.richtung);
      case 'aufgeben':
        return this.aufgeben(spielerId);
      case 'kuendigen':
        return this.kuendigen(spielerId);
      default:
        return this.befehl(spielerId, nachricht.einheiten, nachricht.ziel, Boolean(nachricht.angriffslauf));
    }
  }

  // Bezahlt wird beim Einreihen (bauen AC-10). Die Absage sagt, warum
  // (bedienung AC-18).
  ausbilden(spielerId, gebaeudeId, art) {
    const gebaeude = this.gebaeude.get(gebaeudeId);
    if (!gebaeude || gebaeude.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebäude.' };
    if (!gebaeude.fertig) return { fehler: 'Das Gebäude ist noch nicht fertig.' };
    // Die zweite Stufe einer Einheit zaehlt als ihre Grundstufe: die Kaserne
    // bildet die Miliz aus, nach der Verbesserung kommt daraus ein Soldat
    // (einheiten AC-24).
    const grundstufe = EINHEITEN[art]?.stufeVon || art;
    if (!GEBAEUDE[gebaeude.art].bildetAus.includes(grundstufe)) return { fehler: 'Das bildet dieses Gebäude nicht aus.' };
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
    // Eine Verbesserung kann eine andere voraussetzen: Eisenguss erst nach dem
    // Schmiedeangriff (bauen AC-34). Erforscht muss sie sein, eingereiht
    // reicht nicht - sonst liefe die zweite vor der ersten.
    const vorstufe = VERBESSERUNGEN[art]?.vorstufe;
    if (vorstufe && !spieler.verbesserungen.includes(vorstufe)) {
      return { fehler: `${VERBESSERUNGEN[art].name} gibt es erst nach „${VERBESSERUNGEN[vorstufe].name}".` };
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
    if (!gebaeude || gebaeude.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebäude.' };
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

  /**
   * Kauf- und Verkaufspreis je Ware fuer diesen Spieler (bauen AC-33), in Gold
   * je `HANDEL.menge`: `{ holz: [kauf, verkauf], ... }`. Gerundet wird hier und
   * nur hier - was die Leiste zeigt, ist, was der Handel bucht.
   */
  handelspreise(spielerId) {
    const spieler = this.spielerVon(spielerId);
    return Object.fromEntries(Object.keys(HANDEL.waren).map((ware) => {
      const grund = spieler.preise[ware];
      return [ware, [Math.round(grund * (1 + HANDEL.gebuehr)), Math.round(grund * (1 - HANDEL.gebuehr))]];
    }));
  }

  // Am Markt 100 einer Ware gegen Gold tauschen (bauen AC-33). Jeder Kauf
  // macht die Ware teurer, jeder Verkauf billiger - fuer diesen Spieler.
  handeln(spielerId, gebaeudeId, ware, richtung) {
    const gebaeude = this.gebaeude.get(gebaeudeId);
    if (!gebaeude || gebaeude.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebäude.' };
    if (!GEBAEUDE[gebaeude.art].handel) return { fehler: 'An diesem Gebäude wird nicht gehandelt.' };
    if (!gebaeude.fertig) return { fehler: 'Das Gebäude ist noch nicht fertig.' };
    if (!Object.hasOwn(HANDEL.waren, ware)) return { fehler: 'Diese Ware gibt es am Markt nicht.' };
    if (richtung !== 'kaufen' && richtung !== 'verkaufen') return { fehler: 'Kaufen oder verkaufen?' };
    const spieler = this.spielerVon(spielerId);
    const [kauf, verkauf] = this.handelspreise(spielerId)[ware];
    if (richtung === 'kaufen') {
      if (spieler.gold < kauf) return { fehler: 'Zu wenig Gold.' };
      spieler.gold -= kauf;
      spieler[ware] += HANDEL.menge;
      spieler.preise[ware] += HANDEL.schritt;
    } else {
      if (spieler[ware] < HANDEL.menge) return { fehler: `Zu wenig ${ROHSTOFF_NAMEN[ware]}.` };
      spieler[ware] -= HANDEL.menge;
      spieler.gold += verkauf;
      spieler.preise[ware] = Math.max(HANDEL.tiefst, spieler.preise[ware] - HANDEL.schritt);
    }
    this.preisAenderungen.add(spielerId);
    return {};
  }

  // Eine Verbesserung wirkt sofort auf alle, die es schon gibt, und auf alle
  // spaeteren (bauen AC-21).
  erforschen(spieler, art) {
    // Mauerwerk legt auf jedes eigene Gebaeude Leben nach, auch auf die, die
    // schon stehen - der Schaden bleibt stehen (bauen AC-34).
    const lebenVorher = new Map();
    if (VERBESSERUNGEN[art].gebaeude?.lebenAnteil) {
      for (const g of this.gebaeude.values()) {
        if (g.besitzer === spieler.id && !lebenVorher.has(g.art)) lebenVorher.set(g.art, this.gebaeudewert(spieler.id, g.art, 'leben'));
      }
    }
    spieler.verbesserungen.push(art);
    for (const g of this.gebaeude.values()) {
      if (g.besitzer !== spieler.id || !lebenVorher.has(g.art)) continue;
      g.leben += this.gebaeudewert(spieler.id, g.art, 'leben') - lebenVorher.get(g.art);
      this.gebaeudeGeaendert(g);
    }
    // Eine Verbesserung kann die Sicht der Gebaeude aendern (kampf AC-17).
    if (VERBESSERUNGEN[art].gebaeude) this.gebaeudeSichtNeu = true;
    this.werteGemerkt.delete(spieler.id);
    this.werteAenderungen.add(spieler.id);
    const wirkung = VERBESSERUNGEN[art].wirkung;
    for (const einheit of this.einheiten.values()) {
      if (einheit.besitzer !== spieler.id) continue;
      for (const schluessel of wirkungsschluessel(einheit.art)) einheit.leben += wirkung[schluessel]?.leben || 0;
    }
    // Pferdekummet legt auf jede Farm nach, auch auf die, die schon steht
    // (bauen AC-26) - sonst lohnte es sich erst beim naechsten Feld.
    const mehrNahrung = VERBESSERUNGEN[art].farm?.nahrung || 0;
    if (mehrNahrung) {
      for (const g of this.gebaeude.values()) {
        if (g.besitzer !== spieler.id || g.nahrung === undefined) continue;
        g.nahrung += mehrNahrung;
        this.gebaeudeGeaendert(g);
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
    if (!gebaeude || gebaeude.besitzer !== spielerId) return { fehler: 'Das ist nicht dein Gebäude.' };
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
    // Fuer die Tafel (spielziel AC-8): die drei vom Anfang zaehlen nicht mit,
    // die hat niemand ausgebildet.
    spieler.ausgebildet++;
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
    // Wer kaempft, steht nicht herum - auch wenn er weder sammelt noch baut
    // noch laeuft (Runde 95: ein Dorfbewohner, der sich wehrte, zaehlte im
    // Pruefstand 22 Sekunden als untaetig, und der Knopf fuer Untaetige haette
    // ihn mitten aus dem Kampf geholt; bedienung AC-28, ki AC-10).
    if (einheit.auftrag?.art === 'angreifen') return false;
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

  /**
   * Gegner oder nicht (spielziel AC-14) - die eine Stelle, an der jede
   * Kampfregel fragt: wen eine Wache angreift, worauf ein Turm schiesst, was
   * ein Rechtsklick tut, wessen Tor sich oeffnet. Niemand ist sein eigener
   * Gegner; ohne Teams ist jeder andere einer, wie bis Runde 145; mit Teams
   * ist es jeder, der nicht im selben Team ist. Wer kein Team hat, ist
   * allen Gegner.
   */
  feindlich(a, b) {
    if (a === b) return false;
    if (!this.mitTeams) return true;
    const team = this.teamVon.get(a);
    return !team || team !== this.teamVon.get(b);
  }

  /**
   * Sehen die beiden gemeinsam (spielziel AC-19, AC-21)? Fast immer
   * dasselbe wie "nicht feindlich" - ausser waehrend der Frist einer
   * Kuendigung: dann sind sie noch keine Gegner, sehen aber schon jeder
   * fuer sich. Fragen, was einer sieht und was der Server ihm schickt,
   * stellen deshalb diese Frage, Kampfregeln `feindlich`.
   */
  teiltSicht(a, b) {
    return this.sichten.get(a) === this.sichten.get(b);
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
    const feindBau = !feind && baustelle && this.feindlich(spielerId, baustelle.besitzer) ? baustelle : null;
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
        tier.weg = suchen(this.karte, { x: Math.round(tier.x), y: Math.round(tier.y) }, { x: zx, y: zy }, this.toreVon(tier.besitzer));
        continue;
      }
      const einheit = this.einheiten.get(id);
      if (!einheit || einheit.besitzer !== spielerId) continue;
      this.farmVerlassen(einheit);
      einheit.sammelt = false;
      einheit.baut = false;
      // Ein Moench, der eben noch bekehrte oder heilte, tut es nicht mehr
      // (einheiten AC-37, AC-38; tests/waechter-merker.test.mjs).
      einheit.bekehrt = false;
      einheit.heilt = null;
      einheit.unerreichbar = null;
      // Jeder neue Befehl beendet einen laufenden Angriffslauf.
      einheit.angriffslauf = null;
      // Ein Moench bekehrt, wer sich bekehren laesst (einheiten AC-38) - wenn
      // er nicht ruht; sonst geht er nur hin.
      if (!angriffslauf && feind && this.kannBekehren(einheit, feind)) {
        this.bekehrenBeginnen(einheit, feind);
        continue;
      }
      // Wer nur Gebaeude angreift (die Ramme, einheiten AC-35), geht zu einer
      // Einheit nur hin.
      if ((feindBau || (feind && !EINHEITEN[einheit.art].nurGebaeude))
        && this.einheitenwert(einheit.besitzer, einheit.art, 'angriff') > 0) {
        const opfer = feind || feindBau;
        // Mehrere Angreifer stellen sich um das Ziel herum, statt uebereinander
        // zu stehen - dieselbe Aufstellung wie beim Gehen (einheiten AC-20).
        angriffsfelder ??= this.angriffsfelderOhneBesetzte(opfer, gruppe.length, Boolean(feindBau), einheitIds);
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
        if (angriffslauf && this.einheitenwert(einheit.besitzer, einheit.art, 'angriff') > 0) einheit.angriffslauf = feld;
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
    einheit.weg = suchen(this.karte, this.feldVon(einheit), ziel, this.toreVon(einheit.besitzer));
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
      this.gebaeudeSichtNeu = true;
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
    einheit.weg = stand ? suchen(this.karte, this.feldVon(einheit), stand, this.toreVon(einheit.besitzer)) : [];
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
    einheit.weg = stand ? suchen(this.karte, this.feldVon(einheit), stand, this.toreVon(einheit.besitzer)) : [];
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
    // Wer eben keinen Weg zu irgendeinem Lager fand, sucht erst nach einer
    // Pause wieder - auch nicht den ersten Weg. Eine vergebliche Suche
    // durchflutet das ganze erreichbare Gebiet, und wer festsitzt, kommt in
    // jedem Takt hierher: 30 Holzfaeller vor einem abgeschnittenen Lager
    // kosteten 47 ms je Takt, schon vor Runde 91 (Durchsicht Runde 91,
    // gemessen).
    if (this.takt < (einheit.lagerSucheAb || 0)) {
      einheit.weg = [];
      return;
    }
    const lager = this.lagerFuer(einheit);
    const stand = lager && this.randfeld(lager, einheit);
    einheit.weg = stand ? suchen(this.karte, this.feldVon(einheit), stand, this.toreVon(einheit.besitzer)) : [];
    if (einheit.weg.length) return;
    if (!lager) {
      einheit.lagerSucheAb = this.takt + this.lagerPause(einheit);
      return;
    }
    // Kein Weg zum naechsten Rand des naechsten Lagers: andere Randfelder,
    // dann die anderen Lager, nach Abstand (ki AC-10). Die KI stellte ein
    // Holzfaellerlager in eine Waldluecke, deren Rand zum Holzfaeller hin
    // zugewachsen war; drei Holzfaeller standen beim Startwert 17 mit voller
    // Ladung 45 bis 53 Sekunden am Wald (Runde 91, gemessen).
    //
    // Je Lager nur **ein** weiteres Randfeld - das naechste, das nicht schon
    // versucht wurde; die Randfelder eines Lagers liegen fast immer im selben
    // Gebiet. Bleibt alles vergeblich, die Pause (siehe oben).
    const von = this.feldVon(einheit);
    const lagerListe = [...this.gebaeude.values()]
      .filter((g) => g.besitzer === einheit.besitzer && g.fertig && GEBAEUDE[g.art].annahme.includes(einheit.ladungsart))
      .sort((a, b) => this.abstandZu(einheit, a) - this.abstandZu(einheit, b))
      .slice(0, 3);
    for (const l of lagerListe) {
      const feld = this.randfelder(l, einheit).find((f) => l !== lager || f.x !== stand.x || f.y !== stand.y);
      if (!feld) continue;
      const weg = suchen(this.karte, von, feld, this.toreVon(einheit.besitzer));
      if (weg.length) {
        einheit.weg = weg;
        return;
      }
    }
    einheit.lagerSucheAb = this.takt + this.lagerPause(einheit);
  }

  // Die Pause nach einer vergeblichen Suche, nach der Nummer der Einheit
  // gestreut: sonst suchen alle, die zugleich festsassen, im selben Takt wieder
  // - 30 Holzfaeller vor einem abgeschnittenen Lager kosteten so 93 ms in einem
  // Takt (Durchsicht Runde 91, gemessen). Deterministisch, ohne Zufall.
  lagerPause(einheit) {
    let streu = 0;
    for (const zeichen of String(einheit.id)) streu = (streu * 31 + zeichen.charCodeAt(0)) % LAGER_SUCHE_PAUSE;
    return LAGER_SUCHE_PAUSE + streu;
  }

  // Alle begehbaren Felder unmittelbar um die Grundflaeche, nach Abstand zu `von`.
  randfelder(gebaeude, von) {
    const { x0, y0, x1, y1 } = this.grundflaeche(gebaeude.art, gebaeude.x, gebaeude.y);
    const felder = [];
    for (let fy = Math.floor(y0) - 1; fy <= Math.ceil(y1) + 1; fy++) {
      for (let fx = Math.floor(x0) - 1; fx <= Math.ceil(x1) + 1; fx++) {
        if (fx > x0 - 1 && fx < x1 + 1 && fy > y0 - 1 && fy < y1 + 1) continue;
        if (!karten.begehbar(this.karte, fx, fy) || this.gebaeudeAn(fx, fy)) continue;
        felder.push({ x: fx, y: fy, d: Math.hypot(fx - von.x, fy - von.y) });
      }
    }
    return felder.sort((a, b) => a.d - b.d).map(({ x, y }) => ({ x, y }));
  }

  // ---- Kampf (kampf AC-1, AC-6 bis AC-8, AC-10) ---------------------------

  // Die naechste fremde, lebende Einheit hoechstens ein Feld vom Klick
  // entfernt - gemessen wie beim eigenen Schaf (einheiten AC-17).
  feindAn(spielerId, x, y) {
    let bestes = null;
    let besterAbstand = 1.01;
    for (const einheit of this.einheiten.values()) {
      if (einheit.tot || !this.feindlich(spielerId, einheit.besitzer)) continue;
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

  /**
   * Dieselben Angriffsfelder, aber die Plaetze derer, die dasselbe Ziel schon
   * angreifen, sind belegt (kampf AC-1: mehrere Angreifer verteilen sich).
   *
   * Ohne das gilt die Verteilung nur **innerhalb eines Befehls**: kommt ein
   * zweiter hinterher - und die KI setzt am Ziel einzeln nach (ki AC-11) -,
   * bekommt der Nachzuegler dasselbe Feld noch einmal, und zwei Angreifer
   * stehen uebereinander. Im Bild zu ki AC-11 waren es drei auf einem Punkt
   * (Runde 85). `wacheTakten` tut dasselbe schon lange, nur fuer Einheiten.
   *
   * @param {string[]} ausser Ids, die jetzt neu verteilt werden - ihr alter
   *   Platz zaehlt nicht als belegt.
   */
  angriffsfelderOhneBesetzte(ziel, anzahl, istGebaeude, ausser) {
    const felder = this.angriffsfelder(ziel, anzahl, istGebaeude);
    const neu = new Set(ausser);
    for (const andere of this.einheiten.values()) {
      if (andere.tot || neu.has(andere.id)) continue;
      const auftrag = andere.auftrag;
      if (auftrag?.art !== 'angreifen' || auftrag.ziel !== ziel.id) continue;
      if (Boolean(auftrag.gebaeude) !== Boolean(istGebaeude)) continue;
      // Wohin er unterwegs ist - und wenn er schon steht, wo er steht.
      const platz = andere.weg.length ? andere.weg[andere.weg.length - 1] : this.feldVon(andere);
      for (const f of felder) if (f.x === platz.x && f.y === platz.y) f.frei = false;
    }
    // Um ein **Gebaeude** auch die Felder, auf denen jemand stillsteht - wer
    // auch immer. Am Dorfzentrum schlachtet die KI ihre Schafe, und der
    // Dorfbewohner steht dort, bis das Schaf leer ist; Annas Miliz bekam genau
    // sein Feld und stand auf ihm (Runde 86, sieben von acht Laeufen). Nur bei
    // Gebaeuden: um ein Gebaeude ist Platz genug, und ein Gefecht zwischen
    // Einheiten soll sich nicht aendern - der Konterkreis haengt daran
    // (Runde 85: eine weite Fassung kippte ihn).
    if (istGebaeude) {
      for (const andere of this.einheiten.values()) {
        if (andere.tot || neu.has(andere.id) || andere.weg.length) continue;
        const platz = this.feldVon(andere);
        for (const f of felder) if (f.x === platz.x && f.y === platz.y) f.frei = false;
      }
    }
    return felder;
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
    // Ein Bauer, der sich wehrt, gibt seine Farm frei - vor dem neuen Auftrag,
    // denn `farmVerlassen` erkennt ihn am alten. `befehl()` tut das schon
    // immer; die Gegenwehr aus `wehren()` ging daran vorbei, und die Farm blieb
    // fuer jeden anderen gesperrt, solange er lebte (Durchsicht Runde 86).
    this.farmVerlassen(einheit);
    einheit.auftrag = {
      art: 'angreifen',
      ziel: ziel.id,
      gebaeude: Boolean(istGebaeude),
      ...(platz ? { platz } : {}),
      ...(heimat ? { heimat } : {}),
    };
    // Wer kaempft, sammelt nicht und baut nicht - das ist der Preis der
    // Gegenwehr (kampf AC-5). `befehl()` raeumt das beim Angriffsbefehl selbst
    // weg (samt Farm, siehe oben); die Gegenwehr aus `wehren()` ging bis Runde
    // 86 daran vorbei, und
    // ein getroffener Dorfbewohner trug auf dem Draht weiter `w` ("arbeitet
    // gerade", bedienung AC-31), waehrend er zurueckschlug.
    einheit.sammelt = false;
    einheit.baut = false;
    einheit.nachladen = 0;
    einheit.weg = stand ? this.wegNach(einheit, stand) : [];
  }

  /**
   * Ein Feld, von dem aus ein Ziel mindestens `mindest` Felder weit weg ist
   * (einheiten AC-36): vom Ziel weg in der Richtung, aus der die Einheit kommt,
   * zwei Felder ueber die Grenze hinaus; ist dort nichts frei, ein wenig
   * gedreht. Gemessen wird wie im Angriff - bei einem Gebaeude vom Rand.
   */
  abstandsplatz(einheit, ziel, istGebaeude, mindest) {
    let mitte = ziel;
    let rand = 0;
    if (istGebaeude) {
      const { x0, y0, x1, y1 } = this.grundflaeche(ziel.art, ziel.x, ziel.y);
      mitte = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
      rand = (x1 - x0) / 2;
    }
    let richtung = Math.atan2(einheit.y - mitte.y, einheit.x - mitte.x);
    if (einheit.x === mitte.x && einheit.y === mitte.y) richtung = 0;
    for (const weite of [mindest + rand + 2, mindest + rand + 3]) {
      for (const drehung of [0, 0.5, -0.5, 1, -1, 1.6, -1.6]) {
        const x = Math.round(mitte.x + Math.cos(richtung + drehung) * weite);
        const y = Math.round(mitte.y + Math.sin(richtung + drehung) * weite);
        if (karten.begehbar(this.karte, x, y) && !this.gebaeudeAn(x, y)) return { x, y };
      }
    }
    return null;
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

  /**
   * Die naechste fremde, lebende Einheit in Sichtweite - gesucht im Raster.
   * Wer eine Mindestreichweite hat (der Mangonel, einheiten AC-36), nimmt
   * niemanden, der naeher steht: auf den koennte er nicht werfen.
   */
  feindInSicht(einheit, raster, sicht) {
    const mindest = EINHEITEN[einheit.art]?.mindestreichweite || 0;
    const zx = Math.floor(einheit.x / RASTER_FELDER);
    const zy = Math.floor(einheit.y / RASTER_FELDER);
    let bestes = null;
    let besterAbstand = sicht;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const zelle = raster.get(`${zx + dx},${zy + dy}`);
        if (!zelle) continue;
        for (const anderer of zelle) {
          if (!this.feindlich(einheit.besitzer, anderer.besitzer)) continue;
          const abstand = Math.hypot(anderer.x - einheit.x, anderer.y - einheit.y);
          if (abstand < mindest) continue;
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
        // Die Wache sucht Einheiten - eine Ramme greift keine an und faehrt
        // im Angriffslauf nur bis ans Ziel (einheiten AC-35).
        if (this.einheitenwert(einheit.besitzer, einheit.art, 'angriff') > 0 && !EINHEITEN[einheit.art].nurGebaeude) wachen.push(einheit);
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
      const feind = this.feindInSicht(einheit, raster, this.einheitenwert(einheit.besitzer, einheit.art, 'sicht'));
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
      const stand = this.einheitenwert(einheit.besitzer, einheit.art, 'reichweite')
        ? null
        : this.naechstesFreies(einheit, felderJeZiel.get(feind.id))
          || nachbarfeld(this.karte, this.feldVon(feind), einheit);
      this.angriffBeginnen(einheit, feind, false, stand, this.feldVon(einheit));
    }
  }

  /**
   * Gebaeude, die schiessen (bauen AC-29, kampf AC-20): ein fertiger Turm
   * nimmt die naechste fremde Einheit in Reichweite und schiesst, sooft die
   * Nachladezeit es erlaubt - wie eine wachende Einheit (kampf AC-2), nur
   * ohne Beine. Ein Ziel behaelt er, solange es lebt und in Reichweite ist;
   * sonst verteilte er seine Pfeile auf alle, die gleich nah stehen. Gemessen
   * wird vom Rand der Grundflaeche, damit die Reichweite fuer einen Turm auf
   * einem Feld und eine Burg auf vier dasselbe heisst. Gebaeude beschiesst er
   * nicht - in der Vorlage auch nicht.
   */
  tuermeTakten() {
    if (!SCHIESSENDE.size) return;
    for (const turm of this.gebaeude.values()) {
      if (!SCHIESSENDE.has(turm.art) || !turm.fertig || turm.leben <= 0) continue;
      if (turm.nachladen > 0) {
        turm.nachladen--;
        continue;
      }
      const reichweite = this.gebaeudewert(turm.besitzer, turm.art, 'reichweite');
      // Die Grundflaeche einmal je Turm, nicht je Einheit: ein Turm ohne Ziel
      // sieht in jedem Takt alle Einheiten durch (Durchsicht Runde 125).
      const { x0, y0, x1, y1 } = this.grundflaeche(turm.art, turm.x, turm.y);
      const abstandVon = (e) => Math.hypot(Math.max(x0 - e.x, 0, e.x - x1), Math.max(y0 - e.y, 0, e.y - y1));
      let ziel = this.einheiten.get(turm.ziel);
      if (!ziel || ziel.tot || abstandVon(ziel) > reichweite) {
        ziel = null;
        let bester = Infinity;
        for (const einheit of this.einheiten.values()) {
          if (einheit.tot || !this.feindlich(turm.besitzer, einheit.besitzer)) continue;
          // Erst das Rechteck, dann die Luftlinie.
          if (einheit.x < x0 - reichweite || einheit.x > x1 + reichweite
            || einheit.y < y0 - reichweite || einheit.y > y1 + reichweite) continue;
          const abstand = abstandVon(einheit);
          if (abstand <= reichweite && abstand < bester) {
            bester = abstand;
            ziel = einheit;
          }
        }
      }
      turm.ziel = ziel?.id ?? null;
      if (!ziel) continue;
      // Der erste Pfeil sofort, danach die Nachladezeit aus den Daten - der
      // Takt des Schusses geht mit ab wie bei `angriffTakten()`.
      const nachladen = this.gebaeudewert(turm.besitzer, turm.art, 'nachladen');
      turm.nachladen = Math.round(nachladen * TAKTE_PRO_SEKUNDE) - 1;
      this.schlagen(turm, ziel, false);
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
      // Die Mauer ist gebrochen (kampf AC-21): weiter zum Ziel dahinter.
      const danach = auftrag.danach;
      const dahinter = danach && (danach.gebaeude ? this.gebaeude.get(danach.ziel) : this.einheiten.get(danach.ziel));
      if (dahinter && !dahinter.tot) {
        this.angriffBeginnen(einheit, dahinter, danach.gebaeude, null, auftrag.heimat);
        return;
      }
      einheit.auftrag = null;
      einheit.weg = [];
      this.marschFortsetzen(einheit);
      return;
    }
    // Ist anderswo eine Mauer gefallen, liegt das Ziel dahinter vielleicht
    // offen (kampf AC-21): dann dorthin, statt weiter auf diese Mauer zu
    // schlagen. In der Belagerung des Pruefstands schlugen sonst zwei
    // Soldaten noch Minuten auf ihr eigenes Feld ein, waehrend die anderen
    // laengst durch die Luecke waren (Runde 139).
    // Und ist das Ziel dahinter inzwischen gefallen, ist die Mauer kein Ziel
    // mehr: stehenbleiben wie bei jedem gefallenen Ziel (Durchsicht Runde 139).
    if (auftrag.danach) {
      const danach = auftrag.danach;
      const dahinter = danach.gebaeude ? this.gebaeude.get(danach.ziel) : this.einheiten.get(danach.ziel);
      if (!dahinter || dahinter.tot) {
        einheit.auftrag = null;
        einheit.weg = [];
        this.marschFortsetzen(einheit);
        return;
      }
    }
    if (auftrag.danach && auftrag.mauernStand !== (this.mauernGefallen || 0)) {
      auftrag.mauernStand = this.mauernGefallen || 0;
      const danach = auftrag.danach;
      const dahinter = danach.gebaeude ? this.gebaeude.get(danach.ziel) : this.einheiten.get(danach.ziel);
      if (dahinter && !dahinter.tot) {
        const stand = danach.gebaeude ? this.randfeld(dahinter, einheit) : this.angriffsplatz(einheit, dahinter, null);
        const weg = stand ? this.wegNach(einheit, stand) : [];
        if (weg.length) {
          this.angriffBeginnen(einheit, dahinter, danach.gebaeude, null, auftrag.heimat);
          einheit.weg = weg;
          return;
        }
      }
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
    const fern = this.einheitenwert(einheit.besitzer, einheit.art, 'reichweite');
    const reichweite = fern || 1;
    const abstand = auftrag.gebaeude
      ? this.abstandZu(einheit, ziel)
      : Math.hypot(ziel.x - einheit.x, ziel.y - einheit.y);
    // Zu nah fuer den Mangonel (einheiten AC-36): er faehrt zurueck, bis das
    // Ziel wieder weit genug weg ist, und wirft erst dann.
    const mindest = EINHEITEN[einheit.art].mindestreichweite || 0;
    if (mindest && abstand < mindest) {
      if (!auftrag.zurueck || !einheit.weg.length) {
        const stand = this.abstandsplatz(einheit, ziel, auftrag.gebaeude, mindest);
        einheit.weg = stand ? this.wegNach(einheit, stand) : [];
        auftrag.zurueck = true;
        if (!einheit.weg.length) {
          einheit.auftrag = null;
          return;
        }
      }
      // Nachgeladen wird auch unterwegs - sonst kostete das Zurueckfahren
      // einen ganzen Wurf.
      if (einheit.nachladen > 0) einheit.nachladen--;
      this.laufen(einheit);
      return;
    }
    auftrag.zurueck = false;
    const nahGenug = abstand <= reichweite + (auftrag.gebaeude ? SCHLAGRAND_BAU : SCHLAGRAND);
    // Ein Fernkaempfer bleibt stehen, sobald das Ziel in Reichweite ist. Ein
    // Nahkaempfer geht beim **ersten** Hinlaufen den Platz zu Ende, der ihm
    // zugewiesen wurde - sonst bleiben drei Angreifer dort stehen, wo der erste
    // gerade nah genug war, und stehen im Bild uebereinander (Runde 63). Wer
    // einmal angekommen war, schlaegt dagegen zu, sobald er wieder in
    // Reichweite ist: zwei, die hintereinander herlaufen, kaempfen sonst nie
    // (Runde 64).
    //
    // **Vor einem Gebaeude geht ein Nahkaempfer seinen Platz zu Ende**
    // (Runde 85): dort gilt `angekommen` erst, wenn sein Weg zu Ende ist.
    // Eine Grundflaeche ist breit, also ist jeder schon auf halbem Weg nah
    // genug - und weil `angekommen` im ersten solchen Takt stand, lief er
    // genau einen Takt weiter und blieb stehen. Drei Milizen am selben
    // Dorfzentrum standen deshalb auf demselben Punkt ihres gemeinsamen Wegs,
    // obwohl jede ihr eigenes Feld zugewiesen hatte (im Bild zu ki AC-11).
    //
    // **Nur fuer Gebaeude**, denn die laufen nicht weg. Fuer eine Einheit
    // bleibt es beim alten Verhalten: dort wuerde das Zuendeglaufen die
    // ersten Treffer verzoegern, und der Konterkreis kippte - Reiter gegen
    // Bogen fiel von 20/20 auf 14/20 (fahrplan AC-9, gemessen in Runde 85).
    if (nahGenug && (fern || !auftrag.gebaeude || !einheit.weg.length)) auftrag.angekommen = true;
    if (!nahGenug || (einheit.weg.length && !fern && !auftrag.angekommen)) {
      auftrag.tritt = false;
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
      if (!einheit.weg.length) {
        // Versperrt eine fremde Mauer den Weg, wird sie angegriffen (kampf
        // AC-21) - aber nur einmal: wer schon eine Mauer angreift und sie
        // nicht erreicht, gibt auf, statt in jedem Takt neu zu suchen. Und
        // nur auf Befehl: wer sich von selbst wehrt (`heimat`, kampf AC-3),
        // bricht keine Mauer, um an einen Feind dahinter zu kommen - sonst
        // stuende eine Wache vor jedem fremden Ring und schluege los, und
        // jede, die einen Feind hinter Wasser sieht, suchte in jedem Takt
        // ein drittes Mal (Durchsicht Runde 139).
        const mauer = auftrag.danach || auftrag.heimat ? null : this.mauerImWeg(einheit, stand);
        if (mauer) {
          const danach = { ziel: auftrag.ziel, gebaeude: auftrag.gebaeude };
          this.angriffBeginnen(einheit, mauer, true, null, auftrag.heimat);
          einheit.auftrag.danach = danach;
          einheit.auftrag.mauernStand = this.mauernGefallen || 0;
        } else {
          einheit.auftrag = null;
        }
      }
      return;
    }
    // Der eine Schritt beiseite (einheiten AC-31): wer auf einem anderen
    // Kaempfer stand, geht auf ein freies Nachbarfeld, das sein Ziel in
    // Schlagweite behaelt - und schlaegt danach von dort. Ohne diese Ausnahme
    // loeschte die naechste Zeile den Schritt, bevor er begann.
    if (auftrag.tritt) {
      if (einheit.weg.length) {
        // Die Nachladezeit laeuft weiter: der Schritt kostet keinen Schlag.
        if (einheit.nachladen > 0) einheit.nachladen--;
        this.laufen(einheit);
        return;
      }
      auftrag.tritt = false;
    }
    einheit.weg = [];
    if (einheit.nachladen > 0) {
      einheit.nachladen--;
      return;
    }
    // Der erste Schlag kommt sofort, danach zaehlt die Nachladezeit aus den
    // Daten (kampf AC-7). Der Takt dieses Schlages geht mit ab, damit zwischen
    // zwei Treffern genau die Zeit der Vorlage liegt und nicht ein Takt mehr.
    const nachladen = this.einheitenwert(einheit.besitzer, einheit.art, 'nachladen');
    einheit.nachladen = Math.round(nachladen * TAKTE_PRO_SEKUNDE) - 1;
    this.schlagen(einheit, ziel, auftrag.gebaeude);
  }

  /**
   * Die fremde Mauer, die einer Einheit den Weg zu `stand` versperrt (kampf
   * AC-21). Gefragt wird erst, wenn die gewoehnliche Suche keinen Weg fand -
   * gibt es einen aussen herum, geht die Einheit ihn, und hierher kommt sie
   * nie. Gesucht wird noch einmal, diesmal mit fremden Mauern und Toren als
   * begehbar; das erste davon auf dem Weg ist die Stelle, an der gebrochen
   * wird. Andere Gebaeude bleiben Hindernis: wer hinter Haeusern steht, ist
   * weiter unerreichbar (Grenzfall in kampf.md). Null: keine Mauer im Weg.
   */
  mauerImWeg(einheit, stand) {
    if (!stand) return null;
    const g = this.karte.groesse;
    const sperre = (b) => this.feindlich(einheit.besitzer, b.besitzer) && (GEBAEUDE[b.art].gezogen || GEBAEUDE[b.art].tor);
    const frei = new Set(this.toreVon(einheit.besitzer) || []);
    let mauern = 0;
    for (const b of this.gebaeude.values()) {
      if (!sperre(b)) continue;
      const { x0, y0, x1, y1 } = this.grundflaeche(b.art, b.x, b.y);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) frei.add(y * g + x);
      mauern += 1;
    }
    if (!mauern) return null;
    // Auch ein schraeger Schritt an einer Mauer vorbei zaehlt: schraeg geht
    // es nur, wenn beide Seitenfelder frei sind (wege.js). Faellt die Ecke
    // eines Rings, fuehrt der Weg schraeg durch die Luecke, ohne ein
    // Mauerfeld zu betreten - und ohne diese Pruefung stand das ganze Heer
    // vor der offenen Ecke ohne Auftrag (Runde 139).
    let vorher = this.feldVon(einheit);
    for (const feld of suchen(this.karte, vorher, stand, frei)) {
      const kandidaten = [feld];
      if (feld.x !== vorher.x && feld.y !== vorher.y) kandidaten.push({ x: feld.x, y: vorher.y }, { x: vorher.x, y: feld.y });
      for (const k of kandidaten) {
        const b = this.gebaeudeAn(k.x, k.y);
        if (b && sperre(b)) return b;
      }
      vorher = feld;
    }
    return null;
  }

  /**
   * Schaden nach der Vorlage (kampf AC-6): Angriff minus die Ruestung des Ziels
   * in der Art dieses Angriffs - nah oder fern -, plus den Bonus des
   * Angreifers auf eine Ruestungsklasse des Ziels, mindestens 1. Eine Formel
   * fuer alle, ohne Zufall (kampf AC-8).
   */
  schaden(angreifer, ziel, istGebaeude) {
    // Auch ein Turm schiesst nach dieser Formel (kampf AC-20): seine Werte
    // kommen aus `gebaeudewert()`, die einer Einheit aus `einheitenwert()`.
    // Die Namen ueberschneiden sich nicht (bauen AC-34, Test).
    const vonGebaeude = !EINHEITEN[angreifer.art];
    const a = vonGebaeude ? GEBAEUDE[angreifer.art] : EINHEITEN[angreifer.art];
    const wert = (feld) => (vonGebaeude
      ? this.gebaeudewert(angreifer.besitzer, angreifer.art, feld)
      : this.einheitenwert(angreifer.besitzer, angreifer.art, feld));
    const werte = istGebaeude ? GEBAEUDE[ziel.art] : EINHEITEN[ziel.art];
    const fern = wert('reichweite');
    // Auch die Ruestung des Ziels kennt seine Verbesserungen: der Webstuhl
    // gibt dem Dorfbewohner +1/+2 (bauen AC-21). Bis Runde 68 las diese Zeile
    // die Tabelle und die Ruestung aus dem Webstuhl war wirkungslos.
    const feld = fern ? 'fernruestung' : 'nahruestung';
    // Ein Gebaeude ebenso: Mauerwerk gibt +1/+1 (bauen AC-34).
    const ruestung = istGebaeude
      ? this.gebaeudewert(ziel.besitzer, ziel.art, feld)
      : this.einheitenwert(ziel.besitzer, ziel.art, feld);
    let bonus = 0;
    for (const klasse of werte.klassen || []) bonus += a.bonus?.[klasse] || 0;
    return Math.max(1, wert('angriff') - ruestung + bonus);
  }

  // Ein Schlag wird vorgemerkt, nicht sofort verrechnet: abgerechnet wird am
  // Ende des Taktes. So toeten zwei Einheiten, die einander den letzten Schlag
  // versetzen, sich beide - kein Vorrang fuer den, der zuerst dran war.
  schlagen(angreifer, ziel, istGebaeude) {
    // Ein Stein trifft nicht sofort, sondern nach seinem Flug, und nicht das
    // Ziel, sondern die Stelle, an der es beim Abwurf stand (kampf AC-19).
    const geschoss = EINHEITEN[angreifer.art]?.geschoss;
    if (geschoss) {
      this.steinWerfen(angreifer, ziel, istGebaeude, geschoss);
      return;
    }
    this.schlaege.push({
      angreifer, ziel, schaden: this.schaden(angreifer, ziel, istGebaeude), gebaeude: istGebaeude,
    });
    // Ein Schuss eines Fernkaempfers geht als Pfeil in den naechsten Zustand
    // (bedienung AC-40): von wo nach wo. Gerechnet ist er schon - der Pfeil
    // ist Darstellung (ADR-0001).
    // Ein Turm schiesst ebenso Pfeile, aus der Mitte seiner Grundflaeche.
    const vonGebaeude = !EINHEITEN[angreifer.art];
    const fern = vonGebaeude
      ? this.gebaeudewert(angreifer.besitzer, angreifer.art, 'reichweite')
      : this.einheitenwert(angreifer.besitzer, angreifer.art, 'reichweite');
    if (fern > 0) {
      const mitte = (g) => {
        const { x0, y0, x1, y1 } = this.grundflaeche(g.art, g.x, g.y);
        return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
      };
      const von = vonGebaeude ? mitte(angreifer) : angreifer;
      const nach = istGebaeude ? mitte(ziel) : ziel;
      (this.schuesse ??= []).push([von.x, von.y, nach.x, nach.y].map((w) => Math.round(w * 10) / 10));
      // Ohne Zustand - im Pruefstand fragt keiner danach - wuechse die Liste
      // eine ganze Partie lang. Was weiter zurueckliegt als die letzten
      // SCHUESSE_HOECHSTENS, sieht ohnehin keiner mehr fliegen.
      if (this.schuesse.length > SCHUESSE_HOECHSTENS) this.schuesse.splice(0, this.schuesse.length - SCHUESSE_HOECHSTENS);
    }
  }

  /**
   * Ein Stein fliegt los (kampf AC-19). Er ist so lange unterwegs, wie er mit
   * `geschoss` Feldern je Sekunde braucht, und geht wie ein Pfeil in den
   * Zustand - als fuenfter Wert eine 1, damit der Browser einen Stein zeichnet.
   */
  steinWerfen(angreifer, ziel, istGebaeude, geschoss) {
    let nach = { x: ziel.x, y: ziel.y };
    if (istGebaeude) {
      const { x0, y0, x1, y1 } = this.grundflaeche(ziel.art, ziel.x, ziel.y);
      nach = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
    }
    const weite = Math.hypot(nach.x - angreifer.x, nach.y - angreifer.y);
    this.einschlaege.push({
      x: nach.x,
      y: nach.y,
      takte: Math.max(1, Math.round((weite / geschoss) * TAKTE_PRO_SEKUNDE)),
      angreifer,
      gebaeude: istGebaeude ? ziel : null,
    });
    (this.schuesse ??= []).push([...[angreifer.x, angreifer.y, nach.x, nach.y].map((w) => Math.round(w * 10) / 10), 1]);
    if (this.schuesse.length > SCHUESSE_HOECHSTENS) this.schuesse.splice(0, this.schuesse.length - SCHUESSE_HOECHSTENS);
  }

  /**
   * Steine, die in diesem Takt ankommen (kampf AC-19): jede lebende Einheit im
   * Umkreis von `flaeche` Feldern um die Stelle des Einschlags wird getroffen,
   * auch eine eigene - in der Mitte mit vollem Schaden, am Rand mit der Haelfte,
   * dazwischen gleichmaessig. Ein Gebaeude als Ziel bekommt den vollen
   * Schaden. Abgerechnet wird mit den Schlaegen des Taktes, also gleichzeitig
   * mit allem anderen (kampf AC-10); auch ein Werfer, der inzwischen fiel,
   * trifft noch.
   */
  einschlaegeTakten() {
    if (!this.einschlaege.length) return;
    const bleiben = [];
    for (const stein of this.einschlaege) {
      stein.takte--;
      if (stein.takte > 0) {
        bleiben.push(stein);
        continue;
      }
      const { angreifer } = stein;
      const flaeche = EINHEITEN[angreifer.art].flaeche;
      if (stein.gebaeude && this.gebaeude.has(stein.gebaeude.id)) {
        this.schlaege.push({
          angreifer, ziel: stein.gebaeude, schaden: this.schaden(angreifer, stein.gebaeude, true), gebaeude: true,
        });
      }
      for (const einheit of this.einheiten.values()) {
        if (einheit.tot) continue;
        const abstand = Math.hypot(einheit.x - stein.x, einheit.y - stein.y);
        if (abstand > flaeche) continue;
        const anteil = 1 - 0.5 * (abstand / flaeche);
        this.schlaege.push({
          angreifer,
          ziel: einheit,
          schaden: Math.max(1, Math.round(this.schaden(angreifer, einheit, false) * anteil)),
          gebaeude: false,
        });
      }
    }
    this.einschlaege = bleiben;
  }

  schlaegeAbrechnen() {
    if (!this.schlaege.length) return;
    for (const schlag of this.schlaege) schlag.ziel.leben -= schlag.schaden;
    for (const { angreifer, ziel, gebaeude } of this.schlaege) {
      this.angriffMelden(ziel, gebaeude, angreifer);
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
   * Wer getroffen wird, erfaehrt es (kampf AC-14): der Besitzer des Ziels
   * bekommt mit dem naechsten Zustand den Ort. Nur seiner - im Nebel sehen
   * die anderen den eigenen Spielereintrag nicht (kampf AC-13).
   */
  angriffMelden(ziel, gebaeude, angreifer) {
    const spieler = this.spielerVon(ziel.besitzer);
    if (!spieler || spieler.aus || (angreifer && !this.feindlich(angreifer.besitzer, ziel.besitzer))) return;
    let ort = { x: ziel.x, y: ziel.y };
    if (gebaeude) {
      const { x0, y0, x1, y1 } = this.grundflaeche(ziel.art, ziel.x, ziel.y);
      ort = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
    }
    const alt = spieler.angriff;
    if (alt && this.takt - alt.takt < MELDUNG_PAUSE && Math.hypot(alt.x - ort.x, alt.y - ort.y) < MELDUNG_ABSTAND) {
      // Dasselbe Gefecht: nicht noch einmal melden, aber die Pause beginnt neu.
      alt.takt = this.takt;
      return;
    }
    spieler.angriff = { x: ort.x, y: ort.y, takt: this.takt, neu: true };
  }

  /**
   * Wer getroffen wird und nicht von selbst wacht, laesst die Arbeit liegen und
   * schlaegt zurueck (kampf AC-2, zweiter Satz). Das betrifft den Dorfbewohner:
   * er arbeitet weiter, **bis** er getroffen wird. Auch diese Gegenwehr ist
   * eine Verfolgung, die niemand befohlen hat - sie endet nach fuenf Feldern.
   */
  wehren(einheit, angreifer) {
    if (einheit.tot || !angreifer || angreifer.tot) return;
    // Von einem Turm getroffen, schlaegt niemand von selbst zurueck: ein
    // Dorfbewohner, der mit der Axt auf 1020 Leben Stein losgeht, stirbt nur
    // schneller. Wer den Turm angreifen soll, braucht einen Befehl (bauen AC-29).
    if (!EINHEITEN[angreifer.art]) return;
    // Vom eigenen Stein getroffen (kampf AC-19), oder von dem eines
    // Verbuendeten (spielziel AC-14), schlaegt niemand zurueck.
    if (!this.feindlich(einheit.besitzer, angreifer.besitzer)) return;
    if (EINHEITEN[einheit.art].wacht) return;
    // Eine Ramme schlaegt nicht zurueck: sie trifft nur Gebaeude (einheiten AC-35).
    if (EINHEITEN[einheit.art].nurGebaeude) return;
    if (einheit.auftrag?.art === 'angreifen' || !this.einheitenwert(einheit.besitzer, einheit.art, 'angriff')) return;
    const stand = nachbarfeld(this.karte, this.feldVon(angreifer), einheit);
    this.angriffBeginnen(einheit, angreifer, false, stand, this.feldVon(einheit));
  }

  // Ein Toter liegt noch zwei Sekunden im Bild (kampf AC-10), tut aber nichts
  // mehr: kein Auftrag, keine Bevoelkerung, kein Ziel fuer einen Angriff.
  einheitSterben(einheit) {
    this.farmVerlassen(einheit);
    // Fuer die Tafel (spielziel AC-8). Wer aufgibt, verliert damit alles auf
    // einmal - das ist richtig so: gefallen ist gefallen.
    const spieler = this.spielerVon(einheit.besitzer);
    if (spieler) spieler.verloren++;
    einheit.leben = 0;
    einheit.tot = true;
    // Der Takt des Todes steht getrennt daneben: Takt 0 waere als Schalter
    // falsch gelesen worden.
    einheit.gefallen = this.takt;
    einheit.auftrag = null;
    einheit.weg = [];
    einheit.sammelt = false;
    einheit.baut = false;
    einheit.bekehrt = false;
    einheit.heilt = null;
    this.bestandPruefen = true;
  }

  // Ein Gebaeude ohne Leben verschwindet samt seinem Platz auf der Karte.
  // Truemmer gibt es nicht - die waeren eine Entscheidung fuer Stufe C.
  gebaeudeZerstoeren(gebaeude) {
    this.gebaeude.delete(gebaeude.id);
    this.gebaeudeSichtNeu = true;
    this.freigeben(gebaeude);
    this.gebaeudeGeaendert(gebaeude);
    this.bestandPruefen = true;
  }

  // ---- Partieende (spielziel AC-5, AC-6) ----------------------------------

  /** Die Partie ist entschieden. Der Raum haelt daran seine Uhr an. */
  get vorbei() {
    return this.ende !== null;
  }

  /**
   * Hat dieser Spieler noch etwas, das ihn im Spiel haelt? Eine lebende
   * Einheit oder ein Gebaeude, das zum Bestand zaehlt - Farmen (spaeter
   * Mauern und Tore) zaehlen nicht, die Zeile dazu steht an den Daten.
   * Eine Baustelle zaehlt: aus ihr kann noch ein Dorfzentrum werden.
   */
  imBestand(spielerId) {
    for (const e of this.einheiten.values()) if (e.besitzer === spielerId && !e.tot) return true;
    for (const g of this.gebaeude.values()) {
      if (g.besitzer === spielerId && GEBAEUDE[g.art].bestand !== false) return true;
    }
    return false;
  }

  /**
   * Wer nichts mehr hat, scheidet aus; bleiben nur Verbuendete uebrig - oder
   * einer allein -, ist die Partie entschieden (spielziel AC-20). Gerechnet **auf dem Server und in dem Takt**, in dem der
   * letzte Verlust abgerechnet wurde - deshalb steht der Aufruf am Ende von
   * `takten()`, hinter `schlaegeAbrechnen()`.
   *
   * Zwei Enden gibt es: "eroberung" (einer blieb uebrig) und "zeit" (nach
   * 90 Spielminuten ohne Entscheidung, unentschieden). Faellt der vorletzte
   * und der letzte im selben Takt, bleibt niemand uebrig - das ist dann auch
   * unentschieden, mit dem Grund "eroberung" und ohne Sieger.
   */
  endePruefen() {
    if (this.ende) return;
    if (this.bestandPruefen) {
      this.bestandPruefen = false;
      for (const spieler of this.spieler) {
        if (!spieler.aus && !this.imBestand(spieler.id)) spieler.aus = true;
      }
    }
    const uebrig = this.spieler.filter((s) => !s.aus);
    if (!uebrig.length) {
      this.endeSetzen([], 'eroberung');
      return;
    }
    // Keine zwei Uebrigen sind Gegner: dann gewinnt ihr Team, und zwar ganz,
    // auch wer daraus schon ausgeschieden ist. Wer kein Team hat, ist jedem
    // Gegner - er gewinnt nur allein. Gefragt wird `feindlich`, die eine
    // Stelle fuer "Gegner oder nicht" (spielziel AC-14).
    // Laeuft die Frist einer Kuendigung unter den Uebrigen, ist nichts
    // entschieden: in hoechstens 60 Sekunden sind sie Gegner, und wer
    // gekuendigt hat, gewaenne sonst mit dem Team, das er eben verlassen hat
    // (spielziel AC-21, Durchsicht Runde 154).
    const fristLaeuft = this.kuendigungen.some((k) => !k.vorbei && uebrig.some((s) => s.id === k.wer));
    if (this.mitGegnern && !fristLaeuft && uebrig.every((s) => !this.feindlich(uebrig[0].id, s.id))) {
      const team = uebrig[0].team || null;
      const gewinner = team ? this.spieler.filter((s) => s.team === team).map((s) => s.id) : [uebrig[0].id];
      this.endeSetzen(gewinner, 'eroberung', team);
      return;
    }
    if (this.takt >= PARTIE_MINUTEN * 60 * TAKTE_PRO_SEKUNDE) {
      this.endeSetzen([], 'zeit');
    }
  }

  /**
   * Das Ende festhalten - mit der Tafel, die alle am Schluss sehen
   * (spielziel AC-8). Sie entsteht genau einmal, in dem Takt, in dem die
   * Partie entschieden ist, und geht danach mit jedem Zustand und jedem
   * Aufbau mit: so sieht sie auch, wer nach einem Abbruch zurueckkommt.
   *
   * Die Reihenfolge ist die der Spieler, nicht die des Ergebnisses - wer die
   * Tafel zeigt, sortiert sie, und bei allen steht dasselbe.
   */
  endeSetzen(gewinner, grund, team = null) {
    this.ende = {
      gewinner,
      // Gewinnt genau einer, steht er auch hier - wie bis Runde 149.
      sieger: gewinner.length === 1 ? gewinner[0] : null,
      ...(team ? { team } : {}),
      grund,
      takt: this.takt,
      tafel: this.spieler.map((s) => ({
        id: s.id,
        gesammelt: { ...s.gesammelt },
        ausgebildet: s.ausgebildet,
        verloren: s.verloren,
        zeitalter: s.zeitalter,
        ...(s.aus ? { aus: 1 } : {}),
      })),
    };
  }

  /**
   * Aufgeben (spielziel AC-6): alles faellt, der Spieler gilt als
   * ausgeschieden, und die Partie laeuft fuer die anderen weiter. Ein eigener
   * Ausgang ist das nicht - es ist der schnelle Weg in AC-5, deshalb
   * entscheidet dieselbe Pruefung, ob damit eine Partie zu Ende ist.
   */
  aufgeben(spielerId) {
    const spieler = this.spielerVon(spielerId);
    if (!spieler) return { fehler: 'Diesen Spieler gibt es hier nicht.' };
    if (this.ende) return { fehler: 'Die Partie ist schon zu Ende.' };
    if (spieler.aus) return { fehler: 'Du bist schon ausgeschieden.' };
    // Die Einheiten fallen, wie sie im Kampf fallen: sie liegen zwei Sekunden
    // im Bild, statt zu verschwinden (kampf AC-10).
    for (const einheit of this.einheiten.values()) {
      if (einheit.besitzer === spielerId && !einheit.tot) this.einheitSterben(einheit);
    }
    for (const gebaeude of [...this.gebaeude.values()]) {
      if (gebaeude.besitzer === spielerId) this.gebaeudeZerstoeren(gebaeude);
    }
    spieler.aus = true;
    // Sofort und nicht erst im naechsten Takt: wer aufgibt, soll nicht noch
    // ein Zehntel lang als Mitspieler zaehlen.
    this.endePruefen();
    return {};
  }

  /**
   * Ein Buendnis loesen (spielziel AC-21, ADR-0013 Punkt 3 und 4): wer
   * kuendigt, tritt aus seinem Team aus - gegenueber allen Verbuendeten
   * zugleich, also in beide Richtungen. Die gemeinsame Sicht endet sofort,
   * Gegner sind sie erst nach der Frist (`fristenTakten`). Zuruecknehmen
   * geht nicht: eine zweite Kuendigung gibt es nicht, und eine Nachricht,
   * die eine aufhebt, auch nicht.
   */
  kuendigen(spielerId) {
    const spieler = this.spielerVon(spielerId);
    if (!spieler) return { fehler: 'Diesen Spieler gibt es hier nicht.' };
    if (this.ende) return { fehler: 'Die Partie ist schon zu Ende.' };
    if (spieler.aus) return { fehler: 'Du bist schon ausgeschieden.' };
    if (this.buendnisse === 'fest') return { fehler: 'Die Bündnisse dieser Partie sind fest.' };
    if (this.kuendigungen.some((k) => k.wer === spielerId)) return { fehler: 'Du hast dein Bündnis schon gelöst.' };
    // Wer selbst schon gekuendigt hat, zaehlt nicht: ihm zu kuendigen
    // aenderte nichts (Durchsicht Runde 154).
    const verbuendete = this.spieler.filter((s) => s.id !== spielerId && !s.aus && !this.feindlich(spielerId, s.id)
      && !this.kuendigungen.some((k) => k.wer === s.id));
    if (!verbuendete.length) return { fehler: 'Du hast keinen Verbündeten.' };
    this.kuendigungen.push({ wer: spielerId, bis: this.takt + KUENDIGUNG_SEKUNDEN * TAKTE_PRO_SEKUNDE });
    this.sichtTrennen(spielerId);
    return {};
  }

  /**
   * Die Sicht eines Spielers von der seines Teams trennen (spielziel
   * AC-21): er nimmt mit, was er bis jetzt sah und erkundet hatte - eine
   * Abschrift -, und von da an rechnet jede Seite fuer sich. Was er von den
   * Gebaeuden der anderen wusste, bleibt beiden als Erinnerung im Nebel
   * (kampf AC-12): sonst erfuehre keiner je, wenn eines davon faellt, wo er
   * nicht hinsieht.
   */
  sichtTrennen(id) {
    const alt = this.sichten.get(id);
    const bisher = this.spieler.filter((s) => s.id !== id && this.sichten.get(s.id) === alt).map((s) => s.id);
    if (!bisher.length) return;
    this.sichten.set(id, { sichtbar: alt.sichtbar.slice(), gebaeude: alt.gebaeude.slice(), erkundet: alt.erkundet.slice() });
    if (this.bekannt) {
      for (const [wer, von] of [...bisher.map((b) => [id, b]), ...bisher.map((b) => [b, id])]) {
        const bekannt = this.bekannt.get(wer);
        if (!bekannt) continue;
        for (const g of this.gebaeude.values()) if (g.besitzer === von) bekannt.set(g.id, { art: g.art, x: g.x, y: g.y });
      }
    }
    // Sofort neu gerechnet: bis zur naechsten Rechnung saehe sonst das Team
    // noch, was seine Einheiten sehen.
    this.gebaeudeSichtNeu = true;
    this.sichtAktualisieren();
  }

  // Laeuft eine Frist ab, gehoert der Kuendigende keinem Team mehr an
  // (spielziel AC-21): von da an ist er jedem Gegner.
  fristenTakten() {
    for (const k of this.kuendigungen) {
      if (k.vorbei || this.takt < k.bis) continue;
      k.vorbei = true;
      this.spielerVon(k.wer).team = null;
      this.teamVon.set(k.wer, null);
      this.mitGegnern = this.spieler.some((a) => this.spieler.some((b) => this.feindlich(a.id, b.id)));
    }
  }

  takten() {
    // Eine entschiedene Partie rechnet nicht weiter. Der Raum haelt seine Uhr
    // an (`vorbei`); dies ist die zweite Sperre, fuer den Pruefstand und fuer
    // Takte, die noch im Zeitraffer unterwegs sind.
    if (this.ende) return;
    this.takt++;
    const bevoelkerung = this.bevoelkerung();
    for (const gebaeude of this.gebaeude.values()) this.gebaeudeTakten(gebaeude, bevoelkerung);
    this.tiereTakten();
    // Zweimal je Sekunde sehen sich stehende Kampfeinheiten um (kampf AC-2).
    if (this.takt % WACHE_TAKTE === 0) this.wacheTakten();
    for (const einheit of this.einheiten.values()) this.einheitTakten(einheit);
    this.tuermeTakten();
    // Einmal je Sekunde heilen Moenche (einheiten AC-37).
    if (this.takt % TAKTE_PRO_SEKUNDE === 0) this.heilenTakten();
    // Ebenso oft treten Stehende auseinander (einheiten AC-29).
    if (this.takt % WACHE_TAKTE === 0) this.ausweichen();
    this.einschlaegeTakten();
    this.schlaegeAbrechnen();
    if (this.takt % SICHT_TAKTE === 0) this.sichtAktualisieren();
    if (this.kuendigungen.length) this.fristenTakten();
    this.endePruefen();
  }

  /**
   * Ob diese Einheit dieses Ziel bekehren kann (einheiten AC-38): sie hat
   * `bekehren` in den Daten und ruht nicht, das Ziel ist eine fremde,
   * lebende Einheit, und keine seiner Klassen steht in `nicht`.
   */
  kannBekehren(einheit, ziel) {
    const bekehren = EINHEITEN[einheit.art].bekehren;
    if (!bekehren || einheit.ruhtBis > this.takt) return false;
    if (!ziel || ziel.tot || !this.feindlich(einheit.besitzer, ziel.besitzer)) return false;
    return !EINHEITEN[ziel.art].klassen.some((k) => bekehren.nicht.includes(k));
  }

  /**
   * Wie viele Takte ein Bekehren dauert: vor `frueh` Sekunden nie, danach je
   * Sekunde mit `chance`, nach `spaet` sicher. Gezogen beim Befehl, aus dem
   * Zufall der Partie - dieselbe Partie, dieselbe Dauer.
   */
  bekehrDauer(bekehren) {
    let sekunden = bekehren.frueh;
    while (sekunden < bekehren.spaet && this.zufall() >= bekehren.chance) sekunden++;
    return sekunden * TAKTE_PRO_SEKUNDE;
  }

  bekehrenBeginnen(einheit, ziel) {
    einheit.auftrag = { art: 'bekehren', ziel: ziel.id, dauer: this.bekehrDauer(EINHEITEN[einheit.art].bekehren), fortschritt: 0 };
    einheit.weg = [];
    einheit.bekehrt = false;
  }

  /**
   * Ein Takt des Bekehrens: ausser Reichweite hingehen (der Weg wird
   * einmal je Sekunde neu gesucht, das Ziel laeuft), in Reichweite stehen
   * und zaehlen. Die Zeit laeuft nur in Reichweite. Ist die Dauer um,
   * gehoert das Ziel dem Spieler des Moenchs, und der Moench ruht.
   */
  bekehrenTakten(moench) {
    const auftrag = moench.auftrag;
    const bekehren = EINHEITEN[moench.art].bekehren;
    const ziel = this.einheiten.get(auftrag.ziel);
    if (!ziel || ziel.tot || !this.feindlich(moench.besitzer, ziel.besitzer)) {
      moench.auftrag = null;
      moench.weg = [];
      moench.bekehrt = false;
      return;
    }
    if (Math.hypot(ziel.x - moench.x, ziel.y - moench.y) > bekehren.reichweite) {
      moench.bekehrt = false;
      if (!moench.weg.length || this.takt % TAKTE_PRO_SEKUNDE === 0) {
        moench.weg = this.wegNach(moench, this.feldVon(ziel));
        // Kein Weg dorthin (hinter einer Mauer): er gibt auf, statt fuer
        // immer zu warten - und heilt wieder.
        if (!moench.weg.length) {
          moench.auftrag = null;
          return;
        }
      }
      this.laufen(moench);
      return;
    }
    moench.weg = [];
    moench.bekehrt = true;
    auftrag.fortschritt++;
    if (auftrag.fortschritt < auftrag.dauer) return;
    this.bekehrt(ziel, moench.besitzer);
    moench.auftrag = null;
    moench.bekehrt = false;
    moench.ruhtBis = this.takt + bekehren.ruhe * TAKTE_PRO_SEKUNDE;
  }

  /**
   * Eine Einheit wechselt den Besitzer (einheiten AC-38). Fuer den alten
   * Spieler ist sie verloren (Tafel, spielziel AC-8); was sie tat, endet; wer
   * vom neuen Besitzer sie angriff, laesst ab. Ihr Leben bleibt, nur nie ueber
   * dem vollen Wert des neuen Besitzers.
   */
  bekehrt(einheit, neuerBesitzer) {
    const alter = this.spielerVon(einheit.besitzer);
    if (alter) alter.verloren++;
    this.farmVerlassen(einheit);
    einheit.besitzer = neuerBesitzer;
    einheit.auftrag = null;
    einheit.angriffslauf = null;
    einheit.weg = [];
    einheit.sammelt = false;
    einheit.baut = false;
    einheit.leben = Math.min(einheit.leben, this.einheitenwert(neuerBesitzer, einheit.art, 'leben'));
    // Wer sie angriff, laesst ab - im Angriffslauf geht es weiter zum
    // Marschziel, wie wenn das Ziel gefallen waere. Das gilt auch fuer die
    // Verbuendeten des neuen Besitzers (spielziel AC-14).
    for (const andere of this.einheiten.values()) {
      const a = andere.auftrag;
      if (!this.feindlich(andere.besitzer, neuerBesitzer) && a?.art === 'angreifen' && !a.gebaeude && a.ziel === einheit.id) {
        andere.auftrag = null;
        andere.weg = [];
        this.marschFortsetzen(andere);
      }
    }
    // Ein Schlag aus diesem Takt, der noch nicht abgerechnet ist, trifft
    // keinen mehr, der jetzt dem Schlagenden oder seinem Verbuendeten gehoert.
    this.schlaege = this.schlaege.filter((s) => s.gebaeude || s.ziel !== einheit || this.feindlich(s.angreifer.besitzer, neuerBesitzer));
    this.bestandPruefen = true;
  }

  /**
   * Moenche heilen (einheiten AC-37): wer steht und `heilen` in den Daten hat,
   * gibt der naechsten eigenen verletzten Einheit in Reichweite `je` Leben -
   * einer je Sekunde, nicht allen auf einmal. Nicht geheilt werden: wer
   * kaempft, wer Belagerung ist, Gebaeude und der Moench selbst. Steht der
   * Heiler nicht mehr oder ist niemand verletzt, hoert er auf (`heilt`).
   */
  heilenTakten() {
    for (const moench of this.einheiten.values()) {
      const heilen = EINHEITEN[moench.art].heilen;
      if (!heilen) continue;
      moench.heilt = null;
      if (moench.tot || moench.auftrag || moench.weg.length) continue;
      let bester = null;
      let abstand = Infinity;
      for (const e of this.einheiten.values()) {
        if (e === moench || e.tot || e.besitzer !== moench.besitzer) continue;
        if (e.auftrag?.art === 'angreifen' || EINHEITEN[e.art].klassen.includes('belagerung')) continue;
        if (e.leben >= this.einheitenwert(e.besitzer, e.art, 'leben')) continue;
        const d = Math.hypot(e.x - moench.x, e.y - moench.y);
        if (d <= heilen.reichweite && d < abstand) {
          bester = e;
          abstand = d;
        }
      }
      if (!bester) continue;
      bester.leben = Math.min(this.einheitenwert(bester.besitzer, bester.art, 'leben'), bester.leben + heilen.je);
      moench.heilt = bester.id;
    }
  }

  /**
   * Keine zwei Einheiten uebereinander (einheiten AC-29). Stehen zwei naeher
   * als `AUSWEICHEN_ABSTAND` beieinander, tritt eine auf ein freies
   * Nachbarfeld - eines, auf dem sie ihre Arbeit weitertun kann. Gezogen wird,
   * wer die hoehere Nummer hat und ausweichen darf, sonst der andere; duerfen
   * beide nicht, bleibt es, wie es ist.
   *
   * Warum allgemein und nicht an jeder Stelle, die ein Ziel vergibt: das
   * wurde siebenmal versucht (Runden 56, 61, 63, 64, 67, 85, 86), und jede
   * Runde fand einen neuen Weg, auf dem zwei auf demselben Feld ankamen - ein
   * zweiter Befehl auf dasselbe Ziel, ein Schlachter am Dorfzentrum, ein
   * Geflohener auf der Wache. Hier zaehlt nur, wo sie **stehen**.
   */
  ausweichen() {
    const stehend = [];
    const raster = new Map();
    // Zahlen statt Zeichenketten als Schluessel: mit Kaempfern, die
    // ausweichen duerfen, fragt jeder Stehende acht Nachbarfelder ab, und
    // `${x},${y}` kostete dabei die Haelfte der Zeit (Runde 100, gemessen).
    const g = this.karte.groesse;
    const schluessel = (x, y) => y * g + x;
    for (const e of this.einheiten.values()) {
      if (e.tot || e.weg.length) continue;
      stehend.push(e);
      const k = schluessel(Math.round(e.x), Math.round(e.y));
      if (!raster.has(k)) raster.set(k, []);
      raster.get(k).push(e);
    }
    // Der **erste** Nahe, nicht alle: 800 Stehende auf drei Feldern kosteten
    // sonst 7,6 ms je Durchgang (Durchsicht Runde 89, gemessen) - jedes Paar
    // wird trotzdem gesehen, von einer der beiden Seiten.
    // Die eigene Zelle zuerst: dort stehen fast immer die Paare. Anders herum
    // lief die Suche bei drei dichten Feldern nebeneinander an je 267
    // Einheiten der Nachbarzelle vorbei, die ein ganzes Feld weg stehen
    // (2,0 ms je Durchgang, gemessen).
    const NACHBARN = [[0, 0], [-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
    const ersterNaher = (e) => {
      const fx = Math.round(e.x);
      const fy = Math.round(e.y);
      for (const [dx, dy] of NACHBARN) {
        for (const o of raster.get(schluessel(fx + dx, fy + dy)) || []) {
          if (o !== e && !gezogen.has(o.id) && Math.hypot(o.x - e.x, o.y - e.y) < AUSWEICHEN_ABSTAND) return o;
        }
      }
      return null;
    };
    // Belegt ist, wo jemand steht oder geht, und wohin jemand unterwegs ist -
    // einmal je Durchgang gesammelt, nicht je Kandidatenfeld: sonst kostet ein
    // Haufen von 800 Einheiten quadratisch (einheiten AC-21: ein Takt unter
    // 1 ms).
    // Erst gebaut, wenn jemand ausweichen darf - stehen nur Angreifer
    // aufeinander, braucht es keiner.
    let belegt = null;
    const belegung = () => {
      if (belegt) return belegt;
      belegt = new Set();
      for (const o of this.einheiten.values()) {
        if (o.tot) continue;
        belegt.add(schluessel(Math.round(o.x), Math.round(o.y)));
        if (o.weg.length) {
          const ziel = o.weg[o.weg.length - 1];
          belegt.add(schluessel(ziel.x, ziel.y));
        }
      }
      return belegt;
    };
    const gezogen = new Set();
    // Wer in diesem Durchgang keinen Platz fand, wird nicht noch einmal
    // gefragt: 800 angekommene Angreifer an einem Ziel fragten sonst jeden
    // Nachbarn neu (0,74 ms je Durchgang statt 0,09; Durchsicht Runde 100).
    const ohnePlatz = new Set();
    for (const e of stehend) {
      if (gezogen.has(e.id)) continue;
      const o = ersterNaher(e);
      if (!o) continue;
      // Die hoehere Nummer weicht - deterministisch, ohne Zufall. Findet sie
      // keinen Platz (ein Bauer an einer voll besetzten Baustelle), versucht es
      // der andere; sonst blieben beide aufeinander, obwohl einer Platz haette
      // (Durchsicht Runde 89).
      for (const wer of o.id > e.id ? [o, e] : [e, o]) {
        if (ohnePlatz.has(wer.id) || !this.darfAusweichen(wer)) continue;
        const feld = this.ausweichfeld(wer, belegung());
        if (!feld) {
          ohnePlatz.add(wer.id);
          continue;
        }
        wer.weg = [feld];
        if (wer.auftrag?.art === 'angreifen') wer.auftrag.tritt = true;
        belegung().add(schluessel(feld.x, feld.y));
        gezogen.add(wer.id);
        break;
      }
    }
  }

  // Wer ausweichen darf: wer kaempft, erst wenn er an seinem Ziel angekommen
  // ist und es noch steht - dann auf ein Feld in Schlagweite (einheiten AC-31,
  // Runde 100); nicht der Bauer auf seiner Farm (eine Farm hat einen
  // Arbeiter) - und noch nicht, wer am Vorrat oder am Tier arbeitet. Sammler, die sich nicht
  // stapeln, kosten die Wirtschafts-KI im Median 0,4 Minuten bis zu den
  // ersten 500 Nahrung, und neun von vierzig KIs verfehlen damit die zehn
  // Minuten aus fahrplan AC-5 (Runde 89, gemessen). Das ist einheiten AC-30,
  // eine eigene Runde.
  darfAusweichen(einheit) {
    const art = einheit.auftrag?.art;
    if (art === 'angreifen') return Boolean(einheit.auftrag.angekommen && this.angriffsziel(einheit.auftrag));
    return art !== 'farm' && art !== 'sammeln' && art !== 'tier';
  }

  // Das Ziel eines Angriffs, solange es steht.
  angriffsziel(auftrag) {
    const ziel = auftrag.gebaeude ? this.gebaeude.get(auftrag.ziel) : this.einheiten.get(auftrag.ziel);
    return ziel && !ziel.tot ? ziel : null;
  }

  /**
   * Das naechste freie Nachbarfeld, auf dem die Einheit ihre Arbeit behaelt:
   * wer baut, bleibt an der Baustelle (1,2 Felder, wie der Bauauftrag).
   * Sammler und Schlachter weichen noch nicht aus (einheiten AC-30). Frei
   * heisst: begehbar, kein Gebaeude, niemand steht dort oder ist dorthin
   * unterwegs.
   */
  ausweichfeld(einheit, belegt) {
    const fx = Math.round(einheit.x);
    const fy = Math.round(einheit.y);
    const auftrag = einheit.auftrag;
    let passt = () => true;
    if (auftrag?.art === 'bauen') {
      const baustelle = this.gebaeude.get(auftrag.gebaeude);
      passt = (x, y) => !baustelle || this.abstandZu({ x, y }, baustelle) <= 1.2;
    } else if (auftrag?.art === 'angreifen') {
      // Dieselbe Schlagweite wie in angriffTakten - wer dort steht, schlaegt.
      const ziel = this.angriffsziel(auftrag);
      const reichweite = this.einheitenwert(einheit.besitzer, einheit.art, 'reichweite') || 1;
      passt = (x, y) => Boolean(ziel) && (auftrag.gebaeude
        ? this.abstandZu({ x, y }, ziel) <= reichweite + SCHLAGRAND_BAU
        : Math.hypot(ziel.x - x, ziel.y - y) <= reichweite + SCHLAGRAND);
    }
    let bestes = null;
    let bester = Infinity;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const x = fx + dx;
        const y = fy + dy;
        if (belegt.has(y * this.karte.groesse + x)) continue;
        if (!karten.begehbar(this.karte, x, y) || this.gebaeudeAn(x, y) || !passt(x, y)) continue;
        // Schraeg nur, wenn beide Ecken frei sind: auf halbem Weg rundet die
        // Lage auf eines der beiden geraden Nachbarfelder - war das Wald,
        // stand die Einheit im Hindernis (Gefechtsstand, Startwert 8, Takt 109).
        if (dx && dy && (!karten.begehbar(this.karte, x, fy) || !karten.begehbar(this.karte, fx, y)
          || this.gebaeudeAn(x, fy) || this.gebaeudeAn(fx, y))) continue;
        const d = Math.hypot(x - einheit.x, y - einheit.y);
        if (d < bester) {
          bester = d;
          bestes = { x, y };
        }
      }
    }
    return bestes;
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
    if (einheit.auftrag?.art === 'bekehren') {
      this.bekehrenTakten(einheit);
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
        this.bauenWeiter(einheit);
      } else if (this.abstandZu(einheit, baustelle) <= 1.2) {
        einheit.baut = true;
      } else if (!einheit.baut) {
        // Nicht angekommen und kein Weg mehr: noch einmal suchen, sonst das
        // naechste Feld einer Mauer, sonst aufgeben.
        einheit.weg = this.wegZurBaustelle(einheit, baustelle);
        if (!einheit.weg.length) this.bauenWeiter(einheit);
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
    const tempo = this.einheitenwert(einheit.besitzer, einheit.art, 'tempo') / TAKTE_PRO_SEKUNDE;
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

    einheit.angefangen += this.sammelrate(einheit.besitzer, sammeln.rohstoff, sammeln.rate) / TAKTE_PRO_SEKUNDE;
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
    // Mitgezaehlt fuer die Tafel (spielziel AC-8). Hier und nur hier: eine
    // Rueckerstattung aus einem abgebrochenen Auftrag ist nichts Gesammeltes.
    spieler.gesammelt[einheit.ladungsart] += einheit.ladung;
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
        // (bedienung AC-31) - oder kaempft: hat ein Ziel und steht in
        // Reichweite, ohne Weg (bedienung AC-39). Nur wenn es zutrifft - ein
        // Zustand bleibt klein.
        // Ein Moench, der heilt, arbeitet auch (einheiten AC-37).
        ...(e.sammelt || e.baut || e.heilt || e.bekehrt || (e.auftrag?.art === 'angreifen' && !e.weg.length && !e.tot) ? { w: 1 } : {}),
        // Ein Moench, der nach dem Bekehren ruht (einheiten AC-38).
        ...(e.ruhtBis > this.takt ? { r: 1 } : {}),
        // Gefallen: der Browser legt ihn hin, bis der Server ihn nimmt
        // (kampf AC-10).
        ...(e.tot ? { s: 1 } : {}),
      });
    }
    const felder = this.feldAenderungen;
    this.feldAenderungen = [];
    // Pfeile seit dem letzten Zustand (bedienung AC-40), je [x0, y0, x1, y1].
    const schuesse = this.schuesse || [];
    this.schuesse = [];
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
        // Die Kampfwerte dieses Spielers, nur wenn sich etwas geaendert hat
        // (bedienung AC-35) - wie Gebaeude und Tiere.
        ...(this.werteAenderungen.has(s.id) ? { kw: this.kampfwerte(s.id) } : {}),
        // Die Marktpreise, nur nach einem Handel (bauen AC-33).
        ...(this.preisAenderungen.has(s.id) ? { hp: this.handelspreise(s.id) } : {}),
        // Zeitalter als Stufe, nur wenn es nicht die Dunkle Zeit ist
        // (bedienung AC-33) - ein Zustand bleibt klein.
        ...(s.zeitalter ? { z: s.zeitalter } : {}),
        // Untaetige Dorfbewohner, nur wenn es welche gibt (einheiten AC-21).
        ...untaetigeListe(this, s.id),
        // Arbeiter je Rohstoff, in der Reihenfolge holz, nahrung, gold, stein
        // (bedienung AC-32).
        a: this.arbeiterVon(s.id),
        // Ausgeschieden, nur wenn es zutrifft (spielziel AC-5).
        ...(s.aus ? { aus: 1 } : {}),
        // Ein neuer Angriff auf ihn, mit Ort (kampf AC-14) - einmal.
        ...(s.angriff?.neu ? { m: [Math.round(s.angriff.x), Math.round(s.angriff.y)] } : {}),
      })),
      einheiten,
      felder,
      ...(schuesse.length ? { p: schuesse } : {}),
      // Geloeste Buendnisse (spielziel AC-21), je [wer, Takt des
      // Fristendes] - an alle, denn eine Kuendigung ist oeffentlich. Ist
      // `t` ueber dem Fristende, gehoert `wer` keinem Team mehr an.
      ...(this.kuendigungen.length ? { bu: this.kuendigungen.map((k) => [k.wer, k.bis]) } : {}),
      // Das Ende, sobald es feststeht - danach schickt der Raum keinen
      // Zustand mehr (spielziel AC-5).
      ...(this.ende ? { ende: this.ende } : {}),
    };
    this.werteAenderungen.clear();
    this.preisAenderungen.clear();
    for (const s of this.spieler) if (s.angriff) s.angriff.neu = false;
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

  /**
   * Jedem Spieler sein Auszug (kampf AC-13, fahrplan AC-13): der Zustand wird
   * einmal gerechnet und dann je Spieler gefiltert. Sonst laese ein
   * veraendertes Programm die ganze Karte mit - der Browser liess Fremdes nur
   * beim Zeichnen weg (kampf AC-11).
   *
   * @param {string[]} ids die Spieler, die einen Zustand bekommen
   * @returns {Map<string, object>}
   */
  zustandJeSpieler(ids) {
    const voll = this.zustand();
    return new Map(ids.map((id) => [id, this.auszug(voll, id)]));
  }

  // Gilt fuer diesen Spieler der Nebel? Nicht, wenn alles aufgedeckt ist, nicht
  // nach dem Ende und nicht fuer den, der ausgeschieden ist und zusieht
  // (spielziel AC-7) - wie im Browser (`ansicht.nebelAn`).
  nebelGiltFuer(id) {
    const spieler = this.spielerVon(id);
    return Boolean(spieler) && !spieler.aus && !this.ende && this.sichtArt !== 'aufgedeckt';
  }

  // Sieht der Spieler ein Feld der Grundflaeche?
  siehtGebaeude(id, g) {
    const { x0, y0, x1, y1 } = this.grundflaeche(g.art, g.x, g.y);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.sieht(id, x, y)) return true;
    return false;
  }

  /**
   * Was ein Spieler von fremden Gebaeuden weiss (kampf AC-12, AC-13): ein
   * Gebaeude, sobald er es sieht, und jede Aenderung, solange er es sieht. Was
   * im Nebel faellt, erfaehrt er erst, wenn er wieder hinsieht - bis dahin
   * steht es in seinem Browser so da, wie er es zuletzt sah.
   */
  gebaeudeFuer(id, aenderungen) {
    if (!this.bekannt) this.bekannt = new Map();
    if (!this.bekannt.has(id)) this.bekannt.set(id, new Map());
    const bekannt = this.bekannt.get(id);
    const geaendert = new Set(aenderungen.map((g) => g.i));
    const raus = [];
    for (const g of aenderungen) {
      // Eigene immer, auch das Verschwinden - und die der Verbuendeten
      // (spielziel AC-19): ihr Dorf faellt nicht im Nebel, man sieht es.
      if (this.teiltSicht(id, this.gebaeudeBesitzer.get(g.i))) raus.push(g);
    }
    for (const g of this.gebaeude.values()) {
      if (this.teiltSicht(id, g.besitzer)) continue;
      const alt = bekannt.get(g.id);
      if (!this.siehtGebaeude(id, g)) {
        // Im Nebel fertig geworden oder beschaedigt: beim naechsten Hinsehen
        // nachschicken, sonst stuende die Baustelle fuer immer da (Durchsicht
        // Runde 110).
        if (alt && geaendert.has(g.id)) alt.veraltet = true;
        continue;
      }
      if (!alt || alt.veraltet || geaendert.has(g.id)) raus.push(this.gebaeudeFuerDraht(g.id));
      bekannt.set(g.id, { art: g.art, x: g.x, y: g.y });
    }
    for (const [gid, ort] of bekannt) {
      if (this.gebaeude.has(gid) || !this.siehtGebaeude(id, ort)) continue;
      raus.push({ i: gid, weg: true });
      bekannt.delete(gid);
    }
    return raus;
  }

  /**
   * Feldaenderungen in Sicht (kampf AC-13): ein gefaellter Baum, ein neuer
   * Bauplatz im Nebel verriete, wo der Gegner arbeitet. Was im Nebel geschieht,
   * wartet, bis der Spieler wieder hinsieht - dann gilt der letzte Stand.
   */
  felderFuer(id, aenderungen) {
    if (!this.felderOffen) this.felderOffen = new Map();
    if (!this.felderOffen.has(id)) this.felderOffen.set(id, new Map());
    const offen = this.felderOffen.get(id);
    const g = this.karte.groesse;
    for (const f of aenderungen) offen.set(f.i, f);
    const raus = [];
    for (const [i, f] of offen) {
      if (!this.sieht(id, i % g, Math.floor(i / g))) continue;
      raus.push(f);
      offen.delete(i);
    }
    return raus;
  }

  // Der Nebel faellt fuer diesen Spieler (ausgeschieden, Ende): er bekommt
  // einmal alle Gebaeude und alles Aufgeschobene, denn sein Browser zeigt
  // jetzt alles (Durchsicht Runde 110).
  nebelAufheben(voll, id) {
    const offen = this.felderOffen?.get(id);
    // Was im Nebel fiel, steht in seinem Browser noch da.
    const weg = [...this.bekannt.get(id).keys()].filter((gid) => !this.gebaeude.has(gid)).map((gid) => ({ i: gid, weg: true }));
    this.bekannt.delete(id);
    this.felderOffen?.delete(id);
    const neu = new Set((voll.gebaeude || []).map((g) => g.i));
    return {
      ...voll,
      felder: [...(offen ? offen.values() : []), ...voll.felder],
      gebaeude: [
        ...weg,
        ...[...this.gebaeude.keys()].filter((gid) => !neu.has(gid)).map((gid) => this.gebaeudeFuerDraht(gid)),
        ...(voll.gebaeude || []),
      ],
    };
  }

  auszug(voll, id) {
    if (!this.nebelGiltFuer(id)) return this.bekannt?.has(id) ? this.nebelAufheben(voll, id) : voll;
    const auszug = {
      ...voll,
      // Fremde Einheiten nur in Sicht; die eigenen und die der Verbuendeten
      // immer (spielziel AC-19).
      // Gefragt wird die Sicht, nicht das Team: waehrend der Frist einer
      // Kuendigung sind sie noch Verbuendete, sehen aber nicht mehr
      // gemeinsam (spielziel AC-21).
      einheiten: voll.einheiten.filter((e) => this.teiltSicht(id, e.b) || this.sieht(id, Math.round(e.x), Math.round(e.y))),
      felder: this.felderFuer(id, voll.felder),
      // Von den anderen nur, was jeder sieht: wer draussen ist, das Zeitalter
      // und die Kampfwerte (die zeigt die Auswahl einer fremden Einheit) -
      // nicht ihre Vorraete und ihre Untaetigen.
      spieler: voll.spieler.map((s) => (s.id === id ? s : {
        id: s.id, ...(s.aus ? { aus: 1 } : {}), ...(s.z ? { z: s.z } : {}), ...(s.kw ? { kw: s.kw } : {}),
      })),
    };
    // Pfeile nur, wenn er Schuetzen oder Ziel sieht (kampf AC-13) - und gar
    // nicht, wenn keiner bleibt.
    const pfeile = (voll.p || []).filter(([x0, y0, x1, y1]) => this.sieht(id, Math.round(x0), Math.round(y0))
      || this.sieht(id, Math.round(x1), Math.round(y1)));
    if (pfeile.length) auszug.p = pfeile;
    else delete auszug.p;
    const gebaeude = this.gebaeudeFuer(id, voll.gebaeude || []);
    if (gebaeude.length) auszug.gebaeude = gebaeude;
    else delete auszug.gebaeude;
    return auszug;
  }

  /**
   * Der Aufbau je Spieler (kampf AC-13): fremde Gebaeude nur, wenn er sie
   * sieht. Wer zurueckkehrt, faengt mit seinem Wissen neu an - was er im Nebel
   * erinnerte, sieht er erst wieder, wenn er hinsieht.
   */
  aufbauFuer(id) {
    const voll = this.aufbau();
    if (!this.nebelGiltFuer(id)) return voll;
    if (!this.bekannt) this.bekannt = new Map();
    const bekannt = new Map();
    this.bekannt.set(id, bekannt);
    // Die Karte im Aufbau ist die heutige - Aufgeschobenes ist darin enthalten.
    this.felderOffen?.delete(id);
    const sichtbar = [...this.gebaeude.values()].filter((g) => this.teiltSicht(id, g.besitzer) || this.siehtGebaeude(id, g));
    for (const g of sichtbar) if (!this.teiltSicht(id, g.besitzer)) bekannt.set(g.id, { art: g.art, x: g.x, y: g.y });
    // Fremde Marktpreise verrieten, was der andere getauscht hat - wie seine
    // Vorraete bleiben sie bei ihm (bauen AC-33).
    const spieler = voll.spieler.map((s) => {
      if (s.id === id) return s;
      const { hp, ...rest } = s;
      return rest;
    });
    return { ...voll, spieler, gebaeude: sichtbar.map((g) => this.gebaeudeFuerDraht(g.id)) };
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
      // Wie viel jeder sieht (kampf AC-16) - der Browser zeichnet danach.
      sicht: this.sichtArt,
      // Ob ein Buendnis geloest werden kann (spielziel AC-24): bei "fest"
      // zeigt der Browser den Knopf nicht.
      buendnisse: this.buendnisse,
      karte: {
        groesse: this.karte.groesse,
        felder: Buffer.from(this.karte.felder).toString('base64'),
      },
      spieler: this.spieler.map((s) => ({
        id: s.id,
        name: s.name,
        farbe: s.farbe,
        basis: s.basis,
        // Die Werte, wie sie fuer ihn gelten (bedienung AC-35). Im Aufbau fuer
        // jeden, damit auch einer, der nach einem Abbruch zurueckkehrt, die
        // schon erforschten Verbesserungen sieht (raeume AC-12).
        kw: this.kampfwerte(s.id),
        // Die Marktpreise, wie sie fuer ihn gelten (bauen AC-33).
        hp: this.handelspreise(s.id),
        // Das Team (spielziel AC-14): der Browser fragt damit, ob ein
        // Rechtsklick angreift oder hingeht - dieselbe Frage wie `feindlich`.
        ...(s.team ? { team: s.team } : {}),
        ...(s.aus ? { aus: 1 } : {}),
      })),
      // Wer nach dem Ende zurueckkommt, sieht das Ende und nicht eine
      // Partie, die nicht mehr laeuft (spielziel AC-5).
      ...(this.ende ? { ende: this.ende } : {}),
      // Geloeste Buendnisse wie im Zustand (spielziel AC-21) - auch fuer
      // den, der nach einem Abbruch zurueckkommt.
      ...(this.kuendigungen.length ? { bu: this.kuendigungen.map((k) => [k.wer, k.bis]) } : {}),
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
          // Kampfwerte als Grundwerte; was fuer einen Spieler gilt, steht in
          // seiner Tafel `kw` (bedienung AC-35).
          angriff: w.angriff || 0, nahruestung: w.nahruestung || 0, fernruestung: w.fernruestung || 0,
          reichweite: w.reichweite || 0,
          sicht: w.sicht || 0,
          // Klassen und Bonus, damit die Leiste "+15 gegen Kavallerie"
          // schreiben kann (bedienung AC-35). Der Browser rechnet damit
          // keinen Schaden - das tut der Server (kampf AC-3).
          klassen: w.klassen || [],
          bonus: w.bonus || null,
          // Greift nur Gebaeude an (einheiten AC-35): das Zeichen am Ziel
          // bleibt dann bei einer Einheit gruen.
          nurGebaeude: Boolean(w.nurGebaeude),
          // Wer heilt, wie weit und wie viel (einheiten AC-37) - fuer die Leiste.
          heilen: w.heilen || null,
          // Wer bekehrt, wie weit und wen nicht (einheiten AC-38) - fuer das
          // Zeichen am Ziel und die Leiste.
          bekehren: w.bekehren ? { reichweite: w.bekehren.reichweite, nicht: w.bekehren.nicht } : null,
        }])),
        gebaeude: Object.fromEntries(Object.entries(GEBAEUDE).map(([art, w]) => [art, {
          leben: w.leben, bildetAus: w.bildetAus, groesse: w.groesse, kosten: w.kosten, bauzeit: w.bauzeit,
          wohnraum: w.wohnraum, annahme: w.annahme, begehbar: Boolean(w.begehbar), nahrung: w.nahrung || null,
          // Ein Tor laesst Eigene durch und darf auf die eigene Mauer (bauen AC-31).
          tor: Boolean(w.tor), ersetzt: w.ersetzt || null,
          zeitalter: w.zeitalter || 0,
          // Acht Felder ueber den Rand (kampf AC-11, AC-15).
          sicht: w.sicht,
          // Ein Turm zeigt an der Auswahl, was er kann (bauen AC-29).
          angriff: w.angriff || 0, reichweite: w.reichweite || 0,
          nahruestung: w.nahruestung, fernruestung: w.fernruestung,
          // Gezogen statt gesetzt, von Feld zu Feld (bauen AC-30).
          gezogen: Boolean(w.gezogen),
          // An ihm wird getauscht (bauen AC-33).
          handel: Boolean(w.handel),
        }])),
        // Wie viel ein Handel tauscht und welche Waren (bauen AC-33). Die
        // Preise rechnet der Server (`hp` je Spieler).
        handel: { menge: HANDEL.menge, waren: Object.keys(HANDEL.waren) },
        verbesserungen: VERBESSERUNGEN,
        // Die Namen der Klassen, fuer den Bonus an der Auswahl (bedienung AC-35).
        klassen: KLASSEN,
        // Wie lang eine gezogene Mauer hoechstens ist (bauen AC-30).
        mauerMax: MAUER_MAX,
        // Die Zeitalter und was ein Aufstieg kostet (bauen AC-23, bedienung AC-33).
        zeitalter: ZEITALTER,
        aufstiege: AUFSTIEGE,
      },
    };
  }
}

/**
 * Die Felder einer gezogenen Mauer von `von` nach `bis` (bauen AC-30), in
 * dieser Reihenfolge: eine Linie, in der jeder Schritt ein Nachbarfeld ist,
 * gerade oder schraeg. Schraeg genuegt als Sperre, weil die Wegsuche keine
 * Ecke schneidet (wege.js). Hoechstens `MAUER_MAX` Felder; die Ansicht
 * (`public/ansicht.js`) rechnet dieselbe Linie fuer die Vorschau.
 */
const MAUER_MAX = 60;
function mauerLinie(von, bis) {
  const x0 = Math.round(Number(von.x));
  const y0 = Math.round(Number(von.y));
  const x1 = Math.round(Number(bis.x));
  const y1 = Math.round(Number(bis.y));
  if (![x0, y0, x1, y1].every(Number.isInteger)) return null;
  const schritte = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  if (schritte + 1 > MAUER_MAX) return null;
  const felder = [];
  for (let i = 0; i <= schritte; i++) {
    const t = schritte ? i / schritte : 0;
    felder.push({ x: Math.round(x0 + (x1 - x0) * t), y: Math.round(y0 + (y1 - y0) * t) });
  }
  return felder;
}

module.exports = {
  mauerLinie, MAUER_MAX,
  Welt, TAKTE_PRO_SEKUNDE, STARTVORRAT, ROHSTOFFE, VERFOLGUNG_FELDER, WACHE_TAKTE,
  PARTIE_MINUTEN, KUENDIGUNG_SEKUNDEN, GEBAEUDE_NAMEN, EINHEIT_NAMEN,
};
