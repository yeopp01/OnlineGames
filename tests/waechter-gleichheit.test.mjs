// WAECHTER: Gleichheit auf Daten, die mit den Stufen wachsen.
//
// Viermal in fuenf Runden ist ein gruener Test gebrochen, weil er einen ganzen
// Datensatz auf Gleichheit geprueft hat und der Datensatz ein Feld dazubekam:
// `EINHEITEN` in Runde 60 (zeitalter), `bildetAus` in Runde 61, `GEBAEUDE.farm`
// in Runde 63 (Ruestung), `auftrag` in Runde 64 (Platz und Heimat). Die Regel
// stand jedes Mal schon in der Anweisung - sie wurde nur nicht angewandt.
// Deshalb sucht sie jetzt ein Test statt eines Menschen.
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
const TABELLEN = 'EINHEITEN|GEBAEUDE|VERBESSERUNGEN|TIERE|ZEITALTER|AUFSTIEGE';
// Felder, die mit den Stufen mehr werden: ein Auftrag bekommt Angaben, ein
// Gebaeude bildet mehr aus, ein Dorfbewohner baut mehr.
const FELDER = 'auftrag|bildetAus|baut';
const WAECHST = new RegExp(`(^|[^.\\w])(${TABELLEN})(\\.\\w+)?$|\\.(${FELDER})$`);

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

test('waechter: kein Test prueft wachsende Daten auf Gleichheit', () => {
  const treffer = [];
  for (const ordner of ORDNER) {
    for (const pfad of dateien(join(WURZEL, ordner))) {
      const quelle = readFileSync(pfad, 'utf8');
      const zeilen = quelle.split('\n');
      const muster = /(?:assert\.deepEqual|deepStrictEqual|\.toEqual)\s*\(/g;
      let gefunden;
      while ((gefunden = muster.exec(quelle)) !== null) {
        const klammer = muster.lastIndex - 1;
        const argument = erstesArgument(quelle, klammer);
        if (argument === null || !WAECHST.test(kern(argument))) continue;
        const nummer = quelle.slice(0, klammer).split('\n').length;
        const umgebung = `${zeilen[nummer - 2] || ''}\n${zeilen[nummer - 1]}`;
        if (umgebung.includes('gleichheit-ok')) continue;
        treffer.push(`${ordner}/${pfad.slice(join(WURZEL, ordner).length + 1)}:${nummer}: ${kern(argument)}`);
      }
    }
  }
  assert.deepEqual(treffer, [], `Gleichheit auf wachsenden Daten - "enthaelt" statt "ist gleich" pruefen,
oder "gleichheit-ok: <Grund>" an die Zeile schreiben:\n  ${treffer.join('\n  ')}\n`);
});
