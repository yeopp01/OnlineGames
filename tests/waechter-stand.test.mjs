// Waechter: kein Feld kommt still in den Spielstand oder faellt still heraus
// (speichern AC-16, AC-17; ADR-0017 Punkt 7).
//
// Gesichert wird jedes eigene Feld der Welt und der KI, nicht eine Liste von
// Hand - ein neues Feld ist also im naechsten Stand von selbst dabei. Die
// Gefahr ist der **alte** Stand: geladen, fehlte ihm das neue Feld, und die
// Partie liefe mit einer Welt weiter, die der Code so nie baut. Deshalb gilt:
// jede neue Form ist eine neue Fassung, und ein Stand einer anderen Fassung
// wird abgelehnt. Dieser Waechter verlangt die neue Nummer, sobald sich die
// Form gegen das eingecheckte Abbild aendert - wie sie ermittelt wird, steht
// in `scripts/stand-abbild.mjs`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { formErmitteln, abbildLesen, formUnterschied } from '../scripts/stand-abbild.mjs';

const require = createRequire(import.meta.url);
const { FASSUNG } = require('../server/spiele/strategie/stand.js');
const { GEMERKT } = require('../server/spiele/strategie/welt.js');

const abbild = abbildLesen();
const form = formErmitteln();

test('speichern AC-16: die Form des Stands ist die, die im Abbild unter der laufenden Fassung steht', () => {
  assert.ok(abbild[FASSUNG], `Fassung ${FASSUNG} fehlt in server/spiele/strategie/stand-abbild.json - npm run stand:abbild -- --schreiben`);
  const unterschied = formUnterschied(abbild[FASSUNG], form);
  assert.deepEqual(
    unterschied,
    [],
    'Die Form des Spielstands hat sich geaendert. Ist ein Feld dazugekommen oder weggefallen: FASSUNG in ' +
      `server/spiele/strategie/stand.js auf ${FASSUNG + 1} setzen und npm run stand:abbild -- --schreiben - ` +
      'alte Staende werden dann abgelehnt statt halb geladen. Fehlt ein Feld nur, weil die Probepartie in ' +
      'scripts/stand-abbild.mjs es nicht mehr erreicht, dort die Probe erweitern, nicht die Fassung.',
  );
});

test('speichern AC-16: keine Fassung im Abbild ist neuer als die, die der Code schreibt', () => {
  const nummern = Object.keys(abbild).map(Number);
  assert.ok(nummern.every(Number.isInteger), 'Schluessel des Abbilds sind Fassungsnummern');
  assert.equal(Math.max(...nummern), FASSUNG);
});

test('speichern AC-16: was die Partie traegt, steht in der Form - das Tor quer, das Gedaechtnis der KI, der Zufall', () => {
  // Die Richtung des Tors (bauen AC-37) setzt nur, wer ein Tor quer stellt -
  // die KI tut es nie. Ohne sie lagen geladene Tore laengs.
  assert.ok(form.gebaeude.includes('quer'));
  for (const feld of ['gesehen', 'feindOrt', 'heer', 'zufall']) assert.ok(form.ki.includes(feld), `ki.${feld}`);
  for (const feld of ['zufall', 'sichten', 'teamVon', 'takt']) assert.ok(form.welt.includes(feld), `welt.${feld}`);
});

test('speichern AC-1: weg bleibt nur Gemerktes, das beim ersten Lesen neu entsteht', () => {
  // `GEMERKT` in welt.js ist die eine Liste, die das Sichern auslaesst. Was
  // dort steht und kein Gedaechtnis aus anderen Feldern ist, ginge beim Laden
  // verloren - der Gleichlauf (tests/partien/speichern-gleichlauf.mjs) faende
  // es nur, wenn es die Partie aendert.
  for (const feld of GEMERKT) {
    assert.match(feld, /Gemerkt$/, `${feld} steht in GEMERKT, ist aber nichts Gemerktes`);
    assert.ok(!form.welt.includes(feld), `${feld} ist gemerkt und gehoert nicht in den Stand`);
  }
});
