// Die Truppenstufen der Ritterzeit (→ specs/10-strategie/einheiten-und-befehle.md
// AC-58 bis AC-62, bauen.md AC-38, AC-39): jede Einheit des Lehens bekommt im
// Fuerstentum ihre naechste Stufe, der Wachturm wird Wehrturm, die Schmiede
// ruestet jede Waffengattung in zwei Stufen. Was die Zahlen im Kampf
// bedeuten, misst der Rechenteil (tests/strategie-truppenstufen.test.mjs,
// fahrplan AC-25) - hier steht, was davon am Bildschirm ankommt.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, lebenSetzen, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import {
  bedienteileFrei, dorfbewohnerAnklicken, figurenFrei, gebaeudeInDerNaehe, partieBeenden, partieZuZweit, waehlen,
} from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';
const BEDIENUNG = '10-strategie/bedienung.md';
const EINHEITEN = '10-strategie/einheiten-und-befehle.md';

// Von links nach rechts im Bild, mit dem, was die Leiste zeigen muss - die
// Zahlen der Spec, nicht aus den Daten gelesen. Die Bildunterschrift steht
// je Stufe ganz da: `npm run check` sucht sie woertlich
// (tests/waechter-nachweis.test.mjs).
const STUFEN = [
  {
    ac: 'AC-60', von: 'speerkaempfer', nach: 'pikenier', name: 'Pikenier', leben: 55, angriff: 4, nah: 0, fern: 0,
    titel: 'Die fünf Stufen der Ritterzeit in einer Reihe: Pikenier, Langschwertkämpfer, Bogenschütze, Eliteplänkler, leichte Kavallerie – gewählt der Pikenier mit der langen Pike: 55 Leben, 4 Angriff',
  },
  {
    ac: 'AC-59', von: 'miliz', nach: 'langschwertkaempfer', name: 'Langschwertkämpfer', leben: 60, angriff: 9, nah: 1, fern: 1,
    titel: 'Die fünf Stufen der Ritterzeit in einer Reihe: Pikenier, Langschwertkämpfer, Bogenschütze, Eliteplänkler, leichte Kavallerie – gewählt der Langschwertkämpfer mit Brustplatte und Dreieckschild: 60 Leben, 9 Angriff, Rüstung 1/1',
  },
  {
    ac: 'AC-58', von: 'bogenschuetze', nach: 'bogenschuetze2', name: 'Bogenschütze', leben: 35, angriff: 5, nah: 0, fern: 0,
    titel: 'Die fünf Stufen der Ritterzeit in einer Reihe: Pikenier, Langschwertkämpfer, Bogenschütze, Eliteplänkler, leichte Kavallerie – gewählt der Bogenschütze mit Lederkoller und Federhut, vorher Kurzbogenschütze: 35 Leben, 5 Angriff, Reichweite 5',
  },
  {
    ac: 'AC-61', von: 'plaenkler', nach: 'eliteplaenkler', name: 'Eliteplänkler', leben: 35, angriff: 3, nah: 0, fern: 4,
    titel: 'Die fünf Stufen der Ritterzeit in einer Reihe: Pikenier, Langschwertkämpfer, Bogenschütze, Eliteplänkler, leichte Kavallerie – gewählt der Eliteplänkler mit Weste und Eisenschild: 35 Leben, 3 Angriff, Rüstung 0/4',
  },
  {
    ac: 'AC-62', von: 'spaeherreiter', nach: 'leichtekavallerie', name: 'Leichte Kavallerie', leben: 60, angriff: 7, nah: 0, fern: 2,
    titel: 'Die fünf Stufen der Ritterzeit in einer Reihe: Pikenier, Langschwertkämpfer, Bogenschütze, Eliteplänkler, leichte Kavallerie – gewählt die leichte Kavallerie auf dem Fuchs: 60 Leben, 7 Angriff, Rüstung 0/2',
  },
];

test.describe('Truppenstufen', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let basis;
  let wiese;
  // Alle Gebaeude legt der erste Fall an, bevor er die Wiese sucht - sonst
  // faellt ein spaeteres in die Reihe der Figuren.
  const bauten = {};

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  const reich = () => rohstoffe(partie.anna, partie.code, 'Anna', { holz: 5000, nahrung: 5000, gold: 5000, stein: 2000 });
  const aufsteigen = async (id, stufe) => {
    const { anna, code } = partie;
    await anna.keyboard.press('h');
    await anna.locator(`[data-aufstieg="${id}"]`).click();
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction((s) => window.ansicht.zeitalter === s, stufe, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);
  };
  const meins = (page, art) => page.evaluate((art) => {
    const a = window.ansicht;
    return [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === art)?.i ?? null;
  }, art);
  // Ein eigenes Gebaeude waehlen und in die Mitte holen. Erst warten, bis es
  // beim Browser ist - der Pruefgriff legt es an, der naechste Zustand bringt es.
  const gebaeudeWaehlen = async (page, id, zoom = 1.8) => {
    await page.waitForFunction((g) => window.ansicht.gebaeude.has(g), id);
    await page.evaluate(([g, z]) => {
      const a = window.ansicht;
      a.kamera.zoom = z;
      a.gewaehltesGebaeude = g;
      a.ausgewaehlt.clear();
      const m = a.gebaeudeMitte(a.gebaeude.get(g));
      a.blickAuf(m.x, m.y);
      a.beiAuswahl();
    }, [id, zoom]);
  };
  const knopf = (art) => partie.anna.locator(`[data-ausbilden="${art}"]`);
  const knopfbild = (art) => partie.anna.evaluate((art) => document.querySelector(`[data-ausbilden="${art}"] canvas`).toDataURL(), art);
  const forschen = async (arten) => {
    const { anna, code } = partie;
    for (const art of arten) await knopf(art).click();
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction((xs) => xs.every((x) => window.ansicht.verbesserungen.includes(x)), arten, { timeout: 120_000 });
    await zeitraffer(anna, code, 1);
  };
  // Die eigenen Einheiten einer Art auf der Wiese, als Ids.
  const aufDerWiese = (art) => partie.anna.evaluate(([art, w]) => {
    const a = window.ansicht;
    const k = a.werte.einheiten[art].kuerzel;
    return [...a.nachher.values()].filter((e) => e.b === a.ich && !e.s && e.k === k && Math.hypot(e.x - w.x, e.y - w.y) < 8).map((e) => e.i);
  }, [art, wiese]);
  const kampfwerte = () => partie.anna.locator('#kampfwerte').evaluate((z) => ({ ...z.dataset }));

  test('einheiten AC-58, einheiten AC-59, einheiten AC-60, einheiten AC-61 und einheiten AC-62: jede Einheit des Lehens bekommt im Fuerstentum ihre Stufe - auch die, die schon steht', async ({}, info) => {
    test.setTimeout(300_000);
    const { anna, code } = partie;
    await reich();
    basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    // Bis ins Fuerstentum: je zwei Gebaeude der Zeit, dann der Aufstieg.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'muehle', basis);
    const kaserne = await gebaeudeInDerNaehe(anna, code, 'Anna', 'kaserne', basis, { von: 7, bis: 16 });
    await aufsteigen('feudalzeit', 1);
    const schiessanlage = await gebaeudeInDerNaehe(anna, code, 'Anna', 'schiessanlage', basis, { von: 8, bis: 18 });
    const stall = await gebaeudeInDerNaehe(anna, code, 'Anna', 'stall', basis, { von: 8, bis: 18 });
    bauten.schmiede = await gebaeudeInDerNaehe(anna, code, 'Anna', 'schmiede', basis, { von: 8, bis: 20 });
    bauten.turm = await gebaeudeInDerNaehe(anna, code, 'Anna', 'wachturm', basis, { von: 6, bis: 20 });

    // Im Lehen steht noch keine Stufe des Fuerstentums im Menue.
    await gebaeudeWaehlen(anna, kaserne);
    await expect(knopf('soldatenstufe')).toHaveCount(1);
    await expect(knopf('pikenierstufe')).toHaveCount(0);
    await gebaeudeWaehlen(anna, schiessanlage);
    await expect(knopf('bogenschuetze')).toHaveAttribute('aria-label', 'Kurzbogenschütze ausbilden (30 Holz, 45 Gold)');
    for (const art of ['bogenstufe', 'eliteplaenklerstufe', 'armbrustschuetze']) await expect(knopf(art), art).toHaveCount(0);
    await aufsteigen('ritterzeit', 2);
    await reich();
    bauten.universitaet = await gebaeudeInDerNaehe(anna, code, 'Anna', 'universitaet', basis, { von: 8, bis: 20 });
    for (const id of [kaserne, schiessanlage, stall, ...Object.values(bauten)]) {
      await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), id);
    }

    // Die fuenf Vorstufen in einer Reihe quer durchs Bild: auf Gras, und kein
    // Gebaeude naeher als neun Felder.
    wiese = await anna.evaluate((b) => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const mitten = [...a.gebaeude.values()].map((x) => a.gebaeudeMitte(x));
      for (let r = 8; r < 34; r++) {
        for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [0, 1], [-1, 0], [0, -1]]) {
          const x = b.x + r * sx;
          const y = b.y + r * sy;
          if (x <= 7 || y <= 7 || x >= g - 8 || y >= g - 8) continue;
          let gras = true;
          for (let oy = -6; oy <= 6 && gras; oy++) for (let ox = -6; ox <= 6 && gras; ox++) if (a.karte.felder[(y + oy) * g + (x + ox)] !== 0) gras = false;
          if (gras && mitten.every((m) => Math.hypot(m.x - x, m.y - y) > 9)) return { x, y };
        }
      }
      return null;
    }, basis);
    expect(wiese, 'eine freie Wiese').not.toBeNull();
    for (const [i, stufe] of STUFEN.entries()) {
      const n = i - 2;
      // Der Pruefgriff stellt einen Schritt daneben auf; die Reihe bleibt eine Reihe.
      expect(await einheitenAufstellen(anna, code, 'Anna', 1, { x: wiese.x + 2 * n, y: wiese.y - 2 * n, art: stufe.von }), stufe.von).toBe(1);
    }
    await anna.waitForFunction(([arten, w]) => {
      const a = window.ansicht;
      return arten.every((art) => [...a.nachher.values()].some((e) => e.b === a.ich && e.k === a.werte.einheiten[art].kuerzel
        && Math.hypot(e.x - w.x, e.y - w.y) < 8));
    }, [STUFEN.map((s) => s.von), wiese]);

    // Im Fuerstentum: die Stufen stehen im Menue, die dritte der Miliz erst
    // nach der zweiten - und der Armbrustschuetze als eigene Einheit (AC-34).
    await gebaeudeWaehlen(anna, kaserne);
    await expect(knopf('pikenierstufe')).toHaveAttribute('aria-label', 'Weiterentwicklung: Speerkämpfer wird Pikenier (160 Nahrung, 90 Gold)');
    await expect(knopf('langschwertstufe'), 'erst nach der Soldatenstufe').toHaveCount(0);
    await forschen(['soldatenstufe', 'pikenierstufe']);
    await gebaeudeWaehlen(anna, kaserne);
    await expect(knopf('langschwertstufe')).toHaveAttribute('aria-label', 'Weiterentwicklung: Soldat wird Langschwertkämpfer (150 Nahrung, 65 Gold)');
    await forschen(['langschwertstufe']);
    await gebaeudeWaehlen(anna, schiessanlage);
    await expect(knopf('bogenstufe')).toHaveAttribute('aria-label', 'Weiterentwicklung: Kurzbogenschütze wird Bogenschütze (125 Nahrung, 75 Gold)');
    await expect(knopf('eliteplaenklerstufe')).toHaveAttribute('aria-label', 'Weiterentwicklung: Plänkler wird Eliteplänkler (230 Holz, 130 Gold)');
    await expect(knopf('armbrustschuetze')).toHaveAttribute('aria-label', 'Armbrustschütze ausbilden (35 Holz, 55 Gold)');
    await forschen(['bogenstufe', 'eliteplaenklerstufe']);
    await gebaeudeWaehlen(anna, stall);
    await expect(knopf('kavalleriestufe')).toHaveAttribute('aria-label', 'Weiterentwicklung: Späherreiter wird Leichte Kavallerie (150 Nahrung, 50 Gold)');
    await forschen(['kavalleriestufe']);

    // Danach bilden die Gebaeude die neue Stufe aus, zum Preis der alten -
    // und der Armbrustschuetze steht weiter daneben.
    await gebaeudeWaehlen(anna, kaserne);
    await expect(knopf('langschwertkaempfer')).toHaveAttribute('aria-label', 'Langschwertkämpfer ausbilden (60 Nahrung, 20 Gold)');
    await expect(knopf('pikenier')).toHaveAttribute('aria-label', 'Pikenier ausbilden (35 Nahrung, 25 Holz)');
    for (const art of ['miliz', 'soldat', 'speerkaempfer', 'soldatenstufe', 'langschwertstufe', 'pikenierstufe']) await expect(knopf(art), art).toHaveCount(0);
    await gebaeudeWaehlen(anna, schiessanlage);
    await expect(knopf('bogenschuetze2')).toHaveAttribute('aria-label', 'Bogenschütze ausbilden (30 Holz, 45 Gold)');
    await expect(knopf('eliteplaenkler')).toHaveAttribute('aria-label', 'Eliteplänkler ausbilden (25 Nahrung, 35 Holz)');
    await expect(knopf('armbrustschuetze')).toHaveCount(1);
    await gebaeudeWaehlen(anna, stall);
    await expect(knopf('leichtekavallerie')).toHaveAttribute('aria-label', 'Leichte Kavallerie ausbilden (80 Nahrung)');
    await expect(knopf('ritter')).toHaveCount(1);

    // Wer schon stand, ist ausgetauscht: von keiner Vorstufe steht noch eine.
    for (const stufe of STUFEN) {
      expect(await aufDerWiese(stufe.von), `kein ${stufe.von} mehr`).toEqual([]);
      expect((await aufDerWiese(stufe.nach)).length, stufe.nach).toBe(1);
    }

    // Je Stufe ein Bild: alle fuenf in der Reihe, die eine gewaehlt - Name,
    // Leben und Kampfwerte stehen in der Leiste.
    for (const stufe of STUFEN) {
      const [id] = await aufDerWiese(stufe.nach);
      await waehlen(anna, [id], { zoom: 2.4, blick: { x: wiese.x - 1, y: wiese.y - 1 } });
      await expect(anna.locator('.auswahl-kopf strong')).toHaveText(stufe.name);
      await expect(anna.locator('.auswahl-kopf .leben')).toHaveAttribute('data-leben', `${stufe.leben}/${stufe.leben}`);
      const werte = await kampfwerte();
      expect([werte.angriff, werte.nahruestung, werte.fernruestung], stufe.name)
        .toEqual([String(stufe.angriff), String(stufe.nah), String(stufe.fern)]);
      const imBild = await anna.evaluate((w) => {
        const a = window.ansicht;
        return [...a.nachher.values()].filter((e) => e.b === a.ich && !e.s && Math.hypot(e.x - w.x, e.y - w.y) < 8).map((e) => {
          const p = a.zuBild(e.x, e.y);
          return p.x > 60 && p.x < a.leinwand.clientWidth - 60 && p.y > 140 && p.y < a.leinwand.clientHeight - 230;
        });
      }, wiese);
      expect(imBild, 'alle fuenf im Bild').toEqual([true, true, true, true, true]);
      expect(await figurenFrei(anna)).toEqual([]);
      expect(await bedienteileFrei(anna)).toEqual([]);
      await anna.waitForTimeout(300);
      await nachweis(anna, {
        spec: EINHEITEN,
        ac: stufe.ac,
        titel: stufe.titel,
        test: info,
      });
    }
  });

  // Haengt am Test davor: Anna ist im Fuerstentum.
  test('bauen AC-38: die Universitaet macht aus dem Wachturm den Wehrturm - auch aus dem, der schon steht, und nur bei dem, der geforscht hat', async ({}, info) => {
    test.setTimeout(180_000);
    const { anna, bert, code } = partie;
    await reich();
    const { universitaet, turm } = bauten;
    const bertBasis = await bert.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const bertTurm = await gebaeudeInDerNaehe(bert, code, 'Bert', 'wachturm', bertBasis, { von: 6, bis: 20 });

    const turmZeigt = async (page, id) => {
      await gebaeudeWaehlen(page, id, 2);
      return {
        name: await page.locator('.auswahl-kopf strong').textContent(),
        leben: await page.locator('.auswahl-kopf .leben').getAttribute('data-leben'),
        ...(await page.locator('#kampfwerte').evaluate((z) => ({ ...z.dataset }))),
      };
    };
    // Mit welchem Bild er steht und wie hoch es ist: der Balken des Gewaehlten
    // sitzt knapp ueber dem, was im Bild deckt.
    const turmbild = async (page, id) => {
      await gebaeudeWaehlen(page, id, 2);
      await page.waitForFunction((g) => window.ansicht.lebensbalken.some((b) => b.art === 'gebaeude' && b.i === g), id);
      return page.evaluate((g) => {
        const a = window.ansicht;
        const gebaeude = a.gebaeude.get(g);
        const m = a.gebaeudeMitte(gebaeude);
        const balken = a.lebensbalken.find((b) => b.art === 'gebaeude' && b.i === g);
        return { bild: a.bildart(gebaeude), hoch: Math.round(a.zuBild(m.x, m.y).y - balken.y) };
      }, id);
    };
    const vorher = await turmZeigt(anna, turm);
    expect(vorher.name).toBe('Wachturm');
    const bildVorher = await turmbild(anna, turm);
    expect(bildVorher.bild).toBe('wachturm');
    const voll = Number(vorher.leben.split('/')[1]);
    expect(vorher.leben).toBe(`${voll}/${voll}`);
    // Beschaedigt: der Wehrturm gibt 480 dazu, nicht das volle Leben.
    await lebenSetzen(anna, code, turm, 500);
    await expect.poll(async () => (await turmZeigt(anna, turm)).leben).toBe(`500/${voll}`);

    await gebaeudeWaehlen(anna, universitaet);
    await expect(knopf('wehrturm')).toHaveAttribute('aria-label', 'Wehrturm erforschen (100 Nahrung, 250 Holz)');
    await forschen(['wehrturm']);

    await expect.poll(async () => (await turmZeigt(anna, turm)).name).toBe('Wehrturm');
    const nachher = await turmZeigt(anna, turm);
    expect(nachher.leben, '+480, auch am beschaedigten Turm').toBe(`980/${voll + 480}`);
    expect(Number(nachher.angriff), '+2 Angriff').toBe(Number(vorher.angriff) + 2);
    expect(Number(nachher.nahruestung), '+1 Nahruestung').toBe(Number(vorher.nahruestung) + 1);
    expect(Number(nachher.fernruestung), '+1 Fernruestung').toBe(Number(vorher.fernruestung) + 1);
    expect(nachher.reichweite, 'die Reichweite bleibt').toBe(vorher.reichweite);
    // Er steht mit seinem eigenen Bild da, und das ist hoeher.
    const bildNachher = await turmbild(anna, turm);
    expect(bildNachher.bild).toBe('wehrturm');
    expect(bildNachher.hoch, 'der Wehrturm ragt hoeher als der Wachturm').toBeGreaterThan(bildVorher.hoch + 8);
    // Bert hat nicht geforscht: sein Turm bleibt ein Wachturm.
    expect((await turmZeigt(bert, bertTurm)).name).toBe('Wachturm');
    expect((await turmbild(bert, bertTurm)).bild).toBe('wachturm');
    // Und im Baumenue heisst er bei Anna jetzt Wehrturm.
    await dorfbewohnerAnklicken(anna);
    await anna.keyboard.press('b');
    await expect(anna.locator('#baumenue [data-bauen="wachturm"]')).toHaveAttribute('aria-label', /^Wehrturm /);
    await anna.keyboard.press('Escape');
    await anna.keyboard.press('Escape');

    await turmZeigt(anna, turm);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-38',
      titel: 'Annas Turm nach der Verbesserung Wehrturm: er heißt in der Leiste Wehrturm, hat 480 Leben mehr (980 von 1500, vorher beschädigt auf 500) und 7 statt 5 Angriff – und er steht mit eigenem Bild da, höher als der Wachturm',
      test: info,
    });
  });

  // Haengt an den Tests davor: Anna ist im Fuerstentum und hat die Stufen auf der Wiese.
  test('bauen AC-39: die Schmiede ruestet Infanterie, Kavallerie und Schuetzen in zwei Stufen - die zweite erst nach der ersten, jede mit eigenem Bild', async ({}, info) => {
    test.setTimeout(180_000);
    const { anna, code } = partie;
    await reich();
    const { schmiede } = bauten;
    const ERSTE = {
      schuppenpanzer: 'Schuppenpanzer erforschen (100 Nahrung)',
      schuppenharnisch: 'Schuppenrossharnisch erforschen (150 Nahrung)',
      polsterruestung: 'Gepolsterte Schützenrüstung erforschen (100 Nahrung)',
    };
    const ZWEITE = {
      kettenpanzer: 'Kettenpanzer erforschen (200 Nahrung, 100 Gold)',
      kettenharnisch: 'Kettenrossharnisch erforschen (250 Nahrung, 150 Gold)',
      lederruestung: 'Lederne Schützenrüstung erforschen (150 Nahrung, 150 Gold)',
    };
    const ruestung = async (art) => {
      const [id] = await aufDerWiese(art);
      await waehlen(anna, [id]);
      const w = await kampfwerte();
      return [Number(w.nahruestung), Number(w.fernruestung)];
    };
    const TRAEGER = ['langschwertkaempfer', 'pikenier', 'leichtekavallerie', 'bogenschuetze2', 'eliteplaenkler'];
    const vorher = {};
    for (const art of TRAEGER) vorher[art] = await ruestung(art);

    // Erst die drei ersten Stufen, die zweiten fehlen.
    await gebaeudeWaehlen(anna, schmiede);
    const bilder = {};
    for (const [art, text] of Object.entries(ERSTE)) {
      await expect(knopf(art)).toHaveAttribute('aria-label', text);
      bilder[art] = await knopfbild(art);
    }
    for (const art of Object.keys(ZWEITE)) await expect(knopf(art), art).toHaveCount(0);
    for (const art of ['schmiedeangriff', 'befiedertePfeile']) bilder[art] = await knopfbild(art);
    await expect(anna.locator('#auswahlleiste [data-ausbilden]'), 'hoechstens fuenf Knoepfe').toHaveCount(5);
    await forschen(Object.keys(ERSTE));

    // Jede Gattung +1 / +1 - auch wer schon steht.
    for (const art of TRAEGER) expect(await ruestung(art), art).toEqual([vorher[art][0] + 1, vorher[art][1] + 1]);

    // Jetzt stehen die zweiten an ihrer Stelle.
    await gebaeudeWaehlen(anna, schmiede);
    for (const [art, text] of Object.entries(ZWEITE)) {
      await expect(knopf(art)).toHaveAttribute('aria-label', text);
      await expect(knopf(art)).toBeInViewport();
      bilder[art] = await knopfbild(art);
    }
    await expect(anna.locator('#auswahlleiste [data-ausbilden]'), 'hoechstens fuenf Knoepfe').toHaveCount(5);
    expect(new Set(Object.values(bilder)).size, 'acht Verbesserungen, acht Bilder').toBe(8);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-39',
      titel: 'Die Schmiede im Fürstentum nach den ersten Rüstungen: neben Schmiedeangriff und Befiederten Pfeilen stehen Kettenpanzer, Kettenrossharnisch und Lederne Schützenrüstung, jede mit eigenem Bild',
      test: info,
    });

    await forschen(Object.keys(ZWEITE));
    for (const art of TRAEGER) expect(await ruestung(art), art).toEqual([vorher[art][0] + 2, vorher[art][1] + 2]);
  });
});

// Rueckmeldung aus dem Spiel (2026-11-17): "die Weiterentwicklung z.B. vom
// Eliteplaenkler sollte klar als weiterentwicklung ersichtlich sein - und
// eher unterhalb vom Plaenkler, sodass das etwas zugeordnet ist".
test.describe('Weiterentwicklungen in der Leiste', () => {
  let partie;
  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-80: der Eliteplaenkler steht unter dem Plaenkler, mit einem Pfeil hinauf - und ist er erforscht, bleibt jeder Knopf, wo er war', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, code } = partie;
    await rohstoffe(anna, code, 'Anna', { holz: 5000, nahrung: 5000, gold: 5000, stein: 2000, zeitalter: 2 });
    await anna.waitForFunction(() => window.ansicht.zeitalter === 2);
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const schiessanlage = await gebaeudeInDerNaehe(anna, code, 'Anna', 'schiessanlage', basis, { von: 7, bis: 16 });
    const schmiede = await gebaeudeInDerNaehe(anna, code, 'Anna', 'schmiede', basis, { von: 7, bis: 18 });
    const waehle = async (id) => {
      await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), id);
      await anna.evaluate((g) => {
        const a = window.ansicht;
        a.kamera.zoom = 1.8;
        a.gewaehltesGebaeude = g;
        a.ausgewaehlt.clear();
        const m = a.gebaeudeMitte(a.gebaeude.get(g));
        a.blickAuf(m.x, m.y);
        a.beiAuswahl();
      }, id);
    };
    const knopf = (art) => anna.locator(`[data-ausbilden="${art}"]`);
    const lage = async (art) => {
      const r = await knopf(art).boundingBox();
      return { links: Math.round(r.x), oben: Math.round(r.y), rechts: Math.round(r.x + r.width), unten: Math.round(r.y + r.height) };
    };

    // Die Schmiede hat keine Weiterentwicklung: ihre Forschungen stehen in
    // der Reihe wie bisher (bedienung AC-65).
    await waehle(schmiede);
    await expect(knopf('schmiedeangriff')).toHaveCount(1);
    await expect(anna.locator('#auswahlleiste .stufe')).toHaveCount(0);
    await expect(anna.locator('#auswahlleiste .spalte')).toHaveCount(0);

    // Die Schiessanlage im Fuerstentum: drei Einheiten in einer Reihe, unter
    // Kurzbogenschuetze und Plaenkler je ihre Weiterentwicklung, unter dem
    // Armbrustschuetzen nichts.
    await waehle(schiessanlage);
    await expect(knopf('eliteplaenklerstufe')).toHaveAttribute('aria-label', 'Weiterentwicklung: Plänkler wird Eliteplänkler (230 Holz, 130 Gold)');
    await expect(knopf('eliteplaenklerstufe')).toHaveClass(/stufe/);
    const paare = [['bogenschuetze', 'bogenstufe'], ['plaenkler', 'eliteplaenklerstufe']];
    for (const [einheit, stufe] of paare) {
      const oben = await lage(einheit);
      const unten = await lage(stufe);
      expect(unten.oben, `${stufe} steht unter ${einheit}`).toBeGreaterThanOrEqual(oben.unten);
      expect(unten.oben - oben.unten, 'und dicht darunter').toBeLessThan(16);
      expect([unten.links, unten.rechts], 'in derselben Spalte').toEqual([oben.links, oben.rechts]);
      expect(unten.unten - unten.oben, 'flacher als die Einheit').toBeLessThan((oben.unten - oben.oben) * 0.6);
      // Der Pfeil sitzt zwischen beiden und zeigt hinauf.
      const pfeil = await knopf(stufe).locator('.stufenpfeil').boundingBox();
      expect(pfeil.y, 'der Pfeil beginnt ueber dem Knopf').toBeLessThan(unten.oben);
      expect(pfeil.y, 'und unter der Einheit').toBeGreaterThanOrEqual(oben.unten - 1);
    }
    const reihe = await Promise.all(['bogenschuetze', 'plaenkler', 'armbrustschuetze'].map(lage));
    expect(new Set(reihe.map((r) => r.oben)).size, 'die Einheiten stehen in einer Reihe').toBe(1);
    await expect(knopf('armbrustschuetze').locator('xpath=..').locator('.stufe'), 'der Armbrustschuetze hat keine').toHaveCount(0);
    for (const art of ['bogenstufe', 'eliteplaenklerstufe']) await expect(knopf(art)).toBeInViewport({ ratio: 1 });

    // Die Tafel ueber dem Knopf nennt es beim Namen (bedienung AC-55).
    await knopf('eliteplaenklerstufe').hover();
    const tafel = anna.locator('#knopftafel');
    await expect(tafel).toBeVisible();
    await expect(tafel).toContainText('Weiterentwicklung: Eliteplänkler');
    await expect(tafel).toContainText('Plänkler wird Eliteplänkler');
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-80',
      titel: 'Die Schießanlage im Fürstentum: unter Kurzbogenschütze und Plänkler steht je ihre Weiterentwicklung mit goldenem Pfeil hinauf, unter dem Armbrustschützen nichts – die Tafel nennt „Weiterentwicklung: Eliteplänkler“',
      test: info,
    });

    // Erforscht: der Plaenkler ist der Eliteplaenkler, und kein Knopf hat
    // sich bewegt - der Platz darunter bleibt leer stehen (bedienung AC-54).
    const vorher = { plaenkler: await lage('plaenkler'), armbrust: await lage('armbrustschuetze'), bogenstufe: await lage('bogenstufe') };
    await knopf('eliteplaenklerstufe').click();
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => window.ansicht.verbesserungen.includes('eliteplaenklerstufe'), null, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);
    await waehle(schiessanlage);
    await expect(knopf('eliteplaenklerstufe')).toHaveCount(0);
    await expect(knopf('eliteplaenkler')).toHaveCount(1);
    expect(await lage('eliteplaenkler'), 'der Eliteplaenkler steht, wo der Plaenkler stand').toEqual(vorher.plaenkler);
    expect(await lage('armbrustschuetze')).toEqual(vorher.armbrust);
    expect(await lage('bogenstufe')).toEqual(vorher.bogenstufe);
  });
});
