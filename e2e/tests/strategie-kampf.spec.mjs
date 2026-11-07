// Der Kampf im Bild (→ specs/10-strategie/kampf.md AC-1 und AC-10): ein
// Rechtsklick auf eine fremde Einheit laesst die eigenen hinlaufen und
// zuschlagen; wer fallt, liegt zwei Sekunden am Boden. Die Regeln dahinter -
// Schaden, Nachladezeit, kein Zufall - stehen in tests/strategie-kampf.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const KAMPF = '10-strategie/kampf.md';

/** Die Nummern aller Milizen, die diese Seite sieht - eigene und fremde. */
const milizen = (page) => page.evaluate(() => {
  const a = window.ansicht;
  return [...a.nachher.values()].filter((e) => e.k === 'm')
    .map((e) => ({ i: e.i, eigen: e.b === a.ich, x: e.x, y: e.y }));
});

test.describe('Kampf', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let feind;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
    const { anna, code } = partie;
    // Eine freie Wiese neben der Basis: auf Stein oder Wald sieht man die
    // Figuren zwar, aber das Bild erzaehlt dann vom Steinbruch (Runde 63).
    const wiese = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const b = a.spieler.get(a.ich).basis;
      const grasUm = (x, y, r) => {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (a.karte.felder[(y + dy) * g + (x + dx)] !== 0) return false;
          }
        }
        return true;
      };
      for (let r = 7; r < 18; r++) {
        for (const [sx, sy] of [[1, 1], [1, 0], [0, 1], [1, -1], [-1, 1]]) {
          const x = b.x + r * sx;
          const y = b.y + r * sy;
          if (x > 5 && y > 5 && x < g - 6 && y < g - 6 && grasUm(x, y, 5)) return { x, y };
        }
      }
      throw new Error('keine freie Wiese gefunden');
    });
    // Drei Milizen Annas, zwei Berts fuenf Felder weiter: weit genug, dass man
    // sie hinlaufen sieht, nah genug fuer ein Bild.
    expect(await einheitenAufstellen(anna, code, 'Anna', 3, { art: 'miliz', x: wiese.x - 2, y: wiese.y - 2 })).toBe(3);
    expect(await einheitenAufstellen(anna, code, 'Bert', 2, { art: 'miliz', x: wiese.x + 2, y: wiese.y + 2 })).toBe(2);
    await anna.waitForFunction(() => [...window.ansicht.nachher.values()].filter((e) => e.k === 'm').length >= 5);
  });
  test.afterAll(() => partieBeenden(partie));

  test('kampf AC-1: ein Rechtsklick auf eine fremde Einheit laesst die eigenen hinlaufen und zuschlagen', async ({}, info) => {
    const { anna, bert, code } = partie;
    const alle = await milizen(anna);
    const meine = alle.filter((e) => e.eigen);
    const fremde = alle.filter((e) => !e.eigen);
    expect(meine.length, 'drei eigene').toBe(3);
    expect(fremde.length, 'zwei fremde').toBe(2);
    feind = fremde[0].i;

    // Auswaehlen, dann der Rechtsklick auf die fremde Miliz - kein eigener
    // Knopf, keine eigene Betriebsart.
    const bild = await anna.evaluate(([ids, ziel]) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set(ids);
      a.beiAuswahl();
      a.kamera.zoom = 2.4;
      const e = a.nachher.get(ziel);
      a.blickAuf((a.nachher.get(ids[0]).x + e.x) / 2, (a.nachher.get(ids[0]).y + e.y) / 2);
      return a.zuBild(e.x, e.y);
    }, [meine.map((e) => e.i), feind]);
    await anna.mouse.click(bild.x, bild.y, { button: 'right' });

    // Sie laufen hin und schlagen zu: das Leben des Ziels faellt unter die
    // Haelfte. Vorher stand davon nichts im Zustand - voll wird nicht geschickt.
    await anna.waitForFunction((id) => {
      const e = window.ansicht.nachher.get(id);
      // 16 von 40: vier Schlaege einer Miliz, und sicher unter der Haelfte -
      // genau 20 waere "halb voll" und nicht weniger (Runde 63).
      return e && e.h > 0 && e.h <= 16;
    }, feind, { timeout: 60_000 });
    // Angehalten: so laesst sich der Augenblick in Ruhe ins Bild setzen.
    await zeitraffer(anna, code, 0);

    // Das Bild macht Bert: er sieht den Lebensbalken seiner Miliz, weil sie
    // ausgewaehlt ist (darstellung AC-8).
    const lage = await bert.evaluate((id) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set([id]);
      a.beiAuswahl();
      a.kamera.zoom = 2.6;
      const e = a.nachher.get(id);
      a.blickAuf(e.x, e.y);
      const nah = [...a.nachher.values()].filter((f) => f.b !== a.ich && f.k === 'm'
        && Math.hypot(f.x - e.x, f.y - e.y) <= 2.5);
      return {
        anteil: e.h / a.lebenVoll(e),
        nah: nah.length,
        punkte: [e, ...nah].map((f) => a.zuBild(f.x, f.y)),
        feld: { b: a.leinwand.clientWidth, h: a.leinwand.clientHeight },
      };
    }, feind);
    expect(lage.anteil, 'der Balken ist weniger als halb voll').toBeLessThan(0.5);
    expect(lage.anteil, 'aber sie lebt noch').toBeGreaterThan(0);
    expect(lage.nah, 'drei Angreifer stehen dicht dabei').toBe(3);
    for (const p of lage.punkte) {
      expect(p.x, 'im Bild').toBeGreaterThan(40);
      expect(p.x).toBeLessThan(lage.feld.b - 40);
      expect(p.y).toBeGreaterThan(60);
      expect(p.y).toBeLessThan(lage.feld.h - 220);
    }
    expect(await bedienteileFrei(bert)).toEqual([]);
    await bert.waitForTimeout(300);
    await nachweis(bert, {
      spec: KAMPF,
      ac: 'AC-1',
      titel: 'Berts Miliz (rot) wird von drei Milizen Annas (blau) umstellt und geschlagen — ihr Lebensbalken ist weniger als halb voll',
      test: info,
    });
  });

  test('kampf AC-10: wer fallt, liegt zwei Sekunden am Boden', async ({}, info) => {
    const { anna, bert, code } = partie;
    const bevVorher = await bert.evaluate(() => window.ansicht.vorraete.bev);
    await zeitraffer(anna, code, 1);
    await anna.waitForFunction((id) => window.ansicht.nachher.get(id)?.s === 1, feind, { timeout: 60_000 });
    // Anhalten, solange er liegt: im Spiel sind das zwei Sekunden.
    await zeitraffer(anna, code, 0);

    // Er zaehlt nicht mehr: nicht zur Bevoelkerung, nicht zur Auswahl.
    await bert.waitForFunction(() => window.ansicht.ausgewaehlt.size === 0, null, { timeout: 10_000 });
    expect(await bert.evaluate(() => window.ansicht.vorraete.bev), 'einer weniger').toBe(bevVorher - 1);

    const lage = await anna.evaluate((id) => {
      const a = window.ansicht;
      const e = a.nachher.get(id);
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set();
      a.beiAuswahl();
      a.kamera.zoom = 3;
      a.blickAuf(e.x, e.y);
      const lebende = [...a.nachher.values()].filter((f) => f.k === 'm' && !f.s);
      return {
        liegt: Boolean(e.s),
        tote: [...a.nachher.values()].filter((f) => f.s).length,
        meine: lebende.filter((f) => f.b === a.ich).length,
        punkt: a.zuBild(e.x, e.y),
        feld: { b: a.leinwand.clientWidth, h: a.leinwand.clientHeight },
      };
    }, feind);
    expect(lage.liegt, 'der Gefallene steht noch im Zustand').toBe(true);
    expect(lage.tote, 'genau einer liegt').toBe(1);
    expect(lage.meine, 'Annas drei Milizen stehen').toBe(3);
    expect(lage.punkt.x).toBeGreaterThan(40);
    expect(lage.punkt.x).toBeLessThan(lage.feld.b - 40);
    expect(lage.punkt.y).toBeGreaterThan(60);
    expect(lage.punkt.y).toBeLessThan(lage.feld.h - 220);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: KAMPF,
      ac: 'AC-10',
      titel: 'Berts Miliz ist gefallen: sie liegt umgekippt am Boden, zwei Sekunden lang, während Annas drei Milizen daneben stehen',
      test: info,
    });

    // Laeuft die Welt weiter, ist er nach zwei Sekunden weg.
    await zeitraffer(anna, code, 1);
    await anna.waitForFunction((id) => !window.ansicht.nachher.has(id), feind, { timeout: 15_000 });
  });
});
