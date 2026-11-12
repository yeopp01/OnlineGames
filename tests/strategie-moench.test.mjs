// Der Moench (einheiten AC-37, AC-38, Stufe D8) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md). Die Oberflaeche dazu:
// e2e/tests/strategie-moench.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, EINHEITEN } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const sekunden = (welt, s) => { for (let t = 0; t < s * TAKTE_PRO_SEKUNDE; t++) welt.takten(); };

/**
 * Anna in der Ritterzeit, satt, und ein freier Platz von elf mal elf Feldern
 * neben ihrem Dorf, weit weg von allen Einheiten. `x0`, `y0` ist seine Ecke.
 */
function ritterzeitMitPlatz() {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  const anna = welt.spielerVon('a');
  anna.zeitalter = 2;
  Object.assign(anna, { nahrung: 2000, holz: 2000, gold: 2000, stein: 500 });
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

/** Eine verletzte Einheit: `fehlt` Leben unter dem vollen Wert. */
function verletzt(welt, besitzer, x, y, art, fehlt) {
  const e = welt.einheitAnlegen(besitzer, x, y, art);
  e.leben -= fehlt;
  return e;
}
const voll = (welt, e) => welt.einheitenwert(e.besitzer, e.art, 'leben');

test('einheiten AC-37: der Moench mit den Werten der Vorlage, im Kloster erst ab der Ritterzeit', () => {
  const m = EINHEITEN.moench;
  assert.deepEqual([m.leben, m.tempo, m.zeit], [30, 0.7, 51]);
  assert.deepEqual(m.kosten, { gold: 100 });
  assert.equal(m.angriff, 0, 'er greift nicht an');
  assert.equal(m.heilen.je, 1, 'ein Leben je Sekunde');
  assert.ok(GEBAEUDE.kloster.bildetAus.includes('moench'));

  const { welt, anna, x0, y0 } = ritterzeitMitPlatz();
  const kloster = welt.gebaeudeAnlegen('a', 'kloster', x0 + 5, y0 + 5);
  anna.zeitalter = 1;
  assert.match(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kloster.id, einheit: 'moench' }).fehler, /ab dem Fürstentum/);
  anna.zeitalter = 2;
  const gold = anna.gold;
  assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kloster.id, einheit: 'moench' }), {});
  assert.equal(anna.gold, gold - 100);
  const moenche = () => [...welt.einheiten.values()].filter((e) => e.art === 'moench' && e.besitzer === 'a');
  sekunden(welt, 50);
  assert.equal(moenche().length, 0, 'nach 50 Sekunden noch nicht');
  sekunden(welt, 2);
  assert.equal(moenche().length, 1, 'nach 51 Sekunden steht er da');
  assert.equal(moenche()[0].leben, 30);
});

test('einheiten AC-37: der Moench heilt eine verletzte eigene Einheit um einen Punkt je Sekunde, bis sie voll ist', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 3, y0 + 5, 'moench');
  const miliz = verletzt(welt, 'a', x0 + 5, y0 + 5, 'miliz', 12);
  const vorher = miliz.leben;
  sekunden(welt, 10);
  assert.equal(miliz.leben, vorher + 10, 'zehn Sekunden, zehn Leben');
  assert.ok(moench.heilt, 'er arbeitet dabei');
  sekunden(welt, 5);
  assert.equal(miliz.leben, voll(welt, miliz), 'nie ueber das volle Leben');
  sekunden(welt, 1);
  assert.equal(moench.heilt, null, 'ist niemand mehr verletzt, hoert er auf');
});

test('einheiten AC-37: mehrere Verletzte - einer nach dem anderen, der naechste zuerst', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  welt.einheitAnlegen('a', x0 + 5, y0 + 5, 'moench');
  const nah = verletzt(welt, 'a', x0 + 6, y0 + 5, 'dorfbewohner', 5);
  const fern = verletzt(welt, 'a', x0 + 8, y0 + 5, 'speerkaempfer', 5);
  const [n0, f0] = [nah.leben, fern.leben];
  sekunden(welt, 3);
  assert.equal(nah.leben, n0 + 3, 'der naechste bekommt alles');
  assert.equal(fern.leben, f0, 'der fernere wartet');
  sekunden(welt, 4);
  assert.equal(nah.leben, voll(welt, nah));
  assert.equal(fern.leben, f0 + 2, 'danach ist er dran');
});

test('einheiten AC-37: nicht geheilt werden Gebaeude, Belagerung, Kaempfende, Fremde, der Moench selbst und wer zu weit steht', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 5, y0 + 5, 'moench');
  moench.leben -= 10;
  const kloster = welt.gebaeudeAnlegen('a', 'kloster', x0 + 5, y0 + 8);
  kloster.leben -= 300;
  const ramme = verletzt(welt, 'a', x0 + 6, y0 + 4, 'ramme', 50);
  // Fremde und Ferne als Dorfbewohner: die wachen nicht und schlagen den Moench nicht.
  const fremd = verletzt(welt, 'b', x0 + 4, y0 + 4, 'dorfbewohner', 10);
  const weit = verletzt(welt, 'a', x0 + 5 + EINHEITEN.moench.heilen.reichweite + 1, y0 + 5, 'dorfbewohner', 10);
  // Eine Miliz, die kaempft: ihr Ziel ein fremdes Gebaeude weit weg, damit
  // sie dabei nichts verliert und nichts gewinnt ausser vom Moench.
  const ziel = welt.gebaeudeAnlegen('b', 'haus', x0 + 1, y0 + 1);
  const kaempft = verletzt(welt, 'a', x0 + 4, y0 + 6, 'miliz', 10);
  welt.nachricht('a', { einheiten: [kaempft.id], ziel: { x: ziel.x, y: ziel.y } });
  assert.equal(kaempft.auftrag?.art, 'angreifen', 'der Befehl auf das Haus ist ein Angriff');
  const vorher = [moench.leben, kloster.leben, ramme.leben, fremd.leben, weit.leben];
  sekunden(welt, 5);
  assert.deepEqual([moench.leben, kloster.leben, ramme.leben, fremd.leben, weit.leben], vorher);
  assert.ok(kaempft.leben <= voll(welt, kaempft) - 10, 'wer kaempft, wird nicht geheilt');
  assert.equal(moench.heilt, null);
});

test('einheiten AC-37: ein Moench, der geht, heilt nicht - erst wenn er steht', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 1, y0 + 5, 'moench');
  const miliz = verletzt(welt, 'a', x0 + 2, y0 + 5, 'miliz', 20);
  welt.nachricht('a', { einheiten: [moench.id], ziel: { x: x0 + 9, y: y0 + 5 } });
  // Er geht 0,7 Felder je Sekunde; nach zwei Sekunden ist er unterwegs.
  const vorher = miliz.leben;
  sekunden(welt, 2);
  assert.ok(moench.weg.length > 0, 'noch unterwegs');
  assert.equal(miliz.leben, vorher, 'unterwegs heilt er nicht');
});

test('einheiten AC-37: der Browser sieht, dass der Moench heilt - `w` im Zustand', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 5, y0 + 5, 'moench');
  verletzt(welt, 'a', x0 + 6, y0 + 5, 'miliz', 10);
  sekunden(welt, 2);
  const eintrag = (zustand) => zustand.einheiten.find((e) => e.i === moench.id);
  assert.equal(eintrag(welt.zustandJeSpieler(['a']).get('a')).w, 1);
  sekunden(welt, 10);
  assert.equal(eintrag(welt.zustandJeSpieler(['a']).get('a')).w, undefined, 'geheilt - er arbeitet nicht mehr');
});

// --- einheiten AC-38: der Moench bekehrt -----------------------------------

const BEKEHREN = EINHEITEN.moench.bekehren;
const befehlen = (welt, wer, einheit, ziel) => welt.nachricht(wer, { einheiten: [einheit.id], ziel: { x: ziel.x, y: ziel.y } });
/** Takte, bis `ziel` dem Spieler `wer` gehoert - hoechstens `grenze` Sekunden. */
function bisBekehrt(welt, ziel, wer, grenze = 30) {
  for (let t = 1; t <= grenze * TAKTE_PRO_SEKUNDE; t++) {
    welt.takten();
    if (ziel.besitzer === wer) return t;
  }
  return null;
}

test('einheiten AC-38: Reichweite 9 aus der Vorlage; Dauer, Ruhe und Ausnahmen als Daten', () => {
  assert.equal(BEKEHREN.reichweite, 9);
  // Nicht in der Vorlage, gesetzt wie im Original.
  assert.deepEqual([BEKEHREN.frueh, BEKEHREN.spaet, BEKEHREN.chance, BEKEHREN.ruhe], [4, 10, 0.28, 62]);
  assert.ok(BEKEHREN.nicht.includes('belagerung'));
  assert.ok(BEKEHREN.nicht.includes('moench'));
});

test('einheiten AC-38: ein Befehl auf eine fremde Einheit in Reichweite - nach 4 bis 10 Sekunden gehoert sie Anna', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 1, y0 + 5, 'moench');
  // Berts Dorfbewohner wacht nicht und laeuft nicht weg; sechs Felder weg,
  // also in Reichweite - der Moench geht nicht erst hin.
  const bauer = welt.einheitAnlegen('b', x0 + 7, y0 + 5, 'dorfbewohner');
  befehlen(welt, 'a', moench, bauer);
  assert.equal(moench.auftrag?.art, 'bekehren');
  const takte = bisBekehrt(welt, bauer, 'a');
  assert.ok(takte, 'bekehrt');
  assert.ok(takte >= BEKEHREN.frueh * TAKTE_PRO_SEKUNDE, `nicht vor 4 s (${takte} Takte)`);
  assert.ok(takte <= BEKEHREN.spaet * TAKTE_PRO_SEKUNDE + 1, `spaetestens nach 10 s (${takte} Takte)`);
  assert.deepEqual([moench.x, moench.y], [x0 + 1, y0 + 5], 'er stand dabei still');
  assert.equal(moench.auftrag, null);
});

test('einheiten AC-38: die Dauer kommt aus dem Startwert - dieselbe Partie gleich, andere Partien verschieden', () => {
  const dauer = (startwert) => {
    const welt = new Welt(ZWEI, startwert, { sicht: 'aufgedeckt' });
    return [0, 1, 2].map(() => welt.bekehrDauer(BEKEHREN) / TAKTE_PRO_SEKUNDE);
  };
  const alle = [];
  for (let s = 1; s <= 20; s++) {
    const d = dauer(s);
    assert.deepEqual(dauer(s), d, `Startwert ${s} zweimal gleich`);
    for (const x of d) assert.ok(x >= BEKEHREN.frueh && x <= BEKEHREN.spaet, `${x} s zwischen 4 und 10`);
    alle.push(...d);
  }
  // Gemessen ueber diese 60 Zuege (Runde 135): 4 s 17-mal, 5 s 11, 6 s 3,
  // 7 s 10, 8 s 7, 9 s 3, 10 s 9 - erwartet 28 % fuer 4 s und 14 % fuer
  // 10 s. Verlangt ist nur, dass es nicht immer dieselbe ist und dass die
  // fruehe Grenze vorkommt.
  assert.ok(new Set(alle).size >= 4, `verschiedene Dauern: ${[...new Set(alle)].sort()}`);
  assert.ok(alle.includes(BEKEHREN.frueh));
});

test('einheiten AC-38: danach ruht der Moench 62 Sekunden - ein zweiter Befehl ist nur ein Gang', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 1, y0 + 5, 'moench');
  const erster = welt.einheitAnlegen('b', x0 + 7, y0 + 5, 'dorfbewohner');
  const zweiter = welt.einheitAnlegen('b', x0 + 7, y0 + 8, 'dorfbewohner');
  befehlen(welt, 'a', moench, erster);
  assert.ok(bisBekehrt(welt, erster, 'a'));
  assert.ok(moench.ruhtBis > welt.takt);
  const ruhtBis = moench.ruhtBis;
  assert.equal(ruhtBis - welt.takt, BEKEHREN.ruhe * TAKTE_PRO_SEKUNDE);
  befehlen(welt, 'a', moench, zweiter);
  assert.equal(moench.auftrag?.art, 'gehen', 'er ruht: nur hingehen');
  sekunden(welt, 30);
  assert.equal(zweiter.besitzer, 'b');
  // Nach der Ruhe geht es wieder.
  while (welt.takt < ruhtBis) welt.takten();
  befehlen(welt, 'a', moench, zweiter);
  assert.equal(moench.auftrag?.art, 'bekehren');
  assert.ok(bisBekehrt(welt, zweiter, 'a'));
});

test('einheiten AC-38: Gebaeude, Belagerung und Moenche bekehrt er nicht - der Befehl ist ein Gang', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 1, y0 + 5, 'moench');
  const ramme = welt.einheitAnlegen('b', x0 + 6, y0 + 3, 'ramme');
  const fremderMoench = welt.einheitAnlegen('b', x0 + 6, y0 + 7, 'moench');
  const haus = welt.gebaeudeAnlegen('b', 'haus', x0 + 8, y0 + 9);
  for (const ziel of [ramme, fremderMoench, haus]) {
    befehlen(welt, 'a', moench, ziel);
    assert.notEqual(moench.auftrag?.art, 'bekehren', ziel.art);
    assert.notEqual(moench.auftrag?.art, 'angreifen', ziel.art);
  }
  sekunden(welt, 15);
  assert.deepEqual([ramme.besitzer, fremderMoench.besitzer, haus.besitzer], ['b', 'b', 'b']);
});

test('einheiten AC-38: steht das Ziel weiter als 9 Felder, geht er erst hin - die Zeit laeuft erst in Reichweite', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0, y0 + 5, 'moench');
  const bauer = welt.einheitAnlegen('b', x0 + 10, y0 + 10, 'dorfbewohner');
  assert.ok(Math.hypot(bauer.x - moench.x, bauer.y - moench.y) > BEKEHREN.reichweite);
  befehlen(welt, 'a', moench, bauer);
  welt.takten();
  assert.ok(moench.weg.length > 0, 'unterwegs');
  // Unterwegs zaehlt nichts: der Fortschritt bleibt bei null, bis er in
  // Reichweite ist.
  let unterwegs = 0;
  while (Math.hypot(bauer.x - moench.x, bauer.y - moench.y) > BEKEHREN.reichweite) {
    assert.equal(moench.auftrag.fortschritt, 0, 'ausser Reichweite laeuft keine Zeit');
    welt.takten();
    unterwegs++;
  }
  assert.ok(unterwegs > 0, 'er ging tatsaechlich');
  assert.ok(bisBekehrt(welt, bauer, 'a'), 'bekehrt');
  assert.ok(Math.hypot(bauer.x - moench.x, bauer.y - moench.y) <= BEKEHREN.reichweite, 'aus der Reichweite');
});

test('einheiten AC-38: wer bekehrt ist, tut nichts mehr fuer Bert - Annas Angreifer lassen ab, Bert zaehlt einen Verlust', () => {
  const { welt, anna, x0, y0 } = ritterzeitMitPlatz();
  const bert = welt.spielerVon('b');
  const moench = welt.einheitAnlegen('a', x0 + 1, y0 + 5, 'moench');
  const bauer = welt.einheitAnlegen('b', x0 + 7, y0 + 5, 'dorfbewohner');
  // Annas Miliz greift denselben Bauern an, von weiter weg.
  const miliz = welt.einheitAnlegen('a', x0 + 7, y0 + 1, 'miliz');
  befehlen(welt, 'a', miliz, bauer);
  assert.equal(miliz.auftrag?.art, 'angreifen');
  befehlen(welt, 'a', moench, bauer);
  const verlorenVorher = [anna.verloren, bert.verloren];
  assert.ok(bisBekehrt(welt, bauer, 'a'));
  assert.equal(bauer.tot, undefined, 'er lebt');
  assert.equal(miliz.auftrag, null, 'die Miliz laesst ab');
  assert.equal(bauer.auftrag, null);
  assert.deepEqual([anna.verloren, bert.verloren], [verlorenVorher[0], verlorenVorher[1] + 1]);
  sekunden(welt, 3);
  assert.equal(bauer.tot, undefined, 'und lebt weiter');
});

test('einheiten AC-38: im Zustand - `w` waehrend er bekehrt, `r` waehrend er ruht', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 1, y0 + 5, 'moench');
  const bauer = welt.einheitAnlegen('b', x0 + 7, y0 + 5, 'dorfbewohner');
  befehlen(welt, 'a', moench, bauer);
  welt.takten();
  const eintrag = () => welt.zustandJeSpieler(['a']).get('a').einheiten.find((e) => e.i === moench.id);
  assert.equal(eintrag().w, 1);
  assert.equal(eintrag().r, undefined);
  assert.ok(bisBekehrt(welt, bauer, 'a'));
  welt.takten();
  assert.equal(eintrag().w, undefined);
  assert.equal(eintrag().r, 1);
  const aufbau = welt.aufbauFuer('a');
  assert.deepEqual(aufbau.werte.einheiten.moench.bekehren, { reichweite: 9, nicht: ['belagerung', 'moench'] });
});

// Aus der Durchsicht der Runde 135: vier Faelle am Rand des Bekehrens.

test('einheiten AC-38: wer das Bekehren mit einem Gang abbricht, arbeitet nicht mehr - auch im Zustand nicht', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 1, y0 + 5, 'moench');
  const bauer = welt.einheitAnlegen('b', x0 + 7, y0 + 5, 'dorfbewohner');
  befehlen(welt, 'a', moench, bauer);
  welt.takten();
  const eintrag = () => welt.zustandJeSpieler(['a']).get('a').einheiten.find((e) => e.i === moench.id);
  assert.equal(eintrag().w, 1);
  befehlen(welt, 'a', moench, { x: x0 + 1, y: y0 + 9 });
  welt.takten();
  assert.equal(moench.auftrag?.art, 'gehen');
  assert.equal(eintrag().w, undefined, 'kein "arbeitet" mehr');
  sekunden(welt, 12);
  assert.equal(bauer.besitzer, 'b', 'und bekehrt ist er nicht');
});

test('einheiten AC-38: ein Angreifer im Angriffslauf geht nach dem Bekehren seines Ziels weiter zum Marschziel', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 1, y0 + 5, 'moench');
  const bauer = welt.einheitAnlegen('b', x0 + 7, y0 + 5, 'dorfbewohner');
  const miliz = welt.einheitAnlegen('a', x0 + 7, y0 + 1, 'miliz');
  // Die Miliz zieht im Angriffslauf ans andere Ende des Platzes und nimmt den
  // Bauern unterwegs mit; dann bekehrt ihn der Moench.
  const marsch = { x: x0 + 9, y: y0 + 10 };
  welt.nachricht('a', { einheiten: [miliz.id], ziel: marsch, angriffslauf: true });
  for (let t = 0; t < 10 * TAKTE_PRO_SEKUNDE && miliz.auftrag?.art !== 'angreifen'; t++) welt.takten();
  assert.equal(miliz.auftrag?.art, 'angreifen', 'sie greift den Bauern an');
  // Der Bauer haelt durch, bis er bekehrt ist.
  bauer.leben = 10_000;
  befehlen(welt, 'a', moench, bauer);
  assert.ok(bisBekehrt(welt, bauer, 'a'));
  assert.equal(miliz.auftrag?.art, 'gehen', 'weiter zum Marschziel');
  assert.deepEqual(miliz.auftrag.feld, marsch);
});

test('einheiten AC-38: ein Schlag aus demselben Takt trifft den eben Bekehrten nicht mehr', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const bauer = welt.einheitAnlegen('b', x0 + 7, y0 + 5, 'dorfbewohner');
  const miliz = welt.einheitAnlegen('a', x0 + 6, y0 + 5, 'miliz');
  const fremde = welt.einheitAnlegen('b', x0 + 8, y0 + 5, 'miliz');
  welt.schlaege.push({ angreifer: miliz, ziel: bauer, schaden: 4, gebaeude: false });
  welt.schlaege.push({ angreifer: fremde, ziel: bauer, schaden: 4, gebaeude: false });
  welt.bekehrt(bauer, 'a');
  assert.deepEqual(welt.schlaege.map((s) => s.angreifer.id), [fremde.id], 'nur der Schlag des Gegners bleibt');
});

test('einheiten AC-38: kommt der Moench nicht hin, gibt er auf statt ewig zu warten', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 - 1, y0 + 5, 'moench');
  const bauer = welt.einheitAnlegen('b', x0 + 9, y0 + 5, 'dorfbewohner');
  // Berts Bauer steht in einem Ring aus Mauern, zehn Felder vom Moench.
  for (let y = y0 + 4; y <= y0 + 6; y++) {
    for (let x = x0 + 8; x <= x0 + 10; x++) if (x !== x0 + 9 || y !== y0 + 5) welt.gebaeudeAnlegen('b', 'steinmauer', x, y, true);
  }
  assert.ok(Math.hypot(bauer.x - moench.x, bauer.y - moench.y) > BEKEHREN.reichweite);
  befehlen(welt, 'a', moench, bauer);
  sekunden(welt, 3);
  assert.equal(moench.auftrag, null, 'kein ewiges Warten');
  assert.equal(bauer.besitzer, 'b');
});
