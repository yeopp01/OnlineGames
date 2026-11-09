'use strict';

// Der Pruefstand (→ specs/10-strategie/ki.md AC-7, AC-8, fahrplan AC-4):
// Partien KI gegen KI ohne Server und Browser, so schnell die Maschine kann.
// Nach jedem Takt wird die Welt auf Widersprueche geprueft; der erste bricht
// die Partie mit Startwert und Takt ab - damit laesst sie sich nachspielen.

const karten = require('./karte');
const { Welt, TAKTE_PRO_SEKUNDE, ROHSTOFFE } = require('./welt');
const { BEVOELKERUNG_MAX, EINHEITEN } = require('./daten');
const { Ki, ZIEL_DORFBEWOHNER } = require('./ki');

class Widerspruch extends Error {
  constructor(startwert, takt, befunde) {
    super(`Widerspruch bei Startwert ${startwert}, Takt ${takt}: ${befunde.join('; ')}`);
    this.startwert = startwert;
    this.takt = takt;
    this.befunde = befunde;
  }
}

/** Alles, was nie sein darf. Zurueck kommt eine Liste, leer heisst: in Ordnung. */
function pruefen(welt) {
  const befunde = [];
  const bevoelkerung = welt.bevoelkerung();
  for (const spieler of welt.spieler) {
    for (const r of ROHSTOFFE) {
      if (!(spieler[r] >= 0)) befunde.push(`${spieler.name}: ${r} ist ${spieler[r]}`);
    }
    const zahl = bevoelkerung.get(spieler.id) || 0;
    if (zahl > BEVOELKERUNG_MAX) befunde.push(`${spieler.name}: Bevoelkerung ${zahl} ueber ${BEVOELKERUNG_MAX}`);
  }
  for (const e of welt.einheiten.values()) {
    const x = Math.round(e.x);
    const y = Math.round(e.y);
    if (!karten.begehbar(welt.karte, x, y)) {
      befunde.push(`Einheit ${e.id} (${e.art}) steht auf ${x}, ${y} in einem Hindernis (Feld ${welt.karte.felder[y * welt.karte.groesse + x]})`);
    }
  }
  const liste = [...welt.gebaeude.values()].map((g) => ({ g, f: welt.grundflaeche(g.art, g.x, g.y) }));
  for (let i = 0; i < liste.length; i++) {
    for (let j = i + 1; j < liste.length; j++) {
      const a = liste[i].f;
      const b = liste[j].f;
      if (a.x0 <= b.x1 && a.x1 >= b.x0 && a.y0 <= b.y1 && a.y1 >= b.y0) {
        befunde.push(`Gebaeude ${liste[i].g.id} (${liste[i].g.art}) und ${liste[j].g.id} (${liste[j].g.art}) ueberlappen`);
      }
    }
  }
  return befunde;
}

/**
 * Wer steht herum? Ein Dorfbewohner, der weder laeuft noch sammelt, hueten
 * oder Farm bestellt noch baut. Gezaehlt in Takten je Einheit, die laengste
 * Strecke je Spieler bleibt.
 */
function untaetigkeitZaehlen(welt, untaetig) {
  for (const e of welt.einheiten.values()) {
    if (e.art !== 'dorfbewohner') continue;
    if (!welt.untaetig(e)) {
      untaetig.seit.delete(e.id);
      continue;
    }
    const n = (untaetig.seit.get(e.id) || 0) + 1;
    untaetig.seit.set(e.id, n);
    if (n > (untaetig.laengste.get(e.besitzer) || 0)) untaetig.laengste.set(e.besitzer, n);
  }
}

/** Kennzahlen eines Spielers am Ende einer Partie. */
function kennzahlen(welt, spieler, ki, untaetig) {
  const eigene = [...welt.einheiten.values()].filter((e) => e.besitzer === spieler.id);
  const gebaeude = {};
  for (const g of welt.gebaeude.values()) {
    if (g.besitzer === spieler.id && g.fertig) gebaeude[g.art] = (gebaeude[g.art] || 0) + 1;
  }
  return {
    name: spieler.name,
    dorfbewohner: eigene.filter((e) => e.art === 'dorfbewohner').length,
    // Wer schon bezahlt in der Ausbildung steht (ki AC-12): nach einem
    // Ueberfall ersetzt das Dorfzentrum Gefallene, und ein Messpunkt mitten
    // darin soll das nicht als Zusammenbruch zaehlen.
    dorfbewohnerInAusbildung: [...welt.gebaeude.values()]
      .filter((g) => g.besitzer === spieler.id)
      .reduce((summe, g) => summe + g.schlange.filter((art) => art === 'dorfbewohner').length, 0),
    einheiten: eigene.length,
    // Lebende Feinde in zwoelf Feldern um das eigene Dorfzentrum (ki AC-12):
    // sind es mehr als eigene Kampfeinheiten, wird das Dorf gerade ueberrannt.
    feindeAmDorf: (() => {
      const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === spieler.id && g.art === 'dorfzentrum');
      if (!zentrum) return 0;
      return [...welt.einheiten.values()].filter((e) => e.besitzer !== spieler.id && !e.tot
        && Math.hypot(e.x - zentrum.x, e.y - zentrum.y) < 12).length;
    })(),
    // Alles, was kein Dorfbewohner ist: die Klasse `dorf` sagt es, nicht die
    // Art - so zaehlt jede neue Kampfeinheit spaeterer Stufen mit (ki AC-9).
    kampf: eigene.filter((e) => !(EINHEITEN[e.art].klassen || []).includes('dorf')).length,
    wohnraum: welt.wohnraum(spieler),
    zeitalter: spieler.zeitalter,
    // In welcher Spielminute die Feudalzeit stand, `null` wenn gar nicht.
    feudalMinute: ki.feudalTakt === null ? null : ki.feudalTakt / (60 * TAKTE_PRO_SEKUNDE),
    // Ebenso die Ritterzeit (ki AC-21).
    ritterMinute: ki.ritterTakt === null ? null : ki.ritterTakt / (60 * TAKTE_PRO_SEKUNDE),
    // Wie oft ein Heer aufgebrochen ist und in welcher Spielminute das erste
    // (ki AC-11). `null` heisst: diese KI hat nie angegriffen.
    angriffe: ki.angriffe,
    angriffMinute: ki.angriffTakt === null ? null : ki.angriffTakt / (60 * TAKTE_PRO_SEKUNDE),
    // Wie oft die Wache zu einem Angriffsort gezogen ist (ki AC-14).
    verteidigungen: ki.verteidigungen,
    // Wie oft ein Sammler den Rohstoff gewechselt hat (ki AC-12).
    umverteilt: ki.umverteilt,
    gebaeude,
    ...Object.fromEntries(ROHSTOFFE.map((r) => [r, Math.floor(spieler[r])])),
    abgewiesen: ki.abgewiesen,
    // Laengste Zeit, die ein Dorfbewohner herumstand, in Sekunden (ki AC-6) -
    // von aussen gemessen, nicht nach der Meinung der KI.
    untaetigMax: (untaetig.laengste.get(spieler.id) || 0) / TAKTE_PRO_SEKUNDE,
  };
}

/**
 * Steht ein Dorfzentrum still, obwohl Dorfbewohner fehlen (ki AC-12)? Gezaehlt
 * wird je Spieler die laengste Strecke von Takten, in denen sein Dorfzentrum
 * fertig ist und nichts ausbildet, er weniger Dorfbewohner hat als das Ziel
 * der KI, Nahrung fuer einen hat und Platz im Haus. Das misst, ob die KI ihre
 * Wirtschaft fuehrt - unabhaengig davon, ob sie gerade einen Krieg verliert.
 */
function zentrumStillZaehlen(welt, still, ziel) {
  const dorf = new Map();
  const bewohner = new Map();
  for (const e of welt.einheiten.values()) {
    if (e.tot) continue;
    bewohner.set(e.besitzer, (bewohner.get(e.besitzer) || 0) + 1);
    if (e.art === 'dorfbewohner') dorf.set(e.besitzer, (dorf.get(e.besitzer) || 0) + 1);
  }
  for (const s of welt.spieler) {
    const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === s.id && g.art === 'dorfzentrum' && g.fertig);
    const bedarf = zentrum && !zentrum.schlange.length && (dorf.get(s.id) || 0) < ziel
      && s.nahrung >= EINHEITEN.dorfbewohner.kosten.nahrung && (bewohner.get(s.id) || 0) < welt.wohnraum(s);
    if (!bedarf) {
      still.seit.delete(s.id);
      continue;
    }
    const n = (still.seit.get(s.id) || 0) + 1;
    still.seit.set(s.id, n);
    if (n > (still.laengste.get(s.id) || 0)) still.laengste.set(s.id, n);
  }
}

/**
 * Eine Partie KI gegen KI.
 * @param {{startwert: number, spieler?: number, minuten?: number, einstellungen?: object,
 *   eingriff?: (welt: Welt, takt: number) => void}} optionen
 *   `eingriff` ist nur fuer Tests: er laeuft vor der Pruefung jedes Takts.
 */
function partieSpielen({ startwert, spieler = 2, minuten = 10, einstellungen = {}, eingriff = null }) {
  const beginn = process.hrtime.bigint();
  const liste = Array.from({ length: spieler }, (_, i) => ({ id: `ki${i + 1}`, name: `KI ${i + 1}` }));
  const welt = new Welt(liste, startwert, einstellungen);
  const kis = welt.spieler.map((s) => new Ki(welt, s.id));
  const takte = Math.round(minuten * 60 * TAKTE_PRO_SEKUNDE);
  const untaetig = { seit: new Map(), laengste: new Map() };
  const still = { seit: new Map(), laengste: new Map() };
  // Eine entschiedene Partie wird nicht weitergerechnet (spielziel AC-5):
  // gezaehlt wird, wer gewonnen hat, nicht wie viele Takte noch passen.
  for (let t = 0; t < takte && !welt.ende; t++) {
    for (const ki of kis) ki.takt();
    welt.takten();
    if (eingriff) eingriff(welt, welt.takt);
    const befunde = pruefen(welt);
    if (befunde.length) throw new Widerspruch(startwert, welt.takt, befunde);
    untaetigkeitZaehlen(welt, untaetig);
    zentrumStillZaehlen(welt, still, ZIEL_DORFBEWOHNER);
  }
  return {
    startwert,
    takte,
    // Wie weit wirklich gespielt wurde, und wie es ausging: `null`, solange
    // niemand gewonnen hat - dann war die Vorgabe `minuten` zuerst am Ende.
    gespielt: welt.takt,
    ende: welt.ende,
    sieger: welt.ende?.sieger ? welt.spieler.find((s) => s.id === welt.ende.sieger)?.name || null : null,
    dauerMs: Number(process.hrtime.bigint() - beginn) / 1e6,
    spieler: welt.spieler.map((s, i) => ({
      ...kennzahlen(welt, s, kis[i], untaetig),
      // Laengste Zeit, die das Dorfzentrum stillstand, obwohl Dorfbewohner
      // fehlten und Nahrung und Platz da waren, in Sekunden (ki AC-12).
      zentrumStillMax: (still.laengste.get(s.id) || 0) / TAKTE_PRO_SEKUNDE,
    })),
    welt,
  };
}

/**
 * Was eine Einheit kostet, in einer Zahl: alle Rohstoffe zusammen. Im Original
 * ist Gold mehr wert als Holz - das waere eine eigene Entscheidung und eine
 * eigene Zahl. Fuer "gleiche Kosten" (fahrplan AC-9) reicht die Summe, und sie
 * laesst sich an den Daten nachrechnen.
 */
function kostenSumme(art) {
  return Object.values(EINHEITEN[art].kosten).reduce((a, b) => a + b, 0);
}

// Freie Felder um einen Punkt, ringweise nach aussen: begehbar, kein Gebaeude,
// nicht schon belegt.
function freieFelder(welt, um, anzahl, belegt) {
  const felder = [];
  for (let r = 0; felder.length < anzahl && r < 30; r++) {
    for (let dy = -r; dy <= r && felder.length < anzahl; dy++) {
      for (let dx = -r; dx <= r && felder.length < anzahl; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = Math.round(um.x) + dx;
        const y = Math.round(um.y) + dy;
        if (belegt.has(`${x},${y}`) || !karten.begehbar(welt.karte, x, y) || welt.gebaeudeAn(x, y)) continue;
        belegt.add(`${x},${y}`);
        felder.push({ x, y });
      }
    }
  }
  return felder;
}

// Ist dieses Rechteck ganz frei - begehbar, ohne Gebaeude?
function flaecheFrei(welt, mx, my, breite, hoehe) {
  for (let y = my - (hoehe >> 1); y <= my + (hoehe >> 1); y++) {
    for (let x = mx - (breite >> 1); x <= mx + (breite >> 1); x++) {
      if (!karten.begehbar(welt.karte, x, y) || welt.gebaeudeAn(x, y)) return false;
    }
  }
  return true;
}

/**
 * Ein freies Schlachtfeld, so nah wie moeglich an der Mitte zwischen den
 * Basen. Ohne das stand ein Teil des Heeres hinter Baeumen und kam nie an:
 * beim Startwert 11 lag ein Waldstueck genau zwischen den Aufstellungen, drei
 * Speerkaempfer blieben in Nischen stehen und das Gefecht endete nie
 * (Runde 71). Gemessen werden sollen die Werte der Einheiten, nicht die
 * Waelder.
 */
function freieFlaeche(welt, mitte, breite, hoehe) {
  for (let r = 0; r < 60; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = Math.round(mitte.x) + dx;
        const y = Math.round(mitte.y) + dy;
        if (flaecheFrei(welt, x, y, breite, hoehe)) return { x, y };
      }
    }
  }
  return null;
}

/**
 * Wer sein Marschziel erreicht hat und keinen Feind in Sicht hat, steht still.
 * Das ist richtig so - im Spiel schickt ein Mensch ihn dann wieder los. Der
 * Gefechtsstand macht dasselbe, alle fuenf Sekunden: gemessen werden die Werte
 * der Einheiten gegeneinander, nicht wie lange zwei Haufen aneinander
 * vorbeischauen. Ohne dieses Nachsetzen endeten 3 bis 7 von 20 Gefechten
 * ueberhaupt nicht, auch nach fuenfzehn Spielminuten nicht (Runde 71).
 */
function nachsetzen(welt) {
  const lebend = [...welt.einheiten.values()].filter((e) => !e.tot);
  for (const seite of ['links', 'rechts']) {
    // Nicht `welt.untaetig()`: das beantwortet die Frage nur fuer Dorfbewohner
    // (bedienung AC-32, ki AC-6) und gibt fuer eine Kampfeinheit immer false.
    const untaetige = lebend.filter((e) => e.besitzer === seite && !e.angriffslauf && !e.auftrag && !e.weg.length);
    if (!untaetige.length) continue;
    const feinde = lebend.filter((e) => e.besitzer !== seite);
    if (!feinde.length) continue;
    for (const einheit of untaetige) {
      let naechster = feinde[0];
      let bester = Infinity;
      for (const feind of feinde) {
        const d = Math.hypot(feind.x - einheit.x, feind.y - einheit.y);
        if (d < bester) {
          bester = d;
          naechster = feind;
        }
      }
      const ziel = { x: Math.round(naechster.x), y: Math.round(naechster.y) };
      welt.nachricht(seite, { auftrag: 'befehl', einheiten: [einheit.id], ziel, angriffslauf: true });
    }
  }
}

/**
 * Ein Gefecht zweier Heere gleicher Kosten (fahrplan AC-9, AC-10).
 *
 * Jede Seite bekommt fuer dasselbe Budget so viele Einheiten ihrer Art, wie
 * hineingehen, steht dem Gegner in `abstand` Feldern gegenueber und laeuft im
 * Angriffslauf auf ihn zu. Die Anfangsausstattung der Welt wird vorher
 * geraeumt - gemessen wird das Gefecht, nicht die Wirtschaft. Die Dorfzentren
 * bleiben stehen; sie liegen weit weg und greifen niemanden an.
 *
 * Zurueck kommt der Sieger (`'links'`, `'rechts'` oder `null` bei Zeitablauf),
 * wer uebrig ist, und `spur`: je Takt eine Zahl aus dem Zustand aller
 * Einheiten - zwei gleiche Gefechte haben dieselbe Spur (AC-10).
 *
 * @param {{links: string, rechts: string, startwert: number, budget?: number,
 *   minuten?: number, abstand?: number, spurFuehren?: boolean}} optionen
 */
function gefechtSpielen({ links, rechts, startwert, budget = 600, minuten = 5, abstand = 12, spurFuehren = false }) {
  const welt = new Welt([{ id: 'links', name: 'Links' }, { id: 'rechts', name: 'Rechts' }], startwert);
  welt.einheiten.clear();
  welt.tiere.clear();

  // Das Schlachtfeld liegt auf freiem Grund zwischen den beiden Basen, die
  // Heere je zur Haelfte des Abstands daneben - so ist der Weg zueinander fuer
  // beide gleich lang. Aufgestellt wird laengs der Linie zwischen den Basen.
  const [a, b] = welt.spieler.map((sp) => sp.basis);
  const laengsY = Math.abs(b.y - a.y) >= Math.abs(b.x - a.x);
  const quer = 7;
  const laengs = abstand + 8;
  const feld = freieFlaeche(
    welt,
    { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    laengsY ? quer : laengs,
    laengsY ? laengs : quer,
  );
  if (!feld) throw new Error(`Startwert ${startwert}: kein freies Schlachtfeld ${quer} x ${laengs}`);
  // Auf freiem Grund waere jedes Gefecht dasselbe - das Gelaende war vorher
  // die einzige Abwechslung. Damit zwanzig Startwerte zwanzig Gefechte sind,
  // treffen sich die Heere **versetzt**: jede Seite steht um bis zu drei
  // Felder quer verschoben, aus dem Startwert gezogen (ki AC-2: Zufall nur
  // daraus). So laufen sie schief aufeinander zu, treffen in anderer
  // Reihenfolge und die Reihen stehen anders.
  const zufall = karten.zufallAus((startwert * 7919 + 13) >>> 0);
  const versatz = () => Math.round(zufall() * 6) - 3;
  const halb = abstand / 2;
  const belegt = new Set();
  const seiten = [
    { id: 'links', art: links, zeichen: -1 },
    { id: 'rechts', art: rechts, zeichen: 1 },
  ];
  for (const seite of seiten) {
    const laengsWeg = seite.zeichen * halb;
    const querWeg = versatz();
    seite.um = laengsY
      ? { x: feld.x + querWeg, y: feld.y + laengsWeg }
      : { x: feld.x + laengsWeg, y: feld.y + querWeg };
    seite.anzahl = Math.floor(budget / kostenSumme(seite.art));
    seite.felder = freieFelder(welt, seite.um, seite.anzahl, belegt);
    if (seite.felder.length < seite.anzahl) throw new Error(`Startwert ${startwert}: zu wenig Platz fuer ${seite.anzahl} ${seite.art}`);
    seite.ids = seite.felder.map((f) => welt.einheitAnlegen(seite.id, f.x, f.y, seite.art).id);
  }
  // Jede Seite laeuft im Angriffslauf auf die andere zu (kampf AC-4): was ihr
  // unterwegs in Sichtweite kommt, wird angegriffen.
  for (const [i, seite] of seiten.entries()) {
    const ziel = seiten[1 - i].felder[0];
    welt.nachricht(seite.id, { auftrag: 'befehl', einheiten: seite.ids, ziel, angriffslauf: true });
  }

  const lebende = (id) => [...welt.einheiten.values()].filter((e) => e.besitzer === id && !e.tot).length;
  const takte = Math.round(minuten * 60 * TAKTE_PRO_SEKUNDE);
  const spur = [];
  let sieger = null;
  let t = 0;
  for (; t < takte; t++) {
    if (t % (5 * TAKTE_PRO_SEKUNDE) === 0) nachsetzen(welt);
    welt.takten();
    const befunde = pruefen(welt);
    if (befunde.length) throw new Widerspruch(startwert, welt.takt, befunde);
    if (spurFuehren) {
      let zahl = 0;
      for (const e of welt.einheiten.values()) zahl += e.id * 7 + e.leben * 13 + Math.round(e.x * 100) + Math.round(e.y * 100) * 3;
      spur.push(zahl);
    }
    const uebrigLinks = lebende('links');
    const uebrigRechts = lebende('rechts');
    if (!uebrigLinks || !uebrigRechts) {
      sieger = uebrigLinks ? 'links' : (uebrigRechts ? 'rechts' : null);
      break;
    }
  }
  return {
    startwert,
    sieger,
    takte: t + 1,
    spur,
    links: { art: links, anzahl: seiten[0].anzahl, uebrig: lebende('links') },
    rechts: { art: rechts, anzahl: seiten[1].anzahl, uebrig: lebende('rechts') },
    welt,
  };
}

module.exports = { partieSpielen, gefechtSpielen, kostenSumme, pruefen, Widerspruch };
