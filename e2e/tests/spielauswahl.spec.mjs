// Die Uebersicht der Spiele nach dem Anmelden, im Browser gesehen
// (→ specs/00-plattform/spielauswahl.md).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { ANMELDUNG, expect, test } from '../helpers/seite.mjs';

const AUSWAHL = '00-plattform/spielauswahl.md';

test.describe('Spiel waehlen', () => {
  test.use({ storageState: ANMELDUNG });

  test('auswahl AC-1: nach dem Anmelden stehen alle Spiele zur Wahl', async ({ page }, info) => {
    await page.goto('/');
    const karten = page.locator('#spiele .spielkarte');
    await expect(karten).toHaveCount(2);
    await expect(karten.nth(0).locator('strong')).toHaveText('Strategie');
    await expect(karten.nth(0).locator('.spielerzahl')).toHaveText('2 bis 6 Spieler');
    await expect(karten.nth(1).locator('strong')).toHaveText('Fussballmanager');
    await expect(karten.nth(1).locator('.spielerzahl')).toHaveText('allein');
    for (const satz of await karten.locator('.spielsatz').allTextContents()) expect(satz.length).toBeGreaterThan(20);
    await nachweis(page, {
      spec: AUSWAHL,
      ac: 'AC-1',
      titel: 'Angemeldet: beide Spiele mit Namen, einem Satz und der Spielerzahl',
      test: info,
    });
  });

  test('auswahl AC-1: auf einem Laptop erreicht man jede Karte', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await expect(page.locator('#vorraum h1')).toBeInViewport();
    const letzte = page.locator('[data-oeffnen="manager"]');
    await letzte.scrollIntoViewIfNeeded();
    await expect(letzte).toBeInViewport();
  });

  test('auswahl AC-1: die Karte fuehrt in ihr Spiel', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-oeffnen="manager"]').click();
    await expect(page).toHaveURL(/\/manager\.html$/);

    await page.goto('/');
    await page.locator('[data-oeffnen="strategie"]').click();
    await expect(page.locator('#warteraum')).toBeVisible();
  });

  test('auswahl AC-3: im Bau gekennzeichnet, nicht spielbar gesperrt', async ({ page }, info) => {
    // Ein drittes Spiel, das es noch nicht gibt, kommt hier aus der Antwort -
    // die Seite zeigt, was der Server an Steckbriefen liefert (AC-2).
    await page.route('/api/spiele', async (route) => {
      const antwort = await route.fetch();
      const { spiele } = await antwort.json();
      spiele.push({
        art: 'hausbau',
        name: 'Hausbau',
        beschreibung: 'Ein Haus waechst Zimmer um Zimmer, gemeinsam gebaut.',
        spieler: { von: 1, bis: 4 },
        stand: 'gesperrt',
        einstieg: { art: 'raum' },
      });
      await route.fulfill({ response: antwort, json: { spiele } });
    });
    await page.goto('/');
    await expect(page.locator('[data-spiel="strategie"] .marke')).toHaveText('im Bau');
    await expect(page.locator('[data-oeffnen="strategie"]')).toBeEnabled();
    await expect(page.locator('[data-spiel="manager"] .marke')).toHaveCount(0);
    await expect(page.locator('[data-spiel="hausbau"] .marke')).toHaveText('noch nicht spielbar');
    await expect(page.locator('[data-oeffnen="hausbau"]')).toBeDisabled();
    await nachweis(page, {
      spec: AUSWAHL,
      ac: 'AC-3',
      titel: 'Strategie traegt im Bau und laesst sich eroeffnen, ein nicht spielbares Spiel steht gesperrt',
      test: info,
    });
  });
});
