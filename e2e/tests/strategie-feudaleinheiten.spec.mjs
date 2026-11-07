// Die Einheiten der Feudalzeit im Bild (→ specs/10-strategie/einheiten-und-befehle.md
// AC-23): vor dem Aufstieg bietet die Kaserne nur die Miliz, danach auch den
// Speerkaempfer - und die Schiessanlage bildet Bogenschuetze und Plaenkler aus.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, gebaeudeInDerNaehe, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const EINHEITEN = '10-strategie/einheiten-und-befehle.md';

/** Ein Gebaeude anwaehlen und die Kamera darauf richten. */
async function gebaeudeWaehlen(page, id, zoom = 1.6) {
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

/** Wie viele Einheiten dieses Kuerzels der Spieler sieht. */
const zaehlen = (page, k) => page.evaluate((k) => [...window.ansicht.nachher.values()].filter((e) => e.k === k).length, k);

test.describe('Einheiten der Feudalzeit', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let basis;
  let kaserne;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
    basis = await partie.anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    // Rohstoffe fuer den Aufstieg und die Einheiten, und Wohnraum fuer alle.
    await rohstoffe(partie.anna, partie.code, 'Anna', { holz: 2000, nahrung: 2000, gold: 2000 });
    for (let i = 0; i < 3; i++) {
      await gebaeudeInDerNaehe(partie.anna, partie.code, 'Anna', 'haus', basis, { von: 6 + i * 2, bis: 20 });
    }
  });
  test.afterAll(() => partieBeenden(partie));

  test('einheiten AC-23: in der Dunklen Zeit bietet die Kaserne nur die Miliz', async () => {
    const { anna, code } = partie;
    kaserne = await gebaeudeInDerNaehe(anna, code, 'Anna', 'kaserne', basis, { von: 5, bis: 12 });
    await gebaeudeWaehlen(anna, kaserne);
    await expect(anna.locator('[data-ausbilden="miliz"]')).toHaveCount(1);
    // Der Speerkaempfer steht in denselben Daten, aber erst ab der Feudalzeit.
    await expect(anna.locator('[data-ausbilden="speerkaempfer"]')).toHaveCount(0);
    expect(await anna.evaluate(() => window.ansicht.zeitalter)).toBe(0);
  });

  test('einheiten AC-23: nach dem Aufstieg bildet die Kaserne den Speerkaempfer aus', async ({}, info) => {
    const { anna, code } = partie;
    // Der echte Weg in die Feudalzeit: Auftrag im Dorfzentrum (bauen AC-23).
    await anna.keyboard.press('h');
    await anna.locator('[data-aufstieg="feudalzeit"]').click();
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => window.ansicht.zeitalter === 1, null, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);

    await gebaeudeWaehlen(anna, kaserne);
    const knopf = anna.locator('[data-ausbilden="speerkaempfer"]');
    await expect(knopf).toHaveCount(1);
    await expect(knopf).toHaveAttribute('aria-disabled', 'false');
    // Die Miliz bleibt daneben stehen: der Speerkaempfer ersetzt sie nicht.
    await expect(anna.locator('[data-ausbilden="miliz"]')).toHaveCount(1);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-23',
      titel: 'In der Feudalzeit bietet die Kaserne Miliz und Speerkämpfer — 35 Nahrung, 25 Holz, 22 Sekunden',
      test: info,
    });

    const vorher = await zaehlen(anna, 'p');
    await knopf.click();
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(
      (v) => [...window.ansicht.nachher.values()].filter((e) => e.k === 'p').length > v,
      vorher,
      { timeout: 60_000 },
    );
    await zeitraffer(anna, code, 1);
  });

  test('einheiten AC-23: die Schiessanlage bildet Bogenschuetze und Plaenkler aus', async ({}, info) => {
    const { anna, code } = partie;
    const anlage = await gebaeudeInDerNaehe(anna, code, 'Anna', 'schiessanlage', basis, { von: 5, bis: 12 });
    await gebaeudeWaehlen(anna, anlage);
    for (const art of ['bogenschuetze', 'plaenkler']) {
      const knopf = anna.locator(`[data-ausbilden="${art}"]`);
      await expect(knopf, art).toHaveCount(1);
      await knopf.click();
    }
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => {
      const alle = [...window.ansicht.nachher.values()];
      return alle.some((e) => e.k === 'b') && alle.some((e) => e.k === 'k');
    }, null, { timeout: 90_000 });
    await zeitraffer(anna, code, 1);

    // Alle drei stehen in der Welt - und sie sollen auch zu sehen sein.
    expect(await zaehlen(anna, 'p')).toBeGreaterThanOrEqual(1);
    expect(await zaehlen(anna, 'b')).toBeGreaterThanOrEqual(1);
    expect(await zaehlen(anna, 'k')).toBeGreaterThanOrEqual(1);
    const imBild = await anna.evaluate(() => {
      const a = window.ansicht;
      // Die Auswahl haelt die Id, unter der die Einheit in `nachher` steht -
      // nicht ein Feld des Eintrags. Mit `e.id` waehlt man nichts aus.
      const drei = ['p', 'b', 'k'].map((k) => [...a.nachher.entries()].find(([, e]) => e.k === k));
      const mx = drei.reduce((s, [, e]) => s + e.x, 0) / 3;
      const my = drei.reduce((s, [, e]) => s + e.y, 0) / 3;
      a.kamera.zoom = 1.8;
      // Erst das Gebaeude abwaehlen: solange eines gewaehlt ist, zeigt die
      // Leiste unten dessen Ausbildung und nicht die drei Einheiten.
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set(drei.map(([id]) => id));
      a.blickAuf(mx, my);
      a.beiAuswahl();
      const f = { b: a.leinwand.clientWidth, h: a.leinwand.clientHeight };
      return { punkte: drei.map(([, e]) => a.zuBild(e.x, e.y)), gewaehlt: a.ausgewaehlt.size, f };
    });
    for (const p of imBild.punkte) {
      expect(p.x, 'im Bild').toBeGreaterThan(30);
      expect(p.x).toBeLessThan(imBild.f.b - 30);
      expect(p.y).toBeGreaterThan(50);
      expect(p.y).toBeLessThan(imBild.f.h - 230);
    }
    expect(imBild.gewaehlt, 'alle drei ausgewaehlt').toBe(3);
    // Die Leiste unten zaehlt sie und nennt jede Art im Titel - dort stehen
    // die Namen, im Text steht nur die Zahl.
    await expect(anna.locator('.auswahl-kopf')).toHaveText('3 ausgewählt');
    const titel = await anna.locator('#auswahlleiste .gruppe-eintrag')
      .evaluateAll((k) => k.map((x) => x.title));
    for (const name of ['Speerkämpfer', 'Bogenschütze', 'Plänkler']) {
      expect(titel.join(' | '), name).toContain(name);
    }
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(400);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-23',
      titel: 'Alle drei Einheiten der Feudalzeit ausgewählt: der Speerkämpfer an der Kaserne, Bogenschütze und Plänkler an der Schießanlage',
      test: info,
    });
  });
});
