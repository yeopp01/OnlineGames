// Die Feudalzeit am Stueck (→ specs/10-strategie/fahrplan.md AC-8): eine
// Partie, im Browser gespielt wie von einem Menschen - der Aufstieg als
// Auftrag im Dorfzentrum, die drei neuen Gebaeude mit B und einem Buchstaben
// gebaut, die neuen Einheiten aus ihren Knoepfen, eine Verbesserung in der
// Schmiede, und am Ende ein Gefecht, in dem Ruestung und Bonusschaden
// gemessen werden.
//
// Jede Einzelheit hat ihren eigenen Test (bauen AC-23 bis AC-26, einheiten
// AC-23, AC-24, kampf AC-1 bis AC-10). Dieser zeigt, dass sie zusammen eine
// spielbare Feudalzeit ergeben - der Pruefstein der Stufe B. Der Weg in die
// Dunkle Zeit ist fahrplan AC-3; was dort schon belegt ist, stellt hier der
// Pruefgriff auf.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { einheitenAufstellen, expect, rohstoffe, test, zeitraffer } from '../helpers/seite.mjs';
import { BAUTASTEN } from '../../public/tasten.js';
import { EINHEITEN, VERBESSERUNGEN } from '../../server/spiele/strategie/daten.js';
import {
  bedienteileFrei, dorfbewohnerAnklicken, einheitenJeArt, figurenFrei, freieWiesen,
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

test.describe('Feudalzeit am Stueck', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let basis;
  let wiesen;

  test.beforeAll(async ({ browser }, info) => {
    // Handelt nicht vom Nebel: aufgedeckt, sonst kommt Bert gar nicht an (kampf AC-13).
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt' });
    const { anna, code } = partie;
    basis = await anna.evaluate(() => window.ansicht.spieler.get(window.ansicht.ich).basis);
    // Die zwei Schlachtfelder **vor** dem Bauen suchen: `freieWiesen` verlangt
    // elf mal elf Felder Gras, und das Dorf der Feudalzeit frisst den Platz um
    // die Basis auf. Danach ist nur noch eine Wiese uebrig.
    // Rohstoffe fuer Aufstieg, drei Gebaeude, vier Einheiten und eine
    // Verbesserung; Wohnraum fuer alle. Was in der Dunklen Zeit zu tun ist,
    // belegt fahrplan AC-3 - hier stellt es der Pruefgriff auf.
    await rohstoffe(anna, code, 'Anna', { holz: 3000, nahrung: 3000, gold: 1000, stein: 500 });
    wiesen = await freieWiesen(anna, 2);
    for (let i = 0; i < 4; i++) {
      await gebaeudeInDerNaehe(anna, code, 'Anna', 'haus', basis, { von: 7 + i * 2, bis: 24 });
    }
    // Die Voraussetzung des Aufstiegs: zwei fertige Gebaeude der Dunklen Zeit
    // ausser Haeusern. Das Dorfzentrum ist eines, die Muehle das zweite. Die
    // Kaserne kommt dazu, damit der Speerkaempfer danach ein Haus hat.
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'muehle', basis, { von: 5, bis: 12 });
    await gebaeudeInDerNaehe(anna, code, 'Anna', 'kaserne', basis, { von: 6, bis: 14 });
  });
  test.afterAll(() => partieBeenden(partie));

  test('fahrplan AC-8: Aufstieg, die drei Gebaeude, die neuen Einheiten, Ruestung und Bonus - im Browser gespielt', async ({}, info) => {
    test.setTimeout(300_000);
    const { anna, code } = partie;
    const aufBasis = (zoom = 1) => anna.evaluate(([b, z]) => {
      const a = window.ansicht;
      a.kamera.zoom = z;
      a.blickAuf(b.x + 2, b.y + 2);
    }, [basis, zoom]);

    // ---- Der Aufstieg: ein Auftrag im Dorfzentrum, keine Abkuerzung. ----
    await aufBasis(1.4);
    await anna.keyboard.press('h');
    const aufstieg = anna.locator('[data-aufstieg="feudalzeit"]');
    await expect(aufstieg).toHaveCount(1);
    await expect(aufstieg).toHaveAttribute('aria-disabled', 'false');
    await aufstieg.click();
    // Er steht in der Schlange des Dorfzentrums und dauert; sofort da ist er nicht.
    await anna.waitForFunction(() => [...window.ansicht.gebaeude.values()]
      .some((g) => g.b === window.ansicht.ich && g.art === 'dorfzentrum' && g.s?.length));
    expect(await anna.evaluate(() => window.ansicht.zeitalter), 'noch Dunkle Zeit').toBe(0);
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(() => window.ansicht.zeitalter === 1, null, { timeout: 90_000 });
    await expect(anna.locator('#zeitalter')).toContainText('Feudalzeit');

    // ---- Die Gebaeude der Feudalzeit, mit B und einem Buchstaben gebaut. ----
    // Aus den Daten gelesen, nicht aufgezaehlt: was ein Dorfbewohner baut und
    // in dieser Zeit steht. Eine Stufe weiter sind es mehr.
    const arten = await anna.evaluate(() => {
      const w = window.ansicht.werte;
      // Nur was ausbildet oder forscht: der Wachturm steht auch ab der
      // Feudalzeit, schiesst aber - in Runde 125 traf er Berts Reiter vor dem
      // Speerkaempfer, und die Messung von Ruestung und Bonus unten zaehlte
      // seinen Pfeil. Seine Gebaeude belegt e2e/tests/strategie-tuerme.spec.mjs.
      // Ebenso ohne die gezogenen (die Steinmauer): sie bildet nichts aus, und
      // in Runde 127 stand ihr Bauer danach nahe der ersten Wiese - Berts
      // Reiter griff ihn an, er schlug zurueck (3), bevor der Speerkaempfer
      // kam. Die Mauer belegt e2e/tests/strategie-mauern.spec.mjs.
      return w.einheiten.dorfbewohner.baut.filter((art) => w.gebaeude[art]?.zeitalter === 1
        && !w.gebaeude[art].angriff && !w.gebaeude[art].gezogen);
    });
    expect(arten.length, 'die Gebaeude der Feudalzeit').toBeGreaterThanOrEqual(3);
    const gebaut = {};
    for (const [nummerBau, art] of arten.entries()) {
      await aufBasis(1);
      await dorfbewohnerAnklicken(anna, { code, raffer: 20 });
      const menue = await anna.locator('#baumenue [data-bauen]').evaluateAll((k) => k.map((x) => x.dataset.bauen));
      const nummer = menue.indexOf(art);
      expect(nummer, `${art} im Baumenue der Feudalzeit`).toBeGreaterThanOrEqual(0);
      await anna.keyboard.press('b');
      await anna.keyboard.press(BAUTASTEN[nummer]);
      await expect.poll(() => anna.evaluate(() => window.ansicht.platzieren?.art)).toBe(art);
      const n = await anna.evaluate((art) => window.ansicht.werte.gebaeude[art].groesse, art);
      const platz = await platzImBild(anna, { n, um: basis, abstand: 7 + n, seitlich: nummerBau % 2 === 1 });
      expect(platz, `Platz fuer ${art}`).not.toBeNull();
      const vorher = await anna.evaluate(() => window.ansicht.gebaeude.size);
      await anna.mouse.move(platz.bild.x, platz.bild.y, { steps: 3 });
      await anna.mouse.click(platz.bild.x, platz.bild.y);
      await anna.waitForFunction((v) => window.ansicht.gebaeude.size > v, vorher, { timeout: 15_000 });
      // `u` ist der Baufortschritt und steht nur an Baustellen: fehlt er, steht es.
      gebaut[art] = await anna.evaluate(async (art) => {
        const a = window.ansicht;
        const g = [...a.gebaeude.values()].find((x) => x.b === a.ich && x.art === art);
        return g.i;
      }, art);
      await anna.waitForFunction((art) => [...window.ansicht.gebaeude.values()]
        .some((g) => g.b === window.ansicht.ich && g.art === art && g.u === undefined), art, { timeout: 90_000 });
      await anna.keyboard.press('Escape');
    }

    // ---- Die neuen Einheiten aus ihren Gebaeuden. ----
    // Auch das aus den Daten: was jedes Gebaeude ausbildet, und davon die
    // Einheiten (keine Verbesserungen), die in dieser Zeit erlaubt sind.
    const kaserne = await anna.evaluate(() => {
      const a = window.ansicht;
      return [...a.gebaeude.values()].find((g) => g.b === a.ich && g.art === 'kaserne').i;
    });
    const haeuser = { ...gebaut, kaserne };
    // Der Bestand **vor** dem Bestellen. Danach wird je Art eine mehr
    // verlangt, nicht "mindestens eine": den Spaeherreiter hat jeder schon
    // zum Start (bauen AC-22), und "mindestens einer" war damit erfuellt,
    // bevor der Stall stand - vier Runden lang (Rueckschau nach Runde 83).
    const vorher = await einheitenJeArt(anna);
    const bestellt = new Set();
    for (const [art, id] of Object.entries(haeuser)) {
      // Was Stufe B neu bringt: Einheiten der Feudalzeit (Speerkaempfer aus
      // der alten Kaserne) und alles, was die neuen Gebaeude ausbilden - der
      // Spaeherreiter steht in den Daten auf Zeitalter 0, weil jeder einen
      // zum Start hat, kommt aber nur aus dem Stall.
      const neue = await anna.evaluate((art) => {
        const w = window.ansicht.werte;
        const ausDieserZeit = w.gebaeude[art].zeitalter === 1;
        // Nur bis zur Feudalzeit: der Stall bildet seit Runde 123 auch den
        // Ritter aus - den gibt es erst in der Ritterzeit.
        return (w.gebaeude[art].bildetAus || [])
          .filter((x) => w.einheiten[x] && (w.einheiten[x].zeitalter || 0) <= 1
            && (ausDieserZeit || (w.einheiten[x].zeitalter || 0) === 1));
      }, art);
      if (!neue.length) continue;
      await gebaeudeWaehlen(anna, id);
      for (const einheit of neue) {
        const knopf = anna.locator(`[data-ausbilden="${einheit}"]`);
        await expect(knopf, `${einheit} in ${art}`).toHaveCount(1);
        await expect(knopf, `${einheit} bezahlbar`).toHaveAttribute('aria-disabled', 'false');
        await knopf.click();
        bestellt.add(await anna.evaluate((e) => window.ansicht.werte.einheiten[e].kuerzel, einheit));
      }
    }
    expect(bestellt.size, 'bestellte Arten der Feudalzeit').toBeGreaterThanOrEqual(4);
    await zeitraffer(anna, code, 20);
    await anna.waitForFunction(([kuerzel, vorher]) => {
      const a = window.ansicht;
      const je = {};
      for (const e of a.nachher.values()) if (e.b === a.ich && !e.s) je[e.k] = (je[e.k] || 0) + 1;
      return kuerzel.every((k) => (je[k] || 0) > (vorher[k] || 0));
    }, [[...bestellt], vorher], { timeout: 120_000 });

    // ---- Die Schmiede forscht: Schmiedeangriff trifft Infanterie und Kavallerie. ----
    await gebaeudeWaehlen(anna, gebaut.schmiede);
    await anna.locator('[data-ausbilden="schmiedeangriff"]').click();
    await anna.waitForFunction(() => window.ansicht.verbesserungen.includes('schmiedeangriff'), null, { timeout: 60_000 });
    await zeitraffer(anna, code, 1);

    // ---- Ruestung und Bonus, am Leben des Ziels gemessen. ----
    // Zwei fremde Spaeherreiter auf einer freien Wiese. Auf den ersten schlaegt
    // ein Speerkaempfer ein: 3 Angriff + 1 Schmiedeangriff (Infanterie) + 15
    // Bonus gegen Kavallerie - 0 Nahruestung. Auf den zweiten schiesst ein
    // Bogenschuetze: 4 Angriff - 2 Fernruestung, **ohne** den Schmiedeangriff,
    // denn der trifft Infanterie und Kavallerie, nicht Bogenschuetzen. Beide
    // Erwartungen werden aus `ansicht.werte` gerechnet, nicht hier beziffert.
    const [wiese, zweite] = wiesen;
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'spaeherreiter', x: wiese.x, y: wiese.y })).toBe(1);
    expect(await einheitenAufstellen(anna, code, 'Bert', 1, { art: 'spaeherreiter', x: zweite.x, y: zweite.y })).toBe(1);

    // Die Erwartung wird hier in Node aus derselben Tabelle gerechnet, aus der
    // der Server liest - nicht im Browser: der bekommt `klassen` und `bonus`
    // nicht geschickt (die Leiste zeigt sie heute nicht). Die Formel steht in
    // specs/10-strategie/kampf.md AC-2 und ist dort einzeln belegt; hier wird
    // gemessen, ob sie im Browser auch ankommt.
    const wert = (art, feld, verbesserungen) => {
      let v = EINHEITEN[art][feld] || 0;
      for (const s of [art, ...(EINHEITEN[art].klassen || [])]) {
        for (const name of verbesserungen) v += VERBESSERUNGEN[name]?.wirkung?.[s]?.[feld] || 0;
      }
      return v;
    };
    const schaden = (angreifer, ziel, verbesserungen) => {
      const feld = wert(angreifer, 'reichweite', verbesserungen) > 0 ? 'fernruestung' : 'nahruestung';
      let bonus = 0;
      for (const k of [ziel, ...(EINHEITEN[ziel].klassen || [])]) bonus += EINHEITEN[angreifer].bonus?.[k] || 0;
      return Math.max(1, wert(angreifer, 'angriff', verbesserungen) - wert(ziel, feld, verbesserungen) + bonus);
    };
    const gelernt = await anna.evaluate(() => window.ansicht.verbesserungen);
    expect(gelernt, 'der Schmiedeangriff ist erforscht').toContain('schmiedeangriff');
    const erwartung = {
      kuerzel: Object.fromEntries(['speerkaempfer', 'bogenschuetze', 'spaeherreiter']
        .map((art) => [art, EINHEITEN[art].kuerzel])),
      // Speerkaempfer: 3 Angriff + 1 Schmiedeangriff (Infanterie) + 15 Bonus
      // gegen Kavallerie - 0 Nahruestung des Reiters = 19.
      speerAufReiter: schaden('speerkaempfer', 'spaeherreiter', gelernt),
      // Bogenschuetze: 4 Angriff - 2 Fernruestung = 2. **Ohne** den
      // Schmiedeangriff: der trifft Infanterie und Kavallerie, nicht
      // Bogenschuetzen - die Verbesserung geht ueber die Klasse, nicht die Art.
      bogenAufReiter: schaden('bogenschuetze', 'spaeherreiter', gelernt),
      reiterVoll: EINHEITEN.spaeherreiter.leben,
    };

    // Der Bonus muss sich zeigen: ohne ihn waere der Speerkaempfer schwaecher
    // als der Bogenschuetze, mit ihm ein Mehrfaches davon.
    expect(erwartung.speerAufReiter, 'Bonus gegen Kavallerie').toBeGreaterThan(erwartung.bogenAufReiter * 3);

    const treffer = async (kuerzel, feld) => {
      // Bis zu drei Rechtsklicks: im grossen Browserlauf traf der erste zweimal
      // nicht (Runden 99 und 100) - unter Last verschiebt sich die Lage
      // zwischen Messen und Klicken, und aus dem Angriff wird ein Laufbefehl.
      // Gemessen wird hier der Schaden, nicht die Treffsicherheit des Klicks
      // (die belegt kampf AC-1).
      let bild = null;
      for (let versuch = 0; versuch < 3; versuch++) {
        bild = await anna.evaluate(([k, f, zielK]) => {
          const a = window.ansicht;
          const meine = [...a.nachher.entries()].filter(([, e]) => e.b === a.ich && e.k === k);
          const [zielId, ziel] = [...a.nachher.entries()]
            .filter(([, e]) => e.b !== a.ich && e.k === zielK && !e.s)
            .sort(([, p], [, q]) => Math.hypot(p.x - f.x, p.y - f.y) - Math.hypot(q.x - f.x, q.y - f.y))[0];
          // Nur einer schlaegt zu: sonst ist der Verlust die Summe mehrerer.
          a.gewaehltesGebaeude = null;
          a.ausgewaehlt = new Set([meine[0][0]]);
          a.beiAuswahl();
          a.kamera.zoom = 1.8;
          a.blickAuf((meine[0][1].x + ziel.x) / 2, (meine[0][1].y + ziel.y) / 2);
          return { punkt: a.zuBild(ziel.x, ziel.y), zielId };
        }, [kuerzel, feld, erwartung.kuerzel.spaeherreiter]);
        await anna.mouse.click(bild.punkt.x, bild.punkt.y, { button: 'right' });
        const getroffen = await anna.waitForFunction((id) => window.ansicht.nachher.get(id)?.h !== undefined, bild.zielId, { timeout: 25_000 })
          .then(() => true, () => false);
        if (getroffen) break;
      }
      // `h` steht nur an beschaedigten Einheiten: der erste Wert ist der erste
      // Treffer. Die Nachladezeit ist mindestens zwei Sekunden, die Ansicht
      // bekommt jeden Takt - der zweite Schlag kommt also nicht dazwischen.
      await anna.waitForFunction((id) => window.ansicht.nachher.get(id)?.h !== undefined, bild.zielId, { timeout: 1_000 });
      return anna.evaluate((id) => window.ansicht.nachher.get(id).h, bild.zielId);
    };

    const nachSpeer = await treffer(erwartung.kuerzel.speerkaempfer, wiese);
    expect(erwartung.reiterVoll - nachSpeer, 'Speerkaempfer gegen Reiter: Angriff mit Schmiedeangriff plus Bonus').toBe(erwartung.speerAufReiter);
    const nachBogen = await treffer(erwartung.kuerzel.bogenschuetze, zweite);
    expect(erwartung.reiterVoll - nachBogen, 'Bogenschuetze gegen Reiter: Angriff minus Fernruestung, ohne Schmiedeangriff').toBe(erwartung.bogenAufReiter);

    // ---- Das Bild: das Dorf der Feudalzeit. ----
    // Das erste Bild dieser Runde zeigte die drei Gebaeude - und die vier
    // neuen Einheiten verstreut als kleine blaue Punkte zwischen Baeumen. Die
    // Unterschrift behauptete sie, das Bild belegte sie nicht. Deshalb werden
    // sie erst vor den Gebaeuden gesammelt und ausgewaehlt: die Leiste unten
    // zeigt dann je Art ein Bildchen mit Anzahl.
    await anna.keyboard.press('Escape');
    const truppe = await anna.evaluate(([kuerzel, arten]) => {
      const a = window.ansicht;
      const mitten = arten.map((art) => {
        const g = [...a.gebaeude.values()].find((x) => x.b === a.ich && x.art === art);
        return a.gebaeudeMitte(g);
      });
      const mx = mitten.reduce((s, m) => s + m.x, 0) / mitten.length;
      const my = mitten.reduce((s, m) => s + m.y, 0) / mitten.length;
      // Nicht die Gebaeudemitte selbst: dort standen die vier beim ersten
      // Versuch halb hinter einem Beerenstrauch. Gesucht wird der naechste
      // Fleck freies Gras, drei mal drei Felder, in dem nichts steht.
      const g = a.karte.groesse;
      const frei = (x, y) => {
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (a.karte.felder[(y + dy) * g + (x + dx)] !== 0) return false;
            if (a.gebaeudeAn && a.gebaeudeAn(x + dx, y + dy)) return false;
          }
        }
        return true;
      };
      let wiese = null;
      for (let r = 3; r < 14 && !wiese; r++) {
        for (const [sx, sy] of [[0, 1], [1, 1], [-1, 1], [1, 0], [-1, 0], [0, -1], [1, -1], [-1, -1]]) {
          const x = Math.round(mx + r * sx);
          const y = Math.round(my + r * sy);
          if (x > 2 && y > 2 && x < g - 3 && y < g - 3 && frei(x, y)) { wiese = { x, y }; break; }
        }
      }
      if (!wiese) throw new Error('kein freier Fleck fuer die Truppe');
      // Je Art die erste eigene Einheit - mehr waere ein Klumpen.
      const ids = kuerzel.map((k) => [...a.nachher.entries()].find(([, e]) => e.b === a.ich && e.k === k)?.[0])
        .filter((id) => id !== undefined);
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set(ids);
      a.beiAuswahl();
      a.kamera.zoom = 1;
      a.blickAuf(wiese.x, wiese.y);
      return { ids, sammel: wiese, gebaeude: { x: mx, y: my }, punkt: a.zuBild(wiese.x, wiese.y) };
    }, [[...bestellt], arten]);
    expect(truppe.ids.length, 'je Art eine Einheit').toBe(bestellt.size);
    await anna.mouse.click(truppe.punkt.x, truppe.punkt.y, { button: 'right' });
    await zeitraffer(anna, code, 10);
    // Angekommen heisst angekommen: jede steht drei Felder um den Sammelpunkt.
    await anna.waitForFunction(([ids, s]) => ids.every((id) => {
      const e = window.ansicht.nachher.get(id);
      return e && Math.hypot(e.x - s.x, e.y - s.y) < 4;
    }), [truppe.ids, truppe.sammel], { timeout: 90_000 });
    await zeitraffer(anna, code, 1);

    const stand = await anna.evaluate(([arten, kuerzel, ids, sammel, mitte]) => {
      const a = window.ansicht;
      const meine = [...a.gebaeude.values()].filter((g) => g.b === a.ich && g.u === undefined).map((g) => g.art);
      const eigene = [...a.nachher.values()].filter((e) => e.b === a.ich);
      // Die Gruppe wieder waehlen - das Laufen hat die Auswahl nicht verloren,
      // aber die Leiste soll den Stand nach der Ankunft zeigen.
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set(ids);
      a.beiAuswahl();
      // Naeher heran, damit man die vier Figuren auseinanderhaelt; der Blick
      // liegt zwischen der Truppe und den Gebaeuden, damit beides im Bild ist.
      a.kamera.zoom = 1.3;
      a.blickAuf((sammel.x + mitte.x) / 2, (sammel.y + mitte.y) / 2);
      return {
        fehlen: arten.filter((art) => !meine.includes(art)),
        einheiten: Object.fromEntries(kuerzel.map((k) => [k, eigene.filter((e) => e.k === k).length])),
        zeitalter: a.zeitalter,
        verbesserungen: a.verbesserungen,
      };
    }, [arten, [...bestellt], truppe.ids, truppe.sammel, truppe.gebaeude]);
    expect(stand.fehlen, 'alle Gebaeude der Feudalzeit stehen fertig').toEqual([]);
    expect(stand.zeitalter).toBe(1);
    expect(stand.verbesserungen).toContain('schmiedeangriff');
    for (const [k, n] of Object.entries(stand.einheiten)) {
      expect(n, `Einheiten ${k} - vorher ${vorher[k] || 0}`).toBeGreaterThan(vorher[k] || 0);
    }
    // Die Leiste nennt jede der vier Arten mit Bild und Anzahl: das belegt die
    // Unterschrift, nicht das Auge auf dem Spielfeld.
    await expect(anna.locator('.auswahlleiste .gruppe-eintrag')).toHaveCount(bestellt.size);
    for (const name of ['Speerkämpfer', 'Bogenschütze', 'Plänkler', 'Späherreiter']) {
      await expect(anna.locator(`.gruppe-eintrag[title$="${name}"]`), name).toHaveCount(1);
    }
    await expect(anna.locator('#zeitalter')).toContainText('Feudalzeit');
    await expect(anna.locator('#zeitalter')).toBeInViewport();
    // Die drei neuen Gebaeude sollen auch im Bild stehen, nicht nur in der Welt.
    const sichtbar = await anna.evaluate((arten) => {
      const a = window.ansicht;
      const f = { b: a.leinwand.clientWidth, h: a.leinwand.clientHeight };
      return arten.filter((art) => {
        const g = [...a.gebaeude.values()].find((x) => x.b === a.ich && x.art === art);
        const p = a.zuBild(...Object.values(a.gebaeudeMitte(g)));
        return p.x > 40 && p.x < f.b - 40 && p.y > 60 && p.y < f.h - 160;
      });
    }, arten);
    expect(sichtbar.sort(), 'alle drei neuen Gebaeude im Bild').toEqual([...arten].sort());
    expect(await figurenFrei(anna, { nur: truppe.ids }), 'keine zwei Figuren uebereinander').toEqual([]);
    expect(await bedienteileFrei(anna)).toEqual([]);
    await anna.waitForTimeout(300);
    await nachweis(anna, {
      spec: FAHRPLAN,
      ac: 'AC-8',
      titel: 'Die Feudalzeit im Browser gespielt: oben das Zeitalter, Schießanlage, Stall und Schmiede gebaut, davor die vier Einheiten der Feudalzeit — unten zählt die Leiste sie als vier ausgewählte',
      test: info,
    });
  });
});
