# ADR-0001: Der Server rechnet die Simulation

**Status:** entschieden
**Datum:** 2026-08-28

## Frage

Wer rechnet das Spiel aus - jeder Browser fuer sich (Lockstep) oder der Server?

## Entscheidung

Der Server rechnet. Die Browser schicken nur Absichten und bekommen zehnmal je
Sekunde den vollstaendigen Zustand.

## Begruendung

Age of Empires rechnete 1997 in jedem Rechner dieselbe Simulation und schickte
nur Befehle - weil ein 28k-Modem keinen Zustand uebertragen konnte. Das ist
sparsam, verlangt aber, dass alle Rechner **bit-genau** dasselbe Ergebnis
liefern. Ein `Math.random()` an der falschen Stelle, eine abweichende
Fliesskommazahl oder eine andere Reihenfolge beim Durchlaufen einer Liste, und
nach Minuten sehen zwei Spieler verschiedene Spiele. Solche Fehler zu finden
ist die unangenehmste Arbeit in einem Strategiespiel.

Diesen Preis muessen wir nicht zahlen. Gemessen an unserem Zuschnitt:

- Ein Zustand mit zehn Einheiten ist 607 Byte. Bei sechs Spielern zu je zwanzig
  Einheiten sind es rund 7 kB, also 70 kB/s je Spieler.
- 60 Sekunden Spiel rechnet der Server in 15 ms. Ein Kern traegt Dutzende
  Partien gleichzeitig.

Dafuer bekommen wir drei Dinge geschenkt, die bei Lockstep eigene Kapitel
waeren:

1. **Kein Abgleichproblem.** Es gibt nur eine Wahrheit.
2. **Kein Schummeln.** Der Server prueft jeden Befehl gegen den Absender.
3. **Rueckkehr nach Absturz.** Wer neu verbindet, bekommt den Zustand - er
   muss keine Historie nachrechnen.

## Folgen

- Der Server braucht dauerhaft Rechenzeit je laufender Partie. Verwaiste Raeume
  muessen deshalb geschlossen werden (→ [Raeume](../../specs/00-plattform/raeume.md) AC-12).
- Zehn Zustaende je Sekunde ruckeln auf einem 60-Hz-Schirm. Der Browser muss
  dazwischen weiterrechnen (→ [Uebertragung](../../specs/00-plattform/uebertragung.md) AC-8).
- Wenn wir eines Tages hundert Partien gleichzeitig tragen wollen, wird diese
  Entscheidung teuer. Bei fuenf Freunden ist sie geschenkt.
