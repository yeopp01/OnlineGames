// Auswahl merken (→ specs/10-strategie/bedienung.md AC-5): Strg oder Alt mit
// einer Ziffer legt die Auswahl ab, die Ziffer allein holt sie zurueck - die
// Einheiten, sonst das gewaehlte Gebaeude. Wer seither gefallen ist, faellt
// heraus. Gedrueckt wird mit der Tastatur; nur das Aufstellen fuer den zweiten
// Fall setzt die Auswahl von Hand.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test, zeitraffer } from '../helpers/seite.mjs';
import { freieWiesen, partieBeenden, partieZuZweit, rahmenUmAlle } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Gruppentasten', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel: aufgedeckt, damit Berts Miliz im zweiten Fall
    // in Annas Bild steht.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
    await partie.anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 1.6;
      a.blickAuf(b.x + 4, b.y + 4);
    });
    await partie.anna.waitForTimeout(200);
  });
  test.afterAll(() => partieBeenden(partie));

  const lage = (page) => page.evaluate(() => {
    const a = window.ansicht;
    return { ids: [...a.ausgewaehlt].sort((x, y) => x - y), gebaeude: a.gewaehltesGebaeude };
  });

  test('bedienung AC-5: Strg und Alt mit Ziffer legen die Auswahl ab, die Ziffer holt sie zurueck - Einheiten wie ein Gebaeude', async ({}, info) => {
    const { anna } = partie;
    // Alle vier im Rahmen, abgelegt unter 1.
    await rahmenUmAlle(anna);
    await expect.poll(() => anna.evaluate(() => window.ansicht.ausgewaehlt.size)).toBe(4);
    const alle = await lage(anna);
    await anna.keyboard.press('Control+1');
    // Ein einzelner Dorfbewohner unter 2 - mit Alt, dem Ausweg neben Strg.
    await anna.keyboard.press('.');
    const einer = await lage(anna);
    expect(einer.ids).toHaveLength(1);
    await anna.keyboard.press('Alt+2');
    // Das Dorfzentrum unter 3.
    await anna.keyboard.press('h');
    const zentrum = (await lage(anna)).gebaeude;
    expect(zentrum).not.toBeNull();
    await anna.keyboard.press('Control+3');
    await anna.keyboard.press('Escape');
    expect((await lage(anna)).ids, 'nach Esc ist nichts gewaehlt').toHaveLength(0);

    // Zurueckholen, durcheinander: jede Ziffer bringt ihre Auswahl.
    await anna.keyboard.press('2');
    expect(await lage(anna)).toEqual({ ids: einer.ids, gebaeude: null });
    await anna.keyboard.press('3');
    expect(await lage(anna)).toEqual({ ids: [], gebaeude: zentrum });
    // Eine Ziffer ohne Ablage aendert nichts.
    await anna.keyboard.press('7');
    expect(await lage(anna)).toEqual({ ids: [], gebaeude: zentrum });
    await anna.keyboard.press('1');
    expect(await lage(anna)).toEqual({ ids: alle.ids, gebaeude: null });
    // Die Leiste folgt: vier ausgewaehlt.
    await expect(anna.locator('.auswahl-kopf')).toHaveText('4 ausgewählt');
    await anna.waitForTimeout(200);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-5',
      titel: 'Taste 1 holt die unter Strg+1 abgelegte Gruppe zurueck: alle vier gewaehlt, unten 4 ausgewaehlt',
      test: info,
    });
  });

  test('bedienung AC-5: wer gefallen ist, faellt beim Zurueckholen heraus, die anderen bleiben gewaehlt', async ({}, info) => {
    const { anna, code } = partie;
    // Zwei Dorfbewohner Annas auf einer freien Wiese, drei Felder weiter eine
    // Miliz Berts, die von selbst angreift (kampf AC-2). Welchen sie zuerst
    // nimmt, sagt der Test nicht voraus - sie bleibt an ihm, bis er faellt.
    const [wiese] = await freieWiesen(anna, 1);
    expect(await einheitenAufstellen(anna, code, 'Anna', 2, { art: 'dorfbewohner', x: wiese.x, y: wiese.y })).toBe(2);
    const zwei = await anna.waitForFunction((w) => {
      const a = window.ansicht;
      const da = [...a.nachher.values()].filter((e) => e.b === a.ich && e.k === 'd' && Math.hypot(e.x - w.x, e.y - w.y) < 2.5);
      return da.length === 2 ? da.map((e) => e.i) : null;
    }, wiese).then((h) => h.jsonValue());
    // Abgelegt unter 5, ehe Bert kommt.
    await anna.evaluate((ids) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set(ids);
      a.beiAuswahl();
      a.blickAuf(a.nachher.get(ids[0]).x, a.nachher.get(ids[0]).y);
    }, zwei);
    await anna.keyboard.press('Control+5');
    await anna.keyboard.press('Escape');
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'miliz', x: wiese.x + 3, y: wiese.y })).toBe(1);

    // Der erste faellt nach sieben Schlaegen (25 Leben, 4 je Schlag); dann
    // angehalten, damit der zweite nicht auch faellt, waehrend die Taste kommt.
    const gefallen = await anna.waitForFunction((ids) => {
      const tot = ids.filter((id) => {
        const e = window.ansicht.nachher.get(id);
        return !e || e.s;
      });
      return tot.length ? tot : null;
    }, zwei, { timeout: 60_000 }).then((h) => h.jsonValue());
    await zeitraffer(anna, code, 0);
    expect(gefallen, 'genau einer gefallen').toHaveLength(1);
    const lebend = zwei.filter((id) => id !== gefallen[0]);
    await anna.keyboard.press('5');
    expect((await lage(anna)).ids, 'nur der Lebende').toEqual(lebend);
    // Auch die Ablage selbst: aus der Auswahl nimmt die Ansicht Gefallene mit
    // dem naechsten Zustand ohnehin (kampf AC-10) - die Gegenprobe ohne den
    // Filter war bis hierher gruen. Die Gruppe behielte ihn aber.
    expect(await anna.evaluate(() => window.ansicht.gruppen.get(5).einheiten), 'aus der Gruppe gestrichen').toEqual(lebend);
    await expect(anna.locator('#auswahlleiste')).toContainText('Dorfbewohner');
    await anna.waitForTimeout(200);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-5',
      titel: 'Taste 5 nach dem Fall des einen: nur der Lebende ist gewaehlt, der Gefallene liegt daneben',
      test: info,
    });
    await zeitraffer(anna, code, 1);
  });
});
