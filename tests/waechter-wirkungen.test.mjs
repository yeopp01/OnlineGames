// Waechter: der Browser rechnet keine Wirkungen zusammen (Rueckschau nach
// Runde 168, → specs/10-strategie/spielziel.md AC-17, docs/adr/0001-server-rechnet.md).
//
// Warum es diesen Waechter gibt: `farmVoll` in public/ansicht.js zaehlte bis
// Runde 167 die `farm.nahrung` der erforschten Verbesserungen selbst
// zusammen. Mit den Haeusern kam eine zweite Quelle von Wirkungen dazu, die
// der Browser nicht kennt - und die Leiste haette bei Distelhag "220 von 175"
// gezeigt. Gefunden hat es erst die Durchsicht. Was eine Wirkung aus Haus und
// Verbesserungen ergibt, rechnet allein der Server (`welt.wirkungen()`) und
// schickt es in der Tafel `kw`.
//
// Was er sucht: in jeder Datei unter public/ (ausser dem Managerspiel) eine
// Zeile ausserhalb von Kommentaren, die aus einem Eintrag der Verbesserungen
// eine Wirkung liest - `wirkung`, `sammeln`, `farm` oder `gebaeude`. Was eine
// Verbesserung **zeigt** (`name`, `kosten`, `zeichen`, `wandelt` fuer das
// Bildchen, `vorstufe` fuer das Angebot), bleibt erlaubt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { quelltext } from './quelltext.mjs';

const WIRKUNG = /verbesserungen\??\.?\[[^\]]+\]\??\.(wirkung|sammeln|farm|gebaeude)\b/;

function treffer(inhalt) {
  return inhalt.split('\n')
    .filter((zeile) => !/^\s*(\/\/|\*)/.test(zeile))
    .filter((zeile) => WIRKUNG.test(zeile));
}

test('spielziel AC-17: der Browser liest keine Wirkung aus den Verbesserungen, er nimmt die Tafel des Servers (Waechter)', () => {
  const funde = [];
  for (const datei of readdirSync(new URL('../public/', import.meta.url))) {
    if (!datei.endsWith('.js') || datei.startsWith('manager')) continue;
    for (const zeile of treffer(quelltext(`public/${datei}`))) funde.push(`public/${datei}: ${zeile.trim()}`);
  }
  assert.deepEqual(funde, [], [
    'Diese Zeilen rechnen im Browser eine Wirkung aus den Verbesserungen.',
    'Haus und Verbesserungen kennt nur der Server: den Wert in kampfwerte() (welt.js) aufnehmen und aus kw lesen.',
    '', ...funde,
  ].join('\n'));
});

test('spielziel AC-17: der Waechter faende die alte Zeile aus farmVoll', () => {
  // Gegenprobe: genau so stand es bis Runde 167 in public/ansicht.js.
  assert.equal(treffer('      for (const v of this.verbesserungen) voll += this.werte.verbesserungen?.[v]?.farm?.nahrung || 0;').length, 1);
  assert.equal(treffer('    const w = this.werte.verbesserungen?.[art]?.wirkung;').length, 1);
  // Was eine Verbesserung zeigt, faellt nicht darunter, ebenso Kommentare.
  assert.equal(treffer('    const nach = werte.verbesserungen?.[v]?.wandelt?.[art];').length, 0);
  assert.equal(treffer('  // this.werte.verbesserungen?.[v]?.farm?.nahrung').length, 0);
});
