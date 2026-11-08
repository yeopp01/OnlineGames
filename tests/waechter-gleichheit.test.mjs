// WAECHTER: Gleichheit auf Daten, die mit den Stufen wachsen.
//
// Viermal in fuenf Runden ist ein gruener Test gebrochen, weil er einen ganzen
// Datensatz auf Gleichheit geprueft hat und der Datensatz ein Feld dazubekam:
// `EINHEITEN` in Runde 60 (zeitalter), `bildetAus` in Runde 61, `GEBAEUDE.farm`
// in Runde 63 (Ruestung), `auftrag` in Runde 64 (Platz und Heimat). Die Regel
// stand jedes Mal schon in der Anweisung - sie wurde nur nicht angewandt.
// Deshalb sucht sie jetzt ein Test statt eines Menschen.
//
// Runde 75 hat zwei Luecken gezeigt, beide an einem Test, der `aufbau().werte`
// prueft: der Waechter kannte nur die Tabellen aus `daten.js`, nicht ihre
// Fassung auf dem Draht (`werte.einheiten.<art>`) - und ein
// `const { baut, ...rest } = ...` machte aus wachsenden Daten einen harmlos
// aussehenden Namen. Beides faellt jetzt auf.
//
// Erlaubt bleibt Gleichheit auf einem **Blatt**: `EINHEITEN.miliz.kosten`
// waechst nicht. Verboten ist sie auf dem Datensatz selbst und auf den Listen,
// die mit jeder Stufe laenger werden. Wer es doch braucht, schreibt
// `gleichheit-ok` als Kommentar an die Zeile oder darueber und sagt warum.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const WURZEL = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const ORDNER = ['tests', 'e2e'];

// Tabellen aus daten.js: die Tabelle selbst und jeder einzelne Eintrag wachsen.
const TABELLEN = 'EINHEITEN|GEBAEUDE|VERBESSERUNGEN|TIERE|ZEITALTER|AUFSTIEGE|KLASSEN';
// Felder, die mit den Stufen mehr werden: ein Auftrag bekommt Angaben, ein
// Gebaeude bildet mehr aus, ein Dorfbewohner baut mehr.
// `einstellungen` seit Runde 101: die Liste eines Spiels bekam `ki` dazu.
const FELDER = 'auftrag|bildetAus|baut|einstellungen';
// Dasselbe ueber die Leitung: `aufbau().werte` reicht die Tabellen an den
// Browser weiter und waechst mit ihnen. In Runde 75 kamen `klassen` und
// `bonus` dazu und rissen eine Gleichheit auf `werte.einheiten.dorfbewohner`.
const DRAHT = 'einheiten|gebaeude|verbesserungen|klassen|zeitalter|aufstiege';
const WAECHST = new RegExp(
  `(^|[^.\\w])(${TABELLEN})(\\.\\w+)?$|\\.(${FELDER})$|\\bwerte\\.(${DRAHT})(\\.\\w+)?$`,
);

/** Alle .mjs-Dateien unter einem Ordner, auch in Unterordnern. */
function dateien(ordner) {
  const gefunden = [];
  for (const eintrag of readdirSync(ordner)) {
    const pfad = join(ordner, eintrag);
    if (statSync(pfad).isDirectory()) gefunden.push(...dateien(pfad));
    else if (eintrag.endsWith('.mjs')) gefunden.push(pfad);
  }
  return gefunden;
}

/**
 * Das erste Argument eines Aufrufs, der bei `von` mit "(" beginnt - als Text,
 * bis zum Komma auf oberster Ebene oder bis zur schliessenden Klammer.
 * Zeichenketten werden uebersprungen, damit ein Komma darin nicht zaehlt.
 */
function erstesArgument(quelle, von) {
  let tiefe = 0;
  let inZeichen = null;
  for (let i = von; i < quelle.length; i++) {
    const z = quelle[i];
    if (inZeichen) {
      if (z === '\\') i += 1;
      else if (z === inZeichen) inZeichen = null;
      continue;
    }
    if (z === '"' || z === "'" || z === '`') { inZeichen = z; continue; }
    if ('([{'.includes(z)) { tiefe += 1; continue; }
    if (')]}'.includes(z)) {
      tiefe -= 1;
      if (tiefe === 0) return quelle.slice(von + 1, i);
      continue;
    }
    if (z === ',' && tiefe === 1) return quelle.slice(von + 1, i);
  }
  return null;
}

/** Ein `{ ...X }` meint X; sonst der Ausdruck selbst. */
function kern(ausdruck) {
  const text = ausdruck.trim();
  const spreizung = text.match(/^\{\s*\.\.\.(.+?)\s*\}$/s);
  return (spreizung ? spreizung[1] : text).trim();
}

// Abgeleitet aus einer wachsenden Liste: `raum.einstellungen.map(...)` waechst
// mit ihr. In Runde 101 verglichen drei Tests die Einstellungen so auf
// Gleichheit, und der Waechter sah es nicht - er kannte nur Ausdruecke, die auf
// das Feld **enden** (Rueckschau nach Runde 103).
const ABGELEITET = new RegExp(`\\.(${FELDER})\\.(map|filter)\\(`);

/** Die Fundstellen in einer Quelle: [Zeilennummer, Ausdruck]. */
function gleichheitAufWachsendem(quelle) {
  const zeilen = quelle.split('\n');
  // `const { baut, ...rest } = werte.einheiten.dorfbewohner` macht aus
  // wachsenden Daten einen harmlos aussehenden Namen - und genau so ist
  // der Test in Runde 75 durchgerutscht. Solche Namen gelten hier als
  // wachsend wie ihre Quelle.
  const uebernommen = new Set();
  for (const [, name, quellAusdruck] of quelle.matchAll(/\{[^{}]*\.\.\.(\w+)\s*\}\s*=\s*([^;\n]+)/g)) {
    if (WAECHST.test(kern(quellAusdruck.replace(/[;,]\s*$/, '')))) uebernommen.add(name);
  }
  const treffer = [];
  const muster = /(?:assert\.deepEqual|deepStrictEqual|\.toEqual)\s*\(/g;
  let gefunden;
  while ((gefunden = muster.exec(quelle)) !== null) {
    const klammer = muster.lastIndex - 1;
    const argument = erstesArgument(quelle, klammer);
    if (argument === null) continue;
    if (!WAECHST.test(kern(argument)) && !uebernommen.has(kern(argument)) && !ABGELEITET.test(argument)) continue;
    const nummer = quelle.slice(0, klammer).split('\n').length;
    const umgebung = `${zeilen[nummer - 2] || ''}\n${zeilen[nummer - 1]}`;
    if (umgebung.includes('gleichheit-ok')) continue;
    treffer.push([nummer, kern(argument)]);
  }
  return treffer;
}

test('waechter: kein Test prueft wachsende Daten auf Gleichheit', () => {
  const treffer = [];
  for (const ordner of ORDNER) {
    for (const pfad of dateien(join(WURZEL, ordner))) {
      for (const [nummer, ausdruck] of gleichheitAufWachsendem(readFileSync(pfad, 'utf8'))) {
        treffer.push(`${ordner}/${pfad.slice(join(WURZEL, ordner).length + 1)}:${nummer}: ${ausdruck}`);
      }
    }
  }
  assert.deepEqual(treffer, [], `Gleichheit auf wachsenden Daten - "enthaelt" statt "ist gleich" pruefen,
oder "gleichheit-ok: <Grund>" an die Zeile schreiben:\n  ${treffer.join('\n  ')}\n`);
});

test('waechter: auch eine aus der Liste abgeleitete Liste waechst', () => {
  // Die Form aus Runde 101 - so standen die drei Tests da.
  // gleichheit-ok: Beispiel fuer den Waechter selbst.
  const vorher = "assert.deepEqual(raum.einstellungen.map((e) => [e.name, e.wert]), [['Spieler', 4]]);";
  assert.equal(gleichheitAufWachsendem(vorher).length, 1, 'die abgeleitete Liste wird gefunden');
  // gleichheit-ok: Beispiel fuer den Waechter selbst.
  assert.equal(gleichheitAufWachsendem("assert.deepEqual(g.bildetAus.filter((a) => a), ['miliz']);").length, 1, 'auch mit filter');
  // Gegenprobe: ein einzelner Eintrag waechst nicht, und ein Vergleich der
  // Laenge mit den Daten selbst ist richtig.
  assert.equal(gleichheitAufWachsendem("assert.deepEqual(raum.einstellungen.find((e) => e.schluessel === 'ki').wert, 2);").length, 0);
  assert.equal(gleichheitAufWachsendem('assert.equal(raum.einstellungen.length, liste.length);').length, 0);
});
