// Die Burg (bauen AC-32) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md). Die Oberflaeche dazu:
// e2e/tests/strategie-burg.spec.mjs. Geschossen wird nach derselben Regel wie
// beim Wachturm (bauen AC-29, tests/strategie-tuerme.test.mjs); hier steht,
// was an der Burg anders ist: vier mal vier Felder, Stein, Wohnraum, andere
// Zahlen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

function sekunden(welt, s) {
  for (let t = 0; t < Math.round(s * TAKTE_PRO_SEKUNDE); t++) welt.takten();
}

/**
 * Annas Burg in der Kartenmitte, links und rechts davon je zehn freie Felder
 * fuer die Ziele - der Platz kommt aus `platzPruefen`, nicht aus einer eigenen
 * Regel. `rand` ist die Grundflaeche: die Reichweite zaehlt von ihrem Rand.
 */
function mitBurg(fertig = true) {
  const welt = new Welt(ZWEI, 7);
  const mitte = Math.floor(welt.karte.groesse / 2);
  for (let r = 0; r < 25; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const x = mitte + dx;
        const y = mitte + dy;
        const seiten = [-12, -11, -10, -9, -8, -7, -6, -5, -4, -3, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        if (!welt.platzPruefen('burg', x, y) || !seiten.every((d) => welt.platzPruefen('haus', x + d, y))) continue;
        const burg = welt.gebaeudeAnlegen('a', 'burg', x, y, fertig);
        return { welt, burg, rand: welt.grundflaeche('burg', x, y) };
      }
    }
  }
  throw new Error('kein Platz fuer die Burg');
}

test('bauen AC-32: die Burg mit den Werten der Vorlage - 650 Stein, 200 Sekunden, 4800 Leben, vier mal vier Felder', () => {
  const b = GEBAEUDE.burg;
  assert.deepEqual(b.kosten, { stein: 650 });
  assert.equal(b.bauzeit, 200);
  assert.equal(b.leben, 4800);
  assert.equal(b.wohnraum, 20);
  assert.equal(b.groesse, 4);
  assert.equal(b.zeitalter, 2, 'erst ab der Ritterzeit');
  // Die Kampfwerte aus der Zeile unter der Gebaeudetafel der Vorlage.
  assert.deepEqual([b.angriff, b.reichweite, b.nachladen, b.nahruestung, b.fernruestung], [11, 8, 2, 8, 11]);
  assert.ok(b.sicht > b.reichweite, 'sie sieht, worauf sie schiesst');
  assert.ok(EINHEITEN.dorfbewohner.baut.includes('burg'), 'ein Dorfbewohner baut sie');
});

test('bauen AC-32: in der Feudalzeit abgewiesen, in der Ritterzeit gebaut - der Stein geht ab', () => {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  anna.zeitalter = 1;
  anna.stein = 700;
  const bauer = [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  let ort = null;
  for (let r = 7; r < 30 && !ort; r++) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r], [r, r], [-r, r], [r, -r], [-r, -r]]) {
      if (!ort && welt.platzPruefen('burg', anna.basis.x + dx, anna.basis.y + dy)) ort = { x: anna.basis.x + dx, y: anna.basis.y + dy };
    }
  }
  assert.ok(ort, 'ein Platz fuer die Burg');
  const bauen = () => welt.nachricht('a', { auftrag: 'bauen', einheiten: [bauer.id], art: 'burg', ziel: ort });
  // Abgewiesen wegen des Zeitalters, nicht aus einem anderen Grund.
  assert.match(bauen().fehler || '', /ab dem Fürstentum/);
  assert.equal(anna.stein, 700, 'eine Absage kostet nichts');
  anna.zeitalter = 2;
  const antwort = bauen();
  assert.equal(antwort.fehler, undefined);
  assert.equal(welt.gebaeude.get(antwort.gebaeude)?.art, 'burg', 'die Baustelle steht');
  assert.equal(anna.stein, 50, '650 Stein bezahlt');
});

test('bauen AC-32: eine fertige Burg gibt zwanzig Plaetze Wohnraum, eine Baustelle keinen', () => {
  const baustelle = mitBurg(false);
  const vorher = baustelle.welt.wohnraum(baustelle.welt.spielerVon('a'));
  assert.equal(vorher, GEBAEUDE.dorfzentrum.wohnraum, 'nur das Dorfzentrum - die Baustelle zaehlt nicht');
  const fertig = mitBurg(true);
  assert.equal(fertig.welt.wohnraum(fertig.welt.spielerVon('a')), vorher + 20, 'zwanzig mehr');
});

test('bauen AC-32: die Burg schiesst von selbst - 11 gegen die Fernruestung, alle zwei Sekunden', () => {
  const { welt, rand } = mitBurg();
  const miliz = welt.einheitAnlegen('b', rand.x1 + 5, rand.y0, 'miliz');
  welt.takten();
  // Miliz 40 Leben, Fernruestung 1: ein Pfeil nimmt 11 - 1 = 10.
  assert.equal(miliz.leben, 30, 'der erste Pfeil im ersten Takt');
  // Nach dem ersten Takt noch vier Sekunden: der dritte Pfeil faellt genau
  // bei 4 s; einen Takt vorher waren es erst zwei.
  sekunden(welt, 4 - 1 / TAKTE_PRO_SEKUNDE);
  assert.equal(miliz.leben, 20, 'Pfeile bei 0 und 2 Sekunden');
  welt.takten();
  assert.equal(miliz.leben, 10, 'der dritte bei 4 Sekunden');
  assert.equal(miliz.auftrag, null, 'die Miliz hat keinen Befehl bekommen');
});

test('bauen AC-32: acht Felder vom Rand der Burg, auf jeder Seite - achteinhalb nicht', () => {
  for (const seite of ['rechts', 'links']) {
    const nah = mitBurg();
    const x = seite === 'rechts' ? nah.rand.x1 + 8 : nah.rand.x0 - 8;
    const getroffen = nah.welt.einheitAnlegen('b', x, nah.rand.y0 + 1, 'miliz');
    nah.welt.takten();
    assert.equal(getroffen.leben, 30, `${seite}: auf acht Feldern getroffen`);

    // Gegenprobe: gemessen wird vom Rand, nicht von der Mitte und nicht von
    // der Ecke, an der die Burg verankert ist - ein halbes Feld weiter nicht.
    const fern = mitBurg();
    const xf = seite === 'rechts' ? fern.rand.x1 + 8.6 : fern.rand.x0 - 8.6;
    const verfehlt = fern.welt.einheitAnlegen('b', xf, fern.rand.y0 + 1, 'miliz');
    sekunden(fern.welt, 4);
    assert.equal(verfehlt.leben, 40, `${seite}: auf achteinhalb Feldern nicht`);
  }
});

test('bauen AC-32: Pfeile richten an der Burg nur 1 aus, die Ramme ihren vollen Stoss', () => {
  const { welt, burg, rand } = mitBurg();
  const schuetze = welt.einheitAnlegen('b', rand.x1 + 3, rand.y0, 'bogenschuetze');
  assert.equal(welt.schaden(schuetze, burg, true), 1, 'Bogen gegen 11 Fernruestung');
  // Die Ramme traegt ihren Bonus gegen Gebaeude - gegen 8 Nahruestung bleibt
  // davon fast alles (einheiten AC-35).
  const ramme = welt.einheitAnlegen('b', rand.x1 + 1, rand.y0, 'ramme');
  const stoss = welt.schaden(ramme, burg, true);
  const haus = welt.gebaeudeAnlegen('b', 'haus', rand.x1 + 6, rand.y1 + 6);
  assert.equal(stoss, welt.schaden(ramme, haus, true) - 8, 'acht weniger als gegen ein Haus ohne Nahruestung');
  assert.ok(stoss > 100, `ein Stoss nimmt ${stoss}`);
});
