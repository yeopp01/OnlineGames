// Das Ende der Partie im Bild (→ specs/10-strategie/spielziel.md AC-5, AC-6).
//
// Entschieden wird auf dem Server (tests/strategie-partieende.test.mjs), hier
// wird geprueft, dass beide dasselbe Ergebnis sehen - der Sieger und der, der
// aufgegeben hat - und dass danach nichts mehr laeuft.
//
// Aufgegeben wird ueber den Pruefgriff, nicht ueber einen Knopf: den baut
// bedienung AC-38. Der Griff schickt dieselbe Nachricht wie spaeter der Knopf.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { aufgebenLassen, expect, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const SPIELZIEL = '10-strategie/spielziel.md';

test.describe('Partieende', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('spielziel AC-5: wer uebrig bleibt, sieht "Du hast gewonnen", und die Uhr steht', async ({}, info) => {
    const { anna, bert, code } = partie;
    await expect(anna.locator('#partieende')).toBeHidden();
    expect(await anna.evaluate(() => window.ansicht.ende)).toBe(null);

    // Erst eine halbe Spielminute laufen lassen: eine stehende Uhr auf 0:00
    // ist von einer Uhr, die nie lief, nicht zu unterscheiden - weder im Bild
    // noch in der Zusicherung weiter unten. Mit Zeitraffer kostet das drei
    // Sekunden statt dreissig.
    await zeitraffer(anna, code, 10);
    await anna.waitForFunction(() => window.ansicht.takt >= 300, undefined, { timeout: 15_000 });

    await aufgebenLassen(anna, code, 'Bert');
    await anna.waitForFunction(() => window.ansicht.ende !== null, undefined, { timeout: 15_000 });
    const ende = await anna.evaluate(() => window.ansicht.ende);
    expect(ende.grund).toBe('eroberung');

    await expect(anna.locator('#partieende')).toBeVisible();
    await expect(anna.locator('#partieende')).toHaveText('Du hast gewonnen');
    await expect(anna.locator('#partieende')).toBeInViewport();
    expect(await bedienteileFrei(anna)).toEqual([]);

    // Der Raum hat seine Uhr angehalten: der Takt steht, also steht auch die
    // Spielzeit oben in der Leiste. Zwei Sekunden Wanduhr waeren im Lauf mit
    // Zeitraffer sonst rund zweihundert Takte.
    const vorher = await anna.evaluate(() => window.ansicht.takt);
    await anna.waitForTimeout(2000);
    expect(await anna.evaluate(() => window.ansicht.takt), 'der Takt steht nach dem Ende').toBe(vorher);

    await nachweis(anna, {
      spec: SPIELZIEL,
      ac: 'AC-5',
      titel: 'Bert ist ausgeschieden, Anna ist übrig: „Du hast gewonnen" steht über ihrem Spielfeld',
      test: info,
    });
  });

  test('spielziel AC-6: wer aufgegeben hat, sieht dasselbe Ergebnis aus seiner Sicht', async ({}, info) => {
    const { anna, bert } = partie;
    // Dasselbe Ende, andere Sicht: beim Sieger steht "Du", beim anderen der
    // Name des Siegers. Die Kennung ist bei beiden dieselbe.
    await bert.waitForFunction(() => window.ansicht.ende !== null, undefined, { timeout: 15_000 });
    const beiBert = await bert.evaluate(() => window.ansicht.ende);
    const beiAnna = await anna.evaluate(() => window.ansicht.ende);
    expect(beiBert).toEqual(beiAnna);

    await expect(bert.locator('#partieende')).toHaveText('Anna hat gewonnen');
    await expect(bert.locator('#partieende')).toBeInViewport();

    // Alles von Bert ist gefallen: keine lebende eigene Einheit mehr, kein
    // eigenes Gebaeude. Gezaehlt im Browser, nicht geschaetzt. Die Gefallenen
    // bleiben liegen, obwohl sie nach zwei Sekunden verschwinden sollten
    // (kampf AC-10): das Aufraeumen passiert in `takten()`, und eine
    // entschiedene Partie taktet nicht mehr. Fuer das Bild ist das richtig.
    const seines = await bert.evaluate(() => {
      const a = window.ansicht;
      return {
        lebend: [...a.nachher.values()].filter((e) => e.b === a.ich && !e.s).length,
        gefallen: [...a.nachher.values()].filter((e) => e.b === a.ich && e.s).length,
        gebaeude: [...a.gebaeude.values()].filter((g) => g.b === a.ich).length,
      };
    });
    expect(seines.lebend, 'keine lebende Einheit mehr').toBe(0);
    expect(seines.gebaeude, 'kein Gebaeude mehr').toBe(0);
    expect(seines.gefallen, 'die Gefallenen liegen noch im Bild').toBeGreaterThan(0);
    expect(await bedienteileFrei(bert)).toEqual([]);

    // Naeher heran: bei Spielgroesse sind die Gefallenen rote Tupfer, und die
    // Unterschrift behauptet, man sehe sie liegen. Die Kamera geht auf ihre
    // Mitte, die Meldung steht fest am Fenster und bleibt stehen.
    await bert.evaluate(() => {
      const a = window.ansicht;
      const meine = [...a.nachher.values()].filter((e) => e.b === a.ich);
      const x = meine.reduce((summe, e) => summe + e.x, 0) / meine.length;
      const y = meine.reduce((summe, e) => summe + e.y, 0) / meine.length;
      a.kamera.zoom = 2;
      a.blickAuf(x, y);
    });

    await nachweis(bert, {
      spec: SPIELZIEL,
      ac: 'AC-6',
      titel: 'Berts Sicht, nachdem er aufgegeben hat: „Anna hat gewonnen" — seine Leute liegen gefallen, seine Gebäude sind weg',
      test: info,
    });
  });
});
