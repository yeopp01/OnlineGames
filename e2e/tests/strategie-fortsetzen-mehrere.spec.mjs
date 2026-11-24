// Zu mehreren aufhoeren und spaeter weiterspielen (→ specs/00-plattform/
// speichern.md AC-22 bis AC-25; S4 nach ADR-0017): gesichert wird erst, wenn
// alle einverstanden sind; der Stand liegt bei der Gastgeberin, wer mit Konto
// mitspielte, sieht die Einladung im Vorraum; der Warteraum zeigt die Plaetze
// von damals, und fehlt nur noch einer, legt die Gastgeberin ihn still.
//
// Was der Server dabei tut (wer zaehlt, wem der Stand gehoert, wer welchen
// Platz zurueckbekommt, was an der Zeile steht), belegt
// tests/speichern-zu-mehreren.test.mjs - hier steht, was man davon sieht.
//
// Anna eroeffnet mit ihrem Konto, Dora spielt mit dem zweiten Konto des
// Browserlaufs mit, Bert ohne Konto. Die Faelle bauen aufeinander auf.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { ZWEITES_KONTO } from '../helpers/konto.mjs';
import { ANMELDUNG, expect, fehlerSammeln, staendeSchalten, test } from '../helpers/seite.mjs';
import { bedienteileFrei, haeuserSetzen } from '../helpers/strategie.mjs';

const SPEICHERN = '00-plattform/speichern.md';

async function griffStaende(playwright, werte) {
  const anfrage = await playwright.request.newContext();
  try {
    return await staendeSchalten(anfrage, werte);
  } finally {
    await anfrage.dispose();
  }
}

const OPTIONEN = (info) => ({ baseURL: info.project.use.baseURL, viewport: { width: 1400, height: 950 }, locale: 'de-DE' });

/** Ein Fenster im Vorraum - mit Annas Sitzung, mit Doras Konto oder ohne. */
async function fenster(browser, info, wer) {
  const kontext = await browser.newContext({ ...OPTIONEN(info), ...(wer === 'anna' ? { storageState: ANMELDUNG } : {}) });
  const seite = await kontext.newPage();
  const fehler = fehlerSammeln(seite);
  if (wer === 'dora') {
    // Angemeldet wie im Formular, nur ohne es - derselbe Weg zum Server.
    const antwort = await seite.request.post('/api/auth/sign-in/email', {
      data: { email: ZWEITES_KONTO.email, password: ZWEITES_KONTO.kennwort },
      headers: { Origin: info.project.use.baseURL },
    });
    expect(antwort.ok(), `Dora angemeldet: HTTP ${antwort.status()}`).toBe(true);
  }
  await seite.goto('/');
  await expect(seite.locator(wer === 'bert' ? '#abgemeldet' : '#angemeldet')).toBeVisible();
  return { kontext, seite, fehler };
}

async function beitreten(seite, name, code) {
  await seite.locator('#name').fill(name);
  await seite.locator('#code').fill(code);
  await seite.locator('#beitreten').click();
  await expect(seite.locator('#warteraum')).toBeVisible();
}

async function imSpiel(seite) {
  await expect(seite.locator('#brett')).toBeVisible();
  await seite.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0 && window.ansicht.gebaeude.size > 0);
}

const menschen = (seite) => seite.locator('#spielerliste li:not(.vom-spiel)');
const zeile = (seite, name) => menschen(seite).filter({ has: seite.locator('.name', { hasText: new RegExp(`^${name}( \\(du\\))?$`) }) });

test.describe('Zu mehreren aufhoeren und spaeter weiterspielen', () => {
  test.describe.configure({ mode: 'serial' });
  let anna;
  let dora;
  let bert;
  let bertsPlatz;

  test.beforeAll(async ({ playwright }) => {
    await griffStaende(playwright, { an: true, leeren: true, jeKonto: 5 });
  });
  test.afterAll(async ({ playwright }) => {
    for (const f of [anna, dora, bert]) {
      if (!f) continue;
      expect(f.fehler, 'Die Seite hat Fehler gemeldet').toEqual([]);
      await f.kontext.close();
    }
    await griffStaende(playwright, { an: false, leeren: true, jeKonto: 5 });
  });

  test('speichern AC-22: zu mehreren wird erst gesichert, wenn alle einverstanden sind - jeder sieht, wer vorschlug und auf wen gewartet wird', async ({ browser }, info) => {
    test.setTimeout(150_000);
    anna = await fenster(browser, info, 'anna');
    dora = await fenster(browser, info, 'dora');
    bert = await fenster(browser, info, 'bert');

    await anna.seite.locator('[data-oeffnen="strategie"]').click();
    await anna.seite.locator('[data-einstellung="startwert"]').fill('4711');
    await anna.seite.locator('[data-einstellung="sicht"]').selectOption(JSON.stringify('aufgedeckt'));
    await anna.seite.locator('[data-eroeffnen="strategie"]').click();
    await expect(anna.seite.locator('#raumcode')).toHaveText(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
    const code = (await anna.seite.locator('#raumcode').textContent()).trim();
    await beitreten(dora.seite, 'Dora', code);
    await expect(menschen(anna.seite)).toHaveCount(2);
    await beitreten(bert.seite, 'Bert', code);
    await expect(menschen(anna.seite)).toHaveCount(3);
    bertsPlatz = await zeile(anna.seite, 'Bert').getAttribute('data-platz');
    await haeuserSetzen(anna.seite);
    await anna.seite.locator('#starten').click();
    for (const f of [anna, dora, bert]) await imSpiel(f.seite);

    // Den Knopf hat jeder, nicht nur die Gastgeberin.
    for (const f of [anna, dora, bert]) await expect(f.seite.locator('#aufhoeren')).toBeVisible();
    await anna.seite.locator('#aufhoeren').click();

    // Anna hat vorgeschlagen: alle sehen das Feld, gewartet wird auf die zwei.
    await expect(anna.seite.locator('#aufhoerWer')).toHaveText('Du möchtest aufhören und später weiterspielen.');
    await expect(anna.seite.locator('#aufhoerenJa')).toBeHidden();
    await expect(anna.seite.locator('#aufhoerenNein')).toHaveText('Doch weiterspielen');
    for (const f of [dora, bert]) {
      await expect(f.seite.locator('#aufhoerfeld')).toBeVisible();
      await expect(f.seite.locator('#aufhoerWer')).toHaveText('Anna möchte aufhören und später weiterspielen.');
      await expect(f.seite.locator('#aufhoerFehlen')).toHaveText('Gesichert wird, wenn alle einverstanden sind. Warten auf: Dora, Bert.');
    }

    // Bert sagt nein: nichts gesichert, alle spielen weiter und sehen, warum.
    await bert.seite.locator('#aufhoerenNein').click();
    for (const f of [anna, dora, bert]) {
      await expect(f.seite.locator('#aufhoerfeld')).toBeHidden();
      await expect(f.seite.locator('#spielmeldung')).toHaveText('Bert will weiterspielen – es wird nicht aufgehört.');
    }

    // Noch einmal - Dora ist einverstanden, Bert hat noch nicht geantwortet.
    await expect(anna.seite.locator('#aufhoeren')).toBeEnabled();
    await anna.seite.locator('#aufhoeren').click();
    await expect(dora.seite.locator('#aufhoerfeld')).toBeVisible();
    await dora.seite.locator('#aufhoerenJa').click();
    await expect(bert.seite.locator('#aufhoerFehlen')).toHaveText('Gesichert wird, wenn alle einverstanden sind. Warten auf: Bert.');
    await expect(bert.seite.locator('#aufhoerenJa')).toBeVisible();
    await expect(dora.seite.locator('#aufhoerenJa')).toBeHidden();
    // Die Partie laeuft, solange gefragt wird - das Feld liegt auf keinem Bedienteil.
    expect(await bedienteileFrei(bert.seite)).toEqual([]);
    // Die Meldung von Berts Nein ist verklungen - im Bild steht nur die neue Frage.
    await expect(bert.seite.locator('#spielmeldung')).toBeHidden();
    await nachweis(bert.seite, {
      spec: SPEICHERN,
      ac: 'AC-22',
      titel: 'Bei Bert, ohne Konto: mitten im Bild Anna moechte aufhoeren und spaeter weiterspielen, Dora ist einverstanden, gewartet wird auf Bert - Weiterspielen und Einverstanden',
      test: info,
    });

    await bert.seite.locator('#aufhoerenJa').click();
    for (const f of [anna, dora, bert]) await expect(f.seite.locator('#vorraum')).toBeVisible({ timeout: 15_000 });
    await expect(anna.seite.locator('#partienMeldung')).toHaveText('Gesichert. Weiter geht es hier, wann ihr wollt – die anderen bekommen beim Fortsetzen einen neuen Code.');
    await expect(anna.seite.locator('#partienliste li[data-partie]')).toHaveCount(1);
    for (const f of [dora, bert]) {
      await expect(f.seite.locator('#einladungSatz')).toHaveText('Gesichert bei Anna. Setzt Anna die Partie fort, bekommst du einen neuen Code.');
    }
    // Der Stand liegt nur bei Anna (AC-23): Dora hat keine Liste.
    await expect(dora.seite.locator('#partien')).toBeHidden();
  });

  test('speichern AC-24: der Warteraum der fortgesetzten Partie zeigt die Plaetze von damals und wer noch fehlt', async ({}, info) => {
    test.setTimeout(90_000);
    await anna.seite.locator('#partienliste li[data-partie]').first().locator('[data-fortsetzen]').click();
    await expect(anna.seite.locator('#warteraum')).toBeVisible();
    await expect(anna.seite.locator('#starten')).toHaveText('Partie fortsetzen');
    await expect(menschen(anna.seite)).toHaveCount(3);
    for (const name of ['Dora', 'Bert']) await expect(zeile(anna.seite, name).locator('.platzlage')).toHaveText('fehlt noch');
    await expect(anna.seite.locator('#fortsetzungHinweis')).toHaveText('Eine gesicherte Partie: wer damals mitspielte, kommt mit seinem Konto oder seinem Namen an seinen Platz zurück. Es fehlen noch: Dora, Bert.');
    // Zwei fehlen: noch nichts stillzulegen (AC-25).
    await expect(anna.seite.locator('[data-stilllegen]')).toHaveCount(0);
    // Die Wahl je Platz steht fest: Marken, keine Felder.
    await expect(anna.seite.locator('span.platzwahl[data-wahl]')).toHaveCount(6);
    await expect(anna.seite.locator('select[data-wahl], input[data-wahl]')).toHaveCount(0);
    await nachweis(anna.seite, {
      spec: SPEICHERN,
      ac: 'AC-24',
      titel: 'Anna setzt fort: der Warteraum zeigt Anna, Dora und Bert von damals, Dora und Bert fehlen noch, darunter wer zurueckkommt, der Knopf heisst Partie fortsetzen',
      test: info,
    });
  });

  test('speichern AC-23: wer mit Konto mitspielte, sieht im Vorraum die Einladung mit dem neuen Code', async ({}, info) => {
    test.setTimeout(60_000);
    const code = (await anna.seite.locator('#raumcode').textContent()).trim();
    // Gefragt wird alle zehn Sekunden - ein Neuladen fragt sofort.
    await dora.seite.reload();
    await expect(dora.seite.locator('#einladungsliste li')).toHaveCount(1);
    await expect(dora.seite.locator('#einladungsliste li span')).toHaveText(`Anna setzt eure Partie fort – Raum ${code}.`);
    await expect(dora.seite.locator('[data-einladung]')).toHaveText('Beitreten');
    // Bert ohne Konto bekommt keine - ihm sagt Anna den Code.
    await bert.seite.reload();
    await expect(bert.seite.locator('#einladungen')).toBeHidden();
    await nachweis(dora.seite, {
      spec: SPEICHERN,
      ac: 'AC-23',
      titel: 'Doras Vorraum, angemeldet: oben Anna setzt eure Partie fort mit dem neuen Raumcode und Beitreten - der Stand liegt bei Anna, Dora hat keine eigene Liste',
      test: info,
    });

    await dora.seite.locator('[data-einladung]').click();
    await expect(dora.seite.locator('#warteraum')).toBeVisible();
    await expect(zeile(anna.seite, 'Dora').locator('.platzlage')).toHaveCount(0);
    await expect(zeile(dora.seite, 'Dora')).toHaveText(/Dora \(du\)/);
  });

  test('speichern AC-25: fehlt nur noch Bert, legt Anna seinen Platz still - die Partie laeuft, seine Einheiten bleiben stehen', async ({}, info) => {
    test.setTimeout(120_000);
    const knopf = zeile(anna.seite, 'Bert').locator('[data-stilllegen]');
    await expect(knopf).toHaveText('Stilllegen');
    await expect(anna.seite.locator('#fortsetzungHinweis')).toHaveText(/Es fehlen noch: Bert\. Kommt niemand mehr, kannst du den Platz stilllegen\.$/);
    // Nur die Gastgeberin hat den Knopf.
    await expect(dora.seite.locator('[data-stilllegen]')).toHaveCount(0);
    await knopf.click();
    await expect(zeile(anna.seite, 'Bert').locator('.platzlage')).toHaveText('stillgelegt – seine Einheiten bleiben stehen');
    await expect(zeile(anna.seite, 'Bert')).toHaveClass(/stillgelegt/);
    await expect(zeile(dora.seite, 'Bert').locator('.platzlage')).toHaveText('stillgelegt – seine Einheiten bleiben stehen');
    await expect(anna.seite.locator('[data-stilllegen]')).toHaveText('Doch warten');
    await nachweis(anna.seite, {
      spec: SPEICHERN,
      ac: 'AC-25',
      titel: 'Anna hat Berts Platz stillgelegt: Bert durchgestrichen, daneben stillgelegt - seine Einheiten bleiben stehen, und Doch warten',
      test: info,
    });

    await anna.seite.locator('#starten').click();
    for (const f of [anna, dora]) await imSpiel(f.seite);
    await expect(anna.seite.locator('#pausefeld')).toBeVisible();
    await anna.seite.locator('#pauseWeiter').click();
    await expect(anna.seite.locator('#pausefeld')).toBeHidden();
    // Berts Dorf steht noch: seine Einheiten und Gebaeude sind auf der Karte.
    const berts = await anna.seite.evaluate((platz) => ({
      einheiten: [...window.ansicht.nachher.values()].filter((e) => e.b === platz || e.besitzer === platz).length,
      gebaeude: [...window.ansicht.gebaeude.values()].filter((g) => g.b === platz || g.besitzer === platz).length,
    }), bertsPlatz);
    expect(berts.einheiten, 'Berts Einheiten stehen noch').toBeGreaterThan(0);
    expect(berts.gebaeude, 'Berts Dorfzentrum steht noch').toBeGreaterThan(0);
    const takt = await anna.seite.evaluate(() => window.ansicht.takt);
    await expect.poll(() => anna.seite.evaluate(() => window.ansicht.takt), { message: 'die Partie laeuft' }).toBeGreaterThan(takt);
    // Der Blick auf Berts Dorf: dort steht alles, nur lenkt es niemand.
    await anna.seite.evaluate((platz) => {
      const basis = window.ansicht.spieler.get(platz).basis;
      window.ansicht.blickAuf(basis.x, basis.y);
    }, bertsPlatz);
    await nachweis(anna.seite, {
      spec: SPEICHERN,
      ac: 'AC-25',
      titel: 'Fortgesetzt ohne Bert, bei Anna: die Uhr laeuft, im Bild Berts Dorf mit Dorfzentrum und Dorfbewohnern, die stehen bleiben',
      test: info,
    });
  });
});
