// Tastenkuerzel und Tastenuebersicht (→ specs/10-strategie/bedienung.md AC-27, AC-22).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test } from '../helpers/seite.mjs';
import { dorfbewohnerAnklicken, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';
import { BAUTASTEN, BELEGUNG } from '../../public/tasten.js';

const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Tasten', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-27: H waehlt das Dorfzentrum, Q bildet aus, B und die obere Reihe waehlen ein Gebaeude', async ({}, info) => {
    const { anna } = partie;
    // Weg von der Basis: H muss das Dorfzentrum erst ins Bild holen.
    await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 1.3;
      a.blickAuf(b.x - 15, b.y + 15);
    });

    await anna.keyboard.press('h');
    const zentrum = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = a.gebaeude.get(a.gewaehltesGebaeude);
      const m = a.gebaeudeMitte(g);
      const p = a.zuBild(m.x, m.y);
      return { art: g?.art, b: g?.b, ich: a.ich, i: g?.i, p, mitte: { x: a.leinwand.clientWidth / 2, y: a.leinwand.clientHeight / 2 } };
    });
    expect(zentrum.art).toBe('dorfzentrum');
    expect(zentrum.b).toBe(zentrum.ich);
    expect(Math.abs(zentrum.p.x - zentrum.mitte.x)).toBeLessThan(30);
    expect(Math.abs(zentrum.p.y - zentrum.mitte.y)).toBeLessThan(30);
    await expect(anna.locator('#auswahlleiste')).toContainText('Dorfzentrum');

    // Q: ein Dorfbewohner in die Schlange, 50 Nahrung weniger.
    await anna.keyboard.press('q');
    await anna.waitForFunction((id) => (window.ansicht.gebaeude.get(id)?.s.length || 0) === 1, zentrum.i);
    await expect(anna.locator('[data-rohstoff="nahrung"] b')).toHaveText('150');

    // Ein Dorfbewohner, dann B: die Bautasten leuchten, jeder Knopf traegt seinen Buchstaben.
    await anna.keyboard.press('Escape');
    await dorfbewohnerAnklicken(anna);
    const menue = anna.locator('#baumenue');
    await expect(menue).toBeVisible();
    const arten = await menue.locator('[data-bauen]').evaluateAll((k) => k.map((x) => x.dataset.bauen));
    expect(arten.length).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < Math.min(arten.length, BAUTASTEN.length); i++) {
      await expect(menue.locator('[data-bauen]').nth(i).locator('kbd')).toHaveText(BAUTASTEN[i].toUpperCase());
    }
    await expect(menue).not.toHaveClass(/tasten/);
    await anna.keyboard.press('b');
    await expect(menue).toHaveClass(/tasten/);
    await expect(menue).toBeInViewport();
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-27',
      titel: 'Ein Dorfbewohner gewaehlt, B gedrueckt: im Baumenue leuchten die Tasten Q W E R T Z auf den Gebaeuden',
      test: info,
    });

    // Q: das erste Gebaeude des Menues wird platziert, die Tasten gehen aus.
    await anna.keyboard.press('q');
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzieren?.art)).toBe(arten[0]);
    await expect(menue).not.toHaveClass(/tasten/);
    await anna.keyboard.press('Escape');

    // B, dann W: das zweite Gebaeude - und W schiebt dabei nicht die Karte.
    const kameraVorher = await anna.evaluate(() => ({ ...window.ansicht.kamera }));
    await anna.keyboard.press('b');
    await anna.keyboard.down('w');
    await anna.waitForTimeout(250);
    await anna.keyboard.up('w');
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzieren?.art)).toBe(arten[1]);
    const kameraNachher = await anna.evaluate(() => ({ ...window.ansicht.kamera }));
    expect(kameraNachher.y).toBe(kameraVorher.y);
    await anna.keyboard.press('Escape');
  });

  test('bedienung AC-22: ? oder F1 zeigt die Tastenuebersicht mit jeder Belegung, noch einmal schliesst sie', async ({}, info) => {
    const { anna } = partie;
    const uebersicht = anna.locator('#tastenuebersicht');
    await expect(uebersicht).toBeHidden();
    await anna.keyboard.press('?');
    await expect(uebersicht).toBeVisible();
    await expect(uebersicht).toBeInViewport();
    // Jede Belegung, die tasten.js vergibt, steht da - dieselbe Liste.
    await expect(uebersicht.locator('dt')).toHaveCount(BELEGUNG.length);
    for (const [taste, wirkung] of BELEGUNG) {
      await expect(uebersicht).toContainText(taste);
      await expect(uebersicht).toContainText(wirkung);
    }
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-22',
      titel: 'Nach ? mitten im Bild die Tastenuebersicht: Maus, W A S D, H, Q, B mit Q W E R T Z, Punkt, Esc, F1',
      test: info,
    });
    await anna.keyboard.press('F1');
    await expect(uebersicht).toBeHidden();
    await anna.keyboard.press('F1');
    await expect(uebersicht).toBeVisible();
    await anna.keyboard.press('Escape');
    await expect(uebersicht).toBeHidden();
  });
});
