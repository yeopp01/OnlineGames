// Messen am Managerspiel ohne Menschen - die eine Stelle, aus der
// `npm run manager:messen` (Kennzahlen) und tests/manager-gleichstand.test.mjs
// (Fingerabdruck) lesen (→ docs/manager/plan.md, M0.2).
//
// Die Begegnung wird beobachtet, BEVOR die Karriere sie laedt: ablauf.js
// holt sich `begegnung` beim Laden. Wer diese Datei einbindet, darf
// karriere.js vorher nicht geladen haben.
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const spieltag = require('../server/spiele/manager/spieltag.js');
const kader = require('../server/spiele/manager/kader.js');

let beobachtet = null;
const echt = spieltag.begegnung;
spieltag.begegnung = (heim, gast, ...rest) => {
  const ergebnis = echt(heim, gast, ...rest);
  if (beobachtet) beobachtet.push({ ergebnis, niveau: [kader.niveau(heim), kader.niveau(gast)] });
  return ergebnis;
};
const { Karriere } = require('../server/spiele/manager/karriere.js');

/**
 * Was am Spielstand dem Menschen gehoert. Alles andere ist die Welt.
 * Ab Fassung 4 (M0.4) stehen diese Felder je Manager in `manager[]`; der
 * Fingerabdruck soll den Umbau ueberstehen, deshalb liest `teile()` beide.
 */
export const MENSCHENFELDER = [
  'name', 'vereinId', 'status', 'stellen', 'vorstand', 'sponsorAngebote', 'angebote',
  'nachrichten', 'buch', 'kasse', 'vorjahr', 'zuletzt', 'entwicklungen',
];

/** Teilt einen gesicherten Stand in Welt und Mensch, unabhaengig von der Fassung. */
export function teile(stand) {
  const welt = { ...stand };
  delete welt.fassung;
  let mensch;
  if (Array.isArray(stand.manager)) {
    delete welt.manager;
    mensch = stand.manager[0] ? { ...stand.manager[0] } : {};
    delete mensch.managerId;
  } else {
    mensch = {};
    for (const feld of MENSCHENFELDER) {
      if (feld in welt) mensch[feld] = welt[feld];
      delete welt[feld];
    }
  }
  return { welt, mensch };
}

/** JSON mit sortierten Schluesseln: Reihenfolge der Felder zaehlt nicht, Reihenfolge in Listen schon. */
function geordnet(wert) {
  if (Array.isArray(wert)) return `[${wert.map(geordnet).join(',')}]`;
  if (wert && typeof wert === 'object') {
    return `{${Object.keys(wert).sort().filter((k) => wert[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${geordnet(wert[k])}`).join(',')}}`;
  }
  return JSON.stringify(wert);
}

export const fingerabdruck = (wert) => createHash('sha256').update(geordnet(wert)).digest('hex').slice(0, 16);

/**
 * Laesst eine Karriere laufen.
 * @param {{ startwert: number, termine?: number, saisons?: number, vereinId?: string|null }} p
 *   `termine` zaehlt Schritte von `weiter()`, `saisons` ganze Saisons - eines von beiden.
 */
export function laufen({ startwert, termine, saisons, vereinId = null }) {
  const k = Karriere.neu({ startwert, vereinId, name: 'Messung' });
  beobachtet = [];
  const beginn = performance.now();
  if (saisons) {
    const ende = k.saison + saisons;
    while (k.saison < ende) {
      const r = k.weiter();
      if (!r.ok) throw new Error(`weiter() abgewiesen in Saison ${k.saison}: ${r.fehler}`);
    }
  } else {
    for (let i = 0; i < termine; i++) {
      const r = k.weiter();
      if (!r.ok) throw new Error(`weiter() abgewiesen nach ${i} Terminen: ${r.fehler}`);
    }
  }
  const ms = performance.now() - beginn;
  const spiele = beobachtet;
  beobachtet = null;
  return { karriere: k, spiele, ms };
}

/** Die Kennzahlen eines Laufs - dieselben, die CLAUDE.md fuer das Managerspiel nennt. */
export function kennzahlen({ karriere: k, spiele, ms }, saisons) {
  const n = spiele.length;
  const zaehle = (pruefen) => spiele.filter(pruefen).length;
  const ereignisse = (art) => spiele.reduce((s, { ergebnis }) => s + ergebnis.ereignisse.filter((x) => x.art === art).length, 0);
  const mitFavorit = spiele.filter(({ niveau }) => Math.abs(niveau[0] - niveau[1]) >= 0.5);
  // Favorit ist, wer mindestens einen halben Punkt Niveau mehr hat - jede
  // Paarung der Saison, nicht nur Oben gegen Unten (das misst spieltag AC-3).
  const favoritGewinnt = mitFavorit.filter(({ ergebnis, niveau }) => {
    const favorit = niveau[0] > niveau[1] ? ergebnis.heim : ergebnis.gast;
    return ergebnis.sieger === favorit;
  }).length;
  const mitFavoritEntschieden = mitFavorit.filter(({ ergebnis }) => ergebnis.tore[0] !== ergebnis.tore[1]).length;
  const ligaEins = k.vereine.filter((v) => v.liga === 1);
  return {
    spiele: n,
    toreJeSpiel: spiele.reduce((s, { ergebnis }) => s + ergebnis.tore[0] + ergebnis.tore[1], 0) / n,
    heimsiege: zaehle(({ ergebnis }) => ergebnis.tore[0] > ergebnis.tore[1]) / n,
    unentschieden: zaehle(({ ergebnis }) => ergebnis.tore[0] === ergebnis.tore[1]) / n,
    favoritGewinnt: favoritGewinnt / mitFavorit.length,
    favoritGewinntEntschieden: favoritGewinnt / mitFavoritEntschieden,
    gelbJeSpiel: (ereignisse('gelb') + ereignisse('gelbrot')) / n,
    platzverweiseJeSpiel: (ereignisse('rot') + ereignisse('gelbrot')) / n,
    wechselJeSpiel: ereignisse('wechsel') / n,
    verletzungenJeSpiel: ereignisse('verletzung') / n,
    staerkeErsteLiga: ligaEins.reduce((s, v) => s + kader.niveau(v), 0) / ligaEins.length,
    kaderMin: Math.min(...k.vereine.map((v) => v.spieler.length)),
    kaderMax: Math.max(...k.vereine.map((v) => v.spieler.length)),
    vereinslose: k.freie.length,
    kontoErsteLiga: ligaEins.reduce((s, v) => s + v.konto, 0) / ligaEins.length,
    msJeSaison: saisons ? ms / saisons : null,
    spielstandKB: Buffer.byteLength(JSON.stringify(k.sichern())) / 1024,
  };
}

/**
 * Die Laeufe der Gleichstandsprobe. Ohne Menschen zwei Saisons, mit einem
 * Menschen, der nichts tut, bis zur Winterpause - je Startwert.
 */
export const GLEICHSTAND = {
  startwerte: [4711, 20260910, 77],
  ohneMenschen: { saisons: 2 },
  mitMensch: { vereinId: 'v5', termine: 21 },
};

/** Die Fingerabdruecke der Gleichstandsprobe, je Lauf Welt und Mensch. */
export function gleichstandRechnen() {
  const ergebnis = {};
  for (const startwert of GLEICHSTAND.startwerte) {
    for (const [name, lauf] of Object.entries({ ohneMenschen: GLEICHSTAND.ohneMenschen, mitMensch: GLEICHSTAND.mitMensch })) {
      const { karriere } = laufen({ startwert, ...lauf });
      const { welt, mensch } = teile(karriere.sichern());
      ergebnis[`${name} ${startwert}`] = { welt: fingerabdruck(welt), mensch: fingerabdruck(mensch) };
    }
  }
  return ergebnis;
}
