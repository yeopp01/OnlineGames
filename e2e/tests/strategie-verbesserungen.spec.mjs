// Die Verbesserungen der Feudalzeit im Bild (→ specs/10-strategie/bauen.md
// AC-25, AC-26): die Schmiede forscht Schmiedeangriff und Befiederte Pfeile,
// Holzfaellerlager und Muehle verbessern die Wirtschaft. Jede hat ihr eigenes
// Bildchen - vier gleiche Knoepfe waeren keine Auswahl (darstellung AC-14).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, gebaeudeAufstellen, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, gebaeudeInDerNaehe, partieBeenden, partieZuZweit, platzImBild } from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';

/** Ein Gebaeude anwaehlen und die Kamera darauf richten. */
async function gebaeudeWaehlen(page, id, zoom = 1.8) {
  await page.waitForFunction((g) => window.ansicht.gebaeude.has(g), id);
  await page.evaluate(([g, z]) => {
    const a = window.ansicht;
    a.kamera.zoom = z;
    a.gewaehltesGebaeude = g;
    a.ausgewaehlt.clear();
    const m = a.gebaeudeMitte(a.gebaeude.get(g));
    a.blickAuf(m.x, m.y);
    a.beiAuswahl();
  }, [id, zoom]);
}

/** Forschen und warten, bis die Verbesserung steht - der Knopf verschwindet. */
async function erforschen(page, code, art) {
  await page.locator(`[data-ausbilden="${art}"]`).click();
  await zeitraffer(page, code, 20);
  await page.waitForFunction((a) => window.ansicht.verbesserungen.includes(a), art, { timeout: 60_000 });
  await zeitraffer(page, code, 1);
}

test.describe('Verbesserungen der Feudalzeit', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let basis;
  let schmiede;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
    const { anna, code } = partie;
    basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    await rohstoffe(anna, code, 'Anna', { holz: 2000, nahrung: 2000, gold: 2000 });
    // Das zweite Gebaeude der Dunklen Zeit - ohne es geht der Aufstieg nicht
    // (bauen AC-23). Die Muehle steht ohnehin auf dem Plan.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'muehle', basis, { von: 5, bis: 12 });
    // Der echte Weg in die Feudalzeit: Auftrag im Dorfzentrum.
    await anna.keyboard.press('h');
    await anna.locator('[data-aufstieg="feudalzeit"]').click();
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => window.ansicht.zeitalter === 1, null, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);
    // Die Ankuendigung "Feudalzeit erreicht" steht gross in der Mitte - erst
    // wenn sie weg ist, zeigt ein Bild das Gebaeude darunter.
    await expect(anna.locator('#zeitalterwechsel')).toBeHidden({ timeout: 10_000 });
    await rohstoffe(anna, code, 'Anna', { holz: 2000, nahrung: 2000, gold: 2000 });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bauen AC-25: die Schmiede bietet Schmiedeangriff und Befiederte Pfeile mit eigenem Bild', async ({}, info) => {
    const { anna, code } = partie;
    schmiede = await gebaeudeInDerNaehe(anna, code, 'Anna', 'schmiede', basis, { von: 5, bis: 14 });
    await gebaeudeWaehlen(anna, schmiede);

    const angriff = anna.locator('[data-ausbilden="schmiedeangriff"]');
    const pfeile = anna.locator('[data-ausbilden="befiedertePfeile"]');
    await expect(angriff).toHaveCount(1);
    await expect(pfeile).toHaveCount(1);
    await expect(angriff).toHaveAttribute('title', 'Schmiedeangriff erforschen (100 Nahrung)');
    await expect(pfeile).toHaveAttribute('title', 'Befiederte Pfeile erforschen (100 Nahrung, 50 Gold)');
    await expect(angriff).toBeInViewport();
    await expect(pfeile).toBeInViewport();

    // Zwei Knoepfe, zwei Bilder: die Leinwände duerfen nicht gleich aussehen,
    // sonst waere die Auswahl ein Ratespiel (darstellung AC-14).
    const gleich = await anna.evaluate(() => {
      const [a, b] = ['schmiedeangriff', 'befiedertePfeile']
        .map((art) => document.querySelector(`[data-ausbilden="${art}"] canvas`).toDataURL());
      return a === b;
    });
    expect(gleich, 'Amboss und Pfeil sind verschiedene Bilder').toBe(false);

    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-25',
      titel: 'Die Schmiede gewählt: Schmiedeangriff (Amboss, 100 Nahrung) und Befiederte Pfeile (Pfeil, 100 Nahrung, 50 Gold) — jede Forschung mit eigenem Bild',
      test: info,
    });
  });

  test('bauen AC-25: erforscht wirkt es sofort, der Knopf ist weg', async () => {
    const { anna, code } = partie;
    await gebaeudeWaehlen(anna, schmiede);
    await erforschen(anna, code, 'schmiedeangriff');

    // Erforscht ist erforscht: der Knopf verschwindet aus dem Angebot.
    await gebaeudeWaehlen(anna, schmiede);
    await expect(anna.locator('[data-ausbilden="schmiedeangriff"]')).toHaveCount(0);
    await expect(anna.locator('[data-ausbilden="befiedertePfeile"]')).toHaveCount(1);
    expect(await anna.evaluate(() => window.ansicht.verbesserungen)).toContain('schmiedeangriff');
    // Bert hat sie nicht - eine Verbesserung gilt einem Spieler.
    expect(await partie.bert.evaluate(() => window.ansicht.verbesserungen)).not.toContain('schmiedeangriff');
  });

  test('bauen AC-26: die Mühle erforscht das Pferdekummet - jede Farm trägt danach 75 Nahrung mehr', async ({}, info) => {
    const { anna, code } = partie;
    const muehle = await anna.evaluate(() => {
      const a = window.ansicht;
      return [...a.gebaeude.values()].find((g) => g.art === 'muehle' && g.b === a.ich).i;
    });
    // Eine Farm, die schon steht: sie bekommt die Nahrung nachgelegt. Sie muss
    // **vorn** stehen, sonst verdeckt das Dorfzentrum sie im Bild (Runde 68).
    const wo = await platzImBild(anna, { n: 3, um: basis, abstand: 5 });
    expect(wo, 'ein Bauplatz vorn').toBeTruthy();
    const farm = await gebaeudeAufstellen(anna, code, 'Anna', 'farm', wo.x, wo.y);
    await anna.waitForFunction((f) => window.ansicht.gebaeude.get(f)?.n !== undefined, farm);
    expect(await anna.evaluate((f) => window.ansicht.gebaeude.get(f).n, farm)).toBe(175);

    await gebaeudeWaehlen(anna, muehle);
    const kummet = anna.locator('[data-ausbilden="pferdekummet"]');
    await expect(kummet).toHaveCount(1);
    await expect(kummet).toHaveAttribute('title', 'Pferdekummet erforschen (75 Nahrung, 75 Holz)');
    await expect(kummet).toBeInViewport();
    await erforschen(anna, code, 'pferdekummet');

    // Die Farm, die schon stand, traegt jetzt 250 statt 175.
    await anna.waitForFunction((f) => window.ansicht.gebaeude.get(f).n === 250, farm, { timeout: 20_000 });

    // Das Bild: die Farm gewaehlt, unten "noch 250 Nahrung von 175" - die
    // Zeile nennt den Vorrat, der Zuschlag steht darueber.
    await gebaeudeWaehlen(anna, farm, 1.8);
    const vorrat = anna.locator('#farmvorrat');
    await expect(vorrat).toContainText('noch 250 Nahrung');
    // Und der Vorrat daneben ist der dieses Spielers, nicht der der Tabelle.
    await expect(vorrat).toContainText('von 250');
    await expect(vorrat).toBeInViewport();
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-26',
      titel: 'Nach dem Pferdekummet trägt die Farm, die schon stand, 250 Nahrung statt 175 — unten in der Leiste „noch 250 Nahrung"',
      test: info,
    });
  });

  test('bauen AC-26: das Holzfällerlager erforscht die Doppelaxt', async () => {
    const { anna, code } = partie;
    const lager = await gebaeudeInDerNaehe(anna, code, 'Anna', 'holzfaellerlager', basis, { von: 5, bis: 14 });
    await gebaeudeWaehlen(anna, lager);
    const axt = anna.locator('[data-ausbilden="doppelaxt"]');
    await expect(axt).toHaveCount(1);
    await expect(axt).toHaveAttribute('title', 'Doppelaxt erforschen (100 Nahrung, 50 Holz)');
    await erforschen(anna, code, 'doppelaxt');
    await gebaeudeWaehlen(anna, lager);
    await expect(anna.locator('[data-ausbilden="doppelaxt"]')).toHaveCount(0);
    expect(await anna.evaluate(() => window.ansicht.verbesserungen)).toContain('doppelaxt');
  });
});
