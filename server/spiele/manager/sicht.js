'use strict';

// Was ein Manager sieht: der Zustand fuer die Oberflaeche, die Vorschau auf
// den Gegner, Akten, Tabellen, fremde Vereine. Nichts hier aendert den
// Spielstand. Methoden der Karriere; zusammengesetzt in karriere.js.
const kader = require('./kader');
const liga = require('./liga');
const pokal = require('./pokal');
const finanzen = require('./finanzen');
const vertraege = require('./vertraege');
const transfer = require('./transfer');
const { terminTitel, fensterOffen, fensterText } = require('./kalender');
const { mannschaftsteile, AUSRICHTUNGEN } = require('./spieltag');
const { TERMINE } = require('./welt');

class Sicht {
  // ------------------------------------------------------------ Berichte

  paarungZeigen(p) {
    return {
      heim: p.heim,
      gast: p.gast,
      heimName: this.vereinVon(p.heim)?.name ?? '?',
      gastName: this.vereinVon(p.gast)?.name ?? '?',
      tore: p.tore,
      sieger: p.sieger ?? null,
      verlaengerung: Boolean(p.verlaengerung),
      elfmeter: p.elfmeter ?? null,
      eigenes: p.heim === this.vereinId || p.gast === this.vereinId,
    };
  }

  markt(filter) {
    return { ...transfer.marktliste(this, filter), fenster: { offen: fensterOffen(TERMINE[this.termin]), text: fensterText(TERMINE[this.termin]) } };
  }

  // ---------------------------------------------------- Fuer den Browser

  eigenesSpielAm(termin) {
    const eigener = this.verein;
    if (!eigener) return null;
    const zeigen = (p) => {
      const daheim = p.heim === eigener.id;
      return {
        gegnerId: daheim ? p.gast : p.heim,
        gegner: this.vereinVon(daheim ? p.gast : p.heim)?.name ?? '?',
        daheim,
        tore: p.tore ?? null,
        sieger: p.sieger ?? null,
        verlaengerung: Boolean(p.verlaengerung),
        elfmeter: p.elfmeter ?? null,
      };
    };
    if (termin.art === 'liga') {
      const p = this.plaene[eigener.liga][termin.nr - 1].find((x) => x.heim === eigener.id || x.gast === eigener.id);
      return p ? zeigen(p) : null;
    }
    if (termin.art === 'pokal') {
      const runde = this.pokal.runden[termin.runde - 1];
      if (!runde.paarungen.length) return { offen: true };
      const p = runde.paarungen.find((x) => x.heim === eigener.id || x.gast === eigener.id);
      return p ? zeigen(p) : { frei: true };
    }
    return null;
  }

  /**
   * Vor dem naechsten eigenen Spiel: beide Vereine nebeneinander - Platz,
   * Form, Kader, Ausfaelle, die bisherigen Begegnungen der Saison und die
   * Mannschaftsteile der Elf, die heute spielen wuerde. Liest nur. Die
   * Einschaetzung folgt derselben Regel, mit der sich die anderen Vereine auf
   * ihren Gegner einstellen (→ kiTaktik).
   */
  vorschau() {
    const eigener = this.verein;
    const termin = TERMINE[this.termin];
    const spiel = eigener && this.eigenesSpielAm(termin);
    const gegner = spiel && spiel.gegnerId ? this.vereinVon(spiel.gegnerId) : null;
    if (!gegner) return null;
    const neutral = termin.art === 'pokal' && termin.runde === pokal.RUNDEN.length;
    // Aus Sicht des Vereins: S, U oder N - im Pokal entscheidet der Sieger.
    const ausgang = (p, id) => {
      if (p.sieger) return p.sieger === id ? 'S' : 'N';
      const [eigene, fremde] = p.heim === id ? p.tore : [p.tore[1], p.tore[0]];
      return eigene > fremde ? 'S' : eigene < fremde ? 'N' : 'U';
    };
    const seite = (verein, { elf, system }) => {
      const zeile = this.tabellen[verein.liga].find((z) => z.id === verein.id);
      return {
        id: verein.id,
        name: verein.name,
        liga: verein.liga,
        platz: zeile && zeile.spiele ? this.platz(verein.id) : null,
        punkte: zeile ? liga.wertung(zeile) : 0,
        niveau: Math.round(kader.niveau(verein)),
        system,
        teile: mannschaftsteile(verein, elf, system),
        form: this.plaene[verein.liga].flat()
          .filter((p) => p.tore && (p.heim === verein.id || p.gast === verein.id))
          .slice(-5)
          .map((p) => ausgang(p, verein.id)),
        ausfaelle: verein.spieler.filter((s) => !kader.einsatzbereit(s))
          .map((s) => ({
            name: s.name, position: s.position, rolle: s.rolle, grund: kader.ausfallgrund(s),
          })),
      };
    };

    const beide = (p) => p.tore && [p.heim, p.gast].includes(eigener.id) && [p.heim, p.gast].includes(gegner.id);
    const begegnungZeigen = (p, titel) => ({
      titel,
      daheim: p.heim === eigener.id,
      tore: p.heim === eigener.id ? p.tore : [p.tore[1], p.tore[0]],
      ausgang: ausgang(p, eigener.id),
      verlaengerung: Boolean(p.verlaengerung),
      elfmeter: p.elfmeter ? (p.heim === eigener.id ? p.elfmeter : [p.elfmeter[1], p.elfmeter[0]]) : null,
    });
    const bisher = [];
    if (eigener.liga === gegner.liga) {
      this.plaene[eigener.liga].forEach((tag, i) => {
        for (const p of tag.filter(beide)) bisher.push(begegnungZeigen(p, `${i + 1}. Spieltag`));
      });
    }
    for (const runde of this.pokal.runden) {
      for (const p of runde.paarungen.filter(beide)) bisher.push(begegnungZeigen(p, `Pokal, ${runde.name}`));
    }

    const vorteil = kader.niveau(eigener) - kader.niveau(gegner) + (neutral ? 0 : spiel.daheim ? 2 : -2);
    return {
      titel: terminTitel(termin),
      wettbewerb: termin.art,
      daheim: spiel.daheim,
      neutral,
      eigen: seite(eigener, kader.elfFuerSpiel(eigener)),
      gegner: seite(gegner, { elf: kader.elfStellen(gegner, gegner.taktik.system), system: gegner.taktik.system }),
      bisher,
      einschaetzung: vorteil >= 3 ? 'favorit' : vorteil <= -3 ? 'aussenseiter' : 'offen',
    };
  }

  /**
   * Die Staerke des eigenen Vereins auf einen Blick: der Kader im Vergleich
   * der Liga und die Mannschaftsteile der Elf, die heute spielen wuerde -
   * gerechnet wie in der Vorschau auf den Gegner.
   */
  staerkeZeigen(verein) {
    const eigen = kader.niveau(verein);
    const liga = this.vereine.filter((v) => v.liga === verein.liga);
    const { elf, system } = kader.elfFuerSpiel(verein);
    return {
      niveau: Math.round(eigen),
      rang: 1 + liga.filter((v) => kader.niveau(v) > eigen).length,
      vereine: liga.length,
      teile: mannschaftsteile(verein, elf, system),
    };
  }

  /** Die Akte eines Spielers, wo immer er steht: Saison fuer Saison, jeder Wechsel, die laufende Saison. */
  spielerAkte(spielerId) {
    const gefunden = transfer.finden(this, spielerId);
    if (!gefunden) return { fehler: 'Diesen Spieler gibt es nicht.' };
    const { spieler: s, verein } = gefunden;
    const vereinsname = (id) => (id ? this.vereinVon(id)?.name ?? '?' : 'vereinslos');
    const schnitt = (werte) => (werte.noten ? Math.round((werte.notenSumme / werte.noten) * 10) / 10 : null);
    return {
      id: s.id,
      name: s.name,
      position: s.position,
      rolle: s.rolle,
      nebenrolle: s.nebenrolle,
      alter: s.alter,
      staerke: s.staerke,
      talent: s.talent,
      wert: kader.marktwert(s),
      verein: verein ? verein.name : 'vereinslos',
      vereinId: verein ? verein.id : null,
      liga: verein ? verein.liga : null,
      vertragBis: s.vertrag ? s.vertrag.bis : null,
      karriereende: s.karriereende === this.saison,
      saison: {
        saison: this.saison, spiele: s.saison.spiele, tore: s.saison.tore, vorlagen: s.saison.vorlagen, note: schnitt(s.saison),
      },
      stationen: (s.laufbahn.stationen || []).map(([saison, vereinId, liga, spiele, tore, vorlagen, note, staerke, alter]) => ({
        saison, verein: vereinsname(vereinId), liga, spiele, tore, vorlagen, note: note ? note / 10 : null, staerke, alter,
      })),
      wechsel: (s.laufbahn.wechsel || []).map(([saison, termin, von, zu, abloese]) => ({
        saison, datum: terminTitel(TERMINE[termin]), von: vereinsname(von), zu: vereinsname(zu), abloese,
      })),
    };
  }

  spielerZeigen(s) {
    return {
      id: s.id,
      name: s.name,
      position: s.position,
      rolle: s.rolle,
      nebenrolle: s.nebenrolle,
      alter: s.alter,
      staerke: s.staerke,
      talent: s.talent,
      kondition: s.kondition,
      moral: s.moral,
      gelbe: s.gelbe,
      sperre: s.sperre,
      verletzt: s.verletzt,
      jugend: Boolean(s.jugend),
      transferliste: Boolean(s.transferliste),
      vertrag: s.vertrag,
      saison: {
        spiele: s.saison.spiele,
        minuten: s.saison.minuten,
        tore: s.saison.tore,
        vorlagen: s.saison.vorlagen,
        note: s.saison.noten ? Math.round((s.saison.notenSumme / s.saison.noten) * 10) / 10 : null,
        gelbe: s.saison.gelbe,
        platzverweise: s.saison.platzverweise,
      },
      laufbahn: s.laufbahn,
      wert: kader.marktwert(s),
      bereit: kader.einsatzbereit(s),
      ausfall: kader.ausfallgrund(s),
      gehaltswunsch: vertraege.gehaltswunsch(s),
      laufzeitMax: vertraege.laufzeitMax(s),
      verlaengerbar: Boolean(s.vertrag && s.vertrag.bis <= this.saison + 1 && s.karriereende !== this.saison),
      karriereende: s.karriereende === this.saison,
      abfindung: vertraege.abfindung(s, this.saison),
    };
  }

  tabelleZeigen(nummer) {
    return liga.sortiert(this.tabellen[nummer]).map((z, i) => ({
      platz: i + 1,
      ...z,
      wertung: liga.wertung(z),
      zone: nummer === 1 ? (i === 0 ? 'meister' : i >= 18 - liga.AUF_UND_AB ? 'abstieg' : null) : (i < liga.AUF_UND_AB ? 'aufstieg' : null),
      eigenes: z.id === this.vereinId,
    }));
  }

  /** Was der Browser zu sehen bekommt: der eigene Verein ganz, die Welt im Ueberblick. */
  zustand() {
    const eigener = this.verein;
    const termin = TERMINE[this.termin];
    const kalender = TERMINE.map((t, i) => ({
      index: i, titel: terminTitel(t), art: t.art, erledigt: i < this.termin, spiel: this.eigenesSpielAm(t),
    }));
    const torjaeger = (nummer) => Object.values(this.torjaeger[nummer])
      .sort((a, b) => b.tore - a.tore || a.name.localeCompare(b.name)).slice(0, 20);
    const gehaltJahr = eigener ? eigener.spieler.reduce((s, x) => s + (x.vertrag?.gehalt || 0), 0) : 0;

    return {
      fassung: this.fassung,
      name: this.name,
      startwert: this.startwert,
      saison: this.saison,
      status: this.status,
      termin: { index: this.termin, titel: terminTitel(termin), art: termin.art },
      naechster: kalender[this.termin],
      vorschau: this.vorschau(),
      kalender,
      fenster: { offen: fensterOffen(termin), text: fensterText(termin) },
      stellen: this.stellen.map((id) => {
        const v = this.vereinVon(id);
        return { id, name: v.name, liga: v.liga, niveau: Math.round(kader.niveau(v)), reputation: v.reputation };
      }),
      verein: eigener && {
        id: eigener.id,
        name: eigener.name,
        liga: eigener.liga,
        platz: this.platz(),
        konto: eigener.konto,
        reputation: eigener.reputation,
        niveau: Math.round(kader.niveau(eigener)),
        stadion: eigener.stadion,
        eintritt: eigener.eintritt,
        sponsor: eigener.sponsor,
        taktik: eigener.taktik,
        training: eigener.training,
        schwerpunkt: eigener.schwerpunkt,
        einstudiert: eigener.einstudiert,
        wechselregel: eigener.wechselregel,
        aufstellung: eigener.aufstellung,
        // Fuer "Beste Elf" und zum Vergleich: so wuerde der Rechner heute aufstellen.
        besteElf: kader.elfStellen(eigener, eigener.taktik.system).map((s) => s.id),
        staerke: this.staerkeZeigen(eigener),
        gehaltJahr,
        gehaltJeTermin: finanzen.gehaelter(eigener),
        fernsehgeld: finanzen.fernsehgeld(eigener),
        spieler: eigener.spieler.map((s) => this.spielerZeigen(s)),
      },
      vorstand: this.vorstand,
      sponsorAngebote: this.sponsorAngebote,
      ausbau: finanzen.AUSBAU,
      kasse: this.kasse,
      vorjahr: this.vorjahr,
      angebote: this.angebote,
      tabellen: { 1: this.tabelleZeigen(1), 2: this.tabelleZeigen(2) },
      torjaeger: { 1: torjaeger(1), 2: torjaeger(2) },
      pokal: {
        aktuell: this.pokal.aktuell,
        sieger: this.pokal.sieger ? this.vereinVon(this.pokal.sieger).name : null,
        runden: this.pokal.runden.map((r) => ({ name: r.name, paarungen: r.paarungen.map((p) => this.paarungZeigen(p)) })),
      },
      nachrichten: this.nachrichten.slice(-80).reverse(),
      buch: this.buch.slice(-80).reverse(),
      ticker: this.ticker.slice(0, 25),
      historie: this.historie.slice(0, 10),
      zuletzt: this.zuletzt,
      entwicklungen: this.entwicklungen || [],
      systeme: kader.SYSTEME_NAMEN,
      plaetze: kader.PLAETZE,
      rollen: kader.ROLLEN,
      eignung: { tabelle: kader.eignungstabelle(), neben: kader.NEBENROLLE },
      ausrichtungen: AUSRICHTUNGEN,
      schwerpunkte: kader.SCHWERPUNKTE,
    };
  }

  /** Ein anderer Verein, wie ihn ein Beobachter sieht: Kader, Werte, Preise. */
  vereinAnsicht(vereinId) {
    const verein = this.vereinVon(vereinId);
    if (!verein) return { fehler: 'Diesen Verein gibt es nicht.' };
    const fremd = verein.id !== this.vereinId;
    return {
      id: verein.id,
      name: verein.name,
      liga: verein.liga,
      platz: this.platz(verein.id),
      niveau: Math.round(kader.niveau(verein)),
      reputation: verein.reputation,
      plaetze: verein.stadion.plaetze,
      system: verein.taktik.system,
      spieler: verein.spieler
        .slice()
        .sort((a, b) => kader.ROLLEN.indexOf(a.rolle) - kader.ROLLEN.indexOf(b.rolle) || b.staerke - a.staerke)
        .map((s) => ({
          id: s.id,
          name: s.name,
          position: s.position,
          rolle: s.rolle,
          nebenrolle: s.nebenrolle,
          karriereende: s.karriereende === this.saison,
          alter: s.alter,
          staerke: s.staerke,
          wert: kader.marktwert(s),
          forderung: fremd ? transfer.forderung(verein, s, this.saison) : null,
          vertragBis: s.vertrag ? s.vertrag.bis : null,
          tore: s.saison.tore,
          spiele: s.saison.spiele,
          ausfall: kader.ausfallgrund(s),
          verkaeuflich: fremd && transfer.bestandNachAbgang(verein, s) >= kader.MINDESTBESTAND[s.position],
        })),
    };
  }
}

module.exports = { Sicht };
