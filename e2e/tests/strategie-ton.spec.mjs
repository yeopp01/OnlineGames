// Ton (→ specs/10-strategie/bedienung.md AC-59 bis AC-61): Geraeusche zu
// Ereignissen, leise Musik, zwei Schalter in der Tastenuebersicht.
//
// Ein Test kann nicht hoeren. Er kann messen: `window.ton.pegel()` ist der
// Effektivwert am Ausgang, 0 bei Stille. Damit steht hier, DASS etwas
// klingt und wann - nicht, WIE es klingt. Welches Ereignis welchen Klang hat
// und auf welchen Toenen die Musik spielt, prueft tests/strategie-ton.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { gebaeudeInDerNaehe, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';
const STILL = 0.00002;

test.describe('Ton', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let anna;
  let code;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
    ({ anna, code } = partie);
    await zeitraffer(anna, code, 10);
  });
  test.afterAll(() => partieBeenden(partie));

  const laut = () => anna.evaluate(() => window.ton.pegel());
  const zentrumWaehlen = () => anna.evaluate(() => {
    const a = window.ansicht;
    const dz = [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'dorfzentrum');
    a.ausgewaehlt = new Set();
    a.gewaehltesGebaeude = dz.i;
    a.beiAuswahl();
  });
  // Wartet im Fenster auf den naechsten Klang dieses Namens und misst von da
  // an 0,7 Sekunden lang Bild fuer Bild den Pegel: die Spitze kommt zurueck,
  // -1, wenn in dreissig Sekunden nichts klang. Vor dem Ausloesen starten.
  const spitzeBei = (name) => anna.evaluate((gesucht) => new Promise((fertig) => {
    const t = window.ton;
    const ab = t.protokoll.length;
    const beginn = performance.now();
    let gehoert = null;
    let hoch = 0;
    const schritt = () => {
      const jetzt = performance.now();
      if (gehoert === null && t.protokoll.slice(ab).some((p) => p.name === gesucht)) gehoert = jetzt;
      if (gehoert !== null) hoch = Math.max(hoch, t.pegel());
      if (gehoert !== null && jetzt - gehoert > 700) fertig(hoch);
      else if (gehoert === null && jetzt - beginn > 30_000) fertig(-1);
      else requestAnimationFrame(schritt);
    };
    schritt();
  }), name);

  test('bedienung AC-60: im Spiel spielt leise Musik - gemessen am Ausgang', async () => {
    // Ohne eine Handlung laesst der Browser keinen Ton zu. Die Klicks im
    // Vorraum - Eroeffnen, Starten - zaehlen schon: steht das Spiel, spielt
    // die Musik, ohne dass jemand eigens dafuer klickt. Der Klick hier ist
    // fuer den Fall, dass eine Partie einmal ohne einen beginnt.
    await anna.locator('#brett').click({ position: { x: 700, y: 420 } });
    await expect.poll(() => anna.evaluate(() => window.ton.ctx?.state), { message: 'der Klangausgang laeuft' }).toBe('running');
    expect(await anna.evaluate(() => window.ton.musikLaeuft)).toBe(true);
    await expect.poll(laut, { timeout: 15_000, message: 'am Ausgang kommt etwas an' }).toBeGreaterThan(0.002);
    // Leise: auch in der Spitze weit unter einem Geraeusch (dort ueber 0,02).
    const spitze = await anna.evaluate(() => new Promise((fertig) => {
      let hoch = 0;
      const beginn = performance.now();
      const schritt = () => {
        hoch = Math.max(hoch, window.ton.pegel());
        if (performance.now() - beginn > 3000) fertig(hoch);
        else requestAnimationFrame(schritt);
      };
      schritt();
    }));
    expect(spitze, 'die Musik bleibt leise').toBeLessThan(0.12);
  });

  test('bedienung AC-61: in der Tastenuebersicht stehen Geraeusche und Musik - Musik aus, und es wird still', async ({}, info) => {
    await anna.locator('#brett').hover();
    await anna.keyboard.press('F1');
    const uebersicht = anna.locator('#tastenuebersicht');
    await expect(uebersicht).toBeVisible();
    await expect(uebersicht.locator('label', { hasText: 'Geräusche' })).toBeVisible();
    await expect(uebersicht.locator('label', { hasText: 'Musik' })).toBeVisible();
    await expect(anna.locator('#ton-geraeusche')).toBeChecked();
    await expect(anna.locator('#ton-musik')).toBeChecked();
    await expect(uebersicht).toBeInViewport({ ratio: 1 });
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-61',
      titel: 'Die Tastenuebersicht: unter der Liste drei Schalter - Karte am Bildschirmrand schieben, Geraeusche, Musik - alle angehakt',
      test: info,
    });

    await anna.locator('#ton-musik').uncheck();
    // Der Klick auf den Schalter schliesst die Uebersicht nicht.
    await expect(uebersicht).toBeVisible();
    expect(await anna.evaluate(() => window.ton.musikLaeuft)).toBe(false);
    await expect.poll(laut, { timeout: 15_000, message: 'die Musik ist verklungen' }).toBeLessThan(STILL);
    expect(await anna.evaluate(() => localStorage.getItem('tonMusik')), 'der Browser merkt es sich').toBe('aus');
    await anna.keyboard.press('Escape');
    await expect(uebersicht).toBeHidden();
  });

  test('bedienung AC-59: ein Dorfbewohner wird fertig, der Webstuhl ist erforscht - beides ist am Ausgang zu messen', async () => {
    // Die Musik ist aus: was jetzt am Ausgang ankommt, ist das Geraeusch.
    expect(await laut()).toBeLessThan(STILL);
    await rohstoffe(anna, code, 'Anna', { nahrung: 2000, gold: 2000 });
    await zentrumWaehlen();

    let gemessen = spitzeBei('einheit');
    await anna.locator('[data-ausbilden="dorfbewohner"]').click();
    expect(await gemessen, 'der fertige Dorfbewohner klingt').toBeGreaterThan(0.02);
    await expect.poll(laut, { message: 'und verklingt' }).toBeLessThan(STILL);

    gemessen = spitzeBei('forschung');
    await anna.locator('[data-ausbilden="webstuhl"]').click();
    expect(await gemessen, 'der erforschte Webstuhl klingt').toBeGreaterThan(0.02);
    const namen = await anna.evaluate(() => window.ton.protokoll.map((p) => p.name));
    expect(namen.filter((n) => n === 'einheit'), 'ein Dorfbewohner, ein Klang').toHaveLength(1);
    expect(namen.filter((n) => n === 'forschung')).toHaveLength(1);
    // Bei Bert, der nichts bestellt hat, klang nichts davon.
    expect(await partie.bert.evaluate(() => window.ton.protokoll.map((p) => p.name))).toEqual([]);
  });

  test('bedienung AC-59 / bedienung AC-61: Geraeusche aus - der naechste Dorfbewohner kommt still', async () => {
    await anna.locator('#brett').hover();
    await anna.keyboard.press('F1');
    await anna.locator('#ton-geraeusche').uncheck();
    await anna.keyboard.press('Escape');

    const vorher = await anna.evaluate(() => window.ton.protokoll.length);
    const dorf = () => anna.evaluate(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].filter((e) => e.b === a.ich && a.arten[e.k] === 'dorfbewohner').length;
    });
    const zahl = await dorf();
    // Der Wohnraum ist voll (fuenf von fuenf): ein Haus dazu, sonst wartet
    // der Auftrag. Auch das Haus kommt still.
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'haus', basis, { von: 6, bis: 14 });
    await zentrumWaehlen();
    await anna.locator('[data-ausbilden="dorfbewohner"]').click();
    await expect.poll(dorf, { timeout: 20_000, message: 'der Dorfbewohner ist da' }).toBe(zahl + 1);
    expect(await anna.evaluate(() => window.ton.protokoll.length), 'es klang nichts').toBe(vorher);
    expect(await laut()).toBeLessThan(STILL);
  });

  test('bedienung AC-61: nach dem Neuladen stehen beide Schalter, wie sie gelassen wurden', async () => {
    await anna.reload();
    await anna.waitForFunction(() => window.ansicht?.laeuft && window.ansicht.nachher.size > 0);
    await anna.locator('#brett').hover();
    await anna.keyboard.press('F1');
    await expect(anna.locator('#tastenuebersicht')).toBeVisible();
    await expect(anna.locator('#ton-geraeusche')).not.toBeChecked();
    await expect(anna.locator('#ton-musik')).not.toBeChecked();
    await expect(anna.locator('#rand-schieben')).toBeChecked();
    // Und abgeschaltet bleibt es: auch nach einem Klick spielt keine Musik.
    await anna.keyboard.press('Escape');
    await anna.locator('#brett').click({ position: { x: 700, y: 420 } });
    expect(await anna.evaluate(() => window.ton.musikLaeuft)).toBe(false);
  });
});
