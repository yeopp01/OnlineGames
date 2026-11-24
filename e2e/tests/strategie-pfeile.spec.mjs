// Pfeile fliegen sichtbar (→ specs/10-strategie/bedienung.md AC-40).
//
// Annas Bogenschuetze schiesst auf Berts Haus. Ein Pfeil fliegt nur
// Zehntelsekunden; der Test misst einen, der gerade unterwegs ist, haelt ihn
// fuer das Bild auf halbem Weg fest und laesst ihn danach ankommen.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test } from '../helpers/seite.mjs';
import { gebaeudeInDerNaehe, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';
const DARSTELLUNG = '10-strategie/darstellung.md';

test.describe('Pfeile', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-40: ein Schuss fliegt als Pfeil vom Bogenschuetzen zum Ziel', async ({}, info) => {
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const ort = { x: basis.x + 1, y: basis.y + 10 };
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { ...ort, art: 'bogenschuetze' })).toBe(1);
    // Ein Haus als Ziel, nicht eine Miliz: die lief im vollen Browserlauf auf
    // den Schuetzen zu, und alle Schuesse wurden zu kurz, um sie im Flug zu
    // erwischen (Runde 119). Ein Haus bleibt stehen.
    const hausId = await gebaeudeInDerNaehe(anna, code, 'Bert', 'haus', ort, { von: 5, bis: 9 });
    await anna.waitForFunction((id) => window.ansicht.gebaeude.has(id), hausId);
    const haus = await anna.evaluate((id) => {
      const g = window.ansicht.gebaeude.get(id);
      return { x: g.x, y: g.y };
    }, hausId);
    const kuerzel = await anna.evaluate(() => window.ansicht.werte.einheiten.bogenschuetze.kuerzel);
    await anna.waitForFunction((k) => [...window.ansicht.nachher.values()].some((e) => e.k === k && e.b === window.ansicht.ich), kuerzel);
    // Derselbe Weg wie ein Rechtsklick auf das Haus.
    await anna.evaluate(({ k, h }) => {
      const a = window.ansicht;
      const schuetze = [...a.nachher.values()].find((e) => e.k === k && e.b === a.ich);
      a.befehlSenden([schuetze.i], h, false);
    }, { k: kuerzel, h: haus });
    await anna.evaluate((o) => {
      const a = window.ansicht;
      a.kamera.zoom = 2;
      a.blickAuf(o.x + 2, o.y);
    }, ort);

    // Er geht in Reichweite und schiesst: Pfeile kommen an.
    await anna.waitForFunction(() => window.ansicht.pfeile.length > 0, null, { timeout: 20_000 });

    // Ein Pfeil auf halbem Weg, fuer das Bild festgehalten: er fliegt 0,57
    // Sekunden (vier Felder bei sieben je Sekunde), und ein Bildschirmfoto des
    // gerenderten Spielbilds dauert laenger - im Flug war er nicht mehr
    // verlaesslich zu erwischen (2026-11-13). Gemessen wird vorher, am
    // fliegenden Pfeil: wie lange er unterwegs ist, wo er beginnt und endet.
    const pfeil = await anna.waitForFunction(() => {
      const jetzt = performance.now();
      const p = window.ansicht.pfeile.find((q) => !q.stein && jetzt >= q.start && (jetzt - q.start) / q.dauer < 0.5);
      if (!p) return null;
      const gemessen = { dauer: p.dauer, landung: p.start + p.dauer - p.ab, takt: window.ansicht.taktdauer, weite: p.weite, x0: p.x0, y0: p.y0, x1: p.x1, y1: p.y1 };
      p.dauer = 1e9;
      p.start = jetzt - 0.45e9;
      return gemessen;
    }, null, { timeout: 20_000, polling: 10 }).then((h) => h.jsonValue());
    expect(pfeil.weite, 'ein Schuss ueber mehr als ein Feld').toBeGreaterThan(1);
    // Er landet, wenn der Server ihn treffen laesst (kampf AC-27): so viele
    // Takte nach dem Zustand mit dem Schuss, wie er bei sieben Feldern je
    // Sekunde fliegt. Das Spannen des Bogens (bedienung AC-79) verschiebt nur
    // den Abschuss - der erste Pfeil fliegt dann kuerzer, landet aber zur
    // selben Zeit. Einen Takt Spiel, weil der Server die Lage genauer kennt.
    const flug = Math.max(1, Math.round((pfeil.weite / 7) * 10)) * pfeil.takt;
    expect(Math.abs(pfeil.landung - flug), `gelandet nach ${pfeil.landung} ms statt ${flug}`).toBeLessThanOrEqual(pfeil.takt);
    expect(pfeil.dauer, 'mindestens 0,15 Sekunden in der Luft').toBeGreaterThanOrEqual(150);
    const schuetze = await anna.evaluate((k) => {
      const a = window.ansicht;
      const e = [...a.nachher.values()].find((x) => x.k === k && x.b === a.ich);
      return { x: e.x, y: e.y };
    }, kuerzel);
    expect(Math.hypot(pfeil.x0 - schuetze.x, pfeil.y0 - schuetze.y), 'er beginnt beim Schuetzen').toBeLessThan(0.6);
    // Das Haus ist zwei Felder breit: das Ziel liegt auf seiner Grundflaeche.
    expect(Math.hypot(pfeil.x1 - haus.x, pfeil.y1 - haus.y), 'er endet am Haus').toBeLessThan(2);
    // Ein Bild weiter, dann steht er gezeichnet da.
    await anna.evaluate(() => new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig))));
    expect(await anna.evaluate(() => window.ansicht.pfeile.some((q) => q.dauer === 1e9)), 'der Pfeil steht im Bild').toBe(true);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-40',
      titel: 'Ein Pfeil im Flug zwischen Annas Bogenschützen (blau) und Berts Haus',
      test: info,
    });
    // Losgelassen: er kommt an und verschwindet wie jeder andere.
    await anna.evaluate(() => {
      for (const q of window.ansicht.pfeile) if (q.dauer === 1e9) q.dauer = 1;
    });
    await anna.waitForFunction(() => !window.ansicht.pfeile.some((q) => q.dauer === 1), null, { timeout: 5_000 });
  });

  test('darstellung AC-28: Pfeil und Stein kommen aus der gerenderten Tafel - der Pfeil in Flugrichtung gedreht, der Stein mit Schatten am Boden, kein Strich mehr', async ({}, info) => {
    const { anna } = partie;
    // Die Tafel ist geladen: eine Zeile, der Pfeil, sechs Lagen des Steins
    // und vier des Feuers, das der Drache speit (einheiten AC-52).
    const tafel = await anna.evaluate(async () => {
      const { gerendert } = await import('./bilder.js');
      const t = gerendert('geschoss');
      return t && { zeilen: t.zeilen, spalten: t.spalten, pfeil: t.pfeil, steine: t.steine.length, feuer: t.feuer?.length };
    });
    expect(tafel).toEqual({ zeilen: 1, spalten: 11, pfeil: 0, steine: 6, feuer: 4 });

    // Drei Pfeile an drei Stellen ihrer Bahn und zwei Steine, festgehalten:
    // ein Bildschirmfoto dauert laenger als jeder Flug.
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const vorher = await anna.evaluate((b) => {
      const a = window.ansicht;
      a.ausgewaehlt = new Set();
      a.gewaehltesGebaeude = null;
      a.beiAuswahl();
      a.kamera.zoom = 2.5;
      a.blickAuf(b.x - 5, b.y + 6);
      const jetzt = performance.now();
      const halten = (x0, y0, x1, y1, t, stein) => ({
        x0, y0, x1, y1, weite: Math.hypot(x1 - x0, y1 - y0), oben: 0, stein, start: jetzt - t * 1e9, dauer: 1e9,
      });
      const x = b.x - 5;
      const y = b.y + 6;
      a.pfeile = [
        // Steigend, im Scheitel, fallend - quer durchs Bild.
        halten(x - 4, y + 1, x + 2, y - 5, 0.15, false),
        halten(x - 4, y + 1, x + 2, y - 5, 0.5, false),
        halten(x - 4, y + 1, x + 2, y - 5, 0.88, false),
        // Einer in die Gegenrichtung: die Spitze zeigt, wohin er fliegt.
        halten(x + 3, y + 1, x - 1, y + 5, 0.5, false),
        // Zwei Steine desselben Wurfs.
        halten(x - 1, y + 4, x + 5, y - 2, 0.3, true),
        halten(x - 1, y + 4, x + 5, y - 2, 0.7, true),
      ];
      return { ...a.geschosseGezeichnet };
    }, basis);
    await anna.evaluate(() => new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig))));
    const nachher = await anna.evaluate(() => ({ ...window.ansicht.geschosseGezeichnet }));
    expect(nachher.tafel - vorher.tafel, 'alle sechs kommen aus der Tafel').toBeGreaterThanOrEqual(6);
    expect(nachher.strich, 'keiner als Strich oder Kreis').toBe(vorher.strich);
    // Gezaehlt die festgehaltenen: der Bogenschuetze aus dem Fall davor
    // schiesst weiter, und unter Last kam ein echter Pfeil dazwischen.
    expect(await anna.evaluate(() => window.ansicht.pfeile.filter((q) => q.dauer === 1e9).length)).toBe(6);
    await nachweis(anna, {
      spec: DARSTELLUNG,
      ac: 'AC-28',
      titel: 'Gerenderte Geschosse: Pfeile steigend, im Scheitel und fallend, einer in Gegenrichtung, und zwei Wurfsteine mit Schatten am Boden',
      test: info,
    });
    await anna.evaluate(() => { window.ansicht.pfeile = []; });
  });
});
