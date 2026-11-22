// Aufhoeren und spaeter weiterspielen (→ specs/00-plattform/speichern.md
// AC-6 bis AC-11, AC-27; S3 nach ADR-0017): ein Knopf neben Pause und
// Aufgeben sichert und schliesst, im Vorraum stehen "Deine Partien", ein Klick
// setzt fort - in einem neuen Raum, angehalten, die Kamera dort, wo man
// hinsah.
//
// Was der Server dabei tut (der Stand bleibt derselbe, der alte Code fuehrt
// nirgendwohin, zwei Sitzungen eines Stands gibt es nicht), belegt
// tests/speichern-fortsetzen.test.mjs - hier steht, was man davon sieht.
//
// Der Browserlauf sichert sonst nicht (e2e/server.mjs, Griff `staende`):
// diese Datei schaltet es fuer sich ein und am Ende wieder aus. Die Faelle
// bauen aufeinander auf - eine Partie, die aufgehoert, fortgesetzt, abgeloest
// und verdorben wird.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { ANMELDUNG, expect, fehlerSammeln, staendeSchalten, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, haeuserSetzen } from '../helpers/strategie.mjs';

const SPEICHERN = '00-plattform/speichern.md';
const WEG_MS = 2 * 60 * 1000;

async function griffStaende(playwright, werte) {
  const anfrage = await playwright.request.newContext();
  try {
    return await staendeSchalten(anfrage, werte);
  } finally {
    await anfrage.dispose();
  }
}

/** Ein angemeldetes Fenster im Vorraum - Anna, wie in jedem Browserfall. */
async function fenster(browser, info, { breite = 1400, hoehe = 950 } = {}) {
  const kontext = await browser.newContext({
    baseURL: info.project.use.baseURL, viewport: { width: breite, height: hoehe }, locale: 'de-DE', storageState: ANMELDUNG,
  });
  const seite = await kontext.newPage();
  const fehler = fehlerSammeln(seite);
  await seite.goto('/');
  await expect(seite.locator('#angemeldet')).toBeVisible();
  return { kontext, seite, fehler };
}

/** Allein gegen eine KI eroeffnet und gestartet (spielauswahl AC-18, AC-19). */
async function alleinSpielen(seite) {
  await seite.locator('[data-oeffnen="strategie"]').click();
  await seite.locator('[data-einstellung="startwert"]').fill('4711');
  await seite.locator('[data-einstellung="sicht"]').selectOption(JSON.stringify('aufgedeckt'));
  await seite.locator('[data-einstellung="ki"]').fill('1');
  await seite.locator('[data-eroeffnen="strategie"]').click();
  await expect(seite.locator('#raumcode')).toHaveText(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  const code = (await seite.locator('#raumcode').textContent()).trim();
  await haeuserSetzen(seite);
  await seite.locator('#starten').click();
  await imSpiel(seite);
  return code;
}

async function imSpiel(seite) {
  await expect(seite.locator('#brett')).toBeVisible();
  await seite.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0 && window.ansicht.gebaeude.size > 0);
}

/** Wohin die Kamera sieht: der Weltpunkt in der Mitte der Leinwand und der Zoom. */
const blick = (seite) => seite.evaluate(() => {
  const a = window.ansicht;
  const mitte = a.zuWelt(a.leinwand.clientWidth / 2, a.leinwand.clientHeight / 2);
  return { x: mitte.x, y: mitte.y, zoom: a.kamera.zoom };
});

const zeilen = (seite) => seite.locator('#partienliste li[data-partie]');

/** Der Raum hinter dem eigenen Platz - aus dem, was der Browser sich merkt. */
const meinCode = (seite) => seite.evaluate(() => JSON.parse(sessionStorage.getItem('platz') || 'null')?.code ?? null);

test.describe('Aufhoeren und spaeter weiterspielen', () => {
  test.describe.configure({ mode: 'serial' });
  let anna;
  let alterCode;
  let blickVorher;

  test.beforeAll(async ({ playwright }) => {
    await griffStaende(playwright, { an: true, leeren: true, jeKonto: 5, wegMs: WEG_MS });
  });
  test.afterAll(async ({ playwright }) => {
    if (anna) {
      expect(anna.fehler, 'Die Seite hat Fehler gemeldet').toEqual([]);
      await anna.kontext.close();
    }
    await griffStaende(playwright, { an: false, leeren: true, jeKonto: 5, wegMs: WEG_MS });
  });

  test('speichern AC-7: Spaeter weiterspielen sichert, schliesst den Raum und fuehrt in den Vorraum, wo die Partie unter Deine Partien steht', async ({ browser }, info) => {
    test.setTimeout(120_000);
    anna = await fenster(browser, info);
    const { seite } = anna;
    // Noch nichts gesichert: der Vorraum zeigt keine Liste.
    await expect(seite.locator('#partien')).toBeHidden();
    alterCode = await alleinSpielen(seite);
    await zeitraffer(seite, alterCode, 10);
    await expect(seite.locator('#spielzeit b')).toHaveText(/^0:(0[3-9]|[1-5]\d)$/, { timeout: 15_000 });
    await zeitraffer(seite, alterCode, 1);

    // Die Kamera weg vom Dorf, ein Stueck zur Kartenmitte, naeher heran -
    // so, wie man irgendwo hinsieht, wenn man aufhoert (AC-10).
    await seite.evaluate(() => {
      const a = window.ansicht;
      const basis = a.spieler.get(a.ich).basis;
      const mitte = a.karte.groesse / 2;
      a.kamera.zoom = 1.6;
      a.blickAuf(basis.x + (mitte - basis.x) * 0.4, basis.y + (mitte - basis.y) * 0.4);
    });
    blickVorher = await blick(seite);

    const knopf = seite.locator('#aufhoeren');
    await expect(knopf).toBeVisible();
    await expect(knopf).toHaveText('Später weiterspielen');
    await expect(seite.locator('#pause')).toBeVisible();
    await expect(seite.locator('#aufgeben')).toBeVisible();
    await nachweis(seite, {
      spec: SPEICHERN,
      ac: 'AC-7',
      titel: 'Allein gegen die KI: oben rechts neben Pause und Aufgeben steht Spaeter weiterspielen',
      test: info,
    });

    await knopf.click();
    await expect(seite.locator('#angemeldet')).toBeVisible({ timeout: 15_000 });
    await expect(seite.locator('#partien')).toBeVisible();
    await expect(seite.locator('#partienMeldung')).toHaveText('Gesichert. Weiter geht es hier, wann du willst.');
    await expect(zeilen(seite)).toHaveCount(1);
    const zeile = zeilen(seite).first();
    await expect(zeile.locator('.partieangaben')).toHaveText(/^Spielzeit 0:\d\d · Karte normal · Anna, KI 1 · heute \d\d:\d\d$/);
    await expect(zeile.locator('[data-fortsetzen]')).toHaveText('Fortsetzen');
    await nachweis(seite, {
      spec: SPEICHERN,
      ac: 'AC-7',
      titel: 'Nach Spaeter weiterspielen: zurueck im Vorraum, unter Deine Partien die eine Partie mit Spielzeit, Karte, Beteiligten und Uhrzeit, darueber Gesichert',
      test: info,
    });
  });

  test('speichern AC-9: Fortsetzen oeffnet einen neuen Raum mit neuem Code, angehalten bis Weiter - der alte Code fuehrt nirgendwohin', async ({ browser }, info) => {
    test.setTimeout(90_000);
    const { seite } = anna;
    await zeilen(seite).first().locator('[data-fortsetzen]').click();
    await imSpiel(seite);
    // Kein Warteraum dazwischen: gleich im Spiel, und es steht.
    await expect(seite.locator('#warteraum')).toBeHidden();
    await expect(seite.locator('#pausefeld')).toBeVisible();
    const neuerCode = await meinCode(seite);
    expect(neuerCode, 'ein neuer Raum').toMatch(/^[A-Z0-9]{6}$/);
    expect(neuerCode).not.toBe(alterCode.replace('-', ''));
    const anzeige = `${neuerCode.slice(0, 3)}-${neuerCode.slice(3)}`;
    await expect(seite.locator('#pauseWer')).toHaveText(`Die Partie ist geladen und steht. Neuer Raum: ${anzeige}.`);
    const takt = await seite.evaluate(() => window.ansicht.takt);
    await seite.waitForTimeout(1200);
    expect(await seite.evaluate(() => window.ansicht.takt), 'angehalten: kein neuer Takt').toBe(takt);
    await nachweis(seite, {
      spec: SPEICHERN,
      ac: 'AC-9',
      titel: 'Fortgesetzt: gleich im Spiel, angehalten, mitten im Bild Die Partie ist geladen und steht mit dem neuen Raumcode und Weiterspielen',
      test: info,
    });

    // Der alte Code: wer ihn tippt, findet keinen Raum.
    const gast = await browser.newContext({ baseURL: info.project.use.baseURL, viewport: { width: 1400, height: 950 }, locale: 'de-DE' });
    const bert = await gast.newPage();
    await bert.goto('/');
    await bert.locator('#name').fill('Bert');
    await bert.locator('#code').fill(alterCode);
    await bert.locator('#beitreten').click();
    await expect(bert.getByText('Diesen Raumcode gibt es nicht.')).toBeVisible();
    await gast.close();
  });

  test('speichern AC-10: fortgesetzt steht die Kamera dort, wo vor dem Aufhoeren hingesehen wurde', async ({}, info) => {
    const { seite } = anna;
    const jetzt = await blick(seite);
    expect(jetzt.zoom).toBeCloseTo(blickVorher.zoom, 5);
    expect(Math.hypot(jetzt.x - blickVorher.x, jetzt.y - blickVorher.y), 'hoechstens ein halbes Feld daneben').toBeLessThan(0.5);
    // Und nicht auf dem Dorf, wo ein frischer Aufbau hinsieht.
    const basis = await seite.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    expect(Math.hypot(jetzt.x - basis.x, jetzt.y - basis.y)).toBeGreaterThan(5);
    await nachweis(seite, {
      spec: SPEICHERN,
      ac: 'AC-10',
      titel: 'Fortgesetzt: die Kamera steht naeher herangezoomt zwischen Dorf und Kartenmitte, wie vor dem Aufhoeren, nicht auf dem Dorfzentrum',
      test: info,
    });
    await seite.locator('#pauseWeiter').click();
    await expect(seite.locator('#pausefeld')).toBeHidden();
  });

  test('speichern AC-11: wird derselbe Stand an anderer Stelle fortgesetzt, ist die erste Sitzung beendet und sagt das', async ({ browser }, info) => {
    test.setTimeout(90_000);
    const erstes = anna;
    const zweites = await fenster(browser, info);
    await expect(zeilen(zweites.seite)).toHaveCount(1);
    await zeilen(zweites.seite).first().locator('[data-fortsetzen]').click();
    await imSpiel(zweites.seite);
    await expect(zweites.seite.locator('#pausefeld')).toBeVisible();

    const hinweis = erstes.seite.locator('#spielhinweis');
    await expect(hinweis).toBeVisible();
    await expect(erstes.seite.locator('#spielhinweisText')).toHaveText('Diese Partie wurde an anderer Stelle fortgesetzt. Hier ist sie beendet, gesichert ist sie.');
    await expect(erstes.seite.locator('#spielhinweisZu')).toHaveText('Zurück in den Vorraum');
    await expect(erstes.seite.locator('#aufhoeren')).toBeHidden();
    await expect(erstes.seite.locator('#pause')).toBeHidden();
    await expect(erstes.seite.locator('#aufgeben')).toBeHidden();
    // Hier geht nichts mehr: kein neuer Takt.
    const takt = await erstes.seite.evaluate(() => window.ansicht.takt);
    await erstes.seite.waitForTimeout(800);
    expect(await erstes.seite.evaluate(() => window.ansicht.takt)).toBe(takt);
    await nachweis(erstes.seite, {
      spec: SPEICHERN,
      ac: 'AC-11',
      titel: 'Das erste Fenster, nachdem dieselbe Partie in einem zweiten fortgesetzt wurde: oben rechts steht, dass sie hier beendet und gesichert ist, mit Zurueck in den Vorraum',
      test: info,
    });

    await erstes.seite.locator('#spielhinweisZu').click();
    await expect(erstes.seite.locator('#angemeldet')).toBeVisible({ timeout: 15_000 });
    expect(erstes.fehler, 'Die Seite hat Fehler gemeldet').toEqual([]);
    await erstes.kontext.close();
    anna = zweites;
  });

  test('speichern AC-6: ist der neueste Stand kaputt, geht es mit dem davor weiter, und das Spiel sagt es', async ({ playwright }, info) => {
    test.setTimeout(120_000);
    const { seite } = anna;
    // Weiter, ein paar Sekunden gespielt, wieder aufgehoert: jetzt gibt es
    // einen neuesten und einen vorigen Stand.
    await seite.locator('#pauseWeiter').click();
    await expect(seite.locator('#pausefeld')).toBeHidden();
    await zeitraffer(seite, await meinCode(seite), 10);
    await seite.waitForTimeout(1500);
    await seite.locator('#aufhoeren').click();
    await expect(seite.locator('#angemeldet')).toBeVisible({ timeout: 15_000 });
    await expect(zeilen(seite)).toHaveCount(1);

    await griffStaende(playwright, { kaputt: true });
    await zeilen(seite).first().locator('[data-fortsetzen]').click();
    await imSpiel(seite);
    await expect(seite.locator('#spielhinweis')).toBeVisible();
    await expect(seite.locator('#spielhinweisText')).toHaveText(/^Der letzte Stand ließ sich nicht laden \(.+\)\. Weiter geht es mit dem davor\.$/);
    await expect(seite.locator('#pausefeld')).toBeVisible();
    await nachweis(seite, {
      spec: SPEICHERN,
      ac: 'AC-6',
      titel: 'Der neueste Stand war kaputt: fortgesetzt mit dem davor, oben rechts steht Der letzte Stand liess sich nicht laden, weiter mit dem davor',
      test: info,
    });
    await seite.locator('#spielhinweisZu').click();
    await expect(seite.locator('#spielhinweis')).toBeHidden();
  });

  test('speichern AC-8: wer das Fenster schliesst, verliert nichts - nach der Frist ist gesichert, der Raum zu, und die Partie steht im Vorraum', async ({ browser, playwright }, info) => {
    test.setTimeout(90_000);
    const code = await meinCode(anna.seite);
    // Im Menue steht es, bevor man geht.
    await anna.seite.locator('#menue').click();
    await expect(anna.seite.locator('#menueVorraumHinweis')).toContainText('Nach zwei Minuten wird sie gesichert und geschlossen');
    await anna.seite.keyboard.press('Escape');
    expect(anna.fehler, 'Die Seite hat Fehler gemeldet').toEqual([]);
    await anna.kontext.close();
    anna = null;

    // Die zwei Minuten verkuerzt, dann einmal aufgeraeumt - sonst alle 15 s.
    await griffStaende(playwright, { wegMs: 300 });
    await new Promise((fertig) => setTimeout(fertig, 600));
    await griffStaende(playwright, { aufraeumen: true });
    await griffStaende(playwright, { wegMs: WEG_MS });

    anna = await fenster(browser, info);
    const { seite } = anna;
    await expect(seite.locator('#partien')).toBeVisible();
    await expect(zeilen(seite)).toHaveCount(1);
    // Der Raum ist zu: sein Code fuehrt nirgendwohin.
    await seite.locator('#name').fill('Bert');
    await seite.locator('#code').fill(`${code.slice(0, 3)}-${code.slice(3)}`);
    await seite.locator('#beitreten').click();
    await expect(seite.getByText('Diesen Raumcode gibt es nicht.')).toBeVisible();
    await nachweis(seite, {
      spec: SPEICHERN,
      ac: 'AC-8',
      titel: 'Nach dem Schliessen des Fensters und der Frist: der Raum ist zu, sein Code fuehrt nirgendwohin, die Partie steht unter Deine Partien zum Fortsetzen',
      test: info,
    });
  });

  test('speichern AC-27: liegen fuenf Staende am Konto, sagt es der Vorraum und die neue Partie, dass sie nicht gesichert wird', async ({ browser, playwright }, info) => {
    test.setTimeout(120_000);
    await anna.kontext.close();
    expect(await griffStaende(playwright, { auffuellen: 5 })).toBe(5);
    // Auf dem kleinsten Bildschirm, auf dem gespielt wird (spielauswahl
    // AC-23): fuenf Zeilen, und nichts rollt.
    anna = await fenster(browser, info, { breite: 1366, hoehe: 768 });
    const { seite } = anna;
    await expect(zeilen(seite)).toHaveCount(5);
    await expect(seite.locator('#partienVoll')).toHaveText('Alle 5 Plätze belegt — eine neue Partie wird erst gesichert, wenn du eine löschst.');
    const ueber = await seite.evaluate(() => ({
      hoch: Math.max(0, document.scrollingElement.scrollHeight - window.innerHeight),
      breit: Math.max(0, document.scrollingElement.scrollWidth - window.innerWidth),
    }));
    expect(ueber, 'der Vorraum passt auf 1366 x 768 - Bildpunkte zu viel').toEqual({ hoch: 0, breit: 0 });
    await nachweis(seite, {
      spec: SPEICHERN,
      ac: 'AC-27',
      titel: 'Vorraum auf 1366 x 768 mit fuenf Partien: darunter Alle 5 Plaetze belegt, eine neue Partie wird erst gesichert, wenn du eine loeschst',
      test: info,
    });

    await alleinSpielen(seite);
    await expect(seite.locator('#spielhinweis')).toBeVisible();
    await expect(seite.locator('#spielhinweisText')).toHaveText(/^Diese Partie wird nicht gesichert: an deinem Konto liegen schon 5 Spielstände\./);
    await expect(seite.locator('#aufhoeren')).toBeHidden();
    await expect(seite.locator('#aufgeben')).toBeVisible();
    // Der Hinweis liegt auf keinem Bedienteil und ragt nicht aus dem Fenster.
    expect(await bedienteileFrei(seite)).toEqual([]);
    await nachweis(seite, {
      spec: SPEICHERN,
      ac: 'AC-27',
      titel: 'Neue Partie bei fuenf Staenden: oben rechts steht, dass sie nicht gesichert wird, und Spaeter weiterspielen fehlt',
      test: info,
    });
    expect(await griffStaende(playwright, {}), 'kein sechster Stand').toBe(5);
  });
});
