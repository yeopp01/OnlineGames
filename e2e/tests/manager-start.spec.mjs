// Anmelden, anlegen, Termin fuer Termin, Saison um Saison - im Browser gesehen
// (→ specs/15-manager/karriere.md, bedienung.md).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import {
  ANMELDUNG, BLAETTER, SPIEL, aufBlatt, aufraeumen, expect, griff, karriereBeginnen, tempo, test, vorspulen, weiter,
} from '../helpers/seite.mjs';

const KARRIERE = '15-manager/karriere.md';
const BEDIENUNG = '15-manager/bedienung.md';

test.describe('Ohne Konto', () => {
  test('oberflaeche AC-13: ohne Konto die Anmeldemaske', async ({ page }, info) => {
    await page.goto(SPIEL);
    await expect(page.locator('#anmeldung')).toBeVisible();
    await expect(page.locator('#start')).toBeHidden();
    await expect(page.locator('#spiel')).toBeHidden();
    await expect(page.locator('#anEmail')).toBeVisible();
    await nachweis(page, {
      spec: BEDIENUNG,
      ac: 'AC-13',
      titel: 'Ohne Anmeldung zeigt das Managerspiel die Anmeldemaske statt einer Fehlermeldung',
      test: info,
    });
  });
});

test.describe('Anfangen und weiterspielen', () => {
  test.use({ storageState: ANMELDUNG });

  test('karriere AC-1: der Mensch waehlt seinen Verein, in beiden Ligen', async ({ page }, info) => {
    await aufraeumen(page);
    await page.goto(SPIEL);
    const ligen = page.locator('#vereinswahl section');
    await expect(ligen).toHaveCount(2);
    await expect(ligen.nth(0).locator('.vereinskarte')).toHaveCount(18);
    await expect(ligen.nth(1).locator('.vereinskarte')).toHaveCount(18);
    await expect(ligen.nth(0).locator('.vereinskarte').first()).toContainText('erwartet Platz 1');
    await expect(ligen.nth(1)).toContainText('2. Liga');
    await nachweis(page, {
      spec: KARRIERE,
      ac: 'AC-1',
      titel: 'Beide Ligen zur Wahl, je Verein Kaderstaerke, erwarteter Platz, Konto, Stadion und Kaderwert',
      test: info,
    });
  });

  test('karriere AC-15 und oberflaeche AC-12: Spielstaende zur Wahl, auch nach dem Neuladen', async ({ page }, info) => {
    await karriereBeginnen(page, { name: 'Erste Karriere' });
    await weiter(page);
    await page.reload();
    const eintrag = page.locator('.spielstand').first();
    await expect(eintrag).toContainText('Erste Karriere');
    await expect(eintrag).toContainText('1. Liga · Saison 1 · 1. Spieltag');
    await nachweis(page, {
      spec: KARRIERE,
      ac: 'AC-15',
      titel: 'Die Spielstaende des Kontos mit Verein, Liga, Saison und naechstem Termin',
      test: info,
    });
    await nachweis(page, {
      spec: BEDIENUNG,
      ac: 'AC-12',
      titel: 'Nach dem Neuladen steht der Spielstand zum Fortsetzen bereit',
      test: info,
    });
    await eintrag.locator('[data-fortsetzen]').click();
    await expect(page.locator('#weiter')).toHaveText('Weiter: 1. Spieltag');
  });

  test('karriere AC-4 und oberflaeche AC-1: ein Knopf, ein Termin, die Leertaste auch', async ({ page }, info) => {
    await karriereBeginnen(page);
    await tempo(page, 0);
    await weiter(page);
    await expect(page.locator('#weiter')).toHaveText('Weiter: 1. Spieltag');
    await expect(page.locator('#kopfPlatz')).toHaveText('–');

    // Von einem anderen Blatt aus und ohne Fokus auf einem Knopf.
    await aufBlatt(page, 'liga');
    await page.evaluate(() => document.activeElement?.blur());
    const antwort = page.waitForResponse((r) => r.url().endsWith('/weiter'));
    await page.keyboard.press('Space');
    expect((await antwort).ok()).toBe(true);
    await expect(page.locator('#weiter')).toHaveText('Weiter: 2. Spieltag');
    await expect(page.locator('#kopfPlatz')).toHaveText(/^\d+$/);
    await nachweis(page, {
      spec: KARRIERE,
      ac: 'AC-4',
      titel: 'Nach Vorbereitung und erstem Spieltag nennt der Knopf den 2. Spieltag, der Kopf den Platz',
      test: info,
    });
    await nachweis(page, {
      spec: BEDIENUNG,
      ac: 'AC-1',
      titel: 'Weiter steht in der Kopfzeile; die Leertaste hat den ersten Spieltag gerechnet',
      test: info,
    });
  });

  test('karriere AC-5 und oberflaeche AC-4: der Bericht zeigt den Termin, der Ticker laeuft', async ({ page }, info) => {
    await karriereBeginnen(page);
    await tempo(page, 7000);
    await weiter(page);
    await weiter(page);
    await expect(page.locator('#ticker div').first()).toBeVisible();

    // Ein Blattwechsel mitten im Ticker darf nichts werfen.
    await aufBlatt(page, 'liga');
    await aufBlatt(page, 'spieltag');
    await tempo(page, 0);
    await expect(page.locator('.paarung')).toHaveCount(18);
    const inDerListe = (await page.locator('.paarung.eigenes .stand').textContent()).trim();
    await expect(page.locator('#standAnzeige')).toHaveText(inDerListe);
    await expect(page.locator('.aufstellungen table')).toHaveCount(2);
    await expect(page.locator('.ergebnis')).toContainText('Chancen');
    await expect(page.locator('.ergebnis')).toContainText('Besitz');
    await nachweis(page, {
      spec: KARRIERE,
      ac: 'AC-5',
      titel: 'Der erste Spieltag: das eigene Spiel mit Ticker, Chancen, Besitz, beiden Aufstellungen mit Noten und allen 18 Ergebnissen',
      test: info,
      ganzeSeite: true,
    });
    await nachweis(page, {
      spec: BEDIENUNG,
      ac: 'AC-4',
      titel: 'Ticker auf sofort: Tore, Karten und Wechsel mit Minute, der Stand wie in der Liste darunter',
      test: info,
    });
  });

  test('karriere AC-27: vor dem Spiel die Vorschau auf den Gegner', async ({ page }, info) => {
    await karriereBeginnen(page);
    await griff(page, 'vertrauen', { wert: 100 });
    await tempo(page, 0);
    await vorspulen(page, 'winterpause');
    await weiter(page);
    const gegner = (await page.locator('#kopfLage').textContent()).split(/ gegen | bei /).at(-1).trim();
    await aufBlatt(page, 'spieltag');
    await page.locator('[data-spieltag-wahl="vorschau"]').click();
    const vorschau = page.locator('#vorschau');
    await expect(vorschau).toContainText('18. Spieltag');
    await expect(vorschau.locator('.verein.rechts b')).toHaveText(gegner);
    await expect(vorschau.locator('.vergleich .zeile')).toHaveCount(4);
    for (const seite of ['links', 'rechts']) await expect(vorschau.locator(`.verein.${seite} .form i`)).toHaveCount(5);
    await expect(page.locator('#bisher')).toContainText('1. Spieltag');
    await nachweis(page, {
      spec: KARRIERE,
      ac: 'AC-27',
      titel: 'Vor dem 18. Spieltag: beide Vereine mit Platz, Form und Kader, Tor, Abwehr, Mittelfeld und Angriff im Vergleich, dazu das Hinspiel',
      test: info,
    });
    await page.locator('[data-spieltag-wahl="bericht"]').click();
    await expect(page.locator('#vorschau')).toHaveCount(0);
    await expect(page.locator('#inhalt h2').first()).toHaveText('Winterpause');
  });

  test('karriere AC-6: vorspulen bis zur Winterpause', async ({ page }, info) => {
    await karriereBeginnen(page);
    await griff(page, 'vertrauen', { wert: 100 });
    await vorspulen(page, 'winterpause');
    await expect(page.locator('#kopfLage')).toContainText('als Naechstes Winterpause');
    await expect(page.locator('#vorWinter')).toBeDisabled();
    // Vorbereitung, 17 Spieltage, zwei Pokalrunden.
    await expect(page.locator('#lauf')).toContainText('20 Termine in');
    await nachweis(page, {
      spec: KARRIERE,
      ac: 'AC-6',
      titel: 'Bis zur Winterpause am Stueck: der Kopf nennt die Winterpause, daneben Termine und Rechendauer',
      test: info,
    });
  });

  test('karriere AC-9 und vorstand AC-9: Postfach und Vorstand im Buero', async ({ page }, info) => {
    await karriereBeginnen(page);
    await griff(page, 'vertrauen', { wert: 60 });
    await vorspulen(page, 'winterpause');
    await expect.poll(() => page.locator('#postfach .nachricht').count()).toBeGreaterThan(10);
    await expect(page.locator('#postfach')).toContainText('17. Spieltag: ');
    await expect(page.locator('#vorstand')).toContainText('Ziel:');
    await expect(page.locator('#vertrauenWert')).toHaveText(/^\d+$/);
    await nachweis(page, {
      spec: KARRIERE,
      ac: 'AC-9',
      titel: 'Das Postfach nach der Hinrunde: Ergebnisse, Angebote, Sperren, Verletzungen, Pokal',
      test: info,
    });
    await nachweis(page, {
      spec: '15-manager/vorstand.md',
      ac: 'AC-9',
      titel: 'Das Buero zeigt Saisonziel, Zielplatz und das Vertrauen des Vorstands',
      test: info,
    });
  });

  test('oberflaeche AC-14: der Kalender der Saison', async ({ page }, info) => {
    await karriereBeginnen(page);
    await griff(page, 'vertrauen', { wert: 100 });
    await vorspulen(page, 'winterpause');
    await expect(page.locator('#kalender tr')).toHaveCount(42);
    await expect(page.locator('#kalender tr.naechster')).toContainText('Winterpause');
    await expect(page.locator('#kalender tr[data-termin="1"]')).toContainText(/\d+:\d+/);
    await nachweis(page, {
      spec: BEDIENUNG,
      ac: 'AC-14',
      titel: 'Der Kalender mit allen 42 Terminen, Gegnern und Ergebnissen, die Winterpause hervorgehoben',
      test: info,
      ganzeSeite: true,
    });
  });

  test('karriere AC-21, oberflaeche AC-16, manager AC-4 und liga AC-17: die Saison geht weiter', async ({ page }, info) => {
    test.setTimeout(120_000);
    await karriereBeginnen(page);
    await griff(page, 'vertrauen', { wert: 100 });
    await vorspulen(page, 'saisonende');
    await expect(page.locator('#weiter')).toHaveText('Saison abschliessen');
    await weiter(page);
    await expect(page.locator('#weiter')).toHaveText('Saison 2 starten');
    await expect(page.locator('#bilanz')).toContainText('Saison 1 ist vorbei');
    await expect(page.locator('#eigeneBilanz')).toContainText('Ziel war Platz');
    await expect(page.locator('#chronik li')).toHaveCount(1);
    await nachweis(page, {
      spec: BEDIENUNG,
      ac: 'AC-16',
      titel: 'Nach dem Saisonende: Meister, Pokalsieger, Auf- und Absteiger, der eigene Platz gegen das Ziel und die Abschlusstabelle',
      test: info,
    });
    await nachweis(page, {
      spec: '15-manager/spielziel.md',
      ac: 'AC-4',
      titel: 'Die Saison ist vollstaendig abgeschlossen, bevor die naechste beginnt',
      test: info,
    });
    await nachweis(page, {
      spec: KARRIERE,
      ac: 'AC-21',
      titel: 'Saison 2 steht an: der Knopf startet sie, der Kalender beginnt von vorn',
      test: info,
      ganzeSeite: true,
    });
    await nachweis(page, {
      spec: '15-manager/liga.md',
      ac: 'AC-17',
      titel: 'Die Chronik haelt Meister, Pokalsieger und den eigenen Platz jeder Saison',
      test: info,
      ganzeSeite: true,
    });
    await weiter(page);
    await expect(page.locator('#weiter')).toHaveText('Weiter: 1. Spieltag');
  });

  test('oberflaeche AC-11 und oberflaeche AC-10: acht Blaetter, lange Listen scrollen', async ({ page }, info) => {
    await karriereBeginnen(page);
    await expect(page.locator('#reiter .reiterKnopf')).toHaveCount(8);
    for (const name of BLAETTER) {
      await aufBlatt(page, name);
      await expect(page.locator('#inhalt')).not.toBeEmpty();
    }
    await nachweis(page, {
      spec: BEDIENUNG,
      ac: 'AC-11',
      titel: 'Acht Blaetter in der Kopfzeile, hier das Blatt Finanzen',
      test: info,
    });

    await aufBlatt(page, 'transfer');
    await expect(page.locator('[data-kaufen]').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(3 * 950);
    // Scrollen wie ein Mensch - mit dem Rad, nicht mit scrollTo().
    await page.mouse.move(700, 700);
    await page.mouse.wheel(0, 2400);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    await expect(page.locator('#weiter')).toBeInViewport();
    await nachweis(page, {
      spec: BEDIENUNG,
      ac: 'AC-10',
      titel: 'Der Transfermarkt nach dem Scrollen: Kopfzeile und Reiter bleiben stehen, die Liste laeuft darunter',
      test: info,
    });
  });

  test('oberflaeche AC-6: Betraege lesen sich als Zahl', async ({ page }, info) => {
    await karriereBeginnen(page);
    await expect(page.locator('#kopfKonto')).toHaveText(/^\d+,\d Mio$/);
    await aufBlatt(page, 'transfer');
    await expect(page.locator('#markt tbody tr').first()).toBeVisible();
    const forderungen = await page.locator('#markt tbody tr td:nth-child(9)').allTextContents();
    expect(forderungen.length).toBeGreaterThan(10);
    for (const wert of forderungen.slice(0, 40)) expect(wert.trim()).toMatch(/^(\d+,\d Mio|\d+ T)$/);
    await nachweis(page, {
      spec: BEDIENUNG,
      ac: 'AC-6',
      titel: 'Konto, Gehalt, Wert und Forderung in T und Mio statt als Ziffernkette',
      test: info,
    });
  });

  test('oberflaeche AC-9: einmal im Browser gesehen, ohne Fehler', async ({ page }, info) => {
    test.setTimeout(150_000);
    await karriereBeginnen(page);
    await griff(page, 'vertrauen', { wert: 100 });
    await aufBlatt(page, 'mannschaft');
    await page.locator('#abgeben').click();
    await expect(page.locator('#aufstellungStatus')).toContainText('abgegeben');

    await aufBlatt(page, 'transfer');
    await page.locator('#filterLiga').selectOption('frei');
    await expect(page.locator('#markt tbody tr').first()).toContainText('vereinslos');
    await page.locator('[data-kaufen]:not([disabled])').first().click();
    const kauf = page.waitForResponse((r) => r.url().endsWith('/kaufen'));
    await page.locator('#dialog [data-laufzeit="1"]').click();
    expect((await kauf).ok()).toBe(true);

    await tempo(page, 0);
    await vorspulen(page, 'saisonende');
    await weiter(page);
    await expect(page.locator('#weiter')).toHaveText('Saison 2 starten');
    for (const name of BLAETTER) await aufBlatt(page, name);
    await weiter(page);
    await weiter(page);
    await aufBlatt(page, 'buero');
    await nachweis(page, {
      spec: BEDIENUNG,
      ac: 'AC-9',
      titel: 'Eine ganze Saison ueber die Oberflaeche gespielt, bis in die zweite, ohne einen Fehler in der Seite',
      test: info,
    });
  });
});
