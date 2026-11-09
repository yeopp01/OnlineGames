// Vorraum und Anmeldung, im Browser gesehen
// (→ specs/00-plattform/konten.md, raeume.md).
//
// Zwei Browserfenster, zwei Leute: Anna hat ein Konto und eroeffnet, Bert hat
// keines und tritt bei. Die Faelle bauen aufeinander auf und laufen deshalb
// nacheinander - und angemeldet wird im ganzen Lauf genau einmal
// (e2e/helpers/konto.mjs).
//
// Das Spielbild nach dem Start steht in strategie-spielbild.spec.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { KONTO } from '../helpers/konto.mjs';
import { expect, fehlerSammeln, test } from '../helpers/seite.mjs';

const KONTEN = '00-plattform/konten.md';
const RAEUME = '00-plattform/raeume.md';

test.describe('Registrieren', () => {
  test('konten AC-2: registriert wird mit Mail, Kennwort und Anzeigename', async ({ page }, info) => {
    await page.goto('/');
    await page.locator('#reiterRegistrieren').click();
    const maske = page.locator('#formRegistrieren');
    await expect(maske).toBeVisible();
    for (const feld of ['#regEinladung', '#regName', '#regEmail', '#regKennwort']) {
      await expect(maske.locator(feld)).toBeVisible();
    }
    await nachweis(page, {
      spec: KONTEN,
      ac: 'AC-2',
      titel: 'Die Registrierung fragt Einladungscode, Anzeigename, Mailadresse und Kennwort ab',
      test: info,
    });
  });
});

test.describe('Anna eroeffnet, Bert tritt bei', () => {
  test.describe.configure({ mode: 'serial' });

  let anna;
  let bert;
  let raumcode = '';
  const fehler = [];

  test.beforeAll(async ({ browser }, info) => {
    const optionen = { baseURL: info.project.use.baseURL, viewport: { width: 1400, height: 950 }, locale: 'de-DE' };
    anna = await (await browser.newContext(optionen)).newPage();
    bert = await (await browser.newContext(optionen)).newPage();
    fehler.push(fehlerSammeln(anna), fehlerSammeln(bert));
  });

  test.afterAll(async () => {
    expect(fehler.flat(), 'Eine der Seiten hat Fehler gemeldet').toEqual([]);
    await anna?.context().close();
    await bert?.context().close();
  });

  test('konten AC-16: ohne Anmeldung fuehrt Eroeffnen zur Anmeldemaske', async ({}, info) => {
    await anna.goto('/');
    await expect(anna.locator('#abgemeldet')).toBeVisible();
    await expect(anna.locator('#formAnmelden')).toBeVisible();
    await expect(anna.locator('[data-oeffnen="strategie"]')).toBeHidden();
    await nachweis(anna, {
      spec: KONTEN,
      ac: 'AC-16',
      titel: 'Wer nicht angemeldet ist, sieht zum Eroeffnen die Anmeldemaske statt einer Fehlermeldung',
      test: info,
    });

    await anna.locator('#anEmail').fill(KONTO.email);
    await anna.locator('#anKennwort').fill(KONTO.kennwort);
    await anna.locator('#formAnmelden button[type="submit"]').click();
    // Und danach zurueck zum Eroeffnen.
    await expect(anna.locator('[data-oeffnen="strategie"]')).toBeVisible();
  });

  test('konten AC-17: der Anzeigename kommt aus dem Konto', async ({}, info) => {
    await expect(anna.locator('#werName')).toHaveText(KONTO.name);
    await nachweis(anna, {
      spec: KONTEN,
      ac: 'AC-17',
      titel: 'Angemeldet als Anna - zum Eroeffnen fragt niemand nach einem Namen',
      test: info,
    });
  });

  test('konten AC-7: die Sitzung ueberlebt das Neuladen', async ({}, info) => {
    await anna.reload();
    await expect(anna.locator('#angemeldet')).toBeVisible();
    await expect(anna.locator('#werName')).toHaveText(KONTO.name);
    await nachweis(anna, {
      spec: KONTEN,
      ac: 'AC-7',
      titel: 'Nach dem Neuladen ist Anna weiter angemeldet',
      test: info,
    });
  });

  test('raeume AC-1: ein eroeffneter Raum zeigt seinen Code', async ({}, info) => {
    await anna.locator('[data-oeffnen="strategie"]').click();
    await anna.locator('[data-eroeffnen="strategie"]').click();
    await expect(anna.locator('#warteraum')).toBeVisible();
    await expect(anna.locator('#raumcode')).toHaveText(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
    raumcode = (await anna.locator('#raumcode').textContent()).trim();
    // Vorlesbar: keine Vokale, keine 0 und keine 1.
    expect(raumcode).not.toMatch(/[AEIOU01]/);
    await expect(anna.locator('#spielerliste li .name')).toHaveText([`${KONTO.name} (du)`]);
    await nachweis(anna, {
      spec: RAEUME,
      ac: 'AC-1',
      titel: 'Der Warteraum zeigt den Code in zwei Dreiergruppen',
      test: info,
    });
  });

  test('raeume AC-6: allein startet niemand', async ({}, info) => {
    // In einem zweiten Fenster derselben Anmeldung - Annas eigentlicher Raum
    // soll ohne Absage im Bild bleiben, wenn Bert gleich beitritt.
    const allein = await anna.context().newPage();
    // Hoch genug fuer alle Einstellungen und die Absage darunter (Runde 155:
    // seit "Bündnisse" stand sie unter dem Rand).
    await allein.setViewportSize({ width: 1400, height: 1150 });
    fehler.push(fehlerSammeln(allein));
    await allein.goto('/');
    await allein.locator('[data-oeffnen="strategie"]').click();
    await allein.locator('[data-eroeffnen="strategie"]').click();
    await expect(allein.locator('#warteraum')).toBeVisible();

    await allein.locator('#starten').click();
    await expect(allein.locator('#wartemeldung')).toBeVisible();
    await expect(allein.locator('#wartemeldung')).not.toBeEmpty();
    await expect(allein.locator('#wartemeldung')).toBeInViewport({ ratio: 1 });
    await expect(allein.locator('#spiel')).toBeHidden();
    await nachweis(allein, {
      spec: RAEUME,
      ac: 'AC-6',
      titel: 'Allein gestartet: der Warteraum bleibt stehen und nennt den Grund',
      test: info,
    });
    await allein.close();
  });

  test('raeume AC-3: ein unbekannter Code wird abgewiesen', async ({}, info) => {
    await bert.goto('/');
    await bert.locator('#name').fill('Bert');
    // Mit Vokalen - diesen Code kann es nicht geben.
    await bert.locator('#code').fill('AAA-EEE');
    await bert.locator('#beitreten').click();
    await expect(bert.locator('#beitretmeldung')).toHaveText('Diesen Raumcode gibt es nicht.');
    await expect(bert.locator('#warteraum')).toBeHidden();
    await nachweis(bert, {
      spec: RAEUME,
      ac: 'AC-3',
      titel: 'Ein Code, den es nicht gibt, fuehrt zu einer Meldung statt in einen leeren Raum',
      test: info,
    });
  });

  test('raeume AC-15: der Code wird nachsichtig gelesen', async ({}, info) => {
    await bert.goto('/');
    await expect(bert.locator('#name')).toHaveValue('Bert');
    await bert.locator('#code').fill(raumcode.toLowerCase().replace('-', ' '));
    await nachweis(bert, {
      spec: RAEUME,
      ac: 'AC-15',
      titel: 'Der Code klein und mit Leerzeichen eingetippt, unmittelbar vor dem Beitritt',
      test: info,
    });

    await bert.locator('#beitreten').click();
    await expect(bert.locator('#warteraum')).toBeVisible();
    await expect(bert.locator('#raumcode')).toHaveText(raumcode);
  });

  test('konten AC-1: beitreten geht ohne Konto', async ({}, info) => {
    await expect(bert.locator('#spielerliste li .name')).toHaveText([KONTO.name, 'Bert (du)']);
    // Kein Konto, keine Sitzung - und trotzdem im Raum.
    const sitzung = await bert.evaluate(async () => (await fetch('/api/auth/get-session')).json());
    expect(sitzung).toBeNull();
    await nachweis(bert, {
      spec: KONTEN,
      ac: 'AC-1',
      titel: 'Bert ohne Konto im Warteraum - Name und Code haben gereicht',
      test: info,
    });
  });

  test('raeume AC-2: beide sehen dieselbe Spielerliste', async ({}, info) => {
    await expect(anna.locator('#spielerliste li .name')).toHaveText([`${KONTO.name} (du)`, 'Bert']);
    await expect(bert.locator('#spielerliste li .name')).toHaveText([KONTO.name, 'Bert (du)']);
    await nachweis(anna, {
      spec: RAEUME,
      ac: 'AC-2',
      titel: 'Annas Warteraum zeigt Bert, sobald er beigetreten ist',
      test: info,
    });
  });

  test('raeume AC-7: nur der Gastgeber startet', async ({}, info) => {
    await bert.locator('#starten').click();
    await expect(bert.locator('#wartemeldung')).toHaveText('Nur der Gastgeber startet.');
    await expect(bert.locator('#spiel')).toBeHidden();
    await nachweis(bert, {
      spec: RAEUME,
      ac: 'AC-7',
      titel: 'Bert drueckt auf Starten und bekommt eine Absage',
      test: info,
    });
  });
});
