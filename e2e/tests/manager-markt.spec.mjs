// Transfermarkt, Vertraege und Kasse, im Browser gesehen
// (→ specs/15-manager/transfer.md, vertraege.md, finanzen.md, bedienung.md AC-7).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import {
  ANMELDUNG, aufBlatt, expect, griff, karriereBeginnen, tausend, tempo, test, vorspulen, weiter,
} from '../helpers/seite.mjs';

const TRANSFER = '15-manager/transfer.md';
const FINANZEN = '15-manager/finanzen.md';

test.use({ storageState: ANMELDUNG });

/** Die Zeilen des Markts als Werte. */
const marktzeilen = (page) => page.locator('#markt tbody tr').evaluateAll((zeilen) => zeilen.map((z) => ({
  id: z.dataset.markt,
  position: z.cells[0].textContent.trim(),
  verein: z.cells[2].textContent.trim(),
  wert: z.cells[7].textContent.trim(),
  forderung: z.cells[8].textContent.trim(),
  vertrag: z.cells[9].textContent.trim(),
  liste: z.cells[1].textContent.includes('Liste'),
  gesperrt: z.querySelector('[data-kaufen]').disabled,
  grund: z.querySelector('[data-kaufen]').title,
})));

async function filtern(page, feld, wert) {
  const antwort = page.waitForResponse((r) => r.url().includes('/markt?'));
  await page.locator(feld).selectOption(wert);
  await antwort;
  await expect(page.locator('#markt')).toBeVisible();
}

/** Den ersten holbaren Spieler holen, mit der kuerzesten Laufzeit. */
async function holen(page, zeile = page.locator('[data-kaufen]:not([disabled])').first()) {
  const id = await zeile.getAttribute('data-kaufen');
  await zeile.click();
  const antwort = page.waitForResponse((r) => r.url().endsWith('/kaufen'));
  await page.locator('#dialog [data-laufzeit="1"]').click();
  const ergebnis = await antwort;
  if (ergebnis.ok()) await expect(page.locator(`[data-kaufen="${id}"]`)).toHaveCount(0);
  return ergebnis;
}

test.describe('Transfermarkt', () => {
  test('transfer AC-4: die Forderung liegt ueber dem Marktwert', async ({ page }, info) => {
    await karriereBeginnen(page);
    await aufBlatt(page, 'transfer');
    await filtern(page, '#filterLiga', '1');
    const zeilen = (await marktzeilen(page)).filter((z) => !z.liste && z.vertrag !== '1');
    expect(zeilen.length).toBeGreaterThan(10);
    for (const z of zeilen) expect(tausend(z.forderung), `${z.verein}: ${z.forderung} bei Wert ${z.wert}`).toBeGreaterThan(tausend(z.wert));
    await nachweis(page, {
      spec: TRANSFER,
      ac: 'AC-4',
      titel: 'Jede Forderung liegt ueber dem Marktwert in der Spalte davor',
      test: info,
    });
  });

  test('transfer AC-6: was nicht auf dem Konto ist, kann nicht geholt werden', async ({ page }, info) => {
    await karriereBeginnen(page);
    await aufBlatt(page, 'transfer');
    await expect(page.locator('#markt tbody tr').first()).toBeVisible();
    const konto = tausend(await page.locator('#kopfKonto').textContent());
    const zuTeuer = (await marktzeilen(page)).filter((z) => tausend(z.forderung) > konto + 100);
    expect(zuTeuer.length, 'Jeder Spieler der Liste ist bezahlbar').toBeGreaterThan(0);
    for (const z of zuTeuer) expect(z.gesperrt, `${z.forderung} bei ${konto} T Konto`).toBe(true);
    await nachweis(page, {
      spec: TRANSFER,
      ac: 'AC-6',
      titel: 'Wer mehr kostet, als auf dem Konto ist, steht rot und laesst sich nicht holen',
      test: info,
    });
    const antwort = page.waitForResponse((r) => r.url().includes('maxPreis='));
    await page.locator('#filterBezahlbar').click();
    await antwort;
    await expect(page.locator('#filterBezahlbar')).toHaveText('✓ nur bezahlbare');
    for (const z of await marktzeilen(page)) expect(tausend(z.forderung)).toBeLessThanOrEqual(konto + 100);
  });

  test('transfer AC-7 und oberflaeche AC-7: ein voller Kader wird mit einem Satz abgewiesen', async ({ page }, info) => {
    await karriereBeginnen(page);
    await aufBlatt(page, 'transfer');
    await filtern(page, '#filterLiga', 'frei');
    for (let i = 0; i < 6; i++) expect((await holen(page)).status()).toBe(200);
    const abgewiesen = await holen(page);
    expect(abgewiesen.status()).toBe(400);
    const meldung = page.locator('#meldung');
    await expect(meldung).toHaveText('Der Kader ist voll (26 Spieler).');
    await expect(meldung).toHaveClass(/schlimm/);
    await nachweis(page, {
      spec: TRANSFER,
      ac: 'AC-7',
      titel: 'Der 27. Spieler wird abgewiesen: der Kader ist voll',
      test: info,
    });
    await nachweis(page, {
      spec: '15-manager/bedienung.md',
      ac: 'AC-7',
      titel: 'Die Absage des Servers steht als Satz am unteren Rand',
      test: info,
    });
  });

  test('transfer AC-9: Vereinslose kosten keine Abloese', async ({ page }, info) => {
    await karriereBeginnen(page);
    const konto = await page.locator('#kopfKonto').textContent();
    await aufBlatt(page, 'transfer');
    await filtern(page, '#filterLiga', 'frei');
    const zeilen = await marktzeilen(page);
    expect(zeilen.length).toBeGreaterThan(5);
    for (const z of zeilen) {
      expect(z.verein).toBe('vereinslos');
      expect(z.forderung).toBe('0 T');
    }
    await nachweis(page, {
      spec: TRANSFER,
      ac: 'AC-9',
      titel: 'Vereinslose stehen mit einer Forderung von null auf dem Markt',
      test: info,
    });
    expect((await holen(page)).ok()).toBe(true);
    await expect(page.locator('#meldung')).toContainText('0 T Abloese');
    await expect(page.locator('#kopfKonto')).toHaveText(konto);
  });

  test('transfer AC-11: die anderen Vereine bieten von sich aus', async ({ page }, info) => {
    await karriereBeginnen(page);
    await tempo(page, 0);
    const zaehler = page.locator('#reiter [data-blatt="transfer"] .zaehler');
    for (let i = 0; i < 4 && !(await zaehler.count()); i++) await weiter(page);
    await expect(zaehler).toBeVisible();
    await aufBlatt(page, 'transfer');
    await expect(page.locator('.angebot').first()).toContainText('bietet');
    // Wer ist das eigentlich? Ein Klick auf den Namen zeigt seine Akte.
    const gefragt = (await page.locator('.angebot .namelink').first().textContent()).trim();
    await page.locator('.angebot .namelink').first().click();
    await expect(page.locator('#spielerakte')).toHaveText(gefragt);
    await page.keyboard.press('Escape');
    await expect(page.locator('#dialog')).toBeHidden();
    await nachweis(page, {
      spec: TRANSFER,
      ac: 'AC-11',
      titel: 'Angebote anderer Vereine liegen ueber dem Markt, der Reiter zaehlt sie',
      test: info,
    });
  });

  test('transfer AC-15: ausserhalb des Fensters nur Vereinslose', async ({ page }, info) => {
    await karriereBeginnen(page);
    await tempo(page, 0);
    for (let i = 0; i < 4; i++) await weiter(page);
    await expect(page.locator('#kopfLage')).toContainText('Pokal, 1. Runde');
    await aufBlatt(page, 'transfer');
    await expect(page.locator('#fensterStatus')).toContainText('geschlossen');
    await filtern(page, '#filterLiga', '1');
    const zeilen = await marktzeilen(page);
    expect(zeilen.length).toBeGreaterThan(10);
    for (const z of zeilen) expect(z.gesperrt).toBe(true);
    expect(zeilen.some((z) => z.grund === 'Das Transferfenster ist geschlossen.')).toBe(true);
    await nachweis(page, {
      spec: TRANSFER,
      ac: 'AC-15',
      titel: 'Das Fenster ist zu: Spieler anderer Vereine lassen sich nicht holen',
      test: info,
    });
    await filtern(page, '#filterLiga', 'frei');
    expect((await marktzeilen(page)).some((z) => !z.gesperrt)).toBe(true);
  });

  test('transfer AC-22: der Markt laesst sich filtern', async ({ page }, info) => {
    await karriereBeginnen(page);
    await aufBlatt(page, 'transfer');
    // Die Filter stehen nebeneinander, nicht ineinander verschachtelt untereinander.
    const oben = await page.locator('.marktfilter > *').evaluateAll((felder) => felder.map((f) => Math.round(f.getBoundingClientRect().bottom)));
    expect(oben.length, 'jeder Filter ist ein eigenes Feld').toBe(6);
    expect(new Set(oben).size, `Filter auf verschiedenen Hoehen: ${oben.join(', ')}`).toBe(1);
    await filtern(page, '#filterPosition', 'ANG');
    await filtern(page, '#filterLiga', '2');
    await filtern(page, '#filterSortierung', 'preis');
    const zeilen = await marktzeilen(page);
    expect(zeilen.length).toBeGreaterThan(5);
    for (const z of zeilen) {
      expect(['LA', 'ST', 'RA']).toContain(z.position.split('/')[0]);
      expect(z.verein).toContain('(2.)');
    }
    const preise = zeilen.map((z) => tausend(z.forderung));
    expect(preise).toEqual([...preise].sort((a, b) => a - b));
    await nachweis(page, {
      spec: TRANSFER,
      ac: 'AC-22',
      titel: 'Der Markt gefiltert auf Stuermer der zweiten Liga, nach Preis sortiert',
      test: info,
    });
  });

  test('transfer AC-25: der Ticker zeigt jeden Wechsel', async ({ page }, info) => {
    await karriereBeginnen(page);
    await weiter(page);
    await aufBlatt(page, 'transfer');
    const eintraege = page.locator('#wechselTicker li');
    await expect.poll(() => eintraege.count()).toBeGreaterThan(0);
    await expect(eintraege.first()).toContainText('→');
    await nachweis(page, {
      spec: TRANSFER,
      ac: 'AC-25',
      titel: 'Der Ticker unter dem Markt: wer von wem zu wem, fuer wie viel',
      test: info,
      ganzeSeite: true,
    });
  });
});

test.describe('Kader und Vertraege', () => {
  test('kader AC-22: die Akte eines Spielers', async ({ page }, info) => {
    test.setTimeout(120_000);
    await karriereBeginnen(page);
    await griff(page, 'vertrauen', { wert: 100 });
    // Ein junger Vereinsloser kommt fuer zwei Jahre - sein Wechsel steht dann in der Akte.
    await aufBlatt(page, 'transfer');
    await filtern(page, '#filterLiga', 'frei');
    const jung = page.locator('#markt tbody tr', { has: page.locator('[data-kaufen]:not([disabled])') })
      .filter({ has: page.locator('td:nth-child(4)', { hasText: /^(1\d|2[0-7])$/ }) }).first();
    const id = await jung.getAttribute('data-markt');
    const name = (await jung.locator('.namelink').textContent()).trim();
    await jung.locator('[data-kaufen]').click();
    const kauf = page.waitForResponse((r) => r.url().endsWith('/kaufen'));
    await page.locator('#dialog [data-laufzeit="2"]').click();
    expect((await kauf).ok()).toBe(true);

    await tempo(page, 0);
    await vorspulen(page, 'saisonende');
    await weiter(page);
    await aufBlatt(page, 'kader');
    await page.locator(`#kader [data-akte="${id}"]`).click();
    await expect(page.locator('#spielerakte')).toHaveText(name);
    const zeilen = page.locator('#stationen tbody tr');
    await expect(zeilen).toHaveCount(2);
    await expect(zeilen.nth(0)).toContainText('laufend');
    await expect(zeilen.nth(1).locator('td').first()).toHaveText('1');
    await expect(page.locator('#wechselAkte')).toContainText('vereinslos → ');
    await expect(page.locator('#dialog .verlauf')).toBeVisible();
    await nachweis(page, {
      spec: '15-manager/kader.md',
      ac: 'AC-22',
      titel: 'Die Akte nach der ersten Saison: Staerkeverlauf, die gespielte Saison, die laufende und der Wechsel mit Datum',
      test: info,
    });
  });

  test('transfer AC-20: die Transferliste', async ({ page }, info) => {
    await karriereBeginnen(page);
    await aufBlatt(page, 'kader');
    const zeile = page.locator('#kader tbody tr').nth(5);
    const antwort = page.waitForResponse((r) => r.url().endsWith('/transferliste'));
    await zeile.locator('[data-liste]').click();
    expect((await antwort).ok()).toBe(true);
    await expect(page.locator('#kader tbody tr .marke', { hasText: 'Liste' })).toHaveCount(1);
    await expect(page.locator('#kader [data-liste].an')).toHaveText('von der Liste');
    await nachweis(page, {
      spec: TRANSFER,
      ac: 'AC-20',
      titel: 'Ein Spieler auf der Transferliste traegt die Marke im Kader',
      test: info,
    });
  });

  test('transfer AC-23: Freistellen fragt nach und kostet Abfindung', async ({ page }, info) => {
    await karriereBeginnen(page);
    await aufBlatt(page, 'kader');
    const zeile = page.locator('#kader tbody tr', { has: page.locator('td', { hasText: /^(DM|LM|ZM|RM|OM)(\/[A-Z]{2})?$/ }) }).last();
    const id = await zeile.getAttribute('data-spieler');
    await zeile.locator('[data-freistellen]').click();
    await expect(zeile.locator('[data-freistellen]')).toContainText('Abfindung');
    await nachweis(page, {
      spec: TRANSFER,
      ac: 'AC-23',
      titel: 'Freistellen fragt nach und nennt die Abfindung',
      test: info,
    });
    const antwort = page.waitForResponse((r) => r.url().endsWith('/freistellen'));
    await zeile.locator('[data-freistellen]').click();
    expect((await antwort).ok()).toBe(true);
    await expect(page.locator(`#kader tr[data-spieler="${id}"]`)).toHaveCount(0);
    await expect(page.locator('#meldung')).toContainText('freigestellt');
  });

  test('vertraege AC-11: Vertraege im Browser', async ({ page }, info) => {
    await karriereBeginnen(page);
    await aufBlatt(page, 'kader');
    await expect(page.locator('#kader td.vertrag').first()).toContainText('bis');
    await expect(page.locator('#kader td.vertrag.schlecht').first()).toHaveText('bis 1');
    await page.locator('#kader [data-verlaengern]').first().click();
    await expect(page.locator('#dialog')).toBeVisible();
    await expect(page.locator('#dialog')).toContainText('Er will');
    await nachweis(page, {
      spec: '15-manager/vertraege.md',
      ac: 'AC-11',
      titel: 'Der Kader mit Laufzeit und Gehalt, rot was auslaeuft, und der Dialog zum Verlaengern',
      test: info,
    });
    const antwort = page.waitForResponse((r) => r.url().endsWith('/verlaengern'));
    await page.locator('#dialog [data-laufzeit="1"]').click();
    expect((await antwort).ok()).toBe(true);
    await expect(page.locator('#meldung')).toContainText('verlaengert bis Saison');
  });
});

test.describe('Kasse', () => {
  test('finanzen AC-8 und finanzen AC-15: das Buch und die Saison nach Posten', async ({ page }, info) => {
    await karriereBeginnen(page);
    await aufBlatt(page, 'transfer');
    await filtern(page, '#filterLiga', '2');
    await page.locator('#filterBezahlbar').click();
    await expect(page.locator('#filterBezahlbar')).toHaveText('✓ nur bezahlbare');
    expect((await holen(page)).ok()).toBe(true);
    await tempo(page, 0);
    await weiter(page);
    await weiter(page);
    await aufBlatt(page, 'finanzen');
    const buch = page.locator('#buch .buchzeile');
    await expect.poll(() => buch.count()).toBeGreaterThan(4);
    for (const wort of ['Gehaelter', 'Fernsehgeld']) await expect(page.locator('#buch')).toContainText(wort);
    await expect(page.locator('#buch')).toContainText('von ');
    await expect(page.locator('#posten tr[data-posten="gehaelter"] td').nth(2)).toContainText('-');
    await expect(page.locator('#posten tr[data-posten="transfers"] td').nth(2)).toContainText('-');
    await nachweis(page, {
      spec: FINANZEN,
      ac: 'AC-8',
      titel: 'Das Buch nach einem Kauf und dem ersten Spieltag: Abloese, Zuschauer, Fernsehgeld, Sponsor, Gehaelter',
      test: info,
    });
    await nachweis(page, {
      spec: FINANZEN,
      ac: 'AC-15',
      titel: 'Die Saison nach Posten mit Einnahmen und Ausgaben',
      test: info,
    });
  });

  test('finanzen AC-13: drei Sponsoren zur Wahl', async ({ page }, info) => {
    await karriereBeginnen(page);
    await aufBlatt(page, 'finanzen');
    const angebote = page.locator('#sponsorAngebote [data-sponsor]');
    await expect(angebote).toHaveCount(3);
    await nachweis(page, {
      spec: FINANZEN,
      ac: 'AC-13',
      titel: 'Drei Sponsorangebote vor der Saison: sicher, ausgewogen, erfolgsabhaengig',
      test: info,
    });
    await angebote.nth(1).click();
    await expect(page.locator('#sponsor')).toContainText('(ausgewogen)');
    await expect(page.locator('#sponsorAngebote')).toHaveCount(0);
  });

  test('finanzen AC-12: der Eintrittspreis ist ein Regler', async ({ page }, info) => {
    await karriereBeginnen(page);
    await aufBlatt(page, 'finanzen');
    const antwort = page.waitForResponse((r) => r.url().endsWith('/eintritt'));
    await page.locator('#eintritt').fill('40');
    expect((await antwort).ok()).toBe(true);
    await expect(page.locator('#eintrittWert')).toHaveText('40 Euro');
    await expect(page.locator('#eintritt')).toHaveValue('40');
    await nachweis(page, {
      spec: FINANZEN,
      ac: 'AC-12',
      titel: 'Der Eintrittspreis auf 40 Euro gestellt',
      test: info,
    });
  });

  test('finanzen AC-14: Stadionausbau', async ({ page }, info) => {
    await karriereBeginnen(page);
    await aufBlatt(page, 'finanzen');
    await expect(page.locator('#stadion [data-ausbau]')).toHaveCount(3);
    const antwort = page.waitForResponse((r) => r.url().endsWith('/stadion'));
    await page.locator('#stadion [data-ausbau="1"]').click();
    expect((await antwort).ok()).toBe(true);
    await expect(page.locator('#stadion')).toContainText('Im Bau: 2.500 Plaetze, fertig in 3 Wochen');
    await nachweis(page, {
      spec: FINANZEN,
      ac: 'AC-14',
      titel: 'Der Ausbau um 2.500 Plaetze laeuft, fertig in drei Wochen',
      test: info,
    });
  });
});
