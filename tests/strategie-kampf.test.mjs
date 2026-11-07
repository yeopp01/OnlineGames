// Der Kampf (kampf AC-1, AC-6, AC-7, AC-8, AC-10) - Rechenteile, direkt
// geprueft (→ docs/adr/0004-teststrategie.md). Die Oberflaeche dazu steht in
// e2e/tests/strategie-kampf.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
// So lange liegt ein Toter (kampf AC-10).
const TOT_SEKUNDEN_TAKTE = 2 * TAKTE_PRO_SEKUNDE;

/**
 * Eine Welt mit zwei Einheiten, die sich sehen: Annas Angreifer und Berts
 * Ziel, `abstand` Felder weit auseinander auf derselben Zeile.
 */
function gegenueber(art, zielArt, abstand = 3) {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('a').basis;
  const angreifer = welt.einheitAnlegen('a', basis.x + 4, basis.y + 4, art);
  const ziel = welt.einheitAnlegen('b', basis.x + 4 + abstand, basis.y + 4, zielArt);
  return { welt, angreifer, ziel };
}

/** Der Rechtsklick des Browsers: auf das Feld, nicht auf die Nummer. */
function rechtsklick(welt, spielerId, einheiten, auf) {
  return welt.nachricht(spielerId, {
    auftrag: 'befehl',
    einheiten: einheiten.map((e) => e.id),
    ziel: { x: auf.x, y: auf.y },
  });
}

function takten(welt, takte) {
  for (let t = 0; t < takte; t++) welt.takten();
}

/** Takten, bis die Bedingung zutrifft - oder bis die Geduld reisst. */
function taktenBis(welt, bedingung, grenze = 2000) {
  for (let t = 0; t < grenze; t++) {
    welt.takten();
    if (bedingung()) return t + 1;
  }
  throw new Error('nicht eingetreten in ' + grenze + ' Takten');
}

// ---- Angreifen -------------------------------------------------------------

test('kampf AC-1: ein Rechtsklick auf eine fremde Einheit wird zum Angriff', () => {
  const { welt, angreifer, ziel } = gegenueber('soldat', 'miliz', 4);
  rechtsklick(welt, 'a', [angreifer], ziel);
  assert.deepEqual(angreifer.auftrag, { art: 'angreifen', ziel: ziel.id, gebaeude: false });

  // Er laeuft hin - und schlaegt erst zu, wenn das Ziel in Reichweite ist.
  const vorher = { x: angreifer.x, y: angreifer.y };
  takten(welt, 5);
  assert.ok(Math.hypot(angreifer.x - vorher.x, angreifer.y - vorher.y) > 0.1, 'er laeuft los');
  assert.equal(ziel.leben, EINHEITEN.miliz.leben, 'auf vier Felder trifft ein Nahkaempfer nicht');

  const takte = taktenBis(welt, () => ziel.leben < EINHEITEN.miliz.leben);
  assert.ok(Math.hypot(ziel.x - angreifer.x, ziel.y - angreifer.y) <= 1.5, 'er steht daneben');
  assert.deepEqual(angreifer.weg, [], 'in Reichweite bleibt er stehen');
  // Vier Felder bei Tempo 0,9 sind rund 45 Takte; mehr als 80 heisst, dass er
  // nicht geradewegs hingelaufen ist.
  assert.ok(takte < 80, `erster Treffer nach ${takte} Takten`);
});

test('kampf AC-1: ein Rechtsklick auf ein fremdes Gebaeude greift es an, bis es fallt', () => {
  const { welt, angreifer } = gegenueber('soldat', 'miliz', 20);
  const basis = welt.spielerVon('b').basis;
  const haus = welt.gebaeudeAnlegen('b', 'haus', basis.x + 4, basis.y + 4);
  // Ein Haus mit 550 Leben haelt einen Soldaten drei Minuten aus; geprueft wird
  // der Abriss, nicht die Geduld.
  haus.leben = 12;
  const feld = haus.y * welt.karte.groesse + haus.x;

  rechtsklick(welt, 'a', [angreifer], { x: haus.x, y: haus.y });
  assert.deepEqual(angreifer.auftrag, { art: 'angreifen', ziel: haus.id, gebaeude: true });
  taktenBis(welt, () => !welt.gebaeude.has(haus.id));

  assert.equal(welt.gebaeude.has(haus.id), false, 'das Haus ist weg');
  // Der Platz ist wieder frei, und der Browser erfaehrt davon.
  assert.notEqual(welt.karte.felder[feld], require('../server/spiele/strategie/karte.js').BEBAUT);
  const zustand = welt.zustand();
  assert.deepEqual(zustand.gebaeude.find((g) => g.i === haus.id), { i: haus.id, weg: true });
  // Der Auftrag endet im Takt danach: der Schlag ist abgerechnet, bevor der
  // Angreifer das naechste Mal nach seinem Ziel sieht.
  welt.takten();
  assert.equal(angreifer.auftrag, null, 'danach hat er nichts mehr zu tun');
});

test('kampf AC-1: mehrere Angreifer stellen sich um das Ziel, nicht uebereinander', () => {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('a').basis;
  const vier = [0, 1, 2, 3].map((i) => welt.einheitAnlegen('a', basis.x + 3 + i, basis.y + 3, 'miliz'));
  const ziel = welt.einheitAnlegen('b', basis.x + 5, basis.y + 8, 'spaeherreiter');
  ziel.leben = 10000;
  rechtsklick(welt, 'a', vier, ziel);
  taktenBis(welt, () => vier.every((e) => !e.weg.length), 400);

  // Keine zwei auf demselben Fleck: ein halbes Feld Abstand ist die Schwelle,
  // ab der zwei Figuren im Bild noch zwei sind (Runde 63).
  for (const [i, e] of vier.entries()) {
    assert.ok(Math.hypot(e.x - ziel.x, e.y - ziel.y) <= 1.5, 'jeder steht in Reichweite');
    for (const f of vier.slice(i + 1)) {
      const abstand = Math.hypot(e.x - f.x, e.y - f.y);
      assert.ok(abstand >= 0.5, `${abstand.toFixed(2)} Felder zwischen zwei Angreifern`);
    }
  }
});

test('kampf AC-1: auf Eigenes wird nicht geschlagen', () => {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('a').basis;
  const soldat = welt.einheitAnlegen('a', basis.x + 4, basis.y + 4, 'soldat');
  const eigener = welt.einheitAnlegen('a', basis.x + 6, basis.y + 4, 'miliz');
  rechtsklick(welt, 'a', [soldat], eigener);
  assert.equal(soldat.auftrag.art, 'gehen', 'der eigene Mann ist ein Ziel zum Hingehen');
  takten(welt, 100);
  assert.equal(eigener.leben, EINHEITEN.miliz.leben);
});

test('kampf AC-1: stirbt das Ziel unterwegs, bleibt der Angreifer stehen', () => {
  const { welt, angreifer, ziel } = gegenueber('soldat', 'miliz', 12);
  rechtsklick(welt, 'a', [angreifer], ziel);
  takten(welt, 10);
  assert.ok(angreifer.weg.length, 'er ist unterwegs');

  welt.einheitSterben(ziel);
  welt.takten();
  assert.equal(angreifer.auftrag, null, 'der Auftrag endet');
  assert.deepEqual(angreifer.weg, [], 'er laeuft nicht auf das leere Feld');
});

// ---- Schaden ---------------------------------------------------------------

test('kampf AC-6: der Schaden folgt der einen Formel', () => {
  const welt = new Welt(ZWEI, 7);
  const einheit = (art) => ({ art });
  const faelle = [
    // Angreifer, Ziel, erwartet, warum
    ['soldat', 'miliz', 6, 'nah 6 gegen Nahruestung 0'],
    ['miliz', 'spaeherreiter', 4, 'die Fernruestung 2 des Reiters zaehlt nicht gegen ein Schwert'],
    ['speerkaempfer', 'spaeherreiter', 18, '3 + 15 Bonus auf Kavallerie'],
    ['bogenschuetze', 'speerkaempfer', 7, '4 + 3 Bonus auf Speer'],
    ['plaenkler', 'bogenschuetze', 5, '2 + 3 Bonus auf Bogenschuetzen'],
    ['bogenschuetze', 'plaenkler', 1, '4 - 3 Fernruestung des Plaenklers'],
    ['soldat', 'dorfbewohner', 6, 'der Dorfbewohner traegt keine Ruestung'],
  ];
  for (const [von, auf, erwartet, warum] of faelle) {
    assert.equal(welt.schaden(einheit(von), einheit(auf), false), erwartet, `${von} auf ${auf}: ${warum}`);
  }
  // Gegen Gebaeude: nah voll, fern fast nichts - und niemals null.
  assert.equal(welt.schaden(einheit('soldat'), { art: 'haus' }, true), 6);
  assert.equal(welt.schaden(einheit('bogenschuetze'), { art: 'haus' }, true), 1, '4 - 7 Fernruestung, mindestens 1');
  assert.equal(welt.schaden(einheit('dorfbewohner'), { art: 'kaserne' }, true), 3);
});

test('kampf AC-6: der Bonus wirkt auch im Takt, nicht nur in der Formel', () => {
  // Der Speerkaempfer braucht gegen den Reiter (45 Leben, 18 Schaden je
  // Schlag) drei Schlaege; der dritte nimmt mehr, als noch da ist.
  const { welt, angreifer, ziel } = gegenueber('speerkaempfer', 'spaeherreiter', 2);
  rechtsklick(welt, 'a', [angreifer], ziel);
  taktenBis(welt, () => ziel.leben < 45);
  assert.equal(ziel.leben, 27, 'ein Schlag nimmt 18');
  taktenBis(welt, () => ziel.leben < 27);
  assert.equal(ziel.leben, 9, 'der zweite auch');
  taktenBis(welt, () => ziel.tot);
  assert.equal(ziel.leben, 0, 'der dritte reicht, und Leben unter null gibt es nicht');
});

test('kampf AC-7: zwischen zwei Schlaegen liegt genau die Nachladezeit', () => {
  for (const art of ['soldat', 'plaenkler']) {
    const { welt, angreifer } = gegenueber(art, 'miliz', 20);
    const basis = welt.spielerVon('b').basis;
    // Ein Ziel, das lange haelt: eine Kaserne mit viel Leben - so lassen sich
    // die Treffer zaehlen, ohne dass sie dabei zusammenfaellt.
    const bau = welt.gebaeudeAnlegen('b', 'kaserne', basis.x + 4, basis.y + 4);
    bau.leben = 100000;
    rechtsklick(welt, 'a', [angreifer], { x: bau.x, y: bau.y });
    taktenBis(welt, () => bau.leben < 100000);

    const schaden = welt.schaden(angreifer, bau, true);
    const nachladen = EINHEITEN[art].nachladen * TAKTE_PRO_SEKUNDE;
    const nachErstem = bau.leben;
    // Einen Takt vor Ablauf der dritten Nachladezeit sind es zwei weitere
    // Treffer, im Takt danach der dritte: genau alle `nachladen` Takte einer.
    takten(welt, 3 * nachladen - 1);
    assert.equal((nachErstem - bau.leben) / schaden, 2, `${art}: nach ${3 * nachladen - 1} Takten zwei Treffer`);
    welt.takten();
    assert.equal((nachErstem - bau.leben) / schaden, 3, `${art}: der dritte kommt genau im Takt ${3 * nachladen}`);
  }
});

test('kampf AC-8: gleiche Lage, gleiches Ergebnis', () => {
  const lauf = () => {
    const { welt, angreifer, ziel } = gegenueber('bogenschuetze', 'speerkaempfer', 8);
    rechtsklick(welt, 'a', [angreifer], ziel);
    const verlauf = [];
    for (let t = 0; t < 200; t++) {
      welt.takten();
      verlauf.push(`${t}:${ziel.leben}:${Math.round(angreifer.x * 1000)}:${Math.round(angreifer.y * 1000)}`);
    }
    return verlauf.join('|');
  };
  assert.equal(lauf(), lauf(), 'zwei Partien mit gleichem Startwert laufen gleich');
  // Und im Kampfteil steht kein Wuerfel.
  const quelle = require('node:fs').readFileSync(
    new URL('../server/spiele/strategie/welt.js', import.meta.url), 'utf8');
  assert.equal(quelle.includes('Math.random'), false, 'kein Math.random in der Simulation');
});

// ---- Tod -------------------------------------------------------------------

test('kampf AC-10: ein Toter liegt zwei Sekunden und verschwindet dann', () => {
  const { welt, angreifer, ziel } = gegenueber('soldat', 'miliz', 2);
  rechtsklick(welt, 'a', [angreifer], ziel);
  const bevorher = welt.bevoelkerung().get('b');
  taktenBis(welt, () => ziel.tot);

  // Er liegt noch, aber er zaehlt nicht mehr: nicht zur Bevoelkerung, nicht
  // als Ziel, nicht als untaetig.
  assert.equal(welt.einheiten.has(ziel.id), true, 'noch im Bild');
  assert.equal(welt.bevoelkerung().get('b'), bevorher - 1, 'die Bevoelkerung ist gefallen');
  assert.equal(welt.feindAn('a', ziel.x, ziel.y), null, 'auf einen Toten wird nicht geschlagen');
  const imZustand = welt.zustand().einheiten.find((e) => e.i === ziel.id);
  assert.equal(imZustand.s, 1, 'der Browser erfaehrt, dass er liegt');

  // Zwei Sekunden: einen Takt vorher liegt er noch, danach ist er weg.
  welt.takten();
  assert.equal(angreifer.auftrag, null, 'der Angreifer hat danach nichts mehr zu tun');
  takten(welt, TOT_SEKUNDEN_TAKTE - 2);
  assert.equal(welt.einheiten.has(ziel.id), true, `nach ${TOT_SEKUNDEN_TAKTE - 1} Takten liegt er noch`);
  welt.takten();
  assert.equal(welt.einheiten.has(ziel.id), false, 'nach zwei Sekunden ist er weg');
  assert.equal(welt.zustand().einheiten.some((e) => e.i === ziel.id), false);
});

test('kampf AC-10: ein toter Dorfbewohner zaehlt nicht als untaetig', () => {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('b').basis;
  const bauer = welt.einheitAnlegen('b', basis.x + 4, basis.y + 4, 'dorfbewohner');
  const vorher = welt.untaetigeVon('b').length;
  welt.einheitSterben(bauer);
  assert.equal(welt.untaetigeVon('b').length, vorher - 1);
  assert.equal(welt.untaetigeVon('b').includes(bauer.id), false);
});

test('kampf AC-10: beide sterben, wenn beide den letzten Schlag haben', () => {
  // Zwei Soldaten nebeneinander, beide mit so wenig Leben, dass ein Treffer
  // reicht - der Grenzfall aus der Spec: kein Vorrang fuer den Ersten.
  const { welt, angreifer, ziel } = gegenueber('soldat', 'soldat', 1);
  angreifer.leben = 3;
  ziel.leben = 3;
  rechtsklick(welt, 'a', [angreifer], ziel);
  rechtsklick(welt, 'b', [ziel], angreifer);
  welt.takten();
  assert.ok(angreifer.tot && ziel.tot, 'beide liegen');
});

test('kampf AC-10: ein Gebaeude mit Leben 0 steht nicht mehr im Weg', () => {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('b').basis;
  const haus = welt.gebaeudeAnlegen('b', 'haus', basis.x + 6, basis.y + 6);
  assert.equal(GEBAEUDE.haus.groesse, 2);
  welt.gebaeudeZerstoeren(haus);
  const { x0, y0, x1, y1 } = welt.grundflaeche('haus', haus.x, haus.y);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      assert.equal(require('../server/spiele/strategie/karte.js').begehbar(welt.karte, x, y), true, `${x}/${y} ist frei`);
    }
  }
});
