// Der Markt (bauen AC-33) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md). Die Oberflaeche dazu:
// e2e/tests/strategie-markt.spec.mjs. Getauscht wird ueber `welt.nachricht`,
// denselben Weg, den der Browser nimmt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE, HANDEL } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

// Ein freier Platz fuer ein Gebaeude nahe der Basis - aus `platzPruefen`,
// nicht aus einer eigenen Regel. `ohne` sind Plaetze, die schon vergeben sind.
function platzFuer(welt, art, basis, ohne = []) {
  for (let r = 6; r < 40; r++) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r], [r, r], [-r, r], [r, -r], [-r, -r]]) {
      const x = basis.x + dx;
      const y = basis.y + dy;
      if (ohne.some((o) => Math.abs(o.x - x) < 6 && Math.abs(o.y - y) < 6)) continue;
      if (welt.platzPruefen(art, x, y)) return { x, y };
    }
  }
  throw new Error(`kein Platz fuer ${art}`);
}

/** Anna mit einem fertigen Markt und reichlich Vorrat. */
function mitMarkt({ fertig = true } = {}) {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  Object.assign(anna, { holz: 2000, nahrung: 2000, gold: 2000, stein: 2000, zeitalter: 1 });
  const ort = platzFuer(welt, 'markt', anna.basis);
  const markt = welt.gebaeudeAnlegen('a', 'markt', ort.x, ort.y, fertig);
  return { welt, anna, markt, ort };
}

const handeln = (welt, markt, ware, richtung, wer = 'a') => welt.nachricht(wer, { auftrag: 'handeln', gebaeude: markt.id, ware, richtung });
const vorrat = (s) => ({ holz: s.holz, nahrung: s.nahrung, gold: s.gold, stein: s.stein });

test('bauen AC-33: der Markt mit den Werten der Vorlage - 175 Holz, 60 Sekunden, 1300 Leben, ab der Feudalzeit', () => {
  const m = GEBAEUDE.markt;
  assert.deepEqual(m.kosten, { holz: 175 });
  assert.equal(m.bauzeit, 60);
  assert.equal(m.leben, 1300);
  assert.equal(m.zeitalter, 1);
  assert.equal(m.handel, true);
  assert.ok(EINHEITEN.dorfbewohner.baut.includes('markt'), 'ein Dorfbewohner baut ihn');
  // Der Handel aus der Vorlage: 100 je Tausch, Grundpreis 100, Stein 130,
  // Gebuehr 30 %.
  assert.equal(HANDEL.menge, 100);
  assert.deepEqual(HANDEL.waren, { holz: 100, nahrung: 100, stein: 130 });
  assert.equal(HANDEL.gebuehr, 0.3);
});

test('bauen AC-33: Schritt und Tiefstpreis erfuellen die Vorlage - 4000 Holz oder Nahrung, 5500 Stein bis ganz unten', () => {
  // Die Vorlage nennt keine Zahl fuer den Schritt, wohl aber, wie viel man
  // verkauft, bis der Preis unten ist. Gemessen am Markt, nicht ausgerechnet.
  for (const [ware, menge] of [['holz', 4000], ['nahrung', 4000], ['stein', 5500]]) {
    const { welt, anna, markt } = mitMarkt();
    anna[ware] = menge + 1000;
    const preise = [];
    for (let i = 0; i < menge / HANDEL.menge + 3; i++) {
      assert.equal(handeln(welt, markt, ware, 'verkaufen').fehler, undefined);
      preise.push(anna.preise[ware]);
    }
    const unten = preise.indexOf(HANDEL.tiefst);
    assert.equal((unten + 1) * HANDEL.menge, menge, `${ware}: nach ${menge} unten`);
    assert.ok(preise.slice(unten).every((p) => p === HANDEL.tiefst), `${ware}: bleibt unten`);
  }
});

test('bauen AC-33: kaufen kostet Gold, verkaufen bringt Gold - zwischen beiden liegen 30 % Gebuehr', () => {
  const { welt, anna, markt } = mitMarkt();
  // Am Anfang: 100 Holz kosten 130 Gold und bringen 70, Stein 169 und 91.
  assert.deepEqual(welt.handelspreise('a'), { holz: [130, 70], nahrung: [130, 70], stein: [169, 91] });
  const vorher = vorrat(anna);
  assert.equal(handeln(welt, markt, 'holz', 'kaufen').fehler, undefined);
  assert.deepEqual(vorrat(anna), { ...vorher, holz: vorher.holz + 100, gold: vorher.gold - 130 });
  const mitte = vorrat(anna);
  assert.equal(handeln(welt, markt, 'stein', 'verkaufen').fehler, undefined);
  assert.deepEqual(vorrat(anna), { ...mitte, stein: mitte.stein - 100, gold: mitte.gold + 91 });
  // Kaufen und gleich wieder verkaufen lohnt nie: das ist die Gebuehr.
  const [kauf, verkauf] = welt.handelspreise('a').nahrung;
  assert.ok(verkauf < kauf);
  assert.equal(Math.round((kauf - verkauf) / (kauf + verkauf) * 100), 30, 'Kauf- und Verkaufspreis liegen je 30 % um den Grundpreis');
});

test('bauen AC-33: jeder Kauf macht die Ware teurer, jeder Verkauf billiger - nur diese Ware', () => {
  const { welt, markt } = mitMarkt();
  const preis = () => welt.handelspreise('a');
  const start = preis();
  handeln(welt, markt, 'nahrung', 'kaufen');
  const nachKauf = preis();
  assert.ok(nachKauf.nahrung[0] > start.nahrung[0], 'Kaufpreis steigt');
  assert.ok(nachKauf.nahrung[1] > start.nahrung[1], 'auch der Verkaufspreis');
  assert.deepEqual([nachKauf.holz, nachKauf.stein], [start.holz, start.stein], 'die anderen Waren bleiben');
  handeln(welt, markt, 'nahrung', 'verkaufen');
  handeln(welt, markt, 'nahrung', 'verkaufen');
  assert.ok(preis().nahrung[0] < start.nahrung[0], 'nach zwei Verkaeufen billiger als am Anfang');
});

test('bauen AC-33: die Preise gelten je Spieler und je Spieler fuer alle seine Maerkte', () => {
  const { welt, anna, markt } = mitMarkt();
  const bert = welt.spielerVon('b');
  Object.assign(bert, { gold: 1000, zeitalter: 1 });
  const ort = platzFuer(welt, 'markt', bert.basis);
  const bertsMarkt = welt.gebaeudeAnlegen('b', 'markt', ort.x, ort.y, true);
  const zweiter = platzFuer(welt, 'markt', anna.basis, [{ x: markt.x, y: markt.y }]);
  const annasZweiter = welt.gebaeudeAnlegen('a', 'markt', zweiter.x, zweiter.y, true);
  for (let i = 0; i < 5; i++) handeln(welt, markt, 'stein', 'kaufen');
  assert.deepEqual(welt.handelspreise('b').stein, [169, 91], 'Annas Kaeufe aendern Berts Preise nicht');
  const goldVorher = anna.gold;
  handeln(welt, annasZweiter, 'stein', 'kaufen');
  assert.equal(goldVorher - anna.gold, Math.round((130 + 5 * HANDEL.schritt) * 1.3), 'am zweiten Markt gilt Annas Preis');
  // Einen fremden Markt nutzt man nicht - Handel zwischen Maerkten gibt es
  // nicht (ADR-0012).
  assert.match(handeln(welt, bertsMarkt, 'holz', 'kaufen').fehler || '', /nicht dein/);
});

test('bauen AC-33: Absagen - zu wenig Gold, zu wenig Ware, kein Markt, Baustelle, Gold ist keine Ware; eine Absage kostet nichts', () => {
  const { welt, anna, markt } = mitMarkt();
  const muehleOrt = platzFuer(welt, 'muehle', anna.basis, [{ x: markt.x, y: markt.y }]);
  const muehle = welt.gebaeudeAnlegen('a', 'muehle', muehleOrt.x, muehleOrt.y, true);
  const baustellenOrt = platzFuer(welt, 'markt', anna.basis, [{ x: markt.x, y: markt.y }, muehleOrt]);
  const baustelle = welt.gebaeudeAnlegen('a', 'markt', baustellenOrt.x, baustellenOrt.y, false);
  anna.gold = 129;
  anna.holz = 99;
  const vorher = vorrat(anna);
  const preiseVorher = { ...anna.preise };
  assert.match(handeln(welt, markt, 'holz', 'kaufen').fehler, /Gold/);
  assert.match(handeln(welt, markt, 'holz', 'verkaufen').fehler, /Holz/);
  assert.match(welt.nachricht('a', { auftrag: 'handeln', gebaeude: muehle.id, ware: 'nahrung', richtung: 'kaufen' }).fehler, /nicht gehandelt/);
  assert.match(handeln(welt, baustelle, 'stein', 'verkaufen').fehler, /nicht fertig/);
  assert.match(handeln(welt, markt, 'gold', 'verkaufen').fehler, /Ware/);
  assert.match(handeln(welt, markt, 'holz', 'schenken').fehler, /verkaufen/);
  assert.deepEqual(vorrat(anna), vorher);
  assert.deepEqual(anna.preise, preiseVorher);
  // Mit genau genug geht es.
  anna.gold = 130;
  assert.equal(handeln(welt, markt, 'holz', 'kaufen').fehler, undefined);
  assert.equal(anna.gold, 0);
});

test('bauen AC-33: der Browser bekommt die eigenen Preise im Aufbau und nach einem Handel - fremde nie', () => {
  const welt = new Welt(ZWEI, 7, { sicht: 'nebel' });
  const anna = welt.spielerVon('a');
  Object.assign(anna, { gold: 1000, zeitalter: 1 });
  const ort = platzFuer(welt, 'markt', anna.basis);
  const markt = welt.gebaeudeAnlegen('a', 'markt', ort.x, ort.y, true);
  const aufbau = welt.aufbauFuer('a');
  assert.deepEqual(aufbau.spieler.find((s) => s.id === 'a').hp, welt.handelspreise('a'));
  assert.equal(aufbau.spieler.find((s) => s.id === 'b').hp, undefined, 'Berts Preise nicht in Annas Aufbau');
  assert.deepEqual(aufbau.werte.handel, { menge: 100, waren: ['holz', 'nahrung', 'stein'] });
  welt.takten();
  const ruhig = welt.zustandJeSpieler(['a', 'b']).get('a');
  assert.equal(ruhig.spieler.find((s) => s.id === 'a').hp, undefined, 'ohne Handel keine Preise');
  handeln(welt, markt, 'holz', 'kaufen');
  welt.takten();
  const je = welt.zustandJeSpieler(['a', 'b']);
  assert.deepEqual(je.get('a').spieler.find((s) => s.id === 'a').hp.holz, [133, 71], 'nach dem Kauf: Grundpreis 102');
  assert.equal(je.get('b').spieler.find((s) => s.id === 'a').hp, undefined, 'Bert erfaehrt Annas Preise nicht');
});
