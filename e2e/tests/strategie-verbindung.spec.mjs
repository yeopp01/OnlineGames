// Verbindungsverlust ist sichtbar (→ specs/10-strategie/bedienung.md AC-19,
// specs/00-plattform/uebertragung.md AC-9): reisst die Verbindung, steht ein
// Hinweis mitten im Bild - nicht erst stehende Einheiten. Gekappt wird vom
// Server aus (Pruefgriff `trennen`), wie ein Abbruch im Netz. Der Knopf im
// Hinweis laedt neu und bringt auf den Platz zurueck.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test, trennen } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Verbindungsverlust', () => {
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-19 und uebertragung AC-9: reisst die Verbindung, steht ein Hinweis im Bild; Neu laden kehrt zurueck', async ({}, info) => {
    const { anna, bert, code } = partie;
    const hinweis = anna.locator('#verbindungweg');
    await expect(hinweis).toBeHidden();

    await trennen(anna, code, 'Anna');
    await expect(hinweis).toBeVisible();
    await expect(hinweis).toBeInViewport();
    await expect(hinweis).toContainText('Verbindung zum Server verloren');
    // Nur bei dem, der getrennt ist.
    await expect(bert.locator('#verbindungweg')).toBeHidden();
    await anna.waitForTimeout(200);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-19',
      titel: 'Die Verbindung ist gekappt: mitten im Bild der Hinweis mit dem Knopf Neu laden und zurueckkehren',
      test: info,
    });
    // Dasselbe Bild belegt die Plattform: der Abbruch ist sichtbar.
    await nachweis(anna, {
      spec: '00-plattform/uebertragung.md',
      ac: 'AC-9',
      titel: 'Nach dem Abbruch steht der Hinweis Verbindung zum Server verloren im Bild, nicht erst stehende Einheiten',
      test: info,
    });

    // Der Knopf laedt neu, und Anna ist wieder in ihrer Partie - mit ihren
    // Einheiten, ohne Hinweis.
    const vorher = await anna.evaluate(() => window.ansicht.ich);
    await anna.locator('#neuladen').click();
    await anna.waitForFunction(() => window.ansicht?.nachher?.size > 0, null, { timeout: 15_000 });
    await expect(anna.locator('#spiel')).toBeVisible();
    await expect(anna.locator('#verbindungweg')).toBeHidden();
    expect(await anna.evaluate(() => window.ansicht.ich), 'derselbe Platz').toBe(vorher);
  });
});
