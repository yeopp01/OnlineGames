// Der Drache und sein Ei (→ specs/10-strategie/einheiten-und-befehle.md
// AC-51 bis AC-54, bauen AC-35, kampf AC-23; ADR-0014).
//
// Was die Welt rechnet, pruefen tests/strategie-ei.test.mjs und
// tests/strategie-drache.test.mjs. Hier: was man davon sieht.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, lebenSetzen, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { aufSeite, bedienteileFrei, gebaeudeInDerNaehe, partieBeenden, partieZuZweit, waehlen } from '../helpers/strategie.mjs';

const EINHEITEN = '10-strategie/einheiten-und-befehle.md';
const BAUEN = '10-strategie/bauen.md';
const KAMPF = '10-strategie/kampf.md';

test.describe('Drache', () => {
  // Ein Ablauf: das Ei ins Kloster, rufen, fliegen, treffen, fallen.
  test.describe.configure({ mode: 'serial' });
  let partie;
  let kloster;
  let drache;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('einheiten AC-51: ein Dorfbewohner hebt das Drachenei mit einem Rechtsklick auf, traegt es sichtbar auf dem Ruecken und legt es ins eigene Kloster', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.eier.size > 0);
    const ei = await anna.evaluate(() => [...window.ansicht.eier.values()][0]);
    expect(ei.nest, 'es liegt in seiner Mulde').toBe(true);

    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'dorfbewohner', x: ei.x - 4, y: ei.y + 1 })).toBe(1);
    kloster = await gebaeudeInDerNaehe(anna, code, 'Anna', 'kloster', { x: ei.x, y: ei.y }, { von: 5, bis: 12 });
    const dorf = await anna.evaluate(() => window.ansicht.werte.einheiten.dorfbewohner.kuerzel);
    const traeger = await anna.waitForFunction(({ ei, dorf }) => {
      const a = window.ansicht;
      const nah = [...a.nachher.values()].filter((e) => e.b === a.ich && e.k === dorf && Math.hypot(e.x - ei.x, e.y - ei.y) < 7);
      return nah.length ? nah[0].i : null;
    }, { ei, dorf }).then((h) => h.jsonValue());

    await waehlen(anna, [traeger], { zoom: 1.8, blick: { x: ei.x, y: ei.y } });
    const wo = await aufSeite(anna, { feld: { x: ei.x, y: ei.y } });
    await anna.mouse.click(wo.x, wo.y, { button: 'right' });

    // Aufgehoben: am Boden liegt es nicht mehr, er traegt es als Ladung `e`.
    await anna.waitForFunction((id) => window.ansicht.nachher.get(id)?.a === 'e' && window.ansicht.eier.size === 0, traeger, { timeout: 30_000 });
    await expect(anna.locator('.auswahlleiste')).toContainText('trägt 1 Drachenei');
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-51',
      titel: 'Der Dorfbewohner trägt das Drachenei auf dem Rücken zum Kloster',
      test: info,
    });

    // Im Kloster: das Kloster nennt sein Ei, der Traeger ist leer.
    await anna.waitForFunction((k) => window.ansicht.gebaeude.get(k)?.e === 1, kloster, { timeout: 60_000 });
    expect(await anna.evaluate((id) => window.ansicht.nachher.get(id)?.l, traeger)).toBe(0);
  });

  test('bauen AC-35: am Kloster mit Ei ruft ein Knopf den Drachen - fuenf Moenche stehen dort, beide sehen oben die Uhr', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, bert, code } = partie;
    await rohstoffe(anna, code, 'Anna', { zeitalter: 2, nahrung: 3000, gold: 3000 });
    // Wohnraum fuer Moenche und Drachen: vier Haeuser am Dorf.
    const dorf = await anna.evaluate(() => {
      const a = window.ansicht;
      const dz = [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'dorfzentrum');
      return { x: dz.x, y: dz.y };
    });
    for (let i = 0; i < 4; i++) await gebaeudeInDerNaehe(anna, code, 'Anna', 'haus', dorf, { von: 4, bis: 14 });
    const mitte = await anna.evaluate((k) => window.ansicht.gebaeudeMitte(window.ansicht.gebaeude.get(k)), kloster);
    expect(await einheitenAufstellen(anna, code, 'Anna', 5, { art: 'moench', x: Math.round(mitte.x), y: Math.round(mitte.y) })).toBe(5);

    await anna.evaluate((k) => {
      const a = window.ansicht;
      a.kamera.zoom = 1.6;
      a.ausgewaehlt.clear();
      a.gewaehltesGebaeude = k;
      const m = a.gebaeudeMitte(a.gebaeude.get(k));
      a.blickAuf(m.x, m.y + 1);
      a.beiAuswahl();
    }, kloster);
    const knopf = anna.locator('#drachenrufen');
    await expect(knopf).toBeInViewport();
    await expect(knopf).toContainText('Drachen rufen');
    await expect(knopf).toHaveAttribute('aria-disabled', 'false');
    const vorher = await anna.evaluate(() => ({ ...window.ansicht.vorraete }));
    await knopf.click();
    const ruf = anna.locator('#drachenruf .drachenruf-uhr');
    await expect(ruf).toContainText('Ruft den Drachen – noch');
    await expect(anna.locator('#buendnisansage')).toContainText('Du rufst den Drachen — noch');
    await expect(bert.locator('#buendnisansage')).toContainText('Anna ruft den Drachen — noch');
    const regel = await anna.evaluate(() => window.ansicht.werte.drache);
    await expect.poll(() => anna.evaluate(() => window.ansicht.vorraete.gold)).toBe(vorher.gold - regel.kosten.gold);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(150);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-35',
      titel: 'Anna ruft am Kloster den Drachen: fünf Mönche stehen dort, die Leiste und die Ansage oben zeigen die Uhr - Bert sieht dieselbe Ansage',
      test: info,
    });
  });

  test('einheiten AC-52: der Drache steigt auf, fliegt geradeaus ueber den Wald und brennt Berts Milizen', async ({}, info) => {
    test.setTimeout(150_000);
    const { anna, code } = partie;
    await zeitraffer(anna, code, 20);
    const kuerzel = await anna.evaluate(() => window.ansicht.werte.einheiten.drache.kuerzel);
    drache = await anna.waitForFunction((k) => {
      const a = window.ansicht;
      const d = [...a.nachher.values()].find((e) => e.b === a.ich && e.k === k);
      return d ? d.i : null;
    }, kuerzel, { timeout: 60_000 }).then((h) => h.jsonValue());
    await zeitraffer(anna, code, 1);
    await expect(anna.locator('#buendnisansage')).not.toContainText('Du rufst den Drachen');

    // Ein Waldfeld acht bis vierzehn Felder vom Drachen - zu Fuss kommt
    // niemand hin, er fliegt hinueber.
    const ziel = await anna.evaluate((id) => {
      const a = window.ansicht;
      const d = a.nachher.get(id);
      const g = a.karte.groesse;
      for (let r = 8; r < 15; r++) {
        for (let w = 0; w < 32; w++) {
          const x = Math.round(d.x + Math.cos((w / 32) * Math.PI * 2) * r);
          const y = Math.round(d.y + Math.sin((w / 32) * Math.PI * 2) * r);
          if (x > 1 && y > 1 && x < g - 2 && y < g - 2 && a.karte.felder[y * g + x] === 1) return { x, y };
        }
      }
      return null;
    }, drache);
    expect(ziel, 'ein Wald in Reichweite').not.toBeNull();
    await waehlen(anna, [drache], { zoom: 1.4, blick: ziel });
    const wo = await aufSeite(anna, { feld: ziel });
    await anna.mouse.click(wo.x, wo.y, { button: 'right' });
    await zeitraffer(anna, code, 4);
    await anna.waitForFunction(([id, z]) => {
      const d = window.ansicht.nachher.get(id);
      return d && Math.hypot(d.x - z.x, d.y - z.y) < 0.2;
    }, [drache, ziel], { timeout: 60_000 });
    await zeitraffer(anna, code, 1);

    // Drei Milizen von Bert daneben, der Drache greift an.
    expect(await einheitenAufstellen(anna, code, 'Bert', 3, { art: 'miliz', x: ziel.x + 4, y: ziel.y })).toBeGreaterThan(0);
    const miliz = await anna.waitForFunction((z) => {
      const a = window.ansicht;
      const m = [...a.nachher.values()].find((e) => e.b !== a.ich && Math.hypot(e.x - z.x - 4, e.y - z.y) < 2.5);
      return m ? m.i : null;
    }, ziel).then((h) => h.jsonValue());
    await waehlen(anna, [drache], { zoom: 1.6, blick: { x: ziel.x + 2, y: ziel.y } });
    const auf = await aufSeite(anna, { einheit: miliz });
    await anna.mouse.click(auf.x, auf.y, { button: 'right' });
    // Der Feuerstoss: festgehalten mitten im Flug, damit das Bild ihn zeigt.
    const feuer = await anna.waitForFunction(() => {
      const f = window.ansicht.pfeile.find((q) => q.feuer);
      if (!f) return false;
      f.dauer = 1e9;
      f.start = performance.now() - 0.6 * 1e9;
      return { x1: f.x1, y1: f.y1 };
    }, null, { timeout: 30_000, polling: 10 }).then((h) => h.jsonValue());
    expect(feuer.x1).toBeGreaterThan(0);
    await anna.waitForTimeout(150);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-52',
      titel: 'Annas Drache ist über den Wald geflogen und brennt Berts Milizen (rot) - der Feuerstoß mitten im Flug',
      test: info,
    });
    // Der festgehaltene Feuerstoss fliegt weiter - sonst steht er in jedem Bild danach.
    await anna.evaluate(() => {
      for (const p of window.ansicht.pfeile) if (p.dauer >= 1e9) p.dauer = 1;
    });
    await zeitraffer(anna, code, 1);
  });

  // Benutzer, 2026-11-25: "wenn der drache jemandem nachfliegt ist das etwas
  // hibbelig". Vorher wechselte das Bild fuenfmal je Sekunde zwischen Flug
  // und angelegten Fluegeln. Dass er in der Welt nicht mehr stockt, prueft
  // tests/strategie-drache.test.mjs (mit Gegenprobe); hier: was das Bild zeigt.
  test('einheiten AC-74: der Drache fliegt Berts fliehendem Dorfbewohner nach - im Bild schlaegt er dabei immer mit den Fluegeln und speit nur im Schlag', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, bert, code } = partie;
    // Zur Kartenmitte hin: vier Felder vom Drachen steht er, sechzehn flieht er.
    const { d, rx, ry } = await anna.evaluate((id) => {
      const a = window.ansicht;
      const dr = a.nachher.get(id);
      const m = a.karte.groesse / 2;
      const l = Math.hypot(m - dr.x, m - dr.y);
      return { d: { x: dr.x, y: dr.y }, rx: (m - dr.x) / l, ry: (m - dr.y) / l };
    }, drache);
    const stand = { x: Math.round(d.x + rx * 4), y: Math.round(d.y + ry * 4) };
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'dorfbewohner', ...stand })).toBe(1);
    const opfer = await anna.waitForFunction((st) => {
      const a = window.ansicht;
      const dorf = a.werte.einheiten.dorfbewohner.kuerzel;
      const o = [...a.nachher.values()].find((e) => e.b !== a.ich && e.k === dorf && !e.s && Math.hypot(e.x - st.x, e.y - st.y) < 2.5);
      return o ? o.i : null;
    }, stand).then((h) => h.jsonValue());
    await lebenSetzen(anna, code, opfer, 400);

    // Was das Bild fuer den Drachen zeichnet, Bild fuer Bild mitgeschrieben.
    await anna.evaluate((id) => {
      const a = window.ansicht;
      a.probeFlug = [];
      const vorher = a.figurPhasen;
      a.figurPhasen = function (einheit, laeuft) {
        const lage = vorher.call(this, einheit, laeuft);
        if (einheit.i === id && this.probeFlug) this.probeFlug.push({ ...lage, x: einheit.x, y: einheit.y, w: Boolean(einheit.w) });
        return lage;
      };
    }, drache);

    await waehlen(anna, [drache], { zoom: 1.6, blick: stand });
    const auf = await aufSeite(anna, { einheit: opfer });
    await anna.mouse.click(auf.x, auf.y, { button: 'right' });
    await anna.waitForFunction((id) => window.ansicht.nachher.get(id)?.w, drache, { timeout: 30_000 });
    // Bert laesst ihn fliehen, vom Drachen fort.
    const flucht = { x: Math.round(d.x + rx * 20), y: Math.round(d.y + ry * 20) };
    await waehlen(bert, [opfer], { zoom: 1.2, blick: flucht });
    await bert.evaluate((f) => window.ansicht.befehlenAufFeld(f.x, f.y), flucht);
    await anna.evaluate(() => {
      window.ansicht.probeFlug = [];
    });
    await anna.waitForTimeout(3500);
    await anna.evaluate((f) => window.ansicht.blickAuf(f.x, f.y), { x: d.x + rx * 7, y: d.y + ry * 7 });
    const flug = await anna.evaluate(() => window.ansicht.probeFlug);
    await anna.evaluate(() => {
      window.ansicht.probeFlug = null;
    });

    expect(flug.length, 'Bilder mitgeschrieben').toBeGreaterThan(60);
    const weg = Math.hypot(flug.at(-1).x - flug[0].x, flug.at(-1).y - flug[0].y);
    expect(weg, 'er ist ihm nachgeflogen').toBeGreaterThan(1.5);
    expect(flug.filter((l) => !l.schritt && !l.arbeit).length, 'kein Bild mit angelegten Fluegeln').toBe(0);
    expect(flug.some((l) => l.arbeit > 0), 'er speit dabei').toBe(true);
    expect(flug.some((l) => l.schritt > 0 && l.w), 'zwischen zwei Schlaegen fliegt er im Angriff').toBe(true);

    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-74',
      titel: 'Annas Drache fliegt Berts fliehendem Dorfbewohner (rot) nach, mit gehobenen Flügeln - kein Standbild dazwischen',
      test: info,
    });
    // Aufgeraeumt: der Drache greift nicht mehr von selbst an - sonst jagt er
    // die Milizen von eben, und der naechste Fall klickt daneben; sie bleiben,
    // damit Bert ihn sieht -, und Bert entlaesst den Dorfbewohner.
    await anna.evaluate((id) => window.ansicht.beiAuftrag({ auftrag: 'haltung', einheiten: [id], haltung: 'passiv' }), drache);
    await bert.evaluate((id) => window.ansicht.beiAuftrag({ auftrag: 'entlassen', einheit: id }), opfer);
    await anna.waitForFunction((id) => {
      const o = window.ansicht.nachher.get(id);
      return !o || o.s;
    }, opfer, { timeout: 30_000 });
    // Zurueck an seinen Platz von vorher: die Flucht fuehrte ihn zwischen
    // Annas Moenche am Kloster, dort trifft der naechste Fall einen Moench.
    await waehlen(anna, [drache], { zoom: 1.2, blick: d });
    await anna.evaluate((z) => window.ansicht.befehlenAufFeld(z.x, z.y), d);
    await anna.waitForFunction(([id, z]) => {
      const e = window.ansicht.nachher.get(id);
      return e && Math.hypot(e.x - z.x, e.y - z.y) < 1.5;
    }, [drache, d], { timeout: 30_000 });
    // Erst weiter, wenn er eine Sekunde lang still steht.
    await anna.waitForFunction((id) => {
      const d = window.ansicht.nachher.get(id);
      const jetzt = performance.now();
      const v = window.probeStill;
      if (!v || Math.hypot(v.x - d.x, v.y - d.y) > 0.01) {
        window.probeStill = { x: d.x, y: d.y, seit: jetzt };
        return false;
      }
      return jetzt - v.seit > 1000;
    }, drache, { timeout: 30_000, polling: 100 });
  });

  test('kampf AC-23: Berts Miliz kann den Drachen nicht angreifen - der Rechtsklick ist ein Gang; sein Armbrustschuetze greift an', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, bert, code } = partie;
    const d = await bert.waitForFunction((id) => window.ansicht.nachher.get(id) || null, drache).then((h) => h.jsonValue());
    // Ausser Sicht des Drachen (zehn Felder), sonst brennt er sie, bevor der Test fragt.
    expect(await einheitenAufstellen(bert, code, 'Bert', 1, { art: 'miliz', x: Math.round(d.x) - 12, y: Math.round(d.y) + 2 })).toBe(1);
    expect(await einheitenAufstellen(bert, code, 'Bert', 1, { art: 'armbrustschuetze', x: Math.round(d.x) - 12, y: Math.round(d.y) - 2 })).toBe(1);
    const [miliz, armbrust] = await bert.waitForFunction((dr) => {
      const a = window.ansicht;
      const nah = (k, dy) => [...a.nachher.values()].find((e) => e.b === a.ich && e.k === a.werte.einheiten[k].kuerzel && Math.hypot(e.x - (dr.x - 12), e.y - dr.y - dy) < 2.5);
      const m = nah('miliz', 2);
      const b = nah('armbrustschuetze', -2);
      return m && b ? [m.i, b.i] : null;
    }, d).then((h) => h.jsonValue());

    // Die Miliz gewaehlt, der Zeiger auf dem Drachen: kein rotes Zeichen.
    await waehlen(bert, [miliz], { zoom: 1.1, blick: { x: d.x - 6, y: d.y } });
    let wo = await aufSeite(bert, { einheit: drache });
    await bert.mouse.move(wo.x, wo.y - 30);
    await expect.poll(() => bert.evaluate(() => window.ansicht.zeigerZiel?.art ?? null)).toBe(null);
    await bert.mouse.click(wo.x, wo.y - 30, { button: 'right' });
    expect(await bert.evaluate(() => window.ansicht.zielzeichen?.feindlich), 'ein Gang, kein Angriff').toBe(false);

    // Der Armbrustschuetze: der Zeiger sagt Angreifen.
    await waehlen(bert, [armbrust]);
    wo = await aufSeite(bert, { einheit: drache });
    await bert.mouse.move(wo.x, wo.y - 30);
    await expect.poll(() => bert.evaluate(() => window.ansicht.zeigerZiel?.art ?? null)).toBe('angreifen');
    expect(await bedienteileFrei(bert)).toEqual([]);
    await bert.waitForTimeout(150);
    await nachweis(bert, {
      spec: KAMPF,
      ac: 'AC-23',
      titel: 'Bert (rot): sein Armbrustschütze gewählt, der Zeiger über Annas Drachen sagt „Angreifen“ - die Miliz davor ging auf denselben Klick nur hin',
      test: info,
    });
    await bert.mouse.click(wo.x, wo.y - 30, { button: 'right' });
    expect(await bert.evaluate(() => window.ansicht.zielzeichen?.feindlich)).toBe(true);
    void anna;
  });

  test('einheiten AC-53: faellt der Drache, liegt dort sein Ei - beide sehen die Ansage, die Uebersichtskarte zeigt die Stelle', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, bert, code } = partie;
    await lebenSetzen(anna, code, drache, 8);
    await zeitraffer(anna, code, 4);
    await bert.waitForFunction(() => [...window.ansicht.eier.values()].some((e) => e.gefallen), null, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);
    await expect(bert.locator('#buendnisansage')).toContainText('Der Drache von Anna ist gefallen — sein Ei liegt am Boden');
    await expect(anna.locator('#buendnisansage')).toContainText('Dein Drache ist gefallen');
    const ei = await bert.evaluate(() => [...window.ansicht.eier.values()].find((e) => e.gefallen));
    await bert.evaluate((e) => {
      const a = window.ansicht;
      a.ausgewaehlt.clear();
      a.gewaehltesGebaeude = null;
      a.beiAuswahl();
      a.kamera.zoom = 2;
      a.blickAuf(e.x, e.y);
    }, ei);
    await bert.waitForTimeout(250);
    await nachweis(bert, {
      spec: EINHEITEN,
      ac: 'AC-53',
      titel: 'Annas Drache ist gefallen: Bert sieht das Ei am Boden, oben die Ansage, auf der Übersichtskarte ein glühender Ring an der Stelle',
      test: info,
    });
  });
});


// Rueckmeldung des Benutzers: "ich hab kartografie aber das drachenei finde
// ich trotzdem nicht". Mit der Kartografie stehen die Nester auf der Karte -
// ein Ei im Nebel aus der Erinnerung, bis man das Nest leer sieht.
test.describe('Nester mit der Kartografie', () => {
  let partie;
  test.beforeAll(async ({ browser }, info) => {
    // Im Nebel - sonst steht jedes Ei ohnehin im Bild.
    partie = await partieZuZweit(browser, info);
    await partie.anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
  });
  test.afterAll(() => partieBeenden(partie));

  test('einheiten AC-73: mit der Kartografie steht an jedem Nest ein Ei im Nebel und ein Punkt auf der Uebersichtskarte - leer gesehen ist es fort', async ({}, info) => {
    test.setTimeout(240_000);
    const { anna, code } = partie;
    await rohstoffe(anna, code, 'Anna', { holz: 5000, nahrung: 5000, gold: 5000, stein: 2000, zeitalter: 1 });
    await anna.waitForFunction(() => window.ansicht.zeitalter === 1);
    await expect(anna.locator('#zeitalterwechsel')).toBeHidden({ timeout: 15_000 });
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    expect(await anna.evaluate(() => window.ansicht.nester.size), 'ohne Kartografie kein Nest').toBe(0);

    // Die Kartografie am Markt erforschen.
    const markt = await gebaeudeInDerNaehe(anna, code, 'Anna', 'markt', basis, { von: 6, bis: 16 });
    await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), markt);
    await anna.evaluate((g) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = g;
      a.ausgewaehlt.clear();
      const m = a.gebaeudeMitte(a.gebaeude.get(g));
      a.blickAuf(m.x, m.y);
      a.beiAuswahl();
    }, markt);
    await anna.locator('[data-ausbilden="kartografie"]').click();
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => window.ansicht.verbesserungen.includes('kartografie'), null, { timeout: 120_000 });
    await zeitraffer(anna, code, 1);

    // Jedes Nest ist bekannt; das naechste liegt im Nebel, der Server schickt
    // dort kein Ei - gezeichnet wird es aus der Erinnerung.
    await anna.waitForFunction(() => window.ansicht.nester.size > 0);
    const nest = await anna.evaluate((b) => {
      const a = window.ansicht;
      return [...a.nester.values()].sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y))[0];
    }, basis);
    const lage = () => anna.evaluate((n) => {
      const a = window.ansicht;
      return {
        voll: a.nester.get(`${n.x},${n.y}`).voll,
        gesehen: a.nebel.sieht(n.x, n.y),
        vomServer: a.eiAm(n.x, n.y),
        erinnert: a.erinnerteNester().some((e) => e.x === n.x && e.y === n.y),
        aufKarte: window.uebersicht.nestpunkte.some((e) => e.x === n.x && e.y === n.y),
      };
    }, nest);
    await expect.poll(lage).toEqual({ voll: true, gesehen: false, vomServer: false, erinnert: true, aufKarte: true });
    await anna.evaluate((n) => {
      const a = window.ansicht;
      a.ausgewaehlt.clear();
      a.gewaehltesGebaeude = null;
      a.beiAuswahl();
      a.kamera.zoom = 2;
      a.blickAuf(n.x, n.y);
    }, nest);
    await anna.mouse.move(700, 300);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-73',
      titel: 'Anna hat die Kartografie: das Drachenei in seinem Nest steht gedämpft im Nebel, auf der Übersichtskarte ein Punkt mit hellem Rand an jedem Nest',
      test: info,
    });

    // Ein Dorfbewohner kommt hin: jetzt schickt der Server das Ei, die
    // Erinnerung tritt zurueck - kein zweites Ei an derselben Stelle.
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'dorfbewohner', x: nest.x - 3, y: nest.y + 1 })).toBe(1);
    await expect.poll(lage, { timeout: 15_000 }).toEqual({ voll: true, gesehen: true, vomServer: true, erinnert: false, aufKarte: true });
    const dorf = await anna.evaluate(() => window.ansicht.werte.einheiten.dorfbewohner.kuerzel);
    const traeger = await anna.waitForFunction(({ n, dorf }) => {
      const a = window.ansicht;
      const nah = [...a.nachher.values()].filter((e) => e.b === a.ich && e.k === dorf && Math.hypot(e.x - n.x, e.y - n.y) < 7);
      return nah.length ? nah[0].i : null;
    }, { n: nest, dorf }).then((h) => h.jsonValue());

    // Er hebt es auf: das Nest ist leer gesehen, auch auf der Uebersichtskarte fort.
    await waehlen(anna, [traeger], { zoom: 2, blick: { x: nest.x, y: nest.y } });
    const wo = await aufSeite(anna, { feld: { x: nest.x, y: nest.y } });
    await anna.mouse.click(wo.x, wo.y, { button: 'right' });
    await anna.waitForFunction((id) => window.ansicht.nachher.get(id)?.a === 'e', traeger, { timeout: 30_000 });
    await expect.poll(lage, { timeout: 15_000 }).toEqual({ voll: false, gesehen: true, vomServer: false, erinnert: false, aufKarte: false });
  });
});

// Rueckmeldung des Benutzers: "Wie laesst der dorfbewohner es wieder los?"
// Ein Bildknopf an der Auswahl legt das Ei auf das Feld des Traegers.
test.describe('Ei ablegen', () => {
  let partie;
  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel; kein Kloster, damit der Traeger stehen bleibt.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('einheiten AC-75: wer das Ei traegt, hat einen Bildknopf "Ei ablegen" - ein Druck legt es auf sein Feld, der Knopf verschwindet', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.eier.size > 0);
    const ei = await anna.evaluate(() => [...window.ansicht.eier.values()][0]);
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'dorfbewohner', x: ei.x - 3, y: ei.y + 1 })).toBe(1);
    const dorf = await anna.evaluate(() => window.ansicht.werte.einheiten.dorfbewohner.kuerzel);
    const traeger = await anna.waitForFunction(({ ei, dorf }) => {
      const a = window.ansicht;
      const nah = [...a.nachher.values()].filter((e) => e.b === a.ich && e.k === dorf && Math.hypot(e.x - ei.x, e.y - ei.y) < 6);
      return nah.length ? nah[0].i : null;
    }, { ei, dorf }).then((h) => h.jsonValue());

    await waehlen(anna, [traeger], { zoom: 2, blick: { x: ei.x, y: ei.y } });
    await expect(anna.locator('#eiAblegen'), 'ohne Ei kein Knopf').toHaveCount(0);
    const wo = await aufSeite(anna, { feld: { x: ei.x, y: ei.y } });
    await anna.mouse.click(wo.x, wo.y, { button: 'right' });
    await anna.waitForFunction((id) => window.ansicht.nachher.get(id)?.a === 'e' && window.ansicht.eier.size === 0, traeger, { timeout: 30_000 });

    // Der Knopf: ein Bild, kein Wort, der Name in aria-label und Tafel.
    const knopf = anna.locator('#eiAblegen');
    await expect(knopf).toHaveAttribute('aria-label', 'Ei ablegen');
    const art = await knopf.evaluate((k) => ({
      text: [...k.childNodes].filter((n) => n.nodeType === Node.TEXT_NODE).map((n) => n.textContent.trim()).join(''),
      bild: k.querySelector('canvas') !== null,
    }));
    expect(art).toEqual({ text: '', bild: true });
    await anna.mouse.move(700, 300);
    await knopf.hover();
    await expect(anna.locator('#knopftafel')).toContainText('Ei ablegen');
    await expect(anna.locator('#knopftafel')).toContainText('Legt das Drachenei hier auf den Boden');
    await expect(anna.locator('#knopftafel')).toBeInViewport({ ratio: 1 });
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-75',
      titel: 'Der Dorfbewohner trägt das Drachenei: an der Auswahl der Bildknopf „Ei ablegen“, darüber seine Tafel',
      test: info,
    });

    // Gedrueckt: das Ei liegt auf seinem Feld, er traegt nichts, der Knopf ist fort.
    const feld = await anna.evaluate((id) => {
      const e = window.ansicht.nachher.get(id);
      return { x: Math.round(e.x), y: Math.round(e.y) };
    }, traeger);
    await knopf.click();
    await anna.waitForFunction((id) => window.ansicht.nachher.get(id)?.l === 0 && window.ansicht.eier.size === 1, traeger, { timeout: 15_000 });
    const liegt = await anna.evaluate(() => [...window.ansicht.eier.values()][0]);
    expect({ x: liegt.x, y: liegt.y }, 'auf dem Feld des Traegers').toEqual(feld);
    await expect(knopf).toHaveCount(0);
    await expect(anna.locator('.auswahlleiste')).toContainText('trägt nichts');
  });
});
