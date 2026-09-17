// Auswahl und Leben im Spielbild (→ specs/10-strategie/darstellung.md AC-8).
//
// Was gewaehlt ist, traegt eine Ellipse am Boden und darueber einen
// Lebensbalken; Gebaeude zeigen ihren Balken auch ungewaehlt, sobald sie
// beschaedigt sind. Die Ansicht legt jeden gemalten Balken in
// `ansicht.lebensbalken` ab - daran zaehlt der Test, das Bild zeigt es.
// Schaden setzt ein Pruefgriff, solange es keinen Kampf gibt.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, lebenSetzen, test } from '../helpers/seite.mjs';
import { dorfbewohnerAnklicken, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const DARSTELLUNG = '10-strategie/darstellung.md';

test.describe('Lebensbalken', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
    await partie.anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 2;
      a.blickAuf(b.x + 1, b.y + 1);
    });
  });
  test.afterAll(() => partieBeenden(partie));

  const balken = (page) => page.evaluate(() => window.ansicht.lebensbalken.map((b) => ({ ...b, anteil: Math.round(b.anteil * 100) / 100 })));

  test('darstellung AC-8: ein gewaehlter Dorfbewohner traegt die Ellipse und darueber seinen Lebensbalken', async ({}, info) => {
    const { anna, code } = partie;
    expect(await balken(anna), 'ohne Auswahl und ohne Schaden kein Balken').toEqual([]);
    const id = await dorfbewohnerAnklicken(anna);
    await expect.poll(() => balken(anna)).toHaveLength(1);
    const [voll] = await balken(anna);
    expect(voll).toMatchObject({ art: 'einheit', i: id, anteil: 1 });

    // Verwundet: 10 von 25 - der Balken zeigt zwei Fuenftel.
    await lebenSetzen(anna, code, id, 10);
    await expect.poll(async () => (await balken(anna))[0]?.anteil).toBe(0.4);
    const lage = await anna.evaluate((id) => {
      const a = window.ansicht;
      const e = a.nachher.get(id);
      const fuss = a.zuBild(e.x, e.y);
      const b = a.lebensbalken[0];
      return { fussY: fuss.y, balkenY: b.y, kopfY: fuss.y - a.figurenHoehe(), x: fuss.x, balkenX: b.x, breite: b.breite };
    }, id);
    // Ueber dem Kopf, mittig ueber der Figur, und breit genug, um ihn zu sehen.
    expect(lage.balkenY).toBeLessThan(lage.kopfY);
    expect(lage.kopfY - lage.balkenY).toBeLessThan(20);
    expect(Math.abs(lage.balkenX - lage.x)).toBeLessThan(2);
    expect(lage.breite).toBeGreaterThanOrEqual(16);
    await nachweis(anna, {
      spec: DARSTELLUNG,
      ac: 'AC-8',
      titel: 'Ein Dorfbewohner gewaehlt: weisse Ellipse am Boden, ueber dem Kopf sein Lebensbalken, zwei Fuenftel gruen',
      test: info,
    });
  });

  test('darstellung AC-8: ein Gebaeude zeigt den Balken gewaehlt, und ungewaehlt erst, wenn es beschaedigt ist', async ({}, info) => {
    const { anna, code } = partie;
    const zentrum = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = [...a.gebaeude.values()].find((x) => x.b === a.ich && x.art === 'dorfzentrum');
      const m = a.gebaeudeMitte(g);
      const p = a.zuBild(m.x, m.y);
      return { i: g.i, x: p.x, y: p.y };
    });
    // Aufs Dach geklickt: gewaehlt, ein Balken ueber dem Gebaeude, voll.
    await anna.mouse.click(zentrum.x, zentrum.y - 110);
    await expect.poll(() => anna.evaluate(() => window.ansicht.gewaehltesGebaeude)).toBe(zentrum.i);
    await expect.poll(() => balken(anna)).toEqual([expect.objectContaining({ art: 'gebaeude', i: zentrum.i, anteil: 1 })]);

    // Abgewaehlt und unbeschaedigt: kein Balken.
    await anna.keyboard.press('Escape');
    await expect.poll(() => balken(anna)).toEqual([]);

    // Beschaedigt auf 600 von 2400: der Balken erscheint ohne Auswahl, ein Viertel, rot.
    await lebenSetzen(anna, code, zentrum.i, 600);
    await expect.poll(() => balken(anna)).toEqual([expect.objectContaining({ art: 'gebaeude', i: zentrum.i, anteil: 0.25 })]);
    const [b] = await balken(anna);
    // Ueber dem Dach, nicht auf den Figuren davor.
    expect(b.y).toBeLessThan(zentrum.y - 100);
    expect(b.y).toBeGreaterThan(60);
    await nachweis(anna, {
      spec: DARSTELLUNG,
      ac: 'AC-8',
      titel: 'Nichts gewaehlt, das Dorfzentrum beschaedigt: ueber dem Dach ein Balken, ein Viertel rot',
      test: info,
    });
  });
});
