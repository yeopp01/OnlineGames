// Das Verzeichnis der Renderkette (darstellung AC-18, ADR-0014).
//
// grafik/verzeichnis.json sagt zu jeder Rastergrafik unter public/bilder/,
// welches Skript sie erzeugt. Hier steht, wie es gelesen und gegen die Ordner
// geprueft wird - ohne Blender, damit `npm run check` es kann. Dieselbe
// Pruefung laeuft am Ende von `npm run bilder`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const wurzel = join(dirname(fileURLToPath(import.meta.url)), '..');
export const GRAFIK = join(wurzel, 'grafik');
export const BILDER = join(wurzel, 'public', 'bilder');

// Was unter grafik/ liegen darf, ohne in QUELLEN.md zu stehen: die eigenen
// Skripte und die zwei Dateien der Kette selbst.
const EIGENES = (datei) => datei.endsWith('.py') || datei === 'verzeichnis.json' || datei === 'QUELLEN.md';

function dateienUnter(ordner, vor = '') {
  return readdirSync(ordner, { withFileTypes: true }).flatMap((e) => {
    if (e.name === '__pycache__') return [];
    return e.isDirectory() ? dateienUnter(join(ordner, e.name), `${vor}${e.name}/`) : [`${vor}${e.name}`];
  });
}

/** Alles, woran geprueft wird - einmal von der Platte gelesen. */
export function bestandLesen(grafik = GRAFIK, bilder = BILDER) {
  const bilddateien = existsSync(bilder) ? readdirSync(bilder).sort() : [];
  const beschreibungen = {};
  for (const datei of bilddateien.filter((n) => n.endsWith('.json'))) {
    beschreibungen[datei.replace(/\.json$/, '')] = JSON.parse(readFileSync(join(bilder, datei), 'utf8'));
  }
  return {
    verzeichnis: JSON.parse(readFileSync(join(grafik, 'verzeichnis.json'), 'utf8')),
    grafikdateien: dateienUnter(grafik).sort(),
    bilddateien,
    beschreibungen,
    quellen: readFileSync(join(grafik, 'QUELLEN.md'), 'utf8'),
  };
}

/**
 * Passt das Verzeichnis zu dem, was auf der Platte liegt? Gibt die
 * Beanstandungen zurueck, eine Zeile je Fund; leer heisst: es passt.
 */
export function verzeichnisPruefen({ verzeichnis, grafikdateien, bilddateien, beschreibungen }) {
  const funde = [];
  const modelle = verzeichnis.modelle || [];
  const vergeben = new Map(); // Bilddatei → Modell
  const namen = new Set();
  for (const modell of modelle) {
    const { name, skript, bilder = [] } = modell;
    if (!name || !skript) {
      funde.push(`Eintrag ohne Namen oder Skript: ${JSON.stringify(modell)}`);
      continue;
    }
    if (namen.has(name)) funde.push(`${name} steht zweimal im Verzeichnis`);
    namen.add(name);
    if (!grafikdateien.includes(skript)) funde.push(`${name}: das Skript grafik/${skript} fehlt`);
    if (!bilder.length) funde.push(`${name}: der Eintrag nennt kein Bild`);
    for (const bild of bilder) {
      if (!bilddateien.includes(bild)) funde.push(`${name}: Eintrag ohne Bild - public/bilder/${bild} fehlt (npm run bilder -- ${name})`);
      if (vergeben.has(bild)) funde.push(`public/bilder/${bild} steht bei ${vergeben.get(bild)} und bei ${name}`);
      vergeben.set(bild, name);
    }
    // Die Beschreibung neben der Tafel schreibt die Kette selbst; sie muss
    // dieselben Bilder nennen wie das Verzeichnis.
    const beschreibung = beschreibungen[name];
    if (!beschreibung) {
      funde.push(`${name}: die Beschreibung public/bilder/${name}.json fehlt (npm run bilder -- ${name})`);
      continue;
    }
    const geschrieben = [beschreibung.bild, beschreibung.maske].filter(Boolean).sort();
    if (geschrieben.join() !== [...bilder].sort().join()) {
      funde.push(`${name}: das Verzeichnis nennt ${[...bilder].sort().join(', ')}, die Beschreibung ${geschrieben.join(', ')}`);
    }
  }
  for (const datei of bilddateien) {
    if (datei.endsWith('.json')) {
      if (!namen.has(datei.replace(/\.json$/, ''))) funde.push(`public/bilder/${datei}: Beschreibung ohne Eintrag im Verzeichnis`);
    } else if (!vergeben.has(datei)) {
      funde.push(`public/bilder/${datei}: Bild ohne Eintrag in grafik/verzeichnis.json`);
    }
  }
  return funde;
}

/**
 * Breite, Hoehe und ob es Durchsicht gibt - aus dem Kopf einer Bilddatei
 * gelesen, ohne sie zu entpacken. Kennt WebP in seinen drei Fassungen und PNG.
 */
export function bildmasse(kopf) {
  if (kopf.toString('latin1', 1, 4) === 'PNG') {
    return { art: 'png', breite: kopf.readUInt32BE(16), hoehe: kopf.readUInt32BE(20), durchsicht: kopf[25] === 6 || kopf[25] === 4 };
  }
  if (kopf.toString('latin1', 0, 4) !== 'RIFF' || kopf.toString('latin1', 8, 12) !== 'WEBP') throw new Error('weder WebP noch PNG');
  const teil = kopf.toString('latin1', 12, 16);
  // Die erweiterte Fassung: so schreibt die Kette, sobald ein Bild Durchsicht hat.
  if (teil === 'VP8X') return { art: 'webp', breite: kopf.readUIntLE(24, 3) + 1, hoehe: kopf.readUIntLE(27, 3) + 1, durchsicht: (kopf[20] & 0x10) !== 0 };
  // Verlustfrei: Breite und Hoehe in je 14 Bit hinter dem Kennzeichen.
  if (teil === 'VP8L') {
    const bits = kopf.readUInt32LE(21);
    return { art: 'webp', breite: (bits & 0x3fff) + 1, hoehe: ((bits >>> 14) & 0x3fff) + 1, durchsicht: ((bits >>> 28) & 1) === 1 };
  }
  // Die einfache Fassung kennt keine Durchsicht.
  if (teil === 'VP8 ') return { art: 'webp', breite: kopf.readUInt16LE(26) & 0x3fff, hoehe: kopf.readUInt16LE(28) & 0x3fff, durchsicht: false };
  throw new Error(`WebP mit unbekanntem ersten Teil "${teil}"`);
}

/** Die Zeilen der Tabelle in QUELLEN.md, ohne Kopf und ohne den Platzhalter. */
export function quellenZeilen(text) {
  return text.split(/\r?\n/)
    .filter((zeile) => zeile.trim().startsWith('|'))
    .map((zeile) => zeile.trim().replace(/^\||\|$/g, '').split('|').map((zelle) => zelle.trim()))
    .filter((zellen) => zellen.length >= 3 && !/^-+$/.test(zellen[0]) && zellen[0] !== 'Was' && zellen[0] !== '–')
    .map(([was, woher, lizenz]) => ({ was, woher, lizenz }));
}

/**
 * Fremdes Material: alles unter grafik/, was kein eigenes Skript ist, steht
 * in QUELLEN.md - und dort steht nichts anderes als CC0.
 */
export function quellenPruefen({ grafikdateien, quellen }) {
  const funde = [];
  const zeilen = quellenZeilen(quellen);
  for (const zeile of zeilen) {
    if (!/^CC0\b/.test(zeile.lizenz)) funde.push(`grafik/QUELLEN.md: ${zeile.was} steht unter "${zeile.lizenz}" - erlaubt ist nur CC0`);
    if (!zeile.woher || zeile.woher === '–') funde.push(`grafik/QUELLEN.md: ${zeile.was} ohne Herkunft`);
  }
  for (const datei of grafikdateien.filter((d) => !EIGENES(d))) {
    if (!zeilen.some((zeile) => zeile.was.includes(datei))) funde.push(`grafik/${datei} ist kein eigenes Skript und steht nicht in grafik/QUELLEN.md`);
  }
  return funde;
}

/** Welche Modelle ein Aufruf meint: die genannten, sonst alle. */
export function modelleWaehlen(verzeichnis, gewuenscht = []) {
  const alle = verzeichnis.modelle.map((m) => m.name);
  const fremd = gewuenscht.filter((name) => !alle.includes(name));
  if (fremd.length) throw new Error(`Kein Modell "${fremd.join('", "')}" im Verzeichnis - es gibt: ${alle.join(', ')}`);
  return gewuenscht.length ? gewuenscht : alle;
}
