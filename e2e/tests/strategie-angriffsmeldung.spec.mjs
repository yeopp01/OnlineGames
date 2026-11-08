// Angriff wird gemeldet (→ specs/10-strategie/kampf.md AC-14).
//
// Anna sieht woanders hin, als Bert mit zwei Milizen an ihrem Dorfzentrum
// auftaucht und ihre Dorfbewohner angreift. Oben in der Mitte steht dann ein
// roter Knopf; ein Klick setzt die Kamera an den Ort des Angriffs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test } from '../helpers/seite.mjs';
import { bedienteileFrei, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const KAMPF = '10-strategie/kampf.md';

test.describe('Angriffsmeldung', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Erkundet: das Gelaende ist bekannt, Einheiten sieht Anna nur in Sicht
    // ihrer eigenen - Berts Milizen erst, wenn sie hinsieht. Die Meldung ist
    // genau dafuer da. (Im vollen Nebel waere das Bild abseits nur schwarz.)
    partie = await partieZuZweit(browser, info, { sicht: 'erkundet' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('kampf AC-14: wer angegriffen wird, bekommt einen Knopf, und ein Klick springt hin', async ({}, info) => {
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);

    // Anna sieht in die Mitte der Karte, weit weg von ihrem Dorf.
    await anna.evaluate(() => {
      const a = window.ansicht;
      a.kamera.zoom = 1;
      a.blickAuf(a.karte.groesse / 2, a.karte.groesse / 2);
    });
    await expect(anna.locator('#angriffsmeldung')).toBeHidden();

    // Bert taucht mit zwei Milizen neben ihren Dorfbewohnern auf. Wer wacht,
    // greift an, was in Sicht kommt (kampf AC-2).
    expect(await einheitenAufstellen(anna, code, 'Bert', 2, { x: basis.x + 2, y: basis.y + 3, art: 'miliz' })).toBe(2);
    const knopf = anna.locator('#angriffsmeldung');
    await expect(knopf).toBeVisible({ timeout: 20_000 });
    await expect(knopf).toBeInViewport();
    await expect(knopf).toContainText('angegriffen');

    // Die Kamera steht noch woanders: das Dorf ist nicht im Bild.
    const vorher = await anna.evaluate((b) => {
      const a = window.ansicht;
      const p = a.zuBild(b.x, b.y);
      return { drin: p.x > 0 && p.y > 0 && p.x < a.leinwand.clientWidth && p.y < a.leinwand.clientHeight };
    }, basis);
    expect(vorher.drin, 'das angegriffene Dorf ist nicht im Bild').toBe(false);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: KAMPF,
      ac: 'AC-14',
      titel: 'Die Kamera steht in der Mitte der Karte, das Dorf liegt woanders (Übersichtskarte); oben in der Mitte der rote Knopf „Du wirst angegriffen — hinsehen“',
      test: info,
    });

    // Ein Klick: die Kamera steht auf dem Ort des Angriffs, der Knopf geht.
    const ort = await knopf.evaluate((k) => ({ x: Number(k.dataset.x), y: Number(k.dataset.y) }));
    expect(Math.hypot(ort.x - basis.x, ort.y - basis.y), 'der Ort ist Annas Dorf').toBeLessThan(8);
    await knopf.click();
    await expect(knopf).toBeHidden();
    const nachher = await anna.evaluate((o) => {
      const a = window.ansicht;
      const p = a.zuBild(o.x, o.y);
      return { dx: Math.abs(p.x - a.leinwand.clientWidth / 2), dy: Math.abs(p.y - a.leinwand.clientHeight / 2) };
    }, ort);
    expect(nachher.dx, 'waagerecht in der Mitte').toBeLessThan(10);
    expect(nachher.dy, 'senkrecht in der Mitte').toBeLessThan(10);
  });
});
