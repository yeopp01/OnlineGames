# Kader und Spieler

**Bereich:** Manager
**Kuerzel:** kader
**Stand:** 29/33 fertig · 3 in QA · 1 offen

## Zweck

Eine Welt voller Vereine, die sich unterscheiden, ohne dass jemand sie von
Hand einträgt — und die sich über die Jahre verändert: Spieler altern, werden
besser oder schlechter, hören auf, und aus der Jugend kommen neue. Aus einem
Startwert entsteht dieselbe Welt wieder; ein Fehler lässt sich damit
wiederholen, statt ihn zu suchen.

## Abgrenzung

| Gehört dazu                                   | Gehört nicht dazu                                   |
| --------------------------------------------- | --------------------------------------------------- |
| Erzeugung, Werte, Positionen, Entwicklung     | Was im Spiel daraus wird → [Spieltag](spieltag.md)  |
| Die beste Elf zu einem System                 | Verträge und Gehalt → [Verträge](vertraege.md)      |
| Jugend, Karriereende, A-Jugend im Notfall     | Handel → [Transfer](transfer.md)                    |

## Die Werte eines Spielers

| Wert       | Bedeutung                                                          |
| ---------- | ------------------------------------------------------------------ |
| Stärke     | was er heute kann, 20 bis 99                                       |
| Talent     | was er erreichen kann — nie unter der Stärke                       |
| Kondition  | Frische, sinkt im Spiel, steigt im Training                        |
| Moral      | Stimmung, hebt und senkt die Tagesform                             |
| Alter      | steigt mit jedem Saisonende um eins                                |
| Position   | Mannschaftsteil und Stammposition, manche mit einer zweiten (→ [Aufstellung](aufstellung.md) AC-22) |

## Abnahmekriterien

### Erzeugung

- **AC-1** `fertig` **Gleiche Zahl, gleiche Welt** — Derselbe Startwert erzeugt
  dieselben 36 Vereine mit denselben Spielern und dieselben Vereinslosen.
- **AC-2** `fertig` **Zwanzig Spieler je Verein** — Zu Beginn drei Torhüter,
  sieben Verteidiger, sieben im Mittelfeld, drei im Sturm.
- **AC-3** `fertig` **Namen sind weltweit eindeutig** — Auch über Saisons,
  in denen Jugendspieler und neue Vereinslose dazukommen.
- **AC-4** `fertig` **Die Welt hat ein Gefälle** — Der beste Verein der ersten
  Liga ist deutlich stärker als ihr schwächster, und die zweite Liga ist im
  Schnitt schwächer als die erste.
- **AC-5** `fertig` **Alter formt Stärke und Talent** — Junge Spieler sind
  schwächer als ihr Talent, alte stärker als ihre Zukunft. Der Scheitel liegt
  bei 27.
- **AC-6** `fertig` **Gehalt wächst steiler als Stärke** — Mit der vierten
  Potenz: ein Spieler mit 90 kostet ein Vielfaches von einem mit 60, damit ein
  Star wehtut und die zweite Liga sich ihre Kader leisten kann.
- **AC-7** `in-qa` **Alle Namen sind erfunden** — Vereine, Orte und Spieler
  sind frei erfunden. Echte Lizenzdaten kosten Geld und bringen nichts.
  _(Zugesichert durch die Namenslisten im Quelltext, nicht durch einen Test —
  ein Test könnte es auch nicht belegen.)_

### Aufstellung

- **AC-8** `fertig` **Fünf Systeme** — 4-4-2, 3-5-2, 4-3-3, 5-3-2, 4-5-1. Jedes
  verteilt zehn Feldspieler anders auf Abwehr, Mittelfeld und Sturm.
- **AC-9** `fertig` **Beste Elf stellt sich auf** — Wer nichts einstellt,
  bekommt die nach Tagesform und Eignung beste Elf für sein System, Platz für
  Platz (→ [Aufstellung](aufstellung.md) AC-24).
- **AC-10** `fertig` **Fremde Position schwächt** — Reicht der Kader für ein
  System nicht, wird umgestellt, und wer außerhalb seiner Position spielt,
  bringt dort weniger (→ [Aufstellung](aufstellung.md) AC-23).
- **AC-11** `fertig` **Tagesform aus Kondition und Moral** — Ein ausgelaugter
  Star ist schlechter als ein frischer Durchschnittsspieler.
- **AC-12** `fertig` **Ausfälle fehlen in der Elf** — Wer verletzt oder
  gesperrt ist, kann nicht aufgestellt werden, und die beste Elf übergeht ihn.

### Über die Jahre

- **AC-13** `fertig` **Entwicklung über die Saison** — Junge wachsen auf ihr
  Talent zu, schneller mit Spielzeit und Techniktraining; ab 29 geht es
  abwärts, auch mit Training. Am Saisonende ist jeder ein Jahr älter.
- **AC-19** `fertig` **Auf- und Abwertung zur Winterpause** — Zur Winterpause
  kommt ein erster Teil der Entwicklung, am Saisonende der Rest. Das Postfach
  nennt die größten Sprünge; älter wird dabei niemand.
- **AC-20** `fertig` **Entwicklung auf einen Blick** — Zur Winterpause und am
  Saisonende hält das Spiel für den eigenen Kader fest, wer sich wie
  entwickelt hat: Stärke vorher und nachher, Alter, Talent, Anteil an der
  Spielzeit, Techniktraining und die Altersstufe, nach der gerechnet wurde.
  Das Kaderblatt zeigt die letzten vier Berichte samt der Regel, die
  Kadertabelle die letzte Veränderung je Spieler; das Postfach zählt, wer
  besser, wer schlechter und wer gleich blieb.
- **AC-14** `fertig` **Jugend liefert nach** — Zu jedem Saisonende rücken zwei
  Siebzehnjährige auf, auf die Positionen, auf denen es am dünnsten ist. Ein
  Verein mit Ruf bekommt mehr Talent.
- **AC-15** `fertig` **Verträge laufen aus** — Wer am Saisonende keinen
  Vertrag mehr hat, geht zu den Vereinslosen (→ [Verträge](vertraege.md)).
- **AC-16** `fertig` **Jeder Spieler hat einen Marktwert** — Er folgt Stärke,
  Alter und ungenutztem Talent (→ [Transfer](transfer.md) AC-1 bis AC-3).
- **AC-23** `offen` **Sterne in einem Band** — Ab der fünften von zwanzig
  Saisons ohne Menschen spielen in der ersten Liga am Saisonende drei bis
  acht Spieler ab Stärke 85, in jeder Saison: keine Welle aus der
  Startgeneration und kein Aussterben danach. Auf Schritt 4 (2026-11-22)
  über acht Startwerte an zweien jede Saison im Band, sonst 0 bis 12 je
  Saison und meist nur eine bis sieben Saisons daneben (Startwert 20260910:
  nur Saison 5 mit 2); vorher riss es an jedem Startwert in 10 bis 15 von 20
  Saisons — eine Welle der Startgeneration bis 18, danach 2 bis 3.
  Auf Schritt 5 (Neigungen, Entwicklung nach Einsatz, 2026-11-24) hält es an
  einem von acht (4711); an den anderen reißt es zuerst in Saison 5 bis 9,
  mit 2 bis 10 Sternen, in 1 bis 14 von 20 Saisons — meist oben: wer spielt,
  wächst jetzt auch nach 24 weiter.
- **AC-24** `in-qa` **Durchschnittsalter bleibt im Band** — Über zwanzig
  Saisons ohne Menschen sind die Spieler der Vereine ab der zweiten Saison im
  Mittel 23 bis 25 Jahre alt, in jeder Saison, gezählt am letzten Termin vor
  dem Altern. Bis 2026-11-22 stand hier 25,5 bis 27: je Saison kommen rund
  72 Siebzehnjährige aus der Jugend in die Kader, rund 40 % der Spieler sind
  20 oder jünger, und keine gemessene Variante kam über 25,1, ohne dass das
  Niveau der Ligen fiel (`docs/manager/dynamik/plan.md`). Die erste Saison
  zählt nicht: die Startwelt ist 18 bis 33 Jahre alt, im Mittel 25,5 bis 26.
  Auf Schritt 2 (`7d9f9ff`) reißt es an allen vier Startwerten unten: ab der
  sechsten Saison 22,7 bis 23,3. Auf Schritt 4 hält es am Startwert des
  Tests und an sechs von acht (22,9 bis 24,8 je Saison); an 1234 und 99
  fällt es in einzelnen Saisons auf 22,9.
  **`in-qa` seit dem 2026-11-24:** auf Schritt 4 hielt es an sechs von acht
  Startwerten; **auf Schritt 5 an keinem** — an jedem liegen 3 bis 8 von 20
  Saisons bei 22,7 bis 23,0, zuerst in Saison 7 bis 9. Warum, ist nicht
  gemessen. `fertig` erst, wenn
  es an allen acht hält. Der Test bleibt, wie er ist, als `todo`.
- **AC-25** `fertig` **Die Jugend kommt an** — Über zwanzig Saisons ohne
  Menschen liegt ab der zweiten Saison die Stärke der Siebzehnjährigen aus
  dem eigenen Nachwuchs im Mittel höchstens 15 unter dem Niveau ihres
  Vereins, und die Zwanzigjährigen in Vereinen stehen im Mittel mindestens
  30 % der Pflichtspielminuten auf dem Platz — gezählt am letzten Termin,
  wo es mindestens 30 Zwanzigjährige gibt. Auf Schritt 2 reißt der Abstand
  in jeder Saison (−21,5 bis −23,8); die Spielzeit mit 20 hält (39 bis 78 %).
  Auf Schritt 4 an allen acht gemessenen Startwerten: Abstand −14,8 bis
  −10,6, Spielzeit mit 20 bei 32 bis 70 %.
- **AC-26** `in-qa` **Wer spielt, entwickelt sich** — Über zwanzig Saisons
  ohne Menschen wird je Saison, wer 25 bis 30 ist und ein Jahr später noch
  in einem Verein steht, nach seinem Spielanteil gedrittelt: das Drittel mit
  der meisten Spielzeit legt bis zum nächsten Saisonende im Mittel
  mindestens einen Punkt Stärke mehr zu als das mit der wenigsten. Auf
  Schritt 2 reißt es in jeder Saison (−0,6 bis +0,5): die Spielzeit wirkt
  heute nur bis 24. Auf Schritt 4 an keinem von acht (−0,30 bis −0,08).
  **Auf Schritt 5 hält es an fünf von acht**: an 4711, 1234 und 99 liegen
  ein bis zwei von 19 Saisons bei 0,88 bis 0,96. Die Spielzeit zählt jetzt
  auch ab 25 (`ENTWICKLUNG` in `kader.js`: 5,5 Punkte je Anteil an allen
  Minuten unter 70 %, 1,5 darüber, dazu die Noten → AC-30). Mit 7 statt 5,5
  hielt es an allen acht, riss aber transfer AC-28 und AC-31.
- **AC-17** `fertig` **Karriereende** — Ab 33 wird es Jahr für Jahr
  wahrscheinlicher, mit 36 ist Schluss — auch mit gültigem Vertrag
  (→ AC-21).
- **AC-21** `fertig` **Karriereende wird angekündigt** — Zur
  Winterpause steht fest, wer zum Saisonende aufhört, gerechnet mit dem Alter,
  das er dann hat. Das Postfach nennt die eigenen, Kader und Markt tragen eine
  Marke, verlängert wird mit ihnen nicht mehr, und die anderen Vereine holen
  sie nicht. Am Saisonende gehen genau sie — vor dem Vertragsende, auch mit
  gültigem Vertrag.
- **AC-22** `fertig` **Jeder Spieler hat eine Akte** — Saison für Saison
  Verein, Liga, Spiele, Tore, Vorlagen, Notenschnitt, Stärke und Alter, dazu
  jeder Wechsel mit Ablöse, die laufende Saison und der Verlauf der Stärke.
  Ein Klick auf den Namen im Kader, im Markt, in einem Angebot, in der
  Vereinsansicht oder in der Entwicklung zeigt sie. Wer in einer Saison wechselt, dessen Saison steht
  bei dem Verein, bei dem er sie beendet. Gespeichert wird knapp, eine
  Zahlenreihe je Saison; aufgezeichnet wird ab dieser Fassung.
- **AC-18** `fertig` **A-Jugend springt ein** — Hat ein Verein vor einem Spiel
  keine elf einsatzbereiten Spieler oder keinen Torwart, rücken Spieler aus der
  A-Jugend nach. Ein Spiel fällt nie aus, auch nicht für einen Verein ohne
  Geld.

### Neigungen

Was einen Spieler neben Stärke und Talent ausmacht. Die Wirkungen stehen in
einer Tabelle (`NEIGUNGEN` in `server/spiele/manager/neigungen.js`), gemessen
mit `node docs/manager/dynamik/neigungen.cjs` (fünf Saisons, acht Startwerte,
rund 20 Sekunden).

| Achse | + | − | Wirkung bei Neigung 1 (bei −1 umgekehrt) |
| --- | --- | --- | --- |
| entwicklung | Trainingsfleißig | Lebemann | +0,5 Stärke je Saison |
| wechsel | Söldner | Vereinstreu | +6 % Gehaltswunsch beim Verlängern, 2 Punkte mehr Abstand nach unten |
| heim | — | — | Tagesform daheim +3 %, auswärts −3 %, neutral nichts |
| nerven | Profi | — | Streuung der Note −40 % |
| karten | Heißsporn | — | angelegt, wirkt noch nicht |
| moral | Sensibel | — | angelegt, wirkt noch nicht |
| mitspieler | Anführer | — | angelegt, wirkt noch nicht |

- **AC-27** `fertig` **Spieler haben Neigungen** — Jeder Spieler hat auf
  sieben Achsen eine Neigung von −1 bis 1, normalverteilt um null mit
  Streuung 0,35. Sie kommt aus Kennung und Startwert über einen Hash und wird
  nicht gespeichert: kein Feld am Spieler, keine neue Fassung des
  Spielstands, dieselbe Karriere hat dieselben Neigungen. Ohne Startwert ist
  jede null. Daraus der **Charakter**: der Name der stärksten Abweichung ab
  0,5, sonst „Ausgeglichen". Gemessen über 6080 Spieler und acht Startwerte:
  Ausgeglichen 52,2 %, jeder der acht Namen 5,2 bis 6,7 %. „Profi" heißt,
  wer die ruhigsten Nerven hat — er liefert Woche für Woche dieselbe
  Leistung (→ AC-33).
- **AC-28** `fertig` **Neigungen bleiben verdeckt** — Keine Antwort des
  Servers trägt eine Neigung oder einen Wert, der aus einer folgt; den
  Charakter sieht der Manager nur an den eigenen Spielern. Nicht verdeckt:
  der Startwert steht im Zustand, aus ihm ließen sich die Neigungen
  nachrechnen.
- **AC-29** `fertig` **Fleiß verschiebt Entwicklung** — Zwei Spieler, die
  sich nur in der Kennung unterscheiden, entwickeln sich je Saison um 0,5
  Stärke je Einheit Neigung auseinander, verteilt auf Winter und Sommer wie
  die Entwicklung selbst; das Talent bleibt die Grenze nach oben. Gemessen
  in der Welt: 0,51 ± 0,06 Punkte je Jahr und Einheit (15 620 Spielerjahre,
  bis 28, nicht am Talent).
- **AC-30** `fertig` **Gute Noten fördern Entwicklung** — Wer in der Saison
  mindestens fünf Noten hat, legt je Notenstufe besser als 3,5 im Schnitt
  0,6 Stärke zu und verliert je schlechtere ebenso viel, in jedem Alter.
  Darunter zählt die Leistung nicht.
- **AC-31** `fertig` **Heimliebe wirkt daheim** — Die Tagesform eines
  Spielers steigt daheim um 3 % je Einheit Neigung und fällt auswärts um
  ebenso viel; auf neutralem Platz wirkt sie nicht. Die Heimquote der Liga
  verschiebt sich nicht, weil die Neigung um null liegt: gemessen 47,56 %
  Heimsiege mit, 47,71 % ohne (25 680 Spiele). In den Noten ist die Wirkung
  nicht zu sehen (0,009 ± 0,007 Notenstufen je Einheit).
- **AC-32** `fertig` **Söldner fordern mehr** — Beim Verlängern am eigenen
  Verein will ein Spieler 6 % mehr Gehalt je Einheit Neigung (der Söldner
  mehr, der Vereinstreue weniger), und er nimmt 2 Punkte mehr Abstand nach
  unten hin, bevor er einen schwächeren Verein ablehnt. Ein Neuzugang vom
  Markt bekommt, was der Markt zahlt, ohne Neigung.
- **AC-33** `fertig` **Ruhige Nerven, ruhige Noten** — Ruhige Nerven
  machen die Note um 40 % je Einheit Neigung weniger streuend, fahrige
  streuender; am Ergebnis eines Spiels ändert das nichts. In der Welt
  gemessen: −0,063 ± 0,005 Notenstufen Streuung je Einheit (6025 Spieler).
