#!/usr/bin/env node
// Schreibt specs/BOARD.md und die Stand-Zeile in jeder Spec. Mit --check wird
// nur geprueft, ob beides aktuell ist - dann bricht ein veralteter Stand.
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { lesen, zaehlen, standzeile, STATUS, ANZEIGE, SPECS } from './specs-lesen.mjs';

const BOARD = join(SPECS, 'BOARD.md');

function tabelle(specs) {
  const kopf = ['Spezifikation', ...STATUS.map((s) => ANZEIGE[s])];
  const zeilen = specs.map((spec) => {
    const zahlen = zaehlen(spec.kriterien);
    return [`[${spec.titel}](${spec.ziel})`, ...STATUS.map((s) => (zahlen[s] || '-').toString())];
  });
  const breiten = kopf.map((_, i) => Math.max(kopf[i].length, ...zeilen.map((z) => z[i].length)));
  const zeile = (felder) => `| ${felder.map((f, i) => f.padEnd(breiten[i])).join(' | ')} |`;
  return [
    zeile(kopf),
    `| ${breiten.map((b) => '-'.repeat(b)).join(' | ')} |`,
    ...zeilen.map(zeile),
  ].join('\n');
}

function boardText(specs) {
  const gesamt = zaehlen(specs.flatMap((s) => s.kriterien));
  const abschnitte = [];

  for (const status of STATUS) {
    if (status === 'fertig') continue;
    const zeilen = [];
    for (const spec of specs) {
      for (const k of spec.kriterien) {
        if (k.status !== status) continue;
        zeilen.push(`- **${k.kurz}** — [${spec.titel}](${spec.ziel}) ${k.nummer}`);
      }
    }
    if (zeilen.length) {
      abschnitte.push(`## ${ANZEIGE[status]} (${zeilen.length})\n\n${zeilen.join('\n')}`);
    }
  }

  return `<!-- Erzeugt von scripts/spec-board.mjs. Nicht von Hand aendern --
     der Status steht am Abnahmekriterium in der jeweiligen Spec. -->

# Arbeitsvorrat

Eine Zeile je Abnahmekriterium. Gepflegt wird der Status in der Spec selbst,
hier steht er zusammengefasst. Erzeugt mit \`npm run specs:board\`, als Seite
zum Filtern und Suchen mit \`npm run qa:report\`.

**Gesamt:** ${standzeile(gesamt)}

## Nach Spezifikation

${tabelle(specs)}

${abschnitte.join('\n\n')}
`;
}

function standGesetzt(spec) {
  const neu = `**Stand:** ${standzeile(zaehlen(spec.kriterien))}`;
  return /^\*\*Stand:\*\* .*$/m.test(spec.inhalt)
    ? spec.inhalt.replace(/^\*\*Stand:\*\* .*$/m, neu)
    : spec.inhalt;
}

const pruefen = process.argv.includes('--check');
const specs = await lesen();

const fehler = specs.flatMap((s) => s.fehler);
if (fehler.length) {
  for (const f of fehler) console.error(`Fehler: ${f}`);
  process.exit(1);
}

const board = boardText(specs);
const veraltet = [];

if ((await readFile(BOARD, 'utf8').catch(() => '')) !== board) {
  if (pruefen) veraltet.push('specs/BOARD.md');
  else await writeFile(BOARD, board);
}

for (const spec of specs) {
  const neu = standGesetzt(spec);
  if (neu === spec.inhalt) continue;
  if (pruefen) veraltet.push(spec.wo);
  else await writeFile(spec.pfad, neu);
}

if (pruefen && veraltet.length) {
  console.error('Veraltet, bitte `npm run specs:board` laufen lassen:');
  for (const datei of veraltet) console.error(`  ${datei}`);
  process.exit(1);
}

const gesamt = standzeile(zaehlen(specs.flatMap((s) => s.kriterien)));
console.log(pruefen ? `Board aktuell: ${gesamt}` : `Board geschrieben: ${gesamt}`);
