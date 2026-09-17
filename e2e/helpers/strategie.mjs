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

/** Einen eigenen Dorfbewohner anklicken, an der Koerpermitte. */
export async function dorfbewohnerAnklicken(page, { ohne = [] } = {}) {
  const ziel = await page.evaluate((ausser) => {
    const a = window.ansicht;
    const e = [...a.nachher.values()].find((f) => f.b === a.ich && f.k === 'd' && !ausser.includes(f.i));
    const p = a.zuBild(e.x, e.y);
    return { i: e.i, x: p.x, y: p.y - a.figurenHoehe() * 0.6 };
  }, ohne);
  await page.mouse.click(ziel.x, ziel.y);
  await expect.poll(() => page.evaluate(() => [...window.ansicht.ausgewaehlt])).toEqual([ziel.i]);
  return ziel.i;
}

/**
 * Wo im Bild ein Gebaeude der Groesse n ganz auf Gras stuende, ohne Schaf -
 * gerechnet aus der Karte der Ansicht, ringweise um einen Punkt. Ob die
 * Vorschau das auch so sieht, prueft der Test danach mit dem Zeiger.
 */
export function platzImBild(page, { n = 2, um, abstand = 5, seitlich = false }) {
  return page.evaluate(({ n, um, abstand, seitlich }) => {
    const a = window.ansicht;
    // Frei heisst: die Vorschau im Spiel zeigte Gruen - mit einem Feld Rand, damit
    // Figuren daneben nicht im Weg stehen.
    const frei = (x0, y0) => a.platzTaugt(Object.keys(a.werte.gebaeude).find((art) => (a.werte.gebaeude[art].groesse || 1) === n && !a.werte.gebaeude[art].begehbar) || 'haus', x0 + Math.floor(n / 2), y0 + Math.floor(n / 2), 1);
    for (let r = abstand; r < abstand + 10; r++) {
      // Vorn zuerst (dx + dy gross): dahinter verdeckt das Dorfzentrum Baustelle
      // und Bauer (Runde 23, beim Ansehen gefunden).
      const ring = [];
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) ring.push([dx, dy]);
      }
      // Seitlich: im Bild rechts daneben (dx - dy gross), fuer Wege, die man sehen will.
      ring.sort((p, q) => (seitlich ? (q[0] - q[1]) - (p[0] - p[1]) : (q[0] + q[1]) - (p[0] + p[1])));
      for (const [dx, dy] of ring) {
        const x = Math.round(um.x) + dx;
        const y = Math.round(um.y) + dy;
        const x0 = x - Math.floor(n / 2);
        const y0 = y - Math.floor(n / 2);
        if (!frei(x0, y0)) continue;
        const p = a.zuBild(x0 + (n - 1) / 2, y0 + (n - 1) / 2);
        // Im Bild und nicht unter der Leiste unten.
        if (p.x < 120 || p.x > a.leinwand.clientWidth - 120 || p.y < 120 || p.y > a.leinwand.clientHeight - 260) continue;
        return { x, y, bild: p };
      }
    }
    return null;
  }, { n, um, abstand, seitlich });
}
