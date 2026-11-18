// Die Krone (→ specs/10-strategie/bauen.md AC-47,
// einheiten-und-befehle.md AC-66): der Aufstieg verlangt zwei Gebaeude des
// Fuerstentums oder eine Burg, und vier Linien bekommen ihre Stufe der Krone
// - Zweihandkaempfer, Hellebardier, Husar, Kavalier -, der Ritter eine zweite:
// den Paladin. Was die Zahlen im Kampf bedeuten, misst der Rechenteil
// (tests/strategie-krone.test.mjs); hier steht, was am Bildschirm ankommt.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import {
  bedienteileFrei, figurenFrei, freieWiesen, gebaeudeInDerNaehe, partieBeenden, partieZuZweit, waehlen,
} from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';
const EINHEITEN = '10-strategie/einheiten-und-befehle.md';

// Von links nach rechts im Bild, mit dem, was die Leiste zeigen muss - die
// Zahlen der Spec, nicht aus den Daten gelesen.
const STUFEN = [
  { von: 'langschwertkaempfer', nach: 'zweihandkaempfer', durch: 'zweihandstufe', name: 'Zweihandkämpfer', leben: 65, angriff: 12, nah: 1, fern: 1 },
  { von: 'pikenier', nach: 'hellebardier', durch: 'hellebardierstufe', name: 'Hellebardier', leben: 60, angriff: 6, nah: 0, fern: 0 },
  { von: 'leichtekavallerie', nach: 'husar', durch: 'husarenstufe', name: 'Husar', leben: 75, angriff: 7, nah: 0, fern: 2 },
  { von: 'ritter', nach: 'kavalier', durch: 'kavalierstufe', name: 'Kavalier', leben: 120, angriff: 12, nah: 2, fern: 2 },
];
// Die zweite Stufe des Ritters (Benutzer, 2026-11-18): sie tauscht jeden
// Kavalier aus - neben ihm steht sie deshalb nie, sie bekommt ihr eigenes Bild.
const PALADIN = { von: 'kavalier', nach: 'paladin', durch: 'paladinstufe', name: 'Paladin', leben: 160, angriff: 14, nah: 2, fern: 3 };

test.describe('Krone', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let basis;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  const reich = (mehr = {}) => rohstoffe(partie.anna, partie.code, 'Anna', { holz: 5000, nahrung: 5000, gold: 5000, stein: 2000, ...mehr });
  const knopf = (art) => partie.anna.locator(`[data-ausbilden="${art}"]`);
  const gebaeudeWaehlen = async (id, zoom = 1.8) => {
    await partie.anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), id);
    await partie.anna.evaluate(([g, z]) => {
      const a = window.ansicht;
      a.kamera.zoom = z;
      a.gewaehltesGebaeude = g;
      a.ausgewaehlt.clear();
      const m = a.gebaeudeMitte(a.gebaeude.get(g));
      a.blickAuf(m.x, m.y);
      a.beiAuswahl();
    }, [id, zoom]);
  };
  const forschen = async (arten) => {
    const { anna, code } = partie;
    for (const art of arten) await knopf(art).click();
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction((xs) => xs.every((x) => window.ansicht.verbesserungen.includes(x)), arten, { timeout: 120_000 });
    await zeitraffer(anna, code, 1);
  };

  test('bauen AC-47: in die Krone fuehren zwei Gebaeude des Fuerstentums oder eine Burg - die Tafel nennt beide Wege, und die Burg genuegt allein', async ({}, info) => {
    test.setTimeout(180_000);
    const { anna, code } = partie;
    await reich({ zeitalter: 2 });
    await anna.waitForFunction(() => window.ansicht.zeitalter === 2);
    await expect(anna.locator('#zeitalterwechsel')).toBeHidden({ timeout: 15_000 });
    basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const aufstieg = anna.locator('[data-aufstieg="imperialzeit"]');

    // Ohne ein Gebaeude des Fuerstentums: abgewiesen, und die Absage nennt
    // beide Wege.
    await anna.keyboard.press('h');
    await aufstieg.click();
    await expect(anna.locator('#spielmeldung')).toContainText('2 fertige Gebäude des Fürstentums außer Häusern oder eine Burg');
    expect(await anna.evaluate(() => window.ansicht.zeitalter)).toBe(2);

    // Eine Burg, sonst nichts aus dem Fuerstentum.
    const burg = await gebaeudeInDerNaehe(anna, code, 'Anna', 'burg', basis, { von: 7, bis: 16 });
    await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), burg);
    expect(await anna.evaluate(() => {
      const a = window.ansicht;
      return [...a.gebaeude.values()].filter((g) => g.b === a.ich && a.werte.gebaeude[g.art].zeitalter === 2).map((g) => g.art);
    }), 'nur die Burg ist aus dem Fuerstentum').toEqual(['burg']);

    // Die Tafel ueber dem Knopf nennt beide Wege (bedienung AC-55).
    await anna.keyboard.press('h');
    await aufstieg.hover();
    const tafel = anna.locator('#knopftafel');
    await expect(tafel).toBeVisible();
    await expect(tafel).toContainText('Aufstieg zur Krone');
    await expect(tafel).toContainText('Verlangt 2 fertige Gebäude des Fürstentums');
    await expect(tafel).toContainText('Oder eine Burg');
    await expect(tafel).toContainText('Dauer 190 s');
    for (const stufe of [...STUFEN, PALADIN]) await expect(tafel, stufe.name).toContainText(stufe.name);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-47',
      titel: 'Im Fürstentum mit einer Burg und sonst keinem Gebäude der Zeit: die Tafel über dem Aufstieg zur Krone nennt beide Wege – zwei Gebäude des Fürstentums oder eine Burg –, dazu 1000 Nahrung, 800 Gold und 190 Sekunden',
      test: info,
    });

    // Die Burg genuegt: bezahlt, und nach 190 Sekunden steht die Krone.
    const vorher = await anna.evaluate(() => ({ ...window.ansicht.vorraete }));
    await aufstieg.click();
    await expect.poll(() => anna.evaluate(() => window.ansicht.vorraete.nahrung)).toBe(vorher.nahrung - 1000);
    expect(await anna.evaluate(() => window.ansicht.vorraete.gold)).toBe(vorher.gold - 800);
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => window.ansicht.zeitalter === 3, null, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);
    await expect(anna.locator('#zeitalter b')).toHaveText('Krone');
  });

  // Haengt am Test davor: Anna steht in der Krone.
  test('einheiten AC-66: Zweihandkaempfer, Hellebardier, Husar, Kavalier und danach der Paladin - jede Stufe der Krone tauscht ihre Vorstufe aus, auch die, die schon steht', async ({}, info) => {
    test.setTimeout(360_000);
    const { anna, code } = partie;
    await expect(anna.locator('#zeitalterwechsel')).toBeHidden({ timeout: 15_000 });
    await reich();
    const kaserne = await gebaeudeInDerNaehe(anna, code, 'Anna', 'kaserne', basis, { von: 7, bis: 18 });
    const stall = await gebaeudeInDerNaehe(anna, code, 'Anna', 'stall', basis, { von: 8, bis: 20 });
    for (const id of [kaserne, stall]) await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), id);
    const [wiese] = await freieWiesen(anna, 1);

    // Erst die Stufen des Fuerstentums - ohne sie steht keine der Krone im
    // Menue, nur die des Ritters: er ist der erste seiner Linie.
    await gebaeudeWaehlen(kaserne);
    for (const art of ['zweihandstufe', 'hellebardierstufe']) await expect(knopf(art), `${art} erst nach der Vorstufe`).toHaveCount(0);
    await forschen(['soldatenstufe', 'pikenierstufe']);
    await gebaeudeWaehlen(kaserne);
    await expect(knopf('zweihandstufe'), 'erst nach dem Langschwert').toHaveCount(0);
    await forschen(['langschwertstufe']);
    await gebaeudeWaehlen(stall);
    await expect(knopf('husarenstufe'), 'erst nach der leichten Kavallerie').toHaveCount(0);
    await expect(knopf('kavalierstufe')).toHaveAttribute('aria-label', 'Weiterentwicklung: Ritter wird Kavalier (300 Nahrung, 300 Gold)');
    await expect(knopf('paladinstufe'), 'erst nach dem Kavalier').toHaveCount(0);
    await forschen(['kavalleriestufe']);
    await reich();

    // Die vier Vorstufen in einer Reihe auf der Wiese.
    for (const [i, stufe] of STUFEN.entries()) {
      const n = i - 1.5;
      expect(await einheitenAufstellen(anna, code, 'Anna', 1, { x: Math.round(wiese.x + 2 * n), y: Math.round(wiese.y - 2 * n), art: stufe.von }), stufe.von).toBe(1);
    }
    const aufDerWiese = (art) => anna.evaluate(([art, w]) => {
      const a = window.ansicht;
      const k = a.werte.einheiten[art].kuerzel;
      return [...a.nachher.values()].filter((e) => e.b === a.ich && !e.s && e.k === k && Math.hypot(e.x - w.x, e.y - w.y) < 8).map((e) => e.i);
    }, [art, wiese]);
    for (const stufe of STUFEN) await expect.poll(() => aufDerWiese(stufe.von), stufe.von).toHaveLength(1);

    // Jede Stufe der Krone steht unter ihrer Einheit, mit Preis (bedienung AC-80).
    await gebaeudeWaehlen(kaserne);
    await expect(knopf('zweihandstufe')).toHaveAttribute('aria-label', 'Weiterentwicklung: Langschwertkämpfer wird Zweihandkämpfer (200 Nahrung, 100 Gold)');
    await expect(knopf('hellebardierstufe')).toHaveAttribute('aria-label', 'Weiterentwicklung: Pikenier wird Hellebardier (300 Nahrung, 600 Gold)');
    await forschen(['zweihandstufe', 'hellebardierstufe']);
    await gebaeudeWaehlen(stall);
    await expect(knopf('husarenstufe')).toHaveAttribute('aria-label', 'Weiterentwicklung: Leichte Kavallerie wird Husar (500 Nahrung, 600 Gold)');
    await forschen(['husarenstufe', 'kavalierstufe']);

    // Danach bilden Kaserne und Stall die neue Stufe aus, zum Preis der alten.
    await gebaeudeWaehlen(kaserne);
    await expect(knopf('zweihandkaempfer')).toHaveAttribute('aria-label', 'Zweihandkämpfer ausbilden (60 Nahrung, 20 Gold)');
    await expect(knopf('hellebardier')).toHaveAttribute('aria-label', 'Hellebardier ausbilden (35 Nahrung, 25 Holz)');
    for (const art of ['langschwertkaempfer', 'pikenier', 'zweihandstufe', 'hellebardierstufe']) await expect(knopf(art), art).toHaveCount(0);
    await gebaeudeWaehlen(stall);
    await expect(knopf('husar')).toHaveAttribute('aria-label', 'Husar ausbilden (80 Nahrung)');
    await expect(knopf('kavalier')).toHaveAttribute('aria-label', 'Kavalier ausbilden (60 Nahrung, 75 Gold)');
    for (const art of ['leichtekavallerie', 'ritter', 'husarenstufe', 'kavalierstufe']) await expect(knopf(art), art).toHaveCount(0);
    // Unter dem Kavalier steht jetzt seine eigene Stufe - die teuerste im Spiel.
    await expect(knopf('paladinstufe')).toHaveAttribute('aria-label', 'Weiterentwicklung: Kavalier wird Paladin (1300 Nahrung, 750 Gold)');

    // Wer schon stand, ist ausgetauscht.
    for (const stufe of STUFEN) {
      expect(await aufDerWiese(stufe.von), `kein ${stufe.von} mehr`).toEqual([]);
      expect((await aufDerWiese(stufe.nach)).length, stufe.nach).toBe(1);
    }
    // Und jede steht mit ihrer eigenen gerenderten Figur da (darstellung
    // AC-32): eine Tafel, und nicht die ihrer Vorstufe.
    expect(await anna.evaluate(async (stufen) => {
      const { gerendert } = await import('/bilder.js');
      return stufen.map((s) => gerendert(s.nach) !== null && gerendert(s.nach) !== gerendert(s.von));
    }, [...STUFEN, PALADIN]), 'eigene Tafeln').toEqual([true, true, true, true, true]);

    // Name, Leben und Kampfwerte stehen in der Leiste - je Stufe gewaehlt,
    // das Bild mit der letzten.
    for (const stufe of STUFEN) {
      const [id] = await aufDerWiese(stufe.nach);
      await waehlen(anna, [id], { zoom: 2.4, blick: { x: wiese.x - 1, y: wiese.y - 1 } });
      await expect(anna.locator('.auswahl-kopf strong')).toHaveText(stufe.name);
      await expect(anna.locator('.auswahl-kopf .leben')).toHaveAttribute('data-leben', `${stufe.leben}/${stufe.leben}`);
      const werte = await anna.locator('#kampfwerte').evaluate((z) => ({ ...z.dataset }));
      expect([werte.angriff, werte.nahruestung, werte.fernruestung], stufe.name)
        .toEqual([String(stufe.angriff), String(stufe.nah), String(stufe.fern)]);
    }
    const imBild = await anna.evaluate((w) => {
      const a = window.ansicht;
      return [...a.nachher.values()].filter((e) => e.b === a.ich && !e.s && Math.hypot(e.x - w.x, e.y - w.y) < 8).map((e) => {
        const p = a.zuBild(e.x, e.y);
        return p.x > 60 && p.x < a.leinwand.clientWidth - 60 && p.y > 140 && p.y < a.leinwand.clientHeight - 230;
      });
    }, wiese);
    expect(imBild, 'alle vier im Bild').toEqual([true, true, true, true]);
    expect(await figurenFrei(anna)).toEqual([]);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-66',
      titel: 'Vier Stufen der Krone in einer Reihe, jede mit eigener Figur: Zweihandkämpfer, Hellebardier, Husar, Kavalier; gewählt der Kavalier: 120 Leben, 12 Angriff, Rüstung 2/2',
      test: info,
    });

    // Die zweite Stufe des Ritters: derselbe Reiter wird zum Paladin.
    const [reiter] = await aufDerWiese('kavalier');
    await reich();
    await gebaeudeWaehlen(stall);
    await forschen(['paladinstufe']);
    await gebaeudeWaehlen(stall);
    await expect(knopf('paladin')).toHaveAttribute('aria-label', 'Paladin ausbilden (60 Nahrung, 75 Gold)');
    for (const art of ['kavalier', 'paladinstufe']) await expect(knopf(art), art).toHaveCount(0);
    expect(await aufDerWiese('kavalier'), 'kein Kavalier mehr').toEqual([]);
    expect(await aufDerWiese('paladin'), 'derselbe Reiter').toEqual([reiter]);
    await waehlen(anna, [reiter], { zoom: 2.4, blick: { x: wiese.x - 1, y: wiese.y - 1 } });
    await expect(anna.locator('.auswahl-kopf strong')).toHaveText(PALADIN.name);
    await expect(anna.locator('.auswahl-kopf .leben')).toHaveAttribute('data-leben', `${PALADIN.leben}/${PALADIN.leben}`);
    const werte = await anna.locator('#kampfwerte').evaluate((z) => ({ ...z.dataset }));
    expect([werte.angriff, werte.nahruestung, werte.fernruestung]).toEqual([String(PALADIN.angriff), String(PALADIN.nah), String(PALADIN.fern)]);
    expect(await figurenFrei(anna)).toEqual([]);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-66',
      titel: 'Nach der zweiten Stufe des Ritters: derselbe Reiter ist ein Paladin auf dem gepanzerten Schimmel – 160 Leben, 14 Angriff, Rüstung 2/3; daneben Zweihandkämpfer, Hellebardier und Husar',
      test: info,
    });
  });
});
