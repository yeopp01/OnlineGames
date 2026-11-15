// Ein Ziel, zu dem kein Weg fuehrt (einheiten AC-64) - Rechenteile, direkt
// geprueft (→ docs/adr/0004-teststrategie.md).
//
// Aus dem Spiel auf dem Server (2026-11-15): "wenn ich mit einer einheit wo
// hinklicke, wo sie nicht hingehn kann, dann passiert nichts - aber sie sollte
// sich dann einfach moeglichst nah da hin bewegen." Vorher nahm der Befehl das
// naechste *begehbare* Feld am Klick, fragte aber nicht, ob ein Weg dorthin
// fuehrt: eine Lichtung im Wald, das andere Ufer - und die Einheit blieb stehen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt } = require('../server/spiele/strategie/welt.js');
const { erreichbar } = require('../server/spiele/strategie/wege.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const neueWelt = (startwert) => new Welt(ZWEI, startwert, { sicht: 'aufgedeckt' });
const bauernVon = (welt) => [...welt.einheiten.values()].filter((u) => u.besitzer === 'a' && u.art === 'dorfbewohner');

/** Ist im Quadrat um die Mitte nur Gras, und steht nichts darin? */
function wiese(welt, mx, my, halb) {
  const g = welt.karte.groesse;
  if (mx - halb < 1 || my - halb < 1 || mx + halb >= g - 1 || my + halb >= g - 1) return false;
  for (let y = my - halb; y <= my + halb; y++) {
    for (let x = mx - halb; x <= mx + halb; x++) {
      if (welt.karte.felder[y * g + x] !== karten.GRAS) return false;
    }
  }
  const drin = (e) => Math.abs(e.x - mx) <= halb + 1 && Math.abs(e.y - my) <= halb + 1;
  return ![...welt.einheiten.values(), ...welt.tiere.values()].some(drin);
}

/** Die naechste Wiese dieser Groesse, mindestens `fern` Felder vom Bauern. */
function wieseBei(welt, bauer, halb, fern) {
  const g = welt.karte.groesse;
  let beste = null;
  for (let y = 0; y < g; y++) {
    for (let x = 0; x < g; x++) {
      const weit = Math.hypot(x - bauer.x, y - bauer.y);
      if (weit < fern || (beste && weit >= beste.weit) || !wiese(welt, x, y, halb)) continue;
      beste = { x, y, weit };
    }
  }
  assert.ok(beste, 'eine freie Wiese fuer den Aufbau');
  return beste;
}

/**
 * Eine Insel: um die Mitte ein Graben aus Wasser, drei Felder weit draussen,
 * innen Gras. Begehbar ist die Mitte - nur fuehrt kein Weg hin.
 */
function insel(welt, bauer) {
  const g = welt.karte.groesse;
  const mitte = wieseBei(welt, bauer, 5, 12);
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) === 3) welt.karte.felder[(mitte.y + dy) * g + mitte.x + dx] = karten.WASSER;
    }
  }
  return mitte;
}

/** Ein See, so breit, dass von seiner Mitte aus zwoelf Felder weit kein Land liegt. */
function see(welt, bauer) {
  const g = welt.karte.groesse;
  const mitte = wieseBei(welt, bauer, 2, 20);
  for (let dy = -13; dy <= 13; dy++) {
    for (let dx = -13; dx <= 13; dx++) {
      const x = mitte.x + dx;
      const y = mitte.y + dy;
      if (x < 0 || y < 0 || x >= g || y >= g) continue;
      const belegt = [...welt.einheiten.values(), ...welt.tiere.values()].some((e) => Math.round(e.x) === x && Math.round(e.y) === y);
      if (!belegt && !welt.gebaeudeAn(x, y)) welt.karte.felder[y * g + x] = karten.WASSER;
    }
  }
  return mitte;
}

/** So nah kommt die Einheit an das Feld heran: der kleinste Abstand ueber alles, was sie erreicht. */
function naechstes(welt, einheit, ziel) {
  const g = welt.karte.groesse;
  const da = erreichbar(welt.karte, welt.feldVon(einheit));
  let nah = Infinity;
  for (let i = 0; i < da.length; i++) {
    if (da[i] && welt.karte.felder[i] === karten.GRAS) nah = Math.min(nah, Math.hypot((i % g) - ziel.x, ((i / g) | 0) - ziel.y));
  }
  return { nah, erreicht: da[ziel.y * g + ziel.x] === 1 };
}

function taktenBisRuhe(welt, einheiten, grenze = 4000) {
  for (let t = 0; t < grenze; t++) {
    welt.takten();
    if (einheiten.every((e) => !e.auftrag && !e.weg.length)) return;
  }
  throw new Error('die Einheiten kommen nicht zur Ruhe');
}

test('einheiten AC-64: kein Weg zum geklickten Feld - die Einheit geht so nah heran, wie es geht', () => {
  for (const startwert of [1, 2, 3, 4]) {
    const welt = neueWelt(startwert);
    const [bauer] = bauernVon(welt);
    const mitte = insel(welt, bauer);
    const { nah, erreicht } = naechstes(welt, bauer, mitte);
    assert.equal(erreicht, false, 'die Mitte der Insel ist begehbar, aber nicht erreichbar');
    const vorher = Math.hypot(bauer.x - mitte.x, bauer.y - mitte.y);
    welt.nachricht('a', { einheiten: [bauer.id], ziel: mitte });
    assert.ok(bauer.weg.length > 0, `Startwert ${startwert}: er geht los`);
    taktenBisRuhe(welt, [bauer]);
    const jetzt = Math.hypot(bauer.x - mitte.x, bauer.y - mitte.y);
    assert.ok(jetzt < vorher - 5, `Startwert ${startwert}: er ist dem Klick naeher (${jetzt.toFixed(1)} statt ${vorher.toFixed(1)})`);
    assert.ok(Math.abs(jetzt - nah) < 1e-9, `Startwert ${startwert}: ${jetzt.toFixed(2)} Felder vom Klick, naeher als ${nah.toFixed(2)} geht es nicht`);
  }
});

test('einheiten AC-64: mitten in einen See geklickt, in dem zwoelf Felder weit kein Land liegt - sie geht ans naechste Ufer', () => {
  const welt = neueWelt(5);
  const [bauer] = bauernVon(welt);
  const mitte = see(welt, bauer);
  const { nah } = naechstes(welt, bauer, mitte);
  assert.ok(nah > 12, 'das naechste Ufer liegt weiter weg, als die Aufstellung sucht');
  welt.nachricht('a', { einheiten: [bauer.id], ziel: mitte });
  assert.ok(bauer.weg.length > 0, 'er geht los');
  taktenBisRuhe(welt, [bauer]);
  const jetzt = Math.hypot(bauer.x - mitte.x, bauer.y - mitte.y);
  assert.ok(Math.abs(jetzt - nah) < 1e-9, `${jetzt.toFixed(2)} Felder von der Mitte des Sees, das naechste Ufer liegt ${nah.toFixed(2)} weit`);
});

test('einheiten AC-64: eine Gruppe vor der Insel - jeder bekommt ein eigenes Feld am Graben', () => {
  const welt = neueWelt(2);
  const bauern = bauernVon(welt).slice(0, 3);
  assert.equal(bauern.length, 3);
  const mitte = insel(welt, bauern[0]);
  const { nah } = naechstes(welt, bauern[0], mitte);
  welt.nachricht('a', { einheiten: bauern.map((b) => b.id), ziel: mitte });
  const ziele = bauern.map((b) => `${b.auftrag.feld.x},${b.auftrag.feld.y}`);
  assert.equal(new Set(ziele).size, 3, `drei verschiedene Felder: ${ziele.join(' | ')}`);
  for (const b of bauern) {
    assert.ok(b.weg.length > 0, 'jeder geht los');
    const weit = Math.hypot(b.auftrag.feld.x - mitte.x, b.auftrag.feld.y - mitte.y);
    assert.ok(weit <= nah + 1.5, `sein Feld liegt ${weit.toFixed(2)} vom Klick, das naechste ${nah.toFixed(2)}`);
  }
});

test('einheiten AC-64: auch der angehaengte Wegpunkt und das Marschziel des Angriffslaufs liegen dann am naechsten erreichbaren Feld', () => {
  const welt = neueWelt(3);
  const [bauer] = bauernVon(welt);
  const mitte = insel(welt, bauer);
  const { nah } = naechstes(welt, bauer, mitte);
  // Erst ein Gang auf freies Gras, die Insel mit Umschalt dahinter.
  const erst = wieseBei(welt, bauer, 2, 4);
  welt.nachricht('a', { einheiten: [bauer.id], ziel: { x: erst.x, y: erst.y } });
  assert.equal(bauer.auftrag.art, 'gehen');
  welt.nachricht('a', { einheiten: [bauer.id], ziel: mitte, anhaengen: true });
  assert.equal(bauer.wegpunkte.length, 1, 'die Insel steht in der Reihe');
  taktenBisRuhe(welt, [bauer]);
  assert.ok(Math.abs(Math.hypot(bauer.x - mitte.x, bauer.y - mitte.y) - nah) < 1e-9, 'am Ende steht er am Graben');

  const zweite = neueWelt(3);
  const [laeufer] = bauernVon(zweite);
  const ziel = insel(zweite, laeufer);
  zweite.nachricht('a', { einheiten: [laeufer.id], ziel, angriffslauf: true });
  assert.ok(laeufer.weg.length > 0, 'auch im Angriffslauf geht er los');
  const feld = laeufer.auftrag.feld;
  assert.deepEqual(laeufer.angriffslauf, feld, 'dorthin geht der Marsch nach einem Gefecht weiter');
  assert.ok(Math.abs(Math.hypot(feld.x - ziel.x, feld.y - ziel.y) - naechstes(zweite, laeufer, ziel).nah) < 1e-9, 'das Marschziel ist das naechste erreichbare Feld');
});

test('einheiten AC-64: fuehrt ein Weg zum Klick, bleibt alles beim Alten - sie steht am Ende auf dem geklickten Feld', () => {
  const welt = neueWelt(4);
  const [bauer] = bauernVon(welt);
  const ziel = wieseBei(welt, bauer, 1, 8);
  welt.nachricht('a', { einheiten: [bauer.id], ziel: { x: ziel.x, y: ziel.y } });
  assert.deepEqual(bauer.auftrag.feld, { x: ziel.x, y: ziel.y });
  taktenBisRuhe(welt, [bauer]);
  assert.deepEqual({ x: bauer.x, y: bauer.y }, { x: ziel.x, y: ziel.y });
});
