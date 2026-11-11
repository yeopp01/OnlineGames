// Zwei gegen zwei bis zum Ende, im Browser (→ specs/10-strategie/fahrplan.md
// AC-24): Anna eroeffnet mit drei KI-Gegnern, setzt im Warteraum sich und
// KI 1 in Team 1, KI 2 und KI 3 in Team 2 (auswahl AC-22), startet allein
// und spielt - ihre Dorfbewohner sammeln Holz. Dann spielen die KIs zu Ende.
//
// Gemessen in Runde 153 ohne Browser (ein untaetiger Mensch auf Platz 1,
// KI 1 neben ihm, Startwerte 4711 und 1 bis 8): jedes Mal gewinnt Team 2,
// nach 28,6 bis 33,9 Spielminuten (4711: 32,9); Anna scheidet nach 24,7 bis
// 26,8 Minuten aus, KI 1 haelt danach noch vier bis neun Minuten allein.
// Mit Zeitraffer 20 sind 33 Minuten gut 100 Sekunden. Zu viert liegen die
// Doerfer im Quadrat, Platz 1 und 2 sind Nachbarn - Anna und KI 1.
//
// Gegenprobe (Runde 153, dieselbe Messung mit `ki.js` aus Runde 150, vor
// ki AC-25): auf 4711, 1, 2 und 3 endet keine Partie vor Minute 90, Anna
// scheidet nie aus - die alte KI zieht zum Verbuendeten statt zum Gegner.
// Dieser Fall waere dann rot.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { ANMELDUNG, expect, fehlerSammeln, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, haeuserSetzen } from '../helpers/strategie.mjs';

const FAHRPLAN = '10-strategie/fahrplan.md';
const WALD = 1;
const TEAMS = [1, 1, 2, 2]; // Anna, KI 1, KI 2, KI 3 - so stehen sie im Warteraum

test.describe('Zwei gegen zwei', () => {
  test.use({ storageState: ANMELDUNG });

  test('fahrplan AC-24: Anna und KI 1 gegen KI 2 und KI 3 eroeffnet, gespielt und mit der Tafel des siegreichen Teams beendet', async ({ page }, info) => {
    test.setTimeout(420_000);
    const fehler = fehlerSammeln(page);
    await page.goto('/');
    await page.locator('[data-oeffnen="strategie"]').click();
    const form = page.locator('[data-einstellungen-fuer="strategie"]');
    await form.locator('[data-einstellung="startwert"]').fill('4711');
    await form.locator('[data-einstellung="ki"]').fill('3');
    await page.locator('[data-eroeffnen="strategie"]').click();
    await expect(page.locator('#warteraum')).toBeVisible();
    const code = (await page.locator('#raumcode').textContent()).trim();

    // Teams im Warteraum: der Gastgeber setzt jeden Platz, die KIs eingeschlossen.
    const zeilen = page.locator('#spielerliste li');
    await expect(zeilen.locator('.name')).toHaveText(['Anna (du)', 'KI 1', 'KI 2', 'KI 3']);
    for (const [i, team] of TEAMS.entries()) {
      await zeilen.nth(i).locator('[data-wahl="team"]').selectOption(JSON.stringify(team));
    }
    for (const [i, team] of TEAMS.entries()) {
      await expect(zeilen.nth(i).locator('[data-wahl="team"]')).toHaveValue(JSON.stringify(team));
    }
    // Handelt nicht von Haeusern (spielauswahl AC-24): alle ohne Boni - mit
    // Haeusern waere es eine andere Partie als die gemessene.
    await haeuserSetzen(page);

    await page.locator('#starten').click();
    await expect(page.locator('#brett')).toBeVisible();
    await page.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);

    // Die Teams sind angekommen: KI 1 ist fuer Anna kein Gegner, KI 2 und KI 3 schon.
    const feindlich = await page.evaluate(() => {
      const a = window.ansicht;
      return Object.fromEntries([...a.spieler.values()].filter((s) => s.id !== a.ich).map((s) => [s.name, a.feindlich(s.id)]));
    });
    expect(feindlich).toEqual({ 'KI 1': false, 'KI 2': true, 'KI 3': true });

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

    // Und die KIs spielen zu Ende.
    await page.waitForFunction(() => window.ansicht.ende !== null, undefined, { timeout: 360_000 });
    const lage = await page.evaluate(() => {
      const a = window.ansicht;
      const name = (id) => a.spieler.get(id)?.name;
      return {
        team: a.ende.team,
        gewinner: (a.ende.gewinner || []).map(name),
        tafel: a.ende.tafel.map((z) => ({ ...z, name: name(z.id) })),
        ich: a.ich,
      };
    });
    // Gewonnen hat ein Team - zwei Spieler, die im Warteraum zusammen standen.
    expect(lage.gewinner).toHaveLength(2);
    const teamVon = { Anna: 1, 'KI 1': 1, 'KI 2': 2, 'KI 3': 2 };
    expect(lage.gewinner.map((n) => teamVon[n]), 'beide Gewinner aus demselben Team').toEqual([lage.team, lage.team]);
    const zeile = (n) => lage.tafel.find((z) => z.name === n);
    expect(zeile('Anna').gesammelt.holz, 'Anna hat gespielt: Holz abgeliefert').toBeGreaterThan(0);
    for (const n of ['KI 1', 'KI 2', 'KI 3']) expect(zeile(n).ausgebildet, `${n} hat ausgebildet`).toBeGreaterThan(0);

    // Im Bild: die Meldung nennt das Team und seine beiden Spieler, die Tafel
    // hebt deren Zeilen hervor und daempft die beiden anderen.
    const verlierer = Object.keys(teamVon).filter((n) => !lage.gewinner.includes(n));
    const meldung = lage.gewinner.includes('Anna')
      ? `Ihr habt gewonnen — Team ${lage.team}: ${lage.gewinner.join(' und ')}`
      : `Team ${lage.team} hat gewonnen — ${lage.gewinner.join(' und ')}`;
    await expect(page.locator('#partieende')).toHaveText(meldung);
    await expect(page.locator('#abschlusstafel tr')).toHaveCount(5);
    await expect(page.locator('#abschlusstafel tr.sieger')).toHaveCount(2);
    for (const [i, n] of lage.gewinner.entries()) await expect(page.locator('#abschlusstafel tr.sieger').nth(i)).toContainText(n);
    await expect(page.locator('#abschlusstafel tr.draussen')).toHaveCount(2);
    for (const [i, n] of verlierer.entries()) await expect(page.locator('#abschlusstafel tr.draussen').nth(i)).toContainText(n);
    await expect(page.locator('#abschlussdauer')).toHaveText(/^Dauer \d+:\d\d$/);
    await expect(page.locator('#partieende')).toBeInViewport();
    await expect(page.locator('#abschluss')).toBeInViewport();
    expect(await bedienteileFrei(page)).toEqual([]);

    // Das Bild zeigt den gemessenen Ausgang (Startwert 4711: Team 2). Gewinnt
    // einmal Team 1, ist die Partie eine andere geworden - dann stimmt die
    // Unterschrift nicht mehr, und der Test sagt es, statt ein falsches Bild
    // abzulegen.
    expect(lage.team, 'gemessen: Team 2 gewinnt auf Startwert 4711').toBe(2);
    await nachweis(page, {
      spec: FAHRPLAN,
      ac: 'AC-24',
      titel: 'Zwei gegen zwei bis zum Ende gespielt: oben „Team 2 hat gewonnen — KI 2 und KI 3", in der Tafel ihre beiden Zeilen hervorgehoben, Annas und die ihrer Verbündeten KI 1 gedämpft, darunter die Dauer der Partie',
      test: info,
    });
    expect(fehler).toEqual([]);
  });
});
