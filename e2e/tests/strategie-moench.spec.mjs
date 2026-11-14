// Der Moench (→ specs/10-strategie/einheiten-und-befehle.md AC-37): er steht
// neben einer verletzten eigenen Miliz, hebt den Stab und heilt sie - ihr
// Leben steigt, und an der Spitze seines Stabes glimmt ein Schein, solange
// er heilt. Die Regeln selbst (je Sekunde ein Punkt, nicht Gebaeude, nicht
// Belagerung, nicht wer kaempft) prueft tests/strategie-moench.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { zeichenHalten } from '../helpers/strategie.mjs';
import { einheitenAufstellen, expect, lebenSetzen, test, zeitraffer } from '../helpers/seite.mjs';
import {
  bedienteileFrei, figurenFrei, freieWiesen, partieBeenden, partieZuZweit,
} from '../helpers/strategie.mjs';

const EINHEITEN = '10-strategie/einheiten-und-befehle.md';
const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Moench', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('einheiten AC-37: der Moench heilt eine verletzte Miliz neben ihm - ihr Leben steigt, und er hebt dabei den Stab', async ({}, info) => {
    const { anna, code } = partie;
    const [wiese] = await freieWiesen(anna, 1);
    const kuerzel = await anna.evaluate(() => {
      const e = window.ansicht.werte.einheiten;
      return { moench: e.moench.kuerzel, miliz: e.miliz.kuerzel };
    });

    // Annas Moench und zwei Felder daneben ihre Miliz, mitten auf der Wiese.
    await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'moench', x: wiese.x - 1, y: wiese.y });
    await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'miliz', x: wiese.x + 1, y: wiese.y });
    const { moench, miliz } = await anna.waitForFunction(([k, w]) => {
      const a = window.ansicht;
      const nahe = (e) => Math.hypot(e.x - w.x, e.y - w.y) < 4;
      const moench = [...a.nachher.values()].find((e) => e.k === k.moench && e.b === a.ich && nahe(e));
      const miliz = [...a.nachher.values()].find((e) => e.k === k.miliz && e.b === a.ich && nahe(e));
      return moench && miliz && { moench: { i: moench.i }, miliz: { i: miliz.i } };
    }, [kuerzel, wiese]).then((h) => h.jsonValue());

    // Noch ist niemand verletzt: der Moench arbeitet nicht.
    await expect.poll(() => anna.evaluate((id) => window.ansicht.nachher.get(id)?.w, moench.i)).toBeFalsy();

    // Die Miliz verliert gut die Haelfte ihres Lebens (Pruefgriff - wie sie
    // es verliert, belegt der Kampf). Ab dann steigt es, und er arbeitet.
    const voll = await anna.evaluate(() => window.ansicht.werte.einheiten.miliz.leben);
    const rest = Math.round(voll * 0.4);
    await lebenSetzen(anna, code, miliz.i, rest);
    await expect.poll(() => anna.evaluate((id) => window.ansicht.nachher.get(id)?.w, moench.i), { timeout: 10_000 }).toBe(1);
    await expect.poll(() => anna.evaluate((id) => window.ansicht.nachher.get(id)?.h, miliz.i), { timeout: 10_000 })
      .toBeGreaterThanOrEqual(rest + 2);
    // Fuer das Bild anhalten, bevor sie wieder voll ist.
    await zeitraffer(anna, code, 0);
    const jetzt = await anna.evaluate((id) => window.ansicht.nachher.get(id).h, miliz.i);
    expect(jetzt, 'noch nicht voll').toBeLessThan(voll);

    const waehlen = (id) => anna.evaluate(([e, w]) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set([e]);
      a.beiAuswahl();
      a.kamera.zoom = 2.5;
      a.blickAuf(w.x, w.y + 0.6);
    }, [id, wiese]);

    // Den Moench gewaehlt: die Leiste sagt, dass er nicht angreift, aber
    // heilt - kein "Angriff 0, Nahkampf".
    await waehlen(moench.i);
    const werte = anna.locator('#kampfwerte');
    await expect(werte).toBeInViewport();
    await expect(werte).toContainText('Greift nicht an');
    await expect(werte).toContainText('Heilt');
    await expect(werte).not.toContainText('Nahkampf');
    await expect(werte).toHaveAttribute('data-heilen', '1');

    // Ein Rechtsklick des Moenchs auf ein fremdes Gebaeude ist nur ein Gang -
    // das Zeichen bleibt weiss, wie der Server ohne Angriff keinen beginnt.
    // Gefragt wird dieselbe Stelle, die der Klick fragt, an Berts
    // Dorfzentrum; zum Vergleich die Miliz, fuer die es ein Angriff ist (rot).
    const zeichenAufBert = (id) => anna.evaluate((e) => {
      const a = window.ansicht;
      const zentrum = [...a.gebaeude.values()].find((g) => g.b !== a.ich && g.art === 'dorfzentrum');
      const vorher = a.ausgewaehlt;
      a.ausgewaehlt = new Set([e]);
      a.zielzeichenSetzen(a.gebaeudeMitte(zentrum));
      const feindlich = a.zielzeichen.feindlich;
      a.zielzeichen = null;
      a.ausgewaehlt = vorher;
      return feindlich;
    }, id);
    expect(await zeichenAufBert(moench.i), 'fuer den Moench ein Gang').toBe(false);
    expect(await zeichenAufBert(miliz.i), 'fuer die Miliz ein Angriff').toBe(true);

    // Fuer das Bild die Miliz gewaehlt: ihr Lebensbalken steht ueber ihr.
    await waehlen(miliz.i);
    const lage = await anna.evaluate(([m, z]) => {
      const a = window.ansicht;
      const p = (id) => { const e = a.nachher.get(id); return a.zuBild(e.x, e.y); };
      return { m: p(m), z: p(z), b: a.leinwand.clientWidth, h: a.leinwand.clientHeight };
    }, [moench.i, miliz.i]);
    for (const p of [lage.m, lage.z]) {
      expect(p.x).toBeGreaterThan(80);
      expect(p.x).toBeLessThan(lage.b - 80);
      expect(p.y).toBeGreaterThan(160);
      expect(p.y).toBeLessThan(lage.h - 240);
    }
    expect(await bedienteileFrei(anna)).toEqual([]);
    expect(await figurenFrei(anna)).toEqual([]);
    await anna.waitForTimeout(150);

    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-37',
      titel: 'Annas Mönch (blau) heilt ihre gewählte Miliz daneben – deren Lebensbalken ist noch nicht voll',
      test: info,
    });
    await zeitraffer(anna, code, 1);
  });

  // Ein Feld der Karte als Punkt auf der Seite.
  const aufSeite = (page, feld) => page.evaluate((f) => {
    const a = window.ansicht;
    const p = a.zuBild(f.x, f.y);
    const r = a.leinwand.getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y };
  }, feld);

  test('einheiten AC-38: ein Rechtsklick des Moenchs auf Berts Dorfbewohner ist rot, und nach ein paar Sekunden gehoert der Dorfbewohner Anna', async ({}, info) => {
    const { anna, code } = partie;
    // Die zweite Wiese: auf der ersten stehen Moench und Miliz aus AC-37, und
    // die Miliz wacht - sie griffe Berts Dorfbewohner an.
    const [, wiese] = await freieWiesen(anna, 2);
    const kuerzel = await anna.evaluate(() => window.ansicht.werte.einheiten.moench.kuerzel);

    // Annas Moench links, Berts Dorfbewohner fuenf Felder rechts davon - in
    // Reichweite, er muss nicht erst hingehen. Der Dorfbewohner wacht nicht
    // und laeuft nicht weg; Bert spielt nicht.
    await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'moench', x: wiese.x - 2, y: wiese.y + 1 });
    await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'dorfbewohner', x: wiese.x + 2, y: wiese.y + 1 });
    const { moench, bauer } = await anna.waitForFunction(([k, w]) => {
      const a = window.ansicht;
      const nahe = (e) => Math.hypot(e.x - w.x, e.y - (w.y + 1)) < 4.5;
      const moench = [...a.nachher.values()].find((e) => e.k === k && e.b === a.ich && nahe(e) && !e.r);
      const bauer = [...a.nachher.values()].find((e) => e.k === 'd' && e.b !== a.ich && nahe(e));
      return moench && bauer && { moench: { i: moench.i }, bauer: { i: bauer.i, x: bauer.x, y: bauer.y } };
    }, [kuerzel, wiese]).then((h) => h.jsonValue());

    await anna.evaluate(([id, w]) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set([id]);
      a.beiAuswahl();
      a.kamera.zoom = 2.5;
      a.blickAuf(w.x, w.y + 1.6);
    }, [moench.i, wiese]);

    // Die Leiste nennt die Reichweite des Bekehrens.
    await expect(anna.locator('#kampfwerte')).toBeInViewport();
    await expect(anna.locator('#kampfwerte')).toContainText('Bekehrt');
    await expect(anna.locator('#kampfwerte')).toHaveAttribute('data-bekehren', '9');

    // Rechtsklick auf Berts Dorfbewohner: fuer den Moench ein Ziel, das
    // Zeichen ist rot - anders als auf Berts Dorfzentrum (einheiten AC-37).
    const aufBauer = await aufSeite(anna, bauer);
    await zeichenHalten(anna);
    await anna.mouse.click(aufBauer.x, aufBauer.y, { button: 'right' });
    expect(await anna.evaluate(() => window.ansicht.zielzeichen?.feindlich), 'der Dorfbewohner ist ein Ziel').toBe(true);

    // Der Moench beginnt, ohne zu gehen: er arbeitet. Dann die Welt anhalten
    // und das Zeichen stehen lassen - fruehestens nach vier Sekunden waere
    // der Dorfbewohner schon bekehrt.
    await expect.poll(() => anna.evaluate((id) => window.ansicht.nachher.get(id)?.w, moench.i), { timeout: 3_000 }).toBe(1);
    await zeitraffer(anna, code, 0);
    await anna.evaluate(() => { window.ansicht.zielzeichen.seit = performance.now() + 60_000; });
    expect(await anna.evaluate((id) => window.ansicht.nachher.get(id).b !== window.ansicht.ich, bauer.i), 'noch Berts').toBe(true);

    const imBild = async () => {
      const lage = await anna.evaluate(([m, z]) => {
        const a = window.ansicht;
        const p = (id) => { const e = a.nachher.get(id); return a.zuBild(e.x, e.y); };
        return { m: p(m), z: p(z), b: a.leinwand.clientWidth, h: a.leinwand.clientHeight };
      }, [moench.i, bauer.i]);
      for (const p of [lage.m, lage.z]) {
        expect(p.x).toBeGreaterThan(80);
        expect(p.x).toBeLessThan(lage.b - 80);
        expect(p.y).toBeGreaterThan(160);
        expect(p.y).toBeLessThan(lage.h - 240);
      }
      expect(await bedienteileFrei(anna)).toEqual([]);
      expect(await figurenFrei(anna)).toEqual([]);
      await anna.waitForTimeout(150);
    };
    await imBild();
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-38',
      titel: 'Vorher: Annas gewählter Mönch (blau) bekehrt Berts Dorfbewohner (rot), auf dem das rote Zeichen des Rechtsklicks liegt',
      test: info,
    });

    // Weiterlaufen lassen, bis der Dorfbewohner Anna gehoert.
    await anna.evaluate(() => { window.ansicht.zielzeichen = null; });
    await zeitraffer(anna, code, 1);
    await expect.poll(() => anna.evaluate((id) => window.ansicht.nachher.get(id)?.b === window.ansicht.ich, bauer.i), { timeout: 15_000 })
      .toBe(true);
    await zeitraffer(anna, code, 0);
    // Danach ruht der Moench: ein zweiter Rechtsklick auf einen Fremden waere
    // kein Ziel - der Browser fragt dafuer `r`.
    expect(await anna.evaluate((id) => window.ansicht.nachher.get(id).r, moench.i), 'er ruht').toBeGreaterThan(0);
    expect(await anna.evaluate((id) => window.ansicht.nachher.get(id).w, moench.i), 'er arbeitet nicht mehr').toBeFalsy();

    await imBild();
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-38',
      titel: 'Nachher: derselbe Dorfbewohner trägt jetzt Annas Blau, ihr Mönch ruht',
      test: info,
    });
    await zeitraffer(anna, code, 1);
  });

  // Rueckmeldung des Benutzers: man sah dem Moench nicht an, ob er schon
  // wieder bekehren kann. Der Moench aus dem Fall davor ruht noch.
  test('bedienung AC-68: der Moench ruht sichtbar - ueber ihm fuellt sich ein blauer Balken, die Leiste zaehlt die Sekunden herunter', async ({}, info) => {
    const { anna, code } = partie;
    const moench = await anna.evaluate(() => {
      const a = window.ansicht;
      const e = [...a.nachher.values()].find((f) => f.b === a.ich && f.r > 0 && !f.s);
      if (!e) return null;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set([e.i]);
      a.beiAuswahl();
      a.kamera.zoom = 2.5;
      a.blickAuf(e.x, e.y + 1.2);
      return { i: e.i, r: e.r, ruhe: a.werte.einheiten[a.arten[e.k]].bekehren.ruhe };
    });
    expect(moench, 'Annas Moench ruht noch').not.toBeNull();
    expect(moench.ruhe).toBe(62);

    const stand = () => anna.evaluate((id) => {
      const a = window.ansicht;
      const balken = a.lebensbalken.find((b) => b.art === 'ruhe' && b.i === id);
      if (!balken) return { r: a.nachher.get(id).r ?? 0, balken: null };
      // Die Farbe mitten im gefuellten Teil und im leeren dahinter.
      const d = window.devicePixelRatio || 1;
      const punkt = (x) => [...a.stift.getImageData(Math.round(x * d), Math.round((balken.y - 2) * d), 1, 1).data].slice(0, 3);
      const links = balken.x - balken.breite / 2;
      return {
        r: a.nachher.get(id).r ?? 0,
        balken: { anteil: balken.anteil, breite: balken.breite, voll: punkt(links + (balken.breite * balken.anteil) / 2), leer: punkt(links + balken.breite * (balken.anteil + 1) / 2) },
        leben: a.lebensbalken.find((b) => b.art === 'einheit' && b.i === id)?.y ?? null,
        y: balken.y,
      };
    }, moench.i);

    // Bis er noch rund zwanzig Sekunden ruht, dann steht die Welt.
    await zeitraffer(anna, code, 6);
    await anna.waitForFunction((id) => window.ansicht.nachher.get(id).r <= 22, moench.i, { timeout: 30_000 });
    await zeitraffer(anna, code, 0);
    await anna.waitForTimeout(400);
    const mitten = await stand();
    expect(mitten.r).toBeGreaterThan(0);
    expect(mitten.r).toBeLessThanOrEqual(22);
    expect(mitten.balken, 'ueber dem Moench steht der Balken der Ruhe').not.toBeNull();
    expect(mitten.balken.anteil).toBeCloseTo(1 - mitten.r / 62, 5);
    // Gefuellt blau, dahinter der dunkle Grund.
    const [rot, gruen, blau] = mitten.balken.voll;
    expect(blau, `gefuellt ist er blau: ${mitten.balken.voll}`).toBeGreaterThan(rot + 60);
    expect(blau).toBeGreaterThan(gruen + 20);
    expect(Math.max(...mitten.balken.leer), `der Rest ist dunkel: ${mitten.balken.leer}`).toBeLessThan(70);
    // Unter dem Lebensbalken, nicht darauf.
    expect(mitten.y - mitten.leben).toBeGreaterThanOrEqual(5);

    // Die Leiste nennt die Sekunden.
    const zeit = `${Math.floor(mitten.r / 60)}:${String(mitten.r % 60).padStart(2, '0')}`;
    await expect(anna.locator('#kampfwerte')).toHaveAttribute('data-ruht', String(mitten.r));
    await expect(anna.locator('#kampfwerte .ruht')).toContainText(`ruht noch ${zeit}`);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-68',
      titel: 'Annas Mönch ruht nach der Bekehrung: unter seinem Lebensbalken füllt sich ein blauer, unten steht, wie lange noch',
      test: info,
    });

    // Ist die Ruhe um, verschwindet beides, und die Leiste nennt wieder die Reichweite.
    await zeitraffer(anna, code, 8);
    await anna.waitForFunction((id) => !window.ansicht.nachher.get(id).r, moench.i, { timeout: 30_000 });
    await zeitraffer(anna, code, 1);
    await expect(anna.locator('#kampfwerte')).not.toHaveAttribute('data-ruht', /.*/);
    await expect(anna.locator('#kampfwerte')).toContainText('9 Felder');
    await anna.waitForTimeout(200);
    expect((await stand()).balken).toBeNull();
  });

  // Rueckmeldung des Benutzers: "der mönch macht keine geräuscht beim bekehren
  // oder heilen". Schall hat kein Bild - gezaehlt wird, was das Spiel spielt
  // (`ton.gezaehlt`, wie bei Kampf und Arbeit in strategie-ton.spec.mjs).
  test('bedienung AC-74: der Moench ist zu hoeren - ein Gloeckchen, solange er heilt, Gesang, solange er bekehrt, ein heller Schlag beim Uebertritt', async () => {
    const { anna, code } = partie;
    await zeitraffer(anna, code, 1);
    // Die zweite Wiese noch einmal - eine dritte hat die Karte nicht. Dort
    // steht Annas Moench aus den beiden Faellen davor, ausgeruht, und der
    // Dorfbewohner, den er bekehrt hat.
    const [, wiese] = await freieWiesen(anna, 2);
    const kuerzel = await anna.evaluate(() => window.ansicht.werte.einheiten.moench.kuerzel);
    const gezaehlt = (name) => anna.evaluate((n) => window.ton.gezaehlt.get(n) || 0, name);
    const wert = (id, feld) => anna.evaluate(([i, f]) => window.ansicht.nachher.get(i)?.[f], [id, feld]);

    // Erst woanders hinsehen: Berts Dorf, weit weg von der Wiese.
    await anna.evaluate(() => {
      const a = window.ansicht;
      const fremd = [...a.spieler.values()].find((s) => s.id !== a.ich).basis;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set();
      a.beiAuswahl();
      a.kamera.zoom = 1.5;
      a.blickAuf(fremd.x, fremd.y);
    });
    // Neben Annas Moench ein Dorfbewohner von ihr - der wacht nicht und
    // griffe Berts Dorfbewohner nicht an, wie es eine Miliz taete.
    await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'dorfbewohner', x: wiese.x - 3, y: wiese.y - 1 });
    const { moench, kranker } = await anna.waitForFunction(([k, w]) => {
      const a = window.ansicht;
      const moench = [...a.nachher.values()].find((e) => e.k === k && e.b === a.ich && !e.r && Math.hypot(e.x - w.x, e.y - w.y) < 4.5);
      const kranker = [...a.nachher.values()].find((e) => e.k === 'd' && e.b === a.ich && Math.hypot(e.x - (w.x - 3), e.y - (w.y - 1)) < 1.5);
      return moench && kranker && { moench: { i: moench.i }, kranker: { i: kranker.i } };
    }, [kuerzel, wiese]).then((h) => h.jsonValue());
    await lebenSetzen(anna, code, kranker.i, 5);
    await expect.poll(() => wert(moench.i, 'w'), { timeout: 10_000 }).toBe(1);
    expect(await wert(moench.i, 'bk'), 'er heilt, er bekehrt nicht').toBeUndefined();

    // Ausserhalb des Bildes klingt nichts.
    const still = await gezaehlt('heilen');
    await anna.waitForTimeout(1500);
    expect(await gezaehlt('heilen'), 'der Moench heilt ausserhalb des Bildes').toBe(still);

    // Hingesehen: das Gloeckchen, rund einmal je Sekunde - und kein Gesang.
    const gesangVorher = await gezaehlt('bekehren');
    await anna.evaluate((w) => {
      const a = window.ansicht;
      a.kamera.zoom = 2;
      a.blickAuf(w.x, w.y + 1);
    }, wiese);
    const beginn = Date.now();
    await expect.poll(() => gezaehlt('heilen'), { timeout: 10_000 }).toBeGreaterThanOrEqual(still + 3);
    const sekunden = (Date.now() - beginn) / 1000;
    expect(sekunden, 'drei Gloeckchen brauchen ihre Zeit - kein Dauerlaeuten').toBeGreaterThan(1.7);
    expect(await gezaehlt('bekehren')).toBe(gesangVorher);
    expect(await wert(kranker.i, 'h'), 'und der Dorfbewohner hat wieder mehr Leben').toBeGreaterThan(5);

    // Berts Dorfbewohner ein paar Felder daneben; der Moench bekommt ihn als Ziel.
    await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'dorfbewohner', x: wiese.x + 1, y: wiese.y + 3 });
    const bauer = await anna.waitForFunction((w) => {
      const a = window.ansicht;
      const e = [...a.nachher.values()].find((f) => f.k === 'd' && f.b !== a.ich && Math.hypot(f.x - w.x, f.y - w.y) < 4.5);
      return e && { i: e.i, x: e.x, y: e.y };
    }, wiese).then((h) => h.jsonValue());
    await anna.evaluate((id) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set([id]);
      a.beiAuswahl();
    }, moench.i);
    const schlagVorher = await gezaehlt('bekehrt');
    const aufBauer = await aufSeite(anna, bauer);
    await anna.mouse.click(aufBauer.x, aufBauer.y, { button: 'right' });
    await expect.poll(() => wert(moench.i, 'bk'), { timeout: 5_000 }).toBe(1);

    // Er singt, solange er bekehrt: mindestens zwei Toene in den vier
    // Sekunden, die es mindestens dauert - und das Gloeckchen schweigt.
    await expect.poll(() => gezaehlt('bekehren'), { timeout: 8_000 }).toBeGreaterThanOrEqual(gesangVorher + 2);
    const glockeBeimSingen = await gezaehlt('heilen');
    expect(await gezaehlt('bekehrt'), 'noch ist er nicht uebergetreten').toBe(schlagVorher);

    // Der Uebertritt: ein Schlag, genau einer.
    await anna.waitForFunction((id) => window.ansicht.nachher.get(id)?.b === window.ansicht.ich, bauer.i, { timeout: 20_000 });
    await expect.poll(() => gezaehlt('bekehrt')).toBe(schlagVorher + 1);
    expect(await wert(moench.i, 'bk'), 'er bekehrt nicht mehr').toBeUndefined();
    // Waehrend des Gesangs hat das Gloeckchen dieses Moenchs geschwiegen
    // (hoechstens eines faellt in das Bild, in dem er aufhoerte zu heilen).
    expect(glockeBeimSingen - (still + 3)).toBeLessThanOrEqual(Math.ceil(sekunden) + 3);
    // Und danach ist der Gesang zu Ende.
    const amEnde = await gezaehlt('bekehren');
    await anna.waitForTimeout(1600);
    expect(await gezaehlt('bekehren')).toBe(amEnde);
    expect(await gezaehlt('bekehrt')).toBe(schlagVorher + 1);
  });
});
