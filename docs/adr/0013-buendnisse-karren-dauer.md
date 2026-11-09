# ADR-0013: Bündnisse, die sich lösen lassen, Marktkarren, Dauer als Einstellung

**Status:** entschieden
**Datum:** 2026-11-09
**Löst ab:** in [ADR-0012](0012-aoe2-als-vorlage.md) die Zeile „Handelskarren"
aus „Wird nicht gebaut" (Handel über Wasser bleibt dort);
[Spielziel](../../specs/10-strategie/spielziel.md) AC-14 („Bündnisse sind
nicht vorgesehen") in seiner Fassung bis Runde 144.

## Frage

Bis hierher spielt jeder gegen jeden, Absprachen finden am Tisch statt
(spielziel AC-14). Der Benutzer spielt aber meist **zwei gegen zwei**. Dazu
kommen drei Fragen, die an derselben Stelle hängen:

- Wie lange darf eine Partie dauern, und wer legt das fest?
- Die Partien der KI stehen im Mittelspiel oft mit leerem Gold da. Was hilft
  gegen den Goldmangel, wenn das Gold auf der Karte zur Neige geht?
- Ein Karren ohne einen zweiten Markt, zu dem er fahren kann, hat keinen
  Sinn. Und solange niemand verbündet ist, gibt es diesen zweiten Markt nur
  beim Gegner.

## Entscheidung

Antworten des Benutzers vom 2026-11-09 (in den Erkenntnissen unter „Bündnisse,
Dauer, Handel"):

- „Bündnisse brauchen wir schon, aber es muss irgendwie sinnvoll möglich
  sein, die dann aufzuweichen."
- „1,5 h darf ein Spiel schon dauern."
- „Karren gerne schon in der 3. Zeit bauen."
- Wann eine Partie für Tests endet, darf die Schleife festlegen. „Wenn ich mit
  echten spiele, dann soll das auch länger dauern dürfen."

Daraus:

**1. Teams werden im Warteraum festgelegt.** Jeder Platz bekommt ein Team
(1 bis 4) oder keins. Menschen wählen ihr eigenes Team, der Gastgeber wählt
das der KIs und darf jedes ändern, bis zum Start. Wie in der Vorlage ist das
Bündnis entweder **fest** oder **lösbar**; das ist eine Einstellung beim
Eröffnen, Vorgabe „lösbar". Ohne Teams bleibt es jeder gegen jeden, wie
heute.

**2. Verbündete kämpfen nicht gegeneinander.** Ein Rechtsklick auf einen
Verbündeten ist ein Gang dorthin, kein Angriff. Wachende Einheiten und
schießende Gebäude lassen Verbündete in Ruhe. Tore öffnen sich für
Verbündete. Flächenschaden trifft Verbündete wie eigene Einheiten (kampf
AC-19), denn der Stein fragt nicht, wem er gehört. Verbündete **sehen
gemeinsam**: was einer sieht, sehen alle seines Teams. Die Vorlage verlangt
dafür die Forschung „Kartographie" am Markt, die neuere Fassung schenkt sie;
hier gilt die gemeinsame Sicht ohne Forschung.

**3. Ein Bündnis zu lösen ist öffentlich und hat eine Frist.** Nur bei
„lösbar": ein Spieler kündigt einem Verbündeten das Bündnis. **Alle** sehen
die Ansage, mit einer Uhr über 60 Sekunden. Die gemeinsame Sicht endet
sofort, gekämpft werden darf erst nach Ablauf der Frist. Gekündigt wird
immer in beide Richtungen; die Vorlage kennt einseitige Haltungen
(verbündet, neutral, feindlich), das spart hier eine ganze Tafel.
Zurücknehmen lässt sich die Kündigung nicht. Ein neues Bündnis während der
Partie gibt es in diesem ADR nicht. **Warum mit Frist:** ohne sie wird das
Lösen ein Überfall aus dem Hinterhalt — Truppen stehen im fremden Dorf,
ein Klick, und das Dorf ist weg. Mit Frist ist es eine Entscheidung, auf
die der andere antworten kann. So erzählt es auch der Name: *Fading Allies*,
Bündnisse verblassen, sie brechen nicht über Nacht.

**4. Gewonnen hat ein Team.** Die Partie endet, sobald nur noch Spieler
übrig sind, die miteinander verbündet sind. Gewonnen haben alle Spieler
dieses Teams, auch die, die vorher ausgeschieden sind: wer für sein Team
gefallen ist, hat mitgewonnen. Ob die Vorlage das genauso hält, ist nicht
geprüft. Die Tafel nennt das Team. Wer sein Bündnis gelöst hat, gehört danach
keinem Team mehr an.

**5. Die KI hält ihre Bündnisse.** Sie greift nur Gegner an, nie
Verbündete, und löst selbst nie ein Bündnis. Kündigt ihr ein Mensch, ist
sie nach der Frist sein Gegner wie jeder andere. Ob sie einem Verbündeten
zu Hilfe kommt, entscheidet ein eigenes Kriterium, nicht dieses ADR.

**6. Der Marktkarren kommt mit der Ritterzeit.** Ausgebildet wird er am
Markt. Kosten, Leben, Rüstung und Tempo übernimmt er aus der Vorlage
(100 Holz, 50 Gold; 70 Leben; 0/0; Tempo 1,0). **Abweichung:** in der
Vorlage gibt es ihn ab der Feudalzeit, hier erst ab der Ritterzeit, wie der
Benutzer es will — in der Feudalzeit reicht das Gold auf der Karte noch.

Ein Rechtsklick auf einen **anderen** Markt schickt ihn auf die Strecke,
und er pendelt zwischen Heimatmarkt und Ziel. Zulässig ist ein Markt eines
Verbündeten **oder ein zweiter eigener Markt**. Ein Markt eines Gegners ist
es nicht. Bei jeder Ankunft am Heimatmarkt bringt er Gold. Die Menge wächst
mit dem Abstand der beiden Märkte schneller als dieser; eine lange Strecke
lohnt sich also, ist aber auch länger zu schützen.

- **Der eigene zweite Markt** ist eine bewusste Entscheidung: der Goldmangel
  trifft jede Partie, auch allein gegen die KI und eins gegen eins. Ob die
  Vorlage zwei eigene Märkte zulässt, ist **nicht geprüft**. Sollte sie es
  nicht tun, weichen wir hier ab, mit diesem Grund.
- **Die Formel** für die Menge kennt die Gemeinschaft der Vorlage nur
  nachgemessen, nicht aus einer Quelle: `0,46 · d · (d / S + 0,3)` Gold je
  Fahrt, `d` der Abstand der Märkte in Feldern, `S` die Kantenlänge der Karte.
  Sie ist **nicht geprüft**. Deshalb steht im Kriterium keine Zahl aus der
  Formel, sondern ein Ziel, das sich messen lässt: auf halber Kartenbreite
  bringt ein Karren je Minute etwa so viel Gold wie ein Dorfbewohner am
  Goldvorkommen. Die Werte stehen als Daten (`HANDEL` in `daten.js`) und
  werden beim Bauen im Prüfstand eingestellt.

**7. Die Dauer ist eine Einstellung.** Zwei Einstellungen beim Eröffnen:

- **Zeitgrenze:** keine, 90 oder 120 Spielminuten. Die Vorgabe ist
  **keine**. Heute endet jede Partie nach 90 Spielminuten unentschieden
  (spielziel AC-5), und das bräche eine zweistündige Partie zu viert
  mittendrin ab. Prüfstand, Tests und KI gegen KI geben ihre Grenze
  ausdrücklich mit; dort bleibt sie, wie die Schleife sie festlegt.
- **Spielgeschwindigkeit:** 1,0 (wie heute), 1,5 oder 2,0, Vorgabe 1,0. Eine
  Spielsekunde bleibt zehn Takte; schneller heißt nur, dass der Raum mehr
  Takte je echte Sekunde rechnet. Alle Zeiten in Daten, Specs und im Bild
  sind **Spielzeit**. Der Raum erfährt vom Steckbrief nur, wie viele Takte
  je Sekunde er rechnet. Das ist eine Frage an jedes Spiel und nichts
  Strategiespezifisches (ADR-0006).

## Was dieses ADR nicht hereinholt

- **Tribut**, also Rohstoffe an einen Verbündeten schicken (in der Vorlage
  am Markt, mit Gebühr). Für zwei gegen zwei naheliegend, aber eine eigene
  Zeile Umfang. Erst, wenn es beim Spielen fehlt.
- **Neue Bündnisse während der Partie**, und einseitige Haltungen
  (neutral).
- **Handel über Wasser** bleibt in „Wird nicht gebaut" (ADR-0012), denn es
  gibt keine Schiffe.
- **Sonderregeln** zu Bündnissen, etwa Kosten für das Lösen oder eine
  Sperre nach dem Start. Der Benutzer: „das muss nicht jetzt entschieden
  werden".

## Folgen

- Bis heute fragt jede Regel nur „mir oder nicht mir": Wache, Türme,
  Angriffsziel, Tore, Sicht, Partieende, Rechtsklick. Daraus wird **„Gegner
  oder nicht"**, und zwar an einer Stelle der Welt (`welt.feindlich(a, b)`)
  statt an jeder einzeln. Das ist der größte Teil der Arbeit, und er kommt
  deshalb vor den Völkern (Stufe E): jede Regel, die danach dazukommt, fragt
  schon richtig.
- Der Server schickt jedem, was **sein Team** sieht (kampf AC-13 wird um
  die gemeinsame Sicht erweitert).
- Der Prüfstand rechnet auch zwei gegen zwei. Für KI gegen KI zu viert legt
  die Schleife eine eigene Grenze fest.
- spielziel AC-5 (der Satz über die 90 Spielminuten) und spielauswahl AC-20
  (die Begründung des Namens mit „Bündnisse nur am Tisch") sind dann
  überholt. Angepasst werden sie in der Runde, die ihren Nachfolger baut.
- Die Bauabfolge steht im [Fahrplan](../../specs/10-strategie/fahrplan.md)
  als D10 bis D14.
