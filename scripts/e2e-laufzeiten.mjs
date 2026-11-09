#!/usr/bin/env node
// Wo der Browserlauf seine Zeit verbringt: die Dauer je Datei und die
// langsamsten Faelle - gelesen aus dem Bericht, den **jeder** Browserlauf
// ablegt (`e2e/.ergebnisse/bericht.json`, Reporter in der Playwright-Config).
//
//   npm run e2e:laufzeiten                    der letzte Lauf, ganz
//   npm run e2e:laufzeiten -- strategie       nur Dateien mit diesem Muster
//   npm run e2e:laufzeiten -- --neu strategie erst einen Lauf fahren
//
// Rueckschau nach Runde 25: ein einziger Fall brauchte 58 von 157 Sekunden,
// und niemand hatte es bemerkt. Rueckschau nach Runde 140: bis dahin fuhr
// dieses Skript selbst einen ganzen Browserlauf - sechzehn Minuten fuer eine
// Zahl, die der Abschlusslauf eben schon gemessen hatte. Der Bericht sagt,
// wann er entstand und wie viele Faelle er hat: ein Lauf ueber eine einzelne
// Datei ueberschreibt ihn, und ein Lauf mit `--reporter=...` auf der
// Befehlszeile schreibt keinen (das ersetzt die Reporter der Config). Fuer
// `--neu` auf ruhige Maschine achten.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const BERICHT = join(WURZEL, 'e2e', '.ergebnisse', 'bericht.json');

const argumente = process.argv.slice(2);
const neu = argumente.includes('--neu');
// Nur einfache Muster (Buchstaben, Ziffern, Bindestrich) - sie werden Teil der
// Befehlszeile.
const muster = argumente.filter((m) => /^[a-z0-9-]+$/i.test(m));

if (neu) {
  const lauf = spawnSync(['npx playwright test --config e2e/playwright.config.mjs', ...muster].join(' '), {
    cwd: WURZEL, shell: true, stdio: 'inherit',
  });
  if (lauf.status !== 0) console.log('\nDer Lauf ist nicht gruen - die Dauern gelten trotzdem.');
}

if (!existsSync(BERICHT)) {
  console.error(`Kein Bericht unter ${BERICHT} - erst einen Browserlauf fahren (oder --neu).`);
  process.exit(1);
}
const bericht = JSON.parse(readFileSync(BERICHT, 'utf8'));

const faelle = [];
const durchgehen = (suite, datei) => {
  const hier = suite.file || datei;
  for (const spec of suite.specs || []) {
    for (const t of spec.tests || []) {
      for (const r of t.results || []) {
        faelle.push({ datei: (spec.file || hier).replace(/\\/g, '/').split('/').pop().replace('.spec.mjs', ''), name: spec.title, sekunden: r.duration / 1000, status: r.status });
      }
    }
  }
  for (const unter of suite.suites || []) durchgehen(unter, hier);
};
for (const suite of bericht.suites || []) durchgehen(suite, suite.file);

const gewaehlt = faelle.filter((f) => !muster.length || muster.some((m) => f.datei.includes(m)));
const jeDatei = new Map();
for (const f of gewaehlt) jeDatei.set(f.datei, (jeDatei.get(f.datei) || 0) + f.sekunden);
const summe = [...jeDatei.values()].reduce((a, b) => a + b, 0);

const start = bericht.stats?.startTime ? new Date(bericht.stats.startTime).toLocaleString('de-DE') : 'unbekannt';
const dauer = bericht.stats?.duration ? (bericht.stats.duration / 60_000).toFixed(1) : '?';
const rot = faelle.filter((f) => f.status !== 'passed' && f.status !== 'skipped').length;
console.log(`Bericht vom ${start}: ${faelle.length} Faelle, ${dauer} min, ${rot ? `${rot} nicht gruen` : 'alle gruen'}.`);
if (muster.length) console.log(`Davon mit ${muster.join(', ')}: ${gewaehlt.length}.`);
console.log('\nDauer je Datei:');
for (const [datei, s] of [...jeDatei].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${datei.padEnd(34)} ${s.toFixed(1).padStart(6)} s  ${Math.round((s / summe) * 100)} %`);
}
console.log(`  ${'gesamt'.padEnd(34)} ${summe.toFixed(1).padStart(6)} s`);
console.log('\nLangsamste Faelle:');
for (const f of [...gewaehlt].sort((a, b) => b.sekunden - a.sekunden).slice(0, 8)) {
  console.log(`  ${f.sekunden.toFixed(1).padStart(5)} s  ${f.datei}: ${f.name.slice(0, 80)}`);
}
