// Die Einheiten der Haeuser (→ specs/10-strategie/einheiten-und-befehle.md
// AC-42 bis AC-49, ADR-0014): den Eibenschuetzen bildet nur Eschenbruch aus,
// den Pavesenschuetzen nur Wehrstein, den Soeldner jedes Haus - Silberfurt
// billiger; aus der Burg kommen Eschenbruchs Kriegswolf, Rappensteins
// Reiterschuetze, Wehrsteins Riese, Silberfurts Meuchler und Distelhags
// Wiedergaenger. Dazu die Tarnung des Meuchlers im Nebel (→ kampf.md AC-22).
// Was die Zahlen im Kampf bedeuten,
// misst der Rechenteil (tests/strategie-hauseinheiten.test.mjs); hier steht,
// was am Bildschirm ankommt: wer welchen Knopf hat, was er kostet und wie
// die Figur aussieht.
//
// Je Partie drei echte Haeuser, denn das Pruefhaus der anderen Faelle bildet
// keine dieser Einheiten aus.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import {
  bedienteileFrei, figurenFrei, freieWiesen, gebaeudeInDerNaehe, partieBeenden, partieZuDritt, waehlen,
} from '../helpers/strategie.mjs';

const EINHEITEN = '10-strategie/einheiten-und-befehle.md';
const KAMPF = '10-strategie/kampf.md';
// Was eine Burg ausbilden kann - je Haus steht davon genau ein Knopf da.
const BURG = ['kriegswolf', 'reiterschuetze', 'riese', 'meuchler', 'wiedergaenger'];
const NAMEN = ['Anna', 'Bert', 'Cem'];

/**
 * Eine Partie zu dritt, je Platz ein Haus, alle im Fuerstentum und reich.
 * Je Spieler zwei freie Wiesen: auf der ersten stehen die `gebaeude`
 * (`[art, dx, dy]` von der Mitte der Wiese aus), die zweite bleibt frei fuer
 * die Reihen der Figuren. Zurueck die Partie und je Name `{ wiese, zweite,
 * <art>: id }`.
 */
async function aufbauen(browser, info, haeuser, gebaeude, sicht = 'aufgedeckt') {
  const partie = await partieZuDritt(browser, info, {
    sicht,
    haus: 'zufall',
    vorDemStart: async ({ anna }) => {
      const felder = anna.locator('#spielerliste select[data-wahl="haus"]');
      for (const [i, haus] of haeuser.entries()) {
        await felder.nth(i).selectOption(JSON.stringify(haus));
        await expect(felder.nth(i)).toHaveValue(JSON.stringify(haus));
      }
    },
  });
  const { anna, code, seiten } = partie;
  await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
  expect(await anna.evaluate(() => [...window.ansicht.spieler.values()].map((s) => s.haus))).toEqual(haeuser);
  const ort = {};
  for (const [i, name] of NAMEN.entries()) {
    const page = seiten[i];
    await rohstoffe(page, code, name, { holz: 3000, nahrung: 3000, gold: 3000, zeitalter: 2 });
    await page.waitForFunction(() => window.ansicht.zeitalter === 2);
    await expect(page.locator('#zeitalterwechsel')).toBeHidden({ timeout: 15_000 });
    const [wiese, zweite] = await freieWiesen(page, 2);
    ort[name] = { wiese, zweite };
    for (const [art, dx, dy] of gebaeude) {
      ort[name][art] = await gebaeudeInDerNaehe(page, code, name, art, { x: wiese.x + dx, y: wiese.y + dy }, { von: 0, bis: 2 });
      await page.waitForFunction((g) => window.ansicht.gebaeude.has(g), ort[name][art]);
    }
  }
  return { partie, ort };
}

const knopf = (page, art) => page.locator(`[data-ausbilden="${art}"]`);
const gebaeudeWaehlen = (page, id, zoom = 1.8) => page.evaluate(([g, z]) => {
  const a = window.ansicht;
  a.kamera.zoom = z;
  a.gewaehltesGebaeude = g;
  a.ausgewaehlt.clear();
  const m = a.gebaeudeMitte(a.gebaeude.get(g));
  a.blickAuf(m.x, m.y);
  a.beiAuswahl();
}, [id, zoom]);
// Die eigenen Einheiten einer Art, als Ids.
const eigene = (page, art) => page.evaluate((art) => {
  const a = window.ansicht;
  const k = a.werte.einheiten[art].kuerzel;
  return [...a.nachher.values()].filter((e) => e.b === a.ich && !e.s && e.k === k).map((e) => e.i);
}, art);
/** Im Gebaeude bestellen und warten, bis die Einheit steht; zurueck ihre Id. */
async function ausbilden(page, code, gebaeude, art, sekunden = 20) {
  await gebaeudeWaehlen(page, gebaeude);
  await knopf(page, art).click();
  await zeitraffer(page, code, sekunden);
  await page.waitForFunction((art) => {
    const a = window.ansicht;
    const k = a.werte.einheiten[art].kuerzel;
    return [...a.nachher.values()].some((e) => e.b === a.ich && !e.s && e.k === k);
  }, art, { timeout: 60_000 });
  await zeitraffer(page, code, 1);
  return (await eigene(page, art))[0];
}
/** Was die Leiste zur gewaehlten Einheit sagt. */
const leiste = async (page) => ({
  name: await page.locator('.auswahl-kopf strong').textContent(),
  leben: await page.locator('.auswahl-kopf .leben').getAttribute('data-leben'),
  ...(await page.locator('#kampfwerte').evaluate((z) => ({ ...z.dataset }))),
});
/** Die Reihe auf der Wiese: je Art eine Einheit, `weit` Felder auseinander. */
async function reihe(page, code, name, wiese, arten, weit = 2) {
  for (const [i, art] of arten.entries()) {
    const n = i - (arten.length - 1) / 2;
    expect(await einheitenAufstellen(page, code, name, 1, { x: Math.round(wiese.x + weit * n), y: Math.round(wiese.y - weit * n), art }), art).toBe(1);
  }
  await page.waitForFunction((arten) => {
    const a = window.ansicht;
    return arten.every((art) => [...a.nachher.values()].some((e) => e.b === a.ich && !e.s && e.k === a.werte.einheiten[art].kuerzel));
  }, arten);
}

test.describe('Einheiten der Haeuser', () => {
  test.describe.configure({ mode: 'serial' });
  // Anna spielt Eschenbruch, Bert Wehrstein, Cem Silberfurt; je Spieler eine
  // Schiessanlage und eine Kaserne auf der ersten Wiese (elf mal elf Felder Gras).
  let partie;
  let ort;

  test.beforeAll(async ({ browser }, info) => {
    ({ partie, ort } = await aufbauen(browser, info, ['eschenbruch', 'wehrstein', 'silberfurt'], [['schiessanlage', -4, -1], ['kaserne', 2, -1]]));
  });
  test.afterAll(() => partieBeenden(partie));

  test('einheiten AC-42: den Eibenschuetzen bildet nur Haus Eschenbruch aus - in der Schiessanlage ab dem Fuerstentum, mit eigener Figur', async ({}, info) => {
    test.setTimeout(180_000);
    const { anna, bert, cem, code } = partie;
    // Nur bei Anna steht der Knopf; Wehrstein und Silberfurt sehen ihn nicht.
    await gebaeudeWaehlen(anna, ort.Anna.schiessanlage);
    await expect(knopf(anna, 'eibenschuetze')).toHaveAttribute('aria-label', 'Eibenschütze ausbilden (35 Holz, 40 Gold)');
    await expect(knopf(anna, 'pavesenschuetze'), 'der gehoert Wehrstein').toHaveCount(0);
    await expect(knopf(anna, 'armbrustschuetze')).toHaveCount(1);
    for (const [page, name] of [[bert, 'Bert'], [cem, 'Cem']]) {
      await gebaeudeWaehlen(page, ort[name].schiessanlage);
      await expect(knopf(page, 'armbrustschuetze'), name).toHaveCount(1);
      await expect(knopf(page, 'eibenschuetze'), name).toHaveCount(0);
    }
    // Die Tafel ueber dem Knopf sagt, wem er gehoert.
    await knopf(anna, 'eibenschuetze').hover();
    const tafel = anna.locator('#knopftafel');
    await expect(tafel.locator('.kt-kopf')).toContainText('Eibenschütze');
    await expect(tafel).toContainText('Nur Haus Eschenbruch');
    await anna.mouse.move(700, 300);

    // Bestellt, bezahlt, ausgebildet.
    const id = await ausbilden(anna, code, ort.Anna.schiessanlage, 'eibenschuetze');
    expect(await anna.evaluate(() => [window.ansicht.vorraete.holz, window.ansicht.vorraete.gold])).toEqual([3000 - 35, 3000 - 40]);
    expect(id, 'ein Eibenschuetze steht').toBeTruthy();

    // Neben Bogen und Armbrust auf der Wiese: der Eibenschuetze reicht am weitesten.
    await reihe(anna, code, 'Anna', ort.Anna.zweite, ['bogenschuetze', 'armbrustschuetze', 'eibenschuetze']);
    const neuer = (await eigene(anna, 'eibenschuetze')).find((e) => e !== id);
    await waehlen(anna, [neuer], { zoom: 2.4, blick: ort.Anna.zweite });
    const zeigt = await leiste(anna);
    expect(zeigt.name).toBe('Eibenschütze');
    expect(zeigt.leben).toBe('35/35');
    expect(zeigt.angriff).toBe('6');
    // 6 aus den Daten, und Eschenbruchs Schuetzen reichen ab dem Fuerstentum ein Feld weiter.
    expect(zeigt.reichweite).toBe('7');
    const weiten = await anna.evaluate(() => {
      const a = window.ansicht;
      const w = a.einheitenwerte.get(a.ich);
      return ['bogenschuetze', 'armbrustschuetze', 'eibenschuetze'].map((art) => w[art].reichweite);
    });
    expect(weiten[2], 'weiter als Bogen und Armbrust').toBeGreaterThan(Math.max(weiten[0], weiten[1]));
    expect(await figurenFrei(anna)).toEqual([]);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-42',
      titel: 'Annas Schützen (Haus Eschenbruch) in einer Reihe: Kurzbogenschütze, Armbrustschütze und der Eibenschütze mit Kapuze und mannshohem Bogen – gewählt der Eibenschütze: 35 Leben, 6 Angriff, Reichweite 6+1',
      test: info,
    });
  });

  test('einheiten AC-43: den Pavesenschuetzen bildet nur Haus Wehrstein aus - hinter dem grossen Schild, Ruestung 1/4', async ({}, info) => {
    test.setTimeout(180_000);
    const { anna, bert, code } = partie;
    await gebaeudeWaehlen(bert, ort.Bert.schiessanlage);
    await expect(knopf(bert, 'pavesenschuetze')).toHaveAttribute('aria-label', 'Pavesenschütze ausbilden (30 Holz, 45 Gold)');
    await expect(knopf(bert, 'eibenschuetze'), 'der gehoert Eschenbruch').toHaveCount(0);
    await gebaeudeWaehlen(anna, ort.Anna.schiessanlage);
    await expect(knopf(anna, 'pavesenschuetze')).toHaveCount(0);
    await knopf(bert, 'pavesenschuetze').hover();
    await expect(bert.locator('#knopftafel')).toContainText('Nur Haus Wehrstein');
    await bert.mouse.move(700, 300);

    const vorher = await bert.evaluate(() => [window.ansicht.vorraete.holz, window.ansicht.vorraete.gold]);
    const id = await ausbilden(bert, code, ort.Bert.schiessanlage, 'pavesenschuetze');
    expect(id, 'ein Pavesenschuetze steht').toBeTruthy();
    expect(await bert.evaluate(() => [window.ansicht.vorraete.holz, window.ansicht.vorraete.gold])).toEqual([vorher[0] - 30, vorher[1] - 45]);

    await reihe(bert, code, 'Bert', ort.Bert.zweite, ['armbrustschuetze', 'pavesenschuetze', 'bogenschuetze']);
    const neuer = (await eigene(bert, 'pavesenschuetze')).find((e) => e !== id);
    await waehlen(bert, [neuer], { zoom: 2.4, blick: ort.Bert.zweite });
    const zeigt = await leiste(bert);
    expect(zeigt.name).toBe('Pavesenschütze');
    expect(zeigt.leben).toBe('45/45');
    expect([zeigt.angriff, zeigt.nahruestung, zeigt.fernruestung, zeigt.reichweite]).toEqual(['4', '1', '4', '4']);
    expect(await figurenFrei(bert)).toEqual([]);
    expect(await bedienteileFrei(bert)).toEqual([]);
    await bert.waitForTimeout(300);
    await nachweis(bert, {
      spec: EINHEITEN,
      ac: 'AC-43',
      titel: 'Berts Schützen (Haus Wehrstein) in einer Reihe: Armbrustschütze, der Pavesenschütze hinter dem großen gestreiften Schild und ein Kurzbogenschütze – gewählt der Pavesenschütze: 45 Leben, 4 Angriff, Rüstung 1/4, Reichweite 4',
      test: info,
    });
  });

  test('einheiten AC-44: den Soeldner bildet jede Kaserne fuer Gold aus - Silberfurt fuer 64 statt 80', async ({}, info) => {
    test.setTimeout(180_000);
    const { anna, bert, cem, code } = partie;
    // Jedes Haus hat den Knopf; der Preis haengt am Haus.
    for (const [page, name] of [[anna, 'Anna'], [bert, 'Bert']]) {
      await gebaeudeWaehlen(page, ort[name].kaserne);
      await expect(knopf(page, 'soeldner'), name).toHaveAttribute('aria-label', 'Söldner ausbilden (80 Gold)');
    }
    await gebaeudeWaehlen(cem, ort.Cem.kaserne);
    await expect(knopf(cem, 'soeldner')).toHaveAttribute('aria-label', 'Söldner ausbilden (64 Gold)');

    const vorher = await cem.evaluate(() => ({ ...window.ansicht.vorraete }));
    const id = await ausbilden(cem, code, ort.Cem.kaserne, 'soeldner');
    expect(id, 'ein Soeldner steht').toBeTruthy();
    const nachher = await cem.evaluate(() => ({ ...window.ansicht.vorraete }));
    expect(nachher.gold, 'bezahlt, was das Haus zahlt').toBe(vorher.gold - 64);
    expect([nachher.nahrung, nachher.holz], 'nur Gold').toEqual([vorher.nahrung, vorher.holz]);

    // Im Bild: der Soeldner vor der Kaserne, und ueber dem Knopf die Tafel mit dem Preis.
    await waehlen(cem, [id]);
    const zeigt = await leiste(cem);
    expect(zeigt.name).toBe('Söldner');
    expect(zeigt.leben).toBe('60/60');
    expect([zeigt.angriff, zeigt.nahruestung, zeigt.fernruestung]).toEqual(['9', '1', '1']);
    await gebaeudeWaehlen(cem, ort.Cem.kaserne, 2.2);
    await knopf(cem, 'soeldner').hover();
    const tafel = cem.locator('#knopftafel');
    await expect(tafel.locator('.kt-kopf')).toContainText('Söldner');
    await expect(tafel).toContainText('64');
    await expect(tafel).toContainText('Ausbildung 18 s');
    await expect(tafel).toBeInViewport({ ratio: 1 });
    // Und das Haus sagt es am Dorfzentrum in Worten (bedienung AC-69).
    expect(await cem.evaluate(() => window.ansicht.werte.haeuser.silberfurt.bringt)).toContain('Den Söldner gibt es 20 % billiger');
    expect(await bedienteileFrei(cem)).toEqual([]);
    await cem.waitForTimeout(300);
    await nachweis(cem, {
      spec: EINHEITEN,
      ac: 'AC-44',
      titel: 'Cems Kaserne (Haus Silberfurt) im Fürstentum: davor der Söldner mit breitem Hut und Streitkolben, über seinem Knopf die Tafel – 64 Gold statt 80, Ausbildung 18 s',
      test: info,
    });
  });
});

test.describe('Einheiten aus der Burg', () => {
  test.describe.configure({ mode: 'serial' });
  // Anna spielt Eschenbruch, Bert Rappenstein, Cem Wehrstein; je Spieler eine
  // Burg (vier mal vier Felder) mitten auf der ersten Wiese.
  let partie;
  let ort;

  test.beforeAll(async ({ browser }, info) => {
    ({ partie, ort } = await aufbauen(browser, info, ['eschenbruch', 'rappenstein', 'wehrstein'], [['burg', -2, -2]]));
  });
  test.afterAll(() => partieBeenden(partie));

  /** In der Burg steht genau der eine Knopf des Hauses. */
  const nurDieser = async (page, name, art) => {
    await gebaeudeWaehlen(page, ort[name].burg, 1.4);
    for (const andere of BURG) await expect(knopf(page, andere), `${name}: ${andere}`).toHaveCount(andere === art ? 1 : 0);
  };

  test('einheiten AC-45: den Kriegswolf bildet nur Haus Eschenbruch aus - in der Burg, ein Wolf im Geschirr statt eines Reiters', async ({}, info) => {
    test.setTimeout(180_000);
    const { anna, bert, cem, code } = partie;
    await nurDieser(bert, 'Bert', 'reiterschuetze');
    await nurDieser(cem, 'Cem', 'riese');
    await nurDieser(anna, 'Anna', 'kriegswolf');
    await expect(knopf(anna, 'kriegswolf')).toHaveAttribute('aria-label', 'Kriegswolf ausbilden (60 Nahrung, 30 Gold)');
    await knopf(anna, 'kriegswolf').hover();
    const tafel = anna.locator('#knopftafel');
    await expect(tafel.locator('.kt-kopf')).toContainText('Kriegswolf');
    await expect(tafel).toContainText('Nur Haus Eschenbruch');
    await anna.mouse.move(700, 300);

    const vorher = await anna.evaluate(() => ({ ...window.ansicht.vorraete }));
    const id = await ausbilden(anna, code, ort.Anna.burg, 'kriegswolf', 22);
    expect(id, 'ein Kriegswolf steht').toBeTruthy();
    const nachher = await anna.evaluate(() => ({ ...window.ansicht.vorraete }));
    expect([nachher.nahrung, nachher.gold]).toEqual([vorher.nahrung - 60, vorher.gold - 30]);

    // Zwischen Spaeherreiter und Ritter: so schnell wie der Ritter, aber kein Pferd.
    await reihe(anna, code, 'Anna', ort.Anna.zweite, ['spaeherreiter', 'kriegswolf', 'ritter'], 3);
    const neuer = (await eigene(anna, 'kriegswolf')).find((e) => e !== id);
    await waehlen(anna, [neuer], { zoom: 2.4, blick: ort.Anna.zweite });
    const zeigt = await leiste(anna);
    expect(zeigt.name).toBe('Kriegswolf');
    expect(zeigt.leben).toBe('55/55');
    expect([zeigt.angriff, zeigt.nahruestung, zeigt.fernruestung]).toEqual(['7', '0', '1']);
    const tempo = await anna.evaluate(() => {
      const w = window.ansicht.einheitenwerte.get(window.ansicht.ich);
      return [w.kriegswolf.tempo, w.ritter.tempo];
    });
    expect(tempo[0], 'schnell wie ein Ritter').toBe(tempo[1]);
    expect(await figurenFrei(anna)).toEqual([]);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-45',
      titel: 'Annas Reihe (Haus Eschenbruch): Späherreiter, der graue Kriegswolf im blauen Geschirr und ein Ritter – gewählt der Wolf: 55 Leben, 7 Angriff, Rüstung 0/1',
      test: info,
    });
  });

  test('einheiten AC-46: den Reiterschuetzen bildet nur Haus Rappenstein aus - ein Bogenschuetze auf dem Rappen', async ({}, info) => {
    test.setTimeout(180_000);
    const { bert, code } = partie;
    await nurDieser(bert, 'Bert', 'reiterschuetze');
    await expect(knopf(bert, 'reiterschuetze')).toHaveAttribute('aria-label', 'Reiterschütze ausbilden (40 Holz, 70 Gold)');
    await knopf(bert, 'reiterschuetze').hover();
    await expect(bert.locator('#knopftafel')).toContainText('Nur Haus Rappenstein');
    await bert.mouse.move(700, 300);

    const vorher = await bert.evaluate(() => ({ ...window.ansicht.vorraete }));
    const id = await ausbilden(bert, code, ort.Bert.burg, 'reiterschuetze', 36);
    expect(id, 'ein Reiterschuetze steht').toBeTruthy();
    const nachher = await bert.evaluate(() => ({ ...window.ansicht.vorraete }));
    expect([nachher.holz, nachher.gold]).toEqual([vorher.holz - 40, vorher.gold - 70]);

    await reihe(bert, code, 'Bert', ort.Bert.zweite, ['armbrustschuetze', 'reiterschuetze', 'spaeherreiter'], 3);
    const neuer = (await eigene(bert, 'reiterschuetze')).find((e) => e !== id);
    await waehlen(bert, [neuer], { zoom: 2.4, blick: ort.Bert.zweite });
    const zeigt = await leiste(bert);
    expect(zeigt.name).toBe('Reiterschütze');
    // 60 aus den Daten und 15 von Rappenstein: er ist ein Reiter seines Hauses.
    expect(zeigt.leben).toBe('75/75');
    expect([zeigt.angriff, zeigt.nahruestung, zeigt.fernruestung, zeigt.reichweite]).toEqual(['5', '0', '2', '5']);
    expect(await figurenFrei(bert)).toEqual([]);
    expect(await bedienteileFrei(bert)).toEqual([]);
    await bert.waitForTimeout(300);
    await nachweis(bert, {
      spec: EINHEITEN,
      ac: 'AC-46',
      titel: 'Berts Reihe (Haus Rappenstein): Armbrustschütze, der Reiterschütze mit Bogen auf dem Rappen und ein Späherreiter – gewählt der Reiterschütze: 60+15 Leben, 5 Angriff, Rüstung 0/2, Reichweite 5',
      test: info,
    });
  });

  test('einheiten AC-47: den Riesen bildet nur Haus Wehrstein aus - er ueberragt einen Mann um ein Drittel, mit der Keule gegen Gebaeude', async ({}, info) => {
    test.setTimeout(180_000);
    const { cem, code } = partie;
    await nurDieser(cem, 'Cem', 'riese');
    await expect(knopf(cem, 'riese')).toHaveAttribute('aria-label', 'Riese ausbilden (120 Nahrung, 100 Gold)');
    await knopf(cem, 'riese').hover();
    const tafel = cem.locator('#knopftafel');
    await expect(tafel).toContainText('Nur Haus Wehrstein');
    await expect(tafel).toContainText('+40 gegen Gebäude');
    await cem.mouse.move(700, 300);

    const vorher = await cem.evaluate(() => ({ ...window.ansicht.vorraete }));
    const id = await ausbilden(cem, code, ort.Cem.burg, 'riese', 42);
    expect(id, 'ein Riese steht').toBeTruthy();
    const nachher = await cem.evaluate(() => ({ ...window.ansicht.vorraete }));
    expect([nachher.nahrung, nachher.gold]).toEqual([vorher.nahrung - 120, vorher.gold - 100]);

    // Neben einem Mann und einer Ramme: er ueberragt beide.
    await reihe(cem, code, 'Cem', ort.Cem.zweite, ['langschwertkaempfer', 'riese', 'ramme'], 3);
    const neuer = (await eigene(cem, 'riese')).find((e) => e !== id);
    await waehlen(cem, [neuer], { zoom: 2.4, blick: ort.Cem.zweite });
    const zeigt = await leiste(cem);
    expect(zeigt.name).toBe('Riese');
    expect(zeigt.leben).toBe('180/180');
    expect([zeigt.angriff, zeigt.nahruestung, zeigt.fernruestung]).toEqual(['10', '2', '0']);
    // Gemessen an den Tafeln, aus denen gezeichnet wird: vom Fuss bis zum
    // oberen Rand der Zelle ist der Riese um mindestens ein Drittel hoeher
    // als der Mann daneben (beide Tafeln haben dieselbe Feldbreite).
    const hoch = await cem.evaluate(() => Promise.all(['riese', 'langschwertkaempfer'].map(async (art) => {
      const tafel = await (await fetch(`/bilder/${art}.json`)).json();
      return { fuss: tafel.fuss[1], feldbreite: tafel.feldbreite };
    })));
    expect(hoch[0].feldbreite).toBe(hoch[1].feldbreite);
    expect(hoch[0].fuss, 'der Riese ist groesser').toBeGreaterThan(hoch[1].fuss * 1.3);
    expect(await figurenFrei(cem)).toEqual([]);
    expect(await bedienteileFrei(cem)).toEqual([]);
    await cem.waitForTimeout(300);
    await nachweis(cem, {
      spec: EINHEITEN,
      ac: 'AC-47',
      titel: 'Cems Reihe (Haus Wehrstein): Langschwertkämpfer, der Riese mit der Keule und eine Ramme – gewählt der Riese: 180 Leben, 10 Angriff, Rüstung 2/0',
      test: info,
    });
  });
});

test.describe('Meuchler und Wiedergaenger', () => {
  test.describe.configure({ mode: 'serial' });
  // Anna spielt Silberfurt, Bert Distelhag, Cem Wehrstein; je Spieler eine
  // Burg. Gespielt wird **im Nebel**: nur dort gibt es die Tarnung.
  let partie;
  let ort;

  test.beforeAll(async ({ browser }, info) => {
    ({ partie, ort } = await aufbauen(browser, info, ['silberfurt', 'distelhag', 'wehrstein'], [['burg', -2, -2]], 'nebel'));
  });
  test.afterAll(() => partieBeenden(partie));

  const nurDieser = async (page, name, art) => {
    await gebaeudeWaehlen(page, ort[name].burg, 1.4);
    for (const andere of BURG) await expect(knopf(page, andere), `${name}: ${andere}`).toHaveCount(andere === art ? 1 : 0);
  };
  // Fremde Meuchler, die dieser Spieler im Zustand hat, als Felder.
  const fremdeMeuchler = (page) => page.evaluate(() => {
    const a = window.ansicht;
    const k = a.werte.einheiten.meuchler.kuerzel;
    return [...a.nachher.values()].filter((e) => e.b !== a.ich && !e.s && e.k === k).map((e) => ({ x: Math.round(e.x), y: Math.round(e.y) }));
  });

  test('einheiten AC-48: den Meuchler bildet nur Haus Silberfurt aus - ein Mann im dunklen Umhang, schwach im Kampf, toedlich fuer Dorfbewohner', async ({}, info) => {
    test.setTimeout(180_000);
    const { anna, bert, cem, code } = partie;
    await nurDieser(bert, 'Bert', 'wiedergaenger');
    await nurDieser(cem, 'Cem', 'riese');
    await nurDieser(anna, 'Anna', 'meuchler');
    await expect(knopf(anna, 'meuchler')).toHaveAttribute('aria-label', 'Meuchler ausbilden (40 Nahrung, 60 Gold)');
    await knopf(anna, 'meuchler').hover();
    const tafel = anna.locator('#knopftafel');
    await expect(tafel.locator('.kt-kopf')).toContainText('Meuchler');
    await expect(tafel).toContainText('Nur Haus Silberfurt');
    await expect(tafel).toContainText('Getarnt: Gegner sehen ihn erst auf 2 Felder');
    await expect(tafel).toContainText('+10 gegen Dorfbewohner, +10 gegen Mönche');
    await anna.mouse.move(700, 300);

    const vorher = await anna.evaluate(() => ({ ...window.ansicht.vorraete }));
    const id = await ausbilden(anna, code, ort.Anna.burg, 'meuchler', 27);
    expect(id, 'ein Meuchler steht').toBeTruthy();
    const nachher = await anna.evaluate(() => ({ ...window.ansicht.vorraete }));
    expect([nachher.nahrung, nachher.gold]).toEqual([vorher.nahrung - 40, vorher.gold - 60]);

    await reihe(anna, code, 'Anna', ort.Anna.zweite, ['langschwertkaempfer', 'meuchler', 'dorfbewohner'], 3);
    const neuer = (await eigene(anna, 'meuchler')).find((e) => e !== id);
    await waehlen(anna, [neuer], { zoom: 2.4, blick: ort.Anna.zweite });
    const zeigt = await leiste(anna);
    expect(zeigt.name).toBe('Meuchler');
    expect(zeigt.leben).toBe('35/35');
    expect([zeigt.angriff, zeigt.nahruestung, zeigt.fernruestung]).toEqual(['6', '0', '0']);
    expect(await figurenFrei(anna)).toEqual([]);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-48',
      titel: 'Annas Reihe (Haus Silberfurt): Langschwertkämpfer, der Meuchler im dunklen Umhang und ein Dorfbewohner – gewählt der Meuchler: 35 Leben, 6 Angriff, Rüstung 0/0',
      test: info,
    });
  });

  test('kampf AC-22: einen getarnten Meuchler sieht der Gegner erst auf zwei Felder - der zweite steht in seiner Sicht und fehlt im Bild', async ({}, info) => {
    test.setTimeout(180_000);
    const { anna, cem, code } = partie;
    const w = ort.Cem.zweite;
    // Cems Dorfbewohner als Beobachter (Sicht 4, greift nicht an). Der Griff
    // stellt auf das Feld links oben neben dem genannten - gelesen wird
    // deshalb, wo wirklich jemand steht.
    expect(await einheitenAufstellen(cem, code, 'Cem', 1, { x: w.x + 1, y: w.y + 1 })).toBe(1);
    const beobachter = await (await cem.waitForFunction((w) => {
      const a = window.ansicht;
      return [...a.nachher.values()].find((e) => e.b === a.ich && !e.s && Math.hypot(e.x - w.x, e.y - w.y) < 1.5)?.i ?? null;
    }, w)).jsonValue();
    expect(beobachter, 'der Beobachter steht').toBeTruthy();
    const vorher = await eigene(anna, 'meuchler');
    // Annas Meuchler: einer zwei Felder rechts, einer drei Felder links.
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { x: w.x + 3, y: w.y + 1, art: 'meuchler' })).toBe(1);
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { x: w.x - 2, y: w.y + 1, art: 'meuchler' })).toBe(1);
    await anna.waitForFunction((n) => {
      const a = window.ansicht;
      const k = a.werte.einheiten.meuchler.kuerzel;
      return [...a.nachher.values()].filter((e) => e.b === a.ich && !e.s && e.k === k).length === n;
    }, vorher.length + 2);
    const lage = await anna.evaluate(([alte, w]) => {
      const a = window.ansicht;
      const k = a.werte.einheiten.meuchler.kuerzel;
      return [...a.nachher.values()].filter((e) => e.b === a.ich && e.k === k && !alte.includes(e.i))
        .map((e) => ({ x: Math.round(e.x), y: Math.round(e.y), weit: Math.hypot(e.x - w.x, e.y - w.y) })).sort((p, q) => p.weit - q.weit);
    }, [vorher, w]);
    expect(lage.map((m) => m.weit), 'einer auf zwei, einer auf drei Felder').toEqual([2, 3]);

    // Cem bekommt genau den nahen - der ferne steht in seiner Sicht und fehlt.
    await cem.waitForFunction(() => {
      const a = window.ansicht;
      const k = a.werte.einheiten.meuchler.kuerzel;
      return [...a.nachher.values()].filter((e) => e.b !== a.ich && !e.s && e.k === k).length === 1;
    });
    await cem.waitForTimeout(1200);
    expect(await fremdeMeuchler(cem)).toEqual([{ x: lage[0].x, y: lage[0].y }]);
    expect(await cem.evaluate((f) => window.ansicht.nebel.sieht(f.x, f.y), lage[1]), 'das Feld des fernen liegt in Cems Sicht').toBe(true);

    await waehlen(cem, [beobachter], { zoom: 2.4, blick: w });
    expect(await figurenFrei(cem)).toEqual([]);
    expect(await bedienteileFrei(cem)).toEqual([]);
    await cem.waitForTimeout(300);
    await nachweis(cem, {
      spec: KAMPF,
      ac: 'AC-22',
      titel: 'Cems Bild im Nebel: sein Dorfbewohner in der Mitte, zwei Felder daneben Annas Meuchler – ihr zweiter Meuchler steht drei Felder auf der anderen Seite, mitten in Cems Sicht, und ist nicht zu sehen',
      test: info,
    });

    // Tritt jemand von Cem neben den fernen, steht auch der im Bild.
    expect(await einheitenAufstellen(cem, code, 'Cem', 1, { x: lage[1].x, y: lage[1].y + 1 })).toBe(1);
    await cem.waitForFunction(() => {
      const a = window.ansicht;
      const k = a.werte.einheiten.meuchler.kuerzel;
      return [...a.nachher.values()].filter((e) => e.b !== a.ich && !e.s && e.k === k).length === 2;
    });
  });

  test('einheiten AC-49: den Wiedergaenger bildet nur Haus Distelhag aus - fuer 30 Gold und einen eigenen Gefallenen', async ({}, info) => {
    test.setTimeout(240_000);
    const { bert, code } = partie;
    await nurDieser(bert, 'Bert', 'wiedergaenger');
    // Noch ist niemand gefallen: der Knopf sagt, was fehlt.
    await expect(knopf(bert, 'wiedergaenger')).toHaveAttribute('aria-label', 'Wiedergänger - zu wenig Gefallene');
    await expect(knopf(bert, 'wiedergaenger')).toHaveAttribute('data-gefallene', '0');
    await knopf(bert, 'wiedergaenger').hover();
    const tafel = bert.locator('#knopftafel');
    await expect(tafel).toContainText('Nur Haus Distelhag');
    await expect(tafel).toContainText('Ersteht aus eigenen Gefallenen – vorhanden: 0');
    await expect(tafel.locator('.kt-fehlt')).toHaveText('Zu wenig Gefallene');
    await bert.mouse.move(700, 300);

    // Zwei eigene Speerkaempfer fallen (mit Entf entlassen, bedienung AC-75).
    expect(await einheitenAufstellen(bert, code, 'Bert', 2, { x: ort.Bert.zweite.x + 4, y: ort.Bert.zweite.y + 4, art: 'speerkaempfer' })).toBe(2);
    await bert.waitForFunction(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].filter((e) => e.b === a.ich && !e.s && e.k === a.werte.einheiten.speerkaempfer.kuerzel).length === 2;
    });
    for (const opfer of await eigene(bert, 'speerkaempfer')) {
      await waehlen(bert, [opfer], { zoom: 1.8, blick: ort.Bert.zweite });
      await bert.keyboard.press('Delete');
    }
    await bert.waitForFunction(() => window.ansicht.vorraete.gefallene === 2);

    await gebaeudeWaehlen(bert, ort.Bert.burg, 1.4);
    await expect(knopf(bert, 'wiedergaenger')).toHaveAttribute('aria-label', 'Wiedergänger ausbilden (30 Gold, 1 Gefallener)');
    await expect(knopf(bert, 'wiedergaenger').locator('.gefallene')).toHaveText('2');
    const vorher = await bert.evaluate(() => ({ ...window.ansicht.vorraete }));
    const id = await ausbilden(bert, code, ort.Bert.burg, 'wiedergaenger', 12);
    expect(id, 'ein Wiedergaenger steht').toBeTruthy();
    const nachher = await bert.evaluate(() => ({ ...window.ansicht.vorraete }));
    expect([nachher.gold, nachher.gefallene, nachher.nahrung]).toEqual([vorher.gold - 30, 1, vorher.nahrung]);
    // Er steht an der Burg - nicht dort, wo die zwei fielen.
    const fern = await bert.evaluate(([id, burg]) => {
      const a = window.ansicht;
      const e = a.nachher.get(id);
      const m = a.gebaeude.get(burg);
      return Math.hypot(e.x - m.x, e.y - m.y);
    }, [id, ort.Bert.burg]);
    expect(fern).toBeLessThan(6);
    await gebaeudeWaehlen(bert, ort.Bert.burg, 1.4);
    await expect(knopf(bert, 'wiedergaenger').locator('.gefallene')).toHaveText('1');

    await reihe(bert, code, 'Bert', ort.Bert.zweite, ['langschwertkaempfer', 'wiedergaenger', 'speerkaempfer'], 3);
    const neuer = (await eigene(bert, 'wiedergaenger')).find((e) => e !== id);
    await waehlen(bert, [neuer], { zoom: 2.4, blick: ort.Bert.zweite });
    const zeigt = await leiste(bert);
    expect(zeigt.name).toBe('Wiedergänger');
    expect(zeigt.leben).toBe('60/60');
    // 1/0 aus den Daten, +1/+2 von Haus Distelhag fuer sein Fussvolk.
    expect([zeigt.angriff, zeigt.nahruestung, zeigt.fernruestung]).toEqual(['6', '2', '2']);
    expect(await figurenFrei(bert)).toEqual([]);
    expect(await bedienteileFrei(bert)).toEqual([]);
    await bert.waitForTimeout(300);
    await nachweis(bert, {
      spec: EINHEITEN,
      ac: 'AC-49',
      titel: 'Berts Reihe (Haus Distelhag): Langschwertkämpfer, der Wiedergänger – ein Untoter in zerschlissener Rüstung – und ein Speerkämpfer; gewählt der Wiedergänger: 60 Leben, 6 Angriff, Rüstung 1+1 / 0+2',
      test: info,
    });
  });
});
