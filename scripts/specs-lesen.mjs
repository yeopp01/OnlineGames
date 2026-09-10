// Eine Stelle, an der gelesen wird: Specs, Testnamen, Bildnachweise und die
// Liste der Kriterien, die kein Bild brauchen. Board, Belegpruefung und
// Bericht haengen daran - sonst zaehlen drei Skripte dasselbe
// unterschiedlich (→ docs/adr/0011-bildnachweise.md).
//
// Zeilenformat eines Abnahmekriteriums (→ specs/README.md):
//   - **AC-7** `fertig` **Kurztitel** — Was gelten muss.
//   - **AC-8** `zurueckgestellt` (Grund) **Kurztitel** — Was gelten muss.
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SPECS = join(WURZEL, 'specs');
export const BILDER = join(WURZEL, 'qa', 'bildnachweise');
export const AUSNAHMEN = join(WURZEL, 'qa', 'ohne-bild.json');

// Wo Tests liegen, deren Name ein Kriterium belegen kann.
export const TESTORTE = [
  { ordner: join(WURZEL, 'tests'), endung: '.test.mjs' },
  { ordner: join(WURZEL, 'e2e', 'tests'), endung: '.spec.mjs' },
];

/** Status in ihrer Reihenfolge von "noch nichts" bis "fertig". */
export const STATUS = ['offen', 'geplant', 'in-arbeit', 'in-qa', 'fertig', 'zurueckgestellt'];
/** Reihenfolge im Board und in der Filterleiste - oben, was Aufmerksamkeit braucht. */
export const BOARDFOLGE = ['in-arbeit', 'in-qa', 'geplant', 'offen', 'zurueckgestellt', 'fertig'];
export const ANZEIGE = {
  'in-arbeit': 'In Arbeit',
  'in-qa': 'In QA',
  geplant: 'Geplant',
  offen: 'Offen',
  zurueckgestellt: 'Zurueckgestellt',
  fertig: 'Fertig',
};
export const KLEIN = {
  'in-arbeit': 'in Arbeit',
  'in-qa': 'in QA',
  geplant: 'geplant',
  offen: 'offen',
  zurueckgestellt: 'zurueckgestellt',
  fertig: 'fertig',
};
/** Status, bei denen ein vorhandener Bildnachweis ein Widerspruch waere. */
export const UNGEBAUT = new Set(['offen', 'geplant', 'zurueckgestellt']);

/** Der Kurztitel ist die Zeile im Board - er muss in eine Tabellenzeile passen. */
export const TITEL_WOERTER = 5;
export const TITEL_ZEICHEN = 44;

// Die Schreibweise vor ADR-0011. Gilt nur beim Blick in die Git-Historie,
// damit der Fortschritt alte Staende noch zaehlen kann.
const ALTE_SCHREIBWEISE = { 'in qa': 'in-qa', 'in arbeit': 'in-arbeit' };

const AC_ZEILE = /^\s*-\s+\*\*(AC-(\d+))\*\*\s+(.*)$/;
const MARKER = /^`([^`]+)`\s*(.*)$/;
const GRUND = /^\((.+?)\)\s*(.*)$/;
const TITEL = /^\*\*(.+?)\*\*\s*(?:[—-]\s*)?(.*)$/;

export const pfadNetz = (pfad) => pfad.split(sep).join('/');

/** Alle Dateien mit dieser Endung unterhalb von `ordner`, sortiert. */
export async function dateien(ordner, endung) {
  if (!existsSync(ordner)) return [];
  const gefunden = [];
  for (const eintrag of await readdir(ordner, { withFileTypes: true })) {
    if (eintrag.name === 'node_modules') continue;
    const pfad = join(ordner, eintrag.name);
    if (eintrag.isDirectory()) gefunden.push(...(await dateien(pfad, endung)));
    else if (eintrag.name.endsWith(endung)) gefunden.push(pfad);
  }
  return gefunden.sort((a, b) => a.localeCompare(b));
}

/**
 * Liest eine Spec aus ihrem Text. Rein - kein Dateizugriff, damit derselbe
 * Leser auch Staende aus der Git-Historie lesen kann.
 *
 * @param {string} inhalt
 * @param {string} wo  Fuer Fehlermeldungen, etwa "specs/15-manager/kader.md"
 * @param {{ nachsichtig?: boolean }} [optionen]  alte Schreibweise annehmen
 */
export function specLesen(inhalt, wo = 'Spec', { nachsichtig = false } = {}) {
  const zeilen = inhalt.split(/\r?\n/);
  const kopf = (name) => inhalt.match(new RegExp(`^\\*\\*${name}:\\*\\*\\s+(.+?)\\s*$`, 'm'))?.[1] ?? null;
  const titel = zeilen.find((z) => z.startsWith('# '))?.slice(2).trim() ?? 'Ohne Titel';
  const kuerzel = kopf('Kuerzel');
  const kriterien = [];
  const fehler = [];
  if (!kuerzel) fehler.push(`${wo}: ohne Zeile "**Kuerzel:** ..." - darueber ordnet die Belegpruefung Tests zu.`);

  const gesehen = new Set();
  let gruppe = '';
  let letztes = null;

  for (const zeile of zeilen) {
    const ueberschrift = zeile.match(/^#{2,4}\s+(.*)$/);
    if (ueberschrift) {
      // "### Zugang" benennt eine Gruppe, "## Abnahmekriterien" nicht.
      gruppe = /^Abnahmekriterien/i.test(ueberschrift[1]) ? '' : ueberschrift[1].trim();
      letztes = null;
      continue;
    }
    // Fortsetzungszeile: eingerueckt, kein neuer Punkt.
    if (letztes && /^\s{2,}\S/.test(zeile) && !/^\s*-\s/.test(zeile)) {
      letztes.text = `${letztes.text} ${zeile.trim()}`.trim();
      continue;
    }
    const treffer = zeile.match(AC_ZEILE);
    if (!treffer) {
      letztes = null;
      continue;
    }

    const [, id, zahl, rest] = treffer;
    const hier = `${wo} ${id}`;
    const marker = rest.match(MARKER);
    if (!marker) {
      fehler.push(`${hier}: ohne Status. Erwartet einen aus: ${STATUS.join(', ')}.`);
      letztes = null;
      continue;
    }
    let status = marker[1];
    if (nachsichtig && ALTE_SCHREIBWEISE[status]) status = ALTE_SCHREIBWEISE[status];
    let text = marker[2];
    let grund = '';
    const begruendet = text.match(GRUND);
    if (begruendet) {
      grund = begruendet[1].trim();
      text = begruendet[2];
    }
    let kurz = '';
    const benannt = text.match(TITEL);
    if (benannt) {
      kurz = benannt[1].trim();
      text = benannt[2];
    }

    if (!STATUS.includes(status)) {
      fehler.push(`${hier}: unbekannter Status "${status}". Erlaubt: ${STATUS.join(', ')}.`);
    }
    if (status === 'zurueckgestellt' && !grund) {
      fehler.push(`${hier}: zurueckgestellt ohne Grund - erwartet \`zurueckgestellt\` (Grund).`);
    }
    if (!kurz) {
      fehler.push(`${hier}: ohne Kurztitel - erwartet **Titel** vor der Anforderung.`);
    } else if (kurz.split(/\s+/).length > TITEL_WOERTER || kurz.length > TITEL_ZEICHEN) {
      fehler.push(
        `${hier}: Kurztitel zu lang ("${kurz}") - hoechstens ${TITEL_WOERTER} Woerter `
        + `und ${TITEL_ZEICHEN} Zeichen. Er ist die Zeile im Board.`,
      );
    }
    if (gesehen.has(id)) {
      fehler.push(`${hier}: die Nummer steht zweimal in derselben Spec. An ihr haengen Test und Bildnachweis.`);
    }
    gesehen.add(id);

    letztes = { id, zahl: Number(zahl), status, grund, titel: kurz, text: text.trim(), gruppe };
    kriterien.push(letztes);
  }

  return { titel, bereich: kopf('Bereich') ?? 'Ohne Bereich', kuerzel, stand: kopf('Stand') ?? '', kriterien, fehler };
}

/** Alle Specs unter specs/, sortiert nach Pfad. README und BOARD sind keine. */
export async function specsLesen() {
  const specs = [];
  for (const datei of await dateien(SPECS, '.md')) {
    const name = datei.split(sep).at(-1);
    if (name === 'README.md' || name === 'BOARD.md') continue;
    const pfad = pfadNetz(relative(SPECS, datei));
    const wo = `specs/${pfad}`;
    const inhalt = await readFile(datei, 'utf8');
    specs.push({ pfad, datei, wo, inhalt, ...specLesen(inhalt, wo) });
  }
  return specs;
}

export function zaehlen(kriterien) {
  const zahlen = Object.fromEntries(STATUS.map((s) => [s, 0]));
  for (const k of kriterien) if (k.status in zahlen) zahlen[k.status] += 1;
  return zahlen;
}

/** "24/25 fertig · 1 in QA" - so steht der Stand im Kopf jeder Spec. */
export function standzeile(zahlen) {
  const gesamt = Object.values(zahlen).reduce((a, b) => a + b, 0);
  if (!gesamt) return 'noch keine Kriterien';
  const rest = BOARDFOLGE
    .filter((s) => s !== 'fertig' && zahlen[s] > 0)
    .map((s) => `${zahlen[s]} ${KLEIN[s]}`);
  return [`${zahlen.fertig}/${gesamt} fertig`, ...rest].join(' · ');
}

// ------------------------------------------------------------------ Tests

// Der erste Zeichenketten-Wert von test(...), it(...), describe(...) und
// test.describe(...). Gezaehlt wird der NAME, nicht irgendeine Stelle im
// Quelltext - ein Kommentar, der ein Kriterium erwaehnt, belegt nichts.
const AUFRUF = /\b(?:test|it|describe)(?:\.describe)?\s*\(\s*(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g;
const LITERAL = /(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g;

/** Alle Testnamen aus tests/ und e2e/tests/, je mit ihrer Datei. */
export async function testnamen() {
  const namen = [];
  for (const { ordner, endung } of TESTORTE) {
    for (const datei of await dateien(ordner, endung)) {
      const inhalt = await readFile(datei, 'utf8');
      for (const treffer of inhalt.matchAll(AUFRUF)) {
        if (treffer[2].includes('${')) continue;
        namen.push({ datei: pfadNetz(relative(WURZEL, datei)), name: treffer[2] });
      }
    }
  }
  return namen;
}

/** Die Tests, deren Name "<kuerzel> AC-<n>" enthaelt. AC-7 ist nicht AC-70. */
export function belegeFuer(namen, kuerzel, id) {
  if (!kuerzel) return [];
  const muster = new RegExp(`(^|[^\\w-])${kuerzel}\\s+${id}(?![0-9])`, 'i');
  return namen.filter((n) => muster.test(n.name));
}

/** Alle Zeichenketten-Werte eines Quelltexts - fuer die Herkunftspruefung. */
export function literale(inhalt) {
  return new Set([...inhalt.matchAll(LITERAL)].map((t) => t[2]).filter((s) => !s.includes('${')));
}

// -------------------------------------------------------- Bildnachweise

/**
 * Specs, Bildnachweise und Ausnahmeliste zusammen, mit allen Fehlern der
 * Zuordnung. Was hier als Fehler steht, laesst Board und Bericht scheitern.
 */
export async function bestandLesen() {
  const specs = await specsLesen();
  const fehler = specs.flatMap((s) => s.fehler);
  const nachPfad = new Map(specs.map((s) => [s.pfad, s]));
  const kennt = (spec, ac) => nachPfad.get(spec)?.kriterien.some((k) => k.id === ac) ?? false;

  const nachweise = new Map();
  const quelltexte = new Map();
  for (const bezugsdatei of await dateien(BILDER, '.json')) {
    const rel = pfadNetz(relative(WURZEL, bezugsdatei));
    let bezug;
    try {
      bezug = JSON.parse(await readFile(bezugsdatei, 'utf8'));
    } catch (ursache) {
      fehler.push(`${rel}: kein lesbares JSON (${ursache.message}).`);
      continue;
    }
    const bild = bezugsdatei.replace(/\.json$/, '.png');
    if (!existsSync(bild)) {
      fehler.push(`${rel}: Bezugsdatei ohne Bild - ${rel.replace(/\.json$/, '.png')} fehlt.`);
      continue;
    }
    if (!nachPfad.has(bezug.spec)) {
      fehler.push(`${rel}: verweist auf specs/${bezug.spec} - diese Spec gibt es nicht.`);
      continue;
    }
    if (!kennt(bezug.spec, bezug.ac)) {
      fehler.push(`${rel}: verweist auf ${bezug.ac} in ${bezug.spec} - dieses Abnahmekriterium gibt es nicht.`);
      continue;
    }
    const herkunft = await herkunftPruefen(bezug, rel, quelltexte);
    if (herkunft) {
      fehler.push(herkunft);
      continue;
    }
    const schluessel = `${bezug.spec}#${bezug.ac}`;
    if (!nachweise.has(schluessel)) nachweise.set(schluessel, []);
    nachweise.get(schluessel).push({
      bild: pfadNetz(relative(WURZEL, bild)),
      titel: bezug.titel ?? '',
      datei: bezug.datei,
      pfad: bezug.pfad,
    });
  }
  for (const bild of await dateien(BILDER, '.png')) {
    if (!existsSync(bild.replace(/\.png$/, '.json'))) {
      fehler.push(`${pfadNetz(relative(WURZEL, bild))}: Bild ohne Bezugsdatei - ohne sie fehlt der Bezug zu einem Abnahmekriterium.`);
    }
  }

  const ausnahmen = new Map();
  if (existsSync(AUSNAHMEN)) {
    let roh = {};
    try {
      roh = JSON.parse(await readFile(AUSNAHMEN, 'utf8'));
    } catch (ursache) {
      fehler.push(`qa/ohne-bild.json: kein lesbares JSON (${ursache.message}).`);
    }
    for (const eintrag of roh.eintraege ?? []) {
      const schluessel = `${eintrag.spec}#${eintrag.ac}`;
      if (ausnahmen.has(schluessel)) {
        fehler.push(`qa/ohne-bild.json: ${schluessel} steht doppelt.`);
      } else if (!eintrag.begruendung?.trim()) {
        fehler.push(`qa/ohne-bild.json: ${schluessel} ohne Begruendung. Schweigen ist keine Antwort.`);
      } else if (!kennt(eintrag.spec, eintrag.ac)) {
        fehler.push(`qa/ohne-bild.json: ${schluessel} - dieses Kriterium gibt es nicht (verwaister Eintrag).`);
      } else {
        ausnahmen.set(schluessel, eintrag.begruendung.trim());
      }
    }
  }

  return { specs, nachweise, ausnahmen, fehler };
}

/**
 * Hat der Nachweis noch einen Erzeuger? Die Testdatei muss es geben, und
 * Beschreibung, Testname und Bildtitel muessen darin noch als ganze
 * Zeichenkette stehen. Sonst zeigt das Bild eine Oberflaeche, die kein Lauf
 * mehr erneuert - und sieht dabei aus wie eine Antwort.
 */
async function herkunftPruefen(bezug, rel, quelltexte) {
  if (!bezug.datei || !Array.isArray(bezug.pfad) || !bezug.pfad.length) {
    return `${rel}: ohne Herkunft ("datei", "pfad"). Bildnachweise entstehen ueber nachweis() im Test, nicht von Hand.`;
  }
  const voll = join(WURZEL, bezug.datei);
  if (!existsSync(voll)) {
    return `${rel}: nennt ${bezug.datei} als Erzeuger - die Datei gibt es nicht mehr. `
      + 'Umbenannt? Dann `npm run qa:nachweis`. Oberflaeche weg? Dann Bild und Bezugsdatei loeschen.';
  }
  if (!quelltexte.has(voll)) quelltexte.set(voll, literale(await readFile(voll, 'utf8')));
  const vorhanden = quelltexte.get(voll);
  for (const stueck of [...bezug.pfad, bezug.titel]) {
    if (!vorhanden.has(stueck)) {
      return `${rel}: "${stueck}" steht nicht mehr in ${bezug.datei} - der Nachweis hat keinen Erzeuger mehr.`;
    }
  }
  return null;
}
