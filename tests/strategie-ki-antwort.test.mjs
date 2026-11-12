// Die KI antwortet auf das Heer, das sie gesehen hat (ki AC-31): was sie in
// einem Militaergebaeude ausbildet und welches sie nachbaut, richtet sich nach
// `bonus` und `klassen` der fremden Kampfeinheiten in `feindeGesehen`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt } = require('../server/spiele/strategie/welt.js');
const { Ki } = require('../server/spiele/strategie/ki.js');
const { EINHEITEN, GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const MILITAERGEBAEUDE = Object.keys(GEBAEUDE).filter((g) => ['schiessanlage', 'stall', 'kaserne'].includes(g));

// Eine KI in der Feudalzeit mit reichlich Vorrat; Bert stellt `fremde` vor
// ihr Dorfzentrum, und sie sieht hin.
function lage(fremde = []) {
  const welt = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt' });
  const ki = new Ki(welt, 'a');
  const a = welt.spielerVon('a');
  a.zeitalter = 1;
  Object.assign(a, { nahrung: 5000, holz: 5000, gold: 5000, stein: 0 });
  // Berts Start (Spaeher, Dorfbewohner) waere aufgedeckt mitgesehen.
  for (const e of [...welt.einheiten.values()]) if (e.besitzer === 'b') welt.einheiten.delete(e.id);
  for (const art of fremde) welt.einheitAnlegen('b', a.basis.x + 8, a.basis.y + 8, art);
  ki.wahrnehmen();
  const gebaeude = {};
  for (const art of MILITAERGEBAEUDE) {
    const platz = ki.platzBeiBasis(art);
    gebaeude[art] = welt.gebaeudeAnlegen('a', art, platz.x, platz.y, true);
  }
  return { welt, ki, a, gebaeude };
}

// Kampfeinheiten der Feudalzeit, die ein Militaergebaeude ausbildet - aus den Daten.
const FEUDAL = [...new Set(MILITAERGEBAEUDE.flatMap((g) => GEBAEUDE[g].bildetAus))]
  .filter((art) => EINHEITEN[art] && (EINHEITEN[art].zeitalter || 0) <= 1);
const trifft = (art, gegen) => (EINHEITEN[gegen].klassen || []).some((k) => (EINHEITEN[art].bonus || {})[k]);

test('ki AC-31: gegen gesehene Schuetzen bildet die Schiessanlage Plaenkler aus - ohne gesehenes Heer wie bisher', () => {
  const ohne = lage();
  const bisher = ohne.ki.naechsteKampfeinheit(ohne.gebaeude.schiessanlage);
  assert.equal(bisher, GEBAEUDE.schiessanlage.bildetAus[0], 'ohne Heer die erste der Daten');
  const mit = lage(['bogenschuetze', 'bogenschuetze', 'bogenschuetze']);
  assert.equal(mit.ki.naechsteKampfeinheit(mit.gebaeude.schiessanlage), 'plaenkler');
  // Gegenprobe: Dorfbewohner sind kein Heer, sie aendern nichts.
  const dorf = lage(['dorfbewohner', 'dorfbewohner', 'dorfbewohner']);
  assert.equal(dorf.ki.naechsteKampfeinheit(dorf.gebaeude.schiessanlage), bisher);
});

test('ki AC-31: in jedem Gebaeude die Einheit, deren Bonus die gesehene trifft, wenn es eine hat - aus den Daten', () => {
  let geprueft = 0;
  for (const gegen of FEUDAL) {
    const { ki, gebaeude } = lage([gegen, gegen]);
    for (const g of MILITAERGEBAEUDE) {
      const moeglich = GEBAEUDE[g].bildetAus.filter((art) => FEUDAL.includes(art));
      if (!moeglich.some((art) => trifft(art, gegen))) continue;
      const gewaehlt = ki.naechsteKampfeinheit(gebaeude[g]);
      assert.ok(trifft(gewaehlt, gegen), `${g} gegen ${gegen}: ${gewaehlt}`);
      geprueft += 1;
    }
  }
  // Speer gegen Reiter, Bogen gegen Speer, Plaenkler gegen Bogen und Plaenkler:
  // mindestens die drei Ecken des Konterkreises.
  assert.ok(geprueft >= 3, `nur ${geprueft} Faelle`);
});

test('ki AC-31: die Mehrheit des Gesehenen entscheidet, gezaehlt je Einheit', () => {
  // Zwei Reiter und ein Speerkaempfer: der Speer trifft zwei, der Bogen einen.
  const { ki } = lage(['spaeherreiter', 'spaeherreiter', 'speerkaempfer']);
  assert.equal(ki.antwortAuf('speerkaempfer'), 2);
  assert.equal(ki.antwortAuf('bogenschuetze'), 1);
  assert.equal(ki.antwortGebaeude(), 'kaserne');
});

test('ki AC-31: fehlt das Gebaeude mit der Antwort, baut sie es statt ihres Schwerpunkts nach', () => {
  const nachgebaut = (fremde) => {
    const { welt, ki, a } = lage(fremde);
    // Ein Haus, das zur Kaserne neigt, mit Stall und Kaserne, beide voll.
    ki.neigung = { ...ki.neigung, schwerpunkt: 'kaserne' };
    for (const g of [...welt.gebaeude.values()]) {
      if (g.besitzer === 'a' && g.art === 'schiessanlage') welt.gebaeude.delete(g.id);
    }
    const eigene = [...welt.gebaeude.values()].filter((g) => g.besitzer === 'a');
    for (const g of eigene) if (GEBAEUDE[g.art].bildetAus && g.art !== 'dorfzentrum') g.schlange = ['x', 'x'];
    const gebaut = [];
    ki.senden = () => ({});
    ki.bauen = (art) => { gebaut.push(art); };
    a.holz = 5000;
    ki.militaerPruefen(eigene, [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner'));
    return gebaut;
  };
  assert.deepEqual(nachgebaut(['bogenschuetze', 'bogenschuetze']), ['schiessanlage']);
  // Gegenprobe: ohne gesehenes Heer der Schwerpunkt, wie bei ki AC-27.
  assert.deepEqual(nachgebaut([]), ['kaserne']);
  // Und gegen Reiter hat sie die Antwort schon (Kaserne): wieder der Schwerpunkt.
  assert.deepEqual(nachgebaut(['spaeherreiter']), ['kaserne']);
});
