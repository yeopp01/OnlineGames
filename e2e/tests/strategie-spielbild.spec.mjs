// Das Spielbild des Strategiespiels, zum ersten Mal im Browser gesehen
// (→ specs/10-strategie/bedienung.md, fahrplan.md AC-2).
//
// Zwei Fenster, Anna eroeffnet mit festem Startwert, Bert tritt bei, Anna
// startet. Die Faelle bauen aufeinander auf und laufen nacheinander.
//
// Die Leinwand laesst sich nicht befragen. Gelesen wird deshalb ueber
// `window.ansicht` (public/app.js); befohlen wird nur ueber Maus und Tastatur,
// so wie ein Mensch es tut.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { ANMELDUNG, expect, fehlerSammeln, test } from '../helpers/seite.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';
const FAHRPLAN = '10-strategie/fahrplan.md';
const AUSWAHL = '00-plattform/spielauswahl.md';
const STARTWERT = 4711;
const WALD = 1;

/** Die eigenen Einheiten mit ihrer Lage auf dem Bildschirm. */
const eigeneImBild = (page) => page.evaluate(() => {
  const a = window.ansicht;
  return [...a.nachher.values()]
    .filter((e) => e.b === a.ich)
    .map((e) => ({ id: e.i, ...a.zuBild(e.x, e.y) }));
});

const auswahl = (page) => page.evaluate(() => [...window.ansicht.ausgewaehlt]);

/** Einen Rahmen um alle eigenen Einheiten ziehen; `offen` laesst die Taste gedrueckt. */
async function rahmenUmAlle(page, { offen = false } = {}) {
  const eigene = await eigeneImBild(page);
  const xs = eigene.map((e) => e.x);
  const ys = eigene.map((e) => e.y);
  await page.mouse.move(Math.min(...xs) - 30, Math.min(...ys) - 30);
  await page.mouse.down();
  await page.mouse.move(Math.max(...xs) + 30, Math.max(...ys) + 30, { steps: 8 });
  if (!offen) await page.mouse.up();
  return eigene;
}

test.describe('Das Spielbild', () => {
  test.describe.configure({ mode: 'serial' });

  let anna;
  let bert;
  const fehler = [];

  test.beforeAll(async ({ browser }, info) => {
    const optionen = { baseURL: info.project.use.baseURL, viewport: { width: 1400, height: 950 }, locale: 'de-DE' };
    anna = await (await browser.newContext({ ...optionen, storageState: ANMELDUNG })).newPage();
    bert = await (await browser.newContext(optionen)).newPage();
    fehler.push(fehlerSammeln(anna), fehlerSammeln(bert));

    await anna.goto('/');
    await anna.locator('[data-oeffnen="strategie"]').click();
    await anna.locator('[data-einstellung="startwert"]').fill(String(STARTWERT));
    await anna.locator('[data-eroeffnen="strategie"]').click();
    await expect(anna.locator('#raumcode')).toHaveText(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
    const code = (await anna.locator('#raumcode').textContent()).trim();

    await bert.goto('/');
    await bert.locator('#name').fill('Bert');
    await bert.locator('#code').fill(code);
    await bert.locator('#beitreten').click();
    await expect(anna.locator('#spielerliste li')).toHaveCount(2);

    await anna.locator('#starten').click();
    for (const seite of [anna, bert]) {
      await expect(seite.locator('#brett')).toBeVisible();
      await seite.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    }
  });

  test.afterAll(async () => {
    expect(fehler.flat(), 'Eine der Seiten hat Fehler gemeldet').toEqual([]);
    await anna?.context().close();
    await bert?.context().close();
  });

  test('auswahl AC-7: nach dem Start steht der Startwert der Karte im Bild', async ({}, info) => {
    await expect(anna.locator('#kartenwert')).toHaveText(`· Karte ${STARTWERT}`);
    await expect(bert.locator('#kartenwert')).toHaveText(`· Karte ${STARTWERT}`);
    await nachweis(bert, {
      spec: AUSWAHL,
      ac: 'AC-7',
      titel: 'Bert im Spiel: oben links neben den Vorraeten Karte 4711 - wiederholbar',
      test: info,
    });
  });

  test('bedienung AC-1: ein Rahmen waehlt die eigenen Einheiten darin', async ({}, info) => {
    const eigene = await rahmenUmAlle(anna, { offen: true });
    expect(eigene.length).toBe(5);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-1',
      titel: 'Anna zieht einen Rahmen um ihre fuenf Sammler, noch mit gedrueckter Taste',
      test: info,
    });
    await anna.mouse.up();
    expect((await auswahl(anna)).sort()).toEqual(eigene.map((e) => e.id).sort());
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-1',
      titel: 'Losgelassen: alle fuenf stehen auf der weissen Auswahlellipse',
      test: info,
    });
  });

  test('bedienung AC-2: ein Klick waehlt genau eine', async ({}, info) => {
    const [erste] = await eigeneImBild(anna);
    await anna.mouse.click(erste.x + 2, erste.y + 1);
    expect(await auswahl(anna)).toEqual([erste.id]);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-2',
      titel: 'Ein Klick auf einen Dorfbewohner: nur er steht auf der Auswahlellipse',
      test: info,
    });
  });

  test('bedienung AC-8: das Rad zoomt, der Punkt unter dem Zeiger bleibt stehen', async ({}, info) => {
    const zeiger = { x: 900, y: 400 };
    const lesen = () => anna.evaluate(({ x, y }) => ({ welt: window.ansicht.zuWelt(x, y), zoom: window.ansicht.kamera.zoom }), zeiger);
    const vorher = await lesen();
    await anna.mouse.move(zeiger.x, zeiger.y);
    for (let i = 0; i < 3; i++) await anna.mouse.wheel(0, -100);
    await anna.waitForFunction((z) => window.ansicht.kamera.zoom > z * 1.5, vorher.zoom);
    const nachher = await lesen();
    expect(Math.abs(nachher.welt.x - vorher.welt.x)).toBeLessThan(0.01);
    expect(Math.abs(nachher.welt.y - vorher.welt.y)).toBeLessThan(0.01);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-8',
      titel: 'Dreimal am Rad gedreht: Felder und Sammler gross, derselbe Punkt unter dem Zeiger',
      test: info,
    });
    for (let i = 0; i < 3; i++) await anna.mouse.wheel(0, 100);
    await anna.waitForFunction((z) => Math.abs(window.ansicht.kamera.zoom - z) < 0.01, vorher.zoom);
  });

  test('bedienung AC-7: W A S D und Pfeiltasten schieben die Karte', async ({}, info) => {
    const start = await anna.evaluate(() => ({ ...window.ansicht.kamera }));
    await anna.keyboard.down('d');
    await anna.waitForFunction((x) => window.ansicht.kamera.x > x + 150, start.x);
    await anna.keyboard.up('d');
    await anna.keyboard.down('ArrowDown');
    await anna.waitForFunction((y) => window.ansicht.kamera.y > y + 150, start.y);
    await anna.keyboard.up('ArrowDown');
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-7',
      titel: 'Mit D und Pfeil runter verschoben: die eigene Basis ist nach links oben gewandert',
      test: info,
    });

    // Zurueck zur Basis, fuer die naechsten Faelle.
    await anna.keyboard.down('a');
    await anna.waitForFunction((x) => window.ansicht.kamera.x <= x, start.x);
    await anna.keyboard.up('a');
    await anna.keyboard.down('w');
    await anna.waitForFunction((y) => window.ansicht.kamera.y <= y, start.y);
    await anna.keyboard.up('w');
  });

  test('bedienung AC-12 / bedienung AC-16 / fahrplan AC-2: Rechtsklick auf den Wald, gesammelt wird sichtbar', async ({}, info) => {
    // Wie viel Holz vorher da ist: seit dem Startvorrat (karte AC-12) nicht null.
    const holzVorher = await anna.evaluate(() => window.ansicht.vorraete.holz);
    await rahmenUmAlle(anna);
    expect((await auswahl(anna)).length).toBe(5);

    // Rechts auf das Waldfeld, das der eigenen Basis am naechsten liegt.
    const wald = await anna.evaluate((art) => {
      const a = window.ansicht;
      const basis = a.spieler.get(a.ich).basis;
      const g = a.karte.groesse;
      let bestes = null;
      for (let y = 0; y < g; y++) {
        for (let x = 0; x < g; x++) {
          if (a.karte.felder[y * g + x] !== art) continue;
          const abstand = Math.hypot(x - basis.x, y - basis.y);
          if (!bestes || abstand < bestes.abstand) bestes = { x, y, abstand };
        }
      }
      return a.zuBild(bestes.x, bestes.y);
    }, WALD);
    await anna.mouse.click(wald.x, wald.y, { button: 'right' });

    // Der Befehl hat gewirkt: Sammler tragen Holz.
    await anna.waitForFunction(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].some((e) => e.b === a.ich && e.l > 0 && e.a === 'h');
    }, null, { timeout: 20_000 });
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-12',
      titel: 'Nach einem Rechtsklick auf den Wald: die ausgewaehlten Sammler arbeiten dort',
      test: info,
    });
    // Fuer die Ladung ohne Auswahlring und naeher dran: ein Klick ins Leere
    // hebt die Auswahl auf, das Rad holt die Sammler heran.
    const leer = await anna.evaluate(() => window.ansicht.zuBild(window.ansicht.spieler.get(window.ansicht.ich).basis.x, window.ansicht.spieler.get(window.ansicht.ich).basis.y + 6));
    await anna.mouse.click(leer.x, leer.y);
    expect(await auswahl(anna)).toEqual([]);
    const mitte = await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      return a.zuBild(b.x + 2, b.y);
    });
    await anna.mouse.move(mitte.x, mitte.y);
    for (let i = 0; i < 5; i++) await anna.mouse.wheel(0, -100);
    await anna.waitForFunction(() => window.ansicht.kamera.zoom > 1.9);
    await anna.waitForFunction(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].filter((e) => e.b === a.ich && e.l > 0 && e.a === 'h').length >= 2;
    }, null, { timeout: 20_000 });
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-16',
      titel: 'Nah herangeholt: beladene Dorfbewohner tragen ein Holzbuendel auf dem Ruecken',
      test: info,
    });
    for (let i = 0; i < 5; i++) await anna.mouse.wheel(0, 100);
    await anna.waitForFunction(() => window.ansicht.kamera.zoom < 1.01);

    // Und das Holz kommt an - bei Anna im Vorrat, bei Bert sichtbar als Bewegung.
    // Gewartet wird, bis der Vorrat ueber dem Startwert steht - ein Muster wie
    // "Holz [1-9]" traefe schon den Startvorrat und bewiese nichts.
    await anna.waitForFunction((vorher) => window.ansicht.vorraete.holz > vorher, holzVorher, { timeout: 40_000 });
    // Und die Leiste zeigt es. Nicht "genau eine Ladung mehr": bis zum Ablesen
    // koennen weitere angekommen sein (unter Last gesehen: 250 statt 210).
    const angezeigt = Number((await anna.locator('#vorraete').textContent()).match(/Holz (\d+)/)[1]);
    expect(angezeigt).toBeGreaterThan(holzVorher);
    await nachweis(anna, {
      spec: FAHRPLAN,
      ac: 'AC-2',
      titel: 'Das erste Spielbild im Browser: Holz ist abgeliefert, der Vorrat oben steigt',
      test: info,
    });
    await bert.waitForFunction(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].some((e) => e.b !== a.ich && e.l > 0);
    });
  });
});
