// Welches Militaergebaeude die KI als naechstes nachbaut, je nach der Neigung ihres
// Hauses (ki AC-27, AC-32). Gebaute Lage statt ganzer Partie: die Messung
// ueber 160 Partien steht am Code (ki.militaerPruefen) und in der Spec.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt } = require('../server/spiele/strategie/welt.js');
const {
  Ki, ZIEL_DORFBEWOHNER, MILITAER, MILITAER_JE_ZEITALTER, MILITAER_HOLZ,
  MILITAER_UEBERFLUSS_AB, MILITAER_UEBERFLUSS_HOLZ, MILITAER_UEBERFLUSS_KAMPF, MILITAER_ALLERHOECHSTENS,
} = require('../server/spiele/strategie/ki.js');
const { HAEUSER, GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

// Das Haus aus den Daten, nicht aus dem Gedaechtnis: wer zu `gebaeude` neigt.
const hausMitNeigung = (gebaeude) => Object.keys(HAEUSER).find((h) => HAEUSER[h].ki?.schwerpunkt === gebaeude);

// Die Militaergebaeude `arten` fertig und voll beschaeftigt, Vorrat fuer
// alles: der naechste Aufruf baut ein weiteres nach. Gibt zurueck, was die
// KI zu bauen schickt. Im Lehen sind drei erlaubt, im Fuerstentum fuenf.
function nachbauVon(haus, arten = ['schiessanlage', 'kaserne'], zeitalter = 1, vorrat = { holz: 1000, gold: 1000, nahrung: 1000 }) {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt', haeuser: { a: haus } });
  const ki = new Ki(welt, 'a');
  const a = welt.spielerVon('a');
  a.zeitalter = zeitalter;
  for (const art of arten) {
    const platz = ki.platzBeiBasis(art);
    const g = welt.gebaeudeAnlegen('a', art, platz.x, platz.y, true);
    g.schlange = [GEBAEUDE[art].bildetAus[0], GEBAEUDE[art].bildetAus[0]];
  }
  Object.assign(a, vorrat);
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

// Mehr Militaergebaeude bei Ueberfluss (ki AC-34). Die Gebaeude der Lage
// reihum aus Schiessanlage, Kaserne und Stall - so viele, wie verlangt.
const REIHUM = ['schiessanlage', 'kaserne', 'stall'];
const soViele = (n) => Array.from({ length: n }, (_, i) => REIHUM[i % REIHUM.length]);
const UEBERFLUSS = { holz: MILITAER_UEBERFLUSS_HOLZ, nahrung: MILITAER_UEBERFLUSS_KAMPF / 2, gold: MILITAER_UEBERFLUSS_KAMPF / 2 };

test('ki AC-34: an der Grenze ihres Zeitalters baut sie bei Ueberfluss ein weiteres Militaergebaeude - ohne Ueberfluss nicht', () => {
  const haus = hausMitNeigung('schiessanlage');
  const za = MILITAER_UEBERFLUSS_AB;
  const grenze = MILITAER_JE_ZEITALTER[za];
  // Alle Schlangen voll, die Grenze erreicht, Ueberfluss im Vorrat: noch eins.
  assert.ok(nachbauVon(haus, soViele(grenze), za, UEBERFLUSS), 'bei Ueberfluss ein weiteres');
  // Gegenprobe: derselbe Stand mit einem Vorrat, der unter der Grenze fuer
  // ein Gebaeude reichte, aber kein Ueberfluss ist - je ein Rohstoff knapp
  // darunter.
  assert.equal(nachbauVon(haus, soViele(grenze), za, { ...UEBERFLUSS, holz: MILITAER_UEBERFLUSS_HOLZ - 1 }), undefined, 'zu wenig Holz');
  assert.equal(nachbauVon(haus, soViele(grenze), za, { ...UEBERFLUSS, gold: UEBERFLUSS.gold - 1 }), undefined, 'zu wenig Nahrung und Gold');
  assert.ok(MILITAER_UEBERFLUSS_HOLZ - 1 >= MILITAER_HOLZ + 200, 'die Gegenprobe haette unter der Grenze gebaut');
  // Unter der Grenze braucht es keinen Ueberfluss (ki AC-12, wie bisher).
  assert.ok(nachbauVon(haus, soViele(grenze - 1), za, { ...UEBERFLUSS, holz: MILITAER_UEBERFLUSS_HOLZ - 1 }), 'unter der Grenze wie bisher');
});

test('ki AC-34: der Ueberfluss gilt erst ab dem Fuerstentum und endet an der obersten Grenze', () => {
  const haus = hausMitNeigung('schiessanlage');
  // Im Lehen ist ein voller Vorrat der Aufstieg: an der Grenze bleibt es.
  const lehen = MILITAER_UEBERFLUSS_AB - 1;
  assert.equal(nachbauVon(haus, soViele(MILITAER_JE_ZEITALTER[lehen]), lehen, { holz: 5000, nahrung: 5000, gold: 5000 }), undefined, 'im Lehen nicht');
  // Und irgendwann ist Schluss, auch mit vollem Vorrat.
  const za = MILITAER_UEBERFLUSS_AB;
  assert.ok(MILITAER_ALLERHOECHSTENS > MILITAER_JE_ZEITALTER[za], 'die oberste Grenze liegt ueber der des Zeitalters');
  assert.ok(nachbauVon(haus, soViele(MILITAER_ALLERHOECHSTENS - 1), za, { holz: 5000, nahrung: 5000, gold: 5000 }), 'eins unter der obersten Grenze noch');
  assert.equal(nachbauVon(haus, soViele(MILITAER_ALLERHOECHSTENS), za, { holz: 5000, nahrung: 5000, gold: 5000 }), undefined, 'an der obersten Grenze nicht mehr');
});

