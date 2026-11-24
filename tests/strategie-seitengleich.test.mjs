// Gleiche Heere, gleiche Chancen (→ specs/10-strategie/kampf.md AC-26). Bis
// zum 2026-11-22 gewann im Gefechtsstand bei gleichen Heeren die Seite
// rechts - Miliz gegen Miliz 222 von 400, Bogen gegen Bogen 202 zu 103. Drei
// Ursachen, je eine Probe unten: die Reihenfolge der Einheiten im Takt, die
// Reichweite gegen die schon bewegte Lage, und Gleichstaende, die an der
// Himmelsrichtung hingen (Wegsuche, Wahl des Ziels und des Platzes).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt } = require('../server/spiele/strategie/welt.js');
const { suchen } = require('../server/spiele/strategie/wege.js');
const { gefechtSpielen } = require('../server/spiele/strategie/pruefstand.js');
const { EINHEITEN } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Ben' }];

test('kampf AC-26: dieselbe Partie zweimal gerechnet verlaeuft Takt fuer Takt gleich, ein anderer Startwert anders', () => {
  const einmal = gefechtSpielen({ links: 'miliz', rechts: 'miliz', startwert: 7, spurFuehren: true });
  const nochmal = gefechtSpielen({ links: 'miliz', rechts: 'miliz', startwert: 7, spurFuehren: true });
  assert.deepEqual(nochmal.spur, einmal.spur);
  assert.equal(nochmal.sieger, einmal.sieger);
  const anders = gefechtSpielen({ links: 'miliz', rechts: 'miliz', startwert: 8, spurFuehren: true });
  assert.notDeepEqual(anders.spur, einmal.spur);
});

test('kampf AC-26: die Reihenfolge der Einheiten wechselt von Takt zu Takt, die Liste der Einheiten bleibt in der Reihenfolge des Anlegens', () => {
  const welt = new Welt(ZWEI, 3, { sicht: 'aufgedeckt' });
  const basis = welt.spielerVon('a').basis;
  for (let i = 0; i < 6; i++) welt.einheitAnlegen(i % 2 ? 'a' : 'b', basis.x + 3 + i, basis.y + 3, 'miliz');
  const angelegt = [...welt.einheiten.keys()];
  const folgen = new Set();
  for (let t = 0; t < 20; t++) {
    welt.takten();
    assert.deepEqual([...welt.einheiten.keys()], angelegt, 'die Map bleibt, wie sie angelegt wurde');
    assert.equal(welt.reihe.length, angelegt.length);
    folgen.add(welt.reihe.map((e) => e.id).join(','));
  }
  assert.ok(folgen.size >= 15, `nur ${folgen.size} verschiedene Reihenfolgen in 20 Takten`);
  // Aus dem Startwert: eine zweite Welt mit demselben Startwert mischt gleich.
  const zweite = new Welt(ZWEI, 3, { sicht: 'aufgedeckt' });
  for (let i = 0; i < 6; i++) zweite.einheitAnlegen(i % 2 ? 'a' : 'b', basis.x + 3 + i, basis.y + 3, 'miliz');
  welt.takten();
  for (let t = 0; t < 21; t++) zweite.takten();
  assert.deepEqual(zweite.reihe.map((e) => e.id), welt.reihe.map((e) => e.id));
});

test('kampf AC-26: die Reichweite misst gegen die Lage zu Beginn des Takts, nicht gegen die schon gegangene', () => {
  const welt = new Welt(ZWEI, 3, { sicht: 'aufgedeckt' });
  welt.einheiten.clear();
  const basis = welt.spielerVon('a').basis;
  const a = welt.einheitAnlegen('a', basis.x + 4, basis.y + 4, 'miliz');
  const b = welt.einheitAnlegen('b', basis.x + 7, basis.y + 4, 'miliz');
  // Wie im Takt: erst die Reihenfolge, dann geht b, dann rechnet a.
  welt.reihenfolge();
  b.x -= 1.9;
  assert.equal(b.taktX, basis.x + 7, 'b stand zu Beginn des Takts drei Felder weg');
  welt.angriffBeginnen(a, b, false);
  welt.einheitTakten(a);
  assert.equal(b.leben, EINHEITEN.miliz.leben, 'noch kein Schlag: zu Beginn des Takts stand b nicht in Reichweite');
});

test('kampf AC-26: ein Weg gleicher Laenge haengt nicht an der Himmelsrichtung - um die Mitte gedreht, ist er gedreht', () => {
  const karte = karten.erzeugen(7, 2);
  karte.felder.fill(karten.GRAS);
  const g = karte.groesse;
  const drehen = (f) => ({ x: g - 1 - f.x, y: g - 1 - f.y });
  const tauschen = (f) => ({ x: f.y, y: f.x });
  const paare = [
    [{ x: 20, y: 20 }, { x: 31, y: 25 }],
    [{ x: 40, y: 12 }, { x: 33, y: 30 }],
    [{ x: 15, y: 44 }, { x: 27, y: 37 }],
  ];
  for (const [von, nach] of paare) {
    const weg = suchen(karte, von, nach);
    assert.ok(weg.length > 0);
    assert.deepEqual(suchen(karte, drehen(von), drehen(nach)), weg.map(drehen), `${JSON.stringify(von)} gedreht`);
    // Gespiegelt an der Diagonale: der Weg auf der anderen Seite der Linie.
    const gespiegelt = suchen(karte, tauschen(von), tauschen(nach)).map(tauschen);
    assert.equal(gespiegelt.length, weg.length);
  }
});

test('kampf AC-26: gleiche Heere gewinnen auf beiden Seiten gleich oft - ueber 200 Startwerte je Einheitenart', () => {
  // Gemessen am 2026-11-22 (400 Startwerte, links : rechts : ohne Sieger):
  // vorher Miliz 175 : 222, Speer 238 : 162, Bogen 103 : 202, Plaenkler
  // 174 : 226; danach 165 : 161, 210 : 189, 88 : 97, 98 : 80. "Innerhalb der
  // Streuung" heisst: der Abstand ist kleiner als das Dreifache der Streuung
  // eines Muenzwurfs ueber die entschiedenen Gefechte.
  const arten = ['miliz', 'speerkaempfer', 'spaeherreiter', 'bogenschuetze', 'plaenkler', 'ritter'];
  for (const art of arten) {
    let links = 0;
    let rechts = 0;
    for (let startwert = 1; startwert <= 200; startwert++) {
      const e = gefechtSpielen({ links: art, rechts: art, startwert, budget: art === 'ritter' ? 1200 : 600, minuten: 10 });
      if (e.sieger === 'links') links++;
      else if (e.sieger === 'rechts') rechts++;
    }
    const entschieden = links + rechts;
    assert.ok(entschieden >= 50, `${art}: nur ${entschieden} von 200 entschieden`);
    const streuung = Math.sqrt(entschieden) / 2;
    assert.ok(Math.abs(links - rechts) / 2 <= 3 * streuung, `${art}: links ${links}, rechts ${rechts}`);
  }
});
