#!/usr/bin/env node
// Eine Seite ansehen, ohne einen Testlauf: Server im Prozess starten, Seite
// im Browser oeffnen, Bild in den Temp-Ordner schreiben, Pfad ausgeben.
//
//   npm run sicht -- schautafel.html
//   npm run sicht -- schautafel.html --breite 1600 --hoehe 900 --name tafel
//
// Fuer das schnelle Hinsehen beim Zeichnen (Rueckschau nach Runde 10). Die
// Bilder sind Wegwerfbilder und gehoeren nicht ins Repository - belegt wird
// weiter mit nachweis() im Browserlauf (ADR-0011).
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { starten } = require('../server/index.js');

const argumente = process.argv.slice(2);
const wert = (name, vorgabe) => {
  const i = argumente.indexOf(`--${name}`);
  return i >= 0 ? argumente[i + 1] : vorgabe;
};
// Die Seite ist das erste Argument, das kein Schalter und kein Schalterwert
// ist - mit oder ohne fuehrenden Schraegstrich. Ohne ist sicherer: die
// Git-Bash unter Windows macht aus `/seite.html` still einen Dateipfad.
const schalterwerte = new Set(argumente.flatMap((a, i) => (a.startsWith('--') ? [i + 1] : [])));
const roh = argumente.find((a, i) => !a.startsWith('--') && !schalterwerte.has(i)) || '';
const seite = `/${roh.replace(/\\/g, '/').replace(/^.*?\/Git\//i, '').replace(/^\/+/, '')}`;
const breite = Number(wert('breite', 1400));
const hoehe = Number(wert('hoehe', 950));
const name = wert('name', seite.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'start');
const HAFEN = Number(wert('hafen', 4296));

const ordner = join(tmpdir(), 'onlinegames-sicht');
mkdirSync(ordner, { recursive: true });
const ziel = join(ordner, `${name}.png`);

const laufend = await starten(HAFEN, { konten: { datei: ':memory:', geheimnis: 's'.repeat(48) } });
const browser = await chromium.launch();
const fehler = [];
try {
  const blatt = await browser.newPage({ viewport: { width: breite, height: hoehe } });
  blatt.on('pageerror', (e) => fehler.push(e.message));
  blatt.on('console', (m) => { if (m.type() === 'error') fehler.push(m.text()); });
  await blatt.goto(`http://localhost:${HAFEN}${seite}`, { waitUntil: 'networkidle' });
  await blatt.screenshot({ path: ziel });
  console.log(ziel);
  if (fehler.length) console.log(`Die Seite hat Fehler gemeldet:\n  ${fehler.join('\n  ')}`);
} finally {
  await browser.close();
  laufend.wss.close();
  laufend.server.closeAllConnections();
  laufend.server.close();
  laufend.raeume.halt();
  laufend.schutz.halt();
  laufend.manager?.halt();
  laufend.zugang.schliessen();
}
process.exit(fehler.length ? 1 : 0);
