// Alles auf einen Blick unterscheidbar (→ specs/10-strategie/darstellung.md AC-14).
//
// Auf der Schautafel: je zwei Einheiten und je zwei Gebaeude unterscheiden sich
// auf mindestens einem Drittel ihrer Flaeche. Im Spielbild: alle Gebaeude bei
// Zoom 1 nebeneinander, fuer das Ansehen - seit Schritt B3 auch die drei der
// Feudalzeit (Schiessanlage, Stall, Schmiede).
import { createRequire } from 'node:module';
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, gebaeudeAufstellen, test } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const DARSTELLUNG = '10-strategie/darstellung.md';
const FAHRPLAN = '10-strategie/fahrplan.md';
const { EINHEITEN, GEBAEUDE } = createRequire(import.meta.url)('../../server/spiele/strategie/daten.js');

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
  expect(gebaeude.length, 'alle Paare der Gebaeude').toBeGreaterThanOrEqual(45);
  for (const { paar, anteil } of [...figuren, ...gebaeude]) expect(anteil, paar).toBeGreaterThanOrEqual(1 / 3);
});

test('darstellung AC-9 / fahrplan AC-7: die Schautafel zeigt jede Einheit und jedes Gebaeude der Stufe in zwei Farben mit Namen', async ({ page }, info) => {
  // Hoch genug fuer die Namen unter der zweiten Gebaeudereihe.
  await page.setViewportSize({ width: 1300, height: 1400 });
  await page.goto('/schautafel.html');
  await page.waitForFunction(() => window.schautafel?.unterschiede);
  const tafel = await page.evaluate(() => {
    const t = window.schautafel;
    return {
      figuren: t.zellen.map((z) => ({ art: z.art, farbe: z.farbe, titel: z.titel })),
      gebaeude: t.gebaeudeZellen.map((z) => ({ art: z.art, farbe: z.farbe, titel: z.titel, bau: z.bau })),
      paare: [...t.unterschiede('figur'), ...t.unterschiede('gebaeude')],
    };
  });
  // Vollstaendig gegen die Werte des Servers: was es in der Stufe gibt, steht da -
  // eine neue Einheit ohne Eintrag auf der Tafel faellt hier auf.
  const farben = (liste, art) => new Set(liste.filter((z) => z.art === art).map((z) => z.farbe));
  for (const art of Object.keys(EINHEITEN)) {
    expect(farben(tafel.figuren, art).size, `${art} in zwei Farben`).toBe(2);
    expect(tafel.figuren.find((z) => z.art === art).titel, `${art} mit Namen`).toBeTruthy();
  }
  for (const art of Object.keys(GEBAEUDE)) {
    const fertige = tafel.gebaeude.filter((z) => z.bau === 1);
    expect(farben(fertige, art).size, `${art} in zwei Farben`).toBe(2);
    expect(fertige.find((z) => z.art === art).titel, `${art} mit Namen`).toBeTruthy();
  }
  // Ohne Beschriftung unterscheidbar (fahrplan AC-7): dieselbe Messung wie darstellung AC-14.
  for (const { paar, anteil } of tafel.paare) expect(anteil, paar).toBeGreaterThanOrEqual(1 / 3);
  await expect(page.locator('#tafel')).toBeInViewport();
  for (const [spec, ac] of [[DARSTELLUNG, 'AC-9'], [FAHRPLAN, 'AC-7']]) {
    await nachweis(page, {
      spec,
      ac,
      titel: 'Die Schautafel: Dorfbewohner, Miliz, Spaeherreiter, Schaf, Gelaende und alle zehn Gebaeude in Blau und Rot, mit Namen',
      test: info,
    });
  }
});

test.describe('Alle Gebaeude im Spielbild', () => {
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('darstellung AC-14: bei Zoom 1 hat jedes Gebaeude ein eigenes Merkmal', async ({}, info) => {
    const { anna, code } = partie;
    // Zwei Reihen: die hohen Bauten hinten, die flache Farm und die drei der
    // Feudalzeit vorn - zehn in einer Reihe passten nicht ins Fenster.
    const reihen = {
      haus: 7, muehle: 7, holzfaellerlager: 7, bergbaulager: 7, kaserne: 7,
      farm: 13, schiessanlage: 13, stall: 13, schmiede: 13,
    };
    const arten = Object.keys(reihen);
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
      const platz = await anna.evaluate(([art, reihe]) => {
        const a = window.ansicht;
        const b = a.spieler.get(a.ich).basis;
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
      }, [art, reihen[art]]);
      expect(platz, `Platz fuer ${art}`).not.toBeNull();
      const id = await gebaeudeAufstellen(anna, code, 'Anna', art, platz.x, platz.y);
      await anna.waitForFunction((id) => window.ansicht.gebaeude.has(id), id);
    }
    // Alle zehn fertig und im Bild.
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
    expect(new Set(imBild).size, imBild.join(', ')).toBe(10);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: DARSTELLUNG,
      ac: 'AC-14',
      titel: 'Zoom 1: Dorfzentrum mit Fahne, Haus mit Strohdach, Mühle mit Flügeln, Holzfällerlager mit Stämmen, Bergbaulager mit Schieferfirst und Karre, Kaserne mit Zinnen, Farm als Acker, Schießanlage mit Zielscheibe, Stall mit Koppel, Schmiede mit Schornstein',
      test: info,
    });
  });
});
