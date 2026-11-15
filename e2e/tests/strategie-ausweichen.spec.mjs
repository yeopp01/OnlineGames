// Keine zwei Einheiten uebereinander, im Browser gesehen
// (→ specs/10-strategie/einheiten-und-befehle.md AC-29, AC-30).
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

    // Angekommen: alle vier stehen am Ziel und laufen nicht mehr - und sind
    // auseinandergetreten. Ohne das Zweite gewann der Test einen Wettlauf:
    // in dem Takt, in dem zwei auf demselben Feld ankommen, stehen beide
    // still, und das Ausweichen beginnt erst danach (gefallen im vollen Lauf
    // am 2026-11-14, einzeln dreimal gruen). Treten sie nie auseinander,
    // laeuft diese Wartezeit ab.
    await anna.waitForFunction(({ ids: alle, ziel }) => {
      const a = window.ansicht;
      const stehen = alle.every((i) => {
        const e = a.nachher.get(i);
        const v = a.vorher?.get(i);
        return e && Math.hypot(e.x - ziel.x, e.y - ziel.y) <= 1.6 && (!v || (v.x === e.x && v.y === e.y));
      });
      if (!stehen) return false;
      const orte = alle.map((i) => a.nachher.get(i));
      return orte.every((e, n) => orte.every((f, m) => m <= n || Math.hypot(e.x - f.x, e.y - f.y) >= 0.5));
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

  // Zehn auf einen Baum - der Fall aus dem Spiel: "hier stehen zig
  // Dorfbewohner komplett ineinander". Ein Befehl an alle zehn, wie ein
  // Mensch ihn gibt; vorher standen danach alle, die dasselbe Nachbarfeld
  // nahmen, auf dessen Mitte.
  test('einheiten AC-30: zehn Dorfbewohner an einem Baum, jeder auf seinem Platz', async ({}, info) => {
    const { anna, code } = partie;
    // Der naechste Baum am Waldrand: mindestens drei Felder Gras daneben, das
    // sind zwoelf Plaetze. Die zehn kommen von vier Feldern davor.
    const lage = await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      const g = a.karte.groesse;
      const feld = (x, y) => (x < 0 || y < 0 || x >= g || y >= g ? -1 : a.karte.felder[y * g + x]);
      let baum = null;
      for (let y = 0; y < g; y++) {
        for (let x = 0; x < g; x++) {
          if (feld(x, y) !== 1) continue;
          let gras = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && feld(x + dx, y + dy) === 0) gras += 1;
          const d = Math.hypot(x - b.x, y - b.y);
          if (gras >= 3 && (!baum || d < baum.d)) baum = { x, y, d };
        }
      }
      const zurueck = 4 / baum.d;
      return {
        baum: { x: baum.x, y: baum.y },
        start: { x: Math.round(baum.x + (b.x - baum.x) * zurueck), y: Math.round(baum.y + (b.y - baum.y) * zurueck) },
      };
    });
    const vorher = await anna.evaluate(() => [...window.ansicht.nachher.keys()]);
    expect(await einheitenAufstellen(anna, code, 'Anna', 10, lage.start), 'zehn Dorfbewohner').toBe(10);
    await anna.waitForFunction((alt) => [...window.ansicht.nachher.values()]
      .filter((e) => e.b === window.ansicht.ich && e.k === 'd' && !alt.includes(e.i)).length >= 10, vorher, { timeout: 30_000 });
    const ids = await anna.evaluate((alt) => [...window.ansicht.nachher.values()]
      .filter((e) => e.b === window.ansicht.ich && e.k === 'd' && !alt.includes(e.i)).map((e) => e.i), vorher);
    expect(ids.length, 'die zehn neuen').toBe(10);

    // Ein Befehl an alle zehn: auswaehlen, rechts auf den Baum.
    const punkt = await anna.evaluate(({ alle, baum }) => {
      const a = window.ansicht;
      a.kamera.zoom = 2;
      a.blickAuf(baum.x, baum.y);
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set(alle);
      a.beiAuswahl();
      return a.zuBild(baum.x, baum.y);
    }, { alle: ids, baum: lage.baum });
    await anna.mouse.click(punkt.x, punkt.y, { button: 'right' });

    // Alle zehn hacken zugleich - die erste Ladung dauert laenger als der Weg.
    await anna.waitForFunction((alle) => alle.every((i) => window.ansicht.nachher.get(i)?.w === 1), ids, { timeout: 60_000 });
    await anna.evaluate(() => {
      const a = window.ansicht;
      a.ausgewaehlt = new Set();
      a.beiAuswahl();
    });

    // Was die Unterschrift behauptet: zehn bei der Arbeit, keine zwei
    // aufeinander - und nicht irgendwo, sondern am Wald.
    expect(await figurenFrei(anna, { nur: ids }), 'keine zwei aufeinander').toEqual([]);
    const stand = await anna.evaluate(({ alle, baum }) => {
      const a = window.ansicht;
      return alle.map((i) => {
        const e = a.nachher.get(i);
        const p = a.zuBild(e.x, e.y);
        return {
          arbeitet: e.w === 1,
          weit: Math.hypot(e.x - baum.x, e.y - baum.y),
          imBild: p.x > 0 && p.x < a.leinwand.clientWidth && p.y > 0 && p.y < a.leinwand.clientHeight,
        };
      });
    }, { alle: ids, baum: lage.baum });
    expect(stand.filter((s) => s.arbeitet).length, 'alle zehn arbeiten').toBe(10);
    expect(stand.filter((s) => s.imBild).length, 'alle zehn im Bild').toBe(10);
    // Wer am geklickten Baum keinen Platz mehr fand, steht am Baum daneben.
    expect(Math.max(...stand.map((s) => s.weit)), 'alle am Waldrand um den Baum').toBeLessThan(5);
    expect(await bedienteileFrei(anna)).toEqual([]);

    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-30',
      titel: 'Zehn Dorfbewohner mit einem Befehl an einen Baum geschickt: jeder hackt von seinem Platz aus, keine zwei stehen aufeinander',
      test: info,
    });
  });
});
