// Liga, Pokal und Vorstand, im Browser gesehen
// (→ specs/15-manager/liga.md, pokal.md, vorstand.md, bedienung.md).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import {
  ANMELDUNG, aufBlatt, expect, griff, karriereBeginnen, tempo, test, vorspulen, weiter,
} from '../helpers/seite.mjs';

const LIGA = '15-manager/liga.md';

test.use({ storageState: ANMELDUNG });

/** Eine Karriere bis zur Winterpause - Hinrunde und zwei Pokalrunden gespielt. */
async function hinrunde(page) {
  await karriereBeginnen(page);
  await griff(page, 'vertrauen', { wert: 100 });
  await tempo(page, 0);
  await vorspulen(page, 'winterpause');
}

test('liga AC-5 und liga AC-15: zwei Tabellen, gerechnet wie gezaehlt', async ({ page }, info) => {
  await hinrunde(page);
  await aufBlatt(page, 'liga');
  const zeilen = page.locator('#tabelle tbody tr');
  await expect(zeilen).toHaveCount(18);
  const werte = await zeilen.evaluateAll((rs) => rs.map((r) => [...r.cells].map((c) => c.textContent.trim())));
  for (const [, verein, spiele, siege, unentschieden, , , , punkte] of werte) {
    expect(spiele, verein).toBe('17');
    if (!verein.includes('Pkt')) expect(Number(punkte), verein).toBe(3 * Number(siege) + Number(unentschieden));
  }
  await expect(page.locator('#tabelle tr.ich')).toHaveCount(1);
  await nachweis(page, {
    spec: LIGA,
    ac: 'AC-5',
    titel: 'Die Tabelle der ersten Liga nach der Hinrunde: Spiele, Siege, Tore und Punkte, der eigene Verein hervorgehoben',
    test: info,
  });

  await page.locator('[data-liga-wahl="2"]').click();
  await expect(page.locator('#inhalt h2').first()).toHaveText('Tabelle 2. Liga');
  await expect(zeilen).toHaveCount(18);
  await expect(page.locator('#tabelle tr.aufstieg')).toHaveCount(3);
  await nachweis(page, {
    spec: LIGA,
    ac: 'AC-15',
    titel: 'Umgeschaltet auf die zweite Liga, die drei Aufstiegsplaetze markiert',
    test: info,
  });
});

test('liga AC-7: die Torjaegerliste je Liga', async ({ page }, info) => {
  await hinrunde(page);
  await aufBlatt(page, 'liga');
  const torjaeger = page.locator('#torjaeger tbody tr');
  await expect(torjaeger).toHaveCount(20);
  expect(Number(await torjaeger.first().locator('td').last().textContent())).toBeGreaterThanOrEqual(5);
  await nachweis(page, {
    spec: LIGA,
    ac: 'AC-7',
    titel: 'Die Torjaegerliste der ersten Liga nach der Hinrunde, darunter der Spielplan des eigenen Vereins',
    test: info,
  });
});

test('oberflaeche AC-15: andere Vereine ansehen', async ({ page }, info) => {
  await hinrunde(page);
  await aufBlatt(page, 'liga');
  const fremd = page.locator('#tabelle tbody tr:not(.ich)').first();
  const name = (await fremd.locator('td').nth(1).textContent()).trim();
  await fremd.click();
  await expect(page.locator('#dialog')).toBeVisible();
  await expect(page.locator('#vereinsansicht')).toHaveText(name);
  expect(await page.locator('#dialog tbody tr').count()).toBeGreaterThanOrEqual(16);
  await expect(page.locator('#dialog thead')).toContainText('Forderung');
  await nachweis(page, {
    spec: '15-manager/bedienung.md',
    ac: 'AC-15',
    titel: 'Ein Klick in der Tabelle zeigt den Kader des Vereins mit Werten und Forderungen',
    test: info,
  });
  await page.keyboard.press('Escape');
  await expect(page.locator('#dialog')).toBeHidden();
});

test('pokal AC-7: der Pokal im Browser', async ({ page }, info) => {
  await hinrunde(page);
  await aufBlatt(page, 'pokal');
  const runden = page.locator('.pokalrunde');
  await expect(runden).toHaveCount(5);
  await expect(runden.nth(0).locator('.paarung')).toHaveCount(16);
  await expect(runden.nth(1).locator('.paarung')).toHaveCount(8);
  await expect(runden.nth(2).locator('.paarung')).toHaveCount(4);
  await expect(runden.nth(3)).toContainText('noch nicht ausgelost');
  await expect(runden.nth(1).locator('.paarung .tore').first()).toHaveText(/^\d+$/);
  await expect(page.locator('#pokalLage')).not.toBeEmpty();
  await nachweis(page, {
    spec: '15-manager/pokal.md',
    ac: 'AC-7',
    titel: 'Der Pokal zur Winterpause: zwei Runden gespielt, das Viertelfinale ausgelost, der eigene Verein hervorgehoben',
    test: info,
    ganzeSeite: true,
  });
});

test('kader AC-20: die Entwicklung auf einen Blick', async ({ page }, info) => {
  await hinrunde(page);
  await weiter(page);
  // Das Buero zaehlt, der Knopf fuehrt ins Kaderblatt zur Liste.
  const hinweis = page.locator('#entwicklungHinweis');
  await expect(hinweis).toContainText(/\d+ besser, \d+ schlechter/);
  await hinweis.locator('[data-gehe="kader"]').click();
  await expect(page.locator('#reiter [data-blatt="kader"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#entwicklung h2')).toContainText('Winterpause Saison 1');

  // Jeder Spieler des Kaders steht in der Liste, und jede Veraenderung ist nachher minus vorher.
  const liste = page.locator('#entwicklungsliste tbody tr');
  await expect(liste).toHaveCount(await page.locator('#kader tbody tr').count());
  const zeilen = await liste.evaluateAll((rs) => rs.map((r) => [...r.cells].map((c) => c.textContent.trim())));
  for (const [, name, , , spielzeit, vorher, nachher, differenz, regel] of zeilen) {
    expect(Number(differenz), name).toBe(Number(nachher) - Number(vorher));
    expect(spielzeit).toMatch(/^\d+ %$/);
    expect(regel).not.toBe('');
  }
  // Die Kadertabelle traegt dieselbe Veraenderung als Spalte.
  const erste = zeilen[0];
  const imKader = page.locator('#kader tbody tr', { hasText: erste[1] }).locator('td').nth(4);
  await expect(imKader).toHaveText(erste[7]);
  await nachweis(page, {
    spec: '15-manager/kader.md',
    ac: 'AC-20',
    titel: 'Die Entwicklung zur Winterpause: jeder Spieler mit Alter, Talent, Spielzeit, Staerke vorher und nachher und der Regel dazu',
    test: info,
  });
});

test('oberflaeche AC-17: die Staerke auf einen Blick im Kader', async ({ page }, info) => {
  await karriereBeginnen(page);
  await tempo(page, 0);
  // Vor der Saison steht kein Spiel an: nur die eigene Zeile.
  await aufBlatt(page, 'kader');
  await expect(page.locator('#staerke h2')).toContainText(/Kader \d+ · Platz \d+ von 18/);
  await expect(page.locator('#staerkeTabelle tbody tr')).toHaveCount(1);

  await weiter(page);
  await aufBlatt(page, 'spieltag');
  const vorschau = (await page.locator('#vorschau .vergleich .zeile b').allTextContents()).map((t) => t.trim());
  await aufBlatt(page, 'kader');
  const zeilen = page.locator('#staerkeTabelle tbody tr');
  await expect(zeilen).toHaveCount(3);
  const zellen = async (i) => (await zeilen.nth(i).locator('td').allTextContents()).map((t) => t.trim());
  const [eigen, gegner, vorteil] = [await zellen(0), await zellen(1), await zellen(2)];
  // Tor bis Angriff sind dieselben Zahlen wie in der Vorschau, der Vorteil ist die Differenz.
  expect(eigen.slice(2)).toEqual([vorschau[0], vorschau[2], vorschau[4], vorschau[6]]);
  expect(gegner.slice(2)).toEqual([vorschau[1], vorschau[3], vorschau[5], vorschau[7]]);
  for (let i = 1; i < 6; i++) expect(Number(vorteil[i]), vorteil[0]).toBe(Number(eigen[i]) - Number(gegner[i]));
  const name = (await page.locator('#kopfLage').textContent()).split(/ gegen | bei /).at(-1).trim();
  expect(gegner[0]).toBe(name);
  await nachweis(page, {
    spec: '15-manager/bedienung.md',
    ac: 'AC-17',
    titel: 'Oben im Kader: die eigene Staerke gegen die des naechsten Gegners, Spalte fuer Spalte mit dem Vorteil',
    test: info,
  });
});

test('kader AC-21: das Karriereende wird zur Winterpause angekuendigt', async ({ page }, info) => {
  await karriereBeginnen(page);
  await griff(page, 'vertrauen', { wert: 100 });
  const { spieler } = await griff(page, 'altern', { alter: 35 });
  await tempo(page, 0);
  await vorspulen(page, 'winterpause');
  await weiter(page);
  await expect(page.locator('#postfach')).toContainText('Zum Saisonende hoeren auf:');
  await expect(page.locator('#postfach')).toContainText(spieler);
  await aufBlatt(page, 'kader');
  const zeile = page.locator('#kader tbody tr', { hasText: spieler });
  await expect(zeile.locator('.marke', { hasText: 'hoert auf' })).toBeVisible();
  await expect(zeile.locator('[data-verlaengern]')).toHaveCount(0);
  await zeile.scrollIntoViewIfNeeded();
  await nachweis(page, {
    spec: '15-manager/kader.md',
    ac: 'AC-21',
    titel: 'Zur Winterpause angekuendigt: der Spieler traegt im Kader die Marke und laesst sich nicht mehr verlaengern',
    test: info,
  });
});

test('vorstand AC-10: Entlassung im Browser', async ({ page }, info) => {
  await hinrunde(page);
  await griff(page, 'vertrauen', { wert: 1 });
  await weiter(page);
  await weiter(page);
  await expect(page.locator('#weiter')).toHaveText('Entlassen');
  await expect(page.locator('#weiter')).toBeDisabled();
  const stellen = page.locator('#stellen [data-stelle]');
  await expect(stellen).toHaveCount(3);
  await nachweis(page, {
    spec: '15-manager/vorstand.md',
    ac: 'AC-10',
    titel: 'Entlassen: drei Vereine bieten eine Stelle an, mit Liga, Kaderstaerke und Ruf',
    test: info,
  });
  const neuerVerein = (await stellen.first().locator('b').textContent()).trim();
  await stellen.first().click();
  await expect(page.locator('#vereinName')).toHaveText(neuerVerein);
  await expect(page.locator('#weiter')).toBeEnabled();
  await expect(page.locator('#stellen')).toHaveCount(0);
});
