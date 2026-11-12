// Leertaste (→ specs/10-strategie/bedienung.md AC-10): springt zum eigenen
// Dorfzentrum, ein zweites Mal zurueck dorthin, wo die Kamera vorher stand.
// Wer dazwischen schiebt, springt wieder zur Basis; gehalten springt sie
// nicht hin und her. Die Kamera rechnet nur der Browser.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Leertaste', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  const kamera = (page) => page.evaluate(() => ({ x: window.ansicht.kamera.x, y: window.ansicht.kamera.y }));
  // Wo das eigene Dorfzentrum im Bild steht, gemessen von der Bildmitte.
  const zentrumVonMitte = (page) => page.evaluate(() => {
    const a = window.ansicht;
    const z = [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'dorfzentrum');
    const m = a.gebaeudeMitte(z);
    const p = a.zuBild(m.x, m.y);
    return Math.hypot(p.x - a.leinwand.clientWidth / 2, p.y - a.leinwand.clientHeight / 2);
  });
  const nachKartenmitte = (page) => page.evaluate(() => {
    const a = window.ansicht;
    a.blickAuf(a.karte.groesse / 2, a.karte.groesse / 2);
  });

  test('bedienung AC-10: die Leertaste springt zum Dorfzentrum, ein zweites Mal zurueck', async ({}, info) => {
    const { anna } = partie;
    // Die Maus aus dem Rand, damit nichts schiebt (bedienung AC-9).
    await anna.mouse.move(400, 400);
    await nachKartenmitte(anna);
    await anna.waitForTimeout(100);
    const fern = await kamera(anna);
    expect(await zentrumVonMitte(anna), 'vorher ist das Dorf nicht in der Mitte').toBeGreaterThan(200);

    await anna.keyboard.press('Space');
    expect(await zentrumVonMitte(anna), 'das Dorfzentrum in der Bildmitte').toBeLessThan(2);
    await anna.waitForTimeout(200);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-10',
      titel: 'Nach der Leertaste steht das eigene Dorfzentrum mitten im Bild',
      test: info,
    });

    await anna.keyboard.press('Space');
    expect(await kamera(anna), 'zurueck, wo sie stand').toEqual(fern);
    // Und wieder hin: der Sprung ist kein Einmalereignis.
    await anna.keyboard.press('Space');
    expect(await zentrumVonMitte(anna)).toBeLessThan(2);
    await anna.keyboard.press('Space');
    expect(await kamera(anna)).toEqual(fern);
  });

  test('bedienung AC-10: wer nach dem Sprung schiebt, springt wieder zur Basis; gehalten springt sie nicht hin und her', async () => {
    const { anna } = partie;
    await anna.mouse.move(400, 400);
    await nachKartenmitte(anna);
    await anna.keyboard.press('Space');
    // Ein Stueck nach rechts geschoben (bedienung AC-7).
    await anna.keyboard.down('d');
    await anna.waitForTimeout(250);
    await anna.keyboard.up('d');
    const geschoben = await kamera(anna);
    expect(await zentrumVonMitte(anna), 'weggeschoben').toBeGreaterThan(50);
    // Jetzt nicht zurueck zur Kartenmitte, sondern wieder zur Basis ...
    await anna.keyboard.press('Space');
    expect(await zentrumVonMitte(anna)).toBeLessThan(2);
    // ... und von dort zurueck an die geschobene Stelle.
    await anna.keyboard.press('Space');
    expect(await kamera(anna)).toEqual(geschoben);

    // Gehalten: die Wiederholung der Taste aendert nichts. Eine einzige,
    // denn bei zweien landete auch das Hin und Her wieder an der Basis.
    await anna.keyboard.down('Space');
    await anna.keyboard.down('Space');
    await anna.keyboard.up('Space');
    expect(await zentrumVonMitte(anna), 'nach dem Halten an der Basis').toBeLessThan(2);
    await anna.keyboard.press('Space');
  });
});
