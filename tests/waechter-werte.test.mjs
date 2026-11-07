// Waechter: Werte einer Einheit nur ueber `welt.einheitenwert()`
// (→ specs/10-strategie/bauen.md AC-21, AC-25).
//
// Warum es diesen Waechter gibt: die Ruestung aus dem Webstuhl war von
// bauen AC-21 bis Runde 68 **wirkungslos**. Die Verbesserung stand in den
// Daten, `einheitenwert()` kannte sie, und trotzdem kam sie nicht an - weil
// die Schadensformel `EINHEITEN[art].nahruestung` direkt las. Der Fehler war
// unsichtbar: alle Tests waren gruen, die Zahl im Menue stimmte, nur im Kampf
// aenderte sich nichts. Genau das soll hier nie wieder vorkommen.
//
// Geprueft wird die Simulation unter `server/spiele/strategie/`. Wer einen der
// verbesserbaren Werte aus der Tabelle liest, muss ihn stattdessen ueber
// `this.einheitenwert(besitzer, art, feld)` holen. Kosten, Zeit, Klassen,
// Kuerzel, `baut`, `bonus` und `wacht` sind keine solchen Werte - sie stehen
// nicht in `VERBESSERUNGEN[...].wirkung` und duerfen direkt gelesen werden.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { VERBESSERUNGEN } = require('../server/spiele/strategie/daten.js');

const ORDNER = fileURLToPath(new URL('../server/spiele/strategie/', import.meta.url));

/**
 * Die verbesserbaren Werte: alles, was heute in `VERBESSERUNGEN[...].wirkung`
 * steht, und die drei, die die Vorlage spaeter verbessert - Sicht
 * (Stadtwache), Tempo (Pferdezucht) und Nachladezeit. Sie stehen hier mit,
 * damit die Stelle schon richtig liest, bevor die Verbesserung dazukommt.
 */
function verbesserbareWerte() {
  const felder = new Set(['sicht', 'tempo', 'nachladen']);
  for (const v of Object.values(VERBESSERUNGEN)) {
    for (const wirkung of Object.values(v.wirkung || {})) for (const feld of Object.keys(wirkung)) felder.add(feld);
  }
  return [...felder].sort();
}

// Die eine Stelle, die die Tabelle lesen darf.
const AUSNAHME = /^\s*let wert = EINHEITEN\[art\]\[feld\]/;

test('waechter: kein verbesserbarer Wert wird an welt.einheitenwert vorbei aus EINHEITEN gelesen', () => {
  const felder = verbesserbareWerte();
  assert.ok(felder.includes('angriff') && felder.includes('nahruestung'), `Werte: ${felder.join(', ')}`);
  const muster = new RegExp(`EINHEITEN\\[[^\\]]+\\]\\s*(\\?\\.|\\.)\\s*(${felder.join('|')})\\b`);

  const treffer = [];
  for (const datei of readdirSync(ORDNER).filter((d) => d.endsWith('.js'))) {
    const zeilen = readFileSync(ORDNER + datei, 'utf8').split('\n');
    zeilen.forEach((zeile, i) => {
      if (AUSNAHME.test(zeile)) return;
      const gefunden = zeile.match(muster);
      if (gefunden) treffer.push(`${datei}:${i + 1}: ${zeile.trim()}`);
    });
  }

  assert.deepEqual(treffer, [], [
    'Diese Stellen lesen einen verbesserbaren Wert aus der Tabelle und sehen die',
    'Verbesserungen des Spielers nicht. Statt EINHEITEN[art].<wert>:',
    '  this.einheitenwert(einheit.besitzer, einheit.art, \'<wert>\')',
    `Verbesserbar sind heute: ${felder.join(', ')}.`,
    '', ...treffer,
  ].join('\n'));
});
