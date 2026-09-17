// Schafe im Browser: Rechtsklick eines Dorfbewohners auf ein eigenes Schaf,
// er schlachtet es und huetet Nahrung vom Kadaver
// (→ specs/10-strategie/einheiten-und-befehle.md AC-17).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test, zeitraffer } from '../helpers/seite.mjs';
import { dorfbewohnerAnklicken, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const EINHEITEN = '10-strategie/einheiten-und-befehle.md';
const DARSTELLUNG = '10-strategie/darstellung.md';

test.describe('Schafe', () => {
  test.describe.configure({ mode: 'serial' });

  let partie;
  let anna;
  let code;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
    ({ anna, code } = partie);
    await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 1.6;
      a.blickAuf(b.x + 2, b.y + 2);
    });
  });

  test.afterAll(() => partieBeenden(partie));

  test('einheiten AC-17: Rechtsklick auf ein eigenes Schaf - geschlachtet, der Dorfbewohner huetet Nahrung', async ({}, info) => {
    const hirte = await dorfbewohnerAnklicken(anna);
    // Das eigene Schaf, das vorn im Bild steht und dem Dorfbewohner am naechsten ist.
    const schaf = await anna.evaluate((id) => {
      const a = window.ansicht;
      const e = a.nachher.get(id);
      const g = a.karte.groesse;
      // Ohne Vorrat daneben: an Beeren oder Baeumen saehe man den Kadaver schlecht.
      const frei = (t) => {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (a.karte.felder[(Math.round(t.y) + dy) * g + Math.round(t.x) + dx] !== 0) return false;
          }
        }
        return true;
      };
      const eigene = [...a.tiere.values()].filter((t) => t.b === a.ich && !t.g && frei(t));
      eigene.sort((p, q) => Math.hypot(p.x - e.x, p.y - e.y) - Math.hypot(q.x - e.x, q.y - e.y));
      const t = eigene.find((s) => {
        const p = a.zuBild(s.x, s.y);
        return p.x > 100 && p.x < a.leinwand.clientWidth - 100 && p.y > 100 && p.y < a.leinwand.clientHeight - 250;
      });
      const p = a.zuBild(t.x, t.y);
      return { i: t.i, x: t.x, y: t.y, bild: { x: p.x, y: p.y - 6 } };
    }, hirte);
    await anna.mouse.click(schaf.bild.x, schaf.bild.y, { button: 'right' });

    await zeitraffer(anna, code, 5);
    await anna.waitForFunction(({ hirte: h, schaf: s }) => {
      const a = window.ansicht;
      const tier = a.tiere.get(s);
      const e = a.nachher.get(h);
      return tier?.g && e && e.l >= 4 && e.a === 'n' && Math.hypot(e.x - tier.x, e.y - tier.y) <= 1.5;
    }, { hirte, schaf: schaf.i }, { timeout: 30_000 });
    await zeitraffer(anna, code, 1);

    const lage = await anna.evaluate(({ hirte: h, schaf: s }) => {
      const a = window.ansicht;
      return { nahrung: a.tiere.get(s).n, traegt: a.nachher.get(h).l };
    }, { hirte, schaf: schaf.i });
    expect(lage.nahrung).toBeLessThan(100);
    expect(lage.nahrung).toBeGreaterThan(80);
    await expect(anna.locator('#ladung')).toContainText(/traegt \d+ Nahrung/);

    // Nah heran: Kadaver und Hirte.
    await anna.evaluate((s) => {
      const a = window.ansicht;
      a.kamera.zoom = 2.5;
      a.blickAuf(s.x, s.y);
    }, schaf);
    await anna.waitForTimeout(150);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-17',
      titel: 'Das Schaf liegt geschlachtet, Beine nach oben, der Dorfbewohner daneben traegt Nahrung im Korb',
      test: info,
    });
  });

  test('darstellung AC-12: gezeichnet statt flach - Toene je Zeichnung und das Spielbild aus der Naehe', async ({ browser }, info) => {
    // Gezaehlt auf der Schautafel: deutlich verschiedene Farbtoene je Zeichnung.
    // Vor Runde 27 (flach) gemessen: Figuren 13-15, Schaf 5, Gebaeude 6-17,
    // Vorraete 5-6. Nach dem Umzeichnen: 26-30, 13, 20-35, 16-23.
    const tafel = await browser.newPage();
    await tafel.goto(new URL('/schautafel.html', anna.url()).href);
    await tafel.waitForFunction(() => window.schautafel?.tonstufen);
    const stufen = await tafel.evaluate(() => {
      const t = window.schautafel.tonstufen;
      const aus = {};
      for (const art of ['dorfbewohner', 'miliz', 'spaeherreiter']) aus[art] = t('figur', art);
      aus.schaf = t('figur', 'schaf');
      for (const art of ['dorfzentrum', 'haus', 'muehle', 'holzfaellerlager', 'bergbaulager']) aus[art] = t('gebaeude', art);
      for (const [name, art] of [['wald', 1], ['beere', 2], ['gold', 4], ['stein', 5]]) aus[name] = t('ding', art);
      return aus;
    });
    await tafel.close();
    const schwelle = {
      dorfbewohner: 20, miliz: 20, spaeherreiter: 20, schaf: 10,
      dorfzentrum: 19, haus: 19, muehle: 19, holzfaellerlager: 19, bergbaulager: 19,
      wald: 12, beere: 12, gold: 12, stein: 12,
    };
    for (const [name, mindestens] of Object.entries(schwelle)) {
      expect(stufen[name], `${name}: ${JSON.stringify(stufen)}`).toBeGreaterThanOrEqual(mindestens);
    }

    // Im Spielbild: Grasbueschel erst ab Zoom 1,2, bei Zoom 1 bleibt der Boden ruhig.
    await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt.clear();
      a.kamera.zoom = 2.2;
      a.blickAuf(b.x - 3, b.y + 2);
    });
    await anna.waitForTimeout(200);
    await nachweis(anna, {
      spec: DARSTELLUNG,
      ac: 'AC-12',
      titel: 'Aus der Naehe: Ziegeldach und Mauerwerk, schattierte Figuren, Mischwald mit Tannen, Grasbueschel - vorher flach, siehe docs/strategie/bilder',
      test: info,
    });
  });

  test('einheiten AC-22: ein Rahmen waehlt ein eigenes Schaf, ein Rechtsklick treibt es', async ({}, info) => {
    await anna.keyboard.press('Escape');
    // Ein lebendes eigenes Schaf, das frei steht, nah heran.
    const schaf = await anna.evaluate(() => {
      const a = window.ansicht;
      a.ausgewaehlt.clear();
      a.gewaehltesGebaeude = null;
      const basis = a.spieler.get(a.ich).basis;
      const lebend = [...a.tiere.values()].filter((t) => t.b === a.ich && !t.g)
        .sort((p, q) => (q.x + q.y) - (p.x + p.y));
      const t = lebend[0];
      a.kamera.zoom = 2;
      a.blickAuf(t.x + 1, t.y + 1);
      void basis;
      return { i: t.i, x: t.x, y: t.y };
    });
    await anna.waitForTimeout(150);
    const bild = await anna.evaluate((t) => window.ansicht.zuBild(t.x, t.y), schaf);
    // Ein kleiner Rahmen nur um das Schaf.
    await anna.mouse.move(bild.x - 25, bild.y - 30);
    await anna.mouse.down();
    await anna.mouse.move(bild.x + 25, bild.y + 12, { steps: 5 });
    await anna.mouse.up();
    await expect.poll(() => anna.evaluate(() => [...window.ansicht.ausgewaehlt])).toEqual([schaf.i]);
    await expect(anna.locator('#auswahlleiste')).toContainText('Schaf');
    await expect(anna.locator('#schafnahrung')).toContainText('100 Nahrung');

    // Rechtsklick drei Felder weiter: es laeuft hin.
    // Ein freies Grasfeld drei Felder weiter - auf einen Baum laeuft kein Schaf.
    const ziel = await anna.evaluate((t) => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      for (const [dx, dy] of [[3, 1], [1, 3], [3, -1], [-1, 3], [2, 2], [-3, 1], [1, -3]]) {
        const x = Math.round(t.x) + dx;
        const y = Math.round(t.y) + dy;
        if (a.karte.felder[y * g + x] === 0 && ![...a.gebaeude.values()].some((b) => Math.abs(b.x - x) <= 2 && Math.abs(b.y - y) <= 2)) return { x, y };
      }
      return null;
    }, schaf);
    expect(ziel).not.toBeNull();
    const zielBild = await anna.evaluate((z) => window.ansicht.zuBild(z.x, z.y), ziel);
    await anna.mouse.click(zielBild.x, zielBild.y, { button: 'right' });
    await anna.waitForFunction(({ id, x, y }) => {
      const t = window.ansicht.tiere.get(id);
      return t && Math.hypot(t.x - x, t.y - y) > 0.8;
    }, { id: schaf.i, x: schaf.x, y: schaf.y }, { timeout: 10_000 });
    await expect(anna.locator('#auswahlleiste')).toBeInViewport();
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-22',
      titel: 'Ein Schaf mit dem Rahmen gewaehlt - weisse Ellipse, unten Schaf mit 100 Nahrung -, per Rechtsklick losgeschickt',
      test: info,
    });
    await zeitraffer(anna, code, 10);
    await anna.waitForFunction(({ id, x, y }) => {
      const t = window.ansicht.tiere.get(id);
      return t && Math.hypot(t.x - x, t.y - y) < 0.05;
    }, { id: schaf.i, x: ziel.x, y: ziel.y }, { timeout: 20_000 });
    await zeitraffer(anna, code, 1);
    await anna.keyboard.press('Escape');
  });
});
