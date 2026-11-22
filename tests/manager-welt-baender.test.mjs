// Die fuenf Baender der Spieldynamik ueber zwanzig Saisons ohne Menschen
// (→ docs/manager/dynamik/plan.md). Eine Welt fuer alle, gerechnet von
// scripts/manager-dynamik-messung.mjs - derselben Stelle, aus der
// `npm run manager:dynamik` die Bandtabelle druckt.
//
// Die Baender reissen heute; die Kriterien stehen auf `offen`, die Tests auf
// `todo`. Wer einen Schritt des Plans baut, nimmt das `todo` weg, sobald sein
// Band ueber diese Welt haelt - und prueft mit `npm run manager:dynamik`
// ueber mehrere Startwerte, dass es nicht nur hier haelt.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { baenderPruefen, weltVerfolgen } from '../scripts/manager-dynamik-messung.mjs';

const STARTWERT = 20260910;
const SAISONS = 20;
let welt;
let baender;

before(() => {
  welt = weltVerfolgen({ startwert: STARTWERT, saisons: SAISONS });
  baender = new Map(baenderPruefen(welt).map((b) => [b.kriterium, b]));
});

const pruefen = (kriterium) => {
  const b = baender.get(kriterium);
  assert.equal(b.reihe.length, SAISONS);
  assert.ok(b.haelt, `${b.grenze} - reisst in Saison ${b.riss?.saison}: ${b.riss?.wert}`);
};

test('die Dynamikmessung zaehlt Wechsel aus den Akten und Jugend nach Jahrgang', () => {
  assert.equal(welt.saisons.length, SAISONS);
  for (const s of welt.saisons) {
    for (const liga of [1, 2]) assert.ok(s.ligen[liga].wechsel.length > 0, `Saison ${s.saison}, Liga ${liga}: kein Wechsel gezaehlt`);
  }
  const jahrgaenge = new Set(welt.jugend.map((l) => l.jahrgang));
  assert.ok(!jahrgaenge.has(1), 'in Saison 1 kommt noch niemand aus der Jugend');
  assert.equal(jahrgaenge.size, SAISONS - 1, 'jede weitere Saison bringt einen Jahrgang');
  for (const l of welt.jugend) assert.equal(l.verlauf[17], l.staerke17);
});

test('finanzen AC-17: hoechstens zwei Vereine je Liga unter -3 Mio, jede Saison', { todo: 'reisst heute - Schritt 2 des Plans, Haushalt der KI' }, () => {
  pruefen('finanzen AC-17');
});

test('finanzen AC-18: der Median der Konten bleibt je Liga im Plus', { todo: 'reisst heute - Schritt 2 des Plans, Haushalt der KI' }, () => {
  pruefen('finanzen AC-18');
});

test('transfer AC-26: mit 24 bis 28 ist ein Jahresgehalt 15 bis 25 % des Marktwerts', { todo: 'reisst heute - Schritt 3 des Plans, Preisgefuege' }, () => {
  pruefen('transfer AC-26');
});

test('kader AC-23: ab Saison 5 drei bis acht Spieler ab Staerke 85 in Liga 1', { todo: 'reisst heute - Schritt 4 des Plans, Starttalent' }, () => {
  pruefen('kader AC-23');
});

test('kader AC-24: das Durchschnittsalter bleibt zwischen 25,5 und 27', { todo: 'reisst heute - Schritt 4 des Plans, Abbau ab 29 und Karriereende' }, () => {
  pruefen('kader AC-24');
});
