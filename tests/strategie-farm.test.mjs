// Die Farm (einheiten AC-18, bauen AC-20) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const sekunden = (welt, s) => { for (let i = 0; i < s * TAKTE_PRO_SEKUNDE; i++) welt.takten(); };
const dorfbewohner = (welt, spieler = 'a') => [...welt.einheiten.values()].filter((e) => e.besitzer === spieler && e.art === 'dorfbewohner');

function freierPlatz(welt, art, abstand = 6) {
  const basis = welt.spielerVon('a').basis;
  for (let r = abstand; r < 30; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (welt.platzPruefen(art, basis.x + dx, basis.y + dy)) return { x: basis.x + dx, y: basis.y + dy };
      }
    }
  }
  throw new Error('kein Platz');
}

// Eine fertige Farm neben der Basis, ohne Bauzeit.
function mitFarm() {
  const welt = new Welt(ZWEI, 7, { vorrat: 'viel' });
  const platz = freierPlatz(welt, 'farm');
  const farm = welt.gebaeudeAnlegen('a', 'farm', platz.x, platz.y, true);
  return { welt, farm, platz };
}

function bisAufDerFarm(welt, einheit) {
  for (let i = 0; i < 1500 && !einheit.sammelt; i++) welt.takten();
  assert.ok(einheit.sammelt, 'er arbeitet auf der Farm');
}

test('bauen AC-20: die Farm nach der Tabelle - 3 x 3, 60 Holz, 15 Sekunden, 480 Leben, 175 Nahrung, begehbar', () => {
  // Feld fuer Feld statt deepEqual: die Tabelle waechst mit den Stufen
  // (Ruestung kam mit dem Kampf dazu), die Zahlen der Vorlage bleiben.
  const f = GEBAEUDE.farm;
  assert.deepEqual(
    [f.groesse, f.kosten, f.bauzeit, f.leben, f.wohnraum, f.annahme, f.bildetAus, f.begehbar, f.nahrung, f.rate],
    [3, { holz: 60 }, 15, 480, 0, [], [], true, 175, 0.32],
  );
  const { welt, farm } = mitFarm();
  const { x0, y0, x1, y1 } = welt.grundflaeche('farm', farm.x, farm.y);
  assert.deepEqual([x1 - x0 + 1, y1 - y0 + 1], [3, 3]);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) assert.equal(karten.begehbar(welt.karte, x, y), true, 'eine Farm ist begehbar');
  }
  // Begehbar heisst nicht bebaubar.
  assert.equal(welt.platzPruefen('haus', farm.x, farm.y), false);
});

test('einheiten AC-18: ein Dorfbewohner bestellt die Farm mit 0,32 Nahrung je Sekunde', () => {
  const { welt, farm } = mitFarm();
  const [bauer] = dorfbewohner(welt);
  welt.befehl('a', [bauer.id], { x: farm.x, y: farm.y });
  assert.deepEqual(bauer.auftrag, { art: 'farm', gebaeude: farm.id });
  bisAufDerFarm(welt, bauer);
  assert.ok(welt.aufGrundflaeche(bauer, farm), 'er steht auf der Farm');
  sekunden(welt, 20);
  assert.equal(bauer.ladungsart, 'nahrung');
  assert.equal(bauer.ladung, Math.floor(0.32 * 20));
  assert.equal(farm.nahrung, 175 - bauer.ladung);
  assert.ok(welt.zustand().gebaeude.some((g) => g.i === farm.id && g.n === farm.nahrung), 'der Browser sieht, wie viel noch da ist');
});

test('einheiten AC-18: auf einer Farm arbeitet hoechstens einer', () => {
  const { welt, farm } = mitFarm();
  const [erster, zweiter] = dorfbewohner(welt);
  welt.befehl('a', [erster.id], { x: farm.x, y: farm.y });
  welt.befehl('a', [zweiter.id], { x: farm.x, y: farm.y });
  assert.equal(farm.arbeiter, erster.id);
  assert.notEqual(zweiter.auftrag?.art, 'farm', 'der Zweite bekommt sie nicht');
  // Geht der Erste woanders hin, ist sie frei.
  welt.befehl('a', [erster.id], { x: farm.x + 6, y: farm.y });
  assert.equal(farm.arbeiter, null);
  welt.befehl('a', [zweiter.id], { x: farm.x, y: farm.y });
  assert.equal(farm.arbeiter, zweiter.id);
});

test('einheiten AC-18: voll zum Dorfzentrum, zurueck auf dieselbe Farm; leer ist sie weg', () => {
  const { welt, farm } = mitFarm();
  const anna = welt.spielerVon('a');
  const [bauer] = dorfbewohner(welt);
  welt.befehl('a', [bauer.id], { x: farm.x, y: farm.y });
  bisAufDerFarm(welt, bauer);
  const nahrung = anna.nahrung;
  for (let i = 0; i < 120 * TAKTE_PRO_SEKUNDE && anna.nahrung === nahrung; i++) welt.takten();
  assert.equal(anna.nahrung, nahrung + 10);
  for (let i = 0; i < 60 * TAKTE_PRO_SEKUNDE && !bauer.sammelt; i++) welt.takten();
  assert.deepEqual(bauer.auftrag, { art: 'farm', gebaeude: farm.id }, 'zurueck auf dieselbe Farm');

  // Die letzte Nahrung: danach ist die Farm fort, der Rest wird abgegeben.
  farm.nahrung = 1;
  bauer.angefangen = 0.99;
  welt.zustand();
  welt.takten();
  assert.equal(welt.gebaeude.has(farm.id), false);
  assert.ok(welt.zustand().gebaeude.some((g) => g.i === farm.id && g.weg));
  const vorher = anna.nahrung;
  const getragen = bauer.ladung;
  for (let i = 0; i < 120 * TAKTE_PRO_SEKUNDE && bauer.ladung > 0; i++) welt.takten();
  assert.equal(anna.nahrung, vorher + getragen);
  assert.equal(bauer.auftrag, null);
});

test('bauen AC-1: nach dem Bau einer Farm bestellt der Bauer sie', () => {
  const welt = new Welt(ZWEI, 7);
  const [bauer] = dorfbewohner(welt);
  const platz = freierPlatz(welt, 'farm');
  const { gebaeude: id } = welt.bauen('a', [bauer.id], 'farm', platz);
  for (let i = 0; i < 90 * TAKTE_PRO_SEKUNDE && !welt.gebaeude.get(id).fertig; i++) welt.takten();
  assert.equal(welt.gebaeude.get(id).fertig, true);
  assert.deepEqual(bauer.auftrag, { art: 'farm', gebaeude: id });
  assert.equal(welt.gebaeude.get(id).arbeiter, bauer.id);
});
