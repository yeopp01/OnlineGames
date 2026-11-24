// Die vier Haltungen der Kampfeinheiten (kampf AC-28 bis AC-31) -
// Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md). Die
// Knoepfe dazu: e2e/tests/strategie-haltungen.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, ABRUESTEN } = require('../server/spiele/strategie/daten.js');
const karten = require('../server/spiele/strategie/karte.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

function sekunden(welt, s, jeTakt = () => {}) {
  for (let t = 0; t < Math.round(s * TAKTE_PRO_SEKUNDE); t++) {
    welt.takten();
    jeTakt();
  }
}

/** Ein Streifen Gras in der Kartenmitte, `breite` Felder lang nach rechts - weit von beiden Doerfern. */
function freierStreifen(welt, breite) {
  const n = welt.karte.groesse;
  for (let y = Math.floor(n / 2) - 15; y < n; y++) {
    for (let x = Math.floor(n / 2) - 15; x + breite < n; x++) {
      let frei = true;
      for (let dy = -3; dy <= 3 && frei; dy++) {
        for (let dx = -3; dx <= breite && frei; dx++) frei = karten.begehbar(welt.karte, x + dx, y + dy) && !welt.gebaeudeAn(x + dx, y + dy);
      }
      if (frei) return { x, y };
    }
  }
  throw new Error('kein freier Streifen');
}

function partie() {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  return { welt, ...freierStreifen(welt, 34) };
}

const haltung = (welt, ids, h, spieler = 'a') => welt.nachricht(spieler, { auftrag: 'haltung', einheiten: ids, haltung: h });

test('kampf AC-28: vier Haltungen fuer Kampfeinheiten - Verteidigung ist die Vorgabe und steht nicht auf der Leitung', () => {
  const { welt, x, y } = partie();
  const miliz = welt.einheitAnlegen('a', x, y, 'miliz');
  const bauer = welt.einheitAnlegen('a', x + 1, y, 'dorfbewohner');
  const ramme = welt.einheitAnlegen('a', x + 2, y, 'ramme');
  const moench = welt.einheitAnlegen('a', x + 3, y, 'moench');
  const fremd = welt.einheitAnlegen('b', x + 30, y, 'miliz');
  const draht = () => welt.zustand().einheiten.find((e) => e.i === miliz.id);
  assert.equal(miliz.haltung, undefined, 'Vorgabe: keine Haltung gesetzt, also Verteidigung');
  assert.equal('ht' in draht(), false);
  for (const [h, buchstabe] of [['angriff', 'a'], ['stellung', 's'], ['passiv', 'p']]) {
    assert.deepEqual(haltung(welt, [miliz.id], h), {});
    assert.equal(miliz.haltung, h);
    assert.equal(draht().ht, buchstabe, `${h} als ein Buchstabe`);
  }
  assert.deepEqual(haltung(welt, [miliz.id], 'verteidigung'), {});
  assert.equal(miliz.haltung, undefined);
  assert.equal('ht' in draht(), false, 'die Vorgabe kostet nichts auf der Leitung');
  // Gegenprobe: was keine Kampfeinheit ist, fremde Einheiten, Unsinn.
  assert.deepEqual(haltung(welt, [bauer.id, ramme.id, moench.id], 'stellung'), { fehler: 'Eine Haltung haben nur Kampfeinheiten.' });
  assert.deepEqual(haltung(welt, [fremd.id], 'stellung'), { fehler: 'Eine Haltung haben nur Kampfeinheiten.' });
  assert.equal(fremd.haltung, undefined);
  assert.deepEqual(haltung(welt, [miliz.id], 'flucht'), { fehler: 'Diese Haltung gibt es nicht.' });
  // Gemischte Auswahl: die Kampfeinheit bekommt sie, der Rest nicht.
  assert.deepEqual(haltung(welt, [bauer.id, miliz.id], 'angriff'), {});
  assert.equal(bauer.haltung, undefined);
  // Der Aufbau sagt dem Browser, wer die Knoepfe bekommt.
  const werte = welt.aufbau().werte.einheiten;
  for (const art of ['miliz', 'bogenschuetze', 'ritter', 'mangonel']) assert.equal(werte[art].haltung, true, art);
  for (const art of ['dorfbewohner', 'ramme', 'moench', 'marktkarren']) assert.equal(werte[art].haltung, false, art);
  // Wer abruestet, wird Dorfbewohner und verliert die Haltung.
  welt.spieler.find((sp) => sp.id === 'a').nahrung = 1000;
  assert.deepEqual(welt.nachricht('a', { auftrag: 'abruesten', einheiten: [miliz.id] }), {});
  sekunden(welt, ABRUESTEN.sekunden + 1);
  assert.equal(miliz.art, 'dorfbewohner');
  assert.equal(miliz.haltung, undefined);
});

/**
 * Ein Ziel von Bert, das sich nicht wehrt (selbst "Nicht angreifen") und viel
 * aushaelt - sonst entschiede die Gegenwehr, wer wohin geht, nicht die Haltung.
 */
function ziel(welt, x, y, art = 'miliz') {
  const e = welt.einheitAnlegen('b', x, y, art);
  haltung(welt, [e.id], 'passiv', 'b');
  e.leben = 10000;
  return e;
}

/** Ein Ziel von Bert flieht nach rechts; wie weit folgt Annas Miliz? */
function verfolgung(h, art) {
  const { welt, x, y } = partie();
  const miliz = welt.einheitAnlegen('a', x, y, 'miliz');
  const fluechter = ziel(welt, x + 2, y, art);
  if (h) haltung(welt, [miliz.id], h);
  sekunden(welt, 0.5);
  assert.equal(miliz.auftrag?.art, 'angreifen', 'die Wache nimmt es');
  welt.nachricht('b', { einheiten: [fluechter.id], ziel: { x: x + 30, y } });
  let weitester = 0;
  sekunden(welt, 30, () => { weitester = Math.max(weitester, miliz.x - x); });
  return { welt, miliz, fluechter, weitester, x, y };
}

test('kampf AC-29: Angriff verfolgt, solange das Ziel in Sicht ist - Verteidigung kehrt nach fuenf Feldern um', () => {
  const vorgabe = verfolgung(null, 'miliz');
  assert.ok(vorgabe.weitester <= 6.5, `Verteidigung: hoechstens fuenf Felder und ein Schritt (${vorgabe.weitester.toFixed(2)})`);
  assert.ok(Math.hypot(vorgabe.miliz.x - vorgabe.x, vorgabe.miliz.y - vorgabe.y) < 1, 'und wieder daheim');
  const angriff = verfolgung('angriff', 'miliz');
  assert.ok(angriff.weitester > 20, `Angriff: bleibt dran (${angriff.weitester.toFixed(2)})`);
  assert.equal(angriff.miliz.auftrag?.art, 'angreifen', 'und schlaegt am Ende noch zu');
});

test('kampf AC-29: Angriff - ist das Ziel aus der Sicht, bleibt sie dort stehen', () => {
  // Der Spaeherreiter ist schneller als die Miliz.
  const { welt, miliz, fluechter, x, y } = verfolgung('angriff', 'spaeherreiter');
  const sicht = welt.einheitenwert('a', 'miliz', 'sicht');
  assert.equal(miliz.auftrag, null, 'sie laesst ab');
  assert.ok(Math.hypot(fluechter.x - miliz.x, fluechter.y - miliz.y) > sicht);
  const stand = { x: miliz.x, y: miliz.y };
  assert.ok(Math.hypot(stand.x - x, stand.y - y) > 1.5, 'nicht an ihrem alten Platz');
  sekunden(welt, 10);
  assert.ok(Math.hypot(miliz.x - stand.x, miliz.y - stand.y) < 0.01, 'sie kehrt nicht um');
});

test('kampf AC-29: auf Befehl und im Angriffslauf gilt der Befehl, nicht die Haltung', () => {
  const { welt, x, y } = partie();
  const miliz = welt.einheitAnlegen('a', x, y, 'miliz');
  haltung(welt, [miliz.id], 'passiv');
  const opfer = ziel(welt, x + 3, y);
  welt.sichtAktualisieren();
  welt.nachricht('a', { einheiten: [miliz.id], ziel: { x: opfer.x, y: opfer.y } });
  assert.equal(miliz.auftrag?.art, 'angreifen');
  sekunden(welt, 6);
  assert.ok(opfer.leben < 10000, 'auch wer nicht angreifen soll, greift auf Befehl an');
  // Im Angriffslauf greift auch an, wer sonst Stellung haelt.
  const zweite = partie();
  const laeufer = zweite.welt.einheitAnlegen('a', zweite.x, zweite.y, 'miliz');
  haltung(zweite.welt, [laeufer.id], 'stellung');
  const weiter = ziel(zweite.welt, zweite.x + 10, zweite.y + 2);
  zweite.welt.nachricht('a', { einheiten: [laeufer.id], ziel: { x: zweite.x + 16, y: zweite.y }, angriffslauf: true });
  sekunden(zweite.welt, 20);
  assert.ok(weiter.leben < 10000, 'der Angriffslauf greift unterwegs an');
});

/** Annas Bogenschuetze mit Haltung `h`, ein Ziel von Bert in `abstand` Feldern. */
function schuetze(h, abstand) {
  const { welt, x, y } = partie();
  const bogen = welt.einheitAnlegen('a', x, y, 'bogenschuetze');
  const opfer = ziel(welt, x + abstand, y);
  if (h) haltung(welt, [bogen.id], h);
  let gegangen = 0;
  let aufgenommen = false;
  sekunden(welt, 8, () => {
    gegangen = Math.max(gegangen, Math.hypot(bogen.x - x, bogen.y - y));
    aufgenommen ||= bogen.auftrag?.art === 'angreifen';
  });
  return { gegangen, aufgenommen, getroffen: 10000 - opfer.leben, bogen };
}

test('kampf AC-30: Stellung halten - nur was in Reichweite ist, und kein Schritt vom Platz', () => {
  const reichweite = EINHEITEN.bogenschuetze.reichweite;
  const fern = reichweite + 1.5;
  const vorgabe = schuetze(null, fern);
  assert.ok(vorgabe.gegangen > 1, `Verteidigung geht dem Ziel nach (${vorgabe.gegangen.toFixed(2)})`);
  assert.ok(vorgabe.getroffen > 0);
  const stellungFern = schuetze('stellung', fern);
  assert.ok(stellungFern.gegangen < 0.01, `Stellung: bleibt stehen (${stellungFern.gegangen})`);
  assert.equal(stellungFern.getroffen, 0, 'und laesst, was ausser Reichweite ist');
  assert.equal(stellungFern.aufgenommen, false, 'er nimmt es gar nicht erst als Ziel');
  const stellungNah = schuetze('stellung', reichweite - 1);
  assert.ok(stellungNah.gegangen < 0.01, 'auch wenn er schiesst');
  assert.ok(stellungNah.getroffen > 0, 'was in Reichweite ist, trifft er');
});

test('kampf AC-30: Stellung - wer zuschlaegt, laesst ab, sobald das Ziel ausser Reichweite ist', () => {
  const { welt, x, y } = partie();
  const miliz = welt.einheitAnlegen('a', x, y, 'miliz');
  haltung(welt, [miliz.id], 'stellung');
  const opfer = ziel(welt, x + 1, y);
  sekunden(welt, 3);
  assert.equal(miliz.auftrag?.art, 'angreifen', 'neben ihm schlaegt er zu');
  assert.ok(opfer.leben < 10000);
  welt.nachricht('b', { einheiten: [opfer.id], ziel: { x: x + 20, y } });
  let weitester = 0;
  sekunden(welt, 10, () => { weitester = Math.max(weitester, Math.hypot(miliz.x - x, miliz.y - y)); });
  assert.equal(miliz.auftrag, null);
  assert.ok(weitester < 1.5, `kein Nachlaufen (${weitester.toFixed(2)})`);
});

test('kampf AC-31: Nicht angreifen - keine Wache, keine Gegenwehr', () => {
  const { welt, x, y } = partie();
  const miliz = welt.einheitAnlegen('a', x, y, 'miliz');
  const vergleich = welt.einheitAnlegen('a', x, y + 3, 'miliz');
  haltung(welt, [miliz.id], 'passiv');
  const opfer = ziel(welt, x + 2, y + 1);
  sekunden(welt, 4);
  assert.equal(miliz.auftrag, null, 'sie wacht nicht');
  assert.equal(vergleich.auftrag?.art, 'angreifen', 'die mit Vorgabe schon');
  assert.ok(opfer.leben < 10000);
  // Ein Angreifer trifft sie: sie schlaegt nicht zurueck.
  haltung(welt, [vergleich.id], 'passiv');
  assert.equal(vergleich.auftrag, null);
  const angreifer = welt.einheitAnlegen('b', x + 1, y - 1, 'miliz');
  angreifer.leben = 10000;
  welt.sichtAktualisieren();
  welt.nachricht('b', { einheiten: [angreifer.id], ziel: { x: miliz.x, y: miliz.y } });
  assert.equal(angreifer.auftrag?.art, 'angreifen');
  const vorher = miliz.leben;
  sekunden(welt, 4);
  assert.ok(miliz.leben < vorher, 'sie wird getroffen');
  assert.equal(miliz.auftrag, null, 'und wehrt sich nicht');
  assert.equal(angreifer.leben, 10000);
});

test('kampf AC-31: wer sich eben wehrte und dann nicht angreifen soll, laesst ab', () => {
  const { welt, x, y } = partie();
  const miliz = welt.einheitAnlegen('a', x, y, 'miliz');
  ziel(welt, x + 2, y);
  sekunden(welt, 1);
  assert.equal(miliz.auftrag?.art, 'angreifen');
  haltung(welt, [miliz.id], 'passiv');
  assert.equal(miliz.auftrag, null);
  sekunden(welt, 3);
  assert.equal(miliz.auftrag, null, 'und nimmt es nicht wieder auf');
});
