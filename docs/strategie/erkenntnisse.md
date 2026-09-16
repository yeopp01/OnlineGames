# Erkenntnisse aus der Arbeit am Strategiespiel

Das Gedächtnis der Arbeitsschleife
([`strategie-weiterbauen`](../../.claude/skills/strategie-weiterbauen/SKILL.md)).
Jede Runde liest zuerst **Fragen** und **Offene Fäden** und schreibt am Ende
eine Zeile unter **Runden**. Was sich als dauerhaft richtig erweist, wandert in
eine Spec, ein ADR oder die Anweisung selbst und wird hier gestrichen.

Kurz halten. Diese Datei wird in jeder Runde gelesen.

## Fragen an den Benutzer

Entscheidungen, die nicht die Schleife trifft. Solange eine offen ist, wird an
etwas anderem gearbeitet.

- **Name des Spiels.** „Age of Empires" ist eine Marke und darf nicht
  erscheinen ([ADR-0012](../adr/0012-aoe2-als-vorlage.md)). Bis ein Name
  feststeht, heißt es in der Oberfläche „Strategie".

## Offene Fäden

- Das Spielbild ist von keinem Browser gesehen. Auswahlrahmen, Rechtsklick,
  Zoom stehen auf `in-qa` (bedienung AC-1, 2, 7, 8, 12, 16) → fahrplan AC-2.
- Die Karte ist 64×64 mit Feldarten Gras, Wald, Beeren, Wasser. Das Original
  rechnet mit 120×120 bis 220×220 und Einzelobjekten (Baum, Goldfeld, Schaf).
  Umbau zu Beginn von Stufe A; `wege.js` muss dann größere Karten
  bezahlbar halten (einheiten AC-8: unter 1 ms quer über die Karte).
- Der Server schickt heute jedem den Vollzustand. Das trägt nicht bis 8×200
  Einheiten (fahrplan AC-20) und nicht für den Nebel (AC-13). Nicht vorziehen,
  aber keine Entscheidung treffen, die gebündelte Änderungen verbaut.
- `raeume.js` startet heute fest das Strategiespiel. Die Spielauswahl
  (fahrplan AC-1) braucht die Schnittstelle aus
  [ADR-0006](../adr/0006-mehrere-spiele.md) — jetzt gibt es zwei Spiele, also
  ist sie fällig.

## Messwerte

Zahlen, gegen die spätere Runden vergleichen. Mit Datum und Commit.

| Datum | Was | Wert | Commit |
| --- | --- | --- | --- |
| – | – | – | – |

## Rückschauen

Alle fünf Runden und am Ende jeder Stufe: Was hat Zeit gekostet, was hat sich
wiederholt, was ändert sich an der Anweisung oder am Werkzeug?

_(noch keine)_

## Runden

Neueste oben. Eine Zeile je Runde: Nummer, Datum, Kriterien, Ergebnis,
wichtigste Erkenntnis.

- **0** · 2026-09-16 · Einrichtung: ADR-0012, Fahrplan, Vorlage, diese Datei,
  Anweisung. Noch nichts gebaut.
