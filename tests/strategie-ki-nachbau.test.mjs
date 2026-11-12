// Welches Militaergebaeude die KI als naechstes nachbaut, je nach der Neigung ihres
// Hauses (ki AC-27, AC-32). Gebaute Lage statt ganzer Partie: die Messung
// ueber 160 Partien steht am Code (ki.militaerPruefen) und in der Spec.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt } = require('../server/spiele/strategie/welt.js');
const { Ki, ZIEL_DORFBEWOHNER, MILITAER } = require('../server/spiele/strategie/ki.js');
const { HAEUSER, GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

// Das Haus aus den Daten, nicht aus dem Gedaechtnis: wer zu `gebaeude` neigt.
const hausMitNeigung = (gebaeude) => Object.keys(HAEUSER).find((h) => HAEUSER[h].ki?.schwerpunkt === gebaeude);

// Die Militaergebaeude `arten` fertig und voll beschaeftigt, Vorrat fuer
// alles: der naechste Aufruf baut ein weiteres nach. Gibt zurueck, was die
// KI zu bauen schickt. Im Lehen sind drei erlaubt, im Fuerstentum fuenf.
function nachbauVon(haus, arten = ['schiessanlage', 'kaserne'], zeitalter = 1) {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt', haeuser: { a: haus } });
  const ki = new Ki(welt, 'a');
  const a = welt.spielerVon('a');
  a.zeitalter = zeitalter;
  for (const art of arten) {
    const platz = ki.platzBeiBasis(art);
    const g = welt.gebaeudeAnlegen('a', art, platz.x, platz.y, true);
    g.schlange = [GEBAEUDE[art].bildetAus[0], GEBAEUDE[art].bildetAus[0]];
  }
  a.holz = 1000;
  a.gold = 1000;
  a.nahrung = 1000;
  // Genug Dorfbewohner, damit keine Ruecklage greift.
  const dorf = () => [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  while (dorf().length < ZIEL_DORFBEWOHNER) welt.einheitAnlegen('a', a.basis.x + 6, a.basis.y + 6, 'dorfbewohner');
  const gesendet = [];
  const senden = ki.senden.bind(ki);
  ki.senden = (n) => { gesendet.push(n); return senden(n); };
  ki.militaerPruefen([...welt.gebaeude.values()].filter((g) => g.besitzer === 'a'), dorf());
  return gesendet.find((n) => n.auftrag === 'bauen')?.art;
}

test('ki AC-32: wer zur Kaserne neigt, baut im Wechsel nach - neben Kaserne und Schiessanlage keine zweite Kaserne, neben zwei anderen schon', () => {
  const haus = hausMitNeigung('kaserne');
  assert.ok(haus, 'ein Haus neigt zur Kaserne');
  // Eine Kaserne, ein anderes: nicht gleich die zweite Kaserne. Gold ist da,
  // also nimmt die Goldregel die Schiessanlage.
  assert.equal(nachbauVon(haus), 'schiessanlage', 'keine zweite Kaserne neben einer Schiessanlage');
  // Eine Kaserne, zwei andere (im Fuerstentum, wo fuenf erlaubt sind): jetzt
  // die zweite Kaserne - die Neigung bleibt sichtbar (ki AC-27).
  assert.equal(nachbauVon(haus, ['schiessanlage', 'kaserne', 'schiessanlage'], 2), 'kaserne', 'neben zwei anderen die zweite Kaserne');
});

test('ki AC-32: wer zu einem Militaergebaeude neigt, baut es weiter nach - die Regel trifft nur die Kaserne', () => {
  // Gegenprobe zur Richtung: sonst waere der erste Test auch gruen, wenn
  // niemand mehr seinen Schwerpunkt nachbaut. Gefragt mit einem Schwerpunkt,
  // den die Goldregel bei vollem Gold NICHT naehme.
  const andere = MILITAER.filter((g) => g !== 'schiessanlage').map(hausMitNeigung).filter(Boolean);
  assert.ok(andere.length, 'ein Haus neigt zu einem anderen Militaergebaeude');
  for (const haus of andere) assert.equal(nachbauVon(haus), HAEUSER[haus].ki.schwerpunkt, haus);
});
