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

  // Playwright bewegt die Maus nicht aus dem Fenster. Geschickt wird deshalb
  // das Ereignis, das der Browser beim Verlassen schickt - `mouseleave` am
  // Dokument ohne Ziel -, mit der Stelle, die er dabei meldet. Mit einer
  // echten Maus am Fensterrand ist es nicht geprueft.
  test('bedienung AC-56: geht die Maus ueber den Rand aus dem Fenster, schiebt die Karte weiter - bis sie zurueckkommt', async () => {
    const { anna } = partie;
    const { width: b, height: h } = anna.viewportSize();
    const hinaus = (x, y) => anna.evaluate(([cx, cy]) => {
      document.documentElement.dispatchEvent(new MouseEvent('mouseleave', { clientX: cx, clientY: cy, relatedTarget: null }));
    }, [x, y]);
    const herein = () => anna.evaluate(() => {
      document.documentElement.dispatchEvent(new MouseEvent('mouseenter', { clientX: 300, clientY: 300 }));
    });
    const faelle = [
      // Oben hinaus: der Browser meldet eine Stelle ueber dem Fenster ...
      { name: 'oben', x: b / 2, y: -8, achse: 'y', zeichen: -1 },
      // ... oder, bei schneller Bewegung, die letzte davor im Fenster.
      { name: 'unten, zuletzt im Fenster gemeldet', x: b / 2, y: h - 30, achse: 'y', zeichen: 1 },
      { name: 'rechts', x: b + 5, y: h / 2, achse: 'x', zeichen: 1 },
      { name: 'links', x: -3, y: h / 2, achse: 'x', zeichen: -1 },
    ];
    for (const f of faelle) {
      await anna.mouse.move(b / 2, h / 2);
      await mitteDerKarte(anna);
      const vorher = await kamera(anna);
      await hinaus(f.x, f.y);
      await expect.poll(async () => f.zeichen * ((await kamera(anna))[f.achse] - vorher[f.achse]), { message: f.name })
        .toBeGreaterThan(WEIT);
      const andere = f.achse === 'x' ? 'y' : 'x';
      expect((await kamera(anna))[andere], `${f.name}: die andere Achse`).toBe(vorher[andere]);
      // Zurueck im Fenster: die Karte steht.
      await herein();
      const steht = await kamera(anna);
      await anna.waitForTimeout(300);
      expect(await kamera(anna), `${f.name}: nach der Rueckkehr`).toEqual(steht);
    }

    // Verliert das Fenster den Fokus, steht sie auch.
    await mitteDerKarte(anna);
    await hinaus(b / 2, -8);
    const laeuft = await kamera(anna);
    await expect.poll(async () => laeuft.y - (await kamera(anna)).y).toBeGreaterThan(WEIT);
    await anna.evaluate(() => window.dispatchEvent(new Event('blur')));
    const steht = await kamera(anna);
    await anna.waitForTimeout(300);
    expect(await kamera(anna), 'ohne Fokus').toEqual(steht);

    // Auf eine Leiste im Fenster gegangen (das Ereignis hat dann ein Ziel): nichts.
    await mitteDerKarte(anna);
    const davor = await kamera(anna);
    await anna.evaluate(() => {
      document.documentElement.dispatchEvent(new MouseEvent('mouseleave', { clientX: 400, clientY: 2, relatedTarget: document.body }));
    });
    await anna.waitForTimeout(300);
    expect(await kamera(anna), 'kein Schieben ohne Verlassen').toEqual(davor);

    // Abgeschaltet schiebt auch das nicht.
    await anna.evaluate(() => window.ansicht.randSchiebenSetzen(false));
    await hinaus(b / 2, -8);
    await anna.waitForTimeout(300);
    expect(await kamera(anna), 'abgeschaltet').toEqual(davor);
    await herein();
    await anna.evaluate(() => window.ansicht.randSchiebenSetzen(true));
  });

  // Gefunden an einem Bildnachweis, auf dem nur noch Schwarz stand: wird das
  // Fenster kleiner und die Maus steht im alten Bereich, meldet der Browser
  // dasselbe `mouseleave` wie beim Gang ueber den Rand - und die Karte lief
  // davon, bis die Maus sich wieder ruehrte.
  test('bedienung AC-56: wird das Fenster kleiner und die Maus steht im alten Bereich, bleibt die Karte stehen', async () => {
    const { anna } = partie;
    const { width: b, height: h } = anna.viewportSize();
    await mitteDerKarte(anna);
    await anna.mouse.move(b - 150, h - 150);
    await anna.evaluate(() => {
      window.verlassen = 0;
      document.documentElement.addEventListener('mouseleave', (e) => { if (!e.relatedTarget) window.verlassen += 1; });
    });
    const vorher = await kamera(anna);
    await anna.setViewportSize({ width: b - 400, height: h - 400 });
    await anna.waitForTimeout(700);
    // Die Probe taugt nur, wenn der Browser das Verlassen wirklich meldet.
    expect(await anna.evaluate(() => window.verlassen), 'der Browser meldet das Verlassen').toBeGreaterThan(0);
    expect(await kamera(anna), 'die Karte steht').toEqual(vorher);
    expect(await anna.evaluate(() => window.ansicht.randZeiger?.draussen ?? false)).toBe(false);
    await anna.setViewportSize({ width: b, height: h });
    await anna.mouse.move(b / 2, h / 2);
    // Und danach schiebt der Gang ueber den Rand wieder.
    await anna.waitForTimeout(600);
    await mitteDerKarte(anna);
    const davor = await kamera(anna);
    await anna.evaluate(([cx]) => {
      document.documentElement.dispatchEvent(new MouseEvent('mouseleave', { clientX: cx, clientY: -8, relatedTarget: null }));
    }, [b / 2]);
    await expect.poll(async () => davor.y - (await kamera(anna)).y).toBeGreaterThan(WEIT);
    await anna.evaluate(() => {
      document.documentElement.dispatchEvent(new MouseEvent('mouseenter', { clientX: 300, clientY: 300 }));
    });
  });
});
