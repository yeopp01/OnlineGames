// Buendnisse (spielziel AC-14, ADR-0013) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md). Teams kommen als Einstellung der Welt,
// wie sie spaeter der Warteraum schickt (spielauswahl AC-22).
//
// Jeder Test stellt dieselbe Lage zweimal auf: einmal gegen Carla, die mit
// Anna im Team ist, einmal gegen Bert, ihren Gegner. Nur so zeigt er, dass
// das Team die Ursache ist - und nicht, dass die Regel gar nicht greift.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE, KUENDIGUNG_SEKUNDEN } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN } = require('../server/spiele/strategie/daten.js');
const { Ki, FEIND_FERN } = require('../server/spiele/strategie/ki.js');

const DREI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }, { id: 'c', name: 'Carla' }];
// Anna und Carla gegen Bert.
const TEAMS = { a: 1, b: 2, c: 1 };

const sekunden = (welt, s) => { for (let t = 0; t < s * TAKTE_PRO_SEKUNDE; t++) welt.takten(); };

/**
 * Eine Welt zu dritt mit Teams und ein freier Platz von elf mal elf Feldern
 * in der Kartenmitte, weit weg von allen Doerfern. Anna in der Ritterzeit,
 * damit jede Art zur Hand ist. Frei heisst, was `platzPruefen` sagt.
 */
function mitPlatz(teams = TEAMS, sicht = 'aufgedeckt') {
  const welt = new Welt(DREI, 7, { sicht, teams });
  const anna = welt.spielerVon('a');
  anna.zeitalter = 2;
  const mitte = Math.floor(welt.karte.groesse / 2);
  for (let r = 0; r < 40; r++) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r], [r, r], [-r, r], [r, -r], [-r, -r]]) {
      const x0 = mitte + dx;
      const y0 = mitte + dy;
      let frei = true;
      for (let y = y0; y < y0 + 11 && frei; y++) {
        for (let x = x0; x < x0 + 11 && frei; x++) frei = welt.platzPruefen('haus', x, y) && welt.platzPruefen('haus', x + 1, y + 1);
      }
      if (frei && ![...welt.einheiten.values()].some((e) => e.x >= x0 - 9 && e.x <= x0 + 20 && e.y >= y0 - 9 && e.y <= y0 + 20)) {
        return { welt, x0, y0 };
      }
    }
  }
  throw new Error('kein freier Platz');
}

function stellen(welt, besitzer, art, x, y, leben = null) {
  const e = welt.einheitAnlegen(besitzer, Math.round(x), Math.round(y), art);
  e.x = x;
  e.y = y;
  if (leben !== null) e.leben = leben;
  return e;
}

test('spielziel AC-14: Teams kommen aus den Einstellungen - niemand ist sein eigener Gegner, im selben Team keiner dem anderen', () => {
  const welt = new Welt(DREI, 7, { teams: TEAMS });
  assert.equal(welt.feindlich('a', 'a'), false);
  assert.equal(welt.feindlich('a', 'c'), false, 'Anna und Carla sind verbuendet');
  assert.equal(welt.feindlich('c', 'a'), false, 'in beide Richtungen');
  assert.equal(welt.feindlich('a', 'b'), true);
  assert.equal(welt.feindlich('b', 'c'), true);
  assert.equal(welt.spielerVon('c').team, 1);
});

test('spielziel AC-14: ohne Teams ist jeder andere ein Gegner, wie bis Runde 145 - ebenso, wer kein gueltiges Team hat', () => {
  const ohne = new Welt(DREI, 7);
  assert.equal(ohne.feindlich('a', 'c'), true);
  assert.equal(ohne.feindlich('a', 'a'), false);
  // Nur 1 bis 4 ist ein Team. Zwei ohne Team sind sich nicht verbuendet,
  // auch wenn bei beiden "kein Team" steht.
  const falsch = new Welt(DREI, 7, { teams: { a: 0, b: 'x', c: 5 } });
  for (const s of falsch.spieler) assert.equal(s.team, null, s.id);
  assert.equal(falsch.feindlich('a', 'c'), true);
  const halb = new Welt(DREI, 7, { teams: { a: 1 } });
  assert.equal(halb.feindlich('a', 'b'), true);
  assert.equal(halb.feindlich('b', 'c'), true, 'beide ohne Team: Gegner');
});

test('spielziel AC-14: ein Rechtsklick auf die Einheit eines Verbuendeten ist ein Gang dorthin, auf die eines Gegners ein Angriff', () => {
  const { welt, x0, y0 } = mitPlatz();
  const miliz = stellen(welt, 'a', 'miliz', x0, y0 + 5);
  const carla = stellen(welt, 'c', 'dorfbewohner', x0 + 6, y0 + 5);
  welt.befehl('a', [miliz.id], { x: carla.x, y: carla.y });
  assert.notEqual(miliz.auftrag?.art, 'angreifen', 'Carla ist keine Feindin');
  assert.ok(miliz.weg.length > 0, 'die Miliz geht hin');
  sekunden(welt, 8);
  assert.equal(carla.leben, EINHEITEN.dorfbewohner.leben, 'und schlaegt nicht zu');

  const zweite = mitPlatz();
  const miliz2 = stellen(zweite.welt, 'a', 'miliz', zweite.x0, zweite.y0 + 5);
  const bert = stellen(zweite.welt, 'b', 'dorfbewohner', zweite.x0 + 6, zweite.y0 + 5);
  zweite.welt.befehl('a', [miliz2.id], { x: bert.x, y: bert.y });
  assert.equal(miliz2.auftrag?.art, 'angreifen', 'derselbe Klick auf Bert greift an');
});

test('spielziel AC-14: ein Rechtsklick auf das Gebaeude eines Verbuendeten greift es nicht an', () => {
  const { welt, x0, y0 } = mitPlatz();
  const miliz = stellen(welt, 'a', 'miliz', x0, y0 + 5);
  const haus = welt.gebaeudeAnlegen('c', 'haus', x0 + 6, y0 + 5, true);
  welt.befehl('a', [miliz.id], { x: haus.x, y: haus.y });
  assert.notEqual(miliz.auftrag?.art, 'angreifen');
  sekunden(welt, 8);
  assert.equal(haus.leben, welt.gebaeudewert('c', 'haus', 'leben'), 'das Haus ist heil');

  const zweite = mitPlatz();
  const miliz2 = stellen(zweite.welt, 'a', 'miliz', zweite.x0, zweite.y0 + 5);
  const haus2 = zweite.welt.gebaeudeAnlegen('b', 'haus', zweite.x0 + 6, zweite.y0 + 5, true);
  zweite.welt.befehl('a', [miliz2.id], { x: haus2.x, y: haus2.y });
  assert.equal(miliz2.auftrag?.art, 'angreifen', 'Berts Haus wird angegriffen');
});

test('spielziel AC-14: eine Wache laesst Verbuendete in Ruhe und greift Gegner an', () => {
  const { welt, x0, y0 } = mitPlatz();
  const wache = stellen(welt, 'a', 'miliz', x0 + 2, y0 + 5);
  const carla = stellen(welt, 'c', 'miliz', x0 + 5, y0 + 5);
  sekunden(welt, 5);
  assert.equal(wache.auftrag, null, 'keine Wache greift Carla an');
  assert.equal(carla.auftrag, null, 'und Carlas Miliz nicht Anna');
  assert.equal(carla.leben, EINHEITEN.miliz.leben);

  const zweite = mitPlatz();
  const wache2 = stellen(zweite.welt, 'a', 'miliz', zweite.x0 + 2, zweite.y0 + 5);
  stellen(zweite.welt, 'b', 'miliz', zweite.x0 + 5, zweite.y0 + 5);
  sekunden(zweite.welt, 1);
  assert.equal(wache2.auftrag?.art, 'angreifen', 'Bert in derselben Lage wird angegriffen');
});

test('spielziel AC-14: ein Turm schiesst nicht auf Verbuendete, wohl aber auf Gegner daneben', () => {
  const { welt, x0, y0 } = mitPlatz();
  welt.gebaeudeAnlegen('a', 'wachturm', x0 + 1, y0 + 5, true);
  const carla = stellen(welt, 'c', 'dorfbewohner', x0 + 4, y0 + 5);
  sekunden(welt, 6);
  assert.equal(carla.leben, EINHEITEN.dorfbewohner.leben, 'Carla bleibt heil');
  const bert = stellen(welt, 'b', 'dorfbewohner', x0 + 4, y0 + 6);
  sekunden(welt, 1);
  assert.ok(bert.leben < EINHEITEN.dorfbewohner.leben, 'Bert daneben wird getroffen');
  assert.equal(carla.leben, EINHEITEN.dorfbewohner.leben);
});

test('spielziel AC-14: das Tor eines Verbuendeten oeffnet sich, das eines Gegners nicht', () => {
  // Carlas Mauerring mit einem Tor oben, darin ein Feld; Anna und Bert
  // stehen draussen und wollen hinein.
  const { welt, x0, y0 } = mitPlatz();
  for (let i = 2; i <= 8; i++) {
    for (const [x, y] of [[x0 + i, y0 + 2], [x0 + i, y0 + 8], [x0 + 2, y0 + i], [x0 + 8, y0 + i]]) {
      if (x === x0 + 5 && y === y0 + 2) continue;
      if (!welt.gebaeudeAn(x, y)) welt.gebaeudeAnlegen('c', 'steinmauer', x, y, true);
    }
  }
  welt.gebaeudeAnlegen('c', 'tor', x0 + 5, y0 + 2, true);
  const innen = { x: x0 + 5, y: y0 + 5 };
  const anna = stellen(welt, 'a', 'dorfbewohner', x0 + 5, y0);
  const bert = stellen(welt, 'b', 'dorfbewohner', x0 + 4, y0);
  welt.befehl('a', [anna.id], innen);
  welt.befehl('b', [bert.id], innen);
  assert.ok(anna.weg.length > 0, 'Anna hat einen Weg durch Carlas Tor');
  assert.deepEqual(bert.weg, [], 'Bert nicht');
  assert.ok(welt.toreVon('c').size === 1, 'Carlas eigene Liste bleibt ihre');
  sekunden(welt, 10);
  assert.ok(Math.hypot(anna.x - innen.x, anna.y - innen.y) < 1.5, 'Anna steht drinnen');
});

test('spielziel AC-14: ein Moench bekehrt keinen Verbuendeten', () => {
  const { welt, x0, y0 } = mitPlatz();
  const moench = stellen(welt, 'a', 'moench', x0, y0 + 5);
  const carla = stellen(welt, 'c', 'miliz', x0 + 4, y0 + 5);
  const bert = stellen(welt, 'b', 'miliz', x0 + 4, y0 + 7);
  assert.equal(welt.kannBekehren(moench, carla), false);
  assert.equal(welt.kannBekehren(moench, bert), true, 'Bert schon');
  welt.befehl('a', [moench.id], { x: carla.x, y: carla.y });
  assert.notEqual(moench.auftrag?.art, 'bekehren');
});

test('spielziel AC-14: ein Stein trifft Verbuendete wie eigene, und getroffen schlaegt keiner gegen den Werfer zurueck', () => {
  const { welt, x0, y0 } = mitPlatz();
  const mangonel = stellen(welt, 'a', 'mangonel', x0 + 1, y0 + 5);
  const ziel = stellen(welt, 'b', 'dorfbewohner', x0 + 7, y0 + 5, 1000);
  // Am Rand des Einschlags, ein Feld neben dem Ziel.
  const carla = stellen(welt, 'c', 'dorfbewohner', x0 + 7, y0 + 6, 1000);
  welt.befehl('a', [mangonel.id], { x: ziel.x, y: ziel.y });
  sekunden(welt, 2);
  assert.ok(ziel.leben < 1000, 'der Stein ist eingeschlagen');
  assert.ok(carla.leben < 1000, 'Carla ist getroffen - der Stein fragt nicht, wem sie gehoert');
  assert.notEqual(carla.auftrag?.art, 'angreifen', 'sie wehrt sich nicht gegen Anna');
  assert.equal(welt.spielerVon('c').angriff, undefined, 'und Carla bekommt keine Angriffsmeldung');
});

// ---- Gemeinsame Sicht (spielziel AC-19, Runde 149) --------------------------

test('spielziel AC-19: was Carla sieht, sieht Anna - Bert nicht, und ohne Teams auch Anna nicht', () => {
  for (const [teams, annaSieht] of [[TEAMS, true], [{}, false]]) {
    const { welt, x0, y0 } = mitPlatz(teams, 'nebel');
    // Ein Spaeher Carlas mitten auf dem freien Platz, weit weg von allen
    // Doerfern: dort sieht ihn sonst niemand.
    const ort = { x: x0 + 5, y: y0 + 5 };
    for (const id of ['a', 'b', 'c']) assert.equal(welt.sieht(id, ort.x, ort.y), false, `${id} sieht den Platz vorher nicht`);
    const spaeher = stellen(welt, 'c', 'spaeherreiter', ort.x, ort.y);
    welt.sichtAktualisieren();
    assert.equal(welt.sieht('c', ort.x, ort.y), true, 'Carla sieht ihren Platz');
    assert.equal(welt.sieht('a', ort.x, ort.y), annaSieht, annaSieht ? 'Anna, ihre Verbuendete, ebenso' : 'ohne Teams sieht Anna nichts');
    assert.equal(welt.sieht('b', ort.x, ort.y), false, 'Bert, ihr Gegner, nicht');
    // Erkundet bleibt es fuer das ganze Team, auch wenn der Spaeher geht.
    spaeher.x = x0 + 30;
    welt.sichtAktualisieren();
    assert.equal(welt.sieht('a', ort.x, ort.y), false, 'gesehen nur, solange jemand dort ist');
    assert.equal(welt.erkundet('a', ort.x, ort.y), annaSieht, 'erkundet bleibt es');
    assert.equal(welt.erkundet('b', ort.x, ort.y), false);
  }
});

test('spielziel AC-19: der Server schickt Anna, was Carla sieht - Einheiten, Gebaeude und Felder (kampf AC-13)', () => {
  const { welt, x0, y0 } = mitPlatz(TEAMS, 'nebel');
  // Bert hat auf dem freien Platz einen Mann und ein Haus stehen.
  const fremder = stellen(welt, 'b', 'miliz', x0 + 6, y0 + 5);
  const haus = welt.gebaeudeAnlegen('b', 'haus', x0 + 8, y0 + 8);
  welt.sichtAktualisieren();
  const bekommt = (id) => {
    const z = welt.zustandJeSpieler([id]).get(id);
    return { einheiten: new Set(z.einheiten.map((e) => e.i)), gebaeude: new Set((z.gebaeude || []).map((g) => g.i)) };
  };
  for (const id of ['a', 'b', 'c']) welt.aufbauFuer(id);
  assert.equal(bekommt('a').einheiten.has(fremder.id), false, 'vorher sieht ihn Anna nicht');
  assert.ok(!welt.aufbauFuer('a').gebaeude.some((g) => g.i === haus.id), 'und das Haus nicht');

  // Carlas Spaeher kommt dazu: jetzt bekommt Anna, was er sieht.
  const spaeher = stellen(welt, 'c', 'spaeherreiter', x0 + 4, y0 + 5);
  welt.sichtAktualisieren();
  const anna = bekommt('a');
  assert.ok(anna.einheiten.has(fremder.id), 'Berts Mann kommt bei Anna an');
  assert.ok(anna.einheiten.has(spaeher.id), 'und Carlas Spaeher');
  assert.ok(anna.gebaeude.has(haus.id), 'Berts Haus auch');
  assert.ok(welt.aufbauFuer('a').gebaeude.some((g) => g.i === haus.id), 'ebenso im Aufbau nach einer Rueckkehr');
  // Ein Baum, den Carlas Spaeher fallen sieht - wie im eigenen Dorf.
  const i = (y0 + 4) * welt.karte.groesse + x0 + 4;
  const feld = { i, a: 'gras' };
  assert.deepEqual(welt.felderFuer('a', [feld]), [feld], 'eine Feldaenderung in Carlas Sicht kommt sofort');

  // Carlas Dorf steht weit weg von Annas - sie bekommt es trotzdem, samt
  // seinen Einheiten: wer verbuendet ist, steht immer im Bild.
  const carlasZentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'c' && g.art === 'dorfzentrum');
  assert.ok(welt.aufbauFuer('a').gebaeude.some((g) => g.i === carlasZentrum.id), 'Carlas Dorfzentrum im Aufbau');
  const carlas = [...welt.einheiten.values()].filter((e) => e.besitzer === 'c').map((e) => e.id);
  for (const id of carlas) assert.ok(bekommt('a').einheiten.has(id), 'jede Einheit Carlas');
  // Bert bekommt davon nichts: er sieht weder Carlas Dorf noch ihren Spaeher.
  assert.ok(!welt.aufbauFuer('b').gebaeude.some((g) => g.i === carlasZentrum.id), 'Bert nicht');
});

test('spielziel AC-19: faellt ein Gebaeude der Verbuendeten, erfaehrt Anna es sofort - nicht erst beim Hinsehen', () => {
  const { welt, x0, y0 } = mitPlatz(TEAMS, 'nebel');
  const haus = welt.gebaeudeAnlegen('c', 'haus', x0 + 5, y0 + 5);
  welt.sichtAktualisieren();
  welt.aufbauFuer('a');
  welt.zustandJeSpieler(['a']);
  assert.ok(welt.aufbauFuer('a').gebaeude.some((g) => g.i === haus.id), 'Anna kennt Carlas Haus');
  welt.zustandJeSpieler(['a']);
  // Das Haus faellt; danach sieht niemand des Teams mehr hin. Bei einem
  // Gegner bliebe es in Annas Erinnerung stehen (kampf AC-12) - bei Carla
  // kommt das Verschwinden mit dem naechsten Zustand.
  welt.gebaeudeZerstoeren(haus);
  welt.sichtAktualisieren();
  assert.equal(welt.sieht('a', x0 + 5, y0 + 5), false, 'den Platz sieht jetzt keiner');
  const z = welt.zustandJeSpieler(['a']).get('a');
  assert.ok((z.gebaeude || []).some((g) => g.i === haus.id && g.weg), 'das Verschwinden kommt an');
});

// ---- Ein Team gewinnt (spielziel AC-20, Runde 150) --------------------------

/** Alles wegnehmen, was diesem Spieler gehoert - wie ein verlorener Kampf. */
function allesVerlieren(welt, id) {
  for (const e of welt.einheiten.values()) if (e.besitzer === id && !e.tot) welt.einheitSterben(e);
  for (const g of [...welt.gebaeude.values()]) if (g.besitzer === id) welt.gebaeudeZerstoeren(g);
  welt.takten();
}

test('spielziel AC-20: bleiben nur Verbuendete, gewinnt ihr Team - auch wer daraus schon ausgeschieden ist', () => {
  const welt = new Welt(DREI, 7, { sicht: 'aufgedeckt', teams: TEAMS });
  // Carla faellt zuerst: Anna und Bert sind noch Gegner, es geht weiter.
  allesVerlieren(welt, 'c');
  assert.equal(welt.spielerVon('c').aus, true);
  assert.equal(welt.ende, null, 'Anna gegen Bert - nicht entschieden');
  // Bert faellt: uebrig ist nur noch Team 1.
  allesVerlieren(welt, 'b');
  assert.ok(welt.ende, 'entschieden');
  assert.equal(welt.ende.grund, 'eroberung');
  assert.equal(welt.ende.team, 1);
  assert.deepEqual([...welt.ende.gewinner].sort(), ['a', 'c'], 'Anna und Carla - Carla war schon draussen');
  assert.equal(welt.ende.sieger, null, 'nicht einer allein');
  // Die Tafel nennt jeden, auch den ausgeschiedenen Gewinner als draussen.
  assert.equal(welt.ende.tafel.find((z) => z.id === 'c').aus, 1);
});

test('spielziel AC-20: faellt der einzige Gegner, ist entschieden, waehrend beide Verbuendete noch stehen', () => {
  // Der Fall, den "einer bleibt uebrig" nicht kennt: Anna und Carla haben
  // beide noch ihr Dorf.
  const welt = new Welt(DREI, 7, { sicht: 'aufgedeckt', teams: TEAMS });
  allesVerlieren(welt, 'b');
  assert.equal(welt.spieler.filter((s) => !s.aus).length, 2, 'zwei stehen noch');
  assert.ok(welt.ende, 'und trotzdem entschieden - im selben Takt');
  assert.deepEqual([...welt.ende.gewinner].sort(), ['a', 'c']);
  assert.equal(welt.ende.team, 1);
});

test('spielziel AC-20: ohne Teams gewinnt nur, wer allein uebrig ist - wie bis Runde 149', () => {
  const welt = new Welt(DREI, 7, { sicht: 'aufgedeckt' });
  allesVerlieren(welt, 'c');
  assert.equal(welt.ende, null);
  allesVerlieren(welt, 'b');
  assert.deepEqual({ gewinner: welt.ende.gewinner, sieger: welt.ende.sieger, team: welt.ende.team },
    { gewinner: ['a'], sieger: 'a', team: undefined });
});

test('spielziel AC-20: zwei Uebrige aus verschiedenen Teams - oder einer ohne Team - spielen weiter', () => {
  // Anna und Carla in Team 1, Bert ohne Team. Faellt Carla, stehen Anna und
  // Bert gegeneinander: wer kein Team hat, ist jedem Gegner.
  const welt = new Welt(DREI, 7, { sicht: 'aufgedeckt', teams: { a: 1, c: 1 } });
  allesVerlieren(welt, 'c');
  assert.equal(welt.ende, null, 'Anna gegen Bert ohne Team - nicht entschieden');
  // Faellt Anna, gewinnt Bert allein - ohne Team, und Carla hat verloren.
  allesVerlieren(welt, 'a');
  assert.deepEqual(welt.ende.gewinner, ['b']);
  assert.equal(welt.ende.sieger, 'b');
  assert.equal(welt.ende.team, undefined);
});

test('spielziel AC-20: solange ein Gegner steht, ist nichts entschieden', () => {
  // Eine Partie, in der niemand Gegner ist, waere ohne Spiel entschieden.
  // Mit zwei Teams und einem Gegner bleibt sie offen, solange er steht.
  const welt = new Welt(DREI, 7, { sicht: 'aufgedeckt', teams: { a: 1, b: 2, c: 1 } });
  for (let i = 0; i < 20; i++) welt.takten();
  assert.equal(welt.ende, null, 'Bert steht noch');
});

test('spielziel AC-20: stehen alle in einem Team, entscheidet keine Eroberung - nur die Zeit', () => {
  // Im Warteraum laesst sich jeder Platz auf Team 1 stellen (auswahl AC-22).
  // Ohne Gegner gibt es nichts zu gewinnen: die Partie endet nicht im ersten
  // Takt mit "Ihr habt gewonnen", sondern laeuft, bis die Zeit um ist.
  const welt = new Welt(DREI, 7, { sicht: 'aufgedeckt', teams: { a: 1, b: 1, c: 1 }, zeitgrenze: 90 });
  for (let i = 0; i < 20; i++) welt.takten();
  assert.equal(welt.ende, null, 'nicht im ersten Takt entschieden');
  allesVerlieren(welt, 'b');
  assert.equal(welt.ende, null, 'auch nicht, wenn einer faellt');
  welt.takt = 90 * 60 * TAKTE_PRO_SEKUNDE;
  welt.takten();
  assert.deepEqual({ gewinner: welt.ende.gewinner, grund: welt.ende.grund }, { gewinner: [], grund: 'zeit' });
});

// ---- Die KI im Team (ki AC-25, Runde 151) ------------------------------------

test('ki AC-25: die KI zielt auf den naechsten Gegner - sind die Nachbarn verbuendet, auf den uebers Eck', () => {
  // Zu viert liegen die Doerfer im Quadrat: zwei Nachbarn, einer uebers Eck.
  // Die Nachbarn kommen in Annas Team, der uebers Eck ist der Gegner.
  const VIER = ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id }));
  const ohne = new Welt(VIER, 7);
  const basis = (welt, id) => welt.spielerVon(id).basis;
  const weit = (id) => Math.hypot(basis(ohne, id).x - basis(ohne, 'a').x, basis(ohne, id).y - basis(ohne, 'a').y);
  const [nah, , fern] = ['b', 'c', 'd'].sort((x, y) => weit(x) - weit(y));
  const nachbarn = ['b', 'c', 'd'].filter((id) => id !== fern);
  assert.ok(weit(fern) > weit(nah) + 20, `uebers Eck liegt deutlich weiter: ${weit(nah).toFixed(1)} gegen ${weit(fern).toFixed(1)}`);
  // Gegenprobe ohne Teams: der naechste Nachbar ist das Ziel.
  assert.equal(new Ki(ohne, 'a').naechsterGegner().id, nah);

  const teams = { a: 1, [fern]: 2 };
  for (const id of nachbarn) teams[id] = 1;
  const welt = new Welt(VIER, 7, { teams });
  assert.deepEqual(basis(welt, nah), basis(ohne, nah), 'Teams verschieben keine Doerfer');
  const ki = new Ki(welt, 'a');
  assert.equal(ki.naechsterGegner().id, fern, 'mit beiden Nachbarn im Team: der uebers Eck');
  // Das Ziel des Heers ist sein Dorfzentrum, nicht eines der Verbuendeten.
  const ziel = ki.gegnerZiel(ki.naechsterGegner());
  assert.equal(welt.gebaeudeAn(ziel.x, ziel.y)?.besitzer, fern, 'das Ziel ist ein Gebaeude des Gegners');
  // Und "ueberlegen" misst sich am Gegner: ein Heer beim Verbuendeten zaehlt nicht.
  for (let i = 0; i < 30; i++) welt.einheitAnlegen(nah, basis(welt, nah).x + 3, basis(welt, nah).y + 3, 'miliz');
  for (let i = 0; i < 12; i++) welt.einheitAnlegen('a', basis(welt, 'a').x + 3, basis(welt, 'a').y + 3, 'miliz');
  assert.equal(ki.ueberlegen(), true, 'zwoelf gegen nichts - die dreissig beim Verbuendeten zaehlen nicht');
  // Gegenprobe ohne Teams: dieselben dreissig beim Nachbarn sind ein Gegner.
  const allein = new Ki(ohne, 'a');
  for (let i = 0; i < 30; i++) ohne.einheitAnlegen(nah, basis(ohne, nah).x + 3, basis(ohne, nah).y + 3, 'miliz');
  for (let i = 0; i < 12; i++) ohne.einheitAnlegen('a', basis(ohne, 'a').x + 3, basis(ohne, 'a').y + 3, 'miliz');
  assert.equal(allein.ueberlegen(), false, 'ohne Teams: zwoelf gegen dreissig');
});

test('ki AC-25: ein Verbuendeter am Marschziel ist kein Feind, dem die KI ausweicht', () => {
  // `freiesFeldUm` haelt Abstand von Feinden (ki AC-14) - von Verbuendeten
  // nicht: neben ihnen darf die Wache stehen.
  for (const [wer, feind] of [['c', false], ['b', true]]) {
    const { welt, x0, y0 } = mitPlatz();
    const ki = new Ki(welt, 'a');
    const um = { x: x0 + 5, y: y0 + 5 };
    const fremder = stellen(welt, wer, 'miliz', um.x + 1, um.y);
    // Von rechts kommend liegt das naechste freie Feld neben dem Fremden.
    const feld = ki.freiesFeldUm(um, { x: um.x + 4, y: um.y }, { feindFern: FEIND_FERN });
    const abstand = Math.hypot(feld.x - fremder.x, feld.y - fremder.y);
    if (feind) assert.ok(abstand > FEIND_FERN, `von Bert haelt sie Abstand: ${abstand.toFixed(2)}`);
    else assert.ok(abstand <= FEIND_FERN, `neben Carla darf sie stehen: ${abstand.toFixed(2)}`);
  }
});

test('ki AC-25: eine Baustelle neben einem Verbuendeten wird weitergebaut, neben einem Gegner nicht', () => {
  for (const [wer, gebaut] of [['c', true], ['b', false]]) {
    const welt = new Welt(DREI, 7, { teams: TEAMS });
    const ki = new Ki(welt, 'a');
    const platz = ki.platzBeiBasis('haus');
    const haus = welt.gebaeudeAnlegen('a', 'haus', platz.x, platz.y, false);
    welt.einheitAnlegen(wer, haus.x + 2, haus.y + 2, 'miliz');
    const dorf = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
    ki.baustellenWeiterbauen([...welt.gebaeude.values()].filter((g) => g.besitzer === 'a'), dorf);
    const bauleute = dorf.filter((e) => e.auftrag?.art === 'bauen' && e.auftrag.gebaeude === haus.id);
    assert.equal(bauleute.length, gebaut ? 1 : 0, gebaut ? 'neben Carla baut einer weiter' : 'neben Bert bleibt sie liegen');
  }
});

// Ein Buendnis loesen (spielziel AC-21): Anna kuendigt, Carla war ihre
// Verbuendete. 60 Sekunden lang sind sie noch keine Gegner, sehen aber
// schon jeder fuer sich; danach gehoert Anna keinem Team mehr an.
const kuendigen = (welt, id) => welt.nachricht(id, { auftrag: 'kuendigen' });

test('spielziel AC-21: wer kuendigt, ist 60 Sekunden lang noch Verbuendeter - danach Gegner ohne Team, und die Wachen greifen an', () => {
  const { welt, x0, y0 } = mitPlatz();
  const wache = stellen(welt, 'a', 'miliz', x0 + 2, y0 + 5);
  const carla = stellen(welt, 'c', 'miliz', x0 + 5, y0 + 5);
  assert.deepEqual(kuendigen(welt, 'a'), {});
  assert.equal(welt.kuendigungen[0].bis, welt.takt + KUENDIGUNG_SEKUNDEN * TAKTE_PRO_SEKUNDE);
  assert.equal(KUENDIGUNG_SEKUNDEN, 60, 'die Frist aus ADR-0013');
  sekunden(welt, KUENDIGUNG_SEKUNDEN - 1);
  assert.equal(welt.feindlich('a', 'c'), false, 'kurz vor Ablauf noch verbuendet');
  assert.equal(welt.feindlich('c', 'a'), false);
  assert.equal(wache.auftrag, null, 'keiner greift waehrend der Frist an');
  assert.equal(carla.leben, EINHEITEN.miliz.leben);
  assert.equal(welt.spielerVon('a').team, 1);

  sekunden(welt, 2);
  assert.equal(welt.feindlich('a', 'c'), true, 'nach der Frist Gegner - in beide Richtungen');
  assert.equal(welt.feindlich('c', 'a'), true);
  assert.equal(welt.feindlich('a', 'b'), true, 'und Bert bleibt Annas Gegner');
  assert.equal(welt.spielerVon('a').team, null, 'Anna gehoert keinem Team mehr an (ADR-0013, Punkt 4)');
  assert.equal(welt.spielerVon('c').team, 1, 'Carla bleibt in ihrem Team');
  assert.ok(wache.auftrag?.art === 'angreifen' || carla.auftrag?.art === 'angreifen', 'die Wachen gehen aufeinander los');
});

test('spielziel AC-21: die gemeinsame Sicht endet sofort - in beide Richtungen, was erkundet war, bleibt', () => {
  const { welt, x0, y0 } = mitPlatz(TEAMS, 'nebel');
  // Carlas Spaeher auf der einen Seite des freien Platzes, Annas auf der
  // anderen - weit weg von allen Doerfern.
  const carlas = { x: x0, y: y0 + 5 };
  const annas = { x: x0 + 10, y: y0 + 5 };
  stellen(welt, 'c', 'spaeherreiter', carlas.x, carlas.y);
  stellen(welt, 'a', 'spaeherreiter', annas.x, annas.y);
  welt.sichtAktualisieren();
  assert.equal(welt.sieht('a', carlas.x, carlas.y), true, 'vorher sieht Anna, was Carla sieht');
  assert.equal(welt.sieht('c', annas.x, annas.y), true, 'und Carla, was Anna sieht');

  assert.deepEqual(kuendigen(welt, 'a'), {});
  // Kein Takt dazwischen: sofort heisst sofort.
  assert.equal(welt.sieht('a', carlas.x, carlas.y), false, 'Anna sieht Carlas Platz nicht mehr');
  assert.equal(welt.sieht('c', annas.x, annas.y), false, 'Carla Annas nicht mehr');
  assert.equal(welt.sieht('a', annas.x, annas.y), true, 'jede sieht weiter, was sie selbst sieht');
  assert.equal(welt.sieht('c', carlas.x, carlas.y), true);
  assert.equal(welt.erkundet('a', carlas.x, carlas.y), true, 'erkundet bleibt erkundet');
  assert.equal(welt.feindlich('a', 'c'), false, 'Gegner sind sie noch nicht');
  sekunden(welt, 5);
  assert.equal(welt.sieht('a', carlas.x, carlas.y), false, 'und es bleibt getrennt');
});

test('spielziel AC-21: waehrend der Frist schickt der Server Anna Carlas Einheiten nur noch in Sicht - und jedem die Kuendigung', () => {
  const { welt } = mitPlatz(TEAMS, 'nebel');
  for (const id of ['a', 'b', 'c']) welt.aufbauFuer(id);
  const carlas = [...welt.einheiten.values()].filter((e) => e.besitzer === 'c').map((e) => e.id);
  const bekommt = (id) => welt.zustandJeSpieler([id]).get(id);
  assert.ok(carlas.every((i) => bekommt('a').einheiten.some((e) => e.i === i)), 'vorher jede Einheit Carlas');
  assert.equal(bekommt('a').bu, undefined, 'keine Kuendigung, kein Eintrag');

  kuendigen(welt, 'a');
  const bis = welt.kuendigungen[0].bis;
  const anna = bekommt('a');
  assert.ok(carlas.every((i) => !anna.einheiten.some((e) => e.i === i)), 'Carlas Dorf liegt weit weg: nichts davon kommt an');
  // Oeffentlich: jeder bekommt sie, auch Bert, der Gegner beider.
  for (const id of ['a', 'b', 'c']) assert.deepEqual(bekommt(id).bu, [['a', bis]], `${id} bekommt die Kuendigung`);
  assert.deepEqual(welt.aufbauFuer('b').bu, [['a', bis]], 'auch im Aufbau nach einer Rueckkehr');
});

test('spielziel AC-21: bei "fest" weist der Server die Kuendigung ab - ebenso eine zweite, eine ohne Verbuendeten und eine ohne Team', () => {
  const fest = new Welt(DREI, 7, { teams: TEAMS, buendnisse: 'fest' });
  assert.match(kuendigen(fest, 'a').fehler, /fest/);
  assert.deepEqual(fest.kuendigungen, []);
  assert.equal(fest.teiltSicht('a', 'c'), true, 'die Sicht bleibt gemeinsam');

  const loesbar = new Welt(DREI, 7, { teams: TEAMS });
  assert.equal(loesbar.buendnisse, 'loesbar', 'die Vorgabe');
  assert.match(kuendigen(loesbar, 'b').fehler, /keinen Verbündeten/, 'Bert ist allein in Team 2');
  assert.deepEqual(kuendigen(loesbar, 'a'), {});
  assert.match(kuendigen(loesbar, 'a').fehler, /schon gelöst/, 'zweimal geht nicht - zuruecknehmen auch nicht');
  assert.equal(loesbar.kuendigungen.length, 1);

  const ohneTeams = new Welt(DREI, 7, {});
  assert.match(kuendigen(ohneTeams, 'a').fehler, /keinen Verbündeten/);
});

test('spielziel AC-21: nach der Frist gewinnt das Team ohne den, der gekuendigt hat - er kaempft allein weiter', () => {
  const welt = new Welt(DREI, 7, { teams: TEAMS, sicht: 'aufgedeckt' });
  kuendigen(welt, 'a');
  sekunden(welt, KUENDIGUNG_SEKUNDEN + 1);
  welt.aufgeben('b');
  assert.equal(welt.ende, null, 'Bert ist raus, aber Anna und Carla sind jetzt Gegner: es geht weiter');
  welt.aufgeben('c');
  assert.deepEqual(welt.ende.gewinner, ['a'], 'Anna gewinnt allein');
  assert.equal(welt.ende.team, undefined, 'ohne Team');
});

test('spielziel AC-21: faellt nach der Kuendigung ein Haus Carlas, wo Anna nicht hinsieht, erfaehrt sie es beim naechsten Hinsehen', () => {
  const { welt, x0, y0 } = mitPlatz(TEAMS, 'nebel');
  const haus = welt.gebaeudeAnlegen('c', 'haus', x0 + 5, y0 + 5);
  for (const id of ['a', 'b', 'c']) welt.aufbauFuer(id);
  const bekommt = (id) => welt.zustandJeSpieler([id]).get(id).gebaeude || [];
  kuendigen(welt, 'a');
  // Carla reisst ab, und niemand von Anna steht dort.
  welt.gebaeudeZerstoeren(haus);
  welt.sichtAktualisieren();
  assert.equal(welt.sieht('a', x0 + 5, y0 + 5), false, 'Anna sieht den Platz nicht');
  assert.ok(!bekommt('a').some((g) => g.i === haus.id), 'im Nebel erfaehrt sie es nicht - wie bei jedem fremden Haus');
  // Ein Spaeher Annas kommt hin: jetzt steht es nicht mehr.
  stellen(welt, 'a', 'spaeherreiter', x0 + 5, y0 + 3);
  welt.sichtAktualisieren();
  assert.ok(bekommt('a').some((g) => g.i === haus.id && g.weg), 'beim Hinsehen: das Haus ist weg');
});

test('spielziel AC-21: faellt der letzte Gegner waehrend der Frist, ist nichts entschieden - nach der Frist kaempfen die frueheren Verbuendeten', () => {
  const welt = new Welt(DREI, 7, { teams: TEAMS, sicht: 'aufgedeckt' });
  kuendigen(welt, 'a');
  sekunden(welt, 5);
  welt.aufgeben('b');
  // Nach der alten Regel endete die Partie hier als Sieg von Team 1 - samt
  // Anna, die das Team eben verlassen hat.
  assert.equal(welt.ende, null, 'Bert ist raus, aber Annas Frist laeuft: nichts entschieden');
  sekunden(welt, KUENDIGUNG_SEKUNDEN);
  assert.equal(welt.ende, null, 'nach der Frist sind Anna und Carla Gegner');
  assert.equal(welt.feindlich('a', 'c'), true);
  welt.aufgeben('a');
  assert.deepEqual(welt.ende.gewinner, ['c'], 'Carla gewinnt - ohne Anna');
});

test('spielziel AC-21: wem nur noch einer bleibt, der selbst schon gekuendigt hat, hat keinen Verbuendeten mehr', () => {
  const welt = new Welt(DREI, 7, { teams: TEAMS });
  assert.deepEqual(kuendigen(welt, 'a'), {});
  // Carlas einzige Verbuendete geht schon: ihre Kuendigung aenderte nichts.
  assert.match(kuendigen(welt, 'c').fehler, /keinen Verbündeten/);
  assert.equal(welt.kuendigungen.length, 1);
});
