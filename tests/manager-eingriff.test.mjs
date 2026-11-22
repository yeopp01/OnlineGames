// Eingreifen im laufenden Spiel (Stufe M1): die Ansprache zur Halbzeit.
// Gemessen wird gepaart - derselbe Halbzeitstand, einmal je Ansprache zu
// Ende gerechnet, mit demselben Zufall. So zaehlt nur, was die Ansprache tut.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

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
