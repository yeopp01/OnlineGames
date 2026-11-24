'use strict';

// Was ein Manager befiehlt: Taktik, Aufstellung, Training, Stadion,
// Transfers, Vertraege, eine neue Stelle. Jeder Zug prueft zuerst, ob er
// gerade erlaubt ist (`mensch()`), und gibt einen Grund zurueck, wenn nicht.
// Methoden der Karriere; zusammengesetzt in karriere.js.
const kader = require('./kader');
const finanzen = require('./finanzen');
const vertraege = require('./vertraege');
const vorstand = require('./vorstand');
const transfer = require('./transfer');
const { fensterOffen } = require('./kalender');
const { taktikPruefen } = require('./spieltag');
const { TERMINE, geld, zahlOder } = require('./welt');

class Zuege {
  // ---------------------------------------------------------- Anweisungen

  /**
   * Darf dieser Manager ziehen? Gibt ihn und seinen Verein zurueck - oder
   * einen Fehler, wenn es ihn nicht gibt oder er entlassen ist.
   */
  amZug(managerId) {
    const manager = this.managerMit(managerId);
    if (!manager) return { fehler: 'In dieser Welt führt kein Mensch einen Verein.' };
    if (manager.status === 'entlassen') return { fehler: 'Du bist entlassen. Wähle zuerst einen neuen Verein.' };
    // Waehrend ein eigenes Spiel laeuft, greift man nur in das Spiel ein.
    if (this.offen) return { fehler: 'Erst das laufende Spiel zu Ende spielen.' };
    return { manager, verein: this.vereinVon(manager.vereinId) };
  }

  spielerVon(verein, spielerId) {
    return verein.spieler.find((s) => s.id === spielerId) || null;
  }

  taktikSetzen(managerId, taktik = {}) {
    const { fehler, manager, verein } = this.amZug(managerId);
    if (fehler) return { fehler };
    const eigener = verein;
    if (taktik.system !== undefined && !kader.SYSTEME[taktik.system]) return { fehler: `Unbekanntes System: ${taktik.system}` };
    const neu = taktikPruefen({
      system: taktik.system ?? eigener.taktik.system,
      ausrichtung: zahlOder(taktik.ausrichtung, eigener.taktik.ausrichtung),
      haerte: zahlOder(taktik.haerte, eigener.taktik.haerte),
      pressing: zahlOder(taktik.pressing, eigener.taktik.pressing),
    });
    // Ein Systemwechsel macht eine Aufstellung ungueltig, die zum alten
    // System passte - lieber verwerfen als heimlich stehen lassen.
    const verworfen = Boolean(eigener.aufstellung && eigener.aufstellung.system !== neu.system);
    if (verworfen) eigener.aufstellung = null;
    eigener.taktik = neu;
    return { ok: true, taktik: neu, aufstellungVerworfen: verworfen };
  }

  aufstellen(managerId, ids, system) {
    const { fehler, manager, verein } = this.amZug(managerId);
    if (fehler) return { fehler };
    if (system === undefined) system = verein.taktik.system;
    const geprueft = kader.elfPruefen(verein, ids, system);
    if (!geprueft.ok) return { fehler: geprueft.fehler };
    verein.aufstellung = { system, ids: [...ids] };
    verein.taktik = { ...verein.taktik, system };
    return { ok: true, aufstellung: verein.aufstellung };
  }

  /** Die beste Elf zum eingestellten System merken - fuer den Knopf "Beste Elf". */
  aufstellenAutomatisch(managerId) {
    const { fehler, manager, verein } = this.amZug(managerId);
    if (fehler) return { fehler };
    const elf = kader.elfStellen(verein, verein.taktik.system);
    const geprueft = this.aufstellen(managerId, elf.map((s) => s.id), verein.taktik.system);
    if (geprueft.ok) return geprueft;
    verein.aufstellung = null;
    return { ok: true, aufstellung: null, hinweis: `${geprueft.fehler} Es spielt jede Woche die beste Elf.` };
  }

  /** Keine feste Elf: der Rechner stellt vor jedem Spiel die beste auf. */
  aufstellungFreigeben(managerId) {
    const { fehler, manager, verein } = this.amZug(managerId);
    if (fehler) return { fehler };
    verein.aufstellung = null;
    return { ok: true, aufstellung: null };
  }

  wechselregelSetzen(managerId, regel) {
    const { fehler, manager, verein } = this.amZug(managerId);
    if (fehler) return { fehler };
    if (regel !== 'auto' && regel !== 'verletzung') return { fehler: 'Wechsel: "auto" oder "verletzung".' };
    verein.wechselregel = regel;
    return { ok: true, wechselregel: regel };
  }

  schwerpunktSetzen(managerId, schwerpunkt) {
    const { fehler, manager, verein } = this.amZug(managerId);
    if (fehler) return { fehler };
    if (!kader.SCHWERPUNKTE.includes(schwerpunkt)) return { fehler: `Unbekannter Trainingsschwerpunkt: ${schwerpunkt}` };
    verein.schwerpunkt = schwerpunkt;
    return { ok: true, schwerpunkt };
  }

  trainingSetzen(managerId, wert) {
    const { fehler, manager, verein } = this.amZug(managerId);
    if (fehler) return { fehler };
    if (!Number.isFinite(wert)) return { fehler: 'Kein gültiger Wert.' };
    verein.training = Math.min(100, Math.max(0, Math.round(wert)));
    return { ok: true, training: verein.training };
  }

  eintrittSetzen(managerId, preis) {
    const { fehler, manager, verein } = this.amZug(managerId);
    if (fehler) return { fehler };
    const geprueft = finanzen.eintrittPruefen(preis);
    if (geprueft === null) return { fehler: 'Kein gültiger Eintrittspreis.' };
    verein.eintritt = geprueft;
    return { ok: true, eintritt: geprueft };
  }

  sponsorWaehlen(managerId, id) {
    const { fehler, manager, verein } = this.amZug(managerId);
    if (fehler) return { fehler };
    if (this.termin !== 0 || verein.sponsor) return { fehler: 'Der Sponsorvertrag für diese Saison steht schon.' };
    const angebot = manager.sponsorAngebote.find((a) => a.id === id);
    if (!angebot) return { fehler: 'Dieses Sponsorangebot gibt es nicht.' };
    verein.sponsor = angebot;
    manager.sponsorAngebote = [];
    this.melden(manager, 'finanzen', `${angebot.name} ist Sponsor für die Saison ${this.saison}: ${geld(angebot.jeSpiel)} je Ligaspiel, `
      + `${geld(angebot.jeSieg)} je Sieg.`);
    return { ok: true, sponsor: angebot };
  }

  stadionAusbauen(managerId, stufe) {
    const { fehler, manager, verein } = this.amZug(managerId);
    if (fehler) return { fehler };
    const plan = finanzen.ausbauPruefen(verein, stufe);
    if (plan.fehler) return plan;
    verein.stadion.ausbau = { plaetze: plan.plaetze, rest: plan.termine };
    this.buchen(verein, 'stadion', -plan.kosten, `Stadionausbau um ${plan.plaetze.toLocaleString('de-DE')} Plätze`);
    this.melden(manager, 'finanzen', `Der Stadionausbau beginnt: ${plan.plaetze.toLocaleString('de-DE')} Plätze in ${plan.termine} Wochen.`);
    return { ok: true, ausbau: verein.stadion.ausbau };
  }

  kaufen(managerId, spielerId, gebot, laufzeit) {
    const { fehler, manager, verein } = this.amZug(managerId);
    if (fehler) return { fehler };
    const eigener = verein;
    const urteil = transfer.kaufPruefen(this, eigener, spielerId, gebot, laufzeit);
    if (urteil.fehler) return urteil;
    const { spieler, verkaeufer, abloese } = urteil;
    transfer.wechseln(this, { kaeufer: eigener, verkaeufer, spieler, abloese, laufzeit });
    this.melden(manager, 'transfer', `${spieler.name} (${spieler.position}, Stärke ${spieler.staerke}) kommt `
      + `${verkaeufer ? `von ${verkaeufer.name} für ${geld(abloese)}` : 'ablösefrei'}, Vertrag bis Saison ${spieler.vertrag.bis}, `
      + `${geld(spieler.vertrag.gehalt)} im Jahr.`);
    return { ok: true, spieler: { id: spieler.id, name: spieler.name }, abloese };
  }

  verlaengern(managerId, spielerId, laufzeit) {
    const { fehler, manager, verein } = this.amZug(managerId);
    if (fehler) return { fehler };
    const spieler = this.spielerVon(verein, spielerId);
    if (!spieler) return { fehler: 'Dieser Spieler gehört nicht zum Kader.' };
    const ergebnis = vertraege.verlaengern(spieler, laufzeit, this.saison, this.startwert);
    if (ergebnis.fehler) return ergebnis;
    this.melden(manager, 'verein', `${spieler.name} verlängert bis Saison ${ergebnis.bis}, ${geld(ergebnis.gehalt)} im Jahr.`);
    return ergebnis;
  }

  spielerFreistellen(managerId, spielerId) {
    const { fehler, manager, verein } = this.amZug(managerId);
    if (fehler) return { fehler };
    const eigener = verein;
    const spieler = this.spielerVon(verein, spielerId);
    if (!spieler) return { fehler: 'Dieser Spieler gehört nicht zum Kader.' };
    if (transfer.bestandNachAbgang(eigener, spieler) < kader.MINDESTBESTAND[spieler.position]) {
      return { fehler: `Ohne ${spieler.name} bleiben zu wenige auf ${spieler.position}.` };
    }
    const abfindung = vertraege.abfindung(spieler, this.saison);
    transfer.freistellen(this, eigener, spieler);
    this.buchen(eigener, 'abfindungen', -abfindung, `Abfindung für ${spieler.name}`);
    this.melden(manager, 'verein', `${spieler.name} ist freigestellt. Abfindung: ${geld(abfindung)}.`);
    return { ok: true, abfindung };
  }

  transferlisteSetzen(managerId, spielerId, an) {
    const { fehler, manager, verein } = this.amZug(managerId);
    if (fehler) return { fehler };
    const spieler = this.spielerVon(verein, spielerId);
    if (!spieler) return { fehler: 'Dieser Spieler gehört nicht zum Kader.' };
    spieler.transferliste = an ? this.saison : null;
    return { ok: true, transferliste: Boolean(an) };
  }

  angebotAnnehmen(managerId, angebotId) {
    const { fehler, manager, verein } = this.amZug(managerId);
    if (fehler) return { fehler };
    const eigener = verein;
    const angebot = manager.angebote.find((a) => a.id === angebotId);
    if (!angebot) return { fehler: 'Dieses Angebot gibt es nicht mehr.' };
    const spieler = this.spielerVon(verein, angebot.spielerId);
    const kaeufer = this.vereinVon(angebot.vereinId);
    const weg = () => { manager.angebote = manager.angebote.filter((a) => a.id !== angebotId); };
    if (!spieler || !kaeufer) {
      weg();
      return { fehler: 'Dieses Angebot gibt es nicht mehr.' };
    }
    if (!fensterOffen(TERMINE[this.termin])) return { fehler: 'Das Transferfenster ist geschlossen.' };
    if (transfer.bestandNachAbgang(eigener, spieler) < kader.MINDESTBESTAND[spieler.position]) {
      return { fehler: `Ohne ${spieler.name} bleiben zu wenige auf ${spieler.position}.` };
    }
    if (kaeufer.spieler.length >= kader.KADER_MAX || kaeufer.konto < angebot.gebot) {
      weg();
      return { fehler: `${kaeufer.name} kann den Wechsel nicht mehr stemmen.` };
    }
    transfer.wechseln(this, {
      kaeufer, verkaeufer: eigener, spieler, abloese: angebot.gebot, laufzeit: Math.min(3, vertraege.laufzeitMax(spieler)),
    });
    manager.angebote = manager.angebote.filter((a) => a.spielerId !== spieler.id);
    this.melden(manager, 'transfer', `${spieler.name} wechselt für ${geld(angebot.gebot)} zu ${kaeufer.name}.`);
    return { ok: true, erloes: angebot.gebot };
  }

  angebotAblehnen(managerId, angebotId) {
    const { fehler, manager, verein } = this.amZug(managerId);
    if (fehler) return { fehler };
    const vorher = manager.angebote.length;
    manager.angebote = manager.angebote.filter((a) => a.id !== angebotId);
    if (manager.angebote.length === vorher) return { fehler: 'Dieses Angebot gibt es nicht mehr.' };
    return { ok: true };
  }

  stelleAntreten(managerId, vereinId) {
    const manager = this.managerMit(managerId);
    if (!manager) return { fehler: 'In dieser Welt führt kein Mensch einen Verein.' };
    if (manager.status !== 'entlassen') return { fehler: 'Du hast eine Stelle.' };
    if (!manager.stellen.includes(vereinId)) return { fehler: 'Dieser Verein hat dir keine Stelle angeboten.' };
    const alter = this.vereinVon(manager.vereinId);
    if (!alter.sponsor) alter.sponsor = manager.sponsorAngebote[1] || null;
    manager.vereinId = vereinId;
    manager.status = 'laeuft';
    manager.stellen = [];
    manager.sponsorAngebote = [];
    const neu = this.vereinVon(vereinId);
    neu.aufstellung = null;
    manager.vorstand = { ziel: vorstand.saisonziel(this.vereine, neu), vertrauen: vorstand.VERTRAUEN_NEU };
    manager.kasse = { saison: this.saison, posten: {} };
    manager.vorjahr = null;
    this.melden(manager, 'vorstand', `Neue Stelle bei ${neu.name} (${neu.liga}. Liga). Ziel: ${manager.vorstand.ziel.text}.`);
    return { ok: true };
  }
}

module.exports = { Zuege };
