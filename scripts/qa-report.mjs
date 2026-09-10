#!/usr/bin/env node
// WAECHTER + BERICHT: Arbeitsvorrat und Bildnachweise als eine Seite.
//
// Fuehrt zusammen, was sonst an vier Stellen steht - Specs, Testnamen,
// Bildnachweise unter qa/bildnachweise/ und die Ausnahmeliste
// qa/ohne-bild.json - und schreibt qa/report/index.html: je Spec eine Zeile
// je Abnahmekriterium, mit Status, Test, Bild oder Begruendung. Oben der
// Fortschritt aus der Git-Historie und der Bestand an Pruefungen
// (→ docs/adr/0011-bildnachweise.md, qa/README.md).
//
// Bricht ab bei einer falschen ZUORDNUNG: Bild ohne Bezugsdatei oder
// umgekehrt, Bezug auf eine Spec oder ein Kriterium, das es nicht gibt, ein
// Nachweis ohne Erzeuger, ein verwaister, doppelter oder unbegruendeter
// Eintrag in der Ausnahmeliste.
//
// Nicht geprueft: dass jedes Kriterium ein Bild hat. "Ohne Nachweis" ist ein
// Zustand, kein Fehler - der Bericht zeigt ihn. Mit --streng wird es einer.
// Dass FERTIGE Kriterien einen Nachweis haben, prueft scripts/spec-board.mjs.
import { execFile } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { promisify } from 'node:util';
import { fortschritt } from './fortschritt.mjs';
import { pruefungen as pruefungenZaehlen } from './pruefungen.mjs';
import { bericht } from './qa-bericht-vorlage.mjs';
import { WURZEL, belegeFuer, bestandLesen, pfadNetz, testnamen } from './specs-lesen.mjs';

const ZIEL = join(WURZEL, 'qa', 'report', 'index.html');
const STRENG = process.argv.includes('--streng');
const lauf = promisify(execFile);

const { specs, nachweise, ausnahmen, fehler } = await bestandLesen();
const namen = await testnamen();

/** Datum des letzten Commits je Bild. Ein Bild, das nie eingecheckt wurde, fehlt hier. */
async function bildstaende() {
  const staende = new Map();
  try {
    const { stdout } = await lauf('git', ['log', '--format=@@%cs', '--name-only', '--', 'qa/bildnachweise'], {
      cwd: WURZEL,
      maxBuffer: 64 * 1024 * 1024,
    });
    let datum = '';
    for (const zeile of stdout.split('\n')) {
      if (zeile.startsWith('@@')) datum = zeile.slice(2);
      else if (zeile.trim() && !staende.has(zeile.trim())) staende.set(zeile.trim(), datum);
    }
  } catch {
    // Ohne Git ist ein Bild eben "noch nicht eingecheckt" - kein Grund zu scheitern.
  }
  return staende;
}
const staende = await bildstaende();

// Reihenfolge je Spec: erst die fertigen Kriterien, darunter der Rest, beide
// nach Nummer. In der Spec stehen sie thematisch gruppiert; im Bericht sucht
// man nach Nummer und nach dem, was noch aussteht.
const reihenfolge = (a, b) => (a.status === 'fertig' ? 0 : 1) - (b.status === 'fertig' ? 0 : 1) || a.zahl - b.zahl;

const zaehler = { belegt: 0, ohneBild: 0, offen: 0, status: {} };
for (const spec of specs) {
  spec.zeilen = [...spec.kriterien].sort(reihenfolge).map((k) => {
    const schluessel = `${spec.pfad}#${k.id}`;
    const bilder = (nachweise.get(schluessel) ?? []).map((b) => ({
      ...b,
      src: pfadNetz(relative(dirname(ZIEL), join(WURZEL, b.bild))),
      stand: staende.get(b.bild) ?? '',
    }));
    const begruendung = ausnahmen.get(schluessel) ?? '';
    const zustand = bilder.length ? 'belegt' : begruendung ? 'ohne-bild' : 'offen';
    zaehler[zustand === 'ohne-bild' ? 'ohneBild' : zustand] += 1;
    zaehler.status[k.status] = (zaehler.status[k.status] ?? 0) + 1;
    return { ...k, bilder, begruendung, zustand, tests: belegeFuer(namen, spec.kuerzel, k.id) };
  });
}

if (STRENG && zaehler.offen > 0) {
  fehler.push(`--streng: ${zaehler.offen} Abnahmekriterien ohne Bild und ohne Begruendung.`);
}

if (fehler.length) {
  console.error('Bericht: die Zuordnung stimmt nicht.\n');
  for (const eintrag of fehler) console.error(`  ${eintrag}`);
  console.error(`\n${fehler.length} Beanstandung(en).`);
  process.exit(1);
}

// Fortschritt und Pruefungen zeigen nur - scheitern sie, entfaellt der
// Abschnitt, der Bericht nicht.
const takt = process.argv.find((a) => a.startsWith('--takt='))?.slice(7);
let verlauf = null;
try {
  verlauf = await fortschritt({ takt });
} catch (ursache) {
  console.warn(`Fortschritt uebersprungen: ${ursache.message}`);
}
let pruef = null;
try {
  pruef = await pruefungenZaehlen();
} catch (ursache) {
  console.warn(`Pruefungen uebersprungen: ${ursache.message}`);
}

const erzeugt = new Date().toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
await mkdir(dirname(ZIEL), { recursive: true });
await writeFile(ZIEL, bericht({ specs, zaehler, verlauf, pruefungen: pruef, erzeugt }), 'utf8');

const fertig = zaehler.status.fertig ?? 0;
const gesamt = zaehler.belegt + zaehler.ohneBild + zaehler.offen;
console.log(`Bericht geschrieben: qa/report/index.html (${fertig}/${gesamt} fertig, ${gesamt ? Math.round((fertig / gesamt) * 100) : 0} %)`);
console.log(`Nachweise: ${zaehler.belegt} mit Bild, ${zaehler.ohneBild} ohne Bild begruendet, ${zaehler.offen} ohne Nachweis.`);
if (pruef) console.log(`Pruefungen: ${pruef.faelle} Testfaelle in ${pruef.dateien} Dateien, ${pruef.waechter.length} Waechter in npm run check.`);
