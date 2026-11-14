// Die Brache (→ specs/10-strategie/bauen.md AC-41, AC-42).
//
// Rueckmeldung des Benutzers: "eine farm muss auf automatisch renewal gestellt
// werden können, wenn das nicht ist, wird sie erstmal brach und kann mit
// rechtsklick einfache rneuert werden." Eine leere Farm bleibt als kahler
// Acker stehen; ein Rechtsklick mit einem Dorfbewohner saet sie fuer 60 Holz
// neu aus, und ein Schalter an der Farm laesst das von selbst geschehen.
//
// Die Regeln im Einzelnen (warten ohne Holz, einmal bezahlen, die KI) prueft
// tests/strategie-brache.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, gebaeudeAufstellen, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { freieWiesen, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';

/** Auswahl leeren und auf die Farm sehen. */
function blick(seite, ort, zoom = 2) {
  return seite.evaluate(([ort, zoom]) => {
    const a = window.ansicht;
    a.ausgewaehlt = new Set();
    a.gewaehltesGebaeude = null;
    a.angesehen = null;
    a.beiAuswahl();
    a.kamera.zoom = zoom;
    a.blickAuf(ort.x, ort.y);
  }, [ort, zoom]);
}

/** Wo ein Feld im Fenster liegt. */
function imFenster(seite, ort) {
  return seite.evaluate((ort) => {
    const a = window.ansicht;
    const p = a.zuBild(ort.x, ort.y);
    const r = a.leinwand.getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y };
  }, ort);
}

/** Annas Dorfbewohner, der dem Ort am naechsten steht und nichts tut - gewaehlt. */
function bauerWaehlen(seite, ort) {
  return seite.evaluate((ort) => {
    const a = window.ansicht;
    const frei = [...a.nachher.values()].filter((e) => e.b === a.ich && e.k === 'd' && !e.w && !e.s)
      .sort((p, q) => Math.hypot(p.x - ort.x, p.y - ort.y) - Math.hypot(q.x - ort.x, q.y - ort.y));
    if (!frei.length) return null;
    a.gewaehltesGebaeude = null;
    a.angesehen = null;
    a.ausgewaehlt = new Set([frei[0].i]);
    a.beiAuswahl();
    return frei[0].i;
  }, ort);
}

const farmStand = (seite, id) => seite.evaluate((id) => {
  const g = window.ansicht.gebaeude.get(id);
  return g ? { n: g.n, br: g.br || 0 } : null;
}, id);
const zeigerZiel = (seite) => seite.evaluate(() => {
  const z = window.ansicht.zeigerZiel;
  return z && { art: z.art, text: z.text };
});

test.describe('Die Brache', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let wiesen;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
    await partie.anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    wiesen = await freieWiesen(partie.anna, 2);
  });
  test.afterAll(() => partieBeenden(partie));

  test('bauen AC-41: eine leere Farm liegt brach - unten steht es, am Zeiger „Neu aussäen (60 Holz)“, ohne Holz eine Absage, und der Rechtsklick sät sie neu aus', async ({}, info) => {
    const { anna, code } = partie;
    const leiste = anna.locator('#auswahlleiste');
    const ort = wiesen[0];
    const farm = await gebaeudeAufstellen(anna, code, 'Anna', 'farm', ort.x, ort.y, { brach: true });
    await expect.poll(() => farmStand(anna, farm)).toEqual({ n: 0, br: 1 });

    // Die Farm anklicken: sie liegt brach, und der Schalter steht auf aus.
    await blick(anna, ort);
    const mitte = await imFenster(anna, ort);
    await anna.mouse.click(mitte.x, mitte.y);
    await expect(leiste.locator('.auswahl-kopf strong')).toHaveText('Farm');
    const zeile = leiste.locator('#farmvorrat');
    await expect(zeile).toHaveAttribute('data-brach', '1');
    await expect(zeile).toHaveText('Liegt brach – ein Rechtsklick mit einem Dorfbewohner sät neu aus (60 Holz)');
    const schalter = leiste.locator('#farmenschalter');
    await expect(schalter).toHaveAttribute('aria-pressed', 'false');
    await expect(schalter).toHaveText('Von selbst neu aussäen: aus');
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-41',
      titel: 'Eine leere Farm liegt brach: der kahle Acker bleibt stehen, unten steht, wie sie neu ausgesät wird, daneben der Schalter',
      test: info,
    });

    // Mit einem Dorfbewohner darauf zeigen: der Zeiger sagt, was es kostet.
    const bauer = await bauerWaehlen(anna, ort);
    expect(bauer).not.toBeNull();
    await anna.mouse.move(mitte.x + 3, mitte.y + 3);
    await anna.mouse.move(mitte.x, mitte.y);
    await expect.poll(() => zeigerZiel(anna)).toEqual({ art: 'aussaeen', text: 'Neu aussäen (60 Holz)' });

    // Ohne Holz: die Absage, und nichts geschieht.
    await rohstoffe(anna, code, 'Anna', { holz: 59 });
    await expect.poll(() => anna.evaluate(() => window.ansicht.vorraete.holz)).toBe(59);
    await anna.mouse.click(mitte.x, mitte.y, { button: 'right' });
    await expect(anna.locator('#spielmeldung')).toHaveText('Zu wenig Holz.');
    expect(await farmStand(anna, farm)).toEqual({ n: 0, br: 1 });
    expect(await anna.evaluate(() => window.ansicht.vorraete.holz)).toBe(59);

    // Mit Holz: bezahlt, voll, und der Dorfbewohner bestellt sie.
    await rohstoffe(anna, code, 'Anna', { holz: 200 });
    await expect.poll(() => anna.evaluate(() => window.ansicht.vorraete.holz)).toBe(200);
    await anna.mouse.click(mitte.x, mitte.y, { button: 'right' });
    await expect.poll(() => farmStand(anna, farm)).toEqual({ n: 175, br: 0 });
    expect(await anna.evaluate(() => window.ansicht.vorraete.holz)).toBe(140);
    await zeitraffer(anna, code, 6);
    await expect.poll(async () => (await farmStand(anna, farm)).n, { timeout: 30_000 }).toBeLessThan(175);
    await zeitraffer(anna, code, 1);
    expect(await anna.evaluate((id) => window.ansicht.nachher.get(id)?.w, bauer)).toBe(1);
    // Bestellt zeigt der Zeiger wieder das Gewohnte.
    await anna.mouse.move(mitte.x + 3, mitte.y + 3);
    await anna.mouse.move(mitte.x, mitte.y);
    await expect.poll(() => zeigerZiel(anna)).toEqual({ art: 'farm', text: 'Farm bestellen' });
  });

  test('bauen AC-42: der Schalter an der Farm - an, und beim letzten Korn wird bezahlt und ohne Pause weiter geerntet', async ({}, info) => {
    const { anna, code } = partie;
    const leiste = anna.locator('#auswahlleiste');
    const ort = wiesen[1];
    // Eine Farm kurz vor dem letzten Korn.
    const farm = await gebaeudeAufstellen(anna, code, 'Anna', 'farm', ort.x, ort.y, { nahrung: 3 });
    await expect.poll(() => farmStand(anna, farm)).toEqual({ n: 3, br: 0 });
    await rohstoffe(anna, code, 'Anna', { holz: 300 });

    await blick(anna, ort);
    const mitte = await imFenster(anna, ort);
    await anna.mouse.click(mitte.x, mitte.y);
    const schalter = leiste.locator('#farmenschalter');
    await expect(schalter).toHaveText('Von selbst neu aussäen: aus');
    await schalter.click();
    await expect(schalter).toHaveAttribute('aria-pressed', 'true');
    await expect(schalter).toHaveText('Von selbst neu aussäen: an');
    expect(await anna.evaluate(() => window.ansicht.farmenErneuern)).toBe(true);
    await expect(leiste.locator('#farmvorrat')).toHaveText('noch 3 Nahrung von 175');
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-42',
      titel: 'Eine fast leere Farm gewählt, der Schalter „Von selbst neu aussäen“ steht golden auf an',
      test: info,
    });

    // Ein Dorfbewohner erntet die letzten drei: danach ist bezahlt, und sie traegt wieder.
    const bauer = await bauerWaehlen(anna, ort);
    expect(bauer).not.toBeNull();
    await anna.mouse.click(mitte.x, mitte.y, { button: 'right' });
    await zeitraffer(anna, code, 6);
    await expect.poll(() => anna.evaluate(() => window.ansicht.vorraete.holz), { timeout: 60_000 }).toBe(240);
    await zeitraffer(anna, code, 1);
    const stand = await farmStand(anna, farm);
    expect(stand.br).toBe(0);
    expect(stand.n).toBeGreaterThan(150);
    // Brach war sie nie zu sehen - und der Bauer ist noch ihrer.
    await expect.poll(() => anna.evaluate((id) => window.ansicht.nachher.get(id)?.w, bauer)).toBe(1);

    // Der Schalter gilt allen Farmen: auch an der anderen steht er auf an - und laesst sich ausstellen.
    await blick(anna, wiesen[0]);
    const andere = await imFenster(anna, { x: wiesen[0].x + 1, y: wiesen[0].y - 1 });
    await anna.mouse.click(andere.x, andere.y);
    await expect(leiste.locator('.auswahl-kopf strong')).toHaveText('Farm');
    await expect(schalter).toHaveAttribute('aria-pressed', 'true');
    await schalter.click();
    await expect(schalter).toHaveAttribute('aria-pressed', 'false');
    expect(await anna.evaluate(() => window.ansicht.farmenErneuern)).toBe(false);
  });
});
