// Ziele hintereinander mit Umschalt (→ specs/10-strategie/bedienung.md AC-14):
// ein Rechtsklick schickt los, jeder weitere mit Umschalt haengt ein Ziel
// hinten an. Im Bild verbindet eine gestrichelte Linie das laufende Ziel mit
// den wartenden, und an jedem wartenden steht ein Ring - solange es wartet.
//
// Die Zeit steht still, waehrend geklickt wird: sonst ist der Dorfbewohner am
// ersten Ziel, bevor das zweite ankommt, und Umschalt ist dann ein
// gewoehnlicher Gang (wer steht, geht gleich los).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test, zeitraffer } from '../helpers/seite.mjs';
import { dorfbewohnerAnklicken, partieBeenden, partieZuZweit, platzImBild } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Warteschlange', () => {
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-14: mit Umschalt haengt ein Rechtsklick ein Ziel an, die Linie zeigt die Reihe, und der Dorfbewohner geht sie der Reihe nach ab', async ({}, info) => {
    const { anna, code } = partie;
    await dorfbewohnerAnklicken(anna);
    const id = await anna.evaluate(() => [...window.ansicht.ausgewaehlt][0]);
    await zeitraffer(anna, code, 0);
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const ziele = [
      await platzImBild(anna, { n: 1, um: basis, abstand: 6, seitlich: true }),
      await platzImBild(anna, { n: 1, um: basis, abstand: 6 }),
    ];
    ziele.push(await platzImBild(anna, { n: 1, um: ziele[1], abstand: 4, seitlich: true }));
    for (let i = 0; i < 3; i++) {
      expect(ziele[i], `Ziel ${i + 1} im Bild`).toBeTruthy();
      for (let j = 0; j < i; j++) {
        expect(Math.hypot(ziele[i].x - ziele[j].x, ziele[i].y - ziele[j].y), `Ziel ${j + 1} und ${i + 1} auseinander`).toBeGreaterThanOrEqual(3);
      }
    }

    // Losschicken, dann zweimal mit Umschalt anhaengen.
    await anna.mouse.click(ziele[0].bild.x, ziele[0].bild.y, { button: 'right' });
    await anna.keyboard.down('Shift');
    await anna.mouse.click(ziele[1].bild.x, ziele[1].bild.y, { button: 'right' });
    await anna.mouse.click(ziele[2].bild.x, ziele[2].bild.y, { button: 'right' });
    await anna.keyboard.up('Shift');
    // Der Server sagt: zwei warten.
    await anna.waitForFunction((i) => window.ansicht.nachher.get(i)?.q === 2, id);
    // Und der Browser kennt die Punkte - in der geklickten Reihenfolge.
    expect(await anna.evaluate((i) => window.ansicht.wegpunkte.get(i).slice(-3), id))
      .toEqual(ziele.map(({ x, y }) => ({ x, y })));
    // Der weisse Ring des Klicks verblasst; danach steht nur die Reihe.
    await anna.waitForFunction(() => window.ansicht.zielzeichen === null);
    await anna.waitForTimeout(100);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-14',
      titel: 'Umschalt und Rechtsklick - zwei Ziele haengen hinter dem ersten, gestrichelt verbunden, jedes wartende mit Ring',
      test: info,
    });

    // Laufen lassen: erst das erste Ziel, dann das zweite, dann das dritte.
    await zeitraffer(anna, code, 4);
    for (const [n, z] of ziele.entries()) {
      await anna.waitForFunction(([i, x, y]) => {
        const e = window.ansicht.nachher.get(i);
        return e && Math.hypot(e.x - x, e.y - y) < 1.2;
      }, [id, z.x, z.y], { timeout: 60_000 });
      // Am ersten Ziel warten noch zwei weniger als vorher - am letzten keines.
      const q = await anna.evaluate((i) => window.ansicht.nachher.get(i).q ?? 0, id);
      expect(q, `am Ziel ${n + 1}`).toBeLessThanOrEqual(2 - n);
    }
    await expect.poll(() => anna.evaluate((i) => window.ansicht.nachher.get(i).q ?? 0, id)).toBe(0);
    await zeitraffer(anna, code, 1);
  });

  test('bedienung AC-14: ohne Umschalt ersetzt der zweite Rechtsklick den ersten - nichts wartet', async () => {
    const { anna, code } = partie;
    await dorfbewohnerAnklicken(anna);
    const id = await anna.evaluate(() => [...window.ansicht.ausgewaehlt][0]);
    await zeitraffer(anna, code, 0);
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const a = await platzImBild(anna, { n: 1, um: basis, abstand: 5, seitlich: true });
    const b = await platzImBild(anna, { n: 1, um: basis, abstand: 5 });
    await anna.mouse.click(a.bild.x, a.bild.y, { button: 'right' });
    await anna.mouse.click(b.bild.x, b.bild.y, { button: 'right' });
    await zeitraffer(anna, code, 1);
    await anna.waitForTimeout(500);
    expect(await anna.evaluate((i) => window.ansicht.nachher.get(i).q, id)).toBeUndefined();
    expect(await anna.evaluate((i) => window.ansicht.wegpunkte.get(i), id)).toEqual([{ x: b.x, y: b.y }]);
  });

  // Der Server nimmt hoechstens zwanzig wartende Ziele an und verwirft, was
  // darueber kommt. Der Browser darf dann nicht die aeltesten vergessen und
  // die verworfenen zeigen (Durchsicht nach Runde 191).
  test('bedienung AC-14: ueber zwanzig wartende Ziele hinaus nimmt auch der Browser keines an', async () => {
    const { anna, code } = partie;
    await dorfbewohnerAnklicken(anna);
    const id = await anna.evaluate(() => [...window.ansicht.ausgewaehlt][0]);
    await zeitraffer(anna, code, 0);
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const a = await platzImBild(anna, { n: 1, um: basis, abstand: 6, seitlich: true });
    const b = await platzImBild(anna, { n: 1, um: basis, abstand: 6 });
    await anna.mouse.click(a.bild.x, a.bild.y, { button: 'right' });
    await anna.keyboard.down('Shift');
    for (let n = 0; n < 25; n++) {
      const z = n % 2 ? a : b;
      await anna.mouse.click(z.bild.x, z.bild.y, { button: 'right' });
    }
    await anna.keyboard.up('Shift');
    await anna.waitForFunction((i) => window.ansicht.nachher.get(i)?.q === 20, id);
    const liste = await anna.evaluate((i) => window.ansicht.wegpunkte.get(i), id);
    expect(liste.length).toBe(21);
    // Das laufende Ziel ist noch das erste - nichts vorn vergessen.
    expect(liste[0]).toEqual({ x: a.x, y: a.y });
    await zeitraffer(anna, code, 1);
  });
});
