# Einheiten und Befehle

**Bereich:** Strategie
**Kuerzel:** einheiten
**Stand:** 29/47 fertig · 17 offen · 1 zurueckgestellt

## Zweck

Was ein Spieler tun kann, und was daraufhin passiert.

> **Stufe A löst ab.** AC-11 (zwei Sekunden, zehn Einheiten) beschrieb das
> Sammeln der kleinen Fassung. Seit Runde 16 gilt AC-15: gesammelt wird mit
> der Rate der Vorlage, eine volle Ladung Holz dauert gut 25 Sekunden.

## Abgrenzung

| Gehoert dazu                       | Gehoert nicht dazu                            |
| ---------------------------------- | --------------------------------------------- |
| Auswahl, Bewegung, Sammeln         | Feldarten → [Karte](karte-und-vorraete.md)    |
| Wegfindung                         | Bauen → [Bauen](bauen.md), Kampf → [Kampf](kampf.md) |

## Abnahmekriterien

### Auswahl und Befehl

Auswahlrahmen, Klick, Rechtsklick und Tastenkuerzel stehen in
[Bedienung](bedienung.md) - hier geht es nur darum, was ein angekommener
Befehl bewirkt.

- **AC-4** `fertig` **Nur eigene Einheiten gehorchen** — Belegt ueber den echten Anfrageweg, siehe
  [Uebertragung](../00-plattform/uebertragung.md) AC-2.

### Bewegung

- **AC-6** `fertig` **Weg um Hindernisse** — Einheiten laufen um Wald, Beeren und Wasser herum, in
  acht Richtungen.
- **AC-7** `fertig` **Keine Abkuerzung durch Ecken** — Diagonal nur, wenn beide angrenzenden Felder
  frei sind. Sonst laufen Einheiten durch Hausecken.
- **AC-8** `fertig` **Wegsuche bleibt bezahlbar** — Eine Suche quer ueber die Karte kostet unter
  1 ms, damit auch 120 Einheiten in einem Takt neu planen koennen.
- **AC-9** `fertig` **Unerreichbares Ziel laesst stehen** — Fuehrt kein Weg zum Ziel, bleibt die
  Einheit stehen, statt sich zu verhaken.
- **AC-10** `offen` **Einheiten blockieren sich nicht** — Heute laufen sie durcheinander hindurch.
  _(Bewusst so: Ausweichverhalten ist aufwendig und faellt erst bei vielen
  Einheiten auf.)_

### Sammeln

- **AC-11** `zurueckgestellt` (abgeloest durch einheiten AC-15) **Vollstaendige Sammelschleife** — Ein Sammler laeuft zum Vorrat, sammelt zwei
  Sekunden, traegt zehn Einheiten zur Basis und kehrt von selbst zurueck.
- **AC-12** `fertig` **Ablieferung erhoeht den Vorrat** — Erst an der Basis steigt der Vorrat des
  Spielers, nicht schon beim Sammeln.
- **AC-13** `fertig` **Ersatzfeld bei Erschoepfung** — Ist ein Feld leer, sucht der Sammler
  selbstaendig das naechste gleicher Art im Umkreis von zwoelf Feldern.
- **AC-14** `fertig` **Ohne Ersatz wird gewartet** — Findet er keines, bleibt er stehen, statt quer
  ueber die Karte zu laufen.

### Stufe A — Dorfbewohner und Späher nach der Vorlage

| Einheit      | Leben | Tempo (Felder/s) | Sicht | Tragkraft |
| ------------ | ----- | ---------------- | ----- | --------- |
| Dorfbewohner | 25    | 0,8              | 4     | 10        |
| Späherreiter | 45    | 1,2              | 4     | –         |
| Miliz        | 40    | 0,9              | 4     | –         |

| Tätigkeit     | je Sekunde | Abgabe an |
| ------------- | ---------- | --------- |
| Holz fällen   | 0,39       | Dorfzentrum, Holzfällerlager |
| Schafe hüten  | 0,33       | Dorfzentrum, Mühle |
| Beeren        | 0,31       | Dorfzentrum, Mühle |
| Farm          | 0,32       | Dorfzentrum, Mühle |
| Gold          | 0,38       | Dorfzentrum, Bergbaulager |
| Stein         | 0,36       | Dorfzentrum, Bergbaulager |

- **AC-15** `fertig` **Vier Rohstoffe sammeln** — Rechtsklick eines Dorfbewohners auf Baum,
  Beerenstrauch, Gold- oder Steinfeld: er sammelt mit der Rate aus der Tabelle,
  trägt bis zu zehn und bringt sie weg. Wechselt er den Rohstoff, verfällt die
  alte Ladung.
- **AC-16** `fertig` **Abgabe am nächsten Lager** — Ein voller Dorfbewohner bringt seine Ladung zum
  nächsten fertigen Gebäude, das diesen Rohstoff annimmt, und kehrt zum selben
  Vorrat zurück.
- **AC-17** `fertig` **Schafe schlachten und hüten** — Rechtsklick eines Dorfbewohners auf ein
  eigenes Schaf: er schlachtet es und nimmt Nahrung vom Kadaver. Ein Kadaver
  verliert je 4 Sekunden eine Nahrung, solange niemand an ihm arbeitet — wie
  im Original, damit man nicht alle Schafe zugleich schlachtet.
- **AC-18** `fertig` **Farm bestellen** — Ein Dorfbewohner auf einer fertigen Farm sammelt dort
  Nahrung, bis die Farm leer ist. Auf einer Farm arbeitet höchstens einer.
- **AC-19** `fertig` **Werte nach der Vorlage** — Dorfbewohner, Späherreiter und
  Miliz haben die Werte aus der Tabelle; der Späher ist anderthalbmal so
  schnell wie ein Dorfbewohner.
- **AC-20** `fertig` **Ein Befehl für viele** — Mehrere ausgewählte Einheiten, zum selben Punkt
  geschickt, stellen sich dort nebeneinander auf, statt auf einem Feld zu
  stehen. Mehrere Sammler auf einem Vorrat verteilen sich auf die Nachbarn
  derselben Art.
- **AC-22** `fertig` **Schafe wählen und treiben** — Eigene Schafe lassen sich wie Einheiten
  anklicken oder mit dem Rahmen wählen und per Rechtsklick an einen Ort
  schicken, etwa ans Dorfzentrum; so werden die Wege beim Hüten kurz. Fremde
  Schafe in Sichtweite eigener Einheiten wechseln den Besitzer — wie in der
  Vorlage. _(Auf Frage des Benutzers in Runde 26 angelegt.)_
- **AC-21** `fertig` **Untätig ist erkennbar** — Die Welt weiß je Spieler, welche Dorfbewohner
  nichts tun. Die Oberfläche zeigt die Zahl und springt zum nächsten
  (→ [Bedienung](bedienung.md) AC-28).

### Feudalzeit (Stufe B)

- **AC-23** `fertig` **Drei neue Einheiten** — Speerkämpfer (35 Nahrung, 25 Holz, 22 s) in der
  Kaserne, Bogenschütze (30 Holz, 45 Gold, 35 s — 25 Holz in der Vorlage, seit Runde 202 teurer, weil die Schützen KI gegen KI zu stark waren, spielziel AC-18) und Plänkler (25 Nahrung,
  35 Holz, 22 s) in der Schießanlage, Späherreiter (80 Nahrung, 30 s) im
  Stall. Werte für Leben, Angriff, Rüstung, Reichweite und Tempo nach der
  [Vorlage](../../docs/strategie/vorlage-aoe2.md). Alle drei tragen
  `zeitalter: 1`: die Kaserne steht schon in der Dunklen Zeit, bietet den
  Speerkämpfer aber erst nach dem Aufstieg an — im Menü und auf dem Server.
  Angriff, Rüstung und Bonus stehen als Daten bereit; **gekämpft wird erst mit
  [Kampf](kampf.md)**. Der Bonus zielt auf die Rüstungsklasse, nicht auf die
  Art: Speer schlägt Kavallerie, Bogen schlägt Speer, Plänkler schlägt
  Bogenschützen.
- **AC-24** `fertig` **Miliz wird Soldat** — Die Kaserne erforscht ab der Feudalzeit die
  Stufe Soldat (Leben 45, Angriff 6); alle vorhandenen Milizen werden dadurch
  zu Soldaten, ohne neu ausgebildet zu werden. Die Verbesserung kostet
  100 Nahrung und 40 Gold und dauert 40 Sekunden (die Vorlage lässt die
  Kosten offen, genommen sind die des Originals). Sie **ersetzt** die Miliz:
  danach bildet die Kaserne nur noch Soldaten aus, auch eine Miliz in der
  Warteschlange wird als Soldat fertig, und der Schaden einer verwundeten
  Miliz bleibt beim Wechsel stehen.
- **AC-25** `fertig` **Fernkämpfer halten Abstand** — Bogenschütze und Plänkler schießen aus
  vier Feldern und laufen nicht in den Nahkampf, solange ihr Ziel in
  Reichweite ist. Ein Nahkämpfer mit demselben Befehl geht dagegen bis ans
  Ziel — derselbe Rechtsklick, zwei Abstände.
- **AC-29** `fertig` **Keine zwei Einheiten übereinander** — Stehen zwei
  Einheiten näher als ein halbes Feld beieinander, tritt eine auf ein freies
  Nachbarfeld — gezogen wird die mit der höheren Nummer, deterministisch, und
  nur auf ein Feld, auf dem sie ihre Arbeit behält (wer baut, bleibt an der
  Baustelle). Schräg nur, wenn beide Ecken frei sind. **Messbar: keine zwei
  stehenden Einheiten im Bild näher als ein halbes Feld** (`figurenFrei`), auch
  wenn sie mit getrennten Befehlen auf dasselbe Feld geschickt wurden.
  **Noch nicht** für Sammler am Vorrat und am Tier (AC-30); Kämpfende seit
  Runde 100 (AC-31). Gesehen in Runde 64; danach siebenmal an der Stelle
  umschifft, die ein Ziel vergibt (Runden 56 bis 86), bis die Rückschau nach
  Runde 88 die Regel aufstellte, einen offenen Fehler nur einmal zu umschiffen.
- **AC-30** `offen` **Sammler teilen keinen Platz** — Auch wer am Vorrat oder
  am Tier arbeitet, steht nicht auf einem anderen. **Bedingung:** fahrplan
  AC-5 hält weiter — gemessen in Runde 89 kostet das die Wirtschafts-KI im
  Median 0,4 Minuten bis zu den ersten 500 Nahrung (9,38 → 9,80), und neun von
  vierzig KIs verfehlen die zehn Minuten. Am Beerenbusch gehen 13 bis 16 %
  verloren: gestapelt standen alle auf dem einen Feld, das der Mühle am
  nächsten liegt. Nicht geholfen haben: das freie Feld nach dem Lager wählen,
  auf ein anderes Buschfeld wechseln, weniger Sammler an die Beeren. Die
  Antwort liegt vermutlich in der Lage der Mühle.
- **AC-31** `fertig` **Kämpfende stehen nebeneinander** — Nahkämpfer um ihr
  Ziel und Fernkämpfer auf ihrem Schussring stehen nicht aufeinander. **Gebaut
  in Runde 100:** wer am Ziel angekommen ist, darf wie jeder Stehende (AC-29)
  beiseitetreten — aber nur auf ein Feld, von dem aus er sein Ziel weiter
  trifft; während des Schritts läuft seine Nachladezeit weiter. Ohne das
  Letzte kostete jeder Schritt einen Schlag, und KI gegen KI dauerte im Median
  vier bis sechs Minuten länger (Startwerte 1–20: 38,1 statt 33,8; 21–40: 44,8
  statt 38,2); mit ihm 36,4 und 39,4. Der Konterkreis hält in allen vier
  Richtungen. Im Bild
  zu [Kampf](kampf.md) AC-1 und AC-10 stehen zwei angreifende Milizen fast
  aufeinander (Rückstand der Runde 83). **Bedingung:** der Konterkreis hält
  (fahrplan AC-9) — die Angriffslogik ist auf ihn abgestimmt (Runden 63, 64,
  85). Die Prüfung steht auskommentiert in
  `e2e/tests/strategie-kampf.spec.mjs` bei `kampf AC-1` bereit. Wer diese
  Bilder neu aufstellt, prüft auch, was ein Prüfer in den Runden 87 und 89
  fand: im Bild zu kampf AC-10 steht neben der gefallenen eine zweite, aufrechte
  rote Miliz, die die Unterschrift nicht nennt; im Bild zu kampf AC-1 stehen
  alle drei blauen Milizen auf **einer** Seite — „umstellt" stimmt nicht.
- **AC-32** `offen` **Marschierende laufen nicht aufeinander** — Wer mit
  anderen denselben Weg geht, läuft nicht länger als einen Augenblick auf
  demselben Punkt. **Gefunden in Runde 110:** im Browsertest zu ki AC-11 laufen
  zwei Milizen der KI dreißig Augenblicke (zwölf Spielsekunden) lang 0,28 Felder
  hintereinander auf derselben Linie; der Test sucht einen freien Augenblick
  und findet keinen — in zwei von vier Läufen, mit dem eingecheckten Stand
  ebenso. **Messbar:** im Angriffslauf der KI (Prüfstand, zwanzig Startwerte)
  stehen keine zwei Gehenden länger als zwei Sekunden näher als ein halbes
  Feld. **Bedingung:** fahrplan AC-11 und der Konterkreis halten.
  **Gemessen in Runde 111** (Angriffslauf, 30 Spielminuten, je Paar Gehender
  desselben Spielers die längste Zeit am Stück unter einem halben Feld):
  heute im Median 53 s, höchstens 98 s — gleiche Einheiten mit gleichem Tempo
  auf demselben Weg decken sich ganz. Drei Fassungen versucht, keine bleibt:
  (1) **Hinter dem Vordermann warten** (gleiche Richtung, Abstand 0,65): die
  Überdeckung fällt auf Median 1,2 s, höchstens 3,1 s über 40 Startwerte —
  aber das Heer zieht sich zur Reihe, kommt stückweise an und verliert; KI
  gegen KI endet im Median 1,6 bzw. 3,2 Minuten später, Startwert 5 erst bei
  60,8, und fahrplan AC-11 bricht. Rechenzeit +12 bis 20 %. (2) Dasselbe ohne
  Angreifer: noch länger (Median 44,2 statt 36,4 und 39,4; 17 und 18 von 20
  vor Minute 60). (3) **Schräg vorbei** statt warten: die Überdeckung wird
  wieder lang (bis 15,7 s), und der Schritt neben den Weg führt in
  Hindernisse — der Prüfstand fand Bogenschützen im Wald. **Der Weg ist
  wohl die Formation** der Vorlage: eine Gruppe läuft im Tempo der
  langsamsten auf parallelen Bahnen. Das ist neuer Umfang — Frage an den
  Benutzer (Erkenntnisse).

### Stufe D — Ritterzeit

Werte aus der [Vorlage](../../docs/strategie/vorlage-aoe2.md), als Daten in
`daten.js`; Angriff, Rüstung, Bonus und Nachladezeit wie in Stufe B.

- **AC-33** `fertig` **Ritter** — Im Stall ab der Ritterzeit: 60 Nahrung, 75
  Gold, 30 s, 100 Leben, 10 Angriff, 2/2 Rüstung, Tempo 1,35. Eigene Figur,
  bei Zoom 1 vom Späherreiter unterscheidbar.
- **AC-34** `fertig` **Armbrustschütze** — Die Verbesserung Armbrust in der
  Schießanlage (125 Nahrung, 75 Gold) tauscht jeden Bogenschützen aus, wie
  Soldat die Miliz (AC-24): 35 Leben, 5 Angriff, Reichweite 5. Eigene Figur.
- **AC-35** `fertig` **Ramme** — In der Belagerungswerkstatt: 160 Holz, 75
  Gold, 36 s, 175 Leben, 0/180 Rüstung, Tempo 0,5, 2 Angriff mit +125 gegen
  Gebäude. Sie greift nur Gebäude an; ein Befehl auf eine Einheit ist ein
  Gang dorthin.
  _Gebaut als `nurGebaeude` in den Daten: sie wacht nicht, schlägt
  getroffen nicht zurück und greift im Angriffslauf keine Einheit an. Der
  Bonus gilt der Klasse `gebaeude`, die jedes Gebäude trägt. Nicht in der
  Tabelle der Vorlage und deshalb gesetzt: Nachladezeit 5 s wie im Original,
  Sicht 3 — kürzer als jede andere Einheit, damit sie ohne Begleitung blind
  ist._
- **AC-36** `fertig` **Mangonel** — In der Belagerungswerkstatt: 160 Holz, 135
  Gold, 46 s, 50 Leben, 0/6 Rüstung, Tempo 0,6, 40 Angriff, Reichweite 7 und
  eine Mindestreichweite von 3; trifft eine Fläche (kampf AC-19).
  _Gebaut in Runde 130: `mindestreichweite` in den Daten. Von selbst nimmt
  er niemanden, der näher steht; befohlen fährt er erst so weit zurück, dass
  das Ziel weit genug weg ist (`welt.abstandsplatz`), und wirft dann. Er
  schießt, also gilt die Fernrüstung des Ziels: den Dorfbewohner trifft er
  mit 40, den Ritter mit 38. Nicht in der Tabelle der Vorlage und deshalb
  gesetzt: Nachladezeit 6 s wie im Original, Sicht 9 — Reichweite plus zwei
  wie Bogen und Armbrust. Im Bild ein offenes Gestell auf vier Rädern mit
  Wurfarm, Seilbündel und Seitenbohle in Spielerfarbe; der Stein fliegt in
  einem doppelt so hohen Bogen wie ein Pfeil._
- **AC-37** `fertig` **Mönch heilt** — Im Kloster: 100 Gold, 51 s, 30 Leben,
  Tempo 0,7. Er heilt eigene verletzte Einheiten in seiner Nähe, die nicht
  kämpfen, um einen Punkt je Sekunde; Gebäude und Belagerung nicht.
  Gebaut in Runde 134: ab der Ritterzeit, Taste G. „In seiner Nähe" sind
  vier Felder (die Vorlage nennt keine Zahl, gesetzt wie im Original); er
  heilt nur, solange er steht, und immer den nächsten Verletzten, einen
  nach dem anderen — nicht sich selbst. Er greift nicht an: ohne `angriff`
  wacht er nicht, ein Rechtsklick auf einen Gegner ist ein Gang (das
  Zeichen bleibt weiß), und die Leiste sagt „Greift nicht an" und „Heilt
  1 Leben/s" statt „Angriff 0, Nahkampf". Gezeichnet in brauner Kutte mit
  Kapuze, Strick und Stab, die Spielerfarbe als Schulterkragen und
  Skapulier; wer heilt, hebt den Stab, und an der Spitze glimmt ein Schein.
- **AC-38** `fertig` **Mönch bekehrt** — Ein Befehl auf eine fremde Einheit in
  Reichweite 9: nach einer Dauer, deren Zufall aus dem Startwert der Partie
  kommt (deterministisch), gehört sie dem Spieler des Mönchs. Danach ruht
  der Mönch eine Weile. Gebäude, Belagerung und Mönche bekehrt er nicht.
  Gebaut in Runde 135. Die Vorlage nennt nur die Reichweite; der Rest ist
  gesetzt wie im Original und steht als `bekehren` in den Daten: vor vier
  Sekunden nie, danach je Sekunde mit 28 %, nach zehn sicher — gezogen beim
  Befehl aus einem eigenen Zufall der Partie (`welt.zufall`, aus dem
  Startwert, nicht die Folge der Karte). Die Zeit läuft nur in Reichweite;
  weiter weg geht er erst hin, und kommt er nicht hin, gibt er auf. Danach
  ruht er 62 Sekunden: ein Befehl auf einen Fremden ist dann ein Gang. Für
  den alten Besitzer ist die Einheit verloren (Tafel), was sie tat, endet,
  und wer vom neuen Besitzer sie angriff, lässt ab — im Angriffslauf geht
  er weiter. Im Bild: das Zeichen am Ziel ist rot, der Mönch hebt den Stab
  wie beim Heilen, die Leiste nennt „Bekehrt 9 Felder".
- **AC-39** `fertig` **Der Marktkarren** — Ausgebildet am Markt ab der
  Ritterzeit: 100 Holz und 50 Gold, 70 Leben, Rüstung 0/0, Tempo 1,0, ein
  Wohnplatz, eine eigene Figur. Die Ausbildungszeit kommt aus der Vorlage
  und wird beim Bauen nachgesehen. Er greift nie an und wacht nicht; ein
  Rechtsklick auf einen Fremden ist ein Gang. **Abweichung:** in der Vorlage
  gibt es ihn ab der Feudalzeit. Entschieden hat der Benutzer, denn in der
  Feudalzeit reicht das Gold auf der Karte noch
  ([ADR-0013](../../docs/adr/0013-buendnisse-karren-dauer.md)).
  **Gebaut in Runde 160:** die Ausbildungszeit steht nicht in der Tabelle
  der Vorlage; gesetzt sind 51 Sekunden und Sicht 7 nach dem Fan-Wiki,
  **nicht geprüft**. Er ist ein Eintrag in `daten.js` mit `angriff: 0` und
  der Klasse `karren` — Wache, Gang statt Angriff, weißes Zeichen am Ziel
  und „Greift nicht an" in der Leiste ergeben sich aus den Regeln, die
  schon für den Mönch galten, ohne neuen Code. Die Figur: ein Pony an der
  Deichsel vor einem zweirädrigen Planwagen, die Plane und das Kummet in
  der Spielerfarbe, vorn der Fuhrmann mit Strohhut.
- **AC-40** `fertig` **Der Karren handelt** — Ein Rechtsklick auf einen
  **anderen** Markt schickt ihn auf die Strecke: einen Markt eines
  Verbündeten oder einen zweiten eigenen. Er pendelt zwischen seinem
  Heimatmarkt und diesem Ziel und bringt bei jeder Rückkehr Gold. Die Menge
  wächst mit dem Abstand der Märkte schneller als dieser. Auf einen Markt
  eines Gegners ist der Klick ein Gang, kein Handel. Fällt einer der Märkte,
  bleibt er stehen. **Ziel, gemessen im Prüfstand:** auf halber
  Kartenbreite bringt ein Karren je Minute etwas weniger Gold als ein
  Dorfbewohner am Goldvorkommen (Benutzer, Runde 161: „ein kleines bisschen
  weniger"; zuvor „etwa so viel"). Die Werte stehen in `HANDEL`, denn die
  Formel der Vorlage ist nur nachgemessen und nicht geprüft. Die Leiste
  nennt die Strecke. (Die sichtbare Ladung steht seit Runde 161 als AC-41.)
  **Gebaut in Runde 161:** der Auftrag `handel` mit Heimat- und Zielmarkt;
  Heimat ist der nächste eigene fertige Markt außer dem Ziel. Geladen wird
  am Ziel, dem Spieler gehört das Gold erst daheim, und die Tafel zählt es
  als gesammelt. Ein Ziel, das einem Gegner gehört — auch nach dem Ende
  einer Kündigung —, beendet die Strecke wie ein gefallener Markt, und zwar
  im selben Takt, nicht erst am Ende des Weges. Gemessen: ein Dorfbewohner
  am Gold mit dem Lager zwei Felder daneben bringt 20,0 Gold je Minute; ein
  Karren auf halber Kantenlänge (60 Felder) braucht 123 Sekunden für die
  Rundfahrt. Mit dem Faktor der Vorlage (0,46) brächte er 22 Gold je Fahrt,
  also 10,7 je Minute — die Hälfte. Gesetzt ist deshalb **`faktor: 0.77`**
  bei gleicher Form: 37 Gold je Fahrt, 18,0 je Minute, 90 % des
  Dorfbewohners (mit 0,86 wären es genau 20,0). Je Minute lohnt die lange
  Strecke mehr als die kurze.
- **AC-41** `offen` **Ladung des Karrens sichtbar** — Auf dem Heimweg trägt
  der Karren sichtbar Gold (Säcke oder Truhen auf der Ladefläche), auf dem
  Hinweg nicht. Abgetrennt von AC-40 in Runde 161: das ist eine Änderung an
  der Figur, und die Figuren baut seit 2026-11-10 eine eigene Sitzung mit
  Blender neu. Der Server schickt die Ladung schon (`l`, `a` am Karren).

### Stufe E — Häuser

Keine dieser Einheiten steht in der Vorlage; ihre Werte sind
**Startwerte** ([ADR-0014](../../docs/adr/0014-haeuser-statt-voelker.md)), eingestellt im
Gefechtsstand (`npm run konterkreis:strategie`, gleiche Kosten). Prüfbar
ist an jeder die **Entscheidung, die sie bringt**: wogegen sie gewinnt und
wogegen sie verliert — mindestens 80 % in beiden Richtungen, wie der
Konterkreis (fahrplan AC-9, AC-23). Jede braucht eine eigene Figur; die
kommen aus der Blender-Sitzung (Bauabfolge E6 bis E8).

- **AC-42** `offen` **Langbogenschütze nur für Eschenbruch** — Häuser schalten
  Einheiten frei (ADR-0014 Punkt 11): eine Einheit trägt in den Daten
  `haeuser: [...]`, gelesen überall dort, wo heute `zeitalter` gelesen wird
  (Menü des Gebäudes, Ausbildung auf dem Server, Absage, KI). Wer sie nicht
  ausbilden darf, sieht sie nicht im Menü, und der Server weist den Auftrag
  ab. Der erste Fall: der **Langbogenschütze** in der Schießanlage ab der
  Ritterzeit, nur Haus Eschenbruch. Startwerte: 35 Holz, 40 Gold, 35 Leben,
  Angriff 6, Reichweite 6, Rüstung 0/0, Tempo 0,96, Nachladezeit 2 s.
  **Entscheidung:** er schießt weiter als der Armbrustschütze (5) und
  gewinnt gegen ihn bei gleichen Kosten; gegen Ritter verliert er.
- **AC-43** `offen` **Pavesenschütze nur für Wehrstein** — Schießanlage ab der
  Ritterzeit, nur Haus Wehrstein: ein Schütze hinter einem großen Schild.
  Startwerte: 30 Holz, 45 Gold, 45 Leben, Angriff 4, Reichweite 4, Rüstung
  1/4, Tempo 0,85. **Entscheidung:** gegen Armbrustschützen gleicher Kosten
  gewinnt er, gegen Ritter und gegen Mangonels verliert er.
- **AC-44** `offen` **Söldner für Gold** — Kaserne ab der Ritterzeit, jedes Haus;
  kostet **nur Gold** und ist schnell da. Startwerte: 80 Gold (Silberfurt:
  64), 18 s, 55 Leben, Angriff 9, Rüstung 1/1, Tempo 1,0. **Entscheidung:**
  er verwandelt Gold in Truppen, ohne Nahrung und Holz, und ist dabei nicht
  besser als der Soldat — bei gleichen Kosten gewinnt keiner von beiden
  mehr als 60 %. Der Preis für Silberfurt ist ein Bonus des Hauses in den
  Daten, keine Verzweigung.
- **AC-45** `offen` **Kriegswölfe aus der Burg** — Spezialeinheit von Haus
  Eschenbruch. Schnell wie ein Reiter, aber **kein Reiter**: Klasse `tier`,
  der Speer hat keinen Bonus gegen sie. Startwerte: 60 Nahrung, 30 Gold,
  20 s, 55 Leben, Angriff 7, Rüstung 0/1, Tempo 1,35, Nachladezeit 1,5 s.
  **Entscheidung:** gegen Speerkämpfer gleicher Kosten gewinnen sie (der
  Ritter dort 0 von 20), gegen Soldaten verlieren sie.
- **AC-46** `offen` **Reiterschütze aus der Burg** — Spezialeinheit von Haus
  Rappenstein: schießt vom Pferd und wird **als Reiter und als Schütze**
  getroffen (Klassen `kavallerie` und `bogenschuetze`: der Speer und der
  Plänkler haben beide ihren Bonus). Startwerte: 40 Holz, 70 Gold, 34 s,
  60 Leben, Angriff 5, Reichweite 4, Rüstung 0/0, Tempo 1,4.
  **Entscheidung:** gegen Armbrustschützen gleicher Kosten gewinnt er —
  er holt sie ein und hält Abstand —, gegen Plänkler und Speerkämpfer
  verliert er.
- **AC-47** `offen` **Riese aus der Burg** — Spezialeinheit von Haus Wehrstein:
  viel Leben, langsam, ein großer Bonus gegen Gebäude — der Bonus der Ramme
  auf zwei Beinen, aber er schlägt auch Einheiten und wehrt sich.
  Startwerte: 120 Nahrung, 100 Gold, 40 s, 250 Leben, Angriff 10, Bonus
  +40 gegen Gebäude, Rüstung 2/1, Tempo 0,6, Nachladezeit 3 s. Gegen ein
  Gebäude (0 Rüstung gegen Hieb) sind das 50 je Schlag, 16,7 je Sekunde —
  zwei Drittel einer Ramme (127 alle 5 s, 25,4 je Sekunde).
  **Entscheidung:** er bricht Gebäude und hält dabei Nahkämpfer auf; gegen
  Armbrustschützen gleicher Kosten verliert er, denn er holt sie nie ein.
- **AC-48** `offen` **Meuchler aus der Burg** — Spezialeinheit von Haus
  Silberfurt: **getarnt** (kampf AC-22), wenig Leben, ein hoher Bonus gegen
  Dorfbewohner und Mönche. Startwerte: 40 Nahrung, 60 Gold, 25 s, 35
  Leben, Angriff 6, Bonus +10 gegen Dorfbewohner und Mönche, Rüstung 0/0,
  Tempo 1,1, Nachladezeit 1,5 s. Ein Dorfbewohner (25 Leben) fällt nach
  zwei Stichen, 1,5 Sekunden. **Entscheidung:** er trifft die Wirtschaft
  ungesehen; gegen Soldaten gleicher Kosten verliert er, und ein Turm oder
  eine Wache, die ihn auf zwei Felder sieht, stellt ihn.
- **AC-49** `offen` **Wiedergänger aus Gefallenen** — Spezialeinheit von Haus
  Distelhag, ein Untoter. Jede eigene Einheit, die stirbt, zählt für das
  Haus als ein **Gefallener** (gezählt wird beim Sterben schon heute, für
  die Tafel); ein Wiedergänger kostet 30 Gold **und einen Gefallenen**,
  bezahlt über denselben Weg wie Holz (`kosten`), und steht nach 10 s an
  der Burg — nicht dort, wo jemand fiel. Ein gefallener Wiedergänger zählt
  nicht noch einmal. Klassen `infanterie` und `untot`: er bekommt
  Schmiede und Hausbonus, kein Mönch bekehrt oder heilt ihn (die Liste
  `nicht` am Bekehren — ob das Heilen sie liest, ist zu prüfen), und er
  kostet keine Nahrung. Startwerte aus ADR-0014: 60 Leben, Angriff 6,
  Rüstung 1/0, Tempo 0,7, Nachladezeit 2 s. Gerechnet: gegen einen Soldaten
  (45 Leben, Rüstung 0) braucht er acht Schläge und behält 20 Leben, ein
  Drittel; vier Wiedergänger (je 4 an einem Ritter) fällen einen Ritter in
  sieben Runden, bevor der den ersten (sieben Schläge zu 1,8 s) fällt.
  **Entscheidung:** er bringt nach einer verlorenen Schlacht etwas zurück
  (spielziel AC-4), nie mehr, als verloren wurde; seine Antwort sind
  Schützen — gegen Bogenschützen gleicher Kosten verliert er.

### Stufe F — der Drache (aus ADR-0014)

Geschrieben in der Spec-Runde zur Stufe E, gebaut in Stufe F (fahrplan
AC-19). Werte und Dauern sind Startwerte aus ADR-0014.

- **AC-50** `offen` **Abrüsten** — Jede Einheit der Klassen Infanterie,
  Schützen und Reiter kann auf Befehl die Waffen ablegen und
  **Dorfbewohner** werden, nie umgekehrt; Untote, Belagerung, Mönch und
  Karren nicht. Das kostet 40 Nahrung und 20 Sekunden **Lehrzeit**, in
  denen die Einheit steht und nicht arbeitet; erstattet wird nichts
  (Benutzer, 2026-11-10). Hebt ein Soldat ein Ei auf (AC-51), rüstet er
  dafür ab. **Zu messen, bevor es `fertig` heißt:** eine KI, die ihre
  Dorfbewohner über Kasernen holt, gewinnt gegen die heutige nicht mehr als
  60 % (`npm run pruefstand:vergleich -- --probe`); sonst steigt der Preis.
- **AC-51** `offen` **Das Ei liegt, wird getragen** — Auf der Karte liegen
  Dracheneier, eines je zwei Spieler (abgerundet, mindestens eines), fern
  von jedem Start. Ein Dorfbewohner trägt ein Ei als Ladung wie Holz und
  bringt es in ein eigenes Kloster; stirbt er, liegt es dort. Ein Ei ist
  immer an genau einem Ort: am Boden, bei einem Träger oder in einem
  Kloster; fällt das Kloster, liegt es am Boden. Das Ei ist keine
  Siegbedingung.
- **AC-52** `offen` **Der Drache fliegt und brennt** — Höchstens einer je Spieler.
  Er fliegt ohne Wegsuche über Mauern, Wald und Wasser, und sein Feuer ist
  Flächenschaden wie der Stein des Mangonels (`flaeche`,
  `welt.einschlaege`). Startwerte: 500 Leben, Tempo 1,5, Rüstung 2 gegen
  Pfeile, Feuer mit Reichweite 3 alle 3 Sekunden auf ein Feld Umkreis, 15
  Schaden an Einheiten, +200 gegen Gebäude. **Drei Ziele im Gefechtsstand**
  (ADR-0014): eine Burg allein verliert gegen ihn, eine Burg mit fünf
  Armbrustschützen gewinnt; zehn Armbrustschützen töten ihn und verlieren
  dabei höchstens die Hälfte; KI gegen KI gewinnt, wer zuerst ruft, nicht
  öfter als 60 %. Eine Einstellung beim Eröffnen schaltet ihn ab.
- **AC-53** `offen` **Wo er fällt, liegt Ei** — Stirbt der Drache, liegt an
  der Stelle sein Ei; alle sehen die Ansage, und die Übersichtskarte zeigt
  die Stelle. Wer es heimträgt — auch der alte Besitzer —, kann neu rufen
  und bezahlt neu. Ein eigenes Wiederbeleben gibt es nicht.
- **AC-54** `offen` **Der Drache frisst** — Er kostet laufend Nahrung, so viel wie
  fünf Bauern ernten (5 × 0,32 je Sekunde, rund 96 je Minute). Ist die
  Nahrung bei null, hungert er und verliert Leben, bis er fällt — wo er
  gerade ist (dann AC-53). Das ist die Bremse statt einer Sperre durch das
  Zeitalter: früh ist er ein großer Teil der Wirtschaft, spät ein kleiner.

## Grenzfaelle

- Ein Sammelbefehl auf ein bereits leeres Feld greift sofort auf AC-13 zurueck.
- Wird ein Sammler mitten im Tragen auf einen **anderen Rohstoff** geschickt,
  verfällt seine Ladung (AC-15). Schickt man ihn nur woanders hin oder an einen
  Vorrat derselben Art, behält er sie — wie in der Vorlage.
- Gesammelt wird in ganzen Einheiten: der Vorrat verliert eine, sobald die
  Rate eine volle Einheit ergibt. Wer umbefohlen wird, verliert den
  angefangenen Bruchteil.
