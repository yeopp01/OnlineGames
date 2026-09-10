# Spieltag

**Bereich:** Manager
**Kuerzel:** spieltag
**Stand:** 23/23 fertig

## Zweck

Aus zwei Mannschaften und zwei Taktiken ein Ergebnis machen, das sich richtig
anfühlt und sich nicht widerspricht: der Bessere gewinnt öfter, aber nicht
immer — und wer vom Platz fliegt, trifft danach nicht mehr.

Das Modell in einem Satz: **das Mittelfeld teilt die Chancen auf, der Angriff
gegen Abwehr und Torwart entscheidet, was daraus wird** — in Abschnitten von
fünf Minuten, mit der Mannschaft, die in diesem Abschnitt wirklich auf dem
Platz steht.

## Abgrenzung

| Gehört dazu                                   | Gehört nicht dazu                            |
| --------------------------------------------- | -------------------------------------------- |
| Chancen, Tore, Vorlagen, Karten, Wechsel      | Tabelle und Kasse → [Liga](liga.md)          |
| Nachwirkung auf Kondition, Moral, Statistik   | Spielverlauf zum Zusehen (wird es nicht)     |
| Noten je Spieler                              | Verlängerung und Elfmeter → [Pokal](pokal.md) |

## Abnahmekriterien

### Das Ergebnis

- **AC-1** `fertig` **Gleiche Zahl, gleiches Spiel** — Dieselbe Zufallsquelle
  und dieselben Mannschaften ergeben dasselbe Ergebnis samt Ereignissen.
- **AC-2** `fertig` **Das Mittelfeld teilt die Chancen** — Wer im Mittelfeld
  überlegen ist, bekommt mehr Chancen. Fünf Mittelfeldspieler setzen sich
  gegen drei durch.
- **AC-3** `fertig` **Stärkere gewinnt öfter, nicht immer** — Der beste Verein
  schlägt den schwächsten in deutlich mehr als der Hälfte der Spiele, aber
  nicht in allen. _(Gemessen: der Zweite der ersten Liga gewinnt gegen den
  Vorletzten 64 % der Spiele, Heim und Auswärts im Wechsel; zwei gleich Starke
  gewinnen je 37 %, 24 % enden unentschieden.)_
- **AC-4** `fertig` **Heimvorteil ist messbar** — Dieselbe Paarung geht daheim
  häufiger auf als auswärts.
- **AC-5** `fertig` **Etwa drei Tore je Spiel** — Über viele Spiele liegt der
  Schnitt zwischen 2,7 und 3,5. _(Gemessen über 2.000 Spiele der ersten Liga:
  3,10 Tore, 48 % Heimsiege, 21 % Unentschieden — Bundesliga: 3,1 / 44 % / 24 %.)_
- **AC-6** `fertig` **Stürmer treffen, Torwart nie** — Über viele Spiele
  treffen Stürmer am häufigsten, Verteidiger am seltensten, Torhüter nie.
- **AC-22** `fertig` **Tore haben Vorlagen** — Die meisten Tore haben einen
  Vorlagengeber aus derselben Mannschaft, der zu dem Zeitpunkt auf dem Platz
  stand — nie den Schützen selbst.

### Taktik

- **AC-7** `fertig` **Vier Regler** — System, Ausrichtung, Härte und Pressing.
  Pressing stärkt das Mittelfeld, Härte die Abwehr.
- **AC-8** `fertig` **Server begrenzt die Werte** — Ausrichtung, Härte und
  Pressing liegen zwischen eins und fünf, egal was ankommt.
- **AC-9** `fertig` **Härte kostet Karten** — Wer hart spielen lässt, sieht
  mehr Gelb und Rot.
- **AC-23** `fertig` **Die Ausrichtung öffnet oder verriegelt** — Von Mauern
  bis Offensiv: je offensiver beide, desto mehr Chancen für beide; wer
  offensiv spielt, verschiebt dazu ein wenig von der Abwehr in den Angriff.
  Deshalb hilft Offensive dem Stärkeren und Mauern dem Schwächeren.
  _(Gemessen über je 1.500 Spiele: der Favorit holt mauernd 2,01 Punkte je
  Spiel, offensiv 2,17; der Außenseiter mauernd 0,74, offensiv 0,65; gleich
  Starke 1,32 bis 1,33, gleich wie eingestellt.)_
- **AC-24** `fertig` **Pressing kostet Kondition** — Hohes Pressing
  stärkt das Mittelfeld und lässt die Spieler schneller ermüden, im Spiel und
  danach; geübtes Pressing kostet weniger. Tiefes Pressing schont. _(Gemessen:
  Pressing 5 statt 3 bringt frisch 1,47 statt 1,34 Punkte je Spiel; über 30
  Wochen am Stück liegt die Elf dann bei 82 statt 85 Kondition und der
  Vorsprung ist weg — außer das Pressing wird geübt.)_
- **AC-25** `fertig` **Ein System muss sich einspielen** — Ein System, das die
  Mannschaft nicht kennt, kostet bis zu sieben Prozent Stärke. Jedes Spiel
  darin und das Training bringen es näher; was lange nicht gespielt wird,
  verblasst. _(Gemessen: nicht eingespielt 1,18 Punkte je Spiel, voll
  eingespielt 1,34.)_

### Im laufenden Spiel

- **AC-12** `fertig` **Drei Wechsel je Spiel** — Ein Verletzter wird sofort
  ersetzt, ein Müder nach der Wechselregel. Der Eingewechselte spielt ab seiner
  Minute, der Ausgewechselte ist danach nicht mehr dabei. Ein Müder geht auch
  für einen etwas Schwächeren — seine gesparten Minuten sind nächste Woche
  Kondition. _(Gemessen über zwei Saisons: 1,7 bis 2,0 Wechsel je Mannschaft
  wegen Müdigkeit, 0,12 wegen Verletzung.)_
- **AC-13** `fertig` **Verletzungen im Spiel** — Ein Spieler kann ausfallen
  und fehlt dann eine bis sechs Wochen. Die Härte des **Gegners** treibt sie,
  nicht die eigene.
- **AC-14** `fertig` **Rot wirkt im laufenden Spiel** — Eine rote Karte
  schwächt die Mannschaft für die verbleibenden Minuten; in Unterzahl gibt es
  weniger Chancen und mehr Gegentore.
- **AC-17** `fertig` **Nichts nach dem Platzverweis** — Wer vom Platz
  geflogen, verletzt ausgeschieden oder ausgewechselt ist, schießt kein Tor,
  gibt keine Vorlage und sieht keine Karte mehr.
- **AC-18** `fertig` **Die zweite Gelbe ist Gelb-Rot** — Nie zwei gelbe Karten
  ohne Platzverweis, nie eine dritte. Wer schon Gelb hat, geht vorsichtiger in
  den Zweikampf. _(Gemessen: 0,08 Gelb-Rot und 0,06 Rot je Spiel.)_

### Nachwirkung

- **AC-10** `fertig` **Spielen kostet Kondition** — Wer gespielt hat, verliert
  Kondition, und zwar nach seinen Minuten.
- **AC-11** `fertig` **Das Ergebnis bewegt die Moral** — Ein Sieg hebt sie,
  eine Niederlage drückt sie, eine gute Note hilft. Wer gut genug ist und
  nicht spielt, wird unzufrieden.
- **AC-15** `fertig` **Karten sperren** — Die fünfte gelbe Karte kostet ein
  Spiel, Gelb-Rot eines, Rot zwei. Gesperrt wird für Pflichtspiele, gezählt in
  Spielen, nicht in Wochen. Die Gelbe vor Gelb-Rot zählt nicht mit.
- **AC-16** `fertig` **Nur Nachwirkung verändert Vereine** — `begegnung()`
  liest die Vereine nur; Kondition, Moral, Statistik, Karten, Sperren und
  Verletzungen trägt `nachwirkung()` nach. Deshalb lässt sich dieselbe Paarung
  tausendmal rechnen, ohne die Mannschaften auszulaugen.
- **AC-20** `fertig` **Noten für jeden Spieler** — Wer mindestens zwanzig
  Minuten gespielt hat, bekommt eine Note von 1,0 bis 6,0: Tore, Vorlagen,
  Gegentore und Platzverweise bewegen sie. Die Saisonstatistik führt den
  Schnitt.
