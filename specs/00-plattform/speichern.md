# Anhalten und Fortsetzen

**Bereich:** Plattform
**Kuerzel:** speichern
**Stand:** 0/26 fertig · 26 offen

## Zweck

Wer sein Haus über Wochen baut, hört mittendrin auf und macht später weiter.
Der Spielstand muss den Feierabend, den Serverneustart und das nächste
Programmupdate überleben.

Warum das ein Spielstand am Konto ist und kein dauerhafter Raum, steht in
[ADR-0007](../../docs/adr/0007-zwei-arten-von-partien.md).

## Abgrenzung

| Gehoert dazu                       | Gehoert nicht dazu                                  |
| ---------------------------------- | --------------------------------------------------- |
| Sichern, Laden, Anhalten           | Auswahl und Liste → [Spielauswahl](spielauswahl.md) |
| Wem ein Spielstand gehört          | Konten selbst → [Konten](konten.md)                 |
| Was ein Neustart kostet            | Betrieb der Maschine → [Betrieb](../20-betrieb/betrieb.md) |

## Zwei Arten von Partien

| | Sitzungsspiel | Fortlaufendes Spiel |
| --- | --- | --- |
| Beispiel | Strategie | Hausbau |
| Speichert | auf Wunsch | immer, selbsttätig |
| Neustart ohne Sicherung | beendet die Partie | darf nicht vorkommen |
| Gehört | dem Abend, beim Sichern dem Gastgeber | einem Konto |

Ein Spiel erklärt seine Art selbst. Ein Spiel ohne `sichern()` und `laden()`
kann schlicht nicht gespeichert werden — dann bleibt alles wie bisher.

**Speichern ist nicht auf einen Spieler beschränkt.** Weil der Server rechnet
(→ [ADR-0001](../../docs/adr/0001-server-rechnet.md)), liegt der vollständige
Stand einer Partie ohnehin an einer Stelle; ob eine oder sechs Personen
zuschauen, ändert daran nichts. Was eine Mehrspielerpartie schwer macht, ist
nicht das Sichern, sondern das Wiederzusammenkommen.

## Abnahmekriterien

### Sichern

- **AC-1** `offen` **Ein Spielstand ist ein Datenwert** — Die Welt liefert über `sichern()` einen
  Wert, aus dem `laden()` dieselbe Welt wieder herstellt. Kein Zugriff auf
  Dateien im Spiel selbst.
- **AC-2** `offen` **Laden ergibt exakt dieselbe Welt** — Sichern, laden, sichern: der zweite Wert
  ist gleich dem ersten. Ohne diese Zusicherung schleichen sich Verluste ein,
  die erst nach Wochen auffallen.
- **AC-3** `offen` **Selbsttätig jede Minute** — Ein Absturz kostet höchstens eine Minute Arbeit.
- **AC-4** `offen` **Gesichert wird auch beim Anhalten** — Und beim geordneten Herunterfahren des
  Servers.
- **AC-5** `offen` **Ein Spielstand bleibt klein** — Unter 1 MB. Was oft geschrieben wird, muss
  klein sein; das ist eine Anforderung an das Spiel, nicht an die Ablage.
- **AC-6** `offen` **Kaputter Spielstand nimmt nichts mit** — Lässt er sich nicht laden, sagt
  das die Oberfläche, und der vorherige Stand ist noch da. Es wird also
  mindestens ein Stand zurückgehalten.

### Anhalten und Fortsetzen

- **AC-7** `offen` **Anhalten ist jederzeit möglich** — Ein Knopf im Spiel: sichern, Raum
  schließen, zurück zur Übersicht.
- **AC-8** `offen` **Wegklicken ist dasselbe wie Anhalten** — Wer den Browser schließt, verliert
  nichts. Nach zwei Minuten ohne Verbindung wird gesichert und der Raum
  geschlossen.
- **AC-9** `offen` **Fortsetzen öffnet einen neuen Raum** — Mit neuem Code. Der alte Code führt
  nirgendwohin — er war nie der Weg zurück.
- **AC-10** `offen` **Fortsetzen, wo aufgehört wurde** — Auch die
  Kameraposition, damit man sich nicht neu zurechtfinden muss.
- **AC-11** `offen` **Ein Spielstand läuft nur einmal** — Wird derselbe Stand ein zweites Mal
  geöffnet, wird die erste Sitzung beendet. Zwei laufende Welten aus einer
  Vorlage würden einander überschreiben.

### Eigentum

- **AC-12** `offen` **Ein Spielstand gehört einem Konto** — Das ist der zweite und stärkere Grund
  für [Konten](konten.md) AC-16: ohne Konto gäbe es niemanden, dem er gehört.
- **AC-13** `offen` **Nur Eigentümer öffnet, benennt, löscht** — Geprüft auf dem Server bei
  jedem Zugriff, nicht nur beim Anzeigen der Liste.
- **AC-14** `offen` **Mitspieler dürfen mitbauen, nicht besitzen** — Wer per Code dazukommt, darf
  im Spiel handeln, aber den Stand weder löschen noch umbenennen noch allein
  fortsetzen.
- **AC-15** `offen` **Gelöschtes Konto nimmt Spielstände mit** — Deckungsgleich mit
  [Konten](konten.md) AC-15.

### Über Änderungen hinweg

- **AC-16** `offen` **Jeder Spielstand trägt eine Fassungsnummer** — Ohne sie ist beim ersten
  Update nicht mehr feststellbar, was ein alter Stand bedeutet.
- **AC-17** `offen` **Unbekannte Fassung wird abgelehnt** — Lieber „dieser
  Stand stammt aus einer neueren Fassung" als eine halb geladene Welt.
- **AC-18** `offen` **Ältere Fassungen werden hochgezogen** — Solange es fachlich geht.
  Geht es nicht, ist das eine Entscheidung für ein ADR.

### Anhalten zu mehreren

Anhalten und Speichern sind zwei verschiedene Dinge. **Pause** hält die Uhr
an, alle bleiben verbunden — für den Gang zur Tür. **Sichern** beendet die
Sitzung und macht sie später wieder aufrufbar.

- **AC-19** `offen` **Pause hält die Uhr an** — Die Welt taktet nicht mehr, Befehle
  werden verworfen, alle sehen dasselbe Standbild mit dem Namen dessen, der
  angehalten hat.
- **AC-20** `offen` **Anhalten ist begrenzt** — Zweimal je Spieler und
  Partie, höchstens fünf Minuten am Stück, danach läuft sie von selbst
  weiter. Ohne Grenze ist Pause im Wettstreit ein Werkzeug, kein Dienst.
- **AC-21** `offen` **Fortsetzen kann jeder** — Auch wer nicht angehalten hat. Sonst hält eine
  abgerissene Verbindung die Partie für alle an.
- **AC-22** `offen` **Sichern verlangt Einigkeit** — Eine Mehrspielerpartie wird nur gesichert,
  wenn alle Verbundenen zustimmen. Ein einzelner darf die Runde nicht
  beenden, weil er gerade verliert.
- **AC-23** `offen` **Der Gastgeber besitzt den Stand** — Er taucht in seiner Liste auf, und nur er
  kann ihn fortsetzen. Die Mitspieler bekommen beim Fortsetzen einen neuen
  Code zugeschickt.
- **AC-24** `offen` **Fortsetzen wartet auf dieselben Plätze** — Der Warteraum zeigt die Plätze der
  ursprünglichen Partie. Wer sich mit dem Konto oder Namen von damals
  meldet, bekommt seinen Platz zurück.
- **AC-25** `offen` **Fehlender Spieler blockiert nicht ewig** — Sind alle bis auf einen da,
  kann der Gastgeber dessen Platz stilllegen: Einheiten bleiben stehen, die
  Partie läuft.
- **AC-26** `offen` **Beteiligte stehen im Spielstand** — Damit später nachvollziehbar
  ist, wer eingeladen werden muss.

## Grenzfaelle

- Ein fortlaufendes Spiel, in dem gerade niemand ist, kostet nichts: Es läuft
  nicht, es liegt.
- Zwei Leute bauen gemeinsam an einem Haus, und der Eigentümer geht offline.
  Dann läuft die Sitzung weiter, bis der letzte geht — gesichert wird auf das
  Konto des Eigentümers.
- Der Serverneustart mitten in einer Bausitzung kostet höchstens die Minute
  seit dem letzten selbsttätigen Sichern. In einer Strategiepartie kostet
  derselbe Neustart die ganze Partie — es sei denn, sie wurde vorher
  gesichert.
- Eine gesicherte Mehrspielerpartie, die nie fortgesetzt wird, liegt ewig in
  der Liste des Gastgebers. Das ist in Ordnung: sie kostet nichts, solange
  sie nicht läuft.
- Das eigentliche Hindernis beim Fortsetzen einer Mehrspielerpartie steht
  nicht im Code, sondern im Kalender. Fünf Leute zweimal an einen Tisch zu
  bekommen ist schwerer als einmal.
