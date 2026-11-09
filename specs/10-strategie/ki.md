# KI-Spieler

**Bereich:** Strategie
**Kuerzel:** ki
**Stand:** 20/24 fertig · 1 in Arbeit · 3 offen

## Zweck

Ein Computer, der nach denselben Regeln spielt wie ein Mensch. Er hat zwei
Aufgaben: **Gleichgewicht messbar machen** — der Prüfstand lässt KI gegen KI
Hunderte Partien spielen ([Fahrplan](fahrplan.md) AC-4, AC-5, AC-9, AC-18) —
und **allein spielbar machen** (Stufe C).

Die KI muss nicht gut sein, sondern **ehrlich**: Sie sieht nicht mehr, darf
nicht mehr und bekommt keinen Rabatt. Sonst messen die Partien die KI,
nicht die Regeln.

## Abgrenzung

| Gehoert dazu                               | Gehoert nicht dazu |
| ------------------------------------------ | ------------------ |
| Wie die KI entscheidet, was sie darf       | die Regeln selbst → [Bauen](bauen.md), [Einheiten](einheiten-und-befehle.md) |
| Prüfstand: Partien ohne Menschen, Messungen | Siegbedingung → [Spielziel](spielziel.md) |

## Abnahmekriterien

### Ehrlich (Stufe A)

- **AC-1** `fertig` **Befehle wie ein Mensch** — Die KI schickt dieselben Befehle über denselben
  Weg wie der Browser (`befehl`, `bauen`, `ausbilden`). Ein Befehl, der für
  einen Menschen abgewiesen würde, wird auch für sie abgewiesen.
- **AC-2** `fertig` **Gleicher Zufall, gleiche Partie** — Die KI zieht Zufall nur aus dem
  Startwert. Zwei Partien KI gegen KI mit demselben Startwert enden Takt für
  Takt gleich.
- **AC-3** `fertig` **KI kostet wenig** — Eine KI rechnet im Mittel unter 1 ms je Takt und
  entscheidet nicht in jedem Takt neu, sondern alle halbe Sekunde.

### Wirtschaft (Stufe A)

- **AC-4** `fertig` **Baut die Wirtschaft auf** — Bildet ohne Pause Dorfbewohner aus, baut ein
  Haus, bevor die Bevölkerung voll ist, und verteilt Dorfbewohner auf
  Nahrung, Holz und Gold nach einem festen Plan der Dunklen Zeit. Ist das
  Ziel von 22 Dorfbewohnern erreicht, spart sie für die Feudalzeit.
- **AC-5** `fertig` **Lager an die Vorräte** — Baut Holzfällerlager am nächsten Wald,
  Bergbaulager am Gold, Mühle an den Beeren, und Farmen, sobald Schafe und
  Beeren nicht mehr reichen: wenn der Plan mehr Dorfbewohner an der Nahrung
  will, als dort Platz haben (je sechs), spätestens wenn die Schafe
  aufgegessen sind.
- **AC-6** `fertig` **Niemand steht herum** — Kein Dorfbewohner der KI ist länger als 20 Sekunden
  untätig, außer alle Vorräte in Reichweite sind leer.

### Prüfstand (Stufe A)

- **AC-7** `fertig` **Partien ohne Browser** — `npm run pruefstand:strategie -- --partien 20`
  spielt KI gegen KI ohne Server und Browser, so schnell die Maschine kann,
  und schreibt je Partie Startwert, Dauer und Kennzahlen je Spieler.
- **AC-8** `fertig` **Jeder Takt wird geprüft** — Der Prüfstand bricht mit Startwert und Takt ab,
  wenn ein Vorrat negativ wird, die Bevölkerung die Grenze übersteigt, eine
  Einheit in einem Hindernis steht oder zwei Gebäude sich überlappen
  (→ [Fahrplan](fahrplan.md) AC-4).

### Feudalzeit (Stufe B)

- **AC-9** `fertig` **Die KI steigt auf** — Sobald 500 Nahrung und zwei Gebäude der Dunklen
  Zeit da sind, beginnt sie den Aufstieg, baut danach Schießanlage oder Stall
  und bildet Kampfeinheiten aus. Im Prüfstand erreicht sie die Feudalzeit über
  zwanzig Startwerte nach 11 bis 16 Spielminuten.
- **AC-10** `fertig` **Auch spät steht niemand herum** — Auch nach zwanzig
  Spielminuten steht kein Dorfbewohner länger als 20 Sekunden still,
  gemessen über zwanzig Startwerte bis Minute 30 (AC-6 misst dasselbe nach
  zehn Minuten). Gemessen in Runde 91: höchstens 12,9 s. Zwei Ursachen lagen
  darunter: Untätige wurden immer wieder an Beeren geschickt, zu denen kein
  Weg führte (bis 655 s; behoben in Runde 90, AC-12), und Holzfäller mit
  voller Ladung fanden keinen Weg zum nächsten Rand ihres Lagers — die KI
  hatte es in eine Waldlücke gestellt. Jetzt sucht der Weg zum Lager andere
  Randfelder und die anderen Lager.

### Kampf und Partieende (Stufe C)

- **AC-11** `fertig` **Die KI greift an** — Sobald **zehn** Kampfeinheiten
  bereitstehen, schickt sie **acht** davon zum nächsten Gegner: unterwegs
  greifen sie an, was ihnen in Sichtweite kommt (Angriffslauf,
  [Kampf](kampf.md) AC-8), am Ziel jeder, was ihm am nächsten steht (seit Runde
  95, AC-16; bis dahin das Dorfzentrum). Die **zwei**, die dem
  eigenen Dorf am nächsten stehen, bleiben als Wache zu Hause. Acht, weil zehn
  Speerkämpfer im Gefechtsstand gegen sieben Reiter gewinnen
  ([Fahrplan](fahrplan.md) AC-9) — ein kleineres Heer verliert gegen jede
  Wache. Im Prüfstand greift über zwanzig Startwerte in jeder Partie
  mindestens eine KI an, und wer nicht angreift, verteidigt (AC-14): wer
  selbst unter Angriff steht, kommt mitunter nie auf zehn Kampfeinheiten.
- **AC-12** `fertig` **Nachschub statt alles auf einmal** — Ist das Heer
  gefallen, bildet sie weiter aus und greift wieder an — außer sie wird gerade
  überrannt: wer nicht angreift, verteidigt (wie AC-11). Die Wirtschaft läuft
  dabei weiter: **fehlen ihr Dorfbewohner und hat sie Nahrung für einen und
  Platz im Haus, steht ihr Dorfzentrum keine Sekunde still** — gemessen in
  jedem Takt, über zwanzig Startwerte bis Minute 30; und in jeder Partie hält
  bei Minute 30 mindestens eine KI ihre 20 Dorfbewohner. Bis Runde 94 hieß die
  Klausel „bei Minute 30 mindestens 20 Dorfbewohner"; seit Partien um Minute
  35 bis 45 entschieden werden (AC-16, AC-17), maß das den Kriegsverlauf — 14
  von 40 KIs lagen darunter, fast alle Verlierer. Gemessen in Runde 95: das
  Dorfzentrum stand höchstens 0,5 s still (eine Entscheidung, AC-3); 1 bis 11
  Angriffe je KI. Dafür fünf Regeln: nach dem Aufstieg geht alle zehn
  Sekunden ein Sammler zu dem Rohstoff, der fehlt (unter 300), von dem, der
  mindestens 300 mehr hat; sind alle Militärgebäude beschäftigt und ist Holz
  übrig, kommt ein weiteres dazu, höchstens drei; fehlt Nahrung und ist keine
  Farm frei, kommt eine Farm dazu; fehlen Dorfbewohner, gibt das Militär
  Nahrung nur aus, wenn danach noch einer bezahlt ist; und ein Vorrat, zu dem
  kein Weg führt, wird zwei Minuten lang nicht wieder vorgeschlagen. Ohne das
  endet jede Partie damit, dass beide Seiten einander zusehen.
- **AC-13** `offen` **KI sieht nur ihr Sichtfeld** — Mit dem Nebel (C6)
  kennt sie ein fremdes Gebäude erst, wenn eine ihrer Einheiten es gesehen
  hat, und behält es, bis sie hinsieht und es fehlt (wie kampf AC-12); fremde
  Einheiten nur, solange sie sie sieht. Ziel, Überlegenheit (AC-18) und freie
  Felder rechnet sie nur daraus. Kennt sie keinen Gegner, reitet ihr
  Späherreiter den Ring der Startplätze ab — dass dort die Dörfer liegen,
  weiß jeder, der die Karte kennt, wo genau nicht —, ohne anzuhalten, und
  kehrt heim, sobald sie alle kennt; ohne Späher erkundet das Heer. Gemessen
  in Runde 112: alle 40 KIs auf zwanzig Startwerten finden ihren Gegner nach
  1,9 bis 2,4 Minuten. Dass sie dafür dieselbe Nachricht liest wie ein
  Browser, ist AC-20. **Stand Runde 112:** gebaut und belegt auf dem
  lokalen Zweig `strategie-ki-sicht`, aber nicht gruen — KI gegen KI dauert
  länger, 34 von 40 Partien enden vor Minute 60 statt 39 (fahrplan AC-11).
  **Bedingung:** fahrplan AC-11 hält. **Stand Runde 114:** zwei Fehler
  behoben (Suche, Überlegenheit ohne frischen Blick), 35 von 40 vor Minute
  60; Frage an den Benutzer (Erkenntnisse).
- **AC-14** `fertig` **Die KI verteidigt zu Hause** — Verliert eines ihrer
  Gebäude oder einer ihrer Dorfbewohner Leben, zieht die Wache im Angriffslauf
  zum Angriffsort, und der getroffene Dorfbewohner lässt die Arbeit liegen und
  läuft zum Dorfzentrum, statt stehenzubleiben und zurückzuschlagen
  ([Kampf](kampf.md) AC-2 gäbe ihm die Gegenwehr; mit Angriff 3 und ohne
  Rüstung ist sie nach [Kampf](kampf.md) AC-5 ein toter Dorfbewohner und kein
  gewonnener Kampf). Was ihr Heer unterwegs einsteckt, zählt nicht — sonst
  holte ein Scharmützel am anderen Ende der Karte die Wache vom Dorf weg. Die
  KI bekommt dafür keine Meldung: sie sieht nur, dass Leben fehlt. Ohne das
  ist eine Partie gegen die KI ein Spaziergang.
- **AC-15** `fertig` **Liegengebliebenes wird weitergebaut** — Eine eigene
  Baustelle, an der niemand mehr baut — ihr Bauer ist gefallen oder geflohen
  (AC-14) —, bekommt einen Bauer zurück, eine je Entscheidung. Gefunden in
  Runde 94 bei der Frage, warum Partien unentschieden enden: eine
  Hausbaustelle aus der Frühphase lag liegen, und weil die KI kein zweites
  Haus beginnt, solange eines im Bau ist, blieb ihre Bevölkerung beim
  Startwert 13 ab Minute 55 bei 40 von 40 — das Heer bei 18, neben 4000
  Nahrung. Danach: 23 Häuser und 112 Einwohner bei Minute 70; über zwanzig
  Partien bis Minute 90 enden 19 statt 17 mit einem Sieger, im Median nach 66
  statt 71 Minuten. Übersprungen wird eine Baustelle, an der Feinde stehen
  (ein Ersatz liefe hinein), und eine, zu der kein Weg führt — zwei Minuten
  lang, wie ein unerreichbarer Vorrat (AC-12). Gebaut wird von dem unter den
  drei Nächsten, der einen Rand erreicht, auch mit Ladung; und wer mit voller
  Ladung festsitzt und an einer eigenen Baustelle steht, baut mit (Startwert
  18: eine Mühle im Bau schloss einen Beerensammler in eine Tasche aus zwei
  Feldern ein).
- **AC-16** `fertig` **Jeder nimmt sein nächstes Ziel** — Steht ein Teil des
  Heeres am Marschziel ohne Auftrag, greift jeder an, was **ihm** am nächsten
  steht — eine Einheit des Gegners vor einem Gebäude, solange sie höchstens
  sechs Felder weiter weg ist —, statt dass alle auf ein gemeinsames Ziel
  gehen. Vor einem Gebäude schießen nur die in Reichweite; bei Minute 60
  standen in zwölf von zwanzig Partien 56 bis 98 Kampfeinheiten neben 7 bis
  28 Gebäuden eines Verlierers ohne Heer (Runde 95). Allein: 10 statt 5 von
  20 Partien enden vor Minute 60.
- **AC-17** `fertig` **Nahkämpfer aus der Kaserne** — Auch die Kaserne bildet
  aus, und als zweites Militärgebäude baut die KI eine Kaserne. Fernkämpfer
  nehmen einem Gebäude einen Punkt je Schuss (Fernrüstung 7), eine Miliz vier
  je Schlag. Allein brachte das nichts (Runde 92: mehr Entscheidungen, aber
  mehr Remis); mit AC-16 enden 18 von 20 Partien vor Minute 60, alle 20 mit
  einem Sieger, im Median nach 42 Minuten (Runde 95).
- **AC-18** `fertig` **Überlegen zieht alles los** — Hat die KI mindestens
  ein Heer (8) und dreimal so viele Kampfeinheiten wie ihr nächster Gegner,
  wartet sie nicht auf zehn daheim: es zieht los, wer da ist, bis auf die
  zwei an der Basis — aber nie einer allein, mindestens zwei. Im
  Gleichgewicht gilt weiter AC-11. Vorher stand beim Startwert 4 der Sieger
  ab Minute 48 vor einem Dorf ohne Heer und schickte je acht, während daheim
  bis zu 85 warteten. Über zwanzig Startwerte enden jetzt alle 20 Partien mit
  einem Sieger, 19 vor Minute 60 (vorher 18), die längste nach 62 statt 78
  Minuten, im Median nach 38 statt 42 (Runde 96). Jeder Aufbruch zählt als
  Angriff, auch einer zu zweit. Gezählt wird, was auf der Karte steht — bis zum Nebel
  (AC-13) sieht die KI alles, wie der Mensch. **Gemessen und verworfen:**
  überlegen nur noch auszubilden, was Gebäuden schadet (Nahkämpfer statt
  Fernkämpfer), machte es schlechter — 16 von 20 vor Minute 60, Median 47
  Minuten —, weil die Überlegenheit auch mitten im Patt kurz eintritt und die
  KI dann die falschen Einheiten baut.
- **AC-19** `fertig` **Aussichtslos gibt sie auf** — Kann die KI nie wieder
  etwas tun — keine Einheit lebt, in keiner Schlange steht etwas (auch kein
  bezahlter Aufstieg), und
  kein fertiges Gebäude kann eine ausbilden, die jetzt bezahlt wäre —, gibt
  sie auf ([Spielziel](spielziel.md) AC-6), wie der Computergegner im
  Original. Eine Einschätzung „wird wohl verlieren" ist das bewusst nicht:
  wer noch einen Dorfbewohner hat oder 50 Nahrung neben dem Dorfzentrum,
  spielt weiter. Beim Startwert 5 stand die KI ab Minute 53,5 mit 28 Nahrung
  und ohne Einheit da, der Sieger schliff ihre Gebäude bis Minute 62 (Runde
  97). Damit enden alle zwanzig Partien vor Minute 60 (fahrplan AC-11). Seit
  Runde 100 (einheiten AC-31) enden sie auch ohne Aufgeben vor Minute 60;
  das Aufgeben verkürzt jede um 0,4 bis 10 Minuten.
  **Gemessen und verworfen:** stattdessen gegen einen Gegner ohne
  Kampfeinheit nur Nahkämpfer auszubilden — die längste Partie endete nach
  61,9 statt 62,0 Minuten, weil das Heer beim Schleifen schon steht.
- **AC-20** `offen` **KI liest die Zustandsnachricht** — Sie entscheidet aus
  derselben Nachricht, die ein Browser bekommt (kampf AC-13), nicht aus der
  Welt. Erst dann ist AC-13 bewiesen statt befolgt: heute fragt sie die Welt
  und hält sich an die Sicht, und ein neuer Zugriff auf fremde Einheiten
  fiele keinem Test auf. Abgeteilt in Runde 112 — die KI liest an rund
  dreißig Stellen aus der Welt, auch Karte und Wegsuche.

### Stufe D — Ritterzeit

- **AC-21** `fertig` **KI steigt zur Ritterzeit auf** — Sobald sie 800
  Nahrung und 200 Gold hat und zwei Gebäude der Feudalzeit stehen, bestellt
  sie den Aufstieg; fehlt das zweite, baut sie eine Schmiede. Gespart wird
  ab dem ersten Angriff: das Militär gibt nur aus, was über dem Preis liegt,
  und die Umverteilung hält das Zurückgelegte nicht für Überfluss. Im
  Prüfstand über zwanzig Startwerte steigt jede KI vor Spielminute 30 auf,
  die ab Minute 18 nie unter zwölf Dorfbewohner fällt (Vorlage: 16 bis 20
  Minuten im guten Spiel). Abweichung: „jede“ galt für alle; wer überrannt
  wird, steckt jede Nahrung in den Ersatz (AC-12) — gemessen fielen die fünf
  ohne Aufstieg auf 0 bis 10 Dorfbewohner, und vor dem ersten Angriff zu
  sparen schöbe ihn hinter Minute 22 (AC-11). Gemessen 22,1 bis 27,2
  Minuten, 35 von 40 (Runde 137).
- **AC-22** `fertig` **Die KI bildet Ritter aus** — In der Ritterzeit bildet
  jedes Gebäude zuerst die Einheit des neuesten Zeitalters aus, die bezahlt
  ist: im Stall den Ritter, in der Kaserne den Speerkämpfer. KI gegen KI
  endet weiter (fahrplan AC-11). Geteilt in Runde 137: der Aufstieg allein
  kostete und brachte nichts, Startwert 11 dauerte 71 Minuten.
- **AC-23** `offen` **Rammen gegen Befestigung** — Die KI baut in der
  Ritterzeit eine Belagerungswerkstatt; steht beim Gegner ein Turm oder eine
  Burg, nimmt ihr Angriff Rammen mit. KI gegen KI endet weiter (fahrplan
  AC-11).
- **AC-24** `in-arbeit` **Das Dorf wächst weiter** — Nach jedem Aufstieg bildet
  das Dorfzentrum weiter Dorfbewohner aus: bis 32 in der Feudalzeit, 42 in
  der Ritterzeit, 50 in der Imperialzeit (`DORFBEWOHNER_JE_ZEITALTER` in
  `ki.js`). Bis Runde 142 blieb es in jedem Zeitalter bei 22, und ab dem
  Mittelspiel standen beide KIs mit leeren Vorräten im Patt (Startwert 24:
  74 Minuten). Vorgabe des Benutzers für die schwere KI: 40 bis 50 im
  letzten Zeitalter; mittel (25) und leicht (15) folgen als eigene Reihen.
  Die Zahlen der Feudal- und Ritterzeit liegen zwischen 22 und 50, wie im
  Original ein gutes Spiel wächst; sie sind Werte, kein Gesetz.

## Grenzfaelle

- Der Aufstieg wird erst bestellt, wenn das Dorfzentrum frei ist: hinter einer
  Schlange stünde er still, während die 500 Nahrung schon bezahlt sind.
- Solange das Militärgebäude fehlt, hält die KI 175 Holz dafür zurück und baut
  keine weitere Farm. Ohne diese Regel stand beim Startwert 15 am Ende 640 Gold
  neben 150 Holz — für die Schießanlage reichte es nie (Runde 69).
- Welche Einheit ein Militärgebäude ausbildet, liest die KI aus seinen Daten:
  die erste, die ihr Zeitalter erreicht hat und bezahlt ist. Eine neue Einheit
  einer späteren Stufe bildet sie damit ohne Änderung am Code aus.
- Ab Stufe C sieht die KI nur, was ihre Einheiten sehen (Nebel). Bis dahin
  sieht sie die ganze Karte — wie jeder Mensch auch.
- Das **Marschziel der Wache hält Abstand von jedem Feind**. Der Server liest
  den Angriff aus dem Feld unter dem Klick und zieht einen Feind im Umkreis
  von einem Feld mit hinein ([Kampf](kampf.md) AC-1) — lag das Ziel neben dem
  Angreifer, wurde aus dem Angriffslauf ein Angriff auf genau ihn, und fiel er
  unterwegs, blieb die Wache auf halbem Weg stehen (Runde 86).
- Bleibt eine KI-Partie hängen (niemand gewinnt, nichts passiert), endet sie
  nach 90 Spielminuten als „unentschieden" und wird im Prüfstand gezählt.
