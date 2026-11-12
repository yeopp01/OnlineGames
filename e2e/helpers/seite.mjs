// Was jeder Browsertest braucht: eine Seite, die ihre eigenen Fehler meldet,
// und die Handgriffe des Managerspiels.
import { test as basis, expect } from '@playwright/test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
// Dieselben Haeuser wie im Server des Browserlaufs (spielziel AC-26).
import './pruefhaus.mjs';

export { expect };

/** Die gespeicherte Anmeldung aus e2e/anmeldung.setup.mjs. */
export const ANMELDUNG = join(dirname(fileURLToPath(import.meta.url)), '..', '.ergebnisse', 'anmeldung.json');
/** Der Hafen der Pruefgriffe (e2e/server.mjs). */
export const GRIFFHAFEN = (Number(process.env.E2E_HAFEN) || 4191) + 1;

/**
 * Sammelt, was eine Seite selbst kaputtmacht: Ausnahmen und console.error.
 * Eine abgelehnte Anfrage ist eine Antwort des Servers, kein Fehler der
 * Oberflaeche - die Meldung "Failed to load resource" bleibt deshalb draussen.
 */
export function fehlerSammeln(page) {
  const fehler = [];
  page.on('pageerror', (e) => fehler.push(`Ausnahme: ${e.message}`));
  page.on('console', (meldung) => {
    if (meldung.type() === 'error' && !meldung.text().startsWith('Failed to load resource')) {
      fehler.push(`console.error: ${meldung.text()}`);
    }
  });
  return fehler;
}

/**
 * `test` mit einer Seite, die am Ende keine Fehler gemeldet haben darf. Ein
 * Test ist nicht gruen, waehrend in der Seite Ausnahmen fliegen.
 */
// Die Erklaerung der ersten Partie (bedienung AC-21) steht in jedem frischen
// Browser - und jedes Fenster eines Browserlaufs ist frisch. Damit sie nicht
// in jedem Bild links oben steht und Klicks faengt, gilt sie hier als gesehen:
// fuer die Seite des Tests und fuer jedes Fenster, das ein Test selbst
// oeffnet (`browser.newContext`, Gaeste in `partieMit`). Wer von ihr handelt,
// setzt vor dem Start `erklaerungPruefen` im Sitzungsspeicher und nimmt den
// Merker weg; der Sitzungsspeicher ueberlebt ein Neuladen, so laesst sich
// auch "danach nicht wieder" pruefen (e2e/tests/strategie-erklaerung.spec.mjs).
const ERKLAERUNG_GESEHEN = () => {
  try {
    if (!sessionStorage.getItem('erklaerungPruefen')) localStorage.setItem('erklaerungGesehen', '1');
  } catch { /* fremde Seite */ }
};

export const test = basis.extend({
  browser: [async ({ browser }, use) => {
    if (!browser.erklaerungUnterdrueckt) {
      const neu = browser.newContext.bind(browser);
      browser.newContext = async (...argumente) => {
        const kontext = await neu(...argumente);
        await kontext.addInitScript(ERKLAERUNG_GESEHEN);
        return kontext;
      };
      browser.erklaerungUnterdrueckt = true;
    }
    await use(browser);
  }, { scope: 'worker' }],
  context: async ({ context }, use) => {
    await context.addInitScript(ERKLAERUNG_GESEHEN);
    await use(context);
  },
  page: async ({ page }, use) => {
    const fehler = fehlerSammeln(page);
    await use(page);
    expect(fehler, 'Die Seite hat Fehler gemeldet').toEqual([]);
  },
});

// ------------------------------------------------------------ Manager

export const SPIEL = '/manager.html';
export const BLAETTER = ['buero', 'mannschaft', 'kader', 'spieltag', 'liga', 'pokal', 'transfer', 'finanzen'];

/** Alle Spielstaende des Kontos loeschen: hoechstens fuenf gehen, und jeder Test faengt frisch an. */
export async function aufraeumen(page) {
  const antwort = await page.request.get('/api/manager/spielstaende');
  const { spielstaende = [] } = await antwort.json();
  for (const s of spielstaende) await page.request.delete(`/api/manager/spielstaende/${s.id}`);
}

/** Startwert 4711, Verein v5: dieselbe Welt bei jedem Lauf (karriere AC-2). */
export async function karriereBeginnen(page, { vereinId = 'v5', name = 'Browserlauf' } = {}) {
  await aufraeumen(page);
  await page.goto(SPIEL);
  await expect(page.locator(`[data-verein="${vereinId}"]`)).toBeVisible();
  await page.locator('#neuName').fill(name);
  await page.locator(`[data-verein="${vereinId}"]`).click();
  await expect(page.locator('#weiter')).toHaveText('Saison 1 starten');
  return page.evaluate(() => kennung);
}

export async function aufBlatt(page, name) {
  const knopf = page.locator(`#reiter [data-blatt="${name}"]`);
  await knopf.click();
  await expect(knopf).toHaveAttribute('aria-pressed', 'true');
}

/** Tempo des Tickers in Millisekunden - 0 heisst "sofort". */
export const tempo = (page, ms) => page.locator('#tempo').selectOption(String(ms));

/** Einen Termin rechnen und warten, bis der Kopf den naechsten nennt. */
export async function weiter(page) {
  const vorher = await page.locator('#kopfLage').textContent();
  const antwort = page.waitForResponse((r) => r.url().endsWith('/weiter'));
  await page.locator('#weiter').click();
  expect((await antwort).ok()).toBe(true);
  await expect(page.locator('#kopfLage')).not.toHaveText(vorher);
}

/** Vorspulen bis zur Winterpause oder bis vor das Saisonende. */
export async function vorspulen(page, bis) {
  const antwort = page.waitForResponse((r) => r.url().endsWith('/vorspulen'));
  await page.locator(bis === 'winterpause' ? '#vorWinter' : '#vorEnde').click();
  expect((await antwort).ok()).toBe(true);
  await expect(page.locator('#lauf')).toContainText('Termine in');
}

/**
 * Ein Pruefgriff: der Testserver aendert den offenen Spielstand direkt - fuer
 * Zustaende, die ueber die Oberflaeche nur mit Glueck oder nach Stunden
 * entstehen (Verletzung, Entlassung). Danach holt die Seite den Stand neu.
 */
export async function griff(page, befehl, werte = {}) {
  const id = await page.evaluate(() => kennung);
  const antwort = await page.request.post(`http://localhost:${GRIFFHAFEN}/griff`, { data: { id, befehl, werte } });
  const inhalt = await antwort.text();
  expect(antwort.ok(), inhalt).toBe(true);
  await page.evaluate((kennungImTest) => oeffnen(kennungImTest), id);
  await expect(page.locator('#reiter [data-blatt="buero"]')).toHaveAttribute('aria-pressed', 'true');
  return JSON.parse(inhalt);
}

/**
 * Der Zeitraffer als Pruefgriff: der Raum rechnet je Schlag `faktor` Takte.
 * Fuer Ablaeufe, die mit den Werten der Vorlage Minuten dauern.
 */
export async function zeitraffer(page, code, faktor) {
  const antwort = await page.request.post(`http://localhost:${GRIFFHAFEN}/griff`, {
    data: { id: code, befehl: 'zeitraffer', werte: { faktor } },
  });
  expect(antwort.ok(), await antwort.text()).toBe(true);
}

/** Die Verbindung eines Spielers vom Server aus schliessen (Pruefgriff, e2e/server.mjs). */
export async function trennen(page, code, name) {
  const antwort = await page.request.post(`http://localhost:${GRIFFHAFEN}/griff`, {
    data: { id: code, befehl: 'trennen', werte: { name } },
  });
  expect(antwort.ok(), await antwort.text()).toBe(true);
}

/** Die Uhr einer Partie auf eine Spielminute vorstellen (Pruefgriff, e2e/server.mjs). */
export async function uhrStellen(page, code, minuten) {
  const antwort = await page.request.post(`http://localhost:${GRIFFHAFEN}/griff`, {
    data: { id: code, befehl: 'uhr', werte: { minuten } },
  });
  expect(antwort.ok(), await antwort.text()).toBe(true);
}

/**
 * Rohstoffe eines Spielers im Raum setzen (Pruefgriff, e2e/server.mjs).
 * `werte.gesammelt` (`{ gold: 1234 }`) setzt, was er ueber die Partie
 * gesammelt hat - davon haengen Tafel und Punkte ab (bedienung AC-47).
 */
export async function rohstoffe(page, code, name, werte) {
  const antwort = await page.request.post(`http://localhost:${GRIFFHAFEN}/griff`, {
    data: { id: code, befehl: 'rohstoffe', werte: { name, ...werte } },
  });
  expect(antwort.ok(), await antwort.text()).toBe(true);
}

/** Ein fertiges Gebaeude fuer einen Spieler aufstellen (Pruefgriff, e2e/server.mjs). */
export async function gebaeudeAufstellen(page, code, name, art, x, y) {
  const antwort = await page.request.post(`http://localhost:${GRIFFHAFEN}/griff`, {
    data: { id: code, befehl: 'gebaeude', werte: { name, art, x, y } },
  });
  expect(antwort.ok(), await antwort.text()).toBe(true);
  return (await antwort.json()).id;
}

/**
 * Viele Einheiten fuer einen Spieler aufstellen (Pruefgriff, e2e/server.mjs).
 *
 * `werte` nimmt `art`, `x` und `y`. Gesucht wird **ringweise um (x, y) herum,
 * beginnend einen Schritt daneben** - auch eine einzelne Einheit steht also
 * nicht genau an (x, y). Wer sie wiederfinden will, sucht mit anderthalb
 * Feldern Spielraum. Ohne `x`/`y` wird um die Basis herum aufgestellt.
 * Zurueck kommt die **Zahl** der aufgestellten Einheiten, nicht ihre Nummern -
 * wer sie wiederfinden will, sucht in `window.ansicht.nachher` nach dem
 * Kuerzel der Art in der Naehe des Platzes.
 *
 * @returns {Promise<number>} wie viele aufgestellt wurden
 */
export async function einheitenAufstellen(page, code, name, anzahl, werte = {}) {
  const antwort = await page.request.post(`http://localhost:${GRIFFHAFEN}/griff`, {
    data: { id: code, befehl: 'einheiten', werte: { name, anzahl, ...werte } },
  });
  expect(antwort.ok(), await antwort.text()).toBe(true);
  return (await antwort.json()).angelegt;
}

/**
 * Einen Spieler aufgeben lassen (Pruefgriff, e2e/server.mjs). Schickt dem
 * Server dieselbe Nachricht wie spaeter der Knopf (bedienung AC-38); alles
 * dieses Spielers faellt, und ist er der Vorletzte, endet die Partie
 * (spielziel AC-5, AC-6).
 */
export async function aufgebenLassen(page, code, name) {
  const antwort = await page.request.post(`http://localhost:${GRIFFHAFEN}/griff`, {
    data: { id: code, befehl: 'aufgeben', werte: { name } },
  });
  expect(antwort.ok(), await antwort.text()).toBe(true);
}

/** Das Leben einer Einheit oder eines Gebaeudes setzen (Pruefgriff, e2e/server.mjs). */
export async function lebenSetzen(page, code, id, leben) {
  const antwort = await page.request.post(`http://localhost:${GRIFFHAFEN}/griff`, {
    data: { id: code, befehl: 'leben', werte: { id, leben } },
  });
  expect(antwort.ok(), await antwort.text()).toBe(true);
}

/** "7,3 Mio" oder "329 T" als Tausender. */
export function tausend(text) {
  const wert = text.trim();
  const mio = wert.match(/^(-?\d+),(\d) Mio$/);
  if (mio) return Number(`${mio[1]}.${mio[2]}`) * 1000 * (wert.startsWith('-') ? 1 : 1);
  const t = wert.match(/^(-?\d+) T$/);
  if (t) return Number(t[1]);
  throw new Error(`Kein Betrag: "${text}"`);
}
