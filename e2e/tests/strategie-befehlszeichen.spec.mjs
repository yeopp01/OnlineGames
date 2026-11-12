// Das Zeichen am Ziel eines Befehls (→ specs/10-strategie/bedienung.md AC-34):
// ein Rechtsklick auf Feindliches zeigt kurz ein rotes Zeichen, einer auf
// freies Gelaende ein weisses. Es steht sofort, ohne auf den Server zu warten -
// deshalb entscheidet der Browser dieselbe Frage noch einmal, die der Server
// beim Befehl entscheidet. Genau das wird hier geprueft: beide Faelle am
// selben Bild, und dass das Zeichen von selbst wieder verschwindet.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test } from '../helpers/seite.mjs';
import { bedienteileFrei, figurenFrei, freieWiesen, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Befehlszeichen', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let meine;
  let feind;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
    const { anna, code } = partie;
    const [wiese] = await freieWiesen(anna, 1);
    // Zwei Milizen Annas, eine Berts drei Felder weiter - nah genug, dass
    // beide Ziele in ein Bild passen und Anna sie sieht (Sicht 4, kampf
    // AC-11), weit genug fuer zwei getrennte Klicks. Bis Runde 105 stand sie
    // vier weiter; mit dem Nebel war sie dort unsichtbar und kein Ziel.
    expect(await einheitenAufstellen(anna, code, 'Anna', 2, { art: 'miliz', x: wiese.x - 1, y: wiese.y - 1 })).toBe(2);
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'miliz', x: wiese.x + 1, y: wiese.y + 1 })).toBe(1);
    await anna.waitForFunction(() => [...window.ansicht.nachher.values()].filter((e) => e.k === 'm').length >= 3);
    const alle = await anna.evaluate(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].filter((e) => e.k === 'm')
        .map((e) => ({ i: e.i, eigen: e.b === a.ich, x: e.x, y: e.y }));
    });
    meine = alle.filter((e) => e.eigen);
    [feind] = alle.filter((e) => !e.eigen);
    expect(meine.length).toBe(2);
    await anna.waitForFunction((f) => window.ansicht.nebel.sieht(f.x, f.y), feind, { timeout: 5_000 });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-34: ein Rechtsklick auf Feindliches zeigt ein rotes Zeichen, einer auf freies Gelaende ein weisses', async ({}, info) => {
    const { anna } = partie;

    // Auswaehlen und auf das Gefecht blicken.
    const bild = await anna.evaluate(([ids, ziel]) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set(ids);
      a.beiAuswahl();
      a.kamera.zoom = 2.4;
      a.blickAuf((a.nachher.get(ids[0]).x + ziel.x) / 2, (a.nachher.get(ids[0]).y + ziel.y) / 2);
      return { feind: a.zuBild(ziel.x, ziel.y), ich: a.zuBild(a.nachher.get(ids[0]).x, a.nachher.get(ids[0]).y) };
    }, [meine.map((e) => e.i), feind]);

    // 1. Freies Gelaende: das Zeichen ist weiss und liegt auf dem geklickten
    // Feld. Geklickt wird deutlich neben alles, was steht.
    const leer = { x: bild.ich.x - 150, y: bild.ich.y + 40 };
    await anna.mouse.click(leer.x, leer.y, { button: 'right' });
    const weiss = await anna.evaluate(([px, py]) => {
      const a = window.ansicht;
      const welt = a.zuWelt(px, py);
      return { zeichen: a.zielzeichen && { ...a.zielzeichen }, feld: { x: Math.round(welt.x), y: Math.round(welt.y) } };
    }, [leer.x, leer.y]);
    expect(weiss.zeichen, 'ein Zeichen steht').toBeTruthy();
    expect(weiss.zeichen.feindlich, 'freies Gelaende ist nicht feindlich').toBe(false);
    expect(weiss.zeichen.x, 'auf dem geklickten Feld').toBe(weiss.feld.x);
    expect(weiss.zeichen.y).toBe(weiss.feld.y);

    // 2. Dieselbe Geste auf die fremde Miliz: rot, und am Ziel - nicht auf dem
    // gerundeten Feld, sondern da, wo die Einheit wirklich steht.
    await anna.mouse.click(bild.feind.x, bild.feind.y, { button: 'right' });
    const rot = await anna.evaluate(() => {
      const a = window.ansicht;
      return a.zielzeichen && { ...a.zielzeichen };
    });
    expect(rot, 'ein Zeichen steht').toBeTruthy();
    expect(rot.feindlich, 'die fremde Miliz ist feindlich').toBe(true);
    expect(Math.hypot(rot.x - feind.x, rot.y - feind.y), 'am Ziel').toBeLessThan(1.5);

    // 3. Es haelt den Augenblick an: ein Beginn in der Zukunft friert das
    // erste Bild ein, damit der Nachweis nicht gegen die Uhr laeuft. Ohne das
    // waere das Zeichen nach 800 ms fort - und ein Screenshot dauert laenger.
    await anna.evaluate(() => {
      window.ansicht.zielzeichen.seit = performance.now() + 60_000;
    });
    const lage = await anna.evaluate(() => {
      const a = window.ansicht;
      const p = a.zuBild(a.zielzeichen.x, a.zielzeichen.y);
      return { p, feld: { b: a.leinwand.clientWidth, h: a.leinwand.clientHeight } };
    });
    expect(lage.p.x, 'das Zeichen liegt im Bild').toBeGreaterThan(60);
    expect(lage.p.x).toBeLessThan(lage.feld.b - 60);
    expect(lage.p.y).toBeGreaterThan(80);
    expect(lage.p.y).toBeLessThan(lage.feld.h - 240);
    expect(await bedienteileFrei(anna)).toEqual([]);
    expect(await figurenFrei(anna)).toEqual([]);

    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-34',
      titel: 'Der Rechtsklick auf Berts Miliz (rot) zeigt ein rotes Zeichen mit vier Haken am Ziel — auf freies Gelände wäre es ein weißer Ring',
      test: info,
    });

    // 4. Und es verschwindet von selbst: ein Beginn weit in der Vergangenheit
    // ist dasselbe wie abgelaufene Zeit.
    await anna.evaluate(() => {
      window.ansicht.zielzeichen.seit = performance.now() - 5_000;
    });
    await expect.poll(() => anna.evaluate(() => window.ansicht.zielzeichen)).toBe(null);
  });

  test('bedienung AC-13: der Ring am Zielpunkt steht und ist gezeichnet, bevor der Befehl den Browser verlassen hat', async ({}, info) => {
    const { anna } = partie;
    // Der Befehl wird angehalten, ehe er zum Server geht: kommt das Zeichen
    // trotzdem, wartet es auf keine Antwort. Gemessen wird am Bild selbst -
    // die Bildpunkte um den Zielpunkt vor dem Klick und zwei Bilder danach.
    // Der Fall davor hat die Milizen auf Bert geschickt: erst, wenn sie auf
    // der Stelle stehen (im Nahkampf oder danach), beginnt dieser - sonst
    // hiesse "bewegt sich erst nach dem Senden" nichts.
    const lebende = () => anna.evaluate((ids) => ids.filter((id) => {
      const e = window.ansicht.nachher.get(id);
      return e && !e.s;
    }).map((id) => ({ i: id, x: window.ansicht.nachher.get(id).x, y: window.ansicht.nachher.get(id).y })), meine.map((e) => e.i));
    await expect.poll(async () => {
      const a = await lebende();
      await anna.waitForTimeout(600);
      const b = await lebende();
      return a.length > 0 && JSON.stringify(a) === JSON.stringify(b);
    }, { timeout: 60_000 }).toBe(true);
    const stehen = await lebende();
    const bild = await anna.evaluate((ids) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set(ids);
      a.beiAuswahl();
      a.kamera.zoom = 2;
      const m = a.nachher.get(ids[0]);
      a.blickAuf(m.x, m.y);
      window.gehalten = [];
      window.echtSenden = a.befehlSenden;
      a.befehlSenden = (...befehl) => window.gehalten.push(befehl);
      return a.zuBild(m.x, m.y);
    }, stehen.map((e) => e.i));
    // Weit neben die Milizen, damit sich im Ausschnitt nur der Ring regt.
    const ziel = { x: Math.round(bild.x + 160), y: Math.round(bild.y + 60) };
    const ausschnitt = (z) => anna.evaluate(async (p) => {
      const a = window.ansicht;
      // Zwei Bilder abwarten: das Zeichen wird im naechsten gezeichnet.
      await new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig)));
      const d = window.devicePixelRatio || 1;
      const r = Math.round(60 * d);
      return [...a.stift.getImageData(Math.round(p.x * d) - r, Math.round(p.y * d) - r, 2 * r, 2 * r).data];
    }, z);
    const vorher = await ausschnitt(ziel);

    await anna.mouse.click(ziel.x, ziel.y, { button: 'right' });
    const lage = await anna.evaluate(() => ({
      zeichen: window.ansicht.zielzeichen && { ...window.ansicht.zielzeichen },
      gehalten: window.gehalten.length,
    }));
    expect(lage.gehalten, 'der Befehl ist angehalten, nicht gesendet').toBe(1);
    expect(lage.zeichen, 'das Zeichen steht trotzdem').toBeTruthy();
    expect(lage.zeichen.feindlich).toBe(false);
    const nachher = await ausschnitt(ziel);
    // Weiss mit dunklem Rand auf Gras: ein Ring von rund 2 x 1 Feld veraendert
    // Hunderte Bildpunkte. Gezaehlt wird, was sich deutlich aendert.
    let anders = 0;
    for (let i = 0; i < vorher.length; i += 4) {
      const abstand = Math.abs(vorher[i] - nachher[i]) + Math.abs(vorher[i + 1] - nachher[i + 1]) + Math.abs(vorher[i + 2] - nachher[i + 2]);
      if (abstand > 90) anders += 1;
    }
    expect(anders, 'der Ring ist gezeichnet').toBeGreaterThan(200);

    // Fuer das Bild angehalten; die Milizen stehen noch, denn der Server weiss nichts.
    await anna.evaluate(() => { window.ansicht.zielzeichen.seit = performance.now() + 60_000; });
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-13',
      titel: 'Der weisse Ring am Zielpunkt steht, waehrend der Befehl noch angehalten ist - die Milizen stehen, der Server weiss nichts',
      test: info,
    });

    // Jetzt geht der Befehl hinaus, und erst danach laufen die Milizen.
    // Bis hierher hat sich keine bewegt.
    expect(await lebende(), 'die Milizen stehen noch').toEqual(stehen);
    await anna.evaluate(() => {
      const a = window.ansicht;
      a.befehlSenden = window.echtSenden;
      for (const befehl of window.gehalten) a.befehlSenden(...befehl);
      a.zielzeichen = null;
    });
    await expect.poll(async () => {
      const [e] = await lebende();
      return Math.hypot(e.x - stehen[0].x, e.y - stehen[0].y);
    }).toBeGreaterThan(0.5);
  });
});
