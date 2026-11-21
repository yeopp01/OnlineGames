// Abruesten (→ specs/10-strategie/einheiten-und-befehle.md AC-50, ADR-0014).
//
// Was die Nachricht auf dem Server tut, prueft tests/strategie-abruesten.test.mjs.
// Hier: der Knopf an der Auswahl - mit Preis, fuer alle Gewaehlten, die
// duerfen -, die Lehrzeit daneben, und dass danach Dorfbewohner dastehen.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test, zeitraffer } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit, waehlen } from '../helpers/strategie.mjs';

const EINHEITEN = '10-strategie/einheiten-und-befehle.md';

test.describe('Abruesten', () => {
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('einheiten AC-50: zwei gewählte Ritter rüsten mit einem Knopf ab - 40 Nahrung je Ritter, 20 Sekunden Lehrzeit, danach stehen zwei Dorfbewohner da', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    expect(await einheitenAufstellen(anna, code, 'Anna', 2, { art: 'ritter', x: basis.x + 6, y: basis.y + 4 })).toBe(2);
    const kuerzel = await anna.evaluate(() => ({ ritter: window.ansicht.werte.einheiten.ritter.kuerzel, dorf: window.ansicht.werte.einheiten.dorfbewohner.kuerzel }));
    await anna.waitForFunction((k) => [...window.ansicht.nachher.values()].filter((e) => e.k === k).length === 2, kuerzel.ritter);
    const ritter = await anna.evaluate((k) => [...window.ansicht.nachher.values()].filter((e) => e.k === k).map((e) => e.i), kuerzel.ritter);
    await waehlen(anna, ritter, { zoom: 1.8, blick: { x: basis.x + 6, y: basis.y + 4 } });

    // Zwei Ritter haben den Knopf einmal, mit dem Preis je Ritter.
    const knopf = anna.locator('#abruesten');
    await expect(knopf).toHaveText(/2 abrüsten\s*40/);
    await expect(knopf).toHaveAttribute('aria-disabled', 'false');
    const nahrung = await anna.evaluate(() => window.ansicht.vorraete.nahrung);
    await knopf.click();

    // Bezahlt beim Befehl, die Lehrzeit steht daneben.
    await expect.poll(() => anna.evaluate(() => window.ansicht.vorraete.nahrung)).toBe(nahrung - 80);
    const lehrzeit = anna.locator('#lehrzeit');
    await expect(lehrzeit).toHaveText(/2 rüsten ab – noch (20|19) s/);
    await expect(knopf).toBeHidden();
    await expect(anna.locator('.auswahlleiste')).toBeInViewport();
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-50',
      titel: 'Zwei Ritter rüsten ab: die Leiste nennt die Lehrzeit, bezahlt sind 80 Nahrung',
      test: info,
    });

    // Nach zwanzig Spielsekunden sind es Dorfbewohner - sie sind weiter
    // gewaehlt, und die Leiste zeigt das Baumenue statt des Knopfs.
    await zeitraffer(anna, code, 8);
    await anna.waitForFunction(({ ids, k }) => ids.every((id) => window.ansicht.nachher.get(id)?.k === k), { ids: ritter, k: kuerzel.dorf }, { timeout: 30_000 });
    await zeitraffer(anna, code, 1);
    await expect(lehrzeit).toBeHidden();
    await expect(knopf).toBeHidden();
    await expect(anna.locator('.gruppe-eintrag')).toHaveCount(1);
    await expect(anna.locator('.gruppe-eintrag')).toHaveAttribute('title', '2 Dorfbewohner');
    expect(await anna.evaluate(() => window.ansicht.vorraete.nahrung), 'erstattet wird nichts').toBeLessThanOrEqual(nahrung - 80);
  });
});
