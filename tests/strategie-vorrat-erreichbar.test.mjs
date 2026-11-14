// Ein Vorrat, an den man nicht herankommt (einheiten AC-63) - Rechenteile,
// direkt geprueft (→ docs/adr/0004-teststrategie.md).
//
// Aus dem Spiel auf dem Server (2026-11-13): "wenn ich auf einen baum klicke
// fuern dorfbewohner und der baum is nicht erreichbar, soll er den daneben
// nehmen - gilt auch fuer alle andren ressourcen." Vorher nahm er den
// naechsten bei sich selbst: gemessen 24 bis 38 Felder vom Klick entfernt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt } = require('../server/spiele/strategie/welt.js');
const { erreichbar } = require('../server/spiele/strategie/wege.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const neueWelt = (startwert) => new Welt(ZWEI, startwert, { sicht: 'aufgedeckt' });
const bauerVon = (welt) => [...welt.einheiten.values()].find((u) => u.besitzer === 'a' && u.art === 'dorfbewohner');
const NACHBARN = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

/**
 * Vorraete weiter als 13 Felder vom Dorfbewohner, an die er nicht einfach
 * herankommt: `insel` hat kein erreichbares Nachbarfeld, bei `seite` ist nur
 * das ihm naechste nicht erreichbar. `nahe`: wie weit der naechste Vorrat
 * derselben Art liegt, der ein erreichbares Nachbarfeld hat.
 */
function schwierige(welt) {
  const g = welt.karte.groesse;
  const bauer = bauerVon(welt);
  const da = Uint8Array.from(erreichbar(welt.karte, welt.feldVon(bauer)));
  const hatStand = (x, y) => NACHBARN.some(([dx, dy]) => da[(y + dy) * g + x + dx]);
  const ziele = [];
  for (const index of welt.karte.vorrat.keys()) {
    const x = index % g;
    const y = (index / g) | 0;
    const weit = Math.hypot(x - bauer.x, y - bauer.y);
    if (weit <= 13 || weit > 30) continue;
    const frei = NACHBARN.map(([dx, dy]) => ({ x: x + dx, y: y + dy })).filter((n) => karten.begehbar(welt.karte, n.x, n.y));
    frei.sort((a, b) => Math.hypot(a.x - bauer.x, a.y - bauer.y) - Math.hypot(b.x - bauer.x, b.y - bauer.y));
    const fall = !hatStand(x, y) ? 'insel' : frei.length && !da[frei[0].y * g + frei[0].x] ? 'seite' : null;
    if (!fall) continue;
    let nahe = Infinity;
    for (const anderer of welt.karte.vorrat.keys()) {
      if (welt.karte.felder[anderer] !== welt.karte.felder[index]) continue;
      const ax = anderer % g;
      const ay = (anderer / g) | 0;
      if (hatStand(ax, ay)) nahe = Math.min(nahe, Math.hypot(ax - x, ay - y));
    }
    ziele.push({ x, y, fall, nahe, art: welt.karte.felder[index] });
  }
  return ziele;
}

/** Schickt den Dorfbewohner auf das Feld und wartet, bis er sammelt. */
function sammeltNach(startwert, ziel) {
  const welt = neueWelt(startwert);
  const bauer = bauerVon(welt);
  welt.nachricht('a', { einheiten: [bauer.id], ziel: { x: ziel.x, y: ziel.y } });
  for (let t = 0; t < 1200 && !bauer.sammelt; t++) welt.takten();
  return { welt, bauer };
}

test('einheiten AC-63: kein Weg an den geklickten Vorrat - er nimmt den naechsten derselben Art am Klick, nicht den bei sich', () => {
  const faelle = { insel: 0, seite: 0 };
  for (let startwert = 1; startwert <= 6; startwert++) {
    const ziele = schwierige(neueWelt(startwert)).filter((z) => z.nahe <= 12);
    for (const ziel of ziele.filter((z, i) => i % 7 === 0).slice(0, 6)) {
      const { welt, bauer } = sammeltNach(startwert, ziel);
      assert.equal(bauer.sammelt, true, `Startwert ${startwert}, Feld ${ziel.x},${ziel.y}: er sammelt`);
      const feld = bauer.auftrag.feld;
      const g = welt.karte.groesse;
      assert.equal(welt.karte.felder[feld.y * g + feld.x], ziel.art, 'dieselbe Art');
      const fern = Math.hypot(feld.x - ziel.x, feld.y - ziel.y);
      assert.ok(fern <= ziel.nahe + 1e-9, `Startwert ${startwert}, Feld ${ziel.x},${ziel.y} (${ziel.fall}): `
        + `er sammelt ${fern.toFixed(1)} Felder vom Klick, der naechste erreichbare liegt ${ziel.nahe.toFixed(1)} entfernt`);
      faelle[ziel.fall] += 1;
    }
  }
  assert.ok(faelle.insel >= 5, `mindestens fuenf eingeschlossene Vorraete geprueft (${faelle.insel})`);
});

test('einheiten AC-63: nur die nahe Seite ist zu - derselbe Vorrat, von der anderen Seite', () => {
  let geprueft = 0;
  for (let startwert = 1; startwert <= 10 && geprueft < 5; startwert++) {
    for (const ziel of schwierige(neueWelt(startwert)).filter((z) => z.fall === 'seite').slice(0, 2)) {
      const { bauer } = sammeltNach(startwert, ziel);
      assert.deepEqual(bauer.auftrag.feld, { x: ziel.x, y: ziel.y }, `Startwert ${startwert}: derselbe Vorrat`);
      assert.ok(Math.hypot(bauer.x - ziel.x, bauer.y - ziel.y) <= 1.9, 'und er steht daran');
      geprueft += 1;
    }
  }
  assert.ok(geprueft >= 3, `mindestens drei solche Vorraete geprueft (${geprueft})`);
});

test('einheiten AC-63: ein erreichbarer Vorrat bleibt der geklickte', () => {
  const welt = neueWelt(3);
  const g = welt.karte.groesse;
  const bauer = bauerVon(welt);
  const da = erreichbar(welt.karte, welt.feldVon(bauer));
  let ziel = null;
  let weit = Infinity;
  for (const index of welt.karte.vorrat.keys()) {
    const x = index % g;
    const y = (index / g) | 0;
    const frei = NACHBARN.map(([dx, dy]) => ({ x: x + dx, y: y + dy })).filter((n) => karten.begehbar(welt.karte, n.x, n.y));
    if (!frei.length || !frei.every((n) => da[n.y * g + n.x])) continue;
    const d = Math.hypot(x - bauer.x, y - bauer.y);
    if (d > 6 && d < weit) {
      weit = d;
      ziel = { x, y };
    }
  }
  welt.nachricht('a', { einheiten: [bauer.id], ziel });
  for (let t = 0; t < 600 && !bauer.sammelt; t++) welt.takten();
  assert.equal(bauer.sammelt, true);
  assert.deepEqual(bauer.auftrag.feld, ziel);
  assert.equal(bauer.auftrag.stand, undefined, 'ohne festes Standfeld - das naechste in Luftlinie reicht');
});

test('einheiten AC-63: erreichbar ist, was sich zu Fuss erreichen laesst - Tore nur fuer den, dem sie offenstehen', () => {
  const welt = neueWelt(2);
  const g = welt.karte.groesse;
  const bauer = bauerVon(welt);
  const start = welt.feldVon(bauer);
  const da = Uint8Array.from(erreichbar(welt.karte, start));
  assert.equal(da[start.y * g + start.x], 1, 'das eigene Feld');
  let wald = -1;
  for (let i = 0; i < g * g && wald < 0; i++) if (welt.karte.felder[i] === karten.WALD) wald = i;
  assert.equal(da[wald], 0, 'ein Baum ist kein Feld zum Stehen');
  // Ein bebautes Feld neben einem erreichbaren: zu - ausser es steht in `frei`.
  let zu = -1;
  for (let i = g + 1; i < g * g - g - 1 && zu < 0; i++) {
    if (welt.karte.felder[i] !== karten.GRAS && (da[i - 1] || da[i + 1] || da[i - g] || da[i + g])) zu = i;
  }
  assert.equal(da[zu], 0);
  assert.equal(erreichbar(welt.karte, start, new Set([zu]))[zu], 1, 'als offenes Tor zaehlt es');
});
