// Waechter: jedes feste Teil des Spielbilds steht in der Liste von
// `bedienteileFrei` - oder hier, mit Grund, warum es ueber allem liegen darf
// (→ Rueckschau nach Runde 193).
//
// Warum es diesen Waechter gibt: in den Runden 189 bis 192 kam dreimal ein
// fester Kasten ins Spielbild (Spielstand, eine Zeile der Tastenuebersicht,
// die Erklaerung der ersten Partie), und jedes Mal hing, ob er auf einem
// anderen Bedienteil liegt, daran, dass jemand ihn von Hand in die Liste in
// `e2e/helpers/strategie.mjs` schrieb. Die Anweisung sagte es fett; dieser
// Test sagt es, bevor ein Browser laeuft.
//
// Gelesen wird `public/index.html`: die direkten Kinder von `#spiel`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SEITE = fileURLToPath(new URL('../public/index.html', import.meta.url));
const HILFE = fileURLToPath(new URL('../e2e/helpers/strategie.mjs', import.meta.url));

// Was ueber allem liegen darf - Fenster, die man bewusst oeffnet und wieder
// schliesst, und die Leinwand selbst.
const UEBER_ALLEM = {
  brett: 'die Leinwand ist das Spielfeld, alle anderen liegen auf ihr',
  tastenuebersicht: 'Fenster auf ? oder F1, mittig ueber allem, Esc schliesst (bedienung AC-22)',
  spielstand: 'nur solange Tab gehalten wird (bedienung AC-20)',
  verbindungweg: 'nach dem Abbruch ist nichts darunter mehr bedienbar (bedienung AC-19)',
  aufgebenfrage: 'Rueckfrage, die eine Antwort verlangt (spielziel AC-6)',
  buendnisfrage: 'Rueckfrage, die eine Antwort verlangt (spielziel AC-24)',
};

function kinderVonSpiel(html) {
  const anfang = html.indexOf('<div id="spiel"');
  assert.ok(anfang >= 0, '#spiel fehlt in public/index.html');
  // Die Kinder stehen eine Stufe tiefer eingerueckt als `#spiel` selbst.
  const zeilenanfang = html.lastIndexOf('\n', anfang) + 1;
  const einzug = anfang - zeilenanfang;
  const ende = html.indexOf(`\n${' '.repeat(einzug)}</div>`, anfang);
  const block = html.slice(anfang, ende);
  const muster = new RegExp(`^ {${einzug + 2}}<[a-z]+[^>]*\\bid="([^"]+)"`, 'gm');
  return [...block.matchAll(muster)].map((t) => t[1]);
}

test('waechter: jedes feste Teil des Spielbilds wird von bedienteileFrei geprueft oder darf mit Grund ueber allem liegen', () => {
  const kinder = kinderVonSpiel(readFileSync(SEITE, 'utf8'));
  assert.ok(kinder.length >= 10, `Zu wenige Teile in #spiel gefunden (${kinder.length}) - liest der Waechter noch richtig?`);

  const hilfe = readFileSync(HILFE, 'utf8');
  const liste = hilfe.match(/function bedienteileFrei[\s\S]*?const teile = \[([^\]]*)\]/);
  assert.ok(liste, 'Die Liste in bedienteileFrei (e2e/helpers/strategie.mjs) ist nicht zu finden.');
  const geprueft = new Set([...liste[1].matchAll(/'#([\w-]+)'/g)].map((t) => t[1]));

  const fehlt = kinder.filter((id) => !geprueft.has(id) && !(id in UEBER_ALLEM));
  assert.deepEqual(fehlt, [],
    `Neu im Spielbild, aber nirgends eingeordnet: ${fehlt.map((id) => `#${id}`).join(', ')}. ` +
    'In die Liste von bedienteileFrei (e2e/helpers/strategie.mjs) aufnehmen - oder hier in UEBER_ALLEM, mit Grund.');

  // Und keine Ausnahme fuer etwas, das es nicht mehr gibt.
  const veraltet = Object.keys(UEBER_ALLEM).filter((id) => !kinder.includes(id));
  assert.deepEqual(veraltet, [], `UEBER_ALLEM nennt, was nicht mehr in #spiel steht: ${veraltet.join(', ')}`);
});
