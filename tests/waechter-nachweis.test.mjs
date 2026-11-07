// Waechter: Bildunterschriften stehen woertlich im Browsertest
// (→ docs/adr/0011-bildnachweise.md).
//
// Warum es diesen Waechter gibt: `npm run check` sucht die Unterschrift eines
// Bildnachweises **woertlich** in der Datei, die ihn erzeugt hat - so ist
// sicher, dass jedes eingecheckte Bild noch einen Erzeuger hat. Wer den Titel
// aus Zahlen zusammensetzt (`titel: \`... ${n} Farmen ...\``), bricht diese
// Verbindung: das Bild entsteht, der Nachweis wird abgelegt, und erst der
// Lauf danach beanstandet ihn - nach dem ganzen Browserlauf. In Runde 69 hat
// das einen Durchgang von 45 Sekunden gekostet, bevor es auffiel. Dieser
// Waechter findet es in Millisekunden, ohne Browser.
//
// Zahlen gehoeren trotzdem in die Unterschrift - aber als gesicherte Zahl im
// Text, nicht als Platzhalter. Wo sie je nach Zeitpunkt schwankt, nennt die
// Unterschrift sie gar nicht.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ORDNER = fileURLToPath(new URL('../e2e/tests/', import.meta.url));

test('waechter: keine Bildunterschrift wird aus Werten zusammengesetzt', () => {
  const treffer = [];
  for (const datei of readdirSync(ORDNER).filter((d) => d.endsWith('.spec.mjs'))) {
    const zeilen = readFileSync(ORDNER + datei, 'utf8').split('\n');
    zeilen.forEach((zeile, i) => {
      // Die Zeile `titel: ...` eines nachweis()-Aufrufs, mit `${` darin.
      if (/^\s*titel:/.test(zeile) && zeile.includes('${')) treffer.push(`${datei}:${i + 1}: ${zeile.trim()}`);
    });
  }

  assert.deepEqual(treffer, [], [
    'Diese Bildunterschriften werden erst beim Lauf zusammengesetzt. `npm run check`',
    'sucht sie woertlich im Test und findet sie dann nicht - der Nachweis gilt als',
    'ohne Erzeuger. Die Unterschrift als festen Text schreiben; was sich aendert,',
    'vorher mit expect() sichern und im Text nicht beziffern.',
    '', ...treffer,
  ].join('\n'));
});
