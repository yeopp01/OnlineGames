// Belagerung (→ specs/10-strategie/einheiten-und-befehle.md AC-35): die Ramme
// greift nur Gebaeude an. Ein Rechtsklick auf eine fremde Einheit ist fuer sie
// ein Gang dorthin (das Zeichen bleibt weiss), einer auf ein fremdes Gebaeude
// ein Angriff (rot), und sie stoesst es mit 127 je Schlag ein. Die Regeln
// selbst prueft tests/strategie-belagerung.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, gebaeudeAufstellen, test, zeitraffer } from '../helpers/seite.mjs';
import {
  bedienteileFrei, figurenFrei, freieWiesen, partieBeenden, partieZuZweit,
} from '../helpers/strategie.mjs';

const EINHEITEN = '10-strategie/einheiten-und-befehle.md';
const KAMPF = '10-strategie/kampf.md';

test.describe('Belagerung', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  // Ein Feld der Karte als Punkt auf der Seite.
  const aufSeite = (page, feld) => page.evaluate((f) => {
    const a = window.ansicht;
    const p = a.zuBild(f.x, f.y);
    const r = a.leinwand.getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y };
  }, feld);

  test('einheiten AC-35: die Ramme geht zu einer fremden Einheit nur hin und stoesst ein fremdes Haus ein', async ({}, info) => {
    const { anna, code } = partie;
    const [wiese] = await freieWiesen(anna, 1);
    const kuerzel = await anna.evaluate(() => window.ansicht.werte.einheiten.ramme.kuerzel);

    // Berts Haus mitten auf der Wiese, sein Dorfbewohner drei Felder darunter,
    // Annas Ramme links davon. Der Dorfbewohner wacht nicht und laeuft nicht
    // weg - Bert spielt nicht.
    const hausId = await gebaeudeAufstellen(anna, code, 'Bert', 'haus', wiese.x + 1, wiese.y);
    await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'dorfbewohner', x: wiese.x - 1, y: wiese.y + 3 });
    await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'ramme', x: wiese.x - 4, y: wiese.y });
    await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), hausId);
    const { ramme, bauer } = await anna.waitForFunction(([k, w]) => {
      const a = window.ansicht;
      const nahe = (e) => Math.hypot(e.x - w.x, e.y - w.y) < 7;
      const ramme = [...a.nachher.values()].find((e) => e.k === k && e.b === a.ich && nahe(e));
      const bauer = [...a.nachher.values()].find((e) => e.k === 'd' && e.b !== a.ich && nahe(e));
      return ramme && bauer && { ramme: { i: ramme.i }, bauer: { x: bauer.x, y: bauer.y } };
    }, [kuerzel, wiese]).then((h) => h.jsonValue());

    await anna.evaluate(([id, w]) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set([id]);
      a.beiAuswahl();
      a.kamera.zoom = 2.2;
      a.blickAuf(w.x, w.y + 1);
    }, [ramme.i, wiese]);

    // 1. Rechtsklick auf Berts Dorfbewohner: fuer jeden anderen Kaempfer ein
    // Angriff mit rotem Zeichen (bedienung AC-34), fuer die Ramme ein Gang -
    // das Zeichen ist weiss.
    const aufBauer = await aufSeite(anna, bauer);
    await anna.mouse.click(aufBauer.x, aufBauer.y, { button: 'right' });
    const zeichen = await anna.evaluate(() => window.ansicht.zielzeichen && { ...window.ansicht.zielzeichen });
    expect(zeichen, 'ein Zeichen steht').toBeTruthy();
    expect(zeichen.feindlich, 'eine Einheit ist fuer die Ramme kein Ziel').toBe(false);

    // 2. Rechtsklick auf Berts Haus: rot, und sie stoesst zu.
    const mitte = await anna.evaluate((g) => window.ansicht.gebaeudeMitte(window.ansicht.gebaeude.get(g)), hausId);
    const aufHaus = await aufSeite(anna, mitte);
    await anna.mouse.click(aufHaus.x, aufHaus.y, { button: 'right' });
    expect(await anna.evaluate(() => window.ansicht.zielzeichen.feindlich), 'das Haus ist ein Ziel').toBe(true);
    const voll = await anna.evaluate((g) => window.ansicht.gebaeude.get(g).h, hausId);
    await zeitraffer(anna, code, 6);
    // Zwei Stoesse zu 127, dann die Welt anhalten - das Haus steht noch
    // (550 Leben), die Ramme liegt daran.
    await expect.poll(() => anna.evaluate((g) => window.ansicht.gebaeude.get(g)?.h, hausId), { timeout: 60_000 })
      .toBeLessThanOrEqual(voll - 2 * 127);
    await zeitraffer(anna, code, 0);
    const verlust = voll - await anna.evaluate((g) => window.ansicht.gebaeude.get(g).h, hausId);
    expect(verlust % 127, `je Stoss 127, verloren ${verlust}`).toBe(0);

    // Die Ramme steht am Haus, im Bild, und nichts verdeckt sie.
    const lage = await anna.evaluate(([id, g]) => {
      const a = window.ansicht;
      const e = a.nachher.get(id);
      const haus = a.gebaeudeMitte(a.gebaeude.get(g));
      a.blickAuf((e.x + haus.x) / 2, (e.y + haus.y) / 2 + 1);
      const p = a.zuBild(e.x, e.y);
      return { abstand: Math.hypot(e.x - haus.x, e.y - haus.y), p, b: a.leinwand.clientWidth, h: a.leinwand.clientHeight };
    }, [ramme.i, hausId]);
    expect(lage.abstand, 'am Haus').toBeLessThan(2.6);
    expect(lage.p.x).toBeGreaterThan(80);
    expect(lage.p.x).toBeLessThan(lage.b - 80);
    expect(lage.p.y).toBeGreaterThan(120);
    expect(lage.p.y).toBeLessThan(lage.h - 240);
    expect(await bedienteileFrei(anna)).toEqual([]);
    expect(await figurenFrei(anna)).toEqual([]);

    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-35',
      titel: 'Annas Ramme (blau) steht an Berts Haus (rot) und stößt es ein — sein Lebensbalken ist schon kürzer; Berts Dorfbewohner daneben lässt sie stehen',
      test: info,
    });
  });

  test('einheiten AC-36, kampf AC-19: der Mangonel wirft einen Stein, der drei nebeneinander trifft - den in der Mitte am meisten', async ({}, info) => {
    const { anna, bert, code } = partie;
    // Der Fall davor hat die Welt angehalten, und seine Wiese ist belegt.
    await zeitraffer(anna, code, 1);
    const [, wiese] = await freieWiesen(anna, 2);
    const kuerzel = await anna.evaluate(() => {
      const e = window.ansicht.werte.einheiten;
      return { mangonel: e.mangonel.kuerzel, speer: e.speerkaempfer.kuerzel };
    });

    // Berts drei Speerkaempfer in einer Reihe, ein Feld auseinander: der Ring
    // um (x+4, y+1) beginnt oben mit (x+3..x+5, y). Annas Mangonel zehn Felder
    // links davon - weiter, als er sieht (9), sonst naehme er sich den
    // naechsten schon von selbst, bevor der Befehl kommt. Die Sicht der
    // Speerkaempfer (4) reicht nicht bis zu ihm: sie stehen still, bis der
    // Stein kommt.
    await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'mangonel', x: wiese.x - 7, y: wiese.y });
    await einheitenAufstellen(anna, code, 'Bert', 3, { art: 'speerkaempfer', x: wiese.x + 4, y: wiese.y + 1 });
    const { mangonel, speer } = await anna.waitForFunction(([k, w]) => {
      const a = window.ansicht;
      const nahe = (e) => Math.hypot(e.x - w.x, e.y - w.y) < 9;
      const mangonel = [...a.nachher.values()].find((e) => e.k === k.mangonel && e.b === a.ich && nahe(e));
      const speer = [...a.nachher.values()].filter((e) => e.k === k.speer && e.b !== a.ich && nahe(e));
      return mangonel && speer.length === 3 && {
        mangonel: { i: mangonel.i, x: mangonel.x, y: mangonel.y },
        speer: speer.map((e) => ({ i: e.i, x: e.x, y: e.y, h: e.h })).sort((p, q) => p.x - q.x),
      };
    }, [kuerzel, wiese]).then((h) => h.jsonValue());
    expect(speer.map((e) => e.y), 'in einer Reihe').toEqual([speer[0].y, speer[0].y, speer[0].y]);
    const mitte = speer[1];

    await anna.evaluate(([id, w]) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set([id]);
      a.beiAuswahl();
      a.kamera.zoom = 1.7;
      a.blickAuf(w.x - 1, w.y + 1);
    }, [mangonel.i, wiese]);

    // 1. Rechtsklick auf den mittleren: ein Angriff, das Zeichen ist rot.
    const aufMitte = await aufSeite(anna, mitte);
    await anna.mouse.click(aufMitte.x, aufMitte.y, { button: 'right' });
    expect(await anna.evaluate(() => window.ansicht.zielzeichen.feindlich), 'ein Speerkaempfer ist ein Ziel').toBe(true);

    // Er faehrt heran, bis der mittlere in Reichweite ist, und wirft. Den
    // Stein halten wir, sobald er im Bild ist, auf knapp der Haelfte seines
    // Wegs fest - im Bild, nicht auf dem Server.
    const flug = await anna.waitForFunction(() => {
      const stein = window.ansicht.pfeile.find((p) => p.stein);
      if (!stein) return false;
      stein.dauer = 1e9;
      stein.start = performance.now() - 0.45e9;
      return { x0: stein.x0, y0: stein.y0, x1: stein.x1, y1: stein.y1 };
    }, null, { timeout: 30_000 }).then((h) => h.jsonValue());
    await zeitraffer(anna, code, 0);
    expect([flug.x1, flug.y1], 'der Stein fliegt auf den mittleren').toEqual([mitte.x, mitte.y]);
    expect(Math.hypot(flug.x1 - flug.x0, flug.y1 - flug.y0), 'aus hoechstens sieben Feldern').toBeLessThanOrEqual(7.6);
    // Die Kamera auf die Mitte zwischen Werfer und Ziel.
    await anna.evaluate((f) => {
      window.ansicht.kamera.zoom = 2.2;
      window.ansicht.blickAuf((f.x0 + f.x1) / 2, (f.y0 + f.y1) / 2 + 0.5);
    }, flug);
    expect(await bedienteileFrei(anna)).toEqual([]);
    expect(await figurenFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-36',
      titel: 'Annas Mangonel (blau) hat geworfen: sein Stein fliegt im Bogen auf Berts drei Speerkämpfer (rot), die in einer Reihe stehen',
      test: info,
    });

    // 2. Weiter, bis der Stein eingeschlagen ist: alle drei verlieren Leben,
    // der mittlere, auf dessen Platz er fiel, am meisten.
    // `h` kommt erst, wenn Leben fehlt; voll ist der Wert aus der Tafel -
    // gelesen, bevor die Welt weiterlaeuft und der Stein einschlaegt.
    const leben = () => bert.evaluate((liste) => liste.map((e) => {
      const n = window.ansicht.nachher.get(e.i);
      return n ? (n.h ?? window.ansicht.lebenVoll(n)) : 0;
    }), speer);
    const voll = await bert.evaluate((i) => window.ansicht.lebenVoll(window.ansicht.nachher.get(i)), speer[0].i);
    await anna.evaluate(() => { window.ansicht.pfeile = []; });
    await zeitraffer(anna, code, 1);
    // Der naechste Stein kommt erst nach sechs Sekunden - bis dahin stehen
    // alle drei mit dem Verlust des ersten.
    await expect.poll(async () => (await leben()).every((h) => h > 0 && h < voll), { timeout: 15_000 }).toBe(true);
    await zeitraffer(anna, code, 0);
    const verluste = (await leben()).map((h) => voll - h);
    expect(verluste[1], `Verluste ${verluste}`).toBeGreaterThan(verluste[0]);
    expect(verluste[1], `Verluste ${verluste}`).toBeGreaterThan(verluste[2]);

    // Bert waehlt seine drei - so stehen ihre Lebensbalken im Bild.
    await bert.evaluate(([ids, m]) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set(ids);
      a.beiAuswahl();
      a.kamera.zoom = 2.2;
      a.blickAuf(m.x - 1.5, m.y + 1);
    }, [speer.map((e) => e.i), mitte]);
    expect(await bedienteileFrei(bert)).toEqual([]);
    expect(await figurenFrei(bert)).toEqual([]);
    await nachweis(bert, {
      spec: KAMPF,
      ac: 'AC-19',
      titel: 'Ein Stein von Annas Mangonel (blau) hat Berts drei Speerkämpfer getroffen: der mittlere, auf den er zielte, hat am meisten Leben verloren, die beiden daneben weniger',
      test: info,
    });
  });
});
