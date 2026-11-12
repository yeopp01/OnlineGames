// Auswahl mit der Maus erweitern (→ specs/10-strategie/bedienung.md AC-3,
// AC-4): mit Umschalt kommt zur Auswahl hinzu, statt sie zu ersetzen; ein
// Doppelklick waehlt alle eigenen Einheiten derselben Art, die im Bild stehen.
// Die Zeit steht still, damit niemand zwischen Messen und Klicken weitergeht.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test, zeitraffer } from '../helpers/seite.mjs';
import { eigeneImBild, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Auswahl mit der Maus', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
    const { anna, code } = partie;
    const lage = await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      // Zur Kartenmitte hin, damit die fernen Milizen auf der Karte stehen.
      const zurMitte = (wert) => Math.sign(a.karte.groesse / 2 - wert) || 1;
      return { b, fern: { x: b.x + zurMitte(b.x) * 22, y: b.y + zurMitte(b.y) * 22 } };
    });
    // Drei Milizen neben dem Dorf, zwei weit davon - die stehen nicht im Bild.
    expect(await einheitenAufstellen(anna, code, 'Anna', 3, { art: 'miliz', x: lage.b.x + 5, y: lage.b.y + 5 })).toBe(3);
    expect(await einheitenAufstellen(anna, code, 'Anna', 2, { art: 'miliz', x: lage.fern.x, y: lage.fern.y })).toBe(2);
    await anna.waitForFunction(() => [...window.ansicht.nachher.values()].filter((e) => e.b === window.ansicht.ich && e.k === 'm').length === 5);
    await zeitraffer(anna, code, 0);
    await anna.evaluate((b) => {
      const a = window.ansicht;
      a.kamera.zoom = 1.6;
      a.blickAuf(b.x + 3, b.y + 3);
    }, lage.b);
    await anna.waitForTimeout(200);
  });
  test.afterAll(() => partieBeenden(partie));

  // Die Lebenden aus der Hilfe, hier mit dem Klickpunkt als x/y und dem
  // Fusspunkt als `fuss` - der Rahmen misst am Fuss, der Klick an der Mitte.
  const eigene = async (page) => (await eigeneImBild(page)).filter((e) => !e.s)
    .map((e) => ({ i: e.id, k: e.k, ...e.klick, fuss: { x: e.x, y: e.y }, imBild: e.imBild }));
  const gewaehlt = (page) => page.evaluate(() => ({
    ids: [...window.ansicht.ausgewaehlt].sort((x, y) => x - y),
    gebaeude: window.ansicht.gewaehltesGebaeude,
  }));
  const sortiert = (liste) => liste.map((e) => e.i).sort((x, y) => x - y);

  test('bedienung AC-3: mit Umschalt kommen Klick und Rahmen zur Auswahl hinzu, ein Gebaeude ersetzt sie nicht', async ({}, info) => {
    const { anna } = partie;
    const alle = await eigene(anna);
    const dorf = alle.filter((e) => e.k === 'd' && e.imBild);
    const milizen = alle.filter((e) => e.k === 'm' && e.imBild);
    expect(dorf.length, 'drei Dorfbewohner im Bild').toBe(3);
    expect(milizen.length, 'drei Milizen im Bild').toBe(3);

    // Ein Klick ersetzt, wie bisher.
    await anna.mouse.click(dorf[0].x, dorf[0].y);
    expect((await gewaehlt(anna)).ids).toEqual([dorf[0].i]);
    // Mit Umschalt: der zweite kommt dazu.
    await anna.keyboard.down('Shift');
    await anna.mouse.click(dorf[1].x, dorf[1].y);
    expect((await gewaehlt(anna)).ids).toEqual(sortiert([dorf[0], dorf[1]]));
    // Mit Umschalt ein Rahmen um die Milizen - und nur um sie.
    const xs = milizen.map((e) => e.fuss.x);
    const ys = milizen.map((e) => e.fuss.y);
    const rahmen = { x0: Math.min(...xs) - 25, y0: Math.min(...ys) - 45, x1: Math.max(...xs) + 25, y1: Math.max(...ys) + 15 };
    const imRahmen = alle.filter((e) => e.fuss.x >= rahmen.x0 && e.fuss.x <= rahmen.x1 && e.fuss.y >= rahmen.y0 && e.fuss.y <= rahmen.y1);
    expect(sortiert(imRahmen), 'im Rahmen stehen nur die Milizen').toEqual(sortiert(milizen));
    await anna.mouse.move(rahmen.x0, rahmen.y0);
    await anna.mouse.down();
    await anna.mouse.move(rahmen.x1, rahmen.y1, { steps: 8 });
    await anna.mouse.up();
    const fuenf = sortiert([dorf[0], dorf[1], ...milizen]);
    expect((await gewaehlt(anna)).ids).toEqual(fuenf);
    // Mit Umschalt auf das Dorfzentrum: die Einheiten bleiben, kein Gebaeude dazu.
    const zentrum = await anna.evaluate(() => {
      const a = window.ansicht;
      const z = [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'dorfzentrum');
      const m = a.gebaeudeMitte(z);
      return a.zuBild(m.x, m.y);
    });
    await anna.mouse.click(zentrum.x, zentrum.y - 20);
    await anna.keyboard.up('Shift');
    expect(await gewaehlt(anna)).toEqual({ ids: fuenf, gebaeude: null });
    await expect(anna.locator('.auswahl-kopf')).toHaveText('5 ausgewählt');
    await anna.mouse.move(40, 300);
    await anna.waitForTimeout(200);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-3',
      titel: 'Mit Umschalt erweitert: zwei Dorfbewohner per Klick und drei Milizen per Rahmen zusammen gewaehlt, unten 5 ausgewaehlt',
      test: info,
    });

    // Ohne Umschalt ersetzt ein Klick wieder.
    await anna.mouse.click(dorf[2].x, dorf[2].y);
    expect((await gewaehlt(anna)).ids).toEqual([dorf[2].i]);
  });

  test('bedienung AC-4: ein Doppelklick waehlt alle Einheiten der Art im Bild, mit Umschalt kommen sie dazu', async ({}, info) => {
    const { anna } = partie;
    const alle = await eigene(anna);
    const milizenImBild = alle.filter((e) => e.k === 'm' && e.imBild);
    const milizenFern = alle.filter((e) => e.k === 'm' && !e.imBild);
    const dorf = alle.filter((e) => e.k === 'd' && e.imBild);
    expect(milizenImBild.length).toBe(3);
    expect(milizenFern.length, 'zwei Milizen ausserhalb des Bildes').toBe(2);

    await anna.mouse.dblclick(milizenImBild[1].x, milizenImBild[1].y);
    expect(await gewaehlt(anna)).toEqual({ ids: sortiert(milizenImBild), gebaeude: null });
    await expect(anna.locator('.auswahl-kopf')).toHaveText('3 ausgewählt');
    await anna.mouse.move(40, 300);
    await anna.waitForTimeout(200);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-4',
      titel: 'Doppelklick auf eine Miliz: die drei Milizen im Bild gewaehlt, die Dorfbewohner daneben nicht',
      test: info,
    });

    // Mit Umschalt ein Doppelklick auf einen Dorfbewohner: alle drei dazu.
    await anna.keyboard.down('Shift');
    await anna.mouse.dblclick(dorf[0].x, dorf[0].y);
    await anna.keyboard.up('Shift');
    expect((await gewaehlt(anna)).ids).toEqual(sortiert([...milizenImBild, ...dorf]));
  });
});
