// Verbesserungen mit eigenem Charakter (→ specs/10-strategie/bauen.md AC-52
// bis AC-56): Kartografie, Blutlinien, Karawane, Brandstiftung, Knappen, die
// vier Lehren des Klosters, Tretkran und Sappeure. Rechenteil, direkt
// geprueft (→ docs/adr/0004-teststrategie.md). Die Oberflaeche dazu:
// e2e/tests/strategie-charakter.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, EINHEITEN, VERBESSERUNGEN } = require('../server/spiele/strategie/daten.js');
const { bringt } = require('../server/spiele/strategie/bringt.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const DREI = [...ZWEI, { id: 'c', name: 'Carla' }];
const sekunden = (welt, s) => { for (let t = 0; t < s * TAKTE_PRO_SEKUNDE; t++) welt.takten(); };

// Wo jede steht, ab wann, und was sie kostet - die Tabelle der Spec.
const PAKET = {
  kartografie: ['markt', 1, { nahrung: 100, gold: 100 }, 40],
  blutlinien: ['stall', 1, { nahrung: 150, gold: 100 }, 50],
  karawane: ['markt', 3, { nahrung: 200, gold: 200 }, 40],
  brandstiftung: ['kaserne', 1, { nahrung: 75, gold: 25 }, 25],
  knappen: ['kaserne', 2, { nahrung: 100 }, 40],
  heiligkeit: ['kloster', 2, { gold: 175 }, 60],
  inbrunst: ['kloster', 2, { gold: 140 }, 50],
  buchdruck: ['kloster', 3, { gold: 200 }, 55],
  erleuchtung: ['kloster', 3, { gold: 120 }, 65],
  tretkran: ['universitaet', 2, { nahrung: 300, holz: 200 }, 50],
  sappeure: ['burg', 3, { nahrung: 400, holz: 200 }, 10],
};

/**
 * Eine Welt, Anna satt und im gewuenschten Zeitalter, und ein freier Platz
 * von elf mal elf Feldern neben ihrem Dorf, weit weg von allen Einheiten.
 */
function mitPlatz(zeitalter = 3, optionen = { sicht: 'aufgedeckt' }, spieler = ZWEI) {
  const welt = new Welt(spieler, 7, optionen);
  const anna = welt.spielerVon('a');
  anna.zeitalter = zeitalter;
  welt.zeitalterWirkungen(anna);
  Object.assign(anna, { nahrung: 5000, holz: 5000, gold: 5000, stein: 2000 });
  for (let r = 6; r < 40; r++) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r], [r, r], [-r, r], [r, -r], [-r, -r]]) {
      const x0 = anna.basis.x + dx;
      const y0 = anna.basis.y + dy;
      let frei = true;
      for (let y = y0; y < y0 + 11 && frei; y++) {
        for (let x = x0; x < x0 + 11 && frei; x++) frei = welt.platzPruefen('haus', x, y) && welt.platzPruefen('haus', x + 1, y + 1);
      }
      if (frei && ![...welt.einheiten.values()].some((e) => e.x >= x0 - 6 && e.x <= x0 + 16 && e.y >= y0 - 6 && e.y <= y0 + 16)) {
        return { welt, anna, x0, y0 };
      }
    }
  }
  throw new Error('kein freier Platz');
}
const bestellen = (welt, gebaeude, art, wer = 'a') => welt.nachricht(wer, { auftrag: 'ausbilden', gebaeude: gebaeude.id, einheit: art });

test('bauen AC-52 bis AC-56: elf Verbesserungen mit eigenem Charakter - jede in genau einem Gebaeude, mit Preis, Dauer, Zeitalter und eigenem Zeichen', () => {
  for (const [art, [wo, zeitalter, kosten, zeit]] of Object.entries(PAKET)) {
    const v = VERBESSERUNGEN[art];
    assert.ok(v, art);
    assert.deepEqual([v.kosten, v.zeit, v.zeitalter], [kosten, zeit, zeitalter], art);
    const orte = Object.entries(GEBAEUDE).filter(([, g]) => g.bildetAus.includes(art)).map(([g]) => g);
    assert.deepEqual(orte, [wo], `${art} steht nur dort`);
    // Wo sie steht, gibt es sie auch: nicht frueher als das Gebaeude.
    assert.ok(zeitalter >= (GEBAEUDE[wo].zeitalter || 0), `${art} vor ihrem Gebaeude`);
    assert.ok(bringt(v).length > 0, `${art}: die Tafel sagt, was sie bringt`);
  }
  const zeichen = Object.values(VERBESSERUNGEN).map((v) => v.zeichen).filter(Boolean);
  assert.equal(new Set(zeichen).size, zeichen.length, 'kein Zeichen zweimal');
  for (const art of Object.keys(PAKET)) assert.ok(VERBESSERUNGEN[art].zeichen, `${art} hat ein Zeichen`);
});

test('bauen AC-52 bis AC-56: bestellt, bezahlt und nach ihrer Dauer erforscht - vor ihrem Zeitalter abgewiesen', () => {
  for (const [art, [wo, zeitalter, kosten, zeit]] of Object.entries(PAKET)) {
    const optionen = { sicht: art === 'kartografie' ? 'nebel' : 'aufgedeckt' };
    // Ein Zeitalter zu frueh - wo das Gebaeude dann schon steht.
    if (zeitalter > (GEBAEUDE[wo].zeitalter || 0)) {
      const frueh = mitPlatz(zeitalter - 1, optionen);
      const haus = frueh.welt.gebaeudeAnlegen('a', wo, frueh.x0 + 3, frueh.y0 + 3);
      assert.match(bestellen(frueh.welt, haus, art).fehler, /gibt es erst ab/, `${art} zu frueh`);
    }
    const { welt, anna, x0, y0 } = mitPlatz(zeitalter, optionen);
    const haus = welt.gebaeudeAnlegen('a', wo, x0 + 3, y0 + 3);
    const vorher = { nahrung: anna.nahrung, holz: anna.holz, gold: anna.gold };
    assert.deepEqual(bestellen(welt, haus, art), {}, art);
    for (const rohstoff of ['nahrung', 'holz', 'gold']) assert.equal(vorher[rohstoff] - anna[rohstoff], kosten[rohstoff] || 0, `${art}: ${rohstoff}`);
    sekunden(welt, zeit - 1);
    assert.ok(!anna.verbesserungen.includes(art), `${art} noch nicht`);
    sekunden(welt, 2);
    assert.ok(anna.verbesserungen.includes(art), art);
    assert.ok(bestellen(welt, haus, art).fehler, `${art} kein zweites Mal`);
  }
});

// ---- AC-52: Kartografie ---------------------------------------------------------

/** Wie viele Felder der Karte fuer `wer` als erkundet gelten. */
function erkundeteFelder(welt, wer) {
  let n = 0;
  for (let y = 0; y < welt.karte.groesse; y++) for (let x = 0; x < welt.karte.groesse; x++) if (welt.erkundet(wer, x, y)) n += 1;
  return n;
}
const eintrag = (welt, fuer, von = fuer) => welt.zustandJeSpieler(welt.spieler.map((s) => s.id)).get(fuer).spieler.find((s) => s.id === von);

test('bauen AC-52: mit der Kartografie gilt die ganze Karte als erkundet - gesehen ist davon nichts, und der Gegner hat nichts davon', () => {
  const { welt, anna } = mitPlatz(1, { sicht: 'nebel' });
  welt.sichtAktualisieren();
  for (const id of ['a', 'b']) welt.aufbauFuer(id);
  const alle = welt.karte.groesse ** 2;
  const bert = welt.spielerVon('b');
  const vorher = erkundeteFelder(welt, 'a');
  assert.ok(vorher > 0 && vorher < alle / 4, `am Anfang nur das eigene Dorf: ${vorher} von ${alle}`);
  assert.equal(welt.erkundet('a', bert.basis.x, bert.basis.y), false);
  assert.equal(eintrag(welt, 'a').ka, undefined);
  const fremde = () => {
    const z = welt.zustandJeSpieler(['a', 'b']).get('a');
    return z.einheiten.filter((e) => welt.einheiten.get(e.i).besitzer === 'b').length + (z.gebaeude || []).filter((g) => welt.gebaeude.get(g.i)?.besitzer === 'b').length;
  };
  assert.equal(fremde(), 0, 'von Bert kommt nichts an');

  welt.erforschen(anna, 'kartografie');
  assert.equal(erkundeteFelder(welt, 'a'), alle, 'jedes Feld');
  assert.equal(welt.erkundet('a', bert.basis.x, bert.basis.y), true);
  // Gesehen ist nichts davon: Berts Dorf bleibt, was der Server angeht, im Nebel.
  assert.equal(welt.sieht('a', bert.basis.x, bert.basis.y), false);
  sekunden(welt, 2);
  assert.equal(fremde(), 0, 'Berts Einheiten und Gebaeude kommen weiter nicht an');
  assert.ok(!welt.aufbauFuer('a').gebaeude.some((g) => welt.gebaeude.get(g.i).besitzer === 'b'), 'auch nicht nach dem Neuladen');
  // Auf der Leitung: nur Annas eigener Eintrag sagt es.
  assert.equal(eintrag(welt, 'a').ka, 1);
  assert.equal(eintrag(welt, 'b').ka, undefined, 'Bert hat keine Karte');
  assert.equal(eintrag(welt, 'b', 'a').ka, undefined, 'und erfaehrt nicht, dass Anna eine hat');
  assert.equal(erkundeteFelder(welt, 'b') < alle / 4, true);
});

test('bauen AC-52: die Karte gilt fuer alle, die die Sicht teilen - und wer das Buendnis loest, nimmt sie mit', () => {
  const { welt, anna } = mitPlatz(1, { sicht: 'nebel', teams: { a: 1, b: 2, c: 1 } }, DREI);
  welt.sichtAktualisieren();
  const alle = welt.karte.groesse ** 2;
  const carla = welt.spielerVon('c');
  carla.zeitalter = 1;
  Object.assign(carla, { nahrung: 1000, gold: 1000 });
  welt.erforschen(anna, 'kartografie');
  assert.equal(erkundeteFelder(welt, 'c'), alle, 'Carla, ihre Verbuendete, hat sie auch');
  assert.equal(eintrag(welt, 'c').ka, 1);
  assert.ok(erkundeteFelder(welt, 'b') < alle / 4, 'Bert nicht');
  // Carla kann sie nicht ein zweites Mal kaufen: die Karte ist schon bekannt.
  let markt = null;
  for (let r = 5; r < 30 && !markt; r++) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r]]) {
      if (!welt.platzPruefen('markt', carla.basis.x + dx, carla.basis.y + dy)) continue;
      markt = welt.gebaeudeAnlegen('c', 'markt', carla.basis.x + dx, carla.basis.y + dy);
      break;
    }
  }
  assert.equal(bestellen(welt, markt, 'kartografie', 'c').fehler, 'Die Karte ist schon bekannt.');
  assert.equal(carla.gold, 1000, 'nichts bezahlt');

  assert.deepEqual(welt.nachricht('a', { auftrag: 'kuendigen' }), {});
  assert.equal(erkundeteFelder(welt, 'a'), alle, 'Anna behaelt sie');
  assert.equal(erkundeteFelder(welt, 'c'), alle, 'Carla auch');
  assert.equal(eintrag(welt, 'a').ka, 1);
  assert.equal(eintrag(welt, 'c').ka, 1);
});

test('bauen AC-52: bei „Erkundet" und „Aufgedeckt" steht die Kartografie nicht im Menue und laesst sich nicht bestellen', () => {
  for (const sicht of ['erkundet', 'aufgedeckt']) {
    const { welt, anna, x0, y0 } = mitPlatz(1, { sicht });
    const markt = welt.gebaeudeAnlegen('a', 'markt', x0 + 3, y0 + 3);
    assert.ok(!welt.aufbauFuer('a').werte.gebaeude.markt.bildetAus.includes('kartografie'), sicht);
    assert.equal(bestellen(welt, markt, 'kartografie').fehler, 'Die Karte ist schon bekannt.', sicht);
    assert.equal(anna.gold, 5000);
  }
  const nebel = mitPlatz(1, { sicht: 'nebel' });
  assert.ok(nebel.welt.aufbauFuer('a').werte.gebaeude.markt.bildetAus.includes('kartografie'), 'im Nebel schon');
});

test('bauen AC-52: an der Tafel steht, was die Kartografie zeigt - und was nicht', () => {
  assert.deepEqual(bringt(VERBESSERUNGEN.kartografie), [
    'Die ganze Karte gilt als erkundet: Gelände, Wald, Gold, Stein und Beeren – für dich und deine Verbündeten',
    'Fremde Einheiten und Gebäude zeigt sie nicht',
  ]);
});

// ---- AC-53: Blutlinien und Karawane -----------------------------------------------

test('bauen AC-53: Blutlinien geben allem Berittenen 20 Leben - auch dem, der schon steht, dem Reiterschuetzen eingeschlossen', () => {
  const { welt, anna, x0, y0 } = mitPlatz(2);
  const ritter = welt.einheitAnlegen('a', x0 + 2, y0 + 2, 'ritter');
  const verletzt = welt.einheitAnlegen('a', x0 + 4, y0 + 2, 'spaeherreiter');
  verletzt.leben -= 10;
  const miliz = welt.einheitAnlegen('a', x0 + 6, y0 + 2, 'miliz');
  const berts = welt.einheitAnlegen('b', x0 + 8, y0 + 8, 'ritter');
  welt.erforschen(anna, 'blutlinien');
  for (const [art, werte] of Object.entries(EINHEITEN)) {
    const mehr = welt.lebenMax('a', art) - werte.leben;
    assert.equal(mehr, werte.klassen.includes('kavallerie') ? 20 : 0, art);
    assert.equal(welt.lebenMax('b', art), werte.leben, `Berts ${art}`);
  }
  assert.ok(EINHEITEN.reiterschuetze.klassen.includes('kavallerie'));
  assert.equal(ritter.leben, EINHEITEN.ritter.leben + 20, 'wer steht, bekommt sie dazu');
  assert.equal(verletzt.leben, EINHEITEN.spaeherreiter.leben + 10, 'wer verletzt ist, bleibt um dasselbe verletzt');
  assert.equal(miliz.leben, EINHEITEN.miliz.leben);
  assert.equal(berts.leben, EINHEITEN.ritter.leben);
  assert.deepEqual(bringt(VERBESSERUNGEN.blutlinien), ['Kavallerie: +20 Leben']);
});

/** Takte, die ein Karren fuer zwanzig Felder geradeaus braucht - und das Gold je Fahrt zwischen zwei Maerkten. */
function karrenfahrt(mitKarawane) {
  const { welt, anna, x0, y0 } = mitPlatz(3);
  if (mitKarawane) welt.erforschen(anna, 'karawane');
  const karren = welt.einheitAnlegen('a', x0, y0 + 5, 'marktkarren');
  assert.equal(welt.nachricht('a', { auftrag: 'befehl', einheiten: [karren.id], ziel: { x: x0 + 10, y: y0 + 5 } })?.fehler, undefined);
  let takte = 0;
  while (karren.weg && karren.weg.length && takte < 3000) {
    welt.takten();
    takte += 1;
  }
  assert.equal(Math.round(karren.x), x0 + 10, 'angekommen');
  const heim = welt.gebaeudeAnlegen('a', 'markt', x0 + 1, y0 + 1);
  const bert = welt.spielerVon('b');
  const fern = { art: 'markt', x: bert.basis.x, y: bert.basis.y, besitzer: 'b', quer: false };
  return { takte, gold: welt.handelsgewinn(heim, fern), tempo: welt.einheitenwert('a', 'marktkarren', 'tempo') };
}

test('bauen AC-53: mit der Karawane faehrt der Marktkarren um die Haelfte schneller - eine Fahrt bringt dasselbe Gold', () => {
  const ohne = karrenfahrt(false);
  const mit = karrenfahrt(true);
  assert.equal(ohne.tempo, EINHEITEN.marktkarren.tempo);
  assert.equal(mit.tempo, EINHEITEN.marktkarren.tempo * 1.5);
  assert.equal(mit.gold, ohne.gold, 'dasselbe Gold je Fahrt');
  // Gemessen 100 Takte ohne, 67 mit, das 1,49-fache (einheiten AC-70: der
  // Rest des Takts geht am Wegpunkt weiter). Vorher 110 und 70, das 1,57-fache,
  // weil an jedem Feld der Rest des Takts verfiel.
  const anteil = ohne.takte / mit.takte;
  assert.ok(anteil > 1.45 && anteil < 1.55, `ohne ${ohne.takte} Takte, mit ${mit.takte}: das ${anteil.toFixed(3)}-fache`);
  assert.deepEqual(bringt(VERBESSERUNGEN.karawane), ['Karren: +50 % Tempo']);
});

// ---- AC-54: Brandstiftung und Knappen ---------------------------------------------

test('bauen AC-54: nach der Brandstiftung schlaegt das Fussvolk Gebaeude mit 2 mehr - Einheiten wie bisher, Schuetzen und Reiter gar nicht', () => {
  const { welt, anna, x0, y0 } = mitPlatz(2);
  const haus = welt.gebaeudeAnlegen('b', 'haus', x0 + 6, y0 + 6);
  const opfer = welt.einheitAnlegen('b', x0 + 9, y0 + 2, 'miliz');
  const arten = Object.keys(EINHEITEN).filter((art) => EINHEITEN[art].angriff > 0);
  const stellen = (wer) => Object.fromEntries(arten.map((art, i) => [art, welt.einheitAnlegen(wer, x0 + (i % 10), y0 + 9 + Math.floor(i / 10), art)]));
  const annas = stellen('a');
  const messen = (leute) => Object.fromEntries(arten.map((art) => [art, [welt.schaden(leute[art], haus, true), welt.schaden(leute[art], opfer, false)]]));
  const vorher = messen(annas);
  const grund = JSON.stringify(EINHEITEN.speerkaempfer.bonus);

  welt.erforschen(anna, 'brandstiftung');
  const nachher = messen(annas);
  for (const art of arten) {
    const fussvolk = EINHEITEN[art].klassen.includes('infanterie');
    // Wer vorher nur ritzte (1 = Mindestschaden), kann unter dem Zuschlag bleiben.
    if (fussvolk && vorher[art][0] > 1) assert.equal(nachher[art][0] - vorher[art][0], 2, `${art} gegen das Haus`);
    else if (fussvolk) assert.ok(nachher[art][0] >= vorher[art][0], art);
    else assert.equal(nachher[art][0], vorher[art][0], `${art} ist kein Fussvolk`);
    assert.equal(nachher[art][1], vorher[art][1], `${art} gegen eine Einheit wie bisher`);
  }
  // Die Tabelle bleibt, wie sie ist - der Zuschlag gehoert dem Spieler.
  assert.equal(JSON.stringify(EINHEITEN.speerkaempfer.bonus), grund);
  assert.deepEqual(welt.bonusVon('a', 'speerkaempfer'), { ...EINHEITEN.speerkaempfer.bonus, gebaeude: 2 });
  assert.deepEqual(welt.bonusVon('a', 'riese'), { gebaeude: EINHEITEN.riese.bonus.gebaeude + 2 });
  assert.equal(welt.bonusVon('b', 'speerkaempfer'), EINHEITEN.speerkaempfer.bonus, 'Berts Speerkaempfer wie in den Daten');
  // Auf der Leitung: die Tafel der Kampfwerte traegt ihn, wo er sich aendert.
  assert.deepEqual(welt.kampfwerte('a').miliz.bonus, { gebaeude: 2 });
  assert.equal(welt.kampfwerte('a').ritter.bonus, undefined);
  assert.equal(welt.kampfwerte('b').miliz.bonus, undefined);
  assert.deepEqual(bringt(VERBESSERUNGEN.brandstiftung), ['Infanterie: +2 Angriff gegen Gebäude']);
});

/** Wie viele Takte eine Einheit fuer zehn Felder schraeg ueber den Platz braucht. */
function gang(art, verbesserung) {
  const { welt, anna, x0, y0 } = mitPlatz(3);
  if (verbesserung) welt.erforschen(anna, verbesserung);
  const einheit = welt.einheitAnlegen('a', x0, y0, art);
  assert.equal(welt.nachricht('a', { auftrag: 'befehl', einheiten: [einheit.id], ziel: { x: x0 + 10, y: y0 + 10 } })?.fehler, undefined);
  let takte = 0;
  while (einheit.weg && einheit.weg.length && takte < 3000) {
    welt.takten();
    takte += 1;
  }
  assert.deepEqual([Math.round(einheit.x), Math.round(einheit.y)], [x0 + 10, y0 + 10], `${art} angekommen`);
  return takte;
}

test('bauen AC-54: mit den Knappen ist das Fussvolk ein Zehntel schneller - auch die Einheiten der Haeuser, sonst niemand', () => {
  const { welt, anna } = mitPlatz(2);
  const vorher = Object.fromEntries(Object.keys(EINHEITEN).map((art) => [art, welt.einheitenwert('a', art, 'tempo')]));
  welt.erforschen(anna, 'knappen');
  const fussvolk = [];
  for (const art of Object.keys(EINHEITEN)) {
    const nachher = welt.einheitenwert('a', art, 'tempo');
    if (EINHEITEN[art].klassen.includes('infanterie')) {
      fussvolk.push(art);
      assert.ok(Math.abs(nachher / vorher[art] - 1.1) < 0.002, `${art}: ${vorher[art]} -> ${nachher}`);
    } else {
      assert.equal(nachher, vorher[art], `${art} bleibt`);
    }
    assert.equal(welt.einheitenwert('b', art, 'tempo'), EINHEITEN[art].tempo, `Berts ${art}`);
  }
  for (const art of ['miliz', 'speerkaempfer', 'soeldner', 'riese', 'meuchler', 'wiedergaenger']) assert.ok(fussvolk.includes(art), art);
  assert.deepEqual(bringt(VERBESSERUNGEN.knappen), ['Infanterie: +10 % Tempo']);
});

// Gemessen ueber zehn Felder schraeg, 2026-11-22: die Miliz 158 -> 143
// Takte, das 1,105-fache (einheiten AC-70). Bis dahin verfiel an jedem
// Wegpunkt der Rest des Takts, und dieselbe Messung ergab 160 -> 150, das
// 1,07-fache. Hier schraeg ueber den Platz.
test('bauen AC-54: derselbe Gang dauert mit den Knappen kuerzer - die Miliz und der Speerkaempfer, schraeg ueber den Platz', () => {
  for (const art of ['miliz', 'speerkaempfer']) {
    const ohne = gang(art, null);
    const mit = gang(art, 'knappen');
    const anteil = ohne / mit;
    assert.ok(anteil > 1.07 && anteil < 1.13, `${art}: ohne ${ohne} Takte, mit ${mit}: das ${anteil.toFixed(3)}-fache`);
  }
});

// ---- AC-55: vier Lehren des Klosters ----------------------------------------------

const BEKEHREN = EINHEITEN.moench.bekehren;

test('bauen AC-55: Heiligkeit und Inbrunst - der Moench hat 45 statt 30 Leben und geht 15 % schneller', () => {
  const { welt, anna, x0, y0 } = mitPlatz(2);
  const moench = welt.einheitAnlegen('a', x0 + 2, y0 + 2, 'moench');
  const berts = welt.einheitAnlegen('b', x0 + 8, y0 + 8, 'moench');
  assert.equal(EINHEITEN.moench.leben, 30);
  const tempoVorher = Object.fromEntries(Object.keys(EINHEITEN).map((art) => [art, welt.einheitenwert('a', art, 'tempo')]));
  welt.erforschen(anna, 'heiligkeit');
  assert.equal(welt.lebenMax('a', 'moench'), 45);
  assert.equal(moench.leben, 45, 'auch der, der schon steht');
  assert.equal(berts.leben, 30);
  welt.erforschen(anna, 'inbrunst');
  assert.equal(welt.einheitenwert('a', 'moench', 'tempo'), 0.805);
  assert.equal(welt.einheitenwert('b', 'moench', 'tempo'), EINHEITEN.moench.tempo);
  for (const art of Object.keys(EINHEITEN)) {
    if (art === 'moench') continue;
    assert.equal(welt.lebenMax('a', art), EINHEITEN[art].leben, `${art}: Leben`);
    assert.equal(welt.einheitenwert('a', art, 'tempo'), tempoVorher[art], `${art}: Tempo`);
  }
  assert.deepEqual(bringt(VERBESSERUNGEN.heiligkeit), ['Mönche: +15 Leben']);
  assert.deepEqual(bringt(VERBESSERUNGEN.inbrunst), ['Mönche: +15 % Tempo']);
});

/** Ein Moench und ein fremder Dorfbewohner elf Felder weiter: bekehrt er aus dem Stand? */
function ausElfFeldern(verbesserung) {
  const { welt, anna, x0, y0 } = mitPlatz(3);
  if (verbesserung) welt.erforschen(anna, verbesserung);
  const moench = welt.einheitAnlegen('a', x0, y0 + 5, 'moench');
  const bauer = welt.einheitAnlegen('b', x0 + 11, y0 + 5, 'dorfbewohner');
  welt.nachricht('a', { einheiten: [moench.id], ziel: { x: bauer.x, y: bauer.y } });
  assert.equal(moench.auftrag?.art, 'bekehren');
  let takte = 0;
  while (bauer.besitzer !== 'a' && takte < 40 * TAKTE_PRO_SEKUNDE) {
    welt.takten();
    takte += 1;
  }
  assert.equal(bauer.besitzer, 'a', 'bekehrt');
  return { welt, moench, gegangen: Math.hypot(moench.x - x0, moench.y - (y0 + 5)) };
}

test('bauen AC-55: mit dem Buchdruck bekehrt der Moench aus zwoelf statt neun Feldern - elf Felder weit bleibt er stehen', () => {
  assert.equal(BEKEHREN.reichweite, 9);
  const ohne = ausElfFeldern(null);
  assert.ok(ohne.gegangen >= 1.5, `ohne geht er erst heran: ${ohne.gegangen.toFixed(1)} Felder`);
  assert.equal(ohne.welt.bekehrwert('a', 'moench', 'reichweite'), 9);
  const mit = ausElfFeldern('buchdruck');
  assert.equal(mit.gegangen, 0, 'mit steht er still');
  assert.equal(mit.welt.bekehrwert('a', 'moench', 'reichweite'), 12);
  assert.equal(mit.welt.bekehrwert('b', 'moench', 'reichweite'), 9, 'Berts Moench wie bisher');
  assert.deepEqual(bringt(VERBESSERUNGEN.buchdruck), ['Mönche bekehren aus 12 statt 9 Feldern']);
});

test('bauen AC-55: mit der Erleuchtung ruht der Moench nach einer Bekehrung 41 statt 62 Sekunden', () => {
  assert.equal(BEKEHREN.ruhe, 62);
  const ohne = ausElfFeldern(null);
  assert.equal(ohne.moench.ruhtBis - ohne.welt.takt, 62 * TAKTE_PRO_SEKUNDE);
  const mit = ausElfFeldern('erleuchtung');
  assert.equal(mit.moench.ruhtBis - mit.welt.takt, 41 * TAKTE_PRO_SEKUNDE);
  assert.deepEqual(bringt(VERBESSERUNGEN.erleuchtung), ['Mönche ruhen nach einer Bekehrung 41 statt 62 Sekunden']);
});

test('bauen AC-55: was ein Moench kann, steht je Spieler in der Tafel der Kampfwerte - Reichweite und Ruhe', () => {
  const { welt, anna } = mitPlatz(3);
  assert.deepEqual(welt.kampfwerte('a').moench.bekehren, { reichweite: 9, ruhe: 62 });
  welt.erforschen(anna, 'buchdruck');
  welt.erforschen(anna, 'erleuchtung');
  assert.deepEqual(welt.kampfwerte('a').moench.bekehren, { reichweite: 12, ruhe: 41 });
  assert.deepEqual(welt.kampfwerte('b').moench.bekehren, { reichweite: 9, ruhe: 62 });
  assert.equal(welt.kampfwerte('a').miliz.bekehren, undefined, 'nur wer bekehrt');
  // Die Grundwerte im Aufbau bleiben die der Daten - der Browser legt die Tafel darueber.
  assert.deepEqual(welt.aufbauFuer('a').werte.einheiten.moench.bekehren, { reichweite: 9, ruhe: 62, nicht: BEKEHREN.nicht });
});

// ---- AC-56: Tretkran und Sappeure -------------------------------------------------

/** Takte, bis ein Dorfbewohner allein ein Haus gebaut hat. */
function hausbau(mitKran) {
  const { welt, anna, x0, y0 } = mitPlatz(2);
  if (mitKran) welt.erforschen(anna, 'tretkran');
  const baustelle = welt.gebaeudeAnlegen('a', 'haus', x0 + 5, y0 + 5, false);
  const bauer = welt.einheitAnlegen('a', x0 + 4, y0 + 5, 'dorfbewohner');
  welt.bauenBeginnen(bauer, baustelle);
  let takte = 0;
  while (!baustelle.fertig && takte < 5000) {
    welt.takten();
    takte += 1;
  }
  assert.ok(baustelle.fertig, 'gebaut');
  return takte;
}

/** Leben, die ein Dorfbewohner in zehn Sekunden an einer beschaedigten Kaserne repariert. */
function reparatur(mitKran) {
  const { welt, anna, x0, y0 } = mitPlatz(2);
  if (mitKran) welt.erforschen(anna, 'tretkran');
  const kaserne = welt.gebaeudeAnlegen('a', 'kaserne', x0 + 4, y0 + 4);
  kaserne.leben -= 600;
  const bauer = welt.einheitAnlegen('a', x0 + 3, y0 + 4, 'dorfbewohner');
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [bauer.id], ziel: { x: kaserne.x, y: kaserne.y } });
  for (let t = 0; t < 10 * TAKTE_PRO_SEKUNDE && !bauer.baut; t++) welt.takten();
  assert.ok(bauer.baut, 'er repariert');
  const vorher = kaserne.leben;
  sekunden(welt, 10);
  return kaserne.leben - vorher;
}

test('bauen AC-56: mit dem Tretkran bauen Dorfbewohner ein Fuenftel schneller - repariert wird wie bisher', () => {
  const ohne = hausbau(false);
  const mit = hausbau(true);
  const anteil = ohne / mit;
  assert.ok(anteil > 1.15 && anteil < 1.25, `ohne ${ohne} Takte, mit ${mit}: das ${anteil.toFixed(3)}-fache`);
  assert.equal(reparatur(true), reparatur(false), 'dieselben Leben in zehn Sekunden');
  const { welt, anna } = mitPlatz(2);
  assert.equal(welt.bautempo('a'), 1);
  welt.erforschen(anna, 'tretkran');
  assert.equal(welt.bautempo('a'), 1.2);
  assert.equal(welt.bautempo('b'), 1);
  assert.deepEqual(bringt(VERBESSERUNGEN.tretkran), ['Dorfbewohner bauen 20 % schneller']);
});

test('bauen AC-56: mit den Sappeuren schlagen Dorfbewohner Gebaeude mit 15 mehr - Einheiten wie bisher, und sonst niemand', () => {
  const { welt, anna, x0, y0 } = mitPlatz(3);
  const haus = welt.gebaeudeAnlegen('b', 'haus', x0 + 6, y0 + 6);
  const opfer = welt.einheitAnlegen('b', x0 + 9, y0 + 2, 'miliz');
  const bauer = welt.einheitAnlegen('a', x0 + 5, y0 + 6, 'dorfbewohner');
  const miliz = welt.einheitAnlegen('a', x0 + 5, y0 + 7, 'miliz');
  const berts = welt.einheitAnlegen('b', x0 + 2, y0 + 2, 'dorfbewohner');
  const vorher = { haus: welt.schaden(bauer, haus, true), opfer: welt.schaden(bauer, opfer, false), miliz: welt.schaden(miliz, haus, true), berts: welt.schaden(berts, haus, true) };
  welt.erforschen(anna, 'sappeure');
  assert.equal(welt.schaden(bauer, haus, true), vorher.haus + 15);
  assert.equal(welt.schaden(bauer, opfer, false), vorher.opfer, 'gegen eine Einheit wie bisher');
  assert.equal(welt.schaden(miliz, haus, true), vorher.miliz, 'die Miliz nicht');
  assert.equal(welt.schaden(berts, haus, true), vorher.berts, 'Berts Dorfbewohner nicht');
  assert.deepEqual(welt.kampfwerte('a').dorfbewohner.bonus, { gebaeude: 15 });
  assert.deepEqual(bringt(VERBESSERUNGEN.sappeure), ['Dorfbewohner: +15 Angriff gegen Gebäude']);
});

test('bauen AC-54, AC-56: Brandstiftung und Sappeure zusammen - jeder Zuschlag bei seinen Leuten, keiner doppelt', () => {
  const { welt, anna } = mitPlatz(3);
  welt.erforschen(anna, 'brandstiftung');
  const erste = welt.bonusVon('a', 'miliz');
  assert.equal(welt.bonusVon('a', 'miliz'), erste, 'gemerkt: dasselbe Objekt, solange sich nichts aendert');
  welt.erforschen(anna, 'sappeure');
  assert.deepEqual(welt.bonusVon('a', 'miliz'), { gebaeude: 2 });
  assert.deepEqual(welt.bonusVon('a', 'dorfbewohner'), { gebaeude: 15 });
  assert.deepEqual(welt.bonusVon('a', 'ramme'), EINHEITEN.ramme.bonus);
});
