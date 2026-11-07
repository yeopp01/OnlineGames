// Die Wirtschafts-KI im Browser (→ specs/10-strategie/ki.md AC-9): sie spielt
// beide Seiten, und nach rund zwoelf Spielminuten steht ihr Dorf in der
// Feudalzeit, mit Schiessanlage und Bogenschuetzen.
//
// Der Pruefstand belegt die Zeiten ueber zwanzig Startwerte ohne Browser
// (`tests/strategie-ki.test.mjs`). Hier geht es nur um das Bild: wie das
// aussieht, was dort gemessen wird.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, kiSpielt, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const KI = '10-strategie/ki.md';

test.describe('Wirtschafts-KI', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  // Zwoelf Spielminuten im Zeitraffer 20 sind gut vierzig Sekunden echte Zeit -
  // der langsamste Fall im Browserlauf, deshalb die eigene Frist.
  test('ki AC-9: die KI steigt von selbst in die Feudalzeit auf und baut Militaer', async ({}, info) => {
    test.setTimeout(180_000);
    const { anna, code } = partie;
    for (const name of ['Anna', 'Bert']) await kiSpielt(anna, code, name);
    await zeitraffer(anna, code, 20);

    // Warten, bis die Feudalzeit steht und die erste Kampfeinheit aus der
    // Schiessanlage kommt - der Spaeher vom Anfang zaehlt nicht mit.
    await anna.waitForFunction(() => window.ansicht.zeitalter === 1, null, { timeout: 150_000 });
    await anna.waitForFunction(() => {
      const a = window.ansicht;
      const meine = [...a.nachher.values()].filter((e) => e.b === a.ich);
      return meine.filter((e) => e.k === 'b').length >= 2
        // `u` ist der Baufortschritt und steht nur an Baustellen: fehlt er,
        // ist das Gebaeude fertig.
        && [...a.gebaeude.values()].some((g) => g.b === a.ich && g.art === 'schiessanlage' && g.u === undefined);
    }, null, { timeout: 60_000 });
    await zeitraffer(anna, code, 0);

    // Was die Unterschrift behauptet, erst zaehlen: Zeitalter, Gebaeude,
    // Einheiten - geschaetzt wird hier nichts (Runde 19).
    const lage = await anna.evaluate(() => {
      const a = window.ansicht;
      const meine = [...a.gebaeude.values()].filter((g) => g.b === a.ich && g.u === undefined);
      const arten = {};
      for (const g of meine) arten[g.art] = (arten[g.art] || 0) + 1;
      const einheiten = [...a.nachher.values()].filter((e) => e.b === a.ich);
      const zaehler = {};
      for (const e of einheiten) zaehler[e.k] = (zaehler[e.k] || 0) + 1;
      return { zeitalter: a.zeitalter, arten, zaehler, basis: a.spieler.get(a.ich).basis };
    });
    expect(lage.zeitalter, 'die Feudalzeit steht').toBe(1);
    expect(lage.arten.schiessanlage, 'eine fertige Schiessanlage').toBeGreaterThanOrEqual(1);
    expect(lage.arten.farm, 'Farmen tragen die Nahrung').toBeGreaterThanOrEqual(3);
    expect(lage.zaehler.b, 'Bogenschuetzen aus der Schiessanlage').toBeGreaterThanOrEqual(2);
    expect(lage.zaehler.d, 'und die Dorfbewohner, die das erarbeitet haben').toBeGreaterThanOrEqual(20);

    // Die Kamera auf das Dorf, in Spielgroesse: so sieht ein Zuschauer es.
    await anna.evaluate((basis) => {
      const a = window.ansicht;
      a.kamera.zoom = 1;
      a.ausgewaehlt.clear();
      a.gewaehltesGebaeude = null;
      a.beiAuswahl();
      a.blickAuf(basis.x + 1, basis.y + 1);
    }, lage.basis);
    await expect(anna.locator('#zeitalter')).toContainText('Feudalzeit');
    await expect(anna.locator('#zeitalter')).toBeInViewport();
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);

    await nachweis(anna, {
      spec: KI,
      ac: 'AC-9',
      // Ohne Zahlen in der Unterschrift: wie viele Farmen und Bogenschuetzen
      // genau dastehen, haengt am Zeitpunkt des Bildes. Was oben gezaehlt und
      // zugesichert ist, steht hier als "Farmen" und "Bogenschuetzen".
      titel: 'Die Wirtschafts-KI nach rund zwölf Spielminuten: sie ist allein in die Feudalzeit aufgestiegen (oben in der Leiste), hat Farmen, eine Schießanlage und Bogenschützen gebaut — befohlen hat das niemand',
      test: info,
    });
    await zeitraffer(anna, code, 1);
  });
});
