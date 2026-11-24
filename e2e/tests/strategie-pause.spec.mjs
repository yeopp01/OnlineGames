// Anhalten und Fortsetzen (→ specs/00-plattform/speichern.md AC-19 bis AC-21):
// ein Knopf neben Aufgeben und die Taste F3 halten die Partie an, alle sehen
// dasselbe Feld mit dem Namen dessen, der angehalten hat, und jeder kann
// weiterspielen. Zu mehreren ist es begrenzt: zweimal je Spieler.
//
// Dass die Welt nicht taktet, Befehle verworfen werden und die Frist von
// selbst ablaeuft, belegt tests/netz.test.mjs am Server - hier steht, was
// man davon sieht.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test, zeitraffer } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const SPEICHERN = '00-plattform/speichern.md';
const uhr = (page) => page.locator('#spielzeit b').textContent();

test.describe('Anhalten und Fortsetzen', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
    // Zehnfach: stuende die Uhr nicht, liefe sie in einer Sekunde zehn weiter.
    await zeitraffer(partie.anna, partie.code, 10);
  });
  test.afterAll(() => partieBeenden(partie));

  test('speichern AC-19: Anna haelt an - bei beiden steht die Uhr, und mitten im Bild steht, wer angehalten hat', async ({}, info) => {
    const { anna, bert } = partie;
    await expect(anna.locator('#pause')).toHaveText('Pause');
    await anna.locator('#pause').click();
    for (const seite of [anna, bert]) {
      await expect(seite.locator('#pausefeld')).toBeVisible();
      await expect(seite.locator('#pauseWer')).toHaveText('Anna hat die Partie angehalten.');
      // Zu zweit hoechstens fuenf Minuten (AC-20).
      await expect(seite.locator('#pauseFrist')).toHaveText(/^Geht in (5:00|4:5\d) von selbst weiter\.$/);
    }
    // Oben kein zweites "Weiter" neben dem Feld in der Mitte.
    await expect(anna.locator('#pause')).toBeHidden();

    const vorher = [await uhr(anna), await uhr(bert)];
    const takt = await bert.evaluate(() => window.ansicht.takt);
    await anna.waitForTimeout(1200);
    expect([await uhr(anna), await uhr(bert)], 'die Uhr steht bei beiden').toEqual(vorher);
    expect(await bert.evaluate(() => window.ansicht.takt), 'es kommt kein neuer Takt').toBe(takt);

    await nachweis(anna, {
      spec: SPEICHERN,
      ac: 'AC-19',
      titel: 'Anna hat auf Pause geklickt: mitten im Bild steht Anna hat die Partie angehalten, darunter die Frist und Weiterspielen, oben rechts kein zweiter Knopf dafuer',
      test: info,
    });
  });

  test('speichern AC-21: Bert spielt weiter, obwohl Anna angehalten hat', async ({}, info) => {
    const { anna, bert } = partie;
    await expect(bert.locator('#pauseWeiter')).toBeVisible();
    await nachweis(bert, {
      spec: SPEICHERN,
      ac: 'AC-21',
      titel: 'Berts Bild waehrend Annas Pause: auch bei ihm steht Anna hat die Partie angehalten mit dem Knopf Weiterspielen',
      test: info,
    });
    const vorher = await uhr(anna);
    await bert.locator('#pauseWeiter').click();
    for (const seite of [anna, bert]) await expect(seite.locator('#pausefeld')).toBeHidden();
    await expect(anna.locator('#pause')).toHaveText('Pause');
    await expect.poll(() => uhr(anna), { message: 'die Uhr laeuft wieder' }).not.toBe(vorher);
  });

  test('speichern AC-19 / speichern AC-21: F3 haelt an und spielt weiter - auch von dem, der nicht angehalten hat', async () => {
    const { anna, bert } = partie;
    await bert.locator('#brett').hover();
    await bert.keyboard.press('F3');
    for (const seite of [anna, bert]) {
      await expect(seite.locator('#pauseWer')).toHaveText('Bert hat die Partie angehalten.');
    }
    await anna.locator('#brett').hover();
    await anna.keyboard.press('F3');
    for (const seite of [anna, bert]) await expect(seite.locator('#pausefeld')).toBeHidden();
  });

  test('speichern AC-20: zweimal je Spieler - Annas dritte Pause weist der Server ab', async ({}, info) => {
    const { anna, bert } = partie;
    // Die erste war der Klick oben; jetzt die zweite.
    await anna.locator('#pause').click();
    await expect(bert.locator('#pauseWer')).toHaveText('Anna hat die Partie angehalten.');
    await bert.locator('#pauseWeiter').click();
    await expect(anna.locator('#pausefeld')).toBeHidden();

    await anna.locator('#pause').click();
    await expect(anna.locator('#spielmeldung')).toHaveText('Du hast schon zweimal angehalten.');
    await expect(anna.locator('#pausefeld')).toBeHidden();
    await expect(bert.locator('#pausefeld')).toBeHidden();
    await nachweis(anna, {
      spec: SPEICHERN,
      ac: 'AC-20',
      titel: 'Annas dritte Pause: die Partie laeuft weiter, im Bild steht Du hast schon zweimal angehalten',
      test: info,
    });
    // Bert hat seine eigenen zwei: eine ist verbraucht, die zweite geht noch.
    await bert.locator('#pause').click();
    await expect(anna.locator('#pauseWer')).toHaveText('Bert hat die Partie angehalten.');
    await anna.locator('#pauseWeiter').click();
    await expect(bert.locator('#pausefeld')).toBeHidden();
  });
});
