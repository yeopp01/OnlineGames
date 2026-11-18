// Wer kaempft, holt aus (→ specs/10-strategie/bedienung.md AC-39) - der Teil
// auf dem Server: eine Einheit, die ein Ziel hat und in Reichweite steht,
// traegt im Zustand dieselbe Marke wie ein arbeitender Dorfbewohner (`w`).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const eintrag = (welt, id) => welt.zustand().einheiten.find((e) => e.i === id);

test('bedienung AC-39: wer in Reichweite angreift, traegt die Marke - wer nur hinlaeuft, nicht', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const basis = welt.spielerVon('a').basis;
  const anna = welt.einheitAnlegen('a', basis.x, basis.y + 8, 'miliz');
  const bert = welt.einheitAnlegen('b', basis.x + 6, basis.y + 8, 'miliz');
  // Ein befohlener Angriff: erst laeuft Anna hin.
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [anna.id], ziel: { x: bert.x, y: bert.y } });
  welt.takten();
  assert.equal(anna.auftrag?.art, 'angreifen', 'sie greift an');
  assert.ok(anna.weg.length, 'und laeuft noch');
  assert.equal(eintrag(welt, anna.id).w, undefined, 'unterwegs: keine Marke');
  // Bis sie in Reichweite steht.
  let markiert = false;
  for (let t = 0; t < 10 * TAKTE_PRO_SEKUNDE && !markiert; t++) {
    welt.takten();
    markiert = eintrag(welt, anna.id)?.w === 1;
  }
  assert.ok(markiert, 'am Ziel: die Marke');
  assert.equal(anna.weg.length, 0, 'und sie steht');
  // Faellt das Ziel, endet der Kampf - und die Marke.
  bert.leben = 1;
  for (let t = 0; t < 10 * TAKTE_PRO_SEKUNDE; t++) welt.takten();
  assert.ok(!welt.einheiten.has(bert.id) || bert.tot, 'Bert ist gefallen');
  assert.equal(eintrag(welt, anna.id).w, undefined, 'nach dem Kampf keine Marke mehr');
});

// Eine Schlagbewegung je Schlag (bedienung AC-72): der Zustand nennt den Takt
// des letzten Schlags. Gemessen am Leben des Ziels - jedes Mal, wenn es
// faellt, traegt der Angreifer genau diesen Takt.
for (const art of ['miliz', 'bogenschuetze', 'ramme']) {
  test(`bedienung AC-72: der Zustand nennt den Takt des letzten Schlags - ${art}, im Abstand der Nachladezeit`, () => {
    const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
    const basis = welt.spielerVon('a').basis;
    const anna = welt.einheitAnlegen('a', basis.x, basis.y + 9, art);
    // Ein Haus als Ziel: es haelt still und lange genug.
    const haus = welt.gebaeudeAnlegen('b', 'haus', basis.x + 4, basis.y + 9);
    haus.leben = 100000;
    welt.nachricht('a', { auftrag: 'befehl', einheiten: [anna.id], ziel: { x: haus.x, y: haus.y } });
    assert.equal(eintrag(welt, anna.id).sl, undefined, 'vor dem ersten Schlag keine Marke');
    const nachladen = Math.round(welt.einheitenwert('a', art, 'nachladen') * TAKTE_PRO_SEKUNDE);
    const schlaege = [];
    let leben = haus.leben;
    let marken = 0;
    for (let t = 0; t < 30 * TAKTE_PRO_SEKUNDE && schlaege.length < 4; t++) {
      welt.takten();
      const e = eintrag(welt, anna.id);
      if (e.sl !== undefined) {
        marken++;
        assert.equal(e.w, 1, 'die Marke nur an dem, der kaempft');
      }
      // Ein Nahkaempfer trifft im Takt des Schlags; ein Pfeil fliegt erst.
      if (e.sl !== undefined && e.sl !== schlaege.at(-1)) {
        assert.equal(e.sl, welt.takt, 'die Marke ist der Takt, in dem geschlagen wurde');
        schlaege.push(e.sl);
      }
      if (haus.leben < leben) leben = haus.leben;
    }
    assert.equal(schlaege.length, 4, `vier Schlaege gesehen: ${schlaege.join(', ')}`);
    assert.ok(leben < 100000, 'und das Haus hat Leben verloren');
    for (let i = 1; i < schlaege.length; i++) {
      assert.equal(schlaege[i] - schlaege[i - 1], nachladen, `zwischen zwei Schlaegen liegt die Nachladezeit (${nachladen} Takte)`);
    }
    assert.ok(marken > 3 * nachladen, 'die Marke steht in jedem Zustand des Gefechts, nicht nur im Takt des Schlags');
    // Geht sie weg, traegt sie keine Marke mehr.
    welt.nachricht('a', { auftrag: 'befehl', einheiten: [anna.id], ziel: { x: basis.x, y: basis.y + 14 } });
    welt.takten();
    assert.equal(eintrag(welt, anna.id).sl, undefined, 'unterwegs keine Marke');
  });
}

// Wer schlaegt, schaut auf sein Ziel (bedienung AC-76): der Zustand nennt die
// Richtung als Achtel der Karte. Vorher riet das Bild - es nahm den naechsten
// Gegner, und wer auf Befehl einen anderen traf, schlug in die Luft.
const ACHTEL = [[2, 0], [2, 2], [0, 2], [-2, 2], [-2, 0], [-2, -2], [0, -2], [2, -2]];

test('bedienung AC-76: wer schiesst, nennt die Richtung zu seinem Ziel - in allen acht Achteln, auch wenn ein anderer Gegner naeher steht', () => {
  ACHTEL.forEach(([dx, dy], achtel) => {
    const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
    const basis = welt.spielerVon('a').basis;
    const anna = welt.einheitAnlegen('a', basis.x, basis.y + 10, 'bogenschuetze');
    const ziel = welt.einheitAnlegen('b', anna.x + dx, anna.y + dy, 'dorfbewohner');
    ziel.leben = 100000;
    // Der Naehere steht genau gegenueber: das Bild von frueher haette ihn genommen.
    const naeher = welt.einheitAnlegen('b', anna.x - Math.sign(dx), anna.y - Math.sign(dy), 'dorfbewohner');
    naeher.leben = 100000;
    assert.equal(eintrag(welt, anna.id).zr, undefined, 'ohne Ziel keine Richtung');
    welt.nachricht('a', { auftrag: 'befehl', einheiten: [anna.id], ziel: { x: ziel.x, y: ziel.y } });
    welt.takten();
    assert.equal(anna.auftrag?.ziel, ziel.id, 'sie schiesst auf den Befohlenen');
    const e = eintrag(welt, anna.id);
    assert.equal(e.w, 1, 'in Reichweite: sie kaempft');
    assert.equal(e.zr, achtel, `Ziel bei (${dx}, ${dy}): Achtel ${achtel}`);
  });
});

test('bedienung AC-76: wer hinlaeuft, nennt keine Richtung - am Gebaeude zeigt sie auf den naechsten Punkt der Grundflaeche', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const basis = welt.spielerVon('a').basis;
  // Ein Dorfzentrum ist vier Felder breit: wer an seiner Ecke steht, schlaegt
  // geradeaus hinein, nicht schraeg zur Mitte.
  const anna = welt.einheitAnlegen('a', basis.x - 6, basis.y + 12, 'miliz');
  const haus = welt.gebaeudeAnlegen('b', 'haus', basis.x, basis.y + 11);
  haus.leben = 100000;
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [anna.id], ziel: { x: haus.x, y: haus.y } });
  welt.takten();
  assert.ok(anna.weg.length, 'sie laeuft noch');
  assert.equal(eintrag(welt, anna.id).zr, undefined, 'unterwegs keine Richtung');
  for (let t = 0; t < 20 * TAKTE_PRO_SEKUNDE && eintrag(welt, anna.id).w !== 1; t++) welt.takten();
  const e = eintrag(welt, anna.id);
  assert.equal(e.w, 1, 'am Haus: sie schlaegt');
  const { x0, y0, x1, y1 } = welt.grundflaeche('haus', haus.x, haus.y);
  const px = Math.min(Math.max(anna.x, x0), x1);
  const py = Math.min(Math.max(anna.y, y0), y1);
  const soll = ((Math.round(Math.atan2(py - anna.y, px - anna.x) / (Math.PI / 4)) % 8) + 8) % 8;
  assert.equal(e.zr, soll, 'zum naechsten Punkt der Grundflaeche');
});

test('bedienung AC-76: wer faellt, nennt die Richtung zu dem, der ihn traf', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const basis = welt.spielerVon('a').basis;
  const anna = welt.einheitAnlegen('a', basis.x, basis.y + 10, 'bogenschuetze');
  // Bert steht laengs +y von Anna: der Pfeil kommt fuer ihn aus -y, Achtel 6.
  const bert = welt.einheitAnlegen('b', anna.x, anna.y + 3, 'dorfbewohner');
  bert.leben = 1;
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [anna.id], ziel: { x: bert.x, y: bert.y } });
  let gefallen = null;
  for (let t = 0; t < 10 * TAKTE_PRO_SEKUNDE && !gefallen; t++) {
    welt.takten();
    const e = eintrag(welt, bert.id);
    if (e?.s) gefallen = e;
  }
  assert.ok(gefallen, 'Bert ist gefallen und liegt noch im Bild');
  assert.equal(gefallen.zr, 6, 'er faellt dem Schuetzen zugewandt - also von ihm weg');
  // Wer ohne Gegner faellt (Entf, Aufgeben), nennt nichts: er faellt, wie er steht.
  const dritter = welt.einheitAnlegen('b', basis.x + 5, basis.y + 10, 'miliz');
  welt.nachricht('b', { auftrag: 'entlassen', einheit: dritter.id });
  assert.equal(eintrag(welt, dritter.id).s, 1);
  assert.equal(eintrag(welt, dritter.id).zr, undefined, 'entlassen: keine Richtung');
});

test('bedienung AC-76: das Achtel der Karte ist dieselbe Zeile der Tafel wie die Richtung im Bild', async () => {
  // public/bilder.js ist ein Modul fuer den Browser; Node hielte die Endung .js
  // in diesem Paket fuer CommonJS. Als Daten-Adresse geladen ist es eines.
  const quelle = readFileSync(new URL('../public/bilder.js', import.meta.url));
  const { richtungAus, richtungAusAchtel } = await import(`data:text/javascript;base64,${quelle.toString('base64')}`);
  ACHTEL.forEach(([dx, dy], achtel) => {
    // Im Bild: nach rechts geht x - y, nach unten die Haelfte von x + y.
    assert.equal(richtungAusAchtel(achtel), richtungAus(dx - dy, (dx + dy) / 2), `Achtel ${achtel}`);
  });
});
