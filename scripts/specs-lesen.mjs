// Eine Stelle, an der Specs gelesen werden. Board, Belegpruefung und Report
// haengen daran - sonst zaehlen drei Skripte dasselbe unterschiedlich.
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SPECS = join(WURZEL, 'specs');
export const TESTS = join(WURZEL, 'tests');

export const STATUS = ['in arbeit', 'in qa', 'geplant', 'offen', 'zurueckgestellt', 'fertig'];
export const ANZEIGE = {
  'in arbeit': 'In Arbeit',
  'in qa': 'In QA',
  geplant: 'Geplant',
  offen: 'Offen',
  zurueckgestellt: 'Zurueckgestellt',
  fertig: 'Fertig',
};
// Was zaehlt als gebaut - fuer den Fortschrittsbalken.
export const ERLEDIGT = new Set(['fertig']);

const KRITERIUM = /^-\s+\*\*(AC-(\d+))\*\*\s+`([^`]+)`\s+\*\*(.+?)\*\*\s*[—-]\s*(.*)$/;
const KOPF = (name) => new RegExp(`^\\*\\*${name}:\\*\\*\\s+(.+)$`, 'm');

export function pfadNetz(pfad) {
  return relative(SPECS, pfad).split('\\').join('/');
}

export async function dateien(ordner, endung = '.md') {
  const gefunden = [];
  for (const eintrag of await readdir(ordner, { withFileTypes: true })) {
    const pfad = join(ordner, eintrag.name);
    if (eintrag.isDirectory()) {
      gefunden.push(...(await dateien(pfad, endung)));
    } else if (eintrag.name.endsWith(endung)
      && eintrag.name !== 'BOARD.md' && eintrag.name !== 'README.md') {
      gefunden.push(pfad);
    }
  }
  return gefunden.sort((a, b) => a.localeCompare(b));
}

function einlesen(pfad, inhalt) {
  const zeilen = inhalt.split('\n');
  const wo = relative(WURZEL, pfad).split('\\').join('/');
  const titel = (zeilen.find((z) => z.startsWith('# ')) || '# Ohne Titel').slice(2).trim();
  const bereich = KOPF('Bereich').exec(inhalt)?.[1]?.trim() || 'Ohne Bereich';
  const kuerzel = KOPF('Kuerzel').exec(inhalt)?.[1]?.trim() || null;

  const kriterien = [];
  const fehler = [];
  if (!kuerzel) fehler.push(`${wo}: ohne Zeile "**Kuerzel:** ...".`);

  let abschnitt = 'Ohne Abschnitt';
  let letztes = null;

  for (const zeile of zeilen) {
    if (zeile.startsWith('### ')) {
      abschnitt = zeile.slice(4).trim();
      letztes = null;
      continue;
    }
    // Fortsetzungszeilen eines Kriteriums gehoeren zu seinem Text.
    if (letztes && /^ {2,}\S/.test(zeile)) {
      letztes.text += ` ${zeile.trim()}`;
      continue;
    }
    if (!zeile.trimStart().startsWith('- **AC-')) {
      letztes = null;
      continue;
    }
    const treffer = KRITERIUM.exec(zeile.trim());
    if (!treffer) {
      fehler.push(`${wo}: Kriterium ohne Status, Titel oder Text: ${zeile.trim().slice(0, 60)}`);
      letztes = null;
      continue;
    }
    const [, nummer, zahl, status, kurz, text] = treffer;
    if (!STATUS.includes(status)) {
      fehler.push(`${wo} ${nummer}: unbekannter Status "${status}". Erlaubt: ${STATUS.join(', ')}.`);
      letztes = null;
      continue;
    }
    letztes = { nummer, zahl: Number(zahl), status, kurz, text, abschnitt };
    kriterien.push(letztes);
  }

  return { pfad, wo, ziel: pfadNetz(pfad), titel, bereich, kuerzel, inhalt, kriterien, fehler };
}

export async function lesen() {
  const pfade = await dateien(SPECS);
  const specs = await Promise.all(
    pfade.map(async (pfad) => einlesen(pfad, await readFile(pfad, 'utf8'))),
  );
  return specs.filter((s) => s.kriterien.length || s.fehler.length);
}

export function zaehlen(kriterien) {
  const zahlen = Object.fromEntries(STATUS.map((s) => [s, 0]));
  for (const k of kriterien) zahlen[k.status] += 1;
  return zahlen;
}

export function standzeile(zahlen) {
  const teile = STATUS.filter((s) => zahlen[s] > 0).map((s) => `${zahlen[s]} ${s}`);
  return teile.length ? teile.join(' · ') : 'noch keine Kriterien';
}

// Der Text aller Testdateien, klein geschrieben - darin wird nach
// "kuerzel AC-n" gesucht.
export async function testtext() {
  const pfade = await dateien(TESTS, '.mjs');
  const inhalte = await Promise.all(pfade.map((p) => readFile(p, 'utf8')));
  return inhalte.join('\n').toLowerCase();
}

export function belegt(text, kuerzel, nummer) {
  if (!kuerzel) return false;
  // AC-7 darf nicht als Vorsilbe von AC-70 durchgehen.
  return new RegExp(`${kuerzel}\\s+${nummer}(?![0-9])`, 'i').test(text);
}
