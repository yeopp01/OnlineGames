// Die Uebersicht der Spiele nach dem Anmelden, im Browser gesehen
// (→ specs/00-plattform/spielauswahl.md).
import { createRequire } from 'node:module';
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { ANMELDUNG, expect, fehlerSammeln, test } from '../helpers/seite.mjs';

const AUSWAHL = '00-plattform/spielauswahl.md';
// Die Einstellungen aus dem Steckbrief gelesen, nicht aufgezaehlt: die Liste
// waechst (Runde 101 kam `ki` dazu).
const { einstellungen: STRATEGIE } = createRequire(import.meta.url)('../../server/spiele/strategie/steckbrief.js');

test.describe('Spiel waehlen', () => {
  test.use({ storageState: ANMELDUNG });

  test('auswahl AC-1 und auswahl AC-20: nach dem Anmelden stehen alle Spiele zur Wahl, das Strategiespiel als Fading Allies', async ({ page }, info) => {
    await page.goto('/');
    const karten = page.locator('#spiele .spielkarte');
    await expect(karten).toHaveCount(2);
    await expect(karten.nth(0).locator('strong')).toHaveText('Fading Allies');
    await expect(karten.nth(0).locator('strong')).toBeInViewport();
    await expect(karten.nth(0).locator('.spielerzahl')).toHaveText('2 bis 6 Spieler');
    await expect(karten.nth(1).locator('strong')).toHaveText('Fußballmanager');
    await expect(karten.nth(1).locator('.spielerzahl')).toHaveText('allein');
    for (const satz of await karten.locator('.spielsatz').allTextContents()) expect(satz.length).toBeGreaterThan(20);
    await nachweis(page, {
      spec: AUSWAHL,
      ac: 'AC-1',
      titel: 'Angemeldet: beide Spiele mit Namen, einem Satz und der Spielerzahl',
      test: info,
    });
    await nachweis(page, {
      spec: AUSWAHL,
      ac: 'AC-20',
      titel: 'Die Übersicht nach dem Anmelden: das Strategiespiel steht als „Fading Allies“ auf seiner Karte, daneben der Fußballmanager',
      test: info,
    });
  });

  test('auswahl AC-1: auf einem Laptop erreicht man jede Karte', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/');
    await expect(page.locator('#vorraum h1')).toBeInViewport();
    const letzte = page.locator('[data-oeffnen="manager"]');
    await letzte.scrollIntoViewIfNeeded();
    await expect(letzte).toBeInViewport();
  });

  test('auswahl AC-1: die Karte fuehrt in ihr Spiel', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-oeffnen="manager"]').click();
    await expect(page).toHaveURL(/\/manager\.html$/);

    await page.goto('/');
    await page.locator('[data-oeffnen="strategie"]').click();
    await page.locator('[data-eroeffnen="strategie"]').click();
    await expect(page.locator('#warteraum')).toBeVisible();
  });

  test('auswahl AC-3: im Bau gekennzeichnet, nicht spielbar gesperrt', async ({ page }, info) => {
    // Ein drittes Spiel, das es noch nicht gibt, kommt hier aus der Antwort -
    // die Seite zeigt, was der Server an Steckbriefen liefert (AC-2).
    await page.route('/api/spiele', async (route) => {
      const antwort = await route.fetch();
      const { spiele } = await antwort.json();
      spiele.push({
        art: 'hausbau',
        name: 'Hausbau',
        beschreibung: 'Ein Haus waechst Zimmer um Zimmer, gemeinsam gebaut.',
        spieler: { von: 1, bis: 4 },
        stand: 'gesperrt',
        einstieg: { art: 'raum' },
      });
      await route.fulfill({ response: antwort, json: { spiele } });
    });
    await page.goto('/');
    await expect(page.locator('[data-spiel="strategie"] .marke')).toHaveText('im Bau');
    await expect(page.locator('[data-oeffnen="strategie"]')).toBeEnabled();
    await expect(page.locator('[data-spiel="manager"] .marke')).toHaveCount(0);
    await expect(page.locator('[data-spiel="hausbau"] .marke')).toHaveText('noch nicht spielbar');
    await expect(page.locator('[data-oeffnen="hausbau"]')).toBeDisabled();
    await nachweis(page, {
      spec: AUSWAHL,
      ac: 'AC-3',
      titel: 'Strategie traegt im Bau und laesst sich eroeffnen, ein nicht spielbares Spiel steht gesperrt',
      test: info,
    });
  });

  test('auswahl AC-4: die Seite zeigt die Einstellungen, die das Spiel liefert', async ({ page }, info) => {
    // Ein Spiel mit einer Wahl, die das Strategiespiel nicht hat: die Seite
    // baut das Feld aus der Liste, ohne das Spiel zu kennen.
    await page.route('/api/spiele', async (route) => {
      const antwort = await route.fetch();
      const { spiele } = await antwort.json();
      spiele.push({
        art: 'hausbau',
        name: 'Hausbau',
        beschreibung: 'Ein Haus waechst Zimmer um Zimmer, gemeinsam gebaut.',
        spieler: { von: 1, bis: 4 },
        stand: 'im-bau',
        einstieg: { art: 'raum' },
        einstellungen: [
          { schluessel: 'grundstueck', name: 'Grundstueck', art: 'wahl', vorgabe: 'mittel', werte: [{ wert: 'klein', name: 'klein' }, { wert: 'mittel', name: 'mittel' }, { wert: 'gross', name: 'gross' }] },
          { schluessel: 'stockwerke', name: 'Stockwerke', art: 'zahl', von: 1, bis: 3, vorgabe: 2 },
        ],
      });
      await route.fulfill({ response: antwort, json: { spiele } });
    });
    // Hoch genug, dass beide Formulare ganz im Bild stehen - mit jeder neuen
    // Einstellung des Strategiespiels waechst es (Runde 155: seit
    // "Bündnisse" stand das zweite unter dem Rand, und kein Test sagte es;
    // seit dem Vorraum fuer den PC, AC-23, stehen die Felder in Spalten).
    await page.setViewportSize({ width: 1400, height: 1200 });
    await page.goto('/');
    await page.locator('[data-oeffnen="strategie"]').click();
    const strategie = page.locator('[data-einstellungen-fuer="strategie"]');
    await expect(strategie.locator('[data-einstellung]')).toHaveCount(STRATEGIE.length);
    await expect(strategie.locator('[data-einstellung="spieler"]')).toHaveValue('6');
    await expect(strategie.locator('[data-einstellung="spieler"]')).toHaveAttribute('max', '6');
    await expect(strategie.locator('[data-einstellung="startwert"]')).toHaveAttribute('placeholder', 'zufällig');

    await page.locator('[data-oeffnen="hausbau"]').click();
    const hausbau = page.locator('[data-einstellungen-fuer="hausbau"]');
    await expect(hausbau.locator('select[data-einstellung="grundstueck"] option')).toHaveText(['klein', 'mittel', 'gross']);
    await expect(hausbau.locator('select[data-einstellung="grundstueck"]')).toHaveValue('"mittel"');
    await expect(hausbau.locator('[data-einstellung="stockwerke"]')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('[data-eroeffnen="hausbau"]')).toBeInViewport({ ratio: 1 });
    await nachweis(page, {
      spec: AUSWAHL,
      ac: 'AC-4',
      titel: 'Zwei Spiele, zwei Formulare - beide aus der Liste gebaut, die das Spiel liefert',
      test: info,
    });
  });

  test('auswahl AC-5: ohne etwas anzufassen eroeffnet, mit den Vorgaben im Raum', async ({ page }, info) => {
    await page.goto('/');
    await page.locator('[data-oeffnen="strategie"]').click();
    await expect(page.locator('[data-einstellung="spieler"]')).toHaveValue('6');
    await expect(page.locator('[data-einstellung="startwert"]')).toHaveValue('');
    await nachweis(page, {
      spec: AUSWAHL,
      ac: 'AC-5',
      titel: 'Die Einstellungen offen und mit Vorgaben gefuellt - ein Klick auf Partie eroeffnen genuegt',
      test: info,
    });
    await page.locator('[data-eroeffnen="strategie"]').click();
    await expect(page.locator('#warteraum')).toBeVisible();
    await expect(page.locator('#raumcode')).toHaveText(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  });

  test('auswahl AC-6 und auswahl AC-21: Spielerzahl, Startwert, Kartengroesse und Startvorrat stellt man vor dem Eroeffnen ein', async ({ page }, info) => {
    // Hoch genug fuer das ganze Formular samt Knopf: es waechst mit jeder
    // Einstellung (Runde 148 kam "Buendnisse" dazu, auswahl AC-22).
    await page.setViewportSize({ width: 1400, height: 1250 });
    await page.goto('/');
    await page.locator('[data-oeffnen="strategie"]').click();
    const form = page.locator('[data-einstellungen-fuer="strategie"]');
    await form.locator('[data-einstellung="spieler"]').fill('4');
    await form.locator('[data-einstellung="startwert"]').fill('4711');
    await form.locator('[data-einstellung="kartengroesse"]').selectOption({ label: 'groß' });
    await form.locator('[data-einstellung="vorrat"]').selectOption({ label: 'viel (je 1000)' });
    await expect(form.locator('[data-eroeffnen="strategie"]')).toBeInViewport();
    await nachweis(page, {
      spec: AUSWAHL,
      ac: 'AC-6',
      titel: 'Die Einstellungen des Strategiespiels gesetzt: vier Spieler, Karte 4711, groß, viel Startvorrat',
      test: info,
    });
    // Was das zweite Bild behauptet, steht so im Formular - mit Umlauten.
    await expect(form).toContainText('Höchstens Spieler');
    await expect(form).toContainText('Kartengröße');
    await expect(form.locator('[data-einstellung="kartengroesse"] option:checked')).toHaveText('groß');
    await expect(form.locator('[data-eroeffnen="strategie"]')).toHaveText('Partie eröffnen');
    await nachweis(page, {
      spec: AUSWAHL,
      ac: 'AC-21',
      titel: 'Das Formular zum Eröffnen mit echten Umlauten: „Höchstens Spieler“, „Kartengröße“, „groß“ und der Knopf „Partie eröffnen“',
      test: info,
    });
    await form.locator('[data-eroeffnen="strategie"]').click();
    // Im Warteraum stehen sie so, wie sie eingestellt wurden.
    await expect(page.locator('#raumEinstellungen [data-einstellung="kartengroesse"]')).toHaveValue('"gross"');
    await expect(page.locator('#raumEinstellungen [data-einstellung="vorrat"]')).toHaveValue('"viel"');
  });

  test('auswahl AC-8: ein unsinniger Startwert kommt als Satz vom Server zurueck', async ({ page }, info) => {
    await page.goto('/');
    await page.locator('[data-oeffnen="strategie"]').click();
    await page.locator('[data-einstellung="startwert"]').fill('meine Lieblingskarte');
    await page.locator('[data-eroeffnen="strategie"]').click();
    const absage = page.locator('[data-einstellungen-fuer="strategie"] .meldung');
    await expect(absage).toHaveText(/Startwert der Karte: eine ganze Zahl von 0 bis 999999999/);
    await expect(absage).toBeInViewport();
    await expect(page.locator('#warteraum')).toBeHidden();
    await nachweis(page, {
      spec: AUSWAHL,
      ac: 'AC-8',
      titel: 'Startwert mit Buchstaben: der Server weist ab, die Seite nennt den Grund, kein Raum entsteht',
      test: info,
    });
  });
});

test.describe('Im Warteraum', () => {
  test.describe.configure({ mode: 'serial' });

  let anna;
  let bert;
  const fehler = [];

  test.beforeAll(async ({ browser }, info) => {
    const optionen = { baseURL: info.project.use.baseURL, viewport: { width: 1400, height: 950 }, locale: 'de-DE' };
    const annasFenster = await browser.newContext({ ...optionen, storageState: ANMELDUNG });
    await annasFenster.grantPermissions(['clipboard-read', 'clipboard-write']);
    anna = await annasFenster.newPage();
    bert = await (await browser.newContext(optionen)).newPage();
    fehler.push(fehlerSammeln(anna), fehlerSammeln(bert));

    await anna.goto('/');
    await anna.locator('[data-oeffnen="strategie"]').click();
    await anna.locator('[data-einstellung="spieler"]').fill('4');
    await anna.locator('[data-einstellung="startwert"]').fill('4711');
    await anna.locator('[data-eroeffnen="strategie"]').click();
    await expect(anna.locator('#raumcode')).toHaveText(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  });

  test.afterAll(async () => {
    expect(fehler.flat(), 'Eine der Seiten hat Fehler gemeldet').toEqual([]);
    await anna?.context().close();
    await bert?.context().close();
  });

  test('auswahl AC-13: der Code steht sofort da und laesst sich kopieren', async ({}, info) => {
    const code = (await anna.locator('#raumcode').textContent()).trim();
    await anna.locator('#codeKopieren').click();
    await expect(anna.locator('#codeKopieren')).toHaveText('kopiert');
    expect(await anna.evaluate(() => navigator.clipboard.readText())).toBe(code);
    await nachweis(anna, {
      spec: AUSWAHL,
      ac: 'AC-13',
      titel: 'Gleich nach dem Eroeffnen: der Code oben, daneben der Knopf, der ihn kopiert hat',
      test: info,
    });
  });

  test('auswahl AC-9: wer beitritt, sieht vor dem Start, worauf er sich einlaesst', async ({}, info) => {
    const code = (await anna.locator('#raumcode').textContent()).trim();
    await bert.goto('/');
    await bert.locator('#name').fill('Bert');
    await bert.locator('#code').fill(code);
    await bert.locator('#beitreten').click();
    await expect(bert.locator('#warteraum')).toBeVisible();
    await expect(bert.locator('#raumEinstellungen dt')).toHaveText(STRATEGIE.map((e) => e.name));
    await expect(bert.locator('[data-wert="spieler"]')).toHaveText('4');
    await expect(bert.locator('[data-wert="startwert"]')).toHaveText('4711');
    // Bert hat keine Felder, nur Werte.
    await expect(bert.locator('#raumEinstellungen input')).toHaveCount(0);
    await nachweis(bert, {
      spec: AUSWAHL,
      ac: 'AC-9',
      titel: 'Bert im Warteraum: hoechstens vier Spieler, Startwert 4711 - zu lesen, nicht zu aendern',
      test: info,
    });
  });

  test('auswahl AC-10: der Gastgeber aendert, der Mitspieler sieht es sofort', async ({}, info) => {
    await expect(anna.locator('#raumEinstellungen [data-einstellung="spieler"]')).toHaveValue('4');
    await anna.locator('#raumEinstellungen [data-einstellung="spieler"]').fill('3');
    await anna.locator('#raumEinstellungen [data-einstellung="startwert"]').fill('');
    await anna.locator('#raumEinstellungen [data-einstellung="startwert"]').press('Tab');
    await expect(bert.locator('[data-wert="spieler"]')).toHaveText('3');
    await expect(bert.locator('[data-wert="startwert"]')).toHaveText('zufällig');
    await nachweis(anna, {
      spec: AUSWAHL,
      ac: 'AC-10',
      titel: 'Anna als Gastgeberin: die Einstellungen als Felder, auf drei Spieler und zufaellige Karte umgestellt',
      test: info,
    });
    await nachweis(bert, {
      spec: AUSWAHL,
      ac: 'AC-10',
      titel: 'Bei Bert steht die Aenderung sofort: drei Spieler, zufaellige Karte',
      test: info,
    });

    // Unter die Zahl der Anwesenden geht es nicht - die Absage steht im Raum.
    await anna.locator('#raumEinstellungen [data-einstellung="spieler"]').fill('1');
    await anna.locator('#raumEinstellungen [data-einstellung="spieler"]').press('Tab');
    await expect(anna.locator('#wartemeldung')).toContainText('Höchstens Spieler');
    await expect(bert.locator('[data-wert="spieler"]')).toHaveText('3');
  });
});

// Allein gegen die KI (spielauswahl AC-18, AC-19, Runde 101): eroeffnet mit
// einem KI-Gegner, im Warteraum steht er, und gestartet wird ohne Mitspieler.
test.describe('Gegen die KI', () => {
  test.use({ storageState: ANMELDUNG });

  test('auswahl AC-18 und auswahl AC-19: mit einem KI-Gegner eroeffnet, steht er im Warteraum, und allein gestartet spielt die Partie', async ({ page }, info) => {
    const fehler = fehlerSammeln(page);
    await page.goto('/');
    await page.locator('[data-oeffnen="strategie"]').click();
    const form = page.locator('[data-einstellungen-fuer="strategie"]');
    await form.locator('[data-einstellung="ki"]').fill('1');
    await page.locator('[data-eroeffnen="strategie"]').click();
    await expect(page.locator('#warteraum')).toBeVisible();
    // Was die Unterschrift behauptet: der Wert im Warteraum, und Anna allein.
    await expect(page.locator('#raumEinstellungen [data-einstellung="ki"]')).toHaveValue('1');
    await expect(page.locator('#raumEinstellungen [data-einstellung="ki"]')).toBeInViewport();
    await expect(page.locator('#starten')).toBeInViewport();
    await nachweis(page, {
      spec: AUSWAHL,
      ac: 'AC-18',
      titel: 'Im Warteraum steht „KI-Gegner: 1“ unter den Einstellungen, Anna ist allein und kann starten',
      test: info,
    });

    // Allein gestartet - die Untergrenze von zwei gilt fuer Plaetze.
    await page.locator('#starten').click();
    await expect(page.locator('#brett')).toBeVisible();
    await page.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    const lage = await page.evaluate(() => {
      const a = window.ansicht;
      return { spieler: [...a.spieler.values()].map((s) => s.name), fremde: [...a.nachher.values()].filter((e) => e.b !== a.ich).length };
    });
    expect(lage.spieler, 'zwei am Tisch: Anna und die KI').toHaveLength(2);
    expect(lage.spieler).toContain('KI 1');
    // Im Nebel kommt von der KI nichts an, bis man sie sieht (kampf AC-13,
    // Runde 110) - dass sie spielt, zeigt fahrplan AC-12 bis zur Tafel.
    expect(lage.fremde, 'von der KI nichts im Nebel').toBe(0);
    await expect(page.locator('#uebersicht')).toBeInViewport();
    await nachweis(page, {
      spec: AUSWAHL,
      ac: 'AC-19',
      titel: 'Allein gegen die KI gestartet: das eigene Dorf im Bild, der Rest der Karte noch im Nebel — auch auf der Übersichtskarte unten rechts',
      test: info,
    });
    expect(fehler).toEqual([]);
  });
});

// Gespielt wird am PC (spielauswahl AC-23): 1366 x 768 ist der kleinste
// uebliche Bildschirm, und dort steht alles ohne Rollen im Fenster.
test.describe('Am PC', () => {
  const PC = { width: 1366, height: 768 };

  // Rollt die Seite? Dann steht etwas unter dem Rand, egal was.
  const rollt = (page) => page.evaluate(() => document.scrollingElement.scrollHeight > window.innerHeight + 1);

  // Zwei Kaesten nebeneinander: der linke endet, bevor der rechte beginnt,
  // und beide beginnen auf derselben Hoehe.
  async function nebeneinander(links, rechts) {
    const a = await links.boundingBox();
    const b = await rechts.boundingBox();
    expect(a.x + a.width, 'links endet vor rechts').toBeLessThanOrEqual(b.x);
    expect(Math.abs(a.y - b.y), 'gleiche Hoehe').toBeLessThan(4);
  }

  test('auswahl AC-23: abgemeldet stehen Mitspielen und Anmelden nebeneinander, alles ohne Rollen im Fenster', async ({ page }, info) => {
    await page.setViewportSize(PC);
    await page.goto('/');
    await expect(page.locator('#formAnmelden')).toBeVisible();
    await nebeneinander(page.locator('.mitspielen'), page.locator('#eroeffnen-block'));
    for (const teil of ['#vorraum h1', '#name', '#code', '#beitreten', '#anEmail', '#anKennwort', '#formAnmelden button[type="submit"]']) {
      await expect(page.locator(teil), teil).toBeInViewport({ ratio: 1 });
    }
    expect(await rollt(page), 'die Seite rollt nicht').toBe(false);
    await nachweis(page, {
      spec: AUSWAHL,
      ac: 'AC-23',
      titel: 'Abgemeldet auf 1366 x 768: Mitspielen links, Anmelden rechts, alles im Fenster',
      test: info,
    });

    // Die laengste Maske: Registrieren mit vier Feldern.
    await page.locator('#reiterRegistrieren').click();
    for (const teil of ['#regEinladung', '#regName', '#regEmail', '#regKennwort', '#formRegistrieren button[type="submit"]']) {
      await expect(page.locator(teil), teil).toBeInViewport({ ratio: 1 });
    }
    expect(await rollt(page), 'auch Registrieren rollt nicht').toBe(false);
  });

  test.describe('angemeldet', () => {
    test.use({ storageState: ANMELDUNG });

    test('auswahl AC-23: angemeldet stehen die Einstellungen von Fading Allies in Spalten, samt Knopf im Fenster', async ({ page }, info) => {
      await page.setViewportSize(PC);
      await page.goto('/');
      await expect(page.locator('#angemeldet')).toBeVisible();
      await nebeneinander(page.locator('.mitspielen'), page.locator('#eroeffnen-block'));
      // Zugeklappt stehen alle Karten nebeneinander im Fenster. Aufgeklappt
      // bekommt Fading Allies die ganze Breite, und die anderen Karten
      // duerfen darunter rutschen - wer aufklappt, hat gewaehlt.
      for (const knopf of await page.locator('[data-oeffnen]').all()) await expect(knopf).toBeInViewport({ ratio: 1 });
      expect(await rollt(page), 'zugeklappt rollt die Seite nicht').toBe(false);
      await page.locator('[data-oeffnen="strategie"]').click();
      const form = page.locator('[data-einstellungen-fuer="strategie"]');
      // Jede Einstellung, die der Steckbrief nennt - die Liste waechst.
      const felder = form.locator('[data-einstellung]');
      await expect(felder).toHaveCount(STRATEGIE.length);
      for (let i = 0; i < STRATEGIE.length; i += 1) await expect(felder.nth(i)).toBeInViewport({ ratio: 1 });
      await expect(page.locator('[data-eroeffnen="strategie"]')).toBeInViewport({ ratio: 1 });
      const spalten = new Set(await felder.evaluateAll((liste) => liste.map((f) => Math.round(f.getBoundingClientRect().left))));
      expect(spalten.size, 'mindestens drei Spalten').toBeGreaterThanOrEqual(3);
      await nachweis(page, {
        spec: AUSWAHL,
        ac: 'AC-23',
        titel: 'Angemeldet auf 1366 x 768: die Einstellungen von Fading Allies in drei Spalten, „Partie eröffnen“ im Fenster',
        test: info,
      });
    });
  });

  // Jede neue Einstellung verlaengert auch den Warteraum. In Runde 157 stand
  // mit der siebten "Partie starten" unter dem Bildrand, und erst der volle
  // Lauf fand es - zwei Bildnachweise, deren Test den Knopf sehen will
  // (Rueckschau nach Runde 158). Hier steht es in Sekunden fest, fuer jede
  // Einstellung, die der Steckbrief nennt.
  test('auswahl AC-23: im Warteraum stehen alle Einstellungen und „Partie starten“ auf 1366 x 768 im Fenster', async ({ browser }, info) => {
    const optionen = { baseURL: info.project.use.baseURL, viewport: PC, locale: 'de-DE' };
    const anna = await (await browser.newContext({ ...optionen, storageState: ANMELDUNG })).newPage();
    const bert = await (await browser.newContext(optionen)).newPage();
    const fehler = [fehlerSammeln(anna), fehlerSammeln(bert)];
    try {
      await anna.goto('/');
      await anna.locator('[data-oeffnen="strategie"]').click();
      await anna.locator('[data-eroeffnen="strategie"]').click();
      await expect(anna.locator('#raumcode')).toHaveText(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
      const code = (await anna.locator('#raumcode').textContent()).trim();
      await bert.goto('/');
      await bert.locator('#name').fill('Bert');
      await bert.locator('#code').fill(code);
      await bert.locator('#beitreten').click();
      await expect(anna.locator('#spielerliste')).toContainText('Bert');

      // Die Gastgeberin: jedes Feld und der Knopf ganz im Fenster.
      const felder = anna.locator('#einstellungsliste [data-einstellung]');
      await expect(felder).toHaveCount(STRATEGIE.length);
      for (let i = 0; i < STRATEGIE.length; i += 1) await expect(felder.nth(i)).toBeInViewport({ ratio: 1 });
      await expect(anna.locator('#starten')).toBeInViewport({ ratio: 1 });
      const spalten = new Set(await felder.evaluateAll((liste) => liste.map((f) => Math.round(f.getBoundingClientRect().left))));
      expect(spalten.size, 'mindestens drei Spalten').toBeGreaterThanOrEqual(3);
      expect(await rollt(anna), 'der Warteraum der Gastgeberin rollt nicht').toBe(false);

      // Der Gast liest die Werte - jeder steht im Fenster, und der Knopf auch.
      const werte = bert.locator('#einstellungsliste dd[data-wert]');
      await expect(werte).toHaveCount(STRATEGIE.length);
      for (let i = 0; i < STRATEGIE.length; i += 1) await expect(werte.nth(i)).toBeInViewport({ ratio: 1 });
      await expect(bert.locator('#starten')).toBeInViewport({ ratio: 1 });
      expect(await rollt(bert), 'der Warteraum des Gastes rollt nicht').toBe(false);
      expect(fehler.flat(), 'keine Fehler auf den Seiten').toEqual([]);
    } finally {
      await anna.context().close();
      await bert.context().close();
    }
  });

  test('auswahl AC-23: Enter im Code tritt bei', async ({ browser }, info) => {
    const optionen = { baseURL: info.project.use.baseURL, viewport: PC, locale: 'de-DE' };
    const anna = await (await browser.newContext({ ...optionen, storageState: ANMELDUNG })).newPage();
    const bert = await (await browser.newContext(optionen)).newPage();
    const fehler = [fehlerSammeln(anna), fehlerSammeln(bert)];
    try {
      await anna.goto('/');
      await anna.locator('[data-oeffnen="strategie"]').click();
      await anna.locator('[data-eroeffnen="strategie"]').click();
      await expect(anna.locator('#raumcode')).toHaveText(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
      const code = (await anna.locator('#raumcode').textContent()).trim();

      await bert.goto('/');
      await bert.locator('#name').fill('Bert');
      await bert.locator('#code').fill(code);
      await bert.locator('#code').press('Enter');
      await expect(bert.locator('#warteraum')).toBeVisible();
      await expect(anna.locator('#spielerliste')).toContainText('Bert');
      expect(fehler.flat(), 'keine Fehler auf den Seiten').toEqual([]);
    } finally {
      await anna.context().close();
      await bert.context().close();
    }
  });
});
