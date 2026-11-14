// Zoomen ohne Stocken (→ specs/10-strategie/darstellung.md AC-27).
//
// Rueckmeldung des Benutzers aus dem Spiel auf dem Server: "jetzt ruckelts
// langsam schon relativ stark" - "v.a. wenn ich rein und rauszoome, ansonsten
// nicht". Gemessen in dieser Szene (2026-11-14, vor dem Umbau): jeder Dreh am
// Rad kostete ein Bild von 43 bis 107 ms, auch beim zehnten Mal, und der
// Wechsel der Bodenaufloesung eines von 274 bis 368 ms.
//
// Drei Ursachen, drei Pruefungen:
// 1. Der Zoom lief nach einem Anschlag auf einem anderen Raster, und jedes
//    Bild im Speicher war das falsche → das Rad geht in elf festen Stufen.
// 2. Die Speicher zaehlten Stuecke und warfen das zuerst Gezeichnete hinaus
//    → auf dem Rueckweg durch alle Stufen wird kein Stueck neu gezeichnet.
// 3. Alle Bodenkacheln einer neuen Aufloesung entstanden in einem Bild →
//    solange gedreht wird, keine, danach eine je Bild.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, gebaeudeAufstellen, test, vorratLeeren, zeitraffer } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit, WALDFELD } from '../helpers/strategie.mjs';

const DARSTELLUNG = '10-strategie/darstellung.md';
const STUFEN = [0.4, 0.5, 0.6, 0.7, 0.85, 1, 1.2, 1.5, 1.8, 2.1, 2.5];

test.describe('Zoomen ohne Stocken', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('darstellung AC-27: das Rad geht in elf festen Stufen, auf dem Rueckweg wird kein Stueck neu gezeichnet, und der Boden schaerft nach, statt das Bild anzuhalten', async ({}, info) => {
    test.setTimeout(240_000);
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);

    // Die Szene des Tempotests (darstellung AC-10): rund dreissig Haeuser und
    // hundert Dorfbewohner um Annas Dorf.
    await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 1;
      a.blickAuf(b.x + 3, b.y + 3);
    });
    const plaetze = await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      const liste = [];
      for (let dy = -10; dy <= 16; dy += 3) {
        for (let dx = -12; dx <= 16; dx += 3) {
          if (a.platzTaugt('haus', b.x + dx, b.y + dy)) liste.push({ x: b.x + dx, y: b.y + dy });
        }
      }
      return liste;
    });
    let gebaut = 0;
    for (const p of plaetze) {
      if (gebaut >= 29) break;
      // Zwei Plaetze koennen sich ueberschneiden - dann lehnt der Server den zweiten ab.
      await gebaeudeAufstellen(anna, code, 'Anna', 'haus', p.x, p.y).then(() => { gebaut += 1; }, () => {});
    }
    expect(gebaut, 'Haeuser um das Dorf').toBeGreaterThanOrEqual(20);
    expect(await einheitenAufstellen(anna, code, 'Anna', 96)).toBe(96);
    await anna.waitForFunction(() => window.ansicht.nachher.size >= 104, null, { timeout: 15_000 });
    // Die Welt steht: was im Bild ist, aendert sich nur noch durch das Rad.
    await zeitraffer(anna, code, 0);
    await anna.waitForTimeout(1200);

    // Mitschreiben: je Bild die Zeit in zeichnen(), der Zoom, wie viele
    // Kacheln nur als Ersatz liegen und wie viele neu gerechnet wurden.
    await anna.evaluate(async () => {
      const { Bildspeicher } = await import('/bildspeicher.js');
      const a = window.ansicht;
      const kacheln = Bildspeicher.alle.get('kacheln');
      const alt = a.zeichnen.bind(a);
      window.speicher = Bildspeicher.alle;
      window.mitschrift = [];
      window.raddrehs = 0;
      a.leinwand.addEventListener('wheel', () => { window.raddrehs += 1; });
      a.zeichnen = (jetzt) => {
        const vorher = kacheln.abgelegt;
        const s = performance.now();
        alt(jetzt);
        window.mitschrift.push({ zoom: a.kamera.zoom, ms: performance.now() - s, fehlen: a.kachelnFehlen, neu: kacheln.abgelegt - vorher, drehs: window.raddrehs });
      };
    });
    const stand = () => anna.evaluate(() => Object.fromEntries([...window.speicher.values()]
      .map((s) => [s.name, { neu: s.abgelegt, raus: s.verworfen, zahl: s.zahl, mio: Math.round(s.punkte / 1e5) / 10 }])));
    const zoom = () => anna.evaluate(() => window.ansicht.kamera.zoom);
    /** Einmal am Rad drehen (1 hinein, -1 hinaus) und warten, bis der Dreh angekommen ist. */
    const drehen = async (richtung) => {
      const bisher = await anna.evaluate(() => window.raddrehs);
      await anna.mouse.wheel(0, -100 * richtung);
      await anna.waitForFunction((n) => window.raddrehs > n, bisher);
      return zoom();
    };
    /** Warten, bis ein Bild nach dem letzten Dreh ganz ohne Ersatz auskam. */
    const scharfWarten = () => anna.waitForFunction(() => {
      const a = window.ansicht;
      const letztes = window.mitschrift.at(-1);
      return !a.zoomt && a.scharf && letztes && letztes.zoom === a.kamera.zoom && letztes.drehs === window.raddrehs;
    }, null, { timeout: 30_000 });
    await anna.mouse.move(700, 480);

    // ---- 3. Der Boden: solange gedreht wird, entsteht keine Kachel ----------
    // Zweimal gedreht, von 1 auf 1,5: dort liegt der Boden in doppelter
    // Aufloesung, und davon gibt es noch keine einzige Kachel - die Partie
    // beginnt naeher als 1, deshalb wird der Speicher vorher geleert.
    await anna.evaluate(() => {
      window.ansicht.kacheln.leeren();
      window.ansicht.kachelnVeraltet.clear();
    });
    await anna.waitForTimeout(400);
    const dreh = await anna.evaluate(async () => {
      const a = window.ansicht;
      const kacheln = window.speicher.get('kacheln');
      const doppelte = () => [...kacheln.bilder.keys()].filter((k) => k.startsWith('2|')).length;
      const vorher = { neu: kacheln.abgelegt, doppelte: doppelte(), bilder: window.mitschrift.length };
      const r = a.leinwand.getBoundingClientRect();
      const rad = () => a.leinwand.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, clientX: r.left + 700, clientY: r.top + 480, bubbles: true, cancelable: true }));
      rad();
      rad();
      const bild = () => new Promise((fertig) => { requestAnimationFrame(fertig); });
      await bild();
      await bild();
      return {
        vorher,
        zoom: a.kamera.zoom,
        fehlen: a.kachelnFehlen,
        neu: kacheln.abgelegt - vorher.neu,
        scharf: a.scharf,
        ms: Math.max(...window.mitschrift.slice(vorher.bilder).map((b) => b.ms)),
      };
    });
    expect(dreh.vorher.doppelte, 'vor dem Dreh gibt es keine Kachel in doppelter Aufloesung').toBe(0);
    expect(dreh.zoom).toBe(1.5);
    expect(dreh.fehlen, 'nach dem Dreh liegen die Kacheln von eben vergroessert da').toBeGreaterThanOrEqual(4);
    expect(dreh.neu, 'und keine ist neu gerechnet').toBe(0);
    expect(dreh.scharf).toBe(false);
    // Danach schaerft das Bild nach: hoechstens eine Kachel je Bild.
    await scharfWarten();
    const geschaerft = await anna.evaluate((ab) => {
      const bilder = window.mitschrift.slice(ab);
      const kacheln = window.speicher.get('kacheln');
      return {
        neu: bilder.reduce((s, b) => s + b.neu, 0),
        jeBild: Math.max(...bilder.map((b) => b.neu)),
        bilder: bilder.length,
        laengstes: Math.max(...bilder.map((b) => b.ms)),
        doppelte: [...kacheln.bilder.keys()].filter((k) => k.startsWith('2|')).length,
        fehlen: window.ansicht.kachelnFehlen,
      };
    }, dreh.vorher.bilder);
    console.log(`Boden: ${dreh.fehlen} Kacheln als Ersatz, laengstes Bild direkt nach dem Dreh ${dreh.ms.toFixed(0)} ms; nachgeschaerft in ${geschaerft.bilder} Bildern, laengstes ${geschaerft.laengstes.toFixed(0)} ms`);
    expect(geschaerft.jeBild, 'nie mehr als eine neue Kachel in einem Bild').toBe(1);
    expect(geschaerft.neu, 'jede Kachel im Bild ist neu gerechnet').toBeGreaterThanOrEqual(dreh.fehlen);
    expect(geschaerft.doppelte).toBe(geschaerft.neu);
    expect(geschaerft.fehlen).toBe(0);

    // ---- 1. Feste Stufen --------------------------------------------------
    // Hinein bis an den Anschlag und einen Dreh darueber hinaus, hinaus bis an
    // den anderen und darueber hinaus, dann zurueck auf 1 - und jede Stufe
    // einmal ganz scharf, damit sie im Speicher liegt.
    const gesehen = [];
    const fahrt = async (richtung, drehs) => {
      for (let i = 0; i < drehs; i++) {
        gesehen.push(await drehen(richtung));
        await scharfWarten();
      }
    };
    await fahrt(1, 4);
    await fahrt(-1, 11);
    await fahrt(1, 5);
    expect(gesehen).toEqual([
      1.8, 2.1, 2.5, 2.5,
      2.1, 1.8, 1.5, 1.2, 1, 0.85, 0.7, 0.6, 0.5, 0.4, 0.4,
      0.5, 0.6, 0.7, 0.85, 1,
    ]);
    expect([...new Set(gesehen)].sort((x, y) => x - y), 'nur die elf Stufen').toEqual(STUFEN);
    const kalt = await stand();

    // ---- 2. Der Rueckweg: nichts wird neu gezeichnet -----------------------
    // Dieselbe Fahrt noch einmal, zuegig: ein Dreh alle hundert Millisekunden.
    await anna.evaluate(() => { window.mitschrift.length = 0; });
    for (const [richtung, drehs] of [[-1, 5], [1, 10], [-1, 5]]) {
      for (let i = 0; i < drehs; i++) {
        await drehen(richtung);
        await anna.waitForTimeout(100);
      }
    }
    expect(await zoom()).toBe(1);
    await scharfWarten();
    const warm = await stand();
    const bilder = await anna.evaluate(() => window.mitschrift.map((b) => b.ms));
    const sortiert = [...bilder].sort((x, y) => x - y);
    const mittel = bilder.reduce((s, w) => s + w, 0) / bilder.length;
    console.log(`Speicher nach der ersten Fahrt: ${JSON.stringify(kalt)}`);
    console.log(`Speicher nach der zweiten:      ${JSON.stringify(warm)}`);
    console.log(`Zweite Fahrt: ${bilder.length} Bilder, Mittel ${mittel.toFixed(1)} ms, 95 % unter ${sortiert[Math.floor(sortiert.length * 0.95)].toFixed(0)} ms, laengstes ${sortiert.at(-1).toFixed(0)} ms`);
    for (const name of ['figuren', 'gebaeude', 'gelaende']) {
      expect(warm[name].neu, `${name}: auf dem Rueckweg neu gezeichnet`).toBe(kalt[name].neu);
      expect(warm[name].raus, `${name}: aus dem Speicher geworfen`).toBe(0);
    }
    expect(warm.kacheln.neu, 'auch keine Kachel').toBe(kalt.kacheln.neu);
    // Vor dem Umbau lag das Mittel dieser Fahrt bei 13 bis 21 ms, weil jeder
    // Dreh ein Bild von 43 bis 107 ms kostete; gemessen danach 6 bis 15.
    expect(mittel, 'mittlere Zeichenzeit je Bild in Millisekunden').toBeLessThan(25);

    // Ganz nah: alles steht scharf da.
    for (let i = 0; i < 5; i++) await drehen(1);
    expect(await zoom()).toBe(2.5);
    await scharfWarten();
    await anna.mouse.move(700, 900);
    await nachweis(anna, {
      spec: DARSTELLUNG,
      ac: 'AC-27',
      titel: 'Nach zwei Fahrten durch alle elf Zoomstufen ganz nah: Boden, Häuser und Dorfbewohner stehen scharf im Bild',
      test: info,
    });

    // ---- Ein Feld aendert sich: die Kacheln darum kommen nach und nach ------
    // Ein Baum faellt. Frueher flogen neun Kacheln hinaus und entstanden im
    // naechsten Bild alle neu; jetzt bleibt die alte liegen, bis ihre neue da ist.
    await zeitraffer(anna, code, 1);
    const baum = await anna.evaluate((wald) => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const b = a.spieler.get(a.ich).basis;
      let bester = null;
      for (let y = 4; y < g - 4; y++) {
        for (let x = 4; x < g - 4; x++) {
          if (a.karte.felder[y * g + x] !== wald) continue;
          const abstand = Math.hypot(x - b.x, y - b.y);
          if (!bester || abstand < bester.abstand) bester = { x, y, abstand };
        }
      }
      a.kamera.zoom = 1;
      a.blickAuf(bester.x, bester.y);
      return { x: bester.x, y: bester.y };
    }, WALDFELD);
    await anna.waitForTimeout(800);
    const vorFall = await anna.evaluate(() => ({ bilder: window.mitschrift.length, neu: window.speicher.get('kacheln').abgelegt }));
    await vorratLeeren(anna, code, baum.x, baum.y);
    await anna.waitForFunction(([b, wald]) => {
      const a = window.ansicht;
      return a.karte.felder[b.y * a.karte.groesse + b.x] !== wald;
    }, [baum, WALDFELD]);
    await anna.waitForFunction((neu) => window.ansicht.scharf && window.speicher.get('kacheln').abgelegt > neu, vorFall.neu, { timeout: 10_000 });
    await anna.waitForTimeout(500);
    const nachFall = await anna.evaluate((ab) => {
      const bilder = window.mitschrift.slice(ab);
      return { neu: bilder.reduce((s, b) => s + b.neu, 0), jeBild: Math.max(...bilder.map((b) => b.neu)), fehlen: window.ansicht.kachelnFehlen };
    }, vorFall.bilder);
    console.log(`Baum gefaellt: ${nachFall.neu} Kacheln neu, hoechstens ${nachFall.jeBild} in einem Bild`);
    expect(nachFall.neu, 'die Kacheln um den Baum sind neu gerechnet').toBeGreaterThanOrEqual(2);
    expect(nachFall.jeBild, 'eine je Bild').toBe(1);
    expect(nachFall.fehlen).toBe(0);
  });
});
