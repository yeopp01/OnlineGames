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
// Vierzig Partien bis Minute 90 rechnen hintereinander rund drei Minuten; vier
// Faeden mit je zehn (`nebel-arbeiter.mjs`) etwa eine. Hier, nicht im ersten
// Abschnitt: neben den Zeitmessungen riss einheiten AC-31 schon bei weniger
// (Rueckschau nach Runde 152).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Worker } from 'node:worker_threads';

const MINUTEN = 90;
const STARTWERTE = 40;
const FAEDEN = 4;
const TAKTE_JE_MINUTE = 600;

const rechnen = (startwerte) => new Promise((fertig, fehler) => {
  const faden = new Worker(new URL('./nebel-arbeiter.mjs', import.meta.url), { workerData: { startwerte, minuten: MINUTEN } });
  faden.once('message', fertig);
  faden.once('error', fehler);
});

test('fahrplan AC-11 und ki AC-13: KI gegen KI im Nebel endet ueber 40 Startwerte mit Sieger vor Minute 90, Median unter 45, mindestens 35 vor Minute 60', async () => {
  const je = STARTWERTE / FAEDEN;
  const teile = Array.from({ length: FAEDEN }, (_, i) => Array.from({ length: je }, (_, k) => i * je + k + 1));
  const enden = (await Promise.all(teile.map(rechnen))).flat();
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
