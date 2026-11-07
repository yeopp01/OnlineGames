// Handgriffe fuer das Strategiespiel im Browser. Rueckschau nach Runde 20:
// der Start einer Partie zu zweit stand kopiert in jeder Spielbild-Datei.
import { ANMELDUNG, GRIFFHAFEN, expect, fehlerSammeln, zeitraffer } from './seite.mjs';

/**
 * Anna (angemeldet) eroeffnet mit festem Startwert, Bert tritt bei, Anna
 * startet. Zurueck kommen beide Seiten, der Raumcode und die gesammelten
 * Fehler beider Seiten - fuer `afterAll`.
 *
 * @param {import('@playwright/test').Browser} browser
 * @param {import('@playwright/test').TestInfo} info
 * @param {{startwert?: number, breite?: number, hoehe?: number}} [wie]
 */
export async function partieZuZweit(browser, info, { startwert = 4711, breite = 1400, hoehe = 950 } = {}) {
  const optionen = { baseURL: info.project.use.baseURL, viewport: { width: breite, height: hoehe }, locale: 'de-DE' };
  const anna = await (await browser.newContext({ ...optionen, storageState: ANMELDUNG })).newPage();
  const bert = await (await browser.newContext(optionen)).newPage();
  const fehler = [fehlerSammeln(anna), fehlerSammeln(bert)];

  await anna.goto('/');
  await anna.locator('[data-oeffnen="strategie"]').click();
  await anna.locator('[data-einstellung="startwert"]').fill(String(startwert));
  await anna.locator('[data-eroeffnen="strategie"]').click();
  await expect(anna.locator('#raumcode')).toHaveText(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  const code = (await anna.locator('#raumcode').textContent()).trim();

  await bert.goto('/');
  await bert.locator('#name').fill('Bert');
  await bert.locator('#code').fill(code);
  await bert.locator('#beitreten').click();
  await expect(anna.locator('#spielerliste li')).toHaveCount(2);

  await anna.locator('#starten').click();
  for (const seite of [anna, bert]) {
    await expect(seite.locator('#brett')).toBeVisible();
    await seite.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0 && window.ansicht.gebaeude.size > 0);
  }
  return { anna, bert, code, fehler };
}

/** Beide Seiten schliessen; vorher duerfen sie keine Fehler gemeldet haben. */
export async function partieBeenden({ anna, bert, fehler }) {
  expect(fehler.flat(), 'Eine der Seiten hat Fehler gemeldet').toEqual([]);
  await anna?.context().close();
  await bert?.context().close();
}

/**
 * Einen eigenen Dorfbewohner anklicken, an der Koerpermitte - bevorzugt einen,
 * der im Bild frei steht: stand ein anderer dicht daneben, traf der Klick den
 * (Runde 53, im Test der ganzen Dunklen Zeit).
 *
 * Zwei Fallen, beide in Runde 58 gefunden, beide im Zeitraffer haeufig:
 * - Wer **hinter** einem Gebaeude steht, ist seit Schritt B1 nur ein Umriss;
 *   der Klick trifft das Gebaeude davor. Solche kommen nicht in Frage.
 * - Wer **laeuft**, ist beim Klick nicht mehr dort, wo eben gemessen wurde.
 *   Im Zeitraffer steht fast nie einer still, also wird neu gemessen und noch
 *   einmal geklickt, bis einer sitzt.
 */
export async function dorfbewohnerAnklicken(page, { ohne = [], code = null, raffer = 1 } = {}) {
  // Mit `code` haelt die Hilfe die Zeit an, waehrend sie zielt: im Zeitraffer
  // laeuft das Ziel zwischen Messen und Klicken mehrere Felder weit.
  if (code) await zeitraffer(page, code, 1);
  const messen = () => page.evaluate((nicht) => {
    const a = window.ansicht;
    const h = a.figurenHoehe();
    const alle = [...a.nachher.values()].map((e) => ({ e, p: a.zuBild(e.x, e.y) }));
    const tiere = [...a.tiere.values()].map((t) => a.zuBild(t.x, t.y));
    // Verdeckte sind nur ein Umriss hinter dem Gebaeude - ein Klick trifft das Gebaeude.
    const verdeckt = new Set(a.umrisse || []);
    const kandidaten = alle.filter(({ e, p }) => e.b === a.ich && e.k === 'd' && !nicht.includes(e.i)
      && !verdeckt.has(e.i)
      && p.x > 20 && p.y > h + 60 && p.x < a.leinwand.clientWidth - 20 && p.y < a.leinwand.clientHeight - 160);
    const abstand = ({ e, p }) => Math.min(
      ...alle.filter((o) => o.e.i !== e.i).map((o) => Math.hypot(o.p.x - p.x, o.p.y - p.y)),
      ...tiere.map((q) => Math.hypot(q.x - p.x, q.y - p.y)),
      Infinity,
    );
    const beste = kandidaten.sort((x, y) => abstand(y) - abstand(x))[0];
    if (beste) return { i: beste.e.i, x: beste.p.x, y: beste.p.y - h * 0.6 };
    // Keiner im Bild: im Zeitraffer laufen sie weit vom Dorf weg. Einen in
    // die Mitte holen und beim naechsten Versuch wieder messen.
    const weit = alle.find(({ e }) => e.b === a.ich && e.k === 'd' && !nicht.includes(e.i) && !verdeckt.has(e.i));
    if (weit) a.blickAuf(weit.e.x, weit.e.y);
    return null;
  }, ohne);

  const gewaehlt = (id) => page.evaluate((i) => {
    const gleich = [...window.ansicht.ausgewaehlt];
    return gleich.length === 1 && gleich[0] === i;
  }, id);

  let letzte = null;
  for (let versuch = 0; versuch < 12; versuch++) {
    const ziel = await messen();
    if (!ziel) {
      await page.waitForTimeout(200);
      continue;
    }
    letzte = ziel;
    await page.mouse.click(ziel.x, ziel.y);
    // Kurz warten: der Zustand des naechsten Takts darf die Auswahl bestaetigen.
    for (let n = 0; n < 6; n++) {
      if (await gewaehlt(ziel.i)) {
        if (code) await zeitraffer(page, code, raffer);
        return ziel.i;
      }
      await page.waitForTimeout(100);
    }
  }
  expect(letzte, 'ein freistehender, unverdeckter Dorfbewohner').not.toBeNull();
  // Zwoelfmal danebengeklickt: die Zusicherung sagt, was zuletzt zu sehen war.
  await expect.poll(() => page.evaluate(() => [...window.ansicht.ausgewaehlt])).toEqual([letzte.i]);
  return letzte.i;
}

/**
 * Wo im Bild ein Gebaeude der Groesse n ganz auf Gras stuende, ohne Schaf -
 * gerechnet aus der Karte der Ansicht, ringweise um einen Punkt. Ob die
 * Vorschau das auch so sieht, prueft der Test danach mit dem Zeiger.
 */
export function platzImBild(page, { n = 2, um, abstand = 5, seitlich = false }) {
  return page.evaluate(({ n, um, abstand, seitlich }) => {
    const a = window.ansicht;
    // Frei heisst: die Vorschau im Spiel zeigte Gruen - mit einem Feld Rand, damit
    // Figuren daneben nicht im Weg stehen.
    const frei = (x0, y0) => a.platzTaugt(Object.keys(a.werte.gebaeude).find((art) => (a.werte.gebaeude[art].groesse || 1) === n && !a.werte.gebaeude[art].begehbar) || 'haus', x0 + Math.floor(n / 2), y0 + Math.floor(n / 2), 1);
    for (let r = abstand; r < abstand + 10; r++) {
      // Vorn zuerst (dx + dy gross): dahinter verdeckt das Dorfzentrum Baustelle
      // und Bauer (Runde 23, beim Ansehen gefunden).
      const ring = [];
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) ring.push([dx, dy]);
      }
      // Seitlich: im Bild rechts daneben (dx - dy gross), fuer Wege, die man sehen will.
      ring.sort((p, q) => (seitlich ? (q[0] - q[1]) - (p[0] - p[1]) : (q[0] + q[1]) - (p[0] + p[1])));
      for (const [dx, dy] of ring) {
        const x = Math.round(um.x) + dx;
        const y = Math.round(um.y) + dy;
        const x0 = x - Math.floor(n / 2);
        const y0 = y - Math.floor(n / 2);
        if (!frei(x0, y0)) continue;
        const p = a.zuBild(x0 + (n - 1) / 2, y0 + (n - 1) / 2);
        // Im Bild und nicht unter der Leiste unten.
        if (p.x < 120 || p.x > a.leinwand.clientWidth - 120 || p.y < 120 || p.y > a.leinwand.clientHeight - 260) continue;
        return { x, y, bild: p };
      }
    }
    return null;
  }, { n, um, abstand, seitlich });
}

/**
 * Die festen Teile ueber dem Spielfeld - Kopfzeile, Auswahlleiste, Knopf fuer
 * Untaetige, Uebersichtskarte, Meldung - duerfen einander nicht ueberdecken
 * und nicht aus dem Fenster ragen. Rueckschau nach Runde 50: die Auswahlleiste
 * lag eine Runde lang unter der Uebersichtskarte, kein Test hatte es gesehen.
 * Zurueck kommt die Liste der Beanstandungen, leer heisst in Ordnung.
 */
export function bedienteileFrei(page) {
  return page.evaluate(() => {
    const teile = ['#kopfzeile', '#auswahlleiste', '#untaetig', '#uebersicht', '#spielmeldung']
      .map((wahl) => ({ wahl, el: document.querySelector(wahl) }))
      .filter(({ el }) => el && !el.hidden && el.getClientRects().length)
      .map(({ wahl, el }) => ({ wahl, r: el.getBoundingClientRect() }));
    const beanstandet = [];
    const breite = window.innerWidth;
    const hoehe = window.innerHeight;
    for (const { wahl, r } of teile) {
      if (r.left < 0 || r.top < 0 || r.right > breite || r.bottom > hoehe) beanstandet.push(`${wahl} ragt aus dem Fenster`);
    }
    for (let i = 0; i < teile.length; i++) {
      for (let j = i + 1; j < teile.length; j++) {
        const a = teile[i].r;
        const b = teile[j].r;
        if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) {
          beanstandet.push(`${teile[i].wahl} ueberdeckt ${teile[j].wahl}`);
        }
      }
    }
    return beanstandet;
  });
}

/**
 * Freie Wiesen neben der eigenen Basis, je mit fuenf Feldern Gras ringsum und
 * mindestens 16 Felder auseinander. Auf Stein oder Wald sieht man die Figuren
 * zwar, aber das Bild erzaehlt dann vom Steinbruch (Runde 63); und wer zwei
 * Gefechte in einer Partie aufstellt, braucht sie weit genug auseinander, weil
 * eine stehende Kampfeinheit von selbst angreift, was sie sieht (kampf AC-2).
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} [anzahl]
 * @returns {Promise<{x: number, y: number}[]>}
 */
export function freieWiesen(page, anzahl = 1) {
  return page.evaluate((anzahl) => {
    const a = window.ansicht;
    const g = a.karte.groesse;
    const b = a.spieler.get(a.ich).basis;
    const grasUm = (x, y, r) => {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (a.karte.felder[(y + dy) * g + (x + dx)] !== 0) return false;
        }
      }
      return true;
    };
    const gefunden = [];
    for (let r = 7; r < 26; r++) {
      for (const [sx, sy] of [[1, 1], [1, 0], [0, 1], [1, -1], [-1, 1], [-1, 0], [0, -1], [-1, -1]]) {
        const x = b.x + r * sx;
        const y = b.y + r * sy;
        if (x <= 5 || y <= 5 || x >= g - 6 || y >= g - 6 || !grasUm(x, y, 5)) continue;
        if (gefunden.every((w) => Math.hypot(w.x - x, w.y - y) > 16)) gefunden.push({ x, y });
        if (gefunden.length === anzahl) return gefunden;
      }
    }
    throw new Error(`nur ${gefunden.length} von ${anzahl} freien Wiesen gefunden`);
  }, anzahl);
}

/**
 * Figuren, die im Bild uebereinander stehen. Zurueck kommt die Liste der
 * Beanstandungen, leer heisst in Ordnung - wie bei `bedienteileFrei`.
 *
 * Rueckschau nach Runde 65: viermal (Runden 56, 61, 63, 64) hat erst das
 * Ansehen eines fertigen Bildes gezeigt, dass zwei Figuren auf einem Fleck
 * stehen - "eine Figur mit drei Schwertern", "eine Figur mit zwei Boegen". Das
 * Auge hat es jedes Mal gefunden, aber erst, nachdem das Bild schon lag. Eine
 * Zahl findet es vorher.
 *
 * Gemessen wird der Abstand in **Feldern**, nicht in Bildpunkten: er haengt
 * nicht am Zoom und ist damit eine Eigenschaft der Aufstellung, nicht der
 * Kamera. Unter einem halben Feld sind zwei Figuren ein Klumpen.
 *
 * Gefallene bleiben aussen vor - die liegen mit Absicht unter den Lebenden
 * (kampf AC-10). Nur Figuren im Bild zaehlen; was ausserhalb des Ausschnitts
 * steht, zeigt der Screenshot nicht. Gebaeude vor Figuren prueft das nicht,
 * dafuer braucht es die Grundflaeche - noch offen.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{abstand?: number, nur?: string[]}} [wie] `abstand` in Feldern,
 *   `nur` beschraenkt auf diese Einheiten-Ids.
 * @returns {Promise<string[]>}
 */
export function figurenFrei(page, { abstand = 0.5, nur = null } = {}) {
  return page.evaluate(({ abstand, nur }) => {
    const a = window.ansicht;
    const auswahl = nur ? new Set(nur) : null;
    const figuren = [...a.nachher.values()]
      .filter((e) => !e.s && (!auswahl || auswahl.has(e.i)))
      .map((e) => ({ ...e, bild: a.zuBild(e.x, e.y) }))
      .filter((e) => e.bild.x >= 0 && e.bild.x <= a.leinwand.clientWidth
        && e.bild.y >= 0 && e.bild.y <= a.leinwand.clientHeight);
    const beanstandet = [];
    for (let i = 0; i < figuren.length; i++) {
      for (let j = i + 1; j < figuren.length; j++) {
        const weit = Math.hypot(figuren[i].x - figuren[j].x, figuren[i].y - figuren[j].y);
        if (weit >= abstand) continue;
        beanstandet.push(`${figuren[i].k} ${figuren[i].i} und ${figuren[j].k} ${figuren[j].i}`
          + ` stehen ${weit.toFixed(2)} Felder auseinander`);
      }
    }
    return beanstandet;
  }, { abstand, nur });
}

/**
 * Ein Gebaeude in der Naehe eines Punktes aufstellen - das erste Feld, auf dem
 * Platz ist. Ein fester Versatz geht schief, sobald dort ein Baum steht oder
 * die Karte anders faellt (Runde 60).
 *
 * @returns {Promise<string>} die Id des Gebaeudes
 */
export async function gebaeudeInDerNaehe(page, code, name, art, um, { von = 4, bis = 14 } = {}) {
  const versuche = [];
  for (let r = von; r <= bis; r++) {
    for (const [dx, dy] of [[-1, 0], [0, 1], [1, 0], [0, -1], [-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      versuche.push([um.x + dx * r, um.y + dy * r]);
    }
  }
  for (const [x, y] of versuche) {
    const antwort = await page.request.post(`http://localhost:${GRIFFHAFEN}/griff`, {
      data: { id: code, befehl: 'gebaeude', werte: { name, art, x, y } },
    });
    if (antwort.ok()) return (await antwort.json()).id;
  }
  throw new Error(`Nirgends Platz fuer ${art} um ${um.x}, ${um.y}`);
}
