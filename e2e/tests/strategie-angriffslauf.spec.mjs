// Der Angriffslauf im Browser (→ specs/10-strategie/kampf.md AC-4): G schaltet
// die Betriebsart ein, der naechste Rechtsklick auf freies Gelaende schickt
// die Auswahl los - und unterwegs wird angegriffen, was im Weg steht.
//
// Als Hindernis steht ein fremder **Dorfbewohner** im Weg, keine Kampfeinheit:
// ein Dorfbewohner wehrt sich nie von selbst (kampf AC-2). Wenn er Schaden
// nimmt, kann das nur vom Angriffslauf kommen - eine Miliz haette auch ohne
// Befehl zugeschlagen, und der Nachweis waere keiner.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, figurenFrei, freieWiesen, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const KAMPF = '10-strategie/kampf.md';

test.describe('Angriffslauf', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let meine;
  let opfer;
  let marschziel;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel: aufgedeckt, sonst kommt Bert gar nicht an (kampf AC-13).
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
    const { anna, code } = partie;
    const [wiese] = await freieWiesen(anna, 1);
    // Annas zwei Milizen links, Berts Dorfbewohner in der Mitte, das Marschziel
    // rechts - alles auf einer Linie, damit er wirklich im Weg steht.
    marschziel = { x: wiese.x + 4, y: wiese.y + 4 };
    expect(await einheitenAufstellen(anna, code, 'Anna', 2, { art: 'miliz', x: wiese.x - 4, y: wiese.y - 4 })).toBe(2);
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'dorfbewohner', x: wiese.x, y: wiese.y })).toBe(1);
    await anna.waitForFunction(() => [...window.ansicht.nachher.values()].filter((e) => e.k === 'm').length >= 2);
    const alle = await anna.evaluate(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].map((e) => ({ i: e.i, k: e.k, eigen: e.b === a.ich, x: e.x, y: e.y }));
    });
    meine = alle.filter((e) => e.eigen && e.k === 'm');
    expect(meine.length).toBe(2);
  });
  test.afterAll(() => partieBeenden(partie));

  test('kampf AC-4: G und ein Rechtsklick auf freies Gelaende - unterwegs wird angegriffen', async ({}, info) => {
    const { anna, code } = partie;

    // Berts Dorfbewohner steht unbehelligt zwischen beiden Punkten.
    opfer = await anna.evaluate((mitte) => {
      const a = window.ansicht;
      let bester = null;
      for (const e of a.nachher.values()) {
        if (e.b === a.ich || e.k !== 'd') continue;
        const d = Math.hypot(e.x - mitte.x, e.y - mitte.y);
        if (!bester || d < bester.d) bester = { i: e.i, x: e.x, y: e.y, h: e.h, d };
      }
      return bester;
    }, { x: marschziel.x - 4, y: marschziel.y - 4 });
    expect(opfer, 'Berts Dorfbewohner steht da').toBeTruthy();
    expect(opfer.h, 'und ist unverletzt - voll wird nicht geschickt').toBeUndefined();

    const bild = await anna.evaluate(([ids, ziel]) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set(ids);
      a.beiAuswahl();
      a.kamera.zoom = 2.2;
      const mitte = a.nachher.get(ids[0]);
      a.blickAuf((mitte.x + ziel.x) / 2, (mitte.y + ziel.y) / 2);
      return a.zuBild(ziel.x, ziel.y);
    }, [meine.map((e) => e.i), marschziel]);

    // G schaltet die Betriebsart ein - sichtbar am Zeiger.
    await anna.keyboard.press('g');
    expect(await anna.evaluate(() => window.ansicht.angriffslauf), 'Betriebsart an').toBe(true);
    await expect(anna.locator('#brett')).toHaveClass(/angriffslauf/);

    // Der Rechtsklick auf leeres Gras: ein Angriffsbefehl, also ein rotes
    // Zeichen (bedienung AC-34) - und die Betriebsart ist wieder aus.
    await anna.mouse.click(bild.x, bild.y, { button: 'right' });
    const nachKlick = await anna.evaluate(() => ({
      an: window.ansicht.angriffslauf,
      zeichen: { ...window.ansicht.zielzeichen },
    }));
    expect(nachKlick.an, 'die Betriebsart haelt nur bis zum Klick').toBe(false);
    expect(nachKlick.zeichen.feindlich, 'ein Angriffsbefehl, auch auf leeres Gras').toBe(true);

    // Und jetzt das Eigentliche: der Dorfbewohner im Weg nimmt Schaden, obwohl
    // ihn niemand angeklickt hat.
    // `h` sind Lebenspunkte, kein Anteil - voll wird gar nicht erst geschickt.
    await anna.waitForFunction((id) => {
      const a = window.ansicht;
      const e = a.nachher.get(id);
      return e && e.h > 0 && e.h < a.lebenVoll(e) / 2;
    }, opfer.i, { timeout: 60_000 });
    await zeitraffer(anna, code, 0);

    const lage = await anna.evaluate((id) => {
      const a = window.ansicht;
      const e = a.nachher.get(id);
      // Nur die Beteiligten muessen im Bild stehen, nicht die Dorfbewohner
      // an der eigenen Basis - die sind weit weg und gehoeren nicht aufs Bild.
      const nah = [...a.nachher.values()]
        .filter((m) => m.b === a.ich && Math.hypot(m.x - e.x, m.y - e.y) <= 1.6);
      const punkte = [e, ...nah].map((m) => a.zuBild(m.x, m.y));
      return { anteil: e.h / a.lebenVoll(e), nah: nah.length, punkte, feld: { b: a.leinwand.clientWidth, h: a.leinwand.clientHeight } };
    }, opfer.i);
    expect(lage.anteil, 'sein Balken ist weniger als halb voll').toBeLessThan(0.5);
    expect(lage.anteil, 'er lebt noch').toBeGreaterThan(0);
    expect(lage.nah, 'beide Milizen stehen dicht dabei').toBe(2);
    for (const p of lage.punkte) {
      expect(p.x, 'im Bild').toBeGreaterThan(40);
      expect(p.x).toBeLessThan(lage.feld.b - 40);
      expect(p.y).toBeGreaterThan(60);
      expect(p.y).toBeLessThan(lage.feld.h - 220);
    }
    expect(await bedienteileFrei(anna)).toEqual([]);
    expect(await figurenFrei(anna)).toEqual([]);

    await nachweis(anna, {
      spec: KAMPF,
      ac: 'AC-4',
      titel: 'Im Angriffslauf schlagen Annas zwei Milizen (blau) auf Berts Dorfbewohner (rot) ein, der im Weg steht — befohlen war nur der Marsch auf das leere Feld dahinter',
      test: info,
    });
    await zeitraffer(anna, code, 1);
  });
});
