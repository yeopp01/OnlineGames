// Stufe M1 am Stueck (→ specs/15-manager/ausbau.md AC-1): ein eigenes Spiel
// live vom Anpfiff bis zum Bericht, mit Ansprache und Wechsel in der Kabine,
// danach Vorspulen bis zur Winterpause, ohne dass ein Spiel anhaelt.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import {
  ANMELDUNG, expect, karriereBeginnen, tempo, test, vorspulen, weiter,
} from '../helpers/seite.mjs';

const AUSBAU = '15-manager/ausbau.md';

const minuteAufDerUhr = async (page) => Number((await page.locator('#liveUhr b').textContent().catch(() => '0'))?.match(/\d+/)?.[0] ?? 0);
const tempoWaehlen = (page, name) => page.locator(`#liveTempo [data-tempo="${name}"]`).click();

test.describe('Stufe M1 am Stueck', () => {
  test.use({ storageState: ANMELDUNG });

  test('ausbau AC-1: ein Spiel live vom Anpfiff bis zum Bericht, dann vorspulen bis zur Winterpause', async ({ page }, info) => {
    test.setTimeout(240_000);
    await page.setViewportSize({ width: 1366, height: 768 });
    await karriereBeginnen(page);
    await tempo(page, 0);
    await weiter(page);

    // Anpfeifen.
    await expect(page.locator('#live')).toBeVisible();
    await page.locator('#live').click();
    await expect(page.locator('#liveTafel')).toBeVisible();

    // Die erste Haelfte schnell: Szenen kommen in den Ticker, das Band fuellt sich.
    await tempoWaehlen(page, 'schnell');
    await expect(page.locator('#liveKabine')).toBeVisible({ timeout: 40_000 });
    expect(await page.locator('#liveZeilen li .minute').count()).toBeGreaterThan(3);
    expect(await page.locator('#liveBand .abschnitt:not(.offen)').count()).toBe(9);

    // In der Kabine: eine Ansprache und ein Wechsel.
    await page.locator('[data-ansprache="aufbauen"]').click();
    await expect(page.locator('[data-ansprache="aufbauen"]')).toHaveAttribute('aria-pressed', 'true');
    const paar = await page.evaluate(() => {
      const feld = (wahl, feldname) => [...document.querySelectorAll(wahl)]
        .filter((k) => k.closest('tr').querySelector('td').textContent.trim() !== 'TW' && k.closest('tr').querySelector('td').textContent.trim() !== 'TOR')
        .map((k) => /** @type {HTMLElement} */ (k).dataset[feldname]);
      return { raus: feld('[data-raus]', 'raus').at(-1), rein: feld('[data-rein]', 'rein')[0] };
    });
    await page.locator(`[data-raus="${paar.raus}"]`).click();
    await expect(page.locator(`tr.gewaehlt [data-raus="${paar.raus}"]`)).toBeVisible();
    await page.locator(`[data-rein="${paar.rein}"]`).click();
    await expect(page.locator('#liveAb')).toContainText('1 von 3 Wechseln');

    // Die zweite Haelfte schnell, den Rest sofort.
    await page.locator('#liveZweite').click();
    await tempoWaehlen(page, 'schnell');
    await expect.poll(() => minuteAufDerUhr(page), { timeout: 40_000 }).toBeGreaterThanOrEqual(70);
    await tempoWaehlen(page, 'sofort');
    await expect(page.locator('#liveUhr')).toContainText('Abpfiff');

    // Jedes Tor steht im Band.
    const tore = await page.locator('#liveZeilen li.tor').count();
    expect(await page.locator('#liveBand .abschnitt .tor').count()).toBe(tore);
    const stand = `${await page.locator('#liveTorHeim').textContent()} : ${await page.locator('#liveTorGast').textContent()}`;
    expect(Number(stand[0]) + Number(stand.at(-1))).toBe(tore);

    await page.mouse.move(5, 760);
    await nachweis(page, {
      spec: AUSBAU,
      ac: 'AC-1',
      titel: 'Abpfiff des ersten live gespielten Ligaspiels: Endstand auf der Tafel, jedes Tor im Band, rechts der Wechsel aus der Kabine mit wirkt ab Minute 46',
      test: info,
    });

    // Der Bericht, wie nach Weiter.
    await page.locator('#liveBericht').click();
    await expect(page.locator('.kopf')).toBeVisible();
    await expect(page.locator('#standAnzeige')).toHaveText(stand);

    // Vorspulen bis zur Winterpause: kein Spiel haelt an.
    const gespult = page.waitForResponse((r) => r.url().endsWith('/vorspulen'));
    await vorspulen(page, 'winterpause');
    const { zustand } = await (await gespult).json();
    expect(zustand.laufend).toBeNull();
    expect(zustand.termin.art).toBe('winterpause');
    // Bis dahin ist jedes Ligaspiel der Hinrunde gerechnet.
    const hinrunde = zustand.kalender.filter((t) => t.erledigt && t.art === 'liga' && t.spiel?.gegner);
    expect(hinrunde.length).toBeGreaterThanOrEqual(16);
    await expect(page.locator('#liveTafel')).toHaveCount(0);
    expect(await page.evaluate(() => document.body.classList.contains('imspiel'))).toBe(false);
  });
});
