'use strict';

// Der Lauf der Zeit in einer Karriere: ein Termin nach dem anderen -
// Spieltag, Pokalrunde, Winterpause, Vorbereitung, Saisonwechsel - und die
// 35 Vereine ohne Menschen, die dabei nach denselben Regeln wirtschaften.
// Methoden der Karriere; zusammengesetzt in karriere.js.
const kader = require('./kader');
const liga = require('./liga');
const pokal = require('./pokal');
const finanzen = require('./finanzen');
const vorstand = require('./vorstand');
const transfer = require('./transfer');
const { terminTitel, fensterOffen, fensterText, WINTERPAUSE_NACH } = require('./kalender');
const { anpfiff, begegnung, nachwirkung } = require('./spieltag');
const { TERMINE, TABELLEN_IN_HISTORIE, FREIE_MIN, FREIE_MAX, ABSTIEGSKLAUSEL, ZWECK, geld, quelle, mischen } = require('./welt');

class Ablauf {
  // --------------------------------------------------------- Die Saison

  /** Spielplaene, Tabellen, Pokal, Sponsoren, Saisonziel - alles, was eine Saison braucht. */
  saisonVorbereiten() {
    const zufall = quelle(this.startwert, this.saison, 0, ZWECK.start);
    this.plaene = {};
    this.tabellen = {};
    this.torjaeger = { 1: {}, 2: {} };
    for (const nummer of [1, 2]) {
      const mitglieder = this.vereine.filter((v) => v.liga === nummer);
      if (this.saison === 1) {
        mitglieder.slice().sort((a, b) => kader.niveau(b) - kader.niveau(a)).forEach((v, i) => { v.tvRang = i + 1; });
      }
      const ids = mischen(mitglieder.map((v) => v.id), zufall);
      this.plaene[nummer] = liga.spielplan(ids).map((tag) => tag.map((p) => ({ ...p, tore: null })));
      this.tabellen[nummer] = liga.leereTabelle(mitglieder);
    }
    for (const verein of this.vereine) {
      for (const spieler of verein.spieler) {
        spieler.saison = kader.leereSaisonwerte();
        spieler.gelbe = 0;
      }
      if (!this.menschFuehrt(verein.id)) {
        verein.taktik.system = kader.bestesSystem(verein, verein.taktik.system);
        verein.aufstellung = null;
      }
      verein.sponsor = null;
    }
    for (const spieler of this.freie) spieler.saison = kader.leereSaisonwerte();

    const zweite = this.vereine.filter((v) => v.liga === 2).sort((a, b) => a.tvRang - b.tvRang).map((v) => v.id);
    this.pokal = pokal.neuerPokal(pokal.teilnehmer(this.vereine, zweite), quelle(this.startwert, this.saison, 0, ZWECK.auslosung));

    const sponsorZufall = quelle(this.startwert, this.saison, 0, ZWECK.sponsor);
    for (const verein of this.vereine) {
      const angebote = finanzen.sponsorAngebote(verein, sponsorZufall, this.saison);
      const manager = this.managerVon(verein.id);
      if (manager) manager.sponsorAngebote = angebote;
      else verein.sponsor = angebote[1];
    }
    for (const m of this.manager) {
      m.angebote = [];
      m.vorstand.ziel = vorstand.saisonziel(this.vereine, this.vereinVon(m.vereinId));
      m.vorjahr = m.kasse && m.kasse.saison === this.saison - 1 ? m.kasse : null;
      m.kasse = { saison: this.saison, posten: {} };
    }
  }

  /**
   * Den naechsten Termin ausfuehren: Spieltag, Pokalrunde, Winterpause,
   * Vorbereitung oder Saisonende. Ein Zug, ein Termin.
   */
  weiter() {
    if (this.wartetAufStelle()) return { fehler: 'Du bist entlassen. Wähle zuerst einen neuen Verein.' };
    // Liegt ein eigenes Spiel angehalten, spielt "Weiter" es mit Automatik zu
    // Ende - wie jedes Spiel, das niemand live sieht (karriere AC-31).
    if (this.offen) return this.offenesSpielBeenden();
    return this.terminRechnen(null);
  }

  /**
   * Der erste Teil eines Termins: jedes Spiel wird gerechnet, verbucht wird
   * noch nichts. Mit `live` bleibt das Spiel dieses Managers am Anpfiff
   * stehen, und der zweite Teil wartet in `this.offen` auf den Abpfiff
   * (karriere AC-30). Ohne `live` folgt er sofort.
   *
   * Ein Spieltag zieht alle Spiele aus einer Quelle. Das eigene Spiel bekommt
   * deshalb eine Abschrift ihres Stands, und die Quelle rechnet es einmal mit
   * Automatik weiter - so liegen die übrigen Ergebnisse fest, was immer im
   * eigenen Spiel geschieht.
   *
   * @param {{managerId: string}|null} live
   */
  terminRechnen(live) {
    const termin = TERMINE[this.termin];
    const zufall = (zweck) => quelle(this.startwert, this.saison, this.termin, zweck);
    const kontext = { kontoVorher: this.manager.map((m) => this.vereinVon(m.vereinId).konto), spiele: [], live: null };

    this.notkader(zufall(ZWECK.jugend));
    if (termin.art === 'liga') this.ligaRechnen(termin.nr, zufall(ZWECK.liga), kontext, live);
    else if (termin.art === 'pokal') this.pokalRechnen(termin.runde, zufall(ZWECK.pokal), kontext, live);

    if (kontext.live) {
      this.offen = kontext;
      return { ok: true, laufend: this.laufendZeigen(live.managerId) };
    }
    return this.terminAbschliessen(kontext);
  }

  /**
   * Der zweite Teil: verbuchen in der Reihenfolge, in der gerechnet wurde,
   * dann alles, was nach jedem Termin geschieht.
   */
  terminAbschliessen(kontext) {
    const termin = TERMINE[this.termin];
    const zufall = (zweck) => quelle(this.startwert, this.saison, this.termin, zweck);
    const lauf = { verletzt: new Set() };
    const kontoVorher = new Map(this.manager.map((m, i) => [m, kontext.kontoVorher[i]]));

    let bericht;
    if (termin.art === 'vorbereitung') bericht = this.vorbereitung();
    else if (termin.art === 'liga') bericht = this.ligaVerbuchen(termin.nr, kontext.spiele, lauf);
    else if (termin.art === 'pokal') bericht = this.pokalVerbuchen(termin.runde, kontext.spiele, lauf);
    else if (termin.art === 'winterpause') bericht = this.winterpause(zufall(ZWECK.saisonende));
    else bericht = { art: 'saisonende' };

    this.laufendeKosten();
    this.heilen(lauf);
    for (const verein of this.vereine) kader.trainieren(verein);

    if (termin.art === 'saisonende') {
      bericht = this.saisonWechsel();
      return this.berichtMerken(termin, bericht);
    }

    if (fensterOffen(termin)) transfer.kiTransfers(this, zufall(ZWECK.transfer));
    this.termin += 1;

    // Je Manager dieselbe Quelle fuer Angebote und Stellen - mit einem
    // Manager wie in Fassung 3. Fuer mehrere (M3) bekommt jeder seine eigene.
    for (const m of this.manager) {
      if (m.status !== 'laeuft') continue;
      const eigener = this.vereinVon(m.vereinId);
      const offen = fensterOffen(TERMINE[this.termin]);
      m.angebote = offen ? m.angebote.filter((a) => a.gueltigBis >= this.termin) : [];
      // Ein Verein bietet je Fenster hoechstens einmal auf denselben Spieler
      // (transfer AC-31); mit dem Fenster ist es vergessen. Ein Spielstand
      // von vorher kennt das Feld nicht.
      m.geboten = offen ? m.geboten || [] : [];
      if (offen) {
        // Wessen Angebot noch gilt, bietet nicht neu (transfer AC-31).
        const wartet = new Set(m.angebote.map((a) => a.vereinId));
        for (const angebot of transfer.kiAngebote(this, eigener, zufall(ZWECK.angebote), wartet, new Set(m.geboten))) {
          m.angebote = m.angebote.filter((a) => a.vereinId !== angebot.vereinId);
          m.angebote.push(angebot);
          m.geboten.push(`${angebot.vereinId}:${angebot.spielerId}`);
          this.melden(m, 'transfer', `${angebot.verein} bietet ${geld(angebot.gebot)} für ${angebot.spieler} `
            + `(Marktwert ${geld(angebot.wert)}).`);
        }
      }
      vorstand.nachKasse(m.vorstand, eigener.konto);
      if (eigener.konto < 0 && kontoVorher.get(m) >= 0) {
        this.melden(m, 'finanzen', `Das Konto ist im Minus (${geld(eigener.konto)}). Unter ${geld(finanzen.PUNKTABZUG_GRENZE)} `
          + `kostet es zur Winterpause und vor der Saison ${finanzen.PUNKTABZUG} Punkte.`);
      }
      if (termin.art === 'liga' && vorstand.entlassen(m.vorstand, termin.nr)) {
        this.entlassen(m, 'Nach dem Absturz in der Tabelle hat der Vorstand das Vertrauen verloren.', zufall(ZWECK.stellen));
      }
    }
    return this.berichtMerken(termin, bericht);
  }

  /** Der Bericht des Termins - jeder Manager sieht ihn als „zuletzt". */
  berichtMerken(termin, bericht) {
    const zuletzt = { titel: terminTitel(termin), ...bericht };
    for (const m of this.manager) m.zuletzt = zuletzt;
    return { ok: true, bericht: zuletzt };
  }

  /**
   * Mehrere Termine am Stueck. Haelt vor der Winterpause und vor dem
   * Saisonende, damit dort niemand an einer Entscheidung vorbeispult - und
   * sobald der Mensch entlassen ist.
   *
   * @param {{anzahl?: number, bis?: 'winterpause'|'saisonende'}} ziel
   */
  vorspulen({ anzahl = null, bis = null } = {}) {
    const halt = bis === 'winterpause' || bis === 'saisonende' ? bis : null;
    if (!halt && !(Number.isInteger(anzahl) && anzahl > 0)) return { fehler: 'Wie weit? Eine Anzahl oder bis zur Winterpause oder zum Saisonende.' };
    if (halt && TERMINE[this.termin].art === halt) return { fehler: `${terminTitel(TERMINE[this.termin])} steht schon an.` };
    const saison = this.saison;
    let gerechnet = 0;
    while (!this.wartetAufStelle() && this.saison === saison) {
      if (halt && TERMINE[this.termin].art === halt) break;
      if (!halt && gerechnet >= Math.min(anzahl, 60)) break;
      const ergebnis = this.weiter();
      if (ergebnis.fehler) return gerechnet ? { ok: true, gerechnet, hinweis: ergebnis.fehler } : ergebnis;
      gerechnet += 1;
    }
    return { ok: true, gerechnet };
  }

  // ------------------------------------------------------------ Termine

  vorbereitung() {
    for (const m of this.manager) {
      const eigener = this.vereinVon(m.vereinId);
      if (!eigener.sponsor) {
        eigener.sponsor = m.sponsorAngebote[1];
        this.melden(m, 'finanzen', `Du hast keinen Sponsor gewählt - der Vorstand hat ${eigener.sponsor.name} unterschrieben.`);
      }
      m.sponsorAngebote = [];
    }
    // Das Trainingslager: alle kommen frisch in die Saison, und das System
    // sitzt wenigstens zur Haelfte.
    for (const verein of this.vereine) {
      for (const s of verein.spieler) s.kondition = Math.max(s.kondition, 92);
      const systeme = verein.einstudiert.systeme;
      systeme[verein.taktik.system] = Math.max(systeme[verein.taktik.system] ?? 0, 50);
    }
    this.punktabzugPruefen('vor dem Saisonstart');
    for (const m of this.manager) this.melden(m, 'liga', `Saison ${this.saison} beginnt. Ziel des Vorstands: ${m.vorstand.ziel.text}.`);
    return { art: 'vorbereitung', text: `Die Saison ${this.saison} beginnt.` };
  }

  winterpause(zufall) {
    for (const verein of this.vereine) {
      for (const s of verein.spieler) s.kondition = Math.min(100, s.kondition + 15);
      // Ein erster Teil der Entwicklung - Auf- und Abwertungen warten nicht
      // bis zum Sommer.
      const eintraege = kader.entwickeln(verein, zufall, this.pflichtspiele(verein), { anteil: 0.4, altern: false, startwert: this.startwert });
      const manager = this.managerVon(verein.id);
      if (manager) this.entwicklungMerken(manager, 'Winterpause', 'Entwicklung in der Hinrunde', eintraege);
    }
    // Wer zum Saisonende aufhoert, steht jetzt fest - gerechnet mit dem Alter,
    // das er dann hat, und auch mit gueltigem Vertrag. So weiss der Manager es,
    // bevor er verlaengert oder fuer die naechste Saison plant.
    for (const verein of this.vereine) {
      const gehen = verein.spieler.filter((s) => !s.karriereende && kader.hoertAuf({ ...s, alter: s.alter + 1 }, zufall));
      for (const s of gehen) s.karriereende = this.saison;
      const manager = this.managerVon(verein.id);
      if (manager && gehen.length) {
        this.melden(manager, 'verein', `Zum Saisonende hören auf: ${gehen.map((s) => `${s.name} (${s.alter + 1})`).join(', ')}. `
          + 'Sie spielen die Saison zu Ende, verlängern aber nicht mehr.');
      }
    }
    this.punktabzugPruefen('zur Winterpause');
    for (const m of this.manager) {
      const eigener = this.vereinVon(m.vereinId);
      const auslaufend = eigener.spieler.filter((s) => s.vertrag && s.vertrag.bis <= this.saison && !s.karriereende);
      if (auslaufend.length) {
        this.melden(m, 'verein', `Zum Saisonende laufen ${auslaufend.length} Verträge aus: `
          + `${auslaufend.map((s) => s.name).join(', ')}. Wer nicht verlängert, geht.`);
      }
      this.melden(m, 'transfer', `Winterpause. ${fensterText({ art: 'winterpause' })}.`);
    }
    return { art: 'winterpause', text: `Winterpause nach dem ${WINTERPAUSE_NACH}. Spieltag.` };
  }

  /**
   * Die Entwicklung des eigenen Kaders festhalten, Spieler fuer Spieler - mit
   * dem, wonach gerechnet wurde. Das Kaderblatt zeigt die letzten vier; das
   * Postfach zaehlt, wer besser und wer schlechter wurde.
   */
  entwicklungMerken(manager, anlass, ueberschrift, eintraege) {
    const bericht = {
      saison: this.saison,
      anlass,
      technik: Math.round((eintraege[0]?.technik ?? 0.5) * 100),
      spieler: eintraege.map((e) => ({
        id: e.spieler.id,
        name: e.spieler.name,
        rolle: e.spieler.rolle,
        alter: e.alter,
        vorher: e.vorher,
        nachher: e.nachher,
        talent: e.talent,
        spielanteil: Math.round(e.spielanteil * 100),
        stufe: e.stufe,
      })).sort((a, b) => (b.nachher - b.vorher) - (a.nachher - a.vorher) || b.nachher - a.nachher),
    };
    manager.entwicklungen = [bericht, ...(manager.entwicklungen || [])].slice(0, 4);
    const zaehlen = (passt) => bericht.spieler.filter(passt).length;
    const deutlich = [...bericht.spieler].sort((a, b) => Math.abs(b.nachher - b.vorher) - Math.abs(a.nachher - a.vorher))
      .filter((e) => e.nachher !== e.vorher).slice(0, 4);
    this.melden(manager, 'verein', `${ueberschrift}: ${zaehlen((e) => e.nachher > e.vorher)} besser, ${zaehlen((e) => e.nachher < e.vorher)} schlechter, `
      + `${zaehlen((e) => e.nachher === e.vorher)} unverändert - die ganze Liste steht im Kader.`
      + `${deutlich.length ? ` Am deutlichsten: ${deutlich.map((e) => `${e.name} ${e.vorher}→${e.nachher}`).join(', ')}.` : ''}`);
  }

  aufstellungFuer(verein) {
    const manager = this.managerVon(verein.id);
    if (manager) {
      const {
        elf, system, nachgerueckt, verworfen,
      } = kader.elfFuerSpiel(verein);
      for (const n of nachgerueckt) this.melden(manager, 'spiel', `${n.rein} rückte für ${n.raus} in die Elf (${n.platz}).`);
      if (verworfen) this.melden(manager, 'spiel', 'Deine Aufstellung liess sich nicht halten - es spielte die beste Elf.');
      return { elf, bank: kader.bankStellen(verein, elf), system };
    }
    const elf = kader.elfStellen(verein, verein.taktik.system);
    return { elf, bank: kader.bankStellen(verein, elf), system: verein.taktik.system };
  }

  /**
   * Ein Spiel rechnen, ohne etwas zu verbuchen. Fuehrt `live` den Verein
   * eines Menschen, bekommt dessen Spiel eine Abschrift des Zufalls und eine
   * eigene Quelle fuer die Szenen und bleibt am Anpfiff stehen.
   */
  spielRechnen(heim, gast, zufall, optionen, kontext, eintrag, live) {
    if (!this.menschFuehrt(heim.id)) this.kiTaktik(heim, gast, !optionen.neutral);
    if (!this.menschFuehrt(gast.id)) this.kiTaktik(gast, heim, false);
    const aufstellungen = { heim: this.aufstellungFuer(heim), gast: this.aufstellungFuer(gast) };
    // Wen kein Mensch fuehrt, der stellt ab Minute 60 selbst um (spieltag AC-31).
    const umstellen = { heim: !this.menschFuehrt(heim.id), gast: !this.menschFuehrt(gast.id) };
    const manager = live && this.managerMit(live.managerId);
    const seite = manager && (manager.vereinId === heim.id ? 'heim' : manager.vereinId === gast.id ? 'gast' : null);
    if (seite) {
      const szenen = quelle(this.startwert, this.saison, this.termin, ZWECK.szenen);
      const spiel = anpfiff(heim, gast, { a: zufall.stand.a }, { aufstellungen, ...optionen, umstellen, szenen, startwert: this.startwert });
      kontext.live = { managerId: manager.managerId, stelle: kontext.spiele.length, seite, spiel };
    }
    // Auch fuer das live gespielte Spiel einmal mit Automatik: das schiebt
    // die Quelle so weit, wie es heute jedes Spiel tut.
    const ergebnis = begegnung(heim, gast, zufall, { aufstellungen, ...optionen, umstellen, startwert: this.startwert });
    kontext.spiele.push({ ...eintrag, ergebnis: seite ? null : ergebnis });
  }

  /** Was ein gerechnetes Spiel mit den Vereinen macht - der Teil des Verbuchens. */
  spielFolgen(heim, gast, ergebnis, lauf) {
    for (const e of ergebnis.ereignisse) if (e.art === 'verletzung') lauf.verletzt.add(e.spielerId);
    const folgen = { heim: nachwirkung(heim, ergebnis), gast: nachwirkung(gast, ergebnis) };
    for (const [seite, verein] of [['heim', heim], ['gast', gast]]) {
      const manager = this.managerVon(verein.id);
      if (!manager) continue;
      for (const folge of folgen[seite]) {
        this.melden(manager, 'spiel', folge.art === 'sperre'
          ? `${folge.spieler} ist gesperrt (${folge.grund}) und fehlt ${folge.spiele === 1 ? 'im nächsten Spiel' : `${folge.spiele} Spiele`}.`
          : `${folge.spieler} hat sich verletzt und fällt ${folge.wochen === 1 ? 'eine Woche' : `${folge.wochen} Wochen`} aus.`);
      }
    }
    return folgen;
  }

  /** Jedes Spiel des Spieltags rechnen - die Kasse zuerst, wie immer. */
  ligaRechnen(nr, zufall, kontext, live) {
    for (const nummer of [1, 2]) {
      const tabelle = this.tabellen[nummer];
      const rang = new Map(liga.sortiert(tabelle).map((z, i) => [z.id, i]));
      this.plaene[nummer][nr - 1].forEach((paarung, stelle) => {
        const heim = this.vereinVon(paarung.heim);
        const gast = this.vereinVon(paarung.gast);
        const gespielt = tabelle.find((z) => z.id === heim.id).spiele > 0;
        const stimmung = gespielt ? 1 - rang.get(heim.id) / (tabelle.length - 1) : 0.5;
        const kasse = finanzen.heimspiel(heim, zufall, { stimmung, gegner: gast });
        this.spielRechnen(heim, gast, zufall, {}, kontext, { liga: nummer, stelle, kasse }, live);
      });
    }
  }

  ligaVerbuchen(nr, spiele, lauf) {
    // `eigenes` im Bericht ist das Spiel eines Menschen - mit mehreren (M3)
    // braucht jeder seinen eigenen Bericht.
    const bericht = { art: 'liga', nr, ligen: {}, eigenes: null };
    const eigene = [];
    for (const nummer of [1, 2]) {
      const tabelle = this.tabellen[nummer];
      const paarungen = this.plaene[nummer][nr - 1];
      for (const { stelle, kasse, ergebnis } of spiele.filter((s) => s.liga === nummer)) {
        const paarung = paarungen[stelle];
        const heim = this.vereinVon(paarung.heim);
        const gast = this.vereinVon(paarung.gast);
        this.spielFolgen(heim, gast, ergebnis, lauf);
        paarung.tore = ergebnis.tore;
        liga.verbuchen(tabelle, ergebnis);
        this.torjaegerZaehlen(nummer, ergebnis, heim, gast);

        this.buchen(heim, 'zuschauer', kasse.einnahmen,
          `Heimspiel gegen ${gast.name}, ${kasse.zuschauer.toLocaleString('de-DE')} Zuschauer`);
        [heim, gast].forEach((verein, i) => {
          this.buchen(verein, 'fernsehen', finanzen.fernsehgeld(verein), 'Fernsehgeld');
          if (verein.sponsor) {
            const sieg = ergebnis.tore[i] > ergebnis.tore[1 - i];
            this.buchen(verein, 'sponsor', verein.sponsor.jeSpiel + (sieg ? verein.sponsor.jeSieg : 0),
              `${verein.sponsor.name}${sieg ? ', mit Siegprämie' : ''}`);
          }
        });

        for (const verein of [heim, gast]) {
          const manager = this.managerVon(verein.id);
          if (!manager) continue;
          bericht.eigenes = this.spielBericht(ergebnis, heim, gast, kasse.zuschauer, 'liga');
          eigene.push({ manager, ergebnis, heim, gast });
        }
      }
      bericht.ligen[nummer] = paarungen.map((p) => this.paarungZeigen(p));
    }
    // Erst wenn der ganze Spieltag gerechnet ist, steht der Platz fest - und
    // erst dann urteilen Postfach und Vorstand.
    for (const {
      manager, ergebnis, heim, gast,
    } of eigene) {
      this.eigenesSpielMelden(manager, ergebnis, heim, gast, `${nr}. Spieltag`, true);
      const eigener = this.vereinVon(manager.vereinId);
      const i = heim.id === eigener.id ? 0 : 1;
      const gegner = i === 0 ? gast : heim;
      vorstand.nachLigaspiel(manager.vorstand, {
        ergebnis: ergebnis.tore[i] > ergebnis.tore[1 - i] ? 'sieg' : ergebnis.tore[i] < ergebnis.tore[1 - i] ? 'niederlage' : 'unentschieden',
        platz: this.platz(eigener.id),
        spieltag: nr,
        gegnerStaerker: kader.niveau(gegner) > kader.niveau(eigener) + 2 || gegner.liga < eigener.liga,
      });
    }
    return bericht;
  }

  pokalRechnen(nummer, zufall, kontext, live) {
    const runde = this.pokal.runden[nummer - 1];
    const finale = nummer === pokal.RUNDEN.length;
    runde.paarungen.forEach((paarung, stelle) => {
      const heim = this.vereinVon(paarung.heim);
      const gast = this.vereinVon(paarung.gast);
      // Im Finale auf neutralem Platz verdient niemand am Eintritt.
      const kasse = finale ? null : finanzen.heimspiel(heim, zufall, { stimmung: 0.6, gegner: gast, pokal: true });
      this.spielRechnen(heim, gast, zufall, { entscheidung: true, neutral: finale }, kontext, { stelle, kasse }, live);
    });
  }

  pokalVerbuchen(nummer, spiele, lauf) {
    const runde = this.pokal.runden[nummer - 1];
    const finale = nummer === pokal.RUNDEN.length;
    const bericht = { art: 'pokal', runde: nummer, name: runde.name, paarungen: [], eigenes: null };
    for (const { stelle, kasse, ergebnis } of spiele) {
      const paarung = runde.paarungen[stelle];
      const heim = this.vereinVon(paarung.heim);
      const gast = this.vereinVon(paarung.gast);
      const zuschauer = kasse ? kasse.zuschauer : 0;
      if (kasse) {
        this.buchen(heim, 'zuschauer', kasse.einnahmen,
          `Pokal gegen ${gast.name}, ${zuschauer.toLocaleString('de-DE')} Zuschauer`);
      }
      for (const verein of [heim, gast]) this.buchen(verein, 'praemien', pokal.PRAEMIE[nummer - 1], `Pokal: ${runde.name}`);
      this.spielFolgen(heim, gast, ergebnis, lauf);
      Object.assign(paarung, {
        tore: ergebnis.tore, sieger: ergebnis.sieger, verlaengerung: ergebnis.verlaengerung, elfmeter: ergebnis.elfmeter,
      });
      for (const verein of [heim, gast]) {
        const manager = this.managerVon(verein.id);
        if (!manager) continue;
        bericht.eigenes = this.spielBericht(ergebnis, heim, gast, zuschauer, 'pokal');
        this.eigenesSpielMelden(manager, ergebnis, heim, gast, `Pokal, ${runde.name}`, false);
        const eigener = verein;
        const gegner = heim.id === eigener.id ? gast : heim;
        vorstand.nachPokalspiel(manager.vorstand, {
          weiter: ergebnis.sieger === eigener.id,
          gegnerLigaTiefer: gegner.liga > eigener.liga,
          finaleGewonnen: finale && ergebnis.sieger === eigener.id,
        });
      }
    }
    if (finale) {
      const sieger = this.vereinVon(runde.paarungen[0].sieger);
      this.pokal.sieger = sieger.id;
      this.buchen(sieger, 'praemien', pokal.SIEGERPRAEMIE, 'Pokalsieg');
      sieger.reputation = Math.min(100, sieger.reputation + 5);
      for (const m of this.manager) this.melden(m, 'liga', `${sieger.name} gewinnt den Pokal.`);
    } else {
      const naechste = this.pokal.runden[nummer];
      naechste.paarungen = pokal.auslosen(pokal.siegerDerRunde(runde), quelle(this.startwert, this.saison, this.termin, ZWECK.auslosung));
      this.pokal.aktuell = nummer;
      for (const m of this.manager) {
        const eigene = naechste.paarungen.find((p) => p.heim === m.vereinId || p.gast === m.vereinId);
        if (!eigene) continue;
        const daheim = eigene.heim === m.vereinId;
        this.melden(m, 'liga', `Pokal, ${naechste.name}: ${daheim ? 'daheim gegen' : 'auswärts bei'} `
          + `${this.vereinVon(daheim ? eigene.gast : eigene.heim).name}.`);
      }
    }
    bericht.paarungen = runde.paarungen.map((p) => this.paarungZeigen(p));
    return bericht;
  }

  /**
   * Die anderen stellen sich auf den Gegner ein: als Aussenseiter defensiv,
   * als Favorit offensiv, Pressing nur mit frischen Beinen - und geuebt wird,
   * was noch nicht sitzt. Dieselben Stellschrauben, die der Mensch hat.
   */
  kiTaktik(verein, gegner, daheim) {
    const vorteil = kader.niveau(verein) - kader.niveau(gegner) + (daheim ? 2 : -2);
    const ausrichtung = vorteil >= 8 ? 5 : vorteil >= 3 ? 4 : vorteil <= -8 ? 1 : vorteil <= -3 ? 2 : 3;
    const bereit = verein.spieler.filter(kader.einsatzbereit);
    const frische = bereit.reduce((s, x) => s + x.kondition, 0) / Math.max(1, bereit.length);
    const pressing = frische >= 88 ? 4 : frische < 75 ? 2 : 3;
    verein.taktik = { ...verein.taktik, ausrichtung, pressing };
    const eingespielt = verein.einstudiert?.systeme?.[verein.taktik.system] ?? 0;
    verein.schwerpunkt = eingespielt < 85 ? 'system' : pressing >= 4 ? 'pressing' : 'keiner';
  }

  /** Wie viele Pflichtspiele ein Verein in dieser Saison schon bestritten hat. */
  pflichtspiele(verein) {
    const dabei = (p) => p.tore && (p.heim === verein.id || p.gast === verein.id);
    return [1, 2].reduce((summe, nummer) => summe + this.plaene[nummer].flat().filter(dabei).length, 0)
      + this.pokal.runden.reduce((summe, r) => summe + r.paarungen.filter(dabei).length, 0);
  }

  /** Nach jedem Termin: Gehälter, Zinsen, Bauzeit - fuer alle Vereine gleich. */
  laufendeKosten() {
    for (const verein of this.vereine) {
      const zins = finanzen.zinsen(verein);
      if (zins) this.buchen(verein, 'zinsen', zins, 'Dispozinsen');
      this.buchen(verein, 'gehaelter', -finanzen.gehaelter(verein), 'Gehälter');
      const fertig = finanzen.ausbauWeiter(verein);
      const manager = this.managerVon(verein.id);
      if (fertig && manager) {
        this.melden(manager, 'finanzen', `Der Stadionausbau ist fertig: ${fertig.toLocaleString('de-DE')} neue Plätze, `
          + `jetzt ${verein.stadion.plaetze.toLocaleString('de-DE')}.`);
      }
    }
  }

  /** Eine Woche heilt - nur nicht, wer sich in diesem Termin erst verletzt hat. */
  heilen(lauf) {
    for (const verein of this.vereine) {
      for (const spieler of verein.spieler) {
        if (spieler.verletzt <= 0 || lauf.verletzt.has(spieler.id)) continue;
        spieler.verletzt -= 1;
        const manager = spieler.verletzt === 0 && this.managerVon(verein.id);
        if (manager) this.melden(manager, 'verein', `${spieler.name} ist wieder fit.`);
      }
    }
    for (const spieler of this.freie) spieler.verletzt = Math.max(0, spieler.verletzt - 1);
  }

  /** Wer keine elf einsatzbereiten Spieler hat, bekommt sie aus der A-Jugend. */
  notkader(zufall) {
    let erzeuger = null;
    for (const verein of this.vereine) {
      const bereit = verein.spieler.filter(kader.einsatzbereit);
      if (bereit.length >= 11 && bereit.some((s) => s.position === kader.TOR)) continue;
      erzeuger = erzeuger || this.erzeuger(zufall);
      const neu = kader.notfallJugend(verein, erzeuger);
      const manager = this.managerVon(verein.id);
      if (manager) {
        this.melden(manager, 'verein', `Zu wenige einsatzbereite Spieler: ${neu.map((s) => `${s.name} (${s.position})`).join(', ')} `
          + 'rücken aus der A-Jugend nach.');
      }
    }
  }

  punktabzugPruefen(anlass) {
    for (const verein of this.vereine) {
      if (verein.konto >= finanzen.PUNKTABZUG_GRENZE) continue;
      const zeile = this.tabellen[verein.liga].find((z) => z.id === verein.id);
      zeile.abzug = (zeile.abzug || 0) + finanzen.PUNKTABZUG;
      for (const m of this.manager) {
        if (verein.id !== m.vereinId && verein.liga !== this.vereinVon(m.vereinId).liga) continue;
        this.melden(m, 'liga', `${verein.name}: ${finanzen.PUNKTABZUG} Punkte Abzug ${anlass} - das Konto steht bei ${geld(verein.konto)}.`);
      }
    }
  }

  torjaegerZaehlen(nummer, ergebnis, heim, gast) {
    const liste = this.torjaeger[nummer];
    for (const e of ergebnis.ereignisse) {
      if (e.art !== 'tor') continue;
      const verein = e.verein === heim.id ? heim : gast;
      const eintrag = liste[e.spielerId] || (liste[e.spielerId] = { name: e.spieler, verein: verein.name, tore: 0 });
      eintrag.tore += 1;
      eintrag.verein = verein.name;
    }
  }

  // -------------------------------------------------------- Saisonende

  /**
   * Das Ende einer Saison und der Anfang der naechsten: Praemien, Ruf,
   * Vorstand, Auf- und Abstieg, Entwicklung, Vertraege, Karriereenden,
   * Jugend, der Sommermarkt - und neue Plaene.
   */
  saisonWechsel() {
    const zufall = quelle(this.startwert, this.saison, this.termin, ZWECK.saisonende);
    const saison = this.saison;
    const endstand = { 1: liga.sortiert(this.tabellen[1]), 2: liga.sortiert(this.tabellen[2]) };
    const { absteiger, aufsteiger } = liga.aufUndAbstieg(this.tabellen[1], this.tabellen[2]);
    const name = (id) => this.vereinVon(id).name;

    for (const nummer of [1, 2]) {
      endstand[nummer].forEach((zeile, i) => {
        const verein = this.vereinVon(zeile.id);
        this.buchen(verein, 'praemien', finanzen.saisonpraemie(nummer, i + 1), `Saisonprämie für Platz ${i + 1}`);
        // Wer besser abschneidet, als man ihm zutraute, gewinnt an Ruf.
        verein.reputation = Math.round(Math.min(100, Math.max(5, verein.reputation + (verein.tvRang - (i + 1)) * 0.6)));
      });
    }
    for (const id of absteiger) this.vereinVon(id).reputation = Math.max(5, this.vereinVon(id).reputation - 8);
    for (const id of aufsteiger) this.vereinVon(id).reputation = Math.min(100, this.vereinVon(id).reputation + 8);
    this.kiStadion();

    // Die Bilanz je Manager. Der Bericht der Saison traegt eine davon als
    // `eigener` - mit mehreren (M3) braucht jeder seinen eigenen Bericht.
    const bilanzen = new Map();
    for (const m of this.manager) {
      if (m.status !== 'laeuft') continue;
      const eigener = this.vereinVon(m.vereinId);
      const platz = endstand[eigener.liga].findIndex((z) => z.id === eigener.id) + 1;
      const urteil = vorstand.saisonbilanz(m.vorstand, platz);
      bilanzen.set(m, {
        verein: eigener.name, liga: eigener.liga, platz, ziel: m.vorstand.ziel, ...urteil,
        aufgestiegen: aufsteiger.includes(eigener.id), abgestiegen: absteiger.includes(eigener.id),
      });
      this.melden(m, 'vorstand', urteil.erreicht
        ? `Saisonziel erreicht: Platz ${platz}. Der Vorstand ist zufrieden.`
        : `Saisonziel verfehlt: Platz ${platz} statt ${m.vorstand.ziel.platz}. Das Vertrauen sinkt.`);
    }

    const zusammenfassung = {
      saison,
      meister: { 1: name(endstand[1][0].id), 2: name(endstand[2][0].id) },
      pokalsieger: this.pokal.sieger ? name(this.pokal.sieger) : null,
      absteiger: absteiger.map(name),
      aufsteiger: aufsteiger.map(name),
      eigener: [...bilanzen.values()].at(-1) ?? null,
      tabellen: {
        1: endstand[1].map((z) => ({ id: z.id, name: z.name, punkte: liga.wertung(z), tore: z.tore, gegentore: z.gegentore })),
        2: endstand[2].map((z) => ({ id: z.id, name: z.name, punkte: liga.wertung(z), tore: z.tore, gegentore: z.gegentore })),
      },
    };
    this.historie.unshift(zusammenfassung);
    for (const alt of this.historie.slice(TABELLEN_IN_HISTORIE)) delete alt.tabellen;
    for (const m of this.manager) {
      this.melden(m, 'liga', `Saison ${saison} vorbei. Meister: ${zusammenfassung.meister[1]}. `
        + `Absteiger: ${zusammenfassung.absteiger.join(', ')}. Aufsteiger: ${zusammenfassung.aufsteiger.join(', ')}.`);
    }

    // Auf- und Abstieg. Das Fernsehgeld der neuen Saison richtet sich nach
    // dem Platz - Aufsteiger stehen in der ersten Liga hinten an, Absteiger
    // in der zweiten vorn.
    const neueErste = [...endstand[1].map((z) => z.id).filter((id) => !absteiger.includes(id)), ...aufsteiger];
    const neueZweite = [...absteiger, ...endstand[2].map((z) => z.id).filter((id) => !aufsteiger.includes(id))];
    neueErste.forEach((id, i) => Object.assign(this.vereinVon(id), { liga: 1, tvRang: i + 1 }));
    neueZweite.forEach((id, i) => Object.assign(this.vereinVon(id), { liga: 2, tvRang: i + 1 }));
    // Die Abstiegsklausel: wer absteigt, zahlt ein Viertel weniger Gehalt.
    // Ohne sie traegt ein Absteiger seine Erstligagehaelter in eine Liga, die
    // sie nicht einspielt.
    for (const id of absteiger) {
      for (const spieler of this.vereinVon(id).spieler) {
        if (spieler.vertrag) spieler.vertrag.gehalt = Math.round(spieler.vertrag.gehalt * ABSTIEGSKLAUSEL);
      }
    }
    for (const [m, bilanz] of bilanzen) {
      if (bilanz.aufgestiegen) this.melden(m, 'verein', `Aufgestiegen! ${bilanz.verein} spielt nächste Saison in der ersten Liga.`);
      if (bilanz.abgestiegen) {
        this.melden(m, 'verein', `Abgestiegen. ${bilanz.verein} spielt nächste Saison in der zweiten Liga. `
          + `Die Abstiegsklausel senkt alle Gehälter um ${Math.round((1 - ABSTIEGSKLAUSEL) * 100)} %.`);
      }
    }

    // Entwicklung: jeder ein Jahr aelter, die Jungen besser, die Alten nicht.
    // Danach kommt die Saison in die Akte jedes Spielers - mit der Liga, in
    // der sie gespielt wurde, nicht der, in die der Verein jetzt wechselt.
    const ligaDerSaison = new Map([1, 2].flatMap((nummer) => endstand[nummer].map((z) => [z.id, nummer])));
    for (const verein of this.vereine) {
      const eintraege = kader.entwickeln(verein, zufall, this.pflichtspiele(verein), { anteil: 0.6, startwert: this.startwert });
      for (const e of eintraege) this.saisonFesthalten(e.spieler, verein, ligaDerSaison.get(verein.id), e.alter);
      const manager = this.managerVon(verein.id);
      if (manager) this.entwicklungMerken(manager, 'Saisonende', 'Entwicklung über die Saison', eintraege);
    }
    kader.entwickeln({ spieler: this.freie, technikSumme: 0, trainingswochen: 0 }, zufall, 0, { startwert: this.startwert });
    // Wer in der Saison gespielt hat und jetzt ohne Verein ist, bekommt die Saison beim Verein, von dem er kam.
    for (const spieler of this.freie) {
      if (!spieler.saison.spiele) continue;
      const von = spieler.laufbahn.wechsel?.at(-1)?.[2] ?? null;
      this.saisonFesthalten(spieler, von ? this.vereinVon(von) : null, ligaDerSaison.get(von) ?? null, spieler.alter - 1);
    }

    // Karriereende: wer es zur Winterpause angekuendigt hat, geht jetzt - vor
    // den Vertraegen, denn wer aufhoert, laeuft nicht aus.
    for (const verein of this.vereine) {
      const aufhoeren = verein.spieler.filter((s) => s.karriereende === saison);
      verein.spieler = verein.spieler.filter((s) => !aufhoeren.includes(s));
      if (verein.aufstellung && aufhoeren.some((s) => verein.aufstellung.ids.includes(s.id))) verein.aufstellung = null;
      const manager = this.managerVon(verein.id);
      if (manager && aufhoeren.length) {
        this.melden(manager, 'verein', `Karriereende: ${aufhoeren.map((s) => `${s.name} (${s.alter})`).join(', ')}.`);
      }
    }
    // Vertraege: die anderen verlaengern, wen sie wollen. Wer danach ohne
    // Vertrag dasteht, geht - auch beim Menschen.
    transfer.kiVertraege(this, zufall);
    for (const verein of this.vereine) {
      const gehen = verein.spieler.filter((s) => !s.vertrag || s.vertrag.bis <= saison);
      for (const spieler of gehen) transfer.freistellen(this, verein, spieler);
      const manager = this.managerVon(verein.id);
      if (manager && gehen.length) {
        this.melden(manager, 'verein', `Vertrag ausgelaufen, verlassen den Verein: ${gehen.map((s) => s.name).join(', ')}.`);
      }
    }
    // Unter den Vereinslosen hoert auf, wer es angekuendigt hat, wer zu alt ist und wer nicht mehr mag.
    // Zu alt ist seit Schritt 4 ueber 35 statt ueber 34 - mit 36 hoert ohnehin jeder auf (kader AC-17).
    this.freie = this.freie.filter((s) => s.karriereende !== saison && !kader.hoertAuf(s, zufall) && s.alter <= 35);

    this.saison = saison + 1;
    this.termin = 0;
    for (const verein of this.vereine) {
      for (const spieler of verein.spieler) {
        spieler.kondition = 88;
        spieler.moral = Math.round((spieler.moral + 60) / 2);
        spieler.verletzt = Math.max(0, spieler.verletzt - 6);
      }
    }

    // Jugend: zwei je Verein, solange Platz im Kader ist.
    const erzeuger = this.erzeuger(quelle(this.startwert, this.saison, 0, ZWECK.jugend));
    for (const verein of this.vereine) {
      const manager = this.managerVon(verein.id);
      const grenze = manager ? kader.KADER_MAX : transfer.KI_KADER_ZIEL + 1;
      const jugend = kader.jugendErzeugen(verein, zufall, erzeuger).slice(0, Math.max(0, grenze - verein.spieler.length));
      verein.spieler.push(...jugend);
      if (manager && jugend.length) {
        this.melden(manager, 'verein', `Aus der Jugend rücken auf: ${jugend.map((s) => `${s.name} (${s.rolle}, Stärke ${s.staerke}, Talent ${s.talent})`).join(', ')}.`);
      }
    }
    // Der Markt der Vereinslosen: nicht zu voll, nie leer.
    if (this.freie.length > FREIE_MAX) {
      this.freie = this.freie.sort((a, b) => b.staerke - a.staerke).slice(0, FREIE_MAX);
    }
    if (this.freie.length < FREIE_MIN) {
      const neu = kader.freieErzeugen(zufall, FREIE_MIN - this.freie.length, erzeuger);
      this.freie.push(...neu);
    }
    // Der Sommermarkt der anderen: erst die Loecher, dann Verstaerkungen.
    const markt = quelle(this.startwert, this.saison, 0, ZWECK.transfer);
    transfer.kiTransfers(this, markt, { verstaerkung: 0.7 });
    transfer.kiTransfers(this, markt, { verstaerkung: 0.4 });

    for (const m of this.manager) {
      m.angebote = [];
      if (bilanzen.get(m)?.entlassen) {
        this.entlassen(m, 'Nach einer verfehlten Saison trennt sich der Vorstand von dir.', quelle(this.startwert, this.saison, 0, ZWECK.stellen));
      }
    }
    this.saisonVorbereiten();
    for (const m of this.manager) {
      if (m.status !== 'laeuft') continue;
      this.melden(m, 'vorstand', `Saison ${this.saison}: Der Vorstand erwartet ${m.vorstand.ziel.text} `
        + `(Platz ${m.vorstand.ziel.platz} oder besser in der ${this.vereinVon(m.vereinId).liga}. Liga). Wähle einen Sponsor.`);
    }
    return { art: 'saisonende', ...zusammenfassung };
  }

  /**
   * Wer viel Geld hat und ein volles Stadion, baut aus - die anderen Vereine
   * sparen nicht ewig, sie legen an.
   */
  kiStadion() {
    for (const verein of this.vereine) {
      if (this.menschFuehrt(verein.id) || verein.stadion.ausbau) continue;
      if (verein.konto < 25000 || finanzen.auslastung(verein, { stimmung: 0.6 }) < 0.9) continue;
      const plan = [...finanzen.AUSBAU].reverse()
        .find((a) => verein.konto - a.kosten >= 12000 && finanzen.ausbauPruefen(verein, a.stufe).ok);
      if (!plan) continue;
      verein.stadion.ausbau = { plaetze: plan.plaetze, rest: plan.termine };
      this.buchen(verein, 'stadion', -plan.kosten, 'Stadionausbau');
    }
  }

  entlassen(manager, grund, zufall) {
    const alter = this.vereinVon(manager.vereinId);
    manager.status = 'entlassen';
    manager.stellen = vorstand.stellenangebote(this.vereine, alter, zufall);
    alter.aufstellung = null;
    alter.taktik.system = kader.bestesSystem(alter, alter.taktik.system);
    manager.angebote = [];
    this.melden(manager, 'vorstand', `${grund} Du bist bei ${alter.name} entlassen. `
      + `${manager.stellen.length} Vereine bieten dir eine Stelle an.`);
  }

  spielBericht(ergebnis, heim, gast, zuschauer, wettbewerb) {
    const personen = new Map([...heim.spieler, ...gast.spieler].map((s) => [s.id, s]));
    // Wer eingewechselt wurde, stand auf dem Platz dessen, fuer den er kam.
    const eingewechselt = new Map(ergebnis.ereignisse.filter((e) => e.art === 'wechsel').map((e) => [e.reinId, e.platz]));
    const person = (id, platz = eingewechselt.get(id) ?? null) => {
      const s = personen.get(id);
      return {
        id,
        name: s ? s.name : '?',
        position: s ? s.position : '',
        rolle: s ? s.rolle : '',
        platz,
        minuten: ergebnis.einsaetze[id] || 0,
        note: ergebnis.noten[id] ?? null,
      };
    };
    const seite = (s) => ({
      elf: ergebnis.aufstellung[s].elf.map((id, i) => person(id, ergebnis.aufstellung[s].plaetze?.[i] ?? null)),
      bank: ergebnis.aufstellung[s].bank.map((id) => person(id)),
    });
    return {
      wettbewerb,
      heim: { id: heim.id, name: heim.name },
      gast: { id: gast.id, name: gast.name },
      tore: ergebnis.tore,
      chancen: ergebnis.chancen,
      besitz: ergebnis.besitz,
      verlaengerung: ergebnis.verlaengerung,
      elfmeter: ergebnis.elfmeter,
      sieger: ergebnis.sieger,
      zuschauer,
      taktik: ergebnis.taktik,
      eingespielt: ergebnis.eingespielt,
      ereignisse: ergebnis.ereignisse,
      aufstellung: { heim: seite('heim'), gast: seite('gast') },
    };
  }

  /** @param {boolean} ligaspiel  in der Liga mit Platz, im Pokal mit weiter oder raus */
  eigenesSpielMelden(manager, ergebnis, heim, gast, titel, ligaspiel) {
    const daheim = heim.id === manager.vereinId;
    const gegner = daheim ? gast : heim;
    const [eigene, fremde] = daheim ? ergebnis.tore : [ergebnis.tore[1], ergebnis.tore[0]];
    let ausgang = eigene > fremde ? 'Sieg' : eigene < fremde ? 'Niederlage' : 'Unentschieden';
    let zusatz = ergebnis.verlaengerung ? ' n.V.' : '';
    if (ergebnis.elfmeter) {
      const [ie, ifr] = daheim ? ergebnis.elfmeter : [ergebnis.elfmeter[1], ergebnis.elfmeter[0]];
      zusatz = ` n.V., ${ie}:${ifr} im Elfmeterschießen`;
    }
    if (!ligaspiel) ausgang = ergebnis.sieger === manager.vereinId ? 'Weiter' : 'Ausgeschieden';
    this.melden(manager, 'spiel', `${titel}: ${ausgang}, ${eigene}:${fremde}${zusatz} ${daheim ? 'gegen' : 'bei'} ${gegner.name}.`
      + (ligaspiel ? ` Platz ${this.platz(manager.vereinId)}.` : ''));
  }

  /**
   * Eine Saison in die Akte eines Spielers - knapp als Zahlenreihe, damit der
   * Spielstand klein bleibt: Saison, Verein, Liga, Spiele, Tore, Vorlagen,
   * Notenschnitt mal zehn, Staerke nach der Entwicklung, Alter in der Saison.
   */
  saisonFesthalten(spieler, verein, liga, alter) {
    const s = spieler.saison;
    const note = s.noten ? Math.round((s.notenSumme / s.noten) * 10) : 0;
    (spieler.laufbahn.stationen ||= []).push([this.saison, verein ? verein.id : null, liga ?? null, s.spiele, s.tore, s.vorlagen, note, spieler.staerke, alter]);
  }
}

module.exports = { Ablauf };
