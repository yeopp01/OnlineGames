// Der Spielstand auf Tab (→ specs/10-strategie/bedienung.md AC-20): solange
// die Taste gehalten wird, steht mitten im Bild eine Tafel mit jedem Spieler.
// Vorraete und Bevoelkerung zeigt sie von einem selbst und von Verbuendeten -
// bei Gegnern einen Strich, denn der Server schickt sie im Nebel nicht
// (kampf AC-13). Deshalb zu dritt: Anna und Bert im Team, Cem dagegen.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, rohstoffe, test } from '../helpers/seite.mjs';
import { partieBeenden, partieZuDritt } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Spielstand', () => {
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuDritt(browser, info, { teams: [1, 1, 2] });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-20: Tab gehalten zeigt den Spielstand - Vorraete von sich und dem Verbuendeten, beim Gegner ein Strich', async ({}, info) => {
    const { anna, bert, cem, code } = partie;
    // Erkennbare Zahlen, damit niemand zufaellig die eigenen liest.
    await rohstoffe(anna, code, 'Bert', { holz: 1234, nahrung: 567, gold: 89, stein: 321 });
    await rohstoffe(anna, code, 'Cem', { holz: 999, nahrung: 999, gold: 999, stein: 999 });
    await bert.waitForFunction(() => window.ansicht.vorraete.holz === 1234);
    await cem.waitForFunction(() => window.ansicht.vorraete.holz === 999);
    const ids = {
      anna: await anna.evaluate(() => window.ansicht.ich),
      bert: await bert.evaluate(() => window.ansicht.ich),
      cem: await cem.evaluate(() => window.ansicht.ich),
    };
    // Das eigene Dorf hinter der Tafel, nicht der Nebel.
    await anna.evaluate(() => {
      const a = window.ansicht;
      const basis = a.spieler.get(a.ich).basis;
      a.blickAuf(basis.x, basis.y);
    });

    const tafel = anna.locator('#spielstand');
    await expect(tafel).toBeHidden();
    const fokusVorher = await anna.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
    await anna.keyboard.down('Tab');
    await expect(tafel).toBeVisible();
    await expect(tafel).toBeInViewport();
    // Tab wandert nicht durch die Knoepfe der Leiste.
    expect(await anna.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)).toBe(fokusVorher);

    const zeile = (id) => tafel.locator(`tr[data-spieler="${id}"]`);
    await expect(tafel.locator('tr[data-spieler]')).toHaveCount(3);
    for (const [wer, name] of [['anna', 'Anna'], ['bert', 'Bert'], ['cem', 'Cem']]) {
      await expect(zeile(ids[wer]).locator('th')).toContainText(name);
      await expect(zeile(ids[wer]).locator('td').nth(1), `${name}: das Zeitalter`).toHaveText('Landsitz');
    }
    // Bert, der Verbuendete: seine Zahlen, nicht Annas.
    await expect(zeile(ids.bert).locator('td')).toHaveText([/^\d+$/, 'Landsitz', /^\d+ \/ \d+$/, '1234', '567', '89', '321']);
    // Anna: ihre eigenen, wie in der Leiste oben.
    const meine = await anna.evaluate(() => window.ansicht.vorraete);
    await expect(zeile(ids.anna).locator('td')).toHaveText([/^\d+$/, 'Landsitz', `${meine.bev} / ${meine.raum}`,
      String(meine.holz), String(meine.nahrung), String(meine.gold), String(meine.stein)]);
    // Cem, der Gegner: ein Strich - und seine 999 kommen gar nicht erst an.
    await expect(zeile(ids.cem).locator('td')).toHaveText([/^\d+$/, 'Landsitz', '–', '–', '–', '–', '–']);
    expect(await anna.evaluate((id) => window.ansicht.stand.get(id).vorraete, ids.cem), 'nichts von Cem im Browser').toBe(null);

    await anna.waitForTimeout(200);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-20',
      titel: 'Tab gehalten: der Spielstand mit Annas und Berts Vorraeten, bei Cem als Gegner nur Striche',
      test: info,
    });

    // Gehalten zieht sie mit: Berts Holz aendert sich, die Tafel auch.
    await rohstoffe(anna, code, 'Bert', { holz: 1500 });
    await expect(zeile(ids.bert).locator('td').nth(3)).toHaveText('1500');

    // Losgelassen ist sie fort.
    await anna.keyboard.up('Tab');
    await expect(tafel).toBeHidden();
  });

  test('bedienung AC-47: in der Tafel stehen Punkte fuer jeden - auch fuer den Gegner, dessen Vorraete fehlen', async ({}, info) => {
    const { anna, bert, cem, code } = partie;
    // Gesammelt ueber die Partie, erkennbar: ein Punkt je 10 Rohstoffe. Sonst
    // hat niemand etwas getan - keiner sammelt, keiner bildet aus, die drei
    // Dorfbewohner vom Start zaehlen nicht (tests/strategie-punkte.test.mjs).
    await rohstoffe(anna, code, 'Bert', { gesammelt: { holz: 500 } });
    await rohstoffe(anna, code, 'Cem', { gesammelt: { gold: 1234, stein: 6 } });
    const ids = {
      anna: await anna.evaluate(() => window.ansicht.ich),
      bert: await bert.evaluate(() => window.ansicht.ich),
      cem: await cem.evaluate(() => window.ansicht.ich),
    };
    await anna.waitForFunction((id) => window.ansicht.stand.get(id)?.punkte === 124, ids.cem);

    const tafel = anna.locator('#spielstand');
    await anna.keyboard.down('Tab');
    await expect(tafel).toBeVisible();
    await expect(tafel.locator('tr').first().locator('th').nth(1)).toHaveText('Punkte');
    const punkte = (id) => tafel.locator(`tr[data-spieler="${id}"] td`).first();
    await expect(punkte(ids.anna), 'Anna hat nichts getan').toHaveText('0');
    await expect(punkte(ids.bert), 'Bert, der Verbuendete: 500 Holz').toHaveText('50');
    await expect(punkte(ids.cem), 'Cem, der Gegner: 1240 Rohstoffe').toHaveText('124');
    // Cems Vorraete bleiben ein Strich - die Punkte verraten, wer vorne liegt,
    // nicht womit.
    await expect(tafel.locator(`tr[data-spieler="${ids.cem}"] td`).nth(3)).toHaveText('–');
    expect(await anna.evaluate((id) => window.ansicht.stand.get(id).vorraete, ids.cem)).toBe(null);
    // Und Cem sieht dieselbe Zahl fuer sich.
    await cem.waitForFunction((id) => window.ansicht.stand.get(id)?.punkte === 124, ids.cem);

    await anna.waitForTimeout(200);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-47',
      titel: 'Tab gehalten: Punkte in der zweiten Spalte - Anna 0, Bert 50, Cem als Gegner 124, seine Vorraete nur Striche',
      test: info,
    });
    await anna.keyboard.up('Tab');
  });

  test('bedienung AC-20: wer mit gehaltenem Tab das Fenster verlaesst, findet die Tafel zu', async () => {
    const { anna } = partie;
    const tafel = anna.locator('#spielstand');
    await anna.keyboard.down('Tab');
    await expect(tafel).toBeVisible();
    // Kein keyup kommt an, wenn das Fenster den Fokus verliert.
    await anna.evaluate(() => window.dispatchEvent(new Event('blur')));
    await expect(tafel).toBeHidden();
    await anna.keyboard.up('Tab');
  });
});
