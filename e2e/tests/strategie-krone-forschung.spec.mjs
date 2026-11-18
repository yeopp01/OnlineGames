// Stufen und Forschung der Krone (→ specs/10-strategie/einheiten-und-befehle.md
// AC-67, AC-68; bauen.md AC-48 bis AC-50): Langbogenschuetze und schwere
// Armbrust, Belagerungsramme und Onager - jede mit eigener Figur -, die dritte
// Stufe der Schmiede, Fruchtwechsel und Zweimannsaege, und in der Universitaet
// Chemie, Bergfried, Architektur und Belagerungsingenieure, in der Burg die
// Wehrpflicht.
//
// Was die Zahlen im Kampf bedeuten, misst der Rechenteil
// (tests/strategie-krone.test.mjs); hier steht, was am Bildschirm ankommt: der
// Knopf mit eigenem Bild, die Tafel darueber, und die Werte an der Auswahl
// danach. Der Aufstieg selbst steht in strategie-krone.spec.mjs - hier beginnt
// Anna in der Krone.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import {
  bedienteileFrei, figurenFrei, freieWiesen, gebaeudeInDerNaehe, partieBeenden, partieZuZweit, waehlen,
} from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';
const EINHEITEN = '10-strategie/einheiten-und-befehle.md';

test.describe('Krone: Stufen und Forschung', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let basis;
  let wiesen;

  const reich = (mehr = {}) => rohstoffe(partie.anna, partie.code, 'Anna', { holz: 9000, nahrung: 9000, gold: 9000, stein: 3000, ...mehr });

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
    const { anna } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    await reich({ zeitalter: 3 });
    await anna.waitForFunction(() => window.ansicht.zeitalter === 3);
    await expect(anna.locator('#zeitalterwechsel')).toBeHidden({ timeout: 15_000 });
    basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    // Die Karte hat nur zwei Wiesen dieser Groesse: der dritte Fall stellt sich neben den ersten.
    wiesen = await freieWiesen(anna, 2);
    wiesen.push({ x: wiesen[0].x + 3, y: wiesen[0].y + 3 });
  });
  test.afterAll(() => partieBeenden(partie));

  const knopf = (art) => partie.anna.locator(`[data-ausbilden="${art}"]`);
  const tafel = () => partie.anna.locator('#knopftafel');
  const bauen = async (art, wo = {}) => {
    const { anna, code } = partie;
    const id = await gebaeudeInDerNaehe(anna, code, 'Anna', art, basis, { von: 7, bis: 22, ...wo });
    await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), id);
    return id;
  };
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
    await anna.waitForFunction((xs) => xs.every((x) => window.ansicht.verbesserungen.includes(x)), arten, { timeout: 180_000 });
    await zeitraffer(anna, code, 1);
    await anna.mouse.move(700, 300);
  };
  const knopfbild = (art) => partie.anna.evaluate((art) => document.querySelector(`[data-ausbilden="${art}"] canvas`).toDataURL(), art);
  /** Der Knopf traegt ein gezeichnetes Bild, und die Tafel darueber die Saetze des Servers. */
  const knopfPruefen = async (art, beschriftung, zeilen, dauer) => {
    const { anna } = partie;
    await expect(knopf(art)).toHaveAttribute('aria-label', beschriftung);
    await expect(knopf(art)).toBeInViewport({ ratio: 1 });
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
  /** Je Art eine Einheit in einer Reihe auf der Wiese, `weit` Felder auseinander. */
  const reihe = async (wiese, arten, weit = 2) => {
    const { anna, code } = partie;
    for (const [i, art] of arten.entries()) {
      const n = i - (arten.length - 1) / 2;
      expect(await einheitenAufstellen(anna, code, 'Anna', 1, { x: Math.round(wiese.x + weit * n), y: Math.round(wiese.y - weit * n), art }), art).toBe(1);
    }
    for (const art of arten) await expect.poll(() => aufDerWiese(wiese, art), art).toHaveLength(1);
  };
  const aufDerWiese = (wiese, art) => partie.anna.evaluate(([art, w]) => {
    const a = window.ansicht;
    const k = a.werte.einheiten[art].kuerzel;
    return [...a.nachher.values()].filter((e) => e.b === a.ich && !e.s && e.k === k && Math.hypot(e.x - w.x, e.y - w.y) < 8).map((e) => e.i);
  }, [art, wiese]);
  /** Was die Leiste zur Auswahl sagt. */
  const leiste = async () => ({
    name: await partie.anna.locator('.auswahl-kopf strong').textContent(),
    leben: await partie.anna.locator('.auswahl-kopf .leben').getAttribute('data-leben'),
    ...(await partie.anna.locator('#kampfwerte').evaluate((z) => ({ ...z.dataset }))),
  });
  const zeigt = async (wiese, art) => {
    const [id] = await aufDerWiese(wiese, art);
    await waehlen(partie.anna, [id], { zoom: 2.4, blick: { x: wiese.x - 1, y: wiese.y - 1 } });
    return leiste();
  };
  const eigeneTafeln = (paare) => partie.anna.evaluate(async (paare) => {
    const { gerendert } = await import('/bilder.js');
    return paare.map(([von, nach]) => gerendert(nach) !== null && gerendert(nach) !== gerendert(von));
  }, paare);

  test('einheiten AC-67: Langbogenschuetze und schwere Armbrust - beide Linien der Schiessanlage bekommen in der Krone ihre Stufe, jede mit eigener Figur', async ({}, info) => {
    test.setTimeout(300_000);
    const { anna } = partie;
    const [wiese] = wiesen;
    const schiessanlage = await bauen('schiessanlage');

    // Die Armbrust ist im Fuerstentum eine Einheit: ihre Stufe steht gleich
    // da. Der Langbogen verlangt den Bogenschuetzen des Fuerstentums.
    await gebaeudeWaehlen(schiessanlage);
    await expect(knopf('armbruststufe')).toHaveAttribute('aria-label', 'Weiterentwicklung: Armbrustschütze wird Schwere Armbrust (400 Nahrung, 350 Gold)');
    await expect(knopf('langbogenstufe'), 'erst nach dem Bogenschuetzen').toHaveCount(0);
    await forschen(['bogenstufe']);
    await gebaeudeWaehlen(schiessanlage);
    await expect(knopf('langbogenstufe')).toHaveAttribute('aria-label', 'Weiterentwicklung: Bogenschütze wird Langbogenschütze (450 Nahrung, 350 Gold)');
    for (const art of ['langbogenstufe', 'armbruststufe']) {
      await expect(knopf(art)).toHaveAttribute('data-stufe-von', art === 'langbogenstufe' ? 'bogenschuetze2' : 'armbrustschuetze');
      await expect(knopf(art)).toBeInViewport({ ratio: 1 });
    }

    await reihe(wiese, ['bogenschuetze2', 'armbrustschuetze'], 3);
    await reich();
    await gebaeudeWaehlen(schiessanlage);
    await forschen(['langbogenstufe', 'armbruststufe']);

    // Die Schiessanlage bildet die neuen aus, zum Preis der alten.
    await gebaeudeWaehlen(schiessanlage);
    await expect(knopf('langbogenschuetze')).toHaveAttribute('aria-label', 'Langbogenschütze ausbilden (30 Holz, 45 Gold)');
    await expect(knopf('schwerearmbrust')).toHaveAttribute('aria-label', 'Schwere Armbrust ausbilden (35 Holz, 55 Gold)');
    for (const art of ['bogenschuetze2', 'armbrustschuetze', 'langbogenstufe', 'armbruststufe']) await expect(knopf(art), art).toHaveCount(0);

    // Wer schon stand, ist ausgetauscht - und steht mit eigener Figur da.
    for (const [von, nach] of [['bogenschuetze2', 'langbogenschuetze'], ['armbrustschuetze', 'schwerearmbrust']]) {
      expect(await aufDerWiese(wiese, von), `kein ${von} mehr`).toEqual([]);
      expect(await aufDerWiese(wiese, nach), nach).toHaveLength(1);
    }
    expect(await eigeneTafeln([['bogenschuetze2', 'langbogenschuetze'], ['armbrustschuetze', 'schwerearmbrust']]), 'eigene Tafeln').toEqual([true, true]);

    expect(await zeigt(wiese, 'langbogenschuetze')).toMatchObject({ name: 'Langbogenschütze', leben: '40/40', angriff: '6', reichweite: '5' });
    expect(await zeigt(wiese, 'schwerearmbrust')).toMatchObject({ name: 'Schwere Armbrust', leben: '40/40', angriff: '12', reichweite: '5' });
    expect(await figurenFrei(anna)).toEqual([]);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-67',
      titel: 'Die Schützen der Krone nebeneinander: links der Langbogenschütze mit dem mannshohen Bogen, rechts die schwere Armbrust mit Winde und Eisenhut – gewählt die Armbrust: 40 Leben, 12 Angriff, Reichweite 5',
      test: info,
    });
  });

  test('einheiten AC-68: Belagerungsramme und Onager - die Werkstatt tauscht Ramme und Mangonel aus, auch die, die schon stehen', async ({}, info) => {
    test.setTimeout(300_000);
    const { anna } = partie;
    const wiese = wiesen[1];
    await reich();
    const werkstatt = await bauen('belagerungswerkstatt');
    await reihe(wiese, ['ramme', 'mangonel'], 4);

    await gebaeudeWaehlen(werkstatt);
    await expect(knopf('rammenstufe')).toHaveAttribute('aria-label', 'Weiterentwicklung: Ramme wird Belagerungsramme (1000 Nahrung)');
    await expect(knopf('onagerstufe')).toHaveAttribute('aria-label', 'Weiterentwicklung: Mangonel wird Onager (800 Nahrung, 500 Gold)');
    for (const [art, von] of [['rammenstufe', 'ramme'], ['onagerstufe', 'mangonel']]) {
      await expect(knopf(art)).toHaveAttribute('data-stufe-von', von);
      await expect(knopf(art)).toBeInViewport({ ratio: 1 });
    }
    const vorher = { ramme: await zeigt(wiese, 'ramme'), mangonel: await zeigt(wiese, 'mangonel') };
    expect(vorher.mangonel.reichweite).toBe('7');
    await gebaeudeWaehlen(werkstatt);
    await forschen(['rammenstufe', 'onagerstufe']);

    await gebaeudeWaehlen(werkstatt);
    await expect(knopf('belagerungsramme')).toHaveAttribute('aria-label', 'Belagerungsramme ausbilden (160 Holz, 75 Gold)');
    await expect(knopf('onager')).toHaveAttribute('aria-label', 'Onager ausbilden (160 Holz, 135 Gold)');
    for (const art of ['ramme', 'mangonel', 'rammenstufe', 'onagerstufe']) await expect(knopf(art), art).toHaveCount(0);
    for (const [von, nach] of [['ramme', 'belagerungsramme'], ['mangonel', 'onager']]) {
      expect(await aufDerWiese(wiese, von), `kein ${von} mehr`).toEqual([]);
      expect(await aufDerWiese(wiese, nach), nach).toHaveLength(1);
    }
    expect(await eigeneTafeln([['ramme', 'belagerungsramme'], ['mangonel', 'onager']]), 'eigene Tafeln').toEqual([true, true]);

    expect(await zeigt(wiese, 'belagerungsramme')).toMatchObject({ name: 'Belagerungsramme', leben: '270/270', angriff: '4', nahruestung: '0', fernruestung: '195' });
    expect(await zeigt(wiese, 'onager')).toMatchObject({ name: 'Onager', leben: '60/60', angriff: '55', nahruestung: '0', fernruestung: '8', reichweite: '8' });
    expect(await figurenFrei(anna)).toEqual([]);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-68',
      titel: 'Die Belagerung der Krone: links die Belagerungsramme unter dem langen Schutzdach, rechts der Onager mit dem schweren Wurfarm – gewählt der Onager: 60 Leben, 55 Angriff, Rüstung 0/8, Reichweite 8',
      test: info,
    });
  });

  test('bauen AC-48: die Schmiede der Krone - Hochofen, Armschiene und drei Ruestungen, jede erst nach ihrer Vorstufe und jede mit eigenem Bild', async ({}, info) => {
    test.setTimeout(420_000);
    const { anna } = partie;
    const wiese = wiesen[2];
    await reich();
    const schmiede = await bauen('schmiede');
    const KRONE = {
      hochofen: ['Hochofen erforschen (275 Nahrung, 225 Gold)', ['Infanterie und Kavallerie: +2 Angriff'], 100],
      armschiene: ['Armschiene erforschen (300 Nahrung, 200 Gold)', ['Bogenschützen: +1 Angriff, +1 Reichweite'], 40],
      plattenpanzer: ['Plattenpanzer erforschen (300 Nahrung, 150 Gold)', ['Infanterie: +1 / +2 Rüstung'], 70],
      plattenharnisch: ['Plattenrossharnisch erforschen (350 Nahrung, 200 Gold)', ['Kavallerie: +1 / +2 Rüstung'], 75],
      ringpanzer: ['Ringpanzer der Schützen erforschen (250 Nahrung, 250 Gold)', ['Bogenschützen: +1 / +2 Rüstung'], 70],
    };

    // Ohne Vorstufen steht keine der fuenf im Menue.
    await gebaeudeWaehlen(schmiede);
    for (const art of Object.keys(KRONE)) await expect(knopf(art), `${art} erst nach der Vorstufe`).toHaveCount(0);
    await forschen(['schmiedeangriff', 'befiedertePfeile', 'schuppenpanzer', 'schuppenharnisch', 'polsterruestung']);
    await reich();
    await gebaeudeWaehlen(schmiede);
    for (const art of Object.keys(KRONE)) await expect(knopf(art), `${art} erst nach der zweiten Stufe`).toHaveCount(0);
    await forschen(['eisenguss', 'bodkinpfeil', 'kettenpanzer', 'kettenharnisch', 'lederruestung']);
    await reich();

    // Drei Traeger auf der Wiese, mit den Werten vor der Krone. Fuer die
    // Schuetzen der Plaenkler: die Armbrust ist in dieser Partie schon
    // ausgetauscht (AC-67), er traegt dieselbe Klasse.
    const TRAEGER = ['langschwertkaempfer', 'ritter', 'plaenkler'];
    await reihe(wiese, TRAEGER, 3);
    const werte = async (art) => {
      const w = await zeigt(wiese, art);
      return [Number(w.angriff), Number(w.nahruestung), Number(w.fernruestung), Number(w.reichweite || 0)];
    };
    const vorher = {};
    for (const art of TRAEGER) vorher[art] = await werte(art);

    // Jetzt stehen die fuenf der Krone da - und nur sie.
    await gebaeudeWaehlen(schmiede);
    await expect(anna.locator('#auswahlleiste [data-ausbilden]'), 'hoechstens fuenf Knoepfe').toHaveCount(5);
    const bilder = {};
    for (const [art, [beschriftung, zeilen, dauer]] of Object.entries(KRONE)) {
      await knopfPruefen(art, beschriftung, zeilen, dauer);
      bilder[art] = await knopfbild(art);
    }
    expect(new Set(Object.values(bilder)).size, 'fuenf Verbesserungen, fuenf Bilder').toBe(5);
    await anna.mouse.move(700, 300);
    await knopf('hochofen').hover();
    await expect(tafel()).toBeVisible();
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-48',
      titel: 'Die Schmiede in der Krone nach beiden Vorstufen: Hochofen, Armschiene, Plattenpanzer, Plattenrossharnisch und Ringpanzer der Schützen, jede mit eigenem Bild; die Tafel über dem Hochofen nennt 275 Nahrung, 225 Gold, „Infanterie und Kavallerie: +2 Angriff“ und 100 Sekunden',
      test: info,
    });

    await forschen(Object.keys(KRONE));
    // Angriff, Nah, Fern, Reichweite: Schwert und Ritter +2 und +1/+2, der
    // Plaenkler +1 Angriff, +1 Reichweite und +1/+2.
    const dazu = { langschwertkaempfer: [2, 1, 2, 0], ritter: [2, 1, 2, 0], plaenkler: [1, 1, 2, 1] };
    for (const art of TRAEGER) {
      expect(await werte(art), art).toEqual(vorher[art].map((w, i) => w + dazu[art][i]));
    }
    // Die Schmiede ist leer geforscht.
    await gebaeudeWaehlen(schmiede);
    await expect(anna.locator('#auswahlleiste [data-ausbilden]')).toHaveCount(0);
  });

  test('bauen AC-49: Fruchtwechsel in der Muehle und Zweimannsaege im Holzfaellerlager - die dritte Stufe fuer Farm und Holz', async ({}, info) => {
    test.setTimeout(300_000);
    const { anna, code } = partie;
    await reich();
    const muehle = await bauen('muehle');
    const lager = await bauen('holzfaellerlager');

    await gebaeudeWaehlen(muehle);
    await expect(knopf('fruchtwechsel'), 'erst nach dem Schweren Pflug').toHaveCount(0);
    await forschen(['pferdekummet']);
    await gebaeudeWaehlen(muehle);
    await forschen(['schwererPflug']);
    await gebaeudeWaehlen(lager);
    await expect(knopf('zweimannsaege'), 'erst nach der Bogensaege').toHaveCount(0);
    await forschen(['doppelaxt']);
    await gebaeudeWaehlen(lager);
    await forschen(['bogensaege']);
    await reich();

    // Eine Farm vor dem Fruchtwechsel - an ihr misst sich die naechste.
    const alt = await bauen('farm');
    const vorrat = (id) => anna.evaluate((g) => window.ansicht.gebaeude.get(g).n, id);
    const vorher = await vorrat(alt);

    await gebaeudeWaehlen(lager);
    await knopfPruefen('zweimannsaege', 'Zweimannsäge erforschen (300 Nahrung, 200 Holz)', ['Holz wird 10 % schneller gesammelt'], 100);
    const saege = await knopfbild('zweimannsaege');
    await gebaeudeWaehlen(muehle);
    await knopfPruefen('fruchtwechsel', 'Fruchtwechsel erforschen (250 Nahrung, 250 Holz)', ['Jede neue Farm trägt 175 Nahrung mehr'], 70);
    expect(await knopfbild('fruchtwechsel'), 'zwei Bilder').not.toBe(saege);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-49',
      titel: 'Die Mühle in der Krone nach Pferdekummet und Schwerem Pflug: der Fruchtwechsel mit eigenem Bild, die Tafel darüber nennt 250 Nahrung, 250 Holz, „Jede neue Farm trägt 175 Nahrung mehr“ und 70 Sekunden',
      test: info,
    });

    await forschen(['fruchtwechsel']);
    await gebaeudeWaehlen(lager);
    await forschen(['zweimannsaege']);
    for (const [id, art] of [[muehle, 'fruchtwechsel'], [lager, 'zweimannsaege']]) {
      await gebaeudeWaehlen(id);
      await expect(knopf(art), `${art} ist erforscht`).toHaveCount(0);
    }
    // Die naechste Farm traegt 175 mehr.
    await reich();
    const neu = await bauen('farm');
    await zeitraffer(anna, code, 1);
    expect(await vorrat(neu), 'die neue Farm').toBe(vorher + 175);
  });

  test('bauen AC-50: Universitaet und Burg der Krone - der Wehrturm wird zum Bergfried mit eigenem Bild, dazu Chemie, Architektur, Belagerungsingenieure und Wehrpflicht', async ({}, info) => {
    test.setTimeout(420_000);
    const { anna } = partie;
    await reich();
    const universitaet = await bauen('universitaet');
    const turm = await bauen('wachturm', { von: 6, bis: 18 });
    const turmZeigt = async () => {
      await gebaeudeWaehlen(turm, 2);
      return leiste();
    };
    // Mit welchem Bild er steht und wie hoch es ist: der Balken des Gewaehlten
    // sitzt knapp ueber dem, was im Bild deckt.
    const turmbild = async () => {
      await gebaeudeWaehlen(turm, 2);
      await anna.waitForFunction((g) => window.ansicht.lebensbalken.some((b) => b.art === 'gebaeude' && b.i === g), turm);
      return anna.evaluate((g) => {
        const a = window.ansicht;
        const gebaeude = a.gebaeude.get(g);
        const m = a.gebaeudeMitte(gebaeude);
        const balken = a.lebensbalken.find((b) => b.art === 'gebaeude' && b.i === g);
        return { bild: a.bildart(gebaeude), hoch: Math.round(a.zuBild(m.x, m.y).y - balken.y) };
      }, turm);
    };
    const zahlen = (z) => [Number(z.leben.split('/')[1]), Number(z.angriff), Number(z.nahruestung), Number(z.fernruestung)];

    // Der Bergfried verlangt den Wehrturm, die Architektur das Mauerwerk.
    await gebaeudeWaehlen(universitaet);
    for (const art of ['bergfried', 'architektur']) await expect(knopf(art), `${art} erst nach der Vorstufe`).toHaveCount(0);
    await forschen(['wehrturm']);
    const wehr = await turmZeigt();
    expect(wehr.name).toBe('Wehrturm');
    const wehrBild = await turmbild();
    expect(wehrBild.bild).toBe('wehrturm');

    await gebaeudeWaehlen(universitaet);
    await knopfPruefen('bergfried', 'Bergfried erforschen (500 Nahrung, 350 Holz)', [/wird Bergfried: \+750 Leben, \+1 Angriff, \+1 \/ \+1 Rüstung/], 75);
    await forschen(['bergfried']);

    // Derselbe Turm heisst Bergfried, ist staerker - und steht hoeher da.
    await expect.poll(async () => (await turmZeigt()).name).toBe('Bergfried');
    const berg = await turmZeigt();
    expect(zahlen(berg), '+750 Leben, +1 Angriff, +1/+1').toEqual(zahlen(wehr).map((w, i) => w + [750, 1, 1, 1][i]));
    expect(berg.leben, 'der stehende Turm waechst mit').toBe(`${zahlen(berg)[0]}/${zahlen(berg)[0]}`);
    const bergBild = await turmbild();
    expect(bergBild.bild).toBe('bergfried');
    expect(await anna.evaluate(async () => (await import('/bilder.js')).gerendert('bergfried') !== null), 'eigene Tafel').toBe(true);
    expect(bergBild.hoch, 'der Bergfried ragt hoeher als der Wehrturm').toBeGreaterThan(wehrBild.hoch + 8);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-50',
      titel: 'Annas Turm nach der Verbesserung Bergfried: er heißt in der Leiste Bergfried, hat 750 Leben und einen Angriff mehr als der Wehrturm – und steht mit eigenem Bild da: Hurde, vier Ecktürmchen und ein steiler Helm',
      test: info,
    });

    // Chemie: alles, was Pfeile schiesst - auch der Turm.
    await gebaeudeWaehlen(universitaet);
    await knopfPruefen('chemie', 'Chemie erforschen (300 Nahrung, 200 Gold)', ['Bogenschützen: +1 Angriff', /und Burg: \+1 Angriff/], 100);
    await knopfPruefen('belagerungsingenieure', 'Belagerungsingenieure erforschen (500 Nahrung, 600 Holz)',
      ['Wurfmaschinen: +1 Reichweite', 'Belagerung: +20 % Schaden an Gebäuden'], 45);
    const bilder = { chemie: await knopfbild('chemie'), belagerungsingenieure: await knopfbild('belagerungsingenieure') };
    await expect(knopf('architektur'), 'erst nach dem Mauerwerk').toHaveCount(0);
    await forschen(['mauerwerk', 'chemie']);
    expect(Number((await turmZeigt()).angriff), 'Chemie: +1 Angriff am Turm').toBe(zahlen(berg)[1] + 1);

    await gebaeudeWaehlen(universitaet);
    await knopfPruefen('architektur', 'Architektur erforschen (300 Nahrung, 200 Holz)', ['Gebäude: +10 % Leben, +1 / +1 Rüstung'], 70);
    bilder.architektur = await knopfbild('architektur');
    expect(new Set(Object.values(bilder)).size, 'drei Verbesserungen, drei Bilder').toBe(3);
    await anna.mouse.move(700, 300);
    await knopf('belagerungsingenieure').hover();
    await expect(tafel()).toBeVisible();
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-50',
      titel: 'Die Universität in der Krone nach Wehrturm, Bergfried, Mauerwerk und Chemie: Architektur und Belagerungsingenieure mit eigenen Bildern; die Tafel über den Belagerungsingenieuren nennt „Wurfmaschinen: +1 Reichweite“ und „Belagerung: +20 % Schaden an Gebäuden“',
      test: info,
    });
    const vorArchitektur = zahlen(await turmZeigt());
    await gebaeudeWaehlen(universitaet);
    await forschen(['architektur', 'belagerungsingenieure']);
    const nachArchitektur = zahlen(await turmZeigt());
    expect(nachArchitektur.slice(2), 'Architektur: +1/+1').toEqual([vorArchitektur[2] + 1, vorArchitektur[3] + 1]);
    expect(nachArchitektur[0], 'und mehr Leben').toBeGreaterThan(vorArchitektur[0]);

    // In der Burg: die Wehrpflicht.
    await reich();
    const burg = await bauen('burg', { von: 8, bis: 24 });
    await gebaeudeWaehlen(burg, 1.4);
    await knopfPruefen('wehrpflicht', 'Wehrpflicht erforschen (150 Nahrung, 150 Gold)', ['Kaserne, Schießanlage, Stall und Burg bilden 33 % schneller aus'], 60);
    await forschen(['wehrpflicht']);
    await gebaeudeWaehlen(burg, 1.4);
    await expect(knopf('wehrpflicht')).toHaveCount(0);
  });
});
