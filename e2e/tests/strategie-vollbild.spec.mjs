// Vollbild gibt die Tasten (→ specs/10-strategie/bedienung.md AC-73).
//
// Rueckmeldung des Benutzers: "mit strg + 1 und andere zahlen muss man gruppen
// machen können von einheiten". Im Fenster nimmt Chrome Strg+1 bis 8 fuer die
// Tabs, und keine Seite kann das verhindern. Im Vollbild, das die Seite selbst
// anfordert, gibt er Tasten her, wenn sie darum bittet.
//
// Was hier geprueft wird: Menue und F11 schalten das Vollbild, und die Sperre
// wird mit den Tasten des Spiels verlangt. Was hier NICHT pruefbar ist: ob der
// Browser sie dann hergibt - der Testbrowser bekommt ohnehin jede Taste. Das
// Kriterium bleibt deshalb `in-qa`, bis es jemand im Chrome probiert hat.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Vollbild', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-73: Menue und F11 schalten das Vollbild, und darin verlangt das Spiel seine Tasten vom Browser', async ({}, info) => {
    const { anna } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    const voll = () => anna.evaluate(() => Boolean(document.fullscreenElement));

    // Mitschreiben, was vom Browser verlangt und wieder freigegeben wird.
    const kenntSperre = await anna.evaluate(() => {
      window.verlangt = [];
      window.freigegeben = 0;
      const tastatur = navigator.keyboard;
      if (!tastatur?.lock) return false;
      const sperren = tastatur.lock.bind(tastatur);
      const freigeben = tastatur.unlock.bind(tastatur);
      tastatur.lock = (tasten) => {
        window.verlangt.push(tasten);
        return sperren(tasten);
      };
      tastatur.unlock = () => {
        window.freigegeben += 1;
        return freigeben();
      };
      return true;
    });
    expect(kenntSperre, 'der Testbrowser kennt navigator.keyboard.lock').toBe(true);

    // Aus dem Menue.
    expect(await voll()).toBe(false);
    await anna.locator('#menue').click();
    const knopf = anna.locator('#menueVollbild');
    await expect(knopf).toHaveText('Vollbild (F11)');
    await knopf.click();
    await expect.poll(voll).toBe(true);
    await expect(anna.locator('#spielmenue')).toBeHidden();
    await expect.poll(() => anna.evaluate(() => window.verlangt.length)).toBe(1);
    const tasten = await anna.evaluate(() => window.verlangt[0]);
    // Die Ziffern fuer die Gruppen, Esc fuer die Auswahl, und was mit Strg
    // sonst das Fenster schloesse, neu luede oder druckte.
    for (const taste of ['Digit0', 'Digit1', 'Digit9', 'Escape', 'KeyW', 'KeyR', 'KeyS', 'KeyP', 'KeyT', 'KeyN', 'F5', 'F11', 'Space']) {
      expect(tasten, `verlangt ist ${taste}`).toContain(taste);
    }
    // Alt+Tab bleibt beim Betriebssystem.
    for (const taste of ['Tab', 'AltLeft', 'MetaLeft']) expect(tasten).not.toContain(taste);

    // Im Vollbild sagt das Menue, wie es hinausgeht - und das Spielbild fuellt den Schirm.
    await anna.locator('#menue').click();
    await expect(knopf).toHaveText('Vollbild verlassen (F11)');
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-73',
      titel: 'Im Vollbild: das Menü bietet „Vollbild verlassen (F11)“ an',
      test: info,
    });
    await anna.keyboard.press('Escape');
    await expect(anna.locator('#spielmenue')).toBeHidden();
    expect(await voll(), 'Esc schliesst das Menue, nicht das Vollbild').toBe(true);

    // F11 schaltet zurueck und gibt die Tasten frei.
    await anna.keyboard.press('F11');
    await expect.poll(voll).toBe(false);
    await expect.poll(() => anna.evaluate(() => window.freigegeben)).toBeGreaterThanOrEqual(1);
    await anna.locator('#menue').click();
    await expect(knopf).toHaveText('Vollbild (F11)');
    await anna.keyboard.press('Escape');

    // Und F11 schaltet auch hinein.
    await anna.keyboard.press('F11');
    await expect.poll(voll).toBe(true);
    await expect.poll(() => anna.evaluate(() => window.verlangt.length)).toBe(2);
    await anna.keyboard.press('F11');
    await expect.poll(voll).toBe(false);

    // Die Tastenuebersicht sagt, wozu.
    await anna.keyboard.press('F1');
    await expect(anna.locator('#tastenuebersicht')).toContainText('Strg nur im Vollbild');
    await expect(anna.locator('#tastenuebersicht')).toContainText('Esc halten oder F11 verlässt es');
    await anna.keyboard.press('Escape');
  });
});
