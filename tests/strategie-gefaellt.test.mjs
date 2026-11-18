// Der gefaellte Baum (→ specs/10-strategie/darstellung.md AC-31).
//
// Rueckmeldung des Benutzers: "angehakte Holzbäume gibts nicht,". Bis dahin
// meldete der Server einen Vorrat erst, wenn ein Viertel fehlte - ein Baum,
// an dem ein Dorfbewohner hackte, sah 25 Stueck Holz lang aus wie unberuehrt.
// Jetzt meldet er das erste Stueck, und der Browser legt den Baum hin.
//
// Hier steht, was der Server dazu sagt. Wie der liegende Baum aussieht, prueft
// e2e/tests/strategie-gefaellt.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt } = require('../server/spiele/strategie/welt.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

/** Ein Baum am Waldrand mit Gras rechts daneben, und ein Dorfbewohner, der dort hackt. */
function holzfaeller(welt) {
  const g = welt.karte.groesse;
  const index = [...welt.karte.vorrat.keys()].find((i) => welt.karte.felder[i] === karten.WALD
    && karten.begehbar(welt.karte, (i % g) + 1, (i / g) | 0));
  const feld = { x: index % g, y: (index / g) | 0 };
  const einheit = [...welt.einheiten.values()].find((e) => e.art === 'dorfbewohner');
  einheit.x = feld.x + 1;
  einheit.y = feld.y;
  einheit.auftrag = { art: 'sammeln', feld };
  einheit.weg = [];
  welt.feldAenderungen = [];
  welt.sammelnBeginnen(einheit);
  return { index, einheit };
}

/** Takten, bis der Vorrat auf `bis` gefallen ist. */
function hacken(welt, einheit, index, bis) {
  for (let i = 0; i < 600 && welt.karte.vorrat.get(index) > bis; i++) welt.einheitTakten(einheit);
  assert.equal(welt.karte.vorrat.get(index), bis, 'so viel ist noch am Baum');
}

test('darstellung AC-31: das erste Stueck Holz meldet den Baum als angebrochen - danach schweigt der Server bis zum naechsten Viertel', () => {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  const { index, einheit } = holzfaeller(welt);
  const voll = karten.VORRAT[karten.WALD];
  const gemeldet = () => welt.feldAenderungen.filter((a) => a.i === index);
  assert.equal(welt.karte.vorrat.get(index), voll);
  assert.deepEqual(gemeldet(), [], 'unberuehrt: nichts gemeldet');

  // Ein Stueck: der Baum ist angebrochen, noch im vollen Viertel.
  hacken(welt, einheit, index, voll - 1);
  assert.deepEqual(gemeldet(), [{ i: index, a: karten.WALD, v: 4 }]);

  // Weitere Stuecke im selben Viertel: keine Nachricht je Stueck.
  hacken(welt, einheit, index, voll - 4);
  assert.equal(gemeldet().length, 1);

  // Der Schritt ins naechste Viertel wird gemeldet wie bisher.
  welt.karte.vorrat.set(index, voll * 0.75 + 2);
  hacken(welt, einheit, index, voll * 0.75);
  assert.deepEqual(gemeldet(), [{ i: index, a: karten.WALD, v: 4 }, { i: index, a: karten.WALD, v: 3 }]);
});

test('darstellung AC-31: der Aufbau nennt jeden angebrochenen Vorrat mit seinem Viertel - wer zurueckkehrt, sieht den Baum liegen', () => {
  const welt = new Welt(ZWEI, 7);
  assert.deepEqual(welt.aufbau().karte.fuellung, [], 'zu Beginn ist nichts angebrochen');

  const erster = (art) => [...welt.karte.vorrat.keys()].find((i) => welt.karte.felder[i] === art);
  const baum = erster(karten.WALD);
  const gold = erster(karten.GOLD);
  welt.karte.vorrat.set(baum, karten.VORRAT[karten.WALD] - 1);
  welt.karte.vorrat.set(gold, 300); // von 800: das zweite Viertel
  const sortiert = (liste) => [...liste].sort((p, q) => p[0] - q[0]);
  const erwartet = sortiert([[baum, 4], [gold, 2]]);
  assert.deepEqual(sortiert(welt.aufbau().karte.fuellung), erwartet);
  // Auch der Aufbau fuer einen Spieler im Nebel: die Karte darin ist die heutige.
  assert.deepEqual(sortiert(welt.aufbauFuer('a').karte.fuellung), erwartet);

  // Dieselbe Zahl wie in der Feldaenderung: der Browser liest beide gleich.
  const { index, einheit } = holzfaeller(welt);
  hacken(welt, einheit, index, welt.karte.vorrat.get(index) - 1);
  const meldung = welt.feldAenderungen.find((a) => a.i === index);
  const imAufbau = welt.aufbau().karte.fuellung.find(([i]) => i === index);
  assert.deepEqual(imAufbau, [index, meldung.v]);
});
