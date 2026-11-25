// Der Nebel im Bild (→ specs/10-strategie/kampf.md AC-11, AC-12,
// darstellung.md AC-15).
//
// Annas Spaeher reitet ein Stueck hinaus und kehrt zurueck. Danach liegen alle
// drei Stufen im Bild: beobachtet um ihr Dorf, erkundet auf seinem Weg, nie
// gesehen rundherum. Auf den erkundeten Weg stellt der Test eine Einheit
// Berts - Anna sieht sie nicht, obwohl sie das Gelaende dort kennt.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test, zeitraffer } from '../helpers/seite.mjs';
import { BAUTASTEN } from '../../public/tasten.js';
import { bedienteileFrei, dorfbewohnerAnklicken, partieBeenden, partieZuZweit, platzImBild } from '../helpers/strategie.mjs';

const KAMPF = '10-strategie/kampf.md';
const DARSTELLUNG = '10-strategie/darstellung.md';
const GRAS = 0;
const WALD = 1;

test.describe('Nebel', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('kampf AC-11, kampf AC-12 und darstellung AC-15: der Nebel in drei Stufen, fremde Einheiten nur in Sicht', async ({}, info) => {
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht.nebel && window.ansicht.nachher.size > 0);

    // Zum Start: nur das eigene Dorf ist gesehen (kampf AC-11).
    const start = await anna.evaluate(() => window.ansicht.nebel.zaehlen());
    expect(start.beobachtet, 'um das Dorf ist es hell').toBeGreaterThan(0);
    expect(start.erkundet, 'erkundet, aber unbeobachtet ist noch nichts').toBe(0);

    // Ein Ziel 16 Felder vom Dorf, auf Gras, ausser Sicht.
    const lage = await anna.evaluate((gras) => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const b = a.spieler.get(a.ich).basis;
      const richtung = b.x < g / 2 ? 1 : -1;
      for (let d = 16; d < 30; d++) {
        const x = b.x + richtung * d;
        const y = b.y;
        if (a.karte.felder[y * g + x] === gras && !a.nebel.sieht(x, y)) return { ziel: { x, y }, heim: { x: b.x + richtung * 3, y: b.y + 2 }, basis: b };
      }
      return null;
    }, GRAS);
    expect(lage, 'ein Ziel ausser Sicht').not.toBeNull();

    const reiten = async (ziel) => {
      const punkt = await anna.evaluate((z) => {
        const a = window.ansicht;
        const spaeher = [...a.nachher.values()].find((e) => e.b === a.ich && e.k === a.werte.einheiten.spaeherreiter.kuerzel);
        a.gewaehltesGebaeude = null;
        a.ausgewaehlt = new Set([spaeher.i]);
        a.beiAuswahl();
        a.blickAuf(z.x, z.y);
        return a.zuBild(z.x, z.y);
      }, ziel);
      await anna.mouse.click(punkt.x, punkt.y, { button: 'right' });
      await anna.waitForFunction((z) => {
        const a = window.ansicht;
        const spaeher = [...a.nachher.values()].find((e) => e.b === a.ich && e.k === a.werte.einheiten.spaeherreiter.kuerzel);
        return Math.hypot(spaeher.x - z.x, spaeher.y - z.y) < 1.5;
      }, ziel, { timeout: 30_000 });
    };
    await zeitraffer(anna, code, 5);
    await reiten(lage.ziel);
    await reiten(lage.heim);
    await zeitraffer(anna, code, 1);
    // Eine halbe Sekunde, bis die Sicht am neuen Ort gerechnet ist.
    await anna.waitForFunction((z) => !window.ansicht.nebel.sieht(z.x, z.y) && window.ansicht.nebel.hatErkundet(z.x, z.y), lage.ziel, { timeout: 5_000 });

    // Bert stellt einen Mann auf den Weg, den Annas Spaeher kennt.
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { x: lage.ziel.x, y: lage.ziel.y }), 'Berts Mann').toBe(1);
    // Bert sieht ihn - so wissen wir, dass er steht, auch wenn Anna nichts von
    // ihm erfaehrt.
    await partie.bert.waitForFunction((z) => [...window.ansicht.nachher.values()]
      .some((e) => e.b === window.ansicht.ich && Math.hypot(e.x - z.x, e.y - z.y) < 2), lage.ziel);

    // Der Blick: das Dorf und der Weg, weit genug heraus, dass auch Schwarz zu sehen ist.
    const bild = await anna.evaluate((l) => {
      const a = window.ansicht;
      a.ausgewaehlt = new Set();
      a.beiAuswahl();
      a.kamera.zoom = 0.8;
      a.blickAuf((l.basis.x + l.ziel.x) / 2, l.basis.y + 2);
      return true;
    }, lage);
    expect(bild).toBe(true);
    await anna.waitForTimeout(400);
    const nachher = await anna.evaluate((z) => {
      const a = window.ansicht;
      const gezeichnet = new Set(a.reihenfolge.filter((d) => d.art === 'einheit').map((d) => d.id));
      const bert = [...a.nachher.values()].find((e) => e.b !== a.ich && Math.hypot(e.x - z.x, e.y - z.y) < 2);
      const p = (x, y) => a.zuBild(x, y);
      const imBild = (q) => q.x > 0 && q.y > 60 && q.x < a.leinwand.clientWidth && q.y < a.leinwand.clientHeight - 140;
      return {
        stufen: a.nebel.zaehlen(),
        bertDa: Boolean(bert),
        bertGezeichnet: bert ? gezeichnet.has(bert.i) : null,
        zielErkundet: a.nebel.hatErkundet(z.x, z.y),
        zielGesehen: a.nebel.sieht(z.x, z.y),
        zielImBild: imBild(p(z.x, z.y)),
        dorfImBild: imBild(p(a.spieler.get(a.ich).basis.x, a.spieler.get(a.ich).basis.y)),
        nieImBild: !a.nebel.hatErkundet(z.x, z.y + 12) && imBild(p(z.x, z.y + 12)),
      };
    }, lage.ziel);
    // Drei Stufen, alle im Bild (darstellung AC-15).
    expect(nachher.stufen.beobachtet).toBeGreaterThan(0);
    expect(nachher.stufen.erkundet, 'der Weg des Spaehers ist erkundet').toBeGreaterThan(0);
    expect(nachher.stufen.nie).toBeGreaterThan(0);
    expect(nachher.dorfImBild, 'das Dorf im Bild').toBe(true);
    expect(nachher.zielImBild, 'das Ende des Wegs im Bild').toBe(true);
    expect(nachher.nieImBild, 'und daneben nie Gesehenes').toBe(true);
    // Erinnert, aber unbeobachtet: Berts Mann steht dort und wird nicht gezeichnet (kampf AC-12).
    expect(nachher.zielErkundet && !nachher.zielGesehen, 'das Ziel ist erkundet, aber unbeobachtet').toBe(true);
    // Seit kampf AC-13 schickt der Server ihn gar nicht erst (Runde 110).
    expect(nachher.bertDa, 'Berts Mann kommt bei Anna nicht an').toBe(false);
    expect(nachher.bertGezeichnet, 'Anna sieht ihn nicht').not.toBe(true);
    // Die Uebersichtskarte zeigt ihn auch nicht.
    const aufKarte = await anna.evaluate(() => window.uebersicht.punkte.filter((p) => p.art === 'einheit' && p.b !== window.ansicht.ich).length);
    expect(aufKarte, 'kein fremder Punkt auf der Uebersicht').toBe(0);
    expect(await bedienteileFrei(anna)).toEqual([]);

    for (const [spec, ac] of [[DARSTELLUNG, 'AC-15'], [KAMPF, 'AC-11'], [KAMPF, 'AC-12']]) {
      await nachweis(anna, {
        spec,
        ac,
        titel: 'Der Nebel in drei Stufen: hell um Annas Dorf, gedämpft der Weg, den ihr Späher geritten ist, schwarz der Rest — ebenso auf der Übersichtskarte',
        test: info,
      });
    }
  });

  test('kampf AC-12: ein fremdes Gebaeude im Nebel steht so da, wie man es zuletzt sah', async () => {
    const { anna } = partie;
    // Gegen die echte Ansicht im Browser: ein Gebaeude Berts auf einem Feld,
    // das Anna kennt, aber gerade nicht sieht. Ob sie es sieht, steuert der
    // Test ueber die Sicht dieses einen Feldes - der Rest ist Annas Ansicht,
    // wie sie ist.
    const ergebnis = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      let feld = null;
      for (let i = 0; i < g * g && !feld; i++) {
        if (a.nebel.erkundet[i] && !a.nebel.sichtbar[i] && !a.nebel.gebaeude[i]) feld = { x: i % g, y: Math.floor(i / g), i };
      }
      const bert = [...a.spieler.values()].find((s) => s.id !== a.ich).id;
      const haus = { i: 999999, art: 'haus', b: bert, x: feld.x, y: feld.y, h: 550 };
      const gezeigt = () => a.gezeigteGebaeude().some((b) => b.i === haus.i);
      const sehen = (an) => { a.nebel.sichtbar[feld.i] = an ? 1 : 0; a.erinnern(); };
      const schritte = {};
      // Im Nebel entstanden: unbekannt.
      a.gebaeude.set(haus.i, haus);
      sehen(false);
      schritte.neuImNebel = gezeigt();
      // Gesehen: bekannt.
      sehen(true);
      schritte.gesehen = gezeigt();
      // Wieder im Nebel, und inzwischen gefallen: man weiss es nicht - es steht noch.
      a.gebaeude.delete(haus.i);
      sehen(false);
      schritte.gefallenImNebel = gezeigt();
      // Wieder hingesehen: es ist weg.
      sehen(true);
      schritte.wiederGesehen = gezeigt();
      sehen(false);
      return schritte;
    });
    expect(ergebnis.neuImNebel, 'im Nebel gebaut: unbekannt').toBe(false);
    expect(ergebnis.gesehen, 'gesehen: bekannt').toBe(true);
    expect(ergebnis.gefallenImNebel, 'im Nebel gefallen: steht in der Erinnerung noch').toBe(true);
    expect(ergebnis.wiederGesehen, 'wieder gesehen: vergessen').toBe(false);
  });

  test('kampf AC-12: ein fremdes Gebaeude steht im Bild, sobald ein Feld seiner Grundflaeche in Sicht ist', async ({}, info) => {
    // Rueckmeldung des Benutzers (2026-11-12): sein Spaeher stand neben dem
    // gegnerischen Dorfzentrum und war ein blauer Umriss vor leerem Schwarz.
    // Der Server schickt ein Gebaeude, sobald ein Feld davon in Sicht ist -
    // der Browser zeichnete es erst, wenn die Mitte in Sicht war. Mit vier
    // Feldern Sicht sieht ein Spaeher den Rand eines Dorfzentrums, nicht die
    // Mitte.
    const { anna, code } = partie;
    const fremd = await anna.evaluate(() => {
      const a = window.ansicht;
      return [...a.spieler.values()].find((s) => s.id !== a.ich).basis;
    });
    // Der Pruefgriff nimmt das erste freie Feld des Rings: links oben vom
    // genannten. So steht der Spaeher fuenf Felder links der Mitte.
    await einheitenAufstellen(anna, code, 'Anna', 1, { x: fremd.x - 4, y: fremd.y, art: 'spaeherreiter' });
    const lage = await anna.waitForFunction((b) => {
      const a = window.ansicht;
      const dorf = [...a.gebaeude.values()].find((g) => g.art === 'dorfzentrum' && g.b !== a.ich);
      // Die Erinnerung schreibt das naechste Bild - darauf warten, nicht raten.
      if (!dorf || !a.siehtGebaeude(dorf) || !a.erinnert.has(dorf.i)) return false;
      const mitte = a.gebaeudeMitte(dorf);
      const reiter = [...a.nachher.values()].find((e) => e.b === a.ich && Math.abs(e.x - b.x) < 8 && Math.abs(e.y - b.y) < 8);
      return {
        mitteInSicht: a.nebel.sieht(mitte.x, mitte.y),
        gezeigt: a.gezeigteGebaeude().some((g) => g.i === dorf.i),
        erinnert: a.erinnert.has(dorf.i),
        reiter: reiter ? { x: reiter.x, y: reiter.y } : null,
      };
    }, fremd, { timeout: 15_000 }).then((h) => h.jsonValue());
    expect(lage.reiter, 'der Spaeher steht bei Berts Dorf').not.toBeNull();
    expect(lage.mitteInSicht, 'der Fall, um den es geht: die Mitte liegt nicht in Sicht').toBe(false);
    expect(lage.gezeigt, 'das Dorfzentrum steht im Bild').toBe(true);
    expect(lage.erinnert, 'und bleibt in der Erinnerung').toBe(true);
    await anna.evaluate((b) => {
      const a = window.ansicht;
      a.kamera.zoom = 1.6;
      a.blickAuf(b.x - 2, b.y);
    }, fremd);
    await anna.waitForTimeout(300);
    // Niemand ist Umriss, ohne dass das Gebaeude davor im Bild steht.
    const gedeckt = await anna.evaluate(() => {
      const a = window.ansicht;
      const gezeigt = new Set(a.gezeigteGebaeude().map((g) => g.i));
      return (a.verdeckte || []).every((v) => v.decken.every((g) => gezeigt.has(g.i)));
    });
    expect(gedeckt, 'ein Umriss ohne Gebaeude davor').toBe(true);
    await nachweis(anna, {
      spec: KAMPF,
      ac: 'AC-12',
      titel: 'Annas Spaeher sieht nur den Rand von Berts Dorfzentrum - es steht trotzdem im Bild, der Rest liegt im Nebel',
      test: info,
    });
  });

  test('kampf AC-32: nach dem Neuladen ist das Erkundete noch erkundet und das gesehene fremde Dorfzentrum noch erinnert', async ({}, info) => {
    // Rueckmeldung des Benutzers (2026-11-25): "beim weiterspielen ist der
    // nebel, den ich mir angeguckt habe verschwunden." Der Aufbau nach dem
    // Fortsetzen, nach einer Rueckkehr und nach dem Neuladen ist derselbe.
    const { anna } = partie;
    // Der Spaeher bei Berts Dorf geht (Entf): das Dorfzentrum liegt im Nebel,
    // in der Erinnerung steht es noch.
    const fremd = await anna.evaluate(() => {
      const a = window.ansicht;
      const basis = [...a.spieler.values()].find((s) => s.id !== a.ich).basis;
      const reiter = [...a.nachher.entries()].find(([, e]) => e.b === a.ich && Math.hypot(e.x - basis.x, e.y - basis.y) < 8);
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set([reiter[0]]);
      a.beiAuswahl();
      return basis;
    });
    await anna.keyboard.press('Delete');
    const vorher = await anna.waitForFunction(() => {
      const a = window.ansicht;
      const dorf = [...a.erinnert.values()].find((g) => g.art === 'dorfzentrum' && g.b !== a.ich);
      if (!dorf || a.siehtGebaeude(dorf)) return false;
      const n = a.nebel;
      const gedaempft = [];
      for (let i = 0; i < n.erkundet.length; i++) if (n.erkundet[i] && !n.sichtbar[i] && !n.gebaeude[i]) gedaempft.push(i);
      return { dorf: dorf.i, gedaempft, stufen: n.zaehlen(), basis: [...a.spieler.values()].find((s) => s.id !== a.ich).basis };
    }, null, { timeout: 15_000 }).then((h) => h.jsonValue());
    expect(vorher.gedaempft.length, 'Erkundetes ausser Sicht gibt es').toBeGreaterThan(100);

    await anna.reload();
    await anna.waitForFunction(() => window.ansicht?.nachher?.size > 0 && window.ansicht.nebel, null, { timeout: 15_000 });
    await expect(anna.locator('#spiel')).toBeVisible();
    const nachher = await anna.waitForFunction((v) => {
      const a = window.ansicht;
      a.nebel.rechnen(a, true);
      const behalten = v.gedaempft.filter((i) => a.nebel.erkundet[i]).length;
      const dorf = a.erinnert.get(v.dorf);
      return {
        behalten,
        stufen: a.nebel.zaehlen(),
        erinnert: Boolean(dorf),
        gezeigt: a.gezeigteGebaeude().some((g) => g.i === v.dorf),
        gesehen: dorf ? a.siehtGebaeude(dorf) : null,
        // Wo der Spaeher stand, war Annas eigenes Auge - nicht nur eine Karte.
        nameBekannt: a.nebel.warDort(v.basis.x - 5, v.basis.y),
      };
    }, vorher, { timeout: 5_000 }).then((h) => h.jsonValue());
    // Der Browser hat die Sicht an den Orten gerechnet, an denen er den
    // Spaeher zeichnete, der Server an denen seiner halben Sekunden - im
    // Zeitraffer weichen die Raender um ein, zwei Felder ab (gemessen: 117
    // von 119). Verloren war vorher alles.
    expect(nachher.behalten / vorher.gedaempft.length, 'das Erkundete ist nach dem Neuladen noch erkundet').toBeGreaterThanOrEqual(0.95);
    expect(nachher.stufen.erkundet, 'gedaempft fast wie vorher').toBeGreaterThanOrEqual(0.95 * vorher.stufen.erkundet);
    expect(nachher.erinnert, 'Berts Dorfzentrum steht in der Erinnerung').toBe(true);
    expect(nachher.gesehen, 'gesehen wird es nicht').toBe(false);
    expect(nachher.gezeigt, 'und steht doch im Bild').toBe(true);
    expect(nachher.nameBekannt, 'dort war Annas Auge').toBe(true);

    await anna.evaluate((b) => {
      const a = window.ansicht;
      a.ausgewaehlt = new Set();
      a.beiAuswahl();
      a.kamera.zoom = 0.9;
      a.blickAuf(b.x - 6, b.y);
    }, fremd);
    await anna.waitForTimeout(400);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: KAMPF,
      ac: 'AC-32',
      titel: 'Nach dem Neuladen: was Annas Späher bei Berts Dorf gesehen hat, liegt weiter gedämpft da, und das Dorfzentrum steht im Nebel, wie er es zuletzt sah - auch auf der Übersichtskarte',
      test: info,
    });
  });
});

// Die Sicht als Einstellung (kampf AC-16): eroeffnet "Erkundet", ist die Karte
// von Anfang an bekannt - gedaempft -, und nur um das eigene Dorf ist es hell.
test.describe('Sicht erkundet', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'erkundet' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('kampf AC-16: als Erkundet eroeffnet, ist die ganze Karte bekannt, hell nur um das eigene Dorf', async ({}, info) => {
    const { anna } = partie;
    await anna.waitForFunction(() => window.ansicht.nebel && window.ansicht.nebel.takt > -Infinity);
    const lage = await anna.evaluate(() => {
      const a = window.ansicht;
      a.kamera.zoom = 0.7;
      const b = a.spieler.get(a.ich).basis;
      a.blickAuf(b.x + 6, b.y + 6);
      const fremd = [...a.spieler.values()].find((s) => s.id !== a.ich).basis;
      return { sicht: a.sichtArt, stufen: a.nebel.zaehlen(), fremdErkundet: a.nebel.hatErkundet(fremd.x, fremd.y), fremdGesehen: a.nebel.sieht(fremd.x, fremd.y) };
    });
    expect(lage.sicht).toBe('erkundet');
    expect(lage.stufen.nie, 'nichts ist unbekannt').toBe(0);
    expect(lage.stufen.beobachtet, 'hell um das Dorf').toBeGreaterThan(0);
    expect(lage.stufen.erkundet, 'der Rest gedaempft').toBeGreaterThan(lage.stufen.beobachtet);
    // Gegenprobe: Berts Dorf kennt Anna, sieht es aber nicht.
    expect(lage.fremdErkundet && !lage.fremdGesehen, 'Berts Dorf bekannt, nicht beobachtet').toBe(true);
    await anna.waitForTimeout(300);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: KAMPF,
      ac: 'AC-16',
      titel: 'Als „Erkundet“ eröffnet: die ganze Karte ist bekannt und gedämpft, hell nur um Annas Dorf — auch auf der Übersichtskarte',
      test: info,
    });
  });

  test('darstellung AC-29: ein Baum an der Kante der Karte liegt bis in die Krone unter dem Nebel seines Felds', async ({}, info) => {
    // Rueckmeldung des Benutzers (2026-11-15, mit Bild): "der baum ist
    // lustigerweise draussen und hell". Das Nebelbild deckte die Karte und ein
    // Feld Rand - die Krone eines Baums an der Kante ragt weiter hinaus.
    const { anna } = partie;
    // Ein Baum an die Kante (x = 0), fern von Annas Dorf, und einer daneben
    // im Land zum Vergleich. Gepflanzt nur in Annas Ansicht: gezeichnet wird
    // aus ihrer Karte, und um das Zeichnen geht es.
    const baum = await anna.evaluate(({ gras, wald }) => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const frei = (x, y0, y1) => {
        for (let y = y0; y <= y1; y++) if (a.karte.felder[y * g + x] !== gras || a.nebel.sieht(x, y)) return false;
        return true;
      };
      for (let y = 8; y < g - 8; y++) {
        // Rundum Gras: keine fremde Krone im gemessenen Ausschnitt.
        if (![0, 1, 2, 3, 4].every((x) => frei(x, y - 4, y + 4))) continue;
        a.karte.felder[y * g] = wald;
        a.karte.felder[(y + 3) * g + 3] = wald;
        a.kamera.zoom = 2;
        a.blickAuf(0, y - 1);
        return { x: 0, y };
      }
      return null;
    }, { gras: GRAS, wald: WALD });
    expect(baum, 'ein freier Platz an der Kante').not.toBeNull();

    const mass = await anna.evaluate(async (b) => {
      const a = window.ansicht;
      const bild = () => new Promise((fertig) => { requestAnimationFrame(() => requestAnimationFrame(fertig)); });
      const d = window.devicePixelRatio || 1;
      const p = a.zuBild(b.x, b.y);
      const e = a.zuBild(b.x + 1, b.y).x - p.x;
      const x0 = Math.round((p.x - 1.5 * e) * d);
      const y0 = Math.round((p.y - 4 * e) * d);
      const breite = Math.round(3 * e * d);
      const hoehe = Math.round(4 * e * d);
      const lesen = () => a.stift.getImageData(x0, y0, breite, hoehe).data;
      await bild();
      const mit = lesen();
      // Dasselbe Bild ohne Nebel: so hell ist die Krone wirklich.
      const art = a.sichtArt;
      a.sichtArt = 'aufgedeckt';
      await bild();
      const ohne = lesen();
      a.sichtArt = art;
      await bild();
      let krone = 0;
      let hell = 0;
      let summeOhne = 0;
      let summeMit = 0;
      for (let y = 0; y < hoehe; y++) {
        for (let x = 0; x < breite; x++) {
          // Nur was weiter draussen liegt, als das alte Nebelbild reichte
          // (ein Feld Rand, also bis -1,5).
          const w = a.zuWelt((x0 + x) / d, (y0 + y) / d);
          if (w.x > -1.7) continue;
          const i = (y * breite + x) * 4;
          const o = (ohne[i] + ohne[i + 1] + ohne[i + 2]) / 3;
          // Der Grund der Leinwand ist fast schwarz - gezaehlt wird die Krone.
          if (o < 50) continue;
          const m = (mit[i] + mit[i + 1] + mit[i + 2]) / 3;
          krone++;
          summeOhne += o;
          summeMit += m;
          if (m > o * 0.7) hell++;
        }
      }
      return {
        krone,
        hell,
        ohne: krone ? summeOhne / krone : 0,
        mit: krone ? summeMit / krone : 0,
        feld: a.nebel.deckkraft(b.x, b.y),
        draussen: [1, 2, 3, 4, 5, 6].map((n) => a.nebel.deckkraft(b.x - n, b.y - n)),
        kante: [1, 2, 3, 4, 5, 6].map((n) => a.nebel.deckkraft(0, b.y - n)),
        gesehen: a.nebel.sieht(b.x, b.y),
      };
    }, baum);
    expect(mass.gesehen, 'der Baum steht im Erkundeten, nicht im Beobachteten').toBe(false);
    expect(mass.feld, 'ueber seinem Feld liegt der gedaempfte Nebel').toBeGreaterThan(0);
    expect(mass.feld).toBeLessThan(255);
    // Draussen traegt der Nebel den Stand des naechsten Felds der Kante.
    // (Jede Messung fuer sich gemeldet: die Gegenprobe soll zeigen, was im Bild steht.)
    expect.soft(mass.draussen, 'sechs Felder hinaus derselbe Nebel wie an der Kante').toEqual(mass.kante);
    // Die Krone ragt wirklich ueber den alten Rand hinaus - sonst misst der Fall nichts.
    expect.soft(mass.krone, 'Bildpunkte der Krone jenseits des alten Rands').toBeGreaterThan(150);
    expect.soft(mass.hell, `${mass.hell} von ${mass.krone} Bildpunkten der Krone sind so hell wie ohne Nebel`).toBe(0);
    expect.soft(mass.mit, `im Mittel ${mass.mit.toFixed(0)} statt ${mass.ohne.toFixed(0)}`).toBeLessThan(mass.ohne * 0.65);
    await nachweis(anna, {
      spec: DARSTELLUNG,
      ac: 'AC-29',
      titel: 'Ein Baum an der Kante der Karte im Erkundeten: die Krone ragt über die Karte hinaus und ist gedämpft wie der Baum daneben im Land',
      test: info,
    });
  });
});

// Der Aussenposten (kampf AC-18): ein Turm nur zum Sehen. Gebaut wie jedes
// Gebaeude - Dorfbewohner gewaehlt, B, seine Taste, ein Klick.
test.describe('Aussenposten', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info);
  });
  test.afterAll(() => partieBeenden(partie));

  test('kampf AC-18: ein Aussenposten vor dem Dorf, und um ihn ein heller Kreis von zehn Feldern im Nebel', async ({}, info) => {
    const { anna, code } = partie;
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    await anna.waitForFunction(() => window.ansicht.nebel.takt > -Infinity);
    const vorher = await anna.evaluate(() => window.ansicht.nebel.zaehlen().beobachtet);

    await dorfbewohnerAnklicken(anna, { code, raffer: 20 });
    const menue = await anna.locator('#baumenue [data-bauen]').evaluateAll((k) => k.map((x) => x.dataset.bauen));
    const nummer = menue.indexOf('aussenposten');
    expect(nummer, 'der Aussenposten im Baumenue der Dunklen Zeit').toBeGreaterThanOrEqual(0);
    await anna.keyboard.press('b');
    await anna.keyboard.press(BAUTASTEN[nummer]);
    await expect.poll(() => anna.evaluate(() => window.ansicht.platzieren?.art)).toBe('aussenposten');
    // Weit vor dem Dorf, dort, wo es noch dunkel ist - so weit, dass der Turm
    // seinen eigenen hellen Kreis bekommt (bei elf Feldern verschmolzen beide).
    // Dafuer die Kamera heraus, sonst liegt der Platz ausser Bild.
    await anna.evaluate((b) => {
      const a = window.ansicht;
      a.kamera.zoom = 0.6;
      a.blickAuf(b.x + 10, b.y + 10);
    }, basis);
    const platz = await platzImBild(anna, { n: 1, um: basis, abstand: 20 });
    expect(platz, 'ein Platz vor dem Dorf').not.toBeNull();
    await anna.mouse.move(platz.bild.x, platz.bild.y, { steps: 3 });
    await anna.mouse.click(platz.bild.x, platz.bild.y);
    await anna.waitForFunction(() => [...window.ansicht.gebaeude.values()]
      .some((g) => g.b === window.ansicht.ich && g.art === 'aussenposten' && g.u === undefined), null, { timeout: 90_000 });
    await anna.keyboard.press('Escape');
    await zeitraffer(anna, code, 1);
    const posten = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = [...a.gebaeude.values()].find((x) => x.b === a.ich && x.art === 'aussenposten');
      return { x: g.x, y: g.y };
    });
    // Zehn Felder weit sieht er - die Sicht kommt mit der naechsten Rechnung.
    await anna.waitForFunction((p) => window.ansicht.nebel.sieht(p.x + 10, p.y) || window.ansicht.nebel.sieht(p.x - 10, p.y), posten, { timeout: 5_000 });
    const nachher = await anna.evaluate((p) => {
      const a = window.ansicht;
      a.ausgewaehlt = new Set();
      a.gewaehltesGebaeude = null;
      a.beiAuswahl();
      const b = a.spieler.get(a.ich).basis;
      a.kamera.zoom = 0.6;
      a.blickAuf((p.x + b.x) / 2, (p.y + b.y) / 2);
      // Zwischen Dorf und Turm liegt Nebel: die beiden hellen Flaechen sind getrennt.
      const mitte = { x: Math.round((p.x + b.x) / 2), y: Math.round((p.y + b.y) / 2) };
      return { beobachtet: a.nebel.zaehlen().beobachtet, getrennt: !a.nebel.sieht(mitte.x, mitte.y) };
    }, posten);
    expect(nachher.beobachtet, `${vorher} -> ${nachher.beobachtet} beobachtete Felder`).toBeGreaterThan(vorher);
    expect(nachher.getrennt, 'zwischen Dorf und Turm ist Nebel').toBe(true);
    await anna.waitForTimeout(300);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: KAMPF,
      ac: 'AC-18',
      titel: 'Ein Außenposten weit vor Annas Dorf: der Holzturm, um ihn ein eigener heller Kreis, dazwischen Nebel',
      test: info,
    });
  });
});
