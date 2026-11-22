'use strict';

// Das eigene Spiel live (Stufe M1, karriere AC-30 bis AC-32): der Termin ist
// gerechnet, das eigene Spiel steht am Anpfiff, und der Rest des Termins
// wartet in `this.offen`, bis abgepfiffen ist. Wer nicht live spielt, merkt
// davon nichts - "Weiter" rechnet wie immer.
// Methoden der Karriere; zusammengesetzt in karriere.js.
const { TERMINE } = require('./welt');
const { spielen, eingreifen, abpfiff } = require('./spieltag');

class Live {
  /**
   * Den naechsten Termin rechnen und das eigene Spiel am Anpfiff anhalten.
   * @param {string} managerId
   */
  anpfeifen(managerId) {
    const manager = this.managerMit(managerId);
    if (!manager) return { fehler: 'In dieser Welt führt kein Mensch einen Verein.' };
    if (manager.status === 'entlassen' || this.wartetAufStelle()) return { fehler: 'Du bist entlassen. Wähle zuerst einen neuen Verein.' };
    if (this.offen) return { fehler: 'Das Spiel läuft schon.' };
    const termin = TERMINE[this.termin];
    if (!this.eigenesSpielAm(manager.vereinId, termin)?.gegnerId) return { fehler: 'An diesem Termin spielt dein Verein nicht.' };
    return this.terminRechnen({ managerId: manager.managerId });
  }

  /**
   * Das laufende Spiel weiterrechnen - bis zu einer Minute, mit oder ohne
   * Eingriff. Ist es aus, schliesst der Termin.
   *
   * @param {string} managerId
   * @param {{bis?: number|null, wechsel?: {raus: string, rein: string}|null, taktik?: object|null}} zug
   */
  liveSpielen(managerId, { bis = null, wechsel = null, taktik = null } = {}) {
    const offen = this.offen;
    if (!offen) return { fehler: 'Es läuft kein Spiel.' };
    const manager = this.managerMit(managerId);
    if (!manager || manager.managerId !== offen.live.managerId) return { fehler: 'Das laufende Spiel gehört einem anderen.' };
    const { spiel } = offen.live;
    // Was der Zug nicht nennt, bleibt, wie es ist.
    const geaendert = taktik && Object.fromEntries(Object.entries(taktik).filter(([, wert]) => wert !== undefined && wert !== null));
    if (wechsel || (geaendert && Object.keys(geaendert).length)) {
      const eingriff = eingreifen(spiel, offen.live.seite, { wechsel, taktik: geaendert });
      if (eingriff.fehler) return eingriff;
    }
    if (bis !== null) {
      if (!Number.isFinite(bis) || bis <= spiel.minute) return { fehler: 'Bis zu welcher Minute?' };
      spielen(spiel, bis);
    }
    if (spiel.vorbei) return this.offenesSpielBeenden();
    return { ok: true, laufend: this.laufendZeigen(managerId) };
  }

  /** Abpfeifen - was fehlt, mit Automatik - und den Termin abschliessen. */
  offenesSpielBeenden() {
    const offen = this.offen;
    const { spiel, stelle, managerId } = offen.live;
    const ergebnis = abpfiff(spiel);
    offen.spiele[stelle].ergebnis = ergebnis;
    const gezeigt = this.laufendZeigen(managerId);
    delete this.offen;
    return { ...this.terminAbschliessen(offen), laufend: gezeigt };
  }

  /**
   * Was der Browser vom laufenden Spiel sieht: nur, was bis zur gezeigten
   * Minute geschehen ist (karriere AC-32). Der Rest des Termins steht in
   * `this.offen` und geht nicht hinaus.
   */
  laufendZeigen(managerId) {
    const offen = this.offen;
    if (!offen || offen.live.managerId !== managerId) return null;
    const { spiel, seite } = offen.live;
    const name = (id) => this.vereinVon(id).name;
    const eigene = spiel.seiten[seite === 'heim' ? 0 : 1];
    const bis = (e) => e.minute <= spiel.minute;
    return {
      heim: { id: spiel.heim, name: name(spiel.heim) },
      gast: { id: spiel.gast, name: name(spiel.gast) },
      seite,
      minute: spiel.minute,
      vorbei: spiel.vorbei,
      verlaengerung: spiel.verlaengerung,
      elfmeter: spiel.elfmeter,
      tore: [spiel.seiten[0].tore, spiel.seiten[1].tore],
      ereignisse: spiel.ereignisse.filter(bis),
      szenen: (spiel.szenen?.liste || []).filter(bis),
      eigene: {
        auf: eigene.auf.map((s) => ({ id: s.id, name: s.name, platz: s.platz })),
        bank: eigene.bank.map((s) => ({ id: s.id, name: s.name, position: s.position })),
        wechsel: eigene.wechsel,
        taktik: eigene.taktik,
      },
    };
  }
}

module.exports = { Live };
