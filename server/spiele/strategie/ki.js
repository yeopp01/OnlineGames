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
    if (raum < 200 && raum - eigene.length <= puffer && !hausImBau && dorfbewohner.length < ZIEL_DORFBEWOHNER) {
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
      if (schaf && an('tier') < AN_SCHAFEN) return this.zumSchaf(einheit, schaf);
      if (beere && anBeeren < AN_BEEREN) return this.befehl(einheit, beere);
      if (farm) return this.befehl(einheit, { x: farm.x, y: farm.y });
      if (schaf) return this.zumSchaf(einheit, schaf);
      if (beere) return this.befehl(einheit, beere);
      return false;
    }
    const feld = this.naechstesFeld(einheit, FELD_FUER[rohstoff]);
    return feld ? this.befehl(einheit, feld) : false;
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
      if (!arten.includes(karte.felder[index])) continue;
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
    const schafeUebrig = [...this.welt.tiere.values()].some((t) => t.besitzer === this.spielerId && t.nahrung > 0);
    const beerenUebrig = Boolean(this.naechstesFeld(this.spieler.basis, FELD_FUER.nahrung));
    const farmen = gebaeude.filter((g) => g.art === 'farm');
    if (farmen.some((g) => !g.fertig)) return;
    // Eine Farm fuer jeden, der Nahrung holen soll und weder an Schafen noch an
    // Beeren Platz findet (ki AC-5: Farmen, sobald beides zur Neige geht).
    const soll = plan(dorfbewohner.length).nahrung;
    const tragen = soll - (schafeUebrig ? AN_SCHAFEN : 0) - (beerenUebrig ? AN_BEEREN : 0);
    if (farmen.length >= tragen) return;
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
  Ki, ENTSCHEIDEN_ALLE, ZIEL_DORFBEWOHNER, FEUDALZEIT_NAHRUNG, AN_SCHAFEN, AN_BEEREN, plan,
};
