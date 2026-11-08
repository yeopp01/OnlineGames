// Alles auf einen Blick unterscheidbar (→ specs/10-strategie/darstellung.md AC-14).
//
// Auf der Schautafel: je zwei Einheiten und je zwei Gebaeude unterscheiden sich
// auf mindestens einem Drittel ihrer Flaeche. Im Spielbild: alle Gebaeude bei
// Zoom 1 nebeneinander, fuer das Ansehen - seit Schritt B3 auch die drei der
// Feudalzeit (Schiessanlage, Stall, Schmiede).
//
// Dazu seit Runde 76 die schaerfere Messung fuer Kampfeinheiten
// (→ bedienung.md AC-36): nur der **Umriss**, und nur in der Hoehe, die Zoom 1
// einer Figur gibt.
import { createRequire } from 'node:module';
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, gebaeudeAufstellen, test } from '../helpers/seite.mjs';
import { figurenFrei, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';
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
  expect(figuren.length, 'alle Paare der Einheiten').toBeGreaterThanOrEqual(28);
  expect(gebaeude.length, 'alle Paare der Gebaeude').toBeGreaterThanOrEqual(45);
  for (const { paar, anteil } of [...figuren, ...gebaeude]) expect(anteil, paar).toBeGreaterThanOrEqual(1 / 3);
});

test('bedienung AC-36: jede Kampfeinheit unterscheidet sich bei Spielgroesse im Umriss vom Dorfbewohner', async ({ page }) => {
  await page.goto('/schautafel.html');
  await page.waitForFunction(() => window.schautafel?.umrissUnterschied);
  // Was eine Kampfeinheit ist, sagen die Daten des Servers, keine Liste im
  // Test: alles, was nicht zur Klasse "dorf" gehoert. Eine neue Einheit faellt
  // damit von selbst unter das Kriterium.
  const kaempfer = Object.entries(EINHEITEN)
    .filter(([, werte]) => !(werte.klassen || []).includes('dorf'))
    .map(([art]) => art);
  expect(kaempfer.length, kaempfer.join(', ')).toBeGreaterThanOrEqual(6);
  // Gemessen wird in der Hoehe, die Zoom 1 einer Figur gibt - nicht
  // herangezoomt. Darum geht es: bei knapp 29 Bildpunkten traegt Ausruestung
  // innerhalb des Koerpers nichts mehr zur Gestalt bei.
  const hoehe = await page.evaluate(() => window.schautafel.spielhoehe);
  expect(hoehe, 'Figurenhoehe bei Zoom 1').toBeLessThan(32);
  const gemessen = {};
  for (const art of kaempfer) {
    gemessen[art] = await page.evaluate((art) => window.schautafel.umrissUnterschied('dorfbewohner', art), art);
  }
  // Vor der Arbeit in Runde 76 lagen fuenf von sechs darunter: Miliz 0,295,
  // Soldat 0,321, Speerkaempfer 0,310, Bogenschuetze 0,318, Plaenkler 0,304 -
  // nur der Spaeherreiter kam mit 0,705 ueber die Schwelle. Danach gemessen:
  // 0,401 · 0,352 · 0,371 · 0,356 · 0,348 · 0,705. Das Drittel ist dieselbe
  // Schwelle wie in darstellung AC-14, nur haerter gemessen.
  for (const [art, anteil] of Object.entries(gemessen)) {
    expect(anteil, `${art} gegen Dorfbewohner: ${JSON.stringify(gemessen)}`).toBeGreaterThanOrEqual(1 / 3);
  }
});

test('darstellung AC-9 / fahrplan AC-7: die Schautafel zeigt jede Einheit und jedes Gebaeude der Stufe in zwei Farben mit Namen', async ({ page }, info) => {
  // Hoch genug fuer die Namen unter der zweiten Gebaeudereihe.
  await page.setViewportSize({ width: 1300, height: 1400 });
  await page.goto('/schautafel.html');
  await page.waitForFunction(() => window.schautafel?.unterschiede);
  const tafel = await page.evaluate((arten) => {
    const t = window.schautafel;
    // Nicht nur, welche Farbe die Zelle **angibt**, sondern wieviel davon die
    // Figur **traegt**. Rueckschau nach Runde 83: der Plaenkler stand ein
    // Zeitalter lang in beiden Reihen gleich braun da - die Fellweste lag
    // ueber dem ganzen Wams. Die Zusicherung "in zwei Farben" war trotzdem
    // gruen, weil sie die Angabe las und nicht das Bild.
    const anteil = (art, farbe) => {
      const m = t.maske(art, farbe);
      return Math.round((m.farbpixel / m.pixel) * 1000) / 1000;
    };
    return {
      figuren: t.zellen.map((z) => ({ art: z.art, farbe: z.farbe, titel: z.titel })),
      gebaeude: t.gebaeudeZellen.map((z) => ({ art: z.art, farbe: z.farbe, titel: z.titel, bau: z.bau })),
      paare: [...t.unterschiede('figur'), ...t.unterschiede('gebaeude')],
      getragen: Object.fromEntries(arten.map((art) => [art, [anteil(art, '#4a90d9'), anteil(art, '#d94a4a')]])),
    };
  }, Object.keys(EINHEITEN));
  // Vollstaendig gegen die Werte des Servers: was es in der Stufe gibt, steht da -
  // eine neue Einheit ohne Eintrag auf der Tafel faellt hier auf.
  const farben = (liste, art) => new Set(liste.filter((z) => z.art === art).map((z) => z.farbe));
  for (const art of Object.keys(EINHEITEN)) {
    expect(farben(tafel.figuren, art).size, `${art} in zwei Farben`).toBe(2);
    expect(tafel.figuren.find((z) => z.art === art).titel, `${art} mit Namen`).toBeTruthy();
    // Und die Farbe ist auch zu sehen: ein Zehntel der Figur, in beiden
    // Reihen. Dieselbe Schwelle wie darstellung AC-6, aber ueber **alle**
    // Einheiten aus den Daten - die Liste dort nennt drei und waechst nicht
    // mit. Gemessen in Runde 83: Soldat 0,105 · Speerkaempfer 0,108 ·
    // Plaenkler 0,119 · Bogenschuetze 0,144 · Spaeherreiter 0,171 ·
    // Dorfbewohner 0,270 · Miliz 0,308.
    for (const anteil of tafel.getragen[art]) {
      expect(anteil, `${art} traegt Spielerfarbe: ${JSON.stringify(tafel.getragen)}`).toBeGreaterThan(0.1);
    }
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
      titel: 'Die Schautafel: Dorfbewohner, Miliz, Soldat, Späherreiter, Speerkämpfer, Bogenschütze, Plänkler, Schaf, Gelände und alle Gebäude in Blau und Rot, mit Namen',
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

test.describe('Militaer bei Spielgroesse', () => {
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-36: bei Zoom 1 steht jede Kampfeinheit neben dem Dorfbewohner im Bild', async ({}, info) => {
    const { anna, code } = partie;
    const reihe = ['dorfbewohner', 'miliz', 'soldat', 'speerkaempfer', 'bogenschuetze', 'plaenkler'];
    // Ein kleineres Fenster: bei Zoom 1 ist eine Figur 29 Bildpunkte hoch,
    // und in 1400 x 950 waere das Bild zu neun Zehnteln Wiese. Der Zoom
    // bleibt 1 - genau darum geht es.
    await anna.setViewportSize({ width: 1000, height: 480 });
    // Die Wiese liegt mitten auf der Karte, nicht an ihrem Rand: dort steht
    // die Reihe sonst vor dem Schwarz ausserhalb der Karte, und das liest
    // sich auf dem Bild wie Nebel, den es noch gar nicht gibt.
    const wiese = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const b = a.spieler.get(a.ich).basis;
      const grasUm = (x, y, r) => {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) if (a.karte.felder[(y + dy) * g + (x + dx)] !== 0) return false;
        }
        return true;
      };
      let bester = null;
      for (let y = 14; y < g - 14; y++) {
        for (let x = 14; x < g - 14; x++) {
          if (!grasUm(x, y, 7)) continue;
          const weg = Math.hypot(x - b.x, y - b.y);
          // Nahe genug, dass das Dorfzentrum noch als Massstab im Bild steht,
          // weit genug, dass die eigenen Dorfbewohner nicht dazwischenstehen.
          if (weg < 10 || weg > 22) continue;
          const rand = Math.min(x, y, g - 1 - x, g - 1 - y);
          if (!bester || rand > bester.rand) bester = { x, y, rand };
        }
      }
      if (!bester) throw new Error('keine Wiese mitten auf der Karte gefunden');
      return bester;
    });
    // Zwei Felder Abstand in Richtung (+1, -1): auf der isometrischen Karte
    // ist das eine **waagerechte** Reihe im Bild, keine Diagonale.
    const angelegt = [];
    for (let i = 0; i < reihe.length; i++) {
      const versatz = 2 * i - 5;
      const x = wiese.x + versatz;
      const y = wiese.y - versatz;
      expect(await einheitenAufstellen(anna, code, 'Anna', 1, { art: reihe[i], x, y }), reihe[i]).toBe(1);
      angelegt.push({ art: reihe[i], x, y });
    }
    await anna.evaluate(() => {
      const a = window.ansicht;
      a.kamera.zoom = 1;
      a.ausgewaehlt.clear();
      a.gewaehltesGebaeude = null;
      a.beiAuswahl();
    });
    // Alle sechs stehen und sind im Bild - sonst zeigt der Screenshot Wiese.
    // Der Pruefgriff setzt eine Einheit auf den **Ring** um den genannten
    // Platz, nicht auf ihn: gesucht wird deshalb in der Nachbarschaft. Weil
    // alle denselben Versatz bekommen, bleibt die Reihe eine Reihe.
    const suchen = (plaetze) => {
      const a = window.ansicht;
      const gefunden = plaetze.map(({ art, x, y }) => {
        const k = a.werte.einheiten[art].kuerzel;
        const nah = [...a.nachher.values()].filter((e) => e.b === a.ich && e.k === k
          && Math.abs(e.x - x) <= 1.5 && Math.abs(e.y - y) <= 1.5);
        return nah.length === 1 ? { art, x: nah[0].x, y: nah[0].y } : null;
      });
      return gefunden.every(Boolean) ? gefunden : null;
    };
    await anna.waitForFunction(suchen, angelegt);
    const stehen = await anna.evaluate(suchen, angelegt);
    // Erst jetzt die Kamera: auf die Mitte der Reihe, wie sie wirklich steht.
    await anna.evaluate((plaetze) => {
      const a = window.ansicht;
      a.blickAuf(plaetze.reduce((m, p) => m + p.x, 0) / plaetze.length,
        plaetze.reduce((m, p) => m + p.y, 0) / plaetze.length);
    }, stehen);
    const ausserhalb = await anna.evaluate((plaetze) => {
      const a = window.ansicht;
      return plaetze.filter(({ x, y }) => {
        const p = a.zuBild(x, y);
        return p.x < 40 || p.y < 80 || p.x > a.leinwand.clientWidth - 40 || p.y > a.leinwand.clientHeight - 40;
      }).map((p) => p.art);
    }, stehen);
    expect(ausserhalb, 'alle sechs im Bild').toEqual([]);
    // Von links nach rechts in der Reihenfolge der Bildunterschrift.
    const vonLinks = await anna.evaluate((plaetze) => plaetze
      .map(({ art, x, y }) => ({ art, bx: window.ansicht.zuBild(x, y).x }))
      .sort((p, q) => p.bx - q.bx)
      .map((p) => p.art), stehen);
    expect(vonLinks).toEqual(reihe);
    expect(await figurenFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-36',
      titel: 'Zoom 1, von links nach rechts: Dorfbewohner mit Axt, Miliz mit langem Schild, Soldat mit Streitaxt, Speerkämpfer mit Rundschild und hohem Speer, Bogenschütze mit gespanntem Bogen, Plänkler mit Wurfspieß über der Schulter',
      test: info,
    });
  });
});
