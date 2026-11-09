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

test('darstellung AC-3: Baum, Beerenstrauch, Gold und Stein an der Farbe erkennbar, leer werdend kleiner', async ({ page }, info) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.goto('/schautafel.html');
  await page.waitForFunction(() => window.schautafel);
  const m = await page.evaluate(() => {
    const { dingMaske, dinge } = window.schautafel;
    const aus = {};
    for (const [name, art] of Object.entries(dinge)) aus[name] = { voll: dingMaske(art, 1), leer: dingMaske(art, 0.25) };
    return aus;
  });
  const anteil = (maske, farbe) => maske[farbe] / maske.pixel;
  // Jedes Ding traegt seine Farbe als Hauptfarbe - und nicht die der anderen.
  expect(anteil(m.WALD.voll, 'gruen')).toBeGreaterThan(0.6);
  expect(anteil(m.GOLD.voll, 'gelb')).toBeGreaterThan(0.6);
  expect(anteil(m.STEIN.voll, 'grau')).toBeGreaterThan(0.6);
  expect(anteil(m.BEERE.voll, 'gruen')).toBeGreaterThan(0.5);
  // Den Beerenstrauch macht aus, dass rote Beeren zu sehen sind.
  expect(anteil(m.BEERE.voll, 'rot')).toBeGreaterThan(0.08);
  expect(anteil(m.WALD.voll, 'rot') + anteil(m.WALD.voll, 'gelb')).toBeLessThan(0.02);
  expect(anteil(m.GOLD.voll, 'grau') + anteil(m.STEIN.voll, 'gelb')).toBeLessThan(0.02);
  // Ein fast leerer Vorrat ist sichtbar kleiner als ein voller.
  for (const name of ['WALD', 'BEERE', 'GOLD', 'STEIN']) {
    expect(m[name].leer.pixel, name).toBeLessThan(m[name].voll.pixel * 0.7);
  }
  // Das Bild zeigt die Reihe mit Gelaende und Vorraeten, nicht den Kopf der
  // Tafel: seit die Einheiten zwei Reihen haben (Runde 123), lag sie unter
  // dem Ausschnitt, und das Bild zeigte nur Figuren (Rueckschau nach Runde
  // 130). Die Reihe ist 240 hoch, dazu ihre Ueberschrift.
  const band = await page.evaluate(() => {
    const oben = () => document.querySelector('#tafel').getBoundingClientRect().top + window.schautafel.gelaendeOben;
    window.scrollBy(0, oben() - 60);
    return { oben: oben(), hoehe: window.innerHeight };
  });
  expect(band.oben - 30, 'die Ueberschrift der Reihe im Bild').toBeGreaterThanOrEqual(0);
  expect(band.oben + 240, 'die ganze Reihe im Bild').toBeLessThanOrEqual(band.hoehe);
  await expect(page.locator('#tafel')).toBeInViewport();
  await nachweis(page, {
    spec: DARSTELLUNG,
    ac: 'AC-3',
    titel: 'Schautafel unten: Wald aus Baeumen, Beerenstrauch mit roten Beeren, Goldhaufen, Steinbrocken - voll, fast leer, in Spielgroesse',
    test: info,
  });
});

test('darstellung AC-2: Gras in Toenungen je Startwert, am Wasser ein Ufer aus Sand', async ({ page }) => {
  await page.goto('/schautafel.html');
  await page.waitForFunction(() => window.schautafel);
  const probe = await page.evaluate(() => window.schautafel.bodenProbe());
  // Nicht einfarbig: mehrere Toenungen.
  expect(probe.toene).toBeGreaterThanOrEqual(3);
  // Aus dem Startwert: zwei Karten sind auf gut der Haelfte der Felder anders getoent
  // (bei vier Toenungen waeren es im Zufall drei Viertel).
  expect(probe.verschieden).toBeGreaterThan(0.5);
  // Das Ufer: Sand an den Kanten zum Land.
  expect(probe.sand).toBeGreaterThan(20);
});

test('darstellung AC-13: Gebaeude und Figuren ohne schwarze Umrisse - hoechstens 3 % fast schwarze Bildpunkte', async ({ page }) => {
  await page.goto('/schautafel.html');
  await page.waitForFunction(() => window.schautafel?.anmutung);
  const werte = await page.evaluate(() => {
    const t = window.schautafel;
    return Object.fromEntries([
      ...t.gebaeudeArten.map((art) => [art, t.anmutung('gebaeude', art)]),
      ...t.arten.map((art) => [art, t.anmutung('figur', art)]),
    ]);
  });
  // Die 3 % kommen aus dem Kriterium: ein schwarzer Umriss von 1 px um ein
  // Gebaeude in Spielgroesse machte 7 bis 12 % aus (gemessen Runde 37 vor dem
  // Umbau), dunkle Fenster und Tueren allein bleiben darunter. Bei den Figuren
  // waren es 7,7 bis 16 % (Runde 38 vor dem Umbau; Stiefel, Hufe, Schafskopf).
  for (const [art, w] of Object.entries(werte)) {
    expect(w.pixel, `${art} ist gezeichnet`).toBeGreaterThan(250);
    expect(w.schwarz, `${art}: ${(w.schwarz * 100).toFixed(1)} % fast schwarz`).toBeLessThanOrEqual(0.03);
  }
});

test('darstellung AC-13: gedaempfte erdige Farben, Boden ohne Raster, Schlagschatten nach rechts', async ({ page }) => {
  await page.goto('/schautafel.html');
  await page.waitForFunction(() => window.schautafel?.bodenRaster);
  const m = await page.evaluate(() => {
    const t = window.schautafel;
    const mittel = (liste) => liste.reduce((a, w) => a + w.saettigung, 0) / liste.length;
    return {
      gebaeude: mittel(t.gebaeudeArten.map((art) => t.anmutung('gebaeude', art))),
      vorraete: mittel(Object.values(t.dinge).map((art) => t.anmutung('ding', art))),
      boden: t.bodenProbe().farbtoene,
      raster: t.bodenRaster(),
      schatten: Object.fromEntries([
        ...t.gebaeudeArten.filter((art) => art !== 'farm').map((art) => [art, t.schlagschatten('gebaeude', art)]),
        ['baum', t.schlagschatten('ding', t.dinge.WALD)],
      ]),
    };
  });
  // (2) Gemessen vor A6c (Runden 37 bis 39, gleiche Zeichengroesse): Gebaeude im
  // Mittel 0,283, Vorraete 0,371. Weniger heisst gedaempft.
  expect(m.gebaeude, 'Gebaeude gedaempft').toBeLessThan(0.283);
  expect(m.vorraete, 'Vorraete gedaempft').toBeLessThan(0.371);
  // Erdig: der Farbton des Grases zwischen Braun und Oliv - vorher 112 Grad, gruen.
  for (const ton of m.boden) {
    expect(ton, `Farbton des Bodens ${ton} Grad`).toBeGreaterThanOrEqual(25);
    expect(ton).toBeLessThanOrEqual(100);
  }
  // (4) Kein Raster: an Feldgrenzen springt die Farbe hoechstens ein Viertel
  // staerker als innerhalb eines Feldes. Rautenweise gefuellt waere der Sprung
  // an der Grenze ein Vielfaches, innen null.
  expect(m.raster.paareGrenze).toBeGreaterThan(1000);
  expect(m.raster.grenze / m.raster.innen, JSON.stringify(m.raster)).toBeLessThan(1.25);
  // (5) Schatten in eine Richtung: Licht von links oben, also rechts.
  for (const [art, s] of Object.entries(m.schatten)) {
    expect(s.rechts, `${art}: Schatten rechts ${s.rechts}, links ${s.links}`).toBeGreaterThan(100);
    expect(s.rechts, `${art}: rechts viel mehr als links`).toBeGreaterThan(s.links * 5);
  }
});

test('darstellung AC-13: Proportionen statt Kindchenschema - kleiner Kopf, Dorfbewohner halb so hoch wie ein Haus', async ({ page }) => {
  await page.goto('/schautafel.html');
  await page.waitForFunction(() => window.schautafel?.proportionen);
  const { figuren, groessen } = await page.evaluate(() => {
    const t = window.schautafel;
    return {
      figuren: Object.fromEntries(['dorfbewohner', 'miliz', 'spaeherreiter'].map((art) => [art, t.proportionen(art)])),
      groessen: t.groessen(),
    };
  });
  // Der Kopf ist hier das Gesicht vom Hut- oder Helmrand bis zum Kinn, gezaehlt
  // an einem Hautton, den sonst nichts traegt. Ein Sechstel der Figur ist die
  // Grenze aus dem Kriterium; vor dem Umbau war der Kopf gut ein Viertel.
  for (const [art, p] of Object.entries(figuren)) {
    expect(p.kopf, `${art}: Gesicht zu sehen`).toBeGreaterThan(4);
    expect(p.kopf / p.figur, `${art}: Kopf ${p.kopf} von ${p.figur} Zeilen`).toBeLessThanOrEqual(1 / 6);
  }
  // Bei Zoom 1, so gross wie im Spielbild: ein Mensch reicht nicht bis unter das Dach.
  expect(groessen.dorfbewohner, 'Dorfbewohner gezeichnet').toBeGreaterThan(15);
  expect(groessen.dorfbewohner / groessen.haus, `Dorfbewohner ${groessen.dorfbewohner}, Haus ${groessen.haus}`).toBeLessThanOrEqual(0.5);
});
