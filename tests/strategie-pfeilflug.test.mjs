// Ein Pfeil trifft, wenn er ankommt (→ specs/10-strategie/kampf.md AC-27) -
// Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md). Bis zum
// 2026-11-22 fiel der Schaden im Takt des Schusses, der Pfeil im Bild flog
// danach noch eine halbe Sekunde (Rueckmeldung: "die Pfeile der Burg kommt
// irgendwie SOFORT beim opfer an").
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

/**
 * Annas Bogenschuetze und Berts Marktkarren, `abstand` Felder auseinander,
 * sonst niemand. Der Karren greift nicht an (`angriff: 0`) - er steht still,
 * solange ihn keiner schickt.
 */
function aufstellen(abstand, art = 'marktkarren') {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  welt.einheiten.clear();
  const basis = welt.spielerVon('a').basis;
  const schuetze = welt.einheitAnlegen('a', basis.x, basis.y + 8, 'bogenschuetze');
  const ziel = welt.einheitAnlegen('b', basis.x + abstand, basis.y + 8, art);
  return { welt, schuetze, ziel };
}

/** Takten bis zum ersten Schuss; zurueck kommt der Takt, in dem er fiel. */
function bisSchuss(welt, schuetze, ziel) {
  welt.angriffBeginnen(schuetze, ziel, true);
  for (let t = 0; t < 5 * TAKTE_PRO_SEKUNDE; t++) {
    welt.takten();
    if (welt.pfeileImFlug.length) return welt.takt;
  }
  assert.fail('kein Schuss');
}

test('kampf AC-27: der Schaden faellt, wenn der Pfeil ankommt - so viele Takte spaeter, wie er bei sieben Feldern je Sekunde fliegt', () => {
  for (const abstand of [2, 3, 4]) {
    const { welt, schuetze, ziel } = aufstellen(abstand);
    const voll = ziel.leben;
    const schuss = bisSchuss(welt, schuetze, ziel);
    const weite = Math.hypot(ziel.x - schuetze.x, ziel.y - schuetze.y);
    const flug = Math.max(1, Math.round((weite / 7) * TAKTE_PRO_SEKUNDE));
    assert.ok(flug > 1, `${abstand} Felder: mehr als ein Takt Flug`);
    // Im Takt des Schusses ist schon ein Takt geflogen; ankommt er im Takt
    // schuss + flug - 1, keinen frueher.
    while (welt.takt < schuss + flug - 2) {
      welt.takten();
      assert.equal(ziel.leben, voll, `${abstand} Felder: im Takt ${welt.takt} noch unterwegs`);
    }
    welt.takten();
    const schaden = welt.schaden(schuetze, ziel, false);
    assert.equal(ziel.leben, voll - schaden, `${abstand} Felder: im Takt ${welt.takt} angekommen`);
  }
});

test('kampf AC-27: ein Pfeil trifft sicher - auch ein Ziel, das inzwischen weiterlaeuft', () => {
  const { welt, schuetze, ziel } = aufstellen(4);
  const voll = ziel.leben;
  bisSchuss(welt, schuetze, ziel);
  // Das Ziel laeuft davon, der Schuetze bekommt einen anderen Befehl.
  welt.gangBeginnen(ziel, { x: Math.round(ziel.x) + 6, y: Math.round(ziel.y) });
  welt.gangBeginnen(schuetze, { x: Math.round(schuetze.x) - 3, y: Math.round(schuetze.y) });
  const schaden = welt.schaden(schuetze, ziel, false);
  for (let t = 0; t < TAKTE_PRO_SEKUNDE && ziel.leben === voll; t++) welt.takten();
  assert.equal(ziel.leben, voll - schaden, 'getroffen, obwohl es lief');
});

test('kampf AC-27: faellt das Ziel vorher, verpuffen die Pfeile im Flug - kein zweites Ziel', () => {
  const { welt, schuetze, ziel } = aufstellen(4);
  const daneben = welt.einheitAnlegen('b', ziel.x, ziel.y + 0.4, 'marktkarren');
  bisSchuss(welt, schuetze, ziel);
  assert.equal(welt.pfeileImFlug.length, 1);
  // Der Schuetze geht vom Feld - sonst schoesse er gleich auf den Naechsten.
  welt.einheiten.delete(schuetze.id);
  // Ein Nahkaempfer macht dem Ziel den Rest, bevor der Pfeil da ist.
  ziel.leben = 1;
  welt.schlaege.push({ angreifer: schuetze, ziel, schaden: 1, gebaeude: false });
  welt.schlaegeAbrechnen();
  assert.ok(ziel.tot, 'das Ziel faellt vor der Ankunft');
  const vorher = daneben.leben;
  for (let t = 0; t < TAKTE_PRO_SEKUNDE && welt.pfeileImFlug.length; t++) welt.takten();
  assert.equal(welt.pfeileImFlug.length, 0, 'der Pfeil ist angekommen');
  assert.equal(daneben.leben, vorher, 'und hat niemand anderen getroffen');
  assert.equal(ziel.leben, 0, 'auch den Gefallenen nicht noch einmal');
});

test('kampf AC-27: auch der Pfeil eines Schuetzen, der inzwischen fiel, trifft - und der Zustand nennt die Takte bis zur Ankunft', () => {
  const { welt, schuetze, ziel } = aufstellen(4);
  const voll = ziel.leben;
  welt.zustand();
  bisSchuss(welt, schuetze, ziel);
  const pfeil = welt.zustand().p.at(-1);
  const [, , , , art, nach] = pfeil;
  assert.equal(art, 0, 'ein Pfeil, kein Stein');
  assert.equal(nach, welt.pfeileImFlug[0].takte, 'Takte nach diesem Zustand bis zur Ankunft');
  assert.ok(nach > 0);
  schuetze.leben = 0;
  welt.schlaege.push({ angreifer: ziel, ziel: schuetze, schaden: 0, gebaeude: false });
  welt.schlaegeAbrechnen();
  assert.ok(schuetze.tot, 'der Schuetze faellt');
  welt.einheiten.delete(schuetze.id);
  for (let t = 0; t < nach - 1; t++) welt.takten();
  assert.equal(ziel.leben, voll, 'einen Takt vorher noch nicht');
  welt.takten();
  assert.equal(ziel.leben, voll - welt.schaden(schuetze, ziel, false), 'sein Pfeil trifft noch');
});

test('kampf AC-27: Gegenprobe - ein Nahkaempfer trifft im Takt seines Schlags, ein Stein des Mangonels fliegt wie bisher', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  welt.einheiten.clear();
  const basis = welt.spielerVon('a').basis;
  const miliz = welt.einheitAnlegen('a', basis.x, basis.y + 8, 'miliz');
  const opfer = welt.einheitAnlegen('b', basis.x + 0.9, basis.y + 8, 'miliz');
  welt.angriffBeginnen(miliz, opfer, true);
  const voll = opfer.leben;
  for (let t = 0; t < 2 * TAKTE_PRO_SEKUNDE && opfer.leben === voll; t++) {
    welt.takten();
    assert.equal(welt.pfeileImFlug.length, 0, 'kein Pfeil im Nahkampf');
  }
  assert.ok(opfer.leben < voll, 'getroffen im Takt des Schlags');
  assert.ok(EINHEITEN.mangonel.geschoss, 'der Mangonel wirft einen Stein (kampf AC-19)');
});
