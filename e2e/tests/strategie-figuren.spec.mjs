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

  // Drei Gestalten: keine zwei decken sich auch nur zu drei Vierteln. Das
  // Paar Dorfbewohner gegen Miliz steht im naechsten Fall - an den gerenderten
  // Bildern haelt es nicht (0,793).
  for (const [a, b] of [['dorfbewohner', 'spaeherreiter'], ['miliz', 'spaeherreiter']]) {
    expect(ueberdeckung(masken[a], masken[b]), `${a} gegen ${b}`).toBeLessThan(0.75);
  }
  // Spielerfarbe am Koerper: mindestens ein Zehntel der Figur. Gezaehlt wird,
  // was sich mit dem Spieler aendert (`FARBSPRUNG` in schautafel.js) - das
  // gerenderte Tuch hat Falten und Schatten und ist nirgends der reine Ton.
  // Gemessen: Dorfbewohner 0,207 · Miliz 0,183 · Spaeherreiter 0,155.
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

// Bekannt rot seit dem Bildumbau, deshalb steht darstellung AC-6 auf
// `in-qa`: die gerenderten Fusstruppen stehen auf demselben Koerper wie der
// Dorfbewohner, und Schwert und Schild der Miliz liegen vor dem Rumpf statt
// daneben. Gezeichnet deckten sich die zwei zu weniger als drei Vierteln,
// gerendert zu 0,793. Die Grenze bleibt; die Abhilfe ist ein neues Modell
// (Blender), nicht eine andere Zahl. `test.fail` meldet sich, sobald das Bild
// besteht - dann faellt die Zeile weg und das Paar geht zurueck in den Fall
// darueber.
test('darstellung AC-6: Dorfbewohner und Miliz decken sich zu weniger als drei Vierteln', async ({ page }) => {
  test.fail(true, 'gerendert decken sich Dorfbewohner und Miliz zu 0,793 - Abhilfe am Modell, nicht an der Grenze');
  await page.goto('/schautafel.html');
  await page.waitForFunction(() => window.schautafel);
  const [dorfbewohner, miliz] = await page.evaluate((blau) => {
    const m = window.schautafel.maske;
    return [m('dorfbewohner', blau), m('miliz', blau)];
  }, BLAU);
  expect(ueberdeckung(dorfbewohner, miliz), 'dorfbewohner gegen miliz').toBeLessThan(0.75);
});

// Seit dem Bildumbau am Farbton gemessen, nicht am Farbwert: ein gerendertes
// Bild hat Licht und Schatten, und die Schwellen der Zeichnung ("Rot ueber
// 150") trafen davon nur die Sonnenseite. Die Anteile beziehen sich auf die
// Bildpunkte, die einen Farbton haben - der tiefe Schatten unter den Kronen
// hat keinen (`dingBild` in schautafel.js). Gemessen in dieser Runde: Wald
// 86 % gruen · Stein 100 % grau · Beere 74 % gruen und 11,6 % rot · Gold
// 79 % Ocker bis Gelb, davon 5,7 % helles Gold, und 20 % grauer Fels.
test('darstellung AC-3: Baum, Beerenstrauch, Gold und Stein an der Farbe erkennbar, leer werdend kleiner', async ({ page }, info) => {
  await page.setViewportSize({ width: 1400, height: 1000 });
  await page.goto('/schautafel.html');
  await page.waitForFunction(() => window.schautafel);
  const { m, paare } = await page.evaluate(() => {
    const { dingMaske, dingUnterschiede, dinge } = window.schautafel;
    const aus = {};
    for (const [name, art] of Object.entries(dinge)) aus[name] = { voll: dingMaske(art, 1), leer: dingMaske(art, 0.25) };
    return { m: aus, paare: dingUnterschiede() };
  });
  const anteil = (maske, farbe) => maske[farbe] / maske.farbig;
  // Jedes Ding traegt seine Farbe als Hauptfarbe - und nicht die der anderen.
  expect(anteil(m.WALD.voll, 'gruen')).toBeGreaterThan(0.6);
  expect(anteil(m.GOLD.voll, 'gold')).toBeGreaterThan(0.6);
  expect(anteil(m.STEIN.voll, 'grau')).toBeGreaterThan(0.6);
  expect(anteil(m.BEERE.voll, 'gruen')).toBeGreaterThan(0.5);
  // Den Beerenstrauch macht aus, dass rote Beeren zu sehen sind.
  expect(anteil(m.BEERE.voll, 'rot')).toBeGreaterThan(0.08);
  expect(anteil(m.WALD.voll, 'rot') + anteil(m.WALD.voll, 'gold')).toBeLessThan(0.02);
  // Gold gegen Stein. An der Zeichnung hiess das: im Gold kein Grau, im Stein
  // kein Gelb, zusammen unter 2 %. Das gerenderte Gold sitzt im Fels - ein
  // Fuenftel des Haufens ist grau, und das soll so sein (darstellung AC-23:
  // "Gold glaenzt, ohne gelb zu leuchten"). Was bleibt: der Stein traegt
  // keinen Goldton, das helle Gold hat nur das Gold - mehr als die 2 %, unter
  // denen es bei den anderen als nicht vorhanden gilt -, und die zwei
  // unterscheiden sich nach dem Mass aus darstellung AC-14 auf mindestens
  // einem Drittel der Flaeche (gemessen 0,70).
  expect(anteil(m.STEIN.voll, 'gold')).toBeLessThan(0.02);
  expect(anteil(m.GOLD.voll, 'glanz'), 'helles Gold im Gold').toBeGreaterThan(0.02);
  for (const name of ['WALD', 'BEERE', 'STEIN']) expect(anteil(m[name].voll, 'glanz'), `${name} glaenzt nicht`).toBeLessThan(0.02);
  expect(paare.length, 'alle Paare der Vorraete').toBe(6);
  for (const { paar, anteil: verschieden } of paare) expect(verschieden, paar).toBeGreaterThanOrEqual(1 / 3);
  // Ein fast leerer Vorrat ist sichtbar kleiner als ein voller.
  for (const name of ['WALD', 'BEERE', 'GOLD', 'STEIN']) {
    expect(m[name].leer.pixel, name).toBeLessThan(m[name].voll.pixel * 0.7);
  }
  // Das Bild zeigt die Reihe mit Gelaende und Vorraeten, nicht den Kopf der
  // Tafel: seit die Einheiten zwei Reihen haben (Runde 123), lag sie unter
  // dem Ausschnitt, und das Bild zeigte nur Figuren (Rueckschau nach Runde
  // 130). Wie hoch die Reihe ist, sagt die Tafel.
  const band = await page.evaluate(() => {
    const oben = () => document.querySelector('#tafel').getBoundingClientRect().top + window.schautafel.gelaendeOben;
    window.scrollBy(0, oben() - 60);
    return { oben: oben(), hoehe: window.innerHeight, reihe: window.schautafel.gelaendeHoehe };
  });
  expect(band.reihe, 'die Hoehe der Reihe').toBeGreaterThan(200);
  expect(band.oben - 30, 'die Ueberschrift der Reihe im Bild').toBeGreaterThanOrEqual(0);
  expect(band.oben + band.reihe, 'die ganze Reihe im Bild').toBeLessThanOrEqual(band.hoehe);
  await expect(page.locator('#tafel')).toBeInViewport();
  await nachweis(page, {
    spec: DARSTELLUNG,
    ac: 'AC-3',
    titel: 'Schautafel, die Reihe Gelaende: Wald aus Baeumen, Beerenstrauch mit roten Beeren, Gold im Fels, Steinbrocken, Wasser am Ufer - voll, fast leer, in Spielgroesse',
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
  // Das Ufer: zwischen Wasser und Gras ein Streifen, der keines von beiden
  // ist. An der Zeichnung waren es mehr als 20 Bildpunkte Sand um ein Feld
  // Wasser, fuenf je Kante. Gemessen wird jetzt an einem See aus neun Feldern
  // mit zwoelf Kanten - von einem einzelnen Feld laesst das weiche Ufer eine
  // Pfuetze -, also mehr als 60; gemessen 2865.
  expect(probe.ufer).toBeGreaterThan(60);
  // Und das Wasser ist Wasser: mehr als die Haelfte der Seeflaeche ist blau
  // (gemessen 3185 von 4356 Bildpunkten).
  expect(probe.wasser).toBeGreaterThan(probe.seeflaeche / 2);
});

test('darstellung AC-13: Gebaeude und Figuren ohne schwarze Umrisse - am Rand der Gestalt hoechstens ein Viertel fast schwarz', async ({ page }) => {
  await page.goto('/schautafel.html');
  await page.waitForFunction(() => window.schautafel?.anmutung);
  const werte = await page.evaluate(() => {
    const t = window.schautafel;
    return Object.fromEntries([
      ...t.gebaeudeArten.map((art) => [art, t.anmutung('gebaeude', art)]),
      ...t.arten.map((art) => [art, t.anmutung('figur', art)]),
    ]);
  });
  // Ein Umriss ist schwarz, wo die Gestalt endet. Gemessen wird deshalb der
  // Rand: die deckenden Bildpunkte mit einem nicht deckenden Nachbarn. Ein
  // gezeichneter Umriss schwaerzt ihn ganz, ein unterbrochener zur Haelfte; an
  // den gerenderten Bildern sind es 0 bis 9 % (Belagerungswerkstatt 9,0 ·
  // Ramme 7,3 · Spaeherreiter 4,7 - dort endet die Gestalt an einem dunklen
  // Innenraum, einem Rad, einem dunklen Pferd). Ein Viertel liegt von beidem
  // weit weg.
  //
  // Bis zum Bildumbau stand hier "hoechstens 3 % aller Bildpunkte fast
  // schwarz": ein Umriss machte 7 bis 16 % aus, Fenster und Tueren blieben
  // darunter. Fuer eine Zeichnung traf das den Umriss; ein gerendertes Bild
  // hat keinen und trotzdem tiefe Schatten - die offene Werkstatt 12,7 %, das
  // Holzfaellerlager 9,0 %, das dunkle Pferd des Spaehers 7,6 %. Die Messung
  // haette Schatten verboten, nicht Umrisse (darstellung.md, "Was der
  // Bildumbau abloest").
  for (const [art, w] of Object.entries(werte)) {
    expect(w.pixel, `${art} ist gezeichnet`).toBeGreaterThan(250);
    expect(w.rand, `${art}: ${(w.rand * 100).toFixed(1)} % des Randes fast schwarz`).toBeLessThanOrEqual(0.25);
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
  // (5) Schatten in eine Richtung: Licht von links oben, also rechts. Gezaehlt
  // neben der Grundflaeche - seit dem Bildumbau ausserhalb der Raute statt
  // jenseits ihrer rechten Ecke (`schlagschatten` in schautafel.js).
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
  // Der Kopf ist hier das Gesicht vom Hut- oder Helmrand bis zum Kinn: die
  // Zeilen im oberen Drittel, in denen Haut zu sehen ist. Eine Zeichnung liess
  // sich dafuer mit einem Hautton malen, den sonst nichts traegt; am
  // gerenderten Bild wird Haut an ihrer Farbe erkannt (`istHaut`). Ein
  // Sechstel der Figur ist die Grenze aus dem Kriterium; vor A6c war der Kopf
  // gut ein Viertel. Gemessen: Dorfbewohner 20 von 166 Zeilen · Miliz 21 von
  // 164 · Spaeherreiter 14 von 222.
  for (const [art, p] of Object.entries(figuren)) {
    expect(p.kopf, `${art}: Gesicht zu sehen`).toBeGreaterThan(4);
    expect(p.kopf / p.figur, `${art}: Kopf ${p.kopf} von ${p.figur} Zeilen`).toBeLessThanOrEqual(1 / 6);
  }
  // Bei Zoom 1, so gross wie im Spielbild: ein Mensch reicht nicht bis unter das Dach.
  expect(groessen.dorfbewohner, 'Dorfbewohner gezeichnet').toBeGreaterThan(15);
  expect(groessen.dorfbewohner / groessen.haus, `Dorfbewohner ${groessen.dorfbewohner}, Haus ${groessen.haus}`).toBeLessThanOrEqual(0.5);
});
