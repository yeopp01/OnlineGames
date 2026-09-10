'use strict';

// Der Transfermarkt. Ein Angebot, eine Antwort - kein Berater, kein
// Vertragspoker ueber Runden (→ specs/15-manager/spielziel.md).
//
// Geprueft wird alles hier auf dem Server: Fenster, Geld, Kaderplatz,
// Mindestbestand, ob der Spieler ueberhaupt will. Der Browser darf fragen,
// entscheiden darf er nicht.
//
// Die Funktionen bekommen die Karriere als `welt` - sie brauchen Vereine,
// Vereinslose, Saison und Termin, und die stehen dort zusammen.
const {
  TOR, POSITIONEN, MINDESTBESTAND, KADERPLAN, KADER_MAX, SYSTEME, marktwert, niveau,
} = require('./kader');
const vertraege = require('./vertraege');
const { fensterOffen } = require('./kalender');

// So gross will ein Verein der KI seinen Kader halten.
const KI_KADER_ZIEL = 23;

// Wie sehr ein Verein an einem Spieler haengt: wer auf seiner Position der
// Beste ist, wird teuer; der vierte Torwart ist zu haben.
function wichtigkeit(verein, spieler) {
  const gleiche = verein.spieler
    .filter((s) => s.position === spieler.position)
    .sort((a, b) => b.staerke - a.staerke);
  const rang = gleiche.indexOf(spieler);
  if (rang < 0) return 0;
  return Math.max(0, 1 - rang / Math.max(1, gleiche.length - 1));
}

/**
 * Was ein Verein fuer einen seiner Spieler haben will. Immer ueber dem
 * Marktwert - ausser er steht auf der Transferliste oder sein Vertrag laeuft
 * aus: dann will der Verein lieber jetzt etwas als im Sommer nichts.
 */
function forderung(verein, spieler, saison) {
  let preis = marktwert(spieler) * (1.1 + 0.45 * wichtigkeit(verein, spieler));
  if (spieler.transferliste) preis *= 0.8;
  if (spieler.vertrag && spieler.vertrag.bis <= saison) preis *= 0.7;
  return Math.round(preis);
}

function bestandNachAbgang(verein, spieler) {
  return verein.spieler.filter((s) => s.position === spieler.position && s !== spieler).length;
}

/** Wie viele ein Verein auf einer Position fuer sein System braucht. */
function stammplaetze(verein, position) {
  if (position === TOR) return 1;
  return (SYSTEME[verein.taktik.system] || SYSTEME['4-4-2'])[position];
}

/** Der schwaechste, der auf dieser Position spielen wuerde - 0, wenn einer fehlt. */
function schwaechsterStamm(verein, position) {
  const stamm = verein.spieler
    .filter((s) => s.position === position)
    .sort((a, b) => b.staerke - a.staerke)
    .slice(0, stammplaetze(verein, position));
  return stamm.length < stammplaetze(verein, position) ? 0 : stamm.at(-1).staerke;
}

function finden(welt, spielerId) {
  for (const verein of welt.vereine) {
    const spieler = verein.spieler.find((s) => s.id === spielerId);
    if (spieler) return { spieler, verein };
  }
  const frei = welt.freie.find((s) => s.id === spielerId);
  return frei ? { spieler: frei, verein: null } : null;
}

const SORTIERUNG = {
  staerke: (a, b) => b.staerke - a.staerke || a.forderung - b.forderung,
  preis: (a, b) => a.forderung - b.forderung || b.staerke - a.staerke,
  alter: (a, b) => a.alter - b.alter || b.staerke - a.staerke,
  talent: (a, b) => b.talent - a.talent || b.staerke - a.staerke,
};

/**
 * Was zu haben ist: die Spieler aller anderen Vereine beider Ligen und die
 * Vereinslosen, mit Forderung und der Antwort, ob sie kommen wuerden. Wer den
 * Mindestbestand seines Vereins haelt, steht gar nicht erst drin.
 *
 * @param {object} filter  position, liga ('1', '2', 'frei'), maxAlter,
 *   minStaerke, maxPreis, sortierung, anzahl
 */
function marktliste(welt, filter = {}) {
  const eigener = welt.vereine.find((v) => v.id === welt.vereinId);
  const liste = [];
  const aufnehmen = (spieler, verein) => {
    const wert = marktwert(spieler);
    const bereit = eigener ? vertraege.wechselbereit(spieler, eigener) : { ok: true };
    liste.push({
      id: spieler.id,
      name: spieler.name,
      position: spieler.position,
      rolle: spieler.rolle,
      nebenrolle: spieler.nebenrolle,
      karriereende: spieler.karriereende === welt.saison,
      alter: spieler.alter,
      staerke: spieler.staerke,
      talent: spieler.talent,
      verein: verein ? verein.name : 'vereinslos',
      vereinId: verein ? verein.id : null,
      liga: verein ? verein.liga : null,
      wert,
      forderung: verein ? forderung(verein, spieler, welt.saison) : 0,
      gehalt: vertraege.gehaltswunsch(spieler),
      vertragBis: spieler.vertrag ? spieler.vertrag.bis : null,
      transferliste: Boolean(spieler.transferliste),
      bereit: bereit.ok,
      grund: bereit.ok ? null : bereit.grund,
    });
  };
  for (const verein of welt.vereine) {
    if (verein.id === welt.vereinId) continue;
    if (filter.liga === 'frei') continue;
    if (filter.liga && String(verein.liga) !== String(filter.liga)) continue;
    for (const spieler of verein.spieler) {
      if (bestandNachAbgang(verein, spieler) < MINDESTBESTAND[spieler.position]) continue;
      aufnehmen(spieler, verein);
    }
  }
  if (!filter.liga || filter.liga === 'frei') for (const spieler of welt.freie) aufnehmen(spieler, null);

  const passend = liste.filter((s) => (!filter.position || s.position === filter.position)
    && (!Number.isFinite(filter.maxAlter) || s.alter <= filter.maxAlter)
    && (!Number.isFinite(filter.minStaerke) || s.staerke >= filter.minStaerke)
    && (!Number.isFinite(filter.maxPreis) || s.forderung <= filter.maxPreis));
  passend.sort(SORTIERUNG[filter.sortierung] || SORTIERUNG.staerke);
  const anzahl = Math.min(200, Math.max(1, filter.anzahl || 100));
  return { gesamt: passend.length, liste: passend.slice(0, anzahl) };
}

/**
 * Darf der Mensch diesen Spieler holen? Die Reihenfolge der Pruefungen ist
 * die, in der ein Mensch fragen wuerde: gibt es ihn, darf ich, kann ich,
 * will der Verein, will er.
 *
 * @returns {{ok: true, spieler, verkaeufer, abloese: number}|{fehler: string}}
 */
function kaufPruefen(welt, kaeufer, spielerId, gebot, laufzeit) {
  const gefunden = finden(welt, spielerId);
  if (!gefunden) return { fehler: 'Diesen Spieler gibt es nicht.' };
  const { spieler, verein: verkaeufer } = gefunden;
  if (verkaeufer && verkaeufer.id === kaeufer.id) return { fehler: `${spieler.name} spielt schon fuer dich.` };
  if (verkaeufer && !fensterOffen(welt.termine[welt.termin])) {
    return { fehler: 'Das Transferfenster ist geschlossen. Vereinslose kannst du jederzeit holen.' };
  }
  if (!Number.isFinite(gebot) || gebot < 0) return { fehler: 'Kein gueltiges Gebot.' };
  const falscheLaufzeit = vertraege.laufzeitPruefen(spieler, laufzeit);
  if (falscheLaufzeit) return { fehler: falscheLaufzeit };
  if (kaeufer.spieler.length >= KADER_MAX) return { fehler: `Der Kader ist voll (${KADER_MAX} Spieler).` };
  if (kaeufer.konto <= 0) return { fehler: 'Mit leerem Konto unterschreibt niemand.' };
  if (verkaeufer && gebot > kaeufer.konto) return { fehler: 'So viel ist nicht auf dem Konto.' };
  if (verkaeufer && bestandNachAbgang(verkaeufer, spieler) < MINDESTBESTAND[spieler.position]) {
    return { fehler: `${verkaeufer.name} gibt den letzten ${spieler.position} nicht ab.` };
  }
  if (verkaeufer) {
    const verlangt = forderung(verkaeufer, spieler, welt.saison);
    if (gebot < verlangt) return { fehler: `${verkaeufer.name} verlangt ${verlangt} T.` };
  }
  const bereit = vertraege.wechselbereit(spieler, kaeufer);
  if (!bereit.ok) return { fehler: bereit.grund };
  return { ok: true, spieler, verkaeufer, abloese: verkaeufer ? Math.round(gebot) : 0 };
}

/** Ein Wechsel in die Akte des Spielers - knapp als Zahlenreihe: Saison, Termin, von, zu, Abloese. */
function wechselFesthalten(welt, spieler, von, zu, abloese) {
  (spieler.laufbahn.wechsel ||= []).push([welt.saison, welt.termin, von, zu, Math.round(abloese)]);
}

/**
 * Den Wechsel vollziehen. Der Spieler behaelt seine Nummer - sie ist
 * weltweit eindeutig -, bekommt einen neuen Vertrag und faellt aus einer
 * gemerkten Aufstellung seines alten Vereins.
 */
function wechseln(welt, { kaeufer, verkaeufer, spieler, abloese, laufzeit }) {
  if (verkaeufer) {
    verkaeufer.spieler = verkaeufer.spieler.filter((s) => s !== spieler);
    welt.buchen(verkaeufer, 'transfers', abloese, `${spieler.name} an ${kaeufer.name}`);
    if (verkaeufer.aufstellung && verkaeufer.aufstellung.ids.includes(spieler.id)) verkaeufer.aufstellung = null;
  } else {
    welt.freie = welt.freie.filter((s) => s !== spieler);
  }
  welt.buchen(kaeufer, 'transfers', -abloese, `${spieler.name} ${verkaeufer ? `von ${verkaeufer.name}` : '(ablosefrei)'}`);
  spieler.vertrag = vertraege.neuerVertrag(spieler, laufzeit, welt.saison);
  spieler.transferliste = null;
  spieler.moral = Math.min(100, spieler.moral + 8);
  kaeufer.spieler.push(spieler);
  wechselFesthalten(welt, spieler, verkaeufer ? verkaeufer.id : null, kaeufer.id, abloese);
  welt.ticker.unshift({
    saison: welt.saison,
    spieler: spieler.name,
    position: spieler.position,
    rolle: spieler.rolle,
    staerke: spieler.staerke,
    von: verkaeufer ? verkaeufer.name : 'vereinslos',
    zu: kaeufer.name,
    abloese,
  });
  welt.ticker.length = Math.min(welt.ticker.length, 40);
  return spieler;
}

/** Einen Spieler an die Vereinslosen abgeben. */
function freistellen(welt, verein, spieler) {
  verein.spieler = verein.spieler.filter((s) => s !== spieler);
  if (verein.aufstellung && verein.aufstellung.ids.includes(spieler.id)) verein.aufstellung = null;
  spieler.vertrag = null;
  spieler.transferliste = null;
  welt.freie.push(spieler);
  wechselFesthalten(welt, spieler, verein.id, null, 0);
}

/**
 * Was die anderen Vereine vom Menschen wollen. Ein Verein bietet auf einen
 * Spieler, der besser ist als der schwaechste seiner Stammelf auf dieser
 * Position - auf einen, der auf der Transferliste steht, schon eher.
 */
function kiAngebote(welt, mensch, zufall) {
  const angebote = [];
  for (const verein of welt.vereine) {
    if (verein.id === mensch.id) continue;
    if (verein.spieler.length >= KADER_MAX) continue;
    const aufListe = mensch.spieler.filter((s) => s.transferliste);
    if (zufall() > (aufListe.length ? 0.14 : 0.06)) continue;

    const kandidaten = mensch.spieler
      .filter((s) => bestandNachAbgang(mensch, s) >= MINDESTBESTAND[s.position])
      .filter((s) => vertraege.wechselbereit(s, verein).ok && !s.karriereende)
      .filter((s) => s.staerke > schwaechsterStamm(verein, s.position) + (s.transferliste ? -2 : 3))
      .sort((a, b) => Number(Boolean(b.transferliste)) - Number(Boolean(a.transferliste)) || b.staerke - a.staerke);
    const wunsch = kandidaten[0];
    if (!wunsch) continue;

    const faktor = wunsch.transferliste ? 0.8 + zufall() * 0.3 : 0.95 + zufall() * 0.4;
    const gebot = Math.round(marktwert(wunsch) * faktor);
    if (gebot > verein.konto * 0.7) continue;
    angebote.push({
      id: `a${welt.saison}-${welt.termin}-${verein.id}`,
      vereinId: verein.id,
      verein: verein.name,
      liga: verein.liga,
      spielerId: wunsch.id,
      spieler: wunsch.name,
      position: wunsch.position,
      rolle: wunsch.rolle,
      staerke: wunsch.staerke,
      wert: marktwert(wunsch),
      gebot,
      gueltigBis: welt.termin + 2,
    });
  }
  return angebote;
}

/**
 * Die anderen Vereine handeln - mit den Vereinslosen und untereinander, nie
 * mit dem Menschen (der bekommt Angebote). Je Verein hoechstens ein Wechsel
 * je Aufruf; ein Loch im Kader wird immer gestopft, eine Verstaerkung nur ab
 * und zu gesucht.
 *
 * @returns {object[]} die Wechsel, wie sie im Ticker stehen
 */
function kiTransfers(welt, zufall, { verstaerkung = 0.3 } = {}) {
  kiSparen(welt);
  const wechsel = [];
  const reihenfolge = welt.vereine
    .filter((v) => v.id !== welt.vereinId)
    .map((v) => ({ v, los: zufall() }))
    .sort((a, b) => a.los - b.los)
    .map(({ v }) => v);

  for (const verein of reihenfolge) {
    const loch = POSITIONEN.find((p) => verein.spieler.filter((s) => s.position === p).length < KADERPLAN[p]);
    if (!loch && zufall() > verstaerkung) continue;

    const vereinsniveau = niveau(verein);
    const position = loch || POSITIONEN
      .map((p) => ({ p, luecke: vereinsniveau - schwaechsterStamm(verein, p) }))
      .sort((a, b) => b.luecke - a.luecke)[0].p;
    const schwelle = loch ? 0 : schwaechsterStamm(verein, position) + 3;
    const gehaltssumme = verein.spieler.reduce((s, x) => s + (x.vertrag?.gehalt || 0), 0);
    const budget = verein.konto - gehaltssumme * 0.3;

    const kandidaten = [];
    for (const spieler of welt.freie) {
      // Wer zum Saisonende aufhoert, wird nicht mehr geholt.
      if (spieler.position !== position || spieler.staerke < schwelle || spieler.alter > 32 || spieler.karriereende) continue;
      if (!vertraege.wechselbereit(spieler, verein).ok) continue;
      // Ein Loch wird auch mit leerem Konto gestopft - mit einem, der wenig kostet.
      const gehalt = vertraege.gehaltswunsch(spieler);
      if (verein.konto < gehalt && !(loch && gehalt <= 400)) continue;
      kandidaten.push({ spieler, verkaeufer: null, preis: 0 });
    }
    if (budget > 0) {
      for (const anderer of welt.vereine) {
        if (anderer === verein || anderer.id === welt.vereinId || anderer.spieler.length <= 18) continue;
        for (const spieler of anderer.spieler) {
          // Wer auf der Liste steht, ist auch mit 32 noch zu haben und muss
          // nur besser sein als der Schwaechste der Stammelf.
          const liste = Boolean(spieler.transferliste);
          if (spieler.position !== position || spieler.alter > (liste ? 32 : 30) || spieler.karriereende) continue;
          if (spieler.staerke < Math.max(liste ? schwelle - 3 : schwelle, 1)) continue;
          if (bestandNachAbgang(anderer, spieler) < MINDESTBESTAND[position]) continue;
          if (!vertraege.wechselbereit(spieler, verein).ok) continue;
          const preis = forderung(anderer, spieler, welt.saison);
          if (preis > budget) continue;
          kandidaten.push({ spieler, verkaeufer: anderer, preis });
        }
      }
    }
    // Die meiste Staerke fuers Geld: ein Punkt Staerke ist viel wert, eine
    // Million auch.
    const bester = kandidaten
      .map((k) => ({ ...k, nutzen: k.spieler.staerke - k.preis / 1500 - Math.max(0, k.spieler.alter - 28) }))
      .sort((a, b) => b.nutzen - a.nutzen)[0];
    if (!bester) continue;
    const laufzeit = Math.min(vertraege.laufzeitMax(bester.spieler), bester.spieler.alter <= 26 ? 3 : 2);
    wechseln(welt, {
      kaeufer: verein, verkaeufer: bester.verkaeufer, spieler: bester.spieler, abloese: bester.preis, laufzeit,
    });
    wechsel.push(welt.ticker[0]);

    // Wer ueber sein Ziel waechst, gibt den Schwaechsten dieser Position ab.
    if (verein.spieler.length > KI_KADER_ZIEL) {
      const weg = verein.spieler
        .filter((s) => s.position === position && s !== bester.spieler)
        .sort((a, b) => a.staerke - b.staerke)[0];
      if (weg && bestandNachAbgang(verein, weg) >= MINDESTBESTAND[position]) {
        welt.buchen(verein, 'abfindungen', -vertraege.abfindung(weg, welt.saison), `Abfindung fuer ${weg.name}`);
        freistellen(welt, verein, weg);
      }
    }
  }
  return wechsel;
}

/**
 * Vor dem Saisonende verlaengern die anderen Vereine, wen sie behalten
 * wollen: wer jung genug und gut genug ist. Wer uebrig bleibt, geht.
 */
function kiVertraege(welt, zufall) {
  for (const verein of welt.vereine) {
    if (verein.id === welt.vereinId) continue;
    const vereinsniveau = niveau(verein);
    // Wer im Minus steht, behaelt nur, wen er wirklich braucht.
    const klamm = verein.konto < 0;
    const bleiben = verein.spieler.filter((s) => s.vertrag && s.vertrag.bis > welt.saison).length;
    const wert = (s) => s.staerke - Math.max(0, s.alter - 28) * 2;
    const kandidaten = verein.spieler
      .filter((s) => s.vertrag && s.vertrag.bis <= welt.saison)
      .filter((s) => (s.alter <= 30 && s.staerke >= vereinsniveau - (klamm ? 4 : 12))
        || (s.alter <= 33 && s.staerke >= vereinsniveau + (klamm ? 2 : -2))
        || (!klamm && s.jugend && s.alter <= 21))
      .sort((a, b) => wert(b) - wert(a));
    // Platz lassen fuer zwei aus der Jugend - sonst waechst der Kader Jahr um Jahr.
    const platz = Math.max(0, KI_KADER_ZIEL - 2 - bleiben);
    for (const spieler of kandidaten.slice(0, platz)) {
      const laufzeit = Math.min(vertraege.laufzeitMax(spieler), 1 + Math.floor(zufall() * 3));
      spieler.vertrag = { bis: welt.saison + laufzeit, gehalt: vertraege.gehaltswunsch(spieler) };
    }
  }
}

/**
 * Wer im Minus steht, setzt seine zwei teuersten Spieler auf die
 * Transferliste - dort sind sie billiger, und die anderen greifen zu. Wer
 * wieder im Plus ist, nimmt sie herunter.
 */
function kiSparen(welt) {
  for (const verein of welt.vereine) {
    if (verein.id === welt.vereinId) continue;
    if (verein.konto >= 0) {
      for (const spieler of verein.spieler) spieler.transferliste = null;
      continue;
    }
    verein.spieler
      .filter((s) => bestandNachAbgang(verein, s) >= MINDESTBESTAND[s.position])
      .sort((a, b) => (b.vertrag?.gehalt || 0) - (a.vertrag?.gehalt || 0))
      .slice(0, 2)
      .forEach((s) => { s.transferliste = s.transferliste || welt.saison; });
  }
}

module.exports = {
  KI_KADER_ZIEL,
  wichtigkeit, forderung, bestandNachAbgang, schwaechsterStamm, finden,
  marktliste, kaufPruefen, wechseln, freistellen, kiAngebote, kiTransfers, kiVertraege, kiSparen,
};
