// Die Uebersichtskarte (→ specs/10-strategie/bedienung.md AC-11): unten
// rechts Gelaende, eigene und fremde Einheiten als Punkte, der Ausschnitt als
// Rahmen - und ein Klick springt hin. Die Uebersicht legt, was sie malt, in
// `window.uebersicht` ab; das Gelaende prueft der Test an den Bildpunkten.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

// Liegt ein Punkt im Viereck (Rahmen der Uebersicht)?
function innen(punkt, ecken) {
  let drin = false;
  for (let i = 0, j = ecken.length - 1; i < ecken.length; j = i++) {
    const a = ecken[i];
    const b = ecken[j];
    if ((a.y > punkt.y) !== (b.y > punkt.y) && punkt.x < ((b.x - a.x) * (punkt.y - a.y)) / (b.y - a.y) + a.x) drin = !drin;
  }
  return drin;
}

test.describe('Uebersichtskarte', () => {
  let partie;
  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-11: Gelaende, eigene und fremde Punkte, der Ausschnitt als Rahmen - ein Klick springt hin', async ({}, info) => {
    const { anna } = partie;
    const karte = anna.locator('#uebersicht');
    await expect(karte).toBeInViewport();
    await anna.waitForFunction(() => window.uebersicht?.punkte.length > 0);

    const lage = () => anna.evaluate(() => {
      const u = window.uebersicht;
      const a = window.ansicht;
      const ich = a.spieler.get(a.ich);
      const fremd = [...a.spieler.values()].find((s) => s.id !== a.ich);
      const mitte = a.zuWelt(a.leinwand.clientWidth / 2, a.leinwand.clientHeight / 2);
      return {
        eigene: u.punkte.filter((p) => p.b === a.ich).length,
        fremde: u.punkte.filter((p) => p.b !== a.ich).length,
        einheiten: u.punkte.filter((p) => p.art === 'einheit').length,
        gebaeude: u.punkte.filter((p) => p.art === 'gebaeude').length,
        rahmen: u.rahmen,
        mitte: u.feldZuPunkt(mitte.x, mitte.y),
        ichBasis: u.feldZuPunkt(ich.basis.x, ich.basis.y),
        fremdBasis: u.feldZuPunkt(fremd.basis.x, fremd.basis.y),
        fremdFeld: fremd.basis,
        mitteFeld: mitte,
      };
    });

    const vorher = await lage();
    // Beide Spieler als Punkte: je vier Einheiten und ein Dorfzentrum (bauen AC-22).
    expect(vorher.eigene).toBeGreaterThanOrEqual(5);
    expect(vorher.fremde).toBeGreaterThanOrEqual(5);
    expect(vorher.einheiten).toBe(8);
    expect(vorher.gebaeude).toBe(2);
    // Der Rahmen umschliesst die eigene Basis, auf die die Ansicht schaut - die fremde nicht.
    expect(innen(vorher.ichBasis, vorher.rahmen)).toBe(true);
    expect(innen(vorher.fremdBasis, vorher.rahmen)).toBe(false);

    // Gelaende: an einem Waldfeld ist die Uebersicht dunkler als an einem Grasfeld.
    const farben = await anna.evaluate(() => {
      const u = window.uebersicht;
      const a = window.ansicht;
      const g = a.karte.groesse;
      const s = u.leinwand.getContext('2d');
      const dichte = u.leinwand.width / u.breite;
      const hell = (x, y) => {
        const p = u.feldZuPunkt(x, y);
        const [r, gr, b] = s.getImageData(Math.round(p.x * dichte), Math.round(p.y * dichte), 1, 1).data;
        return r + gr + b;
      };
      // Mitten im Wald und mitten im Gras: ein Feld, dessen Nachbarn gleich sind.
      const mitten = (art) => {
        for (let y = 2; y < g - 2; y++) {
          for (let x = 2; x < g - 2; x++) {
            let gleich = true;
            for (let dy = -2; dy <= 2 && gleich; dy++) for (let dx = -2; dx <= 2; dx++) if (a.karte.felder[(y + dy) * g + x + dx] !== art) { gleich = false; break; }
            if (gleich && ![...a.nachher.values()].some((e) => Math.hypot(e.x - x, e.y - y) < 4)) return { x, y };
          }
        }
        return null;
      };
      const wald = mitten(1);
      const gras = mitten(0);
      return { wald: hell(wald.x, wald.y), gras: hell(gras.x, gras.y) };
    });
    expect(farben.wald).toBeLessThan(farben.gras - 30);

    // Ein Klick auf die fremde Basis in der Uebersicht: die grosse Ansicht springt hin.
    const rand = await karte.boundingBox();
    await anna.mouse.click(rand.x + vorher.fremdBasis.x, rand.y + vorher.fremdBasis.y);
    await anna.waitForFunction(() => {
      const u = window.uebersicht;
      const a = window.ansicht;
      const fremd = [...a.spieler.values()].find((s) => s.id !== a.ich);
      const m = a.zuWelt(a.leinwand.clientWidth / 2, a.leinwand.clientHeight / 2);
      return Math.hypot(m.x - fremd.basis.x, m.y - fremd.basis.y) < 2 && u.rahmen.length === 4;
    });
    await anna.waitForTimeout(400);
    const nachher = await lage();
    expect(innen(nachher.fremdBasis, nachher.rahmen)).toBe(true);
    expect(innen(nachher.ichBasis, nachher.rahmen)).toBe(false);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-11',
      titel: 'Unten rechts die Uebersichtskarte, nach einem Klick auf die roten Punkte: die Ansicht zeigt Berts Basis, der weisse Rahmen steht dort',
      test: info,
    });
  });
});
