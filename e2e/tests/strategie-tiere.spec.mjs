// Schafe im Browser: Rechtsklick eines Dorfbewohners auf ein eigenes Schaf,
// er schlachtet es und huetet Nahrung vom Kadaver
// (→ specs/10-strategie/einheiten-und-befehle.md AC-17).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test, zeitraffer } from '../helpers/seite.mjs';
import { dorfbewohnerAnklicken, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const EINHEITEN = '10-strategie/einheiten-und-befehle.md';

test.describe('Schafe', () => {
  test.describe.configure({ mode: 'serial' });

  let partie;
  let anna;
  let code;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
    ({ anna, code } = partie);
    await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 1.6;
      a.blickAuf(b.x + 2, b.y + 2);
    });
  });

  test.afterAll(() => partieBeenden(partie));

  test('einheiten AC-17: Rechtsklick auf ein eigenes Schaf - geschlachtet, der Dorfbewohner huetet Nahrung', async ({}, info) => {
    const hirte = await dorfbewohnerAnklicken(anna);
    // Das eigene Schaf, das vorn im Bild steht und dem Dorfbewohner am naechsten ist.
    const schaf = await anna.evaluate((id) => {
      const a = window.ansicht;
      const e = a.nachher.get(id);
      const g = a.karte.groesse;
      // Ohne Vorrat daneben: an Beeren oder Baeumen saehe man den Kadaver schlecht.
      const frei = (t) => {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (a.karte.felder[(Math.round(t.y) + dy) * g + Math.round(t.x) + dx] !== 0) return false;
          }
        }
        return true;
      };
      const eigene = [...a.tiere.values()].filter((t) => t.b === a.ich && !t.g && frei(t));
      eigene.sort((p, q) => Math.hypot(p.x - e.x, p.y - e.y) - Math.hypot(q.x - e.x, q.y - e.y));
      const t = eigene.find((s) => {
        const p = a.zuBild(s.x, s.y);
        return p.x > 100 && p.x < a.leinwand.clientWidth - 100 && p.y > 100 && p.y < a.leinwand.clientHeight - 250;
      });
      const p = a.zuBild(t.x, t.y);
      return { i: t.i, x: t.x, y: t.y, bild: { x: p.x, y: p.y - 6 } };
    }, hirte);
    await anna.mouse.click(schaf.bild.x, schaf.bild.y, { button: 'right' });

    await zeitraffer(anna, code, 5);
    await anna.waitForFunction(({ hirte: h, schaf: s }) => {
      const a = window.ansicht;
      const tier = a.tiere.get(s);
      const e = a.nachher.get(h);
      return tier?.g && e && e.l >= 4 && e.a === 'n' && Math.hypot(e.x - tier.x, e.y - tier.y) <= 1.5;
    }, { hirte, schaf: schaf.i }, { timeout: 30_000 });
    await zeitraffer(anna, code, 1);

    const lage = await anna.evaluate(({ hirte: h, schaf: s }) => {
      const a = window.ansicht;
      return { nahrung: a.tiere.get(s).n, traegt: a.nachher.get(h).l };
    }, { hirte, schaf: schaf.i });
    expect(lage.nahrung).toBeLessThan(100);
    expect(lage.nahrung).toBeGreaterThan(80);
    await expect(anna.locator('#ladung')).toContainText(/traegt \d+ Nahrung/);

    // Nah heran: Kadaver und Hirte.
    await anna.evaluate((s) => {
      const a = window.ansicht;
      a.kamera.zoom = 2.5;
      a.blickAuf(s.x, s.y);
    }, schaf);
    await anna.waitForTimeout(150);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-17',
      titel: 'Das Schaf liegt geschlachtet, Beine nach oben, der Dorfbewohner daneben traegt Nahrung im Korb',
      test: info,
    });
  });
});
