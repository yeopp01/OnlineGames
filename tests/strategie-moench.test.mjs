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

// --- einheiten AC-65: der Moench heilt auf Befehl ---------------------------

const klick = (welt, wer, einheiten, ziel) => welt.nachricht(wer, { einheiten: einheiten.map((e) => e.id), ziel: { x: ziel.x, y: ziel.y } });

test('einheiten AC-65: ein Rechtsklick auf einen Verletzten - der Moench heilt genau ihn, nicht den Naechsten', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 5, y0 + 5, 'moench');
  const nah = verletzt(welt, 'a', x0 + 6, y0 + 5, 'dorfbewohner', 15);
  const gemeint = verletzt(welt, 'a', x0 + 8, y0 + 5, 'miliz', 15);
  const [n0, g0] = [nah.leben, gemeint.leben];
  klick(welt, 'a', [moench], gemeint);
  assert.equal(moench.auftrag?.art, 'heilen');
  assert.equal(moench.auftrag.ziel, gemeint.id);
  sekunden(welt, 8);
  assert.equal(gemeint.leben, g0 + 8, 'acht Sekunden, acht Leben - er stand schon in Reichweite');
  assert.equal(nah.leben, n0, 'der Naehere bekommt solange nichts');
  assert.equal(moench.heilt, gemeint.id);
  // Ist der Gemeinte voll, ist der Auftrag erledigt, und er heilt wieder von selbst.
  sekunden(welt, 8);
  assert.equal(gemeint.leben, voll(welt, gemeint));
  assert.equal(moench.auftrag, null);
  sekunden(welt, 3);
  assert.ok(nah.leben > n0, 'danach ist der Naechste dran');
});

test('einheiten AC-65: steht der Verletzte weiter als vier Felder, geht der Moench hin und bleibt in Reichweite stehen', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 1, y0 + 5, 'moench');
  const miliz = verletzt(welt, 'a', x0 + 9, y0 + 5, 'miliz', 20);
  const vorher = miliz.leben;
  klick(welt, 'a', [moench], miliz);
  sekunden(welt, 3);
  assert.equal(miliz.leben, vorher, 'unterwegs heilt er nicht');
  assert.ok(moench.weg.length > 0, 'er geht hin');
  sekunden(welt, 12);
  const abstand = Math.hypot(miliz.x - moench.x, miliz.y - moench.y);
  assert.ok(abstand <= EINHEITEN.moench.heilen.reichweite, `in Reichweite: ${abstand}`);
  assert.ok(abstand > EINHEITEN.moench.heilen.reichweite - 1.5, `er geht nicht weiter als noetig: ${abstand}`);
  assert.ok(miliz.leben > vorher, 'angekommen heilt er');
});

test('einheiten AC-65: laeuft der Verletzte weg, geht der Moench nach', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 1, y0 + 2, 'moench');
  const bauer = verletzt(welt, 'a', x0 + 3, y0 + 2, 'dorfbewohner', 20);
  klick(welt, 'a', [moench], bauer);
  welt.nachricht('a', { einheiten: [bauer.id], ziel: { x: x0 + 10, y: y0 + 9 } });
  sekunden(welt, 25);
  assert.ok(Math.hypot(bauer.x - moench.x, bauer.y - moench.y) <= EINHEITEN.moench.heilen.reichweite + 0.5, 'er ist ihm gefolgt');
  assert.ok(bauer.leben > voll(welt, bauer) - 20, 'und hat ihn geheilt');
});

test('einheiten AC-65: ein Verbuendeter laesst sich heilen, ein Gegner nicht - und von selbst heilt er Verbuendete weiter nicht', () => {
  const welt = new Welt([...ZWEI, { id: 'c', name: 'Cem' }], 7, { sicht: 'aufgedeckt', teams: { a: 1, b: 1, c: 2 } });
  const anna = welt.spielerVon('a');
  const frei = (x, y) => welt.platzPruefen('haus', x, y) && welt.platzPruefen('haus', x + 3, y) && welt.platzPruefen('haus', x + 6, y);
  let ort = null;
  for (let r = 6; r < 30 && !ort; r++) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r]]) {
      if (frei(anna.basis.x + dx, anna.basis.y + dy)) { ort = { x: anna.basis.x + dx, y: anna.basis.y + dy }; break; }
    }
  }
  assert.ok(ort, 'ein freier Platz');
  const moench = welt.einheitAnlegen('a', ort.x, ort.y, 'moench');
  const freund = verletzt(welt, 'b', ort.x + 2, ort.y, 'dorfbewohner', 10);
  const gegner = verletzt(welt, 'c', ort.x + 6, ort.y, 'ramme', 50);
  const f0 = freund.leben;
  sekunden(welt, 3);
  assert.equal(freund.leben, f0, 'von selbst heilt er nur eigene (AC-37)');
  klick(welt, 'a', [moench], freund);
  assert.equal(moench.auftrag?.art, 'heilen');
  sekunden(welt, 4);
  assert.equal(freund.leben, f0 + 4);
  klick(welt, 'a', [moench], gegner);
  assert.notEqual(moench.auftrag?.art, 'heilen', 'eine fremde Ramme: weder heilen noch bekehren, ein Gang');
});

test('einheiten AC-65: keine Belagerung, nicht sich selbst, niemand mit vollem Leben - der Klick ist ein Gang', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 5, y0 + 5, 'moench');
  moench.leben -= 10;
  const ramme = verletzt(welt, 'a', x0 + 8, y0 + 5, 'ramme', 50);
  const gesund = welt.einheitAnlegen('a', x0 + 5, y0 + 9, 'miliz');
  for (const ziel of [ramme, gesund, moench]) {
    klick(welt, 'a', [moench], ziel);
    assert.notEqual(moench.auftrag?.art, 'heilen', ziel.art);
  }
  // Zwei Moenche, einer davon verletzt und angeklickt: der andere heilt ihn, er selbst geht nur.
  const zweiter = welt.einheitAnlegen('a', x0 + 2, y0 + 2, 'moench');
  klick(welt, 'a', [moench, zweiter], moench);
  assert.equal(zweiter.auftrag?.art, 'heilen');
  assert.notEqual(moench.auftrag?.art, 'heilen');
});

test('einheiten AC-65: solange das Ziel kaempft, wartet der Moench bei ihm - danach heilt er', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 5, y0 + 5, 'moench');
  const haus = welt.gebaeudeAnlegen('b', 'haus', x0 + 1, y0 + 1);
  const miliz = verletzt(welt, 'a', x0 + 3, y0 + 3, 'miliz', 10);
  welt.nachricht('a', { einheiten: [miliz.id], ziel: { x: haus.x, y: haus.y } });
  assert.equal(miliz.auftrag?.art, 'angreifen');
  const vorher = miliz.leben;
  klick(welt, 'a', [moench], miliz);
  assert.equal(moench.auftrag?.art, 'heilen');
  sekunden(welt, 5);
  assert.equal(miliz.leben, vorher, 'wer kaempft, wird nicht geheilt');
  assert.equal(moench.heilt, null);
  assert.equal(moench.auftrag?.art, 'heilen', 'der Auftrag bleibt');
  // Die Miliz hoert auf: jetzt heilt er.
  welt.nachricht('a', { einheiten: [miliz.id], ziel: { x: x0 + 4, y: y0 + 4 } });
  sekunden(welt, 6);
  assert.ok(miliz.leben > vorher);
});

test('einheiten AC-65: im Zustand arbeitet er erst in Reichweite (`w`), und ein neuer Befehl beendet es', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 1, y0 + 5, 'moench');
  const miliz = verletzt(welt, 'a', x0 + 9, y0 + 5, 'miliz', 30);
  const eintrag = () => welt.zustandJeSpieler(['a']).get('a').einheiten.find((e) => e.i === moench.id);
  klick(welt, 'a', [moench], miliz);
  sekunden(welt, 2);
  assert.equal(eintrag().w, undefined, 'unterwegs arbeitet er nicht');
  sekunden(welt, 10);
  assert.equal(eintrag().w, 1);
  assert.equal(typeof eintrag().zr, 'number', 'er schaut zu dem, den er heilt');
  welt.nachricht('a', { einheiten: [moench.id], ziel: { x: x0 + 1, y: y0 + 9 } });
  assert.equal(eintrag().w, undefined);
  assert.equal(moench.heilt, null);
});

test('einheiten AC-65: faellt das Ziel, ist der Auftrag erledigt', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 5, y0 + 5, 'moench');
  const miliz = verletzt(welt, 'a', x0 + 7, y0 + 5, 'miliz', 20);
  klick(welt, 'a', [moench], miliz);
  sekunden(welt, 2);
  welt.einheitSterben(miliz);
  sekunden(welt, 1);
  assert.equal(moench.auftrag, null);
  assert.equal(moench.heilt, null);
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
  assert.ok(eintrag().r > 0);
  const aufbau = welt.aufbauFuer('a');
  assert.deepEqual(aufbau.werte.einheiten.moench.bekehren, { reichweite: 9, ruhe: BEKEHREN.ruhe, nicht: ['belagerung', 'moench'] });
});

test('bedienung AC-68: der Zustand nennt, wie viele Sekunden der Moench noch ruht - von 62 herunter, dann nichts mehr', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 1, y0 + 5, 'moench');
  const bauer = welt.einheitAnlegen('b', x0 + 7, y0 + 5, 'dorfbewohner');
  befehlen(welt, 'a', moench, bauer);
  // Beide sehen ihn: die Ruhe ist kein Geheimnis.
  const eintrag = (wer = 'a') => welt.zustandJeSpieler([wer]).get(wer).einheiten.find((e) => e.i === moench.id);
  assert.ok(bisBekehrt(welt, bauer, 'a'));
  assert.equal(moench.ruhtBis - welt.takt, BEKEHREN.ruhe * TAKTE_PRO_SEKUNDE);
  assert.equal(eintrag().r, BEKEHREN.ruhe);
  assert.equal(eintrag('b').r, BEKEHREN.ruhe);
  // Ein Takt spaeter immer noch 62 (aufgerundet), nach einer Sekunde 61.
  welt.takten();
  assert.equal(eintrag().r, BEKEHREN.ruhe);
  for (let t = 1; t < TAKTE_PRO_SEKUNDE; t++) welt.takten();
  assert.equal(eintrag().r, BEKEHREN.ruhe - 1);
  // Nach zwanzig Sekunden 41, im letzten Takt 1, danach fehlt das Feld.
  for (let t = 0; t < 20 * TAKTE_PRO_SEKUNDE; t++) welt.takten();
  assert.equal(eintrag().r, BEKEHREN.ruhe - 21);
  while (moench.ruhtBis - welt.takt > 1) welt.takten();
  assert.equal(eintrag().r, 1);
  welt.takten();
  assert.equal(eintrag().r, undefined);
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

test('einheiten AC-38: Annas Turm und Burg schiessen nicht weiter auf den, der eben bekehrt wurde', () => {
  for (const art of ['wachturm', 'burg']) {
    const { welt, x0, y0 } = ritterzeitMitPlatz();
    const turm = welt.gebaeudeAnlegen('a', art, x0 + 1, y0 + 3, true);
    const ritter = welt.einheitAnlegen('b', x0 + 7, y0 + 3, 'ritter');
    sekunden(welt, 1);
    assert.equal(turm.ziel, ritter.id, `${art}: der Turm hat ihn zum Ziel`);
    assert.ok(ritter.leben < voll(welt, ritter), `${art}: und trifft`);
    welt.bekehrt(ritter, 'a');
    const leben = ritter.leben;
    sekunden(welt, 10);
    assert.equal(ritter.leben, leben, `${art}: nach der Bekehrung kein Schaden mehr`);
    assert.equal(turm.ziel, null, `${art}: und kein Ziel`);
  }
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

// --- bedienung AC-74: der Moench ist zu hoeren ------------------------------
// Der Browser spielt zwei verschiedene Klaenge; `w` allein sagte ihm nur,
// dass der Moench arbeitet.
test('bedienung AC-74: der Zustand sagt, ob der Moench bekehrt - `bk` nur dann, nicht beim Heilen und nicht in der Ruhe', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0 + 1, y0 + 5, 'moench');
  verletzt(welt, 'a', x0 + 2, y0 + 5, 'dorfbewohner', 12);
  const eintrag = (wer = 'a') => welt.zustandJeSpieler([wer]).get(wer).einheiten.find((e) => e.i === moench.id);
  sekunden(welt, 2);
  assert.equal(eintrag().w, 1, 'er heilt');
  assert.equal(eintrag().bk, undefined, 'und bekehrt nicht');

  const bauer = welt.einheitAnlegen('b', x0 + 7, y0 + 5, 'dorfbewohner');
  befehlen(welt, 'a', moench, bauer);
  welt.takten();
  assert.equal(eintrag().w, 1);
  assert.equal(eintrag().bk, 1, 'er bekehrt');
  // Auch Bert hoert den Gesang ueber seinem Dorfbewohner.
  assert.equal(eintrag('b').bk, 1);

  assert.ok(bisBekehrt(welt, bauer, 'a'));
  welt.takten();
  assert.equal(eintrag().bk, undefined, 'bekehrt ist bekehrt');
  assert.ok(eintrag().r > 0, 'er ruht');
});

test('bedienung AC-74: wer erst hingehen muss, bekehrt noch nicht - `bk` erst in Reichweite', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const moench = welt.einheitAnlegen('a', x0, y0, 'moench');
  const bauer = welt.einheitAnlegen('b', x0 + 10, y0 + 10, 'dorfbewohner');
  assert.ok(Math.hypot(10, 10) > BEKEHREN.reichweite);
  befehlen(welt, 'a', moench, bauer);
  welt.takten();
  const eintrag = () => welt.zustandJeSpieler(['a']).get('a').einheiten.find((e) => e.i === moench.id);
  assert.equal(eintrag().bk, undefined, 'er geht noch');
  let takte = 0;
  while (!eintrag().bk && takte < 200) { welt.takten(); takte += 1; }
  assert.equal(eintrag().bk, 1);
  assert.ok(Math.hypot(bauer.x - moench.x, bauer.y - moench.y) <= BEKEHREN.reichweite + 0.01);
});
