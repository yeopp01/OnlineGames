// @ts-check
'use strict';

// Der Spielstand einer Strategiepartie als Bytes (→ docs/adr/0017, specs/00-plattform/speichern.md).
//
// Welt und KI liefern ihre Felder als Wert (`welt.alsWert()`, `ki.alsWert()`),
// hier wird daraus ein Stand: abgelegt mit `node:v8`, nicht als JSON - das
// Format kennt `Map`, `Set` und Bytefelder und erhaelt, dass zwei Stellen auf
// dasselbe Ding zeigen (Verbuendete teilen ein Sichtfeld, eine entdeckte
// Einheit haelt die Sichten, die sie sahen). Welt und KIs gehen deshalb in
// **einem** Aufruf hinein: zwei getrennte Abzuege truegen Kopien, wo die
// Partie ein Ding hat.
//
// Vorn stehen acht Bytes im Klartext: die Marke und die Fassung (speichern
// AC-16). So wird ein Stand einer neueren Fassung abgelehnt, bevor jemand
// versucht, ihn zu entpacken (AC-17). Ein Stand einer aelteren wird
// hochgezogen (AC-18, ADR-0017 Punkt 7 mit Nachtrag): Schritt fuer Schritt
// ueber `SCHRITTE`, bis er die Form der laufenden Fassung hat. Dahinter
// liegt der Wert, mit zlib gepackt.

const v8 = require('node:v8');
const zlib = require('node:zlib');

// Die Fassung der Form. Sie steigt, sobald ein Feld der Welt, eines
// Spielers, einer Einheit, eines Gebaeudes oder der KI dazukommt oder
// wegfaellt - `tests/waechter-stand.test.mjs` vergleicht die Form mit dem
// Abbild in `server/spiele/strategie/stand-abbild.json` und verlangt es.
const FASSUNG = 3;

// Je Fassung n der Schritt nach n + 1 (speichern AC-18): eine Funktion, die
// den entpackten Inhalt `{ welt, kis }` der Fassung n an Ort und Stelle zu
// dem der Fassung n + 1 macht - meist ein neues Feld mit dem Wert, den der
// Code einer neuen Partie gaebe, an jedem Ding, das es tragen muss; ein
// weggefallenes Feld wird geloescht. Laesst sich ein Schritt fachlich nicht
// gehen, steht statt der Funktion ein Satz, der die ADR nennt, die das
// entschieden hat; ein solcher Stand wird abgelehnt.
// `tests/waechter-stand.test.mjs` verlangt fuer jede Fassung unter der
// laufenden einen Eintrag, `tests/strategie-hochziehen.test.mjs` laedt den
// Probestand jeder alten Fassung (`tests/staende/`) und laesst ihn
// weiterlaufen.
/** @typedef {{ welt: Record<string, any>, kis: Record<string, any>[] }} Inhalt */
/** @type {Record<number, ((inhalt: Inhalt) => void) | string>} */
const SCHRITTE = {
  // 1 -> 2, das Regelpaket (kampf AC-26, AC-27): die Reihenfolge eines Takts
  // wird je Takt gemischt, aus einem eigenen Zufall des Startwerts - er
  // beginnt, wo der einer neuen Partie beginnt; jede Einheit merkt sich ihren
  // Platz darin und ihre Lage zu Beginn des Takts; Pfeile fliegen, bis sie
  // ankommen - ein alter Stand hat keinen in der Luft, denn dort traf jeder
  // im Takt des Schusses.
  1: ({ welt }) => {
    welt.reihenZufall = (welt.startwert ^ 0x2c1b3c6d) >>> 0;
    welt.reihe = [];
    welt.pfeileImFlug = [];
    for (const einheit of welt.einheiten.values()) {
      einheit.reihe = 0;
      einheit.taktX = einheit.x;
      einheit.taktY = einheit.y;
    }
  },
  // 2 -> 3, die KI ruft den Drachen (ki AC-29): sie hat noch kein Ei
  // gesehen, holt keins, sucht keins und hat nie gerufen - ein alter Stand
  // beginnt damit, wo eine neue KI beginnt.
  2: ({ kis }) => {
    for (const ki of kis) {
      ki.eierBekannt = new Map();
      ki.eiHoler = null;
      ki.eiGesperrt = new Map();
      ki.rufFehlt = null;
      ki.rufWartet = null;
      ki.drachenGesehen = new Map();
      ki.rufTakt = null;
      ki.eiSuche = null;
      ki.eiSucher = null;
      ki.eiSucheFertig = new Set();
    }
  },
};

const MARKE = Buffer.from('FAST', 'latin1');
const KOPF = 8;

const ALT = 'Dieser Spielstand stammt aus einer älteren Fassung des Spiels und lässt sich nicht mehr fortsetzen.';
const KAPUTT = 'Der Spielstand ist beschädigt und lässt sich nicht laden.';

/** Warum ein Stand sich nicht laden laesst - der Satz steht so auf dem Bildschirm. */
class StandFehler extends Error {
  /**
   * @param {'fremd' | 'neuer' | 'aelter' | 'kaputt'} grund
   * @param {string} satz
   */
  constructor(grund, satz) {
    super(satz);
    this.grund = grund;
  }
}

/**
 * @param {{ welt: object, kis: object[] }} inhalt
 * @returns {Buffer}
 */
function schreiben(inhalt) {
  const kopf = Buffer.alloc(KOPF);
  MARKE.copy(kopf, 0);
  kopf.writeUInt32BE(FASSUNG, 4);
  return Buffer.concat([kopf, zlib.deflateRawSync(v8.serialize(inhalt))]);
}

/**
 * Die Fassung, die einen Stand geschrieben hat - oder `null`, wenn es keiner ist.
 * @param {Uint8Array} bytes
 */
function fassungVon(bytes) {
  if (!bytes || bytes.length < KOPF) return null;
  const puffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (!puffer.subarray(0, 4).equals(MARKE)) return null;
  return puffer.readUInt32BE(4);
}

/**
 * Laesst sich ein Stand der Fassung `von` bis `bis` hochziehen? Nur, wenn
 * jeder Schritt dazwischen eine Funktion ist.
 * @param {number} von
 * @param {number} bis
 * @param {typeof SCHRITTE} schritte
 */
function gangbar(von, bis, schritte) {
  for (let fassung = von; fassung < bis; fassung++) if (typeof schritte[fassung] !== 'function') return false;
  return true;
}

/**
 * Den Inhalt eines Stands der Fassung `von` zu dem der Fassung `bis` machen,
 * Schritt fuer Schritt (speichern AC-18). Fehlt ein Schritt oder ist er ein
 * Satz statt einer Funktion, wird abgelehnt - lieber das als eine Welt, die
 * der Code so nie baut. Ein Schritt, der wirft, macht den Stand kaputt.
 * @param {Inhalt} inhalt
 * @param {number} von
 * @param {number} bis
 * @param {typeof SCHRITTE} [schritte]
 * @returns {Inhalt}
 */
function hochziehen(inhalt, von, bis, schritte = SCHRITTE) {
  if (!gangbar(von, bis, schritte)) throw new StandFehler('aelter', ALT);
  for (let fassung = von; fassung < bis; fassung++) {
    const schritt = /** @type {(inhalt: Inhalt) => void} */ (schritte[fassung]);
    try {
      schritt(inhalt);
    } catch {
      throw new StandFehler('kaputt', KAPUTT);
    }
  }
  return inhalt;
}

/**
 * Der Inhalt eines Stands, oder ein `StandFehler` mit dem Satz dazu. Ein
 * Stand einer aelteren Fassung kommt hochgezogen heraus (AC-18).
 * @param {Uint8Array} bytes
 * @param {typeof SCHRITTE} [schritte] nur fuer Tests: andere Schritte als die eingetragenen
 * @returns {Inhalt}
 */
function lesen(bytes, schritte = SCHRITTE) {
  const fassung = fassungVon(bytes);
  if (fassung === null) throw new StandFehler('fremd', 'Das ist kein Spielstand von Fading Allies.');
  if (fassung > FASSUNG) {
    throw new StandFehler('neuer', 'Dieser Spielstand stammt aus einer neueren Fassung des Spiels.');
  }
  // Ein Weg, den es nicht gibt, lehnt ab, bevor entpackt wird.
  if (!gangbar(fassung, FASSUNG, schritte)) throw new StandFehler('aelter', ALT);
  let inhalt;
  try {
    const puffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    inhalt = v8.deserialize(zlib.inflateRawSync(puffer.subarray(KOPF)));
  } catch {
    throw new StandFehler('kaputt', KAPUTT);
  }
  if (!inhalt || typeof inhalt !== 'object' || !inhalt.welt || !Array.isArray(inhalt.kis)) {
    throw new StandFehler('kaputt', KAPUTT);
  }
  return hochziehen(inhalt, fassung, FASSUNG, schritte);
}

module.exports = { FASSUNG, SCHRITTE, StandFehler, schreiben, lesen, hochziehen, fassungVon };
