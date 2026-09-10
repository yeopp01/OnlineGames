'use strict';

// Geld: Zuschauer, Fernsehen, Sponsor, Gehaelter, Stadion, Zinsen, Praemien.
// Alle Betraege in Tausend.
const { TERMINE_JE_SAISON } = require('./kalender');
const { EINTRITT } = require('./kader');
const { eines } = require('./zufall');

// Fernsehgeld je Ligaspiel fuer einen Verein aus der Mitte der Tabelle. Wer
// in der Vorsaison oben stand, bekommt mehr (bis 1,4-fach), wer unten stand,
// weniger (bis 0,6-fach).
const FERNSEHGELD = { 1: 150, 2: 105 };
const REFERENZPREIS = EINTRITT;
const PREIS_MIN = 5;
const PREIS_MAX = 80;
const ZINS_JE_TERMIN = 0.003;
const PUNKTABZUG_GRENZE = -3000;
const PUNKTABZUG = 6;
const PLAETZE_MAX = 75000;
const SAISONPRAEMIE = { 1: 6000, 2: 1500 };
const MEISTERPRAEMIE = { 1: 3000, 2: 1500 };
const AUSBAU = [
  { stufe: 1, plaetze: 2500, kosten: 2500, termine: 3 },
  { stufe: 2, plaetze: 5000, kosten: 5500, termine: 6 },
  { stufe: 3, plaetze: 10000, kosten: 12000, termine: 10 },
];
const SPONSOREN = [
  'Nordlicht Energie', 'Brauhaus Kessler', 'Baumarkt Keller', 'Autohaus Brenner', 'Sparkasse am Fluss',
  'Moebel Wendt', 'Stahlwerk Obermann', 'Fruchtsaft Anders', 'Versicherung Treu', 'Reisebuero Sonne',
  'Kaffeeroesterei Adler', 'Spedition Lange', 'Elektro Faber', 'Stadtwerke', 'Landmolkerei',
];

/**
 * Wie voll das Stadion wird. Ruf und Tabellenplatz ziehen, ein hoher Preis
 * haelt ab, ein reizvoller Gegner lockt. Gedeckelt bei ausverkauft.
 *
 * @param {object} verein  Gastgeber
 * @param {object} [umstaende]  { stimmung 0..1, gegner, pokal }
 */
function auslastung(verein, { stimmung = 0.5, gegner = null, pokal = false } = {}) {
  const basis = 0.5 + verein.reputation / 250;
  const preis = (REFERENZPREIS[verein.liga] / verein.eintritt) ** 0.6;
  const form = 0.85 + 0.3 * stimmung;
  const reiz = gegner ? 1 + Math.max(-0.05, Math.min(0.15, (gegner.reputation - verein.reputation) / 200)) : 1;
  return Math.max(0.15, Math.min(1, basis * preis * form * reiz * (pokal ? 1.05 : 1)));
}

function heimspiel(verein, zufall, umstaende) {
  const zuschauer = Math.min(verein.stadion.plaetze, Math.round(verein.stadion.plaetze * auslastung(verein, umstaende) * (0.95 + zufall() * 0.1)));
  return { zuschauer, einnahmen: Math.round((zuschauer * verein.eintritt) / 1000) };
}

/** Gehaelter eines Termins: die Jahresgehaelter, verteilt auf alle Termine. */
function gehaelter(verein) {
  return Math.round(verein.spieler.reduce((s, x) => s + (x.vertrag?.gehalt || 0), 0) / TERMINE_JE_SAISON);
}

/** Dispozinsen auf ein Minus - ein Guthaben bringt nichts. */
function zinsen(verein) {
  return verein.konto < 0 ? Math.round(verein.konto * ZINS_JE_TERMIN) : 0;
}

/**
 * Drei Angebote fuer die Saison: sicher, ausgewogen, erfolgsabhaengig. Mehr
 * Ruf und die erste Liga bringen mehr Geld.
 */
function sponsorAngebote(verein, zufall, saison) {
  const basis = verein.liga === 1 ? 75 + verein.reputation * 1.9 : 50 + verein.reputation * 1.3;
  const arten = [
    { art: 'sicher', jeSpiel: 1.15, jeSieg: 0.4 },
    { art: 'ausgewogen', jeSpiel: 1.0, jeSieg: 1.0 },
    { art: 'erfolg', jeSpiel: 0.75, jeSieg: 1.8 },
  ];
  return arten.map((a, i) => ({
    id: `s${saison}-${i + 1}`,
    name: eines(zufall, SPONSOREN),
    art: a.art,
    jeSpiel: Math.round(basis * a.jeSpiel * (0.95 + zufall() * 0.1)),
    jeSieg: Math.round(basis * 0.5 * a.jeSieg),
  }));
}

/** Fernsehgeld fuer ein Ligaspiel, nach Liga und Rang der Vorsaison. */
function fernsehgeld(verein) {
  return Math.round(FERNSEHGELD[verein.liga] * (1.4 - (0.8 * (Math.min(18, verein.tvRang) - 1)) / 17));
}

/** Darf gebaut werden? Gibt den Plan zurueck - bezahlt wird beim Aufrufer, damit es im Buch steht. */
function ausbauPruefen(verein, stufe) {
  const plan = AUSBAU.find((a) => a.stufe === stufe);
  if (!plan) return { fehler: 'Diese Ausbaustufe gibt es nicht.' };
  if (verein.stadion.ausbau) return { fehler: 'Es wird schon gebaut.' };
  if (verein.stadion.plaetze + plan.plaetze > PLAETZE_MAX) return { fehler: `Mehr als ${PLAETZE_MAX.toLocaleString('de-DE')} Plaetze genehmigt die Stadt nicht.` };
  if (verein.konto < plan.kosten) return { fehler: 'Fuer den Ausbau reicht das Geld nicht.' };
  return { ok: true, ...plan };
}

/** Ein Termin Bauzeit. Gibt die neuen Plaetze zurueck, wenn der Bau fertig ist. */
function ausbauWeiter(verein) {
  const bau = verein.stadion.ausbau;
  if (!bau) return 0;
  bau.rest -= 1;
  if (bau.rest > 0) return 0;
  verein.stadion.plaetze += bau.plaetze;
  verein.stadion.ausbau = null;
  return bau.plaetze;
}

function eintrittPruefen(preis) {
  if (!Number.isFinite(preis)) return null;
  return Math.min(PREIS_MAX, Math.max(PREIS_MIN, Math.round(preis)));
}

/** Praemie am Saisonende nach Liga und Platz, der Meister bekommt einen Zuschlag. */
function saisonpraemie(liga, platz, anzahl = 18) {
  return Math.round(SAISONPRAEMIE[liga] * ((anzahl + 1 - platz) / anzahl)) + (platz === 1 ? MEISTERPRAEMIE[liga] : 0);
}

module.exports = {
  FERNSEHGELD, REFERENZPREIS, PREIS_MIN, PREIS_MAX, ZINS_JE_TERMIN, PUNKTABZUG_GRENZE, PUNKTABZUG,
  PLAETZE_MAX, AUSBAU, SAISONPRAEMIE, MEISTERPRAEMIE,
  auslastung, heimspiel, gehaelter, zinsen, sponsorAngebote, fernsehgeld, ausbauPruefen, ausbauWeiter,
  eintrittPruefen, saisonpraemie,
};
