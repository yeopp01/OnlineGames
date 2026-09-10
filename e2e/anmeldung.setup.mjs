// Einmal anmelden, fuer den ganzen Lauf. Der Server laesst fuenf Anmeldungen je
// Stunde und Adresse zu (specs/00-plattform/konten.md AC-11), und alle
// Browserfenster kommen von derselben Adresse - also meldet sich hier einer an,
// und die Tests des Managerspiels erben die Sitzung.
import { test as einrichten, expect } from '@playwright/test';
import { KONTO } from './helpers/konto.mjs';
import { ANMELDUNG } from './helpers/seite.mjs';

einrichten('anmelden', async ({ page }) => {
  await page.goto('/manager.html');
  await expect(page.locator('#anmeldung')).toBeVisible();
  await page.locator('#anEmail').fill(KONTO.email);
  await page.locator('#anKennwort').fill(KONTO.kennwort);
  await page.locator('#anmeldenKnopf').click();
  await expect(page.locator('#start')).toBeVisible();
  await expect(page.locator('#werName')).toHaveText(KONTO.name);
  await page.context().storageState({ path: ANMELDUNG });
});
