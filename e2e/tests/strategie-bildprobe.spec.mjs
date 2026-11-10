// Die Bildprobe (→ specs/10-strategie/darstellung.md AC-17, ADR-0014): drei
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
    titel: 'Die Bildprobe: Dorfbewohner, Haus und Laubbaum links gezeichnet und rechts gerendert, darunter beides als Szene in Spielgroesse und der Marktkarren in acht Blickrichtungen',
    test: info,
    ganzeSeite: true,
  });
});
