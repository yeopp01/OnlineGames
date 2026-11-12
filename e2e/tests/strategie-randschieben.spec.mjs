// Schieben am Bildschirmrand (→ specs/10-strategie/bedienung.md AC-9): steht
// die Maus in den aeussersten Bildpunkten des Spielbilds, laeuft die Karte in
// diese Richtung - oben auch unter der Kopfzeile mit den Rohstoffen. Keine
// Leiste reicht bis an den Rand (Gegenprobe mit der Maus nur ueber dem Fenster
// statt der Leinwand: gruen). In der Tastenuebersicht abschaltbar, die Wahl merkt
// sich der Browser. Die Kamera rechnet nur der Browser; die Zeit des Spiels
// spielt keine Rolle.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Schieben am Bildschirmrand', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  const kamera = (page) => page.evaluate(() => ({ x: window.ansicht.kamera.x, y: window.ansicht.kamera.y }));
  // Die Kamera mitten auf die Karte, damit keine Richtung am Kartenrand endet.
  const mitteDerKarte = (page) => page.evaluate(() => {
    const a = window.ansicht;
    a.blickAuf(a.karte.groesse / 2, a.karte.groesse / 2);
  });
  // Eine Bewegung nach mindestens 60 Bildpunkten: bei 600 je Sekunde und Zoom
  // 1 ist das ein Zehntel Sekunde, ein Zittern der Messung ist es nicht.
  const WEIT = 60;

  test('bedienung AC-9: die Maus am Rand schiebt die Karte in diese Richtung, in der Mitte steht sie', async ({}, info) => {
    const { anna } = partie;
    const { width: b, height: h } = anna.viewportSize();
    const richtungen = [
      { name: 'rechts', x: b - 3, y: h / 2, achse: 'x', zeichen: 1 },
      { name: 'links', x: 2, y: h / 2, achse: 'x', zeichen: -1 },
      // Oben unter der Kopfzeile, die keine Maus annimmt.
      { name: 'oben', x: b / 2, y: 2, achse: 'y', zeichen: -1 },
      { name: 'unten', x: b / 2, y: h - 3, achse: 'y', zeichen: 1 },
    ];
    for (const r of richtungen) {
      await anna.mouse.move(b / 2, h / 2);
      await mitteDerKarte(anna);
      const vorher = await kamera(anna);
      await anna.mouse.move(r.x, r.y);
      await expect.poll(async () => r.zeichen * ((await kamera(anna))[r.achse] - vorher[r.achse]), { message: r.name })
        .toBeGreaterThan(WEIT);
      // Die andere Achse bleibt, wo sie war: nur die eine Richtung.
      const andere = r.achse === 'x' ? 'y' : 'x';
      expect((await kamera(anna))[andere], `${r.name}: die andere Achse`).toBe(vorher[andere]);
    }
    // Zurueck in die Mitte: die Karte steht.
    await anna.mouse.move(b / 2, h / 2);
    const steht = await kamera(anna);
    await anna.waitForTimeout(400);
    expect(await kamera(anna)).toEqual(steht);
    // Knapp innerhalb des Randes (20 Bildpunkte) schiebt es noch nicht.
    await anna.mouse.move(20, h / 2);
    await anna.waitForTimeout(400);
    expect(await kamera(anna)).toEqual(steht);
  });

  test('bedienung AC-9: in der Tastenuebersicht abschaltbar, dann steht die Karte auch am Rand - der Browser merkt es sich', async ({}, info) => {
    const { anna } = partie;
    const { width: b, height: h } = anna.viewportSize();
    await anna.mouse.move(b / 2, h / 2);
    // Fuer das Bild das eigene Dorf hinter der Uebersicht, nicht der Nebel.
    await anna.evaluate(() => {
      const a = window.ansicht;
      const basis = a.spieler.get(a.ich).basis;
      a.blickAuf(basis.x, basis.y);
    });
    await anna.keyboard.press('?');
    const schalter = anna.locator('#rand-schieben');
    await expect(schalter).toBeChecked();
    await schalter.uncheck();
    // Der Klick auf den Schalter laesst die Uebersicht offen.
    await expect(anna.locator('#tastenuebersicht')).toBeVisible();
    await expect(schalter).not.toBeChecked();
    expect(await anna.evaluate(() => localStorage.getItem('randSchieben'))).toBe('aus');
    // Was eine neue Ansicht - nach dem Neuladen - liest: aus. Gefragt wird
    // dieselbe Funktion, die der Konstruktor ruft, aus demselben Modul.
    const neuGelesen = () => anna.evaluate(async () => (await import('/ansicht.js')).randSchiebenGemerkt());
    expect(await neuGelesen(), 'nach dem Neuladen aus').toBe(false);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-9',
      titel: 'Tastenuebersicht mit dem Schalter Karte am Bildschirmrand schieben, hier abgeschaltet',
      test: info,
    });
    await anna.keyboard.press('Escape');
    await expect(anna.locator('#tastenuebersicht')).toBeHidden();

    // Abgeschaltet: am Rand steht die Karte.
    await mitteDerKarte(anna);
    const vorher = await kamera(anna);
    await anna.mouse.move(b - 3, h / 2);
    await anna.waitForTimeout(400);
    expect(await kamera(anna), 'abgeschaltet am rechten Rand').toEqual(vorher);

    // Wieder an: sie laeuft wieder.
    await anna.keyboard.press('?');
    await schalter.check();
    await anna.keyboard.press('Escape');
    await anna.mouse.move(b / 2, h / 2);
    const davor = await kamera(anna);
    await anna.mouse.move(b - 3, h / 2);
    await expect.poll(async () => (await kamera(anna)).x - davor.x).toBeGreaterThan(WEIT);
    expect(await anna.evaluate(() => localStorage.getItem('randSchieben'))).toBe('an');
    expect(await neuGelesen(), 'nach dem Neuladen an').toBe(true);
    await anna.mouse.move(b / 2, h / 2);
  });
});
