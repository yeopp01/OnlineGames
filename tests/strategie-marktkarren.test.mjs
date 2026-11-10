// Der Marktkarren (einheiten AC-39) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md). Ausgebildet und befohlen wird ueber
// `welt.nachricht`, denselben Weg, den der Browser nimmt. Was er handelt,
// kommt mit AC-40. Die Oberflaeche: e2e/tests/strategie-marktkarren.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE } = require('../server/spiele/strategie/daten.js');

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

const karrenVon = (welt, wer) => [...welt.einheiten.values()].filter((e) => e.art === 'marktkarren' && e.besitzer === wer && !e.tot);

test('einheiten AC-39: der Marktkarren mit den Werten der Vorlage - 100 Holz, 50 Gold, 70 Leben, 0/0, Tempo 1,0, greift nicht an', () => {
  const k = EINHEITEN.marktkarren;
  assert.deepEqual([k.leben, k.tempo, k.nahruestung, k.fernruestung], [70, 1.0, 0, 0]);
  assert.deepEqual(k.kosten, { holz: 100, gold: 50 });
  assert.equal(k.angriff, 0, 'er greift nie an');
  assert.equal(k.wacht, false, 'ohne Angriff wacht er nicht');
  assert.equal(k.zeitalter, 2, 'erst ab der Ritterzeit - Abweichung nach ADR-0013');
  assert.ok(GEBAEUDE.markt.bildetAus.includes('marktkarren'), 'der Markt bildet ihn aus');
  // Nur der Markt: kein anderes Gebaeude bietet ihn an.
  const anbieter = Object.keys(GEBAEUDE).filter((art) => GEBAEUDE[art].bildetAus?.includes('marktkarren'));
  assert.deepEqual(anbieter, ['markt']);
});

test('einheiten AC-39: am Markt erst in der Ritterzeit ausgebildet - bezahlt beim Bestellen, nach seiner Zeit steht er da und belegt einen Wohnplatz', () => {
  const { welt, anna, x0, y0 } = ritterzeitMitPlatz();
  const markt = welt.gebaeudeAnlegen('a', 'markt', x0 + 4, y0 + 4);
  const bestellen = () => welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: markt.id, einheit: 'marktkarren' });
  anna.zeitalter = 1;
  assert.match(bestellen().fehler, /Ritterzeit/, 'in der Feudalzeit noch nicht');
  anna.zeitalter = 2;
  const vorher = { holz: anna.holz, gold: anna.gold };
  const belegt = welt.bevoelkerung().get('a');
  assert.deepEqual(bestellen(), {});
  assert.deepEqual({ holz: anna.holz, gold: anna.gold }, { holz: vorher.holz - 100, gold: vorher.gold - 50 });
  const zeit = EINHEITEN.marktkarren.zeit;
  sekunden(welt, zeit - 1);
  assert.equal(karrenVon(welt, 'a').length, 0, `nach ${zeit - 1} Sekunden noch nicht`);
  sekunden(welt, 2);
  const [karren] = karrenVon(welt, 'a');
  assert.ok(karren, `nach ${zeit} Sekunden steht er da`);
  assert.equal(karren.leben, 70);
  assert.equal(welt.bevoelkerung().get('a'), belegt + 1, 'ein Wohnplatz');
});

test('einheiten AC-39: ein Befehl auf einen Fremden ist ein Gang - er geht hin und schlaegt nicht', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const karren = welt.einheitAnlegen('a', x0 + 1, y0 + 5, 'marktkarren');
  // Ein Moench wehrt sich nicht und greift nicht an - so bleibt nur, was der Karren tut.
  const fremder = welt.einheitAnlegen('b', x0 + 8, y0 + 5, 'moench');
  const haus = welt.gebaeudeAnlegen('b', 'haus', x0 + 8, y0 + 8);
  for (const ziel of [fremder, haus]) {
    welt.nachricht('a', { einheiten: [karren.id], ziel: { x: ziel.x, y: ziel.y } });
    assert.notEqual(karren.auftrag?.art, 'angreifen', ziel.art);
  }
  const lebenVorher = [fremder.leben, haus.leben];
  const start = { x: karren.x, y: karren.y };
  sekunden(welt, 10);
  assert.ok(Math.hypot(karren.x - start.x, karren.y - start.y) > 3, 'er ist gegangen');
  assert.deepEqual([fremder.leben, haus.leben], lebenVorher, 'niemand hat einen Schlag bekommen');
});

test('einheiten AC-39: er wacht nicht - ein Feind neben ihm wird nicht angegriffen, ein Schlag trifft ihn mit vollem Schaden', () => {
  const { welt, x0, y0 } = ritterzeitMitPlatz();
  const karren = welt.einheitAnlegen('a', x0 + 3, y0 + 5, 'marktkarren');
  const miliz = welt.einheitAnlegen('b', x0 + 4, y0 + 5, 'miliz');
  const lebenMiliz = miliz.leben;
  sekunden(welt, 6);
  assert.equal(miliz.leben, lebenMiliz, 'der Karren hat nicht zugeschlagen');
  assert.notEqual(karren.auftrag?.art, 'angreifen');
  // Die Miliz wacht und schlaegt zu: Rueestung 0, also der volle Angriff.
  assert.ok(karren.tot || karren.leben < 70, 'die Miliz hat ihn getroffen');
  if (!karren.tot) assert.equal((70 - karren.leben) % welt.einheitenwert('b', 'miliz', 'angriff'), 0, 'je Schlag der volle Angriff der Miliz');
});

// ---- einheiten AC-40: der Karren handelt ----------------------------------

const DREI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }, { id: 'c', name: 'Cora' }];

/**
 * Eine Welt in der Ritterzeit mit Annas Heimatmarkt neben ihrem Dorf. `markt`
 * stellt fuer `wer` einen fertigen Markt etwa `d` Felder von der Heimat auf
 * (der erste freie Platz auf einem Kreis darum).
 */
function handelswelt(spieler = ZWEI, einstellungen = {}) {
  const welt = new Welt(spieler, 7, { sicht: 'aufgedeckt', ...einstellungen });
  for (const s of welt.spieler) s.zeitalter = 2;
  const anna = welt.spielerVon('a');
  const S = welt.karte.groesse;
  const frei = (x, y) => x > 3 && y > 3 && x < S - 4 && y < S - 4 && welt.platzPruefen('markt', x, y);
  let heimat = null;
  for (let r = 6; r < 20 && !heimat; r++) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r]]) {
      if (!heimat && frei(anna.basis.x + dx, anna.basis.y + dy)) heimat = welt.gebaeudeAnlegen('a', 'markt', anna.basis.x + dx, anna.basis.y + dy);
    }
  }
  const markt = (wer, d) => {
    for (let w = 0; w < 360; w += 5) {
      const x = Math.round(heimat.x + d * Math.cos((w * Math.PI) / 180));
      const y = Math.round(heimat.y + d * Math.sin((w * Math.PI) / 180));
      if (frei(x, y)) return welt.gebaeudeAnlegen(wer, 'markt', x, y);
    }
    throw new Error(`kein Platz fuer einen Markt ${d} Felder von der Heimat`);
  };
  const karren = (wer = 'a') => welt.einheitAnlegen(wer, heimat.x + 3, heimat.y, 'marktkarren');
  const schicken = (k, ziel, wer = 'a') => welt.nachricht(wer, { einheiten: [k.id], ziel: { x: ziel.x, y: ziel.y } });
  return { welt, anna, heimat, markt, karren, schicken, S };
}

/** Takt fuer Takt bis `bedingung` gilt, hoechstens `s` Sekunden; die Takte bis dahin. */
function bis(welt, bedingung, s = 600) {
  for (let t = 0; t < s * TAKTE_PRO_SEKUNDE; t++) {
    welt.takten();
    if (bedingung()) return t + 1;
  }
  throw new Error(`nach ${s} Sekunden nicht erreicht`);
}

test('einheiten AC-40: ein Rechtsklick auf einen zweiten eigenen Markt schickt ihn auf die Strecke - er laedt dort Gold, bringt es heim, und erst dort gehoert es dem Spieler', () => {
  const { welt, anna, heimat, markt, karren, schicken } = handelswelt();
  const ziel = markt('a', 40);
  const k = karren();
  schicken(k, ziel);
  assert.equal(k.auftrag?.art, 'handel');
  assert.deepEqual([k.auftrag.heimat, k.auftrag.ziel], [heimat.id, ziel.id], 'Heimat ist der naechste eigene Markt, Ziel der geklickte');
  const gewinn = welt.handelsgewinn(heimat, ziel);
  assert.ok(gewinn > 0);
  const gold = anna.gold;

  // Am Ziel laedt er; das Gold ist noch nicht beim Spieler.
  bis(welt, () => k.ladung > 0);
  assert.ok(welt.abstandZu(k, ziel) <= 3.5, 'geladen wird am Zielmarkt');
  assert.deepEqual([k.ladung, k.ladungsart], [gewinn, 'gold']);
  assert.equal(anna.gold, gold, 'unterwegs gehoert es noch niemandem');
  const gesammelt = anna.gesammelt.gold;

  // Daheim gehoert es ihr - und er faehrt wieder los.
  bis(welt, () => anna.gold > gold);
  assert.equal(anna.gold, gold + gewinn, 'genau das Gold einer Fahrt');
  assert.equal(anna.gesammelt.gold, gesammelt + gewinn, 'die Tafel zaehlt es mit (spielziel AC-8)');
  assert.ok(welt.abstandZu(k, heimat) <= 3.5, 'abgegeben am Heimatmarkt');
  assert.equal(k.ladung, 0);
  bis(welt, () => anna.gold > gold + gewinn);
  assert.equal(anna.gold, gold + 2 * gewinn, 'er pendelt: die zweite Fahrt bringt dasselbe');
  assert.equal(k.auftrag?.art, 'handel');
});

test('einheiten AC-40: der Markt eines Verbuendeten ist ein Ziel, der eines Gegners nicht - dorthin ist der Klick ein Gang', () => {
  const { welt, anna, markt, karren, schicken } = handelswelt(DREI, { teams: { a: 1, b: 1, c: 2 } });
  const freund = markt('b', 30);
  const feind = markt('c', 30);
  const k = karren();
  schicken(k, freund);
  assert.equal(k.auftrag?.art, 'handel', 'zum Verbuendeten');
  const gold = anna.gold;
  const bert = welt.spielerVon('b').gold;
  bis(welt, () => anna.gold > gold);
  assert.equal(welt.spielerVon('b').gold, bert, 'der Verbuendete bekommt nichts - sein Markt ist nur das Ziel');

  const k2 = karren();
  schicken(k2, feind);
  assert.equal(k2.auftrag?.art, 'gehen', 'zum Gegner geht er nur hin');
  const cora = karren('c');
  schicken(cora, feind, 'c');
  assert.notEqual(cora.auftrag?.art, 'handel', 'wer nur den einen Markt hat, faehrt keine Strecke');
});

test('einheiten AC-40: das Gold je Fahrt waechst mit dem Abstand schneller als dieser - und je Minute lohnt die lange Strecke mehr', () => {
  const { welt, heimat, markt } = handelswelt();
  const nah = welt.handelsgewinn(heimat, markt('a', 25));
  const fern = welt.handelsgewinn(heimat, markt('a', 50));
  assert.ok(fern > 2 * nah, `doppelter Abstand, mehr als doppeltes Gold: ${nah} -> ${fern}`);
  // Die Fahrt dauert doppelt so lang, bringt aber mehr als das Doppelte:
  // je Minute gewinnt die lange Strecke.
  const jeMinute = (d) => {
    const w = handelswelt();
    const ziel = w.markt('a', d);
    const k = w.karren();
    w.schicken(k, ziel);
    const zeiten = [];
    let gold = w.anna.gold;
    for (let t = 0; t < 15 * 60 * TAKTE_PRO_SEKUNDE; t++) {
      w.welt.takten();
      if (w.anna.gold !== gold) {
        zeiten.push(t);
        gold = w.anna.gold;
      }
    }
    // Gemessen von der ersten bis zur letzten Rueckkehr - der erste Weg zum
    // Ziel ist nur der Anlauf.
    const fahrten = zeiten.length - 1;
    return (fahrten * w.welt.handelsgewinn(w.heimat, ziel) * 60 * TAKTE_PRO_SEKUNDE) / (zeiten.at(-1) - zeiten[0]);
  };
  const [kurz, lang] = [jeMinute(25), jeMinute(50)];
  // Gemessen 14,9 und 17,6 Gold je Minute mit `faktor: 0.86` (Runde 161; das
  // Verhaeltnis haengt nicht am Faktor): der Weg ist laenger als
  // der Abstand der Mitten, um die Raender der Maerkte und um Wald herum.
  assert.ok(lang > kurz, `je Minute: ${kurz.toFixed(1)} auf 25 Felder, ${lang.toFixed(1)} auf 50`);
});

test('einheiten AC-40: faellt einer der Maerkte, bleibt er stehen - sofort, nicht erst am Ende des Weges', () => {
  for (const welcher of ['ziel', 'heimat']) {
    const { welt, heimat, markt, karren, schicken } = handelswelt();
    const ziel = markt('a', 40);
    // Noch ein eigener Markt, weit weg: faellt die Heimat, wird er nicht
    // stillschweigend die neue.
    markt('a', 60);
    const k = karren();
    schicken(k, ziel);
    sekunden(welt, 10);
    assert.ok(k.weg.length > 0, 'unterwegs');
    welt.gebaeudeZerstoeren(welcher === 'ziel' ? ziel : heimat);
    welt.takten();
    assert.equal(k.auftrag, null, `${welcher} gefallen: kein Auftrag mehr`);
    const stand = { x: k.x, y: k.y };
    sekunden(welt, 5);
    assert.deepEqual({ x: k.x, y: k.y }, stand, `${welcher} gefallen: er steht`);
  }
});

test('einheiten AC-40: auf halber Kartenbreite bringt ein Karren je Minute etwas weniger Gold als ein Dorfbewohner am Goldvorkommen', () => {
  // Der Dorfbewohner: am naechsten Goldfeld, das Bergbaulager zwei Felder
  // daneben - so stellt es die KI. Gemessen 20,0 Gold je Minute ueber acht
  // Startwerte (Runde 161), 0,38 je Sekunde beim Hacken.
  const dorf = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  const anna = dorf.spielerVon('a');
  const g = dorf.karte.groesse;
  let gold = null;
  let best = Infinity;
  for (let y = 0; y < g; y++) {
    for (let x = 0; x < g; x++) {
      const d = Math.hypot(x - anna.basis.x, y - anna.basis.y);
      if (dorf.karte.felder[y * g + x] === 4 && d < best) [best, gold] = [d, { x, y }];
    }
  }
  let lager = null;
  for (let r = 2; r <= 5 && !lager; r++) {
    for (let dy = -r; dy <= r && !lager; dy++) {
      for (let dx = -r; dx <= r && !lager; dx++) {
        if (dorf.platzPruefen('bergbaulager', gold.x + dx, gold.y + dy)) lager = dorf.gebaeudeAnlegen('a', 'bergbaulager', gold.x + dx, gold.y + dy);
      }
    }
  }
  const bauer = [...dorf.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  Object.assign(bauer, { x: gold.x + 1, y: gold.y });
  dorf.nachricht('a', { einheiten: [bauer.id], ziel: gold });
  const vorher = anna.gesammelt.gold;
  sekunden(dorf, 5 * 60);
  const dorfbewohner = (anna.gesammelt.gold - vorher) / 5;

  // Der Karren: zwei eigene Maerkte, eine halbe Kantenlaenge auseinander.
  const w = handelswelt();
  const ziel = w.markt('a', w.S / 2);
  const k = w.karren();
  w.schicken(k, ziel);
  const zeiten = [];
  let stand = w.anna.gold;
  for (let t = 0; t < 15 * 60 * TAKTE_PRO_SEKUNDE; t++) {
    w.welt.takten();
    if (w.anna.gold !== stand) {
      zeiten.push(t);
      stand = w.anna.gold;
    }
  }
  const karren = ((zeiten.length - 1) * w.welt.handelsgewinn(w.heimat, ziel) * 60 * TAKTE_PRO_SEKUNDE) / (zeiten.at(-1) - zeiten[0]);
  // "Etwas weniger" (der Benutzer, Runde 161): unter dem Dorfbewohner, aber
  // nicht weit - mehr als 80 %. Gemessen 18,0 gegen 20,0 mit `faktor: 0.77`;
  // mit dem Faktor der Vorlage (0,46) waeren es 10,7, mit 0,86 genau 20,0.
  assert.ok(karren > dorfbewohner * 0.8 && karren < dorfbewohner,
    `Karren ${karren.toFixed(1)}, Dorfbewohner ${dorfbewohner.toFixed(1)} Gold je Minute`);
});

test('einheiten AC-40: der Zustand traegt die Strecke - Heimat, Ziel und das Gold je Fahrt, nur solange er faehrt', () => {
  const { welt, heimat, markt, karren, schicken } = handelswelt();
  const ziel = markt('a', 30);
  const k = karren();
  const draht = () => welt.zustand().einheiten.find((e) => e.i === k.id);
  assert.equal(draht().hd, undefined, 'ohne Strecke nichts');
  schicken(k, ziel);
  assert.deepEqual(draht().hd, [heimat.id, ziel.id, welt.handelsgewinn(heimat, ziel)]);
  welt.nachricht('a', { einheiten: [k.id], ziel: { x: k.x + 2, y: k.y } });
  assert.equal(draht().hd, undefined, 'ein neuer Befehl beendet die Strecke');
});
