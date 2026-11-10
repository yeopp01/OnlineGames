// Die Gebaeude der Feudalzeit (bauen AC-24) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md). Die Oberflaeche dazu steht in
// e2e/tests/strategie-feudalbauten.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, EINHEITEN } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const FEUDAL = ['schiessanlage', 'stall', 'schmiede'];

/** Eine Welt, in der Anna Holz hat und drei Bauer bereitstehen. */
function bereit() {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  anna.holz = 2000;
  anna.nahrung = 2000;
  const bauer = [...welt.einheiten.values()]
    .filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner')
    .map((e) => e.id);
  return { welt, anna, bauer };
}

/** Ein freier Platz fuer ein Gebaeude der Groesse n, ringweise um die Basis. */
function platz(welt, anna, n) {
  for (let r = 6; r < 40; r++) {
    for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const x = anna.basis.x + r * sx;
      const y = anna.basis.y + r * sy;
      if (welt.platzPruefen('schiessanlage', x, y) && welt.platzPruefen('dorfzentrum', x, y)) return { x, y };
    }
  }
  throw new Error(`kein Platz fuer ${n} Felder`);
}

test('bauen AC-24: Schiessanlage, Stall und Schmiede tragen die Werte der Vorlage', () => {
  assert.deepEqual(
    FEUDAL.map((art) => [GEBAEUDE[art].kosten, GEBAEUDE[art].bauzeit, GEBAEUDE[art].leben, GEBAEUDE[art].groesse]),
    [
      [{ holz: 175 }, 50, 1000, 3],
      [{ holz: 175 }, 50, 1000, 3],
      [{ holz: 150 }, 40, 1200, 3],
    ],
  );
  // Alle drei gehoeren der Feudalzeit, alles Aeltere der Dunklen.
  for (const art of FEUDAL) assert.equal(GEBAEUDE[art].zeitalter, 1, art);
  for (const art of ['dorfzentrum', 'haus', 'muehle', 'holzfaellerlager', 'bergbaulager', 'farm', 'kaserne']) {
    assert.equal(GEBAEUDE[art].zeitalter || 0, 0, art);
  }
  // Und der Dorfbewohner kann sie bauen.
  for (const art of FEUDAL) assert.ok(EINHEITEN.dorfbewohner.baut.includes(art), art);
});

test('bauen AC-24: in der Dunklen Zeit weist der Server sie ab, in der Feudalzeit nicht', () => {
  const { welt, anna, bauer } = bereit();
  for (const art of FEUDAL) {
    const ziel = platz(welt, anna, 3);
    const absage = welt.nachricht('a', { auftrag: 'bauen', einheiten: bauer, art, ziel }).fehler;
    assert.match(absage, /erst ab dem Lehen/, `${art}: ${absage}`);
  }
  // Nichts bezahlt, nichts gebaut.
  assert.equal(anna.holz, 2000);
  assert.equal([...welt.gebaeude.values()].filter((g) => FEUDAL.includes(g.art)).length, 0);

  // Nach dem Aufstieg geht es - und das Holz wird bezahlt.
  anna.zeitalter = 1;
  for (const art of FEUDAL) {
    const ziel = platz(welt, anna, 3);
    const vorher = anna.holz;
    const antwort = welt.nachricht('a', { auftrag: 'bauen', einheiten: bauer, art, ziel });
    assert.ok(antwort.gebaeude, `${art}: ${antwort.fehler}`);
    assert.equal(anna.holz, vorher - GEBAEUDE[art].kosten.holz, `${art} bezahlt`);
    assert.equal(welt.gebaeude.get(antwort.gebaeude).fertig, false, 'erst eine Baustelle');
  }
});

test('bauen AC-24: der Stall bildet den Spaeherreiter aus, die anderen beiden noch nichts', () => {
  const { welt, anna, bauer } = bereit();
  anna.zeitalter = 1;
  const stall = welt.gebaeudeAnlegen('a', 'stall', platz(welt, anna, 3).x, platz(welt, anna, 3).y);
  assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: stall.id, einheit: 'spaeherreiter' }), {});
  assert.equal(anna.nahrung, 2000 - 80, '80 Nahrung, wie in der Vorlage');
  const vorher = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'spaeherreiter').length;
  for (let t = 0; t < 30 * TAKTE_PRO_SEKUNDE; t++) welt.takten();
  const nachher = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'spaeherreiter').length;
  assert.equal(nachher, vorher + 1, 'nach 30 Sekunden steht er da');

  // Die Schiessanlage bildet in dieser Stufe noch nichts aus (Einheiten: B4).
  const anlage = welt.gebaeudeAnlegen('a', 'schiessanlage', platz(welt, anna, 3).x, platz(welt, anna, 3).y);
  assert.equal(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: anlage.id, einheit: 'spaeherreiter' }).fehler,
    'Das bildet dieses Gebäude nicht aus.');
  // Und ein Stall gibt keinen Wohnraum und nimmt nichts an.
  assert.equal(GEBAEUDE.stall.wohnraum, 0);
  assert.deepEqual(GEBAEUDE.schmiede.annahme, []);
});

test('bauen AC-24: gebaut wird auch nach dem Aufstieg nur auf freiem Platz, und eine Baustelle wird fertig', () => {
  const { welt, anna, bauer } = bereit();
  anna.zeitalter = 1;
  const ziel = platz(welt, anna, 3);
  const { gebaeude } = welt.nachricht('a', { auftrag: 'bauen', einheiten: bauer, art: 'schmiede', ziel });
  // Dasselbe Feld noch einmal: belegt.
  assert.equal(welt.nachricht('a', { auftrag: 'bauen', einheiten: bauer, art: 'stall', ziel }).fehler, 'Hier ist kein Platz.');
  // Die Bauer gehen hin und bauen sie fertig.
  for (let t = 0; t < 300 * TAKTE_PRO_SEKUNDE && !welt.gebaeude.get(gebaeude).fertig; t++) welt.takten();
  const fertig = welt.gebaeude.get(gebaeude);
  assert.equal(fertig.fertig, true, 'die Schmiede steht');
  assert.equal(fertig.leben, GEBAEUDE.schmiede.leben);
  // Ihre Grundflaeche ist jetzt versperrt.
  assert.equal(karten.begehbar(welt.karte, ziel.x, ziel.y), false);
});

test('bauen AC-24: Bert sieht die Gebaeude von Anna, aber sein Zeitalter gilt fuer ihn', () => {
  const { welt, anna } = bereit();
  anna.zeitalter = 1;
  welt.gebaeudeAnlegen('a', 'stall', platz(welt, anna, 3).x, platz(welt, anna, 3).y);
  const bert = welt.spielerVon('b');
  bert.holz = 2000;
  const seine = [...welt.einheiten.values()].filter((e) => e.besitzer === 'b' && e.art === 'dorfbewohner').map((e) => e.id);
  const ziel = { x: bert.basis.x + 7, y: bert.basis.y + 7 };
  assert.match(welt.nachricht('b', { auftrag: 'bauen', einheiten: seine, art: 'stall', ziel }).fehler,
    /erst ab dem Lehen/, 'Bert ist noch in der Dunklen Zeit');
});
