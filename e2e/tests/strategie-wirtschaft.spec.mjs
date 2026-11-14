// Die Wirtschaft waechst mit den Zeitaltern (→ specs/10-strategie/bauen.md
// AC-43, AC-44).
//
// Rueckmeldung des Benutzers aus dem ersten Spiel auf dem Server: "Im
// Fürstentum muss es auch noch weiterentwicklungen für bergbau, mühle,
// holzabbau, etc. geben". Das Bergbaulager forscht jetzt (Gold und Stein, je
// zwei Stufen), Holzfaellerlager und Muehle haben eine zweite Stufe, und das
// Dorfzentrum gibt den Dorfbewohnern Schubkarre und Handkarren.
//
// Was die Verbesserungen rechnen, prueft tests/strategie-wirtschaft.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, gebaeudeInDerNaehe, partieBeenden, partieZuZweit, waehlen } from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';

/** Ein Gebaeude anwaehlen und die Kamera darauf richten. */
async function gebaeudeWaehlen(page, id, zoom = 1.8) {
  await page.waitForFunction((g) => window.ansicht.gebaeude.has(g), id);
  await page.evaluate(([g, z]) => {
    const a = window.ansicht;
    a.kamera.zoom = z;
    a.gewaehltesGebaeude = g;
    a.ausgewaehlt.clear();
    const m = a.gebaeudeMitte(a.gebaeude.get(g));
    a.blickAuf(m.x, m.y);
    a.beiAuswahl();
  }, [id, zoom]);
}

/** Forschen und warten, bis die Verbesserung steht. */
async function erforschen(page, code, art) {
  await page.locator(`[data-ausbilden="${art}"]`).click();
  await zeitraffer(page, code, 20);
  await page.waitForFunction((a) => window.ansicht.verbesserungen.includes(a), art, { timeout: 60_000 });
  await zeitraffer(page, code, 1);
}

/** Das Zeitalter setzen und warten, bis die Ansage aus der Bildmitte verschwunden ist. */
async function zeitalter(page, code, stufe) {
  await rohstoffe(page, code, 'Anna', { holz: 5000, nahrung: 5000, gold: 2000, zeitalter: stufe });
  await page.waitForFunction((s) => window.ansicht.zeitalter === s, stufe);
  await expect(page.locator('#zeitalterwechsel')).toBeHidden({ timeout: 15_000 });
}

const knopf = (page, art) => page.locator(`[data-ausbilden="${art}"]`);

test.describe('Verbesserungen der Wirtschaft', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let basis;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    await zeitalter(anna, code, 1);
  });
  test.afterAll(() => partieBeenden(partie));

  test('bauen AC-43: das Bergbaulager forscht Gold- und Steinbergbau, die zweite Stufe kommt im Fürstentum nach der ersten - ebenso Bogensäge und Schwerer Pflug', async ({}, info) => {
    const { anna, code } = partie;
    const lager = await gebaeudeInDerNaehe(anna, code, 'Anna', 'bergbaulager', basis, { von: 5, bis: 14 });
    await gebaeudeWaehlen(anna, lager);

    // Im Lehen: zwei Knoepfe, jeder mit eigenem Bild. Die Schaechte noch nicht.
    await expect(knopf(anna, 'goldbergbau')).toHaveAttribute('aria-label', 'Goldbergbau erforschen (100 Nahrung, 75 Holz)');
    await expect(knopf(anna, 'steinbergbau')).toHaveAttribute('aria-label', 'Steinbergbau erforschen (100 Nahrung, 75 Holz)');
    await expect(knopf(anna, 'goldschacht')).toHaveCount(0);
    await expect(knopf(anna, 'steinschacht')).toHaveCount(0);
    await expect(knopf(anna, 'goldbergbau')).toBeInViewport();
    const gleich = await anna.evaluate(() => {
      const [a, b] = ['goldbergbau', 'steinbergbau'].map((art) => document.querySelector(`[data-ausbilden="${art}"] canvas`).toDataURL());
      return a === b;
    });
    expect(gleich, 'Hacke mit Gold und Hacke mit Stein sind verschiedene Bilder').toBe(false);

    // Die Tafel nennt die Wirkung in Zahlen.
    const tafel = anna.locator('#knopftafel');
    await knopf(anna, 'goldbergbau').hover();
    await expect(tafel).toBeVisible();
    await expect(tafel.locator('.kt-kopf')).toContainText('Goldbergbau');
    await expect(tafel).toContainText('Gold wird 15 % schneller gesammelt');
    await expect(tafel).toContainText('Forschung 30 s');
    await expect(tafel).toBeInViewport({ ratio: 1 });
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-43',
      titel: 'Das Bergbaulager im Lehen: Goldbergbau und Steinbergbau, die Tafel über dem Knopf nennt 15 % mehr Gold',
      test: info,
    });

    // Erforscht: der Knopf ist weg - der Schacht kommt erst im Fuerstentum.
    await erforschen(anna, code, 'goldbergbau');
    await gebaeudeWaehlen(anna, lager);
    await expect(knopf(anna, 'goldbergbau')).toHaveCount(0);
    await expect(knopf(anna, 'goldschacht')).toHaveCount(0);
    await expect(knopf(anna, 'steinbergbau')).toHaveCount(1);

    await zeitalter(anna, code, 2);
    await gebaeudeWaehlen(anna, lager);
    await expect(knopf(anna, 'goldschacht')).toHaveAttribute('aria-label', 'Goldschacht erforschen (175 Nahrung, 75 Holz)');
    // Der Steinschacht nicht: seine Vorstufe fehlt noch.
    await expect(knopf(anna, 'steinschacht')).toHaveCount(0);
    await knopf(anna, 'goldschacht').hover();
    await expect(tafel).toContainText('Gold wird 15 % schneller gesammelt');
    await erforschen(anna, code, 'goldschacht');
    expect(await anna.evaluate(() => window.ansicht.verbesserungen)).toEqual(expect.arrayContaining(['goldbergbau', 'goldschacht']));

    // Holz: nach der Doppelaxt die Bogensaege.
    const holzlager = await gebaeudeInDerNaehe(anna, code, 'Anna', 'holzfaellerlager', basis, { von: 5, bis: 14 });
    await gebaeudeWaehlen(anna, holzlager);
    await expect(knopf(anna, 'doppelaxt')).toHaveCount(1);
    await expect(knopf(anna, 'bogensaege')).toHaveCount(0);
    await erforschen(anna, code, 'doppelaxt');
    await gebaeudeWaehlen(anna, holzlager);
    await expect(knopf(anna, 'bogensaege')).toHaveAttribute('aria-label', 'Bogensäge erforschen (150 Nahrung, 100 Holz)');
    await knopf(anna, 'bogensaege').hover();
    await expect(tafel).toContainText('Holz wird 20 % schneller gesammelt');

    // Farm: nach dem Pferdekummet der Schwere Pflug.
    const muehle = await gebaeudeInDerNaehe(anna, code, 'Anna', 'muehle', basis, { von: 5, bis: 14 });
    await gebaeudeWaehlen(anna, muehle);
    await expect(knopf(anna, 'schwererPflug')).toHaveCount(0);
    await erforschen(anna, code, 'pferdekummet');
    await gebaeudeWaehlen(anna, muehle);
    await expect(knopf(anna, 'schwererPflug')).toHaveAttribute('aria-label', 'Schwerer Pflug erforschen (125 Nahrung, 125 Holz)');
    await knopf(anna, 'schwererPflug').hover();
    await expect(tafel).toContainText('Jede neue Farm trägt 125 Nahrung mehr');
    await anna.mouse.move(700, 300);
  });

  test('bauen AC-44: das Dorfzentrum erforscht die Schubkarre - der Dorfbewohner trägt danach 13 statt 10, und der Handkarren folgt', async ({}, info) => {
    const { anna, code } = partie;
    await rohstoffe(anna, code, 'Anna', { holz: 5000, nahrung: 5000, gold: 2000 });
    await anna.evaluate(() => {
      const a = window.ansicht;
      a.ausgewaehlt = new Set();
      a.beiAuswahl();
    });
    await anna.keyboard.press('h');
    await expect(anna.locator('.auswahl-kopf strong')).toHaveText('Dorfzentrum');

    await expect(knopf(anna, 'schubkarre')).toHaveAttribute('aria-label', 'Schubkarre erforschen (175 Nahrung, 50 Holz)');
    await expect(knopf(anna, 'handkarren')).toHaveCount(0);
    await expect(knopf(anna, 'schubkarre')).toBeInViewport();
    const tafel = anna.locator('#knopftafel');
    await knopf(anna, 'schubkarre').hover();
    await expect(tafel.locator('.kt-kopf')).toContainText('Schubkarre');
    await expect(tafel).toContainText('Dorfbewohner: +10 % Tempo, +3 Tragkraft');
    await expect(tafel).toBeInViewport({ ratio: 1 });
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-44',
      titel: 'Das Dorfzentrum im Fürstentum: die Schubkarre, die Tafel nennt 10 % Tempo und 3 Tragkraft für den Dorfbewohner',
      test: info,
    });

    expect(await anna.evaluate(() => window.ansicht.einheitenwerte.get(window.ansicht.ich).dorfbewohner.tragkraft)).toBe(10);
    await erforschen(anna, code, 'schubkarre');
    await expect.poll(() => anna.evaluate(() => window.ansicht.einheitenwerte.get(window.ansicht.ich).dorfbewohner.tragkraft)).toBe(13);
    // Bert traegt weiter zehn.
    const bert = await anna.evaluate(() => [...window.ansicht.spieler.keys()].find((id) => id !== window.ansicht.ich));
    expect(await anna.evaluate((id) => window.ansicht.einheitenwerte.get(id)?.dorfbewohner.tragkraft, bert)).toBe(10);

    // Der Handkarren steht jetzt an derselben Stelle.
    await anna.keyboard.press('h');
    await expect(knopf(anna, 'schubkarre')).toHaveCount(0);
    await expect(knopf(anna, 'handkarren')).toHaveAttribute('aria-label', 'Handkarren erforschen (300 Nahrung, 200 Holz)');
    await knopf(anna, 'handkarren').hover();
    await expect(tafel).toContainText('Dorfbewohner: +10 % Tempo, +5 Tragkraft');
    await anna.mouse.move(700, 300);

    // Ein Holzfaeller: unten steht, wie viel er tragen kann.
    const bauer = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const b = a.spieler.get(a.ich).basis;
      let wald = null;
      for (let y = 0; y < g; y++) {
        for (let x = 0; x < g; x++) {
          if (a.karte.felder[y * g + x] !== 1) continue;
          const d = Math.hypot(x - b.x, y - b.y);
          if (!wald || d < wald.d) wald = { x, y, d };
        }
      }
      const e = [...a.nachher.values()].find((f) => f.b === a.ich && f.k === 'd');
      a.befehlSenden([e.i], wald, false);
      return e.i;
    });
    await zeitraffer(anna, code, 6);
    await anna.waitForFunction((id) => window.ansicht.nachher.get(id)?.l > 0, bauer, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);
    await waehlen(anna, [bauer]);
    await expect(anna.locator('#ladung')).toContainText('von 13');
  });
});
