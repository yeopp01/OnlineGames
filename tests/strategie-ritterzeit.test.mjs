// Der Aufstieg in die Ritterzeit und ihre drei Gebaeude (bauen AC-27, AC-28) -
// Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md). Die
// Oberflaeche dazu: e2e/tests/strategie-ritterzeit.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { AUFSTIEGE, GEBAEUDE, EINHEITEN, VERBESSERUNGEN } = require('../server/spiele/strategie/daten.js');

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

// ---- Ritter und Armbrust (einheiten AC-33, AC-34) ---------------------------

/** Anna mit einem fertigen Gebaeude `art` im Zeitalter `zeitalter`, satt. */
function mitGebaeude(art, zeitalter = 2) {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  anna.zeitalter = zeitalter;
  Object.assign(anna, { nahrung: 2000, holz: 2000, gold: 2000, stein: 500 });
  let ort = null;
  for (let r = 6; r < 30 && !ort; r++) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r], [r, r], [-r, r]]) {
      if (welt.platzPruefen(art, anna.basis.x + dx, anna.basis.y + dy)) { ort = { x: anna.basis.x + dx, y: anna.basis.y + dy }; break; }
    }
  }
  const gebaeude = welt.gebaeudeAnlegen('a', art, ort.x, ort.y);
  return { welt, anna, gebaeude };
}
const zaehlenArt = (welt, art) => [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === art && !e.tot).length;

test('einheiten AC-33: der Ritter mit den Werten der Vorlage, im Stall erst ab der Ritterzeit', () => {
  const r = EINHEITEN.ritter;
  assert.deepEqual([r.leben, r.angriff, `${r.nahruestung}/${r.fernruestung}`, r.tempo], [100, 10, '2/2', 1.35]);
  assert.deepEqual(r.kosten, { nahrung: 60, gold: 75 });
  assert.equal(r.zeit, 30);
  assert.ok(r.klassen.includes('kavallerie'), 'Kavallerie - der Speer hat Bonus gegen ihn');
  assert.ok(GEBAEUDE.stall.bildetAus.includes('ritter'));
  // In der Feudalzeit abgewiesen.
  const feudal = mitGebaeude('stall', 1);
  assert.match(feudal.welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: feudal.gebaeude.id, einheit: 'ritter' }).fehler, /Ritterzeit/);
  // In der Ritterzeit ausgebildet: nach 30 Sekunden steht er da.
  const { welt, gebaeude } = mitGebaeude('stall', 2);
  assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: gebaeude.id, einheit: 'ritter' }), {});
  sekunden(welt, 30);
  assert.equal(zaehlenArt(welt, 'ritter'), 1, 'ein Ritter');
  // Der Speer schlaegt ihn hart: 3 Angriff - 2 Ruestung + 15 Bonus.
  const ritter = [...welt.einheiten.values()].find((e) => e.art === 'ritter');
  const speer = welt.einheitAnlegen('b', ritter.x + 1, ritter.y, 'speerkaempfer');
  assert.equal(welt.schaden(speer, ritter, false), 16);
});

test('einheiten AC-34: die Armbrust macht jeden Bogenschuetzen zum Armbrustschuetzen, und die Schiessanlage bildet danach nur noch sie aus', () => {
  const a = EINHEITEN.armbrustschuetze;
  assert.deepEqual([a.leben, a.angriff, a.reichweite], [35, 5, 5]);
  assert.deepEqual(a.kosten, EINHEITEN.bogenschuetze.kosten, 'kostet dasselbe wie der Bogenschuetze');
  assert.equal(a.stufeVon, 'bogenschuetze');
  assert.deepEqual(VERBESSERUNGEN.armbrust.kosten, { nahrung: 125, gold: 75 });
  assert.deepEqual(VERBESSERUNGEN.armbrust.wandelt, { bogenschuetze: 'armbrustschuetze' });
  // In der Feudalzeit gibt es die Forschung nicht.
  const feudal = mitGebaeude('schiessanlage', 1);
  assert.match(feudal.welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: feudal.gebaeude.id, einheit: 'armbrust' }).fehler, /Ritterzeit/);
  // In der Ritterzeit: zwei Bogenschuetzen, dann die Forschung.
  const { welt, anna, gebaeude } = mitGebaeude('schiessanlage', 2);
  const boegen = [0, 1].map((i) => welt.einheitAnlegen('a', anna.basis.x + 2 + i, anna.basis.y + 2, 'bogenschuetze'));
  assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: gebaeude.id, einheit: 'armbrust' }), {});
  sekunden(welt, VERBESSERUNGEN.armbrust.zeit);
  assert.equal(zaehlenArt(welt, 'bogenschuetze'), 0, 'kein Bogenschuetze mehr');
  assert.deepEqual(boegen.map((b) => welt.einheiten.get(b.id).art), ['armbrustschuetze', 'armbrustschuetze'], 'dieselben Einheiten');
  // Der Browser schickt weiter "bogenschuetze", der Server bildet die Armbrust aus.
  assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: gebaeude.id, einheit: 'bogenschuetze' }), {});
  assert.deepEqual(gebaeude.schlange, ['armbrustschuetze']);
});
