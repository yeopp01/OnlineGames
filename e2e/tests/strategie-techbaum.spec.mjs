// Der Technologiebaum (specs/10-strategie/bedienung.md AC-81 bis AC-86):
// was es an Gebaeuden, Einheiten und Verbesserungen gibt, je Zeitalter und
// Gebaeude, mit den Linien der Stufen - und je Haus, was ihm fehlt, was nur
// es hat und was es staerkt. Geoeffnet aus dem Menue im Spiel und aus dem
// Warteraum, geprueft auf dem Laptop (1366 x 768, bedienung AC-23).
//
// Die Partie spielt Wehrstein - ein Haus mit eigenen Einheiten (Pavesen-
// schuetze, Riese) und mit Boni, die Gebaeude staerken. Im Browserlauf steht
// neben den fuenf Haeusern das Pruefhaus ohne Boni (e2e/helpers/pruefhaus.mjs);
// es steht deshalb auch im Baum.
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { ANMELDUNG, expect, fehlerSammeln, test } from '../helpers/seite.mjs';
import { partieBeenden, partieZuZweit } from '../helpers/strategie.mjs';

const BEDIENUNG = '10-strategie/bedienung.md';
const LAPTOP = { breite: 1366, hoehe: 768 };

/** Den Baum aus dem Menue oeffnen und warten, bis er gezeichnet ist. */
async function ausDemMenue(seite) {
  await seite.locator('#menue').click();
  await seite.locator('#menueTechbaum').click();
  await expect(seite.locator('#techbaum')).toBeVisible();
  await expect(seite.locator('#techbaum .tb-knoten').first()).toBeVisible();
}

/** Die Daten, die der Baum zeigt - von derselben Adresse wie er selbst. */
function datenHolen(seite) {
  return seite.evaluate(() => fetch('/api/spiele/strategie/nachschlagen').then((a) => a.json()));
}

async function seiteWaehlen(seite, i) {
  await seite.locator(`[data-tb-seite="${i}"]`).click();
  await expect(seite.locator('.tb-raster')).toHaveAttribute('data-seite', String(i));
}

async function hausWaehlen(seite, haus) {
  await seite.locator(`[data-tb-haus="${haus}"]`).click();
  await expect(seite.locator('.tb-raster')).toHaveAttribute('data-haus', haus);
}

test.describe('Technologiebaum', () => {
  test.describe.configure({ mode: 'serial' });
  let partie;
  let anna;

  test.beforeAll(async ({ browser }, info) => {
    partie = await partieZuZweit(browser, info, { sicht: 'aufgedeckt', haus: 'wehrstein', ...LAPTOP });
    ({ anna } = partie);
  });

  test.afterAll(async () => {
    if (partie) await partieBeenden(partie);
  });

  test('bedienung AC-85: aus dem Menue im Spiel - die Partie laeuft darunter, keine Taste erreicht sie, Esc fuehrt zurueck', async ({}, info) => {
    expect(await anna.evaluate(() => window.ansicht.randSchieben), 'die Vorgabe schiebt am Rand').toBe(true);
    await ausDemMenue(anna);
    await expect(anna.locator('#spielmenue')).toBeHidden();
    // Die Partie laeuft weiter: die Uhr zaehlt.
    const uhr = () => anna.evaluate(() => window.ansicht.takt);
    const vorher = await uhr();
    await expect.poll(uhr).toBeGreaterThan(vorher);
    // Die Maus am Rand schiebt die Karte nicht (bedienung AC-9) ...
    expect(await anna.evaluate(() => window.ansicht.randSchieben)).toBe(false);
    // ... und keine Taste geht an das Spiel: weder die Tastenuebersicht (?)
    // noch das Menue (F10) noch das Baumenue (B).
    await anna.keyboard.press('?');
    await anna.keyboard.press('F10');
    await anna.keyboard.press('b');
    await expect(anna.locator('#tastenuebersicht')).toBeHidden();
    await expect(anna.locator('#spielmenue')).toBeHidden();
    await expect(anna.locator('#techbaum')).toBeVisible();
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-85',
      titel: 'Der Technologiebaum aus dem Menü im Spiel, als Ebene über der laufenden Partie – Wehrstein vorgewählt',
      test: info,
    });
    await anna.keyboard.press('Escape');
    await expect(anna.locator('#techbaum')).toBeHidden();
    await expect(anna.locator('#brett')).toBeVisible();
    expect(await anna.evaluate(() => window.ansicht.randSchieben), 'die Wahl des Spielers ist zurueck').toBe(true);
    // Und "Schliessen" tut dasselbe.
    await ausDemMenue(anna);
    await anna.locator('#techbaumZu').click();
    await expect(anna.locator('#techbaum')).toBeHidden();
  });

  test('bedienung AC-81: jedes Gebaeude, jede Einheit und jede Verbesserung genau einmal, in Zeilen nach Zeitalter', async ({}, info) => {
    await ausDemMenue(anna);
    await hausWaehlen(anna, '');
    const daten = await datenHolen(anna);
    await expect(anna.locator('.tb-alter strong')).toHaveText(['Landsitz', 'Lehen', 'Fürstentum', 'Krone']);
    for (const [i, seite] of daten.seiten.entries()) {
      await seiteWaehlen(anna, i);
      const erwartet = seite.gruppen.flatMap((g) => g.linien.flat().map((k) => `${g.gebaeude || ''}:${k.art}`)).sort();
      const gezeigt = await anna.locator('.tb-knoten').evaluateAll((alle) => alle.map((k) => `${k.dataset.gruppe}:${k.dataset.techbaum}`).sort());
      expect(gezeigt, `Seite ${seite.name}`).toEqual(erwartet);
      const koepfe = await anna.locator('.tb-gebaeude[data-techbaum]').evaluateAll((alle) => alle.map((k) => k.dataset.techbaum));
      expect(koepfe, `Seite ${seite.name}: je Gebaeude ein Kopf`).toEqual(seite.gruppen.filter((g) => g.gebaeude).map((g) => g.gebaeude));
    }
    // Jedes Gebaeude steht genau einmal - als Kopf oder unter "Weitere Gebaeude".
    const gebaeude = [];
    for (const [i] of daten.seiten.entries()) {
      await seiteWaehlen(anna, i);
      gebaeude.push(...await anna.locator('.tb-gebaeude[data-techbaum], .tb-knoten[data-typ="gebaeude"]').evaluateAll((alle) => alle.map((k) => k.dataset.techbaum)));
    }
    expect(gebaeude.sort()).toEqual(Object.keys(daten.werte.gebaeude).sort());
    await expect(anna.locator('.tb-gebaeude:not([data-techbaum]) .tb-gname')).toHaveText(['Weitere Gebäude']);
    // Der Drache steht beim Kloster, gerufen, nicht ausgebildet.
    await seiteWaehlen(anna, 0);
    await expect(anna.locator('.tb-knoten[data-gruppe="kloster"][data-techbaum="drache"]')).toHaveAttribute('data-typ', 'gerufen');
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-81',
      titel: 'Technologiebaum, Seite Wirtschaft, alle Häuser: Gebäude als Spalten, Landsitz bis Krone als Zeilen, rechts die weiteren Gebäude',
      test: info,
    });
    await anna.keyboard.press('Escape');
  });

  test('bedienung AC-82: Stufen mit goldenem, Verbesserungen mit grauem Pfeil - von der Vorstufe abwaerts', async ({}, info) => {
    await ausDemMenue(anna);
    await hausWaehlen(anna, '');
    for (const i of [0, 1]) {
      await seiteWaehlen(anna, i);
      const pfeile = await anna.evaluate(() => {
        const raster = document.querySelector('.tb-raster');
        const knoten = [...raster.querySelectorAll('.tb-knoten[data-vor]')];
        return {
          knoten: knoten.length,
          pfeile: [...raster.querySelectorAll('.tb-pfeil')].map((p) => {
            const nach = raster.querySelector(`.tb-knoten[data-techbaum="${p.dataset.nach}"][data-vor="${p.dataset.von}"]`);
            const von = nach && raster.querySelector(`.tb-knoten[data-gruppe="${nach.dataset.gruppe}"][data-techbaum="${p.dataset.von}"]`);
            // Eine Stufe heisst nach der Einheit, die sie zeigt.
            const zeigt = (k) => k?.dataset.einheit || k?.dataset.techbaum;
            return {
              von: zeigt(von) || p.dataset.von,
              nach: zeigt(nach) || p.dataset.nach,
              gold: p.classList.contains('gold'),
              stufe: nach?.dataset.typ === 'stufe',
              da: Boolean(von && nach),
              abwaerts: Boolean(von && nach && von.getBoundingClientRect().bottom <= nach.getBoundingClientRect().top),
            };
          }),
        };
      });
      expect(pfeile.pfeile.length, 'je Eintrag mit Vorstufe ein Pfeil').toBe(pfeile.knoten);
      for (const p of pfeile.pfeile) {
        expect(p.da, `${p.von} -> ${p.nach}: beide stehen im Baum`).toBe(true);
        expect(p.abwaerts, `${p.von} -> ${p.nach}: der Pfeil zeigt abwaerts`).toBe(true);
        expect(p.gold, `${p.von} -> ${p.nach}: golden genau bei einer Stufe`).toBe(p.stufe);
      }
      if (i === 1) {
        const kette = (von, nach) => pfeile.pfeile.find((p) => p.von === von && p.nach === nach);
        expect(kette('miliz', 'soldat')?.gold).toBe(true);
        expect(kette('ritter', 'kavalier')?.gold).toBe(true);
        expect(kette('kavalier', 'paladin')?.gold).toBe(true);
      } else {
        expect(pfeile.pfeile.find((p) => p.von === 'schmiedeangriff' && p.nach === 'eisenguss')?.gold).toBe(false);
      }
    }
    await seiteWaehlen(anna, 1);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-82',
      titel: 'Technologiebaum, Seite Militär, alle Häuser: goldene Pfeile von Einheit zu Stufe (Miliz bis Zweihandkämpfer, Ritter bis Paladin), an Spezialeinheiten ihr Haus',
      test: info,
    });
    await anna.keyboard.press('Escape');
  });

  test('bedienung AC-83: das eigene Haus ist vorgewaehlt - was ihm fehlt, ist blass, was nur es hat, golden, was es staerkt, traegt ein Zeichen', async ({}, info) => {
    await ausDemMenue(anna);
    await expect(anna.locator('[data-tb-haus="wehrstein"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(anna.locator('.tb-raster')).toHaveAttribute('data-seite', '1');
    await expect(anna.locator('.tb-hauszeile')).toContainText('Haus Wehrstein');
    await expect(anna.locator('.tb-hauszeile')).toContainText('Wachturm und Burg: +1 Reichweite');
    await expect(anna.locator('.tb-hauszeile')).toContainText('Nur hier: Pavesenschütze, Riese');
    await expect(anna.locator('.tb-knoten[data-techbaum="riese"]')).toHaveClass(/\beigen\b/);
    await expect(anna.locator('.tb-knoten[data-techbaum="pavesenschuetze"]')).toHaveClass(/\beigen\b/);
    for (const fremd of ['kriegswolf', 'eibenschuetze', 'reiterschuetze', 'meuchler', 'wiedergaenger']) {
      await expect(anna.locator(`.tb-knoten[data-techbaum="${fremd}"]`)).toHaveClass(/\bfehlt\b/);
    }
    // Wehrstein staerkt Gebaeude (+10 % Leben) - am Kopf das Zeichen.
    await expect(anna.locator('.tb-gebaeude[data-techbaum="burg"]')).toHaveClass(/\bgestaerkt\b/);
    await expect(anna.locator('.tb-knoten[data-techbaum="wachturm"]')).toHaveClass(/\bgestaerkt\b/);
    // Die Werte kommen je Haus vom Server: die Burg Wehrsteins reicht weiter.
    const daten = await datenHolen(anna);
    expect(daten.jeHaus.wehrstein.burg.reichweite).toBe(daten.jeHaus[daten.ohne].burg.reichweite + 1);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-83',
      titel: 'Technologiebaum mit Haus Wehrstein: Boni oben, Pavesenschütze und Riese golden, die Einheiten der anderen Häuser blass, gestärkte Gebäude mit Zeichen',
      test: info,
    });

    // Ein anderes Haus: Eschenbruch hat seine Schuetzen gestaerkt, Wehrsteins Riesen nicht.
    await hausWaehlen(anna, 'eschenbruch');
    await expect(anna.locator('.tb-knoten[data-techbaum="eibenschuetze"]')).toHaveClass(/\beigen\b/);
    await expect(anna.locator('.tb-knoten[data-techbaum="riese"]')).toHaveClass(/\bfehlt\b/);
    await expect(anna.locator('.tb-knoten[data-techbaum="bogenschuetze"]')).toHaveClass(/\bgestaerkt\b/);
    // Alle Haeuser: an jeder Spezialeinheit steht, wem sie gehoert.
    await hausWaehlen(anna, '');
    await expect(anna.locator('.tb-knoten[data-techbaum="riese"] .tb-nurhaus')).toHaveText('Wehrstein');
    await expect(anna.locator('.tb-knoten.fehlt, .tb-knoten.eigen')).toHaveCount(0);
    await anna.keyboard.press('Escape');
  });

  test('bedienung AC-84: die Tafel der Leiste an jedem Eintrag - zeigen, Tastatur, festhalten und Esc', async ({}, info) => {
    await ausDemMenue(anna);
    const tafel = anna.locator('#techbaumTafel');
    // Zeigen: Name, Preis, Werte und ab wann.
    // Der Pikenier ist eine Stufe: der Eintrag ist die Weiterentwicklung.
    const pikenier = anna.locator('.tb-knoten[data-einheit="pikenier"]');
    await pikenier.hover();
    await expect(tafel).toBeVisible();
    await expect(tafel).toHaveAttribute('data-fuer', await pikenier.getAttribute('data-techbaum'));
    await expect(tafel).toContainText('Pikenier');
    await expect(tafel).toContainText('Gibt es ab dem Fürstentum');
    await expect(tafel.locator('.preis')).not.toBeEmpty();
    // Eine Einheit eines anderen Hauses: das steht dabei.
    await anna.locator('.tb-knoten[data-techbaum="kriegswolf"]').hover();
    await expect(tafel).toContainText('Haus Wehrstein hat das nicht');
    // Mit der Tastatur erreicht.
    await anna.locator('.tb-knoten[data-techbaum="ritter"]').focus();
    await expect(tafel).toHaveAttribute('data-fuer', 'ritter');
    await expect(tafel).toContainText('Ritter');
    // Festhalten: ein Klick, dann bleibt sie, wohin die Maus auch geht.
    await anna.locator('.tb-knoten[data-techbaum="riese"]').click();
    await anna.locator('.tb-knoten[data-techbaum="ramme"]').hover();
    await expect(tafel).toHaveAttribute('data-fuer', 'riese');
    await expect(tafel).toHaveClass(/angeheftet/);
    await expect(tafel).toContainText('Gibt es ab dem Fürstentum');
    const kasten = await tafel.boundingBox();
    expect(kasten.x >= 0 && kasten.y >= 0 && kasten.x + kasten.width <= LAPTOP.breite && kasten.y + kasten.height <= LAPTOP.hoehe, 'die Tafel steht im Fenster').toBe(true);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-84',
      titel: 'Am Riesen festgehaltene Tafel: Preis, Werte mit Wehrsteins Boni, ab dem Fürstentum – dieselbe Tafel wie an der Leiste',
      test: info,
    });
    // Esc loest sie, ein zweites Esc schliesst den Baum.
    await anna.keyboard.press('Escape');
    await expect(tafel).not.toHaveClass(/angeheftet/);
    await expect(tafel).toBeHidden();
    await expect(anna.locator('#techbaum')).toBeVisible();
    await anna.mouse.move(5, 5);
    await anna.keyboard.press('Escape');
    await expect(anna.locator('#techbaum')).toBeHidden();
  });

  test('bedienung AC-86: auf 1366 x 768 steht jede Seite in voller Breite, nichts abgeschnitten, Tafeln im Fenster', async ({}, info) => {
    expect(anna.viewportSize()).toEqual({ width: LAPTOP.breite, height: LAPTOP.hoehe });
    await ausDemMenue(anna);
    const haeuser = await anna.locator('[data-tb-haus]').evaluateAll((alle) => alle.map((k) => k.dataset.tbHaus));
    expect(haeuser.length).toBeGreaterThanOrEqual(6);
    for (const i of [0, 1]) {
      await seiteWaehlen(anna, i);
      for (const haus of haeuser) {
        await hausWaehlen(anna, haus);
        const lage = await anna.evaluate(() => {
          const rahmen = document.querySelector('.tb-rahmen');
          const r = rahmen.getBoundingClientRect();
          const schlecht = [];
          for (const k of document.querySelectorAll('.tb-knoten, .tb-gebaeude')) {
            const b = k.getBoundingClientRect();
            if (b.left < r.left - 0.5 || b.right > r.right + 0.5) schlecht.push(`${k.dataset.techbaum || 'Kopf'}: ragt aus dem Rahmen`);
            const name = k.querySelector('.tb-name, .tb-gname');
            if (name && (name.scrollWidth > name.clientWidth + 1 || name.scrollHeight > name.clientHeight + 1)) schlecht.push(`${k.dataset.techbaum}: Name abgeschnitten`);
          }
          return {
            schlecht,
            quer: rahmen.scrollWidth - rahmen.clientWidth,
            seiteQuer: document.documentElement.scrollWidth - window.innerWidth,
            baumHoch: document.querySelector('#techbaum').getBoundingClientRect().bottom - window.innerHeight,
          };
        });
        expect(lage.schlecht, `Seite ${i}, Haus ${haus || 'alle'}`).toEqual([]);
        expect(lage.quer, `Seite ${i}, Haus ${haus || 'alle'}: kein Rollen quer`).toBeLessThanOrEqual(1);
        expect(lage.seiteQuer).toBeLessThanOrEqual(0);
        expect(lage.baumHoch).toBeLessThanOrEqual(0);
      }
    }
    // Die Tafel am Eintrag ganz rechts und ganz unten bleibt im Fenster.
    await hausWaehlen(anna, 'wehrstein');
    const rand = await anna.evaluate(() => {
      const alle = [...document.querySelectorAll('.tb-knoten')];
      const rechts = alle.reduce((a, b) => (b.getBoundingClientRect().right > a.getBoundingClientRect().right ? b : a));
      const unten = alle.reduce((a, b) => (b.getBoundingClientRect().bottom > a.getBoundingClientRect().bottom ? b : a));
      return [rechts.dataset.techbaum, unten.dataset.techbaum];
    });
    for (const art of rand) {
      const knoten = anna.locator(`.tb-knoten[data-techbaum="${art}"]`).first();
      await knoten.scrollIntoViewIfNeeded();
      await knoten.hover();
      const tafel = anna.locator('#techbaumTafel');
      await expect(tafel).toHaveAttribute('data-fuer', art);
      const kasten = await tafel.boundingBox();
      expect(kasten.x >= 0 && kasten.y >= 0 && kasten.x + kasten.width <= LAPTOP.breite && kasten.y + kasten.height <= LAPTOP.hoehe, `Tafel an ${art} im Fenster`).toBe(true);
    }
    await anna.mouse.move(5, 5);
    await seiteWaehlen(anna, 1);
    await nachweis(anna, {
      spec: BEDIENUNG,
      ac: 'AC-86',
      titel: 'Der Baum auf 1366 × 768, Seite Militär mit Haus Wehrstein: alle Gebäude nebeneinander, ohne Rollen quer',
      test: info,
    });
    await anna.keyboard.press('Escape');
  });
});

test('bedienung AC-85: im Warteraum neben dem Start - mit dem gewaehlten Haus, Zufall ist keins', async ({ browser }, info) => {
  const optionen = { baseURL: info.project.use.baseURL, viewport: { width: LAPTOP.breite, height: LAPTOP.hoehe }, locale: 'de-DE' };
  const anna = await (await browser.newContext({ ...optionen, storageState: ANMELDUNG })).newPage();
  const fehler = fehlerSammeln(anna);
  await anna.goto('/');
  await anna.locator('[data-oeffnen="strategie"]').click();
  await anna.locator('[data-eroeffnen="strategie"]').click();
  await expect(anna.locator('#raumcode')).toHaveText(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  const knopf = anna.locator('#techbaumOeffnen');
  await expect(knopf).toBeVisible();
  await expect(knopf).toHaveText('Technologiebaum');

  // Zufall: kein Haus vorgewaehlt.
  await knopf.click();
  await expect(anna.locator('#techbaum .tb-knoten').first()).toBeVisible();
  await expect(anna.locator('[data-tb-haus=""]')).toHaveAttribute('aria-pressed', 'true');
  await anna.keyboard.press('Escape');
  await expect(anna.locator('#techbaum')).toBeHidden();

  // Mit gewaehltem Haus: dieses.
  const feld = anna.locator('#spielerliste li:not(.vom-spiel) select[data-wahl="haus"]').first();
  await feld.selectOption(JSON.stringify('distelhag'));
  await expect(feld).toHaveValue(JSON.stringify('distelhag'));
  await knopf.click();
  await expect(anna.locator('[data-tb-haus="distelhag"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(anna.locator('.tb-knoten[data-techbaum="wiedergaenger"]')).toHaveClass(/\beigen\b/);
  await nachweis(anna, {
    spec: BEDIENUNG,
    ac: 'AC-85',
    titel: 'Im Warteraum über „Technologiebaum“ neben dem Start geöffnet: das gewählte Haus Distelhag vorgewählt',
    test: info,
  });
  await anna.locator('#techbaumZu').click();
  await expect(anna.locator('#techbaum')).toBeHidden();
  await expect(anna.locator('#starten')).toBeVisible();
  expect(fehler).toEqual([]);
  await anna.context().close();
});
