// Die Pferdezucht (→ specs/10-strategie/bauen.md AC-46).
//
// Rueckmeldung des Benutzers: "und vll sollte es beim angriff nochmal
// schnellere pferde geben z.B." Der Stall erforscht ab dem Fuerstentum die
// Pferdezucht - jeder Reiter ist danach ein Zehntel schneller. Hier steht,
// was davon am Bildschirm ankommt: der Knopf mit dem Hufeisen, die Tafel
// darueber, und das Tempo an der Tafel des Ritters danach.
//
// Was sie rechnet und wie lang ein Ritt danach dauert, prueft
// tests/strategie-pferdezucht.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, gebaeudeAufstellen, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, freieWiesen, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';

test.describe('Pferdezucht', () => {
  let partie;
  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
    await partie.anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
  });
  test.afterAll(() => partieBeenden(partie));

  test('bauen AC-46: der Stall erforscht im Fuerstentum die Pferdezucht - die Tafel nennt 10 % Tempo für die Kavallerie, und der Ritter ist danach schneller', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, code } = partie;
    const knopf = (art) => anna.locator(`[data-ausbilden="${art}"]`);
    const tafel = anna.locator('#knopftafel');
    const tempo = (wer, art) => anna.evaluate(([wer, art]) => {
      const a = window.ansicht;
      const id = wer === 'ich' ? a.ich : [...a.spieler.keys()].find((s) => s !== a.ich);
      return a.einheitenwerte.get(id)?.[art]?.tempo;
    }, [wer, art]);
    const stallWaehlen = (id) => anna.evaluate((g) => {
      const a = window.ansicht;
      a.kamera.zoom = 1.8;
      a.gewaehltesGebaeude = g;
      a.ausgewaehlt.clear();
      const m = a.gebaeudeMitte(a.gebaeude.get(g));
      a.blickAuf(m.x, m.y);
      a.beiAuswahl();
    }, id);

    // Im Lehen: der Stall steht, die Pferdezucht steht noch nicht zur Wahl.
    await rohstoffe(anna, code, 'Anna', { holz: 2000, nahrung: 2000, gold: 2000, zeitalter: 1 });
    await anna.waitForFunction(() => window.ansicht.zeitalter === 1);
    await expect(anna.locator('#zeitalterwechsel')).toBeHidden({ timeout: 15_000 });
    const [ort] = await freieWiesen(anna, 1);
    const stall = await gebaeudeAufstellen(anna, code, 'Anna', 'stall', ort.x, ort.y);
    await anna.waitForFunction((id) => window.ansicht.gebaeude.has(id), stall);
    await stallWaehlen(stall);
    await expect(anna.locator('.auswahl-kopf strong')).toHaveText('Stall');
    await expect(knopf('spaeherreiter')).toHaveCount(1);
    await expect(knopf('pferdezucht'), 'erst ab dem Fuerstentum').toHaveCount(0);

    // Im Fuerstentum: der Knopf, und darueber die Tafel mit dem Satz des Servers.
    await rohstoffe(anna, code, 'Anna', { zeitalter: 2 });
    await anna.waitForFunction(() => window.ansicht.zeitalter === 2);
    await expect(anna.locator('#zeitalterwechsel')).toBeHidden({ timeout: 15_000 });
    await stallWaehlen(stall);
    await expect(knopf('pferdezucht')).toHaveAttribute('aria-label', 'Pferdezucht erforschen (150 Nahrung)');
    await expect(knopf('pferdezucht')).toBeInViewport();
    expect(await anna.evaluate(() => {
      const bild = document.querySelector('[data-ausbilden="pferdezucht"] canvas');
      const punkte = bild.getContext('2d').getImageData(0, 0, bild.width, bild.height).data;
      let farbig = 0;
      for (let i = 3; i < punkte.length; i += 4) if (punkte[i] > 0) farbig += 1;
      return farbig / (bild.width * bild.height);
    }), 'das Hufeisen ist gezeichnet').toBeGreaterThan(0.1);
    expect(await tempo('ich', 'ritter')).toBe(1.35);
    await knopf('ritter').hover();
    await expect(tafel).toContainText('Tempo 1,35');
    await knopf('pferdezucht').hover();
    await expect(tafel.locator('.kt-kopf')).toContainText('Pferdezucht');
    await expect(tafel.locator('.kt-zeile')).toHaveText(['Kavallerie: +10 % Tempo']);
    await expect(tafel).toContainText('Forschung 40 s');
    await expect(tafel).toBeInViewport({ ratio: 1 });
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-46',
      titel: 'Annas Stall im Fürstentum: neben Späherreiter und Ritter der Knopf mit dem Hufeisen, darüber die Tafel „Pferdezucht“ – 150 Nahrung, Kavallerie: +10 % Tempo, Forschung 40 s',
      test: info,
    });

    // Erforscht: der Knopf ist fort, die Nahrung bezahlt, und jeder Reiter ist
    // ein Zehntel schneller - Annas, nicht Berts.
    await knopf('pferdezucht').click();
    await expect.poll(() => anna.evaluate(() => window.ansicht.vorraete.nahrung)).toBe(2000 - 150);
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => window.ansicht.verbesserungen.includes('pferdezucht'), null, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);
    await expect(knopf('pferdezucht')).toHaveCount(0);
    await expect.poll(() => tempo('ich', 'ritter')).toBe(1.485);
    expect(await tempo('ich', 'leichtekavallerie')).toBe(1.705);
    expect(await tempo('ich', 'speerkaempfer'), 'das Fussvolk bleibt').toBe(1);
    expect(await tempo('bert', 'ritter'), 'Berts Ritter bleibt').toBe(1.35);
    await anna.mouse.move(700, 300);
    await knopf('ritter').hover();
    await expect(tafel).toContainText(/Tempo 1,4[89]/);
    await anna.mouse.move(700, 300);
  });
});
