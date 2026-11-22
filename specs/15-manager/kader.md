# Kader und Spieler

**Bereich:** Manager
**Kuerzel:** kader
**Stand:** 21/26 fertig · 1 in QA · 4 offen

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
  Startgeneration und kein Aussterben danach.
- **AC-24** `offen` **Durchschnittsalter bleibt im Band** — Über zwanzig
  Saisons ohne Menschen sind die Spieler der Vereine ab der zweiten Saison im
  Mittel 23 bis 25 Jahre alt, in jeder Saison, gezählt am letzten Termin vor
  dem Altern. Bis 2026-11-22 stand hier 25,5 bis 27: je Saison kommen rund
  72 Siebzehnjährige aus der Jugend in die Kader, rund 40 % der Spieler sind
  20 oder jünger, und keine gemessene Variante kam über 25,1, ohne dass das
  Niveau der Ligen fiel (`docs/manager/dynamik/plan.md`). Die erste Saison
  zählt nicht: die Startwelt ist 18 bis 33 Jahre alt, im Mittel 25,5 bis 26.
  Auf Schritt 2 (`7d9f9ff`) reißt es an allen vier Startwerten unten: ab der
  sechsten Saison 22,7 bis 23,3.
- **AC-25** `offen` **Die Jugend kommt an** — Über zwanzig Saisons ohne
  Menschen liegt ab der zweiten Saison die Stärke der Siebzehnjährigen aus
  dem eigenen Nachwuchs im Mittel höchstens 15 unter dem Niveau ihres
  Vereins, und die Zwanzigjährigen in Vereinen stehen im Mittel mindestens
  30 % der Pflichtspielminuten auf dem Platz — gezählt am letzten Termin,
  wo es mindestens 30 Zwanzigjährige gibt. Auf Schritt 2 reißt der Abstand
  in jeder Saison (−21,5 bis −23,8); die Spielzeit mit 20 hält (39 bis 78 %).
- **AC-26** `offen` **Wer spielt, entwickelt sich** — Über zwanzig Saisons
  ohne Menschen wird je Saison, wer 25 bis 30 ist und ein Jahr später noch
  in einem Verein steht, nach seinem Spielanteil gedrittelt: das Drittel mit
  der meisten Spielzeit legt bis zum nächsten Saisonende im Mittel
  mindestens einen Punkt Stärke mehr zu als das mit der wenigsten. Auf
  Schritt 2 reißt es in jeder Saison (−0,6 bis +0,5): die Spielzeit wirkt
  heute nur bis 24.
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
