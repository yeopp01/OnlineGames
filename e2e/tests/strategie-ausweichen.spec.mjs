// Keine zwei Einheiten uebereinander, im Browser gesehen
// (→ specs/10-strategie/einheiten-und-befehle.md AC-29).
//
// Vier Dorfbewohner werden **einzeln** auf dasselbe Feld geschickt - vier
// Klicks, wie ein Mensch es tut. Ein Befehl an alle vier haette sie schon immer
// nebeneinander gestellt (einheiten AC-20); getrennte Befehle wissen
// voneinander nichts, und bis Runde 89 standen sie danach auf einem Punkt.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test } from '../helpers/seite.mjs';
import { bedienteileFrei, figurenFrei, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const EINHEITEN = '10-strategie/einheiten-und-befehle.md';

test.describe('Ausweichen', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('einheiten AC-29: vier einzeln auf dasselbe Feld geschickt, stehen sie nebeneinander', async ({}, info) => {
    const { anna, code } = partie;
    // Ein Platz auf freiem Gras, acht Felder vor Annas Dorf; die vier
    // Dorfbewohner kommen von zehn Feldern weiter her.
    const lage = await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      return { ziel: { x: b.x + 8, y: b.y + 6 }, start: { x: b.x + 14, y: b.y + 12 } };
    });
    expect(await einheitenAufstellen(anna, code, 'Anna', 4, { x: lage.start.x, y: lage.start.y }),
      'vier Dorfbewohner').toBe(4);
    await anna.waitForFunction((start) => [...window.ansicht.nachher.values()]
      .filter((e) => e.b === window.ansicht.ich && e.k === 'd' && Math.hypot(e.x - start.x, e.y - start.y) < 3).length >= 4,
    lage.start, { timeout: 30_000 });

    await anna.evaluate(({ ziel, start }) => {
      const a = window.ansicht;
      a.kamera.zoom = 2;
      a.blickAuf((ziel.x + start.x) / 2, (ziel.y + start.y) / 2);
    }, lage);
    const ids = await anna.evaluate((start) => [...window.ansicht.nachher.values()]
      .filter((e) => e.b === window.ansicht.ich && e.k === 'd' && Math.hypot(e.x - start.x, e.y - start.y) < 3)
      .map((e) => e.i), lage.start);

    // Vier Befehle, jeder fuer einen: auswaehlen, rechts auf dasselbe Feld.
    for (const id of ids) {
      const punkt = await anna.evaluate(({ id: i, ziel }) => {
        const a = window.ansicht;
        a.gewaehltesGebaeude = null;
        a.ausgewaehlt = new Set([i]);
        a.beiAuswahl();
        return a.zuBild(ziel.x, ziel.y);
      }, { id, ziel: lage.ziel });
      await anna.mouse.click(punkt.x, punkt.y, { button: 'right' });
      await anna.waitForTimeout(150);
    }

    // Angekommen: alle vier stehen am Ziel und laufen nicht mehr.
    await anna.waitForFunction(({ ids: alle, ziel }) => {
      const a = window.ansicht;
      return alle.every((i) => {
        const e = a.nachher.get(i);
        const v = a.vorher?.get(i);
        return e && Math.hypot(e.x - ziel.x, e.y - ziel.y) <= 1.6 && (!v || (v.x === e.x && v.y === e.y));
      });
    }, { ids, ziel: lage.ziel }, { timeout: 60_000 });
    await anna.evaluate((ziel) => {
      const a = window.ansicht;
      a.ausgewaehlt = new Set();
      a.beiAuswahl();
      a.blickAuf(ziel.x, ziel.y);
    }, lage.ziel);

    // Was die Unterschrift behauptet: vier, keine zwei aufeinander.
    expect(await figurenFrei(anna, { nur: ids }), 'keine zwei aufeinander').toEqual([]);
    const imBild = await anna.evaluate((alle) => alle.filter((i) => {
      const a = window.ansicht;
      const e = a.nachher.get(i);
      const p = a.zuBild(e.x, e.y);
      return p.x > 0 && p.x < a.leinwand.clientWidth && p.y > 0 && p.y < a.leinwand.clientHeight;
    }).length, ids);
    expect(imBild, 'alle vier im Bild').toBe(4);
    expect(await bedienteileFrei(anna)).toEqual([]);

    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-29',
      titel: 'Vier Dorfbewohner, jeder für sich auf dasselbe Feld befohlen, stehen dort nebeneinander — keine zwei aufeinander',
      test: info,
    });
  });
});
