'use strict';

// Der Vorstand: er setzt vor jeder Saison ein Ziel und misst den Manager
// daran. Sinkt sein Vertrauen zu tief, ist der Manager entlassen - und bekommt
// Angebote von Vereinen, die gerade einen suchen.
const { niveau } = require('./kader');

const VERTRAUEN_START = 60;
const VERTRAUEN_NEU = 55;
const ENTLASSUNG_UNTER = 15;
const SCHONFRIST = 8;

const ZIELE = {
  1: [
    { bis: 2, art: 'titel', text: 'Um die Meisterschaft spielen', platz: 3 },
    { bis: 6, art: 'oben', text: 'Obere Tabellenregion', platz: 6 },
    { bis: 12, art: 'mittelfeld', text: 'Gesichertes Mittelfeld', platz: 12 },
    { bis: 18, art: 'klassenerhalt', text: 'Klassenerhalt', platz: 15 },
  ],
  2: [
    { bis: 3, art: 'aufstieg', text: 'Aufstieg', platz: 3 },
    { bis: 8, art: 'oben', text: 'Obere Tabellenregion', platz: 8 },
    { bis: 14, art: 'mittelfeld', text: 'Gesichertes Mittelfeld', platz: 14 },
    { bis: 18, art: 'klassenerhalt', text: 'Klassenerhalt', platz: 15 },
  ],
};

/** Wo der Verein nach seinem Kader in der eigenen Liga steht. */
function erwarteterRang(vereine, verein) {
  const liga = vereine.filter((v) => v.liga === verein.liga).sort((a, b) => niveau(b) - niveau(a));
  return liga.findIndex((v) => v.id === verein.id) + 1;
}

function saisonziel(vereine, verein) {
  const rang = erwarteterRang(vereine, verein);
  const ziel = ZIELE[verein.liga].find((z) => rang <= z.bis);
  return { art: ziel.art, text: ziel.text, platz: ziel.platz, rang };
}

const begrenzt = (wert) => Math.round(Math.min(100, Math.max(0, wert)) * 10) / 10;

/**
 * Vertrauen nach einem Liga-Spieltag: das Ergebnis zaehlt, und je laenger die
 * Saison, desto mehr zaehlt der Abstand zum Ziel.
 */
function nachLigaspiel(vorstand, { ergebnis, platz, spieltag, gegnerStaerker }) {
  let delta = ergebnis === 'sieg' ? 1.5 : ergebnis === 'niederlage' ? (gegnerStaerker ? -0.7 : -1.5) : 0;
  delta += (vorstand.ziel.platz - platz) * 0.08 * Math.min(1, spieltag / 10);
  vorstand.vertrauen = begrenzt(vorstand.vertrauen + delta);
  return delta;
}

/** Vertrauen nach einer Pokalrunde: Weiterkommen freut, das Aus gegen Kleinere aergert. */
function nachPokalspiel(vorstand, { weiter, gegnerLigaTiefer, finaleGewonnen }) {
  let delta = weiter ? 1 : gegnerLigaTiefer ? -4 : -1;
  if (finaleGewonnen) delta += 8;
  vorstand.vertrauen = begrenzt(vorstand.vertrauen + delta);
  return delta;
}

/** Ein tiefes Minus kostet jeden Termin ein wenig Vertrauen. */
function nachKasse(vorstand, konto) {
  if (konto >= -2000) return 0;
  vorstand.vertrauen = begrenzt(vorstand.vertrauen - 1);
  return -1;
}

/** Nicht vor dem achten Spieltag - ein Fehlstart ist noch keine Saison. */
function entlassen(vorstand, spieltag) {
  return spieltag >= SCHONFRIST && vorstand.vertrauen < ENTLASSUNG_UNTER;
}

/** Am Saisonende: Ziel erreicht bringt Vertrauen, jeder Platz daneben kostet. */
function saisonbilanz(vorstand, platz) {
  const erreicht = platz <= vorstand.ziel.platz;
  const delta = erreicht ? 15 : -(platz - vorstand.ziel.platz) * 3;
  vorstand.vertrauen = begrenzt(vorstand.vertrauen + delta);
  return { erreicht, delta, entlassen: !erreicht && vorstand.vertrauen < 35 };
}

/**
 * Drei Vereine, die einen Manager suchen - nach einer Entlassung eher
 * kleinere als der alte Verein. Aus den acht, die im Niveau knapp darunter
 * liegen, wird gelost; wer den schwaechsten Verein der Welt hatte, bekommt
 * die naechststaerkeren. Leer ist die Liste nie.
 */
function stellenangebote(vereine, frueher, zufall) {
  const eigenes = niveau(frueher);
  const andere = vereine.filter((v) => v.id !== frueher.id);
  const darunter = andere.filter((v) => niveau(v) < eigenes).sort((a, b) => niveau(b) - niveau(a));
  const darueber = andere.filter((v) => niveau(v) >= eigenes).sort((a, b) => niveau(a) - niveau(b));
  return [...darunter.slice(0, 8), ...darueber.slice(0, Math.max(0, 3 - darunter.length))]
    .map((v) => ({ v }))
    .map(({ v }) => ({ v, los: zufall() }))
    .sort((a, b) => a.los - b.los)
    .slice(0, 3)
    .map(({ v }) => v.id);
}

module.exports = {
  VERTRAUEN_START, VERTRAUEN_NEU, ENTLASSUNG_UNTER, SCHONFRIST, ZIELE,
  erwarteterRang, saisonziel, nachLigaspiel, nachPokalspiel, nachKasse, entlassen, saisonbilanz, stellenangebote,
};
