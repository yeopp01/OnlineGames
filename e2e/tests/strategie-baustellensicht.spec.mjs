// Baustellen sehen nichts (→ specs/10-strategie/kampf.md AC-24).
//
// Rueckmeldung des Benutzers: "also gebaeude geben erst reichweite und sicht
// wenn gebaut." Die Regel selbst prueft tests/strategie-sicht.test.mjs auf dem
// Server. Hier steht sie im Bild: auf der erkundeten Karte liegt Annas
// Baustelle im Dunkeln, ihr fertiges Haus sechzehn Felder daneben hellt seinen
// Umkreis auf - und nur dort schickt der Server ihr Berts Miliz.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, gebaeudeAufstellen, test } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const KAMPF = '10-strategie/kampf.md';
// So weit stehen Baustelle und Haus auseinander: weiter, als ein Haus sieht.
const ABSTAND = 16;

test.describe('Baustellen sehen nichts', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Erkundet: die ganze Karte ist bekannt, hell ist nur, was jemand sieht.
    partie = await partieZuZweit(browser, info, { sicht: 'erkundet' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('kampf AC-24: Annas Baustelle hellt nichts auf, ihr fertiges Haus daneben schon - und nur dort sieht sie Berts Miliz', async ({}, info) => {
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);

    // Zwei freie Wiesen nebeneinander, weit weg von beiden Doerfern und von
    // allem, was Anna gehoert.
    const orte = await anna.evaluate((abstand) => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const grasUm = (x, y, r) => {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) if (a.karte.felder[(y + dy) * g + (x + dx)] !== 0) return false;
        }
        return true;
      };
      const basen = [...a.spieler.values()].map((s) => s.basis);
      const eigene = [...a.nachher.values()].filter((e) => e.b === a.ich);
      let bestes = null;
      for (let y = 8; y < g - 8; y++) {
        for (let x = 8; x < g - 8 - abstand; x++) {
          if (!grasUm(x, y, 4) || !grasUm(x + abstand, y, 4)) continue;
          const fern = Math.min(
            ...basen.map((b) => Math.min(Math.hypot(b.x - x, b.y - y), Math.hypot(b.x - x - abstand, b.y - y))),
            ...eigene.map((e) => Math.hypot(e.x - x, e.y - y)),
          );
          if (fern >= 20 && (!bestes || fern < bestes.fern)) bestes = { x, y, fern };
        }
      }
      return bestes && { baustelle: { x: bestes.x, y: bestes.y }, haus: { x: bestes.x + abstand, y: bestes.y } };
    }, ABSTAND);
    expect(orte, 'zwei freie Wiesen fern der Doerfer').not.toBeNull();

    const baustelle = await gebaeudeAufstellen(anna, code, 'Anna', 'haus', orte.baustelle.x, orte.baustelle.y, { bau: 0.5 });
    const haus = await gebaeudeAufstellen(anna, code, 'Anna', 'haus', orte.haus.x, orte.haus.y);
    // Berts Miliz neben jedem der beiden.
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { x: orte.baustelle.x + 2, y: orte.baustelle.y + 2, art: 'miliz' })).toBe(1);
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { x: orte.haus.x + 2, y: orte.haus.y + 2, art: 'miliz' })).toBe(1);
    await anna.waitForFunction(([b, h]) => window.ansicht.gebaeude.has(b) && window.ansicht.gebaeude.has(h), [baustelle, haus]);
    await anna.evaluate(({ baustelle, haus }) => {
      const a = window.ansicht;
      a.kamera.zoom = 1.3;
      a.blickAuf((baustelle.x + haus.x) / 2, (baustelle.y + haus.y) / 2);
    }, orte);

    // Neben dem Haus steht Berts Miliz im Bild.
    const fremdeBei = (ort) => anna.evaluate((o) => {
      const a = window.ansicht;
      return [...a.nachher.values()].filter((e) => e.b !== a.ich && !e.s && Math.hypot(e.x - o.x, e.y - o.y) < 5).length;
    }, ort);
    await expect.poll(() => fremdeBei(orte.haus), { timeout: 10_000 }).toBe(1);
    // Die Sicht wird zweimal je Sekunde neu gerechnet: Zeit genug lassen.
    await anna.waitForTimeout(1500);
    expect(await fremdeBei(orte.baustelle), 'neben der Baustelle schickt der Server niemanden').toBe(0);

    // Was der Browser als gesehen rechnet: um die Baustelle kein Feld, um das
    // Haus jedes. Und im Bild: der Boden am Haus ist heller.
    const lage = await anna.evaluate(({ orte, baustelle }) => {
      const a = window.ansicht;
      const gesehen = (o) => {
        let zahl = 0;
        for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (a.nebel.sieht(o.x + dx, o.y + dy)) zahl++;
        return zahl;
      };
      // Ein Stueck Wiese drei Felder vor dem Gebaeude.
      const hell = (o) => {
        const p = a.zuBild(o.x - 2, o.y + 3);
        const d = window.devicePixelRatio || 1;
        const daten = a.stift.getImageData(Math.round((p.x - 20) * d), Math.round((p.y - 10) * d), Math.round(40 * d), Math.round(20 * d)).data;
        let summe = 0;
        for (let i = 0; i < daten.length; i += 4) summe += (daten[i] + daten[i + 1] + daten[i + 2]) / 3;
        return summe / (daten.length / 4);
      };
      return {
        gesehen: { baustelle: gesehen(orte.baustelle), haus: gesehen(orte.haus) },
        hell: { baustelle: hell(orte.baustelle), haus: hell(orte.haus) },
        imBild: a.gezeigteGebaeude().some((g) => g.i === baustelle),
        imBau: a.gebaeude.get(baustelle).u,
      };
    }, { orte, baustelle });
    console.log('gemessen:', JSON.stringify(lage));
    expect(lage.imBild, 'die Baustelle steht im Bild').toBe(true);
    expect(lage.imBau, 'und ist im Bau').toBe(0.5);
    expect(lage.gesehen.baustelle, 'um die Baustelle ist kein Feld gesehen').toBe(0);
    expect(lage.gesehen.haus, 'um das Haus jedes').toBe(49);
    expect(lage.hell.haus - lage.hell.baustelle, 'der Boden am Haus ist heller').toBeGreaterThan(15);

    await nachweis(anna, {
      spec: KAMPF,
      ac: 'AC-24',
      titel: 'Annas Baustelle links liegt im Dunkeln der erkundeten Karte, ihr fertiges Haus rechts hellt seinen Umkreis auf — nur dort steht Berts Miliz im Bild',
      test: info,
    });
  });
});
