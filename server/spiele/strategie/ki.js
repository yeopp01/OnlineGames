'use strict';

// Ein Computerspieler (→ specs/10-strategie/ki.md).
//
// Ehrlich (ki AC-1): die KI liest die Welt, aendert sie aber nie selbst - jeder
// Wunsch geht als Nachricht ueber `welt.nachricht`, denselben Weg, den der
// Server fuer den Browser nimmt. Was einem Menschen abgewiesen wird, wird ihr
// abgewiesen. Zufall nur aus dem Startwert (ki AC-2), entschieden wird alle
// halbe Sekunde, nicht in jedem Takt (ki AC-3).
//
// Die Wirtschaft der Dunklen Zeit (ki AC-4 bis AC-6) folgt einem festen Plan,
// wie ihn Spieler des Originals auswendig koennen: die ersten sechs an die
// Schafe, vier ins Holz, dann Beeren mit Muehle, mehr Holz, Gold, und Farmen,
// wenn Schafe und Beeren zur Neige gehen. Ist das Ziel an Dorfbewohnern
// erreicht, wird fuer die Feudalzeit gespart (fahrplan AC-5).

const karten = require('./karte');
const { suchen } = require('./wege');
const { TAKTE_PRO_SEKUNDE } = require('./welt');
const { EINHEITEN, GEBAEUDE, SAMMELN } = require('./daten');

const ENTSCHEIDEN_ALLE = TAKTE_PRO_SEKUNDE / 2;

// Der Plan: der n-te Dorfbewohner gehoert zu diesem Rohstoff. Wer darueber
// hinaus kommt, folgt dem Muster der letzten Zeile.
const PLAN = [
  'nahrung', 'nahrung', 'nahrung', 'nahrung', 'nahrung', 'nahrung',
  'holz', 'holz', 'holz', 'holz',
  'nahrung', 'nahrung', 'nahrung', 'nahrung',
  'holz', 'holz', 'holz',
  'nahrung', 'nahrung', 'gold', 'gold', 'nahrung', 'holz', 'nahrung',
];
const PLAN_WEITER = ['nahrung', 'holz', 'gold', 'nahrung'];
// So viele Dorfbewohner, dann wird fuer die Feudalzeit gespart.
const ZIEL_DORFBEWOHNER = 22;
const FEUDALZEIT_NAHRUNG = 500;
// Ab dieser Entfernung zum naechsten Lager lohnt ein eigenes - und ab so
// vielen, die dort arbeiten. Gold wird von wenigen geholt, liegt aber weit.
const LAGER_AB = 5;
const LAGER_ARBEITER = { holz: 3, nahrung: 3, gold: 2 };
// So weit darf ein Vorrat von der Basis liegen, damit die KI ihn nutzt.
const REICHWEITE = 30;
// So viele arbeiten hoechstens an den Schafen und an den Beeren - mehr stehen
// sich im Weg; wer darueber hinaus Nahrung holt, bekommt eine Farm.
const AN_SCHAFEN = 6;
const AN_BEEREN = 6;

// Nach dem Aufstieg verteilt die KI um (ki AC-12): liegt ein Rohstoff unter
// MANGEL und ein anderer mindestens UEBERSCHUSS darueber, geht alle
// UMVERTEILEN_SEKUNDEN ein Sammler vom einen zum anderen (bis Runde 94 eine
// feste Grenze von 600; nach Abstand enden 18 statt 14 von 20 Partien vor
// Minute 60, Runde 95). Der feste Plan der
// Dunklen Zeit legt 14 von 22 auf Nahrung; in der Feudalzeit lagen beim
// Startwert 4 bei Minute 30 2300 Nahrung neben 20 Holz, das Heer fehlte, und
// ein Ueberfall nahm elf Dorfbewohner (Runde 90, gemessen).
const UEBERSCHUSS = 300;
const MANGEL = 300;
const UMVERTEILEN_SEKUNDEN = 10;
// So lange schlaegt die KI einen Vorrat nicht wieder vor, zu dem kein Weg
// fuehrte - danach versucht sie es noch einmal.
const UNERREICHBAR_SEKUNDEN = 120;
// Baustellen teilen sich das Verzeichnis der Unerreichbaren mit den
// Vorratsfeldern - mit diesem Vorsatz, damit sich die Nummern nicht kreuzen.
const BAUSTELLE = 'baustelle:';
// Dasselbe fuer Ziele des Heeres (ki AC-16): steht einer nach weniger als
// zwei Sekunden wieder, fuehrte kein Weg dorthin.
const ZIEL = 'ziel:';
const ZIEL_GESCHEITERT_TAKTE = 2 * TAKTE_PRO_SEKUNDE;
// So weit muessen Feinde von einer verlassenen Baustelle weg sein, bevor ein
// Ersatz hingeht (Durchsicht Runde 94).
const BAUSTELLE_FEIND_FERN = 6;

// Nach dem Aufstieg (ki AC-9): ein Gebaeude der Feudalzeit, in dem
// Kampfeinheiten entstehen. Mit Gold die Schiessanlage - Bogenschuetzen
// kosten Gold und sind die staerkere Wahl -, sonst der Stall, dessen
// Spaeherreiter nur Nahrung kostet, und die hat die KI immer.
const MILITAER = ['schiessanlage', 'stall'];
const MILITAER_GOLD = 200;
// So viele Militaergebaeude hoechstens - ein weiteres, sobald alle Schlangen
// voll sind und Holz fuer eines mit Reserve da ist (ki AC-12). Mit einem
// einzigen stapelten sich beim Startwert 4 bei Minute 30 2280 Holz und 930
// Gold, und das Heer stand bei einer bis sechs Einheiten (Runde 90).
const MILITAER_HOECHSTENS = 3;
const MILITAER_RESERVE = 200;
// So viele Auftraege stehen hoechstens in der Schlange eines Militaergebaeudes:
// mehr wuerde den Vorrat binden, den die naechste Stufe braucht.
const MILITAER_SCHLANGE = 2;
// Was ein Militaergebaeude an Holz kostet - dafuer wird es zurueckgehalten.
const MILITAER_HOLZ = Math.max(...MILITAER.map((art) => GEBAEUDE[art].kosten.holz || 0));

// Das Heer (ki AC-11): so viele marschieren los, so viele bleiben zu Hause.
// Acht, weil zehn Speerkaempfer im Gefechtsstand gegen sieben Reiter gewinnen
// (fahrplan AC-9) - ein kleineres Heer verliert gegen jede Wache. Der Aufbruch
// braucht also zehn Kampfeinheiten: acht fuer den Marsch, zwei fuer daheim.
const HEER = 8;
const WACHE = 2;

// Die Lage lesen (ki AC-18): ueberlegen ist, wer mindestens ein Heer hat und
// dreimal so viele Kampfeinheiten wie der Gegner. Dann wartet niemand mehr auf
// zehn daheim - es zieht los, wer da ist, bis auf die Wache. Vorher stand der
// Sieger beim Startwert 4 ab Minute 48 vor einem Dorf ohne Heer und schickte
// je acht, waehrend daheim bis zu 85 warteten; die Partie endete nach 65,5
// Minuten (Runde 96).
const UEBERLEGEN = 3;
// Auch dann nie einer allein (Durchsicht Runde 96): jede fertige Einheit zog
// sonst einzeln los. Gemessen ueber zwanzig Startwerte, 90 Minuten: einzeln
// 19 mit Sieger, die letzte Partie unentschieden; zu zweit alle 20, die
// laengste nach 62 Minuten; zu viert alle 20, die laengste nach 78.
const MARSCH_MINDESTENS = 2;
// So weit vor dem fremden Dorfzentrum endet der Marsch. Nicht auf ihm: ein
// Befehl auf ein fremdes Gebaeude ist ein Angriff auf genau dieses Gebaeude
// und **kein** Angriffslauf (welt.befehl) - unterwegs wuerde dann niemand
// angegriffen. Vier Felder, weil die Fernkaempfer vier Felder weit schlagen:
// so steht das Heer am Ende in Reichweite, bevor es einzeln nachsetzt.
const HEER_ABSTAND = 4;

// Die Verteidigung (ki AC-14): So nah am Angriffsort gilt die Wache als
// angekommen. Drei Felder, weil eine stehende Kampfeinheit von dort den
// Angreifer selbst sieht und ohne weiteren Befehl zuschlaegt (kampf AC-2) -
// ein neuer Befehl in jeder Entscheidung wuerde ihr nur den Weg neu rechnen.
const WACHE_NAH = 3;

// Wie weit das Marschziel der Wache von jedem Feind wegbleibt. `feindAn` im
// Server zieht einen Feind im Umkreis von 1,01 Feldern unter den Klick, und
// daraus wuerde ein Angriff auf genau ihn statt des Angriffslaufs.
const FEIND_FERN = 1.5;

// Wie lange sie eine fremde Kampfeinheit im Gedaechtnis behaelt, die sie
// nicht mehr sieht (ki AC-13), in Takten: drei Minuten.
const FEIND_VERGESSEN = 1800;

// Punkte auf dem Ring der Startplaetze, die der Spaeher abreitet (ki AC-13).
const ERKUNDUNG_PUNKTE = 16;

// Kantenlaenge der Bloecke, in denen sie sich merkt, wann sie wo zuletzt
// hingesehen hat (ki AC-13), und wie weit um den letzten Ort des Gegners sie
// sucht, in Feldern.
const SUCH_BLOCK = 8;
const SUCH_UMKREIS = 28;

// Wie weit ein zweites Ziel derselben Entscheidung von einem schon vergebenen
// wegbleibt. Ein Befehl an mehrere stellt sie um sein Ziel herum auf
// (einheiten AC-20) - zwei getrennte Befehle wissen voneinander nichts. Die
// Wache und der fliehende Dorfbewohner bekamen in Runde 86 dasselbe "naechste
// freie Feld" am Dorfzentrum und standen danach aufeinander. Zwei Felder, weil
// die Aufstellung einer kleinen Gruppe ein Feld um ihr Ziel herum belegt.
const VERGEBEN_ABSTAND = 2;

const FELD_FUER = { holz: [karten.WALD], nahrung: [karten.BEERE], gold: [karten.GOLD], stein: [karten.STEIN] };
const LAGER_FUER = { holz: 'holzfaellerlager', nahrung: 'muehle', gold: 'bergbaulager', stein: 'bergbaulager' };

function plan(n) {
  const zaehler = { nahrung: 0, holz: 0, gold: 0, stein: 0 };
  for (let i = 0; i < n; i++) {
    const rohstoff = i < PLAN.length ? PLAN[i] : PLAN_WEITER[(i - PLAN.length) % PLAN_WEITER.length];
    zaehler[rohstoff] += 1;
  }
  return zaehler;
}

class Ki {
  /**
   * @param {import('./welt').Welt} welt
   * @param {string} spielerId
   */
  constructor(welt, spielerId) {
    this.welt = welt;
    this.spielerId = spielerId;
    const nummer = welt.spieler.findIndex((s) => s.id === spielerId);
    this.zufall = karten.zufallAus((welt.startwert * 31 + nummer * 7919) >>> 0);
    // Nicht alle KIs im selben Takt: jede bekommt einen festen Versatz.
    this.versatz = nummer % ENTSCHEIDEN_ALLE;
    this.abgewiesen = 0;
    this.schafeGetrieben = false;
    // In welchem Takt die Feudalzeit erreicht war - der Pruefstand misst daran
    // (ki AC-9). `null` heisst: noch nicht.
    this.feudalTakt = null;
    // Wer marschiert (ki AC-11), wie oft ein Heer aufgebrochen ist und in
    // welchem Takt das erste - daran misst der Pruefstand.
    this.heer = new Set();
    this.angriffe = 0;
    this.angriffTakt = null;
    // Wie viel Leben das Eigene bei der letzten Entscheidung hatte. Daran
    // sieht die KI, dass sie angegriffen wird (ki AC-14) - sie bekommt keine
    // Meldung, sie sieht nur die Welt, so wie ein Mensch das Bild sieht.
    this.leben = new Map();
    // Wie oft die Wache zu einem Angriffsort gezogen ist - der Pruefstand
    // misst daran.
    this.verteidigungen = 0;
    // Wann zuletzt ein Sammler den Rohstoff gewechselt hat, und wie oft (ki AC-12).
    this.zuletztUmverteilt = -Infinity;
    this.umverteilt = 0;
    // Woran jede Einheit des Heeres zuletzt geschickt wurde, und wann (ki AC-16).
    this.heerZiel = new Map();
    // Was sie vom Gegner weiss (ki AC-13): Gebaeude, sobald eine ihrer
    // Einheiten sie gesehen hat - im Nebel so, wie sie sie zuletzt sah -, und
    // fremde Kampfeinheiten mit dem Takt, an dem sie sie zuletzt sah.
    this.gesehen = new Map();
    this.feindeGesehen = new Map();
    // Wohin der Spaeher gerade erkundet.
    this.erkundung = null;
    this.erkundungFertig = new Set();
    // Wann sie zum ersten Mal ein fremdes Gebaeude sah (Pruefstand).
    this.gegnerGesehenTakt = null;
    // Wo sie von jedem Gegner zuletzt etwas sah - Gebaeude oder Einheit.
    this.feindOrt = new Map();
    // Je Block der Takt, an dem sie zuletzt hinsah.
    this.blockGesehen = null;
    // Vorratsfelder, zu denen kein Weg fuehrte, mit dem Takt der Feststellung -
    // eine Weile nicht wieder vorschlagen (UNERREICHBAR_SEKUNDEN).
    this.unerreichbar = new Map();
  }

  get spieler() {
    return this.welt.spielerVon(this.spielerId);
  }

  // Der einzige Weg in die Welt.
  senden(nachricht) {
    const antwort = this.welt.nachricht(this.spielerId, nachricht) || {};
    if (antwort.fehler) this.abgewiesen += 1;
    return antwort;
  }

  takt() {
    if (this.welt.takt % ENTSCHEIDEN_ALLE !== this.versatz) return;
    this.entscheiden();
  }

  entscheiden() {
    const welt = this.welt;
    const eigene = [...welt.einheiten.values()].filter((e) => e.besitzer === this.spielerId);
    // Ohne Gefallene: ein Toter liegt zwei Sekunden in der Welt, hat keinen
    // Auftrag und galt so als untaetig - `bauer()` konnte ihn waehlen
    // (Durchsicht Runde 94).
    const dorfbewohner = eigene.filter((e) => e.art === 'dorfbewohner' && !e.tot);
    const gebaeude = [...welt.gebaeude.values()].filter((g) => g.besitzer === this.spielerId);
    const zentrum = gebaeude.find((g) => g.art === 'dorfzentrum' && g.fertig);

    // Nichts geht mehr (ki AC-19): dann gibt sie auf, wie der Computergegner
    // im Original - statt dass der Sieger noch Minuten lang Haeuser schleift.
    if (!this.spieler.aus && !welt.ende && this.aussichtslos(eigene, gebaeude)) {
      this.senden({ auftrag: 'aufgeben' });
      return;
    }

    if (!this.schafeGetrieben) this.schafeTreiben();

    // Wohnraum: ein Haus, bevor er voll ist - frueher, je schneller es waechst.
    const raum = welt.wohnraum(this.spieler);
    const hausImBau = gebaeude.some((g) => g.art === 'haus' && !g.fertig);
    const puffer = dorfbewohner.length < 12 ? 2 : 4;
    // Nach dem Aufstieg wird weitergebaut, auch wenn das Ziel an Dorfbewohnern
    // steht: Kampfeinheiten brauchen denselben Wohnraum (ki AC-9).
    const brauchtRaum = dorfbewohner.length < ZIEL_DORFBEWOHNER || this.spieler.zeitalter > 0;
    if (raum < 200 && raum - eigene.length <= puffer && !hausImBau && brauchtRaum) {
      // Das erste Haus bauen zwei: allein brauchte es 25 s und der Weg dazu,
      // und das Dorfzentrum wartete bis zu 11 s auf Wohnraum (Runde 44).
      this.bauen('haus', this.platzBeiBasis('haus'), dorfbewohner, eigene.length <= 5 ? 2 : 1);
    }

    // Ohne Pause ausbilden, bis das Ziel steht; dann sparen.
    const imZentrum = zentrum ? zentrum.schlange.length : 0;
    if (zentrum && imZentrum < 2 && dorfbewohner.length + imZentrum < ZIEL_DORFBEWOHNER
      && this.spieler.nahrung >= EINHEITEN.dorfbewohner.kosten.nahrung) {
      this.senden({ auftrag: 'ausbilden', gebaeude: zentrum.id, einheit: 'dorfbewohner' });
    }

    // Die Feudalzeit, sobald sie bezahlt ist - und danach Militaer (ki AC-9).
    if (this.feudalTakt === null && this.spieler.zeitalter > 0) this.feudalTakt = welt.takt;
    this.feudalzeitPruefen(zentrum, dorfbewohner);
    this.militaerPruefen(gebaeude, dorfbewohner);
    this.heerPruefen(eigene);
    // Nach dem Heer: das hat eben wahrgenommen, was sie sieht.
    this.erkunden(eigene);
    this.verteidigenPruefen(eigene, gebaeude, zentrum);
    this.umverteilen(dorfbewohner);
    this.baustellenWeiterbauen(gebaeude, dorfbewohner);

    // Lager an die Vorraete, sobald dort mehrere arbeiten und es weit ist.
    const rollen = this.rollen(dorfbewohner);
    for (const rohstoff of ['holz', 'nahrung', 'gold']) this.lagerPruefen(rohstoff, rollen, gebaeude, dorfbewohner);

    // Farmen, wenn Schafe und Beeren zur Neige gehen.
    this.farmenPruefen(rollen, gebaeude, dorfbewohner);

    // Wer nichts tut, geht dorthin, wo der Plan am meisten fehlt.
    const soll = plan(dorfbewohner.length);
    for (const einheit of dorfbewohner) {
      if (!this.untaetig(einheit)) continue;
      // Stein braucht die Dunkle Zeit nicht - sonst gewann er, wenn alles andere
      // schon voll besetzt war (Runde 44: "fehlt 0" schlug "fehlt -1").
      const rohstoff = ['nahrung', 'holz', 'gold']
        .map((r) => ({ r, fehlt: soll[r] - (rollen[r] || 0) }))
        .sort((a, b) => b.fehlt - a.fehlt)[0].r;
      if (this.schicken(einheit, rohstoff, dorfbewohner) || this.schicken(einheit, 'holz') || this.schicken(einheit, 'gold')) {
        rollen[rohstoff] = (rollen[rohstoff] || 0) + 1;
      }
    }
  }

  /**
   * Der Aufstieg in die Feudalzeit (ki AC-9). Erst wenn die Wirtschaft steht -
   * ki AC-4 spart ab dem Ziel an Dorfbewohnern genau dafuer -, und erst wenn
   * das Dorfzentrum frei ist: ein Aufstieg hinter einer Schlange stuende still.
   * Die Voraussetzung prueft der Server noch einmal (bauen AC-23).
   */
  feudalzeitPruefen(zentrum, dorfbewohner) {
    const spieler = this.spieler;
    if (!zentrum || spieler.zeitalter > 0) return;
    if (dorfbewohner.length < ZIEL_DORFBEWOHNER) return;
    if (zentrum.schlange.length) return;
    if (spieler.nahrung < FEUDALZEIT_NAHRUNG) return;
    if (this.welt.gebaeudeDerZeit(spieler) < 2) return;
    this.senden({ auftrag: 'ausbilden', gebaeude: zentrum.id, einheit: 'feudalzeit' });
  }

  /**
   * Nach dem Aufstieg ein Militaergebaeude, dann ohne Pause Kampfeinheiten
   * (ki AC-9). Welche, steht in den Daten des Gebaeudes - so bekommt die KI
   * jede neue Einheit einer spaeteren Stufe von selbst.
   */
  militaerPruefen(gebaeude, dorfbewohner) {
    if (this.spieler.zeitalter < 1) return;
    if (!gebaeude.some((g) => MILITAER.includes(g.art))) {
      if (this.spieler.holz < MILITAER_HOLZ) return;
      const art = this.spieler.gold >= MILITAER_GOLD ? 'schiessanlage' : 'stall';
      this.bauen(art, this.platzBeiBasis(art), dorfbewohner);
      return;
    }
    // Fehlen Dorfbewohner, gehen sie vor: das Militaer gibt Nahrung nur aus,
    // wenn danach noch einer bezahlt ist. Beim Startwert 14 stand die Nahrung
    // ab Minute 24 bei 10 - drei Militaergebaeude nahmen jede Ladung, und das
    // Dorfzentrum ersetzte keinen Gefallenen mehr (Runde 90).
    const ruecklage = dorfbewohner.length < ZIEL_DORFBEWOHNER ? EINHEITEN.dorfbewohner.kosten : {};
    // Ausgebildet wird auch in der Kaserne (ki AC-17): Fernkaempfer nehmen
    // einem Gebaeude einen Punkt je Schuss (Fernruestung 7), eine Miliz vier je
    // Schlag. Allein brachte das nichts (Runde 92: mehr Entscheidungen, aber
    // mehr Remis); zusammen damit, dass jeder Untaetige sein naechstes Ziel
    // nimmt (ki AC-16), enden 18 von 20 Partien vor Minute 60 statt 10
    // (Runde 95, gemessen).
    const meine = gebaeude.filter((g) => MILITAER.includes(g.art) || g.art === 'kaserne');
    for (const g of meine) {
      if (!g.fertig || g.schlange.length >= MILITAER_SCHLANGE) continue;
      const art = this.naechsteKampfeinheit(g, ruecklage);
      if (art) this.senden({ auftrag: 'ausbilden', gebaeude: g.id, einheit: art });
    }
    // Nachschub braucht Durchsatz: sind alle voll beschaeftigt und ist Holz
    // uebrig, ein weiteres.
    const alleVoll = meine.every((g) => g.fertig && g.schlange.length >= MILITAER_SCHLANGE);
    if (alleVoll && meine.length < MILITAER_HOECHSTENS && this.spieler.holz >= MILITAER_HOLZ + MILITAER_RESERVE) {
      const art = !meine.some((g) => g.art === 'kaserne') ? 'kaserne'
        : this.spieler.gold >= MILITAER_GOLD ? 'schiessanlage' : 'stall';
      this.bauen(art, this.platzBeiBasis(art), dorfbewohner);
    }
  }

  // Die erste Einheit, die dieses Gebaeude jetzt ausbilden kann: im erreichten
  // Zeitalter und bezahlt. Verbesserungen stehen in derselben Liste - die
  // haben keine Werte in EINHEITEN und fallen heraus.
  naechsteKampfeinheit(gebaeude, ruecklage = {}) {
    for (const art of GEBAEUDE[gebaeude.art].bildetAus) {
      const werte = EINHEITEN[art];
      if (!werte || (werte.zeitalter || 0) > this.spieler.zeitalter) continue;
      if (Object.entries(werte.kosten).some(([r, menge]) => this.spieler[r] - (ruecklage[r] || 0) < menge)) continue;
      return art;
    }
    return null;
  }

  /**
   * Aussichtslos (ki AC-19) heisst: es kann nie wieder etwas geschehen. Keine
   * Einheit lebt - also sammelt niemand, und kein Vorrat waechst mehr -, in
   * keiner Schlange steht etwas, und kein fertiges Gebaeude kann eine
   * ausbilden, die jetzt bezahlt waere. Gefallen ist dann nur noch, was der
   * Sieger schleifen muesste: beim Startwert 5 achteinhalb Minuten lang, mit
   * 28 Nahrung im Vorrat und einem Dorfzentrum ohne Dorfbewohner (Runde 97).
   * Eine Einschaetzung "wird wohl verlieren" ist das bewusst nicht.
   */
  aussichtslos(eigene, gebaeude) {
    if (eigene.some((e) => !e.tot)) return false;
    for (const g of gebaeude) {
      // Jeder Eintrag zaehlt, nicht nur Einheiten: ein bezahlter Aufstieg
      // oder eine Verbesserung wird fertig und kann ein Gebaeude freischalten
      // (Durchsicht Runde 97).
      if (g.schlange.length) return false;
      if (!g.fertig) continue;
      for (const art of GEBAEUDE[g.art].bildetAus) {
        const werte = EINHEITEN[art];
        if (!werte || (werte.zeitalter || 0) > this.spieler.zeitalter) continue;
        if (Object.entries(werte.kosten).every(([r, menge]) => this.spieler[r] >= menge)) return false;
      }
    }
    return true;
  }

  // Kampfeinheiten eines Spielers, die noch stehen.
  kampfeinheitenVon(id) {
    let n = 0;
    for (const e of this.welt.einheiten.values()) {
      if (e.besitzer === id && !e.tot && !(EINHEITEN[e.art].klassen || []).includes('dorf')) n += 1;
    }
    return n;
  }

  // Ueberlegen (ki AC-18): ein ganzes Heer und dreimal so viele wie der
  // naechste Gegner. Gezaehlt wird beim Gegner, was sie in den letzten drei
  // Minuten gesehen hat (ki AC-13) - so wie ein Mensch schaetzt.
  ueberlegen() {
    this.wahrnehmen();
    const gegner = this.naechsterGegner();
    if (!gegner) return false;
    const meine = this.kampfeinheitenVon(this.spielerId);
    return meine >= HEER && this.gesehenVon(gegner.id) * UEBERLEGEN <= meine;
  }

  // Fremde Kampfeinheiten eines Spielers, die sie zuletzt gesehen hat.
  gesehenVon(id) {
    let n = 0;
    for (const f of this.feindeGesehen.values()) if (f.besitzer === id && this.welt.takt - f.takt < FEIND_VERGESSEN) n += 1;
    return n;
  }

  /**
   * Was die KI sieht (ki AC-13): ihre Sicht rechnet der Server wie fuer jeden
   * Spieler (kampf AC-15). Ein fremdes Gebaeude merkt sie sich, sobald sie es
   * sieht, und vergisst es erst, wenn sie hinsieht und es nicht mehr steht -
   * wie der Browser (kampf AC-12). Fremde Kampfeinheiten merkt sie sich mit
   * dem Takt des letzten Blicks.
   */
  wahrnehmen() {
    const welt = this.welt;
    const ich = this.spielerId;
    for (const g of welt.gebaeude.values()) {
      if (g.besitzer === ich || !welt.siehtGebaeude(ich, g)) continue;
      this.gesehen.set(g.id, { id: g.id, art: g.art, x: g.x, y: g.y, besitzer: g.besitzer });
      this.feindOrt.set(g.besitzer, { x: g.x, y: g.y });
      if (this.gegnerGesehenTakt === null) this.gegnerGesehenTakt = welt.takt;
    }
    for (const [id, g] of this.gesehen) {
      if (!welt.gebaeude.has(id) && welt.siehtGebaeude(ich, g)) this.gesehen.delete(id);
    }
    const sichtbar = this.sichtbareFeinde();
    const jetzt = new Set(sichtbar.map((e) => e.id));
    // Wen sie dort, wo sie ihn zuletzt sah, jetzt nicht mehr sieht, den
    // streicht sie - gefallen oder fortgegangen. Sonst zaehlten Gefallene drei
    // Minuten weiter, und sie hielte den Gegner fuer staerker, als er ist.
    for (const [id, f] of this.feindeGesehen) {
      if (!jetzt.has(id) && welt.sieht(this.spielerId, f.x, f.y)) this.feindeGesehen.delete(id);
    }
    for (const e of sichtbar) {
      if (!(EINHEITEN[e.art].klassen || []).includes('dorf')) {
        this.feindeGesehen.set(e.id, { besitzer: e.besitzer, takt: welt.takt, x: Math.round(e.x), y: Math.round(e.y) });
      }
      // Ein Dorfbewohner verraet, wo jemand wohnt; eine Kampfeinheit draussen
      // nicht - ein fremder Spaeher vor dem eigenen Dorf hiesse sonst, der
      // Gegner wohne hier.
      if ((EINHEITEN[e.art].klassen || []).includes('dorf')) this.feindOrt.set(e.besitzer, { x: Math.round(e.x), y: Math.round(e.y) });
    }
    // Wann sie welchen Block zuletzt sah - fuer die Suche nach dem, was sie
    // nicht mehr kennt.
    const g = welt.karte.groesse;
    const je = Math.ceil(g / SUCH_BLOCK);
    if (!this.blockGesehen) this.blockGesehen = new Array(je * je).fill(-Infinity);
    for (let by = 0; by < je; by++) {
      for (let bx = 0; bx < je; bx++) {
        const x = Math.min(g - 1, bx * SUCH_BLOCK + SUCH_BLOCK / 2);
        const y = Math.min(g - 1, by * SUCH_BLOCK + SUCH_BLOCK / 2);
        if (welt.sieht(this.spielerId, x, y)) this.blockGesehen[by * je + bx] = welt.takt;
      }
    }
    // Wo eine eigene Einheit steht, war sie - auch wenn die Mitte des Blocks
    // im Wald liegt und keiner sie sieht. Sonst suchte das Heer dort ewig.
    for (const e of welt.einheiten.values()) {
      if (e.besitzer !== this.spielerId || e.tot) continue;
      const bx = Math.floor(Math.round(e.x) / SUCH_BLOCK);
      const by = Math.floor(Math.round(e.y) / SUCH_BLOCK);
      if (bx >= 0 && by >= 0 && bx < je && by < je) this.blockGesehen[by * je + bx] = welt.takt;
    }
    for (const [id, f] of this.feindeGesehen) if (welt.takt - f.takt >= FEIND_VERGESSEN) this.feindeGesehen.delete(id);
  }

  // Fremde Einheiten, die sie jetzt sieht (ki AC-13).
  sichtbareFeinde() {
    const ich = this.spielerId;
    return [...this.welt.einheiten.values()].filter((e) => e.besitzer !== ich && !e.tot
      && this.welt.sieht(ich, Math.round(e.x), Math.round(e.y)));
  }

  /**
   * Erkunden (ki AC-13): solange sie keinen Gegner kennt, reitet der
   * Spaeherreiter den Ring der Startplaetze ab - dort stehen die Doerfer, das
   * weiss jeder, der die Karte kennt, nicht aber wo genau. Er nimmt den
   * naechsten Punkt des Rings, den sie noch nie gesehen hat.
   */
  erkunden(eigene) {
    const spaeher = eigene.find((e) => e.art === 'spaeherreiter' && !e.tot && !this.heer.has(e.id));
    if (!spaeher) return;
    if (this.alleGegnerBekannt()) {
      // Gefunden: heim. Bliebe er stehen, griffe er an, was ihm in Sicht
      // kommt (kampf AC-2) - im fremden Dorf dessen Dorfbewohner, und die
      // liefen davon (ki AC-14). In Runde 112 kostete das beide KIs Nahrung
      // und Wohnraum (ki AC-4).
      if (this.erkundung) {
        this.erkundung = null;
        const heim = this.freiesFeldUm(this.spieler.basis, spaeher);
        if (heim) this.senden({ auftrag: 'befehl', einheiten: [spaeher.id], ziel: heim });
      }
      return;
    }
    if (this.erkundung) {
      // Noch unterwegs zu einem Punkt, den sie nicht kennt, und nicht kurz
      // davor: weiterreiten. Kurz davor gibt es schon den naechsten Punkt -
      // aus demselben Grund wie oben haelt er nirgends an.
      const unterwegs = spaeher.weg.length > 2 || spaeher.auftrag?.art === 'angreifen';
      if (unterwegs && !this.welt.erkundet(this.spielerId, this.erkundung.x, this.erkundung.y)) return;
      // Angekommen, ob gesehen oder nicht (ein Punkt mitten im Wald): erledigt.
      this.erkundungFertig.add(this.erkundung.y * this.welt.karte.groesse + this.erkundung.x);
    }
    const punkt = this.erkundungspunkt(spaeher);
    if (!punkt) return;
    const feld = this.freiesFeldUm(punkt, spaeher);
    if (!feld) return;
    this.erkundung = punkt;
    this.senden({ auftrag: 'befehl', einheiten: [spaeher.id], ziel: feld });
  }

  // Kennt sie von jedem, der noch spielt, ein Gebaeude?
  alleGegnerBekannt() {
    const bekannt = new Set([...this.gesehen.values()].map((g) => g.besitzer));
    return this.welt.spieler.every((s) => s.id === this.spielerId || s.aus || bekannt.has(s.id));
  }

  // Der naechste nie gesehene Punkt auf dem Ring der Startplaetze, vom Ort
  // `von` aus. Der Ring hat den Halbmessser ihres eigenen Startplatzes um die
  // Kartenmitte.
  erkundungspunkt(von) {
    const g = this.welt.karte.groesse;
    const mitte = g / 2;
    const { basis } = this.spieler;
    const radius = Math.hypot(basis.x - mitte, basis.y - mitte);
    let bester = null;
    for (let i = 0; i < ERKUNDUNG_PUNKTE; i++) {
      const winkel = (i / ERKUNDUNG_PUNKTE) * Math.PI * 2;
      const x = Math.round(mitte + Math.cos(winkel) * radius);
      const y = Math.round(mitte + Math.sin(winkel) * radius);
      if (!this.welt.aufKarte(x, y) || this.welt.erkundet(this.spielerId, x, y) || this.erkundungFertig.has(y * g + x)) continue;
      const d = Math.hypot(x - von.x, y - von.y);
      if (!bester || d < bester.d) bester = { x, y, d };
    }
    return bester ? { x: bester.x, y: bester.y } : null;
  }

  /**
   * Das Heer (ki AC-11). Sind acht Kampfeinheiten marschbereit - also zehn da,
   * denn zwei bleiben als Wache -, brechen die acht gesammelt zum naechsten
   * Gegner auf. Sie gehen im **Angriffslauf** (kampf AC-4): was ihnen
   * unterwegs in Sichtweite kommt, wird angegriffen.
   *
   * Am Ziel reicht das nicht: der Angriffslauf sieht nur Einheiten, Gebaeude
   * bleiben ungeschoren (welt.wacheTakten, kampf AC-2) - sonst liefe jede
   * Wache ins fremde Dorfzentrum. Deshalb setzt die KI nach, so wie es ein
   * Mensch tut: wer am Marschziel steht und nichts mehr zu tun hat, bekommt
   * das Dorfzentrum als Ziel. Faellt es, das naechste Gebaeude.
   */
  heerPruefen(eigene) {
    // Wer gefallen ist, marschiert nicht mehr.
    for (const id of this.heer) if (!this.welt.einheiten.has(id)) this.heer.delete(id);
    const kampf = eigene.filter((e) => !e.tot && !(EINHEITEN[e.art].klassen || []).includes('dorf'));
    this.wahrnehmen();
    if (!kampf.length) return;
    const gegner = this.naechsterGegner();
    // Keinen Gegner gesehen (ki AC-13): das Heer erkundet selbst, im
    // Angriffslauf zum naechsten nie gesehenen Punkt des Rings - sonst stuende
    // es, wenn der Spaeher gefallen ist, fuer immer daheim.
    const ziel = gegner ? this.gegnerZiel(gegner) : this.erkundungspunkt(this.spieler.basis);
    if (!ziel) return;

    // Nachsetzen: wer steht, geht auf das Ziel. Nicht `untaetig()` - das
    // beantwortet die Frage nur fuer Dorfbewohner (ki AC-6).
    const stehend = kampf.filter((e) => this.heer.has(e.id) && !e.auftrag && !e.weg.length && !e.angriffslauf);
    // Jeder auf das, was **ihm** am naechsten steht - nicht alle auf ein
    // gemeinsames Ziel (ki AC-16). Vor einem Gebaeude schiessen nur die
    // in Reichweite, ein Fernkaempfer nimmt ihm einen Punkt je Schuss, und der
    // Rest wartete dahinter: bei Minute 60 standen in zwoelf von zwanzig
    // Partien 56 bis 98 Kampfeinheiten neben 7 bis 28 Gebaeuden eines
    // Verlierers ohne Heer (Runde 95). Einheiten zuerst, dann Gebaeude.
    if (stehend.length) {
      // Nur, was sie sieht oder gesehen hat (ki AC-13).
      const seineEinheiten = gegner ? this.sichtbareFeinde().filter((e) => e.besitzer === gegner.id) : [];
      const seineGebaeude = gegner ? [...this.gesehen.values()].filter((g) => g.besitzer === gegner.id && !GEBAEUDE[g.art].begehbar) : [];
      const naechstes = (e, liste) => liste.reduce((best, z) => {
        const d = Math.hypot(z.x - e.x, z.y - e.y);
        return !best || d < best.d ? { z, d } : best;
      }, null);
      for (const e of stehend) {
        // Steht er schon wieder, kaum dass er losgeschickt war, fuehrte kein
        // Weg zu seinem Ziel (angriffTakten endet dann): dieses Ziel zwei
        // Minuten lang auslassen - sonst schickte ihn jede halbe Sekunde dorthin,
        // etwa zu einem Sammler in einer Tasche (Durchsicht Runde 95).
        const zuletzt = this.heerZiel.get(e.id);
        if (zuletzt && this.welt.takt - zuletzt.takt < ZIEL_GESCHEITERT_TAKTE) this.unerreichbar.set(ZIEL + zuletzt.id, this.welt.takt);
        const frei = (z) => !this.gesperrt(ZIEL + z.id);
        const einheit = naechstes(e, seineEinheiten.filter(frei));
        const bau = naechstes(e, seineGebaeude.filter(frei));
        const treffer = einheit && (!bau || einheit.d <= bau.d + 6) ? einheit.z : bau?.z;
        this.senden({ auftrag: 'befehl', einheiten: [e.id], ziel: treffer ? { x: Math.round(treffer.x), y: Math.round(treffer.y) } : ziel });
        if (treffer) this.heerZiel.set(e.id, { id: treffer.id, takt: this.welt.takt });
      }
    }

    // Der Aufbruch. Die beiden, die der Basis am naechsten stehen, bleiben:
    // so wacht die Wache dort, wo das Dorf ist.
    const daheim = kampf.filter((e) => !this.heer.has(e.id));
    // Ueberlegen (ki AC-18), zieht los, wer daheim ist - bis auf die Wache.
    const alle = this.ueberlegen();
    if (daheim.length < (alle ? WACHE + MARSCH_MINDESTENS : HEER + WACHE)) return;
    const { basis } = this.spieler;
    const nachAbstand = [...daheim].sort((a, b) => Math.hypot(a.x - basis.x, a.y - basis.y) - Math.hypot(b.x - basis.x, b.y - basis.y));
    const marsch = alle ? nachAbstand.slice(WACHE) : nachAbstand.slice(WACHE, WACHE + HEER);
    const feld = this.marschziel(ziel);
    if (!feld) return;
    this.senden({ auftrag: 'befehl', einheiten: marsch.map((e) => e.id), ziel: feld, angriffslauf: true });
    for (const e of marsch) this.heer.add(e.id);
    this.angriffe += 1;
    if (this.angriffTakt === null) this.angriffTakt = this.welt.takt;
  }

  // Der naechste Gegner, der noch mitspielt und von dem sie etwas gesehen
  // hat (ki AC-13) - gemessen von ihrer Basis zu dem Ort, an dem sie zuletzt
  // etwas von ihm sah. Ohne Gesehenes keiner: dann wird erkundet.
  naechsterGegner() {
    const { basis } = this.spieler;
    let bester = Infinity;
    let gegner = null;
    for (const [id, ort] of this.feindOrt) {
      const s = this.welt.spielerVon(id);
      if (!s || s.aus) continue;
      const d = Math.hypot(ort.x - basis.x, ort.y - basis.y);
      if (d < bester) {
        bester = d;
        gegner = s;
      }
    }
    return gegner;
  }

  // Worauf das Heer zielt: das Dorfzentrum des Gegners, sonst irgendein
  // Gebaeude von ihm - beides, wie sie es zuletzt gesehen hat (ki AC-13).
  // Kennt sie keins mehr, sucht sie dort, wo sie ihn zuletzt sah.
  gegnerZiel(gegner) {
    const seine = [...this.gesehen.values()].filter((g) => g.besitzer === gegner.id);
    const zentrum = seine.find((g) => g.art === 'dorfzentrum');
    const gebaeude = zentrum || seine[0];
    if (gebaeude) return { x: gebaeude.x, y: gebaeude.y };
    const ort = this.feindOrt.get(gegner.id);
    return ort ? this.suchziel(ort) : null;
  }

  /**
   * Suchen wie ein Mensch (ki AC-13): um den Ort, an dem sie den Gegner
   * zuletzt sah, der Block, auf den sie am laengsten nicht geschaut hat.
   * "Erkundet" reicht dafuer nicht - ein Haus, das nach dem Vorbeiritt des
   * Spaehers gebaut wurde, steht auf erkundetem Grund. Ohne diese Suche zog
   * das Heer nach dem letzten bekannten Gebaeude zurueck an den Ring bei der
   * eigenen Basis, und KI gegen KI dauerte im Median sieben Minuten laenger
   * (Runde 112, gemessen).
   */
  suchziel(um) {
    if (!this.blockGesehen) this.wahrnehmen();
    const g = this.welt.karte.groesse;
    const je = Math.ceil(g / SUCH_BLOCK);
    let bester = null;
    for (let by = 0; by < je; by++) {
      for (let bx = 0; bx < je; bx++) {
        const x = Math.min(g - 1, bx * SUCH_BLOCK + SUCH_BLOCK / 2);
        const y = Math.min(g - 1, by * SUCH_BLOCK + SUCH_BLOCK / 2);
        const d = Math.hypot(x - um.x, y - um.y);
        if (d > SUCH_UMKREIS) continue;
        const zuletzt = this.blockGesehen[by * je + bx];
        if (!bester || zuletzt < bester.zuletzt || (zuletzt === bester.zuletzt && d < bester.d)) bester = { x, y, d, zuletzt };
      }
    }
    return bester ? { x: bester.x, y: bester.y } : null;
  }

  // Ein freies Feld im Abstand vor dem Ziel, auf der Seite der eigenen Basis:
  // der kuerzeste Weg, und das Heer laeuft nicht um das Dorf herum.
  marschziel(um) {
    const { basis } = this.spieler;
    let bestes = null;
    let bester = Infinity;
    for (let dy = -HEER_ABSTAND; dy <= HEER_ABSTAND; dy++) {
      for (let dx = -HEER_ABSTAND; dx <= HEER_ABSTAND; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== HEER_ABSTAND) continue;
        const x = Math.round(um.x) + dx;
        const y = Math.round(um.y) + dy;
        if (!karten.begehbar(this.welt.karte, x, y) || this.welt.gebaeudeAn(x, y)) continue;
        const d = Math.hypot(x - basis.x, y - basis.y);
        if (d < bester) {
          bester = d;
          bestes = { x, y };
        }
      }
    }
    return bestes;
  }

  /**
   * Das naechste freie Feld um einen Punkt, von innen nach aussen gesucht und
   * innerhalb eines Ringes das, welches `von` am naechsten liegt. Fuer Ziele,
   * die selbst kein Feld sind, auf das man gehen kann: ein eigenes Gebaeude
   * belegt mehrere Felder, ein Angriffsort ist vielleicht Wald.
   *
   * **Frei heisst auch: niemand steht darauf** - und fuer ein Marschziel
   * ausserdem: kein Feind daneben (`feindFern`). Der Server liest einen
   * Angriffsbefehl aus dem Feld unter dem Klick und greift dabei einen Feind
   * im Umkreis von einem Feld mit (`feindAn`, kampf AC-1). Lag das Marschziel
   * der Wache neben dem Angreifer, wurde aus dem Angriffslauf ein Angriff auf
   * genau diese eine Einheit - fiel sie unterwegs, blieb die Wache stehen, wo
   * sie war, zwoelf Felder vom Dorf. So gesehen in Runde 86 im Browser,
   * waehrend die Node-Tests gruen waren: dort kam die Wache von der anderen
   * Seite, und das naechste freie Feld lag nicht beim Angreifer. Mit Abstand
   * bleibt der Angriffslauf stehen, und der greift den Angreifer an, sobald
   * er in Sicht kommt (kampf AC-8) - und marschiert weiter, wenn er faellt.
   *
   * @param {object} [wie]
   * @param {number} [wie.feindFern] Abstand von jedem Feind (`FEIND_FERN`).
   * @param {{x:number,y:number}[]} [wie.vergeben] Ziele derselben
   *   Entscheidung, von denen es `VERGEBEN_ABSTAND` wegbleibt.
   * @param {boolean} [wie.rundumFrei] fuer eine Gruppe: Nachbarfelder frei.
   * @param {Set<string>} [wie.ausser] wer gerade neu beauftragt wird.
   */
  freiesFeldUm(um, von = this.spieler.basis, {
    feindFern = 0, vergeben = [], rundumFrei = false, ausser = null,
  } = {}) {
    const besetzt = new Set();
    const feinde = [];
    for (const e of this.welt.einheiten.values()) {
      if (e.tot) continue;
      // Wer jetzt neu losgeschickt wird, belegt nichts - weder wo er steht noch
      // wohin er eben lief. Sonst sperrte eine Wache, die schon unterwegs ist,
      // bei jedem weiteren Treffer ihr eigenes Ziel und bekaeme ein neues: ihr
      // Ziel spraenge jede halbe Sekunde (gefunden in der Durchsicht der Runde
      // 86, eigener Test).
      if (ausser?.has(e.id)) continue;
      // Fremde nur, wenn sie sie sieht (ki AC-13).
      if (e.besitzer !== this.spielerId && !this.welt.sieht(this.spielerId, Math.round(e.x), Math.round(e.y))) continue;
      besetzt.add(`${Math.round(e.x)},${Math.round(e.y)}`);
      // Wohin die **eigenen** gerade laufen, ist auch belegt - sonst schickt die
      // naechste Entscheidung den naechsten Getroffenen auf dasselbe Feld
      // (Runde 86: zwei Dorfbewohner auf 63/107, eine halbe Sekunde
      // nacheinander losgeschickt). Fremde Wege kennt ein Mensch nicht, also
      // auch die KI nicht.
      if (e.besitzer === this.spielerId && e.weg.length) {
        const ende = e.weg[e.weg.length - 1];
        besetzt.add(`${Math.round(ende.x)},${Math.round(ende.y)}`);
      }
      if (feindFern > 0 && e.besitzer !== this.spielerId) feinde.push(e);
    }
    for (let r = 1; r <= 8; r++) {
      let bestes = null;
      let bester = Infinity;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = Math.round(um.x) + dx;
          const y = Math.round(um.y) + dy;
          if (!karten.begehbar(this.welt.karte, x, y) || this.welt.gebaeudeAn(x, y)) continue;
          if (besetzt.has(`${x},${y}`)) continue;
          if (feinde.some((f) => Math.hypot(f.x - x, f.y - y) <= feindFern)) continue;
          if (vergeben.some((v) => Math.hypot(v.x - x, v.y - y) <= VERGEBEN_ABSTAND)) continue;
          if (rundumFrei && !this.rundumFrei(x, y, besetzt)) continue;
          const d = Math.hypot(x - von.x, y - von.y);
          if (d < bester) {
            bester = d;
            bestes = { x, y };
          }
        }
      }
      if (bestes) return bestes;
    }
    return null;
  }

  /**
   * Fuer das Ziel einer **Gruppe**: auch die acht Nachbarfelder sind frei. Der
   * Server stellt mehrere um ihr Ziel herum auf (einheiten AC-20), einen Ring
   * weit - stand dort einer still, stand danach die Wache auf ihm (Runde 86:
   * Berts Miliz auf dem Dorfbewohner, der am Dorfzentrum ein Schaf schlachtet).
   */
  rundumFrei(x, y, besetzt) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if ((dx || dy) && besetzt.has(`${x + dx},${y + dy}`)) return false;
      }
    }
    return true;
  }

  /**
   * Die Verteidigung zu Hause (ki AC-14). Die KI bekommt keine Meldung, dass
   * sie angegriffen wird - sie **sieht** es: was seit der letzten Entscheidung
   * Leben verloren hat, ist getroffen worden. Gezaehlt werden nur Gebaeude und
   * Dorfbewohner; ein Heer, das unterwegs Schlaege einsteckt, soll die Wache
   * nicht quer ueber die Karte holen.
   *
   * Dann zweierlei, beides wie bei einem Menschen ueber `welt.nachricht`:
   * die Wache zieht im Angriffslauf zum Angriffsort, und ein getroffener
   * Dorfbewohner laesst die Arbeit liegen und laeuft zum Dorfzentrum. Das
   * zweite ist ein Befehl **gegen** die Gegenwehr aus kampf AC-2: ohne ihn
   * bliebe er stehen und schluege zurueck - mit Angriff 3 und ohne Ruestung
   * (kampf AC-5) ist das ein toter Dorfbewohner und kein gewonnener Kampf.
   */
  verteidigenPruefen(eigene, gebaeude, zentrum) {
    const jetzt = new Map();
    const getroffeneDorf = [];
    const getroffeneBauten = [];
    for (const e of eigene) {
      if (e.tot) continue;
      jetzt.set(e.id, e.leben);
      const vorher = this.leben.get(e.id);
      if (vorher !== undefined && e.leben < vorher && (EINHEITEN[e.art].klassen || []).includes('dorf')) {
        getroffeneDorf.push(e);
      }
    }
    for (const g of gebaeude) {
      jetzt.set(g.id, g.leben);
      const vorher = this.leben.get(g.id);
      // Eine Baustelle gewinnt Leben, waehrend sie waechst - nur der Verlust zaehlt.
      if (vorher !== undefined && g.leben < vorher) getroffeneBauten.push(g);
    }
    this.leben = jetzt;
    const getroffen = [...getroffeneBauten, ...getroffeneDorf];
    if (!getroffen.length) return;

    // Der Angriffsort: von allem, was getroffen wurde, das dem eigenen Dorf
    // naechste. Wird an zwei Stellen zugleich geschlagen, zaehlt die, die dem
    // Dorf weh tut.
    const { basis } = this.spieler;
    const ort = getroffen
      .map((d) => ({ x: d.x, y: d.y, d: Math.hypot(d.x - basis.x, d.y - basis.y) }))
      .sort((a, b) => a.d - b.d)[0];

    const wache = eigene.filter((e) => !e.tot && !this.heer.has(e.id)
      && !(EINHEITEN[e.art].klassen || []).includes('dorf'));
    const ziehen = wache.filter((e) => Math.hypot(e.x - ort.x, e.y - ort.y) > WACHE_NAH
      && e.auftrag?.art !== 'angreifen');
    const vergeben = [];
    if (ziehen.length) {
      const von = { x: ziehen[0].x, y: ziehen[0].y };
      const ausser = new Set(ziehen.map((e) => e.id));
      // Fuer eine Gruppe erst mit freien Nachbarfeldern - findet sich so keins,
      // weil das Dorf voll steht, dann ohne: lieber ein enges Ziel als gar
      // keine Wache.
      const feld = (ziehen.length > 1
        && this.freiesFeldUm(ort, von, { feindFern: FEIND_FERN, rundumFrei: true, ausser }))
        || this.freiesFeldUm(ort, von, { feindFern: FEIND_FERN, ausser });
      if (feld) {
        vergeben.push(feld);
        this.senden({ auftrag: 'befehl', einheiten: ziehen.map((e) => e.id), ziel: feld, angriffslauf: true });
        this.verteidigungen += 1;
      }
    }

    if (!getroffeneDorf.length) return;
    // Auch der Fluchtpunkt haelt Abstand: wer vor dem Angreifer flieht, laeuft
    // nicht zwischen seine Leute, und nicht auf das Feld, zu dem eben die Wache
    // geschickt wurde.
    const heim = this.freiesFeldUm(zentrum || basis, { x: getroffeneDorf[0].x, y: getroffeneDorf[0].y },
      { feindFern: FEIND_FERN, vergeben, ausser: new Set(getroffeneDorf.map((e) => e.id)) });
    if (heim) this.senden({ auftrag: 'befehl', einheiten: getroffeneDorf.map((e) => e.id), ziel: heim });
  }

  /**
   * Nach dem Aufstieg: ein Sammler vom Rohstoff, der sich stapelt, zu dem, der
   * fehlt (ki AC-12). Hoechstens einer alle UMVERTEILEN_SEKUNDEN, damit nicht
   * in einer halben Sekunde alle umziehen und die Lage umkippt. Wer an einem
   * Vorrat oder Tier arbeitet, geht vor dem Bauern: eine Farm traegt auch
   * spaeter noch.
   */
  umverteilen(dorfbewohner) {
    if (this.spieler.zeitalter < 1) return;
    if (this.welt.takt - this.zuletztUmverteilt < UMVERTEILEN_SEKUNDEN * TAKTE_PRO_SEKUNDE) return;
    const vorrat = (r) => this.spieler[r];
    const fehlt = ['holz', 'gold', 'nahrung'].filter((r) => vorrat(r) < MANGEL)
      .sort((a, b) => vorrat(a) - vorrat(b))[0];
    if (!fehlt) return;
    // Ueberfluss heisst: mindestens UEBERSCHUSS mehr als beim fehlenden. Bis
    // Runde 94 eine feste Grenze von 600 - beim Startwert 20 lag die Nahrung ab
    // Minute 20 bei 0 bis 40, das Holz bei 580, und niemand zog um; das
    // Dorfzentrum ersetzte keinen der zehn Gefallenen (Runde 95).
    const satt = ['nahrung', 'holz', 'gold'].filter((r) => r !== fehlt && vorrat(r) - vorrat(fehlt) >= UEBERSCHUSS)
      .sort((a, b) => vorrat(b) - vorrat(a))[0];
    if (!satt) return;
    const kandidaten = dorfbewohner.filter((e) => !e.weg.length && this.rolle(e) === satt);
    const wer = kandidaten.find((e) => e.auftrag?.art !== 'farm') || kandidaten[0];
    if (!wer) return;
    // Die Sperre gilt fuer jeden **Versuch**, nicht nur fuer einen gelungenen:
    // ein Befehl nimmt dem Sammler seine Arbeit, auch wenn kein Weg zum neuen
    // Vorrat fuehrt - ohne Sperre risse die naechste halbe Sekunde den
    // naechsten heraus (Durchsicht Runde 90).
    this.zuletztUmverteilt = this.welt.takt;
    // Mit der ganzen Liste, sonst greifen die Obergrenzen an Schafen und
    // Beeren nicht (Durchsicht Runde 90).
    if (this.schicken(wer, fehlt, dorfbewohner)) this.umverteilt += 1;
  }

  untaetig(einheit) {
    return !einheit.auftrag && !einheit.weg.length && !einheit.sammelt && !einheit.baut;
  }

  // Was einer gerade tut, als Rohstoff (oder 'bau').
  rolle(einheit) {
    const a = einheit.auftrag;
    if (!a) return einheit.ladung > 0 ? einheit.ladungsart : null;
    if (a.art === 'tier' || a.art === 'farm') return 'nahrung';
    if (a.art === 'bauen') return 'bau';
    if (a.art === 'sammeln') {
      const feld = this.welt.karte.felder[a.feld.y * this.welt.karte.groesse + a.feld.x];
      return SAMMELN[feld]?.rohstoff || einheit.ladungsart;
    }
    return einheit.ladungsart;
  }

  rollen(dorfbewohner) {
    const zaehler = {};
    for (const e of dorfbewohner) {
      const r = this.rolle(e);
      if (r) zaehler[r] = (zaehler[r] || 0) + 1;
    }
    return zaehler;
  }

  // Die eigenen Schafe einmal ans Dorfzentrum treiben, dort wird geschlachtet.
  schafeTreiben() {
    const { basis } = this.spieler;
    const schafe = [...this.welt.tiere.values()].filter((t) => t.besitzer === this.spielerId && !t.geschlachtet);
    schafe.forEach((schaf, i) => {
      const ziel = { x: basis.x + 3 + (i % 3), y: basis.y + 3 + Math.floor(i / 3) };
      if (karten.begehbar(this.welt.karte, ziel.x, ziel.y)) this.senden({ auftrag: 'befehl', einheiten: [schaf.id], ziel });
    });
    this.schafeGetrieben = true;
  }

  // Einen Dorfbewohner an einen Rohstoff schicken. Nahrung: bis zu sechs an
  // die Schafe, dann bis zu sechs an die Beeren, dann eine freie Farm - und
  // wenn nichts davon frei ist, doch dorthin, wo noch etwas ist. Zurueck
  // kommt, ob es ein Ziel gab.
  schicken(einheit, rohstoff, dorfbewohner = []) {
    if (rohstoff === 'nahrung') {
      const an = (art) => dorfbewohner.filter((e) => e.auftrag?.art === art).length;
      const anBeeren = dorfbewohner.filter((e) => e.auftrag?.art === 'sammeln' && this.rolle(e) === 'nahrung').length;
      const schaf = this.naechstesSchaf(einheit);
      const beere = this.naechstesFeld(einheit, FELD_FUER.nahrung);
      const farm = this.freieFarm();
      const versuche = [];
      if (schaf && an('tier') < AN_SCHAFEN) versuche.push(() => this.zumSchaf(einheit, schaf));
      if (beere && anBeeren < AN_BEEREN) versuche.push(() => this.zumFeld(einheit, beere));
      if (farm) versuche.push(() => this.befehl(einheit, { x: farm.x, y: farm.y }));
      if (schaf) versuche.push(() => this.zumSchaf(einheit, schaf));
      if (beere) versuche.push(() => this.zumFeld(einheit, beere));
      // Erst wenn er wirklich losgeht, gilt er als geschickt - sonst die
      // naechste Moeglichkeit (siehe zumFeld).
      return versuche.some((versuch) => versuch() && this.unterwegs(einheit));
    }
    const feld = this.naechstesFeld(einheit, FELD_FUER[rohstoff]);
    return feld ? this.zumFeld(einheit, feld) && this.unterwegs(einheit) : false;
  }

  /**
   * Zu einem Vorrat schicken - und ein Feld, zu dem kein Weg fuehrt, nicht
   * wieder vorschlagen (ki AC-10, ki AC-12). Beim Startwert 14 schickte die KI
   * ab Minute 20 jeden Untaetigen an einen Beerenbusch 29 Felder vom Dorf, zu
   * dem kein Weg fuehrte; er blieb stehen, und die naechste Entscheidung
   * schickte ihn wieder hin. Die freie Farm daneben kam nie an die Reihe, und
   * die Nahrung stand sechs Minuten bei 10 (Runde 90, gemessen).
   */
  zumFeld(einheit, feld) {
    if (!this.befehl(einheit, feld)) return false;
    if (!this.unterwegs(einheit)) this.unerreichbar.set(feld.y * this.welt.karte.groesse + feld.x, this.welt.takt);
    return true;
  }

  // Ist ein Feld als unerreichbar gemerkt? Die Sperre laeuft ab: ein Weg kann
  // kurz zugestellt sein - von einer Baustelle, einem Feind, der den Befehl zum
  // Angriff macht - und fuer immer gesperrt schrumpfte der Vorrat an Gold und
  // Holz eine lange Partie hindurch (Durchsicht Runde 90).
  gesperrt(index) {
    const seit = this.unerreichbar.get(index);
    return seit !== undefined && this.welt.takt - seit < UNERREICHBAR_SEKUNDEN * TAKTE_PRO_SEKUNDE;
  }

  // Hat er einen Weg, oder steht er schon dort, wo er arbeiten soll? Fuer das
  // Schaf und die Farm ebenso nach dem Abstand - vorher galt beides immer als
  // unterwegs, auch ohne Weg (Durchsicht Runde 90).
  unterwegs(einheit) {
    if (einheit.weg.length) return true;
    const a = einheit.auftrag;
    if (a?.art === 'sammeln') return Math.hypot(einheit.x - a.feld.x, einheit.y - a.feld.y) <= 1.9;
    if (a?.art === 'tier') {
      const tier = this.welt.tiere.get(a.tier);
      return Boolean(tier) && Math.hypot(einheit.x - tier.x, einheit.y - tier.y) <= 1.5;
    }
    if (a?.art === 'farm') {
      const farm = this.welt.gebaeude.get(a.gebaeude);
      return Boolean(farm) && this.welt.abstandZu(einheit, farm) <= 1.2;
    }
    return false;
  }

  freieFarm() {
    return [...this.welt.gebaeude.values()].find((g) => g.besitzer === this.spielerId && g.art === 'farm' && g.fertig
      && (!g.arbeiter || !this.welt.einheiten.has(g.arbeiter)));
  }

  // Zum Schaf: auf ein freies Feld an ihm zielen. Das gerundete Feld des
  // Schafs kann ein Vorrat sein - dann hiesse der Befehl "Stein sammeln"
  // (Runde 44 im Pruefstand gesehen).
  zumSchaf(einheit, schaf) {
    const kandidaten = [];
    for (const x of [Math.floor(schaf.x), Math.ceil(schaf.x)]) {
      for (const y of [Math.floor(schaf.y), Math.ceil(schaf.y)]) {
        if (karten.begehbar(this.welt.karte, x, y)) kandidaten.push({ x, y, d: Math.hypot(x - schaf.x, y - schaf.y) });
      }
    }
    kandidaten.sort((a, b) => a.d - b.d);
    if (!kandidaten.length) return false;
    return this.befehl(einheit, { x: kandidaten[0].x, y: kandidaten[0].y });
  }

  befehl(einheit, ziel) {
    return !this.senden({ auftrag: 'befehl', einheiten: [einheit.id], ziel }).fehler;
  }

  // Ein Schaf mit Nahrung: zuerst ein schon geschlachtetes, dann ein lebendes.
  naechstesSchaf(einheit) {
    let bestes = null;
    let besterWert = Infinity;
    for (const t of this.welt.tiere.values()) {
      if (t.besitzer !== this.spielerId || t.nahrung <= 0) continue;
      const wert = Math.hypot(t.x - einheit.x, t.y - einheit.y) + (t.geschlachtet ? 0 : 6);
      if (wert < besterWert) {
        besterWert = wert;
        bestes = t;
      }
    }
    return bestes;
  }

  naechstesFeld(von, arten) {
    const { karte } = this.welt;
    const { basis } = this.spieler;
    let bestes = null;
    let besterAbstand = Infinity;
    for (const index of karte.vorrat.keys()) {
      if (!arten.includes(karte.felder[index]) || this.gesperrt(index)) continue;
      const x = index % karte.groesse;
      const y = (index / karte.groesse) | 0;
      if (Math.hypot(x - basis.x, y - basis.y) > REICHWEITE) continue;
      const abstand = Math.hypot(x - von.x, y - von.y);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = { x, y };
      }
    }
    return bestes;
  }

  /**
   * Eine Baustelle, an der niemand mehr baut, bekommt einen Bauer zurueck -
   * eine je Entscheidung. Ihr Bauer kann gefallen oder geflohen sein (ki AC-14),
   * und eine liegengebliebene Hausbaustelle sperrte jedes weitere Haus
   * (`hausImBau`): beim Startwert 13 blieb die Bevoelkerung ab Minute 55 bei
   * 40 von 40, das Heer bei 18, und die Partie endete nach 90 Minuten
   * unentschieden neben 4000 Nahrung (Runde 94, gemessen).
   *
   * Uebersprungen wird (Durchsicht Runde 94): eine Baustelle, an der eben kein
   * Weg zu finden war - zwei Minuten lang, wie ein unerreichbarer Vorrat;
   * sonst risse sie jede halbe Sekunde einen Arbeiter aus der Arbeit -, und
   * eine, an der Feinde stehen: der Ersatz liefe hinein.
   */
  baustellenWeiterbauen(gebaeude, dorfbewohner) {
    // Wer mit voller Ladung festsitzt - kein Weg, nicht am Lager - und an
    // einer eigenen Baustelle steht, baut mit. Beim Startwert 18 schloss eine
    // Muehle im Bau einen Beerensammler in eine Tasche aus zwei Feldern ein; er
    // wartete 22 Sekunden, bis andere sie fertig hatten, und lieferte dann
    // neben sich ab (ki AC-10, Runde 95).
    const baustellen = gebaeude.filter((g) => !g.fertig);
    for (const e of dorfbewohner) {
      // Festsitzend heisst: volle Ladung, sammelt nicht, kein Weg - nicht jeder,
      // der gerade etwas traegt (Durchsicht Runde 95).
      if (e.ladung < EINHEITEN[e.art].tragkraft || e.sammelt || e.weg.length || e.auftrag?.art !== 'sammeln') continue;
      const lager = this.welt.lagerFuer(e);
      if (lager && this.welt.abstandZu(e, lager) <= 1.2) continue;
      const daneben = baustellen.find((g) => this.welt.abstandZu(e, g) <= 1.2);
      if (daneben) this.senden({ auftrag: 'befehl', einheiten: [e.id], ziel: { x: daneben.x, y: daneben.y } });
    }
    const feinde = this.sichtbareFeinde();
    const verlassen = gebaeude.find((g) => !g.fertig
      && !this.gesperrt(BAUSTELLE + g.id)
      && !dorfbewohner.some((e) => e.auftrag?.art === 'bauen' && e.auftrag.gebaeude === g.id)
      && !feinde.some((f) => Math.hypot(f.x - g.x, f.y - g.y) < BAUSTELLE_FEIND_FERN));
    if (!verlassen) return;
    // Kein begehbares Feld unmittelbar am Rand: niemand kann dort bauen. Der
    // Befehl fuehrte trotzdem zu einem Weg - `randfeld` sucht bis drei Felder
    // weit -, und der Bauer gaebe erst bei der Ankunft auf.
    const rand = this.welt.randfelder(verlassen, verlassen);
    if (!rand.length) {
      this.unerreichbar.set(BAUSTELLE + verlassen.id, this.welt.takt);
      return;
    }
    // Wer baut: unter den drei Naechsten der erste, der an einen Rand kommt -
    // auch mit Ladung. Beim Startwert 18 schloss eine liegengebliebene Muehle
    // einen Beerensammler in eine Tasche aus zwei Feldern ein; er stand an
    // ihrem Rand, haette sie fertigbauen und dann dort abliefern koennen, aber
    // gewaehlt wurde ein Untaetiger am Dorfzentrum, der nicht hinkam (Runde 95).
    // Wer schon baut, wird nicht abgezogen - sonst nahmen sich zwei
    // Baustellen den einzigen Bauer abwechselnd weg (Durchsicht Runde 95).
    const naechste = dorfbewohner.filter((e) => e.auftrag?.art !== 'bauen')
      .sort((a, b) => Math.hypot(a.x - verlassen.x, a.y - verlassen.y) - Math.hypot(b.x - verlassen.x, b.y - verlassen.y))
      .slice(0, 3);
    const bauer = naechste.find((e) => {
      const von = this.welt.feldVon(e);
      // Die vier naechsten Randfelder genuegen: eine vergebliche Suche
      // durchflutet das ganze erreichbare Gebiet (Durchsicht Runde 91).
      return this.welt.randfelder(verlassen, e).slice(0, 4)
        .some((f) => (f.x === von.x && f.y === von.y) || suchen(this.welt.karte, von, f).length);
    });
    if (!bauer) {
      this.unerreichbar.set(BAUSTELLE + verlassen.id, this.welt.takt);
      return;
    }
    this.senden({ auftrag: 'befehl', einheiten: [bauer.id], ziel: { x: verlassen.x, y: verlassen.y } });
    if (!(bauer.auftrag?.art === 'bauen' && (bauer.weg.length || bauer.baut))) {
      this.unerreichbar.set(BAUSTELLE + verlassen.id, this.welt.takt);
    }
  }

  // Wer baut: ein Holzfaeller ohne Ladung, sonst irgendeiner ohne Ladung.
  bauer(dorfbewohner) {
    return dorfbewohner.find((e) => this.untaetig(e))
      || dorfbewohner.find((e) => this.rolle(e) === 'holz' && e.ladung === 0)
      || dorfbewohner.find((e) => this.rolle(e) !== 'bau' && e.ladung === 0)
      || dorfbewohner.find((e) => this.rolle(e) !== 'bau');
  }

  bauen(art, platz, dorfbewohner, anzahl = 1) {
    if (!platz || !dorfbewohner.length) return false;
    for (const [rohstoff, menge] of Object.entries(GEBAEUDE[art].kosten)) {
      if (this.spieler[rohstoff] < menge) return false;
    }
    const bauer = [];
    for (let i = 0; i < anzahl; i++) {
      const naechster = this.bauer(dorfbewohner.filter((e) => !bauer.includes(e)));
      if (naechster) bauer.push(naechster);
    }
    if (!bauer.length) return false;
    return !this.senden({ auftrag: 'bauen', einheiten: bauer.map((e) => e.id), art, ziel: platz }).fehler;
  }

  lagerPruefen(rohstoff, rollen, gebaeude, dorfbewohner) {
    const art = LAGER_FUER[rohstoff];
    const mindestens = LAGER_ARBEITER[rohstoff];
    if ((rollen[rohstoff] || 0) < mindestens) return;
    // Dieselbe Ruecklage wie vor der Farm: nach dem Aufstieg kommt das
    // Militaergebaeude vor dem naechsten Lager. Beim Startwert 4 baute die KI
    // in der Feudalzeit erst ein Holzfaellerlager und eine Muehle, und die
    // Schiessanlage stand 2,3 Minuten spaeter - bei Minute 16 hatte sie zwei
    // Kampfeinheiten statt sechs (Runde 89; aufgefallen, als einheiten AC-29
    // die Sammler um ein Feld verschob und die KI anders entschied).
    const militaerFehlt = this.spieler.zeitalter > 0 && !gebaeude.some((g) => MILITAER.includes(g.art));
    if (militaerFehlt && this.spieler.holz < MILITAER_HOLZ + (GEBAEUDE[art].kosten.holz || 0)) return;
    if (gebaeude.some((g) => g.art === art && !g.fertig)) return;
    // Wo die meisten dieses Rohstoffs arbeiten: dort der Mittelpunkt.
    const arbeiter = dorfbewohner.filter((e) => this.rolle(e) === rohstoff && e.auftrag?.art === 'sammeln');
    if (arbeiter.length < mindestens) return;
    const mitte = arbeiter[Math.floor(arbeiter.length / 2)].auftrag.feld;
    const annehmend = gebaeude.filter((g) => GEBAEUDE[g.art].annahme.includes(rohstoff));
    const naechstes = Math.min(...annehmend.map((g) => Math.hypot(g.x - mitte.x, g.y - mitte.y)));
    if (naechstes <= LAGER_AB) return;
    this.bauen(art, this.platzBei(art, mitte), dorfbewohner);
  }

  farmenPruefen(rollen, gebaeude, dorfbewohner) {
    // Nach dem Aufstieg kommt das Militaergebaeude vor der naechsten Farm:
    // beide kosten Holz, und beim Startwert 15 standen am Ende 640 Gold neben
    // 150 Holz - fuer die Schiessanlage reichte es nie (ki AC-9, Runde 69).
    const militaerFehlt = this.spieler.zeitalter > 0 && !gebaeude.some((g) => MILITAER.includes(g.art));
    if (militaerFehlt && this.spieler.holz < MILITAER_HOLZ + GEBAEUDE.farm.kosten.holz) return;
    const schafeUebrig = [...this.welt.tiere.values()].some((t) => t.besitzer === this.spielerId && t.nahrung > 0);
    const beerenUebrig = Boolean(this.naechstesFeld(this.spieler.basis, FELD_FUER.nahrung));
    const farmen = gebaeude.filter((g) => g.art === 'farm');
    if (farmen.some((g) => !g.fertig)) return;
    // Eine Farm fuer jeden, der Nahrung holen soll und weder an Schafen noch an
    // Beeren Platz findet (ki AC-5: Farmen, sobald beides zur Neige geht).
    const soll = plan(dorfbewohner.length).nahrung;
    const tragen = soll - (schafeUebrig ? AN_SCHAFEN : 0) - (beerenUebrig ? AN_BEEREN : 0);
    // Nach dem Aufstieg zaehlt nicht nur der Plan: fehlt Nahrung und ist keine
    // Farm frei, kommt eine dazu (ki AC-12). Sonst fand die Umverteilung keinen
    // Platz - Schafe und Beeren voll, alle Farmen besetzt -, und beim
    // Startwert 11 hungerte KI 1 ab Minute 22 neben 640 Gold (Runde 90).
    const hunger = this.spieler.zeitalter > 0 && this.spieler.nahrung < MANGEL && !this.freieFarm();
    if (farmen.length >= tragen && !hunger) return;
    const zentrum = gebaeude.find((g) => g.art === 'dorfzentrum');
    const muehle = gebaeude.find((g) => g.art === 'muehle' && g.fertig);
    const um = farmen.length % 2 && muehle ? muehle : zentrum;
    if (um) this.bauen('farm', this.platzBei('farm', um, 3), dorfbewohner);
  }

  platzBeiBasis(art) {
    return this.platzBei(art, this.spieler.basis, 4);
  }

  // Ein Bauplatz nahe einem Punkt, ringweise, mit einem Feld Abstand zu anderen
  // Gebaeuden, damit Wege frei bleiben.
  platzBei(art, um, abstand = 2) {
    const n = GEBAEUDE[art].groesse;
    for (let r = abstand; r < abstand + 12; r++) {
      const ring = [];
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) ring.push([dx, dy]);
      }
      const start = Math.floor(this.zufall() * ring.length);
      for (let i = 0; i < ring.length; i++) {
        const [dx, dy] = ring[(start + i) % ring.length];
        const x = um.x + dx;
        const y = um.y + dy;
        if (this.welt.platzPruefen(art, x, y) && this.randFrei(x, y, n)) return { x, y };
      }
    }
    return null;
  }

  // Um die Grundflaeche ein Feld, auf dem kein Gebaeude steht und das nicht
  // ganz zu ist - Baeume am Rand sind erlaubt, Lager stehen am Wald.
  randFrei(x, y, n) {
    const { karte } = this.welt;
    const x0 = x - Math.floor(n / 2) - 1;
    const y0 = y - Math.floor(n / 2) - 1;
    let frei = 0;
    for (let fy = y0; fy < y0 + n + 2; fy++) {
      for (let fx = x0; fx < x0 + n + 2; fx++) {
        const innen = fx > x0 && fx < x0 + n + 1 && fy > y0 && fy < y0 + n + 1;
        if (innen) continue;
        if (fx < 0 || fy < 0 || fx >= karte.groesse || fy >= karte.groesse) return false;
        const feld = karte.felder[fy * karte.groesse + fx];
        if (feld === karten.BEBAUT) return false;
        if (this.welt.gebaeudeAn(fx, fy)) return false;
        if (feld === karten.GRAS) frei += 1;
      }
    }
    return frei >= n * 2;
  }
}

module.exports = {
  Ki, ENTSCHEIDEN_ALLE, ZIEL_DORFBEWOHNER, FEUDALZEIT_NAHRUNG, AN_SCHAFEN, AN_BEEREN, MILITAER,
  HEER, WACHE, UEBERLEGEN, MARSCH_MINDESTENS, HEER_ABSTAND, WACHE_NAH, FEIND_FERN, VERGEBEN_ABSTAND, MILITAER_HOLZ, UEBERSCHUSS, MANGEL, UMVERTEILEN_SEKUNDEN, UNERREICHBAR_SEKUNDEN, MILITAER_HOECHSTENS, plan,
};
