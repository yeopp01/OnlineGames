// Entf entfernt das Gewaehlte (→ specs/10-strategie/bedienung.md AC-75).
//
// Rueckmeldung des Benutzers: "sollte es möglich sein, dass ein dorfbewohner
// sich selbst umbringt? durch entf taste?" - und zum Vorschlag, mit Umschalt
// alle zu entfernen: "nur entfernen, müssen keine massenentf sein oder so."
//
// Was die Nachricht auf dem Server tut, prueft
// tests/strategie-entlassen.test.mjs. Hier: die Taste selbst - eine Einheit je
// Druck, eine gehaltene Taste zaehlt einmal, und ein gewaehltes Haus liegt
// danach in Truemmern.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, gebaeudeInDerNaehe, partieBeenden, partieZuZweit, waehlen } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Entf entfernt das Gewaehlte', () => {
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-75: Entf nimmt von drei gewählten Dorfbewohnern einen je Druck, gehalten nur einen - und ein gewähltes Haus liegt danach in Trümmern', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    await zeitraffer(anna, code, 1);
    const { basis, bauern } = await anna.evaluate(() => {
      const a = window.ansicht;
      const k = a.werte.einheiten.dorfbewohner.kuerzel;
      const basis = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 1.8;
      a.blickAuf(basis.x + 2, basis.y + 3);
      return { basis, bauern: [...a.nachher.values()].filter((e) => e.b === a.ich && e.k === k).map((e) => e.i) };
    });
    expect(bauern.length).toBe(3);
    const lebende = () => anna.evaluate((ids) => ids.filter((id) => {
      const e = window.ansicht.nachher.get(id);
      return e && !e.s;
    }), bauern);

    // Ohne Auswahl tut die Taste nichts.
    await anna.keyboard.press('Escape');
    await anna.keyboard.press('Delete');
    await zeitraffer(anna, code, 1);
    await anna.waitForTimeout(400);
    expect((await lebende()).length).toBe(3);

    // Drei gewaehlt, einmal gedrueckt: genau einer faellt.
    await waehlen(anna, bauern);
    await anna.keyboard.press('Delete');
    await expect.poll(async () => (await lebende()).length).toBe(2);
    await anna.waitForTimeout(600);
    expect((await lebende()).length, 'es bleibt bei einem').toBe(2);
    // Die zwei anderen sind weiter gewaehlt.
    const uebrig = await lebende();
    expect(await anna.evaluate((ids) => ids.every((id) => window.ansicht.ausgewaehlt.has(id)), uebrig)).toBe(true);

    // Gehalten: der Browser wiederholt die Taste - gezaehlt wird sie einmal.
    await anna.keyboard.down('Delete');
    await anna.keyboard.down('Delete');
    await anna.keyboard.down('Delete');
    await anna.keyboard.up('Delete');
    await expect.poll(async () => (await lebende()).length).toBe(1);
    await anna.waitForTimeout(600);
    expect((await lebende()).length, 'gehalten faellt nur einer').toBe(1);

    // Ein Haus: gewaehlt, Entf - es liegt in Truemmern, der Wohnraum ist weg.
    const haus = await gebaeudeInDerNaehe(anna, code, 'Anna', 'haus', basis, { von: 5, bis: 9 });
    await anna.waitForFunction((id) => window.ansicht.gebaeude.has(id), haus);
    const wohnraum = () => anna.locator('[data-rohstoff="bev"]').innerText();
    const vorher = await wohnraum();
    await anna.evaluate((id) => {
      const a = window.ansicht;
      a.ausgewaehlt.clear();
      a.gewaehltesGebaeude = id;
      const m = a.gebaeudeMitte(a.gebaeude.get(id));
      a.blickAuf(m.x, m.y);
      a.beiAuswahl();
    }, haus);
    await expect(anna.locator('.auswahl-kopf strong')).toHaveText('Haus');
    await anna.keyboard.press('Delete');
    await anna.waitForFunction((id) => !window.ansicht.gebaeude.has(id), haus);
    expect(await anna.evaluate(() => window.ansicht.ruinen.length), 'das Haus hinterlaesst Truemmer').toBe(1);
    await expect.poll(wohnraum).not.toBe(vorher);
    // Die Leiste ist leer: gewaehlt ist nichts mehr.
    await expect(anna.locator('.auswahl-kopf strong')).toBeHidden();
    // Das Dorfzentrum steht - entfernt wird nur, was gewaehlt war.
    expect(await anna.evaluate(() => [...window.ansicht.gebaeude.values()]
      .filter((g) => g.b === window.ansicht.ich && g.art === 'dorfzentrum').length)).toBe(1);

    await anna.mouse.move(700, 300);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-75',
      titel: 'Entf auf das gewählte Haus: es liegt in Trümmern - von drei Dorfbewohnern steht nach zwei Tastendrücken noch einer',
      test: info,
    });

    // In der Tastenuebersicht steht die Taste.
    await anna.keyboard.press('?');
    await expect(anna.locator('#tastenuebersicht')).toContainText('Entf');
    await expect(anna.locator('#tastenuebersicht')).toContainText('eines je Druck');
    await anna.keyboard.press('Escape');
  });
});
