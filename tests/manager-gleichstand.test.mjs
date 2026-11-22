// Die Gleichstandsprobe (→ docs/manager/plan.md, M0.2): Umbauten, die nichts
// am Spiel aendern sollen (M0.3 bis M0.7), aendern auch nichts. Je Startwert
// zwei Laeufe, je Lauf zwei Fingerabdruecke - die Welt und der Mensch.
//
// Reisst die Probe, war es entweder ein Fehler, oder die Aenderung soll das
// Spiel aendern. Dann, und nur dann: `npm run manager:gleichstand -- --neu`,
// und im Commit steht, warum.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gleichstandRechnen, teile } from '../scripts/manager-messung.mjs';

const GESPEICHERT = JSON.parse(readFileSync(new URL('./manager-gleichstand.json', import.meta.url), 'utf8'));

test('manager AC-17: Welt und Mensch rechnen nach einem Umbau Zug fuer Zug dasselbe', () => {
  assert.deepEqual(gleichstandRechnen(), GESPEICHERT.abdruecke, [
    'Die Gleichstandsprobe reisst: derselbe Startwert ergibt einen anderen Spielstand.',
    'Soll die Aenderung das Spiel aendern, neu schreiben mit: npm run manager:gleichstand -- --neu',
  ].join('\n'));
});

test('manager AC-17: die Teilung in Welt und Mensch liest beide Fassungen', () => {
  const alt = { fassung: 3, saison: 1, vereine: [1], vereinId: 'v5', kasse: { a: 1 } };
  const neu = { fassung: 4, saison: 1, vereine: [1], manager: [{ managerId: 'm1', vereinId: 'v5', kasse: { a: 1 } }] };
  assert.deepEqual(teile(alt), teile(neu));
  assert.deepEqual(teile(alt).welt, { saison: 1, vereine: [1] });
});
