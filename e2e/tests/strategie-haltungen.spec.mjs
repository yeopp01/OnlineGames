// Haltungen (→ specs/10-strategie/kampf.md AC-28 bis AC-31).
//
// Was jede Haltung auf dem Server tut - verfolgen, Stellung, nicht angreifen
// -, pruefen tests/strategie-haltungen.test.mjs. Hier: die vier Knoepfe an
// der Auswahl, die Vorgabe hervorgehoben, Tafel und Tasten, und dass die
// Wahl als `ht` an den Einheiten ankommt.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit, waehlen } from '../helpers/strategie.mjs';

const KAMPF = '10-strategie/kampf.md';
const BEDIENUNG = '10-strategie/bedienung.md';

/** Was ein Knopf ohne Wort ist (bedienung AC-87): Name, Text, Bild und Mass. */
function knopfArt(page, wahl) {
  return page.locator(wahl).evaluateAll((knoepfe) => knoepfe.map((k) => {
    const r = k.getBoundingClientRect();
    return {
      name: k.getAttribute('aria-label'),
      text: [...k.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent.trim()).join(''),
      bild: k.querySelector('canvas') !== null,
      breite: Math.round(r.width),
      hoehe: Math.round(r.height),
    };
  }));
}

/** Die Haltung je Einheit, wie sie beim Browser ankommt (ohne `ht`: Verteidigung). */
function haltungen(page, ids) {
  return page.evaluate((ids) => ids.map((id) => window.ansicht.nachher.get(id)?.ht || '-'), ids);
}

test.describe('Haltungen', () => {
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('kampf AC-28: drei Speerkämpfer haben vier Knöpfe für die Haltung - Verteidigen ist gedrückt, Y X C V schalten um, die Wahl steht an jeder Einheit', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const platz = { x: basis.x + 6, y: basis.y + 4 };
    expect(await einheitenAufstellen(anna, code, 'Anna', 3, { art: 'speerkaempfer', ...platz })).toBe(3);
    const k = await anna.evaluate(() => window.ansicht.werte.einheiten.speerkaempfer.kuerzel);
    await anna.waitForFunction((k) => [...window.ansicht.nachher.values()].filter((e) => e.k === k).length === 3, k);
    const ids = await anna.evaluate((k) => [...window.ansicht.nachher.values()].filter((e) => e.k === k).map((e) => e.i), k);
    await waehlen(anna, ids, { zoom: 1.8, blick: platz });

    // Vier Knoepfe in einer Gruppe, die Vorgabe gedrueckt.
    const knoepfe = anna.locator('#haltungen [data-befehl^="haltung-"]');
    expect(await knoepfe.evaluateAll((k) => k.map((x) => x.getAttribute('aria-label'))))
      .toEqual(['Angreifen', 'Verteidigen', 'Stellung halten', 'Nicht angreifen']);
    await expect(anna.locator('[data-befehl="haltung-verteidigung"]')).toHaveAttribute('aria-pressed', 'true');
    expect(await haltungen(anna, ids), 'die Vorgabe steht nicht auf der Leitung').toEqual(['-', '-', '-']);

    // Die Tafel nennt Taste und Wirkung.
    await anna.mouse.move(700, 300);
    await anna.locator('[data-befehl="haltung-stellung"]').hover();
    const tafel = anna.locator('#knopftafel');
    await expect(tafel).toContainText('Haltung: Stellung halten');
    await expect(tafel).toContainText('Taste C');
    await expect(tafel).toContainText('Greift nur an, was er von seinem Platz aus trifft');
    await expect(tafel).toBeInViewport({ ratio: 1 });
    await anna.mouse.move(700, 300);

    // Y X C V schalten um - der Server setzt es, der Knopf folgt dem Zustand.
    const fall = [['y', 'angriff', 'a'], ['v', 'passiv', 'p'], ['x', 'verteidigung', '-'], ['c', 'stellung', 's']];
    for (const [taste, haltung, buchstabe] of fall) {
      await anna.keyboard.press(taste);
      await expect.poll(() => haltungen(anna, ids), { message: `Taste ${taste}` }).toEqual([buchstabe, buchstabe, buchstabe]);
      await expect(anna.locator(`[data-befehl="haltung-${haltung}"]`)).toHaveAttribute('aria-pressed', 'true');
      await expect(anna.locator('#haltungen [aria-pressed="true"]')).toHaveCount(1);
    }
    await expect(anna.locator('.auswahlleiste')).toBeInViewport();
    await nachweis(anna, {
      spec: KAMPF,
      ac: 'AC-28',
      titel: 'Drei Speerkämpfer halten Stellung: der Knopf ist golden, die anderen drei Haltungen daneben',
      test: info,
    });

    // Ein Klick tut dasselbe wie die Taste.
    await anna.locator('[data-befehl="haltung-verteidigung"]').click();
    await expect.poll(() => haltungen(anna, ids)).toEqual(['-', '-', '-']);
    await expect(anna.locator('[data-befehl="haltung-verteidigung"]')).toHaveAttribute('aria-pressed', 'true');

    // Ein Dorfbewohner hat keine Haltung: allein gewaehlt, keine Knoepfe.
    const bauer = await anna.evaluate(() => {
      const a = window.ansicht;
      const k = a.werte.einheiten.dorfbewohner.kuerzel;
      return [...a.nachher.values()].find((e) => e.b === a.ich && e.k === k).i;
    });
    await waehlen(anna, [bauer]);
    await expect(anna.locator('#haltungen')).toHaveCount(0);
  });

  test('bedienung AC-87: die Befehle an der Auswahl sind Bildknöpfe ohne Wort - der Name steht in der Tafel und im aria-label, die gewählte Haltung ist golden', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna } = partie;
    const { ids, platz } = await anna.evaluate(() => {
      const a = window.ansicht;
      const k = a.werte.einheiten.speerkaempfer.kuerzel;
      const eigene = [...a.nachher.values()].filter((e) => e.b === a.ich && e.k === k);
      return { ids: eigene.map((e) => e.i), platz: { x: eigene[0].x, y: eigene[0].y } };
    });
    expect(ids.length).toBe(3);
    await waehlen(anna, ids, { zoom: 1.8, blick: platz });

    // Einquartieren und die vier Haltungen: je ein Bild, kein Wort, quadratisch.
    const wahl = '.auswahlleiste .befehl-knopf';
    await expect(anna.locator(wahl)).toHaveCount(5);
    const knoepfe = await knopfArt(anna, wahl);
    expect(knoepfe.map((k) => k.name)).toEqual(['Angreifen', 'Verteidigen', 'Stellung halten', 'Nicht angreifen', '3 einquartieren']);
    for (const k of knoepfe) {
      expect(k.text, k.name).toBe('');
      expect(k.bild, k.name).toBe(true);
      expect(Math.abs(k.breite - k.hoehe), k.name).toBeLessThanOrEqual(1);
    }
    // Die Zahl steht als kleines Zeichen am Einquartieren-Knopf.
    await expect(anna.locator('#einquartieren .befehl-zahl')).toHaveText('3');
    // Die gewaehlte Haltung hebt sich ab: goldener Rand.
    const rand = (befehl) => anna.locator('[data-befehl="' + befehl + '"]').evaluate((k) => getComputedStyle(k).borderTopColor);
    expect(await rand('haltung-verteidigung')).not.toBe(await rand('haltung-angriff'));

    // Was der Knopf tut, steht in der Tafel.
    await anna.mouse.move(700, 300);
    await anna.locator('[data-befehl="haltung-angriff"]').hover();
    await expect(anna.locator('#knopftafel')).toContainText('Haltung: Angriff');
    await expect(anna.locator('#knopftafel')).toBeInViewport({ ratio: 1 });
    await expect(anna.locator('.auswahlleiste')).toBeInViewport({ ratio: 1 });
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-87',
      titel: 'Drei Speerkämpfer gewählt: Einquartieren mit der Zahl 3 und die vier Haltungen als Bildknöpfe, über „Angriff" steht die Tafel',
      test: info,
    });
    await anna.mouse.move(700, 300);

    // Am Dorfzentrum: Alle heraus und die Glocke, ebenso ohne Wort.
    const dz = await anna.evaluate(() => {
      const a = window.ansicht;
      return [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'dorfzentrum').i;
    });
    await anna.evaluate((id) => {
      const a = window.ansicht;
      a.ausgewaehlt = new Set();
      a.gewaehltesGebaeude = id;
      a.beiAuswahl();
    }, dz);
    await expect(anna.locator('#heraus')).toBeVisible();
    const amGebaeude = await knopfArt(anna, '.befehlsreihe .befehl-knopf');
    expect(amGebaeude.map((k) => k.name)).toEqual(['Alle heraus', 'Notfallklingel']);
    for (const k of amGebaeude) expect(k.text, k.name).toBe('');
  });
});
