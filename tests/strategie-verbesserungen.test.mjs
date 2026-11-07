// Die Verbesserungen der Feudalzeit (bauen AC-25, AC-26) - Rechenteile, direkt
// geprueft (→ docs/adr/0004-teststrategie.md). Zwei aus der Schmiede wirken auf
// den Kampf, zwei aus Lager und Muehle auf die Wirtschaft. Die Oberflaeche dazu
// steht in e2e/tests/strategie-verbesserungen.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, EINHEITEN, VERBESSERUNGEN, SAMMELN } = require('../server/spiele/strategie/daten.js');
const karten = require('../server/spiele/strategie/karte.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

/** Eine Welt, in der Anna die Feudalzeit erreicht hat und alles bezahlen kann. */
function feudal() {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  anna.zeitalter = 1;
  anna.holz = 2000;
  anna.nahrung = 2000;
  anna.gold = 2000;
  anna.stein = 2000;
  return { welt, anna };
}

/** Ein freier Platz fuer ein Gebaeude, ringweise um die Basis. */
function platz(welt, anna, art = 'kaserne') {
  for (let r = 6; r < 40; r++) {
    for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const x = anna.basis.x + r * sx;
      const y = anna.basis.y + r * sy;
      if (welt.platzPruefen(art, x, y) && welt.platzPruefen('dorfzentrum', x, y)) return { x, y };
    }
  }
  throw new Error('kein Platz');
}

/** Das Gebaeude hinstellen und die Verbesserung bis zum Ende erforschen. */
function erforschen(welt, anna, gebaeudeArt, art) {
  const p = platz(welt, anna, gebaeudeArt);
  const g = welt.gebaeudeAnlegen('a', gebaeudeArt, p.x, p.y);
  assert.deepEqual(welt.ausbilden('a', g.id, art), {}, art);
  for (let i = 0; i < VERBESSERUNGEN[art].zeit * TAKTE_PRO_SEKUNDE; i++) welt.takten();
  assert.ok(anna.verbesserungen.includes(art), art + ' ist erforscht');
  return g;
}

test('bauen AC-25: die Schmiede forscht, Kosten und Wirkung nach der Vorlage', () => {
  for (const art of ['schmiedeangriff', 'befiedertePfeile']) {
    assert.ok(GEBAEUDE.schmiede.bildetAus.includes(art), art + ' steht in der Schmiede');
    assert.equal(VERBESSERUNGEN[art].zeitalter, 1, art + ' erst ab der Feudalzeit');
  }
  assert.deepEqual(VERBESSERUNGEN.schmiedeangriff.kosten, { nahrung: 100 });
  assert.deepEqual(VERBESSERUNGEN.befiedertePfeile.kosten, { nahrung: 100, gold: 50 });
  assert.deepEqual(VERBESSERUNGEN.befiedertePfeile.wirkung.bogenschuetze, { angriff: 1, reichweite: 1 });
});

test('bauen AC-25: Schmiedeangriff gibt Infanterie und Kavallerie +1 Nahangriff - dem Dorfbewohner nicht', () => {
  const { welt, anna } = feudal();
  // Vorher: die Werte der Tabelle.
  assert.equal(welt.einheitenwert('a', 'miliz', 'angriff'), 4);
  assert.equal(welt.einheitenwert('a', 'speerkaempfer', 'angriff'), 3);
  assert.equal(welt.einheitenwert('a', 'spaeherreiter', 'angriff'), 3);
  assert.equal(welt.einheitenwert('a', 'dorfbewohner', 'angriff'), 3);
  assert.equal(welt.einheitenwert('a', 'bogenschuetze', 'angriff'), 4);

  erforschen(welt, anna, 'schmiede', 'schmiedeangriff');

  assert.equal(welt.einheitenwert('a', 'miliz', 'angriff'), 5, 'Infanterie');
  assert.equal(welt.einheitenwert('a', 'speerkaempfer', 'angriff'), 4, 'auch der Speerkaempfer');
  assert.equal(welt.einheitenwert('a', 'spaeherreiter', 'angriff'), 4, 'Kavallerie');
  // Der Dorfbewohner traegt die Klasse `dorf` - wie im Original bleibt er aussen
  // vor. Sonst waere die Verteidigung der Basis mit einer Verbesserung
  // mitverbessert, die niemand fuer sie kauft.
  assert.equal(welt.einheitenwert('a', 'dorfbewohner', 'angriff'), 3, 'der Dorfbewohner nicht');
  assert.equal(welt.einheitenwert('a', 'bogenschuetze', 'angriff'), 4, 'der Bogenschuetze nicht');
  // Und der Gegner hat nichts davon.
  assert.equal(welt.einheitenwert('b', 'miliz', 'angriff'), 4, 'Bert nicht');
});

test('bauen AC-25: Befiederte Pfeile geben Fernkaempfern +1 Angriff und +1 Reichweite', () => {
  const { welt, anna } = feudal();
  erforschen(welt, anna, 'schmiede', 'befiedertePfeile');
  for (const art of ['bogenschuetze', 'plaenkler']) {
    assert.equal(welt.einheitenwert('a', art, 'angriff'), EINHEITEN[art].angriff + 1, art);
    assert.equal(welt.einheitenwert('a', art, 'reichweite'), 5, art + ' schiesst weiter');
  }
  assert.equal(welt.einheitenwert('a', 'miliz', 'angriff'), 4, 'die Miliz nicht');
  assert.equal(welt.einheitenwert('a', 'miliz', 'reichweite'), 0, 'und bleibt Nahkaempfer');
});

test('bauen AC-25: die Wirkung gilt sofort fuer die Einheiten, die schon stehen', () => {
  const { welt, anna } = feudal();
  const bert = welt.spielerVon('b');
  bert.zeitalter = 1;
  const miliz = welt.einheitAnlegen('a', anna.basis.x + 3, anna.basis.y + 6, 'miliz');
  const opfer = welt.einheitAnlegen('b', anna.basis.x + 4, anna.basis.y + 6, 'miliz');
  // Miliz gegen Miliz: Angriff 4 gegen Nahruestung 0 sind 4 Schaden.
  assert.equal(welt.schaden(miliz, opfer, false), 4);
  erforschen(welt, anna, 'schmiede', 'schmiedeangriff');
  assert.equal(welt.schaden(miliz, opfer, false), 5, 'die Miliz, die schon steht, schlaegt haerter');
  assert.equal(welt.schaden(opfer, miliz, false), 4, 'Berts Miliz nicht');
});

test('bauen AC-21: der Webstuhl schuetzt wirklich - die Ruestung kommt im Schaden an', () => {
  // Bis Runde 68 las die Schadensformel die Tabelle statt der Werte des
  // Spielers: die Ruestung aus dem Webstuhl (+1 nah, +2 fern) war Zierde.
  const { welt, anna } = feudal();
  const bauer = welt.einheitAnlegen('a', anna.basis.x + 3, anna.basis.y + 6, 'dorfbewohner');
  const feind = welt.einheitAnlegen('b', anna.basis.x + 4, anna.basis.y + 6, 'miliz');
  const schuetze = welt.einheitAnlegen('b', anna.basis.x + 5, anna.basis.y + 6, 'bogenschuetze');
  assert.equal(welt.schaden(feind, bauer, false), 4, 'nah: 4 - 0');
  assert.equal(welt.schaden(schuetze, bauer, false), 4, 'fern: 4 - 0');

  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === 'dorfzentrum');
  assert.deepEqual(welt.ausbilden('a', zentrum.id, 'webstuhl'), {});
  for (let i = 0; i < VERBESSERUNGEN.webstuhl.zeit * TAKTE_PRO_SEKUNDE; i++) welt.takten();

  assert.equal(welt.schaden(feind, bauer, false), 3, 'nah: 4 - 1');
  assert.equal(welt.schaden(schuetze, bauer, false), 2, 'fern: 4 - 2');
});

test('bauen AC-26: die Doppelaxt bringt 20 Prozent mehr Holz, nur am Holz', () => {
  const { welt, anna } = feudal();
  assert.ok(GEBAEUDE.holzfaellerlager.bildetAus.includes('doppelaxt'));
  assert.deepEqual(VERBESSERUNGEN.doppelaxt.kosten, { nahrung: 100, holz: 50 });

  assert.equal(welt.sammelrate('a', 'holz', SAMMELN[karten.WALD].rate), SAMMELN[karten.WALD].rate);
  erforschen(welt, anna, 'holzfaellerlager', 'doppelaxt');
  // 0,39 * 1,2 = 0,468 - gerechnet wird mit Bruechen, deshalb auf sechs Stellen.
  assert.equal(
    welt.sammelrate('a', 'holz', SAMMELN[karten.WALD].rate).toFixed(6),
    (SAMMELN[karten.WALD].rate * 1.2).toFixed(6),
  );
  assert.equal(welt.sammelrate('a', 'gold', 0.38), 0.38, 'am Gold aendert sie nichts');
  assert.equal(welt.sammelrate('b', 'holz', 0.39), 0.39, 'und Bert sammelt wie zuvor');
});

test('bauen AC-26: mit der Doppelaxt ist eine Ladung Holz frueher voll', () => {
  // Gemessen statt behauptet. Gemessen wird die **Arbeit am Baum**, nicht der
  // Holzstand nach vier Minuten: darin steckt auch das Hin- und Herlaufen, das
  // die Verbesserung nicht beruehrt - ueber vier Minuten kamen so 170 gegen
  // 180 Holz heraus, und das sagt ueber die Rate nichts.
  function takteBisVoll(mitAxt) {
    const welt = new Welt(ZWEI, 7);
    const anna = welt.spielerVon('a');
    anna.zeitalter = 1;
    if (mitAxt) anna.verbesserungen.push('doppelaxt');
    const wald = welt.naechsterVorrat(anna.basis, karten.WALD);
    const bauer = [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
    welt.nachricht('a', { auftrag: 'befehl', einheiten: [bauer.id], ziel: wald });
    for (let t = 0; t < 120 * TAKTE_PRO_SEKUNDE; t++) {
      welt.takten();
      if (bauer.ladung >= EINHEITEN.dorfbewohner.tragkraft) return t + 1;
    }
    throw new Error('nie voll');
  }
  const ohne = takteBisVoll(false);
  const mit = takteBisVoll(true);
  // Zehn Holz bei 0,39 je Sekunde sind 25,6 s, bei 0,468 noch 21,4 s - also
  // fuenf Sechstel. Die Grenze kommt aus dem Kriterium (+20 % heisst: weniger
  // als neun Zehntel der Zeit), nicht aus dem Messwert. Gemessen: 325 gegen 368.
  assert.ok(mit < ohne * 0.9, `mit Axt schneller voll: ${mit} gegen ${ohne} Takte`);
});

test('bauen AC-26: Pferdekummet legt 75 Nahrung auf jede Farm - auch auf die, die schon steht', () => {
  const { welt, anna } = feudal();
  assert.ok(GEBAEUDE.muehle.bildetAus.includes('pferdekummet'));
  assert.deepEqual(VERBESSERUNGEN.pferdekummet.kosten, { nahrung: 75, holz: 75 });

  const alt = welt.gebaeudeAnlegen('a', 'farm', platz(welt, anna, 'farm').x, platz(welt, anna, 'farm').y);
  assert.equal(alt.nahrung, GEBAEUDE.farm.nahrung);
  const fremd = welt.gebaeudeAnlegen('b', 'farm', welt.spielerVon('b').basis.x + 6, welt.spielerVon('b').basis.y + 6);

  erforschen(welt, anna, 'muehle', 'pferdekummet');

  assert.equal(alt.nahrung, GEBAEUDE.farm.nahrung + 75, 'die Farm, die schon stand');
  assert.equal(fremd.nahrung, GEBAEUDE.farm.nahrung, 'Berts Farm nicht');
  const neu = welt.gebaeudeAnlegen('a', 'farm', platz(welt, anna, 'farm').x, platz(welt, anna, 'farm').y);
  assert.equal(neu.nahrung, GEBAEUDE.farm.nahrung + 75, 'und jede naechste');
  assert.equal(welt.farmNahrung('b'), GEBAEUDE.farm.nahrung);
});

test('bauen AC-25 / AC-26: in der Dunklen Zeit gibt es keine davon, und jede nur einmal', () => {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  anna.holz = 2000;
  anna.nahrung = 2000;
  anna.gold = 2000;
  // Die Muehle steht schon in der Dunklen Zeit - das Pferdekummet nicht.
  const p = platz(welt, anna, 'muehle');
  const muehle = welt.gebaeudeAnlegen('a', 'muehle', p.x, p.y);
  assert.match(welt.ausbilden('a', muehle.id, 'pferdekummet').fehler, /Feudalzeit/);

  anna.zeitalter = 1;
  assert.deepEqual(welt.ausbilden('a', muehle.id, 'pferdekummet'), {});
  assert.match(welt.ausbilden('a', muehle.id, 'pferdekummet').fehler, /nur einmal/, 'nicht zweimal eingereiht');
  for (let i = 0; i < VERBESSERUNGEN.pferdekummet.zeit * TAKTE_PRO_SEKUNDE; i++) welt.takten();
  assert.match(welt.ausbilden('a', muehle.id, 'pferdekummet').fehler, /nur einmal/, 'erforscht ist erforscht');
});

test('bauen AC-25 / AC-26: jede Verbesserung haengt an ihrem Gebaeude', () => {
  const { welt, anna } = feudal();
  const wo = {
    schmiede: ['schmiedeangriff', 'befiedertePfeile'],
    holzfaellerlager: ['doppelaxt'],
    muehle: ['pferdekummet'],
  };
  for (const [gebaeudeArt, arten] of Object.entries(wo)) {
    const p = platz(welt, anna, gebaeudeArt);
    const g = welt.gebaeudeAnlegen('a', gebaeudeArt, p.x, p.y);
    for (const art of arten) assert.deepEqual(welt.ausbilden('a', g.id, art), {}, `${art} in der ${gebaeudeArt}`);
    // Was woanders hingehoert, weist dasselbe Gebaeude ab.
    for (const [andereArt, fremde] of Object.entries(wo)) {
      if (andereArt === gebaeudeArt) continue;
      for (const art of fremde) {
        assert.ok(welt.ausbilden('a', g.id, art).fehler, `${art} nicht in der ${gebaeudeArt}`);
      }
    }
  }
});
