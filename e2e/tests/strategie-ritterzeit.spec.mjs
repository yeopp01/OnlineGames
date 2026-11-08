// Der Aufstieg in die Ritterzeit und ihre drei Gebaeude (→ specs/10-strategie/
// bauen.md AC-27, AC-28): vorher fehlen Kloster, Universitaet und Werkstatt im
// Baumenue, nach dem Aufstieg stehen sie darin und lassen sich bauen.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import {
  bedienteileFrei, dorfbewohnerAnklicken, gebaeudeInDerNaehe, partieBeenden, partieZuZweit, platzImBild,
} from '../helpers/strategie.mjs';
import { BAUTASTEN } from '../../public/tasten.js';

const BAUEN = '10-strategie/bauen.md';

test.describe('Ritterzeit', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  const baumenue = (page) => page.locator('#baumenue [data-bauen]').evaluateAll((k) => k.map((x) => x.dataset.bauen));
  const ritterGebaeude = (page) => page.evaluate(() => {
    const w = window.ansicht.werte;
    return w.einheiten.dorfbewohner.baut.filter((art) => w.gebaeude[art]?.zeitalter === 2);
  });
  const aufsteigen = async (page, code, id, stufe) => {
    await page.keyboard.press('h');
    await page.locator(`[data-aufstieg="${id}"]`).click();
    await zeitraffer(page, code, 20);
    await page.waitForFunction((s) => window.ansicht.zeitalter === s, stufe, { timeout: 60_000 });
    await zeitraffer(page, code, 1);
  };

  test('bauen AC-27 und bauen AC-28: nach dem Aufstieg in die Ritterzeit stehen Kloster, Universitaet und Werkstatt im Menue und lassen sich bauen', async ({}, info) => {
    const { anna, code } = partie;
    await rohstoffe(anna, code, 'Anna', { holz: 3000, nahrung: 3000, gold: 1000, stein: 500 });
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const neu = await ritterGebaeude(anna);
    expect(neu.length, 'die Ritterzeit kennt Gebaeude').toBeGreaterThanOrEqual(3);

    // Dunkle Zeit -> Feudalzeit: zweites Gebaeude, dann der Aufstieg.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'muehle', basis);
    await aufsteigen(anna, code, 'feudalzeit', 1);
    // In der Feudalzeit fehlen die drei.
    await dorfbewohnerAnklicken(anna);
    await anna.keyboard.press('b');
    for (const art of neu) expect(await baumenue(anna), art).not.toContain(art);
    await anna.keyboard.press('Escape');
    // Ritterzeit verweigert, solange zwei Gebaeude der Feudalzeit fehlen.
    await anna.keyboard.press('h');
    await anna.locator('[data-aufstieg="ritterzeit"]').click();
    await expect(anna.locator('#spielmeldung')).toContainText('Feudalzeit');
    // Zwei Gebaeude der Feudalzeit, dann der Aufstieg.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'schiessanlage', basis, { von: 8, bis: 16 });
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'stall', basis, { von: 8, bis: 16 });
    await aufsteigen(anna, code, 'ritterzeit', 2);
    await expect(anna.locator('#zeitalter b')).toHaveText('Ritterzeit');

    // Jetzt stehen sie im Menue - und das Kloster baut man mit seiner Taste.
    await dorfbewohnerAnklicken(anna);
    await anna.keyboard.press('b');
    const menue = await baumenue(anna);
    for (const art of neu) expect(menue, art).toContain(art);
    expect(BAUTASTEN.length, 'fuer jedes Gebaeude eine Taste').toBeGreaterThanOrEqual(menue.length);
    await anna.keyboard.press(BAUTASTEN[menue.indexOf('kloster')]);
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzieren?.art)).toBe('kloster');
    const platz = await platzImBild(anna, { n: 3, um: basis, abstand: 9, seitlich: true });
    expect(platz, 'Platz fuer das Kloster').not.toBeNull();
    await anna.mouse.click(platz.x, platz.y);
    await expect.poll(() => anna.evaluate(() => [...window.ansicht.gebaeude.values()].some((g) => g.art === 'kloster'))).toBe(true);
    const kloster = await anna.evaluate(() => {
      const g = [...window.ansicht.gebaeude.values()].find((x) => x.art === 'kloster');
      return { x: g.x, y: g.y };
    });
    // Die beiden anderen daneben, per Pruefgriff.
    // Mit Abstand: dicht daneben verdeckte die Werkstatt die Universitaet halb.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'universitaet', kloster, { von: 6, bis: 10 });
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'belagerungswerkstatt', kloster, { von: 6, bis: 10 });
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction((arten) => arten.every((art) => [...window.ansicht.gebaeude.values()]
      .some((g) => g.art === art && g.u === undefined)), neu, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);
    await anna.keyboard.press('Escape');

    // Das Bild: die drei in der Mitte, alle im Fenster.
    const lage = await anna.evaluate((arten) => {
      const a = window.ansicht;
      const gs = arten.map((art) => [...a.gebaeude.values()].find((g) => g.art === art));
      const mitten = gs.map((g) => a.gebaeudeMitte(g));
      a.kamera.zoom = 1.6;
      a.blickAuf(mitten.reduce((s, m) => s + m.x, 0) / 3, mitten.reduce((s, m) => s + m.y, 0) / 3);
      return mitten.map((m) => {
        const p = a.zuBild(m.x, m.y);
        return p.x > 60 && p.x < a.leinwand.clientWidth - 60 && p.y > 120 && p.y < a.leinwand.clientHeight - 200;
      });
    }, neu);
    expect(lage, 'alle drei im Bild').toEqual(neu.map(() => true));
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    for (const ac of ['AC-27', 'AC-28']) {
      await nachweis(anna, {
        spec: BAUEN,
        ac,
        titel: 'In der Ritterzeit (oben in der Leiste): Kloster mit Glockenturm, Universität mit Kuppel und Belagerungswerkstatt mit Rad',
        test: info,
      });
    }
  });
});
