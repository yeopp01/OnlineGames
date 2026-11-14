// Die Wirtschaft waechst mit den Zeitaltern (bauen AC-43, AC-44) - Rechenteile,
// direkt geprueft (→ docs/adr/0004-teststrategie.md).
//
// Rueckmeldung des Benutzers aus dem ersten Spiel auf dem Server: "Im
// Fürstentum muss es auch noch weiterentwicklungen für bergbau, mühle,
// holzabbau, etc. geben". Bis dahin gab es Doppelaxt und Pferdekummet im
// Lehen und danach nichts; fuer Gold und Stein gar nichts.
//
// Die Oberflaeche dazu steht in e2e/tests/strategie-wirtschaft.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, EINHEITEN, VERBESSERUNGEN, SAMMELN } = require('../server/spiele/strategie/daten.js');
const { bringt } = require('../server/spiele/strategie/bringt.js');
const karten = require('../server/spiele/strategie/karte.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

// Kosten und Dauer aus den offenen Technikbaum-Daten zum Original
// (SiegeEngineers/aoe2techtree, gelesen 2026-11-14).
const PLAN = {
  goldbergbau: { ort: 'bergbaulager', zeitalter: 1, kosten: { nahrung: 100, holz: 75 }, zeit: 30 },
  steinbergbau: { ort: 'bergbaulager', zeitalter: 1, kosten: { nahrung: 100, holz: 75 }, zeit: 30 },
  bogensaege: { ort: 'holzfaellerlager', zeitalter: 2, kosten: { nahrung: 150, holz: 100 }, zeit: 50, vorstufe: 'doppelaxt' },
  goldschacht: { ort: 'bergbaulager', zeitalter: 2, kosten: { nahrung: 175, holz: 75 }, zeit: 75, vorstufe: 'goldbergbau' },
  steinschacht: { ort: 'bergbaulager', zeitalter: 2, kosten: { nahrung: 175, holz: 75 }, zeit: 75, vorstufe: 'steinbergbau' },
  schwererPflug: { ort: 'muehle', zeitalter: 2, kosten: { nahrung: 125, holz: 125 }, zeit: 40, vorstufe: 'pferdekummet' },
  schubkarre: { ort: 'dorfzentrum', zeitalter: 1, kosten: { nahrung: 175, holz: 50 }, zeit: 75 },
  handkarren: { ort: 'dorfzentrum', zeitalter: 2, kosten: { nahrung: 300, holz: 200 }, zeit: 55, vorstufe: 'schubkarre' },
};
const WIRTSCHAFT = ['goldbergbau', 'steinbergbau', 'bogensaege', 'goldschacht', 'steinschacht', 'schwererPflug'];
const KARREN = ['schubkarre', 'handkarren'];

/** Eine Welt, in der Anna das Zeitalter hat und alles bezahlen kann. */
function weltIm(zeitalter) {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  anna.zeitalter = zeitalter;
  welt.zeitalterWirkungen(anna);
  Object.assign(anna, { holz: 5000, nahrung: 5000, gold: 5000, stein: 5000 });
  return { welt, anna };
}

/** Ein freier Platz fuer ein Gebaeude, ringweise um die Basis. */
function platz(welt, anna, art) {
  for (let r = 6; r < 40; r++) {
    for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const x = anna.basis.x + r * sx;
      const y = anna.basis.y + r * sy;
      if (welt.platzPruefen(art, x, y) && welt.platzPruefen('dorfzentrum', x, y)) return { x, y };
    }
  }
  throw new Error('kein Platz');
}

function aufstellen(welt, anna, art) {
  const p = platz(welt, anna, art);
  return welt.gebaeudeAnlegen('a', art, p.x, p.y);
}

/** Im Gebaeude bestellen und warten, bis sie erforscht ist. */
function bestellen(welt, anna, gebaeude, art) {
  assert.deepEqual(welt.ausbilden('a', gebaeude.id, art), {}, art);
  for (let i = 0; i < VERBESSERUNGEN[art].zeit * TAKTE_PRO_SEKUNDE + 5; i++) welt.takten();
  assert.ok(anna.verbesserungen.includes(art), `${art} ist erforscht`);
}

function planPruefen(arten) {
  for (const art of arten) {
    const soll = PLAN[art];
    const v = VERBESSERUNGEN[art];
    assert.ok(v, `${art} steht in den Daten`);
    assert.ok(GEBAEUDE[soll.ort].bildetAus.includes(art), `${art} wird im Gebaeude ${soll.ort} erforscht`);
    assert.equal(v.zeitalter, soll.zeitalter, `${art}: Zeitalter`);
    assert.deepEqual(v.kosten, soll.kosten, `${art}: Kosten`);
    assert.equal(v.zeit, soll.zeit, `${art}: Dauer`);
    assert.equal(v.vorstufe, soll.vorstufe, `${art}: Vorstufe`);
    assert.ok(v.zeichen, `${art} hat ein eigenes Bild`);
  }
}

test('bauen AC-43: sechs Verbesserungen der Wirtschaft - jede an ihrem Gebaeude, mit Zeitalter, Kosten, Dauer und Vorstufe', () => {
  planPruefen(WIRTSCHAFT);
  // Jedes Bild gibt es einmal: gleiche Knoepfe waeren keine Auswahl.
  const zeichen = Object.values(VERBESSERUNGEN).map((v) => v.zeichen).filter(Boolean);
  assert.equal(new Set(zeichen).size, zeichen.length);
});

test('bauen AC-43: Bergbau bringt 15 Prozent je Stufe, nur an seinem Rohstoff - die Bogensaege 20 Prozent auf die Doppelaxt', () => {
  const { welt, anna } = weltIm(2);
  const gold = SAMMELN[karten.GOLD].rate;
  const stein = SAMMELN[karten.STEIN].rate;
  const holz = SAMMELN[karten.WALD].rate;
  const rate = (rohstoff, grund) => Number(welt.sammelrate('a', rohstoff, grund).toFixed(6));

  welt.erforschen(anna, 'goldbergbau');
  assert.equal(rate('gold', gold), Number((gold * 1.15).toFixed(6)));
  assert.equal(rate('stein', stein), stein, 'am Stein aendert der Goldbergbau nichts');
  assert.equal(rate('holz', holz), holz);
  welt.erforschen(anna, 'goldschacht');
  assert.equal(rate('gold', gold), Number((gold * 1.15 * 1.15).toFixed(6)), 'zwei Stufen multiplizieren sich');

  welt.erforschen(anna, 'steinbergbau');
  welt.erforschen(anna, 'steinschacht');
  assert.equal(rate('stein', stein), Number((stein * 1.15 * 1.15).toFixed(6)));

  welt.erforschen(anna, 'doppelaxt');
  welt.erforschen(anna, 'bogensaege');
  assert.equal(rate('holz', holz), Number((holz * 1.2 * 1.2).toFixed(6)));

  assert.equal(welt.sammelrate('b', 'gold', gold), gold, 'Bert sammelt wie zuvor');
});

test('bauen AC-43: die zweite Stufe gibt es erst im Fuerstentum und erst nach der ersten', () => {
  const { welt, anna } = weltIm(1);
  const lager = aufstellen(welt, anna, 'bergbaulager');
  const saegewerk = aufstellen(welt, anna, 'holzfaellerlager');
  const muehle = aufstellen(welt, anna, 'muehle');

  // Im Lehen: die erste Stufe ja, die zweite nicht.
  assert.match(welt.ausbilden('a', lager.id, 'goldschacht').fehler, /ab dem Fürstentum/);
  assert.match(welt.ausbilden('a', saegewerk.id, 'bogensaege').fehler, /ab dem Fürstentum/);
  assert.match(welt.ausbilden('a', muehle.id, 'schwererPflug').fehler, /ab dem Fürstentum/);
  // Und nur dort, wo sie hingehoert.
  assert.ok(welt.ausbilden('a', muehle.id, 'goldbergbau').fehler);

  anna.zeitalter = 2;
  welt.zeitalterWirkungen(anna);
  assert.match(welt.ausbilden('a', lager.id, 'goldschacht').fehler, /erst nach „Goldbergbau"/);
  assert.match(welt.ausbilden('a', lager.id, 'steinschacht').fehler, /erst nach „Steinbergbau"/);
  assert.match(welt.ausbilden('a', saegewerk.id, 'bogensaege').fehler, /erst nach „Doppelaxt"/);
  assert.match(welt.ausbilden('a', muehle.id, 'schwererPflug').fehler, /erst nach „Pferdekummet"/);

  // Der ganze Weg am Bergbaulager: bezahlt wird beim Bestellen.
  const vorher = { nahrung: anna.nahrung, holz: anna.holz };
  bestellen(welt, anna, lager, 'goldbergbau');
  assert.equal(anna.nahrung, vorher.nahrung - 100);
  assert.equal(anna.holz, vorher.holz - 75);
  bestellen(welt, anna, lager, 'goldschacht');
  assert.equal(anna.nahrung, vorher.nahrung - 275);
  // Einmal je Partie.
  assert.ok(welt.ausbilden('a', lager.id, 'goldschacht').fehler);
});

test('bauen AC-43: der Schwere Pflug legt 125 Nahrung auf jede Farm - auch auf die, die schon steht, nicht auf die Brache', () => {
  const { welt, anna } = weltIm(2);
  welt.erforschen(anna, 'pferdekummet');
  const voll = GEBAEUDE.farm.nahrung + 75;
  const alt = aufstellen(welt, anna, 'farm');
  assert.equal(alt.nahrung, voll);
  const brache = aufstellen(welt, anna, 'farm');
  brache.nahrung = 0;
  brache.brach = true;
  const fremd = welt.gebaeudeAnlegen('b', 'farm', welt.spielerVon('b').basis.x + 6, welt.spielerVon('b').basis.y + 6);

  welt.erforschen(anna, 'schwererPflug');

  assert.equal(alt.nahrung, voll + 125, 'die Farm, die schon stand');
  assert.equal(brache.nahrung, 0, 'eine Brache bleibt leer, bis sie neu ausgesaet ist');
  assert.equal(fremd.nahrung, GEBAEUDE.farm.nahrung, 'Berts Farm nicht');
  assert.equal(welt.farmNahrung('a'), GEBAEUDE.farm.nahrung + 200, 'jede neue traegt 375');
  assert.equal(aufstellen(welt, anna, 'farm').nahrung, GEBAEUDE.farm.nahrung + 200);
});

test('bauen AC-43: gemessen - mit Goldbergbau und Goldschacht ist eine Ladung Gold frueher voll', () => {
  // Gemessen wird die Arbeit am Vorkommen, nicht der Goldstand nach Minuten:
  // darin steckte der Weg, den die Verbesserung nicht beruehrt (bauen AC-26).
  function takteBisVoll(arten) {
    const welt = new Welt(ZWEI, 7);
    const anna = welt.spielerVon('a');
    anna.zeitalter = 2;
    for (const art of arten) welt.erforschen(anna, art);
    const gold = welt.naechsterVorrat(anna.basis, karten.GOLD);
    const bauer = [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
    welt.nachricht('a', { auftrag: 'befehl', einheiten: [bauer.id], ziel: gold });
    let beginn = null;
    for (let t = 0; t < 180 * TAKTE_PRO_SEKUNDE; t++) {
      welt.takten();
      if (beginn === null && bauer.sammelt) beginn = t;
      if (bauer.ladung >= EINHEITEN.dorfbewohner.tragkraft) return t - beginn;
    }
    throw new Error('nie voll');
  }
  const ohne = takteBisVoll([]);
  const eine = takteBisVoll(['goldbergbau']);
  const zwei = takteBisVoll(['goldbergbau', 'goldschacht']);
  // +15 % heisst: hoechstens neun Zehntel der Zeit (1 / 1,15 = 0,87), zwei
  // Stufen hoechstens acht Zehntel (1 / 1,3225 = 0,76). Die Grenzen kommen
  // aus dem Kriterium, nicht aus dem Messwert.
  assert.ok(eine < ohne * 0.9, `eine Stufe: ${eine} gegen ${ohne} Takte`);
  assert.ok(zwei < ohne * 0.8, `zwei Stufen: ${zwei} gegen ${ohne} Takte`);
});

test('bauen AC-43: was eine Verbesserung bringt, steht in Worten und mit ihren Zahlen', () => {
  assert.deepEqual(bringt(VERBESSERUNGEN.goldbergbau), ['Gold wird 15 % schneller gesammelt']);
  assert.deepEqual(bringt(VERBESSERUNGEN.steinschacht), ['Stein wird 15 % schneller gesammelt']);
  assert.deepEqual(bringt(VERBESSERUNGEN.bogensaege), ['Holz wird 20 % schneller gesammelt']);
  assert.deepEqual(bringt(VERBESSERUNGEN.schwererPflug), ['Jede neue Farm trägt 125 Nahrung mehr']);
});

test('bauen AC-44: Schubkarre und Handkarren stehen im Dorfzentrum - Zeitalter, Kosten, Dauer, Vorstufe', () => {
  planPruefen(KARREN);
  const { welt, anna } = weltIm(1);
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === 'dorfzentrum');
  assert.match(welt.ausbilden('a', zentrum.id, 'handkarren').fehler, /ab dem Fürstentum/);
  anna.zeitalter = 2;
  welt.zeitalterWirkungen(anna);
  assert.match(welt.ausbilden('a', zentrum.id, 'handkarren').fehler, /erst nach „Schubkarre"/);
  bestellen(welt, anna, zentrum, 'schubkarre');
  bestellen(welt, anna, zentrum, 'handkarren');
});

test('bauen AC-44: die Schubkarre gibt dem Dorfbewohner 10 Prozent Tempo und 3 Tragkraft, der Handkarren noch einmal 10 Prozent und 5', () => {
  const { welt, anna } = weltIm(2);
  const bauer = [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  const berts = [...welt.einheiten.values()].find((e) => e.besitzer === 'b' && e.art === 'dorfbewohner');
  const tempo = (besitzer) => welt.einheitenwert(besitzer, 'dorfbewohner', 'tempo').toFixed(2);
  assert.equal(tempo('a'), '0.80');
  assert.equal(welt.tragkraft(bauer), 10);

  welt.erforschen(anna, 'schubkarre');
  assert.equal(tempo('a'), '0.88');
  assert.equal(welt.tragkraft(bauer), 13);
  // Auf der Leitung: die Leiste zeigt "von 13".
  assert.equal(welt.kampfwerte('a').dorfbewohner.tragkraft, 13);
  assert.equal(welt.kampfwerte('a').miliz.tragkraft, undefined, 'wer nicht traegt, zeigt nichts');

  welt.erforschen(anna, 'handkarren');
  assert.equal(tempo('a'), '0.96');
  assert.equal(welt.tragkraft(bauer), 18);

  assert.equal(tempo('b'), '0.80', 'Bert geht wie zuvor');
  assert.equal(welt.tragkraft(berts), 10);
  assert.equal(welt.kampfwerte('b').dorfbewohner.tragkraft, 10);
  // Nur der Dorfbewohner: ein Speerkaempfer wird nicht schneller.
  assert.equal(welt.einheitenwert('a', 'speerkaempfer', 'tempo'), EINHEITEN.speerkaempfer.tempo);

  assert.deepEqual(bringt(VERBESSERUNGEN.schubkarre), ['Dorfbewohner: +10 % Tempo, +3 Tragkraft']);
  assert.deepEqual(bringt(VERBESSERUNGEN.handkarren), ['Dorfbewohner: +10 % Tempo, +5 Tragkraft']);
});

/** Ein Holzfaeller, fuenf Minuten: was er hoechstens trug und was im Lager ankam. */
function holzfaellen(arten) {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  anna.zeitalter = 2;
  for (const art of arten) welt.erforschen(anna, art);
  const wald = welt.naechsterVorrat(anna.basis, karten.WALD);
  const bauer = [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [bauer.id], ziel: wald });
  const vorher = anna.holz;
  let meiste = 0;
  for (let t = 0; t < 300 * TAKTE_PRO_SEKUNDE; t++) {
    welt.takten();
    meiste = Math.max(meiste, bauer.ladung);
  }
  return { meiste, holz: anna.holz - vorher };
}

test('bauen AC-44: gemessen - mit der Schubkarre geht der Sammler erst mit 13 zum Lager und bringt in fuenf Minuten mehr heim', () => {
  const ohne = holzfaellen([]);
  const schubkarre = holzfaellen(['schubkarre']);
  const handkarren = holzfaellen(['schubkarre', 'handkarren']);
  assert.equal(ohne.meiste, 10);
  assert.equal(schubkarre.meiste, 13);
  assert.equal(handkarren.meiste, 18);
  // Mehr tragen und schneller gehen heisst weniger Weg je Holz. Wie viel, ist
  // gemessen und haengt am Abstand des Waldes; verlangt ist nur die Richtung.
  assert.ok(schubkarre.holz > ohne.holz, `Schubkarre: ${schubkarre.holz} gegen ${ohne.holz} Holz`);
  assert.ok(handkarren.holz > schubkarre.holz, `Handkarren: ${handkarren.holz} gegen ${schubkarre.holz} Holz`);
});
