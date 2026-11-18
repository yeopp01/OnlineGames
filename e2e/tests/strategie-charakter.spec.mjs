// Verbesserungen mit eigenem Charakter (→ specs/10-strategie/bauen.md AC-52
// bis AC-56).
//
// Rueckmeldung des Benutzers: "Und noch so spannende Sachen wie Kartografie,
// etc." Elf Verbesserungen, die aendern, wie sich etwas spielt: die
// Kartografie deckt die Karte auf, Blutlinien und Karawane, Brandstiftung und
// Knappen, vier Lehren des Klosters, Tretkran und Sappeure. Hier steht, was
// davon am Bildschirm ankommt - der Knopf mit eigenem Bild, die Tafel
// darueber, und die Werte an der Auswahl danach.
//
// Was sie rechnen, prueft tests/strategie-charakter.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, freieWiesen, gebaeudeInDerNaehe, partieBeenden, partieZuZweit, waehlen } from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';

/** Die Griffe, die beide Partien brauchen. */
function griffe(holen) {
  const knopf = (art) => holen().anna.locator(`[data-ausbilden="${art}"]`);
  const tafel = () => holen().anna.locator('#knopftafel');
  const reich = (mehr = {}) => rohstoffe(holen().anna, holen().code, 'Anna', { holz: 5000, nahrung: 5000, gold: 5000, stein: 2000, ...mehr });
  const gebaeudeWaehlen = async (id, zoom = 1.8) => {
    const { anna } = holen();
    await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), id);
    await anna.evaluate(([g, z]) => {
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
    const { anna, code } = holen();
    for (const art of arten) await knopf(art).click();
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction((xs) => xs.every((x) => window.ansicht.verbesserungen.includes(x)), arten, { timeout: 120_000 });
    await zeitraffer(anna, code, 1);
    await anna.mouse.move(700, 300);
  };
  /** Der Knopf traegt ein gezeichnetes Bild, und die Tafel darueber die Saetze des Servers. */
  const knopfPruefen = async (art, beschriftung, zeilen, dauer) => {
    const { anna } = holen();
    await expect(knopf(art)).toHaveAttribute('aria-label', beschriftung);
    await expect(knopf(art)).toBeInViewport();
    expect(await anna.evaluate((a) => {
      const bild = document.querySelector(`[data-ausbilden="${a}"] canvas`);
      const punkte = bild.getContext('2d').getImageData(0, 0, bild.width, bild.height).data;
      let farbig = 0;
      for (let i = 3; i < punkte.length; i += 4) if (punkte[i] > 0) farbig += 1;
      return farbig / (bild.width * bild.height);
    }, art), `${art}: das Zeichen ist gezeichnet`).toBeGreaterThan(0.1);
    await anna.mouse.move(700, 300);
    await knopf(art).hover();
    await expect(tafel().locator('.kt-zeile')).toHaveText(zeilen);
    await expect(tafel()).toContainText(`Forschung ${dauer} s`);
    await expect(tafel()).toBeInViewport({ ratio: 1 });
  };
  /** Eine Einheit der Art auf die Wiese stellen und waehlen. */
  const stellenUndWaehlen = async (art, wiese, zoom = 2.2) => {
    const { anna, code } = holen();
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { x: Math.round(wiese.x), y: Math.round(wiese.y), art }), art).toBe(1);
    const finden = () => anna.evaluate(([art, w]) => {
      const a = window.ansicht;
      const k = a.werte.einheiten[art].kuerzel;
      return [...a.nachher.values()].filter((e) => e.b === a.ich && !e.s && e.k === k && Math.hypot(e.x - w.x, e.y - w.y) < 4).map((e) => e.i);
    }, [art, wiese]);
    await expect.poll(finden, art).toHaveLength(1);
    const [id] = await finden();
    await waehlen(anna, [id], { zoom, blick: { x: wiese.x, y: wiese.y } });
    return id;
  };
  return { knopf, tafel, reich, gebaeudeWaehlen, forschen, knopfPruefen, stellenUndWaehlen };
}

test.describe('Kartografie', () => {
  let partie;
  test.beforeAll(async ({ browser }, info) => {
    // Im Nebel - sonst gibt es nichts aufzudecken.
    partie = await partieZuZweit(browser, info);
    await partie.anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
  });
  test.afterAll(() => partieBeenden(partie));
  const { knopf, reich, gebaeudeWaehlen, forschen, knopfPruefen } = griffe(() => partie);

  test('bauen AC-52: die Kartografie am Markt deckt die ganze Karte auf - Gelaende, Wald, Gold und Stein, aber kein fremdes Dorf und keinen fremden Namen', async ({}, info) => {
    test.setTimeout(180_000);
    const { anna, bert, code } = partie;
    await reich({ zeitalter: 1 });
    await anna.waitForFunction(() => window.ansicht.zeitalter === 1);
    await expect(anna.locator('#zeitalterwechsel')).toBeHidden({ timeout: 15_000 });
    const lage = await anna.evaluate(() => {
      const a = window.ansicht;
      const fremd = [...a.spieler.values()].find((s) => s.id !== a.ich);
      return { basis: a.spieler.get(a.ich).basis, fremd: fremd.basis, felder: a.karte.groesse ** 2 };
    });
    const markt = await gebaeudeInDerNaehe(anna, code, 'Anna', 'markt', lage.basis, { von: 6, bis: 16 });
    await gebaeudeWaehlen(markt);
    await expect(anna.locator('.auswahl-kopf strong')).toHaveText('Markt');

    // Vorher: der groesste Teil der Karte ist schwarz, Berts Dorf nie gesehen.
    const vorher = await anna.evaluate(() => window.ansicht.nebel.zaehlen());
    expect(vorher.nie, 'das meiste ist schwarz').toBeGreaterThan(lage.felder * 0.6);
    await knopfPruefen('kartografie', 'Kartografie erforschen (100 Nahrung, 100 Gold)', [
      'Die ganze Karte gilt als erkundet: Gelände, Wald, Gold, Stein und Beeren – für dich und deine Verbündeten',
      'Fremde Einheiten und Gebäude zeigt sie nicht',
    ], 40);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-52',
      titel: 'Annas Markt im Lehen, im Nebel: der Knopf mit der Landkarte, darüber die Tafel „Kartografie“ – 100 Nahrung, 100 Gold, die ganze Karte gilt als erkundet, fremde Einheiten und Gebäude zeigt sie nicht; die Übersichtskarte ist noch fast ganz schwarz',
      test: info,
    });

    // Erforscht: kein Feld ist mehr schwarz - gesehen ist davon keines mehr als vorher.
    await forschen(['kartografie']);
    await expect.poll(() => anna.evaluate(() => window.ansicht.karteBekannt)).toBe(true);
    await expect.poll(() => anna.evaluate(() => window.ansicht.nebel.zaehlen().nie)).toBe(0);
    await gebaeudeWaehlen(markt);
    await expect(knopf('kartografie'), 'einmal').toHaveCount(0);
    const danach = await anna.evaluate((fremd) => {
      const a = window.ansicht;
      return {
        erkundet: a.nebel.hatErkundet(fremd.x, fremd.y),
        gesehen: a.nebel.sieht(fremd.x, fremd.y),
        warDort: a.nebel.warDort(fremd.x, fremd.y),
        fremdeGebaeude: [...a.gebaeude.values()].filter((g) => g.b !== a.ich).length,
        fremdeEinheiten: [...a.nachher.values()].filter((e) => e.b !== a.ich).length,
        aufKarte: window.uebersicht.punkte.filter((p) => p.b !== undefined && p.b !== a.ich).length,
      };
    }, lage.fremd);
    expect(danach, 'Berts Platz ist erkundet, aber nicht gesehen - und von ihm steht nichts im Bild').toEqual({
      erkundet: true, gesehen: false, warDort: false, fremdeGebaeude: 0, fremdeEinheiten: 0, aufKarte: 0,
    });
    // Bert hat nichts davon.
    expect(await bert.evaluate(() => [window.ansicht.karteBekannt, window.ansicht.nebel.zaehlen().nie > 0])).toEqual([false, true]);

    // Der Blick auf Berts Platz: Gelaende, gedaempft - kein Dorfzentrum, kein Name.
    await anna.evaluate((fremd) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt.clear();
      a.beiAuswahl();
      a.kamera.zoom = 1;
      a.blickAuf(fremd.x, fremd.y);
    }, lage.fremd);
    await anna.mouse.move(700, 300);
    await anna.waitForTimeout(400);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-52',
      titel: 'Nach der Kartografie, der Blick auf Berts Platz: Wiese, Wald, Gold und Stein stehen gedämpft im Bild, die Übersichtskarte zeigt die ganze Karte – Berts Dorfzentrum, seine Leute und sein Name stehen nicht darauf',
      test: info,
    });
  });
});

test.describe('Verbesserungen mit eigenem Charakter', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let basis;
  let wiese;
  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
    const { anna } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    await rohstoffe(anna, partie.code, 'Anna', { holz: 5000, nahrung: 5000, gold: 5000, stein: 2000, zeitalter: 3 });
    await anna.waitForFunction(() => window.ansicht.zeitalter === 3);
    await expect(anna.locator('#zeitalterwechsel')).toBeHidden({ timeout: 15_000 });
    basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    [wiese] = await freieWiesen(anna, 1);
  });
  test.afterAll(() => partieBeenden(partie));
  const { knopf, tafel, reich, gebaeudeWaehlen, forschen, knopfPruefen, stellenUndWaehlen } = griffe(() => partie);
  const hier = (art, von = 7) => gebaeudeInDerNaehe(partie.anna, partie.code, 'Anna', art, basis, { von, bis: von + 14 });
  const tempo = (art) => partie.anna.evaluate((a) => window.ansicht.einheitenwerte.get(window.ansicht.ich)?.[a]?.tempo, art);
  const leben = () => partie.anna.locator('.auswahl-kopf .leben');

  test('bauen AC-53: Blutlinien im Stall und Karawane am Markt - der Ritter hat danach 20 Leben mehr, der Karren faehrt um die Haelfte schneller', async ({}, info) => {
    test.setTimeout(240_000);
    const { anna } = partie;
    const stall = await hier('stall');
    const markt = await hier('markt', 9);
    const ritter = await stellenUndWaehlen('ritter', wiese);
    await expect(leben()).toHaveAttribute('data-leben', '100/100');

    await gebaeudeWaehlen(stall);
    await knopfPruefen('blutlinien', 'Blutlinien erforschen (150 Nahrung, 100 Gold)', ['Kavallerie: +20 Leben'], 50);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-53',
      titel: 'Annas Stall: der Knopf mit dem Blutstropfen, darüber die Tafel „Blutlinien“ – 150 Nahrung, 100 Gold, Kavallerie: +20 Leben, Forschung 50 s',
      test: info,
    });
    await forschen(['blutlinien']);
    await gebaeudeWaehlen(stall);
    await expect(knopf('blutlinien')).toHaveCount(0);
    await waehlen(anna, [ritter], { zoom: 2.2, blick: wiese });
    await expect(leben(), 'auch wer schon stand').toHaveAttribute('data-leben', '120/120');

    // Am Markt: ohne Nebel keine Kartografie, aber die Karawane.
    await gebaeudeWaehlen(markt);
    await expect(knopf('kartografie'), 'aufgedeckt gibt es nichts aufzudecken').toHaveCount(0);
    expect(await tempo('marktkarren')).toBe(1);
    await knopfPruefen('karawane', 'Karawane erforschen (200 Nahrung, 200 Gold)', ['Karren: +50 % Tempo'], 40);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-53',
      titel: 'Annas Markt in der Krone: der Knopf mit dem Planwagen, darüber die Tafel „Karawane“ – 200 Nahrung, 200 Gold, Karren: +50 % Tempo, Forschung 40 s',
      test: info,
    });
    await forschen(['karawane']);
    await expect.poll(() => tempo('marktkarren')).toBe(1.5);
    await reich();
  });

  test('bauen AC-54: Brandstiftung und Knappen in der Kaserne - an der Miliz steht danach „+2 gegen Gebäude“, und sie ist ein Zehntel schneller', async ({}, info) => {
    test.setTimeout(240_000);
    const { anna } = partie;
    const kaserne = await hier('kaserne', 11);
    await gebaeudeWaehlen(kaserne);
    await knopfPruefen('knappen', 'Knappen erforschen (100 Nahrung)', ['Infanterie: +10 % Tempo'], 40);
    await knopfPruefen('brandstiftung', 'Brandstiftung erforschen (75 Nahrung, 25 Gold)', ['Infanterie: +2 Angriff gegen Gebäude'], 25);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-54',
      titel: 'Annas Kaserne: die Knöpfe mit Fackel und Stiefel, über der Fackel die Tafel „Brandstiftung“ – 75 Nahrung, 25 Gold, Infanterie: +2 Angriff gegen Gebäude, Forschung 25 s',
      test: info,
    });
    expect(await tempo('miliz')).toBe(0.9);
    await forschen(['brandstiftung', 'knappen']);
    await expect.poll(() => tempo('miliz')).toBe(0.99);
    expect(await tempo('speerkaempfer')).toBe(1.1);
    expect(await tempo('ritter'), 'der Reiter bleibt').toBe(1.35);

    await stellenUndWaehlen('miliz', { x: wiese.x + 3, y: wiese.y });
    await expect(anna.locator('#kampfwerte .bonus')).toHaveText('+2 gegen Gebäude');
    await stellenUndWaehlen('speerkaempfer', { x: wiese.x + 3, y: wiese.y + 3 });
    await expect(anna.locator('#kampfwerte .bonus'), 'zum eigenen Bonus dazu').toHaveText('+15 gegen Kavallerie, +2 gegen Gebäude');
    await expect(anna.locator('#kampfwerte')).toBeInViewport({ ratio: 1 });
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-54',
      titel: 'Nach der Brandstiftung: Annas Speerkämpfer gewählt, unter seinen Kampfwerten steht „+15 gegen Kavallerie, +2 gegen Gebäude“',
      test: info,
    });
    await reich();
  });

  test('bauen AC-55: vier Lehren im Kloster - der Moench hat danach 45 Leben, bekehrt aus 12 Feldern und ruht 41 Sekunden', async ({}, info) => {
    test.setTimeout(300_000);
    const { anna } = partie;
    const kloster = await hier('kloster', 13);
    const moench = await stellenUndWaehlen('moench', { x: wiese.x - 3, y: wiese.y });
    await expect(leben()).toHaveAttribute('data-leben', '30/30');
    await expect(anna.locator('#kampfwerte')).toHaveAttribute('data-bekehren', '9');

    await gebaeudeWaehlen(kloster);
    await knopfPruefen('heiligkeit', 'Heiligkeit erforschen (175 Gold)', ['Mönche: +15 Leben'], 60);
    await knopfPruefen('inbrunst', 'Inbrunst erforschen (140 Gold)', ['Mönche: +15 % Tempo'], 50);
    await knopfPruefen('erleuchtung', 'Erleuchtung erforschen (120 Gold)', ['Mönche ruhen nach einer Bekehrung 41 statt 62 Sekunden'], 65);
    await knopfPruefen('buchdruck', 'Buchdruck erforschen (200 Gold)', ['Mönche bekehren aus 12 statt 9 Feldern'], 55);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-55',
      titel: 'Annas Kloster in der Krone: neben dem Mönch vier Lehren – Heiligenschein, Flammenherz, Buch und Sonne –, über dem Buch die Tafel „Buchdruck“: 200 Gold, Mönche bekehren aus 12 statt 9 Feldern',
      test: info,
    });
    await forschen(['heiligkeit', 'inbrunst']);
    await gebaeudeWaehlen(kloster);
    await forschen(['buchdruck', 'erleuchtung']);
    await gebaeudeWaehlen(kloster);
    for (const art of ['heiligkeit', 'inbrunst', 'buchdruck', 'erleuchtung']) await expect(knopf(art), art).toHaveCount(0);
    // An der Tafel des Moenchs steht die neue Reichweite.
    await anna.mouse.move(700, 300);
    await knopf('moench').hover();
    await expect(tafel()).toContainText('Bekehrt fremde Einheiten aus 12 Feldern');
    await anna.mouse.move(700, 300);

    await waehlen(anna, [moench], { zoom: 2.2, blick: { x: wiese.x - 3, y: wiese.y } });
    await expect(leben(), 'auch wer schon stand').toHaveAttribute('data-leben', '45/45');
    const werte = anna.locator('#kampfwerte');
    await expect(werte).toHaveAttribute('data-bekehren', '12');
    await expect(werte).toContainText('12 Felder');
    expect(await werte.locator('span', { hasText: '12 Felder' }).first().evaluate((e) => e.title || e.closest('[title]')?.title || '')).toContain('ruht er 41 Sekunden');
    expect(await tempo('moench')).toBe(0.805);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-55',
      titel: 'Nach den vier Lehren: Annas Mönch gewählt – 45 von 45 Leben, „Bekehrt 12 Felder“ statt neun',
      test: info,
    });
    await reich();
  });

  test('bauen AC-56: Tretkran in der Universitaet und Sappeure in der Burg - am Dorfbewohner steht danach „+15 gegen Gebäude“', async ({}, info) => {
    test.setTimeout(300_000);
    const { anna } = partie;
    const universitaet = await hier('universitaet', 15);
    const burg = await hier('burg', 17);
    await gebaeudeWaehlen(universitaet);
    await knopfPruefen('tretkran', 'Tretkran erforschen (300 Nahrung, 200 Holz)', ['Dorfbewohner bauen 20 % schneller'], 50);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-56',
      titel: 'Annas Universität: der Knopf mit dem Kran, darüber die Tafel „Tretkran“ – 300 Nahrung, 200 Holz, Dorfbewohner bauen 20 % schneller, Forschung 50 s',
      test: info,
    });
    await forschen(['tretkran']);

    await gebaeudeWaehlen(burg, 1.5);
    await knopfPruefen('sappeure', 'Sappeure erforschen (400 Nahrung, 200 Holz)', ['Dorfbewohner: +15 Angriff gegen Gebäude'], 10);
    await forschen(['sappeure']);
    await gebaeudeWaehlen(burg, 1.5);
    await expect(knopf('sappeure')).toHaveCount(0);

    await stellenUndWaehlen('dorfbewohner', { x: wiese.x, y: wiese.y + 4 });
    await expect(anna.locator('#kampfwerte .bonus')).toHaveText('+15 gegen Gebäude');
    await expect(anna.locator('#kampfwerte')).toBeInViewport({ ratio: 1 });
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-56',
      titel: 'Nach den Sappeuren: Annas Dorfbewohner gewählt, unter seinen Kampfwerten steht „+15 gegen Gebäude“',
      test: info,
    });
  });
});
