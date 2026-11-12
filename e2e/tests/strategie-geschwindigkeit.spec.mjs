// Die Spielgeschwindigkeit im Bild (→ specs/10-strategie/spielziel.md
// AC-23): Anna eröffnet mit „1,5", Bert sieht es im Warteraum, und im Spiel
// zählt die Uhr oben anderthalb Spielsekunden je echte Sekunde. Die Uhr des
// Raums prüfen tests/raeume-spiel.test.mjs (gestellte Uhr) und
// tests/strategie-geschwindigkeit.test.mjs (echte Uhr über das Netz); hier geht es um
// den Weg vom Formular bis ins Bild.
//
// Kein Zeitraffer: geprüft wird die Zeit selbst, also mit echter Uhr.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const SPIELZIEL = '10-strategie/spielziel.md';

/** Die Spielzeit, die oben steht, in Sekunden. */
async function abgelesen(page) {
  const text = (await page.locator('#spielzeit b').textContent()).trim();
  const [minuten, sekunden] = text.split(':').map(Number);
  return minuten * 60 + sekunden;
}

test('spielziel AC-23: mit 1,5 eröffnet, steht die Geschwindigkeit im Warteraum, und die Uhr zählt anderthalb Spielsekunden je echte Sekunde', async ({ browser }, info) => {
  test.setTimeout(90_000);
  const partie = await partieZuZweit(browser, info, {
    geschwindigkeit: 1.5,
    sicht: 'aufgedeckt',
    vorDemStart: async ({ bert }) => {
      const wert = bert.locator('#warteraum dd[data-wert="tempo"]');
      await expect(wert).toHaveText('1,5');
      await expect(wert).toBeInViewport();
      await nachweis(bert, {
        spec: SPIELZIEL,
        ac: 'AC-23',
        titel: 'Bert im Warteraum: Anna hat mit Spielgeschwindigkeit 1,5 eröffnet',
        test: info,
      });
    },
  });
  try {
    const { anna, bert } = partie;
    for (const seite of [anna, bert]) {
      expect(await seite.evaluate(() => window.ansicht.tempo), 'die Geschwindigkeit kam mit dem Aufbau').toBe(1.5);
      // Die Bewegung zwischen zwei Zuständen wird auf einen Takt in echter
      // Zeit gestreckt: 1000 / 15 ms statt 100 ms.
      expect(await seite.evaluate(() => window.ansicht.taktdauer)).toBeCloseTo(1000 / 15, 5);
      expect(await seite.evaluate(() => window.ansicht.takteProSekunde), 'die Uhr zählt Spielsekunden').toBe(10);
    }

    // Sechs echte Sekunden: neun Spielsekunden. Abgelesen wird in ganzen
    // Sekunden, an beiden Enden bis zu einer zu wenig, dazu die Ankunft der
    // Zustände - daher anderthalb Sekunden Spielraum. Bei 1,0 wären es sechs,
    // drei weniger: der Spielraum trennt die beiden sicher.
    const vorher = { uhr: await abgelesen(anna), zeit: Date.now() };
    await anna.waitForTimeout(6000);
    const nachher = { uhr: await abgelesen(anna), zeit: Date.now() };
    const echt = (nachher.zeit - vorher.zeit) / 1000;
    const gezaehlt = nachher.uhr - vorher.uhr;
    expect(Math.abs(gezaehlt - echt * 1.5), `${gezaehlt} Spielsekunden in ${echt.toFixed(2)} echten`).toBeLessThanOrEqual(1.5);
  } finally {
    await partieBeenden(partie);
  }
});
