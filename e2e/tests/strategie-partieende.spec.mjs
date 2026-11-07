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
import { bedienteileFrei, dorfbewohnerAnklicken, partieBeenden, partieZuDritt, partieZuZweit } from '../helpers/strategie.mjs';

const SPIELZIEL = '10-strategie/spielziel.md';
const BEDIENUNG = '10-strategie/bedienung.md';

// Aufgeben ueber den Knopf, mit der einen Rueckfrage - eine eigene Partie,
// weil sie dabei zu Ende geht. Hier wird nichts gegriffen: geklickt wird, was
// auch ein Mensch klickt.
test.describe('Aufgeben im Bild', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-38: der Knopf fragt einmal zurueck, ein Fehlklick beendet nichts', async ({}, info) => {
    const { anna, code } = partie;
    await expect(anna.locator('#aufgeben')).toBeInViewport();
    await expect(anna.locator('#aufgebenfrage')).toBeHidden();

    // Eine halbe Spielminute, damit im Bild eine Partie laeuft und nicht eine
    // beginnt (gelernt in Runde 79).
    await zeitraffer(anna, code, 10);
    await anna.waitForFunction(() => window.ansicht.takt >= 300, undefined, { timeout: 15_000 });

    // Mit ausgewaehltem Dorfbewohner: dann steht die Auswahlleiste mit dem
    // Baumenue unten, also der breiteste Zustand - dort muss die Rueckfrage
    // frei liegen.
    const gewaehlt = await dorfbewohnerAnklicken(anna, { code });
    await anna.keyboard.press('b');
    await expect(anna.locator('#baumenue')).toBeVisible();

    // Erster Klick: die Frage, sonst nichts. Das ist der Fehlklick.
    await anna.locator('#aufgeben').click();
    await expect(anna.locator('#aufgebenfrage')).toBeInViewport();
    await expect(anna.locator('#aufgebenfrage')).toContainText('Partie wirklich aufgeben?');
    expect(await anna.evaluate(() => window.ansicht.ende), 'der erste Klick entscheidet nichts').toBe(null);
    expect(await bedienteileFrei(anna)).toEqual([]);

    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-38',
      titel: 'Der Knopf „Aufgeben" oben rechts ist geklickt: die Rückfrage steht über dem Spielfeld, entschieden ist noch nichts',
      test: info,
    });

    // Esc ist der zweite Ausweg. Er schliesst nur die Frage: die Auswahl
    // darunter bleibt stehen, obwohl dieselbe Taste sonst die Auswahl aufhebt
    // (bedienung AC-15).
    await anna.keyboard.press('Escape');
    await expect(anna.locator('#aufgebenfrage')).toBeHidden();
    expect(await anna.evaluate(() => [...window.ansicht.ausgewaehlt]), 'die Auswahl steht noch')
      .toEqual([gewaehlt]);
    await anna.locator('#aufgeben').click();
    await expect(anna.locator('#aufgebenfrage')).toBeVisible();

    // Weiterspielen: die Frage ist weg, die Partie laeuft wirklich weiter -
    // der Takt steigt, und alles von Anna steht noch.
    const vorher = await anna.evaluate(() => window.ansicht.takt);
    await anna.locator('#aufgebenNein').click();
    await expect(anna.locator('#aufgebenfrage')).toBeHidden();
    await anna.waitForFunction((t) => window.ansicht.takt > t + 20, vorher, { timeout: 15_000 });
    const nachAbbruch = await anna.evaluate(() => {
      const a = window.ansicht;
      return {
        ende: a.ende,
        lebend: [...a.nachher.values()].filter((e) => e.b === a.ich && !e.s).length,
        gebaeude: [...a.gebaeude.values()].filter((g) => g.b === a.ich).length,
      };
    });
    expect(nachAbbruch.ende, 'kein Ende nach dem Abbruch').toBe(null);
    expect(nachAbbruch.lebend, 'die Dorfbewohner leben weiter').toBeGreaterThan(0);
    expect(nachAbbruch.gebaeude, 'das Dorfzentrum steht weiter').toBeGreaterThan(0);
    await expect(anna.locator('#aufgeben')).toBeVisible();
  });

  test('bedienung AC-38: erst der zweite Klick gibt auf', async () => {
    const { anna } = partie;
    await anna.locator('#aufgeben').click();
    await anna.locator('#aufgebenJa').click();
    await anna.waitForFunction(() => window.ansicht.ende !== null, undefined, { timeout: 15_000 });

    const ende = await anna.evaluate(() => window.ansicht.ende);
    expect(ende.grund).toBe('eroberung');
    const sieger = await anna.evaluate((id) => window.ansicht.spieler.get(id)?.name, ende.sieger);
    expect(sieger, 'der andere gewinnt').toBe('Bert');
    await expect(anna.locator('#partieende')).toHaveText('Bert hat gewonnen');
    await expect(anna.locator('#aufgebenfrage')).toBeHidden();
    // Zweimal aufgeben kann niemand: der Knopf ist weg.
    await expect(anna.locator('#aufgeben')).toBeHidden();
  });
});

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

// Zuschauen nach dem Ausscheiden (spielziel AC-7). Zu dritt, denn zu zweit
// ist mit dem Ausscheiden die Partie zu Ende - dann gibt es keinen Zuschauer,
// sondern einen Verlierer (AC-5).
test.describe('Zuschauen nach dem Ausscheiden', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuDritt(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('spielziel AC-7: Cem gibt auf, die Partie laeuft weiter, und er sieht ihr zu', async ({}, info) => {
    const { anna, bert, cem, code } = partie;
    await expect(cem.locator('#zuschauer')).toBeHidden();

    // Eine halbe Spielminute, damit im Bild eine Partie laeuft und nicht eine
    // beginnt (gelernt in Runde 79).
    await zeitraffer(anna, code, 10);
    for (const seite of [anna, bert, cem]) {
      await seite.waitForFunction(() => window.ansicht.takt >= 300, undefined, { timeout: 15_000 });
    }

    // Aufgeben wie ein Mensch: Knopf, Rueckfrage, zweiter Klick.
    await cem.locator('#aufgeben').click();
    await cem.locator('#aufgebenJa').click();
    await cem.waitForFunction(() => window.ansicht.aus, undefined, { timeout: 15_000 });

    // Die Partie ist nicht zu Ende - zwei spielen weiter.
    for (const seite of [anna, bert, cem]) {
      expect(await seite.evaluate(() => window.ansicht.ende), 'zu dritt endet die Partie nicht').toBe(null);
    }
    await expect(cem.locator('#partieende')).toBeHidden();
    await expect(cem.locator('#aufgeben')).toBeHidden();
    await expect(anna.locator('#aufgeben')).toBeVisible();

    // Er bekommt weiter Zustaende: die Uhr laeuft bei ihm wie bei Anna.
    const vorher = await cem.evaluate(() => window.ansicht.takt);
    await cem.waitForFunction((t) => window.ansicht.takt > t + 20, vorher, { timeout: 15_000 });

    // Und er sieht die Partie - nicht nur in den Daten, sondern im Bild: die
    // Kamera ist zu einem gesprungen, der noch spielt. Ohne den Sprung staende
    // er vor dem leeren Platz, wo eben sein Dorf war.
    const gesehen = await cem.evaluate(() => {
      const a = window.ansicht;
      const imBild = (e) => {
        const p = a.zuBild(e.x, e.y);
        return p.x > 0 && p.y > 0 && p.x < a.leinwand.clientWidth && p.y < a.leinwand.clientHeight;
      };
      const alle = [...a.nachher.values()];
      return {
        fremdeImBild: alle.filter((e) => e.b !== a.ich && !e.s && imBild(e)).length,
        fremdeGebaeudeImBild: [...a.gebaeude.values()].filter((g) => g.b !== a.ich && imBild(g)).length,
        eigeneLebend: alle.filter((e) => e.b === a.ich && !e.s).length,
        eigeneGebaeude: [...a.gebaeude.values()].filter((g) => g.b === a.ich).length,
      };
    });
    expect(gesehen.eigeneLebend, 'von ihm lebt nichts mehr').toBe(0);
    expect(gesehen.eigeneGebaeude, 'und es steht nichts mehr von ihm').toBe(0);
    expect(gesehen.fremdeImBild, 'fremde Einheiten im Bild').toBeGreaterThan(0);
    expect(gesehen.fremdeGebaeudeImBild, 'ein fremdes Gebaeude im Bild').toBeGreaterThan(0);

    await expect(cem.locator('#zuschauer')).toBeInViewport();
    await expect(cem.locator('#zuschauer')).toContainText('Du bist ausgeschieden');
    expect(await bedienteileFrei(cem)).toEqual([]);

    await nachweis(cem, {
      spec: SPIELZIEL,
      ac: 'AC-7',
      titel: 'Cem hat aufgegeben: über seinem Bild steht, dass er ausgeschieden ist — die Kamera zeigt ihm Annas Dorf statt den leeren Platz, wo seines stand',
      test: info,
    });
  });

  test('spielziel AC-7: bei den anderen aendert sich nichts ausser der Spielerzahl', async () => {
    const { anna, cem } = partie;
    // Anna sieht keine Zuschauermeldung und kann weiter befehlen - geprueft
    // daran, dass sie noch waehlen kann und ihre Leute leben.
    await expect(anna.locator('#zuschauer')).toBeHidden();
    const annas = await anna.evaluate(() => {
      const a = window.ansicht;
      return {
        lebend: [...a.nachher.values()].filter((e) => e.b === a.ich && !e.s).length,
        aus: a.aus,
      };
    });
    expect(annas.aus, 'Anna ist nicht ausgeschieden').toBe(false);
    expect(annas.lebend, 'Annas Leute leben').toBeGreaterThan(0);

    // Und Cem bleibt Zuschauer, solange die Partie laeuft: die Meldung geht
    // nicht nach ein paar Sekunden von selbst weg (anders als eine Absage).
    const vorher = await cem.evaluate(() => window.ansicht.takt);
    await cem.waitForFunction((t) => window.ansicht.takt > t + 40, vorher, { timeout: 15_000 });
    await expect(cem.locator('#zuschauer')).toBeVisible();
  });
});
