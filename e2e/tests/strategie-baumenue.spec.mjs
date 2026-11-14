// Das Baumenue auf zwei Seiten (→ specs/10-strategie/bedienung.md AC-64):
// Wirtschaft und Militaer, zwei Reiter links, die Tasten nach B gelten ueber
// beide. Rueckmeldung des Benutzers: "gebäude muss man irgendwie beim
// dorfbewohner etwas organisieren, dass das nicht zu breit wird."
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, rohstoffe, test } from '../helpers/seite.mjs';
import { dorfbewohnerAnklicken, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';
import { BAUTASTEN } from '../../public/tasten.js';

const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Baumenue auf zwei Seiten', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-64: das Baumenue hat zwei Seiten - Wirtschaft und Militaer in hoechstens zwei Reihen, ein Reiter oder noch einmal B wechselt, die Taste eines Gebaeudes gilt auf beiden', async ({}, info) => {
    const { anna, code } = partie;
    // Im Fuerstentum steht alles im Menue, was es bis dahin gibt.
    await rohstoffe(anna, code, 'Anna', { holz: 3000, nahrung: 3000, gold: 1000, stein: 1000, zeitalter: 2 });
    await anna.waitForFunction(() => window.ansicht.zeitalter === 2);
    await dorfbewohnerAnklicken(anna);
    const menue = anna.locator('#baumenue');
    await expect(menue).toBeVisible();

    const alle = await menue.locator('[data-bauen]').evaluateAll((k) => k.map((x) => x.dataset.bauen));
    const sichtbar = () => menue.locator('[data-bauen]').evaluateAll((k) => k.filter((x) => !x.hidden).map((x) => x.dataset.bauen));
    // So viele Reihen belegen die sichtbaren Knoepfe.
    const reihen = () => menue.locator('[data-bauen]').evaluateAll((k) => new Set(k.filter((x) => !x.hidden)
      .map((x) => Math.round(x.getBoundingClientRect().top))).size);
    expect(alle.length, 'alles, was es bis zum Fuerstentum gibt').toBeGreaterThanOrEqual(18);

    // Zuerst die Wirtschaft.
    const wirtschaftReiter = menue.locator('[data-bauseite="0"]');
    const militaerReiter = menue.locator('[data-bauseite="1"]');
    await expect(wirtschaftReiter).toHaveText('Wirtschaft');
    await expect(militaerReiter).toHaveText('Militär');
    await expect(wirtschaftReiter).toHaveAttribute('aria-pressed', 'true');
    const wirtschaft = await sichtbar();
    expect(wirtschaft).toEqual(expect.arrayContaining(['haus', 'muehle', 'holzfaellerlager', 'bergbaulager', 'farm', 'markt']));
    for (const art of ['kaserne', 'schiessanlage', 'stall', 'wachturm', 'steinmauer', 'tor', 'burg']) expect(wirtschaft).not.toContain(art);
    expect(await reihen(), 'die Wirtschaft in hoechstens zwei Reihen').toBeLessThanOrEqual(2);
    await expect(menue.locator('[data-bauen="haus"]')).toBeVisible();
    await expect(menue.locator('[data-bauen="kaserne"]')).toBeHidden();
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-64',
      titel: 'Dorfbewohner im Fuerstentum gewaehlt: links die Reiter Wirtschaft und Militaer, offen die Wirtschaft in zwei Reihen',
      test: info,
    });

    // Ein Klick auf den Reiter: das Militaer, und nur das.
    await militaerReiter.click();
    await expect(militaerReiter).toHaveAttribute('aria-pressed', 'true');
    const militaer = await sichtbar();
    expect(militaer).toEqual(expect.arrayContaining(['kaserne', 'schiessanlage', 'stall', 'wachturm', 'steinmauer', 'tor', 'burg']));
    expect([...wirtschaft, ...militaer].sort()).toEqual([...alle].sort());
    expect(await reihen(), 'das Militaer in hoechstens zwei Reihen').toBeLessThanOrEqual(2);
    await expect(menue.locator('[data-bauen="kaserne"]')).toBeVisible();
    await expect(menue.locator('[data-bauen="haus"]')).toBeHidden();

    // Noch einmal B wechselt die Seite, die Bautasten bleiben an.
    await anna.keyboard.press('b');
    await expect(menue).toHaveClass(/tasten/);
    await anna.keyboard.press('b');
    await expect(wirtschaftReiter).toHaveAttribute('aria-pressed', 'true');
    await expect(menue).toHaveClass(/tasten/);

    // Die Taste eines Gebaeudes der anderen Seite gilt trotzdem - und die
    // Seite zeigt sich, damit das Gewaehlte zu sehen ist.
    await anna.keyboard.press(BAUTASTEN[alle.indexOf('burg')]);
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzieren?.art)).toBe('burg');
    await expect(militaerReiter).toHaveAttribute('aria-pressed', 'true');
    await expect(menue.locator('[data-bauen="burg"]')).toHaveClass(/aktiv/);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-64',
      titel: 'Mit B und der Taste der Burg gewaehlt, waehrend die Wirtschaft offen war: das Menue zeigt das Militaer, die Burg ist markiert',
      test: info,
    });
    // Abgebrochen: wer neu zu bauen beginnt, sieht wieder die Wirtschaft.
    await anna.keyboard.press('Escape');
    expect(await anna.evaluate(() => window.ansicht.platzieren)).toBeNull();
    await expect(wirtschaftReiter).toHaveAttribute('aria-pressed', 'true');
    await expect(menue.locator('[data-bauen="haus"]')).toBeVisible();
  });
});
