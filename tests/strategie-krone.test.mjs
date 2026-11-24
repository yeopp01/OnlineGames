// Die Krone (Stufe F): der Aufstieg mit der Burg-Regel (bauen AC-47) und die
// fuenf Stufen der Krone (einheiten AC-66) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, EINHEITEN, VERBESSERUNGEN, AUFSTIEGE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const sekunden = (welt, s) => { for (let t = 0; t < s * TAKTE_PRO_SEKUNDE; t++) welt.takten(); };

function platz(welt, spieler, art, ab = 6) {
  for (let r = ab; r < 30; r++) {
    for (const [dx, dy] of [[r, 0], [0, r], [-r, 0], [0, -r], [r, r], [-r, r]]) {
      if (welt.platzPruefen(art, spieler.basis.x + dx, spieler.basis.y + dy)) return [spieler.basis.x + dx, spieler.basis.y + dy];
    }
  }
  throw new Error(`kein Platz fuer ${art}`);
}
/** Eine Welt, in der Anna reich ist, im genannten Zeitalter steht und Wohnraum hat. */
function reich(zeitalter, erforscht = []) {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  anna.zeitalter = zeitalter;
  anna.verbesserungen.push(...erforscht);
  Object.assign(anna, { nahrung: 5000, holz: 5000, gold: 5000, stein: 2000 });
  welt.gebaeudeAnlegen('a', 'haus', ...platz(welt, anna, 'haus', 13));
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === 'dorfzentrum');
  const bauen = (art, fertig = true) => welt.gebaeudeAnlegen('a', art, ...platz(welt, anna, art), fertig);
  const bestellen = (gebaeude, art) => welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: gebaeude.id, einheit: art });
  const neben = (i, art) => welt.einheitAnlegen('a', anna.basis.x + 2 + i, anna.basis.y + 3, art);
  return { welt, anna, zentrum, bauen, bestellen, neben };
}

// ---- Der Aufstieg ------------------------------------------------------------

test('bauen AC-47: in die Krone fuehren zwei Gebaeude des Fuerstentums oder eine Burg - 1000 Nahrung, 800 Gold, 190 Sekunden', () => {
  assert.deepEqual(AUFSTIEGE.imperialzeit.kosten, { nahrung: 1000, gold: 800 });
  assert.equal(AUFSTIEGE.imperialzeit.zeit, 190);
  assert.equal(AUFSTIEGE.imperialzeit.oder.art, 'burg');
  assert.equal(AUFSTIEGE.feudalzeit.oder, undefined, 'die Regel gilt nur der Krone');
  assert.equal(AUFSTIEGE.ritterzeit.oder, undefined);

  // Nichts aus dem Fuerstentum: die Absage nennt beide Wege.
  const leer = reich(2);
  const absage = leer.bestellen(leer.zentrum, 'imperialzeit').fehler;
  assert.match(absage, /2 fertige Gebäude des Fürstentums außer Häusern oder eine Burg/);
  assert.match(absage, /vorhanden: 0/);
  assert.equal(leer.anna.nahrung, 5000, 'eine Absage kostet nichts');

  // Ein Kloster allein genuegt nicht, eine Baustelle der Burg auch nicht.
  const eines = reich(2);
  eines.bauen('kloster');
  assert.match(eines.bestellen(eines.zentrum, 'imperialzeit').fehler, /vorhanden: 1/);
  eines.bauen('burg', false);
  assert.match(eines.bestellen(eines.zentrum, 'imperialzeit').fehler, /oder eine Burg — vorhanden: 1/, 'eine Baustelle ist keine Burg');

  // Die Burg allein: sie ist ein Gebaeude des Fuerstentums, und doch genuegt sie.
  const burg = reich(2);
  burg.bauen('burg');
  assert.equal(burg.welt.gebaeudeDerZeit(burg.anna), 1, 'gezaehlt ist sie eines');
  assert.deepEqual(burg.bestellen(burg.zentrum, 'imperialzeit'), {});
  assert.deepEqual([burg.anna.nahrung, burg.anna.gold], [4000, 4200]);
  sekunden(burg.welt, 189);
  assert.equal(burg.anna.zeitalter, 2, 'noch nicht');
  sekunden(burg.welt, 2);
  assert.equal(burg.anna.zeitalter, 3, 'nach 190 Sekunden steht die Krone');

  // Der alte Weg bleibt: zwei Gebaeude ohne Burg.
  const zwei = reich(2);
  zwei.bauen('kloster');
  zwei.bauen('universitaet');
  assert.deepEqual(zwei.bestellen(zwei.zentrum, 'imperialzeit'), {});

  // Und die Burg hilft nur in die Krone, nicht ins Fuerstentum.
  const lehen = reich(1);
  lehen.bauen('burg');
  assert.match(lehen.bestellen(lehen.zentrum, 'ritterzeit').fehler, /2 fertige Gebäude des Lehens außer Häusern — vorhanden: 0/);
});

// ---- Die fuenf Stufen ----------------------------------------------------------

// Stufe, Vorstufe, Verbesserung, Gebaeude, was davor erforscht sein muss.
const STUFEN = [
  ['zweihandkaempfer', 'langschwertkaempfer', 'zweihandstufe', 'kaserne', ['soldatenstufe', 'langschwertstufe']],
  ['hellebardier', 'pikenier', 'hellebardierstufe', 'kaserne', ['pikenierstufe']],
  ['husar', 'leichtekavallerie', 'husarenstufe', 'stall', ['kavalleriestufe']],
  ['kavalier', 'ritter', 'kavalierstufe', 'stall', []],
  // Der Ritter hat zwei Stufen (Benutzer, 2026-11-18).
  ['paladin', 'kavalier', 'paladinstufe', 'stall', ['kavalierstufe']],
];

test('einheiten AC-66: die Werte der fuenf Stufen der Krone - Preis, Tempo und Ausbildungszeit wie die Vorstufe', () => {
  const werte = (art) => {
    const e = EINHEITEN[art];
    return [e.leben, e.angriff, `${e.nahruestung}/${e.fernruestung}`, e.nachladen];
  };
  assert.deepEqual(werte('zweihandkaempfer'), [65, 12, '1/1', 2]);
  assert.deepEqual(werte('hellebardier'), [60, 6, '0/0', 3]);
  assert.deepEqual(EINHEITEN.hellebardier.bonus, { kavallerie: 32 });
  assert.deepEqual(werte('husar'), [75, 7, '0/2', 1.9]);
  assert.deepEqual(werte('kavalier'), [120, 12, '2/2', 1.8]);
  assert.deepEqual(werte('paladin'), [160, 14, '2/3', 1.9]);
  for (const [stufe, vorstufe] of STUFEN) {
    const neu = EINHEITEN[stufe];
    const alt = EINHEITEN[vorstufe];
    assert.equal(neu.stufeVon, vorstufe, stufe);
    assert.equal(neu.zeitalter, 3, stufe);
    assert.deepEqual([neu.kosten, neu.tempo, neu.zeit, neu.klassen], [alt.kosten, alt.tempo, alt.zeit, alt.klassen], `${stufe}: wie ${vorstufe}`);
    assert.ok(neu.leben > alt.leben, `${stufe}: mehr Leben`);
  }
  const kosten = (v) => [VERBESSERUNGEN[v].kosten, VERBESSERUNGEN[v].zeit, VERBESSERUNGEN[v].zeitalter];
  assert.deepEqual(kosten('zweihandstufe'), [{ nahrung: 200, gold: 100 }, 45, 3]);
  assert.deepEqual(kosten('hellebardierstufe'), [{ nahrung: 300, gold: 600 }, 50, 3]);
  assert.deepEqual(kosten('husarenstufe'), [{ nahrung: 500, gold: 600 }, 50, 3]);
  assert.deepEqual(kosten('kavalierstufe'), [{ nahrung: 300, gold: 300 }, 80, 3]);
  // Die teuerste Stufe im Spiel.
  assert.deepEqual(kosten('paladinstufe'), [{ nahrung: 1300, gold: 750 }, 170, 3]);
  const summe = (v) => Object.values(VERBESSERUNGEN[v].kosten).reduce((a, b) => a + b, 0);
  for (const v of Object.keys(VERBESSERUNGEN)) {
    if (VERBESSERUNGEN[v].wandelt) assert.ok(summe(v) <= summe('paladinstufe'), `${v} kostet mehr als der Paladin`);
  }
  // Jedes Kuerzel gibt es einmal - auch unter den Grossbuchstaben.
  const kuerzel = Object.values(EINHEITEN).map((e) => e.kuerzel).filter(Boolean);
  assert.equal(new Set(kuerzel).size, kuerzel.length);
});

test('einheiten AC-66: jede Stufe der Krone tauscht ihre Vorstufe aus - die stehende, die in der Schlange und jede spaetere', () => {
  for (const [stufe, vorstufe, verbesserung, gebaeudeArt, davor] of STUFEN) {
    const { welt, bauen, bestellen, neben } = reich(3, davor);
    const gebaeude = bauen(gebaeudeArt);
    assert.ok(GEBAEUDE[gebaeudeArt].bildetAus.includes(verbesserung), verbesserung);
    const alter = neben(0, vorstufe);
    alter.leben -= 10;
    assert.deepEqual(bestellen(gebaeude, verbesserung), {}, verbesserung);
    // Dahinter eine Einheit der Linie: sie wird als die neue Stufe fertig.
    assert.deepEqual(bestellen(gebaeude, vorstufe), {});
    assert.deepEqual(gebaeude.schlange, [verbesserung, vorstufe]);
    sekunden(welt, VERBESSERUNGEN[verbesserung].zeit + 1);
    assert.equal(welt.einheiten.get(alter.id).art, stufe, `${vorstufe} wird ${stufe}`);
    assert.equal(alter.leben, EINHEITEN[stufe].leben - 10, 'das Leben waechst mit, der Schaden bleibt');
    assert.deepEqual(gebaeude.schlange, [stufe]);
    // Wer die erste Stufe der Linie nennt, bekommt die erreichte.
    let grund = stufe;
    while (EINHEITEN[grund].stufeVon) grund = EINHEITEN[grund].stufeVon;
    assert.deepEqual(bestellen(gebaeude, grund), {});
    assert.equal(gebaeude.schlange.at(-1), stufe, `${grund} heisst jetzt ${stufe}`);
    // Und ein zweites Mal gibt es die Verbesserung nicht.
    assert.match(bestellen(gebaeude, verbesserung).fehler, /nur einmal/);
  }
});

test('einheiten AC-66: eine Stufe der Krone gibt es erst in der Krone und erst nach ihrer Vorstufe', () => {
  for (const [stufe, , verbesserung, gebaeudeArt, davor] of STUFEN) {
    // Im Fuerstentum abgewiesen, auch mit allem davor.
    const frueh = reich(2, davor);
    assert.match(frueh.bestellen(frueh.bauen(gebaeudeArt), verbesserung).fehler, /ab der Krone/, verbesserung);
    // In der Krone ohne die Vorstufe: die Absage nennt sie.
    if (davor.length) {
      const ohne = reich(3, davor.slice(0, -1));
      const gebaeude = ohne.bauen(gebaeudeArt);
      assert.match(ohne.bestellen(gebaeude, verbesserung).fehler, new RegExp(`erst nach „${VERBESSERUNGEN[davor.at(-1)].name}"`), verbesserung);
      // Und die Einheit selbst laesst sich nicht vorab bestellen.
      assert.ok(ohne.bestellen(gebaeude, stufe).fehler, `${stufe} ohne die Verbesserung`);
    }
  }
});

test('einheiten AC-66: der Hellebardier schlaegt Reiter haerter als der Pikenier, der Zweihandkaempfer haerter als das Langschwert', () => {
  const { welt } = reich(3);
  const schaden = (wer, wen) => welt.schaden({ besitzer: 'a', art: wer }, { besitzer: 'b', art: wen }, false);
  assert.equal(schaden('hellebardier', 'ritter'), 6 + 32 - 2);
  assert.ok(schaden('hellebardier', 'ritter') > schaden('pikenier', 'ritter'));
  assert.equal(schaden('zweihandkaempfer', 'langschwertkaempfer'), 12 - 1);
  assert.ok(schaden('kavalier', 'bogenschuetze2') > schaden('ritter', 'bogenschuetze2'));
  assert.ok(schaden('paladin', 'bogenschuetze2') > schaden('kavalier', 'bogenschuetze2'));
  // Und der Paladin haelt mehr aus: ein Pfeil des Bogenschuetzen ritzt ihn nur.
  assert.ok(schaden('bogenschuetze2', 'paladin') < schaden('bogenschuetze2', 'kavalier'));
});

test('einheiten AC-66: der Ritter hat zwei Stufen - erst der Kavalier, dann der Paladin, und aus dem Stall kommt immer die erreichte', () => {
  const { welt, bauen, bestellen, neben } = reich(3);
  const stall = bauen('stall');
  const ritter = neben(0, 'ritter');
  // Ohne den Kavalier gibt es den Paladin nicht.
  assert.match(bestellen(stall, 'paladinstufe').fehler, /erst nach „Kavalier"/);
  assert.deepEqual(bestellen(stall, 'kavalierstufe'), {});
  sekunden(welt, VERBESSERUNGEN.kavalierstufe.zeit + 1);
  assert.equal(ritter.art, 'kavalier');
  assert.deepEqual(bestellen(stall, 'paladinstufe'), {});
  sekunden(welt, VERBESSERUNGEN.paladinstufe.zeit + 1);
  assert.equal(ritter.art, 'paladin', 'derselbe Reiter, zweimal ausgetauscht');
  assert.equal(ritter.leben, EINHEITEN.paladin.leben);
  // Wer jetzt einen Ritter bestellt, bekommt einen Paladin - zum Preis des Ritters.
  const gold = welt.spielerVon('a').gold;
  assert.deepEqual(bestellen(stall, 'ritter'), {});
  assert.equal(stall.schlange.at(-1), 'paladin');
  assert.equal(gold - welt.spielerVon('a').gold, EINHEITEN.ritter.kosten.gold);
});

// ---- Schuetzen und Belagerung der Krone (F2) ----------------------------------

// Wie STUFEN: Stufe, Vorstufe, Verbesserung, Gebaeude, was davor erforscht sein muss.
const STUFEN_F2 = [
  ['langbogenschuetze', 'bogenschuetze2', 'langbogenstufe', 'schiessanlage', ['bogenstufe']],
  ['schwerearmbrust', 'armbrustschuetze', 'armbruststufe', 'schiessanlage', []],
  ['belagerungsramme', 'ramme', 'rammenstufe', 'belagerungswerkstatt', []],
  ['onager', 'mangonel', 'onagerstufe', 'belagerungswerkstatt', []],
];

/** Eine Stufe tauscht aus: die stehende Einheit, die in der Schlange und jede spaetere. */
function tauschtAus([stufe, vorstufe, verbesserung, gebaeudeArt, davor]) {
  const { welt, bauen, bestellen, neben } = reich(3, davor);
  const gebaeude = bauen(gebaeudeArt);
  assert.ok(GEBAEUDE[gebaeudeArt].bildetAus.includes(verbesserung), verbesserung);
  const alter = neben(0, vorstufe);
  alter.leben -= 10;
  assert.deepEqual(bestellen(gebaeude, verbesserung), {}, verbesserung);
  assert.deepEqual(bestellen(gebaeude, vorstufe), {});
  sekunden(welt, VERBESSERUNGEN[verbesserung].zeit + 1);
  assert.equal(alter.art, stufe, `${vorstufe} wird ${stufe}`);
  assert.equal(alter.leben, EINHEITEN[stufe].leben - 10, 'das Leben waechst mit, der Schaden bleibt');
  assert.deepEqual(gebaeude.schlange, [stufe]);
  let grund = stufe;
  while (EINHEITEN[grund].stufeVon) grund = EINHEITEN[grund].stufeVon;
  assert.deepEqual(bestellen(gebaeude, grund), {});
  assert.equal(gebaeude.schlange.at(-1), stufe, `${grund} heisst jetzt ${stufe}`);
  assert.match(bestellen(gebaeude, verbesserung).fehler, /nur einmal/);
  // Im Fuerstentum gibt es sie nicht.
  const frueh = reich(2, davor);
  assert.match(frueh.bestellen(frueh.bauen(gebaeudeArt), verbesserung).fehler, /ab der Krone/, verbesserung);
}

/** Preis, Tempo, Ausbildungszeit und Klassen bleiben die der Vorstufe. */
function wieVorstufe([stufe, vorstufe]) {
  const neu = EINHEITEN[stufe];
  const alt = EINHEITEN[vorstufe];
  assert.equal(neu.stufeVon, vorstufe, stufe);
  assert.equal(neu.zeitalter, 3, stufe);
  assert.deepEqual([neu.kosten, neu.tempo, neu.zeit, neu.klassen], [alt.kosten, alt.tempo, alt.zeit, alt.klassen], `${stufe}: wie ${vorstufe}`);
  assert.ok(neu.leben > alt.leben, `${stufe}: mehr Leben`);
}
const preis = (v) => [VERBESSERUNGEN[v].kosten, VERBESSERUNGEN[v].zeit, VERBESSERUNGEN[v].zeitalter];

test('einheiten AC-67: Langbogenschuetze und schwere Armbrust - Werte, Preis der Stufe, und jede tauscht ihre Vorstufe aus', () => {
  const l = EINHEITEN.langbogenschuetze;
  const s = EINHEITEN.schwerearmbrust;
  assert.deepEqual([l.leben, l.angriff, l.reichweite, l.nachladen], [40, 6, 5, 2]);
  assert.deepEqual([s.leben, s.angriff, s.reichweite, s.nachladen], [40, 13, 5, 3.7]);
  // Die Rollen bleiben (einheiten AC-34, AC-58): der Bogen traegt den Zuschlag
  // gegen Speere, die Armbrust den schweren Bolzen.
  assert.deepEqual(l.bonus, { speer: 3 });
  assert.equal(s.bonus, undefined);
  assert.deepEqual(preis('langbogenstufe'), [{ nahrung: 450, gold: 350 }, 50, 3]);
  assert.deepEqual(preis('armbruststufe'), [{ nahrung: 400, gold: 350 }, 50, 3]);
  // Der Langbogen ist die dritte Stufe seiner Linie und verlangt die zweite.
  assert.equal(VERBESSERUNGEN.langbogenstufe.vorstufe, 'bogenstufe');
  const ohne = reich(3);
  assert.match(ohne.bestellen(ohne.bauen('schiessanlage'), 'langbogenstufe').fehler, /erst nach „Bogenschütze"/);
  for (const zeile of STUFEN_F2.slice(0, 2)) {
    wieVorstufe(zeile);
    tauschtAus(zeile);
  }
  // Der Eliteplaenkler bekommt keine weitere Stufe.
  assert.ok(!Object.values(EINHEITEN).some((e) => e.stufeVon === 'eliteplaenkler'));
});

test('einheiten AC-67: gegen Geruestete schlaegt der Bolzen haerter, gegen Speere der Pfeil - und der Eibenschuetze reicht voll erforscht am weitesten', () => {
  const { welt } = reich(3);
  const schaden = (wer, wen) => welt.schaden({ besitzer: 'a', art: wer }, { besitzer: 'b', art: wen }, false);
  const jeSekunde = (wer, wen) => schaden(wer, wen) / EINHEITEN[wer].nachladen;
  // Gegen 3 Fernruestung des Paladins: 10 in 3,5 s gegen 3 in 2 s.
  assert.equal(schaden('schwerearmbrust', 'paladin'), 13 - 3);
  assert.equal(schaden('langbogenschuetze', 'paladin'), 6 - 3);
  assert.ok(jeSekunde('schwerearmbrust', 'paladin') > jeSekunde('langbogenschuetze', 'paladin'));
  // Gegen den Hellebardier traegt der Zuschlag gegen Speere: 9 in 2 s gegen 13 in 3,5 s.
  assert.equal(schaden('langbogenschuetze', 'hellebardier'), 6 + 3);
  assert.ok(jeSekunde('langbogenschuetze', 'hellebardier') > jeSekunde('schwerearmbrust', 'hellebardier'));
  // Und jede schiesst haerter als ihre Vorstufe.
  assert.ok(schaden('langbogenschuetze', 'miliz') > schaden('bogenschuetze2', 'miliz'));
  assert.ok(schaden('schwerearmbrust', 'miliz') > schaden('armbrustschuetze', 'miliz'));

  // Eschenbruch in der Krone, alles erforscht: keine Einheit reicht weiter
  // als der Eibenschuetze (einheiten AC-42) - auch der Onager nicht.
  const esche = new Welt(ZWEI, 7, { haeuser: { a: 'eschenbruch' } });
  const anna = esche.spielerVon('a');
  for (let stufe = 1; stufe <= 3; stufe++) {
    anna.zeitalter = stufe;
    esche.zeitalterWirkungen?.(anna);
  }
  anna.verbesserungen.push(...Object.keys(VERBESSERUNGEN));
  const weit = esche.einheitenwert('a', 'eibenschuetze', 'reichweite');
  for (const art of Object.keys(EINHEITEN)) {
    if (art === 'eibenschuetze') continue;
    assert.ok(esche.einheitenwert('a', art, 'reichweite') < weit, `${art} reicht ${esche.einheitenwert('a', art, 'reichweite')}, der Eibenschuetze ${weit}`);
  }
});

test('einheiten AC-68: Belagerungsramme und Onager - Werte, Preis der Stufe, und jede tauscht ihre Vorstufe aus', () => {
  const r = EINHEITEN.belagerungsramme;
  const o = EINHEITEN.onager;
  assert.deepEqual([r.leben, r.angriff, `${r.nahruestung}/${r.fernruestung}`, r.bonus.gebaeude], [270, 4, '0/195', 175]);
  assert.deepEqual([r.nurGebaeude, r.wacht], [true, false], 'sie bleibt eine Ramme');
  assert.deepEqual([o.leben, o.angriff, `${o.nahruestung}/${o.fernruestung}`, o.reichweite], [60, 55, '0/8', 8]);
  assert.deepEqual([o.mindestreichweite, o.flaeche, o.geschoss, o.nachladen],
    [EINHEITEN.mangonel.mindestreichweite, EINHEITEN.mangonel.flaeche, EINHEITEN.mangonel.geschoss, EINHEITEN.mangonel.nachladen], 'er wirft wie der Mangonel');
  assert.deepEqual(preis('rammenstufe'), [{ nahrung: 1000 }, 75, 3]);
  assert.deepEqual(preis('onagerstufe'), [{ nahrung: 800, gold: 500 }, 75, 3]);
  for (const zeile of STUFEN_F2.slice(2)) {
    wieVorstufe(zeile);
    tauschtAus(zeile);
  }
  // Jedes Kuerzel gibt es weiterhin einmal.
  const kuerzel = Object.values(EINHEITEN).map((e) => e.kuerzel).filter(Boolean);
  assert.equal(new Set(kuerzel).size, kuerzel.length);
});

test('einheiten AC-68: die Belagerungsramme stoesst mit 179, und der Onager wirft ein Feld weiter und trifft mit 55', () => {
  const { welt, anna } = reich(3);
  const [x, y] = platz(welt, anna, 'burg', 10);
  const kaserne = welt.gebaeudeAnlegen('b', 'kaserne', x, y);
  const ramme = welt.einheitAnlegen('a', x - 1, y, 'belagerungsramme');
  // 4 Angriff + 175 gegen Gebaeude - 0 Nahruestung der Kaserne.
  assert.equal(welt.schaden(ramme, kaserne, true), 179);
  assert.equal(welt.schaden({ besitzer: 'a', art: 'ramme' }, kaserne, true), 127, 'die Ramme davor: 127');
  // Pfeile ritzen sie weiterhin nur, auch die der schweren Armbrust.
  assert.equal(welt.schaden({ besitzer: 'b', art: 'schwerearmbrust' }, ramme, false), 1);
  // Der Befehl auf das Gebaeude ist ein Angriff, und jeder Stoss nimmt 179.
  welt.sichtAktualisieren();
  welt.befehl('a', [ramme.id], { x: kaserne.x, y: kaserne.y });
  assert.equal(ramme.auftrag?.art, 'angreifen');
  const voll = kaserne.leben;
  sekunden(welt, 12);
  const verlust = voll - kaserne.leben;
  assert.ok(verlust >= 179 && verlust % 179 === 0, `Stoesse zu 179, nicht ${verlust}`);

  // Der Onager: 55 gegen einen Ungeruesteten, und auf acht Felder wirft er
  // aus dem Stand - der Mangonel muesste erst heranfahren.
  const wurf = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  const [wx, wy] = platz(wurf, wurf.spielerVon('a'), 'burg', 10);
  const stellen = (besitzer, art, sx, sy) => {
    const e = wurf.einheitAnlegen(besitzer, sx, sy, art);
    e.leben = 1000;
    return e;
  };
  const onager = stellen('a', 'onager', wx, wy);
  const mangonel = stellen('a', 'mangonel', wx, wy + 3);
  const ziel = stellen('b', 'dorfbewohner', wx + 8, wy);
  const zweites = stellen('b', 'dorfbewohner', wx + 8, wy + 3);
  const voller = 55 - EINHEITEN.dorfbewohner.fernruestung;
  assert.equal(wurf.schaden(onager, ziel, false), voller);
  wurf.befehl('a', [onager.id], { x: ziel.x, y: ziel.y });
  wurf.befehl('a', [mangonel.id], { x: zweites.x, y: zweites.y });
  wurf.takten();
  assert.equal(wurf.einschlaege.length, 1, 'nur der Onager wirft sofort');
  assert.deepEqual([onager.x, onager.y], [wx, wy], 'er steht dabei');
  assert.ok(mangonel.weg.length > 0, 'der Mangonel faehrt heran');
  sekunden(wurf, 2);
  assert.equal(1000 - ziel.leben, voller, 'der Stein des Onagers trifft voll');
});

// ---- Die Verbesserungen der Krone (F3) ----------------------------------------

// Verbesserung, Gebaeude, Vorstufe, Kosten, Dauer - wie in der Spec.
const KRONE_F3 = [
  ['hochofen', 'schmiede', 'eisenguss', { nahrung: 275, gold: 225 }, 100],
  ['armschiene', 'schmiede', 'bodkinpfeil', { nahrung: 300, gold: 200 }, 40],
  ['plattenpanzer', 'schmiede', 'kettenpanzer', { nahrung: 300, gold: 150 }, 70],
  ['plattenharnisch', 'schmiede', 'kettenharnisch', { nahrung: 350, gold: 200 }, 75],
  ['ringpanzer', 'schmiede', 'lederruestung', { nahrung: 250, gold: 250 }, 70],
  ['fruchtwechsel', 'muehle', 'schwererPflug', { nahrung: 250, holz: 250 }, 70],
  ['zweimannsaege', 'holzfaellerlager', 'bogensaege', { nahrung: 300, holz: 200 }, 100],
  ['chemie', 'universitaet', undefined, { nahrung: 300, gold: 200 }, 100],
  ['bergfried', 'universitaet', 'wehrturm', { nahrung: 500, holz: 350 }, 75],
  ['architektur', 'universitaet', 'mauerwerk', { nahrung: 300, holz: 200 }, 70],
  ['belagerungsingenieure', 'universitaet', undefined, { nahrung: 500, holz: 600 }, 45],
  ['wehrpflicht', 'burg', undefined, { nahrung: 150, gold: 150 }, 60],
];
const { bringt } = require('../server/spiele/strategie/bringt.js');
const { GEBAEUDE_NAMEN } = require('../server/spiele/strategie/welt.js');
const { readFileSync } = require('node:fs');
const LEISTE = readFileSync(new URL('../public/auswahlleiste.js', import.meta.url), 'utf8');
const saetze = (art) => bringt(VERBESSERUNGEN[art], GEBAEUDE_NAMEN);

/** Preis, Dauer, Vorstufe, Gebaeude, Knopfbild - und der Weg durch die Schlange. */
function erforschbar([art, gebaeudeArt, vorstufe, kosten, zeit]) {
  const v = VERBESSERUNGEN[art];
  assert.deepEqual([v.kosten, v.zeit, v.zeitalter, v.vorstufe], [kosten, zeit, 3, vorstufe], art);
  assert.ok(GEBAEUDE[gebaeudeArt].bildetAus.includes(art), `${art} steht in ${gebaeudeArt}`);
  assert.ok(new RegExp(`\\n  ${v.zeichen}\\(s, g`).test(LEISTE), `${art}: das Knopfbild ${v.zeichen} ist gezeichnet`);
  assert.ok(saetze(art).length > 0, `${art}: die Tafel sagt, was es bringt`);
  const davor = vorstufe ? [vorstufe] : [];
  // Ohne die Vorstufe nicht, und nicht vor der Krone.
  if (vorstufe) {
    const ohne = reich(3);
    assert.match(ohne.bestellen(ohne.bauen(gebaeudeArt), art).fehler, new RegExp(`erst nach „${VERBESSERUNGEN[vorstufe].name}"`), art);
  }
  const frueh = reich(2, davor);
  assert.match(frueh.bestellen(frueh.bauen(gebaeudeArt), art).fehler, /ab der Krone/, art);
  // Bestellt, bezahlt, und nach der Dauer erforscht - einmal.
  const { welt, anna, bauen, bestellen } = reich(3, davor);
  const gebaeude = bauen(gebaeudeArt);
  assert.deepEqual(bestellen(gebaeude, art), {}, art);
  for (const [rohstoff, menge] of Object.entries(kosten)) assert.equal(anna[rohstoff], 5000 - menge, `${art}: ${rohstoff}`);
  sekunden(welt, zeit - 1);
  assert.ok(!anna.verbesserungen.includes(art), `${art}: noch nicht`);
  sekunden(welt, 2);
  assert.ok(anna.verbesserungen.includes(art), `${art}: erforscht`);
  assert.match(bestellen(gebaeude, art).fehler, /nur einmal/);
}
/** Die Welt eines Spielers der Krone, der genau das erforscht hat. */
const mit = (...erforscht) => reich(3, erforscht).welt;
const wert = (welt, art, feld) => welt.einheitenwert('a', art, feld);

test('bauen AC-48: die Schmiede der Krone - Hochofen, Armschiene und drei Ruestungen, jede nach ihrer Vorstufe', () => {
  for (const zeile of KRONE_F3.slice(0, 5)) erforschbar(zeile);

  // Hochofen: Fussvolk und Reiter +2 Angriff, Schuetzen nicht.
  const vor = mit('eisenguss');
  const ofen = mit('eisenguss', 'hochofen');
  for (const art of ['zweihandkaempfer', 'hellebardier', 'paladin', 'husar']) {
    assert.equal(wert(ofen, art, 'angriff'), wert(vor, art, 'angriff') + 2, art);
  }
  assert.equal(wert(ofen, 'langbogenschuetze', 'angriff'), wert(vor, 'langbogenschuetze', 'angriff'));
  assert.deepEqual(saetze('hochofen'), ['Infanterie und Kavallerie: +2 Angriff']);

  // Armschiene: Schuetzen +1 Angriff und ein Feld weiter.
  const pfeil = mit('bodkinpfeil');
  const schiene = mit('bodkinpfeil', 'armschiene');
  for (const art of ['langbogenschuetze', 'schwerearmbrust', 'eliteplaenkler']) {
    assert.equal(wert(schiene, art, 'angriff'), wert(pfeil, art, 'angriff') + 1, art);
    assert.equal(wert(schiene, art, 'reichweite'), wert(pfeil, art, 'reichweite') + 1, art);
  }
  assert.equal(wert(schiene, 'paladin', 'angriff'), wert(pfeil, 'paladin', 'angriff'));
  assert.deepEqual(saetze('armschiene'), ['Bogenschützen: +1 Angriff, +1 Reichweite']);

  // Die drei Ruestungen: +1 gegen Nah, +2 gegen Fern, jede fuer ihre Klasse.
  for (const [art, vorstufe, traeger, anderer, klasse] of [
    ['plattenpanzer', 'kettenpanzer', 'zweihandkaempfer', 'paladin', 'Infanterie'],
    ['plattenharnisch', 'kettenharnisch', 'paladin', 'zweihandkaempfer', 'Kavallerie'],
    ['ringpanzer', 'lederruestung', 'schwerearmbrust', 'zweihandkaempfer', 'Bogenschützen'],
  ]) {
    const alt = mit(vorstufe);
    const neu = mit(vorstufe, art);
    assert.equal(wert(neu, traeger, 'nahruestung'), wert(alt, traeger, 'nahruestung') + 1, art);
    assert.equal(wert(neu, traeger, 'fernruestung'), wert(alt, traeger, 'fernruestung') + 2, art);
    assert.equal(wert(neu, anderer, 'fernruestung'), wert(alt, anderer, 'fernruestung'), `${art} gilt nur ${klasse}`);
    assert.deepEqual(saetze(art), [`${klasse}: +1 / +2 Rüstung`]);
  }
  // Und im Kampf kommt es an: der Bolzen der Armbrust nimmt dem Geruesteten zwei weniger.
  const pfeilschaden = (welt) => welt.schaden({ besitzer: 'b', art: 'armbrustschuetze' }, { besitzer: 'a', art: 'zweihandkaempfer' }, false);
  assert.equal(pfeilschaden(mit('kettenpanzer')) - pfeilschaden(mit('kettenpanzer', 'plattenpanzer')), 2);
});

test('bauen AC-49: Fruchtwechsel gibt jeder neuen Farm 175 Nahrung mehr, die Zweimannsaege 10 % mehr Holz', () => {
  for (const zeile of KRONE_F3.slice(5, 7)) erforschbar(zeile);

  const pflug = mit('schwererPflug');
  const wechsel = mit('schwererPflug', 'fruchtwechsel');
  assert.equal(wechsel.farmNahrung('a'), pflug.farmNahrung('a') + 175);
  assert.equal(wechsel.farmNahrung('b'), GEBAEUDE.farm.nahrung, 'nur wer es erforscht hat');
  // Eine Farm, die danach angelegt wird, traegt es auch.
  const anna = wechsel.spielerVon('a');
  const farm = wechsel.gebaeudeAnlegen('a', 'farm', ...platz(wechsel, anna, 'farm'));
  assert.equal(farm.nahrung, pflug.farmNahrung('a') + 175);
  assert.deepEqual(saetze('fruchtwechsel'), ['Jede neue Farm trägt 175 Nahrung mehr']);

  const saege = mit('bogensaege');
  const zwei = mit('bogensaege', 'zweimannsaege');
  assert.ok(Math.abs(zwei.sammelrate('a', 'holz', 1) / saege.sammelrate('a', 'holz', 1) - 1.1) < 1e-9);
  assert.equal(zwei.sammelrate('a', 'gold', 1), saege.sammelrate('a', 'gold', 1), 'nur Holz');
  assert.deepEqual(saetze('zweimannsaege'), ['Holz wird 10 % schneller gesammelt']);
});

test('bauen AC-50: Chemie, Bergfried und Architektur - was schiesst, schiesst haerter, der Turm waechst ein zweites Mal, jedes Gebaeude haelt mehr', () => {
  for (const zeile of KRONE_F3.slice(7, 10)) erforschbar(zeile);

  // Chemie: Schuetzen, Tuerme und Burg +1 Angriff - ein Haus schiesst weiterhin nicht.
  const ohne = mit();
  const chemie = mit('chemie');
  for (const art of ['langbogenschuetze', 'schwerearmbrust', 'eibenschuetze']) {
    assert.equal(wert(chemie, art, 'angriff'), wert(ohne, art, 'angriff') + 1, art);
  }
  assert.equal(wert(chemie, 'paladin', 'angriff'), wert(ohne, 'paladin', 'angriff'));
  for (const art of ['wachturm', 'burg']) {
    assert.equal(chemie.gebaeudewert('a', art, 'angriff'), ohne.gebaeudewert('a', art, 'angriff') + 1, art);
  }
  assert.equal(chemie.gebaeudewert('a', 'haus', 'angriff'), 0);
  assert.deepEqual(saetze('chemie'), ['Bogenschützen: +1 Angriff', 'Wachturm und Burg: +1 Angriff']);

  // Bergfried: auf den Wehrturm noch einmal 750 Leben, +1 Angriff, +1/+1 -
  // und der Turm, der schon steht, heisst so.
  const wehr = mit('wehrturm');
  const berg = reich(3, ['wehrturm']);
  const turm = berg.welt.gebaeudeAnlegen('a', 'wachturm', ...platz(berg.welt, berg.anna, 'wachturm'));
  const universitaet = berg.bauen('universitaet');
  assert.deepEqual(berg.bestellen(universitaet, 'bergfried'), {});
  sekunden(berg.welt, VERBESSERUNGEN.bergfried.zeit + 1);
  const felder = ['leben', 'angriff', 'nahruestung', 'fernruestung'];
  assert.deepEqual(felder.map((f) => berg.welt.gebaeudewert('a', 'wachturm', f) - wehr.gebaeudewert('a', 'wachturm', f)), [750, 1, 1, 1]);
  assert.equal(berg.welt.gebaeudewert('a', 'wachturm', 'leben'), GEBAEUDE.wachturm.leben + 480 + 750);
  assert.equal(turm.leben, GEBAEUDE.wachturm.leben + 480 + 750, 'der stehende Turm waechst mit');
  assert.equal(berg.welt.kampfwerte('a').wachturm.name, 'Bergfried');
  assert.equal(berg.welt.kampfwerte('a').wachturm.bild, 'bergfried', 'und er bekommt sein eigenes Bild');
  assert.equal(wehr.kampfwerte('a').wachturm.bild, 'wehrturm');
  assert.equal(wehr.kampfwerte('a').wachturm.name, 'Wehrturm');
  assert.equal(berg.welt.kampfwerte('b').wachturm.name, undefined, 'beim Gegner bleibt es der Wachturm');
  assert.deepEqual(saetze('bergfried'), ['Der Wehrturm wird Bergfried: +750 Leben, +1 Angriff, +1 / +1 Rüstung – auch jeder, der schon steht']);

  // Architektur: noch einmal ein Zehntel Leben und +1/+1 auf das Mauerwerk.
  const mauer = mit('mauerwerk');
  const bau = mit('mauerwerk', 'architektur');
  assert.equal(mauer.gebaeudewert('a', 'haus', 'leben'), Math.round(GEBAEUDE.haus.leben * 1.1));
  assert.equal(bau.gebaeudewert('a', 'haus', 'leben'), Math.round(GEBAEUDE.haus.leben * 1.2));
  for (const feld of ['nahruestung', 'fernruestung']) {
    assert.equal(bau.gebaeudewert('a', 'burg', feld), mauer.gebaeudewert('a', 'burg', feld) + 1, feld);
  }
  assert.deepEqual(saetze('architektur'), ['Gebäude: +10 % Leben, +1 / +1 Rüstung']);
});

test('bauen AC-50: Belagerungsingenieure - was wirft, wirft ein Feld weiter, und jede Belagerungswaffe richtet an Gebaeuden ein Fuenftel mehr an', () => {
  erforschbar(KRONE_F3[10]);
  const ohne = reich(3);
  const ing = reich(3, ['belagerungsingenieure']);
  // Reichweite: Mangonel und Onager, die Ramme nicht.
  assert.deepEqual(['mangonel', 'onager', 'ramme'].map((art) => wert(ing.welt, art, 'reichweite') - wert(ohne.welt, art, 'reichweite')), [1, 1, 0]);
  assert.deepEqual([wert(ing.welt, 'mangonel', 'reichweite'), wert(ing.welt, 'onager', 'reichweite')], [8, 9]);
  // Der Zuschlag: ein Fuenftel auf Angriff samt Zuschlag gegen Gebaeude.
  const gegen = (reichMit, art) => {
    const kaserne = reichMit.kaserne || (reichMit.kaserne = reichMit.welt.gebaeudeAnlegen('b', 'kaserne', ...platz(reichMit.welt, reichMit.anna, 'burg', 10)));
    return reichMit.welt.schaden({ besitzer: 'a', art }, kaserne, true);
  };
  assert.deepEqual([gegen(ohne, 'ramme'), gegen(ing, 'ramme')], [127, 152]);
  assert.deepEqual([gegen(ohne, 'belagerungsramme'), gegen(ing, 'belagerungsramme')], [179, 215]);
  assert.equal(gegen(ing, 'mangonel') - gegen(ohne, 'mangonel'), 8);
  assert.equal(gegen(ing, 'onager') - gegen(ohne, 'onager'), 11);
  // Nur Belagerung, und nur gegen Gebaeude.
  assert.equal(gegen(ing, 'paladin'), gegen(ohne, 'paladin'));
  const mann = (welt, art) => welt.schaden({ besitzer: 'a', art }, { besitzer: 'b', art: 'miliz' }, false);
  assert.equal(mann(ing.welt, 'onager'), mann(ohne.welt, 'onager'));
  // Die Leiste bekommt den Zuschlag des Besitzers in der Tafel.
  assert.deepEqual(ing.welt.kampfwerte('a').ramme.bonus, { gebaeude: 150 });
  assert.equal(ohne.welt.kampfwerte('a').ramme.bonus, undefined);
  assert.deepEqual(saetze('belagerungsingenieure'), ['Wurfmaschinen: +1 Reichweite', 'Belagerung: +20 % Schaden an Gebäuden']);
});

test('bauen AC-50: Wehrpflicht - Kaserne, Schiessanlage, Stall und Burg bilden ein Drittel schneller aus, geforscht wird wie zuvor', () => {
  erforschbar(KRONE_F3[11]);
  const ohne = reich(3);
  const pflicht = reich(3, ['wehrpflicht']);
  for (const art of ['kaserne', 'schiessanlage', 'stall', 'burg']) {
    assert.equal(pflicht.welt.ausbildungstempo('a', art), 1.33, art);
    assert.equal(ohne.welt.ausbildungstempo('a', art), 1, art);
  }
  for (const art of ['dorfzentrum', 'belagerungswerkstatt', 'kloster', 'markt']) assert.equal(pflicht.welt.ausbildungstempo('a', art), 1, art);
  assert.equal(pflicht.welt.ausbildungstempo('b', 'kaserne'), 1, 'nur wer es erforscht hat');

  // Im Spiel: der Speerkaempfer steht nach drei Vierteln der Zeit, ohne Wehrpflicht nicht.
  const zeit = EINHEITEN.speerkaempfer.zeit;
  const speere = (r) => [...r.welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'speerkaempfer').length;
  for (const r of [ohne, pflicht]) {
    r.kaserne = r.bauen('kaserne');
    assert.deepEqual(r.bestellen(r.kaserne, 'speerkaempfer'), {});
    sekunden(r.welt, Math.ceil(zeit / 1.33) + 1);
  }
  assert.deepEqual([speere(ohne), speere(pflicht)], [0, 1]);
  // Forschung in der Kaserne dauert, was sie dauert.
  const dauer = VERBESSERUNGEN.pikenierstufe.zeit;
  assert.deepEqual(pflicht.bestellen(pflicht.kaserne, 'pikenierstufe'), {});
  sekunden(pflicht.welt, dauer - 2);
  assert.ok(!pflicht.anna.verbesserungen.includes('pikenierstufe'), 'die Forschung ist nicht schneller');
  sekunden(pflicht.welt, 3);
  assert.ok(pflicht.anna.verbesserungen.includes('pikenierstufe'));
  assert.deepEqual(saetze('wehrpflicht'), ['Kaserne, Schießanlage, Stall und Burg bilden 33 % schneller aus']);
});

test('bauen AC-48 bis AC-50: jedes Knopfbild der Krone gibt es einmal, und jedes ist in der Leiste gezeichnet', () => {
  const zeichen = Object.values(VERBESSERUNGEN).map((v) => v.zeichen).filter(Boolean);
  assert.equal(new Set(zeichen).size, zeichen.length, 'kein Zeichen zweimal');
  for (const [art] of KRONE_F3) assert.ok(VERBESSERUNGEN[art].zeichen, `${art} hat ein Zeichen`);
  // Wer `zeichen` traegt, dessen Bild steht in der Leiste.
  for (const z of zeichen) assert.ok(new RegExp(`\\n  ${z}\\(s, g`).test(LEISTE), `Zeichen ${z} ist gezeichnet`);
});
