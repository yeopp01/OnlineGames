// Die Brache (→ specs/10-strategie/bauen.md AC-41, AC-42) - Rechenteile,
// direkt geprueft (→ docs/adr/0004-teststrategie.md). Den Weg vom Klick bis
// zum Bild prueft e2e/tests/strategie-brache.spec.mjs.
//
// Rueckmeldung des Benutzers aus dem ersten Spiel auf dem Server: "eine farm
// muss auf automatisch renewal gestellt werden können, wenn das nicht ist,
// wird sie erstmal brach und kann mit rechtsklick einfache rneuert werden."
// Bis dahin verschwand eine Farm mit dem letzten Korn.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { Ki } = require('../server/spiele/strategie/ki.js');
const { GEBAEUDE, VERBESSERUNGEN } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const PREIS = GEBAEUDE.farm.kosten.holz;
const VOLL = GEBAEUDE.farm.nahrung;
const dorfbewohner = (welt, spieler = 'a') => [...welt.einheiten.values()].filter((e) => e.besitzer === spieler && e.art === 'dorfbewohner');
const fuer = (welt, wer) => welt.zustandJeSpieler(['a', 'b']).get(wer);

function freierPlatz(welt, art, wer = 'a', abstand = 6) {
  const basis = welt.spielerVon(wer).basis;
  for (let r = abstand; r < 30; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (welt.platzPruefen(art, basis.x + dx, basis.y + dy)) return { x: basis.x + dx, y: basis.y + dy };
      }
    }
  }
  throw new Error('kein Platz');
}

// Eine fertige Farm neben der Basis, ohne Bauzeit.
function mitFarm(wer = 'a') {
  const welt = new Welt(ZWEI, 7, { vorrat: 'viel', sicht: 'aufgedeckt' });
  const platz = freierPlatz(welt, 'farm', wer);
  const farm = welt.gebaeudeAnlegen(wer, 'farm', platz.x, platz.y, true);
  return { welt, farm, spieler: welt.spielerVon(wer) };
}

function bisAufDerFarm(welt, einheit) {
  for (let i = 0; i < 1500 && !einheit.sammelt; i++) welt.takten();
  assert.ok(einheit.sammelt, 'er arbeitet auf der Farm');
}

// Der Bauer erntet das letzte Korn - im naechsten Takt.
function letztesKorn(welt, farm, bauer) {
  farm.nahrung = 1;
  bauer.angefangen = 0.99;
  welt.takten();
}

// Ein Bauer auf der Farm, bis zum letzten Korn - die Farm liegt danach brach.
function mitBrache() {
  const { welt, farm, spieler } = mitFarm();
  const [bauer] = dorfbewohner(welt);
  welt.befehl('a', [bauer.id], { x: farm.x, y: farm.y });
  bisAufDerFarm(welt, bauer);
  letztesKorn(welt, farm, bauer);
  assert.equal(farm.brach, true);
  return { welt, farm, spieler, bauer };
}

test('bauen AC-41: eine leere Farm liegt brach - sie bleibt stehen, niemand arbeitet darauf, der Rest geht heim, und der Bauer ist danach untaetig', () => {
  const { welt, farm, spieler, bauer } = mitBrache();
  assert.equal(welt.gebaeude.has(farm.id), true, 'sie steht noch');
  assert.equal(farm.nahrung, 0);
  assert.equal(farm.arbeiter, null);
  assert.equal(farm.leben, GEBAEUDE.farm.leben, 'unversehrt');
  // Auf der Leitung: `br`, und keine Nahrung mehr.
  const draht = welt.gebaeudeFuerDraht(farm.id);
  assert.deepEqual({ br: draht.br, n: draht.n }, { br: 1, n: 0 });
  // Der Platz bleibt belegt - eine neue Farm passt dort nicht hin.
  assert.equal(welt.platzPruefen('farm', farm.x, farm.y), false);

  const vorher = spieler.nahrung;
  const getragen = bauer.ladung;
  assert.ok(getragen > 0);
  for (let i = 0; i < 120 * TAKTE_PRO_SEKUNDE && bauer.ladung > 0; i++) welt.takten();
  assert.equal(spieler.nahrung, vorher + getragen, 'der Rest ist abgegeben');
  assert.equal(bauer.auftrag, null);
  assert.equal(welt.untaetig(bauer), true);
  // Und sie bleibt brach, solange niemand etwas tut - auch das Holz fliesst nicht.
  const holz = spieler.holz;
  for (let i = 0; i < 30 * TAKTE_PRO_SEKUNDE; i++) welt.takten();
  assert.deepEqual([farm.brach, farm.nahrung, spieler.holz], [true, 0, holz]);
});

test('bauen AC-41: der Rechtsklick eines Dorfbewohners saet neu aus - es kostet, was die Farm kostet, sie traegt wieder voll, und er erntet', () => {
  const { welt, farm, spieler, bauer } = mitBrache();
  const holz = spieler.holz;
  assert.equal(welt.nachricht('a', { einheiten: [bauer.id], ziel: { x: farm.x, y: farm.y } })?.fehler, undefined);
  assert.equal(spieler.holz, holz - PREIS);
  assert.deepEqual([farm.brach, farm.nahrung, farm.arbeiter], [false, VOLL, bauer.id]);
  assert.equal(welt.gebaeudeFuerDraht(farm.id).br, undefined);
  bisAufDerFarm(welt, bauer);
  for (let i = 0; i < 20 * TAKTE_PRO_SEKUNDE; i++) welt.takten();
  assert.ok(farm.nahrung < VOLL, 'es wird geerntet');
  assert.equal(spieler.holz, holz - PREIS, 'einmal bezahlt');
});

test('bauen AC-41: ohne Holz kommt die Absage - nichts ist bezahlt, niemand geht los, die Farm bleibt brach', () => {
  const { welt, farm, spieler, bauer } = mitBrache();
  for (let i = 0; i < 120 * TAKTE_PRO_SEKUNDE && bauer.ladung > 0; i++) welt.takten();
  spieler.holz = PREIS - 1;
  const ort = { x: bauer.x, y: bauer.y };
  assert.deepEqual(welt.nachricht('a', { einheiten: [bauer.id], ziel: { x: farm.x, y: farm.y } }), { fehler: 'Zu wenig Holz.' });
  assert.equal(spieler.holz, PREIS - 1);
  assert.deepEqual([farm.brach, farm.nahrung, farm.arbeiter], [true, 0, null]);
  assert.equal(bauer.auftrag, null);
  for (let i = 0; i < 20; i++) welt.takten();
  assert.deepEqual({ x: bauer.x, y: bauer.y }, ort, 'er ist nicht losgegangen');
  // Mit genau dem Preis geht es.
  spieler.holz = PREIS;
  assert.equal(welt.nachricht('a', { einheiten: [bauer.id], ziel: { x: farm.x, y: farm.y } })?.fehler, undefined);
  assert.deepEqual([spieler.holz, farm.brach, farm.nahrung], [0, false, VOLL]);
});

test('bauen AC-41: mehrere Dorfbewohner zahlen einmal, einer bestellt sie - und wer nicht ernten kann, saet nicht aus', () => {
  const { welt, farm, spieler } = mitBrache();
  const holz = spieler.holz;
  // Eine Miliz klickt auf die Brache: ein Gang, nichts bezahlt.
  const miliz = welt.einheitAnlegen('a', farm.x + 3, farm.y, 'miliz');
  assert.equal(welt.nachricht('a', { einheiten: [miliz.id], ziel: { x: farm.x, y: farm.y } })?.fehler, undefined);
  assert.deepEqual([spieler.holz, farm.brach], [holz, true]);
  // Im Angriffslauf saet auch ein Dorfbewohner nicht aus.
  const alle = dorfbewohner(welt);
  assert.ok(alle.length >= 3);
  welt.nachricht('a', { einheiten: [alle[0].id], ziel: { x: farm.x, y: farm.y }, angriffslauf: true });
  assert.deepEqual([spieler.holz, farm.brach], [holz, true]);
  // Drei auf einmal: einmal bezahlt, einer ist der Arbeiter.
  welt.nachricht('a', { einheiten: alle.slice(0, 3).map((e) => e.id), ziel: { x: farm.x, y: farm.y } });
  assert.equal(spieler.holz, holz - PREIS);
  assert.equal(farm.brach, false);
  assert.equal(alle.slice(0, 3).filter((e) => e.auftrag?.art === 'farm' && farm.arbeiter === e.id).length, 1);
  // Und Bert saet Annas Brache nicht aus.
  farm.nahrung = 0;
  farm.brach = true;
  farm.arbeiter = null;
  const berts = dorfbewohner(welt, 'b')[0];
  const bertsHolz = welt.spielerVon('b').holz;
  welt.nachricht('b', { einheiten: [berts.id], ziel: { x: farm.x, y: farm.y } });
  assert.deepEqual([welt.spielerVon('b').holz, farm.brach], [bertsHolz, true]);
});

test('bauen AC-41: das Pferdekummet fuellt eine Brache nicht - neu ausgesaet traegt sie dann aber das Mehr', () => {
  const { welt, farm, spieler, bauer } = mitBrache();
  const zweite = welt.gebaeudeAnlegen('a', 'farm', ...Object.values(freierPlatz(welt, 'farm', 'a', 10)), true);
  welt.erforschen(spieler, 'pferdekummet');
  const mehr = VERBESSERUNGEN.pferdekummet.farm.nahrung;
  assert.equal(zweite.nahrung, VOLL + mehr, 'die bestellte Farm bekommt es');
  assert.deepEqual([farm.nahrung, farm.brach], [0, true], 'die Brache nicht');
  welt.nachricht('a', { einheiten: [bauer.id], ziel: { x: farm.x, y: farm.y } });
  assert.deepEqual([farm.nahrung, farm.brach], [VOLL + mehr, false]);
});

test('bauen AC-41: die KI raeumt ihre leeren Farmen wie bisher - sie verschwinden mit dem letzten Korn', () => {
  const { welt, farm } = mitFarm('b');
  assert.equal(welt.spielerVon('b').brachenRaeumen, false);
  new Ki(welt, 'b');
  assert.equal(welt.spielerVon('b').brachenRaeumen, true);
  assert.equal(welt.spielerVon('a').brachenRaeumen, false, 'nur ihre');
  const [bauer] = dorfbewohner(welt, 'b');
  welt.befehl('b', [bauer.id], { x: farm.x, y: farm.y });
  bisAufDerFarm(welt, bauer);
  welt.zustand();
  letztesKorn(welt, farm, bauer);
  assert.equal(welt.gebaeude.has(farm.id), false);
  assert.ok(welt.zustand().gebaeude.some((g) => g.i === farm.id && g.weg));
  assert.deepEqual([bauer.auftrag.art, bauer.auftrag.gebaeude, bauer.auftrag.leer], ['farm', farm.id, true]);
  const b = welt.spielerVon('b');
  const vorher = b.nahrung;
  const getragen = bauer.ladung;
  for (let i = 0; i < 120 * TAKTE_PRO_SEKUNDE && bauer.ladung > 0; i++) welt.takten();
  assert.equal(b.nahrung, vorher + getragen);
  assert.equal(bauer.auftrag, null);
});

test('bauen AC-42: der Schalter - Vorgabe aus, `fe` geht nur an den, der ihn stellt, und Unsinn aendert nichts', () => {
  const { welt, spieler } = mitFarm();
  assert.equal(spieler.farmenErneuern, false);
  assert.equal(fuer(welt, 'a').spieler.find((s) => s.id === 'a').fe, undefined);
  assert.deepEqual(welt.nachricht('a', { auftrag: 'farmen', erneuern: true }), {});
  assert.equal(spieler.farmenErneuern, true);
  assert.equal(fuer(welt, 'a').spieler.find((s) => s.id === 'a').fe, 1);
  // Im Nebel erfaehrt Bert es nicht (aufgedeckt sieht jeder alles).
  const nebel = new Welt(ZWEI, 7);
  nebel.nachricht('a', { auftrag: 'farmen', erneuern: true });
  assert.equal(fuer(nebel, 'a').spieler.find((s) => s.id === 'a').fe, 1);
  assert.equal(fuer(nebel, 'b').spieler.find((s) => s.id === 'a').fe, undefined, 'Bert erfaehrt es nicht');
  assert.equal(welt.spielerVon('b').farmenErneuern, false);
  for (const erneuern of [undefined, null, 1, 'ja', {}, []]) {
    assert.doesNotThrow(() => welt.nachricht('a', { auftrag: 'farmen', erneuern }));
    assert.equal(spieler.farmenErneuern, true, JSON.stringify(erneuern));
  }
  assert.equal(spieler.brachenRaeumen, false, 'das andere bleibt, wie es war');
  welt.nachricht('a', { auftrag: 'farmen', erneuern: false });
  assert.equal(spieler.farmenErneuern, false);
  assert.equal(fuer(welt, 'a').spieler.find((s) => s.id === 'a').fe, undefined);
  assert.ok(welt.nachricht('niemand', { auftrag: 'farmen', erneuern: true }).fehler);
});

test('bauen AC-42: ist der Schalter an, wird beim letzten Korn bezahlt, und der Bauer erntet ohne Pause weiter', () => {
  const { welt, farm, spieler } = mitFarm();
  const [bauer] = dorfbewohner(welt);
  welt.nachricht('a', { auftrag: 'farmen', erneuern: true });
  welt.befehl('a', [bauer.id], { x: farm.x, y: farm.y });
  bisAufDerFarm(welt, bauer);
  const holz = spieler.holz;
  letztesKorn(welt, farm, bauer);
  assert.equal(spieler.holz, holz - PREIS);
  assert.deepEqual([farm.brach || false, farm.nahrung, farm.arbeiter], [false, VOLL, bauer.id]);
  assert.equal(welt.gebaeudeFuerDraht(farm.id).br, undefined);
  assert.equal(bauer.auftrag.art, 'farm');
  welt.takten();
  assert.equal(bauer.sammelt, true, 'ohne Pause');
  // Ein ganzer Umlauf: voll heim, zurueck auf dieselbe Farm.
  const nahrung = spieler.nahrung;
  for (let i = 0; i < 120 * TAKTE_PRO_SEKUNDE && spieler.nahrung === nahrung; i++) welt.takten();
  assert.ok(spieler.nahrung > nahrung);
  assert.equal(spieler.holz, holz - PREIS, 'einmal bezahlt');
});

test('bauen AC-42: reicht das Holz nicht, liegt sie brach, der Bauer bringt heim, was er traegt, wartet auf ihr - und saet aus, sobald es reicht', () => {
  const { welt, farm, spieler } = mitFarm();
  const [bauer] = dorfbewohner(welt);
  welt.nachricht('a', { auftrag: 'farmen', erneuern: true });
  welt.befehl('a', [bauer.id], { x: farm.x, y: farm.y });
  bisAufDerFarm(welt, bauer);
  spieler.holz = PREIS - 1;
  letztesKorn(welt, farm, bauer);
  assert.deepEqual([farm.brach, farm.nahrung, farm.arbeiter, spieler.holz], [true, 0, bauer.id, PREIS - 1]);
  assert.equal(welt.gebaeudeFuerDraht(farm.id).br, 1);
  // Er bringt den Rest heim und kommt zurueck.
  const vorher = spieler.nahrung;
  const getragen = bauer.ladung;
  for (let i = 0; i < 120 * TAKTE_PRO_SEKUNDE && bauer.ladung > 0; i++) welt.takten();
  assert.equal(spieler.nahrung, vorher + getragen);
  for (let i = 0; i < 120 * TAKTE_PRO_SEKUNDE && (bauer.weg.length || !welt.aufGrundflaeche(bauer, farm)); i++) welt.takten();
  for (let i = 0; i < 20; i++) welt.takten();
  assert.equal(welt.aufGrundflaeche(bauer, farm), true, 'er steht auf der Brache');
  assert.deepEqual([bauer.auftrag?.art, bauer.sammelt, farm.arbeiter, farm.brach], ['farm', false, bauer.id, true]);
  assert.equal(welt.untaetig(bauer), true, 'wer wartet, zaehlt als untaetig');
  assert.equal(spieler.holz, PREIS - 1, 'nichts bezahlt');
  // Das Holz kommt: er saet aus und erntet.
  spieler.holz = PREIS + 5;
  welt.takten();
  assert.deepEqual([spieler.holz, farm.brach, farm.nahrung], [5, false, VOLL]);
  welt.takten();
  assert.equal(bauer.sammelt, true);
});

test('bauen AC-42: wird der Schalter ausgestellt, waehrend einer wartet, ist die Farm frei - und eine Brache ohne Bauer saet der Schalter nicht aus', () => {
  const { welt, farm, spieler } = mitFarm();
  const [bauer] = dorfbewohner(welt);
  welt.nachricht('a', { auftrag: 'farmen', erneuern: true });
  welt.befehl('a', [bauer.id], { x: farm.x, y: farm.y });
  bisAufDerFarm(welt, bauer);
  spieler.holz = 0;
  letztesKorn(welt, farm, bauer);
  for (let i = 0; i < 240 * TAKTE_PRO_SEKUNDE && !(bauer.ladung === 0 && welt.aufGrundflaeche(bauer, farm) && !bauer.weg.length); i++) welt.takten();
  assert.equal(farm.arbeiter, bauer.id);
  welt.nachricht('a', { auftrag: 'farmen', erneuern: false });
  welt.takten();
  assert.deepEqual([farm.arbeiter, bauer.auftrag, farm.brach], [null, null, true]);
  // Schalter wieder an, Holz da - aber niemand steht darauf: sie bleibt brach.
  spieler.holz = 500;
  welt.nachricht('a', { auftrag: 'farmen', erneuern: true });
  for (let i = 0; i < 10 * TAKTE_PRO_SEKUNDE; i++) welt.takten();
  assert.deepEqual([farm.brach, spieler.holz], [true, 500]);
  // Der Rechtsklick saet sie aus, wie ohne Schalter.
  welt.nachricht('a', { einheiten: [bauer.id], ziel: { x: farm.x, y: farm.y } });
  assert.deepEqual([farm.brach, spieler.holz, farm.arbeiter], [false, 500 - PREIS, bauer.id]);
});
