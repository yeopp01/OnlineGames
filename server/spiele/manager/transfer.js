// @ts-check
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
const finanzen = require('./finanzen');
const { fensterOffen } = require('./kalender');

/** @typedef {import('./daten').Verein} Verein */
/** @typedef {import('./daten').Spieler} Spieler */
/**
 * @typedef {object} Marktfilter
 * @property {string} [position]
 * @property {'1'|'2'|'frei'|string} [liga]
 * @property {number} [maxAlter]
 * @property {number} [minStaerke]
 * @property {number} [maxPreis]
 * @property {string} [sortierung]
 * @property {number} [anzahl]
 */

// So gross will ein Verein der KI seinen Kader halten.
const KI_KADER_ZIEL = 23;

// Wie alt ein Spieler sein darf, den die KI holt oder behaelt (→
// docs/manager/dynamik/plan.md, Schritt 4). Seit die Jugend staerker ankommt,
// verdraengt sie die Aelteren; damit das Durchschnittsalter nicht unter 23
// faellt (kader AC-24), haelt die KI an ihnen fester. Gesetzt, gemessen nur
// gegen die Baender.
const ALTERSBLICK = {
  // Vereinslose bis 34 statt 32, Spieler anderer Vereine bis 32 statt 30.
  freieBis: 34,
  andereBis: 32,
  // Jedes Jahr ueber 28 kostet beim Holen einen halben Punkt statt eines ganzen,
  nutzenAb: 28,
  nutzenJe: 0.5,
  // beim Verlaengern einen statt zwei.
  wertAb: 28,
  wertJe: 1,
  // Verlaengert wird bis 35 statt 33, wer hoechstens 6 statt 2 unter dem Niveau liegt.
  aelterBis: 35,
  aelterUnterNiveau: 6,
  // Aeltere als 30 nur, wer mindestens ein Viertel der erwarteten
  // Jahreseinnahmen auf dem Konto hat. Ohne diese Ruecklage rutschte ein
  // armer Verein der Liga 2 ins Bodenlose (Startwert 4711: -35 Mio nach 20
  // Saisons, 2026: -16 Mio; vorher nie unter -1,7): die Aelteren fuellten die
  // Gehaltsgrenze, die Jugend kam ausserhalb der Grenze dazu, und die Zinsen
  // taten den Rest. Mit der Ruecklage ueber acht Startwerte nie unter -2,7 Mio,
  // die Baender wie ohne sie. Gesetzt (0,5 hielt auch, kostete aber kader AC-23).
  // Mit dem Loch unten in kiVertraege dazu: mit beiden nie unter -2,8 Mio, ohne
  // die Ruecklage 2026 -9,2, ohne das Loch 2026 -24,1.
  aelterRuecklage: 0.25,
};

// Der Haushalt der anderen Vereine (→ docs/manager/dynamik/plan.md,
// Schritt 2): ihre Gehaltssumme bleibt unter einem Anteil der erwarteten
// Einnahmen (finanzen.erwarteteEinnahmen). Ohne Grenze verlaengerte die KI
// zum Wunschgehalt und stopfte Loecher auch mit leerem Konto - Liga 2 stand
// ab Saison 7 im Median im Minus, 3 bis 5 Vereine je Saison unter der
// Abzugsgrenze. Mit der Grenze allein (85 %) hielt das, aber die Konten
// wuchsen ohne Ende: Median Liga 1 nach 20 Saisons 82 bis 112 Mio. Deshalb
// darf, was ueber einer Ruecklage liegt, in Gehaelter gehen. Gemessen (20
// Saisons, Startwerte 4711, 20260910, 77, 1234): Median Liga 1 nach 20
// Saisons 44,9 bis 56,1 Mio (1,6 bis 2,1 Jahreseinnahmen), Liga 2 7,8 bis
// 8,2 Mio, je Liga hoechstens zwei unter -3 Mio. Abbau in 5 Jahren liess
// 53 bis 58 Mio, in 10 Jahren 65 bis 79; eine Stufe (ueber der Ruecklage
// 125 %) 43 bis 69 Mio, Liga 2 nur 3,8 bis 5,0, und ein reicher Verein mit
// teurem Kader kaufte nie (transfer AC-16). Reiche Vereine sparen auch ohne
// jede Grenze weiter (Gehalt/Einnahmen rund 0,9): sie fragen nicht mehr
// nach, als ihr Kader braucht. Mehr im Plan unter "Stand".
const HAUSHALT = {
  // Hoechstens dieser Anteil der erwarteten Einnahmen geht an Gehaelter.
  anteil: 0.85,
  // So viele erwartete Jahreseinnahmen behaelt ein Verein als Ruecklage, ...
  ruecklage: 0.5,
  // ... was darueber liegt, darf in so vielen Jahren in Gehaelter gehen.
  abbauJahre: 2,
  // Ein Loch im Kader wird auch ueber der Grenze und mit leerem Konto
  // gestopft - mit einem, der hoechstens so viel will.
  lochGehalt: 400,
};

/** Wie viel Gehalt im Jahr ein Verein der KI sich leistet (in Tausend). */
function gehaltsgrenze(verein) {
  const einnahmen = finanzen.erwarteteEinnahmen(verein);
  const ueberschuss = Math.max(0, verein.konto - HAUSHALT.ruecklage * einnahmen);
  return HAUSHALT.anteil * einnahmen + ueberschuss / HAUSHALT.abbauJahre;
}

// Der Markt der anderen Vereine (→ docs/manager/dynamik/plan.md, Schritt 6).
// Gemessen vorher (20 Saisons, acht Startwerte): die reichsten Vereine
// wurden reich, weil sie Spieler fuer Abloese verkauften und die Luecke mit
// Vereinslosen fuellten - netto 4 bis 9 Mio Transferertrag je Saison, das
// groesste Konto bis 327 Mio (finanzen AC-19 riss an fuenf Startwerten).
// Dasselbe Muster trug den Haendler-Hebel des Menschen: Vereinslose
// abloesefrei holen, auf die Liste setzen, an die KI verkaufen - 16 bis 23
// Mio Gewinn je Saison, mehr als ein Verein der Liga 2 im Spielbetrieb
// einnimmt. Und die Wechsel hatten sich halbiert, weil die Gehaltsgrenze
// jede Verstaerkung sperrte, solange der Schwaechste noch im Kader stand.
// Alle drei Zahlen sind gesetzt, kein Wert aus Anstoss 3.
const MARKT = {
  // Wer mehr als so viele erwartete Jahreseinnahmen auf dem Konto hat, ist
  // satt: er verkauft niemanden, der nicht auf seiner Liste steht - an den
  // Menschen so wenig wie an die KI. Das schliesst die Quelle des Hortens.
  sattAb: 3,
  // Wer mehr als so viele hat, sucht in jedem Fenster eine Verstaerkung
  // statt nur ab und zu - das Geld geht zurueck in den Markt.
  reichAb: 1,
  // Ein Verein bietet dem Menschen nur auf einen Spieler, wenn kein
  // Vereinsloser zu haben ist, der hoechstens so viel schwaecher ist und in
  // die Gehaltsgrenze passt. Wer ihn umsonst bekommt, zahlt keine Abloese.
  freiNaeher: 3,
};

// Wie oft ein Verein dem Menschen bietet (transfer AC-31, plan.md
// "Angebote an den Menschen"). Seit Schritt 6 prueft ein Gebot die
// Gehaltsgrenze, und die Vereine stehen im Median bei 1,03 ihrer Grenze -
// von hundert Geboten, die das Konto erlaubte, blieben 18 bis 47. Ein Mensch, der nichts
// auf die Liste setzt, bekam damit in Liga 2 im Mittel 0,25 Angebote je
// Saison (vorher 2,40). Die Grenze bleibt, gezogen wird oefter:
// - liste: so oft darf ein Verein auf einen Spieler der Transferliste
//   bieten - unveraendert, daran haengt der Haendler (transfer AC-28);
// - sonst: so oft auf einen, der nicht auf der Liste steht (vorher 0,06).
// Ein Verein, dessen Angebot noch gilt, bietet nicht neu.
// Gemessen (acht Startwerte, zehn Saisons): je Saison L1 Bester 9,8,
// L1 Mitte 7,3, L2 Mitte 1,7 Angebote, das kleinste je Startwert 6,5 / 3,0 /
// 1,3. Der Haendler (transfer AC-28, Mitte der ersten und zweiten Liga)
// verdient -5 und -5 % seiner Einnahmen statt 5 und -19 %. Gesetzt.
const ANGEBOTE = { liste: 0.14, sonst: 0.8 };

/** Hat dieser Verein so viel, dass er niemanden verkaufen muss? */
function satt(verein) {
  return verein.konto > MARKT.sattAb * finanzen.erwarteteEinnahmen(verein);
}

function gehaltssumme(verein) {
  return verein.spieler.reduce((s, x) => s + (x.vertrag?.gehalt || 0), 0);
}

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
 * @param {Verein|null} eigener  der Verein, der fragt - fuer "wuerde kommen"
 * @param {Marktfilter} [filter]
 */
function marktliste(welt, eigener, filter = {}) {
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
    if (verein === eigener) continue;
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
  if (verkaeufer && verkaeufer.id === kaeufer.id) return { fehler: `${spieler.name} spielt schon für dich.` };
  if (verkaeufer && !fensterOffen(welt.termine[welt.termin])) {
    return { fehler: 'Das Transferfenster ist geschlossen. Vereinslose kannst du jederzeit holen.' };
  }
  if (!Number.isFinite(gebot) || gebot < 0) return { fehler: 'Kein gültiges Gebot.' };
  const falscheLaufzeit = vertraege.laufzeitPruefen(spieler, laufzeit);
  if (falscheLaufzeit) return { fehler: falscheLaufzeit };
  if (kaeufer.spieler.length >= KADER_MAX) return { fehler: `Der Kader ist voll (${KADER_MAX} Spieler).` };
  if (kaeufer.konto <= 0) return { fehler: 'Mit leerem Konto unterschreibt niemand.' };
  if (verkaeufer && gebot > kaeufer.konto) return { fehler: 'So viel ist nicht auf dem Konto.' };
  if (verkaeufer && bestandNachAbgang(verkaeufer, spieler) < MINDESTBESTAND[spieler.position]) {
    return { fehler: `${verkaeufer.name} gibt den letzten ${spieler.position} nicht ab.` };
  }
  if (verkaeufer && satt(verkaeufer) && !spieler.transferliste) {
    return { fehler: `${verkaeufer.name} muss nicht verkaufen und gibt ${spieler.name} nicht ab.` };
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
  welt.buchen(kaeufer, 'transfers', -abloese, `${spieler.name} ${verkaeufer ? `von ${verkaeufer.name}` : '(ablösefrei)'}`);
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
 * `wartet` sind die Vereine, deren Angebot noch gilt: sie bieten nicht neu.
 * @param {Set<number>} [wartet]
 */
function kiAngebote(welt, mensch, zufall, wartet = new Set()) {
  const angebote = [];
  for (const verein of welt.vereine) {
    if (verein.id === mensch.id) continue;
    if (verein.spieler.length >= KADER_MAX) continue;
    if (wartet.has(verein.id)) continue;
    const aufListe = mensch.spieler.filter((s) => s.transferliste);
    const wurf = zufall();
    const liste = aufListe.length > 0 && wurf <= ANGEBOTE.liste;
    if (!liste && wurf > ANGEBOTE.sonst) continue;

    const kandidaten = mensch.spieler
      .filter((s) => liste || !s.transferliste)
      .filter((s) => bestandNachAbgang(mensch, s) >= MINDESTBESTAND[s.position])
      .filter((s) => vertraege.wechselbereit(s, verein).ok && !s.karriereende)
      .filter((s) => s.staerke > schwaechsterStamm(verein, s.position) + (s.transferliste ? -2 : 3))
      .sort((a, b) => Number(Boolean(b.transferliste)) - Number(Boolean(a.transferliste)) || b.staerke - a.staerke);
    const wunsch = kandidaten[0];
    if (!wunsch) continue;

    const faktor = wunsch.transferliste ? 0.8 + zufall() * 0.3 : 0.95 + zufall() * 0.4;
    const gebot = Math.round(marktwert(wunsch) * faktor);
    if (gebot > verein.konto * 0.7) continue;
    // Dieselbe Gehaltsgrenze wie beim eigenen Holen (besterZugang) - sonst
    // boten Vereine, die das Gehalt nie haetten zahlen koennen.
    const summe = gehaltssumme(verein);
    const grenze = gehaltsgrenze(verein);
    if (summe + vertraege.gehaltswunsch(wunsch) > grenze) continue;
    const umsonst = welt.freie.some((s) => s.position === wunsch.position && !s.karriereende
      && s.alter <= ALTERSBLICK.freieBis && s.staerke >= wunsch.staerke - MARKT.freiNaeher
      && vertraege.wechselbereit(s, verein).ok && summe + vertraege.gehaltswunsch(s) <= grenze);
    if (umsonst) continue;
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
 * Wen ein Verein der KI fuer eine Position holen wuerde: der Vereinslose oder
 * der Spieler eines anderen Vereins mit der meisten Staerke fuers Geld - oder
 * niemand. Wer unter dem Mindestbestand steht und sich keinen leisten kann,
 * nimmt den billigsten Vereinslosen - ueber der Gehaltsgrenze und mit leerem
 * Konto.
 */
function besterZugang(welt, verein, position, loch) {
  const schwelle = loch ? 0 : schwaechsterStamm(verein, position) + 3;
  const summe = gehaltssumme(verein);
  const budget = verein.konto - summe * 0.3;
  const grenze = gehaltsgrenze(verein);
  // Eine Verstaerkung ersetzt den Schwaechsten der Position: sein Gehalt
  // zaehlt als frei. Steht der Verein danach ueber der Grenze, geht er
  // (kiTransfers). Ohne das sperrte die Grenze jede Verstaerkung eines
  // Vereins, der an ihr steht - und das sind nach Schritt 2 fast alle.
  const tausch = loch ? null : verein.spieler
    .filter((s) => s.position === position)
    .sort((a, b) => a.staerke - b.staerke)[0] || null;
  const belastet = summe - (tausch?.vertrag?.gehalt || 0);

  const kandidaten = [];
  const not = verein.spieler.filter((s) => s.position === position).length < MINDESTBESTAND[position];
  let notnagel = null;
  for (const spieler of welt.freie) {
    // Wer zum Saisonende aufhoert, wird nicht mehr geholt.
    if (spieler.position !== position || spieler.staerke < schwelle || spieler.alter > ALTERSBLICK.freieBis || spieler.karriereende) continue;
    if (!vertraege.wechselbereit(spieler, verein).ok) continue;
    const gehalt = vertraege.gehaltswunsch(spieler);
    if ((verein.konto < gehalt || belastet + gehalt > grenze) && !(loch && gehalt <= HAUSHALT.lochGehalt)) {
      if (not && (!notnagel || gehalt < vertraege.gehaltswunsch(notnagel))) notnagel = spieler;
      continue;
    }
    kandidaten.push({ spieler, verkaeufer: null, preis: 0 });
  }
  if (budget > 0) {
    for (const anderer of welt.vereine) {
      if (anderer === verein || welt.menschFuehrt(anderer.id) || anderer.spieler.length <= 18) continue;
      const gibtAb = !satt(anderer);
      for (const spieler of anderer.spieler) {
        // Wer auf der Liste steht, muss nur besser sein als der Schwaechste
        // der Stammelf.
        const liste = Boolean(spieler.transferliste);
        if (!gibtAb && !liste) continue;
        if (spieler.position !== position || spieler.alter > ALTERSBLICK.andereBis || spieler.karriereende) continue;
        if (spieler.staerke < Math.max(liste ? schwelle - 3 : schwelle, 1)) continue;
        if (bestandNachAbgang(anderer, spieler) < MINDESTBESTAND[position]) continue;
        if (!vertraege.wechselbereit(spieler, verein).ok) continue;
        if (belastet + vertraege.gehaltswunsch(spieler) > grenze) continue;
        const preis = forderung(anderer, spieler, welt.saison);
        if (preis > budget) continue;
        kandidaten.push({ spieler, verkaeufer: anderer, preis });
      }
    }
  }
  if (!kandidaten.length && notnagel) kandidaten.push({ spieler: notnagel, verkaeufer: null, preis: 0 });
  // Die meiste Staerke fuers Geld: ein Punkt Staerke ist viel wert, eine
  // Million auch.
  return kandidaten
    .map((k) => ({ ...k, nutzen: k.spieler.staerke - k.preis / 1500
        - ALTERSBLICK.nutzenJe * Math.max(0, k.spieler.alter - ALTERSBLICK.nutzenAb), tausch }))
    .sort((a, b) => b.nutzen - a.nutzen)[0] || null;
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
    .filter((v) => !welt.menschFuehrt(v.id))
    .map((v) => ({ v, los: zufall() }))
    .sort((a, b) => a.los - b.los)
    .map(({ v }) => v);

  for (const verein of reihenfolge) {
    const loecher = POSITIONEN.filter((p) => verein.spieler.filter((s) => s.position === p).length < KADERPLAN[p]);
    // Ein reicher Verein sucht in jedem Fenster (MARKT.reichAb).
    if (!loecher.length && !(verein.konto > MARKT.reichAb * finanzen.erwarteteEinnahmen(verein)) && zufall() > verstaerkung) continue;

    // Ein Loch, fuer das niemand zu haben ist - meist im Tor, Vereinslose
    // Torhueter sind selten -, sperrt die anderen nicht: sonst schrumpfte ein
    // Kader auf den Mindestbestand.
    const vereinsniveau = niveau(verein);
    const positionen = loecher.length ? loecher : [POSITIONEN
      .map((p) => ({ p, luecke: vereinsniveau - schwaechsterStamm(verein, p) }))
      .sort((a, b) => b.luecke - a.luecke)[0].p];
    let bester = null;
    let position = null;
    for (const p of positionen) {
      bester = besterZugang(welt, verein, p, loecher.length > 0);
      position = p;
      if (bester) break;
    }
    if (!bester) continue;
    const laufzeit = Math.min(vertraege.laufzeitMax(bester.spieler), bester.spieler.alter <= 26 ? 3 : 2);
    wechseln(welt, {
      kaeufer: verein, verkaeufer: bester.verkaeufer, spieler: bester.spieler, abloese: bester.preis, laufzeit,
    });
    wechsel.push(welt.ticker[0]);
    // Der Ersetzte geht, wenn das Gehalt sonst ueber der Grenze laege.
    const ersetzt = bester.tausch;
    if (ersetzt && verein.spieler.includes(ersetzt) && gehaltssumme(verein) > gehaltsgrenze(verein)
      && bestandNachAbgang(verein, ersetzt) >= MINDESTBESTAND[position]) {
      welt.buchen(verein, 'abfindungen', -vertraege.abfindung(ersetzt, welt.saison), `Abfindung für ${ersetzt.name}`);
      freistellen(welt, verein, ersetzt);
    }

    // Wer ueber sein Ziel waechst, gibt den Schwaechsten dieser Position ab.
    if (verein.spieler.length > KI_KADER_ZIEL) {
      const weg = verein.spieler
        .filter((s) => s.position === position && s !== bester.spieler)
        .sort((a, b) => a.staerke - b.staerke)[0];
      if (weg && bestandNachAbgang(verein, weg) >= MINDESTBESTAND[position]) {
        welt.buchen(verein, 'abfindungen', -vertraege.abfindung(weg, welt.saison), `Abfindung für ${weg.name}`);
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
    if (welt.menschFuehrt(verein.id)) continue;
    const vereinsniveau = niveau(verein);
    // Wer im Minus steht, behaelt nur, wen er wirklich braucht.
    const klamm = verein.konto < 0;
    const knapp = verein.konto < ALTERSBLICK.aelterRuecklage * finanzen.erwarteteEinnahmen(verein);
    const bleiben = verein.spieler.filter((s) => s.vertrag && s.vertrag.bis > welt.saison).length;
    const wert = (s) => s.staerke - Math.max(0, s.alter - ALTERSBLICK.wertAb) * ALTERSBLICK.wertJe;
    const kandidaten = verein.spieler
      .filter((s) => s.vertrag && s.vertrag.bis <= welt.saison)
      .filter((s) => (s.alter <= 30 && s.staerke >= vereinsniveau - (klamm ? 4 : 12))
        || (!knapp && s.alter <= ALTERSBLICK.aelterBis && s.staerke >= vereinsniveau - ALTERSBLICK.aelterUnterNiveau)
        || (!klamm && s.jugend && s.alter <= 21))
      .sort((a, b) => wert(b) - wert(a));
    // Platz lassen fuer zwei aus der Jugend - sonst waechst der Kader Jahr um Jahr.
    const platz = Math.max(0, KI_KADER_ZIEL - 2 - bleiben);
    // Ueber der Gehaltsgrenze wird nicht verlaengert; der Naechste, der passt, kommt dran.
    const grenze = gehaltsgrenze(verein);
    let summe = verein.spieler.filter((s) => s.vertrag && s.vertrag.bis > welt.saison).reduce((a, s) => a + s.vertrag.gehalt, 0);
    let verlaengert = 0;
    for (const spieler of kandidaten) {
      if (verlaengert >= platz) break;
      const gehalt = vertraege.gehaltswunsch(spieler);
      // Faellt die Position sonst unter den Mindestbestand, wird ein Billiger
      // auch ueber der Grenze verlaengert - wie ein Loch in besterZugang
      // gestopft wird. Sonst ging der Jugendspieler fuer 100 und kam ein
      // Vereinsloser fuer 800 als Notnagel: die Gehaelter blieben ueber der
      // Grenze, und ein Verein der Liga 2 stand nach 20 Saisons bei -24 Mio
      // (Startwert 2026, Schritt 4).
      const bleibtDort = verein.spieler
        .filter((s) => s.position === spieler.position && s.vertrag && s.vertrag.bis > welt.saison).length;
      const loch = bleibtDort < MINDESTBESTAND[spieler.position] && gehalt <= HAUSHALT.lochGehalt;
      if (summe + gehalt > grenze && !loch) continue;
      const laufzeit = Math.min(vertraege.laufzeitMax(spieler), 1 + Math.floor(zufall() * 3));
      spieler.vertrag = { bis: welt.saison + laufzeit, gehalt };
      summe += gehalt;
      verlaengert += 1;
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
    if (welt.menschFuehrt(verein.id)) continue;
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
  KI_KADER_ZIEL, HAUSHALT, MARKT, ANGEBOTE, gehaltsgrenze, satt,
  wichtigkeit, forderung, bestandNachAbgang, schwaechsterStamm, finden,
  marktliste, kaufPruefen, wechseln, freistellen, kiAngebote, besterZugang, kiTransfers, kiVertraege, kiSparen,
};
