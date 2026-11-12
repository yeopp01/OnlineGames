// Angriffe hintereinander mit Umschalt (→ specs/10-strategie/bedienung.md
// AC-50): ein Rechtsklick auf einen Gegner greift an, jeder weitere mit
// Umschalt haengt einen an. Im Bild dieselbe gestrichelte Linie wie bei
// AC-14, an jedem wartenden Gegner ein roter Ring; faellt das Ziel, nimmt die
// Einheit das naechste.
//
// Berts drei Haeuser stehen mit wenig Leben da, damit es kurz dauert. Die
// Zeit steht still, waehrend geklickt wird - sonst faellt das erste Haus,
// bevor das zweite angehaengt ist, und Umschalt ist dann ein gewoehnlicher
// Angriff (wer nicht angreift, greift gleich an). Die Reihenfolge im
// Einzelnen prueft der Regeltest tests/strategie-angriffe-reihe.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, gebaeudeAufstellen, lebenSetzen, test, zeitraffer } from '../helpers/seite.mjs';
import { freieWiesen, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

test('bedienung AC-50: mit Umschalt haengen zwei Haeuser hinter dem ersten, rot geringt - die Miliz reisst alle drei nacheinander ein', async ({ browser }, info) => {
  // Handelt nicht vom Nebel.
  const partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  try {
    const { anna, code } = partie;
    const [wiese] = await freieWiesen(anna, 1);
    const haeuser = [];
    for (const [dx, dy] of [[-4, -4], [3, -4], [3, 2]]) {
      haeuser.push(await gebaeudeAufstellen(anna, code, 'Bert', 'haus', wiese.x + dx, wiese.y + dy));
    }
    await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'miliz', x: wiese.x - 2, y: wiese.y + 1 });
    const kuerzel = await anna.evaluate(() => window.ansicht.werte.einheiten.miliz.kuerzel);
    await anna.waitForFunction((hs) => hs.every((h) => window.ansicht.gebaeude.has(h)), haeuser);
    const miliz = await anna.waitForFunction(([k, w]) => {
      const a = window.ansicht;
      const e = [...a.nachher.values()].find((x) => x.k === k && x.b === a.ich && Math.hypot(x.x - w.x, x.y - w.y) < 6);
      return e?.i;
    }, [kuerzel, wiese]).then((h) => h.jsonValue());
    for (const h of haeuser) await lebenSetzen(anna, code, h, 3);
    await zeitraffer(anna, code, 0);

    // Die Miliz waehlen und alle drei Haeuser ins Bild nehmen.
    await anna.evaluate(([id, w]) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set([id]);
      a.beiAuswahl();
      a.kamera.zoom = 1.8;
      a.blickAuf(w.x, w.y - 1);
    }, [miliz, wiese]);
    const aufSeite = (h) => anna.evaluate((g) => {
      const a = window.ansicht;
      const m = a.gebaeudeMitte(a.gebaeude.get(g));
      const r = a.leinwand.getBoundingClientRect();
      const p = a.zuBild(m.x, m.y);
      return { x: r.left + p.x, y: r.top + p.y };
    }, h);

    // Das erste ohne Umschalt, die beiden anderen mit.
    const erstes = await aufSeite(haeuser[0]);
    await anna.mouse.click(erstes.x, erstes.y, { button: 'right' });
    expect(await anna.evaluate(() => window.ansicht.zielzeichen?.feindlich), 'ein Angriff').toBe(true);
    await anna.keyboard.down('Shift');
    for (const h of haeuser.slice(1)) {
      const p = await aufSeite(h);
      await anna.mouse.click(p.x, p.y, { button: 'right' });
    }
    await anna.keyboard.up('Shift');
    // Der Server sagt: zwei warten.
    await anna.waitForFunction((i) => window.ansicht.nachher.get(i)?.q === 2, miliz);
    // Und der Browser kennt sie als Gegner - ihre Ringe sind rot.
    const reihe = await anna.evaluate((i) => window.ansicht.wegpunkte.get(i).slice(-3), miliz);
    expect(reihe.map((p) => Boolean(p.feind)), 'alle drei als Gegner gemerkt').toEqual([true, true, true]);
    // Das rote Zeichen des Klicks verblasst; danach steht nur die Reihe.
    await anna.waitForFunction(() => window.ansicht.zielzeichen === null);
    await anna.waitForTimeout(100);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-50',
      titel: 'Umschalt und Rechtsklick auf zwei weitere Haeuser - gestrichelt hinter dem ersten, jedes wartende mit rotem Ring',
      test: info,
    });

    // Laufen lassen: alle drei fallen, ohne neuen Befehl.
    await zeitraffer(anna, code, 4);
    await anna.waitForFunction((hs) => hs.every((h) => !window.ansicht.gebaeude.has(h)), haeuser, { timeout: 60_000 });
    await expect.poll(() => anna.evaluate((i) => window.ansicht.nachher.get(i)?.q ?? 0, miliz)).toBe(0);
  } finally {
    await partieBeenden(partie);
  }
});
