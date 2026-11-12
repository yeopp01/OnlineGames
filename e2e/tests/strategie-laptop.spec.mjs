// Auf einem Laptop (→ specs/10-strategie/bedienung.md AC-23): 1366 × 768 ohne
// Abschneiden. Alle anderen Browserfaelle laufen auf 1400 × 950 - diese Groesse
// prueft sonst niemand.
//
// "Ohne Abschneiden" heisst zweierlei: kein Bedienteil ragt aus dem Fenster
// oder liegt auf einem anderen (`bedienteileFrei`), und kein Text ist zum
// Teil zu sehen und zum Teil nicht. Was nicht passt, fehlt ganz - so wie der
// Hinweis oben, wenn "Bündnis lösen" neben "Aufgeben" steht. Gemessen vor der
// Arbeit (Runde 190): dort stand "WASD schieb…", der Rest war gekuerzt.
//
// Zu dritt mit Teams, damit "Bündnis lösen" in der Kopfzeile steht - die
// breiteste Kopfzeile, die es gibt. Die Zeitalter werden wirklich erstiegen,
// alle, die die Daten kennen, denn jedes macht das Baumenue laenger.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import {
  bedienteileFrei, dorfbewohnerAnklicken, gebaeudeInDerNaehe, partieBeenden, partieZuDritt, rahmenUmAlle,
} from '../helpers/strategie.mjs';
import { AUFSTIEGE, EINHEITEN, GEBAEUDE } from '../../server/spiele/strategie/daten.js';

const BEDIENUNG = '10-strategie/bedienung.md';

/**
 * Text, der zum Teil im Bild steht und zum Teil nicht: je Textstueck in den
 * festen Bedienteilen das sichtbare Rechteck (das Fenster, geschnitten mit
 * jedem Vorfahren, der abschneidet) gegen die Rechtecke des Textes. Ganz
 * drin ist gut, ganz draussen auch (dann fehlt er, wie gewollt) - nur
 * dazwischen ist abgeschnitten. Unsichtbares fuer Vorleser (`clip-path`)
 * zaehlt nicht, und ein Knopf zaehlt als Rahmen (Runde 190: "Belagerungswerkstatt"
 * lief ueber den Rand ihres Bauknopfs, gesehen erst im Bild). Senkrecht drei Bildpunkte Spiel: die Schrift ist hoeher als
 * die Zeile, ohne dass etwas fehlt.
 */
function angeschnitten(page) {
  return page.evaluate(() => {
    const wurzeln = ['#kopfzeile', '#auswahlleiste', '#uebersicht', '#untaetig', '#tastenuebersicht', '#spielstand'];
    const befunde = new Set();
    for (const wahl of wurzeln) {
      const wurzel = document.querySelector(wahl);
      if (!wurzel || wurzel.hidden || !wurzel.getClientRects().length) continue;
      const gang = document.createTreeWalker(wurzel, NodeFilter.SHOW_TEXT);
      for (let knoten = gang.nextNode(); knoten; knoten = gang.nextNode()) {
        if (!knoten.textContent.trim()) continue;
        let rahmen = { l: 0, t: 0, r: window.innerWidth, b: window.innerHeight };
        let unsichtbar = false;
        for (let el = knoten.parentElement; el; el = el.parentElement) {
          const stil = getComputedStyle(el);
          if (el.hidden || stil.display === 'none' || stil.visibility === 'hidden' || stil.clipPath !== 'none') {
            unsichtbar = true;
            break;
          }
          // Ein Knopf ist ein Rahmen, auch wenn der Browser an ihm nichts
          // abschneidet: Text ueber seinen Rand liegt unter dem Nachbarn.
          if (stil.overflowX !== 'visible' || stil.overflowY !== 'visible' || el.tagName === 'BUTTON') {
            const r = el.getBoundingClientRect();
            rahmen = {
              l: Math.max(rahmen.l, r.left), t: Math.max(rahmen.t, r.top),
              r: Math.min(rahmen.r, r.right), b: Math.min(rahmen.b, r.bottom),
            };
          }
        }
        if (unsichtbar) continue;
        const bereich = document.createRange();
        bereich.selectNodeContents(knoten);
        for (const r of bereich.getClientRects()) {
          if (r.width < 1) continue;
          const schneidet = r.left < rahmen.r && r.right > rahmen.l && r.top < rahmen.b && r.bottom > rahmen.t;
          const ganz = r.left >= rahmen.l - 1 && r.right <= rahmen.r + 1 && r.top >= rahmen.t - 3 && r.bottom <= rahmen.b + 3;
          if (schneidet && !ganz) befunde.add(`${wahl}: "${knoten.textContent.trim().slice(0, 40)}"`);
        }
      }
    }
    return [...befunde];
  });
}

async function nichtsAbgeschnitten(page, wo) {
  await page.waitForTimeout(150);
  expect(await bedienteileFrei(page), `${wo}: Bedienteile`).toEqual([]);
  expect(await angeschnitten(page), `${wo}: Text`).toEqual([]);
}

// Zwei Gebaeude des Zeitalters fuer den naechsten Aufstieg - aus den Daten:
// keine Mauer, kein Wohnraum (Dorfzentrum, Haus, Burg), mindestens zwei Felder.
const zumAufstieg = (stufe) => Object.entries(GEBAEUDE)
  .filter(([, g]) => (g.zeitalter ?? 0) === stufe && !g.gezogen && !g.wohnraum && g.groesse >= 2)
  .slice(0, 2)
  .map(([art]) => art);

test.describe('Laptop', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuDritt(browser, info, { teams: [1, 1, 2], breite: 1366, hoehe: 768, sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-23: auf 1366 x 768 ragt in jedem Zeitalter nichts aus dem Fenster und kein Text ist halb zu sehen', async ({}, info) => {
    test.setTimeout(240_000);
    const { anna, code } = partie;
    expect(await anna.evaluate(() => [window.innerWidth, window.innerHeight])).toEqual([1366, 768]);
    await expect(anna.locator('#buendnisloesen'), 'die breiteste Kopfzeile').toBeVisible();
    await rohstoffe(anna, code, 'Anna', { holz: 9000, nahrung: 9000, gold: 9000, stein: 9000 });
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);

    await nichtsAbgeschnitten(anna, 'ohne Auswahl');

    const stufen = Object.entries(AUFSTIEGE).sort(([, a], [, b]) => a.stufe - b.stufe);
    for (let i = 0; i <= stufen.length; i++) {
      const stufe = i === 0 ? 0 : stufen[i - 1][1].stufe;
      await anna.waitForFunction((s) => window.ansicht.zeitalter === s, stufe, { timeout: 60_000 });
      // Das Baumenue eines Dorfbewohners - es waechst mit jedem Zeitalter.
      await dorfbewohnerAnklicken(anna);
      await anna.keyboard.press('b');
      await expect(anna.locator('#baumenue [data-bauen]').first()).toBeVisible();
      await nichtsAbgeschnitten(anna, `Baumenue im Zeitalter ${stufe}`);
      if (i === 2) {
        await nachweis(anna, {
          spec: BEDIENUNG,
          ac: 'AC-23',
          titel: '1366 x 768 mit Buendnis loesen und dem Baumenue des Fuerstentums - alles im Bild, der Hinweis ganz oder gar nicht',
          test: info,
        });
      }
      await anna.keyboard.press('Escape');
      await anna.keyboard.press('Escape');
      // Das Dorfzentrum mit Ausbildung, Verbesserungen und Aufstieg.
      await anna.keyboard.press('h');
      await nichtsAbgeschnitten(anna, `Dorfzentrum im Zeitalter ${stufe}`);
      if (i === stufen.length) break;
      for (const art of zumAufstieg(stufe)) await gebaeudeInDerNaehe(anna, code, 'Anna', art, basis, { von: 8, bis: 18 });
      await anna.locator(`[data-aufstieg="${stufen[i][0]}"]`).click();
      await zeitraffer(anna, code, 20);
      await anna.waitForFunction((s) => window.ansicht.zeitalter === s, stufen[i][1].stufe, { timeout: 60_000 });
      await zeitraffer(anna, code, 1);
      await anna.keyboard.press('Escape');
    }

    // Eine grosse gemischte Gruppe: von jeder Art, die ausgebildet wird, drei.
    for (const art of Object.keys(EINHEITEN)) await einheitenAufstellen(anna, code, 'Anna', 3, { art });
    await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.blickAuf(b.x, b.y);
    });
    await anna.waitForTimeout(300);
    await rahmenUmAlle(anna);
    await expect.poll(() => anna.evaluate(() => window.ansicht.ausgewaehlt.size)).toBeGreaterThan(Object.keys(EINHEITEN).length);
    await nichtsAbgeschnitten(anna, 'grosse Gruppe');
    // Gemessen vor der Arbeit (Runde 190): die Gruppe stand ohne Umbruch neben
    // dem Baumenue, das auf eine Spalte schrumpfte - die Leiste ragte oben
    // aus dem Fenster.
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-23',
      titel: '1366 x 768 mit einer Gruppe aus jeder Art in der Krone - die Gruppe bricht um, das Baumenue steht in Zeilen',
      test: info,
    });
    await anna.keyboard.press('Escape');

    // Die Tastenuebersicht ist die hoechste Tafel: ganz im Fenster.
    await anna.keyboard.press('?');
    await expect(anna.locator('#tastenuebersicht')).toBeInViewport({ ratio: 1 });
    await nichtsAbgeschnitten(anna, 'Tastenuebersicht');
    await anna.keyboard.press('Escape');

    // Der Spielstand auf Tab, mit allen drei Zeilen.
    await anna.keyboard.down('Tab');
    await expect(anna.locator('#spielstand')).toBeInViewport({ ratio: 1 });
    await nichtsAbgeschnitten(anna, 'Spielstand');
    await anna.keyboard.up('Tab');
  });
});
