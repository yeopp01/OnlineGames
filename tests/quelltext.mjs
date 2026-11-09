// Quelltext lesen fuer die Waechter (tests/waechter-*.test.mjs), die Rumpfe
// von Methoden schneiden.
//
// Warum es das gibt: unter Windows checkt git mit CRLF aus. Ein Waechter,
// der nach '\n  }\n' sucht, fand dort das Ende einer Methode nie und las bis
// zum Dateiende - `waechter-merker` war so von Runde 135 bis 146 zu lasch,
// und in der CI (LF) waere es nicht aufgefallen (Rueckschau nach Runde 147).
import { readFileSync } from 'node:fs';

/** Eine Datei relativ zum Wurzelordner des Projekts, ohne Wagenruecklauf. */
export function quelltext(pfad) {
  return readFileSync(new URL(`../${pfad}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
}

/**
 * Der Rumpf einer Methode auf Einrueckung zwei (so stehen sie in den
 * Klassen von `server/spiele/strategie/`), vom Kopf bis zur schliessenden
 * Klammer. Null, wenn es die Methode nicht gibt.
 */
export function methodenRumpf(text, name) {
  const anfang = text.search(new RegExp(`\\n  ${name}\\(`));
  if (anfang < 0) return null;
  const ende = text.indexOf('\n  }\n', anfang);
  return text.slice(anfang, ende < 0 ? text.length : ende);
}
