// Zerstoerung im Bild (→ specs/10-strategie/bauen.md AC-17, AC-18): ein
// Gebaeude hat Leben, die Leiste zeigt es; faellt ein Haus, sinkt die Grenze
// oben, und niemand stirbt dafuer. Die Regeln im Einzelnen (Werte aus der
// Tabelle, niemand kommt dazu, die Farm haelt keinen im Spiel) prueft
// tests/strategie-zerstoerung.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, gebaeudeAufstellen, lebenSetzen, rohstoffe, test } from '../helpers/seite.mjs';
import { aufSeite, freieWiesen, partieBeenden, partieZuZweit, waehlen } from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';

test('bauen AC-17 / bauen AC-18: das Haus traegt sein Leben in der Leiste - faellt es, steht die Bevoelkerung oben ueber der Grenze, und keiner ist gestorben', async ({ browser }, info) => {
  // Handelt nicht vom Nebel.
  const partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  try {
    const { anna, bert, code } = partie;
    const [wiese] = await freieWiesen(anna, 1);
    const werte = await anna.evaluate(() => {
      const a = window.ansicht;
      return { raum: a.vorraete.raum, haus: a.werte.gebaeude.haus, basis: a.spieler.get(a.ich).basis };
    });
    const haus = await gebaeudeAufstellen(anna, code, 'Anna', 'haus', wiese.x, wiese.y);
    const raum = werte.raum + werte.haus.wohnraum;
    await anna.waitForFunction((r) => window.ansicht.vorraete.raum === r, raum);
    // Bis an die Grenze auffuellen - daheim, weit weg vom Haus.
    const bev = await anna.evaluate(() => window.ansicht.vorraete.bev);
    await einheitenAufstellen(anna, code, 'Anna', raum - bev, { art: 'dorfbewohner', x: werte.basis.x, y: werte.basis.y + 4 });
    await anna.waitForFunction((r) => window.ansicht.vorraete.bev === r, raum);

    // AC-17: das Haus, angeschlagen, angeklickt.
    await lebenSetzen(anna, code, haus, 220);
    await anna.waitForFunction((h) => window.ansicht.gebaeude.get(h)?.h === 220, haus);
    await waehlen(anna, [], { zoom: 1.8, blick: { x: wiese.x + 1, y: wiese.y + 1 } });
    const mitte = await aufSeite(anna, { gebaeude: haus });
    await anna.mouse.click(mitte.x, mitte.y);
    await anna.waitForFunction((h) => window.ansicht.gewaehltesGebaeude === h, haus);
    const leben = anna.locator('#auswahlleiste .leben');
    await expect(leben).toHaveAttribute('data-leben', `220/${werte.haus.leben}`);
    await expect(leben).toBeInViewport();
    await anna.waitForTimeout(100);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-17',
      titel: 'Ein angeschlagenes Haus gewaehlt - die Leiste zeigt sein Leben als Balken und Zahl, 220 von 550',
      test: info,
    });

    // AC-18: Berts Miliz reisst es ein.
    await lebenSetzen(anna, code, haus, 1);
    await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'miliz', x: wiese.x - 3, y: wiese.y + 1 });
    const kuerzel = await bert.evaluate(() => window.ansicht.werte.einheiten.miliz.kuerzel);
    const miliz = await bert.waitForFunction(([k, w]) => {
      const a = window.ansicht;
      const e = [...a.nachher.values()].find((x) => x.k === k && x.b === a.ich && Math.hypot(x.x - w.x, x.y - w.y) < 6);
      return e?.i;
    }, [kuerzel, wiese]).then((h) => h.jsonValue());
    await waehlen(bert, [miliz], { zoom: 1.8, blick: wiese });
    const ziel = await aufSeite(bert, { gebaeude: haus });
    if (ziel) await bert.mouse.click(ziel.x, ziel.y, { button: 'right' });
    await anna.waitForFunction((h) => !window.ansicht.gebaeude.has(h), haus, { timeout: 30_000 });
    await anna.waitForFunction((r) => window.ansicht.vorraete.raum === r, werte.raum);
    expect(await anna.evaluate(() => window.ansicht.vorraete.bev), 'keiner ist gestorben').toBe(raum);

    // Ein Dorfbewohner wartet im Dorfzentrum: die Anzeige wird rot (bedienung AC-43).
    await rohstoffe(anna, code, 'Anna', { nahrung: 300 });
    await anna.evaluate(() => {
      const a = window.ansicht;
      const z = [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'dorfzentrum');
      a.ausgewaehlt = new Set();
      a.gewaehltesGebaeude = z.i;
      a.beiAuswahl();
    });
    await anna.locator('[data-ausbilden="dorfbewohner"]').click();
    await expect(anna.locator('[data-abbrechen]')).toHaveCount(1);
    await anna.keyboard.press('Escape');
    const anzeige = anna.locator('[data-rohstoff="bev"]');
    await expect(anzeige).toHaveText(new RegExp(`^\\s*${raum}\\s*/\\s*${werte.raum}\\s*$`));
    await expect(anzeige).toHaveClass(/\bwartet\b/);
    await expect(anzeige).toBeInViewport();
    await anna.evaluate((w) => window.ansicht.blickAuf(w.x + 1, w.y + 1), wiese);
    await anna.waitForTimeout(200);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-18',
      titel: 'Berts Miliz hat das Haus eingerissen - oben steht die Bevoelkerung ueber der gesunkenen Grenze, rot, weil ein Dorfbewohner wartet',
      test: info,
    });
    // Und es kommt keiner dazu.
    await anna.waitForTimeout(3000);
    expect(await anna.evaluate(() => window.ansicht.vorraete.bev), 'niemand kommt dazu').toBe(raum);
  } finally {
    await partieBeenden(partie);
  }
});
