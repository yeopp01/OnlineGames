// Waechter: jede Art in den Daten hat einen Namen, eine Zeichnung und eine
// Taste (Rueckschau nach Runde 126).
//
// Warum es diesen Waechter gibt: Tabellen neben den Daten wachsen nicht von
// selbst mit. In Runde 125 fehlten `GEBAEUDE_NAMEN` fuenf Gebaeude seit A9 und
// D2 - die Absage stand als „kloster gibt es erst …" roh im Bild; im selben
// Lauf hatte das Baumenue 14 Eintraege und `BAUTASTEN` nur 13. Und bei dieser
// Rueckschau fehlten `EINHEIT_NAMEN` noch Ritter und Armbrustschuetze seit
// Runde 123. Jedes Mal hat es erst ein Browserlauf oder das Auge gefunden.
//
// Die Browsermodule unter `public/` lassen sich in Node nicht laden (das Paket
// ist CommonJS); deshalb liest der Waechter ihre Tabellen als Text.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { EINHEITEN, GEBAEUDE } = require('../server/spiele/strategie/daten.js');
const { GEBAEUDE_NAMEN, EINHEIT_NAMEN } = require('../server/spiele/strategie/welt.js');

function quelle(datei) {
  return readFileSync(new URL(`../public/${datei}`, import.meta.url), 'utf8');
}

/** Die Schluessel einer Tabelle `export const NAME = { … };` aus dem Quelltext. */
function schluesselDerTabelle(text, name) {
  const anfang = text.indexOf(`export const ${name} = {`);
  assert.ok(anfang >= 0, `${name} nicht gefunden`);
  const ende = text.indexOf('\n};', anfang);
  const rumpf = text.slice(anfang, ende);
  return new Set([...rumpf.matchAll(/^ {2}([a-z]+):/gm)].map((m) => m[1]));
}

test('waechter: jedes Gebaeude und jede Einheit hat einen Namen fuer die Absagen', () => {
  const ohne = [
    ...Object.keys(GEBAEUDE).filter((art) => !GEBAEUDE_NAMEN[art]).map((art) => `Gebaeude ${art}`),
    ...Object.keys(EINHEITEN).filter((art) => !EINHEIT_NAMEN[art]).map((art) => `Einheit ${art}`),
  ];
  assert.deepEqual(ohne, [], 'ohne Namen steht der Schluessel roh in der Absage');
});

test('waechter: jedes Gebaeude und jede Einheit hat eine Zeichnung', () => {
  const gebaeude = schluesselDerTabelle(quelle('gebaeude.js'), 'GEBAEUDE');
  const figuren = schluesselDerTabelle(quelle('figuren.js'), 'FIGUREN');
  const ohne = [
    ...Object.keys(GEBAEUDE).filter((art) => !gebaeude.has(art)).map((art) => `Gebaeude ${art}`),
    ...Object.keys(EINHEITEN).filter((art) => !figuren.has(art)).map((art) => `Einheit ${art}`),
  ];
  assert.deepEqual(ohne, []);
});

test('waechter: fuer jeden Eintrag im Baumenue gibt es eine Taste', () => {
  const zeile = quelle('tasten.js').match(/export const BAUTASTEN = \[([^\]]*)\]/);
  assert.ok(zeile, 'BAUTASTEN nicht gefunden');
  const tasten = [...zeile[1].matchAll(/'([a-z])'/g)].map((m) => m[1]);
  assert.equal(new Set(tasten).size, tasten.length, 'eine Taste doppelt belegt');
  // Das laengste Baumenue hat, wer alles bauen kann, was in den Daten steht.
  const laengstes = Math.max(...Object.values(EINHEITEN).map((e) => (e.baut || []).length));
  assert.ok(tasten.length >= laengstes, `${tasten.length} Tasten fuer ${laengstes} Gebaeude`);
});

// Browserfaelle, die „alles, was die Daten fuer dieses Zeitalter sagen"
// aufstellen, brechen, sobald etwas Neues in die Daten kommt: der Ritter in
// der Feudalzeit am Stueck (Runde 123), der Wachturm, der vor dem Speerkaempfer
// in den Reiter schoss (Runde 125). `npm run e2e:daten` faehrt genau diese
// Dateien - in viereinhalb Minuten statt dreizehn. Wer einen Eintrag in
// `daten.js` anlegt, faehrt es vor dem vollen Lauf.
const AUS_DEN_DATEN = /w\.gebaeude\[|w\.einheiten\.|\.baut\b|bildetAus|gebaeudeArten|einheitenArten/;

test('waechter: npm run e2e:daten nennt jeden Browserfall, der aus den Daten aufstellt', () => {
  const ordner = new URL('../e2e/tests/', import.meta.url);
  const skript = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).scripts['e2e:daten'];
  assert.ok(skript, 'npm run e2e:daten fehlt');
  const genannt = new Set(skript.split(' ').filter((wort) => wort.startsWith('strategie-')));
  const fehlen = readdirSync(ordner)
    .filter((datei) => datei.endsWith('.spec.mjs'))
    .filter((datei) => AUS_DEN_DATEN.test(readFileSync(new URL(datei, ordner), 'utf8')))
    .map((datei) => datei.replace('.spec.mjs', ''))
    .filter((name) => !genannt.has(name));
  assert.deepEqual(fehlen, [], 'in package.json unter e2e:daten nachtragen');
  assert.ok(genannt.size >= 5, 'das Muster findet die bekannten Dateien nicht mehr');
});

test('waechter: der Namenswaechter erkennt eine fehlende Zeile', () => {
  // Gegenprobe: ohne diese Zusicherung waere der erste Test auch gruen, wenn
  // die Tabelle leer gelesen wuerde.
  assert.ok(Object.keys(EINHEIT_NAMEN).length >= Object.keys(EINHEITEN).length);
  const tafel = schluesselDerTabelle('export const X = {\n  haus: 1,\n  // kommentar\n  farm: 2,\n};', 'X');
  assert.deepEqual([...tafel].sort(), ['farm', 'haus']);
});
