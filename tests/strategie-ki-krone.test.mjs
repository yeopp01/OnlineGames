// Die KI steigt in die Krone auf (ki AC-39): im Fuerstentum, nach ihrem
// ersten Aufbruch, ab Spielminute 40, mit freiem Dorfzentrum, vollem Dorf des Fuerstentums und
// einer Burg oder zwei Gebaeuden des Fuerstentums. Dafuer legt sie den Preis
// zurueck, und bis er bezahlt ist, bildet das Dorfzentrum niemanden aus.
//
// Gebaute Lagen; ob sie in ganzen Partien dorthin kommt, zaehlt
// `tests/partien/ki-im-nebel.test.mjs`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt } = require('../server/spiele/strategie/welt.js');
const { AUFSTIEGE } = require('../server/spiele/strategie/daten.js');
const { Ki, zielDorfbewohner, KRONE_DORF, KRONE_AB_MINUTE } = require('../server/spiele/strategie/ki.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

const gebaeudeVon = (welt, id) => [...welt.gebaeude.values()].filter((g) => g.besitzer === id);
const dorf = (welt, id) => [...welt.einheiten.values()].filter((e) => e.besitzer === id && !e.tot && e.art === 'dorfbewohner');
const zentrumVon = (welt, id) => gebaeudeVon(welt, id).find((g) => g.art === 'dorfzentrum');

/** Ein fertiges Gebaeude fuer Anna, der erste freie Platz etwa `d` Felder von ihrem Dorf. */
function bauen(welt, a, art, d) {
  for (let w = 0; w < 360; w += 15) {
    const x = Math.round(a.basis.x + d * Math.cos((w * Math.PI) / 180));
    const y = Math.round(a.basis.y + d * Math.sin((w * Math.PI) / 180));
    if (welt.platzPruefen(art, x, y)) return welt.gebaeudeAnlegen('a', art, x, y);
  }
  throw new Error(`kein Platz fuer ${art}`);
}

/** Anna im Fuerstentum mit `dorfbewohner` Dorfbewohnern und `vorrat` von allem, ihre KI und was sie sendet. */
function lage({ dorfbewohner = KRONE_DORF, vorrat = 3000, aufbruch = true, gebaeude = ['burg'], minute = KRONE_AB_MINUTE } = {}) {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  welt.takt = minute * 600;
  for (const s of welt.spieler) s.zeitalter = 2;
  const a = welt.spielerVon('a');
  Object.assign(a, { holz: vorrat, nahrung: vorrat, gold: vorrat, stein: vorrat });
  for (let i = dorf(welt, 'a').length; i < dorfbewohner; i++) {
    welt.einheitAnlegen('a', a.basis.x - 5 + (i % 10), a.basis.y + 5 + Math.floor(i / 10));
  }
  for (const [i, art] of gebaeude.entries()) bauen(welt, a, art, 10 + 5 * i);
  const ki = new Ki(welt, 'a');
  if (aufbruch) ki.angriffTakt = 1;
  const gesendet = [];
  const senden = ki.senden.bind(ki);
  ki.senden = (n) => { gesendet.push(n); return senden(n); };
  return { welt, a, ki, gesendet };
}

const pruefen = ({ welt, ki }) => ki.kronePruefen(zentrumVon(welt, 'a'), gebaeudeVon(welt, 'a'), dorf(welt, 'a'));
const krone = (gesendet) => gesendet.filter((n) => n.auftrag === 'ausbilden' && n.einheit === 'imperialzeit');

test('ki AC-39: im Fuerstentum mit vollem Dorf und einer Burg bestellt sie die Krone - oder mit zwei Gebaeuden des Fuerstentums', () => {
  assert.equal(KRONE_DORF, zielDorfbewohner(2), 'das volle Dorf des Fuerstentums (ki AC-24)');
  for (const gebaeude of [['burg'], ['kloster', 'universitaet']]) {
    const l = lage({ gebaeude });
    pruefen(l);
    assert.equal(krone(l.gesendet).length, 1, `${gebaeude.join(' und ')}: die Krone bestellt`);
    assert.ok(zentrumVon(l.welt, 'a').schlange.includes('imperialzeit'), `${gebaeude.join(' und ')}: der Server hat sie angenommen`);
  }
});

test('ki AC-39: nicht vor dem ersten Aufbruch, nicht vor Minute 40, nicht mit weniger Dorfbewohnern, nicht mit besetztem Dorfzentrum, nicht unbezahlt', () => {
  const faelle = [
    ['vor dem ersten Aufbruch', { aufbruch: false }],
    [`vor Spielminute ${KRONE_AB_MINUTE}`, { minute: KRONE_AB_MINUTE - 1 }],
    ['ein Dorfbewohner zu wenig', { dorfbewohner: KRONE_DORF - 1 }],
    ['unbezahlt', { vorrat: 900 }],
  ];
  for (const [name, werte] of faelle) {
    const l = lage(werte);
    pruefen(l);
    assert.equal(krone(l.gesendet).length, 0, name);
  }
  const l = lage();
  zentrumVon(l.welt, 'a').schlange.push('dorfbewohner');
  pruefen(l);
  assert.equal(krone(l.gesendet).length, 0, 'besetztes Dorfzentrum');
});

test('ki AC-39: fehlt das zweite Gebaeude des Fuerstentums, baut sie ein Kloster', () => {
  const l = lage({ gebaeude: ['universitaet'] });
  pruefen(l);
  assert.equal(krone(l.gesendet).length, 0, 'ohne zweites Gebaeude keine Krone');
  const bau = l.gesendet.find((n) => n.auftrag === 'bauen');
  assert.ok(bau, 'ein Bauauftrag');
  assert.equal(bau.art, 'kloster');
});

test('ki AC-39: sie legt den Preis zurueck, bis er bestellt ist - und das Dorfzentrum bildet so lange niemanden aus', () => {
  const l = lage({ vorrat: 0 });
  assert.deepEqual(l.ki.ruecklage(), AUFSTIEGE.imperialzeit.kosten, 'der Preis liegt zurueck');
  assert.equal(lage({ vorrat: 0, dorfbewohner: KRONE_DORF - 1 }).ki.ruecklage().gold, undefined, 'mit weniger Dorfbewohnern nicht');
  assert.equal(lage({ vorrat: 0, aufbruch: false }).ki.ruecklage().gold, undefined, 'vor dem Aufbruch nicht');
  assert.equal(lage({ vorrat: 0, minute: KRONE_AB_MINUTE - 1 }).ki.ruecklage().gold, undefined, 'vor der Minute nicht');

  const voll = lage();
  assert.ok(voll.ki.kroneBereit(), 'bezahlt und bereit');
  // Ein Takt der KI: das Dorfzentrum bestellt die Krone, keinen Dorfbewohner.
  voll.ki.entscheiden();
  const imZentrum = voll.gesendet.filter((n) => n.auftrag === 'ausbilden' && n.gebaeude === zentrumVon(voll.welt, 'a').id);
  assert.deepEqual(imZentrum.map((n) => n.einheit), ['imperialzeit']);
  assert.deepEqual(voll.ki.ruecklage().gold ?? 0, 0, 'bestellt ist bezahlt: nichts liegt mehr zurueck');
});

test('ki AC-39: in der Krone gelten die Werte aus den Daten - 50 Dorfbewohner, drei Burgen', () => {
  const { BURGEN_JE_ZEITALTER } = require('../server/spiele/strategie/ki.js');
  assert.equal(zielDorfbewohner(3), 50);
  assert.equal(BURGEN_JE_ZEITALTER[3], 3);
});
