// Partieende: ausgeschieden, Sieger, Aufgeben, unentschieden
// (→ specs/10-strategie/spielziel.md AC-5, AC-6).
//
// Geprueft wird gegen die Welt, nicht ueber das Netz: die Entscheidung faellt
// im Takt des Servers und ist ein reiner Rechenteil (ADR-0004). Was ueber die
// Leitung geht - die Nachricht `aufgeben` und das Ende im Zustand -, prueft
// `tests/raeume-spiel.test.mjs`.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE, PARTIE_MINUTEN } = require('../server/spiele/strategie/welt.js');

const ZWEI = [{ id: 'a1', name: 'Anna' }, { id: 'b1', name: 'Bert' }];

function welt(startwert = 4711, liste = ZWEI) {
  return new Welt(liste, startwert, {});
}

/** Alles wegnehmen, was diesem Spieler gehoert - wie ein verlorener Kampf. */
function allesVerlieren(w, spielerId) {
  for (const e of w.einheiten.values()) if (e.besitzer === spielerId) w.einheitSterben(e);
  for (const g of [...w.gebaeude.values()]) if (g.besitzer === spielerId) w.gebaeudeZerstoeren(g);
}

test('spielziel AC-5: wer keine Einheit und kein Gebaeude mehr hat, ist ausgeschieden', () => {
  const w = welt();
  assert.equal(w.imBestand('b1'), true, 'zu Beginn hat jeder Dorfzentrum und Dorfbewohner');
  allesVerlieren(w, 'b1');
  assert.equal(w.imBestand('b1'), false);
  w.takten();
  assert.equal(w.spielerVon('b1').aus, true);
  assert.equal(w.spielerVon('a1').aus, false, 'Anna hat nichts verloren');
});

test('spielziel AC-5: eine Farm allein haelt niemanden im Spiel, ein Haus schon', () => {
  const w = welt();
  allesVerlieren(w, 'b1');
  // Die Farm zaehlt nicht zum Bestand (`bestand: false` an den Daten), das
  // Haus schon - obwohl beide nichts ausbilden. Die Gegenprobe gehoert dazu:
  // sonst wuerde der Test auch halten, wenn gar kein Gebaeude zaehlte.
  w.gebaeudeAnlegen('b1', 'farm', w.spielerVon('b1').basis.x + 6, w.spielerVon('b1').basis.y + 6);
  const farm = [...w.gebaeude.values()].find((g) => g.besitzer === 'b1' && g.art === 'farm');
  assert.ok(farm, 'die Farm steht - sonst prueft der Rest nichts');
  assert.equal(w.imBestand('b1'), false, 'eine Farm haelt niemanden im Spiel');
  w.gebaeudeZerstoeren(farm);
  w.gebaeudeAnlegen('b1', 'haus', w.spielerVon('b1').basis.x + 6, w.spielerVon('b1').basis.y + 6);
  assert.equal(w.imBestand('b1'), true, 'ein Haus schon');
});

test('spielziel AC-5: ein Toter haelt nicht im Spiel, er liegt nur noch da', () => {
  const w = welt();
  for (const g of [...w.gebaeude.values()]) if (g.besitzer === 'b1') w.gebaeudeZerstoeren(g);
  const seine = [...w.einheiten.values()].filter((e) => e.besitzer === 'b1');
  assert.ok(seine.length >= 3, `Bert beginnt mit Dorfbewohnern, hat ${seine.length}`);
  for (const e of seine) w.einheitSterben(e);
  // Die Toten liegen noch zwei Sekunden im Bild (kampf AC-10) - sie stehen
  // also noch in `welt.einheiten`, zaehlen aber nicht mehr.
  assert.ok([...w.einheiten.values()].some((e) => e.besitzer === 'b1' && e.tot));
  assert.equal(w.imBestand('b1'), false);
});

test('spielziel AC-5: bleibt einer uebrig, endet die Partie in demselben Takt', () => {
  const w = welt();
  w.takten();
  assert.equal(w.ende, null, 'solange beide etwas haben, laeuft sie');
  allesVerlieren(w, 'b1');
  const vorher = w.takt;
  w.takten();
  assert.deepEqual(
    { sieger: w.ende.sieger, grund: w.ende.grund, takt: w.ende.takt },
    { sieger: 'a1', grund: 'eroberung', takt: vorher + 1 },
  );
  assert.equal(w.vorbei, true, 'daran haelt der Raum seine Uhr an');
});

test('spielziel AC-5: eine entschiedene Partie rechnet nicht weiter', () => {
  const w = welt();
  allesVerlieren(w, 'b1');
  w.takten();
  const takt = w.takt;
  for (let i = 0; i < 20; i++) w.takten();
  assert.equal(w.takt, takt, 'der Takt steht');
});

test('spielziel AC-5: nach 90 Spielminuten endet die Partie unentschieden', () => {
  const w = welt();
  // Nicht 54.000 Takte rechnen, sondern die Uhr vorstellen: geprueft wird die
  // Grenze, nicht der Weg dorthin. Eine Sekunde davor steht sie noch.
  w.takt = (PARTIE_MINUTEN * 60 - 1) * TAKTE_PRO_SEKUNDE;
  w.endePruefen();
  assert.equal(w.ende, null, 'eine Sekunde vor der Grenze laeuft sie noch');
  w.takt = PARTIE_MINUTEN * 60 * TAKTE_PRO_SEKUNDE;
  w.endePruefen();
  assert.deepEqual({ sieger: w.ende.sieger, grund: w.ende.grund }, { sieger: null, grund: 'zeit' });
  assert.equal(w.spielerVon('a1').aus, false, 'unentschieden heisst: keiner ist ausgeschieden');
});

test('spielziel AC-6: wer aufgibt, verliert alles und gilt als ausgeschieden', () => {
  const w = welt(4711, [...ZWEI, { id: 'c1', name: 'Cora' }]);
  const seine = [...w.einheiten.values()].filter((e) => e.besitzer === 'b1').length;
  assert.ok(seine > 0 && [...w.gebaeude.values()].some((g) => g.besitzer === 'b1'));
  assert.deepEqual(w.aufgeben('b1'), {});
  assert.equal(w.spielerVon('b1').aus, true);
  assert.equal([...w.gebaeude.values()].filter((g) => g.besitzer === 'b1').length, 0, 'kein Gebaeude mehr');
  assert.equal([...w.einheiten.values()].filter((e) => e.besitzer === 'b1' && !e.tot).length, 0, 'keine lebende Einheit mehr');
  // Gefallen, nicht verschwunden: die anderen sollen sehen, was passiert ist.
  assert.equal([...w.einheiten.values()].filter((e) => e.besitzer === 'b1' && e.tot).length, seine);
  assert.equal(w.ende, null, 'zu dritt laeuft die Partie fuer die anderen weiter');
});

test('spielziel AC-6: gibt der Vorletzte auf, gewinnt der Letzte', () => {
  const w = welt(4711, [...ZWEI, { id: 'c1', name: 'Cora' }]);
  w.aufgeben('c1');
  assert.equal(w.ende, null);
  w.aufgeben('b1');
  assert.deepEqual({ sieger: w.ende.sieger, grund: w.ende.grund }, { sieger: 'a1', grund: 'eroberung' });
});

test('spielziel AC-6: zweimal aufgeben und Aufgeben nach dem Ende sagen ab', () => {
  const w = welt();
  assert.deepEqual(w.aufgeben('b1'), {});
  // Bert hat aufgegeben, damit ist die Partie entschieden - beide Absagen
  // zeigen, dass danach nichts mehr geht.
  assert.match(w.aufgeben('b1').fehler, /zu Ende/);
  assert.match(w.aufgeben('a1').fehler, /zu Ende/);
  assert.match(w.aufgeben('gibtesnicht').fehler, /nicht/);
});

test('spielziel AC-6: aufgeben kommt ueber dieselbe Nachricht wie jeder Auftrag', () => {
  const w = welt();
  assert.deepEqual(w.nachricht('b1', { auftrag: 'aufgeben' }), {});
  assert.equal(w.spielerVon('b1').aus, true);
});

test('spielziel AC-5: das Ende steht im Zustand und im Aufbau', () => {
  const w = welt();
  assert.equal(w.zustand().ende, undefined, 'solange sie laeuft, steht nichts da');
  w.aufgeben('b1');
  const zustand = w.zustand();
  assert.equal(zustand.ende.sieger, 'a1');
  assert.equal(zustand.spieler.find((s) => s.id === 'b1').aus, 1);
  assert.equal(zustand.spieler.find((s) => s.id === 'a1').aus, undefined);
  // Wer nach dem Ende zurueckkommt, bekommt es im Aufbau (raeume AC-12).
  assert.equal(w.aufbau().ende.sieger, 'a1');
});

test('spielziel AC-7: wer ausgeschieden ist, bekommt weiter den ganzen Zustand', () => {
  const w = welt(4711, [...ZWEI, { id: 'c1', name: 'Cora' }]);
  w.aufgeben('c1');
  // Die Partie laeuft: der Takt steigt, obwohl einer ausgeschieden ist.
  const vorher = w.takt;
  for (let i = 0; i < 20; i++) w.takten();
  assert.equal(w.takt, vorher + 20, 'eine Partie zu dritt rechnet nach einem Ausscheiden weiter');

  // Und Cora sieht sie: der Zustand ist fuer sie derselbe wie fuer die
  // anderen - mit den Einheiten und Gebaeuden, die noch im Spiel sind.
  const zustand = w.zustand();
  assert.equal(zustand.ende, undefined, 'kein Ende, solange zwei spielen');
  assert.equal(zustand.spieler.find((s) => s.id === 'c1').aus, 1, 'sie weiss, dass sie draussen ist');
  const fremde = zustand.einheiten.filter((e) => e.b !== 'c1' && !e.s).length;
  const fremdeGebaeude = (zustand.gebaeude || []).filter((g) => g.b !== 'c1').length;
  assert.ok(fremde > 0, `fremde lebende Einheiten im Zustand, gezaehlt ${fremde}`);
  assert.ok(fremdeGebaeude > 0, `fremde Gebaeude im Zustand, gezaehlt ${fremdeGebaeude}`);
  assert.equal(zustand.einheiten.filter((e) => e.b === 'c1' && !e.s).length, 0, 'von ihr lebt nichts');
});
