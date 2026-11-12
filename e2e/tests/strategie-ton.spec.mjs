// Ton (→ specs/10-strategie/bedienung.md AC-59 bis AC-62): Geraeusche zu
// Ereignissen, Kampf und Arbeit dort, wo sie im Bild stehen, Musik darunter,
// zwei Schalter in der Tastenuebersicht.
//
// Ein Test kann nicht hoeren. Er kann messen: `window.ton.pegel()` ist der
// Effektivwert am Ausgang, 0 bei Stille. Damit steht hier, DASS etwas
// klingt und wann - nicht, WIE es klingt. Welches Ereignis welchen Klang hat,
// dass die Stimme der Musik zu ihren Akkorden passt und was sie im Kampf
// anders macht, prueft tests/strategie-ton.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { gebaeudeInDerNaehe, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';
const STILL = 0.00002;

test.describe('Ton', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let anna;
  let code;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
    ({ anna, code } = partie);
    await zeitraffer(anna, code, 10);
  });
  test.afterAll(() => partieBeenden(partie));

  const laut = () => anna.evaluate(() => window.ton.pegel());
  const zentrumWaehlen = () => anna.evaluate(() => {
    const a = window.ansicht;
    const dz = [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'dorfzentrum');
    a.ausgewaehlt = new Set();
    a.gewaehltesGebaeude = dz.i;
    a.beiAuswahl();
  });
  // Wartet im Fenster auf den naechsten Klang dieses Namens und misst von da
  // an 0,7 Sekunden lang Bild fuer Bild den Pegel: die Spitze kommt zurueck,
  // -1, wenn in dreissig Sekunden nichts klang. Vor dem Ausloesen starten.
  const spitzeBei = (name) => anna.evaluate((gesucht) => new Promise((fertig) => {
    const t = window.ton;
    const ab = t.protokoll.length;
    const beginn = performance.now();
    let gehoert = null;
    let hoch = 0;
    const schritt = () => {
      const jetzt = performance.now();
      if (gehoert === null && t.protokoll.slice(ab).some((p) => p.name === gesucht)) gehoert = jetzt;
      if (gehoert !== null) hoch = Math.max(hoch, t.pegel());
      if (gehoert !== null && jetzt - gehoert > 700) fertig(hoch);
      else if (gehoert === null && jetzt - beginn > 30_000) fertig(-1);
      else requestAnimationFrame(schritt);
    };
    schritt();
  }), name);

  // Wartet, bis von diesen Geraeuschen `mindestens` weitere zu hoeren waren,
  // und misst dabei den Pegel: Spitze und Zahl kommen zurueck - nach `ms`
  // auch dann, wenn nichts kam.
  const hoerenBis = (namen, mindestens, ms) => anna.evaluate(([gesucht, soll, frist]) => new Promise((fertig) => {
    const t = window.ton;
    const zahl = () => gesucht.reduce((summe, name) => summe + (t.gezaehlt.get(name) || 0), 0);
    const ab = zahl();
    const beginn = performance.now();
    let genug = null;
    let hoch = 0;
    const schritt = () => {
      const jetzt = performance.now();
      hoch = Math.max(hoch, t.pegel());
      if (genug === null && zahl() - ab >= soll) genug = jetzt;
      if ((genug !== null && jetzt - genug > 300) || jetzt - beginn > frist) fertig({ spitze: hoch, gehoert: zahl() - ab });
      else requestAnimationFrame(schritt);
    };
    schritt();
  }), [namen, mindestens, ms]);

  test('bedienung AC-60: im Spiel spielt Musik, mit dem Thema zuerst - gemessen am Ausgang, und nichts uebersteuert', async () => {
    // Ohne eine Handlung laesst der Browser keinen Ton zu. Die Klicks im
    // Vorraum - Eroeffnen, Starten - zaehlen schon: steht das Spiel, spielt
    // die Musik, ohne dass jemand eigens dafuer klickt. Der Klick hier ist
    // fuer den Fall, dass eine Partie einmal ohne einen beginnt.
    await anna.locator('#brett').click({ position: { x: 700, y: 420 } });
    await expect.poll(() => anna.evaluate(() => window.ton.ctx?.state), { message: 'der Klangausgang laeuft' }).toBe('running');
    expect(await anna.evaluate(() => window.ton.musikLaeuft)).toBe(true);
    await expect.poll(laut, { timeout: 15_000, message: 'am Ausgang kommt etwas an' }).toBeGreaterThan(0.01);
    expect(await anna.evaluate(() => window.ton.gespielt[0]), 'sie beginnt mit dem Thema').toBe('thema');
    // Sechs Sekunden, mehr als zwei Takte: sie ist da, und sie uebersteuert
    // nicht. (Der Pegel ist ein Effektivwert ueber 23 Millisekunden; offline
    // gerechnet liegt die Musik bei 0,06, die hoechste Spitze bei 0,39.)
    const gemessen = await anna.evaluate(() => new Promise((fertig) => {
      let hoch = 0;
      let summe = 0;
      let bilder = 0;
      const beginn = performance.now();
      const schritt = () => {
        const p = window.ton.pegel();
        hoch = Math.max(hoch, p);
        summe += p;
        bilder += 1;
        if (performance.now() - beginn > 6000) fertig({ hoch, mittel: summe / bilder });
        else requestAnimationFrame(schritt);
      };
      schritt();
    }));
    expect(gemessen.mittel, 'die Musik ist zu hoeren').toBeGreaterThan(0.015);
    expect(gemessen.hoch, 'und uebersteuert nicht').toBeLessThan(0.4);
  });

  test('bedienung AC-61: in der Tastenuebersicht stehen Geraeusche und Musik - Musik aus, und es wird still', async ({}, info) => {
    await anna.locator('#brett').hover();
    await anna.keyboard.press('F1');
    const uebersicht = anna.locator('#tastenuebersicht');
    await expect(uebersicht).toBeVisible();
    await expect(uebersicht.locator('label', { hasText: 'Geräusche' })).toBeVisible();
    await expect(uebersicht.locator('label', { hasText: 'Musik' })).toBeVisible();
    await expect(anna.locator('#ton-geraeusche')).toBeChecked();
    await expect(anna.locator('#ton-musik')).toBeChecked();
    await expect(uebersicht).toBeInViewport({ ratio: 1 });
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-61',
      titel: 'Die Tastenuebersicht: unter der Liste drei Schalter - Karte am Bildschirmrand schieben, Geraeusche, Musik - alle angehakt',
      test: info,
    });

    await anna.locator('#ton-musik').uncheck();
    // Der Klick auf den Schalter schliesst die Uebersicht nicht.
    await expect(uebersicht).toBeVisible();
    expect(await anna.evaluate(() => window.ton.musikLaeuft)).toBe(false);
    await expect.poll(laut, { timeout: 15_000, message: 'die Musik ist verklungen' }).toBeLessThan(STILL);
    expect(await anna.evaluate(() => localStorage.getItem('tonMusik')), 'der Browser merkt es sich').toBe('aus');
    await anna.keyboard.press('Escape');
    await expect(uebersicht).toBeHidden();
  });

  test('bedienung AC-59: ein Dorfbewohner wird fertig, der Webstuhl ist erforscht - beides ist am Ausgang zu messen', async () => {
    // Die Musik ist aus: was jetzt am Ausgang ankommt, ist das Geraeusch.
    expect(await laut()).toBeLessThan(STILL);
    await rohstoffe(anna, code, 'Anna', { nahrung: 2000, gold: 2000 });
    await zentrumWaehlen();

    let gemessen = spitzeBei('einheit');
    await anna.locator('[data-ausbilden="dorfbewohner"]').click();
    expect(await gemessen, 'der fertige Dorfbewohner klingt').toBeGreaterThan(0.02);
    await expect.poll(laut, { message: 'und verklingt' }).toBeLessThan(STILL);

    gemessen = spitzeBei('forschung');
    await anna.locator('[data-ausbilden="webstuhl"]').click();
    expect(await gemessen, 'der erforschte Webstuhl klingt').toBeGreaterThan(0.02);
    const namen = await anna.evaluate(() => window.ton.protokoll.map((p) => p.name));
    expect(namen.filter((n) => n === 'einheit'), 'ein Dorfbewohner, ein Klang').toHaveLength(1);
    expect(namen.filter((n) => n === 'forschung')).toHaveLength(1);
    // Bei Bert, der nichts bestellt hat, klang nichts davon.
    expect(await partie.bert.evaluate(() => window.ton.protokoll.map((p) => p.name))).toEqual([]);
  });

  test('bedienung AC-62: ein Gefecht im Bild klirrt, ausserhalb des Bildes ist es still - und wer Holz hackt, ist zu hoeren', async () => {
    // Die Musik ist aus (AC-61 oben): was am Ausgang ankommt, sind die Geraeusche.
    await zeitraffer(anna, code, 1);
    await expect.poll(laut, { message: 'vorher ist es still' }).toBeLessThan(STILL);
    const lage = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const basis = a.spieler.get(a.ich).basis;
      const fremd = [...a.spieler.values()].find((s) => s.id !== a.ich).basis;
      // Das Gefecht steht neben dem eigenen Dorf, zur Kartenmitte hin; die
      // Karte zeigt solange das Dorf des Gegners.
      const ort = { x: basis.x + (basis.x < g / 2 ? 8 : -8), y: basis.y + (basis.y < g / 2 ? 8 : -8) };
      a.kamera.zoom = 1.4;
      a.blickAuf(fremd.x, fremd.y);
      return { ort, fremd };
    });
    await einheitenAufstellen(anna, code, 'Anna', 6, { ...lage.ort, art: 'miliz' });
    await einheitenAufstellen(anna, code, 'Bert', 6, { x: lage.ort.x + 1, y: lage.ort.y + 1, art: 'miliz' });
    // Kampfeinheiten wehren sich von selbst (kampf AC-8): sie schlagen zu.
    await anna.waitForFunction(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].filter((e) => e.w && !e.s && a.arten[e.k] === 'miliz').length >= 4;
    }, null, { timeout: 20_000 });
    // Ausserhalb des Bildes: anderthalb Sekunden, zwei Umlaeufe jedes Schlags - nichts.
    const fern = await hoerenBis(['schwert', 'hieb'], 1, 1500);
    expect(fern.gehoert, 'ausserhalb des Bildes klirrt nichts').toBe(0);

    // Im Bild: es klirrt, am Ausgang kommt es an, und die Musik weiss vom Kampf.
    const nah = hoerenBis(['schwert', 'hieb'], 4, 20_000);
    await anna.evaluate((ort) => window.ansicht.blickAuf(ort.x, ort.y), lage.ort);
    const gefecht = await nah;
    expect(gefecht.gehoert, 'im Bild sind die Schlaege zu hoeren').toBeGreaterThanOrEqual(4);
    expect(gefecht.spitze, 'und am Ausgang zu messen').toBeGreaterThan(0.01);
    expect(gefecht.spitze, 'ohne zu uebersteuern').toBeLessThan(0.4);
    expect(await anna.evaluate(() => window.ton.gezaehlt.get('schwert') || 0), 'Eisen auf Eisen ist dabei').toBeGreaterThan(0);
    expect(await anna.evaluate(() => window.ton.kampfpegel()), 'die Musik weiss vom Kampf').toBeGreaterThan(0.2);
    // Kampf und Arbeit stehen nicht im Protokoll der Signale.
    expect(await anna.evaluate(() => window.ton.protokoll.some((p) => ['schwert', 'hieb', 'hacken'].includes(p.name)))).toBe(false);

    // Arbeit: ein Dorfbewohner geht in den Wald, und die Axt ist zu hoeren.
    await zeitraffer(anna, code, 4);
    const wald = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const basis = a.spieler.get(a.ich).basis;
      let bestes = null;
      for (let y = 0; y < g; y++) {
        for (let x = 0; x < g; x++) {
          if (a.karte.felder[y * g + x] !== 1) continue;
          const abstand = Math.hypot(x - basis.x, y - basis.y);
          if (!bestes || abstand < bestes.abstand) bestes = { x, y, abstand };
        }
      }
      const holzer = [...a.nachher.values()].find((e) => e.b === a.ich && a.arten[e.k] === 'dorfbewohner' && !e.s);
      a.befehlSenden([holzer.i], { x: bestes.x, y: bestes.y }, false);
      a.blickAuf(bestes.x, bestes.y);
      return bestes;
    });
    expect(wald.abstand, 'ein Wald in der Naehe').toBeLessThan(25);
    const axt = await hoerenBis(['hacken'], 3, 60_000);
    expect(axt.gehoert, 'die Axt ist zu hoeren').toBeGreaterThanOrEqual(3);
    expect(axt.spitze, 'leise, aber am Ausgang zu messen').toBeGreaterThan(0.002);
    await zeitraffer(anna, code, 10);
  });

  test('bedienung AC-59 / bedienung AC-61: Geraeusche aus - der naechste Dorfbewohner kommt still', async () => {
    await anna.locator('#brett').hover();
    await anna.keyboard.press('F1');
    await anna.locator('#ton-geraeusche').uncheck();
    await anna.keyboard.press('Escape');

    const vorher = await anna.evaluate(() => window.ton.protokoll.length);
    const dorf = () => anna.evaluate(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].filter((e) => e.b === a.ich && a.arten[e.k] === 'dorfbewohner').length;
    });
    const zahl = await dorf();
    // Der Wohnraum ist voll (fuenf von fuenf): ein Haus dazu, sonst wartet
    // der Auftrag. Auch das Haus kommt still.
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'haus', basis, { von: 6, bis: 14 });
    await zentrumWaehlen();
    await anna.locator('[data-ausbilden="dorfbewohner"]').click();
    await expect.poll(dorf, { timeout: 20_000, message: 'der Dorfbewohner ist da' }).toBe(zahl + 1);
    expect(await anna.evaluate(() => window.ton.protokoll.length), 'es klang nichts').toBe(vorher);
    expect(await laut()).toBeLessThan(STILL);
  });

  test('bedienung AC-61: nach dem Neuladen stehen beide Schalter, wie sie gelassen wurden', async () => {
    await anna.reload();
    await anna.waitForFunction(() => window.ansicht?.laeuft && window.ansicht.nachher.size > 0);
    await anna.locator('#brett').hover();
    await anna.keyboard.press('F1');
    await expect(anna.locator('#tastenuebersicht')).toBeVisible();
    await expect(anna.locator('#ton-geraeusche')).not.toBeChecked();
    await expect(anna.locator('#ton-musik')).not.toBeChecked();
    await expect(anna.locator('#rand-schieben')).toBeChecked();
    // Und abgeschaltet bleibt es: auch nach einem Klick spielt keine Musik.
    await anna.keyboard.press('Escape');
    await anna.locator('#brett').click({ position: { x: 700, y: 420 } });
    expect(await anna.evaluate(() => window.ton.musikLaeuft)).toBe(false);
  });
});
