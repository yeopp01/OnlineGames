// Laufen ohne Verlust am Wegpunkt (→ specs/10-strategie/einheiten-und-befehle.md
// AC-70). Rechenteil, direkt geprueft (→ docs/adr/0004-teststrategie.md).
//
// Bis zum 2026-11-22 endete der Takt einer Einheit an jedem Wegpunkt: Tempo
// 1,0 brauchte fuer zehn Felder geradeaus 110 statt 100 Takte, schraeg 150
// statt 142. Jetzt geht der Rest des Takts zum naechsten Wegpunkt weiter.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

/** Eine Welt und ein freier Platz von elf mal elf Feldern, weit weg von allen Einheiten. */
function mitPlatz() {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  const anna = welt.spielerVon('a');
  for (let r = 6; r < 40; r++) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r], [r, r], [-r, r], [r, -r], [-r, -r]]) {
      const x0 = anna.basis.x + dx;
      const y0 = anna.basis.y + dy;
      let frei = true;
      for (let y = y0; y < y0 + 11 && frei; y++) {
        for (let x = x0; x < x0 + 11 && frei; x++) frei = welt.platzPruefen('haus', x, y) && welt.platzPruefen('haus', x + 1, y + 1);
      }
      if (frei && ![...welt.einheiten.values()].some((e) => e.x >= x0 - 6 && e.x <= x0 + 16 && e.y >= y0 - 6 && e.y <= y0 + 16)) {
        return { welt, x0, y0 };
      }
    }
  }
  throw new Error('kein freier Platz');
}

/** Takte fuer zehn Felder, gerade oder schraeg, mit einem Befehl wie im Spiel. */
function gang(art, schraeg) {
  const { welt, x0, y0 } = mitPlatz();
  const einheit = welt.einheitAnlegen('a', x0, y0, art);
  const ziel = { x: x0 + 10, y: y0 + (schraeg ? 10 : 0) };
  assert.equal(welt.nachricht('a', { auftrag: 'befehl', einheiten: [einheit.id], ziel })?.fehler, undefined);
  let takte = 0;
  while (einheit.weg.length && takte < 5000) {
    welt.takten();
    takte += 1;
  }
  assert.deepEqual([einheit.x, einheit.y], [ziel.x, ziel.y], `${art} ist angekommen`);
  return takte;
}

test('einheiten AC-70: zehn Felder dauern so viele Takte, wie das Tempo verlangt - aufgerundet, nicht mehr', () => {
  for (const art of ['dorfbewohner', 'miliz', 'speerkaempfer', 'spaeherreiter', 'ritter', 'moench', 'marktkarren', 'ramme']) {
    const jeTakt = EINHEITEN[art].tempo / TAKTE_PRO_SEKUNDE;
    // Ein Milliardstel Spiel, wie in `welt.laufen()`: 10 / 0,1 ist in
    // Gleitkomma nicht genau 100.
    const soll = (strecke) => Math.ceil(strecke / jeTakt - 1e-6);
    assert.equal(gang(art, false), soll(10), `${art} geradeaus`);
    assert.equal(gang(art, true), soll(10 * Math.SQRT2), `${art} schraeg`);
  }
});

test('einheiten AC-70: Tempo 1,0 braucht fuer zehn Felder 100 Takte geradeaus und 142 schraeg - vorher 110 und 150', () => {
  // Der Speerkaempfer hat Tempo 1,0 in den Daten (vorlage-aoe2.md).
  assert.equal(EINHEITEN.speerkaempfer.tempo, 1);
  assert.equal(gang('speerkaempfer', false), 100);
  assert.equal(gang('speerkaempfer', true), 142);
});

test('einheiten AC-70: wer im Takt einen Wegpunkt erreicht, geht mit dem Rest weiter - auch ueber mehrere Wegpunkte', () => {
  const { welt, x0, y0 } = mitPlatz();
  const einheit = welt.einheitAnlegen('a', x0, y0, 'speerkaempfer');
  // Tempo 1,0: ein Zehntel Feld je Takt. Wegpunkte im Abstand von 0,03 Feldern -
  // ein Takt geht ueber drei hinweg und ein Stueck in den vierten.
  einheit.weg = [1, 2, 3, 4, 5].map((i) => ({ x: x0 + 0.03 * i, y: y0 }));
  welt.laufen(einheit);
  assert.ok(Math.abs(einheit.x - (x0 + 0.1)) < 1e-9, `nach einem Takt bei ${(einheit.x - x0).toFixed(4)} statt 0,1`);
  assert.equal(einheit.weg.length, 2, 'drei Wegpunkte hinter sich');
  // Um die Ecke: der Rest geht in die neue Richtung.
  einheit.x = x0;
  einheit.y = y0;
  einheit.weg = [{ x: x0 + 0.06, y: y0 }, { x: x0 + 0.06, y: y0 + 1 }];
  welt.laufen(einheit);
  assert.ok(Math.abs(einheit.x - (x0 + 0.06)) < 1e-9 && Math.abs(einheit.y - (y0 + 0.04)) < 1e-9,
    `um die Ecke bei ${(einheit.x - x0).toFixed(4)} / ${(einheit.y - y0).toFixed(4)} statt 0,06 / 0,04`);
  // Am letzten Wegpunkt endet der Takt: nichts geht ueber das Ziel hinaus.
  einheit.weg = [{ x: x0 + 0.06, y: y0 + 1.02 }];
  einheit.y = y0 + 1;
  welt.laufen(einheit);
  assert.deepEqual([einheit.x, einheit.y, einheit.weg.length], [x0 + 0.06, y0 + 1.02, 0]);
});

test('einheiten AC-70: ein getriebenes Schaf geht nach derselben Regel - zehn Felder in 143 Takten, nicht 150', () => {
  const { welt, x0, y0 } = mitPlatz();
  const schaf = [...welt.tiere.values()].find((t) => t.besitzer === 'a' && !t.geschlachtet);
  assert.ok(schaf, 'Anna hat ein Schaf');
  schaf.x = x0;
  schaf.y = y0;
  // Tempo 0,7: sieben Hundertstel Feld je Takt; zehn Felder geradeaus, Feld fuer Feld.
  schaf.weg = Array.from({ length: 10 }, (_, i) => ({ x: x0 + i + 1, y: y0 }));
  let takte = 0;
  while (schaf.weg.length && takte < 500) {
    welt.tiereTakten();
    takte += 1;
  }
  assert.deepEqual([schaf.x, schaf.y], [x0 + 10, y0]);
  assert.equal(takte, Math.ceil(10 / (0.7 / TAKTE_PRO_SEKUNDE) - 1e-6));
});
