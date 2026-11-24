// Was das erste Spiel auf dem Server gezeigt hat (2026-11-12) - die
// Rueckmeldungen des Benutzers, soweit sie Bedienung sind
// (→ specs/10-strategie/bedienung.md AC-51 bis AC-57 und AC-30,
// specs/10-strategie/einheiten-und-befehle.md AC-56,
// specs/00-plattform/raeume.md AC-18): der Klick trifft das Bild, der Zeiger
// sagt den Befehl, die Uebersichtskarte nimmt den Rechtsklick, die Leiste
// bleibt stehen, das Menue sagt die Wirkung, die Punkte stehen staendig im
// Bild, und der Vorraum bietet die Rueckkehr an.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { zeichenHalten } from '../helpers/strategie.mjs';
import { einheitenAufstellen, expect, lebenSetzen, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit, platzImBild, waehlen } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';
const EINHEITEN = '10-strategie/einheiten-und-befehle.md';
const RAEUME = '00-plattform/raeume.md';

test.describe('Rueckmeldungen aus dem ersten Spiel', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let anna;
  let code;
  let dorf; // die eigenen Dorfbewohner, der Reihe nach
  let baum; // der Baum, an dem der zweite hackt
  let holzfaeller;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
    ({ anna, code } = partie);
    dorf = await anna.evaluate(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].filter((e) => e.b === a.ich && a.arten[e.k] === 'dorfbewohner').map((e) => e.i).sort((p, q) => p - q);
    });
    expect(dorf.length).toBeGreaterThanOrEqual(3);
  });
  test.afterAll(() => partieBeenden(partie));

  const zurBasis = (zoom = 2) => anna.evaluate((z) => {
    const a = window.ansicht;
    const b = a.spieler.get(a.ich).basis;
    a.kamera.zoom = z;
    a.blickAuf(b.x, b.y);
    return b;
  }, zoom);
  const zentrumWaehlen = () => anna.evaluate(() => {
    const a = window.ansicht;
    const dz = [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'dorfzentrum');
    a.ausgewaehlt = new Set();
    a.gewaehltesGebaeude = dz.i;
    a.beiAuswahl();
  });
  const zeigerZiel = () => anna.evaluate(() => {
    const z = window.ansicht.zeigerZiel;
    return z && { art: z.art, text: z.text, x: z.x, y: z.y };
  });

  test('bedienung AC-55: ueber dem Webstuhl steht, was er bringt - und ueber dem Dorfbewohner, was er kann', async ({}, info) => {
    await zurBasis(1.6);
    // Die Maus steht noch, wo der Start geklickt wurde - dort liegt jetzt ein Knopf der Leiste.
    await anna.mouse.move(700, 200);
    await zentrumWaehlen();
    const tafel = anna.locator('#knopftafel');
    await expect(tafel).toBeHidden();

    await anna.locator('[data-ausbilden="webstuhl"]').hover();
    await expect(tafel).toBeVisible();
    await expect(tafel).toBeInViewport({ ratio: 1 });
    await expect(tafel.locator('.kt-kopf')).toContainText('Webstuhl');
    // Die Wirkung in Zahlen, nicht nur der Preis.
    await expect(tafel).toContainText(/Dorfbewohner: \+\d+ Leben/);
    await expect(tafel).toContainText(/Forschung \d+ s/);
    // Die Tafel ersetzt den Hinweis des Browsers - sonst staenden zwei da.
    await expect(anna.locator('[data-ausbilden="webstuhl"]')).not.toHaveAttribute('title', /.+/);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-55',
      titel: 'Die Maus ueber dem Webstuhl: die Tafel ueber der Leiste nennt Preis, Wirkung in Zahlen und Dauer',
      test: info,
    });

    await anna.locator('[data-ausbilden="dorfbewohner"]').hover();
    await expect(tafel.locator('.kt-kopf')).toContainText('Dorfbewohner');
    await expect(tafel).toContainText(/\d+ Leben · \d+ Angriff/);
    await expect(tafel).toContainText(/Tempo/);
    await expect(tafel).toContainText(/Ausbildung \d+ s/);

    // Was fehlt, steht dabei.
    await rohstoffe(anna, code, 'Anna', { nahrung: 0 });
    await expect(anna.locator('[data-ausbilden="dorfbewohner"]')).toHaveAttribute('aria-disabled', 'true');
    await expect(tafel.locator('.kt-fehlt')).toContainText('Zu wenig Nahrung');
    await rohstoffe(anna, code, 'Anna', { nahrung: 2000 });
    await expect(anna.locator('[data-ausbilden="dorfbewohner"]')).toHaveAttribute('aria-disabled', 'false');
    await expect(tafel.locator('.kt-fehlt')).toHaveCount(0);

    // Mit der Tastatur dasselbe: der Fokus zeigt die Tafel.
    await anna.mouse.move(700, 300);
    await expect(tafel).toBeHidden();
    await anna.locator('[data-ausbilden="webstuhl"]').focus();
    await expect(tafel.locator('.kt-kopf')).toContainText('Webstuhl');
    await anna.locator('[data-ausbilden="webstuhl"]').blur();
    await expect(tafel).toBeHidden();
  });

  test('bedienung AC-54: fuenfmal und fuenfzehnmal Dorfbewohner - der Knopf steht auf den Bildpunkt, wo er stand', async ({}, info) => {
    await zentrumWaehlen();
    await rohstoffe(anna, code, 'Anna', { nahrung: 2000 });
    const knopf = anna.locator('[data-ausbilden="dorfbewohner"]');
    await expect(knopf).toHaveAttribute('aria-disabled', 'false');
    const lage = async () => {
      const r = await knopf.boundingBox();
      const leiste = await anna.locator('#auswahlleiste').boundingBox();
      return { x: r.x, y: r.y, breite: r.width, leisteLinks: leiste.x, leisteBreite: leiste.width };
    };
    const leer = await lage();

    for (let i = 0; i < 5; i++) await knopf.click();
    await expect(anna.locator('[data-abbrechen]')).toHaveCount(5);
    expect(await lage(), 'nach fuenf Auftraegen').toEqual(leer);

    for (let i = 5; i < 15; i++) await knopf.click();
    await expect(anna.locator('[data-abbrechen]')).toHaveCount(15);
    expect(await lage(), 'nach fuenfzehn Auftraegen').toEqual(leer);
    // Die Tafel bleibt ueber dem Knopf stehen, obwohl die Leiste neu gebaut wurde.
    await expect(anna.locator('#knopftafel .kt-kopf')).toContainText('Dorfbewohner');
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-54',
      titel: 'Fuenfzehn Dorfbewohner bestellt: die Schlange fuellt ihren festen Platz in zwei Reihen, der Knopf steht unter der Maus, wo er stand',
      test: info,
    });

    // Aufraeumen: alles abbestellen, die Kosten kommen zurueck.
    while (await anna.locator('[data-abbrechen]').count()) {
      const vorher = await anna.locator('[data-abbrechen]').count();
      await anna.locator('[data-abbrechen="0"]').click();
      await expect(anna.locator('[data-abbrechen]')).toHaveCount(vorher - 1);
    }
    expect(await lage(), 'und wieder ohne Auftrag').toEqual(leer);
    await anna.mouse.move(700, 300);
  });

  // Rueckmeldung des Benutzers: "wenn ich ganz viele einheiten produzieren
  // will und ganz schnell draufklicke, dann klickt man zu schnell fuer den
  // browser". Die Leiste wird mit jedem Auftrag neu gebaut - ein Klick,
  // zwischen dessen Haelften der Knopf ersetzt wurde, ging verloren.
  test('bedienung AC-71: gedrueckt ist bestellt, auch wenn die Leiste vor dem Loslassen neu gebaut wird - sechs schnelle Klicks sind sechs, mit Umschalt fuenf', async ({}, info) => {
    await zentrumWaehlen();
    await rohstoffe(anna, code, 'Anna', { nahrung: 2000 });
    const knopf = anna.locator('[data-ausbilden="dorfbewohner"]');
    await expect(knopf).toHaveAttribute('aria-disabled', 'false');
    const schlange = anna.locator('[data-abbrechen]');
    await expect(schlange).toHaveCount(0);
    const r = await knopf.boundingBox();
    const mitte = { x: r.x + r.width / 2, y: r.y + r.height / 2 };

    // Druecken und halten: der Auftrag steht, die Leiste ist neu gebaut -
    // der Knopf unter der Maus ist ein anderer als der gedrueckte.
    await anna.mouse.move(mitte.x, mitte.y);
    await knopf.evaluate((el) => { el.dataset.gedrueckt = '1'; });
    await anna.mouse.down();
    await expect(schlange).toHaveCount(1);
    await expect(knopf, 'die Leiste wurde neu gebaut').not.toHaveAttribute('data-gedrueckt');
    await anna.mouse.up();
    // Das Loslassen bestellt nicht noch einmal.
    await anna.waitForTimeout(400);
    await expect(schlange).toHaveCount(1);

    // Sechsmal so schnell es geht.
    for (let i = 0; i < 6; i++) await anna.mouse.click(mitte.x, mitte.y);
    await expect(schlange).toHaveCount(7);

    // Mit Umschalt fuenf auf einmal.
    await anna.keyboard.down('Shift');
    await anna.mouse.click(mitte.x, mitte.y);
    await anna.keyboard.up('Shift');
    await expect(schlange).toHaveCount(12);

    // Ohne Zeiger ausgeloest (Tastatur) wirkt der Knopf wie bisher - einmal.
    await knopf.dispatchEvent('click');
    await expect(schlange).toHaveCount(13);

    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-71',
      titel: 'Dreizehn Dorfbewohner in der Schlange: einer gedrückt und gehalten, sechs schnelle Klicks, fünf mit Umschalt, einer ohne Zeiger',
      test: info,
    });

    // Abbestellen wirkt ebenso beim Druecken: dreizehnmal ohne Warten.
    const erster = await anna.locator('[data-abbrechen="0"]').boundingBox();
    for (let i = 0; i < 13; i++) {
      await anna.mouse.click(erster.x + erster.width / 2, erster.y + erster.height / 2);
      await expect(schlange).toHaveCount(12 - i);
    }
    await anna.mouse.move(700, 300);
  });

  test('bedienung AC-57: die Punkte stehen staendig ueber der Uebersichtskarte, der Fuehrende oben', async ({}, info) => {
    const liste = anna.locator('#punkteliste');
    await expect(liste).toBeVisible();
    await expect(liste).toBeInViewport({ ratio: 1 });
    await expect(liste.locator('li')).toHaveCount(2);
    await expect(liste.locator('li.ich .name')).toHaveText('Anna');

    // Bert hat 1234 Gold gesammelt: 123 Punkte (bedienung AC-47), er fuehrt.
    await rohstoffe(anna, code, 'Bert', { gesammelt: { gold: 1234 } });
    await expect(liste.locator('li').first().locator('.name')).toHaveText('Bert');
    await expect(liste.locator('li').first().locator('.zahl')).toHaveText('123');
    // Dann Anna mit mehr: sie rueckt nach oben.
    await rohstoffe(anna, code, 'Anna', { gesammelt: { holz: 2000 } });
    await expect(liste.locator('li').first().locator('.name')).toHaveText('Anna');
    await expect(liste.locator('li').first().locator('.zahl')).toHaveText('200');

    // Ueber der Karte, nicht darauf - und kein Ziel fuer die Maus.
    const [l, k] = [await liste.boundingBox(), await anna.locator('#uebersicht').boundingBox()];
    expect(l.y + l.height, 'die Liste endet ueber der Karte').toBeLessThanOrEqual(k.y);
    expect(await liste.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none');
    // Bei Bert dieselbe Reihenfolge, fett ist dort sein Name.
    await expect(partie.bert.locator('#punkteliste li').first().locator('.name')).toHaveText('Anna');
    await expect(partie.bert.locator('#punkteliste li.ich .name')).toHaveText('Bert');
    await zurBasis(1.4);
    await anna.waitForTimeout(150);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-57',
      titel: 'Unten rechts ueber der Uebersichtskarte die Punkte: Anna 200 vor Bert 123, ohne eine Taste',
      test: info,
    });
  });

  test('bedienung AC-67: hinter jedem Namen steht das Zeitalter als roemische Ziffer - und es zieht mit dem Aufstieg nach', async ({}, info) => {
    const liste = anna.locator('#punkteliste');
    const stufe = (name) => liste.locator('li', { has: anna.locator('.name', { hasText: name }) }).locator('.stufe');
    await expect(stufe('Anna')).toHaveText('(I)');
    await expect(stufe('Bert')).toHaveText('(I)');
    // Bert steigt zweimal auf, Anna einmal: jeder sieht es am anderen, ohne
    // eine Taste und ohne dessen Dorf zu sehen.
    await rohstoffe(anna, code, 'Bert', { zeitalter: 2 });
    await rohstoffe(anna, code, 'Anna', { zeitalter: 1 });
    await expect(stufe('Bert')).toHaveText('(III)');
    await expect(stufe('Anna')).toHaveText('(II)');
    await expect(partie.bert.locator('#punkteliste li.ich .stufe')).toHaveText('(III)');
    // Die Ziffer steht zwischen Name und Zahl, die Zeile bleibt eine Zeile.
    const zeile = liste.locator('li.ich');
    const [n, s, z] = await Promise.all(['.name', '.stufe', '.zahl'].map((k) => zeile.locator(k).boundingBox()));
    expect(n.x + n.width, 'die Ziffer folgt dem Namen').toBeLessThanOrEqual(s.x + 1);
    expect(s.x - (n.x + n.width), 'und steht dicht an ihm').toBeLessThan(12);
    expect(s.x + s.width, 'vor der Zahl').toBeLessThanOrEqual(z.x + 1);
    expect(Math.abs(n.y - z.y), 'in einer Zeile').toBeLessThan(3);
    await expect(liste).toBeInViewport({ ratio: 1 });
    await zurBasis(1.4);
    await anna.waitForTimeout(150);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-67',
      titel: 'In der Punkteliste unten rechts steht hinter jedem Namen das Zeitalter: Anna (II), Bert (III)',
      test: info,
    });
    // Zurueck in die erste Stufe - die Faelle danach rechnen mit ihr.
    await rohstoffe(anna, code, 'Bert', { zeitalter: 0 });
    await rohstoffe(anna, code, 'Anna', { zeitalter: 0 });
    await expect(stufe('Anna')).toHaveText('(I)');
  });

  test('bedienung AC-51: ein Rechtsklick auf den Koerper des Schafs schlachtet - obwohl der Boden dahinter ein anderes Feld ist', async ({}, info) => {
    await anna.evaluate(() => { window.ansicht.kamera.zoom = 2; });
    await waehlen(anna, [dorf[0]]);
    // Ein eigenes Schaf und ein Punkt auf seinem Koerper, unter dem ein Feld
    // liegt, das weiter als die 1,01 Felder des Servers vom Schaf entfernt
    // ist: dorthin ging der Dorfbewohner vorher, statt zu schlachten.
    const schaf = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const frei = (t) => {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (a.karte.felder[(Math.round(t.y) + dy) * g + Math.round(t.x) + dx] !== 0) return false;
          }
        }
        return true;
      };
      const figur = a.figurenHoehe();
      for (const t of [...a.tiere.values()].filter((s) => s.b === a.ich && !s.g && frei(s))) {
        a.blickAuf(t.x, t.y);
        const p = a.zuBild(t.x, t.y);
        for (const dy of [-0.5, -0.45, -0.4, -0.35]) {
          for (const dx of [0, 0.2, -0.2, 0.35, -0.35]) {
            const px = p.x + dx * figur;
            const py = p.y + dy * figur;
            const boden = a.zuWelt(px, py);
            const feld = { x: Math.round(boden.x), y: Math.round(boden.y) };
            const weit = Math.hypot(feld.x - t.x, feld.y - t.y);
            if (weit > 1.01) return { i: t.i, x: t.x, y: t.y, px, py, weit };
          }
        }
      }
      return null;
    });
    expect(schaf, 'ein Schaf, dessen Koerper im Bild ueber einem fremden Feld liegt').not.toBeNull();
    const rand = await anna.locator('#brett').boundingBox();
    await anna.mouse.move(rand.x + schaf.px, rand.y + schaf.py, { steps: 3 });
    await expect.poll(zeigerZiel).toMatchObject({ art: 'schlachten', text: 'Schlachten' });
    await anna.mouse.click(rand.x + schaf.px, rand.y + schaf.py, { button: 'right' });
    // Das Zeichen am Ziel steht am Schaf, nicht am Feld dahinter.
    const zeichen = await anna.evaluate(() => window.ansicht.zielzeichen && { ...window.ansicht.zielzeichen });
    expect(Math.hypot(zeichen.x - schaf.x, zeichen.y - schaf.y)).toBeLessThan(0.3);
    expect(zeichen.arbeit).toBe(true);

    await zeitraffer(anna, code, 5);
    await anna.waitForFunction(({ hirte, tier }) => {
      const a = window.ansicht;
      const e = a.nachher.get(hirte);
      return a.tiere.get(tier)?.g && e && e.l >= 2 && e.a === 'n';
    }, { hirte: dorf[0], tier: schaf.i }, { timeout: 30_000 });
    await zeitraffer(anna, code, 1);
    await anna.mouse.move(700, 300);
    await anna.waitForTimeout(150);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-51',
      titel: 'Auf den Koerper des Schafs geklickt, nicht auf den Boden darunter: der Dorfbewohner hat es geschlachtet und nimmt Nahrung',
      test: info,
    });
  });

  test('bedienung AC-51 / bedienung AC-52: ueber der Krone steht Holz hacken am Zeiger, der Klick trifft diesen Baum', async ({}, info) => {
    holzfaeller = dorf[1];
    await waehlen(anna, [holzfaeller]);
    // Der vorderste Baum eines Waldes nahe der Basis: vor ihm steht keiner.
    baum = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const b = a.spieler.get(a.ich).basis;
      const wald = (x, y) => a.karte.felder[y * g + x] === 1;
      let best = null;
      for (let y = 1; y < g - 1; y++) {
        for (let x = 1; x < g - 1; x++) {
          if (!wald(x, y) || wald(x + 1, y + 1) || wald(x, y + 1) || wald(x + 1, y)) continue;
          const d = Math.hypot(x - b.x, y - b.y);
          if (!best || d < best.d) best = { x, y, d };
        }
      }
      a.kamera.zoom = 2;
      a.blickAuf(best.x, best.y);
      return best;
    });
    // Die Krone: anderthalb Felder ueber dem Fuss. Der Boden dort ist ein
    // anderes Feld - vorher ging dieses an den Server.
    const krone = await anna.evaluate(({ x, y }) => {
      const a = window.ansicht;
      const p = a.zuBild(x, y);
      const punkt = { x: p.x, y: p.y - 22 * a.kamera.zoom * 1.5 };
      const boden = a.zuWelt(punkt.x, punkt.y);
      // Gras davor, mit zwei Feldern Gras ringsum und ohne Schaf.
      const g = a.karte.groesse;
      const leer = (fx, fy) => {
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) if (a.karte.felder[(fy + dy) * g + fx + dx] !== 0) return false;
        }
        return ![...a.tiere.values()].some((t) => Math.hypot(t.x - fx, t.y - fy) < 2.5)
          && ![...a.gebaeude.values()].some((b) => Math.hypot(a.gebaeudeMitte(b).x - fx, a.gebaeudeMitte(b).y - fy) < 5);
      };
      let gras = null;
      for (let r = 3; r < 9 && !gras; r++) {
        for (let d = 0; d <= r && !gras; d++) if (leer(x + r, y + d)) gras = a.zuBild(x + r, y + d); else if (leer(x + d, y + r)) gras = a.zuBild(x + d, y + r);
      }
      return { ...punkt, boden: { x: Math.round(boden.x), y: Math.round(boden.y) }, gras };
    }, baum);
    expect(krone.boden, 'unter der Krone liegt ein anderes Feld').not.toEqual({ x: baum.x, y: baum.y });
    expect(krone.gras, 'Gras vor dem Wald').not.toBeNull();
    const rand = await anna.locator('#brett').boundingBox();

    // Ueber Gras: kein Wort am Zeiger.
    await anna.mouse.move(rand.x + krone.gras.x, rand.y + krone.gras.y, { steps: 3 });
    await anna.waitForTimeout(150);
    expect(await zeigerZiel()).toBeNull();
    // Ueber der Krone: das Wort und die Raute um diesen Baum.
    await anna.mouse.move(rand.x + krone.x, rand.y + krone.y, { steps: 3 });
    await expect.poll(zeigerZiel).toMatchObject({ art: 'sammeln', text: 'Holz hacken', x: baum.x, y: baum.y });
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-52',
      titel: 'Ein Dorfbewohner gewaehlt, der Zeiger ueber einer Baumkrone: am Zeiger steht Holz hacken, die goldene Raute liegt um den Fuss dieses Baums',
      test: info,
    });

    await anna.mouse.click(rand.x + krone.x, rand.y + krone.y, { button: 'right' });
    const zeichen = await anna.evaluate(() => window.ansicht.zielzeichen && { ...window.ansicht.zielzeichen });
    expect(zeichen).toMatchObject({ x: baum.x, y: baum.y, arbeit: true, feindlich: false });

    // Er hackt an diesem Baum, nicht irgendwo.
    await zeitraffer(anna, code, 4);
    await anna.waitForFunction(({ id, baum: b }) => {
      const e = window.ansicht.nachher.get(id);
      return e && e.w && e.l >= 1 && e.a === 'h' && Math.hypot(e.x - b.x, e.y - b.y) <= 1.6;
    }, { id: holzfaeller, baum }, { timeout: 40_000 });
    await zeitraffer(anna, code, 1);
    // Ohne Auswahl sagt der Zeiger nichts.
    await waehlen(anna, []);
    await anna.mouse.move(rand.x + krone.x + 1, rand.y + krone.y, { steps: 2 });
    await anna.waitForTimeout(150);
    expect(await zeigerZiel()).toBeNull();
  });

  test('einheiten AC-56: mit Holz auf dem Ruecken das Dach des Dorfzentrums geklickt - er laedt ab und hackt weiter', async ({}, info) => {
    await waehlen(anna, [holzfaeller]);
    await zurBasis(2);
    const dach = await anna.evaluate(() => {
      const a = window.ansicht;
      const dz = [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'dorfzentrum');
      const m = a.gebaeudeMitte(dz);
      const p = a.zuBild(m.x, m.y);
      return { x: p.x, y: p.y - 22 * a.kamera.zoom * 2.5 };
    });
    const rand = await anna.locator('#brett').boundingBox();
    await anna.mouse.move(rand.x + dach.x, rand.y + dach.y, { steps: 3 });
    await expect.poll(zeigerZiel).toMatchObject({ art: 'abladen', text: 'Abladen' });
    await anna.waitForTimeout(100);
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-56',
      titel: 'Ein Dorfbewohner mit Holz gewaehlt, der Zeiger auf dem Dach des Dorfzentrums: am Zeiger steht Abladen, die Raute liegt um das ganze Gebaeude',
      test: info,
    });

    const holz = async () => Number(await anna.locator('[data-rohstoff="holz"] b').textContent());
    // Mitten im Hacken, der Korb noch lange nicht voll: von selbst ginge er jetzt nicht.
    await anna.waitForFunction((id) => {
      const e = window.ansicht.nachher.get(id);
      return e && e.w && e.l >= 1 && e.l <= 6;
    }, holzfaeller, { timeout: 40_000 });
    const vorher = await holz();
    const getragen = await anna.evaluate((id) => window.ansicht.nachher.get(id).l, holzfaeller);
    await anna.mouse.click(rand.x + dach.x, rand.y + dach.y, { button: 'right' });
    await zeitraffer(anna, code, 4);
    await expect.poll(holz, { timeout: 30_000 }).toBeGreaterThanOrEqual(vorher + getragen);
    expect(await holz(), 'abgeladen, bevor der Korb voll war').toBeLessThan(vorher + 10);
    // Und zurueck an denselben Baum.
    await anna.waitForFunction(({ id, baum: b }) => {
      const e = window.ansicht.nachher.get(id);
      return e && e.w && e.a === 'h' && e.l >= 1 && Math.hypot(e.x - b.x, e.y - b.y) <= 2.6;
    }, { id: holzfaeller, baum }, { timeout: 40_000 });
    await zeitraffer(anna, code, 1);
    await anna.mouse.move(700, 300);
  });

  test('bedienung AC-53: ein Rechtsklick auf die Uebersichtskarte schickt den Reiter, die Kamera bleibt', async ({}, info) => {
    await zurBasis(1.4);
    const reiter = await anna.evaluate(() => {
      const a = window.ansicht;
      const e = [...a.nachher.values()].find((x) => x.b === a.ich && a.arten[x.k] !== 'dorfbewohner');
      return { i: e.i, x: e.x, y: e.y };
    });
    await waehlen(anna, [reiter.i]);
    const kamera = () => anna.evaluate(() => ({ x: window.ansicht.kamera.x, y: window.ansicht.kamera.y }));
    const vorher = await kamera();
    const karte = await anna.locator('#uebersicht').boundingBox();
    const klick = { x: karte.x + karte.width * 0.5, y: karte.y + karte.height * 0.5 };
    await zeichenHalten(anna);
    await anna.mouse.click(klick.x, klick.y, { button: 'right' });
    // Der Ring steht auf der Uebersicht, wo geklickt wurde - fuer das Bild angehalten.
    await anna.evaluate(() => { window.ansicht.zielzeichen.seit = performance.now() + 60_000; });
    await anna.waitForFunction(() => window.uebersicht.zielpunkt);
    const ring = await anna.evaluate(() => window.uebersicht.zielpunkt);
    expect(Math.hypot(ring.x - karte.width * 0.5, ring.y - karte.height * 0.5), 'der Ring am Klick').toBeLessThan(4);
    expect(ring.feindlich).toBe(false);
    expect(await kamera(), 'die Kamera springt nicht').toEqual(vorher);

    // Er geht los, auf die Mitte der Karte zu.
    const mitte = await anna.evaluate(() => window.ansicht.karte.groesse / 2);
    const weite = (e) => Math.hypot(e.x - mitte, e.y - mitte);
    await zeitraffer(anna, code, 4);
    await expect.poll(async () => weite(reiter) - weite(await anna.evaluate((id) => {
      const e = window.ansicht.nachher.get(id);
      return { x: e.x, y: e.y };
    }, reiter.i)), { timeout: 20_000 }).toBeGreaterThan(4);
    await zeitraffer(anna, code, 1);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-53',
      titel: 'Rechtsklick in die Mitte der Uebersichtskarte: dort steht der weisse Ring, der Reiter ist unterwegs, das Bild zeigt weiter das Dorf',
      test: info,
    });
    await anna.evaluate(() => { window.ansicht.zielzeichen = null; });
  });

  test('bedienung AC-30: neben einer Baustelle, von der erst das Fundament steht, bleibt der Dorfbewohner, wie er ist', async ({}, info) => {
    const basis = await zurBasis(2);
    await rohstoffe(anna, code, 'Anna', { holz: 600 });
    await waehlen(anna, [dorf[2]]);
    await expect(anna.locator('[data-bauen="kaserne"]')).toHaveAttribute('aria-disabled', 'false');
    await anna.locator('[data-bauseite="1"]').click();
    await anna.locator('[data-bauen="kaserne"]').click();
    const platz = await platzImBild(anna, { n: 3, um: basis, abstand: 6 });
    expect(platz, 'ein freier Platz im Bild').not.toBeNull();
    await anna.mouse.move(platz.bild.x, platz.bild.y, { steps: 4 });
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzLage()?.taugt)).toBe(true);
    await anna.mouse.click(platz.bild.x, platz.bild.y);
    await anna.waitForFunction(() => [...window.ansicht.gebaeude.values()].some((g) => g.b === window.ansicht.ich && g.art === 'kaserne'));
    // Der Bauer geht nicht hin: die Baustelle soll ein Fundament bleiben.
    await zentrumWaehlen();
    const stelle = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = [...a.gebaeude.values()].find((x) => x.b === a.ich && x.art === 'kaserne');
      const m = a.gebaeudeMitte(g);
      return { i: g.i, x: m.x, y: m.y };
    });
    // Vier Dorfbewohner dahinter - im Bild ueber dem Fundament.
    const vorher = await anna.evaluate(() => [...window.ansicht.nachher.keys()]);
    await einheitenAufstellen(anna, code, 'Anna', 4, { art: 'dorfbewohner', x: Math.round(stelle.x) - 1, y: Math.round(stelle.y) - 1 });
    await anna.waitForFunction((alt) => [...window.ansicht.nachher.keys()].filter((i) => !alt.includes(i)).length >= 4, vorher);
    await anna.waitForTimeout(400);
    const lage = await anna.evaluate(({ alt, stelle: s }) => {
      const a = window.ansicht;
      const g = a.gebaeude.get(s.i);
      const neue = [...a.nachher.values()].filter((e) => !alt.includes(e.i));
      const deckt = (e) => a.deckendeGebaeude(e, a.zuBild(e.x, e.y)).some((x) => x.i === s.i);
      const jetzt = neue.filter(deckt).length;
      // Gegenprobe im selben Augenblick: staende dieselbe Kaserne fertig da,
      // laege ihr Bild ueber diesen Dorfbewohnern.
      const u = g.u;
      g.u = 1;
      const fertig = neue.filter(deckt).map((e) => e.i);
      g.u = u;
      return { u, jetzt, fertig, umrisse: a.umrisse.filter((i) => fertig.includes(i)) };
    }, { alt: vorher, stelle });
    expect(lage.u, 'erst das Fundament').toBeLessThan(0.5);
    expect(lage.fertig.length, 'hinter der fertigen Kaserne staenden sie verdeckt').toBeGreaterThan(0);
    expect(lage.jetzt, 'das Fundament verdeckt niemanden').toBe(0);
    expect(lage.umrisse, 'und keiner traegt den Umriss').toEqual([]);
    await anna.mouse.move(700, 300);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-30',
      titel: 'Vier Dorfbewohner hinter dem Fundament einer Kaserne: keiner ist blau eingefaerbt, das Fundament verdeckt niemanden',
      test: info,
    });
  });

  test('bedienung AC-58: ein Klick auf Berts Reiter zeigt Namen, Besitzer und Leben - ohne Knoepfe, und befehlen laesst er sich nicht', async ({}, info) => {
    const reiter = await anna.evaluate(() => {
      const a = window.ansicht;
      const e = [...a.nachher.values()].find((x) => x.b !== a.ich && a.arten[x.k] === 'spaeherreiter');
      a.ausgewaehlt = new Set();
      a.gewaehltesGebaeude = null;
      a.kamera.zoom = 2;
      a.blickAuf(e.x, e.y);
      const p = a.zuBild(e.x, e.y);
      return { i: e.i, px: p.x, py: p.y - a.figurenHoehe() * 0.6, angriff: a.werte.einheiten.spaeherreiter.angriff, leben: a.werte.einheiten.spaeherreiter.leben };
    });
    const rand = await anna.locator('#brett').boundingBox();
    await anna.mouse.click(rand.x + reiter.px, rand.y + reiter.py);
    const leiste = anna.locator('#auswahlleiste');
    await expect(leiste.locator('.auswahl-kopf strong')).toHaveText('Späherreiter');
    await expect(leiste.locator('.leben')).toHaveAttribute('data-leben', `${reiter.leben}/${reiter.leben}`);
    await expect(leiste.locator('#besitzer')).toHaveText('Bert – Gegner');
    await expect(leiste.locator('#kampfwerte')).toHaveAttribute('data-angriff', String(reiter.angriff));
    await expect(leiste.locator('button')).toHaveCount(0);
    expect(await anna.evaluate(() => window.ansicht.ausgewaehlt.size), 'in der Auswahl steht er nicht').toBe(0);

    // Wird er getroffen, geht das Leben in der Leiste mit.
    await lebenSetzen(anna, code, reiter.i, 20);
    await expect(leiste.locator('.leben')).toHaveAttribute('data-leben', `20/${reiter.leben}`);
    // Ein Rechtsklick befiehlt ihm nichts: kein Zeichen am Ziel, er bleibt, wo er ist.
    const vorher = await anna.evaluate((i) => {
      const a = window.ansicht;
      a.zielzeichen = null;
      const e = a.nachher.get(i);
      return { x: e.x, y: e.y };
    }, reiter.i);
    await anna.mouse.click(rand.x + reiter.px + 180, rand.y + reiter.py + 70, { button: 'right' });
    await anna.waitForTimeout(400);
    expect(await anna.evaluate(() => window.ansicht.zielzeichen)).toBeNull();
    expect(await anna.evaluate((i) => {
      const e = window.ansicht.nachher.get(i);
      return { x: e.x, y: e.y };
    }, reiter.i)).toEqual(vorher);
    await anna.mouse.move(rand.x + reiter.px + 180, rand.y + reiter.py - 160);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-58',
      titel: 'Berts Spaeherreiter angeklickt: gestrichelter Ring am Boden, in der Leiste Spaeherreiter mit 20 von 45 Leben, Bert als Gegner und keine Knoepfe',
      test: info,
    });

    // Ein fremdes Gebaeude ebenso.
    const zentrum = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = [...a.gebaeude.values()].find((x) => x.b !== a.ich && x.art === 'dorfzentrum');
      const m = a.gebaeudeMitte(g);
      a.blickAuf(m.x, m.y);
      const p = a.zuBild(m.x, m.y);
      return { px: p.x, py: p.y - 12, voll: a.gebaeudeLebenVoll(g) };
    });
    await anna.mouse.click(rand.x + zentrum.px, rand.y + zentrum.py);
    await expect(leiste.locator('.auswahl-kopf strong')).toHaveText('Dorfzentrum');
    await expect(leiste.locator('.leben')).toHaveAttribute('data-leben', `${zentrum.voll}/${zentrum.voll}`);
    await expect(leiste.locator('#besitzer')).toHaveText('Bert – Gegner');
    await expect(leiste.locator('button')).toHaveCount(0);
    expect(await anna.evaluate(() => window.ansicht.gewaehltesGebaeude), 'gewaehlt ist es nicht').toBeNull();

    // Esc beendet das Ansehen.
    await anna.keyboard.press('Escape');
    await expect(leiste).toBeHidden();
  });

  test('einheiten AC-57: ueber dem Aufstieg steht, dass der Spaeherreiter schneller wird',async ({}, info) => {
    await zurBasis(1.6);
    await zentrumWaehlen();
    const tafel = anna.locator('#knopftafel');
    await anna.locator('[data-aufstieg="feudalzeit"]').hover();
    await expect(tafel).toBeVisible();
    await expect(tafel).toContainText('Späherreiter: +0,35 Tempo');
    await nachweis(anna, {
      spec: EINHEITEN,
      ac: 'AC-57',
      titel: 'Die Maus ueber dem Aufstieg: in der Tafel steht Spaeherreiter plus 0,35 Tempo',
      test: info,
    });
    await anna.mouse.move(700, 300);
    await expect(tafel).toBeHidden();
    // Noch steht Anna in der Dunklen Zeit: der Reiter traegt den Wert der
    // Vorlage. Dass er nach dem Aufstieg 1,55 laeuft, misst
    // tests/strategie-zeitalter-wirkung.test.mjs.
    expect(await anna.evaluate(() => {
      const a = window.ansicht;
      const reiter = [...a.nachher.values()].find((e) => e.b === a.ich && a.arten[e.k] === 'spaeherreiter');
      return a.einheitenwert(reiter, 'tempo');
    })).toBeCloseTo(1.2, 3);
  });
});

test.describe('Rueckkehr aus dem Vorraum', () => {
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-66: das Menue oben rechts und mit F10 - und von dort in den Vorraum und wieder zurueck auf den Platz', async ({}, info) => {
    const { anna, bert, code } = partie;
    const ich = await anna.evaluate(() => window.ansicht.ich);
    const menue = anna.locator('#spielmenue');
    await expect(menue).toBeHidden();
    await expect(anna.locator('#menue')).toBeVisible();
    await expect(anna.locator('#menue')).toBeInViewport({ ratio: 1 });

    // F10 oeffnet und schliesst, Esc schliesst - und hebt dabei nichts auf.
    await anna.keyboard.press('F10');
    await expect(menue).toBeVisible();
    await anna.keyboard.press('F10');
    await expect(menue).toBeHidden();
    await anna.locator('#menue').click();
    await expect(menue).toBeVisible();
    await expect(menue.locator('button')).toHaveText(['Weiterspielen', 'Pause', 'Tasten und Ton', 'Technologiebaum', 'Vollbild (F11)', 'Zurück in den Vorraum']);
    await expect(anna.locator('#menueVorraumHinweis')).toContainText('wartet sie 30 Minuten');
    // Die Partie laeuft darunter weiter: die Uhr zaehlt.
    const uhr = () => anna.evaluate(() => window.ansicht.takt);
    const vorher = await uhr();
    await expect.poll(uhr).toBeGreaterThan(vorher);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-66',
      titel: 'Das Menü über dem Spielbild: Weiterspielen, Pause, Tasten und Ton, Zurück in den Vorraum — darunter, dass die Partie weiterläuft und wartet',
      test: info,
    });
    await anna.keyboard.press('Escape');
    await expect(menue).toBeHidden();

    // Tasten und Ton: die Uebersicht, die sonst `?` zeigt.
    await anna.locator('#menue').click();
    await anna.locator('#menueTasten').click();
    await expect(menue).toBeHidden();
    await expect(anna.locator('#tastenuebersicht')).toBeVisible();
    await anna.keyboard.press('Escape');
    await expect(anna.locator('#tastenuebersicht')).toBeHidden();

    // Pause aus dem Menue: beide sehen das Feld, Anna spielt weiter.
    await anna.locator('#menue').click();
    await anna.locator('#menuePause').click();
    await expect(anna.locator('#pausefeld')).toBeVisible();
    await expect(bert.locator('#pausefeld')).toBeVisible();
    await anna.locator('#pauseWeiter').click();
    await expect(anna.locator('#pausefeld')).toBeHidden();

    // Zurueck in den Vorraum: kein Spielbild mehr, keine Meldung "Verbindung
    // verloren", und die Partie steht dort zum Zurueckkehren.
    await anna.locator('#menue').click();
    await anna.locator('#menueVorraum').click();
    await expect(anna.locator('#vorraum')).toBeVisible();
    await expect(anna.locator('#spiel')).toBeHidden();
    await expect(anna.locator('#rueckkehr')).toBeVisible();
    await expect(anna.locator('#rueckkehrCode')).toHaveText(code);
    expect(await anna.evaluate(() => sessionStorage.getItem('platz')), 'der Platz dieses Fensters ist vergessen').toBeNull();
    // Bert spielt weiter - fuer ihn ist nichts vorbei.
    await expect(bert.locator('#abschluss')).toBeHidden();
    await expect(bert.locator('#verbindungweg')).toBeHidden();
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-66',
      titel: 'Nach Zurück in den Vorraum: der Vorraum, und darüber die Partie von eben mit Zurückkehren',
      test: info,
    });

    // Und wieder hinein, auf denselben Platz.
    await anna.locator('#rueckkehrJa').click();
    await expect(anna.locator('#brett')).toBeVisible();
    await anna.waitForFunction(() => window.ansicht?.nachher?.size > 0);
    expect(await anna.evaluate(() => window.ansicht.ich), 'derselbe Platz').toBe(ich);
    await expect(anna.locator('#spielmenue')).toBeHidden();
  });

  test('raeume AC-18: das Fenster war zu - der Vorraum bietet die Partie an, und eine Absage vergisst den Platz', async ({}, info) => {
    const { anna, code } = partie;
    const ich = await anna.evaluate(() => window.ansicht.ich);
    // Ein neues Fenster im selben Browser: kein Sitzungsspeicher, aber die
    // gemerkte Partie.
    const neu = await anna.context().newPage();
    await neu.goto('/');
    const angebot = neu.locator('#rueckkehr');
    await expect(angebot).toBeVisible();
    await expect(neu.locator('#rueckkehrCode')).toHaveText(code);
    // Von selbst geht es nicht zurueck: das erste Fenster spielt weiter.
    await expect(neu.locator('#spiel')).toBeHidden();
    await expect(anna.locator('#verbindungweg')).toBeHidden();
    await nachweis(neu, {
      spec: RAEUME,
      ac: 'AC-18',
      titel: 'Die Seite neu geoeffnet, waehrend die Partie laeuft: ueber dem Vorraum steht Du warst in der Partie mit Zurueckkehren und verwerfen',
      test: info,
    });

    await neu.locator('#rueckkehrJa').click();
    await expect(neu.locator('#brett')).toBeVisible();
    await neu.waitForFunction(() => window.ansicht?.nachher?.size > 0);
    expect(await neu.evaluate(() => window.ansicht.ich), 'derselbe Platz').toBe(ich);
    await expect(neu.locator('#rueckkehr')).toBeHidden();

    // Eine Partie, die es nicht mehr gibt: einmal die Absage, dann ist der
    // Platz vergessen - vorher kam sie bei jedem Neuladen wieder.
    const spaet = await anna.context().newPage();
    await spaet.addInitScript(() => {
      if (sessionStorage.getItem('gestellt')) return;
      sessionStorage.setItem('gestellt', '1');
      localStorage.setItem('letztePartie', JSON.stringify({ code: 'AAAEEE', token: 'x'.repeat(32), anzeige: 'AAA-EEE', zeit: Date.now() }));
    });
    await spaet.goto('/');
    await expect(spaet.locator('#rueckkehrCode')).toHaveText('AAA-EEE');
    await spaet.locator('#rueckkehrJa').click();
    await expect(spaet.getByText('Diese Partie gibt es nicht mehr.')).toBeVisible();
    await expect(spaet.locator('#rueckkehr')).toBeHidden();
    expect(await spaet.evaluate(() => localStorage.getItem('letztePartie'))).toBeNull();
    await spaet.reload();
    await expect(spaet.locator('#vorraum')).toBeVisible();
    await expect(spaet.locator('#rueckkehr')).toBeHidden();
    await expect(spaet.getByText('Diese Partie gibt es nicht mehr.')).toHaveCount(0);

    // Eine aeltere als eine halbe Stunde wird nicht angeboten, "verwerfen" vergisst sie.
    await spaet.evaluate(() => localStorage.setItem('letztePartie', JSON.stringify({ code: 'AAAEEE', token: 'x', anzeige: 'AAA-EEE', zeit: Date.now() - 31 * 60 * 1000 })));
    await spaet.reload();
    await expect(spaet.locator('#vorraum')).toBeVisible();
    await expect(spaet.locator('#rueckkehr')).toBeHidden();
    await spaet.evaluate(() => localStorage.setItem('letztePartie', JSON.stringify({ code: 'AAAEEE', token: 'x', anzeige: 'AAA-EEE', zeit: Date.now() })));
    await spaet.reload();
    await expect(spaet.locator('#rueckkehr')).toBeVisible();
    await spaet.locator('#rueckkehrNein').click();
    await expect(spaet.locator('#rueckkehr')).toBeHidden();
    expect(await spaet.evaluate(() => localStorage.getItem('letztePartie'))).toBeNull();
    await spaet.close();
    await neu.close();
  });
});

// Rueckmeldungen aus der Partie zu zweit (2026-11-15): "das PopUp ... am Ende
// des Spieles, hat jeweils unten nen Button der irgendwie heisst zruück zum
// Vorraum oder so, aber der tut nichts" - und: "dass der text z.B. bei meinen
// dorfbewohnern die gebaeudenamen so aussahen, als waeren sie markiert
// gewesen, so blau schattiert".
test.describe('Rueckmeldungen aus der Partie zu zweit', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-77: im Spielbild laesst sich nichts markieren - nicht mit Doppelklick auf den Namen, nicht mit einem Zug von der Karte ueber die Leiste', async ({}, info) => {
    const { anna } = partie;
    await anna.waitForFunction(() => window.ansicht?.laeuft && window.ansicht.nachher.size > 0);
    // Das Dorfzentrum gewaehlt: die Leiste steht voller Text.
    await anna.evaluate(() => {
      const a = window.ansicht;
      const dz = [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'dorfzentrum');
      a.ausgewaehlt = new Set();
      a.gewaehltesGebaeude = dz.i;
      a.beiAuswahl();
    });
    const kopf = anna.locator('#auswahlleiste .auswahl-kopf').first();
    await expect(kopf).toBeVisible();
    const markiert = () => anna.evaluate(() => String(window.getSelection()));

    // Doppelt und dreifach auf den Namen: sonst waere erst das Wort, dann die Zeile blau.
    await kopf.dblclick();
    expect(await markiert(), 'nach dem Doppelklick').toBe('');
    await kopf.click({ clickCount: 3 });
    expect(await markiert(), 'nach dem Dreifachklick').toBe('');
    // Gezogen: in der Leiste begonnen, quer durch sie hindurch.
    const rand = await anna.locator('#auswahlleiste').boundingBox();
    await anna.mouse.move(rand.x + 12, rand.y + 12);
    await anna.mouse.down();
    await anna.mouse.move(rand.x + rand.width - 12, rand.y + rand.height - 12, { steps: 8 });
    await anna.mouse.up();
    expect(await markiert(), 'nach dem Ziehen durch die Leiste').toBe('');
    // Und von der Karte aus in die Leiste hinein - so zieht man einen Rahmen zu weit.
    await anna.mouse.move(rand.x + rand.width / 2, rand.y - 220);
    await anna.mouse.down();
    await anna.mouse.move(rand.x + rand.width / 2 + 60, rand.y + rand.height / 2, { steps: 8 });
    await anna.mouse.up();
    expect(await markiert(), 'nach dem Rahmen bis in die Leiste').toBe('');
    // Auch die Punkteliste und die Rohstoffe oben.
    // Die Liste laesst Klicks zur Karte durch - also mit der Maus an ihrem Ort.
    const punkte = await anna.locator('#punkteliste').boundingBox();
    await anna.mouse.dblclick(punkte.x + punkte.width / 2, punkte.y + punkte.height / 2);
    expect(await markiert(), 'nach dem Doppelklick auf die Punkte').toBe('');

    // Das Dorfzentrum wieder gewaehlt (der Rahmen hat die Auswahl geaendert) - fuer das Bild.
    await anna.evaluate(() => {
      const a = window.ansicht;
      const dz = [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'dorfzentrum');
      a.ausgewaehlt = new Set();
      a.gewaehltesGebaeude = dz.i;
      a.beiAuswahl();
    });
    await anna.locator('#auswahlleiste .auswahl-kopf').first().dblclick();
    expect(await markiert()).toBe('');
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-77',
      titel: 'Nach einem Doppelklick auf den Namen in der Leiste: kein Wort ist blau hinterlegt',
      test: info,
    });
  });

  test('bedienung AC-66: an der Abschlusstafel fuehrt Zurück in den Vorraum mit der Maus dorthin - und bietet keine Rueckkehr mehr an', async ({}, info) => {
    const { anna, bert } = partie;
    // Bert gibt auf, die Partie ist vorbei.
    await bert.locator('#aufgeben').click();
    await bert.locator('#aufgebenJa').click();
    await expect(anna.locator('#abschluss')).toBeVisible({ timeout: 15_000 });
    await expect(anna.locator('#partieende')).toHaveText('Du hast gewonnen');
    const knopf = anna.locator('#abschlussVorraum');
    await expect(knopf).toBeVisible();
    await expect(knopf).toBeInViewport({ ratio: 1 });
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-66',
      titel: 'Die Abschlusstafel: unter den Zahlen Revanche und Zurück in den Vorraum',
      test: info,
    });
    // Unter dem Zeiger liegt der Knopf, nicht die Karte dahinter: die Tafel
    // laesst Klicks durch, und der Knopf tat deshalb nichts.
    const mitte = await knopf.boundingBox();
    const getroffen = await anna.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, { x: mitte.x + mitte.width / 2, y: mitte.y + mitte.height / 2 });
    expect(getroffen, 'was der Zeiger trifft').toBe('abschlussVorraum');
    await anna.mouse.click(mitte.x + mitte.width / 2, mitte.y + mitte.height / 2);
    await expect(anna.locator('#vorraum')).toBeVisible();
    await expect(anna.locator('#spiel')).toBeHidden();
    // Die Partie ist vorbei: zurueckzukehren gibt es nichts.
    await expect(anna.locator('#rueckkehr')).toBeHidden();
    // Bert sieht seine Tafel weiter, und auch sein Knopf fuehrt hinaus.
    await expect(bert.locator('#abschluss')).toBeVisible();
    await bert.locator('#abschlussVorraum').click();
    await expect(bert.locator('#vorraum')).toBeVisible();
  });
});
