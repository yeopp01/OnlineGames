// Eine Gruppe im Browser: die Auswahlliste mit Anzahl je Typ
// (→ specs/10-strategie/bedienung.md AC-6) und ein Befehl fuer viele, die sich
// am Ziel nebeneinander aufstellen (einheiten-und-befehle.md AC-20).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test } from '../helpers/seite.mjs';
import { bedienteileFrei, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';
const EINHEITEN = '10-strategie/einheiten-und-befehle.md';

test.describe('Gruppe', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
    await partie.anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 1.6;
      a.blickAuf(b.x + 4, b.y + 4);
    });
    await partie.anna.waitForTimeout(200);
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-6: vier im Rahmen - unten die Zahl und je Typ ein Bild mit Anzahl', async ({}, info) => {
    const { anna } = partie;
    const rahmen = await anna.evaluate(() => {
      const a = window.ansicht;
      const punkte = [...a.nachher.values()].filter((e) => e.b === a.ich).map((e) => a.zuBild(e.x, e.y));
      const xs = punkte.map((p) => p.x);
      const ys = punkte.map((p) => p.y);
      return { x0: Math.min(...xs) - 30, y0: Math.min(...ys) - 50, x1: Math.max(...xs) + 30, y1: Math.max(...ys) + 20 };
    });
    await anna.mouse.move(rahmen.x0, rahmen.y0);
    await anna.mouse.down();
    await anna.mouse.move(rahmen.x1, rahmen.y1, { steps: 8 });
    await anna.mouse.up();
    await expect.poll(() => anna.evaluate(() => window.ansicht.ausgewaehlt.size)).toBe(4);

    const leiste = anna.locator('#auswahlleiste');
    await expect(leiste).toBeVisible();
    await expect(leiste).toContainText('4 ausgewählt');
    // Je Typ ein Eintrag mit Anzahl: drei Dorfbewohner, ein Spaeherreiter (bauen AC-22).
    const eintraege = leiste.locator('.gruppe-eintrag');
    await expect(eintraege).toHaveCount(2);
    await expect(eintraege.nth(0)).toHaveAttribute('title', '3 Dorfbewohner');
    await expect(eintraege.nth(0)).toContainText('3');
    await expect(eintraege.nth(1)).toHaveAttribute('title', '1 Spaeherreiter');
    await expect(eintraege.nth(1)).toContainText('1');
    await expect(leiste).toBeInViewport();
    // Die breiteste Leiste - eine Gruppe mit Baumenue - neben Knopf und Uebersichtskarte.
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-6',
      titel: 'Vier im Rahmen gewaehlt: unten 4 ausgewaehlt, ein Dorfbewohner mit 3, ein Spaeherreiter mit 1',
      test: info,
    });
  });

  test('einheiten AC-20: vier zum selben Punkt geschickt stehen dort nebeneinander, nicht auf einem Feld', async ({}, info) => {
    const { anna } = partie;
    // Ein freies Stueck Gras vor der Basis, im Bild.
    const ziel = await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      const g = a.karte.groesse;
      for (let r = 6; r < 20; r++) {
        const x = b.x + r;
        const y = b.y + r - 2;
        let frei = true;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (a.karte.felder[(y + dy) * g + x + dx] !== 0) frei = false;
        if ([...a.tiere.values()].some((t) => Math.hypot(t.x - x, t.y - y) < 3)) frei = false;
        if (frei) {
          const p = a.zuBild(x, y);
          if (p.x > 100 && p.y > 100 && p.x < a.leinwand.clientWidth - 300 && p.y < a.leinwand.clientHeight - 200) return { x, y, p };
        }
      }
      return null;
    });
    expect(ziel).not.toBeNull();
    await anna.mouse.click(ziel.p.x, ziel.p.y, { button: 'right' });
    // Angekommen und still: jeder auf einem eigenen Feld, alle nah am Ziel.
    await anna.waitForFunction(({ x, y }) => {
      const a = window.ansicht;
      const eigene = [...a.nachher.values()].filter((e) => e.b === a.ich);
      const felder = new Set(eigene.map((e) => `${e.x},${e.y}`));
      return eigene.length === 4 && felder.size === 4
        && eigene.every((e) => Number.isInteger(e.x) && Number.isInteger(e.y) && Math.hypot(e.x - x, e.y - y) <= 2
          && a.vorher.get(e.i)?.x === e.x && a.vorher.get(e.i)?.y === e.y);
    }, ziel, { timeout: 30_000 });
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-20',
      titel: 'Vier per Rechtsklick auf einen Punkt geschickt: sie stehen nebeneinander um das Ziel, jeder auf einem eigenen Feld',
      test: info,
    });
  });
});
