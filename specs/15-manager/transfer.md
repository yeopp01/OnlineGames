# Transfermarkt

**Bereich:** Manager
**Kuerzel:** transfer
**Stand:** 29/31 fertig · 1 in QA · 1 zurueckgestellt

## Zweck

Einen Kader verändern, statt ihn zu verwalten. Ein Angebot, eine Antwort —
und die anderen Vereine handeln nach denselben Regeln, auch untereinander.

## Abgrenzung

| Gehört dazu                                    | Gehört nicht dazu                              |
| ---------------------------------------------- | ---------------------------------------------- |
| Marktwert, Forderung, Kauf, Verkauf, Fenster   | Berater, Vertragspoker, Handgeld               |
| Angebote der anderen, Handel untereinander     | Leihgeschäfte, Ausstiegsklauseln               |
| Transferliste, Freistellen                     | Verträge selbst → [Verträge](vertraege.md)     |

## Abnahmekriterien

### Was ein Spieler wert ist

- **AC-1** `fertig` **Marktwert wächst steiler als Stärke** — Ein
  Spitzenspieler ist nicht doppelt so viel wert wie ein guter, sondern ein
  Vielfaches.
- **AC-2** `fertig` **Alter drückt den Wert** — Ein 33-Jähriger kostet einen
  Bruchteil dessen, was derselbe Spieler mit 25 gekostet hätte.
- **AC-3** `fertig` **Ungenutztes Talent hebt ihn** — Wer sein Talent noch
  nicht erreicht hat, ist teurer als einer, der es ausgeschöpft hat.
- **AC-26** `fertig` **Gehalt ein Fünftel des Werts** — Wer 24 bis 28 Jahre
  alt ist, verdient im Jahr 15 bis 25 % seines Marktwerts, gemittelt über
  alle in Vereinen, am letzten Termin jeder von zwanzig Saisons ohne
  Menschen. Eine Ablöse wiegt damit vier bis sechs Jahresgehälter. Gezählt
  wird das Vertragsgehalt — was der Verein zahlt —, nicht der Gehaltswunsch
  (→ [Verträge](vertraege.md) AC-2). Seit Schritt 3 (Marktwert ×2,3) an
  den Startwerten 20260910, 4711, 77 und 1234 in jeder Saison 18 bis 21 %;
  auf Schritt 2 waren es in Saison 1 44 %.
- **AC-27** `fertig` **Kein Geburtstag als Klippe** — Bei gleicher Stärke und
  gleichem Talent kostet ein Jahr mehr höchstens 15 % des Marktwerts, für
  jedes Alter von 17 bis 36 und die Stärken 45, 60, 75 und 90. Wer 28 wird,
  verliert nicht über Nacht ein Drittel. Auf Schritt 2 riss es an drei
  Geburtstagen: 23 auf 24 −15 %, 28 auf 29 −35 %, 31 auf 32 −54 %. Seit
  Schritt 3 (Altersfaktor linear zwischen Stützpunkten) höchstens 14,7 %
  (34 auf 35), 28 auf 29 −11,8 %; ab 35 bleibt der Faktor stehen.
- **AC-4** `fertig` **Forderung über dem Marktwert** — Ein Verein verkauft
  nicht gern, und einen Stammspieler noch weniger gern als den vierten Torwart.
  Billiger wird es nur auf der Transferliste und im letzten Vertragsjahr.

### Kaufen

- **AC-5** `fertig` **Absage nennt den Preis** — Die Absage nennt die
  Forderung, statt den Manager raten zu lassen.
- **AC-6** `fertig` **Gebot nur bis zum Kontostand** — Geprüft wird auf dem
  Server; mit leerem Konto unterschreibt auch kein Vereinsloser.
- **AC-7** `fertig` **Der Kader hat eine Obergrenze** — Bei 26 Spielern ist
  Schluss.
- **AC-8** `fertig` **Letzter Torwart bleibt** — Unter dem Mindestbestand je
  Position steht niemand zum Verkauf; solche Spieler tauchen erst gar nicht in
  der Liste auf.
- **AC-9** `fertig` **Vereinslose kosten keine Ablöse** — Nur Gehalt. Sie sind
  der Ausweg für einen dünnen Kader mit wenig Geld.
- **AC-10** `fertig` **Wechsel verschiebt Geld und Spieler** — Beim Verkäufer
  steigt das Konto um genau das, was beim Käufer abgeht.
- **AC-15** `fertig` **Transferfenster** — Spieler anderer Vereine wechseln nur
  von der Vorbereitung bis zum 3. Spieltag und von der Winterpause bis zum 18.
  Spieltag. Vereinslose gehen immer.
- **AC-19** `fertig` **Nicht jeder will kommen** — Wer deutlich besser ist als
  der Verein, geht nicht in die zweite Liga und nicht zu einem Verein ohne
  Ruf. Die Absage sagt es.
- **AC-21** `fertig` **Ein Spieler bleibt derselbe** — Er behält seine Nummer,
  seine Werte und seine Statistik über jeden Wechsel; neu sind nur Verein und
  Vertrag.
- **AC-22** `fertig` **Der Markt lässt sich filtern** — Nach Position, Liga
  oder vereinslos, Höchstalter, Mindeststärke und Höchstpreis, sortiert nach
  Stärke, Preis, Alter oder Talent.

### Verkaufen

- **AC-11** `fertig` **Andere Vereine bieten selbst** — Während das Fenster
  offen ist, können nach jedem Termin Angebote auf eigene Spieler eintreffen.
  Sie stehen im Postfach und gelten zwei Termine.
- **AC-12** `fertig` **Gebote nur auf Verstärkungen** — Ein Verein bietet auf
  niemanden, der schlechter ist als seine Stammelf auf der Position — außer auf
  einen, der auf der Transferliste steht.
- **AC-13** `fertig` **Mindestbestand gilt auch für dich** — Ein Angebot auf
  den letzten Torwart wird abgelehnt, nicht ausgeführt.
- **AC-14** `fertig` **Verkauf räumt die Aufstellung** — Sie wird verworfen,
  statt mit einer Lücke zu spielen.
- **AC-20** `fertig` **Transferliste** — Wer einen Spieler auf die Liste setzt,
  bekommt öfter Angebote für ihn, auch von Vereinen, die ihn sonst nicht
  wollten — für weniger Geld.
- **AC-23** `fertig` **Freistellen kostet Abfindung** — Ein Spieler lässt sich
  jederzeit freistellen; er geht zu den Vereinslosen, und die Hälfte seiner
  restlichen Gehälter wird fällig.
- **AC-31** `fertig` **Auch ohne Liste kommen Angebote** — Wer einen Verein
  nur verwaltet — Verträge verlängert, niemanden auf die Liste setzt, kein
  Angebot annimmt —, bekommt über die ersten zehn Saisons im Mittel
  mindestens zwei Angebote je Saison in der ersten Liga (an ihrem besten
  Verein und in ihrer Mitte) und mindestens eines in der Mitte der zweiten,
  an jedem der acht Startwerte 4711, 20260910, 77, 1234, 5, 99, 31337 und
  2026. Gezählt wird jedes neue Angebot im Postfach. Bis Schritt 6 des
  Plans bekam derselbe Mensch im kleinsten Fall 2,4 / 2,1 / 1,5, danach
  0,6 / 0,2 / 0,0: seitdem prüft ein Gebot die Gehaltsgrenze, und die
  Vereine stehen im Median knapp über ihr. Die Grenze bleibt; gezogen wird
  öfter — auf einen Spieler, der nicht auf der Liste steht, mit 0,8 statt
  0,06 je Verein und Termin (`ANGEBOTE.sonst`), auf einen der Liste
  unverändert mit 0,14 (→ AC-20, AC-28) —, und wessen Angebot noch gilt,
  bietet nicht neu (→ AC-11). Gemessen im kleinsten Fall 6,5 / 3,0 / 1,3,
  im Mittel 9,8 / 7,3 / 1,7; es sind meist dieselben ein, zwei Spieler, um
  die mehrere Vereine werben (0,9 / 1,0 / 0,3 verschiedene je Saison).
  Ab der elften Saison wird es in der zweiten Liga weniger (über zwanzig
  Saisons im Mittel 0,9), weil der Kader eines Verwalters, der nie kauft,
  schwächer wird. Die Grenzen sind gesetzt, kein Wert aus Anstoss 3.
  Ein Verein bietet je Transferfenster höchstens einmal auf denselben
  Spieler — abgelehnt oder abgelaufen zählt mit (`geboten` am Manager,
  mit dem Fenster vergessen). Eine Obergrenze (höchstens fünf je Saison in
  der ersten Liga) steht nicht: sie hält mit der Untergrenze der zweiten
  Liga nicht zugleich, denn dort kommt das eine Angebot je Saison meist
  von mehreren Vereinen auf denselben Spieler (→ Plan, „Angebote an den
  Menschen“).

### Die anderen

- **AC-16** `fertig` **Die anderen handeln untereinander** — Im Fenster und im
  Sommer stopfen die Vereine des Servers Löcher im Kader und holen
  Verstärkungen, von Vereinslosen und voneinander. Wer über 23 Spieler wächst,
  gibt den Schwächsten ab.
- **AC-24** `fertig` **Wer im Minus steht, verkauft** — Ein Verein des Servers
  mit negativem Konto setzt seine zwei teuersten Spieler auf die
  Transferliste.
- **AC-25** `fertig` **Der Ticker zeigt jeden Wechsel** — Wer von wem zu wem
  für wie viel, auch zwischen den anderen Vereinen.
- **AC-28** `fertig` **Handel mit Vereinslosen lohnt nicht** — Wer
  Vereinslose ablösefrei holt, auf die Transferliste setzt und an die
  anderen Vereine verkauft, verdient daran über zwölf Saisons im Mittel
  höchstens ein Zehntel dessen, was sein Verein im Spielbetrieb einnimmt
  (alle Einnahmen ohne Ablösen), in der Mitte der ersten wie der zweiten
  Liga, gemittelt über die Startwerte 4711, 77 und 1234. Gerechnet gegen
  den Händler: Erlös minus die Gehälter der Ware, ohne das Handgeld. Bis
  Schritt 6 des Plans brachte das 127 % (erste Liga) und 210 % (zweite) der
  Einnahmen, über zwanzig Saisons 16 bis 23 Mio je Saison. Seitdem bietet
  ein Verein nicht auf einen Spieler, wenn ein Vereinsloser derselben
  Position zu haben ist, der höchstens drei Punkte schwächer ist und in
  seine Gehaltsgrenze passt (`MARKT.freiNaeher`), und wer satt ist, kauft
  nicht mehr bei Vereinen, die ihre Spieler abgeben müssen, sondern holt
  selbst (→ AC-30). Gemessen 5 % und −19 %; über zwanzig Saisons 0,4 Mio
  (erste Liga Mitte), 0,1 Mio (erste Liga, bester Verein) und −2,0 Mio
  (zweite Liga Mitte) je Saison. Die Grenze ist gesetzt, kein Wert aus
  Anstoss 3.
- **AC-29** `fertig` **Der Markt bleibt in Bewegung** — In der ersten
  Liga wechseln über zwanzig Saisons ohne Menschen ab der zweiten Saison
  je Verein mindestens 1,5 Spieler in jeder Saison, Vereinslose
  mitgezählt. Gezählt wird aus den Akten der Spieler (`laufbahn.wechsel`). Bis
  Schritt 6 waren es im Mittel 1,95, in schwachen Saisons 0,4 bis 1,2: die
  Gehaltsgrenze sperrte jede Verstärkung, solange der Schwächste noch im
  Kader stand. Seitdem zählt sein Gehalt bei einer Verstärkung als frei,
  und steht der Verein danach über der Grenze, wird er gegen Abfindung
  freigestellt (→ AC-16, AC-23); wer mehr als eine Jahreseinnahme auf dem
  Konto hat, sucht in jedem Fenster (`MARKT.reichAb`). Gemessen an acht
  Startwerten im Mittel 2,9 bis 4,0 je Saison, die schwächste 2,0 (vor
  Schritt 3 waren es 3,7). Die zweite Liga kommt nicht zurück: 0,77 statt
  0,65, vor Schritt 3 1,36 — dort ist das Geld knapp, die meisten Zugänge
  sind Vereinslose. Die Grenze ist gesetzt, kein Wert aus Anstoss 3.
- **AC-30** `in-qa` **Wer satt ist, verkauft nicht** — Ein Verein des
  Servers mit mehr als dem Dreifachen seiner erwarteten Jahreseinnahmen auf
  dem Konto (`MARKT.sattAb`) gibt niemanden ab, der nicht auf seiner
  Transferliste steht — dem Menschen nicht und den anderen Vereinen nicht.
  Die Absage nennt den Verein und den Spieler. Wer viel hat, muss nicht
  verkaufen; das schließt die Quelle, aus der die reichsten Vereine
  horteten (→ [Finanzen](finanzen.md) AC-19). Ein Verein des Servers setzt
  nur im Minus Spieler auf die Liste (AC-24), ein satter also nie. Gesetzt,
  kein Wert aus Anstoss 3. `in-qa`, bis die Oberfläche es zeigt: in der
  Marktliste fehlt ein Zeichen „verkauft nicht“, die Absage selbst steht
  wie jede andere.

### Bewusst nicht

- **AC-17** `zurueckgestellt` (ein Angebot, eine Antwort — der Spieler nennt sein Gehalt, Verträge AC-2) **Gehaltsverhandlung** —
  Gebot und Gegengebot über mehrere Runden.
- **AC-18** `fertig` **Auslaufende Verträge** — Ein Vertrag, der ausläuft,
  macht den Spieler billiger und am Saisonende frei
  (→ [Verträge](vertraege.md) AC-6).
