// Der Marktkarren (→ specs/10-strategie/einheiten-und-befehle.md AC-39): am
// Markt steht sein Knopf erst ab der Ritterzeit; ein Klick bildet ihn aus,
// und er erscheint als eigene Figur - ein Pony vor einem Planwagen in der
// Spielerfarbe. Gewaehlt sagt die Leiste "Greift nicht an", und ein
// Rechtsklick auf Fremde ist ein Gang (weisses Zeichen). Die Regeln selbst
// (Werte, Zeit, Wohnplatz, keine Wache) prueft tests/strategie-marktkarren.test.mjs.
//
// Der Handel (AC-40): ein Rechtsklick auf einen zweiten eigenen Markt schickt
// ihn auf die Strecke, die Leiste nennt sie, und daheim kommt Gold an. Die
// Regeln - Gold je Fahrt, Verbuendete und Gegner, fallende Maerkte, die
// Messung gegen den Dorfbewohner - prueft derselbe Test ohne Browser.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import {
  bedienteileFrei, einheitenJeArt, figurenFrei, gebaeudeInDerNaehe, partieBeenden, partieZuZweit,
} from '../helpers/strategie.mjs';

const EINHEITEN = '10-strategie/einheiten-und-befehle.md';

test.describe('Marktkarren', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let karren;
  let erster;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  const aufsteigen = async (page, code, id, stufe) => {
    await page.keyboard.press('h');
    await page.locator(`[data-aufstieg="${id}"]`).click();
    await zeitraffer(page, code, 20);
    await page.waitForFunction((s) => window.ansicht.zeitalter === s, stufe, { timeout: 60_000 });
    await zeitraffer(page, code, 1);
  };
  const marktWaehlen = (page, id) => page.evaluate((g) => {
    const a = window.ansicht;
    a.kamera.zoom = 2;
    a.gewaehltesGebaeude = g;
    a.ausgewaehlt.clear();
    const b = a.gebaeude.get(g);
    a.blickAuf(b.x - 0.5, b.y - 1);
    a.beiAuswahl();
  }, id);

  test('einheiten AC-39: der Markt bildet ab der Ritterzeit den Marktkarren aus - eigene Figur, greift nicht an, ein Rechtsklick auf Fremde ist ein Gang', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, code } = partie;
    await rohstoffe(anna, code, 'Anna', { holz: 3000, nahrung: 3000, gold: 1000, stein: 500 });
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const k = await anna.evaluate(() => window.ansicht.werte.einheiten.marktkarren.kuerzel);

    // Feudalzeit, ein fertiger Markt (Pruefgriff - das Bauen belegt bauen
    // AC-33): noch kein Knopf fuer den Karren.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'muehle', basis);
    await aufsteigen(anna, code, 'feudalzeit', 1);
    const marktId = await gebaeudeInDerNaehe(anna, code, 'Anna', 'markt', basis, { von: 8, bis: 16 });
    erster = marktId;
    await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), marktId);
    await marktWaehlen(anna, marktId);
    await expect(anna.locator('#handel')).toBeInViewport();
    await expect(anna.locator('[data-ausbilden="marktkarren"]')).toHaveCount(0);
    await anna.keyboard.press('Escape');

    // Ritterzeit: jetzt steht er am Markt, neben dem Handel.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'schiessanlage', basis, { von: 8, bis: 16 });
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'stall', basis, { von: 8, bis: 16 });
    await aufsteigen(anna, code, 'ritterzeit', 2);
    await marktWaehlen(anna, marktId);
    const knopf = anna.locator('[data-ausbilden="marktkarren"]');
    await expect(knopf).toBeInViewport();
    await expect(knopf).toHaveAttribute('title', /Marktkarren ausbilden/);
    await expect(anna.locator('#handel')).toBeInViewport();

    // Ausbilden: der Unterschied zaehlt, nicht der Bestand.
    const vorher = (await einheitenJeArt(anna))[k] || 0;
    await knopf.click();
    await zeitraffer(anna, code, 10);
    await expect.poll(async () => (await einheitenJeArt(anna))[k] || 0, { timeout: 30_000 }).toBe(vorher + 1);
    await zeitraffer(anna, code, 0);
    karren = await anna.evaluate((kz) => {
      const a = window.ansicht;
      const e = [...a.nachher.values()].find((x) => x.k === kz && x.b === a.ich);
      return { i: e.i, x: e.x, y: e.y };
    }, k);

    // Gewaehlt: die Leiste sagt, dass er nicht angreift - kein "Angriff 0".
    await anna.evaluate((e) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set([e.i]);
      a.beiAuswahl();
      a.kamera.zoom = 2.5;
      a.blickAuf(e.x - 0.6, e.y - 0.4);
    }, karren);
    const werte = anna.locator('#kampfwerte');
    await expect(werte).toBeInViewport();
    await expect(werte).toContainText('Greift nicht an');
    await expect(werte).not.toContainText('Nahkampf');

    // Ein Rechtsklick auf Berts Dorfzentrum ist fuer den Karren ein Gang -
    // dieselbe Stelle, die der Klick fragt, gibt ein weisses Zeichen.
    const feindlich = await anna.evaluate((e) => {
      const a = window.ansicht;
      const zentrum = [...a.gebaeude.values()].find((g) => g.b !== a.ich && g.art === 'dorfzentrum');
      a.zielzeichenSetzen(a.gebaeudeMitte(zentrum));
      const rot = a.zielzeichen.feindlich;
      a.zielzeichen = null;
      return rot;
    }, karren);
    expect(feindlich, 'fuer den Karren ein Gang').toBe(false);

    expect(await bedienteileFrei(anna)).toEqual([]);
    expect(await figurenFrei(anna)).toEqual([]);
    await anna.waitForTimeout(150);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-39',
      titel: 'Annas Marktkarren (blau) gewählt, eben am Markt ausgebildet: ein Pony vor dem Planwagen mit blauer Plane, die Leiste sagt „Greift nicht an“',
      test: info,
    });
    await zeitraffer(anna, code, 1);
  });

  const karrenWaehlen = (page, id) => page.evaluate((e) => {
    const a = window.ansicht;
    const k = a.nachher.get(e);
    a.gewaehltesGebaeude = null;
    a.ausgewaehlt = new Set([e]);
    a.beiAuswahl();
    a.kamera.zoom = 2.5;
    a.blickAuf(k.x - 0.6, k.y - 0.4);
  }, id);

  test('einheiten AC-40: ein Rechtsklick auf einen zweiten eigenen Markt schickt den Karren auf die Strecke - die Leiste nennt sie, er bringt das Gold heim', async ({}, info) => {
    test.setTimeout(150_000);
    const { anna, code } = partie;
    // Weit genug vom ersten, dass sich die Fahrt lohnt - nah beieinander
    // bringt sie fast nichts (im ersten Entwurf 5 Gold).
    const um = await anna.evaluate((g) => { const m = window.ansicht.gebaeude.get(g); return { x: m.x, y: m.y }; }, erster);
    const zweiter = await gebaeudeInDerNaehe(anna, code, 'Anna', 'markt', um, { von: 30, bis: 40 });
    await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), zweiter);

    // Ohne Strecke sagt die Leiste, wie man eine bekommt.
    await karrenWaehlen(anna, karren.i);
    const strecke = anna.locator('#strecke');
    await expect(strecke).toBeInViewport();
    await expect(strecke).toContainText('Rechtsklick auf einen anderen Markt');

    // Der Rechtsklick mit der Maus, auf die Mitte des zweiten Marktes.
    const punkt = await anna.evaluate((g) => {
      const a = window.ansicht;
      const m = a.gebaeudeMitte(a.gebaeude.get(g));
      a.kamera.zoom = 1.5;
      a.blickAuf(m.x, m.y);
      const r = a.leinwand.getBoundingClientRect();
      const p = a.zuBild(m.x, m.y);
      return { x: r.left + p.x, y: r.top + p.y };
    }, zweiter);
    await anna.mouse.click(punkt.x, punkt.y, { button: 'right' });
    expect(await anna.evaluate(() => window.ansicht.zielzeichen?.feindlich), 'Handel ist kein Angriff').toBe(false);
    await expect(strecke).toContainText('Handelt zwischen zwei eigenen Märkten');
    await expect(strecke).toContainText('Gold je Fahrt');
    const [heimat, ziel, gold] = await anna.evaluate((e) => window.ansicht.nachher.get(e).hd, karren.i);
    expect(ziel).toBe(zweiter);
    expect(heimat).not.toBe(zweiter);
    expect(gold, 'eine Strecke von dreissig Feldern und mehr').toBeGreaterThan(10);

    // Am Ziel geladen: auf dem Heimweg sagt die Leiste, was er bringt.
    const vorher = await anna.evaluate(() => window.ansicht.vorraete.gold);
    await zeitraffer(anna, code, 10);
    await anna.waitForFunction((e) => window.ansicht.nachher.get(e)?.l > 0, karren.i, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);
    await karrenWaehlen(anna, karren.i);
    await expect(strecke).toContainText(`bringt ${gold} Gold heim`);
    expect(await anna.evaluate(() => window.ansicht.vorraete.gold), 'unterwegs ist es noch nicht ihres').toBe(vorher);

    expect(await bedienteileFrei(anna)).toEqual([]);
    expect(await figurenFrei(anna)).toEqual([]);
    await anna.waitForTimeout(150);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-40',
      titel: 'Annas Marktkarren auf dem Heimweg vom zweiten eigenen Markt: die Leiste nennt die Strecke und das Gold, das er heimbringt',
      test: info,
    });

    // Daheim gehoert es ihr.
    await zeitraffer(anna, code, 10);
    await anna.waitForFunction(([v, g]) => window.ansicht.vorraete.gold >= v + g, [vorher, gold], { timeout: 60_000 });
    await zeitraffer(anna, code, 1);
  });
});
