# Kampf

**Bereich:** Strategie
**Kuerzel:** kampf
**Stand:** 14 offen

## Zweck

Der Teil, der aus einer Wirtschaftssimulation ein Spiel macht. Drei
Kampfeinheiten, die sich gegenseitig schlagen — Stein, Schere, Papier mit
Laufwegen.

## Abgrenzung

| Gehoert dazu                  | Gehoert nicht dazu                        |
| ----------------------------- | ----------------------------------------- |
| Einheitentypen und ihre Werte | Ausbildung und Kosten → [Bauen](bauen.md) |
| Angriff, Schaden, Tod         | Bewegung → [Einheiten](einheiten-und-befehle.md) |
| Sichtweite                    | Siegbedingung → [Spielziel](spielziel.md) |

## Die vier Einheiten

| Einheit     | Kosten             | Leben | Schaden | Reichweite | Tempo | Stark gegen |
| ----------- | ------------------ | ----- | ------- | ---------- | ----- | ----------- |
| **Sammler** | 50 Nahrung         | 40    | 3       | 1          | 3,0   | –           |
| **Speer**   | 40 Nahrung, 20 Holz | 90   | 8       | 1          | 2,5   | Reiter      |
| **Bogen**   | 30 Nahrung, 50 Holz | 50   | 7       | 5          | 2,5   | Speer       |
| **Reiter**  | 70 Nahrung, 30 Holz | 110  | 10      | 1          | 4,5   | Bogen       |

Ein geschlossener Kreis: Speer schlägt Reiter, Reiter schlägt Bogen, Bogen
schlägt Speer. Damit gibt es keine Einheit, die immer richtig ist — die
Bedingung aus [Spielziel](spielziel.md) AC-10.

Die Zahlen hier sind **Startwerte zum Ausprobieren**, keine Zusicherung. Sie
werden sich nach den ersten Spieleabenden ändern; ändert sich der Kreis
selbst, ist das eine Entscheidung und gehört in ein ADR.

## Abnahmekriterien

### Angreifen

- **AC-1** `offen` **Rechtsklick auf Feindliches greift an** — Auf eine fremde Einheit oder ein
  fremdes Gebäude. Kein eigener Knopf, keine eigene Betriebsart.
- **AC-2** `offen` **Einheiten wehren sich von selbst** — Eine stehende Einheit greift an, was in
  ihre Reichweite kommt, ohne Befehl.
- **AC-3** `offen` **Verfolgung endet** — Ein fliehendes Ziel wird höchstens fünf Felder weit
  verfolgt, dann kehrt die Einheit zurück. Sonst zieht ein einzelner Reiter
  ein ganzes Heer quer über die Karte.
- **AC-4** `offen` **Angriffslauf** — Ein Befehl auf ein leeres Feld, bei dem unterwegs alles
  angegriffen wird, was im Weg steht.
- **AC-5** `offen` **Sammler kämpfen schlecht, aber sie kämpfen** — Damit ein früher Überfall auf
  die Basis nicht widerstandslos durchgeht.

### Schaden

- **AC-6** `offen` **Bonus gegen die schwache Seite** — Gegen die Einheit, gegen die man stark ist,
  gibt es doppelten Schaden. Der Kreis muss spürbar sein, nicht statistisch.
- **AC-7** `offen` **Ein Schlag je Sekunde** — Gleicher Takt für alle, damit Kämpfe lesbar bleiben.
- **AC-8** `offen` **Kein Zufall im Schaden** — Gleiche Lage, gleiches Ergebnis. Würfel machen
  Niederlagen unerklärlich, und erklärbare Niederlagen sind das, was zur
  nächsten Partie führt.
- **AC-9** `offen` **Leben ist sichtbar** — Ein Balken über jeder beschädigten Einheit und jedem
  beschädigten Gebäude.
- **AC-10** `offen` **Tote verschwinden nach zwei Sekunden** — Lange genug, um zu sehen, was passiert
  ist.

### Sicht

- **AC-11** `offen` **Einheiten sehen fünf Felder weit** — Gebäude acht. Was niemand sieht, wird
  nicht dargestellt.
- **AC-12** `offen` **Erkundetes bleibt erinnert** — Gelände bleibt sichtbar, fremde Einheiten
  nicht. Der klassische Nebel: man weiß, wo der Wald steht, aber nicht, wer
  gerade dort ist.
- **AC-13** `offen` **Kein Blick durch fremde Augen** — Der Server schickt einem Spieler nur, was
  seine Einheiten sehen. Sonst liest ein verändertes Programm die ganze Karte
  mit — die Zustandsnachricht enthält heute alles.
- **AC-14** `offen` **Angriff wird gemeldet** — Wer angegriffen wird, bekommt einen Hinweis und
  kann per Klick dorthin springen.

## Grenzfaelle

- Zwei Einheiten, die sich gegenseitig töten, sterben beide. Kein Vorrang für
  den, der zuerst dran war.
- Ein Gebäude im Bau, dessen Bauplatz von Feinden umstellt ist, wird trotzdem
  fertig — Bauen ist kein Kampf.

## Hinweis zu AC-13

Das ist der einzige Punkt hier, der die
[Übertragung](../00-plattform/uebertragung.md) verändert: Heute bekommt jeder
Spieler den vollständigen Zustand. Sichtbereiche bedeuten, dass der Server je
Spieler filtert — mehr Rechenzeit je Takt und größere Nachrichten in Summe.
Wenn das teuer wird, ist es eine Entscheidung für ein ADR, keine Kleinigkeit
im Kampf.
