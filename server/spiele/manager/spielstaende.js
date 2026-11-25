// @ts-check
'use strict';

// Die Spielstaende des Managerspiels: in SQLite, an einem Konto
// (→ docs/adr/0007-zwei-arten-von-partien.md). Dieselbe Datei wie die Konten -
// kein zweiter Speicher.
//
// Geschrieben wird nach jedem Zug, der etwas geaendert hat. Im Arbeitsspeicher
// liegen nur die zuletzt benutzten Karrieren; wer laenger nichts tut, wird
// verdraengt und beim naechsten Zug wieder aus der Datenbank gelesen. Ein
// Neustart kostet deshalb nichts.
const { randomBytes } = require('node:crypto');
const { Karriere, FASSUNG, LADBARE_FASSUNGEN } = require('./karriere');

/** @typedef {import('./karriere').GanzeKarriere} GanzeKarriere */
const { terminTitel } = require('./kalender');

const JE_KONTO = 5;
const IM_SPEICHER = 40;
const LEERLAUF_MS = 30 * 60 * 1000;

// 16 Zeichen aus 96 Bit Zufall - der Schluessel zum Spielstand, kein Code zum
// Vorlesen. Erraten hilft ohnehin nicht: geoeffnet wird nur am eigenen Konto.
const kennung = () => randomBytes(12).toString('base64url');

// Ein Spielstand gehoert einem Konto und hat bisher genau einen Menschen -
// sein Verein steht in der Liste der Spielstaende.
const eigenerVerein = (karriere) => karriere.vereinVon(karriere.manager[0]?.vereinId);

class Spielstaende {
  constructor(db, uhr = () => Date.now()) {
    this.db = db;
    this.uhr = uhr;
    this.offen = new Map();
    db.exec(`
      CREATE TABLE IF NOT EXISTS manager_spielstand (
        id        TEXT PRIMARY KEY,
        konto     TEXT NOT NULL,
        name      TEXT NOT NULL,
        verein    TEXT,
        liga      INTEGER,
        saison    INTEGER,
        datum     TEXT,
        fassung   INTEGER NOT NULL,
        daten     TEXT NOT NULL,
        angelegt  INTEGER NOT NULL,
        geaendert INTEGER NOT NULL
      )`);
    // Vom 2026-11-22 bis zum 2026-11-25 hiess die Spalte `geändert` - eine
    // Ersetzung der Bildschirmtexte hatte sie mitgenommen. Wer seine Datenbank
    // in dieser Zeit angelegt hat, bekommt den alten Namen zurueck; auf dem
    // Server stand sie nie so, dort fehlte die neue Spalte.
    const spalten = db.prepare('PRAGMA table_info(manager_spielstand)').all().map((s) => s.name);
    if (spalten.includes('geändert') && !spalten.includes('geaendert')) {
      db.exec('ALTER TABLE manager_spielstand RENAME COLUMN "geändert" TO geaendert');
    }
    db.exec('CREATE INDEX IF NOT EXISTS manager_spielstand_konto ON manager_spielstand (konto)');
    this.aufraeumer = setInterval(() => this.aufraeumen(), 5 * 60 * 1000);
    this.aufraeumer.unref?.();
  }

  liste(konto) {
    return this.db.prepare(`
      SELECT id, name, verein, liga, saison, datum, fassung, angelegt, geaendert
      FROM manager_spielstand WHERE konto = ? ORDER BY geaendert DESC`).all(konto)
      .map((z) => ({ ...z, ladbar: LADBARE_FASSUNGEN.includes(z.fassung) }));
  }

  anlegen(konto, { startwert, vereinId, name }) {
    const { anzahl } = this.db.prepare('SELECT COUNT(*) AS anzahl FROM manager_spielstand WHERE konto = ?').get(konto);
    if (anzahl >= JE_KONTO) return { fehler: `Mehr als ${JE_KONTO} Spielstände je Konto gehen nicht. Lösche einen alten.` };
    const karriere = Karriere.neu({ startwert, vereinId, name });
    const verein = eigenerVerein(karriere);
    if (!verein) return { fehler: 'Diesen Verein gibt es nicht.' };
    const id = kennung();
    const jetzt = this.uhr();
    this.db.prepare(`
      INSERT INTO manager_spielstand (id, konto, name, verein, liga, saison, datum, fassung, daten, angelegt, geaendert)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, konto, name, verein.name, verein.liga, karriere.saison,
        terminTitel(karriere.termine[karriere.termin]), FASSUNG, JSON.stringify(karriere.sichern()), jetzt, jetzt);
    this.offen.set(id, { konto, karriere, beruehrt: jetzt });
    this.aufraeumen();
    return { id, karriere };
  }

  /**
   * Einen Spielstand oeffnen - nur am eigenen Konto. Ein fremder und ein
   * nicht vorhandener sehen gleich aus: ob es ihn gibt, geht niemanden etwas an.
   *
   * @returns {{karriere: GanzeKarriere, fehler?: undefined}|{fehler: string, karriere?: undefined}|null}
   */
  oeffnen(konto, id) {
    const offen = this.offen.get(id);
    if (offen) {
      if (offen.konto !== konto) return null;
      offen.beruehrt = this.uhr();
      return { karriere: offen.karriere };
    }
    const zeile = this.db.prepare('SELECT fassung, daten FROM manager_spielstand WHERE id = ? AND konto = ?').get(id, konto);
    if (!zeile) return null;
    if (!LADBARE_FASSUNGEN.includes(zeile.fassung)) return { fehler: 'Dieser Spielstand stammt aus einer anderen Fassung des Spiels.' };
    let karriere;
    try {
      karriere = Karriere.laden(JSON.parse(zeile.daten));
    } catch (fehler) {
      return { fehler: fehler.code === 'FASSUNG' ? fehler.message : 'Dieser Spielstand lässt sich nicht laden.' };
    }
    this.offen.set(id, { konto, karriere, beruehrt: this.uhr() });
    this.aufraeumen();
    return { karriere };
  }

  schreiben(konto, id, karriere) {
    const verein = eigenerVerein(karriere);
    // Die Fassung wird mitgeschrieben: ein angehobener Stand ist danach einer der jetzigen.
    this.db.prepare(`
      UPDATE manager_spielstand SET verein = ?, liga = ?, saison = ?, datum = ?, fassung = ?, daten = ?, geaendert = ?
      WHERE id = ? AND konto = ?`)
      .run(verein ? verein.name : null, verein ? verein.liga : null, karriere.saison,
        terminTitel(karriere.termine[karriere.termin]), FASSUNG, JSON.stringify(karriere.sichern()), this.uhr(), id, konto);
  }

  loeschen(konto, id) {
    const { changes } = this.db.prepare('DELETE FROM manager_spielstand WHERE id = ? AND konto = ?').run(id, konto);
    if (changes === 1) this.offen.delete(id);
    return changes === 1;
  }

  /** Den Arbeitsspeicher frei halten - geschrieben ist ohnehin alles. */
  aufraeumen() {
    const jetzt = this.uhr();
    for (const [id, eintrag] of this.offen) {
      if (jetzt - eintrag.beruehrt > LEERLAUF_MS) this.offen.delete(id);
    }
    if (this.offen.size > IM_SPEICHER) {
      const aelteste = [...this.offen].sort((a, b) => a[1].beruehrt - b[1].beruehrt).slice(0, this.offen.size - IM_SPEICHER);
      for (const [id] of aelteste) this.offen.delete(id);
    }
  }

  halt() {
    clearInterval(this.aufraeumer);
    this.offen.clear();
  }
}

module.exports = { Spielstaende, JE_KONTO, IM_SPEICHER, LEERLAUF_MS };
