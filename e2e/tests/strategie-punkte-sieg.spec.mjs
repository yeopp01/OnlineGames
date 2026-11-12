// Punkte fuer Siege im Kampf (→ specs/10-strategie/bedienung.md AC-49): wer
// eine Einheit oder ein Gebaeude des Gegners vernichtet, bekommt ein Fuenftel
// ihrer Kosten als Punkte - hier sichtbar in der Tafel auf Tab.
//
// Annas Miliz faellt Berts Dorfbewohner und reisst sein Haus ein; beide stehen
// mit einem Leben da, damit es kurz dauert. Bert spielt nicht und sammelt
// nicht, Annas Dorfbewohner vom Start stehen - vorher hat niemand Punkte, und
// was danach dasteht, kann nur aus den Siegen kommen. Die Rechnung im Einzelnen
// (und dass eigene Treffer nichts bringen) prueft der Regeltest
// tests/strategie-punkte.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, gebaeudeAufstellen, lebenSetzen, test, zeitraffer } from '../helpers/seite.mjs';
import { freieWiesen, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

const summe = (kosten) => Object.values(kosten || {}).reduce((s, m) => s + m, 0);

test('bedienung AC-49: wer Dorfbewohner und Haus des Gegners vernichtet, steht in der Tafel vorn - mit einem Fuenftel ihrer Kosten', async ({ browser }, info) => {
  // Handelt nicht vom Nebel.
  const partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  try {
    const { anna, bert, code } = partie;
    const ids = {
      anna: await anna.evaluate(() => window.ansicht.ich),
      bert: await bert.evaluate(() => window.ansicht.ich),
    };
    const [wiese] = await freieWiesen(anna, 1);
    const hausId = await gebaeudeAufstellen(anna, code, 'Bert', 'haus', wiese.x + 1, wiese.y);
    await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'dorfbewohner', x: wiese.x - 1, y: wiese.y + 3 });
    await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'miliz', x: wiese.x - 4, y: wiese.y });
    const kuerzel = await anna.evaluate(() => window.ansicht.werte.einheiten.miliz.kuerzel);
    await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), hausId);
    const { miliz, bauer } = await anna.waitForFunction(([k, w]) => {
      const a = window.ansicht;
      const nahe = (e) => Math.hypot(e.x - w.x, e.y - w.y) < 7;
      const miliz = [...a.nachher.values()].find((e) => e.k === k && e.b === a.ich && nahe(e));
      const bauer = [...a.nachher.values()].find((e) => e.k === 'd' && e.b !== a.ich && nahe(e));
      return miliz && bauer && { miliz: miliz.i, bauer: bauer.i };
    }, [kuerzel, wiese]).then((h) => h.jsonValue());
    await lebenSetzen(anna, code, bauer, 1);
    await lebenSetzen(anna, code, hausId, 1);

    const punkte = (page, id) => page.evaluate((s) => window.ansicht.stand.get(s)?.punkte ?? 0, id);
    expect(await punkte(anna, ids.anna), 'vorher hat Anna keine').toBe(0);
    expect(await punkte(anna, ids.bert), 'und Bert keine').toBe(0);

    // Ein Rechtsklick auf das Ziel greift an (kampf AC-1).
    const angreifen = async (ziel, istGebaeude) => {
      const punkt = await anna.evaluate(([e, z, g]) => {
        const a = window.ansicht;
        a.gewaehltesGebaeude = null;
        a.ausgewaehlt = new Set([e]);
        a.beiAuswahl();
        const ding = g ? a.gebaeude.get(z) : a.nachher.get(z);
        // Eine Miliz wacht (kampf AC-2): kam ihr das Ziel schon in Sicht, ist
        // es vielleicht schon gefallen - dann gibt es nichts mehr zu klicken.
        if (!ding) return null;
        const m = g ? a.gebaeudeMitte(ding) : { x: ding.x, y: ding.y };
        a.kamera.zoom = 1.8;
        a.blickAuf(m.x, m.y);
        a.zielzeichen = null;
        const r = a.leinwand.getBoundingClientRect();
        const p = a.zuBild(m.x, m.y);
        return { x: r.left + p.x, y: r.top + p.y };
      }, [miliz, ziel, istGebaeude]);
      if (!punkt) return;
      await anna.mouse.click(punkt.x, punkt.y, { button: 'right' });
      expect(await anna.evaluate(() => window.ansicht.zielzeichen?.feindlich), 'ein Angriff (rotes Zeichen)').toBe(true);
    };

    const werte = await anna.evaluate(() => ({
      bauer: window.ansicht.werte.einheiten.dorfbewohner.kosten,
      haus: window.ansicht.werte.gebaeude.haus.kosten,
    }));
    await zeitraffer(anna, code, 4);
    await angreifen(bauer, false);
    await anna.waitForFunction((b) => !window.ansicht.nachher.has(b), bauer, { timeout: 60_000 });
    await expect.poll(() => punkte(anna, ids.anna), 'der Dorfbewohner bringt ein Fuenftel seiner Kosten')
      .toBe(Math.floor(summe(werte.bauer) / 5));
    await angreifen(hausId, true);
    await anna.waitForFunction((g) => !window.ansicht.gebaeude.has(g), hausId, { timeout: 60_000 });
    await zeitraffer(anna, code, 0);
    const erwartet = Math.floor((summe(werte.bauer) + summe(werte.haus)) / 5);
    await expect.poll(() => punkte(anna, ids.anna), 'und das Haus seines dazu').toBe(erwartet);
    expect(await punkte(bert, ids.bert), 'Bert verliert nichts - er hatte keine').toBe(0);
    await expect.poll(() => punkte(bert, ids.anna), 'Bert sieht Annas Punkte').toBe(erwartet);

    // Die Tafel auf Tab: Anna vorn.
    const tafel = anna.locator('#spielstand');
    await anna.evaluate((w) => window.ansicht.blickAuf(w.x, w.y), wiese);
    await anna.keyboard.down('Tab');
    await expect(tafel).toBeVisible();
    const zelle = (id) => tafel.locator(`tr[data-spieler="${id}"] td`).first();
    await expect(zelle(ids.anna)).toHaveText(String(erwartet));
    await expect(zelle(ids.bert)).toHaveText('0');
    await anna.waitForTimeout(200);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-49',
      titel: 'Tab gehalten nach dem Gefecht: Anna hat Berts Dorfbewohner und Haus vernichtet und steht mit 15 Punkten vorn, Bert bei 0',
      test: info,
    });
    await anna.keyboard.up('Tab');
  } finally {
    await partieBeenden(partie);
  }
});
