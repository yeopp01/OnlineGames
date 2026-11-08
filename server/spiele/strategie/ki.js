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

// Nach dem Aufstieg verteilt die KI um (ki AC-12): liegt von einem Rohstoff
// mehr als UEBERSCHUSS und von einem anderen weniger als MANGEL, geht alle
// UMVERTEILEN_SEKUNDEN ein Sammler vom einen zum anderen. Der feste Plan der
// Dunklen Zeit legt 14 von 22 auf Nahrung; in der Feudalzeit lagen beim
// Startwert 4 bei Minute 30 2300 Nahrung neben 20 Holz, das Heer fehlte, und
// ein Ueberfall nahm elf Dorfbewohner (Runde 90, gemessen).
const UEBERSCHUSS = 600;
const MANGEL = 300;
const UMVERTEILEN_SEKUNDEN = 10;
// So lange schlaegt die KI einen Vorrat nicht wieder vor, zu dem kein Weg
// fuehrte - danach versucht sie es noch einmal.
const UNERREICHBAR_SEKUNDEN = 120;

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
    const dorfbewohner = eigene.filter((e) => e.art === 'dorfbewohner');
    const gebaeude = [...welt.gebaeude.values()].filter((g) => g.besitzer === this.spielerId);
    const zentrum = gebaeude.find((g) => g.art === 'dorfzentrum' && g.fertig);

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
    this.verteidigenPruefen(eigene, gebaeude, zentrum);
    this.umverteilen(dorfbewohner);

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
    const meine = gebaeude.filter((g) => MILITAER.includes(g.art));
    if (!meine.length) {
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
    for (const g of meine) {
      if (!g.fertig || g.schlange.length >= MILITAER_SCHLANGE) continue;
      const art = this.naechsteKampfeinheit(g, ruecklage);
      if (art) this.senden({ auftrag: 'ausbilden', gebaeude: g.id, einheit: art });
    }
    // Nachschub braucht Durchsatz: sind alle voll beschaeftigt und ist Holz
    // uebrig, ein weiteres.
    const alleVoll = meine.every((g) => g.fertig && g.schlange.length >= MILITAER_SCHLANGE);
    if (alleVoll && meine.length < MILITAER_HOECHSTENS && this.spieler.holz >= MILITAER_HOLZ + MILITAER_RESERVE) {
      const art = this.spieler.gold >= MILITAER_GOLD ? 'schiessanlage' : 'stall';
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
    if (!kampf.length) return;
    const gegner = this.naechsterGegner();
    if (!gegner) return;
    const ziel = this.gegnerZiel(gegner);
    if (!ziel) return;

    // Nachsetzen: wer steht, geht auf das Ziel. Nicht `untaetig()` - das
    // beantwortet die Frage nur fuer Dorfbewohner (ki AC-6).
    const stehend = kampf.filter((e) => this.heer.has(e.id) && !e.auftrag && !e.weg.length && !e.angriffslauf);
    if (stehend.length) this.senden({ auftrag: 'befehl', einheiten: stehend.map((e) => e.id), ziel });

    // Der Aufbruch. Die beiden, die der Basis am naechsten stehen, bleiben:
    // so wacht die Wache dort, wo das Dorf ist.
    const daheim = kampf.filter((e) => !this.heer.has(e.id));
    if (daheim.length < HEER + WACHE) return;
    const { basis } = this.spieler;
    const nachAbstand = [...daheim].sort((a, b) => Math.hypot(a.x - basis.x, a.y - basis.y) - Math.hypot(b.x - basis.x, b.y - basis.y));
    const marsch = nachAbstand.slice(WACHE, WACHE + HEER);
    const feld = this.marschziel(ziel);
    if (!feld) return;
    this.senden({ auftrag: 'befehl', einheiten: marsch.map((e) => e.id), ziel: feld, angriffslauf: true });
    for (const e of marsch) this.heer.add(e.id);
    this.angriffe += 1;
    if (this.angriffTakt === null) this.angriffTakt = this.welt.takt;
  }

  // Der naechste Gegner, der noch mitspielt - gemessen von Basis zu Basis.
  naechsterGegner() {
    const { basis } = this.spieler;
    let bester = Infinity;
    let gegner = null;
    for (const s of this.welt.spieler) {
      if (s.id === this.spielerId || s.aus) continue;
      const d = Math.hypot(s.basis.x - basis.x, s.basis.y - basis.y);
      if (d < bester) {
        bester = d;
        gegner = s;
      }
    }
    return gegner;
  }

  // Worauf das Heer zielt: das Dorfzentrum des Gegners, sonst irgendein
  // Gebaeude von ihm, sonst seine Basis - dort stehen dann seine Einheiten.
  gegnerZiel(gegner) {
    const seine = [...this.welt.gebaeude.values()].filter((g) => g.besitzer === gegner.id);
    const zentrum = seine.find((g) => g.art === 'dorfzentrum');
    const gebaeude = zentrum || seine[0];
    return gebaeude ? { x: gebaeude.x, y: gebaeude.y } : { x: gegner.basis.x, y: gegner.basis.y };
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
    const satt = ['nahrung', 'holz', 'gold'].filter((r) => r !== fehlt && vorrat(r) > UEBERSCHUSS)
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
  HEER, WACHE, HEER_ABSTAND, WACHE_NAH, FEIND_FERN, VERGEBEN_ABSTAND, MILITAER_HOLZ, UEBERSCHUSS, MANGEL, UMVERTEILEN_SEKUNDEN, UNERREICHBAR_SEKUNDEN, MILITAER_HOECHSTENS, plan,
};
