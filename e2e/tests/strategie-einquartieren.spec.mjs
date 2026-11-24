// Einquartieren und Notfallklingel (→ specs/10-strategie/bauen.md AC-58 bis AC-61).
//
// Was die Nachrichten auf dem Server tun - wer hinein darf, wie viele Pfeile,
// heilen, heraus beim Fall, die Glocke und die Entwarnung -, pruefen
// tests/strategie-einquartieren.test.mjs. Hier: der Knopf und die Taste an
// der Auswahl, der Klick auf das Gebaeude, die Zahl und "Alle heraus" am
// Gebaeude, das Dorfzentrum, das erst mit Besatzung schiesst, und die Glocke.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test, zeitraffer } from '../helpers/seite.mjs';
import { aufSeite, gebaeudeInDerNaehe, partieBeenden, partieZuZweit, waehlen } from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';

/** Das Gebaeude waehlen, wie ein Klick darauf - ohne Einheiten. */
function gebaeudeWaehlen(page, id) {
  return page.evaluate((id) => {
    const a = window.ansicht;
    a.ausgewaehlt = new Set();
    a.gewaehltesGebaeude = id;
    a.beiAuswahl();
  }, id);
}

/** Die Zahl darin, wie sie beim Browser ankommt (`bs` am Gebaeude). */
function besatzung(page, id) {
  return page.evaluate((id) => window.ansicht.gebaeude.get(id)?.bs || 0, id);
}

/** Wie viele dieser Einheiten auf der Karte stehen. */
function draussen(page, ids) {
  return page.evaluate((ids) => ids.filter((id) => window.ansicht.nachher.has(id)).length, ids);
}

test.describe('Einquartieren', () => {
  let partie;
  let dz;
  let bauern;
  let mitte;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
    const { anna } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    ({ dz, bauern, mitte } = await anna.evaluate(() => {
      const a = window.ansicht;
      const k = a.werte.einheiten.dorfbewohner.kuerzel;
      const g = [...a.gebaeude.values()].find((b) => b.b === a.ich && b.art === 'dorfzentrum');
      return {
        dz: g.i,
        mitte: a.gebaeudeMitte(g),
        bauern: [...a.nachher.values()].filter((e) => e.b === a.ich && e.k === k).map((e) => e.i),
      };
    }));
  });
  test.afterAll(() => partieBeenden(partie));

  test('bauen AC-58: drei Dorfbewohner mit dem Knopf Einquartieren ins Dorfzentrum - sie verschwinden, am Gebäude steht Besatzung 3 / 15, Alle heraus stellt sie wieder hin', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, code } = partie;
    expect(bauern.length).toBe(3);
    await waehlen(anna, bauern, { zoom: 1.8, blick: mitte });

    // Der Knopf an der Auswahl, mit der Zahl und einer Tafel.
    const knopf = anna.locator('#einquartieren');
    await expect(knopf).toHaveText('3 einquartieren');
    await expect(knopf).toHaveAttribute('aria-pressed', 'false');
    await anna.mouse.move(700, 300);
    await knopf.hover();
    await expect(anna.locator('#knopftafel')).toContainText('Taste E');
    await expect(anna.locator('#knopftafel')).toContainText('Danach ein eigenes Dorfzentrum, einen Turm oder eine Burg anklicken');
    await expect(anna.locator('#knopftafel')).toBeInViewport({ ratio: 1 });

    // Gedrueckt ist es eine Betriebsart; der naechste Linksklick waehlt das Gebaeude.
    await knopf.click();
    await expect(knopf).toHaveAttribute('aria-pressed', 'true');
    await expect(anna.locator('canvas.einquartieren')).toHaveCount(1);
    const punkt = await aufSeite(anna, { gebaeude: dz });
    await anna.mouse.click(punkt.x, punkt.y);
    await expect(anna.locator('canvas.einquartieren')).toHaveCount(0);

    await zeitraffer(anna, code, 4);
    await expect.poll(() => besatzung(anna, dz), { timeout: 30_000 }).toBe(3);
    await zeitraffer(anna, code, 1);
    expect(await draussen(anna, bauern), 'drinnen stehen sie nicht auf der Karte').toBe(0);
    const bev = await anna.evaluate(() => window.ansicht.vorraete.bev);
    expect(bev).toBeGreaterThanOrEqual(3);

    // Am Gebaeude: die Zahl und "Alle heraus".
    await gebaeudeWaehlen(anna, dz);
    await expect(anna.locator('#besatzung')).toContainText('Besatzung 3 / 15');
    await expect(anna.locator('#heraus')).toHaveAttribute('aria-disabled', 'false');
    await expect(anna.locator('.auswahlleiste')).toBeInViewport();
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-58',
      titel: 'Drei Dorfbewohner sind im Dorfzentrum: die Leiste nennt Besatzung 3 / 15 und bietet „Alle heraus"',
      test: info,
    });

    await anna.locator('#heraus').click();
    await expect.poll(() => draussen(anna, bauern)).toBe(3);
    expect(await besatzung(anna, dz)).toBe(0);
    await expect(anna.locator('#besatzung')).toContainText('Besatzung 0 / 15');
    await expect(anna.locator('#heraus')).toHaveAttribute('aria-disabled', 'true');
  });

  test('bauen AC-59: leer schießt das Dorfzentrum nicht, mit drei Dorfbewohnern darin trifft es einen fremden Dorfbewohner daneben', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, code } = partie;
    const k = await anna.evaluate(() => window.ansicht.werte.einheiten.dorfbewohner.kuerzel);
    // Annas Spaeherreiter wacht und schluege den Fremden selbst (kampf AC-2) -
    // er haelt sich heraus (kampf AC-31), damit nur das Dorfzentrum trifft.
    await anna.evaluate(() => {
      const a = window.ansicht;
      const reiter = [...a.nachher.values()].filter((e) => e.b === a.ich && a.werte.einheiten[a.arten[e.k]]?.haltung).map((e) => e.i);
      a.beiAuftrag({ auftrag: 'haltung', einheiten: reiter, haltung: 'passiv' });
    });
    await anna.waitForFunction(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].filter((e) => e.b === a.ich && a.werte.einheiten[a.arten[e.k]]?.haltung).every((e) => e.ht === 'p');
    });
    const platz = { x: Math.round(mitte.x) + 5, y: Math.round(mitte.y) };
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'dorfbewohner', ...platz })).toBe(1);
    // Bert hat seine eigenen Dorfbewohner daheim - gemeint ist der neben Annas Dorfzentrum.
    const fremdNah = ({ k, p }) => [...window.ansicht.nachher.values()]
      .find((e) => e.b !== window.ansicht.ich && e.k === k && Math.hypot(e.x - p.x, e.y - p.y) < 3)?.i ?? null;
    await anna.waitForFunction(fremdNah, { k, p: platz });
    const fremd = await anna.evaluate(fremdNah, { k, p: platz });
    // Wer heil ist, traegt kein `h` - dann steht hier Infinity; wer gefallen ist, 0.
    const leben = () => anna.evaluate((id) => {
      const e = window.ansicht.nachher.get(id);
      return e ? (e.h ?? Infinity) : 0;
    }, fremd);
    const voll = await leben();
    expect(voll, 'heil aufgestellt').toBe(Infinity);

    // Leer: am Gebaeude stehen keine Kampfwerte, und vier Spielsekunden lang trifft nichts.
    await gebaeudeWaehlen(anna, dz);
    await expect(anna.locator('#besatzung')).toContainText('schießt erst mit Besatzung');
    await zeitraffer(anna, code, 4);
    await anna.waitForTimeout(1000);
    await zeitraffer(anna, code, 1);
    expect(await leben(), 'leer schiesst das Dorfzentrum nicht').toBe(voll);

    // Mit Taste E und Klick hinein - danach schiesst es.
    await waehlen(anna, bauern, { zoom: 1.8, blick: mitte });
    await anna.keyboard.press('e');
    await expect(anna.locator('#einquartieren')).toHaveAttribute('aria-pressed', 'true');
    const punkt = await aufSeite(anna, { gebaeude: dz });
    await anna.mouse.click(punkt.x, punkt.y);
    await zeitraffer(anna, code, 2);
    await expect.poll(() => besatzung(anna, dz), { timeout: 30_000 }).toBe(3);
    await expect.poll(leben, { timeout: 30_000 }).toBeLessThan(voll);
    await zeitraffer(anna, code, 0);
    await gebaeudeWaehlen(anna, dz);
    await expect(anna.locator('#besatzung')).toContainText('Besatzung 3 / 15');
    await expect(anna.locator('#besatzung')).not.toContainText('schießt erst');
    await expect(anna.locator('.auswahlleiste')).toContainText('Reichweite');
    // Im Bild: der Getroffene, angesehen wie mit einem Klick (bedienung AC-58) -
    // so steht sein Lebensbalken ueber ihm und sein Leben in der Leiste.
    await anna.evaluate((id) => {
      const a = window.ansicht;
      a.ausgewaehlt = new Set();
      a.gewaehltesGebaeude = null;
      a.angesehen = { e: id };
      a.beiAuswahl();
    }, fremd);
    await expect(anna.locator('.auswahlleiste')).toContainText('Bert');
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-59',
      titel: 'Mit drei Dorfbewohnern darin schießt das Dorfzentrum: Berts Dorfbewohner rechts davon hat Leben verloren',
      test: info,
    });
    await zeitraffer(anna, code, 1);
    await gebaeudeWaehlen(anna, dz);
    await anna.locator('#heraus').click();
    await expect.poll(() => draussen(anna, bauern)).toBe(3);
  });

  test('bauen AC-60: fällt ein Wachturm mit zwei Dorfbewohnern darin, stehen beide lebend daneben', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, code } = partie;
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const turm = await gebaeudeInDerNaehe(anna, code, 'Anna', 'wachturm', { x: basis.x, y: basis.y - 3 }, { von: 6, bis: 12 });
    await anna.waitForFunction((id) => window.ansicht.gebaeude.has(id), turm);
    const turmMitte = await anna.evaluate((id) => window.ansicht.gebaeudeMitte(window.ansicht.gebaeude.get(id)), turm);
    const zwei = bauern.slice(0, 2);
    await waehlen(anna, zwei, { zoom: 1.8, blick: turmMitte });
    await anna.locator('#einquartieren').click();
    const punkt = await aufSeite(anna, { gebaeude: turm });
    await anna.mouse.click(punkt.x, punkt.y);
    await zeitraffer(anna, code, 4);
    await expect.poll(() => besatzung(anna, turm), { timeout: 30_000 }).toBe(2);
    await zeitraffer(anna, code, 1);
    await gebaeudeWaehlen(anna, turm);
    await expect(anna.locator('#besatzung')).toContainText('Besatzung 2 / 5');

    // Entfernt (bedienung AC-75) - er faellt, und beide stehen daneben.
    await anna.keyboard.press('Delete');
    await expect.poll(() => anna.evaluate((id) => window.ansicht.gebaeude.has(id), turm)).toBe(false);
    await expect.poll(() => draussen(anna, zwei)).toBe(2);
    const lage = await anna.evaluate(({ ids, m }) => ids.map((id) => {
      const e = window.ansicht.nachher.get(id);
      return { lebt: Boolean(e) && !e.s, weit: Math.hypot(e.x - m.x, e.y - m.y) };
    }), { ids: zwei, m: turmMitte });
    for (const e of lage) {
      expect(e.lebt).toBe(true);
      expect(e.weit, 'am Platz des Turms').toBeLessThan(4);
    }
    await waehlen(anna, zwei);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-60',
      titel: 'Der Wachturm liegt in Trümmern, die zwei Dorfbewohner von drinnen stehen gewählt daneben',
      test: info,
    });
  });

  test('bauen AC-61: die Notfallklingel am Dorfzentrum ruft die Dorfbewohner hinein, die Entwarnung lässt sie heraus', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, code } = partie;
    await expect.poll(() => draussen(anna, bauern)).toBe(3);
    await gebaeudeWaehlen(anna, dz);
    await anna.evaluate((m) => {
      window.ansicht.kamera.zoom = 1.8;
      window.ansicht.blickAuf(m.x, m.y);
    }, mitte);
    const glocke = anna.locator('#glocke');
    await expect(glocke).toHaveText(/Notfallklingel/);
    await anna.mouse.move(700, 300);
    await glocke.hover();
    await expect(anna.locator('#knopftafel')).toContainText('20 Felder');
    await glocke.click();

    // Sie laeutet: der Knopf heisst jetzt Entwarnung, und alle gehen hinein.
    const entwarnung = anna.locator('#entwarnung');
    await expect(entwarnung).toHaveText(/Entwarnung/);
    await expect(entwarnung).toHaveAttribute('aria-pressed', 'true');
    await zeitraffer(anna, code, 4);
    await expect.poll(() => draussen(anna, bauern), { timeout: 30_000 }).toBe(0);
    await zeitraffer(anna, code, 1);
    expect(await besatzung(anna, dz)).toBe(3);
    await expect(anna.locator('#besatzung')).toContainText('Besatzung 3 / 15');
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-61',
      titel: 'Die Notfallklingel läutet: alle drei Dorfbewohner sind im Dorfzentrum, der Knopf heißt jetzt „Entwarnung"',
      test: info,
    });

    await entwarnung.click();
    await expect.poll(() => draussen(anna, bauern)).toBe(3);
    await expect(anna.locator('#glocke')).toBeVisible();
    expect(await besatzung(anna, dz)).toBe(0);
  });
});
