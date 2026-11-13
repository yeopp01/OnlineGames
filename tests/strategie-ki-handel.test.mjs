// Die KI handelt mit Karren (ki AC-26): wird das Gold in Reichweite knapp,
// baut sie Maerkte weit auseinander, bildet Karren aus und schickt sie auf
// die Strecke - ueber `welt.nachricht`, wie ein Mensch.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE } = require('../server/spiele/strategie/daten.js');
const { Ki, GOLD_KNAPP, KARREN, HANDEL_MINDESTENS, HANDEL_VOR, PLATZ_RINGE } = require('../server/spiele/strategie/ki.js');
const { HANDEL } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const DREI = [...ZWEI, { id: 'c', name: 'Cora' }];

const eigene = (welt, id) => [...welt.einheiten.values()].filter((e) => e.besitzer === id && !e.tot);
const gebaeudeVon = (welt, id) => [...welt.gebaeude.values()].filter((g) => g.besitzer === id);
const dorf = (welt, id) => eigene(welt, id).filter((e) => e.art === 'dorfbewohner');

/** Jedes Goldfeld bis `weit` Felder um `basis` traegt nur noch 1 Gold - beim naechsten Hieb ist es leer. */
function goldLeeren(welt, basis, weit = 30) {
  const { karte } = welt;
  for (const [i] of karte.vorrat) {
    if (karte.felder[i] !== karten.GOLD) continue;
    const x = i % karte.groesse;
    const y = (i / karte.groesse) | 0;
    if (Math.hypot(x - basis.x, y - basis.y) <= weit) karte.vorrat.set(i, 1);
  }
}

/** Anna in der Ritterzeit, mit Vorrat, ihre KI, und was die KI sendet. */
function ritterzeit(spieler = ZWEI, einstellungen = {}) {
  const welt = new Welt(spieler, 7, { sicht: 'aufgedeckt', ...einstellungen });
  for (const s of welt.spieler) s.zeitalter = 2;
  const a = welt.spielerVon('a');
  Object.assign(a, { holz: 1000, nahrung: 1000, gold: 500, stein: 200 });
  const ki = new Ki(welt, 'a');
  const gesendet = [];
  const senden = ki.senden.bind(ki);
  ki.senden = (n) => { gesendet.push(n); return senden(n); };
  const pruefen = () => ki.handelPruefen(eigene(welt, 'a'), gebaeudeVon(welt, 'a'), dorf(welt, 'a'));
  return { welt, a, ki, gesendet, pruefen };
}

/** Ein fertiger Markt fuer `wer`, der erste freie Platz etwa `d` Felder von `um`. */
function marktBei(welt, wer, um, d) {
  const S = welt.karte.groesse;
  for (let w = 0; w < 360; w += 5) {
    const x = Math.round(um.x + d * Math.cos((w * Math.PI) / 180));
    const y = Math.round(um.y + d * Math.sin((w * Math.PI) / 180));
    if (x > 3 && y > 3 && x < S - 4 && y < S - 4 && welt.platzPruefen('markt', x, y)) return welt.gebaeudeAnlegen(wer, 'markt', x, y);
  }
  throw new Error(`kein Platz fuer einen Markt ${d} Felder entfernt`);
}

test('ki AC-26: solange in Reichweite genug Gold liegt, baut sie keinen Markt - und wird es knapp, einen am Dorf', () => {
  const { welt, a, ki, gesendet, pruefen } = ritterzeit();
  assert.ok(ki.goldInReichweite() >= GOLD_KNAPP, `zum Start liegt Gold genug: ${ki.goldInReichweite()}`);
  pruefen();
  assert.ok(!gesendet.some((n) => n.art === 'markt'), 'mit Gold kein Markt');
  assert.equal(ki.handelSeit, null);

  goldLeeren(welt, a.basis);
  pruefen();
  const bau = gesendet.find((n) => n.auftrag === 'bauen' && n.art === 'markt');
  assert.ok(bau, `ohne Gold ein Markt: ${JSON.stringify(gesendet)}`);
  assert.ok(Math.hypot(bau.ziel.x - a.basis.x, bau.ziel.y - a.basis.y) < 20, 'der erste steht am Dorf');
  assert.ok(ki.handelSeit !== null, 'einmal knapp, bleibt es knapp');

  // Gegenprobe: in der Feudalzeit nicht - Karren gibt es erst ab der Ritterzeit.
  const feudal = ritterzeit();
  feudal.a.zeitalter = 1;
  goldLeeren(feudal.welt, feudal.a.basis);
  feudal.pruefen();
  assert.ok(!feudal.gesendet.some((n) => n.art === 'markt'), 'in der Feudalzeit kein Markt fuer den Handel');
});

test('ki AC-26: steht ein Markt am Dorf, baut sie den zweiten weit davon - und nicht naeher am Gegner als den ersten', () => {
  const { welt, a, ki, gesendet, pruefen } = ritterzeit();
  goldLeeren(welt, a.basis);
  const heimat = marktBei(welt, 'a', a.basis, 8);
  pruefen();
  const bau = gesendet.find((n) => n.auftrag === 'bauen' && n.art === 'markt');
  assert.ok(bau, JSON.stringify(gesendet));
  const weit = Math.hypot(bau.ziel.x - heimat.x, bau.ziel.y - heimat.y);
  assert.ok(weit >= HANDEL_MINDESTENS, `der zweite ${weit.toFixed(1)} Felder vom ersten`);
  assert.ok(bau.einheiten.length >= 2, 'zwei bauen ihn - der Weg ist weit');
  // Weg vom Gegner: die Karren fahren nicht auf ihn zu. Gemessen: Annas Dorf
  // bei (60, 17), Berts bei (60, 103); der erste Markt bei (68, 17), 86
  // Felder von Bert, der zweite bei (17, 21) am Nordrand, 93 Felder - der
  // Weg zur Kartenmitte laege 50 Felder naeher an ihm.
  const b = welt.spielerVon('b').basis;
  const zumGegner = (p) => Math.hypot(p.x - b.x, p.y - b.y);
  assert.ok(zumGegner(bau.ziel) >= zumGegner(heimat),
    `gewaehlt ${JSON.stringify(bau.ziel)} (${zumGegner(bau.ziel).toFixed(0)} vom Gegner), Heimat ${zumGegner(heimat).toFixed(0)}`);
  // Und nicht noch einer, solange dieser im Bau ist.
  welt.gebaeudeAnlegen('a', 'markt', bau.ziel.x, bau.ziel.y).fertig = false;
  gesendet.length = 0;
  pruefen();
  assert.ok(!gesendet.some((n) => n.art === 'markt'), 'der zweite ist im Bau - kein dritter');
});

test('ki AC-26: fehlt das Holz fuer den Markt, legt sie es zurueck - das Militaer gibt es nicht aus', () => {
  // Beim Startwert 4 lag nach dem Ende des Goldes acht Minuten lang nie 175
  // Holz da: Militaer, Haeuser und Farmen nahmen jede Ladung (Runde 162).
  const bestellt = (marktFehlt) => {
    const { welt, a, ki, gesendet, pruefen } = ritterzeit();
    goldLeeren(welt, a.basis);
    Object.assign(a, { holz: 100 });
    pruefen();
    assert.equal(ki.marktFehlt, true, 'zu wenig Holz: der Markt fehlt');
    assert.equal(ki.ruecklage().holz, GEBAEUDE.markt.kosten.holz);
    if (!marktFehlt) ki.marktFehlt = false;
    // Eine Schiessanlage, 190 Holz, keine Nahrung: ein Bogenschuetze (25 Holz)
    // griffe die Ruecklage an.
    const s = welt.gebaeudeAnlegen('a', 'schiessanlage', a.basis.x + 8, a.basis.y + 8);
    Object.assign(a, { holz: GEBAEUDE.markt.kosten.holz + 15, nahrung: 0, gold: 500 });
    gesendet.length = 0;
    ki.militaerPruefen(gebaeudeVon(welt, 'a'), dorf(welt, 'a'));
    return gesendet.filter((n) => n.auftrag === 'ausbilden' && n.gebaeude === s.id);
  };
  assert.deepEqual(bestellt(true), [], 'mit Ruecklage kein Bogenschuetze');
  assert.ok(bestellt(false).length > 0, 'Gegenprobe: ohne Ruecklage einer');
});

test('ki AC-26: stehen zwei Maerkte zu nah beieinander, baut sie einen dritten weit weg - gefragt wird nach dem Ziel, nicht nach der Zahl', () => {
  // Durchsicht Runde 162: faellt die Heimat und steht der Ersatz am Dorf zu
  // nah am fernen Markt, stuenden zwei Maerkte ohne Strecke da.
  const { welt, a, gesendet, pruefen } = ritterzeit();
  goldLeeren(welt, a.basis);
  const heimat = marktBei(welt, 'a', a.basis, 8);
  marktBei(welt, 'a', heimat, HANDEL_MINDESTENS - 10);
  pruefen();
  const bau = gesendet.find((n) => n.auftrag === 'bauen' && n.art === 'markt');
  assert.ok(bau, `ein dritter: ${JSON.stringify(gesendet)}`);
  assert.ok(Math.hypot(bau.ziel.x - heimat.x, bau.ziel.y - heimat.y) >= HANDEL_MINDESTENS);
});

test('ki AC-26: fehlt fuer den Markt nur der Platz, legt sie kein Holz zurueck', () => {
  const { welt, a, ki, pruefen } = ritterzeit();
  goldLeeren(welt, a.basis);
  const heimat = marktBei(welt, 'a', a.basis, 8);
  ki.fernerMarktplatz = () => null;
  pruefen();
  assert.equal(ki.marktFehlt, false, 'Holz ist da, nur kein Platz - nichts zuruecklegen');
  assert.equal(ki.ruecklage().holz || 0, 0);
  // Gegenprobe: fehlt das Holz, liegt es zurueck - und gesucht wird gar nicht.
  let gesucht = 0;
  ki.fernerMarktplatz = () => { gesucht += 1; return null; };
  a.holz = 100;
  pruefen();
  assert.equal(ki.marktFehlt, true);
  assert.equal(gesucht, 0, 'ohne Holz keine Platzsuche');
  assert.ok(heimat.fertig);
});

test('ki AC-26: ein Karren, der keinen Weg fand, wird nicht in jeder Entscheidung neu geschickt', () => {
  const { welt, a, ki, gesendet, pruefen } = ritterzeit();
  goldLeeren(welt, a.basis);
  const heimat = marktBei(welt, 'a', a.basis, 8);
  marktBei(welt, 'a', heimat, 40);
  const k = welt.einheitAnlegen('a', heimat.x + 3, heimat.y, 'marktkarren');
  pruefen();
  assert.ok(gesendet.some((n) => n.auftrag === 'befehl' && n.einheiten.includes(k.id)));
  // Er steht wieder, als haette er keinen Weg gefunden.
  Object.assign(k, { auftrag: null, weg: [] });
  gesendet.length = 0;
  pruefen();
  assert.ok(!gesendet.some((n) => n.auftrag === 'befehl'), 'gleich danach kein neuer Befehl');
  for (let t = 0; t < 31 * TAKTE_PRO_SEKUNDE; t++) welt.takt += 1;
  Object.assign(k, { auftrag: null, weg: [] });
  pruefen();
  assert.ok(gesendet.some((n) => n.auftrag === 'befehl' && n.einheiten.includes(k.id)), 'nach 30 Sekunden wieder');
});

test('ki AC-26: mit zwei Maerkten bildet sie Karren aus und schickt jeden, der steht, auf die Strecke', () => {
  const { welt, a, ki, gesendet, pruefen } = ritterzeit();
  goldLeeren(welt, a.basis);
  const heimat = marktBei(welt, 'a', a.basis, 8);
  const ziel = marktBei(welt, 'a', heimat, 40);
  pruefen();
  assert.ok(gesendet.some((n) => n.auftrag === 'ausbilden' && n.gebaeude === heimat.id && n.einheit === 'marktkarren'), JSON.stringify(gesendet));
  const k = welt.einheitAnlegen('a', heimat.x + 3, heimat.y, 'marktkarren');
  pruefen();
  assert.equal(k.auftrag?.art, 'handel', 'der stehende Karren faehrt');
  assert.deepEqual([k.auftrag.heimat, k.auftrag.ziel], [heimat.id, ziel.id]);
  // Hoechstens KARREN, die in der Schlange mitgezaehlt.
  heimat.schlange = [];
  for (let i = eigene(welt, 'a').filter((e) => e.art === 'marktkarren').length; i < KARREN; i++) welt.einheitAnlegen('a', heimat.x + 3, heimat.y + 1, 'marktkarren');
  gesendet.length = 0;
  pruefen();
  assert.ok(!gesendet.some((n) => n.einheit === 'marktkarren'), `bei ${KARREN} Karren keiner mehr`);
});

/** So viele Karren, dass der Handel laeuft (`handelLaeuft`) - auf der Strecke, nicht in der Schlange. */
function karrenStellen(welt, heimat, n = HANDEL_VOR) {
  for (let i = 0; i < n; i++) welt.einheitAnlegen('a', heimat.x + 3 + (i % 4), heimat.y + 3 + Math.floor(i / 4), 'marktkarren');
}

test('ki AC-26: fehlt das Gold fuer den Karren, verkauft sie am Markt, was sie uebrig hat - zuerst den Stein', () => {
  const { welt, a, gesendet, pruefen } = ritterzeit();
  goldLeeren(welt, a.basis);
  const heimat = marktBei(welt, 'a', a.basis, 8);
  marktBei(welt, 'a', heimat, 40);
  karrenStellen(welt, heimat);
  Object.assign(a, { gold: 0, holz: 350, nahrung: 350, stein: 200 });
  pruefen();
  assert.ok(gesendet.some((n) => n.auftrag === 'handeln' && n.ware === 'stein' && n.richtung === 'verkaufen'), JSON.stringify(gesendet));
  assert.equal(a.stein, 100, 'einmal 100 Stein');
  // Der Erloes reicht fuer den Karren, und der ist gleich bestellt - bezahlt
  // aus dem Verkauf.
  assert.ok(gesendet.some((n) => n.einheit === 'marktkarren'), 'und gleich den Karren bestellt');
  assert.equal(heimat.schlange.at(-1), 'marktkarren');
  // Gegenprobe: was nur die Ruecklage ist, verkauft sie nicht.
  const knapp = ritterzeit();
  goldLeeren(knapp.welt, knapp.a.basis);
  const h = marktBei(knapp.welt, 'a', knapp.a.basis, 8);
  marktBei(knapp.welt, 'a', h, 40);
  karrenStellen(knapp.welt, h);
  Object.assign(knapp.a, { gold: 0, holz: 350, nahrung: 350, stein: 0 });
  knapp.pruefen();
  assert.ok(!knapp.gesendet.some((n) => n.auftrag === 'handeln'), JSON.stringify(knapp.gesendet));
});

test('ki AC-26: bis die ersten Karren fahren, liegt zurueck, was der naechste kostet - das Militaer gibt es nicht aus', () => {
  // Beim Startwert 14 ging beiden um Minute 60 das Gold aus; der Angreifer
  // hatte bis Minute 90 einen einzigen Karren, weil das Militaer jede Ladung
  // Holz nahm, und stand ohne Ramme vor einer Burg (gemessen 2026-11-13).
  const kosten = EINHEITEN.marktkarren.kosten;
  const bestellt = (karrenFehlt) => {
    const { welt, a, ki, gesendet, pruefen } = ritterzeit();
    goldLeeren(welt, a.basis);
    const heimat = marktBei(welt, 'a', a.basis, 8);
    marktBei(welt, 'a', heimat, 40);
    Object.assign(a, { holz: 50, nahrung: 0, gold: 0, stein: 0 });
    pruefen();
    assert.equal(ki.karrenFehlt, true, 'noch kein Karren: der Handel laeuft nicht');
    // Der Karren, und solange das Gold fehlt, die Ware fuer einen Verkauf.
    assert.deepEqual(ki.ruecklage(), { holz: kosten.holz + HANDEL.menge, gold: kosten.gold });
    if (!karrenFehlt) ki.karrenFehlt = false;
    // Eine Schiessanlage, Holz knapp ueber dem Preis des Karrens: ein
    // Schuetze griffe die Ruecklage an.
    const s = welt.gebaeudeAnlegen('a', 'schiessanlage', a.basis.x + 8, a.basis.y + 8);
    Object.assign(a, { holz: kosten.holz + 15, nahrung: 0, gold: 500 });
    gesendet.length = 0;
    ki.militaerPruefen(gebaeudeVon(welt, 'a'), dorf(welt, 'a'));
    return gesendet.filter((n) => n.auftrag === 'ausbilden' && n.gebaeude === s.id);
  };
  assert.deepEqual(bestellt(true), [], 'mit Ruecklage kein Schuetze');
  assert.ok(bestellt(false).length > 0, 'Gegenprobe: ohne Ruecklage einer');

  // Fahren genug, liegt fuer Karren nichts mehr zurueck.
  const { welt, a, ki, pruefen } = ritterzeit();
  goldLeeren(welt, a.basis);
  const heimat = marktBei(welt, 'a', a.basis, 8);
  marktBei(welt, 'a', heimat, 40);
  karrenStellen(welt, heimat);
  pruefen();
  assert.equal(ki.karrenFehlt, false);
  assert.deepEqual(ki.ruecklage(), {});
});

test('ki AC-26: fuer die ersten Karren verkauft sie bis auf deren Preis - auch Holz, das sonst liegen bliebe', () => {
  const kosten = EINHEITEN.marktkarren.kosten;
  const { welt, a, gesendet, pruefen } = ritterzeit();
  goldLeeren(welt, a.basis);
  const heimat = marktBei(welt, 'a', a.basis, 8);
  marktBei(welt, 'a', heimat, 40);
  // 250 Holz sind weniger als die Ruecklage von 300 - fuer den ersten
  // Karren verkauft sie trotzdem 100 davon und bestellt ihn aus dem Erloes.
  Object.assign(a, { gold: 0, holz: kosten.holz + HANDEL.menge + 50, nahrung: 0, stein: 0 });
  pruefen();
  assert.ok(gesendet.some((n) => n.auftrag === 'handeln' && n.ware === 'holz' && n.richtung === 'verkaufen'), JSON.stringify(gesendet));
  assert.equal(heimat.schlange.at(-1), 'marktkarren', 'und der Karren ist bestellt');
  // Gegenprobe: was der Karren selbst kostet, verkauft sie nicht.
  const knapp = ritterzeit();
  goldLeeren(knapp.welt, knapp.a.basis);
  const h = marktBei(knapp.welt, 'a', knapp.a.basis, 8);
  marktBei(knapp.welt, 'a', h, 40);
  Object.assign(knapp.a, { gold: 0, holz: kosten.holz + HANDEL.menge - 1, nahrung: 0, stein: 0 });
  knapp.pruefen();
  assert.ok(!knapp.gesendet.some((n) => n.auftrag === 'handeln'), JSON.stringify(knapp.gesendet));
});

test('ki AC-26: ist das Dorf zugebaut, sucht sie den Bauplatz dahinter', () => {
  // Beim Startwert 14 standen nach einer Stunde Haeuser, Farmen und Lager in
  // den ersten sechzehn Feldern um das Dorfzentrum dicht an dicht: von Minute
  // 56 bis 85 fand sie keinen Platz fuer den Markt (gemessen 2026-11-13).
  const { a, ki } = ritterzeit();
  const fern = (x, y) => Math.max(Math.abs(x - a.basis.x), Math.abs(y - a.basis.y));
  const randFrei = ki.randFrei.bind(ki);
  ki.randFrei = (x, y, n) => fern(x, y) >= 4 + PLATZ_RINGE && randFrei(x, y, n);
  assert.equal(ki.platzBei('markt', a.basis, 4), null, 'in den ersten Ringen ist nichts frei');
  const platz = ki.platzBeiBasis('markt');
  assert.ok(platz, 'dahinter findet sie einen');
  assert.ok(fern(platz.x, platz.y) >= 4 + PLATZ_RINGE, JSON.stringify(platz));
  // Und ist am Dorf Platz, bleibt sie dort.
  ki.randFrei = randFrei;
  const nah = ki.platzBeiBasis('markt');
  assert.ok(fern(nah.x, nah.y) < 4 + PLATZ_RINGE, JSON.stringify(nah));
});

test('ki AC-26: steht der Markt eines Verbuendeten weit genug, faehrt sie dorthin und baut keinen zweiten', () => {
  const { welt, a, gesendet, pruefen } = ritterzeit(DREI, { teams: { a: 1, b: 1, c: 2 } });
  goldLeeren(welt, a.basis);
  const heimat = marktBei(welt, 'a', a.basis, 8);
  const freund = marktBei(welt, 'b', heimat, 40);
  // Der Gegner hat einen Markt naeher dran - der ist kein Ziel.
  marktBei(welt, 'c', heimat, 30);
  const k = welt.einheitAnlegen('a', heimat.x + 3, heimat.y, 'marktkarren');
  pruefen();
  assert.ok(!gesendet.some((n) => n.art === 'markt'), 'kein eigener zweiter Markt');
  assert.equal(k.auftrag?.art, 'handel');
  assert.equal(k.auftrag.ziel, freund.id, 'zum Verbuendeten');
});

test('ki AC-26: ein Karren ist keine Kampfeinheit - er zieht nicht mit dem Heer und steht nicht Wache', () => {
  const { welt, a, ki } = ritterzeit();
  const karren = welt.einheitAnlegen('a', a.basis.x + 5, a.basis.y, 'marktkarren');
  const ritter = welt.einheitAnlegen('a', a.basis.x + 5, a.basis.y + 1, 'ritter');
  assert.equal(ki.kaempft(karren), false);
  assert.equal(ki.kaempft(ritter), true);
  // Zum Start steht ein Spaeherreiter da - gezaehlt wird der Unterschied.
  const vorher = ki.kampfeinheitenVon('a');
  for (let i = 0; i < 12; i++) welt.einheitAnlegen('a', a.basis.x + 6, a.basis.y + (i % 4), 'marktkarren');
  assert.equal(ki.kampfeinheitenVon('a'), vorher, 'zwoelf Karren mehr, keine Kampfeinheit mehr');
  ki.heerPruefen(eigene(welt, 'a'));
  assert.ok(![...ki.heer].some((id) => welt.einheiten.get(id).art === 'marktkarren'), 'kein Karren im Heer');
});

// Was der Handel ueber ganze Partien bringt, misst `tests/partien/ki-handel.test.mjs`.
