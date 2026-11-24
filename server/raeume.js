// @ts-check
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
// Anhalten (speichern AC-20): sitzen mehrere Menschen in der Partie, ist es
// begrenzt - zweimal je Spieler und Partie, hoechstens fuenf Minuten am Stueck.
const PAUSE_MS = 5 * 60 * 1000;
const PAUSEN_JE_SPIELER = 2;
// Sichern (speichern AC-3): eine laufende Partie legt jede Minute ihren Stand
// am Konto des Eroeffnenden ab - ein Absturz kostet hoechstens eine Minute.
const SICHERN_MS = 60 * 1000;
// Wegklicken ist Anhalten (speichern AC-8): sitzt ein Mensch allein in der
// Partie und ist zwei Minuten fort, wird gesichert und der Raum geschlossen -
// er setzt aus der Liste fort, nicht mit dem alten Code (AC-9). Zu mehreren
// bleibt es bei der halben Stunde (raeume AC-17): dort wartet die Partie auf
// die anderen, und gemeinsam fortsetzen kommt erst mit S4.
const WEG_MS = 2 * 60 * 1000;

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
    // Angehalten (speichern AC-19): { von, name, bis } - `bis` ist die
    // Wanduhr, zu der die Partie von selbst weiterlaeuft, oder null.
    this.pause = null;
    this.pausen = {}; // Spieler -> wie oft er in dieser Partie angehalten hat
    this.pauseMs = PAUSE_MS;
    // Sichern (speichern AC-3, AC-4, ADR-0017): die Ablage bekommt der Raum
    // von `Raeume`, den Stand selbst schreibt das Spiel (`sichern()` an dem,
    // was `erzeugen` liefert) - was darin steht, weiss der Raum nicht.
    // Das Konto, das eroeffnet hat - setzt `index.js` nach der Anmeldung.
    /** @type {string | null} */
    this.eigentuemer = null;
    /** @type {InstanceType<typeof import('./partiestaende').Partiestaende> | null} */
    this.ablage = null;
    this.sichernMs = SICHERN_MS;
    this.gesichertUm = 0;
    this.standId = null;
    // Gab es den Stand nicht mehr (geloescht) oder war am Konto kein Platz,
    // wird fuer diese Partie nichts mehr abgelegt - sonst kaeme ein
    // geloeschter Stand jede Minute wieder.
    this.ohneStand = false;
    // Warum nicht gesichert wird - der Satz, den der Gastgeber sieht (AC-27).
    /** @type {string | null} */
    this.ohneStandGrund = null;
    this.ohneStandGesagt = false;
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

  // Wer eine gesicherte Partie fortsetzt, sitzt auf seinem alten Platz
  // (speichern AC-9): die Id steht im Stand, das Spiel kennt ihn darunter.
  // Ein neues Token - das alte gehoerte zum alten Raum.
  /** @param {string} id @param {string} name */
  aufnehmen(id, name, draht) {
    if (this.gestartet) return { fehler: 'Die Partie läuft schon.' };
    const spieler = { id, name: namePruefen(name), token: randomUUID(), draht, verbunden: true };
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
    // Geht der letzte Mensch, steht gleich die Uhr: der Stand von jetzt, nicht
    // der von bis zu einer Minute vorher (speichern AC-4).
    if (this.leer) this.sichern();
  }

  get leer() {
    return this.spieler.every((s) => !s.verbunden) || this.spieler.length === 0;
  }

  /** Laeuft hier eine Partie, die noch nicht entschieden ist? */
  get laeuft() {
    return Boolean(this.gestartet && !this.welt.vorbei);
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
    // Eine neue Partie, auch die Revanche, beginnt ohne Pause und mit vollem
    // Vorrat an Pausen.
    this.pause = null;
    this.pausen = {};
    // Eine neue Partie hat noch keinen Stand - auch die Revanche nicht.
    this.standId = null;
    this.ohneStand = false;
    this.ohneStandGrund = null;
    this.ohneStandGesagt = false;
    this.gesichertUm = Date.now();
    this.uhr = setInterval(() => this.schlag(), 1000 / this.jeSekunde);
    this.beruehrt = Date.now();
    this.platzPruefen();
    return {};
  }

  // ---- Fortsetzen (speichern AC-9 bis AC-11) --------------------------------
  // Ein neuer Raum mit neuem Code nimmt die geladene Partie auf (AC-9). Er
  // beginnt angehalten: wer fortsetzt, sieht erst, wo er steht, und spielt
  // weiter, wenn er "Weiter" sagt (ADR-0017). Der Stand bleibt derselbe -
  // jedes Sichern ersetzt ihn, statt einen zweiten anzulegen.
  /**
   * @param {any} welt   was `laden` im Steckbrief lieferte
   * @param {string} standId
   * @param {{ id: string, name: string }} wer
   */
  fortsetzenMit(welt, standId, wer) {
    if (this.gestartet) return { fehler: 'Die Partie läuft schon.' };
    this.welt = welt;
    this.sendenJe((id) => (this.welt.aufbauFuer ? this.welt.aufbauFuer(id) : this.welt.aufbau()));
    // Die Partie steht gleich nach dem Laden (AC-9) - `schlag` schickt dann
    // nichts. Ein Zustand jetzt, sonst saehe man bis "Weiter" eine leere Karte.
    this.zustandSenden();
    this.jeSekunde = takteJeSekunde(this.spiel, this.einstellungen);
    this.beginn = Date.now();
    this.gerechnet = 0;
    this.pausen = {};
    // Allein gegen den Computer: ohne Frist (AC-20).
    this.pause = { von: wer.id, name: wer.name, bis: this.spieler.length > 1 ? Date.now() + this.pauseMs : null };
    this.standId = standId;
    this.ohneStand = false;
    this.ohneStandGrund = null;
    this.ohneStandGesagt = false;
    this.gesichertUm = Date.now();
    this.uhr = setInterval(() => this.schlag(), 1000 / this.jeSekunde);
    this.beruehrt = Date.now();
    this.senden(this.pausenstand());
    // Der Browser merkt sich die Kamera je Stand (AC-10) - `fortgesetzt` sagt
    // ihm, dass er sie jetzt zurueckholen soll.
    this.senden({ typ: 'stand', id: standId, fortgesetzt: true });
    return {};
  }

  // ---- Aufhoeren (speichern AC-7) -------------------------------------------
  // "Aufhören und später weiterspielen": sichern, und erst wenn das ging,
  // erfahren es alle - den Raum schliesst, wer ihn haelt (`Raeume.schliessen`).
  // Zu mehreren nicht: dort verlangt Sichern Einigkeit (AC-22, S4).
  aufhoeren() {
    if (!this.laeuft) return { fehler: 'Es läuft keine Partie.' };
    if (this.spieler.length > 1) return { fehler: 'Zu mehreren lässt sich noch nicht gemeinsam aufhören.' };
    if (!this.ablage || !this.eigentuemer || typeof this.welt.sichern !== 'function') {
      return { fehler: 'Diese Partie lässt sich nicht sichern.' };
    }
    if (this.ohneStand) return { fehler: this.ohneStandGrund || 'Diese Partie wird nicht gesichert.' };
    if (!this.sichern()) return { fehler: this.ohneStandGrund || 'Die Partie ließ sich nicht sichern.' };
    this.senden({ typ: 'aufgehoert', stand: this.standId });
    return {};
  }

  /** Jedem den Zustand, den er sehen darf - gibt es keinen je Spieler, allen denselben. */
  zustandSenden() {
    if (this.welt.zustandJeSpieler) {
      const je = this.welt.zustandJeSpieler(this.spieler.map((s) => s.id));
      this.sendenJe((id) => je.get(id));
    } else {
      this.senden(this.welt.zustand());
    }
  }

  schlag() {
    // Sitzt niemand mehr am Tisch, steht die Uhr (raeume AC-17): die Partie
    // wartet, statt ohne Zuschauer weiterzulaufen. Kehrt jemand zurueck, geht
    // sie dort weiter, wo sie stand - die Wanduhr wird neu angesetzt, damit
    // nichts nachgeholt wird.
    // Angehalten (speichern AC-19): die Partie taktet nicht. Nach der Frist
    // laeuft sie von selbst weiter (AC-20) - auch das erfahren alle.
    if (this.pause && this.pause.bis !== null && Date.now() >= this.pause.bis) {
      this.pause = null;
      this.senden(this.pausenstand());
    }
    if (this.leer || this.pause) {
      this.steht = true;
      return;
    }
    if (this.steht) {
      this.steht = false;
      this.beginn = Date.now() - (this.gerechnet * 1000) / this.jeSekunde;
    }
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
    this.zustandSenden();
    // `vorbei` gehoert zur Form dessen, was `erzeugen` liefert, nicht zu
    // einem einzelnen Spiel (ADR-0006): sagt es, die Partie sei entschieden,
    // haelt der Raum seine Uhr an. **Was** entscheidet, weiss nur das Spiel -
    // der Raum fragt bloss. Der letzte Zustand ist schon unterwegs und traegt
    // das Ergebnis.
    if (this.welt.vorbei) {
      this.beenden();
      // Eine entschiedene Partie setzt niemand fort: ihr Stand geht mit
      // (ADR-0017 Punkt 3).
      this.standLoeschen();
    } else if (Date.now() - this.gesichertUm >= this.sichernMs) {
      this.sichern();
    }
  }

  // ---- Sichern (speichern AC-3, AC-4, AC-6) ---------------------------------
  // Der Raum weiss, **wann** gesichert wird, das Spiel, **was**: `sichern()`
  // liefert Bytes, `laden(bytes)` im Steckbrief liest sie (ADR-0006). Bevor
  // ein Stand den vorigen ersetzt, wird er einmal geladen - ein Stand, der
  // sich nicht laden laesst, nimmt den vorigen nicht mit (AC-6).

  /** @returns {boolean} ob ein Stand abgelegt wurde */
  sichern() {
    if (!this.ablage || !this.eigentuemer || this.ohneStand || !this.laeuft) return false;
    if (typeof this.welt.sichern !== 'function') return false;
    // Zuerst die Uhr: scheitert es, wird nicht in jedem Schlag neu versucht.
    this.gesichertUm = Date.now();
    // Was immer dabei scheitert - das Spiel beim Schreiben oder Proben, die
    // Datei beim Ablegen -, die Partie laeuft weiter, und der vorige Stand
    // bleibt, wie er war.
    try {
      const wert = this.welt.sichern();
      if (typeof this.spiel.laden === 'function') this.spiel.laden(wert);
      return this.standAblegen(wert);
    } catch (fehler) {
      console.warn(`Raum ${this.code}: Stand nicht abgelegt - ${fehler instanceof Error ? fehler.message : fehler}`);
      return false;
    }
  }

  /** @param {Uint8Array} wert */
  standAblegen(wert) {
    const beschreibung = {
      art: this.art,
      fassung: Number.isInteger(this.spiel.standFassung) ? this.spiel.standFassung : null,
      beteiligte: this.plaetzeBeteiligt(),
      einstellungen: { ...this.einstellungen, platzwahl: this.platzwahl },
      // Was die Liste im Vorraum zeigt (Spielzeit, Karte ...) - das Spiel
      // sagt es, der Raum reicht es durch.
      angaben: typeof this.spiel.angaben === 'function' ? this.spiel.angaben(this.welt, this.einstellungen) : null,
    };
    if (this.standId) {
      if (this.ablage.schreiben(this.eigentuemer, this.standId, wert, beschreibung)) return true;
      // Geloescht, waehrend die Partie lief: dabei bleibt es.
      this.standId = null;
      this.ohneStand = true;
      this.ohneStandGrund = 'Der Spielstand dieser Partie wurde gelöscht – sie wird nicht mehr gesichert.';
      return false;
    }
    const abgelegt = this.ablage.ablegen(this.eigentuemer, wert, beschreibung);
    if ('fehler' in abgelegt) {
      // Am Konto liegen schon fuenf (AC-12): diese Partie wird nicht
      // gesichert - kein alter Stand wird stillschweigend geopfert. Der
      // Gastgeber erfaehrt es (AC-27).
      this.ohneStand = true;
      this.ohneStandSagen(`Diese Partie wird nicht gesichert: ${abgelegt.fehler}`);
      return false;
    }
    this.standId = abgelegt.id;
    // Ab jetzt merkt sich der Browser die Kamera zu diesem Stand (AC-10).
    this.senden({ typ: 'stand', id: abgelegt.id });
    return true;
  }

  // Liegen am Konto schon so viele Staende, wie die Ablage nimmt, wird diese
  // Partie nicht gesichert - das sagt der Raum gleich beim Start, nicht erst
  // nach der ersten Minute (AC-27). Geprueft wird hier nur die Zahl; ob
  // abgelegt wird, entscheidet weiter die Ablage.
  platzPruefen() {
    if (!this.ablage || !this.eigentuemer || typeof this.welt.sichern !== 'function') return;
    const hoechstens = this.ablage.jeKonto;
    if (!Number.isInteger(hoechstens) || this.ablage.anzahl(this.eigentuemer) < hoechstens) return;
    this.ohneStand = true;
    this.ohneStandSagen(`Diese Partie wird nicht gesichert: an deinem Konto liegen schon ${hoechstens} Spielstände. Lösche einen im Vorraum, dann wird die nächste gesichert.`);
  }

  /** Einmal je Partie, an den Gastgeber - ihm gehoert der Stand. @param {string} text */
  ohneStandSagen(text) {
    this.ohneStandGrund = text;
    if (this.ohneStandGesagt) return;
    this.ohneStandGesagt = true;
    const wer = this.gastgeber;
    // `ohneStand`: der Browser bietet "Später weiterspielen" dann nicht an.
    if (wer && wer.draht && wer.draht.readyState === 1) wer.draht.send(JSON.stringify({ typ: 'hinweis', text, ohneStand: true }));
  }

  /** Wer an der Partie beteiligt ist - Menschen mit Namen und Platz, dazu die Plaetze des Spiels. */
  plaetzeBeteiligt() {
    const menschen = this.spieler.map((s) => ({ name: s.name, mensch: true, platz: s.id }));
    const besetzt = vomSpielBesetzt(this.spiel, this.einstellungen);
    const name = (nummer) => (typeof this.spiel.platzname === 'function' ? this.spiel.platzname(nummer) : `Platz ${nummer}`);
    const andere = Array.from({ length: besetzt }, (_, i) => ({ name: name(i + 1), mensch: false }));
    return [...menschen, ...andere];
  }

  standLoeschen() {
    if (this.ablage && this.eigentuemer && this.standId) this.ablage.loeschen(this.eigentuemer, this.standId);
    this.standId = null;
  }

  // ---- Anhalten (speichern AC-19 bis AC-21) --------------------------------
  // Eine Sache des Raums, nicht des Spiels (ADR-0006): die Partie wird nicht
  // getaktet, mehr erfaehrt sie nicht. Sitzt nur ein Mensch in der Partie,
  // gilt keine Grenze - sie schuetzt Mitspieler vor einem, der die Partie
  // festhaelt, und allein gegen den Computer gibt es keinen.
  anhalten(wer) {
    if (!this.laeuft) return { fehler: 'Es läuft keine Partie.' };
    if (this.pause) return { fehler: 'Die Partie ist schon angehalten.' };
    const begrenzt = this.spieler.length > 1;
    const bisher = this.pausen[wer.id] || 0;
    if (begrenzt && bisher >= PAUSEN_JE_SPIELER) return { fehler: 'Du hast schon zweimal angehalten.' };
    this.pausen[wer.id] = bisher + 1;
    this.pause = { von: wer.id, name: wer.name, bis: begrenzt ? Date.now() + this.pauseMs : null };
    this.beruehrt = Date.now();
    // Wer anhaelt, steht vielleicht gleich auf (speichern AC-4).
    this.sichern();
    return {};
  }

  /** Fortsetzen darf jeder am Tisch, nicht nur, wer angehalten hat (AC-21). */
  fortsetzen() {
    this.pause = null;
    this.beruehrt = Date.now();
    return {};
  }

  /** Was alle ueber die Pause erfahren: wer, und wie lange hoechstens noch. */
  pausenstand() {
    if (!this.pause) return { typ: 'pause', name: null };
    const { von, name, bis } = this.pause;
    return { typ: 'pause', von, name, rest: bis === null ? null : Math.max(0, Math.ceil((bis - Date.now()) / 1000)) };
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
      // Ob diese Partie gesichert werden kann - dann bietet das Spielbild
      // "Aufhören und später weiterspielen" an (speichern AC-7).
      sichert: Boolean(this.ablage && this.eigentuemer && typeof this.spiel.laden === 'function'),
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
    // Wohin die Raeume ihre Staende legen (server/partiestaende.js) - ohne
    // Ablage wird nichts gesichert.
    this.ablage = null;
    this.wegMs = WEG_MS;
    // Alle 15 Sekunden, damit aus "nach zwei Minuten" nicht drei werden (AC-8).
    this.aufraeumer = setInterval(() => this.aufraeumen(), 15 * 1000);
    this.aufraeumer.unref?.();
  }

  anlegen(spiel = null) {
    let code = codeErzeugen();
    while (this.nachCode.has(code)) code = codeErzeugen();
    const raum = new Raum(code, spiel);
    raum.ablage = this.ablage;
    this.nachCode.set(code, raum);
    return raum;
  }

  /**
   * Jede laufende Partie sichern - beim Herunterfahren (speichern AC-4).
   * @returns {number} wie viele Staende abgelegt wurden
   */
  allesSichern() {
    let gesichert = 0;
    for (const raum of this.nachCode.values()) if (raum.sichern()) gesichert += 1;
    return gesichert;
  }

  finden(code) {
    return this.nachCode.get(codeLesen(code)) || null;
  }

  /**
   * Der Raum, in dem ein Stand gerade laeuft (speichern AC-11) - oder null.
   * @param {string} konto @param {string} standId
   */
  mitStand(konto, standId) {
    for (const raum of this.nachCode.values()) {
      if (raum.standId === standId && raum.eigentuemer === konto) return raum;
    }
    return null;
  }

  schliessen(raum) {
    if (!this.nachCode.has(raum.code)) return;
    raum.beenden();
    // Ein geschlossener Raum legt nichts mehr ab - sonst schriebe ihn das
    // Abreissen der letzten Verbindung noch einmal, nachdem sein Stand
    // schon anderswo weiterlaeuft (AC-11).
    raum.ablage = null;
    this.nachCode.delete(raum.code);
    // Der Schutz muss auch dann mitzaehlen, wenn ein Raum von selbst
    // verfaellt und nicht, weil jemand ihn verlassen hat.
    this.beimSchliessen?.(raum);
  }

  // Die am laengsten verlassene laufende Partie schliessen, auf die `passt`
  // zutrifft. Eine Partie, an der niemand sitzt, haelt keinen Platz fest
  // (raeume AC-17): steht eine Grenze dem Eroeffnen im Weg, weicht sie.
  /** @param {(raum: any) => boolean} [passt] */
  verlasseneSchliessen(passt = () => true) {
    let aelteste = null;
    for (const raum of this.nachCode.values()) {
      if (!raum.leer || !raum.laeuft || !passt(raum)) continue;
      if (!aelteste || raum.beruehrt < aelteste.beruehrt) aelteste = raum;
    }
    if (!aelteste) return false;
    this.schliessen(aelteste);
    return true;
  }

  // Fuer den Betreiber: wie viele Raeume offen sind und in wie vielen eine
  // Partie laeuft, die ein Neustart beenden wuerde. Keine Codes, keine Namen.
  // Eine verlassene Partie (raeume AC-17) zaehlt nicht: an ihr sitzt niemand,
  // und ein Ausrollen soll nicht eine halbe Stunde auf sie warten.
  zahlen() {
    let partien = 0;
    for (const raum of this.nachCode.values()) {
      if (raum.laeuft && !raum.leer) partien += 1;
    }
    return { raeume: this.nachCode.size, partien };
  }

  // Raeume, in denen niemand mehr sitzt, kosten sonst dauerhaft Rechenzeit.
  aufraeumen() {
    const jetzt = Date.now();
    for (const raum of [...this.nachCode.values()]) {
      // Eine laufende Partie, die alle verlassen haben, wartet so lange wie
      // ein Raum ohne Befehl (raeume AC-17) - `beruehrt` steht dann auf dem
      // Augenblick, in dem der letzte ging.
      if (raum.leer && !raum.laeuft && jetzt - raum.beruehrt > 60 * 1000) this.schliessen(raum);
      // Allein und weggeklickt (speichern AC-8): gesichert und zu. Laesst sich
      // nichts sichern, wartet sie wie jede verlassene Partie - so geht nichts
      // verloren, was nicht auch das Warten verloere.
      else if (raum.leer && raum.laeuft && raum.spieler.length === 1 && jetzt - raum.beruehrt >= this.wegMs && raum.sichern()) this.schliessen(raum);
      // Wer allein angehalten hat und noch am Tisch sitzt, wird nicht
      // abgeraeumt (speichern AC-20): die Pause ist dort unbegrenzt, und eine
      // Uhr, die steht, kostet keine Rechenzeit.
      else if (raum.pause && !raum.leer) continue;
      else if (jetzt - raum.beruehrt > LEERLAUF_MS) this.schliessen(raum);
    }
  }

  halt() {
    clearInterval(this.aufraeumer);
    // Wer haelt, sichert vorher (`allesSichern`) - danach legt kein Raum mehr
    // ab, auch nicht, wenn beim Schliessen noch Verbindungen abreissen.
    for (const raum of this.nachCode.values()) {
      raum.beenden();
      raum.ablage = null;
    }
    this.nachCode.clear();
  }
}

module.exports = {
  Raeume, Raum, codeErzeugen, codeZeigen, codeLesen, namePruefen, spielplatz,
  MAX_SPIELER, MIN_SPIELER, CODE_LAENGE, ZEICHEN, plaetzePruefen, WEG_MS,
};
