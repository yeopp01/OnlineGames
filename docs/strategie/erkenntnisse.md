# Erkenntnisse aus der Arbeit am Strategiespiel

Das Gedächtnis der Arbeitsschleife
([`strategie-weiterbauen`](../../.claude/skills/strategie-weiterbauen/SKILL.md)).
Jede Runde liest zuerst **Fragen** und **Offene Fäden** und schreibt am Ende
eine Zeile unter **Runden**. Was sich als dauerhaft richtig erweist, wandert in
eine Spec, ein ADR oder die Anweisung selbst und wird hier gestrichen.

Kurz halten. Diese Datei wird in jeder Runde gelesen.

## Fragen an den Benutzer

Entscheidungen, die nicht die Schleife trifft. Solange eine offen ist, wird an
etwas anderem gearbeitet.

- **Name des Spiels.** „Age of Empires" ist eine Marke und darf nicht
  erscheinen ([ADR-0012](../adr/0012-aoe2-als-vorlage.md)). Bis ein Name
  feststeht, heißt es in der Oberfläche „Strategie". Vorschlag des Benutzers
  (2026-09-17): **Rise to Hegemony** („Enough diplomacy. Rise to Hegemony.").
  Gegenvorschlag der Schleife: „Vormacht" (deutsch, dasselbe Wort). Nicht
  geprüft: Markenregister; es gibt eine Strategiereihe „Hegemony". Wartet auf
  die endgültige Wahl.
- **Zeittest des Managerspiels unter Last (seit 2026-09-16, Runde 10).**
  `karriere AC-7` (Saison unter 1 s) reißt in `npm run check`, sobald fremde
  Rechenjobs laufen: 1,7–3,2 s. Nacheinander (`--test-concurrency=1`) sind
  alle 255 Tests grün, AC-7 mit 516 ms. Vorschlag: Zeitmessungen in einen
  eigenen, seriellen Schritt von `npm run check` legen (`node --test
  --test-concurrency=1` nur für die Messtests), die Grenze bleibt 1 s. Ohne
  Antwort ändert die Schleife weder Grenze noch Testaufruf und committet nur
  bei grüner Prüfung. Seit Runde 26 reißt auch `karte AC-15` (Wegsuche auf der
  größten Karte) auf dieselbe Weise, dreimal in neun Läufen — der Vorschlag
  würde beide in den seriellen Schritt legen. Runde 36: `karte AC-15` misst
  jetzt den schnellsten von fünf Durchgängen statt eines Mittels (Grenzen
  unverändert) — unter 97 % fremder Last grün. Runde 45: `karriere AC-7`
  misst ebenso die schnellste von bis zu drei gleichen Saisons, nur wenn die
  erste über 1 s liegt; die Grenze bleibt. Damit ist der serielle Schritt
  vielleicht unnötig — die Frage bleibt offen, bis der Benutzer entscheidet.
- **Berechtigungen für die Schleife.** Das Anlegen von `.claude/settings.json`
  wurde vom Sicherheitsfilter abgelehnt (Selbständerung). Solange sie fehlen,
  kann jede Runde an einer Rückfrage hängen bleiben. Der Vorschlag steht in der
  Nachricht vom 2026-09-16; eintragen kann nur der Benutzer.

## Offene Fäden

- **Umlaute auf dem Bildschirm (entschieden 2026-09-17).** Texte, die im
  Browser stehen, bekommen echte Umlaute („Eröffnen", „zufällig");
  Bezeichner, Dateinamen und Testnamen bleiben umschrieben. Bestehende Texte
  umstellen: eine eigene Runde, weil Browsertests und Bildunterschriften
  Texte wörtlich prüfen. Neue Texte ab sofort mit Umlauten.
- Das Spielbild im Browser liest `window.ansicht` (nur lesen, befohlen wird
  mit Maus und Tastatur) — Muster in `e2e/tests/strategie-spielbild.spec.mjs`.
  Für neue Bedienkriterien dort anbauen.
- Der Server schickt heute jedem den Vollzustand. Das trägt nicht bis 8×200
  Einheiten (fahrplan AC-20) und nicht für den Nebel (AC-13). Nicht vorziehen,
  aber keine Entscheidung treffen, die gebündelte Änderungen verbaut.
- **Wunsch des Benutzers (Runde 35): realistischer, weniger Comic, alles
  unterscheidbar.** Mit einem Bild des Originals als Maßstab: keine schwarzen
  Umrisse, erdige gedämpfte Farben, kleine Figuren mit echten Proportionen,
  Boden als Textur ohne Rautenraster, Schlagschatten. Das Bild ist nur
  Maßstab für die Anmutung - nichts davon abzeichnen, nichts einchecken
  (ADR-0012). Schritt A6c vor A8, Kriterien darstellung AC-13, AC-14.
- **Wunsch des Benutzers (Runde 26): gezeichneter, detaillierter.** „Alle
  Bilder nochmal einen Tick detaillierter, je gezeichneter es wirkt, umso
  besser." Deshalb Schritt A6b vor dem Rest von A7, Kriterium darstellung
  AC-12. Vorher-Nachher-Bilder verlinken.
- **Wunsch des Benutzers (Runde 8): Aussehen zählt schon jetzt.** „Nicht nur
  schäbige Punkte, sondern etwas, das halbwegs wie ein Sammler aussieht."
  Jede Runde, die etwas Neues ins Spielbild bringt, zeichnet es als erkennbare
  Figur oder Form — nie als Platzhalterpunkt. Deshalb A1b vorgezogen.
- **Einheiten stapeln sich** (Runde 9 gesehen): mehrere Dorfbewohner auf
  demselben Waldfeld werden übereinander gezeichnet — zwei Figuren sehen aus
  wie eine mit Bündel *und* Axt. Gehört zu einheiten AC-10/AC-20 (Schritt A9);
  mit Figuren fällt es jetzt auf, früher nicht.
- Figuren liegen in `public/figuren.js` (Raster 24 hoch, Fußpunkt unten),
  Schautafel unter `/schautafel.html`. Jede neue Einheit bekommt dort zuerst
  eine Figur und einen Eintrag, dann kommt sie ins Spiel.
- Die Welt entsteht über den Steckbrief: `erzeugen(spieler, einstellungen)`
  bekommt alle Einstellungen samt Startwert (raeume AC-16). Kartengröße und
  Vorrat (A2) kommen dort an, ohne `raeume.js` anzufassen.
- Der Einstieg ist erreicht (Runde 6), auswahl AC-6 seit Runde 11. AC-12 und
  AC-14 bis AC-17 betreffen fortlaufende Spiele — nicht vorziehen.
- **Zeichnen im Browserlauf (ohne Grafikkarte) ist langsam und eigenwillig:**
  einzeln gefüllte Rauten schlagen einen gemeinsamen Path2D (160 ms) und
  kopierte Kacheln (30 ms) deutlich. Vor jedem „Optimieren" messen — zwei
  naheliegende Ideen waren hier Verschlechterungen. Stand Runde 13: Zoom 1
  rund 5 ms, Zoom 0,4 rund 10 ms je Bild.
- Die Kopfzeile oben liegt über der Spielfläche und verdeckt dort Figuren
  (Runde 32 gesehen). Kandidat für bedienung AC-23 (Laptop-Bildschirm) oder
  die Rückschau am Ende von Stufe A: halbdurchsichtiger Grund oder Rand.
- Der Browserlauf: `npm run e2e:laufzeiten` nach Runden mit neuen
  Browsertests; Ziel unter 2,5 min bei ruhiger Maschine.
- Offen im Aussehen: Dorfbewohner bei Zoom 1 recht klein; was hinter einem
  Gebäude steht, ist ganz verdeckt (Runde 22: ein Schaf). Das Original zeigt
  solche Figuren als Umriss durch das Gebäude — ein Kandidat für die
  Rückschau am Ende von Stufe A.
- Laufzeiten nur messen, wenn die Maschine ruhig ist: vor einer Messung
  nach fremden `node`-/`chrome`-Prozessen sehen. Andere Projekte laufen hier
  parallel und verdoppeln den Browserlauf.
- Bei Änderungen am Vorraum: `npm run qa:nachweis -- vorraum spielauswahl`,
  sonst zeigen die Bilder zu konten und raeume den alten Stand.

## Messwerte

Zahlen, gegen die spätere Runden vergleichen. Mit Datum und Commit.

| Datum | Was | Wert | Commit |
| --- | --- | --- | --- |
| 2026-09-16 | Tests ohne Browser / im Browser | 242 / 63 | Runde 1 |
| 2026-09-16 | Dauer Browserlauf gesamt | 46,6 s | Runde 1 |
| 2026-09-16 | Tests ohne Browser / im Browser; Browserlauf | 247 / 66; 51,9 s | Runde 2 |
| 2026-09-16 | Tests ohne Browser / im Browser; Browserlauf | 250 / 69; 1,3–2,2 min — **nicht vergleichbar**: gleichzeitig liefen Tests anderer Projekte (Conjola) | Runde 3 |
| 2026-09-16 | Tests ohne Browser / im Browser; Browserlauf (Maschine ruhig) | 251 / 75; 55,0 s | Runde 4 |
| 2026-09-16 | Tests ohne Browser / im Browser; Browserlauf | 252 / 77; 1,1 min — nicht vergleichbar, 8 fremde Testprozesse | Runde 6 |
| 2026-09-17 | Tests ohne Browser / im Browser; Browserlauf (Last 16 %) | 260 / 80; 59,8 s | Runde 12 |
| 2026-09-17 | Wegsuche 200 x 200: Ecke zu Ecke / Mittel 100 zufaellig | 1,19 ms / 0,28 ms | Runde 12 |
| 2026-09-17 | Browsertests je Datei (e2e:laufzeiten, CPU 20 %): strategie-bauen / -ausbilden / -spielbild / Summe | 45,8 / 29,3 / 25,7 / 141 s | Runde 30 |
| 2026-09-17 | Zeichnen je Bild (sicht --messen, ohne Grafikkarte), Zoom 1 / 0,5 / 2 | vorher 23,8 / 29,3 / 17,9 ms, nachher 18,2 / 23,1 / 29,3 ms | Runde 29 |
| 2026-09-17 | Tests ohne Browser / im Browser | 305 / 109 | Runde 40 |
| 2026-09-17 | Tests ohne Browser / im Browser | 318 / 113 | Runde 45 |
| 2026-09-17 | Pruefstand, Grund-KI: 20 Partien x 10 Spielminuten, 2 Spieler — Dauer je Partie / Dorfbewohner nach 10 min | 30–90 ms / 15–16 | Runde 43 |
| 2026-09-17 | Pruefstand, Wirtschafts-KI: 20 Startwerte x 2 Spieler nach 10 min — Dorfbewohner / Nahrung min / laengste Untaetigkeit / Warten auf Wohnraum max; 20 Partien gesamt | 22 / 520 / 0,6 s / 3,5 s; 1,4 s | Runde 44 |
| 2026-09-17 | Zeichnen je Bild nach A6c (Boden in Kacheln, Wasser im Boden), Zoom 1 / 2 — Last nicht geprüft | 20,4 / 40,2 ms | Runde 39 |
| 2026-09-17 | Fast schwarze Bildpunkte Gebäude / Figuren (tafel `anmutung`) | vorher 7–12 % / 7,7–16 %, nachher 0 / 0 % | Runden 37, 38 |
| 2026-09-17 | Sättigung im Mittel Gebäude / Vorräte / Figuren | vorher 0,283 / 0,371 / 0,331, nachher 0,238 / 0,305 / 0,342 | Runde 39 |
| 2026-09-17 | Zeichnen je Bild im Browserlauf, Zoom 1 / Zoom 0,4 | 4,9–6,2 ms / 10–11 ms | Runde 13 |
| 2026-09-17 | Tests ohne Browser / im Browser; Browserlauf (Last 16 %) | 260 / 83; 58,5 s | Runde 13 |
| 2026-09-17 | Tests ohne Browser / im Browser; Browserlauf | 264 / 86; 1,1 min | Runde 16 |
| 2026-09-17 | Tests ohne Browser / im Browser; Browserlauf | 265 / 88; 1,3 min | Runde 17 |
| 2026-09-17 | Tests ohne Browser / im Browser; Browserlauf | 287 / 97; 2,8 min — davon rund 1,3 min strategie-bauen | Runde 23 |
| 2026-09-17 | Tests ohne Browser / im Browser; Browserlauf (CPU 25 %) | 287 / 99; 2,1 min — strategie-* 82 s, langsamster Fall 22 s | Runde 25 |
| 2026-09-17 | Tests ohne Browser / im Browser; Browserlauf (CPU 7 %, 13 fremde node-Prozesse im Leerlauf) | 275 / 91; 1,7 min — davon rund 20 s die neue Datei strategie-ausbilden | Runde 20 |

## Rückschauen

Alle fünf Runden und am Ende jeder Stufe: Was hat Zeit gekostet, was hat sich
wiederholt, was ändert sich an der Anweisung oder am Werkzeug?

### Nach Runde 5 (2026-09-16)

In vier Runden 18 Kriterien auf `fertig`, Einstieg fast und Spielbild ganz
im Browser. Was sich wiederholt hat:

1. **Grüne Tests, Bild zeigt es nicht** — zweimal (Absage unter dem Rand,
   Ladung unter dem Ring). → Anweisung: `toBeInViewport` vor `nachweis()`;
   auf der Leinwand bleibt nur das Ansehen.
2. **Veraltete Bilder nach Änderung an gemeinsamer Seite** — dreimal von Hand
   erinnert. → Anweisung: Tabelle „geändert → neu erzeugen".
3. **Werkzeugreibung** — Heredoc brach ab, Messung von fremden Prozessen
   verdoppelt, überdeckter Import. → Anweisung: Write/Edit statt Heredoc,
   ruhige Maschine prüfen, Namensregel.

Dazu auf Wunsch des Benutzers: jede Runde nennt am Ende zwei bis drei Bilder
als Link. Fahrplan AC-1 verlangte auswahl AC-12 (fortlaufende Spiele) — für
das Strategiespiel gestrichen, Nummer bleibt.

Nicht geändert: der Zuschnitt (1–3 Kriterien je Runde) hat getragen; keine
Runde ist gescheitert oder halb liegen geblieben.

### Nach Runde 10 (2026-09-16)

Runden 6–9: Einstieg erreicht, Spec für Stufe A (41 Kriterien), A1 und A1b —
4 Kriterien `fertig`, dazu die Figuren auf Wunsch des Benutzers vorgezogen.
Was sich wiederholt hat:

1. **Falsche Annahme im Test, nicht falsches Produkt** — dreimal (Taktzähler
   mit echter Uhr, „Ladung macht größer", „Holz und Beeren unterscheiden sich
   im Umriss"). → Anweisung: Schwelle aus der Eigenschaft, bei Fehlschlag
   zuerst die Annahme prüfen und am Test begründen; Schein-Uhren.
2. **Ansehen ohne Testlauf über Wegwerfskripte** — einmal gescheitert (Server
   nicht bereit). → Werkzeug `npm run sicht -- seite.html`; die Git-Bash
   schreibt `/seite.html` in einen Dateipfad um, deshalb ohne Schrägstrich.
3. **Herangezoomte Bilder täuschen** — die Figuren wirken groß gut, bei Zoom 1
   sind sie 26 Bildpunkte hoch. → Anweisung: immer auch in Spielgröße
   beurteilen.

**Fehler in dieser Rückschau:** Prüfung und Commit waren mit `;` verkettet —
`npm run check` war rot (karriere AC-7, Saison 1754 ms statt unter 1 s) und der
Commit lief trotzdem. Ursache des Rots: Last (sechs fremde Testprozesse);
einzeln dreimal grün mit 580–700 ms, die Runde hat keinen Rechenteil berührt.
→ Anweisung: nur `&&`, besser getrennt. Die Zeitgrenzen des Managerspiels
sind unter Last knapp; nicht lockern, aber bei Rot zuerst die Last prüfen.

Beobachtet, nicht geändert: Eine Runde mit Oberfläche fährt den Browser
zweimal (`qa:nachweis`, dann `check:alles`) — bei belasteter Maschine je drei
Minuten. Tragbar; ein Teillauf für `check:alles` würde die Regel aufweichen.

### Nach Runde 15 (2026-09-17)

Runden 11–14: Karte (A2) und isometrischer Blick (A3) ganz, 10 Kriterien
`fertig`; fünf Stunden Stillstand wegen Last auf der Maschine. Was sich
wiederholt hat:

1. **Der erste Wurf fürs Aussehen hielt im Spielbild nicht** — viermal
   (Halsband, Größe der Vorräte, Schachbrett-Gras, Fliesen-Ufer), jedes Mal
   sah die Schautafel gut aus. → Werkzeug `npm run sicht -- --spiel` für ein
   laufendes Spielbild ohne Testlauf; Anweisung: immer auch dort ansehen.
2. **Datenänderung macht Test stumpf** — einmal bemerkt (Startvorrat), die
   Art Fehler bleibt sonst unsichtbar. → Anweisung: vor Wertänderungen Tests
   nach alten Zahlen und schwachen Mustern durchsuchen.
3. **Heredoc bricht ab** — trotz Regel. → Anweisung ergänzt: Skript als Datei.

Nicht geändert: die Frage „Zeittest unter Last" liegt beim Benutzer; die
Schleife hat gewartet statt Regeln zu lockern und das ist richtig so.

### Nach Runde 20 (2026-09-17)

Runden 16–19: Schritt A4 ganz und A5 fast ganz, 15 Kriterien `fertig` — Sammeln
nach der Vorlage, Rohstoffleiste, Ausbilden mit Schlange, Dorfzentrum im Bild.
Was sich wiederholt hat:

1. **Bildunterschriften behaupteten zu viel** — zweimal in Runde 19 (Zahl
   geschätzt, Balken zu klein), davor schon Runde 16 („die Dorfbewohner").
   → Anweisung: jede Zahl und jedes „sichtbar" in der Unterschrift sichert der
   Test vorher ab; beim Ansehen auch nach Verdeckung fragen.
2. **Der Start einer Partie zu zweit** stand kopiert in jeder neuen
   Spielbild-Datei. → `e2e/helpers/strategie.mjs` mit `partieZuZweit` und
   `partieBeenden`; Spielbild und Ausbilden nutzen es.
3. **karriere AC-7 unter fremder Last** kostete wieder eine halbe Runde
   Rätseln. → Anweisung: Ablauf dafür (Last ansehen, Test allein, einmal
   wiederholen, nur bei „fail 0" committen).

Gut gelaufen: Tests haben zweimal echte Fehler gefunden, die niemand gesucht
hatte — die rückwärts zählende Leiste (R17) und den zu großen Zustand (R19).
Beide Male wurde das Produkt geändert, nicht die Zusicherung.

### Nach Runde 25 (2026-09-17)

Runden 21–24: Schritte A5 und A6 abgeschlossen, 20 Kriterien `fertig` —
Werte der Auswahl, Bauen im Rechenkern und im Browser, Gebäude und Baustellen
gezeichnet, Absagen im Bild. Was sich wiederholt hat:

1. **Der Browserlauf wuchs unbemerkt** von 1,6 auf 2,8 min. Gemessen: ein
   einziger Fall (Lagertest) brauchte 58 von 157 Sekunden, ein zweiter wartete
   siebeneinhalb Sekunden in Echtzeit auf einen Balken. → Zeitraffer hoch
   (58 → 22 s, 9 → 4 s), Werkzeug `npm run e2e:laufzeiten`, Regel: wer länger
   als fünf Sekunden auf Spielzeit wartet, dreht den Zeitraffer hoch.
2. **Gebäude verdeckten, was das Bild zeigen sollte** — in drei Runden
   (Schaf, Baustelle, Lagerträger). → `platzImBild` mit „vorn" und „seitlich"
   und `dorfbewohnerAnklicken` liegen jetzt in `e2e/helpers/strategie.mjs`.
3. **Heredoc mit Quelltext** ist trotz Regel wieder gebrochen (Runde 22, und
   in dieser Rückschau beim Auswerten noch einmal). → Regel ohne Ausnahme: kein
   Heredoc mit Quelltext, auch nicht für kleine Auswertungen.

Gut gelaufen: Die Regel aus Runde 20 (Zahlen in Bildunterschriften vorher
prüfen) hat zweimal einen falschen Satz verhindert, und zweimal hat ein Test
einen eigenen Denkfehler gefunden statt einen Produktfehler (Zeitraffer-Weg,
Erstattung vor dem Sperren) — beide Male stand danach ein Kommentar am Test.

### Nach Runde 30 (2026-09-17)

Runden 26–29: Schafe (A7 begonnen) und Schritt A6b ganz — auf Wunsch des
Benutzers Figuren, Gebäude, Wald, Vorräte und Gras gezeichnet statt flach.
Was sich wiederholt hat:

1. **Zeitmessungen rissen unter Last** — diesmal `karte AC-15`, nicht nur der
   Zeittest des Managerspiels. → Anweisung: der Ablauf „Last ansehen, allein
   laufen lassen, einmal wiederholen" gilt für alle drei Zeitmessungen.
2. **Mehr Zeichnung kostete unbemerkt Zeit** — Grasbüschel +28 ms je Bild,
   erst mit dem neuen `--messen` gesehen; Zwischenspeicher und gesammelte Pfade
   haben es mehr als ausgeglichen. → Anweisung: wer mehr zeichnet, misst vorher
   und nachher, mit den zwei Abhilfen, die gewirkt haben.
3. **CLAUDE.md war veraltet** (292 statt 320 Kriterien, ohne Bauen und
   Grafik). → Stand nachgezogen, damit eine neue Sitzung richtig anfängt.

Gut gelaufen: Die Tonstufen-Messung alt gegen neu hat aus „wirkt gezeichneter"
eine Zahl gemacht, und zweimal hat ein alter Test einen neuen Fehler gefunden
(Klick auf Beeren traf ein Schaf; zwei Lager zu ähnlich). Browserlauf bei
ruhigerer Maschine 141 s Testzeit, langsamster Fall weiter der Lagertest (28 s).

### Nach Runde 45 (2026-09-17)

Runden 41–44: darstellung AC-14 und AC-8 (A6c und A7 abgeschlossen), dann A8
ganz — Prüfstand und Wirtschafts-KI; 15 Kriterien `fertig`. Was sich
wiederholt hat:

1. **Zeittests rissen unter fremder Last** — `karte AC-15` bei 99 % (trotz
   „schnellster von fünf") und `karriere AC-7` bei 100 % CPU, beide allein
   grün. → `karriere AC-7` misst jetzt ebenso die schnellste von bis zu drei
   gleichen Saisons, die Grenze bleibt 1 s; Anweisung nachgezogen.
   In dieser Rückschau riss `karte AC-15` noch einmal (100 % CPU, 22
   Node-Prozesse fremder Projekte), allein dreimal grün, Wiederholung grün:
   fünf Durchgänge liegen zu dicht beieinander, um einer Lastspitze
   auszuweichen. Beobachten; ohne Antwort des Benutzers bleibt der Aufruf.
2. **Testgrenzen erst geschätzt, dann gemessen** — zweimal in Runde 44. →
   Anweisung: Tests über ganze Partien setzen ihre Grenze nach einer Messung
   über alle Startwerte, die Werte stehen als Kommentar am Test.
3. **Ein altes Bild blieb liegen** — der gewöhnliche Lauf schreibt vorhandene
   Bilder nicht neu, auch nicht nach geänderter Aufstellung. → Zeile in der
   Tabelle „geändert → neu erzeugen".

Gut gelaufen: Der Prüfstand hat in zwei Runden zwei echte Fehler der
Simulation gefunden, die kein Browsertest gezeigt hatte (Weg durch ein neues
Gebäude, Bauer gibt 0,04 Felder vor dem Ziel auf). Jede Wirtschaftsänderung
wurde über 20 Startwerte gemessen statt an einer Partie beurteilt.

### Nach Runde 40 (2026-09-17)

Runden 36–39: Schritt A6c auf Wunsch des Benutzers — Boden als Textur mit
Schatten, Gebäude und Figuren ohne schwarze Umrisse, Figuren mit Proportionen,
Wasser im Boden, gedämpfte Vorräte; darstellung AC-13 `fertig`. Was sich
wiederholt hat:

1. **Wegwerfskripte zum Messen auf der Schautafel** — viermal in drei Runden
   neu geschrieben (Schwarzanteil, Sättigung, Proportionen, Raster und
   Schatten). → `npm run tafel -- "<Ausdruck>"` wertet beliebige Ausdrücke
   mit `t = window.schautafel` aus; in `CLAUDE.md` und hier vermerkt.
2. **Ein Stellvertreter maß das Falsche** — „Sättigung des ganzen Spielbilds"
   stieg, obwohl das Bild natürlicher wurde; es fiel erst auf, als alles
   gebaut war, und das Kriterium musste neu gefasst werden. → Anweisung:
   einen Stellvertreter fürs Aussehen vorher und an einem Entwurf messen, bevor
   er festgeschrieben wird.
3. **Gedämpfte Farben brachen alte Darstellungstests** — Tonstufen des
   Holzfällerlagers, dann die Unterscheidbarkeit der Lager; beides erst im
   Lauf über alle Bilder (je rund 4–5 Minuten). → Anweisung: wer Farben oder
   Formen ändert, fährt zuerst die drei Darstellungsdateien (gut zwei Minuten).

Außerdem: `karte AC-15` misst den schnellsten von fünf Durchgängen und hielt
97 % fremde Last; in der Anweisung als Muster für weitere Zeittests vermerkt.
Die Frage zu `karriere AC-7` bleibt offen. Nicht geändert: der Zuschnitt in
Teile (Boden, Gebäude, Figuren, Wasser) je Runde hat getragen — jede Runde
endete grün mit Vorher-Nachher-Bild.

### Nach Runde 35 (2026-09-17)

Runden 31–34: Farm, Kaserne mit Miliz, Schafe treiben, Webstuhl, Sammelpunkt —
alle sieben Gebäude der Dunklen Zeit stehen. Was sich wiederholt hat:

1. **Alte Tests brachen, weil Listen wuchsen** — fünfmal: Knöpfe im Baumenü
   gezählt (zweimal), „kaserne" als Beispiel für Unbaubares, `bildetAus` und
   `TIERE` auf Gleichheit, Preis als Text „60 / 20". → Anweisung: wachsende
   Listen mit „enthält" oder aus den Werten; die verbliebenen vier
   Gleichsetzungen in den Tests gleich umgestellt.
2. **Test-Helfer wichen von der Spielregel ab** — `platzImBild` übersah
   Farmen, ein Treibe-Test schickte ein Schaf auf einen Baum. → Die Vorschau
   hat jetzt `platzTaugt(art, x, y, rand)`, und der Helfer fragt dort.
3. **`karte AC-15` riss unter Last** — dreimal in neun `npm run check`-Läufen
   (Runden 26, 30, 34), allein jedes Mal grün. Nicht gelockert: der Ablauf aus
   Runde 30 hat jedes Mal gegriffen. Die Frage an den Benutzer (Zeitmessungen
   seriell) betrifft diesen Test genauso; dort vermerkt.

## Runden

Neueste oben. Eine Zeile je Runde: Nummer, Datum, Kriterien, Ergebnis,
wichtigste Erkenntnis.

- **48** · 2026-09-17 · bedienung AC-27 und AC-22 **fertig**: Tastenkürzel
  und Tastenübersicht (`public/tasten.js`). `H` wählt das eigene Dorfzentrum
  und holt es ins Bild, dort bildet `Q` aus (über denselben Knopf wie die
  Maus, also mit denselben Absagen); `B` schaltet bei gewählten Dorfbewohnern
  die Bautasten ein, `Q W E R T Z` wählt das Gebäude in der Reihenfolge des
  Menüs — erst nach `B`, damit `W A S D` sonst weiter schieben (Test: nach
  `B` bewegt `W` die Kamera nicht). `?`/`F1` zeigt die Übersicht, gebaut aus
  derselben Liste `BELEGUNG`, die der Test Zeile für Zeile prüft; erste Texte
  mit echten Umlauten. Die Ansicht fragt Tasten zuerst über `beiTaste`.
  Gelernt beim Ansehen: die Auswahlleiste ragte seit Runde 47 unter die
  Übersichtskarte (Kasernenknopf halb verdeckt) — jetzt mittig im freien Raum
  zwischen Untätig-Knopf und Karte; kein Test hatte das gesehen.
- **47** · 2026-09-17 · bedienung AC-11 **fertig**: Übersichtskarte unten
  rechts (`public/uebersicht.js`), 240 × 120 als Raute wie das Spielbild.
  Gelände einmal in ein Bild, neu nur bei geänderten Feldern (Haken
  `beiFeldern` der Ansicht); Punkte für Einheiten, Quadrate für Gebäude in
  Spielerfarbe und der Ausschnitt als weißer Rahmen fünfmal je Sekunde über
  `nachBild`. Klick oder Ziehen schiebt die Ansicht. Der Test liest
  `window.uebersicht.punkte`/`rahmen`, prüft das Gelände an den Bildpunkten
  (Wald dunkler als Gras) und springt per Klick auf die fremde Basis. Gelernt:
  Innenabstand an einer Leinwand verschiebt `clientWidth` gegen die
  Zeichenfläche — weggelassen. Zeichenzeit nicht gemessen: die Übersicht
  zeichnet außerhalb von `zeichnen` und nur alle 200 ms.
- **46** · 2026-09-17 · A9 Teil 1: einheiten AC-21, bedienung AC-28,
  darstellung AC-9, fahrplan AC-7 **fertig**. Untätig ist jetzt eine Regel
  der Welt (`welt.untaetig`, weder laufen noch sammeln noch bauen) — der
  Prüfstand nutzt dieselbe statt einer eigenen; der Zustand schickt je Spieler
  `u` mit den Nummern, nur wenn es welche gibt. Unten links ein Knopf mit der
  Zahl (gelb, wenn jemand steht, aus bei null); Knopf und Taste `.` wählen
  reihum und holen den Dorfbewohner in die Bildmitte. Die Schautafel wird
  gegen `daten.js` geprüft: jede Einheit und jedes Gebäude in zwei Farben
  mit Namen — eine neue Art ohne Eintrag fällt auf. Gelernt: (1) wieder eine
  wachsende Liste auf Gleichheit geprüft (Felder je Spieler, bedienung
  AC-24) — auf „enthält" umgestellt, keine weitere gefunden; (2) zwei
  Unterschriften behaupteten zu viel: „Alle drei im Wald", als sie noch
  liefen, und „mit Namen", als die Namen der zweiten Gebäudereihe unter dem
  Rand lagen; (3) ein Test, der zwei Kriterien nennt, braucht für beide ein
  Bild — sonst beanstandet das Board.
- **44** · 2026-09-17 · A8 fertig: ki AC-3 bis AC-6 und fahrplan AC-5
  **fertig**. Wirtschaftsplan der KI: fester Plan je n-tem Dorfbewohner
  (Nahrung, Holz, Gold), höchstens sechs an Schafen, sechs an Beeren, dann
  Farmen; Lager, wo mindestens drei (Gold: zwei) weiter als fünf Felder vom
  nächsten Lager arbeiten; erstes Haus mit zwei Bauern; Ziel 22 Dorfbewohner,
  dann sparen. Gemessen über 20 Startwerte × 2 Spieler nach 10 Spielminuten:
  22 Dorfbewohner, Nahrung mindestens 520, längste Untätigkeit 0,6 s, Warten
  auf Wohnraum höchstens 3,5 s. Der Weg dorthin, alles mit dem Prüfstand
  gefunden: (1) zu lange an den Schafen, Beeren blieben liegen → Grenzen je
  Quelle; (2) ein Schaf zwischen zwei Feldern, gerundet ein Steinfeld — der
  Befehl „zum Schaf" wurde „Stein sammeln" → KI zielt auf ein Grasfeld am
  Schaf; (3) Stein gewann die Wahl, wenn alles andere voll war („fehlt 0"
  schlug „fehlt −1"); (4) **zweiter Fehler in der Simulation**: ein Bauer
  stand gerundet schon auf seinem Standfeld, genau gemessen 1,24 statt ≤ 1,2
  entfernt — die Wegsuche lieferte nichts, er gab auf, die Baustelle blieb
  ewig stehen, und die KI hing bei 14 Dorfbewohnern → `wegNach` geht den
  letzten Rest (Test bauen AC-1, ohne Korrektur rot); (5) ein größerer
  Hauspuffer änderte nichts, das Warten lag nur am ersten Haus. Ehrlich:
  Kriterientext von ki AC-4 und AC-5 präzisiert (Sparziel 22; Farmen, wenn
  der Plan mehr Leute an der Nahrung will, als an Schafen und Beeren Platz
  haben) — die zuerst geschätzten Testgrenzen („≥ 5 im Holz", „30 s Warten")
  jetzt aus Plan und Messung. `karriere AC-7` riss unter 100 % Last, allein
  und wiederholt grün.
- **43** · 2026-09-17 · A8 Teil 1: ki AC-1, AC-2, AC-7, AC-8 und fahrplan AC-4
  **fertig**. Grund-KI in `server/spiele/strategie/ki.js`: liest die Welt,
  ändert sie nur über `welt.nachricht` (Test ersetzt die Nachricht beim
  Entscheiden und vergleicht die Welt davor und danach), entscheidet alle
  halbe Sekunde mit festem Versatz je Spieler, Zufall aus dem Startwert.
  Plan noch schlicht: Schlange nie leer, Haus bei zwei freien Plätzen,
  Untätige reihum zu Beeren, Wald, Gold. Prüfstand in `pruefstand.js` und
  `npm run pruefstand:strategie`: nach jedem Takt Vorrat ≥ 0, Bevölkerung
  ≤ 200, keine Einheit im Hindernis, keine überlappenden Gebäude. **Im ersten
  Lauf einen echten Fehler gefunden** (Startwert 1, Takt 1015): ein Haus
  entstand auf Feldern, über die ein Dorfbewohner schon seinen Weg hatte — er
  lief hindurch. `belegen` sucht jetzt für jeden, dessen Weg über die neue
  Grundfläche führt, neu (Test bauen AC-3, ohne die Korrektur rot). Danach 20
  Startwerte × 10 Spielminuten ohne Widerspruch, je Partie 30–90 ms. Ehrlich:
  die Grund-KI kommt auf 15–16 Dorfbewohner und hat am Ende keine Nahrung —
  Beeren leer, keine Schafe, keine Farmen; das ist ki AC-4 bis AC-6 und
  fahrplan AC-5 (Ziel 20–30).
- **42** · 2026-09-17 · darstellung AC-8 **fertig** — Schritt A7 vollständig.
  Lebensbalken im Spielbild: über dem Kopf jeder gewählten Einheit, über dem
  Dach eines gewählten oder beschädigten Gebäudes (Baustellen nicht — deren
  Fortschritt steht in der Leiste); grün, unter einem Drittel rot; gemalt
  nach allem anderen, damit kein Baum sie verdeckt. `ansicht.lebensbalken`
  hält fest, was gemalt wurde — daran zählt der Test. Neuer Prüfgriff
  `leben` (Schaden, solange es keinen Kampf gibt), `lebenVoll(einheit)` in
  der Ansicht statt doppelt in der Auswahlleiste. Gelernt beim Ansehen: (1)
  der Gebäudebalken saß zuerst über der Fahnenspitze, 17 px dick, und deckte
  den Spielernamen zu — jetzt drei Viertel der Trefferhöhe, höchstens 5 px;
  (2) der Reiter ragt über die Figurenhöhe, sein Balken klebte am Helm —
  `FIGUREN.spaeherreiter.oben`. Neue Datei `strategie-lebensbalken.spec.mjs`.
  Bilder: `darstellung/AC-08--…`.
  `karte AC-15` riss einmal unter 99 % fremder Last trotz „schnellster von
  fünf" — allein grün, Wiederholung grün. Weiter beobachten.
- **41** · 2026-09-17 · darstellung AC-14 **fertig** — Schritt A6c
  abgeschlossen. Zuerst gemessen (neue Regel aus Runde 40, `npm run tafel`):
  Einheiten paarweise 0,55–0,97 verschieden, Gebäude 0,40–0,87 — nur
  Holzfäller- gegen Bergbaulager 0,29, unter dem Drittel. Das Bergbaulager hat
  jetzt ein Satteldach aus Schiefer mit First von hinten nach vorn statt
  desselben Pultdachs: das Paar liegt nun über 0,53, das knappste ist
  Dorfzentrum gegen Kaserne mit 0,40. Neuer Prüfgriff `gebaeude` (stellt ein
  fertiges Gebäude auf, nur wo `platzPruefen` es erlaubt) und
  `gebaeudeAufstellen` in `e2e/helpers/seite.mjs`; neue Datei
  `strategie-unterscheidbar.spec.mjs` mit allen sieben Gebäuden bei Zoom 1.
  Gelernt: (1) beim ersten Bild stand das Bergbaulager halb hinter der
  Kaserne — die Unterschrift nannte die Karre, die man nicht sah; jetzt eine
  Reihe gleicher Tiefe (x + y fest), nebeneinander im Bild, die flache Farm
  davor; (2) der gewöhnliche Lauf schreibt vorhandene Bilder nicht neu, auch
  nicht im selben Test mit geänderter Aufstellung — `qa:nachweis` nehmen.
  Bild: `darstellung/AC-14--zoom-1-dorfzentrum-mit-fahne-…`.
- **39** · 2026-09-17 · darstellung AC-13 **fertig** (A6c, Teil 4): Wasser
  und Vorräte. Das Wasser liegt jetzt in der Bodentextur: Anteil Wasser
  bilinear zwischen den Feldmitten, über ±0,3 Felder gemittelt, mit Rauschen
  verschoben — ein weiches Ufer aus Sand und Schlamm statt Ellipsen mit
  Bogenrand; die Wellenschnörkel sind leise Lichtstreifen. Erster Versuch
  mittelte über ±0,45: das Ufer war schön, aber ein einzelnes Wasserfeld
  verschwand fast — gefährlich, dort kann niemand laufen. Gold wie Erz, Stein
  warmgrau, Beeren dunkler, Laub olivgrün; gemessen Wald 0,36 → 0,25, Gold
  0,68 → 0,57 Sättigung, Gebäude im Mittel 0,28 → 0,24. **Kriterium
  umformuliert:** „mittlere Sättigung des Spielbilds unter der heutigen" maß
  das Falsche — das erdige Oliv hat in HSL mehr Sättigung (0,32) als das
  frühere graublaue Grün (0,25) und sieht doch natürlicher aus. Jetzt:
  Gebäude und Vorräte weniger gesättigt als vor A6c, Boden im Farbton 25°–100°
  (vorher 112°). Die Figuren sind nicht weniger gesättigt (0,33 → 0,34): die
  Spielerfarbe bleibt bewusst kräftig. Weitere Belege: kein Raster (Sprung an
  Feldgrenzen 1,11-mal der innen), Schatten rechts (Haus 852 zu 8 Punkte).
  Zeichenzeit Zoom 1 20,4 ms, Zoom 2 40 ms — unverändert. Unter 57 % Last riss
  einmal bedienung AC-1 („Rahmen wählt vier") — beim zweiten Lauf grün,
  vorher nie gesehen; beobachten. Bilder: `darstellung/AC-13--zoom-1-…`,
  `darstellung/AC-02--am-see-ein-weiches-ufer-…`.
- **38** · 2026-09-17 · darstellung AC-13 in Arbeit, Teil 3 (A6c): Figuren
  mit Proportionen. Kopf auf 60 % (`KOPF_MASS`), Beine 1,3-mal so lang, Rumpf
  höher und schmaler (0,82), Hände kleiner; Umriss zart dunkelbraun statt
  fast schwarz; Stiefel, Hufe, Mähne, Schafskopf dunkles Braun. Gemessen:
  fast schwarze Bildpunkte vorher 7,7–16 %, jetzt 0 %; das Gesicht (Hutrand bis
  Kinn) 16 von 150 Zeilen beim Dorfbewohner, vorher gut ein Viertel der
  Figur. Ehrlich: „Dorfbewohner höchstens halb so hoch wie ein Haus" galt
  schon vorher (29 zu 77 Bildpunkte) — der Test sichert es nur ab. Messbar
  gemacht über einen wählbaren Hautton (`lage.haut`), den später auch Völker
  brauchen; `figurHoeheBei(zoom)` aus `ansicht.js`, damit die Schautafel die
  Spielgröße nicht nachbaut. Erster Versuch hatte zum kleinen Kopf den alten
  breiten Rumpf — wirkte wie eine Kartoffel; erst schmaler sah es nach
  Mensch aus. Die älteren Figurentests (Gestalten, Spielerfarbe, Tonstufen)
  blieben grün. Aufgefallen: jetzt wirken Gold (leuchtend gelb), Beeren
  (knallrot), Schafe und der See am meisten nach Comic. Bilder:
  `bilder/nachher-runde38-figuren-zoom2.png`, `nachher-runde38-schautafel.png`.
  Offen für AC-13: (2) Sättigung des Spielbilds messen, (4)/(5) Boden und
  Schatten per Test belegen, Vorräte und Wasser dämpfen.
- **37** · 2026-09-17 · darstellung AC-13 in Arbeit, Teil 2 (A6c): Gebäude
  ohne schwarze Umrisse. Die Kante ist jetzt ein dünnes, halb durchsichtiges
  Dunkelbraun; Fenster, Tor, Nabe, Räder dunkelbraun statt schwarz; Ziegel
  Terrakotta statt Signalrot, Stroh grau-gelb, Holz und Acker grauer.
  Gemessen mit `schautafel.anmutung` in Spielgröße: fast schwarze Bildpunkte
  vorher 7–12 %, jetzt 0 % bei allen sieben Gebäuden — es waren nur die
  Umrisse. Sättigung Dorfzentrum 0,37 → 0,29, Haus 0,34 → 0,25, Farm 0,40 →
  0,29; Mühle und Kaserne gleich (ohne Umriss fallen auch graue Kantenpunkte
  weg). Neuer Test prüft ≤ 3 % je Gebäude, auf dem alten Stand rot (7,3 %).
  Gelernt: gedämpfte Farben kosten Tonstufen — darstellung AC-12 fiel beim
  Holzfällerlager auf 17 (Grenze 19); behoben mit verschieden getönten
  Brettern, Stämmen und Rinde, nicht mit der Grenze. Der stärkere Dachverlauf
  dafür machte die beiden Lager zu ähnlich (bauen AC-20/darstellung AC-4) —
  jetzt nur am Holzdach. Vorher/nachher:
  `bilder/vorher-runde37-gebaeude-zoom2.png`, `nachher-runde37-…`. Nächster
  Teil: Figuren mit echten Proportionen und ohne Umriss (jetzt fallen sie
  neben den Gebäuden als Comic auf).
- **36** · 2026-09-17 · darstellung AC-13 in Arbeit, Teil 1 (A6c): Boden und
  Schatten. Der Boden kommt aus `public/boden.js`: Farben aus glattem Rauschen
  in einem Punktgitter alle 6 Bildpunkte, weich vergrößert — erdiges Oliv,
  trockene Stellen, Erdflecken über Feldgrenzen, Sprenkel, kein Rautenraster.
  Vorgezeichnet in Kacheln (528 px, drei Auflösungen), ein geändertes Feld
  verwirft die Kacheln darum. Erster Versuch mit einer Farbe je Feld zeigte
  weiter Treppen — erst das Punktgitter löste das. Gebäude werfen einen
  weichen Schlagschatten nach rechts unten, Bäume, Sträucher und Brocken eine
  gestreckte Ellipse. Gemessen unter Last (CPU 70 %): Zoom 1 21–22 ms statt
  25, Zoom 2 36–40 statt 28 — Zoom 2 teurer, offen. Gelernt: (1) der Test zu
  darstellung AC-2 prüfte noch die alte Farbfunktion, die das Bild nicht mehr
  nutzt — umgestellt; (2) eine Bildunterschrift sprach von „Rautenfeldern";
  (3) unter voller Last (Lauf 11 min) zeigten zwei Tests Schwächen: eine
  3-Sekunden-Meldung und Lieferungen vor dem fertigen Lager — beide robuster.
  Aufgefallen: der See wirkt mit seinen Bögen noch comichaft. Nächster Teil:
  Gebäude ohne schwarze Umrisse, gedämpfte Farben. Nachtrag: karte AC-15 fiel
  unter fremder Last (CPU 97 %) zweimal durch — misst jetzt den schnellsten von
  fünf Durchgängen statt eines Mittels, die Grenzen bleiben.
- **35** · 2026-09-17 · Rückschau: wachsende Listen in Tests, `platzTaugt` für
  Vorschau und Test-Helfer, Stand in CLAUDE.md. Nächstes: darstellung AC-8,
  dann **A8** Wirtschafts-KI und Prüfstand.
- **34** · 2026-09-17 · bauen AC-13 und AC-21 fertig. Webstuhl als erste
  Verbesserung (`VERBESSERUNGEN` in `daten.js`): im Dorfzentrum wie eine
  Einheit eingereiht, braucht keinen Wohnraum, einmal je Partie, +15 Leben für
  vorhandene und neue Dorfbewohner (Rüstung als Wert schon da, wirkt ab Stufe B).
  Sammelpunkt: Rechtsklick mit gewähltem Gebäude, Fahne mit gestrichelter
  Linie; Neue gehen hin oder sammeln dort. Gelernt: (1) Ein wartender
  Dorfbewohner vorn in der Schlange blockiert alles dahinter — der Test räumt
  die Schlange erst. (2) Der Preis im Ausbildungsknopf ist jetzt wie im
  Baumenü je Rohstoff gezeichnet; ein Test, der „60 / 20" als Text las, liest
  die Zahlen an ihren Symbolen. Offen aus A7: darstellung AC-8 (Auswahl und
  Leben am Boden). Danach A8: Wirtschafts-KI und Prüfstand.
- **33** · 2026-09-17 · einheiten AC-22 fertig (auf Frage des Benutzers):
  eigene Schafe per Klick oder Rahmen wählen, per Rechtsklick treiben
  (0,7 Felder/s, weich gezeichnet mit Schritten); fremde Schafe, die nur
  Einheiten eines anderen Spielers sehen, wechseln einmal je Sekunde den
  Besitzer. Gelernt: (1) Der alte Rahmen-Test (bedienung AC-1) fand, dass ein
  Rahmen um die Dorfbewohner die Schafe daneben mitnahm — jetzt Einheiten
  zuerst, Schafe nur allein, wie in der Vorlage. (2) Ein Schaf auf ein
  Baumfeld zu schicken tut nichts; der Test sucht ein Grasfeld. (3) Das
  Standbild zeigt nicht, dass etwas läuft — Unterschrift ehrlich gemacht.
  Offen aus A7: Webstuhl (bauen AC-21), Sammelpunkt (bauen AC-13),
  darstellung AC-8.
- **32** · 2026-09-17 · bauen AC-9 und AC-20 fertig: Kaserne (3 × 3, 175 Holz,
  50 s) mit Steinmauern, Holzobergeschoss, Zinnen, Banner in Spielerfarbe und
  Waffenständer; sie bildet Miliz für 60 Nahrung und 20 Gold in 21 s aus. Die
  Miliz läuft, sammelt und baut nicht (Kampf in Stufe B). Damit stehen alle
  sieben Gebäude der Dunklen Zeit als Daten. Gelernt: (1) Zum zweiten Mal in
  Folge zählte der Baumenü-Test fest — jetzt aus `werte.einheiten.dorfbewohner.baut`.
  (2) Ein alter Test nahm „kaserne" als Beispiel für Unbaubares; ein erfundener
  Name („burg") altert nicht. (3) `platzImBild` übersah Farmen (begehbar, aber
  belegt) und schlug einen roten Platz vor. Gesehen, nicht behoben: oben links
  überdeckt die Kopfzeile Spielfläche (ein Schaf unter „Karte 4711"). Nächster
  Teil von A7: Webstuhl, Sammelpunkt, Schafe treiben.
- **31** · 2026-09-17 · einheiten AC-18 fertig: die Farm — 3 × 3, begehbar,
  175 Nahrung, 0,32 je Sekunde, höchstens ein Bauer; nach dem Bau bestellt der
  Bauer sie, leer verschwindet sie. Gezeichnet als Acker mit Furchen, Getreide,
  Zaun und Vogelscheuche in Spielerfarbe, im Bodendurchgang unter Figuren.
  Begehbare Gebäude belegen kein Kartenfeld, deshalb prüft der Bauplatz sie
  eigens — auf dem Server und in der Vorschau. Gelernt: (1) Der alte
  Baumenü-Test zählte vier Knöpfe und behauptete „Haus bereit" — mit der Farm
  falsch, samt Unterschrift. (2) „Hat Höhe" gilt nicht für ein flaches Gebäude;
  die Ausnahme steht mit Grund am Test. (3) Im Bild sah die Vogelscheuche aus
  wie der Hut des Bauern — in die Ecke gerückt. Nächster Teil von A7: Kaserne
  und Miliz, dann bauen AC-20 fertig.
- **30** · 2026-09-17 · Rückschau: Regel für alle Zeitmessungen, Messen beim
  Zeichnen, CLAUDE.md nachgezogen. Nächster Schritt: Rest von **A7** — Farm
  (einheiten AC-18), Kaserne und Miliz, Webstuhl, Sammelpunkt, Schafe treiben.
- **29** · 2026-09-17 · darstellung AC-12 fertig — Schritt **A6b
  abgeschlossen**. Teil 3: Mischwald aus Laubbäumen (volle Kronen aus
  Blattballen) und Tannen, Sträucher aus Blättern, Brocken mit Rissen und
  Funkeln, Grasbüschel und Blumen ab Zoom 1,2, Wasser mit nassem Saum.
  Gemessen, weil Hunderte Dinge im Bild stehen (`npm run sicht -- --spiel
  --messen`, ohne Grafikkarte): Grasbüschel einzeln gezeichnet +28 ms je Bild,
  in zwei Pfaden gesammelt praktisch nichts; Vorräte aus dem Zwischenspeicher
  halb so teuer wie direkt. Ergebnis bei Zoom 1: 18 ms statt 24 ms vorher,
  bei Zoom 2: 29 ms statt 18 ms. Belegt über Tonstufen je Zeichnung, alt gegen
  neu gemessen (Figuren 13–15 → 26–30, Vorräte 5–6 → 16–23). Gelernt: Laubbäume
  mit langem Stamm und kleiner Krone sahen aus wie Luftballons; Halme bei
  Zoom 1 wie Rauschen — beides erst im Bild gesehen. Browserlauf 5,9 min —
  für die Rückschau (30).
- **28** · 2026-09-17 · darstellung AC-12 in Arbeit, Teil 2: die Gebäude.
  Mauerwerk mit versetzten Fugen, Putz, Bretter, Ziegelreihen, Stroh,
  Schindeln, Fenster mit Sprossen, Brettertüren mit Beschlag, gewellte Fahne,
  Mühlenflügel mit Latten, Stämme mit Jahresringen, Goldkarre mit Glanz. Jede
  Oberfläche auf ihre Fläche zugeschnitten (clip). Weil ein Gebäude jetzt
  Hunderte Striche braucht, wird es im Spielbild einmal in ein kleines Bild
  gezeichnet und dann kopiert (`gebaeudeBildZeichnen`, höchstens 64 Bilder).
  Gelernt: darstellung AC-4 (Gebäude unterscheidbar) fiel für die beiden Lager
  unter 25 % — gleiche Schindeln auf gleichem Dach. Dächer farblich getrennt
  statt die Schwelle zu senken. Nächster Teil: Bäume, Vorräte, Gras.
- **27** · 2026-09-17 · darstellung AC-12 in Arbeit, Teil 1: die Figuren.
  Licht von links oben als Verlauf über drei Töne, weiche Umrisse, außen
  kräftiger als innen, Falten, Gürtelschnalle, Strohhut mit Geflecht,
  Kettenhemd, Hohlkehle am Schwert, Pferd mit Muskel und Glanz, Wolle aus
  Kringeln, Auge mit Lichtpunkt. Unter 20 Bildpunkten Höhe fallen die feinsten
  Striche weg. Vorher/Nachher in `docs/strategie/bilder/`. Die Masken-Tests
  (Gestalt, Spielerfarbe) hielten ohne Änderung. Beim Ansehen wieder eine
  Unterschrift im Plural bei einem sichtbaren Träger korrigiert. Nächste
  Teile: Gebäude, Vorräte, Gras.
- **26** · 2026-09-17 · einheiten AC-17 fertig: Schafe schlachten und hüten —
  0,33 Nahrung je Sekunde, ein liegengelassener Kadaver verliert je 4 s eine,
  der Hirte steht neben dem Tier und geht nach dem Abgeben zurück. Kadaver
  gezeichnet (liegt, Beine nach oben, wird kleiner). Neu angelegt: einheiten
  AC-22 (Schafe wählen und treiben, auf Frage des Benutzers) und darstellung
  AC-12 (gezeichnet statt flach, Wunsch des Benutzers) mit Schritt A6b.
  Gelernt: (1) Ein Klick auf Beeren traf das Schaf daneben — ein Vorrat auf
  dem Feld hat Vorrang; der alte Test zu einheiten AC-15 hat es gefunden.
  (2) Im ersten Bild verdeckte der Hirte den Kadaver: er stand auf dessen
  Feld. (3) karte AC-15 (Zeitmessung Wegsuche) riss unter Last im vollen Lauf,
  allein grün — wie karriere AC-7; nach einmaliger Wiederholung grün. (4) Und
  noch einmal ein Heredoc mit Anführungszeichen — abgebrochen, nichts
  geschrieben; die Regel gilt auch für Doku-Texte.
- **25** · 2026-09-17 · Rückschau: Zeitraffer in den langsamen Browsertests,
  `npm run e2e:laufzeiten`, Bauplatz-Helfer geteilt, Heredoc-Regel ohne
  Ausnahme. Browserlauf 2,8 → 2,1 min. Nächster Schritt: **A7** (Schafe,
  Farm, Kaserne, Miliz, Webstuhl, Sammelpunkt).
- **24** · 2026-09-17 · bedienung AC-18 und uebertragung AC-8 fertig — Schritt
  **A6 abgeschlossen**. Absagen des Servers und Klicks auf Gesperrtes (Knopf,
  roter Bauplatz) blenden sich oben kurz ein; auch der Ausbildungsknopf ist
  jetzt `aria-disabled`. Die weiche Bewegung ist belegt: ein Reiter wird in
  einer Sekunde an mehr als 1,5-mal so vielen Stellen gezeichnet, wie Zustände
  kommen. Gelernt: ein Test, der erst Nahrung auf 0 setzt und dann einen
  Auftrag abbricht, bekommt 50 zurück — die Reihenfolge im Test ist Teil der
  Behauptung. Browserlauf 3,6 min, aber unter fremder Last (CPU 88 %) —
  nicht vergleichbar. Nächste Runde ist die Rückschau (25).
- **23** · 2026-09-17 · bauen AC-1, AC-4, bedienung AC-15, AC-25,
  darstellung AC-4, AC-5 und einheiten AC-16 fertig: Baumenü am Dorfbewohner,
  grün/rote Vorschau unter dem Zeiger, Esc, gezeichnete Häuser, Mühle, Lager
  und Baustellen, Abriss in der Leiste. bauen AC-20 zurück auf `offen` — Farm
  und Kaserne gehören zu A7, nicht vorgezogen. Gelernt: (1) Beim Ansehen drei
  Bilder verworfen: Baustelle hinter dem Dorfzentrum, Lager ohne sichtbaren
  Träger (die Wege liefen hinter dem Dach), Bretter als schwarzer Klecks
  (geerbte Linienbreite). Tests suchen Plätze jetzt „vorn" oder „seitlich".
  (2) Ein Zustand im Zeitraffer fasst mehrere Takte — Abstandsgrenzen im Test
  müssen den Weg dazwischen einrechnen. (3) `aria-disabled` statt `disabled`,
  damit der Knopf beim Überfahren sagt, was fehlt; Playwright klickt ihn nur
  mit `force`. Der Browserlauf ist auf 2,8 min gewachsen (Lagertest wartet
  auf Lieferungen) — ein Faden für die Rückschau nach Runde 25.
- **22** · 2026-09-17 · bauen AC-2, AC-3, AC-5, AC-6 fertig; AC-1 und
  einheiten AC-16 in-qa (Bild mit der Bauoberfläche), AC-20 in Arbeit (Farm,
  Kaserne fehlen). Gebäude belegen ihre Grundfläche als Feldart `BEBAUT` —
  die Wegsuche weicht ohne Änderung aus. Dorfbewohner bauen, mehrere
  schneller (3 t / (n + 2), auf zwei Takte gemessen), Abriss erstattet den
  Rest, Abgabe am nächsten passenden Lager. Das Dorfzentrum ist jetzt so groß
  wie seine 4 × 4 Felder; die Schafe rücken von 4 auf 5 Felder hinaus.
  Gelernt: (1) Wieder ein Heredoc mit Anführungszeichen abgebrochen — trotz
  Regel; lange Testtexte gehören in eine Datei. (2) ECONNRESET am Prüfgriff:
  wiederverwendete Verbindung, die der Server gerade schloss — jetzt
  `Connection: close`. (3) Die Regel aus Runde 20 hat gegriffen: „acht Schafe"
  stand im Bild nur siebenmal, weil das größere Gebäude eines verdeckt.
- **21** · 2026-09-17 · bedienung AC-29 fertig — Schritt **A5 abgeschlossen**.
  Eine ausgewählte Einheit zeigt unten Bild, Name, Lebensbalken und Ladung,
  ein Gebäude zusätzlich sein Leben. Die Werte der Arten (Leben, Tragkraft,
  Kosten, was ein Gebäude ausbildet) kommen einmal im Aufbau; die doppelte
  Kostentabelle im Browser aus Runde 19 ist damit weg. Leben geht im Zustand
  nur mit, wenn es fehlt — für uebertragung AC-7. Gelernt: Die neue Regel aus
  der Rückschau (Zahl in der Unterschrift vorher im Test) hat gleich getragen,
  das Bild passte beim ersten Ansehen. Nächster Schritt: **A6** Bauen.
- **20** · 2026-09-17 · Rückschau: Helfer `partieZuZweit`, Regeln zu
  Bildunterschriften und zum Zeittest unter Last. Nächste Runde: bedienung
  AC-29 (Werte der Auswahl), dann **A6** Bauen.
- **19** · 2026-09-17 · bauen AC-10, AC-12, AC-15, AC-22 und bedienung AC-26
  fertig: Start mit drei Dorfbewohnern und Späherreiter, Dorfzentrum als
  gezeichnetes Gebäude (`public/gebaeude.js`), anklickbar, unten eine
  Ausbildungsleiste mit Schlange, Balken, Abbruch und „Bevoelkerung voll".
  Gelernt: (1) uebertragung AC-7 riss mit Art und Gebäuden (1177 Byte) —
  nicht gelockert, sondern Art als Kürzel und Gebäude nur bei Änderung, und
  der Test legt wieder zehn Einheiten an, wie das Kriterium sagt. (2) Zweimal
  verdeckte das Gebäude eine Figur (Startplatz und Erscheinungsfeld dahinter)
  — beides erst im Bild gesehen, jetzt „vorn zuerst" mit Test. (3) Zweimal
  stimmte die eigene Bildunterschrift nicht (Balken bei 8 % unsichtbar;
  „fünf Dorfbewohner" waren vier plus Reiter). Unterschrift zählen, nicht
  schätzen. karriere AC-7 riss wieder unter fremder Last (1,2–2,4 s, allein
  459 ms).
- **18** · 2026-09-17 · bauen AC-8, AC-11, AC-14, AC-16 fertig; AC-10, AC-12
  in-qa (Bild mit bedienung AC-26), AC-15 in Arbeit (Hinweis in der
  Oberfläche fehlt). Dorfzentrum als Gebäude mit Schlange, Bezahlen beim
  Einreihen, Abbruch mit voller Erstattung, Wohnraum aus Gebäuden. Der Server
  reicht Partienachrichten jetzt an `welt.nachricht()` weiter — `index.js`
  kennt kein Ausbilden (ADR-0006). Gelernt beim Zuschneiden: mit fünf
  Dorfbewohnern zu Beginn ist der Wohnraum voll, Ausbilden ginge im Spiel nie
  — die Startaufstellung der Vorlage (drei plus Späher) ist deshalb als
  bauen AC-22 abgetrennt und kommt vor oder mit der Oberfläche.
- **17** · 2026-09-17 · bedienung AC-24, AC-17 fertig: Leiste mit gezeichneten
  Symbolen für Holz, Nahrung, Gold, Stein und Bevölkerung 5/5 (Wohnraum aus
  `GEBAEUDE` in `daten.js`), Zahlen laufen in 0,5 s auf den neuen Wert.
  Gelernt: der Zeitstempel von `requestAnimationFrame` liegt vor einem
  `performance.now()`, das im selben Bild gesetzt wurde — der Anteil wurde
  negativ, die Leiste zählte kurz rückwärts (250 → 249). Gefunden nur, weil
  der Test die Folge Bild für Bild mitschreibt und „nie rückwärts" prüft.
  Aus A4 offen: einheiten AC-16 (Lager) mit A6. Nächster Schritt: **A5**.
- **16** · 2026-09-17 · einheiten AC-15, AC-19 fertig, AC-11 abgelöst: Werte
  in `daten.js`, Sammeln je Takt mit der Rate der Vorlage, Tempo 0,8, Gold und
  Stein sammelbar, Ladung verfällt nur beim Rohstoffwechsel. Gelernt: mit den
  echten Werten dauert die erste Holzlieferung knapp eine Minute — dafür ein
  **Zeitraffer als Prüfgriff** (`raum.zeitraffer`, im Browserlauf über
  `zeitraffer(page, code, faktor)`), nicht längere Wartezeiten. Der stumpfe
  Netztest (`holz >= 10` trotz Startvorrat 200) prüft jetzt: tragend steht der
  Vorrat still, danach mindestens +10. Bildunterschrift „die Dorfbewohner
  arbeiten" beim Ansehen korrigiert — im Bild war nur einer. Offen aus A4:
  AC-16 (Lager, mit A6), bedienung AC-24/AC-17 (Leiste mit Gold und Stein).
- **15** · 2026-09-17 · Rückschau: `npm run sicht -- --spiel`, Regeln zu
  Wertänderungen und Änderungsskripten. Nächste Runde: **A4** (vier Rohstoffe
  sammeln, Abgabe, Werte der Einheiten, Rohstoffleiste).
- **14** · 2026-09-17 · darstellung AC-2 fertig: Gras-Tönung aus dem
  Startwert, Wasser als Vereinigung von Ellipsen mit Sandsaum und Wellen, Seen
  bei der Erzeugung geglättet. Erster Ansatz (Sand an jeder Rautenkante) war
  grün getestet und sah aus wie ein geflieste Becken — beim Ansehen verworfen.
  Gelernt: gerade bei Aussehen reicht ein grüner Test nie; und manche
  „Zeichenfehler" sind Daten (Grasinseln im See aus der Kartenerzeugung).
- **13** · 2026-09-17 · A3: darstellung AC-1 (Raute, Umrechnung auf 1e-9
  genau), AC-3 (Bäume, Beeren, Gold, Stein als Dinge, schrumpfen beim Leeren),
  AC-7 (Tiefenordnung) fertig. Erster Wurf beim Ansehen nachgebessert:
  Beerenstrauch zu klein, Gold und Stein zu klein, Gras wie ein Schachbrett.
  Zwei Optimierungen gemessen und verworfen (siehe Offene Fäden). Eine
  Bildunterschrift behauptete Verdeckung, die das Bild nicht zeigte — ersetzt.
  Nächste Runde: **A3-Rest darstellung AC-2** (Gelände lebt, weiche
  Wasserkanten); Runde 15 ist die nächste Rückschau.
- **12** · 2026-09-17 · A2 abgeschlossen: karte AC-15 (Ecke zu Ecke 1,2 ms,
  Mittel 0,28 ms auf 200 × 200), AC-16 (acht Schafe mit Halsband in
  Spielerfarbe), AC-17 (Aufbau bei acht Spielern 53 KB). Entschieden: Tiere
  gehen einmal im Aufbau und danach nur bei Änderung über die Leitung —
  Zustand bleibt klein (uebertragung AC-7). Das Bild behauptete ein Halsband,
  das in Spielgröße kaum zu sehen war: Schafe größer, Bild näher. Nächste
  Runde: **A3 isometrischer Blick** (Gelände, Bäume, Gold, Stein als Dinge).
- **11** · 2026-09-17 · A2 (Teil 1), nach fünf Stunden Warten committet, als
  `npm run check` bei 18 % Last grün war (257/257). Beleg dazwischen: auch der
  letzte Commit ohne diese Änderungen scheiterte unter Last am selben Zeittest. karte AC-11–14 und
  auswahl AC-6 gebaut und belegt, karte AC-2, 3, 8 abgelöst; Browserlauf 79/79
  grün, ohne Browser 256/257 — rot nur karriere AC-7 unter fremder Last
  (drittes Mal). Gefunden: länglicher Beerenblock und Runden aufs Raster
  machten die Abstände ungleich (im Produkt behoben); Wegsuche auf flache
  Zahlenfelder umgebaut, zufällige Suche auf 200 × 200 im Mittel 0,25 ms; ein
  Vorratstest war durch den Startvorrat wirkungslos geworden und ist wieder
  scharf. `zurueckgestellt` neben alter Begründung beanstandet die Prüfung
  nicht. Wartet auf grüne Prüfung oder Antwort zur Frage „Zeittest unter Last".
- **10** · 2026-09-16 · Rückschau: `npm run sicht`, Regeln zu Messannahmen
  und Spielgröße in die Anweisung. Nächste Runde: **A2 Karte**.
- **9** · 2026-09-16 · A1b: darstellung AC-6 fertig — Dorfbewohner (Hut,
  Kittel in Spielerfarbe, Axt; trägt Holzbündel, Beerenkorb, Gold), Miliz
  (Helm, Schwert, Schild), Späherreiter zu Pferd; Schautafel; im Spiel
  Figuren mit Blickrichtung, Schritt und Auswahlellipse. Erster Wurf beim
  Ansehen verworfen (Axt vor dem Gesicht, schwebender Reiterkopf). Zwei
  Testannahmen waren falsch, nicht die Figuren: Ladung macht die Figur nicht
  größer (Axt fällt weg), Holz und Beeren unterscheiden sich in der Farbe,
  nicht im Umriss. Nächste Runde: **A2 Karte**.
- **8** · 2026-09-16 · A1: raeume AC-16 fertig — `raeume.js` lädt kein Spiel
  mehr, die Welt entsteht über den Steckbrief. Gelernt: ein Taktzähler mit
  echter Uhr schwankt unter Windows (7 statt 10 in 0,5 s); `t.mock.timers`
  macht solche Tests genau, ohne die Schwelle zu lockern. Nächste Runde:
  **A1b Figuren** (Wunsch des Benutzers).
- **7** · 2026-09-16 · Spec-Runde Stufe A: bauen neu gefasst (Gebäude der
  Dunklen Zeit, AC-20, AC-21), karte AC-11–17, einheiten AC-15–21, bedienung
  AC-24–29, neue Specs darstellung (11) und ki (8), Bauabfolge A1–A10 im
  Fahrplan. 41 neue Kriterien. Entschieden: fertige Kriterien der kleinen
  Fassung bleiben `fertig`, bis ihr Nachfolger steht (Anweisung angepasst).
  Abweichungen von der Vorlage, begründet: Karte bis 200 statt 220,
  Warteschlange 15. Nächste Runde: **A1**.
- **6** · 2026-09-16 · auswahl AC-11 und fahrplan AC-1 fertig: der Einstieg
  am Stück, von der Anmeldemaske bis zur laufenden Partie, Code über die
  Zwischenablage. Gelernt: eine Bildunterschrift behauptete „beide Basen",
  zu sehen war eine — auch Unterschriften gehören geprüft, nicht nur Bilder.
  Nächste Runde: **Spec-Runde Stufe A**.
- **5** · 2026-09-16 · Rückschau: drei Regeln in die Anweisung, Bilder in
  jeder Abschlussnachricht, fahrplan AC-1 von auswahl AC-12 gelöst.
- **4** · 2026-09-16 · fahrplan AC-2, bedienung AC-1, 2, 7, 8, 12, 16 und
  auswahl AC-7 fertig: das Spielbild zum ersten Mal im Browser. Alle Tests
  beim ersten Lauf grün — aber das Bild zu AC-16 zeigte die Ladung nicht:
  winziger Punkt unter dem Auswahlring. Größer, außerhalb des Rings, mit
  Rand; Namen über den Einheiten. Wieder: erst das Ansehen hat es gefunden.
- **3** · 2026-09-16 · auswahl AC-9, 10, 13 fertig: Einstellungen im
  Warteraum (Gastgeber Felder, Mitspieler Werte), Änderung per `einstellen`
  bis zum Start, Code kopieren. Gelernt: ein Test, der `eingang` leert und
  danach auf eine alte Nachrichtenart wartet, hängt bis zur Frist — Werte
  vorher festhalten. Felder des Gastgebers nur einmal je Raum bauen, sonst
  löscht jede Raumnachricht die laufende Eingabe.
- **2** · 2026-09-16 · auswahl AC-4, 5, 8 fertig: Einstellungen als Liste im
  Steckbrief, Formular daraus, Prüfung auf dem Server. Gelernt: (1) Ein Import
  namens `einstellungen` wurde vom gleichnamigen Parameter in `starten()`
  überdeckt — „is not a function" erst zur Laufzeit. (2) Das Bild zu AC-8
  zeigte die Absage nicht, weil sie am Tafelende stand; beim Ansehen gefunden,
  jetzt steht sie am Formular und der Test prüft `toBeInViewport`. Bilder
  ansehen lohnt sich.
- **1** · 2026-09-16 · auswahl AC-1–3 fertig: Übersicht der Spiele aus
  Steckbriefen, Kennzeichen „im Bau"/gesperrt. Gelernt: `body` war
  `overflow: hidden` und zentriert — jede längere Tafel wäre auf 1366×768
  oben abgeschnitten worden; jetzt `place-items: safe center` mit Test.
- **0** · 2026-09-16 · Einrichtung: ADR-0012, Fahrplan, Vorlage, diese Datei,
  Anweisung. Noch nichts gebaut.
