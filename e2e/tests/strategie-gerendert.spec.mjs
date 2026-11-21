// Die gerenderten Gebaeude im Spiel (→ specs/10-strategie/darstellung.md
// AC-22, ADR-0016): jedes Gebaeude der Daten kommt aus einer Tafel der Kette,
// die Baustelle in ihren Stufen, Mauer und Tor aus ihren Stuecken.
//
// Aufgestellt wird aus den Daten - ein neues Gebaeude ohne Tafel laesst den
// Fall fallen, ohne dass ihn jemand anfasst.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, GRIFFHAFEN, test } from '../helpers/seite.mjs';
import { gebaeudeInDerNaehe, partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const DARSTELLUNG = '10-strategie/darstellung.md';

test.describe('Gerenderte Gebaeude', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel.
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
  });
  test.afterAll(() => partieBeenden(partie));

  test('darstellung AC-22: jedes Gebaeude der Daten steht gerendert im Spiel, die Baustelle in ihren Stufen, Mauer und Tor aus Stuecken', async ({}, info) => {
    const { anna, code } = partie;
    const basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    const daten = await anna.evaluate(() => Object.entries(window.ansicht.werte.gebaeude).map(([art, g]) => ({ art, groesse: g.groesse || 1, gezogen: Boolean(g.gezogen) })));
    const stueckweise = (art) => art === 'steinmauer' || art === 'tor';

    // Jedes Gebaeude einmal fertig - das Dorfzentrum steht schon.
    const gestellt = [];
    for (const { art } of daten) {
      if (art === 'dorfzentrum' || stueckweise(art)) continue;
      gestellt.push({ art, id: await gebaeudeInDerNaehe(anna, code, 'Anna', art, basis, { von: 5, bis: 28 }) });
    }

    // Vier Haeuser im Bau, eines je Stufe, und je Groesse eine Baustelle -
    // vor dem Dorf, wo im Bild nichts davor steht.
    const vorn = { x: basis.x + 9, y: basis.y + 9 };
    const stufen = [0.1, 0.35, 0.6, 0.85];
    for (const bau of stufen) {
      gestellt.push({ art: 'haus', bau, id: await gebaeudeInDerNaehe(anna, code, 'Anna', 'haus', vorn, { von: 1, bis: 20, bau }) });
    }
    const groessen = [...new Set(daten.map((g) => g.groesse))].sort();
    for (const groesse of groessen) {
      const art = daten.find((g) => g.groesse === groesse && !stueckweise(g.art) && g.art !== 'dorfzentrum' && g.art !== 'farm').art;
      gestellt.push({ art, bau: 0.6, id: await gebaeudeInDerNaehe(anna, code, 'Anna', art, vorn, { von: 3, bis: 20, bau: 0.6 }) });
    }

    // Eine Mauer mit Ecke und einem Tor in der Geraden: der Browser sucht den
    // Platz, an dem jedes Feld taugt, der Pruefgriff stellt Feld um Feld.
    const mauer = await anna.evaluate((b) => {
      const a = window.ansicht;
      for (let r = 6; r <= 30; r++) {
        for (const [ox, oy] of [[b.x - r, b.y + 2], [b.x + 2, b.y - r], [b.x + r - 6, b.y + r], [b.x - r, b.y - r], [b.x + r, b.y - 2]]) {
          // Neun Felder in einer Reihe: zwei Mauer, das Tor ueber vier
          // (bauen AC-37, sein Anker ist das dritte davon), drei Mauer.
          const felder = [];
          const frei = [];
          for (let i = 0; i < 9; i++) {
            frei.push({ x: ox + i, y: oy });
            if (i < 2 || i > 5) felder.push({ x: ox + i, y: oy, art: 'steinmauer' });
            else if (i === 4) felder.push({ x: ox + i, y: oy, art: 'tor' });
          }
          for (let i = 1; i < 4; i++) felder.push({ x: ox + 8, y: oy + i, art: 'steinmauer' });
          for (let i = 1; i < 3; i++) felder.push({ x: ox - i, y: oy + i, art: 'steinmauer' });
          if ([...frei, ...felder].every((f) => a.platzTaugt('steinmauer', f.x, f.y))) return felder;
        }
      }
      return null;
    }, basis);
    expect(mauer, 'kein Platz fuer eine Mauer mit Ecke').not.toBeNull();
    for (const feld of mauer) {
      const antwort = await anna.request.post(`http://localhost:${GRIFFHAFEN}/griff`, {
        data: { id: code, befehl: 'gebaeude', werte: { name: 'Anna', art: feld.art, x: feld.x, y: feld.y } },
      });
      expect(antwort.ok(), `${feld.art} auf ${feld.x}, ${feld.y}`).toBe(true);
      gestellt.push({ art: feld.art, id: (await antwort.json()).id });
    }
    await anna.waitForFunction((ids) => ids.every((id) => window.ansicht.gebaeude.has(id)), gestellt.map((g) => g.id));

    // Jedes einmal ins Bild holen und zaehlen, was aus den Tafeln kam.
    // Die Groessen der Baustellen aus den Daten - das Wunder (bauen AC-51)
    // brachte die fuenfte.
    const messung = await anna.evaluate(async ([ids, groessen]) => {
      const { bilderFehlend, gerendert } = await import('/bilder.js');
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt.clear();
      a.kamera.zoom = 1;
      const bild = () => new Promise((fertig) => requestAnimationFrame(() => requestAnimationFrame(fertig)));
      for (const g of a.gebaeude.values()) {
        if (g.b !== a.ich && !ids.includes(g.i)) continue;
        a.blickAuf(g.x, g.y);
        await bild();
      }
      const arten = Object.keys(a.werte.gebaeude);
      const tafeln = [...arten, ...groessen.map((n) => `baustelle-${n}`)];
      return {
        fehlend: bilderFehlend(),
        ohneTafel: arten.filter((art) => !gerendert(art)),
        gezeichnet: Object.fromEntries(tafeln.map((name) => [name, gerendert(name)?.gezeichnet ?? 0])),
        stufen: Object.fromEntries(groessen.map((n) => [n, gerendert(`baustelle-${n}`)?.stufen ?? 0])),
      };
    }, [gestellt.map((g) => g.id), groessen]);
    info.annotations.push({ type: 'messung', description: JSON.stringify(messung) });
    console.log(`darstellung AC-22 im Spiel: ${JSON.stringify(messung)}`);
    expect(messung.fehlend, 'Tafeln, die nicht geladen wurden').toEqual([]);
    expect(messung.ohneTafel, 'Gebaeude der Daten ohne Tafel').toEqual([]);
    for (const { art } of daten) expect(messung.gezeichnet[art], `${art} kam nicht aus seiner Tafel`).toBeGreaterThan(0);
    for (const groesse of groessen) {
      expect(messung.gezeichnet[`baustelle-${groesse}`], `Baustelle der Groesse ${groesse}`).toBeGreaterThan(0);
      expect(messung.stufen[groesse], `Stufen der Baustelle ${groesse}`).toBeGreaterThanOrEqual(4);
    }

    // Das Dorf im Ganzen.
    await anna.evaluate((b) => {
      window.ansicht.kamera.zoom = 1;
      window.ansicht.blickAuf(b.x + 3, b.y + 3);
    }, basis);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: DARSTELLUNG,
      ac: 'AC-22',
      titel: 'Annas Dorf mit jedem Gebaeude der Daten: alle gerendert, vorn Baustellen in ihren Stufen, dazu eine Mauer mit Tor',
      test: info,
    });
  });
});
