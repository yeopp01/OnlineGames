// Das Haus im Spiel (→ specs/10-strategie/bedienung.md AC-69).
//
// Rueckmeldung des Benutzers: "wo sehe ich welches volk ich bin? Wenn ich auf
// ein gebäude von mir klicke - oder zumindest aufs dorfzentrum sollte mans
// sehn, auch beim gegner seh ichs nicht". Gewaehlt wurde das Haus im
// Warteraum, im Spiel stand es nirgends.
//
// Anna spielt Wehrstein, Bert Silberfurt - zwei echte Haeuser, denn das
// Pruefhaus der anderen Faelle hat keine Boni und damit nichts zu sagen.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Das Haus im Spiel', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, {
      sicht: 'aufgedeckt',
      haus: 'wehrstein',
      vorDemStart: async ({ anna }) => {
        const berts = anna.locator('#spielerliste select[data-wahl="haus"]').nth(1);
        await berts.selectOption(JSON.stringify('silberfurt'));
        await expect(berts).toHaveValue(JSON.stringify('silberfurt'));
      },
    });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-69: am eigenen und am fremden Dorfzentrum steht das Haus, und die Tafel sagt, was es bringt', async ({}, info) => {
    const { anna } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    expect(await anna.evaluate(() => {
      const a = window.ansicht;
      return [...a.spieler.values()].map((s) => s.haus);
    })).toEqual(['wehrstein', 'silberfurt']);

    const rand = await anna.locator('#brett').boundingBox();
    const zentrumKlicken = async (eigenes) => {
      const ort = await anna.evaluate((mein) => {
        const a = window.ansicht;
        a.ausgewaehlt = new Set();
        a.gewaehltesGebaeude = null;
        const g = [...a.gebaeude.values()].find((x) => (x.b === a.ich) === mein && x.art === 'dorfzentrum');
        const m = a.gebaeudeMitte(g);
        a.kamera.zoom = 1;
        a.blickAuf(m.x, m.y);
        const p = a.zuBild(m.x, m.y);
        return { px: p.x, py: p.y - 12 };
      }, eigenes);
      await anna.mouse.click(rand.x + ort.px, rand.y + ort.py);
    };
    const leiste = anna.locator('#auswahlleiste');
    const marke = leiste.locator('.hausmarke');
    const tafel = anna.locator('#knopftafel');
    const zeilen = tafel.locator('.kt-zeile');

    // Das eigene Dorfzentrum: das Haus unter dem Namen, die Knoepfe wie immer.
    await zentrumKlicken(true);
    await expect(leiste.locator('.auswahl-kopf strong')).toHaveText('Dorfzentrum');
    await expect(marke).toHaveText('Haus Wehrstein');
    await expect(leiste.locator('[data-ausbilden="dorfbewohner"]')).toBeVisible();
    await expect(tafel).toBeHidden();

    // Wer darauf zeigt, liest die Boni - die Saetze des Servers, Wort fuer Wort.
    const erwartet = await anna.evaluate(() => window.ansicht.werte.haeuser.wehrstein);
    expect(erwartet.bringt, 'der Server schickt die Saetze').toContain('Wachturm und Burg: +1 Reichweite');
    await marke.hover();
    await expect(tafel).toBeVisible();
    await expect(tafel.locator('.kt-kopf strong')).toHaveText('Haus Wehrstein');
    await expect(zeilen).toHaveText([
      ...erwartet.bringt,
      'Im Bündnis, auch für Verbündete:',
      ...erwartet.mannschaft.map((zeile) => `· ${zeile}`),
    ]);
    await expect(tafel.locator('.kt-fuss')).toHaveText(`„${erwartet.wahlspruch}“`);
    // Kein Preis: ein Haus kostet nichts.
    await expect(tafel.locator('.preis .ware')).toHaveCount(0);
    await expect(tafel).toBeInViewport({ ratio: 1 });
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-69',
      titel: 'Annas Dorfzentrum gewählt: unter dem Namen steht Haus Wehrstein, darüber die Tafel mit den Boni des Hauses',
      test: info,
    });
    // Vom Haus auf einen Knopf: dessen Tafel loest die des Hauses ab.
    await leiste.locator('[data-ausbilden="dorfbewohner"]').hover();
    await expect(tafel.locator('.kt-kopf strong')).toHaveText('Dorfbewohner');
    await anna.mouse.move(rand.x + 300, rand.y + 300);
    await expect(tafel).toBeHidden();

    // Berts Dorfzentrum ansehen: sein Haus, seine Boni, keine Knoepfe.
    await zentrumKlicken(false);
    await expect(leiste.locator('#besitzer')).toHaveText('Bert – Gegner');
    await expect(marke).toHaveText('Haus Silberfurt');
    await expect(leiste.locator('button')).toHaveCount(0);
    await marke.hover();
    await expect(tafel.locator('.kt-kopf strong')).toHaveText('Haus Silberfurt');
    await expect(zeilen.filter({ hasText: 'Am Markt 15 % Gebühr statt 30 %' })).toHaveCount(1);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-69',
      titel: 'Berts Dorfzentrum angesehen: Haus Silberfurt, die Tafel nennt Gold, Gebühr und Marktkarren',
      test: info,
    });
    await anna.mouse.move(rand.x + 300, rand.y + 300);
    await anna.keyboard.press('Escape');

    // Im Spielstand steht das Haus hinter jedem Namen, in der Punkteliste am Zeiger.
    const ids = await anna.evaluate(() => {
      const a = window.ansicht;
      return { ich: a.ich, bert: [...a.spieler.keys()].find((id) => id !== a.ich) };
    });
    await anna.keyboard.down('Tab');
    const stand = anna.locator('#spielstand');
    await expect(stand).toBeVisible();
    await expect(stand.locator(`tr[data-spieler="${ids.ich}"] .hausvermerk`)).toHaveText('Haus Wehrstein');
    await expect(stand.locator(`tr[data-spieler="${ids.bert}"] .hausvermerk`)).toHaveText('Haus Silberfurt');
    await anna.keyboard.up('Tab');
    await expect(stand).toBeHidden();
    await expect(anna.locator(`#punkteliste li[data-spieler="${ids.ich}"]`)).toHaveAttribute('title', 'Haus Wehrstein');
    await expect(anna.locator(`#punkteliste li[data-spieler="${ids.bert}"]`)).toHaveAttribute('title', 'Haus Silberfurt');
  });
});
