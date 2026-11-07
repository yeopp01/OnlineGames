// Das Zeichen am Ziel eines Befehls (→ specs/10-strategie/bedienung.md AC-34):
// ein Rechtsklick auf Feindliches zeigt kurz ein rotes Zeichen, einer auf
// freies Gelaende ein weisses. Es steht sofort, ohne auf den Server zu warten -
// deshalb entscheidet der Browser dieselbe Frage noch einmal, die der Server
// beim Befehl entscheidet. Genau das wird hier geprueft: beide Faelle am
// selben Bild, und dass das Zeichen von selbst wieder verschwindet.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test } from '../helpers/seite.mjs';
import { bedienteileFrei, figurenFrei, freieWiesen, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Befehlszeichen', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let meine;
  let feind;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
    const { anna, code } = partie;
    const [wiese] = await freieWiesen(anna, 1);
    // Zwei Milizen Annas, eine Berts vier Felder weiter - nah genug, dass
    // beide Ziele in ein Bild passen, weit genug fuer zwei getrennte Klicks.
    expect(await einheitenAufstellen(anna, code, 'Anna', 2, { art: 'miliz', x: wiese.x - 2, y: wiese.y - 2 })).toBe(2);
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'miliz', x: wiese.x + 2, y: wiese.y + 2 })).toBe(1);
    await anna.waitForFunction(() => [...window.ansicht.nachher.values()].filter((e) => e.k === 'm').length >= 3);
    const alle = await anna.evaluate(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].filter((e) => e.k === 'm')
        .map((e) => ({ i: e.i, eigen: e.b === a.ich, x: e.x, y: e.y }));
    });
    meine = alle.filter((e) => e.eigen);
    [feind] = alle.filter((e) => !e.eigen);
    expect(meine.length).toBe(2);
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-34: ein Rechtsklick auf Feindliches zeigt ein rotes Zeichen, einer auf freies Gelaende ein weisses', async ({}, info) => {
    const { anna } = partie;

    // Auswaehlen und auf das Gefecht blicken.
    const bild = await anna.evaluate(([ids, ziel]) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set(ids);
      a.beiAuswahl();
      a.kamera.zoom = 2.4;
      a.blickAuf((a.nachher.get(ids[0]).x + ziel.x) / 2, (a.nachher.get(ids[0]).y + ziel.y) / 2);
      return { feind: a.zuBild(ziel.x, ziel.y), ich: a.zuBild(a.nachher.get(ids[0]).x, a.nachher.get(ids[0]).y) };
    }, [meine.map((e) => e.i), feind]);

    // 1. Freies Gelaende: das Zeichen ist weiss und liegt auf dem geklickten
    // Feld. Geklickt wird deutlich neben alles, was steht.
    const leer = { x: bild.ich.x - 150, y: bild.ich.y + 40 };
    await anna.mouse.click(leer.x, leer.y, { button: 'right' });
    const weiss = await anna.evaluate(([px, py]) => {
      const a = window.ansicht;
      const welt = a.zuWelt(px, py);
      return { zeichen: a.zielzeichen && { ...a.zielzeichen }, feld: { x: Math.round(welt.x), y: Math.round(welt.y) } };
    }, [leer.x, leer.y]);
    expect(weiss.zeichen, 'ein Zeichen steht').toBeTruthy();
    expect(weiss.zeichen.feindlich, 'freies Gelaende ist nicht feindlich').toBe(false);
    expect(weiss.zeichen.x, 'auf dem geklickten Feld').toBe(weiss.feld.x);
    expect(weiss.zeichen.y).toBe(weiss.feld.y);

    // 2. Dieselbe Geste auf die fremde Miliz: rot, und am Ziel - nicht auf dem
    // gerundeten Feld, sondern da, wo die Einheit wirklich steht.
    await anna.mouse.click(bild.feind.x, bild.feind.y, { button: 'right' });
    const rot = await anna.evaluate(() => {
      const a = window.ansicht;
      return a.zielzeichen && { ...a.zielzeichen };
    });
    expect(rot, 'ein Zeichen steht').toBeTruthy();
    expect(rot.feindlich, 'die fremde Miliz ist feindlich').toBe(true);
    expect(Math.hypot(rot.x - feind.x, rot.y - feind.y), 'am Ziel').toBeLessThan(1.5);

    // 3. Es haelt den Augenblick an: ein Beginn in der Zukunft friert das
    // erste Bild ein, damit der Nachweis nicht gegen die Uhr laeuft. Ohne das
    // waere das Zeichen nach 800 ms fort - und ein Screenshot dauert laenger.
    await anna.evaluate(() => {
      window.ansicht.zielzeichen.seit = performance.now() + 60_000;
    });
    const lage = await anna.evaluate(() => {
      const a = window.ansicht;
      const p = a.zuBild(a.zielzeichen.x, a.zielzeichen.y);
      return { p, feld: { b: a.leinwand.clientWidth, h: a.leinwand.clientHeight } };
    });
    expect(lage.p.x, 'das Zeichen liegt im Bild').toBeGreaterThan(60);
    expect(lage.p.x).toBeLessThan(lage.feld.b - 60);
    expect(lage.p.y).toBeGreaterThan(80);
    expect(lage.p.y).toBeLessThan(lage.feld.h - 240);
    expect(await bedienteileFrei(anna)).toEqual([]);
    expect(await figurenFrei(anna)).toEqual([]);

    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-34',
      titel: 'Der Rechtsklick auf Berts Miliz (rot) zeigt ein rotes Zeichen mit vier Haken am Ziel — auf freies Gelände wäre es ein weißer Ring',
      test: info,
    });

    // 4. Und es verschwindet von selbst: ein Beginn weit in der Vergangenheit
    // ist dasselbe wie abgelaufene Zeit.
    await anna.evaluate(() => {
      window.ansicht.zielzeichen.seit = performance.now() - 5_000;
    });
    await expect.poll(() => anna.evaluate(() => window.ansicht.zielzeichen)).toBe(null);
  });
});
