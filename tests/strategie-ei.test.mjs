// Das Drachenei (→ specs/10-strategie/einheiten-und-befehle.md AC-51, ADR-0014):
// eines je zwei Spieler, fern von jedem Start. Ein Dorfbewohner traegt es wie
// Holz in ein eigenes Kloster; stirbt er, liegt es dort. Ein Ei ist immer an
// genau einem Ort - am Boden, bei einem Traeger oder in einem Kloster.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');

const spielerListe = (n) => Array.from({ length: n }, (_, i) => ({ id: `s${i}`, name: `S${i}` }));
const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const neueWelt = (einstellungen = {}) => new Welt(ZWEI, 7, { sicht: 'aufgedeckt', vorrat: 'viel', ...einstellungen });
const takten = (welt, sekunden) => {
  for (let t = 0; t < sekunden * TAKTE_PRO_SEKUNDE; t++) welt.takten();
};
const bis = (welt, bedingung, sekunden, wozu) => {
  for (let t = 0; t < sekunden * TAKTE_PRO_SEKUNDE; t++) {
    if (bedingung()) return;
    welt.takten();
  }
  assert.ok(bedingung(), `${wozu} - nicht nach ${sekunden} s`);
};

/** Wo ist das Ei? Genau einer der drei Orte muss es sein. */
function orte(ei) {
  return [ei.traeger === null && ei.kloster === null ? 'boden' : null, ei.traeger !== null ? 'traeger' : null, ei.kloster !== null ? 'kloster' : null].filter(Boolean);
}

/** Ein freier Platz fuer ein Gebaeude um einen Punkt. */
function platzUm(welt, art, mitte, abstand = 3) {
  for (let r = abstand; r < 30; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = Math.round(mitte.x) + dx;
        const y = Math.round(mitte.y) + dy;
        if (welt.platzPruefen(art, x, y)) return { x, y };
      }
    }
  }
  throw new Error('kein Platz');
}

test('einheiten AC-51: eines je zwei Spieler, abgerundet, mindestens eines - fern von jedem Start, gleich weit von den zwei naechsten Doerfern, ohne Zufall', () => {
  for (const [spieler, eier] of [[2, 1], [3, 1], [4, 2], [5, 2], [6, 3]]) {
    for (const startwert of [3, 11]) {
      const karte = karten.erzeugen(startwert, spieler);
      assert.equal(karte.eier.length, eier, `${spieler} Spieler, Startwert ${startwert}`);
      for (const ei of karte.eier) {
        const weiten = karte.basen.map((b) => Math.hypot(b.x - ei.x, b.y - ei.y)).sort((a, b) => a - b);
        assert.ok(weiten[0] >= 20, `${spieler} Spieler: das Ei liegt ${weiten[0].toFixed(1)} Felder vom naechsten Dorf`);
        assert.ok(weiten[1] - weiten[0] <= karten.EIER.gleich + 1e-9, `gleich weit: ${weiten[0].toFixed(1)} und ${weiten[1].toFixed(1)}`);
        assert.equal(karte.felder[ei.y * karte.groesse + ei.x], karten.GRAS, 'es liegt im Gras');
      }
      assert.deepEqual(karten.erzeugen(startwert, spieler).eier, karte.eier, 'derselbe Startwert, dieselben Eier');
    }
  }
});

test('einheiten AC-51: ist der Drache abgeschaltet, liegt kein Ei auf der Karte', () => {
  assert.equal(neueWelt().eier.size, 1);
  assert.equal(neueWelt({ drache: 'aus' }).eier.size, 0);
  assert.equal(neueWelt({ drache: 'aus' }).zustand().ei, undefined);
});

test('einheiten AC-51: ein Dorfbewohner hebt das Ei auf und traegt es wie Holz in das eigene Kloster - in jedem Takt ist es an genau einem Ort', () => {
  const welt = neueWelt();
  const [ei] = welt.eier.values();
  const kloster = welt.gebaeudeAnlegen('a', 'kloster', ...Object.values(platzUm(welt, 'kloster', ei, 6)), true);
  const [dorf] = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  dorf.x = ei.x - 3;
  dorf.y = ei.y;
  assert.deepEqual(welt.zustand().ei, [[ei.id, ei.x, ei.y, 1]], 'am Boden, in seiner Mulde');

  welt.befehl('a', [dorf.id], { x: ei.x, y: ei.y });
  assert.equal(dorf.auftrag?.art, 'ei');
  for (let t = 0; t < 120 * TAKTE_PRO_SEKUNDE && ei.kloster === null; t++) {
    welt.takten();
    assert.equal(orte(ei).length, 1, `Takt ${welt.takt}: ${orte(ei).join(', ')}`);
    if (ei.traeger !== null) {
      assert.equal(dorf.ladungsart, 'ei', 'er traegt es als Ladung');
      assert.equal(welt.zustand().einheiten.find((e) => e.i === dorf.id).a, 'e', 'der Zustand nennt die Ladung');
      assert.equal(welt.zustand().ei, undefined, 'am Boden liegt keines mehr');
    }
  }
  assert.equal(ei.kloster, kloster.id, 'es liegt im Kloster');
  assert.equal(dorf.ladung, 0);
  assert.equal(dorf.ladungsart, null);
  assert.equal(welt.gebaeudeFuerDraht(kloster.id).e, 1, 'das Kloster nennt sein Ei');
});

test('einheiten AC-51: stirbt der Traeger, liegt das Ei, wo er fiel; faellt das Kloster, liegt es dort am Boden', () => {
  const welt = neueWelt();
  const [ei] = welt.eier.values();
  const [dorf] = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  dorf.x = ei.x - 1;
  dorf.y = ei.y;
  welt.befehl('a', [dorf.id], { x: ei.x, y: ei.y });
  bis(welt, () => ei.traeger === dorf.id, 10, 'er hebt es auf');
  takten(welt, 3);
  const fiel = { x: Math.round(dorf.x), y: Math.round(dorf.y) };
  welt.einheitSterben(dorf);
  assert.deepEqual(orte(ei), ['boden']);
  assert.deepEqual({ x: ei.x, y: ei.y }, fiel, 'dort, wo er fiel');
  assert.deepEqual(welt.zustand().ei, [[ei.id, fiel.x, fiel.y, fiel.x === ei.nest.x && fiel.y === ei.nest.y ? 1 : 0]]);

  // Ins Kloster gelegt, dann faellt das Kloster.
  const kloster = welt.gebaeudeAnlegen('b', 'kloster', ...Object.values(platzUm(welt, 'kloster', ei, 4)), true);
  ei.x = -1;
  ei.y = -1;
  ei.kloster = kloster.id;
  welt.gebaeudeZerstoeren(kloster);
  assert.deepEqual(orte(ei), ['boden']);
  const { x0, y0, x1, y1 } = welt.grundflaeche('kloster', kloster.x, kloster.y);
  assert.ok(ei.x >= x0 && ei.x <= x1 && ei.y >= y0 && ei.y <= y1, 'auf seinem Platz');
});

test('einheiten AC-51: ein Soldat, der das Ei holen soll, ruestet dafuer ab - dann hebt er es als Dorfbewohner auf', () => {
  const welt = neueWelt();
  const [ei] = welt.eier.values();
  const ritter = welt.einheitAnlegen('a', ei.x - 4, ei.y, 'ritter');
  const nahrung = welt.spielerVon('a').nahrung;
  welt.befehl('a', [ritter.id], { x: ei.x, y: ei.y });
  bis(welt, () => ritter.auftrag?.art === 'abruesten', 20, 'er ruestet am Ei ab');
  assert.equal(welt.spielerVon('a').nahrung, nahrung - 40, 'zum Preis des Abruestens (einheiten AC-50)');
  assert.equal(ei.traeger, null, 'in der Lehrzeit liegt es noch');
  bis(welt, () => ei.traeger === ritter.id, 25, 'nach der Lehrzeit hebt er es auf');
  assert.equal(ritter.art, 'dorfbewohner');
});

test('einheiten AC-51: Moench und Ramme holen kein Ei; wer eines traegt, bringt es oder geht - er sammelt nicht und kaempft nicht', () => {
  const welt = neueWelt();
  const [ei] = welt.eier.values();
  const moench = welt.einheitAnlegen('a', ei.x - 3, ei.y, 'moench');
  welt.befehl('a', [moench.id], { x: ei.x, y: ei.y });
  assert.notEqual(moench.auftrag?.art, 'ei');
  takten(welt, 8);
  assert.equal(ei.traeger, null);

  const [dorf] = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  dorf.x = ei.x - 1;
  dorf.y = ei.y;
  welt.befehl('a', [dorf.id], { x: ei.x, y: ei.y });
  bis(welt, () => ei.traeger === dorf.id, 10, 'er hebt es auf');
  // Kein Kloster: er steht mit dem Ei. Ein Rechtsklick auf einen Gegner ist
  // ein Gang - er behaelt das Ei.
  const feind = welt.einheitAnlegen('b', dorf.x + 5, dorf.y, 'miliz');
  welt.sichtAktualisieren();
  welt.befehl('a', [dorf.id], { x: feind.x, y: feind.y });
  assert.notEqual(dorf.auftrag?.art, 'angreifen');
  assert.equal(ei.traeger, dorf.id, 'er traegt es weiter');
});

test('einheiten AC-51: im Nebel sieht nur, wer hinsieht - das Ei steht nicht im Zustand eines Spielers, der es nicht sieht', () => {
  const welt = new Welt(ZWEI, 7, { sicht: 'nebel' });
  const [ei] = welt.eier.values();
  welt.sichtAktualisieren();
  const zustaende = welt.zustandJeSpieler(['a', 'b']);
  assert.equal(zustaende.get('a').ei, undefined, 'Anna sieht es nicht');
  const spaeher = welt.einheitAnlegen('a', ei.x - 2, ei.y, 'spaeherreiter');
  welt.sichtAktualisieren();
  assert.deepEqual(welt.zustandJeSpieler(['a', 'b']).get('a').ei, [[ei.id, ei.x, ei.y, 1]], 'mit dem Spaeher daneben schon');
  assert.ok(spaeher);
});
