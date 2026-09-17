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
  feststeht, heißt es in der Oberfläche „Strategie".
- **Umlaute in sichtbaren Texten?** `CLAUDE.md` verlangt Umschreibung im
  Quelltext, und bisher gilt das auch für Texte auf dem Bildschirm („Fuehrt
  einen Verein ueber …"). Das liest sich holprig. Vorschlag: echte Umlaute
  nur in Zeichenketten, die auf dem Bildschirm stehen; Bezeichner bleiben
  umschrieben. Bis zur Antwort bleibt es bei der Umschreibung.
- **Zeittest des Managerspiels unter Last (seit 2026-09-16, Runde 10).**
  `karriere AC-7` (Saison unter 1 s) reißt in `npm run check`, sobald fremde
  Rechenjobs laufen: 1,7–3,2 s. Nacheinander (`--test-concurrency=1`) sind
  alle 255 Tests grün, AC-7 mit 516 ms. Vorschlag: Zeitmessungen in einen
  eigenen, seriellen Schritt von `npm run check` legen (`node --test
  --test-concurrency=1` nur für die Messtests), die Grenze bleibt 1 s. Ohne
  Antwort ändert die Schleife weder Grenze noch Testaufruf und committet nur
  bei grüner Prüfung.
- **Berechtigungen für die Schleife.** Das Anlegen von `.claude/settings.json`
  wurde vom Sicherheitsfilter abgelehnt (Selbständerung). Solange sie fehlen,
  kann jede Runde an einer Rückfrage hängen bleiben. Der Vorschlag steht in der
  Nachricht vom 2026-09-16; eintragen kann nur der Benutzer.

## Offene Fäden

- Das Spielbild im Browser liest `window.ansicht` (nur lesen, befohlen wird
  mit Maus und Tastatur) — Muster in `e2e/tests/strategie-spielbild.spec.mjs`.
  Für neue Bedienkriterien dort anbauen.
- Der Server schickt heute jedem den Vollzustand. Das trägt nicht bis 8×200
  Einheiten (fahrplan AC-20) und nicht für den Nebel (AC-13). Nicht vorziehen,
  aber keine Entscheidung treffen, die gebündelte Änderungen verbaut.
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
- Offen im Aussehen: die Basis ist
  noch eine Raute ohne Gebäude (A6), Dorfbewohner bei Zoom 1 recht klein.
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
| 2026-09-17 | Zeichnen je Bild im Browserlauf, Zoom 1 / Zoom 0,4 | 4,9–6,2 ms / 10–11 ms | Runde 13 |
| 2026-09-17 | Tests ohne Browser / im Browser; Browserlauf (Last 16 %) | 260 / 83; 58,5 s | Runde 13 |

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

## Runden

Neueste oben. Eine Zeile je Runde: Nummer, Datum, Kriterien, Ergebnis,
wichtigste Erkenntnis.

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
