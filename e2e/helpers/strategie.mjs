// Handgriffe fuer das Strategiespiel im Browser. Rueckschau nach Runde 20:
// der Start einer Partie zu zweit stand kopiert in jeder Spielbild-Datei.
import { ANMELDUNG, expect, fehlerSammeln } from './seite.mjs';

/**
 * Anna (angemeldet) eroeffnet mit festem Startwert, Bert tritt bei, Anna
 * startet. Zurueck kommen beide Seiten, der Raumcode und die gesammelten
 * Fehler beider Seiten - fuer `afterAll`.
 *
 * @param {import('@playwright/test').Browser} browser
 * @param {import('@playwright/test').TestInfo} info
 * @param {{startwert?: number, breite?: number, hoehe?: number}} [wie]
 */
export async function partieZuZweit(browser, info, { startwert = 4711, breite = 1400, hoehe = 950 } = {}) {
  const optionen = { baseURL: info.project.use.baseURL, viewport: { width: breite, height: hoehe }, locale: 'de-DE' };
  const anna = await (await browser.newContext({ ...optionen, storageState: ANMELDUNG })).newPage();
  const bert = await (await browser.newContext(optionen)).newPage();
  const fehler = [fehlerSammeln(anna), fehlerSammeln(bert)];

  await anna.goto('/');
  await anna.locator('[data-oeffnen="strategie"]').click();
  await anna.locator('[data-einstellung="startwert"]').fill(String(startwert));
  await anna.locator('[data-eroeffnen="strategie"]').click();
  await expect(anna.locator('#raumcode')).toHaveText(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  const code = (await anna.locator('#raumcode').textContent()).trim();

  await bert.goto('/');
  await bert.locator('#name').fill('Bert');
  await bert.locator('#code').fill(code);
  await bert.locator('#beitreten').click();
  await expect(anna.locator('#spielerliste li')).toHaveCount(2);

  await anna.locator('#starten').click();
  for (const seite of [anna, bert]) {
    await expect(seite.locator('#brett')).toBeVisible();
    await seite.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0 && window.ansicht.gebaeude.size > 0);
  }
  return { anna, bert, code, fehler };
}

/** Beide Seiten schliessen; vorher duerfen sie keine Fehler gemeldet haben. */
export async function partieBeenden({ anna, bert, fehler }) {
  expect(fehler.flat(), 'Eine der Seiten hat Fehler gemeldet').toEqual([]);
  await anna?.context().close();
  await bert?.context().close();
}
