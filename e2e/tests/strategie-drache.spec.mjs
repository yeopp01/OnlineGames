// Der Drache und sein Ei (→ specs/10-strategie/einheiten-und-befehle.md
// AC-51 bis AC-54, bauen AC-35, kampf AC-23; ADR-0014).
//
// Was die Welt rechnet, pruefen tests/strategie-ei.test.mjs und
// tests/strategie-drache.test.mjs. Hier: was man davon sieht.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test } from '../helpers/seite.mjs';
import { aufSeite, gebaeudeInDerNaehe, partieBeenden, partieZuZweit, waehlen } from '../helpers/strategie.mjs';

const EINHEITEN = '10-strategie/einheiten-und-befehle.md';

test.describe('Drache', () => {
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('einheiten AC-51: ein Dorfbewohner hebt das Drachenei mit einem Rechtsklick auf, traegt es sichtbar auf dem Ruecken und legt es ins eigene Kloster', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.eier.size > 0);
    const ei = await anna.evaluate(() => [...window.ansicht.eier.values()][0]);
    expect(ei.nest, 'es liegt in seiner Mulde').toBe(true);

    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'dorfbewohner', x: ei.x - 4, y: ei.y + 1 })).toBe(1);
    const kloster = await gebaeudeInDerNaehe(anna, code, 'Anna', 'kloster', { x: ei.x, y: ei.y }, { von: 5, bis: 12 });
    const dorf = await anna.evaluate(() => window.ansicht.werte.einheiten.dorfbewohner.kuerzel);
    const traeger = await anna.waitForFunction(({ ei, dorf }) => {
      const a = window.ansicht;
      const nah = [...a.nachher.values()].filter((e) => e.b === a.ich && e.k === dorf && Math.hypot(e.x - ei.x, e.y - ei.y) < 7);
      return nah.length ? nah[0].i : null;
    }, { ei, dorf }).then((h) => h.jsonValue());

    await waehlen(anna, [traeger], { zoom: 1.8, blick: { x: ei.x, y: ei.y } });
    const wo = await aufSeite(anna, { feld: { x: ei.x, y: ei.y } });
    await anna.mouse.click(wo.x, wo.y, { button: 'right' });

    // Aufgehoben: am Boden liegt es nicht mehr, er traegt es als Ladung `e`.
    await anna.waitForFunction((id) => window.ansicht.nachher.get(id)?.a === 'e' && window.ansicht.eier.size === 0, traeger, { timeout: 30_000 });
    await expect(anna.locator('.auswahlleiste')).toContainText('trägt 1 Drachenei');
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-51',
      titel: 'Der Dorfbewohner trägt das Drachenei auf dem Rücken zum Kloster',
      test: info,
    });

    // Im Kloster: das Kloster nennt sein Ei, der Traeger ist leer.
    await anna.waitForFunction((k) => window.ansicht.gebaeude.get(k)?.e === 1, kloster, { timeout: 60_000 });
    expect(await anna.evaluate((id) => window.ansicht.nachher.get(id)?.l, traeger)).toBe(0);
  });
});
