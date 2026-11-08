# Einheiten und Befehle

**Bereich:** Strategie
**Kuerzel:** einheiten
**Stand:** 21/24 fertig · 2 offen · 1 zurueckgestellt

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

## Grenzfaelle

- Ein Sammelbefehl auf ein bereits leeres Feld greift sofort auf AC-13 zurueck.
- Wird ein Sammler mitten im Tragen auf einen **anderen Rohstoff** geschickt,
  verfällt seine Ladung (AC-15). Schickt man ihn nur woanders hin oder an einen
  Vorrat derselben Art, behält er sie — wie in der Vorlage.
- Gesammelt wird in ganzen Einheiten: der Vorrat verliert eine, sobald die
  Rate eine volle Einheit ergibt. Wer umbefohlen wird, verliert den
  angefangenen Bruchteil.
