'use strict';

// Eine Karriere: ein Mensch fuehrt einen Verein durch Saison um Saison. Zwei
// Ligen zu je achtzehn Vereinen, ein Pokal, Vertraege, Jugend, Vorstand,
// Stadion - und 35 Vereine, die nach denselben Regeln spielen, handeln und
// wirtschaften wie der Mensch.
//
// Der Zustand ist ein reiner Datenwert - `sichern()` gibt ihn heraus,
// `laden()` nimmt ihn zurueck (→ docs/adr/0007-zwei-arten-von-partien.md).
// Der Zufall wird nicht mitgeschleppt: jeder Termin zieht seine Quellen aus
// Startwert, Saison, Termin und Zweck. Derselbe Spielstand ergibt mit
// denselben Zuegen dieselbe Fortsetzung.
const kader = require('./kader');
const liga = require('./liga');
const pokal = require('./pokal');
const finanzen = require('./finanzen');
const vertraege = require('./vertraege');
const vorstand = require('./vorstand');
const transfer = require('./transfer');
const {
  saisonKalender, terminTitel, fensterOffen, fensterText, WINTERPAUSE_NACH,
} = require('./kalender');
const {
  begegnung, nachwirkung, taktikPruefen, mannschaftsteile, AUSRICHTUNGEN,
} = require('./spieltag');
const { zufallAus } = require('./zufall');

// Die Fassung des Spielstands. Aendert sich seine Bauart, steigt sie - und
// ein alter Stand wird abgelehnt statt halb geladen (speichern AC-17).
const FASSUNG = 3;
// Aeltere Fassungen, die sich beim Laden anheben lassen (→ anheben).
const LADBARE_FASSUNGEN = [2, FASSUNG];
const TERMINE = saisonKalender();
const NACHRICHTEN_MAX = 160;
const BUCH_MAX = 260;
const TABELLEN_IN_HISTORIE = 10;
const FREIE_MIN = 45;
const FREIE_MAX = 90;
const ABSTIEGSKLAUSEL = 0.75;
const ZWECK = {
  liga: 1, pokal: 2, transfer: 3, saisonende: 4, auslosung: 5, sponsor: 6, jugend: 7, angebote: 8, start: 9, stellen: 10,
};

// Betraege stehen in Tausend. Ueber tausend wird daraus eine Million -
// dieselbe Regel wie in der Oberflaeche.
function geld(tausend) {
  const zahl = Math.round(tausend);
  if (Math.abs(zahl) >= 1000) return `${(zahl / 1000).toFixed(1).replace('.', ',')} Mio`;
  return `${zahl} T`;
}

/** Eine Zufallsquelle je Saison, Termin und Zweck. */
function quelle(startwert, saison, termin, zweck) {
  let h = (startwert >>> 0) ^ 0x5f3759df;
  h = Math.imul(h ^ saison, 0x9e3779b1) >>> 0;
  h = Math.imul(h ^ (termin + 17), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ zweck, 0xc2b2ae35) >>> 0;
  return zufallAus((h ^ (h >>> 16)) >>> 0);
}

function mischen(liste, zufall) {
  for (let i = liste.length - 1; i > 0; i--) {
    const j = Math.floor(zufall() * (i + 1));
    [liste[i], liste[j]] = [liste[j], liste[i]];
  }
  return liste;
}

const zahlOder = (wert, sonst) => (Number.isFinite(wert) ? wert : sonst);

class Karriere {
  /** @param {object} zustand  siehe `neu()` - oder das Ergebnis von `sichern()` */
  constructor(zustand) {
    Object.assign(this, zustand);
  }

  /**
   * @param {object} einstellungen
   * @param {number} einstellungen.startwert
   * @param {string|null} einstellungen.vereinId  der Verein des Menschen;
   *   ohne ihn laeuft die Welt allein (fuer Messungen und Tests)
   */
  static neu({ startwert, vereinId = null, name = 'Neue Karriere' }) {
    const welt = kader.weltErzeugen(startwert);
    const eigener = welt.vereine.find((v) => v.id === vereinId) || null;
    const karriere = new Karriere({
      fassung: FASSUNG,
      name,
      startwert,
      saison: 1,
      termin: 0,
      vereinId: eigener ? eigener.id : null,
      vereine: welt.vereine,
      freie: welt.freie,
      zaehler: welt.zaehler,
      status: 'laeuft',
      stellen: [],
      plaene: {},
      tabellen: {},
      torjaeger: {},
      pokal: null,
      vorstand: eigener ? { ziel: null, vertrauen: vorstand.VERTRAUEN_START } : null,
      sponsorAngebote: [],
      angebote: [],
      ticker: [],
      nachrichten: [],
      buch: [],
      kasse: null,
      vorjahr: null,
      historie: [],
      zuletzt: null,
      entwicklungen: [],
    });
    karriere.saisonVorbereiten();
    if (eigener) {
      karriere.melden('verein', `Willkommen bei ${eigener.name}. Der Vorstand erwartet in dieser Saison: `
        + `${karriere.vorstand.ziel.text} (Platz ${karriere.vorstand.ziel.platz} oder besser).`);
    }
    return karriere;
  }

  // --------------------------------------------------------------- Lesen

  get termine() {
    return TERMINE;
  }

  get verein() {
    return this.vereine.find((v) => v.id === this.vereinId) || null;
  }

  vereinVon(id) {
    return this.vereine.find((v) => v.id === id) || null;
  }

  platz(vereinId = this.vereinId) {
    const verein = this.vereinVon(vereinId);
    if (!verein) return null;
    return liga.sortiert(this.tabellen[verein.liga]).findIndex((z) => z.id === vereinId) + 1;
  }

  neueId() {
    this.zaehler += 1;
    return `p${this.zaehler}`;
  }

  erzeuger(zufall) {
    const vergeben = new Set([
      ...this.vereine.flatMap((v) => v.spieler.map((s) => s.name)),
      ...this.freie.map((s) => s.name),
    ]);
    return { neueId: () => this.neueId(), neuerName: kader.namensgeber(zufall, vergeben), saison: this.saison };
  }

  // ------------------------------------------------------ Buch und Post

  melden(art, text) {
    if (!this.vereinId) return;
    this.nachrichten.push({
      saison: this.saison, termin: this.termin, datum: terminTitel(TERMINE[this.termin]), art, text,
    });
    if (this.nachrichten.length > NACHRICHTEN_MAX) this.nachrichten.splice(0, this.nachrichten.length - NACHRICHTEN_MAX);
  }

  /** Geld bewegen. Beim Menschen mit Buchung und Saisonposten, bei allen anderen nur das Konto. */
  buchen(verein, kategorie, betrag, zweck) {
    const gerundet = Math.round(betrag);
    if (!gerundet) return;
    verein.konto += gerundet;
    if (verein.id !== this.vereinId || !this.kasse) return;
    const posten = this.kasse.posten[kategorie] || (this.kasse.posten[kategorie] = { ein: 0, aus: 0 });
    if (gerundet > 0) posten.ein += gerundet;
    else posten.aus -= gerundet;
    this.buch.push({
      saison: this.saison, datum: terminTitel(TERMINE[this.termin]), kategorie, betrag: gerundet, zweck,
    });
    if (this.buch.length > BUCH_MAX) this.buch.splice(0, this.buch.length - BUCH_MAX);
  }

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
      if (verein.id !== this.vereinId) {
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
      if (verein.id === this.vereinId) this.sponsorAngebote = angebote;
      else verein.sponsor = angebote[1];
    }
    this.angebote = [];
    if (this.verein) {
      this.vorstand.ziel = vorstand.saisonziel(this.vereine, this.verein);
      this.vorjahr = this.kasse && this.kasse.saison === this.saison - 1 ? this.kasse : null;
      this.kasse = { saison: this.saison, posten: {} };
    }
  }

  /**
   * Den naechsten Termin ausfuehren: Spieltag, Pokalrunde, Winterpause,
   * Vorbereitung oder Saisonende. Ein Zug, ein Termin.
   */
  weiter() {
    if (this.status === 'entlassen') return { fehler: 'Du bist entlassen. Waehle zuerst einen neuen Verein.' };
    const termin = TERMINE[this.termin];
    const zufall = (zweck) => quelle(this.startwert, this.saison, this.termin, zweck);
    const lauf = { verletzt: new Set() };
    const eigener = this.verein;
    const kontoVorher = eigener ? eigener.konto : 0;

    this.notkader(zufall(ZWECK.jugend));
    let bericht;
    if (termin.art === 'vorbereitung') bericht = this.vorbereitung();
    else if (termin.art === 'liga') bericht = this.ligaspieltag(termin.nr, zufall(ZWECK.liga), lauf);
    else if (termin.art === 'pokal') bericht = this.pokalrunde(termin.runde, zufall(ZWECK.pokal), lauf);
    else if (termin.art === 'winterpause') bericht = this.winterpause(zufall(ZWECK.saisonende));
    else bericht = { art: 'saisonende' };

    this.laufendeKosten();
    this.heilen(lauf);
    for (const verein of this.vereine) kader.trainieren(verein);

    if (termin.art === 'saisonende') {
      bericht = this.saisonWechsel();
      this.zuletzt = { titel: terminTitel(termin), ...bericht };
      return { ok: true, bericht: this.zuletzt };
    }

    if (fensterOffen(termin)) transfer.kiTransfers(this, zufall(ZWECK.transfer));
    this.termin += 1;

    if (eigener && this.status === 'laeuft') {
      const offen = fensterOffen(TERMINE[this.termin]);
      this.angebote = offen ? this.angebote.filter((a) => a.gueltigBis >= this.termin) : [];
      if (offen) {
        for (const angebot of transfer.kiAngebote(this, eigener, zufall(ZWECK.angebote))) {
          this.angebote = this.angebote.filter((a) => a.vereinId !== angebot.vereinId);
          this.angebote.push(angebot);
          this.melden('transfer', `${angebot.verein} bietet ${geld(angebot.gebot)} fuer ${angebot.spieler} `
            + `(Marktwert ${geld(angebot.wert)}).`);
        }
      }
      vorstand.nachKasse(this.vorstand, eigener.konto);
      if (eigener.konto < 0 && kontoVorher >= 0) {
        this.melden('finanzen', `Das Konto ist im Minus (${geld(eigener.konto)}). Unter ${geld(finanzen.PUNKTABZUG_GRENZE)} `
          + `kostet es zur Winterpause und vor der Saison ${finanzen.PUNKTABZUG} Punkte.`);
      }
      if (termin.art === 'liga' && vorstand.entlassen(this.vorstand, termin.nr)) {
        this.entlassen('Nach dem Absturz in der Tabelle hat der Vorstand das Vertrauen verloren.', zufall(ZWECK.stellen));
      }
    }
    this.zuletzt = { titel: terminTitel(termin), ...bericht };
    return { ok: true, bericht: this.zuletzt };
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
    while (this.status === 'laeuft' && this.saison === saison) {
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
    const eigener = this.verein;
    if (eigener && !eigener.sponsor) {
      eigener.sponsor = this.sponsorAngebote[1];
      this.melden('finanzen', `Du hast keinen Sponsor gewaehlt - der Vorstand hat ${eigener.sponsor.name} unterschrieben.`);
    }
    this.sponsorAngebote = [];
    // Das Trainingslager: alle kommen frisch in die Saison, und das System
    // sitzt wenigstens zur Haelfte.
    for (const verein of this.vereine) {
      for (const s of verein.spieler) s.kondition = Math.max(s.kondition, 92);
      const systeme = verein.einstudiert.systeme;
      systeme[verein.taktik.system] = Math.max(systeme[verein.taktik.system] ?? 0, 50);
    }
    this.punktabzugPruefen('vor dem Saisonstart');
    if (eigener) this.melden('liga', `Saison ${this.saison} beginnt. Ziel des Vorstands: ${this.vorstand.ziel.text}.`);
    return { art: 'vorbereitung', text: `Die Saison ${this.saison} beginnt.` };
  }

  winterpause(zufall) {
    for (const verein of this.vereine) {
      for (const s of verein.spieler) s.kondition = Math.min(100, s.kondition + 15);
      // Ein erster Teil der Entwicklung - Auf- und Abwertungen warten nicht
      // bis zum Sommer.
      const eintraege = kader.entwickeln(verein, zufall, this.pflichtspiele(verein), { anteil: 0.4, altern: false });
      if (verein.id === this.vereinId) this.entwicklungMerken('Winterpause', 'Entwicklung in der Hinrunde', eintraege);
    }
    // Wer zum Saisonende aufhoert, steht jetzt fest - gerechnet mit dem Alter,
    // das er dann hat, und auch mit gueltigem Vertrag. So weiss der Manager es,
    // bevor er verlaengert oder fuer die naechste Saison plant.
    for (const verein of this.vereine) {
      const gehen = verein.spieler.filter((s) => !s.karriereende && kader.hoertAuf({ ...s, alter: s.alter + 1 }, zufall));
      for (const s of gehen) s.karriereende = this.saison;
      if (verein.id === this.vereinId && gehen.length) {
        this.melden('verein', `Zum Saisonende hoeren auf: ${gehen.map((s) => `${s.name} (${s.alter + 1})`).join(', ')}. `
          + 'Sie spielen die Saison zu Ende, verlaengern aber nicht mehr.');
      }
    }
    this.punktabzugPruefen('zur Winterpause');
    const eigener = this.verein;
    if (eigener) {
      const auslaufend = eigener.spieler.filter((s) => s.vertrag && s.vertrag.bis <= this.saison && !s.karriereende);
      if (auslaufend.length) {
        this.melden('verein', `Zum Saisonende laufen ${auslaufend.length} Vertraege aus: `
          + `${auslaufend.map((s) => s.name).join(', ')}. Wer nicht verlaengert, geht.`);
      }
      this.melden('transfer', `Winterpause. ${fensterText({ art: 'winterpause' })}.`);
    }
    return { art: 'winterpause', text: `Winterpause nach dem ${WINTERPAUSE_NACH}. Spieltag.` };
  }

  /**
   * Die Entwicklung des eigenen Kaders festhalten, Spieler fuer Spieler - mit
   * dem, wonach gerechnet wurde. Das Kaderblatt zeigt die letzten vier; das
   * Postfach zaehlt, wer besser und wer schlechter wurde.
   */
  entwicklungMerken(anlass, ueberschrift, eintraege) {
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
    this.entwicklungen = [bericht, ...(this.entwicklungen || [])].slice(0, 4);
    const zaehlen = (passt) => bericht.spieler.filter(passt).length;
    const deutlich = [...bericht.spieler].sort((a, b) => Math.abs(b.nachher - b.vorher) - Math.abs(a.nachher - a.vorher))
      .filter((e) => e.nachher !== e.vorher).slice(0, 4);
    this.melden('verein', `${ueberschrift}: ${zaehlen((e) => e.nachher > e.vorher)} besser, ${zaehlen((e) => e.nachher < e.vorher)} schlechter, `
      + `${zaehlen((e) => e.nachher === e.vorher)} unveraendert - die ganze Liste steht im Kader.`
      + `${deutlich.length ? ` Am deutlichsten: ${deutlich.map((e) => `${e.name} ${e.vorher}→${e.nachher}`).join(', ')}.` : ''}`);
  }

  aufstellungFuer(verein) {
    if (verein.id === this.vereinId) {
      const {
        elf, system, nachgerueckt, verworfen,
      } = kader.elfFuerSpiel(verein);
      for (const n of nachgerueckt) this.melden('spiel', `${n.rein} rueckte fuer ${n.raus} in die Elf (${n.platz}).`);
      if (verworfen) this.melden('spiel', 'Deine Aufstellung liess sich nicht halten - es spielte die beste Elf.');
      return { elf, bank: kader.bankStellen(verein, elf), system };
    }
    const elf = kader.elfStellen(verein, verein.taktik.system);
    return { elf, bank: kader.bankStellen(verein, elf), system: verein.taktik.system };
  }

  spielen(heim, gast, zufall, optionen, lauf) {
    if (heim.id !== this.vereinId) this.kiTaktik(heim, gast, !optionen.neutral);
    if (gast.id !== this.vereinId) this.kiTaktik(gast, heim, false);
    const aufstellungen = { heim: this.aufstellungFuer(heim), gast: this.aufstellungFuer(gast) };
    const ergebnis = begegnung(heim, gast, zufall, { aufstellungen, ...optionen });
    for (const e of ergebnis.ereignisse) if (e.art === 'verletzung') lauf.verletzt.add(e.spielerId);
    const folgen = { heim: nachwirkung(heim, ergebnis), gast: nachwirkung(gast, ergebnis) };
    const eigene = heim.id === this.vereinId ? folgen.heim : gast.id === this.vereinId ? folgen.gast : [];
    for (const folge of eigene) {
      this.melden('spiel', folge.art === 'sperre'
        ? `${folge.spieler} ist gesperrt (${folge.grund}) und fehlt ${folge.spiele === 1 ? 'im naechsten Spiel' : `${folge.spiele} Spiele`}.`
        : `${folge.spieler} hat sich verletzt und faellt ${folge.wochen === 1 ? 'eine Woche' : `${folge.wochen} Wochen`} aus.`);
    }
    return { ergebnis, folgen };
  }

  ligaspieltag(nr, zufall, lauf) {
    const bericht = { art: 'liga', nr, ligen: {}, eigenes: null };
    let eigenes = null;
    for (const nummer of [1, 2]) {
      const tabelle = this.tabellen[nummer];
      const rang = new Map(liga.sortiert(tabelle).map((z, i) => [z.id, i]));
      const paarungen = this.plaene[nummer][nr - 1];
      for (const paarung of paarungen) {
        const heim = this.vereinVon(paarung.heim);
        const gast = this.vereinVon(paarung.gast);
        const gespielt = tabelle.find((z) => z.id === heim.id).spiele > 0;
        const stimmung = gespielt ? 1 - rang.get(heim.id) / (tabelle.length - 1) : 0.5;
        const kasse = finanzen.heimspiel(heim, zufall, { stimmung, gegner: gast });
        const { ergebnis } = this.spielen(heim, gast, zufall, {}, lauf);
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
              `${verein.sponsor.name}${sieg ? ', mit Siegpraemie' : ''}`);
          }
        });

        if (heim.id === this.vereinId || gast.id === this.vereinId) {
          bericht.eigenes = this.spielBericht(ergebnis, heim, gast, kasse.zuschauer, 'liga');
          eigenes = { ergebnis, heim, gast };
        }
      }
      bericht.ligen[nummer] = paarungen.map((p) => this.paarungZeigen(p));
    }
    // Erst wenn der ganze Spieltag gerechnet ist, steht der Platz fest - und
    // erst dann urteilen Postfach und Vorstand.
    if (eigenes) {
      const { ergebnis, heim, gast } = eigenes;
      this.eigenesSpielMelden(ergebnis, heim, gast, `${nr}. Spieltag`, true);
      const eigener = this.verein;
      const i = heim.id === eigener.id ? 0 : 1;
      const gegner = i === 0 ? gast : heim;
      vorstand.nachLigaspiel(this.vorstand, {
        ergebnis: ergebnis.tore[i] > ergebnis.tore[1 - i] ? 'sieg' : ergebnis.tore[i] < ergebnis.tore[1 - i] ? 'niederlage' : 'unentschieden',
        platz: this.platz(),
        spieltag: nr,
        gegnerStaerker: kader.niveau(gegner) > kader.niveau(eigener) + 2 || gegner.liga < eigener.liga,
      });
    }
    return bericht;
  }

  pokalrunde(nummer, zufall, lauf) {
    const runde = this.pokal.runden[nummer - 1];
    const finale = nummer === pokal.RUNDEN.length;
    const bericht = { art: 'pokal', runde: nummer, name: runde.name, paarungen: [], eigenes: null };
    for (const paarung of runde.paarungen) {
      const heim = this.vereinVon(paarung.heim);
      const gast = this.vereinVon(paarung.gast);
      let zuschauer = 0;
      if (!finale) {
        const kasse = finanzen.heimspiel(heim, zufall, { stimmung: 0.6, gegner: gast, pokal: true });
        zuschauer = kasse.zuschauer;
        this.buchen(heim, 'zuschauer', kasse.einnahmen,
          `Pokal gegen ${gast.name}, ${zuschauer.toLocaleString('de-DE')} Zuschauer`);
      }
      for (const verein of [heim, gast]) this.buchen(verein, 'praemien', pokal.PRAEMIE[nummer - 1], `Pokal: ${runde.name}`);
      const { ergebnis } = this.spielen(heim, gast, zufall, { entscheidung: true, neutral: finale }, lauf);
      Object.assign(paarung, {
        tore: ergebnis.tore, sieger: ergebnis.sieger, verlaengerung: ergebnis.verlaengerung, elfmeter: ergebnis.elfmeter,
      });
      if (heim.id === this.vereinId || gast.id === this.vereinId) {
        bericht.eigenes = this.spielBericht(ergebnis, heim, gast, zuschauer, 'pokal');
        this.eigenesSpielMelden(ergebnis, heim, gast, `Pokal, ${runde.name}`, false);
        const eigener = this.verein;
        const gegner = heim.id === eigener.id ? gast : heim;
        vorstand.nachPokalspiel(this.vorstand, {
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
      this.melden('liga', `${sieger.name} gewinnt den Pokal.`);
    } else {
      const naechste = this.pokal.runden[nummer];
      naechste.paarungen = pokal.auslosen(pokal.siegerDerRunde(runde), quelle(this.startwert, this.saison, this.termin, ZWECK.auslosung));
      this.pokal.aktuell = nummer;
      const eigene = naechste.paarungen.find((p) => p.heim === this.vereinId || p.gast === this.vereinId);
      if (eigene) {
        const daheim = eigene.heim === this.vereinId;
        this.melden('liga', `Pokal, ${naechste.name}: ${daheim ? 'daheim gegen' : 'auswaerts bei'} `
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

  /** Nach jedem Termin: Gehaelter, Zinsen, Bauzeit - fuer alle Vereine gleich. */
  laufendeKosten() {
    for (const verein of this.vereine) {
      const zins = finanzen.zinsen(verein);
      if (zins) this.buchen(verein, 'zinsen', zins, 'Dispozinsen');
      this.buchen(verein, 'gehaelter', -finanzen.gehaelter(verein), 'Gehaelter');
      const fertig = finanzen.ausbauWeiter(verein);
      if (fertig && verein.id === this.vereinId) {
        this.melden('finanzen', `Der Stadionausbau ist fertig: ${fertig.toLocaleString('de-DE')} neue Plaetze, `
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
        if (spieler.verletzt === 0 && verein.id === this.vereinId) this.melden('verein', `${spieler.name} ist wieder fit.`);
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
      if (verein.id === this.vereinId) {
        this.melden('verein', `Zu wenige einsatzbereite Spieler: ${neu.map((s) => `${s.name} (${s.position})`).join(', ')} `
          + 'ruecken aus der A-Jugend nach.');
      }
    }
  }

  punktabzugPruefen(anlass) {
    for (const verein of this.vereine) {
      if (verein.konto >= finanzen.PUNKTABZUG_GRENZE) continue;
      const zeile = this.tabellen[verein.liga].find((z) => z.id === verein.id);
      zeile.abzug = (zeile.abzug || 0) + finanzen.PUNKTABZUG;
      if (verein.id === this.vereinId || verein.liga === this.verein?.liga) {
        this.melden('liga', `${verein.name}: ${finanzen.PUNKTABZUG} Punkte Abzug ${anlass} - das Konto steht bei ${geld(verein.konto)}.`);
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
    const eigener = this.verein;
    const saison = this.saison;
    const endstand = { 1: liga.sortiert(this.tabellen[1]), 2: liga.sortiert(this.tabellen[2]) };
    const { absteiger, aufsteiger } = liga.aufUndAbstieg(this.tabellen[1], this.tabellen[2]);
    const name = (id) => this.vereinVon(id).name;

    for (const nummer of [1, 2]) {
      endstand[nummer].forEach((zeile, i) => {
        const verein = this.vereinVon(zeile.id);
        this.buchen(verein, 'praemien', finanzen.saisonpraemie(nummer, i + 1), `Saisonpraemie fuer Platz ${i + 1}`);
        // Wer besser abschneidet, als man ihm zutraute, gewinnt an Ruf.
        verein.reputation = Math.round(Math.min(100, Math.max(5, verein.reputation + (verein.tvRang - (i + 1)) * 0.6)));
      });
    }
    for (const id of absteiger) this.vereinVon(id).reputation = Math.max(5, this.vereinVon(id).reputation - 8);
    for (const id of aufsteiger) this.vereinVon(id).reputation = Math.min(100, this.vereinVon(id).reputation + 8);
    this.kiStadion();

    let bilanz = null;
    if (eigener && this.status === 'laeuft') {
      const platz = endstand[eigener.liga].findIndex((z) => z.id === eigener.id) + 1;
      const urteil = vorstand.saisonbilanz(this.vorstand, platz);
      bilanz = {
        verein: eigener.name, liga: eigener.liga, platz, ziel: this.vorstand.ziel, ...urteil,
        aufgestiegen: aufsteiger.includes(eigener.id), abgestiegen: absteiger.includes(eigener.id),
      };
      this.melden('vorstand', urteil.erreicht
        ? `Saisonziel erreicht: Platz ${platz}. Der Vorstand ist zufrieden.`
        : `Saisonziel verfehlt: Platz ${platz} statt ${this.vorstand.ziel.platz}. Das Vertrauen sinkt.`);
    }

    const zusammenfassung = {
      saison,
      meister: { 1: name(endstand[1][0].id), 2: name(endstand[2][0].id) },
      pokalsieger: this.pokal.sieger ? name(this.pokal.sieger) : null,
      absteiger: absteiger.map(name),
      aufsteiger: aufsteiger.map(name),
      eigener: bilanz,
      tabellen: {
        1: endstand[1].map((z) => ({ id: z.id, name: z.name, punkte: liga.wertung(z), tore: z.tore, gegentore: z.gegentore })),
        2: endstand[2].map((z) => ({ id: z.id, name: z.name, punkte: liga.wertung(z), tore: z.tore, gegentore: z.gegentore })),
      },
    };
    this.historie.unshift(zusammenfassung);
    for (const alt of this.historie.slice(TABELLEN_IN_HISTORIE)) delete alt.tabellen;
    this.melden('liga', `Saison ${saison} vorbei. Meister: ${zusammenfassung.meister[1]}. `
      + `Absteiger: ${zusammenfassung.absteiger.join(', ')}. Aufsteiger: ${zusammenfassung.aufsteiger.join(', ')}.`);

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
    if (bilanz?.aufgestiegen) this.melden('verein', `Aufgestiegen! ${eigener.name} spielt naechste Saison in der ersten Liga.`);
    if (bilanz?.abgestiegen) {
      this.melden('verein', `Abgestiegen. ${eigener.name} spielt naechste Saison in der zweiten Liga. `
        + `Die Abstiegsklausel senkt alle Gehaelter um ${Math.round((1 - ABSTIEGSKLAUSEL) * 100)} %.`);
    }

    // Entwicklung: jeder ein Jahr aelter, die Jungen besser, die Alten nicht.
    // Danach kommt die Saison in die Akte jedes Spielers - mit der Liga, in
    // der sie gespielt wurde, nicht der, in die der Verein jetzt wechselt.
    const ligaDerSaison = new Map([1, 2].flatMap((nummer) => endstand[nummer].map((z) => [z.id, nummer])));
    for (const verein of this.vereine) {
      const eintraege = kader.entwickeln(verein, zufall, this.pflichtspiele(verein), { anteil: 0.6 });
      for (const e of eintraege) this.saisonFesthalten(e.spieler, verein, ligaDerSaison.get(verein.id), e.alter);
      if (verein.id === this.vereinId) this.entwicklungMerken('Saisonende', 'Entwicklung ueber die Saison', eintraege);
    }
    kader.entwickeln({ spieler: this.freie, technikSumme: 0, trainingswochen: 0 }, zufall, 0);
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
      if (verein.id === this.vereinId && aufhoeren.length) {
        this.melden('verein', `Karriereende: ${aufhoeren.map((s) => `${s.name} (${s.alter})`).join(', ')}.`);
      }
    }
    // Vertraege: die anderen verlaengern, wen sie wollen. Wer danach ohne
    // Vertrag dasteht, geht - auch beim Menschen.
    transfer.kiVertraege(this, zufall);
    for (const verein of this.vereine) {
      const gehen = verein.spieler.filter((s) => !s.vertrag || s.vertrag.bis <= saison);
      for (const spieler of gehen) transfer.freistellen(this, verein, spieler);
      if (verein.id === this.vereinId && gehen.length) {
        this.melden('verein', `Vertrag ausgelaufen, verlassen den Verein: ${gehen.map((s) => s.name).join(', ')}.`);
      }
    }
    // Unter den Vereinslosen hoert auf, wer es angekuendigt hat, wer zu alt ist und wer nicht mehr mag.
    this.freie = this.freie.filter((s) => s.karriereende !== saison && !kader.hoertAuf(s, zufall) && s.alter <= 34);

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
      const grenze = verein.id === this.vereinId ? kader.KADER_MAX : transfer.KI_KADER_ZIEL + 1;
      const jugend = kader.jugendErzeugen(verein, zufall, erzeuger).slice(0, Math.max(0, grenze - verein.spieler.length));
      verein.spieler.push(...jugend);
      if (verein.id === this.vereinId && jugend.length) {
        this.melden('verein', `Aus der Jugend ruecken auf: ${jugend.map((s) => `${s.name} (${s.rolle}, Staerke ${s.staerke}, Talent ${s.talent})`).join(', ')}.`);
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

    this.angebote = [];
    if (bilanz?.entlassen) {
      this.entlassen('Nach einer verfehlten Saison trennt sich der Vorstand von dir.', quelle(this.startwert, this.saison, 0, ZWECK.stellen));
    }
    this.saisonVorbereiten();
    if (this.verein && this.status === 'laeuft') {
      this.melden('vorstand', `Saison ${this.saison}: Der Vorstand erwartet ${this.vorstand.ziel.text} `
        + `(Platz ${this.vorstand.ziel.platz} oder besser in der ${this.verein.liga}. Liga). Waehle einen Sponsor.`);
    }
    return { art: 'saisonende', ...zusammenfassung };
  }

  /**
   * Wer viel Geld hat und ein volles Stadion, baut aus - die anderen Vereine
   * sparen nicht ewig, sie legen an.
   */
  kiStadion() {
    for (const verein of this.vereine) {
      if (verein.id === this.vereinId || verein.stadion.ausbau) continue;
      if (verein.konto < 25000 || finanzen.auslastung(verein, { stimmung: 0.6 }) < 0.9) continue;
      const plan = [...finanzen.AUSBAU].reverse()
        .find((a) => verein.konto - a.kosten >= 12000 && finanzen.ausbauPruefen(verein, a.stufe).ok);
      if (!plan) continue;
      verein.stadion.ausbau = { plaetze: plan.plaetze, rest: plan.termine };
      this.buchen(verein, 'stadion', -plan.kosten, 'Stadionausbau');
    }
  }

  entlassen(grund, zufall) {
    const alter = this.verein;
    this.status = 'entlassen';
    this.stellen = vorstand.stellenangebote(this.vereine, alter, zufall);
    alter.aufstellung = null;
    alter.taktik.system = kader.bestesSystem(alter, alter.taktik.system);
    this.angebote = [];
    this.melden('vorstand', `${grund} Du bist bei ${alter.name} entlassen. `
      + `${this.stellen.length} Vereine bieten dir eine Stelle an.`);
  }

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
  eigenesSpielMelden(ergebnis, heim, gast, titel, ligaspiel) {
    const daheim = heim.id === this.vereinId;
    const gegner = daheim ? gast : heim;
    const [eigene, fremde] = daheim ? ergebnis.tore : [ergebnis.tore[1], ergebnis.tore[0]];
    let ausgang = eigene > fremde ? 'Sieg' : eigene < fremde ? 'Niederlage' : 'Unentschieden';
    let zusatz = ergebnis.verlaengerung ? ' n.V.' : '';
    if (ergebnis.elfmeter) {
      const [ie, ifr] = daheim ? ergebnis.elfmeter : [ergebnis.elfmeter[1], ergebnis.elfmeter[0]];
      zusatz = ` n.V., ${ie}:${ifr} im Elfmeterschiessen`;
    }
    if (!ligaspiel) ausgang = ergebnis.sieger === this.vereinId ? 'Weiter' : 'Ausgeschieden';
    this.melden('spiel', `${titel}: ${ausgang}, ${eigene}:${fremde}${zusatz} ${daheim ? 'gegen' : 'bei'} ${gegner.name}.`
      + (ligaspiel ? ` Platz ${this.platz()}.` : ''));
  }

  // ---------------------------------------------------------- Anweisungen

  mensch() {
    if (!this.verein) return { fehler: 'In dieser Welt fuehrt kein Mensch einen Verein.' };
    if (this.status === 'entlassen') return { fehler: 'Du bist entlassen. Waehle zuerst einen neuen Verein.' };
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
    if (!Number.isFinite(wert)) return { fehler: 'Kein gueltiger Wert.' };
    this.verein.training = Math.min(100, Math.max(0, Math.round(wert)));
    return { ok: true, training: this.verein.training };
  }

  eintrittSetzen(preis) {
    const halt = this.mensch();
    if (halt) return halt;
    const geprueft = finanzen.eintrittPruefen(preis);
    if (geprueft === null) return { fehler: 'Kein gueltiger Eintrittspreis.' };
    this.verein.eintritt = geprueft;
    return { ok: true, eintritt: geprueft };
  }

  sponsorWaehlen(id) {
    const halt = this.mensch();
    if (halt) return halt;
    if (this.termin !== 0 || this.verein.sponsor) return { fehler: 'Der Sponsorvertrag fuer diese Saison steht schon.' };
    const angebot = this.sponsorAngebote.find((a) => a.id === id);
    if (!angebot) return { fehler: 'Dieses Sponsorangebot gibt es nicht.' };
    this.verein.sponsor = angebot;
    this.sponsorAngebote = [];
    this.melden('finanzen', `${angebot.name} ist Sponsor fuer die Saison ${this.saison}: ${geld(angebot.jeSpiel)} je Ligaspiel, `
      + `${geld(angebot.jeSieg)} je Sieg.`);
    return { ok: true, sponsor: angebot };
  }

  stadionAusbauen(stufe) {
    const halt = this.mensch();
    if (halt) return halt;
    const plan = finanzen.ausbauPruefen(this.verein, stufe);
    if (plan.fehler) return plan;
    this.verein.stadion.ausbau = { plaetze: plan.plaetze, rest: plan.termine };
    this.buchen(this.verein, 'stadion', -plan.kosten, `Stadionausbau um ${plan.plaetze.toLocaleString('de-DE')} Plaetze`);
    this.melden('finanzen', `Der Stadionausbau beginnt: ${plan.plaetze.toLocaleString('de-DE')} Plaetze in ${plan.termine} Wochen.`);
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
    this.melden('transfer', `${spieler.name} (${spieler.position}, Staerke ${spieler.staerke}) kommt `
      + `${verkaeufer ? `von ${verkaeufer.name} fuer ${geld(abloese)}` : 'ablosefrei'}, Vertrag bis Saison ${spieler.vertrag.bis}, `
      + `${geld(spieler.vertrag.gehalt)} im Jahr.`);
    return { ok: true, spieler: { id: spieler.id, name: spieler.name }, abloese };
  }

  verlaengern(spielerId, laufzeit) {
    const halt = this.mensch();
    if (halt) return halt;
    const spieler = this.spielerVon(spielerId);
    if (!spieler) return { fehler: 'Dieser Spieler gehoert nicht zum Kader.' };
    const ergebnis = vertraege.verlaengern(spieler, laufzeit, this.saison);
    if (ergebnis.fehler) return ergebnis;
    this.melden('verein', `${spieler.name} verlaengert bis Saison ${ergebnis.bis}, ${geld(ergebnis.gehalt)} im Jahr.`);
    return ergebnis;
  }

  spielerFreistellen(spielerId) {
    const halt = this.mensch();
    if (halt) return halt;
    const eigener = this.verein;
    const spieler = this.spielerVon(spielerId);
    if (!spieler) return { fehler: 'Dieser Spieler gehoert nicht zum Kader.' };
    if (transfer.bestandNachAbgang(eigener, spieler) < kader.MINDESTBESTAND[spieler.position]) {
      return { fehler: `Ohne ${spieler.name} bleiben zu wenige auf ${spieler.position}.` };
    }
    const abfindung = vertraege.abfindung(spieler, this.saison);
    transfer.freistellen(this, eigener, spieler);
    this.buchen(eigener, 'abfindungen', -abfindung, `Abfindung fuer ${spieler.name}`);
    this.melden('verein', `${spieler.name} ist freigestellt. Abfindung: ${geld(abfindung)}.`);
    return { ok: true, abfindung };
  }

  transferlisteSetzen(spielerId, an) {
    const halt = this.mensch();
    if (halt) return halt;
    const spieler = this.spielerVon(spielerId);
    if (!spieler) return { fehler: 'Dieser Spieler gehoert nicht zum Kader.' };
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
    this.melden('transfer', `${spieler.name} wechselt fuer ${geld(angebot.gebot)} zu ${kaeufer.name}.`);
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
   * Eine Saison in die Akte eines Spielers - knapp als Zahlenreihe, damit der
   * Spielstand klein bleibt: Saison, Verein, Liga, Spiele, Tore, Vorlagen,
   * Notenschnitt mal zehn, Staerke nach der Entwicklung, Alter in der Saison.
   */
  saisonFesthalten(spieler, verein, liga, alter) {
    const s = spieler.saison;
    const note = s.noten ? Math.round((s.notenSumme / s.noten) * 10) : 0;
    (spieler.laufbahn.stationen ||= []).push([this.saison, verein ? verein.id : null, liga ?? null, s.spiele, s.tore, s.vorlagen, note, spieler.staerke, alter]);
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

  // --------------------------------------------------- Sichern und Laden

  sichern() {
    return JSON.parse(JSON.stringify(this));
  }

  static laden(daten) {
    if (!daten || !LADBARE_FASSUNGEN.includes(daten.fassung)) {
      const fehler = new Error('Dieser Spielstand stammt aus einer anderen Fassung des Spiels.');
      fehler.code = 'FASSUNG';
      throw fehler;
    }
    return new Karriere(anheben(JSON.parse(JSON.stringify(daten))));
  }
}

/**
 * Ein Spielstand der Fassung 2 kannte keine Positionen. Beim Laden bekommt
 * jeder Spieler eine, so wie ein Neuer im Verein: die, von der es im Kader
 * gemessen am Plan am wenigsten gibt - die Staerksten zuerst, damit sie die
 * tragenden Rollen bekommen. Gemerkte Aufstellungen passen zu keinen Plaetzen
 * und fallen weg. Danach ist es ein Stand der jetzigen Fassung.
 */
function anheben(daten) {
  if (daten.fassung === 2) {
    const verteilen = (spieler, imVerein) => {
      const vergeben = [];
      for (const s of [...spieler].sort((a, b) => b.staerke - a.staerke)) {
        if (!s.rolle) Object.assign(s, kader.rollenFuer(s, imVerein ? vergeben : null));
        vergeben.push(s);
      }
    };
    for (const verein of daten.vereine) {
      verteilen(verein.spieler, true);
      verein.aufstellung = null;
    }
    verteilen(daten.freie, false);
    daten.fassung = FASSUNG;
  }
  return daten;
}

module.exports = {
  Karriere, FASSUNG, LADBARE_FASSUNGEN, TERMINE, geld, quelle, anheben,
};
