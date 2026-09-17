#!/usr/bin/env node
// Messen auf der Schautafel, ohne Testlauf und ohne Wegwerfskript: jeder
// Ausdruck wird im Browser mit `t = window.schautafel` ausgewertet und als
// JSON ausgegeben.
//
//   npm run tafel -- "t.anmutung('gebaeude', 'haus')"
//   npm run tafel -- "t.gebaeudeArten.map((a) => [a, t.anmutung('gebaeude', a).saettigung])" "t.bodenRaster()"
//
// Rueckschau nach Runde 40: in den Runden 37-39 entstand dafuer viermal ein
// Wegwerfskript. Zum Vergleich mit dem alten Stand einzelne Dateien mit
// `git stash push <datei>` beiseitelegen, messen, `git stash pop`.
import { chromium } from '@playwright/test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { starten } = require('../server/index.js');

const ausdruecke = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!ausdruecke.length) {
  console.error('Aufruf: npm run tafel -- "<Ausdruck mit t = window.schautafel>" ...');
  process.exit(2);
}
const HAFEN = 4298;
await starten(HAFEN, { konten: { datei: ':memory:', geheimnis: 's'.repeat(48) } });
const browser = await chromium.launch();
const seite = await browser.newPage();
const fehler = [];
seite.on('pageerror', (e) => fehler.push(e.message));
await seite.goto(`http://localhost:${HAFEN}/schautafel.html`);
await seite.waitForFunction(() => window.schautafel);
let code = 0;
for (const ausdruck of ausdruecke) {
  try {
    const wert = await seite.evaluate((a) => {
      const t = window.schautafel; // eslint-disable-line no-unused-vars
      return eval(a); // eslint-disable-line no-eval
    }, ausdruck);
    console.log(`${ausdruck}\n  = ${JSON.stringify(wert)}`);
  } catch (e) {
    console.log(`${ausdruck}\n  ! ${e.message.split('\n')[0]}`);
    code = 1;
  }
}
for (const f of fehler) console.log(`Fehler auf der Seite: ${f}`);
await browser.close();
process.exit(fehler.length ? 1 : code);
