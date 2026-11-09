// Die KI in der Ritterzeit (→ specs/10-strategie/ki.md AC-21) - ganze Partien
// im Pruefstand ohne Browser (→ docs/adr/0004-teststrategie.md). Eine eigene
// Datei wie strategie-partien.test.mjs: zwanzig Partien zu 30 Minuten rechnen
// rund 15 s und laufen so neben den anderen Dateien.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { partieSpielen } = require('../server/spiele/strategie/pruefstand.js');
const { TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { DORFBEWOHNER_JE_ZEITALTER } = require('../server/spiele/strategie/ki.js');

const MINUTE = 60 * TAKTE_PRO_SEKUNDE;

test('ki AC-21: ueber zwanzig Startwerte steigt jede KI vor Spielminute 30 in die Ritterzeit auf, die ihr Dorf haelt', () => {
  // Gemessen in Runde 137, Startwerte 1 bis 20: 35 von 40 KIs in der
  // Ritterzeit, nach 22,1 bis 27,2 Minuten (Median 23,9). Die fuenf ohne
  // Aufstieg sind Verlierer, deren Dorf ab Minute 18 auf 0 bis 10
  // Dorfbewohner fiel - jede Nahrung ging in den Ersatz (ki AC-12). Von den
  // Aufgestiegenen fiel keine vor dem Aufstieg unter 14, bis auf eine, deren
  // Aufstieg schon lief. Zwoelf liegt zwischen beiden: wer darunter faellt,
  // wird gerade ueberrannt.
  // Neu gemessen in Runde 143, als das Dorf in der Feudalzeit auf 32 wuchs
  // (ki AC-24): 35 von 40 aufgestiegen, nach 21,9 bis 26,2 Minuten; keine
  // Aufgestiegene fiel ab Minute 18 unter 26, die fuenf ohne Aufstieg fielen
  // auf 0, 1, 3, 10 und 13. Zwoelf trennt nicht mehr; die Grenze ist jetzt
  // die Haelfte des Ziels der Feudalzeit - 16, mitten in der Luecke. Mit dem
  // Aufstieg vor dem Ersatz (Durchsicht Runde 143) steigt auch die mit 13
  // auf (Startwert 10, KI 1: Minute 27,5, ihr Dorf fiel bis 12): 36 von 40.
  const HAELT = Math.floor(DORFBEWOHNER_JE_ZEITALTER[1] / 2);
  let gehalten = 0;
  const minuten = [];
  for (let startwert = 1; startwert <= 20; startwert++) {
    // Dorfbewohner je Spieler zu jeder vollen Minute.
    const dorf = new Map();
    const r = partieSpielen({
      startwert, minuten: 30,
      eingriff: (welt, takt) => {
        if (takt % MINUTE) return;
        for (const s of welt.spieler) {
          const n = [...welt.einheiten.values()].filter((e) => e.besitzer === s.id && e.art === 'dorfbewohner' && !e.tot).length;
          if (!dorf.has(s.id)) dorf.set(s.id, []);
          dorf.get(s.id).push(n);
        }
      },
    });
    r.spieler.forEach((p, i) => {
      const reihe = dorf.get(`ki${i + 1}`) || [];
      const bis = p.ritterMinute === null ? reihe.length : Math.floor(p.ritterMinute);
      const wenigste = Math.min(...reihe.slice(18, bis));
      if (p.ritterMinute !== null) {
        minuten.push(p.ritterMinute);
        assert.ok(p.ritterMinute > p.feudalMinute, `${startwert} ${p.name}: Ritterzeit ${p.ritterMinute}, Feudalzeit ${p.feudalMinute}`);
      }
      if (wenigste < HAELT) return;
      gehalten += 1;
      assert.ok(p.ritterMinute !== null && p.ritterMinute < 30,
        `${startwert} ${p.name}: nie unter ${wenigste} Dorfbewohnern, Ritterzeit ${p.ritterMinute}`);
    });
  }
  // Gegenprobe zum Messaufbau: die Regel "wer haelt, steigt auf" traegt nur,
  // wenn die meisten halten - und die Aufstiege sind verschiedene, nicht
  // zwanzigmal derselbe Takt.
  assert.ok(gehalten >= 30, `${gehalten} von 40 haben ihr Dorf gehalten`);
  assert.ok(new Set(minuten).size >= 15, `${new Set(minuten).size} verschiedene Aufstiege`);
});
