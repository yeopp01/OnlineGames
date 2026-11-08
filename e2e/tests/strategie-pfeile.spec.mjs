// Pfeile fliegen sichtbar (→ specs/10-strategie/bedienung.md AC-40).
//
// Annas Bogenschuetze schiesst auf Berts Haus. Ein Pfeil fliegt nur
// Zehntelsekunden; der Test merkt sich einen, der gerade unterwegs ist, macht
// das Bild und prueft danach, dass derselbe Pfeil noch nicht angekommen war -
// dann war er auf dem Bild.
import { unlink } from 'node:fs/promises';
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

    // Ein Pfeil auf halbem Weg: merken, fotografieren, nachsehen.
    let getroffen = false;
    for (let versuch = 0; versuch < 20 && !getroffen; versuch++) {
      const pfeil = await anna.waitForFunction(() => {
        const jetzt = performance.now();
        const p = window.ansicht.pfeile.find((q) => (jetzt - q.start) / q.dauer < 0.35 && q.dauer >= 250);
        return p ? { start: p.start, dauer: p.dauer, weite: p.weite } : null;
      }, null, { timeout: 20_000, polling: 10 });
      const gemerkt = await pfeil.jsonValue();
      const bild = await nachweis(anna, {
        spec: BEDIENUNG,
        ac: 'AC-40',
        titel: 'Ein Pfeil im Flug zwischen Annas Bogenschützen (blau) und Berts Haus',
        test: info,
      });
      // War er nach dem Bild noch unterwegs, war er auf dem Bild.
      getroffen = await anna.evaluate((g) => window.ansicht.pfeile.some((q) => q.start === g.start)
        && performance.now() - g.start < g.dauer, gemerkt);
      // Sonst weg mit dem Bild: der gewoehnliche Lauf schreibt nur fehlende
      // Bilder, und eines ohne Pfeil bliebe liegen.
      if (!getroffen) await unlink(bild).catch(() => {});
      expect(gemerkt.weite, 'ein Schuss ueber mehr als ein Feld').toBeGreaterThan(1);
    }
    expect(getroffen, 'ein Pfeil war im Bild, als es entstand').toBe(true);
  });
});
