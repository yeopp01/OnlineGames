// Der Markt (→ specs/10-strategie/bauen.md AC-33): erst ab der Feudalzeit im
// Baumenue, mit eigener Taste; gewaehlt zeigt er je Ware einen Knopf zum
// Kaufen und einen zum Verkaufen, auf jedem der Preis in Gold. Ein Klick
// tauscht 100 gegen Gold, und der Preis dieser Ware steigt oder faellt - die
// Rechnung selbst steht in tests/strategie-markt.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import {
  bedienteileFrei, dorfbewohnerAnklicken, gebaeudeInDerNaehe, partieBeenden, partieZuZweit,
} from '../helpers/strategie.mjs';
import { BAUTASTEN } from '../../public/tasten.js';

const BAUEN = '10-strategie/bauen.md';

test.describe('Markt', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  const baumenue = (page) => page.locator('#baumenue [data-bauen]').evaluateAll((k) => k.map((x) => x.dataset.bauen));
  const vorrat = (page) => page.evaluate(() => ({ ...window.ansicht.vorraete }));

  test('bauen AC-33: der Markt steht ab der Feudalzeit im Baumenue und tauscht 100 Holz, Nahrung oder Stein gegen Gold', async ({}, info) => {
    const { anna, code } = partie;
    await rohstoffe(anna, code, 'Anna', { holz: 3000, nahrung: 3000, gold: 1000, stein: 1000 });
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);

    // Dunkle Zeit: noch kein Markt im Menue.
    await dorfbewohnerAnklicken(anna);
    await anna.keyboard.press('b');
    expect(await baumenue(anna)).not.toContain('markt');
    await anna.keyboard.press('Escape');
    await anna.keyboard.press('Escape');

    // Feudalzeit: jetzt steht er darin, und seine Taste waehlt ihn zum Bauen.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'muehle', basis);
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'holzfaellerlager', basis);
    await anna.keyboard.press('h');
    await anna.locator('[data-aufstieg="feudalzeit"]').click();
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => window.ansicht.zeitalter === 1, null, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);
    await dorfbewohnerAnklicken(anna);
    await anna.keyboard.press('b');
    const menue = await baumenue(anna);
    expect(menue).toContain('markt');
    await expect(anna.locator('#baumenue [data-bauen="markt"]')).toHaveAttribute('title', /Markt/);
    await anna.keyboard.press(BAUTASTEN[menue.indexOf('markt')]);
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzieren?.art)).toBe('markt');
    await anna.keyboard.press('Escape');
    await anna.keyboard.press('Escape');

    // Ein fertiger Markt (Pruefgriff - das Bauen belegt bauen AC-1), gewaehlt.
    const marktId = await gebaeudeInDerNaehe(anna, code, 'Anna', 'markt', basis, { von: 8, bis: 16 });
    await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), marktId);
    await anna.evaluate((g) => {
      const a = window.ansicht;
      a.kamera.zoom = 2;
      a.gewaehltesGebaeude = g;
      a.ausgewaehlt.clear();
      const b = a.gebaeude.get(g);
      a.blickAuf(b.x - 0.5, b.y - 1);
      a.beiAuswahl();
    }, marktId);
    const handel = anna.locator('#handel');
    await expect(handel).toBeInViewport();

    // Je Ware ein Knopf zum Kaufen und einer zum Verkaufen - die Waren aus den
    // Werten des Servers, nicht aus dem Kopf.
    const waren = await anna.evaluate(() => window.ansicht.werte.handel.waren);
    expect(waren).toContain('holz');
    for (const ware of waren) {
      for (const richtung of ['kaufen', 'verkaufen']) {
        await expect(anna.locator(`[data-handel="${richtung}"][data-ware="${ware}"]`)).toBeInViewport();
      }
    }

    // Holz kaufen: 100 Holz mehr, so viel Gold weniger, wie der Knopf sagte -
    // und danach kostet Holz mehr.
    const kaufen = anna.locator('[data-handel="kaufen"][data-ware="holz"]');
    const preis = Number(await kaufen.getAttribute('data-gold'));
    const vorher = await vorrat(anna);
    await kaufen.click();
    await expect.poll(async () => (await vorrat(anna)).holz).toBe(vorher.holz + 100);
    expect((await vorrat(anna)).gold).toBe(vorher.gold - preis);
    await expect.poll(async () => Number(await kaufen.getAttribute('data-gold'))).toBeGreaterThan(preis);
    // Noch einmal: wieder teurer.
    const zweiter = Number(await kaufen.getAttribute('data-gold'));
    await kaufen.click();
    await expect.poll(async () => Number(await kaufen.getAttribute('data-gold'))).toBeGreaterThan(zweiter);

    // Stein verkaufen: 100 Stein weniger, das Gold vom Knopf mehr - und danach
    // bringt Stein weniger.
    const verkaufen = anna.locator('[data-handel="verkaufen"][data-ware="stein"]');
    const erloes = Number(await verkaufen.getAttribute('data-gold'));
    const davor = await vorrat(anna);
    await verkaufen.click();
    await expect.poll(async () => (await vorrat(anna)).stein).toBe(davor.stein - 100);
    expect((await vorrat(anna)).gold).toBe(davor.gold + erloes);
    await expect.poll(async () => Number(await verkaufen.getAttribute('data-gold'))).toBeLessThan(erloes);

    // Was die Unterschrift sagt: Holz kostet jetzt mehr als Nahrung.
    const kaufpreis = (ware) => anna.locator(`[data-handel="kaufen"][data-ware="${ware}"]`).getAttribute('data-gold').then(Number);
    expect(await kaufpreis('holz')).toBeGreaterThan(await kaufpreis('nahrung'));
    await bedienteileFrei(anna);
    await anna.waitForTimeout(100);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-33',
      titel: 'Annas Markt (blau) gewählt: je Ware ein Knopf zum Kaufen und einer zum Verkaufen, darauf der Preis in Gold – Holz kostet mehr als Nahrung',
      test: info,
    });
  });
});
