// Die KI handelt mit Karren (ki AC-26), ueber ganze Partien gemessen: das
// Gold um ihr Dorf wird geleert, sobald sie die Ritterzeit erreicht. Sechzehn
// Partien - deshalb hier und nicht im ersten Abschnitt von `npm test`. Die
// gebauten Lagen stehen in `tests/strategie-ki-handel.test.mjs`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../../server/spiele/strategie/welt.js');
const { Ki, HANDEL_MINDESTENS } = require('../../server/spiele/strategie/ki.js');

const gebaeudeVon = (welt, id) => [...welt.gebaeude.values()].filter((g) => g.besitzer === id);

// Laesst auf jedem Goldfeld um das Dorf ein Gold liegen und sagt, wie viele
// Felder das waren.
function goldLeeren(welt, basis, weit = 30) {
  const { karte } = welt;
  let felder = 0;
  for (const [i] of karte.vorrat) {
    if (karte.felder[i] !== karten.GOLD) continue;
    const x = i % karte.groesse;
    const y = (i / karte.groesse) | 0;
    if (Math.hypot(x - basis.x, y - basis.y) > weit) continue;
    karte.vorrat.set(i, 1);
    felder++;
  }
  return felder;
}

/**
 * Eine Partie KI gegen KI; sobald KI 1 die Ritterzeit erreicht, ist das Gold
 * um ihr Dorf leer. Zurueck kommt, wie viel Gold sie in den 14 Minuten
 * danach sammelt (`gesammelt`, also auch das der Karren) und wie weit ihre
 * Maerkte auseinander stehen - `null`, wenn sie die Ritterzeit nicht
 * erreicht. `rest` ist, was ohne Handel hoechstens noch kommen kann: das
 * eine Gold je geleertem Feld und was ihre Sammler in dem Augenblick trugen.
 */
function ohneGold(startwert, handel = true) {
  const welt = new Welt([{ id: 'ki1', name: 'KI 1' }, { id: 'ki2', name: 'KI 2' }], startwert, {});
  const kis = welt.spieler.map((s) => new Ki(welt, s.id));
  if (!handel) kis[0].handelPruefen = () => {};
  const ki1 = welt.spielerVon('ki1');
  let geleert = null;
  let vorher = 0;
  let rest = 0;
  let maerkte = 0;
  for (let t = 0; t < 70 * 60 * TAKTE_PRO_SEKUNDE && !welt.ende; t++) {
    for (const ki of kis) ki.takt();
    welt.takten();
    if (geleert === null && ki1.zeitalter >= 2) {
      geleert = welt.takt;
      rest = goldLeeren(welt, ki1.basis);
      for (const e of welt.einheiten.values()) {
        if (e.besitzer === 'ki1' && !e.tot && e.ladungsart === 'gold') rest += e.ladung;
      }
      vorher = ki1.gesammelt.gold;
    }
    if (geleert !== null) {
      const m = gebaeudeVon(welt, 'ki1').filter((g) => g.art === 'markt' && g.fertig);
      if (m.length >= 2) maerkte = Math.max(maerkte, Math.hypot(m[0].x - m[1].x, m[0].y - m[1].y));
      if (welt.takt - geleert >= 14 * 60 * TAKTE_PRO_SEKUNDE) break;
    }
  }
  return geleert === null ? null : { gold: ki1.gesammelt.gold - vorher, rest, maerkte };
}

// So viel Gold muss der Handel in den 14 Minuten mindestens bringen.
const HANDEL_BRINGT = 90;

test('ki AC-26: geht ihr in der Ritterzeit das Gold aus, holt sie es mit Karren - ohne Handel kommt keins mehr', () => {
  // Gemessen in Runde 162, Startwerte 1 bis 10, 14 Minuten nach dem Ende des
  // Goldes: mit Handel 720, 562, 270, 10, 125, 93, 350, 706 und 0 Gold (der
  // Startwert 6 erreicht die Ritterzeit nicht; bei 4 und 10 wird KI 1
  // ueberrannt und kann keinen Karren bezahlen). Ohne Handel 0 bis 30 - nur
  // was die Sammler gerade trugen.
  //
  // Seit dem 2026-11-14 steht statt der festen 50 die genaue Grenze: ohne
  // Handel kommt hoechstens, was beim Leeren noch da war - ein Gold je Feld
  // und die Ladung der Sammler (`rest`). Die 50 war geschaetzt und riss mit
  // 53, als drei Regeln aus dem Spiel auf dem Server die Partien verschoben
  // (kampf AC-24, kampf AC-25, einheiten AC-63) und beim Aufstieg mehr
  // Sammler am Gold standen. Die Aussage ist dieselbe und schaerfer: kein
  // Gold, das nicht schon da war. Nachgemessen: 42 = 36 getragen + 6 Felder,
  // 14 = 9 + 5, 14 = 8 + 6, 40 = 35 + 5, 53 = 50 + 3 von 6, 22 = 16 + 6,
  // 29 = 23 + 6.
  //
  // Ohne Gold enden die Partien hier nicht im Patt: der Pruefstand auf dem
  // Zweig `strategie` endet 40 von 40 vor Minute 60, das Gold in Reichweite
  // geht in 88 KIs nur viermal aus, alle nach Minute 45. Die Patts der
  // Erkenntnisse (Runden 114, 137, 144) kamen von der KI mit eigener Sicht.
  // Deshalb misst der Test den Fall selbst: das Gold wird geleert.
  const mit = [];
  const ohne = [];
  for (let s = 1; s <= 8; s++) {
    const r = ohneGold(s);
    if (!r) continue;
    mit.push(r);
    ohne.push(ohneGold(s, false));
  }
  const bericht = `mit ${mit.map((r) => r.gold).join(', ')} | ohne ${ohne.map((r) => r.gold).join(', ')}`;
  assert.ok(mit.length >= 6, `die Ritterzeit erreicht: ${mit.length}`);
  assert.ok(ohne.every((r) => r.gold <= r.rest), `ohne Handel kommt kein Gold mehr als beim Leeren da war: ${bericht} | da waren ${ohne.map((r) => r.rest).join(', ')}`);
  // Und das ist weniger, als der Handel bringen muss: sonst waere "mit
  // Handel mindestens 90" schon mit dem Rest erfuellt.
  assert.ok([...mit, ...ohne].every((r) => r.rest < HANDEL_BRINGT), `beim Leeren war weniger als ${HANDEL_BRINGT} Gold da: ${ohne.map((r) => r.rest).join(', ')}`);
  const handelt = mit.filter((r) => r.gold >= HANDEL_BRINGT);
  assert.ok(handelt.length >= mit.length - 2, `mit Handel in fast jeder Partie mindestens 90 Gold: ${bericht}`);
  assert.ok(handelt.every((r) => r.maerkte >= HANDEL_MINDESTENS), `die Maerkte weit auseinander: ${mit.map((r) => r.maerkte.toFixed(0)).join(', ')}`);
});
