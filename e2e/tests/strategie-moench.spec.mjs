// Der Moench (→ specs/10-strategie/einheiten-und-befehle.md AC-37): er steht
// neben einer verletzten eigenen Miliz, hebt den Stab und heilt sie - ihr
// Leben steigt, und an der Spitze seines Stabes glimmt ein Schein, solange
// er heilt. Die Regeln selbst (je Sekunde ein Punkt, nicht Gebaeude, nicht
// Belagerung, nicht wer kaempft) prueft tests/strategie-moench.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, lebenSetzen, test, zeitraffer } from '../helpers/seite.mjs';
import {
  bedienteileFrei, figurenFrei, freieWiesen, partieBeenden, partieZuZweit,
} from '../helpers/strategie.mjs';

const EINHEITEN = '10-strategie/einheiten-und-befehle.md';

test.describe('Moench', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('einheiten AC-37: der Moench heilt eine verletzte Miliz neben ihm - ihr Leben steigt, und er hebt dabei den Stab', async ({}, info) => {
    const { anna, code } = partie;
    const [wiese] = await freieWiesen(anna, 1);
    const kuerzel = await anna.evaluate(() => {
      const e = window.ansicht.werte.einheiten;
      return { moench: e.moench.kuerzel, miliz: e.miliz.kuerzel };
    });

    // Annas Moench und zwei Felder daneben ihre Miliz, mitten auf der Wiese.
    await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'moench', x: wiese.x - 1, y: wiese.y });
    await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'miliz', x: wiese.x + 1, y: wiese.y });
    const { moench, miliz } = await anna.waitForFunction(([k, w]) => {
      const a = window.ansicht;
      const nahe = (e) => Math.hypot(e.x - w.x, e.y - w.y) < 4;
      const moench = [...a.nachher.values()].find((e) => e.k === k.moench && e.b === a.ich && nahe(e));
      const miliz = [...a.nachher.values()].find((e) => e.k === k.miliz && e.b === a.ich && nahe(e));
      return moench && miliz && { moench: { i: moench.i }, miliz: { i: miliz.i } };
    }, [kuerzel, wiese]).then((h) => h.jsonValue());

    // Noch ist niemand verletzt: der Moench arbeitet nicht.
    await expect.poll(() => anna.evaluate((id) => window.ansicht.nachher.get(id)?.w, moench.i)).toBeFalsy();

    // Die Miliz verliert gut die Haelfte ihres Lebens (Pruefgriff - wie sie
    // es verliert, belegt der Kampf). Ab dann steigt es, und er arbeitet.
    const voll = await anna.evaluate(() => window.ansicht.werte.einheiten.miliz.leben);
    const rest = Math.round(voll * 0.4);
    await lebenSetzen(anna, code, miliz.i, rest);
    await expect.poll(() => anna.evaluate((id) => window.ansicht.nachher.get(id)?.w, moench.i), { timeout: 10_000 }).toBe(1);
    await expect.poll(() => anna.evaluate((id) => window.ansicht.nachher.get(id)?.h, miliz.i), { timeout: 10_000 })
      .toBeGreaterThanOrEqual(rest + 2);
    // Fuer das Bild anhalten, bevor sie wieder voll ist.
    await zeitraffer(anna, code, 0);
    const jetzt = await anna.evaluate((id) => window.ansicht.nachher.get(id).h, miliz.i);
    expect(jetzt, 'noch nicht voll').toBeLessThan(voll);

    const waehlen = (id) => anna.evaluate(([e, w]) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set([e]);
      a.beiAuswahl();
      a.kamera.zoom = 2.5;
      a.blickAuf(w.x, w.y + 0.6);
    }, [id, wiese]);

    // Den Moench gewaehlt: die Leiste sagt, dass er nicht angreift, aber
    // heilt - kein "Angriff 0, Nahkampf".
    await waehlen(moench.i);
    const werte = anna.locator('#kampfwerte');
    await expect(werte).toBeInViewport();
    await expect(werte).toContainText('Greift nicht an');
    await expect(werte).toContainText('Heilt');
    await expect(werte).not.toContainText('Nahkampf');
    await expect(werte).toHaveAttribute('data-heilen', '1');

    // Ein Rechtsklick des Moenchs auf ein fremdes Gebaeude ist nur ein Gang -
    // das Zeichen bleibt weiss, wie der Server ohne Angriff keinen beginnt.
    // Gefragt wird dieselbe Stelle, die der Klick fragt, an Berts
    // Dorfzentrum; zum Vergleich die Miliz, fuer die es ein Angriff ist (rot).
    const zeichenAufBert = (id) => anna.evaluate((e) => {
      const a = window.ansicht;
      const zentrum = [...a.gebaeude.values()].find((g) => g.b !== a.ich && g.art === 'dorfzentrum');
      const vorher = a.ausgewaehlt;
      a.ausgewaehlt = new Set([e]);
      a.zielzeichenSetzen(a.gebaeudeMitte(zentrum));
      const feindlich = a.zielzeichen.feindlich;
      a.zielzeichen = null;
      a.ausgewaehlt = vorher;
      return feindlich;
    }, id);
    expect(await zeichenAufBert(moench.i), 'fuer den Moench ein Gang').toBe(false);
    expect(await zeichenAufBert(miliz.i), 'fuer die Miliz ein Angriff').toBe(true);

    // Fuer das Bild die Miliz gewaehlt: ihr Lebensbalken steht ueber ihr.
    await waehlen(miliz.i);
    const lage = await anna.evaluate(([m, z]) => {
      const a = window.ansicht;
      const p = (id) => { const e = a.nachher.get(id); return a.zuBild(e.x, e.y); };
      return { m: p(m), z: p(z), b: a.leinwand.clientWidth, h: a.leinwand.clientHeight };
    }, [moench.i, miliz.i]);
    for (const p of [lage.m, lage.z]) {
      expect(p.x).toBeGreaterThan(80);
      expect(p.x).toBeLessThan(lage.b - 80);
      expect(p.y).toBeGreaterThan(160);
      expect(p.y).toBeLessThan(lage.h - 240);
    }
    expect(await bedienteileFrei(anna)).toEqual([]);
    expect(await figurenFrei(anna)).toEqual([]);
    await anna.waitForTimeout(150);

    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-37',
      titel: 'Annas Mönch (blau) hebt den Stab, an dessen Spitze ein warmer Schein glimmt: er heilt ihre gewählte Miliz daneben – deren Lebensbalken ist noch nicht voll',
      test: info,
    });
    await zeitraffer(anna, code, 1);
  });
});
