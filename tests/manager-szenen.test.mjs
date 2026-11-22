// Szenen (spieltag AC-27 bis AC-29): jede Chance wird erzaehlt, ohne dass
// sich ein Ergebnis aendert, und die Saetze schreibt der Server.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const kader = require('../server/spiele/manager/kader.js');
const { begegnung, anpfiff, spielen, abpfiff } = require('../server/spiele/manager/spieltag.js');
const { zufallAus } = require('../server/spiele/manager/zufall.js');
const { ARTEN, MIT_VORLAGE, AUSGANG_GEWICHT, ZONE_JE_ART } = require('../server/spiele/manager/szenen.js');
const { SAETZE } = require('../server/spiele/manager/texte.js');

const vereine = kader.weltErzeugen(4711).vereine;

function aufstellung(verein) {
  const elf = kader.elfStellen(verein, verein.taktik.system);
  return { elf, bank: kader.bankStellen(verein, elf), system: verein.taktik.system };
}

/** Eine Paarung je Nummer, nie ein Verein gegen sich selbst, mit wechselnder Taktik. */
function paarung(i) {
  const heim = vereine[i % 36];
  const gast = vereine[(i * 7 + 3) % 36 === i % 36 ? (i + 1) % 36 : (i * 7 + 3) % 36];
  const einstellungen = {
    aufstellungen: { heim: aufstellung(heim), gast: aufstellung(gast) },
    taktiken: { heim: { ausrichtung: 1 + (i % 5) }, gast: { ausrichtung: 5 - (i % 5), haerte: 1 + ((i * 3) % 5) } },
    entscheidung: i % 3 === 0,
    neutral: i % 7 === 0,
  };
  return { heim, gast, einstellungen };
}

const rundreise = (wert) => JSON.parse(JSON.stringify(wert));
const ohneSzenen = ({ szenen, ...rest }) => rest;

function aufDemPlatz(seite, id, minute) {
  const m = seite.minuten[id];
  return !!m && m.von <= minute && (m.bis == null || m.bis >= minute);
}

test('spieltag AC-27: jede Chance ist eine Szene mit Art, Zone, Beteiligten und Ausgang', () => {
  let szenenGesamt = 0;
  const arten = new Set();
  const ausgaenge = new Set();
  for (let i = 0; i < 300; i++) {
    const { heim, gast, einstellungen } = paarung(i);
    const spiel = spielen(anpfiff(heim, gast, zufallAus(500 + i), { ...einstellungen, szenen: zufallAus(900 + i) }), Infinity);
    const ergebnis = abpfiff(spiel);
    const szenen = ergebnis.szenen;
    szenenGesamt += szenen.length;

    for (const [s, welche] of [[0, 'heim'], [1, 'gast']]) {
      const eigene = szenen.filter((z) => z.seite === welche);
      assert.equal(eigene.length, ergebnis.chancen[s], `Spiel ${i}: ${welche} hat ${ergebnis.chancen[s]} Chancen, aber ${eigene.length} Szenen`);
      const tore = ergebnis.ereignisse.filter((e) => e.art === 'tor' && e.verein === spiel.seiten[s].id);
      const torszenen = eigene.filter((z) => z.ausgang === 'tor');
      assert.equal(torszenen.length, ergebnis.tore[s], `Spiel ${i}: Tore und Torszenen weichen ab`);
      for (const tor of tore) {
        assert.ok(torszenen.some((z) => z.minute === tor.minute && z.beteiligte.abschluss === tor.spielerId
          && z.beteiligte.vorlage === (tor.vorlageId ?? null)), `Spiel ${i}: zum Tor in Minute ${tor.minute} fehlt die Szene`);
      }
    }

    let vorher = 0;
    for (const z of szenen) {
      assert.ok(z.minute >= vorher, `Spiel ${i}: Szenen nicht nach der Minute geordnet`);
      vorher = z.minute;
      assert.ok(ARTEN.includes(z.art), `unbekannte Art ${z.art}`);
      assert.ok(z.ausgang === 'tor' || z.ausgang in AUSGANG_GEWICHT[z.art], `${z.art} endet nie mit ${z.ausgang}`);
      assert.ok(ZONE_JE_ART[z.art].some(([t, f]) => `${t}-${f}` === z.zone), `${z.art} spielt nicht in ${z.zone}`);
      const s = z.seite === 'heim' ? 0 : 1;
      const eigen = spiel.seiten[s];
      const gegner = spiel.seiten[1 - s];
      assert.equal(z.verein, eigen.id);
      assert.ok(aufDemPlatz(eigen, z.beteiligte.abschluss, z.minute), `Spiel ${i}, Minute ${z.minute}: der Schuetze stand nicht auf dem Platz`);
      assert.equal(MIT_VORLAGE.has(z.art), z.beteiligte.vorlage !== null, `Spiel ${i}: ${z.art} mit oder ohne Vorlage verkehrt`);
      if (z.beteiligte.vorlage) {
        assert.notEqual(z.beteiligte.vorlage, z.beteiligte.abschluss);
        assert.ok(aufDemPlatz(eigen, z.beteiligte.vorlage, z.minute), `Spiel ${i}, Minute ${z.minute}: die Vorlage stand nicht auf dem Platz`);
      }
      assert.ok(aufDemPlatz(gegner, z.beteiligte.torwart, z.minute), `Spiel ${i}, Minute ${z.minute}: der Torwart stand nicht auf dem Platz`);
      arten.add(z.art);
      ausgaenge.add(z.ausgang);
    }
  }
  assert.ok(szenenGesamt > 300 * 15, `nur ${szenenGesamt} Szenen in 300 Spielen`);
  assert.deepEqual([...arten].sort(), [...ARTEN].sort(), 'nicht jede Art kommt vor');
  assert.deepEqual([...ausgaenge].sort(), ['abseits', 'geblockt', 'gehalten', 'pfosten', 'tor', 'vorbei']);
});

test('spieltag AC-28: mit und ohne Szenen dasselbe Ergebnis ueber 2000 Spiele', () => {
  for (let i = 0; i < 2000; i++) {
    const { heim, gast, einstellungen } = paarung(i);
    const ohne = zufallAus(10_000 + i);
    const mit = zufallAus(10_000 + i);
    const erwartet = begegnung(heim, gast, ohne, einstellungen);
    const ergebnis = begegnung(heim, gast, mit, { ...einstellungen, szenen: zufallAus(20_000 + i) });
    assert.ok(ergebnis.szenen.length > 0 || ergebnis.chancen[0] + ergebnis.chancen[1] === 0);
    assert.deepEqual(ohneSzenen(ergebnis), erwartet, `Spiel ${i} weicht mit Szenen ab`);
    assert.deepEqual(mit.stand, ohne.stand, `Spiel ${i}: mit Szenen zieht der Spieltag anders weiter`);
    assert.equal('szenen' in erwartet, false, 'ohne Szenen traegt das Ergebnis kein Feld dafuer');
  }
});

test('spieltag AC-28: stueckweise mit Sicherung dazwischen dieselben Szenen wie am Stueck', () => {
  const halte = [[45, 90], [5, 20, 45, 46, 89, 90, 95, 120], [0, 60, 105]];
  for (let i = 0; i < 60; i++) {
    const { heim, gast, einstellungen } = paarung(i);
    const mitSzenen = () => ({ ...einstellungen, szenen: zufallAus(700 + i) });
    const erwartet = begegnung(heim, gast, zufallAus(300 + i), mitSzenen());
    let spiel = rundreise(anpfiff(heim, gast, zufallAus(300 + i), mitSzenen()));
    for (const minute of halte[i % halte.length]) {
      spiel = rundreise(spielen(spiel, minute));
      assert.ok(spiel.szenen.liste.every((z) => z.minute <= spiel.minute), `Spiel ${i}: eine Szene nach Minute ${spiel.minute}`);
    }
    assert.deepEqual(abpfiff(spiel), erwartet, `Spiel ${i} weicht stueckweise ab`);
  }
});

const PLATZHALTER = ['abschluss', 'vorlage', 'torwart', 'verein', 'gegner'];

test('spieltag AC-29: je Art und Ausgang sechs Saetze, keiner doppelt, nur bekannte Platzhalter', () => {
  const alle = new Set();
  assert.deepEqual(Object.keys(SAETZE).sort(), [...ARTEN].sort());
  for (const art of ARTEN) {
    assert.deepEqual(Object.keys(SAETZE[art]).sort(), ['tor', ...Object.keys(AUSGANG_GEWICHT[art])].sort(), `${art}: Ausgaenge und Saetze passen nicht`);
    for (const [ausgang, saetze] of Object.entries(SAETZE[art])) {
      assert.ok(saetze.length >= 6, `${art}/${ausgang}: nur ${saetze.length} Saetze`);
      for (const satz of saetze) {
        assert.ok(!alle.has(satz), `doppelt: ${satz}`);
        alle.add(satz);
        const felder = [...satz.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);
        for (const feld of felder) assert.ok(PLATZHALTER.includes(feld), `${art}/${ausgang}: unbekannter Platzhalter {${feld}}`);
        if (ausgang === 'tor') assert.ok(felder.includes('abschluss'), `${art}: ein Tor ohne Torschuetzen: ${satz}`);
        if (!MIT_VORLAGE.has(art)) assert.ok(!felder.includes('vorlage'), `${art} hat keine Vorlage: ${satz}`);
        assert.ok(/[.!?]$/.test(satz), `kein Satzende: ${satz}`);
      }
    }
  }
});

test('spieltag AC-29: eingesetzt bleibt kein Platzhalter, kein Satz kommt in einem Spiel zweimal', () => {
  let gezaehlt = 0;
  for (let i = 0; i < 2000; i++) {
    const { heim, gast, einstellungen } = paarung(i);
    const { szenen } = begegnung(heim, gast, zufallAus(40_000 + i), { ...einstellungen, szenen: zufallAus(50_000 + i) });
    const gesagt = new Set();
    for (const z of szenen) {
      assert.ok(!/[{}]/.test(z.satz), `Spiel ${i}: Platzhalter stehen geblieben: ${z.satz}`);
      assert.ok(!gesagt.has(z.satz), `Spiel ${i}: zweimal derselbe Satz: ${z.satz}`);
      gesagt.add(z.satz);
      gezaehlt += 1;
    }
  }
  assert.ok(gezaehlt > 2000 * 15);
});

test('spieltag AC-29: zwei Spieler einer Begegnung heissen im Satz nie gleich', () => {
  let voll = 0;
  for (let i = 0; i < 300; i++) {
    const { heim, gast, einstellungen } = paarung(i);
    const { szenen } = anpfiff(heim, gast, zufallAus(i), { ...einstellungen, szenen: zufallAus(i) });
    const namen = Object.values(szenen.genannt);
    assert.equal(new Set(namen).size, namen.length, `Spiel ${i}: ein Name steht fuer zwei Spieler`);
    voll += namen.filter((n) => n.includes(' ')).length;
  }
  assert.ok(voll > 0, 'kein Doppel in 300 Begegnungen - der Test sieht den Fall nicht');
});

/** Alle Dateien unter einem Ordner. */
function dateienUnter(ordner) {
  return readdirSync(ordner).flatMap((name) => {
    const pfad = join(ordner, name);
    return statSync(pfad).isDirectory() ? dateienUnter(pfad) : [pfad];
  });
}

test('spieltag AC-29: der Browser setzt keinen Satz zusammen', () => {
  const browser = dateienUnter(new URL('../public', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'))
    .filter((p) => /\.(js|mjs|html)$/.test(p));
  assert.ok(browser.length > 5);
  for (const pfad of browser) {
    const text = readFileSync(pfad, 'utf8');
    // `${gegner}` ist JavaScript, `{gegner}` waere ein Satz mit Luecke.
    for (const feld of PLATZHALTER) assert.ok(!new RegExp(`(?<!\\$)\\{${feld}\\}`).test(text), `${pfad} enthaelt den Platzhalter {${feld}}`);
    assert.ok(!/texte(\.js)?['"]/.test(text), `${pfad} laedt die Saetze`);
  }
});
