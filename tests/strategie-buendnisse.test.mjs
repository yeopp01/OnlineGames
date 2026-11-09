// Buendnisse (spielziel AC-14, ADR-0013) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md). Teams kommen als Einstellung der Welt,
// wie sie spaeter der Warteraum schickt (spielauswahl AC-22).
//
// Jeder Test stellt dieselbe Lage zweimal auf: einmal gegen Carla, die mit
// Anna im Team ist, einmal gegen Bert, ihren Gegner. Nur so zeigt er, dass
// das Team die Ursache ist - und nicht, dass die Regel gar nicht greift.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN } = require('../server/spiele/strategie/daten.js');

const DREI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }, { id: 'c', name: 'Carla' }];
// Anna und Carla gegen Bert.
const TEAMS = { a: 1, b: 2, c: 1 };

const sekunden = (welt, s) => { for (let t = 0; t < s * TAKTE_PRO_SEKUNDE; t++) welt.takten(); };

/**
 * Eine Welt zu dritt mit Teams und ein freier Platz von elf mal elf Feldern
 * in der Kartenmitte, weit weg von allen Doerfern. Anna in der Ritterzeit,
 * damit jede Art zur Hand ist. Frei heisst, was `platzPruefen` sagt.
 */
function mitPlatz(teams = TEAMS) {
  const welt = new Welt(DREI, 7, { sicht: 'aufgedeckt', teams });
  const anna = welt.spielerVon('a');
  anna.zeitalter = 2;
  const mitte = Math.floor(welt.karte.groesse / 2);
  for (let r = 0; r < 40; r++) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r], [r, r], [-r, r], [r, -r], [-r, -r]]) {
      const x0 = mitte + dx;
      const y0 = mitte + dy;
      let frei = true;
      for (let y = y0; y < y0 + 11 && frei; y++) {
        for (let x = x0; x < x0 + 11 && frei; x++) frei = welt.platzPruefen('haus', x, y) && welt.platzPruefen('haus', x + 1, y + 1);
      }
      if (frei && ![...welt.einheiten.values()].some((e) => e.x >= x0 - 9 && e.x <= x0 + 20 && e.y >= y0 - 9 && e.y <= y0 + 20)) {
        return { welt, x0, y0 };
      }
    }
  }
  throw new Error('kein freier Platz');
}

function stellen(welt, besitzer, art, x, y, leben = null) {
  const e = welt.einheitAnlegen(besitzer, Math.round(x), Math.round(y), art);
  e.x = x;
  e.y = y;
  if (leben !== null) e.leben = leben;
  return e;
}

test('spielziel AC-14: Teams kommen aus den Einstellungen - niemand ist sein eigener Gegner, im selben Team keiner dem anderen', () => {
  const welt = new Welt(DREI, 7, { teams: TEAMS });
  assert.equal(welt.feindlich('a', 'a'), false);
  assert.equal(welt.feindlich('a', 'c'), false, 'Anna und Carla sind verbuendet');
  assert.equal(welt.feindlich('c', 'a'), false, 'in beide Richtungen');
  assert.equal(welt.feindlich('a', 'b'), true);
  assert.equal(welt.feindlich('b', 'c'), true);
  assert.equal(welt.spielerVon('c').team, 1);
});

test('spielziel AC-14: ohne Teams ist jeder andere ein Gegner, wie bis Runde 145 - ebenso, wer kein gueltiges Team hat', () => {
  const ohne = new Welt(DREI, 7);
  assert.equal(ohne.feindlich('a', 'c'), true);
  assert.equal(ohne.feindlich('a', 'a'), false);
  // Nur 1 bis 4 ist ein Team. Zwei ohne Team sind sich nicht verbuendet,
  // auch wenn bei beiden "kein Team" steht.
  const falsch = new Welt(DREI, 7, { teams: { a: 0, b: 'x', c: 5 } });
  for (const s of falsch.spieler) assert.equal(s.team, null, s.id);
  assert.equal(falsch.feindlich('a', 'c'), true);
  const halb = new Welt(DREI, 7, { teams: { a: 1 } });
  assert.equal(halb.feindlich('a', 'b'), true);
  assert.equal(halb.feindlich('b', 'c'), true, 'beide ohne Team: Gegner');
});

test('spielziel AC-14: ein Rechtsklick auf die Einheit eines Verbuendeten ist ein Gang dorthin, auf die eines Gegners ein Angriff', () => {
  const { welt, x0, y0 } = mitPlatz();
  const miliz = stellen(welt, 'a', 'miliz', x0, y0 + 5);
  const carla = stellen(welt, 'c', 'dorfbewohner', x0 + 6, y0 + 5);
  welt.befehl('a', [miliz.id], { x: carla.x, y: carla.y });
  assert.notEqual(miliz.auftrag?.art, 'angreifen', 'Carla ist keine Feindin');
  assert.ok(miliz.weg.length > 0, 'die Miliz geht hin');
  sekunden(welt, 8);
  assert.equal(carla.leben, EINHEITEN.dorfbewohner.leben, 'und schlaegt nicht zu');

  const zweite = mitPlatz();
  const miliz2 = stellen(zweite.welt, 'a', 'miliz', zweite.x0, zweite.y0 + 5);
  const bert = stellen(zweite.welt, 'b', 'dorfbewohner', zweite.x0 + 6, zweite.y0 + 5);
  zweite.welt.befehl('a', [miliz2.id], { x: bert.x, y: bert.y });
  assert.equal(miliz2.auftrag?.art, 'angreifen', 'derselbe Klick auf Bert greift an');
});

test('spielziel AC-14: ein Rechtsklick auf das Gebaeude eines Verbuendeten greift es nicht an', () => {
  const { welt, x0, y0 } = mitPlatz();
  const miliz = stellen(welt, 'a', 'miliz', x0, y0 + 5);
  const haus = welt.gebaeudeAnlegen('c', 'haus', x0 + 6, y0 + 5, true);
  welt.befehl('a', [miliz.id], { x: haus.x, y: haus.y });
  assert.notEqual(miliz.auftrag?.art, 'angreifen');
  sekunden(welt, 8);
  assert.equal(haus.leben, welt.gebaeudewert('c', 'haus', 'leben'), 'das Haus ist heil');

  const zweite = mitPlatz();
  const miliz2 = stellen(zweite.welt, 'a', 'miliz', zweite.x0, zweite.y0 + 5);
  const haus2 = zweite.welt.gebaeudeAnlegen('b', 'haus', zweite.x0 + 6, zweite.y0 + 5, true);
  zweite.welt.befehl('a', [miliz2.id], { x: haus2.x, y: haus2.y });
  assert.equal(miliz2.auftrag?.art, 'angreifen', 'Berts Haus wird angegriffen');
});

test('spielziel AC-14: eine Wache laesst Verbuendete in Ruhe und greift Gegner an', () => {
  const { welt, x0, y0 } = mitPlatz();
  const wache = stellen(welt, 'a', 'miliz', x0 + 2, y0 + 5);
  const carla = stellen(welt, 'c', 'miliz', x0 + 5, y0 + 5);
  sekunden(welt, 5);
  assert.equal(wache.auftrag, null, 'keine Wache greift Carla an');
  assert.equal(carla.auftrag, null, 'und Carlas Miliz nicht Anna');
  assert.equal(carla.leben, EINHEITEN.miliz.leben);

  const zweite = mitPlatz();
  const wache2 = stellen(zweite.welt, 'a', 'miliz', zweite.x0 + 2, zweite.y0 + 5);
  stellen(zweite.welt, 'b', 'miliz', zweite.x0 + 5, zweite.y0 + 5);
  sekunden(zweite.welt, 1);
  assert.equal(wache2.auftrag?.art, 'angreifen', 'Bert in derselben Lage wird angegriffen');
});

test('spielziel AC-14: ein Turm schiesst nicht auf Verbuendete, wohl aber auf Gegner daneben', () => {
  const { welt, x0, y0 } = mitPlatz();
  welt.gebaeudeAnlegen('a', 'wachturm', x0 + 1, y0 + 5, true);
  const carla = stellen(welt, 'c', 'dorfbewohner', x0 + 4, y0 + 5);
  sekunden(welt, 6);
  assert.equal(carla.leben, EINHEITEN.dorfbewohner.leben, 'Carla bleibt heil');
  const bert = stellen(welt, 'b', 'dorfbewohner', x0 + 4, y0 + 6);
  sekunden(welt, 1);
  assert.ok(bert.leben < EINHEITEN.dorfbewohner.leben, 'Bert daneben wird getroffen');
  assert.equal(carla.leben, EINHEITEN.dorfbewohner.leben);
});

test('spielziel AC-14: das Tor eines Verbuendeten oeffnet sich, das eines Gegners nicht', () => {
  // Carlas Mauerring mit einem Tor oben, darin ein Feld; Anna und Bert
  // stehen draussen und wollen hinein.
  const { welt, x0, y0 } = mitPlatz();
  for (let i = 2; i <= 8; i++) {
    for (const [x, y] of [[x0 + i, y0 + 2], [x0 + i, y0 + 8], [x0 + 2, y0 + i], [x0 + 8, y0 + i]]) {
      if (x === x0 + 5 && y === y0 + 2) continue;
      if (!welt.gebaeudeAn(x, y)) welt.gebaeudeAnlegen('c', 'steinmauer', x, y, true);
    }
  }
  welt.gebaeudeAnlegen('c', 'tor', x0 + 5, y0 + 2, true);
  const innen = { x: x0 + 5, y: y0 + 5 };
  const anna = stellen(welt, 'a', 'dorfbewohner', x0 + 5, y0);
  const bert = stellen(welt, 'b', 'dorfbewohner', x0 + 4, y0);
  welt.befehl('a', [anna.id], innen);
  welt.befehl('b', [bert.id], innen);
  assert.ok(anna.weg.length > 0, 'Anna hat einen Weg durch Carlas Tor');
  assert.deepEqual(bert.weg, [], 'Bert nicht');
  assert.ok(welt.toreVon('c').size === 1, 'Carlas eigene Liste bleibt ihre');
  sekunden(welt, 10);
  assert.ok(Math.hypot(anna.x - innen.x, anna.y - innen.y) < 1.5, 'Anna steht drinnen');
});

test('spielziel AC-14: ein Moench bekehrt keinen Verbuendeten', () => {
  const { welt, x0, y0 } = mitPlatz();
  const moench = stellen(welt, 'a', 'moench', x0, y0 + 5);
  const carla = stellen(welt, 'c', 'miliz', x0 + 4, y0 + 5);
  const bert = stellen(welt, 'b', 'miliz', x0 + 4, y0 + 7);
  assert.equal(welt.kannBekehren(moench, carla), false);
  assert.equal(welt.kannBekehren(moench, bert), true, 'Bert schon');
  welt.befehl('a', [moench.id], { x: carla.x, y: carla.y });
  assert.notEqual(moench.auftrag?.art, 'bekehren');
});

test('spielziel AC-14: ein Stein trifft Verbuendete wie eigene, und getroffen schlaegt keiner gegen den Werfer zurueck', () => {
  const { welt, x0, y0 } = mitPlatz();
  const mangonel = stellen(welt, 'a', 'mangonel', x0 + 1, y0 + 5);
  const ziel = stellen(welt, 'b', 'dorfbewohner', x0 + 7, y0 + 5, 1000);
  // Am Rand des Einschlags, ein Feld neben dem Ziel.
  const carla = stellen(welt, 'c', 'dorfbewohner', x0 + 7, y0 + 6, 1000);
  welt.befehl('a', [mangonel.id], { x: ziel.x, y: ziel.y });
  sekunden(welt, 2);
  assert.ok(ziel.leben < 1000, 'der Stein ist eingeschlagen');
  assert.ok(carla.leben < 1000, 'Carla ist getroffen - der Stein fragt nicht, wem sie gehoert');
  assert.notEqual(carla.auftrag?.art, 'angreifen', 'sie wehrt sich nicht gegen Anna');
  assert.equal(welt.spielerVon('c').angriff, undefined, 'und Carla bekommt keine Angriffsmeldung');
});
