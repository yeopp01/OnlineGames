// Gemeinsam auf den Angreifer (→ specs/10-strategie/ki.md, ki AC-36) -
// Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md).
//
// Rueckmeldung des Benutzers: "ich greife frueh immer mit dem Spaeher die KI
// an und kann immer gleich 2 dorfbewohner toeten, da muss sie gleich
// konsequent mit den dorfbewohnern auf den spaeher draufgehn".
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const {
  Ki, ENTSCHEIDEN_ALLE, STURM_UMKREIS, STURM_FEINDE, STURM_SEKUNDEN, STURM_LEINE,
} = require('../server/spiele/strategie/ki.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const OFFEN = { sicht: 'aufgedeckt' };

const dorfVon = (welt, id) => [...welt.einheiten.values()].filter((e) => e.besitzer === id && e.art === 'dorfbewohner' && !e.tot);
const zentrumVon = (welt, id) => [...welt.gebaeude.values()].find((g) => g.besitzer === id && g.art === 'dorfzentrum');
const rechtsklick = (welt, id, einheiten, auf) => welt.nachricht(id, {
  auftrag: 'befehl', einheiten: einheiten.map((e) => e.id), ziel: { x: auf.x, y: auf.y },
});

/** Die Welt laeuft, und Berts KI entscheidet in ihrem Takt. */
const laufen = (welt, ki, sekunden, bis = () => false) => {
  for (let t = 0; t < sekunden * TAKTE_PRO_SEKUNDE; t++) {
    welt.takten();
    if (welt.takt % ENTSCHEIDEN_ALLE === 0) ki.entscheiden();
    if (bis()) return t + 1;
  }
  return null;
};

/**
 * Berts Dorf nach einer Minute Arbeit, mit sieben Dorfbewohnern - und Annas
 * Angreifer neben dem, der dem Dorfzentrum am naechsten arbeitet.
 */
function lage(startwert, art, anzahl = 1, { ohneSturm = false } = {}) {
  const welt = new Welt(ZWEI, startwert, OFFEN);
  const ki = new Ki(welt, 'b');
  if (ohneSturm) ki.sturmPruefen = () => new Set();
  const zentrum = zentrumVon(welt, 'b');
  for (let i = 0; i < 4; i++) welt.einheitAnlegen('b', zentrum.x + 3 + i, zentrum.y + 3, 'dorfbewohner');
  laufen(welt, ki, 60);
  const abstand = (e) => Math.hypot(e.x - zentrum.x, e.y - zentrum.y);
  const opfer = dorfVon(welt, 'b').sort((x, y) => abstand(x) - abstand(y))[0];
  const nachbarn = dorfVon(welt, 'b').filter((e) => Math.hypot(e.x - opfer.x, e.y - opfer.y) <= STURM_UMKREIS);
  const angreifer = [];
  for (let i = 0; i < anzahl; i++) {
    angreifer.push(welt.einheitAnlegen('a', Math.round(opfer.x) + 1 + i, Math.round(opfer.y) + 1, art));
  }
  rechtsklick(welt, 'a', angreifer, opfer);
  return { welt, ki, zentrum, opfer, nachbarn, angreifer };
}

test('ki AC-36: schlaegt ein Spaeherreiter einen Dorfbewohner, gehen die Nachbarn gemeinsam auf ihn los und erschlagen ihn - ohne die Regel lebt er laenger und kostet mehr Leben', () => {
  const { welt, ki, opfer, nachbarn, angreifer } = lage(31, 'spaeherreiter');
  const [reiter] = angreifer;
  assert.ok(nachbarn.length >= 5, `um den Getroffenen arbeiten genug: ${nachbarn.length}`);
  const vorher = dorfVon(welt, 'b').length;

  const bisSturm = laufen(welt, ki, 10, () => ki.sturm);
  assert.ok(bisSturm, 'die KI ruft die Nachbarn');
  assert.ok(bisSturm <= 4 * TAKTE_PRO_SEKUNDE, `gleich nach dem ersten Schlag: ${bisSturm} Takte`);
  assert.equal(ki.sturm.ziel, reiter.id, 'auf den Reiter');
  const mit = dorfVon(welt, 'b').filter((e) => ki.sturm.wer.has(e.id));
  assert.ok(mit.length >= 5, `mindestens fuenf gehen mit: ${mit.length}`);
  for (const e of mit) {
    assert.equal(e.auftrag?.art, 'angreifen', 'jeder hat den Angriff als Auftrag');
    assert.equal(e.auftrag.ziel, reiter.id, 'und zwar auf den Reiter');
  }
  assert.equal(opfer.auftrag?.art, 'angreifen', 'der Getroffene flieht nicht, er schlaegt mit');

  const bisTot = laufen(welt, ki, 30, () => reiter.tot || !welt.einheiten.has(reiter.id));
  assert.ok(bisTot, 'der Reiter faellt');
  // Gemessen: 6,6 Sekunden vom Ruf bis zum Fall.
  assert.ok(bisTot <= 2 * STURM_SEKUNDEN * TAKTE_PRO_SEKUNDE, `in ${(bisTot / TAKTE_PRO_SEKUNDE).toFixed(1)} Sekunden`);
  assert.equal(dorfVon(welt, 'b').length, vorher, 'und kein Dorfbewohner ist gefallen');
  const lebenMit = dorfVon(welt, 'b').reduce((s, e) => s + e.leben, 0);

  // Danach wird gearbeitet: nach zehn Sekunden steht keiner mehr herum.
  laufen(welt, ki, 10);
  assert.equal(ki.sturm, null, 'der Sturm ist vorbei');
  const untaetig = dorfVon(welt, 'b').filter((e) => ki.untaetig(e));
  assert.equal(untaetig.length, 0, 'alle arbeiten wieder');
  assert.equal(ki.stuerme, 1);

  // Gegenprobe: dieselbe Lage ohne die Regel. Auch dort faellt der Reiter
  // irgendwann - mitten im Dorf wehrt sich jeder Getroffene, bis die KI ihn
  // heimschickt (ki AC-14), und ihr Spaeher steht Wache. Aber nach derselben
  // Zeit lebt er noch, und Bert hat mehr Leben verloren.
  const ohne = lage(31, 'spaeherreiter', 1, { ohneSturm: true });
  const [reiterOhne] = ohne.angreifer;
  for (let t = 0; t < bisSturm + bisTot; t++) {
    ohne.welt.takten();
    if (ohne.welt.takt % ENTSCHEIDEN_ALLE === 0) ohne.ki.entscheiden();
  }
  assert.ok(!reiterOhne.tot && ohne.welt.einheiten.has(reiterOhne.id), 'ohne die Regel lebt der Reiter zu dieser Zeit noch');
  laufen(ohne.welt, ohne.ki, 60, () => reiterOhne.tot || !ohne.welt.einheiten.has(reiterOhne.id));
  const lebenOhne = dorfVon(ohne.welt, 'b').reduce((s, e) => s + e.leben, 0) - 25 * (dorfVon(ohne.welt, 'b').length - vorher);
  assert.ok(lebenOhne < lebenMit, `ohne die Regel kostet derselbe Reiter mehr Leben: ${lebenOhne} gegen ${lebenMit}`);
});

test('ki AC-36: gegen einen Ritter bleibt es bei der Flucht - die Nachbarn arbeiten weiter', () => {
  const { welt, ki, opfer, nachbarn } = lage(31, 'ritter');
  assert.ok(nachbarn.length >= 5);
  laufen(welt, ki, 6, () => opfer.tot);
  assert.equal(ki.sturm, null, 'kein Sturm: zusammen braeuchten sie laenger als erlaubt');
  assert.equal(ki.stuerme, 0);
  const greifenAn = nachbarn.filter((e) => e !== opfer && !e.tot && e.auftrag?.art === 'angreifen');
  assert.equal(greifenAn.length, 0, 'kein Nachbar laesst die Arbeit liegen');
});

test('ki AC-36: gegen mehr Angreifer, als die Regel erlaubt, bleibt es bei der Flucht', () => {
  const { welt, ki, opfer } = lage(31, 'miliz', STURM_FEINDE + 1);
  laufen(welt, ki, 6, () => opfer.tot);
  assert.equal(ki.sturm, null);
  assert.equal(ki.stuerme, 0);
});

test('ki AC-36: reitet der Spaeher davon, folgt ihm keiner ueber die Leine - alle gehen zurueck und arbeiten', () => {
  const { welt, ki, zentrum, angreifer } = lage(31, 'spaeherreiter');
  const [reiter] = angreifer;
  assert.ok(laufen(welt, ki, 10, () => ki.sturm), 'der Sturm beginnt');
  const { ort } = ki.sturm;
  const mit = dorfVon(welt, 'b').filter((e) => ki.sturm.wer.has(e.id));

  // Anna zieht ihn ab, quer ueber die Karte von Berts Dorf weg.
  const weg = { x: Math.round(reiter.x + (reiter.x > zentrum.x ? 25 : -25)), y: Math.round(reiter.y) };
  const g = welt.karte.groesse;
  weg.x = Math.max(2, Math.min(g - 3, weg.x));
  rechtsklick(welt, 'a', [reiter], weg);
  let weitester = 0;
  for (let s = 0; s < 40; s++) {
    laufen(welt, ki, 1);
    for (const e of mit) if (!e.tot) weitester = Math.max(weitester, Math.hypot(e.x - ort.x, e.y - ort.y));
  }
  assert.ok(!reiter.tot, 'der Reiter ist entkommen - sonst zeigt der Fall nichts');
  assert.equal(ki.sturm, null, 'der Sturm ist vorbei');
  // Die Leine gilt dem Ziel; wer ihm folgt, kommt hoechstens ein Stueck weiter.
  assert.ok(weitester <= STURM_LEINE + 2, `keiner lief weiter als die Leine: ${weitester.toFixed(1)} Felder`);
  for (const e of mit) {
    if (e.tot) continue;
    assert.notEqual(e.auftrag?.art, 'angreifen', 'niemand jagt mehr');
    assert.ok(!ki.untaetig(e), 'und jeder arbeitet wieder');
  }
});
