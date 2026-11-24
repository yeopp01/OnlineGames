// Einquartieren und die Notfallklingel (bauen AC-58 bis AC-61) - Rechenteile,
// direkt geprueft (→ docs/adr/0004-teststrategie.md). Die Oberflaeche dazu:
// e2e/tests/strategie-einquartieren.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, EINQUARTIEREN } = require('../server/spiele/strategie/daten.js');
const karten = require('../server/spiele/strategie/karte.js');
const { WALD } = karten;

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

function sekunden(welt, s) {
  for (let t = 0; t < Math.round(s * TAKTE_PRO_SEKUNDE); t++) welt.takten();
}

/** So lange takten, bis `fertig()` stimmt - hoechstens `s` Sekunden. */
function bis(welt, fertig, s = 30) {
  for (let t = 0; t < s * TAKTE_PRO_SEKUNDE && !fertig(); t++) welt.takten();
  assert.ok(fertig(), `nach ${s} Sekunden erreicht`);
}

const dorfzentrum = (welt, besitzer = 'a') => [...welt.gebaeude.values()].find((g) => g.besitzer === besitzer && g.art === 'dorfzentrum');
const dorfbewohner = (welt, besitzer = 'a') => [...welt.einheiten.values()].filter((e) => e.besitzer === besitzer && e.art === 'dorfbewohner');

/** Ist rund um das Rechteck vier Felder breit alles begehbar? Dann stehen die Einheiten des Tests nicht im Wald. */
function freiUm(welt, art, x, y) {
  const g = GEBAEUDE[art].groesse;
  for (let fy = y - 4; fy < y + g + 4; fy++) {
    for (let fx = x - 4; fx < x + g + 4; fx++) {
      if ((fx < x || fx >= x + g || fy < y || fy >= y + g) && !karten.begehbar(welt.karte, fx, fy)) return false;
    }
  }
  return true;
}

/** Ein freier Platz fuer `art` nahe (x, y), gesucht mit `platzPruefen`, mit freiem Feld drumherum. */
function platz(welt, art, x, y) {
  for (let r = 0; r < 40; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === r && welt.platzPruefen(art, x + dx, y + dy) && freiUm(welt, art, x + dx, y + dy)) return { x: x + dx, y: y + dy };
      }
    }
  }
  throw new Error('kein Platz');
}

/** Ein fertiges Gebaeude von Anna in der Kartenmitte, fern beider Doerfer. */
function inDerMitte(welt, art, besitzer = 'a') {
  const mitte = Math.floor(welt.karte.groesse / 2);
  const p = platz(welt, art, mitte, mitte);
  return welt.gebaeudeAnlegen(besitzer, art, p.x, p.y, true);
}

/** Eine Einheit `abstand` Felder rechts vom Rand des Gebaeudes. */
function daneben(welt, gebaeude, abstand, art = 'dorfbewohner', besitzer = 'a') {
  const g = GEBAEUDE[gebaeude.art].groesse;
  return welt.einheitAnlegen(besitzer, gebaeude.x + g - 1 + abstand, gebaeude.y, art);
}

const hinein = (welt, ids, gebaeude, spieler = 'a') => welt.nachricht(spieler, { auftrag: 'einquartieren', einheiten: ids, gebaeude: gebaeude.id });

test('bauen AC-58: Dorfzentrum, Wachturm und Burg nehmen auf - 15, 5 und 20, als Daten', () => {
  assert.equal(GEBAEUDE.dorfzentrum.besatzung, 15);
  assert.equal(GEBAEUDE.wachturm.besatzung, 5);
  assert.equal(GEBAEUDE.burg.besatzung, 20);
  const andere = Object.keys(GEBAEUDE).filter((art) => GEBAEUDE[art].besatzung);
  assert.deepEqual(andere.sort(), ['burg', 'dorfzentrum', 'wachturm'], 'sonst nimmt kein Gebaeude jemanden auf');
  // Der Aufbau sagt dem Browser, wer wohin darf.
  const welt = new Welt(ZWEI, 7);
  const aufbau = welt.aufbau();
  assert.equal(aufbau.werte.gebaeude.dorfzentrum.besatzung, 15);
  assert.deepEqual(aufbau.werte.einheiten.dorfbewohner.quartiere.sort(), ['burg', 'dorfzentrum', 'wachturm']);
  assert.deepEqual(aufbau.werte.einheiten.ritter.quartiere, ['burg'], 'ein Reiter nur in die Burg');
  assert.deepEqual(aufbau.werte.einheiten.ramme.quartiere, [], 'Belagerung nirgends');
  assert.deepEqual(aufbau.werte.einheiten.marktkarren.quartiere, [], 'ein Karren nirgends');
});

test('bauen AC-58: wer einquartiert wird, geht hin und verschwindet von der Karte - er zaehlt weiter mit', () => {
  const welt = new Welt(ZWEI, 7);
  const dz = dorfzentrum(welt);
  const leute = dorfbewohner(welt);
  const vorher = welt.bevoelkerung().get('a');
  assert.deepEqual(hinein(welt, leute.map((e) => e.id), dz), {});
  assert.ok(leute.every((e) => e.auftrag?.art === 'einquartieren'), 'alle unterwegs');
  bis(welt, () => (dz.insassen?.length || 0) === leute.length);
  for (const e of leute) assert.equal(welt.einheiten.has(e.id), false, 'nicht mehr auf der Karte');
  assert.equal(welt.bevoelkerung().get('a'), vorher, 'die Bevoelkerung bleibt');
  const zustand = welt.zustand();
  assert.ok(zustand.einheiten.every((e) => !leute.some((l) => l.id === e.i)), 'nicht auf der Leitung');
  const draht = welt.aufbau().gebaeude.find((g) => g.i === dz.id);
  assert.equal(draht.bs, leute.length, 'die Zahl steht am Gebaeude');
});

test('bauen AC-58: drinnen trifft niemand - ein Angriff auf den Einquartierten endet', () => {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  const turm = inDerMitte(welt, 'wachturm');
  // Die Miliz ist weit genug weg, dass der Bauer drin ist, ehe sie ankommt.
  const bauer = daneben(welt, turm, 1);
  const miliz = daneben(welt, turm, 14, 'miliz', 'b');
  welt.sichtAktualisieren();
  welt.nachricht('b', { einheiten: [miliz.id], ziel: { x: bauer.x, y: bauer.y } });
  assert.equal(miliz.auftrag?.art, 'angreifen');
  hinein(welt, [bauer.id], turm);
  bis(welt, () => turm.insassen?.length === 1, 5);
  sekunden(welt, 1);
  assert.notEqual(miliz.auftrag?.art, 'angreifen', 'das Ziel ist fort');
  assert.equal(bauer.leben, welt.lebenMax('a', 'dorfbewohner'), 'kein Schlag kam an');
});

test('bauen AC-58: drinnen heilt jeder langsam - ein Leben alle zwei Sekunden', () => {
  const welt = new Welt(ZWEI, 7);
  const turm = inDerMitte(welt, 'wachturm');
  const bauer = daneben(welt, turm, 1);
  bauer.leben = 5;
  hinein(welt, [bauer.id], turm);
  bis(welt, () => turm.insassen?.length === 1, 5);
  const leben = bauer.leben;
  sekunden(welt, 10 * EINQUARTIEREN.heilen);
  assert.equal(bauer.leben - leben, 10, 'zehn Leben in zwanzig Sekunden');
  sekunden(welt, 200);
  assert.equal(bauer.leben, welt.lebenMax('a', 'dorfbewohner'), 'nicht ueber das volle Leben');
});

test('bauen AC-58: Alle heraus - jeder steht auf einem freien Feld am Gebaeude', () => {
  const welt = new Welt(ZWEI, 7);
  const dz = dorfzentrum(welt);
  const leute = dorfbewohner(welt);
  hinein(welt, leute.map((e) => e.id), dz);
  bis(welt, () => (dz.insassen?.length || 0) === leute.length);
  assert.deepEqual(welt.nachricht('b', { auftrag: 'heraus', gebaeude: dz.id }), { fehler: 'Das ist nicht dein Gebäude.' });
  assert.deepEqual(welt.nachricht('a', { auftrag: 'heraus', gebaeude: dz.id }), {});
  assert.equal(dz.insassen, undefined, 'niemand mehr drin');
  for (const e of leute) {
    assert.equal(welt.einheiten.get(e.id), e, 'wieder auf der Karte');
    assert.ok(welt.abstandZu(e, dz) <= 2, 'am Gebaeude');
  }
  assert.equal(new Set(leute.map((e) => `${e.x},${e.y}`)).size, leute.length, 'jeder auf seinem Feld');
  assert.deepEqual(welt.nachricht('a', { auftrag: 'heraus', gebaeude: dz.id }), { fehler: 'Im Gebäude ist niemand.' });
});

test('bauen AC-58: Gegenprobe - fremdes Gebaeude, Haus, Baustelle, Reiter ins Dorfzentrum, Ramme, volles Gebaeude', () => {
  const welt = new Welt(ZWEI, 7);
  const dz = dorfzentrum(welt);
  const bauer = dorfbewohner(welt)[0];
  assert.deepEqual(hinein(welt, [bauer.id], dorfzentrum(welt, 'b')), { fehler: 'Einquartieren geht nur in ein eigenes Gebäude.' });
  const haus = inDerMitte(welt, 'haus');
  assert.deepEqual(hinein(welt, [bauer.id], haus), { fehler: 'Dieses Gebäude nimmt niemanden auf.' });
  const p = platz(welt, 'wachturm', haus.x + 6, haus.y);
  const baustelle = welt.gebaeudeAnlegen('a', 'wachturm', p.x, p.y, false);
  assert.deepEqual(hinein(welt, [bauer.id], baustelle), { fehler: 'Das Gebäude ist noch nicht fertig.' });
  const reiter = daneben(welt, dz, 2, 'spaeherreiter');
  const ramme = daneben(welt, dz, 3, 'ramme');
  assert.deepEqual(hinein(welt, [reiter.id, ramme.id], dz), { fehler: 'Diese Einheiten nimmt das Gebäude nicht auf.' });
  assert.equal(reiter.auftrag?.art === 'einquartieren', false);
  // Ein Wachturm fasst fuenf: von sieben bleiben zwei draussen.
  const turm = inDerMitte(welt, 'wachturm');
  const sieben = Array.from({ length: 7 }, (_, i) => daneben(welt, turm, 1 + (i % 3), 'miliz'));
  assert.deepEqual(hinein(welt, sieben.map((e) => e.id), turm), { fehler: 'Das Gebäude ist voll — 2 bleiben draußen.' });
  assert.equal(sieben.filter((e) => e.auftrag?.art === 'einquartieren').length, 5);
  const noch = daneben(welt, turm, 2, 'miliz');
  assert.deepEqual(hinein(welt, [noch.id], turm), { fehler: 'Das Gebäude ist voll.' });
});

/** Eine Miliz von Bert in Reichweite des Gebaeudes, und ein Takt: wie viele Pfeile fliegen? */
function salve(welt, gebaeude) {
  const ziel = daneben(welt, gebaeude, 3, 'miliz', 'b');
  ziel.leben = 10000;
  const vorher = welt.pfeileImFlug.length;
  welt.takten();
  return welt.pfeileImFlug.length - vorher;
}

test('bauen AC-59: das Dorfzentrum schiesst nur mit Besatzung, einen Pfeil je Schuetze darin', () => {
  const leer = new Welt(ZWEI, 7);
  assert.equal(salve(leer, dorfzentrum(leer)), 0, 'leer schiesst es nicht');
  for (const n of [1, 5]) {
    const welt = new Welt(ZWEI, 7);
    const dz = dorfzentrum(welt);
    const leute = [...dorfbewohner(welt)];
    while (leute.length < n) leute.push(daneben(welt, dz, 1));
    hinein(welt, leute.slice(0, n).map((e) => e.id), dz);
    bis(welt, () => dz.insassen?.length === n);
    assert.equal(salve(welt, dz), n, `${n} drin, ${n} Pfeile`);
  }
});

test('bauen AC-59: Wachturm und Burg schiessen einen Pfeil mehr je Dorfbewohner, Fusssoldat oder Schuetze - Reiter nicht', () => {
  const turmwelt = new Welt(ZWEI, 7);
  const turm = inDerMitte(turmwelt, 'wachturm');
  const drei = [daneben(turmwelt, turm, 1), daneben(turmwelt, turm, 1, 'miliz'), daneben(turmwelt, turm, 2, 'bogenschuetze')];
  hinein(turmwelt, drei.map((e) => e.id), turm);
  bis(turmwelt, () => turm.insassen?.length === 3, 5);
  assert.equal(salve(turmwelt, turm), 1 + 3);
  const burgwelt = new Welt(ZWEI, 7);
  const burg = inDerMitte(burgwelt, 'burg');
  const reiter = [daneben(burgwelt, burg, 1, 'ritter'), daneben(burgwelt, burg, 2, 'ritter')];
  hinein(burgwelt, reiter.map((e) => e.id), burg);
  bis(burgwelt, () => burg.insassen?.length === 2, 5);
  assert.equal(salve(burgwelt, burg), GEBAEUDE.burg.pfeile, 'zwei Ritter drin, kein Pfeil mehr');
});

test('bauen AC-60: faellt das Gebaeude, kommen alle heraus - lebend, auf die Karte', () => {
  const welt = new Welt(ZWEI, 7);
  const turm = inDerMitte(welt, 'wachturm');
  const leute = [daneben(welt, turm, 1), daneben(welt, turm, 2), daneben(welt, turm, 1, 'miliz')];
  for (const e of leute) e.leben = 7;
  hinein(welt, leute.map((e) => e.id), turm);
  bis(welt, () => turm.insassen?.length === 3, 5);
  const vorher = welt.bevoelkerung().get('a');
  turm.leben = 0;
  welt.gebaeudeZerstoeren(turm);
  assert.equal(welt.gebaeude.has(turm.id), false);
  for (const e of leute) {
    assert.equal(welt.einheiten.get(e.id), e, 'wieder auf der Karte');
    assert.ok(!e.tot, "nicht tot");
    assert.ok(e.leben >= 7, 'mit seinem Leben');
  }
  assert.equal(welt.bevoelkerung().get('a'), vorher);
  // Auch wenn der Spieler aufgibt, bleibt niemand eingesperrt.
  const zweite = new Welt(ZWEI, 7);
  const dz = dorfzentrum(zweite);
  const bauer = dorfbewohner(zweite)[0];
  hinein(zweite, [bauer.id], dz);
  bis(zweite, () => dz.insassen?.length === 1);
  zweite.nachricht('a', { auftrag: 'aufgeben' });
  assert.equal(dz.insassen, undefined);
});

test('bauen AC-61: die Glocke schickt die Dorfbewohner hinein, die Entwarnung zurueck an ihre Arbeit', () => {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  const dz = dorfzentrum(welt);
  const leute = dorfbewohner(welt);
  // Arbeit geben: am naechsten Baum.
  const baum = (() => {
    let bester = null;
    for (let y = 0; y < welt.karte.groesse; y++) {
      for (let x = 0; x < welt.karte.groesse; x++) {
        if (welt.karte.felder[y * welt.karte.groesse + x] !== WALD) continue;
        const d = Math.hypot(x - dz.x, y - dz.y);
        if (!bester || d < bester.d) bester = { x, y, d };
      }
    }
    return bester;
  })();
  welt.nachricht('a', { einheiten: leute.map((e) => e.id), ziel: { x: baum.x, y: baum.y } });
  sekunden(welt, 15);
  assert.ok(leute.every((e) => e.auftrag?.art === 'sammeln'), 'alle am Holz');
  const fern = welt.einheitAnlegen('a', dz.x + EINQUARTIEREN.glocke + 8, dz.y, 'dorfbewohner');
  const miliz = daneben(welt, dz, 2, 'miliz');
  assert.deepEqual(welt.nachricht('a', { auftrag: 'glocke', gebaeude: dz.id }), {});
  assert.equal(welt.zustand().spieler.find((s) => s.id === 'a').gl, 1, 'die Glocke laeutet - der Browser sieht es');
  bis(welt, () => dz.insassen?.length === leute.length);
  assert.equal(welt.einheiten.has(fern.id), true, 'wer weiter als zwanzig Felder ist, hoert sie nicht');
  assert.equal(welt.einheiten.has(miliz.id), true, 'die Glocke gilt nur Dorfbewohnern');
  // Entwarnung: der zweite Druck.
  assert.deepEqual(welt.nachricht('a', { auftrag: 'glocke', gebaeude: dz.id }), {});
  assert.equal(dz.insassen, undefined);
  assert.equal(welt.zustand().spieler.find((s) => s.id === 'a').gl, undefined);
  sekunden(welt, 15);
  for (const e of leute) {
    assert.equal(e.auftrag?.art, 'sammeln', 'wieder am Holz');
    assert.ok(Math.hypot(e.auftrag.feld.x - baum.x, e.auftrag.feld.y - baum.y) < 4, 'am selben Wald');
  }
});

test('bauen AC-61: die Glocke fuellt das naechste Gebaeude mit Platz - wer anders befohlen wird, gehoert nicht mehr dazu', () => {
  const welt = new Welt(ZWEI, 7);
  const dz = dorfzentrum(welt);
  const p = platz(welt, 'wachturm', dz.x + 6, dz.y);
  const turm = welt.gebaeudeAnlegen('a', 'wachturm', p.x, p.y, true);
  // Achtzehn am Turm: fuenf in den Turm, der Rest ins Dorfzentrum.
  const leute = Array.from({ length: 18 }, (_, i) => welt.einheitAnlegen('a', p.x + 1 + (i % 3), p.y + 1 + Math.floor(i / 3), 'dorfbewohner'));
  welt.nachricht('a', { auftrag: 'glocke', gebaeude: dz.id });
  const nachTurm = leute.filter((e) => e.auftrag?.gebaeude === turm.id);
  assert.equal(nachTurm.length, 5, 'der Turm fasst fuenf');
  const abweichler = leute.find((e) => e.auftrag?.gebaeude === dz.id);
  welt.nachricht('a', { einheiten: [abweichler.id], ziel: { x: abweichler.x + 2, y: abweichler.y } });
  assert.equal(abweichler.vorGlocke, undefined, 'eigener Befehl: nicht mehr von der Glocke');
  sekunden(welt, 20);
  welt.nachricht('a', { auftrag: 'glocke', gebaeude: dz.id });
  assert.equal(turm.insassen, undefined);
  assert.equal(dz.insassen, undefined, 'die Entwarnung leert auch das Dorfzentrum');
  assert.deepEqual(welt.nachricht('a', { auftrag: 'glocke', gebaeude: turm.id }), { fehler: 'Die Glocke hängt am eigenen Dorfzentrum.' });
  assert.deepEqual(welt.nachricht('b', { auftrag: 'glocke', gebaeude: dz.id }), { fehler: 'Die Glocke hängt am eigenen Dorfzentrum.' });
});

test('bauen AC-61: die KI laeutet nicht und quartiert nicht ein', () => {
  const ki = fs.readFileSync(new URL('../server/spiele/strategie/ki.js', import.meta.url), 'utf8');
  for (const wort of ["'einquartieren'", "'glocke'", "'heraus'", "'haltung'"]) assert.equal(ki.includes(wort), false, `ki.js sendet kein ${wort}`);
});
