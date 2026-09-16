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
- **Umlaute in sichtbaren Texten?** `CLAUDE.md` verlangt Umschreibung im
  Quelltext, und bisher gilt das auch für Texte auf dem Bildschirm („Fuehrt
  einen Verein ueber …"). Das liest sich holprig. Vorschlag: echte Umlaute
  nur in Zeichenketten, die auf dem Bildschirm stehen; Bezeichner bleiben
  umschrieben. Bis zur Antwort
  bleibt es bei der Umschreibung.

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
- Einstellungen laufen: Steckbrief → `server/spiele/einstellungen.js` prüft →
  `raum.einstellungen`. Aber `raeume.js` erzeugt weiter fest eine
  Strategie-`Welt` und reicht nur den Startwert durch. Sobald die Welt selbst
  Einstellungen braucht (Kartengröße, Vorrat), gehört die Erzeugung ans Spiel
  (Schnittstelle aus [ADR-0006](../adr/0006-mehrere-spiele.md): `aufbau`,
  `takten`, `zustand`, `befehl`).
- Offen im Einstieg: auswahl AC-7 (Startwert nach dem Start sichtbar), AC-9
  (Einstellungen im Warteraum), AC-10 (Gastgeber ändert sie bis zum Start),
  AC-13 (Code kopieren).
- Bei Änderungen am Vorraum: `npm run qa:nachweis -- vorraum spielauswahl`,
  sonst zeigen die Bilder zu konten und raeume den alten Stand.

## Messwerte

Zahlen, gegen die spätere Runden vergleichen. Mit Datum und Commit.

| Datum | Was | Wert | Commit |
| --- | --- | --- | --- |
| 2026-09-16 | Tests ohne Browser / im Browser | 242 / 63 | Runde 1 |
| 2026-09-16 | Dauer Browserlauf gesamt | 46,6 s | Runde 1 |
| 2026-09-16 | Tests ohne Browser / im Browser; Browserlauf | 247 / 66; 51,9 s | Runde 2 |

## Rückschauen

Alle fünf Runden und am Ende jeder Stufe: Was hat Zeit gekostet, was hat sich
wiederholt, was ändert sich an der Anweisung oder am Werkzeug?

_(noch keine)_

## Runden

Neueste oben. Eine Zeile je Runde: Nummer, Datum, Kriterien, Ergebnis,
wichtigste Erkenntnis.

- **2** · 2026-09-16 · auswahl AC-4, 5, 8 fertig: Einstellungen als Liste im
  Steckbrief, Formular daraus, Prüfung auf dem Server. Gelernt: (1) Ein Import
  namens `einstellungen` wurde vom gleichnamigen Parameter in `starten()`
  überdeckt — „is not a function" erst zur Laufzeit. (2) Das Bild zu AC-8
  zeigte die Absage nicht, weil sie am Tafelende stand; beim Ansehen gefunden,
  jetzt steht sie am Formular und der Test prüft `toBeInViewport`. Bilder
  ansehen lohnt sich.
- **1** · 2026-09-16 · auswahl AC-1–3 fertig: Übersicht der Spiele aus
  Steckbriefen, Kennzeichen „im Bau"/gesperrt. Gelernt: `body` war
  `overflow: hidden` und zentriert — jede längere Tafel wäre auf 1366×768
  oben abgeschnitten worden; jetzt `place-items: safe center` mit Test.
- **0** · 2026-09-16 · Einrichtung: ADR-0012, Fahrplan, Vorlage, diese Datei,
  Anweisung. Noch nichts gebaut.
