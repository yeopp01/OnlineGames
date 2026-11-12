// Der Mannschaftsbonus gilt nur im Buendnis (→ specs/10-strategie/spielziel.md
// AC-25, ADR-0014 Punkt 6).
//
// Jedes Haus traegt neben seinen Boni einen Mannschaftsbonus (`mannschaft`
// in `HAEUSER`): er gilt dem Haus selbst und allen, mit denen es die Sicht
// teilt, je Haus einmal. Wer kuendigt, verliert ihn im selben Takt in beide
// Richtungen - in der Frist ist man kein Gegner, aber auch kein Verbuendeter.
//
// Gespielt wird zu dritt: Anna (ohne Haus) und Bert im Team, Carla allein
// dagegen. Bert traegt das Haus, dessen Bonus gemessen wird; verglichen wird
// Anna mit Carla und Anna vor und nach der Kuendigung. Die Boni kommen aus
// den Daten - ein Mannschaftsbonus in einer Form ohne Messung bricht.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE, HAEUSER, VERBESSERUNGEN } = require('../server/spiele/strategie/daten.js');

const DREI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }, { id: 'c', name: 'Carla' }];
const TEAMS = { a: 1, b: 1, c: 2 };
const ROHSTOFFE = ['holz', 'nahrung', 'gold', 'stein'];

/** Anna und Bert im Team, Carla dagegen; `haeuser` je Spieler. */
const weltMit = (haeuser, einstellungen = {}) => new Welt(DREI, 7, {
  sicht: 'aufgedeckt', teams: TEAMS, haeuser, ...einstellungen,
});

// Ein freier Bauplatz fuer `art`, ringweise um `um`, mindestens `ab` Felder weg.
function platz(welt, art, um, ab = 6) {
  for (let r = ab; r < ab + 40; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (const dy of [-r, r]) {
        if (welt.platzPruefen(art, um.x + dx, um.y + dy)) return { x: um.x + dx, y: um.y + dy };
        if (welt.platzPruefen(art, um.x + dy, um.y + dx)) return { x: um.x + dy, y: um.y + dx };
      }
    }
  }
  throw new Error(`kein Platz fuer ${art}`);
}

/** Ein fertiges Gebaeude `art` fuer `wer`, mit Rohstoffen und Wohnraum dazu. */
function gebaeudeFuer(welt, wer, art) {
  const spieler = welt.spielerVon(wer);
  for (const r of ROHSTOFFE) spieler[r] = 5000;
  spieler.zeitalter = Math.max(spieler.zeitalter, GEBAEUDE[art].zeitalter || 0);
  const h = platz(welt, 'haus', spieler.basis, 4);
  welt.gebaeudeAnlegen(wer, 'haus', h.x, h.y);
  const p = platz(welt, art, spieler.basis);
  return welt.gebaeudeAnlegen(wer, art, p.x, p.y);
}

/** Takte, bis aus `gebaeude` die naechste Einheit `art` kommt. */
function ausbildungsTakte(welt, gebaeude, art) {
  const spieler = welt.spielerVon(gebaeude.besitzer);
  spieler.zeitalter = Math.max(spieler.zeitalter, EINHEITEN[art].zeitalter || 0);
  const vorher = new Set(welt.einheiten.keys());
  assert.deepEqual(welt.ausbilden(gebaeude.besitzer, gebaeude.id, art), {});
  for (let t = 1; t < 600 * TAKTE_PRO_SEKUNDE; t++) {
    welt.takten();
    if ([...welt.einheiten.values()].some((e) => !vorher.has(e.id) && e.art === art)) return t;
  }
  throw new Error(`${art} nicht ausgebildet`);
}

const kuendigen = (welt, wer) => assert.deepEqual(welt.nachricht(wer, { auftrag: 'kuendigen' }), {});
const ersteArt = (gebaeudeArt) => GEBAEUDE[gebaeudeArt].bildetAus[0];
const artFuer = (schluessel) => (EINHEITEN[schluessel] ? schluessel
  : Object.keys(EINHEITEN).find((art) => EINHEITEN[art].klassen?.includes(schluessel)));

// Die Blaetter eines Mannschaftsbonus: [Form, ...Weg, Wert].
function blaetter(bonus = {}) {
  const liste = [];
  for (const [form, inhalt] of Object.entries(bonus)) {
    for (const [a, b] of Object.entries(inhalt)) {
      if (typeof b === 'object') for (const [feld, wert] of Object.entries(b)) liste.push([form, a, feld, wert]);
      else liste.push([form, a, b]);
    }
  }
  return liste;
}

// ---- die Messungen, je Form ----------------------------------------------

/** Wie viele Felder rechts der Sache (Einheit oder Gebaeude von Anna) im Nebel gesehen werden. */
function sichtNachRechts(welt, x, y) {
  // Die Sicht rechnet nicht jeden Takt neu (`SICHT_TAKTE`) - eine Sekunde reicht.
  for (let t = 0; t < TAKTE_PRO_SEKUNDE; t++) welt.takten();
  let weit = 0;
  while (welt.sieht('a', x + weit + 1, y)) weit += 1;
  return weit;
}

// Ein Platz in der Mitte der Karte, fern von jedem Dorf - dort sieht sonst nichts hin.
function mitteFrei(welt, art) {
  const g = welt.karte.groesse;
  const p = platz(welt, art, { x: Math.floor(g / 2), y: Math.floor(g / 2) }, 0);
  for (const s of welt.spieler) assert.ok(Math.hypot(p.x - s.basis.x, p.y - s.basis.y) > 30, 'fern von jedem Dorf');
  return p;
}

/**
 * Gold der ersten Fahrt eines Karrens von Annas Markt zu `zielBesitzer`s
 * Markt. Mit `nachKuendigung` kuendigt Anna kurz bevor der Karren laedt: eine
 * Fahrt hin und her dauert laenger als die Frist von 60 Sekunden, danach
 * waeren die beiden Gegner und die Strecke zu Ende.
 */
function ersteFahrt(haeuser, zielBesitzer, nachKuendigung) {
  const welt = weltMit(haeuser);
  const anna = welt.spielerVon('a');
  anna.zeitalter = EINHEITEN.marktkarren.zeitalter || 0;
  const p = platz(welt, 'markt', anna.basis);
  const heimat = welt.gebaeudeAnlegen('a', 'markt', p.x, p.y);
  const q = platz(welt, 'markt', heimat, 35);
  const ziel = welt.gebaeudeAnlegen(zielBesitzer, 'markt', q.x, q.y);
  const karren = welt.einheitAnlegen('a', heimat.x + 3, heimat.y, 'marktkarren');
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [karren.id], ziel: q });
  assert.equal(karren.auftrag?.art, 'handel');
  const gold = anna.gold;
  if (nachKuendigung) {
    for (let t = 0; t < 300 * TAKTE_PRO_SEKUNDE && welt.abstandZu(karren, ziel) > 2; t++) welt.takten();
    assert.equal(karren.ladung || 0, 0, 'noch nicht geladen');
    kuendigen(welt, 'a');
  }
  for (let t = 0; t < 900 * TAKTE_PRO_SEKUNDE && anna.gold === gold; t++) welt.takten();
  assert.ok(anna.gold > gold, 'die erste Fahrt kam heim');
  return anna.gold - gold;
}

const OHNE_MESSUNG = (form, feld) => assert.fail(`Fuer den Mannschaftsbonus ${form}.${feld} gibt es keine Messung (spielziel AC-25).`);

// Je Form: (Haus, ...Weg, Wert) -> misst bei Anna mit Bert im Team, gegen
// Carla und nach Annas Kuendigung, und sagt, was er gemessen hat.
const PRUEFER = {
  ausbildung(haus, gebaeudeArt, faktor) {
    const art = ersteArt(gebaeudeArt);
    const messen = (kuendigt) => {
      const welt = weltMit({ b: haus });
      const anna = gebaeudeFuer(welt, 'a', gebaeudeArt);
      const carla = gebaeudeFuer(welt, 'c', gebaeudeArt);
      if (kuendigt) kuendigen(welt, 'a');
      return { anna: ausbildungsTakte(welt, anna, art), carla: ausbildungsTakte(welt, carla, art) };
    };
    const im = messen(false);
    const nach = messen(true);
    const grund = EINHEITEN[art].zeit * TAKTE_PRO_SEKUNDE;
    assert.equal(im.carla, grund, `${haus}: Carla bildet im alten Tempo aus`);
    assert.equal(im.anna, Math.ceil(grund / faktor - 1e-9), `${haus}: Anna bildet an der ${gebaeudeArt} schneller aus`);
    assert.equal(nach.anna, grund, `${haus}: nach der Kuendigung wieder im alten Tempo`);
    return `${gebaeudeArt}: ${art} in ${im.anna} statt ${grund} Takten, nach der Kuendigung ${nach.anna}`;
  },
  wirkung(haus, schluessel, feld, wert) {
    const art = artFuer(schluessel);
    assert.ok(art, `${haus}: "${schluessel}" trifft keine Einheit`);
    if (feld !== 'sicht') return OHNE_MESSUNG('wirkung', feld);
    const messen = (kuendigt) => {
      const welt = weltMit({ b: haus }, { sicht: 'nebel' });
      const p = mitteFrei(welt, 'haus');
      welt.einheitAnlegen('a', p.x, p.y, art);
      if (kuendigt) kuendigen(welt, 'a');
      return { weit: sichtNachRechts(welt, p.x, p.y), tafel: welt.kampfwerte('a')[art].sicht, carla: welt.einheitenwert('c', art, 'sicht') };
    };
    const im = messen(false);
    const nach = messen(true);
    assert.equal(im.weit - nach.weit, wert, `${haus}: Annas ${art} sieht im Buendnis weiter`);
    assert.equal(im.tafel - im.carla, wert, `${haus}: die Leiste zeigt es`);
    assert.equal(nach.tafel, im.carla, `${haus}: nach der Kuendigung wie bei Carla`);
    return `${art}: sieht ${im.weit} statt ${nach.weit} Felder weit`;
  },
  gebaeude(haus, feld, wert) {
    if (feld !== 'sicht') return OHNE_MESSUNG('gebaeude', feld);
    const messen = (kuendigt) => {
      const welt = weltMit({ b: haus }, { sicht: 'nebel' });
      const p = mitteFrei(welt, 'haus');
      const g = welt.gebaeudeAnlegen('a', 'haus', p.x, p.y);
      if (kuendigt) kuendigen(welt, 'a');
      const { x1, y0 } = welt.grundflaeche(g.art, g.x, g.y);
      return sichtNachRechts(welt, x1, y0);
    };
    const im = messen(false);
    const nach = messen(true);
    assert.equal(im - nach, wert, `${haus}: Annas Haus sieht im Buendnis weiter`);
    return `Haus: sieht ${im} statt ${nach} Felder ueber den Rand`;
  },
  handel(haus, feld, wert) {
    if (feld !== 'verbuendetAnteil') return OHNE_MESSUNG('handel', feld);
    const zumVerbuendeten = ersteFahrt({ b: haus }, 'b', false);
    const ohneHaus = ersteFahrt({}, 'b', false);
    const nachKuendigung = ersteFahrt({ b: haus }, 'b', true);
    const zuSichSelbst = ersteFahrt({ b: haus }, 'a', false);
    // Gerundet je Fahrt: der Bonus darf um ein Gold neben dem Anteil liegen.
    assert.ok(Math.abs(zumVerbuendeten - ohneHaus * (1 + wert)) <= 1 && zumVerbuendeten > ohneHaus, `${haus}: ${zumVerbuendeten} gegen ${ohneHaus}`);
    assert.equal(nachKuendigung, ohneHaus, `${haus}: in der Frist faehrt der Karren weiter, aber ohne den Bonus`);
    assert.equal(zuSichSelbst, ohneHaus, `${haus}: zwischen zwei eigenen Maerkten gilt er nicht`);
    // Traegt Anna das Haus selbst, behaelt sie nach der Kuendigung ihren
    // eigenen Mannschaftsbonus - zum Markt des frueheren Verbuendeten gilt er
    // trotzdem nicht mehr, nur noch das, was sie auch daheim bekaeme.
    const selbstDaheim = ersteFahrt({ a: haus }, 'a', false);
    const selbstIm = ersteFahrt({ a: haus }, 'b', false);
    const selbstNach = ersteFahrt({ a: haus }, 'b', true);
    assert.ok(selbstIm > selbstDaheim, `${haus}: auch fuer das Haus selbst, ${selbstIm} gegen ${selbstDaheim}`);
    assert.equal(selbstNach, selbstDaheim, `${haus}: nach der eigenen Kuendigung nicht mehr zum frueheren Verbuendeten`);
    return `Karren zum Verbuendeten: ${zumVerbuendeten} statt ${ohneHaus} Gold, nach der Kuendigung ${nachKuendigung}; `
      + `mit dem Haus selbst ${selbstIm} statt ${selbstDaheim}, danach ${selbstNach}`;
  },
};

test('spielziel AC-25: jeder Mannschaftsbonus wirkt beim Verbuendeten und endet mit der Kuendigung', () => {
  const gemessen = [];
  for (const [haus, eintrag] of Object.entries(HAEUSER)) {
    for (const [form, ...rest] of blaetter(eintrag.mannschaft)) {
      const pruefer = PRUEFER[form];
      assert.ok(pruefer, `${haus}: Mannschaftsbonus in der Form "${form}" ohne Messung`);
      gemessen.push(`${haus} - ${pruefer(haus, ...rest)}`);
    }
  }
  // Gegenprobe des Aufbaus: gemessen ist jedes Blatt, jedes Haus hat eins.
  for (const [haus, eintrag] of Object.entries(HAEUSER)) assert.ok(blaetter(eintrag.mannschaft).length > 0, `${haus} hat keinen Mannschaftsbonus`);
  assert.ok(gemessen.length >= 5, `Mannschaftsboni: ${gemessen.length}`);
  console.log(gemessen.join('\n'));
});

// Die Schiessanlage aus dem Kriterium, ausdruecklich und am Stueck: dieselbe
// Anlage bildet im Buendnis schneller aus und nach der Kuendigung im
// naechsten Auftrag wieder langsamer.
const SCHNELLER = Object.keys(HAEUSER).find((h) => HAEUSER[h].mannschaft?.ausbildung?.schiessanlage);

test('spielziel AC-25: Annas Schiessanlage bildet mit einem Verbuendeten des Hauses schneller aus, nach der Kuendigung im naechsten Auftrag langsamer', () => {
  assert.ok(SCHNELLER, 'ein Haus macht die Schiessanlage schneller');
  const welt = weltMit({ b: SCHNELLER });
  const anlage = gebaeudeFuer(welt, 'a', 'schiessanlage');
  const art = ersteArt('schiessanlage');
  const vorher = ausbildungsTakte(welt, anlage, art);
  kuendigen(welt, 'a');
  const nachher = ausbildungsTakte(welt, anlage, art);
  assert.ok(vorher < nachher, `${vorher} Takte im Buendnis, ${nachher} danach`);
  assert.equal(nachher, EINHEITEN[art].zeit * TAKTE_PRO_SEKUNDE);
  // Und es ist das Haus, nicht das Team: mit einem Verbuendeten ohne Haus
  // bildet dieselbe Anlage im alten Tempo aus.
  const ohne = weltMit({});
  assert.equal(ausbildungsTakte(ohne, gebaeudeFuer(ohne, 'a', 'schiessanlage'), art), nachher);
});

test('spielziel AC-25: der Bonus gilt dem Haus selbst, je Haus einmal - zwei Verbuendete desselben Hauses verdoppeln ihn nicht', () => {
  const faktor = HAEUSER[SCHNELLER].mannschaft.ausbildung.schiessanlage;
  const allein = new Welt(DREI, 7, { haeuser: { a: SCHNELLER } });
  assert.equal(allein.ausbildungstempo('a', 'schiessanlage'), faktor, 'allein, ohne Team: fuer das Haus selbst');
  const doppelt = weltMit({ a: SCHNELLER, b: SCHNELLER });
  assert.equal(doppelt.ausbildungstempo('a', 'schiessanlage'), faktor, 'zweimal dasselbe Haus im Team');
  assert.equal(doppelt.ausbildungstempo('b', 'schiessanlage'), faktor);
  assert.equal(doppelt.ausbildungstempo('c', 'schiessanlage'), 1, 'der Gegner hat nichts davon');
  // In beide Richtungen und nur fuer den, der geht: zu dritt im Team traegt
  // Anna das Haus; kuendigt Bert, verliert er Annas Bonus, Carla behaelt ihn.
  // Kuendigt danach Anna, verliert ihn auch Carla - Anna selbst nicht.
  const dritt = new Welt(DREI, 7, { teams: { a: 1, b: 1, c: 1 }, haeuser: { a: SCHNELLER } });
  assert.equal(dritt.ausbildungstempo('b', 'schiessanlage'), faktor);
  kuendigen(dritt, 'b');
  assert.equal(dritt.ausbildungstempo('b', 'schiessanlage'), 1, 'wer geht, verliert ihn');
  assert.equal(dritt.ausbildungstempo('c', 'schiessanlage'), faktor, 'wer bleibt, behaelt ihn');
  kuendigen(dritt, 'a');
  assert.equal(dritt.ausbildungstempo('c', 'schiessanlage'), 1, 'der Verlassene verliert ihn');
  assert.equal(dritt.ausbildungstempo('a', 'schiessanlage'), faktor, 'das Haus selbst behaelt ihn');
  // Zwei verschiedene Haeuser bringen beide ihren.
  const anderes = Object.keys(HAEUSER).find((h) => h !== SCHNELLER && HAEUSER[h].mannschaft?.ausbildung);
  if (anderes) {
    const [gebaeudeArt, f] = Object.entries(HAEUSER[anderes].mannschaft.ausbildung)[0];
    const beide = weltMit({ a: SCHNELLER, b: anderes });
    assert.equal(beide.ausbildungstempo('a', 'schiessanlage'), faktor);
    assert.equal(beide.ausbildungstempo('a', gebaeudeArt), f);
  }
  // Nur Einheiten: eine Verbesserung in einem schnelleren Gebaeude laeuft im
  // alten Tempo - gesucht in den Daten, an jedem Gebaeude mit Bonus.
  let verbesserungGeprueft = 0;
  for (const [haus, eintrag] of Object.entries(HAEUSER)) {
    for (const gebaeudeArt of Object.keys(eintrag.mannschaft?.ausbildung || {})) {
      const forschung = GEBAEUDE[gebaeudeArt].bildetAus.find((v) => VERBESSERUNGEN[v]);
      if (!forschung) continue;
      const welt = weltMit({ b: haus });
      const g = gebaeudeFuer(welt, 'a', gebaeudeArt);
      const anna = welt.spielerVon('a');
      anna.zeitalter = 3;
      for (const vorstufe of [VERBESSERUNGEN[forschung].vorstufe].filter(Boolean)) anna.verbesserungen.push(vorstufe);
      assert.deepEqual(welt.ausbilden('a', g.id, forschung), {});
      let t = 0;
      while (!anna.verbesserungen.includes(forschung)) { welt.takten(); t += 1; }
      assert.equal(t, VERBESSERUNGEN[forschung].zeit * TAKTE_PRO_SEKUNDE, `${haus}: ${forschung} an der ${gebaeudeArt}`);
      verbesserungGeprueft += 1;
    }
  }
  assert.ok(verbesserungGeprueft > 0, 'an einem Gebaeude mit Bonus gibt es eine Verbesserung');
});

test('spielziel AC-25: ein Mannschaftsbonus traegt nichts, was beim Kuendigen an Stehendem nachgezogen werden muesste', () => {
  // Leben und Nahrung gehen beim Ausbilden und Bauen in die Einheit, das
  // Gebaeude, die Farm ein; ein Bonus, der mit dem Buendnis endet, liesse sie
  // stehen. Sicht, Tempo der Ausbildung und Gold je Fahrt werden bei jeder
  // Frage neu gelesen.
  const VERBOTEN = new Set(['leben', 'lebenAnteil', 'nahrung']);
  for (const [haus, eintrag] of Object.entries(HAEUSER)) {
    for (const blatt of blaetter(eintrag.mannschaft)) {
      for (const teil of blatt.slice(0, -1)) assert.ok(!VERBOTEN.has(teil), `${haus}: Mannschaftsbonus mit ${blatt.join('.')}`);
      assert.ok(Object.hasOwn(PRUEFER, blatt[0]), `${haus}: Form ${blatt[0]}`);
    }
    assert.ok(!eintrag.mannschaft?.farm, `${haus}: Farm im Mannschaftsbonus`);
  }
});
