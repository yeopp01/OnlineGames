// Der gefaellte Baum (→ specs/10-strategie/darstellung.md AC-31).
//
// Rueckmeldung des Benutzers: "angehakte Holzbäume gibts nicht,". Ein Baum,
// von dem das erste Stueck Holz genommen ist, liegt: ein Stumpf, daneben der
// Stamm, der mit dem Vorrat kuerzer wird, am Ende nur noch Scheite.
//
// Aufgestellt wird eine Reihe aus fuenf Baeumen, quer im Bild, rundherum
// gerodet: der linke bleibt stehen, an den vier anderen hackt je ein
// Dorfbewohner - am ersten vom vollen Baum, an den anderen kurz vor dem
// naechsten Viertel. Was der Server dabei meldet, prueft
// tests/strategie-gefaellt.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test, vorratLeeren, vorratSetzen, zeitraffer } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const DARSTELLUNG = '10-strategie/darstellung.md';
const WALD = 1;
const ZOOM = 2;

/**
 * Fuenf Baeume in einer Reihe quer im Bild - (x + k, y - k) -, moeglichst nah
 * an Annas Dorf, aber nicht darin. Dazu jeder andere Baum im Umkreis: der
 * wird gerodet, damit nichts die Reihe verdeckt.
 */
function reiheSuchen(seite) {
  return seite.evaluate((wald) => {
    const a = window.ansicht;
    const g = a.karte.groesse;
    const b = a.spieler.get(a.ich).basis;
    const ist = (x, y) => x >= 0 && y >= 0 && x < g && y < g && a.karte.felder[y * g + x] === wald;
    let beste = null;
    for (let y = 6; y < g - 6; y++) {
      for (let x = 6; x < g - 6; x++) {
        const d = Math.hypot(x - b.x, y - b.y);
        if (d < 8 || (beste && d >= beste.d)) continue;
        if ([-2, -1, 0, 1, 2].every((k) => ist(x + k, y - k))) beste = { x, y, d };
      }
    }
    if (!beste) return null;
    const reihe = [-2, -1, 0, 1, 2].map((k) => ({ x: beste.x + k, y: beste.y - k, i: (beste.y - k) * g + beste.x + k }));
    const roden = [];
    for (let y = beste.y - 7; y <= beste.y + 7; y++) {
      for (let x = beste.x - 7; x <= beste.x + 7; x++) {
        if (ist(x, y) && !reihe.some((f) => f.x === x && f.y === y)) roden.push({ x, y });
      }
    }
    return { mitte: { x: beste.x, y: beste.y }, reihe, roden };
  }, WALD);
}

/** Die Leinwand ueber jedem Baum der Reihe, dort, wo eine Krone steht - als Farbwerte. */
function kronen(seite, reihe) {
  return seite.evaluate((reihe) => {
    const a = window.ansicht;
    const e = 22 * a.kamera.zoom;
    const dichte = a.leinwand.width / a.leinwand.getBoundingClientRect().width;
    const stift = a.leinwand.getContext('2d');
    return reihe.map((f) => {
      const p = a.zuBild(f.x, f.y);
      const links = Math.round((p.x - 0.4 * e) * dichte);
      const oben = Math.round((p.y - 2.0 * e) * dichte);
      return [...stift.getImageData(links, oben, Math.round(0.8 * e * dichte), Math.round(0.9 * e * dichte)).data];
    });
  }, reihe);
}

/** Anteil der Bildpunkte, die sich zwischen zwei Aufnahmen deutlich geaendert haben. */
function anders(vorher, nachher) {
  let n = 0;
  for (let i = 0; i < vorher.length; i += 4) {
    if (Math.abs(vorher[i] - nachher[i]) + Math.abs(vorher[i + 1] - nachher[i + 1]) + Math.abs(vorher[i + 2] - nachher[i + 2]) > 60) n += 1;
  }
  return n / (vorher.length / 4);
}

test.describe('Gefaellter Baum', () => {
  let partie;
  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
    await partie.anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
  });
  test.afterAll(() => partieBeenden(partie));

  test('darstellung AC-31: mit dem ersten Stueck Holz liegt der Baum - Stumpf und Stamm in vier Stufen, flach zu treffen, und nach der Rueckkehr liegt er weiter', async ({}, info) => {
    test.setTimeout(180_000);
    const { anna, code } = partie;
    const leiste = anna.locator('#auswahlleiste');

    const ort = await reiheSuchen(anna);
    expect(ort, 'fuenf Baeume in einer Reihe').not.toBeNull();
    const { reihe, mitte } = ort;
    for (const f of ort.roden) await vorratLeeren(anna, code, f.x, f.y);
    await anna.waitForFunction(([roden, g]) => roden.every((f) => window.ansicht.karte.felder[f.y * g + f.x] === 0),
      [ort.roden, await anna.evaluate(() => window.ansicht.karte.groesse)]);
    await anna.evaluate(([mitte, zoom]) => {
      const a = window.ansicht;
      a.ausgewaehlt = new Set();
      a.gewaehltesGebaeude = null;
      a.angesehen = null;
      a.beiAuswahl();
      a.kamera.zoom = zoom;
      a.blickAuf(mitte.x, mitte.y);
    }, [mitte, ZOOM]);

    // Die Tafel ist da, und sie zeichnet einen Liegenden: nicht halb so hoch
    // wie der stehende Baum, und eben gefaellt ist mehr daran als am Ende.
    const gezeichnet = await anna.evaluate(async ([baum, zoom]) => {
      const { dingBildZeichnen } = await import('/gelaende.js');
      const { gerendert } = await import('/bilder.js');
      const a = window.ansicht;
      const e = 22 * zoom;
      const messen = (fuellung, gefaellt) => {
        const blatt = document.createElement('canvas');
        blatt.width = 320;
        blatt.height = 320;
        const stift = blatt.getContext('2d');
        dingBildZeichnen(stift, 1, 160, 280, e, baum.i, fuellung, baum, a.salz, gefaellt);
        const d = stift.getImageData(0, 0, 320, 320).data;
        let oben = 320;
        let unten = 0;
        let n = 0;
        let summe = 0;
        for (let y = 0; y < 320; y++) {
          for (let x = 0; x < 320; x++) {
            const i = (y * 320 + x) * 4;
            if (d[i + 3] < 60) continue;
            n += 1;
            summe += d[i] + d[i + 1] * 3 + d[i + 2] * 7 + x * 11 + y * 13;
            oben = Math.min(oben, y);
            unten = Math.max(unten, y);
          }
        }
        return { hoch: unten - oben, n, summe };
      };
      return {
        tafel: Boolean(gerendert('baumstumpf')),
        steht: messen(1, false),
        liegt: [1, 0.75, 0.5, 0.25].map((f) => messen(f, true)),
      };
    }, [reihe[2], ZOOM]);
    expect(gezeichnet.tafel, 'die Tafel baumstumpf ist geladen').toBe(true);
    for (const stufe of gezeichnet.liegt) {
      expect(stufe.n, 'etwas ist gezeichnet').toBeGreaterThan(200);
      expect(stufe.hoch, 'der Liegende ist flach').toBeLessThan(gezeichnet.steht.hoch / 2);
    }
    expect(gezeichnet.liegt[0].n, 'eben gefaellt ist mehr daran als am Ende').toBeGreaterThan(gezeichnet.liegt[3].n * 1.2);
    expect(new Set(gezeichnet.liegt.map((s) => s.summe)).size, 'vier verschiedene Bilder').toBe(4);

    // Der Rueckfall ohne Tafel (?bilder=0): gezeichnet, auch er liegt flach.
    const rueckfall = await anna.evaluate(async ([baum, zoom]) => {
      const { dingZeichnen } = await import('/gelaende.js');
      const e = 22 * zoom;
      const blatt = document.createElement('canvas');
      blatt.width = 5 * 160;
      blatt.height = 200;
      const stift = blatt.getContext('2d');
      const hoehe = (n) => {
        const d = stift.getImageData(n * 160, 0, 160, 200).data;
        let oben = 200;
        let unten = 0;
        for (let i = 3; i < d.length; i += 4) {
          if (d[i] < 200) continue;
          const y = Math.floor(i / 4 / 160);
          oben = Math.min(oben, y);
          unten = Math.max(unten, y);
        }
        return Math.max(0, unten - oben);
      };
      dingZeichnen(stift, 1, 80, 170, e, baum.i, 1, false);
      [1, 0.75, 0.5, 0.25].forEach((f, n) => dingZeichnen(stift, 1, (n + 1) * 160 + 80, 170, e, baum.i, f, true));
      return { hoehen: [0, 1, 2, 3, 4].map(hoehe), bild: blatt.toDataURL() };
    }, [reihe[2], ZOOM]);
    if (process.env.PROBE_BILD) (await import('node:fs')).writeFileSync(process.env.PROBE_BILD, Buffer.from(rueckfall.bild.split(',')[1], 'base64'));
    for (const n of [1, 2, 3, 4]) {
      expect(rueckfall.hoehen[n], `gezeichnet, Stufe ${n}`).toBeGreaterThan(8);
      expect(rueckfall.hoehen[n], `gezeichnet liegt flach (${rueckfall.hoehen})`).toBeLessThan(rueckfall.hoehen[0] / 2);
    }

    // Vorher: alle fuenf stehen, keiner ist angebrochen, und ein Klick in die
    // Krone trifft den Baum.
    const inKrone = (f) => anna.evaluate((f) => {
      const a = window.ansicht;
      const p = a.zuBild(f.x, f.y);
      return a.vorratUnter(p.x, p.y - 1.5 * 22 * a.kamera.zoom)?.v ?? null;
    }, f);
    expect(await anna.evaluate((reihe) => reihe.map((f) => window.ansicht.fuellung.has(f.i)), reihe)).toEqual([false, false, false, false, false]);
    for (const f of reihe) expect(await inKrone(f), 'die Krone gehoert zum Baum').toBe(f.i);
    await anna.waitForTimeout(400);
    const vorher = await kronen(anna, reihe);

    // Vier Dorfbewohner, je einer an einem Baum. Der erste hackt am vollen,
    // die anderen kurz vor dem naechsten Viertel.
    expect(await einheitenAufstellen(anna, code, 'Anna', 4, { x: mitte.x + 3, y: mitte.y + 3 })).toBe(4);
    await anna.waitForFunction((m) => {
      const a = window.ansicht;
      return [...a.nachher.values()].filter((e) => e.b === a.ich && e.k === 'd' && Math.hypot(e.x - m.x, e.y - m.y) < 9).length >= 4;
    }, mitte);
    const bauern = await anna.evaluate((m) => {
      const a = window.ansicht;
      return [...a.nachher.values()].filter((e) => e.b === a.ich && e.k === 'd' && Math.hypot(e.x - m.x, e.y - m.y) < 9).slice(0, 4).map((e) => e.i);
    }, mitte);
    await vorratSetzen(anna, code, reihe[2].x, reihe[2].y, 76);
    await vorratSetzen(anna, code, reihe[3].x, reihe[3].y, 51);
    await vorratSetzen(anna, code, reihe[4].x, reihe[4].y, 26);
    await anna.evaluate(([bauern, reihe]) => {
      bauern.forEach((id, n) => window.ansicht.befehlSenden([id], { x: reihe[n + 1].x, y: reihe[n + 1].y }, false, false));
    }, [bauern, reihe]);
    await zeitraffer(anna, code, 4);
    const stufen = () => anna.evaluate((reihe) => reihe.map((f) => window.ansicht.fuellung.get(f.i) ?? null), reihe);
    await expect.poll(stufen, { timeout: 60_000 }).toEqual([null, 4, 3, 2, 1]);

    // Fort mit ihnen, damit sie nichts verdecken: ein Gang nach vorn links.
    await anna.evaluate(([bauern, m]) => window.ansicht.befehlSenden(bauern, { x: m.x - 1, y: m.y + 6 }, false, false), [bauern, mitte]);
    await anna.waitForFunction(([bauern, m]) => bauern.every((id) => {
      const e = window.ansicht.nachher.get(id);
      return e && !e.w && Math.hypot(e.x - m.x, e.y - m.y) > 3.5 && e.x + e.y > m.x + m.y + 1;
    }), [bauern, mitte], { timeout: 30_000 });
    await zeitraffer(anna, code, 1);
    expect(await stufen(), 'die Stufen stehen noch').toEqual([null, 4, 3, 2, 1]);
    await anna.waitForTimeout(600);

    // Im Spielbild: wo die Krone stand, ist sie fort - nur beim ersten nicht.
    const nachher = await kronen(anna, reihe);
    const geaendert = vorher.map((v, n) => anders(v, nachher[n]));
    expect(geaendert[0], `der Unberuehrte steht wie vorher (${geaendert})`).toBeLessThan(0.1);
    for (const n of [1, 2, 3, 4]) expect(geaendert[n], `Baum ${n}: die Krone ist fort (${geaendert})`).toBeGreaterThan(0.25);

    // Flach zu treffen: der Klick in die Hoehe der Krone geht ueber den
    // Liegenden hinweg, der am Fuss trifft ihn.
    expect(await inKrone(reihe[0])).toBe(reihe[0].i);
    for (const n of [1, 2, 3, 4]) expect(await inKrone(reihe[n]), 'ueber dem Liegenden ist Luft').toBeNull();
    const fuss = await anna.evaluate((f) => {
      const a = window.ansicht;
      const p = a.zuBild(f.x, f.y);
      const r = a.leinwand.getBoundingClientRect();
      return { x: r.left + p.x, y: r.top + p.y - 8 };
    }, reihe[3]);
    await anna.mouse.click(fuss.x, fuss.y);
    await expect(leiste.locator('.auswahl-kopf strong')).toHaveText('Gefällter Baum');
    await expect(leiste.locator('#vorratsrest .lebenszahl')).toHaveText(/^Holz: (4\d|50) von 100$/);
    await nachweis(anna, {
      spec: DARSTELLUNG,
      ac: 'AC-31',
      titel: 'Fünf Bäume in einer Reihe: der linke unberührt, daneben vier gefällte – eben gefällt mit ganzem Stamm und Kronenrest, dann der Stamm kürzer, zuletzt Stumpf und Scheite; angesehen ist der vierte, unten „Gefällter Baum“',
      test: info,
    });
    await anna.keyboard.press('Escape');

    // Der unberuehrte heisst weiter Baum.
    const krone = await anna.evaluate((f) => {
      const a = window.ansicht;
      const p = a.zuBild(f.x, f.y);
      const r = a.leinwand.getBoundingClientRect();
      return { x: r.left + p.x, y: r.top + p.y - 1.5 * 22 * a.kamera.zoom };
    }, reihe[0]);
    await anna.mouse.click(krone.x, krone.y);
    await expect(leiste.locator('.auswahl-kopf strong')).toHaveText('Baum');
    await anna.keyboard.press('Escape');

    // Zurueckgekehrt in einem neuen Fenster: der Aufbau bringt mit, was
    // angebrochen ist - sonst staenden alle fuenf wieder.
    const neu = await anna.context().newPage();
    await neu.goto('/');
    await expect(neu.locator('#rueckkehr')).toBeVisible();
    await neu.locator('#rueckkehrJa').click();
    await expect(neu.locator('#brett')).toBeVisible();
    await neu.waitForFunction(() => window.ansicht?.nachher?.size > 0);
    expect(await neu.evaluate((reihe) => reihe.map((f) => window.ansicht.fuellung.get(f.i) ?? null), reihe)).toEqual([null, 4, 3, 2, 1]);
    await neu.close();
  });
});
