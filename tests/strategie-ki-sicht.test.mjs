// Die KI sieht nur ihr Sichtfeld (→ specs/10-strategie/ki.md AC-13) -
// Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md).
//
// Bis Runde 111 las die KI die ganze Welt: wo der Gegner wohnt, wie gross sein
// Heer ist, wo seine Gebaeude stehen. Jetzt kennt sie fremde Gebaeude erst,
// wenn eine ihrer Einheiten sie gesehen hat, fremde Einheiten nur, solange sie
// sie sieht - und schickt dafuer ihren Spaeherreiter los.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt } = require('../server/spiele/strategie/welt.js');
const { Ki } = require('../server/spiele/strategie/ki.js');
const { partieSpielen } = require('../server/spiele/strategie/pruefstand.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const zentrumVon = (welt, id) => [...welt.gebaeude.values()].find((g) => g.besitzer === id && g.art === 'dorfzentrum');

// Ein Spaeher von Anna neben Berts Dorfzentrum, und die Sicht neu gerechnet.
function hinschauen(welt, ziel) {
  const e = welt.einheitAnlegen('a', ziel.x + 4, ziel.y, 'spaeherreiter');
  welt.sichtAktualisieren();
  return e;
}

test('ki AC-13: im Nebel kennt sie den Gegner erst, wenn sie ihn gesehen hat - dann behaelt sie ihn', () => {
  const welt = new Welt(ZWEI, 4711);
  const ki = new Ki(welt, 'a');
  const zentrum = zentrumVon(welt, 'b');
  welt.sichtAktualisieren();
  ki.wahrnehmen();
  assert.equal(ki.naechsterGegner(), null, 'zu Beginn kennt sie keinen');
  // Ihr Spaeher sieht Berts Dorfzentrum.
  const spaeher = hinschauen(welt, zentrum);
  ki.wahrnehmen();
  assert.equal(ki.naechsterGegner()?.id, 'b', 'gesehen: Bert ist der Gegner');
  assert.deepEqual(ki.gegnerZiel(ki.naechsterGegner()), { x: zentrum.x, y: zentrum.y }, 'sein Dorfzentrum ist das Ziel');
  // Der Spaeher geht - sie erinnert sich.
  welt.einheiten.delete(spaeher.id);
  welt.sichtAktualisieren();
  ki.wahrnehmen();
  assert.equal(ki.naechsterGegner()?.id, 'b', 'im Nebel erinnert');
  // Gegenprobe: aufgedeckt kennt sie ihn von Anfang an.
  const offen = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const kiOffen = new Ki(offen, 'a');
  kiOffen.wahrnehmen();
  assert.equal(kiOffen.naechsterGegner()?.id, 'b', 'aufgedeckt: gleich bekannt');
});

test('ki AC-13: ein Gebaeude, das im Nebel faellt, vergisst sie erst, wenn sie wieder hinsieht', () => {
  const welt = new Welt(ZWEI, 4711);
  const ki = new Ki(welt, 'a');
  const zentrum = zentrumVon(welt, 'b');
  const haus = welt.gebaeudeAnlegen('b', 'haus', zentrum.x + 4, zentrum.y + 4, true);
  let spaeher = hinschauen(welt, haus);
  ki.wahrnehmen();
  assert.ok(ki.gesehen.has(haus.id), 'gesehen');
  welt.einheiten.delete(spaeher.id);
  welt.sichtAktualisieren();
  welt.gebaeudeZerstoeren(haus);
  ki.wahrnehmen();
  assert.ok(ki.gesehen.has(haus.id), 'im Nebel gefallen: steht fuer sie noch');
  spaeher = hinschauen(welt, haus);
  ki.wahrnehmen();
  assert.ok(!ki.gesehen.has(haus.id), 'wieder gesehen: weg');
});

test('ki AC-13: fremde Einheiten im Nebel zaehlen nicht - fuer das Ueberlegen zaehlt, was sie gesehen hat', () => {
  const welt = new Welt(ZWEI, 4711);
  const ki = new Ki(welt, 'a');
  const zentrum = zentrumVon(welt, 'b');
  // Bert hat ein Heer daheim, das Anna nicht sieht.
  for (let i = 0; i < 6; i++) welt.einheitAnlegen('b', zentrum.x + 4 + (i % 3), zentrum.y + 1 + Math.floor(i / 3), 'miliz');
  welt.sichtAktualisieren();
  ki.wahrnehmen();
  assert.equal(ki.sichtbareFeinde().length, 0, 'nichts von Bert in Sicht');
  assert.equal(ki.gesehenVon('b'), 0, 'kein Heer gesehen');
  // Ein Blick - jetzt weiss sie davon, und es bleibt, auch wenn sie wegsieht.
  const spaeher = hinschauen(welt, zentrum);
  ki.wahrnehmen();
  const gesehen = ki.gesehenVon('b');
  assert.ok(gesehen >= 6, `gesehen: ${gesehen}`);
  welt.einheiten.delete(spaeher.id);
  welt.sichtAktualisieren();
  ki.wahrnehmen();
  assert.equal(ki.sichtbareFeinde().length, 0, 'wieder nichts in Sicht');
  assert.equal(ki.gesehenVon('b'), gesehen, 'aber erinnert');
});

test('ki AC-13: kennt sie keinen Gegner und hat keinen Spaeher, erkundet das Heer selbst', () => {
  const welt = new Welt(ZWEI, 4711);
  const ki = new Ki(welt, 'a');
  const gesendet = [];
  ki.senden = (n) => gesendet.push(n);
  const basis = welt.spielerVon('a').basis;
  for (const e of [...welt.einheiten.values()]) if (e.besitzer === 'a' && e.art === 'spaeherreiter') welt.einheiten.delete(e.id);
  for (let i = 0; i < 12; i++) welt.einheitAnlegen('a', basis.x + 3 + (i % 4), basis.y + 3 + Math.floor(i / 4), 'miliz');
  welt.sichtAktualisieren();
  ki.heerPruefen([...welt.einheiten.values()].filter((e) => e.besitzer === 'a'));
  const lauf = gesendet.find((n) => n.angriffslauf);
  assert.ok(lauf, 'das Heer bricht auf');
  assert.ok(!welt.erkundet('a', lauf.ziel.x, lauf.ziel.y), 'zu einem Ort, den sie noch nicht kennt');
  // Nicht zu Bert: wo er wohnt, weiss sie nicht. Bis Runde 111 zog das Heer
  // geradewegs vor sein Dorfzentrum.
  const bert = zentrumVon(welt, 'b');
  const weit = Math.hypot(lauf.ziel.x - bert.x, lauf.ziel.y - bert.y);
  assert.ok(weit > 20, `nicht vor Berts Dorf: ${weit.toFixed(1)} Felder davon`);
});

// Ueber zwanzig Startwerte zu zweit, zwoelf Spielminuten: gemessen in Runde
// 112 sieht jede der 40 KIs ihren Gegner nach 1,9 bis 2,4 Minuten (Median
// 2,0). Die Grenze kommt aus dem Plan der KI, nicht aus der Messung: sie muss
// den Gegner kennen, bevor ihr erstes Heer steht - frueheste Minute 17,5
// (ki AC-11) -, und bevor sie in der Feudalzeit Kampfeinheiten ausbildet,
// gut elf Minuten. Fuenf Minuten lassen dem Spaeher Platz fuer Umwege.
test('ki AC-13: ueber zwanzig Startwerte findet ihr Spaeher den Gegner, jede KI binnen fuenf Minuten', () => {
  const minuten = [];
  for (let startwert = 1; startwert <= 20; startwert++) {
    const r = partieSpielen({ startwert, minuten: 6 });
    for (const p of r.spieler) minuten.push(p.gegnerMinute);
  }
  const ungefunden = minuten.filter((m) => m === null).length;
  assert.equal(ungefunden, 0, `nicht gefunden: ${ungefunden} von ${minuten.length}`);
  assert.ok(Math.max(...minuten) <= 5, `spaetestens ${Math.max(...minuten).toFixed(1)} min`);
  // Kein Geschenk: zu Beginn sieht keine KI den Gegner (Gegenprobe im ersten
  // Test), und gefunden wird zu verschiedenen Zeiten.
  assert.ok(Math.min(...minuten) > 0.5, `fruehestens ${Math.min(...minuten).toFixed(1)} min`);
  assert.ok(new Set(minuten.map((m) => m.toFixed(1))).size > 2, `verschiedene Zeiten: ${minuten.map((m) => m.toFixed(1)).join(' ')}`);
});
