// Die Baender der Spieldynamik ueber zwanzig Saisons ohne Menschen
// (→ docs/manager/dynamik/plan.md). Eine Welt fuer alle, gerechnet von
// scripts/manager-dynamik-messung.mjs - derselben Stelle, aus der
// `npm run manager:dynamik` die Bandtabelle druckt.
//
// Was noch reisst, steht auf `offen` und der Test auf `todo` (finanzen
// AC-17 und AC-18 halten seit Schritt 2). Wer einen Schritt des Plans baut,
// nimmt das `todo` weg, sobald sein Band ueber diese Welt haelt - und prueft
// mit `npm run manager:dynamik` ueber mehrere Startwerte, dass es nicht nur
// hier haelt.
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

// Je Saison ein Eintrag; die Wertklippen je Alter (17 auf 18 bis 35 auf 36),
// die Entwicklung je Saison bis zur vorletzten (sie vergleicht mit der naechsten).
const LAENGE = { 'transfer AC-27': 19, 'kader AC-26': SAISONS - 1 };

const pruefen = (kriterium) => {
  const b = baender.get(kriterium);
  assert.equal(b.reihe.length, LAENGE[kriterium] ?? SAISONS);
  assert.ok(b.haelt, `${b.grenze} - reisst (${b.riss?.wo}): ${b.riss?.wert}`);
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

test('finanzen AC-17: hoechstens zwei Vereine je Liga unter -3 Mio, jede Saison', () => {
  pruefen('finanzen AC-17');
});

test('finanzen AC-18: der Median der Konten bleibt je Liga im Plus', () => {
  pruefen('finanzen AC-18');
});

test('transfer AC-26: mit 24 bis 28 ist ein Jahresgehalt 15 bis 25 % des Marktwerts', { todo: 'reisst heute - Schritt 3 des Plans, Preisgefuege' }, () => {
  pruefen('transfer AC-26');
});

test('kader AC-23: ab Saison 5 drei bis acht Spieler ab Staerke 85 in Liga 1', { todo: 'reisst heute - Schritt 4 des Plans, Starttalent' }, () => {
  pruefen('kader AC-23');
});

test('kader AC-24: das Durchschnittsalter bleibt ab Saison 2 zwischen 23 und 25', { todo: 'reisst heute unten (22,7) - Schritt 4 des Plans, Abbau ab 29 und Karriereende' }, () => {
  pruefen('kader AC-24');
});

test('transfer AC-27: ein Geburtstag kostet hoechstens 15 % des Marktwerts', { todo: 'reisst heute mit 28 und 31 - Schritt 3 des Plans, Altersfaktor' }, () => {
  pruefen('transfer AC-27');
});

test('finanzen AC-19: das groesste Konto der Liga 1 bleibt unter vier Jahreseinnahmen', { todo: 'reisst heute ab Saison 10 bis 16 - Schritt 6 des Plans, Reichtum' }, () => {
  pruefen('finanzen AC-19');
});

test('kader AC-25: die Jugend kommt hoechstens 15 unter dem Niveau an und spielt mit 20', { todo: 'reisst heute, mit 17 rund 22 unter dem Niveau - Schritt 4 des Plans, Jugend' }, () => {
  pruefen('kader AC-25');
});

test('kader AC-26: wer mit 25 bis 30 viel spielt, legt einen Punkt mehr zu', { todo: 'reisst heute, die Spielzeit wirkt nur bis 24 - Schritt 5 des Plans, Entwicklung' }, () => {
  pruefen('kader AC-26');
});
