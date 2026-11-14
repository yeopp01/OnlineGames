// Entf entfernt das Gewaehlte (→ specs/10-strategie/bedienung.md AC-75) - der
// Teil auf dem Server: die Nachricht `entlassen` nimmt eine eigene Einheit
// oder ein eigenes Gebaeude aus dem Spiel, eines je Nachricht.
//
// Rueckmeldung des Benutzers: "sollte es möglich sein, dass ein dorfbewohner
// sich selbst umbringt? durch entf taste?" - und zum Vorschlag, mit Umschalt
// alle zu entfernen: "nur entfernen, müssen keine massenentf sein oder so."
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const neueWelt = () => new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
const eigene = (welt, id) => [...welt.einheiten.values()].filter((e) => e.besitzer === id && !e.tot);

test('bedienung AC-75: entlassen nimmt genau eine eigene Einheit - sie faellt, zaehlt als verloren, und niemand bekommt Punkte', () => {
  const welt = neueWelt();
  const vorher = eigene(welt, 'a');
  const punkteBert = welt.punkte(welt.spielerVon('b'));
  const besiegtBert = welt.spielerVon('b').besiegtWert;
  const opfer = vorher.find((e) => e.art === 'dorfbewohner');

  assert.equal(welt.nachricht('a', { auftrag: 'entlassen', einheit: opfer.id }).fehler, undefined);
  assert.equal(opfer.tot, true, 'die Einheit ist gefallen');
  assert.equal(eigene(welt, 'a').length, vorher.length - 1, 'genau eine weniger');
  assert.equal(welt.spielerVon('a').verloren, 1, 'auf der Tafel steht sie als verloren');
  assert.equal(welt.spielerVon('b').besiegtWert, besiegtBert, 'Bert hat nichts besiegt');
  assert.equal(welt.punkte(welt.spielerVon('b')), punkteBert, 'und bekommt keine Punkte');

  // Sie liegt noch im Bild und verschwindet dann wie jede Gefallene (kampf AC-10).
  welt.takten();
  assert.equal(welt.einheiten.has(opfer.id), true, 'liegt noch am Boden');
  for (let t = 0; t < 3 * TAKTE_PRO_SEKUNDE; t++) welt.takten();
  assert.equal(welt.einheiten.has(opfer.id), false, 'und ist nach zwei Sekunden weg');

  // Noch einmal dieselbe: die gibt es nicht mehr.
  assert.match(welt.nachricht('a', { auftrag: 'entlassen', einheit: opfer.id }).fehler, /nicht deine Einheit/);
});

test('bedienung AC-75: ein fertiges Gebaeude stuerzt ein und gibt seinen Platz frei - eine Baustelle wird abgerissen und erstattet', () => {
  const welt = neueWelt();
  const basis = welt.spielerVon('a').basis;
  const haus = welt.gebaeudeAnlegen('a', 'haus', basis.x + 6, basis.y + 6);
  const wohnraum = welt.wohnraum(welt.spielerVon('a'));
  welt.zustand();
  assert.equal(welt.nachricht('a', { auftrag: 'entlassen', gebaeude: haus.id }).fehler, undefined);
  assert.equal(welt.gebaeude.has(haus.id), false, 'das Haus ist weg');
  assert.equal(welt.wohnraum(welt.spielerVon('a')), wohnraum - GEBAEUDE.haus.wohnraum, 'und sein Wohnraum mit ihm');
  const gemeldet = (welt.zustand().gebaeude || []).find((g) => g.i === haus.id);
  assert.equal(gemeldet.weg, true);
  assert.ok(gemeldet.z > 0, 'es hinterlaesst Truemmer (darstellung AC-26)');
  assert.equal(welt.spielerVon('b').besiegtWert, 0, 'Bert bekommt nichts dafuer');

  // Die Baustelle: abgerissen, das Holz kommt zurueck (bauen AC-6).
  const baustelle = welt.gebaeudeAnlegen('a', 'haus', basis.x + 6, basis.y - 6, false);
  const holz = welt.spielerVon('a').holz;
  welt.zustand();
  assert.equal(welt.nachricht('a', { auftrag: 'entlassen', gebaeude: baustelle.id }).fehler, undefined);
  assert.equal(welt.gebaeude.has(baustelle.id), false);
  assert.equal(welt.spielerVon('a').holz, holz + GEBAEUDE.haus.kosten.holz, 'nichts verbaut, alles erstattet');
  const weg = (welt.zustand().gebaeude || []).find((g) => g.i === baustelle.id);
  assert.equal(weg.z, undefined, 'eine abgerissene Baustelle hinterlaesst keine Truemmer');
});

test('bedienung AC-75: Fremdes entfernt die Nachricht nicht - weder Einheit noch Gebaeude', () => {
  const welt = neueWelt();
  const fremd = eigene(welt, 'b')[0];
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'b' && g.art === 'dorfzentrum');
  assert.match(welt.nachricht('a', { auftrag: 'entlassen', einheit: fremd.id }).fehler, /nicht deine Einheit/);
  assert.match(welt.nachricht('a', { auftrag: 'entlassen', gebaeude: zentrum.id }).fehler, /nicht dein Gebäude/);
  assert.equal(Boolean(fremd.tot), false);
  assert.equal(welt.gebaeude.has(zentrum.id), true);
  // Und was es nicht gibt, auch nicht.
  assert.match(welt.nachricht('a', { auftrag: 'entlassen', einheit: 'gibtesnicht' }).fehler, /nicht deine Einheit/);
  assert.match(welt.nachricht('a', { auftrag: 'entlassen' }).fehler, /nicht deine Einheit/);
});

test('bedienung AC-75: wer alles Eigene entfernt, scheidet aus - die Partie endet wie nach jedem letzten Verlust', () => {
  const welt = neueWelt();
  for (const e of eigene(welt, 'a')) welt.nachricht('a', { auftrag: 'entlassen', einheit: e.id });
  for (const g of [...welt.gebaeude.values()].filter((x) => x.besitzer === 'a')) {
    welt.nachricht('a', { auftrag: 'entlassen', gebaeude: g.id });
  }
  welt.takten();
  assert.equal(welt.spielerVon('a').aus, true, 'Anna ist ausgeschieden');
  assert.equal(welt.vorbei, true);
  assert.equal(welt.ende.sieger, 'b');
});
