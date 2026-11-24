// Das Baumenue auf zwei Seiten (→ specs/10-strategie/bedienung.md AC-64) - der
// Teil in den Daten: auf welcher Seite ein Gebaeude steht, sagt `seite` in
// GEBAEUDE, und der Aufbau reicht es dem Browser. Das Menue selbst prueft
// e2e/tests/strategie-baumenue.spec.mjs.
//
// Rueckmeldung des Benutzers: "gebäude muss man irgendwie beim dorfbewohner
// etwas organisieren, dass das nicht zu breit wird."
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

// Eine Kampfeinheit: Angriff ueber null und kein Dorfbewohner (Klasse `dorf`) -
// wie `ki.kaempft()`, nur zaehlt hier die Belagerung mit. Der Dorfbewohner
// schlaegt mit 3 und ist trotzdem keine (bedienung AC-64, geaendert am
// 2026-11-22: "Ac 64 passt seine Empfehlung").
const kampfeinheit = (art) => Boolean(EINHEITEN[art]) && (EINHEITEN[art].angriff || 0) > 0
  && !(EINHEITEN[art].klassen || []).includes('dorf');

test('bedienung AC-64: jedes Gebaeude des Dorfbewohners steht auf einer von zwei Seiten, die Wirtschaft traegt hoechstens elf, das Militaer hoechstens zehn - und was Kampfeinheiten ausbildet, schiesst oder sperrt, steht beim Militaer', () => {
  const { baut } = EINHEITEN.dorfbewohner;
  const seiten = [0, 1].map((s) => baut.filter((art) => (GEBAEUDE[art].seite || 0) === s));
  assert.equal(seiten[0].length + seiten[1].length, baut.length, 'eine dritte Seite gibt es nicht');
  const grenze = [11, 10];
  for (const [s, arten] of seiten.entries()) {
    assert.ok(arten.length >= 1 && arten.length <= grenze[s], `Seite ${s}: ${arten.length} Gebaeude, erlaubt ${grenze[s]}`);
  }
  for (const art of baut) {
    const w = GEBAEUDE[art];
    const kaempfer = w.bildetAus.some(kampfeinheit);
    if (kaempfer || w.angriff || w.tor || w.gezogen) assert.equal(w.seite, 1, `${art} gehoert zum Militaer`);
  }
  // Wer keine Kampfeinheit ist, obwohl er etwas ausbildet oder schlaegt.
  assert.equal(EINHEITEN.dorfbewohner.angriff > 0 && !kampfeinheit('dorfbewohner'), true, 'der Dorfbewohner schlaegt, ist aber keine');
  for (const art of ['moench', 'marktkarren']) assert.equal(kampfeinheit(art), false, art);
  for (const art of ['miliz', 'ramme', 'mangonel', 'ritter']) assert.equal(kampfeinheit(art), true, art);
  // Und die Wirtschaft bleibt Wirtschaft - das zweite Dorfzentrum mit (bauen AC-57).
  for (const art of ['haus', 'muehle', 'holzfaellerlager', 'bergbaulager', 'farm', 'markt', 'kloster', 'dorfzentrum']) {
    assert.equal(GEBAEUDE[art].seite || 0, 0, `${art} gehoert zur Wirtschaft`);
  }
});

test('bedienung AC-64: je Zeitalter so viele Gebaeude je Seite im Menue - in der Krone elf bei der Wirtschaft, neun beim Militaer', () => {
  // Was im Menue steht: das Zeitalter des Gebaeudes und `bauenAb` erreicht
  // (bauen AC-24, AC-57), wie `auswahlleiste.bauplan()` es liest.
  const { baut } = EINHEITEN.dorfbewohner;
  const zahlen = [0, 1, 2, 3].map((z) => [0, 1].map((s) => baut.filter((art) => {
    const g = GEBAEUDE[art];
    return (g.seite || 0) === s && Math.max(g.zeitalter || 0, g.bauenAb || 0) <= z;
  }).length));
  assert.deepEqual(zahlen, [[5, 2], [7, 7], [9, 9], [11, 9]]);
  // Das Dorfzentrum ist in der Krone der letzte Eintrag der Wirtschaft.
  const wirtschaft = baut.filter((art) => (GEBAEUDE[art].seite || 0) === 0);
  assert.equal(wirtschaft.at(-1), 'dorfzentrum');
});

test('bedienung AC-64: der Aufbau nennt dem Browser die Seite jedes Gebaeudes', () => {
  const { werte } = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' }).aufbau();
  for (const [art, w] of Object.entries(GEBAEUDE)) {
    assert.equal(werte.gebaeude[art].seite, w.seite || 0, art);
  }
  assert.equal(werte.gebaeude.kaserne.seite, 1);
  assert.equal(werte.gebaeude.haus.seite, 0);
});
