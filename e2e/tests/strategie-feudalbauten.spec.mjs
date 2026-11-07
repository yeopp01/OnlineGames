// Die Gebaeude der Feudalzeit im Bild (→ specs/10-strategie/bauen.md AC-24):
// vor dem Aufstieg stehen Schiessanlage, Stall und Schmiede nicht im Baumenue,
// danach schon - und dann laesst sich eine bauen.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, gebaeudeAufstellen, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, dorfbewohnerAnklicken, partieBeenden, partieZuZweit, platzImBild } from '../helpers/strategie.mjs';
import { BAUTASTEN } from '../../public/tasten.js';

const BAUEN = '10-strategie/bauen.md';
const FEUDAL = ['schiessanlage', 'stall', 'schmiede'];

test.describe('Gebaeude der Feudalzeit', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  const baumenue = (page) => page.locator('#baumenue [data-bauen]').evaluateAll((k) => k.map((x) => x.dataset.bauen));

  test('bauen AC-24: in der Dunklen Zeit fehlen die drei im Baumenue', async ({}, info) => {
    const { anna, code } = partie;
    await rohstoffe(anna, code, 'Anna', { holz: 2000, nahrung: 700 });
    await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 1.3;
      a.blickAuf(b.x + 2, b.y + 2);
    });
    await dorfbewohnerAnklicken(anna);
    await anna.keyboard.press('b');
    const menue = await baumenue(anna);
    expect(menue, 'die Dunkle Zeit kennt sechs Gebaeude').toEqual(
      ['haus', 'muehle', 'holzfaellerlager', 'bergbaulager', 'farm', 'kaserne'],
    );
    for (const art of FEUDAL) expect(menue, art).not.toContain(art);
    await anna.keyboard.press('Escape');
  });

  test('bauen AC-24: nach dem Aufstieg stehen alle drei im Menue und lassen sich bauen', async ({}, info) => {
    const { anna, code } = partie;
    // Zweites Gebaeude der Dunklen Zeit, dann der Aufstieg - der echte Weg.
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    await gebaeudeAufstellen(anna, code, 'Anna', 'muehle', basis.x + 7, basis.y + 7);
    await anna.keyboard.press('h');
    await anna.locator('[data-aufstieg="feudalzeit"]').click();
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => window.ansicht.zeitalter === 1, null, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);

    // Jetzt kennt das Baumenue neun Gebaeude.
    await dorfbewohnerAnklicken(anna);
    await anna.keyboard.press('b');
    const menue = await baumenue(anna);
    for (const art of FEUDAL) expect(menue, art).toContain(art);
    expect(menue.length, 'sechs aus der Dunklen Zeit und drei neue').toBe(9);
    expect(BAUTASTEN.length, 'fuer jedes Gebaeude eine Taste').toBeGreaterThanOrEqual(menue.length);

    // Eine Schiessanlage bauen: Taste, Platz, Rechtsklick - wie jedes andere Gebaeude.
    await anna.keyboard.press(BAUTASTEN[menue.indexOf('schiessanlage')]);
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzieren?.art)).toBe('schiessanlage');
    // Seitlich neben das Dorfzentrum: genau dahinter verdeckt es sie (Runde 59).
    const platz = await platzImBild(anna, { n: 3, um: basis, abstand: 8, seitlich: true });
    expect(platz, 'Platz fuer die Schiessanlage').not.toBeNull();
    await anna.mouse.click(platz.x, platz.y);
    await expect.poll(() => anna.evaluate(() => [...window.ansicht.gebaeude.values()].some((g) => g.art === 'schiessanlage'))).toBe(true);

    // Fertig bauen lassen und ansehen.
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(
      () => [...window.ansicht.gebaeude.values()].some((g) => g.art === 'schiessanlage' && g.u === undefined),
      null,
      { timeout: 60_000 },
    );
    await zeitraffer(anna, code, 1);
    // Sie soll auf dem Bild auch zu sehen sein: der Blick geht zwischen
    // Dorfzentrum und Schiessanlage, und keines verdeckt das andere.
    const sichtbar = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = [...a.gebaeude.values()].find((x) => x.art === 'schiessanlage');
      const m = a.gebaeudeMitte(g);
      const b = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 1.5;
      a.blickAuf((m.x + b.x) / 2, (m.y + b.y) / 2);
      const p = a.zuBild(m.x, m.y);
      return { p, tiefe: g.x + g.y, zentrum: b.x + b.y, fenster: { b: a.leinwand.clientWidth, h: a.leinwand.clientHeight } };
    });
    expect(sichtbar.p.x, 'die Schiessanlage steht im Bild').toBeGreaterThan(40);
    expect(sichtbar.p.x).toBeLessThan(sichtbar.fenster.b - 40);
    expect(sichtbar.p.y).toBeGreaterThan(60);
    expect(sichtbar.p.y).toBeLessThan(sichtbar.fenster.h - 240);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-24',
      titel: 'In der Feudalzeit: das Baumenü mit neun Gebäuden, daneben die fertige Schießanlage mit Zielscheibe',
      test: info,
    });
  });

  test('bauen AC-24: der Stall bildet den Spaeherreiter aus', async ({}, info) => {
    const { anna, code } = partie;
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    await rohstoffe(anna, code, 'Anna', { nahrung: 900 });
    const id = await gebaeudeAufstellen(anna, code, 'Anna', 'stall', basis.x - 7, basis.y + 3);
    await anna.waitForFunction((id) => window.ansicht.gebaeude.has(id), id);
    await anna.evaluate((id) => {
      const a = window.ansicht;
      const g = a.gebaeude.get(id);
      a.kamera.zoom = 1.6;
      a.gewaehltesGebaeude = id;
      a.ausgewaehlt.clear();
      const m = a.gebaeudeMitte(g);
      a.blickAuf(m.x, m.y);
      a.beiAuswahl();
    }, id);
    const knopf = anna.locator('[data-ausbilden="spaeherreiter"]');
    await expect(knopf).toHaveCount(1);
    await expect(knopf).toHaveAttribute('aria-disabled', 'false');
    const vorher = await anna.evaluate(() => [...window.ansicht.nachher.values()].filter((e) => e.k === 's').length);
    await knopf.click();
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(
      (vorher) => [...window.ansicht.nachher.values()].filter((e) => e.k === 's').length > vorher,
      vorher,
      { timeout: 60_000 },
    );
    await zeitraffer(anna, code, 1);
  });
});
