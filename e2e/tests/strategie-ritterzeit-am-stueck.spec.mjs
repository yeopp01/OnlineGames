// Die Ritterzeit am Stueck (→ specs/10-strategie/fahrplan.md AC-14): eine
// Partie, im Browser gespielt wie von einem Menschen - der Aufstieg als
// Auftrag im Dorfzentrum, jedes Gebaeude, das Stufe D gebracht hat, mit B und
// einem Buchstaben gebaut (die Steinmauer gezogen, das Tor auf sie gesetzt),
// jede Einheit der Ritterzeit aus ihrem Knopf, und am Ende ein Schlag der
// Ramme auf ein fremdes Haus, am Leben des Hauses gemessen.
//
// Jede Einzelheit hat ihren eigenen Test (bauen AC-27 bis AC-34, einheiten
// AC-33 bis AC-38, kampf AC-19 bis AC-21). Dieser zeigt, dass sie zusammen eine
// spielbare Ritterzeit ergeben - der Pruefstein der Stufe D, wie fahrplan AC-8
// fuer die Feudalzeit. Was dort schon im Browser gebaut wurde (Schiessanlage,
// Stall, Schmiede), stellt hier der Pruefgriff auf.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { BAUTASTEN } from '../../public/tasten.js';
import { EINHEITEN, GEBAEUDE } from '../../server/spiele/strategie/daten.js';
import {
  bedienteileFrei, dorfbewohnerAnklicken, einheitenJeArt, ersterTreffer, figurenFrei, freieWiesen,
  gebaeudeInDerNaehe, partieBeenden, partieZuZweit, platzImBild,
} from '../helpers/strategie.mjs';

const FAHRPLAN = '10-strategie/fahrplan.md';

/** Ein Gebaeude anwaehlen und die Kamera darauf richten. */
async function gebaeudeWaehlen(page, id, zoom = 1.4) {
  await page.waitForFunction((g) => window.ansicht.gebaeude.has(g), id);
  await page.evaluate(([g, z]) => {
    const a = window.ansicht;
    a.kamera.zoom = z;
    a.ausgewaehlt.clear();
    a.gewaehltesGebaeude = g;
    const m = a.gebaeudeMitte(a.gebaeude.get(g));
    a.blickAuf(m.x, m.y);
    a.beiAuswahl();
  }, [id, zoom]);
}

/** Ein Feld der Karte als Punkt auf der Seite (nicht auf der Leinwand). */
const aufSeite = (page, feld) => page.evaluate((f) => {
  const a = window.ansicht;
  const p = a.zuBild(f.x, f.y);
  const r = a.leinwand.getBoundingClientRect();
  return { x: r.left + p.x, y: r.top + p.y };
}, feld);

const eigeneFertig = (page, art) => page.evaluate((art) => [...window.ansicht.gebaeude.values()]
  .filter((g) => g.b === window.ansicht.ich && g.art === art && g.u === undefined).length, art);

test.describe('Ritterzeit am Stueck', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let basis;
  let wiese;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel: aufgedeckt (kampf AC-16).
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
    const { anna, code } = partie;
    basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    // Rohstoffe fuer zwei Aufstiege, acht Gebaeude, fuenf Einheiten und die
    // Armbrust; Wohnraum fuer alle. Die Wiese fuer den Schlag wird **vor**
    // dem Bauen gesucht - danach ist um die Basis kein Gras mehr frei.
    await rohstoffe(anna, code, 'Anna', { holz: 5000, nahrung: 4000, gold: 3000, stein: 2000 });
    [wiese] = await freieWiesen(anna, 1);
    for (let i = 0; i < 3; i++) {
      await gebaeudeInDerNaehe(anna, code, 'Anna', 'haus', basis, { von: 7 + i * 2, bis: 24 });
    }
    // Die Voraussetzungen der beiden Aufstiege: zwei Gebaeude der Dunklen
    // Zeit (Dorfzentrum und Muehle) und zwei der Feudalzeit. Die drei der
    // Feudalzeit baut fahrplan AC-8 im Browser; hier stehen sie, weil Stall
    // und Schiessanlage Ritter und Armbrust ausbilden.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'muehle', basis, { von: 5, bis: 12 });
    for (const art of ['schiessanlage', 'stall', 'schmiede']) {
      await gebaeudeInDerNaehe(anna, code, 'Anna', art, basis, { von: 8, bis: 20 });
    }
  });
  test.afterAll(() => partieBeenden(partie));

  test('fahrplan AC-14: Aufstieg, jedes neue Gebaeude, jede neue Einheit und ein Schlag der Ramme - im Browser gespielt', async ({}, info) => {
    test.setTimeout(420_000);
    const { anna, code } = partie;
    const aufBasis = (zoom = 1) => anna.evaluate(([b, z]) => {
      const a = window.ansicht;
      a.kamera.zoom = z;
      a.blickAuf(b.x + 2, b.y + 2);
    }, [basis, zoom]);

    // ---- Die beiden Aufstiege: Auftraege im Dorfzentrum, keine Abkuerzung. ----
    // Der erste ist fahrplan AC-8 und laeuft hier nur durch.
    await aufBasis(1.4);
    await anna.keyboard.press('h');
    await anna.locator('[data-aufstieg="feudalzeit"]').click();
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => window.ansicht.zeitalter === 1, null, { timeout: 90_000 });
    await zeitraffer(anna, code, 1);
    await anna.keyboard.press('h');
    const aufstieg = anna.locator('[data-aufstieg="ritterzeit"]');
    await expect(aufstieg).toHaveCount(1);
    await expect(aufstieg).toHaveAttribute('aria-disabled', 'false');
    await aufstieg.click();
    await anna.waitForFunction(() => [...window.ansicht.gebaeude.values()]
      .some((g) => g.b === window.ansicht.ich && g.art === 'dorfzentrum' && g.s?.length));
    expect(await anna.evaluate(() => window.ansicht.zeitalter), 'noch Feudalzeit').toBe(1);
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => window.ansicht.zeitalter === 2, null, { timeout: 90_000 });
    await expect(anna.locator('#zeitalter')).toContainText('Ritterzeit');

    // ---- Jedes Gebaeude, das Stufe D gebracht hat. ----
    // Aus den Daten gelesen: was ein Dorfbewohner baut und in der Ritterzeit
    // dazukommt - und aus der Feudalzeit, was fahrplan AC-8 auslaesst, weil es
    // nicht ausbildet: Wachturm, Mauer, Tor, Markt kamen erst mit Stufe D, die
    // Vorlage stellt sie in die Feudalzeit. Die Mauer vor dem Tor - das Tor
    // wird auf sie gesetzt -, beide zuletzt, damit sie keinem Bauer den Weg
    // verstellen.
    const arten = await anna.evaluate(() => {
      const w = window.ansicht.werte;
      const spaet = (art) => (w.gebaeude[art].gezogen ? 1 : 0) + (w.gebaeude[art].tor ? 2 : 0);
      // Was schon in der Feudalzeit ausbildet oder forscht, baut fahrplan
      // AC-8 (`bildetAus` traegt beides; eine Verbesserung zaehlt hier wie
      // eine Einheit der Feudalzeit). Der Markt bildet erst in der Ritterzeit
      // aus (einheiten AC-39) und gehoert deshalb auch hierher.
      const feudal = (art) => w.gebaeude[art].bildetAus.some((e) => !w.einheiten[e] || w.einheiten[e].zeitalter <= 1);
      return w.einheiten.dorfbewohner.baut
        .filter((art) => w.gebaeude[art]?.zeitalter === 2
          || (w.gebaeude[art]?.zeitalter === 1 && !feudal(art)))
        .sort((p, q) => spaet(p) - spaet(q));
    });
    // Was fahrplan AC-14 aufzaehlt, muss darunter sein - die Daten duerfen mehr
    // kennen (eine Stufe weiter sind es mehr).
    for (const art of ['burg', 'kloster', 'universitaet', 'belagerungswerkstatt', 'wachturm', 'steinmauer', 'tor', 'markt']) {
      expect(arten, `${art} unter den Gebaeuden der Stufe D`).toContain(art);
    }
    const wahl = async () => {
      await aufBasis(1);
      await dorfbewohnerAnklicken(anna, { code, raffer: 20 });
      const menue = await anna.locator('#baumenue [data-bauen]').evaluateAll((k) => k.map((x) => x.dataset.bauen));
      return menue;
    };
    const taste = async (menue, art) => {
      const nummer = menue.indexOf(art);
      expect(nummer, `${art} im Baumenue der Ritterzeit`).toBeGreaterThanOrEqual(0);
      await anna.keyboard.press('b');
      await anna.keyboard.press(BAUTASTEN[nummer]);
      await expect.poll(() => anna.evaluate(() => window.ansicht.platzieren?.art)).toBe(art);
    };
    let mauerlinie = null;
    for (const [nummerBau, art] of arten.entries()) {
      const menue = await wahl();
      const vorher = await anna.evaluate(() => window.ansicht.gebaeude.size);
      if (GEBAEUDE[art].gezogen) {
        // Gezogen statt geklickt (bauen AC-30): fuenf Felder in einer Reihe,
        // vor dem Dorf, alle frei und im Bild.
        mauerlinie = await anna.evaluate(([b, art]) => {
          const a = window.ansicht;
          const breit = a.leinwand.clientWidth;
          const hoch = a.leinwand.clientHeight;
          for (let r = 9; r < 22; r++) {
            for (const [dx, dy] of [[0, r], [r, 0], [-r, r], [r, -r], [0, -r], [-r, 0]]) {
              const von = { x: b.x + dx - 2, y: b.y + dy };
              const felder = [0, 1, 2, 3, 4].map((i) => ({ x: von.x + i, y: von.y }));
              if (!felder.every((f) => a.platzTaugt(art, f.x, f.y, 1))) continue;
              const bild = felder.map((f) => a.zuBild(f.x, f.y));
              if (bild.every((p) => p.x > 120 && p.x < breit - 120 && p.y > 120 && p.y < hoch - 300)) return felder;
            }
          }
          return null;
        }, [basis, art]);
        expect(mauerlinie, 'fuenf freie Felder fuer die Mauer').not.toBeNull();
        await taste(menue, art);
        const start = await aufSeite(anna, mauerlinie[0]);
        const ende = await aufSeite(anna, mauerlinie[4]);
        await anna.mouse.move(start.x, start.y);
        await anna.mouse.down();
        await anna.mouse.move(ende.x, ende.y, { steps: 8 });
        await anna.mouse.up();
        await expect.poll(() => anna.evaluate(() => window.ansicht.gebaeude.size), { message: 'fuenf Baustellen der Mauer' })
          .toBe(vorher + 5);
        await zeitraffer(anna, code, 20);
        await expect.poll(() => eigeneFertig(anna, art), { message: 'die Mauer steht', timeout: 90_000 }).toBe(5);
      } else if (GEBAEUDE[art].tor) {
        // Auf das mittlere Feld der eigenen Mauer gesetzt, das es ersetzt (bauen AC-31).
        expect(mauerlinie, 'die Mauer steht vor dem Tor').not.toBeNull();
        await taste(menue, art);
        const feld = await aufSeite(anna, mauerlinie[2]);
        await anna.mouse.move(feld.x, feld.y, { steps: 3 });
        await anna.mouse.click(feld.x, feld.y);
        await expect.poll(() => anna.evaluate((t) => [...window.ansicht.gebaeude.values()]
          .some((g) => g.art === 'tor' && g.x === t.x && g.y === t.y), mauerlinie[2]), { message: 'das Tor als Baustelle' }).toBe(true);
        await zeitraffer(anna, code, 20);
        await expect.poll(() => eigeneFertig(anna, art), { message: 'das Tor steht', timeout: 90_000 }).toBe(1);
      } else {
        await taste(menue, art);
        const n = GEBAEUDE[art].groesse || 1;
        const platz = await platzImBild(anna, { n, um: basis, abstand: 7 + n, seitlich: nummerBau % 2 === 1 });
        expect(platz, `Platz fuer ${art}`).not.toBeNull();
        await anna.mouse.move(platz.bild.x, platz.bild.y, { steps: 3 });
        await anna.mouse.click(platz.bild.x, platz.bild.y);
        await expect.poll(() => anna.evaluate(() => window.ansicht.gebaeude.size), { message: `${art} als Baustelle`, timeout: 15_000 })
          .toBeGreaterThan(vorher);
        // `u` ist der Baufortschritt und steht nur an Baustellen: fehlt er, steht es.
        await zeitraffer(anna, code, 20);
        await expect.poll(() => eigeneFertig(anna, art), { message: `${art} fertig`, timeout: 90_000 }).toBeGreaterThan(0);
      }
      await zeitraffer(anna, code, 1);
      await anna.keyboard.press('Escape');
    }

    // ---- Jede Einheit der Ritterzeit aus ihrem Gebaeude. ----
    // Auch das aus den Daten: jede Einheit auf Zeitalter 2. Bildet sie ein
    // Gebaeude aus, kommt sie aus dessen Knopf; sonst entsteht sie aus einer
    // Verbesserung, die eine aeltere austauscht (`wandelt`, einheiten AC-34) -
    // dann erst die Verbesserung, danach derselbe Knopf, der jetzt die neue
    // Stufe ausbildet.
    const plan = await anna.evaluate(() => {
      const a = window.ansicht;
      const w = a.werte;
      const eigene = [...a.gebaeude.values()].filter((g) => g.b === a.ich && g.u === undefined);
      const woher = (eintrag) => eigene.find((g) => (w.gebaeude[g.art].bildetAus || []).includes(eintrag))?.i ?? null;
      return Object.entries(w.einheiten).filter(([, e]) => e.zeitalter === 2).map(([art]) => {
        const direkt = woher(art);
        if (direkt !== null) return { art, gebaeude: direkt, verbesserung: null };
        const [v] = Object.entries(w.verbesserungen).find(([, x]) => Object.values(x.wandelt || {}).includes(art)) || [];
        return { art, gebaeude: v ? woher(v) : null, verbesserung: v || null };
      });
    });
    expect(plan.length, 'Einheiten der Ritterzeit').toBeGreaterThanOrEqual(5);
    for (const art of ['ritter', 'armbrustschuetze', 'moench', 'ramme', 'mangonel']) {
      expect(plan.map((p) => p.art), `${art} unter den Einheiten der Ritterzeit`).toContain(art);
    }
    for (const p of plan) expect(p.gebaeude, `woher ${p.art} kommt`).not.toBeNull();
    // Erst die Verbesserungen, die austauschen.
    for (const p of plan.filter((x) => x.verbesserung)) {
      await gebaeudeWaehlen(anna, p.gebaeude);
      await anna.locator(`[data-ausbilden="${p.verbesserung}"]`).click();
    }
    if (plan.some((x) => x.verbesserung)) {
      await zeitraffer(anna, code, 20);
      await anna.waitForFunction((vs) => vs.every((v) => window.ansicht.verbesserungen.includes(v)),
        plan.filter((x) => x.verbesserung).map((x) => x.verbesserung), { timeout: 90_000 });
      await zeitraffer(anna, code, 1);
    }
    // Der Bestand **vor** dem Bestellen; verlangt wird je Art eine mehr.
    const vorher = await einheitenJeArt(anna);
    const bestellt = [];
    for (const p of plan) {
      await gebaeudeWaehlen(anna, p.gebaeude);
      const knopf = anna.locator(`[data-ausbilden="${p.art}"]`);
      await expect(knopf, `${p.art} im Gebaeude`).toHaveCount(1);
      await expect(knopf, `${p.art} bezahlbar`).toHaveAttribute('aria-disabled', 'false');
      await knopf.click();
      bestellt.push(EINHEITEN[p.art].kuerzel);
    }
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(([kuerzel, vorher]) => {
      const a = window.ansicht;
      const je = {};
      for (const e of a.nachher.values()) if (e.b === a.ich && !e.s) je[e.k] = (je[e.k] || 0) + 1;
      return kuerzel.every((k) => (je[k] || 0) > (vorher[k] || 0));
    }, [bestellt, vorher], { timeout: 120_000 });
    await zeitraffer(anna, code, 1);

    // ---- Ein Schlag der Ramme, am Leben eines fremden Hauses gemessen. ----
    // Erwartet aus derselben Tabelle, aus der der Server liest (kampf AC-2):
    // 2 Angriff + 125 Bonus gegen Gebaeude - 0 Nahruestung des Hauses = 127.
    // Bert hat nichts erforscht, das Haus traegt seine Grundwerte.
    const erwartet = Math.max(1, EINHEITEN.ramme.angriff - (GEBAEUDE.haus.nahruestung || 0)
      + (GEBAEUDE.haus.klassen || ['gebaeude']).reduce((s, k) => s + (EINHEITEN.ramme.bonus?.[k] || 0), 0));
    expect(erwartet, 'der Bonus traegt den Schlag').toBeGreaterThan(EINHEITEN.ramme.angriff * 10);
    // Um die Wiese herum, die vor dem Bauen frei war: im ersten Lauf stand auf
    // ihrer Mitte inzwischen ein Gebaeude der Ritterzeit.
    const hausId = await gebaeudeInDerNaehe(anna, code, 'Bert', 'haus', wiese, { von: 0, bis: 14 });
    await anna.waitForFunction((g) => window.ansicht.gebaeude.has(g), hausId);
    const haus = await anna.evaluate((g) => window.ansicht.gebaeudeMitte(window.ansicht.gebaeude.get(g)), hausId);
    // Erst hinlaufen, im Zeitraffer; gemessen wird danach mit `ersterTreffer`
    // (vierfach - bei zwanzigfacher Zeit kaemen zwei Stoesse zwischen zwei
    // Blicke, und bei normaler geht die Ramme eine halbe Minute um das Haus
    // zu ihrem Randfeld, Runde 140).
    const ramme = await anna.evaluate(([k, w]) => {
      const a = window.ansicht;
      const e = [...a.nachher.values()].find((x) => x.b === a.ich && x.k === k && !x.s);
      a.befehlSenden([e.i], { x: Math.round(w.x), y: Math.round(w.y) - 3 }, false);
      return e.i;
    }, [EINHEITEN.ramme.kuerzel, haus]);
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(([i, w]) => {
      const e = window.ansicht.nachher.get(i);
      const alt = window.ansicht.vorher.get(i);
      // Angekommen heisst: nahe am Haus und still - steht auf dem Feld
      // etwas, nimmt der Server ein freies daneben.
      return e && alt && alt.x === e.x && alt.y === e.y && Math.hypot(e.x - w.x, e.y - w.y) < 5;
    }, [ramme, haus], { timeout: 90_000 });
    await zeitraffer(anna, code, 1);
    expect(await anna.evaluate((g) => {
      const h = window.ansicht.gebaeude.get(g);
      return h.h ?? window.ansicht.gebaeudeLebenVoll(h);
    }, hausId), 'das Haus ist unversehrt')
      .toBe(GEBAEUDE.haus.leben);
    const stoss = await ersterTreffer(anna, code, { einheit: ramme, ziel: hausId, gebaeude: true, zoom: 1.6 });
    expect(stoss, 'Ramme gegen Haus: Angriff plus Bonus gegen Gebaeude').toBe(erwartet);

    // ---- Das Bild: das Dorf der Ritterzeit. ----
    // Die fuenf neuen Einheiten vor den Gebaeuden gesammelt und ausgewaehlt:
    // die Leiste unten zeigt dann je Art ein Bildchen mit Anzahl.
    await anna.keyboard.press('Escape');
    const truppe = await anna.evaluate(([kuerzel, arten, b]) => {
      const a = window.ansicht;
      const g = a.karte.groesse;
      const frei = (x, y) => {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (a.karte.felder[(y + dy) * g + (x + dx)] !== 0) return false;
            if (a.gebaeudeAn && a.gebaeudeAn(x + dx, y + dy)) return false;
          }
        }
        return true;
      };
      let sammel = null;
      for (let r = 4; r < 16 && !sammel; r++) {
        for (const [sx, sy] of [[1, 1], [0, 1], [1, 0], [-1, 1], [1, -1]]) {
          const x = Math.round(b.x + 2 + r * sx);
          const y = Math.round(b.y + 2 + r * sy);
          if (x > 3 && y > 3 && x < g - 4 && y < g - 4 && frei(x, y)) { sammel = { x, y }; break; }
        }
      }
      if (!sammel) throw new Error('kein freier Fleck fuer die Truppe');
      const ids = kuerzel.map((k) => [...a.nachher.entries()].find(([, e]) => e.b === a.ich && e.k === k && !e.s)?.[0])
        .filter((id) => id !== undefined);
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set(ids);
      a.beiAuswahl();
      a.kamera.zoom = 1;
      a.blickAuf(sammel.x, sammel.y);
      const r = a.leinwand.getBoundingClientRect();
      const p = a.zuBild(sammel.x, sammel.y);
      return { ids, sammel, punkt: { x: r.left + p.x, y: r.top + p.y } };
    }, [bestellt, arten, basis]);
    expect(truppe.ids.length, 'je Art eine Einheit').toBe(bestellt.length);
    await anna.mouse.click(truppe.punkt.x, truppe.punkt.y, { button: 'right' });
    await zeitraffer(anna, code, 10);
    await anna.waitForFunction(([ids, s]) => ids.every((id) => {
      const e = window.ansicht.nachher.get(id);
      return e && Math.hypot(e.x - s.x, e.y - s.y) < 4;
    }), [truppe.ids, truppe.sammel], { timeout: 90_000 });
    await zeitraffer(anna, code, 1);

    const stand = await anna.evaluate(([arten, ids]) => {
      const a = window.ansicht;
      const meine = [...a.gebaeude.values()].filter((g) => g.b === a.ich && g.u === undefined);
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set(ids);
      a.beiAuswahl();
      // Den Blick so weit, dass alle neuen Gebaeude im Bild stehen: Mitte
      // ihrer Huelle, der Zoom aus ihrer Ausdehnung im Bild.
      const neue = arten.map((art) => meine.find((g) => g.art === art)).filter(Boolean);
      const mitten = neue.map((g) => a.gebaeudeMitte(g));
      const mx = mitten.reduce((s, m) => s + m.x, 0) / mitten.length;
      const my = mitten.reduce((s, m) => s + m.y, 0) / mitten.length;
      return {
        fehlen: arten.filter((art) => !meine.some((g) => g.art === art)),
        mitte: { x: mx, y: my },
        zeitalter: a.zeitalter,
      };
    }, [arten, truppe.ids]);
    expect(stand.fehlen, 'alle Gebaeude der Stufe D stehen fertig').toEqual([]);
    expect(stand.zeitalter).toBe(2);
    // Den Zoom so lange verkleinern, bis jedes neue Gebaeude im Bild steht.
    const sichtbar = await anna.evaluate(([arten, mitte]) => {
      const a = window.ansicht;
      const f = { b: a.leinwand.clientWidth, h: a.leinwand.clientHeight };
      const drin = () => arten.filter((art) => {
        const g = [...a.gebaeude.values()].find((x) => x.b === a.ich && x.art === art);
        const p = a.zuBild(...Object.values(a.gebaeudeMitte(g)));
        return p.x > 40 && p.x < f.b - 40 && p.y > 60 && p.y < f.h - 200;
      });
      for (let z = 1.2; z >= 0.6; z -= 0.05) {
        a.kamera.zoom = z;
        a.blickAuf(mitte.x, mitte.y);
        if (drin().length === arten.length) return drin();
      }
      return drin();
    }, [arten, stand.mitte]);
    expect(sichtbar.sort(), 'alle neuen Gebaeude im Bild').toEqual([...arten].sort());
    await expect(anna.locator('.auswahlleiste .gruppe-eintrag')).toHaveCount(bestellt.length);
    await expect(anna.locator('#zeitalter')).toContainText('Ritterzeit');
    await expect(anna.locator('#zeitalter')).toBeInViewport();
    expect(await figurenFrei(anna, { nur: truppe.ids }), 'keine zwei Figuren uebereinander').toEqual([]);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: FAHRPLAN,
      ac: 'AC-14',
      titel: 'Die Ritterzeit im Browser gespielt: oben das Zeitalter, gebaut Burg, Universität, Kloster, Belagerungswerkstatt, Wachturm, Markt und eine Steinmauer mit Tor, davor die fünf Einheiten der Ritterzeit — unten zählt die Leiste sie als fünf ausgewählte',
      test: info,
    });
  });
});
