// Das Spielbild des Strategiespiels, zum ersten Mal im Browser gesehen
// (→ specs/10-strategie/bedienung.md, fahrplan.md AC-2).
//
// Zwei Fenster, Anna eroeffnet mit festem Startwert, Bert tritt bei, Anna
// startet. Die Faelle bauen aufeinander auf und laufen nacheinander.
//
// Die Leinwand laesst sich nicht befragen. Gelesen wird deshalb ueber
// `window.ansicht` (public/app.js); befohlen wird nur ueber Maus und Tastatur,
// so wie ein Mensch es tut.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test, zeitraffer } from '../helpers/seite.mjs';
import { eigeneImBild, partieBeenden, partieZuZweit, rahmenUmAlle, waldInDerNaehe } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';
const FAHRPLAN = '10-strategie/fahrplan.md';
const AUSWAHL = '00-plattform/spielauswahl.md';
const KARTE = '10-strategie/karte-und-vorraete.md';
const DARSTELLUNG = '10-strategie/darstellung.md';
const STARTWERT = 4711;

// `eigeneImBild`, `rahmenUmAlle` und `waldInDerNaehe` liegen in der Hilfe:
// seit Runde 82 braucht sie auch der Test des Abschlussbildes (spielziel AC-8).
const auswahl = (page) => page.evaluate(() => [...window.ansicht.ausgewaehlt]);

test.describe('Das Spielbild', () => {
  test.describe.configure({ mode: 'serial' });

  let partie;
  let anna;
  let bert;
  let code;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { startwert: STARTWERT });
    ({ anna, bert, code } = partie);
  });

  test.afterAll(() => partieBeenden(partie));

  test('auswahl AC-7: nach dem Start steht der Startwert der Karte im Bild', async ({}, info) => {
    await expect(anna.locator('#kartenwert')).toHaveText(`· Karte ${STARTWERT}`);
    await expect(bert.locator('#kartenwert')).toHaveText(`· Karte ${STARTWERT}`);
    await nachweis(bert, {
      spec: AUSWAHL,
      ac: 'AC-7',
      titel: 'Bert im Spiel: oben in der Leiste, rechts neben der Uhr, steht Karte 4711 - wiederholbar',
      test: info,
    });
  });

  test('bedienung AC-1: ein Rahmen waehlt die eigenen Einheiten darin', async ({}, info) => {
    const eigene = await rahmenUmAlle(anna, { offen: true });
    expect(eigene.length).toBe(4); // drei Dorfbewohner und ein Spaeherreiter (bauen AC-22)
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-1',
      titel: 'Anna zieht einen Rahmen um ihre vier Einheiten, noch mit gedrueckter Taste',
      test: info,
    });
    await anna.mouse.up();
    expect((await auswahl(anna)).sort()).toEqual(eigene.map((e) => e.id).sort());
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-1',
      titel: 'Losgelassen: alle vier stehen auf der weissen Auswahlellipse',
      test: info,
    });
  });

  test('bedienung AC-2: ein Klick waehlt genau eine', async ({}, info) => {
    const [erste] = await eigeneImBild(anna);
    await anna.mouse.click(erste.x + 2, erste.y + 1);
    expect(await auswahl(anna)).toEqual([erste.id]);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-2',
      titel: 'Ein Klick auf einen Dorfbewohner: nur er steht auf der Auswahlellipse',
      test: info,
    });
  });

  test('bedienung AC-8: das Rad zoomt, der Punkt unter dem Zeiger bleibt stehen', async ({}, info) => {
    const zeiger = { x: 900, y: 400 };
    const lesen = () => anna.evaluate(({ x, y }) => ({ welt: window.ansicht.zuWelt(x, y), zoom: window.ansicht.kamera.zoom }), zeiger);
    const vorher = await lesen();
    await anna.mouse.move(zeiger.x, zeiger.y);
    for (let i = 0; i < 3; i++) await anna.mouse.wheel(0, -100);
    await anna.waitForFunction((z) => window.ansicht.kamera.zoom > z * 1.5, vorher.zoom);
    const nachher = await lesen();
    expect(Math.abs(nachher.welt.x - vorher.welt.x)).toBeLessThan(0.01);
    expect(Math.abs(nachher.welt.y - vorher.welt.y)).toBeLessThan(0.01);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-8',
      titel: 'Dreimal am Rad gedreht: Felder und Sammler gross, derselbe Punkt unter dem Zeiger',
      test: info,
    });
    for (let i = 0; i < 3; i++) await anna.mouse.wheel(0, 100);
    await anna.waitForFunction((z) => Math.abs(window.ansicht.kamera.zoom - z) < 0.01, vorher.zoom);
  });

  test('bedienung AC-7: W A S D und Pfeiltasten schieben die Karte', async ({}, info) => {
    const start = await anna.evaluate(() => ({ ...window.ansicht.kamera }));
    await anna.keyboard.down('d');
    await anna.waitForFunction((x) => window.ansicht.kamera.x > x + 150, start.x);
    await anna.keyboard.up('d');
    await anna.keyboard.down('ArrowDown');
    await anna.waitForFunction((y) => window.ansicht.kamera.y > y + 150, start.y);
    await anna.keyboard.up('ArrowDown');
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-7',
      titel: 'Mit D und Pfeil runter verschoben: die eigene Basis ist nach links oben gewandert',
      test: info,
    });

    // Zurueck zur Basis, fuer die naechsten Faelle.
    await anna.keyboard.down('a');
    await anna.waitForFunction((x) => window.ansicht.kamera.x <= x, start.x);
    await anna.keyboard.up('a');
    await anna.keyboard.down('w');
    await anna.waitForFunction((y) => window.ansicht.kamera.y <= y, start.y);
    await anna.keyboard.up('w');
  });

  test('bedienung AC-12 / bedienung AC-16 / fahrplan AC-2: Rechtsklick auf den Wald, gesammelt wird sichtbar', async ({}, info) => {
    // Wie viel Holz vorher da ist: seit dem Startvorrat (karte AC-12) nicht null.
    const holzVorher = await anna.evaluate(() => window.ansicht.vorraete.holz);
    await rahmenUmAlle(anna);
    expect((await auswahl(anna)).length).toBe(4);

    // Rechts auf das Waldfeld, das der eigenen Basis am naechsten liegt.
    const wald = await waldInDerNaehe(anna);
    await anna.mouse.click(wald.x, wald.y, { button: 'right' });
    // Mit den Werten der Vorlage dauert eine volle Ladung Holz gut 25 Sekunden
    // (einheiten AC-15) - der Test laesst die Partie fuenfmal so schnell laufen.
    await zeitraffer(anna, code, 5);

    // Der Befehl hat gewirkt: Sammler tragen Holz.
    await anna.waitForFunction(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].some((e) => e.b === a.ich && e.l > 0 && e.a === 'h');
    }, null, { timeout: 20_000 });
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-12',
      titel: 'Nach einem Rechtsklick auf den Wald: die ausgewaehlten Sammler arbeiten dort',
      test: info,
    });
    // Fuer die Ladung ohne Auswahlring und naeher dran: ein Klick ins Leere
    // hebt die Auswahl auf, das Rad holt die Sammler heran.
    const leer = await anna.evaluate(() => window.ansicht.zuBild(window.ansicht.spieler.get(window.ansicht.ich).basis.x, window.ansicht.spieler.get(window.ansicht.ich).basis.y + 6));
    await anna.mouse.click(leer.x, leer.y);
    expect(await auswahl(anna)).toEqual([]);
    const mitte = await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      return a.zuBild(b.x + 2, b.y);
    });
    await anna.mouse.move(mitte.x, mitte.y);
    for (let i = 0; i < 5; i++) await anna.mouse.wheel(0, -100);
    await anna.waitForFunction(() => window.ansicht.kamera.zoom > 1.9);
    await anna.waitForFunction(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].filter((e) => e.b === a.ich && e.l > 0 && e.a === 'h').length >= 2;
    }, null, { timeout: 20_000 });
    // Der Blick auf den Traeger, nicht auf die Basis: herangeholt war das
    // Bild zwar, aber die Sammler standen am linken Rand und das Holzbuendel
    // war ein paar Bildpunkte gross (Rueckschau nach Runde 83). Und wer
    // hinter einem Gebaeude steht, ist nur ein Umriss - dann traegt er
    // sichtbar nichts, und die Unterschrift waere wieder falsch.
    await anna.waitForFunction(() => {
      const a = window.ansicht;
      const e = [...a.nachher.values()].find((f) => f.b === a.ich && f.l > 0 && f.a === 'h'
        && !(a.umrisse || []).includes(f.i));
      if (!e) return false;
      a.blickAuf(e.x, e.y);
      return true;
    }, null, { timeout: 20_000 });
    await anna.waitForTimeout(200);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-16',
      titel: 'Nah herangeholt: ein beladener Dorfbewohner am Waldrand traegt ein Holzbuendel auf dem Ruecken',
      test: info,
    });
    for (let i = 0; i < 5; i++) await anna.mouse.wheel(0, 100);
    await anna.waitForFunction(() => window.ansicht.kamera.zoom < 1.01);

    // Und das Holz kommt an - bei Anna im Vorrat, bei Bert sichtbar als Bewegung.
    // Gewartet wird, bis der Vorrat ueber dem Startwert steht - ein Muster wie
    // "Holz [1-9]" traefe schon den Startvorrat und bewiese nichts.
    await anna.waitForFunction((vorher) => window.ansicht.vorraete.holz > vorher, holzVorher, { timeout: 40_000 });
    // Und die Leiste zeigt es. Nicht "genau eine Ladung mehr": bis zum Ablesen
    // koennen weitere angekommen sein (unter Last gesehen: 250 statt 210).
    // Die Leiste zaehlt hoch (bedienung AC-17) - also warten, bis sie dort ist.
    await expect.poll(async () => Number(await anna.locator('[data-rohstoff="holz"] b').textContent()))
      .toBeGreaterThan(holzVorher);
    await nachweis(anna, {
      spec: FAHRPLAN,
      ac: 'AC-2',
      titel: 'Das erste Spielbild im Browser: Holz ist abgeliefert, oben steht mehr als die 200 vom Start',
      test: info,
    });
    await bert.waitForFunction(() => {
      const a = window.ansicht;
      return [...a.nachher.values()].some((e) => e.b !== a.ich && e.l > 0);
    });
    await zeitraffer(anna, code, 1);
  });

  test('bedienung AC-24: oben Holz, Nahrung, Gold, Stein und die Bevoelkerung', async ({}, info) => {
    const leiste = anna.locator('#vorraete');
    await expect(leiste).toBeInViewport();
    const stand = await anna.evaluate(() => window.ansicht.vorraete);
    // Die Leiste zeigt, was der Server schickt - bei ruhendem Stand genau das.
    await expect.poll(async () => ({
      holz: Number(await leiste.locator('[data-rohstoff="holz"] b').textContent()),
      nahrung: Number(await leiste.locator('[data-rohstoff="nahrung"] b').textContent()),
      gold: Number(await leiste.locator('[data-rohstoff="gold"] b').textContent()),
      stein: Number(await leiste.locator('[data-rohstoff="stein"] b').textContent()),
    })).toEqual({ holz: expect.any(Number), nahrung: stand.nahrung, gold: stand.gold, stein: stand.stein });
    await expect(leiste.locator('[data-rohstoff="bev"]')).toHaveText(new RegExp(`^\\s*${stand.bev}\\s*/\\s*${stand.raum}\\s*$`));
    expect(stand.bev).toBe(4);
    expect(stand.raum).toBe(5);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-24',
      titel: 'Oben links die Leiste: Holz, Nahrung, Gold, Stein mit Symbol und Zahl, dazu Bevoelkerung',
      test: info,
    });
  });

  test('bedienung AC-17: eine Lieferung zaehlt in der Leiste hoch, statt zu springen', async () => {
    // Bild fuer Bild mitschreiben, was die Leiste beim Holz zeigt.
    const vorher = await anna.evaluate(() => {
      const feld = document.querySelector('[data-rohstoff="holz"] b');
      window.holzFolge = [Number(feld.textContent)];
      const schreiben = () => {
        const wert = Number(feld.textContent);
        if (wert !== window.holzFolge.at(-1)) window.holzFolge.push(wert);
        window.holzSchreiber = requestAnimationFrame(schreiben);
      };
      schreiben();
      return window.ansicht.vorraete.holz;
    });
    await zeitraffer(anna, code, 5);
    await anna.waitForFunction((v) => window.ansicht.vorraete.holz > v, vorher, { timeout: 30_000 });
    await zeitraffer(anna, code, 1);
    const ziel = await anna.evaluate(() => window.ansicht.vorraete.holz);
    await anna.waitForFunction((z) => window.holzFolge.at(-1) >= z, ziel);
    const folge = await anna.evaluate(() => {
      cancelAnimationFrame(window.holzSchreiber);
      return window.holzFolge;
    });
    // Eine Ladung sind zehn: dazwischen muss die Leiste Zwischenwerte gezeigt
    // haben, und nie rueckwaerts.
    const zwischen = folge.filter((w) => w > vorher && w < vorher + 10);
    expect(zwischen.length, `gezeigt: ${folge.join(', ')}`).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < folge.length; i++) expect(folge[i]).toBeGreaterThan(folge[i - 1]);
  });

  test('karte AC-16: acht Schafe mit dem Halsband des Spielers stehen am Dorfzentrum', async ({}, info) => {
    const lage = await bert.evaluate(() => {
      const a = window.ansicht;
      const eigene = [...a.tiere.values()].filter((t) => t.b === a.ich);
      const basis = a.spieler.get(a.ich).basis;
      return { anzahl: eigene.length, arten: [...new Set(eigene.map((t) => t.art))], basis: a.zuBild(basis.x, basis.y) };
    });
    expect(lage).toMatchObject({ anzahl: 8, arten: ['schaf'] });
    // Nah heran, damit Wolle und Halsband zu sehen sind.
    await bert.mouse.move(lage.basis.x, lage.basis.y);
    for (let i = 0; i < 8; i++) await bert.mouse.wheel(0, -100);
    await bert.waitForFunction(() => window.ansicht.kamera.zoom >= 2.5);
    await nachweis(bert, {
      spec: KARTE,
      ac: 'AC-16',
      titel: 'Berts Dorfzentrum nah: Schafe im Kreis darum, das Halsband in seinem Rot - eines steht dahinter',
      test: info,
    });
  });

  test('darstellung AC-1: die Karte liegt als Raute, und Bild und Feld rechnen sich genau um', async ({}, info) => {
    await bert.evaluate(() => { window.ansicht.kamera.zoom = 1; });
    const probe = await bert.evaluate(() => {
      const a = window.ansicht;
      const nullpunkt = a.zuBild(40, 50);
      const rechts = a.zuBild(41, 50);
      const unten = a.zuBild(40, 51);
      // Hin und zurueck fuer viele gebrochene Punkte.
      let groessterFehler = 0;
      for (let i = 0; i < 200; i++) {
        const x = (i * 37) % 120 + ((i * 13) % 100) / 100;
        const y = (i * 53) % 120 + ((i * 29) % 100) / 100;
        const b = a.zuBild(x, y);
        const w = a.zuWelt(b.x, b.y);
        groessterFehler = Math.max(groessterFehler, Math.abs(w.x - x), Math.abs(w.y - y));
      }
      // Ein Klick auf die Mitte einer Raute trifft genau dieses Feld.
      const mitte = a.zuBild(17, 23);
      const getroffen = a.zuWelt(mitte.x + 5, mitte.y - 3);
      return {
        schrittX: [rechts.x - nullpunkt.x, rechts.y - nullpunkt.y],
        schrittY: [unten.x - nullpunkt.x, unten.y - nullpunkt.y],
        groessterFehler,
        feld: [Math.round(getroffen.x), Math.round(getroffen.y)],
      };
    });
    // Ein Schritt in x geht nach rechts unten, in y nach links unten - doppelt so breit wie hoch.
    expect(probe.schrittX).toEqual([22, 11]);
    expect(probe.schrittY).toEqual([-22, 11]);
    expect(probe.groessterFehler).toBeLessThan(1e-9);
    expect(probe.feld).toEqual([17, 23]);
    await bert.waitForTimeout(100);
    await nachweis(bert, {
      spec: DARSTELLUNG,
      ac: 'AC-1',
      titel: 'Berts Siedlung im isometrischen Blick: Boden ohne Raster, Wald, Beeren, Gold und Stein als Dinge',
      test: info,
    });
  });

  test('darstellung AC-7: was weiter unten steht, verdeckt, was dahinter steht', async ({}, info) => {
    // Zum Wald, in dem Anna sammelt, nah heran.
    const ziel = await anna.evaluate(() => {
      const a = window.ansicht;
      const sammler = [...a.nachher.values()].find((e) => e.b === a.ich && e.a === 'h') || [...a.nachher.values()].find((e) => e.b === a.ich);
      a.kamera.zoom = 2.2;
      a.blickAuf(sammler.x, sammler.y);
      return true;
    });
    expect(ziel).toBe(true);
    await anna.waitForTimeout(200);
    const reihenfolge = await anna.evaluate(() => window.ansicht.reihenfolge);
    expect(reihenfolge.length).toBeGreaterThan(20);
    for (let i = 1; i < reihenfolge.length; i++) {
      expect(reihenfolge[i].tiefe, `Platz ${i}`).toBeGreaterThanOrEqual(reihenfolge[i - 1].tiefe);
    }
    // Einheiten stehen zwischen den Baeumen, nicht alle darueber.
    const arten = reihenfolge.map((d) => d.art);
    const ersteEinheit = arten.indexOf('einheit');
    expect(ersteEinheit).toBeGreaterThan(-1);
    expect(arten.slice(ersteEinheit).includes('vorrat')).toBe(true);
    await nachweis(anna, {
      spec: DARSTELLUNG,
      ac: 'AC-7',
      titel: 'Nah am Wald: Baeume, Dorfbewohner, Schafe, Gold und Stein nach Tiefe gezeichnet - die Reihenfolge prueft der Test',
      test: info,
    });
  });

  test('darstellung AC-2: am See ein Ufer, auf dem Wasser Wellen, das Gras getoent', async ({}, info) => {
    // Zum Wasser, das Annas Basis am naechsten liegt und an Land grenzt.
    const gefunden = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const basis = a.spieler.get(a.ich).basis;
      let bestes = null;
      for (let y = 1; y < g - 1; y++) {
        for (let x = 1; x < g - 1; x++) {
          if (a.karte.felder[y * g + x] !== 3) continue;
          if (a.karte.felder[y * g + x + 1] === 3 && a.karte.felder[(y + 1) * g + x] === 3) continue;
          const abstand = Math.hypot(x - basis.x, y - basis.y);
          if (!bestes || abstand < bestes.abstand) bestes = { x, y, abstand };
        }
      }
      if (!bestes) return false;
      a.kamera.zoom = 2;
      a.blickAuf(bestes.x, bestes.y);
      return true;
    });
    expect(gefunden).toBe(true);
    await anna.waitForTimeout(200);
    await nachweis(anna, {
      spec: DARSTELLUNG,
      ac: 'AC-2',
      titel: 'Am See: ein weiches Ufer aus Sand und Schlamm, auf dem Wasser leise Lichtstreifen, das Gras getoent',
      test: info,
    });
  });

  test('darstellung AC-13: das Spielbild bei Zoom 1 - erdig, ohne Umrisse und Raster, mit Schatten', async ({}, info) => {
    await anna.evaluate(() => {
      const a = window.ansicht;
      const b = a.spieler.get(a.ich).basis;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt.clear();
      a.kamera.zoom = 1;
      a.blickAuf(b.x, b.y);
    });
    // Im Bild: das eigene Dorfzentrum, Einheiten und Baeume - sonst zeigt es nichts.
    const imBild = await anna.evaluate(() => {
      const a = window.ansicht;
      const breite = a.leinwand.clientWidth;
      const hoehe = a.leinwand.clientHeight;
      const drin = (p) => p.x > 0 && p.y > 60 && p.x < breite && p.y < hoehe;
      const g = a.karte.groesse;
      let baeume = 0;
      for (let y = 0; y < g; y++) for (let x = 0; x < g; x++) if (a.karte.felder[y * g + x] === 1 && drin(a.zuBild(x, y))) baeume += 1;
      const einheiten = [...a.nachher.values()].filter((e) => e.b === a.ich && drin(a.zuBild(e.x, e.y))).length;
      return { baeume, einheiten };
    });
    expect(imBild.baeume, 'Wald im Bild').toBeGreaterThan(20);
    expect(imBild.einheiten, 'eigene Einheiten im Bild').toBeGreaterThanOrEqual(4);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: DARSTELLUNG,
      ac: 'AC-13',
      titel: 'Zoom 1: olivbrauner Boden ohne Raster, Gebaeude und Baeume mit Schatten nach rechts, See mit weichem Ufer - vorher siehe docs/strategie/bilder/vorher-runde35',
      test: info,
    });
  });

  test('einheiten AC-15: Rechtsklick auf Gold, der Dorfbewohner traegt Gold', async ({}, info) => {
    // Die Sammler stehen im Wald, also ausserhalb des Bildes: gewaehlt wird hier
    // direkt, der Rechtsklick geht wie beim Spieler ueber die Leinwand
    // (bedienung AC-12 prueft das Waehlen).
    const gold = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const basis = a.spieler.get(a.ich).basis;
      let bestes = null;
      for (let i = 0; i < a.karte.felder.length; i++) {
        if (a.karte.felder[i] !== 4) continue;
        const x = i % g;
        const y = (i / g) | 0;
        const abstand = Math.hypot(x - basis.x, y - basis.y);
        if (!bestes || abstand < bestes.abstand) bestes = { x, y, abstand };
      }
      a.ausgewaehlt.clear();
      for (const e of a.nachher.values()) if (e.b === a.ich) a.ausgewaehlt.add(e.i);
      a.kamera.zoom = 1;
      a.blickAuf(bestes.x, bestes.y);
      return a.zuBild(bestes.x, bestes.y);
    });
    await anna.waitForTimeout(100);
    await anna.mouse.click(gold.x, gold.y, { button: 'right' });
    await zeitraffer(anna, code, 5);

    // Einer hat schon einiges Gold in der Hand.
    const traeger = await anna.waitForFunction(() => {
      const a = window.ansicht;
      const e = [...a.nachher.values()].find((f) => f.b === a.ich && f.a === 'g' && f.l >= 4);
      return e ? e.i : false;
    }, null, { timeout: 30_000 });
    const id = await traeger.jsonValue();
    await zeitraffer(anna, code, 1);
    await anna.evaluate((eid) => {
      const a = window.ansicht;
      a.ausgewaehlt.clear();
      const e = a.nachher.get(eid);
      a.kamera.zoom = 3;
      a.blickAuf(e.x, e.y);
    }, id);
    await anna.waitForTimeout(200);
    await nachweis(anna, {
      spec: '10-strategie/einheiten-und-befehle.md',
      ac: 'AC-15',
      titel: 'Am Goldvorkommen: ein Dorfbewohner traegt gelbe Goldbrocken in beiden Haenden - Gold in der Leiste erst mit bedienung AC-24',
      test: info,
    });
  });
});
