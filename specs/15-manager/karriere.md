# Karriere: Saison um Saison

**Bereich:** Manager
**Kuerzel:** karriere
**Stand:** 25/26 fertig · 1 offen

## Zweck

Der Ablauf in der Hand eines Menschen: anmelden, Verein wählen, Termin für
Termin, Saison um Saison. Und zwar schnell — der Grund, warum jemand das
heute spielt und nicht das Vorbild von damals, ist die Geschwindigkeit.

## Abgrenzung

| Gehört dazu                                        | Gehört nicht dazu                             |
| -------------------------------------------------- | --------------------------------------------- |
| Spielstand, Züge, Ablauf, Vorspulen, Postfach      | Die Rechnung selbst → [Spieltag](spieltag.md) |
| Spielstände am Konto in SQLite                     | Mehrere Menschen in einer Welt (noch offen)   |

## Der Ablauf

```
anmelden → Verein wählen → [ aufstellen · Taktik · Transfer · Verträge · Kasse ]
                                  ↑                                   │
                                  └──── weiter: ein Termin ───────────┘
                                                42 Termine je Saison, ohne Ende
```

## Abnahmekriterien

### Anfangen

- **AC-1** `fertig` **Der Mensch wählt seinen Verein** — Vor dem Anlegen
  stehen beide Ligen zur Wahl, mit Kaderstärke, erwartetem Rang, Konto,
  Stadion und Kaderwert.
- **AC-2** `fertig` **Gleicher Startwert, gleiche Welt** — Zwei Karrieren mit
  demselben Startwert beginnen mit denselben Vereinen, Spielplänen und
  Pokalpaarungen.
- **AC-3** `fertig` **Server spielt die übrigen Vereine** — Sie stellen ihre
  beste Elf im besten System und behalten ihre Taktik.

### Termin für Termin

- **AC-4** `fertig` **Ein Zug, ein Termin** — „Weiter" rechnet genau einen
  Termin: einen Spieltag beider Ligen, eine Pokalrunde, die Vorbereitung, die
  Winterpause oder das Saisonende.
- **AC-5** `fertig` **Der Bericht zeigt den Termin** — Das eigene Spiel mit
  Ticker, Aufstellungen, Noten, Chancen, Besitz und Zuschauern; dazu alle
  Ergebnisse beider Ligen oder der Pokalrunde.
- **AC-6** `fertig` **Vorspulen mit Halt** — Bis zur Winterpause oder bis vor
  das Saisonende am Stück. Gehalten wird vor diesen Terminen und sobald der
  Manager entlassen ist.
- **AC-7** `fertig` **Saison in unter einer Sekunde** — 42 Termine, 643
  Pflichtspiele in zwei Ligen und dem Pokal. _(Gemessen allein auf dem Rechner
  der Entwicklung: 380 bis 430 ms je Saison, ohne Zuwachs über die Saisons.)_
- **AC-9** `fertig` **Was passiert, steht im Postfach** — Ergebnisse, Sperren,
  Verletzungen, Angebote, Verträge, Jugend, Vorstand: jede Veränderung am
  eigenen Verein erzeugt eine Nachricht.
- **AC-27** `fertig` **Vorschau auf den Gegner** — Vor jedem eigenen Spiel
  stehen beide Vereine nebeneinander: Platz, Punkte, die letzten fünf
  Ligaspiele, Kaderstärke, System, Ausfälle, die bisherigen Begegnungen der
  Saison und Tor, Abwehr, Mittelfeld und Angriff der Elf, die heute spielen
  würde — gerechnet wie im Spiel, mit Tagesform und Eingeübtem, ohne
  Heimvorteil und Taktikregler. Die Einschätzung (Favorit, offen,
  Außenseiter) folgt der Regel, nach der sich auch die anderen Vereine auf
  ihren Gegner einstellen. Die Vorschau liest nur.
- **AC-21** `fertig` **Die Saison geht weiter** — Nach dem Saisonende beginnt
  die nächste mit neuem Spielplan, neuer Auslosung, neuen Sponsorangeboten und
  neuem Ziel. Weiter geht es immer.

### Spielstand

- **AC-10** `fertig` **Zustand ist ein Datenwert** — `sichern()` gibt ihn
  heraus, `laden()` stellt ihn wieder her, und beides ergibt dieselbe
  Fortsetzung (→ [ADR-0007](../../docs/adr/0007-zwei-arten-von-partien.md)).
- **AC-11** `fertig` **Zufall hängt am Startwert** — Jeder Termin zieht seine
  Quellen aus Startwert, Saison, Termin und Zweck. Deshalb ist ein geladener
  Spielstand nicht von dem zu unterscheiden, der nie gespeichert wurde, und
  vorgespult ist dasselbe wie einzeln gerechnet.
- **AC-12** `fertig` **Ein Spielstand bleibt klein** — Unter 1 MB, auch nach
  zehn Saisons: ältere Spieltage behalten nur ihr Ergebnis, die Chronik nur die
  letzten zehn Tabellen. _(Gemessen: 320 KB nach einer Saison, 410 KB nach
  zehn.)_
- **AC-14** `fertig` **Ein Spielstand überlebt den Neustart** — Er liegt in
  SQLite am Konto und wird nach jedem Zug geschrieben, der etwas ändert.
- **AC-15** `fertig` **Ein Konto sieht seine Spielstände** — Liste mit Verein,
  Liga, Saison und Termin; fortsetzen, löschen.
- **AC-22** `fertig` **Arbeitsspeicher bleibt frei** — Im Speicher liegen
  höchstens 40 Karrieren; wer eine halbe Stunde nichts tut, wird verdrängt und
  beim nächsten Zug aus der Datenbank gelesen.
- **AC-25** `fertig` **Fünf Spielstände je Konto** — Der sechste wird mit einem
  Satz abgewiesen.
- **AC-26** `fertig` **Fremde Fassung wird abgelehnt** — Ein Spielstand aus
  einer anderen Fassung des Spiels wird nicht halb geladen, sondern mit einem
  Satz abgewiesen; die anderen Spielstände des Kontos bleiben ladbar.
- **AC-28** `fertig` **Alte Spielstände werden angehoben** — Ein Spielstand
  der Fassung 2, noch ohne Positionen, lädt weiter: jeder Spieler bekommt eine
  Stammposition, so wie ein Neuer im Verein, die Stärksten zuerst; die
  gemerkte Aufstellung fällt weg. Beim nächsten Schreiben ist er einer der
  Fassung 3.

### Der Anfrageweg

- **AC-18** `fertig` **Jeder Zug über den Server** — Anlegen, weiter,
  vorspulen, aufstellen, Taktik, Training, Kasse, kaufen, verkaufen,
  verlängern: alles über `/api/manager/spielstaende/...`, alles mit dem ganzen
  Zustand als Antwort. Der Browser hält nichts nach, was der Server nicht
  bestätigt hat.
- **AC-19** `fertig` **Züge werden gebremst** — Wer schneller zieht, als eine
  Bedienung es kann, wird abgewiesen, und zwar vor der Anmeldung
  (→ [ADR-0005](../../docs/adr/0005-grenzen-statt-vertrauen.md)).
- **AC-20** `fertig` **Unbekannter Spielstand sauber abgewiesen** — 404 mit
  einem Satz, kein Absturz.
- **AC-23** `fertig` **Nur mit Anmeldung** — Ohne Sitzung antwortet jede
  Anfrage mit 401 und dem Satz, dass eine Anmeldung nötig ist. Eine Karriere
  belegt Rechenzeit und gehört jemandem.
- **AC-24** `fertig` **Fremde Spielstände sind unsichtbar** — Wer die Kennung
  eines fremden Spielstands kennt, bekommt dieselbe Antwort wie für einen, den
  es nicht gibt.

### Später

- **AC-16** `offen` **Mehrere Menschen in einer Welt** — Der Termin wartet,
  bis alle bereit sind oder die Frist abläuft
  (→ [Spielziel](spielziel.md) AC-1, AC-2).
- **AC-17** `fertig` **Mehrere Saisons** — Auf- und Abstieg, alternde Kader,
  Jugend (→ AC-21, [Liga](liga.md) AC-11, [Kader](kader.md) AC-13 bis AC-17).
