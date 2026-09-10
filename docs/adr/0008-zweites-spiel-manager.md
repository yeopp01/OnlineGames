# ADR-0008: Das zweite Spiel ist ein Fussballmanager

**Status:** entschieden
**Datum:** 2026-09-02
**Baut auf:** [ADR-0006](0006-mehrere-spiele.md), [ADR-0007](0007-zwei-arten-von-partien.md) —
dort war als zweites Spiel ein Aufbauspiel im Geist der Sims angenommen.

## Frage

Welches Spiel kommt als zweites? Angenommen war Hausbau. Gewuenscht ist nun
ein Fussballmanager im Geist von Anstoss 3, ohne dessen Videosequenzen.

## Entscheidung

**Der Manager kommt vor dem Hausbau.**

## Begruendung

Er ist billiger und beantwortet mehr Fragen:

| | Manager | Strategiespiel |
| --- | --- | --- |
| Rechenlast | ein Spieltag je Runde | zehn Takte je Sekunde |
| Darstellung | Tabellen und Formulare | Leinwand, Kamera, Auswahl |
| Uebertragung | ein Ergebnis je Runde | ein Zustand je Takt |
| Ungeprueftes | wenig | genau das Teure: die Darstellung |

Der teure, bis heute unbelegte Teil des Strategiespiels ist die Darstellung.
Dem Manager fehlt sie ganz. Er ist deshalb das Spiel, das als erstes
**fertig spielbar** sein kann — und ein fertiges Spiel beantwortet die einzige
Frage, die zaehlt: traegt die Grundschleife?

Er ist ausserdem das bessere zweite Beispiel fuer die Schnittstelle aus
ADR-0007. Ein Hausbau haette sie kaum belastet: eine Welt, ein Mensch,
langsamer Takt. Der Manager bringt etwas Neues mit, das keines der beiden
bisherigen Spiele hat — **mehrere Menschen, die nacheinander entscheiden und
nicht gleichzeitig anwesend sind.** Ein Spieltag wird gerechnet, wenn alle
ihre Aufstellung abgegeben haben, nicht wenn die Uhr weitertickt.

Der Hausbau faellt damit nicht weg, er wartet.

## Folgen

- **Der Manager ist ein fortlaufendes Spiel** nach ADR-0007: eine Saison sind
  34 Spieltage, also Wochen. Der Spielstand
  ([Speichern](../../specs/00-plattform/speichern.md)) ist damit Voraussetzung
  und nicht Kuer — beim Strategiespiel liesse er sich aufschieben.
- **`server/spiele/<art>/` kommt jetzt**, wie in ADR-0007 angekuendigt:
  `strategie/` und `manager/` liegen nebeneinander, die Plattform darunter.
- **Die Schnittstelle bleibt noch offen.** Gebaut ist bisher nur der
  Rechenkern (Kader, Begegnung, Liga) — reine Rechnung ohne Naht. `aufbau()`,
  `takten()`, `zustand()`, `befehl()`, `sichern()`, `laden()` entstehen erst,
  wenn der Manager wirklich in einem Raum laeuft. Dann ist sie aus zwei
  **laufenden** Spielen abgeleitet statt aus zwei geplanten.
- **Der Takt wird zum Zug.** `takten()` heisst beim Manager nicht "zehnmal je
  Sekunde", sondern "wenn alle abgegeben haben oder die Frist ablaeuft". Das
  ist die Stelle, an der die Schnittstelle sich bewaehren muss.
- **Alle Namen sind erfunden.** Echte Vereine und Spieler sind
  lizenzpflichtig; erfundene kosten nichts und sind ehrlicher.
- **Keine Videosequenzen, kein Livespiel.** Was ausdruecklich nicht gebaut
  wird, steht in [specs/15-manager/spielziel.md](../../specs/15-manager/spielziel.md).
