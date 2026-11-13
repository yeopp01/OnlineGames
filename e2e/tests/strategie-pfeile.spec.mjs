// Pfeile fliegen sichtbar (→ specs/10-strategie/bedienung.md AC-40).
//
// Annas Bogenschuetze schiesst auf Berts Haus. Ein Pfeil fliegt nur
// Zehntelsekunden; der Test misst einen, der gerade unterwegs ist, haelt ihn
// fuer das Bild auf halbem Weg fest und laesst ihn danach ankommen.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test } from '../helpers/seite.mjs';
import { gebaeudeInDerNaehe, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Pfeile', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-40: ein Schuss fliegt als Pfeil vom Bogenschuetzen zum Ziel', async ({}, info) => {
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const ort = { x: basis.x + 1, y: basis.y + 10 };
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { ...ort, art: 'bogenschuetze' })).toBe(1);
    // Ein Haus als Ziel, nicht eine Miliz: die lief im vollen Browserlauf auf
    // den Schuetzen zu, und alle Schuesse wurden zu kurz, um sie im Flug zu
    // erwischen (Runde 119). Ein Haus bleibt stehen.
    const hausId = await gebaeudeInDerNaehe(anna, code, 'Bert', 'haus', ort, { von: 5, bis: 9 });
    await anna.waitForFunction((id) => window.ansicht.gebaeude.has(id), hausId);
    const haus = await anna.evaluate((id) => {
      const g = window.ansicht.gebaeude.get(id);
      return { x: g.x, y: g.y };
    }, hausId);
    const kuerzel = await anna.evaluate(() => window.ansicht.werte.einheiten.bogenschuetze.kuerzel);
    await anna.waitForFunction((k) => [...window.ansicht.nachher.values()].some((e) => e.k === k && e.b === window.ansicht.ich), kuerzel);
    // Derselbe Weg wie ein Rechtsklick auf das Haus.
    await anna.evaluate(({ k, h }) => {
      const a = window.ansicht;
      const schuetze = [...a.nachher.values()].find((e) => e.k === k && e.b === a.ich);
      a.befehlSenden([schuetze.i], h, false);
    }, { k: kuerzel, h: haus });
    await anna.evaluate((o) => {
      const a = window.ansicht;
      a.kamera.zoom = 2;
      a.blickAuf(o.x + 2, o.y);
    }, ort);

    // Er geht in Reichweite und schiesst: Pfeile kommen an.
    await anna.waitForFunction(() => window.ansicht.pfeile.length > 0, null, { timeout: 20_000 });

    // Ein Pfeil auf halbem Weg, fuer das Bild festgehalten: er fliegt 0,57
    // Sekunden (vier Felder bei sieben je Sekunde), und ein Bildschirmfoto des
    // gerenderten Spielbilds dauert laenger - im Flug war er nicht mehr
    // verlaesslich zu erwischen (2026-11-13). Gemessen wird vorher, am
    // fliegenden Pfeil: wie lange er unterwegs ist, wo er beginnt und endet.
    const pfeil = await anna.waitForFunction(() => {
      const jetzt = performance.now();
      const p = window.ansicht.pfeile.find((q) => !q.stein && jetzt >= q.start && (jetzt - q.start) / q.dauer < 0.5);
      if (!p) return null;
      const gemessen = { dauer: p.dauer, weite: p.weite, x0: p.x0, y0: p.y0, x1: p.x1, y1: p.y1 };
      p.dauer = 1e9;
      p.start = jetzt - 0.45e9;
      return gemessen;
    }, null, { timeout: 20_000, polling: 10 }).then((h) => h.jsonValue());
    expect(pfeil.weite, 'ein Schuss ueber mehr als ein Feld').toBeGreaterThan(1);
    // Sieben Felder je Sekunde, mindestens 0,15 Sekunden.
    expect(pfeil.dauer).toBeCloseTo(Math.max(150, (pfeil.weite / 7) * 1000), 0);
    const schuetze = await anna.evaluate((k) => {
      const a = window.ansicht;
      const e = [...a.nachher.values()].find((x) => x.k === k && x.b === a.ich);
      return { x: e.x, y: e.y };
    }, kuerzel);
    expect(Math.hypot(pfeil.x0 - schuetze.x, pfeil.y0 - schuetze.y), 'er beginnt beim Schuetzen').toBeLessThan(0.6);
    // Das Haus ist zwei Felder breit: das Ziel liegt auf seiner Grundflaeche.
    expect(Math.hypot(pfeil.x1 - haus.x, pfeil.y1 - haus.y), 'er endet am Haus').toBeLessThan(2);
    // Ein Bild weiter, dann steht er gezeichnet da.
    await anna.evaluate(() => new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig))));
    expect(await anna.evaluate(() => window.ansicht.pfeile.some((q) => q.dauer === 1e9)), 'der Pfeil steht im Bild').toBe(true);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-40',
      titel: 'Ein Pfeil im Flug zwischen Annas Bogenschützen (blau) und Berts Haus',
      test: info,
    });
    // Losgelassen: er kommt an und verschwindet wie jeder andere.
    await anna.evaluate(() => {
      for (const q of window.ansicht.pfeile) if (q.dauer === 1e9) q.dauer = 1;
    });
    await anna.waitForFunction(() => !window.ansicht.pfeile.some((q) => q.dauer === 1), null, { timeout: 5_000 });
  });
});
