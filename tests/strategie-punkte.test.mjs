// Punkte fuer alle sichtbar (→ specs/10-strategie/bedienung.md AC-47).
//
// Die Rechnung steht im Kriterium: ein Punkt je 10 gesammelte Rohstoffe, je
// 10 Rohstoffe, die ausgebildete Einheiten gekostet haben, je 5, die
// Verbesserungen und Aufstiege gekostet haben. Erwartet wird hier aus den
// Daten, nicht aus einer Zahl im Gedaechtnis - wer an Kosten dreht, bricht
// diesen Test nicht.
//
// Die Rechnung gegen die Welt (ein Rechenteil, ADR-0004); was ein Spieler vom
// anderen bekommt, ueber `zustandJeSpieler` - dieselbe Stelle, die der Raum fragt.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE, VERBESSERUNGEN, AUFSTIEGE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a1', name: 'Anna' }, { id: 'b1', name: 'Bert' }];
const summe = (kosten) => Object.values(kosten).reduce((s, m) => s + m, 0);

function dorfzentrum(w, id) {
  return [...w.gebaeude.values()].find((g) => g.besitzer === id && g.art === 'dorfzentrum');
}

test('bedienung AC-47: die Punkte wachsen mit Sammeln, Ausbilden, Erforschen und Aufstieg - nachgerechnet aus den Daten', () => {
  const w = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const anna = w.spielerVon('a1');
  assert.equal(w.punkte(anna), 0, 'am Anfang keine - die drei Dorfbewohner vom Start zaehlen nicht');

  // Gesammelt: 25 Holz abgeladen, derselbe Weg wie beim Sammeln.
  const einheit = [...w.einheiten.values()].find((e) => e.besitzer === 'a1');
  const dz = dorfzentrum(w, 'a1');
  Object.assign(einheit, { x: dz.x, y: dz.y, ladung: 25, ladungsart: 'holz' });
  einheit.auftrag = { art: 'sammeln', feld: [...w.karte.vorrat.keys()][0] };
  w.abladen(einheit);
  assert.equal(w.punkte(anna), Math.floor(25 / 10));

  // Ausgebildet: ein Dorfbewohner aus dem Dorfzentrum.
  anna.nahrung += 2000;
  anna.gold += 2000;
  assert.deepEqual(w.nachricht('a1', { typ: 'befehl', auftrag: 'ausbilden', gebaeude: dz.id, einheit: 'dorfbewohner' }), {});
  for (let i = 0; i < 60 * TAKTE_PRO_SEKUNDE && anna.ausgebildet === 0; i++) w.takten();
  assert.equal(anna.ausgebildet, 1);
  const gesammelt = summe(anna.gesammelt);
  const einheiten = summe(EINHEITEN.dorfbewohner.kosten);
  assert.equal(w.punkte(anna), Math.floor((gesammelt + einheiten) / 10));

  // Erforscht: der Webstuhl, im Dorfzentrum eingereiht - Wissen zaehlt doppelt.
  assert.deepEqual(w.nachricht('a1', { typ: 'befehl', auftrag: 'ausbilden', gebaeude: dz.id, einheit: 'webstuhl' }), {});
  for (let i = 0; i < 60 * TAKTE_PRO_SEKUNDE && !anna.verbesserungen.includes('webstuhl'); i++) w.takten();
  assert.ok(anna.verbesserungen.includes('webstuhl'), 'der Webstuhl ist erforscht');
  const wissen = summe(VERBESSERUNGEN.webstuhl.kosten);
  const nachWebstuhl = Math.floor((summe(anna.gesammelt) + einheiten) / 10 + wissen / 5);
  assert.equal(w.punkte(anna), nachWebstuhl);

  // Ein Aufstieg: der Zaehler ist das Zeitalter selbst. Ins Lehen sind es 100.
  anna.zeitalter = AUFSTIEGE.feudalzeit.stufe;
  const mitLehen = Math.floor((summe(anna.gesammelt) + einheiten) / 10 + (wissen + summe(AUFSTIEGE.feudalzeit.kosten)) / 5);
  assert.equal(w.punkte(anna), mitLehen);
  assert.equal(mitLehen - nachWebstuhl, 100, 'der Aufstieg ins Lehen bringt 100 Punkte (500 Nahrung / 5)');

  // Verluste ziehen nichts ab: was gefallen ist, war ausgebildet.
  for (const e of [...w.einheiten.values()]) if (e.besitzer === 'a1') w.einheitSterben(e);
  assert.equal(w.punkte(anna), mitLehen);
  // Und Bert, der nichts getan hat, steht weiter bei 0.
  assert.equal(w.punkte(w.spielerVon('b1')), 0);
});

test('bedienung AC-47: im Nebel kommen beim Gegner die Punkte an, seine Vorraete nicht', () => {
  const w = new Welt(ZWEI, 4711, { sicht: 'nebel' });
  const bert = w.spielerVon('b1');
  // Gesammelt wird ueber die Partie - hier gesetzt, damit die Zahl erkennbar ist.
  bert.gesammelt.gold = 1234;
  bert.zeitalter = 1;
  const erwartet = w.punkte(bert);
  assert.ok(erwartet > 100, 'Bert hat erkennbar viele Punkte');

  const je = w.zustandJeSpieler(['a1', 'b1']);
  const beiAnna = je.get('a1').spieler.find((s) => s.id === 'b1');
  assert.equal(beiAnna.pk, erwartet, 'Anna sieht Berts Punkte');
  assert.equal(beiAnna.holz, undefined, 'aber nicht seine Vorraete (kampf AC-13)');
  assert.equal(beiAnna.bev, undefined);
  assert.equal(je.get('b1').spieler.find((s) => s.id === 'b1').pk, erwartet, 'Bert sieht dieselbe Zahl');
  // Wer keine hat, schickt keine - ein Zustand bleibt klein.
  assert.equal('pk' in je.get('b1').spieler.find((s) => s.id === 'a1'), false);
});

// ---- Punkte fuer Siege im Kampf (bedienung AC-49) ---------------------------
// Ein Schlag wird vorgemerkt und am Ende des Taktes abgerechnet
// (`schlagen`, `schlaegeAbrechnen`) - derselbe Weg wie im Spiel, nur ohne
// Anmarsch: die Ziele stehen mit einem Leben da.

function stellen(w, besitzer, art, x, y, leben) {
  const e = w.einheitAnlegen(besitzer, Math.round(x), Math.round(y), art);
  if (leben !== undefined) e.leben = leben;
  return e;
}

test('bedienung AC-49: wer eine Einheit und ein Haus des Gegners vernichtet, bekommt ein Fuenftel ihrer Kosten als Punkte - der Verlierer verliert keine', () => {
  const w = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const anna = w.spielerVon('a1');
  const bert = w.spielerVon('b1');
  const vorher = { anna: w.punkte(anna), bert: w.punkte(bert) };
  const mitte = Math.floor(w.karte.groesse / 2);
  const miliz = stellen(w, 'a1', 'miliz', mitte, mitte);

  const opfer = stellen(w, 'b1', 'dorfbewohner', mitte + 1, mitte, 1);
  w.schlagen(miliz, opfer, false);
  w.schlaegeAbrechnen();
  assert.ok(opfer.tot, 'der Dorfbewohner ist gefallen');
  const einheit = summe(EINHEITEN.dorfbewohner.kosten);
  assert.equal(w.punkte(anna), vorher.anna + Math.floor(einheit / 5));

  // Ein Haus des Gegners, fertig, mit einem Leben.
  let platz = null;
  for (let d = 3; d < 30 && !platz; d++) if (w.platzPruefen('haus', mitte + d, mitte + d)) platz = { x: mitte + d, y: mitte + d };
  const haus = w.gebaeudeAnlegen('b1', 'haus', platz.x, platz.y, true);
  haus.leben = 1;
  w.schlagen(miliz, haus, true);
  w.schlaegeAbrechnen();
  assert.equal(w.gebaeude.has(haus.id), false, 'das Haus ist zerstoert');
  const gebaeude = summe(GEBAEUDE.haus.kosten);
  assert.equal(w.punkte(anna), vorher.anna + Math.floor((einheit + gebaeude) / 5));
  assert.equal(w.punkte(bert), vorher.bert, 'Bert verliert nichts - nur Anna gewinnt');
});

test('bedienung AC-49: wer eigene oder verbuendete trifft, etwa mit dem Stein eines Mangonels, bekommt nichts', () => {
  const DREI = [...ZWEI, { id: 'c1', name: 'Cem' }];
  const w = new Welt(DREI, 4711, { sicht: 'aufgedeckt', teams: { a1: 1, c1: 1, b1: 2 } });
  const anna = w.spielerVon('a1');
  const mitte = Math.floor(w.karte.groesse / 2);
  const mangonel = stellen(w, 'a1', 'mangonel', mitte, mitte);
  const eigener = stellen(w, 'a1', 'dorfbewohner', mitte + 4, mitte, 1);
  const verbuendeter = stellen(w, 'c1', 'dorfbewohner', mitte + 4, mitte + 1, 1);
  const gegner = stellen(w, 'b1', 'dorfbewohner', mitte + 4, mitte - 1, 1);
  const vorher = w.punkte(anna);
  // Der Stein trifft alle drei auf einmal - so verteilt `einschlaegeAbrechnen` ihn.
  for (const ziel of [eigener, verbuendeter, gegner]) {
    w.schlaege.push({ angreifer: mangonel, ziel, schaden: 5, gebaeude: false });
  }
  w.schlaegeAbrechnen();
  assert.ok(eigener.tot && verbuendeter.tot && gegner.tot, 'alle drei sind gefallen');
  // Nur der Gegner zaehlt.
  assert.equal(w.punkte(anna), vorher + Math.floor(summe(EINHEITEN.dorfbewohner.kosten) / 5));
});

test('bedienung AC-49: zwei Schlaege im selben Takt auf dasselbe Ziel zaehlen einmal - fuer den, dessen Schlag zuerst abgerechnet wird', () => {
  const DREI = [...ZWEI, { id: 'c1', name: 'Cem' }];
  const w = new Welt(DREI, 4711, { sicht: 'aufgedeckt' });
  const mitte = Math.floor(w.karte.groesse / 2);
  const annas = stellen(w, 'a1', 'miliz', mitte, mitte);
  const cems = stellen(w, 'c1', 'miliz', mitte + 2, mitte);
  const opfer = stellen(w, 'b1', 'dorfbewohner', mitte + 1, mitte, 1);
  const vorher = { anna: w.punkte(w.spielerVon('a1')), cem: w.punkte(w.spielerVon('c1')) };
  w.schlagen(annas, opfer, false);
  w.schlagen(cems, opfer, false);
  w.schlaegeAbrechnen();
  assert.ok(opfer.tot);
  assert.equal(w.punkte(w.spielerVon('a1')), vorher.anna + Math.floor(summe(EINHEITEN.dorfbewohner.kosten) / 5));
  assert.equal(w.punkte(w.spielerVon('c1')), vorher.cem, 'Cems Schlag traf einen Toten');
});
