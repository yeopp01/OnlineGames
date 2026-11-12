// Zerstoerung im Bild (→ specs/10-strategie/bauen.md AC-7, AC-17, AC-18): ein
// Gebaeude hat Leben, die Leiste zeigt es; faellt ein Haus, sinkt die Grenze
// oben, und niemand stirbt dafuer; eine Baustelle hat nur so viel Leben, wie
// gebaut ist. Die Regeln im Einzelnen (Werte aus der Tabelle, niemand kommt
// dazu, die Farm haelt keinen im Spiel, das Leben waechst mit dem Bau) pruefen
// tests/strategie-zerstoerung.test.mjs und tests/strategie-bauleben.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, gebaeudeAufstellen, lebenSetzen, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { aufSeite, freieWiesen, partieBeenden, partieZuZweit, platzImBild, waehlen } from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';

test('bauen AC-17 / bauen AC-18: das Haus traegt sein Leben in der Leiste - faellt es, steht die Bevoelkerung oben ueber der Grenze, und keiner ist gestorben', async ({ browser }, info) => {
  // Handelt nicht vom Nebel.
  const partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  try {
    const { anna, bert, code } = partie;
    const [wiese] = await freieWiesen(anna, 1);
    const werte = await anna.evaluate(() => {
      const a = window.ansicht;
      return { raum: a.vorraete.raum, haus: a.werte.gebaeude.haus, basis: a.spieler.get(a.ich).basis };
    });
    const haus = await gebaeudeAufstellen(anna, code, 'Anna', 'haus', wiese.x, wiese.y);
    const raum = werte.raum + werte.haus.wohnraum;
    await anna.waitForFunction((r) => window.ansicht.vorraete.raum === r, raum);
    // Bis an die Grenze auffuellen - daheim, weit weg vom Haus.
    const bev = await anna.evaluate(() => window.ansicht.vorraete.bev);
    await einheitenAufstellen(anna, code, 'Anna', raum - bev, { art: 'dorfbewohner', x: werte.basis.x, y: werte.basis.y + 4 });
    await anna.waitForFunction((r) => window.ansicht.vorraete.bev === r, raum);

    // AC-17: das Haus, angeschlagen, angeklickt.
    await lebenSetzen(anna, code, haus, 220);
    await anna.waitForFunction((h) => window.ansicht.gebaeude.get(h)?.h === 220, haus);
    await waehlen(anna, [], { zoom: 1.8, blick: { x: wiese.x + 1, y: wiese.y + 1 } });
    const mitte = await aufSeite(anna, { gebaeude: haus });
    await anna.mouse.click(mitte.x, mitte.y);
    await anna.waitForFunction((h) => window.ansicht.gewaehltesGebaeude === h, haus);
    const leben = anna.locator('#auswahlleiste .leben');
    await expect(leben).toHaveAttribute('data-leben', `220/${werte.haus.leben}`);
    await expect(leben).toBeInViewport();
    await anna.waitForTimeout(100);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-17',
      titel: 'Ein angeschlagenes Haus gewaehlt - die Leiste zeigt sein Leben als Balken und Zahl, 220 von 550',
      test: info,
    });

    // AC-18: Berts Miliz reisst es ein.
    await lebenSetzen(anna, code, haus, 1);
    await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'miliz', x: wiese.x - 3, y: wiese.y + 1 });
    const kuerzel = await bert.evaluate(() => window.ansicht.werte.einheiten.miliz.kuerzel);
    const miliz = await bert.waitForFunction(([k, w]) => {
      const a = window.ansicht;
      const e = [...a.nachher.values()].find((x) => x.k === k && x.b === a.ich && Math.hypot(x.x - w.x, x.y - w.y) < 6);
      return e?.i;
    }, [kuerzel, wiese]).then((h) => h.jsonValue());
    await waehlen(bert, [miliz], { zoom: 1.8, blick: wiese });
    const ziel = await aufSeite(bert, { gebaeude: haus });
    if (ziel) await bert.mouse.click(ziel.x, ziel.y, { button: 'right' });
    await anna.waitForFunction((h) => !window.ansicht.gebaeude.has(h), haus, { timeout: 30_000 });
    await anna.waitForFunction((r) => window.ansicht.vorraete.raum === r, werte.raum);
    expect(await anna.evaluate(() => window.ansicht.vorraete.bev), 'keiner ist gestorben').toBe(raum);

    // Ein Dorfbewohner wartet im Dorfzentrum: die Anzeige wird rot (bedienung AC-43).
    await rohstoffe(anna, code, 'Anna', { nahrung: 300 });
    await anna.evaluate(() => {
      const a = window.ansicht;
      const z = [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'dorfzentrum');
      a.ausgewaehlt = new Set();
      a.gewaehltesGebaeude = z.i;
      a.beiAuswahl();
    });
    await anna.locator('[data-ausbilden="dorfbewohner"]').click();
    await expect(anna.locator('[data-abbrechen]')).toHaveCount(1);
    await anna.keyboard.press('Escape');
    const anzeige = anna.locator('[data-rohstoff="bev"]');
    await expect(anzeige).toHaveText(new RegExp(`^\\s*${raum}\\s*/\\s*${werte.raum}\\s*$`));
    await expect(anzeige).toHaveClass(/\bwartet\b/);
    await expect(anzeige).toBeInViewport();
    await anna.evaluate((w) => window.ansicht.blickAuf(w.x + 1, w.y + 1), wiese);
    await anna.waitForTimeout(200);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-18',
      titel: 'Berts Miliz hat das Haus eingerissen - oben steht die Bevoelkerung ueber der gesunkenen Grenze, rot, weil ein Dorfbewohner wartet',
      test: info,
    });
    // Und es kommt keiner dazu.
    await anna.waitForTimeout(3000);
    expect(await anna.evaluate(() => window.ansicht.vorraete.bev), 'niemand kommt dazu').toBe(raum);
  } finally {
    await partieBeenden(partie);
  }
});

test('bauen AC-7: eine Kaserne im Bau, von Berts Miliz angegriffen - die Leiste zeigt den Fortschritt und darunter das Leben, das erst so weit ist wie der Bau', async ({ browser }, info) => {
  test.setTimeout(120_000);
  const partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  try {
    const { anna, bert, code } = partie;
    const [wiese] = await freieWiesen(anna, 1);
    await rohstoffe(anna, code, 'Anna', { holz: 500 });
    // Ein Dorfbewohner auf der Wiese beginnt die Kaserne - mit Taste und Klick.
    const kuerzel = await anna.evaluate(() => window.ansicht.werte.einheiten.dorfbewohner.kuerzel);
    await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'dorfbewohner', x: wiese.x - 3, y: wiese.y });
    const bauer = await anna.waitForFunction(([k, w]) => {
      const a = window.ansicht;
      const e = [...a.nachher.values()].find((x) => x.k === k && x.b === a.ich && Math.hypot(x.x - w.x, x.y - w.y) < 5);
      return e?.i;
    }, [kuerzel, wiese]).then((h) => h.jsonValue());
    await waehlen(anna, [bauer], { zoom: 1.6, blick: wiese });
    await anna.locator('[data-bauen="kaserne"]').click();
    const platz = await platzImBild(anna, { n: 3, um: wiese, abstand: 0 });
    expect(platz).not.toBeNull();
    await anna.mouse.move(platz.bild.x, platz.bild.y, { steps: 4 });
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzLage()?.taugt)).toBe(true);
    await anna.mouse.click(platz.bild.x, platz.bild.y);
    const kaserne = await anna.waitForFunction(() => [...window.ansicht.gebaeude.values()].find((g) => g.art === 'kaserne' && g.b === window.ansicht.ich)?.i)
      .then((h) => h.jsonValue());
    // Eine frische Baustelle traegt ein Leben (bauen AC-7).
    expect(await anna.evaluate((k) => window.ansicht.gebaeude.get(k).h, kaserne), 'frisch begonnen').toBeLessThanOrEqual(5);

    await zeitraffer(anna, code, 4);
    await anna.waitForFunction((k) => window.ansicht.gebaeude.get(k)?.u >= 0.4, kaserne, { timeout: 30_000 });
    await zeitraffer(anna, code, 1);

    // Berts Miliz greift die Baustelle an.
    await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'miliz', x: wiese.x + 3, y: wiese.y + 3 });
    const milizKuerzel = await bert.evaluate(() => window.ansicht.werte.einheiten.miliz.kuerzel);
    const miliz = await bert.waitForFunction(([k, w]) => {
      const a = window.ansicht;
      const e = [...a.nachher.values()].find((x) => x.k === k && x.b === a.ich && Math.hypot(x.x - w.x, x.y - w.y) < 7);
      return e?.i;
    }, [milizKuerzel, wiese]).then((h) => h.jsonValue());
    await waehlen(bert, [miliz], { zoom: 1.6, blick: wiese });
    const ziel = await aufSeite(bert, { gebaeude: kaserne });
    await bert.mouse.click(ziel.x, ziel.y, { button: 'right' });
    // Getroffen: das Leben liegt unter dem Anteil des Baus. `u` kommt auf
    // zwei Stellen gerundet - bei 1200 Leben sind das bis zu 6 Punkte, mehr
    // als ein Schlag der Miliz (beim ersten Lauf gefunden). Gewartet wird,
    // bis selbst gegen das abgerundete `u` 25 Punkte fehlen; geprueft wird
    // danach gegen das aufgerundete mit 10 - der Schaden bleibt, also haelt
    // das, wie weit der Bau inzwischen auch ist.
    const voll = await anna.evaluate((k) => window.ansicht.gebaeudeLebenVoll(window.ansicht.gebaeude.get(k)), kaserne);
    const getroffen = (h, v, u) => h < v * (u + 0.005) - 10;
    await anna.waitForFunction(([k, v]) => {
      const g = window.ansicht.gebaeude.get(k);
      return g && g.u !== undefined && g.h < v * (g.u - 0.005) - 25;
    }, [kaserne, voll], { timeout: 40_000 });

    // Anna waehlt die Baustelle.
    await anna.keyboard.press('Escape');
    await waehlen(anna, [], { zoom: 1.6, blick: { x: wiese.x + 1, y: wiese.y + 1 } });
    const mitte = await aufSeite(anna, { gebaeude: kaserne });
    await anna.mouse.click(mitte.x, mitte.y);
    await anna.waitForFunction((k) => window.ansicht.gewaehltesGebaeude === k, kaserne);
    await expect(anna.locator('#baufortschritt')).toBeInViewport();
    const leben = anna.locator('#baustellenleben');
    await expect(leben).toBeInViewport();
    // Beides aus derselben Leiste gelesen, in einem Zug.
    const { h, v, bau } = await anna.evaluate(() => {
      const [h, v] = document.querySelector('#baustellenleben').dataset.leben.split('/').map(Number);
      return { h, v, bau: Number(document.querySelector('#baufortschritt').dataset.bau) };
    });
    expect(v, 'gegen das volle Leben der Kaserne').toBe(voll);
    expect(getroffen(h, v, bau), `Leben ${h} von ${v} bei ${Math.round(bau * 100)} % gebaut`).toBe(true);
    expect(h).toBeGreaterThan(0);
    await anna.waitForTimeout(100);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-7',
      titel: 'Eine Kaserne im Bau, Berts Miliz schlaegt darauf ein - die Leiste zeigt den Baufortschritt und darunter das Leben, das mit dem Bau waechst',
      test: info,
    });
  } finally {
    await partieBeenden(partie);
  }
});
