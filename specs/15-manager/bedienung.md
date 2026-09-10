# Bedienung des Managerspiels

**Bereich:** Manager
**Kuerzel:** oberflaeche
**Stand:** 14/14 fertig

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
| Kader       | alle Spieler mit Werten, Statistik, Vertrag; verlängern, abgeben   |
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
  sitzt, ersetzt mit einem Klick den schwächsten seiner Position; wer in der
  Elf steht, weicht dem stärksten von der Bank.
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
- **AC-16** `fertig` **Die Saisonbilanz** — Nach dem Saisonende zeigt das Büro
  Meister, Pokalsieger, Auf- und Absteiger, den eigenen Platz gegen das Ziel
  und die Abschlusstabelle.
