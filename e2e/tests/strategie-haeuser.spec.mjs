// Haus je Platz (→ specs/00-plattform/spielauswahl.md AC-24, ADR-0014):
// im Warteraum hat jeder Platz ein Haus, die KI eingeschlossen; jeder wählt
// seins, der Gastgeber auch das der KI, Vorgabe ist Zufall. Alle lesen je
// Platz Haus und Wahlspruch. Was ein Haus im Spiel bewirkt und wie der Zufall
// gezogen wird, prüfen tests/strategie-haeuser.test.mjs und
// tests/spielauswahl.test.mjs über den Server.
import { HAEUSER } from '../../server/spiele/strategie/daten.js';
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { ANMELDUNG, expect, fehlerSammeln, test } from '../helpers/seite.mjs';

const AUSWAHL = '00-plattform/spielauswahl.md';

test('auswahl AC-24: Haus je Platz im Warteraum - Bert wählt seins, Anna das der KI, ihres bleibt Zufall', async ({ browser }, info) => {
  // Gespielt wird am PC (auswahl AC-23): der kleinste Bildschirm, auf den der
  // Warteraum passen muss.
  const optionen = { baseURL: info.project.use.baseURL, viewport: { width: 1366, height: 768 }, locale: 'de-DE' };
  const anna = await (await browser.newContext({ ...optionen, storageState: ANMELDUNG })).newPage();
  const bert = await (await browser.newContext(optionen)).newPage();
  const fehler = [fehlerSammeln(anna), fehlerSammeln(bert)];
  try {
    await anna.goto('/');
    await anna.locator('[data-oeffnen="strategie"]').click();
    await anna.locator('[data-einstellung="ki"]').fill('1');
    await anna.locator('[data-einstellung="startwert"]').fill('4711');
    await anna.locator('[data-eroeffnen="strategie"]').click();
    await expect(anna.locator('#raumcode')).toHaveText(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
    const code = (await anna.locator('#raumcode').textContent()).trim();

    await bert.goto('/');
    await bert.locator('#name').fill('Bert');
    await bert.locator('#code').fill(code);
    await bert.locator('#beitreten').click();
    await expect(bert.locator('#spielerliste li .name')).toHaveText(['Anna', 'Bert (du)', 'KI 1']);

    // Zu Beginn steht überall Zufall - auch die Marken, die Bert nur liest.
    const zeilen = bert.locator('#spielerliste li');
    await expect(zeilen.nth(0).locator('[data-wahl="haus"]')).toHaveText('Haus: Zufall');
    await expect(zeilen.nth(2).locator('[data-wahl="haus"]')).toHaveText('Haus: Zufall');
    await expect(zeilen.nth(1).locator('[data-wahl="haus"]')).toHaveValue(JSON.stringify('zufall'));

    // Bert wählt sein Haus; ein fremdes kann er nicht wählen (keine Auswahl).
    await zeilen.nth(1).locator('[data-wahl="haus"]').selectOption(JSON.stringify('rappenstein'));
    await expect(zeilen.nth(2).locator('select[data-wahl="haus"]')).toHaveCount(0);
    // Anna setzt das Haus der KI.
    const beiAnna = anna.locator('#spielerliste li');
    await expect(beiAnna.nth(1).locator('[data-wahl="haus"]')).toHaveValue(JSON.stringify('rappenstein'));
    await beiAnna.nth(2).locator('[data-wahl="haus"]').selectOption(JSON.stringify('distelhag'));

    // Bert liest je Platz Haus und Wahlspruch - aus den Daten, nicht aus dem Kopf.
    const distelhag = HAEUSER.distelhag;
    await expect(zeilen.nth(2).locator('[data-wahl="haus"]')).toHaveText(`${distelhag.name} – ${distelhag.wahlspruch}`);
    const eigene = zeilen.nth(1).locator('[data-wahl="haus"] option:checked');
    await expect(eigene).toHaveText(`${HAEUSER.rappenstein.name} – ${HAEUSER.rappenstein.wahlspruch}`);

    // Das Haus passt in die Zeile auf 1366 × 768: jede Wahl je Platz ganz im
    // Fenster, und nichts ragt seitlich heraus. "Partie starten" prüft
    // auswahl AC-23 für den Gastgeber allein; mit drei Plätzen lag der Knopf
    // schon vor dem Haus halb unter dem Rand - die Zeilen sind mit der
    // zweiten Wahl nicht höher geworden (Faden in den Erkenntnissen, Runde 169).
    for (const seite of [anna, bert]) {
      for (const feld of await seite.locator('#spielerliste [data-wahl]').all()) await expect(feld).toBeInViewport({ ratio: 1 });
      expect(await seite.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'nichts ragt seitlich heraus').toBe(true);
    }

    await nachweis(bert, {
      spec: AUSWAHL,
      ac: 'AC-24',
      titel: 'Bert im Warteraum: sein Haus Rappenstein wählt er selbst, die KI steht auf Distelhag mit Wahlspruch, Annas Haus auf Zufall',
      test: info,
    });

    // Gestartet kommen die Häuser an: Bert Rappenstein, die KI Distelhag,
    // Annas Zufall ist ein Haus.
    await anna.locator('#starten').click();
    await bert.waitForFunction(() => window.ansicht && window.ansicht.spieler.size === 3);
    const haeuser = await bert.evaluate(() => Object.fromEntries([...window.ansicht.spieler.values()].map((s) => [s.name, s.haus])));
    expect(haeuser.Bert).toBe('rappenstein');
    expect(haeuser['KI 1']).toBe('distelhag');
    expect(Object.keys(HAEUSER)).toContain(haeuser.Anna);
    expect(fehler.flat(), 'Eine der Seiten hat Fehler gemeldet').toEqual([]);
  } finally {
    await anna.context().close();
    await bert.context().close();
  }
});
