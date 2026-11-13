# KI-Spieler

**Bereich:** Strategie
**Kuerzel:** ki
**Stand:** 30/35 fertig · 5 offen

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
  Randfelder und die anderen Lager. **Die KI mauert niemanden ein**
  (2026-11-12): ein Bauplatz, der ein Stück begehbares Land von weniger als
  40 Feldern abschneidet, wird verworfen (`ki.sperrtEin`). Beim Startwert 12
  schloss eine Mühle zwei Holzfäller in eine Lücke am Waldrand ein, 346 s
  bis zum Ende; dieselbe Lücke schloss vorher ein Holzfällerlager, an dem
  sie neben sich abliefern konnten — deshalb fiel es nie auf.

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
- **AC-13** `fertig` **KI sieht nur ihr Sichtfeld** — Mit dem Nebel (C6)
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
  60; Frage an den Benutzer (Erkenntnisse). **Stand Runde 144:** auf dem
  Boden der wachsenden Wirtschaft (AC-24) 36 von 40 (ohne eigene Sicht 40);
  Zweig `strategie-ki-sicht` (`d0314d4`), Frage erneuert. **Fertig in Runde
  165:** der Zweig zusammengeführt (Benutzer, 2026-11-10: die Ersatzgrenze im
  Nebel, fahrplan AC-11). Gegner ist, wen `welt.feindlich` nennt — ein
  Verbündeter wird weder gemerkt noch gesucht; was sie sieht, ist die Sicht
  ihres Teams. Auch der Platz des zweiten Markts (AC-26) richtet sich nach
  dem Ort, an dem sie den Gegner zuletzt sah, nicht nach seinem Startplatz.
  KI gegen KI über 40 Startwerte: alle mit Sieger, 37 vor Minute 60, Median
  44,6 Minuten (ohne eigene Sicht 40, Median 41,9 und 38,3). Eine Partie
  rechnet rund ein Viertel länger (173 statt 136 ms je 1000 Takte).
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
  **Seit 2026-11-13 zählt, wer nur handelt, nicht als Einheit:** ein
  Marktkarren sammelt nicht, baut nicht und schlägt nicht. Er bringt Gold —
  das gilt deshalb als vorhanden, solange einer lebt; fehlt für jede
  Einheit auch Holz oder Nahrung, gibt sie auf. Beim Startwert 8 (ohne
  Häuser) hatte die Verliererin ab Minute 84 weder Dorfbewohner noch
  Dorfzentrum, drei Karren fuhren weiter, und die Partie lief über Minute
  90 hinaus; jetzt endet sie in Minute 83.

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
  die ab Minute 18 nie unter drei Viertel ihres Ziels der Feudalzeit fällt
  (AC-24: 24 von 32; in Runde 143 die Hälfte, seit der KI im Nebel, AC-13,
  drei Viertel — im Nebel fallen Verlierer auf 14 bis 20 statt 0 bis 13,
  Runde 165) (Vorlage: 16 bis 20
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
- **AC-23** `fertig` **Rammen gegen Befestigung** — Die KI baut in der
  Ritterzeit eine Belagerungswerkstatt; steht beim Gegner ein Turm oder eine
  Burg, nimmt ihr Angriff Rammen mit. KI gegen KI endet weiter (fahrplan
  AC-11). **Gebaut am 2026-11-13**, zusammen mit AC-33 — ohne Rammen
  verheizte die KI unter einer Burg vierzig bis 63 kleine Wellen und hatte
  nie Gold für eine Ramme (Startwert 4). Werkstatt und Ramme liest sie aus
  den Daten (das Gebäude, das ausbildet, was `nurGebaeude` trägt). Nach dem
  ersten Aufbruch baut sie die Werkstatt und hält **drei Rammen**; eine
  Ramme ist keine Kampfeinheit, sie zählt nicht zum Heer und steht nicht
  Wache. Hat der nächste Gegner ein Gebäude, das schießt, und sie hat es
  gesehen: sie bricht mit **zehn statt acht** auf, **nicht ohne drei Rammen**
  (höchstens 240 Sekunden gewartet), und solange das Heer darauf wartet,
  ruht die Ausbildung — was die Werkstatt oder die nächste Ramme kostet,
  liegt zurück. Die Rammen gehen voraus zu einem Sammelplatz 16 Felder vor
  dem Marschziel, das Heer folgt, wenn es sie einholt; hinein gehen sie
  erst mit dem Heer, zuerst auf das, was schießt, und ohne Heer draußen
  kehren sie heim. Fehlt das Gold in Reichweite, geht der Handel vor (vier
  Karren, AC-26). **Messbar:** in gebauten Lagen jede dieser Regeln mit
  Gegenprobe (`tests/strategie-ki-belagerung.test.mjs`); über vierzig
  Startwerte im Nebel hält mindestens jede dritte KI Rammen, keine vor
  ihrem ersten Aufbruch, und fahrplan AC-11, AC-24 und ki AC-27 halten.
  **Gemessen:** 155 Rammen bei 39 von 80 KIs; 40 von 40 mit Sieger, 38 vor
  Minute 60, Median 41,4, längste 71,5 (ohne Burgen und Rammen: 37 / 42,2 /
  75,7); zu viert alle zwanzig vor Minute 90, Median 50,9 (ohne: 44,8).
  Zu zweit brachten acht Wellen eine Burg von 4800 auf 278 Leben, ohne dass
  sie fiel; mit vier oder fünf Rammen blieben ein bis zwei Partien ohne
  Sieger, weil das Gold für das Heer fehlte. Nur Gold und Holz
  zurückzulegen, statt die Ausbildung ruhen zu lassen, lenkte jedes Haus zur
  goldfreien Kaserne — AC-27 fiel (Distelhag 1,15- bis 1,45-fach).
  **Seit dem Zusammenführen mit der neuen Balance (2026-11-13) gehen die
  Rammen vor, sobald die KI beim Gegner etwas gesehen hat, das schießt** —
  nicht erst, wenn ihr Heer schon wartet: die Ausbildung ruht, bis drei
  stehen. Mit dem früheren Handel (AC-26) und dem Aufgeben ohne
  Dorfbewohner (AC-19) gemessen: Nebel 1 bis 40 alle mit Sieger, 36 vor
  Minute 60, Median 40,4, längste 79,4; Startwerte 41 bis 80 alle mit
  Sieger, 37, Median 39,8, längste 76,5; zu viert alle zwanzig vor Minute
  90, Median 44,6, **längste 87,1 — knapp**; ohne Häuser 1 bis 20 alle mit
  Sieger, längste 83. **Die Grenzen halten an diesen Startwerten, nicht
  aus Abstand:** eine Probe, die nur die Zufallsfolge der Platzsuche
  verschob (der Platz erst gesucht, wenn das Gebäude bezahlt ist — 45 %
  weniger Rechenzeit im Prüfstand), ließ je Satz eine Partie ohne Sieger
  und nur 32 vor Minute 60; sie ist deshalb nicht eingebaut. Nicht gemessen:
  was es heißt, dass eine KI, die selbst angegriffen wird, bis zur dritten
  Ramme keine Kämpfer ausbildet.
  **Knapp (vor dem Zusammenführen):** Distelhag bildet 52,4 aus der Kaserne aus gegen 32,5 der
  anderen (1,61-fach, verlangt 1,5); über die Startwerte 41 bis 80 sind es
  44,7 gegen 38,6. **Lücke:** zwei Burgen und Türme nebeneinander knackt
  die KI nicht — jede nimmt einer Ramme zwei Leben je Sekunde, und eine
  Belagerung aus der Ferne kommt erst in der Krone.
- **AC-24** `fertig` **Das Dorf wächst weiter** — Nach jedem Aufstieg bildet
  das Dorfzentrum weiter Dorfbewohner aus: bis 32 in der Feudalzeit, 42 in
  der Ritterzeit, 50 in der Imperialzeit (`DORFBEWOHNER_JE_ZEITALTER` in
  `ki.js`). Bis Runde 142 blieb es in jedem Zeitalter bei 22, und ab dem
  Mittelspiel standen beide KIs mit leeren Vorräten im Patt (Startwert 24:
  74 Minuten). Vorgabe des Benutzers für die schwere KI: 40 bis 50 im
  letzten Zeitalter; mittel (25) und leicht (15) folgen als eigene Reihen.
  Die Zahlen der Feudal- und Ritterzeit liegen zwischen 22 und 50, wie im
  Original ein gutes Spiel wächst; sie sind Werte, kein Gesetz.
- **AC-25** `fertig` **Die KI im Team** — Sie greift nur Gegner an, nie
  Verbündete, und wählt ihr Ziel unter den Gegnern. Selbst löst sie nie ein
  Bündnis. Kündigt ihr ein Mensch, ist er nach der Frist ihr Gegner wie
  jeder andere ([Spielziel](spielziel.md) AC-21). Belegt im Prüfstand: zwei
  gegen zwei, über zwanzig Startwerte kein Schaden zwischen Verbündeten.
  Gebaut in Runde 151: die KI fragt an drei Stellen `welt.feindlich` —
  welcher Gegner der nächste ist (`naechsterGegner`, daraus Heer,
  Nachsetzen und „überlegen"), von wem ein Marschziel Abstand hält
  (`freiesFeldUm`) und neben wem eine Baustelle liegen bleibt. Gemessen mit
  Verbündeten als **Nachbarn** (KI 1 und 2 gegen 3 und 4; über Eck wäre der
  nächste Nachbar ohnehin ein Gegner): null Schläge und null Angriffsläufe
  zwischen Verbündeten, 48 bis 136 Angriffsläufe zu Gegnern je Partie; die
  KI von Runde 150 zog 255 bis 314 Mal zum verbündeten Nachbarn und spielte
  90 Minuten unentschieden. Ein Bündnis lösen kann bis spielziel AC-21
  niemand; die KI sendet dafür keine Nachricht, und weil sie bei jeder
  Entscheidung `feindlich` fragt, ist ein Gekündigter danach ihr Gegner,
  ohne dass sie davon wissen muss — der Test dazu gehört zu AC-21.
- **AC-26** `fertig` **Die KI handelt mit Karren** — Fehlt ihr in der
  Ritterzeit das Gold, baut sie einen zweiten Markt weit vom ersten oder
  fährt zu einem verbündeten, und bildet Karren aus. Gemessen über ganze
  Partien, in denen das Gold um ihr Dorf beim Aufstieg in die Ritterzeit
  geleert wird: ohne Handel kommt danach kein Gold mehr herein, mit Handel
  in fast jeder Partie (alle bis auf zwei) mindestens 90 Gold in 14
  Minuten. **Neu gefasst in Runde 162:** zuvor sollte das Patt mit leerem
  Gold (Erkenntnisse, Runden 114, 137 und 144) seltener werden. Das gibt es
  auf diesem Zweig nicht — der Prüfstand endet 40 von 40 vor Minute 60,
  und das Gold in Reichweite geht in 88 KIs nur viermal aus, alle nach
  Minute 45; jene Patts kamen von der KI mit eigener Sicht (ki AC-13).
  **Gebaut in Runde 162:** knapp heißt weniger als 800 Gold (ein Goldfeld)
  in den 30 Feldern, in denen sie sammelt. Der erste Markt steht am Dorf,
  der zweite 50 Felder davon (sonst 42, 34, 26) in der Richtung, die am
  weitesten von jedem gegnerischen Dorf liegt; Ziel ist der fernste
  fertige Markt, der keinem Gegner gehört, mindestens 25 Felder weit.
  Höchstens acht Karren. Fehlt ihr das Gold für einen, verkauft sie am
  Markt, was über 300 liegt — Stein ganz, den sie nie ausgibt. Solange
  ein Markt fehlt, legt sie sein Holz zurück. Ein Karren ist keine
  Kampfeinheit: Angriff 0, er zieht nicht mit dem Heer. Gemessen, Startwerte
  1 bis 10: mit Handel 720, 562, 270, 10, 125, 93, 350, 706 und 0 Gold in
  14 Minuten (bei 4 und 10 wird die KI überrannt), ohne Handel 0 bis 30.
  **Seit 2026-11-13, mit den Burgen (AC-33) und der neuen Balance der
  Häuser:** knapp heißt weniger als **1500** Gold — der Handel braucht zehn
  Minuten, bis er trägt, und wem das Gold vorher ausgeht, der steht ohne
  Ramme vor der Burg. **Bis vier Karren fahren, liegt zurück, was der
  nächste kostet** (`karrenFehlt`), und dafür verkauft sie bis auf seinen
  Preis, auch Holz unter 300. **Ist das Dorf zugebaut, sucht sie den
  Bauplatz dahinter** (`platzBeiBasis`, Ringe 16 bis 27). Anlass war der
  Startwert 14: beiden ging um Minute 60 das Gold aus, der Angreifer fand
  von Minute 56 bis 85 keinen Platz für den Markt, hatte bis Minute 90
  einen Karren und keine Ramme. Vorher, auf dem vereinten Stand: 2 von 40
  Nebelpartien ohne Sieger; danach keine (siehe AC-23).

- **AC-33** `fertig` **Die KI baut Burgen** — Im Fürstentum baut die KI
  eine Burg, sobald ihr erstes Heer aufgebrochen ist: sechs Felder vor ihrem
  Dorfzentrum zum nächsten Gegner hin, mit drei Bauern, und vier Sammler
  gehen dafür vom Holz an den Stein und zurück, wenn sie steht. In der
  Krone darf sie eine zweite und dritte bauen, die zweite frühestens zehn,
  die dritte zwanzig Spielminuten, nachdem die erste steht
  (`BURGEN_JE_ZEITALTER = [0, 0, 1, 3]`, `BURG_ABSTAND_SEKUNDEN`), links
  und rechts der ersten. Fällt eine, baut
  sie sie wieder. Fehlt das Gold in Reichweite, wartet die Burg, bis vier
  Karren fahren — sonst nahm sie den Stein, den die KI für den ersten
  Karren verkauft (AC-26). Kein Haus ist ausgenommen; Wehrsteins Türme
  (AC-30) kommen zuerst. **Messbar:** in gebauten Lagen baut sie die Burg
  erst nach dem Aufbruch und zum Gegner hin, im Fürstentum keine zweite, in
  der Krone nach der Frist, und nicht vor dem Handel
  (`tests/strategie-ki-belagerung.test.mjs`); über vierzig Startwerte im
  Nebel baut mindestens jede dritte KI eine Burg, jedes Haus mindestens
  zwei in sechzehn Partien, keine vor ihrem ersten Aufbruch, und fahrplan
  AC-11 hält. **Gemessen am 2026-11-13:** 44 Burgen bei 43 von 80 KIs
  (Eschenbruch 11, Rappenstein 11, Distelhag 10, Wehrstein 9, Silberfurt 3
  — dort geht der Handel vor); wer keine baut, fällt vorher oder bricht nie
  auf. **Zweite und dritte Burg erst in der Krone** (Benutzer, 2026-11-13:
  „Im laufe der spielzeit darf ne ki auch ne zweite oder dritte burg
  baun"): mit bis zu drei schon im Fürstentum blieb über die Startwerte 1
  bis 40 und über 41 bis 80 je eine Partie ohne Sieger, und zu viert
  endete Startwert 7 nicht vor Minute 90 (fahrplan AC-24) — siehe Lücke
  bei AC-23. Auch eine zweite erst zwanzig Minuten nach der ersten ließ
  Startwert 14 ohne Sieger und zu viert Startwert 5. **Die KI steigt bis heute nicht in die Krone auf** (Stufe
  F): die zweite und dritte Burg baut sie deshalb in keiner ganzen Partie,
  belegt sind sie nur in der gebauten Lage.
  Angelegt am 2026-11-13 (Benutzer: „Und ki muss auch burgen bauen,
  definitiv"); die Spezialeinheit aus der Burg bleibt AC-28.
  **Nachgezogen am 2026-11-13 mit den Truppenstufen:** „der Handel geht
  vor" gilt nur noch bei echter Goldnot. Silberfurt handelt aus Neigung ab
  dem Fürstentum, und die Sperre griff bei ihm in jeder Partie — vier
  Karren standen erst um Minute 32 bis 35, und den Stein verkaufte es für
  Karren: in 16 Partien eine Burg (vor den Truppenstufen zwei, genau die
  Grenze). Jetzt wartet die Burg nicht, solange Gold in Reichweite liegt,
  und der Stein für sie wird nicht verkauft (`steinFuerBauwerk`); Werkstatt
  und Rammen bleiben hinter dem Handel. Gemessen: Silberfurt 6 Burgen in 16
  Partien, gesamt 51 Burgen bei 51 von 80 KIs, 212 Rammen bei 42. Zwei
  Fassungen davor verworfen: alles freigeben ließ Startwert 22 ohne Sieger,
  nur die Burg freigeben ohne den Stein zu halten brachte vier.
- **AC-34** `fertig` **Mehr Militärgebäude bei Überfluss** — Ab dem
  Fürstentum baut die KI über die Grenze ihres Zeitalters (AC-12, AC-24:
  drei, drei, fünf, sechs) hinaus ein weiteres Militärgebäude, wenn alle
  Schlangen voll sind und trotzdem mindestens 600 Holz und zusammen 1000
  Nahrung und Gold im Vorrat liegen — bis höchstens neun. Welches, sagt
  dieselbe Regel wie bisher (AC-27, AC-32). Im Lehen nicht: dort ist ein
  voller Vorrat der Aufstieg. **Messbar:** in einer gebauten Lage an der
  Grenze baut sie mit Überfluss ein weiteres und mit einem Rohstoff knapp
  darunter keines, im Lehen keines, am neunten ist Schluss; die Gegenprobe
  ohne die Regel fällt (`tests/strategie-ki-nachbau.test.mjs`); fahrplan
  AC-11 und AC-24 halten. **Gemessen am 2026-11-13:** KI gegen KI ändert
  die Regel fast nichts — über vierzig Startwerte steht die KI im
  Fürstentum nur in 46 von 1446 KI-Minuten an der Grenze, mit vollen
  Schlangen in 7, und ihr Vorrat liegt im Mittel bei 55 Holz, 57 Nahrung
  und 86 Gold: **sie ist arm, nicht gedeckelt.** Im Nebel unverändert 38
  von 40 vor Minute 60, Median 41,4; zu viert alle zwanzig vor Minute 90,
  längste 83,2 statt 76,7. Die Regel ist für die lange Partie gegen einen
  Menschen, der sich einmauert — **das ist nicht gemessen**, dafür gibt es
  keinen Prüfstand. Angelegt am 2026-11-13 (Benutzer: „man darf dann bei
  fortgeschrittener spielzeit wenns die ressourcen hergeben auch mehrere
  kasernen, schießanlagen, usw. Bauen als ki").
- **AC-35** `offen` **Die KI forscht** — Bis zu den Truppenstufen
  (einheiten AC-58 bis AC-62, bauen AC-38, AC-39) erforscht die KI nichts:
  sie bildet im Fürstentum die Einheiten des Lehens aus und ist jedem
  Menschen unterlegen, der einmal in die Schmiede geht. Die KI erforscht,
  was den Einheiten nützt, die sie hält und ausbildet — gelesen aus den
  Daten der Verbesserung (`wandelt`, `wirkung` auf eine Klasse), **keine
  Liste von Namen**: zuerst die Stufe der Einheit aus ihrem Schwerpunkt
  (AC-27), dann Angriff und Rüstung der Schmiede für die Klasse, von der
  sie am meisten hält, dann die Wirtschaft (Holz, Farm), solange sie dort
  arbeitet. Sie forscht nicht, wenn ihr dafür der Aufstieg, die Rücklage
  für Karren oder Rammen (AC-26, AC-23) oder die laufende Ausbildung des
  ersten Heers fehlte. **Messbar:** in einer gebauten Lage mit Vorrat
  bestellt sie die Stufe ihrer Schwerpunkt-Einheit vor jeder anderen
  Verbesserung und keine, deren `vorstufe` fehlt; mit knappem Vorrat keine.
  Über vierzig Startwerte im Nebel hat jede KI, die das Fürstentum
  erreicht und danach noch zehn Minuten lebt, mindestens drei
  Verbesserungen erforscht, darunter eine Truppenstufe; fahrplan AC-11 und
  AC-24 halten. Und sie ist dadurch stärker: in der Austauschprobe
  (`npm run pruefstand:vergleich -- --probe`) gewinnt die forschende KI
  gegen die von vorher über sechzig Startwerte mehr als die Hälfte.
  Angelegt am 2026-11-13 (Benutzer: direkt nach den Truppenstufen, die
  vorher auf den Server gehen). Die Grenzen „drei" und „zehn Minuten" sind
  Startwerte und werden beim Bauen gemessen.

### Stufe E — Häuser

- **AC-27** `fertig` **KI neigt zum Haus** — Die KI spielt das Haus,
  das ihr Platz im Warteraum trägt (spielauswahl AC-24), und neigt zu
  seinem Schwerpunkt: Eschenbruch zur Schießanlage, Rappenstein zum Stall,
  Distelhag zur Kaserne, Silberfurt früher zum Handel. Wehrstein neigt zu
  Türmen — das braucht Stein und steht als AC-30 für sich.
  Welche Einheiten sie ausbildet, liest sie aus den Daten des Gebäudes
  (ki AC-17), welches Gebäude zuerst, aus den Daten des Hauses — keine
  Verzweigung nach dem Namen. **Messbar:** über vierzig Startwerte im
  Nebel, je Partie zwei verschiedene Häuser, bildet jedes Haus aus seinem
  Schwerpunkt mindestens anderthalbmal so viel aus wie die anderen im
  Schnitt und mindestens zwei mehr, und KI gegen KI endet weiter wie in
  fahrplan AC-11. Geschärft beim Bauen (Runde 174): „mehr als der
  Durchschnitt" hielt auch ohne jede Neigung für Eschenbruch und Silberfurt
  (78 gegen 64, 0,8 gegen 0,4). Gebaut als `ki` in `HAEUSER`
  (`schwerpunkt`, `goldKnapp`): ein Militärgebäude als Schwerpunkt baut die
  KI zuerst, baut es nach der ersten Kaserne nach und bedient es zuerst;
  Silberfurt handelt gleich mit der Ritterzeit. Gemessen: Eschenbruch 107
  aus der Schießanlage gegen 42, Rappenstein 28 aus dem Stall gegen 4,
  Silberfurt 6,5 Karren gegen 0,1, Distelhag 82 aus der Kaserne gegen 35;
  38 von 40 Partien vor Minute 60, Median 42,9. Belegt in
  `tests/partien/ki-im-nebel.test.mjs`. **Die Grenze ist seit dem
  2026-11-13 das 1,4-fache statt des Anderthalbfachen** — freigegeben vom
  Benutzer an diesem Tag („ki AC-27 und AC-30 halten knapp. Wenn sie
  fallen, sind 1,4 und 1,75 freigegeben."). Gefallen ist sie mit der Burg
  des Hauses, das früh handelt (ki AC-33): Silberfurt lebt länger und
  bildet mehr aus der Kaserne aus; Distelhag selbst unverändert 47,6 je
  Partie gegen jetzt 33,1 der anderen (das 1,44-fache). „Zwei mehr" gilt
  weiter, und der Stand ohne Neigung fällt auch am 1,4-fachen. ki AC-30
  hielt und bleibt bei zwei.
- **AC-28** `offen` **KI bildet Spezialeinheit aus** — In der Ritterzeit
  baut die KI eine Burg und bildet dort die Spezialeinheit ihres Hauses
  aus, als Teil ihres Heeres. Dafür braucht sie 650 Stein — **die KI
  sammelt bis heute keinen Stein**; das gehört zu diesem Kriterium. Über
  zwanzig Startwerte hat jede KI, die die Ritterzeit erreicht und zehn
  Minuten darin bleibt, eine Burg und mindestens eine Spezialeinheit
  ausgebildet. Ohne das misst fahrplan AC-18 nichts. **Seit AC-33
  (2026-11-13)** sammelt die KI Stein und baut die Burg; offen bleibt hier
  die Spezialeinheit daraus.
- **AC-30** `fertig` **Wehrstein baut Türme** — Die KI, die Wehrstein
  spielt, baut ab der Feudalzeit Wachtürme an ihrem Dorf, mehr als jedes
  andere Haus. Dafür sammelt sie Stein (125 je Turm; vom Start sind 200
  da) — dieselbe Lücke wie bei AC-28, die eine löst sie für beide. Gelesen
  aus `HAEUSER.wehrstein.ki`, nicht aus dem Namen. **Messbar:** über
  vierzig Startwerte wie bei AC-27 baut Wehrstein je Partie mindestens
  zwei Türme und anderthalbmal so viele wie die anderen im Schnitt, und KI
  gegen KI endet weiter wie in fahrplan AC-11. Abgetrennt von AC-27 in
  Runde 174: die KI baut bis heute keinen Turm. Gebaut als
  `ki: { schwerpunkt: 'wachturm', anzahl: 2, steinSammler: 3 }` — ein
  Schwerpunkt, der nichts ausbildet, ist ein Bauwerk (`ki.bauwerkePruefen`):
  ab seinem Zeitalter, wenn das erste Militärgebäude steht **und das erste
  Heer aufgebrochen ist**, eines nach dem anderen am Dorf; die
  Steinsammler kommen vom Holz und gehen zurück, wenn alle stehen.
  Gemessen: zwei Türme in jeder der 16 Partien, die anderen keinen; 40 von
  40 mit Sieger, 36 vor Minute 60, Median 44,9 — knapp unter der Grenze.
  **Seit einheiten AC-57 (2026-11-12, schnellerer Späher):** in 15 von 16
  Partien zwei Türme; bei Startwert 12 wird Wehrstein ab Minute 19 von
  Eschenbruch im eigenen Dorf geschlagen, bricht nie auf und baut keinen —
  200 Stein bleiben liegen. Der Test zählt deshalb die Partien mit
  Aufbruch (mindestens 14 von 16). **Lücke:** eine KI, die daheim
  angegriffen wird, verbaut ihren Stein nicht; Türme auch zur Verteidigung
  wären der nächste Schritt, gemessen an fahrplan AC-11. Im Nebel jetzt 36
  vor Minute 60, Median 42,6.
  Vier Türme ergaben 31 vor Minute 60 und Median 46,8; zwei Türme schon
  vor dem ersten Angriff ließen zwei Partien ohne Sieger. Belegt in
  `tests/partien/ki-im-nebel.test.mjs`.

- **AC-31** `offen` **KI antwortet auf das Heer** — Was die KI ausbildet
  und welches Militärgebäude sie nachbaut, richtet sich nach den fremden
  Kampfeinheiten, die sie gesehen hat (`feindeGesehen`, ki AC-13): in
  jedem Gebäude nimmt sie die Einheit, deren `bonus` die meisten von ihnen
  nach ihren `klassen` trifft, unter gleichen die bisherige Wahl (die
  neueste zuerst, ki AC-22); und das nächste Gebäude ist das, aus dem die
  beste Antwort kommt, wenn sie es noch nicht hat. Hat sie niemanden
  gesehen, bleibt alles wie heute. Gelesen aus den Daten der Einheiten und
  Gebäude, keine Liste von Paaren; die Neigung zum Haus (AC-27) entscheidet
  weiter, welches Gebäude sie zuerst baut und zuerst bedient — nur nicht
  mehr allein, was danach kommt. Heute baut Distelhag nach der ersten
  Kaserne nur Kasernen nach, eine Schießanlage nie. **Messbar:** in
  `npm run pruefstand:haeuser` gewinnt Distelhag mindestens 6 von 20
  Partien gegen Eschenbruch (Runde 176: 0 von 20, in keiner Gegenprobe an
  den Zahlen mehr als 3), AC-27 und fahrplan AC-11 halten weiter, und die
  Gegenprobe mit der alten Wahl zeigt den Unterschied an denselben
  Startwerten. Angelegt in Runde 176: Distelhag bildet gegen Schützen
  weiter Speerkämpfer aus, die der Bogen mit Bonus trifft, statt Plänklern
  aus einer Schießanlage.
  **Runde 177: gebaut, gemessen, ohne Wirkung — nicht eingecheckt**, auf
  dem lokalen Zweig `strategie-ki-antwort` (9c69b75, mit vier Tests, die
  gegen den alten Stand fallen). Distelhag gegen Eschenbruch blieb 0 zu 20,
  die Tafel über 200 Partien fast gleich (Eschenbruch 85 %, Distelhag
  29 % statt 31 %). Die Annahme dahinter war falsch: **beide** Seiten
  antworten — Eschenbruch bildet gegen Distelhags Schützen 40 Plänkler aus
  —, und Distelhag verliert über die Menge: in den Startwerten 61 bis 63
  zwei bis drei Militärgebäude gegen drei bis fünf, 127 gegen 226
  Kampfeinheiten, fast immer unter 50 Holz bei 200 bis 500 Gold. Auch eine
  Probe, die Gebäude ohne Antwort pausieren lässt, ergab 1 zu 19. Bevor
  dieses Kriterium wieder gebaut wird, steht die Herstellung (siehe Offene
  Fäden „Distelhag stellt weniger her").
- **AC-32** `fertig` **Kasernen-Neigung baut im Wechsel** — Neigt das
  Haus der KI zur Kaserne, baut sie die erste Kaserne wie jedes Haus
  (AC-17) und bedient sie zuerst (AC-27); danach eine weitere Kaserne nur,
  solange sie weniger Kasernen als andere Militärgebäude hat, sonst nach
  der Goldregel — Schießanlage mit Gold, sonst Stall. Im Lehen ergibt das
  Schießanlage, Kaserne, Schießanlage, im Fürstentum dazu Kaserne und
  Schießanlage, statt Kaserne um Kaserne. Wer zu einem Militärgebäude
  neigt, baut weiter dieses nach. **Messbar:** in einer gebauten Lage
  (Gebäude voll beschäftigt, Vorrat für alles) schickt die KI des Hauses,
  das zur Kaserne neigt, neben Kaserne und Schießanlage eine Schießanlage,
  neben einer Kaserne und zwei Schießanlagen eine Kaserne; die des Hauses,
  das zum Stall neigt, weiter einen Stall. Die Gegenproben mit der alten
  Regel und mit „nie eine zweite Kaserne" fallen. Über 160 Partien
  (`npm run pruefstand:haeuser -- --nur distelhag --je 40`, andere
  Startwerte als die Vorgabe) gewinnt das Haus über 40 %, und AC-27 und
  fahrplan AC-11 halten. **Gemessen in Runde 180:** Kaserne um Kaserne 26 %
  (41 von 160), im Wechsel 47 % (75 von 160), nie eine zweite Kaserne 48 %
  — aber dann bildete das Haus nur noch 47,5 Einheiten je Partie aus der
  Kaserne aus gegen 38,6 der anderen, und AC-27 (das Anderthalbfache) fiel;
  im Wechsel hält es. Die Paarung gegen Eschenbruch kippt davon nicht (0
  zu 39, danach 6 zu 33); das hängt an Eschenbruchs Boni (spielziel AC-18,
  Frage an den Benutzer). Angelegt in Runde 180 aus der Messung der Runde
  179: ohne jede Neigung gewann das Haus 51 %.

### Stufe F — der Drache (aus ADR-0014)

- **AC-29** `offen` **Die KI ruft den Drachen** — Die KI holt Eier, bewacht ihr
  Kloster und ruft den Drachen, wenn sie Ei, Kloster und fünf Mönche hat.
  Sieht sie die Ansage eines fremden Rituals oder einen fremden Drachen,
  stellt sie Schützen dagegen und schickt ihr Heer zum fremden Kloster.
  KI gegen KI: wer zuerst ruft, gewinnt nicht öfter als 60 %
  ([Einheiten](einheiten-und-befehle.md) AC-52).

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
