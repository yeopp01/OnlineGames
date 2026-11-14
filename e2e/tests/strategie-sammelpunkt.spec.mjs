// Der Sammelpunkt folgt dem Vorrat (→ specs/10-strategie/bauen.md AC-40).
//
// Aus dem Spiel auf dem Server: mit gewaehltem Dorfzentrum auf einen Baum
// geklickt, stand die Fahne auf der Wiese dahinter - und war der Baum
// gefaellt, standen die neuen Dorfbewohner auf dem Stumpf. Die Regeln prueft
// tests/strategie-bauen.test.mjs; hier der Klick auf die Krone und die Fahne
// im Bild.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test, vorratLeeren, zeitraffer } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit, WALDFELD } from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';

test.describe('Sammelpunkt am Vorrat', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bauen AC-40: ein Rechtsklick auf die Krone setzt die Fahne an den Baum - ist er gefaellt, wandert sie zum naechsten', async ({}, info) => {
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);

    // Annas Dorfzentrum waehlen und einen Baum suchen, vor dem kein anderer
    // steht: seine Krone gehoert dann nur ihm.
    const lage = await anna.evaluate((wald) => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const basis = a.spieler.get(a.ich).basis;
      const zentrum = [...a.gebaeude.values()].find((b) => b.b === a.ich && b.art === 'dorfzentrum');
      const istWald = (x, y) => x >= 0 && y >= 0 && x < g && y < g && a.karte.felder[y * g + x] === wald;
      let baum = null;
      for (let y = 2; y < g - 4; y++) {
        for (let x = 2; x < g - 4; x++) {
          if (!istWald(x, y)) continue;
          let frei = true;
          for (let dy = -1; dy <= 3 && frei; dy++) {
            for (let dx = -1; dx <= 3 && frei; dx++) {
              // Alles, was im Bild vor ihm oder neben ihm stuende.
              if ((dx || dy) && dx + dy >= 0 && istWald(x + dx, y + dy)) frei = false;
            }
          }
          if (!frei) continue;
          const abstand = Math.hypot(x - basis.x, y - basis.y);
          if (abstand > 5 && (!baum || abstand < baum.abstand)) baum = { x, y, abstand };
        }
      }
      a.ausgewaehlt = new Set();
      a.gewaehltesGebaeude = zentrum.i;
      a.beiAuswahl();
      a.kamera.zoom = 1.6;
      a.blickAuf((basis.x + baum.x) / 2, (basis.y + baum.y) / 2);
      return { zentrum: zentrum.i, baum: { x: baum.x, y: baum.y } };
    }, WALDFELD);
    await anna.waitForTimeout(300);

    // Der Zeiger mitten auf die Krone: das Bodenfeld darunter ist ein anderes.
    const klick = await anna.evaluate((baum) => {
      const a = window.ansicht;
      const p = a.zuBild(baum.x, baum.y);
      const e = a.zuBild(baum.x + 1, baum.y).x - p.x;
      const punkt = { x: p.x, y: p.y - 1.3 * e };
      const boden = a.zuWelt(punkt.x, punkt.y);
      return { ...punkt, e, boden: { x: Math.round(boden.x), y: Math.round(boden.y) } };
    }, lage.baum);
    expect(klick.boden, 'unter dem Zeiger liegt ein Feld hinter dem Baum').not.toEqual(lage.baum);
    expect(klick.y, 'die Krone liegt unter der Kopfleiste').toBeGreaterThan(70);
    await anna.mouse.click(klick.x, klick.y, { button: 'right' });
    const punkt = () => anna.evaluate((id) => {
      const p = window.ansicht.gebaeude.get(id).p;
      return p ? { x: p.x, y: p.y } : null;
    }, lage.zentrum);
    await expect.poll(punkt, { timeout: 5_000 }).toEqual(lage.baum);
    await anna.mouse.move(700, 880);
    await anna.waitForTimeout(900);

    // Die Fahne steht am Fuss des Baums: Annas Blau im Tuch.
    const tuch = (ort) => anna.evaluate((o) => {
      const a = window.ansicht;
      const p = a.zuBild(o.x, o.y);
      const e = a.zuBild(o.x + 1, o.y).x - p.x;
      const d = window.devicePixelRatio || 1;
      return [...a.stift.getImageData(Math.round((p.x + e * 0.3) * d), Math.round((p.y - e * 1.3 + e * 0.2) * d), 1, 1).data].slice(0, 3);
    }, ort);
    const [rot, gruen, blau] = await tuch(lage.baum);
    expect(blau, `das Tuch der Fahne ist blau: ${rot}, ${gruen}, ${blau}`).toBeGreaterThan(Math.max(rot, gruen) + 30);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-40',
      titel: 'Das Dorfzentrum gewählt und auf die Krone geklickt: die Fahne steht am Baum, nicht auf der Wiese dahinter',
      test: info,
    });

    // Der Baum faellt. Der naechste Dorfbewohner geht zum Baum daneben, und
    // die Fahne geht mit.
    await vorratLeeren(anna, code, lage.baum.x, lage.baum.y);
    await anna.waitForFunction(([baum, wald]) => {
      const a = window.ansicht;
      return a.karte.felder[baum.y * a.karte.groesse + baum.x] !== wald;
    }, [lage.baum, WALDFELD]);
    const vorher = await anna.evaluate(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].filter((e) => e.b === a.ich && !e.s && a.arten[e.k] === 'dorfbewohner').map((e) => e.i);
    });
    await anna.locator('[data-ausbilden="dorfbewohner"]').click();
    await zeitraffer(anna, code, 8);
    await expect.poll(punkt, { timeout: 30_000 }).not.toEqual(lage.baum);
    const neu = await punkt();
    expect(await anna.evaluate(([p, wald]) => {
      const a = window.ansicht;
      return a.karte.felder[p.y * a.karte.groesse + p.x] === wald;
    }, [neu, WALDFELD]), 'der neue Sammelpunkt ist ein Baum').toBe(true);
    expect(Math.hypot(neu.x - lage.baum.x, neu.y - lage.baum.y), 'hoechstens zwoelf Felder weiter').toBeLessThanOrEqual(12);
    // Der Neue hackt dort.
    await anna.waitForFunction(([alte, p]) => {
      const a = window.ansicht;
      return [...a.nachher.values()].some((e) => e.b === a.ich && !alte.includes(e.i) && a.arten[e.k] === 'dorfbewohner' && e.w && Math.hypot(e.x - p.x, e.y - p.y) < 2.5);
    }, [vorher, neu], { timeout: 30_000 });
    await zeitraffer(anna, code, 1);
    await anna.evaluate(([p, id]) => {
      const a = window.ansicht;
      const m = a.gebaeudeMitte(a.gebaeude.get(id));
      a.blickAuf((m.x + p.x) / 2, (m.y + p.y) / 2);
    }, [neu, lage.zentrum]);
    await anna.mouse.move(700, 880);
    await anna.waitForTimeout(500);
    const [r2, g2, b2] = await tuch(neu);
    expect(b2, `die Fahne steht am neuen Baum: ${r2}, ${g2}, ${b2}`).toBeGreaterThan(Math.max(r2, g2) + 30);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-40',
      titel: 'Der Baum ist gefällt: die Fahne steht am nächsten, und der neue Dorfbewohner hackt dort',
      test: info,
    });
  });
});
