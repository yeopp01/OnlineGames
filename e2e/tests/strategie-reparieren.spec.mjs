// Reparieren (→ specs/10-strategie/bauen.md AC-45).
//
// Rueckmeldung des Benutzers: "Dorfbewohner reparieren gebäude - geht noch
// nicht oder?" Ein Rechtsklick mit einem Dorfbewohner auf ein beschaedigtes
// Gebaeude repariert es - am Zeiger steht es vorher, das Leben steigt, und
// bezahlt wird Punkt fuer Punkt zum halben Baupreis.
//
// Die Regeln im Einzelnen (der zweite schafft die Haelfte, Verbuendete, was
// eine Baustelle, eine Farm und ein Lager bleiben) prueft
// tests/strategie-reparieren.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import {
  einheitenAufstellen, expect, gebaeudeAufstellen, lebenSetzen, rohstoffe, test, zeitraffer,
} from '../helpers/seite.mjs';
import { bedienteileFrei, freieWiesen, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';

const zeigerZiel = (seite) => seite.evaluate(() => {
  const z = window.ansicht.zeigerZiel;
  return z && { art: z.art, text: z.text };
});

test.describe('Reparieren', () => {
  let partie;
  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
    await partie.anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
  });
  test.afterAll(() => partieBeenden(partie));

  test('bauen AC-45: ein Rechtsklick auf die beschaedigte Kaserne - am Zeiger steht „Reparieren“, ohne Holz eine Absage, dann steigt ihr Leben und das Holz sinkt', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, code } = partie;
    const [ort] = await freieWiesen(anna, 1);
    const kaserne = await gebaeudeAufstellen(anna, code, 'Anna', 'kaserne', ort.x, ort.y);
    await anna.waitForFunction((id) => window.ansicht.gebaeude.has(id), kaserne);
    // Vor der Kaserne, damit man ihn haemmern sieht.
    await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'dorfbewohner', x: ort.x + 1, y: ort.y + 3 });
    const bauer = await anna.waitForFunction((o) => {
      const a = window.ansicht;
      const e = [...a.nachher.values()].find((e) => e.b === a.ich && e.k === 'd' && Math.hypot(e.x - (o.x + 1), e.y - (o.y + 3)) < 2.5);
      return e && e.i;
    }, ort).then((h) => h.jsonValue());
    const voll = await anna.evaluate(() => window.ansicht.werte.gebaeude.kaserne.leben);
    expect(voll).toBe(1200);
    const leben = () => anna.evaluate((id) => window.ansicht.gebaeude.get(id).h, kaserne);
    const holz = () => anna.evaluate(() => window.ansicht.vorraete.holz);
    const arbeit = () => anna.evaluate((id) => {
      const e = window.ansicht.nachher.get(id);
      return [e?.w || 0, e?.rp || 0];
    }, bauer);

    // Der Dorfbewohner gewaehlt, der Blick auf der Kaserne, der Zeiger auf ihrem Dach.
    await anna.evaluate(([id, o]) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.angesehen = null;
      a.ausgewaehlt = new Set([id]);
      a.beiAuswahl();
      a.kamera.zoom = 2;
      a.blickAuf(o.x, o.y);
    }, [bauer, ort]);
    const dach = await anna.evaluate((id) => {
      const a = window.ansicht;
      const m = a.gebaeudeMitte(a.gebaeude.get(id));
      const p = a.zuBild(m.x, m.y);
      const r = a.leinwand.getBoundingClientRect();
      return { x: r.left + p.x, y: r.top + p.y - 20 };
    }, kaserne);
    const zeigen = async () => {
      await anna.mouse.move(dach.x + 3, dach.y + 3);
      await anna.mouse.move(dach.x, dach.y);
    };

    // Ganz: der Rechtsklick waere nur ein Gang.
    await zeigen();
    await anna.waitForTimeout(200);
    expect(await zeigerZiel(anna), 'eine ganze Kaserne: kein Ziel').toBeNull();

    // Beschaedigt: am Zeiger steht „Reparieren“.
    await lebenSetzen(anna, code, kaserne, 700);
    await expect.poll(leben).toBe(700);
    await zeigen();
    await expect.poll(() => zeigerZiel(anna)).toEqual({ art: 'reparieren', text: 'Reparieren' });

    // Ohne Holz: die Absage, und niemand geht los.
    await rohstoffe(anna, code, 'Anna', { holz: 0 });
    await expect.poll(holz).toBe(0);
    await anna.mouse.click(dach.x, dach.y, { button: 'right' });
    await expect(anna.locator('#spielmeldung')).toHaveText('Zu wenig Holz für die Reparatur.');
    expect(await leben()).toBe(700);

    // Mit Holz: er geht hin und haemmert, das Leben steigt, das Holz sinkt.
    await rohstoffe(anna, code, 'Anna', { holz: 100 });
    await expect.poll(holz).toBe(100);
    await anna.mouse.click(dach.x, dach.y, { button: 'right' });
    expect(await anna.evaluate(() => window.ansicht.zielzeichen?.feindlich), 'kein Angriff').toBe(false);
    await expect.poll(leben, { timeout: 20_000 }).toBeGreaterThan(760);
    await zeitraffer(anna, code, 0);
    expect(await arbeit(), 'er arbeitet und haemmert').toEqual([1, 1]);
    const unterwegs = { leben: await leben(), holz: await holz() };
    expect(unterwegs.leben).toBeLessThan(voll);
    expect(unterwegs.holz, 'bezahlt wird Punkt fuer Punkt').toBeLessThan(100);
    expect(unterwegs.holz).toBeGreaterThan(64);

    // Fuer das Bild: die Welt steht, der Zeiger liegt auf der Kaserne.
    await zeigen();
    await expect.poll(() => zeigerZiel(anna)).toEqual({ art: 'reparieren', text: 'Reparieren' });
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(150);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-45',
      titel: 'Annas Dorfbewohner hämmert an ihrer beschädigten Kaserne: am Zeiger steht „Reparieren“, ihr Lebensbalken ist noch nicht voll, und oben fehlt schon Holz',
      test: info,
    });

    // Bis sie ganz ist: 500 von 1200 Leben kosten 36 Holz - den halben
    // Baupreis von 175, anteilig. Danach steht er, und der Zeiger zeigt
    // wieder nichts.
    await zeitraffer(anna, code, 6);
    await expect.poll(leben, { timeout: 60_000 }).toBe(voll);
    await zeitraffer(anna, code, 1);
    await expect.poll(arbeit).toEqual([0, 0]);
    expect(await holz()).toBe(64);
    await zeigen();
    await expect.poll(() => zeigerZiel(anna)).toBeNull();
  });
});
