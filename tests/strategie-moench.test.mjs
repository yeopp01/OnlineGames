// Der Moench (einheiten AC-37, Stufe D8) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md). Die Oberflaeche dazu:
// e2e/tests/strategie-moench.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, EINHEITEN } = require('../server/spiele/strategie/daten.js');

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

/** Eine verletzte Einheit: `fehlt` Leben unter dem vollen Wert. */
function verletzt(welt, besitzer, x, y, art, fehlt) {
  const e = welt.einheitAnlegen(besitzer, x, y, art);
  e.leben -= fehlt;
  return e;
}
const voll = (welt, e) => welt.einheitenwert(e.besitzer, e.art, 'leben');

test('einheiten AC-37: der Moench mit den Werten der Vorlage, im Kloster erst ab der Ritterzeit', () => {
  const m = EINHEITEN.moench;
  assert.deepEqual([m.leben, m.tempo, m.zeit], [30, 0.7, 51]);
  assert.deepEqual(m.kosten, { gold: 100 });
  assert.equal(m.angriff, 0, 'er greift nicht an');
  assert.equal(m.heilen.je, 1, 'ein Leben je Sekunde');
  assert.ok(GEBAEUDE.kloster.bildetAus.includes('moench'));

  const { welt, anna, x0, y0 } = ritterzeitMitPlatz();
  const kloster = welt.gebaeudeAnlegen('a', 'kloster', x0 + 5, y0 + 5);
  anna.zeitalter = 1;
  assert.match(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kloster.id, einheit: 'moench' }).fehler, /Ritterzeit/);
  anna.zeitalter = 2;
  const gold = anna.gold;
  assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kloster.id, einheit: 'moench' }), {});
  assert.equal(anna.gold, gold - 100);
  const moenche = () => [...welt.einheiten.values()].filter((e) => e.art === 'moench' && e.besitzer === 'a');
  sekunden(welt, 50);
  assert.equal(moenche().length, 0, 'nach 50 Sekunden noch nicht');
  sekunden(welt, 2);
  assert.equal(moenche().length, 1, 'nach 51 Sekunden steht er da');
  assert.equal(moenche()[0].leben, 30);
});

test('einheiten AC-37: der Moench heilt eine verletzte eigene Einheit um einen Punkt je Sekunde, bis sie voll ist', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 3, y0 + 5, 'moench');
  const miliz = verletzt(welt, 'a', x0 + 5, y0 + 5, 'miliz', 12);
  const vorher = miliz.leben;
  sekunden(welt, 10);
  assert.equal(miliz.leben, vorher + 10, 'zehn Sekunden, zehn Leben');
  assert.ok(moench.heilt, 'er arbeitet dabei');
  sekunden(welt, 5);
  assert.equal(miliz.leben, voll(welt, miliz), 'nie ueber das volle Leben');
  sekunden(welt, 1);
  assert.equal(moench.heilt, null, 'ist niemand mehr verletzt, hoert er auf');
});

test('einheiten AC-37: mehrere Verletzte - einer nach dem anderen, der naechste zuerst', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  welt.einheitAnlegen('a', x0 + 5, y0 + 5, 'moench');
  const nah = verletzt(welt, 'a', x0 + 6, y0 + 5, 'dorfbewohner', 5);
  const fern = verletzt(welt, 'a', x0 + 8, y0 + 5, 'speerkaempfer', 5);
  const [n0, f0] = [nah.leben, fern.leben];
  sekunden(welt, 3);
  assert.equal(nah.leben, n0 + 3, 'der naechste bekommt alles');
  assert.equal(fern.leben, f0, 'der fernere wartet');
  sekunden(welt, 4);
  assert.equal(nah.leben, voll(welt, nah));
  assert.equal(fern.leben, f0 + 2, 'danach ist er dran');
});

test('einheiten AC-37: nicht geheilt werden Gebaeude, Belagerung, Kaempfende, Fremde, der Moench selbst und wer zu weit steht', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 5, y0 + 5, 'moench');
  moench.leben -= 10;
  const kloster = welt.gebaeudeAnlegen('a', 'kloster', x0 + 5, y0 + 8);
  kloster.leben -= 300;
  const ramme = verletzt(welt, 'a', x0 + 6, y0 + 4, 'ramme', 50);
  // Fremde und Ferne als Dorfbewohner: die wachen nicht und schlagen den Moench nicht.
  const fremd = verletzt(welt, 'b', x0 + 4, y0 + 4, 'dorfbewohner', 10);
  const weit = verletzt(welt, 'a', x0 + 5 + EINHEITEN.moench.heilen.reichweite + 1, y0 + 5, 'dorfbewohner', 10);
  // Eine Miliz, die kaempft: ihr Ziel ein fremdes Gebaeude weit weg, damit
  // sie dabei nichts verliert und nichts gewinnt ausser vom Moench.
  const ziel = welt.gebaeudeAnlegen('b', 'haus', x0 + 1, y0 + 1);
  const kaempft = verletzt(welt, 'a', x0 + 4, y0 + 6, 'miliz', 10);
  welt.nachricht('a', { einheiten: [kaempft.id], ziel: { x: ziel.x, y: ziel.y } });
  assert.equal(kaempft.auftrag?.art, 'angreifen', 'der Befehl auf das Haus ist ein Angriff');
  const vorher = [moench.leben, kloster.leben, ramme.leben, fremd.leben, weit.leben];
  sekunden(welt, 5);
  assert.deepEqual([moench.leben, kloster.leben, ramme.leben, fremd.leben, weit.leben], vorher);
  assert.ok(kaempft.leben <= voll(welt, kaempft) - 10, 'wer kaempft, wird nicht geheilt');
  assert.equal(moench.heilt, null);
});

test('einheiten AC-37: ein Moench, der geht, heilt nicht - erst wenn er steht', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 1, y0 + 5, 'moench');
  const miliz = verletzt(welt, 'a', x0 + 2, y0 + 5, 'miliz', 20);
  welt.nachricht('a', { einheiten: [moench.id], ziel: { x: x0 + 9, y: y0 + 5 } });
  // Er geht 0,7 Felder je Sekunde; nach zwei Sekunden ist er unterwegs.
  const vorher = miliz.leben;
  sekunden(welt, 2);
  assert.ok(moench.weg.length > 0, 'noch unterwegs');
  assert.equal(miliz.leben, vorher, 'unterwegs heilt er nicht');
});

test('einheiten AC-37: der Browser sieht, dass der Moench heilt - `w` im Zustand', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 5, y0 + 5, 'moench');
  verletzt(welt, 'a', x0 + 6, y0 + 5, 'miliz', 10);
  sekunden(welt, 2);
  const eintrag = (zustand) => zustand.einheiten.find((e) => e.i === moench.id);
  assert.equal(eintrag(welt.zustandJeSpieler(['a']).get('a')).w, 1);
  sekunden(welt, 10);
  assert.equal(eintrag(welt.zustandJeSpieler(['a']).get('a')).w, undefined, 'geheilt - er arbeitet nicht mehr');
});
