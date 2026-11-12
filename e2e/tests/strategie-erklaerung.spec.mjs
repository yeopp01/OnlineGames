// Die erste Partie erklaert sich (→ specs/10-strategie/bedienung.md AC-21):
// beim ersten Start drei Saetze - ziehen, rechtsklicken, sammeln -, links
// unter der Leiste, bis "Verstanden" sie wegklickt. Danach nicht wieder.
//
// Jeder andere Browserfall gilt als "schon gesehen" (e2e/helpers/seite.mjs).
// Dieser nimmt den Merker im Warteraum weg und setzt `erklaerungPruefen` im
// Sitzungsspeicher - der ueberlebt das Neuladen, und so zeigt sich auch, was
// der Browser sich gemerkt hat.
//
// Auf 1366 x 768, dem kleinsten Bildschirm, fuer den das Spielbild gebaut ist
// (bedienung AC-23).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test } from '../helpers/seite.mjs';
import { bedienteileFrei, dorfbewohnerAnklicken, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

const frisch = ({ seiten }) => Promise.all(seiten.map((s) => s.evaluate(() => {
  sessionStorage.setItem('erklaerungPruefen', '1');
  localStorage.removeItem('erklaerungGesehen');
})));

test('bedienung AC-21: beim ersten Start erklaeren drei Saetze Ziehen, Rechtsklick und Sammeln - nach Verstanden kommen sie nicht wieder', async ({ browser }, info) => {
  const partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt', breite: 1366, hoehe: 768, vorDemStart: frisch });
  try {
    const { anna, bert } = partie;
    for (const seite of [anna, bert]) {
      const kasten = seite.locator('#erklaerung');
      await expect(kasten).toBeInViewport({ ratio: 1 });
      await expect(kasten.locator('li')).toHaveCount(3);
      await expect(kasten).toContainText('Ziehen');
      await expect(kasten).toContainText('Rechtsklick');
      await expect(kasten).toContainText('sammeln');
      await expect(kasten.locator('#erklaerungZu')).toBeInViewport({ ratio: 1 });
    }
    // Nicht auf der Mitte, wo das eigene Dorf steht (bedienung AC-41) - und
    // im breitesten Zustand, mit dem Baumenue eines Dorfbewohners, auf keinem
    // anderen Bedienteil.
    const r = await anna.locator('#erklaerung').boundingBox();
    expect(r.x + r.width, 'links der Mitte').toBeLessThan(1366 / 2);
    await dorfbewohnerAnklicken(anna);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-21',
      titel: 'Beim ersten Start links oben drei Saetze - ziehen, rechtsklicken, sammeln - und der Knopf Verstanden',
      test: info,
    });

    // Anna klickt weg; Bert nicht.
    await anna.locator('#erklaerungZu').click();
    await expect(anna.locator('#erklaerung')).toBeHidden();
    await expect(bert.locator('#erklaerung')).toBeVisible();

    // Beide laden neu und kehren auf ihren Platz zurueck: Anna sieht sie
    // nicht wieder, Bert schon - er hat sie nie weggeklickt.
    for (const seite of [anna, bert]) {
      await seite.reload();
      await seite.waitForFunction(() => window.ansicht?.nachher?.size > 0, null, { timeout: 15_000 });
      await expect(seite.locator('#spiel')).toBeVisible();
    }
    await expect(anna.locator('#erklaerung')).toBeHidden();
    await expect(bert.locator('#erklaerung')).toBeVisible();
  } finally {
    await partieBeenden(partie);
  }
});
