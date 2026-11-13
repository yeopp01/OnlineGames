// Leben einer Baustelle (→ specs/10-strategie/bauen.md AC-7) - Rechenteile,
// direkt geprueft (→ docs/adr/0004-teststrategie.md).
//
// Eine Baustelle beginnt mit einem Leben und waechst mit dem Bau; was ihr
// zugefuegt wurde, bleibt abgezogen. Vorher stand sie vom ersten Takt an mit
// vollem Leben da - ein Haus aus einem Holzhaufen hielt so viel aus wie ein
// fertiges.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, VERBESSERUNGEN } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

// Ein freies Viereck neben Annas Basis: Mitte und Halbmesser r frei.
function freiesViereck(welt, r, ab = 9) {
  const a = welt.spielerVon('a');
  for (let d = ab; d < 40; d++) {
    for (const [dx, dy] of [[d, 0], [0, d], [d, d], [-d, d], [d, -d]]) {
      const x = a.basis.x + dx;
      const y = a.basis.y + dy;
      let frei = true;
      for (let oy = -r; oy <= r && frei; oy++) {
        for (let ox = -r; ox <= r && frei; ox++) {
          if (!karten.begehbar(welt.karte, x + ox, y + oy) || welt.gebaeudeAn(x + ox, y + oy)) frei = false;
        }
      }
      if (frei) return { x, y };
    }
  }
  throw new Error('kein freies Viereck');
}

// Laeuft, bis die Bedingung gilt - hoechstens `sekunden` Spielzeit.
function bis(welt, bedingung, sekunden) {
  for (let t = 0; t < sekunden * TAKTE_PRO_SEKUNDE; t++) {
    if (bedingung()) return true;
    welt.takten();
  }
  return bedingung();
}

// Eine Kaserne, von einem Dorfbewohner Annas begonnen.
function baustelle(welt, art = 'kaserne') {
  const anna = welt.spielerVon('a');
  anna.holz = 1000;
  const m = freiesViereck(welt, 3);
  const bauer = welt.einheitAnlegen('a', m.x - 3, m.y, 'dorfbewohner');
  const antwort = welt.bauen('a', [bauer.id], art, { x: m.x - 1, y: m.y - 1 });
  assert.ok(antwort.gebaeude, `gebaut: ${JSON.stringify(antwort)}`);
  return { gebaeude: welt.gebaeude.get(antwort.gebaeude), bauer, m };
}

test('bauen AC-7: eine Baustelle beginnt mit einem Leben, waechst mit dem Bau, und fertig traegt sie das volle Leben', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const { gebaeude } = baustelle(welt);
  const voll = welt.gebaeudewert('a', 'kaserne', 'leben');
  assert.equal(gebaeude.fertig, false);
  assert.equal(gebaeude.leben, 1, 'eine frische Baustelle hat ein Leben');

  // Jeden Takt: Leben = Anteil des Fortschritts am vollen Leben.
  let halb = null;
  assert.ok(bis(welt, () => {
    assert.equal(gebaeude.leben, Math.max(1, Math.round(voll * gebaeude.bau)), `bei ${gebaeude.bau}`);
    if (halb === null && gebaeude.bau >= 0.5) halb = gebaeude.leben;
    return gebaeude.fertig;
  }, GEBAEUDE.kaserne.bauzeit * 2), 'fertig geworden');
  assert.ok(halb >= voll * 0.5 && halb <= voll * 0.52, `zur Haelfte gebaut ${halb} von ${voll}`);
  assert.equal(gebaeude.leben, voll, 'fertig: das volle Leben');
});

test('bauen AC-7: Schaden an der Baustelle bleibt - weitergebaut steht sie mit dem vollen Leben weniger dem Schaden', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const { gebaeude } = baustelle(welt);
  const voll = welt.gebaeudewert('a', 'kaserne', 'leben');
  assert.ok(bis(welt, () => gebaeude.bau >= 0.3, GEBAEUDE.kaserne.bauzeit * 2));
  const vorher = gebaeude.leben;
  gebaeude.leben -= 100;
  welt.takten();
  assert.ok(gebaeude.leben < vorher, 'der Schaden wird nicht vom Bau geschluckt');
  assert.ok(bis(welt, () => gebaeude.fertig, GEBAEUDE.kaserne.bauzeit * 2));
  assert.equal(gebaeude.leben, voll - 100, 'fertig, aber angeschlagen');
});

test('bauen AC-7: ein Schlag einer Miliz faellt eine frische Baustelle - ein fertiges Haus haelt in derselben Zeit stand', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const m = freiesViereck(welt, 4, 12);
  const baustelleHaus = welt.gebaeudeAnlegen('a', 'haus', m.x - 2, m.y, false);
  const fertigesHaus = welt.gebaeudeAnlegen('a', 'haus', m.x + 2, m.y, true);
  assert.equal(baustelleHaus.leben, 1);
  assert.equal(fertigesHaus.leben, welt.gebaeudewert('a', 'haus', 'leben'), 'ein fertig angelegtes Haus behaelt sein volles Leben');

  const gegen = (ziel, x) => {
    const miliz = welt.einheitAnlegen('b', x, m.y + 3, 'miliz');
    welt.nachricht('b', { auftrag: 'befehl', einheiten: [miliz.id], ziel: { x: ziel.x, y: ziel.y } });
    return miliz;
  };
  const ersteMiliz = gegen(baustelleHaus, m.x - 2);
  const zweiteMiliz = gegen(fertigesHaus, m.x + 2);
  // Beide laufen gleich weit; die Baustelle faellt beim ersten Schlag.
  const leben = welt.gebaeudewert('a', 'haus', 'leben');
  let schlaege = 0;
  let zuletzt = fertigesHaus.leben;
  assert.ok(bis(welt, () => {
    if (fertigesHaus.leben < zuletzt) { schlaege++; zuletzt = fertigesHaus.leben; }
    return !welt.gebaeude.has(baustelleHaus.id);
  }, 20), 'die Baustelle ist gefallen');
  assert.ok(schlaege <= 1, `das fertige Haus hat in dieser Zeit ${schlaege} Schlaege bekommen`);
  assert.ok(fertigesHaus.leben > leben / 2, `das fertige Haus steht, noch ${fertigesHaus.leben} von ${leben}`);
  welt.einheitSterben(ersteMiliz);
  welt.einheitSterben(zweiteMiliz);
});

test('bauen AC-7: Mauerwerk legt auf eine Baustelle nur den Anteil ihres Fortschritts nach - fertig steht das neue volle Leben', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const anna = welt.spielerVon('a');
  const mauerwerk = Object.keys(VERBESSERUNGEN).find((v) => VERBESSERUNGEN[v].gebaeude?.lebenAnteil);
  const { gebaeude } = baustelle(welt);
  const alt = welt.gebaeudewert('a', 'kaserne', 'leben');
  assert.ok(bis(welt, () => gebaeude.bau >= 0.4, GEBAEUDE.kaserne.bauzeit * 2));
  const vorher = gebaeude.leben;
  welt.erforschen(anna, mauerwerk);
  const neu = welt.gebaeudewert('a', 'kaserne', 'leben');
  assert.ok(neu > alt, 'Mauerwerk gibt mehr Leben');
  assert.equal(gebaeude.leben, Math.max(1, Math.round(neu * gebaeude.bau)), 'der Anteil des Fortschritts am neuen Leben');
  assert.ok(gebaeude.leben - vorher < neu - alt, 'nicht der ganze Zuwachs auf einmal');
  assert.ok(bis(welt, () => gebaeude.fertig, GEBAEUDE.kaserne.bauzeit * 2));
  assert.equal(gebaeude.leben, neu, 'fertig: genau das neue volle Leben');
});
