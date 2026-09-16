// Der Einstieg in das Strategiespiel am Stueck: von der Anmeldemaske bis zur
// laufenden Partie in zwei Fenstern (→ specs/10-strategie/fahrplan.md AC-1,
// specs/00-plattform/spielauswahl.md AC-11).
//
// Anna meldet sich hier selbst an, statt die gespeicherte Sitzung zu erben -
// der Weg ab der Anmeldemaske ist, was geprueft wird. Das ist die dritte
// Anmeldung im Lauf (e2e/helpers/konto.mjs: hoechstens fuenf je Stunde).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { KONTO } from '../helpers/konto.mjs';
import { expect, fehlerSammeln, test } from '../helpers/seite.mjs';

const AUSWAHL = '00-plattform/spielauswahl.md';
const FAHRPLAN = '10-strategie/fahrplan.md';

test.describe('Einstieg am Stueck', () => {
  test.describe.configure({ mode: 'serial' });

  let anna;
  let bert;
  const fehler = [];

  test.beforeAll(async ({ browser }, info) => {
    const optionen = { baseURL: info.project.use.baseURL, viewport: { width: 1400, height: 950 }, locale: 'de-DE' };
    const annasFenster = await browser.newContext(optionen);
    await annasFenster.grantPermissions(['clipboard-read', 'clipboard-write']);
    anna = await annasFenster.newPage();
    bert = await (await browser.newContext(optionen)).newPage();
    fehler.push(fehlerSammeln(anna), fehlerSammeln(bert));
  });

  test.afterAll(async () => {
    expect(fehler.flat(), 'Eine der Seiten hat Fehler gemeldet').toEqual([]);
    await anna?.context().close();
    await bert?.context().close();
  });

  test('auswahl AC-11: ohne Anmeldung gibt es statt der Spiele die Anmeldemaske', async ({}, info) => {
    await anna.goto('/');
    const block = anna.locator('#eroeffnen-block');
    await expect(block.locator('h2')).toHaveText('Spiel waehlen');
    await expect(anna.locator('#formAnmelden')).toBeInViewport();
    await expect(block).toContainText('dafuer braucht es ein Konto');
    await expect(anna.locator('[data-oeffnen]')).toHaveCount(0);
    await nachweis(anna, {
      spec: AUSWAHL,
      ac: 'AC-11',
      titel: 'Nicht angemeldet: unter Spiel waehlen steht, warum es ein Konto braucht, und die Anmeldemaske',
      test: info,
    });
  });

  test('fahrplan AC-1: anmelden, waehlen, einstellen, eroeffnen, Code weitergeben, starten', async ({}, info) => {
    // Anmelden ...
    await anna.locator('#anEmail').fill(KONTO.email);
    await anna.locator('#anKennwort').fill(KONTO.kennwort);
    await anna.locator('#formAnmelden button[type="submit"]').click();

    // ... Spiel waehlen und einstellen ...
    await anna.locator('[data-oeffnen="strategie"]').click();
    await anna.locator('[data-einstellung="spieler"]').fill('2');
    await anna.locator('[data-eroeffnen="strategie"]').click();

    // ... der Code kommt ueber die Zwischenablage zu Bert ...
    await expect(anna.locator('#raumcode')).toHaveText(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
    await anna.locator('#codeKopieren').click();
    const weitergegeben = await anna.evaluate(() => navigator.clipboard.readText());

    await bert.goto('/');
    await bert.locator('#name').fill('Bert');
    await bert.locator('#code').fill(weitergegeben);
    await bert.locator('#beitreten').click();
    await expect(anna.locator('#spielerliste li')).toHaveText([`${KONTO.name} (du)`, 'Bert']);
    await expect(bert.locator('[data-wert="spieler"]')).toHaveText('2');
    await expect(anna.locator('#starten')).toBeInViewport();
    await nachweis(anna, {
      spec: FAHRPLAN,
      ac: 'AC-1',
      titel: 'Vor dem Start: Anna hat angemeldet, eingestellt und eroeffnet, Bert ist mit dem kopierten Code da',
      test: info,
    });

    // ... und starten.
    await anna.locator('#starten').click();
    for (const seite of [anna, bert]) {
      await expect(seite.locator('#brett')).toBeVisible();
      await seite.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    }
    await expect(bert.locator('#kartenwert')).toHaveText(/^· Karte \d+$/);
    await nachweis(bert, {
      spec: FAHRPLAN,
      ac: 'AC-1',
      titel: 'Nach dem Start bei Bert: seine Basis mit fuenf Sammlern, oben der Startwert der Karte',
      test: info,
    });
  });
});
