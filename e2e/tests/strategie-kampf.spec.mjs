// Der Kampf im Bild (→ specs/10-strategie/kampf.md AC-1 und AC-10): ein
// Rechtsklick auf eine fremde Einheit laesst die eigenen hinlaufen und
// zuschlagen; wer fallt, liegt zwei Sekunden am Boden. Die Regeln dahinter -
// Schaden, Nachladezeit, kein Zufall - stehen in tests/strategie-kampf.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, figurenFrei, freieWiesen, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const KAMPF = '10-strategie/kampf.md';
const BEFEHLE = '10-strategie/einheiten-und-befehle.md';

/** Die Nummern aller Milizen, die diese Seite sieht - eigene und fremde. */
const milizen = (page) => page.evaluate(() => {
  const a = window.ansicht;
  return [...a.nachher.values()].filter((e) => e.k === 'm')
    .map((e) => ({ i: e.i, eigen: e.b === a.ich, x: e.x, y: e.y }));
});

test.describe('Kampf', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let feind;
  let fernwiese;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
    const { anna, code } = partie;
    // Zwei freie Wiesen, weit genug auseinander: auf der zweiten steht der
    // Fernkampf, damit die Ueberlebenden des ersten Gefechts nicht hineinlaufen.
    const wiesen = await freieWiesen(anna, 2);
    const wiese = wiesen[0];
    [, fernwiese] = wiesen;
    // Drei Milizen Annas, zwei Berts fuenf Felder weiter: weit genug, dass man
    // sie hinlaufen sieht, nah genug fuer ein Bild.
    expect(await einheitenAufstellen(anna, code, 'Anna', 3, { art: 'miliz', x: wiese.x - 2, y: wiese.y - 2 })).toBe(3);
    expect(await einheitenAufstellen(anna, code, 'Bert', 2, { art: 'miliz', x: wiese.x + 2, y: wiese.y + 2 })).toBe(2);
    await anna.waitForFunction(() => [...window.ansicht.nachher.values()].filter((e) => e.k === 'm').length >= 5);
  });
  test.afterAll(() => partieBeenden(partie));

  test('kampf AC-1 und einheiten AC-31: ein Rechtsklick auf eine fremde Einheit laesst die eigenen hinlaufen und zuschlagen', async ({}, info) => {
    const { anna, bert, code } = partie;
    const alle = await milizen(anna);
    const meine = alle.filter((e) => e.eigen);
    const fremde = alle.filter((e) => !e.eigen);
    expect(meine.length, 'drei eigene').toBe(3);
    expect(fremde.length, 'zwei fremde').toBe(2);
    feind = fremde[0].i;

    // Auswaehlen, dann der Rechtsklick auf die fremde Miliz - kein eigener
    // Knopf, keine eigene Betriebsart.
    const bild = await anna.evaluate(([ids, ziel]) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set(ids);
      a.beiAuswahl();
      a.kamera.zoom = 2.4;
      const e = a.nachher.get(ziel);
      a.blickAuf((a.nachher.get(ids[0]).x + e.x) / 2, (a.nachher.get(ids[0]).y + e.y) / 2);
      return a.zuBild(e.x, e.y);
    }, [meine.map((e) => e.i), feind]);
    await anna.mouse.click(bild.x, bild.y, { button: 'right' });

    // Sie laufen hin und schlagen zu: das Leben des Ziels faellt unter die
    // Haelfte. Vorher stand davon nichts im Zustand - voll wird nicht geschickt.
    await anna.waitForFunction((id) => {
      const e = window.ansicht.nachher.get(id);
      // 16 von 40: vier Schlaege einer Miliz, und sicher unter der Haelfte -
      // genau 20 waere "halb voll" und nicht weniger (Runde 63).
      return e && e.h > 0 && e.h <= 16;
    }, feind, { timeout: 60_000 });
    // Angehalten: so laesst sich der Augenblick in Ruhe ins Bild setzen.
    await zeitraffer(anna, code, 0);

    // Das Bild macht Bert: er sieht den Lebensbalken seiner Miliz, weil sie
    // ausgewaehlt ist (darstellung AC-8).
    const lage = await bert.evaluate((id) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set([id]);
      a.beiAuswahl();
      a.kamera.zoom = 2.6;
      const e = a.nachher.get(id);
      a.blickAuf(e.x, e.y);
      const nah = [...a.nachher.values()].filter((f) => f.b !== a.ich && f.k === 'm'
        && Math.hypot(f.x - e.x, f.y - e.y) <= 2.5);
      return {
        anteil: e.h / a.lebenVoll(e),
        nah: nah.length,
        punkte: [e, ...nah].map((f) => a.zuBild(f.x, f.y)),
        feld: { b: a.leinwand.clientWidth, h: a.leinwand.clientHeight },
      };
    }, feind);
    expect(lage.anteil, 'der Balken ist weniger als halb voll').toBeLessThan(0.5);
    expect(lage.anteil, 'aber sie lebt noch').toBeGreaterThan(0);
    expect(lage.nah, 'drei Angreifer stehen dicht dabei').toBe(3);
    for (const p of lage.punkte) {
      expect(p.x, 'im Bild').toBeGreaterThan(40);
      expect(p.x).toBeLessThan(lage.feld.b - 40);
      expect(p.y).toBeGreaterThan(60);
      expect(p.y).toBeLessThan(lage.feld.h - 220);
    }
    expect(await bedienteileFrei(bert)).toEqual([]);
    // Keine zwei aufeinander (einheiten AC-31, Runde 100). Bis dahin fehlte
    // diese Pruefung mit Absicht: zwei von Annas drei Angreifern standen 0,27
    // bis 0,39 Felder auseinander (Rueckschau nach Runde 65).
    expect(await figurenFrei(bert)).toEqual([]);
    await bert.waitForTimeout(300);
    for (const [spec, ac] of [[KAMPF, 'AC-1'], ['10-strategie/einheiten-und-befehle.md', 'AC-31']]) {
      await nachweis(bert, {
        spec,
        ac,
        titel: 'Berts Miliz (rot, gewählt) wird von drei Milizen Annas (blau) geschlagen, die als drei getrennte Figuren dicht bei ihr stehen — ihr Lebensbalken ist weniger als halb voll',
        test: info,
      });
    }
  });

  test('kampf AC-10: wer fallt, liegt zwei Sekunden am Boden', async ({}, info) => {
    const { anna, bert, code } = partie;
    const bevVorher = await bert.evaluate(() => window.ansicht.vorraete.bev);
    await zeitraffer(anna, code, 1);
    await anna.waitForFunction((id) => window.ansicht.nachher.get(id)?.s === 1, feind, { timeout: 60_000 });
    // Anhalten, solange er liegt: im Spiel sind das zwei Sekunden.
    await zeitraffer(anna, code, 0);

    // Er zaehlt nicht mehr: nicht zur Bevoelkerung, nicht zur Auswahl.
    await bert.waitForFunction(() => window.ansicht.ausgewaehlt.size === 0, null, { timeout: 10_000 });
    expect(await bert.evaluate(() => window.ansicht.vorraete.bev), 'einer weniger').toBe(bevVorher - 1);

    const lage = await anna.evaluate((id) => {
      const a = window.ansicht;
      const e = a.nachher.get(id);
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set();
      a.beiAuswahl();
      a.kamera.zoom = 3;
      a.blickAuf(e.x, e.y);
      const lebende = [...a.nachher.values()].filter((f) => f.k === 'm' && !f.s);
      return {
        liegt: Boolean(e.s),
        tote: [...a.nachher.values()].filter((f) => f.s).length,
        meine: lebende.filter((f) => f.b === a.ich).length,
        punkt: a.zuBild(e.x, e.y),
        feld: { b: a.leinwand.clientWidth, h: a.leinwand.clientHeight },
      };
    }, feind);
    expect(lage.liegt, 'der Gefallene steht noch im Zustand').toBe(true);
    expect(lage.tote, 'genau einer liegt').toBe(1);
    expect(lage.meine, 'Annas drei Milizen stehen').toBe(3);
    expect(lage.punkt.x).toBeGreaterThan(40);
    expect(lage.punkt.x).toBeLessThan(lage.feld.b - 40);
    expect(lage.punkt.y).toBeGreaterThan(60);
    expect(lage.punkt.y).toBeLessThan(lage.feld.h - 220);
    // Drei stehen - als drei, nicht als zwei (einheiten AC-31).
    expect(await figurenFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: KAMPF,
      ac: 'AC-10',
      titel: 'Berts Miliz ist gefallen: sie liegt umgekippt am Boden, während Annas drei Milizen daneben stehen',
      test: info,
    });

    // Laeuft die Welt weiter, ist er nach zwei Sekunden weg.
    await zeitraffer(anna, code, 1);
    await anna.waitForFunction((id) => !window.ansicht.nachher.has(id), feind, { timeout: 15_000 });
  });

  test('einheiten AC-25: ein Bogenschuetze schiesst aus vier Feldern, die Miliz steht daneben im Nahkampf', async ({}, info) => {
    const { anna, code } = partie;
    // Berts Miliz in der Mitte der zweiten Wiese, Annas zwei Bogenschuetzen und
    // eine Miliz acht Felder davon: sie laufen selbst heran, und wo sie halten,
    // ist das Kriterium.
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'miliz', ...fernwiese })).toBe(1);
    // Jeder von einer anderen Seite: zwei Fernkaempfer, die aus derselben
    // Richtung kommen, halten auf demselben Punkt und stehen im Bild
    // uebereinander (offen als einheiten AC-26).
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, {
      art: 'bogenschuetze', x: fernwiese.x - 8, y: fernwiese.y,
    })).toBe(1);
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, {
      art: 'plaenkler', x: fernwiese.x, y: fernwiese.y - 8,
    })).toBe(1);
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, {
      art: 'miliz', x: fernwiese.x + 8, y: fernwiese.y,
    })).toBe(1);

    // Erst wenn der naechste Zustand da ist, kennt der Browser die vier.
    await anna.waitForFunction((mitte) => {
      const a = window.ansicht;
      const nah = [...a.nachher.values()].filter((e) => Math.hypot(e.x - mitte.x, e.y - mitte.y) < 12);
      return nah.filter((e) => e.b === a.ich && (e.k === 'b' || e.k === 'k')).length === 2
        && nah.filter((e) => e.b === a.ich && e.k === 'm').length === 1
        && nah.some((e) => e.b !== a.ich && e.k === 'm');
    }, fernwiese, { timeout: 15_000 });

    // Auswaehlen und ein Rechtsklick auf die fremde Miliz - fuer alle drei
    // derselbe Befehl, aber nicht derselbe Abstand.
    const meine = await anna.evaluate((mitte) => {
      const a = window.ansicht;
      const nah = [...a.nachher.values()].filter((e) => Math.hypot(e.x - mitte.x, e.y - mitte.y) < 12);
      const opfer = nah.find((e) => e.b !== a.ich && e.k === 'm');
      const ids = nah.filter((e) => e.b === a.ich && ['b', 'k', 'm'].includes(e.k)).map((e) => e.i);
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set(ids);
      a.beiAuswahl();
      a.kamera.zoom = 2;
      a.blickAuf(mitte.x, mitte.y);
      return { ids, opfer: opfer.i, bild: a.zuBild(opfer.x, opfer.y) };
    }, fernwiese);
    expect(meine.ids.length, 'Bogenschuetze, Plaenkler und Miliz').toBe(3);
    await anna.mouse.click(meine.bild.x, meine.bild.y, { button: 'right' });

    // Gewartet wird, bis beides steht: die Miliz im Nahkampf und beide
    // Schuetzen auf ihrem Abstand, das Ziel angeschlagen und noch am Leben.
    await anna.waitForFunction(([mitte, opferId]) => {
      const a = window.ansicht;
      const opfer = a.nachher.get(opferId);
      if (!opfer || opfer.s || opfer.h >= 40) return false;
      const meins = [...a.nachher.values()].filter((e) => e.b === a.ich
        && Math.hypot(e.x - mitte.x, e.y - mitte.y) < 12);
      const schuetzen = meins.filter((e) => e.k === 'b' || e.k === 'k');
      const nahkampf = meins.filter((e) => e.k === 'm' && Math.hypot(e.x - opfer.x, e.y - opfer.y) <= 1.6);
      return schuetzen.length === 2
        && schuetzen.every((e) => {
          const d = Math.hypot(e.x - opfer.x, e.y - opfer.y);
          return d > 3.4 && d < 4.7;
        })
        && nahkampf.length === 1;
    }, [fernwiese, meine.opfer], { timeout: 60_000 });
    await zeitraffer(anna, code, 0);

    // Dasselbe noch einmal als Zusicherung, mit Zahlen fuer die Unterschrift.
    const lage = await anna.evaluate((opferId) => {
      const a = window.ansicht;
      const opfer = a.nachher.get(opferId);
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set();
      a.beiAuswahl();
      a.kamera.zoom = 2.8;
      const meins = [...a.nachher.values()].filter((e) => e.b === a.ich
        && Math.hypot(e.x - opfer.x, e.y - opfer.y) < 12);
      const schuetzen = meins.filter((e) => e.k === 'b' || e.k === 'k');
      const nahkaempfer = meins.filter((e) => e.k === 'm' && Math.hypot(e.x - opfer.x, e.y - opfer.y) <= 1.6);
      const beteiligte = [opfer, ...schuetzen, ...nahkaempfer];
      const mx = beteiligte.reduce((s, e) => s + e.x, 0) / beteiligte.length;
      const my = beteiligte.reduce((s, e) => s + e.y, 0) / beteiligte.length;
      a.blickAuf(mx, my);
      return {
        abstaende: schuetzen.map((e) => Math.hypot(e.x - opfer.x, e.y - opfer.y)),
        nahkampf: nahkaempfer.map((e) => Math.hypot(e.x - opfer.x, e.y - opfer.y)),
        leben: opfer.h,
        punkte: beteiligte.map((e) => a.zuBild(e.x, e.y)),
        feld: { b: a.leinwand.clientWidth, h: a.leinwand.clientHeight },
      };
    }, meine.opfer);
    expect(lage.abstaende.length, 'Bogenschuetze und Plaenkler').toBe(2);
    for (const abstand of lage.abstaende) {
      expect(abstand, 'der Fernkaempfer haelt vier Felder').toBeGreaterThan(3.4);
      expect(abstand).toBeLessThan(4.7);
    }
    expect(lage.nahkampf.length, 'die Miliz steht dagegen am Ziel').toBe(1);
    expect(lage.nahkampf[0]).toBeLessThan(1.6);
    expect(lage.leben, 'das Ziel ist angeschlagen und lebt').toBeGreaterThan(0);
    expect(lage.leben).toBeLessThan(40);
    for (const p of lage.punkte) {
      expect(p.x, 'im Bild').toBeGreaterThan(40);
      expect(p.x).toBeLessThan(lage.feld.b - 40);
      expect(p.y).toBeGreaterThan(60);
      expect(p.y).toBeLessThan(lage.feld.h - 220);
    }
    expect(await bedienteileFrei(anna)).toEqual([]);
    // Das erste Bild zu diesem Kriterium zeigte zwei Bogenschuetzen als eine
    // Figur mit zwei Boegen (Runde 64). Jetzt sagt es eine Zahl.
    expect(await figurenFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BEFEHLE,
      ac: 'AC-25',
      titel: 'Bogenschütze und Plänkler Annas (blau) halten vier Felder Abstand zu Berts Miliz (rot), während Annas Miliz daneben im Nahkampf steht',
      test: info,
    });
    await zeitraffer(anna, code, 1);
  });
});
