// Die Spielzeit im Bild (→ specs/10-strategie/bedienung.md AC-37).
//
// Oben neben dem Zeitalter steht, wie lange die Partie laeuft. Gezaehlt werden
// die **Takte des Servers**, nicht die Uhr des Browsers: im Zeitraffer laeuft
// die Anzeige entsprechend schneller, und wer nach einem Abbruch zurueckkommt,
// sieht die richtige Zeit statt null.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

/** Die angezeigte Spielzeit in Sekunden, aus dem Text der Leiste gelesen. */
async function abgelesen(page) {
  const text = (await page.locator('#spielzeit b').textContent()).trim();
  expect(text, 'Spielzeit als m:ss').toMatch(/^\d+:[0-5]\d$/);
  const [minuten, sekunden] = text.split(':').map(Number);
  return minuten * 60 + sekunden;
}

test.describe('Spielzeit', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-37: die Leiste zeigt m:ss und rechnet aus den Takten des Servers', async () => {
    const { anna } = partie;
    // Die Anzeige ist genau das, was der Takt des Servers hergibt - nicht
    // ungefaehr. Beides in einem Griff gelesen, damit kein Takt dazwischen
    // liegt.
    const gelesen = await anna.evaluate(() => ({
      text: document.querySelector('#spielzeit b').textContent.trim(),
      takt: window.ansicht.takt,
      proSekunde: window.ansicht.takteProSekunde,
    }));
    expect(gelesen.proSekunde, 'Takte je Sekunde kommen aus dem Aufbau').toBe(10);
    expect(gelesen.takt, 'der Takt des Servers laeuft').toBeGreaterThan(0);
    const sekunden = Math.floor(gelesen.takt / gelesen.proSekunde);
    expect(gelesen.text).toBe(`${Math.floor(sekunden / 60)}:${String(sekunden % 60).padStart(2, '0')}`);
  });

  test('bedienung AC-37: die Minute wird aufgefuellt und laeuft ueber sechzig hinaus', async () => {
    const { anna } = partie;
    // Reine Formatierung, deshalb direkt an der Rechenstelle geprueft: der
    // Sprung von 9:59 auf 10:00 ist die Stelle, an der ein fehlendes
    // padStart auffaellt, und 90:00 die, an der eine Stunde daraus wuerde -
    // eine Partie endet nach 90 Spielminuten unentschieden, und "1:30:00"
    // macht die Frage "wie lange noch" schwerer als "90:00".
    const proben = await anna.evaluate(() => {
      const a = window.ansicht;
      const vorher = a.takt;
      const probe = (sekunden) => { a.takt = sekunden * a.takteProSekunde; return a.spielzeit(); };
      const ergebnis = [0, 9, 59, 60, 599, 600, 5400].map((s) => [s, probe(s)]);
      a.takt = vorher;
      return ergebnis;
    });
    expect(Object.fromEntries(proben)).toEqual({
      0: '0:00', 9: '0:09', 59: '0:59', 60: '1:00', 599: '9:59', 600: '10:00', 5400: '90:00',
    });
  });

  test('bedienung AC-37: im Zeitraffer laeuft die Uhr schneller als die des Browsers', async ({}, info) => {
    const { anna, code } = partie;
    // Die Gegenprobe zu "zaehlt die Takte des Servers": erst im gewoehnlichen
    // Lauf messen, dann im Zehnfachen. Laege die Uhr am Browser, waeren beide
    // Messungen gleich.
    const gewoehnlich = await anna.evaluate(async () => {
      const vorher = window.ansicht.takt;
      await new Promise((fertig) => setTimeout(fertig, 2000));
      return window.ansicht.takt - vorher;
    });
    await zeitraffer(anna, code, 10);
    const vorher = await abgelesen(anna);
    const gerafft = await anna.evaluate(async () => {
      const davor = window.ansicht.takt;
      await new Promise((fertig) => setTimeout(fertig, 2000));
      return window.ansicht.takt - davor;
    });
    // In zwei Sekunden Wanduhr: gewoehnlich rund 20 Takte, im Zehnfachen rund
    // 200. Die Grenzen sind weit gesetzt, weil ein Browserlauf unter Last
    // stockt - gemessen in Runde 77: 19 gegen 180.
    expect(gewoehnlich, 'Takte ohne Raffer').toBeGreaterThan(10);
    expect(gewoehnlich, 'Takte ohne Raffer').toBeLessThan(40);
    expect(gerafft, `Takte im Zehnfachen gegen ${gewoehnlich} ohne`).toBeGreaterThan(gewoehnlich * 4);
    // Und die Anzeige ist mitgelaufen, nicht nur der Takt.
    const nachher = await abgelesen(anna);
    expect(nachher - vorher, 'angezeigte Sekunden im Zehnfachen').toBeGreaterThanOrEqual(10);
    await zeitraffer(anna, code, 1);
    await expect(anna.locator('#spielzeit')).toBeInViewport();
    await expect(anna.locator('#zeitalter')).toBeInViewport();
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-37',
      titel: 'Oben in der Leiste, rechts neben „Dunkle Zeit": die verstrichene Spielzeit als m:ss mit Zifferblatt',
      test: info,
    });
  });
});
