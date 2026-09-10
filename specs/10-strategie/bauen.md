# Bauen und Ausbilden

**Bereich:** Strategie
**Kuerzel:** bauen
**Stand:** 0/19 fertig · 19 offen

## Zweck

Aus Rohstoffen wird Wirtschaft und Heer. Das ist die Schleife, in der die
eigentliche Entscheidung eines Strategiespiels steckt: **noch ein Sammler
oder schon ein Soldat?**

## Abgrenzung

| Gehoert dazu                     | Gehoert nicht dazu                          |
| -------------------------------- | ------------------------------------------- |
| Gebäude, Kosten, Bauzeiten       | Sammeln → [Einheiten](einheiten-und-befehle.md) |
| Bevölkerungsgrenze               | Kampfwerte → [Kampf](kampf.md)              |
| Ausbilden von Einheiten          | Siegbedingung → [Spielziel](spielziel.md)   |

## Die drei Gebäude

| Gebäude      | Kosten            | Bauzeit | Leistet                              |
| ------------ | ----------------- | ------- | ------------------------------------ |
| **Zentrum**  | zu Beginn vorhanden | –     | Abgabestelle, bildet Sammler aus, +5 Bevölkerung |
| **Haus**     | 30 Holz           | 15 s    | +5 Bevölkerung                       |
| **Kaserne**  | 80 Holz           | 30 s    | bildet Speer, Bogen und Reiter aus   |

Drei Gebäude, weil jedes eine eigene Entscheidung trägt: Haus heißt wachsen,
Kaserne heißt kämpfen, ein zweites Zentrum heißt ausbreiten. Ein viertes
Gebäude müsste eine vierte Entscheidung tragen — sonst ist es nur Arbeit.

## Abnahmekriterien

### Bauen

- **AC-1** `offen` **Sammler bauen Gebäude** — Ein Gebäude wird von einem Sammler errichtet. Er ist
  während der Bauzeit gebunden und sammelt nicht.
- **AC-2** `offen` **Mehrere Sammler bauen schneller** — Zwei Sammler halbieren die Bauzeit, drei
  dritteln sie. Ab vier bringt es nichts mehr — sonst gewinnt, wer alles auf
  einen Punkt schiebt.
- **AC-3** `offen` **Bauplatz muss frei sein** — Ein Gebäude braucht ein freies Rechteck aus
  begehbaren Feldern und darf kein anderes Gebäude überlappen.
- **AC-4** `offen` **Bauplatz wird vorher gezeigt** — Beim Platzieren ist zu sehen, ob der Platz
  taugt — grün oder rot, vor dem Klick.
- **AC-5** `offen` **Rohstoffe werden beim Baubeginn abgezogen** — Nicht bei Fertigstellung. Sonst
  lässt sich derselbe Betrag mehrfach verplanen.
- **AC-6** `offen` **Abbruch gibt die Hälfte zurück** — Ein abgebrochener Bau erstattet die Hälfte
  der Kosten.
- **AC-7** `offen` **Gebäude im Bau sind angreifbar** — Und sie haben weniger Widerstand als
  fertige.

### Ausbilden

- **AC-8** `offen` **Zentrum bildet Sammler aus** — 50 Nahrung, 20 Sekunden.
- **AC-9** `offen` **Kaserne bildet Kämpfer aus** — Speer, Bogen und Reiter, Werte in
  [Kampf](kampf.md).
- **AC-10** `offen` **Warteschlange je Gebäude** — Bis zu fünf Aufträge lassen sich vormerken. Der
  laufende Auftrag ist mit Restzeit sichtbar.
- **AC-11** `offen` **Abbruch erstattet vollständig** — Ein noch nicht begonnener Auftrag aus der
  Warteschlange erstattet die vollen Kosten.
- **AC-12** `offen` **Neue Einheiten erscheinen nebenan** — Auf ein freies Feld, nicht in ein
  Hindernis, nicht in ein anderes Gebäude.
- **AC-13** `offen` **Sammelpunkt je Gebäude** — Wo neue Einheiten hinlaufen sollen, ist einstellbar
  und sichtbar.

### Bevölkerung

- **AC-14** `offen` **Bevölkerung ist begrenzt** — Zentrum und Häuser geben je fünf Plätze,
  höchstens 50. Ohne Grenze gewinnt schlicht, wer am längsten klickt.
- **AC-15** `offen` **Volle Bevölkerung sperrt Ausbildung** — Und sagt auch, warum. „Nichts
  passiert" ist der häufigste Grund, ein Spiel wegzulegen.
- **AC-16** `offen` **Verlorene Einheiten geben Plätze frei** — Sofort, nicht erst beim nächsten Bau.

### Zerstörung

- **AC-17** `offen` **Gebäude haben Widerstand** — Zentrum 500, Kaserne 250, Haus 100.
- **AC-18** `offen` **Zerstörte Gebäude nehmen Plätze mit** — Fällt ein Haus, sinkt die Grenze.
  Einheiten über der Grenze sterben nicht, es kommen nur keine neuen dazu.
- **AC-19** `offen` **Letztes Zentrum entscheidet** — Wer sein letztes Zentrum verliert, ist raus
  (→ [Spielziel](spielziel.md) AC-5).

## Grenzfaelle

- Ein Sammler, der beim Bauen stirbt, hinterlässt eine Baustelle, an der ein
  anderer weiterbauen kann. Die Rohstoffe sind nicht verloren.
- Zwei Spieler können denselben Platz beanspruchen. Wer zuerst den Baubeginn
  absetzt, bekommt ihn; der andere bekommt seine Rohstoffe zurück.
- Ein Zentrum lässt sich nachbauen (200 Holz, 60 s) — sonst entscheidet ein
  einziger früher Verlust die ganze Partie.
