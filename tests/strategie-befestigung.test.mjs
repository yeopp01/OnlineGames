// Befestigung haelt auf (→ specs/10-strategie/fahrplan.md AC-15). Geprueft
// wird in der Belagerung des Pruefstands (`belagerungSpielen`): zehn Soldaten
// greifen ein Dorfzentrum an, einmal frei, einmal hinter einem Ring aus
// Steinmauer mit Tor - und ob Rammen ihn schneller aufbrechen als dasselbe
// Geld in Soldaten. Kein Server, kein Browser. Das Verhalten an der Mauer
// selbst (umgehen oder brechen) steht in strategie-mauern.test.mjs, kampf
// AC-21.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { belagerungSpielen, kostenSumme } = require('../server/spiele/strategie/pruefstand.js');
const { TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');

const STARTWERTE = 20;
const sekunden = (takte) => takte / TAKTE_PRO_SEKUNDE;

// Jede Lage einmal je Startwert gerechnet und gemerkt - die Tests teilen sie.
const gerechnet = new Map();
function lage(name, optionen) {
  if (!gerechnet.has(name)) {
    const reihe = [];
    for (let startwert = 1; startwert <= STARTWERTE; startwert++) reihe.push(belagerungSpielen({ startwert, ...optionen }));
    gerechnet.set(name, reihe);
  }
  return gerechnet.get(name);
}
const frei = () => lage('frei', { mauer: false });
const hinterMauer = () => lage('mauer', {});
// Gleiche Kosten: zehn Soldaten und zwei Rammen sind 800 + 470 = 1270, sechzehn
// Soldaten 1280.
const mitRammen = () => lage('rammen', { heer: { soldat: 10, ramme: 2 } });
const gleichTeuer = () => lage('soldaten', { heer: { soldat: 16 } });

test('fahrplan AC-15: hinter Steinmauer mit Tor faellt das Dorfzentrum in jedem Startwert mindestens eine Minute spaeter', () => {
  // Gemessen in Runde 139: frei 88 bis 98 Sekunden, hinter dem Ring 178 bis
  // 263, je Startwert 85 bis 154 Sekunden spaeter. "Messbar" heisst hier: mehr
  // als das Sechsfache dessen, was die Startwerte ohne Mauer auseinander
  // liegen (zehn Sekunden) - eine Minute.
  const ohne = frei();
  const mit = hinterMauer();
  for (let i = 0; i < STARTWERTE; i++) {
    assert.ok(mit[i].ring >= 20, `Startwert ${i + 1}: nur ${mit[i].ring} Felder im Ring`);
    // Die erste Fassung baute nie ein Tor (Durchsicht Runde 139).
    assert.equal(mit[i].tore, 1, `Startwert ${i + 1}: ${mit[i].tore} Tore im Ring`);
    assert.notEqual(ohne[i].ende, null, `Startwert ${i + 1}: ohne Mauer steht das Dorfzentrum nach 15 Minuten noch`);
    assert.notEqual(mit[i].ende, null, `Startwert ${i + 1}: hinter der Mauer steht es nach 15 Minuten noch - die Mauer haelt nicht auf, sie sperrt`);
    const spaeter = sekunden(mit[i].ende - ohne[i].ende);
    assert.ok(spaeter >= 60, `Startwert ${i + 1}: nur ${spaeter} Sekunden spaeter`);
    assert.ok(mit[i].durchbruch < mit[i].ende, 'erst die Mauer, dann das Dorfzentrum');
  }
});

test('fahrplan AC-15: jede Belagerung verlaeuft anders - Richtung und Abstand kommen aus dem Startwert', () => {
  // Die Gegenprobe zur Messung oben: um das Dorfzentrum ist das Gelaende in
  // jedem Startwert gleich geraeumt, und in der ersten Fassung waren alle
  // zwanzig Belagerungen Takt fuer Takt dieselbe (Runde 139). Gemessen
  // danach: 18 verschiedene Enden (gleich sind 3 und 20, 2 und 15).
  const enden = new Set(hinterMauer().map((r) => r.ende));
  assert.ok(enden.size >= 15, `nur ${enden.size} verschiedene Enden in ${STARTWERTE} Belagerungen`);
});

test('fahrplan AC-15: Rammen brechen den Ring auf - das Dorfzentrum faellt in jedem Startwert vor dem, was dasselbe Geld in Soldaten schafft', () => {
  // Gegen dasselbe Geld, nicht gegen weniger: sonst bewiese der Test nur,
  // dass mehr Angreifer schneller sind. Gemessen in Runde 139: mit Rammen 75
  // bis 116 Sekunden, mit sechzehn Soldaten 122 bis 182 - je Startwert 32 bis
  // 87 Sekunden frueher. Der erste Durchbruch im Median 43 statt 60.
  assert.ok(Math.abs((10 * kostenSumme('soldat') + 2 * kostenSumme('ramme')) - 16 * kostenSumme('soldat')) <= 20, 'gleiche Kosten');
  const rammen = mitRammen();
  const soldaten = gleichTeuer();
  for (let i = 0; i < STARTWERTE; i++) {
    assert.notEqual(rammen[i].ende, null, `Startwert ${i + 1}: mit Rammen steht das Dorfzentrum nach 15 Minuten noch`);
    assert.ok(
      soldaten[i].ende === null || rammen[i].ende < soldaten[i].ende,
      `Startwert ${i + 1}: mit Rammen ${sekunden(rammen[i].ende)} s, mit Soldaten ${sekunden(soldaten[i].ende)} s`,
    );
  }
  const median = (reihe) => reihe.map((r) => r.durchbruch).sort((a, b) => a - b)[reihe.length >> 1];
  assert.ok(median(rammen) < median(soldaten), `Durchbruch im Median ${sekunden(median(rammen))} s mit Rammen, ${sekunden(median(soldaten))} s ohne`);
});
