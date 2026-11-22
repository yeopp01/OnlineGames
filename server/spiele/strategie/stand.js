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
// AC-16). So wird ein Stand einer anderen Fassung abgelehnt, bevor jemand
// versucht, ihn zu entpacken (AC-17) - hochgezogen wird nicht (AC-18,
// ADR-0017 Punkt 7). Dahinter liegt der Wert, mit zlib gepackt.

const v8 = require('node:v8');
const zlib = require('node:zlib');

// Die Fassung der Form. Sie steigt, sobald ein Feld der Welt, eines
// Spielers, einer Einheit, eines Gebaeudes oder der KI dazukommt oder
// wegfaellt - `tests/waechter-stand.test.mjs` vergleicht die Form mit dem
// Abbild in `server/spiele/strategie/stand-abbild.json` und verlangt es.
const FASSUNG = 1;

const MARKE = Buffer.from('FAST', 'latin1');
const KOPF = 8;

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
 * Der Inhalt eines Stands, oder ein `StandFehler` mit dem Satz dazu.
 * @param {Uint8Array} bytes
 * @returns {{ welt: Record<string, any>, kis: Record<string, any>[] }}
 */
function lesen(bytes) {
  const fassung = fassungVon(bytes);
  if (fassung === null) throw new StandFehler('fremd', 'Das ist kein Spielstand von Fading Allies.');
  if (fassung > FASSUNG) {
    throw new StandFehler('neuer', 'Dieser Spielstand stammt aus einer neueren Fassung des Spiels.');
  }
  if (fassung < FASSUNG) {
    throw new StandFehler('aelter', 'Dieser Spielstand stammt aus einer älteren Fassung des Spiels und lässt sich nicht mehr fortsetzen.');
  }
  let inhalt;
  try {
    const puffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    inhalt = v8.deserialize(zlib.inflateRawSync(puffer.subarray(KOPF)));
  } catch {
    throw new StandFehler('kaputt', 'Der Spielstand ist beschädigt und lässt sich nicht laden.');
  }
  if (!inhalt || typeof inhalt !== 'object' || !inhalt.welt || !Array.isArray(inhalt.kis)) {
    throw new StandFehler('kaputt', 'Der Spielstand ist beschädigt und lässt sich nicht laden.');
  }
  return inhalt;
}

module.exports = { FASSUNG, StandFehler, schreiben, lesen, fassungVon };
