#!/usr/bin/env node
// Einladungscodes verwalten. Nur der Betreiber kommt hier heran - es gibt
// bewusst keinen Weg ueber das Netz (→ specs konten AC-20).
//
//   npm run einladung             Liste
//   npm run einladung -- neu "fuer Bert"
//   npm run einladung -- weg ABCD-EFGH
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { Einladungen } = require('../server/konten.js');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');

const wurzel = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const datei = process.env.KONTEN_DATEI || path.join(wurzel, 'daten', 'konten.sqlite');

if (!fs.existsSync(datei)) {
  console.error(`Keine Kontendatei unter ${datei}.`);
  console.error('Einmal `npm start` laufen lassen - dabei wird sie angelegt.');
  process.exit(1);
}

const db = new DatabaseSync(datei);
const einladungen = new Einladungen(db);
const [befehl, ...rest] = process.argv.slice(2);

function zeige(code) {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

if (befehl === 'neu') {
  const code = einladungen.anlegen(rest.join(' ') || null);
  console.log(`\n  ${zeige(code)}\n`);
  console.log('Gilt 14 Tage und genau eine Registrierung.');
} else if (befehl === 'weg') {
  const ok = einladungen.zuruecknehmen(rest[0]);
  console.log(ok ? 'Zurueckgenommen.' : 'Nicht gefunden oder schon benutzt.');
} else {
  const liste = einladungen.liste();
  if (!liste.length) {
    console.log('Noch keine Einladungscodes. Anlegen mit: npm run einladung -- neu "fuer Bert"');
  } else {
    const jetzt = Date.now();
    for (const e of liste) {
      const stand = e.benutzt_am ? `benutzt von ${e.benutzt_von}`
        : e.laeuft_ab < jetzt ? 'abgelaufen'
          : `frei bis ${new Date(e.laeuft_ab).toLocaleDateString('de-DE')}`;
      console.log(`${zeige(e.code)}  ${stand.padEnd(34)} ${e.notiz || ''}`);
    }
  }
}
db.close();
