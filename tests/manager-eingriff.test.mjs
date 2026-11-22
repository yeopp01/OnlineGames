// Eingreifen im laufenden Spiel (Stufe M1): die Ansprache zur Halbzeit und
// die Vereine des Servers, die ab Minute 60 umstellen.
// Gemessen wird gepaart - derselbe Halbzeitstand, einmal je Ansprache zu
// Ende gerechnet, mit demselben Zufall. So zaehlt nur, was die Ansprache tut.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
// Vor der Karriere geladen: die Messung beobachtet die Begegnungen.
import { kennzahlen, laufen } from '../scripts/manager-messung.mjs';

const require = createRequire(import.meta.url);
const kader = require('../server/spiele/manager/kader.js');
const {
  anpfiff, spielen, eingreifen, abpfiff, ANSPRACHEN, WIRKUNG,
} = require('../server/spiele/manager/spieltag.js');
const { zufallAus } = require('../server/spiele/manager/zufall.js');

const vereine = kader.weltErzeugen(4711).vereine;
const aufstellung = (v) => {
  const elf = kader.elfStellen(v, v.taktik.system);
  return { elf, bank: kader.bankStellen(v, elf), system: v.taktik.system };
};
const JE_LAGE = 1500;
const LAGEN = { '-1': 'Rückstand', 0: 'Gleichstand', 1: 'Führung' };

/** Je Halbzeitstand 1500 Spiele, in denen die Heimelf diese Moral hat - als Sicherung zur Pause. */
function halbzeiten(moral) {
  const lagen = { '-1': [], 0: [], 1: [] };
  for (let i = 0; Object.values(lagen).some((l) => l.length < JE_LAGE); i++) {
    const heim = structuredClone(vereine[i % vereine.length]);
    const gast = vereine[(i * 7 + 3) % vereine.length];
    if (gast.id === heim.id) continue;
    for (const s of heim.spieler) s.moral = moral;
    const spiel = anpfiff(heim, gast, zufallAus(1000 + i), { aufstellungen: { heim: aufstellung(heim), gast: aufstellung(gast) } });
    spielen(spiel, 45);
    const lage = String(Math.sign(spiel.seiten[0].tore - spiel.seiten[1].tore));
    if (lagen[lage].length < JE_LAGE) lagen[lage].push(JSON.stringify(spiel));
  }
  return lagen;
}

/** Punkte je Spiel der Heimelf, ohne und mit jeder Ansprache. */
function punkte(liste) {
  const zeile = {};
  for (const art of ['ohne', ...ANSPRACHEN]) {
    let summe = 0;
    for (const text of liste) {
      const spiel = JSON.parse(text);
      if (art !== 'ohne') assert.deepEqual(eingreifen(spiel, 'heim', { ansprache: art }), { ok: true });
      const e = abpfiff(spiel);
      summe += e.tore[0] > e.tore[1] ? 3 : e.tore[0] === e.tore[1] ? 1 : 0;
    }
    zeile[art] = summe / liste.length;
  }
  return zeile;
}

test('spieltag AC-30: die Kabine wirkt je Lage verschieden, keine Ansprache ist immer die beste', () => {
  const messung = {};
  for (const moral of [30, 85]) {
    for (const [lage, liste] of Object.entries(halbzeiten(moral))) messung[`Moral ${moral}, ${LAGEN[lage]}`] = punkte(liste);
  }
  const beste = Object.values(messung).map((z) => ANSPRACHEN.reduce((a, b) => (z[b] > z[a] ? b : a)));
  const bericht = JSON.stringify(messung, (k, v) => (typeof v === 'number' ? Number(v.toFixed(3)) : v), 1);
  assert.ok(new Set(beste).size >= 2, `immer dieselbe: ${bericht}`);
  // Gemessen (2026-11-22, je Lage 1500): bei Rueckstand laut +0,02, bei
  // Fuehrung mit starker Moral -0,03; aufbauen bei schwacher Moral +0,02 bis
  // +0,04, bei starker genau nichts.
  for (const moral of [30, 85]) {
    const rueck = messung[`Moral ${moral}, Rückstand`];
    assert.ok(rueck.laut - rueck.ohne >= 0.01, `laut hebt bei Rückstand: ${bericht}`);
  }
  const fuehrt = [messung['Moral 30, Führung'], messung['Moral 85, Führung']];
  assert.ok(fuehrt.reduce((s, z) => s + z.laut - z.ohne, 0) <= -0.02, `laut drückt bei Führung: ${bericht}`);
  assert.ok(messung['Moral 30, Gleichstand'].aufbauen - messung['Moral 30, Gleichstand'].ohne >= 0.02, `aufbauen hilft: ${bericht}`);
  for (const lage of Object.values(LAGEN)) {
    assert.equal(messung[`Moral 85, ${lage}`].aufbauen, messung[`Moral 85, ${lage}`].ohne, `aufbauen verpufft: ${bericht}`);
  }
  assert.ok(WIRKUNG.ansprache.stark <= 85);
});

test('spieltag AC-30: angesprochen wird einmal, in der Halbzeit, und der Verein bleibt unberuehrt', () => {
  const heim = vereine[2];
  const gast = vereine[9];
  const vorher = JSON.stringify(heim);
  const spiel = anpfiff(heim, gast, zufallAus(3), { aufstellungen: { heim: aufstellung(heim), gast: aufstellung(gast) } });
  assert.deepEqual(eingreifen(spiel, 'heim', { ansprache: 'laut' }), { fehler: 'Angesprochen wird in der Halbzeit.' });
  spielen(spiel, 40);
  assert.deepEqual(eingreifen(spiel, 'heim', { ansprache: 'laut' }), { fehler: 'Angesprochen wird in der Halbzeit.' });
  spielen(spiel, 45);
  assert.deepEqual(eingreifen(spiel, 'heim', { ansprache: 'brüllen' }), { fehler: 'Ruhig bleiben, aufbauen oder laut werden?' });
  assert.deepEqual(eingreifen(spiel, 'heim', { ansprache: 'aufbauen' }), { ok: true });
  assert.deepEqual(eingreifen(spiel, 'heim', { ansprache: 'laut' }), { fehler: 'Die Ansprache ist gehalten.' });
  // Die andere Seite hat ihre eigene Kabine.
  assert.deepEqual(eingreifen(spiel, 'gast', { ansprache: 'ruhig' }), { ok: true });
  // Ueberlebt die Sicherung zur Pause.
  const geladen = JSON.parse(JSON.stringify(spiel));
  assert.deepEqual(eingreifen(geladen, 'heim', { ansprache: 'ruhig' }), { fehler: 'Die Ansprache ist gehalten.' });
  abpfiff(spiel);
  assert.equal(JSON.stringify(heim), vorher);
});

/** Die Regel aus AC-31, von Hand - so, wie ein Mensch sie am Bildschirm befolgte. */
function vonHand(spiel, grund) {
  const w = WIRKUNG.umstellen;
  if (spiel.minute < w.ab) return;
  spiel.seiten.forEach((seite, i) => {
    const abstand = seite.tore - spiel.seiten[1 - i].tore;
    const schritt = abstand <= -2 ? w.deutlich : abstand === -1 ? w.rueckstand : abstand === 1 ? w.fuehrung : 0;
    const ziel = Math.min(5, Math.max(1, grund[i] + schritt));
    if (ziel !== seite.taktik.ausrichtung) {
      assert.deepEqual(eingreifen(spiel, i === 0 ? 'heim' : 'gast', { taktik: { ausrichtung: ziel } }), { ok: true });
    }
  });
}

test('spieltag AC-31: ein Verein des Servers stellt ab Minute 60 um - genau wie ein Mensch, der eingreift', () => {
  const gesehen = { rueckstand: 0, deutlich: 0, fuehrung: 0 };
  let anders = 0;
  for (let i = 0; i < 200; i++) {
    const heim = vereine[i % vereine.length];
    const gast = vereine[(i * 5 + 1) % vereine.length];
    if (heim.id === gast.id) continue;
    const einstellungen = { aufstellungen: { heim: aufstellung(heim), gast: aufstellung(gast) } };
    const selbst = anpfiff(heim, gast, zufallAus(500 + i), { ...einstellungen, umstellen: { heim: true, gast: true } });
    const mensch = anpfiff(heim, gast, zufallAus(500 + i), einstellungen);
    const grund = selbst.seiten.map((s) => s.taktik.ausrichtung);
    while (!selbst.vorbei) {
      const ziel = selbst.minute + 5;
      vonHand(mensch, grund);
      spielen(selbst, ziel);
      spielen(mensch, ziel);
      // Abschnitt fuer Abschnitt dasselbe Spiel, dieselbe Taktik.
      assert.deepEqual(selbst.seiten.map((s) => s.taktik), mensch.seiten.map((s) => s.taktik), `Spiel ${i}, Minute ${ziel}`);
      assert.equal(JSON.stringify(selbst.ereignisse), JSON.stringify(mensch.ereignisse));
      selbst.seiten.forEach((s, j) => {
        const abstand = s.tore - selbst.seiten[1 - j].tore;
        // Vor Minute 60 bleibt jede Elf, wie sie begann.
        if (selbst.minute < 65) assert.equal(s.taktik.ausrichtung, grund[j], `Spiel ${i}, Minute ${selbst.minute}: vor 60 umgestellt`);
        if (s.taktik.ausrichtung !== grund[j]) anders += 1;
        if (selbst.minute === 60) {
          if (abstand === -1) gesehen.rueckstand += 1;
          if (abstand <= -2) gesehen.deutlich += 1;
          if (abstand === 1) gesehen.fuehrung += 1;
        }
      });
    }
    assert.deepEqual(abpfiff(selbst), abpfiff(mensch));
  }
  // Jede Lage kam vor, und umgestellt wurde wirklich.
  for (const [lage, n] of Object.entries(gesehen)) assert.ok(n >= 15, `${lage} nur ${n}-mal`);
  assert.ok(anders > 300, `nur ${anders} Abschnitte umgestellt`);
});

test('spieltag AC-31: ohne den Schalter stellt niemand um, und die Welt bleibt bei 2,7 bis 3,5 Toren', () => {
  for (let i = 0; i < 40; i++) {
    const heim = vereine[i % vereine.length];
    const gast = vereine[(i * 3 + 2) % vereine.length];
    if (heim.id === gast.id) continue;
    const e = abpfiff(anpfiff(heim, gast, zufallAus(900 + i), { aufstellungen: { heim: aufstellung(heim), gast: aufstellung(gast) } }));
    assert.deepEqual([e.taktik.heim.ausrichtung, e.taktik.gast.ausrichtung], [heim.taktik.ausrichtung, gast.taktik.ausrichtung]);
  }
  // Eine Saison ohne Menschen: jeder Verein stellt um. Gemessen (2026-11-22,
  // zwei Saisons, sechs Startwerte): 3,20 Tore statt 3,06, Heimsiege 47,1 %
  // statt 47,6, Unentschieden 22,2 statt 21,7, der Favorit gewinnt 51,7 %
  // statt 51,4.
  const z = kennzahlen(laufen({ startwert: 4711, saisons: 1 }), 1);
  assert.ok(z.toreJeSpiel >= 2.7 && z.toreJeSpiel <= 3.5, `Tore je Spiel ${z.toreJeSpiel}`);
  assert.ok(z.unentschieden >= 0.15 && z.unentschieden <= 0.3, `Unentschieden ${z.unentschieden}`);
  // Im Spiel eines Menschen stellt nur der Gegner von selbst um.
  const { Karriere, TERMINE } = require('../server/spiele/manager/karriere.js');
  const k = Karriere.neu({ startwert: 4711, vereinId: 'v5', name: 'Umstellen' });
  while (!k.eigenesSpielAm('v5', TERMINE[k.termin])?.gegnerId) assert.ok(k.weiter().ok);
  assert.ok(k.anpfeifen('m1').ok);
  const { spiel, seite } = k.offen.live;
  const ich = spiel.seiten[seite === 'heim' ? 0 : 1];
  const gegner = spiel.seiten[seite === 'heim' ? 1 : 0];
  assert.equal(ich.umstellen, undefined);
  assert.equal(gegner.umstellen, gegner.taktik.ausrichtung);
});

/**
 * Ein Mensch, der eingreift - als Regel auf einem Spiel. `mild` spricht zur
 * Halbzeit nach Lage und Moral und stellt ab Minute 60 um wie ein Verein des
 * Servers; `hart` dazu bei Rueckstand ganz offensiv mit vollem Pressing, bei
 * Fuehrung Mauern.
 */
function mensch(spiel, i, art) {
  const welche = i === 0 ? 'heim' : 'gast';
  const grund = spiel.seiten[i].taktik.ausrichtung;
  const abstand = () => spiel.seiten[i].tore - spiel.seiten[1 - i].tore;
  spielen(spiel, 45);
  if (!spiel.vorbei) {
    const moral = spiel.seiten[i].auf.reduce((s, x) => s + x.moral, 0) / spiel.seiten[i].auf.length;
    const lage = Math.sign(abstand());
    const ansprache = lage < 0 ? 'laut' : lage > 0 ? 'ruhig' : moral < WIRKUNG.ansprache.stark - 10 ? 'aufbauen' : 'laut';
    assert.deepEqual(eingreifen(spiel, welche, { ansprache }), { ok: true });
  }
  while (!spiel.vorbei) {
    if (spiel.minute >= 60) {
      const d = abstand();
      let taktik;
      if (art === 'hart') taktik = d < 0 ? { ausrichtung: 5, pressing: 5 } : d > 0 ? { ausrichtung: 1, pressing: 2 } : { ausrichtung: grund };
      else {
        const u = WIRKUNG.umstellen;
        const schritt = d <= -2 ? u.deutlich : d === -1 ? u.rueckstand : d === 1 ? u.fuehrung : 0;
        taktik = { ausrichtung: Math.min(5, Math.max(1, grund + schritt)) };
      }
      assert.deepEqual(eingreifen(spiel, welche, { taktik }), { ok: true });
    }
    spielen(spiel, spiel.minute + 5);
  }
  return abpfiff(spiel);
}

/**
 * Punkte je 34 Ligaspiele mehr als die Automatik - gepaart: jedes eigene
 * Spiel am Anpfiff abgeschrieben, einmal mit Automatik, einmal mit Eingriff.
 * Die Saison selbst laeuft mit dem Eingriff weiter.
 */
function mehrJeSaison(art, startwerte) {
  const { Karriere, TERMINE } = require('../server/spiele/manager/karriere.js');
  const punkte = (e, i) => (e.tore[i] > e.tore[1 - i] ? 3 : e.tore[i] === e.tore[1 - i] ? 1 : 0);
  let mehr = 0;
  let spiele = 0;
  for (const startwert of startwerte) {
    const k = Karriere.neu({ startwert, vereinId: 'v5', name: 'Eingreifen' });
    const anfang = k.saison;
    while (k.saison === anfang && k.manager[0].status !== 'entlassen') {
      const termin = TERMINE[k.termin];
      if (termin.art !== 'liga' || !k.eigenesSpielAm('v5', termin)?.gegnerId) {
        assert.ok(k.weiter().ok);
        continue;
      }
      assert.ok(k.anpfeifen('m1').ok);
      const { spiel, seite } = k.offen.live;
      const i = seite === 'heim' ? 0 : 1;
      mehr -= punkte(abpfiff(structuredClone(spiel)), i);
      mehr += punkte(mensch(spiel, i, art), i);
      spiele += 1;
      assert.ok(k.weiter().ok);
    }
  }
  return (mehr / spiele) * 34;
}

test('spieltag AC-33: wer eingreift, holt mehr als die Automatik, aber hoechstens fuenf Punkte je Saison', () => {
  // Gemessen (2026-11-22, je 40 Saisons): mild +0,9 (± 0,4), hart +2,8
  // (± 0,6); die Ansprache allein +0,8, das Umstellen allein +1,0.
  const startwerte = Array.from({ length: 20 }, (_, i) => i + 1);
  const mild = mehrJeSaison('mild', startwerte);
  const hart = mehrJeSaison('hart', startwerte);
  assert.ok(mild > 0, `mild ${mild.toFixed(2)}`);
  assert.ok(hart > mild, `hart ${hart.toFixed(2)}, mild ${mild.toFixed(2)}`);
  assert.ok(hart <= 5, `hart ${hart.toFixed(2)} - dann waere "Sofort" eine Strafe`);
});

test('spieltag AC-33: bei 0:1 in Minute 60 hebt Angriff den Ausgleich - und das 0:2', () => {
  const zaehler = { ohne: [0, 0], 4: [0, 0], 5: [0, 0] };
  let n = 0;
  for (let i = 0; n < 1500; i++) {
    const heim = vereine[i % vereine.length];
    const gast = vereine[(i * 7 + 3) % vereine.length];
    if (heim.id === gast.id) continue;
    const spiel = anpfiff(heim, gast, zufallAus(7000 + i), { aufstellungen: { heim: aufstellung(heim), gast: aufstellung(gast) } });
    spielen(spiel, 60);
    if (spiel.seiten[0].tore - spiel.seiten[1].tore !== -1) continue;
    n += 1;
    const text = JSON.stringify(spiel);
    for (const art of Object.keys(zaehler)) {
      const s = JSON.parse(text);
      if (art !== 'ohne') eingreifen(s, 'heim', { taktik: { ausrichtung: Number(art) } });
      const e = abpfiff(s);
      if (e.tore[0] >= e.tore[1]) zaehler[art][0] += 1;
      if (e.tore[1] - e.tore[0] >= 2) zaehler[art][1] += 1;
    }
  }
  // Gemessen (2026-11-22, 3000 Spiele): Ausgleich 26,3 / 28,9 / 30,6 %,
  // das 0:2 27,7 / 29,1 / 31,9 % - ohne, Offensiv 4, Offensiv 5.
  const bericht = JSON.stringify(zaehler);
  assert.ok(zaehler[4][0] > zaehler.ohne[0] && zaehler[5][0] > zaehler[4][0], `Ausgleich: ${bericht}`);
  assert.ok(zaehler[5][1] > zaehler.ohne[1], `das 0:2: ${bericht}`);
  // Maßvoll: hoechstens acht Punkte mehr Ausgleich.
  assert.ok((zaehler[5][0] - zaehler.ohne[0]) / n <= 0.08, `Ausgleich: ${bericht}`);
});
