// Untaetige Dorfbewohner finden (→ specs/10-strategie/bedienung.md AC-28,
// einheiten-und-befehle.md AC-21): ein Knopf unten links mit der Zahl, und er
// wie die Taste "." waehlen reihum den naechsten und holen ihn ins Bild.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';
const EINHEITEN = '10-strategie/einheiten-und-befehle.md';
const WALD = 1;

test.describe('Untaetige Dorfbewohner', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
    await partie.anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 1.4;
      // Die Basis bewusst am Rand: "." muss den Dorfbewohner erst holen.
      a.blickAuf(b.x - 14, b.y + 14);
    });
  });
  test.afterAll(() => partieBeenden(partie));

  const lage = (page) => page.evaluate(() => {
    const a = window.ansicht;
    const [id] = [...a.ausgewaehlt];
    const e = id !== undefined ? a.nachher.get(id) : null;
    const p = e ? a.zuBild(e.x, e.y) : null;
    return {
      id, untaetige: [...a.untaetige], p,
      mitte: { x: a.leinwand.clientWidth / 2, y: a.leinwand.clientHeight / 2 },
      anzahl: a.ausgewaehlt.size,
    };
  });

  test('bedienung AC-28: der Knopf zaehlt die Untaetigen, "." und der Knopf waehlen reihum und holen sie ins Bild', async ({}, info) => {
    const { anna } = partie;
    const knopf = anna.locator('#untaetig');
    // Zu Beginn stehen die drei Dorfbewohner (bauen AC-22); der Reiter zaehlt nicht.
    await expect(knopf.locator('b')).toHaveText('3');
    await expect(knopf).toBeEnabled();
    await expect(knopf).toHaveClass(/hat/);
    await expect(knopf).toBeInViewport();
    const vorher = await lage(anna);
    expect(vorher.untaetige).toHaveLength(3);

    await anna.keyboard.press('.');
    const erste = await lage(anna);
    expect(erste.anzahl).toBe(1);
    expect(vorher.untaetige).toContain(erste.id);
    // Ins Bild geholt: der Dorfbewohner steht in der Bildmitte.
    expect(Math.abs(erste.p.x - erste.mitte.x)).toBeLessThan(40);
    expect(Math.abs(erste.p.y - erste.mitte.y)).toBeLessThan(40);
    await anna.waitForTimeout(200);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-28',
      titel: 'Taste Punkt: ein untaetiger Dorfbewohner gewaehlt und in die Bildmitte geholt, unten links der Knopf mit 3',
      test: info,
    });

    // Noch einmal: ein anderer. Dann der Knopf: der dritte.
    await anna.keyboard.press('.');
    const zweite = await lage(anna);
    expect(zweite.id).not.toBe(erste.id);
    await knopf.click();
    const dritte = await lage(anna);
    expect(new Set([erste.id, zweite.id, dritte.id]).size).toBe(3);
  });

  test('einheiten AC-21 / bedienung AC-28: wer arbeitet, zaehlt nicht mehr - bei null ist der Knopf aus', async ({}, info) => {
    const { anna } = partie;
    const knopf = anna.locator('#untaetig');
    // Jeden Untaetigen mit "." waehlen und per Rechtsklick in den Wald schicken.
    for (let i = 0; i < 3; i++) {
      await anna.keyboard.press('.');
      const ziel = await anna.evaluate((wald) => {
        const a = window.ansicht;
        const [id] = [...a.ausgewaehlt];
        const e = a.nachher.get(id);
        const g = a.karte.groesse;
        let bestes = null;
        for (let y = 0; y < g; y++) {
          for (let x = 0; x < g; x++) {
            if (a.karte.felder[y * g + x] !== wald) continue;
            const d = Math.hypot(x - e.x, y - e.y);
            if (!bestes || d < bestes.d) bestes = { x, y, d };
          }
        }
        a.blickAuf(bestes.x, bestes.y);
        return a.zuBild(bestes.x, bestes.y);
      }, WALD);
      await anna.mouse.click(ziel.x, ziel.y, { button: 'right' });
      await expect(knopf.locator('b')).toHaveText(String(2 - i));
    }
    await expect(knopf).toBeDisabled();
    await expect(knopf).not.toHaveClass(/hat/);
    await anna.keyboard.press('Escape');
    await anna.waitForTimeout(200);
    for (const [spec, ac] of [[BEDIENUNG, 'AC-28'], [EINHEITEN, 'AC-21']]) {
      await nachweis(anna, {
        spec,
        ac,
        titel: 'Alle drei in den Wald geschickt und unterwegs: unten links zeigt der Knopf 0 und ist abgeschaltet',
        test: info,
      });
    }
  });
});
