// Wer kaempft, holt aus (→ specs/10-strategie/bedienung.md AC-39) - und zwar
// einmal je Schlag (AC-72).
//
// Eine Miliz von Anna und eine von Bert stehen sich gegenueber und schlagen
// aufeinander ein. Zwischen zwei Schlaegen steht Annas Miliz bereit, beim
// Schlag steht sie anders: die Bildpunkte der Figur unterscheiden sich -
// vorher standen Kaempfende reglos (Rueckschau zur Stufe C). Danach stossen
// eine Ramme und ein Bogenschuetze auf Berts Dorfzentrum ein, und gezaehlt
// wird Bild fuer Bild: je Schlag des Servers eine Bewegung, dazwischen Ruhe.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, test, zeitraffer } from '../helpers/seite.mjs';
import { figurenFrei, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';

test.describe('Kampf im Bild', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('bedienung AC-39: wer kaempft, holt aus - beim Schlag steht die Figur anders als zwischen zwei Schlaegen', async ({}, info) => {
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    await zeitraffer(anna, code, 1);
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const ort = { x: basis.x + 2, y: basis.y + 9 };
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { ...ort, art: 'miliz' })).toBe(1);
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { x: ort.x + 2, y: ort.y, art: 'miliz' })).toBe(1);
    // Beide wachen (kampf AC-2) und schlagen aufeinander ein: der Server
    // markiert sie als kaempfend.
    const kuerzel = await anna.evaluate(() => window.ansicht.werte.einheiten.miliz.kuerzel);
    await anna.waitForFunction((k) => {
      const a = window.ansicht;
      const milizen = [...a.nachher.values()].filter((e) => e.k === k && !e.s);
      return milizen.length >= 2 && milizen.filter((e) => e.w).length >= 2;
    }, kuerzel, { timeout: 20_000 });
    const mitte = await anna.evaluate((k) => {
      const a = window.ansicht;
      const milizen = [...a.nachher.values()].filter((e) => e.k === k && e.w && !e.s);
      const x = milizen.reduce((s, e) => s + e.x, 0) / milizen.length;
      const y = milizen.reduce((s, e) => s + e.y, 0) / milizen.length;
      a.kamera.zoom = 2.2;
      a.blickAuf(x, y);
      return { x, y };
    }, kuerzel);
    await anna.waitForTimeout(300);
    expect(await figurenFrei(anna)).toEqual([]);

    // Die Bildpunkte um die beiden in dem Augenblick, in dem Annas Miliz an
    // einer bestimmten Stelle ihrer Schlagbewegung steht (`schlagAnteil`:
    // 0 = bereit, 0,5 = der Treffer). Gewartet wird Bild fuer Bild im
    // Browser und im selben Bild gelesen - ein Bildnachweis dazwischen dauert
    // laenger als das Ausholen.
    const ausschnitt = (von, bis) => anna.evaluate(({ o, k, von, bis }) => new Promise((fertig, geplatzt) => {
      const a = window.ansicht;
      const schluss = performance.now() + 15_000;
      let folge = 0;
      const bild = () => {
        const e = [...a.nachher.values()].find((f) => f.b === a.ich && f.k === k && f.w && !f.s);
        const anteil = e ? a.schlagAnteil(e) : null;
        folge = anteil !== null && anteil >= von && anteil <= bis ? folge + 1 : 0;
        // Zwei Bilder hintereinander: das gezeichnete ist dann sicher eines davon.
        if (folge >= 2) {
          const p = a.zuBild(o.x, o.y);
          const d = window.devicePixelRatio || 1;
          const breite = Math.round(160 * d);
          const hoehe = Math.round(140 * d);
          const daten = a.stift.getImageData(Math.round((p.x - 80) * d), Math.round((p.y - 110) * d), breite, hoehe).data;
          // Ein kleiner Fingerabdruck: Helligkeit je Bildpunkt.
          const hell = new Uint8Array(breite * hoehe);
          for (let i = 0; i < hell.length; i++) hell[i] = (daten[i * 4] + daten[i * 4 + 1] + daten[i * 4 + 2]) / 3;
          fertig({ anteil, hell: Array.from(hell) });
          return;
        }
        if (performance.now() > schluss) {
          geplatzt(new Error(`Annas Miliz stand nie zwischen ${von} und ${bis}, zuletzt ${anteil}`));
          return;
        }
        requestAnimationFrame(bild);
      };
      requestAnimationFrame(bild);
    }), { o: mitte, k: kuerzel, von, bis });
    const bereit = await ausschnitt(0, 0);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-39',
      titel: 'Annas Miliz (blau) und Berts Miliz (rot) im Kampf, ein Augenblick',
      test: info,
    });
    // Beim Treffer: das fuenfte von acht Bildern des Schlags, die Waffe unten.
    const treffer = await ausschnitt(0.44, 0.56);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-39',
      titel: 'Dieselben zwei kurz darauf: wer eben zuschlägt, steht anders als zwischen zwei Schlägen',
      test: info,
    });
    let anders = 0;
    for (let i = 0; i < bereit.hell.length; i++) if (Math.abs(bereit.hell[i] - treffer.hell[i]) > 24) anders++;
    // Gemessen in Runde 118: mit dem Ausholen aendern sich 5,6 bis 9,9 % des
    // Ausschnitts (drei Laeufe), ohne (Gegenprobe) genau 0 - beide stehen dann
    // still. Ein Prozent ist die Grenze: darunter waere es Rauschen, keine
    // Bewegung.
    expect(anders / bereit.hell.length, 'Anteil geaenderter Bildpunkte').toBeGreaterThan(0.01);
  });

  // Rueckmeldung des Benutzers: "die Animation der Mange passt GAR nicht. sie
  // bewegt sich schnell und oft und nur alle paar sekunden geht nen gemalter
  // stein weg" - ebenso Ramme und Bogenschuetze. Die Bewegung lief nach der
  // Uhr des Browsers, alle 0,7 Sekunden einmal, gleich fuer alle.
  test('bedienung AC-72: je Schlag des Servers eine Schlagbewegung, dazwischen Ruhe - die Ramme alle fuenf Sekunden, der Bogenschuetze alle zwei', async ({}, info) => {
    const { anna, code } = partie;
    const lage = await anna.evaluate(() => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const fremd = [...a.spieler.values()].find((s) => s.id !== a.ich).basis;
      // Vor Berts Dorfzentrum, zur Kartenmitte hin.
      return { fremd, ort: { x: fremd.x + (fremd.x < g / 2 ? 7 : -7), y: fremd.y } };
    });
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { ...lage.ort, art: 'ramme' })).toBe(1);
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { ...lage.ort, art: 'bogenschuetze' })).toBe(1);
    const ids = await anna.evaluate(async (fremd) => {
      const a = window.ansicht;
      const meine = () => [...a.nachher.values()].filter((e) => e.b === a.ich && !e.s && ['ramme', 'bogenschuetze'].includes(a.arten[e.k]));
      while (meine().length < 2) await new Promise((weiter) => setTimeout(weiter, 50));
      const gefunden = meine().map((e) => e.i);
      // Ein Befehl auf ein fremdes Gebaeude ist ein Angriff (kampf AC-1).
      a.befehlSenden(gefunden, { x: fremd.x, y: fremd.y }, false);
      return gefunden;
    }, lage.fremd);
    // Hin im Zeitraffer, gemessen wird in Echtzeit.
    await zeitraffer(anna, code, 4);
    await anna.waitForFunction((gesucht) => {
      const a = window.ansicht;
      return gesucht.every((i) => a.nachher.get(i)?.sl !== undefined);
    }, ids, { timeout: 40_000 });
    await zeitraffer(anna, code, 1);
    await anna.evaluate((gesucht) => {
      const a = window.ansicht;
      const e = a.nachher.get(gesucht[0]);
      a.kamera.zoom = 2;
      a.blickAuf(e.x, e.y);
    }, ids);
    await anna.waitForTimeout(1500);

    // Dreizehn Sekunden, Bild fuer Bild: wo steht jede in ihrer Bewegung, und
    // welchen Schlag nennt der Server?
    const DAUER = 13;
    const reihen = await anna.evaluate(({ gesucht, dauer }) => new Promise((fertig) => {
      const a = window.ansicht;
      const proben = gesucht.map((i) => ({ art: a.arten[a.nachher.get(i).k], nachladen: a.einheitenwert(a.nachher.get(i), 'nachladen'), bilder: [] }));
      const beginn = performance.now();
      const bild = () => {
        gesucht.forEach((i, n) => {
          const e = a.nachher.get(i);
          if (e) proben[n].bilder.push({ sl: e.sl ?? null, anteil: a.schlagAnteil(e) });
        });
        if (performance.now() - beginn < dauer * 1000) requestAnimationFrame(bild);
        else fertig(proben);
      };
      requestAnimationFrame(bild);
    }), { gesucht: ids, dauer: DAUER });

    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-72',
      titel: 'Annas Ramme und ihr Bogenschütze vor Berts Dorfzentrum: je Schlag eine Bewegung, dazwischen stehen sie bereit',
      test: info,
    });

    for (const { art, nachladen, bilder } of reihen) {
      expect(bilder.length, `${art}: Bilder gezaehlt`).toBeGreaterThan(DAUER * 20);
      expect(bilder.every((b) => b.anteil !== null), `${art}: der Zustand nennt in jedem Bild einen Schlag`).toBe(true);
      // Die Bilder, mit denen ein neuer Schlag ankommt.
      const schlaege = [];
      for (let i = 1; i < bilder.length; i++) if (bilder[i].sl !== bilder[i - 1].sl) schlaege.push(i);
      const erwartet = DAUER / nachladen;
      expect(schlaege.length, `${art}: Schlaege in ${DAUER} s bei ${nachladen} s Nachladezeit`).toBeGreaterThanOrEqual(Math.floor(erwartet) - 1);
      expect(schlaege.length, `${art}: Schlaege in ${DAUER} s bei ${nachladen} s Nachladezeit`).toBeLessThanOrEqual(Math.ceil(erwartet) + 1);
      expect(schlaege.length, `${art}: mindestens zwei Schlaege gesehen`).toBeGreaterThanOrEqual(2);
      for (const i of schlaege) {
        // Mit dem Schlag steht die Waffe unten (0,5) und schwingt aus; im
        // Bild davor war sie fast dort.
        expect(bilder[i].anteil, `${art}: beim Schlag am Treffer`).toBeGreaterThanOrEqual(0.5);
        expect(bilder[i].anteil, `${art}: beim Schlag am Treffer`).toBeLessThan(0.8);
        expect(bilder[i - 1].anteil, `${art}: davor ausgeholt`).toBeGreaterThan(0.3);
        expect(bilder[i - 1].anteil, `${art}: davor ausgeholt`).toBeLessThanOrEqual(0.5);
      }
      // Zwischen zwei Schlaegen: einmal ausschwingen, ruhen, einmal ausholen -
      // die Figur faengt genau einmal neu an, und die meiste Zeit steht sie.
      for (let n = 1; n < schlaege.length; n++) {
        const zwischen = bilder.slice(schlaege[n - 1], schlaege[n]);
        let anfaenge = 0;
        for (let i = 1; i < zwischen.length; i++) if (zwischen[i - 1].anteil === 0 && zwischen[i].anteil > 0) anfaenge++;
        expect(anfaenge, `${art}: eine Bewegung je Schlag`).toBe(1);
        const ruhe = zwischen.filter((b) => b.anteil === 0).length / zwischen.length;
        expect(ruhe, `${art}: Anteil der Ruhe zwischen zwei Schlaegen`).toBeGreaterThan(0.45);
      }
    }
  });
});

// Rueckmeldung des Benutzers (2026-11-17): "Die Richtung in die ein Soldat
// schlaegt, ist meist nicht die, in die er wirklich jemandem weh tut. auch
// umfallen tun sie nur in eine richtug meistens" - und: "Auch bei den
// Bogenschuetzen, der erste Pfeil kommt bevor sie den Bogen ziehen."
test.describe('Schlag und Ziel', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  /** Die Einheit dieser Art und dieses Besitzers, die dem Platz am naechsten steht - sobald es sie gibt. */
  const finden = (seite, art, eigen, ort) => seite.evaluate(async ({ art, eigen, ort }) => {
    const a = window.ansicht;
    const k = a.werte.einheiten[art].kuerzel;
    const suchen = () => [...a.nachher.values()]
      .filter((e) => e.k === k && !e.s && (e.b === a.ich) === eigen && Math.hypot(e.x - ort.x, e.y - ort.y) < 3)
      .sort((l, r) => Math.hypot(l.x - ort.x, l.y - ort.y) - Math.hypot(r.x - ort.x, r.y - ort.y))[0];
    while (!suchen()) await new Promise((weiter) => setTimeout(weiter, 50));
    const e = suchen();
    return { i: e.i, x: e.x, y: e.y };
  }, { art, eigen, ort });

  // Die Zeile der Tafel, in der eine Figur von hier nach dort schaut: 0 zum
  // Betrachter, 2 nach rechts, 4 von ihm weg, 6 nach links. Auf dem Schirm
  // liegt (dx, dy) der Karte bei (dx - dy, (dx + dy) / 2).
  const zeileNach = (von, nach) => {
    const dx = nach.x - von.x;
    const dy = nach.y - von.y;
    const winkel = (Math.atan2(dx + dy, dx - dy) * 180) / Math.PI;
    return ((Math.round((90 - winkel) / 45) % 8) + 8) % 8;
  };
  const abstand = (l, r) => Math.min((l - r + 8) % 8, (r - l + 8) % 8);

  test('bedienung AC-76: wer schiesst, schaut auf sein befohlenes Ziel, auch wenn ein anderer Gegner naeher steht - und wer faellt, liegt zu dem hin, der ihn traf', async ({}, info) => {
    const { anna, code } = partie;
    await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
    await zeitraffer(anna, code, 1);
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const ort = { x: basis.x + 1, y: basis.y + 10 };
    // Zwei Rammen von Bert: sie schlagen nicht zurueck und halten Pfeile lange aus.
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { ...ort, art: 'bogenschuetze' })).toBe(1);
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { x: ort.x - 2, y: ort.y, art: 'ramme' })).toBe(1);
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { x: ort.x + 5, y: ort.y, art: 'ramme' })).toBe(1);
    const schuetze = await finden(anna, 'bogenschuetze', true, ort);
    const nah = await finden(anna, 'ramme', false, { x: ort.x - 2, y: ort.y });
    const fern = await finden(anna, 'ramme', false, { x: ort.x + 5, y: ort.y });
    expect(Math.hypot(nah.x - schuetze.x, nah.y - schuetze.y), 'die eine Ramme steht naeher').toBeLessThan(Math.hypot(fern.x - schuetze.x, fern.y - schuetze.y));
    await anna.evaluate(({ o }) => {
      const a = window.ansicht;
      a.kamera.zoom = 2;
      a.blickAuf(o.x + 1, o.y);
    }, { o: ort });

    // Das befohlene Ziel bleibt das Ziel (kampf AC-25) - und dorthin schaut er.
    await anna.evaluate(({ id, ziel }) => window.ansicht.befehlSenden([id], { x: Math.round(ziel.x), y: Math.round(ziel.y) }, false), { id: schuetze.i, ziel: fern });
    const lage = await anna.evaluate(({ id, zielId }) => new Promise((fertig, geplatzt) => {
      const a = window.ansicht;
      const beginn = performance.now();
      let schuesse = 0;
      let zuletzt;
      const bild = () => {
        const e = a.nachher.get(id);
        const z = a.nachher.get(zielId);
        if (e?.sl !== undefined && e.sl !== zuletzt) {
          zuletzt = e.sl;
          schuesse += 1;
        }
        // Nach dem zweiten Schuss: der erste kann noch der auf die nahe sein.
        if (schuesse >= 2 && e.zr !== undefined && a.richtungen.get(id) !== undefined) {
          fertig({ zr: e.zr, zeile: a.richtungen.get(id), ich: { x: e.x, y: e.y }, ziel: { x: z.x, y: z.y } });
          return;
        }
        if (performance.now() - beginn > 25_000) geplatzt(new Error('der Bogenschuetze schiesst nicht'));
        else requestAnimationFrame(bild);
      };
      requestAnimationFrame(bild);
    }), { id: schuetze.i, zielId: fern.i });
    // Der Server nennt die Richtung als Achtel der Karte, das Bild nimmt die Zeile dazu.
    expect(lage.zeile, 'die Zeile der Tafel ist die Richtung des Servers').toBe((((1 - lage.zr) % 8) + 8) % 8);
    expect(abstand(lage.zeile, zeileNach(lage.ich, lage.ziel)), 'er schaut zur befohlenen Ramme').toBeLessThanOrEqual(1);
    expect(abstand(lage.zeile, zeileNach(lage.ich, nah)), 'und nicht zur naeheren').toBeGreaterThanOrEqual(2);
    expect(await figurenFrei(anna)).toEqual([]);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-76',
      titel: 'Annas Bogenschütze schießt auf die befohlene Ramme und schaut dorthin - die andere steht näher, auf seiner anderen Seite',
      test: info,
    });

    // Wer faellt: ein Ritter erschlaegt einen Dorfbewohner.
    const platz = { x: ort.x, y: ort.y + 7 };
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { ...platz, art: 'ritter' })).toBe(1);
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { x: platz.x + 3, y: platz.y, art: 'dorfbewohner' })).toBe(1);
    const ritter = await finden(anna, 'ritter', true, platz);
    const opfer = await finden(anna, 'dorfbewohner', false, { x: platz.x + 3, y: platz.y });
    await anna.evaluate(({ id, ziel }) => window.ansicht.befehlSenden([id], { x: Math.round(ziel.x), y: Math.round(ziel.y) }, false), { id: ritter.i, ziel: opfer });
    const fall = await anna.evaluate(({ id, ritterId }) => new Promise((fertig, geplatzt) => {
      const a = window.ansicht;
      const beginn = performance.now();
      let taeter = null;
      const bild = () => {
        const e = a.nachher.get(id);
        const r = a.nachher.get(ritterId);
        if (r && e && !e.s) taeter = { x: r.x, y: r.y, opfer: { x: e.x, y: e.y } };
        // Gefallen und im Bild schon gedreht.
        if (e?.s && e.zr !== undefined && a.richtungen.get(id) === (((1 - e.zr) % 8) + 8) % 8) {
          fertig({ zr: e.zr, zeile: a.richtungen.get(id), taeter });
          return;
        }
        if (performance.now() - beginn > 25_000) geplatzt(new Error(`der Dorfbewohner faellt nicht oder dreht sich nicht: ${JSON.stringify({ s: e?.s, zr: e?.zr, zeile: a.richtungen.get(id) })}`));
        else requestAnimationFrame(bild);
      };
      requestAnimationFrame(bild);
    }), { id: opfer.i, ritterId: ritter.i });
    expect(fall.taeter, 'der Ritter stand beim letzten Schlag im Bild').not.toBeNull();
    expect(abstand(fall.zeile, zeileNach(fall.taeter.opfer, fall.taeter)), 'der Gefallene liegt zum Ritter hin gedreht').toBeLessThanOrEqual(1);
  });

  test('bedienung AC-79: beim ersten Schuss spannt der Bogenschuetze erst - der Pfeil fliegt, wenn die Sehne los ist', async ({}, info) => {
    const { anna, code } = partie;
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    // Abseits der Rammen von eben; die Ramme hier steht ausser Sicht des Schuetzen.
    const ort = { x: basis.x + 1, y: basis.y - 10 };
    expect(await einheitenAufstellen(anna, code, 'Anna', 1, { ...ort, art: 'bogenschuetze' })).toBe(1);
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { x: ort.x + 10, y: ort.y, art: 'ramme' })).toBe(1);
    const schuetze = await finden(anna, 'bogenschuetze', true, ort);
    const ramme = await finden(anna, 'ramme', false, { x: ort.x + 10, y: ort.y });
    await anna.evaluate(({ o }) => {
      const a = window.ansicht;
      a.kamera.zoom = 2;
      a.blickAuf(o.x + 6, o.y);
    }, { o: ort });
    await anna.waitForTimeout(600);
    expect(await anna.evaluate((id) => window.ansicht.nachher.get(id).sl, schuetze.i), 'vor dem Befehl schiesst er nicht').toBeUndefined();

    // Bild fuer Bild vom ersten Schuss an: wo steht die Bewegung (0 bereit,
    // bis 0,5 ausholen, 0,5 die Sehne los), und fliegt schon ein Pfeil? Mit
    // `anhalten` bleibt das Bild im ersten stehen, in dem der Schuss da ist.
    const aufnehmen = (anhalten) => anna.evaluate(({ id, zielId, anhalten }) => new Promise((fertig, geplatzt) => {
      const a = window.ansicht;
      const ziel = a.nachher.get(zielId);
      a.befehlSenden([id], { x: Math.round(ziel.x), y: Math.round(ziel.y) }, false);
      const beginn = performance.now();
      const bilder = [];
      const bild = () => {
        const jetzt = performance.now();
        const e = a.nachher.get(id);
        if (e?.sl !== undefined) {
          // Nur seine Pfeile: der Schuetze aus dem Fall davor schiesst noch.
          const seine = a.pfeile.filter((p) => Math.hypot(p.x0 - e.x, p.y0 - e.y) < 0.6);
          const fliegt = seine.filter((p) => jetzt >= p.start).length;
          bilder.push({ anteil: a.schlagAnteil(e), fliegt, wartet: seine.length - fliegt });
          if (anhalten) {
            a.anhalten(true);
            fertig(bilder);
            return;
          }
          if (fliegt > 0 && bilder.length > 1) {
            fertig(bilder);
            return;
          }
        }
        if (jetzt - beginn > 30_000) geplatzt(new Error('der Bogenschuetze schiesst nicht'));
        else requestAnimationFrame(bild);
      };
      requestAnimationFrame(bild);
    }), { id: schuetze.i, zielId: ramme.i, anhalten });

    const bilder = await aufnehmen(false);
    // Gemessen beim Bauen: der Pfeil wartet 350 ms, ohne die Regel fliegt er
    // im ersten Bild, in dem der Schuss da ist.
    expect(bilder[0].anteil, 'im ersten Bild holt er aus').toBeLessThan(0.5);
    expect(bilder[0].fliegt, 'und kein Pfeil ist in der Luft').toBe(0);
    expect(bilder[0].wartet, 'der Pfeil wartet auf die Sehne').toBe(1);
    const davor = bilder.filter((b) => b.fliegt === 0);
    expect(davor.length, 'mehrere Bilder lang spannt er').toBeGreaterThanOrEqual(3);
    for (let i = 1; i < davor.length; i++) expect(davor[i].anteil, 'er holt weiter aus').toBeGreaterThanOrEqual(davor[i - 1].anteil);
    const flug = bilder.find((b) => b.fliegt > 0);
    // Der Pfeil wartet nach der Wanduhr, die Bewegung laeuft mit den Takten:
    // kommt ein Zustand ein paar Millisekunden spaeter, steht sie bei 0,49
    // statt 0,5. Ein ganzer Takt Verzug waere 0,36.
    expect(flug.anteil, 'der Pfeil fliegt, wenn die Sehne los ist').toBeGreaterThanOrEqual(0.4);
    expect(flug.anteil, 'und nicht erst lange danach').toBeLessThan(0.8);

    // Fuer das Bild: zurueck ausser Sicht, noch einmal befohlen - und im
    // ersten Bild des Schusses bleibt es stehen.
    await anna.evaluate(({ id, o }) => window.ansicht.befehlSenden([id], { x: o.x, y: o.y }, false), { id: schuetze.i, o: ort });
    await anna.waitForFunction(({ id, o }) => {
      const e = window.ansicht.nachher.get(id);
      return e && e.sl === undefined && Math.hypot(e.x - o.x, e.y - o.y) < 1.5;
    }, { id: schuetze.i, o: ort }, { timeout: 30_000 });
    // Die Pfeile von eben sind angekommen (ein Flug dauert unter einer Sekunde).
    await anna.waitForTimeout(1500);
    const stand = await aufnehmen(true);
    expect(stand[0].anteil, 'angehalten im Ausholen').toBeLessThan(0.5);
    expect(stand[0]).toMatchObject({ fliegt: 0, wartet: 1 });
    await anna.evaluate((id) => {
      const a = window.ansicht;
      const e = a.nachher.get(id);
      a.blickAuf(e.x + 2, e.y);
    }, schuetze.i);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-79',
      titel: 'Der erste Schuss, im Bild angehalten: Annas Bogenschütze spannt den Bogen, sein Pfeil ist noch nicht in der Luft',
      test: info,
    });
    await anna.evaluate(() => window.ansicht.anhalten(false));
  });
});
