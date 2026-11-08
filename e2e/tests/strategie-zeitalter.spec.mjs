// Der Aufstieg in die Feudalzeit im Bild (→ specs/10-strategie/bauen.md AC-23,
// bedienung.md AC-33): das Dorfzentrum bietet ihn an, die Schlange zeigt den
// Fortschritt, oben steht das Zeitalter, und der Wechsel wird einmal gemeldet.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, gebaeudeAufstellen, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';
const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Zeitalterwechsel', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('bauen AC-23: das Dorfzentrum bietet den Aufstieg an - gesperrt, solange Nahrung oder Gebaeude fehlen', async ({}, info) => {
    const { anna, code } = partie;
    const knopf = anna.locator('[data-aufstieg="feudalzeit"]');

    // Dorfzentrum gewaehlt: der Aufstieg steht neben dem Dorfbewohner und dem
    // Webstuhl - und nur die Feudalzeit, nicht alle drei Zeitalter.
    await anna.keyboard.press('h');
    await expect(knopf).toHaveCount(1);
    await expect(anna.locator('[data-aufstieg="ritterzeit"]')).toHaveCount(0);
    await expect(knopf).toHaveAttribute('aria-disabled', 'true');
    await expect(knopf).toHaveAttribute('data-fehlt', 'Nahrung');

    // Mit 600 Nahrung ist der Knopf frei - die Voraussetzung prueft der Server.
    await rohstoffe(anna, code, 'Anna', { nahrung: 600 });
    await expect(knopf).toHaveAttribute('aria-disabled', 'false');
    await expect(knopf).toHaveAttribute('title', 'Aufstieg in die Feudalzeit (500 Nahrung)');

    // Nur das Dorfzentrum steht: der Server sagt, was fehlt (bedienung AC-18).
    await knopf.click();
    const meldung = anna.locator('#spielmeldung');
    await expect(meldung).toContainText('2 fertige Gebäude der Dunklen Zeit außer Häusern');
    await expect(meldung).toBeInViewport();
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-23',
      titel: 'Dorfzentrum gewählt, 600 Nahrung da: der Knopf für die Feudalzeit neben Dorfbewohner und Webstuhl — die Absage nennt die fehlenden Gebäude',
      test: info,
    });
  });

  test('bauen AC-23: mit zwei Gebaeuden laeuft der Aufstieg, die Schlange zeigt ihn mit Fortschritt', async ({}, info) => {
    const { anna, code } = partie;
    // Eine Muehle ein Stueck neben der Basis - das zweite Gebaeude der Dunklen Zeit.
    const basis = await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 1.6;
      a.blickAuf(b.x + 2, b.y + 2);
      return b;
    });
    await gebaeudeAufstellen(anna, code, 'Anna', 'muehle', basis.x + 6, basis.y + 6);
    await anna.waitForFunction(() => [...window.ansicht.gebaeude.values()].some((g) => g.art === 'muehle'));

    await anna.keyboard.press('h');
    await anna.locator('[data-aufstieg="feudalzeit"]').click();
    // Der Aufstieg steht in der Schlange und zaehlt hoch.
    const laufend = anna.locator('[data-laufender-aufstieg="feudalzeit"]');
    await expect(laufend).toHaveCount(1);
    await expect(laufend).toHaveClass(/laufend/);
    await expect(anna.locator('#zeitalter b')).toHaveText('Dunkle Zeit');
    // Die Nahrung ist bezahlt: 600 - 500.
    await expect(anna.locator('[data-rohstoff="nahrung"] b')).toHaveText('100');

    await zeitraffer(anna, code, 20);
    // Rund die Haelfte der Zeit: der Balken steht sichtbar im Knopf.
    await anna.waitForFunction(() => {
      const g = [...window.ansicht.gebaeude.values()].find((x) => x.s?.includes('feudalzeit'));
      return g && g.f > 0.4;
    }, null, { timeout: 30_000 });
    await zeitraffer(anna, code, 1);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-23',
      titel: 'Der Aufstieg läuft: in der Schlange des Dorfzentrums das Tor mit dem Fortschrittsbalken, oben noch „Dunkle Zeit" und 100 Nahrung',
      test: info,
    });
  });

  test('bedienung AC-33 und bedienung AC-41: der Wechsel wird einmal gemeldet, nicht auf der Mitte, danach steht die Feudalzeit oben', async ({}, info) => {
    const { anna, code } = partie;
    await zeitraffer(anna, code, 20);
    // Die Ankuendigung steht gross oben, solange sie zu sehen ist.
    const ankuendigung = anna.locator('#zeitalterwechsel');
    await ankuendigung.waitFor({ state: 'visible', timeout: 40_000 });
    await zeitraffer(anna, code, 1);
    await expect(ankuendigung).toHaveText('Feudalzeit erreicht');
    await expect(ankuendigung).toBeInViewport();
    await expect(anna.locator('#zeitalter b')).toHaveText('Feudalzeit');
    expect(await anna.evaluate(() => window.ansicht.zeitalter)).toBe(1);
    // Nicht auf der Mitte (bedienung AC-41): das Rechteck der Ansage beruehrt
    // das mittlere Drittel des Fensters nicht - dort steht meist das Dorf.
    const lage = await ankuendigung.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const b = window.innerWidth;
      const h = window.innerHeight;
      const mitte = { links: b / 3, rechts: (2 * b) / 3, oben: h / 3, unten: (2 * h) / 3 };
      return { ueberdeckt: r.left < mitte.rechts && r.right > mitte.links && r.top < mitte.unten && r.bottom > mitte.oben };
    });
    expect(lage.ueberdeckt, 'die Ansage liegt nicht auf dem mittleren Drittel').toBe(false);
    expect(await bedienteileFrei(anna)).toEqual([]);
    for (const ac of ['AC-33', 'AC-41']) {
      await nachweis(anna, {
        spec: BEDIENUNG,
        ac,
        titel: 'Oben im Bild „Feudalzeit erreicht", die Mitte mit dem Dorf bleibt frei; in der Leiste steht ab jetzt „Feudalzeit"',
        test: info,
      });
    }

    // Gemeldet wird einmal: nach vier Sekunden ist die Ankuendigung weg, oben
    // steht das Zeitalter weiter.
    await expect(ankuendigung).toBeHidden({ timeout: 8000 });
    await expect(anna.locator('#zeitalter b')).toHaveText('Feudalzeit');

    // Und das Dorfzentrum bietet den Aufstieg nicht noch einmal an.
    await anna.keyboard.press('h');
    await expect(anna.locator('[data-aufstieg="feudalzeit"]')).toHaveCount(0);
    await expect(anna.locator('[data-aufstieg="ritterzeit"]')).toHaveCount(1);
    // Bert ist noch in der Dunklen Zeit - das Zeitalter gilt je Spieler.
    await expect(partie.bert.locator('#zeitalter b')).toHaveText('Dunkle Zeit');
  });
});
