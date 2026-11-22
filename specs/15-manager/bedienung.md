# Bedienung des Managerspiels

**Bereich:** Manager
**Kuerzel:** oberflaeche
**Stand:** 16/20 fertig · 4 offen

## Zweck

42 Termine je Saison sind 42 Durchläufe derselben Handgriffe. Was dabei einen
Klick zu viel kostet, kostet ihn 42-mal — und in der zehnten Saison
vierhundertmal.

Alles hier wird in einem echten Browser geprüft: geladen, geklickt,
gescrollt, gemessen (→ [ADR-0010](../../docs/adr/0010-playwright.md)).

## Abgrenzung

| Gehört dazu                          | Gehört nicht dazu                                      |
| ------------------------------------ | ------------------------------------------------------ |
| Wege, Klicks, Darstellung            | Regeln → die übrigen Specs dieses Bereichs             |
| Geschwindigkeit der Bedienung        | Rechengeschwindigkeit → [Karriere](karriere.md) AC-7   |

## Die Blätter

| Blatt       | Inhalt                                                             |
| ----------- | ------------------------------------------------------------------ |
| Büro        | nächster Termin, Vorstand, Postfach, Kalender der Saison, Chronik  |
| Mannschaft  | Spielfeld, Bank, System, Regler, Wechselregel, Training            |
| Kader       | Stärke gegen den nächsten Gegner; alle Spieler mit Werten, Statistik, Vertrag; verlängern, abgeben |
| Spieltag    | Vorschau auf den Gegner; der letzte Termin: Ticker, Noten, alle Ergebnisse |
| Liga        | beide Tabellen, Torjäger, Spielplan des eigenen Vereins            |
| Pokal       | alle Runden                                                        |
| Transfer    | Markt mit Filtern, Angebote, Ticker                                |
| Finanzen    | Posten der Saison, Sponsor, Eintritt, Stadion, Buch                |

## Abnahmekriterien

- **AC-1** `fertig` **Ein Knopf, ein Termin** — „Weiter" steht in der
  Kopfzeile, nennt den nächsten Termin und ist von jedem Blatt aus erreichbar.
  Die Leertaste tut dasselbe.
- **AC-2** `fertig` **Ein Klick tauscht einen Spieler** — Wer auf der Bank
  sitzt, kommt mit einem Klick auf den Platz, auf dem er gegenüber dem, der
  dort steht, am meisten bringt; wer in der Elf steht, weicht dem Besten von
  der Bank für seinen Platz. Ziehen geht auch (→ [Aufstellung](aufstellung.md)
  AC-25).
- **AC-3** `fertig` **Aufstellung als Spielfeld** — Vier Reihen, jeder Spieler
  mit Stärke und Kondition. Wer müde ist, fällt ins Auge.
- **AC-4** `fertig` **Ticker läuft, Ergebnis steht** — Tore, Karten und Wechsel
  erscheinen nacheinander, aber die Rechnung ist längst fertig. Das Tempo ist
  einstellbar, „sofort" eingeschlossen.
- **AC-6** `fertig` **Beträge lesbar als Zahl** — Über tausend wird aus 12400
  „12,4 Mio".
- **AC-7** `fertig` **Absagen stehen als Satz** — Was der Server ablehnt,
  erscheint im Klartext, nicht als Fehlercode.
- **AC-9** `fertig` **Einmal im Browser gesehen** — Ein voller Durchlauf:
  anmelden, anlegen, aufstellen, kaufen, eine ganze Saison bis in die nächste,
  ohne dass die Seite eine Ausnahme wirft.
- **AC-10** `fertig` **Lange Listen scrollen** — Markt, Kader und Tabellen sind
  länger als ein Bildschirm. Die Seite scrollt als Ganzes; breite Tabellen
  scrollen seitlich für sich, statt die Seite zu zerren.
- **AC-11** `fertig` **Acht Blätter** — Büro, Mannschaft, Kader, Spieltag,
  Liga, Pokal, Transfer, Finanzen.
- **AC-12** `fertig` **Spielstände zur Wahl** — Wer angemeldet ist, sieht seine
  Spielstände und setzt mit einem Klick fort — auch nach dem Neuladen, auch in
  einem anderen Browser.
- **AC-13** `fertig` **Ohne Konto die Anmeldung** — Wer nicht angemeldet ist,
  sieht eine Anmeldemaske statt einer Fehlermeldung.
- **AC-14** `fertig` **Der Kalender der Saison** — Das Büro zeigt alle Termine
  der Saison mit Gegner, Heim oder auswärts und Ergebnis; der nächste ist
  hervorgehoben.
- **AC-15** `fertig` **Andere Vereine ansehen** — Ein Klick auf einen Verein in
  der Tabelle zeigt seinen Kader mit Werten und Forderungen.
- **AC-17** `fertig` **Stärke auf einen Blick** — Oben im Kaderblatt steht
  die eigene Stärke in einer Zeile: der Kader (Schnitt der fünfzehn Besten)
  mit seinem Platz in der Liga, dazu Tor, Abwehr, Mittelfeld und Angriff der
  Elf, die heute spielen würde. Steht ein eigenes Spiel an, folgt der nächste
  Gegner mit denselben Werten, der Vorteil je Spalte und die Einschätzung —
  dieselben Zahlen wie in der Vorschau (→ [Karriere](karriere.md) AC-27).
- **AC-16** `fertig` **Die Saisonbilanz** — Nach dem Saisonende zeigt das Büro
  Meister, Pokalsieger, Auf- und Absteiger, den eigenen Platz gegen das Ziel
  und die Abschlusstabelle.
- **AC-18** `fertig` **Hell und lesbar** — Das Managerspiel trägt das Kleid
  des [Spieltag-Entwurfs](../../docs/manager/entwurf/spieltag.html): Kreide
  als Grund, Tinte als Schrift, der Kopf als Platte in der Farbe des eigenen
  Vereins, Überschriften und große Zahlen in einer schmalen Schrift.
  Kräftig sind nur Verein und Rasen. Hell heißt nicht blass: auf der Seite
  der Spielstände und auf allen acht Blättern hält jeder sichtbare Text
  gegen seinen Grund mindestens 4,5 : 1, große Schrift 3 : 1 (WCAG AA);
  ausgenommen ist nur, was gesperrt ist.

### Das Spiel im Bild (Stufe M1)

Vorbild ist der [Spieltag-Entwurf](../../docs/manager/entwurf/spieltag.html).
Der Browser zeigt, was der Server schickt — er rechnet keine Szene und
schreibt keinen Satz (→ [Spieltag](spieltag.md) AC-29).

- **AC-19** `offen` **Das Spiel läuft im Bild** — Ein live gespieltes Spiel
  zeigt eine Anzeigetafel mit beiden Vereinen, Stand und Uhr, darunter den
  Ticker Szene für Szene und ein Verlaufsband über 90 Minuten, in dem jedes
  Tor mit Minute und Schütze lesbar steht. Das Tempo lässt sich wählen:
  Normal, Schnell, Sofort und Pause. „Sofort" rechnet bis zum Abpfiff wie
  heute.
- **AC-20** `offen` **Wechseln im laufenden Spiel** — Während das Spiel läuft
  oder steht, lassen sich Spieler wechseln und Ausrichtung, Härte und
  Pressing verstellen. Was geändert ist, steht mit „wirkt ab Minute …" da;
  was der Server abweist (der vierte Wechsel, ein Gesperrter), steht als
  Grund im Bild.
- **AC-21** `offen` **Die Halbzeit hält an** — Zur Pause hält das Spiel von
  selbst an und zeigt die Kabine: Statistik der ersten Hälfte, drei
  Ansprachen und die Wechsel. Auf 1366 × 768 steht die Kabine ganz im Bild,
  ohne zu rollen. Die Zeile „Halbzeit" im Ticker ist leiser als ein Tor.
- **AC-22** `offen` **Der Verein färbt die Seite** — Jeder Verein hat zwei
  Farben; die eigene trägt der Kopf, auf der Anzeigetafel und im Verlaufsband
  stehen beide Vereine in ihren. Für jeden Verein der Welt gemessen: Schrift
  auf Vereinsfarbe hält 4,5 : 1, und zwei Vereine einer Begegnung sind im
  Band voneinander zu unterscheiden.
