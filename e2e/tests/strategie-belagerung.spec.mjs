// Belagerung (→ specs/10-strategie/einheiten-und-befehle.md AC-35): die Ramme
// greift nur Gebaeude an. Ein Rechtsklick auf eine fremde Einheit ist fuer sie
// ein Gang dorthin (das Zeichen bleibt weiss), einer auf ein fremdes Gebaeude
// ein Angriff (rot), und sie stoesst es mit 127 je Schlag ein. Die Regeln
// selbst prueft tests/strategie-belagerung.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, gebaeudeAufstellen, test, zeitraffer } from '../helpers/seite.mjs';
import {
  bedienteileFrei, figurenFrei, freieWiesen, partieBeenden, partieZuZweit,
} from '../helpers/strategie.mjs';

const EINHEITEN = '10-strategie/einheiten-und-befehle.md';

test.describe('Belagerung', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  // Ein Feld der Karte als Punkt auf der Seite.
  const aufSeite = (page, feld) => page.evaluate((f) => {
    const a = window.ansicht;
    const p = a.zuBild(f.x, f.y);
    const r = a.leinwand.getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y };
  }, feld);

  test('einheiten AC-35: die Ramme geht zu einer fremden Einheit nur hin und stoesst ein fremdes Haus ein', async ({}, info) => {
    const { anna, code } = partie;
    const [wiese] = await freieWiesen(anna, 1);
    const kuerzel = await anna.evaluate(() => window.ansicht.werte.einheiten.ramme.kuerzel);

    // Berts Haus mitten auf der Wiese, sein Dorfbewohner drei Felder darunter,
    // Annas Ramme links davon. Der Dorfbewohner wacht nicht und laeuft nicht
    // weg - Bert spielt nicht.
    const hausId = await gebaeudeAufstellen(anna, code, 'Bert', 'haus', wiese.x + 1, wiese.y);
    await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'dorfbewohner', x: wiese.x - 1, y: wiese.y + 3 });
    await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'ramme', x: wiese.x - 4, y: wiese.y });
    await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), hausId);
    const { ramme, bauer } = await anna.waitForFunction(([k, w]) => {
      const a = window.ansicht;
      const nahe = (e) => Math.hypot(e.x - w.x, e.y - w.y) < 7;
      const ramme = [...a.nachher.values()].find((e) => e.k === k && e.b === a.ich && nahe(e));
      const bauer = [...a.nachher.values()].find((e) => e.k === 'd' && e.b !== a.ich && nahe(e));
      return ramme && bauer && { ramme: { i: ramme.i }, bauer: { x: bauer.x, y: bauer.y } };
    }, [kuerzel, wiese]).then((h) => h.jsonValue());

    await anna.evaluate(([id, w]) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set([id]);
      a.beiAuswahl();
      a.kamera.zoom = 2.2;
      a.blickAuf(w.x, w.y + 1);
    }, [ramme.i, wiese]);

    // 1. Rechtsklick auf Berts Dorfbewohner: fuer jeden anderen Kaempfer ein
    // Angriff mit rotem Zeichen (bedienung AC-34), fuer die Ramme ein Gang -
    // das Zeichen ist weiss.
    const aufBauer = await aufSeite(anna, bauer);
    await anna.mouse.click(aufBauer.x, aufBauer.y, { button: 'right' });
    const zeichen = await anna.evaluate(() => window.ansicht.zielzeichen && { ...window.ansicht.zielzeichen });
    expect(zeichen, 'ein Zeichen steht').toBeTruthy();
    expect(zeichen.feindlich, 'eine Einheit ist fuer die Ramme kein Ziel').toBe(false);

    // 2. Rechtsklick auf Berts Haus: rot, und sie stoesst zu.
    const mitte = await anna.evaluate((g) => window.ansicht.gebaeudeMitte(window.ansicht.gebaeude.get(g)), hausId);
    const aufHaus = await aufSeite(anna, mitte);
    await anna.mouse.click(aufHaus.x, aufHaus.y, { button: 'right' });
    expect(await anna.evaluate(() => window.ansicht.zielzeichen.feindlich), 'das Haus ist ein Ziel').toBe(true);
    const voll = await anna.evaluate((g) => window.ansicht.gebaeude.get(g).h, hausId);
    await zeitraffer(anna, code, 6);
    // Zwei Stoesse zu 127, dann die Welt anhalten - das Haus steht noch
    // (550 Leben), die Ramme liegt daran.
    await expect.poll(() => anna.evaluate((g) => window.ansicht.gebaeude.get(g)?.h, hausId), { timeout: 60_000 })
      .toBeLessThanOrEqual(voll - 2 * 127);
    await zeitraffer(anna, code, 0);
    const verlust = voll - await anna.evaluate((g) => window.ansicht.gebaeude.get(g).h, hausId);
    expect(verlust % 127, `je Stoss 127, verloren ${verlust}`).toBe(0);

    // Die Ramme steht am Haus, im Bild, und nichts verdeckt sie.
    const lage = await anna.evaluate(([id, g]) => {
      const a = window.ansicht;
      const e = a.nachher.get(id);
      const haus = a.gebaeudeMitte(a.gebaeude.get(g));
      a.blickAuf((e.x + haus.x) / 2, (e.y + haus.y) / 2 + 1);
      const p = a.zuBild(e.x, e.y);
      return { abstand: Math.hypot(e.x - haus.x, e.y - haus.y), p, b: a.leinwand.clientWidth, h: a.leinwand.clientHeight };
    }, [ramme.i, hausId]);
    expect(lage.abstand, 'am Haus').toBeLessThan(2.6);
    expect(lage.p.x).toBeGreaterThan(80);
    expect(lage.p.x).toBeLessThan(lage.b - 80);
    expect(lage.p.y).toBeGreaterThan(120);
    expect(lage.p.y).toBeLessThan(lage.h - 240);
    expect(await bedienteileFrei(anna)).toEqual([]);
    expect(await figurenFrei(anna)).toEqual([]);

    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-35',
      titel: 'Annas Ramme (blau) steht an Berts Haus (rot) und stößt es ein — sein Lebensbalken ist schon kürzer; Berts Dorfbewohner daneben lässt sie stehen',
      test: info,
    });
  });
});
