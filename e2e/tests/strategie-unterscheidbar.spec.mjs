// Alles auf einen Blick unterscheidbar (→ specs/10-strategie/darstellung.md AC-14).
//
// Auf der Schautafel: je zwei Einheiten und je zwei Gebaeude unterscheiden sich
// auf mindestens einem Drittel ihrer Flaeche. Im Spielbild: alle Gebaeude der
// Dunklen Zeit bei Zoom 1 nebeneinander, fuer das Ansehen.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, gebaeudeAufstellen, test } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const DARSTELLUNG = '10-strategie/darstellung.md';

test('darstellung AC-14: je zwei Einheiten und je zwei Gebaeude unterscheiden sich auf einem Drittel der Flaeche', async ({ page }) => {
  await page.goto('/schautafel.html');
  await page.waitForFunction(() => window.schautafel?.unterschiede);
  const { figuren, gebaeude } = await page.evaluate(() => ({
    figuren: window.schautafel.unterschiede('figur'),
    gebaeude: window.schautafel.unterschiede('gebaeude'),
  }));
  // Gezeichnet in Spielgroesse (Gebaeude 2 x 2 bei Zoom 1), in derselben
  // Spielerfarbe - was bleibt, ist Umriss und Farbe der Gestalt. Ein Drittel
  // aus dem Kriterium; vor Runde 41 lagen Holzfaeller- und Bergbaulager mit
  // demselben Pultdach bei 0,29.
  expect(figuren.length, 'alle Paare der Einheiten').toBeGreaterThanOrEqual(6);
  expect(gebaeude.length, 'alle Paare der Gebaeude').toBeGreaterThanOrEqual(21);
  for (const { paar, anteil } of [...figuren, ...gebaeude]) expect(anteil, paar).toBeGreaterThanOrEqual(1 / 3);
});

test.describe('Alle Gebaeude im Spielbild', () => {
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('darstellung AC-14: bei Zoom 1 hat jedes Gebaeude ein eigenes Merkmal', async ({}, info) => {
    const { anna, code } = partie;
    const arten = ['haus', 'muehle', 'holzfaellerlager', 'bergbaulager', 'kaserne', 'farm'];
    await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 1;
      a.blickAuf(b.x + 4, b.y + 4);
    });
    // Alle in einer Reihe gleicher Tiefe vor dem Dorfzentrum, nebeneinander im
    // Bild, die flache Farm davor - so verdeckt keines ein anderes (beim
    // ersten Versuch stand das Bergbaulager halb hinter der Kaserne).
    for (const art of arten) {
      const platz = await anna.evaluate((art) => {
        const a = window.ansicht;
        const b = a.spieler.get(a.ich).basis;
        const reihe = art === 'farm' ? 12 : 7;
        const kandidaten = [];
        for (let dy = -8; dy <= 16; dy++) {
          for (let dx = -8; dx <= 16; dx++) {
            if (Math.abs(dx + dy - reihe) > 1) continue;
            const x = b.x + dx;
            const y = b.y + dy;
            if (!a.platzTaugt(art, x, y, 1)) continue;
            const p = a.zuBild(x, y);
            if (p.x < 120 || p.x > a.leinwand.clientWidth - 120 || p.y < 200 || p.y > a.leinwand.clientHeight - 120) continue;
            kandidaten.push({ x, y, seite: Math.abs(dx - dy) });
          }
        }
        kandidaten.sort((p, q) => p.seite - q.seite);
        return kandidaten[0] || null;
      }, art);
      expect(platz, `Platz fuer ${art}`).not.toBeNull();
      const id = await gebaeudeAufstellen(anna, code, 'Anna', art, platz.x, platz.y);
      await anna.waitForFunction((id) => window.ansicht.gebaeude.has(id), id);
    }
    // Alle sieben fertig und im Bild.
    const imBild = await anna.evaluate(() => {
      const a = window.ansicht;
      return [...a.gebaeude.values()]
        .filter((g) => g.b === a.ich && !(g.u < 1))
        .filter((g) => {
          const p = a.zuBild(g.x, g.y);
          return p.x > 0 && p.y > 60 && p.x < a.leinwand.clientWidth && p.y < a.leinwand.clientHeight;
        })
        .map((g) => g.art);
    });
    expect(new Set(imBild).size, imBild.join(', ')).toBe(7);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: DARSTELLUNG,
      ac: 'AC-14',
      titel: 'Zoom 1: Dorfzentrum mit Fahne, Haus mit Strohdach, Muehle mit Fluegeln, Holzfaellerlager mit Staemmen, Bergbaulager mit Schieferfirst und Karre, Kaserne mit Zinnen, Farm als Acker',
      test: info,
    });
  });
});
