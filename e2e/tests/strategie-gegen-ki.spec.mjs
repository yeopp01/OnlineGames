// Eine ganze Partie allein gegen die KI, im Browser
// (→ specs/10-strategie/fahrplan.md AC-12).
//
// Eroeffnet mit einem KI-Gegner (spielauswahl AC-18), allein gestartet
// (spielauswahl AC-19), gespielt - die Dorfbewohner sammeln Holz -, und dann
// gewinnt die KI: gegen einen Spieler, der nicht baut und nicht ausbildet,
// in rund 22 Spielminuten (gemessen in Runde 102 auf den Startwerten 1, 2, 3
// und 4711: 21,1 bis 22,1). Mit Zeitraffer 20 ist das gut eine Minute.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { ANMELDUNG, expect, fehlerSammeln, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, haeuserSetzen } from '../helpers/strategie.mjs';

const FAHRPLAN = '10-strategie/fahrplan.md';
const WALD = 1;

test.describe('Allein gegen die KI', () => {
  test.use({ storageState: ANMELDUNG });

  test('fahrplan AC-12: eine Partie allein gegen die KI eroeffnet, gespielt und mit der Tafel am Ende beendet', async ({ page }, info) => {
    test.setTimeout(300_000);
    const fehler = fehlerSammeln(page);
    await page.goto('/');
    await page.locator('[data-oeffnen="strategie"]').click();
    const form = page.locator('[data-einstellungen-fuer="strategie"]');
    await form.locator('[data-einstellung="ki"]').fill('1');
    await page.locator('[data-eroeffnen="strategie"]').click();
    await expect(page.locator('#warteraum')).toBeVisible();
    const code = (await page.locator('#raumcode').textContent()).trim();
    // Handelt nicht von Haeusern (spielauswahl AC-24): beide ohne Boni.
    await haeuserSetzen(page);

    await page.locator('#starten').click();
    await expect(page.locator('#brett')).toBeVisible();
    await page.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);

    // Gespielt: alle eigenen Dorfbewohner gewaehlt, Rechtsklick auf den
    // naechsten Wald - wie ein Mensch es tut.
    const holzVorher = await page.evaluate(() => window.ansicht.vorraete.holz);
    const wald = await page.evaluate((waldfeld) => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const basis = a.spieler.get(a.ich).basis;
      let bestes = null;
      for (let i = 0; i < a.karte.felder.length; i++) {
        if (a.karte.felder[i] !== waldfeld) continue;
        const x = i % g;
        const y = (i / g) | 0;
        const d = Math.hypot(x - basis.x, y - basis.y);
        if (!bestes || d < bestes.d) bestes = { x, y, d };
      }
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set([...a.nachher.values()].filter((e) => e.b === a.ich && e.k === 'd').map((e) => e.i));
      a.beiAuswahl();
      a.blickAuf(bestes.x, bestes.y);
      return { punkt: a.zuBild(bestes.x, bestes.y), gewaehlt: a.ausgewaehlt.size };
    }, WALD);
    expect(wald.gewaehlt, 'drei Dorfbewohner gewaehlt').toBe(3);
    await page.mouse.click(wald.punkt.x, wald.punkt.y, { button: 'right' });

    await zeitraffer(page, code, 20);
    await page.waitForFunction((h) => window.ansicht.vorraete.holz > h, holzVorher, { timeout: 30_000 });

    // Und die KI spielt zu Ende: sie greift an, bis Anna nichts mehr hat.
    await page.waitForFunction(() => window.ansicht.ende !== null, undefined, { timeout: 240_000 });
    const lage = await page.evaluate(() => {
      const a = window.ansicht;
      return { tafel: a.ende.tafel, ich: a.ich, namen: Object.fromEntries([...a.spieler.values()].map((s) => [s.id, s.name])) };
    });
    const annas = lage.tafel.find((z) => z.id === lage.ich);
    const kis = lage.tafel.find((z) => z.id !== lage.ich);
    expect(lage.namen[kis.id], 'der Gegner ist die KI').toBe('KI 1');
    expect(annas.gesammelt.holz, 'Anna hat gespielt: Holz abgeliefert').toBeGreaterThan(0);
    expect(annas.aus, 'und ist ausgeschieden').toBe(1);
    expect(kis.ausgebildet, 'die KI hat ausgebildet').toBeGreaterThan(0);

    // Die Tafel im Bild: Kopf und zwei Zeilen, die KI als Sieger.
    await expect(page.locator('#abschlusstafel tr')).toHaveCount(3);
    await expect(page.locator('#abschlusstafel tr.sieger')).toContainText('KI 1');
    await expect(page.locator('#abschlusstafel tr.draussen')).toContainText('Anna');
    await expect(page.locator('#abschlussdauer')).toHaveText(/^Dauer \d+:\d\d$/);
    await expect(page.locator('#abschluss')).toBeInViewport();
    expect(await bedienteileFrei(page)).toEqual([]);
    await nachweis(page, {
      spec: FAHRPLAN,
      ac: 'AC-12',
      titel: 'Allein gegen die KI bis zum Ende gespielt: die Tafel nennt KI 1 als Sieger, Annas Zeile gedämpft, darunter die Dauer der Partie',
      test: info,
    });
    expect(fehler).toEqual([]);
  });
});
