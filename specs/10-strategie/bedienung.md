# Bedienung

**Bereich:** Strategie
**Kuerzel:** bedienung
**Stand:** 84/89 fertig · 2 in QA · 3 offen

## Zweck

Ein Echtzeitspiel wird nicht daran gemessen, was es kann, sondern daran, wie
schnell man es tun kann. Diese Spec sammelt alles, was zwischen Absicht und
Befehl steht.

## Abgrenzung

| Gehoert dazu                        | Gehoert nicht dazu                          |
| ----------------------------------- | ------------------------------------------- |
| Auswahl, Kamera, Tasten, Rückmeldung | Was ein Befehl bewirkt → [Einheiten](einheiten-und-befehle.md) |
| Übersichtskarte, Anzeigen           | Vorraum und Beitritt → [Räume](../00-plattform/raeume.md) |
| Was ein Spieler sieht               | Was der Server schickt → [Übertragung](../00-plattform/uebertragung.md) |

## Abnahmekriterien

### Auswahl

- **AC-1** `fertig` **Rahmen wählt aus** — Ein aufgezogener Rahmen wählt alle eigenen Einheiten
  darin.
- **AC-2** `fertig` **Klick wählt eine** — Ein Klick ohne Rahmen wählt die nächste eigene Einheit in
  Reichweite.
- **AC-3** `fertig` **Umschalt erweitert** — Mit gedrückter Umschalttaste kommt zur Auswahl hinzu,
  statt sie zu ersetzen — beim Klick wie beim Rahmen. Einheiten kommen zu
  Einheiten; ein Klick mit Umschalt auf ein Gebäude oder ins Leere lässt die
  gewählten Einheiten stehen, gemischt wird nicht (ein Rechtsklick hieße für
  beide etwas anderes).
- **AC-4** `fertig` **Doppelklick wählt den Typ** — Alle sichtbaren Einheiten desselben Typs.
  „Sichtbar" heißt: der Fußpunkt steht im Bild; wer außerhalb steht, bleibt
  ungewählt. Mit Umschalt kommen sie zur Auswahl dazu.
- **AC-5** `fertig` **Auswahl merken** — `Strg`+`1` bis `9` legt eine Auswahl ab, die Zifferntaste
  ruft sie zurück. Ohne das ist ein Echtzeitspiel nicht spielbar. Abgelegt
  werden die gewählten Einheiten, sonst ein gewähltes eigenes Gebäude; wer
  seither gefallen oder bekehrt ist, fällt beim Zurückholen heraus. `Alt`+Ziffer
  legt ebenso ab: Chrome kann `Strg`+`1` bis `8` für den Wechsel der Tabs
  behalten, bevor die Seite die Taste sieht — das ist nicht geprüft, der
  Browserlauf schickt die Taste an der Leiste vorbei. Gelesen wird die Taste,
  nicht das Zeichen (`e.code`), damit es auf jeder Belegung dieselbe ist.
  Zweimal schnell gedrückt springt die Kamera noch nicht hin (Vorlage: ja).
- **AC-6** `fertig` **Ausgewählte sind aufgelistet** — Am unteren Rand mit Anzahl je Typ.

### Kamera

- **AC-7** `fertig` **Schieben mit Tasten** — `W A S D` und die Pfeiltasten.
- **AC-8** `fertig` **Zoom mit dem Rad** — Der Punkt unter dem Zeiger bleibt dabei stehen.
- **AC-9** `fertig` **Schieben am Bildschirmrand** — Mit der Maus am Rand, abschaltbar.
  Die äußersten 12 Bildpunkte des Spielbilds schieben in ihre Richtung, so
  schnell wie die Tasten; oben auch unter der Kopfzeile, die keine Maus
  annimmt. Verlässt die Maus das Bild oder das Fenster den Fokus, steht die
  Karte. Der Schalter steht in der Tastenübersicht (`?`), Vorgabe an; die
  Wahl merkt sich der Browser. Geht die Maus über den Rand aus dem Fenster
  hinaus, schiebt die Karte weiter (AC-56); auf eine Leiste gegangen oder
  ohne Fokus steht sie.
- **AC-10** `fertig` **Leertaste springt zur Basis** — Und ein zweites Mal zurück.
  Basis ist das eigene Dorfzentrum, das dem Startplatz am nächsten steht
  (ohne eines der Startplatz). Zurück geht es nur, solange die Kamera seit
  dem Sprung nicht bewegt wurde — wer weggeschoben hat, springt wieder zur
  Basis. Gehalten springt sie nicht hin und her; die Taste drückt keinen
  zuletzt geklickten Knopf (ohne Standard, nicht eigens geprüft).
- **AC-11** `fertig` **Übersichtskarte unten rechts** — Gelände, eigene und fremde Einheiten als
  Punkte, der Bildausschnitt als Rahmen. Klick springt hin.

### Befehle

- **AC-12** `fertig` **Rechtsklick befiehlt** — Laufen, sammeln oder angreifen, je nach Ziel. Kein
  Umschalten der Betriebsart.
- **AC-13** `fertig` **Der Befehl ist sofort sichtbar** — Ein Kringel am Zielpunkt, ohne auf die
  Antwort des Servers zu warten. Zehn Takte je Sekunde heißt bis zu 100 ms
  Verzögerung — ohne Rückmeldung fühlt sich das kaputt an.
  Gebaut mit AC-34 (der Ring wird im Klick selbst gesetzt); belegt, indem
  der Browserfall den Befehl anhält, ehe er hinausgeht: der Ring ist
  trotzdem gezeichnet, die Einheiten laufen erst nach dem Senden.
- **AC-14** `fertig` **Warteschlange mit Umschalt** — Mehrere Ziele hintereinander abarbeiten.
  Umschalt + Rechtsklick auf freien Boden hängt das Ziel hinten an, wenn die
  Einheit gerade geht; wer steht, geht sofort los. Ein Befehl ohne Umschalt
  verwirft die Reihe, ebenso alles, was den Gang unterbricht (Zurückschlagen,
  Sammeln, Bauen). Höchstens 20 Ziele je Einheit, damit ein Zustand nicht mit
  jedem Klick wächst (ADR-0005). Eine Gruppe bekommt an jedem Ziel eigene
  Felder. Im Bild: eine gestrichelte Linie über die wartenden Ziele, an jedem
  ein Ring. Der Server schickt nur die Zahl (`q`), die Punkte kennt der
  Browser, der sie geklickt hat. Umschalt auf einen Vorrat, einen Bau oder
  einen Gegner ist ein Befehl wie ohne — das Anhängen solcher Aufträge
  stünde als eigenes Kriterium an.
- **AC-15** `fertig` **Abbrechen mit Esc** — Hebt Auswahl und angefangene Platzierung auf.

### Rückmeldung

- **AC-16** `fertig` **Ladung ist sichtbar** — Ein beladener Dorfbewohner trägt seine Ware
  sichtbar auf dem Rücken: Holzbündel, Beerenkorb, Gold- oder Steinbrocken
  (→ [Darstellung](darstellung.md) AC-6).
- **AC-17** `fertig` **Rohstoffe zählen sichtbar hoch** — Nicht springen. Man muss sehen, dass die
  Wirtschaft läuft.
- **AC-18** `fertig` **Abgelehnte Befehle sagen warum** — „Zu wenig Holz", „Bevölkerung voll" — kurz
  eingeblendet, nicht als Fenster mit Knopf.
- **AC-19** `fertig` **Verbindungsverlust ist sichtbar** — Ein Hinweis im Bild, nicht erst
  stehenbleibende Einheiten (→ [Übertragung](../00-plattform/uebertragung.md) AC-9).
  Mitten im Bild und stehend, mit einem Knopf, der neu lädt und mit dem
  gemerkten Platz zurückkehrt. Ein Server, der schweigt, ohne die
  Verbindung zu schließen, zeigt noch nichts.
- **AC-20** `fertig` **Spielstand aller Spieler einsehbar** — Solange `Tab` gedrückt ist,
  steht mitten im Bild eine Tafel mit jedem Spieler: Farbe, Name,
  Zeitalter, und ob er ausgeschieden ist. Für einen selbst und für die
  Verbündeten, mit denen man die Sicht teilt (spielziel AC-19), auch
  Bevölkerung mit Wohnraum und die vier Vorräte; bei Gegnern steht dort ein
  Strich, denn der Server schickt sie nicht (kampf AC-13). Ist alles
  aufgedeckt oder sieht man ausgeschieden zu, kommt alles, und die Tafel
  zeigt es. Neu gefasst in Runde 189: „Rohstoffe aller Mitspieler"
  widersprach dem Nebel — ein verändertes Programm läse sie mit. Woran man
  auch beim Gegner sieht, wer vorne liegt, ist AC-47.

### Erster Eindruck

- **AC-21** `fertig` **Die erste Partie erklärt sich** — Beim ersten Start eine kurze Einblendung:
  ziehen, rechtsklicken, sammeln. Drei Sätze, wegklickbar.
  Sie steht links unter der Leiste, nicht auf der Mitte (AC-41), und hält
  die Partie nicht an. „Verstanden“ schließt sie, und der Browser merkt es
  sich — wer sie nie wegklickt, sieht sie in der nächsten Partie wieder.
  Gemerkt wird im Browser, nicht am Konto: wer mitspielt, hat keins.
- **AC-22** `fertig` **Tastenübersicht** — Auf `?` oder `F1`.
- **AC-23** `fertig` **Läuft auf einem Laptop-Bildschirm** — 1366 × 768 ohne Abschneiden: in
  jedem Zeitalter, mit dem Baumenü eines Dorfbewohners, dem Dorfzentrum und
  einer Gruppe aus jeder Art, ragt kein Bedienteil aus dem Fenster oder liegt
  auf einem anderen; Tastenübersicht und Spielstand stehen ganz im Bild; und
  kein Text ist zum Teil zu sehen und zum Teil nicht — was nicht passt, fehlt
  ganz (der Hinweis oben) oder wird nach Silben getrennt (lange Namen im
  Baumenü). Ein Knopf zählt als Rahmen. Die Bedienung auf dem Handy ist
  ausdrücklich **kein** Ziel — ein Strategiespiel mit Rahmenauswahl braucht
  eine Maus.

### Stufe A — Wirtschaft bedienen

- **AC-24** `fertig` **Leiste mit vier Rohstoffen** — Oben Holz, Nahrung, Gold, Stein und die
  Bevölkerung als „7/10". Die Zahlen zählen hoch statt zu springen (AC-17).
  Bis Häuser gebaut werden (A6), gibt allein das Dorfzentrum Wohnraum 5.
- **AC-25** `fertig` **Baumenü am Dorfbewohner** — Ist ein Dorfbewohner ausgewählt, zeigt der
  untere Rand die baubaren Gebäude mit Bild und Kosten. Was nicht bezahlbar
  ist, ist ausgegraut und nennt beim Überfahren, was fehlt. Ein Klick beginnt
  das Platzieren (→ [Bauen](bauen.md) AC-4).
- **AC-26** `fertig` **Gebäude zeigt Ausbildung** — Ein ausgewähltes eigenes Gebäude zeigt seine
  Einheiten und Verbesserungen mit Kosten und die Warteschlange mit
  Fortschrittsbalken; ein Klick auf einen Eintrag der Schlange bricht ihn ab.
- **AC-27** `fertig` **Tastenkürzel für Häufiges** — `H` wählt das Dorfzentrum, im
  Dorfzentrum bildet `Q` einen Dorfbewohner aus; mit ausgewähltem
  Dorfbewohner öffnet `B` das Baumenü und je ein Buchstabe wählt das Gebäude.
  Die Belegung steht in der Tastenübersicht (AC-22).
- **AC-28** `fertig` **Untätige Dorfbewohner finden** — Ein Knopf unten zeigt die Zahl der
  untätigen Dorfbewohner; er und die Taste `.` wählen den nächsten und holen
  ihn ins Bild.
- **AC-29** `fertig` **Ausgewähltes zeigt Werte** — Eine ausgewählte Einheit oder ein Gebäude
  zeigt unten Name, Leben und — beim Dorfbewohner — was er trägt.

### Nach Stufe A — Lücken aus der Rückschau

Eine Partie mit Wirtschafts-KI auf beiden Seiten, zehn Spielminuten, im
Browser angesehen (Rückschau nach Runde 54) und ehrlich mit dem Original
verglichen: die drei größten Lücken in Lesbarkeit und Aussehen.

- **AC-30** `fertig` **Verdeckte Einheiten als Umriss** — Steht eine Einheit hinter einem
  Gebäude, ist sie als Umriss in Spielerfarbe durch das Gebäude sichtbar. Im
  Dorf nach zehn Minuten verschwanden Dorfbewohner hinter Häusern und Lagern
  ganz. **Eingefärbt wird nur, was wirklich verdeckt ist** (seit dem ersten
  Spiel auf dem Server, 2026-11-12): der Teil der Gestalt, über dem das Bild
  des Gebäudes liegt — der Rest bleibt, wie er ist. Vorher war die ganze
  Gestalt blau, sobald ihre Mitte im Trefferkasten eines Gebäudes lag, auch
  neben einer Baustelle, von der erst das Fundament stand. Der Schlagschatten
  eines Gebäudes verdeckt niemanden, eine Baustelle unter der Hälfte auch
  nicht. **Messbar:** hinter dem Dorfzentrum trägt ein Dorfbewohner den
  Umriss, neben einer eben begonnenen Baustelle keiner.
- **AC-31** `fertig` **Arbeit ist zu sehen** — Wer sammelt, baut oder eine Farm bestellt,
  bewegt sich dabei sichtbar (Schlag, Bücken); wer untätig steht, steht still.
  Heute sehen Arbeitende und Wartende gleich aus.
- **AC-32** `fertig` **Arbeiter je Rohstoff** — Die Rohstoffleiste zeigt neben jedem Vorrat,
  wie viele Dorfbewohner gerade daran arbeiten. Ohne diese Zahl lässt sich ein
  Wirtschaftsplan nicht steuern.

### Stufe B — Zeitalter und Kampf bedienen

- **AC-33** `fertig` **Zeitalter steht im Bild** — Oben steht, in welchem Zeitalter man ist;
  während eines Aufstiegs zeigt das Dorfzentrum den Fortschritt, und der
  Wechsel wird einmal im Bild gemeldet.
- **AC-34** `fertig` **Angriffsbefehl ist erkennbar** — Ein Rechtsklick auf Feindliches zeigt
  kurz ein rotes Zeichen am Ziel, ein Befehl auf freies Gelände ein weißes
  (→ [Kampf](kampf.md) AC-1). Beide sind ein Ring auf dem Boden, der
  zusammenläuft und in 0,8 s verblasst; der rote bekommt vier Haken nach innen,
  damit die Unterscheidung nicht allein an der Farbe hängt. Das Zeichen steht
  **sofort**, ohne auf den Server zu warten — ein Weg hin und zurück wäre ein
  Zehntel später, und das ist für eine Rückmeldung auf einen Klick zu viel.

### Aus der Rückschau zur Stufe B (Runde 73)

Eine Partie KI gegen KI, nach dem Aufstieg angesehen und mit dem verglichen,
was ein Spieler von Age of Empires II erwartet. Drei Lücken, in dieser
Reihenfolge:

- **AC-35** `fertig` **Kampfwerte an der Auswahl** — Wer eine Einheit anwählt, sieht
  neben Namen und Leben auch Angriff, Rüstung nah und fern und die Reichweite;
  eine Einheit mit Bonusschaden nennt ihn mit dem Ziel („+15 gegen
  Kavallerie"). Heute steht dort nur „Bogenschütze 30/30" — der ganze
  Konterkreis der Stufe B ist für den Spieler unsichtbar, obwohl der Server
  die Werte schon schickt. Zu prüfen am Bild und an den Zahlen, die
  `welt.einheitenwert()` liefert (nicht an den rohen Daten: Verbesserungen
  müssen sich zeigen).
- **AC-36** `in-qa` **Militär bei Spielgröße erkennbar** — Bei Zoom 1 unterscheidet
  sich jede Kampfeinheit von einem Dorfbewohner **im Umriss** auf mindestens
  einem Drittel der gemeinsamen Fläche. Gemessen wird die Figur in der Höhe,
  die Zoom 1 ihr gibt (`figurHoeheBei(1)`, rund 29 Bildpunkte), und nur der
  Umriss — nicht Umriss **oder** Farbe wie bei [Darstellung](darstellung.md)
  AC-14. Begründung: bei 29 Bildpunkten ist die Farbe im Körper eine Handvoll
  Punkte, die gegen das Gelände verschwindet; was bleibt, ist die Gestalt.
  Das Drittel ist dasselbe wie in AC-14. **Gemessen vor der Arbeit** (Runde
  76): Dorfbewohner gegen Miliz 0,295 · Soldat 0,321 · Speerkämpfer 0,310 ·
  Bogenschütze 0,318 · Plänkler 0,304 — nur der Späherreiter liegt mit 0,705
  darüber, weil ihn sein Pferd breit macht. Der Hebel ist deshalb die Waffe
  **außerhalb** des Körperumrisses, nicht mehr Farbe im Körper. **Danach
  gemessen:** Miliz 0,401 · Soldat 0,352 · Speerkämpfer 0,371 · Bogenschütze
  0,356 · Plänkler 0,348 · Späherreiter 0,705. **Seit dem Bildumbau nicht
  mehr belegt** (2026-11-13, gemessen an den gerenderten Bildern):
  Armbrustschütze 0,188 · Soldat 0,192 · Miliz 0,195 · Plänkler 0,233 ·
  Bogenschütze 0,237 · Speerkämpfer 0,246 · Mönch 0,300 — sieben unter dem
  Drittel; Späherreiter 0,708 · Ritter 0,750 · Mangonel 0,850 · Marktkarren
  0,868 · Ramme 0,881 darüber. Die gerenderten Fußtruppen stehen auf dem
  Körper des Dorfbewohners, und was sie unterscheidet, liegt vor dem Rumpf.
  Die Grenze bleibt; der Hebel ist derselbe wie in Runde 76 — Schild und
  Waffe neben den Körper —, diesmal am Modell. Der Test steht bis dahin als
  erwartet rot (`test.fail`) und meldet sich, sobald alle bestehen.
- **AC-37** `fertig` **Die Spielzeit steht im Bild** — Oben, neben dem Zeitalter,
  steht die verstrichene Spielzeit als `m:ss`. Ohne sie lässt sich nicht
  sagen, ob ein Aufstieg schnell war — die erste Frage, die ein Spieler an
  seine eigene Partie stellt. Sie zählt die Takte des Servers, nicht die Uhr
  des Browsers, und steht im Zeitraffer entsprechend schneller. Die Minuten
  laufen über sechzig hinaus (`90:00` statt `1:30:00`), weil eine Partie nach
  90 Spielminuten unentschieden endet und die Frage „wie lange noch" sich so
  ohne Rechnen beantwortet.

### Aus Stufe C (Partieende)

- **AC-38** `fertig` **Aufgeben fragt einmal zurück** — Aufgeben ist im Spiel
  erreichbar und fragt genau einmal zurück; ein Fehlklick beendet die Partie
  nicht. Danach sieht der Spieler das Abschlussbild und darf zusehen
  ([Spielziel](spielziel.md) AC-6, AC-7). Erreichbar heißt: ein Knopf, der nicht
  neben einem viel benutzten liegt — nicht nur eine Taste.
- **AC-39** `fertig` **Wer kämpft, holt aus** — Eine Einheit, die gerade
  angreift, zeigt es: Nahkämpfer holen mit der Waffe aus und schlagen zu,
  Fernkämpfer spannen den Bogen — so, wie ein Dorfbewohner bei der Arbeit
  ausholt (AC-31). **Gefunden in der Rückschau zur Stufe C:** im Gefecht der
  KI stehen rote und blaue Kämpfer reglos nebeneinander, und wer gerade
  kämpft, ist nicht zu erkennen. **Messbar:** das Bild einer angreifenden
  Einheit beim Schlag unterscheidet sich in den Bildpunkten der Figur von
  ihrem Bild zwischen zwei Schlägen (seit AC-72 holt sie einmal je Schlag
  aus, vorher lief die Bewegung durch).
- **AC-40** `fertig` **Pfeile fliegen sichtbar** — Ein Schuss eines
  Fernkämpfers ist als Pfeil zu sehen, der vom Schützen zum Ziel fliegt und
  dort verschwindet; ein Gebäude trifft er ebenso. Gezeichnet im Browser aus
  den Schlägen, die der Server meldet — gerechnet wird weiter sofort, der
  Pfeil ist Darstellung (ADR-0001). **Gefunden in der Rückschau zur Stufe
  C:** zwischen Bogenschützen und ihrem Ziel ist nichts zu sehen; wer auf
  wen schießt, liest man nicht ab.
- **AC-41** `fertig` **Ansagen verdecken die Mitte nicht** — Die Ansage eines
  Zeitalterwechsels und andere große Meldungen stehen nicht über der Mitte
  des Spielfelds, wo das eigene Dorf meist im Bild ist. **Gefunden in der
  Rückschau zur Stufe C:** „Feudalzeit erreicht" lag mitten auf dem
  Dorfzentrum. **Messbar:** das Rechteck der Ansage überdeckt nicht das
  mittlere Drittel des Fensters.
- **AC-42** `offen` **Das Zeitalter steht am Dorf** — Dorfzentrum und Haus
  sehen in jedem Zeitalter anders aus, mit jedem Aufstieg steinerner und
  größer; das heutige Bild bleibt die Dunkle Zeit, Feudal- und Ritterzeit
  bekommen je eine eigene Fassung (die Imperialzeit kommt mit Stufe F). So
  liest man das Zeitalter eines Gegners an seinem Dorf ab, wie in der
  Vorlage. **Gefunden in der Rückschau zur Stufe D:** das Dorf der KI sah
  nach dem Aufstieg in die Ritterzeit aus wie in der Feudalzeit —
  Dorfzentrum und Häuser unverändert, nur die Leiste oben sagte es.
  **Messbar:** auf der Schautafel stehen die drei Fassungen nebeneinander;
  der Anteil verschiedener Bildpunkte zwischen je zweien wird gemessen,
  bevor eine Schwelle dasteht (Anweisung, Abschnitt 4).
- **AC-43** `fertig` **Voller Wohnraum fällt auf** — Wartet ein Auftrag, weil
  die Bevölkerung voll ist, zeigt das die Bevölkerungsanzeige oben, auch
  wenn das wartende Gebäude nicht gewählt ist. Heute steht der Grund nur in
  der Auswahlleiste dieses Gebäudes (bauen AC-15). **Gefunden in der
  Rückschau zur Stufe D:** bei 65 / 65 sah die Anzeige oben aus wie bei
  jeder anderen Zahl — ob irgendwo eine Schlange stillsteht, verrät sie
  nicht. **Messbar:** die Anzeige trägt eine Kennzeichnung, solange ein
  eigenes Gebäude wartet, und verliert sie, sobald keines mehr wartet.
  Gebaut: die Anzeige wird rot umrandet (Klasse `wartet`, Titel „Bevölkerung
  voll — ein Auftrag wartet, Haus bauen"), gefragt wird `ansicht.wartetEtwas()`
  nach dem `w` der eigenen Gebäude. Voll allein reicht nicht: nach dem
  Abbrechen des wartenden Auftrags steht 5 / 5 wieder ohne Rand.
- **AC-44** `offen` **Ein Gefecht hinterlässt Spuren** — Gefallene liegen
  länger als heute zwei Sekunden und verblassen dabei; ein zerstörtes
  Gebäude hinterlässt Trümmer auf seinem Platz, die nichts sperren und nach
  einer Weile vergehen. So sieht man nach einem Gefecht, wo es war und wer
  verloren hat. Gezeichnet im Browser aus dem, was er gesehen hat — der
  Server rechnet weiter nur Lebende (ADR-0001). Die Dauern stehen nicht in
  der Vorlage; sie werden beim Bauen begründet. **Gefunden in der Rückschau
  zur Stufe D:** auf drei Bildern eines Gefechts im Dorf des Gegners lag
  kein Gefallener, obwohl dort gekämpft wurde; zerstörte Häuser sind
  spurlos weg. (Die Bilder entstanden im Zeitraffer, in dem zwei Sekunden
  ein Augenblick sind — aber auch ohne ihn reicht das nicht zum Hinsehen.)

Aus den offenen Kriterien oben gehören zu Stufe A: AC-6 (Auswahl
aufgelistet), AC-11 (Übersichtskarte — auf 120 × 120 unverzichtbar), AC-15
(Esc), AC-17 (Zahlen zählen hoch), AC-18 (Absagen sagen warum).

### Stufe E — Häuser

- **AC-45** `fertig` **Stufen heißen nach Rang** — Am Bildschirm heißen
  die vier Zeitalter **Landsitz, Lehen, Fürstentum und Krone**
  ([ADR-0014](../../docs/adr/0014-haeuser-statt-voelker.md) Punkt 9):
  oben in der Leiste, am Auftrag zum Aufstieg, in Absagen, in der Ansage
  des Wechsels und auf der Tafel am Ende. Die gebeugten Formen („des
  Lehens", „im Fürstentum") stehen mit dem Namen in den Daten, nicht im
  Browser zusammengesetzt. Dorfbewohner bleiben Dorfbewohner; Bezeichner
  (`feudalzeit`), Dateinamen und die Arbeitsnamen der Stufen in den Specs
  bleiben. **Messbar:** ein Wächter findet die alten Namen (Dunkle Zeit,
  Feudalzeit, Ritterzeit, Imperialzeit) in keinem Text, den `public/` oder
  die Daten auf den Bildschirm bringen.
  **Fertig in Runde 166:** die Formen stehen in `ZEITALTER` (`artikel`,
  `genitiv`, `ab`, `zum` — „das Lehen", „des Lehens", „ab dem Lehen",
  „zur Krone"); Name und Knopftitel der Aufstiege kommen von dort. Der
  Wächter ist `tests/waechter-zeitalter.test.mjs`: jede Zeichenkette außerhalb
  von Kommentaren in `public/` und in Welt, Daten und Steckbrief.
- **AC-46** `offen` **Das Wappen zeigt das Haus** — Im Warteraum neben dem Namen
  und am Banner über dem eigenen Dorfzentrum steht das Wappen des Hauses
  (Esche, Hengst, Turm, Waage, drei Disteln). Es ist ein Zeichen, keine
  Farbe: zwei Spieler desselben Hauses unterscheidet die Farbe ihres
  Platzes. Bei Zoom 1 sind die fünf Wappen voneinander unterscheidbar.
  Die Wappen kommen aus der Blender-Sitzung.
- **AC-47** `fertig` **Punkte für alle sichtbar** — Je Spieler eine Punktzahl
  in der Tafel aus AC-20, auch für Gegner: sie verrät, wer vorne liegt, nicht
  seine Vorräte. Gerechnet auf dem Server aus dem, was über die Partie zählt
  (gesammelt, ausgebildet, erforscht, Zeitalter). **Die Rechnung:**
  ein Punkt je 10 Rohstoffe, die abgeladen oder durch Handel gutgeschrieben
  wurden (dieselbe Zahl wie „gesammelt“ auf der Tafel am Ende), ein Punkt je
  10 Rohstoffe, die die ausgebildeten Einheiten gekostet haben, und ein Punkt
  je 5 Rohstoffe, die erforschte Verbesserungen und erreichte Aufstiege
  gekostet haben — Wissen zählt doppelt, wie im Original. Abgerundet, am
  Anfang 0; die drei Dorfbewohner vom Start und bekehrte Einheiten zählen
  nicht, Verluste ziehen nichts ab (Punkte für Siege im Kampf sind nicht
  Teil dieses Kriteriums). Ein Dorfbewohner bringt 5 Punkte, der Aufstieg
  ins Lehen 100. **Messbar:** ein Regeltest rechnet die Punkte nach einer
  Ausbildung, einer Verbesserung und einem Aufstieg aus den Daten nach; über
  das Netz kommt die Zahl auch beim Gegner an, dessen Vorräte im Nebel
  fehlen; im Bild steht sie in der Tafel auf `Tab` für jeden Spieler.
- **AC-48** `fertig` **Mehrere Bauten mit Umschalt** — Wer beim Setzen
  einer Baustelle Umschalt hält, behält den Bauplatz in der Hand und setzt
  die nächste; erst ein Klick ohne Umschalt, Rechtsklick oder Esc legt ihn
  weg. Wer von den Bauleuten schon baut, baut die neue Baustelle danach —
  hinten an seine Reihe, wie die Felder einer gezogenen Mauer (bauen
  AC-30); wer nicht baut, beginnt sofort. Jede Baustelle wird beim Setzen
  bezahlt wie ohne Umschalt, die Reihe braucht deshalb keine eigene Grenze
  (ADR-0005: sie kostet Rohstoffe, nicht nur Klicks). Ein Klick ohne
  Umschalt verwirft die Reihe nicht, was schon steht, bleibt Baustelle —
  wie im Original. Fortsetzung von AC-14: dort hängt Umschalt Wege an.
  Mauern bleiben, wie sie sind: gezogen ist schon eine Reihe. **Messbar:**
  ein Dorfbewohner, der ein Haus baut, baut mit Umschalt zwei weitere der
  Reihe nach, ohne neuen Befehl; ohne Umschalt geht er sofort zur neuen.
  Im Browser bleibt der Bauplatz nach dem Klick mit Umschalt in der Hand,
  und drei Baustellen stehen im Bild.
- **AC-49** `fertig` **Punkte für Siege im Kampf** — Zu den Punkten aus
  AC-47 kommt ein Punkt je 5 Rohstoffe, die fremde Einheiten und Gebäude
  gekostet haben, die man getötet oder zerstört hat — wie der Wert des
  Militärs im Original (ein Fünftel des Vernichteten). Gezählt wird nur gegen
  Gegner (`welt.feindlich`): wer eigene oder verbündete trifft, etwa mit dem
  Stein eines Mangonels, bekommt nichts. Gutgeschrieben wird dem Besitzer
  des Schlags, der das Ziel fallen lässt — fallen zwei Schläge in denselben
  Takt, dem ersten in der Reihe des Servers, so dass dieselbe Partie immer
  gleich zählt. Eine Baustelle zählt mit ihren vollen Kosten, ein Feld
  Mauer mit seinen. Bekehrungen und Aufgeben zählen nicht: dort fällt kein
  Schlag. Der Verlierer verliert keine Punkte. **Messbar:** ein Regeltest
  lässt eine Miliz einen Dorfbewohner und ein Haus des Gegners zerstören und
  rechnet die Punkte aus den Daten nach; ein Mangonel, der eigene trifft,
  bringt nichts; im Bild steht der Sieger in der Tafel auf `Tab` vorn.
- **AC-50** `fertig` **Angriffe hintereinander mit Umschalt** — Umschalt
  und Rechtsklick auf einen Gegner hängt ihn an, wenn die Einheit gerade
  auf Befehl angreift; fällt ihr Ziel, nimmt sie das nächste der Reihe,
  ohne neuen Befehl — etwa eine Ramme, die drei Häuser nacheinander
  einreißt. Wer steht, geht, sammelt oder sich nur von selbst wehrt, greift
  sofort an, wie ohne Umschalt. Was inzwischen gefallen, bekehrt oder kein
  Gegner mehr ist, wird übersprungen; ist ein Ziel unerreichbar, kommt das
  nächste. Ein Befehl ohne Umschalt verwirft die Reihe, ebenso alles, was
  den Angriff beendet. Höchstens 20 wartende Ziele wie bei AC-14, ein Ziel
  steht nur einmal darin. Im Bild dieselbe gestrichelte Linie wie bei
  AC-14, an jedem wartenden Gegner ein roter Ring; der Server schickt nur
  die Zahl (`q`). Fortsetzung von AC-14 und AC-48; Sammeln mit Umschalt
  bleibt ein Befehl wie ohne. **Messbar:** ein Regeltest lässt eine Miliz
  zwei angehängte Häuser nacheinander einreißen, überspringt ein
  inzwischen gefallenes und verwirft die Reihe mit einem Befehl ohne
  Umschalt; im Browser stehen nach drei Klicks mit Umschalt zwei rote
  Ringe in der Linie, und alle drei Häuser fallen.

### Aus dem ersten Spiel auf dem Server (2026-11-12)

Der Benutzer hat die erste Partie auf dem Server gespielt und aufgeschrieben,
was ihn aufhielt. Was davon Bedienung ist, steht hier; die Regeln dazu stehen
unter [Einheiten](einheiten-und-befehle.md) AC-55 und AC-56,
[Bauen](bauen.md) AC-36 und [Räume](../00-plattform/raeume.md) AC-17 und AC-18.

- **AC-51** `fertig` **Der Klick trifft das Bild** — Ein Rechtsklick meint, was
  unter dem Zeiger zu **sehen** ist, nicht das Bodenfeld dahinter. Ein Schaf,
  ein Baum, ein Haus stehen über ihrem Fußpunkt: wer auf den Körper des
  Schafs klickte, zeigte auf den Boden ein, zwei Felder dahinter, und der
  Dorfbewohner ging dorthin, statt zu schlachten. Getroffen wird im Bild, in
  der Rangfolge des Servers — fremde Einheit, eigenes Schaf, Gebäude, Vorrat,
  dann erst der Boden —, und gesendet wird der Ort dessen, was gemeint ist.
  Was hinter einem Gebäude steht, fängt den Klick auf das Gebäude nicht ab.
  Die Regel bleibt auf dem Server; der Browser beantwortet dieselbe Frage
  noch einmal, wie schon beim Zeichen am Ziel (Grenzfall zu AC-34).
  **Messbar:** ein Rechtsklick auf den Körper eines Schafs gibt den Auftrag
  zu schlachten, einer auf die Krone eines Baums den, an diesem Baum Holz zu
  hacken.
- **AC-52** `fertig` **Der Zeiger sagt den Befehl** — Mit einer Auswahl steht
  am Zeiger, was ein Rechtsklick an dieser Stelle täte, sobald es mehr wäre
  als ein Gang: „Holz hacken", „Beeren sammeln", „Gold abbauen", „Stein
  abbauen", „Schlachten", „Fleisch holen", „Mitbauen", „Farm bestellen",
  „Abladen", „Handeln", „Angreifen", „Bekehren" — dazu eine Raute um das
  Ziel, rot für Angriff, golden für Arbeit. Nach dem Klick steht dieselbe
  goldene Raute als Zeichen am Ziel (weiß bleibt der Gang, rot der Angriff,
  AC-34). Wer einen Dorfbewohner zum Holz schickt, sieht so **vor** dem
  Klick, ob er den Baum trifft oder das Gras daneben. Kein Wort ohne Auswahl,
  beim Platzieren, beim Rahmenziehen und im Angriffslauf. **Messbar:** über
  einem Baum steht „Holz hacken" am Zeiger, über Gras nichts; nach dem Klick
  trägt das Zeichen am Ziel die Arbeit.
- **AC-53** `fertig` **Rechtsklick auf die Übersichtskarte** — Ein Rechtsklick
  auf die Übersichtskarte schickt die Auswahl an diese Stelle der Karte, mit
  Umschalt angehängt wie im Bild (AC-14); dort steht kurz ein Ring. Gemeint
  ist der Boden: was an der Stelle steht, wird von dort nicht angegriffen und
  nicht bearbeitet. Der Linksklick springt weiter hin (AC-11). **Messbar:**
  nach einem Rechtsklick in die Mitte der Übersichtskarte geht der gewählte
  Reiter dorthin, und die Kamera steht, wo sie stand.
- **AC-54** `fertig` **Die Leiste bleibt stehen** — Ein Knopf der Auswahlleiste
  steht nach dem Klick dort, wo er vorher stand. Die Schlange wuchs mit jedem
  Auftrag in die Breite und schob die Leiste samt Knopf weiter: fünfmal
  „Dorfbewohner" hieß fünfmal neu zielen. Die Schlange hat jetzt ihren festen
  Platz — der laufende Auftrag groß, bis zu vierzehn wartende in zwei Reihen
  daneben —, und warum ein Auftrag wartet, steht über der Leiste statt in
  ihr. **Messbar:** der Knopf „Dorfbewohner" steht nach fünf und nach
  fünfzehn Aufträgen auf den Bildpunkt dort, wo er ohne Auftrag stand.
- **AC-55** `fertig` **Das Menü sagt die Wirkung** — Zu jedem Knopf, der etwas
  kostet, zeigt eine Tafel über der Leiste, **was es bringt**, nicht nur den
  Preis: eine Verbesserung ihre Wirkung in Zahlen („Dorfbewohner: +15 Leben,
  +1 / +2 Rüstung"), eine Einheit Leben, Angriff, Rüstung, Reichweite, Tempo,
  Sicht und ihren Bonus, ein Gebäude, wozu es da ist (Wohnraum, Lager für …,
  bildet aus, erforscht), der Aufstieg, was er freischaltet und was er
  verlangt; dazu die Dauer, und was fehlt, wenn es zu teuer ist. Die Sätze
  einer Verbesserung schreibt der **Server** aus denselben Daten, mit denen
  er rechnet (`bringt.js`) — der Browser liest keine Wirkungen
  (`tests/waechter-wirkungen.test.mjs`). Die Tafel erscheint unter der Maus
  und mit dem Fokus der Tastatur und bleibt nach dem Klick stehen.
  **Messbar:** ein Regeltest verlangt von jeder Verbesserung einen Satz oder
  einen Tausch und rechnet die Zahl des Webstuhls aus den Daten nach; im
  Browser steht über dem Webstuhl seine Wirkung.
- **AC-56** `fertig` **Schieben über den Fensterrand** — Ohne Vollbild ist
  der Rand zum Schieben (AC-9) nur zwölf Bildpunkte breit, und wer zügig
  dorthin fährt, ist schon aus dem Fenster — oben und unten vor allem, wo
  Adressleiste und Taskleiste liegen. Verlässt die Maus das Fenster über
  einen Rand, schiebt die Karte in dieser Richtung weiter, bis sie
  zurückkommt oder das Fenster den Fokus verliert. Geht sie auf eine Leiste
  im Fenster, steht die Karte wie bisher. **Wird das Fenster kleiner**,
  während die Maus im alten Bereich steht, meldet der Browser dasselbe
  Verlassen — das zählt nicht, die Karte bleibt stehen (gefunden an einem
  Bildnachweis, auf dem nach dem Verkleinern nur Schwarz stand). Geprüft
  mit dem Ereignis, das der Browser beim Verlassen schickt — Playwright
  bewegt die Maus nicht aus dem Fenster; mit einer echten Maus am
  Fensterrand ist es **nicht geprüft**.
- **AC-57** `fertig` **Punkte ständig im Bild** — Über der Übersichtskarte
  steht die Liste der Spieler mit ihren Punkten (AC-47), der Führende oben,
  der eigene Name fett, Ausgeschiedene durchgestrichen — ohne Taste, wie in
  der Vorlage. Sie nimmt keine Maus an. Die ganze Tafel bleibt auf `Tab`
  (AC-20). **Messbar:** die Liste steht im Bild, und wer mehr gesammelt hat,
  steht oben.
- **AC-58** `fertig` **Fremdes ansehen** — Ein Linksklick auf eine fremde
  Einheit oder ein fremdes Gebäude, die man sieht, zeigt in der Leiste Name,
  Besitzer, Leben und Kampfwerte — mit den Verbesserungen des Besitzers, wie
  in der Vorlage. Mehr nicht: es steht nicht in der Auswahl, die Leiste hat
  keine Knöpfe, ein Rechtsklick befiehlt nichts. Am Boden liegt der Ring
  gestrichelt statt durchgezogen. Eigenes hat Vorrang; die Ansicht endet,
  wenn etwas Eigenes gewählt wird, mit Esc, und wenn das Angesehene fällt,
  bekehrt wird oder im Nebel verschwindet. Ein erinnertes Gebäude im Nebel
  zeigt, was man zuletzt von ihm gesehen hat (kampf AC-12).
- **AC-59** `fertig` **Geräusche zu Ereignissen** — Was geschieht, ist zu
  hören, je mit eigenem Klang: eine eigene Einheit ist fertig, ein eigenes
  Gebäude steht, eine Verbesserung ist erforscht, der Aufstieg ist vollzogen,
  ein Angriff wird gemeldet (kampf AC-14), eine eigene Einheit fällt, der
  Server sagt ab, die Partie ist gewonnen oder verloren. Derselbe Klang
  beginnt nicht zweimal im selben Augenblick — zehn Dorfbewohner aus einem
  Takt sind einer —, und das Horn zum Angriff ruft höchstens alle acht
  Sekunden. Alles wird im Browser erzeugt (`public/ton.js`): keine
  Klangdatei, kein Material aus dem Original (darstellung AC-11). Die
  Ansicht nennt nur Ereignisse beim Namen (`ansicht.beiEreignis`). **Aus dem
  ersten Spiel auf dem Server (2026-11-12):** „Es fehlt ein Ton … Geräusche,
  für jede Entwicklung, wenn Einheiten gebaut sind, wenn man angegriffen
  wird." **Nicht geprüft:** wie es klingt — gemessen ist, dass am Ausgang
  etwas ankommt, gehört hat es beim Bauen niemand.
- **AC-60** `fertig` **Musik im Spiel** — Während der Partie spielt Musik,
  und sie ist ein Stück, kein Würfeln: ein Thema in d-Moll für Horn über
  Streichern, Bass und Trommeln, ein heller Mittelteil, ein Schluss über der
  Dominante — als Noten in `public/ton.js` (`SAETZE`, `AKKORDE`), eigens
  geschrieben, kein fremdes Stück und keine Aufnahme. Dazwischen Ruhe: Laute
  und Flöte, jedes Mal neu gewürfelt aus den Tönen des Akkords, manchmal
  nur die Streicher. **Wird gekämpft, treibt sie:** die Trommeln werden
  dichter, der Bass geht in Achteln, die Ruhe fällt aus — auch mitten im
  Takt der Laute; eine halbe Minute nach dem letzten Schlag kommt die Ruhe
  zurück. Vom Kampf erfährt sie über die Geräusche (AC-62) und das Horn zum
  Angriff, auch wenn die Geräusche abgeschaltet sind. Sie beginnt mit der
  ersten Handlung im Spiel (vorher lässt der Browser keinen Ton zu), schweigt
  im Vorraum und in einem Fenster im Hintergrund, und steht unter den
  Signalen. **Rückmeldung des Benutzers (2026-11-12)** zur ersten Fassung
  (gezupfte Folgen auf fünf Tönen): „Der Ton ist sehr langweilig, mach doch
  da was Schöneres, bisschen schöne kämpferische Hintergrundmusik." **Nicht
  geprüft:** wie sie klingt — gemessen ist der Pegel (Effektivwert 0,06, im
  Kampf 0,08, keine Spitze über 0,65), gehört hat sie beim Bauen niemand.
- **AC-61** `fertig` **Ton abschaltbar** — In der Tastenübersicht stehen zwei
  Schalter, „Geräusche" und „Musik", einzeln; der Browser merkt sich die
  Wahl wie beim Schieben am Rand (AC-9).
- **AC-62** `fertig` **Kampf und Arbeit hörbar** — Was im Bild geschieht, ist
  dort zu hören: Schwerter klirren, wo Nahkämpfer schlagen (jeder dritte Hieb
  trifft kein Eisen), die Ramme und ein getroffenes Gebäude klingen dumpf,
  ein Pfeil hat Sehne und Zischen, der Mangonel seinen Wurfarm und der Stein
  seinen Einschlag, ein Gebäude stürzt hörbar ein; leise dazu Axt, Hacke
  und Hammer der Dorfbewohner. Jedes Geräusch wird jedes Mal neu gewürfelt.
  **Nur was im Bild steht, klingt** — am Rand leiser als in der Mitte, weit
  herausgezoomt leiser als nah, und auf der Seite, auf der es geschieht
  (`ansicht.klangAn`). Schläge im Nahkampf und bei der Arbeit meldet der
  Server nicht einzeln; sie klingen im Takt der Figur, wenn Schwert oder
  Werkzeug unten ist (`ansicht.schlagHoeren`). Ein Gefecht bleibt ein
  Klirren: derselbe Klang beginnt höchstens siebenmal je Sekunde. Erzeugt wie
  alles (AC-59), kein Material aus dem Original. **Rückmeldung des Benutzers
  (2026-11-12):** „Man soll auch Schwerter klirren hören bei Kämpfen und so."
  **Nicht geprüft:** wie es klingt; und ein Dorfbewohner, der Holz getragen
  hat und dann kämpft, klingt nach Axt — der Zustand sagt nicht, was er tut.

### Aus dem Spiel auf dem Server (2026-11-13)

Rückmeldungen des Benutzers aus seinen Partien gegen die KI. Die Nummern 63
bis 66, 68 und 69 waren für die Punkte derselben Liste vorgemerkt und sind
inzwischen alle eingetragen.

- **AC-63** `fertig` **Vorräte lassen sich ansehen** — Ein Klick auf einen
  Baum, einen Beerenstrauch, ein Gold- oder Steinvorkommen zeigt unten
  seinen Namen und wie viel noch da ist („Holz: 73 von 100"), ein Klick auf
  ein fremdes Schaf oder ein erlegtes — auch das eigene — „Nahrung: 41 von
  100" und den Besitzer. Angesehen wird wie bei AC-58: gestrichelt umrandet,
  ohne Befehle, und der Klick trifft das Bild, nicht das Feld dahinter
  (AC-51); das eigene lebende Schaf wird weiter gewählt (einheiten AC-22).
  Die Zahl läuft mit, solange man hinsieht. Den Rest eines Vorrats schickt
  der Server nur dem, der ihn ansieht, und nur, wenn er das Feld sieht
  (kampf AC-13) — im Nebel steht der Name und dass sich der Rest erst in
  Sicht zeigt. **Rückmeldung des Benutzers:** „Auf Baum, Holz, Schafe, etc.
  kann man nicht draufklicken um zu sehen, wie viel noch da ist (v.a. tote
  schafe".
- **AC-64** `fertig` **Baumenü auf zwei Seiten** — Das Baumenü eines
  Dorfbewohners (AC-25) hat zwei Seiten: **Wirtschaft** (Haus, Mühle, Lager,
  Farm, Schmiede, Kloster, Universität, Markt, in der Krone Wunder und
  zweites Dorfzentrum) und **Militär** (Kaserne,
  Schießanlage, Stall, Außenposten, Belagerungswerkstatt, Wachturm,
  Steinmauer, Tor, Burg). Zwei Reiter links wechseln die Seite. Wer neu zu
  bauen beginnt, sieht die Wirtschaft: nach jeder neuen Auswahl und nachdem
  ein Gebäude gesetzt oder das Setzen abgebrochen ist; wer mit Umschalt
  weitersetzt (AC-48), bleibt auf seiner Seite. Auf welcher Seite ein
  Gebäude steht, sagen die Daten (`seite` in `GEBAEUDE`), nicht der
  Browser. **Die Tasten bleiben** (AC-27): `B` und der Buchstabe wählen ein
  Gebäude, gleich welche Seite offen ist — sie zeigt sich dann von selbst —,
  und noch einmal `B` wechselt die Seite. **Messbar:** im Fürstentum stehen
  alle achtzehn Gebäude im Menü, sichtbar sind die neun der offenen Seite in
  höchstens zwei Reihen (vorher drei Reihen zu sechs: auf 1366 × 768 fast die
  halbe Bildhöhe); was Kampfeinheiten ausbildet, schießt oder sperrt, steht
  auf der Militärseite, und die Wirtschaft trägt höchstens elf Gebäude, das
  Militär höchstens zehn. **Eine Kampfeinheit** ist eine Einheit mit Angriff
  über null, die kein Dorfbewohner ist (Klasse `dorf`) — wie bei der KI
  (`ki.kaempft()`), nur zählt hier die Belagerung mit. Der Dorfbewohner
  (Angriff 3) ist keine, der Mönch und der Marktkarren (Angriff 0) auch
  nicht: Dorfzentrum, Kloster und Markt stehen bei der Wirtschaft. In der
  Krone sind es elf und neun.
  **Rückmeldung des Benutzers:** „gebäude muss man irgendwie beim
  dorfbewohner etwas organisieren, dass das nicht zu breit wird."
  **Geändert 2026-11-22** (Benutzer: „Ac 64 passt seine Empfehlung"): vorher
  höchstens zehn je Seite, und als Kampfeinheit galt jede Einheit mit
  Angriff, auch der Dorfbewohner — damit stand das zweite Dorfzentrum (bauen AC-57) beim Militär,
  und dessen Seite des Technologiebaums ragte auf 1366 × 768 aus dem Rahmen
  (AC-86).
- **AC-65** `fertig` **Forschung erkennbar, laufende grau** — Ein Knopf, der
  forscht (eine Verbesserung oder der Aufstieg), trägt einen goldenen Rand
  und eine goldene Ecke — am Knopf wie in der Schlange —, ein Knopf, der eine
  Einheit ausbildet, nicht. Wird eine Verbesserung schon erforscht, gleich in
  welchem eigenen Gebäude, ist ihr Knopf überall grau und trägt „läuft"; ein
  Klick bestellt nichts und sagt „… wird schon erforscht." Abgebrochen ist er
  wieder frei. Der Server sagte den zweiten Auftrag schon ab (bauen AC-21) —
  nur stand es vorher nirgends. **Rückmeldung des Benutzers:** Forschung und
  Ausbildung sähen gleich aus, und dieselbe Forschung ließ sich in zwei
  Schmieden anklicken.

- **AC-66** `fertig` **Menü mit Weg zum Vorraum** — Oben rechts steht „Menü",
  `F10` öffnet und schließt es, `Esc` schließt es. Darin: Weiterspielen,
  Pause, Tasten und Ton, **Zurück in den Vorraum**. Die Partie läuft unter
  dem Menü weiter — zu mehreren hält niemand die anderen an, nur weil er
  nachsieht. „Zurück in den Vorraum" gibt nicht auf: das Fenster vergisst
  seinen Platz, die Partie läuft ohne den Spieler weiter oder wartet, wenn
  niemand mehr da ist (raeume AC-17), und der Vorraum bietet die Rückkehr an
  (raeume AC-18); das sagt ein Satz unter dem Knopf. Ist die Partie vorbei
  oder der Spieler ausgeschieden, führt derselbe Knopf ohne Angebot in den
  Vorraum — er steht dann auch auf der Abschlusstafel. Aufgeben und Bündnis
  lösen bleiben oben rechts mit ihrer Rückfrage. **Rückmeldung des
  Benutzers:** „wir brauchen irgendwie ein menü, ich kann zwar auf Pause
  drücken, aber nicht zurück in die Lobby oder so." **Nachgebessert
  (2026-11-18):** der Knopf auf der Abschlusstafel tat nichts — die Tafel
  lässt Klicks zur Karte durch, und nur „Revanche" nahm sie wieder an. Der
  Browserfall klickt ihn seitdem mit der Maus. **Rückmeldung des
  Benutzers:** „hat jeweils unten nen Button der irgendwie heißt zruück zum
  Vorraum oder so, aber der tut nichts".

- **AC-67** `fertig` **Zeitalter in der Punkteliste** — In der Punkteliste
  (AC-57) steht hinter jedem Namen das Zeitalter des Spielers als römische
  Ziffer in Klammern: „Anna (II) 412". Es zieht mit dem Aufstieg nach, bei
  jedem, auch für Gegner im Nebel — das Zeitalter schickt der Server ohnehin
  jedem (AC-20). Die Zeile bleibt eine Zeile; ein langer Name wird gekürzt,
  nicht die Ziffer. **Rückmeldung des Benutzers:** man sehe nicht, in welchem
  Zeitalter der Gegner ist, ohne `Tab` zu halten.
- **AC-68** `fertig` **Ruhe des Mönchs sichtbar** — Nach einer Bekehrung
  ruht der Mönch 62 Sekunden ([Einheiten](einheiten-und-befehle.md) AC-38);
  man sieht es ihm an. Über jedem eigenen Mönch, der ruht, steht unter dem
  Platz des Lebensbalkens ein schmaler blauer Balken, der sich füllt, bis er
  wieder bekehren kann — auch ohne Auswahl, damit man unter mehreren den
  findet, der bereit ist. Ist er gewählt, steht in der Leiste statt der
  Reichweite „ruht noch 0:41". Der Zustand nennt dazu die Sekunden, die er
  noch ruht (`r`, aufgerundet, auch an fremden Mönchen: wer einen ansieht,
  liest dasselbe); die Dauer der Ruhe steht in den Werten. An der Ruhe
  selbst ändert das nichts. **Rückmeldung des Benutzers:** „Mönchen können
  unendlich oft hintereinander bekehren oder? sollte man ggf. bissl
  einschränken" — sie ruhten schon, nur sah man es nicht.
- **AC-69** `fertig` **Das Haus im Spiel** — Wer ein Gebäude wählt, liest
  unter dessen Namen, zu welchem Haus es gehört („Haus Eschenbruch") — am
  eigenen wie an einem fremden, das er ansieht (AC-58), dort auch an einer
  fremden Einheit. Wer auf die Zeile zeigt, bekommt die Tafel (AC-55): was
  das Haus bringt, in Zahlen — ein späterer Bonus mit seinem Zeitalter davor
  („Ab dem Fürstentum – …") —, darunter abgesetzt, was im Bündnis auch den
  Verbündeten gilt (spielziel AC-25), und der Wahlspruch. Die Sätze schreibt
  der Server aus `HAEUSER` (`bringt.js`, `hausBringt`), der Browser liest
  keine Wirkung; Reichweite an Gebäuden nennt nur, was schießt. Im
  Spielstand unter `Tab` (AC-20) steht das Haus hinter jedem Namen, in der
  Punkteliste (AC-57) am Zeiger. **Rückmeldung des Benutzers:** „wo sehe
  ich welches volk ich bin? Wenn ich auf ein gebäude von mir klicke - oder
  zumindest aufs dorfzentrum sollte mans sehn, auch beim gegner seh ichs
  nicht".
- **AC-70** `fertig` **Kampfwerte mit Zuschlag** — An der Auswahl (AC-35)
  stehen Angriff, Rüstung und Reichweite als Grundwert und Zuschlag: „3+1",
  wo der Schmiedeangriff aus 3 Angriff 4 macht; die Rüstung je Seite
  („0+1 / 0+2"). Der Zuschlag ist alles, was Forschung und Haus auf den
  Grundwert legen, und steht in Gold. Ohne Zuschlag steht die Zahl allein,
  kein „+0". Die Summe rechnet weiter nur der Server (`welt.einheitenwert`,
  `welt.gebaeudewert`); der Browser zieht den Grundwert aus den Daten ab.
  Gilt für Einheiten und für Gebäude, die schießen. **Rückmeldung des
  Benutzers:** „die angriffs und rüstungspunkte sollten mit basiswert + den
  durch forschung, etc. wert dargestellt werden, also mit ‚+'".
- **AC-71** `fertig` **Jeder schnelle Klick zählt** — Ein Knopf, der
  ausbildet, forscht, abbestellt oder am Markt tauscht, wirkt beim Drücken
  der Maustaste, nicht beim Loslassen. Die Leiste wird neu gebaut, sobald
  sich die Schlange ändert; ein Klick, zwischen dessen Hälften der Knopf
  ersetzt wurde, ging vorher verloren. Sechs Klicks so schnell es geht sind
  sechs Aufträge. Mit Umschalt bestellt ein Klick fünf Einheiten (eine
  Forschung bleibt eine); es steht in der Tastenübersicht. Mit der Tastatur
  ausgelöst, wirkt der Knopf wie bisher. **Rückmeldung des Benutzers:**
  „wenn ich ganz viele einheiten produizieren will und ganz schnell
  draufklicke, dann klickt man zu schnell für den browser".
- **AC-72** `fertig` **Eine Schlagbewegung je Schlag** — Wer kämpft, bewegt
  sich im Takt seines Schadens: je Schlag oder Schuss des Servers genau eine
  Bewegung — Ausholen, Treffer, Ausschwingen —, dazwischen steht die Figur
  bereit. Das gilt für jede Figur: die Miliz schlägt alle zwei Sekunden, der
  Bogenschütze spannt einmal je Pfeil, die Ramme stößt einmal je Stoß, der
  Mangonel wirft, wenn der Stein fliegt. Der Zustand nennt dazu den Takt des
  letzten Schlags (`sl`, nur an Kämpfenden und nur mit dem Schlag neu); der
  Klang des Hiebs (AC-62) fällt auf denselben Takt. Bei anderer
  Spielgeschwindigkeit und in der Pause geht es mit, weil in Takten
  gerechnet wird. Vorher lief die Bewegung nach der Uhr des Browsers, alle
  0,7 Sekunden einmal, gleich für alle (AC-39). **Rückmeldung des
  Benutzers:** „die Animation der Mange passt GAR nicht. sie bewegt sich
  schnell und oft und nur alle paar sekunden geht nen gemalter stein weg" —
  und ebenso zu Ramme und Bogenschütze: „da sollten wir nochmal allgemein
  nachjustieren".
- **AC-73** `in-qa` **Vollbild gibt die Tasten** — Im Fenster gehören
  `Strg`+`1` bis `8` dem Browser: er wechselt damit den Tab, und keine Seite
  kann das verhindern (AC-5 nennt deshalb `Alt` daneben). Im Menü steht
  „Vollbild (F11)", und `F11` schaltet im Spiel dasselbe: die Seite fordert
  das Vollbild selbst an und verlangt darin die Tasten des Spiels vom
  Browser — Buchstaben, Ziffern, `Esc`, Leertaste, Punkt, `Entf` und `F1`
  bis `F12` (`navigator.keyboard.lock`, in Chrome und Edge). Dann legt
  `Strg` mit einer Ziffer eine Gruppe ab, `Strg`+`W` schließt nichts, und
  `Esc` hebt die Auswahl auf, statt das Vollbild zu beenden; hinaus führen
  `F11`, das Menü und `Esc` gehalten. `Alt`+`Tab` bleibt beim
  Betriebssystem. Wo es die Tastensperre nicht gibt (Firefox, Safari),
  bleibt es beim Vollbild ohne sie. Die Tastenübersicht sagt beides.
  **Geprüft** ist im Browserlauf, dass Menü und `F11` das Vollbild schalten
  und die Sperre mit diesen Tasten verlangt wird; **nicht prüfbar** ist
  dort, ob der Browser die Tasten dann hergibt — ein Testbrowser bekommt
  jede Taste. Das probiert der Benutzer im Chrome; bis dahin `in-qa`.
  **Rückmeldung des Benutzers:** „mit strg + 1 und andere zahlen muss man
  gruppen machen können von einheiten".
- **AC-74** `fertig` **Der Mönch ist zu hören** — Solange ein Mönch heilt,
  klingt bei ihm ein Glöckchen, eines je Sekunde und damit je geheiltem
  Leben, auch wenn mehrere nebeneinander heilen; solange er bekehrt, singt
  er einen tiefen, gehaltenen Ton, der in den nächsten übergeht; tritt die
  Einheit über, klingt dort ein heller Schlag — für jeden, der sie im Bild
  hat, auch für den, der sie verliert. Wie alle Geräusche (AC-62) nur, was
  im Bild steht, leiser am Rand und auf seiner Seite, jedes Mal neu
  gewürfelt, im Browser erzeugt und kein Material von außen. Keiner der drei
  hebt die Musik in den Kampf. Dass ein Mönch bekehrt und nicht heilt, sagt
  der Zustand (`bk` neben `w`), erst in Reichweite. **Rückmeldung des
  Benutzers:** „der mönch macht keine geräuscht beim bekehren oder heilen".
  **Nicht geprüft:** wie es klingt — das entscheidet ein Ohr
  (`npm run ton:messen` schreibt die Klänge als WAV).
- **AC-75** `fertig` **Entf entfernt das Gewählte** — Die Taste `Entf`
  entfernt, was gewählt ist: eine eigene Einheit oder ein eigenes Gebäude.
  **Eines je Druck** — sind mehrere Einheiten gewählt, fällt die erste, die
  anderen bleiben gewählt; eine gehaltene Taste zählt einmal. Die Einheit
  fällt wie im Kampf (sie liegt zwei Sekunden am Boden und zählt auf der
  Tafel als verloren), das Gebäude stürzt ein und hinterlässt Trümmer
  (darstellung AC-26), eine Baustelle wird abgerissen und erstattet, was
  nicht verbaut ist (bauen AC-6) — so räumt man auch eine Brache weg (bauen
  AC-41). Niemand bekommt dafür Punkte (AC-49), und Fremdes entfernt die
  Taste nicht: entschieden wird auf dem Server (Nachricht `entlassen`). Wer
  sein letztes Gebäude und seine letzte Einheit entfernt, scheidet aus wie
  jeder, der nichts mehr hat (spielziel AC-5). Keine Rückfrage, kein
  Entfernen ganzer Gruppen. **Rückmeldung des Benutzers:** „sollte es
  möglich sein, dass ein dorfbewohner sich selbst umbringt? durch entf
  taste?" und, zum Vorschlag mit Umschalt für alle: „nur entfernen, müssen
  keine massenentf sein oder so."
- **AC-76** `fertig` **Wer schlägt, schaut aufs Ziel** — Wer schlägt oder
  schießt, steht zu dem hin gedreht, den er trifft — auch wenn ein anderer
  Gegner näher steht —, an einem Gebäude zum nächsten Punkt seiner
  Grundfläche. Wer fällt, liegt zu dem hin, der ihn traf, und nicht mehr
  dorthin, wohin er zuletzt ging. Die Richtung nennt der Server im Zustand
  (`zr`, ein Achtel der Karte, nur an Kämpfenden und Gefallenen); vorher
  riet der Browser sie aus dem nächsten Gegner. Wer entlassen wird (AC-75),
  fällt, wie er stand. **Gemessen** an einem Gefecht aus 32 gegen 32 über
  15 Sekunden: auf freiem Feld stimmten vorher 88 % der Schläge, im Dorf
  78 %, danach 98 % und 91 % (abgelesen bis zu einer halben Sekunde nach
  dem Schlag; der Rest ist vermutlich dieser Abstand, belegt ist das
  nicht); Gefallene lagen vorher fast nur in zwei Richtungen, danach in
  sechs bis sieben. **Rückmeldung des Benutzers:** „Die Richtung in die ein
  Soldat schlägt, ist meist nicht die, in die er wirklich jemandem weh tut.
  auch umfallen tun sie nur in eine richtug meistens".
- **AC-77** `fertig` **Nichts lässt sich markieren** — Im Spielbild lässt
  sich kein Text markieren: nicht mit Doppel- oder Dreifachklick auf einen
  Namen, nicht mit einem Zug durch die Leiste, nicht mit einem Rahmen, der
  auf der Karte beginnt und in der Leiste endet. Eingabefelder gibt es im
  Spielbild keine; Vorraum und Warteraum bleiben, wie sie sind.
  **Rückmeldung des Benutzers:** „dass der text z.B. bei meinen
  dorfbewohnern die gebäudenamen so aussahen, als wären sie markiert
  gewesen, so blau schattiert".
- **AC-78** `fertig` **Lautstärke regelbar** — Im Menü (AC-66) stehen zwei
  Schieber, Geräusche und Musik, von 0 bis 100 % in Schritten von 5, mit der
  Zahl daneben. Sie wirken sofort, auch auf das, was schon klingt, einzeln,
  und der Browser merkt sie sich; die Vorgabe ist 100 % und so laut wie
  bisher. Der Regler folgt dem Schieber im Quadrat (50 % am Schieber ist ein
  Viertel am Regler), damit die untere Hälfte nicht fast alles tut. Die
  zwei Schalter an und aus (AC-61) bleiben in der Tastenübersicht: leise ist
  nicht aus, und ein Schieber weckt keine abgeschaltete Musik.
  **Rückmeldung des Benutzers:** „Dann noch die Lautstärke im Menü regelbar
  machen, also leiser stellen ermöglichen." **Nicht geprüft:** wie laut es
  sich anfühlt — das entscheidet ein Ohr.
- **AC-79** `fertig` **Erst spannen, dann der Pfeil** — Der erste Schlag
  eines Gefechts fällt auf dem Server in dem Takt, in dem das Ziel in
  Reichweite ist; ausgeholt hat davor niemand (AC-72 zeigt das Ausholen nur
  vor den folgenden). Im Bild holt die Figur dann erst aus — 0,35
  Spielsekunden, höchstens ihre halbe Bewegung —, und Pfeil oder Stein
  verlassen sie erst danach, samt ihrem Klang; ebenso wartet der Klang des
  ersten Hiebs. Dasselbe gilt für jeden Schlag ohne Ansage: nach einem neuen
  Befehl, oder wenn die Figur die Waffe schon wieder gesenkt hatte. Gerechnet
  wird weiter sofort — das Leben des Ziels sinkt also einen Augenblick, bevor
  der erste Pfeil ankommt; der Pfeil ist Darstellung (AC-40, ADR-0001). Steht
  das Bild (Pause, Ende), stehen auch die Pfeile in der Luft.
  **Rückmeldung des Benutzers:** „Auch bei den Bogenschützen, der erste Pfeil
  kommt bevor sie den Bogen ziehen."
- **AC-80** `fertig` **Weiterentwicklung unter ihrer Einheit** — Eine
  Verbesserung, die eine Einheit austauscht (Einheiten AC-24, AC-58 bis
  AC-62), steht in der Leiste nicht mehr in der Reihe der Einheiten, sondern
  **unter dem Knopf der Einheit, aus der sie etwas macht**: flacher, mit dem
  Bild der neuen Einheit, dem Preis daneben und einem goldenen Pfeil hinauf
  zur Einheit. Der Knopf sagt, wer zu wem wird („Weiterentwicklung: Plänkler
  wird Eliteplänkler"), und die Tafel darüber (AC-55) trägt
  „Weiterentwicklung" im Namen. Jede andere Verbesserung bleibt in der Reihe
  (AC-65). Ein Gebäude mit Weiterentwicklungen hält den Platz unter jeder
  Einheit frei, auch wenn dort nichts steht — ist eine Stufe erforscht,
  bleibt jeder Knopf, wo er war (AC-54).
  **Rückmeldung des Benutzers:** „und die Weiterentwicklung z.B. vom
  Eliteplänkler sollte klar als weiterentwicklung ersichtlich sein - und eher
  unterhalb vom Plänkler, sodass das etwas zugeordnet ist".

- **AC-81** `fertig` **Technologiebaum aus den Daten** — Es gibt eine
  Übersicht über alles, was eine Partie hergibt: jedes Gebäude, jede Einheit,
  jede Stufe und jede Verbesserung genau einmal, in zwei Seiten wie das
  Baummenü (AC-64: Wirtschaft und Militär), in Zeilen nach Zeitalter
  (Landsitz, Lehen, Fürstentum, Krone) und in Spalten je Gebäude. Gerechnet
  wird sie auf dem Server aus den Daten (`server/spiele/strategie/techbaum.js`)
  und ausgeliefert unter `/api/spiele/<art>/nachschlagen`, angemeldet oder
  nicht — der Steckbrief sagt mit `nachschlagen`, ob ein Spiel so etwas hat
  (ADR-0006). Was ein Eintrag bringt, steht in denselben Sätzen wie im Spiel
  (`bringt.js`, AC-55); der Browser liest daraus keine Wirkung. Was weder
  ausbildet noch erforscht (Haus, Mauer, Farm, Wunder …), steht als
  „Weitere Gebäude" am Ende der Seite; der Drache steht beim Kloster, als
  gerufen, nicht ausgebildet.
  **Wunsch des Benutzers:** „was noch nett wäre, wenn man so ne übersicht
  anklicken könnte, was es alles an einheiten und weiterentwicklungen, etc.
  gibt - ggf. pro Haus".
- **AC-82** `fertig` **Linien zeigen die Folge** — Was aufeinander folgt,
  steht untereinander und ist mit einem Pfeil verbunden: eine Einheit und
  ihre Stufen (Miliz → Soldat → Langschwertkämpfer → Zweihandkämpfer, der
  Ritter → Kavalier → Paladin) mit goldenem Pfeil wie in der Leiste (AC-80),
  eine Verbesserung und ihre `vorstufe` (Schmiedeangriff → Eisenguss → …)
  mit grauem. Jeder Pfeil zeigt auf etwas, das im Baum steht, und nie
  aufwärts in ein früheres Zeitalter. Die Zeile eines Eintrags ist sein
  eigenes Zeitalter, aber nie früher als das seines Gebäudes.
- **AC-83** `fertig` **Ein Haus im Baum** — Oben wählt man „Alle Häuser" oder
  eines der fünf. Mit einem Haus ist, was es nicht hat, blass (die
  Spezialeinheiten der anderen), was nur es hat, golden umrandet, und was es
  stärkt, trägt ein kleines ▲; darüber stehen Wahlspruch, Boni und
  Mannschaftsbonus in den Worten des Servers. Die Werte jeder Einheit kommen
  vom Server je Haus und Zeitalter (`welt.kampfwerte()`, mit `boniAb`) —
  Eschenbruchs Schützen schießen erst ab dem Fürstentum weiter. Mit „Alle
  Häuser" steht an jeder Spezialeinheit, wem sie gehört. Im Spiel ist das
  eigene Haus vorgewählt, im Warteraum das gewählte, wenn es nicht Zufall
  ist.
- **AC-84** `fertig` **Tafel an jedem Eintrag** — Wer mit der Maus auf einen
  Eintrag zeigt oder ihn mit der Tastatur erreicht, sieht dieselbe Tafel wie
  über einem Knopf der Leiste (AC-55): Name, Preis, Wirkung in Zahlen, Dauer,
  und bei Einheiten die Kampfwerte. Darunter, wo es zutrifft, „Gibt es ab dem
  …", „Haus … hat das nicht", „Von Haus … gestärkt" oder wie der Drache
  gerufen wird. Ein Klick hält die Tafel fest (für den Laptop ohne Maus), ein
  zweiter oder `Esc` löst sie.
- **AC-85** `fertig` **Aus Menü und Warteraum** — Der Baum öffnet sich im
  Spiel aus dem Menü (AC-66, „Technologiebaum") und im Warteraum über einen
  Knopf neben „Starten", als Ebene über der Seite, nicht als neuer Tab: die
  Partie läuft darunter weiter wie unter dem Menü, das Vollbild bleibt, und
  es braucht keine zweite Verbindung. Solange er offen ist, gehen Tasten
  nicht an das Spiel, und die Maus am Rand schiebt die Karte nicht (AC-9);
  `Esc` und „Schließen" schließen ihn, und man steht wieder in der Partie.
- **AC-86** `fertig` **Baum passt auf Laptop** — Auf 1366 × 768 (AC-23)
  steht die ganze Breite einer Seite ohne Rollen nebeneinander, kein Eintrag
  ist abgeschnitten und keine Tafel ragt aus dem Fenster; was nicht in die
  Höhe passt, rollt im Baum, nicht die Seite.

### Bildknöpfe und Glocke (Benutzer, 2026-11-24)

„Nein, irgendeinen knopf, nicht wo ausquartieren drauf steht, sondern ein
knopf, lass dir was einfallen" (2026-11-24).

- **AC-87** `fertig` **Befehle als Bildknöpfe** — Einquartieren, Alle
  heraus, Notfallklingel, Entwarnung und die vier Haltungen (kampf AC-28
  bis AC-31) sind quadratische Knöpfe mit einem Bild wie die übrigen der
  Leiste, ohne Wort darauf. Was der Knopf tut, steht in der Tafel darüber
  (AC-55) samt Taste, und als `aria-label` am Knopf. Die gewählte Haltung
  und die läutende Glocke sind hervorgehoben. Auf 1366 × 768 (AC-23) ragt
  nichts aus dem Fenster.
- **AC-88** `fertig` **Die Glocke klingt** — Wird die Notfallklingel
  geläutet, hört der Spieler eine Glocke, bei der Entwarnung einen anderen,
  helleren Klang ([Bauen](bauen.md) AC-61) — nur der, dem das Dorfzentrum
  gehört, ausgelöst vom Wechsel von `gl`, nicht vom Klick. Erzeugt im
  Browser wie jeder Klang (AC-59), gemessen mit `npm run ton:messen`.

### Aus dem Spiel vom 2026-11-25

„wenn ich mit einem dorfbewohner strg drücke, dann möchte ich mehrere
häuser hintereinander bauen können." (Benutzer, 2026-11-25)

- **AC-89** `fertig` **Reihe bauen auch mit Strg** — Was Umschalt beim
  Setzen einer Baustelle tut (AC-48), tut `Strg` genauso: der Bauplatz
  bleibt in der Hand, die Bauleute bauen die Baustellen der Reihe nach.
  Nur beim Setzen — Auswahl und Rechtsklick behalten Umschalt allein, und
  `Strg` mit einer Ziffer bleibt die Gruppentaste (AC-5). Die
  Tastenübersicht nennt beide. **Messbar:** ein Browsertest setzt mit
  gehaltenem `Strg` drei Häuser, der Bauplatz liegt danach noch in der
  Hand, und alle drei werden fertig.

## Grenzfaelle

- Bei starkem Zoom heraus werden Einheiten kleiner als drei Bildpunkte. Dann
  wird eine Mindestgröße gezeichnet, sonst verschwindet das Heer.
- Ein Rechtsklick, während nichts ausgewählt ist, tut nichts — und darf keine
  Meldung erzeugen. Das passiert ständig und ist kein Fehler. Auch kein Zeichen
  am Ziel (AC-34): angezeigt wird, was geschieht, nicht, wohin geklickt wurde.
- Das weiße Zeichen (AC-34) sieht im Standbild aus wie ein Auswahlring. In
  Bewegung nicht: es läuft zusammen und verblasst, der Auswahlring bleibt. Der
  Fall, auf den es ankommt — Angriff oder nicht — hängt an Rot gegen Weiß und
  an den vier Haken.
- Weil das Zeichen sofort steht, entscheidet der Browser dieselbe Frage noch
  einmal, die der Server beim Befehl entscheidet (`feindAn`, `gebaeudeAn` in
  `welt.js`). Beide Regeln müssen gleich bleiben: eine fremde lebende Einheit
  näher als 1,01 Felder, sonst ein fremdes Gebäude unter dem gerundeten Feld.
