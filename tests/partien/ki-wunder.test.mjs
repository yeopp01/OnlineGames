// Die KI geht aufs Wunder (ki AC-40): steht ein fertiges Wunder eines Gegners,
// ist es das Ziel ihres naechsten Aufbruchs - sofort, mit allem ausser der
// Wache und mit ihren Rammen voraus. Im Pruefstand: in Minute 30 bekommt die
// KI mit weniger Punkten ein fertiges Wunder hingestellt - wer eines baut, hat
// dafuer 3000 Rohstoffe nicht ins Heer gesteckt; dieses hier kostet nichts -,
// und die andere steht vor Ablauf der Uhr davor und schlaegt darauf ein.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { partieSpielen } = require('../../server/spiele/strategie/pruefstand.js');

const TAKTE_JE_MINUTE = 600;
const HIN_MINUTE = 30;
// Die Uhr des Wunders: zehn Minuten (spielziel AC-29, `WUNDER_SEKUNDEN`).
const UHR_MINUTEN = 10;
const STARTWERTE = Array.from({ length: 24 }, (_, i) => i + 1);
// Gemessen 20 von 22 (Startwerte 14 und 15 nicht: die Wellen
// fielen 20 Felder vor dem Wunder unter seinem Heer). Gesetzt, nicht aus der
// Vorlage: neun von zehn waere genau die Messung.
const ANTEIL = 0.85;

/** Ein fertiges Wunder fuer `id`, der erste freie Platz etwa `d` Felder von seinem Dorf. */
function wunderHinstellen(welt, id) {
  const s = welt.spielerVon(id);
  for (const d of [9, 12, 15, 18]) {
    for (let w = 0; w < 360; w += 15) {
      const x = Math.round(s.basis.x + d * Math.cos((w * Math.PI) / 180));
      const y = Math.round(s.basis.y + d * Math.sin((w * Math.PI) / 180));
      if (welt.platzPruefen('wunder', x, y)) return welt.gebaeudeAnlegen(id, 'wunder', x, y);
    }
  }
  throw new Error('kein Platz fuer das Wunder');
}

test('ki AC-40: steht ein fertiges Wunder des Gegners, steht ihr Heer vor Ablauf der Uhr davor und schlaegt darauf ein - in mindestens 85 % von 24 Startwerten', () => {
  const zeilen = [];
  let gezaehlt = 0;
  let getroffenZahl = 0;
  for (const startwert of STARTWERTE) {
    let wunder = null;
    let voll = 0;
    let getroffen = null;
    const eingriff = (welt) => {
      if (!wunder && welt.takt === HIN_MINUTE * TAKTE_JE_MINUTE) {
        const [a, b] = ['ki1', 'ki2'].map((id) => welt.punkte(welt.spielerVon(id)));
        wunder = wunderHinstellen(welt, a < b ? 'ki1' : 'ki2');
        voll = wunder.leben;
      }
      if (wunder && getroffen === null && wunder.leben < voll) getroffen = welt.takt;
    };
    const { ende } = partieSpielen({ startwert, minuten: HIN_MINUTE + UHR_MINUTEN + 1, einstellungen: { sicht: 'nebel' }, eingriff });
    const minute = (takt) => (takt / TAKTE_JE_MINUTE).toFixed(1);
    // Vor Minute 30 entschieden, oder der Besitzer verlor, bevor jemand
    // ankommen konnte: dann gab es nichts zu belegen.
    if (!wunder || (getroffen === null && ende && ende.grund !== 'wunder')) {
      zeilen.push(`Startwert ${startwert}: nicht gezaehlt, Ende ${ende ? `${ende.grund} in Minute ${minute(ende.takt)}` : 'keins'}`);
      continue;
    }
    gezaehlt += 1;
    const nach = getroffen === null ? null : (getroffen - HIN_MINUTE * TAKTE_JE_MINUTE) / TAKTE_JE_MINUTE;
    if (nach !== null && nach < UHR_MINUTEN) getroffenZahl += 1;
    zeilen.push(`Startwert ${startwert} (Wunder: ${wunder.besitzer}): ${nach === null ? 'nie getroffen' : `getroffen nach ${nach.toFixed(1)} min`}, Ende ${ende ? `${ende.grund} in Minute ${minute(ende.takt)}` : 'keins'}`);
  }
  console.log(`${getroffenZahl} von ${gezaehlt} vor Ablauf der Uhr getroffen\n${zeilen.join('\n')}`);
  assert.ok(gezaehlt >= 18, `nur ${gezaehlt} Partien gezaehlt`);
  assert.ok(getroffenZahl >= ANTEIL * gezaehlt, `${getroffenZahl} von ${gezaehlt}\n${zeilen.join('\n')}`);
});
