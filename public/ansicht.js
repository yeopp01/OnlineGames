// Zeichnet die Welt und nimmt Maus und Tastatur entgegen. Rechnen tut hier
// nichts - der Server schickt den Zustand, wir malen ihn.
//
// Isometrisch (→ specs/10-strategie/darstellung.md AC-1): ein Feld ist eine
// Raute, doppelt so breit wie hoch. Die Welt rechnet weiter in Feldern
// (x nach rechts unten, y nach links unten); nur zuBild und zuWelt kennen die
// Raute. Die Kamera liegt in Bildpunkten der Raute bei Vergroesserung 1.
import { FIGUREN, figurBildZeichnen } from './figuren.js';
import { GEBAEUDE, gebaeudeBildZeichnen, gebaeudeGetroffen, gebaeudeHoehe, gebaeudeSchattenZeichnen } from './gebaeude.js';
import { bilderBereit, bilderWarten, gerendert, richtungAus } from './bilder.js';
import { KACHEL, kachelMassstab, kachelZeichnen } from './boden.js';
import { Nebel } from './nebel.js';
import {
  BEERE, DINGE, GOLD, GRAS, STEIN, WALD, WASSER, dingBildZeichnen, grasBeginnen, grasSammeln, grasZeichnen, raute, wellenZeichnen,
} from './gelaende.js';

const HALB_B = 22; // halbe Rautenbreite in Bildpunkten bei Vergroesserung 1
const HALB_H = 11; // halbe Rautenhoehe
// Eine Figur ist etwas hoeher als eine Raute breit ist; ihr Koerper liegt ueber
// dem Fusspunkt, deshalb zielt ein Klick auf die Mitte des Koerpers.
const FIGUR_HOEHE = 1.3; // in halben Rautenbreiten * 2
// Der Blick zum Start (darstellung AC-16): ein Dorfbewohner mindestens 40
// Bildpunkte hoch, wie im Original (dort rund 45 bei 1080 Zeilen, ein Feld 96
// Bildpunkte breit). Bei Zoom 1 waren es 28,6 und ein Feld 44 breit - das
// ganze Bild hatte kaum die halbe Groesse, und die Figuren waren Striche
// (Rueckschau nach Runde 88). Zoom 1 bleibt der feste Massstab, an dem die
// Kriterien zur Unterscheidbarkeit gemessen werden; das Rad holt weiter bis
// 0,4 heraus.
export const STARTZOOM = 1.5;
const KOERPER_MITTE = 0.6; // Anteil der Figurenhoehe ueber dem Fusspunkt, auf den ein Klick zielt
const KLICK_WEITE = 16; // Bildpunkte bei Vergroesserung 1
// Wie lange das Zeichen am Ziel steht (bedienung AC-34). Kurz genug, dass es
// nicht im Weg ist, lang genug, dass man es bei einem Klick bemerkt.
const ZIELZEICHEN_DAUER = 800; // Millisekunden
const RAND_SCHIEBEN = 12; // Bildpunkte am Fensterrand, in denen die Maus die Karte schiebt (bedienung AC-9)
const KOPFLEISTE = 58; // Bildpunkte oben, ueber denen Rohstoffe, Uhr und Knoepfe liegen
// Die acht Nachbarn eines Feldes: gerade zuerst, dann schraeg.
const RINGSUM = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
// Was ein Rechtsklick taete, in Worten am Zeiger (bedienung AC-52).
const ZIELTEXT = {
  angreifen: 'Angreifen', bekehren: 'Bekehren', schlachten: 'Schlachten', fleisch: 'Fleisch holen', bauen: 'Mitbauen',
  farm: 'Farm bestellen', abladen: 'Abladen', handeln: 'Handeln',
};
const SAMMELTEXT = { [WALD]: 'Holz hacken', [BEERE]: 'Beeren sammeln', [GOLD]: 'Gold abbauen', [STEIN]: 'Stein abbauen' };
// Die Ladung kommt als erster Buchstabe ihres Rohstoffs (`a` an der Einheit).
const LADUNGSART = { h: 'holz', n: 'nahrung', g: 'gold', s: 'stein' };
const ARBEITSFARBE = '#f2c14e'; // Zeichen fuer Arbeit: weder Gang (weiss) noch Angriff (rot)

// Die gemerkte Wahl zum Schieben am Rand; ohne Speicher (privates Fenster) "an".
export function randSchiebenGemerkt() {
  try {
    return localStorage.getItem('randSchieben') !== 'aus';
  } catch {
    return true;
  }
}

/** Hoehe einer Figur in Bildpunkten bei einem Zoom - auch fuer die Schautafel. */
export function figurHoeheBei(zoom) {
  return Math.max(12, HALB_B * FIGUR_HOEHE * zoom);
}

/** Dasselbe fuer ein Tier: es ist niedriger als ein Mensch. */
export function tierHoeheBei(zoom) {
  return Math.max(9, HALB_B * 0.9 * zoom);
}

// Wie weit das Rad heraus- und heranholt. Naeher als ZOOM_NAH steht im Spiel
// nichts im Bild - so gross zeigt die Schautafel jedes Stueck.
export const ZOOM_FERN = 0.4;
export const ZOOM_NAH = 2.5;

// Schrittphase fuer die Beine: laeuft mit der Uhr, je Einheit versetzt, damit
// eine Gruppe nicht im Gleichschritt marschiert.

// Angehalten (speichern AC-19) steht die Uhr der Bilder: wer geht oder
// arbeitet, tritt sonst auf der Stelle weiter.
let halt = null;

function jetztPhase(id) {
  return (halt ?? performance.now()) / 110 + id * 1.7;
}

// Wann im Umlauf eines Schlags man ihn hoert (bedienung AC-62): in den Tafeln
// `arbeiten` und `angreifen` ist das Werkzeug ab dem fuenften von acht
// Bildern unten.
const SCHLAG_PHASE = 0.45;

// Wie lange eine gerenderte Figur faellt, bei Spielgeschwindigkeit 1,0. Am
// Boden liegt sie zwei Spielsekunden (kampf AC-10) - gut die Haelfte davon.
const STERBEN_MS = 850;

export class Ansicht {
  constructor(leinwand, befehlSenden) {
    this.leinwand = leinwand;
    this.stift = leinwand.getContext('2d');
    this.befehlSenden = befehlSenden;

    this.karte = null;
    this.fuellung = new Map(); // Feld → Viertel des Vorrats, der noch da ist (1 bis 4)
    this.spieler = new Map();
    this.ich = null;
    this.taktdauer = 100;
    // Takte des Servers und wie viele davon auf eine Spielsekunde gehen -
    // daraus die Spielzeit im Bild (bedienung AC-37).
    this.takt = 0;
    this.takteProSekunde = 10;

    this.vorher = new Map();
    this.nachher = new Map();
    // Pfeile im Flug (bedienung AC-40).
    this.pfeile = [];
    this.empfangen = 0;
    this.ausgewaehlt = new Set();
    // Abgelegte Auswahlen je Ziffer (bedienung AC-5): Einheiten oder ein Gebaeude.
    this.gruppen = new Map();
    this.gebaeude = new Map();
    this.werte = { einheiten: {}, gebaeude: {} };
    this.arten = {};
    // Die Werte je Spieler, wie der Server sie rechnet - mit allen
    // Verbesserungen (bedienung AC-35). Map Spieler -> { art -> Werte }. Der
    // Browser rechnet sie nicht selbst nach: `welt.einheitenwert()` ist die
    // eine Stelle.
    this.einheitenwerte = new Map();
    this.gewaehltesGebaeude = null; // id; entweder Einheiten oder ein Gebaeude
    // Etwas Fremdes, das nur angesehen wird (bedienung AC-58): { e: id } oder
    // { g: id }. Es steht nicht in der Auswahl - befohlen wird ihm nichts.
    this.angesehen = null;
    // Das Zeichen am Ziel eines Befehls (bedienung AC-34): rot auf Feindliches,
    // weiss auf freies Gelaende. { x, y, feindlich, seit }.
    this.zielzeichen = null;
    // Einheit -> die geklickten Ziele ihres Gangs, fuer die Linie der Reihe
    // (bedienung AC-14). Wie viele davon noch warten, sagt der Server (`q`).
    this.wegpunkte = new Map();
    // Der Angriffslauf (kampf AC-4) ist eine Betriebsart: G schaltet sie ein,
    // der naechste Rechtsklick fuehrt sie aus und schaltet sie wieder aus.
    this.angriffslauf = false;
    this.beiAuswahl = () => {};
    // Nach jedem Bild und bei geaenderten Feldern - fuer die Uebersichtskarte (bedienung AC-11).
    this.nachBild = () => {};
    this.beiTaste = () => false;
    this.beiFeldern = () => {};
    // Die Tafel auf `Tab` (bedienung AC-20): je Spieler, was zuletzt ankam,
    // und ob sie gerade offen ist - app.js zeichnet sie.
    this.stand = new Map();
    this.spielstandOffen = false;
    this.beiSpielstand = () => {};
    // Die eigenen untaetigen Dorfbewohner, wie der Server sie meldet (einheiten AC-21).
    this.untaetige = [];
    this.letzterUntaetiger = null;
    this.arbeiter = { holz: 0, nahrung: 0, gold: 0, stein: 0 };
    // Platzieren eines Gebaeudes (bauen AC-4): welche Art, und wo der Zeiger ist.
    this.platzieren = null;
    this.zeiger = null;
    // Steht der Zeiger ueber dem Spielbild - und was ein Rechtsklick dort
    // taete (bedienung AC-52). Jedes Bild neu bestimmt.
    this.zeigerDrin = false;
    this.zeigerZiel = null;
    // Schieben am Bildschirmrand (bedienung AC-9): wo die Maus im Spielbild
    // steht (null, sobald sie es verlaesst), und ob es an ist. Die Wahl merkt
    // sich der Browser, ohne ihn gilt die Vorgabe "an".
    this.randZeiger = null;
    this.randSchieben = randSchiebenGemerkt();
    this.bauenSenden = () => {};
    this.mauerSenden = () => {};
    this.sammelpunktSenden = () => {};
    this.verbesserungen = [];
    // Das eigene Zeitalter als Stufe, 0 ist die Dunkle Zeit (bedienung AC-33).
    this.zeitalter = 0;
    // Kurz eingeblendete Absagen (bedienung AC-18); app.js setzt die Anzeige.
    this.melden = () => {};
    // Der Aufstieg ist vollzogen: app.js kuendigt ihn im Bild an (bedienung AC-33).
    this.beiZeitalter = () => {};
    // Ein Angriff auf den eigenen Spieler (kampf AC-14), mit Ort.
    this.beiAngriff = () => {};
    // Was eben geschehen ist, beim Namen (bedienung AC-59): 'einheit',
    // 'gebaeude', 'forschung', 'gefallen'. Was daraus klingt, weiss app.js -
    // die Ansicht kennt keinen Ton.
    this.beiEreignis = () => {};
    // Erst ab dem zweiten Zustand nach einem Aufbau wird gemeldet: der erste
    // vergleicht mit nichts, und wer zurueckkehrt, hoerte sonst alles auf
    // einmal, was laengst fertig ist.
    this.eingespielt = false;
    this.meldet = false;
    // Das Ende der Partie, wie der Server es schickt (spielziel AC-5), und
    // die Meldung dazu. `beiEnde` laeuft genau einmal - der Raum haelt danach
    // seine Uhr an, aber ein zurueckkehrender Spieler bekommt es im Aufbau.
    this.ende = null;
    this.beiEnde = () => {};
    // Bin ich ausgeschieden? Der Server sagt es in jedem Zustand; der
    // Aufgeben-Knopf haengt daran (bedienung AC-38).
    this.aus = false;
    this.blicke = new Map(); // Einheit → -1 links, 1 rechts
    this.richtungen = new Map(); // Einheit → 0 bis 7, fuer gerenderte Figuren (ADR-0016)
    this.gefallen = new Map(); // Einheit → wann das Bild sie zum ersten Mal gefallen sah
    this.schlagblicke = new Map(); // Einheit → wann zuletzt nach ihrem Gegner gesucht wurde
    this.schlaege = new Map(); // Einheit → der wievielte Schlag zuletzt zu hoeren war (bedienung AC-62)
    this.tiere = new Map();
    this.vorraete = { holz: 0, nahrung: 0, gold: 0, stein: 0, bev: 0, raum: 0 };
    // Was im letzten Bild in welcher Reihenfolge gezeichnet wurde - fuer den
    // Browserlauf (darstellung AC-7).
    this.reihenfolge = [];

    this.kamera = { x: 0, y: 0, zoom: STARTZOOM };
    this.tasten = new Set();
    this.zug = null; // laufender Auswahlrahmen
    this.laeuft = false;

    this.binden();
  }

  aufbau(nachricht, ichId) {
    this.eingespielt = false;
    const roh = atob(nachricht.karte.felder);
    const felder = new Uint8Array(roh.length);
    for (let i = 0; i < roh.length; i++) felder[i] = roh.charCodeAt(i);

    // Ein Aufbau kann der zweite sein: die Revanche startet dieselbe Runde neu
    // (spielziel AC-9), und dann kommt alles frisch. Was von der alten Partie
    // stehenblieb, waere ein Gespenst - die **Kacheln des Bodens** allen voran:
    // sie liegen nach Feldkoordinate im Zwischenspeicher, und auf einer neuen
    // Karte zeigten sie das alte Gelaende.
    this.kacheln = null;
    this.vorher = new Map();
    this.nachher = new Map();
    this.empfangen = 0;
    this.ausgewaehlt = new Set();
    this.gruppen = new Map();
    // Der letzte Sprung mit der Leertaste (bedienung AC-10): woher, wohin.
    this.sprung = null;
    this.gewaehltesGebaeude = null;
    this.zielzeichen = null;
    // Einheit -> die geklickten Ziele ihres Gangs, fuer die Linie der Reihe
    // (bedienung AC-14). Wie viele davon noch warten, sagt der Server (`q`).
    this.wegpunkte = new Map();
    this.angriffslauf = false;
    this.platzieren = null;
    this.untaetige = [];
    this.letzterUntaetiger = null;
    this.arbeiter = { holz: 0, nahrung: 0, gold: 0, stein: 0 };
    this.verbesserungen = [];
    this.blicke = new Map();
    this.richtungen = new Map();
    this.gefallen = new Map();
    this.schlagblicke = new Map();
    this.schlaege = new Map();
    this.pfeile = [];
    this.takt = 0;
    // Null, nicht der alte Stand: sonst meldete der erste Zustand der neuen
    // Partie einen Zeitalterwechsel zurueck in die Dunkle Zeit.
    this.zeitalter = 0;
    this.ende = null;
    this.aus = false;
    // Geloeste Buendnisse (spielziel AC-21, AC-24): wer -> Takt des
    // Fristendes. Ob ein Buendnis ueberhaupt geloest werden kann, sagt die
    // Einstellung der Partie.
    this.kuendigungen = new Map();
    this.buendnisse = nachricht.buendnisse === 'fest' ? 'fest' : 'loesbar';

    this.karte = { groesse: nachricht.karte.groesse, felder };
    // Der Nebel beginnt fuer jede Partie neu: nichts ist erkundet (kampf AC-12).
    // Die Sicht als Einstellung der Partie (kampf AC-16): bei "erkundet"
    // ist die Karte von Anfang an bekannt, bei "aufgedeckt" gibt es keinen Nebel.
    this.sichtArt = nachricht.sicht || 'nebel';
    // Die Zeitgrenze in Spielminuten oder null (spielziel AC-22).
    this.zeitgrenze = Number.isInteger(nachricht.zeitgrenze) && nachricht.zeitgrenze > 0 ? nachricht.zeitgrenze : null;
    this.nebel = new Nebel(nachricht.karte.groesse, this.sichtArt === 'erkundet');
    // Fremde Gebaeude, wie man sie zuletzt gesehen hat (kampf AC-12).
    this.erinnert = new Map();
    this.fuellung = new Map();
    // Ein Takt dauert in echter Zeit 1000 / (takte * tempo) ms: bei
    // schnellerem Spiel kommen die Zustaende oefter, und die Bewegung
    // dazwischen wird kuerzer gestreckt (spielziel AC-23). Die Uhr im Bild
    // zaehlt weiter Spielzeit - dafuer bleibt `takteProSekunde` die Zahl je
    // Spielsekunde.
    this.tempo = Number.isFinite(nachricht.tempo) && nachricht.tempo > 0 ? nachricht.tempo : 1;
    this.taktdauer = 1000 / (nachricht.takte * this.tempo);
    this.takteProSekunde = nachricht.takte;
    // Das Muster des Bodens haengt am Startwert: jede Karte ihr eigenes.
    // Die Werte der Arten kommen einmal mit dem Aufbau (bedienung AC-29); die
    // Art einer Einheit kommt danach nur als Kuerzel.
    this.werte = nachricht.werte || { einheiten: {}, gebaeude: {} };
    this.arten = Object.fromEntries(Object.entries(this.werte.einheiten).map(([art, w]) => [w.kuerzel, art]));
    this.salz = Number.isInteger(nachricht.startwert) ? nachricht.startwert % 65521 : 0;
    this.ich = ichId;
    this.spieler = new Map(nachricht.spieler.map((s) => [s.id, s]));
    this.einheitenwerte = new Map(nachricht.spieler.filter((s) => s.kw).map((s) => [s.id, s.kw]));
    // Die eigenen Marktpreise (bauen AC-33): `{ ware: [kauf, verkauf] }`.
    this.handelspreise = nachricht.spieler.find((s) => s.id === this.ich)?.hp || null;
    // Tiere kommen einmal im Aufbau und danach nur bei Aenderung.
    this.tiere = new Map((nachricht.tiere || []).map((t) => [t.i, t]));
    // Gebaeude ebenso: einmal ganz, danach nur, was sich aendert.
    this.gebaeude = new Map((nachricht.gebaeude || []).map((g) => [g.i, g]));

    const meine = this.spieler.get(ichId);
    if (meine) this.blickAuf(meine.basis.x, meine.basis.y);
    this.ausMerken(nachricht.spieler);
    this.stand = new Map();
    this.standMerken(nachricht.spieler);
    // Wer nach dem Ende zurueckkommt, sieht es sofort (spielziel AC-5).
    if (nachricht.ende) this.endeMerken(nachricht.ende);
    if (Number.isInteger(nachricht.t)) this.takt = nachricht.t;
    this.kuendigungenMerken(nachricht.bu);

    // Die Uebersichtskarte malt ihr Gelaende einmal und danach nur bei
    // geaenderten Feldern - eine neue Karte ist die groesste Aenderung, die es
    // gibt (spielziel AC-9).
    this.beiFeldern();
    this.groesseAnpassen();
    if (!this.laeuft && !this.beginnt) {
      this.beginnt = true;
      requestAnimationFrame(() => this.bild());
      // "Laeuft" heisst: die Partie steht im Bild - mit ihren Bildern
      // (darstellung AC-24). Bis dahin zeigt bild() den Ladesatz. Danach die
      // Leiste noch einmal: ihre Knopfbilder kommen aus denselben Tafeln.
      bilderWarten().then(() => {
        this.laeuft = true;
        this.beiAuswahl();
      });
    }
  }

  /** Ein Ereignis beim Namen nennen (bedienung AC-59) - nicht im ersten Zustand nach dem Aufbau. */
  ereignis(name) {
    if (this.meldet) this.beiEreignis(name);
  }

  /**
   * Ein Geraeusch an einem Ort der Karte (bedienung AC-62): ein Pfeil, ein
   * Einschlag, ein Gebaeude, das faellt. Zu hoeren ist nur, was im Bild steht.
   */
  geraeusch(name, wx, wy) {
    this.klangAn(name, this.zuBild(wx, wy));
  }

  /**
   * Ein Geraeusch an einem Punkt des Bildes: ausserhalb des Fensters still,
   * am Rand leiser als in der Mitte, weit herausgezoomt leiser als nah - und
   * auf der Seite, auf der es geschieht.
   */
  klangAn(name, punkt) {
    if (!this.meldet || !this.laeuft) return;
    const breite = this.leinwand.clientWidth;
    const hoch = this.leinwand.clientHeight;
    if (!breite || !hoch) return;
    const rand = 60;
    if (punkt.x < -rand || punkt.x > breite + rand || punkt.y < -rand || punkt.y > hoch + rand) return;
    const naehe = Math.min(1, 0.45 + this.kamera.zoom * 0.4);
    const abseits = Math.min(1, Math.hypot(punkt.x / breite - 0.5, punkt.y / hoch - 0.5) * 2);
    this.beiEreignis(name, {
      laut: naehe * (1 - 0.35 * abseits),
      seite: Math.max(-1, Math.min(1, (punkt.x / breite) * 2 - 1)) * 0.8,
    });
  }

  /**
   * Wer schlaegt, ist zu hoeren (bedienung AC-62) - im Takt seines Bildes:
   * einmal je Umlauf, wenn Axt, Hammer oder Schwert unten ist. Der Server
   * meldet Schlaege im Nahkampf nicht einzeln, und er muss es nicht: was
   * klingt, soll zu dem passen, was man sieht.
   */
  schlagHoeren(einheit, punkt) {
    if (halt !== null) return;
    const nummer = Math.floor(jetztPhase(einheit.i) / (Math.PI * 2) - SCHLAG_PHASE);
    const zuletzt = this.schlaege.get(einheit.i);
    if (this.schlaege.size > 800) this.schlaege.clear();
    this.schlaege.set(einheit.i, nummer);
    // Nur der Schlag, der auf den vorigen folgt: wer eben erst anfaengt,
    // steht noch irgendwo im Umlauf.
    if (zuletzt !== nummer - 1) return;
    const art = this.arten[einheit.k] || 'dorfbewohner';
    const werte = this.werte.einheiten[art] || {};
    if (art === 'dorfbewohner') {
      // Der Zustand sagt nicht, was er tut - nur dass. Wer an einer
      // Baustelle steht, haemmert; sonst entscheidet, was er traegt.
      if (this.anBaustelle(einheit)) this.klangAn('hammer', punkt);
      else if (einheit.a === 'h') this.klangAn('hacken', punkt);
      else if (einheit.a === 'g' || einheit.a === 's') this.klangAn('pickel', punkt);
      return;
    }
    // Wer nicht angreift (der Moench), ist still; wer schiesst oder wirft,
    // ist am Geschoss zu hoeren.
    if (!werte.angriff || werte.reichweite > 0) return;
    if (werte.nurGebaeude) this.klangAn('treffer', punkt);
    // Nicht jeder Hieb trifft Eisen: jeder dritte geht ins Leere oder aufs Holz.
    else if ((nummer + einheit.i) % 3 === 0) this.klangAn('hieb', punkt);
    else this.klangAn('schwert', punkt);
  }

  /** Steht die Einheit an einer Baustelle, die sie bauen kann? */
  anBaustelle(einheit) {
    const team = this.teamVon(einheit.b);
    for (const gebaeude of this.gebaeude.values()) {
      if ((gebaeude.u ?? 1) >= 1) continue;
      if (gebaeude.b !== einheit.b && (!team || team !== this.teamVon(gebaeude.b))) continue;
      const mitte = this.gebaeudeMitte(gebaeude);
      if (Math.max(Math.abs(mitte.x - einheit.x), Math.abs(mitte.y - einheit.y)) <= mitte.groesse / 2 + 1.6) return true;
    }
    return false;
  }

  zustand(nachricht) {
    this.meldet = this.eingespielt;
    this.eingespielt = true;
    // Pfeile (bedienung AC-40): jeder fliegt vom Schuetzen zum Ziel, so lange,
    // wie er bei sieben Feldern je Sekunde braucht - mindestens 0,15 Sekunden.
    // Mit zehn war ein Schuss ueber vier Felder 0,4 s unterwegs, kaum zu
    // sehen und im vollen Browserlauf nicht zu fotografieren (Runde 122).
    const jetzt = performance.now();
    // Angekommene fallen auch hier heraus, nicht nur beim Zeichnen: in einem
    // Tab im Hintergrund wird nicht gezeichnet, und die Liste wuechse.
    this.pfeile = this.pfeile.filter((p) => jetzt - p.start < p.dauer);
    // Ein fuenfter Wert 1 ist ein Stein des Mangonels (kampf AC-19). Er fliegt
    // ebenso sieben Felder je Sekunde - so lange, wie der Server ihn rechnet
    // (`geschoss` in den Daten) -, nur in hoeherem Bogen.
    for (const [x0, y0, x1, y1, stein] of nachricht.p || []) {
      const weite = Math.hypot(x1 - x0, y1 - y0);
      // Ein Turm schiesst von oben (bauen AC-29): der Server schickt die Mitte
      // seiner Grundflaeche, die Hoehe kennt nur die Zeichnung.
      const oben = this.schussHoeheBei(x0, y0);
      const dauer = Math.max(150, (weite / 7) * 1000);
      this.pfeile.push({
        x0, y0, x1, y1, weite, oben, stein: stein === 1, start: jetzt, dauer,
      });
      // Zu hoeren (bedienung AC-62): die Sehne beim Schuetzen, der Wurfarm
      // beim Mangonel - und der Stein dort, wo er herunterkommt.
      if (stein === 1) {
        this.geraeusch('wurf', x0, y0);
        setTimeout(() => this.geraeusch('einschlag', x1, y1), dauer);
      } else {
        this.geraeusch('pfeil', x0, y0);
      }
    }
    for (const aenderung of nachricht.felder || []) {
      if (this.karte.felder[aenderung.i] !== aenderung.a) {
        this.kachelnVerwerfen(aenderung.i);
        this.beiFeldern();
      }
      this.karte.felder[aenderung.i] = aenderung.a;
      if (aenderung.v !== undefined) this.fuellung.set(aenderung.i, aenderung.v);
      else this.fuellung.delete(aenderung.i);
    }
    for (const tier of nachricht.tiere || []) {
      if (tier.weg) this.tiere.delete(tier.i);
      else {
        const alt = this.tiere.get(tier.i);
        // Die vorige Lage, damit ein getriebenes Schaf weich laeuft.
        if (alt) {
          tier.vx = alt.x;
          tier.vy = alt.y;
          tier.seit = performance.now();
          // Wohin es schaut, fuer die gerenderten Bilder (ADR-0016): dorthin,
          // wohin es zuletzt lief.
          const dx = tier.x - alt.x;
          const dy = tier.y - alt.y;
          tier.richtung = Math.hypot(dx, dy) > 0.001 ? richtungAus(dx - dy, (dx + dy) / 2) : alt.richtung;
        }
        this.tiere.set(tier.i, tier);
      }
    }
    for (const gebaeude of nachricht.gebaeude || []) {
      if (gebaeude.weg) {
        // Es faellt (bedienung AC-62) - zu hoeren, wenn es vorher getroffen
        // war: ein abgesagter Bau und eine abgeerntete Farm stuerzen nicht ein.
        const alt = this.gebaeude.get(gebaeude.i);
        if (alt && alt.h !== undefined) {
          const mitte = this.gebaeudeMitte(alt);
          this.geraeusch('einsturz', mitte.x, mitte.y);
        }
        this.gebaeude.delete(gebaeude.i);
      } else {
        // Eben fertig geworden (bedienung AC-59): vorher im Bau, jetzt nicht mehr.
        const alt = this.gebaeude.get(gebaeude.i);
        if (gebaeude.b === this.ich && alt && (alt.u ?? 1) < 1 && (gebaeude.u ?? 1) >= 1) this.ereignis('gebaeude');
        // Getroffen (bedienung AC-62): es hat weniger Leben als eben noch.
        if (alt && gebaeude.h !== undefined && gebaeude.h < (alt.h ?? Infinity) && (gebaeude.u ?? 1) >= (alt.u ?? 1)) {
          const mitte = this.gebaeudeMitte(gebaeude);
          this.geraeusch('treffer', mitte.x, mitte.y);
        }
        this.gebaeude.set(gebaeude.i, gebaeude);
      }
    }
    this.vorher = this.nachher;
    this.nachher = new Map(nachricht.einheiten.map((e) => [e.i, e]));
    // Eine eigene Einheit ist neu, eine eigene ist gefallen (bedienung AC-59).
    // Eine bekehrte gab es schon - sie ist keine neue.
    for (const einheit of this.nachher.values()) {
      if (einheit.b !== this.ich) continue;
      const alt = this.vorher.get(einheit.i);
      if (!alt && !einheit.s) this.ereignis('einheit');
      else if (alt && einheit.s && !alt.s) this.ereignis('gefallen');
    }
    this.empfangen = performance.now();
    // Die Spielzeit zaehlt die Takte des Servers (bedienung AC-37) - im
    // Zeitraffer kommen sie schneller, und genau so soll die Uhr laufen.
    if (Number.isInteger(nachricht.t)) this.takt = nachricht.t;

    // Geaenderte Werte eines Spielers kommen nur, wenn er etwas erforscht hat.
    for (const s of nachricht.spieler) if (s.kw) this.einheitenwerte.set(s.id, s.kw);
    this.kuendigungenMerken(nachricht.bu);

    this.ausMerken(nachricht.spieler);
    this.standMerken(nachricht.spieler);
    const meine = nachricht.spieler.find((s) => s.id === this.ich);
    if (meine) {
      const { holz, nahrung, gold, stein, bev, raum } = meine;
      this.vorraete = { holz, nahrung, gold, stein, bev, raum };
      // Eine Verbesserung ist erforscht (bedienung AC-59).
      if ((meine.v || []).length > this.verbesserungen.length) this.ereignis('forschung');
      this.verbesserungen = meine.v || [];
      // Nach einem Handel die neuen Preise (bauen AC-33).
      if (meine.hp) this.handelspreise = meine.hp;
      // Ein Aufstieg wird einmal gemeldet - erkannt an der Stufe, die der
      // Server schickt (bedienung AC-33).
      const stufe = meine.z || 0;
      if (stufe !== this.zeitalter) {
        const vorher = this.zeitalter;
        this.zeitalter = stufe;
        if (stufe > vorher) this.beiZeitalter(stufe, this.zeitalterName(stufe));
      }
      this.untaetige = meine.u || [];
      // Ein Angriff (kampf AC-14): app.js zeigt den Knopf, der hinspringt.
      if (meine.m) this.beiAngriff({ x: meine.m[0], y: meine.m[1] });
      // Arbeiter je Rohstoff (bedienung AC-32), in der Reihenfolge des Servers.
      const [amHolz, anNahrung, amGold, amStein] = meine.a || [0, 0, 0, 0];
      this.arbeiter = { holz: amHolz, nahrung: anNahrung, gold: amGold, stein: amStein };
    }

    // Eingesammelte Einheiten, die es nicht mehr gibt, fallen aus der Auswahl.
    for (const id of this.ausgewaehlt) {
      const tier = this.tiere.get(id);
      // Ein Schaf bleibt gewaehlt, solange es lebt und uns gehoert; eine
      // gefallene Einheit faellt sofort heraus, auch wenn sie noch liegt
      // (kampf AC-10).
      const einheit = this.nachher.get(id);
      if (tier ? (tier.g || tier.b !== this.ich) : (!einheit || einheit.s)) this.ausgewaehlt.delete(id);
    }
    if (this.gewaehltesGebaeude && !this.gebaeude.has(this.gewaehltesGebaeude)) this.gewaehltesGebaeude = null;

    // Die eigene Sicht zweimal je Sekunde neu, beim ersten Zustand sofort
    // (kampf AC-11): vorher gab es keine eigenen Einheiten.
    if (this.nebel && this.nebel.rechnen(this, this.nebel.takt === -Infinity)) this.erinnern();

    // Zuletzt, damit die Meldung auf dem letzten Stand sitzt: das Ende kommt
    // im selben Zustand wie der letzte Verlust (spielziel AC-5).
    if (nachricht.ende) this.endeMerken(nachricht.ende);
  }

  /**
   * Gilt der Nebel? Nicht fuer den, der ausgeschieden ist und zusieht
   * (spielziel AC-7), und nicht nach dem Ende - dann sehen alle alles.
   */
  get nebelAn() {
    return Boolean(this.nebel) && !this.aus && !this.ende && this.sichtArt !== 'aufgedeckt';
  }

  /**
   * Was man von fremden Gebaeuden weiss (kampf AC-12): was man gerade sieht,
   * so wie es ist; was im Nebel liegt, so wie man es zuletzt gesehen hat -
   * auch wenn es inzwischen gefallen ist. Ein Gebaeude, das im Nebel neu
   * entstand, kennt man nicht. Wird ein erinnertes Gebaeude wieder gesehen und
   * steht dort nicht mehr, ist es vergessen.
   */
  erinnern() {
    for (const b of this.gebaeude.values()) {
      // Verbuendete erinnert man nicht: man sieht sie (spielziel AC-19) -
      // ausser waehrend der Frist einer Kuendigung (AC-24).
      if (this.teiltSicht(b.b)) continue;
      if (this.siehtGebaeude(b)) this.erinnert.set(b.i, { ...b });
    }
    for (const [id, b] of this.erinnert) {
      if (!this.gebaeude.has(id) && this.siehtGebaeude(b)) this.erinnert.delete(id);
    }
  }

  /**
   * Sieht man ein Feld der Grundflaeche? Dieselbe Regel wie auf dem Server
   * (`welt.siehtGebaeude`): er schickt ein Gebaeude, sobald ein Feld davon in
   * Sicht ist. Zaehlte hier nur die Mitte, kennte der Browser ein
   * Dorfzentrum, an dessen Rand der Spaeher steht, und zeichnete es nicht -
   * der Spaeher dahinter waere ein Umriss vor leerem Schwarz (Rueckmeldung
   * des Benutzers, 2026-11-12).
   */
  siehtGebaeude(gebaeude) {
    const n = this.werte.gebaeude[gebaeude.art]?.groesse || 1;
    const x0 = gebaeude.x - Math.floor(n / 2);
    const y0 = gebaeude.y - Math.floor(n / 2);
    for (let y = y0; y < y0 + n; y++) for (let x = x0; x < x0 + n; x++) if (this.nebel.sieht(x, y)) return true;
    return false;
  }

  /**
   * Die Gebaeude, die gezeichnet werden: die eigenen, und von den fremden,
   * was man sieht oder erinnert. Ohne Nebel alle, wie sie sind.
   */
  gezeigteGebaeude() {
    if (!this.nebelAn) return [...this.gebaeude.values()];
    const liste = [];
    for (const b of this.gebaeude.values()) {
      if (this.teiltSicht(b.b)) liste.push(b);
      else if (this.siehtGebaeude(b)) liste.push(b);
    }
    for (const [id, b] of this.erinnert) {
      const jetzt = this.gebaeude.get(id);
      if (jetzt && this.siehtGebaeude(jetzt)) continue;
      liste.push(b);
    }
    return liste;
  }

  // Ist eine fremde Einheit an dieser Stelle zu sehen? Eigene und die der
  // Verbuendeten immer (spielziel AC-19), ausser waehrend der Frist einer
  // Kuendigung (AC-24).
  zuSehen(besitzer, x, y) {
    return this.teiltSicht(besitzer) || !this.nebelAn || this.nebel.sieht(x, y);
  }

  /**
   * Der Nebel ueber dem Bild (darstellung AC-15): ein Bildpunkt je Feld, mit
   * derselben Abbildung wie `zuBild` gestreckt - x' = (wx - wy) * HALB_B,
   * y' = (wx + wy) * HALB_H, beides mal Zoom und um die Kamera verschoben.
   */
  nebelZeichnen(stift) {
    const z = this.kamera.zoom;
    stift.save();
    stift.transform(HALB_B * z, HALB_H * z, -HALB_B * z, HALB_H * z, -this.kamera.x * z, -this.kamera.y * z);
    stift.imageSmoothingEnabled = true;
    // Das Bild hat einen Rand von einem Feld (nebel.js).
    stift.drawImage(this.nebel.bild, -1.5, -1.5, this.karte.groesse + 2, this.karte.groesse + 2);
    stift.restore();
  }

  /**
   * Das Ende einmal melden (spielziel AC-5). Zweimal gemeldet wuerde es, wenn
   * nach dem letzten Zustand noch ein Aufbau kaeme - etwa nach einer
   * Rueckkehr.
   */
  /**
   * Ausgeschieden - und die Partie laeuft fuer die anderen weiter
   * (spielziel AC-7). Zwei Dinge geschehen genau einmal, beim Uebergang:
   * die Kamera geht zu einem, der noch spielt, und von da an steht die
   * Meldung im Bild (die setzt app.js bei jedem Zustand, damit sie auch
   * stimmt, wenn Ausscheiden und Partieende in denselben Takt fallen).
   *
   * Der Sprung ist kein Luxus: ohne ihn sieht der Zuschauer auf den leeren
   * Platz, wo eben sein Dorf stand - genau das, was das Kriterium verbietet.
   *
   * @param {{id: string, aus?: number}[]} liste die Spieler aus der Nachricht
   */
  // Je Spieler, was der Server zuletzt von ihm schickte (bedienung AC-20).
  // Der Server entscheidet, was das ist: von Gegnern im Nebel nur Zeitalter
  // und ob sie draussen sind (kampf AC-13) - der Browser rechnet nichts dazu.
  standMerken(liste) {
    for (const s of liste) {
      const vorraete = Number.isFinite(s.holz)
        ? { holz: s.holz, nahrung: s.nahrung, gold: s.gold, stein: s.stein, bev: s.bev, raum: s.raum }
        : null;
      // Die Punkte kommen von jedem, auch vom Gegner (bedienung AC-47).
      this.stand.set(s.id, { zeitalter: s.z || 0, aus: s.aus === 1, punkte: s.pk || 0, vorraete });
    }
  }

  /**
   * Die Zeilen der Tafel auf `Tab` (bedienung AC-20), in der Reihenfolge der
   * Spieler wie die Tafel am Ende. `vorraete` ist null, wo der Server sie
   * nicht schickt - bei Gegnern, solange der Nebel gilt.
   *
   * @returns {{id: string, name: string, farbe: string, ich: boolean,
   *   aus: boolean, punkte: number, zeitalter: string, vorraete: object|null}[]}
   */
  spielstandZeilen() {
    return [...this.spieler.values()].map((spieler) => {
      const stand = this.stand.get(spieler.id) || { zeitalter: 0, aus: false, punkte: 0, vorraete: null };
      return {
        id: spieler.id,
        name: spieler.name || 'Unbekannt',
        farbe: spieler.farbe || '#888888',
        ich: spieler.id === this.ich,
        aus: stand.aus,
        punkte: stand.punkte,
        zeitalter: this.zeitalterName(stand.zeitalter),
        vorraete: stand.vorraete,
      };
    });
  }

  spielstandSetzen(an) {
    if (this.spielstandOffen === an) return;
    this.spielstandOffen = an;
    this.beiSpielstand(an);
  }

  ausMerken(liste) {
    const jetzt = liste.find((s) => s.id === this.ich)?.aus === 1;
    const uebergang = jetzt && !this.aus;
    this.aus = jetzt;
    if (!uebergang) return;
    // Der erste, der noch spielt - die Reihenfolge der Liste ist die des
    // Servers, also bei allen dieselbe.
    const weiter = liste.find((s) => s.id !== this.ich && s.aus !== 1);
    const basis = weiter && this.spieler.get(weiter.id)?.basis;
    if (basis) this.blickAuf(basis.x, basis.y);
  }

  endeMerken(ende) {
    if (this.ende) return;
    this.ende = ende;
    this.beiEnde(ende, this.endeText());
  }

  /**
   * Was am Ende im Bild steht. Der Sieger kommt als Kennung vom Server, der
   * Name steht in der Spielerliste aus dem Aufbau - der Browser erfindet
   * nichts dazu.
   */
  endeText() {
    if (!this.ende) return '';
    const { gewinner = [], grund, team } = this.ende;
    if (!gewinner.length) return grund === 'zeit' ? `Unentschieden — ${this.zeitgrenze} Minuten sind um` : 'Unentschieden';
    const name = (id) => this.spieler.get(id)?.name || 'Ein Mitspieler';
    if (gewinner.length === 1) return gewinner[0] === this.ich ? 'Du hast gewonnen' : `${name(gewinner[0])} hat gewonnen`;
    // Ein Team (spielziel AC-20): sein Name und alle seine Spieler, auch die
    // ausgeschiedenen - sie haben mitgewonnen.
    const namen = gewinner.map(name);
    const liste = `${namen.slice(0, -1).join(', ')} und ${namen.at(-1)}`;
    if (gewinner.includes(this.ich)) return `Ihr habt gewonnen — Team ${team}: ${liste}`;
    return `Team ${team} hat gewonnen — ${liste}`;
  }

  /**
   * Die Tafel am Ende, fertig zum Anzeigen (spielziel AC-8). Die Zahlen
   * kommen vom Server, die Namen und Farben aus der Spielerliste des
   * Aufbaus - der Browser erfindet nichts dazu und rechnet nichts nach.
   *
   * Die Reihenfolge ist die der Spieler, nicht die des Ergebnisses: eine
   * Rangfolge waere eine Behauptung (woran gemessen?), und der Sieger steht
   * ohnehin in der Zeile darueber und ist in seiner Zeile gezeichnet.
   *
   * @returns {{id: string, name: string, farbe: string, sieger: boolean,
   *   aus: boolean, zeitalter: string, gesammelt: object,
   *   ausgebildet: number, verloren: number}[]}
   */
  abschlusszeilen() {
    if (!this.ende?.tafel) return [];
    return this.ende.tafel.map((zeile) => {
      const spieler = this.spieler.get(zeile.id);
      return {
        id: zeile.id,
        name: spieler?.name || 'Unbekannt',
        farbe: spieler?.farbe || '#888888',
        sieger: (this.ende.gewinner || []).includes(zeile.id),
        aus: zeile.aus === 1,
        zeitalter: this.zeitalterName(zeile.zeitalter || 0),
        gesammelt: zeile.gesammelt,
        ausgebildet: zeile.ausgebildet,
        verloren: zeile.verloren,
      };
    });
  }

  /**
   * Wie lange die Partie gedauert hat (spielziel AC-8) - gerechnet aus dem
   * Takt, in dem sie entschieden wurde, nicht aus dem letzten gesehenen:
   * beides ist dasselbe, solange nichts dazwischenkommt, aber der Takt des
   * Endes steht fuer jeden gleich, auch fuer einen, der spaeter zurueckkommt.
   */
  abschlussdauer() {
    if (!this.ende) return '';
    const sekunden = Math.floor(this.ende.takt / (this.takteProSekunde || 10));
    return `${Math.floor(sekunden / 60)}:${String(sekunden % 60).padStart(2, '0')}`;
  }

  /**
   * Die verstrichene Spielzeit als `m:ss` (bedienung AC-37). Gezaehlt werden
   * die Takte des Servers, nicht die Uhr des Browsers: wer den Zeitraffer
   * anstellt, soll die Uhr schneller laufen sehen, und wer nach einem Abbruch
   * zurueckkommt, soll die richtige Zeit sehen und nicht bei null anfangen.
   *
   * Die Minuten laufen ueber 60 hinaus (`90:00`), weil eine Partie nach 90
   * Spielminuten unentschieden endet und `1:30:00` die Frage "wie lange noch"
   * schwerer macht als `90:00`.
   */
  spielzeit() {
    const sekunden = Math.floor(this.takt / (this.takteProSekunde || 10));
    return `${Math.floor(sekunden / 60)}:${String(sekunden % 60).padStart(2, '0')}`;
  }

  // Name eines Zeitalters, wie der Server ihn mit dem Aufbau geschickt hat.
  zeitalterName(stufe = this.zeitalter) {
    return this.werte?.zeitalter?.[stufe]?.name || 'Landsitz';
  }

  // ---- Mauer und Tor aus Teilen (ADR-0016) ---------------------------------

  /**
   * Wo fertige Mauern (M) und Tore stehen (X laengs x, Y laengs y) - einmal
   * je Bild, aus dem, was gezeigt wird. Die gerenderte Mauer setzt sich danach
   * zusammen. Ein Tor steht laengs der Mauer, in der es sitzt.
   */
  mauernSammeln(gezeigt) {
    const felder = new Map();
    for (const g of gezeigt) {
      const werte = this.werte.gebaeude[g.art];
      if (!werte || (g.u ?? 1) < 1) continue;
      if (werte.tor) felder.set(`${g.x},${g.y}`, 'T');
      else if (werte.gezogen) felder.set(`${g.x},${g.y}`, 'M');
    }
    for (const [ort, zeichen] of felder) {
      if (zeichen !== 'T') continue;
      const [x, y] = ort.split(',').map(Number);
      const laengsX = felder.has(`${x - 1},${y}`) || felder.has(`${x + 1},${y}`);
      const laengsY = felder.has(`${x},${y - 1}`) || felder.has(`${x},${y + 1}`);
      felder.set(ort, !laengsX && laengsY ? 'Y' : 'X');
    }
    return felder;
  }

  /**
   * Was eine Mauer oder ein Tor zum Zeichnen wissen muss: die Mauer ihre
   * Nachbarn, das Tor seine Richtung. Alles andere: undefined. Ein Tor zaehlt
   * als Nachbar nur laengs seiner Achse, schraeg nur, wenn keines der zwei
   * Felder dazwischen Mauer ist - sonst liefe die Mauer doppelt ums Eck.
   */
  gebaeudeLage(gebaeude) {
    const felder = this.mauern;
    const zeichen = felder?.get(`${gebaeude.x},${gebaeude.y}`);
    if (!zeichen || (gebaeude.u ?? 1) < 1) return undefined;
    if (zeichen !== 'M') return { achse: zeichen === 'Y' ? 'y' : 'x' };
    const was = (x, y) => felder.get(`${x},${y}`);
    const { x, y } = gebaeude;
    const nachbarn = RINGSUM.filter(([dx, dy]) => {
      const z = was(x + dx, y + dy);
      if (!z) return false;
      if (z === 'X' && dy !== 0) return false;
      if (z === 'Y' && dx !== 0) return false;
      return !(dx && dy && (was(x + dx, y) || was(x, y + dy)));
    });
    return { nachbarn };
  }

  /**
   * Die Schlagschatten von Mauern und Toren: erst alle in eine Schicht, dann
   * die Schicht als Ganzes aufgelegt - unter allem, was steht.
   */
  mauerschatten(gezeigt, e) {
    if (!this.mauern.size) return;
    const breite = this.leinwand.clientWidth;
    const hoehe = this.leinwand.clientHeight;
    const dichte = window.devicePixelRatio || 1;
    if (!this.schattenschicht) this.schattenschicht = document.createElement('canvas');
    const schicht = this.schattenschicht;
    if (schicht.width !== Math.ceil(breite * dichte) || schicht.height !== Math.ceil(hoehe * dichte)) {
      schicht.width = Math.ceil(breite * dichte);
      schicht.height = Math.ceil(hoehe * dichte);
    }
    const s = schicht.getContext('2d');
    s.setTransform(dichte, 0, 0, dichte, 0, 0);
    s.clearRect(0, 0, breite, hoehe);
    let deckung = 0;
    for (const gebaeude of gezeigt) {
      const lage = this.gebaeudeLage(gebaeude);
      if (!lage) continue;
      const p = this.zuBild(gebaeude.x, gebaeude.y);
      if (p.x < -4 * e || p.x > breite + 4 * e || p.y < -4 * e || p.y > hoehe + 4 * e) continue;
      deckung = gebaeudeSchattenZeichnen(s, gebaeude.art, p.x, p.y, e, lage) || deckung;
    }
    if (!deckung) return;
    this.stift.save();
    this.stift.globalAlpha = deckung;
    this.stift.drawImage(schicht, 0, 0, breite, hoehe);
    this.stift.restore();
  }

  // Die Mitte der Grundflaeche: der Server nennt das Ankerfeld, die Flaeche
  // reicht von x - groesse/2 (abgerundet) ueber groesse Felder.
  gebaeudeMitte(gebaeude) {
    const n = this.werte.gebaeude[gebaeude.art]?.groesse || 1;
    const versatz = -Math.floor(n / 2) + (n - 1) / 2;
    return { x: gebaeude.x + versatz, y: gebaeude.y + versatz, groesse: n };
  }

  // ---- Boden in Kacheln (darstellung AC-13) --------------------------------

  kachelnVerwerfen(index) {
    if (!this.kacheln) return;
    const g = this.karte.groesse;
    const x = index % g;
    const y = (index / g) | 0;
    const cx = Math.floor(((x - y) * HALB_B) / KACHEL);
    const cy = Math.floor(((x + y) * HALB_H) / KACHEL);
    for (const massstab of [0.5, 1, 2]) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) this.kacheln.delete(`${massstab}|${cx + dx}|${cy + dy}`);
      }
    }
  }

  bodenZeichnen(stift, zoom) {
    if (!this.kacheln) this.kacheln = new Map();
    // Kommen die gerenderten Texturen an (oder gehen sie), sind die Kacheln
    // von eben die falschen.
    const mitBildern = Boolean(gerendert('boden'));
    if (this.kachelnMitBildern !== mitBildern) {
      this.kacheln.clear();
      this.kachelnMitBildern = mitBildern;
    }
    const massstab = kachelMassstab(zoom);
    const breite = this.leinwand.clientWidth / zoom;
    const hoehe = this.leinwand.clientHeight / zoom;
    const cx0 = Math.floor(this.kamera.x / KACHEL);
    const cx1 = Math.floor((this.kamera.x + breite) / KACHEL);
    const cy0 = Math.max(0, Math.floor(this.kamera.y / KACHEL));
    const cy1 = Math.floor((this.kamera.y + hoehe) / KACHEL);
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const schluessel = `${massstab}|${cx}|${cy}`;
        let kachel = this.kacheln.get(schluessel);
        if (!kachel) {
          kachel = kachelZeichnen(this.karte, cx * KACHEL, cy * KACHEL, massstab, HALB_B, HALB_H, this.salz);
          this.kacheln.set(schluessel, kachel);
          // Hoechstens rund 150 Kacheln im Speicher; die aeltesten gehen zuerst.
          if (this.kacheln.size > 150) this.kacheln.delete(this.kacheln.keys().next().value);
        }
        const x = (cx * KACHEL - this.kamera.x) * zoom;
        const y = (cy * KACHEL - this.kamera.y) * zoom;
        // Eine Spur groesser, sonst schimmern die Kachelgrenzen.
        stift.drawImage(kachel, x, y, KACHEL * zoom + 1, KACHEL * zoom + 1);
      }
    }
  }

  // ---- Raute ------------------------------------------------------------

  /** Feld (auch gebrochen) zu Bildpunkt auf der Leinwand. */
  zuBild(wx, wy) {
    return {
      x: ((wx - wy) * HALB_B - this.kamera.x) * this.kamera.zoom,
      y: ((wx + wy) * HALB_H - this.kamera.y) * this.kamera.zoom,
    };
  }

  /** Bildpunkt auf der Leinwand zu Feld (gebrochen) - die Umkehrung von zuBild. */
  zuWelt(px, py) {
    const ix = px / this.kamera.zoom + this.kamera.x;
    const iy = py / this.kamera.zoom + this.kamera.y;
    return {
      x: (ix / HALB_B + iy / HALB_H) / 2,
      y: (iy / HALB_H - ix / HALB_B) / 2,
    };
  }

  blickAuf(x, y) {
    this.kamera.x = (x - y) * HALB_B - this.leinwand.clientWidth / 2 / this.kamera.zoom;
    this.kamera.y = (x + y) * HALB_H - this.leinwand.clientHeight / 2 / this.kamera.zoom;
  }

  groesseAnpassen() {
    const dichte = window.devicePixelRatio || 1;
    this.leinwand.width = this.leinwand.clientWidth * dichte;
    this.leinwand.height = this.leinwand.clientHeight * dichte;
    this.stift.setTransform(dichte, 0, 0, dichte, 0, 0);
  }

  binden() {
    // Wird das Fenster kleiner, waehrend die Maus im alten Bereich steht,
    // meldet der Browser, sie habe es verlassen - das ist kein Gang ueber den
    // Rand, und die Karte bleibt stehen (bedienung AC-56). Welche der beiden
    // Meldungen zuerst kommt, ist nicht zugesagt: deshalb hier vergessen und
    // dort eine halbe Sekunde lang nicht annehmen.
    window.addEventListener('resize', () => {
      this.groesseAnpassen();
      this.groesseGeaendert = performance.now();
      if (this.randZeiger?.draussen) this.randZeiger = null;
    });

    this.leinwand.addEventListener('contextmenu', (e) => e.preventDefault());

    this.leinwand.addEventListener('pointerdown', (e) => {
      this.zeiger = { x: e.offsetX, y: e.offsetY };
      this.zeigerDrin = true;
      if (this.platzieren) {
        // Links setzt die Baustelle, rechts bricht ab. Eine Mauer wird
        // gezogen: hier beginnt die Linie, beim Loslassen ist sie fertig
        // (bauen AC-30).
        if (e.button === 0 && this.werte.gebaeude[this.platzieren.art]?.gezogen) {
          const lage = this.platzLage();
          if (lage) this.platzieren.von = { x: lage.x, y: lage.y };
          this.leinwand.setPointerCapture(e.pointerId);
        } else if (e.button === 0) this.platzierenKlick(e.shiftKey);
        else if (e.button === 2) this.platzierenBeenden();
        return;
      }
      if (e.button === 0) {
        this.zug = { vonX: e.offsetX, vonY: e.offsetY, bisX: e.offsetX, bisY: e.offsetY };
        this.leinwand.setPointerCapture(e.pointerId);
      } else if (e.button === 2) {
        // Mit Umschalt kommt das Ziel hinten an die Reihe (bedienung AC-14).
        this.befehlen(e.offsetX, e.offsetY, e.shiftKey);
      }
    });

    this.leinwand.addEventListener('pointermove', (e) => {
      this.zeiger = { x: e.offsetX, y: e.offsetY };
      this.zeigerDrin = true;
      this.randZeiger = this.zeiger;
      if (!this.zug) return;
      this.zug.bisX = e.offsetX;
      this.zug.bisY = e.offsetY;
    });

    this.leinwand.addEventListener('pointerup', (e) => {
      if (this.platzieren?.von) {
        this.zeiger = { x: e.offsetX, y: e.offsetY };
        this.mauerKlick();
        return;
      }
      if (!this.zug) return;
      this.auswaehlen(this.zug, e.shiftKey);
      this.zug = null;
    });

    // Doppelklick auf eine eigene Einheit: alle ihrer Art im Bild (bedienung
    // AC-4). Die zwei Klicks davor haben sie schon einzeln gewaehlt.
    this.leinwand.addEventListener('dblclick', (e) => {
      if (this.platzieren) return;
      this.typWaehlen(e.offsetX, e.offsetY, e.shiftKey);
    });

    // Geht die Maus vom Spielbild auf eine Leiste oder verliert das Fenster
    // den Fokus, steht die Karte (bedienung AC-9). Keine Leiste reicht bis an
    // den Rand - alle stehen mindestens 1rem davor, die Kopfzeile nimmt keine
    // Maus an -, also sieht die Leinwand die Maus in jedem Randstreifen selbst.
    this.leinwand.addEventListener('pointerleave', () => {
      this.randZeiger = null;
      this.zeigerDrin = false;
    });
    window.addEventListener('blur', () => { this.randZeiger = null; });
    // Geht sie dagegen ueber den Rand aus dem Fenster hinaus, schiebt die
    // Karte weiter (bedienung AC-56): ohne Vollbild ist der Rand nur zwoelf
    // Bildpunkte breit, und wer zuegig dorthin faehrt, ist schon draussen. Der
    // Zeiger gilt dann als an der Stelle des Randes stehend, ueber die er
    // ging. Kommt er zurueck oder verliert das Fenster den Fokus, ist es vorbei.
    const wurzel = document.documentElement;
    wurzel.addEventListener('mouseleave', (e) => {
      if (e.relatedTarget) return;
      if (performance.now() - (this.groesseGeaendert ?? -Infinity) < 500) return;
      this.randZeiger = this.austritt(e.clientX, e.clientY);
    });
    wurzel.addEventListener('mouseenter', () => {
      if (this.randZeiger?.draussen) this.randZeiger = null;
    });

    this.leinwand.addEventListener('wheel', (e) => {
      e.preventDefault();
      // Der Punkt unter dem Zeiger bleibt stehen (bedienung AC-8).
      const ix = e.offsetX / this.kamera.zoom + this.kamera.x;
      const iy = e.offsetY / this.kamera.zoom + this.kamera.y;
      const faktor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      this.kamera.zoom = Math.min(ZOOM_NAH, Math.max(ZOOM_FERN, this.kamera.zoom * faktor));
      this.kamera.x = ix - e.offsetX / this.kamera.zoom;
      this.kamera.y = iy - e.offsetY / this.kamera.zoom;
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      // Tastenkuerzel zuerst (bedienung AC-27): was sie verbrauchen, sieht die Ansicht nicht.
      if (this.beiTaste(e)) return;
      // Esc hebt erst die Platzierung auf, dann die Auswahl (bedienung AC-15).
      if (e.key === 'Escape') {
        if (this.angriffslauf) this.angriffslaufSetzen(false);
        else if (this.platzieren) this.platzierenBeenden();
        else {
          this.ausgewaehlt.clear();
          this.gewaehltesGebaeude = null;
          this.angesehen = null;
          this.beiAuswahl();
        }
        return;
      }
      // Der naechste untaetige Dorfbewohner (bedienung AC-28).
      if (e.key === '.' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        this.naechsterUntaetiger();
        return;
      }
      // Leertaste: zur Basis und zurueck (bedienung AC-10). Ohne Standard -
      // sonst drueckt sie den Knopf, der zuletzt geklickt wurde. Gehalten
      // springt sie nicht hin und her.
      if (e.code === 'Space' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        if (!e.repeat) this.basisSprung();
        return;
      }
      // Tab gehalten: der Spielstand (bedienung AC-20). Ohne Standard - sonst
      // wandert der Fokus durch die Knoepfe der Leiste.
      if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        this.spielstandSetzen(true);
        return;
      }
      this.tasten.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => {
      if (e.key === 'Tab') this.spielstandSetzen(false);
      this.tasten.delete(e.key.toLowerCase());
    });
    window.addEventListener('blur', () => {
      this.tasten.clear();
      // Wer mit gehaltenem Tab das Fenster verlaesst, bekommt kein keyup.
      this.spielstandSetzen(false);
    });
  }

  // Ausgewaehlt wird im Bild, nicht auf der Karte: ein Rechteck auf dem
  // Bildschirm ist in der Raute kein Rechteck aus Feldern mehr.
  // Mit Umschalt kommt hinzu, was getroffen ist (bedienung AC-3): Einheiten
  // zu Einheiten. Trifft der Klick ein Gebaeude oder nichts, bleiben die
  // Einheiten gewaehlt - gemischt wird nicht, denn ein Rechtsklick hiesse fuer
  // beide etwas anderes.
  auswaehlen(rahmen, erweitern = false) {
    const vorher = erweitern ? [...this.ausgewaehlt] : [];
    this.auswahlTreffen(rahmen);
    if (vorher.length) {
      if (!this.ausgewaehlt.size) this.gewaehltesGebaeude = null;
      for (const id of vorher) this.ausgewaehlt.add(id);
    }
    this.beiAuswahl();
  }

  /**
   * Alle eigenen Einheiten derselben Art wie die unter dem Zeiger, soweit ihr
   * Fusspunkt im Bild steht (bedienung AC-4). Mit Umschalt zur Auswahl dazu.
   * Gibt zurueck, wie viele es sind; trifft der Zeiger keine Einheit, null.
   */
  typWaehlen(px, py, erweitern = false) {
    const figur = this.figurenHoehe();
    let bestes = null;
    let besterAbstand = Math.max(KLICK_WEITE * this.kamera.zoom, figur * 0.75);
    for (const einheit of this.nachher.values()) {
      if (einheit.b !== this.ich || einheit.s) continue;
      const p = this.zuBild(einheit.x, einheit.y);
      const abstand = Math.hypot(p.x - px, p.y - figur * KOERPER_MITTE - py);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = einheit;
      }
    }
    if (!bestes) return null;
    const breite = this.leinwand.clientWidth;
    const hoehe = this.leinwand.clientHeight;
    if (!erweitern) this.ausgewaehlt.clear();
    this.gewaehltesGebaeude = null;
    for (const einheit of this.nachher.values()) {
      if (einheit.b !== this.ich || einheit.s || einheit.k !== bestes.k) continue;
      const p = this.zuBild(einheit.x, einheit.y);
      if (p.x >= 0 && p.x <= breite && p.y >= 0 && p.y <= hoehe) this.ausgewaehlt.add(einheit.i);
    }
    this.beiAuswahl();
    return this.ausgewaehlt.size;
  }

  auswahlTreffen(rahmen) {
    const breite = Math.abs(rahmen.bisX - rahmen.vonX);
    const hoehe = Math.abs(rahmen.bisY - rahmen.vonY);
    this.ausgewaehlt.clear();
    this.gewaehltesGebaeude = null;
    this.angesehen = null;

    const figur = this.figurenHoehe();
    if (breite < 5 && hoehe < 5) {
      // Ein Klick: die naechste eigene Einheit, gemessen an der Koerpermitte.
      let bestes = null;
      // Trifft die ganze Figur, vom Fuss bis zum Kopf.
      let besterAbstand = Math.max(KLICK_WEITE * this.kamera.zoom, figur * 0.75);
      for (const einheit of this.nachher.values()) {
        if (einheit.b !== this.ich || einheit.s) continue;
        const p = this.zuBild(einheit.x, einheit.y);
        const abstand = Math.hypot(p.x - rahmen.vonX, p.y - figur * KOERPER_MITTE - rahmen.vonY);
        if (abstand < besterAbstand) {
          besterAbstand = abstand;
          bestes = einheit;
        }
      }
      // Eigene lebende Schafe lassen sich auch waehlen (einheiten AC-22).
      for (const tier of this.tiere.values()) {
        if (tier.b !== this.ich || tier.g) continue;
        const p = this.zuBild(tier.x, tier.y);
        const abstand = Math.hypot(p.x - rahmen.vonX, p.y - figur * 0.3 - rahmen.vonY);
        if (abstand < besterAbstand) {
          besterAbstand = abstand;
          bestes = tier;
        }
      }
      if (bestes) {
        this.ausgewaehlt.add(bestes.i);
        return;
      }
      // Keine eigene Einheit getroffen: steht dort eine fremde, wird sie
      // angesehen (bedienung AC-58) - vor dem eigenen Gebaeude dahinter, denn
      // der Zeiger liegt auf ihrem Koerper.
      this.angesehen = this.fremdeEinheitUnter(rahmen.vonX, rahmen.vonY);
      if (this.angesehen) return;
      // Sonst vielleicht ein eigenes Gebaeude.
      const getroffen = this.gebaeudeUnter(rahmen.vonX, rahmen.vonY);
      if (getroffen) {
        this.gewaehltesGebaeude = getroffen.i;
        return;
      }
      this.angesehen = this.fremdesGebaeudeUnter(rahmen.vonX, rahmen.vonY);
      return;
    }
    const links = Math.min(rahmen.vonX, rahmen.bisX);
    const rechts = Math.max(rahmen.vonX, rahmen.bisX);
    const oben = Math.min(rahmen.vonY, rahmen.bisY);
    const unten = Math.max(rahmen.vonY, rahmen.bisY);
    for (const einheit of this.nachher.values()) {
      if (einheit.b !== this.ich || einheit.s) continue;
      const p = this.zuBild(einheit.x, einheit.y);
      const mitte = p.y - figur * KOERPER_MITTE * 0.5;
      if (p.x >= links && p.x <= rechts && mitte >= oben && mitte <= unten) this.ausgewaehlt.add(einheit.i);
    }
    // Schafe nur, wenn der Rahmen keine Einheit trifft - wer Dorfbewohner
    // zusammenfasst, will die Schafe daneben nicht mitschicken.
    if (this.ausgewaehlt.size) return;
    for (const tier of this.tiere.values()) {
      if (tier.b !== this.ich || tier.g) continue;
      const p = this.zuBild(tier.x, tier.y);
      if (p.x >= links && p.x <= rechts && p.y >= oben && p.y <= unten + figur * 0.3) this.ausgewaehlt.add(tier.i);
    }
  }

  // ---- Fremdes ansehen (bedienung AC-58) ------------------------------------
  // Ein Linksklick, der nichts Eigenes trifft, zeigt die fremde Einheit oder
  // das fremde Gebaeude darunter in der Leiste: Name, Besitzer, Leben,
  // Kampfwerte. Mehr nicht - es steht nicht in der Auswahl, ein Rechtsklick
  // befiehlt ihm nichts.

  fremdeEinheitUnter(px, py) {
    const figur = this.figurenHoehe();
    let bestes = null;
    let besterAbstand = Math.max(KLICK_WEITE * this.kamera.zoom, figur * 0.75);
    for (const einheit of this.nachher.values()) {
      if (einheit.b === this.ich || einheit.s || !this.zuSehen(einheit.b, einheit.x, einheit.y)) continue;
      const p = this.zuBild(einheit.x, einheit.y);
      const abstand = Math.hypot(p.x - px, p.y - figur * KOERPER_MITTE - py);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = einheit;
      }
    }
    return bestes ? { e: bestes.i } : null;
  }

  // Auch ein erinnertes Gebaeude im Nebel (kampf AC-12): man sieht dann, was
  // man zuletzt von ihm gesehen hat.
  fremdesGebaeudeUnter(px, py) {
    const e = HALB_B * this.kamera.zoom;
    let bestes = null;
    let tiefe = -Infinity;
    for (const gebaeude of this.gezeigteGebaeude()) {
      if (gebaeude.b === this.ich) continue;
      const mitte = this.gebaeudeMitte(gebaeude);
      const p = this.zuBild(mitte.x, mitte.y);
      if (!gebaeudeGetroffen(gebaeude.art, px - p.x, py - p.y, e, mitte.groesse)) continue;
      if (mitte.x + mitte.y > tiefe) {
        tiefe = mitte.x + mitte.y;
        bestes = gebaeude;
      }
    }
    return bestes ? { g: bestes.i } : null;
  }

  /** Wird genau das gerade angesehen? `schluessel` ist 'e' oder 'g'. */
  siehtAn(schluessel, id) {
    return this.angesehen?.[schluessel] === id && !this.ausgewaehlt.size && !this.gewaehltesGebaeude;
  }

  /**
   * Was angesehen wird: `{ einheit }` oder `{ gebaeude }`. Null, sobald etwas
   * Eigenes gewaehlt ist oder es nichts mehr zu sehen gibt - gefallen,
   * bekehrt, im Nebel verschwunden.
   */
  angesehenes() {
    const a = this.angesehen;
    if (!a) return null;
    let ding = null;
    if (!this.ausgewaehlt.size && !this.gewaehltesGebaeude) {
      if (a.e !== undefined) {
        const einheit = this.nachher.get(a.e);
        if (einheit && !einheit.s && einheit.b !== this.ich && this.zuSehen(einheit.b, einheit.x, einheit.y)) ding = { einheit };
      } else {
        const gebaeude = this.gebaeude.get(a.g) || this.erinnert.get(a.g);
        if (gebaeude && gebaeude.b !== this.ich) ding = { gebaeude };
      }
    }
    if (!ding) this.angesehen = null;
    return ding;
  }

  // ---- Bauplatz waehlen (bauen AC-4) ----------------------------------------

  platzierenBeginnen(art) {
    this.platzieren = { art };
    this.beiAuswahl();
  }

  platzierenBeenden() {
    this.platzieren = null;
    this.beiAuswahl();
  }

  // Wo die Baustelle unter dem Zeiger laege, und ob der Platz taugt - dieselbe
  // Regel wie auf dem Server (bauen AC-3), damit Gruen und Rot vor dem Klick
  // stimmen. Einheiten stehen nicht im Weg; sie gehen beiseite.
  platzLage() {
    if (!this.platzieren || !this.zeiger) return null;
    const art = this.platzieren.art;
    const n = this.werte.gebaeude[art]?.groesse || 1;
    const welt = this.zuWelt(this.zeiger.x, this.zeiger.y);
    const versatz = Math.floor(n / 2) - (n - 1) / 2;
    const x = Math.round(welt.x + versatz);
    const y = Math.round(welt.y + versatz);
    const x0 = x - Math.floor(n / 2);
    const y0 = y - Math.floor(n / 2);
    const lage = { art, x, y, groesse: n, mitte: { x: x0 + (n - 1) / 2, y: y0 + (n - 1) / 2 }, taugt: this.platzTaugt(art, x, y) };
    if (!this.werte.gebaeude[art]?.gezogen) return lage;
    return { ...lage, ...this.mauerLage(art, this.platzieren.von || { x, y }, { x, y }) };
  }

  /**
   * Die Felder einer gezogenen Mauer (bauen AC-30): dieselbe Linie wie
   * `mauerLinie` auf dem Server, je Feld, ob es taugt. Was nicht frei ist,
   * ist rot - der Server ueberspringt es; was der Stein nicht mehr bezahlt,
   * ebenso, denn dort endet die Linie. Zu lang gezogen, wird sie auf
   * `MAUER_MAX` Felder gekuerzt, und `bis` ist das letzte davon.
   */
  mauerLage(art, von, bis) {
    let schritte = Math.max(Math.abs(bis.x - von.x), Math.abs(bis.y - von.y));
    const max = this.werte.mauerMax || 1;
    if (schritte + 1 > max) {
      const anteil = (max - 1) / schritte;
      bis = { x: Math.round(von.x + (bis.x - von.x) * anteil), y: Math.round(von.y + (bis.y - von.y) * anteil) };
      schritte = Math.max(Math.abs(bis.x - von.x), Math.abs(bis.y - von.y));
    }
    const kosten = this.werte.gebaeude[art]?.kosten || {};
    const rest = { ...this.vorraete };
    let bezahlt = true;
    const felder = [];
    for (let i = 0; i <= schritte; i++) {
      const t = schritte ? i / schritte : 0;
      const x = Math.round(von.x + (bis.x - von.x) * t);
      const y = Math.round(von.y + (bis.y - von.y) * t);
      const frei = this.platzTaugt(art, x, y);
      if (frei && bezahlt) {
        bezahlt = Object.entries(kosten).every(([rohstoff, menge]) => (rest[rohstoff] || 0) >= menge);
        if (bezahlt) for (const [rohstoff, menge] of Object.entries(kosten)) rest[rohstoff] -= menge;
      }
      felder.push({ x, y, taugt: frei && bezahlt });
    }
    return { gezogen: true, von, bis, felder, taugt: felder.some((f) => f.taugt) };
  }

  mauerKlick() {
    const lage = this.platzLage();
    if (!lage) return;
    if (!lage.taugt) {
      this.melden('Hier ist kein Platz.');
      this.platzieren.von = null;
      return;
    }
    this.mauerSenden([...this.ausgewaehlt], lage.art, lage.von, lage.bis);
    this.platzierenBeenden();
  }

  /**
   * Ein Tor steht offen, solange eine Einheit seines Besitzers hoechstens
   * anderthalb Felder davor steht (bauen AC-31) - wie im Original oeffnet es
   * sich fuer die eigenen Leute. Das rechnet nur das Bild; begehbar ist es fuer
   * sie immer.
   */
  torOffen(tor) {
    for (const einheit of this.nachher.values()) {
      if (einheit.b === tor.b && !einheit.s && Math.hypot(einheit.x - tor.x, einheit.y - tor.y) <= 1.5) return true;
    }
    return false;
  }

  /**
   * Das eigene Gebaeude, das ein Neubau an dieser Stelle ersetzt - ein Tor auf
   * der eigenen Mauer (bauen AC-31), wie `welt.ersetzbar` auf dem Server.
   */
  ersetzbar(art, x, y) {
    const ersetzt = this.werte.gebaeude[art]?.ersetzt;
    if (!ersetzt) return null;
    for (const gebaeude of this.gebaeude.values()) {
      if (gebaeude.b === this.ich && gebaeude.art === ersetzt && gebaeude.x === x && gebaeude.y === y) return gebaeude;
    }
    return null;
  }

  // Taugt der Platz fuer ein Gebaeude? Dieselbe Regel wie auf dem Server
  // (bauen AC-3). Auch die Browsertests fragen hier - so kann ihr Helfer nicht
  // von der Vorschau abweichen (Rueckschau Runde 35).
  // Ein ersetzbares Gebaeude (ein Tor auf der eigenen Mauer, bauen AC-31)
  // zaehlt als frei - nur ohne Rand, der Rand gilt dem Platz drumherum.
  platzTaugt(art, x, y, rand = 0) {
    const n = this.werte.gebaeude[art]?.groesse || 1;
    const x0 = x - Math.floor(n / 2) - rand;
    const y0 = y - Math.floor(n / 2) - rand;
    const m = n + 2 * rand;
    const g = this.karte.groesse;
    const alt = rand === 0 ? this.ersetzbar(art, x, y) : null;
    for (let fy = y0; fy < y0 + m; fy++) {
      for (let fx = x0; fx < x0 + m; fx++) {
        if (alt && fx === alt.x && fy === alt.y) continue;
        if (fx < 0 || fy < 0 || fx >= g || fy >= g || this.karte.felder[fy * g + fx] !== GRAS) return false;
      }
    }
    for (const tier of this.tiere.values()) {
      const tx = Math.round(tier.x);
      const ty = Math.round(tier.y);
      if (tx >= x0 && tx < x0 + m && ty >= y0 && ty < y0 + m) return false;
    }
    // Farmen liegen auf Gras, belegen ihren Platz aber trotzdem.
    for (const gebaeude of this.gebaeude.values()) {
      if (gebaeude === alt) continue;
      const k = this.werte.gebaeude[gebaeude.art]?.groesse || 1;
      const gx0 = gebaeude.x - Math.floor(k / 2);
      const gy0 = gebaeude.y - Math.floor(k / 2);
      if (gx0 < x0 + m && gx0 + k > x0 && gy0 < y0 + m && gy0 + k > y0) return false;
    }
    return true;
  }

  platzierenKlick(anhaengen = false) {
    const lage = this.platzLage();
    // Auf Rot baut nichts - und die Absage sagt es noch einmal in Worten.
    if (!lage) return;
    if (!lage.taugt) {
      this.melden('Hier ist kein Platz.');
      return;
    }
    this.bauenSenden([...this.ausgewaehlt], lage.art, { x: lage.x, y: lage.y }, anhaengen);
    // Mit Umschalt bleibt der Bauplatz in der Hand fuer die naechste
    // Baustelle (bedienung AC-48); ohne legt der Klick ihn weg.
    if (!anhaengen) this.platzierenBeenden();
  }

  platzVorschau(e) {
    const lage = this.platzLage();
    if (!lage) return;
    const stift = this.stift;
    if (lage.gezogen) {
      // Je Feld eine Raute, gruen oder rot, und die Mauer als Schatten darauf.
      const spieler = this.spieler.get(this.ich);
      for (const feld of lage.felder) {
        const p = this.zuBild(feld.x, feld.y);
        raute(stift, p.x, p.y, e, e / 2);
        stift.fillStyle = feld.taugt ? 'rgba(80, 220, 110, 0.35)' : 'rgba(235, 70, 60, 0.4)';
        stift.fill();
        stift.strokeStyle = feld.taugt ? '#5fe07a' : '#ff5a4a';
        stift.lineWidth = 2;
        stift.stroke();
      }
      stift.globalAlpha = 0.55;
      for (const feld of lage.felder) {
        if (!feld.taugt) continue;
        const p = this.zuBild(feld.x, feld.y);
        gebaeudeBildZeichnen(stift, lage.art, p.x, p.y, e, spieler ? spieler.farbe : '#888888', 1);
      }
      stift.globalAlpha = 1;
      return;
    }
    const p = this.zuBild(lage.mitte.x, lage.mitte.y);
    const spieler = this.spieler.get(this.ich);
    raute(stift, p.x, p.y, e * lage.groesse, (e * lage.groesse) / 2);
    stift.fillStyle = lage.taugt ? 'rgba(80, 220, 110, 0.35)' : 'rgba(235, 70, 60, 0.4)';
    stift.fill();
    stift.strokeStyle = lage.taugt ? '#5fe07a' : '#ff5a4a';
    stift.lineWidth = 2;
    stift.stroke();
    stift.globalAlpha = 0.55;
    gebaeudeBildZeichnen(stift, lage.art, p.x, p.y, e, spieler ? spieler.farbe : '#888888', lage.groesse);
    stift.globalAlpha = 1;
  }

  befehlen(px, py, anhaengen = false, nurBoden = false) {
    const ziel = this.zuWelt(px, py);
    // Ein eigenes Gebaeude gewaehlt: der Rechtsklick setzt seinen Sammelpunkt (bauen AC-13).
    if (this.gewaehltesGebaeude) {
      this.sammelpunktSenden(this.gewaehltesGebaeude, { x: Math.round(ziel.x), y: Math.round(ziel.y) });
      this.zielzeichenSetzen(ziel);
      return;
    }
    // Ein Rechtsklick ohne Auswahl tut nichts - und zeigt deshalb auch nichts
    // (Grenzfall zu bedienung AC-34).
    if (!this.ausgewaehlt.size) return;
    const lauf = this.angriffslauf;
    this.angriffslaufSetzen(false);
    const feld = { x: Math.round(ziel.x), y: Math.round(ziel.y) };
    if (lauf) {
      // Ein Angriffslauf ist ein Angriffsbefehl, auch auf leeres Gras: das
      // Zeichen am Ziel ist deshalb rot (bedienung AC-34). Sein Ziel ist der
      // Boden - ein Befehl auf ein fremdes Bild waere ein Angriff darauf.
      this.zielzeichenSetzen(ziel, true);
      this.wegpunkteMerken(feld, false);
      this.befehlSenden([...this.ausgewaehlt], feld, true, false);
      return;
    }
    // Was der Klick trifft, ist das Bild unter dem Zeiger, nicht das Feld
    // dahinter (bedienung AC-51): gesendet wird der Ort dessen, was gemeint ist.
    const gemeint = this.zielUnter(px, py, nurBoden);
    const feindlich = gemeint.art === 'angreifen' || gemeint.art === 'bekehren';
    this.zielzeichen = {
      x: gemeint.x,
      y: gemeint.y,
      feindlich,
      // Arbeit hat ein eigenes Zeichen (bedienung AC-52): eine goldene Raute
      // um das, woran gearbeitet wird.
      arbeit: !feindlich && gemeint.art !== 'gehen',
      art: gemeint.art,
      groesse: gemeint.groesse || 1,
      seit: performance.now(),
    };
    // Ein Gegner steht in der Reihe mit seiner Mitte und rot (bedienung
    // AC-50) - dieselbe Frage, die das Zeichen eben beantwortet hat.
    this.wegpunkteMerken(feindlich ? { x: gemeint.x, y: gemeint.y, feind: true } : feld, anhaengen);
    this.befehlSenden([...this.ausgewaehlt], gemeint.sende, false, anhaengen);
  }

  /** Ein Befehl auf ein Feld der Karte, ohne Bild - von der Uebersichtskarte (bedienung AC-53). */
  befehlenAufFeld(x, y, anhaengen = false) {
    const p = this.zuBild(x, y);
    this.befehlen(p.x, p.y, anhaengen, true);
  }

  /**
   * Was die Auswahl kann - fuer die Frage, was ein Rechtsklick taete
   * (bedienung AC-51). Null, wenn keine eigene Einheit gewaehlt ist (nur
   * Schafe gehen ueberall bloss hin).
   */
  auswahlKann() {
    const einheiten = [];
    for (const id of this.ausgewaehlt) {
      const einheit = this.nachher.get(id);
      if (einheit && einheit.b === this.ich && !einheit.s) einheiten.push(einheit);
    }
    if (!einheiten.length) return null;
    const wert = (einheit) => this.werte.einheiten[this.arten[einheit.k]] || {};
    const friedlich = einheiten.every((e) => !wert(e).angriff);
    return {
      einheiten,
      // Lauter Rammen greifen keine Einheit an, nur Gebaeude (einheiten AC-35).
      nurGebaeude: einheiten.every((e) => wert(e).nurGebaeude),
      // Wer gar nicht angreift (der Moench, einheiten AC-37), geht nur hin.
      friedlich,
      // Lauter Moenche, die nicht ruhen (einheiten AC-38).
      bekehrer: friedlich && einheiten.every((e) => wert(e).bekehren && !e.r),
      sammler: einheiten.some((e) => wert(e).tragkraft > 0),
      bauarten: new Set(einheiten.flatMap((e) => wert(e).baut || [])),
      haendler: einheiten.some((e) => wert(e).handelt),
      ladungen: new Set(einheiten.filter((e) => e.l > 0).map((e) => LADUNGSART[e.a])),
    };
  }

  /**
   * Was die Auswahl an einem Gebaeude taete - in der Reihenfolge, in der der
   * Server fragt (`welt.befehl`): angreifen, mitbauen, die Farm bestellen,
   * abladen, handeln. Null: nichts Besonderes, es ist ein Gang.
   */
  gebaeudeHandlung(gebaeude, kann) {
    const werte = this.werte.gebaeude[gebaeude.art] || {};
    const fertig = (gebaeude.u ?? 1) >= 1;
    if (this.feindlich(gebaeude.b)) return kann.friedlich ? null : 'angreifen';
    if (gebaeude.b === this.ich) {
      if (!fertig) return kann.bauarten.has(gebaeude.art) ? 'bauen' : null;
      if (werte.nahrung && kann.sammler) return 'farm';
      if ((werte.annahme || []).some((rohstoff) => kann.ladungen.has(rohstoff))) return 'abladen';
    }
    if (fertig && werte.handel && kann.haendler) {
      // Zum eigenen Markt faehrt ein Karren nur, wenn es einen zweiten gibt.
      if (gebaeude.b !== this.ich) return 'handeln';
      let maerkte = 0;
      for (const g of this.gebaeude.values()) if (g.b === this.ich && this.werte.gebaeude[g.art]?.handel) maerkte += 1;
      if (maerkte > 1) return 'handeln';
    }
    return null;
  }

  /**
   * Was ein Rechtsklick an diesem Bildpunkt meint (bedienung AC-51).
   *
   * Vorher ging das Feld unter dem Zeiger an den Server - der Boden also, auf
   * den man durch das Bild hindurch zeigt. Ein Schaf, ein Baum, ein Haus
   * stehen aber ueber ihrem Fusspunkt: wer auf den Koerper des Schafs klickt,
   * zeigt auf den Boden ein, zwei Felder dahinter, und der Dorfbewohner ging
   * dorthin statt zu schlachten (das erste Spiel auf dem Server, 2026-11-12).
   *
   * Getroffen wird deshalb im Bild, in der Rangfolge des Servers: fremde
   * Einheit, eigenes Schaf, Gebaeude, Vorrat - und erst dann der Boden.
   * `sende` ist der Ort, aus dem der Server dasselbe liest: die Stelle der
   * Einheit oder des Tiers (ungerundet, er misst 1,01 Felder darum), ein Feld
   * des Gebaeudes, das Feld des Vorrats.
   *
   * @returns {{art: string, x: number, y: number, sende: {x: number, y: number}, text: string|null, groesse?: number}}
   */
  zielUnter(px, py, nurBoden = false) {
    const boden = this.zuWelt(px, py);
    const g = this.karte.groesse;
    const feld = {
      x: Math.max(0, Math.min(g - 1, Math.round(boden.x))),
      y: Math.max(0, Math.min(g - 1, Math.round(boden.y))),
    };
    const kann = this.auswahlKann();
    let ziel = null;
    if (kann && !nurBoden) ziel = this.bildZiel(px, py, feld, kann);
    if (kann && !ziel) ziel = this.bodenZiel(feld, kann);
    ziel ||= { art: 'gehen', x: feld.x, y: feld.y, sende: feld };
    // Der Server greift an, was naeher als ein Feld am gesendeten Ort steht
    // (kampf AC-1) - vor allem anderen, also auch hier.
    if (kann && ziel.art !== 'angreifen' && ziel.art !== 'bekehren') {
      const feind = !kann.friedlich ? this.feindlichAn(ziel.sende, kann.nurGebaeude) : kann.bekehrer ? this.bekehrbarAn(ziel.sende) : null;
      if (feind) ziel = { art: kann.friedlich ? 'bekehren' : 'angreifen', x: feind.x, y: feind.y, sende: ziel.sende };
    }
    ziel.text = ziel.art === 'sammeln' ? SAMMELTEXT[ziel.feldart] : ZIELTEXT[ziel.art] || null;
    return ziel;
  }

  /** Was der Zeiger im Bild trifft - null, wenn nur Boden. Teil von `zielUnter`. */
  /**
   * Liegt der Bildpunkt im Bild eines Gebaeudes, das tiefer im Bild steht als
   * `tiefe` - also ueber allem, was dort gezeichnet ist? Flache Gebaeude und
   * fruehe Baustellen verdecken nichts (wie beim Umriss, bedienung AC-30).
   */
  gebaeudeDavor(px, py, tiefe) {
    const e = HALB_B * this.kamera.zoom;
    for (const gebaeude of this.gezeigteGebaeude()) {
      if (this.werte.gebaeude[gebaeude.art]?.begehbar || (gebaeude.u ?? 1) < 0.5) continue;
      const mitte = this.gebaeudeMitte(gebaeude);
      if (mitte.x + mitte.y <= tiefe) continue;
      const p = this.zuBild(mitte.x, mitte.y);
      if (gebaeudeGetroffen(gebaeude.art, px - p.x, py - p.y, e, mitte.groesse)) return true;
    }
    return false;
  }

  bildZiel(px, py, feld, kann) {
    const figur = this.figurenHoehe();
    const e = HALB_B * this.kamera.zoom;
    // 1. Eine fremde Einheit, deren Koerper der Zeiger trifft.
    if (kann.bekehrer || (!kann.friedlich && !kann.nurGebaeude)) {
      const nicht = kann.bekehrer ? this.werte.einheiten[this.arten[kann.einheiten[0].k]].bekehren.nicht : null;
      let weite = Math.max(KLICK_WEITE * this.kamera.zoom, figur * 0.6);
      let bestes = null;
      for (const einheit of this.nachher.values()) {
        if (einheit.s || !this.feindlich(einheit.b) || !this.zuSehen(einheit.b, einheit.x, einheit.y)) continue;
        if (nicht && (this.werte.einheiten[this.arten[einheit.k]]?.klassen || []).some((klasse) => nicht.includes(klasse))) continue;
        const p = this.zuBild(einheit.x, einheit.y);
        const abstand = Math.hypot(p.x - px, p.y - figur * KOERPER_MITTE - py);
        if (abstand < weite) {
          weite = abstand;
          bestes = einheit;
        }
      }
      if (bestes) return { art: kann.bekehrer ? 'bekehren' : 'angreifen', x: bestes.x, y: bestes.y, sende: { x: bestes.x, y: bestes.y } };
    }
    // 2. Ein eigenes Schaf, lebend oder schon geschlachtet (einheiten AC-17).
    if (kann.sammler) {
      let weite = Math.max(KLICK_WEITE * this.kamera.zoom, figur * 0.5);
      let bestes = null;
      for (const tier of this.tiere.values()) {
        if (tier.b !== this.ich) continue;
        const p = this.zuBild(tier.x, tier.y);
        // Ein Schaf hinter dem Dorfzentrum faengt keinen Klick auf das Dach.
        if (this.gebaeudeDavor(p.x, p.y - figur * 0.3, tier.x + tier.y)) continue;
        const abstand = Math.hypot(p.x - px, p.y - figur * 0.3 - py);
        if (abstand < weite) {
          weite = abstand;
          bestes = tier;
        }
      }
      if (bestes) return { art: bestes.g ? 'fleisch' : 'schlachten', x: bestes.x, y: bestes.y, sende: { x: bestes.x, y: bestes.y } };
    }
    // 3. Ein Gebaeude, dessen Bild der Zeiger trifft: das vorderste, an dem
    //    die Auswahl etwas zu tun hat.
    let ziel = null;
    let tiefe = -Infinity;
    for (const gebaeude of this.gezeigteGebaeude()) {
      const mitte = this.gebaeudeMitte(gebaeude);
      if (mitte.x + mitte.y <= tiefe) continue;
      const p = this.zuBild(mitte.x, mitte.y);
      if (!gebaeudeGetroffen(gebaeude.art, px - p.x, py - p.y, e, mitte.groesse)) continue;
      const art = this.gebaeudeHandlung(gebaeude, kann);
      if (!art) continue;
      tiefe = mitte.x + mitte.y;
      // Das Ankerfeld liegt immer in der Grundflaeche - daraus liest der
      // Server das Gebaeude (`gebaeudeAn`).
      ziel = { art, x: mitte.x, y: mitte.y, groesse: mitte.groesse, sende: { x: gebaeude.x, y: gebaeude.y } };
    }
    if (ziel || !kann.sammler) return ziel;
    // 4. Ein Vorrat, dessen Bild der Zeiger trifft: der vorderste. Ein Baum
    //    ragt gut zwei Felder ueber seinen Fuss, deshalb die Felder davor.
    const g = this.karte.groesse;
    for (let y = feld.y - 1; y <= feld.y + 4; y++) {
      for (let x = feld.x - 1; x <= feld.x + 4; x++) {
        if (x < 0 || y < 0 || x >= g || y >= g || x + y <= tiefe) continue;
        const art = this.karte.felder[y * g + x];
        if (!DINGE.includes(art)) continue;
        if (this.nebelAn && !this.nebel.hatErkundet(x, y)) continue;
        const p = this.zuBild(x, y);
        // Ein geschlagener Baum schrumpft mit seiner Fuellung (gelaende.js).
        const voll = 0.6 + 0.1 * (this.fuellung.get(y * g + x) || 4);
        const [halb, oben] = art === WALD ? [0.7, 2.3 * voll] : [0.8, 0.9];
        if (Math.abs(px - p.x) > halb * e || py < p.y - oben * e || py > p.y + 0.5 * e) continue;
        // Steht ein Gebaeude davor, gilt der Klick dem Dach, nicht dem Baum dahinter.
        if (this.gebaeudeDavor(px, py, x + y)) continue;
        tiefe = x + y;
        ziel = { art: 'sammeln', feldart: art, x, y, sende: { x, y } };
      }
    }
    return ziel;
  }

  /** Was der Server aus einem Feld liest (`welt.befehl`) - null: ein Gang. Teil von `zielUnter`. */
  bodenZiel(feld, kann) {
    const art = this.karte.felder[feld.y * this.karte.groesse + feld.x];
    if (kann.sammler && DINGE.includes(art)) return { art: 'sammeln', feldart: art, x: feld.x, y: feld.y, sende: feld };
    for (const gebaeude of this.gezeigteGebaeude()) {
      const mitte = this.gebaeudeMitte(gebaeude);
      const halb = (mitte.groesse - 1) / 2;
      if (Math.abs(feld.x - mitte.x) > halb || Math.abs(feld.y - mitte.y) > halb) continue;
      const handlung = this.gebaeudeHandlung(gebaeude, kann);
      return handlung ? { art: handlung, x: mitte.x, y: mitte.y, groesse: mitte.groesse, sende: feld } : null;
    }
    if (!kann.sammler) return null;
    // Ein eigenes Schaf naeher als ein Feld (`welt.tierAn`).
    let bestes = null;
    let weite = 1.01;
    for (const tier of this.tiere.values()) {
      if (tier.b !== this.ich) continue;
      const abstand = Math.hypot(tier.x - feld.x, tier.y - feld.y);
      if (abstand < weite) {
        weite = abstand;
        bestes = tier;
      }
    }
    return bestes ? { art: bestes.g ? 'fleisch' : 'schlachten', x: bestes.x, y: bestes.y, sende: feld } : null;
  }

  /**
   * Wo die Maus das Fenster verlassen hat, als Punkt am Rand des Spielbilds
   * (bedienung AC-56). Liegt die gemeldete Stelle noch im Fenster - bei
   * schneller Bewegung meldet der Browser die letzte davor -, gilt der
   * naechste Rand.
   */
  austritt(clientX, clientY) {
    const rand = this.leinwand.getBoundingClientRect();
    const b = rand.width;
    const h = rand.height;
    let x = Math.max(0, Math.min(b - 1, clientX - rand.left));
    let y = Math.max(0, Math.min(h - 1, clientY - rand.top));
    const abstaende = [x, b - 1 - x, y, h - 1 - y];
    const naechster = abstaende.indexOf(Math.min(...abstaende));
    if (naechster === 0) x = 0;
    else if (naechster === 1) x = b - 1;
    else if (naechster === 2) y = 0;
    else y = h - 1;
    return { x, y, draussen: true };
  }

  /**
   * Die geklickten Ziele je Einheit (bedienung AC-14). Ob ein Ziel wirklich
   * wartet, entscheidet der Server - er schickt nur die Zahl (`q`); gezeigt
   * werden die letzten `q` dieser Liste. Ohne Umschalt beginnt sie neu.
   */
  wegpunkteMerken(feld, anhaengen) {
    for (const id of this.ausgewaehlt) {
      let liste = anhaengen ? (this.wegpunkte.get(id) || []) : [];
      // Die Grenze des Servers (`wegpunkteMax` aus den Werten): das laufende
      // Ziel und so viele wartende. Was darueber geklickt wird, verwirft er -
      // also hier auch, statt die aeltesten zu vergessen. Vorn schon
      // erreichte Ziele abzuschneiden, ginge nur mit `q` - und das hinkt beim
      // schnellen Klicken hinterher: die Rueckschau nach Runde 193 sah so
      // echte Ziele verschwinden. Bleibt eine Ecke: mehr als zwanzig Klicks
      // in einer Kette, von denen schon welche erreicht sind - dann fehlen
      // der Linie die neuesten.
      if (liste.length >= this.werte.wegpunkteMax + 1) continue;
      // Ein Gegner steht nur einmal in der Reihe (bedienung AC-50) - ein
      // Doppelklick auf ihn haengt beim Server nichts an, hier also auch nicht.
      if (anhaengen && feld.feind && liste.some((p) => p.feind && p.x === feld.x && p.y === feld.y)) continue;
      liste.push(feld);
      this.wegpunkte.set(id, liste);
    }
  }

  /**
   * Die Reihe der gewaehlten Einheiten (bedienung AC-14): eine gestrichelte
   * Linie vom laufenden Ziel ueber jedes wartende, an jedem wartenden ein
   * Ring - rot, wenn dort ein Gegner angegriffen wird (AC-50). Eine Gruppe
   * mit denselben Zielen zeigt sie einmal.
   */
  wegpunkteZeichnen(e) {
    const gezeigt = new Set();
    const stift = this.stift;
    for (const id of this.ausgewaehlt) {
      const einheit = this.nachher.get(id);
      const liste = this.wegpunkte.get(id);
      if (!einheit?.q || !liste || liste.length <= einheit.q) continue;
      const punkte = liste.slice(-(einheit.q + 1));
      const schluessel = punkte.map((p) => `${p.x},${p.y}`).join(';');
      if (gezeigt.has(schluessel)) continue;
      gezeigt.add(schluessel);
      const bild = punkte.map((p) => this.zuBild(p.x, p.y));
      stift.save();
      stift.lineCap = 'round';
      for (const [strich, breite] of [['rgba(20,16,12,0.6)', 3.5], ['rgba(255,255,255,0.85)', 1.6]]) {
        stift.setLineDash([7, 6]);
        stift.strokeStyle = strich;
        stift.lineWidth = breite;
        stift.beginPath();
        bild.forEach((p, i) => (i ? stift.lineTo(p.x, p.y) : stift.moveTo(p.x, p.y)));
        stift.stroke();
        stift.setLineDash([]);
        bild.forEach((p, i) => {
          if (!i) return;
          // Ein Gegner bekommt einen groesseren Ring: meist ist es ein
          // Gebaeude, und ein Ring in Groesse einer Figur ging darauf unter.
          const gross = punkte[i].feind ? 1.6 : 1;
          stift.strokeStyle = punkte[i].feind && breite < 3 ? 'rgba(232,64,48,0.95)' : strich;
          stift.lineWidth = punkte[i].feind ? breite * 1.4 : breite;
          stift.beginPath();
          stift.ellipse(p.x, p.y, e * 0.55 * gross, e * 0.275 * gross, 0, 0, Math.PI * 2);
          stift.stroke();
        });
      }
      stift.restore();
    }
  }

  /**
   * Die Betriebsart Angriffslauf an oder aus (kampf AC-4). Sie haelt nur bis
   * zum naechsten Rechtsklick - eine Betriebsart, die haengen bleibt, ist in
   * einem Echtzeitspiel eine Falle.
   */
  angriffslaufSetzen(an) {
    if (this.angriffslauf === an) return;
    this.angriffslauf = an;
    this.leinwand.classList.toggle('angriffslauf', an);
    if (an) this.melden('Angriffslauf: Ziel mit Rechtsklick wählen');
  }

  /**
   * Das Zeichen am Ziel eines Befehls (bedienung AC-34). Es steht sofort, ohne
   * auf den Server zu warten: ein Weg hin und zurueck waere ein Zehntel
   * spaeter, und das ist bei einer Rueckmeldung auf einen Klick zu viel.
   * Deshalb entscheidet der Browser hier **dieselbe** Frage noch einmal, die
   * der Server beim Befehl entscheidet (`welt.js`: `feindAn`, `gebaeudeAn`).
   */
  zielzeichenSetzen(ziel, angriffslauf = false) {
    // Lauter Rammen greifen keine Einheit an, nur Gebaeude (einheiten AC-35).
    const nurGebaeude = this.ausgewaehlt.size > 0 && [...this.ausgewaehlt].every((id) => {
      const einheit = this.nachher.get(id);
      return einheit && this.werte.einheiten[this.arten[einheit.k]]?.nurGebaeude;
    });
    // Wer gar nicht angreift (der Moench, einheiten AC-37), geht ueberall nur
    // hin - wie im Server, der ohne Angriff keinen Angriff beginnt.
    const friedlich = this.ausgewaehlt.size > 0 && [...this.ausgewaehlt].every((id) => {
      const einheit = this.nachher.get(id);
      return einheit && !this.werte.einheiten[this.arten[einheit.k]]?.angriff;
    });
    // Lauter Moenche, die nicht ruhen: eine fremde Einheit, die sie bekehren
    // koennen, ist ein Ziel (einheiten AC-38) - ein Gebaeude nicht.
    const bekehrer = friedlich && [...this.ausgewaehlt].every((id) => {
      const einheit = this.nachher.get(id);
      return this.werte.einheiten[this.arten[einheit.k]]?.bekehren && !einheit.r;
    });
    const feind = !friedlich ? this.feindlichAn(ziel, nurGebaeude) : bekehrer ? this.bekehrbarAn(ziel) : null;
    this.zielzeichen = {
      x: feind ? feind.x : Math.round(ziel.x),
      y: feind ? feind.y : Math.round(ziel.y),
      feindlich: Boolean(feind) || angriffslauf,
      seit: performance.now(),
    };
  }

  /**
   * Was unter dem Klick angegriffen wuerde: die naechste fremde lebende Einheit
   * naeher als ein Feld, sonst ein fremdes Gebaeude unter dem gerundeten Feld.
   * Dieselben Grenzen wie im Server (1,01 Felder, Grundflaeche des Gebaeudes).
   *
   * @returns {{x: number, y: number}|null} die Mitte des Ziels
   */
  /**
   * Was ein Moench unter dem Klick bekehren wuerde (einheiten AC-38): die
   * naechste fremde lebende Einheit naeher als ein Feld, deren Klassen nicht
   * in `nicht` stehen - dieselbe Frage wie `welt.kannBekehren`.
   *
   * @returns {{x: number, y: number}|null}
   */
  bekehrbarAn(ziel) {
    const erster = this.nachher.get([...this.ausgewaehlt][0]);
    const nicht = this.werte.einheiten[this.arten[erster.k]].bekehren.nicht;
    let bestes = null;
    let besterAbstand = 1.01;
    for (const einheit of this.nachher.values()) {
      if (!this.feindlich(einheit.b) || einheit.s) continue;
      if (!this.zuSehen(einheit.b, einheit.x, einheit.y)) continue;
      const abstand = Math.hypot(einheit.x - ziel.x, einheit.y - ziel.y);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = einheit;
      }
    }
    if (!bestes) return null;
    const klassen = this.werte.einheiten[this.arten[bestes.k]]?.klassen || [];
    return klassen.some((k) => nicht.includes(k)) ? null : { x: bestes.x, y: bestes.y };
  }

  /**
   * Gegner oder nicht (spielziel AC-14) - dieselbe Frage wie
   * `welt.feindlich`, mit dem Team aus dem Aufbau. Ohne Team ist jeder
   * andere ein Gegner.
   */
  feindlich(besitzer) {
    if (besitzer === this.ich) return false;
    const team = this.teamVon(this.ich);
    return !team || team !== this.teamVon(besitzer);
  }

  /**
   * Das Team eines Spielers, wie es jetzt gilt: nach Ablauf seiner Frist
   * gehoert, wer gekuendigt hat, keinem Team mehr an (spielziel AC-21) -
   * dieselbe Rechnung wie `welt.fristenTakten`, aus `bu` und dem Takt.
   */
  teamVon(id) {
    const bis = this.kuendigungen.get(id);
    if (bis !== undefined && this.takt >= bis) return null;
    return this.spieler.get(id)?.team || null;
  }

  /**
   * Sieht man durch die Augen dieses Besitzers (spielziel AC-19, AC-24)?
   * Fast immer dasselbe wie "nicht feindlich" - ausser waehrend der Frist
   * einer Kuendigung: dann sind sie noch keine Gegner, sehen aber schon
   * jeder fuer sich. Wie `welt.teiltSicht`. Fragen des Nebels und dessen,
   * was gezeigt wird, stellen deshalb diese Frage, Fragen des Kampfs
   * (Zielzeichen) `feindlich`.
   */
  teiltSicht(besitzer) {
    if (besitzer === this.ich) return true;
    if (this.feindlich(besitzer)) return false;
    return !this.kuendigungen.has(this.ich) && !this.kuendigungen.has(besitzer);
  }

  /**
   * Kann ich mein Buendnis loesen (spielziel AC-24)? Dieselben Gruende wie
   * die Absagen in `welt.kuendigen` - der Knopf steht nur, wenn der Server
   * ja sagen wuerde.
   */
  kannKuendigen() {
    if (this.buendnisse === 'fest' || this.aus || this.ende !== null) return false;
    if (this.kuendigungen.has(this.ich)) return false;
    return [...this.spieler.values()].some((s) => s.id !== this.ich && !s.aus
      && !this.feindlich(s.id) && !this.kuendigungen.has(s.id));
  }

  /**
   * Die Kuendigungen aus Zustand oder Aufbau uebernehmen. Kommt eine neue,
   * trennt sich die Sicht sofort - und was man von den Gebaeuden der anderen
   * Seite wusste, bleibt als Erinnerung im Nebel stehen, wie auf dem Server
   * (`welt.sichtTrennen`), statt auf einen Schlag zu verschwinden.
   */
  kuendigungenMerken(bu) {
    if (!bu || bu.length === this.kuendigungen.size) return;
    const vorher = new Set([...this.spieler.keys()].filter((id) => this.teiltSicht(id)));
    for (const [wer, bis] of bu) this.kuendigungen.set(wer, bis);
    for (const b of this.gebaeude.values()) {
      if (vorher.has(b.b) && !this.teiltSicht(b.b)) this.erinnert.set(b.i, { ...b });
    }
    this.nebel?.rechnen(this, true);
  }

  /**
   * Was die Ansage oben sagt (spielziel AC-24): je Kuendigung, solange die
   * Frist laeuft und noch zehn Spielsekunden danach. Die Restzeit in ganzen
   * Sekunden, gerechnet aus den Takten des Servers - im Zeitraffer laeuft
   * sie so schnell wie das Spiel.
   */
  buendnisAnsagen() {
    const liste = [];
    for (const [wer, bis] of this.kuendigungen) {
      const rest = Math.ceil((bis - this.takt) / this.takteProSekunde);
      if (rest < -10) continue;
      liste.push({ wer, name: wer === this.ich ? null : this.spieler.get(wer)?.name || '?', rest: Math.max(0, rest) });
    }
    return liste;
  }

  feindlichAn(ziel, nurGebaeude = false) {
    let bestes = null;
    let besterAbstand = 1.01;
    for (const einheit of this.nachher.values()) {
      if (!this.feindlich(einheit.b) || einheit.s) continue;
      // Wer im Nebel steht, ist kein Ziel - man sieht ihn nicht (kampf AC-11).
      if (!this.zuSehen(einheit.b, einheit.x, einheit.y)) continue;
      const abstand = Math.hypot(einheit.x - ziel.x, einheit.y - ziel.y);
      if (abstand < besterAbstand) {
        besterAbstand = abstand;
        bestes = einheit;
      }
    }
    // Wie im Server: liegt eine Einheit unter dem Klick, zaehlt das Gebaeude
    // dahinter nicht - wer nur Gebaeude angreift, geht dann hin.
    if (bestes) return nurGebaeude ? null : { x: bestes.x, y: bestes.y };
    const zx = Math.round(ziel.x);
    const zy = Math.round(ziel.y);
    for (const gebaeude of this.gebaeude.values()) {
      if (!this.feindlich(gebaeude.b)) continue;
      const mitte = this.gebaeudeMitte(gebaeude);
      const halb = (mitte.groesse - 1) / 2;
      if (zx >= mitte.x - halb && zx <= mitte.x + halb && zy >= mitte.y - halb && zy <= mitte.y + halb) {
        return { x: mitte.x, y: mitte.y };
      }
    }
    return null;
  }

  schieben(dauer) {
    const tempo = (600 / this.kamera.zoom) * (dauer / 1000);
    const rand = this.amRand();
    if (this.tasten.has('w') || this.tasten.has('arrowup') || rand.oben) this.kamera.y -= tempo;
    if (this.tasten.has('s') || this.tasten.has('arrowdown') || rand.unten) this.kamera.y += tempo;
    if (this.tasten.has('a') || this.tasten.has('arrowleft') || rand.links) this.kamera.x -= tempo;
    if (this.tasten.has('d') || this.tasten.has('arrowright') || rand.rechts) this.kamera.x += tempo;

    // Die Karte als Raute: links und rechts je g Halbbreiten, unten 2g Halbhoehen.
    const g = this.karte.groesse;
    const breite = this.leinwand.clientWidth / this.kamera.zoom;
    const hoehe = this.leinwand.clientHeight / this.kamera.zoom;
    this.kamera.x = Math.max(-g * HALB_B - breite / 2, Math.min(g * HALB_B - breite / 2, this.kamera.x));
    this.kamera.y = Math.max(-hoehe / 2, Math.min(2 * g * HALB_H - hoehe / 2, this.kamera.y));
  }

  /**
   * An welchem Rand des Spielbilds die Maus steht (bedienung AC-9): in den
   * aeussersten RAND_SCHIEBEN Bildpunkten - oben auch unter der Kopfzeile
   * mit den Rohstoffen. Aus, wenn abgeschaltet oder die Maus draussen.
   */
  amRand() {
    const z = this.randZeiger;
    if (!this.randSchieben || !z) return {};
    const b = this.leinwand.clientWidth;
    const h = this.leinwand.clientHeight;
    if (z.x < 0 || z.y < 0 || z.x >= b || z.y >= h) return {};
    return {
      links: z.x < RAND_SCHIEBEN,
      rechts: z.x >= b - RAND_SCHIEBEN,
      oben: z.y < RAND_SCHIEBEN,
      unten: z.y >= h - RAND_SCHIEBEN,
    };
  }

  randSchiebenSetzen(an) {
    this.randSchieben = Boolean(an);
    try {
      localStorage.setItem('randSchieben', an ? 'an' : 'aus');
    } catch {
      // Ohne Speicher gilt die Wahl bis zum Neuladen.
    }
  }

  /** Solange die Tafeln unterwegs sind: ein ruhiges Bild mit einem Satz. */
  ladebild() {
    const s = this.stift;
    const b = this.leinwand.clientWidth;
    const h = this.leinwand.clientHeight;
    s.save();
    s.fillStyle = '#0d1016';
    s.fillRect(0, 0, b, h);
    s.fillStyle = '#c9ced8';
    s.font = '600 18px system-ui, sans-serif';
    s.textAlign = 'center';
    s.textBaseline = 'middle';
    s.fillText('Bilder werden geladen …', b / 2, h / 2);
    s.restore();
  }

  bild(jetzt = performance.now()) {
    if (!this.karte) return;
    const dauer = Math.min(50, jetzt - (this.letztesBild || jetzt));
    this.letztesBild = jetzt;
    this.schieben(dauer);
    // Die Partie zeichnet erst, wenn ihre Bilder da sind (darstellung AC-24):
    // sonst stuenden einen Augenblick lang die gezeichneten Figuren im Bild.
    if (!bilderBereit()) {
      this.ladebild();
      requestAnimationFrame((t) => this.bild(t));
      return;
    }
    // Angehalten steht das Bild - schieben und waehlen geht weiter.
    this.zeichnen(halt ?? jetzt);
    this.nachBild(jetzt);
    requestAnimationFrame((t) => this.bild(t));
  }

  /** Angehalten (speichern AC-19): das Bild steht, bis es weitergeht. */
  anhalten(an) {
    if (an === (halt !== null)) return;
    halt = an ? performance.now() : null;
  }

  // Der Server schickt zehn Bilder je Sekunde, der Schirm zeigt sechzig.
  // Dazwischen wird geschaetzt, sonst ruckelt jede Bewegung.
  anteil(jetzt) {
    return Math.min(1, (jetzt - this.empfangen) / this.taktdauer);
  }

  figurenHoehe() {
    return figurHoeheBei(this.kamera.zoom);
  }

  /** Welche Felder das Bild beruehrt - aus den vier Ecken der Leinwand. */
  sichtbareFelder() {
    const breite = this.leinwand.clientWidth;
    const hoehe = this.leinwand.clientHeight;
    const ecken = [this.zuWelt(0, 0), this.zuWelt(breite, 0), this.zuWelt(0, hoehe), this.zuWelt(breite, hoehe)];
    const g = this.karte.groesse;
    // Zwei Felder Rand, damit hohe Baeume am unteren Rand nicht abgeschnitten werden.
    return {
      vonX: Math.max(0, Math.floor(Math.min(...ecken.map((e) => e.x))) - 1),
      bisX: Math.min(g - 1, Math.ceil(Math.max(...ecken.map((e) => e.x))) + 2),
      vonY: Math.max(0, Math.floor(Math.min(...ecken.map((e) => e.y))) - 1),
      bisY: Math.min(g - 1, Math.ceil(Math.max(...ecken.map((e) => e.y))) + 2),
    };
  }

  zeichnen(jetzt) {
    const stift = this.stift;
    const zoom = this.kamera.zoom;
    stift.fillStyle = '#0f1216';
    stift.fillRect(0, 0, this.leinwand.clientWidth, this.leinwand.clientHeight);

    const g = this.karte.groesse;
    const { vonX, bisX, vonY, bisY } = this.sichtbareFelder();

    // 1. Boden: eine durchgehende Textur in vorgezeichneten Kacheln (AC-13).
    this.bodenZeichnen(stift, zoom);
    // Grasbueschel und Blumen (darstellung AC-12) - vor dem Wasser, damit das
    // Ufer sie ueberdeckt, und nur auf freiem Gras.
    const felder = this.karte.felder;
    // Erst ab rund Zoom 1,2: kleiner wirken Halme und Blumen wie Rauschen.
    // Mit gerendertem Boden (ADR-0016) stehen die Halme schon in der Textur.
    if (HALB_B * zoom >= 26 && !gerendert('boden')) {
      const gras = grasBeginnen();
      for (let y = vonY; y <= bisY; y++) {
        for (let x = vonX; x <= bisX; x++) {
          const index = y * g + x;
          if (felder[index] !== GRAS) continue;
          const p = this.zuBild(x, y);
          grasSammeln(gras, p.x, p.y, HALB_B * zoom, index, this.salz);
        }
      }
      grasZeichnen(stift, gras, HALB_B * zoom);
    }
    // Das Wasser liegt mit seinem Ufer in der Bodentextur (boden.js); darauf
    // nur ein leises Glitzern - das gerenderte Wasser hat seine Wellen selbst,
    // gezeichnete Striche laegen darauf wie Kreide.
    for (let y = vonY; y <= bisY && !gerendert('boden'); y++) {
      for (let x = vonX; x <= bisX; x++) {
        if (felder[y * g + x] !== WASSER) continue;
        const p = this.zuBild(x, y);
        wellenZeichnen(stift, p.x, p.y, HALB_B * zoom, y * g + x, this.salz);
      }
    }

    // Flache Gebaeude (Farmen) gehoeren zum Boden: unter Figuren und Baeume.
    // Fremde nur, wie man sie sieht oder erinnert (kampf AC-12).
    const gezeigt = this.gezeigteGebaeude();
    this.gezeigt = gezeigt;
    this.mauern = this.mauernSammeln(gezeigt);
    for (const gebaeude of gezeigt) {
      if (!this.werte.gebaeude[gebaeude.art]?.begehbar) continue;
      const mitte = this.gebaeudeMitte(gebaeude);
      this.gebaeudeBild(gebaeude, this.zuBild(mitte.x, mitte.y), HALB_B * zoom);
    }
    this.mauerschatten(gezeigt, HALB_B * zoom);

    // 2. Alles, was steht, nach Tiefe: was weiter unten im Bild steht, verdeckt,
    //    was dahinter steht (darstellung AC-7).
    const stehend = [];
    for (let y = vonY; y <= bisY; y++) {
      for (let x = vonX; x <= bisX; x++) {
        const index = y * g + x;
        const art = this.karte.felder[index];
        // Nie Gesehenes wird gar nicht erst gezeichnet: ein Baum am Kartenrand
        // ragt mit seiner Krone ueber die Flaeche, die der Nebel deckt (Runde 105).
        if (this.nebelAn && !this.nebel.hatErkundet(x, y)) continue;
        // Ein Baum am Rand des Erkundeten kommt erst, wenn auch die zwei
        // Felder dahinter bekannt sind: seine Krone laege sonst unter ihrem
        // Schwarz, und aus dem Dunkel ragte ein blanker Stamm (gerenderte
        // Baeume sind hoeher als die gezeichneten, 2026-11-12).
        if (this.nebelAn && art === WALD && [1, 2].some((n) => x >= n && y >= n && !this.nebel.hatErkundet(x - n, y - n))) continue;
        if (DINGE.includes(art)) stehend.push({ tiefe: x + y, x, y, art: 'vorrat', feld: art, index });
      }
    }
    for (const gebaeude of gezeigt) {
      // Farmen liegen flach am Boden und sind schon gezeichnet.
      if (this.werte.gebaeude[gebaeude.art]?.begehbar) continue;
      const mitte = this.gebaeudeMitte(gebaeude);
      stehend.push({ tiefe: mitte.x + mitte.y, x: mitte.x, y: mitte.y, art: 'gebaeude', gebaeude });
    }
    for (const tier of this.tiere.values()) {
      const t = tier.seit === undefined ? 1 : Math.min(1, (jetzt - tier.seit) / this.taktdauer);
      const x = tier.vx === undefined ? tier.x : tier.vx + (tier.x - tier.vx) * t;
      const y = tier.vy === undefined ? tier.y : tier.vy + (tier.y - tier.vy) * t;
      // Tiere im Nebel bleiben verborgen, auch die eigenen Schafe nicht -
      // erst wer hinsieht, findet sie (kampf AC-12).
      if (this.nebelAn && !this.teiltSicht(tier.b) && !this.nebel.sieht(x, y)) continue;
      stehend.push({ tiefe: x + y, x, y, art: 'tier', tier });
    }
    const anteil = this.anteil(jetzt);
    for (const einheit of this.nachher.values()) {
      const alt = this.vorher.get(einheit.i);
      const x = alt ? alt.x + (einheit.x - alt.x) * anteil : einheit.x;
      const y = alt ? alt.y + (einheit.y - alt.y) * anteil : einheit.y;
      // Fremde Einheiten zeigt nur, wer sie gerade sieht (kampf AC-11, AC-12).
      if (!this.zuSehen(einheit.b, x, y)) continue;
      stehend.push({ tiefe: x + y, x, y, art: 'einheit', einheit, alt });
    }
    // Gleiche Tiefe: der Vorrat zuerst, sonst verschwindet ein Sammler im Baum,
    // vor dem er steht.
    const rang = { vorrat: 0, gebaeude: 1, tier: 2, einheit: 3 };
    // Gleiche Tiefe: ein Gefallener liegt unter den Lebenden (kampf AC-10).
    const stufe = (d) => (d.art === 'einheit' && d.einheit.s ? 2.5 : rang[d.art]);
    stehend.sort((a, b) => a.tiefe - b.tiefe || stufe(a) - stufe(b) || a.x - b.x);

    const e = HALB_B * zoom;
    this.verdeckte = [];
    // Lebensbalken sammeln die Zeichnungen unterwegs; gemalt werden sie danach,
    // ueber allem, damit kein Baum sie verdeckt (darstellung AC-8).
    this.lebensbalken = [];
    for (const ding of stehend) {
      const p = this.zuBild(ding.x, ding.y);
      if (ding.art === 'vorrat') {
        // Aus dem Zwischenspeicher: direkt gezeichnet kostete es bei Zoom 1 doppelt so viel (Runde 29).
        dingBildZeichnen(stift, ding.feld, p.x, p.y, e, ding.index, (this.fuellung.get(ding.index) || 4) / 4, ding, this.salz);
      } else if (ding.art === 'gebaeude') {
        this.gebaeudeBild(ding.gebaeude, p, e);
      } else if (ding.art === 'tier') {
        const spieler = this.spieler.get(ding.tier.b);
        if (this.ausgewaehlt.has(ding.tier.i)) {
          const r = tierHoeheBei(zoom);
          stift.strokeStyle = '#ffffff';
          stift.lineWidth = 2;
          stift.beginPath();
          stift.ellipse(p.x, p.y, r * 0.55, r * 0.26, 0, 0, Math.PI * 2);
          stift.stroke();
        }
        // Gemeldet wird ein Tier nur, wenn sich an ihm etwas aendert: nach dem
        // letzten Schritt kommt nichts mehr, und es liefe sonst auf der Stelle.
        const laeuft = ding.tier.vx !== undefined && (ding.tier.vx !== ding.tier.x || ding.tier.vy !== ding.tier.y)
          && jetzt - ding.tier.seit < this.taktdauer * 2;
        figurBildZeichnen(stift, ding.tier.art, p.x, p.y, tierHoeheBei(zoom), spieler ? spieler.farbe : '#888888', {
          blick: ding.tier.i % 2 ? 1 : -1,
          richtung: ding.tier.richtung,
          // Geschlachtet: ein Kadaver, der mit der Nahrung kleiner wird (einheiten AC-17).
          liegt: Boolean(ding.tier.g),
          rest: (ding.tier.n ?? 100) / 100,
          schritt: laeuft ? jetztPhase(ding.tier.i) : 0,
        });
      } else {
        this.einheitZeichnen(ding.einheit, ding.alt, p);
      }
    }
    this.reihenfolge = stehend.map((d) => ({ art: d.art, tiefe: d.tiefe, id: d.einheit?.i }));
    // Verdeckte Einheiten als Umriss in Spielerfarbe, ueber allem (bedienung AC-30).
    this.umrisse = this.verdeckte.map((v) => v.einheit.i);
    for (const verdeckt of this.verdeckte) this.umrissZeichnen(verdeckt, e);
    // Der Nebel liegt ueber allem, was steht, und unter den Hilfen der
    // Bedienung - Lebensbalken, Zielzeichen und Rahmen bleiben lesbar.
    this.pfeileZeichnen(stift);
    if (this.nebelAn) this.nebelZeichnen(stift);
    for (const balken of this.lebensbalken) this.lebensbalkenZeichnen(balken);
    this.wegpunkteZeichnen(e);
    this.zielzeichenZeichnen(e, jetzt);
    this.zeigerZielZeichnen(e);

    for (const spieler of this.spieler.values()) {
      // Ein fremder Name steht erst dort, wo man schon war.
      if (this.nebelAn && spieler.id !== this.ich && !this.nebel.hatErkundet(spieler.basis.x, spieler.basis.y)) continue;
      this.namenZeichnen(spieler);
    }
    if (this.platzieren) this.platzVorschau(e);
    this.sammelpunktZeichnen(e);
    if (this.zug) this.rahmenZeichnen();
  }

  /**
   * Wartet irgendwo ein eigener Auftrag, weil die Bevoelkerung voll ist
   * (bedienung AC-43)? Der Server sagt es je Gebaeude (`w`, bauen AC-15) -
   * hier wird nur gefragt, ob eines der eigenen es sagt, gewaehlt oder nicht.
   */
  wartetEtwas() {
    for (const g of this.gebaeude.values()) if (g.b === this.ich && g.w) return true;
    return false;
  }

  /**
   * Die Leertaste (bedienung AC-10): springt zum eigenen Dorfzentrum - dem,
   * das dem Startplatz am naechsten steht, ohne eines zum Startplatz. Ein
   * zweites Mal, ohne dass die Kamera dazwischen bewegt wurde, zurueck dorthin,
   * wo sie vorher stand. Wer weggeschoben hat, springt wieder zur Basis.
   * Gibt 'basis' oder 'zurueck' zurueck.
   */
  basisSprung() {
    const k = this.kamera;
    const s = this.sprung;
    if (s && Math.abs(k.x - s.nach.x) < 0.5 && Math.abs(k.y - s.nach.y) < 0.5 && k.zoom === s.nach.zoom) {
      k.x = s.von.x;
      k.y = s.von.y;
      this.sprung = null;
      return 'zurueck';
    }
    const start = this.spieler.get(this.ich)?.basis;
    if (!start) return null;
    let ziel = start;
    let weite = Infinity;
    for (const g of this.gebaeude.values()) {
      if (g.b !== this.ich || g.art !== 'dorfzentrum') continue;
      const mitte = this.gebaeudeMitte(g);
      const d = Math.hypot(mitte.x - start.x, mitte.y - start.y);
      if (d < weite) {
        weite = d;
        ziel = mitte;
      }
    }
    const von = { x: k.x, y: k.y };
    this.blickAuf(ziel.x, ziel.y);
    // Am Kartenrand haelt schieben() die Kamera fest; gemerkt wird, wo sie
    // danach steht, sonst erkennte der zweite Druck seinen Sprung nicht.
    this.schieben(0);
    this.sprung = { von, nach: { x: k.x, y: k.y, zoom: k.zoom } };
    return 'basis';
  }

  /**
   * Waehlt den naechsten untaetigen Dorfbewohner und holt ihn ins Bild -
   * reihum, damit zweimal gedrueckt auch zwei verschiedene zeigt
   * (bedienung AC-28).
   */
  naechsterUntaetiger() {
    const liste = this.untaetige.filter((id) => this.nachher.has(id));
    if (!liste.length) return null;
    const bisher = liste.indexOf(this.letzterUntaetiger);
    const id = liste[(bisher + 1) % liste.length];
    this.letzterUntaetiger = id;
    const einheit = this.nachher.get(id);
    if (this.platzieren) this.platzierenBeenden();
    this.gewaehltesGebaeude = null;
    this.ausgewaehlt.clear();
    this.ausgewaehlt.add(id);
    this.blickAuf(einheit.x, einheit.y);
    this.beiAuswahl();
    return id;
  }

  /**
   * Legt die Auswahl unter einer Ziffer ab (bedienung AC-5) - die Einheiten,
   * sonst das gewaehlte eigene Gebaeude. Ohne Auswahl wird die Ziffer frei.
   */
  gruppeAblegen(ziffer) {
    if (this.ausgewaehlt.size) this.gruppen.set(ziffer, { einheiten: [...this.ausgewaehlt] });
    else if (this.gewaehltesGebaeude !== null && this.gebaeude.get(this.gewaehltesGebaeude)?.b === this.ich) {
      this.gruppen.set(ziffer, { gebaeude: this.gewaehltesGebaeude });
    } else this.gruppen.delete(ziffer);
  }

  /**
   * Ruft die Auswahl unter einer Ziffer zurueck. Wer seither gefallen oder
   * bekehrt ist, faellt heraus; ist niemand mehr da, bleibt die Auswahl, wie
   * sie war. Gibt zurueck, wie viele gewaehlt sind.
   */
  gruppeAbrufen(ziffer) {
    const gruppe = this.gruppen.get(ziffer);
    if (!gruppe) return 0;
    if (gruppe.gebaeude !== undefined) {
      if (this.gebaeude.get(gruppe.gebaeude)?.b !== this.ich) return 0;
      if (this.platzieren) this.platzierenBeenden();
      this.ausgewaehlt.clear();
      this.gewaehltesGebaeude = gruppe.gebaeude;
      this.beiAuswahl();
      return 1;
    }
    const lebend = gruppe.einheiten.filter((id) => {
      const e = this.nachher.get(id);
      return e && e.b === this.ich && !e.s;
    });
    gruppe.einheiten = lebend;
    if (!lebend.length) return 0;
    if (this.platzieren) this.platzierenBeenden();
    this.gewaehltesGebaeude = null;
    this.ausgewaehlt = new Set(lebend);
    this.beiAuswahl();
    return lebend.length;
  }

  /**
   * Das eigene Gebaeude unter einem Bildpunkt - von mehreren das vorderste, das
   * im Bild auch oben liegt (Runde 53: vorher gewann das zuerst gebaute, und ein
   * Klick auf die Kaserne waehlte das Haus dahinter).
   */
  gebaeudeUnter(px, py) {
    const e = HALB_B * this.kamera.zoom;
    let bestes = null;
    let tiefe = -Infinity;
    for (const gebaeude of this.gebaeude.values()) {
      if (gebaeude.b !== this.ich) continue;
      const mitte = this.gebaeudeMitte(gebaeude);
      const p = this.zuBild(mitte.x, mitte.y);
      if (!gebaeudeGetroffen(gebaeude.art, px - p.x, py - p.y, e, mitte.groesse)) continue;
      if (mitte.x + mitte.y > tiefe) {
        tiefe = mitte.x + mitte.y;
        bestes = gebaeude;
      }
    }
    return bestes;
  }

  /**
   * Die Gebaeude, hinter denen die Einheit stehen kann: nur solche, die
   * tiefer im Bild stehen (groesseres x + y), liegen ueber ihr; flache
   * (Farmen) verdecken nichts (bedienung AC-30). Das ist die grobe Auswahl
   * nach dem Trefferkasten - was wirklich verdeckt ist, entscheidet beim
   * Zeichnen das Bild des Gebaeudes (`umrissZeichnen`).
   */
  deckendeGebaeude(einheit, punkt) {
    const e = HALB_B * this.kamera.zoom;
    const tiefe = einheit.x + einheit.y;
    const figur = this.figurenHoehe();
    const decken = [];
    // Nur was im Bild steht, verdeckt: ein Gebaeude, das der Nebel nicht
    // zeigt, macht niemanden zum Umriss.
    for (const gebaeude of this.gezeigt || this.gebaeude.values()) {
      if (this.werte.gebaeude[gebaeude.art]?.begehbar) continue;
      // Eine Baustelle, von der erst Fundament und Zaun stehen, verdeckt
      // niemanden - ihr Boden laege sonst als Maske ueber den Fuessen.
      if ((gebaeude.u ?? 1) < 0.5) continue;
      const mitte = this.gebaeudeMitte(gebaeude);
      if (mitte.x + mitte.y <= tiefe) continue;
      const p = this.zuBild(mitte.x, mitte.y);
      // Etwas ueber dem Fusspunkt gemessen: dort steht der Koerper.
      if (gebaeudeGetroffen(gebaeude.art, punkt.x - p.x, punkt.y - figur * 0.5 - p.y, e, mitte.groesse)) decken.push(gebaeude);
    }
    return decken;
  }

  hinterGebaeude(einheit, punkt) {
    return this.deckendeGebaeude(einheit, punkt).length > 0;
  }

  /**
   * Der Umriss einer verdeckten Einheit in Spielerfarbe, ueber allem
   * (bedienung AC-30) - aber nur dort, wo wirklich ein Gebaeude ueber ihr
   * liegt. Vorher wurde die ganze Gestalt eingefaerbt, sobald ihre Mitte im
   * Trefferkasten eines Gebaeudes lag: neben einer Baustelle, von der erst
   * das Fundament steht, stand ein ganz blauer Dorfbewohner (das erste Spiel
   * auf dem Server, 2026-11-12).
   *
   * Zwei kleine Hilfsbilder: die Gebaeude als Maske, die Gestalt in Farbe -
   * uebrig bleibt, was von der Gestalt unter der Maske liegt.
   */
  umrissZeichnen({ einheit, punkt, hoehe, laeuft, decken }, e) {
    const dichte = window.devicePixelRatio || 1;
    const spieler = this.spieler.get(einheit.b);
    // Der Kasten um die Gestalt: breit genug fuer Reiter und Ladung.
    const breite = Math.ceil(hoehe * 3.2);
    const hoch = Math.ceil(hoehe * 2.3);
    const links = Math.round(punkt.x - breite / 2);
    const oben = Math.round(punkt.y - hoehe * 1.8);
    if (!this.umrissbild) {
      this.umrissbild = document.createElement('canvas');
      this.umrissmaske = document.createElement('canvas');
    }
    const stifte = [this.umrissbild, this.umrissmaske].map((leinwand) => {
      if (leinwand.width !== Math.ceil(breite * dichte) || leinwand.height !== Math.ceil(hoch * dichte)) {
        leinwand.width = Math.ceil(breite * dichte);
        leinwand.height = Math.ceil(hoch * dichte);
      }
      const s = leinwand.getContext('2d');
      s.setTransform(1, 0, 0, 1, 0, 0);
      s.globalCompositeOperation = 'source-over';
      s.clearRect(0, 0, leinwand.width, leinwand.height);
      s.setTransform(dichte, 0, 0, dichte, -links * dichte, -oben * dichte);
      return s;
    });
    const [bild, maske] = stifte;
    for (const gebaeude of decken) {
      const mitte = this.gebaeudeMitte(gebaeude);
      const p = this.zuBild(mitte.x, mitte.y);
      const voll = this.werte.gebaeude[gebaeude.art]?.nahrung;
      const offen = Boolean(this.werte.gebaeude[gebaeude.art]?.tor) && this.torOffen(gebaeude);
      gebaeudeBildZeichnen(maske, gebaeude.art, p.x, p.y, e, '#888888', mitte.groesse, gebaeude.u ?? 1, voll ? (gebaeude.n ?? voll) / voll : 1, offen, this.gebaeudeLage(gebaeude));
    }
    // Der Schlagschatten eines Gebaeudes verdeckt niemanden: zweimal mit sich
    // selbst beschnitten bleibt von seiner halben Deckung fast nichts, von
    // der vollen des Mauerwerks alles.
    maske.setTransform(1, 0, 0, 1, 0, 0);
    maske.globalCompositeOperation = 'destination-in';
    maske.drawImage(this.umrissmaske, 0, 0);
    maske.drawImage(this.umrissmaske, 0, 0);
    figurBildZeichnen(bild, this.arten[einheit.k] || 'dorfbewohner', punkt.x, punkt.y, hoehe, spieler ? spieler.farbe : '#888888', {
      blick: this.blicke.get(einheit.i) || 1,
      richtung: this.richtungen.get(einheit.i),
      ladung: einheit.l > 0 ? einheit.a : null,
      schritt: laeuft ? jetztPhase(einheit.i) : 0,
      arbeit: einheit.w && !laeuft ? jetztPhase(einheit.i) : 0,
    }, true);
    bild.setTransform(1, 0, 0, 1, 0, 0);
    bild.globalCompositeOperation = 'destination-in';
    bild.drawImage(this.umrissmaske, 0, 0);
    this.stift.drawImage(this.umrissbild, links, oben, this.umrissbild.width / dichte, this.umrissbild.height / dichte);
  }

  /**
   * Ein Wert einer Einheit, wie er fuer ihren Besitzer gilt - aus der Tafel,
   * die der Server schickt (bedienung AC-35). Ohne Tafel der Grundwert aus
   * den Daten.
   *
   * Vorher rechnete der Browser die Verbesserungen selbst zusammen, und zwar
   * nur ueber den **Namen** der Art. Eine Verbesserung, die an einer
   * **Klasse** haengt (Schmiedeangriff an `infanterie`), fiel damit unter den
   * Tisch - unsichtbar, solange keine das Leben einer Klasse hebt.
   */
  einheitenwert(einheit, feld) {
    const art = this.arten[einheit.k] || 'dorfbewohner';
    const tafel = this.einheitenwerte.get(einheit.b);
    return tafel?.[art]?.[feld] ?? this.werte.einheiten[art]?.[feld] ?? 0;
  }

  /** Das volle Leben einer Einheit, mit den Verbesserungen ihres Besitzers (bauen AC-21). */
  // Das volle Leben eines Gebaeudes, wie es fuer seinen Besitzer gilt - nach
  // dem Mauerwerk 10 % mehr (bauen AC-34). Aus der Tafel des Servers, sonst
  // der Grundwert.
  gebaeudeLebenVoll(gebaeude) {
    return this.einheitenwerte.get(gebaeude.b)?.[gebaeude.art]?.leben ?? this.werte.gebaeude[gebaeude.art]?.leben;
  }

  lebenVoll(einheit) {
    return this.einheitenwert(einheit, 'leben');
  }

  /**
   * Wie viel Nahrung eine Farm voll traegt, mit den Verbesserungen ihres
   * Besitzers (bauen AC-26). Ohne das stuende in der Leiste "noch 250 Nahrung
   * von 175" - der Vorrat aus der Tabelle, nicht der dieses Spielers.
   *
   * Gelesen aus der Tafel des Servers (`kw`), die Haus und Verbesserungen
   * kennt (spielziel AC-17). Bis Runde 167 rechnete der Browser die
   * Verbesserungen hier selbst zusammen und kannte das Haus nicht;
   * `tests/waechter-wirkungen.test.mjs` haelt das fern.
   */
  farmVoll(gebaeude) {
    const grund = this.werte.gebaeude[gebaeude.art]?.nahrung || 0;
    if (!grund) return 0;
    return this.einheitenwerte.get(gebaeude.b)?.[gebaeude.art]?.nahrung || grund;
  }

  // Ein Lebensbalken (darstellung AC-8): dunkler Grund, darauf der Anteil in
  // Gruen, unter einem Drittel in Rot - schmal, damit er nichts zudeckt.
  lebensbalkenZeichnen({ x, y, breite, anteil }) {
    const stift = this.stift;
    const hoch = Math.min(5, Math.max(3, Math.round(breite / 9)));
    const links = Math.round(x - breite / 2);
    const oben = Math.round(y - hoch);
    stift.fillStyle = 'rgba(16, 18, 20, 0.8)';
    stift.fillRect(links - 1, oben - 1, breite + 2, hoch + 2);
    stift.fillStyle = anteil < 1 / 3 ? '#c8463c' : '#5daa45';
    stift.fillRect(links, oben, Math.max(1, Math.round(breite * Math.max(0, Math.min(1, anteil)))), hoch);
  }

  // Der Sammelpunkt des gewaehlten Gebaeudes: eine Fahne in Spielerfarbe und
  // eine gestrichelte Linie dorthin.
  /**
   * Das Zeichen am Ziel eines Befehls (bedienung AC-34): ein Ring auf dem
   * Boden, der zusammenlaeuft und verblasst. Weiss auf freiem Gelaende, rot
   * auf Feindlichem - und rot bekommt vier Haken nach innen, damit es nicht
   * nur an der Farbe haengt (jeder zwoelfte Mann sieht Rot und Gruen gleich).
   *
   * Gezeichnet wird ueber der Welt, nicht darunter: ein Ring unter der
   * getroffenen Einheit waere genau dann verdeckt, wenn er gebraucht wird.
   */
  zielzeichenZeichnen(e, jetzt) {
    const zeichen = this.zielzeichen;
    if (!zeichen) return;
    const t = (jetzt - zeichen.seit) / ZIELZEICHEN_DAUER;
    if (t > 1) {
      this.zielzeichen = null;
      return;
    }
    // Vor dem Beginn (negatives t) bleibt das erste Bild stehen - so laesst
    // sich der Augenblick fuer einen Nachweis anhalten.
    const lauf = Math.max(0, t);
    const stift = this.stift;
    const p = this.zuBild(zeichen.x, zeichen.y);
    const r = e * (1.6 - 0.9 * lauf);
    const sicht = lauf < 0.6 ? 1 : 1 - (lauf - 0.6) / 0.4;
    const farbe = zeichen.feindlich ? '#e23c2a' : zeichen.arbeit ? ARBEITSFARBE : '#ffffff';
    stift.save();
    stift.globalAlpha = sicht;
    stift.lineCap = 'round';
    if (zeichen.arbeit) {
      // Arbeit (bedienung AC-52): eine Raute um das, woran gearbeitet wird -
      // den Baum, die Baustelle, das Lager -, die sich darauf zusammenzieht.
      const halb = e * (zeichen.groesse || 1) * (1.5 - 0.45 * lauf);
      for (const [strich, breite] of [['rgba(20,16,12,0.75)', e * 0.16], [farbe, e * 0.09]]) {
        raute(stift, p.x, p.y, halb, halb / 2);
        stift.strokeStyle = strich;
        stift.lineWidth = Math.max(1.5, breite);
        stift.stroke();
      }
      stift.restore();
      return;
    }
    // Erst dunkel darunter, dann die Farbe: sonst verschwindet Weiss im Sand
    // und Rot im Schatten.
    for (const [strich, breite] of [['rgba(20,16,12,0.75)', e * 0.16], [farbe, e * 0.09]]) {
      stift.strokeStyle = strich;
      stift.lineWidth = Math.max(1.5, breite);
      stift.beginPath();
      stift.ellipse(p.x, p.y, r, r / 2, 0, 0, Math.PI * 2);
      stift.stroke();
      if (!zeichen.feindlich) continue;
      // Vier Haken, die auf das Ziel zeigen - oben, unten, links, rechts der Raute.
      stift.beginPath();
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const ax = p.x + dx * r * 1.45;
        const ay = p.y + dy * r * 0.72;
        stift.moveTo(ax, ay);
        stift.lineTo(p.x + dx * r * 1.05, p.y + dy * r * 0.52);
      }
      stift.stroke();
    }
    stift.restore();
  }

  /**
   * Vor dem Klick (bedienung AC-52): was ein Rechtsklick an der Stelle des
   * Zeigers taete - eine Marke um das Ziel und das Wort dazu am Zeiger. Nur,
   * wenn es mehr waere als ein Gang; rot fuer Angriff, golden fuer Arbeit.
   * Wer einen Dorfbewohner zum Holz schickt, sieht so vorher, ob er den Baum
   * trifft oder den Boden daneben.
   */
  zeigerZielZeichnen(e) {
    this.zeigerZiel = null;
    if (!this.zeigerDrin || !this.zeiger || this.platzieren || this.zug || this.angriffslauf) return;
    if (this.gewaehltesGebaeude || !this.ausgewaehlt.size) return;
    const ziel = this.zielUnter(this.zeiger.x, this.zeiger.y);
    if (ziel.art === 'gehen' || !ziel.text) return;
    this.zeigerZiel = ziel;
    const stift = this.stift;
    const p = this.zuBild(ziel.x, ziel.y);
    const feindlich = ziel.art === 'angreifen' || ziel.art === 'bekehren';
    const farbe = feindlich ? '#e23c2a' : ARBEITSFARBE;
    const halb = e * (ziel.groesse || 1);
    stift.save();
    stift.lineJoin = 'round';
    for (const [strich, breite] of [['rgba(20,16,12,0.7)', 4], [farbe, 2]]) {
      raute(stift, p.x, p.y, halb, halb / 2);
      stift.strokeStyle = strich;
      stift.lineWidth = breite;
      stift.stroke();
    }
    // Das Wort rechts unter dem Zeiger, im Bild gehalten.
    stift.font = '600 13px system-ui, sans-serif';
    stift.textBaseline = 'middle';
    stift.textAlign = 'left';
    const breite = stift.measureText(ziel.text).width + 16;
    const x = Math.min(this.leinwand.clientWidth - breite - 4, this.zeiger.x + 16);
    const y = Math.min(this.leinwand.clientHeight - 28, this.zeiger.y + 18);
    stift.fillStyle = 'rgba(15,18,22,0.88)';
    stift.beginPath();
    stift.roundRect(x, y, breite, 22, 5);
    stift.fill();
    stift.strokeStyle = farbe;
    stift.lineWidth = 1;
    stift.stroke();
    stift.fillStyle = '#f4f1ea';
    stift.fillText(ziel.text, x + 8, y + 11.5);
    stift.restore();
  }

  sammelpunktZeichnen(e) {
    const gebaeude = this.gewaehltesGebaeude && this.gebaeude.get(this.gewaehltesGebaeude);
    if (!gebaeude?.p) return;
    const stift = this.stift;
    const mitte = this.gebaeudeMitte(gebaeude);
    const von = this.zuBild(mitte.x, mitte.y);
    const bis = this.zuBild(gebaeude.p.x, gebaeude.p.y);
    const farbe = this.spieler.get(gebaeude.b)?.farbe || '#888888';
    stift.save();
    stift.setLineDash([6, 5]);
    stift.strokeStyle = 'rgba(255,255,255,0.7)';
    stift.lineWidth = 1.5;
    stift.beginPath();
    stift.moveTo(von.x, von.y);
    stift.lineTo(bis.x, bis.y);
    stift.stroke();
    stift.setLineDash([]);
    const h = e * 1.3;
    stift.strokeStyle = '#3a2c1f';
    stift.lineWidth = Math.max(1.5, e * 0.08);
    stift.beginPath();
    stift.moveTo(bis.x, bis.y);
    stift.lineTo(bis.x, bis.y - h);
    stift.stroke();
    stift.fillStyle = farbe;
    stift.strokeStyle = 'rgba(15,18,22,0.85)';
    stift.lineWidth = 1;
    stift.beginPath();
    stift.moveTo(bis.x, bis.y - h);
    stift.quadraticCurveTo(bis.x + e * 0.4, bis.y - h - e * 0.05, bis.x + e * 0.75, bis.y - h + e * 0.2);
    stift.quadraticCurveTo(bis.x + e * 0.4, bis.y - h + e * 0.32, bis.x, bis.y - h + e * 0.45);
    stift.closePath();
    stift.fill();
    stift.stroke();
    stift.fillStyle = 'rgba(0,0,0,0.3)';
    stift.beginPath();
    stift.ellipse(bis.x, bis.y, e * 0.25, e * 0.1, 0, 0, Math.PI * 2);
    stift.fill();
    stift.restore();
  }

  gebaeudeBild(gebaeude, p, e) {
    const spieler = this.spieler.get(gebaeude.b);
    const stift = this.stift;
    const { groesse } = this.gebaeudeMitte(gebaeude);
    // Balken, wenn ausgewaehlt oder beschaedigt - eine Baustelle hat ihren
    // Fortschritt in der Auswahlleiste und zaehlt hier nicht als beschaedigt.
    const lebenVoll = this.gebaeudeLebenVoll(gebaeude);
    const fertig = (gebaeude.u ?? 1) >= 1;
    const beschaedigt = fertig && lebenVoll && gebaeude.h < lebenVoll;
    const angesehen = this.siehtAn('g', gebaeude.i);
    if (lebenVoll && (this.gewaehltesGebaeude === gebaeude.i || angesehen || beschaedigt)) {
      const zeichnung = GEBAEUDE[gebaeude.art];
      const m = zeichnung ? (e * groesse * 0.95) / zeichnung.halbeBreite : e;
      // Knapp ueber dem Dach - die Trefferhoehe reicht bis zur Fahnenspitze, drei
      // Viertel davon sind der First (Runde 42: ganz oben deckte er den Namen zu).
      // Gerendert: knapp ueber dem, was im Bild wirklich deckt.
      const hoch = gebaeudeHoehe(gebaeude.art, e, groesse);
      const oben = hoch ?? (zeichnung?.flach ? e * groesse * 0.6 : (zeichnung?.trefferOben ?? 3) * m * 0.75);
      this.lebensbalken.push({
        art: 'gebaeude', i: gebaeude.i, x: p.x, y: p.y - oben - 4, breite: Math.round(Math.min(e * groesse * 0.6, 140)), anteil: (gebaeude.h ?? lebenVoll) / lebenVoll,
      });
    }
    if (this.gewaehltesGebaeude === gebaeude.i || angesehen) {
      // Ausgewaehlt: ein heller Rand um die Grundflaeche, wie die Ellipse bei
      // Figuren - gestrichelt, wenn es nur angesehen wird (bedienung AC-58).
      raute(stift, p.x, p.y, e * groesse, e * groesse / 2);
      stift.strokeStyle = '#ffffff';
      stift.lineWidth = 2;
      if (angesehen) stift.setLineDash([6, 5]);
      stift.stroke();
      stift.setLineDash([]);
    }
    const voll = this.werte.gebaeude[gebaeude.art]?.nahrung;
    const offen = Boolean(this.werte.gebaeude[gebaeude.art]?.tor) && this.torOffen(gebaeude);
    gebaeudeBildZeichnen(stift, gebaeude.art, p.x, p.y, e, spieler ? spieler.farbe : '#888888', groesse, gebaeude.u ?? 1, voll ? (gebaeude.n ?? voll) / voll : 1, offen, this.gebaeudeLage(gebaeude));
  }

  namenZeichnen(spieler) {
    if (this.kamera.zoom <= 0.6) return;
    const stift = this.stift;
    const p = this.zuBild(spieler.basis.x, spieler.basis.y);
    // Ueber der Fahne des Dorfzentrums - gerendert ueber seinem First.
    // Gerendert noch ein Stueck hoeher: knapp ueber dem First liegt der
    // Lebensbalken des gewaehlten Dorfzentrums.
    const hoch = gebaeudeHoehe('dorfzentrum', HALB_B * this.kamera.zoom, 4);
    let oben = p.y - (hoch === null ? HALB_B * 7.6 * this.kamera.zoom : hoch + 18) - 4;
    // Liegt dort der Lebensbalken eines Gebaeudes, steht der Name darueber -
    // gemessen am Balken selbst, nicht an einer zweiten Rechnung der Hoehe.
    for (const balken of this.lebensbalken) {
      if (balken.art !== 'gebaeude' || Math.abs(balken.x - p.x) > balken.breite / 2 + 30) continue;
      if (oben > balken.y - 22 && oben < balken.y + 14) oben = balken.y - 11;
    }
    // Unter der Kopfleiste stuende er ueber ihrer Schrift.
    if (oben < KOPFLEISTE) return;
    stift.font = '600 12px system-ui, sans-serif';
    stift.textAlign = 'center';
    stift.lineWidth = 3;
    stift.strokeStyle = '#0f1216';
    stift.strokeText(spieler.name, p.x, oben);
    stift.fillStyle = '#e6e9ee';
    stift.fillText(spieler.name, p.x, oben);
  }

  /**
   * Pfeile im Flug (bedienung AC-40): ein dunkler Schaft mit heller Fiederung,
   * auf einem flachen Bogen von der Brust des Schuetzen zur Brust des Ziels.
   * Was angekommen ist, faellt heraus.
   */
  /** Steht an diesem Punkt ein Gebaeude, das von oben schiesst? Seine Schusshoehe, sonst 0. */
  schussHoeheBei(x, y) {
    for (const g of this.gebaeude.values()) {
      const hoehe = GEBAEUDE[g.art]?.schussHoehe;
      if (!hoehe) continue;
      const m = this.gebaeudeMitte(g);
      if (Math.abs(m.x - x) < 0.3 && Math.abs(m.y - y) < 0.3) return hoehe;
    }
    return 0;
  }

  pfeileZeichnen(stift) {
    if (!this.pfeile.length) return;
    const jetzt = performance.now();
    this.pfeile = this.pfeile.filter((p) => jetzt - p.start < p.dauer);
    const zoom = this.kamera.zoom;
    const brust = this.figurenHoehe() * 0.55;
    const ort = (p, t) => {
      const x = p.x0 + (p.x1 - p.x0) * t;
      const y = p.y0 + (p.y1 - p.y0) * t;
      const b = this.zuBild(x, y);
      // Vom Turm faellt der Pfeil von seiner Hoehe bis auf Brusthoehe.
      const turm = (1 - t) * Math.max(0, (p.oben || 0) * HALB_B * zoom - brust);
      // Der Bogen: in der Mitte ein Viertel der Weite hoeher als die Enden,
      // ein Stein doppelt so hoch.
      const bogen = p.stein ? 0.5 : 0.25;
      return { x: b.x, y: b.y - brust - turm - Math.sin(Math.PI * t) * p.weite * bogen * HALB_H * zoom };
    };
    stift.save();
    stift.lineCap = 'round';
    for (const p of this.pfeile) {
      const t = Math.min(1, (jetzt - p.start) / p.dauer);
      if (p.stein) {
        // Ein grauer Brocken, oben links im Licht.
        const mitte = ort(p, t);
        const r = Math.max(2.6, 0.2 * HALB_B * zoom);
        const verlauf = stift.createRadialGradient(mitte.x - r * 0.35, mitte.y - r * 0.35, r * 0.1, mitte.x, mitte.y, r);
        verlauf.addColorStop(0, '#c9c4bb');
        verlauf.addColorStop(1, '#5f5a53');
        stift.fillStyle = verlauf;
        stift.strokeStyle = '#3a3631';
        stift.lineWidth = Math.max(0.8, r * 0.18);
        stift.beginPath();
        stift.arc(mitte.x, mitte.y, r, 0, Math.PI * 2);
        stift.fill();
        stift.stroke();
        continue;
      }
      const kopf = ort(p, t);
      const hinter = ort(p, Math.max(0, t - 0.06));
      const dx = kopf.x - hinter.x;
      const dy = kopf.y - hinter.y;
      const laenge = Math.hypot(dx, dy) || 1;
      const schaft = Math.max(9, 0.6 * HALB_B * zoom);
      const ux = dx / laenge;
      const uy = dy / laenge;
      const ende = { x: kopf.x - ux * schaft, y: kopf.y - uy * schaft };
      stift.strokeStyle = '#3b2a18';
      stift.lineWidth = Math.max(1.4, 0.09 * HALB_B * zoom);
      stift.beginPath();
      stift.moveTo(ende.x, ende.y);
      stift.lineTo(kopf.x, kopf.y);
      stift.stroke();
      // Fiederung hinten, hell.
      stift.strokeStyle = '#e8e0cc';
      stift.lineWidth = Math.max(1, 0.05 * HALB_B * zoom);
      const quer = { x: -uy, y: ux };
      const f = schaft * 0.18;
      for (const s of [1, -1]) {
        stift.beginPath();
        stift.moveTo(ende.x + ux * f, ende.y + uy * f);
        stift.lineTo(ende.x - ux * f * 0.2 + quer.x * f * s, ende.y - uy * f * 0.2 + quer.y * f * s);
        stift.stroke();
      }
    }
    stift.restore();
  }

  einheitZeichnen(einheit, alt, punkt) {
    const hoehe = this.figurenHoehe();
    const spieler = this.spieler.get(einheit.b);
    const stift = this.stift;

    // Blickrichtung aus der Bewegung im Bild; wer steht, schaut weiter dorthin,
    // wohin er zuletzt ging.
    const dx = alt ? (einheit.x - alt.x) - (einheit.y - alt.y) : 0;
    const laeuft = alt && Math.hypot(einheit.x - alt.x, einheit.y - alt.y) > 0.001;
    if (Math.abs(dx) > 0.001) this.blicke.set(einheit.i, dx < 0 ? -1 : 1);
    // Gerenderte Figuren kennen acht Richtungen statt zwei (darstellung AC-17).
    if (laeuft) this.richtungen.set(einheit.i, richtungAus(dx, ((einheit.x - alt.x) + (einheit.y - alt.y)) / 2));

    // Gefallen (kampf AC-10): liegt zwei Sekunden am Boden, blass und ohne
    // Ring - so sieht man, wer den Kampf verloren hat, bevor er verschwindet.
    if (einheit.s) {
      const art = this.arten[einheit.k] || 'dorfbewohner';
      if (gerendert(art)?.ablaeufe?.sterben) {
        // Gerendert faellt die Figur selbst (darstellung AC-19): der Ablauf
        // laeuft einmal, das letzte Bild bleibt liegen und verblasst. Der
        // Zustand sagt nur, dass sie gefallen ist - seit wann, merkt sich das
        // Bild, wenn es sie zum ersten Mal so sieht.
        const jetzt = performance.now();
        let seit = this.gefallen.get(einheit.i);
        if (seit === undefined) {
          seit = jetzt;
          if (this.gefallen.size > 300) this.gefallen.clear();
          this.gefallen.set(einheit.i, seit);
        }
        const anteil = (jetzt - seit) / (STERBEN_MS * this.taktdauer / 100);
        stift.save();
        stift.globalAlpha = 1 - 0.4 * Math.min(1, Math.max(0, anteil - 1));
        figurBildZeichnen(stift, art, punkt.x, punkt.y, hoehe, spieler ? spieler.farbe : '#888888', {
          richtung: this.richtungen.get(einheit.i),
          sterben: Math.min(1, anteil),
        });
        stift.restore();
        return;
      }
      stift.save();
      stift.globalAlpha = 0.65;
      // Gedreht um die Fuesse, bis der Koerper flach liegt, und ein Stueck
      // zur Seite gerueckt, damit er neben dem Platz liegt und nicht darauf.
      stift.translate(punkt.x + hoehe * 0.2, punkt.y + hoehe * 0.12);
      stift.rotate(-1.45);
      figurBildZeichnen(stift, this.arten[einheit.k] || 'dorfbewohner', 0, 0, hoehe, spieler ? spieler.farbe : '#888888', {
        blick: this.blicke.get(einheit.i) || 1,
        richtung: this.richtungen.get(einheit.i),
      });
      stift.restore();
      return;
    }

    const angesehen = this.siehtAn('e', einheit.i);
    if (this.ausgewaehlt.has(einheit.i) || angesehen) {
      // Die Auswahl liegt als Ellipse am Boden, unter den Fuessen. Was nur
      // angesehen wird (bedienung AC-58), traegt sie gestrichelt.
      stift.strokeStyle = '#ffffff';
      stift.lineWidth = 2;
      if (angesehen) stift.setLineDash([5, 4]);
      stift.beginPath();
      stift.ellipse(punkt.x, punkt.y, hoehe * 0.42, hoehe * 0.2, 0, 0, Math.PI * 2);
      stift.stroke();
      stift.setLineDash([]);
      // Darueber, ueber dem Kopf, das Leben.
      const voll = this.lebenVoll(einheit);
      if (voll) {
        this.lebensbalken.push({
          art: 'einheit', i: einheit.i, x: punkt.x, y: punkt.y - hoehe * (FIGUREN[this.arten[einheit.k]]?.oben ?? 1) - 5, breite: Math.max(16, Math.round(hoehe * 0.9)), anteil: (einheit.h ?? voll) / voll,
        });
      }
    }

    // Wer schlaegt, schaut auf den, den er schlaegt - nicht dorthin, wohin er
    // zuletzt ging.
    if (einheit.w && !laeuft) {
      this.schlagRichtung(einheit);
      this.schlagHoeren(einheit, punkt);
    }

    // Ein Dorfbewohner mit Ladung traegt sie sichtbar: Holzbuendel oder
    // Beerenkorb auf dem Ruecken (bedienung AC-16, darstellung AC-6).
    figurBildZeichnen(stift, this.arten[einheit.k] || 'dorfbewohner', punkt.x, punkt.y, hoehe, spieler ? spieler.farbe : '#888888', {
      blick: this.blicke.get(einheit.i) || 1,
      richtung: this.richtungen.get(einheit.i),
      ladung: einheit.l > 0 ? einheit.a : null,
      schritt: laeuft ? jetztPhase(einheit.i) : 0,
      // Wer arbeitet, bewegt sich dabei (bedienung AC-31).
      arbeit: einheit.w && !laeuft ? jetztPhase(einheit.i) : 0,
    });
    // Steht jemand hinter einem Gebaeude, kommt er danach als Umriss darueber.
    const decken = this.deckendeGebaeude(einheit, punkt);
    if (decken.length) this.verdeckte.push({ einheit, punkt, hoehe, laeuft, decken });
  }

  /**
   * Dreht eine gerenderte Figur, die schlaegt, zu ihrem Gegner. Der Zustand
   * nennt das Ziel nicht (nur `w`); genommen wird deshalb der naechste, der
   * ihr Gegner ist - Einheit oder Gebaeude. Gesucht wird hoechstens alle 300
   * Millisekunden je Einheit, nicht in jedem Bild.
   */
  schlagRichtung(einheit) {
    const art = this.arten[einheit.k];
    if (!gerendert(art)?.ablaeufe?.angreifen || !this.werte.einheiten[art]?.angriff) return;
    const jetzt = performance.now();
    const zuletzt = this.schlagblicke.get(einheit.i);
    if (zuletzt !== undefined && jetzt - zuletzt < 300) return;
    if (this.schlagblicke.size > 600) this.schlagblicke.clear();
    this.schlagblicke.set(einheit.i, jetzt);
    const team = this.teamVon(einheit.b);
    const gegner = (besitzer) => besitzer !== einheit.b && (!team || team !== this.teamVon(besitzer));
    let ziel = null;
    let naechster = Infinity;
    for (const anderer of this.nachher.values()) {
      if (anderer.s || !gegner(anderer.b)) continue;
      const abstand = Math.hypot(anderer.x - einheit.x, anderer.y - einheit.y);
      if (abstand < naechster) {
        naechster = abstand;
        ziel = anderer;
      }
    }
    for (const gebaeude of this.gebaeude.values()) {
      if (!gegner(gebaeude.b)) continue;
      const mitte = this.gebaeudeMitte(gebaeude);
      // Gemessen bis an den Rand: ein Dorfzentrum ist vier Felder breit.
      const abstand = Math.hypot(mitte.x - einheit.x, mitte.y - einheit.y) - mitte.groesse / 2;
      if (abstand < naechster) {
        naechster = abstand;
        ziel = mitte;
      }
    }
    // Weiter weg als jede Reichweite: dann schlaegt sie etwas, das hier nicht
    // zu sehen ist, und bleibt, wie sie steht.
    if (!ziel || naechster > 12) return;
    const dx = ziel.x - einheit.x;
    const dy = ziel.y - einheit.y;
    if (Math.abs(dx) + Math.abs(dy) < 0.01) return;
    this.richtungen.set(einheit.i, richtungAus(dx - dy, (dx + dy) / 2));
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
