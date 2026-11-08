# Einheiten und Befehle

**Bereich:** Strategie
**Kuerzel:** einheiten
**Stand:** 23/31 fertig · 7 offen · 1 zurueckgestellt

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
  Kaserne, Bogenschütze (25 Holz, 45 Gold, 35 s) und Plänkler (25 Nahrung,
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
- **AC-35** `offen` **Ramme** — In der Belagerungswerkstatt: 160 Holz, 75
  Gold, 36 s, 175 Leben, 0/180 Rüstung, Tempo 0,5, 2 Angriff mit +125 gegen
  Gebäude. Sie greift nur Gebäude an; ein Befehl auf eine Einheit ist ein
  Gang dorthin.
- **AC-36** `offen` **Mangonel** — In der Belagerungswerkstatt: 160 Holz, 135
  Gold, 46 s, 50 Leben, 0/6 Rüstung, Tempo 0,6, 40 Angriff, Reichweite 7 und
  eine Mindestreichweite von 3; trifft eine Fläche (kampf AC-19).
- **AC-37** `offen` **Mönch heilt** — Im Kloster: 100 Gold, 51 s, 30 Leben,
  Tempo 0,7. Er heilt eigene verletzte Einheiten in seiner Nähe, die nicht
  kämpfen, um einen Punkt je Sekunde; Gebäude und Belagerung nicht.
- **AC-38** `offen` **Mönch bekehrt** — Ein Befehl auf eine fremde Einheit in
  Reichweite 9: nach einer Dauer, deren Zufall aus dem Startwert der Partie
  kommt (deterministisch), gehört sie dem Spieler des Mönchs. Danach ruht
  der Mönch eine Weile. Gebäude, Belagerung und Mönche bekehrt er nicht.

## Grenzfaelle

- Ein Sammelbefehl auf ein bereits leeres Feld greift sofort auf AC-13 zurueck.
- Wird ein Sammler mitten im Tragen auf einen **anderen Rohstoff** geschickt,
  verfällt seine Ladung (AC-15). Schickt man ihn nur woanders hin oder an einen
  Vorrat derselben Art, behält er sie — wie in der Vorlage.
- Gesammelt wird in ganzen Einheiten: der Vorrat verliert eine, sobald die
  Rate eine volle Einheit ergibt. Wer umbefohlen wird, verliert den
  angefangenen Bruchteil.
