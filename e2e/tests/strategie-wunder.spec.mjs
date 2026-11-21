// Das Wunder (→ specs/10-strategie/bauen.md AC-51) und der Sieg durch das
// Wunder (→ specs/10-strategie/spielziel.md AC-29).
//
// Was die Welt rechnet - Werte, Grenze je Spieler, Bauzeit mit zwanzig
// Bauern, die Uhr, Team, Kuendigung und Zeitgrenze -, pruefen
// tests/strategie-wunder.test.mjs. Hier: was man davon sieht.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, rohstoffe, test, uhrStellen, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, dorfbewohnerAnklicken, gebaeudeInDerNaehe, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';
const SPIELZIEL = '10-strategie/spielziel.md';

test.describe('Wunder', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let wunder;

  test.beforeAll(async ({ browser }, info) => {
    // Im Nebel: das Wunder sehen alle, auch wer es nicht sieht (spielziel AC-29).
    partie = await partieZuZweit(browser, info, { sicht: 'nebel' });
  });
  test.afterAll(() => partieBeenden(partie));

  const dorf = (seite) => seite.evaluate(() => {
    const a = window.ansicht;
    const dz = [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'dorfzentrum');
    return { x: dz.x, y: dz.y };
  });

  test('bauen AC-51: in der Krone steht das Wunder im Baumenue; fertig und als Baustelle aus den gerenderten Bildern', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, code } = partie;
    await rohstoffe(anna, code, 'Anna', { zeitalter: 3, holz: 3000, stein: 3000, gold: 3000 });
    await dorfbewohnerAnklicken(anna);
    await anna.keyboard.press('b');
    const knopf = anna.locator('#baumenue [data-bauen="wunder"]');
    await expect(knopf).toBeVisible();

    // Das fertige Wunder und daneben eine Baustelle - beide Annas, aufgestellt
    // vom Pruefgriff, der an der Grenze je Spieler vorbeigeht (sie prueft der
    // Test ohne Browser).
    const um = await dorf(anna);
    wunder = await gebaeudeInDerNaehe(anna, code, 'Anna', 'wunder', um, { von: 7, bis: 16 });
    const fertig = await anna.waitForFunction((g) => window.ansicht.gebaeude.get(g) || null, wunder).then((h) => h.jsonValue());
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'wunder', { x: fertig.x, y: fertig.y }, { von: 6, bis: 12, bau: 0.45 });
    await anna.keyboard.press('Escape');
    await anna.evaluate((g) => {
      const a = window.ansicht;
      a.ausgewaehlt.clear();
      a.gewaehltesGebaeude = g;
      a.beiAuswahl();
      a.kamera.zoom = 0.9;
      const m = a.gebaeudeMitte(a.gebaeude.get(g));
      a.blickAuf(m.x + 3, m.y + 3);
    }, wunder);
    // Gerendert, nicht gezeichnet: das Bild kommt aus der Tafel.
    expect(await anna.evaluate(async () => Boolean((await import('/bilder.js')).gerendert('wunder')))).toBe(true);
    expect(await anna.evaluate(async () => Boolean((await import('/bilder.js')).gerendert('baustelle-5')))).toBe(true);
    await expect(anna.locator('.auswahlleiste')).toContainText('Wunder');
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(200);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-51',
      titel: 'Annas Wunder gewählt, fünf mal fünf Felder mit goldener Kuppel; dahinter eine Baustelle desselben Wunders',
      test: info,
    });
  });

  test('spielziel AC-29: Bert sieht im Nebel die Uhr und das Wunder auf der Uebersichtskarte; nach zehn Minuten hat Anna gewonnen', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, bert, code } = partie;
    await expect(anna.locator('#buendnisansage')).toContainText('Dein Wunder steht — Sieg in');
    const ansage = bert.locator('#buendnisansage');
    await expect(ansage).toContainText('Das Wunder von Anna steht — Sieg in');
    // Bert sieht es nicht - und doch weiss er, wo es steht.
    const lage = await bert.evaluate((g) => ({
      gesehen: window.ansicht.gebaeude.has(g),
      uhren: window.ansicht.wunderuhren,
    }), wunder);
    expect(lage.gesehen, 'im Nebel').toBe(false);
    expect(lage.uhren.length).toBeGreaterThan(0);
    expect(lage.uhren[0].rest).toBeLessThanOrEqual(600);
    await bert.evaluate(() => {
      const a = window.ansicht;
      a.ausgewaehlt.clear();
      a.gewaehltesGebaeude = null;
      a.beiAuswahl();
    });
    await bert.waitForTimeout(250);
    await nachweis(bert, {
      spec: SPIELZIEL,
      ac: 'AC-29',
      titel: 'Bert (rot) im Nebel: oben die Uhr bis zu Annas Sieg, auf der Übersichtskarte ihr Wunder golden umrandet',
      test: info,
    });

    // Zehn Minuten spaeter: die Uhr eine Spielminute ueber die Frist.
    const minuten = await anna.evaluate(() => window.ansicht.takt / 600);
    await uhrStellen(anna, code, minuten + 10.2);
    await zeitraffer(anna, code, 1);
    await expect(bert.locator('#partieende')).toHaveText('Anna hat gewonnen', { timeout: 30_000 });
    await expect(bert.locator('#partieendeGrund')).toHaveText('Das Wunder stand zehn Minuten');
    await expect(anna.locator('#partieende')).toHaveText('Du hast gewonnen');
  });
});
