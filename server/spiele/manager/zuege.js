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

  mensch() {
    if (!this.verein) return { fehler: 'In dieser Welt führt kein Mensch einen Verein.' };
    if (this.status === 'entlassen') return { fehler: 'Du bist entlassen. Wähle zuerst einen neuen Verein.' };
    return null;
  }

  spielerVon(spielerId) {
    return this.verein.spieler.find((s) => s.id === spielerId) || null;
  }

  taktikSetzen(taktik = {}) {
    const halt = this.mensch();
    if (halt) return halt;
    const eigener = this.verein;
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

  aufstellen(ids, system = this.verein?.taktik.system) {
    const halt = this.mensch();
    if (halt) return halt;
    const geprueft = kader.elfPruefen(this.verein, ids, system);
    if (!geprueft.ok) return { fehler: geprueft.fehler };
    this.verein.aufstellung = { system, ids: [...ids] };
    this.verein.taktik = { ...this.verein.taktik, system };
    return { ok: true, aufstellung: this.verein.aufstellung };
  }

  /** Die beste Elf zum eingestellten System merken - fuer den Knopf "Beste Elf". */
  aufstellenAutomatisch() {
    const halt = this.mensch();
    if (halt) return halt;
    const elf = kader.elfStellen(this.verein, this.verein.taktik.system);
    const geprueft = this.aufstellen(elf.map((s) => s.id), this.verein.taktik.system);
    if (geprueft.ok) return geprueft;
    this.verein.aufstellung = null;
    return { ok: true, aufstellung: null, hinweis: `${geprueft.fehler} Es spielt jede Woche die beste Elf.` };
  }

  /** Keine feste Elf: der Rechner stellt vor jedem Spiel die beste auf. */
  aufstellungFreigeben() {
    const halt = this.mensch();
    if (halt) return halt;
    this.verein.aufstellung = null;
    return { ok: true, aufstellung: null };
  }

  wechselregelSetzen(regel) {
    const halt = this.mensch();
    if (halt) return halt;
    if (regel !== 'auto' && regel !== 'verletzung') return { fehler: 'Wechsel: "auto" oder "verletzung".' };
    this.verein.wechselregel = regel;
    return { ok: true, wechselregel: regel };
  }

  schwerpunktSetzen(schwerpunkt) {
    const halt = this.mensch();
    if (halt) return halt;
    if (!kader.SCHWERPUNKTE.includes(schwerpunkt)) return { fehler: `Unbekannter Trainingsschwerpunkt: ${schwerpunkt}` };
    this.verein.schwerpunkt = schwerpunkt;
    return { ok: true, schwerpunkt };
  }

  trainingSetzen(wert) {
    const halt = this.mensch();
    if (halt) return halt;
    if (!Number.isFinite(wert)) return { fehler: 'Kein gültiger Wert.' };
    this.verein.training = Math.min(100, Math.max(0, Math.round(wert)));
    return { ok: true, training: this.verein.training };
  }

  eintrittSetzen(preis) {
    const halt = this.mensch();
    if (halt) return halt;
    const geprueft = finanzen.eintrittPruefen(preis);
    if (geprueft === null) return { fehler: 'Kein gültiger Eintrittspreis.' };
    this.verein.eintritt = geprueft;
    return { ok: true, eintritt: geprueft };
  }

  sponsorWaehlen(id) {
    const halt = this.mensch();
    if (halt) return halt;
    if (this.termin !== 0 || this.verein.sponsor) return { fehler: 'Der Sponsorvertrag für diese Saison steht schon.' };
    const angebot = this.sponsorAngebote.find((a) => a.id === id);
    if (!angebot) return { fehler: 'Dieses Sponsorangebot gibt es nicht.' };
    this.verein.sponsor = angebot;
    this.sponsorAngebote = [];
    this.melden('finanzen', `${angebot.name} ist Sponsor für die Saison ${this.saison}: ${geld(angebot.jeSpiel)} je Ligaspiel, `
      + `${geld(angebot.jeSieg)} je Sieg.`);
    return { ok: true, sponsor: angebot };
  }

  stadionAusbauen(stufe) {
    const halt = this.mensch();
    if (halt) return halt;
    const plan = finanzen.ausbauPruefen(this.verein, stufe);
    if (plan.fehler) return plan;
    this.verein.stadion.ausbau = { plaetze: plan.plaetze, rest: plan.termine };
    this.buchen(this.verein, 'stadion', -plan.kosten, `Stadionausbau um ${plan.plaetze.toLocaleString('de-DE')} Plätze`);
    this.melden('finanzen', `Der Stadionausbau beginnt: ${plan.plaetze.toLocaleString('de-DE')} Plätze in ${plan.termine} Wochen.`);
    return { ok: true, ausbau: this.verein.stadion.ausbau };
  }

  kaufen(spielerId, gebot, laufzeit) {
    const halt = this.mensch();
    if (halt) return halt;
    const eigener = this.verein;
    const urteil = transfer.kaufPruefen(this, eigener, spielerId, gebot, laufzeit);
    if (urteil.fehler) return urteil;
    const { spieler, verkaeufer, abloese } = urteil;
    transfer.wechseln(this, { kaeufer: eigener, verkaeufer, spieler, abloese, laufzeit });
    this.melden('transfer', `${spieler.name} (${spieler.position}, Stärke ${spieler.staerke}) kommt `
      + `${verkaeufer ? `von ${verkaeufer.name} für ${geld(abloese)}` : 'ablösefrei'}, Vertrag bis Saison ${spieler.vertrag.bis}, `
      + `${geld(spieler.vertrag.gehalt)} im Jahr.`);
    return { ok: true, spieler: { id: spieler.id, name: spieler.name }, abloese };
  }

  verlaengern(spielerId, laufzeit) {
    const halt = this.mensch();
    if (halt) return halt;
    const spieler = this.spielerVon(spielerId);
    if (!spieler) return { fehler: 'Dieser Spieler gehört nicht zum Kader.' };
    const ergebnis = vertraege.verlaengern(spieler, laufzeit, this.saison);
    if (ergebnis.fehler) return ergebnis;
    this.melden('verein', `${spieler.name} verlängert bis Saison ${ergebnis.bis}, ${geld(ergebnis.gehalt)} im Jahr.`);
    return ergebnis;
  }

  spielerFreistellen(spielerId) {
    const halt = this.mensch();
    if (halt) return halt;
    const eigener = this.verein;
    const spieler = this.spielerVon(spielerId);
    if (!spieler) return { fehler: 'Dieser Spieler gehört nicht zum Kader.' };
    if (transfer.bestandNachAbgang(eigener, spieler) < kader.MINDESTBESTAND[spieler.position]) {
      return { fehler: `Ohne ${spieler.name} bleiben zu wenige auf ${spieler.position}.` };
    }
    const abfindung = vertraege.abfindung(spieler, this.saison);
    transfer.freistellen(this, eigener, spieler);
    this.buchen(eigener, 'abfindungen', -abfindung, `Abfindung für ${spieler.name}`);
    this.melden('verein', `${spieler.name} ist freigestellt. Abfindung: ${geld(abfindung)}.`);
    return { ok: true, abfindung };
  }

  transferlisteSetzen(spielerId, an) {
    const halt = this.mensch();
    if (halt) return halt;
    const spieler = this.spielerVon(spielerId);
    if (!spieler) return { fehler: 'Dieser Spieler gehört nicht zum Kader.' };
    spieler.transferliste = an ? this.saison : null;
    return { ok: true, transferliste: Boolean(an) };
  }

  angebotAnnehmen(angebotId) {
    const halt = this.mensch();
    if (halt) return halt;
    const eigener = this.verein;
    const angebot = this.angebote.find((a) => a.id === angebotId);
    if (!angebot) return { fehler: 'Dieses Angebot gibt es nicht mehr.' };
    const spieler = this.spielerVon(angebot.spielerId);
    const kaeufer = this.vereinVon(angebot.vereinId);
    const weg = () => { this.angebote = this.angebote.filter((a) => a.id !== angebotId); };
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
    this.angebote = this.angebote.filter((a) => a.spielerId !== spieler.id);
    this.melden('transfer', `${spieler.name} wechselt für ${geld(angebot.gebot)} zu ${kaeufer.name}.`);
    return { ok: true, erloes: angebot.gebot };
  }

  angebotAblehnen(angebotId) {
    const halt = this.mensch();
    if (halt) return halt;
    const vorher = this.angebote.length;
    this.angebote = this.angebote.filter((a) => a.id !== angebotId);
    if (this.angebote.length === vorher) return { fehler: 'Dieses Angebot gibt es nicht mehr.' };
    return { ok: true };
  }

  stelleAntreten(vereinId) {
    if (this.status !== 'entlassen') return { fehler: 'Du hast eine Stelle.' };
    if (!this.stellen.includes(vereinId)) return { fehler: 'Dieser Verein hat dir keine Stelle angeboten.' };
    const alter = this.verein;
    if (!alter.sponsor) alter.sponsor = this.sponsorAngebote[1] || null;
    this.vereinId = vereinId;
    this.status = 'laeuft';
    this.stellen = [];
    this.sponsorAngebote = [];
    const neu = this.verein;
    neu.aufstellung = null;
    this.vorstand = { ziel: vorstand.saisonziel(this.vereine, neu), vertrauen: vorstand.VERTRAUEN_NEU };
    this.kasse = { saison: this.saison, posten: {} };
    this.vorjahr = null;
    this.melden('vorstand', `Neue Stelle bei ${neu.name} (${neu.liga}. Liga). Ziel: ${this.vorstand.ziel.text}.`);
    return { ok: true };
  }
}

module.exports = { Zuege };
