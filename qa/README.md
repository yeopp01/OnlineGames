# QA

Die Seite [`report/index.html`](report/index.html) zeigt dieselben Daten wie
[`../specs/BOARD.md`](../specs/BOARD.md), nur zum Filtern, Suchen und
Herzeigen. Sie wird erzeugt, nicht gepflegt, und liegt deshalb nicht im
Git-Verlauf:

```bash
npm run qa:report
```

Dann `qa/report/index.html` im Browser oeffnen - die Datei bringt alles mit
und laedt nichts nach, ein Doppelklick genuegt.

## Was die Seite kann

- Fortschritt als Balken, gesamt und je Spezifikation
- Filter nach Status, Bereich und Volltext
- **belegt** / **ohne Beleg** an jedem fertigen Kriterium: ob ein Test es mit
  seiner Nummer nennt

Der Punkt ist der letzte: eine Zahl im Board ist nur so viel wert wie ihr
Beleg. `npm run specs:belege` bricht den Lauf, wenn ein Kriterium auf
`fertig` steht, das kein Test nennt - die Seite macht dasselbe sichtbar.
