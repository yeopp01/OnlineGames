// Vorraete ansehen (→ specs/10-strategie/bedienung.md AC-63) - Rechenteile,
// direkt geprueft (→ docs/adr/0004-teststrategie.md). Den Weg vom Klick bis
// zur Zeile unten prueft e2e/tests/strategie-ansehen.spec.mjs.
//
// Rueckmeldung des Benutzers: "Auf Baum, Holz, Schafe, etc. kann man nicht
// draufklicken um zu sehen, wie viel noch da ist". Die Mengen der Vorraete
// gingen bisher nie hinaus - der Browser kennt nur Viertel (darstellung
// AC-3). Wer einen ansieht, bekommt dessen Rest, und nur er.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt } = require('../server/spiele/strategie/welt.js');
const { SAMMELN, TIERE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

function feldVon(welt, index) {
  const g = welt.karte.groesse;
  return { x: index % g, y: Math.floor(index / g) };
}

// Der erste Vorrat dieser Art, den `passt` gelten laesst.
function vorrat(welt, art, passt = () => true) {
  for (const index of welt.karte.vorrat.keys()) {
    if (welt.karte.felder[index] === art && passt(feldVon(welt, index))) return index;
  }
  throw new Error(`kein Vorrat der Art ${art}`);
}

const fuer = (welt, wer) => welt.zustandJeSpieler(['a', 'b']).get(wer);

test('bedienung AC-63: wer einen Vorrat ansieht, bekommt dessen Rest - in jedem Zustand, nur er, und nicht mehr, sobald er wegsieht', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const baum = vorrat(welt, karten.WALD);
  assert.equal(fuer(welt, 'a').av, undefined, 'ungefragt geht kein Rest hinaus');

  assert.deepEqual(welt.nachricht('a', { auftrag: 'ansehen', feld: feldVon(welt, baum) }), {});
  assert.deepEqual(fuer(welt, 'a').av, [baum, karten.VORRAT[karten.WALD]]);
  assert.equal(fuer(welt, 'b').av, undefined, 'Bert hat nicht gefragt');

  // Die Zahl laeuft mit: jeder Zustand nennt den Stand von jetzt.
  welt.karte.vorrat.set(baum, 37);
  welt.takten();
  assert.deepEqual(fuer(welt, 'a').av, [baum, 37]);
  assert.deepEqual(fuer(welt, 'a').av, [baum, 37], 'auch im naechsten');

  // Etwas anderes ansehen: nur noch das.
  const gold = vorrat(welt, karten.GOLD);
  welt.nachricht('a', { auftrag: 'ansehen', feld: feldVon(welt, gold) });
  assert.deepEqual(fuer(welt, 'a').av, [gold, karten.VORRAT[karten.GOLD]]);

  // Nichts mehr ansehen: ohne Feld.
  welt.nachricht('a', { auftrag: 'ansehen' });
  assert.equal(fuer(welt, 'a').av, undefined);

  // Beide zugleich, jeder seins.
  welt.nachricht('a', { auftrag: 'ansehen', feld: feldVon(welt, baum) });
  welt.nachricht('b', { auftrag: 'ansehen', feld: feldVon(welt, gold) });
  const beide = welt.zustandJeSpieler(['a', 'b']);
  assert.deepEqual(beide.get('a').av, [baum, 37]);
  assert.deepEqual(beide.get('b').av, [gold, karten.VORRAT[karten.GOLD]]);
});

test('bedienung AC-63: ansehen aendert nichts in der Welt - und Unsinn als Feld heisst: nichts mehr ansehen', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const baum = vorrat(welt, karten.WALD);
  const vorher = JSON.stringify([[...welt.karte.vorrat], [...welt.einheiten.values()].map((e) => [e.id, e.x, e.y, e.auftrag])]);
  const g = welt.karte.groesse;
  for (const feld of [null, undefined, {}, { x: -1, y: 3 }, { x: 3, y: g }, { x: 1.5, y: 2 }, { x: '3', y: '4' }, 'baum', 7]) {
    welt.nachricht('a', { auftrag: 'ansehen', feld: feldVon(welt, baum) });
    assert.ok(fuer(welt, 'a').av, 'erst sieht sie den Baum an');
    assert.doesNotThrow(() => welt.nachricht('a', { auftrag: 'ansehen', feld }), JSON.stringify(feld));
    assert.equal(fuer(welt, 'a').av, undefined, JSON.stringify(feld));
  }
  // Ein Feld ohne Vorrat: nichts zu nennen.
  const gras = welt.karte.felder.findIndex((art) => art === karten.GRAS);
  welt.nachricht('a', { auftrag: 'ansehen', feld: feldVon(welt, gras) });
  assert.equal(fuer(welt, 'a').av, undefined);
  // Wer nicht mitspielt, bekommt eine Absage.
  assert.ok(welt.nachricht('niemand', { auftrag: 'ansehen', feld: feldVon(welt, baum) }).fehler);
  assert.equal(JSON.stringify([[...welt.karte.vorrat], [...welt.einheiten.values()].map((e) => [e.id, e.x, e.y, e.auftrag])]), vorher);
});

test('bedienung AC-63: ist der Vorrat aufgebraucht, nennt der Server nichts mehr - auch nicht, wenn dort spaeter wieder etwas steht', () => {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const baum = vorrat(welt, karten.WALD);
  welt.nachricht('a', { auftrag: 'ansehen', feld: feldVon(welt, baum) });
  welt.karte.vorrat.set(baum, 1);
  assert.deepEqual(fuer(welt, 'a').av, [baum, 1]);
  welt.karte.vorrat.delete(baum);
  welt.karte.felder[baum] = karten.GRAS;
  assert.equal(fuer(welt, 'a').av, undefined);
  welt.karte.vorrat.set(baum, 50);
  assert.equal(fuer(welt, 'a').av, undefined, 'sie sieht nichts mehr an');
});

test('bedienung AC-63: im Nebel nennt der Server den Rest nur dem, der das Feld sieht - der Gegner liest nicht mit, wie weit ein Wald geschlagen ist', () => {
  const welt = new Welt(ZWEI, 4711);
  welt.sichtAktualisieren();
  // Ein Baum weit weg von allem, was Anna hat, mit einem Platz daneben.
  const annas = [...welt.einheiten.values(), ...welt.gebaeude.values()].filter((d) => d.besitzer === 'a');
  let platz = null;
  const baum = vorrat(welt, karten.WALD, (f) => {
    if (!annas.every((d) => Math.hypot(d.x - f.x, d.y - f.y) > 25)) return false;
    platz = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: f.x + dx, y: f.y + dy }))
      .find((n) => karten.begehbar(welt.karte, n.x, n.y)) || null;
    return Boolean(platz);
  });
  const feld = feldVon(welt, baum);
  assert.equal(welt.sieht('a', feld.x, feld.y), false);

  welt.nachricht('a', { auftrag: 'ansehen', feld });
  assert.equal(fuer(welt, 'a').av, undefined, 'im Nebel: kein Rest');

  // Jemand von ihr steht daneben: jetzt sieht sie ihn.
  const bauer = welt.einheitAnlegen('a', platz.x, platz.y, 'dorfbewohner');
  welt.sichtAktualisieren();
  assert.equal(welt.sieht('a', feld.x, feld.y), true);
  assert.deepEqual(fuer(welt, 'a').av, [baum, karten.VORRAT[karten.WALD]]);
  // Bert fragt nach demselben Baum und sieht ihn nicht.
  welt.nachricht('b', { auftrag: 'ansehen', feld });
  assert.equal(fuer(welt, 'b').av, undefined);

  // Der Dorfbewohner geht: der Rest bleibt aus, bis sie wieder hinsieht.
  const heim = welt.spielerVon('a').basis;
  bauer.x = heim.x;
  bauer.y = heim.y + 3;
  welt.sichtAktualisieren();
  assert.equal(welt.sieht('a', feld.x, feld.y), false);
  welt.karte.vorrat.set(baum, 12);
  assert.equal(fuer(welt, 'a').av, undefined);
  bauer.x = platz.x;
  bauer.y = platz.y;
  welt.sichtAktualisieren();
  assert.deepEqual(fuer(welt, 'a').av, [baum, 12], 'sie hat nicht noch einmal fragen muessen');
});

test('bedienung AC-63: der Aufbau nennt, wie voll ein Vorrat anfangs ist und was er gibt - und die Nahrung eines Schafs', () => {
  const welt = new Welt(ZWEI, 4711);
  const { werte } = welt.aufbau();
  assert.deepEqual(Object.keys(werte.vorrat).map(Number).sort(), [karten.WALD, karten.BEERE, karten.GOLD, karten.STEIN].sort());
  for (const [art, eintrag] of Object.entries(werte.vorrat)) {
    assert.equal(eintrag.voll, karten.VORRAT[art], art);
    assert.equal(eintrag.rohstoff, SAMMELN[art].rohstoff, art);
    assert.ok(eintrag.voll > 0);
  }
  assert.equal(werte.vorrat[karten.WALD].rohstoff, 'holz');
  assert.equal(werte.vorrat[karten.GOLD].voll, 800);
  assert.equal(werte.tiere.schaf.nahrung, TIERE.schaf.nahrung);
  // Jeder Vorrat der Karte beginnt mit genau dieser Menge.
  for (const [index, rest] of welt.karte.vorrat) assert.equal(rest, werte.vorrat[welt.karte.felder[index]].voll);
});

test('bedienung AC-63: ein Tier traegt seine Nahrung auf der Leitung - lebend voll, erlegt, was noch daran ist', () => {
  const welt = new Welt(ZWEI, 4711);
  const { tiere } = welt.aufbau();
  assert.ok(tiere.length > 0);
  for (const tier of tiere) {
    assert.equal(tier.n, TIERE.schaf.nahrung);
    assert.equal(Boolean(tier.g), false);
  }
  const schaf = [...welt.tiere.values()][0];
  schaf.geschlachtet = true;
  schaf.nahrung = 41;
  assert.deepEqual({ n: welt.tierFuerDraht(schaf.id).n, g: welt.tierFuerDraht(schaf.id).g }, { n: 41, g: true });
});
