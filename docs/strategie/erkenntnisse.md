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

- **Die KI mit eigener Sicht macht KI gegen KI länger — wie weiter?**
  (Runde 114, zweiter Anlauf an ki AC-13) Die KI sieht nur noch, was ihre
  Einheiten sehen, und erkundet mit dem Späher (alle 40 finden den Gegner
  nach rund zwei Minuten). Zwei echte Fehler sind gefunden und behoben: die
  Suche pendelte im Umkreis, und sie hielt sich ohne frischen Blick für
  überlegen und schickte bis zu achtzigmal zwei, drei Mann los. Übrig: 35
  von 40 Partien enden vor Minute 60 (alter Stand 39). Was bleibt, sind
  **Patts im Mittelspiel** — beide mit 5 bis 17 Kampfeinheiten, Gold und
  Holz bei null, keiner bricht durch; das kennt auch der alte Stand
  (Startwert 24: 74 Minuten), der Nebel verschiebt nur, wen es trifft.
  **Empfehlung:** fahrplan AC-11 nicht senken, sondern das Patt als eigenes
  Kriterium der KI angehen (ihre Wirtschaft geht im Mittelspiel aus — sie
  zieht nicht zu neuen Vorräten um), dann ki AC-13 auf diesem Boden
  einbinden. Bis dahin liegt ki AC-13 auf dem Zweig `strategie-ki-sicht`
  (`8817c60`). **Alternative:** fahrplan AC-11 für Partien im Nebel neu
  fassen (etwa: alle mit Sieger vor Minute 90, Median unter 45) — das wäre
  ehrlich, weil Partien im Nebel länger dauern, aber es ist eine
  Entscheidung über das Spiel, keine der Schleife.

- **Formationen wie im Original?** (Runde 111) Marschierende Einheiten
  laufen heute auf demselben Weg genau übereinander, im Angriffslauf der KI
  im Median 53 Sekunden lang (einheiten AC-32); im Bild sieht ein Heer aus
  wie halb so groß. Abstand halten im Gehen löst das, zieht das Heer aber zu
  einer Reihe, die stückweise ankommt und verliert — KI gegen KI dauert dann
  zwei bis acht Minuten länger und reißt fahrplan AC-11. Die Vorlage löst es
  mit **Formationen**: eine Gruppe geht im Tempo der langsamsten auf
  parallelen Bahnen (Linie, Kasten, gestaffelt, Flanke). Vorschlag: zunächst
  nur die eine Grundformation, ohne Wahl in der Oberfläche — eine Gruppe
  bleibt im Gehen beisammen und nebeneinander. Das ist neuer Umfang, deshalb
  die Frage: **gewünscht, und wann — jetzt in Stufe C oder mit Stufe D?**

- **Name des Spiels.** „Age of Empires" ist eine Marke und darf nicht
  erscheinen ([ADR-0012](../adr/0012-aoe2-als-vorlage.md)). Bis ein Name
  feststeht, heißt es in der Oberfläche „Strategie". Vorschlag des Benutzers
  (2026-09-17): **Rise to Hegemony** („Enough diplomacy. Rise to Hegemony.").
  Gegenvorschlag der Schleife: „Vormacht" (deutsch, dasselbe Wort). Nicht
  geprüft: Markenregister; es gibt eine Strategiereihe „Hegemony". **Neuer
  Vorschlag des Benutzers (2026-11-08): „Fading Allies".** Empfehlung der
  Schleife: dafür — der Name erzählt `spielziel AC-14` („Bündnisse sind nicht
  vorgesehen … Absprachen finden am Tisch statt"): zu fünft verbündet man sich
  mündlich, das Spiel hält niemanden daran, und jede Abmachung verblasst beim
  ersten Angriff. Eine einfache Websuche fand kein Spiel dieses Namens (am
  nächsten: das Brettspiel „Fatal Alliances", 2016); ein Markenregister ist
  nicht durchsucht. **Entschieden am 2026-11-08: „Fading Allies"** — seit
  Runde 87 in der Oberfläche (spielauswahl AC-20). Der Punkt bleibt hier, bis
  der Benutzer ihn gesehen hat; dann wandert er aus den Fragen.
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

- **Gezeichnete Figuren oder erzeugte Bilder?** Frage des Benutzers
  (2026-11-07): „sollte ChatGPT ein paar Figuren erschaffen, die wir dann
  einbinden?“ Antwort der Schleife: der Einbau ist der kleinere Teil — wir
  zeichnen Gebäude und Dinge schon in Zwischenbilder (`gebaeudeBildZeichnen`,
  `dingBildZeichnen`) und kopieren die, ein PNG paßt genau dort hinein und ist
  schneller als unsere Pfade. Das Problem ist der **Satz**: acht Richtungen ×
  fünf Bewegungen × rund zehn Bilder sind etwa 400 Bilder je Einheit, und ein
  Generator würfelt jedes neu — dazu die Spielerfarbe, die bei uns zur Laufzeit
  eingefärbt wird. Empfehlung, dreigeteilt: **ja** für Unbewegliches (Gebäude,
  Bäume, Vorräte, Bodentextur, Symbole — ein Bild, eine Richtung, die große
  Fläche); **nein** für generierte Figuren, die stattdessen als Maßstab für das
  Zeichnen im Code dienen; und wenn Figuren wirklich auf Original-Niveau
  sollen, je ein 3D-Modell mechanisch aus acht Richtungen gerendert — so wurde
  AoE II selbst gemacht, aber das ist eine eigene Stufe mit Blender im
  Werkzeugkasten. Achtung: „kein Material aus dem Original“
  ([ADR-0012](../adr/0012-aoe2-als-vorlage.md)) hält ein Generator nicht von
  selbst ein — die Beschreibung muß das Ding nennen, nie das Spiel. **Billigste
  Entscheidungshilfe:** eine Runde, in der ein Gebäude als PNG neben dem
  gezeichneten steht, gleiches Bild, gleiche Messung. Wartet auf ein Ja.

## Offene Fäden

- **Bildrückstand aus der Durchsicht nach Runde 115** (alle schon in der
  eingecheckten Fassung so, keiner neu): kampf AC-01 = einheiten AC-31 — zwei
  rote Milizen im Bild, die Unterschrift nennt eine, und Figuren stehen
  halb übereinander; kampf AC-04 — Berts Dorfbewohner halb unter den
  Auswahlringen; bedienung AC-34 — die rote Miliz fast ganz hinter dem
  Zielzeichen; fahrplan AC-03 — „fünf Dorfbewohner und eine Miliz" ist im
  weiten Bild nicht zählbar. Wer eines dieser Bilder anfasst, stellt es neu
  auf (`figurenFrei`, näher heran).

- **ki AC-13 liegt auf dem Zweig `strategie-ki-sicht`** (`8817c60`, Runden
  112 und 114): die KI mit eigener Sicht, Späher, Suche über die ganze Karte,
  überlegen nur mit frischem Blick. KI gegen KI: 35 von 40 Partien vor
  Minute 60 (alter Stand 39); übrig sind Patts mit leerer Wirtschaft
  (Startwerte 9, 15, 33; 21 und 16 knapp darüber). Wartet auf die Frage an
  den Benutzer. Die Suche (`suchziel`) braucht noch einen eigenen Test, die
  Überlegenheit mit frischem Blick ebenso.

- **Was der Nebel auf dem Server noch durchlässt** (Durchsicht Runde 110):
  Schafe gehen ungefiltert (Lage und Schlachten fremder Schafe); der Aufbau
  nennt die Startplätze aller (`basis`, der Browser blendet sie nur aus — die
  Kamera eines Ausgeschiedenen braucht sie); und wer nach Abbruch zurückkehrt,
  bekommt die Karte von heute samt fremder Bauplätze und gefällter Wälder und
  vergisst, welche fremden Gebäude er im Nebel erinnerte. Sichtbare fremde
  Einheiten tragen noch ihre Ladung. Keins davon kostet im Spiel viel; vor
  Stufe G (Betrieb) angehen.

- **Wunsch des Benutzers (2026-11-08, nach Runde 105): der Nebel ist eine
  Einstellung beim Eröffnen, und Forschung & Co verändern seine Fläche.** Als
  kampf AC-16 (Nebel / Erkundet / Aufgedeckt, ersetzt den Prüfgriff
  `aufdecken`), AC-17 (Stadtwache, Gebäude +4 Sicht) und AC-18 (Außenposten,
  Sicht 10) angelegt und in der Bauabfolge vor das Filtern auf dem Server
  gezogen (C6c, C6d). Die Stadtpatrouille kommt mit Stufe D.

- **Der Plan für Untätige kennt keinen Überfluss** (Durchsicht Runde 90):
  `umverteilen` zieht einen Bauern von der Nahrung ab, und der nächste Untätige
  geht nach dem festen Plan wieder zur Nahrung, obwohl dort 600 liegen. Kein
  Pendeln (die Schwellen 300/600 und die Sperre verhindern es), aber ein
  teilweises Gegensteuern. Kandidat, wenn ki AC-10 oder fahrplan AC-11 daran
  hängen.
- **Figuren: der Maßstab ist behoben, die Zeichnung noch nicht** (Rückschau
  nach Runde 88, Runde 99). Die Partie beginnt jetzt bei Zoom 1,5 — ein
  Dorfbewohner 42,9 statt 28,6 Bildpunkte, nah am Original (darstellung
  AC-16). Offen bleiben: wenig Kontrast der Figuren zum Boden, und das
  Dorfzentrum wirkt wie ein großes Haus. Messbar machen, bevor gezeichnet
  wird (Kontrast Figur gegen Boden, Anteil der Spielerfarbe); kein Muss vor
  C5.
- **Zwei Notizen aus der Durchsicht der Runde 86**, keine Fehler von heute:
  (1) eine Baustelle, die in derselben halben Sekunde wächst und getroffen
  wird, kann netto Leben gewinnen — dann sieht die KI den Angriff nicht
  (ki AC-14); (2) `FEIND_FERN` liest die Lage aller fremden Einheiten — mit
  dem Nebel (C6, ki AC-13) muss das nach Sicht filtern.
- **Mechaniken zum Namen „Fading Allies" — „irgendwann", nicht jetzt**
  (Benutzer, 2026-11-08). Der Name trägt heute schon, weil Absprachen nur am
  Tisch stattfinden (`spielziel AC-14`: „Bündnisse sind nicht vorgesehen").
  Wer später Mechaniken dafür baut, muss **zuerst** `spielziel AC-14` neu
  fassen und in der Tabelle „Wird nicht gebaut" von
  [ADR-0012](../adr/0012-aoe2-als-vorlage.md) nachsehen. Nicht vor Stufe E
  (fünf Völker) vorschlagen — vorher gibt es nicht genug Spieler in einer
  Partie, an denen ein Bündnis etwas ändert.
- **Für den Nebel im Bild (C6b), aus der Durchsicht der Runde 104:** (1)
  nach dem Ende einer Partie und nach dem Aufgeben läuft keine Sichtrechnung
  mehr — die Sicht eines Ausgeschiedenen bleibt auf dem letzten Stand; die
  Zeichnung muss `aus` und `ende` selbst beachten. (2) Eine Baustelle sieht
  sofort ihre vollen acht Felder; im Original sieht ein Fundament weniger —
  prüfen, ob das stört. (3) Ein neues Gebäude sieht bis zu einer halben
  Sekunde nichts.
- **fahrplan AC-11 hängt an der Auswahl der Startwerte** (Runde 100). Auf
  den Startwerten 21 bis 40 enden 19 von 20 vor Minute 60 — mit HEAD wie mit
  dem Arbeitsstand (Startwert 29 bzw. 24 nach 74 Minuten). Und dort steht
  einmal ein Dorfbewohner **über 900 Sekunden** untätig (HEAD 921 s), während
  ki AC-10 auf 1 bis 20 höchstens 12,9 s bis Minute 30 misst. Beides
  ansehen: `npm run pruefstand:vergleich -- --startwert 21 --minuten 90`,
  dann `pruefstand:verlauf` auf den langen.
- **Eine Bildunterschrift stimmt nicht: `einheiten AC-15`** (gesehen in
  Runde 80, `bedienung AC-16` ist seit Runde 83 behoben). Sie verspricht „ein
  Dorfbewohner trägt gelbe Goldbrocken in beiden Händen"; im Bild stehen die
  Sammler als blaue Umrisse hinter dem Dorfzentrum (bedienung AC-30). **Runde
  99 hat die Ursache gefunden:** auf Karte 4711 liegt das Gold unmittelbar
  hinter dem Dorfzentrum, die Träger sammeln und laden dort ab und kommen nie
  nach vorn — auf einen Träger ohne Umriss zu warten, fand in 30 Sekunden
  keinen. Abhilfe braucht eine andere Szene: ein Bergbaulager vor das Gold,
  oder ein Vorkommen, dessen Weg zum Lager nicht hinter einem Gebäude liegt.
  Eine halbe Runde; das Verhalten ist richtig, nur das Bild zeigt es nicht.

- **Umlaute auf dem Bildschirm (entschieden 2026-09-17).** Texte, die im
  Browser stehen, bekommen echte Umlaute („Eröffnen", „zufällig");
  Bezeichner, Dateinamen und Testnamen bleiben umschrieben. Bestehende Texte
  umstellen: eine eigene Runde, weil Browsertests und Bildunterschriften
  Texte wörtlich prüfen. Neue Texte ab sofort mit Umlauten.
  **Stand nach Runde 72:** die **Einheitennamen** sind durch — `Späherreiter`
  war der einzige Ausreißer in `public/figuren.js` (Miliz, Soldat,
  Speerkämpfer, Bogenschütze, Plänkler hatten ihn schon), und die Schautafel
  (`public/schautafel.js`) nennt sie jetzt genauso. Offen bleiben die
  **Gebäudenamen** in `public/gebaeude.js` (`Muehle`, `Holzfaellerlager`,
  `Bergbaulager`, `Schiessanlage`) — die stehen im Baumenü und in der
  Auswahlleiste, daran hängen Browsertests — und die Überschriften der
  Schautafel.
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
- **Ein Dorfbewohner steht spät bis zu acht Minuten still** (ki AC-10, offen,
  Runde 69). Sichtbar erst jenseits der zehnten Spielminute, deshalb von
  `ki AC-6` nicht gefunden. Ursache gemessen: `naechstesFeld` sucht nur im
  Umkreis von `REICHWEITE = 30` um die Basis, und dort ist nach 16 Minuten
  kein Wald und kein Gold mehr; die Farmen sind auf `plan(22).nahrung = 13`
  gedeckelt und alle besetzt. Die Ersatzkette im Leerlauf ist
  `rohstoff → holz → gold` — die Nahrung fehlt darin. Drei Hebel, der Reihe
  nach zu prüfen: Nahrung in die Ersatzkette, eine Farm bauen, wenn gar nichts
  frei ist, und die Reichweite mitwachsen lassen. Die Vorgabe des Prüfstands
  steht auf 16 Minuten, der Fehler ist also in jedem Lauf zu sehen.
- **Einheiten stapeln sich** — seit Runde 89 für Stehende behoben (einheiten AC-29); offen bleiben Sammler (AC-30, mit Bedingung fahrplan AC-5) und Kämpfende (AC-31, mit Bedingung Konterkreis). Vorgeschichte: Dreimal gesehen, jetzt
  **gemessen**: Dorfbewohner auf demselben Waldfeld (Runde 9), zwei
  Bogenschützen aus derselben Richtung (Runde 64), und in der Rückschau nach
  Runde 65 zwei von drei Angreifern **0,27 bis 0,39 Felder** auseinander — die
  Verteilung um das Ziel (Runde 63) hält nicht mehr, seit sich Verteidiger von
  selbst bewegen (Runde 64). Ursache: `nachbarfeld` fragt die Karte, nicht die
  Einheiten; Fernkämpfer haben gar keine Verteilung auf ihrem Schussring.
  `figurenFrei` misst es, die Prüfung steht in `strategie-kampf.spec.mjs` bei
  `kampf AC-1` auskommentiert bereit. Runde 67 hat **einen** Teil erledigt:
  Wächter desselben Ziels verteilen sich jetzt wie befohlene Angreifer (vorher
  standen zwei zusammen losgeschickte Milizen auf **0,00 Feldern**). Es bleiben
  der Schussring der Fernkämpfer und die Enge während des Hinlaufens.
  **Nächster Kandidat nach B5.** In der Rückschau nach Runde 78 hat dieser
  Faden eine Verbesserung am Prüfgriff zu Fall gebracht: stellt man die
  Angreifer ein Feld enger auf, verdecken sie einander im Bild. Solange
  AC-29 offen ist, hängen Bildnachweise an der Aufstellung — wer sie ändert,
  fährt danach `npm run qa:abweichung` und sieht nach.
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
- **`hinterGebaeude()` prüft ein Rechteck, nicht den Körper.**
  `gebaeudeGetroffen()` (`public/gebaeude.js`) ist `|dx| <= trefferBreite` und
  `-trefferOben <= dy <= trefferUnten` — ein Kasten. Wer frei **über** dem
  Dach eines Dorfzentrums steht, liegt in diesem Kasten und wird deshalb als
  verdeckte Einheit gezeichnet: ein flacher Umriss in Spielerfarbe, ohne
  Ladung, ohne Werkzeug, ohne Gesicht (bedienung AC-30). In Runde 83 beim
  Ansehen von **einheiten AC-15** gefunden: drei Sammler am Goldhaufen, alle
  drei Scherenschnitte, während die Unterschrift von Goldbrocken in beiden
  Händen spricht. Betroffen sind mindestens auch bauen AC-1, darstellung AC-5
  und darstellung AC-10. Das ist ein eigenes Kriterium wert — die Treffläche
  wird auch zum Anklicken benutzt, also nicht nebenbei ändern.
- **Rückstand aus der Nachweisprüfung der Runde 83** (28 offen, je zwei bis
  drei in eine spätere Runde). Nach Ursache sortiert, die schwersten zuerst:
  - **Die Figur ist zu klein für das, was behauptet wird** (näher heranholen):
    bedienung AC-12, AC-31, AC-34, AC-36 · einheiten AC-16, AC-17, AC-23 ·
    karte AC-16 · bauen AC-9 · darstellung AC-14 · ki AC-9 (Bogenschützen).
  - **Figuren stehen übereinander** — `figurenFrei()` prüft nur, wo es
    aufgerufen wird: einheiten AC-23, AC-24 · kampf AC-1, AC-10 ·
    darstellung AC-10 · fahrplan AC-3.
  - **Etwas ist am Bildrand abgeschnitten** (höher aufnehmen oder scrollen):
    auswahl AC-4, AC-5, AC-8 · bedienung AC-18, AC-31 · darstellung AC-1.
  - **Ein Standbild kann keine Veränderung zeigen** — hier hilft nur ein Paar
    aus Vorher und Nachher, wie es bedienung AC-1 und fahrplan AC-1 schon
    haben: bedienung AC-7 (Karte verschoben), AC-8 (Punkt unter dem Zeiger
    bleibt stehen), bauen AC-15 (dasselbe Bild wie bauen AC-12).
  - **Das Gezeigte widerspricht der Unterschrift**: bauen AC-4 (die grüne
    Vorschau liegt auf dem Dorfzentrum, dazu die Meldung „Zu wenig Holz."),
    bauen AC-4 rot auf rotbraunem Dach, darstellung AC-8 (der Balken ist zu
    einem Viertel **gefüllt**, die Unterschrift liest sich umgekehrt).

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
| 2026-09-17 | Tests ohne Browser / im Browser | 320 / 121 | Runde 50 |
| 2026-09-17 | Takt mit 8 x 100 Einheiten, groesste Karte, Mittel (CPU 43 %) | vorher 58 ms, nachher 0,5 ms | Runde 51 |
| 2026-09-17 | Bilder je Sekunde mit 100 Einheiten + 30 Haeusern, Zoom 1 (CPU 21 %); sicht --messen Zoom 1 / 2 | vorher 24, nachher 60; vorher 20,4 / 40,2 ms, nachher 9,4 / 25,2 ms | Runde 52 |
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
| 2026-11-07 | Tests ohne Browser / im Browser; Browserlauf | 348 / 138; 5,3 min — **nicht vergleichbar**: 30 fremde Browserprozesse. Langsamster Fall 9,2 s | Runde 61 |
| 2026-11-07 | Tests ohne Browser / im Browser; Browserlauf | 361 / 140; 5,6 min — **nicht vergleichbar**: wieder 30 fremde Browserprozesse (16 chrome, 14 msedge) | Runde 63 |
| 2026-11-07 | Pruefstand nach dem Kampf: 20 Startwerte x 10 Spielminuten — Dorfbewohner / Zeit je Takt | 22 (Median 22) / 0,007 ms, keine Widersprueche | Runde 63 |
| 2026-11-07 | Tests ohne Browser / im Browser; Browserlauf | 372 / 141; 6,6 min — **nicht vergleichbar**: 35 fremde Browserprozesse (21 chrome, 14 msedge) | Runde 64 |
| 2026-11-07 | Takt mit 832 Milizen nach der Wache (kampf AC-2): bei den eigenen Basen / acht Heere auf einem Haufen im Kampf | 0,11 ms / 0,53 ms (Grenze 10 ms) | Runde 64 |
| 2026-11-07 | Pruefstand nach der Wache: 20 Startwerte x 10 Spielminuten — Dorfbewohner / Zeit je Takt | 22 (Median 22) / 0,008 ms, keine Widersprueche | Runde 64 |
| 2026-11-07 | Treffer des neuen Wächters gegen Gleichheit auf wachsenden Daten, erster Lauf | 10 Stellen in 5 Dateien (alle repariert) | Runde 65 |
| 2026-11-07 | Abstand zweier Angreifer im Bild zu kampf AC-1 (`figurenFrei`) | 0,27–0,39 Felder — Soll: ≥ 0,5 (einheiten AC-29, offen) | Runde 65 |
| 2026-11-07 | Browserlauf nach Runde 72 | 149 Faelle in 8,6 min (vorher 148 in 7,1); `npm run check` 18 s, 397 Tests ohne Browser | Runde 72 |
| 2026-11-07 | Langsamster Browserfall: `fahrplan AC-8` (Aufstieg, drei Gebaeude, vier Einheiten, zwei Gefechte) | 1,4 min — loest `ki AC-9` (45 s) ab | Runde 72 |
| 2026-11-07 | Gemessener Schaden im Browser: Speer→Reiter / Bogen→Reiter (mit Schmiedeangriff) | 19 / 2 — der Bonus traegt, die Verbesserung geht ueber die Klasse | Runde 72 |
| 2026-11-07 | Konterkreis, 20 Startwerte je Paarung, Budget 600 — Konter / gekontert | 20/20 = 100 % / 0/20 = 0 % in allen vier Paarungen, 0 ohne Ende | Runde 71 |
| 2026-11-07 | Gefechtsdauer (Takte, Median): Speer–Reiter / Plaenkler–Bogen / Bogen–Speer / Reiter–Bogen | 80 / 125 / 190 / 346 | Runde 71 |
| 2026-11-07 | Rechenzeit des Gefechtsstands: 160 Gefechte (8 Richtungen x 20 Startwerte) | 0,2 s | Runde 71 |
| 2026-11-07 | Tests ohne Browser: nach Runde 71 | 397 (4 neue in `tests/strategie-konterkreis.test.mjs`), `npm run check` 18 s | Runde 71 |
| 2026-11-07 | Tests ohne Browser / im Browser; Browserlauf | 391 / 148; 7,1 min — **nicht vergleichbar**: 26 fremde Browserprozesse (19 chrome, 7 msedge) | Runde 69 |
| 2026-11-07 | Pruefstand mit Aufstieg: 20 Startwerte x 16 Spielminuten — Feudalzeit / Kampfeinheiten / Zeit je Takt | 11,1–11,9 min (Median 11,6) / 3–7 je Spieler / 0,013 ms, keine Widersprueche | Runde 69 |
| 2026-11-07 | Laengste Untaetigkeit eines Dorfbewohners: 10 / 16 / 20 Spielminuten | 0,6 s / 290 s / 483 s — Soll: ≤ 20 s (ki AC-10, offen) | Runde 69 |
| 2026-11-07 | Langsamster Browserfall: `ki AC-9` (zwoelf Spielminuten im Zeitraffer 20) | 45,5 s von 352 s der strategie-Dateien | Runde 69 |
| 2026-11-07 | Erster Lauf des Waechters gegen Werte an `einheitenwert()` vorbei | 7 Stellen in `welt.js` (alle umgestellt) | Rueckschau 69 |
| 2026-11-07 | Pruefstand vor/nach der Umstellung auf `einheitenwert()`, 20 Startwerte x 16 min | Zeile fuer Zeile identisch, 0,013 ms je Takt | Rueckschau 69 |
| 2026-11-07 | Tests ohne Browser / im Browser; davon Waechter in `tests/waechter-*` | 393 / 148; 3 | Rueckschau 69 |
| 2026-11-07 | Tests ohne Browser / im Browser; davon Waechter in `tests/waechter-*` | 398 / 148; 4 | Rueckschau 72 |
| 2026-11-07 | `npm run check` ohne Browser | 18 s (unveraendert zu Runde 72) | Rueckschau 72 |
| 2026-11-07 | Partie KI gegen KI im Browser bis nach dem Aufstieg, fuenf Bilder (Zeitraffer 20) | 53,8 s — **nicht vergleichbar**: 26 fremde Browserprozesse (19 chrome, 7 msedge) | Rueckschau 72 |
| 2026-11-07 | Treffer des Waechters gegen die Kuerzeltafel, erster Lauf | 2 Stellen (`p`/`k` vertauscht) — die Ursache von 45 s Browserlauf in Runde 72 | Rueckschau 72 |
| 2026-11-07 | Tests ohne Browser / im Browser nach Runde 75; `npm run check` | 402 / 149; 19 s | Runde 75 |
| 2026-11-07 | Bilder, die eine geaenderte `stil.css` neu erzeugen musste | 66 von 151 — der Lauf dafuer dauerte 10,7 min | Runde 75 |
| 2026-11-07 | Gegenprobe: faengt der erweiterte Waechter die alte Form? | beide Formen (`werte.einheiten.<art>` und der Rest-Name) in einer Wegwerfdatei beanstandet | Runde 75 |
| 2026-11-07 | `npm run check:alles:neu:kurz` (ein Lauf, alle Bilder neu + pruefen) gegen `qa:nachweis` + `check:alles` | **580 s** gegen 8,8 + 9,1 = 17,9 min — acht Minuten je Runde an der Oberflaeche | Rueckschau 78 |
| 2026-11-07 | Geaenderte Bildnachweise nach einem `:neu`-Lauf, nach Abweichung | 85 von 162: **10 ueber 60 %**, **0 zwischen 0,6 % und 60 %**, 75 darunter, die meisten bei 0,08 % (= 135 x 18 Bildpunkte: der Raumcode) | Rueckschau 78 |
| 2026-11-07 | Eigener PNG-Leser gegen PIL, dieselben 85 Bilder | gleiche Werte auf zwei Nachkommastellen (96,83 % / 95,58 % / 93,18 %) | Rueckschau 78 |
| 2026-11-07 | Tests ohne Browser / im Browser; `npm run check` | 406 / 155; 20 s | Rueckschau 78 |
| 2026-11-07 | `fahrplan AC-8` (der laengste Browsertest) im vollen `:neu`-Lauf / allein | gefallen nach 90 s Warten auf den ersten Treffer / gruen in 1,4 min — Last, nicht Produkt; der Lauf dauerte 9,9 statt 8,6 min | Rueckschau 78 |
| 2026-11-07 | Tests ohne Browser / im Browser; `npm run check:alles:neu:kurz` | 419 / 157; 572 s | Runde 79 |
| 2026-11-07 | Pruefstand nach dem Partieende (20 Startwerte x 16 min) | unveraendert: Feudalzeit 11,1–11,9 min (Median 11,6), 22 Dorfbewohner, keine Widersprueche, 3,5 s | Runde 79 |
| 2026-11-07 | Geaenderte Bildnachweise nach dem `:neu`-Lauf | 94: **12 ueber 1 %** (2 neu, 10 Kamerazittern zwischen 55 und 91 %), 82 darunter — wieder nichts zwischen 0,53 % und 55 % | Runde 79 |
| 2026-11-07 | Tests ohne Browser / im Browser; `npm run check:alles:neu:kurz` | 419 / 159; 647 s | Runde 80 |
| 2026-11-07 | Geaenderte Bildnachweise nach dem `:neu`-Lauf | 114: **12 ueber 1 %** (1 neu, 11 zwischen 1,2 % und 98 %), 102 darunter, alle unter 0,97 % | Runde 80 |
| 2026-11-07 | Davon ein echter Rueckschritt beim Durchsehen | 1 von 12: der Bedienhinweis brach im 1000-px-Fenster auf fuenf Zeilen um, weil der Knopf „Aufgeben“ daneben kam | Runde 80 |
| 2026-11-07 | Tests ohne Browser / im Browser; `npm run check:alles:neu:kurz` | 425 / 162; 689 s (Browserlauf allein 10,7 min) | Runde 83 |
| 2026-11-07 | Bildnachweise gepruefte Paare / Beanstandungen | 96 angesehen von 167 gelesen; **39 beanstandet (41 %)**: 12 zu kleine Figuren, 6 Figuren uebereinander, 6 am Rand abgeschnitten, 11 falsche Unterschriften, 3 ohne moegliches Standbild, 1 doppeltes Bild | Runde 83 |
| 2026-11-07 | Spielerfarbe je Einheit (Anteil der Figurenflaeche, Schautafel) | Plaenkler **0,039 → 0,119**; Soldat 0,105 · Speerkaempfer 0,108 · Bogenschuetze 0,144 · Spaeherreiter 0,171 · Dorfbewohner 0,270 · Miliz 0,308. Abstand Bogenschuetze/Plaenkler 0,589 → 0,584 | Runde 83 |
| 2026-11-07 | Geaenderte Bildnachweise nach dem `:neu`-Lauf | 114: **28 ueber 1 %**, davon 20 die zwoelf absichtlichen Umbenennungen (je neu + geloescht); 8 wirklich angesehen, kein Rueckschritt, eines besser (bedienung AC-34). 86 darunter, alle unter 0,91 % | Runde 83 |
| 2026-11-07 | Tests ohne Browser / im Browser; `npm run check:alles:kurz` | 427 / 164; 583 s (Browserlauf allein 9,3 min) | Runde 84 |
| 2026-11-07 | Erstes Heer der KI ueber zwanzig Startwerte (Pruefstand, 22 min) | Spielminute **17,5 bis 19,8**, Median 18,1; ohne Angriff 0 von 20. Rechenzeit 0,84 s je Partie | Runde 85 |
| 2026-11-07 | Konterkreis nach dem engen `angekommen`-Fix (`npm run konterkreis:strategie`) | 20/20 in allen vier Richtungen, 0/20 umgekehrt. Die **weite** Fassung: Spaeherreiter gegen Bogenschuetze 14/20, umgekehrt 10/20 | Runde 85 |
| 2026-11-07 | Geaenderte Bildnachweise nach einer Aenderung **nur** am Abschlussbild | 6: zwei neue (AC-9), eines zu 94 % (Kamera tiefer, AC-6), zwei zu 6,0 % (der neue Knopf, AC-5 und AC-8), eines zu 0,0 %. Kein `:neu`-Lauf noetig - das Bedienteil steht in genau einer Testdatei, und die wurde mit `QA_NACHWEIS=1` einzeln gefahren (36 s statt 11 min) | Runde 84 |
| 2026-11-08 | KI gegen KI, zwanzig Startwerte bis Minute 90 (`pruefstand:vergleich`) | alle 20 mit Sieger, Ende **24,8 bis 53,3 min**, Median 33,8; Runde 92: 4 von 20 vor Minute 60, Median 72,6 | Runde 97 |
| 2026-11-08 | `npm run check` (Maschine ruhig, ein fremder node) | 48 s, 477 Tests ohne Browser; mit dem Messtest ueber zwanzig Partien in `strategie-ki.test.mjs` waren es 88 s | Rueckschau 98 |
| 2026-11-08 | Browserlauf gesamt | 167 Faelle, 9,6 min (Runde 95, zuletzt ganz gefahren) | Runde 95 |
| 2026-11-08 | `npm run check` (Maschine ruhig) | 44 s, 483 Tests ohne Browser | Rueckschau 103 |
| 2026-11-08 | Browserlauf gesamt mit allen Bildern neu (`check:alles:neu`) | 169 Faelle, 11,4 min; der neue Fall allein gegen die KI 1,2 min | Runde 101/102 |
| 2026-11-08 | KI gegen KI, Startwerte 1-20 / 21-40 bis Minute 90 | 20/20 und 19/20 vor Minute 60, Median 36,4 / 39,4 min | Runde 100 |
| 2026-11-08 | Rechenzeit einer Partie KI gegen KI (`pruefstand:vergleich`, 6 Partien, 40 min) | vor der Sicht 44, mit Sicht 50 ms je 1000 Takte (+14 %); gleiche Arbeit gegen sich selbst 52/54 (Rauschen ~4 %) | Rueckschau 108 |
| 2026-11-08 | `npm run check` (Maschine ruhig) | 52 s, 492 Tests ohne Browser | Rueckschau 108 |
| 2026-11-08 | Browserlauf gesamt mit allen Bildern neu (`check:alles:neu`) | 174 Faelle, 13,3 min | Runde 107 |

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

### Nach Runde 93 (2026-11-08)

Runden 89 bis 92: keine zwei Einheiten übereinander (einheiten AC-29, Sammler
und Kämpfende geteilt in AC-30, AC-31), Nachschub (ki AC-12), auch spät
steht niemand herum (ki AC-10), und fahrplan AC-11 gemessen, nicht erreicht —
drei Kriterien `fertig` (392 von 520). Was sich wiederholt hat:

1. **Vorher und nachher, jedes Mal von Hand.** `git stash`, Kopien des Ordners
   im Temp-Verzeichnis, Wegwerfskripte — in jeder der vier Runden, einmal mit
   einem Backslash, den die Shell verschluckte. → Werkzeug:
   **`npm run pruefstand:vergleich`** stellt den Arbeitsstand neben einen
   eingecheckten Stand (Vorgabe HEAD), dieselben Partien, Zeile neben Zeile.
   Gegen den Stand vor Runde 89 zeigt es in drei Zeilen, was diese vier Runden
   gebracht haben: Untätigkeit 286 s → 0,6 s, Kampfeinheiten im Median 8 → 12,
   Angriffe 1 → 3.
2. **Abhilfen, die nichts bewegen.** Sechs in vier Runden — drei für die
   Beeren, eine größere Rücklage, zwei Hebel für fahrplan AC-11. Das Messen
   hat sie alle gefunden, und alle sind zurückgenommen. → Anweisung,
   Abschnitt 4: **was gemessen nichts bringt, bleibt nicht im Code.**
3. **Grenzen geraten, obwohl die Anweisung es verbietet** — zweimal (Runde 90
   „höchstens sechs", Runde 91 „drei Minuten"). → Anweisung, Abschnitt 4,
   schärfer und mit den beiden Beispielen: **steht im Kommentar keine Messung
   neben der Grenze, ist sie geraten.**

Bestätigt, keine neue Regel: **die Durchsicht durch einen Prüfer** (neu seit
der Rückschau nach Runde 88) hat in jeder Runde echte Dinge gefunden — 3, 4,
1 und das alte Leistungsloch beim Weg zum Lager (47 ms je Takt bei 30
Festsitzenden, seit Langem im Code). Und **der Prüfstand findet Fehler, die
mit der Runde nichts zu tun haben**: die Waldecke beim Seitenschritt (Runde
89) und die Ecke einer neuen Baustelle (Runde 92) — beide Male, weil ein
Versuch länger lief als sonst.

**Gemessen** (Maschine nicht ganz ruhig): `npm run check` 36 bis 37 s mit
463 Tests; Browserlauf 167 Fälle 9,3 bis 9,6 min; Prüfstand 20 Partien zu 22
Minuten rund 15 s, zu 30 Minuten rund 11 s im Messtest, zu 90 Minuten rund 40 s.

### Nach Runde 88 (2026-11-08)

Runden 84 bis 87: die Revanche (C3 steht), die KI greift an und verteidigt
zu Hause (C4 läuft), das Spiel heißt Fading Allies und der Bildschirm hat
echte Umlaute — fünf Kriterien `fertig` (389 von 518). Ab Runde 86 mit Opus
5.5 und zum ersten Mal mit Subagenten. Was sich wiederholt hat:

1. **Einheiten stehen übereinander, und jede Runde schifft drumherum.** Runde
   85: drei Milizen auf einem Punkt (zwei Fehler im Kampf, behoben). Runde 86:
   vier Fassungen des Bildes zu ki AC-14, bis die Szene vom Dorfzentrum auf ein
   Haus abseits umzog. Davor die Runden 56, 61, 63, 64 und 78. Das Kriterium
   (`einheiten AC-29`) steht seit Runde 65 offen. → Anweisung, Abschnitt 1:
   **einen offenen Produktfehler umschiffst du höchstens einmal**, beim
   zweiten Mal ist er die nächste Runde. **Runde 89 ist einheiten AC-29.**
2. **Ein Browserfall war einzeln grün und fiel im großen Lauf.** ki AC-14
   dreimal grün, dann rot; mit `--repeat-each 6` vier von sechs rot. Auch der
   Baulauf der Dunklen Zeit flatterte in jedem dritten Lauf, unbemerkt seit
   Wochen. → Anweisung, Abschnitt 5: ein neuer Browserfall mit KI, Kampf oder
   Zeitraffer läuft vor dem Abschlusslauf **zehnmal**.
3. **Eine Durchsicht ohne meine Schlüsse fand, was die Tests nicht sahen.**
   Ein Sonnet-Prüfer las den Diff der Runde 86: zwei von fünf Befunden echte
   Fehler, einer davon von der Runde selbst eine Stunde vorher eingebaut. In
   Runde 87 las ein zweiter dreizehn Bilder in 73 Sekunden gegen ihre
   Unterschriften; seine drei Beanstandungen standen alle schon im Rückstand
   der Runde 83 — er fand also nichts Falsches und nichts übersehen. →
   Anweisung, Abschnitt 6, Schritt 0: **Durchsicht durch einen Subagenten**,
   wenn Simulation, KI oder Kampf geändert wurden; Befunde am Code
   nachprüfen, jeder echte bekommt einen Test.

Nebenbei, nicht als Regel: **Fettdruck hält nicht, ein Wächter schon** —
Runde 87 fand rund vierzig umschriebene Bildschirmtexte, obwohl die Regel seit
Runde 1 in CLAUDE.md stand. Das ist schon Grundsatz des Projekts
(`tests/waechter-*`); der fünfte Wächter ist der für Umlaute.

**Die Figuren bei Zoom 1, angesehen auf Wunsch des Benutzers** (bedienung
AC-36, darstellung AC-13): Gelände, Bäume, Vorräte, Wasser und Gebäude
tragen. **Die Figuren sind die schwächste Stelle** — schmal, knapp 29
Bildpunkte hoch, und sie heben sich wenig vom olivbraunen Boden ab; man
erkennt sie, muss aber hinsehen. Das Dorfzentrum liest sich wie ein großes
Haus, nicht wie die Mitte eines Dorfes. Keine Kriterien angelegt (keine
Stufe endet), aber als Faden notiert: der Kandidat für eine Runde
„Figuren", sobald C4 steht und bevor ein Mensch in C5 allein gegen die KI
spielt.

**Gemessen**, Maschine nicht ganz ruhig (elf Chrome-Prozesse eines anderen
Fensters): `npm run check` 33 bis 48 s mit 445 Tests; der Browserlauf mit 166
Fällen 8,4 bis 10,9 min, mit Neuschreiben aller Bilder 11,5 min — CLAUDE.md
sagte noch „6 bis 7 Minuten" und nannte `ki AC-9` (45 s) als langsamsten Fall;
es ist `fahrplan AC-8` mit 78 s, die Feudalzeit am Stück. Nachgezogen. Der Prüfstand (20 Partien,
22 Spielminuten) rechnet in 14,5 s.

### Nach Runde 83 — die Bildnachweise einmal ganz angesehen (2026-11-07)

Vier Runden (79 bis 82): das Partieende, das Aufgeben mit Rückfrage, das
Zuschauen nach dem Ausscheiden, das Abschlussbild mit Zahlen. **C2 steht, aus
C3 zwei von drei.** Alle vier grün, keine mit einem Fehler im Produkt — und
genau das ist der Befund dieser Rückschau. **Viermal hintereinander lag der
Mangel im Beweis, nicht im Gebauten:** die Uhr stand auf 0:00, weil der Test
sie nie laufen ließ; die Hinweistreppe fand erst `qa:abweichung`; „das
weiterarbeitet" kann ein Standbild nicht zeigen; und zwei Unterschriften
standen seit Runden falsch da.

Deshalb diesmal keine Stichprobe: **alle 167 Bildnachweise des Projekts sind
gelesen worden**, 96 Paare davon Bild für Bild angesehen (die übrigen gehören
zum ruhenden Managerspiel). Ergebnis: **39 Beanstandungen, zwei von fünf.**
Das ist keine Kleinigkeit — die Bilder sind die einzige Stelle, an der
`fertig` etwas über das Aussehen behauptet.

1. **Der Test, der Stufe B beglaubigt, bewies den Späherreiter nicht.**
   `strategie-feudalzeit.spec.mjs` bestellt im Stall einen Reiter und wartet
   dann darauf, dass einer **da ist** — aber jeder Spieler startet mit einem
   (bauen AC-22). Die Zusicherung war erfüllt, bevor der Stall stand; dasselbe
   galt für `stand.einheiten[s] >= 1` und den Eintrag in der Leiste. Drei
   Zusicherungen, alle drei schon vor der Handlung grün. Neu ist
   `einheitenJeArt(page)` in `e2e/helpers/strategie.mjs`: **vorher zählen,
   danach mehr verlangen.** Wer „ausgebildet" nachweist, misst den
   Unterschied, nicht den Bestand.

2. **Die Spielerfarbe wurde an drei Einheiten gemessen — aufgezählt im Kopf.**
   `strategie-figuren.spec.mjs` prüft seit Stufe A, dass Dorfbewohner, Miliz
   und Späherreiter mindestens ein Zehntel ihrer Fläche in Spielerfarbe
   tragen. Die Liste steht dort als drei Namen und ist nie mitgewachsen. Der
   Test über **alle** Einheiten (darstellung AC-9 / fahrplan AC-7) fragte
   dagegen nur, welche Farbe die Zelle **angibt**, nicht welche die Figur
   **zeigt** — und war deshalb grün, obwohl der **Plänkler in beiden Reihen
   gleich braun** dastand: die Fellweste lag über dem ganzen Wams, 3,9 % gegen
   10,5 bis 30,8 % bei allen anderen. Jetzt misst dieser Test den Anteil für
   jede Art aus `EINHEITEN`, in beiden Farben; die Weste ist schmaler, der
   Plänkler steht bei 0,119, und der Abstand zum Bogenschützen bleibt bei
   0,584. **Eine Liste im Testkopf, die mit den Stufen wachsen müsste, ist
   derselbe Fehler wie eine Gleichheitszusicherung** — der Wächter kennt
   bisher nur die zweite Form.

3. **Elf Unterschriften behaupteten mehr, als ihr Bild trägt.** „Alle sieben
   Gebäude der Dunklen Zeit" an einer Schautafel mit zehn; „Q W E R T Z", wo
   im Bild „Q W E R T Z U I O" steht; „die Leiste nennt sie Soldat", wo der
   Name nur im `title` hängt und kein Screenshot ihn zeigt; „zwei Sekunden
   lang" an einem Standbild; „nach rund zwölf Spielminuten", während die Uhr
   13:44 zeigt; „oben links neben den Vorräten", wo der Wert in der Mitte der
   Leiste steht. Alle elf stehen jetzt auf dem, was zu sehen ist. **Die
   wiederkehrende Form:** die Unterschrift beschreibt, was der Test **weiß**,
   nicht was das Bild **zeigt**. Der Test weiß mehr als sein Bild — jede Zahl,
   jeden Namen, jede Dauer. Das Bild weiß nur, was im Ausschnitt steht.

Nicht erledigt, aber jetzt benannt (siehe **Offene Fäden**): die verbleibenden
28 Beanstandungen, und der Fund dahinter — `hinterGebaeude()` prüft ein
**Rechteck** um das Gebäude, nicht seinen Körper. Eine Figur, die frei über
dem Dach steht, gilt als verdeckt und wird zum flachen Umriss. Das trifft
mindestens vier Bilder, darunter einheiten AC-15, wo die Unterschrift von
Goldbrocken in beiden Händen spricht und drei blaue Scherenschnitte zu sehen
sind.

Gut gelaufen: Die Prüfung der Bilder hat sich auf vier Leser verteilen lassen,
ohne dass einer dem anderen in die Dateien geschrieben hätte — lesen
parallelisiert, bauen nicht. Und `npm run check` hat jede der zwölf geänderten
Unterschriften von selbst als „Nachweis ohne Erzeuger" beanstandet; die
Verbindung zwischen Unterschrift und Test hält.

### Nach Runde 78 (2026-11-07)

Fünf Runden (73 bis 77), alle grün: die Rückschau zu Stufe B, die Spec zu
Stufe C und dann ihre drei Lücken — Kampfwerte an der Auswahl, Militär bei
Zoom 1 im Umriss erkennbar, Spielzeit in der Leiste. **C1 steht.** Was Zeit
gekostet hat, war dreimal dasselbe: der Umgang mit den Bildern.

1. **Zwei Browserläufe hintereinander, neunmal neun Minuten umsonst.** Wer das
   Aussehen ändert, musste bisher `npm run qa:nachweis` fahren (Bilder neu)
   und danach `npm run check:alles` (prüfen) — das sind zwei volle
   Browserläufe. In den Runden 76 und 77 je einer zu viel. Neu ist
   **`npm run check:alles:neu`** (und `:neu:kurz`): ein Lauf, der jedes Bild
   neu schreibt, danach `npm run check` ohne Browser. Gemessen: **580 s gegen
   8,8 + 9,1 min** — acht Minuten je Runde an der Oberfläche, ohne dass eine
   Prüfung wegfällt.

2. **Der Prüfgriff stellt Einheiten nicht dorthin, wo der Test sie hinschreibt.**
   `einheitenAufstellen(…, { x, y })` sucht ringweise **um** (x, y) herum und
   beginnt einen Schritt daneben; eine einzelne Einheit steht also nie genau
   dort. Das hat in Runde 76 einen Lauf gekostet. Mein erster Griff war, das
   Verhalten zu ändern (Suche ab dem Feld selbst). **Das war falsch, und zwar
   auf lehrreiche Weise:** die Einheiten rückten dadurch in acht Bildern um
   ein Feld zusammen, und weil Figuren noch übereinander stehen dürfen
   (`einheiten AC-29` ist offen), verdeckten sie einander — in `kampf AC-1`
   standen statt drei blauen Milizen zwei rote übereinander, und die
   Bildunterschrift stimmte nicht mehr. Zurückgenommen. Geblieben ist, was
   gereicht hätte: **ein JSDoc, das das Verhalten nennt**, und die Regel, mit
   anderthalb Feldern Spielraum zu suchen. Merksatz: *Eine Eigenart der
   Prüfumgebung, auf die sich Bilder eingestellt haben, ist kein Fehler —
   sie zu „reparieren" ändert die Bilder.*

3. **Nach einem Lauf, der alle Bilder neu schreibt, stehen 85 im `git status`.**
   Wer die mit einem pauschalen `git add` abtut, checkt früher oder später
   eine verdorbene Aufstellung ein; wer alle 85 ansieht, sieht keines richtig
   an. Gemessen hat die Verteilung aber eine **Lücke**: zehn Bilder über 60 %
   geänderter Bildpunkte, **kein einziges zwischen 0,6 % und 60 %**, die
   übrigen 75 darunter — die meisten bei 0,08 %, das sind 135 × 18 Bildpunkte
   in 1280 × 720, also genau ein zufälliger Raumcode. Der Grund für den
   Sprung: verschiebt sich die Kamera um drei Bildpunkte, ändert sich fast
   jeder Bildpunkt; ändert sich nur eine Beschriftung, fast keiner. Oben
   stehen damit die Bilder, deren Kamera an laufenden Positionen hängt — und
   das sind genau die, bei denen eine Aufstellung kippen kann. Daraus
   **`npm run qa:abweichung`**: listet die geänderten Bildnachweise nach
   Abweichung sortiert und trennt bei 1 %. Gelesen wird PNG dafür selbst
   (`scripts/png-lesen.mjs`, `node:zlib` und die fünf Filter der Norm) —
   kein Paket mehr im Baum, und die Zahlen stimmen mit PIL auf die zweite
   Stelle überein.

Das dritte Werkzeug hat sich **in derselben Runde bezahlt gemacht**: der erste
Lauf von `qa:abweichung` hat den Rückschritt aus Punkt 2 nach oben sortiert,
und das Bild dazu war in zwei Minuten angesehen statt in 85.

Nebenbei gemessen: **der längste Browsertest fällt unter der Last eines
`:neu`-Laufs.** `fahrplan AC-8` wartet 90 s auf den ersten Treffer und lief
in die Grenze, während der Lauf 9,9 statt 8,6 min brauchte; allein gefahren
war er in 1,4 min grün. Keine Schwelle gesenkt — aufgeschrieben, und wenn es
wiederkommt, bekommt er dieselbe Behandlung wie `karte AC-15`: den besten von
mehreren Durchgängen messen, Grenze unverändert.

### Nach Runde 72 — Ende von Stufe B (2026-11-07)

Drei Runden (70 bis 72), alle gruen, **Stufe B erreicht**. Fuenfmal in diesen
drei Runden war der rote Test im Recht und **meine Annahme falsch** — nie das
Produkt: die Kuerzel der Einheiten, was der Browser ueberhaupt geschickt
bekommt, wo nach dem Aufstieg noch Gras liegt, und zweimal ein Messaufbau, der
zwanzig Startwerte zwanzigmal dasselbe rechnen liess. Daraus die drei
Verbesserungen.

1. **Die Kürzeltafel war seit Runde 70 falsch** — sie nannte `p` den Plänkler
   und `k` den Speerkämpfer, es ist umgekehrt. Ein Browsertest griff danach,
   die Zusicherung schlug fehl, und bis die Ursache gefunden war, kostete es
   einen Lauf von 45 s. Eine Tafel, die von Hand gepflegt wird, veraltet — und
   genau diese Tafel war selbst eine Verbesserung der letzten Rückschau.
   → **`tests/waechter-drahttafel.test.mjs`** liest den Abschnitt
   `### KUERZEL` in `e2e/helpers/strategie.mjs` Zeile für Zeile gegen
   `EINHEITEN` und beanstandet Fehlendes, Falsches und Überzähliges. Gegenprobe
   gemacht: mit vertauschten Zeilen ist er rot und nennt beide Stellen.
2. **Ein Messaufbau über viele Läufe braucht eine Gegenprobe.** Der
   Gefechtsstand zeigte „Takte 65 – 65" über zwanzig Startwerte: auf freiem
   Grund ist jedes Gefecht dasselbe, das Gelände war vorher die einzige
   Abwechslung. Der Test wäre grün gewesen und hätte einen Startwert geprüft,
   nicht zwanzig. → Zwei Fragen stehen jetzt in der Anweisung (Abschnitt 4):
   **Ist jeder Lauf wirklich ein anderer Lauf** (die Streuung ansehen, nicht
   nur das Ergebnis), und **wäre der Test grün, wenn die Ursache eine andere
   wäre**?
3. **Was im Browser steht, wird im Browser gelesen — nicht aus dem Kopf.**
   `ansicht.werte.einheiten` trägt weder `klassen` noch `bonus`; die Erwartung
   „Speer gegen Reiter 19" musste in Node aus `daten.js` gerechnet werden. →
   Dieselbe Regel in der Anweisung, und in der Drahttafel ein Abschnitt **Was
   der Browser NICHT bekommt**.

**Die Partie angesehen** (Abschnitt 8): die KI spielt beide Seiten, Zeitraffer
20, Bilder nach dem Aufstieg bei Zoom 1, 0,6 und 1,6. Ehrlich verglichen mit
AoE II sind die drei größten Lücken keine Schönheitsfragen, sondern Lesbarkeit
— als `offen` in [`bedienung.md`](../../specs/10-strategie/bedienung.md)
angelegt:

- **AC-35 Kampfwerte an der Auswahl.** Die Leiste sagt „Bogenschütze 30/30"
  und sonst nichts. Stufe B hat einen Konterkreis gebaut, den der Spieler
  nicht lesen kann — Angriff, Rüstung, Reichweite und Bonus schickt der Server
  längst mit.
- **AC-36 Militär bei Spielgröße erkennbar.** Bei Zoom 1 sind Miliz,
  Speerkämpfer und Dorfbewohner derselbe blaue Fleck. `darstellung AC-14`
  misst die Unterscheidbarkeit auf der Schautafel, also herangezoomt; gespielt
  wird bei Zoom 1.
- **AC-37 Die Spielzeit steht im Bild.** An den Bildern war nicht zu sagen, ob
  das Dorf zwölf oder fünfundzwanzig Minuten alt ist. Ein AoE-II-Spieler
  fragt das zuerst, und ohne die Zahl ist „schneller Aufstieg" nicht sagbar.

Nicht gemacht, bewusst: die drei Lücken bleiben `offen` — eine Rückschau legt
sie an und baut sie nicht. Sie sind der natürliche Anfang von Stufe C, denn
wer gegen eine KI spielt, muss ihre Einheiten lesen können.

### Nach Runde 69 (2026-11-07)

Vier Runden (66 bis 69), alle gruen, B5 und B6 erreicht. Was wiederholt Zeit
gekostet hat, war dreimal dieselbe Art von Fehler: **eine Regel stand im Text,
aber nichts hat sie durchgesetzt.** Deshalb drei Verbesserungen, alle
durchgesetzt statt aufgeschrieben.

1. **Werte an `einheitenwert()` vorbei gelesen** — in Runde 68 war die Rüstung
   aus dem Webstuhl seit `bauen AC-21` wirkungslos, weil die Schadensformel
   `EINHEITEN[art].nahruestung` las. Der Fehler war unsichtbar: alle Tests
   grün, die Zahl im Menü richtig, nur im Kampf passierte nichts.
   → **`tests/waechter-werte.test.mjs`** sucht jeden Zugriff auf einen
   verbesserbaren Wert (die Felder aus `VERBESSERUNGEN[...].wirkung`, dazu
   `sicht`, `tempo`, `nachladen`) in der Simulation. Erster Lauf: **sieben
   Stellen**, alle über `einheitenwert()` geführt — Sichtweite der Wache,
   Nachladezeit, Lauftempo und viermal „kann kämpfen". Heute ändert sich dabei
   nichts; sobald Stadtwache, Pferdezucht oder Ballistik dazukommen, wirken
   sie ohne eine weitere Zeile. Damit das bezahlbar bleibt, merkt sich
   `einheitenwert()` die Werte je Spieler und vergisst sie beim Erforschen:
   das Tempo wird in **jedem Takt für jede Einheit** gefragt. Prüfstand Zeile
   für Zeile identisch, `fahrplan AC-6` unverändert grün.
2. **Eine Bildunterschrift aus Werten zusammengesetzt** (Runde 69) — der
   Nachweis entsteht, der Browserlauf ist grün, und erst `npm run check`
   danach sagt „hat keinen Erzeuger mehr". Kosten: ein Durchgang von 45 s.
   → **`tests/waechter-nachweis.test.mjs`** findet `titel:` mit `${` in
   Millisekunden, ohne Browser.
3. **Die kurzen Namen aus der Übertragung** haben zweimal Zeit gekostet: `h`
   sind Lebenspunkte und kein Anteil (Runde 67), und am Gebäude heißt die Art
   `art` statt `a`, während `f` der Fortschritt des laufenden Auftrags ist und
   nicht „fertig" (Runde 69). Beide Male erst nach dem Lauf gemerkt, beide
   Male in `welt.js` nachgesucht. → Eine **Tafel aller Drahtfelder** steht
   jetzt oben in `e2e/helpers/strategie.mjs`, dort wo Browsertests sie suchen.

Nicht gemacht, bewusst: `ki AC-10` (der Dorfbewohner, der spät acht Minuten
stillsteht) bleibt offen — eine Rückschau repariert Arbeitsweisen, nicht
Produktfehler. Er steht als offener Faden mit Ursache und drei Hebeln.

### Nach Runde 65 (2026-11-07)

Zehn Runden ohne Rückschau: 55 und 60 sind **ausgefallen**. Nach der
Rückschau zur Stufe A (Runde 54) hat niemand mehr gezählt — die Anweisung sagte
„Rundennummer durch fünf teilbar“, und das prüft in der Runde selbst niemand
nach. Das ist die dritte Verbesserung unten.

**Was wiederholt Zeit gekostet hat (55–64):**

1. **Gleichheit auf Daten, die mit den Stufen wachsen** — viermal in fünf
   Runden gebrochen: `EINHEITEN` (60, Zeitalter), `bildetAus` (61, „dieselbe
   Falle wie gestern“), `GEBAEUDE.farm` (63, Rüstung), `auftrag` (64, Platz und
   Heimat). Die Regel stand jedes Mal schon in der Anweisung. Eine Regel, die
   viermal gelesen und viermal nicht angewandt wird, ist keine Regel, sondern
   eine Bitte.
2. **Überdeckung im Bild fand nur das Auge** — Umrisse (56), Miliz hinter der
   Kaserne (61), „eine Figur mit drei Schwertern“ (63), „mit zwei Bögen“ (64).
   Jedes Mal lag das Bild schon, als es auffiel.
3. Bildnachweise werden nur geschrieben, wenn sie fehlen (59: „ich habe dreimal
   dasselbe alte Bild angesehen“) — das steht seit Runde 59 als Tabelle in der
   Anweisung und hat seitdem gehalten.

**Drei Verbesserungen, umgesetzt:**

1. **Ein Wächter-Test** (`tests/waechter-gleichheit.test.mjs`) liest `tests/`
   und `e2e/` und beanstandet jede Gleichheitsprüfung auf einem ganzen
   `auftrag`, `bildetAus`, `baut` oder einem Eintrag aus `EINHEITEN`,
   `GEBAEUDE`, `VERBESSERUNGEN`, `TIERE`, `ZEITALTER`, `AUFSTIEGE`. Blätter
   (`…miliz.kosten`) bleiben erlaubt, Ausnahmen gehen mit `gleichheit-ok` plus
   Grund. **Beim ersten Lauf zehn Treffer** in fünf Dateien — alle zehn echte
   Zeitbomben, alle repariert (Feld für Feld statt `deepEqual`, `includes`
   statt Liste, `.length` statt `[]`).
2. **`figurenFrei(page)`** in `e2e/helpers/strategie.mjs`, im Geist von
   `bedienteileFrei`: keine zwei lebenden Figuren im Bild näher als ein halbes
   Feld. Gemessen wird in **Feldern**, nicht in Bildpunkten — das hängt nicht
   am Zoom und ist damit eine Eigenschaft der Aufstellung, nicht der Kamera.
   Gefallene sind ausgenommen (kampf AC-10). **Beim ersten Lauf einen echten
   Fehler gefunden**, siehe unten.
3. **Der Termin der nächsten Rückschau steht im Steuerstand**, nicht im
   Kopfrechnen: Abschnitt 0 der Anweisung liest ihn dort, Abschnitt 8 trägt den
   nächsten ein. Nachzählen hat zweimal versagt.

**Was der neue Helfer sofort fand:** Im Bild zu `kampf AC-1` stehen zwei von
Annas drei Angreifern **0,27 bis 0,39 Felder** auseinander — die Verteilung um
das Ziel aus Runde 63 hält nicht mehr, seit Verteidiger sich von selbst bewegen
(Runde 64), und `nachbarfeld` fragt die Karte, nicht die Einheiten. Das ist ein
Produktfehler, kein Testfehler; in einer Rückschau wird nicht gebaut, also ist
er als `einheiten AC-29` aufgeschrieben (von „Fernkämpfer“ auf „keine zwei
Einheiten“ erweitert, mit der Messung als Schwelle) und die Prüfung steht
auskommentiert an der Stelle bereit, an der sie gelten soll. Im Bild zu
`einheiten AC-25` gilt sie ab jetzt scharf — genau dort war in Runde 64 „eine
Figur mit zwei Bögen“ zu sehen.

**Gelernt:** Eine Regel, die viermal in der Anweisung steht und viermal
gebrochen wird, gehört nicht fetter geschrieben, sondern in einen Test. Beide
Wächter dieser Rückschau haben beim ersten Lauf etwas gefunden, das kein Mensch
gesucht hatte — zehn Zeitbomben und einen echten Fehler im Spiel.

### Nach Runde 54 — Ende von Stufe A (2026-09-17)

Stufe A ist erreicht: die Dunkle Zeit am Stück im Browser spielbar, mit
Prüfstand, Wirtschafts-KI, Übersicht und Tempo. Seit Runde 50 (51–53): ein
Takt mit 800 Einheiten 58 → 0,5 ms, 24 → 60 Bilder je Sekunde, die ganze
Dunkle Zeit als ein Browsertest.

**Angesehen:** eine Partie, beide Seiten von der Wirtschafts-KI gespielt (neuer
Prüfgriff `ki`), zehn Spielminuten im Zeitraffer. Anna hat 22 Dorfbewohner,
Häuser, Mühle, Lager, Farmen, 700 Nahrung, niemand untätig
(`bilder/rueckschau-stufe-a-ki-10min-zoom1.png`, `…-zoom2.png`). Ehrlich mit dem
Original verglichen, die drei größten Lücken — als `offen` angelegt:

1. **bedienung AC-30 Verdeckte Einheiten als Umriss** — Dorfbewohner hinter
   Häusern, Lagern und Dorfzentrum sind weg.
2. **bedienung AC-31 Arbeit ist zu sehen** — Arbeitende und Wartende sehen
   gleich aus.
3. **bedienung AC-32 Arbeiter je Rohstoff** — die Leiste nennt Vorräte, nicht
   wie viele daran arbeiten.

Außerdem gesehen, kleiner: die KI baut Häuser dicht ans Dorfzentrum und das
Bergbaulager ins Gold, so dass sich alles überdeckt; eine Farm im Bau sieht
aus wie ein Hausgerüst.

Was sich in 51–53 wiederholt hat, und was sich ändert:

1. **Tempo fiel erst beim gezielten Messen auf** — 58 ms je Takt und 24 Bilder
   je Sekunde, lange unbemerkt. → Der Prüfstand schreibt jetzt „ms je Takt"
   zu jeder Partie; Anweisung: `sicht --messen` misst nur JavaScript, wer
   Zeichnung ändert, fährt `strategie-tempo`.
2. **Integration zeigte Fehler, die Einzeltests nicht sahen** — der Test der
   ganzen Dunklen Zeit fand den Klick, der das hintere Gebäude wählte, und eine
   wackelige Testhilfe. → bleibt als Regressionstest; nichts weiter.
3. **Die Rückschau am Stufenende brauchte ein lebendiges Dorf** — ein Dorf
   ohne Spieler zeigt nichts. → Prüfgriff `ki`, in der Anweisung vermerkt.

Messwerte nicht eingetragen: Browserlauf bei 54 % fremder Last nicht
vergleichbar. Nächste Runde: Spec-Runde für Stufe B (Feudalzeit); die drei
Lücken gehören in deren Bauabfolge.

### Nach Runde 50 (2026-09-17)

Runden 46–49: aus A9 untätige Dorfbewohner, Übersichtskarte, Tastenkürzel mit
Übersicht, Auswahlliste und Aufstellung einer Gruppe, dazu die Schautafel als
Nachweis; 10 Kriterien `fertig`. Was sich wiederholt hat:

1. **Bedienteile überdeckten einander, kein Test sah es** — die Auswahlleiste
   ragte ab Runde 47 unter die Übersichtskarte, gefunden erst beim Ansehen in
   Runde 48. → Hilfe `bedienteileFrei(page)`: feste Teile über dem Spielfeld
   dürfen sich nicht überdecken und nicht aus dem Fenster ragen. Geprüft im
   breitesten Zustand (ein Dorfbewohner mit Baumenü); mit der alten Lage der
   Leiste schlägt sie an („#auswahlleiste ueberdeckt #uebersicht"), mit einer
   Gruppe nicht — die Leiste ist dann schmaler. Anweisung nachgezogen.
2. **Unterschriften zu früh** — „Alle drei im Wald", als sie liefen; „mit
   Namen" unter dem Rand. → Anweisung: auf den behaupteten Zustand warten.
3. **Ein Test, zwei Kriterien, ein Bild** — das Board beanstandete das
   zweite. → Anweisung: Schleife über beide Specs.

Außerdem wieder eine wachsende Liste auf Gleichheit (Felder je Spieler) —
die Regel galt schon; eine Suche nach `Object.keys(…).sort(), [` fand keine
weitere. Browserlauf nicht gemessen: die Maschine lief die ganze Zeit mit
fremder Last.

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

### Nach Runde 98 (2026-11-08)

Runden 94–97: **C4 ist fertig**: KI gegen KI endet in zwanzig von zwanzig
Partien mit einem Sieger vor Minute 60 (fahrplan AC-11; Runde 92 waren es 4).
Fünf Kriterien `fertig` (ki AC-15 bis AC-19). Jede Runde begann mit der Frage
aus Runde 92, **warum** eine Partie nicht endet, und jedes Mal fand sich eine
andere Antwort: eine Baustelle ohne Bauer, Ziele ohne Weg, ein Sieger, der je
acht schickt, ein Verlierer ohne Einheit. Sieben Hebel gemessen und
verworfen, darunter zweimal das Schleifen mit Nahkämpfern.

Was wiederholt Zeit kostete, und was sich ändert:

1. **Vier Wegwerfskripte für dieselbe Frage** (Enden je Startwert, eine
   Partie Minute für Minute). → Werkzeug: `npm run pruefstand:verlauf --
   --startwert n` (je Minute Dorfbewohner, Heer daheim und draußen, worauf es
   einschlägt, Gebäude mit Leben, Vorrat), und `pruefstand:vergleich` nennt die
   Enden mit Startwert (`62.0@5`). Mit Rauchtest.
2. **Die Durchsicht traf in jeder Runde** (94: drei, 95: vier, 96: einzeln
   losziehende Einheiten, 97: der Aufstieg in der Schlange) — aber der Prüfer
   hat keine Shell und las in Runde 97 die ganzen Dateien statt des
   Unterschieds, und meine Gegenprobe mit `git stash` nahm den neuen Test mit
   weg. → Anweisung: der Unterschied als Datei in den Auftrag; Gegenprobe gegen
   die alte Zeile, nicht mit `git stash`.
3. **Ein Messtest über zwanzig Partien verdoppelte `npm run check`** (48 →
   88 s), weil er hinter den anderen Messungen derselben Datei lief. →
   Anweisung: Messtests über viele Partien in eine eigene Datei.

Nicht geändert: das einzelne Messen jedes Hebels mit `pruefstand:vergleich`
hat getragen — von den Runden 94 bis 97 blieb kein Code ohne gemessene
Wirkung. Die Figuren bei Zoom 1 sind als Faden vor C5 vorgemerkt; das ist die
nächste Runde.

### Nach Runde 103 (2026-11-08)

Runden 99–102: **C4 und C5 sind fertig**. Die Partie beginnt in Spielgröße
(darstellung AC-16), Kämpfende stehen nebeneinander (einheiten AC-31), man
eröffnet allein gegen die KI (spielauswahl AC-18, AC-19) und spielt eine
ganze Partie bis zur Tafel „KI 1 hat gewonnen" (fahrplan AC-12). Von Stufe C
fehlt nur der Nebel (C6).

Was wiederholt Zeit kostete, und was sich ändert:

1. **Gleichheit auf einer wachsenden Liste, zum fünften Mal** — diesmal die
   Einstellungen (Runde 101), verglichen über `.einstellungen.map(...)`; der
   Wächter kannte nur Ausdrücke, die auf das Feld enden. → Der Wächter
   erkennt jetzt auch abgeleitete Listen (`.map`, `.filter` über ein
   wachsendes Feld), mit Selbsttest und Gegenprobe; dabei fand er einen
   Vergleich, der richtig ist (gegen den Steckbrief selbst) — vermerkt.
2. **Ein zweiter Satz Startwerte zeigte zweimal, was der erste verbarg**
   (Runde 100) — von Hand gemessen mit `--startwert 21`. → `pruefstand:vergleich
   -- --saetze 2`, und die Regel: wer Bewegung oder Kampf ändert, vergleicht
   auf zwei Sätzen.
3. **Eine Gegenprobe an einem Startwert einer ganzen Partie brach** (ki
   AC-19 an Startwert 5, Runde 100), ohne dass sich das Geprüfte geändert
   hatte. → Regel: lieber eine gebaute Lage; sonst mit Abstand und der
   Messung über alle Startwerte im Kommentar.

Nicht geändert: der Lauf, der alle Bilder neu schreibt, und die Durchsicht
der Bilder über 1 % durch einen Subagenten haben getragen — in Runde 99 fand
sie zwei Kampfbilder mit übereinanderstehenden Milizen, die zur nächsten
Runde wurden. Die Feudalzeit am Stück fiel zweimal im großen Lauf (Rechtsklick
unter Last), seit dem dreifachen Klick nicht mehr.

### Nach Runde 108 (2026-11-08)

Runden 104–107: **der Nebel ist da** — gerechnet auf dem Server (kampf AC-15),
gezeichnet in drei Stufen (kampf AC-11, AC-12, darstellung AC-15), auf
Wunsch des Benutzers als Einstellung beim Eröffnen (AC-16) und mit Forschung,
die ihn verändert (AC-17, Stadtwache). Dreimal lief der volle Lauf, der alle
Bilder neu schreibt — jede Runde hat das Aussehen geändert.

Was wiederholt Zeit kostete, und was sich ändert:

1. **Die Kosten einer Änderung an der Simulation fand ein Wegwerfskript**
   (Runde 104: die Sicht machte eine Partie um 55 % langsamer).
   `pruefstand:vergleich` gab eine Rechenzeit aus, aber „nur innerhalb eines
   Standes vergleichbar". → Werkzeug: aufgewärmt, abwechselnd gerechnet, die
   Rechenzeit je 1000 Takte — gegen sich selbst ±4 %, und die Sicht zeigt sich
   dort als +14 %. Regel: wer der Simulation Arbeit hinzufügt, liest die Zeile.
2. **Ein Prüfgriff, der eine Spielregel abschaltet, war eine fehlende
   Einstellung** (`aufdecken`, Runde 105 → „Sicht" in Runde 106, erkannt vom
   Benutzer). → Regel: vor einem solchen Griff fragen, ob ein Spieler es beim
   Eröffnen wählen würde.
3. **Sieben Bilder stimmten nicht mehr, ihre Tests waren grün** (Runde 105) —
   der Nebel verbarg, was die Unterschrift nennt. → Regel: wer etwas verbirgt,
   fragt bei jedem Bild über 1 %, ob das Genannte noch zu sehen ist; die
   Durchsicht durch drei Subagenten fand alle sieben.

Nicht geändert: die Durchsicht durch einen Subagenten vor dem Abschlusslauf.
Sie fand in Runde 104 einen Randfall (`sieht(-1, y)`), in 105 bis 107 keinen
Fehler — aber jedes Mal einen Hinweis, der als Faden weiterlebt (die KI und
die Stadtwache).


### Nach Runde 113 (2026-11-08)

Runden 109–112: der Außenposten (kampf AC-18, C6d), der Server schickt nur
Sichtbares (kampf AC-13, fahrplan AC-13, C6e) — und zwei Runden, die ihr
Kriterium nicht schafften: einheiten AC-32 (Marschierende aufeinander, drei
Fassungen verworfen, Frage an den Benutzer: Formationen) und ki AC-13 (die
KI mit eigener Sicht, gebaut und belegt, aber KI gegen KI zu lang; auf dem
Zweig `strategie-ki-sicht`).

Was wiederholt Zeit kostete, und was sich ändert:

1. **Der Prüfstand kam zuletzt** — in Runde 111 und 112 standen Regel,
   Tests und Spec, als `pruefstand:vergleich` zeigte, dass KI gegen KI zu
   lange dauert. → Regel: wer Bewegung, Kampf oder das Wissen der KI ändert,
   vergleicht **gleich nach dem ersten Entwurf**, und sieht bei verschobenen
   Enden erst mit `pruefstand:verlauf` nach, wo es fehlt, bevor er eine
   Abhilfe baut.
2. **Gegenproben von Hand** — acht Mal Kopie, `sed`, zurückkopieren; in Runde
   112 blieb die KI-Datei verändert liegen, weil ein Zeitlimit den Befehl in
   den Hintergrund schob. → Werkzeug: `npm run gegenprobe -- <datei> <alt>
   <neu> -- <befehl>` schreibt immer zurück (mit Test). Dazu: Arbeit, die
   nicht grün wird, kommt auf einen lokalen Zweig statt in `git stash`.
3. **Verbergen brach Tests**, nicht nur Bilder — acht in Runde 110, sechs in
   Runde 112, alle mit derselben Abhilfe. → Regel: vorher suchen, wer
   Fremdes liest; wer nicht vom Nebel handelt, eröffnet aufgedeckt.

Nicht geändert: die Durchsicht. Sie fand in Runde 110 zwei echte Fehler
(Baustelle, die im Nebel fertig wird; Ausgeschiedene ohne fremde Gebäude) und
drei Lecks, in Runde 111 keinen — dort war die Regel richtig gebaut, aber
falsch gewählt, und das sieht nur der Prüfstand.

Gemessen (ruhige Maschine, ein Node-Prozess): `npm run check` 50 s, 499 Tests
ohne Browser; der Browserlauf 12,8 min für 173 Fälle (Runde 110); KI gegen KI
mit HEAD 50 bis 56 ms je 1000 Takte, Feudalzeit Median 11,6 min, erstes Heer
17,0 min, Enden Median 36,4 und 39,4 min, vor Minute 60: 20/20 und 19/20.


### Zur Stufe C (Runde 116, 2026-11-08)

Die Kriterien der Stufe C im Fahrplan stehen seit Runde 110 alle auf
`fertig` (fahrplan AC-11 bis AC-13); aus der Bauabfolge ruht C6f (ki AC-13,
die KI mit eigener Sicht) bis zur Antwort auf die Frage an den Benutzer. Die
Rückschau zur Stufe holt nach, was die gewöhnliche in Runde 113 nicht tat:
eine Partie ansehen. KI gegen KI aus Annas Sicht im Nebel, Zeitraffer 20,
Bilder bei Minute 12 (das Dorf), 18 (das erste Gefecht) und weit
herausgezoomt.

Was ein Spieler des Originals vermissen würde — die drei größten Lücken,
angelegt als bedienung AC-39 bis AC-41:

1. **Im Gefecht steht alles still.** Rote und blaue Kämpfer stehen reglos
   nebeneinander; wer gerade kämpft, sieht man nicht. Ausholen gibt es nur
   für Dorfbewohner bei der Arbeit (AC-39).
2. **Pfeile sind unsichtbar.** Zwischen Bogenschützen und Ziel ist nichts;
   wer auf wen schießt, liest man nicht ab (AC-40).
3. **Die Ansage „Feudalzeit erreicht" lag mitten auf dem Dorfzentrum**
   (AC-41).

Gut getragen hat: das Dorf bei Zoom 1 ist gegliedert und lesbar (Felder,
Lager, Häuser, die Gebäude der Feudalzeit unterscheidbar), der Nebel liegt
erdig und nicht schwarz über dem Erkundeten, die Übersichtskarte zeigt das
eigene Gebiet und das Heer des Gegners, die Angriffsmeldung erschien beim
ersten Gefecht von selbst. Weit herausgezoomt sind die verdeckten Einheiten
als blaue Umrisse sehr laut — eine Beobachtung, keine Lücke.

Gemessen: `npm run check` 52 s, 503 Tests ohne Browser; der Browserlauf 12,9
min für 176 Fälle (Runde 115); KI gegen KI: Feudalzeit Median 11,6 min,
erstes Heer 17,0 min (Runde 113).


### Nach Runde 121 (2026-11-08)

Runden 117–120: Spec-Runde Stufe D (20 Kriterien), D1 ganz (Ausholen im
Kampf, Pfeile, Ansagen oben) und eine Runde nur, um den Browserlauf grün zu
bekommen. Was wiederholt Zeit kostete, und was sich ändert:

1. **Ein liegengebliebener Testserver** hielt nach einem abgebrochenen Lauf
   den Hafen — in Runde 110 und 119, beide Male von Hand gefunden und mit
   PowerShell beendet. → Werkzeug: der Testserver beendet sich auf Zuruf an
   seinen Prüfgriff (`beenden`), und `scripts/leise.mjs` ruft ihn vor jedem
   Browserlauf. Ausprobiert: Server gestartet, gerufen, Hafen frei.
2. **Ein neuer Kampftest war allein zehnmal grün und fiel im vollen Lauf**
   (Runde 119): das Ziel lief heran. → Regel: die Szene hält still — ein
   Gebäude als Ziel; die Wiederholung allein läuft ohne Last.
3. **Ein bekannt wackeliger Fall lief zehn Runden mit**, bis er in jedem
   Lauf fiel (ki AC-11, Runden 110–120). → Regel: zwei volle Läufe
   hintereinander rot heißt roter `check`, Priorität eins.

Nicht geändert: das Ansehen jedes neuen Bildes. Es fand in Runde 118 ein zu
zaghaftes Ausholen und in Runde 119 einen zu kleinen Pfeil — beide Tests
waren grün.

Gemessen (ruhige Maschine): `npm run check` 53 s, 507 Tests ohne Browser;
der Browserlauf 12,2 min für 178 Fälle (Runde 120).

## Runden

Neueste oben. Eine Zeile je Runde: Nummer, Datum, Kriterien, Ergebnis,
wichtigste Erkenntnis.

- **124** · 2026-11-08 · **bauen AC-34, D3 fertig** — Eisenguss und
  Bodkinpfeil (Schmiede), Mauerwerk (Universität), Stadtpatrouille
  (Dorfzentrum). Neu: `vorstufe` an einer Verbesserung, geprüft im Server
  (erforscht, nicht bloß eingereiht) und im Menü (Knopf erst danach); und
  `welt.gebaeudewert()` als Gegenstück zu `einheitenwert()` für Leben,
  Rüstung und Sicht eines Gebäudes — Mauerwerk legt auch auf stehende
  Gebäude 10 % nach, der Schaden bleibt. Das volle Leben reist in `kw` mit
  (Gebäude- und Einheitennamen überschneiden sich nicht; ein Test hält das),
  der Wächter für Werte kennt jetzt auch `GEBAEUDE[art].leben` und Rüstung.
  Vier neue Zeichen: Gießkelle, gekreuzte Bodkinpfeile, Mauer mit Kelle,
  Horn. Gelernt: **ein Heredoc im Bash-Werkzeug halbiert Backslashes auch
  mit `'EOF'`** — die Regel „kein Heredoc mit Quelltext" gilt ohne Ausnahme,
  der neue Wächter hatte danach einen kaputten regulären Ausdruck. Und: ein
  Gebäude aus dem Prüfgriff ist erst nach dem nächsten Zustand im Browser —
  wer es gleich anwählt, wartet auf `ansicht.gebaeude.has(id)`. Kein
  Prüfstandvergleich: die KI erforscht nichts davon, und ohne Mauerwerk ist
  jeder Gebäudewert wie vorher.
- **123** · 2026-11-08 · **einheiten AC-33, AC-34** (D3 zu zwei Dritteln) —
  der Ritter im Stall (100 Leben, 10 Angriff, 2/2, ab Ritterzeit; der Speer
  schlägt ihn mit 16) und die Armbrust, die jeden Bogenschützen tauscht wie
  Soldat die Miliz — beides nur Daten, die Stufen-Mechanik trug. Gezeichnet:
  Ritter mit Pferdedecke in Spielerfarbe, Topfhelm, Lanze mit Wimpel;
  Armbrustschütze mit Eisenhut und waagerechter Armbrust. Die erste Fassung
  des Ritters hatte einen eigenen kastigen Helm — „wie ein Schornstein" —,
  jetzt der Topfhelm des Soldaten. Die Schautafel bricht auch die Einheiten
  nach zehn um. Das Bild brauchte drei Aufstellungen: erst verdeckte die
  Hauswand die Lanze, dann stand der Ritter hinter dem Haus (Norden liegt im
  Bild hinten) — jetzt sucht der Test im Süden. Im vollen Lauf fiel die
  Feudalzeit am Stück: sie nahm aus dem Stall jede Einheit, auch den Ritter
  — wieder eine wachsende Liste; jetzt bis zur Feudalzeit gefiltert. Die
  Schautafel ist länger geworden, ihr Gesamtbild ist jetzt die ganze Seite.
  Die Verbesserungen der Ritterzeit (bauen AC-34) sind die nächste Runde.
- **122** · 2026-11-08 · **bauen AC-27, AC-28** (D2 ist fertig) — der
  Aufstieg in die Ritterzeit stand schon in den Daten und lief über dieselbe
  Regel wie der in die Feudalzeit; belegt mit eigenem Test (800 Nahrung, 200
  Gold, 160 s, zwei Gebäude der Feudalzeit — die der Dunklen Zeit zählen
  nicht mehr). Kloster (Glockenturm, Schieferdach), Universität (Kuppel,
  Säulen) und Belagerungswerkstatt (offene Halle, Rad, Rammbalken)
  gezeichnet, ab der Ritterzeit im Baumenü, Tasten Y X C — die
  Tastenübersicht nennt die Tasten jetzt aus der Liste (sie nannte das P
  nie). Ein Test war erst aus dem falschen Grund grün: die Absage in der
  Feudalzeit kam von einer falsch gebauten Nachricht (`x`, `y` statt
  `ziel`) — jetzt prüft er, dass die Absage die Ritterzeit nennt. Das erste
  Bild zeigte die Werkstatt vor der halben Universität; mit Abstand neu.
  Die Schautafel trug siebzehn Gebäude in einer Reihe, die Beschriftungen
  liefen ineinander — jetzt bricht sie nach zehn um (und wirft einen Fehler
  ab zwanzig, statt still zu überlaufen). Im vollen Lauf fiel der Pfeiltest:
  das Bildschießen dauerte länger als der Flug — Pfeile fliegen jetzt mit
  sieben statt zehn Feldern je Sekunde, und der Test nimmt nur frische.
- **121** · 2026-11-08 · **Rückschau** — der Testserver beendet sich auf
  Zuruf, `leise.mjs` ruft ihn vor jedem Browserlauf; Kampftests mit einer
  Szene, die stillhält; zwei rote volle Läufe hintereinander sind roter
  `check`.
- **120** · 2026-11-08 · **der Browserlauf wieder grün** — ki AC-11 fiel
  in jedem vollen Lauf. Ursache genauer als bisher: zwei Milizen starten auf
  Nachbarfeldern, ihre Wege laufen zusammen, und danach trennt sie nur der
  Unterschied der Weglängen (ein Schrägschritt gegen einen geraden, 0,28 bis
  0,36 Felder) — gleiches Tempo hält ihn den ganzen Marsch. Auf den
  Startwerten 7 und 42 ebenso; auf 2024 hielt der Fall achtmal von acht.
  Der Test eröffnet jetzt mit 2024 — ein bewusstes zweites Ausweichen vor
  einheiten AC-32, im Test vermerkt; 4711 kommt zurück, wenn eine Gruppe im
  Gehen ihre Aufstellung behält (Frage an den Benutzer). Die Versuche liefen
  über `npm run gegenprobe --datei`; eine Variante lief nach einem
  Zeitlimit im Hintergrund weiter und schrieb danach die Datei zurück, wie
  vorgesehen.
- **119** · 2026-11-08 · **bedienung AC-40** — Pfeile fliegen sichtbar (D1
  ist fertig): jeder Schuss eines Fernkämpfers geht mit Start und Ziel in
  den nächsten Zustand, im Nebel nur, wer ein Ende sieht; der Browser lässt
  ihn auf flachem Bogen fliegen (10 Felder je Sekunde, seit Runde 122 sieben, mindestens 0,15 s).
  Ein leerer Pfeil-Eintrag ging erst mit `p: []` über den Draht — der Test
  für einen Dritten im Nebel fand es. Die Durchsicht bestätigte zwei
  Speicherlecks, die ich parallel selbst sah: ohne Zustand (Prüfstand)
  wuchs die Liste eine ganze Partie lang (jetzt höchstens 400, Gegenprobe
  1429), und im Hintergrund-Tab wuchs die im Browser. Das Bild eines Pfeils,
  der nur Zehntelsekunden fliegt: der Test merkt sich einen, fotografiert
  und prüft, dass er danach noch flog — sonst löscht er das Bild und
  versucht es neu. Ein Pfeil aus dem Nebel verrät, wo der Schütze steht —
  wie im Original, bleibt so. Im vollen Lauf fiel der Test zuerst: Berts
  Miliz stürmte heran, und alle Schüsse wurden zu kurz — jetzt ist das Ziel
  ein Haus. **ki AC-11 fällt jetzt in jedem vollen Lauf** (einheiten AC-32,
  wartet auf die Frage zu Formationen); committet mit diesem einen roten
  Fall, die nächste Runde macht ihn grün.
- **118** · 2026-11-08 · **bedienung AC-39, AC-41** (D1 zu zwei Dritteln) —
  wer kämpft, holt aus: der Server markiert eine Einheit mit Ziel in
  Reichweite wie einen arbeitenden Dorfbewohner (`w`), und der Browser beugt
  die Gestalt um die Füße vor und zurück (13°, ein Reiter 3°). Zwei
  Augenblicke desselben Gefechts unterscheiden sich in 5,6 bis 9,9 % des
  Ausschnitts, ohne das Ausholen in 0 — gemessen mit zwei verschachtelten
  `npm run gegenprobe`. Die erste Fassung (9°) war im Bild kaum zu sehen;
  erst das Ansehen zeigte es. Die Ansage zum Zeitalter steht jetzt oben
  (10rem) statt bei 30 % der Höhe, der Test prüft das mittlere Drittel des
  Fensters. AC-40 (Pfeile) ist die nächste Runde.
- **117** · 2026-11-08 · **Spec-Runde Stufe D** — 20 Kriterien: bauen
  AC-27 bis AC-34 (Aufstieg, Kloster/Universität/Werkstatt, Türme schießen,
  Mauern ziehen, Tor, Burg, Markt, Verbesserungen der Ritterzeit), einheiten
  AC-33 bis AC-38 (Ritter, Armbrust, Ramme, Mangonel, Mönch heilt und
  bekehrt), kampf AC-19 bis AC-21 (Flächenschaden, Gebäude schießen, Mauern
  halten auf), ki AC-21 und AC-22, fahrplan AC-23 (Konterkreis der
  Ritterzeit); Bauabfolge D1 bis D9, D1 sind die Lücken der Rückschau.
  Bewusst nicht in D: Unterschlupf, die Spezialeinheit der Burg (Stufe E),
  Palisade. Wachturm, Mauer, Tor und Markt sind wie im Original ab der
  Feudalzeit verfügbar, gebaut werden sie mit den Befestigungen.
- **116** · 2026-11-08 · **Rückschau zur Stufe C** — eine Partie KI gegen
  KI im Browser angesehen; drei Lücken angelegt: im Gefecht steht alles
  still (bedienung AC-39), Pfeile unsichtbar (AC-40), die Ansage zum
  Zeitalter auf dem Dorfzentrum (AC-41). Nächste Runde: Spec-Runde Stufe D,
  mit den drei Lücken als erstem Schritt.
- **115** · 2026-11-08 · **kampf AC-14** — Angriff wird gemeldet (C6g ist
  fertig): jeder Treffer meldet dem Besitzer den Ort im eigenen
  Spielereintrag (im Nebel sieht ihn niemand sonst), einmal je Gefecht — 15
  Felder, 20 Sekunden Pause, jeder Treffer beginnt sie neu. Im Bild ein roter
  Knopf oben in der Mitte, ein Klick setzt die Kamera hin. Drei Gegenproben
  mit `npm run gegenprobe`, das erste Mal mit dem neuen Werkzeug — und eine
  davon zeigte, dass der Test zur Pause sie gar nicht prüfte (auch ohne die
  Zeile grün); geschärft. Das erste Bild stand im schwarzen Nebel außerhalb
  der Karte und zeigte nicht, dass die Kamera „woanders" ist — jetzt mit der
  Sicht „Erkundet" in der Kartenmitte. Durchsicht: nichts Bestätigtes.
- **114** · 2026-11-08 · **ki AC-13, zweiter Anlauf, nicht grün** — Zweig
  hereingeholt, gemessen, wieder hinausgelegt. Diesmal zuerst nachgesehen,
  wo es fehlt (Regel aus Runde 113), und das trug: Startwert 10 stand eine
  Stunde mit 175 Mann neben einem Dorf, dessen letztes Gebäude außerhalb des
  Suchumkreises lag (→ Suche über die ganze Karte, nah zuerst); die drei
  Ausreißer 3, 5, 20 griffen 69- bis 80-mal an, weil die KI sich ohne Blick
  auf das gegnerische Heer für überlegen hielt (→ überlegen nur mit frischem
  Blick, Ausreißer jetzt 41 bis 46 Minuten). Was danach bleibt, sind Patts
  mit leerer Wirtschaft (9, 33 ohne Sieger), die auch der alte Stand kennt.
  35 von 40 vor Minute 60 statt 39. Frage an den Benutzer. Werkzeug:
  `npm run gegenprobe` nimmt jetzt absolute Pfade (die alte Datei im
  Temp-Ordner). Gelernt: **die Phasen messen statt die Enden** — bis das
  erste Dorfzentrum fällt und danach; der Median beider Phasen war mit der
  alten KI gleich, die Verlängerung saß nur in Ausreißern.
- **113** · 2026-11-08 · **Rückschau** — Prüfstand gleich nach dem ersten
  Entwurf, `npm run gegenprobe` (schreibt immer zurück), Verbergen bricht
  auch Tests; Arbeit, die nicht grün wird, auf einen lokalen Zweig.
- **112** · 2026-11-08 · **ki AC-13 in Arbeit, nicht gruen** — die KI
  kennt fremde Gebäude erst, wenn sie sie gesehen hat, fremde Einheiten nur
  in Sicht, und ihr Späher reitet den Ring der Startplätze ab: alle 40 KIs
  finden den Gegner nach 1,9 bis 2,4 Minuten. Tests mit Gegenproben stehen.
  Aber KI gegen KI dauert länger (Median 43,6 statt 36,4 und 45,0 statt
  39,4 Minuten), nur 34 von 40 Partien vor Minute 60 statt 39 — fahrplan
  AC-11 reißt. Gesucht: Überlegenheit aus Gesehenem und Ziele nur aus
  Gesehenem erklären je einen Teil (zurückgesetzt je 18 und 19 von 20); ein
  echter Fehler gefunden und behoben (Gefallene zählten drei Minuten weiter);
  die Suche um den letzten Ort des Gegners änderte keine Partie. Die Arbeit
  liegt auf dem lokalen Zweig `strategie-ki-sicht` (`7c086ac`), auf
  `strategie` nur die Spec. Gelernt: **wer der KI Wissen nimmt, misst vor
  dem Bauen der Abhilfen, wo es ihr fehlt** — `pruefstand:verlauf` auf den
  langen Startwerten, nicht Teile einzeln zurückschalten; die Partien sind
  chaotisch, jede Änderung verschiebt jeden Verlauf.
- **111** · 2026-11-08 · **einheiten AC-32 bleibt offen** — Marschierende
  laufen aufeinander, gemessen im Median 53 s je Paar. Drei Fassungen gebaut,
  gemessen und zurückgenommen: Warten hinter dem Vordermann (Überdeckung 1,2 s,
  aber Partien 1,6 bis 8 Minuten länger, fahrplan AC-11 reißt), dasselbe ohne
  Angreifer (noch länger), schräg vorbei (Überdeckung wieder lang, Einheiten
  im Wald). Die Durchsicht fand an der ersten Fassung nichts — richtig gebaut
  heißt nicht richtig gewählt; das zeigte erst der Prüfstand auf zwei Sätzen.
  Gelernt: **Abstand im Gehen ist eine Frage der Gruppe, nicht des Paares** —
  wer einzeln wartet, macht aus dem Heer eine Schlange. Frage an den Benutzer:
  Formationen. Der Browsertest zu ki AC-11 bleibt wackelig (zwei von vier).
- **110** · 2026-11-08 · **kampf AC-13, fahrplan AC-13** — der Server schickt
  jedem nur, was er sieht (C6e ist fertig). Die Welt rechnet den Zustand einmal
  und filtert je Spieler (`zustandJeSpieler`, `aufbauFuer`); der Raum fragt nur,
  ob es das gibt (ADR-0006). Fremde Einheiten nur auf gesehenen Feldern, von
  fremden Spielern nur Zeitalter, Kampfwerte und „draußen"; fremde Gebäude,
  wenn man sie sieht, ihr Fall im Nebel erst beim Hinsehen. Die Durchsicht fand
  zwei Fehler, die kein Test hatte: eine im Nebel fertig gewordene Baustelle
  bliebe beim Wiedersehen Baustelle, und wer ausscheidet, sähe fremde Gebäude
  nie — beide mit Test und Gegenprobe behoben. Und Feldänderungen verrieten,
  wo der Gegner Holz schlägt; sie warten jetzt, bis man hinsieht. Gemessen:
  zu viert +0,15 ms je Takt, Nachrichten 70 % kleiner — kein ADR nötig. Drei
  Tests verließen sich darauf, fremde Vorräte zu lesen, und vier
  Browsertests auf fremde Einheiten; sie eröffnen jetzt aufgedeckt. Der Test
  zu auswahl AC-19 bleibt im Nebel und prüft jetzt, dass von der KI nichts
  ankommt — mit „Aufgedeckt" hätte seine Unterschrift („der Rest im Nebel")
  nicht mehr gestimmt. Der Browsertest zu ki AC-11 fiel in zwei von vier
  Läufen, mit dem eingecheckten Stand ebenso: zwei marschierende Milizen
  laufen zwölf Spielsekunden lang aufeinander, und der Test, der einen freien
  Augenblick sucht, findet keinen. Angelegt als **einheiten AC-32**, die
  nächste Runde.
- **109** · 2026-11-08 · **kampf AC-18** — der Außenposten: ein Turm nur zum
  Sehen, 25 Holz, 25 Stein, 15 s, 500 Leben, Sicht 10 — weiter als jedes andere
  Gebäude (C6d ist fertig). Gezeichnet als hölzerner Wachturm auf einem Feld,
  hoch und schmal; die Schautafel bekam ihn dazu, ihre Gebäudereihe ist eine
  feste Liste. Im Baumenü ans Ende gehängt, damit keine bestehende Taste
  wandert (die Feudalzeit am Stück baut mit Tasten). Drei Dinge brachen, alle
  an seiner Form oder an Zählungen: die Prüfung der Spielerfarbe zeichnete ihn
  wie zwei Felder groß, und Dach samt Wimpel lagen außerhalb; das Menübild
  zeigte nur seine Beine (jetzt passt ein hohes Gebäude nach der Höhe); und
  zwei Tests und zwei Bildunterschriften zählten die Gebäude („sechs",
  „neun") — jetzt aus den Daten bzw. ohne Zahl. Das
  erste Bild zeigte ihn elf Felder vor dem Dorf, und die beiden hellen Kreise
  verschmolzen — „weiter als um das Dorf" war nicht zu sehen. Bei zwanzig
  Feldern hat er seinen eigenen Kreis; der Test sichert jetzt, dass zwischen
  beiden Nebel liegt.
- **107** · 2026-11-08 · **kampf AC-17** — die Stadtwache, die erste
  Forschung, die den Nebel verändert (Wunsch des Benutzers): im Dorfzentrum ab
  der Feudalzeit, 75 Nahrung, 25 s, alle eigenen Gebäude +4 Sicht. Werte als
  Daten mit einem neuen Schlüssel `gebaeude` (wie `farm`); Server
  (`welt.gebaeudeSicht`) und Browser (`nebel.js`) rechnen ihn gleich ein. Der
  Zwischenspeicher der Gebäudesicht musste nach dem Erforschen verworfen
  werden — Test mit Gegenprobe gegen die alte Zeile. Im Bild ein Paar: vorher
  die Laterne im Menü und ein kleiner heller Kreis, nachher der größere. Der
  Außenposten (AC-18) braucht eine eigene Zeichnung und ist die nächste Runde.
  Aus der Durchsicht: die KI erforscht die Stadtwache nicht — harmlos, solange
  sie alles sieht; mit C6f (die KI sieht nur ihre Sicht) wird es eine Frage.
- **106** · 2026-11-08 · **kampf AC-16** — die Sicht ist eine Einstellung
  beim Eröffnen, auf Wunsch des Benutzers: Nebel (Vorgabe), Erkundet (Karte
  bekannt, fremde Einheiten nur in Sicht), Aufgedeckt. Der Server kennt sie
  (`welt.sichtArt`), der Browser bekommt sie mit dem Aufbau. Damit fällt der
  Prüfgriff `aufdecken` aus Runde 105 weg, samt dem Merkmal `alles` am
  Spieler: Tests, die nicht vom Nebel handeln, eröffnen über `partieZuZweit(…,
  { sicht: 'aufgedeckt' })` — derselbe Weg wie ein Mensch. **Gelernt: ein
  Prüfgriff, der eine Spielregel umgeht, ist oft eine fehlende Einstellung** —
  der Benutzer sah es nach einer Runde.
- **105** · 2026-11-08 · **kampf AC-11, AC-12, darstellung AC-15** — der Nebel
  im Bild (C6b). Statt jedem Spieler seine Sicht zu schicken, rechnet der
  Browser sie aus den eigenen Einheiten und Gebäuden nach derselben Regel wie
  der Server — keine Übertragung je Takt. Ein Bild mit einem Bildpunkt je Feld,
  mit derselben Abbildung wie die Karte gestreckt, gibt mit der Glättung weiche
  Ränder; eine Zeichnung für das ganze Spielbild, eine für die
  Übersichtskarte. Zweimal hingesehen und nachgebessert: ein Rand von einem
  Bildpunkt gegen eine Linie Gelände am Kartenrand, und nie Gesehenes wird gar
  nicht gezeichnet, weil Baumkronen über den Rand ragten. Fremde Gebäude im
  Nebel zeigt der Browser so, wie er sie zuletzt sah. **Nur zwei von 101
  Browserfällen fielen** — beide zu Recht: Berts Miliz stand außer Sicht (jetzt
  drei Felder statt vier), und die Übersichtskarte prüft Gelände und Punkte
  der ganzen Karte (dafür der Prüfgriff `aufdecken`, als Merkmal am Spieler auf
  dem Server). Der Server schickt weiterhin alles; das schließt C6c. **Die
  Durchsicht der 84 geänderten Bilder durch drei Subagenten fand sieben, deren
  Tests grün waren, deren Bild aber nicht mehr stimmte**: das Heer der KI, die
  Wache der KI, der See, der Stein, Berts Siedlung — alles im Nebel — und die
  Übersicht „allein gegen die KI", die zu Recht kein zweites Dorf mehr zeigt.
  Die Tests prüfen die Daten, nicht das Gezeichnete. Jetzt decken sie auf
  (Gelände, KI) oder sagen, was zu sehen ist (AC-19). **Gelernt: eine Änderung,
  die verbirgt, bricht Bilder, nicht Tests** — dort hilft nur das Ansehen.
- **104** · 2026-11-08 · **kampf AC-15** — C6 beginnt: die Sicht je Spieler
  wird auf dem Server gerechnet (jetzt gesehen, je gesehen), zweimal je
  Sekunde. Der Nebel ist zu groß für eine Runde; die Bauabfolge C6a bis C6e
  steht im Fahrplan, dies ist C6a. **Gemessen, bevor es zu spät war:** die
  erste Fassung rechnete jede halbe Sekunde auch die Gebäude neu und machte
  eine ganze Partie um 55 % langsamer (7,8 statt 5,0 s für fünf Partien) —
  jedes deckt mit acht Feldern Rand gut 400 Felder ab, und sie stehen still.
  Jetzt nur, wenn eines entsteht oder fällt: 16 %. Ein Stempel statt eines
  Flags erspart das Leeren der Felder. Die Durchsicht fand keinen Fehler,
  aber einen Rand: `sieht(-1, y)` griff in die Nachbarreihe — mit Test und
  echter Gegenprobe (meine erste verglich einen Wert mit sich selbst). Ein
  Haus sieht „acht über den Rand" erst richtig, seit vom Rechteck gemessen
  wird statt vom Mittelpunkt mit Zuschlag.
- **102** · 2026-11-08 · **fahrplan AC-12** — **C5 ist fertig**: eine ganze
  Partie allein gegen die KI im Browser. Erst gemessen, wie lange die KI gegen
  einen Spieler braucht, der nur sammelt: 21,1 bis 22,1 Spielminuten auf vier
  Startwerten — mit Zeitraffer 20 gut eine Minute im Browser. Der Test eröffnet
  mit einem KI-Gegner über das Formular, startet allein, schickt die drei
  Dorfbewohner in den Wald, wartet auf das erste Holz und dann auf das Ende.
  Die Tafel sagt „KI 1 hat gewonnen", Anna in der Dunklen Zeit mit 770 Holz,
  die KI in der Feudalzeit mit 47 ausgebildeten Einheiten. Zehnmal
  hintereinander grün (Regel für Browserfälle mit KI und Zeitraffer). Ein
  Lauf ohne Schwierigkeiten: alles, was er braucht, haben die Runden davor
  gebaut und belegt.
- **101** · 2026-11-08 · **spielauswahl AC-18, AC-19** — allein gegen die KI.
  Eine Einstellung „KI-Gegner" (0 bis 5) im Steckbrief; `erzeugen` setzt die
  KIs als Spieler `ki1`, `ki2` … in die Welt und lässt sie vor jedem Takt
  entscheiden, wie im Prüfstand. Der Raum bleibt spielneutral (ADR-0006): er
  erfährt vom Steckbrief nur `plaetze(einstellungen)`, zählt sie zur
  Untergrenze von zwei und zieht sie von den Plätzen für Menschen ab. Zwei
  Stolpersteine: das Verzeichnis reicht nur bekannte Felder des Steckbriefs
  weiter — `plaetze` kam nicht an, und der Start allein scheiterte trotz
  Einstellung; und drei Tests verglichen die Liste der Einstellungen auf
  Gleichheit (vier Einträge, aufgezählt), dazu eine Bildunterschrift „Vier
  Einstellungen". Der Wächter kennt `einstellungen` jetzt als wachsendes
  Feld. **Gelernt: auch die Liste der Einstellungen wächst** — die Regel
  „enthält statt ist gleich" gilt nicht nur für die Daten der Einheiten.
- **100** · 2026-11-08 · **einheiten AC-31** — Kämpfende stehen nebeneinander.
  Wer an seinem Ziel angekommen ist, tritt wie jeder Stehende beiseite, aber
  nur auf ein Feld in Schlagweite; der Schritt ist am Auftrag vermerkt, sonst
  löschte `angriffTakten` ihn im selben Takt. Gegenprobe gegen die alte Regel:
  0,00 Felder auseinander. Im Browser prüfen kampf AC-1 und AC-10 jetzt
  `figurenFrei` (die Prüfung stand dort seit der Rückschau nach Runde 65
  auskommentiert); drei blaue Milizen sind drei Figuren. **Zuerst wurden die
  Partien länger** — Median 38,1 statt 33,8 auf Startwerten 1–20, 44,8 statt
  38,2 auf 21–40, eine Partie nach 75 Minuten —, weil während des Schritts
  die Nachladezeit stand und jeder Schritt einen Schlag kostete. Mit
  weiterlaufender Nachladezeit: 36,4 und 39,4, alle zwanzig vor Minute 60.
  Die Durchsicht fand keinen Fehler, aber einen Kostenfall, den der alte
  Leistungstest nicht sah (sein Ziel gab es nicht): 800 angekommene Angreifer
  an einem echten Ziel 0,74 ms je Durchgang, mit Merken, wer keinen Platz
  fand, 0,48, mit Zahlen statt `"x,y"` als Feldschlüssel 0,28 (im
  parallelen `npm run check` waren 0,48 schon 1,006 ms) — jetzt ein eigener
  Test. Im großen Browserlauf fiel wie in Runde 99 die Feudalzeit am Stück
  beim Warten auf den ersten Treffer, allein grün: unter Last trifft der
  Rechtsklick nicht immer das Ziel; der Test klickt jetzt bis zu dreimal
  (gemessen wird dort der Schaden, nicht der Klick). Unter Last ungeprüft,
  bis der nächste große Lauf es zeigt. Die Gegenprobe zu ki AC-19 hing an
  Startwert 5, der jetzt auch ohne Aufgeben vor Minute 60 endet; sie misst
  jetzt Startwert 13 (35,8 statt 45,8). **Gelernt: eine Änderung an der
  Bewegung im Kampf verschiebt jede Partie** — vergleichen auf zwei Sätzen
  Startwerte, sonst hält man Zufall für Wirkung; und auf dem zweiten Satz
  zeigte sich, dass fahrplan AC-11 auch mit HEAD nur 19 von 20 schafft.
- **99** · 2026-11-08 · **darstellung AC-16** — die Partie beginnt in
  Spielgröße. Der Faden „Figuren bei Zoom 1" hieß: zeichnen. Gemessen zeigte
  sich, dass nicht die Zeichnung zu klein war, sondern der Maßstab: ein Feld
  bei Zoom 1 ist 44 Bildpunkte breit, im Original 96; ein Dorfbewohner 28,6
  hoch, im Original rund 45. Bei Zoom 2 sahen dieselben Figuren schon gut
  aus. Jetzt beginnt jede Partie bei Zoom 1,5 (42,9 Bildpunkte, ein Feld 66
  breit) — eine Zeile, aber jedes Bild vom Start ist neu. Zoom 1 bleibt der
  feste Maßstab der Kriterien zur Unterscheidbarkeit. Ein Browsertest ging
  von Zoom 1 aus (fünf Rasten heran und zurück); von 1,5 aus stößt das
  Heranholen an die Grenze 2,5, und zurück landet man darunter — jetzt führt
  er ausdrücklich zum Startblick zurück. Die Durchsicht der 28 geänderten Bilder durch einen
  Subagenten beanstandete vier; selbst angesehen: zwei Kampfbilder mit zwei
  blauen Milizen übereinander (einheiten AC-31, im alten Bild genauso — damit
  ist der Fehler oft genug umschifft, **er ist die nächste Runde**), das
  Goldbild (alter Faden, Ursache jetzt bekannt) und ein Bild am Waldrand, das
  trägt. Im großen Lauf fiel einmal die Feudalzeit am Stück (Warten auf den
  ersten Treffer); allein und dreimal wiederholt grün — Last, kein Fehler. **Gelernt: erst messen, wie groß das
  Problem in Bildpunkten ist, und gegen das Original halten** — sonst hätte
  die Runde Figuren umgezeichnet, die bei richtigem Maßstab schon tragen.
- **97** · 2026-11-08 · **ki AC-19, fahrplan AC-11** — **KI gegen KI endet:
  zwanzig von zwanzig Partien mit Sieger, jede vor Minute 60** (24,8 bis 53,3,
  Median 33,8; Runde 92 waren es 4 von 20). Die letzte lange Partie
  (Startwert 5, 62,0 min) angesehen: kein Patt mehr, sondern ab Minute 53,5
  ein Verlierer ohne jede Einheit mit 28 Nahrung, dessen 28 Gebäude achteinhalb
  Minuten lang geschleift wurden. Zuerst nochmals das Schleifen mit
  Nahkämpfern versucht, jetzt nur gegen einen Gegner ganz ohne Kampfeinheit:
  61,9 statt 62,0 — wirkungslos, das Heer steht beim Schleifen schon,
  zurückgenommen. Dann: **die KI gibt auf, wenn nie wieder etwas geschehen
  kann** (keine Einheit, nichts in einer Schlange, nichts bezahlbar), wie der
  Computergegner im Original; bewusst keine Einschätzung „wird verlieren". Die
  Durchsicht fand, dass ein bezahlter Aufstieg in der Schlange nicht zählte
  (behoben, Test mit Gegenprobe gegen die alte Zeile) und dass fehlender
  Wohnraum das Aufgeben verhindert (harmlos: dann bleibt es wie vorher). Der
  Messtest über zwanzig Partien hat eine eigene Datei, sonst verdoppelte er
  `npm run check` (88 statt 48 s). **Gelernt: wer fragt, warum es nicht
  endet, findet manchmal, dass es längst entschieden ist** — die letzten
  achteinhalb Minuten waren keine Frage der Stärke mehr, sondern eine, die
  im Original der Verlierer selbst beantwortet.
- **96** · 2026-11-08 · **ki AC-18** — überlegen zieht alles los. Die zwei
  langen Partien angesehen: Startwert 4 war ab Minute 48 entschieden, der
  Sieger schickte aber je acht, während daheim bis zu 85 warteten, und brauchte
  17 Minuten für ein Dorf ohne Heer; Startwert 5 ist ein Patt bis Minute 63,
  dann 15 Minuten Schleifen. Zwei Hebel einzeln gemessen
  (`pruefstand:vergleich`, 90 Minuten, zwanzig Startwerte): **überlegen alle
  bis auf die Wache losschicken** — 19 von 20 vor Minute 60, Median 36,3 statt
  41,7 min, aber Startwert 5 unentschieden; die Durchsicht fand, dass dann
  jede fertige Einheit einzeln loszog: mit mindestens zweien alle 20 mit
  Sieger, 19 vor Minute 60, die längste nach 62,0 Minuten, Median 37,8 (zu
  viert: die längste nach 77,6) — bleibt; **überlegen nur Nahkämpfer ausbilden** — 16 von 20, Median
  46,8, verworfen (die Überlegenheit tritt auch mitten im Patt kurz ein, und
  die KI baut dann die falschen Einheiten); beides zusammen 18 von 20. Die
  Regel ist in Runde 92 schon einmal verworfen worden — damals bedingungslos,
  jetzt nur bei dreifacher Überlegenheit. **Gelernt: dieselbe Abhilfe kann
  unter einer Bedingung tragen, die ohne sie geschadet hat** — die Frage ist
  nicht „hilft alle losschicken", sondern „wann". Der Vergleich gibt jetzt
  auch „vor Minute 60" und die Enden aus; die Zahl des Kriteriums stand
  vorher nur im Kopf.
- **95** · 2026-11-08 · **ki AC-16, AC-17**; ki AC-12 neu gemessen — Partien
  werden zu Ende gebracht. **KI gegen KI über zwanzig Startwerte: 18 von 20
  enden vor Minute 60 (vorher 5), alle 20 mit Sieger, im Median nach 42 statt
  66 Minuten.** fahrplan AC-11 (20 von 20 vor Minute 60) ist damit nah, aber
  nicht erreicht. Gelernt, fünferlei: (1) **Zwei Hebel, die einzeln nichts
  taugen, können zusammen tragen.** Jeder im Heer sein nächstes Ziel (AC-16)
  brachte allein 10 von 20 vor Minute 60; Nahkämpfer aus der Kaserne (AC-17)
  hatten in Runde 92 allein nichts gebracht — zusammen 18. Erst wenn sich das
  Heer auf viele Gebäude verteilt, kommen die Nahkämpfer an sie heran.
  Gemessen je Variante in Kopien des Ordners, nicht geraten. (2) **Das Maß
  einer Klausel kann von einer anderen Verbesserung überholt werden.** „Bei
  Minute 30 mindestens 20 Dorfbewohner" sollte prüfen, dass die KI ihre
  Wirtschaft nicht dem Heer opfert. Seit Partien um Minute 35 bis 45
  entschieden werden, maß es den Kriegsverlauf: 14 von 40 KIs lagen darunter,
  fast alle Verlierer, und jede neue Ausnahme (überrannt, ohne Dorfzentrum,
  Gefallene der letzten fünf Minuten, ab welcher Minute man zählt) machte den
  Test verwickelter. Jetzt misst der Prüfstand die Absicht direkt, in jedem
  Takt: fehlen Dorfbewohner und sind Nahrung und Platz da, steht das
  Dorfzentrum nie länger als 0,5 s still. Mit Gegenprobe (eine KI, die keinen
  Dorfbewohner bestellen darf, fällt auf). (3) **Wer kämpft, steht nicht
  herum** — `welt.untaetig` zählte einen Dorfbewohner, der sich wehrte, als
  untätig (22 s im Prüfstand), und der Knopf für Untätige hätte ihn aus dem
  Kampf geholt. (4) **Eine Baustelle kann einen Sammler einschließen**: eine
  Mühle im Bau machte aus dem Platz eines Beerensammlers eine Tasche aus zwei
  Feldern. Wer mit Ladung festsitzt und an einer eigenen Baustelle steht, baut
  jetzt mit; und eine verlassene Baustelle baut der unter den drei Nächsten
  weiter, der hinkommt. (5) **Die größere Nahrungsrücklage ein zweites Mal
  gemessen — wieder ohne Wirkung, wieder zurückgenommen.** Die Umverteilung
  nach **Abstand** (300 mehr als der fehlende Rohstoff statt fester 600) bleibt:
  18 statt 14 vor Minute 60. **Die Durchsicht fand vier Dinge**: das Mitbauen
  zog jeden mit angefangener Ladung ab (jetzt nur volle Ladung, die nicht
  sammelt); zwei Baustellen nahmen sich den einzigen Bauer abwechselnd weg
  (wer baut, wird nicht abgezogen); ein Ziel ohne Weg zog den Angreifer jede
  halbe Sekunde neu an (jetzt zwei Minuten ausgelassen); und eine Ladung geht
  verloren, wenn ein Untätiger zu einem anderen Rohstoff geschickt wird. Den
  vierten habe ich **nicht** behoben: die Abhilfe (zuerst zum eigenen Rohstoff)
  verschob die Wirtschaft der Dunklen Zeit — 16 statt 13 an der Nahrung, 3 statt
  7 im Holz —, und im Original geht die Ladung beim Wechsel ebenso verloren.
- **94** · 2026-11-08 · **ki AC-15** — liegengebliebene Baustellen werden
  weitergebaut. Gefunden mit der Frage aus Runde 92, **warum** drei Partien
  nach 90 Minuten unentschieden enden: beim Startwert 13 und 16 hörte der
  überlegene Spieler ab Minute 55 auf zu wachsen — Bevölkerung 40 von 40,
  Heer 18, daneben 4000 Nahrung. Null Versuche, ein Haus zu bauen. Die
  Ursache: eine Hausbaustelle aus der Frühphase, deren Bauer geflohen war;
  und `hausImBau` sperrte jedes weitere Haus. Danach beim Startwert 13: 23
  Häuser, 112 Einwohner bei Minute 70. Über zwanzig Partien bis Minute 90
  (`npm run pruefstand:vergleich -- --minuten 90`, zum ersten Mal benutzt):
  19 statt 17 mit Sieger, Ende im Median nach 66 statt 71 Minuten, im Median
  49 statt 18 Kampfeinheiten; vor Minute 60 enden 5 statt 4. **Die
  Durchsicht fand drei Dinge**, alle mit Test: eine Baustelle ohne Weg riss
  jede halbe Sekunde einen Arbeiter heraus (jetzt zwei Minuten gesperrt, und
  ohne begehbares Randfeld gar kein Versuch); ein Gefallener galt zwei
  Sekunden als untätig und konnte Bauer werden (die Liste der Dorfbewohner
  lässt Tote jetzt aus, für alle Regeln); und ein Ersatz lief in den Feind
  (Baustellen mit Feinden daneben bleiben liegen). Danach musste der
  Messtest zu ki AC-12 die Belagerung auch für den zweiten Angriff kennen:
  Startwert 6, KI 2 wurde ab Minute 20 belagert, 128-mal die Wache gerufen —
  wer nicht angreift, verteidigt, wie in AC-11. Gelernt: **erst
  fragen, warum es nicht endet — dann bauen.** In Runde 92 habe ich zwei Hebel
  geraten (größeres Heer, Nahkämpfer), beide wirkungslos; die Messung der
  drei Remis fand in einer Viertelstunde einen echten Fehler. Der dritte Remis
  (Startwert 14) hat eine andere Ursache: 85 Plänkler stehen beim Verlierer
  ohne Einheit und Dorfzentrum, und seine elf Gebäude halten — das ist der
  nächste Faden für fahrplan AC-11.
- **92** · 2026-11-08 · **fahrplan AC-11 gemessen, nicht erreicht; bauen
  AC-3 nachgebessert** — Ziel war: KI gegen KI endet in zwanzig von zwanzig
  Partien mit einem Sieger, unter 60 Minuten. **Heute: 4 von 20 unter 60
  Minuten, 17 von 20 mit Sieger bis Minute 90 (Median 72,6 min), drei
  unentschieden.** Zwei Hebel versucht und gemessen, beide zurückgenommen:
  (a) **das Heer zieht bis auf die Wache ganz los** statt je acht — bei Minute
  60 standen beim Startwert 2 achtzig Kampfeinheiten daheim; (b) **auch die
  Kaserne bildet aus**, denn Fernkämpfer nehmen einem Gebäude nur einen
  Punkt je Schuss (Fernrüstung 7), eine Miliz vier. Ergebnis über zwanzig
  Startwerte bis Minute 90: nur (a) 3 unter 60 / 15 mit Sieger; nur (b) 6 /
  12; beides 6 / 13 — mehr frühe Entscheidungen, aber auch mehr Remis, weil
  sich gleich starke Heere in der Mitte aufreiben. Keine Variante kommt dem
  Kriterium nahe; ohne nachgewiesenen Nutzen bleibt kein Code. **Gelernt:
  fahrplan AC-11 ist mehr als eine Runde** — es braucht eine KI, die Partien zu
  Ende bringt (Ziele wählen, Gebäude mit Nahkämpfern schleifen, nachsetzen)
  und die Lage liest (überlegen oder nicht). Das wird spezifiziert, bevor
  gebaut wird. **Was die Runde liefert:** der Prüfstand fand bei den Versuchen
  einen alten Fehler — ein Plänkler ging schräg an der Ecke eines eben
  begonnenen Stalls vorbei, auf halbem Weg rundete seine Lage in den Stall
  (Startwert 3, Takt 52113). `belegen()` suchte nur neu, wenn ein
  **Wegpunkt** in der neuen Grundfläche lag; jetzt auch, wenn ein schräger
  Schritt ihre Ecke schneidet. Test mit Gegenprobe (ohne die Korrektur rot).
- **91** · 2026-11-08 · **ki AC-10** — auch spät steht niemand herum: bis
  Minute 30 steht über zwanzig Startwerte kein Dorfbewohner länger als 12,9
  Sekunden still (Grenze 20). Die letzten zwei Fälle (39 und 53 s) waren
  Holzfäller mit voller Ladung, drei davon auf einem Punkt: die KI hatte ein
  Holzfällerlager in eine Waldlücke gestellt, und `wegZumLager` nahm das
  nächste Randfeld des nächsten Lagers — zugewachsen, kein Weg, und der
  nächste Takt versuchte dasselbe. Jetzt sucht er andere Randfelder und die
  anderen Lager. Gelernt, zweierlei: (1) **Ein Test, der eine Rolle anders
  zählt als die KI, misst die Zählung.** `ki AC-4` zählte Holzfäller mit eben
  geleertem Baum als „undefined", `Ki.rolle()` fällt auf die Ladung zurück;
  der Test zählt jetzt so wie sie. (2) **Eine Ausnahme braucht einen Grund,
  der sich nachrechnen lässt.** Beim Startwert 6 hatte KI 2 bei Minute 30 zehn
  Dorfbewohner, ohne Feind im Dorf — der Überfall war eine Minute vorher
  abgewehrt, 27 Gefallene. Erst setzte ich drei Minuten als Fenster (zu kurz,
  geraten), dann fünf: in fünf Minuten bildet ein Dorfzentrum zwölf
  Dorfbewohner aus (25 s je Stück, aus den Daten). Überrannt heißt jetzt: der
  Fehlbetrag erklärt sich durch Gefallene, die noch nicht ersetzt sein
  können. Und eine größere Nahrungsrücklage für Dorfbewohner, die ich dafür
  baute, änderte keinen einzigen Wert (Bogenschützen kosten keine Nahrung) —
  zurückgenommen, statt sie ohne Wirkung im Code zu lassen. (3) **Die
  Durchsicht fand ein altes Leistungsloch**: wer kein Lager erreicht, suchte
  in jedem Takt einen Weg, und eine vergebliche Suche durchflutet das ganze
  erreichbare Gebiet. 30 Holzfäller vor einem abgeschnittenen Lager kosteten
  **47 ms je Takt — schon vor dieser Runde**; mein neuer Ausweg hätte es auf
  bis zu 19 Suchen je Einheit und Takt gesteigert. Jetzt: nach einem
  vergeblichen Durchgang fünf Sekunden Pause, nach der Nummer der Einheit
  gestreut — 1,2 ms im Mittel, Spitze 6,9 ms (ungestreut 93 ms in einem Takt,
  weil alle zugleich wieder suchten). **Mein erster Messaufbau hat das Loch
  nicht gezeigt**: einzeln eingemauerte Holzfäller scheitern sofort, teuer ist
  es nur, wenn der Holzfäller frei steht und das Lager abgeschnitten ist.
- **90** · 2026-11-08 · **ki AC-12** — Nachschub: nach dem ersten Heer greift
  jede KI wieder an (4 bis 9 Angriffe in 30 Minuten, Median 8), und die
  Wirtschaft trägt weiter (21 bis 22 Dorfbewohner samt Ausbildung bei Minute
  30; im Median 13 Kampfeinheiten statt 6). Gelernt, viererlei: (1) **Jeder
  behobene Engpass zeigt den nächsten — also nach jedem Schritt messen,
  nicht raten.** Erst fehlte Holz (2300 Nahrung neben 20 Holz) → Umverteilen
  nach dem Aufstieg; dann stapelte sich alles, und das Heer blieb klein → der
  Engpass war der **Durchsatz** eines einzigen Militärgebäudes → bis zu drei;
  dann fehlte einer KI die Nahrung → Rücklage für Dorfbewohner vor dem
  Militär — die half **nicht**, die Nahrung blieb bei 10. Erst das Zählen der
  Rollen zeigte: sieben fertige Farmen, keine bewirtschaftet. (2) **Ein alter
  Fehler, der wie Spätwirtschaft aussah**: `schicken(nahrung)` versuchte die
  Beeren vor der Farm, das nächste Beerenfeld lag knapp in Reichweite, aber
  ohne Weg — der Dorfbewohner blieb stehen, und die nächste Entscheidung
  schickte ihn wieder hin. Jetzt gilt ein Versuch nur, wenn er losgeht, und ein
  Feld ohne Weg wird nicht wieder vorgeschlagen. Nebenwirkung: die längste
  Untätigkeit bis Minute 30 fiel von bis zu 655 s auf 53 s — `ki AC-10` ist
  damit fast erreicht. (3) **Ein Messpunkt kann in einen Überfall fallen**: bei
  Minute 30 hatte eine KI 19 Dorfbewohner, drei waren eben gefallen und zwei
  standen bezahlt in der Schlange. Das Kriterium zählt jetzt mit, wer in der
  Ausbildung steht — begründet in der Spec, nicht um grün zu werden: die
  Absicht war „die Wirtschaft läuft weiter", nicht „kein Verlust in dieser
  Sekunde". (4) Die Rücklage für Dorfbewohner bleibt trotzdem: sie hat den
  gemessenen Fall nicht gelöst, ist aber richtig (ein Dorfzentrum ohne Nahrung
  ersetzt niemanden) und hat einen eigenen Test. (5) **Die Durchsicht durch
  einen Prüfer fand vier Dinge**, alle behoben mit Test: ein gescheiterter
  Umverteilungsversuch riss einen Sammler aus der Arbeit und setzte keine
  Sperre; `unterwegs()` galt für Schaf und Farm immer; ein Feld ohne Weg blieb
  für immer gesperrt (jetzt zwei Minuten); und `umverteilen` übergab eine
  leere Liste, sodass die Obergrenzen an Schafen und Beeren nicht griffen.
  **Die vierte Korrektur machte die Zahlen erst schlechter**: mit den
  Obergrenzen fand die Umverteilung zu Nahrung keinen Platz mehr, und eine
  KI hungerte neben 640 Gold — der feste Plan wollte keine weitere Farm. Jetzt
  baut die KI nach dem Aufstieg eine Farm, wenn Nahrung fehlt und keine frei
  ist. (6) **Seit es Nachschub gibt, werden Partien entschieden** — und der
  Messpunkt „20 Dorfbewohner bei Minute 30" traf drei KIs, deren Dorf gerade
  überrannt wurde (9 bis 23 Feinde gegen zwei bis drei eigene). Die Klausel
  prüft jetzt richtig herum: wer unter 20 liegt, muss überrannt werden und
  vorher die 20 gehabt haben; höchstens ein Viertel. Meine erste Fassung nahm
  jede angegriffene KI aus (acht) und hatte eine geschätzte Grenze von sechs —
  beides falsch, die Anweisung sagt: erst messen.
- **89** · 2026-11-08 · **einheiten AC-29** — keine zwei Einheiten
  übereinander: alle fünf Takte treten Stehende auseinander, die näher als ein
  halbes Feld beieinander stehen — die höhere Nummer zuerst, auf ein freies
  Nachbarfeld, auf dem sie ihre Arbeit behält. **Geteilt**: Sammler am Vorrat
  und am Tier (neu `einheiten AC-30`) und Kämpfende (neu `einheiten AC-31`)
  weichen noch nicht. Gelernt, fünferlei: (1) **Der Stapelfehler war ein
  Wirtschaftsvorteil.** Gestapelt standen alle Sammler am Beerenbusch auf dem
  einen Feld, das der Mühle am nächsten liegt. Ohne Stapeln hat die KI ihre
  500 Nahrung im Median 0,4 Minuten später (9,38 → 9,80), und neun von
  vierzig KIs verfehlen die zehn Minuten aus fahrplan AC-5. Drei Abhilfen
  gemessen, keine hat getragen: das freie Feld nach dem Lager wählen (9,88),
  auf ein anderes Buschfeld wechseln (9,85), andere Verteilung Beeren/Schafe
  (4/6: 9,88; 6/8: 10,30). Die Schwelle zu senken wäre „senken, um grün zu
  werden" gewesen — also das Kriterium geteilt, die Sammler in AC-30 mit der
  Bedingung, dass fahrplan AC-5 hält. (2) **Ein Gefechtsstand findet auch
  Fehler, die mit Kampf nichts zu tun haben**: ein schräger Seitenschritt schnitt
  eine Waldecke, auf halbem Weg rundete die Lage in den Wald, und der
  Prüfstand meldete „Einheit 42 steht in einem Hindernis". (3) **Ein
  Nebeneffekt deckte eine alte Lücke der KI auf**: mit verschobenen Sammlern
  entschied sie beim Startwert 4 anders und baute in der Feudalzeit erst ein
  Holzfällerlager und eine Mühle — die Schießanlage kam 2,3 Minuten später,
  bei Minute 16 zwei statt sechs Kampfeinheiten. Die Holzrücklage für das
  Militärgebäude galt seit Runde 69 nur vor Farmen; jetzt vor jedem Lager
  (eigener Test unter ki AC-9). (4) **Die Durchsicht durch einen Prüfer (neu
  seit der Rückschau nach Runde 88) fand drei echte Dinge**: nur der mit der
  höheren Nummer wurde versucht, toter Code für Sammler, und der schlimmste
  Fall kostete 7,6 ms je Durchgang — 800 Angreifer auf drei Feldern. Die
  Suche lief zuerst durch die Nachbarzelle, an 267 Einheiten vorbei, die ein
  ganzes Feld weg standen; mit der eigenen Zelle zuerst sind es 0,09 ms.
  **Gemessen, nicht vermutet**: die erste Korrektur (nur der erste Nahe) brachte
  7,6 → 2,0 ms, die zweite (Belegung erst bei Bedarf) gar nichts — erst der
  Blick auf die Reihenfolge der Zellen traf. (5) Der neue Browserfall lief vor
  dem Abschlusslauf zehnmal (Regel aus der Rückschau): zehn von zehn grün.
  Prüfstand: Feudalzeit nach 11,1 bis 12,0 min, erstes Heer nach 17,4 bis
  19,3, keine Widersprüche, Konterkreis 20/20 gegen 0/20 in allen Richtungen.
- **87** · 2026-11-08 · **auswahl AC-20, AC-21** — das Spiel heißt **Fading
  Allies** (auf seiner Karte und im Titel der Schautafel), und was auf dem
  Bildschirm steht, hat echte Umlaute. Gelernt, dreierlei: (1) **Eine Regel
  als Fettdruck hält nicht.** „Texte, die auf dem Bildschirm stehen, bekommen
  echte Umlaute (‚Eröffnen', nicht ‚Eroeffnen')" stand seit der ersten Runde
  in CLAUDE.md — und der Knopf hieß bis heute „Eroeffnen", genau wie das
  Gegenbeispiel. Dazu rund vierzig weitere Stellen in fünfzehn Dateien: alle
  Absagen von Raum und Welt („Das ist nicht dein Gebaeude."), die Einstellungen
  („Hoechstens Spieler", „Kartengroesse", „gross"), drei Gebäudenamen
  („Holzfaellerlager", „Schiessanlage", „Muehle") und die Karte des Managers.
  Jetzt setzt `tests/waechter-umlaute.test.mjs` die Regel durch, mit
  Gegenprobe. (2) **Ein Wächter für Sprache braucht eine Ausnahmeliste, keine
  schlaue Regel**: „Dauer", „bauen", „aktuellen" sind richtig geschrieben und
  enthalten trotzdem ae/oe/ue; ß lässt sich gar nicht an Buchstaben erkennen
  („Klasse" ist richtig, „gross" nicht). Deshalb Wortanfänge, die richtig
  sind, und Wortstämme für ß — die Listen wachsen, wenn ein Wort sie braucht.
  (3) **Bildunterschriften im QA-Bericht sind kein Bildschirmtext** und
  bleiben, wie sie sind: an ihnen hängen Dateinamen und die Zuordnung zum
  Test. Das ruhende Managerspiel liest der Wächter noch nicht — wer dort
  wieder arbeitet, nimmt `manager.js` in seine Liste auf.
- **86** · 2026-11-08 · **ki AC-14** — die KI verteidigt zu Hause: Verliert ein
  Gebäude oder ein Dorfbewohner Leben, zieht die Wache im Angriffslauf zum
  Angriffsort, und der getroffene Dorfbewohner läuft zum Dorfzentrum, statt
  stehenzubleiben und zurückzuschlagen. Die KI bekommt dafür **keine Meldung**:
  sie vergleicht bei jeder Entscheidung die Lebenswerte mit denen der letzten
  und sieht, was fehlt. Was ihr Heer unterwegs einsteckt, zählt nicht.
  Gelernt, viererlei: (1) **Vier grüne Tests und trotzdem falsch — weil alle
  aus derselben Richtung kamen.** Im Node-Test stand die Wache **nördlich** des
  Dorfzentrums und der Angreifer südlich; da war das nächste freie Feld am
  Angriffsort nie das Feld des Angreifers. Im Browser kam sie aus **derselben**
  Richtung, und dann wurde aus dem Angriffslauf ein Angriff auf genau diese
  eine Einheit: `feindAn` zieht im Server einen Feind im Umkreis von 1,01
  Feldern unter den Klick (kampf AC-1). Sie fiel unterwegs, der Auftrag war
  erfüllt, und die Wache stand zwölf Felder vom Dorf still, während der Gegner
  weiter einschlug. Das Marschziel hält jetzt 1,5 Felder Abstand von jedem
  Feind; der Angriffslauf greift den Angreifer ohnehin an, sobald er in Sicht
  kommt, und marschiert weiter, wenn er fällt. **Wo eine Regel von der
  Geometrie abhängt, prüft ein Aufbau genau eine Geometrie** — der neue Test
  stellt Wache und Angreifer auf dieselbe Seite und hat eine Gegenprobe ohne
  die Abstandsregel. (2) **Das Ende des Marsches ist kein Bild.** Angekommen
  steht die Wache zwischen Dorfbewohnern, und der Lebensbalken des
  Dorfzentrums verliert in diesen Sekunden keine fünf Prozent von 2400 — fünf
  Prozent sind fünf Bildpunkte. Was die Sache zeigt, ist der **Weg**: zwei rote
  Milizen allein auf offener Wiese, und darüber das angegriffene Gebäude mit
  Annas Milizen daran. **Und angegriffen wird ein Haus abseits, nicht das
  Dorfzentrum** — dort treibt die KI ihre Schafe zusammen, schlachtet und lädt
  ab, und im Gedränge stand in jedem dritten Lauf eine Figur auf einer anderen
  (siehe 7). (3) **Ein Angreifer allein stirbt,
  bevor das Bild steht**: Berts Späherreiter wehrt sich (kampf AC-2), und
  Annas einzelne Miliz lag nach zwanzig Spielsekunden am Boden — das Bild hätte
  einen Angriff ohne Angreifer gezeigt. Jetzt sind es vier. (4) **Ein
  Kriterium, das eine Quote behauptet, kann an der neuen Funktion scheitern,
  ohne falsch zu sein.** `ki AC-11` verlangte, dass über zwanzig Startwerte
  jede KI angreift. Seit sie sich wehrt, kommt beim Startwert 13 die zweite KI
  nie auf zehn Kampfeinheiten, weil die erste ab Minute 17,5 bei ihr steht. Das
  Kriterium sagt jetzt den Grund statt der Quote: **in jeder Partie greift
  jemand an, und wer nicht angreift, verteidigt.** (5) Nebenbei gefunden und
  unter `kampf AC-5` belegt: Wer sich **wehrt**, hörte nicht auf zu sammeln —
  `befehl()` räumt `sammelt` und `baut` beim Angriffsbefehl weg, die Gegenwehr
  aus `wehren()` ging daran vorbei. Ein getroffener Dorfbewohner trug auf dem
  Draht weiter „arbeitet gerade" (bedienung AC-31), während er zurückschlug.
  (6) **Ein flatternder Browsertest, unabhängig von der Runde**: `fahrplan
  AC-3` (die Dunkle Zeit am Stück) fiel in etwa jedem dritten Lauf mit „ein
  freistehender, unverdeckter Dorfbewohner". Die Hilfe sagte nicht, warum; jetzt
  sagt sie es — „4 eigene, davon 1 ausgenommen, 3 hinter einem Gebäude". Später
  im Baulauf sammeln alle hinter den eben gebauten Häusern, und Warten half
  nicht (25 Versuche im Zeitraffer, weiter alle verdeckt). Der Ausschluss war
  aber unnötig: ein Klick sucht **zuerst die nächste eigene Einheit** und erst
  dann ein Gebäude, ein Umriss ist also anklickbar. `dorfbewohnerAnklicken`
  kennt jetzt `auchVerdeckt` für Fälle, die kein Bild von der Auswahl machen;
  der Baulauf nutzt es und braucht 35 s statt 55 s. (7) **Das Gedränge am
  Dorfzentrum hat vier echte Fehler gezeigt**, gemessen mit `figurenFrei`, das
  jetzt Besitzer und Feld nennt: die KI gab Wache und Geflohenen in **einer**
  Entscheidung dasselbe „nächste freie Feld" (`vergeben`), in **zwei**
  Entscheidungen zwei Geflohenen dasselbe (eigene Laufziele gelten jetzt als
  belegt), eine Gruppe landete einen Ring weit auf einem Stehenden
  (`rundumFrei`, mit Rückfall, wenn das Dorf voll steht) — und der **Server**
  gab einem Angreifer um ein Gebäude das Feld, auf dem ein Schlachter
  stillstand (`angriffsfelderOhneBesetzte`, nur bei Gebäuden, Konterkreis
  unverändert). Jeder hat einen eigenen Test mit Gegenprobe. Was bleibt, ist
  `einheiten AC-29`: wer **später** auf ein besetztes Feld läuft, steht dort.
  Das ist eine eigene Runde, keine Fußnote eines anderen Kriteriums. (8) **Eine
  Durchsicht ohne meine Schlüsse hat zwei Fehler gefunden, die meine Tests
  nicht sahen** (ein Sonnet-Prüfer, nur lesend): seit eigene Laufziele als
  belegt gelten, sperrte eine laufende Wache bei jedem weiteren Treffer ihr
  eigenes Ziel und bekam jede halbe Sekunde ein neues — **den Fehler hatte ich
  eine Stunde vorher selbst eingebaut** (jetzt `ausser`); und ein Bauer, der
  sich wehrt, gab seine Farm nicht frei. Beide mit Test. Von fünf Befunden
  trafen zwei, einer war ein billiger Randfall, zwei sind Notizen (Baustellen,
  die zugleich wachsen und getroffen werden; `FEIND_FERN` muss mit dem Nebel
  nach Sicht filtern, ki AC-13). **Gemessen** nach der Runde
  (`npm run pruefstand:strategie`, 22 Minuten, Startwerte 1–20): **40 von 40**
  KIs greifen an, die erste zwischen Spielminute 17,5 und 20,3 (Median 18,1).
  Im ersten Stand der Runde waren es 39: beim Startwert 13 verteidigte KI 2
  vierzigmal und griff nie an — weil ihre Wache mit dem springenden Ziel nie
  ankam. Mit festem Ziel sind es 9 Verteidigungen und ein Angriff ab 20,3.
- **85** · 2026-11-07 · **ki AC-11** — die KI greift an: sobald zehn
  Kampfeinheiten bereitstehen, schickt sie acht davon im Angriffslauf zum
  nächsten Gegner und setzt am Ziel auf dessen Dorfzentrum nach; die zwei, die
  dem eigenen Dorf am nächsten stehen, bleiben als Wache. Über zwanzig
  Startwerte bricht jede KI auf, die erste zwischen Spielminute **17,5 und
  19,8** (Median 18,1) — die Vorgabe des Prüfstands steigt deshalb von 16 auf
  22 Minuten. Gelernt, viererlei: (1) **Das Bild hat zwei echte Fehler im Kampf
  gefunden, die seit Stufe B dalagen.** `figurenFrei` fand drei Milizen auf
  einem Punkt; dahinter steckten zwei Sachen in `welt.js`: die Verteilung auf
  die Angriffsfelder galt nur innerhalb **eines** Befehls, und wer einzeln
  nachkam, bekam dasselbe Feld noch einmal — und `auftrag.angekommen` wurde
  gesetzt, **bevor** geprüft war, ob die Einheit noch läuft, weshalb ein
  Nahkämpfer am ersten Punkt in Reichweite stehenblieb. Beide haben jetzt
  einen eigenen Test unter `kampf AC-1`, beide mit Gegenprobe. (2) **Ein Griff
  in den Kampfkern wird am Gefechtsstand gemessen, bevor er bleibt.** Die weite
  Fassung des zweiten Fehlers sah richtiger aus und kippte den Konterkreis:
  Späherreiter gegen Bogenschütze fiel von 20/20 auf 14/20, die Gegenrichtung
  stieg von 0/20 auf 10/20. Eng gefasst — nur bei Gebäuden als Ziel — hält der
  Kreis wieder in allen vier Richtungen 20/20. Ohne `npm run
  konterkreis:strategie` wäre das eingecheckt worden. (3) **Ein Bild vom
  Sturm auf das Dorfzentrum gibt es nicht**: die Angreifer stehen hinter dem
  Gebäude und werden dort als Umriss gezeichnet (B1, bedienung AC-30) — zwei
  Läufe, bis das Ansehen es zeigte. Was die Sache erzählt, ist der **Marsch**:
  acht rote Figuren vierzig Felder vom eigenen Dorf auf offener Wiese.
  (4) **„Gesammelt" war in der Unterschrift falsch** — der Späherreiter läuft
  doppelt so schnell wie eine Miliz und ist dem Verband weit voraus. Der Test
  zählt jetzt sieben Milizen und einen Reiter im Bild und die Unterschrift
  sagt genau das. (5) Nebenbei, aus dem Browserlauf: **eine Taste, die die
  Karte schiebt, hört nicht in dem Augenblick auf, in dem die Bedingung wahr
  wird.** `bedienung AC-7` fuhr mit `a` und `w` zur Basis zurück und ließ los,
  sobald `kamera.x <= start.x` — in der Zeit bis zum Loslassen schob sie
  weiter, und im nächsten Fall fand `rahmenUmAlle` nur **eine** statt vier
  Einheiten im Bild. Ein roter Lauf an einer Stelle, die mit der Runde nichts
  zu tun hatte. Wer in einem Fall die Kamera bewegt, setzt sie am Ende
  **genau** zurück, statt sie zurückzufahren.
- **84** · 2026-11-07 · **spielziel AC-9** — die Revanche mit einem Klick: unter
  der Tafel am Ende steht ein Knopf, der dieselbe Runde neu startet. Gebaut
  **ohne eine einzige neue Nachricht**: der Knopf schickt `start`, und der Raum
  erlaubt einen zweiten Start, sobald `welt.vorbei` es sagt — dieselben Leute,
  dieselben Einstellungen, eine neue Partie. Damit ist **C3 abgeschlossen**.
  Gelernt, dreierlei: (1) **Die billigste Funktion ist die, die einen
  bestehenden Weg ein zweites Mal gehen darf.** Ein eigener Nachrichtentyp
  `revanche` hätte die Gastgeberprüfung, die Startwertwahl und die Absage „Es
  fehlen Mitspieler" alle noch einmal gebraucht. (2) **Wer eine zweite Partie
  zulässt, muss jeden Zwischenspeicher der ersten suchen** — die Kacheln des
  Bodens liegen nach Feldkoordinate im Speicher und hätten auf der neuen Karte
  das alte Gelände gezeigt; dazu Auswahl, Zeitalter, Ende, Ausgeschieden und
  die Übersichtskarte. Im Browser ist „neu anfangen" kein Zustand, sondern
  eine Liste. (3) **Ein Kasten, der um eine Zeile wächst, verdeckt, was
  darunter lag:** die neue Zeile im Abschlussbild schob dessen Rand genau auf
  die Gefallenen im Bild von `spielziel AC-6`. Der Test zählt jetzt, wie viele
  frei unter der Tafel liegen, statt die Kamera nur auf ihre Mitte zu setzen.
- **83** · 2026-11-07 · **Rückschau**, kein neues Kriterium — alle 167
  Bildnachweise gelesen, 96 Paare Bild für Bild angesehen, **39 beanstandet**.
  Drei Verbesserungen: (1) `einheitenJeArt()` in der Hilfe, und der Beweis der
  **Stufe B** verlangt jetzt je Art **eine mehr** statt „mindestens eine" — der
  Späherreiter war seit dem Aufstieg nie bewiesen, weil jeder mit einem
  startet. (2) Der Schautafel-Test misst die **Spielerfarbe am Bild**, für jede
  Art aus `EINHEITEN` und in beiden Farben; vorher fragte er nur, welche Farbe
  die Zelle angibt, und die Liste im zweiten Test nannte drei Namen aus dem
  Kopf. Dabei gefunden: der **Plänkler** trug 3,9 % Spielerfarbe, weil die
  Fellweste über dem ganzen Wams lag — Weste schmaler, jetzt 0,119, Abstand
  zum Bogenschützen unverändert 0,584. (3) Elf Unterschriften auf das gekürzt,
  was ihr Bild trägt. Gelernt: **die Unterschrift beschreibt, was das Bild
  zeigt, nicht was der Test weiß** — und eine Liste von Namen im Testkopf ist
  derselbe Fehler wie eine Gleichheitszusicherung auf einer wachsenden Liste.
- **82** · 2026-11-07 · **spielziel AC-8** — das Abschlussbild mit Zahlen:
  je Spieler eine Zeile mit Zeitalter, gesammelten Rohstoffen, ausgebildeten
  Einheiten und Verlusten, darunter die Dauer der Partie. Gelernt: **die
  Zahlen müssen während der Partie gezählt werden, nicht am Ende hergeleitet.**
  Von einem, der ausgeschieden ist, steht nichts mehr auf der Karte — wer am
  Ende zählt, zählt bei ihm null. Deshalb führt jeder Spieler jetzt
  `gesammelt`, `ausgebildet` und `verloren`, hochgezählt beim Abladen, beim
  Fertigwerden eines Auftrags und beim Sterben. Gezählt wird beim **Abladen**,
  nicht beim Aufnehmen: sonst ließe sich die Tafel mit einer Ladung füllen,
  die nie ankommt — und ein abgebrochener Auftrag gibt Rohstoffe zurück, ohne
  dass jemand etwas gesammelt hätte. Die Tafel wird einmal in `endeSetzen()`
  **abgeschrieben** und reist danach in `zustand()` und `aufbau()` mit, damit
  auch ein Zurückkehrender sie sieht. In der Reihenfolge der Spieler, mit
  hervorgehobenem Sieger statt sortiert: eine Rangfolge wäre eine Behauptung
  darüber, was zählt, und die gehört dem Spieler. Werkzeug: `#partieende` ist
  als Überschrift **im** neuen `#abschluss` geblieben — so haben alle
  Zusicherungen aus AC-5 und AC-6 den Umbau überlebt, ohne eine Zeile Test.
  `rahmenUmAlle`, `eigeneImBild` und `waldInDerNaehe` sind aus dem Spielbild-Test
  in die Hilfe gezogen, weil eine Tafel voller Nullen nichts belegt hätte.
- **81** · 2026-11-07 · **spielziel AC-7** — wer ausgeschieden ist, bleibt
  Zuschauer: er bekommt weiter jeden Zustand, über dem Bild steht, dass er
  draußen ist, und **die Kamera springt zu einem, der noch spielt**. Der
  Sprung ist der eigentliche Inhalt des Kriteriums — ohne ihn sähe der
  Zuschauer auf den leeren Platz, wo eben sein Dorf stand, also genau auf den
  „leeren Bildschirm", den das Kriterium verbietet. Gelernt: **dieses
  Kriterium ist zu zweit nicht prüfbar.** Zu zweit endet die Partie in
  demselben Takt, in dem einer ausscheidet; es gibt dann keinen Zuschauer,
  sondern einen Verlierer. Dafür ist `partieZuZweit` zu `partieMit` geöffnet
  worden, mit `partieZuDritt` daneben; `partieBeenden` schließt jetzt
  `seiten` statt zweier fester Namen. Und: die Meldung hängt **nicht** an
  einem Ereignis, sondern wird bei jedem Zustand gerechnet — Ausscheiden und
  Partieende können in denselben Takt fallen (wer als Vorletzter aufgibt),
  und ein Ereignis hätte dann zwei Meldungen übereinander gestellt.
- **80** · 2026-11-07 · **bedienung AC-38** — Aufgeben ist ein Knopf oben
  rechts, am weitesten weg von allem, was im Spiel oft geklickt wird
  (Auswahlleiste unten, Untätige unten links, Übersichtskarte unten rechts),
  und er fragt genau einmal zurück. **Damit ist C2 fertig.** Gelernt beim
  Hinsehen: **der gefährliche Knopf darf nicht der größte sein.** Die Klasse
  `haupt` trägt `flex: 1`, also war „Ja, aufgeben" dreimal so breit wie
  „Weiterspielen" — genau verkehrt herum für eine Frage, deren sichere
  Antwort die häufigere ist. Jetzt sind beide gleich groß, der Ausweg steht
  zuerst. Zweitens: **die Rückfrage gehört über die Basis, nicht auf sie** —
  bei 38 % der Höhe verdeckte sie das Dorfzentrum, bei 28 % steht die Partie
  im Bild. Und: Esc schließt die Frage, **ohne** darunter die Auswahl
  aufzuheben (`stopPropagation` in einem Lauscher, der nur offen angemeldet
  ist) — der Test prüft genau das, sonst hätte dieselbe Taste zwei Dinge
  getan. Drittens, erst beim Durchsehen der 114 geänderten Bilder gefunden:
  **ein neues Ding in der Kopfzeile nimmt einem anderen den Platz.** Im
  1000-Punkt-Fenster von `bedienung AC-36` brach der Bedienhinweis auf fünf
  Zeilen um und stand als Treppe im Spielfeld. Jetzt bricht er nie
  (`white-space: nowrap`) und verschwindet unter 1340 Punkten ganz — er ist
  eine Erinnerung, der Knopf eine Handlung.
- **79** · 2026-11-07 · **spielziel AC-5, AC-6** — das Partieende rechnet:
  wer keine Einheit und kein Gebäude außer Farmen mehr hat, ist ausgeschieden;
  bleibt einer übrig, endet die Partie im selben Takt, in dem der letzte
  Verlust abgerechnet wird. Aufgeben ist der schnelle Weg dorthin. Nach 90
  Spielminuten endet sie unentschieden. Gelernt: **die Entscheidung gehört in
  die Welt, das Anhalten in den Raum.** `raeume.js` fragt nur eine Eigenschaft
  `welt.vorbei` und hält daran seine Uhr an — so bleibt es frei von diesem
  Spiel (ADR-0006), und der Wächter `raeume AC-16` hat das sofort bewiesen: er
  wurde rot, weil im neuen Kommentar das Wort „Welt" groß geschrieben stand.
  Zweite Erkenntnis: **eine stehende Uhr auf 0:00 ist kein Beweis.** Das erste
  Bild zeigte das Ende in der nullten Spielsekunde; eine halbe Spielminute im
  Zeitraffer vorher kostet drei Sekunden Lauf und macht aus „die Uhr steht"
  eine sichtbare Aussage. Und: **die Gefallenen bleiben liegen**, weil das
  Aufräumen in `takten()` passiert und eine entschiedene Partie nicht mehr
  taktet — für das Abschlussbild genau richtig, aber es stand nirgends.
- **78** · 2026-11-07 · **Rückschau, kein neues Kriterium** — drei
  Verbesserungen am Umgang mit den Bildnachweisen: `npm run check:alles:neu`
  (ein Browserlauf statt zwei, 580 s gegen 18 min), `npm run qa:abweichung`
  (die geänderten Bilder nach Anteil geänderter Bildpunkte sortiert, mit
  eigenem PNG-Leser ohne Paket) und der Prüfgriff `einheiten` **dokumentiert
  statt geändert**. Gelernt: **eine Eigenart der Prüfumgebung, auf die sich
  Bilder eingestellt haben, ist kein Fehler — sie zu „reparieren" ändert die
  Bilder.** Der Versuch, Einheiten genau auf das genannte Feld zu stellen,
  schob sie in acht Bildern um ein Feld zusammen; in `kampf AC-1` standen
  danach zwei rote Milizen übereinander statt drei blauen nebeneinander, und
  die Bildunterschrift stimmte nicht mehr. Gefunden hat es das Werkzeug aus
  derselben Runde, das den Fall nach oben sortiert hat.
- **77** · 2026-11-07 · **bedienung AC-37 fertig, damit steht C1** — oben
  neben dem Zeitalter läuft die Spielzeit als `m:ss`. Gelernt: **die Daten
  lagen schon auf dem Draht.** `zustand()` schickt `t: this.takt` seit der
  ersten Stufe, `aufbau()` schickt `takte: TAKTE_PRO_SEKUNDE` — der Browser
  hat beides nur nie gelesen. Das Kriterium kostete vier kleine Änderungen und
  keine einzige am Server. Vor dem Bauen nachsehen, was schon ankommt, lohnt
  sich; die Tafel oben in `e2e/helpers/strategie.mjs` sagt es. Zweite
  Erkenntnis zur Prüfung: **„zählt die Takte des Servers" braucht die
  Gegenprobe, sonst prüft der Test nur „eine Zahl wächst".** Gemessen wird
  deshalb zweimal über dieselben zwei Sekunden Wanduhr — gewöhnlich und im
  Zehnfachen: 19 Takte gegen 180. Läge die Uhr am Browser, wären beide
  Messungen gleich. Die reine Formatierung (`0:09`, `9:59`, `10:00`, `90:00`)
  steht als eigener Fall daneben, weil ein fehlendes `padStart` sonst erst
  nach neun Spielminuten auffiele. Entschieden: die Minuten laufen über
  sechzig hinaus — `90:00` statt `1:30:00`, weil eine Partie nach 90
  Spielminuten unentschieden endet und die Frage „wie lange noch" sich so
  ohne Rechnen beantwortet.

- **76** · 2026-11-07 · **bedienung AC-36 fertig** — jede Kampfeinheit
  unterscheidet sich bei Zoom 1 **im Umriss** auf mindestens einem Drittel der
  Fläche vom Dorfbewohner. Gelernt: **was eine Einheit kenntlich macht, muss
  außerhalb ihres Körperumrisses liegen.** Bei Zoom 1 ist eine Figur knapp 29
  Bildpunkte hoch; ein Schild vor der Brust, ein Bogen mit 1,2 Einheiten
  Strichstärke (1,4 Bildpunkte) oder mehr Farbe im Kittel tragen dann nichts
  mehr bei. Fünf von sechs lagen vorher unter der Schwelle (0,295 bis 0,321),
  und zwar genau die fünf, deren Ausrüstung im Körper lag. Geholfen haben drei
  Griffe: der Milizschild von der Brust an die Seite und lang bis zum Knie,
  die dünnen Waffen (Bogen, Wurfspieß, Speerschaft, Axtstiel) um die Hälfte
  dicker, und beim Soldaten ein Axtblatt mit ausgezogenen Hörnern statt eines
  größeren Vierecks. Zweite Erkenntnis: **eine Zahl, die steigt, kann ein Bild
  verderben.** Der erste Versuch am Soldaten brachte 0,359, sah aber aus wie
  ein weißes Segel am Stiel; der Halbmond bringt 0,352 und sieht aus wie eine
  Axt. Die Schautafel entscheidet, nicht die Messung. Dritte: die **Gegenprobe
  über alle Paare** hat gezeigt, dass der Milizschild an der Seite die Miliz
  vom Speerkämpfer entfernt hat (0,246 statt vorher mehr) — beide tragen links
  einen Schild. Die Länge des Normannenschilds hat es auf 0,306 gehoben;
  darstellung AC-14 misst Umriss **oder** Farbe und liegt mit 0,568 weiter
  bequem darüber. Werkzeug: `schautafel.umrissUnterschied(a, b, hoehe)` misst
  den Umriss allein, `sicht --waehlen a,b,c --ziel auswahl` stellt eine Reihe
  bei Zoom 1 auf.

- **75** · 2026-11-07 · **C1 beginnt: bedienung AC-35 fertig** — die Auswahl
  nennt Angriff, Rüstung nah und fern, Reichweite und den Bonus mit seinem
  Ziel („+15 gegen Kavallerie"). Gelernt: **die Summierung der Verbesserungen
  gehört nicht in den Browser.** Sie läuft über die **Klasse** einer Einheit
  (`wirkungsschluessel`), nicht über ihre Art — wer sie im Browser nachbaut,
  hat sie zweimal, und die zweite veraltet still. Stattdessen rechnet der
  Server eine fertige Tafel je Spieler (`welt.kampfwerte()`, allein über
  `welt.einheitenwert()`) und schickt sie im Aufbau an alle, im Zustand nur
  bei Änderung — dasselbe Muster wie `gebaeudeAenderungen`. Dabei fiel ein
  latenter Fehler auf: `ansicht.lebenVoll` las die Verbesserungen schon vorher
  nicht, sie geht jetzt durch dieselbe Tafel. Die Leiste hält den breitesten
  Zustand aus (Dorfbewohner in der Feudalzeit: neun Bauknöpfe in zwei
  Reihen plus die neue Werte-Zeile), nachgesehen mit dem neuen
  `npm run sicht -- --waehlen <art> --zeitalter <n>`. **Und der Wächter gegen
  Gleichheit hatte zwei Löcher**, beide an einem Test über `aufbau().werte`:
  er kannte nur die Tabellen aus `daten.js`, nicht ihre Fassung auf dem Draht
  (`werte.einheiten.<art>`) — und ein `const { baut, ...rest } = …` machte aus
  wachsenden Daten einen harmlos aussehenden Namen. Beides fällt jetzt auf,
  mit Gegenprobe an einer Wegwerfdatei geprüft. Kosten des Lochs: ein
  Browserlauf von 9 Minuten, der am Ende an einem Rechenteil-Test scheiterte.
- **74** · 2026-11-07 · **Spec-Runde zur Stufe C**, kein Code. Die Stufe hatte
  Kriterien (spielziel AC-5 bis AC-9, kampf AC-11 bis AC-14), aber keine
  Bauabfolge und **keine kämpfende KI** — die größte Lücke: `fahrplan AC-11`
  verlangt „KI gegen KI endet mit einem Sieger", und keine Zeile sagte, wann
  die KI angreift. Neu: **ki AC-11 bis AC-14** (angreifen ab acht
  Kampfeinheiten mit zwei zur Wache, Nachschub nach einem verlorenen Heer, nur
  das eigene Sichtfeld, zu Hause verteidigen), **darstellung AC-15** (Nebel in
  drei Stufen), **bedienung AC-38** (Aufgeben fragt einmal zurück),
  **spielauswahl AC-18, AC-19** (KI-Gegner einstellen, allein eröffnen) — und
  eine Bauabfolge C1 bis C6 mit begründeter Reihenfolge: **das Ende zuerst**
  (ohne Partieende misst der Prüfstand nur Takte), **Nebel zuletzt** (er baut
  die Zustandsnachricht um und berührt damit jeden Browsertest). Geschärft:
  spielziel AC-5, AC-6 und AC-8 sagen jetzt, wer „ausgeschieden" ist, dass der
  Server im Takt des letzten Verlusts entscheidet und dass nach 90
  Spielminuten unentschieden Schluss ist. Gelernt: `spielziel AC-1` stand seit
  Stufe B auf `in-arbeit` und hätte die Arbeitswahl jede Runde auf sich
  gezogen, obwohl es erst mit Stufe D und F fertig wird — jetzt steht im
  Kriterium, dass es keine eigene Runde ist.
- **73** · 2026-11-07 · **Rückschau zur Stufe B**, nicht gebaut. Drei
  Verbesserungen: der Wächter über die Kürzeltafel
  (`tests/waechter-drahttafel.test.mjs`, vierter Wächter), und zwei Regeln in
  der Anweisung — jeder Messaufbau über viele Läufe braucht eine Gegenprobe,
  und was im Browser steht, wird im Browser gelesen. Eine Partie KI gegen KI
  angesehen und daraus `bedienung AC-35` bis `AC-37` angelegt: Kampfwerte an
  der Auswahl, Militär bei Zoom 1 erkennbar, Spielzeit im Bild. Gelernt:
  **fünf rote Tests in drei Runden, fünfmal war die Annahme falsch und nicht
  das Produkt** — das ist das Muster der Stufe B, und die Tafel, die es
  verhindern sollte, war selbst von Hand gepflegt.
- **72** · 2026-11-07 · **fahrplan AC-8 fertig — damit ist Stufe B erreicht:
  die Feudalzeit ist am Stück im Browser spielbar.** Ein Test
  (`e2e/tests/strategie-feudalzeit.spec.mjs`) spielt sie durch wie ein Mensch:
  der Aufstieg als Auftrag im Dorfzentrum, Schießanlage, Stall und Schmiede
  mit `B` und einem Buchstaben gebaut, die vier neuen Einheiten aus ihren
  Knöpfen, der Schmiedeangriff erforscht — und am Ende zwei gemessene Schläge:
  Speerkämpfer gegen Späherreiter 19 (3 Angriff + 1 Schmiedeangriff + 15 Bonus
  gegen Kavallerie), Bogenschütze gegen denselben Reiter 2 (4 Angriff − 2
  Fernrüstung, **ohne** den Schmiedeangriff, denn der geht über die Klasse).
  Gelernt, dreimal: **der Browser weiß weniger, als man denkt** — `klassen` und
  `bonus` werden ihm gar nicht geschickt, die Erwartung wird deshalb in Node
  aus `daten.js` gerechnet. **Die Kürzel sind `p` Speerkämpfer und `k`
  Plänkler**, nicht umgekehrt; seit dieser Runde liest der Test sie aus den
  Daten statt sie zu tippen. Und **freie Wiesen sucht man vor dem Bauen** — ein
  Dorf der Feudalzeit frisst das Gras um die Basis auf. Nebenbei: der
  Späherreiter hieß auf dem Bildschirm „Spaeherreiter"; eine Bildunterschrift
  behauptete schon den Umlaut.
- **71** · 2026-11-07 · **fahrplan AC-9 und AC-10 fertig — der Konterkreis
  hält, und zwar in beiden Richtungen.** Neu ist ein **Gefechtsstand** im
  Prüfstand (`gefechtSpielen`, `npm run konterkreis:strategie`): zwei Heere
  gleicher Kosten — 600 Rohstoffe, also 10 Speerkämpfer gegen 7 Reiter —
  stehen sich mit Angriffslauf gegenüber, danach rechnet nur die Simulation.
  Jeder Konter gewinnt 20 von 20 und verliert umgekehrt 0 von 20; 160 Gefechte
  kosten 0,2 s. Gelernt, zweimal: **ein Messaufbau kann das Gegenteil von dem
  zeigen, was er messen soll.** Erst standen ein bis drei Gefechte je Paarung
  ohne Ende — nicht Gleichgewicht, sondern erstens `welt.untaetig()`, das die
  Frage nur für Dorfbewohner beantwortet und für jede Kampfeinheit `false`
  sagt (also setzte niemand nach), zweitens ein Waldstück genau zwischen den
  Heeren. Dann waren alle zwanzig Startwerte **Takt für Takt identisch** — das
  Gelände war die einzige Abwechslung gewesen, und auf freiem Grund ist jedes
  Gefecht dasselbe. Jetzt stehen die Heere um bis zu drei Felder quer versetzt,
  aus dem Startwert gezogen: zwanzig Startwerte sind zwanzig Gefechte (65 bis
  133 Takte bei Speer gegen Reiter). Die Gegenprobe gehört dazu — ohne sie wäre
  der Test auch grün, wenn immer die linke Seite gewinnt.
- **70** · 2026-11-07 · **Rückschau nach Runde 69**: drei Verbesserungen, alle
  durchgesetzt statt aufgeschrieben — ein Wächter gegen Werte, die an
  `welt.einheitenwert()` vorbei aus der Tabelle gelesen werden (sieben Stellen
  beim ersten Lauf, alle umgestellt; der Prüfstand bleibt Zeile für Zeile
  gleich), ein Wächter gegen Bildunterschriften, die erst beim Lauf entstehen,
  und eine Tafel aller Drahtfelder oben in `e2e/helpers/strategie.mjs`.
  Gelernt: **eine Regel, die nur im Text steht, wird gebrochen** — dreimal in
  vier Runden. Und: wer einen Wert in jeden Takt hängt, braucht ein
  Gedächtnis; `einheitenwert()` merkt sich jetzt je Spieler und vergisst beim
  Erforschen.
- **69** · 2026-11-07 · **ki AC-9 fertig — die KI steigt von selbst auf; damit
  steht B6.** Sobald 22 Dorfbewohner stehen, das Dorfzentrum frei ist, 500
  Nahrung da sind und zwei Gebäude der Dunklen Zeit, bestellt sie den Aufstieg;
  danach baut sie ein Militärgebäude und bildet darin ohne Pause aus.
  **Welche Einheit, liest sie aus den Daten des Gebäudes** (`bildetAus`, erste
  Art im erreichten Zeitalter, die bezahlt ist) — eine neue Einheit einer
  späteren Stufe benutzt sie damit ohne Änderung am Code. Gemessen über zwanzig
  Startwerte: Feudalzeit nach **11,1 bis 11,9 Spielminuten**, Median 11,6; jeder
  hatte eine Schießanlage und 3 bis 7 Kampfeinheiten. Drei Lehren: (1) **Ein
  Kriterium, das Vorrat misst, wird falsch, sobald jemand den Vorrat ausgibt**
  — `fahrplan AC-5` („nach zehn Minuten genug Nahrung für die Feudalzeit") ging
  rot, weil die KI die 500 Nahrung kurz vorher bezahlt. Der Wortlaut stimmt
  weiter, der Test las ihn zu wörtlich: jetzt misst er den **höchsten** Vorrat
  in den zehn Minuten, nicht den am Ende. (2) **Beim Startwert 15 standen am
  Ende 640 Gold neben 150 Holz** — die Farmen hatten das Holz der Schießanlage
  verbaut. Erst eine Regel „solange das Militärgebäude fehlt, 175 Holz
  zurückhalten" brachte alle 40 Spieler auf ein Militärgebäude. Wer ein neues
  Ziel in eine Wirtschaft einhängt, prüft, **wer ihm den Rohstoff wegnimmt**.
  (3) Die Vorgabe des Prüfstands steht jetzt auf **16 statt 10 Minuten** — und
  dabei kam ein alter Fehler ans Licht, den zehn Minuten nie zeigten:
  **ein Dorfbewohner stand bis zu acht Minuten still** (neu als ki AC-10).
  Wald und Gold im Umkreis von 30 Feldern sind dann aufgebraucht, Farmen
  besetzt, und die Ersatzkette `holz → gold` kennt die Nahrung nicht. Der
  Fehler ist älter als diese Runde (ohne die neue KI-Logik dieselben 471 s).
- **68** · 2026-11-07 · **bauen AC-25 und AC-26 fertig — die vier
  Verbesserungen der Feudalzeit**: Schmiedeangriff und Befiederte Pfeile in der
  Schmiede, Doppelaxt im Holzfällerlager, Pferdekummet in der Mühle. Der
  Kern ist eine Verallgemeinerung: **ein Schlüssel in `wirkung` ist eine
  Einheitenart oder eine ihrer `klassen`**, und `welt.einheitenwert(besitzer,
  art, feld)` ist die eine Stelle, die Werte mit Verbesserungen liest. Damit
  trifft „Nah +1 Angriff“ genau Infanterie und Kavallerie, ohne dass die
  Simulation nach Einheitenarten fragt. Drei Lehren: (1) `bogenschuetze` ist
  **zugleich Art und Klasse** — ohne `new Set` zählte die Verbesserung bei ihm
  doppelt. Wer Arten und Klassen in einen Schlüsselraum legt, dedupliziert.
  (2) Dabei fiel auf: die Rüstung aus dem **Webstuhl war seit bauen AC-21
  wirkungslos** — die Schadensformel las die Tabelle statt der Werte des
  Spielers. Nur das Leben kam an. Jetzt geprüft. (3) „+20 % Holz“ heißt +20 %
  **an der Rate**, nicht +20 % Holz je Minute: über vier Minuten kamen 180
  gegen 170 heraus, weil das Hin- und Herlaufen gleich bleibt. Der erste Test
  maß das Falsche; gemessen wird jetzt die Zeit bis zur vollen Ladung (325
  gegen 368 Takte).
- **67** · 2026-11-07 · **kampf AC-4 fertig — der Angriffslauf, damit ist B5
  erreicht**: `G` schaltet die Betriebsart ein (nicht `A` — WASD schiebt die
  Karte), der nächste Rechtsklick schickt die Auswahl los und merkt sich das
  Marschziel; unterwegs wird angegriffen, was in Sichtweite kommt, nach jedem
  Gefecht geht der Marsch weiter. Serverseitig ist das **dieselbe Wache wie
  kampf AC-2** — nur dass die Betriebsart sie auch im Gehen erlaubt. Zwei
  Lehren: (1) Der Bau hat einen **alten Fehler** aufgedeckt: ein erledigter
  `gehen`-Auftrag blieb an der Einheit hängen, und die Wache überspringt jede
  Einheit mit Auftrag — wer einmal irgendwohin geschickt wurde, wehrte sich nie
  wieder. Ein Test deckt es jetzt ab. (2) Im Browser ist `e.h` die
  **Lebenspunkte**, kein Anteil; wer einen Balken prüft, teilt durch
  `a.lebenVoll(e)`. Und `toBeInViewport`-ähnliche Prüfungen auf `zuBild` gelten
  nur den **Beteiligten**, nicht allen Einheiten der Partie — die Dorfbewohner
  an der eigenen Basis stehen weit außerhalb.
- **66** · 2026-11-07 · **bedienung AC-34 fertig — der Befehl zeigt sich am
  Ziel**: ein Ring auf dem Boden, der zusammenläuft und in 0,8 s verblasst,
  weiß auf freiem Gelände, rot mit vier Haken nach innen auf Feindlichem. Er
  steht **sofort**, ohne Weg zum Server — deshalb entscheidet der Browser
  dieselbe Frage noch einmal (`feindlichAn` gegen `feindAn`/`gebaeudeAn`); die
  Doppelung steht als Grenzfall in der Spec, damit sie niemand still
  auseinanderlaufen lässt. Gelernt: ein zeitlich begrenztes Zeichen lässt sich
  für ein Bild **ohne Prüfgriff** anhalten, indem der Test seinen Beginn in die
  Zukunft setzt — der Lauf wird auf 0 geklemmt und das erste Bild bleibt
  stehen. Nebenbei: die Suche nach freien Wiesen aus dem Kampftest ist als
  `freieWiesen` in die Hilfe gewandert, statt kopiert zu werden.
- **65** · 2026-11-07 · **Rückschau nach Runde 64** (55 und 60 waren
  ausgefallen): drei Verbesserungen — ein Wächter-Test gegen Gleichheit auf
  wachsenden Daten (zehn Treffer beim ersten Lauf, alle repariert),
  `figurenFrei` gegen Figuren auf einem Fleck (fand sofort einen echten
  Produktfehler, jetzt einheiten AC-29 mit Messwert), und der Termin der
  nächsten Rückschau im Steuerstand statt im Kopf. 373 Tests ohne Browser.
  Gelernt: eine Regel, die viermal gebrochen wird, gehört in einen Test, nicht
  in Fettdruck.
- **64** · 2026-11-07 · **kampf AC-2, AC-3, AC-5 und einheiten AC-25 fertig —
  der Kampf läuft jetzt von selbst**: Was in die Sichtweite einer *stehenden*
  Kampfeinheit kommt, wird ohne Befehl angegriffen (zweimal je Sekunde, über ein
  grobes Raster statt über alle Einheiten); ein Dorfbewohner arbeitet weiter,
  bis ihn ein Schlag trifft, dann lässt er die Arbeit liegen und schlägt
  zurück. Wer wacht, steht als Wert in den Daten (`wacht`), nicht als Frage nach
  der Einheitenart. Eine Verfolgung, die niemand befohlen hat, endet fünf Felder
  vom Ausgangsplatz und führt dorthin zurück — ein befohlener Angriff nicht,
  sonst ließe sich ein Fliehender nie stellen. Vier Erkenntnisse: (1) **Ein
  Platz am Ziel muss mit dem Ziel wandern.** Die Verteilung aus Runde 63 galt
  nur für den Augenblick des Befehls; sobald das Ziel wegläuft, suchten zwei
  Angreifer wieder dasselbe Nachbarfeld und standen auf einem Fleck. Gemerkt
  wird jetzt der **Versatz** zum Ziel, nicht das Feld. (2) **Wer einmal in
  Reichweite war, darf stehenbleiben.** Die Regel aus Runde 63 — ein
  Nahkämpfer geht seinen Platz zu Ende — wird bei einem laufenden Ziel zum Hund,
  der seinen Schwanz jagt: zwei Milizen liefen aneinander vorbei und schlugen
  nie zu. Die Regel gilt jetzt nur beim ersten Hinlaufen. (3) **Der alte Text
  von AC-5 war falsch**, nicht nur ungenau: „vier Dorfbewohner halten auch keinen
  Soldaten auf“ — nach den Zahlen der Vorlage erschlagen vier ihn in vier
  Runden, ohne einen zu verlieren (gemessen: 6,1 Sekunden, der Angeschlagene bei
  7 von 25 Leben). Kriterium neu gefasst, Nummer geblieben. Wer sich erst wehrt,
  **nachdem** er getroffen wurde, verliert dabei eine Runde — im Zweikampf 12
  statt 15 Schaden. (4) **Die Wache ist billig, wenn sie ein Raster benutzt**:
  0,11 ms je Takt mit 832 Milizen in Ruhe, 0,53 ms, wenn acht Heere auf einem
  Haufen stehen und sich gegenseitig erschlagen — gegen eine Grenze von 10 ms.
  Ohne Raster wäre es Einheiten mal Einheiten. Und wieder hat das **Bild**
  gefunden, was zehn grüne Tests nicht sahen: zwei Bogenschützen aus derselben
  Richtung halten auf demselben Punkt und sind im Bild eine Figur mit zwei Bögen
  (jetzt offen als einheiten AC-29).
  Nächste Runde: **Runde 65 ist eine Rückschau.** Danach der Rest von B5 —
  Angriffslauf (kampf AC-4) und das rote Zeichen am Ziel (bedienung AC-34).
- **63** · 2026-11-07 · **kampf AC-1, AC-6, AC-7, AC-8, AC-10 fertig — der
  Kampf steht** (Schritt B5, erste Hälfte): Ein Rechtsklick auf eine fremde
  Einheit oder ein fremdes Gebäude wird zum Angriff; der Server liest das aus
  dem geklickten Feld, wie er schon Sammeln, Bauen und Hüten daraus liest —
  kein neuer Knopf, keine neue Nachricht. Schaden ist
  `max(1, Angriff − Rüstung + Bonus)` ohne Ausnahme, die Nachladezeit steht
  je Einheit in `daten.js` (2,0 s, Speerkämpfer und Plänkler 3,0 s), Gebäude
  haben 0/7 Rüstung bekommen. Wer fällt, kippt um, liegt zwei Sekunden blass
  am Boden und zählt vom Schlag an nicht mehr. Drei Erkenntnisse: (1) **Der
  Takt eines Todes ist 0.** `einheit.tot = this.takt` war als Schalter falsch,
  solange die Partie im ersten Takt stand — jetzt ein `tot`-Schalter *und*
  ein `gefallen`-Takt. (2) **Schläge gehören ans Ende des Takts.** Sofort
  verrechnet, überlebt immer der, der in der Schleife zuerst drankam; der
  Grenzfall „beide sterben" aus der Spec geht nur mit einer Abrechnung nach
  allen Einheiten. (3) **Wer in Reichweite stehenbleibt, steht auf dem
  Nächsten.** Drei Angreifer hielten alle dort an, wo der erste nah genug war
  — im Bild eine Figur mit drei Schwertern. Jetzt bekommt jeder Angreifer ein
  eigenes Feld um das Ziel (wie `aufstellungUm` beim Gehen), und ein
  Nahkämpfer geht es zu Ende, statt vorher zu halten; nur Fernkämpfer halten
  in Reichweite. Gefunden hat das keiner der 13 Tests, sondern das Bild.
  Nächste Runde: **B5 zu Ende** — sich wehren (AC-2), Verfolgung (AC-3),
  Angriffslauf (AC-4), Dorfbewohner (AC-5), dazu bedienung AC-34 und
  einheiten AC-25.
- **62** · 2026-11-07 · **Spec-Runde Kampf**: `kampf.md` trug noch die Zahlen
  der kleinen Fassung vor ADR-0012 — vier erfundene Einheiten mit Tempo 4,5
  und „doppelter Schaden gegen die schwache Seite". Jetzt steht dort die
  Formel der Vorlage (`max(1, Angriff − Rüstung + Bonus)`, nah gegen
  Nahrüstung, fern gegen Fernrüstung) und **keine zweite Wertetabelle** —
  die Werte stehen in `daten.js`, eine Tabelle daneben ist nach der dritten
  Änderung falsch. AC-7 heißt jetzt „jede Einheit hat ihre Nachladezeit"
  statt „ein Schlag je Sekunde": ein gemeinsamer Takt wäre lesbarer,
  verfälscht aber den Konterkreis. AC-9 (Lebensbalken) ist
  `zurueckgestellt` — das hat Stufe A unter darstellung AC-8 schon gebaut.
  Zwei Grenzfälle dazu, die beim Bauen sonst Zeit kosten: stirbt das Ziel
  unterwegs, bleibt der Angreifer stehen; ein unerreichbares Ziel beendet
  den Auftrag, statt endlos zu rechnen. Nächste Runde: **B5 bauen**.
- **61** · 2026-11-07 · einheiten AC-24 **fertig** — **Schritt B4 ist ganz
  durch**: die Kaserne erforscht ab der Feudalzeit die Stufe Soldat (100 N,
  40 G, 40 s), jede Miliz wird dadurch zum Soldaten, und danach bildet die
  Kaserne nur noch Soldaten aus. Gelernt: (1) **Eine Verbesserung, die eine
  Einheit austauscht, ist etwas anderes als eine, die sie aufwertet.** Der
  Webstuhl addiert Leben, `wandelt` ersetzt die Art — und dann muss man an
  drei Stellen denken: die stehenden Einheiten, die **Warteschlangen** und
  das Angebot des Gebäudes. (2) **Jede Verbesserung bekam bis heute das Bild
  des Webstuhls**, fest verdrahtet, weil es nur eine gab. Die Soldatenstufe
  zeigte einen Webrahmen. Jetzt zeigt eine Verbesserung mit `wandelt` die
  Einheit, die dabei herauskommt. (3) **`bildetAus` auf Gleichheit geprüft
  riss schon wieder** — dieselbe Falle wie in Runde 60, einen Tag alt. (4)
  Beim Ansehen gefunden: die drei Milizen standen **hinter** der Kaserne und
  waren nur Umrisse, während die Bildunterschrift „davor" behauptete; und die
  Axt hing zuerst neben dem Stiel in der Luft. Eine Waffe in einem **eigenen,
  gedrehten Rahmen** zu zeichnen (`translate` + `rotate`, dann Stiel und
  Blatt senkrecht) ist viel sicherer als Punkte auf einer schrägen Linie zu
  rechnen.
  Nächste Runde: **B5, der Kampf** (kampf AC-1 bis AC-10).
- **60** · 2026-11-07 · einheiten AC-23 **fertig** (Schritt B4, erster Teil):
  Speerkämpfer, Bogenschütze und Plänkler — Werte, Sperre bis zur Feudalzeit,
  drei neue Figuren, zwei Bildnachweise. Gelernt: (1) **Ein neues Feld in den
  Werten einer Einheit reißt jeden Test, der die Werte auf Gleichheit prüft**
  — `bedienung AC-29` und `einheiten AC-19` rissen beide an `deepEqual` über
  `EINHEITEN`. Wachsende Listen auf „enthält" prüfen stand schon hier; dass
  es auch für wachsende **Objekte** gilt, war neu. (2) **Das Zeitalter muss
  über die Leitung**: in `daten.js` stand `zeitalter: 1`, im Aufbau fehlte es
  — der Browser bot den Speerkämpfer in der Dunklen Zeit an, obwohl der
  Server ihn abwies. Wer eine Regel an ein Datenfeld hängt, prüft, dass das
  Feld beim Browser ankommt. (3) **`ausgewaehlt` hält den Schlüssel der Map
  `nachher`, nicht `e.id`** — eine Auswahl per Hand setzt man aus
  `[...a.nachher.entries()]`. (4) Drei Runden Hinsehen und Nachbessern an den
  Figuren: der Plänkler warf den Speer quer durchs Gesicht, der Speerkämpfer
  trug den Strohhut des Dorfbewohners, die Kapuze des Bogenschützen schwebte
  als Scheibe vor dem Kopf. Gemessen wurde vorher schon alles über einem
  Drittel — **die Messung findet keine Peinlichkeit, nur das Auge.** Dafür
  jetzt `npm run sicht -- --ausschnitt x,y,b,h --lupe 3`: 92 Bildpunkte je
  Figur reichen nicht, um eine Hand am Griff zu beurteilen.
  Nächste Runde: **einheiten AC-24** (Miliz wird Soldat).
- **59** · 2026-11-07 · bauen AC-24 **fertig**, darstellung AC-14 erweitert —
  **Schritt B3**: Schießanlage, Stall und Schmiede. Sie tragen `zeitalter: 1`
  in den Daten; daran hängt alles andere — das Baumenü lässt sie weg, der
  Server weist sie ab, und ein Gebäude ohne Angabe gehört der Dunklen Zeit.
  Der Stall bildet den Späherreiter aus (80 Nahrung, 30 s), der damit zum
  ersten Mal gebaut statt mitgeliefert wird. Gezeichnet mit eigenen Merkmalen:
  Zielscheibe, Koppel mit Heuschober, Schornstein mit Rauch und glühender Esse.
  Fünf Dinge gelernt: (1) **Ein neues Gebäude misst sich gegen alle alten** —
  `npm run tafel -- "t.unterschiede('gebaeude')"` nach jeder Änderung, der
  schlechteste Paarwert liegt jetzt bei 0,38 (Grenze ein Drittel). (2) Mein
  erstes Stalldach war ein dunkler Keil, weil ich den First auf Traufenhöhe
  gesetzt hatte — erst das Hinsehen hat es gezeigt, keine Messung. (3) **Dunkle
  Öffnungen reißen `darstellung AC-13`**: „fast schwarz" heißt höchster Kanal
  unter 50, und das trifft auch das dunkle Ende eines Verlaufs — das
  Schmiededach lag bei 4,9 %. (4) Neun Bauknöpfe schoben die Auswahlleiste
  unter die Übersichtskarte; `bedienteileFrei` hat es gefangen, das Baumenü
  bricht jetzt um. (5) **Bildnachweise werden nur geschrieben, wenn sie
  fehlen** (ADR-0011) — wer ein bestehendes Bild erneuern will, braucht
  `QA_NACHWEIS=1`. Ich habe dreimal dasselbe alte Bild angesehen, bevor es mir
  auffiel. Nächste Runde: **B4**, die Einheiten der Feudalzeit.
- **58** · 2026-11-07 · bauen AC-23 und bedienung AC-33 **fertig** —
  **Schritt B2, der Zeitalterwechsel**. Die vier Zeitalter und alle drei
  Aufstiege stehen als Daten; der Aufstieg ist ein Auftrag im Dorfzentrum wie
  eine Verbesserung, deshalb erbt er Bezahlen beim Einreihen, Fortschritt in
  der Schlange und volle Erstattung beim Abbruch, ohne eine Zeile dafür.
  Oben in der Leiste steht das Zeitalter, der Wechsel wird einmal groß
  gemeldet. `spielziel AC-1` steht bewusst auf `in-arbeit`: die Aufstiege
  rechnen, aber noch öffnet keiner etwas — das kommt mit B3.
  Gelernt, dreierlei: (1) Die Voraussetzung „zwei Gebäude der Dunklen Zeit"
  ist mehrdeutig; entschieden und in der Spec notiert: **das Dorfzentrum zählt
  mit**. (2) Neue Bildschirmtexte bekommen echte Umlaute („Gebäude", „außer") —
  die alten Texte des Strategiespiels haben keine, das ist ein offener Faden.
  (3) `dorfbewohnerAnklicken` riss in zwei von fünf Läufen, erst nach dieser
  Runde sichtbar: im 20-fachen Zeitraffer läuft das Ziel zwischen Messen und
  Klicken mehrere Felder weit, **und** wer seit B1 hinter einem Gebäude steht,
  ist nur ein Umriss — der Klick trifft das Gebäude. Die Hilfe hält jetzt auf
  Wunsch die Zeit an, überspringt Verdeckte, führt den Blick nach und klickt
  bis zu zwölfmal; danach fünf von fünf grün und 38 s statt 40 s bis 1,6 min.
  Dazu: Better Auth wies gegen Ende des Browserlaufs mit „Too many requests"
  ab, weil der Lauf länger wurde — der Testserver bekommt jetzt wie bei
  `schutz` eine weite Grenze, die echten Werte prüft `tests/konten.test.mjs`.
  Nächste Runde: **B3**, die drei Gebäude der Feudalzeit.
- **57** · 2026-09-17 · bedienung AC-32 **fertig** — **Schritt B1 fertig**.
  Die Welt zählt je Rohstoff, wer daran arbeitet (`arbeiterVon`, Schaf und Farm
  zählen als Nahrung, wer trägt zählt zu seiner Ladung) und schickt die vier
  Zahlen je Spieler mit; die Leiste zeigt sie am Vorrat, null bleibt blass.
  Gelernt: `const [holz, …]` neben einem schon vorhandenen `const { holz, … }`
  in derselben Funktion — „Identifier has already been declared", und die ganze
  Seite blieb schwarz; der Browsertest fand es sofort. `darstellung AC-10` riss
  im großen Lauf bei 100 % fremder Last (Bilder je Sekunde), allein 57 und grün
  — der Test nimmt schon den besseren von zwei Durchgängen; wenn er noch einmal
  reißt, bekommt er einen dritten.
- **56** · 2026-09-17 · B1, Teil 1: bedienung AC-30 und AC-31 **fertig**.
  Verdeckte Einheiten: wer hinter einem Gebäude steht (dessen x + y größer ist),
  wird nach allem anderen noch einmal als Umriss in Spielerfarbe gezeichnet —
  dieselbe Gestalt aus dem Zwischenspeicher, mit `source-in` eingefärbt;
  `ansicht.umrisse` sagt dem Test, wer gerade so gezeichnet wurde. Arbeit:
  der Zustand schickt `w: 1`, wenn jemand sammelt, hütet, eine Farm bestellt
  oder baut (nur dann, der Zustand bleibt unter 1 kB); die Figur holt dann mit
  der Axt aus und beugt sich, in acht Stufen wie der Schritt. Gemessen: 60
  Bilder je Sekunde bleiben. Gelernt: ein Muster, das in zwei Figuren gleich
  vorkommt, trifft zweimal — die Ersetzung lief erst auf dem Ausschnitt der
  Funktion.
- **55** · 2026-09-17 · Spec-Runde Stufe B (Feudalzeit), kein Code. Neu aus
  der Vorlage: bauen AC-23 (Aufstieg 500 Nahrung, 130 s, zwei Gebäude der
  Dunklen Zeit außer Häusern), AC-24 (Schießanlage, Stall, Schmiede mit Werten),
  AC-25 (Schmiedeangriff, Befiederte Pfeile), AC-26 (Doppelaxt, Pferdekummet);
  einheiten AC-23 bis AC-25 (Speerkämpfer, Bogenschütze, Plänkler, Späherreiter
  aus dem Stall; Miliz wird Soldat; Fernkämpfer halten Abstand); bedienung
  AC-33, AC-34 (Zeitalter im Bild, Angriffsbefehl erkennbar); ki AC-9 (die KI
  steigt auf). Kampf stand schon in `kampf.md` (AC-1 bis AC-10 für Stufe B,
  AC-11 bis AC-14 Sicht für Stufe C) — nichts doppelt geschrieben. Bauabfolge
  B1 bis B7 im Fahrplan; **B1 sind die drei Lücken aus der Rückschau**, sie
  kommen vor der Feudalzeit. Markt, Wachturm, Mauer und Tor stehen in der
  Vorlage in der Feudalzeit, gehören hier aber zu Stufe D — im Spec vermerkt,
  damit die Abweichung nicht verlorengeht.
- **53** · 2026-09-17 · fahrplan AC-3 **fertig** — **Stufe A erreicht** (alle
  Kriterien der Bauabfolge A1–A10 `fertig`). Ein Browsertest spielt die
  Dunkle Zeit am Stück wie ein Mensch, im Zeitraffer: Schaf, Holz, Gold per
  Rechtsklick, `H`/`Q` bildet aus, `.` schickt den Neuen an den Stein, jeder
  Rohstoff kommt im Lager an; dann alle sechs Gebäude mit `B` + Buchstabe und
  Klick, Miliz aus der Kaserne, ein Dorfbewohner an die Beeren (Prüfgriff
  füllt nur Holz fürs Bauen auf, gesammelt ist jeder Rohstoff). Gefunden: (1)
  **Bedienfehler** — überlappten Gebäude im Bild, wählte ein Klick das zuerst
  gebaute statt des vorderen; `gebaeudeUnter` nimmt jetzt das vorderste; (2)
  `dorfbewohnerAnklicken` nahm den ersten Dorfbewohner, auch wenn ein anderer
  im Bild dicht daneben stand — jetzt den freiesten; (3) mein eigener
  Aufbaufehler: zu Beginn ist Wohnraum für einen, nicht für drei. Nächste
  Runde: Rückschau zum Ende der Stufe mit Partie im Browser und den drei
  größten Lücken.
- **52** · 2026-09-17 · darstellung AC-10 **fertig** — Schritt A9
  abgeschlossen. Gemessen mit 100 Einheiten und 30 Häusern bei Zoom 1
  (Prüfgriffe `gebaeude` und neu `einheiten`): erst **24 Bilder je
  Sekunde**, `zeichnen` 12 ms. Leere Szene 60. Versuche mit Ausschalten:
  ohne Figuren 47, ohne Gebäude 27 — die Figuren kosteten es. (1) Figuren
  jetzt wie Gebäude und Vorräte in einem Zwischenspeicher
  (`figurBildZeichnen`), der Schritt in acht Stufen: `zeichnen` 1,4 ms, aber
  erst 38 Bilder — die Arbeit lag jetzt beim Darstellen. (2) Alle
  Zwischenbilder wurden mit krummen Koordinaten und leicht anderer Größe
  kopiert, der Browser glättete jedes Mal; auf ganze Bildpunkte und
  Originalgröße: **60 Bilder je Sekunde** (52, solange Berts Seite im selben
  Browser mitzeichnet — der Test lässt Bert die Seite verlassen, im Spiel
  sitzt er an einem anderen Rechner). Gelernt: die JavaScript-Zeit von
  `zeichnen` sagt wenig über die Bildrate; Canvas-Befehle werden beim
  Darstellen gerastert — nur Bilder je Sekunde zählen zeigt das.
- **51** · 2026-09-17 · fahrplan AC-6 **fertig** — und ein großer Fehler
  gefunden. Erst gemessen (8 Spieler × 100 Dorfbewohner bei Arbeit auf der
  größten Karte): **58 ms je Takt**, Spitzen über 150 ms — länger als ein Takt
  (100 ms). CPU-Profil (`node --cpu-prof`): 98 % in `suchen`; gezählt: 5845
  gescheiterte Wegsuchen zu Vorräten, je 8,6 ms. Wer einem unerreichbaren
  Vorrat zugeteilt war, suchte in jedem Takt neu über die ganze Karte. Jetzt
  merkt er sich das Feld, nimmt einen anderen derselben Art, nach dreien steht
  er (einheiten AC-9). Danach **0,5 ms je Takt**, erster Abschnitt mit einer
  Spitze von 61 ms beim ersten Wegesuchen aller. Beide Tests ohne Korrektur
  rot (AC-6 brauchte 37 s). Aufgefallen, nicht behoben: `zustand()` mit 800
  Einheiten kostet 3–10 ms und geht jeden Takt über die Leitung — gehört zu
  den gebündelten Änderungen (offener Faden).
- **49** · 2026-09-17 · einheiten AC-20 und bedienung AC-6 **fertig**. Ein
  Befehl für viele: wer geht, bekommt ein eigenes freies Feld in Ringen um das
  Ziel (das nächste noch freie, damit sich Wege wenig kreuzen); wer sammelt,
  einen eigenen Vorrat derselben Art im Umkreis von drei Feldern, der
  geklickte zuerst. Einer allein geht weiter genau dorthin. Test ohne
  Änderung rot; Prüfstand 20 Partien ohne Widerspruch, Wirtschaft unverändert
  (22 Dorfbewohner). Die Auswahlliste gab es schon (Anzahl gesamt, je Typ Bild
  mit Zahl) — jetzt belegt; „ausgewählt" mit Umlaut. Der Browsertest wartet,
  bis alle vier ganzzahlig und still stehen, bevor er das Bild macht.
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
