// Die Bildprobe (→ specs/10-strategie/darstellung.md AC-17, ADR-0016): drei
// gerenderte Stuecke neben ihren gezeichneten Vorgaengern.
//
// Ob die gerenderten Bilder ueberzeugen, entscheidet der Benutzer am Bild.
// Pruefbar ist, was dafuer notwendig ist: die Tafeln kommen im Browser an,
// die acht Blickrichtungen sind acht verschiedene Bilder, die Spielerfarbe
// faerbt nur einen Teil der Figur, und jedes Blatt der Seite ist bemalt.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test } from '../helpers/seite.mjs';

const DARSTELLUNG = '10-strategie/darstellung.md';

test('darstellung AC-17: die Bildprobe zeigt Dorfbewohner, Haus und Baum gerendert neben gezeichnet', async ({ page }, info) => {
  await page.setViewportSize({ width: 1240, height: 1750 });
  await page.goto('/bildprobe.html?still=1');
  await page.waitForFunction(() => window.bildprobe?.fertig);

  const tafeln = await page.evaluate(() => window.bildprobe.tafeln);
  expect(tafeln.map((t) => t.name)).toEqual(['dorfbewohner', 'haus', 'baum']);
  const figur = tafeln.find((t) => t.name === 'dorfbewohner');
  expect(figur.zeilen).toBe(8);
  // Die Tafeln sind WebP (darstellung AC-18) - und der Server nennt sie auch so,
  // statt sie als unbekannte Datei zu schicken.
  const tafel = await page.request.get('/bilder/dorfbewohner.webp');
  expect(tafel.headers()['content-type']).toBe('image/webp');

  // Acht Blickrichtungen sind acht verschiedene Bilder - und Blau faerbt
  // etwas, aber nicht alles. Gemessen an der stehenden Figur je Zeile.
  const messung = await page.evaluate(async () => {
    const { gerendert, zelleZeichnen } = await import('/bilder.js');
    const tafel = gerendert('dorfbewohner');
    const [breite, hoehe] = tafel.zelle;
    const lesen = (zeile, farbe) => {
      const leinwand = document.createElement('canvas');
      leinwand.width = breite;
      leinwand.height = hoehe;
      const stift = leinwand.getContext('2d', { willReadFrequently: true });
      zelleZeichnen(stift, tafel, zeile, 0, tafel.fuss[0], tafel.fuss[1], 1, farbe);
      return stift.getImageData(0, 0, breite, hoehe).data;
    };
    const bilder = Array.from({ length: 8 }, (_, zeile) => lesen(zeile, '#4a90d9'));
    let kleinster = 1;
    for (let a = 0; a < 8; a += 1) {
      for (let b = a + 1; b < 8; b += 1) {
        let anders = 0;
        let belegt = 0;
        for (let i = 0; i < bilder[a].length; i += 4) {
          // Nur der Koerper zaehlt, nicht der Schatten daneben.
          if (bilder[a][i + 3] < 200 && bilder[b][i + 3] < 200) continue;
          belegt += 1;
          const d = Math.abs(bilder[a][i] - bilder[b][i]) + Math.abs(bilder[a][i + 1] - bilder[b][i + 1]) + Math.abs(bilder[a][i + 2] - bilder[b][i + 2]);
          if (d > 60 || (bilder[a][i + 3] < 200) !== (bilder[b][i + 3] < 200)) anders += 1;
        }
        kleinster = Math.min(kleinster, anders / belegt);
      }
    }
    // Anteil der Figur, der sich mit der Spielerfarbe aendert.
    const blau = bilder[0];
    const rot = lesen(0, '#d94a4a');
    let koerper = 0;
    let gefaerbt = 0;
    for (let i = 0; i < blau.length; i += 4) {
      if (blau[i + 3] < 200) continue;
      koerper += 1;
      if (Math.abs(blau[i] - rot[i]) + Math.abs(blau[i + 2] - rot[i + 2]) > 60) gefaerbt += 1;
    }
    return { kleinster, anteilFarbe: gefaerbt / koerper };
  });
  // Zwei benachbarte Richtungen unterscheiden sich um eine Achteldrehung.
  // Dasselbe Bild zweimal waere 0, zweimal gerendert wenige Hundertstel
  // Rauschen - ein Zehntel der Figur ist sicher mehr als das. Gemessen: das
  // aehnlichste Paar unterscheidet sich in 19 % der Figur.
  expect(messung.kleinster).toBeGreaterThan(0.1);
  // Die Spielerfarbe ist ein Stueck der Figur, nicht die ganze: hoechstens
  // ein Drittel (darstellung AC-21), und mehr als die 4 %, mit denen der
  // gezeichnete Plaenkler eine Stufe lang nicht zu erkennen war (Rueckschau
  // nach Runde 83). Gemessen: 27 % - die Gugel mit ihrem Schulterkragen.
  expect(messung.anteilFarbe).toBeGreaterThan(0.1);
  expect(messung.anteilFarbe).toBeLessThan(1 / 3);

  // Jedes der vier Blaetter ist bemalt, und zwar auf beiden Seiten des Trennstrichs.
  for (const id of ['probe-figur', 'probe-haus', 'probe-baum', 'probe-szene']) {
    await expect(page.locator(`#${id}`)).toBeVisible();
    const seiten = await page.evaluate((welche) => {
      const leinwand = document.getElementById(welche);
      const stift = leinwand.getContext('2d');
      const farben = (x0, x1) => {
        const daten = stift.getImageData(x0, 40, x1 - x0, leinwand.height - 40).data;
        const gesehen = new Set();
        for (let i = 0; i < daten.length; i += 16) gesehen.add(`${daten[i] >> 4},${daten[i + 1] >> 4},${daten[i + 2] >> 4}`);
        return gesehen.size;
      };
      return [farben(0, Math.floor(leinwand.width * 0.28)), farben(Math.floor(leinwand.width * 0.55), leinwand.width)];
    }, id);
    expect(seiten[0], `${id}: links steht nichts Gezeichnetes`).toBeGreaterThan(8);
    expect(seiten[1], `${id}: rechts steht nichts Gerendertes`).toBeGreaterThan(8);
  }

  await nachweis(page, {
    spec: DARSTELLUNG,
    ac: 'AC-17',
    titel: 'Die Bildprobe: Einheiten, Gelaende und Gebaeude links gezeichnet und rechts gerendert, dazu Mauerstuecke, Baustellen und Szenen in Spielgroesse',
    test: info,
    ganzeSeite: true,
  });
});

// Gelaende und Vorraete (darstellung AC-23). Gemessen wird an den Tafeln, wie
// sie im Browser ankommen - entschluesselt und gezeichnet, nicht an einer Zahl,
// die die Kette ueber sich selbst sagt.
test('darstellung AC-23: Baeume in vier Arten, Vorraete in vier Fuellstufen, der Boden ohne Naht', async ({ page }, info) => {
  await page.setViewportSize({ width: 1240, height: 1750 });
  await page.goto('/bildprobe.html?still=1');
  await page.waitForFunction(() => window.bildprobe?.fertig);

  const messung = await page.evaluate(async () => {
    const { gerendert, zelleZeichnen } = await import('/bilder.js');
    const { figurZeichnen } = await import('/figuren.js');
    const lesen = (tafel, zeile, spalte) => {
      const [breite, hoehe] = tafel.zelle;
      const leinwand = document.createElement('canvas');
      leinwand.width = breite;
      leinwand.height = hoehe;
      const stift = leinwand.getContext('2d', { willReadFrequently: true });
      zelleZeichnen(stift, tafel, zeile, spalte, tafel.fuss[0], tafel.fuss[1], 1, null);
      return { daten: stift.getImageData(0, 0, breite, hoehe).data, breite, hoehe };
    };
    // Der Koerper ist, was fast ganz deckt - der Schatten daneben nicht.
    const koerper = ({ daten, breite, hoehe }) => {
      let flaeche = 0;
      let oben = hoehe;
      let unten = -1;
      const summe = [0, 0, 0];
      let bunt = 0;
      let grell = 0;
      let warm = 0;
      let hellstes = 0;
      for (let y = 0; y < hoehe; y += 1) {
        for (let x = 0; x < breite; x += 1) {
          const o = (y * breite + x) * 4;
          if (daten[o + 3] < 200) continue;
          flaeche += 1;
          oben = Math.min(oben, y);
          unten = Math.max(unten, y);
          const [r, g, b] = [daten[o], daten[o + 1], daten[o + 2]];
          summe[0] += r;
          summe[1] += g;
          summe[2] += b;
          bunt += Math.max(r, g, b) - Math.min(r, g, b);
          // Leuchtendes Gelb: hell, satt und ohne Blau - die Farbe eines Warnschilds.
          if (r > 215 && g > 170 && b < 110) grell += 1;
          // Gold, wie es im Licht steht: warm und deutlich heller als das Gestein.
          if (r > 140 && r - b > 70 && r >= g) warm += 1;
          hellstes = Math.max(hellstes, (r + g + b) / 3);
        }
      }
      return {
        flaeche, hoehe: unten - oben + 1, farbe: summe.map((w) => w / Math.max(1, flaeche)),
        bunt: bunt / Math.max(1, flaeche), grell: grell / Math.max(1, flaeche), warm: warm / Math.max(1, flaeche), hellstes,
      };
    };

    // Baeume: je Art die erste Gestalt, und wie verschieden zwei Arten sind.
    const baum = gerendert('baum');
    const baeume = baum.arten.map((_, zeile) => lesen(baum, zeile, 0));
    let aehnlichstes = 1;
    for (let a = 0; a < baeume.length; a += 1) {
      for (let b = a + 1; b < baeume.length; b += 1) {
        let belegt = 0;
        let anders = 0;
        const [da, db] = [baeume[a].daten, baeume[b].daten];
        for (let i = 0; i < da.length; i += 4) {
          if (da[i + 3] < 200 && db[i + 3] < 200) continue;
          belegt += 1;
          const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]);
          if (d > 60 || (da[i + 3] < 200) !== (db[i + 3] < 200)) anders += 1;
        }
        aehnlichstes = Math.min(aehnlichstes, anders / belegt);
      }
    }

    // Vorraete: Flaeche und Hoehe des Koerpers je Fuellstufe und Gestalt.
    const vorraete = {};
    for (const name of ['beere', 'gold', 'stein']) {
      const tafel = gerendert(name);
      vorraete[name] = { stufen: tafel.stufen, gestalten: tafel.gestalten, feldbreite: tafel.feldbreite, zellen: [] };
      for (let gestalt = 0; gestalt < tafel.gestalten; gestalt += 1) {
        vorraete[name].zellen.push(Array.from({ length: tafel.stufen }, (_, zeile) => koerper(lesen(tafel, zeile, gestalt))));
      }
    }

    // Das Schaf, wie es im Spiel bei Zoom 3 steht - so gross sind die Tafeln gerendert.
    const HALB_B = 22;
    const leinwand = document.createElement('canvas');
    leinwand.width = 300;
    leinwand.height = 300;
    const stift = leinwand.getContext('2d', { willReadFrequently: true });
    figurZeichnen(stift, 'schaf', 150, 240, Math.max(9, HALB_B * 0.9 * 3), '#888888', {});
    const schaf = koerper({ daten: stift.getImageData(0, 0, 300, 300).data, breite: 300, hoehe: 300 });

    // Boden: der rechte Rand gegen den linken, der untere gegen den oberen -
    // gemessen am Unterschied zweier Nachbarn mitten in der Kachel.
    const boden = gerendert('boden');
    const naht = {};
    const bodenfarbe = {};
    boden.arten.forEach((art, zeile) => {
      // Aus der Zelle nur die Kachel - ohne den Saum, den die Kette ansetzt.
      const zelle = lesen(boden, zeile, 0);
      const [breite, hoehe] = boden.kachel || boden.zelle;
      const [saumX, saumY] = boden.saum || [0, 0];
      const daten = new Uint8ClampedArray(breite * hoehe * 4);
      for (let y = 0; y < hoehe; y += 1) {
        const von = ((y + saumY) * zelle.breite + saumX) * 4;
        daten.set(zelle.daten.subarray(von, von + breite * 4), y * breite * 4);
      }
      const unterschied = (ax, ay, bx, by) => {
        const a = (ay * breite + ax) * 4;
        const b = (by * breite + bx) * 4;
        return Math.abs(daten[a] - daten[b]) + Math.abs(daten[a + 1] - daten[b + 1]) + Math.abs(daten[a + 2] - daten[b + 2]);
      };
      let rand = 0;
      let innen = 0;
      // Innen an zwanzig Stellen gemittelt - eine einzelne Spalte schwankt.
      // Die Stellen liegen im Abstand 37 und 23, nicht im Takt der Bloecke
      // der Bildkodierung (16): mitten im Block sind zwei Nachbarn sich
      // aehnlicher als an seiner Grenze.
      const STELLEN = 20;
      for (let y = 0; y < hoehe; y += 1) {
        rand += unterschied(0, y, breite - 1, y);
        for (let i = 1; i <= STELLEN; i += 1) {
          const x = 100 + i * 37;
          innen += unterschied(x, y, x + 1, y) / STELLEN;
        }
      }
      let randHoch = 0;
      let innenHoch = 0;
      for (let x = 0; x < breite; x += 1) {
        randHoch += unterschied(x, 0, x, hoehe - 1);
        for (let i = 1; i <= STELLEN; i += 1) {
          const y = 30 + i * 23;
          innenHoch += unterschied(x, y, x, y + 1) / STELLEN;
        }
      }
      naht[art] = Math.max(rand / innen, randHoch / innenHoch);
      const k = koerper({ daten, breite, hoehe });
      bodenfarbe[art] = { farbe: k.farbe, bunt: k.bunt, deckt: k.flaeche / (breite * hoehe) };
    });
    return { arten: baum.arten, gestalten: baum.gestalten, aehnlichstes, baumfarben: baeume.map((b) => koerper(b).farbe), vorraete, schaf, bodenArten: boden.arten, naht, bodenfarbe };
  });
  info.annotations.push({ type: 'messung', description: JSON.stringify(messung) });
  const rund = (w) => Math.round(w * 100) / 100;
  console.log(`darstellung AC-23: Baumarten ${messung.arten.join(', ')}, aehnlichstes Paar ${rund(messung.aehnlichstes)}; Schaf ${messung.schaf.hoehe} px; `
    + Object.entries(messung.vorraete).map(([name, v]) => `${name} Hoehe ${v.zellen.map((z) => z[0].hoehe).join('/')} Flaeche ${v.zellen[0].map((z) => z.flaeche).join('>')} bunt ${rund(v.zellen[0][0].bunt)} grell ${rund(v.zellen[0][0].grell)} warm ${rund(v.zellen[0][0].warm)} hellstes ${Math.round(v.zellen[0][0].hellstes)}`).join('; ')
    + `; Naht ${Object.entries(messung.naht).map(([a, n]) => `${a} ${rund(n)}`).join(', ')}; Boden bunt ${Object.entries(messung.bodenfarbe).map(([a, f]) => `${a} ${rund(f.bunt)}`).join(', ')}`);

  // Mindestens vier Arten, und keine zwei sehen sich aehnlich: dasselbe Bild
  // zweimal waere 0. Gemessen 2026-11-10: das aehnlichste Paar unterscheidet
  // sich in 85 % der Flaeche.
  expect(messung.arten.length).toBeGreaterThanOrEqual(4);
  expect(messung.gestalten).toBeGreaterThanOrEqual(3);
  expect(messung.aehnlichstes).toBeGreaterThan(0.4);
  // Die Birke ist der helle Baum, die Fichte der dunkle - daran haelt man sie
  // bei Zoom 1 auseinander (darstellung AC-14).
  const hell = (farbe) => farbe[0] + farbe[1] + farbe[2];
  const farbeVon = (art) => messung.baumfarben[messung.arten.indexOf(art)];
  expect(hell(farbeVon('birke'))).toBeGreaterThan(hell(farbeVon('fichte')) * 1.3);

  for (const [name, vorrat] of Object.entries(messung.vorraete)) {
    expect(vorrat.stufen, `${name}: vier Fuellstufen`).toBe(4);
    for (const stufen of vorrat.zellen) {
      // Leert sich ein Vorrat, wird er sichtbar kleiner: jede Stufe hat
      // weniger Flaeche als die davor, die letzte hoechstens zwei Drittel der ersten.
      for (let i = 1; i < stufen.length; i += 1) expect(stufen[i].flaeche, `${name}, Stufe ${i + 1}`).toBeLessThan(stufen[i - 1].flaeche);
      expect(stufen.at(-1).flaeche / stufen[0].flaeche, `${name}: fast leer gegen voll`).toBeLessThan(2 / 3);
    }
  }
  // Ein Beerenstrauch ist hoechstens doppelt so hoch wie ein Schaf - beide in
  // der Groesse von Zoom 3. Gemessen: 58 bis 63 Bildpunkte gegen 34 (der erste
  // Wurf war 68 bis 76 hoch und fiel hier durch).
  for (const stufen of messung.vorraete.beere.zellen) expect(stufen[0].hoehe / messung.schaf.hoehe).toBeLessThanOrEqual(2);
  // Vorraete sind nicht greller als ihre Umgebung: im Mittel nicht bunter als
  // das Gras, auf dem sie stehen.
  for (const [name, vorrat] of Object.entries(messung.vorraete)) {
    for (const stufen of vorrat.zellen) expect(stufen[0].bunt, `${name}: bunter als das Gras`).toBeLessThanOrEqual(messung.bodenfarbe.gras.bunt * 1.25);
  }
  // Gold glaenzt, ohne gelb zu leuchten: es gibt warmes, helles Metall - mehr
  // als am Stein -, aber so gut wie kein Warnschild-Gelb.
  for (const [i, stufen] of messung.vorraete.gold.zellen.entries()) {
    expect(stufen[0].warm, 'am Gold ist Gold zu sehen').toBeGreaterThan(0.02);
    expect(stufen[0].warm).toBeGreaterThan(messung.vorraete.stein.zellen[i][0].warm + 0.02);
    expect(stufen[0].grell, 'Gold leuchtet gelb').toBeLessThan(0.02);
  }

  // Der Boden: fuenf Texturen, jede deckt ihre Kachel ganz und hat keine Naht.
  // Gemessen: Rand gegen Rand ist 1,11- bis 1,33-mal so verschieden wie zwei
  // Nachbarn im Inneren - weniger als zwei Bildpunkte im Abstand 2 (1,3 bis
  // 1,6). Ohne den Saum in der Tafel (grafik/boden.py) waren es bis 1,76.
  expect(messung.bodenArten).toEqual(['gras', 'erde', 'waldboden', 'sand', 'wasser']);
  for (const art of messung.bodenArten) {
    expect(messung.bodenfarbe[art].deckt, `${art}: die Kachel hat Loecher`).toBe(1);
    expect(messung.naht[art], `${art}: Naht am Rand der Kachel`).toBeLessThan(1.5);
  }

  await nachweis(page.locator('#probe-gelaende'), {
    spec: DARSTELLUNG,
    ac: 'AC-23',
    titel: 'Die Bildprobe: fuenf Bodentexturen ohne Naht, Eiche, Birke, Fichte und Kiefer in je vier Gestalten, Beeren, Gold und Stein von voll bis fast leer, daneben ein Schaf',
    test: info,
  });
});

// Welche Art auf welchem Feld steht, entscheidet der Browser (der Server kennt
// nur "Baum"): gemessen an einer Karte von 60 mal 60 Feldern.
test('darstellung AC-23: Laubwald und Nadelwald stehen in Gruppen, und alle vier Arten kommen vor', async ({ page }) => {
  await page.goto('/bildprobe.html?still=1');
  await page.waitForFunction(() => window.bildprobe?.fertig);
  const wald = await page.evaluate(async () => {
    const { baumart } = await import('/gelaende.js');
    const tafel = { arten: ['eiche', 'birke', 'fichte', 'kiefer'] };
    const g = 60;
    const gezaehlt = [0, 0, 0, 0];
    let gleich = 0;
    let paare = 0;
    const art = (x, y) => baumart(tafel, y * g + x, { x, y }, 4711);
    for (let y = 0; y < g; y += 1) {
      for (let x = 0; x < g; x += 1) {
        gezaehlt[art(x, y)] += 1;
        if (x + 1 < g) {
          paare += 1;
          if ((art(x, y) >= 2) === (art(x + 1, y) >= 2)) gleich += 1;
        }
      }
    }
    return {
      anteile: gezaehlt.map((n) => n / (g * g)),
      nachbarnGleich: gleich / paare,
      zweimal: art(17, 1) === art(17, 1),
      eineArt: baumart({ arten: ['eiche'] }, 77, { x: 17, y: 1 }, 4711),
    };
  });
  console.log(`darstellung AC-23, Wald: Anteile ${wald.anteile.map((a) => a.toFixed(2)).join(' / ')}, Nachbarn gleicher Sorte ${(wald.nachbarnGleich * 100).toFixed(0)} %`);
  for (const anteil of wald.anteile) expect(anteil).toBeGreaterThan(0.05);
  // Gewuerfelt waeren es 50 %: Nachbarn sind fast immer beide Laub oder beide Nadel.
  expect(wald.nachbarnGleich).toBeGreaterThan(0.8);
  expect(wald.zweimal).toBe(true);
  // Eine Tafel mit nur einer Art hat nur Zeile 0.
  expect(wald.eineArt).toBe(0);
});

// Die gerenderten Einheiten (darstellung AC-24): gemessen wird jede Einheit,
// die das Blatt "Einheiten" der Bildprobe zeigt - an den Tafeln, wie sie im
// Browser ankommen. Was hier steht, sind die Teile von AC-19 bis AC-21, die
// sich an der Tafel pruefen lassen; ob eine Einheit im Spiel dorthin schaut,
// wohin sie geht, prueft der Test im Spielbild.
test('darstellung AC-24: jede gerenderte Einheit hat acht Blickrichtungen, Ablaeufe aus acht Bildern und Spielerfarbe als Akzent', async ({ page }, info) => {
  await page.setViewportSize({ width: 1240, height: 1750 });
  await page.goto('/bildprobe.html?still=1');
  await page.waitForFunction(() => window.bildprobe?.fertig);

  // Welche Ablaeufe eine Einheit hat. Der Dorfbewohner arbeitet, statt
  // anzugreifen (derselbe Hieb fuer Holz, Stein, Gold, Bauen und Kampf), und
  // geht mit jeder der vier Waren; das Schaf geht nur - geschlachtet liegt es
  // als Kadaver da; der Marktkarren faehrt und bricht, er greift nie an.
  const ERWARTET = {
    sonst: ['gehen', 'angreifen', 'sterben'],
    dorfbewohner: ['gehen', 'arbeiten', 'sterben', 'gehen_h', 'gehen_n', 'gehen_g', 'gehen_s'],
    marktkarren: ['gehen', 'sterben'],
    schaf: ['gehen'],
  };
  // Was Raeder hat, legt sich nicht hin: es bricht zusammen.
  const GERAETE = ['ramme', 'mangonel', 'marktkarren'];
  const messung = await page.evaluate(async (erwartet) => {
    const { ablaeufeLaden, ablaufZelle, gerendert, zelleZeichnen } = await import('/bilder.js');
    const ergebnis = {};
    // Der Marktkarren hat in der Bildprobe sein eigenes Blatt, gemessen wird er hier mit.
    for (const art of [...window.bildprobe.einheiten, 'marktkarren']) {
      const tafel = gerendert(art);
      await ablaeufeLaden(art);
      // Jede Tafel einer Einheit kann ihre eigene Zelle haben (knapp
      // geschnitten). Gemessen wird auf einer Leinwand, in die jede passt,
      // den Fusspunkt immer an derselben Stelle.
      const zellen = [tafel, ...Object.values(tafel.ablaeufe).filter((a) => a.zelle)];
      const links = Math.max(...zellen.map((z) => z.fuss[0]));
      const oben = Math.max(...zellen.map((z) => z.fuss[1]));
      const breite = links + Math.max(...zellen.map((z) => z.zelle[0] - z.fuss[0]));
      const hoehe = oben + Math.max(...zellen.map((z) => z.zelle[1] - z.fuss[1]));
      const lesen = (richtung, ablauf, bild, farbe = '#4a90d9') => {
        const leinwand = document.createElement('canvas');
        leinwand.width = breite;
        leinwand.height = hoehe;
        const stift = leinwand.getContext('2d', { willReadFrequently: true });
        const zelle = ablaufZelle(tafel, richtung, ablauf, (bild + 0.5) / tafel.ablaeufe[ablauf].bilder);
        if (zelle.ablauf !== ablauf) throw new Error(`${art}: der Ablauf ${ablauf} ist nicht geladen`);
        zelleZeichnen(stift, zelle.quelle, zelle.zeile, zelle.spalte, links, oben, 1, farbe);
        return stift.getImageData(0, 0, breite, hoehe).data;
      };
      // Wie verschieden zwei Bilder sind: Anteil des Koerpers (ohne Schatten),
      // der sich deutlich unterscheidet.
      const unterschied = (a, b) => {
        let anders = 0;
        let belegt = 0;
        for (let i = 0; i < a.length; i += 4) {
          if (a[i + 3] < 200 && b[i + 3] < 200) continue;
          belegt += 1;
          const d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
          if (d > 60 || (a[i + 3] < 200) !== (b[i + 3] < 200)) anders += 1;
        }
        return { anteil: anders / Math.max(1, belegt), punkte: anders };
      };
      const abstand = (a, b) => unterschied(a, b).anteil;
      const kleinster = (bilder) => {
        let wert = 1;
        for (let a = 0; a < bilder.length; a += 1) for (let b = a + 1; b < bilder.length; b += 1) wert = Math.min(wert, abstand(bilder[a], bilder[b]));
        return wert;
      };
      // Dasselbe in Bildpunkten: an einem grossen Geraet bewegt sich ein
      // kleines Stueck (die Raeder, der Rammbock), und das ist ein kleiner
      // Anteil, aber deutlich zu sehen.
      const wenigstePunkte = (bilder) => {
        let wert = Infinity;
        for (let a = 0; a < bilder.length; a += 1) for (let b = a + 1; b < bilder.length; b += 1) wert = Math.min(wert, unterschied(bilder[a], bilder[b]).punkte);
        return wert;
      };
      // Die Oberkante des Koerpers, vom oberen Rand der Zelle gemessen.
      const oberkante = (daten) => {
        for (let i = 3; i < daten.length; i += 4) if (daten[i] >= 200) return Math.floor(i / 4 / breite);
        return hoehe;
      };
      const stehend = Array.from({ length: tafel.richtungen }, (_, r) => lesen(r, 'stehen', 0));
      const ablaeufe = {};
      for (const name of erwartet[art] || erwartet.sonst) {
        if (!tafel.ablaeufe[name]) throw new Error(`${art}: der Ablauf ${name} fehlt`);
        const bilder = Array.from({ length: tafel.ablaeufe[name].bilder }, (_, i) => lesen(1, name, i));
        ablaeufe[name] = { bilder: bilder.length, kleinster: kleinster(bilder), punkte: wenigstePunkte(bilder), eigeneTafel: Boolean(tafel.ablaeufe[name].bild) };
        if (name === 'sterben') {
          ablaeufe[name].sinkt = oberkante(bilder.at(-1)) - oberkante(bilder[0]);
          ablaeufe[name].bruch = abstand(bilder[0], bilder.at(-1));
        }
      }
      // Was er traegt, sieht man (bedienung AC-16): jede Ladung ein anderes
      // Bild, und keines davon das Bild ohne Ladung.
      const ladungen = ['h', 'n', 'g', 's'].filter((ware) => tafel.ablaeufe[`stehen_${ware}`]);
      const ladung = ladungen.length ? kleinster([lesen(3, 'stehen', 0), ...ladungen.map((ware) => lesen(3, `stehen_${ware}`, 0))]) : null;
      // Ein geschlachtetes Tier liegt in Stufen da, je nach dem, was uebrig
      // ist (einheiten AC-17) - und jede Stufe ist ein anderes Bild.
      let kadaver = null;
      if (tafel.ablaeufe.kadaver) {
        const stufen = Array.from({ length: tafel.ablaeufe.kadaver.bilder }, (_, i) => lesen(1, 'kadaver', i));
        kadaver = { stufen: stufen.length, kleinster: kleinster(stufen), liegt: oberkante(stufen[0]) - oberkante(lesen(1, 'stehen', 0)) };
      }
      // Anteil des Koerpers, der sich mit der Spielerfarbe aendert - in der
      // Richtung, in der am meisten Farbe zu sehen ist, und in der mit am wenigsten.
      const anteile = stehend.map((blau, r) => {
        const rot = lesen(r, 'stehen', 0, '#d94a4a');
        let koerper = 0;
        let gefaerbt = 0;
        for (let i = 0; i < blau.length; i += 4) {
          if (blau[i + 3] < 200) continue;
          koerper += 1;
          if (Math.abs(blau[i] - rot[i]) + Math.abs(blau[i + 2] - rot[i + 2]) > 60) gefaerbt += 1;
        }
        return gefaerbt / koerper;
      });
      ergebnis[art] = { richtungen: tafel.richtungen, kleinsterRichtung: kleinster(stehend), ablaeufe, ladungen: ladungen.length, ladung, kadaver, farbeMin: Math.min(...anteile), farbeMax: Math.max(...anteile) };
    }
    return ergebnis;
  }, ERWARTET);
  info.annotations.push({ type: 'messung', description: JSON.stringify(messung) });
  const rund = (w) => Math.round(w * 100) / 100;
  // Weich geprueft: ein Lauf nennt jede Einheit, an der etwas nicht stimmt,
  // nicht nur die erste.
  const pruefen = expect.soft;
  for (const [art, m] of Object.entries(messung)) {
    console.log(`darstellung AC-24, ${art}: Richtungen ${m.richtungen}, aehnlichstes Paar ${rund(m.kleinsterRichtung)}; `
      + Object.entries(m.ablaeufe).map(([name, a]) => `${name} ${a.bilder} Bilder, aehnlichstes Paar ${a.punkte} px`).join('; ')
      + `${m.ablaeufe.sterben ? `; Sterben sinkt um ${m.ablaeufe.sterben.sinkt} px, Ende gegen Anfang ${rund(m.ablaeufe.sterben.bruch)}` : ''}${m.ladung === null ? '' : `; aehnlichstes Paar der Ladungen ${rund(m.ladung)}`}`
      + `${m.kadaver ? `; Kadaver ${m.kadaver.stufen} Stufen, aehnlichstes Paar ${rund(m.kadaver.kleinster)}, liegt ${m.kadaver.liegt} px tiefer` : ''}; Spielerfarbe ${rund(m.farbeMin)} bis ${rund(m.farbeMax)}`);
    // Acht Blickrichtungen sind acht verschiedene Bilder (darstellung AC-19).
    pruefen(m.richtungen, art).toBe(8);
    pruefen(m.kleinsterRichtung, `${art}: zwei Blickrichtungen zeigen dasselbe Bild`).toBeGreaterThan(0.1);
    // Gehen, Angreifen und Sterben sind Ablaeufe aus mindestens acht Bildern,
    // und keine zwei davon sind dasselbe Bild (darstellung AC-20): je zwei
    // unterscheiden sich in mindestens 60 Bildpunkten - das sind 2 % eines
    // Fusskaempfers. Ein Bild, das doppelt auf der Tafel steht, misst 0.
    for (const [name, ablauf] of Object.entries(m.ablaeufe)) {
      pruefen(ablauf.bilder, `${art}, ${name}`).toBeGreaterThanOrEqual(8);
      pruefen(ablauf.punkte, `${art}, ${name}: zwei Bilder des Ablaufs sind gleich`).toBeGreaterThanOrEqual(60);
    }
    // Alles ausser Stehen und Gehen liegt in eigenen Tafeln, die erst geholt
    // werden, wenn jemand kaempft, arbeitet oder traegt.
    for (const [name, ablauf] of Object.entries(m.ablaeufe)) {
      if (name !== 'gehen') pruefen(ablauf.eigeneTafel, `${art}, ${name}: Ablauf ohne eigene Tafel`).toBe(true);
    }
    // Wer stirbt, liegt am Ende am Boden: der Koerper ist deutlich niedriger.
    // Ein Geraet legt sich nicht hin, es bricht: am Ende ist mehr als ein
    // Viertel des Bildes ein anderes als am Anfang.
    if (m.ablaeufe.sterben && GERAETE.includes(art)) pruefen(m.ablaeufe.sterben.bruch, `${art}: am Ende steht das Geraet noch ganz da`).toBeGreaterThan(0.25);
    else if (m.ablaeufe.sterben) pruefen(m.ablaeufe.sterben.sinkt, `${art}: am Ende des Sterbens steht die Figur noch`).toBeGreaterThan(20);
    if (art === 'dorfbewohner') {
      pruefen(m.ladungen, 'der Dorfbewohner traegt vier Waren').toBe(4);
      pruefen(m.ladung, 'zwei Ladungen sehen gleich aus, oder eine sieht aus wie keine').toBeGreaterThan(0.02);
    }
    if (art === 'schaf') {
      pruefen(m.kadaver.stufen, 'der Kadaver hat vier Stufen').toBeGreaterThanOrEqual(4);
      pruefen(m.kadaver.kleinster, 'zwei Stufen des Kadavers sind dasselbe Bild').toBeGreaterThan(0.02);
      pruefen(m.kadaver.liegt, 'der Kadaver steht noch').toBeGreaterThan(8);
    }
    // Die Spielerfarbe ist ein Akzent (darstellung AC-21): in keiner
    // Blickrichtung mehr als ein Drittel der Figur, in keiner so wenig, dass
    // sie verschwindet.
    pruefen(m.farbeMax, `${art}: zu viel Spielerfarbe`).toBeLessThan(1 / 3);
    pruefen(m.farbeMin, `${art}: zu wenig Spielerfarbe`).toBeGreaterThan(0.04);
  }
  // Alle Einheiten der Daten und das Schaf.
  expect(Object.keys(messung).length).toBe(14);

  await nachweis(page.locator('#probe-einheiten'), {
    spec: DARSTELLUNG,
    ac: 'AC-24',
    titel: 'Die Bildprobe: die gerenderten Einheiten, je Einheit links die bisherige Zeichnung, daneben acht Blickrichtungen im Gehen, darunter Angriff oder Arbeit, Sterben und die Groesse beim Start einer Partie; der Dorfbewohner traegt Holz, Nahrung, Gold und Stein, das Schaf liegt geschlachtet in vier Stufen',
    test: info,
  });
});
