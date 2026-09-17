#!/usr/bin/env node
// Wo der Browserlauf seine Zeit verbringt: Playwright mit dem list-Bericht
// laufen lassen, die Dauer je Datei und die langsamsten Faelle ausgeben.
//
//   npm run e2e:laufzeiten
//   npm run e2e:laufzeiten -- strategie      (nur Dateien mit diesem Muster)
//
// Rueckschau nach Runde 25: ein einziger Fall brauchte 58 von 157 Sekunden,
// und niemand hatte es bemerkt. Vorher auf ruhige Maschine achten.
import { spawn } from 'node:child_process';

// Nur einfache Muster (Buchstaben, Ziffern, Bindestrich) - sie werden Teil der
// Befehlszeile.
const muster = process.argv.slice(2).filter((m) => /^[a-z0-9-]+$/i.test(m));
const befehl = ['npx playwright test --config e2e/playwright.config.mjs --reporter=list', ...muster].join(' ');
const lauf = spawn(befehl, { shell: true, stdio: ['ignore', 'pipe', 'inherit'] });

const zeile = /tests[\\/]([a-z0-9-]+)\.spec\.mjs:\d+:\d+ › (.*?) \((\d+(?:\.\d+)?)(ms|s|m)\)\s*$/;
const jeDatei = new Map();
const faelle = [];
let rest = '';
let fehlgeschlagen = false;

lauf.stdout.on('data', (stueck) => {
  const text = rest + stueck.toString();
  const zeilen = text.split(/\r?\n/);
  rest = zeilen.pop();
  for (const z of zeilen) {
    if (/^\s+(x|✘)\s/.test(z)) fehlgeschlagen = true;
    const m = z.match(zeile);
    if (!m) continue;
    const wert = Number(m[3]);
    const sekunden = m[4] === 'ms' ? wert / 1000 : m[4] === 'm' ? wert * 60 : wert;
    jeDatei.set(m[1], (jeDatei.get(m[1]) || 0) + sekunden);
    faelle.push({ datei: m[1], name: m[2].split(' › ').at(-1), sekunden });
  }
});

lauf.on('close', (code) => {
  const summe = [...jeDatei.values()].reduce((a, b) => a + b, 0);
  console.log('\nDauer je Datei:');
  for (const [datei, s] of [...jeDatei].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${datei.padEnd(30)} ${s.toFixed(1).padStart(6)} s  ${Math.round((s / summe) * 100)} %`);
  }
  console.log(`  ${'gesamt'.padEnd(30)} ${summe.toFixed(1).padStart(6)} s`);
  console.log('\nLangsamste Faelle:');
  for (const f of faelle.sort((a, b) => b.sekunden - a.sekunden).slice(0, 8)) {
    console.log(`  ${f.sekunden.toFixed(1).padStart(5)} s  ${f.datei}: ${f.name.slice(0, 80)}`);
  }
  process.exit(code || (fehlgeschlagen ? 1 : 0));
});
