// Das Wunder (bauen AC-51) und der Sieg durch das Wunder (spielziel AC-29) -
// Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE, WUNDER_SEKUNDEN, KUENDIGUNG_SEKUNDEN } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, EINHEITEN } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const DREI = [...ZWEI, { id: 'c', name: 'Carla' }];
const UHR = WUNDER_SEKUNDEN * TAKTE_PRO_SEKUNDE;

const takten = (welt, sekunden) => {
  for (let t = 0; t < sekunden * TAKTE_PRO_SEKUNDE; t++) welt.takten();
};

/** Ein freier Platz fuer `art`, ab `abstand` Feldern von `mitte` gesucht. */
function platzUm(welt, art, mitte, abstand = 3) {
  for (let r = abstand; r < 40; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = Math.round(mitte.x) + dx;
        const y = Math.round(mitte.y) + dy;
        if (welt.platzPruefen(art, x, y)) return { x, y };
      }
    }
  }
  throw new Error('kein Platz');
}

/** Anna in der Krone mit genug fuer zwei Wunder; ihre Dorfbewohner bleiben. */
function inDerKrone(spieler = ZWEI, einstellungen = {}) {
  const welt = new Welt(spieler, 11, { sicht: 'aufgedeckt', ...einstellungen });
  welt.tiere.clear();
  const anna = welt.spielerVon('a');
  anna.zeitalter = 3;
  Object.assign(anna, { holz: 5000, stein: 5000, gold: 5000 });
  return { welt, anna };
}

/** Ein fertiges Wunder fuer `wer`, fuenf Felder vor seinem Dorf. */
function wunderHin(welt, wer = 'a') {
  const p = platzUm(welt, 'wunder', welt.spielerVon(wer).basis, 6);
  return welt.gebaeudeAnlegen(wer, 'wunder', p.x, p.y, true);
}

/** Die Uhr eines Wunders vorspulen, bis `rest` Takte uebrig sind. */
function vorspulen(welt, wunder, rest) {
  welt.wunderUhren();
  wunder.wunderAb = welt.takt - UHR + rest;
}

test('bauen AC-51: das Wunder - fuenf mal fuenf Felder, je 1000 Holz, Stein und Gold, 4800 Leben, 3/10, erst in der Krone, hoechstens eines je Spieler', () => {
  const w = GEBAEUDE.wunder;
  assert.deepEqual([w.groesse, w.kosten, w.leben, w.nahruestung, w.fernruestung, w.bauzeit, w.zeitalter],
    [5, { holz: 1000, stein: 1000, gold: 1000 }, 4800, 3, 10, 4400, 3]);
  const { welt, anna } = inDerKrone();
  const bauer = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner').map((e) => e.id);
  const p = platzUm(welt, 'wunder', anna.basis, 6);

  anna.zeitalter = 2;
  assert.match(welt.nachricht('a', { auftrag: 'bauen', einheiten: bauer, art: 'wunder', ziel: p }).fehler, /erst/);
  anna.zeitalter = 3;
  assert.equal(welt.nachricht('a', { auftrag: 'bauen', einheiten: bauer, art: 'wunder', ziel: p }).fehler, undefined);
  assert.deepEqual([anna.holz, anna.stein, anna.gold], [4000, 4000, 4000], 'bezahlt beim Setzen');
  const baustelle = [...welt.gebaeude.values()].find((g) => g.art === 'wunder');
  const { x0, y0, x1, y1 } = welt.grundflaeche('wunder', baustelle.x, baustelle.y);
  assert.deepEqual([x1 - x0 + 1, y1 - y0 + 1], [5, 5]);

  // Schon die Baustelle zaehlt: ein zweites gibt es nicht, auch nicht bezahlt.
  const q = platzUm(welt, 'wunder', anna.basis, 14);
  assert.match(welt.nachricht('a', { auftrag: 'bauen', einheiten: bauer, art: 'wunder', ziel: q }).fehler, /nur einmal je Spieler/);
  assert.equal(anna.holz, 4000);
  // Bert darf seines bauen - die Grenze gilt je Spieler.
  const bert = welt.spielerVon('b');
  Object.assign(bert, { zeitalter: 3, holz: 1000, stein: 1000, gold: 1000 });
  const bertsBauer = [...welt.einheiten.values()].filter((e) => e.besitzer === 'b' && e.art === 'dorfbewohner').map((e) => e.id);
  assert.equal(welt.nachricht('b', { auftrag: 'bauen', einheiten: bertsBauer, art: 'wunder', ziel: platzUm(welt, 'wunder', bert.basis, 6) }).fehler, undefined);
});

test('bauen AC-51: es bildet nichts aus, schiesst nicht und gibt keinen Wohnraum', () => {
  const { welt } = inDerKrone();
  const vorher = welt.wohnraum('a');
  const wunder = wunderHin(welt);
  assert.equal(welt.wohnraum('a'), vorher, 'kein Wohnraum');
  assert.ok(!GEBAEUDE.wunder.bildetAus.length, 'bildet nichts aus');
  assert.match(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: wunder.id, art: 'dorfbewohner' }).fehler || '', /.+/);
  const { x1, y0 } = welt.grundflaeche('wunder', wunder.x, wunder.y);
  const feind = welt.einheitAnlegen('b', x1 + 2, y0, 'miliz');
  takten(welt, 5);
  assert.equal(feind.leben, EINHEITEN.miliz.leben, 'zwei Felder daneben unversehrt');
});

test('bauen AC-51: zwanzig Bauer brauchen acht bis zwoelf Spielminuten', () => {
  const { welt, anna } = inDerKrone();
  for (const e of [...welt.einheiten.values()]) welt.einheiten.delete(e.id);
  const p = platzUm(welt, 'wunder', anna.basis, 8);
  const { x0, y0, x1, y1 } = welt.grundflaeche('wunder', p.x, p.y);
  // Zwanzig Dorfbewohner rundum, zwei Felder vom Rand - so stehen sie, wenn
  // sie vom Holz oder vom Dorf her kommen.
  const rand = [];
  for (let x = x0 - 2; x <= x1 + 2; x++) rand.push({ x, y: y0 - 2 }, { x, y: y1 + 2 });
  for (let y = y0 - 1; y <= y1 + 1; y++) rand.push({ x: x0 - 2, y }, { x: x1 + 2, y });
  const frei = rand.filter((f) => welt.platzPruefen('haus', f.x, f.y));
  assert.ok(frei.length >= 20, `Platz fuer zwanzig: ${frei.length}`);
  const bauer = frei.slice(0, 20).map((f) => welt.einheitAnlegen('a', f.x, f.y, 'dorfbewohner').id);
  assert.equal(welt.nachricht('a', { auftrag: 'bauen', einheiten: bauer, art: 'wunder', ziel: p }).fehler, undefined);
  const wunder = [...welt.gebaeude.values()].find((g) => g.art === 'wunder');
  let takte = 0;
  while (!wunder.fertig && takte < 20 * 60 * TAKTE_PRO_SEKUNDE) {
    welt.takten();
    takte++;
  }
  const minuten = takte / TAKTE_PRO_SEKUNDE / 60;
  console.log(`Zwanzig Bauer: ${minuten.toFixed(2)} Spielminuten (ein Bauer allein: ${(GEBAEUDE.wunder.bauzeit / 60).toFixed(1)})`);
  assert.ok(wunder.fertig, 'fertig');
  assert.ok(minuten >= 8 && minuten <= 12, `${minuten.toFixed(2)} Minuten`);
});

test('spielziel AC-29: steht ein fertiges Wunder zehn Spielminuten, gewinnt sein Besitzer - alle sehen die Uhr, auch im Nebel', () => {
  const { welt } = inDerKrone(ZWEI, { sicht: 'nebel' });
  const wunder = wunderHin(welt);
  welt.takten();
  welt.sichtAktualisieren();
  const zustaende = welt.zustandJeSpieler(['a', 'b']);
  const [wer, rest, x, y] = zustaende.get('b').wu[0];
  assert.deepEqual([wer, rest], ['a', WUNDER_SEKUNDEN], 'Bert sieht Annas Wunder mit der Uhr, ohne es zu sehen');
  const { x0, y0, x1, y1 } = welt.grundflaeche('wunder', wunder.x, wunder.y);
  assert.deepEqual([x, y], [(x0 + x1) / 2, (y0 + y1) / 2], 'und wo es steht - fuer die Uebersichtskarte');
  assert.ok(!welt.siehtGebaeude('b', wunder), 'Bert sieht es tatsaechlich nicht');
  takten(welt, 30);
  assert.equal(welt.zustandJeSpieler(['b']).get('b').wu[0][1], WUNDER_SEKUNDEN - 30, 'die Uhr laeuft');

  vorspulen(welt, wunder, 2);
  welt.takten();
  assert.equal(welt.ende, null, 'eine Zehntelsekunde vorher noch nicht');
  welt.takten();
  assert.deepEqual([welt.ende?.gewinner, welt.ende?.grund], [['a'], 'wunder']);
  assert.equal(welt.ende.sieger, 'a');
});

test('spielziel AC-29: eine Baustelle hat keine Uhr; faellt das Wunder, endet sie, ein neues beginnt von vorn; mehrere laufen je fuer sich', () => {
  const { welt, anna } = inDerKrone();
  const bauer = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner').map((e) => e.id);
  welt.nachricht('a', { auftrag: 'bauen', einheiten: bauer, art: 'wunder', ziel: platzUm(welt, 'wunder', anna.basis, 6) });
  welt.takten();
  assert.equal(welt.zustand().wu, undefined, 'die Baustelle hat keine Uhr');

  const zweite = inDerKrone();
  const erstes = wunderHin(zweite.welt);
  takten(zweite.welt, 100);
  zweite.welt.gebaeudeZerstoeren(erstes);
  zweite.welt.takten();
  assert.equal(zweite.welt.zustand().wu, undefined, 'mit ihm faellt die Uhr');
  const neues = wunderHin(zweite.welt);
  zweite.welt.takten();
  assert.equal(zweite.welt.zustand().wu[0][1], WUNDER_SEKUNDEN, 'das neue beginnt von vorn');

  // Bert hat seines spaeter: jede Uhr fuer sich, Anna gewinnt zuerst.
  const bert = wunderHin(zweite.welt, 'b');
  takten(zweite.welt, 50);
  // Auf eine Sekunde genau: die Uhr beginnt mit dem Takt, in dem es fertig ist.
  for (const [wer, rest] of zweite.welt.zustand().wu) {
    assert.ok(rest >= WUNDER_SEKUNDEN - 50 && rest <= WUNDER_SEKUNDEN - 49, `${wer}: ${rest} s`);
  }
  vorspulen(zweite.welt, bert, 20);
  vorspulen(zweite.welt, neues, 10);
  takten(zweite.welt, 1);
  assert.deepEqual(zweite.welt.ende?.gewinner, ['a']);
});

test('spielziel AC-29: das Team gewinnt mit, auch wer ausgeschieden ist; nach einer Kuendigung, wer dann noch verbuendet ist; die Zeitgrenze zuerst ist unentschieden', () => {
  // Anna und Carla gegen Bert.
  const team = inDerKrone(DREI, { teams: { a: 1, b: 2, c: 1 } });
  const wunder = wunderHin(team.welt);
  const carla = team.welt.spielerVon('c');
  carla.aus = true;
  vorspulen(team.welt, wunder, 1);
  team.welt.takten();
  assert.deepEqual([[...team.welt.ende.gewinner].sort(), team.welt.ende.team], [['a', 'c'], 1]);

  // Anna kuendigt: die Uhr laeuft weiter, nach der Frist gewinnt sie allein.
  const los = inDerKrone(DREI, { teams: { a: 1, b: 2, c: 1 } });
  const seins = wunderHin(los.welt);
  assert.deepEqual(los.welt.nachricht('a', { auftrag: 'kuendigen' }), {});
  takten(los.welt, KUENDIGUNG_SEKUNDEN + 1);
  const rest = los.welt.zustand().wu[0][1];
  assert.ok(rest <= WUNDER_SEKUNDEN - KUENDIGUNG_SEKUNDEN && rest >= WUNDER_SEKUNDEN - KUENDIGUNG_SEKUNDEN - 1, `die Uhr lief weiter: ${rest} s`);
  vorspulen(los.welt, seins, 1);
  los.welt.takten();
  assert.deepEqual([los.welt.ende.gewinner, los.welt.ende.team ?? null], [['a'], null]);

  // Laeuft die Zeitgrenze im selben Takt ab, bleibt es beim Unentschieden.
  const grenze = inDerKrone(ZWEI, { zeitgrenze: 90 });
  const knapp = wunderHin(grenze.welt);
  grenze.welt.takt = 90 * 60 * TAKTE_PRO_SEKUNDE - 1;
  vorspulen(grenze.welt, knapp, 1);
  grenze.welt.takten();
  assert.deepEqual([grenze.welt.ende.grund, grenze.welt.ende.gewinner], ['zeit', []]);
});
