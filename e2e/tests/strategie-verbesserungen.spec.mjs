// Die Verbesserungen der Feudalzeit im Bild (→ specs/10-strategie/bauen.md
// AC-25, AC-26): die Schmiede forscht Schmiedeangriff und Befiederte Pfeile,
// Holzfaellerlager und Muehle verbessern die Wirtschaft. Jede hat ihr eigenes
// Bildchen - vier gleiche Knoepfe waeren keine Auswahl (darstellung AC-14).
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, gebaeudeAufstellen, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { bedienteileFrei, freieWiesen, gebaeudeInDerNaehe, partieBeenden, partieZuZweit, platzImBild } from '../helpers/strategie.mjs';

const BAUEN = '10-strategie/bauen.md';
const KAMPF = '10-strategie/kampf.md';
const BEDIENUNG = '10-strategie/bedienung.md';

/** Ein Gebaeude anwaehlen und die Kamera darauf richten. */
async function gebaeudeWaehlen(page, id, zoom = 1.8) {
  await page.waitForFunction((g) => window.ansicht.gebaeude.has(g), id);
  await page.evaluate(([g, z]) => {
    const a = window.ansicht;
    a.kamera.zoom = z;
    a.gewaehltesGebaeude = g;
    a.ausgewaehlt.clear();
    const m = a.gebaeudeMitte(a.gebaeude.get(g));
    a.blickAuf(m.x, m.y);
    a.beiAuswahl();
  }, [id, zoom]);
}

/** Forschen und warten, bis die Verbesserung steht - der Knopf verschwindet. */
async function erforschen(page, code, art) {
  await page.locator(`[data-ausbilden="${art}"]`).click();
  await zeitraffer(page, code, 20);
  await page.waitForFunction((a) => window.ansicht.verbesserungen.includes(a), art, { timeout: 60_000 });
  await zeitraffer(page, code, 1);
}

test.describe('Verbesserungen der Feudalzeit', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let basis;
  let schmiede;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
    const { anna, code } = partie;
    basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    await rohstoffe(anna, code, 'Anna', { holz: 2000, nahrung: 2000, gold: 2000 });
    // Das zweite Gebaeude der Dunklen Zeit - ohne es geht der Aufstieg nicht
    // (bauen AC-23). Die Muehle steht ohnehin auf dem Plan.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'muehle', basis, { von: 5, bis: 12 });
    // Der echte Weg in die Feudalzeit: Auftrag im Dorfzentrum.
    await anna.keyboard.press('h');
    await anna.locator('[data-aufstieg="feudalzeit"]').click();
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => window.ansicht.zeitalter === 1, null, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);
    // Die Ankuendigung "Feudalzeit erreicht" steht gross in der Mitte - erst
    // wenn sie weg ist, zeigt ein Bild das Gebaeude darunter.
    await expect(anna.locator('#zeitalterwechsel')).toBeHidden({ timeout: 10_000 });
    await rohstoffe(anna, code, 'Anna', { holz: 2000, nahrung: 2000, gold: 2000 });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bauen AC-25: die Schmiede bietet Schmiedeangriff und Befiederte Pfeile mit eigenem Bild', async ({}, info) => {
    const { anna, code } = partie;
    schmiede = await gebaeudeInDerNaehe(anna, code, 'Anna', 'schmiede', basis, { von: 5, bis: 14 });
    await gebaeudeWaehlen(anna, schmiede);

    const angriff = anna.locator('[data-ausbilden="schmiedeangriff"]');
    const pfeile = anna.locator('[data-ausbilden="befiedertePfeile"]');
    await expect(angriff).toHaveCount(1);
    await expect(pfeile).toHaveCount(1);
    await expect(angriff).toHaveAttribute('aria-label', 'Schmiedeangriff erforschen (100 Nahrung)');
    await expect(pfeile).toHaveAttribute('aria-label', 'Befiederte Pfeile erforschen (100 Nahrung, 50 Gold)');
    await expect(angriff).toBeInViewport();
    await expect(pfeile).toBeInViewport();

    // Zwei Knoepfe, zwei Bilder: die Leinwände duerfen nicht gleich aussehen,
    // sonst waere die Auswahl ein Ratespiel (darstellung AC-14).
    const gleich = await anna.evaluate(() => {
      const [a, b] = ['schmiedeangriff', 'befiedertePfeile']
        .map((art) => document.querySelector(`[data-ausbilden="${art}"] canvas`).toDataURL());
      return a === b;
    });
    expect(gleich, 'Amboss und Pfeil sind verschiedene Bilder').toBe(false);

    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-25',
      titel: 'Die Schmiede gewählt: Schmiedeangriff (Amboss, 100 Nahrung) und Befiederte Pfeile (Pfeil, 100 Nahrung, 50 Gold) — jede Forschung mit eigenem Bild',
      test: info,
    });
  });

  test('bedienung AC-65: Forschung traegt Gold am Knopf - und was in der anderen Schmiede schon laeuft, ist dort grau', async ({}, info) => {
    const { anna, code } = partie;
    // Im Dorfzentrum: der Dorfbewohner ist Ausbildung, der Aufstieg Forschung.
    await anna.keyboard.press('h');
    await expect(anna.locator('[data-ausbilden="dorfbewohner"]')).not.toHaveClass(/forschung/);
    await expect(anna.locator('[data-aufstieg]')).toHaveClass(/forschung/);
    const rand = (l) => l.evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(await rand(anna.locator('[data-aufstieg]')), 'ein anderer Rand als am Dorfbewohner')
      .not.toBe(await rand(anna.locator('[data-ausbilden="dorfbewohner"]')));

    // Zwei Schmieden: in der ersten werden die Befiederten Pfeile bestellt.
    const zweite = await gebaeudeInDerNaehe(anna, code, 'Anna', 'schmiede', basis, { von: 6, bis: 16 });
    await gebaeudeWaehlen(anna, schmiede);
    const pfeile = anna.locator('[data-ausbilden="befiedertePfeile"]');
    await expect(pfeile).toHaveClass(/forschung/);
    await expect(pfeile).toHaveAttribute('aria-disabled', 'false');
    await pfeile.click();
    await expect(anna.locator('[data-abbrechen="0"]')).toHaveClass(/forschung/);
    // Der Knopf dort sagt es selbst - ein zweiter Klick waere eine Absage.
    await expect(pfeile).toHaveAttribute('data-laeuft', 'befiedertePfeile');
    await expect(pfeile).toHaveAttribute('aria-label', 'Befiederte Pfeile wird schon erforscht');

    // In der zweiten Schmiede: die Pfeile grau, der Schmiedeangriff nicht.
    await gebaeudeWaehlen(anna, zweite);
    await expect(pfeile).toHaveAttribute('aria-disabled', 'true');
    await expect(pfeile).toHaveAttribute('data-laeuft', 'befiedertePfeile');
    await expect(anna.locator('[data-ausbilden="schmiedeangriff"]')).toHaveAttribute('aria-disabled', 'false');
    await expect(anna.locator('[data-ausbilden="schmiedeangriff"]')).not.toHaveAttribute('data-laeuft');
    expect(await pfeile.evaluate((el) => getComputedStyle(el, '::after').content), 'das Wort auf dem Knopf').toBe('"läuft"');
    // Ein Klick bestellt nichts und sagt, warum. Mit `force`: fuer Playwright
    // ist ein Knopf mit `aria-disabled` nicht bedienbar, fuer die Maus schon.
    await pfeile.click({ force: true });
    await expect(anna.locator('#spielmeldung')).toContainText('Befiederte Pfeile wird schon erforscht.');
    await expect(anna.locator('[data-abbrechen]')).toHaveCount(0);
    expect(await anna.evaluate((g) => window.ansicht.gebaeude.get(g).s.length, zweite), 'die zweite Schlange bleibt leer').toBe(0);

    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.mouse.move(700, 300);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-65',
      titel: 'Die zweite Schmiede gewählt: beide Forschungen mit goldenem Rand und goldener Ecke, die Befiederten Pfeile grau mit „läuft“ — sie werden in der ersten Schmiede erforscht',
      test: info,
    });

    // Abgebrochen ist der Knopf wieder frei - in beiden Schmieden.
    await gebaeudeWaehlen(anna, schmiede);
    await anna.locator('[data-abbrechen="0"]').click();
    await expect(anna.locator('[data-abbrechen]')).toHaveCount(0);
    await expect(pfeile).not.toHaveAttribute('data-laeuft');
    await expect(pfeile).toHaveAttribute('aria-disabled', 'false');
    await gebaeudeWaehlen(anna, zweite);
    await expect(pfeile).toHaveAttribute('aria-disabled', 'false');
  });

  test('bauen AC-25: erforscht wirkt es sofort, der Knopf ist weg', async () => {
    const { anna, code } = partie;
    await gebaeudeWaehlen(anna, schmiede);
    await erforschen(anna, code, 'schmiedeangriff');

    // Erforscht ist erforscht: der Knopf verschwindet aus dem Angebot.
    await gebaeudeWaehlen(anna, schmiede);
    await expect(anna.locator('[data-ausbilden="schmiedeangriff"]')).toHaveCount(0);
    await expect(anna.locator('[data-ausbilden="befiedertePfeile"]')).toHaveCount(1);
    expect(await anna.evaluate(() => window.ansicht.verbesserungen)).toContain('schmiedeangriff');
    // Bert hat sie nicht - eine Verbesserung gilt einem Spieler.
    expect(await partie.bert.evaluate(() => window.ansicht.verbesserungen)).not.toContain('schmiedeangriff');
  });

  test('bauen AC-26: die Mühle erforscht das Pferdekummet - jede Farm trägt danach 75 Nahrung mehr', async ({}, info) => {
    const { anna, code } = partie;
    const muehle = await anna.evaluate(() => {
      const a = window.ansicht;
      return [...a.gebaeude.values()].find((g) => g.art === 'muehle' && g.b === a.ich).i;
    });
    // Eine Farm, die schon steht: sie bekommt die Nahrung nachgelegt. Sie muss
    // **vorn** stehen, sonst verdeckt das Dorfzentrum sie im Bild (Runde 68).
    const wo = await platzImBild(anna, { n: 3, um: basis, abstand: 5 });
    expect(wo, 'ein Bauplatz vorn').toBeTruthy();
    const farm = await gebaeudeAufstellen(anna, code, 'Anna', 'farm', wo.x, wo.y);
    await anna.waitForFunction((f) => window.ansicht.gebaeude.get(f)?.n !== undefined, farm);
    expect(await anna.evaluate((f) => window.ansicht.gebaeude.get(f).n, farm)).toBe(175);

    await gebaeudeWaehlen(anna, muehle);
    const kummet = anna.locator('[data-ausbilden="pferdekummet"]');
    await expect(kummet).toHaveCount(1);
    await expect(kummet).toHaveAttribute('aria-label', 'Pferdekummet erforschen (75 Nahrung, 75 Holz)');
    await expect(kummet).toBeInViewport();
    await erforschen(anna, code, 'pferdekummet');

    // Die Farm, die schon stand, traegt jetzt 250 statt 175.
    await anna.waitForFunction((f) => window.ansicht.gebaeude.get(f).n === 250, farm, { timeout: 20_000 });

    // Das Bild: die Farm gewaehlt, unten "noch 250 Nahrung von 175" - die
    // Zeile nennt den Vorrat, der Zuschlag steht darueber.
    await gebaeudeWaehlen(anna, farm, 1.8);
    const vorrat = anna.locator('#farmvorrat');
    await expect(vorrat).toContainText('noch 250 Nahrung');
    // Und der Vorrat daneben ist der dieses Spielers, nicht der der Tabelle.
    await expect(vorrat).toContainText('von 250');
    await expect(vorrat).toBeInViewport();
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BAUEN,
      ac: 'AC-26',
      titel: 'Nach dem Pferdekummet trägt die Farm, die schon stand, 250 Nahrung statt 175 — unten in der Leiste „noch 250 Nahrung"',
      test: info,
    });
  });

  test('bauen AC-26: das Holzfällerlager erforscht die Doppelaxt', async () => {
    const { anna, code } = partie;
    const lager = await gebaeudeInDerNaehe(anna, code, 'Anna', 'holzfaellerlager', basis, { von: 5, bis: 14 });
    await gebaeudeWaehlen(anna, lager);
    const axt = anna.locator('[data-ausbilden="doppelaxt"]');
    await expect(axt).toHaveCount(1);
    await expect(axt).toHaveAttribute('aria-label', 'Doppelaxt erforschen (100 Nahrung, 50 Holz)');
    await erforschen(anna, code, 'doppelaxt');
    await gebaeudeWaehlen(anna, lager);
    await expect(anna.locator('[data-ausbilden="doppelaxt"]')).toHaveCount(0);
    expect(await anna.evaluate(() => window.ansicht.verbesserungen)).toContain('doppelaxt');
  });

  // Hierher gehoert dieser Test, weil Anna an dieser Stelle den
  // Schmiedeangriff erforscht hat: die Leiste muss 4 zeigen, nicht die 3 aus
  // der Tabelle. Genau das war die Luecke (bedienung AC-35).
  test('bedienung AC-35: die Auswahl nennt Angriff, Rüstung, Reichweite und den Bonus', async ({}, info) => {
    const { anna, code } = partie;
    expect(await anna.evaluate(() => window.ansicht.verbesserungen)).toContain('schmiedeangriff');

    const [wiese] = await freieWiesen(anna, 1);
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { art: 'speerkaempfer', x: wiese.x, y: wiese.y })).toBe(1);

    // Das Kuerzel nicht aus dem Kopf, sondern aus den Werten (Runde 72).
    const kuerzel = await anna.evaluate(() => window.ansicht.werte.einheiten.speerkaempfer.kuerzel);
    await anna.waitForFunction((k) => [...window.ansicht.nachher.values()].some((e) => e.k === k), kuerzel);

    // Anwaehlen wie im Spiel: Kamera hin, dann auf die Figur klicken.
    const speer = await anna.evaluate((k) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt.clear();
      a.kamera.zoom = 1.6;
      const e = [...a.nachher.values()].find((f) => f.b === a.ich && f.k === k);
      a.blickAuf(e.x, e.y);
      const p = a.zuBild(e.x, e.y);
      return { i: e.i, x: p.x, y: p.y - a.figurenHoehe() * 0.5 };
    }, kuerzel);
    await anna.mouse.click(speer.x, speer.y);
    await expect.poll(() => anna.evaluate(() => [...window.ansicht.ausgewaehlt])).toEqual([speer.i]);

    // Die Zahlen sind die des Spielers mit seinen Verbesserungen, nicht die
    // der Tabelle: der Schmiedeangriff macht aus 3 Angriff 4.
    const zeile = anna.locator('#kampfwerte');
    const roh = await anna.evaluate(() => window.ansicht.werte.einheiten.speerkaempfer.angriff);
    const meins = await anna.evaluate((id) => window.ansicht.einheitenwert(window.ansicht.nachher.get(id), 'angriff'), speer.i);
    expect(meins, 'der Schmiedeangriff zeigt sich an der Auswahl').toBe(roh + 1);
    // Die Zahlen stehen als Daten an der Zeile; im Text trennt sie nur der
    // Abstand aus dem Stylesheet, deshalb wird dort auf das Wort geprueft.
    await expect(zeile).toHaveAttribute('data-angriff', String(meins));
    await expect(zeile).toHaveAttribute('data-nahruestung', '0');
    await expect(zeile).toHaveAttribute('data-fernruestung', '0');
    await expect(zeile).toHaveAttribute('data-reichweite', '0');
    await expect(zeile).toContainText('Angriff');
    await expect(zeile).toContainText('Rüstung');
    await expect(zeile).toContainText('Nahkampf');
    // Seit bedienung AC-70 als Grundwert und Zuschlag: "3+1".
    await expect(zeile.locator('.wert').nth(0)).toContainText(`${roh}+1`);
    await expect(zeile.locator('.wert').nth(1)).toContainText('0 / 0');
    await expect(zeile.locator('.bonus')).toHaveText('+15 gegen Kavallerie');
    await expect(zeile).toBeInViewport();
    await expect(anna.locator('.auswahl-kopf strong')).toHaveText('Speerkämpfer');

    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-35',
      titel: 'Ein Speerkämpfer gewählt: unten Angriff 3+1 (der Schmiedeangriff), Rüstung 0 / 0, Nahkampf und „+15 gegen Kavallerie"',
      test: info,
    });
  });

  // Rueckmeldung des Benutzers: Angriff und Ruestung als Grundwert und
  // Zuschlag. Der Speerkaempfer aus dem Fall davor ist noch gewaehlt.
  test('bedienung AC-70: der Angriff steht als 3+1, der Zuschlag in Gold - und wer keinen hat, zeigt die Zahl allein', async ({}, info) => {
    const { anna } = partie;
    const zeile = anna.locator('#kampfwerte');
    const roh = await anna.evaluate(() => window.ansicht.werte.einheiten.speerkaempfer.angriff);
    const angriff = zeile.locator('.wert').nth(0);
    await expect(angriff.locator('b')).toHaveText(`${roh}+1`);
    await expect(angriff.locator('.zuschlag')).toHaveText('+1');
    await expect(zeile).toHaveAttribute('data-zuschlag', 'angriff:1');
    // Die Summe steht weiter als Zahl an der Zeile - sie kommt vom Server.
    await expect(zeile).toHaveAttribute('data-angriff', String(roh + 1));
    // Der Zuschlag hat eine andere Farbe als der Grundwert.
    const farbe = (l) => l.evaluate((el) => getComputedStyle(el).color);
    expect(await farbe(angriff.locator('.zuschlag')), 'der Zuschlag in eigener Farbe').not.toBe(await farbe(angriff.locator('b')));
    // Die Ruestung hat keinen: dort steht kein Plus.
    await expect(zeile.locator('.wert').nth(1).locator('.zuschlag')).toHaveCount(0);
    await expect(zeile.locator('.wert').nth(1).locator('b')).toHaveText('0 / 0');
    await expect(zeile).toBeInViewport();

    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-70',
      titel: 'Ein Speerkämpfer nach dem Schmiedeangriff: unten steht der Angriff als 3+1, das +1 in Gold; die Rüstung 0 / 0 ohne Plus',
      test: info,
    });

    // Ein Dorfbewohner hat nichts erforscht bekommen: seine Zahl steht allein.
    await anna.evaluate(() => {
      const a = window.ansicht;
      const k = a.werte.einheiten.dorfbewohner.kuerzel;
      const e = [...a.nachher.values()].find((f) => f.b === a.ich && f.k === k);
      a.ausgewaehlt.clear();
      a.ausgewaehlt.add(e.i);
    });
    await expect(anna.locator('.auswahl-kopf strong')).toHaveText('Dorfbewohner');
    await expect(zeile).not.toHaveAttribute('data-zuschlag');
    await expect(zeile.locator('.zuschlag')).toHaveCount(0);
  });

  // Forschung veraendert die Flaeche des Nebels (kampf AC-17, Wunsch des
  // Benutzers). Annas Partie laeuft mit Nebel, der Vorgabe.
  test('kampf AC-17: die Stadtwache im Dorfzentrum weitet die Sicht aller Gebaeude um vier Felder', async ({}, info) => {
    const { anna, code } = partie;
    const zentrum = await anna.evaluate(() => {
      const a = window.ansicht;
      return [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'dorfzentrum').i;
    });
    await gebaeudeWaehlen(anna, zentrum, 0.8);
    const knopf = anna.locator('[data-ausbilden="stadtwache"]');
    await expect(knopf).toHaveCount(1);
    await expect(knopf).toHaveAttribute('aria-label', 'Stadtwache erforschen (75 Nahrung)');
    await expect(knopf).toBeInViewport();
    // Ein eigenes Bild: nicht dasselbe wie der Webstuhl daneben (darstellung AC-14).
    const gleich = await anna.evaluate(() => {
      const [a, b] = ['stadtwache', 'webstuhl'].map((art) => document.querySelector(`[data-ausbilden="${art}"] canvas`)?.toDataURL());
      return Boolean(a) && a === b;
    });
    expect(gleich, 'Laterne und Webstuhl sehen verschieden aus').toBe(false);
    await anna.waitForFunction(() => window.ansicht.nebel.takt > -Infinity);
    const vorher = await anna.evaluate(() => window.ansicht.nebel.zaehlen().beobachtet);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: KAMPF,
      ac: 'AC-17',
      titel: 'Vorher: das Dorfzentrum gewählt, im Menü die Stadtwache mit der Laterne — hell ist es, so weit die Gebäude sehen',
      test: info,
    });

    await erforschen(anna, code, 'stadtwache');
    // Eine halbe Sekunde, bis die Sicht neu gerechnet ist.
    await anna.waitForFunction((v) => window.ansicht.nebel.zaehlen().beobachtet > v, vorher, { timeout: 5_000 });
    const nachher = await anna.evaluate(() => window.ansicht.nebel.zaehlen().beobachtet);
    // Vier Felder mehr um jedes Gebaeude: deutlich mehr Helles, nicht ein paar Felder.
    expect(nachher, `${vorher} -> ${nachher} beobachtete Felder`).toBeGreaterThan(vorher * 1.3);
    // Die Maus weg vom Knopf: sonst steht die Tafel des naechsten im Bild.
    await anna.mouse.move(700, 300);
    await gebaeudeWaehlen(anna, zentrum, 0.8);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: KAMPF,
      ac: 'AC-17',
      titel: 'Nachher: die Stadtwache ist erforscht, der helle Kreis um das Dorf reicht vier Felder weiter',
      test: info,
    });
  });
});
