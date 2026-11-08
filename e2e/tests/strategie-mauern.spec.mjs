// Mauern (→ specs/10-strategie/bauen.md AC-30): ab der Feudalzeit steht die
// Steinmauer im Baumenue. Gezogen von Feld zu Feld zeigt die Vorschau jedes
// Feld gruen oder rot; beim Loslassen entsteht je freies Feld eine Baustelle,
// und ein Dorfbewohner baut sie eine nach der anderen.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, gebaeudeAufstellen, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import {
  dorfbewohnerAnklicken, freieWiesen, gebaeudeInDerNaehe, partieBeenden, partieZuZweit,
} from '../helpers/strategie.mjs';
import { BAUTASTEN } from '../../public/tasten.js';

const BAUEN = '10-strategie/bauen.md';

test.describe('Mauern', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  // Die Wiese mit der Mauer aus bauen AC-30 - das Tor kommt in diese Mauer.
  let wiese;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  const baumenue = (page) => page.locator('#baumenue [data-bauen]').evaluateAll((k) => k.map((x) => x.dataset.bauen));
  // Ein Feld der Karte als Punkt auf der Seite - die Leinwand muss nicht bei 0, 0 liegen.
  const aufSeite = (page, feld) => page.evaluate((f) => {
    const a = window.ansicht;
    const p = a.zuBild(f.x, f.y);
    const r = a.leinwand.getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y };
  }, feld);
  const eigeneMauern = (page) => page.evaluate(() => [...window.ansicht.gebaeude.values()]
    .filter((g) => g.art === 'steinmauer' && g.b === window.ansicht.ich)
    .map((g) => ({ i: g.i, x: g.x, y: g.y, fertig: g.u === undefined })));

  test('bauen AC-30: eine Steinmauer gezogen - die Vorschau zeigt freie Felder gruen und belegte rot, gebaut wird je freies Feld', async ({}, info) => {
    const { anna, code } = partie;
    await rohstoffe(anna, code, 'Anna', { holz: 2000, nahrung: 2000, gold: 500, stein: 500 });
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);

    // Die Feudalzeit: ein zweites Gebaeude, dann der Aufstieg im Dorfzentrum.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'muehle', basis);
    await anna.keyboard.press('h');
    await anna.locator('[data-aufstieg="feudalzeit"]').click();
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => window.ansicht.zeitalter === 1, null, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);

    // Eine freie Wiese, mitten darin ein Haus (zwei mal zwei Felder) - quer
    // darueber wird die Mauer gezogen.
    [wiese] = await freieWiesen(anna, 1);
    const hausId = await gebaeudeAufstellen(anna, code, 'Anna', 'haus', wiese.x, wiese.y);
    await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), hausId);
    const von = { x: wiese.x - 4, y: wiese.y };
    const bis = { x: wiese.x + 4, y: wiese.y };

    await dorfbewohnerAnklicken(anna);
    await anna.evaluate((w) => {
      window.ansicht.kamera.zoom = 1.5;
      window.ansicht.blickAuf(w.x, w.y);
    }, wiese);
    await anna.keyboard.press('b');
    const menue = await baumenue(anna);
    expect(menue).toContain('steinmauer');
    await expect(anna.locator('#baumenue [data-bauen="steinmauer"]')).toHaveAttribute('title', /Steinmauer/);
    await anna.keyboard.press(BAUTASTEN[menue.indexOf('steinmauer')]);
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzieren?.art)).toBe('steinmauer');

    // Ziehen: am ersten Feld druecken, zum letzten fahren - noch nicht loslassen.
    const start = await aufSeite(anna, von);
    const ende = await aufSeite(anna, bis);
    await anna.mouse.move(start.x, start.y);
    await anna.mouse.down();
    await anna.mouse.move(ende.x, ende.y, { steps: 8 });
    const lage = await anna.evaluate(() => window.ansicht.platzLage());
    expect(lage.von).toEqual(von);
    expect(lage.bis).toEqual(bis);
    expect(lage.felder).toHaveLength(9);
    // Rot sind genau die zwei Felder unter dem Haus, alle anderen gruen.
    const rot = lage.felder.filter((f) => !f.taugt).map((f) => f.x);
    expect(rot).toEqual([wiese.x - 1, wiese.x]);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-30',
      titel: 'Eine Steinmauer wird quer über eine Wiese gezogen: freie Felder grün, die zwei Felder unter dem Haus rot',
      test: info,
    });

    // Loslassen: je freies Feld eine Baustelle, die zwei unter dem Haus fehlen.
    const steinVorher = await anna.evaluate(() => window.ansicht.vorraete.stein);
    await anna.mouse.up();
    await expect.poll(async () => (await eigeneMauern(anna)).length).toBe(7);
    const mauern = await eigeneMauern(anna);
    expect(mauern.map((m) => m.x).sort((p, q) => p - q)).toEqual(lage.felder.filter((f) => f.taugt).map((f) => f.x));
    expect(mauern.every((m) => m.y === wiese.y)).toBe(true);
    await expect.poll(() => anna.evaluate(() => window.ansicht.vorraete.stein)).toBe(steinVorher - 7 * 5);
    expect(await anna.evaluate(() => window.ansicht.platzieren)).toBeNull();

    // Der Dorfbewohner baut eine nach der anderen - alle sieben werden fertig.
    await zeitraffer(anna, code, 20);
    await expect.poll(async () => (await eigeneMauern(anna)).filter((m) => m.fertig).length, { timeout: 60_000 }).toBe(7);
    await zeitraffer(anna, code, 1);
    await anna.evaluate(() => {
      window.ansicht.ausgewaehlt.clear();
      window.ansicht.beiAuswahl();
    });
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-30',
      titel: 'Die fertige Steinmauer: sieben Felder links und rechts des Hauses, mit Zinnen und einem blauen Band für Anna',
      test: info,
    });
  });

  test('bauen AC-31: ein Tor ersetzt ein Feld der eigenen Mauer, und Annas Dorfbewohner geht hindurch', async ({}, info) => {
    const { anna, code } = partie;
    expect(wiese, 'die Mauer aus bauen AC-30 steht').toBeTruthy();
    const torfeld = { x: wiese.x + 2, y: wiese.y };
    const tore = () => anna.evaluate(() => [...window.ansicht.gebaeude.values()]
      .filter((g) => g.art === 'tor' && g.b === window.ansicht.ich)
      .map((g) => ({ i: g.i, x: g.x, y: g.y, fertig: g.u === undefined })));
    expect((await eigeneMauern(anna)).some((m) => m.x === torfeld.x && m.y === torfeld.y && m.fertig)).toBe(true);

    const bauer = await dorfbewohnerAnklicken(anna, { code });
    await anna.evaluate((w) => {
      window.ansicht.kamera.zoom = 2;
      window.ansicht.blickAuf(w.x, w.y);
    }, torfeld);
    await anna.keyboard.press('b');
    const menue = await baumenue(anna);
    expect(menue).toContain('tor');
    await expect(anna.locator('#baumenue [data-bauen="tor"]')).toHaveAttribute('title', /Tor/);
    await anna.keyboard.press(BAUTASTEN[menue.indexOf('tor')]);
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzieren?.art)).toBe('tor');

    // Ueber dem eigenen Mauerfeld ist die Vorschau gruen: das Tor ersetzt es.
    const ueber = await aufSeite(anna, torfeld);
    await anna.mouse.move(ueber.x, ueber.y);
    const lage = await anna.evaluate(() => window.ansicht.platzLage());
    expect({ x: lage.x, y: lage.y }).toEqual(torfeld);
    expect(lage.taugt).toBe(true);
    const steinVorher = await anna.evaluate(() => window.ansicht.vorraete.stein);
    await anna.mouse.click(ueber.x, ueber.y);
    await expect.poll(async () => (await tore(anna)).length).toBe(1);
    expect((await tore(anna))[0]).toMatchObject(torfeld);
    await expect.poll(async () => (await eigeneMauern(anna)).some((m) => m.x === torfeld.x && m.y === torfeld.y)).toBe(false);
    await expect.poll(() => anna.evaluate(() => window.ansicht.vorraete.stein)).toBe(steinVorher - 30);

    await zeitraffer(anna, code, 20);
    await expect.poll(async () => (await tore(anna))[0]?.fertig, { timeout: 60_000 }).toBe(true);
    await zeitraffer(anna, code, 1);

    // Hindurch: auf die andere Seite der Mauer, zwei Felder vom Tor. Fuer jeden
    // anderen ist das Torfeld bebaut - steht der Dorfbewohner darauf, hat die
    // Wegsuche es ihm geoeffnet. (Dass Bert dort keinen Weg hat, belegt der
    // Rechenteil im Mauerring, tests/strategie-mauern.test.mjs.)
    const id = bauer;
    const wo = () => anna.evaluate((i) => {
      const e = window.ansicht.nachher.get(i);
      return e ? { x: e.x, y: e.y } : null;
    }, id);
    const vorher = await wo();
    expect(vorher).not.toBeNull();
    const seite = vorher.y < torfeld.y ? 1 : -1;
    const ziel = { x: torfeld.x, y: torfeld.y + 2 * seite };
    await anna.evaluate((i) => {
      window.ansicht.ausgewaehlt.clear();
      window.ansicht.ausgewaehlt.add(i);
      window.ansicht.beiAuswahl();
    }, id);
    const zielPunkt = await aufSeite(anna, ziel);
    await anna.mouse.click(zielPunkt.x, zielPunkt.y, { button: 'right' });
    await anna.waitForFunction(([i, t]) => {
      const e = window.ansicht.nachher.get(i);
      return e && Math.abs(e.x - t.x) < 0.3 && Math.abs(e.y - t.y) < 0.3;
    }, [id, torfeld], { timeout: 30_000 });
    expect(await anna.evaluate((t) => {
      const tor = [...window.ansicht.gebaeude.values()].find((g) => g.art === 'tor' && g.x === t.x && g.y === t.y);
      return window.ansicht.torOffen(tor);
    }, torfeld)).toBe(true);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-31',
      titel: 'Ein Tor in Annas Steinmauer steht offen, ihr Dorfbewohner geht mitten hindurch',
      test: info,
    });
    await expect.poll(async () => {
      const e = await wo();
      return Math.sign(e.y - torfeld.y);
    }, { timeout: 30_000 }).toBe(seite);
  });
});
