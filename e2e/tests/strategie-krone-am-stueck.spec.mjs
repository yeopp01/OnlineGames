// Die Krone am Stueck (→ specs/10-strategie/fahrplan.md AC-19, Schritt F13):
// zwei Partien, im Browser gespielt wie von einem Menschen.
//
// Die erste steigt im Dorfzentrum in die Krone auf, erforscht in jedem
// Militaergebaeude eine Stufe der Krone (samt ihren Vorstufen) und eine
// Verbesserung der Schmiede der Krone, bildet die Elitestufe ihres Hauses aus
// - Eschenbruch, der Elite-Kriegswolf aus der Burg; das Pruefhaus der anderen
// Faelle hat keine - und baut mit zwanzig Dorfbewohnern ein Wunder, dessen
// Uhr bis zum Sieg laeuft. Die zweite traegt das Ei ins Kloster, ruft den
// Drachen mit fuenf Moenchen und reisst mit ihm ein Stueck aus einer Mauer.
//
// Jede Einzelheit hat ihren eigenen Test (bauen AC-35, AC-47, AC-48, AC-51,
// einheiten AC-51 bis AC-54, AC-66 bis AC-69, spielziel AC-29). Dieser zeigt,
// dass sie zusammen eine spielbare Krone ergeben - der Pruefstein der Stufe F
// wie fahrplan AC-14 fuer die Ritterzeit. Gebaeude, die frueher kamen, stellt
// der Pruefgriff auf; Rohstoffe auch.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, gebaeudeAufstellen, rohstoffe, test, uhrStellen, zeitraffer } from '../helpers/seite.mjs';
import { BAUTASTEN } from '../../public/tasten.js';
import { EINHEITEN, GEBAEUDE, VERBESSERUNGEN } from '../../server/spiele/strategie/daten.js';
import {
  aufSeite, bedienteileFrei, dorfbewohnerAnklicken, einheitenJeArt, figurenFrei, freieWiesen,
  gebaeudeInDerNaehe, partieBeenden, partieZuZweit, platzImBild, waehlen,
} from '../helpers/strategie.mjs';

const FAHRPLAN = '10-strategie/fahrplan.md';
const HAUS = 'eschenbruch';

/** Ein Gebaeude anwaehlen und die Kamera darauf richten. */
async function gebaeudeWaehlen(page, id, zoom = 1.4) {
  await page.waitForFunction((g) => window.ansicht.gebaeude.has(g), id);
  await page.evaluate(([g, z]) => {
    const a = window.ansicht;
    a.kamera.zoom = z;
    a.ausgewaehlt.clear();
    a.gewaehltesGebaeude = g;
    const m = a.gebaeudeMitte(a.gebaeude.get(g));
    a.blickAuf(m.x, m.y);
    a.beiAuswahl();
  }, [id, zoom]);
}

const eigeneFertig = (page, art) => page.evaluate((art) => [...window.ansicht.gebaeude.values()]
  .filter((g) => g.b === window.ansicht.ich && g.art === art && g.u === undefined).length, art);

/** Die Kette einer Verbesserung, die aelteste Vorstufe zuerst. */
function kette(v) {
  const reihe = [];
  for (let x = v; x; x = VERBESSERUNGEN[x].vorstufe) reihe.unshift(x);
  return reihe;
}

// Was ein Militaergebaeude ist, sagen die Daten: die Seite "Militaer" des
// Baumenues (bedienung AC-64) und mindestens eine Einheit, die es ausbildet -
// Kaserne, Schiessanlage, Stall, Belagerungswerkstatt, Burg.
const MILITAER = Object.keys(GEBAEUDE)
  .filter((art) => GEBAEUDE[art].seite === 1 && (GEBAEUDE[art].bildetAus || []).some((e) => EINHEITEN[e]));

// Je Militaergebaeude eine Stufe der Krone: eine Verbesserung des Zeitalters 3,
// die eine Einheit austauscht (`wandelt`) oder hebt (`hebt`, die Elitestufen
// der Burg) und dem Haus offensteht - die mit der kuerzesten Kette. In der
// Burg ist das die Elitestufe des Hauses. Dazu die Schmiede.
function stufeIn(art, nurWirkung = false) {
  const moeglich = GEBAEUDE[art].bildetAus.filter((v) => {
    const x = VERBESSERUNGEN[v];
    if (!x || x.zeitalter !== 3) return false;
    if (x.haeuser && !x.haeuser.includes(HAUS)) return false;
    return nurWirkung || x.wandelt || x.hebt;
  });
  return moeglich.sort((p, q) => kette(p).length - kette(q).length)[0] || null;
}

test.describe('Krone am Stueck', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let basis;
  let wiese;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel: aufgedeckt (kampf AC-16). Ein echtes Haus fuer
    // beide - Annas Elitestufe gibt es nur in ihrem Haus.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt', haus: HAUS });
    const { anna, code } = partie;
    expect(await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).haus)).toBe(HAUS);
    basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    // Rohstoffe fuer den Aufstieg, zehn Verbesserungen, fuenf Einheiten und das
    // Wunder; das Fuerstentum mit allem, was es schon gebaut haette. Die Wiese
    // fuer das Wunder wird **vor** dem Aufstellen gesucht - danach ist um die
    // Basis kaum noch Gras frei.
    await rohstoffe(anna, code, 'Anna', { zeitalter: 2, holz: 6000, nahrung: 9000, gold: 7000, stein: 3000 });
    await anna.waitForFunction(() => window.ansicht.zeitalter === 2);
    await expect(anna.locator('#zeitalterwechsel')).toBeHidden({ timeout: 15_000 });
    [wiese] = await freieWiesen(anna, 1);
    // Gegenueber der Wiese: dorthin kommen Haeuser und Militaer, damit das
    // Wunder seinen Platz behaelt.
    const weg = { x: Math.round(basis.x * 2 - wiese.x), y: Math.round(basis.y * 2 - wiese.y) };
    const fern = { x: Math.round((basis.x + weg.x) / 2), y: Math.round((basis.y + weg.y) / 2) };
    for (let i = 0; i < 4; i++) await gebaeudeInDerNaehe(anna, code, 'Anna', 'haus', fern, { von: 2 + i, bis: 24 });
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'muehle', fern, { von: 4, bis: 20 });
    for (const art of [...MILITAER, 'schmiede']) {
      await gebaeudeInDerNaehe(anna, code, 'Anna', art, fern, { von: 5, bis: 26 });
    }
  });
  test.afterAll(() => partieBeenden(partie));

  test('fahrplan AC-19: Aufstieg in die Krone, je Militaergebaeude eine Stufe, die Schmiede, die Elitestufe des Hauses und ein Wunder bis zum Sieg - im Browser gespielt', async ({}, info) => {
    test.setTimeout(480_000);
    const { anna, bert, code } = partie;

    // ---- Der Aufstieg: ein Auftrag im Dorfzentrum, keine Abkuerzung. ----
    await anna.evaluate((b) => {
      const a = window.ansicht;
      a.kamera.zoom = 1.4;
      a.blickAuf(b.x + 2, b.y + 2);
    }, basis);
    await anna.keyboard.press('h');
    const aufstieg = anna.locator('[data-aufstieg="imperialzeit"]');
    await expect(aufstieg).toHaveCount(1);
    await expect(aufstieg).toHaveAttribute('aria-disabled', 'false');
    await aufstieg.click();
    await anna.waitForFunction(() => [...window.ansicht.gebaeude.values()]
      .some((g) => g.b === window.ansicht.ich && g.art === 'dorfzentrum' && g.s?.length));
    expect(await anna.evaluate(() => window.ansicht.zeitalter), 'noch Fuerstentum').toBe(2);
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => window.ansicht.zeitalter === 3, null, { timeout: 90_000 });
    await zeitraffer(anna, code, 1);
    await expect(anna.locator('#zeitalter')).toContainText('Krone');
    await anna.keyboard.press('Escape');

    // ---- Je Militaergebaeude eine Stufe der Krone, dazu die Schmiede. ----
    expect(MILITAER.sort(), 'die Militaergebaeude aus den Daten')
      .toEqual(['belagerungswerkstatt', 'burg', 'kaserne', 'schiessanlage', 'stall']);
    const stufen = MILITAER.map((art) => ({ art, stufe: stufeIn(art) }));
    for (const { art, stufe } of stufen) expect(stufe, `eine Stufe der Krone in ${art}`).not.toBeNull();
    const burg = stufen.find((s) => s.art === 'burg').stufe;
    expect(VERBESSERUNGEN[burg].hebt, 'in der Burg die Elitestufe des Hauses').toBeTruthy();
    expect(VERBESSERUNGEN[burg].haeuser).toEqual([HAUS]);
    const schmiede = stufeIn('schmiede', true);
    expect(schmiede, 'eine Verbesserung der Schmiede der Krone').not.toBeNull();
    // Was danach ausgebildet wird: die Einheit, die die Stufe austauscht oder hebt.
    const neu = stufen.map(({ art, stufe }) => {
      const v = VERBESSERUNGEN[stufe];
      return { art, stufe, einheit: v.hebt || Object.values(v.wandelt)[0] };
    });
    for (const n of neu) expect(EINHEITEN[n.einheit], n.einheit).toBeTruthy();

    // Alles, was zu erforschen ist, mit seinem Gebaeude - auch die Vorstufen.
    const zuForschen = [...new Set([...neu.map((n) => n.stufe), schmiede].flatMap(kette))];
    const forschung = await anna.evaluate((liste) => {
      const a = window.ansicht;
      const w = a.werte;
      const eigene = [...a.gebaeude.values()].filter((g) => g.b === a.ich && g.u === undefined);
      return liste.map((v) => ({
        verbesserung: v,
        gebaeude: eigene.find((g) => (w.gebaeude[g.art].bildetAus || []).includes(v))?.i ?? null,
        vorstufe: w.verbesserungen[v].vorstufe || null,
      }));
    }, zuForschen);
    for (const f of forschung) expect(f.gebaeude, `wo ${f.verbesserung} erforscht wird`).not.toBeNull();
    // In Wellen: was eine Vorstufe verlangt, steht erst im Gebaeude, wenn die
    // erforscht ist.
    const erforscht = new Set();
    while (erforscht.size < forschung.length) {
      const welle = forschung.filter((f) => !erforscht.has(f.verbesserung) && (!f.vorstufe || erforscht.has(f.vorstufe)));
      expect(welle.length, 'eine Verbesserung ohne offene Vorstufe').toBeGreaterThan(0);
      for (const f of welle) {
        await gebaeudeWaehlen(anna, f.gebaeude);
        const knopf = anna.locator(`[data-ausbilden="${f.verbesserung}"]`);
        await expect(knopf, `${f.verbesserung} im Gebaeude`).toHaveCount(1);
        await expect(knopf, `${f.verbesserung} bezahlbar`).toHaveAttribute('aria-disabled', 'false');
        await knopf.click();
      }
      await zeitraffer(anna, code, 20);
      await anna.waitForFunction((vs) => vs.every((v) => window.ansicht.verbesserungen.includes(v)),
        welle.map((f) => f.verbesserung), { timeout: 120_000 });
      await zeitraffer(anna, code, 1);
      for (const f of welle) erforscht.add(f.verbesserung);
    }

    // ---- Die neuen Stufen aus ihren Knoepfen, die Elitestufe eingeschlossen. ----
    const vorher = await einheitenJeArt(anna);
    const gebaeudeVon = await anna.evaluate((arten) => {
      const a = window.ansicht;
      return Object.fromEntries(arten.map((art) => [art, [...a.gebaeude.values()]
        .find((g) => g.b === a.ich && g.art === art && g.u === undefined)?.i]));
    }, MILITAER);
    for (const n of neu) {
      await gebaeudeWaehlen(anna, gebaeudeVon[n.art]);
      const knopf = anna.locator(`[data-ausbilden="${n.einheit}"]`);
      await expect(knopf, `${n.einheit} in ${n.art}`).toHaveCount(1);
      await expect(knopf, `${n.einheit} bezahlbar`).toHaveAttribute('aria-disabled', 'false');
      await knopf.click();
    }
    const bestellt = neu.map((n) => EINHEITEN[n.einheit].kuerzel);
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(([kuerzel, vorher]) => {
      const a = window.ansicht;
      const je = {};
      for (const e of a.nachher.values()) if (e.b === a.ich && !e.s) je[e.k] = (je[e.k] || 0) + 1;
      return kuerzel.every((k) => (je[k] || 0) > (vorher[k] || 0));
    }, [bestellt, vorher], { timeout: 120_000 });
    await zeitraffer(anna, code, 1);
    const truppe = await anna.evaluate((kuerzel) => {
      const a = window.ansicht;
      return kuerzel.map((k) => [...a.nachher.entries()].find(([, e]) => e.b === a.ich && e.k === k && !e.s)?.[0]);
    }, bestellt);
    expect(truppe.every((id) => id !== undefined), 'je Stufe eine Einheit').toBe(true);
    // Die Elitestufe heisst in der Leiste so, wie die Stufe sie nennt.
    const elite = neu.find((n) => n.art === 'burg');
    await waehlen(anna, [truppe[neu.indexOf(elite)]]);
    await expect(anna.locator('.auswahl-kopf strong')).toHaveText(VERBESSERUNGEN[elite.stufe].nennt[elite.einheit]);

    // ---- Das Wunder: zwanzig Dorfbewohner, B und ein Buchstabe, ein Klick. ----
    const dorf = EINHEITEN.dorfbewohner.kuerzel;
    const schon = await anna.evaluate((d) => [...window.ansicht.nachher.values()]
      .filter((e) => e.b === window.ansicht.ich && e.k === d && !e.s).map((e) => e.i), dorf);
    expect(await einheitenAufstellen(anna, code, 'Anna', 20, { art: 'dorfbewohner', x: wiese.x - 6, y: wiese.y + 6 })).toBe(20);
    const bauer = await anna.waitForFunction(([d, schon]) => {
      const a = window.ansicht;
      const neue = [...a.nachher.values()].filter((e) => e.b === a.ich && e.k === d && !e.s && !schon.includes(e.i));
      return neue.length >= 20 ? neue.map((e) => e.i) : null;
    }, [dorf, schon]).then((h) => h.jsonValue());
    await waehlen(anna, bauer, { zoom: 1, blick: wiese });
    const menue = await anna.locator('#baumenue [data-bauen]').evaluateAll((k) => k.map((x) => x.dataset.bauen));
    const nummer = menue.indexOf('wunder');
    expect(nummer, 'das Wunder im Baumenue der Krone').toBeGreaterThanOrEqual(0);
    await anna.keyboard.press('b');
    await anna.keyboard.press(BAUTASTEN[nummer]);
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzieren?.art)).toBe('wunder');
    const platz = await platzImBild(anna, { n: GEBAEUDE.wunder.groesse, um: wiese, abstand: 0 });
    expect(platz, 'Platz fuer das Wunder').not.toBeNull();
    await anna.mouse.move(platz.bild.x, platz.bild.y, { steps: 3 });
    await anna.mouse.click(platz.bild.x, platz.bild.y);
    const wunder = await anna.waitForFunction(() => [...window.ansicht.gebaeude.values()]
      .find((g) => g.b === window.ansicht.ich && g.art === 'wunder')?.i ?? null, null, { timeout: 15_000 })
      .then((h) => h.jsonValue());
    // Alle zwanzig bauen daran: 4400 Sekunden fuer einen, mit zwanzig rund 600.
    await zeitraffer(anna, code, 20);
    await expect.poll(() => eigeneFertig(anna, 'wunder'), { message: 'das Wunder steht', timeout: 120_000 }).toBe(1);
    await zeitraffer(anna, code, 1);

    // ---- Die Uhr laeuft zum Sieg - fuer Anna und fuer Bert. ----
    await expect(anna.locator('#buendnisansage')).toContainText('Dein Wunder steht — Sieg in');
    await expect(bert.locator('#buendnisansage')).toContainText('Das Wunder von Anna steht — Sieg in');
    const rest = () => anna.evaluate(() => window.ansicht.wunderuhren[0]?.rest ?? null);
    const erst = await rest();
    expect(erst, 'die Uhr steht bei zehn Minuten oder darunter').toBeLessThanOrEqual(600);
    await expect.poll(rest, { message: 'die Uhr laeuft', timeout: 15_000 }).toBeLessThan(erst);

    // ---- Das Bild: die Stufen der Krone vor dem Wunder. ----
    const vorn = await anna.evaluate((g) => {
      const a = window.ansicht;
      const w = a.gebaeude.get(g);
      const n = a.werte.gebaeude.wunder.groesse;
      const gr = a.karte.groesse;
      // Vor dem Wunder heisst im Bild darunter: x und y groesser.
      for (let r = 2; r < 8; r++) {
        for (const [dx, dy] of [[n + r, n + r], [Math.floor(n / 2), n + r], [n + r, Math.floor(n / 2)]]) {
          const x = w.x + dx;
          const y = w.y + dy;
          if (x < gr - 3 && y < gr - 3 && a.karte.felder[y * gr + x] === 0 && !a.gebaeudeAn?.(x, y)) return { x, y };
        }
      }
      return { x: w.x + n + 2, y: w.y + n + 2 };
    }, wunder);
    await waehlen(anna, truppe, { zoom: 1, blick: vorn });
    const wo = await aufSeite(anna, { feld: vorn });
    await anna.mouse.click(wo.x, wo.y, { button: 'right' });
    await zeitraffer(anna, code, 10);
    await anna.waitForFunction(([ids, s]) => ids.every((id) => {
      const e = window.ansicht.nachher.get(id);
      const alt = window.ansicht.vorher.get(id);
      return e && alt && alt.x === e.x && alt.y === e.y && Math.hypot(e.x - s.x, e.y - s.y) < 4;
    }), [truppe, vorn], { timeout: 90_000 });
    await zeitraffer(anna, code, 1);
    await anna.evaluate(([ids, g]) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set(ids);
      a.beiAuswahl();
      a.kamera.zoom = 0.9;
      const m = a.gebaeudeMitte(a.gebaeude.get(g));
      a.blickAuf(m.x + 2.5, m.y + 2.5);
    }, [truppe, wunder]);
    await expect(anna.locator('.auswahlleiste .gruppe-eintrag')).toHaveCount(truppe.length);
    await expect(anna.locator('#zeitalter')).toContainText('Krone');
    expect(await figurenFrei(anna, { nur: truppe }), 'keine zwei Figuren uebereinander').toEqual([]);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: FAHRPLAN,
      ac: 'AC-19',
      titel: 'Die Krone im Browser gespielt: Annas Wunder steht, oben die Uhr bis zum Sieg; davor die Stufen der Krone - Hellebardier, schwere Armbrust, Kavalier, Belagerungsramme - und der Elite-Kriegswolf ihres Hauses',
      test: info,
    });

    // ---- Zehn Minuten spaeter hat Anna gewonnen. ----
    const minuten = await anna.evaluate(() => window.ansicht.takt / 600);
    await uhrStellen(anna, code, minuten + 10.2);
    await expect(anna.locator('#partieende')).toHaveText('Du hast gewonnen', { timeout: 30_000 });
    await expect(anna.locator('#partieendeGrund')).toHaveText('Das Wunder stand zehn Minuten');
    await expect(bert.locator('#partieende')).toHaveText('Anna hat gewonnen');
  });
});

test.describe('Drache gegen Mauer', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel; den Drachen ruft jedes Haus.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('fahrplan AC-19: das Ei ins Kloster, fuenf Moenche, den Drachen gerufen - und mit ihm ein Stueck aus Berts Steinmauer gerissen', async ({}, info) => {
    test.setTimeout(300_000);
    const { anna, bert, code } = partie;
    await rohstoffe(anna, code, 'Anna', { zeitalter: 3, holz: 2000, nahrung: 3000, gold: 3000 });
    await anna.waitForFunction(() => window.ansicht.zeitalter === 3);
    await expect(anna.locator('#zeitalterwechsel')).toBeHidden({ timeout: 15_000 });
    const dorf = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    // Wohnraum fuer Moenche und Drachen.
    for (let i = 0; i < 3; i++) await gebaeudeInDerNaehe(anna, code, 'Anna', 'haus', dorf, { von: 4 + i, bis: 16 });

    // ---- Das Ei: ein Dorfbewohner hebt es mit einem Rechtsklick auf. ----
    await anna.waitForFunction(() => window.ansicht && window.ansicht.eier.size > 0);
    const ei = await anna.evaluate(() => [...window.ansicht.eier.values()][0]);
    expect(ei.nest, 'es liegt in seiner Mulde').toBe(true);
    const kloster = await gebaeudeInDerNaehe(anna, code, 'Anna', 'kloster', { x: ei.x, y: ei.y }, { von: 5, bis: 12 });
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'dorfbewohner', x: ei.x - 4, y: ei.y + 1 })).toBe(1);
    const dk = EINHEITEN.dorfbewohner.kuerzel;
    const traeger = await anna.waitForFunction(({ ei, dk }) => {
      const a = window.ansicht;
      const nah = [...a.nachher.values()].filter((e) => e.b === a.ich && e.k === dk && Math.hypot(e.x - ei.x, e.y - ei.y) < 7);
      return nah.length ? nah[0].i : null;
    }, { ei, dk }).then((h) => h.jsonValue());
    await waehlen(anna, [traeger], { zoom: 1.8, blick: { x: ei.x, y: ei.y } });
    const amEi = await aufSeite(anna, { feld: { x: ei.x, y: ei.y } });
    await anna.mouse.click(amEi.x, amEi.y, { button: 'right' });
    await zeitraffer(anna, code, 6);
    await anna.waitForFunction((k) => window.ansicht.gebaeude.get(k)?.e === 1, kloster, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);

    // ---- Fuenf Moenche aus dem Kloster: Umschalt mit Klick bildet fuenf aus. ----
    const mk = EINHEITEN.moench.kuerzel;
    await gebaeudeWaehlen(anna, kloster, 1.6);
    await anna.locator('[data-ausbilden="moench"]').click({ modifiers: ['Shift'] });
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction((mk) => [...window.ansicht.nachher.values()]
      .filter((e) => e.b === window.ansicht.ich && e.k === mk && !e.s).length >= 5, mk, { timeout: 90_000 });
    await zeitraffer(anna, code, 1);

    // ---- Der Ruf: ein Knopf am Kloster, drei Minuten. ----
    await gebaeudeWaehlen(anna, kloster, 1.6);
    const rufen = anna.locator('#drachenrufen');
    await expect(rufen).toContainText('Drachen rufen');
    await expect(rufen, 'fuenf Moenche stehen am Kloster').toHaveAttribute('aria-disabled', 'false');
    await rufen.click();
    await expect(anna.locator('#buendnisansage')).toContainText('Du rufst den Drachen — noch');
    await zeitraffer(anna, code, 20);
    const drachenKuerzel = EINHEITEN.drache.kuerzel;
    const drache = await anna.waitForFunction((k) => {
      const a = window.ansicht;
      return [...a.nachher.values()].find((e) => e.b === a.ich && e.k === k)?.i ?? null;
    }, drachenKuerzel, { timeout: 60_000 }).then((h) => h.jsonValue());
    await zeitraffer(anna, code, 1);
    await expect(anna.locator('#buendnisansage')).not.toContainText('Du rufst den Drachen');

    // ---- Berts Steinmauer: fuenf Stuecke in einer Reihe, sechs bis vierzehn
    // Felder vom Drachen, auf Gras. ----
    const d = await anna.evaluate((id) => window.ansicht.nachher.get(id), drache);
    const linie = await anna.evaluate((d) => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const frei = (x, y) => x > 2 && y > 2 && x < g - 3 && y < g - 3 && a.karte.felder[y * g + x] === 0 && !a.gebaeudeAn?.(x, y);
      for (let r = 6; r < 15; r++) {
        for (const [dx, dy] of [[r, 0], [0, r], [r, r], [-r, 0], [0, -r], [r, -r], [-r, r], [-r, -r]]) {
          const x0 = Math.round(d.x) + dx - 2;
          const y0 = Math.round(d.y) + dy;
          const felder = [0, 1, 2, 3, 4].map((i) => ({ x: x0 + i, y: y0 }));
          // Mit einer Reihe Gras davor und dahinter, damit die Luecke zu sehen ist.
          if (felder.every((f) => frei(f.x, f.y) && frei(f.x, f.y - 1) && frei(f.x, f.y + 1))) return felder;
        }
      }
      return null;
    }, d);
    expect(linie, 'fuenf freie Felder fuer die Mauer').not.toBeNull();
    const stuecke = [];
    for (const f of linie) stuecke.push(await gebaeudeAufstellen(anna, code, 'Bert', 'steinmauer', f.x, f.y));
    await anna.waitForFunction((ids) => ids.every((g) => window.ansicht.gebaeude.has(g)), stuecke);
        const voll = GEBAEUDE.steinmauer.leben;
    expect(await anna.evaluate((g) => {
      const h = window.ansicht.gebaeude.get(g);
      return h.h ?? window.ansicht.gebaeudeLebenVoll(h);
    }, stuecke[2]), 'das Stueck ist unversehrt').toBe(voll);

    // ---- Der Rechtsklick auf die Mitte der Mauer: der Drache greift an. ----
    // Getroffen wird am Bild (bedienung AC-51) - die Stuecke stehen im Bild
    // uebereinander, also sagt das Zielzeichen, welches es ist.
    await waehlen(anna, [drache], { zoom: 1.4, blick: linie[2] });
    const auf = await aufSeite(anna, { gebaeude: stuecke[2] });
    await anna.mouse.move(auf.x, auf.y, { steps: 3 });
    await expect.poll(() => anna.evaluate(() => window.ansicht.zeigerZiel?.art ?? null)).toBe('angreifen');
    await anna.mouse.click(auf.x, auf.y, { button: 'right' });
    const zeichen = await anna.evaluate(() => window.ansicht.zielzeichen);
    expect(zeichen?.feindlich, 'ein Angriff, kein Gang').toBe(true);
    const n = linie.findIndex((f) => f.x === zeichen.x && f.y === zeichen.y);
    expect(n, 'ein Stueck mit Mauer zu beiden Seiten').toBeGreaterThanOrEqual(1);
    expect(n).toBeLessThanOrEqual(3);
    const ziel = stuecke[n];
    // 1800 Leben gegen 8 Angriff und 660 gegen Gebaeude: drei Feuerstoesse.
    await zeitraffer(anna, code, 2);
    await anna.waitForFunction((g) => !window.ansicht.gebaeude.has(g), ziel, { timeout: 90_000 });
    await zeitraffer(anna, code, 1);
    await expect.poll(() => bert.evaluate((g) => window.ansicht.gebaeude.has(g), ziel), { message: 'auch Bert sieht die Luecke' }).toBe(false);
    // Die Nachbarn stehen: eine Luecke, kein Abriss.
    expect(await anna.evaluate((ids) => ids.every((g) => window.ansicht.gebaeude.has(g)), [stuecke[n - 1], stuecke[n + 1]]),
      'die Stuecke daneben stehen').toBe(true);

    await anna.evaluate((f) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.beiAuswahl();
      a.kamera.zoom = 1.6;
      a.blickAuf(f.x, f.y);
    }, linie[n]);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(250);
    await nachweis(anna, {
      spec: FAHRPLAN,
      ac: 'AC-19',
      titel: 'Annas gerufener Drache hat ein Stück aus Berts Steinmauer gebrannt - die Lücke liegt in Trümmern, zu beiden Seiten steht die Mauer',
      test: info,
    });
  });
});
