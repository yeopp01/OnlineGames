#!/usr/bin/env node
// WAECHTER + ARBEITSVORRAT: der Status der Abnahmekriterien.
//
// Eine Spec wird nie "fertig" - die abarbeitbare Einheit ist das einzelne
// Kriterium. Jedes traegt seinen Status in der Spec selbst; dieses Skript
// fuehrt sie zu specs/BOARD.md zusammen und schreibt die Stand-Zeile jeder
// Spec. Mit --check wird nur geprueft, ob beides aktuell ist.
//
// Bricht ab (→ specs/README.md, docs/adr/0011-bildnachweise.md):
//   - ein Kriterium ohne Status, mit unbekanntem Status, ohne oder mit zu
//     langem Kurztitel, doppelter Nummer, "zurueckgestellt" ohne Grund,
//   - "fertig" ohne Bildnachweis und ohne begruendeten Eintrag in
//     qa/ohne-bild.json - niemand erklaert sich selbst fertig,
//   - ein Bildnachweis an einem Kriterium, das offen, geplant oder
//     zurueckgestellt ist: entweder hinkt der Status, oder das Bild ist alt,
//   - jede falsche Zuordnung eines Nachweises (dieselbe Pruefung wie im Bericht).
//
// Dass ein fertiges Kriterium auch einen Testnamen hat, prueft
// scripts/check-belege.mjs.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ANZEIGE, BOARDFOLGE, SPECS, UNGEBAUT, bestandLesen, standzeile, zaehlen,
} from './specs-lesen.mjs';

const BOARD = join(SPECS, 'BOARD.md');
const pruefen = process.argv.includes('--check');

const { specs, nachweise, ausnahmen, fehler } = await bestandLesen();

for (const spec of specs) {
  for (const k of spec.kriterien) {
    const schluessel = `${spec.pfad}#${k.id}`;
    const bild = nachweise.has(schluessel);
    if (k.status === 'fertig' && !bild && !ausnahmen.has(schluessel)) {
      fehler.push(
        `${spec.wo} ${k.id} (${k.titel}): fertig, aber ohne Nachweis. Es fehlt ein Bild unter `
        + 'qa/bildnachweise/ (nachweis() im Browsertest) oder ein begruendeter Eintrag in qa/ohne-bild.json.',
      );
    }
    if (UNGEBAUT.has(k.status) && bild) {
      fehler.push(
        `${spec.wo} ${k.id} (${k.titel}): Status "${k.status}", aber es liegt ein Bildnachweis vor. `
        + 'Entweder ist das Kriterium weiter, als der Status sagt, oder das Bild ist veraltet.',
      );
    }
  }
}

if (fehler.length) {
  console.error('Arbeitsvorrat: bitte zuerst beheben.\n');
  for (const f of fehler) console.error(`  ${f}`);
  console.error(`\n${fehler.length} Beanstandung(en).`);
  process.exit(1);
}

function tabelle() {
  const kopf = ['Spezifikation', ...BOARDFOLGE.map((s) => ANZEIGE[s])];
  const zeilen = specs.map((spec) => {
    const zahlen = zaehlen(spec.kriterien);
    return [`[${spec.titel}](${spec.pfad})`, ...BOARDFOLGE.map((s) => String(zahlen[s] || '-'))];
  });
  const breiten = kopf.map((_, i) => Math.max(kopf[i].length, ...zeilen.map((z) => z[i].length)));
  const zeile = (felder) => `| ${felder.map((f, i) => f.padEnd(breiten[i])).join(' | ')} |`;
  return [zeile(kopf), `| ${breiten.map((b) => '-'.repeat(b)).join(' | ')} |`, ...zeilen.map(zeile)].join('\n');
}

function boardText() {
  const alle = specs.flatMap((s) => s.kriterien);
  const mitBild = [...nachweise.keys()].length;
  const abschnitte = [];
  for (const status of BOARDFOLGE) {
    if (status === 'fertig') continue;
    const zeilen = [];
    for (const spec of specs) {
      for (const k of spec.kriterien) {
        if (k.status === status) zeilen.push(`- **${k.titel}** — [${spec.titel}](${spec.pfad}) ${k.id}`);
      }
    }
    if (zeilen.length) abschnitte.push(`## ${ANZEIGE[status]} (${zeilen.length})\n\n${zeilen.join('\n')}`);
  }

  return `<!-- Erzeugt von scripts/spec-board.mjs. Nicht von Hand aendern --
     der Status steht am Abnahmekriterium in der jeweiligen Spec. -->

# Arbeitsvorrat

Eine Zeile je Abnahmekriterium. Gepflegt wird der Status in der Spec selbst,
hier steht er zusammengefasst. Erzeugt mit \`npm run specs:board\`; als Seite
mit Bildnachweisen, Filter und Suche mit \`npm run qa:report\`.

**Gesamt:** ${standzeile(zaehlen(alle))}

**Nachweise:** ${mitBild} Kriterien mit Bild · ${ausnahmen.size} ohne Bild, begruendet in \`qa/ohne-bild.json\`

## Nach Spezifikation

${tabelle()}

${abschnitte.join('\n\n')}
`;
}

function standGesetzt(spec) {
  const neu = `**Stand:** ${standzeile(zaehlen(spec.kriterien))}`;
  return /^\*\*Stand:\*\* .*$/m.test(spec.inhalt) ? spec.inhalt.replace(/^\*\*Stand:\*\* .*$/m, neu) : spec.inhalt;
}

const board = boardText();
const veraltet = [];

if ((await readFile(BOARD, 'utf8').catch(() => '')) !== board) {
  if (pruefen) veraltet.push('specs/BOARD.md');
  else await writeFile(BOARD, board);
}
for (const spec of specs) {
  const neu = standGesetzt(spec);
  if (neu === spec.inhalt) continue;
  if (pruefen) veraltet.push(spec.wo);
  else await writeFile(spec.datei, neu);
}

if (pruefen && veraltet.length) {
  console.error('Veraltet, bitte `npm run specs:board` laufen lassen:');
  for (const datei of veraltet) console.error(`  ${datei}`);
  process.exit(1);
}

const gesamt = standzeile(zaehlen(specs.flatMap((s) => s.kriterien)));
console.log(pruefen ? `Board aktuell: ${gesamt}` : `Board geschrieben: ${gesamt}`);
