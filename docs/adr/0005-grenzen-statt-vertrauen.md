# ADR-0005: Grenzen greifen vor der Anmeldung

**Status:** entschieden
**Datum:** 2026-08-28

## Frage

Sobald der Server im Netz steht, ist er fuer jeden erreichbar. Konten regeln,
**wer eroeffnen darf** ([ADR-0003](0003-anmeldung.md)). Aber ein Fremder, der
Raumcodes durchprobiert, will gar kein Konto - er kostet trotzdem
Verbindungen, Handshakes und Rechenzeit. Wie wird das begrenzt?

## Entscheidung

Eine Schicht **unterhalb** der Anmeldung, die ohne Ansehen der Person zaehlt
und zumacht: Verbindungen je Adresse, Nachrichten je Verbindung, Fehlversuche
je Adresse, offene Partien je Adresse und je Server
(→ [Schutz](../../specs/00-plattform/schutz.md)).

Gerechnet wird mit tropfenden Eimern: kurze Spitzen erlaubt, Dauerlast nicht.

## Begruendung

Ein vierstelliger Raumcode waere 614.656 Moeglichkeiten gewesen. Bei hundert
laufenden Partien trifft im Mittel jeder 6.150. Versuch - ein Skript mit
hundert Versuchen je Sekunde landet damit **etwa jede Minute** in einer
fremden Partie.

Dagegen gibt es zwei Wege, und wir nehmen **beide**:

1. **Den Code verlaengern.** Sechs statt vier Zeichen sind 481.890.304
   Moeglichkeiten. Das kostet beim Vorlesen zwei Silben - in zwei
   Dreiergruppen (`KRN-4TZ`) bleibt er gut diktierbar.
2. **Das Durchprobieren teuer machen.** Nach fuenf falschen Codes je Minute
   fliegt die Verbindung raus.

Jeder Weg wuerde fuer sich reichen. Der erste ist eine Rechnung, die stimmt,
solange niemand an den Werten dreht; der zweite ist Programmlogik, und
Programmlogik hat Fehler. Zwei Riegel, die zusammen fast nichts kosten,
gehoeren beide vorgelegt.

Zwei Punkte, die sich daraus ergeben und leicht falsch gemacht werden:

- **Abweisen vor dem Handshake.** Eine abgelehnte Verbindung muss billiger
  sein als eine angenommene, sonst ist die Bremse selbst der Angriffspunkt.
- **Die Bremse darf nicht das Leck sein.** Wer je Adresse zaehlt, legt eine
  Liste an, die ein Angreifer mit gefaelschten Adressen fuellen kann. Deshalb
  werden stille Adressen vergessen, sobald ihre Eimer wieder voll sind.

## Folgen

- Mehrere Freunde hinter demselben Anschluss teilen sich eine Adresse. Acht
  Verbindungen und drei Partien sind dafuer bemessen; eine WG mit sechs
  Spielern braucht hoehere Werte.
- Hinter einem Reverse Proxy sieht der Server nur den Proxy. `HINTER_PROXY=1`
  schaltet den weitergereichten Kopf frei - **nur dann**, sonst faelscht ihn
  jeder selbst und umgeht alles.
- Die Grenzen sind Zahlen im Code, keine Konfigurationsdatei. Solange sie
  einmal je Start gesetzt werden, reicht das; ein Nachstellen im Betrieb
  waere eine eigene Entscheidung.
