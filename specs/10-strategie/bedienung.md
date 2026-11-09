# Bedienung

**Bereich:** Strategie
**Kuerzel:** bedienung
**Stand:** 30/44 fertig · 14 offen

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
- **AC-3** `offen` **Umschalt erweitert** — Mit gedrückter Umschalttaste kommt zur Auswahl hinzu,
  statt sie zu ersetzen.
- **AC-4** `offen` **Doppelklick wählt den Typ** — Alle sichtbaren Einheiten desselben Typs.
- **AC-5** `offen` **Auswahl merken** — `Strg`+`1` bis `9` legt eine Auswahl ab, die Zifferntaste
  ruft sie zurück. Ohne das ist ein Echtzeitspiel nicht spielbar.
- **AC-6** `fertig` **Ausgewählte sind aufgelistet** — Am unteren Rand mit Anzahl je Typ.

### Kamera

- **AC-7** `fertig` **Schieben mit Tasten** — `W A S D` und die Pfeiltasten.
- **AC-8** `fertig` **Zoom mit dem Rad** — Der Punkt unter dem Zeiger bleibt dabei stehen.
- **AC-9** `offen` **Schieben am Bildschirmrand** — Mit der Maus am Rand, abschaltbar.
- **AC-10** `offen` **Leertaste springt zur Basis** — Und ein zweites Mal zurück.
- **AC-11** `fertig` **Übersichtskarte unten rechts** — Gelände, eigene und fremde Einheiten als
  Punkte, der Bildausschnitt als Rahmen. Klick springt hin.

### Befehle

- **AC-12** `fertig` **Rechtsklick befiehlt** — Laufen, sammeln oder angreifen, je nach Ziel. Kein
  Umschalten der Betriebsart.
- **AC-13** `offen` **Der Befehl ist sofort sichtbar** — Ein Kringel am Zielpunkt, ohne auf die
  Antwort des Servers zu warten. Zehn Takte je Sekunde heißt bis zu 100 ms
  Verzögerung — ohne Rückmeldung fühlt sich das kaputt an.
- **AC-14** `offen` **Warteschlange mit Umschalt** — Mehrere Ziele hintereinander abarbeiten.
- **AC-15** `fertig` **Abbrechen mit Esc** — Hebt Auswahl und angefangene Platzierung auf.

### Rückmeldung

- **AC-16** `fertig` **Ladung ist sichtbar** — Ein beladener Dorfbewohner trägt seine Ware
  sichtbar auf dem Rücken: Holzbündel, Beerenkorb, Gold- oder Steinbrocken
  (→ [Darstellung](darstellung.md) AC-6).
- **AC-17** `fertig` **Rohstoffe zählen sichtbar hoch** — Nicht springen. Man muss sehen, dass die
  Wirtschaft läuft.
- **AC-18** `fertig` **Abgelehnte Befehle sagen warum** — „Zu wenig Holz", „Bevölkerung voll" — kurz
  eingeblendet, nicht als Fenster mit Knopf.
- **AC-19** `offen` **Verbindungsverlust ist sichtbar** — Ein Hinweis im Bild, nicht erst
  stehenbleibende Einheiten (→ [Übertragung](../00-plattform/uebertragung.md) AC-9).
- **AC-20** `offen` **Spielstand aller Spieler einsehbar** — Auf Tastendruck: Bevölkerung und
  Rohstoffe aller Mitspieler. Wer vorne liegt, gehört zur Spannung.

### Erster Eindruck

- **AC-21** `offen` **Die erste Partie erklärt sich** — Beim ersten Start eine kurze Einblendung:
  ziehen, rechtsklicken, sammeln. Drei Sätze, wegklickbar.
- **AC-22** `fertig` **Tastenübersicht** — Auf `?` oder `F1`.
- **AC-23** `offen` **Läuft auf einem Laptop-Bildschirm** — 1366 × 768 ohne Abschneiden. Die
  Bedienung auf dem Handy ist ausdrücklich **kein** Ziel — ein Strategiespiel
  mit Rahmenauswahl braucht eine Maus.

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
  ganz.
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
- **AC-36** `fertig` **Militär bei Spielgröße erkennbar** — Bei Zoom 1 unterscheidet
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
  0,356 · Plänkler 0,348 · Späherreiter 0,705.
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
  kämpft, ist nicht zu erkennen. **Messbar:** in zwei Bildern derselben
  angreifenden Einheit im Abstand ihrer Nachladezeit unterscheiden sich die
  Bildpunkte der Figur.
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
- **AC-43** `offen` **Voller Wohnraum fällt auf** — Wartet ein Auftrag, weil
  die Bevölkerung voll ist, zeigt das die Bevölkerungsanzeige oben, auch
  wenn das wartende Gebäude nicht gewählt ist. Heute steht der Grund nur in
  der Auswahlleiste dieses Gebäudes (bauen AC-15). **Gefunden in der
  Rückschau zur Stufe D:** bei 65 / 65 sah die Anzeige oben aus wie bei
  jeder anderen Zahl — ob irgendwo eine Schlange stillsteht, verrät sie
  nicht. **Messbar:** die Anzeige trägt eine Kennzeichnung, solange ein
  eigenes Gebäude wartet, und verliert sie, sobald keines mehr wartet.
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
