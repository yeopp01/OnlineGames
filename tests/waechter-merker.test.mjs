// Waechter: was im Zustand "arbeitet" (`w`) heisst, setzen ein neuer Befehl
// und der Tod zurueck (→ specs/10-strategie/bedienung.md AC-31).
//
// Warum es diesen Waechter gibt: in Runde 135 setzte das Bekehren einen
// Merker `bekehrt`, den nur das Bekehren selbst wieder loeschte. Schickte
// der Spieler den Moench mitten darin woanders hin, lief der Moench - und
// der Zustand sagte weiter "arbeitet", bis er irgendwann wieder bekehrte.
// Kein Test der Hauptsache beruehrte das; erst die Durchsicht fand es. Mit
// `heilt` war es dasselbe, nur kuerzer (bis zur naechsten vollen Sekunde).
//
// Jeder Merker, der `w` speist, ist eine Arbeit, die ein neuer Befehl
// beendet und die ein Toter nicht mehr tut. Deshalb liest dieser Waechter
// die Zeile mit `w: 1` in `welt.js` und verlangt jeden ihrer Merker in
// `befehl()` und in `einheitSterben()` zurueckgesetzt - wer einen neuen
// Merker dazunimmt, bekommt hier die Stelle genannt, die er vergessen hat.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const WELT = readFileSync(new URL('../server/spiele/strategie/welt.js', import.meta.url), 'utf8');

/** Die Merker aus der Zeile, die `w: 1` schickt - ohne Auftrag, Weg und Tod. */
function merkerVonW() {
  const zeile = WELT.split('\n').find((z) => z.includes('? { w: 1 }'));
  assert.ok(zeile, 'die Zeile mit `w: 1` gibt es');
  const namen = new Set([...zeile.matchAll(/\be\.(\w+)/g)].map((m) => m[1]));
  for (const kein of ['auftrag', 'weg', 'tot']) namen.delete(kein);
  return [...namen].sort();
}

/** Der Rumpf einer Methode der Welt, von ihrem Kopf bis zur schliessenden Klammer auf Einrueckung zwei. */
function rumpf(name) {
  const anfang = WELT.search(new RegExp(`\\n  ${name}\\(`));
  assert.ok(anfang >= 0, `${name}() gibt es`);
  const ende = WELT.indexOf('\n  }\n', anfang);
  return WELT.slice(anfang, ende);
}

test('bedienung AC-31: die Merker hinter `w` sind gefunden - sammelt, baut, heilt, bekehrt', () => {
  const merker = merkerVonW();
  // "enthaelt", nicht gleich: die Liste waechst mit jeder neuen Arbeit.
  for (const name of ['sammelt', 'baut', 'heilt', 'bekehrt']) assert.ok(merker.includes(name), name);
});

for (const methode of ['befehl', 'einheitSterben']) {
  test(`bedienung AC-31: ${methode}() setzt jeden Merker zurueck, der \`w\` speist`, () => {
    const text = rumpf(methode);
    const fehlt = merkerVonW().filter((name) => !new RegExp(`\\beinheit\\.${name} = (false|null)`).test(text));
    assert.deepEqual(fehlt, [], `in ${methode}() nicht zurueckgesetzt: ${fehlt.join(', ')}`);
  });
}
