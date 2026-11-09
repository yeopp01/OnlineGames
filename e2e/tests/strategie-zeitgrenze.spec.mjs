// Die Zeitgrenze als Einstellung im Bild (→ specs/10-strategie/spielziel.md
// AC-22): Anna eröffnet mit „90 Spielminuten", beide sehen die Grenze hinter
// der Uhr, und nach 90 Minuten steht für beide „Unentschieden". Ohne Grenze
// (die Vorgabe) steht nichts hinter der Uhr, und die Partie läuft über 90
// Minuten hinaus. Die Regel selbst prüft tests/strategie-partieende.test.mjs
// gegen die Welt; hier geht es um den Weg vom Formular bis ins Bild.
//
// 90 Spielminuten sind auch im größten Zeitraffer viereinhalb echte Minuten.
// Deshalb stellt der Prüfgriff `uhr` die Uhr kurz vor die Grenze.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test, uhrStellen, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const SPIELZIEL = '10-strategie/spielziel.md';

/** Die Spielzeit, die oben steht, in Sekunden. */
async function abgelesen(page) {
  const text = (await page.locator('#spielzeit b').textContent()).trim();
  const [minuten, sekunden] = text.split(':').map(Number);
  return minuten * 60 + sekunden;
}

test.describe('Zeitgrenze 90 Minuten', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { zeitgrenze: 90, sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('spielziel AC-22: beim Eröffnen gewählt, steht die Grenze bei beiden hinter der Uhr, und nach 90 Minuten endet die Partie unentschieden', async ({}, info) => {
    test.setTimeout(90_000);
    const { anna, bert, code } = partie;
    for (const seite of [anna, bert]) {
      expect(await seite.evaluate(() => window.ansicht.zeitgrenze), 'die Grenze kam mit dem Aufbau').toBe(90);
      await expect(seite.locator('#spielzeit .zeitgrenze')).toBeVisible();
      await expect(seite.locator('#spielzeit .zeitgrenze')).toHaveText(/^\s*\/ 90:00$/);
      await expect(seite.locator('#spielzeit')).toHaveAttribute('title', /nach 90 Minuten endet die Partie unentschieden/);
    }

    // Kurz vor die Grenze, und die Welt anhalten, damit das Bild die Uhr
    // knapp darunter zeigt.
    await uhrStellen(anna, code, 89 + 45 / 60);
    await zeitraffer(anna, code, 0);
    await expect.poll(() => abgelesen(anna)).toBeGreaterThanOrEqual(89 * 60 + 45);
    expect(await abgelesen(anna), 'noch vor der Grenze').toBeLessThan(90 * 60);
    expect(await anna.evaluate(() => window.ansicht.ende), 'vor der Grenze laeuft sie').toBeNull();
    await expect(anna.locator('#spielzeit')).toBeInViewport({ ratio: 1 });
    await bedienteileFrei(anna);
    await nachweis(anna, {
      spec: SPIELZIEL,
      ac: 'AC-22',
      titel: 'Mit 90 Spielminuten eröffnet: oben hinter der Uhr steht „/ 90:00“, die Uhr kurz davor',
      test: info,
    });

    // Weiter, bis die Grenze erreicht ist.
    await zeitraffer(anna, code, 10);
    for (const seite of [anna, bert]) {
      await seite.waitForFunction(() => window.ansicht.ende !== null, null, { timeout: 30_000 });
      const ende = await seite.evaluate(() => window.ansicht.ende);
      expect({ grund: ende.grund, gewinner: ende.gewinner }).toEqual({ grund: 'zeit', gewinner: [] });
      await expect(seite.locator('#partieende')).toHaveText('Unentschieden — 90 Minuten sind um');
      await expect(seite.locator('#partieende')).toBeInViewport();
    }
    expect(await abgelesen(anna), 'beendet bei der Grenze').toBeGreaterThanOrEqual(90 * 60);
    await nachweis(bert, {
      spec: SPIELZIEL,
      ac: 'AC-22',
      titel: 'Bei Bert nach Ablauf der Grenze: „Unentschieden — 90 Minuten sind um“ über der Tafel',
      test: info,
    });
  });
});

test.describe('Ohne Zeitgrenze', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Die Vorgabe: nichts gewählt.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('spielziel AC-22: ohne Grenze steht nichts hinter der Uhr, und die Partie läuft über 90 Minuten hinaus', async () => {
    test.setTimeout(60_000);
    const { anna, code } = partie;
    expect(await anna.evaluate(() => window.ansicht.zeitgrenze)).toBeNull();
    await expect(anna.locator('#spielzeit .zeitgrenze')).toBeHidden();
    await uhrStellen(anna, code, 89 + 55 / 60);
    await zeitraffer(anna, code, 10);
    // Zehn Spielsekunden ueber die alte Grenze hinaus - vor spielziel AC-22
    // endete hier jede Partie.
    await expect.poll(() => abgelesen(anna), { timeout: 20_000 }).toBeGreaterThanOrEqual(90 * 60 + 10);
    expect(await anna.evaluate(() => window.ansicht.ende), 'keine Grenze, kein Ende').toBeNull();
    await expect(anna.locator('#abschluss')).toBeHidden();
    await zeitraffer(anna, code, 1);
  });
});
