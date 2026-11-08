#!/usr/bin/env node
// Einen Prueflauf leise fahren: die ganze Ausgabe in eine Datei, auf den
// Bildschirm nur das Wesentliche.
//
// Warum: `node --test` nennt jeden einzelnen Test, Playwright auch. Gemessen
// in Runde 60: 31.343 Zeichen fuer `npm run check`, von denen sechs Zeilen
// etwas bedeuten. Fuer einen Menschen am Terminal ist das gleichgueltig - er
// ueberfliegt es. Fuer ein Sprachmodell in der Arbeitsschleife sind es rund
// 8.000 Token je Lauf, zwei bis drei Mal in jeder Runde.
//
//   npm run check:kurz            # wie npm run check, nur leise
//   npm run check:alles:kurz      # wie npm run check:alles, nur leise
//   npm run check:alles:neu:kurz  # dasselbe, aber alle Bilder neu
//   node scripts/leise.mjs test:e2e
//
// Bei einem Fehler wird mehr gezeigt, nicht weniger: die Fehlerzeilen und das
// Ende des Laufs. Die ganze Ausgabe steht in `qa/letzter-lauf.log` (von
// `.gitignore` gedeckt, `*.log`), damit man dort nachsehen kann.

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOG = join(WURZEL, 'qa', 'letzter-lauf.log');

// Zeilen, die etwas bedeuten. Bewusst **ohne** die Zeichen, mit denen die
// Berichterstatter ihre Zeilen schmuecken (das Info-i, Haken, Kreuz): die
// haengen an Kodierung und Terminal, und ein Muster, das daran haengt, faellt
// lautlos aus - genau das ist beim ersten Versuch passiert. Gesucht wird nach
// dem Wortlaut.
const WICHTIG = [
  /(^|\s)(tests|pass|fail|cancelled|skipped|todo) \d+\s*$/, // node --test, Zusammenfassung
  /(^|\s)\d+ (passed|failed|flaky|did not run)/, // Playwright, Zusammenfassung
  /^\s{0,4}\d+\) /, // Playwright nennt gefallene Faelle durchnummeriert
  /(Error|AssertionError|Timeout|timed out)/,
  /^(Board|Belege|Bericht|Nachweise|Pruefungen|Alle )/, // unsere eigenen Pruefskripte
  /^(FEHLER|Fehler|WARNUNG|Warnung)/,
  /^npm (error|ERR)/,
];

// Zeilen, die nichts bedeuten, auch wenn sie durch die Muster oben rutschen:
// jeder bestandene Einzeltest, und die Rahmenzeilen von npm.
const UNWICHTIG = [
  /\(\d+(\.\d+)?ms\)\s*$/, // „<Haken> name (1.23ms)" - ein einzelner Test
  /›.*\(\d+(\.\d+)?(ms|s)\)\s*$/, // Playwright nennt jeden Fall mit „›" und Dauer;
  // die Schlusszeile („133 passed (2.5m)") hat kein „›" und bleibt deshalb stehen.
  /^> /,
  /^\s*$/,
];

function wesentlich(text) {
  const raus = [];
  for (const zeile of text.split(/\r?\n/)) {
    if (UNWICHTIG.some((m) => m.test(zeile))) continue;
    if (WICHTIG.some((m) => m.test(zeile))) raus.push(zeile.trimEnd());
  }
  return raus;
}

const was = process.argv[2] || 'check';
if (!/^[a-z:]+$/.test(was)) {
  console.error(`Kein Skriptname: ${was}`);
  process.exit(2);
}

// Vor einem Browserlauf: ein Testserver, der von einem abgebrochenen Lauf
// liegengeblieben ist, haelt sonst den Hafen, und Playwright bricht in der
// ersten Sekunde ab ("is already used"). Er beendet sich auf Zuruf an seinen
// Pruefgriff (e2e/server.mjs, Befehl `beenden`). Laeuft keiner, passiert
// nichts. (Rueckschau nach Runde 121: in den Runden 110 und 119 je einmal.)
if (was.startsWith('check:alles') || was.startsWith('test:e2e') || was.startsWith('qa:nachweis')) {
  const griffhafen = (Number(process.env.E2E_HAFEN) || 4191) + 1;
  try {
    const antwort = await fetch(`http://localhost:${griffhafen}/griff`, {
      method: 'POST',
      body: JSON.stringify({ befehl: 'beenden' }),
      signal: AbortSignal.timeout(1500),
    });
    if (antwort.ok) {
      console.log('Ein liegengebliebener Testserver wurde beendet.');
      await new Promise((r) => setTimeout(r, 800));
    }
  } catch {
    // Keiner da - gut so.
  }
}

const anfang = Date.now();
const kind = spawn(`npm run ${was}`, { cwd: WURZEL, shell: true });

let alles = '';
kind.stdout.setEncoding('utf8');
kind.stderr.setEncoding('utf8');
kind.stdout.on('data', (d) => { alles += d; });
kind.stderr.on('data', (d) => { alles += d; });

kind.on('close', (code) => {
  mkdirSync(dirname(LOG), { recursive: true });
  writeFileSync(LOG, alles, 'utf8');

  const dauer = ((Date.now() - anfang) / 1000).toFixed(0);
  const zeilen = wesentlich(alles);
  const gezeigt = zeilen.filter((z, i) => i === 0 || z !== zeilen[i - 1]);
  for (const z of gezeigt.slice(0, 60)) console.log(z);
  if (gezeigt.length > 60) console.log(`... ${gezeigt.length - 60} weitere wichtige Zeilen in qa/letzter-lauf.log`);

  if (code !== 0) {
    // Gefallen: ein Fenster **um** jede Fehlerstelle zeigen. Das Ende des
    // Laufs zu zeigen hilft nicht - `node --test` nennt den Fehler dort, wo
    // der Test lief, und am Ende stehen nur die Zaehler.
    const alleZeilen = alles.split(/\r?\n/);
    const treffer = [];
    alleZeilen.forEach((z, i) => {
      if (/(Error|AssertionError|timed out|Timeout)/.test(z) || /^\s{0,4}\d+\) /.test(z)) treffer.push(i);
    });
    const zeigen = new Set();
    for (const i of treffer) for (let j = Math.max(0, i - 2); j <= Math.min(alleZeilen.length - 1, i + 14); j++) zeigen.add(j);
    const sortiert = [...zeigen].sort((a, b) => a - b).slice(0, 140);
    if (sortiert.length) {
      console.log('\n--- Fehlerstellen ---');
      let vorher = -2;
      for (const i of sortiert) {
        if (i > vorher + 1) console.log('  …');
        console.log(alleZeilen[i].trimEnd());
        vorher = i;
      }
    } else {
      // Kein Muster gegriffen: dann doch das Ende, damit nie nichts da steht.
      for (const z of alleZeilen.filter((z) => z.trim()).slice(-40)) console.log(z);
    }
  }

  console.log(`\n${code === 0 ? 'gruen' : `GEFALLEN (${code})`} - ${was} - ${dauer} s - ganze Ausgabe: qa/letzter-lauf.log (${alles.length} Zeichen)`);
  process.exit(code === 0 ? 0 : 1);
});
