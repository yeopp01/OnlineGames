// Angriff wird gemeldet (→ specs/10-strategie/kampf.md AC-14) - Rechenteile,
// direkt geprueft (→ docs/adr/0004-teststrategie.md).
//
// Wer getroffen wird, bekommt mit dem naechsten Zustand den Ort - einmal je
// Gefecht, nicht bei jedem Schlag. Ein Angriff anderswo, oder nach einer
// Pause von zwanzig Sekunden, ist ein neuer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const meldungVon = (zustand, id) => zustand.spieler.find((s) => s.id === id)?.m || null;

// Ein Dorfbewohner von Anna, abseits, und eine Miliz von Bert daneben - wer
// wacht, schlaegt zu (kampf AC-2).
function ueberfall(welt, dx) {
  const basis = welt.spielerVon('a').basis;
  const opfer = welt.einheitAnlegen('a', basis.x + dx, basis.y + 8, 'dorfbewohner');
  welt.einheitAnlegen('b', basis.x + dx + 1, basis.y + 8, 'miliz');
  return opfer;
}

// Takte, bis ein Zustand eine Meldung fuer Anna traegt; die Meldungen dazwischen
// werden gezaehlt.
function bisMeldung(welt, hoechstens) {
  for (let t = 0; t < hoechstens; t++) {
    welt.takten();
    const m = meldungVon(welt.zustand(), 'a');
    if (m) return m;
  }
  return null;
}

test('kampf AC-14: wer getroffen wird, bekommt einmal den Ort - nicht bei jedem Schlag, und nur er', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  welt.zustand();
  const opfer = ueberfall(welt, 0);
  const m = bisMeldung(welt, 10 * TAKTE_PRO_SEKUNDE);
  assert.ok(m, 'gemeldet');
  assert.ok(Math.hypot(m[0] - opfer.x, m[1] - opfer.y) < 2, `am Opfer: ${m} gegen ${opfer.x},${opfer.y}`);
  // Das Gefecht geht weiter - keine zweite Meldung.
  let weitere = 0;
  let schlaege = 0;
  for (let t = 0; t < 8 * TAKTE_PRO_SEKUNDE; t++) {
    const leben = opfer.leben;
    welt.takten();
    if (opfer.leben < leben) schlaege++;
    if (meldungVon(welt.zustand(), 'a')) weitere++;
  }
  assert.ok(schlaege >= 2, `es wurde weiter geschlagen (${schlaege})`);
  assert.equal(weitere, 0, 'dasselbe Gefecht meldet sich nicht noch einmal');
  // Bert bekommt nichts - er greift an, er wird nicht angegriffen.
  assert.equal(meldungVon(welt.zustand(), 'b'), null);
});

test('kampf AC-14: ein Angriff an anderer Stelle ist ein neuer', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  welt.zustand();
  ueberfall(welt, 0);
  assert.ok(bisMeldung(welt, 10 * TAKTE_PRO_SEKUNDE), 'der erste');
  // Zwanzig Felder weiter, waehrend das erste Gefecht laeuft.
  const zweites = ueberfall(welt, 20);
  const m = bisMeldung(welt, 10 * TAKTE_PRO_SEKUNDE);
  assert.ok(m, 'der zweite wird gemeldet');
  assert.ok(Math.hypot(m[0] - zweites.x, m[1] - zweites.y) < 2, 'am zweiten Ort');
});

test('kampf AC-14: nach zwanzig Sekunden Ruhe meldet derselbe Ort wieder', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const basis = welt.spielerVon('a').basis;
  const opfer = welt.einheitAnlegen('a', basis.x, basis.y + 8, 'dorfbewohner');
  const taeter = welt.einheitAnlegen('b', basis.x + 1, basis.y + 8, 'miliz');
  welt.zustand();
  welt.angriffMelden(opfer, false, taeter);
  assert.ok(meldungVon(welt.zustand(), 'a'), 'gemeldet');
  // 19 Sekunden spaeter: noch dasselbe.
  welt.takt += 19 * TAKTE_PRO_SEKUNDE;
  welt.angriffMelden(opfer, false, taeter);
  assert.equal(meldungVon(welt.zustand(), 'a'), null, 'nach 19 s Pause noch dasselbe Gefecht');
  // Die Pause beginnt mit jedem Schlag neu: 34 s nach dem ersten, aber 15 s
  // nach dem letzten ist es noch dasselbe Gefecht ...
  welt.takt += 15 * TAKTE_PRO_SEKUNDE;
  welt.angriffMelden(opfer, false, taeter);
  assert.equal(meldungVon(welt.zustand(), 'a'), null, '15 s nach dem letzten Schlag noch dasselbe');
  // ... erst 20 s nach dem letzten ist es neu.
  welt.takt += 20 * TAKTE_PRO_SEKUNDE;
  welt.angriffMelden(opfer, false, taeter);
  assert.ok(meldungVon(welt.zustand(), 'a'), 'nach 20 s Ruhe neu');
});

test('kampf AC-14: im Nebel erfaehrt der Angreifer nichts von der Meldung des anderen', () => {
  const welt = new Welt(ZWEI, 4711);
  welt.aufbauFuer('a');
  welt.aufbauFuer('b');
  welt.zustandJeSpieler(['a', 'b']);
  ueberfall(welt, 0);
  let fuerAnna = null;
  let fuerBert = null;
  for (let t = 0; t < 10 * TAKTE_PRO_SEKUNDE && !fuerAnna; t++) {
    welt.takten();
    const je = welt.zustandJeSpieler(['a', 'b']);
    fuerAnna = meldungVon(je.get('a'), 'a');
    fuerBert = fuerBert || meldungVon(je.get('b'), 'a');
  }
  assert.ok(fuerAnna, 'Anna bekommt ihre Meldung');
  assert.equal(fuerBert, null, 'Bert sieht sie nicht');
});
