// Die Wirtschafts-KI im Browser (→ specs/10-strategie/ki.md AC-9): sie spielt
// beide Seiten, und nach rund zwoelf Spielminuten steht ihr Dorf in der
// Feudalzeit, mit Schiessanlage und Bogenschuetzen.
//
// Der Pruefstand belegt die Zeiten ueber zwanzig Startwerte ohne Browser
// (`tests/strategie-ki.test.mjs`). Hier geht es nur um das Bild: wie das
// aussieht, was dort gemessen wird.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, figurenFrei, kiSpielt, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

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
    test.setTimeout(300_000);
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
      // Und ohne Spielminuten: die Uhr steht oben im Bild, und sie zeigt den
      // Augenblick, in dem die Bedingungen zutrafen - nicht die zwoelf
      // Minuten, nach denen der Test zu schauen beginnt (Runde 83: 13:44).
      titel: 'Die Wirtschafts-KI, allein in die Feudalzeit aufgestiegen (oben in der Leiste, daneben die Uhr): sie hat Farmen, eine Schießanlage und Bogenschützen gebaut — befohlen hat das niemand',
      test: info,
    });
    await zeitraffer(anna, code, 1);
  });
});

// Die kaempfende KI (→ specs/10-strategie/ki.md AC-11). Dass sie aus eigener
// Kraft so weit kommt, messen zwanzig Partien im Pruefstand
// (`tests/strategie-ki.test.mjs`): das erste Heer bricht nach rund achtzehn
// Spielminuten auf. Hier geht es um das Bild, und achtzehn Minuten Zeitraffer
// waeren eine Minute echte Zeit umsonst - deshalb stehen die zehn
// Kampfeinheiten per Pruefgriff da. **Die Entscheidung trifft die KI selbst**:
// wann sie aufbricht, wen sie schickt, wen sie als Wache behaelt und was sie
// am Ziel angreift.
test.describe('Die KI greift an', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('ki AC-11: acht Kampfeinheiten ziehen gesammelt zum Gegner, zwei bleiben als Wache', async ({}, info) => {
    test.setTimeout(180_000);
    const { anna, code } = partie;
    await kiSpielt(anna, code, 'Bert');

    // Annas Dorfzentrum und Berts Basis, aus dem Browser gelesen.
    const lage = await anna.evaluate(() => {
      const a = window.ansicht;
      const zentrum = [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'dorfzentrum');
      const [gegnerId, gegner] = [...a.spieler.entries()].find(([id]) => id !== a.ich);
      return { zentrum: { id: zentrum.i, x: zentrum.x, y: zentrum.y }, gegnerId, basis: gegner.basis };
    });
    // Zehn Kampfeinheiten per Pruefgriff, statt achtzehn Spielminuten darauf
    // zu warten, dass die KI sie selbst ausbildet - dass sie das tut, messen
    // zwanzig Partien im Pruefstand. **Die Entscheidung bleibt ihre**: wann
    // sie aufbricht, wen sie schickt und wer zu Hause wacht.
    // Neun Milizen, denn der Spaeherreiter aus Berts Startaufstellung ist
    // schon eine Kampfeinheit - zusammen die zehn, die ki AC-11 verlangt.
    const gestellt = await einheitenAufstellen(anna, code, 'Bert', 9, { art: 'miliz', x: lage.basis.x, y: lage.basis.y });
    expect(gestellt, 'neun Milizen bei Bert').toBe(9);

    // Das Heer unterwegs, auf halbem Weg zwischen den Doerfern. Gezaehlt wird
    // in Annas Browser - sie sieht die ganze Karte (der Nebel kommt erst mit
    // C6).
    // Vierzig Felder von daheim: weit genug, dass von Berts Dorf nichts mehr
    // im Bild steht - sonst stand bei 25 Feldern eine der beiden Wachen mit
    // im Ausschnitt und das Bild zeigte neun -, und noch vierzig Felder vor
    // Annas Dorf, also der Zug und nicht das Gefecht. Der Zeitraffer bleibt
    // bei acht, damit das Anhalten den Zug nicht weit ueberrollt.
    const MARSCH = 40;
    await zeitraffer(anna, code, 8);
    await anna.waitForFunction(({ gegnerId, basis, marsch }) => {
      const a = window.ansicht;
      const seine = [...a.nachher.values()].filter((e) => e.b === gegnerId && e.k !== 'd' && !e.s);
      return seine.filter((e) => Math.hypot(e.x - basis.x, e.y - basis.y) > marsch).length >= 8;
    }, { ...lage, marsch: MARSCH }, { timeout: 120_000 });
    await zeitraffer(anna, code, 0);

    // Die Kamera auf die Mitte des Heeres, in Spielgroesse: so sieht es der,
    // auf den es zukommt.
    const mitte = await anna.evaluate(({ gegnerId, basis, marsch }) => {
      const a = window.ansicht;
      const ziehende = [...a.nachher.values()].filter((e) => e.b === gegnerId && e.k !== 'd' && !e.s
        && Math.hypot(e.x - basis.x, e.y - basis.y) > marsch);
      const x = ziehende.reduce((s, e) => s + e.x, 0) / ziehende.length;
      const y = ziehende.reduce((s, e) => s + e.y, 0) / ziehende.length;
      a.kamera.zoom = 1;
      a.blickAuf(x, y);
      return { x, y };
    }, { ...lage, marsch: MARSCH });

    // Unterwegs laufen sie hintereinander her und geraten dabei auf denselben
    // Punkt (Figuren duerfen das noch, einheiten AC-29 ist offen). Fuer das
    // Bild wird ein Augenblick gesucht, in dem keine zwei aufeinander stehen:
    // anhalten, nachsehen, sonst eine halbe Sekunde weiterlaufen lassen -
    // geprueft wird genau der Augenblick, der fotografiert wird.
    let beanstandet = await figurenFrei(anna);
    for (let versuch = 0; versuch < 30 && beanstandet.length; versuch++) {
      await zeitraffer(anna, code, 1);
      await anna.waitForTimeout(400);
      await zeitraffer(anna, code, 0);
      beanstandet = await figurenFrei(anna);
    }
    expect(beanstandet, 'keine zwei Figuren uebereinander').toEqual([]);

    // Was die Unterschrift behauptet, erst zaehlen (Runde 19).
    const bild = await anna.evaluate(({ gegnerId, basis, mitte }) => {
      const a = window.ansicht;
      const seine = [...a.nachher.values()].filter((e) => e.b === gegnerId && e.k !== 'd' && !e.s);
      const sichtbar = seine.filter((e) => {
        const p = a.zuBild(e.x, e.y);
        return p.x > 0 && p.x < a.leinwand.clientWidth && p.y > 0 && p.y < a.leinwand.clientHeight;
      });
      return {
        imBild: sichtbar.length,
        zuHause: seine.filter((e) => Math.hypot(e.x - basis.x, e.y - basis.y) < 10).length,
        unterwegs: seine.filter((e) => Math.hypot(e.x - basis.x, e.y - basis.y) >= 10).length,
        weitVonDaheim: Math.min(...sichtbar.map((e) => Math.hypot(e.x - basis.x, e.y - basis.y))),
        milizenImBild: sichtbar.filter((e) => e.k === 'm').length,
        reiterImBild: sichtbar.filter((e) => e.k === 's').length,
        meineAuswahl: a.ausgewaehlt.size,
        mitte,
      };
    }, { ...lage, mitte });
    expect(bild.unterwegs, 'acht ziehen los').toBe(8);
    expect(bild.zuHause, 'zwei bleiben als Wache').toBe(2);
    expect(bild.imBild, 'und das ganze Heer steht im Bild').toBe(8);
    // Der Spaeherreiter laeuft doppelt so schnell wie eine Miliz und ist
    // deshalb voraus - die Unterschrift sagt das, statt von einem
    // geschlossenen Verband zu sprechen.
    expect(bild.milizenImBild, 'sieben Milizen im Verband').toBe(7);
    expect(bild.reiterImBild, 'und der Spaeherreiter voraus').toBe(1);
    expect(bild.weitVonDaheim, 'weit weg von zu Hause').toBeGreaterThan(30);
    expect(bild.meineAuswahl, 'Anna hat nichts ausgewaehlt und nichts befohlen').toBe(0);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);

    await nachweis(anna, {
      spec: KI,
      ac: 'AC-11',
      titel: 'Das Heer der KI auf dem Weg zum Gegner: acht Kampfeinheiten ziehen über die offene Karte, vierzig Felder von ihrem eigenen Dorf entfernt — sieben Milizen im Verband, der schnellere Späherreiter voraus. Befohlen hat das kein Mensch',
      test: info,
    });
    await zeitraffer(anna, code, 1);
  });
});
