// Wer kaempft, holt aus (→ specs/10-strategie/bedienung.md AC-39).
//
// Eine Miliz von Anna und eine von Bert stehen sich gegenueber und schlagen
// aufeinander ein. Zwei Augenblicke desselben Gefechts unterscheiden sich in
// den Bildpunkten der Figuren - vorher standen sie reglos (Rueckschau zur
// Stufe C).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test } from '../helpers/seite.mjs';
import { figurenFrei, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Kampf im Bild', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-39: wer kaempft, holt aus - zwei Augenblicke desselben Gefechts sehen verschieden aus', async ({}, info) => {
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const ort = { x: basis.x + 2, y: basis.y + 9 };
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { ...ort, art: 'miliz' })).toBe(1);
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { x: ort.x + 2, y: ort.y, art: 'miliz' })).toBe(1);
    // Beide wachen (kampf AC-2) und schlagen aufeinander ein: der Server
    // markiert sie als kaempfend.
    const kuerzel = await anna.evaluate(() => window.ansicht.werte.einheiten.miliz.kuerzel);
    await anna.waitForFunction((k) => {
      const a = window.ansicht;
      const milizen = [...a.nachher.values()].filter((e) => e.k === k && !e.s);
      return milizen.length >= 2 && milizen.filter((e) => e.w).length >= 2;
    }, kuerzel, { timeout: 20_000 });
    const mitte = await anna.evaluate((k) => {
      const a = window.ansicht;
      const milizen = [...a.nachher.values()].filter((e) => e.k === k && e.w && !e.s);
      const x = milizen.reduce((s, e) => s + e.x, 0) / milizen.length;
      const y = milizen.reduce((s, e) => s + e.y, 0) / milizen.length;
      a.kamera.zoom = 2.2;
      a.blickAuf(x, y);
      return { x, y };
    }, kuerzel);
    await anna.waitForTimeout(300);
    expect(await figurenFrei(anna)).toEqual([]);

    // Die Bildpunkte um die beiden, jetzt und eine halbe Schwingung des
    // Ausholens spaeter (`jetztPhase`: 110 ms je Bogenmass, eine Schwingung
    // also 691 ms).
    const ausschnitt = () => anna.evaluate((o) => {
      const a = window.ansicht;
      const p = a.zuBild(o.x, o.y);
      const d = window.devicePixelRatio || 1;
      const breite = Math.round(160 * d);
      const hoehe = Math.round(140 * d);
      const daten = a.stift.getImageData(Math.round((p.x - 80) * d), Math.round((p.y - 110) * d), breite, hoehe).data;
      // Ein kleiner Fingerabdruck: Helligkeit je Bildpunkt.
      const hell = new Uint8Array(breite * hoehe);
      for (let i = 0; i < hell.length; i++) hell[i] = (daten[i * 4] + daten[i * 4 + 1] + daten[i * 4 + 2]) / 3;
      return { t: performance.now(), hell: Array.from(hell) };
    }, mitte);
    const erst = await ausschnitt();
    const erstes = erst.hell;
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-39',
      titel: 'Annas Miliz (blau) und Berts Miliz (rot) im Kampf, ein Augenblick',
      test: info,
    });
    // Gewartet wird auf die Uhr des Browsers, nicht 345 ms ab hier: der
    // Bildnachweis dazwischen dauert selbst ein paar hundert Millisekunden,
    // und kam der Abstand so auf eine ganze Schwingung, standen beide wieder
    // gleich - 0 % geaendert, in einem von fuenf Laeufen (Rueckschau nach
    // Runde 168). Deshalb: die naechste halbe Schwingung nach dem ersten
    // Ausschnitt, die noch vor uns liegt.
    await anna.evaluate(async (t) => {
      const schwingung = 2 * Math.PI * 110;
      let ziel = t + schwingung / 2;
      while (ziel < performance.now() + 30) ziel += schwingung;
      await new Promise((fertig) => setTimeout(fertig, ziel - performance.now()));
    }, erst.t);
    const zweites = (await ausschnitt()).hell;
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-39',
      titel: 'Dieselben zwei im nächsten Augenblick: beide Figuren stehen anders als im ersten Bild',
      test: info,
    });
    let anders = 0;
    for (let i = 0; i < erstes.length; i++) if (Math.abs(erstes[i] - zweites[i]) > 24) anders++;
    // Gemessen in Runde 118: mit dem Ausholen aendern sich 5,6 bis 9,9 % des
    // Ausschnitts (drei Laeufe), ohne (Gegenprobe) genau 0 - beide stehen dann
    // still. Ein Prozent ist die Grenze: darunter waere es Rauschen, keine
    // Bewegung.
    expect(anders / erstes.length, 'Anteil geaenderter Bildpunkte').toBeGreaterThan(0.01);
  });
});
