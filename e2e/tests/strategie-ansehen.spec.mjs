// Vorraete ansehen (→ specs/10-strategie/bedienung.md AC-63).
//
// Rueckmeldung des Benutzers: "Auf Baum, Holz, Schafe, etc. kann man nicht
// draufklicken um zu sehen, wie viel noch da ist (v.a. tote schafe". Ein
// Klick auf einen Vorrat, ein fremdes Schaf oder einen Kadaver zeigt unten,
// was es ist und wie viel noch daran ist - angesehen wie Fremdes (AC-58),
// ohne Befehle.
//
// Gespielt wird aufgedeckt: dass der Server den Rest im Nebel verschweigt,
// prueft tests/strategie-ansehen.test.mjs.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test, zeitraffer } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';
const WALD = 1;
const GOLD = 4;

/**
 * Ein Punkt im Fenster, an dem ein Klick genau dieses Ding ansieht - gesucht
 * mit der Regel des Spiels selbst (`auswahlTreffen`), denn neben einem Baum
 * steht bald ein Dorfbewohner, und ein Klick auf dessen Koerper waehlte ihn.
 * `hoch`: wie viele Bildpunkte ueber dem Fuss es versucht wird.
 */
function punktFuer(seite, schluessel, id, hoch) {
  return seite.evaluate(([schluessel, id, hoch]) => {
    const a = window.ansicht;
    const g = a.karte.groesse;
    const ort = schluessel === 'v' ? { x: id % g, y: Math.floor(id / g) } : a.tiere.get(id);
    const fuss = a.zuBild(ort.x, ort.y);
    const merke = { aus: new Set(a.ausgewaehlt), gebaeude: a.gewaehltesGebaeude, an: a.angesehen };
    let treffer = null;
    for (const dy of hoch) {
      for (const dx of [0, -6, 6, -12, 12]) {
        const x = fuss.x + dx;
        const y = fuss.y - dy;
        a.auswahlTreffen({ vonX: x, vonY: y, bisX: x, bisY: y });
        if (a.angesehen?.[schluessel] === id && !a.ausgewaehlt.size && !a.gewaehltesGebaeude) treffer = { x, y };
        if (treffer) break;
      }
      if (treffer) break;
    }
    a.ausgewaehlt = merke.aus;
    a.gewaehltesGebaeude = merke.gebaeude;
    a.angesehen = merke.an;
    if (!treffer) return null;
    const r = a.leinwand.getBoundingClientRect();
    return { x: r.left + treffer.x, y: r.top + treffer.y };
  }, [schluessel, id, hoch]);
}

/** Auswahl leeren und auf ein Feld sehen. */
function blick(seite, ort, zoom = 2) {
  return seite.evaluate(([ort, zoom]) => {
    const a = window.ansicht;
    a.ausgewaehlt = new Set();
    a.gewaehltesGebaeude = null;
    a.angesehen = null;
    a.beiAuswahl();
    a.kamera.zoom = zoom;
    a.blickAuf(ort.x, ort.y - 0.6);
  }, [ort, zoom]);
}

/** Der naechste Vorrat dieser Art an Annas Dorf, mindestens fuenf Felder weg. */
function naechster(seite, art) {
  return seite.evaluate((art) => {
    const a = window.ansicht;
    const g = a.karte.groesse;
    const b = a.spieler.get(a.ich).basis;
    let bester = null;
    for (let i = 0; i < a.karte.felder.length; i++) {
      if (a.karte.felder[i] !== art) continue;
      const x = i % g;
      const y = Math.floor(i / g);
      const d = Math.hypot(x - b.x, y - b.y);
      if (d >= 5 && (!bester || d < bester.d)) bester = { i, x, y, d };
    }
    return bester;
  }, art);
}

/** Annas Dorfbewohner, der einem Ort am naechsten steht und nicht arbeitet - gewaehlt. */
function bauerWaehlen(seite, ort) {
  return seite.evaluate((ort) => {
    const a = window.ansicht;
    const frei = [...a.nachher.values()].filter((e) => e.b === a.ich && e.k === 'd' && !e.w && !e.s)
      .sort((p, q) => Math.hypot(p.x - ort.x, p.y - ort.y) - Math.hypot(q.x - ort.x, q.y - ort.y));
    if (!frei.length) return null;
    a.gewaehltesGebaeude = null;
    a.angesehen = null;
    a.ausgewaehlt = new Set([frei[0].i]);
    a.beiAuswahl();
    return frei[0].i;
  }, ort);
}

test.describe('Vorraete ansehen', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-63: ein Klick auf einen Baum zeigt „Baum“ und das Holz, das noch daran ist - und die Zahl faellt, waehrend ein Dorfbewohner hackt', async ({}, info) => {
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    const leiste = anna.locator('#auswahlleiste');
    const rest = leiste.locator('#vorratsrest');
    const baum = await naechster(anna, WALD);
    expect(baum, 'ein Baum am Dorf').not.toBeNull();

    // Der Aufbau nennt, wie voll ein Baum ist.
    const voll = await anna.evaluate((art) => window.ansicht.werte.vorrat[art], WALD);
    expect(voll).toEqual({ voll: 100, rohstoff: 'holz' });

    await blick(anna, baum);
    await expect(leiste).toBeHidden();
    const aufBaum = await punktFuer(anna, 'v', baum.i, [40, 70, 20, 100, 8]);
    expect(aufBaum, 'der Baum laesst sich treffen').not.toBeNull();
    await anna.mouse.click(aufBaum.x, aufBaum.y);

    // Unten: der Name, das Holz - und kein Knopf.
    await expect(leiste.locator('.auswahl-kopf strong')).toHaveText('Baum');
    await expect(rest).toHaveAttribute('data-rest', '100');
    await expect(rest).toHaveAttribute('data-ware', 'holz');
    await expect(rest.locator('.lebenszahl')).toHaveText('Holz: 100 von 100');
    await expect(leiste.locator('button')).toHaveCount(0);
    await expect(leiste.locator('#besitzer')).toHaveCount(0);
    // Angesehen, nicht gewaehlt - und der Server weiss, welches Feld.
    expect(await anna.evaluate((i) => {
      const a = window.ansicht;
      return { ring: a.siehtAn('v', i), gewaehlt: a.ausgewaehlt.size, gemeldet: a.gemeldetesFeld };
    }, baum.i)).toEqual({ ring: true, gewaehlt: 0, gemeldet: baum.i });

    // Ein Dorfbewohner hackt an genau diesem Baum.
    const bauer = await bauerWaehlen(anna, baum);
    expect(bauer).not.toBeNull();
    await anna.mouse.click(aufBaum.x, aufBaum.y, { button: 'right' });
    await zeitraffer(anna, code, 4);
    await expect.poll(() => anna.evaluate((id) => window.ansicht.nachher.get(id)?.w, bauer), { timeout: 20_000 }).toBe(1);
    await anna.keyboard.press('Escape');
    await expect(leiste).toBeHidden();

    // Wieder hingesehen: die Zahl faellt.
    const wieder = await punktFuer(anna, 'v', baum.i, [40, 70, 20, 100, 8, 55, 85]);
    expect(wieder, 'der Baum laesst sich neben dem Dorfbewohner treffen').not.toBeNull();
    await anna.mouse.click(wieder.x, wieder.y);
    await expect(leiste.locator('.auswahl-kopf strong')).toHaveText('Baum');
    const zahl = async () => Number(await rest.getAttribute('data-rest'));
    await expect.poll(zahl, { timeout: 20_000 }).toBeLessThan(97);
    await zeitraffer(anna, code, 0);
    await anna.waitForTimeout(400);
    const jetzt = await zahl();
    expect(jetzt).toBeGreaterThan(50);
    await expect(rest.locator('.lebenszahl')).toHaveText(`Holz: ${jetzt} von 100`);
    // Der Balken ist so breit wie der Rest.
    expect(await rest.locator('.restbalken > span').evaluate((e) => e.style.width)).toBe(`${jetzt}%`);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-63',
      titel: 'Ein Baum angesehen, an dem ein Dorfbewohner hackt: gestrichelter Ring am Fuß, unten „Baum“ und wie viel Holz noch daran ist',
      test: info,
    });
    await zeitraffer(anna, code, 1);
  });

  test('bedienung AC-63: ein erlegtes Schaf zeigt, wie viel Nahrung noch daran ist; das eigene lebende wird weiter gewaehlt, das fremde angesehen', async ({}, info) => {
    const { anna, code } = partie;
    const leiste = anna.locator('#auswahlleiste');
    const rest = leiste.locator('#vorratsrest');
    const besitzer = leiste.locator('#besitzer');
    const schaf = await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      const eigene = [...a.tiere.values()].filter((t) => t.b === a.ich && !t.g)
        .sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y));
      return eigene[0] && { i: eigene[0].i, x: eigene[0].x, y: eigene[0].y };
    });
    expect(schaf, 'Anna hat ein Schaf').toBeTruthy();
    await blick(anna, schaf);
    const aufSchaf = await anna.evaluate((id) => {
      const a = window.ansicht;
      const t = a.tiere.get(id);
      const p = a.zuBild(t.x, t.y);
      const r = a.leinwand.getBoundingClientRect();
      return { x: r.left + p.x, y: r.top + p.y - a.figurenHoehe() * 0.3 };
    }, schaf.i);

    // Lebend und eigen: gewaehlt wie bisher (einheiten AC-22), nicht angesehen.
    await anna.mouse.click(aufSchaf.x, aufSchaf.y);
    expect(await anna.evaluate((id) => {
      const a = window.ansicht;
      return { gewaehlt: a.ausgewaehlt.has(id), angesehen: a.angesehen };
    }, schaf.i)).toEqual({ gewaehlt: true, angesehen: null });

    // Ein Dorfbewohner schlachtet es.
    const bauer = await bauerWaehlen(anna, schaf);
    expect(bauer).not.toBeNull();
    await anna.mouse.click(aufSchaf.x, aufSchaf.y, { button: 'right' });
    await zeitraffer(anna, code, 4);
    await anna.waitForFunction((id) => window.ansicht.tiere.get(id)?.g, schaf.i, { timeout: 30_000 });
    await anna.keyboard.press('Escape');

    // Der Kadaver: angesehen, mit Nahrung und Besitzer.
    const aufKadaver = await punktFuer(anna, 't', schaf.i, [12, 6, 18, 2, 24]);
    expect(aufKadaver, 'der Kadaver laesst sich treffen').not.toBeNull();
    await anna.mouse.click(aufKadaver.x, aufKadaver.y);
    await expect(leiste.locator('.auswahl-kopf strong')).toHaveText('Erlegtes Schaf');
    await expect(rest).toHaveAttribute('data-ware', 'nahrung');
    await expect(besitzer).toHaveText('Anna – deins');
    await expect(leiste.locator('button')).toHaveCount(0);
    const zahl = async () => Number(await rest.getAttribute('data-rest'));
    await expect.poll(zahl, { timeout: 20_000 }).toBeLessThan(96);
    await zeitraffer(anna, code, 0);
    await anna.waitForTimeout(400);
    const jetzt = await zahl();
    expect(jetzt).toBeGreaterThan(20);
    await expect(rest.locator('.lebenszahl')).toHaveText(`Nahrung: ${jetzt} von 100`);
    expect(await anna.evaluate((id) => window.ansicht.siehtAn('t', id), schaf.i)).toBe(true);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-63',
      titel: 'Ein erlegtes Schaf angesehen: gestrichelt umrandet, unten „Erlegtes Schaf“, die Nahrung, die noch daran ist, und wem es gehört',
      test: info,
    });
    await zeitraffer(anna, code, 1);

    // Berts Schaf lebt: angesehen, voll, mit seinem Namen.
    const fremdes = await anna.evaluate(() => {
      const a = window.ansicht;
      const t = [...a.tiere.values()].find((x) => x.b !== a.ich && !x.g);
      return t && { i: t.i, x: t.x, y: t.y };
    });
    expect(fremdes, 'Bert hat ein Schaf').toBeTruthy();
    await blick(anna, fremdes);
    const aufFremdes = await punktFuer(anna, 't', fremdes.i, [12, 6, 18, 2, 24]);
    expect(aufFremdes).not.toBeNull();
    await anna.mouse.click(aufFremdes.x, aufFremdes.y);
    await expect(leiste.locator('.auswahl-kopf strong')).toHaveText('Schaf');
    await expect(rest.locator('.lebenszahl')).toHaveText('Nahrung: 100 von 100');
    await expect(besitzer).toHaveText('Bert – Gegner');

    // Gold: ein anderer Name, eine andere Menge - und der Server nennt jetzt dieses Feld.
    const gold = await naechster(anna, GOLD);
    expect(gold).not.toBeNull();
    await blick(anna, gold);
    const aufGold = await punktFuer(anna, 'v', gold.i, [10, 20, 4, 30]);
    expect(aufGold).not.toBeNull();
    await anna.mouse.click(aufGold.x, aufGold.y);
    await expect(leiste.locator('.auswahl-kopf strong')).toHaveText('Goldvorkommen');
    await expect(rest.locator('.lebenszahl')).toHaveText('Gold: 800 von 800');
    expect(await anna.evaluate(() => window.ansicht.gemeldetesFeld)).toBe(gold.i);

    // Esc: nichts mehr angesehen, die Leiste ist weg, und der Server schweigt wieder.
    await anna.keyboard.press('Escape');
    await expect(leiste).toBeHidden();
    await expect.poll(() => anna.evaluate(() => {
      const a = window.ansicht;
      return { gemeldet: a.gemeldetesFeld, rest: a.vorratRest };
    })).toEqual({ gemeldet: null, rest: null });
  });
});
