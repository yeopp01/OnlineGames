# ADR-0007: Der Raum ist fluechtig, der Spielstand ist dauerhaft

**Status:** entschieden
**Datum:** 2026-08-28
**Aendert:** [ADR-0002](0002-raumcode.md) — dort stand, der Server halte alles
nur im Arbeitsspeicher. Das gilt weiterhin fuer Partien, nicht mehr fuer
Spielstaende.

## Frage

Bisher war jede Partie ein Abend: fuenf Leute, fuenfzehn Minuten, danach ist
sie vorbei. Nun soll es auch das Gegenteil geben - ein Aufbauspiel, in dem
jemand ueber Wochen sein Haus nachbaut, jederzeit aufhoert und spaeter dort
weitermacht, wo er war.

Beides sind Spiele auf demselben Server. Was unterscheidet sie?

## Entscheidung

**Zwei Arten von Partien, ein Raumbegriff.**

| | **Sitzungsspiel** | **Fortlaufendes Spiel** |
| --- | --- | --- |
| Beispiel | Strategie | Hausbau |
| Dauer | eine Sitzung, ~15 Minuten | Wochen, viele Sitzungen |
| Alle gleichzeitig da? | ja, sonst geht es nicht | nein |
| Ende | ein Sieger steht fest | es endet nicht, es pausiert |
| Ueberlebt einen Neustart | nein, und das ist gesagt | **ja, zwingend** |
| Gehoert | dem Abend | einem Konto |

Und der Satz, der beides traegt:

> **Der Raum ist fluechtig, der Spielstand ist dauerhaft.**

Ein Raum ist ein Treffpunkt mit einem Code, der so lange lebt wie die Sitzung.
Ein Spielstand ist eine gespeicherte Welt, die einem Konto gehoert. Ein
Sitzungsspiel hat nur einen Raum. Ein fortlaufendes Spiel hat einen
Spielstand, der bei jeder Sitzung in einen **neuen** Raum geladen wird - mit
neuem Code.

Das ist der Grund, warum niemand seinen Raumcode aufschreiben muss: Er ist nie
der Weg zurueck ins eigene Spiel. Der Weg zurueck fuehrt ueber das Konto.

## Begruendung

Der naheliegende Gedanke waere, den Raum dauerhaft zu machen - Code
aufschreiben, spaeter wieder eintippen. Das faellt aus drei Gruenden aus:

1. **Ein Raum haelt Rechenzeit.** Ein Raum, der Wochen lebt, taktet Wochen
   lang - oder er taktet nicht und ist dann kein Raum, sondern eine Datei mit
   Codenamen.
2. **Ein Code ist kein Ausweis.** Wer ihn mithoert, uebernimmt das Haus. Fuer
   fuenfzehn Minuten Strategie ist das egal, fuer wochenlange Arbeit nicht.
3. **Codes sind endlich.** 481.890.304 klingt nach viel, aber dauerhaft
   belegte Codes werden nie frei.

Der Spielstand am Konto loest alle drei: Er kostet nichts, solange niemand
spielt. Er gehoert nachweislich jemandem. Und er braucht keinen Code.

Damit bekommt die Regel aus [ADR-0003](0003-anmeldung.md) - Eroeffnen verlangt
ein Konto - einen zweiten, staerkeren Grund: **ein Spielstand braucht einen
Eigentuemer.** Ohne Konto gaebe es niemanden, dem das Haus gehoert.

## Was das technisch heisst

Die Schnittstelle aus [ADR-0006](0006-mehrere-spiele.md) bekommt zwei
Methoden dazu. Damit ist sie aus **zwei** Beispielen abgeleitet statt aus
einem - genau die Bedingung, die ADR-0006 gestellt hat:

```
aufbau()        einmalig beim Betreten, geht an alle
takten()        ein Schritt, so oft wie das Spiel es braucht
zustand()       was die Browser danach zu sehen bekommen
befehl()        was ein Spieler will, geprueft gegen den Absender

sichern()       die ganze Welt als Datenwert, klein genug zum Ablegen
laden(daten)    dieselbe Welt wieder herstellen
```

Ein Spiel erklaert dabei seine Art. Ein Sitzungsspiel laesst `sichern()` und
`laden()` einfach weg - dann gibt es keinen Spielstand und die Partie endet
mit dem Abend, wie bisher.

Abgelegt wird in derselben SQLite-Datei, die ohnehin fuer die Konten kommt.
Eine Zeile je Spielstand: Eigentuemer, Spielart, Name, Zeitpunkt, Welt.

## Folgen

- **Die Taktzahl gehoert zum Spiel, nicht zur Plattform.** Zehn Takte je
  Sekunde sind fuer Reiter richtig und fuer ein wachsendes Haus Verschwendung.
- **Selbsttaetiges Sichern.** Ein Absturz darf hoechstens eine Minute Arbeit
  kosten, nicht einen Abend.
- **Die Groesse wird zur Grenze.** Ein Spielstand muss klein genug bleiben,
  um ihn oft zu schreiben. Das ist eine Anforderung an das Spiel, nicht an
  die Ablage.
- **`server/spiele/<art>/` kommt jetzt doch** - aber begruendet, nicht
  vorsorglich.
- Wer nur mitspielt, braucht weiterhin kein Konto. Wer einen Spielstand
  besitzen will, schon.
