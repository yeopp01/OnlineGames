// Was jeder Spieler sieht (→ specs/10-strategie/kampf.md AC-15) - Rechenteile,
// direkt geprueft (→ docs/adr/0004-teststrategie.md).
//
// Der Server rechnet je Spieler zweimal je Sekunde, welche Felder seine
// Einheiten und Gebaeude jetzt sehen und welche je gesehen wurden. Das ist die
// Grundlage fuer den Nebel (kampf AC-11 bis AC-13, darstellung AC-15); hier
// wird nur gerechnet, noch nichts gezeigt oder weggelassen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

// Ein Feld, um das herum 14 Felder lang nichts von Anna steht - so sieht dort
// nur, was der Test hinstellt.
function abseits(welt) {
  const g = welt.karte.groesse;
  const annas = [...welt.einheiten.values(), ...welt.gebaeude.values()].filter((d) => d.besitzer === 'a');
  for (let y = 20; y < g - 20; y++) {
    for (let x = 20; x < g - 20; x++) {
      if (!karten.begehbar(welt.karte, x, y)) continue;
      if (annas.every((d) => Math.hypot(d.x - x, d.y - y) > 25)) return { x, y };
    }
  }
  throw new Error('kein Feld abseits');
}

test('kampf AC-15: eine Einheit sieht so weit, wie ihre Daten sagen - nicht weiter', () => {
  for (const art of ['dorfbewohner', 'bogenschuetze']) {
    const welt = new Welt(ZWEI, 4711);
    const p = abseits(welt);
    welt.einheitAnlegen('a', p.x, p.y, art);
    welt.sichtAktualisieren();
    const r = welt.einheitenwert('a', art, 'sicht');
    assert.equal(r, EINHEITEN[art].sicht, `${art}: Sichtweite aus den Daten`);
    // Gegenprobe zur Zahl: gerade noch, und eins weiter nicht mehr.
    assert.equal(welt.sieht('a', p.x + r, p.y), true, `${art}: ${r} Felder weit`);
    assert.equal(welt.sieht('a', p.x + r + 1, p.y), false, `${art}: nicht ${r + 1}`);
    assert.equal(welt.sieht('a', p.x, p.y - r), true);
    // Und Bert sieht dort nichts - jeder hat seine eigene Sicht.
    assert.equal(welt.sieht('b', p.x, p.y), false, `${art}: Bert sieht Annas Feld nicht`);
  }
});

test('kampf AC-15: ein Gebaeude sieht acht Felder ueber seinen Rand', () => {
  const welt = new Welt(ZWEI, 4711);
  const p = abseits(welt);
  const haus = welt.gebaeudeAnlegen('a', 'haus', p.x, p.y, true);
  welt.sichtAktualisieren();
  const { x1, y0 } = welt.grundflaeche('haus', haus.x, haus.y);
  const weit = GEBAEUDE.haus.sicht;
  assert.equal(weit, 8);
  assert.equal(welt.sieht('a', x1 + weit, y0), true, 'acht Felder rechts vom Rand');
  assert.equal(welt.sieht('a', x1 + weit + 2, y0), false, 'zehn nicht');
});

test('kampf AC-15: was einmal gesehen war, bleibt erkundet - gesehen wird es nur, solange jemand dort ist', () => {
  const welt = new Welt(ZWEI, 4711);
  const p = abseits(welt);
  // Vorher: nie gesehen.
  assert.equal(welt.erkundet('a', p.x, p.y), false, 'vorher unbekannt');
  const spaeher = welt.einheitAnlegen('a', p.x, p.y, 'dorfbewohner');
  welt.sichtAktualisieren();
  assert.equal(welt.sieht('a', p.x, p.y), true);
  assert.equal(welt.erkundet('a', p.x, p.y), true);
  // Er geht (hier: faellt weg) - das Feld bleibt erkundet, gesehen wird es nicht mehr.
  welt.einheiten.delete(spaeher.id);
  welt.sichtAktualisieren();
  assert.equal(welt.sieht('a', p.x, p.y), false, 'jetzt unbeobachtet');
  assert.equal(welt.erkundet('a', p.x, p.y), true, 'aber erinnert');
});

test('kampf AC-15: zweimal je Sekunde neu gerechnet, waehrend die Partie laeuft', () => {
  const welt = new Welt(ZWEI, 4711);
  const p = abseits(welt);
  const e = welt.einheitAnlegen('a', p.x, p.y, 'dorfbewohner');
  const ziel = { x: p.x + 10, y: p.y };
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [e.id], ziel });
  for (let t = 0; t < 20 * TAKTE_PRO_SEKUNDE && e.weg.length; t++) welt.takten();
  for (let t = 0; t < TAKTE_PRO_SEKUNDE; t++) welt.takten();
  assert.equal(welt.sieht('a', ziel.x, ziel.y), true, 'am Ziel sieht sie');
  assert.equal(welt.sieht('a', p.x - 3, p.y), false, 'der Start liegt ausser Sicht');
  assert.equal(welt.erkundet('a', p.x - 3, p.y), true, 'ist aber erkundet');
});

test('kampf AC-15: acht Spieler mit 800 Einheiten kosten je Rechnung unter 1 ms', () => {
  // Die Grenze kommt aus dem Budget eines Taktes (einheiten AC-21): die Sicht
  // wird alle fuenf Takte gerechnet, darf aber auch dann den Takt nicht
  // sprengen.
  const acht = Array.from({ length: 8 }, (_, i) => ({ id: `s${i}`, name: `S${i}` }));
  const welt = new Welt(acht, 4711);
  for (let i = 0; i < 800; i++) {
    const s = welt.spieler[i % 8];
    welt.einheitAnlegen(s.id, s.basis.x + (i % 7) - 3, s.basis.y + ((i >> 3) % 7) - 3, i % 2 ? 'bogenschuetze' : 'miliz');
  }
  for (let n = 0; n < 5; n++) welt.sichtAktualisieren();
  let bestes = Infinity;
  for (let d = 0; d < 5; d++) {
    const t0 = performance.now();
    for (let n = 0; n < 10; n++) welt.sichtAktualisieren();
    bestes = Math.min(bestes, (performance.now() - t0) / 10);
  }
  assert.ok(bestes < 1, `${bestes.toFixed(3)} ms je Rechnung`);
});

test('kampf AC-15: faellt ein Gebaeude, sieht es nichts mehr - erkundet bleibt', () => {
  // Die Sicht der Gebaeude wird nur neu gerechnet, wenn eines entsteht oder
  // faellt (Runde 104: sonst kostete die Sicht die Haelfte mehr Rechenzeit je
  // Partie). Dieser Test haelt die zweite Haelfte fest.
  const welt = new Welt(ZWEI, 4711);
  const p = abseits(welt);
  const haus = welt.gebaeudeAnlegen('a', 'haus', p.x, p.y, true);
  welt.sichtAktualisieren();
  const { x1, y0 } = welt.grundflaeche('haus', haus.x, haus.y);
  assert.equal(welt.sieht('a', x1 + 5, y0), true, 'das Haus sieht');
  welt.gebaeudeZerstoeren(haus);
  welt.sichtAktualisieren();
  assert.equal(welt.sieht('a', x1 + 5, y0), false, 'gefallen, sieht es nichts mehr');
  assert.equal(welt.erkundet('a', x1 + 5, y0), true, 'das Feld bleibt erkundet');
});

test('kampf AC-15: ausserhalb der Karte sieht niemand', () => {
  // Durchsicht Runde 104: ohne Grenze griff x = -1 in die Nachbarreihe.
  const welt = new Welt(ZWEI, 4711);
  const g = welt.karte.groesse;
  const e = welt.einheitAnlegen('a', 0, 10, 'dorfbewohner');
  welt.sichtAktualisieren();
  assert.equal(welt.sieht('a', 0, 10), true, 'am Rand sieht sie');
  // Gegenprobe: das Feld, auf das x = -1 frueher fiel (Reihe 9, ganz
  // rechts), wird gesehen - die Antwort fuer x = -1 muss trotzdem nein sein.
  welt.einheitAnlegen('a', g - 1, 9, 'dorfbewohner');
  welt.sichtAktualisieren();
  assert.equal(welt.sieht('a', g - 1, 9), true, 'das Nachbarfeld der Reihe darueber ist gesehen');
  assert.equal(welt.sieht('a', -1, 10), false);
  assert.equal(welt.erkundet('a', -1, 10), false);
  assert.equal(welt.sieht('a', g, 10), false);
  assert.equal(e.besitzer, 'a');
});

test('kampf AC-16: die Sicht ist eine Einstellung - Nebel, Erkundet oder Aufgedeckt', () => {
  const lauf = (sicht) => {
    const welt = new Welt(ZWEI, 4711, sicht ? { sicht } : {});
    return { welt, p: abseits(welt) };
  };
  // Vorgabe: Nebel - weit draussen weder gesehen noch erkundet.
  const nebel = lauf(undefined);
  assert.equal(nebel.welt.sichtArt, 'nebel');
  assert.equal(nebel.welt.erkundet('a', nebel.p.x, nebel.p.y), false);
  assert.equal(nebel.welt.sieht('a', nebel.p.x, nebel.p.y), false);
  // Erkundet: die Karte ist bekannt, gesehen wird nur, was in Sicht ist.
  const erkundet = lauf('erkundet');
  assert.equal(erkundet.welt.erkundet('a', erkundet.p.x, erkundet.p.y), true, 'erkundet von Anfang an');
  assert.equal(erkundet.welt.sieht('a', erkundet.p.x, erkundet.p.y), false, 'aber nicht beobachtet');
  // Aufgedeckt: alles gesehen - aber nur auf der Karte.
  const offen = lauf('aufgedeckt');
  assert.equal(offen.welt.sieht('a', offen.p.x, offen.p.y), true, 'aufgedeckt sieht alles');
  assert.equal(offen.welt.sieht('a', -1, 0), false);
  // Der Browser erfaehrt es mit dem Aufbau.
  assert.equal(offen.welt.aufbau().sicht, 'aufgedeckt');
});
