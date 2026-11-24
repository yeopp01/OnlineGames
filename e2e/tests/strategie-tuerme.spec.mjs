// Gebaeude, die schiessen (→ specs/10-strategie/bauen.md AC-29,
// kampf.md AC-20): der Wachturm steht ab der Feudalzeit im Baumenue, zeigt an
// der Auswahl seine Kampfwerte und schiesst von selbst auf Berts Miliz.
//
// Ein Pfeil fliegt nur Zehntelsekunden: der Test haelt einen, sobald er im
// Bild ist, auf knapp der Haelfte seines Wegs fest - im Bild, nicht auf dem
// Server -, wie an der Burg (strategie-burg.spec.mjs).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import {
  bedienteileFrei, dorfbewohnerAnklicken, gebaeudeInDerNaehe, partieBeenden, partieZuZweit,
} from '../helpers/strategie.mjs';
import { BAUTASTEN } from '../../public/tasten.js';

const BAUEN = '10-strategie/bauen.md';
const KAMPF = '10-strategie/kampf.md';

test.describe('Tuerme', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  const baumenue = (page) => page.locator('#baumenue [data-bauen]').evaluateAll((k) => k.map((x) => x.dataset.bauen));

  test('bauen AC-29 und kampf AC-20: der Wachturm steht ab der Feudalzeit im Baumenue und schiesst von selbst auf Berts Miliz', async ({}, info) => {
    const { anna, code } = partie;
    await rohstoffe(anna, code, 'Anna', { holz: 2000, nahrung: 2000, gold: 500, stein: 500 });
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);

    // In der Dunklen Zeit fehlt er im Menue.
    await dorfbewohnerAnklicken(anna);
    await anna.keyboard.press('b');
    expect(await baumenue(anna)).not.toContain('wachturm');
    await anna.keyboard.press('Escape');

    // Der Aufstieg: ein zweites Gebaeude, dann im Dorfzentrum bestellt.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'muehle', basis);
    await anna.keyboard.press('h');
    await anna.locator('[data-aufstieg="feudalzeit"]').click();
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => window.ansicht.zeitalter === 1, null, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);

    // Jetzt steht er im Menue, und seine Taste waehlt ihn zum Bauen.
    await dorfbewohnerAnklicken(anna);
    await anna.keyboard.press('b');
    const menue = await baumenue(anna);
    expect(menue).toContain('wachturm');
    await expect(anna.locator('#baumenue [data-bauen="wachturm"]')).toHaveAttribute('aria-label', /Wachturm/);
    await anna.keyboard.press(BAUTASTEN[menue.indexOf('wachturm')]);
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzieren?.art)).toBe('wachturm');
    await anna.keyboard.press('Escape');
    await anna.keyboard.press('Escape');

    // Ein fertiger Turm, abseits des Dorfes (Pruefgriff - gebaut wird er
    // achtzig Sekunden lang, und das Bauen belegt bauen AC-1).
    const turmId = await gebaeudeInDerNaehe(anna, code, 'Anna', 'wachturm', basis, { von: 10, bis: 14 });
    await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), turmId);
    const turm = await anna.evaluate((g) => {
      const t = window.ansicht.gebaeude.get(g);
      return { x: t.x, y: t.y };
    }, turmId);

    // Berts Miliz auf der Seite, die vom Dorf weg zeigt - dort ist keiner
    // von Annas Leuten, mit dem sie sich schlagen koennte. Sie steht still;
    // getroffen wird sie, ohne dass Anna einen Befehl gibt.
    const weg = { x: Math.sign(turm.x - basis.x) || 1, y: Math.sign(turm.y - basis.y) };
    // Sechs Felder weit: der Pfeil fliegt dann lange genug fuer zwei Bilder.
    // Schraeg waeren es 6 * 1,4 = 8,5 Felder, also ueber die Reichweite.
    const schritt = 6 / Math.hypot(weg.x, weg.y);
    const ort = { x: turm.x + Math.round(schritt * weg.x), y: turm.y + Math.round(schritt * weg.y) };
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { ...ort, art: 'miliz' })).toBe(1);
    const kuerzel = await anna.evaluate(() => window.ansicht.werte.einheiten.miliz.kuerzel);
    const miliz = () => anna.evaluate((k) => [...window.ansicht.nachher.values()].find((e) => e.k === k && e.b !== window.ansicht.ich), kuerzel);
    await anna.waitForFunction((k) => [...window.ansicht.nachher.values()].some((e) => e.k === k && e.b !== window.ansicht.ich), kuerzel);
    // Unverletzt schickt der Server kein `h` - seit dem Pfeilflug (kampf
    // AC-27) ist sie hier noch nicht getroffen.
    const lebenVorher = (await miliz()).h ?? (await anna.evaluate(() => window.ansicht.werte.einheiten.miliz.leben));

    // Den Turm waehlen: die Leiste zeigt seine Kampfwerte aus den Daten.
    await anna.evaluate(([g, o]) => {
      const a = window.ansicht;
      a.kamera.zoom = 2;
      a.gewaehltesGebaeude = g;
      a.ausgewaehlt.clear();
      const t = a.gebaeude.get(g);
      a.blickAuf((t.x + o.x) / 2, (t.y + o.y) / 2);
      a.beiAuswahl();
    }, [turmId, ort]);
    const kampfwerte = anna.locator('#kampfwerte');
    await expect(kampfwerte).toBeInViewport();
    await expect(kampfwerte).toHaveAttribute('data-angriff', '5');
    await expect(kampfwerte).toHaveAttribute('data-reichweite', '8');
    await expect(kampfwerte).toContainText('Reichweite');
    await bedienteileFrei(anna);

    // Er schiesst: die Miliz verliert Leben, und Pfeile fliegen.
    await expect.poll(async () => (await miliz())?.h ?? Infinity, { timeout: 15_000 }).toBeLessThan(lebenVorher);
    await anna.waitForFunction(() => window.ansicht.pfeile.length > 0, null, { timeout: 10_000 });
    // Ein Pfeil auf knapp halbem Weg, im Bild festgehalten - nicht auf dem
    // Server -, wie an der Burg (strategie-burg.spec.mjs). Vorher wurde er im
    // Flug fotografiert und danach nachgesehen, ob er noch flog; seit das
    // Spielbild gerendert ist, dauern zwei Bilder laenger als sein Flug von
    // 0,86 Sekunden (2026-11-12).
    const pfeil = await anna.waitForFunction(() => {
      const p = window.ansicht.pfeile.find((q) => !q.stein && q.dauer >= 600);
      if (!p) return false;
      const dauer = p.dauer;
      p.dauer = 1e9;
      p.start = performance.now() - 0.45e9;
      return { oben: p.oben, dauer, x0: p.x0, y0: p.y0, x1: p.x1, y1: p.y1 };
    }, null, { timeout: 10_000, polling: 10 }).then((h) => h.jsonValue());
    expect(pfeil.oben, 'der Pfeil beginnt oben auf dem Turm, nicht an seinem Fuss').toBeGreaterThan(0);
    // Er kommt aus dem Turm und fliegt zur Miliz.
    expect([pfeil.x0, pfeil.y0]).toEqual([turm.x, turm.y]);
    const ziel = await miliz();
    expect(Math.hypot(pfeil.x1 - ziel.x, pfeil.y1 - ziel.y), 'auf Berts Miliz').toBeLessThan(0.5);
    await anna.waitForTimeout(100);
    for (const [spec, ac] of [[BAUEN, 'AC-29'], [KAMPF, 'AC-20']]) {
      await nachweis(anna, {
        spec,
        ac,
        titel: 'Annas Wachturm (blau) gewählt, mit Angriff und Reichweite, und ein Pfeil auf dem Weg zu Berts Miliz (rot)',
        test: info,
      });
    }
    // Anna hat der Miliz keinen Befehl gegeben - und der Turm hat getroffen.
    expect((await miliz())?.h ?? Infinity).toBeLessThan(lebenVorher);
  });
});
