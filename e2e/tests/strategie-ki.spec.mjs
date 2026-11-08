// Die Wirtschafts-KI im Browser (→ specs/10-strategie/ki.md AC-9): sie spielt
// beide Seiten, und nach rund zwoelf Spielminuten steht ihr Dorf in der
// Feudalzeit, mit Schiessanlage und Bogenschuetzen.
//
// Der Pruefstand belegt die Zeiten ueber zwanzig Startwerte ohne Browser
// (`tests/strategie-ki.test.mjs`). Hier geht es nur um das Bild: wie das
// aussieht, was dort gemessen wird.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, figurenFrei, gebaeudeInDerNaehe, kiSpielt, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

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
    // Aufgedeckt (kampf AC-16): gezeigt wird die KI, nicht der Nebel - aus
    // Annas Sicht laege ihr Heer im Dunkeln (Runde 105).
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
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

test.describe('Die KI verteidigt sich', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Aufgedeckt (kampf AC-16): gezeigt wird die KI, nicht der Nebel - aus
    // Annas Sicht laege ihr Heer im Dunkeln (Runde 105).
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  // Angegriffen wird ein **Haus abseits des Dorfes**, nicht das Dorfzentrum.
  // Am Dorfzentrum treibt die KI ihre Schafe zusammen, schlachtet dort und laedt
  // dort ab - und solange Einheiten aufeinander stehen duerfen (einheiten
  // AC-29 ist offen), stand in jedem dritten Lauf irgendwo im Gedraenge eine
  // Figur auf einer anderen (Runde 86, vier Fassungen). Auf freier Wiese ist
  // niemand ausser Angreifer und Wache, und die Aussage ist dieselbe: die KI
  // verteidigt **jedes** ihrer Gebaeude.
  test('ki AC-14: Anna schlaegt auf ein Haus der KI ein, ihre Wache kommt', async ({}, info) => {
    test.setTimeout(240_000);
    const { anna, code } = partie;
    await kiSpielt(anna, code, 'Bert');

    const lage = await anna.evaluate(() => {
      const a = window.ansicht;
      const [gegnerId] = [...a.spieler.keys()].filter((id) => id !== a.ich);
      const zentrum = [...a.gebaeude.values()].find((g) => g.b === gegnerId && g.art === 'dorfzentrum');
      return { gegnerId, zentrum: { x: zentrum.x, y: zentrum.y } };
    });
    // Zwanzig Felder oestlich des Dorfzentrums ist auf Karte 4711 freie Wiese.
    const hausId = await gebaeudeInDerNaehe(anna, code, 'Bert', 'haus',
      { x: lage.zentrum.x + 20, y: lage.zentrum.y + 1 }, { von: 0, bis: 6 });
    await anna.waitForFunction((id) => window.ansicht.gebaeude.has(id), hausId, { timeout: 30_000 });
    const haus = await anna.evaluate((id) => {
      const g = window.ansicht.gebaeude.get(id);
      return { id, x: g.x, y: g.y };
    }, hausId);
    lage.haus = haus;

    // Berts Wache steht achtzehn Felder suedoestlich - so ist zu sehen, dass
    // sie **hinzieht**. Annas Trupp steht am Haus: vier, denn eine einzelne
    // Miliz faellt, sobald die Wache da ist, und dann zeigte das Bild einen
    // Angriff ohne Angreifer.
    expect(await einheitenAufstellen(anna, code, 'Bert', 2, { art: 'miliz', x: haus.x + 15, y: haus.y + 11 }),
      'zwei Wachen bei Bert').toBe(2);
    expect(await einheitenAufstellen(anna, code, 'Anna', 4, { art: 'miliz', x: haus.x - 2, y: haus.y - 2 }),
      'vier Milizen bei Anna').toBe(4);

    await anna.evaluate(({ x, y }) => {
      window.ansicht.kamera.zoom = 2;
      window.ansicht.blickAuf(x, y);
    }, haus);
    // Erst wenn der naechste Zustand da ist, stehen die neuen Milizen im Bild.
    await anna.waitForFunction((gegnerId) => {
      const a = window.ansicht;
      const alle = [...a.nachher.values()];
      return alle.filter((e) => e.b === a.ich && e.k === 'm').length >= 4
        && alle.filter((e) => e.b === gegnerId && e.k === 'm').length >= 2;
    }, lage.gegnerId, { timeout: 30_000 });

    // Der Rechtsklick eines Menschen auf ein fremdes Gebaeude ist der Angriff
    // (kampf AC-1) - gezielt wird auf das **Feld** des Hauses, nicht auf seine
    // gezeichnete Mitte: die liegt hoeher und gehoert zu einem Feld dahinter.
    const aufHaus = await anna.evaluate((id) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set([...a.nachher.values()].filter((e) => e.b === a.ich && e.k === 'm').map((e) => e.i));
      a.beiAuswahl();
      const g = a.gebaeude.get(id);
      return a.zuBild(g.x, g.y);
    }, haus.id);
    await anna.mouse.click(aufHaus.x, aufHaus.y, { button: 'right' });

    // Das Haus nimmt Schaden - daran sieht die KI den Angriff.
    await anna.waitForFunction((id) => {
      const a = window.ansicht;
      const g = a.gebaeude.get(id);
      return g && g.h < a.werte.gebaeude[g.art].leben;
    }, haus.id, { timeout: 60_000 });

    // Und ihre Wache zieht hin. Festgehalten wird der **Weg**, nicht sein
    // Ende: zwei rote Milizen im freien Feld zwischen ihrem Posten und dem
    // angegriffenen Haus sind auf einem Standbild zu sehen. Der Lebensbalken
    // taugt dafuer nicht: in diesen Sekunden verliert das Haus wenig, und
    // wenig sind ein paar Bildpunkte.
    await zeitraffer(anna, code, 8);
    await anna.waitForFunction(({ gegnerId, haus: h }) => {
      const a = window.ansicht;
      return [...a.nachher.values()]
        .filter((e) => e.b === gegnerId && e.k === 'm' && !e.s
          && Math.hypot(e.x - h.x, e.y - h.y) < 14).length >= 2;
    }, lage, { timeout: 120_000 });
    await zeitraffer(anna, code, 0);

    // Die Kamera zwischen Haus und Wache, naeher am Haus.
    await anna.evaluate(({ gegnerId, haus: h }) => {
      const a = window.ansicht;
      const wache = [...a.nachher.values()].filter((e) => e.b === gegnerId && e.k === 'm' && !e.s);
      const mx = wache.reduce((summe, e) => summe + e.x, 0) / wache.length;
      const my = wache.reduce((summe, e) => summe + e.y, 0) / wache.length;
      a.kamera.zoom = 1.6;
      a.blickAuf(h.x * 0.6 + mx * 0.4, h.y * 0.6 + my * 0.4);
    }, lage);

    // Keine zwei Figuren uebereinander - sonst zaehlt das Auge falsch. Nur ein
    // kurzer Schubs, falls zwei Angreifer gerade dasselbe Feld kreuzen: die
    // Wache darf dabei nicht ankommen.
    let beanstandet = await figurenFrei(anna);
    for (let versuch = 0; versuch < 8 && beanstandet.length; versuch++) {
      await zeitraffer(anna, code, 1);
      await anna.waitForTimeout(200);
      await zeitraffer(anna, code, 0);
      beanstandet = await figurenFrei(anna);
    }
    expect(beanstandet, 'keine zwei Figuren uebereinander').toEqual([]);

    // Was die Unterschrift behauptet, erst zaehlen.
    const bild = await anna.evaluate(({ gegnerId, haus: h }) => {
      const a = window.ansicht;
      const imBild = (e) => {
        const p = a.zuBild(e.x, e.y);
        return p.x > 0 && p.x < a.leinwand.clientWidth && p.y > 0 && p.y < a.leinwand.clientHeight;
      };
      const lebend = [...a.nachher.values()].filter((e) => !e.s);
      const abstand = (e) => Math.hypot(e.x - h.x, e.y - h.y);
      const wache = lebend.filter((e) => e.b === gegnerId && e.k === 'm' && imBild(e));
      return {
        wacheImBild: wache.length,
        wacheFern: Math.min(...wache.map(abstand)),
        wacheNah: Math.max(...wache.map(abstand)),
        // Niemand sonst von Bert steht bei der Wache - sonst waere im Bild
        // nicht zu sehen, welche zwei da im freien Feld stehen.
        andereBeiDerWache: lebend.filter((e) => e.b === gegnerId && !wache.includes(e)
          && wache.some((w) => Math.hypot(w.x - e.x, w.y - e.y) < 4)).length,
        meineAmHaus: lebend.filter((e) => e.b === a.ich && e.k === 'm' && imBild(e) && abstand(e) < 4).length,
        hausImBild: imBild({ x: h.x, y: h.y }),
      };
    }, lage);
    expect(bild.wacheImBild, 'zwei Milizen der KI im Bild').toBe(2);
    expect(bild.wacheFern, 'sie sind noch nicht da').toBeGreaterThan(4);
    expect(bild.wacheNah, 'aber schon im Anmarsch').toBeLessThan(14);
    expect(bild.andereBeiDerWache, 'niemand sonst steht bei ihnen im freien Feld').toBe(0);
    expect(bild.meineAmHaus, 'Annas Milizen stehen am Haus').toBeGreaterThanOrEqual(2);
    expect(bild.hausImBild, 'das Haus steht im Bild').toBe(true);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);

    await nachweis(anna, {
      spec: KI,
      ac: 'AC-14',
      titel: 'Zwei rote Milizen der KI stehen im freien Feld vor einem Haus von Bert, an dem Annas Milizen (blau) stehen: die Wache auf halbem Weg zwischen ihrem Posten und dem angegriffenen Haus. Befohlen hat das kein Mensch',
      test: info,
    });
    await zeitraffer(anna, code, 1);
  });
});
