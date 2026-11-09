// Bündnisse (→ specs/00-plattform/spielauswahl.md AC-22,
// specs/10-strategie/spielziel.md AC-14): im Warteraum hat jeder Platz ein
// Team, die KIs eingeschlossen; jeder wählt sein eigenes, der Gastgeber
// jedes. In der Partie ist ein Verbündeter kein Ziel: ein Rechtsklick auf
// seine Einheit ist ein Gang dorthin, das Zeichen bleibt weiß. Die Regeln
// selbst prüfen tests/strategie-buendnisse.test.mjs und
// tests/spielauswahl.test.mjs über den Server.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { ANMELDUNG, einheitenAufstellen, expect, fehlerSammeln, test } from '../helpers/seite.mjs';
import {
  bedienteileFrei, freieWiesen, partieBeenden, partieZuDritt, teamZeigt,
} from '../helpers/strategie.mjs';

const AUSWAHL = '00-plattform/spielauswahl.md';
const SPIELZIEL = '10-strategie/spielziel.md';

test('auswahl AC-22: Teams im Warteraum - jeder wählt seins, der Gastgeber auch das der KI', async ({ browser }, info) => {
  const optionen = { baseURL: info.project.use.baseURL, viewport: { width: 1100, height: 900 }, locale: 'de-DE' };
  const anna = await (await browser.newContext({ ...optionen, storageState: ANMELDUNG })).newPage();
  const bert = await (await browser.newContext(optionen)).newPage();
  const fehler = [fehlerSammeln(anna), fehlerSammeln(bert)];
  try {
    await anna.goto('/');
    await anna.locator('[data-oeffnen="strategie"]').click();
    await anna.locator('[data-einstellung="ki"]').fill('1');
    await anna.locator('[data-eroeffnen="strategie"]').click();
    await expect(anna.locator('#raumcode')).toHaveText(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
    const code = (await anna.locator('#raumcode').textContent()).trim();

    await bert.goto('/');
    await bert.locator('#name').fill('Bert');
    await bert.locator('#code').fill(code);
    await bert.locator('#beitreten').click();

    // Drei Plätze, die KI eingeschlossen - jeder ohne Team zu Beginn.
    await expect(bert.locator('#spielerliste li .name')).toHaveText(['Anna', 'Bert (du)', 'KI 1']);
    await expect(bert.locator('#spielerliste li.vom-spiel')).toHaveCount(1);

    // Bert hat eine Auswahl nur auf seinem Platz; Anna und die KI liest er.
    const zeilen = bert.locator('#spielerliste li');
    await expect(zeilen.nth(0).locator('select')).toHaveCount(0);
    await expect(zeilen.nth(2).locator('select')).toHaveCount(0);
    await zeilen.nth(1).locator('[data-wahl="team"]').selectOption(JSON.stringify(2));
    // Anna sieht es, ohne etwas zu tun.
    await teamZeigt(anna, 1, 2);

    // Der Gastgeber hat auf jedem Platz eine Auswahl: er setzt sich und die KI.
    const beiAnna = anna.locator('#spielerliste li');
    await expect(beiAnna.locator('select')).toHaveCount(3);
    await beiAnna.nth(0).locator('[data-wahl="team"]').selectOption(JSON.stringify(1));
    await beiAnna.nth(2).locator('[data-wahl="team"]').selectOption(JSON.stringify(2));
    await teamZeigt(bert, 0, 1);
    await expect(zeilen.nth(2).locator('[data-wahl="team"]')).toHaveText('Team 2');
    await expect(zeilen.nth(1).locator('[data-wahl="team"]')).toHaveValue(JSON.stringify(2));

    // Und die Einstellung dazu steht bei allen.
    await expect(bert.locator('[data-wert="buendnisse"]')).toHaveText('lösbar');

    await nachweis(bert, {
      spec: AUSWAHL,
      ac: 'AC-22',
      titel: 'Bert im Warteraum: Anna steht in Team 1, er selbst und die KI in Team 2 — sein eigenes Team wählt er, das der anderen liest er; darunter „Bündnisse: lösbar"',
      test: info,
    });
    expect(fehler.flat(), 'Eine der Seiten hat Fehler gemeldet').toEqual([]);
  } finally {
    await anna.context().close();
    await bert.context().close();
  }
});

test.describe('Verbündete', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Anna und Cem in Team 1, Bert allein in Team 2. Handelt nicht vom Nebel
    // (die gemeinsame Sicht ist spielziel AC-19).
    partie = await partieZuDritt(browser, info, { sicht: 'aufgedeckt', teams: [1, 2, 1] });
  });
  test.afterAll(() => partieBeenden(partie));

  const aufSeite = (page, feld) => page.evaluate((f) => {
    const a = window.ansicht;
    const p = a.zuBild(f.x, f.y);
    const r = a.leinwand.getBoundingClientRect();
    return { x: r.left + p.x, y: r.top + p.y };
  }, feld);

  test('spielziel AC-14: ein Rechtsklick auf den Verbündeten ist ein Gang, auf den Gegner ein Angriff', async ({}, info) => {
    const { anna, code } = partie;
    // Die Teams sind angekommen: Anna sieht Cem als verbündet, Bert nicht.
    const sicht = await anna.evaluate(() => {
      const a = window.ansicht;
      const nach = Object.fromEntries([...a.spieler.values()].map((s) => [s.name, { team: s.team ?? null, feindlich: a.feindlich(s.id) }]));
      return nach;
    });
    expect(sicht).toEqual({
      Anna: { team: 1, feindlich: false },
      Bert: { team: 2, feindlich: true },
      Cem: { team: 1, feindlich: false },
    });

    const [wiese] = await freieWiesen(anna, 1);
    // Cems Dorfbewohner, links davon Annas Miliz. Die Miliz wacht (sie greift
    // an, was feindlich in Sicht kommt) - Cem ist es nicht.
    await einheitenAufstellen(anna, code, 'Cem', 1, { art: 'dorfbewohner', x: wiese.x + 1, y: wiese.y });
    await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'miliz', x: wiese.x - 4, y: wiese.y });
    const { miliz, cem } = await anna.waitForFunction((w) => {
      const a = window.ansicht;
      const cemId = [...a.spieler.values()].find((s) => s.name === 'Cem').id;
      // Der Pruefgriff legt auf den Ring um das Feld, nicht auf das Feld selbst.
      const nahe = (e) => Math.hypot(e.x - w.x, e.y - w.y) < 7;
      const miliz = [...a.nachher.values()].find((e) => e.k === a.werte.einheiten.miliz.kuerzel && e.b === a.ich && nahe(e));
      const cem = [...a.nachher.values()].find((e) => e.k === 'd' && e.b === cemId && nahe(e));
      return miliz && cem && { miliz: { i: miliz.i }, cem: { i: cem.i, x: cem.x, y: cem.y, h: cem.h } };
    }, wiese).then((h) => h.jsonValue());

    await anna.evaluate(([id, w]) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set([id]);
      a.beiAuswahl();
      a.kamera.zoom = 2.2;
      a.blickAuf(w.x, w.y + 1);
    }, [miliz.i, wiese]);

    // 1. Rechtsklick auf Cems Dorfbewohner: kein Ziel, das Zeichen ist weiß.
    const aufCem = await aufSeite(anna, cem);
    await anna.mouse.click(aufCem.x, aufCem.y, { button: 'right' });
    const zeichen = await anna.evaluate(() => window.ansicht.zielzeichen && { ...window.ansicht.zielzeichen });
    expect(zeichen, 'ein Zeichen steht').toBeTruthy();
    expect(zeichen.feindlich, 'ein Verbündeter ist kein Ziel').toBe(false);
    // Das Zeichen bleibt fürs Bild stehen (es verblasst sonst nach einer Sekunde).
    await anna.evaluate(() => { window.ansicht.zielzeichen.seit = performance.now() + 60_000; });

    // Das Bild im Anlauf: zwei Felder vor dem Ziel sind beide Figuren noch
    // getrennt zu sehen - angekommen steht die Miliz auf seinem Platz.
    await anna.waitForFunction(([m, c]) => {
      const e = window.ansicht.nachher.get(m);
      return e && Math.hypot(e.x - c.x, e.y - c.y) < 2.6;
    }, [miliz.i, cem], { timeout: 15_000 });
    await nachweis(anna, {
      spec: SPIELZIEL,
      ac: 'AC-14',
      titel: 'Annas Miliz (blau) geht auf den Dorfbewohner ihres Verbündeten Cem (grün) zu — der Rechtsklick auf ihn hat ein weißes Zeichen gesetzt, kein rotes: ein Gang, kein Angriff',
      test: info,
    });

    // Sie kommt an und lässt ihn in Ruhe: drei Sekunden danach hat er sein
    // volles Leben.
    await anna.waitForFunction(([m, c]) => {
      const e = window.ansicht.nachher.get(m);
      return e && Math.hypot(e.x - c.x, e.y - c.y) < 1.6;
    }, [miliz.i, cem], { timeout: 15_000 });
    await anna.waitForTimeout(3000);
    expect(await anna.evaluate((c) => window.ansicht.nachher.get(c.i)?.h, cem), 'Cems Dorfbewohner hat sein Leben').toBe(cem.h);

    // 2. Gegenprobe: Berts Dorfbewohner, gleich daneben - rot, ein Angriff.
    await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'dorfbewohner', x: wiese.x, y: wiese.y + 3 });
    const bert = await anna.waitForFunction((w) => {
      const a = window.ansicht;
      const bertId = [...a.spieler.values()].find((s) => s.name === 'Bert').id;
      const e = [...a.nachher.values()].find((x) => x.k === 'd' && x.b === bertId && Math.hypot(x.x - w.x, x.y - w.y) < 6);
      return e && { x: e.x, y: e.y };
    }, wiese).then((h) => h.jsonValue());
    const aufBert = await aufSeite(anna, bert);
    await anna.mouse.click(aufBert.x, aufBert.y, { button: 'right' });
    expect(await anna.evaluate(() => window.ansicht.zielzeichen.feindlich), 'ein Gegner ist ein Ziel').toBe(true);
  });
});

// Gemeinsame Sicht (spielziel AC-19): im Nebel sieht Anna, was Cem sieht -
// sein Dorf liegt weit weg von ihrem und ist trotzdem hell, und ein Mann
// Berts darin steht in ihrem Bild. Die Regel selbst pruefen
// tests/strategie-buendnisse.test.mjs und tests/netz.test.mjs.
test.describe('Gemeinsame Sicht', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuDritt(browser, info, { teams: [1, 2, 1] });
  });
  test.afterAll(() => partieBeenden(partie));

  test('spielziel AC-19: Anna sieht im Nebel, was ihr Verbündeter Cem sieht - Bert nicht', async ({}, info) => {
    const { anna, bert, code } = partie;
    await anna.waitForFunction(() => window.ansicht.nebelAn && window.ansicht.nebel.takt > -Infinity);
    const orte = await anna.evaluate(() => {
      const a = window.ansicht;
      const von = (name) => [...a.spieler.values()].find((s) => s.name === name);
      return { cem: von('Cem').basis, bert: von('Bert').basis, anna: von('Anna').basis, bertId: von('Bert').id };
    });

    // Ein Dorfbewohner Berts am Rand von Cems Dorf - auf der Seite, die von
    // Annas Dorf wegzeigt. Ein Dorfbewohner wacht nicht: keiner beginnt ein
    // Gefecht, waehrend das Bild entsteht.
    const weg = (w) => Math.sign(orte.cem[w] - orte.anna[w]) || 1;
    const ziel = { x: orte.cem.x + 5 * weg('x'), y: orte.cem.y + 5 * weg('y') };
    await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'dorfbewohner', ...ziel });
    const lage = await anna.waitForFunction(([z, bertId]) => {
      const a = window.ansicht;
      const fremder = [...a.nachher.values()].find((e) => e.b === bertId && Math.hypot(e.x - z.x, e.y - z.y) < 4);
      return fremder && { i: fremder.i, x: fremder.x, y: fremder.y };
    }, [ziel, orte.bertId], { timeout: 10_000 }).then((h) => h.jsonValue());

    const sicht = await anna.evaluate(([o, f]) => {
      const a = window.ansicht;
      a.nebel.rechnen(a, true);
      const cemsGebaeude = [...a.gebaeude.values()].filter((b) => b.b !== a.ich && !a.feindlich(b.b));
      const gezeigt = new Set(a.gezeigteGebaeude().map((b) => b.i));
      return {
        weit: Math.hypot(o.cem.x - o.anna.x, o.cem.y - o.anna.y),
        cemsDorfHell: a.nebel.sieht(o.cem.x, o.cem.y),
        bertsDorfBekannt: a.nebel.hatErkundet(o.bert.x, o.bert.y),
        fremderZuSehen: a.zuSehen(o.bertId, f.x, f.y),
        cemsGebaeude: cemsGebaeude.length,
        alleGezeigt: cemsGebaeude.every((b) => gezeigt.has(b.i)),
      };
    }, [orte, lage]);
    expect(sicht.weit, 'Cems Dorf ist weit weg von Annas').toBeGreaterThan(20);
    expect(sicht.cemsDorfHell, 'Cems Dorf ist hell').toBe(true);
    expect(sicht.cemsGebaeude, 'Cems Gebaeude kommen an').toBeGreaterThan(0);
    expect(sicht.alleGezeigt, 'und stehen im Bild').toBe(true);
    expect(sicht.fremderZuSehen, 'Berts Mann in Cems Sicht steht in Annas Bild').toBe(true);
    expect(sicht.bertsDorfBekannt, 'Berts Dorf kennt Anna nicht').toBe(false);

    // Gegenprobe: Bert sieht weder Annas noch Cems Dorf.
    const beiBert = await bert.evaluate((o) => {
      const a = window.ansicht;
      a.nebel.rechnen(a, true);
      return { anna: a.nebel.hatErkundet(o.anna.x, o.anna.y), cem: a.nebel.hatErkundet(o.cem.x, o.cem.y) };
    }, orte);
    expect(beiBert, 'Bert kennt keines der beiden Doerfer').toEqual({ anna: false, cem: false });

    // Das Bild: Cems Dorf aus Annas Sicht, Berts Mann am Rand; die
    // Uebersichtskarte zeigt beide hellen Doerfer des Teams.
    await anna.evaluate(([o, f]) => {
      const a = window.ansicht;
      a.ausgewaehlt = new Set();
      a.beiAuswahl();
      a.kamera.zoom = 1.1;
      a.blickAuf((o.cem.x + f.x) / 2, (o.cem.y + f.y) / 2);
    }, [orte, lage]);
    await anna.waitForTimeout(300);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: SPIELZIEL,
      ac: 'AC-19',
      titel: 'Annas Bild im Nebel: das Dorf ihres Verbündeten Cem (grün) ist hell, obwohl es weit von ihrem liegt, und ein Dorfbewohner Berts (rot) an seinem Rand steht darin — auf der Übersichtskarte sind beide Dörfer des Teams aufgedeckt',
      test: info,
    });
  });
});
