// Der Marktkarren (einheiten AC-39) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md). Ausgebildet und befohlen wird ueber
// `welt.nachricht`, denselben Weg, den der Browser nimmt. Was er handelt,
// kommt mit AC-40. Die Oberflaeche: e2e/tests/strategie-marktkarren.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const sekunden = (welt, s) => { for (let t = 0; t < s * TAKTE_PRO_SEKUNDE; t++) welt.takten(); };

/**
 * Anna in der Ritterzeit, satt, und ein freier Platz von elf mal elf Feldern
 * neben ihrem Dorf, weit weg von allen Einheiten. `x0`, `y0` ist seine Ecke.
 */
function ritterzeitMitPlatz() {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  const anna = welt.spielerVon('a');
  anna.zeitalter = 2;
  Object.assign(anna, { nahrung: 2000, holz: 2000, gold: 2000, stein: 500 });
  for (let r = 6; r < 40; r++) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r], [r, r], [-r, r], [r, -r], [-r, -r]]) {
      const x0 = anna.basis.x + dx;
      const y0 = anna.basis.y + dy;
      let frei = true;
      for (let y = y0; y < y0 + 11 && frei; y++) {
        for (let x = x0; x < x0 + 11 && frei; x++) frei = welt.platzPruefen('haus', x, y) && welt.platzPruefen('haus', x + 1, y + 1);
      }
      if (frei && ![...welt.einheiten.values()].some((e) => e.x >= x0 - 6 && e.x <= x0 + 16 && e.y >= y0 - 6 && e.y <= y0 + 16)) {
        return { welt, anna, x0, y0 };
      }
    }
  }
  throw new Error('kein freier Platz');
}

const karrenVon = (welt, wer) => [...welt.einheiten.values()].filter((e) => e.art === 'marktkarren' && e.besitzer === wer && !e.tot);

test('einheiten AC-39: der Marktkarren mit den Werten der Vorlage - 100 Holz, 50 Gold, 70 Leben, 0/0, Tempo 1,0, greift nicht an', () => {
  const k = EINHEITEN.marktkarren;
  assert.deepEqual([k.leben, k.tempo, k.nahruestung, k.fernruestung], [70, 1.0, 0, 0]);
  assert.deepEqual(k.kosten, { holz: 100, gold: 50 });
  assert.equal(k.angriff, 0, 'er greift nie an');
  assert.equal(k.wacht, false, 'ohne Angriff wacht er nicht');
  assert.equal(k.zeitalter, 2, 'erst ab der Ritterzeit - Abweichung nach ADR-0013');
  assert.ok(GEBAEUDE.markt.bildetAus.includes('marktkarren'), 'der Markt bildet ihn aus');
  // Nur der Markt: kein anderes Gebaeude bietet ihn an.
  const anbieter = Object.keys(GEBAEUDE).filter((art) => GEBAEUDE[art].bildetAus?.includes('marktkarren'));
  assert.deepEqual(anbieter, ['markt']);
});

test('einheiten AC-39: am Markt erst in der Ritterzeit ausgebildet - bezahlt beim Bestellen, nach seiner Zeit steht er da und belegt einen Wohnplatz', () => {
  const { welt, anna, x0, y0 } = ritterzeitMitPlatz();
  const markt = welt.gebaeudeAnlegen('a', 'markt', x0 + 4, y0 + 4);
  const bestellen = () => welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: markt.id, einheit: 'marktkarren' });
  anna.zeitalter = 1;
  assert.match(bestellen().fehler, /Ritterzeit/, 'in der Feudalzeit noch nicht');
  anna.zeitalter = 2;
  const vorher = { holz: anna.holz, gold: anna.gold };
  const belegt = welt.bevoelkerung().get('a');
  assert.deepEqual(bestellen(), {});
  assert.deepEqual({ holz: anna.holz, gold: anna.gold }, { holz: vorher.holz - 100, gold: vorher.gold - 50 });
  const zeit = EINHEITEN.marktkarren.zeit;
  sekunden(welt, zeit - 1);
  assert.equal(karrenVon(welt, 'a').length, 0, `nach ${zeit - 1} Sekunden noch nicht`);
  sekunden(welt, 2);
  const [karren] = karrenVon(welt, 'a');
  assert.ok(karren, `nach ${zeit} Sekunden steht er da`);
  assert.equal(karren.leben, 70);
  assert.equal(welt.bevoelkerung().get('a'), belegt + 1, 'ein Wohnplatz');
});

test('einheiten AC-39: ein Befehl auf einen Fremden ist ein Gang - er geht hin und schlaegt nicht', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const karren = welt.einheitAnlegen('a', x0 + 1, y0 + 5, 'marktkarren');
  // Ein Moench wehrt sich nicht und greift nicht an - so bleibt nur, was der Karren tut.
  const fremder = welt.einheitAnlegen('b', x0 + 8, y0 + 5, 'moench');
  const haus = welt.gebaeudeAnlegen('b', 'haus', x0 + 8, y0 + 8);
  for (const ziel of [fremder, haus]) {
    welt.nachricht('a', { einheiten: [karren.id], ziel: { x: ziel.x, y: ziel.y } });
    assert.notEqual(karren.auftrag?.art, 'angreifen', ziel.art);
  }
  const lebenVorher = [fremder.leben, haus.leben];
  const start = { x: karren.x, y: karren.y };
  sekunden(welt, 10);
  assert.ok(Math.hypot(karren.x - start.x, karren.y - start.y) > 3, 'er ist gegangen');
  assert.deepEqual([fremder.leben, haus.leben], lebenVorher, 'niemand hat einen Schlag bekommen');
});

test('einheiten AC-39: er wacht nicht - ein Feind neben ihm wird nicht angegriffen, ein Schlag trifft ihn mit vollem Schaden', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const karren = welt.einheitAnlegen('a', x0 + 3, y0 + 5, 'marktkarren');
  const miliz = welt.einheitAnlegen('b', x0 + 4, y0 + 5, 'miliz');
  const lebenMiliz = miliz.leben;
  sekunden(welt, 6);
  assert.equal(miliz.leben, lebenMiliz, 'der Karren hat nicht zugeschlagen');
  assert.notEqual(karren.auftrag?.art, 'angreifen');
  // Die Miliz wacht und schlaegt zu: Rueestung 0, also der volle Angriff.
  assert.ok(karren.tot || karren.leben < 70, 'die Miliz hat ihn getroffen');
  if (!karren.tot) assert.equal((70 - karren.leben) % welt.einheitenwert('b', 'miliz', 'angriff'), 0, 'je Schlag der volle Angriff der Miliz');
});
