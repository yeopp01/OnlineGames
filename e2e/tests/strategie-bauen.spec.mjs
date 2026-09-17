// Bauen im Browser: Dorfbewohner waehlen, im Baumenue ein Gebaeude, den Platz
// mit gruener oder roter Vorschau, dann die Baustelle, wie sie waechst
// (→ specs/10-strategie/bauen.md, bedienung.md AC-15, AC-25,
// darstellung.md AC-4, AC-5, einheiten-und-befehle.md AC-16).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import {
  dorfbewohnerAnklicken, partieBeenden, partieZuZweit, platzImBild,
} from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';
const BEDIENUNG = '10-strategie/bedienung.md';
const DARSTELLUNG = '10-strategie/darstellung.md';
const EINHEITEN = '10-strategie/einheiten-und-befehle.md';

test.describe('Bauen', () => {
  test.describe.configure({ mode: 'serial' });

  let partie;
  let anna;
  let code;
  let basis;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
    ({ anna, code } = partie);
    basis = await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 1.4;
      a.blickAuf(b.x + 2, b.y + 2);
      return b;
    });
  });

  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-25: ein Dorfbewohner zeigt das Baumenue, was zu teuer ist, ist grau und sagt warum', async ({}, info) => {
    // 60 Holz: Haus (25) und Farm (60) gehen, Muehle, Lager (100) und Kaserne (175) nicht.
    await rohstoffe(anna, code, 'Anna', { holz: 60 });
    await expect(anna.locator('[data-rohstoff="holz"] b')).toHaveText('60');
    await dorfbewohnerAnklicken(anna);

    const menue = anna.locator('#baumenue');
    await expect(menue).toBeInViewport();
    // So viele Knoepfe, wie ein Dorfbewohner Gebaeude bauen kann.
    const baubar = await anna.evaluate(() => window.ansicht.werte.einheiten.dorfbewohner.baut.length);
    await expect(menue.locator('[data-bauen]')).toHaveCount(baubar);
    await expect(menue.locator('[data-bauen="haus"]')).toHaveAttribute('aria-disabled', 'false');
    await expect(menue.locator('[data-bauen="haus"]')).toContainText('25');
    await expect(menue.locator('[data-bauen="farm"]')).toHaveAttribute('aria-disabled', 'false');
    await expect(menue.locator('[data-bauen="farm"]')).toContainText('60');
    for (const art of ['muehle', 'holzfaellerlager', 'bergbaulager']) {
      const knopf = menue.locator(`[data-bauen="${art}"]`);
      await expect(knopf).toHaveAttribute('aria-disabled', 'true');
      await expect(knopf).toHaveAttribute('title', /zu wenig Holz$/);
      await expect(knopf).toContainText('100');
    }
    await expect(menue.locator('[data-bauen="kaserne"]')).toHaveAttribute('aria-disabled', 'true');
    await expect(menue.locator('[data-bauen="kaserne"]')).toContainText('175');
    // Ein Klick auf das Gesperrte beginnt nichts. `force`: Playwright klickt
    // aria-disabled sonst gar nicht - genau diesen Klick wollen wir aber pruefen.
    await menue.locator('[data-bauen="muehle"]').click({ force: true });
    expect(await anna.evaluate(() => window.ansicht.platzieren)).toBeNull();
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-25',
      titel: 'Dorfbewohner gewaehlt, 60 Holz: Haus und Farm bereit, Muehle, beide Lager und Kaserne ausgegraut',
      test: info,
    });
    await rohstoffe(anna, code, 'Anna', { holz: 200 });
    await expect(anna.locator('[data-rohstoff="holz"] b')).toHaveText('200');
  });

  test('bauen AC-4 / bedienung AC-15: die Grundflaeche folgt dem Zeiger, gruen oder rot, Esc bricht ab', async ({}, info) => {
    await expect(anna.locator('[data-bauen="haus"]')).toHaveAttribute('aria-disabled', 'false');
    await anna.locator('[data-bauen="haus"]').click();
    expect(await anna.evaluate(() => window.ansicht.platzieren)).toEqual({ art: 'haus' });

    // Gruen auf freiem Gras ...
    const frei = await platzImBild(anna, { n: 2, um: basis, abstand: 5 });
    expect(frei, 'ein freier Platz im Bild').not.toBeNull();
    await anna.mouse.move(frei.bild.x, frei.bild.y, { steps: 4 });
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzLage())).toMatchObject({ x: frei.x, y: frei.y, taugt: true });
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-4',
      titel: 'Ein Haus platzieren: auf freiem Gras liegt die Grundflaeche gruen unter dem Zeiger, das Haus blass darauf',
      test: info,
    });

    // ... rot auf dem Dorfzentrum.
    const zentrum = await anna.evaluate((b) => window.ansicht.zuBild(b.x - 0.5, b.y - 0.5), basis);
    await anna.mouse.move(zentrum.x, zentrum.y, { steps: 4 });
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzLage()?.taugt)).toBe(false);
    // Ein Klick auf Rot baut nichts und bleibt im Platzieren.
    await anna.mouse.click(zentrum.x, zentrum.y);
    expect(await anna.evaluate(() => window.ansicht.platzieren)).toEqual({ art: 'haus' });
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-4',
      titel: 'Dieselbe Vorschau ueber dem Dorfzentrum: die Grundflaeche ist rot, dort geht es nicht',
      test: info,
    });

    // Esc: erst die Platzierung weg, die Auswahl bleibt; noch einmal Esc, auch die Auswahl.
    await anna.keyboard.press('Escape');
    expect(await anna.evaluate(() => window.ansicht.platzieren)).toBeNull();
    expect(await anna.evaluate(() => window.ansicht.ausgewaehlt.size)).toBe(1);
    await anna.keyboard.press('Escape');
    expect(await anna.evaluate(() => window.ansicht.ausgewaehlt.size)).toBe(0);
    await expect(anna.locator('#auswahlleiste')).toBeHidden();
  });

  test('bauen AC-1 / darstellung AC-5: der Dorfbewohner geht hin und baut, die Baustelle waechst zum Haus', async ({}, info) => {
    const bauer = await dorfbewohnerAnklicken(anna);
    await anna.locator('[data-bauen="haus"]').click();
    const platz = await platzImBild(anna, { n: 2, um: basis, abstand: 5 });
    await anna.mouse.move(platz.bild.x, platz.bild.y, { steps: 4 });
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzLage()?.taugt)).toBe(true);
    const holz = await anna.evaluate(() => window.ansicht.vorraete.holz);
    await anna.mouse.click(platz.bild.x, platz.bild.y);

    // Die Baustelle steht sofort, bezahlt ist sie auch.
    await anna.waitForFunction(() => [...window.ansicht.gebaeude.values()].some((g) => g.art === 'haus' && g.u !== undefined));
    await anna.waitForFunction((h) => window.ansicht.vorraete.holz === h - 25, holz);
    expect(await anna.evaluate(() => window.ansicht.platzieren)).toBeNull();

    // Ein Stueck weit gebaut, der Bauer steht daneben.
    await zeitraffer(anna, code, 4);
    await anna.waitForFunction(() => [...window.ansicht.gebaeude.values()].some((g) => g.art === 'haus' && g.u >= 0.35), null, { timeout: 30_000 });
    await zeitraffer(anna, code, 1);
    const lage = await anna.evaluate((id) => {
      const a = window.ansicht;
      const haus = [...a.gebaeude.values()].find((g) => g.art === 'haus');
      const e = a.nachher.get(id);
      const x0 = haus.x - 1;
      const y0 = haus.y - 1;
      const dx = Math.max(x0 - e.x, 0, e.x - (x0 + 1));
      const dy = Math.max(y0 - e.y, 0, e.y - (y0 + 1));
      return { abstand: Math.max(dx, dy), u: haus.u };
    }, bauer);
    expect(lage.abstand, 'der Bauer steht am Haus').toBeLessThanOrEqual(1.3);
    await anna.keyboard.press('Escape');
    // Nah heran an die Baustelle.
    await anna.evaluate(() => {
      const a = window.ansicht;
      const haus = [...a.gebaeude.values()].find((g) => g.art === 'haus');
      a.kamera.zoom = 2.2;
      a.blickAuf(haus.x - 0.5, haus.y - 0.5);
    });
    await anna.waitForTimeout(150);
    await nachweis(anna, {
      spec: DARSTELLUNG,
      ac: 'AC-5',
      titel: 'Eine Baustelle: Fundament, Geruest und halbhohe Waende, der Dorfbewohner baut daneben',
      test: info,
    });

    // Fertig: ein Haus, und fuenf Plaetze mehr.
    await zeitraffer(anna, code, 10);
    await anna.waitForFunction(() => [...window.ansicht.gebaeude.values()].some((g) => g.art === 'haus' && g.u === undefined), null, { timeout: 30_000 });
    await zeitraffer(anna, code, 1);
    await expect(anna.locator('[data-rohstoff="bev"]')).toHaveText(/^\s*4\s*\/\s*10\s*$/);
    await anna.evaluate((b) => {
      const a = window.ansicht;
      a.kamera.zoom = 1.4;
      a.blickAuf(b.x + 2, b.y + 2);
    }, basis);
    await anna.waitForTimeout(150);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-1',
      titel: 'Das fertige Haus mit Strohdach und blauer Tuer neben dem Dorfzentrum, oben Bevoelkerung 4/10',
      test: info,
    });
  });

  test('einheiten AC-18: eine Farm bauen - der Bauer bestellt sie, die Leiste zeigt die Nahrung', async ({}, info) => {
    test.setTimeout(120_000);
    await anna.evaluate((b) => {
      const a = window.ansicht;
      a.kamera.zoom = 1.4;
      a.blickAuf(b.x + 2, b.y + 2);
    }, basis);
    const bauer = await dorfbewohnerAnklicken(anna);
    await anna.locator('[data-bauen="farm"]').click();
    const platz = await platzImBild(anna, { n: 3, um: basis, abstand: 6 });
    expect(platz).not.toBeNull();
    await anna.mouse.move(platz.bild.x, platz.bild.y, { steps: 4 });
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzLage()?.taugt)).toBe(true);
    await anna.mouse.click(platz.bild.x, platz.bild.y);
    await anna.waitForFunction(() => [...window.ansicht.gebaeude.values()].some((g) => g.art === 'farm'));

    // Bauen und ernten im Zeitraffer, bis der Bauer auf der Farm Nahrung traegt.
    await zeitraffer(anna, code, 10);
    await anna.waitForFunction((id) => {
      const a = window.ansicht;
      const farm = [...a.gebaeude.values()].find((g) => g.art === 'farm');
      const e = a.nachher.get(id);
      return farm && farm.u === undefined && farm.n < 175 && e && e.a === 'n' && e.l >= 3
        && Math.abs(e.x - farm.x) <= 1.5 && Math.abs(e.y - farm.y) <= 1.5;
    }, bauer, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);

    // Nah heran und die Farm anklicken - dort, wo der Bauer nicht steht.
    const klick = await anna.evaluate((id) => {
      const a = window.ansicht;
      const farm = [...a.gebaeude.values()].find((g) => g.art === 'farm');
      a.kamera.zoom = 2;
      a.blickAuf(farm.x, farm.y);
      const e = a.nachher.get(id);
      const kandidaten = [[farm.x - 1, farm.y + 1], [farm.x + 1, farm.y - 1], [farm.x + 1, farm.y + 1], [farm.x - 1, farm.y - 1]];
      kandidaten.sort((p, q) => Math.hypot(q[0] - e.x, q[1] - e.y) - Math.hypot(p[0] - e.x, p[1] - e.y));
      return a.zuBild(kandidaten[0][0], kandidaten[0][1]);
    }, bauer);
    await anna.waitForTimeout(150);
    await anna.mouse.click(klick.x, klick.y);
    await expect(anna.locator('#auswahlleiste')).toContainText('Farm');
    await expect(anna.locator('#farmvorrat')).toContainText(/noch \d+ Nahrung von 175/);
    await expect(anna.locator('#auswahlleiste')).toBeInViewport();
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-18',
      titel: 'Eine Farm: Acker mit Getreide, Zaun und Vogelscheuche, der Dorfbewohner erntet, unten wie viel Nahrung sie noch traegt',
      test: info,
    });
    await anna.keyboard.press('Escape');
  });

  test('bauen AC-9: eine Kaserne bauen und darin Miliz ausbilden', async ({}, info) => {
    test.setTimeout(150_000);
    await rohstoffe(anna, code, 'Anna', { holz: 500, nahrung: 500, gold: 200 });
    await anna.evaluate((b) => {
      const a = window.ansicht;
      a.kamera.zoom = 1.4;
      a.blickAuf(b.x + 2, b.y + 2);
    }, basis);
    await dorfbewohnerAnklicken(anna);
    await anna.locator('[data-bauen="kaserne"]').click();
    const platz = await platzImBild(anna, { n: 3, um: basis, abstand: 7 });
    expect(platz).not.toBeNull();
    await anna.mouse.move(platz.bild.x, platz.bild.y, { steps: 4 });
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzLage()?.taugt)).toBe(true);
    await anna.mouse.click(platz.bild.x, platz.bild.y);
    await anna.waitForFunction(() => [...window.ansicht.gebaeude.values()].some((g) => g.art === 'kaserne'));
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => [...window.ansicht.gebaeude.values()].some((g) => g.art === 'kaserne' && g.u === undefined), null, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);

    // Die fertige Kaserne anklicken: Dach, oberhalb der Figuren.
    const kaserne = await anna.evaluate(() => {
      const a = window.ansicht;
      const k = [...a.gebaeude.values()].find((g) => g.art === 'kaserne');
      a.kamera.zoom = 2;
      a.blickAuf(k.x + 1, k.y + 1);
      const p = a.zuBild(k.x, k.y);
      return { i: k.i, x: k.x, y: k.y, klick: { x: p.x, y: p.y - 70 } };
    });
    await anna.waitForTimeout(150);
    await anna.mouse.click(kaserne.klick.x, kaserne.klick.y);
    await expect(anna.locator('#auswahlleiste')).toContainText('Kaserne');
    const knopf = anna.locator('[data-ausbilden="miliz"]');
    await expect(knopf).toHaveAttribute('aria-disabled', 'false');
    await expect(knopf.locator('.ware-n + span')).toHaveText('60');
    await expect(knopf.locator('.ware-g + span')).toHaveText('20');
    await knopf.click();
    await expect(anna.locator('[data-abbrechen]')).toHaveCount(1);

    await zeitraffer(anna, code, 10);
    await anna.waitForFunction(() => [...window.ansicht.nachher.values()].some((e) => e.b === window.ansicht.ich && e.k === 'm'), null, { timeout: 30_000 });
    await zeitraffer(anna, code, 1);
    const miliz = await anna.evaluate((k) => {
      const e = [...window.ansicht.nachher.values()].find((f) => f.b === window.ansicht.ich && f.k === 'm');
      return { x: e.x, y: e.y, vorn: e.x + e.y > k.x + k.y, abstand: Math.max(Math.abs(e.x - k.x), Math.abs(e.y - k.y)) };
    }, kaserne);
    expect(miliz.vorn, 'vor der Kaserne, nicht dahinter').toBe(true);
    expect(miliz.abstand).toBeLessThanOrEqual(3);
    await expect(anna.locator('#auswahlleiste')).toBeInViewport();
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-9',
      titel: 'Die Kaserne mit Banner und Waffenstaender, davor die erste Miliz mit Schwert und Schild',
      test: info,
    });
    await anna.keyboard.press('Escape');
  });

  test('einheiten AC-16: ein Holzfaellerlager am Wald - dort wird das Holz abgegeben', async ({}, info) => {
    test.setTimeout(180_000);
    // Den naechsten Wald suchen und das Bild dorthin.
    const wald = await anna.evaluate((b) => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      let bestes = null;
      for (let i = 0; i < a.karte.felder.length; i++) {
        if (a.karte.felder[i] !== 1) continue;
        const x = i % g;
        const y = (i / g) | 0;
        const d = Math.hypot(x - b.x, y - b.y);
        if (!bestes || d < bestes.d) bestes = { x, y, d };
      }
      a.blickAuf(bestes.x, bestes.y);
      return bestes;
    }, basis);

    // Alle drei Dorfbewohner waehlen: Rahmen um alle eigenen.
    await anna.evaluate((b) => window.ansicht.blickAuf(b.x + 2, b.y + 2), basis);
    const ids = await anna.evaluate(() => [...window.ansicht.nachher.values()]
      .filter((e) => e.b === window.ansicht.ich && e.k === 'd').map((e) => e.i));
    const punkte = await anna.evaluate((liste) => liste.map((id) => {
      const e = window.ansicht.nachher.get(id);
      return window.ansicht.zuBild(e.x, e.y);
    }), ids);
    const xs = punkte.map((p) => p.x);
    const ys = punkte.map((p) => p.y);
    await anna.mouse.move(Math.min(...xs) - 30, Math.min(...ys) - 60);
    await anna.mouse.down();
    await anna.mouse.move(Math.max(...xs) + 30, Math.max(...ys) + 20, { steps: 6 });
    await anna.mouse.up();
    await expect.poll(() => anna.evaluate(() => [...window.ansicht.ausgewaehlt].length)).toBeGreaterThanOrEqual(ids.length);

    // Zum Wald und dort das Lager setzen.
    await anna.evaluate((w) => window.ansicht.blickAuf(w.x, w.y), wald);
    await anna.locator('[data-bauen="holzfaellerlager"]').click();
    const platz = await platzImBild(anna, { n: 2, um: wald, abstand: 3, seitlich: true });
    expect(platz).not.toBeNull();
    await anna.mouse.move(platz.bild.x, platz.bild.y, { steps: 4 });
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzLage()?.taugt)).toBe(true);
    await anna.mouse.click(platz.bild.x, platz.bild.y);
    await anna.waitForFunction(() => [...window.ansicht.gebaeude.values()].some((g) => g.art === 'holzfaellerlager'));

    // Bauen lassen, dann sammeln die Bauer von selbst (bauen AC-1) und geben am Lager ab.
    // Aufgezeichnet wird jede Lieferung: wo die Einheiten stehen, deren Ladung auf 0 fiel.
    await anna.evaluate(() => {
      const a = window.ansicht;
      window.lieferungen = [];
      const vorher = a.zustand.bind(a);
      a.zustand = (n) => {
        const alt = new Map([...a.nachher].map(([id, e]) => [id, e.l]));
        vorher(n);
        for (const e of a.nachher.values()) {
          if (e.b === a.ich && e.l === 0 && (alt.get(e.i) || 0) >= 10) window.lieferungen.push({ x: e.x, y: e.y });
        }
      };
    });
    // Rueckschau nach Runde 25: dieser Fall brauchte 58 s - Zeitraffer 20 statt 10.
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => window.lieferungen.length >= 2, null, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);

    const ergebnis = await anna.evaluate((b) => {
      const a = window.ansicht;
      const lager = [...a.gebaeude.values()].find((g) => g.art === 'holzfaellerlager');
      const rand = (e, x0, y0, n) => Math.max(Math.max(x0 - e.x, 0, e.x - (x0 + n - 1)), Math.max(y0 - e.y, 0, e.y - (y0 + n - 1)));
      return {
        fertig: lager.u === undefined,
        // Abgegeben wird bis 1,2 Felder vom Rand; im Zeitraffer 20 liegen zwanzig
        // Takte in einem Zustand, bis dahin ist er bis 1,6 Felder weitergegangen.
        amLager: window.lieferungen.filter((l) => rand(l, lager.x - 1, lager.y - 1, 2) <= 2.85).length,
        amZentrum: window.lieferungen.filter((l) => rand(l, b.x - 2, b.y - 2, 4) <= 2.85).length,
        alle: window.lieferungen.length,
      };
    }, basis);
    expect(ergebnis.fertig).toBe(true);
    expect(ergebnis.amLager, JSON.stringify(ergebnis)).toBe(ergebnis.alle);
    expect(ergebnis.amZentrum).toBe(0);

    // Das Bild: nah am Lager, wo gerade gearbeitet wird.
    await anna.evaluate(() => {
      const a = window.ansicht;
      const lager = [...a.gebaeude.values()].find((g) => g.art === 'holzfaellerlager');
      a.kamera.zoom = 2;
      a.blickAuf(lager.x, lager.y);
    });
    await zeitraffer(anna, code, 5);
    // Gewartet wird auf einen Traeger am Lager, der im Bild auch zu sehen ist:
    // vor dem Lager oder seitlich daneben, nicht hinter dem Dach.
    await anna.waitForFunction(() => {
      const a = window.ansicht;
      const lager = [...a.gebaeude.values()].find((g) => g.art === 'holzfaellerlager');
      const mitte = { x: lager.x - 0.5, y: lager.y - 0.5 };
      const q = a.zuBild(mitte.x, mitte.y);
      return [...a.nachher.values()].some((e) => {
        if (e.b !== a.ich || e.l <= 0 || Math.hypot(e.x - mitte.x, e.y - mitte.y) > 3.5) return false;
        const p = a.zuBild(e.x, e.y);
        return e.x + e.y > mitte.x + mitte.y + 0.8 || Math.abs(p.x - q.x) > 2.2 * 22 * a.kamera.zoom;
      });
    }, null, { timeout: 90_000, polling: 50 });
    await zeitraffer(anna, code, 1);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-16',
      titel: 'Das Holzfaellerlager am Waldrand: ein Dorfbewohner bringt sein Holz hierher, nicht zum Dorfzentrum',
      test: info,
    });
  });
});

test('darstellung AC-4 / bauen AC-20: jedes Gebaeude hat Koerper, die Spielerfarbe steht nur an einer Stelle', async ({ page }, info) => {
  await page.goto('/schautafel.html');
  await page.waitForFunction(() => window.schautafel?.gebaeudeMaske);
  const messung = await page.evaluate(() => {
    const t = window.schautafel;
    return t.gebaeudeArten.map((art) => {
      const blau = t.gebaeudeMaske(art, '#4a90d9');
      const rot = t.gebaeudeMaske(art, '#d94a4a');
      // Was sich unterscheidet, zaehlt die Maske selbst - ueber die Leitung waeren
      // die Farblisten zu gross.
      return { art, pixel: blau.pixel, farbeBlau: blau.farbpixel, farbeRot: rot.farbpixel, oben: blau.oben };
    });
  });
  // Unterscheidbar heisst: Umriss oder Farbe weichen auf einem spuerbaren Teil
  // der Flaeche ab. Gemessen in Spielfarbe Blau, alle gleich gross gezeichnet -
  // im Spiel hilft zusaetzlich die Groesse (Dorfzentrum 4 x 4, die anderen 2 x 2).
  const unterschiede = await page.evaluate(() => {
    const t = window.schautafel;
    const masken = t.gebaeudeArten.map((art) => ({ art, m: t.gebaeudeMaske(art, '#4a90d9') }));
    const paare = [];
    for (let i = 0; i < masken.length; i++) {
      for (let j = i + 1; j < masken.length; j++) {
        const a = masken[i].m;
        const b = masken[j].m;
        let anders = 0;
        let flaeche = 0;
        for (let k = 0; k < a.belegt.length; k++) {
          if (!a.belegt[k] && !b.belegt[k]) continue;
          flaeche += 1;
          if (a.belegt[k] !== b.belegt[k]) { anders += 1; continue; }
          const [r1, g1, b1] = a.farben[k];
          const [r2, g2, b2] = b.farben[k];
          if (Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2) > 90) anders += 1;
        }
        paare.push({ paar: `${masken[i].art} gegen ${masken[j].art}`, anteil: anders / flaeche });
      }
    }
    return paare;
  });
  for (const m of messung) {
    expect(m.pixel, `${m.art} ist gezeichnet`).toBeGreaterThan(800);
    // Farbe da, in beiden Farben, aber als Fahne, Tuer oder Wimpel - unter einem Zehntel.
    expect(m.farbeBlau, `${m.art} traegt Blau`).toBeGreaterThan(8);
    expect(m.farbeRot, `${m.art} traegt Rot`).toBeGreaterThan(8);
    expect(m.farbeBlau / m.pixel, `${m.art}: Farbe nur an einer Stelle`).toBeLessThan(0.1);
    // Koerper: das Gebaeude ragt ueber seine Grundflaeche hinaus nach oben -
    // ausser der Farm, die ist ein Acker und begehbar, wie in der Vorlage.
    if (m.art !== 'farm') expect(m.oben, `${m.art} hat Hoehe`).toBeLessThan(60);
  }
  // Mindestens ein Viertel der Flaeche anders: das sieht man ohne Hinschauen.
  for (const { paar, anteil } of unterschiede) expect(anteil, paar).toBeGreaterThan(0.25);
  await page.setViewportSize({ width: 1200, height: 1400 });
  const tafel = page.locator('#tafel');
  await tafel.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await nachweis(page, {
    spec: DARSTELLUNG,
    ac: 'AC-4',
    titel: 'Schautafel unten: Dorfzentrum, Haus, Muehle, Holzfaeller- und Bergbaulager in Blau und Rot, dazu zwei Baustellen',
    test: info,
  });
  await nachweis(page, {
    spec: BAUEN,
    ac: 'AC-20',
    titel: 'Alle sieben Gebaeude der Dunklen Zeit auf der Schautafel: Dorfzentrum, Haus, Muehle, zwei Lager, Kaserne, Farm',
    test: info,
  });
});
