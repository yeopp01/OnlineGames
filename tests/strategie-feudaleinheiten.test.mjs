// Die Einheiten der Feudalzeit (einheiten AC-23) - Rechenteile, direkt
// geprueft (→ docs/adr/0004-teststrategie.md). Die Oberflaeche dazu steht in
// e2e/tests/strategie-feudaleinheiten.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, EINHEITEN } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const NEU = ['speerkaempfer', 'bogenschuetze', 'plaenkler'];

/** Eine Welt, in der Anna alles hat, was sie braucht. */
function bereit(zeitalter = 0) {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  anna.holz = 2000;
  anna.nahrung = 2000;
  anna.gold = 2000;
  anna.stein = 2000;
  anna.zeitalter = zeitalter;
  // Zwei Haeuser: ohne sie ist nach der fuenften Einheit Schluss, und die
  // Schlange wartet auf Platz statt auszubilden.
  for (let i = 0; i < 2; i++) {
    const p = platz(welt, anna);
    welt.gebaeudeAnlegen('a', 'haus', p.x, p.y);
  }
  return { welt, anna };
}

/** Ein freier Platz fuer ein Gebaeude, ringweise um die Basis. */
function platz(welt, anna) {
  for (let r = 6; r < 40; r++) {
    for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const x = anna.basis.x + r * sx;
      const y = anna.basis.y + r * sy;
      if (welt.platzPruefen('kaserne', x, y) && welt.platzPruefen('dorfzentrum', x, y)) return { x, y };
    }
  }
  throw new Error('kein Platz');
}

function zaehlen(welt, art) {
  return [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === art).length;
}

test('einheiten AC-23: die drei neuen Einheiten tragen die Werte der Vorlage', () => {
  assert.deepEqual(
    NEU.map((art) => {
      const e = EINHEITEN[art];
      return [e.kosten, e.zeit, e.leben, e.angriff, `${e.nahruestung}/${e.fernruestung}`, e.reichweite, e.tempo];
    }),
    [
      [{ nahrung: 35, holz: 25 }, 22, 45, 3, '0/0', 0, 1.0],
      [{ holz: 25, gold: 45 }, 35, 30, 4, '0/0', 4, 0.96],
      [{ nahrung: 25, holz: 35 }, 22, 30, 2, '0/3', 4, 0.96],
    ],
  );
  // Alle drei gehoeren der Feudalzeit, die drei alten der Dunklen.
  for (const art of NEU) assert.equal(EINHEITEN[art].zeitalter, 1, art);
  for (const art of ['dorfbewohner', 'spaeherreiter', 'miliz']) {
    assert.equal(EINHEITEN[art].zeitalter || 0, 0, art);
  }
  // Fernkaempfer schiessen aus vier Feldern, Nahkaempfer gar nicht.
  assert.equal(EINHEITEN.speerkaempfer.reichweite, 0);
  assert.equal(EINHEITEN.miliz.reichweite, 0);
});

test('einheiten AC-23: der Kreis - Speer schlaegt Reiter, Bogen schlaegt Speer, Plaenkler schlaegt Bogen', () => {
  // Der Bonus greift an der Ruestungsklasse des Ziels, nicht an seiner Art -
  // so trifft er spaeter auch den Ritter und den Armbrustschuetzen.
  assert.deepEqual(EINHEITEN.speerkaempfer.bonus, { kavallerie: 15 });
  assert.deepEqual(EINHEITEN.bogenschuetze.bonus, { speer: 3 });
  assert.deepEqual(EINHEITEN.plaenkler.bonus, { bogenschuetze: 3 });
  // Und jedes Ziel traegt die Klasse, auf die der Bonus zielt.
  assert.ok(EINHEITEN.spaeherreiter.klassen.includes('kavallerie'));
  assert.ok(EINHEITEN.speerkaempfer.klassen.includes('speer'));
  assert.ok(EINHEITEN.bogenschuetze.klassen.includes('bogenschuetze'));
  // Der Speerkaempfer ist auch Infanterie - sonst findet ihn spaeter kein
  // Bonus, der gegen Infanterie geht.
  assert.ok(EINHEITEN.speerkaempfer.klassen.includes('infanterie'));
});

test('einheiten AC-23: in der Dunklen Zeit bildet die Kaserne den Speerkaempfer nicht aus', () => {
  const { welt, anna } = bereit(0);
  const ziel = platz(welt, anna);
  const kaserne = welt.gebaeudeAnlegen('a', 'kaserne', ziel.x, ziel.y);
  // Die Miliz geht, der Speerkaempfer nicht - dasselbe Gebaeude, anderes Zeitalter.
  assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kaserne.id, einheit: 'miliz' }), {});
  const absage = welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kaserne.id, einheit: 'speerkaempfer' }).fehler;
  assert.match(absage, /erst in der Feudalzeit/, absage);
  assert.equal(anna.holz, 2000, 'nichts bezahlt');
});

test('einheiten AC-23: nach dem Aufstieg bildet die Kaserne den Speerkaempfer aus', () => {
  const { welt, anna } = bereit(1);
  const ziel = platz(welt, anna);
  const kaserne = welt.gebaeudeAnlegen('a', 'kaserne', ziel.x, ziel.y);
  assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kaserne.id, einheit: 'speerkaempfer' }), {});
  assert.equal(anna.nahrung, 2000 - 35, '35 Nahrung');
  assert.equal(anna.holz, 2000 - 25, '25 Holz');
  const vorher = zaehlen(welt, 'speerkaempfer');
  for (let t = 0; t < 22 * TAKTE_PRO_SEKUNDE + 2; t++) welt.takten();
  assert.equal(zaehlen(welt, 'speerkaempfer'), vorher + 1, 'nach 22 Sekunden steht er da');
  // Und er traegt die Werte aus den Daten.
  const neuer = [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'speerkaempfer');
  assert.equal(neuer.leben, EINHEITEN.speerkaempfer.leben);
});

test('einheiten AC-23: die Schiessanlage bildet Bogenschuetze und Plaenkler aus', () => {
  const { welt, anna } = bereit(1);
  assert.deepEqual(GEBAEUDE.schiessanlage.bildetAus, ['bogenschuetze', 'plaenkler']);
  assert.deepEqual(GEBAEUDE.kaserne.bildetAus, ['miliz', 'speerkaempfer']);
  assert.deepEqual(GEBAEUDE.stall.bildetAus, ['spaeherreiter']);
  // Die Schmiede forscht nur - sie bildet nichts aus (das kommt mit B6).
  assert.deepEqual(GEBAEUDE.schmiede.bildetAus, []);

  const ziel = platz(welt, anna);
  const anlage = welt.gebaeudeAnlegen('a', 'schiessanlage', ziel.x, ziel.y);
  for (const art of ['bogenschuetze', 'plaenkler']) {
    assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: anlage.id, einheit: art }), {}, art);
  }
  // Die Kaserne bildet keinen Bogenschuetzen aus - jedes Gebaeude sein Handwerk.
  assert.equal(
    welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: welt.gebaeudeAnlegen('a', 'kaserne', platz(welt, anna).x, platz(welt, anna).y).id, einheit: 'bogenschuetze' }).fehler,
    'Das bildet dieses Gebaeude nicht aus.',
  );
  // Beide kommen nacheinander aus der Schlange: 35 s, dann 22 s.
  for (let t = 0; t < (35 + 22) * TAKTE_PRO_SEKUNDE + 4; t++) welt.takten();
  assert.equal(zaehlen(welt, 'bogenschuetze'), 1);
  assert.equal(zaehlen(welt, 'plaenkler'), 1);
});

test('einheiten AC-23: ein Abbruch erstattet voll, auch beim Speerkaempfer', () => {
  const { welt, anna } = bereit(1);
  const ziel = platz(welt, anna);
  const kaserne = welt.gebaeudeAnlegen('a', 'kaserne', ziel.x, ziel.y);
  welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kaserne.id, einheit: 'speerkaempfer' });
  for (let t = 0; t < 10 * TAKTE_PRO_SEKUNDE; t++) welt.takten();
  assert.deepEqual(welt.nachricht('a', { auftrag: 'abbrechen', gebaeude: kaserne.id, platz: 0 }), {});
  assert.equal(anna.nahrung, 2000, 'Nahrung zurueck');
  assert.equal(anna.holz, 2000, 'Holz zurueck');
});
