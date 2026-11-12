// Angriffe hintereinander mit Umschalt (→ specs/10-strategie/bedienung.md
// AC-50) - Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md).
//
// Ein Gegner mit `anhaengen` kommt hinten an die Reihe dessen, der gerade auf
// Befehl angreift; faellt das Ziel, nimmt er das naechste. Wer nicht angreift,
// greift sofort an. Ein Befehl ohne Umschalt verwirft die Reihe.
//
// Die Haeuser stehen mit wenig Leben da, damit eine Miliz sie in Sekunden
// einreisst - es geht um die Reihenfolge, nicht um den Schaden.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

// Ein freies Viereck neben Annas Basis: Mitte und Halbmesser r frei.
function freiesViereck(welt, r) {
  const a = welt.spielerVon('a');
  for (let d = 9; d < 40; d++) {
    for (const [dx, dy] of [[d, 0], [0, d], [d, d], [-d, d], [d, -d]]) {
      const x = a.basis.x + dx;
      const y = a.basis.y + dy;
      let frei = true;
      for (let oy = -r; oy <= r && frei; oy++) {
        for (let ox = -r; ox <= r && frei; ox++) {
          if (!karten.begehbar(welt.karte, x + ox, y + oy) || welt.gebaeudeAn(x + ox, y + oy)) frei = false;
        }
      }
      if (frei) return { x, y };
    }
  }
  throw new Error('kein freies Viereck');
}

// Annas Miliz in der Mitte, drei Haeuser Berts um sie herum.
function aufstellen() {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const m = freiesViereck(welt, 6);
  const haeuser = [[-4, -4], [2, -4], [2, 2]].map(([dx, dy]) => {
    assert.ok(welt.platzPruefen('haus', m.x + dx, m.y + dy), 'Platz fuer ein Haus');
    const haus = welt.gebaeudeAnlegen('b', 'haus', m.x + dx, m.y + dy, true);
    haus.leben = 3;
    return haus;
  });
  const miliz = welt.einheitAnlegen('a', m.x - 1, m.y, 'miliz');
  return { welt, miliz, haeuser };
}

const befehlen = (welt, ids, ziel, anhaengen = false) => welt.nachricht('a', {
  auftrag: 'befehl', einheiten: ids, ziel: { x: ziel.x, y: ziel.y }, ...(anhaengen ? { anhaengen: true } : {}),
});

// Laeuft, bis kein Angriff mehr laeuft, und merkt sich, in welcher Reihenfolge
// die Haeuser fallen.
function ablaufen(welt, einheit, haeuser) {
  const gefallen = [];
  for (let t = 0; t < 120 * TAKTE_PRO_SEKUNDE; t++) {
    welt.takten();
    for (const h of haeuser) if (!gefallen.includes(h.id) && !welt.gebaeude.has(h.id)) gefallen.push(h.id);
    if (einheit.auftrag?.art !== 'angreifen') break;
  }
  return gefallen;
}

test('bedienung AC-50: mit Umschalt reisst eine Miliz drei Haeuser der Reihe nach ein - ohne neuen Befehl', () => {
  const { welt, miliz, haeuser } = aufstellen();
  const [h1, h2, h3] = haeuser;
  befehlen(welt, [miliz.id], h1);
  befehlen(welt, [miliz.id], h2, true);
  befehlen(welt, [miliz.id], h3, true);
  // Dasselbe Ziel ein zweites Mal kommt nicht doppelt in die Reihe.
  befehlen(welt, [miliz.id], h3, true);
  assert.equal(miliz.auftrag.ziel, h1.id, 'er bleibt am ersten');
  assert.deepEqual(miliz.angriffe.map((a) => a.ziel), [h2.id, h3.id], 'die beiden anderen warten');
  // Der Browser erfaehrt, wie viele warten.
  const draht = () => welt.zustand().einheiten.find((e) => e.i === miliz.id);
  assert.equal(draht().q, 2);

  assert.deepEqual(ablaufen(welt, miliz, haeuser), [h1.id, h2.id, h3.id], 'alle drei, der Reihe nach');
  assert.equal(miliz.angriffe.length, 0);
  assert.equal(draht().q, undefined, 'nichts wartet mehr');
});

test('bedienung AC-50: ein inzwischen gefallenes Ziel wird uebersprungen, und wer nicht angreift, greift mit Umschalt sofort an', () => {
  const { welt, miliz, haeuser } = aufstellen();
  const [h1, h2, h3] = haeuser;
  // Steht: Umschalt ist ein gewoehnlicher Angriff, nichts wartet.
  befehlen(welt, [miliz.id], h1, true);
  assert.equal(miliz.auftrag?.art, 'angreifen');
  assert.equal(miliz.auftrag.ziel, h1.id);
  assert.equal(miliz.angriffe.length, 0);
  befehlen(welt, [miliz.id], h2, true);
  befehlen(welt, [miliz.id], h3, true);
  // Das mittlere faellt durch einen anderen, bevor die Miliz hinkommt.
  welt.gebaeudeZerstoeren(h2);
  assert.deepEqual(ablaufen(welt, miliz, haeuser), [h2.id, h1.id, h3.id], 'nach dem ersten gleich zum dritten');
});

test('bedienung AC-50: ein Befehl ohne Umschalt verwirft die Reihe - ebenso ein Gang', () => {
  const { welt, miliz, haeuser } = aufstellen();
  const [h1, h2, h3] = haeuser;
  befehlen(welt, [miliz.id], h1);
  befehlen(welt, [miliz.id], h2, true);
  befehlen(welt, [miliz.id], h3);
  assert.equal(miliz.auftrag.ziel, h3.id);
  assert.equal(miliz.angriffe.length, 0, 'ohne Umschalt ist die Reihe fort');
  assert.deepEqual(ablaufen(welt, miliz, haeuser), [h3.id], 'nur das dritte faellt');

  // Umschalt auf freien Boden, waehrend er angreift: ein Gang wie ohne, die
  // Reihe der Angriffe ist fort.
  befehlen(welt, [miliz.id], h1);
  befehlen(welt, [miliz.id], h2, true);
  befehlen(welt, [miliz.id], { x: miliz.x, y: miliz.y + 3 }, true);
  assert.equal(miliz.auftrag?.art, 'gehen');
  assert.equal(miliz.angriffe.length, 0);
});
