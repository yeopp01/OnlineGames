// Die Einheiten der Feudalzeit (einheiten AC-23) - Rechenteile, direkt
// geprueft (→ docs/adr/0004-teststrategie.md). Die Oberflaeche dazu steht in
// e2e/tests/strategie-feudaleinheiten.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, EINHEITEN, VERBESSERUNGEN } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const NEU = ['speerkaempfer', 'bogenschuetze', 'plaenkler'];

/** Eine Welt, in der Anna alles hat, was sie braucht. */
function bereit(zeitalter = 0) {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  anna.holz = 2000;
  anna.nahrung = 2000;
  anna.gold = 2000;
  anna.stein = 2000;
  anna.zeitalter = zeitalter;
  // Zwei Haeuser: ohne sie ist nach der fuenften Einheit Schluss, und die
  // Schlange wartet auf Platz statt auszubilden.
  for (let i = 0; i < 2; i++) {
    const p = platz(welt, anna);
    welt.gebaeudeAnlegen('a', 'haus', p.x, p.y);
  }
  return { welt, anna };
}

/** Ein freier Platz fuer ein Gebaeude, ringweise um die Basis. */
function platz(welt, anna) {
  for (let r = 6; r < 40; r++) {
    for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const x = anna.basis.x + r * sx;
      const y = anna.basis.y + r * sy;
      if (welt.platzPruefen('kaserne', x, y) && welt.platzPruefen('dorfzentrum', x, y)) return { x, y };
    }
  }
  throw new Error('kein Platz');
}

function zaehlen(welt, art) {
  return [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === art).length;
}

test('einheiten AC-23: die drei neuen Einheiten tragen die Werte der Vorlage', () => {
  assert.deepEqual(
    NEU.map((art) => {
      const e = EINHEITEN[art];
      return [e.kosten, e.zeit, e.leben, e.angriff, `${e.nahruestung}/${e.fernruestung}`, e.reichweite, e.tempo];
    }),
    [
      [{ nahrung: 35, holz: 25 }, 22, 45, 3, '0/0', 0, 1.0],
      [{ holz: 25, gold: 45 }, 35, 30, 4, '0/0', 4, 0.96],
      [{ nahrung: 25, holz: 35 }, 22, 30, 2, '0/3', 4, 0.96],
    ],
  );
  // Alle drei gehoeren der Feudalzeit, die drei alten der Dunklen.
  for (const art of NEU) assert.equal(EINHEITEN[art].zeitalter, 1, art);
  for (const art of ['dorfbewohner', 'spaeherreiter', 'miliz']) {
    assert.equal(EINHEITEN[art].zeitalter || 0, 0, art);
  }
  // Fernkaempfer schiessen aus vier Feldern, Nahkaempfer gar nicht.
  assert.equal(EINHEITEN.speerkaempfer.reichweite, 0);
  assert.equal(EINHEITEN.miliz.reichweite, 0);
});

test('einheiten AC-23: der Kreis - Speer schlaegt Reiter, Bogen schlaegt Speer, Plaenkler schlaegt Bogen', () => {
  // Der Bonus greift an der Ruestungsklasse des Ziels, nicht an seiner Art -
  // so trifft er spaeter auch den Ritter und den Armbrustschuetzen.
  assert.deepEqual(EINHEITEN.speerkaempfer.bonus, { kavallerie: 15 });
  assert.deepEqual(EINHEITEN.bogenschuetze.bonus, { speer: 3 });
  assert.deepEqual(EINHEITEN.plaenkler.bonus, { bogenschuetze: 3 });
  // Und jedes Ziel traegt die Klasse, auf die der Bonus zielt.
  assert.ok(EINHEITEN.spaeherreiter.klassen.includes('kavallerie'));
  assert.ok(EINHEITEN.speerkaempfer.klassen.includes('speer'));
  assert.ok(EINHEITEN.bogenschuetze.klassen.includes('bogenschuetze'));
  // Der Speerkaempfer ist auch Infanterie - sonst findet ihn spaeter kein
  // Bonus, der gegen Infanterie geht.
  assert.ok(EINHEITEN.speerkaempfer.klassen.includes('infanterie'));
});

test('einheiten AC-23: in der Dunklen Zeit bildet die Kaserne den Speerkaempfer nicht aus', () => {
  const { welt, anna } = bereit(0);
  const ziel = platz(welt, anna);
  const kaserne = welt.gebaeudeAnlegen('a', 'kaserne', ziel.x, ziel.y);
  // Die Miliz geht, der Speerkaempfer nicht - dasselbe Gebaeude, anderes Zeitalter.
  assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kaserne.id, einheit: 'miliz' }), {});
  const absage = welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kaserne.id, einheit: 'speerkaempfer' }).fehler;
  assert.match(absage, /erst ab dem Lehen/, absage);
  assert.equal(anna.holz, 2000, 'nichts bezahlt');
});

test('einheiten AC-23: nach dem Aufstieg bildet die Kaserne den Speerkaempfer aus', () => {
  const { welt, anna } = bereit(1);
  const ziel = platz(welt, anna);
  const kaserne = welt.gebaeudeAnlegen('a', 'kaserne', ziel.x, ziel.y);
  assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kaserne.id, einheit: 'speerkaempfer' }), {});
  assert.equal(anna.nahrung, 2000 - 35, '35 Nahrung');
  assert.equal(anna.holz, 2000 - 25, '25 Holz');
  const vorher = zaehlen(welt, 'speerkaempfer');
  for (let t = 0; t < 22 * TAKTE_PRO_SEKUNDE + 2; t++) welt.takten();
  assert.equal(zaehlen(welt, 'speerkaempfer'), vorher + 1, 'nach 22 Sekunden steht er da');
  // Und er traegt die Werte aus den Daten.
  const neuer = [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'speerkaempfer');
  assert.equal(neuer.leben, EINHEITEN.speerkaempfer.leben);
});

test('einheiten AC-23: die Schiessanlage bildet Bogenschuetze und Plaenkler aus', () => {
  const { welt, anna } = bereit(1);
  // Keine Gleichheit: jede dieser Listen waechst mit den Stufen (die Kaserne hat
  // mit AC-24 die Soldatenstufe bekommen, der Stall bekommt in Stufe D den
  // Ritter). Geprueft wird, was drin sein muss.
  for (const art of ['bogenschuetze', 'plaenkler']) assert.ok(GEBAEUDE.schiessanlage.bildetAus.includes(art), art);
  for (const art of ['miliz', 'speerkaempfer']) assert.ok(GEBAEUDE.kaserne.bildetAus.includes(art), art);
  assert.ok(GEBAEUDE.stall.bildetAus.includes('spaeherreiter'));
  // Die Schmiede forscht nur - Einheiten bildet sie keine aus (bauen AC-25).
  for (const art of GEBAEUDE.schmiede.bildetAus) assert.ok(!EINHEITEN[art], art + ' ist keine Einheit');

  const ziel = platz(welt, anna);
  const anlage = welt.gebaeudeAnlegen('a', 'schiessanlage', ziel.x, ziel.y);
  for (const art of ['bogenschuetze', 'plaenkler']) {
    assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: anlage.id, einheit: art }), {}, art);
  }
  // Die Kaserne bildet keinen Bogenschuetzen aus - jedes Gebaeude sein Handwerk.
  assert.equal(
    welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: welt.gebaeudeAnlegen('a', 'kaserne', platz(welt, anna).x, platz(welt, anna).y).id, einheit: 'bogenschuetze' }).fehler,
    'Das bildet dieses Gebäude nicht aus.',
  );
  // Beide kommen nacheinander aus der Schlange: 35 s, dann 22 s.
  for (let t = 0; t < (35 + 22) * TAKTE_PRO_SEKUNDE + 4; t++) welt.takten();
  assert.equal(zaehlen(welt, 'bogenschuetze'), 1);
  assert.equal(zaehlen(welt, 'plaenkler'), 1);
});

test('einheiten AC-23: ein Abbruch erstattet voll, auch beim Speerkaempfer', () => {
  const { welt, anna } = bereit(1);
  const ziel = platz(welt, anna);
  const kaserne = welt.gebaeudeAnlegen('a', 'kaserne', ziel.x, ziel.y);
  welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kaserne.id, einheit: 'speerkaempfer' });
  for (let t = 0; t < 10 * TAKTE_PRO_SEKUNDE; t++) welt.takten();
  assert.deepEqual(welt.nachricht('a', { auftrag: 'abbrechen', gebaeude: kaserne.id, platz: 0 }), {});
  assert.equal(anna.nahrung, 2000, 'Nahrung zurueck');
  assert.equal(anna.holz, 2000, 'Holz zurueck');
});

// ---- Die Miliz wird zum Soldaten (einheiten AC-24) --------------------------

/** Eine Welt in der Feudalzeit mit fertiger Kaserne. */
function mitKaserne(zeitalter = 1) {
  const { welt, anna } = bereit(zeitalter);
  const ziel = platz(welt, anna);
  const kaserne = welt.gebaeudeAnlegen('a', 'kaserne', ziel.x, ziel.y);
  return { welt, anna, kaserne };
}

/** Den laufenden Auftrag der Kaserne fertig takten. */
function fertigTakten(welt, sekunden) {
  for (let t = 0; t < sekunden * TAKTE_PRO_SEKUNDE + 2; t++) welt.takten();
}

test('einheiten AC-24: der Soldat traegt die Werte der Vorlage, die Verbesserung die des Originals', () => {
  const s = EINHEITEN.soldat;
  assert.deepEqual([s.leben, s.angriff, `${s.nahruestung}/${s.fernruestung}`, s.tempo], [45, 6, '0/1', 0.9]);
  // Dieselben Kosten wie die Miliz: er wird nicht neben ihr ausgebildet,
  // sondern statt ihrer.
  assert.deepEqual(s.kosten, EINHEITEN.miliz.kosten);
  assert.equal(s.zeit, EINHEITEN.miliz.zeit);
  assert.equal(s.stufeVon, 'miliz');
  assert.equal(s.zeitalter, 1);
  // Mehr Leben und mehr Angriff als die Miliz - sonst lohnte die Forschung nicht.
  assert.ok(s.leben > EINHEITEN.miliz.leben && s.angriff > EINHEITEN.miliz.angriff);
  assert.deepEqual(VERBESSERUNGEN.soldatenstufe.kosten, { nahrung: 100, gold: 40 });
  assert.equal(VERBESSERUNGEN.soldatenstufe.zeit, 40);
  assert.deepEqual(VERBESSERUNGEN.soldatenstufe.wandelt, { miliz: 'soldat' });
});

test('einheiten AC-24: in der Dunklen Zeit forscht die Kaserne die Soldatenstufe nicht', () => {
  const { welt, kaserne, anna } = mitKaserne(0);
  const absage = welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kaserne.id, einheit: 'soldatenstufe' }).fehler;
  assert.match(absage, /erst ab dem Lehen/, absage);
  assert.equal(anna.nahrung, 2000, 'nichts bezahlt');
  // Und den Soldaten gibt es ohne die Forschung ueberhaupt nicht.
  const ohne = welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kaserne.id, einheit: 'soldat' }).fehler;
  assert.match(ohne, /erst mit der Verbesserung/, ohne);
});

test('einheiten AC-24: die Forschung macht jede vorhandene Miliz zum Soldaten', () => {
  const { welt, anna, kaserne } = mitKaserne();
  // Drei Milizen aufstellen, eine davon verwundet.
  const milizen = [0, 1, 2].map((i) => welt.einheitAnlegen('a', anna.basis.x + 2 + i, anna.basis.y + 2, 'miliz'));
  milizen[2].leben = 12;
  const ids = milizen.map((m) => m.id);
  assert.equal(zaehlen(welt, 'miliz'), 3);

  assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kaserne.id, einheit: 'soldatenstufe' }), {});
  assert.equal(anna.nahrung, 2000 - 100, '100 Nahrung');
  assert.equal(anna.gold, 2000 - 40, '40 Gold');
  fertigTakten(welt, 40);

  assert.equal(zaehlen(welt, 'miliz'), 0, 'keine Miliz mehr');
  assert.equal(zaehlen(welt, 'soldat'), 3, 'drei Soldaten');
  // Dieselben Einheiten, nicht neue: die Nummern bleiben.
  assert.deepEqual(ids.map((id) => welt.einheiten.get(id).art), ['soldat', 'soldat', 'soldat']);
  assert.equal(welt.einheiten.get(ids[0]).leben, 45, 'unverletzt: volles Leben der neuen Stufe');
  // Der Schaden bleibt stehen, das Leben waechst um die Differenz.
  assert.equal(welt.einheiten.get(ids[2]).leben, 12 + (45 - 40), 'verletzt: Schaden bleibt');
  // Der Gegner bekommt nichts geschenkt.
  const bert = welt.einheitAnlegen('b', welt.spielerVon('b').basis.x + 2, welt.spielerVon('b').basis.y + 2, 'miliz');
  assert.equal(bert.art, 'miliz');
});

test('einheiten AC-24: danach bildet die Kaserne Soldaten aus, nicht mehr Milizen', () => {
  const { welt, anna, kaserne } = mitKaserne();
  welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kaserne.id, einheit: 'soldatenstufe' });
  fertigTakten(welt, 40);

  // Der Browser schickt weiter "miliz"; der Server bildet den Soldaten aus.
  assert.deepEqual(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kaserne.id, einheit: 'miliz' }), {});
  assert.deepEqual(kaserne.schlange, ['soldat']);
  fertigTakten(welt, 21);
  assert.equal(zaehlen(welt, 'soldat'), 1);
  assert.equal(zaehlen(welt, 'miliz'), 0);
  // Und ein zweites Mal forschen geht nicht.
  const zweimal = welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kaserne.id, einheit: 'soldatenstufe' }).fehler;
  assert.match(zweimal, /nur einmal/, zweimal);
});

test('einheiten AC-24: eine Miliz in der Warteschlange wird als Soldat fertig', () => {
  const { welt, kaserne } = mitKaserne();
  welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kaserne.id, einheit: 'miliz' });
  welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: kaserne.id, einheit: 'soldatenstufe' });
  assert.deepEqual(kaserne.schlange, ['miliz', 'soldatenstufe']);
  // Erst die Miliz (21 s), dann die Forschung (40 s).
  fertigTakten(welt, 21 + 40);
  assert.equal(zaehlen(welt, 'soldat'), 1, 'die fertige Miliz ist jetzt Soldat');

  // Umgekehrt: steht die Miliz noch in der Schlange, wenn die Forschung
  // durch ist, kommt ein Soldat heraus.
  const { welt: w2, kaserne: k2 } = mitKaserne();
  w2.nachricht('a', { auftrag: 'ausbilden', gebaeude: k2.id, einheit: 'soldatenstufe' });
  w2.nachricht('a', { auftrag: 'ausbilden', gebaeude: k2.id, einheit: 'miliz' });
  assert.deepEqual(k2.schlange, ['soldatenstufe', 'miliz']);
  fertigTakten(w2, 40);
  assert.deepEqual(k2.schlange, ['soldat'], 'aus der wartenden Miliz wird ein Soldat');
});

test('einheiten AC-24: der Soldat steht im Aufbau und auf der Schautafel', () => {
  const { welt } = mitKaserne();
  const { werte } = welt.aufbau();
  assert.equal(werte.einheiten.soldat.leben, 45);
  assert.equal(werte.einheiten.soldat.angriff, 6);
  assert.equal(werte.einheiten.soldat.zeitalter, 1);
  // Die Verbesserung geht mit ihrer Wandlung ueber die Leitung - ohne sie
  // wuesste der Browser nicht, dass die Kaserne jetzt Soldaten ausbildet.
  assert.deepEqual(werte.verbesserungen.soldatenstufe.wandelt, { miliz: 'soldat' });
  assert.equal(werte.verbesserungen.soldatenstufe.zeitalter, 1);
});
