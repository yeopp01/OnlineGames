// Ausbilden im Browser: das Dorfzentrum anklicken, Dorfbewohner einreihen,
// abbrechen, warten, wenn die Bevoelkerung voll ist
// (→ specs/10-strategie/bauen.md, bedienung.md AC-26).
//
// Eine eigene Partie, damit die Sammelfaelle in strategie-spielbild.spec.mjs
// nichts an der Nahrung und an der Bevoelkerung verschieben. Gelesen wird ueber
// `window.ansicht`, geklickt wie ein Mensch.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test, zeitraffer } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';
const BEDIENUNG = '10-strategie/bedienung.md';
const STARTWERT = 4711;

test.describe('Ausbilden', () => {
  test.describe.configure({ mode: 'serial' });

  let partie;
  let anna;
  let code;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { startwert: STARTWERT });
    ({ anna, code } = partie);
    // Naeher heran, damit Gebaeude und Figuren im Bild gut zu erkennen sind.
    await anna.evaluate(() => {
      const a = window.ansicht;
      const basis = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 1.8;
      a.blickAuf(basis.x + 1, basis.y + 1);
    });
  });

  test.afterAll(() => partieBeenden(partie));

  const meinZentrum = () => anna.evaluate(() => {
    const a = window.ansicht;
    const g = [...a.gebaeude.values()].find((b) => b.b === a.ich && b.art === 'dorfzentrum');
    return { ...g, bild: a.zuBild(g.x, g.y) };
  });

  test('bauen AC-22: zu Beginn ein Dorfzentrum, drei Dorfbewohner und ein Spaeherreiter', async ({}, info) => {
    const lage = await anna.evaluate(() => {
      const a = window.ansicht;
      const eigene = [...a.nachher.values()].filter((e) => e.b === a.ich);
      const gebaeude = [...a.gebaeude.values()].filter((g) => g.b === a.ich).map((g) => g.art);
      return { arten: eigene.map((e) => e.k).sort(), gebaeude, bev: a.vorraete.bev, raum: a.vorraete.raum };
    });
    expect(lage).toEqual({ arten: ['d', 'd', 'd', 's'], gebaeude: ['dorfzentrum'], bev: 4, raum: 5 });
    await expect(anna.locator('[data-rohstoff="bev"]')).toHaveText(/^\s*4\s*\/\s*5\s*$/);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-22',
      titel: 'Der Anfang: Dorfzentrum mit blauer Fahne, davor drei Dorfbewohner und ein Spaeherreiter, oben 4/5',
      test: info,
    });
  });

  test('bedienung AC-26 / bauen AC-10: das Dorfzentrum zeigt Ausbildung, Schlange und Fortschritt', async ({}, info) => {
    const zentrum = await meinZentrum();
    // Auf das Dach klicken, oberhalb der Figuren.
    await anna.mouse.click(zentrum.bild.x, zentrum.bild.y - 60);
    await expect(anna.locator('#auswahlleiste')).toBeVisible();
    await expect(anna.locator('#auswahlleiste')).toContainText('Dorfzentrum');
    expect(await anna.evaluate(() => window.ansicht.gewaehltesGebaeude)).toBe(zentrum.i);

    const knopf = anna.locator('[data-ausbilden="dorfbewohner"]');
    await expect(knopf).toBeEnabled();
    await expect(knopf).toContainText('50');
    const nahrung = await anna.evaluate(() => window.ansicht.vorraete.nahrung);
    await knopf.click();
    await knopf.click();
    await expect(anna.locator('[data-abbrechen]')).toHaveCount(2);
    await anna.waitForFunction((n) => window.ansicht.vorraete.nahrung === n - 100, nahrung);

    // Der laufende Auftrag zeigt seinen Fortschritt: der Balken waechst.
    const breite = () => anna.locator('.laufend .fortschritt > span').evaluate((s) => parseFloat(s.style.width) || 0);
    // Fuer das Bild ein Stueck weit: bei ein paar Prozent sieht man den Balken kaum.
    await expect.poll(breite, { timeout: 20_000 }).toBeGreaterThanOrEqual(30);
    await expect(anna.locator('#auswahlleiste')).toBeInViewport();
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-26',
      titel: 'Dorfzentrum ausgewaehlt: unten der Knopf Dorfbewohner fuer 50 Nahrung, daneben zwei Auftraege',
      test: info,
    });
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-10',
      titel: 'Die Schlange des Dorfzentrums: der erste Auftrag mit gruenem Fortschrittsbalken, der zweite wartet',
      test: info,
    });

    // Ein Klick auf den zweiten Eintrag bricht ihn ab, die Nahrung kommt zurueck.
    await anna.locator('[data-abbrechen="1"]').click();
    await expect(anna.locator('[data-abbrechen]')).toHaveCount(1);
    await anna.waitForFunction((n) => window.ansicht.vorraete.nahrung === n - 50, nahrung);
  });

  test('bauen AC-12 / bauen AC-15: der Neue steht vor dem Dorfzentrum, danach ist die Bevoelkerung voll', async ({}, info) => {
    const zentrum = await meinZentrum();
    const vorher = await anna.evaluate(() => [...window.ansicht.nachher.values()].filter((e) => e.b === window.ansicht.ich).map((e) => e.i));
    // Noch einer in die Schlange: der zweite muss warten, weil der erste den
    // letzten Platz nimmt.
    await anna.locator('[data-ausbilden="dorfbewohner"]').click();
    await expect(anna.locator('[data-abbrechen]')).toHaveCount(2);

    await zeitraffer(anna, code, 10);
    await anna.waitForFunction((alt) => [...window.ansicht.nachher.values()]
      .some((e) => e.b === window.ansicht.ich && !alt.includes(e.i)), vorher, { timeout: 30_000 });
    await zeitraffer(anna, code, 1);

    const neu = await anna.evaluate((alt) => [...window.ansicht.nachher.values()]
      .find((e) => e.b === window.ansicht.ich && !alt.includes(e.i)), vorher);
    expect(neu.k).toBe('d');
    const abstand = Math.max(Math.abs(neu.x - zentrum.x), Math.abs(neu.y - zentrum.y));
    expect(abstand).toBeGreaterThanOrEqual(2);
    expect(abstand).toBeLessThanOrEqual(3);
    expect(neu.x + neu.y, 'vor dem Gebaeude, nicht dahinter').toBeGreaterThan(zentrum.x + zentrum.y);

    // Jetzt 5/5: der verbliebene Auftrag wartet und die Leiste sagt warum.
    await expect(anna.locator('[data-rohstoff="bev"]')).toHaveText(/^\s*5\s*\/\s*5\s*$/);
    await expect(anna.locator('#wartegrund')).toHaveText('Bevoelkerung voll - Haus bauen');
    await expect(anna.locator('#wartegrund')).toBeInViewport();
    await expect(anna.locator('[data-abbrechen]')).toHaveCount(1);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-12',
      titel: 'Vier statt drei Dorfbewohner: der Neue steht vorn am Dorfzentrum bei den anderen, mit dem Reiter 5/5',
      test: info,
    });
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-15',
      titel: 'Bevoelkerung voll: der naechste Auftrag wartet, die Leiste unten sagt Haus bauen',
      test: info,
    });
  });

  test('bedienung AC-29: Auswahl zeigt Name, Leben und was der Dorfbewohner traegt', async ({}, info) => {
    // Erst das Gebaeude: Name und Leben.
    const zentrum = await meinZentrum();
    await anna.mouse.click(zentrum.bild.x, zentrum.bild.y - 60);
    await expect(anna.locator('#auswahlleiste .leben')).toHaveAttribute('data-leben', '2400/2400');

    // Dann ein Dorfbewohner: angeklickt wie ein Mensch, an der Koerpermitte.
    const ziel = await anna.evaluate(() => {
      const a = window.ansicht;
      const e = [...a.nachher.values()].find((f) => f.b === a.ich && f.k === 'd' && f.l === 0);
      const p = a.zuBild(e.x, e.y);
      return { i: e.i, x: p.x, y: p.y - a.figurenHoehe() * 0.6 };
    });
    await anna.mouse.click(ziel.x, ziel.y);
    expect(await anna.evaluate(() => [...window.ansicht.ausgewaehlt])).toEqual([ziel.i]);
    const leiste = anna.locator('#auswahlleiste');
    await expect(leiste).toContainText('Dorfbewohner');
    await expect(leiste.locator('.leben')).toHaveAttribute('data-leben', '25/25');
    await expect(leiste.locator('#ladung')).toHaveText('traegt nichts');

    // Rechtsklick auf den naechsten Beerenstrauch, dann sammelt er.
    const beere = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const e = a.nachher.get([...a.ausgewaehlt][0]);
      let bestes = null;
      for (let i = 0; i < a.karte.felder.length; i++) {
        if (a.karte.felder[i] !== 2) continue;
        const d = Math.hypot((i % g) - e.x, ((i / g) | 0) - e.y);
        if (!bestes || d < bestes.d) bestes = { d, x: i % g, y: (i / g) | 0 };
      }
      return a.zuBild(bestes.x, bestes.y);
    });
    await anna.mouse.click(beere.x, beere.y, { button: 'right' });
    await zeitraffer(anna, code, 5);
    await anna.waitForFunction((id) => (window.ansicht.nachher.get(id)?.l || 0) >= 4, ziel.i, { timeout: 30_000 });
    await zeitraffer(anna, code, 1);

    // Die Leiste zeigt, was er in diesem Augenblick traegt - genau die Zahl der Ansicht.
    const traegt = await anna.evaluate((id) => window.ansicht.nachher.get(id).l, ziel.i);
    await expect(leiste.locator('#ladung')).toHaveAttribute('data-ware', 'n');
    await expect(leiste.locator('#ladung')).toContainText(/traegt \d+ Nahrung von 10/);
    const gezeigt = Number((await leiste.locator('#ladung').textContent()).match(/traegt (\d+)/)[1]);
    expect(gezeigt).toBeGreaterThanOrEqual(traegt);
    expect(gezeigt).toBeGreaterThanOrEqual(4);
    await expect(leiste).toBeInViewport();
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-29',
      titel: 'Ein Dorfbewohner ausgewaehlt: unten Name, gruener Lebensbalken 25 / 25 und wie viel Nahrung er traegt',
      test: info,
    });
  });
});
