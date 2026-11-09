// Die Burg (→ specs/10-strategie/bauen.md AC-32): erst in der Ritterzeit im
// Baumenue, mit eigener Taste; fertig gibt sie zwanzig Plaetze Wohnraum, zeigt
// an der Auswahl ihre Kampfwerte und schiesst von selbst - nach derselben
// Regel wie der Wachturm (strategie-tuerme.spec.mjs), von oben am Bergfried.
//
// Ein Pfeil fliegt nur Zehntelsekunden: der Test haelt einen, sobald er im
// Bild ist, auf knapp der Haelfte seines Wegs fest - im Bild, nicht auf dem
// Server -, wie den Stein des Mangonels (strategie-belagerung.spec.mjs).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import {
  bedienteileFrei, dorfbewohnerAnklicken, gebaeudeInDerNaehe, partieBeenden, partieZuZweit,
} from '../helpers/strategie.mjs';
import { BAUTASTEN } from '../../public/tasten.js';

const BAUEN = '10-strategie/bauen.md';

test.describe('Burg', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  const baumenue = (page) => page.locator('#baumenue [data-bauen]').evaluateAll((k) => k.map((x) => x.dataset.bauen));
  const aufsteigen = async (page, code, id, stufe) => {
    await page.keyboard.press('h');
    await page.locator(`[data-aufstieg="${id}"]`).click();
    await zeitraffer(page, code, 20);
    await page.waitForFunction((s) => window.ansicht.zeitalter === s, stufe, { timeout: 60_000 });
    await zeitraffer(page, code, 1);
  };

  test('bauen AC-32: die Burg steht erst in der Ritterzeit im Baumenue, gibt zwanzig Plaetze Wohnraum und schiesst von selbst auf Berts Miliz', async ({}, info) => {
    const { anna, code } = partie;
    await rohstoffe(anna, code, 'Anna', { holz: 3000, nahrung: 3000, gold: 1000, stein: 1000 });
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);

    // Feudalzeit: noch keine Burg im Menue.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'muehle', basis);
    await aufsteigen(anna, code, 'feudalzeit', 1);
    await dorfbewohnerAnklicken(anna);
    await anna.keyboard.press('b');
    expect(await baumenue(anna)).not.toContain('burg');
    await anna.keyboard.press('Escape');

    // Ritterzeit: jetzt steht sie darin, und ihre Taste waehlt sie zum Bauen.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'schiessanlage', basis, { von: 8, bis: 16 });
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'stall', basis, { von: 8, bis: 16 });
    await aufsteigen(anna, code, 'ritterzeit', 2);
    await dorfbewohnerAnklicken(anna);
    await anna.keyboard.press('b');
    const menue = await baumenue(anna);
    expect(menue).toContain('burg');
    await expect(anna.locator('#baumenue [data-bauen="burg"]')).toHaveAttribute('title', /Burg/);
    await anna.keyboard.press(BAUTASTEN[menue.indexOf('burg')]);
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzieren?.art)).toBe('burg');
    await anna.keyboard.press('Escape');
    await anna.keyboard.press('Escape');

    // Wohnraum vor der Burg - gelesen, nicht aus dem Kopf.
    const raum = anna.locator('[data-rohstoff="bev"] [data-teil="raum"]');
    const raumVorher = Number(await raum.textContent());

    // Eine fertige Burg abseits des Dorfes (Pruefgriff - gebaut wird sie 200
    // Sekunden lang, und das Bauen belegt bauen AC-1). Weiter weg als
    // Schiessanlage und Stall: mit 12 Feldern stand die Schiessanlage vor
    // ihrem Fuss (Runde 132).
    const burgId = await gebaeudeInDerNaehe(anna, code, 'Anna', 'burg', basis, { von: 18, bis: 26 });
    await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), burgId);
    const burg = await anna.evaluate((g) => {
      const b = window.ansicht.gebaeude.get(g);
      return { x: b.x, y: b.y };
    }, burgId);
    await expect(raum).toHaveText(String(raumVorher + 20));

    // Berts Miliz auf der Seite, die vom Dorf weg zeigt, gerade daneben: die
    // Grundflaeche reicht von x - 2 bis x + 1, also sechs Felder vom Rand.
    const rechts = burg.x >= basis.x;
    const ort = { x: rechts ? burg.x + 1 + 6 : burg.x - 2 - 6, y: burg.y };
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { ...ort, art: 'miliz' })).toBe(1);
    const kuerzel = await anna.evaluate(() => window.ansicht.werte.einheiten.miliz.kuerzel);
    const miliz = () => anna.evaluate((k) => [...window.ansicht.nachher.values()].find((e) => e.k === k && e.b !== window.ansicht.ich), kuerzel);
    await anna.waitForFunction((k) => [...window.ansicht.nachher.values()].some((e) => e.k === k && e.b !== window.ansicht.ich), kuerzel);

    // Die Burg waehlen: die Leiste zeigt ihre Kampfwerte aus den Daten.
    await anna.evaluate(([g, o]) => {
      const a = window.ansicht;
      a.kamera.zoom = 2;
      a.gewaehltesGebaeude = g;
      a.ausgewaehlt.clear();
      const b = a.gebaeude.get(g);
      a.blickAuf((b.x + o.x) / 2, (b.y + o.y) / 2 - 1);
      a.beiAuswahl();
    }, [burgId, ort]);
    const kampfwerte = anna.locator('#kampfwerte');
    await expect(kampfwerte).toBeInViewport();
    await expect(kampfwerte).toHaveAttribute('data-angriff', '11');
    await expect(kampfwerte).toHaveAttribute('data-reichweite', '8');
    await expect(raum).toBeInViewport();
    // Die Zahl in der Unterschrift: das Dorfzentrum und die Burg, sonst nichts.
    await expect(raum).toHaveText('25');
    await bedienteileFrei(anna);

    // Sie schiesst: die Miliz verliert Leben (`h` kommt erst, wenn welches
    // fehlt), und Pfeile fliegen.
    await expect.poll(async () => (await miliz())?.h ?? Infinity, { timeout: 15_000 }).toBeLessThan(40);
    await anna.waitForFunction(() => window.ansicht.pfeile.length > 0, null, { timeout: 10_000 });
    const pfeil = await anna.waitForFunction(() => {
      const p = window.ansicht.pfeile.find((q) => !q.stein);
      if (!p) return false;
      p.dauer = 1e9;
      p.start = performance.now() - 0.45e9;
      return { oben: p.oben, x0: p.x0, y0: p.y0, x1: p.x1, y1: p.y1 };
    }, null, { timeout: 10_000, polling: 10 }).then((h) => h.jsonValue());
    expect(pfeil.oben, 'der Pfeil beginnt oben am Bergfried, nicht am Fuss der Burg').toBeGreaterThan(0);
    // Er kommt aus der Mitte der Burg (vier Felder: x - 0,5) und fliegt zur Miliz.
    expect([pfeil.x0, pfeil.y0]).toEqual([burg.x - 0.5, burg.y - 0.5]);
    // Der Pruefgriff stellt sie aufs naechste freie Feld - gemessen wird an
    // ihr, nicht am bestellten Platz.
    const ziel = await miliz();
    expect(Math.hypot(pfeil.x1 - ziel.x, pfeil.y1 - ziel.y), 'auf Berts Miliz').toBeLessThan(0.5);
    await anna.waitForTimeout(100);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-32',
      titel: 'Annas Burg (blau) gewählt, mit Angriff und Reichweite, und ein Pfeil auf dem Weg zu Berts Miliz (rot); oben in der Leiste Wohnraum für 25',
      test: info,
    });
  });
});
