// Laden ergibt dieselbe Partie (speichern AC-2, ADR-0017): gesichert mitten
// im Spiel, geladen, und dann laufen die geladene und die nie unterbrochene
// Partie nebeneinander weiter - gleich gleich nach dem Laden und gleich nach
// 3000 weiteren Takten (fuenf Spielminuten), und in jedem Takt dazwischen
// bekommt jeder Spieler denselben Auszug (`zustandJeSpieler`, wie ihn der
// Raum holt - er legt selbst Felder an).
//
// Zwanzig Startwerte, die Haeuser aus dem Startwert gezogen wie beim Eroeffnen,
// jeder vierte zwei gegen zwei - dort teilen Verbuendete ein Sichtfeld, und
// das muss nach dem Laden **ein** Feld bleiben. Gesichert wird zwischen
// Minute 5 und 30: im Lehen und im Fuerstentum, mit Burgen, Rammen, Markt.
//
// Verglichen wird der Wert, nicht die Bytes (tests/gleichwertig.mjs sagt,
// warum), und zwar das, was ein Stand enthaelt: Welt **und** KIs. Geteilt
// auf zwei Dateien (je zehn Startwerte), weil `node --test` Dateien
// nebeneinander rechnet. Hier keine Zeitmessung (waechter-testordner).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { unterschiede } from '../gleichwertig.mjs';

const require = createRequire(import.meta.url);
const steckbrief = require('../../server/spiele/strategie/steckbrief.js');
const stand = require('../../server/spiele/strategie/stand.js');
const { TAKTE_PRO_SEKUNDE } = require('../../server/spiele/strategie/welt.js');

export const WEITER = 3000;

/** Was in einem Stand steht - Welt und KIs als Wert. */
const inhalt = (welt) => stand.lesen(welt.sichern());

export function aufstellung(startwert) {
  const zuViert = startwert % 4 === 0;
  return {
    einstellungen: {
      ki: zuViert ? 4 : 2,
      startwert,
      ...(zuViert ? { teams: { ki1: 1, ki2: 1, ki3: 2, ki4: 2 } } : {}),
    },
    minute: 5 + ((startwert * 7) % 26),
  };
}

function takten(welt, ids, takte) {
  for (let i = 0; i < takte && !welt.ende; i++) {
    welt.takten();
    welt.zustandJeSpieler(ids);
  }
}

export function gleichlauf(startwert) {
  const { einstellungen, minute } = aufstellung(startwert);
  const original = steckbrief.erzeugen([], einstellungen);
  const ids = original.spieler.map((s) => s.id);
  takten(original, ids, minute * 60 * TAKTE_PRO_SEKUNDE);

  const bytes = original.sichern();
  const geladen = steckbrief.laden(bytes);
  const gleichNachLaden = unterschiede(stand.lesen(bytes), inhalt(geladen));

  // Nebeneinander weiter, und jeder Takt geht an die Spieler gleich hinaus:
  // was die Welt sich nur fuer den Auszug merkt (`bekannt`, `felderOffen`),
  // aendert den Lauf nicht - aber es aendert, was der Bildschirm zeigt.
  let auszug = [];
  for (let i = 0; i < WEITER && !original.ende; i++) {
    original.takten();
    geladen.takten();
    const a = original.zustandJeSpieler(ids);
    const b = geladen.zustandJeSpieler(ids);
    if (!auszug.length) auszug = unterschiede(a, b, 3).map((u) => `Takt ${original.takt}: ${u}`);
  }
  const gleichDanach = unterschiede(inhalt(original), inhalt(geladen));
  return { minute, takt: original.takt, gleichNachLaden, gleichDanach, auszug };
}

export function satz(von, bis) {
  for (let startwert = von; startwert <= bis; startwert++) {
    const { einstellungen, minute } = aufstellung(startwert);
    test(`speichern AC-2: Startwert ${startwert} (${einstellungen.ki} KIs, gesichert in Minute ${minute}) laeuft nach dem Laden Takt fuer Takt wie ohne Unterbrechung`, () => {
      const r = gleichlauf(startwert);
      assert.deepEqual(r.gleichNachLaden, [], 'gleich nach dem Laden');
      assert.deepEqual(r.auszug, [], 'was jeder Spieler je Takt bekommt');
      assert.deepEqual(r.gleichDanach, [], `nach ${WEITER} weiteren Takten (Takt ${r.takt})`);
    });
  }
}
