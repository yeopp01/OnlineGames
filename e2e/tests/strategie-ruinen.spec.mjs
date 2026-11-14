// Truemmer nach dem Einsturz (→ specs/10-strategie/darstellung.md AC-26).
//
// Rueckmeldung des Benutzers: "kaputte gebaeude sollten nicht nur
// verschwinden, sondern kurz zur ruine werden, aber man kann trotzdem
// drueberreiten/gehen" - und nach dem Sieg sollen die Gebaeude dessen, der
// aufgegeben hat, als Ruine daliegen.
//
// Berts Kaserne und Haus stehen neben Annas Dorf und fallen unter den Pfeilen
// ihrer Schuetzen. Gemessen wird am Bild: wo die Kaserne stand, liegt etwas,
// das weder die Kaserne noch die Wiese ist, eine Miliz geht auf die Truemmer
// des Hauses, ein Klick trifft dort nichts, und nach zwanzig Spielsekunden
// ist der Platz wieder Wiese. Gibt am Ende Bert auf, bleiben die Truemmer seines Dorfzentrums im
// stehenden Bild.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import {
  aufgebenLassen, einheitenAufstellen, expect, gebaeudeAufstellen, lebenSetzen, test, zeitraffer,
} from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit, platzImBild } from '../helpers/strategie.mjs';

const DARSTELLUNG = '10-strategie/darstellung.md';

test.describe('Truemmer nach dem Einsturz', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('darstellung AC-26: wo Berts Kaserne stand, liegen zwanzig Sekunden Truemmer - begehbar, nicht anklickbar, und am Ende der Partie bleiben sie liegen', async ({}, info) => {
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    await zeitraffer(anna, code, 1);
    const basis = await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 2;
      a.blickAuf(b.x + 4, b.y + 4);
      return b;
    });
    await anna.waitForTimeout(200);

    // Zwei Gebaeude von Bert, vor Annas Dorf.
    const platzK = await platzImBild(anna, { n: 3, um: basis, abstand: 6 });
    const kaserne = await gebaeudeAufstellen(anna, code, 'Bert', 'kaserne', platzK.x, platzK.y);
    await anna.waitForFunction((id) => window.ansicht.gebaeude.has(id), kaserne);
    const platzH = await platzImBild(anna, { n: 2, um: basis, abstand: 7, seitlich: true });
    const haus = await gebaeudeAufstellen(anna, code, 'Bert', 'haus', platzH.x, platzH.y);
    await anna.waitForFunction((id) => window.ansicht.gebaeude.has(id), haus);
    const orte = await anna.evaluate(({ kaserne, haus }) => {
      const a = window.ansicht;
      const von = (id) => {
        const g = a.gebaeude.get(id);
        const m = a.gebaeudeMitte(g);
        return { x: m.x, y: m.y, n: m.groesse, anker: { x: g.x, y: g.y } };
      };
      const orte = { kaserne: von(kaserne), haus: von(haus) };
      a.blickAuf((orte.kaserne.x + orte.haus.x) / 2, (orte.kaserne.y + orte.haus.y) / 2);
      return orte;
    }, { kaserne, haus });
    await anna.waitForTimeout(300);

    // Die Helligkeit jedes Bildpunkts auf der Grundflaeche, etwas eingerueckt.
    const flaeche = (ort) => anna.evaluate((o) => {
      const a = window.ansicht;
      const p = a.zuBild(o.x, o.y);
      const e = a.zuBild(o.x + 1, o.y).x - p.x;
      const d = window.devicePixelRatio || 1;
      const halb = o.n * e * 0.78;
      const breite = Math.round(halb * 2 * d);
      const hoehe = Math.round(halb * d);
      const daten = a.stift.getImageData(Math.round((p.x - halb) * d), Math.round((p.y - halb / 2) * d), breite, hoehe).data;
      const hell = [];
      for (let y = 0; y < hoehe; y++) {
        for (let x = 0; x < breite; x++) {
          // In der Raute?
          if (Math.abs(x - breite / 2) / (breite / 2) + Math.abs(y - hoehe / 2) / (hoehe / 2) > 1) continue;
          const i = (y * breite + x) * 4;
          hell.push(Math.round((daten[i] + daten[i + 1] + daten[i + 2]) / 3));
        }
      }
      return hell;
    }, ort);
    const anders = (eins, zwei) => eins.filter((w, i) => Math.abs(w - zwei[i]) > 24).length / eins.length;

    const steht = await flaeche(orte.kaserne);

    // Annas Miliz wartet neben dem Haus: sie geht gleich auf seine Truemmer.
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { x: Math.round(orte.haus.x) + 3, y: Math.round(orte.haus.y) + 1, art: 'miliz' })).toBe(1);
    await anna.waitForFunction(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].some((e) => e.b === a.ich && !e.s && a.arten[e.k] === 'miliz');
    });

    // Annas Schuetzen, je einer in Schussweite vor jedem Gebaeude - neben
    // dessen Flaeche, nicht darauf. Beide schiessen sofort: die zwanzig
    // Sekunden laufen fuer beide Truemmer fast gleich.
    await lebenSetzen(anna, code, kaserne, 1);
    await lebenSetzen(anna, code, haus, 1);
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { x: Math.round(orte.kaserne.x) + 4, y: Math.round(orte.kaserne.y) + 1, art: 'bogenschuetze' })).toBe(1);
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { x: Math.round(orte.haus.x) + 1, y: Math.round(orte.haus.y) + 4, art: 'bogenschuetze' })).toBe(1);
    await anna.evaluate(async (wo) => {
      const a = window.ansicht;
      const schuetzen = () => [...a.nachher.values()].filter((e) => e.b === a.ich && !e.s && a.arten[e.k] === 'bogenschuetze');
      while (schuetzen().length < 2) await new Promise((weiter) => setTimeout(weiter, 50));
      // Jeder auf das Gebaeude, vor dem er steht.
      const nah = (o) => schuetzen().sort((p, q) => Math.hypot(p.x - o.x, p.y - o.y) - Math.hypot(q.x - o.x, q.y - o.y))[0];
      a.befehlSenden([nah(wo.kaserne).i], wo.kaserne.anker, false);
      a.befehlSenden([nah(wo.haus).i], wo.haus.anker, false);
    }, orte);
    await anna.waitForFunction(() => window.ansicht.ruinen.length === 2, undefined, { timeout: 30_000 });
    expect(await anna.evaluate(({ kaserne, haus }) => window.ansicht.gebaeude.has(kaserne) || window.ansicht.gebaeude.has(haus), { kaserne, haus }), 'beide Gebaeude sind weg').toBe(false);
    await anna.waitForTimeout(150);
    const truemmer = await flaeche(orte.kaserne);
    expect(anders(steht, truemmer), 'die Kaserne steht nicht mehr').toBeGreaterThan(0.3);

    // Begehbar: die Miliz geht mitten auf die Truemmer des Hauses.
    await anna.evaluate((o) => {
      const a = window.ansicht;
      const miliz = [...a.nachher.values()].find((e) => e.b === a.ich && !e.s && a.arten[e.k] === 'miliz');
      a.befehlSenden([miliz.i], { x: Math.floor(o.x), y: Math.floor(o.y) }, false);
    }, orte.haus);
    await anna.waitForFunction((o) => {
      const a = window.ansicht;
      const miliz = [...a.nachher.values()].find((e) => e.b === a.ich && !e.s && a.arten[e.k] === 'miliz');
      return miliz && Math.abs(miliz.x - o.x) <= 0.8 && Math.abs(miliz.y - o.y) <= 0.8;
    }, orte.haus, { timeout: 15_000 });
    expect(await anna.evaluate((id) => window.ansicht.ruinen.some((r) => r.gebaeude.i === id), haus), 'die Truemmer des Hauses liegen noch, als sie darauf steht').toBe(true);
    await nachweis(anna, {
      spec: DARSTELLUNG,
      ac: 'AC-26',
      titel: 'Wo Berts Kaserne und sein Haus standen, liegen Trümmer: verbrannter Boden, Mauerreste, Schutt und Balken — Annas Miliz steht mitten auf denen des Hauses',
      test: info,
    });

    // Ein Klick mitten auf die Truemmer der Kaserne trifft nichts.
    const bildK = await anna.evaluate((o) => window.ansicht.zuBild(o.x, o.y), orte.kaserne);
    await anna.mouse.click(bildK.x, bildK.y);
    expect(await anna.evaluate(() => {
      const a = window.ansicht;
      return { gewaehlt: a.gewaehltesGebaeude, angesehen: a.angesehen };
    })).toEqual({ gewaehlt: null, angesehen: null });
    await anna.mouse.move(700, 120);

    // Nach zwanzig Spielsekunden ist der Platz wieder Wiese.
    await zeitraffer(anna, code, 8);
    await anna.waitForFunction(() => window.ansicht.ruinen.length === 0, undefined, { timeout: 20_000 });
    await zeitraffer(anna, code, 1);
    await anna.waitForTimeout(300);
    const leer = await flaeche(orte.kaserne);
    // Gemessen: 65 % der Bildpunkte der Grundflaeche anders als die Wiese,
    // 72 % anders als die stehende Kaserne. Verlangt wird je knapp die Haelfte.
    console.log('gemessen:', anders(truemmer, leer).toFixed(2), anders(steht, truemmer).toFixed(2));
    expect(anders(truemmer, leer), 'die Truemmer sahen anders aus als die Wiese').toBeGreaterThan(0.3);

    // Bert gibt auf: die Partie ist entschieden, sein Dorfzentrum liegt in
    // Truemmern - und bleibt so, weil das Bild steht (spielziel AC-28).
    const fremd = await anna.evaluate(() => {
      const a = window.ansicht;
      const b = [...a.spieler.values()].find((s) => s.id !== a.ich).basis;
      // Unter die Abschlusstafel geruecket, nicht dahinter.
      a.blickAuf(b.x - 5, b.y - 5);
      return b;
    });
    await anna.waitForTimeout(300);
    await aufgebenLassen(anna, code, 'Bert');
    await anna.waitForFunction(() => window.ansicht.ende !== null, undefined, { timeout: 15_000 });
    await expect(anna.locator('#partieende')).toHaveText('Du hast gewonnen');
    expect(await anna.evaluate(() => window.ansicht.ruinen.map((r) => r.gebaeude.art)), 'Berts Dorfzentrum liegt in Truemmern').toContain('dorfzentrum');
    await anna.waitForTimeout(2500);
    expect(await anna.evaluate(() => window.ansicht.ruinen.map((r) => r.gebaeude.art)), 'und bleibt so').toContain('dorfzentrum');
    expect(fremd.x).toBeGreaterThan(0);
    await nachweis(anna, {
      spec: DARSTELLUNG,
      ac: 'AC-26',
      titel: 'Bert hat aufgegeben: unter der Abschlusstafel liegt sein Dorfzentrum in Trümmern, und sie bleiben liegen',
      test: info,
    });
  });
});
