// Die Dunkle Zeit am Stueck (→ specs/10-strategie/fahrplan.md AC-3): eine
// Partie, im Browser gespielt wie von einem Menschen - Rechtsklick sammelt,
// H und Q bilden aus, B und ein Buchstabe bauen, ein Klick setzt den Platz.
// Jede Einzelheit hat ihren eigenen Test; dieser zeigt, dass sie zusammen eine
// spielbare Dunkle Zeit ergeben. Zeitraffer statt Warten.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { BAUTASTEN } from '../../public/tasten.js';
import { dorfbewohnerAnklicken, partieBeenden, partieZuZweit, platzImBild } from '../helpers/strategie.mjs';

const FAHRPLAN = '10-strategie/fahrplan.md';
const WALD = 1;
const BEERE = 2;
const GOLD = 4;
const STEIN = 5;

test.describe('Dunkle Zeit am Stueck', () => {
  let partie;
  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('fahrplan AC-3: vier Rohstoffe, alle Gebaeude, Dorfbewohner und Miliz - im Browser gesammelt, gebaut, ausgebildet', async ({}, info) => {
    test.setTimeout(240_000);
    const { anna, code } = partie;
    const aufBasis = (zoom = 1.2) => anna.evaluate((z) => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.kamera.zoom = z;
      a.blickAuf(b.x + 2, b.y + 2);
    }, zoom);
    const vorraete = () => anna.evaluate(() => ({ ...window.ansicht.vorraete }));
    // Das naechste Feld einer Art zur eigenen Basis ins Bild holen und rechts anklicken.
    const rechtsAuf = async (art) => {
      const p = await anna.evaluate((art) => {
        const a = window.ansicht;
        const b = a.spieler.get(a.ich).basis;
        const g = a.karte.groesse;
        let bestes = null;
        for (let y = 0; y < g; y++) {
          for (let x = 0; x < g; x++) {
            if (a.karte.felder[y * g + x] !== art) continue;
            const d = Math.hypot(x - b.x, y - b.y);
            if (!bestes || d < bestes.d) bestes = { x, y, d };
          }
        }
        a.blickAuf(bestes.x, bestes.y);
        return a.zuBild(bestes.x, bestes.y);
      }, art);
      await anna.mouse.click(p.x, p.y, { button: 'right' });
    };

    await aufBasis();
    await zeitraffer(anna, code, 10);
    const start = await vorraete();

    // Sammeln: ein Schaf schlachten, Holz, Gold - je ein Dorfbewohner per Rechtsklick.
    const hirte = await dorfbewohnerAnklicken(anna);
    const schaf = await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      const t = [...a.tiere.values()].filter((x) => x.b === a.ich).sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y))[0];
      return a.zuBild(t.x, t.y);
    });
    await anna.mouse.click(schaf.x, schaf.y, { button: 'right' });
    await aufBasis();
    const holzer = await dorfbewohnerAnklicken(anna, { ohne: [hirte] });
    await rechtsAuf(WALD);
    await aufBasis();
    await dorfbewohnerAnklicken(anna, { ohne: [hirte, holzer] });
    await rechtsAuf(GOLD);

    // Ausbilden: H waehlt das Dorfzentrum, Q - der Wohnraum reicht zu Beginn fuer einen.
    const dorfbewohner = () => anna.evaluate(() => [...window.ansicht.nachher.values()].filter((e) => e.b === window.ansicht.ich && e.k === 'd').length);
    await aufBasis();
    await anna.keyboard.press('h');
    await anna.keyboard.press('q');
    await expect.poll(dorfbewohner, { timeout: 30_000 }).toBe(4);
    // Der neue steht untaetig: mit "." waehlen, an den Stein.
    await anna.keyboard.press('Escape');
    await anna.keyboard.press('.');
    await rechtsAuf(STEIN);

    // Gesammelt ist erst, was im Lager ankommt: jeder Rohstoff steigt, ein Schaf ist geschlachtet.
    await anna.waitForFunction((s) => {
      const a = window.ansicht;
      const v = a.vorraete;
      return v.holz > s.holz && v.gold > s.gold && v.stein > s.stein && v.nahrung > s.nahrung - 50
        && [...a.tiere.values()].some((t) => t.b === a.ich && t.g);
    }, start, { timeout: 90_000 });

    // Bauen braucht mehr Holz, als in dieser Zeit zusammenkommt; gesammelt ist
    // oben jeder Rohstoff. Der Pruefgriff fuellt nur auf, gebaut wird mit Taste und Klick.
    await rohstoffe(anna, code, 'Anna', { holz: 2000, nahrung: 500, gold: 500, stein: 500 });
    await zeitraffer(anna, code, 20);
    // Nur die Gebaeude der Dunklen Zeit - die Feudalzeit hat dieser Test nicht
    // erreicht, ihre Gebaeude stehen deshalb nicht im Menue (bauen AC-24).
    const arten = await anna.evaluate(() => {
      const w = window.ansicht.werte;
      return w.einheiten.dorfbewohner.baut.filter((art) => (w.gebaeude[art]?.zeitalter || 0) === 0);
    });
    // Ein Bauer baut eins nach dem anderen, jedes bis es steht.
    for (const [nummerBau, art] of arten.entries()) {
      await aufBasis();
      // Zum Zielen haelt die Hilfe die Zeit an und laesst sie danach weiterlaufen.
      // Hier zaehlt nur, **dass** einer baut: wer hinter einem Gebaeude steht,
      // ist trotzdem anklickbar, und spaeter im Lauf stehen alle dort.
      await dorfbewohnerAnklicken(anna, { ohne: [hirte], code, raffer: 20, auchVerdeckt: true });
      const menue = await anna.locator('#baumenue [data-bauen]').evaluateAll((k) => k.map((x) => x.dataset.bauen));
      const nummer = menue.indexOf(art);
      expect(nummer, `${art} im Baumenue`).toBeGreaterThanOrEqual(0);
      await anna.keyboard.press('b');
      await anna.keyboard.press(BAUTASTEN[nummer]);
      await expect.poll(() => anna.evaluate(() => window.ansicht.platzieren?.art)).toBe(art);
      const n = await anna.evaluate((art) => window.ansicht.werte.gebaeude[art].groesse, art);
      const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
      const platz = await platzImBild(anna, { n, um: basis, abstand: 5 + n, seitlich: nummerBau % 2 === 1 });
      expect(platz, `Platz fuer ${art}`).not.toBeNull();
      const vorher = await anna.evaluate(() => window.ansicht.gebaeude.size);
      await anna.mouse.move(platz.bild.x, platz.bild.y, { steps: 3 });
      await anna.mouse.click(platz.bild.x, platz.bild.y);
      await anna.waitForFunction((v) => window.ansicht.gebaeude.size > v, vorher, { timeout: 10_000 });
      await anna.waitForFunction((art) => [...window.ansicht.gebaeude.values()]
        .some((g) => g.b === window.ansicht.ich && g.art === art && g.u === undefined), art, { timeout: 60_000 });
      await anna.keyboard.press('Escape');
    }
    // Alle fertig.
    await anna.waitForFunction((arten) => {
      const a = window.ansicht;
      const fertig = new Set([...a.gebaeude.values()].filter((g) => g.b === a.ich && g.u === undefined).map((g) => g.art));
      return arten.every((art) => fertig.has(art));
    }, arten, { timeout: 90_000 });

    // Miliz aus der Kaserne: auf das Gebaeude klicken, dann den Knopf.
    await aufBasis();
    const kaserne = await anna.evaluate(() => {
      const a = window.ansicht;
      const k = [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'kaserne');
      const m = a.gebaeudeMitte(k);
      a.blickAuf(m.x, m.y);
      const p = a.zuBild(m.x, m.y);
      // Ein Punkt auf der Kaserne, an dem sie vorne liegt und keine Einheit steht.
      for (let dy = -20; dy > -140; dy -= 10) {
        for (const dx of [0, -20, 20, -40, 40]) {
          const x = p.x + dx;
          const y = p.y + dy;
          const einheit = [...a.nachher.values()].some((e) => {
            const q = a.zuBild(e.x, e.y);
            return Math.hypot(q.x - x, q.y - a.figurenHoehe() * 0.6 - y) < 30;
          });
          if (!einheit && a.gebaeudeUnter(x, y)?.i === k.i) return { i: k.i, x, y };
        }
      }
      return { i: k.i, x: p.x, y: p.y - 40 };
    });
    await anna.mouse.click(kaserne.x, kaserne.y);
    await expect.poll(() => anna.evaluate(() => window.ansicht.gewaehltesGebaeude)).toBe(kaserne.i);
    await anna.locator('[data-ausbilden="miliz"]').click();
    await anna.waitForFunction(() => [...window.ansicht.nachher.values()].some((e) => e.b === window.ansicht.ich && e.k === 'm'), null, { timeout: 30_000 });

    // Mit dem Wohnraum der Haeuser: noch ein Dorfbewohner, an die Beeren - bis er Beeren traegt.
    await aufBasis();
    await anna.keyboard.press('h');
    await anna.keyboard.press('q');
    await expect.poll(dorfbewohner, { timeout: 30_000 }).toBe(5);
    await anna.keyboard.press('Escape');
    await anna.keyboard.press('.');
    await rechtsAuf(BEERE);
    await anna.waitForFunction(() => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      return [...a.nachher.values()].some((e) => e.b === a.ich && e.a === 'n' && e.l > 0
        && [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]
          .some(([dx, dy]) => a.karte.felder[(Math.round(e.y) + dy) * g + Math.round(e.x) + dx] === 2));
    }, null, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);

    // Das Dorf der Dunklen Zeit, bei Zoom 1.
    await anna.keyboard.press('Escape');
    await aufBasis(0.9);
    const stand = await anna.evaluate(() => {
      const a = window.ansicht;
      const eigene = [...a.nachher.values()].filter((e) => e.b === a.ich);
      return {
        arten: [...new Set([...a.gebaeude.values()].filter((g) => g.b === a.ich).map((g) => g.art))].sort(),
        dorfbewohner: eigene.filter((e) => e.k === 'd').length,
        miliz: eigene.filter((e) => e.k === 'm').length,
        reiter: eigene.filter((e) => e.k === 's').length,
      };
    });
    expect(stand.arten).toEqual([...arten, 'dorfzentrum'].sort());
    expect(stand.dorfbewohner).toBe(5);
    expect(stand.miliz).toBeGreaterThanOrEqual(1);
    expect(stand.reiter).toBe(1);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: FAHRPLAN,
      ac: 'AC-3',
      titel: 'Die Dunkle Zeit im Browser gespielt: vier Rohstoffe gesammelt, alle sieben Gebaeude gebaut, fuenf Dorfbewohner und eine Miliz',
      test: info,
    });
  });
});
