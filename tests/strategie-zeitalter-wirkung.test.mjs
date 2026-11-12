// Was ein Zeitalter selbst staerkt (einheiten AC-57): der Spaeherreiter laeuft
// ab der Feudalzeit 1,55 statt 1,2 Felder je Sekunde, wie in der Vorlage.
// Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md).
//
// Anlass war das erste Spiel auf dem Server (2026-11-12): "Der Spaeherreiter
// ist sehr langsam." In der Dunklen Zeit bleibt er, wie er ist - das ist der
// Wert der Vorlage.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, ZEITALTER } = require('../server/spiele/strategie/daten.js');
const { staerkt } = require('../server/spiele/strategie/bringt.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const nahe = (ist, soll, wozu) => assert.ok(Math.abs(ist - soll) < 0.002, `${wozu}: ${ist} statt ${soll}`);

test('einheiten AC-57: der Spaeherreiter laeuft ab der Feudalzeit 1,55 statt 1,2 Felder je Sekunde - nur bei dem, der aufgestiegen ist', () => {
  const welt = new Welt(ZWEI, 7);
  assert.equal(EINHEITEN.spaeherreiter.tempo, 1.2, 'der Grundwert bleibt der der Vorlage');
  assert.equal(welt.einheitenwert('a', 'spaeherreiter', 'tempo'), 1.2, 'in der Dunklen Zeit');

  welt.spielerVon('a').zeitalter = 1;
  nahe(welt.einheitenwert('a', 'spaeherreiter', 'tempo'), 1.55, 'in der Feudalzeit');
  assert.equal(welt.einheitenwert('b', 'spaeherreiter', 'tempo'), 1.2, 'Bert steht noch in der Dunklen Zeit');
  // Sonst aendert der Aufstieg an keiner Einheit das Tempo.
  for (const art of Object.keys(EINHEITEN)) {
    if (art !== 'spaeherreiter') assert.equal(welt.einheitenwert('a', art, 'tempo'), EINHEITEN[art].tempo || 0, art);
  }
  // Und er waechst nicht mit jedem Zeitalter weiter.
  welt.spielerVon('a').zeitalter = 2;
  nahe(welt.einheitenwert('a', 'spaeherreiter', 'tempo'), 1.55, 'in der Ritterzeit');
});

test('einheiten AC-57: gemessen am Gang - je Takt 0,155 Felder statt 0,12', () => {
  const schritt = (zeitalter) => {
    const welt = new Welt(ZWEI, 7);
    welt.spielerVon('a').zeitalter = zeitalter;
    const reiter = [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'spaeherreiter');
    const mitte = Math.floor(welt.karte.groesse / 2);
    assert.deepEqual(welt.nachricht('a', { einheiten: [reiter.id], ziel: { x: mitte, y: mitte } }) || {}, {});
    let weitester = 0;
    for (let i = 0; i < 4 * TAKTE_PRO_SEKUNDE; i++) {
      const vor = { x: reiter.x, y: reiter.y };
      welt.takten();
      weitester = Math.max(weitester, Math.hypot(reiter.x - vor.x, reiter.y - vor.y));
    }
    return weitester;
  };
  nahe(schritt(0), 1.2 / TAKTE_PRO_SEKUNDE, 'Dunkle Zeit');
  nahe(schritt(1), 1.55 / TAKTE_PRO_SEKUNDE, 'Feudalzeit');
});

test('einheiten AC-57: mit dem Aufstieg geht die Tafel der Werte neu hinaus, und am Knopf steht, was er staerkt', () => {
  assert.deepEqual(staerkt(ZEITALTER[1].wirkung), [{ art: 'spaeherreiter', text: '+0,35 Tempo' }]);
  assert.deepEqual(staerkt(undefined), []);

  const welt = new Welt(ZWEI, 7);
  const aufbau = welt.aufbau();
  assert.deepEqual(aufbau.werte.aufstiege.feudalzeit.staerkt, [{ art: 'spaeherreiter', text: '+0,35 Tempo' }]);
  assert.deepEqual(aufbau.werte.aufstiege.ritterzeit.staerkt, [], 'die Ritterzeit staerkt selbst nichts');
  assert.equal(welt.kampfwerte('a').spaeherreiter.tempo, 1.2);

  // Ein echter Aufstieg ueber das Dorfzentrum.
  const anna = welt.spielerVon('a');
  anna.nahrung = 600;
  welt.gebaeudeAnlegen('a', 'muehle', anna.basis.x + 6, anna.basis.y + 6);
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === 'dorfzentrum');
  assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: zentrum.id, einheit: 'feudalzeit' }), {});
  // Einmal senden, damit nur noch zaehlt, was sich danach aendert.
  welt.zustandJeSpieler(['a', 'b']);
  let tafel = null;
  for (let t = 0; t < 131 * TAKTE_PRO_SEKUNDE && !tafel; t++) {
    welt.takten();
    const ich = welt.zustandJeSpieler(['a', 'b']).get('a').spieler.find((s) => s.id === 'a');
    if (ich.kw) tafel = ich.kw;
  }
  assert.equal(anna.zeitalter, 1);
  assert.ok(tafel, 'mit dem Aufstieg kommt die Tafel');
  nahe(tafel.spaeherreiter.tempo, 1.55, 'in der Tafel');
});
