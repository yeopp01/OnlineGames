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
const { EINHEITEN, VERBESSERUNGEN, AUFSTIEGE } = require('../server/spiele/strategie/daten.js');

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
