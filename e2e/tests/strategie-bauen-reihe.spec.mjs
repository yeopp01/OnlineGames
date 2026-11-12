// Mehrere Bauten mit Umschalt (→ specs/10-strategie/bedienung.md AC-48): wer
// beim Setzen Umschalt haelt, behaelt den Bauplatz in der Hand; der
// Dorfbewohner baut die Baustellen der Reihe nach, ohne neuen Befehl.
//
// Die Zeit steht still, waehrend gesetzt wird - so steht im Bild, was der
// Spieler gesetzt hat, nicht schon ein halbes Haus. Die Reihenfolge des Bauens
// prueft der Regeltest (tests/strategie-bauen-reihe.test.mjs); hier zaehlt,
// dass der Browser mit Umschalt im Bauen bleibt und alles fertig wird.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { dorfbewohnerAnklicken, partieBeenden, partieZuZweit, platzImBild } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

const baustellen = (page) => page.evaluate(() => [...window.ansicht.gebaeude.values()]
  .filter((g) => g.b === window.ansicht.ich && g.art === 'haus' && g.u !== undefined).length);

test('bedienung AC-48: mit Umschalt bleibt der Bauplatz in der Hand - drei Haeuser gesetzt, der Dorfbewohner baut sie der Reihe nach', async ({ browser }, info) => {
  // Handelt nicht vom Nebel.
  const partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  try {
    const { anna, code } = partie;
    await rohstoffe(anna, code, 'Anna', { holz: 500 });
    await expect(anna.locator('[data-rohstoff="holz"] b')).toHaveText('500');
    await dorfbewohnerAnklicken(anna);
    await zeitraffer(anna, code, 0);
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const vorher = await baustellen(anna);

    await anna.locator('[data-bauen="haus"]').click();
    expect(await anna.evaluate(() => window.ansicht.platzieren)).toEqual({ art: 'haus' });
    await anna.keyboard.down('Shift');
    for (let i = 1; i <= 3; i++) {
      // Der naechste freie Platz kennt die eben gesetzten erst, wenn der
      // Server sie geschickt hat - deshalb nach jedem Klick auf sie warten.
      const frei = await platzImBild(anna, { n: 2, um: basis, abstand: 5 });
      expect(frei, `Platz ${i} im Bild`).toBeTruthy();
      await anna.mouse.move(frei.bild.x, frei.bild.y, { steps: 3 });
      await expect.poll(() => anna.evaluate(() => window.ansicht.platzLage()?.taugt)).toBe(true);
      await anna.mouse.click(frei.bild.x, frei.bild.y);
      await expect.poll(() => baustellen(anna), `Baustelle ${i}`).toBe(vorher + i);
      expect(await anna.evaluate(() => window.ansicht.platzieren), 'der Bauplatz bleibt in der Hand').toEqual({ art: 'haus' });
    }
    await anna.keyboard.up('Shift');
    // Losgelassen liegt er weiter in der Hand: erst ein Klick ohne Umschalt,
    // Rechtsklick oder Esc legt ihn weg. Fuer das Bild ueber einen vierten Platz.
    const vierter = await platzImBild(anna, { n: 2, um: basis, abstand: 5 });
    expect(vierter, 'ein vierter Platz im Bild').toBeTruthy();
    await anna.mouse.move(vierter.bild.x, vierter.bild.y, { steps: 3 });
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzLage()?.taugt)).toBe(true);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-48',
      titel: 'Mit Umschalt drei Baustellen fuer Haeuser gesetzt, der Bauplatz liegt weiter gruen unter dem Zeiger',
      test: info,
    });
    await anna.keyboard.press('Escape');
    expect(await anna.evaluate(() => window.ansicht.platzieren)).toBeNull();

    // Ohne weiteren Befehl werden alle drei fertig.
    await zeitraffer(anna, code, 20);
    await expect.poll(() => baustellen(anna), { timeout: 60_000 }).toBe(vorher);
    const haeuser = await anna.evaluate(() => [...window.ansicht.gebaeude.values()]
      .filter((g) => g.b === window.ansicht.ich && g.art === 'haus').length);
    expect(haeuser).toBeGreaterThanOrEqual(3);
  } finally {
    await partieBeenden(partie);
  }
});
