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
    if (Number.isInteger(geprueft.werte.spieler) && geprueft.werte.spieler < this.spieler.length) {
      return { fehler: `Es sind schon ${this.spieler.length} Spieler im Raum.` };
    }
    this.einstellungen = geprueft.werte;
    this.beruehrt = Date.now();
    return {};
  }

  get hoechstens() {
    return Math.min(MAX_SPIELER, this.einstellungen.spieler || MAX_SPIELER);
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
    // Vor dem Start gibt es nichts zu bewahren - der Platz wird sofort frei.
    if (!this.gestartet) this.spieler = this.spieler.filter((s) => s !== spieler);
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
    if (this.spieler.length < MIN_SPIELER) {
      return { fehler: `Es fehlen Mitspieler - mindestens ${MIN_SPIELER}.` };
    }
    if (!this.spiel) return { fehler: 'Dieser Raum hat kein Spiel.' };
    // Die Uhr der vorigen Partie steht schon (`beenden` lief mit dem Ende),
    // aber zwei Uhren auf einem Raum waere der Fehler, den niemand mehr
    // findet: lieber einmal zu oft abgeraeumt.
    this.beenden();
    this.welt = this.spiel.erzeugen(
      this.spieler.map((s) => ({ id: s.id, name: s.name })),
      { ...this.einstellungen, startwert },
    );
    this.senden(this.welt.aufbau());
    this.uhr = setInterval(() => this.schlag(), 1000 / this.spiel.takte);
    this.beruehrt = Date.now();
    return {};
  }

  schlag() {
    // Der Zeitraffer ist ein Pruefgriff: Tests setzen ihn, damit eine Minute
    // Spiel keine Minute Warten kostet. Im Betrieb bleibt er 1.
    for (let i = 0; i < this.zeitraffer; i++) this.welt.takten();
    this.senden(this.welt.zustand());
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
    };
  }

  senden(nachricht) {
    const text = JSON.stringify(nachricht);
    for (const spieler of this.spieler) {
      if (spieler.draht && spieler.draht.readyState === 1) spieler.draht.send(text);
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
  Raeume, Raum, codeErzeugen, codeZeigen, codeLesen, namePruefen,
  MAX_SPIELER, MIN_SPIELER, CODE_LAENGE, ZEICHEN,
};
