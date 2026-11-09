// Der Aufstieg in die Ritterzeit und ihre drei Gebaeude (→ specs/10-strategie/
// bauen.md AC-27, AC-28): vorher fehlen Kloster, Universitaet und Werkstatt im
// Baumenue, nach dem Aufstieg stehen sie darin und lassen sich bauen.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import {
  bedienteileFrei, dorfbewohnerAnklicken, figurenFrei, gebaeudeInDerNaehe, partieBeenden, partieZuZweit, platzImBild,
} from '../helpers/strategie.mjs';
import { BAUTASTEN } from '../../public/tasten.js';

const BAUEN = '10-strategie/bauen.md';
const EINHEITEN = '10-strategie/einheiten-und-befehle.md';

test.describe('Ritterzeit', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  const baumenue = (page) => page.locator('#baumenue [data-bauen]').evaluateAll((k) => k.map((x) => x.dataset.bauen));
  const ritterGebaeude = (page) => page.evaluate(() => {
    const w = window.ansicht.werte;
    return w.einheiten.dorfbewohner.baut.filter((art) => w.gebaeude[art]?.zeitalter === 2);
  });
  const aufsteigen = async (page, code, id, stufe) => {
    await page.keyboard.press('h');
    await page.locator(`[data-aufstieg="${id}"]`).click();
    await zeitraffer(page, code, 20);
    await page.waitForFunction((s) => window.ansicht.zeitalter === s, stufe, { timeout: 60_000 });
    await zeitraffer(page, code, 1);
  };

  test('bauen AC-27 und bauen AC-28: nach dem Aufstieg in die Ritterzeit stehen Kloster, Universitaet und Werkstatt im Menue und lassen sich bauen', async ({}, info) => {
    const { anna, code } = partie;
    await rohstoffe(anna, code, 'Anna', { holz: 3000, nahrung: 3000, gold: 1000, stein: 500 });
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const neu = await ritterGebaeude(anna);
    expect(neu.length, 'die Ritterzeit kennt Gebaeude').toBeGreaterThanOrEqual(3);

    // Dunkle Zeit -> Feudalzeit: zweites Gebaeude, dann der Aufstieg.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'muehle', basis);
    await aufsteigen(anna, code, 'feudalzeit', 1);
    // In der Feudalzeit fehlen die drei.
    await dorfbewohnerAnklicken(anna);
    await anna.keyboard.press('b');
    for (const art of neu) expect(await baumenue(anna), art).not.toContain(art);
    await anna.keyboard.press('Escape');
    // Ritterzeit verweigert, solange zwei Gebaeude der Feudalzeit fehlen.
    await anna.keyboard.press('h');
    await anna.locator('[data-aufstieg="ritterzeit"]').click();
    await expect(anna.locator('#spielmeldung')).toContainText('Feudalzeit');
    // Zwei Gebaeude der Feudalzeit, dann der Aufstieg.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'schiessanlage', basis, { von: 8, bis: 16 });
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'stall', basis, { von: 8, bis: 16 });
    await aufsteigen(anna, code, 'ritterzeit', 2);
    await expect(anna.locator('#zeitalter b')).toHaveText('Ritterzeit');

    // Jetzt stehen sie im Menue - und das Kloster baut man mit seiner Taste.
    await dorfbewohnerAnklicken(anna);
    await anna.keyboard.press('b');
    const menue = await baumenue(anna);
    for (const art of neu) expect(menue, art).toContain(art);
    expect(BAUTASTEN.length, 'fuer jedes Gebaeude eine Taste').toBeGreaterThanOrEqual(menue.length);
    await anna.keyboard.press(BAUTASTEN[menue.indexOf('kloster')]);
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzieren?.art)).toBe('kloster');
    const platz = await platzImBild(anna, { n: 3, um: basis, abstand: 9, seitlich: true });
    expect(platz, 'Platz fuer das Kloster').not.toBeNull();
    await anna.mouse.click(platz.x, platz.y);
    await expect.poll(() => anna.evaluate(() => [...window.ansicht.gebaeude.values()].some((g) => g.art === 'kloster'))).toBe(true);
    const kloster = await anna.evaluate(() => {
      const g = [...window.ansicht.gebaeude.values()].find((x) => x.art === 'kloster');
      return { x: g.x, y: g.y };
    });
    // Die beiden anderen daneben, per Pruefgriff. Gebaut und fotografiert
    // werden die drei, von denen bauen AC-28 handelt - im Menue stehen alle
    // aus den Daten (oben), dort seit Runde 132 auch die Burg (bauen AC-32,
    // eigener Test in strategie-burg.spec.mjs).
    const drei = ['kloster', 'universitaet', 'belagerungswerkstatt'];
    for (const art of drei) expect(neu, art).toContain(art);
    // Mit Abstand: dicht daneben verdeckte die Werkstatt die Universitaet halb.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'universitaet', kloster, { von: 6, bis: 10 });
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'belagerungswerkstatt', kloster, { von: 6, bis: 10 });
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction((arten) => arten.every((art) => [...window.ansicht.gebaeude.values()]
      .some((g) => g.art === art && g.u === undefined)), drei, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);
    await anna.keyboard.press('Escape');

    // Das Bild: die drei in der Mitte, alle im Fenster.
    const lage = await anna.evaluate((arten) => {
      const a = window.ansicht;
      const gs = arten.map((art) => [...a.gebaeude.values()].find((g) => g.art === art));
      const mitten = gs.map((g) => a.gebaeudeMitte(g));
      a.kamera.zoom = 1.6;
      a.blickAuf(mitten.reduce((s, m) => s + m.x, 0) / 3, mitten.reduce((s, m) => s + m.y, 0) / 3);
      return mitten.map((m) => {
        const p = a.zuBild(m.x, m.y);
        return p.x > 60 && p.x < a.leinwand.clientWidth - 60 && p.y > 120 && p.y < a.leinwand.clientHeight - 200;
      });
    }, drei);
    expect(lage, 'alle drei im Bild').toEqual(drei.map(() => true));
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    for (const ac of ['AC-27', 'AC-28']) {
      await nachweis(anna, {
        spec: BAUEN,
        ac,
        titel: 'In der Ritterzeit (oben in der Leiste): Kloster mit Glockenturm, Universität mit Kuppel und Belagerungswerkstatt mit Rad',
        test: info,
      });
    }
  });

  // Haengt am Test davor: Anna ist in der Ritterzeit und hat Stall und
  // Schiessanlage.
  test('einheiten AC-33 und einheiten AC-34: der Stall bildet den Ritter aus, die Armbrust macht den Bogenschuetzen zum Armbrustschuetzen', async ({}, info) => {
    test.setTimeout(180_000);
    const { anna, code } = partie;
    await rohstoffe(anna, code, 'Anna', { holz: 2000, nahrung: 2000, gold: 2000 });
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const kuerzel = await anna.evaluate(() => {
      const e = window.ansicht.werte.einheiten;
      return { ritter: e.ritter.kuerzel, armbrust: e.armbrustschuetze.kuerzel, bogen: e.bogenschuetze.kuerzel };
    });
    // Wohnraum fuer den Ritter: mit dem Bogenschuetzen ist sie sonst voll
    // (4 von 5), und der Ritter wartete in der Schlange.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'haus', basis, { von: 6, bis: 16 });
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'haus', basis, { von: 6, bis: 16 });
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { x: basis.x + 2, y: basis.y - 6, art: 'bogenschuetze' })).toBe(1);
    const zahl = (k) => anna.evaluate((k) => [...window.ansicht.nachher.values()]
      .filter((e) => e.b === window.ansicht.ich && e.k === k && !e.s).length, k);
    const ritterVorher = await zahl(kuerzel.ritter);
    const waehlen = (art) => anna.evaluate((art) => {
      const a = window.ansicht;
      const g = [...a.gebaeude.values()].find((x) => x.b === a.ich && x.art === art);
      a.gewaehltesGebaeude = g.i;
      a.ausgewaehlt.clear();
      a.beiAuswahl();
    }, art);
    // Der Ritter aus dem Stall.
    await waehlen('stall');
    await anna.locator('[data-ausbilden="ritter"]').click();
    // Die Armbrust in der Schiessanlage.
    await waehlen('schiessanlage');
    await anna.locator('[data-ausbilden="armbrust"]').click();
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => window.ansicht.verbesserungen.includes('armbrust'), null, { timeout: 90_000 });
    await expect.poll(() => zahl(kuerzel.ritter), { timeout: 60_000 }).toBeGreaterThan(ritterVorher);
    await zeitraffer(anna, code, 1);
    expect(await zahl(kuerzel.bogen), 'kein Bogenschuetze mehr').toBe(0);
    expect(await zahl(kuerzel.armbrust), 'ein Armbrustschuetze').toBeGreaterThanOrEqual(1);

    // Beide nebeneinander auf freies Gras, dann das Bild.
    const ziel = await anna.evaluate((b) => {
      const a = window.ansicht;
      for (let r = 8; r < 35; r++) {
        // Im Sueden zuerst: dort steht im Bild nichts davor - im Norden
        // verdeckte das Haus den Ritter (Runde 123).
        for (const [dx, dy] of [[0, r], [r, r], [-r, r], [r, 0], [-r, 0]]) {
          const x = b.x + dx;
          const y = b.y + dy;
          // Ein freier Umkreis, damit kein Gebaeude hinter der Lanze steht
          // (Runde 123: sie verschwand vor einer Hauswand).
          let frei = true;
          for (let oy = -3; oy <= 6 && frei; oy++) for (let ox = -3; ox <= 7 && frei; ox++) if (!a.platzTaugt(x + ox, y + oy)) frei = false;
          if (frei) return { x, y };
        }
      }
      return null;
    }, basis);
    expect(ziel, 'freies Gras').not.toBeNull();
    await anna.evaluate(({ k, z }) => {
      const a = window.ansicht;
      const meine = [...a.nachher.values()].filter((e) => e.b === a.ich && !e.s);
      const ritter = meine.find((e) => e.k === k.ritter);
      const armbrust = meine.find((e) => e.k === k.armbrust);
      a.befehlSenden([ritter.i], z, false);
      a.befehlSenden([armbrust.i], { x: z.x + 2, y: z.y }, false);
    }, { k: kuerzel, z: ziel });
    await zeitraffer(anna, code, 8);
    await anna.waitForFunction(({ k, z }) => {
      const a = window.ansicht;
      const meine = [...a.nachher.values()].filter((e) => e.b === a.ich && !e.s);
      // Angekommen heisst: nahe am Ziel und still. Der Server stellt eine
      // Einheit auch auf ein freies Nachbarfeld (Runde 123: der Ritter stand
      // auf 61/12 statt 60/11).
      const da = (kz) => meine.some((e) => {
        const alt = a.vorher.get(e.i);
        return e.k === kz && Math.hypot(e.x - z.x - 1, e.y - z.y) < 2.5 && alt && alt.x === e.x && alt.y === e.y;
      });
      return da(k.ritter) && da(k.armbrust);
    }, { k: kuerzel, z: ziel }, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);
    await anna.keyboard.press('Escape');
    await anna.evaluate((z) => {
      const a = window.ansicht;
      a.kamera.zoom = 2.4;
      a.blickAuf(z.x + 1, z.y);
    }, ziel);
    await anna.waitForTimeout(300);
    expect(await figurenFrei(anna)).toEqual([]);
    expect(await bedienteileFrei(anna)).toEqual([]);
    for (const ac of ['AC-33', 'AC-34']) {
      await nachweis(anna, {
        spec: EINHEITEN,
        ac,
        titel: 'Links ein Ritter aus dem Stall – Pferdedecke in Spielerfarbe, Topfhelm, Lanze –, rechts ein Armbrustschütze, der Bogenschütze nach der Verbesserung Armbrust',
        test: info,
      });
    }
  });
  // Haengt an den Tests davor: Anna ist in der Ritterzeit und hat eine
  // Universitaet.
  test('bauen AC-34: Eisenguss und Bodkinpfeil erst nach ihrer Vorstufe, Mauerwerk und Stadtpatrouille - jede mit eigenem Bild', async ({}, info) => {
    test.setTimeout(180_000);
    const { anna, code } = partie;
    await rohstoffe(anna, code, 'Anna', { holz: 3000, nahrung: 3000, gold: 2000, stein: 500 });
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const schmiede = await gebaeudeInDerNaehe(anna, code, 'Anna', 'schmiede', basis, { von: 6, bis: 16 });
    // Erst warten, bis das Gebaeude beim Browser ist - der Pruefgriff legt es
    // an, der naechste Zustand bringt es.
    const waehlen = async (id, zoom = 1.8) => {
      await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), id);
      await waehlenSofort(id, zoom);
    };
    const waehlenSofort = (id, zoom) => anna.evaluate(([g, z]) => {
      const a = window.ansicht;
      a.kamera.zoom = z;
      a.gewaehltesGebaeude = g;
      a.ausgewaehlt.clear();
      const m = a.gebaeudeMitte(a.gebaeude.get(g));
      a.blickAuf(m.x, m.y);
      a.beiAuswahl();
    }, [id, zoom]);
    const meins = (art) => anna.evaluate((art) => {
      const a = window.ansicht;
      return [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === art).i;
    }, art);
    const knopf = (art) => anna.locator(`[data-ausbilden="${art}"]`);
    const forschen = async (arten) => {
      for (const art of arten) await knopf(art).click();
      await zeitraffer(anna, code, 20);
      await anna.waitForFunction((xs) => xs.every((x) => window.ansicht.verbesserungen.includes(x)), arten, { timeout: 90_000 });
      await zeitraffer(anna, code, 1);
    };

    // Vor der Vorstufe: in der Schmiede nur die beiden der Feudalzeit.
    await waehlen(schmiede);
    await expect(knopf('schmiedeangriff')).toHaveCount(1);
    await expect(knopf('befiedertePfeile')).toHaveCount(1);
    await expect(knopf('eisenguss')).toHaveCount(0);
    await expect(knopf('bodkinpfeil')).toHaveCount(0);
    await forschen(['schmiedeangriff', 'befiedertePfeile']);
    // Danach stehen die beiden der Ritterzeit an ihrer Stelle.
    await waehlen(schmiede);
    await expect(knopf('eisenguss')).toHaveAttribute('title', 'Eisenguss erforschen (220 Nahrung, 120 Gold)');
    await expect(knopf('bodkinpfeil')).toHaveAttribute('title', 'Bodkinpfeil erforschen (200 Nahrung, 100 Gold)');
    await expect(knopf('eisenguss')).toBeInViewport();
    await expect(knopf('bodkinpfeil')).toBeInViewport();
    const bild = (art) => anna.evaluate((art) => document.querySelector(`[data-ausbilden="${art}"] canvas`).toDataURL(), art);
    const bilder = { eisenguss: await bild('eisenguss'), bodkinpfeil: await bild('bodkinpfeil') };
    expect(bilder.eisenguss, 'Giesskelle und Bodkin sind verschiedene Bilder').not.toBe(bilder.bodkinpfeil);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-34',
      titel: 'Die Schmiede in der Ritterzeit nach Schmiedeangriff und Befiederten Pfeilen: Eisenguss (Gießkelle, 220 Nahrung, 120 Gold) und Bodkinpfeil (gekreuzte Pfeile, 200 Nahrung, 100 Gold)',
      test: info,
    });

    // Mauerwerk in der Universitaet: das volle Leben eines Hauses steigt um 10 %.
    const haus = await gebaeudeInDerNaehe(anna, code, 'Anna', 'haus', basis, { von: 6, bis: 16 });
    await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), haus);
    const hausWerte = () => anna.evaluate((h) => {
      const a = window.ansicht;
      const g = a.gebaeude.get(h);
      return { h: g.h, voll: a.gebaeudeLebenVoll(g) };
    }, haus);
    const vorher = await hausWerte();
    await waehlen(await meins('universitaet'));
    await expect(knopf('mauerwerk')).toHaveAttribute('title', 'Mauerwerk erforschen (175 Holz, 150 Stein)');
    bilder.mauerwerk = await bild('mauerwerk');
    await forschen(['mauerwerk']);
    await expect.poll(hausWerte).toEqual({ h: Math.round(vorher.voll * 1.1), voll: Math.round(vorher.voll * 1.1) });

    // Stadtpatrouille im Dorfzentrum: erst nach der Stadtwache.
    const zentrum = await meins('dorfzentrum');
    await waehlen(zentrum);
    await expect(knopf('stadtpatrouille')).toHaveCount(0);
    await forschen(['stadtwache']);
    await waehlen(zentrum);
    await expect(knopf('stadtpatrouille')).toHaveAttribute('title', 'Stadtpatrouille erforschen (300 Nahrung, 100 Gold)');
    bilder.stadtpatrouille = await bild('stadtpatrouille');
    // Vier Verbesserungen, vier Bilder.
    expect(new Set(Object.values(bilder)).size, 'vier verschiedene Bilder').toBe(4);
  });
});
