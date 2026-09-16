// Die Einheiten als Figuren, auf der Schautafel geprueft
// (→ specs/10-strategie/darstellung.md AC-6).
//
// Ob etwas "wie ein Dorfbewohner aussieht", entscheidet das Ansehen des
// Bildes. Pruefbar ist, was dafuer notwendig ist: die drei Gestalten belegen
// deutlich verschiedene Bildpunkte, jede traegt die Spielerfarbe, und eine
// Ladung veraendert die Gestalt sichtbar.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test } from '../helpers/seite.mjs';

const DARSTELLUNG = '10-strategie/darstellung.md';
const BLAU = '#4a90d9';
const ROT = '#d94a4a';

/** Anteil gemeinsamer Bildpunkte an allen belegten: 1 heisst gleiche Gestalt. */
function ueberdeckung(a, b) {
  let beide = 0;
  let eines = 0;
  for (let i = 0; i < a.belegt.length; i++) {
    if (a.belegt[i] && b.belegt[i]) beide += 1;
    if (a.belegt[i] || b.belegt[i]) eines += 1;
  }
  return beide / eines;
}

/** Anteil der Bildpunkte, die sich im Umriss oder deutlich in der Farbe unterscheiden. */
function unterschied(a, b) {
  let anders = 0;
  let eines = 0;
  for (let i = 0; i < a.belegt.length; i++) {
    if (!a.belegt[i] && !b.belegt[i]) continue;
    eines += 1;
    if (a.belegt[i] !== b.belegt[i]) {
      anders += 1;
    } else {
      const [ar, ag, ab] = a.farben[i];
      const [br, bg, bb] = b.farben[i];
      if (Math.abs(ar - br) + Math.abs(ag - bg) + Math.abs(ab - bb) > 90) anders += 1;
    }
  }
  return anders / eines;
}

test('darstellung AC-6: Dorfbewohner, Miliz und Spaeherreiter sind drei Gestalten in Spielerfarbe', async ({ page }, info) => {
  await page.goto('/schautafel.html');
  await page.waitForFunction(() => window.schautafel);
  const masken = await page.evaluate(({ blau, rot }) => {
    const m = window.schautafel.maske;
    return {
      dorfbewohner: m('dorfbewohner', blau),
      miliz: m('miliz', blau),
      spaeherreiter: m('spaeherreiter', blau),
      dorfbewohnerRot: m('dorfbewohner', rot),
      mitHolz: m('dorfbewohner', blau, { ladung: 'h' }),
      mitNahrung: m('dorfbewohner', blau, { ladung: 'n' }),
    };
  }, { blau: BLAU, rot: ROT });

  // Drei Gestalten: keine zwei decken sich auch nur zu drei Vierteln.
  for (const [a, b] of [['dorfbewohner', 'miliz'], ['dorfbewohner', 'spaeherreiter'], ['miliz', 'spaeherreiter']]) {
    expect(ueberdeckung(masken[a], masken[b]), `${a} gegen ${b}`).toBeLessThan(0.75);
  }
  // Spielerfarbe am Koerper: mindestens ein Zehntel der Figur.
  for (const art of ['dorfbewohner', 'miliz', 'spaeherreiter', 'dorfbewohnerRot']) {
    expect(masken[art].farbpixel / masken[art].pixel, art).toBeGreaterThan(0.1);
  }
  // Die Farbe wechselt, die Gestalt nicht.
  expect(ueberdeckung(masken.dorfbewohner, masken.dorfbewohnerRot)).toBeGreaterThan(0.99);
  // Ladung ist zu sehen. Nicht "mehr Bildpunkte" - wer traegt, legt die Axt
  // weg -, sondern ein anderer Umriss: ohne Ladung gegen mit Holz oder Korb.
  expect(ueberdeckung(masken.dorfbewohner, masken.mitHolz), 'ohne gegen Holz').toBeLessThan(0.9);
  expect(ueberdeckung(masken.dorfbewohner, masken.mitNahrung), 'ohne gegen Nahrung').toBeLessThan(0.9);
  // Holz und Beeren sitzen beide auf dem Ruecken; sie unterscheiden sich in
  // der Farbe - braune Scheite, rote Beeren.
  expect(unterschied(masken.mitHolz, masken.mitNahrung), 'Holz gegen Nahrung').toBeGreaterThan(0.08);

  await expect(page.locator('#tafel')).toBeInViewport();
  await nachweis(page, {
    spec: DARSTELLUNG,
    ac: 'AC-6',
    titel: 'Schautafel: Dorfbewohner mit Axt, mit Holz, Beeren und Gold, Miliz mit Schwert und Schild, Spaeherreiter zu Pferd',
    test: info,
  });
});
