// Der Nebel im Bild (→ specs/10-strategie/kampf.md AC-11, AC-12,
// darstellung.md AC-15).
//
// Annas Spaeher reitet ein Stueck hinaus und kehrt zurueck. Danach liegen alle
// drei Stufen im Bild: beobachtet um ihr Dorf, erkundet auf seinem Weg, nie
// gesehen rundherum. Auf den erkundeten Weg stellt der Test eine Einheit
// Berts - Anna sieht sie nicht, obwohl sie das Gelaende dort kennt.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const KAMPF = '10-strategie/kampf.md';
const DARSTELLUNG = '10-strategie/darstellung.md';
const GRAS = 0;

test.describe('Nebel', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('kampf AC-11, kampf AC-12 und darstellung AC-15: der Nebel in drei Stufen, fremde Einheiten nur in Sicht', async ({}, info) => {
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht.nebel && window.ansicht.nachher.size > 0);

    // Zum Start: nur das eigene Dorf ist gesehen (kampf AC-11).
    const start = await anna.evaluate(() => window.ansicht.nebel.zaehlen());
    expect(start.beobachtet, 'um das Dorf ist es hell').toBeGreaterThan(0);
    expect(start.erkundet, 'erkundet, aber unbeobachtet ist noch nichts').toBe(0);

    // Ein Ziel 16 Felder vom Dorf, auf Gras, ausser Sicht.
    const lage = await anna.evaluate((gras) => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const b = a.spieler.get(a.ich).basis;
      const richtung = b.x < g / 2 ? 1 : -1;
      for (let d = 16; d < 30; d++) {
        const x = b.x + richtung * d;
        const y = b.y;
        if (a.karte.felder[y * g + x] === gras && !a.nebel.sieht(x, y)) return { ziel: { x, y }, heim: { x: b.x + richtung * 3, y: b.y + 2 }, basis: b };
      }
      return null;
    }, GRAS);
    expect(lage, 'ein Ziel ausser Sicht').not.toBeNull();

    const reiten = async (ziel) => {
      const punkt = await anna.evaluate((z) => {
        const a = window.ansicht;
        const spaeher = [...a.nachher.values()].find((e) => e.b === a.ich && e.k === a.werte.einheiten.spaeherreiter.kuerzel);
        a.gewaehltesGebaeude = null;
        a.ausgewaehlt = new Set([spaeher.i]);
        a.beiAuswahl();
        a.blickAuf(z.x, z.y);
        return a.zuBild(z.x, z.y);
      }, ziel);
      await anna.mouse.click(punkt.x, punkt.y, { button: 'right' });
      await anna.waitForFunction((z) => {
        const a = window.ansicht;
        const spaeher = [...a.nachher.values()].find((e) => e.b === a.ich && e.k === a.werte.einheiten.spaeherreiter.kuerzel);
        return Math.hypot(spaeher.x - z.x, spaeher.y - z.y) < 1.5;
      }, ziel, { timeout: 30_000 });
    };
    await zeitraffer(anna, code, 5);
    await reiten(lage.ziel);
    await reiten(lage.heim);
    await zeitraffer(anna, code, 1);
    // Eine halbe Sekunde, bis die Sicht am neuen Ort gerechnet ist.
    await anna.waitForFunction((z) => !window.ansicht.nebel.sieht(z.x, z.y) && window.ansicht.nebel.hatErkundet(z.x, z.y), lage.ziel, { timeout: 5_000 });

    // Bert stellt einen Mann auf den Weg, den Annas Spaeher kennt.
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { x: lage.ziel.x, y: lage.ziel.y }), 'Berts Mann').toBe(1);
    await anna.waitForFunction(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].some((e) => e.b !== a.ich && Math.hypot(e.x - a.spieler.get(a.ich).basis.x, e.y - a.spieler.get(a.ich).basis.y) > 12);
    });

    // Der Blick: das Dorf und der Weg, weit genug heraus, dass auch Schwarz zu sehen ist.
    const bild = await anna.evaluate((l) => {
      const a = window.ansicht;
      a.ausgewaehlt = new Set();
      a.beiAuswahl();
      a.kamera.zoom = 0.8;
      a.blickAuf((l.basis.x + l.ziel.x) / 2, l.basis.y + 2);
      return true;
    }, lage);
    expect(bild).toBe(true);
    await anna.waitForTimeout(400);
    const nachher = await anna.evaluate((z) => {
      const a = window.ansicht;
      const gezeichnet = new Set(a.reihenfolge.filter((d) => d.art === 'einheit').map((d) => d.id));
      const bert = [...a.nachher.values()].find((e) => e.b !== a.ich && Math.hypot(e.x - z.x, e.y - z.y) < 2);
      const p = (x, y) => a.zuBild(x, y);
      const imBild = (q) => q.x > 0 && q.y > 60 && q.x < a.leinwand.clientWidth && q.y < a.leinwand.clientHeight - 140;
      return {
        stufen: a.nebel.zaehlen(),
        bertDa: Boolean(bert),
        bertGezeichnet: bert ? gezeichnet.has(bert.i) : null,
        zielErkundet: a.nebel.hatErkundet(z.x, z.y),
        zielGesehen: a.nebel.sieht(z.x, z.y),
        zielImBild: imBild(p(z.x, z.y)),
        dorfImBild: imBild(p(a.spieler.get(a.ich).basis.x, a.spieler.get(a.ich).basis.y)),
        nieImBild: !a.nebel.hatErkundet(z.x, z.y + 12) && imBild(p(z.x, z.y + 12)),
      };
    }, lage.ziel);
    // Drei Stufen, alle im Bild (darstellung AC-15).
    expect(nachher.stufen.beobachtet).toBeGreaterThan(0);
    expect(nachher.stufen.erkundet, 'der Weg des Spaehers ist erkundet').toBeGreaterThan(0);
    expect(nachher.stufen.nie).toBeGreaterThan(0);
    expect(nachher.dorfImBild, 'das Dorf im Bild').toBe(true);
    expect(nachher.zielImBild, 'das Ende des Wegs im Bild').toBe(true);
    expect(nachher.nieImBild, 'und daneben nie Gesehenes').toBe(true);
    // Erinnert, aber unbeobachtet: Berts Mann steht dort und wird nicht gezeichnet (kampf AC-12).
    expect(nachher.zielErkundet && !nachher.zielGesehen, 'das Ziel ist erkundet, aber unbeobachtet').toBe(true);
    expect(nachher.bertDa, 'Bert steht dort - der Server schickt ihn noch (bis kampf AC-13)').toBe(true);
    expect(nachher.bertGezeichnet, 'Anna sieht ihn nicht').toBe(false);
    // Die Uebersichtskarte zeigt ihn auch nicht.
    const aufKarte = await anna.evaluate(() => window.uebersicht.punkte.filter((p) => p.art === 'einheit' && p.b !== window.ansicht.ich).length);
    expect(aufKarte, 'kein fremder Punkt auf der Uebersicht').toBe(0);
    expect(await bedienteileFrei(anna)).toEqual([]);

    for (const [spec, ac] of [[DARSTELLUNG, 'AC-15'], [KAMPF, 'AC-11'], [KAMPF, 'AC-12']]) {
      await nachweis(anna, {
        spec,
        ac,
        titel: 'Der Nebel in drei Stufen: hell um Annas Dorf, gedämpft der Weg, den ihr Späher geritten ist, schwarz der Rest — ebenso auf der Übersichtskarte',
        test: info,
      });
    }
  });

  test('kampf AC-12: ein fremdes Gebaeude im Nebel steht so da, wie man es zuletzt sah', async () => {
    const { anna } = partie;
    // Gegen die echte Ansicht im Browser: ein Gebaeude Berts auf einem Feld,
    // das Anna kennt, aber gerade nicht sieht. Ob sie es sieht, steuert der
    // Test ueber die Sicht dieses einen Feldes - der Rest ist Annas Ansicht,
    // wie sie ist.
    const ergebnis = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      let feld = null;
      for (let i = 0; i < g * g && !feld; i++) {
        if (a.nebel.erkundet[i] && !a.nebel.sichtbar[i] && !a.nebel.gebaeude[i]) feld = { x: i % g, y: Math.floor(i / g), i };
      }
      const bert = [...a.spieler.values()].find((s) => s.id !== a.ich).id;
      const haus = { i: 999999, art: 'haus', b: bert, x: feld.x, y: feld.y, h: 550 };
      const gezeigt = () => a.gezeigteGebaeude().some((b) => b.i === haus.i);
      const sehen = (an) => { a.nebel.sichtbar[feld.i] = an ? 1 : 0; a.erinnern(); };
      const schritte = {};
      // Im Nebel entstanden: unbekannt.
      a.gebaeude.set(haus.i, haus);
      sehen(false);
      schritte.neuImNebel = gezeigt();
      // Gesehen: bekannt.
      sehen(true);
      schritte.gesehen = gezeigt();
      // Wieder im Nebel, und inzwischen gefallen: man weiss es nicht - es steht noch.
      a.gebaeude.delete(haus.i);
      sehen(false);
      schritte.gefallenImNebel = gezeigt();
      // Wieder hingesehen: es ist weg.
      sehen(true);
      schritte.wiederGesehen = gezeigt();
      sehen(false);
      return schritte;
    });
    expect(ergebnis.neuImNebel, 'im Nebel gebaut: unbekannt').toBe(false);
    expect(ergebnis.gesehen, 'gesehen: bekannt').toBe(true);
    expect(ergebnis.gefallenImNebel, 'im Nebel gefallen: steht in der Erinnerung noch').toBe(true);
    expect(ergebnis.wiederGesehen, 'wieder gesehen: vergessen').toBe(false);
  });
});

// Die Sicht als Einstellung (kampf AC-16): eroeffnet "Erkundet", ist die Karte
// von Anfang an bekannt - gedaempft -, und nur um das eigene Dorf ist es hell.
test.describe('Sicht erkundet', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'erkundet' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('kampf AC-16: als Erkundet eroeffnet, ist die ganze Karte bekannt, hell nur um das eigene Dorf', async ({}, info) => {
    const { anna } = partie;
    await anna.waitForFunction(() => window.ansicht.nebel && window.ansicht.nebel.takt > -Infinity);
    const lage = await anna.evaluate(() => {
      const a = window.ansicht;
      a.kamera.zoom = 0.7;
      const b = a.spieler.get(a.ich).basis;
      a.blickAuf(b.x + 6, b.y + 6);
      const fremd = [...a.spieler.values()].find((s) => s.id !== a.ich).basis;
      return { sicht: a.sichtArt, stufen: a.nebel.zaehlen(), fremdErkundet: a.nebel.hatErkundet(fremd.x, fremd.y), fremdGesehen: a.nebel.sieht(fremd.x, fremd.y) };
    });
    expect(lage.sicht).toBe('erkundet');
    expect(lage.stufen.nie, 'nichts ist unbekannt').toBe(0);
    expect(lage.stufen.beobachtet, 'hell um das Dorf').toBeGreaterThan(0);
    expect(lage.stufen.erkundet, 'der Rest gedaempft').toBeGreaterThan(lage.stufen.beobachtet);
    // Gegenprobe: Berts Dorf kennt Anna, sieht es aber nicht.
    expect(lage.fremdErkundet && !lage.fremdGesehen, 'Berts Dorf bekannt, nicht beobachtet').toBe(true);
    await anna.waitForTimeout(300);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: KAMPF,
      ac: 'AC-16',
      titel: 'Als „Erkundet“ eröffnet: die ganze Karte ist bekannt und gedämpft, hell nur um Annas Dorf — auch auf der Übersichtskarte',
      test: info,
    });
  });
});
