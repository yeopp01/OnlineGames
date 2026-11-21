// Figuren der Krone (→ specs/10-strategie/darstellung.md AC-32).
//
// Jede Stufe der Krone hat ihre eigene gerenderte Figur mit allen vier
// Ablaeufen und unterscheidet sich auf der Schautafel von ihrer Vorstufe nach
// dem Mass aus AC-14 (ein Drittel der Flaeche). Bergfried, Wunder, Drache und
// Ei haben eigene Bilder. Die fuenf Elitestufen behalten die Figur ihrer
// Einheit - sie sind Verbesserungen, keine neuen Arten.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test } from '../helpers/seite.mjs';

const DARSTELLUNG = '10-strategie/darstellung.md';

// Stufe gegen Vorstufe, wie in einheiten AC-66 bis AC-68.
const STUFEN = [
  ['zweihandkaempfer', 'langschwertkaempfer'],
  ['hellebardier', 'pikenier'],
  ['husar', 'leichtekavallerie'],
  ['kavalier', 'ritter'],
  ['paladin', 'kavalier'],
  ['langbogenschuetze', 'bogenschuetze2'],
  ['schwerearmbrust', 'armbrustschuetze'],
  ['belagerungsramme', 'ramme'],
  ['onager', 'mangonel'],
];

test('darstellung AC-32: jede Stufe der Krone hat eine eigene gerenderte Figur, die sich von ihrer Vorstufe unterscheidet; Bergfried, Wunder, Drache und Ei eigene Bilder', async ({ page }, info) => {
  await page.goto('/schautafel.html');
  await page.waitForFunction(() => window.schautafel?.unterschiede);
  const lage = await page.evaluate(async (stufen) => {
    const { gerendert } = await import('./bilder.js');
    const paare = window.schautafel.unterschiede('figur');
    const anteil = (a, b) => paare.find((p) => p.paar === `${a} gegen ${b}` || p.paar === `${b} gegen ${a}`)?.anteil ?? null;
    const ablaeufe = (art) => Object.keys(gerendert(art)?.ablaeufe || {}).sort();
    return {
      stufen: stufen.map(([stufe, vor]) => ({ stufe, vor, anteil: anteil(stufe, vor), ablaeufe: ablaeufe(stufe) })),
      bilder: Object.fromEntries(['bergfried', 'wunder', 'drachenei'].map((art) => [art, Boolean(gerendert(art))])),
      drache: ablaeufe('drache'),
    };
  }, STUFEN);
  for (const { stufe, vor, anteil, ablaeufe } of lage.stufen) {
    expect(ablaeufe, `${stufe}: alle Ablaeufe`).toEqual(['angreifen', 'gehen', 'stehen', 'sterben']);
    expect(anteil, `${stufe} gegen ${vor}`).not.toBeNull();
    expect(anteil, `${stufe} gegen ${vor}`).toBeGreaterThanOrEqual(1 / 3);
  }
  expect(lage.bilder).toEqual({ bergfried: true, wunder: true, drachenei: true });
  expect(lage.drache).toEqual(['angreifen', 'gehen', 'stehen', 'sterben']);

  // Das Bild: die Reihen der Figuren ab dem Lehen - die Stufen des
  // Fuerstentums ueber denen der Krone. Zwei Reihen der Tafel sind 484
  // Bildpunkte hoch.
  await page.evaluate(() => window.scrollTo(0, document.querySelector('#tafel').getBoundingClientRect().top + window.scrollY + 474));
  await expect(page.locator('#tafel')).toBeInViewport();
  await nachweis(page, {
    spec: DARSTELLUNG,
    ac: 'AC-32',
    titel: 'Schautafel: die Stufen der Krone neben ihren Vorstufen - jede mit eigener gerenderter Figur, dazu der Drache',
    test: info,
  });
});
