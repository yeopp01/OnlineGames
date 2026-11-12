// Handgriffe fuer das Strategiespiel im Browser. Rueckschau nach Runde 20:
// der Start einer Partie zu zweit stand kopiert in jeder Spielbild-Datei.
//
// ## Was `window.ansicht` fuehrt (Stand Rueckschau nach Runde 72)
//
// Der Server schickt kurze Namen, damit ein Zustand klein bleibt
// (uebertragung AC-7) - das hat schon dreimal Zeit gekostet (Runden 67, 69,
// 72). Die Tafel steht deshalb hier und nicht in `welt.js`:
//
// **`ansicht.nachher`** (Map id -> Einheit), auch `ansicht.vorher`:
//   `i` Id · `b` Besitzer · `k` Kuerzel der Art · `x`/`y` · `l` Ladung ·
//   `a` erster Buchstabe der Ladungsart · `h` Lebenspunkte, **absolut, und nur
//   wenn welche fehlen** (voll wird gar nicht geschickt - der Anteil ist
//   `h / ansicht.lebenVoll(e)`) · `w` arbeitet oder kaempft gerade (bedienung AC-31, AC-39) · `s` gefallen ·
//   `r` ruht nach dem Bekehren (einheiten AC-38) · `hd` die Strecke eines Karrens,
//   `[heimatmarkt, zielmarkt, Gold je Fahrt]`, nur solange er handelt (einheiten AC-40) ·
//   `q` wie viele Ziele mit Umschalt noch in der Reihe warten, nur wenn welche (bedienung AC-14;
//   die Punkte selbst merkt sich der Browser in `ansicht.wegpunkte`).
//
// ### KUERZEL
// Diese Liste prueft `tests/waechter-drahttafel.test.mjs` gegen `daten.js` -
// in Runde 72 stand hier `p` Plaenkler und `k` Speerkaempfer, beides falsch
// herum, und der Fehler kostete einen Browserlauf. Nie aus dem Kopf tippen:
// im Test `window.ansicht.werte.einheiten[art].kuerzel` lesen.
//   `d` = dorfbewohner
//   `m` = miliz
//   `o` = soldat
//   `s` = spaeherreiter
//   `p` = speerkaempfer
//   `b` = bogenschuetze
//   `k` = plaenkler
//   `r` = ritter
//   `a` = armbrustschuetze
//   `w` = ramme
//   `n` = mangonel
//   `g` = moench
//   `c` = marktkarren
// ### ENDE KUERZEL
//
// **`ansicht.gebaeude`** (Map id -> Gebaeude): `i` · `art` **ausgeschrieben**
//   (nicht `a`!) · `b` Besitzer · `x`/`y` · `h` Leben · `u` Baufortschritt,
//   **nur an Baustellen** - fehlt `u`, ist das Gebaeude fertig · `n` Nahrung
//   einer Farm (voll: `ansicht.farmVoll(g)`) · `s` Warteschlange · `f`
//   Fortschritt des **laufenden Auftrags** (nicht "fertig"!) · `p`
//   Sammelpunkt · `w` wartet.
//
// **Marktpreise** (bauen AC-33): `hp` je Spieler, `{ holz: [kauf, verkauf],
//   nahrung: [...], stein: [...] }` in Gold je 100, im Aufbau und danach nur
//   nach einem Handel; im Browser `ansicht.handelspreise` (nur die eigenen).
//
// Dazu `ansicht.ich`, `ansicht.spieler` (Map, mit `basis`, und `team` 1..4, nur
// wenn eins gesetzt ist; spielziel AC-14), `ansicht.feindlich(besitzer)`, `ansicht.zeitalter`,
// `ansicht.werte`, `ansicht.verbesserungen`, `ansicht.zuBild(x, y)`,
// `ansicht.gebaeudeMitte(g)`, `ansicht.platzTaugt(x, y)`.
//
// **Spieler im Zustand** (`spieler`, je Eintrag): `id` · Vorraete und `bev`/`raum`
//   (fremde nur, wer die Sicht teilt; bedienung AC-20) · `z` Zeitalter · `aus` ·
//   `pk` Punkte, von **jedem** an alle, fehlt bei 0 (bedienung AC-47). Im
//   Browser `ansicht.stand` (Map id -> { zeitalter, aus, punkte, vorraete }).
//
// **Geloeste Buendnisse** (spielziel AC-21): `bu` im Zustand und im Aufbau,
//   je `[wer, Takt des Fristendes]`, an alle - solange es Kuendigungen gibt.
//   Liegt `t` darueber, gehoert `wer` keinem Team mehr an. Im Browser
//   `ansicht.kuendigungen` (Map wer -> Takt des Fristendes), `ansicht.teamVon(id)`
//   (null nach der Frist), `ansicht.teiltSicht(besitzer)` (sieht man durch
//   seine Augen? - waehrend der Frist schon nicht mehr), `ansicht.buendnisse`
//   ('loesbar' oder 'fest', aus dem Aufbau) und `ansicht.kannKuendigen()`
//   (spielziel AC-24).
//
// **Zeitgrenze** (spielziel AC-22): `zeitgrenze` im Aufbau, Spielminuten
//   oder null (Vorgabe: keine). Im Browser `ansicht.zeitgrenze`; die Leiste
//   zeigt sie hinter der Uhr (`#spielzeit .zeitgrenze`, " / 90:00").
//   `partieMit(…, { zeitgrenze: 90 })` waehlt sie beim Eroeffnen.
// **Geschwindigkeit** (spielziel AC-23): `tempo` im Aufbau (1, 1.5, 2),
//   `takte` bleibt 10 je Spielsekunde. Im Browser `ansicht.tempo`,
//   `ansicht.taktdauer` = 1000 / (takte * tempo). Einstellung `tempo`,
//   `partieMit(…, { geschwindigkeit: 1.5 })`.
//
// **Werte im Browser** (Runde 75): `ansicht.werte.einheiten[art]` fuehrt
// Kuerzel, Leben, Tragkraft, Kosten, Zeit, `baut`, Zeitalter, Angriff,
// Ruestung nah und fern, Reichweite - und seit Runde 75 auch `klassen` und
// `bonus`, seit Runde 134 `heilen` ({ reichweite, je } oder null), seit
// Runde 135 `bekehren` ({ reichweite, nicht } oder null);
// `ansicht.werte.klassen` nennt den Anzeigenamen je Klasse. Das sind
// die **rohen** Werte ohne Verbesserungen.
//
// **Mit Verbesserungen** steht die Tafel je Spieler in
// `ansicht.einheitenwerte` (Map Spieler-Id -> art -> {leben, angriff,
// nahruestung, fernruestung, reichweite}); der Server rechnet sie mit
// `welt.einheitenwert()` und schickt sie als `kw` im Aufbau und danach nur,
// wenn sich etwas geaendert hat. Im Test fragt man
// `ansicht.einheitenwert(einheit, 'angriff')` - nie selbst summieren.
// Wer den Schaden eines Treffers ausrechnen will, importiert `daten.js` in
// Node (so macht es `strategie-feudalzeit.spec.mjs`).
import { HAEUSER } from '../../server/spiele/strategie/daten.js';
import { ANMELDUNG, GRIFFHAFEN, expect, fehlerSammeln, zeitraffer } from './seite.mjs';
import { PRUEFHAUS } from './pruefhaus.mjs';

// **Haeuser** (spielauswahl AC-24): seit Runde 169 hat jeder Platz im
// Warteraum ein Haus, Vorgabe Zufall aus dem Startwert - bei 4711 spielte
// Anna Eschenbruch (Bogen +1 Reichweite) und Bert Distelhag (Infanterie
// +1/+1). Wer nicht von Haeusern handelt, spielt deshalb das Haus ohne Boni,
// wie wer nicht vom Nebel handelt, aufgedeckt eroeffnet. `partieMit` setzt es
// von selbst; `partieMit(…, { haus: 'zufall' })` laesst die Vorgabe stehen,
// `{ haus: 'distelhag' }` setzt dieses fuer alle. Im Aufbau steht es als
// `haus` je Spieler (`ansicht.spieler.get(id).haus`).
//
// Seit Runde 170 hat jedes der fuenf Haeuser Boni; das Haus ohne ist das
// Pruefhaus, das nur der Browserlauf anlegt (`e2e/helpers/pruefhaus.mjs`).

/**
 * Das Haus ohne Boni. Hat das Pruefhaus eines Tages doch welche oder fehlt
 * es, bricht der Test hier ab, statt still mit Boni zu messen.
 */
export function hausOhneBoni() {
  const boni = HAEUSER[PRUEFHAUS]?.boni;
  if (!boni || Object.keys(boni).length || Object.keys(HAEUSER[PRUEFHAUS].boniAb || {}).length) {
    throw new Error(`Das Pruefhaus "${PRUEFHAUS}" fehlt in HAEUSER oder hat Boni (e2e/helpers/pruefhaus.mjs).`);
  }
  return PRUEFHAUS;
}

/**
 * Der Gastgeber setzt im Warteraum jedem Platz, die KIs eingeschlossen, ein
 * Haus - vor dem Start, so wie ein Mensch es waehlt (spielauswahl AC-24).
 * Die Nachrichten gehen ueber dieselbe Leitung wie der Start danach, also in
 * dieser Reihenfolge an.
 */
export async function haeuserSetzen(gastgeber, haus = hausOhneBoni()) {
  const felder = gastgeber.locator('#spielerliste select[data-wahl="haus"]');
  await expect(felder.first()).toBeVisible();
  for (const feld of await felder.all()) await feld.selectOption(JSON.stringify(haus));
  for (const feld of await felder.all()) await expect(feld).toHaveValue(JSON.stringify(haus));
}

/**
 * Anna (angemeldet) eroeffnet mit festem Startwert, Bert tritt bei, Anna
 * startet. Zurueck kommen beide Seiten, der Raumcode und die gesammelten
 * Fehler beider Seiten - fuer `afterAll`.
 *
 * @param {import('@playwright/test').Browser} browser
 * @param {import('@playwright/test').TestInfo} info
 * @param {{startwert?: number, breite?: number, hoehe?: number, sicht?: string}} [wie]
 *   `sicht`: 'nebel' (Vorgabe), 'erkundet' oder 'aufgedeckt' (kampf AC-16) -
 *   Tests, die nicht vom Nebel handeln, eroeffnen aufgedeckt.
 */
export function partieZuZweit(browser, info, wie = {}) {
  return partieMit(browser, info, ['Bert'], wie);
}

/**
 * Dieselbe Partie zu dritt: Anna eroeffnet, Bert und Cem treten bei. Gebraucht
 * fuer alles, was erst mit einem dritten Spieler zu sehen ist - allen voran
 * das Ausscheiden, denn zu zweit ist mit dem Ausscheiden die Partie zu Ende
 * (spielziel AC-5, AC-7).
 *
 * @param {import('@playwright/test').Browser} browser
 * @param {import('@playwright/test').TestInfo} info
 * @param {{startwert?: number, breite?: number, hoehe?: number}} [wie]
 */
export function partieZuDritt(browser, info, wie = {}) {
  return partieMit(browser, info, ['Bert', 'Cem'], wie);
}

/**
 * Der gemeinsame Weg: Anna eroeffnet, die Genannten treten der Reihe nach bei,
 * Anna startet. Zurueck kommen die Seiten einzeln (`anna`, `bert`, `cem`) und
 * als Liste (`seiten`), der Raumcode und die gesammelten Fehler aller Seiten.
 *
 * @param {import('@playwright/test').Browser} browser
 * @param {import('@playwright/test').TestInfo} info
 * @param {string[]} gaeste die Namen der Beitretenden, in dieser Reihenfolge
 * @param {{startwert?: number, breite?: number, hoehe?: number, sicht?: string, teams?: number[], buendnisse?: string, zeitgrenze?: number, geschwindigkeit?: number, haus?: string, vorDemStart?: Function}} [wie]
 *   `haus`: fuer jeden Platz dieses Haus, 'zufall' fuer die Vorgabe; ohne Angabe das Haus ohne Boni.
 *   `teams`: je Seite ein Team 1..4 oder 0 (keins), im Warteraum gesetzt (auswahl AC-22).
 *   `geschwindigkeit`: 1, 1.5 oder 2 (spielziel AC-23). `vorDemStart({ anna, bert, seiten, code })`
 *   laeuft im Warteraum, wenn alle drin sind - fuer ein Bild davon.
 */
async function partieMit(browser, info, gaeste, { startwert = 4711, breite = 1400, hoehe = 950, sicht = null, teams = null, buendnisse = null, zeitgrenze = null, geschwindigkeit = null, haus = null, vorDemStart = null } = {}) {
  const optionen = { baseURL: info.project.use.baseURL, viewport: { width: breite, height: hoehe }, locale: 'de-DE' };
  const anna = await (await browser.newContext({ ...optionen, storageState: ANMELDUNG })).newPage();
  const fehler = [fehlerSammeln(anna)];

  await anna.goto('/');
  await anna.locator('[data-oeffnen="strategie"]').click();
  await anna.locator('[data-einstellung="startwert"]').fill(String(startwert));
  // Die Werte der Wahl stehen im Formular als JSON (app.js) - so wie die
  // Vorgaben sie liefern.
  if (sicht) await anna.locator('[data-einstellung="sicht"]').selectOption(JSON.stringify(sicht));
  if (buendnisse) await anna.locator('[data-einstellung="buendnisse"]').selectOption(JSON.stringify(buendnisse));
  if (zeitgrenze) await anna.locator('[data-einstellung="zeitgrenze"]').selectOption(JSON.stringify(zeitgrenze));
  if (geschwindigkeit) await anna.locator('[data-einstellung="tempo"]').selectOption(JSON.stringify(geschwindigkeit));
  await anna.locator('[data-eroeffnen="strategie"]').click();
  await expect(anna.locator('#raumcode')).toHaveText(/^[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  const code = (await anna.locator('#raumcode').textContent()).trim();

  const seiten = [anna];
  for (const name of gaeste) {
    const gast = await (await browser.newContext(optionen)).newPage();
    fehler.push(fehlerSammeln(gast));
    seiten.push(gast);
    await gast.goto('/');
    await gast.locator('#name').fill(name);
    await gast.locator('#code').fill(code);
    await gast.locator('#beitreten').click();
    // Erst weiter, wenn der Gastgeber ihn sieht: zwei Beitritte zugleich
    // haetten sonst eine unbestimmte Reihenfolge im Raum.
    await expect(anna.locator('#spielerliste li:not(.vom-spiel)')).toHaveCount(seiten.length);
  }

  // Teams (auswahl AC-22): der Gastgeber setzt jedes, so wie er es im
  // Warteraum darf - je Seite in der Reihenfolge von `seiten`.
  if (teams) {
    const zeilen = anna.locator('#spielerliste li:not(.vom-spiel)');
    for (const [i, team] of teams.entries()) {
      await zeilen.nth(i).locator('[data-wahl="team"]').selectOption(JSON.stringify(team));
    }
    // Erst weiter, wenn es der Letzte, der beitrat, auch so sieht.
    for (const [i, team] of teams.entries()) await teamZeigt(seiten.at(-1), i, team);
  }
  // Das Haus je Platz (spielauswahl AC-24): ohne Angabe das ohne Boni.
  if (haus !== 'zufall') await haeuserSetzen(anna, haus || hausOhneBoni());
  if (vorDemStart) await vorDemStart({ anna, bert: seiten[1], seiten, code });

  await anna.locator('#starten').click();
  for (const seite of seiten) {
    await expect(seite.locator('#brett')).toBeVisible();
    await seite.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0 && window.ansicht.gebaeude.size > 0);
  }
  return { anna, bert: seiten[1], cem: seiten[2], seiten, code, fehler };
}

/**
 * Zeigt die Seite in der i-ten Zeile des Warteraums (nur Menschen) dieses
 * Team? Auf dem eigenen Platz - und beim Gastgeber auf jedem - steht eine
 * Auswahl, sonst eine Marke (auswahl AC-22).
 */
export async function teamZeigt(seite, i, team) {
  const feld = seite.locator('#spielerliste li:not(.vom-spiel)').nth(i).locator('[data-wahl="team"]');
  if (await feld.evaluate((f) => f.tagName === 'SELECT')) await expect(feld).toHaveValue(JSON.stringify(team));
  else await expect(feld).toHaveText(team ? `Team ${team}` : 'ohne Team');
}

/** Alle Seiten schliessen; vorher duerfen sie keine Fehler gemeldet haben. */
export async function partieBeenden({ anna, bert, seiten, fehler }) {
  expect(fehler.flat(), 'Eine der Seiten hat Fehler gemeldet').toEqual([]);
  for (const seite of seiten || [anna, bert]) await seite?.context().close();
}

/**
 * Einen eigenen Dorfbewohner anklicken, an der Koerpermitte - bevorzugt einen,
 * der im Bild frei steht: stand ein anderer dicht daneben, traf der Klick den
 * (Runde 53, im Test der ganzen Dunklen Zeit).
 *
 * Zwei Fallen, beide in Runde 58 gefunden, beide im Zeitraffer haeufig:
 * - Wer **hinter** einem Gebaeude steht, ist seit Schritt B1 nur ein Umriss;
 *   der Klick trifft das Gebaeude davor. Solche kommen nicht in Frage.
 * - Wer **laeuft**, ist beim Klick nicht mehr dort, wo eben gemessen wurde.
 *   Im Zeitraffer steht fast nie einer still, also wird neu gemessen und noch
 *   einmal geklickt, bis einer sitzt.
 */
export async function dorfbewohnerAnklicken(page, { ohne = [], code = null, raffer = 1, auchVerdeckt = false } = {}) {
  // Mit `code` haelt die Hilfe die Zeit an, waehrend sie zielt: im Zeitraffer
  // laeuft das Ziel zwischen Messen und Klicken mehrere Felder weit.
  if (code) await zeitraffer(page, code, 1);
  const messen = () => page.evaluate(([nicht, verdeckteAuch]) => {
    const a = window.ansicht;
    const h = a.figurenHoehe();
    const alle = [...a.nachher.values()].map((e) => ({ e, p: a.zuBild(e.x, e.y) }));
    const tiere = [...a.tiere.values()].map((t) => a.zuBild(t.x, t.y));
    // Verdeckte sind nur ein Umriss hinter dem Gebaeude. **Treffen** laesst sich
    // so einer trotzdem: ein Klick sucht zuerst die naechste eigene Einheit und
    // erst danach ein Gebaeude (`auswaehlenBei`). Wer ein Bild von der Auswahl
    // macht, will ihn nicht - wer nur einen Dorfbewohner braucht, schon
    // (`auchVerdeckt`, Runde 86: im Baulauf der Dunklen Zeit standen in jedem
    // dritten Lauf **alle** verfuegbaren hinter den eben gebauten Haeusern).
    const verdeckt = verdeckteAuch ? new Set() : new Set(a.umrisse || []);
    const kandidaten = alle.filter(({ e, p }) => e.b === a.ich && e.k === 'd' && !nicht.includes(e.i)
      && !verdeckt.has(e.i)
      && p.x > 20 && p.y > h + 60 && p.x < a.leinwand.clientWidth - 20 && p.y < a.leinwand.clientHeight - 160);
    const abstand = ({ e, p }) => Math.min(
      ...alle.filter((o) => o.e.i !== e.i).map((o) => Math.hypot(o.p.x - p.x, o.p.y - p.y)),
      ...tiere.map((q) => Math.hypot(q.x - p.x, q.y - p.y)),
      Infinity,
    );
    const beste = kandidaten.sort((x, y) => abstand(y) - abstand(x))[0];
    if (beste) return { i: beste.e.i, x: beste.p.x, y: beste.p.y - h * 0.6 };
    // Keiner im Bild: im Zeitraffer laufen sie weit vom Dorf weg. Einen in
    // die Mitte holen und beim naechsten Versuch wieder messen.
    const weit = alle.find(({ e }) => e.b === a.ich && e.k === 'd' && !nicht.includes(e.i) && !verdeckt.has(e.i));
    if (weit) a.blickAuf(weit.e.x, weit.e.y);
    return null;
  }, [ohne, auchVerdeckt]);

  const gewaehlt = (id) => page.evaluate((i) => {
    const gleich = [...window.ansicht.ausgewaehlt];
    return gleich.length === 1 && gleich[0] === i;
  }, id);

  let letzte = null;
  // Steht gerade keiner frei, wird **gewartet**, nicht aufgegeben: wer hinter
  // einem Gebaeude steht, steht dort nicht lange (Runde 86 - der Fall fiel in
  // etwa jedem dritten Lauf aus, weil alle drei verfuegbaren Dorfbewohner
  // hinter den eben gebauten Haeusern sammelten). Mit `code` laeuft die Welt
  // beim Warten schneller, sonst dauerte das Warten im Spiel kaum etwas.
  for (let versuch = 0; versuch < 25; versuch++) {
    const ziel = await messen();
    if (!ziel) {
      if (code) {
        await zeitraffer(page, code, 6);
        await page.waitForTimeout(250);
        await zeitraffer(page, code, 1);
      } else {
        await page.waitForTimeout(250);
      }
      continue;
    }
    letzte = ziel;
    await page.mouse.click(ziel.x, ziel.y);
    // Kurz warten: der Zustand des naechsten Takts darf die Auswahl bestaetigen.
    for (let n = 0; n < 6; n++) {
      if (await gewaehlt(ziel.i)) {
        if (code) await zeitraffer(page, code, raffer);
        return ziel.i;
      }
      await page.waitForTimeout(100);
    }
  }
  if (!letzte) {
    // Zwoelfmal nichts gefunden - dann sagt die Meldung, woran es lag, statt
    // nur "keiner da" (Runde 86: der Fall flattert, und ohne diese Zahlen
    // faengt die Suche jedes Mal von vorn an).
    const lage = await page.evaluate((nicht) => {
      const a = window.ansicht;
      const h = a.figurenHoehe();
      const verdeckt = new Set(a.umrisse || []);
      const meine = [...a.nachher.values()].filter((e) => e.b === a.ich && e.k === 'd');
      const imRahmen = (p2) => p2.x > 20 && p2.y > h + 60
        && p2.x < a.leinwand.clientWidth - 20 && p2.y < a.leinwand.clientHeight - 160;
      return {
        eigene: meine.length,
        ausgenommen: meine.filter((e) => nicht.includes(e.i)).length,
        verdeckt: meine.filter((e) => verdeckt.has(e.i)).length,
        ausserhalb: meine.filter((e) => !imRahmen(a.zuBild(e.x, e.y))).length,
      };
    }, ohne);
    expect(letzte, `ein freistehender, unverdeckter Dorfbewohner - ${lage.eigene} eigene,`
      + ` davon ${lage.ausgenommen} ausgenommen, ${lage.verdeckt} hinter einem Gebaeude,`
      + ` ${lage.ausserhalb} ausserhalb des Rahmens`).not.toBeNull();
  }
  // Zwoelfmal danebengeklickt: die Zusicherung sagt, was zuletzt zu sehen war.
  await expect.poll(() => page.evaluate(() => [...window.ansicht.ausgewaehlt])).toEqual([letzte.i]);
  return letzte.i;
}

/**
 * Die eigenen Einheiten mit ihrer Lage auf dem Bildschirm - alle, auch die
 * ausserhalb des Ausschnitts: `x`/`y` ist der Fusspunkt, `klick` die
 * Koerpermitte, auf die ein Klick zielt (`KOERPER_MITTE` in ansicht.js),
 * `imBild` sagt, ob der Fusspunkt auf der Leinwand steht, `k` die Art,
 * `s` ob sie gefallen ist. Wer damit klickt, haelt vorher die Zeit an
 * (`zeitraffer(page, code, 0)`), sonst laeuft das Ziel weg (Rueckschau nach
 * Runde 183).
 */
export const eigeneImBild = (page) => page.evaluate(() => {
  const a = window.ansicht;
  const h = a.figurenHoehe();
  const breite = a.leinwand.clientWidth;
  const hoehe = a.leinwand.clientHeight;
  return [...a.nachher.values()]
    .filter((e) => e.b === a.ich)
    .map((e) => {
      const p = a.zuBild(e.x, e.y);
      return {
        id: e.i, k: e.k, s: Boolean(e.s), ...p,
        klick: { x: p.x, y: p.y - h * 0.6 },
        imBild: p.x >= 0 && p.x <= breite && p.y >= 0 && p.y <= hoehe,
      };
    });
});

/**
 * Die eigenen lebenden Einheiten, nach Kuerzel gezaehlt: `{ d: 3, s: 1 }`.
 * Gefallene (`s`) zaehlen nicht mit, die liegen nur noch zwei Sekunden da.
 *
 * **Wofuer:** Ein Test, der "ausgebildet" nachweisen will, vergleicht damit
 * den **Unterschied** und nicht den Bestand. Rueckschau nach Runde 83: der
 * Browsertest, der Stufe B beglaubigt, verlangte `meine.has('s')` fuer den
 * Spaeherreiter - den hat aber jeder Spieler schon zum Start (bauen AC-22).
 * Die Zusicherung war erfuellt, bevor der Stall gebaut war. Wer vorher zaehlt
 * und danach mehr verlangt, kann so nicht danebengreifen.
 */
export const einheitenJeArt = (page) => page.evaluate(() => {
  const a = window.ansicht;
  const je = {};
  for (const e of a.nachher.values()) {
    if (e.b !== a.ich || e.s) continue;
    je[e.k] = (je[e.k] || 0) + 1;
  }
  return je;
});

/** Einen Rahmen um alle eigenen Einheiten ziehen; `offen` laesst die Taste gedrueckt. */
export async function rahmenUmAlle(page, { offen = false } = {}) {
  const eigene = await eigeneImBild(page);
  const xs = eigene.map((e) => e.x);
  const ys = eigene.map((e) => e.y);
  await page.mouse.move(Math.min(...xs) - 30, Math.min(...ys) - 30);
  await page.mouse.down();
  await page.mouse.move(Math.max(...xs) + 30, Math.max(...ys) + 30, { steps: 8 });
  if (!offen) await page.mouse.up();
  return eigene;
}

// Die Feldwerte der Karte, wie `karte.js` sie zaehlt: Gras 0, Wald 1.
export const WALDFELD = 1;

/**
 * Das Waldfeld, das der eigenen Basis am naechsten liegt, als Bildpunkt - das
 * Ziel fuer einen Rechtsklick, der Holz sammeln laesst.
 */
export const waldInDerNaehe = (page) => page.evaluate((wald) => {
  const a = window.ansicht;
  const basis = a.spieler.get(a.ich).basis;
  const g = a.karte.groesse;
  let bestes = null;
  for (let y = 0; y < g; y++) {
    for (let x = 0; x < g; x++) {
      if (a.karte.felder[y * g + x] !== wald) continue;
      const abstand = Math.hypot(x - basis.x, y - basis.y);
      if (!bestes || abstand < bestes.abstand) bestes = { x, y, abstand };
    }
  }
  return a.zuBild(bestes.x, bestes.y);
}, WALDFELD);

/**
 * Wo im Bild ein Gebaeude der Groesse n ganz auf Gras stuende, ohne Schaf -
 * gerechnet aus der Karte der Ansicht, ringweise um einen Punkt. Ob die
 * Vorschau das auch so sieht, prueft der Test danach mit dem Zeiger.
 */
export function platzImBild(page, { n = 2, um, abstand = 5, seitlich = false }) {
  return page.evaluate(({ n, um, abstand, seitlich }) => {
    const a = window.ansicht;
    // Frei heisst: die Vorschau im Spiel zeigte Gruen - mit einem Feld Rand, damit
    // Figuren daneben nicht im Weg stehen.
    const frei = (x0, y0) => a.platzTaugt(Object.keys(a.werte.gebaeude).find((art) => (a.werte.gebaeude[art].groesse || 1) === n && !a.werte.gebaeude[art].begehbar) || 'haus', x0 + Math.floor(n / 2), y0 + Math.floor(n / 2), 1);
    for (let r = abstand; r < abstand + 10; r++) {
      // Vorn zuerst (dx + dy gross): dahinter verdeckt das Dorfzentrum Baustelle
      // und Bauer (Runde 23, beim Ansehen gefunden).
      const ring = [];
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r) ring.push([dx, dy]);
      }
      // Seitlich: im Bild rechts daneben (dx - dy gross), fuer Wege, die man sehen will.
      ring.sort((p, q) => (seitlich ? (q[0] - q[1]) - (p[0] - p[1]) : (q[0] + q[1]) - (p[0] + p[1])));
      for (const [dx, dy] of ring) {
        const x = Math.round(um.x) + dx;
        const y = Math.round(um.y) + dy;
        const x0 = x - Math.floor(n / 2);
        const y0 = y - Math.floor(n / 2);
        if (!frei(x0, y0)) continue;
        const p = a.zuBild(x0 + (n - 1) / 2, y0 + (n - 1) / 2);
        // Im Bild und nicht unter der Leiste unten. Die Leiste waechst mit dem
        // Baumenue: mit dem Tor bekam sie eine dritte Zeile, und der Klick auf
        // einen Platz 260 Punkte ueber dem Rand traf den Knopf der Muehle
        // (Runde 128). Deshalb ihre Oberkante, wo sie steht, mit Abstand.
        const leiste = document.querySelector('#auswahlleiste');
        const leinwand = a.leinwand.getBoundingClientRect();
        const unten = Math.min(a.leinwand.clientHeight - 260,
          leiste && !leiste.hidden && leiste.getClientRects().length ? leiste.getBoundingClientRect().top - leinwand.top - 60 : Infinity);
        if (p.x < 120 || p.x > a.leinwand.clientWidth - 120 || p.y < 120 || p.y > unten) continue;
        return { x, y, bild: p };
      }
    }
    return null;
  }, { n, um, abstand, seitlich });
}

/**
 * Die festen Teile ueber dem Spielfeld - Kopfzeile, Auswahlleiste, Knopf fuer
 * Untaetige, Uebersichtskarte, Meldung - duerfen einander nicht ueberdecken
 * und nicht aus dem Fenster ragen. Rueckschau nach Runde 50: die Auswahlleiste
 * lag eine Runde lang unter der Uebersichtskarte, kein Test hatte es gesehen.
 * Zurueck kommt die Liste der Beanstandungen, leer heisst in Ordnung.
 */
export function bedienteileFrei(page) {
  return page.evaluate(() => {
    const teile = ['#kopfzeile', '#auswahlleiste', '#untaetig', '#uebersicht', '#spielmeldung', '#angriffsmeldung', '#zeitalterwechsel', '#abschluss', '#zuschauer', '#buendnisansage', '#erklaerung']
      .map((wahl) => ({ wahl, el: document.querySelector(wahl) }))
      .filter(({ el }) => el && !el.hidden && el.getClientRects().length)
      .map(({ wahl, el }) => ({ wahl, r: el.getBoundingClientRect() }));
    const beanstandet = [];
    const breite = window.innerWidth;
    const hoehe = window.innerHeight;
    for (const { wahl, r } of teile) {
      if (r.left < 0 || r.top < 0 || r.right > breite || r.bottom > hoehe) beanstandet.push(`${wahl} ragt aus dem Fenster`);
    }
    for (let i = 0; i < teile.length; i++) {
      for (let j = i + 1; j < teile.length; j++) {
        const a = teile[i].r;
        const b = teile[j].r;
        if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) {
          beanstandet.push(`${teile[i].wahl} ueberdeckt ${teile[j].wahl}`);
        }
      }
    }
    return beanstandet;
  });
}

/**
 * Waehlt eigene Einheiten aus, ohne zu klicken, und nimmt auf Wunsch einen
 * Ort ins Bild. Fuer Faelle, in denen die Auswahl nur der Anfang ist und das
 * Kriterium vom Befehl danach handelt (Rueckschau nach Runde 198: dieselben
 * fuenf Zeilen standen in 19 Dateien).
 *
 * @param {import('@playwright/test').Page} page
 * @param {number[]} ids
 * @param {{ zoom?: number, blick?: {x: number, y: number} }} [wie]
 */
export function waehlen(page, ids, { zoom = null, blick = null } = {}) {
  return page.evaluate(([ids, zoom, blick]) => {
    const a = window.ansicht;
    a.gewaehltesGebaeude = null;
    a.ausgewaehlt = new Set(ids);
    a.beiAuswahl();
    if (zoom) a.kamera.zoom = zoom;
    if (blick) a.blickAuf(blick.x, blick.y);
  }, [ids, zoom, blick]);
}

/**
 * Der Punkt auf der Seite, an dem ein Feld, ein Gebaeude (seine Mitte) oder
 * eine Einheit gerade im Bild steht - fuer `page.mouse.click`. `null`, wenn
 * das Gebaeude oder die Einheit nicht (mehr) da ist.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ feld?: {x: number, y: number}, gebaeude?: number, einheit?: number }} wo
 * @returns {Promise<{x: number, y: number} | null>}
 */
export function aufSeite(page, wo) {
  return page.evaluate((wo) => {
    const a = window.ansicht;
    let m = wo.feld;
    if (wo.gebaeude !== undefined) {
      const g = a.gebaeude.get(wo.gebaeude);
      m = g && a.gebaeudeMitte(g);
    } else if (wo.einheit !== undefined) {
      m = a.nachher.get(wo.einheit);
    }
    if (!m) return null;
    const r = a.leinwand.getBoundingClientRect();
    const p = a.zuBild(m.x, m.y);
    return { x: r.left + p.x, y: r.top + p.y };
  }, wo);
}

/**
 * Freie Wiesen neben der eigenen Basis, je mit fuenf Feldern Gras ringsum und
 * mindestens 16 Felder auseinander. Auf Stein oder Wald sieht man die Figuren
 * zwar, aber das Bild erzaehlt dann vom Steinbruch (Runde 63); und wer zwei
 * Gefechte in einer Partie aufstellt, braucht sie weit genug auseinander, weil
 * eine stehende Kampfeinheit von selbst angreift, was sie sieht (kampf AC-2).
 *
 * **Einheiten sieht sie nicht**: ein zweiter Aufruf in derselben Partie gibt
 * dieselbe erste Wiese zurueck, auf der noch steht, was der erste Fall
 * aufgestellt hat. Ein zweiter Fall nimmt deshalb die zweite:
 * `const [, wiese] = await freieWiesen(page, 2)` (Runde 135: die wachende
 * Miliz aus einem Fall griff den Dorfbewohner des naechsten an).
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} [anzahl]
 * @returns {Promise<{x: number, y: number}[]>}
 */
export function freieWiesen(page, anzahl = 1) {
  return page.evaluate((anzahl) => {
    const a = window.ansicht;
    const g = a.karte.groesse;
    const b = a.spieler.get(a.ich).basis;
    const grasUm = (x, y, r) => {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (a.karte.felder[(y + dy) * g + (x + dx)] !== 0) return false;
        }
      }
      return true;
    };
    const gefunden = [];
    for (let r = 7; r < 26; r++) {
      for (const [sx, sy] of [[1, 1], [1, 0], [0, 1], [1, -1], [-1, 1], [-1, 0], [0, -1], [-1, -1]]) {
        const x = b.x + r * sx;
        const y = b.y + r * sy;
        if (x <= 5 || y <= 5 || x >= g - 6 || y >= g - 6 || !grasUm(x, y, 5)) continue;
        if (gefunden.every((w) => Math.hypot(w.x - x, w.y - y) > 16)) gefunden.push({ x, y });
        if (gefunden.length === anzahl) return gefunden;
      }
    }
    throw new Error(`nur ${gefunden.length} von ${anzahl} freien Wiesen gefunden`);
  }, anzahl);
}

/**
 * Figuren, die im Bild uebereinander stehen. Zurueck kommt die Liste der
 * Beanstandungen, leer heisst in Ordnung - wie bei `bedienteileFrei`.
 *
 * Rueckschau nach Runde 65: viermal (Runden 56, 61, 63, 64) hat erst das
 * Ansehen eines fertigen Bildes gezeigt, dass zwei Figuren auf einem Fleck
 * stehen - "eine Figur mit drei Schwertern", "eine Figur mit zwei Boegen". Das
 * Auge hat es jedes Mal gefunden, aber erst, nachdem das Bild schon lag. Eine
 * Zahl findet es vorher.
 *
 * Gemessen wird der Abstand in **Feldern**, nicht in Bildpunkten: er haengt
 * nicht am Zoom und ist damit eine Eigenschaft der Aufstellung, nicht der
 * Kamera. Unter einem halben Feld sind zwei Figuren ein Klumpen.
 *
 * Gefallene bleiben aussen vor - die liegen mit Absicht unter den Lebenden
 * (kampf AC-10). Nur Figuren im Bild zaehlen; was ausserhalb des Ausschnitts
 * steht, zeigt der Screenshot nicht. Gebaeude vor Figuren prueft das nicht,
 * dafuer braucht es die Grundflaeche - noch offen.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{abstand?: number, nur?: string[]}} [wie] `abstand` in Feldern,
 *   `nur` beschraenkt auf diese Einheiten-Ids.
 * @returns {Promise<string[]>}
 */
export function figurenFrei(page, { abstand = 0.5, nur = null } = {}) {
  return page.evaluate(({ abstand, nur }) => {
    const a = window.ansicht;
    const auswahl = nur ? new Set(nur) : null;
    const figuren = [...a.nachher.values()]
      .filter((e) => !e.s && (!auswahl || auswahl.has(e.i)))
      .map((e) => ({ ...e, bild: a.zuBild(e.x, e.y) }))
      .filter((e) => e.bild.x >= 0 && e.bild.x <= a.leinwand.clientWidth
        && e.bild.y >= 0 && e.bild.y <= a.leinwand.clientHeight);
    const beanstandet = [];
    for (let i = 0; i < figuren.length; i++) {
      for (let j = i + 1; j < figuren.length; j++) {
        const weit = Math.hypot(figuren[i].x - figuren[j].x, figuren[i].y - figuren[j].y);
        if (weit >= abstand) continue;
        // Mit Besitzer und Feld: "d 24 und m 27" allein sagt nicht, ob da zwei
        // Feinde aufeinander stehen oder zwei Freunde (Runde 86).
        const wer = (f) => `${f.k} ${f.i} (${f.b === a.ich ? 'eigen' : 'fremd'}, ${f.x.toFixed(1)}/${f.y.toFixed(1)})`;
        beanstandet.push(`${wer(figuren[i])} und ${wer(figuren[j])}`
          + ` stehen ${weit.toFixed(2)} Felder auseinander`);
      }
    }
    return beanstandet;
  }, { abstand, nur });
}

/**
 * Ein Gebaeude in der Naehe eines Punktes aufstellen - das erste Feld, auf dem
 * Platz ist. Ein fester Versatz geht schief, sobald dort ein Baum steht oder
 * die Karte anders faellt (Runde 60).
 *
 * @returns {Promise<string>} die Id des Gebaeudes
 */
export async function gebaeudeInDerNaehe(page, code, name, art, um, { von = 4, bis = 14 } = {}) {
  const versuche = [];
  for (let r = von; r <= bis; r++) {
    for (const [dx, dy] of [[-1, 0], [0, 1], [1, 0], [0, -1], [-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      versuche.push([um.x + dx * r, um.y + dy * r]);
    }
  }
  for (const [x, y] of versuche) {
    const antwort = await page.request.post(`http://localhost:${GRIFFHAFEN}/griff`, {
      data: { id: code, befehl: 'gebaeude', werte: { name, art, x, y } },
    });
    if (antwort.ok()) return (await antwort.json()).id;
  }
  throw new Error(`Nirgends Platz fuer ${art} um ${um.x}, ${um.y}`);
}

/**
 * Den ersten Treffer einer Einheit auf ein Ziel messen - eine Einheit oder
 * ein Gebaeude - und den Verlust an Leben zurueckgeben.
 *
 * Rueckschau nach Runde 140: die Feudalzeit und die Ritterzeit am Stueck
 * (fahrplan AC-8, AC-14) schrieben das je selbst, und beide kostete es
 * Laeufe. Der Rechtsklick wurde unter Last ein Laufbefehl (Runden 99, 100),
 * und im Zeitraffer 20 kommen zwei Stoesse zwischen zwei Blicke (Runde 140:
 * fuenf Sekunden Nachladezeit sind dort eine Viertelsekunde). Deshalb:
 * - **getroffen ist, wenn das Zielzeichen rot steht** (bedienung AC-34),
 *   hoechstens drei Rechtsklicks, die Lage jedes Mal neu gemessen;
 * - **gewartet wird im Zeitraffer `raffer`** (Vorgabe 4: zwei Sekunden
 *   Nachladezeit sind dann eine halbe echte), und der erste Abfall wird in
 *   derselben Abfrage gelesen, in der er gesehen wird; danach steht die Zeit
 *   wieder auf 1.
 * Was sonst auf das Ziel schlaegt (ein Turm, eine zweite Einheit), zaehlt
 * mit - das schliesst die Aufstellung aus, nicht diese Hilfe.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} code
 * @param {{einheit: number, ziel: number, gebaeude?: boolean, zoom?: number, raffer?: number, warten?: number}} wie
 * @returns {Promise<number>} wie viel Leben das Ziel mit dem ersten Treffer verlor
 */
export async function ersterTreffer(page, code, { einheit, ziel, gebaeude = false, zoom = 1.8, raffer = 4, warten = 60_000 }) {
  const lesen = ([z, istGebaeude]) => {
    const a = window.ansicht;
    const ding = istGebaeude ? a.gebaeude.get(z) : a.nachher.get(z);
    if (!ding) return null;
    const voll = istGebaeude ? a.gebaeudeLebenVoll(ding) : a.lebenVoll(ding);
    return ding.h ?? voll;
  };
  const vorher = await page.evaluate(lesen, [ziel, gebaeude]);
  expect(vorher, 'das Ziel gibt es').not.toBeNull();
  let getroffen = false;
  for (let versuch = 0; versuch < 3 && !getroffen; versuch++) {
    const punkt = await page.evaluate(([e, z, istGebaeude, zoomStufe]) => {
      const a = window.ansicht;
      a.gewaehltesGebaeude = null;
      a.ausgewaehlt = new Set([e]);
      a.beiAuswahl();
      const ding = istGebaeude ? a.gebaeude.get(z) : a.nachher.get(z);
      const m = istGebaeude ? a.gebaeudeMitte(ding) : { x: ding.x, y: ding.y };
      // Der Blick aufs Ziel, nicht auf die Mitte zwischen beiden: in Runde 128
      // stand der Schuetze dreissig Felder weit weg, und der Klick lag
      // ausserhalb der Leinwand.
      a.kamera.zoom = zoomStufe;
      a.blickAuf(m.x, m.y);
      a.zielzeichen = null;
      const r = a.leinwand.getBoundingClientRect();
      const p = a.zuBild(m.x, m.y);
      return { x: r.left + p.x, y: r.top + p.y };
    }, [einheit, ziel, gebaeude, zoom]);
    await page.mouse.click(punkt.x, punkt.y, { button: 'right' });
    getroffen = await page.evaluate(() => window.ansicht.zielzeichen?.feindlich === true);
  }
  expect(getroffen, 'der Rechtsklick traf das Ziel (rotes Zeichen)').toBe(true);
  await zeitraffer(page, code, raffer);
  const nachher = await page.waitForFunction(([z, istGebaeude, alt]) => {
    const a = window.ansicht;
    const ding = istGebaeude ? a.gebaeude.get(z) : a.nachher.get(z);
    if (!ding) return null;
    const h = ding.h ?? (istGebaeude ? a.gebaeudeLebenVoll(ding) : a.lebenVoll(ding));
    return h < alt ? h : null;
  }, [ziel, gebaeude, vorher], { timeout: warten }).then((h) => h.jsonValue());
  await zeitraffer(page, code, 1);
  return vorher - nachher;
}

/**
 * Die Wirtschafts-KI fuer einen Spieler im Raum uebernehmen lassen
 * (Pruefgriff `ki`, e2e/server.mjs). Danach spielt sie ueber `welt.nachricht`,
 * genau wie ein Mensch - der Browser sieht nur zu.
 */
export async function kiSpielt(page, code, name) {
  const antwort = await page.request.post(`http://localhost:${GRIFFHAFEN}/griff`, {
    data: { id: code, befehl: 'ki', werte: { name } },
  });
  expect(antwort.ok(), await antwort.text()).toBe(true);
}
