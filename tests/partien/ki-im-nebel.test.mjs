// KI gegen KI im Nebel (→ specs/10-strategie/fahrplan.md AC-11, ki.md AC-13)
// - ganze Partien im Pruefstand ohne Browser (→ docs/adr/0004-teststrategie.md).
//
// Seit Runde 165 sieht die KI nur, was sie sieht: fremde Gebaeude, sobald sie
// sie gesehen hat, fremde Einheiten, solange sie sie sieht. Das kostet sie
// Partien vor Minute 60 - ohne Sicht fand das Heer die Holzfaeller am fremden
// Waldrand, mit Sicht muss es sie suchen. Der Benutzer hat dafuer am
// 2026-11-10 die **Ersatzgrenze im Nebel** gewaehlt: alle Partien mit Sieger
// vor Minute 90, Median unter 45 Minuten, mindestens 35 von 40 vor Minute 60.
//
// Gemessen in Runde 165 (Startwerte 1 bis 40): alle mit Sieger, 37 von 40 vor
// Minute 60, Median 44,6 Minuten (1 bis 20: 46,0; 21 bis 40: 41,9), die
// laengste 77,9 (Startwert 18). Der alte Stand ohne eigene Sicht: 40 von 40,
// Median 41,9 und 38,3. Der Median steht knapp unter der Grenze - die Partien
// sind gerechnet, nicht gewuerfelt, also faellt der Test nur, wenn eine
// Aenderung sie wirklich laenger macht.
//
// Seit Runde 174 spielt jede KI ein Haus (ki AC-27), wie in einer Partie mit
// der Vorgabe Zufall: je Startwert zwei verschiedene, ueber vierzig
// Startwerte jedes geordnete Paar zweimal. Gemessen in Runde 174: alle mit
// Sieger, 38 von 40 vor Minute 60, Median 42,9, die laengste 68,5. Dieselben
// Haeuser ohne die Neigung der KI (HEAD vor Runde 174): 37 von 40, Median
// 44,2. Aus denselben Partien liest der zweite Test, wozu jedes Haus neigt.
//
// Vierzig Partien bis Minute 90 rechnen hintereinander rund drei Minuten; vier
// Faeden mit je zehn (`nebel-arbeiter.mjs`) etwa eine. Hier, nicht im ersten
// Abschnitt: neben den Zeitmessungen riss einheiten AC-31 schon bei weniger
// (Rueckschau nach Runde 152).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { HAEUSER, GEBAEUDE } = require('../../server/spiele/strategie/daten.js');

const MINUTEN = 90;
const STARTWERTE = 40;
const FAEDEN = 4;
const TAKTE_JE_MINUTE = 600;

// Die Haeuser je Startwert, aus den Daten: KI 1 der Reihe nach, KI 2 um eins
// bis vier dahinter - nie dasselbe, und jedes geordnete Paar gleich oft.
const NAMEN = Object.keys(HAEUSER);
const haeuserFuer = (s) => ({
  ki1: NAMEN[s % NAMEN.length],
  ki2: NAMEN[(s + 1 + (Math.floor(s / NAMEN.length) % (NAMEN.length - 1))) % NAMEN.length],
});
const HAEUSER_JE_STARTWERT = Object.fromEntries(Array.from({ length: STARTWERTE }, (_, i) => [i + 1, haeuserFuer(i + 1)]));

const rechnen = (startwerte) => new Promise((fertig, fehler) => {
  const faden = new Worker(new URL('./nebel-arbeiter.mjs', import.meta.url), { workerData: { startwerte, minuten: MINUTEN, haeuser: HAEUSER_JE_STARTWERT } });
  faden.once('message', fertig);
  faden.once('error', fehler);
});

// Einmal gerechnet, von beiden Tests gelesen.
let partien = null;
const allePartien = () => {
  if (!partien) {
    const je = STARTWERTE / FAEDEN;
    const teile = Array.from({ length: FAEDEN }, (_, i) => Array.from({ length: je }, (_, k) => i * je + k + 1));
    partien = Promise.all(teile.map(rechnen)).then((t) => t.flat());
  }
  return partien;
};

test('fahrplan AC-11 und ki AC-13: KI gegen KI im Nebel endet ueber 40 Startwerte mit Sieger vor Minute 90, Median unter 45, mindestens 35 vor Minute 60', async () => {
  const enden = await allePartien();
  assert.equal(enden.length, STARTWERTE);
  for (const e of enden) assert.ok(e.sieger, `Startwert ${e.startwert}: kein Sieger bis Minute ${MINUTEN}`);
  const minuten = enden.map((e) => e.takt / TAKTE_JE_MINUTE).sort((a, b) => a - b);
  const median = (minuten[STARTWERTE / 2 - 1] + minuten[STARTWERTE / 2]) / 2;
  const vor60 = minuten.filter((m) => m < 60).length;
  assert.ok(median < 45, `Median ${median.toFixed(1)} Minuten`);
  assert.ok(vor60 >= 35, `${vor60} von ${STARTWERTE} vor Minute 60`);
  // Gegenprobe zur Ursache: gemessen wird die KI im Nebel - keine kennt den
  // Gegner zu Beginn, jede findet ihn erst mit ihrem Spaeher. Die KI ohne
  // eigene Sicht kannte ihn im ersten Takt (und haette alle drei Grenzen oben
  // ebenso gehalten: 40 von 40, Median 41,9 und 38,3 - Durchsicht Runde 165).
  for (const e of enden) {
    for (const m of e.gegnerMinuten) assert.ok(m !== null && m >= 1, `Startwert ${e.startwert}: Gegner gesehen in Minute ${m}`);
  }
  // Gegenprobe zum Messaufbau: vierzig verschiedene Partien, und nicht immer
  // dieselbe Seite vorn.
  assert.ok(new Set(enden.map((e) => e.takt)).size >= 30, 'verschiedene Enden');
  assert.equal(new Set(enden.map((e) => e.sieger)).size, 2, 'mal gewinnt die eine KI, mal die andere');
});

// Wozu ein Haus neigt (ki AC-27): ein Gebaeude, gelesen aus `HAEUSER[..].ki`.
// Gezaehlt wird, was dort ausgebildet wird - die Einheiten aus seinem
// `bildetAus`. Gemessen in Runde 174, je Auftritt (16 je Haus):
// Eschenbruch 107 aus der Schiessanlage gegen 42 im Schnitt der anderen,
// Rappenstein 28 aus dem Stall gegen 4, Silberfurt 6,5 Karren gegen 0,1,
// Distelhag 82 aus der Kaserne gegen 35.
//
// Gegenprobe zur Ursache: dieselben Partien mit Haeusern, aber ohne Neigung
// (HEAD vor Runde 174) ergeben Eschenbruch 78 gegen 64, Rappenstein 12
// gegen 13, Silberfurt 0,8 gegen 0,4, Distelhag 43 gegen 47. Mehr als der
// Schnitt hielte dort also schon fuer zwei von vier - deshalb verlangt der
// Test das Anderthalbfache und zwei mehr; daran faellt der alte Stand bei
// allen vier.
test('ki AC-27: ueber 40 Startwerte bildet jedes Haus anderthalbmal so viel aus seinem Schwerpunkt aus wie die anderen im Schnitt', async () => {
  const enden = await allePartien();
  const auftritte = {};
  const aus = {}; // aus[haus][gebaeude] = Summe ueber alle Auftritte
  for (const e of enden) {
    for (const [id, haus] of Object.entries(e.haeuser)) {
      auftritte[haus] = (auftritte[haus] || 0) + 1;
      aus[haus] ??= {};
      for (const art of Object.keys(GEBAEUDE)) {
        aus[haus][art] = (aus[haus][art] || 0)
          + GEBAEUDE[art].bildetAus.reduce((summe, einheit) => summe + (e.neu[id]?.[einheit] || 0), 0);
      }
    }
  }
  // Gegenprobe zum Messaufbau: jedes Haus gleich oft, gegen jedes andere.
  for (const haus of NAMEN) assert.equal(auftritte[haus], (2 * STARTWERTE) / NAMEN.length, `${haus}: ${auftritte[haus]} Auftritte`);
  const mitNeigung = NAMEN.filter((haus) => HAEUSER[haus].ki?.schwerpunkt);
  assert.ok(mitNeigung.length >= 4, `nur ${mitNeigung.length} Haeuser mit Schwerpunkt`);
  for (const haus of mitNeigung) {
    const gebaeude = HAEUSER[haus].ki.schwerpunkt;
    assert.ok(GEBAEUDE[gebaeude].bildetAus.length, `${haus}: ${gebaeude} bildet nichts aus`);
    const eigen = aus[haus][gebaeude] / auftritte[haus];
    const andere = NAMEN.filter((h) => h !== haus).map((h) => aus[h][gebaeude] / auftritte[h]);
    const schnitt = andere.reduce((a, b) => a + b, 0) / andere.length;
    assert.ok(eigen >= 1.5 * schnitt && eigen >= schnitt + 2,
      `${haus} aus ${gebaeude}: ${eigen.toFixed(1)} je Partie, die anderen ${schnitt.toFixed(1)}`);
  }
});
