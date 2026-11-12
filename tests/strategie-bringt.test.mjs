// Was eine Verbesserung bringt, steht am Knopf (bedienung AC-55). Den Satz
// schreibt der Server aus denselben Daten, mit denen er rechnet - der Browser
// liest keine Wirkungen (tests/waechter-wirkungen.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { bringt } = require('../server/spiele/strategie/bringt.js');
const { VERBESSERUNGEN, EINHEITEN } = require('../server/spiele/strategie/daten.js');
const { Welt } = require('../server/spiele/strategie/welt.js');

test('bedienung AC-55: jede Verbesserung sagt, was sie bringt - oder tauscht eine Einheit aus', () => {
  for (const [art, verbesserung] of Object.entries(VERBESSERUNGEN)) {
    const zeilen = bringt(verbesserung);
    assert.ok(Array.isArray(zeilen), art);
    // Wer nur austauscht (Soldat, Armbrust), dessen Zeile schreibt der
    // Browser aus den Namen der Einheiten.
    assert.ok(zeilen.length > 0 || verbesserung.wandelt, `${art} sagt nichts und tauscht nichts`);
    for (const zeile of zeilen) {
      assert.equal(typeof zeile, 'string');
      assert.doesNotMatch(zeile, /undefined|NaN|\[object/, `${art}: ${zeile}`);
    }
  }
});

test('bedienung AC-55: die Saetze nennen die Zahlen der Daten, nicht eigene', () => {
  const webstuhl = bringt(VERBESSERUNGEN.webstuhl).join(' | ');
  const leben = Object.values(VERBESSERUNGEN.webstuhl.wirkung).map((w) => w.leben).find(Boolean);
  assert.ok(leben > 0, 'der Webstuhl gibt Leben');
  assert.match(webstuhl, new RegExp(`\\+${leben} Leben`));
  assert.match(webstuhl, /Dorfbewohner/);

  // Ein anderer Wert in den Daten ergibt einen anderen Satz.
  const mehr = structuredClone(VERBESSERUNGEN.webstuhl);
  for (const w of Object.values(mehr.wirkung)) if (w.leben) w.leben += 7;
  assert.match(bringt(mehr).join(' | '), new RegExp(`\\+${leben + 7} Leben`));

  assert.match(bringt(VERBESSERUNGEN.doppelaxt).join(' | '), /Holz/);
  assert.match(bringt(VERBESSERUNGEN.pferdekummet).join(' | '), /Farm/);
  assert.match(bringt(VERBESSERUNGEN.mauerwerk).join(' | '), /Gebäude/);
});

test('bedienung AC-55: der Aufbau traegt die Saetze und das Tempo jeder Einheit', () => {
  const spieler = [
    { id: 's1', name: 'Anna', farbe: '#4f8cff' },
    { id: 's2', name: 'Bert', farbe: '#ff5d5d' },
  ];
  const welt = new Welt(spieler, 7);
  const aufbau = welt.aufbau();
  for (const [art, verbesserung] of Object.entries(aufbau.werte.verbesserungen)) {
    assert.deepEqual(verbesserung.bringt, bringt(VERBESSERUNGEN[art]), art);
  }
  for (const [art, einheit] of Object.entries(aufbau.werte.einheiten)) {
    assert.equal(einheit.tempo, EINHEITEN[art].tempo || 0, `Tempo von ${art}`);
  }
});
