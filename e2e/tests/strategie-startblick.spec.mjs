// Der Blick zum Start der Partie (→ specs/10-strategie/darstellung.md AC-16).
//
// Bis Runde 99 begann jede Partie bei Zoom 1: ein Feld 44 Bildpunkte breit,
// ein Dorfbewohner 28,6 hoch - im Original rund 96 und 45. Die Figuren waren
// Striche, und wer nicht von selbst heranholte, sah das Spiel nie in seiner
// Groesse (Rueckschau nach Runde 88). Jetzt beginnt sie bei Zoom 1,5.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test } from '../helpers/seite.mjs';
import { bedienteileFrei, figurenFrei, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const DARSTELLUNG = '10-strategie/darstellung.md';
// Was das Kriterium verlangt: mindestens 40 Bildpunkte, das Original hat rund
// 45 bei 1080 Zeilen.
const MINDESTENS = 40;

test.describe('Startblick', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('darstellung AC-16: zum Start ist ein Dorfbewohner mindestens 40 Bildpunkte hoch', async ({}, info) => {
    const { anna } = partie;
    // Die Startaufstellung steht: drei Dorfbewohner und der Spaeher am Dorfzentrum.
    await anna.waitForFunction(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].filter((e) => e.b === a.ich).length >= 4;
    }, null, { timeout: 20_000 });

    const messung = await anna.evaluate(() => {
      const a = window.ansicht;
      const start = { zoom: a.kamera.zoom, hoehe: a.figurenHoehe() };
      // Gegenprobe: derselbe Blick bei Zoom 1, wie bis Runde 99.
      a.kamera.zoom = 1;
      const frueher = a.figurenHoehe();
      a.kamera.zoom = start.zoom;
      a.blickAuf(a.spieler.get(a.ich).basis.x, a.spieler.get(a.ich).basis.y);
      const eigene = [...a.nachher.values()].filter((e) => e.b === a.ich);
      const imBild = eigene.filter((e) => {
        const p = a.zuBild(e.x, e.y);
        return p.x > 0 && p.x < a.leinwand.clientWidth && p.y > 0 && p.y < a.leinwand.clientHeight;
      });
      return { ...start, frueher, dorf: imBild.filter((e) => e.k === 'd').length, alle: imBild.length };
    });
    expect(messung.hoehe, `Figur ${messung.hoehe.toFixed(1)} Bildpunkte bei Zoom ${messung.zoom}`).toBeGreaterThanOrEqual(MINDESTENS);
    expect(messung.frueher, 'bei Zoom 1 waere es zu klein').toBeLessThan(MINDESTENS);
    // Was die Unterschrift behauptet.
    expect(messung.dorf, 'drei Dorfbewohner im Bild').toBe(3);
    expect(messung.alle, 'und der Spaeher').toBe(4);
    expect(await figurenFrei(anna)).toEqual([]);
    expect(await bedienteileFrei(anna)).toEqual([]);

    await nachweis(anna, {
      spec: DARSTELLUNG,
      ac: 'AC-16',
      titel: 'Der Blick zum Start, ohne heranzuholen: am Dorfzentrum drei Dorfbewohner und der Späher zu Pferd, jeder als Figur zu erkennen',
      test: info,
    });
  });
});
