// Das Kleid des Managerspiels: hell nach dem Entwurf, und jeder Text lesbar
// (→ specs/15-manager/bedienung.md AC-18).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import {
  ANMELDUNG, BLAETTER, SPIEL, aufBlatt, expect, karriereBeginnen, tempo, test, vorspulen,
} from '../helpers/seite.mjs';

const BEDIENUNG = '15-manager/bedienung.md';

/**
 * Misst im Browser jeden sichtbaren Text gegen den Grund, auf dem er steht.
 * Der Grund ist die Mischung aller halbdurchsichtigen Flaechen darunter bis
 * zur ersten deckenden. Ein Verlauf zaehlt mit seiner Grundfarbe - wer einen
 * Verlauf setzt, setzt deshalb `background-color` darunter.
 * Gibt die Stellen unter der Grenze zurueck und die Zahl der gemessenen.
 */
function kontrastMessen() {
  const farbe = (wert) => {
    const m = wert.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r, g, b, a };
  };
  const ueber = (oben, unten) => ({
    r: oben.r * oben.a + unten.r * (1 - oben.a),
    g: oben.g * oben.a + unten.g * (1 - oben.a),
    b: oben.b * oben.a + unten.b * (1 - oben.a),
    a: 1,
  });
  const leuchte = ({ r, g, b }) => {
    const k = (c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * k(r) + 0.7152 * k(g) + 0.0722 * k(b);
  };
  const grundVon = (el) => {
    const schichten = [];
    for (let e = el; e; e = e.parentElement) {
      const f = farbe(getComputedStyle(e).backgroundColor);
      if (f && f.a > 0) {
        schichten.push(f);
        if (f.a >= 1) break;
      }
    }
    let grund = { r: 255, g: 255, b: 255, a: 1 };
    for (const s of schichten.reverse()) grund = ueber(s, grund);
    return grund;
  };
  const deckkraft = (el) => {
    let d = 1;
    for (let e = el; e; e = e.parentElement) d *= Number(getComputedStyle(e).opacity);
    return d;
  };

  const schwach = [];
  let gemessen = 0;
  const alle = document.querySelectorAll('body *');
  for (const el of alle) {
    const eigenerText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!eigenerText) continue;
    if (!el.getClientRects().length) continue;
    const stil = getComputedStyle(el);
    if (stil.visibility === 'hidden') continue;
    // Gesperrtes ist nach WCAG ausgenommen; es steht absichtlich blass.
    if (el.closest(':disabled, option')) continue;
    if (deckkraft(el) < 1) continue;
    const roh = farbe(el instanceof SVGElement ? stil.fill : stil.color);
    if (!roh || roh.a === 0) continue;
    const grund = grundVon(el instanceof SVGElement ? el.closest('svg').parentElement : el);
    const schrift = ueber(roh, grund);
    const [hell, dunkel] = [leuchte(schrift), leuchte(grund)].sort((a, b) => b - a);
    const verhaeltnis = (hell + 0.05) / (dunkel + 0.05);
    const groesse = parseFloat(stil.fontSize);
    const gross = groesse >= 24 || (groesse >= 18.66 && Number(stil.fontWeight) >= 700);
    gemessen++;
    if (verhaeltnis < (gross ? 3 : 4.5)) {
      schwach.push({
        text: el.textContent.trim().slice(0, 40),
        verhaeltnis: Math.round(verhaeltnis * 100) / 100,
        schrift: stil.color,
        grund: `rgb(${Math.round(grund.r)}, ${Math.round(grund.g)}, ${Math.round(grund.b)})`,
      });
    }
  }
  return { schwach, gemessen };
}

test.describe('Das Aussehen', () => {
  test.use({ storageState: ANMELDUNG });

  test('oberflaeche AC-18: hell nach dem Entwurf, jeder Text haelt 4,5 zu 1', async ({ page }, info) => {
    test.setTimeout(120_000);
    await karriereBeginnen(page);

    // Das Kleid: Kreide als Grund, der Kopf in der Farbe des Vereins, die schmale Schrift.
    // Welche Farbe der Verein traegt, zieht der Server (oberflaeche AC-22).
    const kleid = await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.style.background = 'var(--verein-1)';
      document.body.append(probe);
      const verein = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return {
        grund: getComputedStyle(document.body).backgroundColor,
        kopf: getComputedStyle(document.querySelector('.kopf')).backgroundColor,
        verein,
        vereinGesetzt: document.documentElement.style.getPropertyValue('--verein-1'),
        schrift: getComputedStyle(document.querySelector('#vereinName')).fontFamily,
      };
    });
    expect(kleid.grund).toBe('rgb(238, 240, 234)');
    expect(kleid.vereinGesetzt).toMatch(/^#[0-9a-f]{6}$/i);
    expect(kleid.kopf).toBe(kleid.verein);
    expect(kleid.schrift).toMatch(/^Bahnschrift/);

    // Mit Inhalt: bis zur Winterpause gespielt, damit Tabellen, Noten,
    // Formkurven, Postfach und Buch gefuellt sind.
    await tempo(page, 0);
    await vorspulen(page, 'winterpause');

    const funde = {};
    let gemessen = 0;
    for (const name of BLAETTER) {
      await aufBlatt(page, name);
      await expect(page.locator('#inhalt')).not.toBeEmpty();
      // Die Maus aus dem Weg, sonst misst man die Farbe unter dem Zeiger.
      await page.mouse.move(5, 940);
      const { schwach, gemessen: n } = await page.evaluate(kontrastMessen);
      gemessen += n;
      if (schwach.length) funde[name] = schwach;
    }
    await page.locator('#zurStart').click();
    await expect(page.locator('#start')).toBeVisible();
    const start = await page.evaluate(kontrastMessen);
    gemessen += start.gemessen;
    if (start.schwach.length) funde.start = start.schwach;

    expect(gemessen).toBeGreaterThan(1500);
    expect(funde).toEqual({});

    await page.locator('[data-fortsetzen]').first().click();
    await aufBlatt(page, 'buero');
    await nachweis(page, {
      spec: BEDIENUNG,
      ac: 'AC-18',
      titel: 'Das Buero zur Winterpause im hellen Kleid: der Kopf als Vereinsplatte, Kreide als Grund, jeder Text auf neun Seiten mindestens 4,5 zu 1',
      test: info,
    });
  });
});
