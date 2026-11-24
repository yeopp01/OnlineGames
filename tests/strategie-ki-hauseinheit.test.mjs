// Die KI bildet die Einheit ihres Hauses aus der Burg aus (ki AC-28), sparsam:
// hoechstens ein Viertel ihrer Kampfeinheiten, aber immer zwei. Welche Einheit,
// sagen die Daten der Burg und `haeuser` an der Einheit - keine Liste von Namen.
//
// Gebaute Lagen; ob sie in ganzen Partien dazu kommt, zaehlt
// `tests/partien/ki-im-nebel.test.mjs`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, EINHEITEN, HAEUSER } = require('../server/spiele/strategie/daten.js');
const { Ki, HAUSEINHEIT_ANTEIL, HAUSEINHEIT_MINDESTENS } = require('../server/spiele/strategie/ki.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

const gebaeudeVon = (welt, id) => [...welt.gebaeude.values()].filter((g) => g.besitzer === id);
const lebende = (welt, id) => [...welt.einheiten.values()].filter((e) => e.besitzer === id && !e.tot);
const dorf = (welt, id) => lebende(welt, id).filter((e) => e.art === 'dorfbewohner');

/** Die Einheit eines Hauses aus der Burg, gelesen aus den Daten. */
const einheitDesHauses = (haus) => GEBAEUDE.burg.bildetAus.filter((a) => EINHEITEN[a]?.haeuser?.includes(haus));

/** Ein fertiges Gebaeude fuer Anna, der erste freie Platz etwa `d` Felder von ihrem Dorf. */
function bauen(welt, a, art, d) {
  for (let w = 0; w < 360; w += 15) {
    const x = Math.round(a.basis.x + d * Math.cos((w * Math.PI) / 180));
    const y = Math.round(a.basis.y + d * Math.sin((w * Math.PI) / 180));
    if (welt.platzPruefen(art, x, y)) return welt.gebaeudeAnlegen('a', art, x, y);
  }
  throw new Error(`kein Platz fuer ${art}`);
}

/**
 * Anna im Fuerstentum mit Haus `haus`, einer fertigen Burg, `kampf` Kampfeinheiten
 * der Kaserne, `hauseinheiten` der eigenen aus der Burg und `vorrat` von allem.
 */
function lage({ haus = 'eschenbruch', kampf = 4, hauseinheiten = 0, vorrat = 3000, burg = true } = {}) {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt', haeuser: { a: haus, b: 'rappenstein' } });
  for (const s of welt.spieler) s.zeitalter = 2;
  const a = welt.spielerVon('a');
  Object.assign(a, { holz: vorrat, nahrung: vorrat, gold: vorrat, stein: vorrat, gefallene: 5 });
  const [eigene] = einheitDesHauses(haus);
  for (let i = 0; i < kampf + hauseinheiten; i++) {
    welt.einheitAnlegen('a', a.basis.x - 6 + (i % 8), a.basis.y + 6 + Math.floor(i / 8), i < hauseinheiten ? eigene : 'speerkaempfer');
  }
  const g = burg ? bauen(welt, a, 'burg', 12) : null;
  const ki = new Ki(welt, 'a');
  const gesendet = [];
  const senden = ki.senden.bind(ki);
  ki.senden = (n) => { gesendet.push(n); return senden(n); };
  return { welt, ki, gesendet, burg: g, eigene };
}

const pruefen = ({ welt, ki }) => ki.burgPruefen(lebende(welt, 'a'), gebaeudeVon(welt, 'a'), dorf(welt, 'a'));
const ausBurg = ({ gesendet, burg }) => gesendet.filter((n) => n.auftrag === 'ausbilden' && burg && n.gebaeude === burg.id);

test('ki AC-28: jedes Haus bildet in seiner Burg die eigene Einheit aus - gelesen aus den Daten der Burg', () => {
  for (const haus of Object.keys(HAEUSER).filter((h) => einheitDesHauses(h).length)) {
    const l = lage({ haus });
    pruefen(l);
    const bestellt = ausBurg(l);
    assert.equal(bestellt.length, 1, `${haus}: eine Bestellung in der Burg`);
    assert.equal(bestellt[0].einheit, l.eigene, `${haus}: die Einheit des Hauses`);
    assert.ok(l.burg.schlange.includes(l.eigene), `${haus}: der Server hat sie angenommen`);
  }
});

test('ki AC-28: sparsam - nicht mehr als ein Viertel der Kampfeinheiten, aber immer zwei', () => {
  assert.equal(HAUSEINHEIT_MINDESTENS, 2);
  assert.equal(HAUSEINHEIT_ANTEIL, 0.25);
  // Vier Speerkaempfer und schon zwei eigene: das Mindeste steht, ein Viertel waere weniger.
  const genug = lage({ kampf: 4, hauseinheiten: 2 });
  pruefen(genug);
  assert.equal(ausBurg(genug).length, 0, 'zwei von sechs: keine weitere');
  // Eine eigene: die zweite kommt, auch bei kleinem Heer.
  const eine = lage({ kampf: 2, hauseinheiten: 1 });
  pruefen(eine);
  assert.equal(ausBurg(eine).length, 1, 'eine von drei: die zweite');
  // Zwanzig Speerkaempfer und drei eigene: ein Viertel von 23 ist 5,75 - noch eine.
  const gross = lage({ kampf: 20, hauseinheiten: 3 });
  pruefen(gross);
  assert.equal(ausBurg(gross).length, 1, 'drei von 23: noch eine');
  // Eingereihte zaehlen mit: steht schon eine in einer Schlange, nicht noch eine.
  const eingereiht = lage({ kampf: 2, hauseinheiten: 1 });
  // (gezaehlt wird jede Schlange - hier die einer zweiten Burg)
  const zweite = bauen(eingereiht.welt, eingereiht.welt.spielerVon('a'), 'burg', 20);
  zweite.schlange.push(eingereiht.eigene);
  pruefen(eingereiht);
  assert.equal(ausBurg(eingereiht).length, 0, 'die zweite steht schon in einer Schlange');
});

test('ki AC-28: nicht ohne fertige Burg, nicht mit voller Schlange, nicht unbezahlt, nicht solange das Heer auf Rammen wartet', () => {
  const ohne = lage({ burg: false });
  pruefen(ohne);
  assert.equal(ohne.gesendet.length, 0, 'ohne Burg');
  const voll = lage();
  voll.burg.schlange.push(voll.eigene);
  pruefen(voll);
  assert.equal(ausBurg(voll).length, 0, 'Schlange nicht leer');
  const arm = lage({ vorrat: 20 });
  pruefen(arm);
  assert.equal(ausBurg(arm).length, 0, 'unbezahlt');
  const rammen = lage();
  rammen.ki.belagerungFehlt = true;
  pruefen(rammen);
  assert.equal(ausBurg(rammen).length, 0, 'das Heer wartet auf Rammen');
});
