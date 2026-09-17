// Verdeckte Einheiten und sichtbare Arbeit - die ersten zwei Luecken aus der
// Rueckschau zu Stufe A (→ specs/10-strategie/bedienung.md AC-30, AC-31).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test, zeitraffer } from '../helpers/seite.mjs';
import { dorfbewohnerAnklicken, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';
const WALD = 1;

/** Anteil gemeinsamer Bildpunkte an allen belegten: 1 heisst gleiche Gestalt. */
function ueberdeckung(a, b) {
  let beide = 0;
  let eines = 0;
  for (let i = 0; i < a.belegt.length; i++) {
    if (a.belegt[i] && b.belegt[i]) beide += 1;
    if (a.belegt[i] || b.belegt[i]) eines += 1;
  }
  return beide / eines;
}

test('bedienung AC-31: die Gestalt eines Arbeitenden unterscheidet sich vom Stehenden, und jeder Schlag von der naechsten Stufe', async ({ page }) => {
  await page.goto('/schautafel.html');
  await page.waitForFunction(() => window.schautafel?.maske);
  const masken = await page.evaluate(() => {
    const m = window.schautafel.maske;
    return {
      steht: m('dorfbewohner', '#4a90d9', {}),
      schlag: m('dorfbewohner', '#4a90d9', { arbeit: Math.PI / 2 }),
      ausholen: m('dorfbewohner', '#4a90d9', { arbeit: (3 * Math.PI) / 2 }),
    };
  });
  // Die Grenze kommt aus dem Kriterium: man muss Arbeit von Stillstand
  // unterscheiden koennen, ohne hinzusehen - ein Zehntel der Flaeche ist der
  // Unterschied, den auch ein Traeger mit Ladung ausmacht (darstellung AC-6).
  expect(ueberdeckung(masken.steht, masken.schlag), 'steht gegen Schlag').toBeLessThan(0.9);
  expect(ueberdeckung(masken.schlag, masken.ausholen), 'Schlag gegen Ausholen').toBeLessThan(0.9);
});

test.describe('Im Spielbild', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-31: wer sammelt, meldet es im Zustand und bewegt sich - wer wartet, nicht', async ({}, info) => {
    const { anna, code } = partie;
    await zeitraffer(anna, code, 5);
    const id = await dorfbewohnerAnklicken(anna);
    const wald = await anna.evaluate((art) => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      const g = a.karte.groesse;
      let bestes = null;
      for (let y = 0; y < g; y++) {
        for (let x = 0; x < g; x++) {
          if (a.karte.felder[y * g + x] !== art) continue;
          const d = Math.hypot(x - b.x, y - b.y);
          if (!bestes || d < bestes.d) bestes = { x, y, d };
        }
      }
      a.kamera.zoom = 2;
      a.blickAuf(bestes.x, bestes.y);
      return a.zuBild(bestes.x, bestes.y);
    }, WALD);
    await anna.mouse.click(wald.x, wald.y, { button: 'right' });
    // Am Baum angekommen: der Zustand sagt "arbeitet".
    await anna.waitForFunction((id) => window.ansicht.nachher.get(id)?.w === 1, id, { timeout: 40_000 });
    const andere = await anna.evaluate((id) => [...window.ansicht.nachher.values()]
      .filter((e) => e.b === window.ansicht.ich && e.i !== id && e.k === 'd').map((e) => e.w ?? 0), id);
    expect(andere, 'die Wartenden melden keine Arbeit').toEqual(andere.map(() => 0));
    await zeitraffer(anna, code, 1);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-31',
      titel: 'Am Baum: der Dorfbewohner holt mit der Axt aus - die Wartenden am Dorfzentrum stehen still',
      test: info,
    });
  });

  test('bedienung AC-30: wer hinter einem Gebaeude steht, ist als Umriss in Spielerfarbe zu sehen', async ({}, info) => {
    const { anna, code } = partie;
    // Zwei Einheiten hinter dem Dorfzentrum - im Bild dahinter, also verdeckt.
    const basis = await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 2;
      a.blickAuf(b.x, b.y);
      return b;
    });
    await einheitenAufstellen(anna, code, 'Anna', 2, { x: basis.x - 3, y: basis.y - 3 });
    await anna.waitForFunction(() => window.ansicht.umrisse?.length >= 2, null, { timeout: 20_000 });
    const lage = await anna.evaluate(() => {
      const a = window.ansicht;
      const verdeckt = a.umrisse.map((i) => a.nachher.get(i)).filter(Boolean);
      const basis = a.spieler.get(a.ich).basis;
      return {
        verdeckt: verdeckt.map((e) => ({ i: e.i, tiefe: e.x + e.y })),
        zentrum: basis.x + basis.y,
        frei: [...a.nachher.values()].filter((e) => e.b === a.ich && !a.umrisse.includes(e.i)).length,
      };
    });
    // Jeder Umriss steht wirklich hinter dem Dorfzentrum, und wer frei steht, bekommt keinen.
    for (const v of lage.verdeckt) expect(v.tiefe, `Einheit ${v.i}`).toBeLessThan(lage.zentrum);
    expect(lage.frei, 'freie Einheiten ohne Umriss').toBeGreaterThan(0);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-30',
      titel: 'Zwei Dorfbewohner hinter dem Dorfzentrum: ihre Umrisse in Blau stehen ueber dem Dach, davor die anderen ganz gezeichnet',
      test: info,
    });
  });
});
