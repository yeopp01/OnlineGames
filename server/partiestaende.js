// @ts-check
'use strict';

// Die Ablage der Partiestaende (→ docs/adr/0017, specs/00-plattform/speichern.md
// AC-3 bis AC-6, AC-12, AC-13). Eine Tabelle in derselben SQLite-Datei wie die
// Konten - kein zweiter Speicher. Was in einem Stand steht, weiss nur das
// Spiel: hier liegen Bytes, dazu was die Liste zeigt (Spielart, Fassung,
// Beteiligte, Einstellungen, Zeitpunkte). Kein Spiel wird geladen (ADR-0006).
//
// **Eine Partie hat einen Stand** (ADR-0017 Punkt 1): jedes Sichern ersetzt
// ihn. Zurueckgehalten wird genau einer, der vorige (`vorher`) - laesst sich
// der neueste nicht laden, ist der davor noch da (AC-6). Beides wird in einer
// Anweisung geschrieben: bricht das Schreiben ab, steht der alte Stand.
//
// **Jede Anfrage traegt das Konto** (AC-13): gelesen, umbenannt, geloescht
// wird nur `WHERE id = ? AND konto = ?`. Ein fremder Stand und einer, den es
// nicht gibt, sehen gleich aus - ob es ihn gibt, geht niemanden etwas an.
const { randomBytes } = require('node:crypto');

// Hoechstens fuenf je Konto wie im Managerspiel (ADR-0017 Punkt 3, ADR-0005).
const JE_KONTO = 5;
const NAME_MAX = 40;

// 16 Zeichen aus 96 Bit Zufall - ein Schluessel, kein Code zum Vorlesen.
const kennung = () => randomBytes(12).toString('base64url');

/**
 * @typedef {object} Beschreibung
 * @property {string} art            die Spielart aus dem Steckbrief
 * @property {number|null} [fassung] die Fassung des Stands, wenn das Spiel sie nennt
 * @property {unknown} [beteiligte]  wer mitspielt - Namen und ob Mensch (AC-26)
 * @property {unknown} [einstellungen] womit die Partie eroeffnet wurde
 */

/**
 * @typedef {object} Zeile
 * @property {string} id
 * @property {string} art
 * @property {number|null} fassung
 * @property {string|null} name
 * @property {unknown} beteiligte
 * @property {unknown} einstellungen
 * @property {number} angelegt
 * @property {number} geaendert
 */

/** @param {Record<string, any>} z @returns {Zeile} */
function zeileLesen(z) {
  return {
    id: z.id,
    art: z.art,
    fassung: z.fassung ?? null,
    name: z.name ?? null,
    beteiligte: JSON.parse(z.beteiligte || 'null'),
    einstellungen: JSON.parse(z.einstellungen || 'null'),
    angelegt: z.angelegt,
    geaendert: z.geaendert,
  };
}

const nameSaeubern = (name) => String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);

class Partiestaende {
  /**
   * @param {import('node:sqlite').DatabaseSync} db  die Datenbank der Konten
   * @param {() => number} [uhr]
   */
  constructor(db, uhr = () => Date.now()) {
    this.db = db;
    this.uhr = uhr;
    db.exec(`
      CREATE TABLE IF NOT EXISTS partiestand (
        id            TEXT PRIMARY KEY,
        konto         TEXT NOT NULL,
        art           TEXT NOT NULL,
        fassung       INTEGER,
        name          TEXT,
        beteiligte    TEXT,
        einstellungen TEXT,
        angelegt      INTEGER NOT NULL,
        geaendert     INTEGER NOT NULL,
        wert          BLOB NOT NULL,
        vorher        BLOB
      )`);
    db.exec('CREATE INDEX IF NOT EXISTS partiestand_konto ON partiestand (konto)');
  }

  /** @param {string} konto */
  anzahl(konto) {
    const zeile = /** @type {{ anzahl: number }} */ (this.db.prepare('SELECT COUNT(*) AS anzahl FROM partiestand WHERE konto = ?').get(konto));
    return zeile.anzahl;
  }

  /**
   * Einen neuen Stand ablegen - fuer eine Partie, die noch keinen hat.
   * @param {string} konto
   * @param {Uint8Array} wert
   * @param {Beschreibung} beschreibung
   * @returns {{ id: string } | { fehler: string }}
   */
  ablegen(konto, wert, beschreibung) {
    if (!konto) return { fehler: 'Ein Spielstand gehört einem Konto.' };
    if (this.anzahl(konto) >= JE_KONTO) {
      return { fehler: `Mehr als ${JE_KONTO} Spielstände je Konto gehen nicht. Lösche einen alten.` };
    }
    const id = kennung();
    const jetzt = this.uhr();
    this.db.prepare(`
      INSERT INTO partiestand (id, konto, art, fassung, name, beteiligte, einstellungen, angelegt, geaendert, wert, vorher)
      VALUES (?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, NULL)`)
      .run(id, konto, beschreibung.art, beschreibung.fassung ?? null,
        JSON.stringify(beschreibung.beteiligte ?? null), JSON.stringify(beschreibung.einstellungen ?? null),
        jetzt, jetzt, wert);
    return { id };
  }

  /**
   * Den Stand einer Partie ersetzen; der bisherige wird zum vorigen (AC-6).
   * Eine Anweisung: bricht sie ab, steht der alte Stand unveraendert.
   * @param {string} konto
   * @param {string} id
   * @param {Uint8Array} wert
   * @param {Beschreibung} beschreibung
   * @returns {boolean} ob es den Stand am Konto gab
   */
  schreiben(konto, id, wert, beschreibung) {
    const { changes } = this.db.prepare(`
      UPDATE partiestand SET vorher = wert, wert = ?, fassung = ?, beteiligte = ?, einstellungen = ?, geaendert = ?
      WHERE id = ? AND konto = ?`)
      .run(wert, beschreibung.fassung ?? null, JSON.stringify(beschreibung.beteiligte ?? null),
        JSON.stringify(beschreibung.einstellungen ?? null), this.uhr(), id, konto);
    return changes === 1;
  }

  /**
   * Was am Konto liegt, das Neueste zuerst - ohne die Bytes.
   * @param {string} konto
   * @returns {Zeile[]}
   */
  liste(konto) {
    return this.db.prepare(`
      SELECT id, art, fassung, name, beteiligte, einstellungen, angelegt, geaendert
      FROM partiestand WHERE konto = ? ORDER BY geaendert DESC`).all(konto).map(zeileLesen);
  }

  /**
   * Einen Stand oeffnen - nur am eigenen Konto. `laden` ist die Funktion des
   * Spiels; wirft sie beim neuesten Stand, wird der vorige versucht (AC-6).
   * Zurueck kommt, was `laden` lieferte, und ob es der vorige war - oder der
   * Satz, warum keiner ging. `null` heisst: gibt es nicht (oder nicht fuer dich).
   *
   * @template T
   * @param {string} konto
   * @param {string} id
   * @param {(bytes: Uint8Array, zeile: Zeile) => T} laden
   * @returns {null | { zeile: Zeile, geladen: T, vorher: boolean, fehler?: string } | { zeile: Zeile, fehler: string }}
   */
  oeffnen(konto, id, laden) {
    const roh = /** @type {Record<string, any> | undefined} */ (this.db.prepare('SELECT * FROM partiestand WHERE id = ? AND konto = ?').get(id, konto));
    if (!roh) return null;
    const zeile = zeileLesen(roh);
    let fehlerNeu;
    try {
      return { zeile, geladen: laden(roh.wert, zeile), vorher: false };
    } catch (fehler) {
      fehlerNeu = fehler instanceof Error ? fehler.message : String(fehler);
    }
    if (roh.vorher) {
      try {
        return { zeile, geladen: laden(roh.vorher, zeile), vorher: true, fehler: fehlerNeu };
      } catch {
        // Auch der vorige geht nicht - dann zaehlt der Satz zum neuesten.
      }
    }
    return { zeile, fehler: fehlerNeu };
  }

  /**
   * @param {string} konto
   * @param {string} id
   * @param {unknown} name
   * @returns {boolean}
   */
  umbenennen(konto, id, name) {
    const sauber = nameSaeubern(name);
    const { changes } = this.db.prepare('UPDATE partiestand SET name = ? WHERE id = ? AND konto = ?').run(sauber || null, id, konto);
    return changes === 1;
  }

  /**
   * @param {string} konto
   * @param {string} id
   * @returns {boolean}
   */
  loeschen(konto, id) {
    const { changes } = this.db.prepare('DELETE FROM partiestand WHERE id = ? AND konto = ?').run(id, konto);
    return changes === 1;
  }
}

module.exports = { Partiestaende, JE_KONTO, NAME_MAX };
