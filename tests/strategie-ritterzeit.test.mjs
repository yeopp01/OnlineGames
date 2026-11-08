// Der Aufstieg in die Ritterzeit und ihre drei Gebaeude (bauen AC-27, AC-28) -
// Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md). Die
// Oberflaeche dazu: e2e/tests/strategie-ritterzeit.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { AUFSTIEGE, GEBAEUDE, EINHEITEN } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const RITTER = ['kloster', 'universitaet', 'belagerungswerkstatt'];

/** Eine Welt, in der Anna in der Feudalzeit ist und genug hat. */
function feudal() {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  anna.zeitalter = 1;
  anna.nahrung = 1000;
  anna.gold = 500;
  anna.holz = 2000;
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === 'dorfzentrum');
  return { welt, anna, zentrum };
}

const aufsteigen = (welt, zentrum) => welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: zentrum.id, einheit: 'ritterzeit' });
const sekunden = (welt, s) => { for (let t = 0; t < s * TAKTE_PRO_SEKUNDE; t++) welt.takten(); };

test('bauen AC-27: der Aufstieg in die Ritterzeit kostet 800 Nahrung und 200 Gold und dauert 160 Sekunden', () => {
  assert.deepEqual(AUFSTIEGE.ritterzeit.kosten, { nahrung: 800, gold: 200 }, 'Werte der Vorlage');
  assert.equal(AUFSTIEGE.ritterzeit.zeit, 160);
  const { welt, anna, zentrum } = feudal();
  welt.gebaeudeAnlegen('a', 'schiessanlage', anna.basis.x + 6, anna.basis.y + 6);
  welt.gebaeudeAnlegen('a', 'stall', anna.basis.x - 7, anna.basis.y + 6);
  assert.deepEqual(aufsteigen(welt, zentrum), {});
  assert.equal(anna.nahrung, 200, 'Nahrung beim Einreihen bezahlt');
  assert.equal(anna.gold, 300, 'Gold beim Einreihen bezahlt');
  sekunden(welt, 159);
  assert.equal(anna.zeitalter, 1, 'nach 159 Sekunden noch Feudalzeit');
  sekunden(welt, 1);
  assert.equal(anna.zeitalter, 2, 'nach 160 Sekunden Ritterzeit');
});

test('bauen AC-27: Voraussetzung sind zwei fertige Gebaeude der Feudalzeit - die der Dunklen Zeit zaehlen nicht mehr', () => {
  const { welt, anna, zentrum } = feudal();
  // Muehle und Kaserne sind aus der Dunklen Zeit: sie zaehlen jetzt nicht.
  welt.gebaeudeAnlegen('a', 'muehle', anna.basis.x + 6, anna.basis.y + 6);
  welt.gebaeudeAnlegen('a', 'kaserne', anna.basis.x - 7, anna.basis.y + 6);
  const absage = aufsteigen(welt, zentrum).fehler;
  assert.match(absage, /2 fertige Gebäude der Feudalzeit außer Häusern/);
  assert.match(absage, /vorhanden: 0/);
  assert.equal(anna.gold, 500, 'eine Absage kostet nichts');
  welt.gebaeudeAnlegen('a', 'schmiede', anna.basis.x + 6, anna.basis.y - 8);
  assert.match(aufsteigen(welt, zentrum).fehler, /vorhanden: 1/);
  welt.gebaeudeAnlegen('a', 'stall', anna.basis.x - 8, anna.basis.y - 8);
  assert.deepEqual(aufsteigen(welt, zentrum), {}, 'mit zweien geht es');
});

test('bauen AC-28: Kloster, Universitaet und Werkstatt mit den Werten der Vorlage - erst ab der Ritterzeit', () => {
  assert.deepEqual(GEBAEUDE.kloster.kosten, { holz: 175 });
  assert.equal(GEBAEUDE.kloster.bauzeit, 40);
  assert.deepEqual(GEBAEUDE.universitaet.kosten, { holz: 200 });
  assert.equal(GEBAEUDE.universitaet.bauzeit, 60);
  assert.deepEqual(GEBAEUDE.belagerungswerkstatt.kosten, { holz: 200 });
  assert.equal(GEBAEUDE.belagerungswerkstatt.bauzeit, 40);
  for (const art of RITTER) {
    assert.equal(GEBAEUDE[art].leben, 2100, `${art}: 2100 Leben`);
    assert.equal(GEBAEUDE[art].zeitalter, 2, `${art}: Ritterzeit`);
    assert.ok(EINHEITEN.dorfbewohner.baut.includes(art), `${art}: ein Dorfbewohner baut es`);
  }
  // In der Feudalzeit abgewiesen, in der Ritterzeit nicht.
  const { welt, anna } = feudal();
  const bauer = [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  const bauen = (art, dx) => welt.nachricht('a', { auftrag: 'bauen', einheiten: [bauer.id], art, ziel: { x: anna.basis.x + dx, y: anna.basis.y + 9 } });
  // Abgewiesen wegen des Zeitalters, nicht aus einem anderen Grund.
  for (const [i, art] of RITTER.entries()) assert.match(bauen(art, -6 + i * 5).fehler || '', /Ritterzeit/, `${art} in der Feudalzeit abgewiesen`);
  anna.zeitalter = 2;
  // Ein freier Platz um die Basis, je Gebaeude - feste Abstaende trafen Baeume.
  const frei = (art) => {
    for (let r = 6; r < 30; r++) {
      for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r], [r, r], [-r, r], [r, -r], [-r, -r]]) {
        const x = anna.basis.x + dx;
        const y = anna.basis.y + dy;
        if (welt.platzPruefen(art, x, y)) return { x, y };
      }
    }
    throw new Error(`kein Platz fuer ${art}`);
  };
  for (const art of RITTER) {
    const ort = frei(art);
    const antwort = welt.nachricht('a', { auftrag: 'bauen', einheiten: [bauer.id], art, ziel: ort });
    assert.equal(antwort.fehler, undefined, `${art} in der Ritterzeit`);
    assert.equal(welt.gebaeude.get(antwort.gebaeude)?.art, art, `${art}: die Baustelle steht`);
  }
});
