// Die Pferdezucht (→ specs/10-strategie/bauen.md AC-46): eine Verbesserung
// im Stall, ab dem Fuerstentum - jeder Reiter ist danach ein Zehntel
// schneller. Rechenteil, direkt geprueft (→ docs/adr/0004-teststrategie.md).
// Die Oberflaeche dazu: e2e/tests/strategie-pferdezucht.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, EINHEITEN, VERBESSERUNGEN } = require('../server/spiele/strategie/daten.js');
const { bringt } = require('../server/spiele/strategie/bringt.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const REITER = ['spaeherreiter', 'leichtekavallerie', 'ritter'];
const sekunden = (welt, s) => { for (let t = 0; t < s * TAKTE_PRO_SEKUNDE; t++) welt.takten(); };

/** Eine Welt, in der Anna genug hat und einen fertigen Stall. */
function mitStall(zeitalter) {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  const anna = welt.spielerVon('a');
  anna.zeitalter = zeitalter;
  welt.zeitalterWirkungen(anna);
  Object.assign(anna, { nahrung: 3000, holz: 3000, gold: 3000, stein: 1000 });
  for (let r = 6; r < 30; r++) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r], [r, r], [-r, r]]) {
      if (!welt.platzPruefen('stall', anna.basis.x + dx, anna.basis.y + dy)) continue;
      return { welt, anna, stall: welt.gebaeudeAnlegen('a', 'stall', anna.basis.x + dx, anna.basis.y + dy) };
    }
  }
  throw new Error('kein Platz fuer den Stall');
}
const bestellen = (welt, stall) => welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: stall.id, einheit: 'pferdezucht' });

test('bauen AC-46: die Pferdezucht steht im Stall ab dem Fuerstentum - 150 Nahrung, 40 Sekunden', () => {
  const p = VERBESSERUNGEN.pferdezucht;
  assert.equal(p.name, 'Pferdezucht');
  assert.deepEqual(p.kosten, { nahrung: 150 });
  assert.deepEqual([p.zeit, p.zeitalter], [40, 2]);
  assert.ok(GEBAEUDE.stall.bildetAus.includes('pferdezucht'));
  for (const [art, werte] of Object.entries(GEBAEUDE)) {
    if (art !== 'stall') assert.ok(!werte.bildetAus.includes('pferdezucht'), `nur im Stall, nicht: ${art}`);
  }
  // Im Lehen abgewiesen.
  const lehen = mitStall(1);
  assert.match(bestellen(lehen.welt, lehen.stall).fehler, /ab dem Fürstentum/);
  assert.equal(lehen.anna.nahrung, 3000);
  // Im Fuerstentum bestellt, bezahlt und nach 40 Sekunden erforscht.
  const { welt, anna, stall } = mitStall(2);
  assert.deepEqual(bestellen(welt, stall), {});
  assert.equal(anna.nahrung, 3000 - 150);
  sekunden(welt, p.zeit - 1);
  assert.ok(!anna.verbesserungen.includes('pferdezucht'), 'noch nicht');
  sekunden(welt, 2);
  assert.ok(anna.verbesserungen.includes('pferdezucht'));
  // Einmal: ein zweites Mal steht sie nicht zur Wahl.
  assert.ok(bestellen(welt, stall).fehler, 'kein zweites Mal');
});

test('bauen AC-46: nach der Pferdezucht ist jeder Reiter ein Zehntel schneller - Fussvolk, Karren und Berts Reiter nicht', () => {
  const { welt, anna } = mitStall(2);
  const vorher = Object.fromEntries(Object.keys(EINHEITEN).map((art) => [art, welt.einheitenwert('a', art, 'tempo')]));
  // Der Spaeherreiter traegt schon den Zuschlag des Lehens (einheiten AC-57).
  assert.equal(vorher.spaeherreiter.toFixed(2), '1.55');
  assert.equal(vorher.ritter, 1.35);

  welt.erforschen(anna, 'pferdezucht');
  for (const art of Object.keys(EINHEITEN)) {
    const nachher = welt.einheitenwert('a', art, 'tempo');
    if (EINHEITEN[art].klassen.includes('kavallerie')) {
      assert.ok(Math.abs(nachher / vorher[art] - 1.1) < 0.001, `${art}: ${vorher[art]} -> ${nachher}`);
    } else {
      assert.equal(nachher, vorher[art], `${art} bleibt`);
    }
    assert.equal(welt.einheitenwert('b', art, 'tempo'), EINHEITEN[art].tempo, `Berts ${art}`);
  }
  // Die drei, die es heute trifft - mit dem Zuschlag des Lehens gerechnet.
  for (const art of REITER) assert.ok(EINHEITEN[art].klassen.includes('kavallerie'), art);
  assert.equal(welt.einheitenwert('a', 'ritter', 'tempo'), 1.485);
  assert.equal(welt.einheitenwert('a', 'leichtekavallerie', 'tempo'), 1.705);
  assert.equal(welt.einheitenwert('a', 'spaeherreiter', 'tempo'), 1.705);
  assert.equal(welt.einheitenwert('a', 'marktkarren', 'tempo'), EINHEITEN.marktkarren.tempo);
  // Auf der Leitung: die Tafel der Kampfwerte traegt das neue Tempo.
  assert.equal(welt.kampfwerte('a').ritter.tempo, 1.485);
  assert.equal(welt.kampfwerte('b').ritter.tempo, 1.35);
});

/** Wie viele Takte ein Ritter fuer denselben Weg braucht. */
function ritt(mitZucht) {
  const { welt, anna } = mitStall(2);
  if (mitZucht) welt.erforschen(anna, 'pferdezucht');
  const ritter = welt.einheitAnlegen('a', anna.basis.x + 2, anna.basis.y + 3, 'ritter');
  const bert = welt.spielerVon('b');
  const ziel = { x: Math.round((anna.basis.x + bert.basis.x) / 2), y: Math.round((anna.basis.y + bert.basis.y) / 2) };
  assert.equal(welt.nachricht('a', { auftrag: 'befehl', einheiten: [ritter.id], ziel })?.fehler, undefined);
  const start = { x: ritter.x, y: ritter.y };
  let takte = 0;
  while (ritter.weg && ritter.weg.length && takte < 3000) {
    welt.takten();
    takte += 1;
  }
  return { takte, strecke: Math.hypot(ritter.x - start.x, ritter.y - start.y) };
}

// Gemessen 337 gegen 296 Takte, das 1,14-fache und nicht das 1,10-fache:
// `welt.laufen()` verliert an jedem Wegpunkt den Rest des Takts, ein Feld
// kostet den Ritter also acht ganze Takte (1 / 0,135 = 7,4) und mit der
// Pferdezucht sieben (1 / 0,1485 = 6,7). Das Tempo im Spiel ist dadurch
// gestuft - fuer jede Einheit, nicht erst seit dieser Verbesserung.
test('bauen AC-46: derselbe Ritt dauert mit der Pferdezucht spuerbar kuerzer - um ein Zehntel bis ein Sechstel', () => {
  const ohne = ritt(false);
  const mit = ritt(true);
  assert.ok(ohne.strecke > 15, `ein Weg, der zaehlt: ${ohne.strecke.toFixed(1)} Felder`);
  assert.ok(Math.abs(mit.strecke - ohne.strecke) < 1.5, 'dasselbe Ziel');
  const anteil = ohne.takte / mit.takte;
  assert.ok(anteil > 1.07 && anteil < 1.17, `ohne ${ohne.takte} Takte, mit ${mit.takte}: das ${anteil.toFixed(3)}-fache`);
});

test('bauen AC-46: an der Tafel steht, was sie bringt - Kavallerie: +10 % Tempo', () => {
  assert.deepEqual(bringt(VERBESSERUNGEN.pferdezucht), ['Kavallerie: +10 % Tempo']);
});
