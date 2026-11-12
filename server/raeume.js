'use strict';

const { randomUUID, randomInt } = require('node:crypto');
// Kein Spiel wird hier geladen: der Raum bekommt den Steckbrief des Spiels
// beim Anlegen (→ specs/00-plattform/raeume.md AC-16, ADR-0006).
const partieEinstellungen = require('./spiele/einstellungen');

const MAX_SPIELER = 6;
const MIN_SPIELER = 2;
const NAME_MAX = 20;
// Ohne Vokale und ohne 0/O/1/I - der Code wird vorgelesen und abgetippt.
const ZEICHEN = 'BCDFGHJKLMNPQRSTVWXZ23456789';
// Sechs Zeichen aus 28 sind 481.890.304 Moeglichkeiten. Vier waeren 614.656
// gewesen - mit der Bremse aus schutz.js zwar auch sicher, aber ein Riegel,
// der nichts kostet, gehoert vorgelegt.
const CODE_LAENGE = 6;
const LEERLAUF_MS = 30 * 60 * 1000;

function codeErzeugen() {
  let code = '';
  for (let i = 0; i < CODE_LAENGE; i++) code += ZEICHEN[randomInt(ZEICHEN.length)];
  return code;
}

// Vorgelesen wird in zwei Dreiergruppen: KRN-4TZ. Eingetippt darf er mit
// Bindestrich, mit Leerzeichen oder ganz ohne ankommen.
function codeZeigen(code) {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

function codeLesen(eingabe) {
  return String(eingabe || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Plaetze, die das Spiel selbst besetzt - Computergegner (→ specs/00-plattform/
// spielauswahl.md AC-18, AC-19). Der Raum weiss nicht, was dort sitzt; er
// zaehlt nur mit. Die Untergrenze von zwei gilt fuer Plaetze, nicht fuer
// Menschen.
function vomSpielBesetzt(spiel, einstellungen) {
  if (!spiel || typeof spiel.plaetze !== 'function') return 0;
  // Was keine ganze Zahl ab 0 ist, zaehlt als keiner: ein fehlerhafter
  // Steckbrief darf weder jeden Raum sperren (NaN) noch mehr Menschen
  // hereinlassen, als Plaetze da sind (negativ). Durchsicht Runde 101.
  const besetzt = spiel.plaetze(einstellungen);
  return Number.isInteger(besetzt) && besetzt >= 0 ? besetzt : 0;
}

// Takte je echte Sekunde: eine Zahl im Steckbrief oder eine Funktion der
// Einstellungen (spielziel AC-23). Was keine ganze Zahl von 1 bis 60 ist,
// wird dorthin gezogen - eine Uhr mit NaN oder 0 liefe nie oder ohne Ende.
function takteJeSekunde(spiel, einstellungen) {
  const roh = typeof spiel.takte === 'function' ? spiel.takte(einstellungen) : spiel.takte;
  const zahl = Math.round(Number(roh));
  return Number.isFinite(zahl) ? Math.max(1, Math.min(60, zahl)) : 1;
}

// Passen Menschen und vom Spiel besetzte Plaetze unter die Hoechstzahl?
function plaetzePruefen(spiel, einstellungen, menschen = 1) {
  const gesamt = Math.min(MAX_SPIELER, einstellungen.spieler || MAX_SPIELER);
  const besetzt = vomSpielBesetzt(spiel, einstellungen);
  if (menschen + besetzt <= gesamt) return null;
  return {
    fehler: besetzt
      ? `Höchstens ${gesamt} Spieler: ${besetzt} Computergegner und ${menschen} ${menschen === 1 ? 'Mensch' : 'Menschen'} passen nicht hinein.`
      : `Es sind schon ${menschen} Spieler im Raum.`,
  };
}

// Die Plaetze, die das Spiel besetzt, heissen im Raum `platz1`, `platz2` ...
// - Menschen tragen ihre Id. Mit diesem Schluessel kommt die Wahl je Platz
// beim Start zum Spiel (spielauswahl AC-22); was dort sitzt, weiss nur das
// Spiel.
function spielplatz(nummer) {
  return `platz${nummer}`;
}

function namePruefen(name) {
  const sauber = String(name || '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
  return sauber || 'Namenlos';
}

class Raum {
  constructor(code, spiel = null) {
    this.code = code;
    this.spieler = []; // { id, name, token, draht, verbunden }
    // Der Steckbrief (server/spiele/<art>/steckbrief.js). Von ihm braucht der
    // Raum genau zwei Dinge: erzeugen(spieler, einstellungen) und takte.
    this.spiel = spiel;
    this.welt = null;
    this.zeitraffer = 1;
    this.uhr = null;
    this.beruehrt = Date.now();
    this.art = spiel ? spiel.art : null;
    // Die geprueften Werte aus server/spiele/einstellungen.js. `spieler`
    // begrenzt den Raum; alles andere gehoert dem Spiel.
    this.einstellungen = {};
    // Die Beschreibung aus dem Steckbrief - fuer die Anzeige im Warteraum und
    // zum Pruefen spaeterer Aenderungen.
    this.einstellungsliste = [];
    // Die Wahl je Platz (spielauswahl AC-22): { <platz>: { <schluessel>: wert } }.
    // Was die Schluessel bedeuten - beim Strategiespiel das Team -, weiss nur
    // das Spiel; der Raum prueft sie wie Einstellungen und reicht sie durch.
    this.platzwahl = {};
  }

  // Was je Platz gewaehlt wird, aus dem Steckbrief (`jePlatz`). Leer: nichts.
  get platzliste() {
    return (this.spiel && this.spiel.jePlatz) || [];
  }

  // Alle Plaetze, die Menschen zuerst, dann die des Spiels.
  get plaetze() {
    const besetzt = vomSpielBesetzt(this.spiel, this.einstellungen);
    const name = (nummer) => (this.spiel && typeof this.spiel.platzname === 'function' ? this.spiel.platzname(nummer) : `Platz ${nummer}`);
    return [
      ...this.spieler.map((s) => ({ platz: s.id, name: s.name, mensch: true })),
      ...Array.from({ length: besetzt }, (_, i) => ({ platz: spielplatz(i + 1), name: name(i + 1), mensch: false })),
    ];
  }

  // Die Wahl eines Platzes; was nie gewaehlt wurde, hat die Vorgaben.
  wahlVon(platz) {
    return this.platzwahl[platz] || partieEinstellungen.pruefen(this.platzliste, {}).werte;
  }

  // Ein Mensch waehlt fuer seinen eigenen Platz, der Gastgeber fuer jeden -
  // auch fuer die des Spiels. Bis zum Start, wie die Einstellungen (AC-10).
  waehlen(wer, platz, aenderung) {
    if (this.gestartet) return { fehler: 'Die Partie läuft schon.' };
    if (!this.platzliste.length) return { fehler: 'In diesem Spiel gibt es je Platz nichts zu wählen.' };
    if (!this.plaetze.some((p) => p.platz === platz)) return { fehler: 'Diesen Platz gibt es nicht.' };
    if (wer !== this.gastgeber && wer.id !== platz) return { fehler: 'Für andere Plätze wählt nur der Gastgeber.' };
    if (!aenderung || typeof aenderung !== 'object' || Array.isArray(aenderung)) {
      return { fehler: 'Die Wahl ist unverständlich.' };
    }
    const geprueft = partieEinstellungen.pruefen(this.platzliste, { ...this.wahlVon(platz), ...aenderung });
    if (geprueft.fehler) return geprueft;
    this.platzwahl[platz] = geprueft.werte;
    this.beruehrt = Date.now();
    return {};
  }

  get gastgeber() {
    return this.spieler[0] || null;
  }

  // Nur der Gastgeber, nur vor dem Start (→ spielauswahl AC-10). Geaendert
  // wird, was mitkommt; der Rest bleibt, wie er war.
  einstellen(wer, aenderung) {
    if (this.gestartet) return { fehler: 'Die Partie läuft schon.' };
    if (wer !== this.gastgeber) return { fehler: 'Nur der Gastgeber ändert die Einstellungen.' };
    if (!aenderung || typeof aenderung !== 'object' || Array.isArray(aenderung)) {
      return { fehler: 'Die Einstellungen sind unverständlich.' };
    }
    const geprueft = partieEinstellungen.pruefen(this.einstellungsliste, { ...this.einstellungen, ...aenderung });
    if (geprueft.fehler) return geprueft;
    const platz = plaetzePruefen(this.spiel, geprueft.werte, this.spieler.length);
    if (platz) return platz;
    this.einstellungen = geprueft.werte;
    this.beruehrt = Date.now();
    return {};
  }

  // Wie viele Menschen beitreten koennen: die Plaetze, abzueglich derer, die
  // das Spiel selbst besetzt.
  get hoechstens() {
    return Math.min(MAX_SPIELER, this.einstellungen.spieler || MAX_SPIELER) - vomSpielBesetzt(this.spiel, this.einstellungen);
  }

  get gestartet() {
    return this.welt !== null;
  }

  beitreten(name, draht) {
    if (this.gestartet) return { fehler: 'Die Partie läuft schon.' };
    if (this.spieler.length >= this.hoechstens) return { fehler: 'Der Raum ist voll.' };
    const spieler = {
      id: randomUUID().slice(0, 8),
      name: namePruefen(name),
      token: randomUUID(),
      draht,
      verbunden: true,
    };
    this.spieler.push(spieler);
    this.beruehrt = Date.now();
    return { spieler };
  }

  // Nach einem Absturz kommt derselbe Spieler mit seinem Token zurueck und
  // bekommt seine Einheiten wieder. Das ist die einzige Kennung, die es gibt,
  // und sie ueberlebt die Partie nicht.
  zurueckkehren(token, draht) {
    const spieler = this.spieler.find((s) => s.token === token);
    if (!spieler) return null;
    if (spieler.draht && spieler.draht !== draht) spieler.draht.close();
    spieler.draht = draht;
    spieler.verbunden = true;
    this.beruehrt = Date.now();
    return spieler;
  }

  verlassen(draht) {
    const spieler = this.spieler.find((s) => s.draht === draht);
    if (!spieler) return;
    spieler.verbunden = false;
    spieler.draht = null;
    // Vor dem Start gibt es nichts zu bewahren - der Platz wird sofort frei,
    // samt seiner Wahl.
    if (!this.gestartet) {
      this.spieler = this.spieler.filter((s) => s !== spieler);
      delete this.platzwahl[spieler.id];
    }
    this.beruehrt = Date.now();
  }

  get leer() {
    return this.spieler.every((s) => !s.verbunden) || this.spieler.length === 0;
  }

  // Ein **zweiter** Start desselben Raums ist die Revanche (→ spielziel AC-9):
  // dieselben Leute, dieselben Einstellungen, eine neue Partie - und niemand
  // tippt einen Code. Erlaubt ist er nur, wenn `welt.vorbei` es sagt; waehrend
  // die Partie laeuft, waere er ein Weg, eine verlorene Stellung wegzuwerfen.
  // **Was** eine Partie beendet, weiss weiterhin nur das Spiel (ADR-0006) -
  // der Raum fragt bloss.
  starten(startwert) {
    if (this.gestartet && !this.welt.vorbei) return { fehler: 'Die Partie läuft schon.' };
    // Wer die Verbindung verloren hat, spielt die Revanche nicht mit: sein
    // Platz waere ein Gegner, der nichts tut. Waehrend einer laufenden Partie
    // bleibt er stehen (damit er mit seinem Token zurueckkehren kann) - hier
    // beginnt eine neue, und dafuer gilt dieselbe Regel wie fuer den ersten
    // Start: es spielt, wer da ist.
    if (this.gestartet) this.spieler = this.spieler.filter((s) => s.verbunden);
    if (this.spieler.length + vomSpielBesetzt(this.spiel, this.einstellungen) < MIN_SPIELER) {
      return { fehler: `Es fehlen Mitspieler - mindestens ${MIN_SPIELER}.` };
    }
    if (!this.spiel) return { fehler: 'Dieser Raum hat kein Spiel.' };
    // Die Uhr der vorigen Partie steht schon (`beenden` lief mit dem Ende),
    // aber zwei Uhren auf einem Raum waere der Fehler, den niemand mehr
    // findet: lieber einmal zu oft abgeraeumt.
    this.beenden();
    // Die Wahl je Platz geht mit, nur fuer Plaetze, die es gibt - ein
    // Gegner, den der Gastgeber wieder abbestellt hat, hat kein Team mehr.
    const jePlatz = this.platzliste.length
      ? { jePlatz: Object.fromEntries(this.plaetze.map((p) => [p.platz, this.wahlVon(p.platz)])) }
      : {};
    this.welt = this.spiel.erzeugen(
      this.spieler.map((s) => ({ id: s.id, name: s.name })),
      { ...this.einstellungen, startwert, ...jePlatz },
    );
    // Je Spieler, wenn das Spiel das anbietet (kampf AC-13): jeder bekommt
    // nur, was er sieht. Was das heisst, weiss nur das Spiel (ADR-0006).
    this.sendenJe((id) => (this.welt.aufbauFuer ? this.welt.aufbauFuer(id) : this.welt.aufbau()));
    // Wie viele Takte je echte Sekunde - eine Zahl oder, je nach
    // Einstellungen, eine Funktion des Steckbriefs (spielziel AC-23). Was
    // sie bedeuten, weiss nur das Spiel.
    this.jeSekunde = takteJeSekunde(this.spiel, this.einstellungen);
    this.beginn = Date.now();
    this.gerechnet = 0;
    this.uhr = setInterval(() => this.schlag(), 1000 / this.jeSekunde);
    this.beruehrt = Date.now();
    return {};
  }

  schlag() {
    // Gerechnet wird nach der Wanduhr, nicht nach der Zahl der Schlaege:
    // `setInterval` mit 66,7 ms kommt jedes Mal etwas spaet, und ueber eine
    // Minute fehlten sonst Sekunden (spielziel AC-23: hoechstens einen Takt
    // daneben). Ein Schlag holt nach, was faellig ist - nach einem Stocken
    // aber hoechstens eine Sekunde, damit das Spiel nicht davonrennt.
    const soll = Math.floor(((Date.now() - this.beginn) * this.jeSekunde) / 1000);
    if (soll - this.gerechnet > this.jeSekunde) this.gerechnet = soll - this.jeSekunde;
    const faellig = soll - this.gerechnet;
    if (faellig <= 0) return;
    this.gerechnet = soll;
    // Der Zeitraffer ist ein Pruefgriff: Tests setzen ihn, damit eine Minute
    // Spiel keine Minute Warten kostet. Im Betrieb bleibt er 1.
    for (let i = 0; i < faellig * this.zeitraffer; i++) {
      this.welt.takten();
      if (this.welt.vorbei) break;
    }
    if (this.welt.zustandJeSpieler) {
      const je = this.welt.zustandJeSpieler(this.spieler.map((s) => s.id));
      this.sendenJe((id) => je.get(id));
    } else {
      this.senden(this.welt.zustand());
    }
    // `vorbei` gehoert zur Form dessen, was `erzeugen` liefert, nicht zu
    // einem einzelnen Spiel (ADR-0006): sagt es, die Partie sei entschieden,
    // haelt der Raum seine Uhr an. **Was** entscheidet, weiss nur das Spiel -
    // der Raum fragt bloss. Der letzte Zustand ist schon unterwegs und traegt
    // das Ergebnis.
    if (this.welt.vorbei) this.beenden();
  }

  beenden() {
    if (this.uhr) clearInterval(this.uhr);
    this.uhr = null;
  }

  vorraum() {
    return {
      typ: 'raum',
      code: this.code,
      gestartet: this.gestartet,
      art: this.art,
      gastgeber: this.gastgeber ? this.gastgeber.id : null,
      einstellungen: this.einstellungsliste.map((e) => ({ ...e, wert: this.einstellungen[e.schluessel] })),
      spieler: this.spieler.map((s) => ({ id: s.id, name: s.name, verbunden: s.verbunden })),
      // Je Platz, was gewaehlt ist (spielauswahl AC-22) - alle sehen es.
      jePlatz: this.platzliste,
      plaetze: this.plaetze.map((p) => ({ ...p, wahl: this.wahlVon(p.platz) })),
    };
  }

  senden(nachricht) {
    const text = JSON.stringify(nachricht);
    for (const spieler of this.spieler) {
      if (spieler.draht && spieler.draht.readyState === 1) spieler.draht.send(text);
    }
  }

  // Jedem seine eigene Nachricht (kampf AC-13).
  sendenJe(nachrichtFuer) {
    for (const spieler of this.spieler) {
      if (spieler.draht && spieler.draht.readyState === 1) spieler.draht.send(JSON.stringify(nachrichtFuer(spieler.id)));
    }
  }
}

class Raeume {
  constructor() {
    this.nachCode = new Map();
    this.beimSchliessen = null;
    this.aufraeumer = setInterval(() => this.aufraeumen(), 60 * 1000);
    this.aufraeumer.unref?.();
  }

  anlegen(spiel = null) {
    let code = codeErzeugen();
    while (this.nachCode.has(code)) code = codeErzeugen();
    const raum = new Raum(code, spiel);
    this.nachCode.set(code, raum);
    return raum;
  }

  finden(code) {
    return this.nachCode.get(codeLesen(code)) || null;
  }

  schliessen(raum) {
    if (!this.nachCode.has(raum.code)) return;
    raum.beenden();
    this.nachCode.delete(raum.code);
    // Der Schutz muss auch dann mitzaehlen, wenn ein Raum von selbst
    // verfaellt und nicht, weil jemand ihn verlassen hat.
    this.beimSchliessen?.(raum);
  }

  // Raeume, in denen niemand mehr sitzt, kosten sonst dauerhaft Rechenzeit.
  aufraeumen() {
    const jetzt = Date.now();
    for (const raum of [...this.nachCode.values()]) {
      if (raum.leer && jetzt - raum.beruehrt > 60 * 1000) this.schliessen(raum);
      else if (jetzt - raum.beruehrt > LEERLAUF_MS) this.schliessen(raum);
    }
  }

  halt() {
    clearInterval(this.aufraeumer);
    for (const raum of this.nachCode.values()) raum.beenden();
    this.nachCode.clear();
  }
}

module.exports = {
  Raeume, Raum, codeErzeugen, codeZeigen, codeLesen, namePruefen, spielplatz,
  MAX_SPIELER, MIN_SPIELER, CODE_LAENGE, ZEICHEN, plaetzePruefen,
};
