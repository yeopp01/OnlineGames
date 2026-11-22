// Ein zweites Dorfzentrum in der Krone (→ specs/10-strategie/bauen.md AC-57).
//
// Was die Welt rechnet - Zeitalter, Grenze, Baustelle, Fall des ersten,
// Wohnraum, Annahme, Aufstieg, die KI - prueft
// tests/strategie-dorfzentrum.test.mjs. Hier: was man davon sieht.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, dorfbewohnerAnklicken, partieBeenden, partieZuZweit, platzImBild } from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';

test.describe('Zweites Dorfzentrum', () => {
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  const zentren = (seite) => seite.evaluate(() => {
    const a = window.ansicht;
    return [...a.gebaeude.values()].filter((g) => g.b === a.ich && g.art === 'dorfzentrum')
      .map((g) => ({ i: g.i, x: g.x, y: g.y, fertig: (g.u ?? 1) >= 1 }));
  });

  test('bauen AC-57: in der Krone steht das Dorfzentrum im Baumenue, ein zweites wird gesetzt und fertig, ein drittes abgewiesen', async ({}, info) => {
    test.setTimeout(180_000);
    const { anna, code } = partie;
    const knopf = anna.locator('#baumenue [data-bauen="dorfzentrum"]');

    // Im Fuerstentum steht es nicht im Baumenue.
    await rohstoffe(anna, code, 'Anna', { zeitalter: 2, holz: 3000, stein: 3000, nahrung: 3000, gold: 3000 });
    await dorfbewohnerAnklicken(anna);
    await anna.keyboard.press('b');
    await expect(anna.locator('#baumenue [data-bauen="haus"]')).toBeVisible();
    await expect(knopf).toHaveCount(0);
    await anna.keyboard.press('Escape');

    // In der Krone: auf der Seite Militaer, als letzter Eintrag, Taste L -
    // die Wirtschaft traegt dort schon zehn (bedienung AC-64).
    await rohstoffe(anna, code, 'Anna', { zeitalter: 3 });
    await anna.keyboard.press('b');
    await expect(anna.locator('#baumenue [data-bauen="haus"]')).toBeVisible();
    await expect(knopf, 'nicht auf der Seite Wirtschaft').toBeHidden();
    await anna.locator('[data-bauseite="1"]').click();
    await expect(knopf).toBeVisible();
    const lage = await anna.evaluate(() => {
      const knoepfe = [...document.querySelectorAll('#baumenue [data-bauen]')].filter((k) => k.getClientRects().length);
      return { letzter: knoepfe.at(-1)?.dataset.bauen, taste: document.querySelector('#baumenue [data-bauen="dorfzentrum"]').textContent };
    });
    expect(lage.letzter).toBe('dorfzentrum');
    expect(lage.taste).toContain('L');
    await anna.mouse.move(700, 300);
    await knopf.hover();
    await expect(anna.locator('#knopftafel')).toContainText('Höchstens zwei je Spieler, das erste mitgezählt');
    await expect(anna.locator('#knopftafel')).toBeInViewport({ ratio: 1 });
    // Der Knopf traegt das Bild des Dorfzentrums, nicht nur einen Namen.
    expect(await anna.evaluate(() => {
      const bild = document.querySelector('#baumenue [data-bauen="dorfzentrum"] canvas, #baumenue [data-bauen="dorfzentrum"] img');
      if (!bild) return 0;
      if (bild.tagName === 'IMG') return bild.complete && bild.naturalWidth > 0 ? 1 : 0;
      const punkte = bild.getContext('2d').getImageData(0, 0, bild.width, bild.height).data;
      let farbig = 0;
      for (let i = 3; i < punkte.length; i += 4) if (punkte[i] > 0) farbig += 1;
      return farbig / (bild.width * bild.height);
    }), 'das Knopfbild ist gezeichnet').toBeGreaterThan(0.1);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-57',
      titel: 'Baumenü in der Krone, Seite Militär: das Dorfzentrum als letzter Eintrag mit Taste L, die Tafel nennt höchstens zwei je Spieler',
      test: info,
    });

    // Gesetzt mit dem Klick auf das Bild.
    const [erstes] = await zentren(anna);
    await knopf.click();
    expect(await anna.evaluate(() => window.ansicht.platzieren)).toEqual({ art: 'dorfzentrum' });
    await anna.evaluate(() => { window.ansicht.kamera.zoom = 0.9; });
    const platz = await platzImBild(anna, { n: 4, um: { x: erstes.x + 2, y: erstes.y + 2 }, abstand: 8 });
    expect(platz, 'ein freier Platz im Bild').not.toBeNull();
    await anna.mouse.move(platz.bild.x, platz.bild.y, { steps: 4 });
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzLage()?.taugt)).toBe(true);
    await anna.mouse.click(platz.bild.x, platz.bild.y);
    await expect.poll(async () => (await zentren(anna)).length).toBe(2);
    await anna.keyboard.press('Escape');

    // Fertig gebaut, im Zeitraffer.
    await zeitraffer(anna, code, 20);
    await expect.poll(async () => (await zentren(anna)).every((z) => z.fertig), { timeout: 120_000 }).toBe(true);
    await zeitraffer(anna, code, 1);

    // Ein drittes weist der Server ab - gewaehlt mit B und L, gleich welche
    // Seite offen ist (bedienung AC-64).
    await dorfbewohnerAnklicken(anna);
    await anna.keyboard.press('b');
    await anna.keyboard.press('l');
    expect(await anna.evaluate(() => window.ansicht.platzieren)).toEqual({ art: 'dorfzentrum' });
    const dritter = await platzImBild(anna, { n: 4, um: { x: erstes.x + 2, y: erstes.y + 2 }, abstand: 8 });
    await anna.mouse.move(dritter.bild.x, dritter.bild.y, { steps: 4 });
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzLage()?.taugt)).toBe(true);
    await anna.mouse.click(dritter.bild.x, dritter.bild.y);
    await expect(anna.locator('#spielmeldung')).toContainText('nur zweimal je Spieler');
    await anna.keyboard.press('Escape');
    expect((await zentren(anna)).length).toBe(2);
    await expect(anna.locator('#spielmeldung')).toBeHidden({ timeout: 8000 });

    // Das zweite gewaehlt: es bildet aus wie das erste.
    const zweites = (await zentren(anna)).find((z) => z.i !== erstes.i);
    await anna.evaluate(([g, e]) => {
      const a = window.ansicht;
      a.ausgewaehlt.clear();
      a.gewaehltesGebaeude = g;
      a.beiAuswahl();
      a.kamera.zoom = 0.9;
      const m = a.gebaeudeMitte(a.gebaeude.get(g));
      const n = a.gebaeudeMitte(a.gebaeude.get(e));
      a.blickAuf((m.x + n.x) / 2, (m.y + n.y) / 2);
    }, [zweites.i, erstes.i]);
    await expect(anna.locator('.auswahlleiste')).toContainText('Dorfzentrum');
    await expect(anna.locator('[data-ausbilden="dorfbewohner"]')).toBeVisible();
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.mouse.move(700, 120);
    await anna.waitForTimeout(250);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-57',
      titel: 'In der Krone: Annas zweites Dorfzentrum fertig und gewählt, daneben das erste; die Leiste bildet Dorfbewohner aus wie am ersten',
      test: info,
    });
  });
});
