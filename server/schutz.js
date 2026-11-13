// @ts-check
'use strict';

// Grenzen, die vor jeder Anmeldung greifen. Ein Fremder, der Raumcodes
// durchprobiert, will gar kein Konto - er kostet trotzdem Verbindungen,
// Handshakes und Rechenzeit. Dagegen hilft nur zaehlen und zumachen.

const VORGABE = {
  verbindungenJeAdresse: 8,        // gleichzeitig offen
  verbindungenJeMinute: 20,        // neue Verbindungen je Adresse
  nachrichtenJeSekunde: 25,        // je Verbindung, kurze Spitzen erlaubt
  nachrichtenSpitze: 60,
  fehlversucheJeMinute: 5,         // falsche Raumcodes je Adresse
  raeumeGesamt: 50,                // gleichzeitig laufende Partien
  raeumeJeAdresse: 3,
  rechnungenJeMinute: 12,          // teure Anfragen je Adresse, etwa eine Saison
  zuegeJeMinute: 240,              // Zuege in einem rundenbasierten Spiel
};

// Tropfender Eimer: `stand` fuellt sich mit `jeSekunde` wieder auf, jede
// Handlung kostet einen Tropfen. Leerer Eimer heisst: zu schnell.
class Eimer {
  constructor(jeSekunde, spitze, jetzt) {
    this.jeSekunde = jeSekunde;
    this.spitze = spitze;
    this.stand = spitze;
    this.letzte = jetzt;
  }

  nimm(jetzt) {
    this.stand = Math.min(this.spitze, this.stand + ((jetzt - this.letzte) / 1000) * this.jeSekunde);
    this.letzte = jetzt;
    if (this.stand < 1) return false;
    this.stand -= 1;
    return true;
  }

  // Wieder voll? Muss die verstrichene Zeit mitrechnen - sonst gilt ein Eimer,
  // aus dem einmal genommen wurde, nie wieder als unberuehrt.
  voll(jetzt) {
    const stand = Math.min(this.spitze, this.stand + ((jetzt - this.letzte) / 1000) * this.jeSekunde);
    return stand >= this.spitze;
  }
}

class Schutz {
  constructor(einstellungen = {}, uhr = () => Date.now()) {
    this.werte = { ...VORGABE, ...einstellungen };
    this.uhr = uhr;
    this.adressen = new Map(); // ip -> { offen, neue, fehler, raeume }
    this.raeumeGesamt = 0;
    this.aufraeumer = setInterval(() => this.aufraeumen(), 60 * 1000);
    this.aufraeumer.unref?.();
  }

  eintrag(adresse) {
    let vorhanden = this.adressen.get(adresse);
    if (!vorhanden) {
      const jetzt = this.uhr();
      vorhanden = {
        offen: 0,
        raeume: 0,
        neue: new Eimer(this.werte.verbindungenJeMinute / 60, this.werte.verbindungenJeMinute, jetzt),
        rechnung: new Eimer(this.werte.rechnungenJeMinute / 60, this.werte.rechnungenJeMinute, jetzt),
        zug: new Eimer(this.werte.zuegeJeMinute / 60, this.werte.zuegeJeMinute, jetzt),
        fehler: new Eimer(this.werte.fehlversucheJeMinute / 60, this.werte.fehlversucheJeMinute, jetzt),
      };
      this.adressen.set(adresse, vorhanden);
    }
    return vorhanden;
  }

  // Vor dem Handshake: lohnt sich diese Verbindung ueberhaupt?
  verbindungErlaubt(adresse) {
    const eintrag = this.eintrag(adresse);
    if (eintrag.offen >= this.werte.verbindungenJeAdresse) {
      return { ok: false, grund: 'zu viele Verbindungen' };
    }
    if (!eintrag.neue.nimm(this.uhr())) {
      return { ok: false, grund: 'zu schnell hintereinander' };
    }
    return { ok: true };
  }

  verbindungOffen(adresse) {
    this.eintrag(adresse).offen += 1;
  }

  verbindungZu(adresse) {
    const eintrag = this.adressen.get(adresse);
    if (eintrag) eintrag.offen = Math.max(0, eintrag.offen - 1);
  }

  // Je Verbindung ein eigener Eimer - eine laute Verbindung soll die anderen
  // derselben Adresse nicht mitreissen.
  eimerFuerVerbindung() {
    return new Eimer(this.werte.nachrichtenJeSekunde, this.werte.nachrichtenSpitze, this.uhr());
  }

  nachrichtErlaubt(eimer) {
    return eimer.nimm(this.uhr());
  }

  // Ein falscher Raumcode. Wer die Bremse ausloest, wird getrennt - das ist
  // der einzige Weg, das Durchprobieren teuer zu machen.
  fehlversuch(adresse) {
    return this.eintrag(adresse).fehler.nimm(this.uhr());
  }

  // Eine Anfrage, die den Server rechnen laesst statt nur eine Datei zu
  // schicken. Eine Saison sind 306 Begegnungen - billig genug fuer einen
  // Aufruf, teuer genug fuer tausend.
  rechnenErlaubt(adresse) {
    return this.eintrag(adresse).rechnung.nimm(this.uhr());
  }

  // Ein Zug in einem rundenbasierten Spiel: aufstellen, kaufen, einen
  // Spieltag rechnen. Billiger als eine Saison, haeufiger als ein Raum.
  zugErlaubt(adresse) {
    return this.eintrag(adresse).zug.nimm(this.uhr());
  }

  raumErlaubt(adresse) {
    if (this.raeumeGesamt >= this.werte.raeumeGesamt) {
      return { ok: false, grund: 'Der Server ist ausgelastet. Bitte spaeter noch einmal.' };
    }
    if (this.eintrag(adresse).raeume >= this.werte.raeumeJeAdresse) {
      return { ok: false, grund: 'Zu viele offene Partien von diesem Anschluss.' };
    }
    return { ok: true };
  }

  raumAuf(adresse) {
    this.raeumeGesamt += 1;
    this.eintrag(adresse).raeume += 1;
  }

  raumZu(adresse) {
    this.raeumeGesamt = Math.max(0, this.raeumeGesamt - 1);
    const eintrag = this.adressen.get(adresse);
    if (eintrag) eintrag.raeume = Math.max(0, eintrag.raeume - 1);
  }

  // Adressen, die nichts mehr offen haben und deren Eimer wieder voll sind,
  // muessen nicht gemerkt werden - sonst waechst die Liste unbegrenzt.
  aufraeumen() {
    const jetzt = this.uhr();
    for (const [adresse, eintrag] of this.adressen) {
      if (eintrag.offen === 0 && eintrag.raeume === 0
        && eintrag.neue.voll(jetzt) && eintrag.fehler.voll(jetzt)
        && eintrag.rechnung.voll(jetzt) && eintrag.zug.voll(jetzt)) {
        this.adressen.delete(adresse);
      }
    }
  }

  halt() {
    clearInterval(this.aufraeumer);
    this.adressen.clear();
  }
}

// Hinter einem Reverse Proxy ist remoteAddress immer der Proxy. Der
// weitergereichte Kopf wird nur geglaubt, wenn wir ihn ausdruecklich
// einschalten - sonst faelscht ihn jeder selbst.
function adresseVon(anfrage, hinterProxy) {
  if (hinterProxy) {
    const kopf = anfrage.headers['x-forwarded-for'];
    if (typeof kopf === 'string' && kopf.length) return kopf.split(',')[0].trim();
  }
  return anfrage.socket?.remoteAddress || 'unbekannt';
}

module.exports = { Schutz, Eimer, adresseVon, VORGABE };
