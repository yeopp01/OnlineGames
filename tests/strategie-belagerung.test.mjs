// Belagerung (einheiten AC-35, AC-36, kampf AC-19, Stufe D6) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md). Die Oberflaeche dazu:
// e2e/tests/strategie-belagerung.spec.mjs.
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
 * neben ihrem Dorf. `x0`, `y0` ist seine Ecke oben links.
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
      if (frei && ![...welt.einheiten.values()].some((e) => e.x >= x0 - 1 && e.x <= x0 + 12 && e.y >= y0 - 1 && e.y <= y0 + 12)) {
        return { welt, anna, x0, y0 };
      }
    }
  }
  throw new Error('kein freier Platz');
}

test('einheiten AC-35: die Ramme mit den Werten der Vorlage, in der Belagerungswerkstatt erst ab der Ritterzeit', () => {
  const r = EINHEITEN.ramme;
  assert.deepEqual([r.leben, r.angriff, `${r.nahruestung}/${r.fernruestung}`, r.tempo], [175, 2, '0/180', 0.5]);
  assert.deepEqual(r.kosten, { holz: 160, gold: 75 });
  assert.equal(r.zeit, 36);
  assert.equal(r.bonus.gebaeude, 125, '+125 gegen Gebaeude');
  assert.equal(r.nurGebaeude, true);
  assert.equal(r.wacht, false, 'sie wacht nicht');
  assert.ok(GEBAEUDE.belagerungswerkstatt.bildetAus.includes('ramme'));

  const { welt, anna, x0, y0 } = ritterzeitMitPlatz();
  const werkstatt = welt.gebaeudeAnlegen('a', 'belagerungswerkstatt', x0 + 5, y0 + 5);
  anna.zeitalter = 1;
  assert.match(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: werkstatt.id, einheit: 'ramme' }).fehler, /ab dem Fürstentum/);
  anna.zeitalter = 2;
  const holz = anna.holz;
  assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: werkstatt.id, einheit: 'ramme' }), {});
  assert.equal(anna.holz, holz - 160);
  sekunden(welt, 35);
  assert.equal([...welt.einheiten.values()].filter((e) => e.art === 'ramme').length, 0, 'nach 35 Sekunden noch nicht');
  sekunden(welt, 2);
  assert.equal([...welt.einheiten.values()].filter((e) => e.art === 'ramme').length, 1, 'nach 36 Sekunden steht sie da');
});

test('einheiten AC-35: die Ramme trifft ein Gebaeude mit 127, Pfeile ritzen sie kaum', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const ramme = welt.einheitAnlegen('a', x0 + 2, y0 + 5, 'ramme');
  // Eine Kaserne (1200 Leben) haelt die 30 Sekunden unten aus - ein Haus
  // (550) fiele beim fuenften Stoss, und gezaehlt wuerde an einem Toten.
  const haus = welt.gebaeudeAnlegen('b', 'kaserne', x0 + 4, y0 + 4);
  // 2 Angriff + 125 Bonus gegen Gebaeude - 0 Nahruestung eines Gebaeudes.
  assert.equal(welt.schaden(ramme, haus, true), 2 + 125 - GEBAEUDE.kaserne.nahruestung);
  assert.equal(welt.schaden(ramme, haus, true), 127);
  // Ein Bogenschuetze: 4 Angriff gegen 180 Fernruestung - der eine Punkt,
  // den jeder Schlag mindestens macht. Eine Miliz schlaegt voll zu.
  const bogen = welt.einheitAnlegen('b', x0 + 2, y0 + 9, 'bogenschuetze');
  const miliz = welt.einheitAnlegen('b', x0 + 2, y0 + 1, 'miliz');
  assert.equal(welt.schaden(bogen, ramme, false), 1);
  assert.equal(welt.schaden(miliz, ramme, false), EINHEITEN.miliz.angriff);

  // Der Befehl auf die Kaserne ist ein Angriff: in 30 Sekunden alle fuenf
  // Sekunden ein Stoss, abzueglich des Wegs bis heran.
  welt.befehl('a', [ramme.id], { x: haus.x, y: haus.y });
  assert.equal(ramme.auftrag?.art, 'angreifen');
  const voll = haus.leben;
  sekunden(welt, 30);
  const verlust = voll - haus.leben;
  assert.ok(haus.leben > 0, 'sie steht noch');
  assert.ok(verlust >= 127 * 4 && verlust <= 127 * 6 && verlust % 127 === 0, `vier bis sechs Stoesse zu 127, nicht ${verlust}`);
});

test('einheiten AC-35: ein Befehl auf eine Einheit ist fuer die Ramme ein Gang dorthin, und getroffen schlaegt sie nicht zurueck', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const ramme = welt.einheitAnlegen('a', x0 + 1, y0 + 5, 'ramme');
  const miliz = welt.einheitAnlegen('b', x0 + 6, y0 + 5, 'miliz');
  const ritter = welt.einheitAnlegen('a', x0 + 1, y0 + 7, 'ritter');

  // Dieselbe Klick auf die Miliz: der Ritter greift an, die Ramme faehrt hin.
  welt.befehl('a', [ramme.id, ritter.id], { x: miliz.x, y: miliz.y });
  assert.equal(ritter.auftrag?.art, 'angreifen', 'der Ritter greift an');
  assert.notEqual(ramme.auftrag?.art, 'angreifen', 'die Ramme nicht');
  assert.ok(ramme.weg.length > 0, 'sie faehrt hin');
  const ziel = ramme.weg.at(-1);
  assert.ok(Math.hypot(ziel.x - miliz.x, ziel.y - miliz.y) <= 1.5, 'bis an die Miliz');

  // Berts Miliz schlaegt auf die Ramme ein - sie wehrt sich nicht.
  welt.befehl('a', [ritter.id], { x: x0 + 1, y: y0 + 10 });
  const zweite = welt.einheitAnlegen('a', x0 + 8, y0 + 1, 'ramme');
  welt.befehl('b', [miliz.id], { x: zweite.x, y: zweite.y });
  sekunden(welt, 12);
  assert.ok(zweite.leben < EINHEITEN.ramme.leben, 'die Miliz trifft');
  assert.notEqual(zweite.auftrag?.art, 'angreifen', 'getroffen schlaegt sie nicht zurueck');
  assert.equal(miliz.leben, EINHEITEN.miliz.leben, 'die Miliz bleibt heil');
});

test('einheiten AC-35: im Angriffslauf greift die Ramme keine Einheit an, die ihr unterwegs begegnet', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const ramme = welt.einheitAnlegen('a', x0 + 1, y0 + 5, 'ramme');
  // Ein Dorfbewohner Berts zwei Felder neben dem Weg: er wacht nicht und
  // greift nicht an - jeder andere Kaempfer im Angriffslauf nimmt ihn sich
  // vor (kampf AC-4), die Ramme nicht.
  welt.einheitAnlegen('b', x0 + 5, y0 + 3, 'dorfbewohner');
  welt.befehl('a', [ramme.id], { x: x0 + 10, y: y0 + 5 }, true);
  for (let t = 0; t < 25 * TAKTE_PRO_SEKUNDE; t++) {
    welt.takten();
    assert.notEqual(ramme.auftrag?.art, 'angreifen', `Takt ${t}: kein Angriff auf den Dorfbewohner`);
  }
  assert.deepEqual(welt.feldVon(ramme), { x: x0 + 10, y: y0 + 5 }, 'sie faehrt bis ans Ziel');
});

// ---- Mangonel (einheiten AC-36) und Flaechenschaden (kampf AC-19) ----------

/** Eine Einheit auf einen Punkt zwischen den Feldern stellen, mit viel Leben. */
function stellen(welt, besitzer, art, x, y, leben = 1000) {
  const e = welt.einheitAnlegen(besitzer, Math.round(x), Math.round(y), art);
  e.x = x;
  e.y = y;
  e.leben = leben;
  return e;
}

test('einheiten AC-36: der Mangonel mit den Werten der Vorlage, in der Belagerungswerkstatt erst ab der Ritterzeit', () => {
  const m = EINHEITEN.mangonel;
  assert.deepEqual([m.leben, m.angriff, `${m.nahruestung}/${m.fernruestung}`, m.tempo], [50, 40, '0/6', 0.6]);
  assert.deepEqual([m.reichweite, m.mindestreichweite], [7, 3]);
  assert.deepEqual(m.kosten, { holz: 160, gold: 135 });
  assert.equal(m.zeit, 46);
  assert.equal(m.flaeche, 1, 'trifft im Umkreis eines Feldes');
  assert.ok(GEBAEUDE.belagerungswerkstatt.bildetAus.includes('mangonel'));

  const { welt, anna, x0, y0 } = ritterzeitMitPlatz();
  const werkstatt = welt.gebaeudeAnlegen('a', 'belagerungswerkstatt', x0 + 5, y0 + 5);
  anna.zeitalter = 1;
  assert.match(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: werkstatt.id, einheit: 'mangonel' }).fehler, /ab dem Fürstentum/);
  anna.zeitalter = 2;
  const gold = anna.gold;
  assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: werkstatt.id, einheit: 'mangonel' }), {});
  assert.equal(anna.gold, gold - 135);
  sekunden(welt, 45);
  assert.equal([...welt.einheiten.values()].filter((e) => e.art === 'mangonel').length, 0, 'nach 45 Sekunden noch nicht');
  sekunden(welt, 2);
  assert.equal([...welt.einheiten.values()].filter((e) => e.art === 'mangonel').length, 1, 'nach 46 Sekunden steht er da');
});

test('kampf AC-19: der Stein trifft nach seinem Flug alle im Umkreis eines Feldes, auch eigene - in der Mitte voll, am Rand halb', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const mangonel = stellen(welt, 'a', 'mangonel', x0 + 1, y0 + 5, EINHEITEN.mangonel.leben);
  // Dorfbewohner wachen nicht und laufen nicht von selbst: sie stehen still,
  // bis der Stein kommt. Abstaende zum Ziel 0, 0,6, 1 (Anna) und 1,3.
  const ziel = stellen(welt, 'b', 'dorfbewohner', x0 + 7, y0 + 5);
  const nah = stellen(welt, 'b', 'dorfbewohner', x0 + 7.6, y0 + 5);
  const eigener = stellen(welt, 'a', 'dorfbewohner', x0 + 7, y0 + 6);
  const draussen = stellen(welt, 'b', 'dorfbewohner', x0 + 7, y0 + 3.7);
  const voll = welt.schaden(mangonel, ziel, false);
  assert.equal(voll, 40 - EINHEITEN.dorfbewohner.fernruestung);

  welt.befehl('a', [mangonel.id], { x: ziel.x, y: ziel.y });
  assert.equal(mangonel.auftrag?.art, 'angreifen');
  welt.takten();
  assert.equal(welt.einschlaege.length, 1, 'der Stein fliegt');
  // Sechs Felder bei sieben je Sekunde: neun Takte unterwegs, der Abwurf
  // eingerechnet.
  for (let t = 0; t < 7; t++) welt.takten();
  assert.equal(ziel.leben, 1000, 'unterwegs trifft er noch nicht');
  welt.takten();
  assert.equal(welt.einschlaege.length, 0, 'eingeschlagen');
  assert.equal(1000 - ziel.leben, voll, 'in der Mitte voll');
  assert.equal(1000 - nah.leben, Math.round(voll * 0.7), '0,6 Felder daneben 70 %');
  assert.equal(1000 - eigener.leben, Math.round(voll * 0.5), 'am Rand die Haelfte - auch Annas eigener');
  assert.equal(draussen.leben, 1000, 'jenseits eines Feldes nichts');
  // Vom eigenen Stein getroffen, wehrt sich niemand gegen den eigenen Werfer.
  assert.notEqual(eigener.auftrag?.art, 'angreifen');
});

test('kampf AC-19: wer nach dem Abwurf weglaeuft, weicht aus - der Stein schlaegt dort ein, wo er stand', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const mangonel = stellen(welt, 'a', 'mangonel', x0 + 1, y0 + 5, EINHEITEN.mangonel.leben);
  // Ein Ritter am Rand der Reichweite: elf Takte Flug. Er wacht, sieht den
  // Mangonel aber nicht (Sicht 4). Daneben ein Dorfbewohner als Zeuge.
  const ritter = stellen(welt, 'b', 'ritter', x0 + 8.4, y0 + 5, EINHEITEN.ritter.leben);
  const zeuge = stellen(welt, 'b', 'dorfbewohner', x0 + 8.4, y0 + 5.7);

  welt.befehl('a', [mangonel.id], { x: ritter.x, y: ritter.y });
  welt.takten();
  assert.equal(welt.einschlaege.length, 1, 'der Stein fliegt');
  // Bert zieht den Ritter quer weg, sobald der Stein fliegt.
  welt.befehl('b', [ritter.id], { x: x0 + 8, y: y0 + 1 });
  for (let t = 0; t < 12; t++) welt.takten();
  assert.equal(welt.einschlaege.length, 0, 'eingeschlagen');
  assert.ok(zeuge.leben < 1000, 'an der alten Stelle schlug er ein');
  assert.equal(ritter.leben, EINHEITEN.ritter.leben, 'der Ritter ist ausgewichen');
});

test('einheiten AC-36: naeher als drei Felder wirft der Mangonel nicht - von selbst nimmt er so einen nicht, befohlen faehrt er erst zurueck', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const mangonel = stellen(welt, 'a', 'mangonel', x0 + 5, y0 + 5, EINHEITEN.mangonel.leben);
  const nah = stellen(welt, 'b', 'dorfbewohner', x0 + 7, y0 + 5);
  // Von selbst: der Nahe ist kein Ziel ...
  sekunden(welt, 2);
  assert.ok(!mangonel.auftrag, 'zwei Felder - kein Ziel');
  assert.equal(welt.einschlaege.length, 0);
  // ... einer in fuenf Feldern schon.
  const weit = stellen(welt, 'b', 'dorfbewohner', x0 + 5, y0 + 10);
  sekunden(welt, 1);
  assert.equal(mangonel.auftrag?.ziel, weit.id, 'den in fuenf Feldern nimmt er');

  // Befohlen auf den Nahen: der erste Stein fliegt erst aus drei Feldern.
  welt.befehl('a', [mangonel.id], { x: nah.x, y: nah.y });
  assert.equal(mangonel.auftrag?.ziel, nah.id);
  // Mitgeschrieben wird der Abstand beim ersten Wurf auf den Nahen.
  let abwurf = null;
  const werfen = welt.steinWerfen.bind(welt);
  welt.steinWerfen = (werfer, ziel, ...rest) => {
    if (ziel === nah && abwurf === null) abwurf = Math.hypot(nah.x - werfer.x, nah.y - werfer.y);
    return werfen(werfer, ziel, ...rest);
  };
  for (let t = 0; t < 15 * TAKTE_PRO_SEKUNDE && abwurf === null; t++) welt.takten();
  assert.ok(abwurf !== null, 'er wirft');
  assert.ok(abwurf >= EINHEITEN.mangonel.mindestreichweite, `aus ${abwurf.toFixed(2)} Feldern`);
});
