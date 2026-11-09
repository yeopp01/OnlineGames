// Ein Bündnis lösen im Bild (→ specs/10-strategie/spielziel.md AC-24): Anna
// und Cem sind verbündet, Bert ist allein. Anna klickt „Bündnis lösen", der
// Knopf fragt einmal zurück, und nach dem Ja sehen alle drei oben rechts die
// Ansage mit der Uhr der Frist. Cem sieht sofort nicht mehr durch Annas
// Augen - ihr Dorf liegt für ihn im Nebel -, aber erst nach 60 Spielsekunden
// ist ein Rechtsklick auf Annas Mann ein Angriff. Die Regeln selbst prüft
// tests/strategie-buendnisse.test.mjs (spielziel AC-21) gegen die Welt.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test, zeitraffer } from '../helpers/seite.mjs';
import {
  bedienteileFrei, freieWiesen, partieBeenden, partieZuDritt,
} from '../helpers/strategie.mjs';

const SPIELZIEL = '10-strategie/spielziel.md';

// Wo ein Feld auf der Seite liegt - fuer den Rechtsklick.
const aufSeite = (page, feld) => page.evaluate((f) => {
  const a = window.ansicht;
  const p = a.zuBild(f.x, f.y);
  const r = a.leinwand.getBoundingClientRect();
  return { x: r.left + p.x, y: r.top + p.y };
}, feld);

const ids = (page) => page.evaluate(() => {
  const a = window.ansicht;
  return Object.fromEntries([...a.spieler.values()].map((s) => [s.name, { id: s.id, basis: s.basis }]));
});

test.describe('Bündnis lösen', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Im Nebel: dass die gemeinsame Sicht sofort endet, gehoert zum Bild.
    partie = await partieZuDritt(browser, info, { teams: [1, 2, 1] });
  });
  test.afterAll(() => partieBeenden(partie));

  test('spielziel AC-24: der Knopf fragt einmal zurück, alle sehen die Ansage mit der Uhr, nach der Frist ist der Rechtsklick rot', async ({}, info) => {
    test.setTimeout(120_000);
    const { anna, bert, cem, code } = partie;
    const wer = await ids(anna);

    // Vorher: Anna und Cem haben den Knopf, Bert nicht - er ist allein in
    // seinem Team. Cem sieht Annas Dorf durch ihre Augen.
    await expect(anna.locator('#buendnisloesen')).toBeVisible();
    await expect(cem.locator('#buendnisloesen')).toBeVisible();
    await expect(bert.locator('#buendnisloesen')).toBeHidden();
    // Beide Knoepfe ganz im Fenster: der Hinweis daneben wird gekuerzt, nicht
    // der Knopf hinausgeschoben (im ersten Entwurf ragte "Aufgeben" ueber den
    // Rand - `bedienteileFrei` misst nur die Kopfzeile als Ganzes).
    await expect(anna.locator('#buendnisloesen')).toBeInViewport({ ratio: 1 });
    await expect(anna.locator('#aufgeben')).toBeInViewport({ ratio: 1 });
    const annasDorfBeiCem = () => cem.evaluate((b) => {
      const a = window.ansicht;
      a.nebel.rechnen(a, true);
      return { sieht: a.nebel.sieht(b.x, b.y), erkundet: a.nebel.hatErkundet(b.x, b.y) };
    }, wer.Anna.basis);
    expect(await annasDorfBeiCem(), 'vorher sieht Cem Annas Dorf').toEqual({ sieht: true, erkundet: true });

    // Auf einer Wiese bei Cem: sein Dorfbewohner und einer Annas, drei Felder
    // auseinander. Dorfbewohner wachen nicht - keiner faengt von selbst an.
    const [wiese] = await freieWiesen(cem, 1);
    await einheitenAufstellen(cem, code, 'Cem', 1, { art: 'dorfbewohner', x: wiese.x + 2, y: wiese.y });
    await einheitenAufstellen(cem, code, 'Anna', 1, { art: 'dorfbewohner', x: wiese.x - 2, y: wiese.y });
    const paar = await cem.waitForFunction(([w, annaId]) => {
      const a = window.ansicht;
      const nahe = (e) => Math.hypot(e.x - w.x, e.y - w.y) < 7;
      const meiner = [...a.nachher.values()].find((e) => e.k === 'd' && e.b === a.ich && nahe(e) && e.x > w.x);
      const ihrer = [...a.nachher.values()].find((e) => e.k === 'd' && e.b === annaId && nahe(e));
      return meiner && ihrer && { meiner: meiner.i, ihrer: { i: ihrer.i, x: ihrer.x, y: ihrer.y } };
    }, [wiese, wer.Anna.id]).then((h) => h.jsonValue());

    // 1. Der Knopf fragt zurueck; "Verbündet bleiben" schickt nichts.
    await anna.locator('#buendnisloesen').click();
    await expect(anna.locator('#buendnisfrage')).toBeVisible();
    await anna.locator('#buendnisNein').click();
    await expect(anna.locator('#buendnisfrage')).toBeHidden();
    await anna.waitForTimeout(500);
    expect(await anna.evaluate(() => window.ansicht.kuendigungen.size), 'ohne Ja keine Kuendigung').toBe(0);

    await anna.locator('#buendnisloesen').click();
    await expect(anna.locator('#buendnisfrage')).toBeInViewport();
    await expect(anna.locator('#buendnisJa')).toHaveText('Ja, lösen');
    await nachweis(anna, {
      spec: SPIELZIEL,
      ac: 'AC-24',
      titel: 'Anna hat „Bündnis lösen" oben rechts geklickt: die Rückfrage sagt, dass keiner mehr sieht, was der andere sieht, und dass sie in 60 Sekunden Gegner sind — „Verbündet bleiben" steht vorn',
      test: info,
    });
    await anna.locator('#buendnisJa').click();

    // 2. Alle bekommen die Kuendigung - und die Ansage mit der Uhr.
    for (const seite of [anna, bert, cem]) {
      await seite.waitForFunction(() => window.ansicht.kuendigungen.size === 1, undefined, { timeout: 10_000 });
    }
    await expect(anna.locator('#buendnisansage')).toHaveText(/^Du hast dein Bündnis gelöst — Gegner in \d+ s$/);
    await expect(cem.locator('#buendnisansage')).toHaveText(/^Anna hat das Bündnis gelöst — Gegner in \d+ s$/);
    await expect(bert.locator('#buendnisansage')).toHaveText(/^Anna hat das Bündnis gelöst — Gegner in \d+ s$/);
    // Die Uhr laeuft: in zwei Sekunden steht eine kleinere Zahl da.
    const rest = async () => Number((await cem.locator('#buendnisansage b').textContent()).match(/\d+/)[0]);
    const erst = await rest();
    expect(erst).toBeGreaterThan(50);
    await cem.waitForTimeout(2200);
    expect(await rest(), 'die Uhr zaehlt herunter').toBeLessThan(erst);
    // Der Knopf ist weg: bei Anna (zweimal geht nicht), bei Cem (seine
    // einzige Verbuendete geht schon).
    await expect(anna.locator('#buendnisloesen')).toBeHidden();
    await expect(cem.locator('#buendnisloesen')).toBeHidden();

    // Die Sicht ist sofort getrennt, verbuendet sind sie noch.
    expect(await annasDorfBeiCem(), 'Annas Dorf ist fuer Cem im Nebel, erkundet bleibt es').toEqual({ sieht: false, erkundet: true });
    const lage = await cem.evaluate((annaId) => {
      const a = window.ansicht;
      const annas = [...a.gebaeude.values()].filter((b) => b.b === annaId);
      const gezeigt = new Set(a.gezeigteGebaeude().map((b) => b.i));
      return {
        feindlich: a.feindlich(annaId),
        teiltSicht: a.teiltSicht(annaId),
        annas: annas.length,
        erinnert: annas.every((b) => a.erinnert.has(b.i) && gezeigt.has(b.i)),
      };
    }, wer.Anna.id);
    expect(lage.feindlich, 'Gegner erst nach der Frist').toBe(false);
    expect(lage.teiltSicht).toBe(false);
    expect(lage.annas).toBeGreaterThan(0);
    expect(lage.erinnert, 'Annas Gebaeude stehen als Erinnerung im Nebel').toBe(true);

    // Waehrend der Frist ist Annas Mann noch kein Ziel - dieselbe Frage, die
    // ein Rechtsklick stellt. Nicht geklickt: ein Gang braechte Cems Mann
    // neben ihren, und der Rechtsklick danach traefe den eigenen.
    expect(await cem.evaluate((f) => window.ansicht.feindlichAn(f), paar.ihrer), 'waehrend der Frist kein Ziel').toBeNull();

    // Das Bild waehrend der Frist: Cem sieht auf Annas Dorf - grau, im Nebel.
    await cem.evaluate((b) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set();
      a.beiAuswahl();
      a.kamera.zoom = 1;
      a.blickAuf(b.x, b.y);
    }, wer.Anna.basis);
    await cem.waitForTimeout(300);
    await expect(cem.locator('#buendnisansage')).toBeInViewport();
    expect(await bedienteileFrei(cem)).toEqual([]);
    await nachweis(cem, {
      spec: SPIELZIEL,
      ac: 'AC-24',
      titel: 'Cems Bild nach Annas Kündigung: oben rechts „Anna hat das Bündnis gelöst — Gegner in … s" mit der Uhr der Frist; Annas Dorf, das er eben noch durch ihre Augen sah, liegt grau im Nebel — die Gebäude stehen, wie er sie zuletzt sah',
      test: info,
    });

    // 3. Die Frist laeuft ab - im Zeitraffer, dann wieder in Echtzeit, damit
    // "jetzt Gegner" fuers Bild stehen bleibt.
    await zeitraffer(cem, code, 10);
    await cem.waitForFunction((annaId) => window.ansicht.feindlich(annaId), wer.Anna.id, { timeout: 30_000 });
    await zeitraffer(cem, code, 1);
    await expect(cem.locator('#buendnisansage')).toHaveText('Anna hat das Bündnis gelöst — jetzt Gegner');
    await expect(anna.locator('#buendnisansage')).toHaveText('Du hast dein Bündnis gelöst — jetzt Gegner');

    // Jetzt ist der Rechtsklick auf Annas Mann ein Angriff: das Zeichen ist rot.
    const jetzt = await cem.evaluate((i) => {
      const e = window.ansicht.nachher.get(i);
      return e && { x: e.x, y: e.y };
    }, paar.ihrer.i);
    expect(jetzt, 'Annas Mann steht noch in Cems Sicht').toBeTruthy();
    await cem.evaluate(([id, f]) => {
      const a = window.ansicht;
      a.ausgewaehlt = new Set([id]);
      a.beiAuswahl();
      a.kamera.zoom = 2;
      a.blickAuf(f.x + 2, f.y + 1);
    }, [paar.meiner, jetzt]);
    await cem.waitForTimeout(300);
    const ziel = await aufSeite(cem, jetzt);
    await cem.mouse.click(ziel.x, ziel.y, { button: 'right' });
    expect(await cem.evaluate(() => window.ansicht.zielzeichen?.feindlich), 'nach der Frist rot').toBe(true);
    await cem.evaluate(() => { window.ansicht.zielzeichen.seit = performance.now() + 60_000; });
    await expect(cem.locator('#buendnisansage')).toBeInViewport();
    expect(await bedienteileFrei(cem)).toEqual([]);
    await nachweis(cem, {
      spec: SPIELZIEL,
      ac: 'AC-24',
      titel: 'Nach der Frist: oben rechts „Anna hat das Bündnis gelöst — jetzt Gegner", und Cems Rechtsklick auf Annas Dorfbewohner setzt ein rotes Zeichen — ein Angriff',
      test: info,
    });
  });
});

test.describe('Feste Bündnisse', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuDritt(browser, info, { sicht: 'aufgedeckt', teams: [1, 2, 1], buendnisse: 'fest' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('spielziel AC-24: bei „fest" fehlt der Knopf - auch wer einen Verbündeten hat, kann nur aufgeben', async () => {
    const { anna, bert, cem } = partie;
    for (const seite of [anna, bert, cem]) {
      expect(await seite.evaluate(() => window.ansicht.buendnisse)).toBe('fest');
      await expect(seite.locator('#aufgeben')).toBeVisible();
      await expect(seite.locator('#buendnisloesen')).toBeHidden();
      await expect(seite.locator('#buendnisansage')).toBeHidden();
    }
    // Gegenprobe: Anna und Cem sind verbuendet - der Knopf fehlt nicht
    // mangels Verbuendetem, sondern wegen der Einstellung.
    expect(await anna.evaluate(() => {
      const a = window.ansicht;
      const cem = [...a.spieler.values()].find((s) => s.name === 'Cem');
      return a.feindlich(cem.id);
    })).toBe(false);
  });
});
