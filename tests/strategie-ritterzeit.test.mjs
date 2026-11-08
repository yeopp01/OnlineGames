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

// ---- Verbesserungen der Ritterzeit (bauen AC-34) -----------------------------

const forschen = (welt, gebaeude, art) => welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: gebaeude.id, einheit: art });

test('bauen AC-34: Eisenguss und Bodkinpfeil in der Schmiede mit den Werten der Vorlage - jede erst nach ihrer Vorstufe', () => {
  assert.deepEqual(VERBESSERUNGEN.eisenguss.kosten, { nahrung: 220, gold: 120 });
  assert.deepEqual(VERBESSERUNGEN.bodkinpfeil.kosten, { nahrung: 200, gold: 100 });
  assert.equal(VERBESSERUNGEN.eisenguss.vorstufe, 'schmiedeangriff');
  assert.equal(VERBESSERUNGEN.bodkinpfeil.vorstufe, 'befiedertePfeile');
  for (const art of ['eisenguss', 'bodkinpfeil']) {
    assert.ok(GEBAEUDE.schmiede.bildetAus.includes(art), `${art} in der Schmiede`);
    assert.equal(VERBESSERUNGEN[art].zeitalter, 2, `${art}: Ritterzeit`);
  }
  // In der Feudalzeit abgewiesen - wegen des Zeitalters.
  const feudal = mitGebaeude('schmiede', 1);
  assert.match(forschen(feudal.welt, feudal.gebaeude, 'eisenguss').fehler, /Ritterzeit/);

  const { welt, anna, gebaeude } = mitGebaeude('schmiede', 2);
  // Ohne die Vorstufe: Absage mit ihrem Namen, und sie kostet nichts.
  assert.match(forschen(welt, gebaeude, 'eisenguss').fehler, /Schmiedeangriff/);
  assert.match(forschen(welt, gebaeude, 'bodkinpfeil').fehler, /Befiederte Pfeile/);
  assert.equal(anna.gold, 2000, 'eine Absage kostet nichts');
  // Eingereiht reicht nicht: die Vorstufe muss erforscht sein.
  assert.deepEqual(forschen(welt, gebaeude, 'schmiedeangriff'), {});
  assert.match(forschen(welt, gebaeude, 'eisenguss').fehler, /Schmiedeangriff/, 'nur eingereiht');
  assert.deepEqual(forschen(welt, gebaeude, 'befiedertePfeile'), {});
  sekunden(welt, VERBESSERUNGEN.schmiedeangriff.zeit + VERBESSERUNGEN.befiedertePfeile.zeit + 1);
  assert.ok(anna.verbesserungen.includes('befiedertePfeile'));

  const angriff = (art) => welt.einheitenwert('a', art, 'angriff');
  const reichweite = (art) => welt.einheitenwert('a', art, 'reichweite');
  const vorher = { ritter: angriff('ritter'), miliz: angriff('miliz'), bogen: angriff('armbrustschuetze'), weit: reichweite('armbrustschuetze') };
  assert.deepEqual(forschen(welt, gebaeude, 'eisenguss'), {});
  assert.deepEqual(forschen(welt, gebaeude, 'bodkinpfeil'), {});
  sekunden(welt, VERBESSERUNGEN.eisenguss.zeit + VERBESSERUNGEN.bodkinpfeil.zeit + 1);
  assert.ok(anna.verbesserungen.includes('eisenguss') && anna.verbesserungen.includes('bodkinpfeil'));
  // Nahkaempfer +1 Angriff, Fernkaempfer +1 Angriff und +1 Reichweite.
  assert.equal(angriff('ritter'), vorher.ritter + 1, 'Kavallerie');
  assert.equal(angriff('miliz'), vorher.miliz + 1, 'Infanterie');
  assert.equal(angriff('armbrustschuetze'), vorher.bogen + 1, 'Fernkaempfer Angriff');
  assert.equal(reichweite('armbrustschuetze'), vorher.weit + 1, 'Fernkaempfer Reichweite');
  // Der Dorfbewohner bleibt aussen vor wie beim Schmiedeangriff.
  assert.equal(angriff('dorfbewohner'), EINHEITEN.dorfbewohner.angriff);
});

test('bauen AC-34: Mauerwerk gibt jedem Gebaeude 10 Prozent Leben und +1/+1 Ruestung, auch dem, das schon steht', () => {
  assert.deepEqual(VERBESSERUNGEN.mauerwerk.kosten, { holz: 175, stein: 150 });
  assert.ok(GEBAEUDE.universitaet.bildetAus.includes('mauerwerk'));
  const { welt, anna, gebaeude: uni } = mitGebaeude('universitaet', 2);
  const haus = welt.gebaeudeAnlegen('a', 'haus', anna.basis.x - 9, anna.basis.y - 9);
  haus.leben -= 100; // beschaedigt: der Schaden bleibt stehen
  const miliz = welt.einheitAnlegen('b', haus.x + 2, haus.y, 'miliz');
  const bogen = welt.einheitAnlegen('b', haus.x + 3, haus.y, 'bogenschuetze');
  const schlagVorher = [welt.schaden(miliz, haus, true), welt.schaden(bogen, haus, true)];
  assert.deepEqual(forschen(welt, uni, 'mauerwerk'), {});
  assert.equal(anna.stein, 500 - 150, 'Stein beim Einreihen bezahlt');
  sekunden(welt, VERBESSERUNGEN.mauerwerk.zeit + 1);
  assert.ok(anna.verbesserungen.includes('mauerwerk'));
  // 550 -> 605 Leben; das Haus, das 100 verloren hatte, steht auf 505.
  assert.equal(welt.gebaeudewert('a', 'haus', 'leben'), Math.round(GEBAEUDE.haus.leben * 1.1));
  assert.equal(haus.leben, Math.round(GEBAEUDE.haus.leben * 1.1) - 100);
  // Das Universitaetsgebaeude selbst, unbeschaedigt, steht auf vollem neuem Wert.
  assert.equal(uni.leben, Math.round(GEBAEUDE.universitaet.leben * 1.1));
  // Ein neues Gebaeude kommt gleich mit dem hoeheren Wert.
  const neu = welt.gebaeudeAnlegen('a', 'haus', anna.basis.x + 9, anna.basis.y - 9);
  assert.equal(neu.leben, Math.round(GEBAEUDE.haus.leben * 1.1));
  // Ruestung +1/+1: jeder Schlag eins weniger (die Miliz trifft mit max(1, ...)).
  const schlagNachher = [welt.schaden(miliz, haus, true), welt.schaden(bogen, haus, true)];
  assert.equal(schlagNachher[0], Math.max(1, schlagVorher[0] - 1), 'nah');
  assert.equal(schlagNachher[1], Math.max(1, schlagVorher[1] - 1), 'fern');
  // Der Browser bekommt das volle Leben in der Tafel `kw` (fuer den Balken).
  const kw = welt.aufbau('a').spieler.find((s) => s.id === 'a').kw;
  assert.equal(kw.haus.leben, Math.round(GEBAEUDE.haus.leben * 1.1));
  assert.equal(kw.haus.fernruestung, GEBAEUDE.haus.fernruestung + 1);
  // Bert hat es nicht.
  assert.equal(welt.gebaeudewert('b', 'haus', 'leben'), GEBAEUDE.haus.leben);
});

test('bauen AC-34: Stadtpatrouille im Dorfzentrum gibt den Gebaeuden noch einmal 4 Sicht - erst nach der Stadtwache', () => {
  assert.deepEqual(VERBESSERUNGEN.stadtpatrouille.kosten, { nahrung: 300, gold: 100 });
  assert.ok(GEBAEUDE.dorfzentrum.bildetAus.includes('stadtpatrouille'));
  const { welt, anna } = mitGebaeude('haus', 2);
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === 'dorfzentrum');
  assert.match(forschen(welt, zentrum, 'stadtpatrouille').fehler, /Stadtwache/);
  welt.erforschen(anna, 'stadtwache');
  const mitWache = welt.gebaeudeSicht('a', 'dorfzentrum');
  assert.deepEqual(forschen(welt, zentrum, 'stadtpatrouille'), {});
  sekunden(welt, VERBESSERUNGEN.stadtpatrouille.zeit + 1);
  assert.ok(anna.verbesserungen.includes('stadtpatrouille'));
  assert.equal(welt.gebaeudeSicht('a', 'dorfzentrum'), mitWache + 4);
  assert.equal(welt.gebaeudeSicht('a', 'dorfzentrum'), GEBAEUDE.dorfzentrum.sicht + 8);
});

test('bauen AC-34: Einheiten und Gebaeude teilen sich keinen Namen - sie stehen in derselben Tafel kw', () => {
  const doppelt = Object.keys(EINHEITEN).filter((art) => GEBAEUDE[art]);
  assert.deepEqual(doppelt, []);
});

test('bauen AC-34: jede Verbesserung bringt ihr eigenes Zeichen mit, keine zwei gleich', () => {
  const zeichen = Object.values(VERBESSERUNGEN).map((v) => v.zeichen).filter(Boolean);
  assert.equal(new Set(zeichen).size, zeichen.length);
  for (const art of ['eisenguss', 'bodkinpfeil', 'mauerwerk', 'stadtpatrouille']) assert.ok(VERBESSERUNGEN[art].zeichen, art);
});
