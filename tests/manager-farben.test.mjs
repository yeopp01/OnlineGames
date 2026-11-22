// Die Farben der Vereine (oberflaeche AC-22): jeder Verein hat zwei, Schrift
// darauf haelt 4,5 : 1, und zwei Vereine einer Begegnung sind im Band zu
// unterscheiden. Gemessen fuer jeden Verein jeder Welt - die Farben folgen
// aus dem Startwert, gezogen wird fuer sie aus einer eigenen Quelle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const farben = require('../server/spiele/manager/farben.js');
const { Karriere } = require('../server/spiele/manager/karriere.js');
const kader = require('../server/spiele/manager/kader.js');

const { kontrast, abstand, trikots, vereinsfarben, PAARE, AEHNLICH, WEISS, TINTE } = farben;

/** Weiss mit Deckkraft ueber einer Farbe - so steht die Unterzeile im Kopf. */
function ueber(grund, deckkraft) {
  const n = parseInt(grund.slice(1), 16);
  const kanal = (k) => Math.round(255 * deckkraft + k * (1 - deckkraft));
  const r = kanal((n >> 16) & 255); const g = kanal((n >> 8) & 255); const b = kanal(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

test('oberflaeche AC-22: jeder Verein hat zwei Farben, Schrift darauf haelt 4,5 : 1', () => {
  // Jede Welt verteilt dieselben 36 Paare - geprueft an mehreren Startwerten
  // und an jedem Paar.
  assert.equal(new Set(PAARE.map((p) => p.join())).size, PAARE.length, 'kein Paar doppelt');
  for (const startwert of [1, 4711, 123456789, 2 ** 31 + 5]) {
    const welt = kader.weltErzeugen(startwert);
    const je = vereinsfarben(startwert);
    assert.equal(je.size, welt.vereine.length);
    const vergeben = new Set();
    for (const verein of welt.vereine) {
      const f = je.get(verein.id);
      assert.ok(f, `${verein.id} hat Farben`);
      vergeben.add(`${f.eins}${f.zwei}`);
      // Die erste traegt weisse Schrift (Kopf, Tafel), die zweite dunkle (Knopf, Zaehler) -
      // darauf verlaesst sich manager.css.
      assert.equal(f.schrift, WEISS, `${verein.id}: ${f.eins}`);
      assert.equal(f.schriftZwei, TINTE, `${verein.id}: ${f.zwei}`);
      assert.ok(kontrast(f.eins, f.schrift) >= 4.5, `${f.eins} ${kontrast(f.eins, f.schrift).toFixed(2)}`);
      assert.ok(kontrast(f.zwei, f.schriftZwei) >= 4.5, `${f.zwei} ${kontrast(f.zwei, f.schriftZwei).toFixed(2)}`);
      // Die Unterzeile im Kopf steht in Weiss zu 82 %.
      assert.ok(kontrast(f.eins, ueber(f.eins, 0.82)) >= 4.5, `Unterzeile auf ${f.eins}`);
      // Zweite auf erster: die Leiste unter der Tafel und der Hauptknopf im Kopf.
      assert.ok(kontrast(f.eins, f.zwei) >= 3, `${f.zwei} auf ${f.eins}`);
    }
    assert.equal(vergeben.size, welt.vereine.length, 'jeder Verein ein eigenes Paar');
  }
  // Der Startwert mischt: nicht jede Welt gibt v1 dieselben Farben.
  const erste = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((s) => vereinsfarben(s).get('v1').eins));
  assert.ok(erste.size >= 3, `v1 in ${erste.size} Farben`);
});

test('oberflaeche AC-22: zwei Vereine einer Begegnung sind im Band zu unterscheiden', () => {
  const je = vereinsfarben(4711);
  const ids = [...je.keys()];
  let ausweich = 0;
  let knappster = Infinity;
  for (const heim of ids) {
    for (const gast of ids) {
      if (heim === gast) continue;
      const t = trikots(je.get(heim), je.get(gast));
      const d = abstand(t.heim.grund, t.gast.grund);
      knappster = Math.min(knappster, d);
      assert.ok(d >= AEHNLICH, `${heim} gegen ${gast}: ${t.heim.grund} und ${t.gast.grund} nur ${d.toFixed(1)} auseinander`);
      // Was im Band steht, hebt sich vom Blatt ab: der Grund oder sein Rand (die erste Farbe).
      const blatt = '#fbfbf8';
      assert.ok(kontrast(t.gast.ausweich ? t.gast.akzent : t.gast.grund, blatt) >= 3, `${gast} im Band`);
      assert.ok(kontrast(t.heim.grund, blatt) >= 3, `${heim} im Band`);
      assert.ok(kontrast(t.gast.grund, t.gast.schrift) >= 4.5);
      if (t.gast.ausweich) ausweich += 1;
    }
  }
  // Ausweichtrikots sind die Ausnahme, nicht die Regel.
  const paare = ids.length * (ids.length - 1);
  assert.ok(ausweich > 0 && ausweich < paare * 0.25, `${ausweich} von ${paare} im Ausweichtrikot`);
  assert.ok(knappster >= AEHNLICH, `knappster Abstand ${knappster.toFixed(1)}`);
});

test('oberflaeche AC-22: die Farben aendern die Welt nicht und stehen im Zustand', () => {
  // Eine eigene Quelle: die Welt zieht dieselben Zahlen wie ohne Farben, und
  // ein Spielstand traegt sie nicht - sie folgen aus Startwert und Kennung.
  const k = Karriere.neu({ startwert: 4711, vereinId: 'v5', name: 'Farben' });
  const gesichert = JSON.stringify(k.sichern());
  assert.equal(gesichert.includes('#'), false, 'keine Farbe im Spielstand');
  const z = k.zustand('m1');
  assert.deepEqual(z.verein.farben, vereinsfarben(4711).get('v5'));
  const geladen = Karriere.laden(k.sichern());
  assert.deepEqual(geladen.zustand('m1').verein.farben, z.verein.farben);
});
