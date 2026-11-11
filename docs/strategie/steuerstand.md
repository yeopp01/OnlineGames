# Steuerstand

**Wofuer:** In langen Arbeitsschleifen (`/loop /strategie-weiterbauen`) wird
der Gespraechsverlauf irgendwann zusammengefasst, und dabei gehen Einzelheiten
verloren. Diese Datei ist der Stand, nach dem weitergearbeitet wird — genauer
als jede Zusammenfassung. Der Haken `.claude/hooks/steuerstand.mjs` legt sie
nach jeder Zusammenfassung und zu jedem Sitzungsbeginn von selbst wieder vor.

**Pflicht:** Nach jeder Runde fortschreiben, bevor die naechste beginnt. Wer
hier nichts eintraegt, verliert den Faden beim naechsten Autocompact.

---

## Zuletzt fortgeschrieben

2026-11-11, nach Runde 170 (**spielziel AC-26 fertig**: `gebaeude.reichweite` nur fuer Gebaeude, die schiessen (`SCHUSSFELDER` in `gebaeudewert`), Form `handel: { gebuehr, karrenAnteil }` mit `welt.handelswert` in `handelspreise` und `handelsgewinn`; Wehrstein Turm/Burg +1, Silberfurt 15 % Gebuehr und +20 % je Fahrt; Messtest `tests/strategie-haeuser-wirkung.test.mjs` (je Bonus im Spiel, aus den Daten, Bonus ohne Messung bricht); Pruefhaus ohne Boni nur im Browserlauf (`e2e/helpers/pruefhaus.mjs`, `hausOhneBoni()` liefert es); Warteraum-Bilder zeigen bis zum naechsten `:neu`-Lauf noch Silberfurt); davor Runde 169 (**spielauswahl AC-24 fertig, E2 ganz**: `haus` in `jePlatz` des Steckbriefs (`HAUSWAHL`, `haeuserAus` zieht Zufall aus dem Startwert, Menschen dann KIs, jeder Platz zieht), `haus` im Aufbau; Tests in `tests/spielauswahl.test.mjs`, Browserfall `e2e/tests/strategie-haeuser.spec.mjs`; `partieMit` setzt per `haeuserSetzen` das Haus ohne Boni (`hausOhneBoni()`); zwei Faeden: "Partie starten" ab drei Plaetzen, zufaellige Haeuser ueber den Raum); davor Runde 168 (**Rueckschau**: `npm run qa:waisen` (`scripts/qa-waisen.mjs`, `waisenSuchen()` in `specs-lesen.mjs`, Test `scripts/qa-waisen.test.mjs`), `qa:nachweis` raeumt Waisen vor dem Lauf; Waechter `tests/waechter-wirkungen.test.mjs`, `farmVoll` liest nur `kw`; Regel `:neu` auch bei geaendertem Verhalten (SKILL 6.2); bedienung AC-39 wartet auf die Uhr des Browsers (`e2e/tests/strategie-kampfbild.spec.mjs`); naechste Rueckschau Runde 173); davor Runde 167 (**spielziel AC-17 und fahrplan AC-17 fertig, E2 Daten**: `HAEUSER` in `daten.js`, `hausAus()` und `welt.wirkungen()` (gemerkt je Spieler nach Zahl der Verbesserungen) in `welt.js`, Einstellung `haeuser`; Test `tests/strategie-haeuser.test.mjs`; zwei Eintraege in `qa/ohne-bild.json`); davor Runde 166 (**bedienung AC-45 fertig, E1**: `ZEITALTER` mit `artikel`/`genitiv`/`ab`/`zum`, Aufstiege mit `name`/`titel` aus `ZEITALTER` (Hilfe `aufstieg()` in `daten.js`), `grossAnfang()` in `welt.js` fuer Saetze, die mit einer Form beginnen; Knopftitel in `auswahlleiste.js` aus `eintrag.titel`; Waechter `tests/waechter-zeitalter.test.mjs`; Bild bedienung AC-45 in `e2e/tests/strategie-zeitalter.spec.mjs`; alle Bilder neu geschrieben, 39 ueber 1 % angesehen); davor Runde 165 (**ki AC-13 fertig**: Zweig `strategie-ki-sicht` zusammengefuehrt; `ki.wahrnehmen()` mit Schluessel Takt + `welt.sichtStempel`, nur `welt.feindlich` merkt sie sich, bekanntes Dorfzentrum geht in `feindOrt` vor, `kaempft` an gesehenen Feinden (`gesehenVon`), `fernerMarktplatz` weg von `feindOrt`, `FEIND_VERGESSEN` exportiert; Ersatzgrenze in `tests/partien/ki-im-nebel.test.mjs` + `nebel-arbeiter.mjs` (40 Partien, vier Faeden); fahrplan AC-11-Test aus `tests/strategie-partien.test.mjs` dorthin; ki AC-21 Schwelle drei Viertel (24), ki AC-12 zaehlt jeden, der daheim faellt, ki AC-18 `takt += 1`; Buendnis- und ki AC-25-Tests aufgedeckt; offen als Faden: Spaeher im Heer, Sucher ohne "unerreichbar"); davor Runde 164 (**Spec-Runde Stufe E**: fahrplan AC-16..18 neu, Bauabfolge E1..E10 (E6..E9 warten auf Blender), spielziel AC-16..18 neu + AC-25/26, spielauswahl AC-24, bedienung AC-45/46, einheiten AC-42..54 (54..50 = Drache fuer Stufe F), kampf AC-22/23, bauen AC-35, ki AC-27..29; ADR-0012 Status, CLAUDE.md Tabelle mit 0014/0015, 598 Kriterien); davor Runde 163 (**Rueckschau**: `npm run durchsicht` (`scripts/durchsicht.mjs`, `tests/durchsicht.test.mjs`) legt Geaendertes und Neues ausser Dokumenten fuer den Pruefer ab - den Pfad in den Auftrag; Regel "ein Kriterium gegen einen Mangel misst ihn zuerst neu" (Abschnitt 1); vor neuer Datei `ls`, kein `cat` ohne Datei (Abschnitt 3); Stufe D bis auf einheiten AC-41 gebaut, kein neuer Rundgang - die Rueckschau zur Stufe D war Runde 142); davor Runde 162 (**ki AC-26 fertig**: `handelPruefen`, `goldInReichweite` (Goldfelder einmal gesucht), `handelsziel` (fernster nicht feindlicher Markt >= 25 Felder), `fernerMarktplatz` (50/42/34/26 Felder, weg vom Gegner), `goldKaufen` (Stein zuerst, Ruecklage 300 fuer Holz und Nahrung), `ruecklage()` = Ritterzeit + Holz fuer fehlenden Markt (`marktFehlt`), `kaempft(e)` statt "nicht dorf" an drei Stellen; Konstanten `GOLD_KNAPP`, `KARREN`, `HANDEL_ABSTAENDE`, `HANDEL_MINDESTENS`, `VERKAUF_RUECKLAGE`; Tests in `tests/strategie-ki-handel.test.mjs` (acht, eine Messung ueber 16 Partien, 21 s); Kriterium neu gefasst, weil es das Patt mit leerem Gold auf `strategie` nicht gibt; davor Runde 161 (**einheiten AC-40 fertig**: Auftrag `handel` in `welt.js` (`handelBeginnen`, `strecke`, `handelsgewinn`, `handelTakten`, `streckeFuerDraht`), `handelt: true` am Karren, `HANDEL.karren = { faktor: 0.77, sockel: 0.3 }` (gemessen: 90 % des Dorfbewohners, Wunsch des Benutzers; Vorlage 0,46), Draht `hd` = [Heimat, Ziel, Gold je Fahrt], Leiste `#strecke` in `public/auswahlleiste.js`, Werte `handelt` im Aufbau; Tests `einheiten AC-40` in `tests/strategie-marktkarren.test.mjs` (sechs), Browserfall im selben Spec; AC-41 (Ladung sichtbar) neu und offen, wartet auf die Blender-Figuren; davor Runde 160 (**einheiten AC-39 fertig, D14 begonnen**: `marktkarren` in `daten.js` (Klasse `karren`, `angriff: 0`, Zeit 51 s und Sicht 7 gesetzt, nicht geprueft), `markt.bildetAus`, `EINHEIT_NAMEN`, Figur `marktkarren()` in `public/figuren.js` (Pony + Planwagen, `breite: 1.9`), Schautafel `gross: 66` + `FUSS_VERSATZ`, Kuerzel `c`; Tests `tests/strategie-marktkarren.test.mjs`, Browserfall `e2e/tests/strategie-marktkarren.spec.mjs`; Ritterzeit am Stueck baut jetzt auch Feudalgebaeude, die erst spaeter ausbilden (Markt), und bildet dort den Karren aus; Blender-Versuch des Benutzers im Scratchpad, nicht im Projekt; siehe "Naechste Runde 161"; davor Runde 159 (**spielziel AC-23 fertig, D13 fertig**: Einstellung `tempo` (1/1,5/2) im Steckbrief, `GESCHWINDIGKEITEN` und `welt.tempo`, `takte(einstellungen)` als Funktion im Steckbrief (10/15/20), `verzeichnis.js` prueft sie an den Vorgaben, `raeume.js` `takteJeSekunde` + Uhr nach der Wanduhr (`beginn`, `gerechnet`, hoechstens eine Sekunde nachholen), `ansicht.tempo`/`taktdauer`; Tests `tests/strategie-geschwindigkeit.test.mjs` (mit echter Uhr ueber WS, Hafen 4197) und am Ende von `tests/raeume-spiel.test.mjs`; Browserfall `e2e/tests/strategie-geschwindigkeit.spec.mjs`, `partieMit(..., { geschwindigkeit, vorDemStart })`; siehe "Naechste Runde 160"; davor Runde 158 (**Rueckschau**: Browserfall "im Warteraum stehen alle Einstellungen ... auf 1366 x 768" unter auswahl AC-23 in `e2e/tests/spielauswahl.spec.mjs`, Bilddurchsicht Pflicht nach Stylesheet-Aenderungen, neue Einstellung -> `spielauswahl` + `strategie-einstieg` vorab; naechste Rueckschau Runde 163; siehe "Naechste Runde 159"; davor Runde 157 (**spielziel AC-22 fertig**: Einstellung `zeitgrenze` (keine/90/120, Vorgabe keine) im Steckbrief, `ZEITGRENZEN` und `welt.zeitgrenze` in `welt.js`, im Aufbau an den Browser, "/ 90:00" hinter der Uhr (`#spielzeit .zeitgrenze`), Pruefgriff `uhr` + `uhrStellen`; Browserfall `e2e/tests/strategie-zeitgrenze.spec.mjs`; siehe "Naechste Runde 158"; davor Runde 156 (**spielauswahl AC-23 fertig, Wunsch des Benutzers**: Vorraum fuer den PC - `.vorraum`, `.vorraumspalten`, `.mitspielen` in `public/index.html`/`stil.css`, Breite per `:has(#angemeldet:not([hidden]))`, Einstellungen als Raster in Spalten, Enter im Namen/Code tritt bei; Browserfaelle "Am PC" in `e2e/tests/spielauswahl.spec.mjs`; Warteraum noch schmal; siehe "Naechste Runde 157"; davor Runde 155 (**spielziel AC-24 fertig, D12 fertig**: Knopf "Bündnis lösen" mit Rueckfrage (`#buendnisloesen`, `#buendnisfrage`), Ansage `#buendnisansage` oben rechts mit Uhr, `ansicht.teamVon/teiltSicht/kannKuendigen/buendnisAnsagen`, `buendnisse` im Aufbau, Hinweis in der Kopfzeile kuerzt sich; Browserfall `e2e/tests/strategie-buendnis-loesen.spec.mjs`; siehe "Naechste Runde 156"; davor Runde 154 (**spielziel AC-21 fertig (Server), spielziel AC-24 neu und offen**: Nachricht `kuendigen`, `KUENDIGUNG_SEKUNDEN = 60`, `welt.kuendigungen` [{wer, bis, vorbei}], `welt.teiltSicht` fuer alles, was der Server schickt, `sichtTrennen` mit Erinnerung an die Gebaeude der anderen Seite, `fristenTakten`, `bu` in Zustand und Aufbau, kein Teamsieg waehrend einer Frist; siehe "Naechste Runde 155"; davor Runde 153 (**fahrplan AC-24 fertig, D11 fertig**: Browserfall `e2e/tests/strategie-team-gegen-ki.spec.mjs`, Anna + KI 1 gegen KI 2 + KI 3, Teams im Warteraum, Startwert 4711, Team 2 gewinnt nach 32,5 min, 1,8 min im Browser; Gegenprobe mit `ki.js` aus Runde 150: kein Ende vor Minute 90; siehe "Naechste Runde 154"; davor Runde 152 (**Rueckschau**: `pruefstand:vergleich --teams 1,1,2,2`, Spur ohne Bildschirmfotos (51 MB -> 2,2 MB), `tests/partien/` als zweiter Abschnitt von `npm test` mit `waechter-testordner`, Regel "dieselbe Messung gegen den alten Stand"; check 165-170 s; siehe "Naechste Runde 153"; davor Runde 151 (**ki AC-25 fertig, fahrplan AC-24 in-arbeit**: `welt.feindlich` an drei Stellen in `ki.js`, Pruefstand zwei gegen zwei in `tests/partien/zwei-gegen-zwei.mjs` + `strategie-team-1..4`; siehe "Naechste Runde 152"; davor Runde 150 (**spielziel AC-20 fertig**: `ende.gewinner`/`team`, `welt.mitGegnern`; siehe "Naechste Runde 151"; davor Runde 149 (**spielziel AC-19 fertig, D10 fertig**: ein Sichtobjekt je Team in `welt.sichten`, Verbuendete immer ueber die Leitung, `nebel.js` zaehlt alles Nicht-Feindliche mit, Gebaeudesicht aus `kw` des Besitzers; siehe "Naechste Runde 150"; davor Runde 148 (**spielauswahl AC-22 und spielziel AC-14 fertig**: Teams je Platz im Warteraum - `jePlatz` und `platzname` im Steckbrief, `raum.waehlen`, Nachricht `platz`, Plaetze des Spiels heissen im Raum `platz1` ...; Bild: weisses Zeichen auf dem Verbuendeten; siehe "Naechste Runde 149"; davor Runde 147: **Rueckschau**: `pruefstand:vergleich --probe`, `tests/quelltext.mjs`, Laufzeit des Browserlaufs in CLAUDE.md; siehe "Naechste Runde 148"; davor Runde 146: **spielziel AC-14 gebaut, in-qa**: `welt.feindlich`, Teams als Einstellung, Waechter `waechter-feindlich`; Vergleich Takt fuer Takt gleich; siehe "Naechste Runde 147"; davor Runde 145: **ADR-0013 geschrieben**, Bündnisse/Karren/Dauer, Bauabfolge D10-D14; siehe "Naechste Runde 146"; davor Runde 144: **ki AC-13 dritter Anlauf, geparkt** auf `strategie-ki-sicht` `d0314d4`: 36 von 40 vor Minute 60, Frage an den Benutzer - fahrplan AC-11 im Nebel neu fassen; siehe "Naechste Runde 145"; davor Runde 143: **ki AC-24 fertig, ki AC-21/22 aus `strategie-ki-ritterzeit` eingebunden**: Dorfbewohner je Zeitalter 22/32/42/50, Militaergebaeude ab der Ritterzeit 5/6, Aufstieg vor dem Ersatz; KI gegen KI 40 von 40 vor Minute 60, siehe "Naechste Runde 144" unten; davor Runde 142 Rueckschau zur Stufe D; davor **kampf AC-13, fahrplan AC-13, C6e fertig**: der
Server schickt jedem nur, was er sieht - `welt.zustandJeSpieler`,
`welt.aufbauFuer`, im Raum `sendenJe`. Fremde Gebaeude und Felder, die sich im
Nebel aendern, kommen beim naechsten Hinsehen; wer ausscheidet, bekommt einmal
alles. Runde 111: **einheiten AC-32 versucht und offen gelassen** - drei
Fassungen (warten, ohne Angreifer, schraeg vorbei) gemessen und
zurueckgenommen; Abstand im Gehen zieht das Heer zur Schlange, KI gegen KI
dauert 2-8 min laenger, fahrplan AC-11 reisst. Frage an den Benutzer:
Formationen. Der Browsertest zu ki AC-11 bleibt wackelig (2 von 4).
Runde 112: **ki AC-13 in-arbeit, auf dem lokalen Zweig
`strategie-ki-sicht`** (`7c086ac`) - die KI mit eigener Sicht und Spaeher,
belegt, aber KI gegen KI endet nur in 34 von 40 Partien vor Minute 60
(fahrplan AC-11 reisst). Runde 113 war die Rueckschau: `npm run
gegenprobe`, Pruefstand gleich nach dem ersten Entwurf, Verbergen bricht
Tests, rote Arbeit auf einen lokalen Zweig. Runde 114: ki AC-13 zweiter
Anlauf, wieder auf den Zweig gelegt (`strategie-ki-sicht`, `8817c60`), 35 von
40 vor Minute 60; **Frage an den Benutzer** (Patts mit leerer Wirtschaft -
fahrplan AC-11 halten oder neu fassen). Bis zur Antwort ruht ki AC-13. Runde
115: **kampf AC-14 fertig** (Angriffsmeldung, roter Knopf, Klick springt
hin) - C6g erreicht. Stufe C fehlt damit nur noch ki AC-13 (C6f) und was
daran haengt. Runde 116: **Rueckschau zur Stufe C** - Partie angesehen,
drei Luecken als bedienung AC-39 bis AC-41 (Ausholen im Kampf, Pfeile,
Ansage nicht auf der Mitte). Runde 117: **Spec-Runde Stufe D** - 20
Kriterien, Bauabfolge D1 bis D9 im Fahrplan. Runde 118: **bedienung AC-39 und
AC-41 fertig** (Ausholen im Kampf, Ansage oben). Runde 119: **bedienung AC-40
fertig** (Pfeile), **D1 erreicht**. **Der Browserlauf ist nicht ganz
gruen**: ki AC-11 faellt jetzt in jedem vollen Lauf (zwei Milizen der KI
laufen aufeinander, einheiten AC-32 - wartet auf die Frage zu Formationen).
Runde 120: **ki AC-11 im Browser auf
Startwert 2024** (bewusstes Ausweichen vor AC-32, im Test vermerkt) - der
Browserlauf ist wieder gruen. Runde 121: **Rueckschau**
(Testserver beendet sich auf Zuruf, Szenen, die stillhalten, zwei rote
Laeufe = roter check). Runde 122: **D2 fertig** (bauen AC-27,
AC-28: Aufstieg in die Ritterzeit, Kloster, Universitaet, Werkstatt, Tasten
Y X C). Runde 123: **Ritter und Armbrust
fertig** (einheiten AC-33, AC-34). Runde 124: **D3 fertig** (bauen AC-34:
Eisenguss, Bodkinpfeil, Mauerwerk, Stadtpatrouille; `vorstufe` an der
Verbesserung, `welt.gebaeudewert()` fuer Leben, Ruestung und Sicht der
Gebaeude, das volle Gebaeudeleben in `kw`, ein Waechter dazu). Der Benutzer
hat geantwortet: **Stufe G wird nicht vorgezogen, der Fahrplan wird der Reihe
nach gebaut.** Runde 125: **D4 fertig** (bauen AC-29, kampf AC-20: der
Wachturm schiesst von selbst, `welt.tuermeTakten()`, `schaden()` kennt ein
Gebaeude als Angreifer, Sicht 9 wegen kampf AC-18; der Pfeil beginnt oben,
`schussHoehe` in `public/gebaeude.js`). Runde 126: **Rueckschau** -
`tests/waechter-namen.test.mjs` (Name, Zeichnung, Taste je Art; dabei fehlten
Ritter und Armbrust in `EINHEIT_NAMEN`), `npm run e2e:daten` fuer die
Browserfaelle, die aus den Daten aufstellen, zwei Regeln in der Anweisung.
Runde 127: **bauen AC-30 fertig** - die Steinmauer (5 Stein je Feld, 8 s,
1800 Leben, Feudalzeit, Taste X), gezogen statt geklickt: `gezogen: true` in
den Daten, `welt.mauerZiehen()` legt je freies Feld eine Baustelle an
(belegte uebersprungen, Ende beim letzten bezahlbaren), die Bauer gehen die
Folge ab (`auftrag.folge`, `welt.bauenWeiter()` - auch wenn ein Feld
abgerissen oder nicht erreichbar ist). `mauerLinie()` und `MAUER_MAX = 60`
stehen in welt.js und gelten fuer Browser und Server gleich. `zumAufstieg:
false` in den Daten statt `art === 'haus'`. `e2e:daten` fand zwei Brueche
(Hoehe auf einem Feld, der Mauerbauer neben der Wiese) - beide Annahmen der
Tests. Runde 128: **bauen AC-31 fertig** - das Tor (30 Stein, 70 s, 2750
Leben, ein Feld statt vier, Taste C). Auf der Karte bebaut; die Wegsuche
bekommt `welt.toreVon(besitzer)` als Felder, die nur fuer ihn frei sind
(`suchen(karte, start, ziel, frei)`) - **jeder neue Aufruf von `suchen` fuer
eine Einheit uebergibt sie**. Auf die eigene Mauer gesetzt ersetzt es das
Feld (`ersetzt: 'steinmauer'`, `welt.ersetzbar`, `platzPruefen(…, ausser)`).
Offen gezeichnet, wenn eine eigene Einheit hoechstens 1,5 Felder davor
steht (`ansicht.torOffen`). Neu `welt.wegZurBaustelle`: ist das naechste
Randfeld nicht erreichbar, die naechsten vier. Runde 129: **einheiten AC-35 fertig** - die Ramme (`ramme`, Kuerzel `w`,
Belagerungswerkstatt, Ritterzeit). `nurGebaeude: true` und `wacht: false` in
den Daten; `befehl`, `wacheTakten` (Angriffslauf) und `wehren` fragen
`EINHEITEN[art].nurGebaeude` - **wer eine vierte Stelle baut, die einen
Angriff beginnt, fragt es auch**. Der Bonus +125 gilt der Klasse
`gebaeude`, die jedes Gebaeude von selbst traegt; nicht in `schaden` noch
einmal hinzufuegen. Neue Klassen brauchen einen Namen in `KLASSEN`. Im
Browser: `zielzeichenSetzen` zeigt fuer lauter Rammen auf einer Einheit
kein rotes Zeichen (`feindlichAn(ziel, nurGebaeude)`). Figur
`ramme()` in figuren.js mit `stoesst: true` (kein Ausholen des ganzen
Koerpers), auf der Schautafel mit `gross: 78`. **Naechste Runde: einheiten
AC-36 (Mangonel) mit kampf AC-19 (Flaechenschaden)** - oder kampf AC-21,
aber dort steht ein Widerspruch: eine Ramme braucht fuer ein Feld
Steinmauer 15 Stoesse, rund 71 s, das Kriterium sagt unter 30 s. Vorher in
der Vorlage nachsehen und das Kriterium mit Begruendung fassen. ki AC-13
und einheiten AC-32 warten auf Antworten. Runde 130: **einheiten AC-36 und
kampf AC-19 fertig, D6 fertig** - der Mangonel (`mangonel`, Kuerzel `n`).
Neu in den Daten: `mindestreichweite`, `geschoss` (Felder je Sekunde),
`flaeche`. Hat eine Einheit `geschoss`, geht `schlagen` an
`welt.steinWerfen`: ein Eintrag in `welt.einschlaege`, der nach seiner
Flugzeit in `einschlaegeTakten` alles im Umkreis trifft (vor
`schlaegeAbrechnen`). Im Zustand als Pfeil mit fuenftem Wert 1, der Browser
zeichnet daraus einen Stein (`p.stein`). `wehren` schlaegt nie gegen den
eigenen Besitzer zurueck. Im Browserfall: eine wachende Einheit mit grosser
Sicht nimmt sich ihr Ziel selbst, bevor der Rechtsklick ankommt - ausser
Sicht aufstellen. **Naechste Runde 131: Rueckschau.** Danach D7 (Burg und
Markt) oder kampf AC-21 mit geklaertem Widerspruch. Runde 131 war die
Rueckschau: `e2e:daten` faehrt jetzt auch `strategie-unterscheidbar`
(Spielerfarbe je Einheit), `schautafel.ueberstand()` haelt jede Figur in
ihrer Zelle (neue breite Figuren: erst `npm run tafel -- "t.ueberstand()"`,
dann `gross` und `FUSS_VERSATZ` in schautafel.js), und eine Regel fuer
Kampfbilder in der Anweisung. **Naechste Runde 132: D7 (Burg und Markt,
bauen AC-32, AC-33)** oder kampf AC-21 - vorher den Widerspruch klaeren.
Runde 132: **bauen AC-32 fertig - die Burg** (4x4, 650 Stein, 4800 Leben,
+20 Wohnraum, schiesst 11 auf 8 Felder vom Rand nach der Regel des
Wachturms, Sicht 9 wegen kampf AC-18, Taste F, Zeichnung Ringmauer mit
Ecktuermen und Bergfried; die Schautafel waechst mit der Zahl der Gebaeude).
Der Ritterzeit-Test baut und fotografiert nur noch die drei aus bauen AC-28,
das Menue prueft weiter alle aus den Daten. **Naechste Runde 133: bauen
AC-33 (Markt)** - Werte des Handels aus der Vorlage holen; oder kampf AC-21
mit geklaertem Widerspruch. Runde 133: **bauen AC-33 fertig - der Markt, D7
ist fertig** (4x4, 175 Holz, Feudalzeit, Taste J; je Ware Kaufen und
Verkaufen, Preis in Gold auf dem Knopf; `HANDEL` in daten.js: Grundpreis
100, Stein 130, Gebuehr 30 %, Schritt 2, Tiefst 20 - Schritt und Tiefst aus
"4000 bzw. 5500 bis ganz unten" der Vorlage gerechnet; Preise je Spieler,
`welt.handelspreise`, im Draht `hp`, fremde nie). Die KI handelt nicht.
Runde 134: **einheiten AC-37 fertig - der Moench heilt** (Kloster,
Ritterzeit, Taste G, 100 Gold; `heilen: { reichweite: 4, je: 1 }` in den
Daten, `welt.heilenTakten()` einmal je Sekunde, `heilt` setzt `w`; die
Figur hebt den Stab mit Schein, `segnet` in FIGUREN statt Vorbeugen; ohne
Angriff: Zielzeichen weiss, Leiste "Greift nicht an" / "Heilt 1 Leben/s",
`heilen` in `werte.einheiten`). Die KI bildet keine Moenche aus.
Runde 135: **einheiten AC-38 fertig - der Moench bekehrt, D8 ist fertig**
(`bekehren: { reichweite 9, frueh 4, spaet 10, chance 0.28, ruhe 62, nicht
[belagerung, moench] }` in den Daten; `welt.zufall` aus dem Startwert,
`kannBekehren`, `bekehrDauer`, `bekehrenTakten`, `bekehrt`; im Draht `r`
fuer ruhend, `bekehren` in `werte.einheiten`; im Browser `bekehrbarAn` fuer
das rote Zeichen, Leiste "Bekehrt 9 Felder"). Die KI bildet keine Moenche
aus. Runde 136 war die Rueckschau (Waechter `waechter-merker`, Regel
"Rechtsklick an drei Stellen", Bilder zu einheiten AC-15 und ki AC-11
erneuert). Runde 137: **ki AC-21/22 gebaut und geparkt** auf dem lokalen
Zweig `strategie-ki-ritterzeit` (`074d1f0`) - fahrplan AC-11 reisst in jeder
Fassung (19/20, Patt im Mittelspiel wie in Runde 114; Frage an den Benutzer
ergaenzt). Auf `strategie` nur der robustere Test zu ki AC-19 (zehn
Startwerte statt Startwert 13). Runde 138: **fahrplan AC-23 fertig** (der
Konterkreis der Ritterzeit im Gefechtsstand, Budget 1200, dazu Treffer je
Stein des Mangonels > 1 mit Gegenprobe ohne Flaeche). Runde 139: **kampf
AC-21 und fahrplan AC-15 fertig** (Mauern brechen statt stehenbleiben,
`welt.mauerImWeg`; Belagerung im Pruefstand `belagerungSpielen`, Test in
`tests/strategie-befestigung.test.mjs`). Runde 140: **fahrplan AC-14
fertig** (die Ritterzeit am Stueck im Browser,
`e2e/tests/strategie-ritterzeit-am-stueck.spec.mjs`, in `e2e:daten`). Von
Stufe D ist nur noch ki AC-21/22/23 offen - und die warten auf die Antwort
zum Patt. Runde 141: **Rueckschau** (Hilfe `ersterTreffer`,
`e2e:laufzeiten` liest `e2e/.ergebnisse/bericht.json`, zwei Regeln).
Runde 142: **Rueckschau zur Stufe D** (KI gegen KI bis in die Ritterzeit
auf dem geparkten Zweig in einem `git worktree` unter `e2e/.ergebnisse/`
angesehen, danach entfernt; drei Luecken bedienung AC-42 bis AC-44; der
Umlaut-Waechter liest jetzt auch `element(tag, klasse, text)`, drei Texte
berichtigt). **Antworten des Benutzers vom 2026-11-09** (alle in den Erkenntnissen
unter "Fragen an den Benutzer"): (1) **Patt: die Wirtschaft der KI
reparieren**, fahrplan AC-11 bleibt; Ziel: die KI geht im letzten
Zeitalter Richtung 40-50 Dorfbewohner (Stufen: schwer 40-50, mittel 25,
leicht 15 Dorfbewohner insgesamt; erst schwer bauen) und greift strukturiert an. (2) **Voelker:**
fuenf eigene Startvoelker der Antike, echte Nachfolgevoelker je
Zeitalter, eng verwandt, Unterschiede vor allem ueber Boni, ganz wenige
Spezialeinheiten, eigene Namen der Zeitalter - neues ADR, dann Spec-Runde
E. (3) **Trebuchet abschaltbar** (fahrplan AC-19). (4) **Pushen etwa alle
fuenf Runden, aber nur, wenn der Benutzer da ist** - die Freigabe haelt die
Schleife sonst an; nie `main`, nie Deploy. (5) **Buendnisse ja, loesbar**
(meist 2 gegen 2), Partien duerfen 1,5 h dauern, Geschwindigkeit und
Zeitgrenze als Einstellung, **Marktkarren schon in der Ritterzeit** - ein
ADR fuer alles vier (holt Handelskarren aus "Wird nicht gebaut").
**Reihenfolge:** Runde 143 KI-Wirtschaft, dann das ADR, dann Buendnisse
bauen, dann Voelker-ADR und Spec-Runde E.
**Naechste Runde 171: E3, spielziel AC-25 - Mannschaftsbonus nur im Buendnis** (Eschenbruch und Distelhag: Ausbildungszeit -20 % in Schiessanlage/Kaserne der Verbuendeten, Wehrstein: Gebaeude der Verbuendeten +2 Sicht, Rappenstein/Silberfurt nach ADR-0014); gilt fuer alle, mit denen das Haus die Sicht teilt (`welt.teiltSicht`), endet mit der Kuendigung; neue Lesestelle Ausbildungszeit. Danach spielziel AC-16 (E3 ganz). Steht die Maschine frei: einmal `npm run check:alles:neu:kurz` + `qa:abweichung` (Warteraum-Bilder mit Pruefhaus). Erledigt in Runde 170: spielziel AC-26. (Frueher: **Naechste Runde 170: E3, spielziel AC-26 - jeder Bonus wirkt**, zuerst die Boni, die eine neue Lesestelle brauchen (Ausbildungszeit, Marktgebuehr, Ertrag des Karrens, Reichweite nur fuer Turm und Burg; ADR-0014 Punkt 4), je Bonus eine Messung gegen ein Haus ohne ihn, Boni aus den Daten gelesen. Zu gross? Dann zuerst eine Lesestelle (z. B. Silberfurt) fertig. **Achtung:** bekommt Silberfurt Boni, gibt es kein Haus ohne Boni mehr - `hausOhneBoni()` in `e2e/helpers/strategie.mjs` bricht dann ab; vorher entscheiden, womit Tests ohne Haus spielen (Faden "Ueber den Raum gestartete Partien spielen zufaellige Haeuser"). AC-25 (Mannschaftsbonus nur im Buendnis) danach. Erledigt in Runde 169: spielauswahl AC-24. (Frueher: **Naechste Runde 169: spielauswahl AC-24** - das Haus je Platz im Warteraum wie das Team (`jePlatz` im Steckbrief, `teamsAus` als Vorbild fuer `haeuserAus`, Vorgabe Zufall aus dem Startwert aufgeloest), vorher `npx playwright test -c e2e/playwright.config.mjs spielauswahl strategie-einstieg`. Erledigt in Runde 167: die Daten (spielziel AC-17, fahrplan AC-17); Runde 168 war Rueckschau, die naechste ist Runde 173. (Frueher: "Naechste Runde 167: E2" - `HAEUSER` als Daten (Boni in der Form der Verbesserungen, gelesen in `einheitenwert`, beim Sammeln, in `gebaeudewert`) und die Wahl je Platz im Warteraum (Name und Wahlspruch, noch ohne Wappen): fahrplan AC-17, spielziel AC-17, spielauswahl AC-24. Zu gross fuer eine Runde? Dann zuerst nur die Daten mit `einheitenwert` (spielziel AC-17), die Wahl im Warteraum danach. Eine neue Wahl je Platz: vorher `npx playwright test -c e2e/playwright.config.mjs spielauswahl strategie-einstieg`. Runde 168 ist Rueckschau. Erledigt in Runde 166: E1 (bedienung AC-45). (Frueher: "Naechste Runde 166: E1, bedienung AC-45" (Erledigt in Runde 165: ki AC-13, Zweig zusammengefuehrt, 37/40 vor Minute 60, Median 44,6) - die Stufen heissen Landsitz, Lehen, Fuerstentum, Krone auf dem Bildschirm; gebeugte Formen in den Daten (`ZEITALTER`), Waechter gegen die alten Namen in Bildschirmtexten, `npm run check:alles:neu`, dann `npm run qa:abweichung`. Danach E2 (HAEUSER als Daten + Wahl im Warteraum, fahrplan AC-17, spielziel AC-17, spielauswahl AC-24), E3, E4 (bedienung AC-43), E5 (ki AC-27); E6 bis E9 warten auf die Blender-Figuren. Erledigt in Runde 164: Spec-Runde Stufe E (frueher: "Naechste Runde 164: Spec-Runde Stufe E" nach ADR-0014 (`docs/adr/0014-haeuser-statt-voelker.md`, Abschnitt "Was die Spec-Runde zur Stufe E daraus macht"): fuenf Haeuser als Daten, Zeitalter Landsitz/Lehen/Fuerstentum/Krone, Spezialeinheit aus der Burg, Haus im Warteraum je Platz, die KI spielt ihr Haus. Fahrplan AC-16 neu fassen (gleiche Nummer), Bauabfolge E1.. mit bedienung AC-42 bis AC-44 als erstem Schritt. Nur Specs, kein Code; Commit `Spec: Stufe E - ...`. Figuren der Haeuser: an die Blender-Sitzung, als offen vermerken. Stufe D gilt bis auf einheiten AC-41 (Ladung sichtbar, Blender) als gebaut (Rueckschau 163). **Danach Runde 165: ki AC-13, die KI mit eigener Sicht** (Benutzer, 2026-11-10): den Zweig `strategie-ki-sicht` (`d0314d4`, 5 Commits) in `strategie` zusammenfuehren - nicht neu schreiben; Konflikt nur in `ki.js` (Handel, Teams, Wachstum seit Runde 144). Dann `npm run pruefstand:vergleich -- --minuten 90 --saetze 2` gegen HEAD. Reicht es nicht fuer 40/40 vor Minute 60, gilt die **Ersatzgrenze im Nebel**: alle mit Sieger vor Minute 90, Median unter 45, mindestens 35 von 40 vor Minute 60 - fahrplan AC-11 unter derselben Nummer neu fassen. Erledigt in Runde 163: Rueckschau. Erledigt in Runde 162 (frueher: "Naechste Runde 162: ki AC-26, die KI handelt mit Karren (D14).") Fehlt ihr
in der Ritterzeit Gold: zweiter Markt weit vom ersten (oder ein verbuendeter
Markt), Karren ausbilden, Rechtsklick auf den Zielmarkt ueber
`welt.nachricht` wie ein Mensch. Zuerst messen: `npm run pruefstand:vergleich
-- --minuten 90 --saetze 2` gegen HEAD, Patt mit leerem Gold zaehlen
(Erkenntnisse 114, 137, 144). Die KI kennt `HANDEL.karren` aus den Daten -
die Formel nicht in ki.js nachbauen, sondern `welt.handelsgewinn` fragen
oder den Abstand nehmen. einheiten AC-41 (Ladung sichtbar) bleibt offen, bis
die Blender-Figuren eingebunden sind. **Blender:** eine Parallelsitzung baut seit
2026-11-10 alle Figuren und Gebaeude mit Blender neu (Benutzer). Bis sie
eingebunden ist: `public/figuren.js`, `public/gebaeude.js`,
`public/schautafel.js` nicht anfassen, keine neue Figur zeichnen - braucht
eine Runde eine, Aussehen als offen vermerken und fragen.
**ADR-0014 ist entschieden und eingecheckt** (13899a5, vom Benutzer aus der Parallelsitzung, waehrend Runde 162): eine eigene Welt aus Haeusern statt historischer Voelker, die Zeitalter heissen **Landsitz, Lehen, Fuerstentum, Krone**. Massgeblich fuer die Spec-Runde zur Stufe E. **ADR-0015 (der Statthalter) ist eingecheckt** (6d199bc, aus der Parallelsitzung): die vorhandene KI uebernimmt auf dem Platz eines Menschen Bereiche, die er ihr per Knopf uebergibt, kein Sprachmodell; kommt **nach Stufe E**, aendert raeume AC-9.
**Naechste Rueckschau: Runde 173.** Gepusht bis 163 (4e7e401); weiter nur
pushen, wenn der Benutzer da ist. Offen fuer spaeter: im Vorraum auf
1366 x 768 rutscht bei aufgeklapptem Formular die Karte des
Fussballmanagers an den Rand (erlaubt nach auswahl AC-23).
Erledigt in Runde 161 (frueher: "Naechste Runde 161: einheiten AC-40, der Karren handelt (D14).")
Erledigt in Runde 159 (frueher: "Naechste Runde 159: spielziel AC-23, Spielgeschwindigkeit (D13, zweite Haelfte).")
Erledigt in Runde 158: Rueckschau (frueher: "Naechste Runde 158: Rueckschau").
Erledigt in Runde 157 (frueher: "Naechste Runde 157: spielziel AC-22, Zeitgrenze als Einstellung (D13).")
(Runde 156 war ein Wunsch des Benutzers dazwischen: der Vorraum fuer den PC,
spielauswahl AC-23. Gespielt wird am PC - neue Oberflaeche wird fuer
1366 x 768 bis 1920 x 1080 gebaut, nicht fuer das Telefon.)
Beim Eroeffnen: keine, 90 oder 120 Spielminuten, Vorgabe keine. Heute steht
`PARTIE_MINUTEN = 90` fest in `welt.js` - das wird `einstellungen.zeitgrenze`
(Steckbrief `server/spiele/strategie/steckbrief.js` wie `buendnisse`).
Vorher suchen, wer an den 90 Minuten haengt: `grep -rn "PARTIE_MINUTEN\|90" tests/ e2e/ scripts/pruefstand*` -
Pruefstand, KI gegen KI und Tests geben ihre Grenze ausdruecklich mit
(Spec). Dann AC-23 (Spielgeschwindigkeit, `takte(einstellungen)` im
Steckbrief). Runde 158 ist die Rueckschau.
Erledigt in Runde 155 (frueher: "Naechste Runde 155: spielziel AC-24, Kuendigung im Bild (D12 zu Ende)."
Der Server ist fertig (AC-21): Nachricht `{ auftrag: 'kuendigen' }`, Antwort
`{}` oder `{ fehler }`; jeder Zustand und Aufbau traegt `bu: [[wer, bis]]`
(bis = Takt des Fristendes, `t` ist der laufende Takt), sobald es eine
Kuendigung gibt. Im Browser zu bauen: (1) Knopf "Bündnis lösen" neben
Aufgeben, fragt einmal zurueck wie Aufgeben (bedienung AC-38), fehlt bei
`buendnisse: 'fest'` und ohne Verbuendeten - pruefen, ob der Browser die
Einstellung `buendnisse` ueberhaupt bekommt (Drahttafel oben in
`e2e/helpers/strategie.mjs`); (2) Ansage oben mit Uhr aus `bis - t`, fuer
alle, dann Meldung "jetzt Gegner"; (3) `ansicht.feindlich` muss `bu`
lesen: ist `t >= bis`, ist `wer` jedem Gegner (rotes Zielzeichen,
`zielzeichenSetzen`); (4) `public/nebel.js` zaehlt den Kuendigenden ab der
Kuendigung (nicht erst nach der Frist) nicht mehr als Sichtquelle - die
Frage dort ist `teiltSicht`, nicht `feindlich`. Browserfall mit
`partieZuDritt(…, { teams: [1, 2, 1] })`, Bild mit Ansage und Uhr.
Erledigt in Runde 154 (frueher: "Naechste Runde 154: spielziel AC-21, Buendnis loesen (D12)." Nur bei
"lösbar": ein Spieler kuendigt einem Verbuendeten, alle sehen die Ansage mit
einer Uhr ueber 60 Sekunden, die gemeinsame Sicht endet sofort, gekaempft
werden darf erst nach Ablauf, in beide Richtungen, nicht zuruecknehmbar; bei
"fest" fehlt der Knopf und der Server weist ab. Zuerst
`grep -n "feindlich\|teams\|sichten" server/spiele/strategie/welt.js` -
`welt.feindlich` ist die eine Stelle; die Teams werden dann veraenderlich
(Frist in Takten, nicht in Uhrzeit), und `welt.sichten` muss das gemeinsame
Sichtobjekt wieder trennen. Kann sein, dass es zwei Runden sind
(Server + Ansage im Bild): dann teilen.
Erledigt in Runde 153 (frueher: "Naechste Runde 153: fahrplan AC-24 fertig machen" - der Browserfall: ein Mensch und
eine KI gegen zwei KIs, eroeffnet mit Teams, bis zur Tafel, die das Team
nennt (wie fahrplan AC-12, `e2e/tests/strategie-partie*.spec.mjs` ansehen).
Der Pruefstand-Teil steht (Runde 151). Die Teams im Browser: Platz 1 der
Mensch, seine KI auf dem Nachbarplatz (zu viert im Quadrat: Platz 1 und 2
sind Nachbarn, 1 und 3 ueber Eck). Achtung Laufzeit: eine Partie zu viert
dauert im Pruefstand 35-52 Spielminuten - im Browser braucht es eine
Spielgeschwindigkeit oder Pruefgriffe (ADR-0013: Geschwindigkeit ist eine
Einstellung - gibt es sie schon? `grep -rn geschwindigkeit server/`).
Messen zwei gegen zwei: `npm run pruefstand:vergleich -- --teams 1,1,2,2
--minuten 90` (neu in Runde 152), und vor jeder Zahl einmal `--gegen HEAD`.
Neue Partietests zu viert gehoeren nach `tests/partien/` (zweiter Abschnitt
von `npm test`, dort keine Zeitmessung - `waechter-testordner`).
Erledigt in Runde 152 (frueher: "Naechste Runde 152: Rueckschau" mit dem
Trace-Fund aus Runde 148) - siehe Erkenntnisse, "Nach Runde 152".
Erledigt in Runde 151 (frueher: "Naechste Runde 151: ki AC-25, die KI im Team" (D11). Die KI greift nur
Gegner an (`welt.feindlich`), waehlt ihr Ziel unter den Gegnern, verteidigt
nicht gegen Verbuendete. Zuerst `grep -n "besitzer\|naechsterGegner\|gegner" server/spiele/strategie/ki.js`.
Beleg im Pruefstand: zwei gegen zwei ueber zwanzig Startwerte, kein Schaden
zwischen Verbuendeten - der Pruefstand braucht dafuer Teams als Option
(fahrplan AC-24 gleich mit). `pruefstand.js` meldet Team-Sieger schon als
"KI 1 + KI 3". **Runde 152 ist Rueckschau** (mit dem Trace-Fund aus Runde 148).
Erledigt in Runde 150 (frueher: "Naechste Runde 150: spielziel AC-20, ein Team gewinnt"; D11; Runde 149
hat AC-19 fertig gemacht, D10 ist durch). Heute endet die Partie, wenn ein
Spieler uebrig ist (spielziel AC-5, `welt.vorbei`, `ende.sieger`); kuenftig,
wenn alle Uebrigen nicht `feindlich` zueinander sind. Gewonnen haben alle
des Teams, auch Ausgeschiedene; die Tafel (AC-8) nennt Team und Spieler -
im Browser `ansicht.endeText` (heute "Du hast gewonnen" / "<Name> hat
gewonnen"). Zuerst `grep -n "sieger" server/ public/ tests/ e2e/` - an
`ende.sieger` haengen Raum (Revanche), KI-Aufgeben (ki AC-19) und Tests.
Bild: Tafel "Team 1 hat gewonnen - Anna, Cem". Danach ki AC-25 und
fahrplan AC-24 (2 gegen 2 im Pruefstand). **Fuer AC-21 (Buendnis loesen)
vormerken:** die gemeinsame Sicht ist ein geteiltes Objekt - beim Loesen
bekommt der Kuendigende ein eigenes, mit einer Kopie von `erkundet`.
Erledigt in Runde 149 (frueher: "Naechste Runde 149: spielziel AC-19, gemeinsame Sicht"; Runde 148 hat
AC-22 und spielziel AC-14 fertig gemacht). Was einer sieht, sehen alle
seines Teams - auf dem Server in `sichtAktualisieren`, `siehtGebaeude`,
`aufbauFuer` und `zustandJeSpieler` (kampf AC-13: der Server schickt nur,
was das Team sieht), im Browser `public/nebel.js` und `ansicht.zuSehen`
(fragt noch `besitzer === this.ich`). Zuerst messen, ob die Sicht je Team
statt je Spieler den Takt verteuert (heute 73-74 ms je 1000 Takte, KI gegen
KI). Bild: Anna sieht im Nebel, was Cems Einheit sieht. Teams im Browser
setzt `partieZuDritt(..., { teams: [1, 2, 1] })`.
Erledigt in Runde 148 (frueher: "Naechste Runde 148: spielauswahl AC-22,
Teams im Warteraum"): der Raum traegt je Platz eine
Wahl weiter, ohne sie zu deuten (ADR-0006) - also im Steckbrief eine
Einstellung je Platz, die der Raum nur durchreicht; der Gastgeber setzt die
der KIs (`ki1`, `ki2` ...). Die Welt liest `einstellungen.teams = { <id>:
1..4 }` (Runde 146). Mit dem Warteraum bekommt spielziel AC-14 sein Bild:
eine eigene Einheit neben der eines Verbuendeten, weisses Zielzeichen statt
rotem (`ansicht.feindlich`). Danach AC-19 (gemeinsame Sicht: `sichten`
je Team, `zuSehen` im Browser fragt noch `besitzer === this.ich`).
Erledigt in Runde 146 (frueher: "Naechste Runde 146: D10 beginnen") - zuerst `welt.feindlich(a, b)` als
die eine Stelle, die "Gegner oder nicht" beantwortet: Teams aus den
Einstellungen (`einstellungen.teams` je Platz), dann jede Stelle, die heute
`besitzer !== ich` fragt (Wache, Tuerme, Befehl/Rechtsklick, Tore, Sicht,
Partieende), auf `feindlich` umstellen - vorher mit `grep -n "besitzer !=="
server/spiele/strategie/welt.js` zaehlen. Ein Waechter, der neue
`besitzer !==` in Kampfregeln beanstandet, waere die Regel statt Fettdruck.
Erster Zuschnitt: spielziel AC-14 (Verbuendete kaempfen nicht) im
Rechenteil, ohne Warteraum - Teams als Einstellung im Test. Danach
spielauswahl AC-22 (Warteraum), dann AC-19 (Sicht). Kampf oder Wissen der
KI aendert sich nicht, solange niemand verbuendet ist: der Vergleich muss
Takt fuer Takt gleich bleiben (`pruefstand:vergleich`, Enden identisch).
ki AC-13 wartet weiter auf die Frage in den Erkenntnissen.
Erledigt in Runde 145 (frueher: "Naechste Runde 145: das ADR fuer Buendnisse, Marktkarren,
Geschwindigkeit und Zeitgrenze** (Antwort (5) in den Erkenntnissen). Ein
neues ADR, das Handelskarren aus "Wird nicht gebaut" in ADR-0012 holt
(entschieden vom Benutzer: Karren ab der Ritterzeit) und spielziel AC-14
ersetzt. Dazu Kriterien in den Specs und Bauabfolge im Fahrplan, kein Code.
Danach Buendnisse bauen. ki AC-13 wartet auf die Frage ganz oben in den
Erkenntnissen (Runde 144: 36 von 40). Wird sie mit "neu fassen" beantwortet,
dann `git merge strategie-ki-sicht`, die Grenze in fahrplan AC-11 und im Test
neu, `suchziel` und die Suche in Gruppen bekommen eigene Tests.
Erledigt in Runde 144 (frueher: "Naechste Runde 144: ki AC-13 einbinden") - den Zweig `strategie-ki-sicht`
mit `git merge` holen (die KI mit eigener Sicht und Spaeher), dann
`pruefstand:vergleich -- --gegen strategie --minuten 90 --saetze 2`;
fahrplan AC-11 muss halten. Danach das ADR fuer Buendnisse, Marktkarren,
Geschwindigkeit und Zeitgrenze (Antwort (5)), dann Buendnisse bauen, dann
Voelker-ADR und Spec-Runde E. Rammen gegen Befestigung (ki AC-23) bleibt
offen. Erledigt in Runde 143 (frueher: "Naechste Runde 143: die Wirtschaft
der KI im Mittelspiel") - neues
Kriterium in `ki.md` (Dorfbewohner nach dem Aufstieg weiter ausbilden bis
Richtung 40-50, Umzug zu neuen Vorraeten), zuerst mit
`pruefstand:verlauf` an den Patt-Startwerten (24, 15) messen, wo es
fehlt; danach die Zweige `strategie-ki-ritterzeit` und `strategie-ki-sicht`
auf diesem Boden einbinden. Stufe E (Voelker-ADR, Spec-Runde) danach. ki AC-21/22 und
AC-13 warten auf die Antwort zum Patt. Erledigt in Runde 136 war auch das Bild zu einheiten
AC-15: die Goldtraeger stehen hinter dem Dorfzentrum und sind nur Umriss,
die Goldbrocken der Unterschrift sieht man nicht (schon im eingecheckten
Bild so, gefunden in Runde 134 mit qa:abweichung).)

## Wo ich stehe

- **Branch:** `strategie`. Nie auf `main` arbeiten, **nie deployen. Pushen nur, wenn der Benutzer da ist** (etwa alle fuenf Runden, `strategie` und geparkte Zweige).
- **Board:** 426 von 555 Kriterien fertig · 1 in Arbeit · 5 in QA · 4 geplant ·
  111 offen · 8 zurueckgestellt. 549 Tests ohne Browser, 185 im Browser.
- **Fuenf Waechter in `tests/waechter-*.test.mjs`** (der fuenfte seit Runde 87: Bildschirmtext mit echten Umlauten): Gleichheit auf wachsenden
  Listen, verbesserbare Werte an `welt.einheitenwert()` vorbei,
  Bildunterschriften mit `${...}`, und (neu in Runde 73) die **Kuerzeltafel**
  in `e2e/helpers/strategie.mjs` gegen `EINHEITEN`. Wer eine neue Regel dieser
  Art aufstellt, legt einen Waechter dazu. Der erste kennt seit Runde 75 auch
  die Fassung auf dem Draht (`werte.einheiten.<art>`) und Namen aus einem
  `const { x, ...rest } = <wachsende Daten>`.
- **Bilder, seit Runde 78:** Aussehen geaendert → **ein** Lauf
  `npm run check:alles:neu:kurz` (schreibt jedes Bild neu, prueft danach ohne
  Browser; 580 s) statt `qa:nachweis` + `check:alles` (18 min). Danach
  **`npm run qa:abweichung`**: listet die geaenderten Bildnachweise nach Anteil
  geaenderter Bildpunkte, Grenze 1 %. Was darueber steht, wird angesehen -
  darunter liegen nur Raumcode, Uhr und Zaehler. PNG liest `scripts/png-lesen.mjs`
  selbst, `tests/png-lesen.test.mjs` haelt ihn richtig.
- **Stufe A ist erreicht** (fahrplan AC-3 bis AC-7).
- **Stufe B ist erreicht** (fahrplan AC-8 bis AC-10, Bauabfolge B1 bis B7).
  Die Feudalzeit ist am Stueck im Browser spielbar:
  `e2e/tests/strategie-feudalzeit.spec.mjs` ist der Pruefstein - und mit
  1,4 min der langsamste Fall im Browserlauf (der dauert jetzt 8,6 min).
- **Die Rueckschau zur Stufe B ist gehalten** (Runde 73). Sie hat den vierten
  Waechter gebracht, zwei Regeln in der Anweisung (Gegenprobe bei Messaufbauten
  ueber viele Laeufe; was im Browser steht, wird im Browser gelesen) und drei
  neue `offen`-Kriterien aus dem Hinsehen: **bedienung AC-35** Kampfwerte an
  der Auswahl, **AC-36** Militaer bei Zoom 1 erkennbar, **AC-37** Spielzeit im
  Bild. Alle drei sind Lesbarkeit, nicht Schoenheit, und passen als Anfang zu
  Stufe C.
- **Stufe C ist spezifiziert** (Runde 74). Die Bauabfolge steht im Fahrplan:
  **C1** die drei Luecken aus der Rueckschau (bedienung AC-35 bis AC-37) ·
  **C2** Partieende rechnet (spielziel AC-5, AC-6, bedienung AC-38) · **C3**
  Abschlussbild, Zuschauen, Revanche (spielziel AC-7 bis AC-9) · **C4** die KI
  kaempft (ki AC-10 bis AC-12, AC-14, fahrplan AC-11) · **C5** Mensch gegen KI
  (spielauswahl AC-18, AC-19, fahrplan AC-12) · **C6** Nebel (kampf AC-11 bis
  AC-14, darstellung AC-15, ki AC-13, fahrplan AC-13).
  Begruendung der Reihenfolge: **das Ende zuerst**, weil ohne Partieende der
  Pruefstand nur Takte misst; **Nebel zuletzt**, weil er die Zustandsnachricht
  umbaut und damit jeden Browsertest beruehrt (heute steht dort „alles", dann
  „was ich sehe").
- **C1 laeuft. `bedienung AC-35` ist fertig** (Runde 75): die Auswahlleiste
  nennt Angriff, Ruestung nah und fern, Reichweite und den Bonus mit seinem
  Ziel. **Wie es gebaut ist, weil es die Vorlage fuer alles Weitere ist:** der
  Server rechnet mit `welt.kampfwerte(besitzer)` eine Tafel
  `art -> {leben, angriff, nahruestung, fernruestung, reichweite}`, allein ueber
  `welt.einheitenwert()`, und schickt sie als `kw` je Spieler - im `aufbau()`
  an alle (damit auch sieht, wer nach einem Abbruch zurueckkommt), im
  `zustand()` nur fuer Spieler in `werteAenderungen` (gesetzt in
  `erforschen()`, geleert am Ende von `zustand()`), dasselbe Muster wie
  `gebaeudeAenderungen`. Im Browser liest `ansicht.einheitenwert(einheit, feld)`
  daraus; `lebenVoll` geht jetzt durch dieselbe Stelle - vorher las es die
  Rohdaten und sah Verbesserungen nicht (latenter Fehler, gefunden beim Bauen).
  **Der Browser summiert nie selbst**: Verbesserungen wirken ueber die
  **Klasse**, nicht die Art. Neu beim Browser ausserdem
  `werte.einheiten[art].klassen`, `.bonus` und `werte.klassen` (Anzeigenamen) -
  die Tafel in `e2e/helpers/strategie.mjs` ist nachgezogen.
- **`bedienung AC-36` ist fertig** (Runde 76): jede Kampfeinheit
  unterscheidet sich bei Zoom 1 **im Umriss** auf mindestens einem Drittel der
  gemeinsamen Flaeche vom Dorfbewohner. Zu wissen, bevor jemand wieder an den
  Figuren zeichnet: **gemessen wird nur der Umriss, und nur in der Hoehe, die
  Zoom 1 gibt** (`figurHoeheBei(1)`, knapp 29 Bildpunkte) - darstellung AC-14
  misst dagegen Umriss **oder** Farbe und herangezoomt. Der Messgriff ist
  `window.schautafel.umrissUnterschied(a, b, hoehe)`, die Schwelle 1/3 wie in
  AC-14, der Test steht in `e2e/tests/strategie-unterscheidbar.spec.mjs`. Wer
  eine Figur aendert, faehrt ihn. **Die Regel dahinter:** was eine Einheit
  kenntlich macht, muss **ausserhalb** ihres Koerperumrisses liegen und
  mindestens anderthalb Einheiten dick sein (ein Strich mit `lineWidth 1.2`
  ist bei Zoom 1 1,4 Bildpunkte und zaehlt praktisch nicht). Gemessen jetzt:
  Miliz 0,401 · Soldat 0,352 · Speerkaempfer 0,371 · Bogenschuetze 0,356 ·
  Plaenkler 0,348 · Spaeherreiter 0,705; schwaechstes Paar untereinander ist
  Miliz gegen Speerkaempfer mit 0,306 (beide tragen links einen Schild) -
  unter AC-14 gemessen sind es 0,568, also keine Gefahr, aber die Stelle, an
  der es als Naechstes eng wird.
- **`bedienung AC-37` ist fertig** (Runde 77), **damit ist C1 abgeschlossen**:
  oben neben dem Zeitalter laeuft die Spielzeit als `m:ss`. Der Server musste
  dafuer nichts lernen - `zustand()` schickt `t: this.takt` seit der ersten
  Stufe, `aufbau()` schickt `takte: TAKTE_PRO_SEKUNDE`. Im Browser steht die
  Rechnung in `ansicht.spielzeit()` (aus `this.takt` und
  `this.takteProSekunde`), geschrieben wird sie in `spielzeitZeigen()` in
  `app.js` bei jedem Zustand - **kein Intervall im Browser**, sonst laeuft die
  Uhr im Zeitraffer falsch. Die Minuten laufen ueber sechzig hinaus
  (`90:00`). Test: `e2e/tests/strategie-spielzeit.spec.mjs`, mit der
  Gegenprobe gewoehnlich gegen Zehnfaches (19 Takte gegen 180 in denselben
  zwei Sekunden Wanduhr).
- **C2 laeuft. `spielziel AC-5` und `AC-6` sind fertig** (Runde 79). **Wie es
  gebaut ist:** entschieden wird in der **Welt**, angehalten wird im **Raum**.
  `welt.endePruefen()` steht am Ende von `takten()` und noch einmal in
  `aufgeben()`; es setzt `welt.ende = {sieger, grund, takt}` (`grund` ist
  `eroberung` oder `zeit`). Ausgeschieden ist, wer weder lebende Einheit noch
  Gebaeude hat - **Farmen zaehlen nicht**, das steht als `bestand: false` in
  `daten.js` (Mauern und Tore bekommen in Stufe D dieselbe Zeile, keine
  Verzweigung). Gezaehlt wird nur, wenn seit dem letzten Mal etwas gefallen
  ist (`bestandPruefen`, gesetzt in `einheitSterben` und `gebaeudeZerstoeren`).
  `raeume.js` kennt davon nichts: es fragt nach jedem Schlag die Eigenschaft
  **`welt.vorbei`** und haelt daran seine Uhr an (ADR-0006) - der letzte
  Zustand ist schon unterwegs und traegt `ende`. `aufbau()` schickt `ende`
  mit, damit auch sieht, wer nach einem Abbruch zurueckkommt.
  **Zu wissen:** eine entschiedene Partie taktet nicht mehr, also bleiben die
  **Gefallenen liegen** (das Aufraeumen nach zwei Sekunden steckt in
  `takten()`) - fuer das Abschlussbild richtig, aber es ueberrascht.
  Unentschieden nach 90 Spielminuten (`PARTIE_MINUTEN`). Im Browser merkt sich
  `ansicht.endeMerken()` das Ende **einmal**, `endeText()` macht daraus "Du
  hast gewonnen" / "<Name> hat gewonnen" / "Unentschieden - 90 Minuten sind
  um", `app.js` stellt es als `#partieende` ins Bild - eine Meldung, die
  **stehen bleibt**. Der Pruefgriff `aufgeben` in `e2e/server.mjs` schickt
  dieselbe Nachricht wie spaeter der Knopf.
- **`bedienung AC-38` ist fertig** (Runde 80), **damit steht C2**. Der Knopf
  sitzt oben rechts in der Kopfzeile (`#aufgeben`), die Rueckfrage ist
  `#aufgebenfrage` - ein Feld ueber dem Spielfeld bei 28 % der Hoehe, damit
  die Basis darunter sichtbar bleibt. Erst der zweite Klick schickt
  `{auftrag: 'aufgeben'}`. **Drei Dinge, die beim Hinsehen herauskamen und
  fuer jede weitere Rueckfrage gelten:** die Klasse `haupt` traegt `flex: 1`,
  der gefaehrliche Knopf waere also der groesste geworden (jetzt
  `flex: 0 0 auto`, Ausweg zuerst); die Kopfzeile nimmt keine Klicks an
  (`pointer-events: none`), ein Knopf darin braucht `pointer-events: auto`;
  und Esc schliesst die Frage ueber einen Lauscher, der **nur offen**
  angemeldet ist und `stopPropagation` ruft - sonst haette dieselbe Taste
  zugleich die Auswahl aufgehoben (bedienung AC-15). Der Knopf verschwindet,
  sobald `ansicht.aus` oder `ansicht.ende` steht; `aus` kommt als `aus: 1` am
  Spieler im Zustand. **Das vierte Ding fand erst `qa:abweichung`:** ein neues
  Teil in der Kopfzeile nimmt einem anderen den Platz. Im 1000-Punkt-Fenster
  von `bedienung AC-36` brach der Bedienhinweis auf fuenf Zeilen um und stand
  als Treppe im Spielfeld. `#hinweis` hat jetzt `white-space: nowrap` und
  verschwindet unter 1340 Punkten (`#kartenwert` erst unter 560). Wer wieder
  etwas in die Kopfzeile legt, rechnet nach: Rohstoffe, Zeitalter, Uhr, Karte
  und Aufgeben brauchen zusammen rund 1260 Punkte. Nur zwei Dateien setzen ein
  schmaleres Fenster - `strategie-unterscheidbar` (1300, 1000) und
  `strategie-bauen` (1200); fuer die reicht danach
  `npm run qa:nachweis -- strategie-unterscheidbar strategie-bauen`.
- **`spielziel AC-7` ist fertig** (Runde 81). Wer ausscheidet, bekommt weiter
  jeden Zustand (der Server schickt allen denselben), `#zuschauer` steht ueber
  dem Bild, und `ansicht.ausMerken()` springt beim Uebergang mit der Kamera
  zur Basis des ersten Spielers, der noch nicht `aus` ist. **Zu zweit ist das
  Kriterium nicht pruefbar** - dort endet die Partie im selben Takt. Deshalb
  gibt es jetzt `partieZuDritt` in `e2e/helpers/strategie.mjs` (beide Wege
  laufen ueber `partieMit`, das die Gaeste nacheinander beitreten laesst);
  `partieBeenden` schliesst `seiten`, nicht mehr `anna`/`bert`.
- **`spielziel AC-8` ist fertig** (Runde 82). **Wie es gebaut ist:** jeder
  Spieler fuehrt in `welt.js` drei Zaehler - `gesammelt` (je Rohstoff),
  `ausgebildet`, `verloren` -, hochgezaehlt in `abladen()`, im Gebaeudetakt
  neben `einheitAnlegen` und in `einheitSterben()`. **Warum waehrend der
  Partie und nicht am Ende:** von einem Ausgeschiedenen steht nichts mehr auf
  der Karte; wer am Ende zaehlt, zaehlt bei ihm null. **Warum beim Abladen und
  nicht beim Aufnehmen:** sonst fuellte eine Ladung die Tafel, die nie ankommt
  - und ein abgebrochener Auftrag gibt Rohstoffe zurueck, ohne dass jemand
  gesammelt haette (beides als Test). `endeSetzen(sieger, grund)` ist die eine
  Stelle, die `welt.ende` schreibt; sie legt die **Abschrift** `tafel` dazu,
  die danach in `zustand()` und `aufbau()` mitreist - auch fuer einen, der
  zurueckkommt. Im Bild: `#abschluss` haelt `#partieende` als Ueberschrift
  (**deshalb haben alle Zusicherungen aus AC-5 und AC-6 den Umbau ueberlebt**),
  darunter `#abschlusstafel` und `#abschlussdauer`; `ansicht.abschlusszeilen()`
  haengt Name und Farbe an, `ansicht.abschlussdauer()` macht aus dem Takt des
  Endes `m:ss`. Zeilen in **Spielerreihenfolge** mit hervorgehobenem Sieger,
  nicht sortiert: eine Rangfolge waere eine Behauptung darueber, was zaehlt.
  `rahmenUmAlle`, `eigeneImBild` und `waldInDerNaehe` sind dafuer aus
  `strategie-spielbild.spec.mjs` in die Hilfe gezogen - der Test spielt erst
  eine Partie, weil eine Tafel voller Nullen nichts belegt.
- **`spielziel AC-9` ist fertig** (Runde 84), **damit steht C3**. **Wie es
  gebaut ist:** die Revanche ist ein **zweiter Start desselben Raums** - kein
  neuer Nachrichtentyp. `raum.starten()` weist einen zweiten Start nur noch ab,
  solange `!welt.vorbei`; danach wirft es die Nicht-mehr-Verbundenen aus der
  Liste (ein Platz ohne jemanden daran waere ein Gegner, der nichts tut),
  raeumt die Uhr ab und erzeugt neu. Damit gelten Gastgeberpruefung,
  Startwertwahl und die Absage "Es fehlen Mitspieler" unveraendert weiter.
  **Der Startwert ist eine Einstellung wie jede andere**: steht er auf
  "zufaellig", ist die Karte neu; steht eine Zahl (wie im Browserlauf: 4711),
  spielen alle dieselbe Karte noch einmal. `beitreten` und `einstellen` bleiben
  gesperrt - dieselben Leute, dieselben Einstellungen.
  **Im Browser war die Arbeit groesser als auf dem Server:** `ansicht.aufbau()`
  setzt jetzt alles zurueck, was einer Partie gehoert - allen voran den
  **Kachel-Zwischenspeicher des Bodens** (`this.kacheln`, nach Feldkoordinate
  abgelegt; auf einer neuen Karte haette er das alte Gelaende gezeigt), dazu
  Auswahl, Zielzeichen, Angriffslauf, Untaetige, Verbesserungen, Takt,
  **Zeitalter** (sonst meldet der erste Zustand einen Wechsel zurueck in die
  Dunkle Zeit), `ende` und `aus`; und es ruft `beiFeldern()`, damit die
  Uebersichtskarte ihr Gelaende neu malt. In `app.js` raeumt
  `partieraumAufraeumen()` das Abschlussbild weg und setzt die Rohstoffleiste
  zurueck (sonst zaehlt sie vom Stand der alten Partie herunter).
  **`binGastgeber` wird aus der `raum`-Nachricht gemerkt** - im Spiel kommt
  keine mehr. Der Gast bekommt keinen Knopf, sondern den Satz "Der Gastgeber
  kann eine Revanche starten": ein Knopf, der mit einer Absage antwortet, waere
  schlimmer als keiner.
  **Gelernt, fuer jedes weitere Feld im Abschlussbild:** der Kasten waechst mit
  jeder Zeile nach unten, und die neue Zeile lag genau auf den Gefallenen im
  Bild von `spielziel AC-6`. Der Test setzt die Kamera jetzt tiefer und
  **zaehlt**, wie viele Gefallene frei unter der Tafel liegen.
- **`ki AC-11` ist fertig** (Runde 85), **damit hat C4 begonnen**. **Wie es
  gebaut ist:** `Ki.heerPruefen()` laeuft in jeder Entscheidung (alle 0,5 s).
  Sind mindestens `HEER + WACHE` = 10 Kampfeinheiten daheim, schickt sie die
  acht, die der eigenen Basis am **weitesten** stehen - die zwei naechsten
  bleiben. Befohlen wird ueber `welt.nachricht` wie bei jedem Menschen:
  `{auftrag:'befehl', einheiten:[…], ziel:<freies Feld>, angriffslauf:true}`.
  **Das Marschziel ist ein freies Feld vier Felder vor dem fremden
  Dorfzentrum, nicht das Gebaeude selbst** - ein Befehl auf ein fremdes
  Gebaeude ist in `welt.befehl` ein Angriff auf genau dieses Gebaeude und
  setzt `angriffslauf` gar nicht erst. Am Ziel angekommen, setzt
  `heerPruefen` nach: wer steht und keinen Auftrag hat, bekommt das
  Dorfzentrum als Ziel. Noetig ist das, weil `welt.wacheTakten()` einem
  Angriffslauf nur **Einheiten** in Sichtweite gibt, keine Gebaeude.
  `this.heer` merkt sich, wer schon unterwegs ist (und vergisst Tote), damit
  der Aufbruch nicht in jeder Entscheidung von vorn beginnt.
  **Gemessen** (`npm run pruefstand:strategie`, jetzt mit `angriffe` und
  `angriffMinute` in den Kennzahlen): ueber zwanzig Startwerte greift jede KI
  an, die erste zwischen Spielminute **17,5 und 19,8** (Median 18,1). Die
  Vorgabe des Pruefstands steht deshalb auf **22 Minuten** (vorher 16).
  **Zwei Fehler im Kampf lagen seit Stufe B darunter**, beide in `welt.js`,
  beide mit eigenem Test unter `kampf AC-1`: (1) `angriffsfelder` verteilte
  nur innerhalb **eines** Befehls - wer einzeln nachkam (und genau das tut die
  KI am Dorfzentrum), bekam dasselbe Feld noch einmal; jetzt streicht
  `angriffsfelderOhneBesetzte` die Felder, auf die schon jemand zugeht.
  (2) `auftrag.angekommen` wurde gesetzt, **bevor** geprueft war, ob die
  Einheit noch laeuft - ein Nahkaempfer blieb am ersten Punkt in Reichweite
  stehen. Der Fix gilt **nur bei Gebaeuden als Ziel**: weit gefasst kippte er
  den Konterkreis (Spaeherreiter gegen Bogenschuetze 20/20 → 14/20). Wer am
  Kampf etwas aendert, faehrt `npm run konterkreis:strategie`.
  **Fuer den Bildnachweis**: ein Bild vom Sturm auf das Dorfzentrum gibt es
  nicht - die Angreifer stehen hinter dem Gebaeude und werden als Umriss
  gezeichnet. Das Bild ist der **Marsch**, vierzig Felder vom eigenen Dorf.
  Und der Spaeherreiter laeuft doppelt so schnell wie eine Miliz: von einem
  geschlossenen Verband darf keine Unterschrift sprechen.
- **`ki AC-14` ist fertig** (Runde 86). **Wie es gebaut ist:**
  `Ki.verteidigenPruefen()` laeuft in jeder Entscheidung hinter
  `heerPruefen()`. Die KI bekommt **keine Meldung** - sie haelt in `this.leben`
  die Lebenswerte ihrer Einheiten und Gebaeude der letzten Entscheidung und
  sieht beim naechsten Mal, was fehlt. Gezaehlt wird nur, was **Gebaeude** und
  **Dorfbewohner** verlieren; ein Heer, das unterwegs Schlaege einsteckt, holt
  die Wache nicht quer ueber die Karte (eigener Test). Angriffsort ist das
  getroffene Ding, das der eigenen Basis am naechsten steht. Dorthin zieht
  jede Kampfeinheit, die nicht im Heer ist, weiter als `WACHE_NAH` = 3 Felder
  weg steht und nicht schon angreift - im **Angriffslauf**, nicht als Angriff.
  Der getroffene Dorfbewohner bekommt einen Befehl zum Dorfzentrum: ohne ihn
  bliebe er stehen und schluege zurueck (kampf AC-2), und mit Angriff 3 und
  ohne Ruestung ist das ein toter Dorfbewohner (kampf AC-5).
  **Die Falle, die vier gruene Node-Tests nicht gefunden haben:**
  `freiesFeldUm()` waehlte das naechste freie Feld am Angriffsort - lag es
  neben dem Angreifer, machte `welt.befehl` daraus einen Angriff auf genau
  diese Einheit, denn `feindAn` zieht einen Feind im Umkreis von **1,01
  Feldern** unter den Klick (kampf AC-1). Fiel sie unterwegs, blieb die Wache
  stehen, wo sie war. In den Node-Tests kam die Wache von der anderen Seite
  des Dorfzentrums, im Browser aus derselben Richtung wie der Angreifer.
  Das Marschziel haelt jetzt `FEIND_FERN` = 1,5 Felder Abstand von jedem
  Feind. **`freiesFeldUm(um, von, {feindFern, vergeben, rundumFrei, ausser})`**
  kennt seitdem vier Regeln, jede mit eigenem Test samt Gegenprobe: Abstand von
  Feinden; Abstand `VERGEBEN_ABSTAND` = 2 von Zielen derselben Entscheidung;
  fuer eine Gruppe freie Nachbarfelder (mit Rueckfall ohne, wenn das Dorf voll
  steht); und eigene Laufziele gelten als belegt - **ausser** denen, die gerade
  neu beauftragt werden, sonst springt das Ziel einer laufenden Wache bei jedem
  Treffer. Im Server bekommt ein Angreifer um ein **Gebaeude** kein Feld, auf
  dem jemand stillsteht (`angriffsfelderOhneBesetzte`; nur bei Gebaeuden, der
  Konterkreis haengt an Gefechten zwischen Einheiten). `angriffBeginnen` gibt
  jetzt auch die Farm frei.
  **Fuer den Bildnachweis:** festgehalten wird der **Weg**, nicht sein Ende,
  und angegriffen wird ein **Haus abseits**, zwanzig Felder oestlich des
  Dorfzentrums (Pruefgriff `gebaeude`), nicht das Dorfzentrum selbst: dort
  stand im Gedraenge aus Schlachtern, Abladenden und Geflohenen in jedem
  dritten Lauf eine Figur auf einer anderen (einheiten AC-29 ist offen). Das
  Bild steht, wenn die Wache noch 4 bis 14 Felder vom Haus entfernt allein auf
  der Wiese steht; zehn Laeufe hintereinander gruen. Annas Trupp sind
  **vier** Milizen: eine einzelne faellt, und dann zeigt das Bild einen
  Angriff ohne Angreifer.
- **Der Gefechtsstand** (neu in Runde 71) steht in
  `server/spiele/strategie/pruefstand.js` als `gefechtSpielen`:
  `npm run konterkreis:strategie` stellt zwei Heere gleicher Kosten auf freiem
  Grund gegenueber und laesst sie aufeinander laufen. Wer an Angriff,
  Ruestung, Bonus, Nachladezeit oder Tempo dreht, faehrt ihn danach - 0,2 s
  fuer 160 Gefechte. Zu wissen: der Startwert verschiebt die Heere quer
  (bis drei Felder), sonst waere auf freiem Grund jedes Gefecht dasselbe.
- **Neu offen aus Runde 69: ki AC-10** - jenseits der zehnten Spielminute steht
  ein Dorfbewohner bis zu acht Minuten still (gemessen 290 s bei 16 min, 483 s
  bei 20 min). Aelter als Runde 69, nur nie gemessen, weil der Pruefstand bei
  zehn Minuten endete. Ursache und Hebel stehen in den Erkenntnissen unter
  **Offene Faeden**.
- **Naechste Rueckschau: Runde 163** - oder frueher, wenn Stufe D (mit D10 bis D14) erreicht wird. (Runde 158 war die letzte.)
  Diese Zeile ist der Termin, nicht nachzaehlen.
- Frueherer Termin, erledigt: **Runde 83** (die Bildnachweise einmal ganz
  angesehen), **Runde 78** (Bilderwerkzeug: `check:alles:neu`,
  `qa:abweichung`, der Pruefgriff dokumentiert statt geaendert) und **Runde 73**
  (die Rueckschau zur Stufe B) - nicht
  nachzaehlen. Die Rueckschauen 55 und 60 sind ausgefallen, weil nach der
  Rueckschau zur Stufe A niemand mehr gezaehlt hat (Rueckschau nach Runde 65).
  Wer eine Rueckschau haelt, traegt hier die naechste Nummer ein.

## Was B6 gebracht hat (zum Weiterbauen wissen)

- **Die KI steigt selbst auf (ki AC-9).** `Ki.feudalzeitPruefen()` bestellt den
  Aufstieg, sobald 22 Dorfbewohner stehen, das Dorfzentrum **frei** ist, 500
  Nahrung da sind und `welt.gebaeudeDerZeit(spieler) >= 2`.
  `Ki.militaerPruefen()` baut danach eines aus `MILITAER`
  (`['schiessanlage','stall']`, Wahl nach Gold) und haelt bis dahin 175 Holz
  zurueck - sonst verbauen die Farmen es.
  `Ki.naechsteKampfeinheit(gebaeude)` liest aus `GEBAEUDE[art].bildetAus` die
  erste Art, die ihr Zeitalter erreicht hat und bezahlt ist: **eine neue
  Einheit spaeterer Stufen benutzt die KI ohne Code-Aenderung.**
- `ki.feudalTakt` haelt fest, wann die Feudalzeit stand; `kennzahlen()` im
  Pruefstand meldet `zeitalter`, `feudalMinute` und `kampf` (Einheiten ohne
  die Klasse `dorf`). Die Vorgabe von `npm run pruefstand:strategie` ist
  **16 Minuten**, damit der Aufstieg in jedem Lauf vorkommt.
- **Die Hilfe `kiSpielt(page, code, name)`** (`e2e/helpers/strategie.mjs`)
  laesst die KI einen Spieler im Browser uebernehmen - damit entsteht das Bild
  zu ki AC-9 in `e2e/tests/strategie-ki.spec.mjs` (45 s, der langsamste Fall).
- **Ein Kriterium, das Vorrat misst, wird falsch, sobald jemand ihn ausgibt.**
  `fahrplan AC-5` misst seit Runde 69 den **hoechsten** Nahrungsvorrat in den
  zehn Minuten, nicht den am Ende.

- **Ein Schluessel in `VERBESSERUNGEN[x].wirkung` ist eine Einheitenart oder
  eine ihrer `klassen`** (`dorf`, `infanterie`, `kavallerie`, `speer`,
  `bogenschuetze`). `wirkungsschluessel(art)` in `welt.js` liefert beides,
  **dedupliziert** - `bogenschuetze` ist Art und Klasse zugleich.
- **`welt.einheitenwert(besitzer, art, feld)` ist die eine Stelle**, die einen
  Wert einer Einheit mit allen Verbesserungen liest (Leben, Angriff,
  Ruestung, Reichweite). Wer `EINHEITEN[art].angriff` direkt liest, uebersieht
  die Verbesserungen - genau so war die Ruestung aus dem Webstuhl seit
  bauen AC-21 wirkungslos.
- Dazu `welt.sammelrate(besitzer, rohstoff, grundrate)` (Faktor, Doppelaxt)
  und `welt.farmNahrung(besitzer)` (Zuschlag, Pferdekummet); im Browser
  `ansicht.farmVoll(gebaeude)` fuer die Zeile "noch n Nahrung von m".
- Die Bildchen der Verbesserungen kommen aus `ZEICHEN` in
  `public/auswahlleiste.js`; welches, steht als `zeichen` in den Daten. Eine
  neue Verbesserung ohne `zeichen` bekaeme wieder den Webstuhl.

## Was B5 gebracht hat (zum Weiterbauen wissen)

- **Der Angriffslauf (kampf AC-4):** `G` schaltet die Betriebsart ein
  (`ansicht.angriffslauf`, Zeiger `cursor: cell` ueber `canvas.angriffslauf`),
  der naechste Rechtsklick schickt `{ typ:'befehl', …, angriffslauf: true }`.
  Der Server merkt das Marschziel in `einheit.angriffslauf` und laesst
  `wacheTakten()` die Einheit **auch im Gehen** suchen; `marschFortsetzen()`
  setzt den Marsch nach jedem Gefecht fort. Nur Einheiten mit `angriff > 0`
  laufen an; Sammeln und Bauen sind im Angriffslauf abgeschaltet.
- **`einheit.auftrag` wird am Ziel geleert.** Ein erledigter `gehen`-Auftrag
  blieb bis Runde 67 haengen - und die Wache ueberspringt jede Einheit mit
  Auftrag. Wer einmal irgendwohin geschickt wurde, wehrte sich nie wieder.
  Der neue `'gehen'`-Zweig in `einheitTakten` raeumt beides auf.
- **Waechter desselben Ziels verteilen sich** (`felderJeZiel` in
  `wacheTakten`): `angriffsfelder` + `naechstesFreies` wie beim befohlenen
  Angriff, und Plaetze, die laufende Angreifer schon halten (`auftrag.platz`),
  gelten als belegt.

## Was B2 und B3 gebracht haben (zum Weiterbauen wissen)

- `daten.js`: `ZEITALTER` (vier Stufen, mit `genitiv` fuer Meldungen) und
  `AUFSTIEGE` (`feudalzeit`/`ritterzeit`/`imperialzeit` mit `stufe`, `kosten`,
  `zeit`, `voraussetzung`). Das Dorfzentrum bildet alle drei aus; der Browser
  zeigt nur den naechsten.
- **Ein Gebaeude ohne `zeitalter` gehoert der Dunklen Zeit (Stufe 0).**
  Schiessanlage, Stall und Schmiede tragen `zeitalter: 1`. **An diesem einen
  Feld haengt die ganze Sperre**: `welt.bauen()` weist ab, `bauplan()` im
  Browser laesst sie aus dem Menue, und zwei aeltere Tests filtern danach
  (bedienung AC-25, fahrplan AC-3).
- `welt.js`: `spieler.zeitalter`, `ohnePlatz(art)`, `gebaeudeZeitalter(art)`,
  `gebaeudeDerZeit(spieler)`, `GEBAEUDE_NAMEN` fuer Meldungen. Im Zustand je
  Spieler `z` (nur wenn > 0), im Aufbau `werte.zeitalter`, `werte.aufstiege`
  und `zeitalter` je Gebaeudeart.
- Browser: `ansicht.zeitalter`, `ansicht.zeitalterName()`,
  `ansicht.beiZeitalter(stufe, name)`; `#zeitalter` in der Kopfzeile,
  `#zeitalterwechsel` als grosse Ankuendigung; in der Auswahlleiste
  `aufstiegBildchen`, `data-aufstieg`, `data-laufender-aufstieg`.
- `tasten.js`: **neun Bautasten** `q w e r t z u i o`. Wer ein Gebaeude
  hinzufuegt, braucht eine Taste mehr.
- Der **Stall bildet den Spaeherreiter aus** (80 Nahrung, 30 s) - die erste
  Einheit, die gebaut statt mitgeliefert wird.
- **Entschieden:** die Voraussetzung „zwei Gebaeude der Dunklen Zeit ausser
  Haeusern" zaehlt **das Dorfzentrum mit** (in bauen AC-23 notiert).

## Was B4 bisher gebracht hat (einheiten AC-23)

- **Drei neue Einheiten** in `daten.js`, alle mit `zeitalter: 1`:
  Speerkaempfer (35 N, 25 H, 22 s, Kaserne), Bogenschuetze (25 H, 45 G, 35 s)
  und Plaenkler (25 N, 35 H, 22 s, beide Schiessanlage).
- **Jede Einheit traegt jetzt Kampfwerte**: `angriff`, `nahruestung`,
  `fernruestung`, `reichweite`, `klassen` und `bonus`. Der Bonus zielt auf
  eine **Klasse**, nicht auf eine Art - Speer schlaegt `kavallerie`, Bogen
  schlaegt `speer`, Plaenkler schlaegt `bogenschuetze`. **Gekaempft wird noch
  nicht**; das ist B5.
- **Die Sperre bis zur Feudalzeit haengt an zwei Stellen**: `welt.ausbilden()`
  weist ab (mit `EINHEIT_NAMEN` im Akkusativ fuer die Meldung), und
  `auswahlleiste.angebot()` laesst die Einheit aus dem Menue. Damit der
  Browser das kann, steht `zeitalter` seit dieser Runde **im Aufbau**
  (`welt.aufbau()`), zusammen mit den Kampfwerten.
- **Drei Figuren** in `public/figuren.js` (`speerkaempfer`, `bogenschuetze`,
  `plaenkler`), drei Eintraege auf der Schautafel. `kopf()` kennt jetzt
  `kappe` - ohne das trug der Speerkaempfer den Strohhut des Dorfbewohners.
- Gemessen: alle 21 Figurenpaare ueber 0,53 (Grenze ein Drittel), fast
  schwarz 0 / 1,4 / 0 %.

## Was B4 noch gebracht hat (einheiten AC-24)

- **Zwei Arten von Verbesserung.** `wirkung` wertet eine Einheit auf (Webstuhl),
  `wandelt` **tauscht sie aus** (`soldatenstufe`: `{ miliz: 'soldat' }`). Wer
  eine Wandlung baut, denkt an drei Stellen: die stehenden Einheiten, die
  **Warteschlangen der Gebaeude** und das Angebot im Browser.
- `EINHEITEN.soldat` traegt `stufeVon: 'miliz'`. Daran haengt alles:
  `welt.ausbilden()` nimmt die Grundstufe fuer `bildetAus`, fragt
  `einheitenStufe(spieler, grund)` und bildet das Ergebnis aus - der Browser
  darf weiter „miliz" schicken. `STUFE_DURCH` (aus `wandelt` umgedreht) gibt
  der Absage den Namen der noetigen Verbesserung.
- **Eine Verbesserung kann ein Zeitalter verlangen**: `zeitalter: 1` auf der
  Verbesserung, geprueft in `ausbilden()` und gefiltert in
  `auswahlleiste.angebot()`.
- **Das Bild einer Verbesserung** kommt aus `verbesserungBildchen()`: wer
  wandelt, zeigt die neue Einheit, sonst den Webstuhl. Vorher bekam **jede**
  Verbesserung den Webrahmen.
- Figur: `soldat` in `figuren.js` mit **Topfhelm** (neue Kopfoption
  `topfhelm`, deckt das Gesicht zu und zeichnet deshalb kein Auge),
  Kettenhemd, kurzem Waffenrock und zweihaendiger Streitaxt. Alle 28
  Figurenpaare ueber 0,60.

## Was B5 bisher gebracht hat (kampf AC-1, AC-6, AC-7, AC-8, AC-10)

- **Der Angriff ist kein eigener Befehl.** `welt.befehl()` liest wie bisher
  aus dem geklickten Feld, was zu tun ist; neu zuerst `feindAn(spielerId, x, y)`
  (fremde, lebende Einheit hoechstens ein Feld vom Klick) und ein fremdes
  Gebaeude unter dem Klick. Der Auftrag heisst
  `{ art: 'angreifen', ziel: <id>, gebaeude: true|false }` - **die Nummer, nicht
  der Platz**, denn das Ziel laeuft weg.
- **`angriffTakten()` geht dem Laufen vor** (in `einheitTakten` ganz oben, nach
  der Pruefung auf Tote): wer in Reichweite ist, schlaegt zu, statt seinen Weg
  zu Ende zu gehen.
- **Nahkaempfer gehen ihren zugewiesenen Platz zu Ende, Fernkaempfer halten in
  Reichweite.** Ohne das standen drei Angreifer dort, wo der erste nah genug
  war - im Bild eine Figur mit drei Schwertern. Die Plaetze kommen aus
  `angriffsfelder(ziel, n, istGebaeude)` = `aufstellungUm` ohne das Zielfeld.
- **`schaden(angreifer, ziel, istGebaeude)`** ist die eine Formel:
  `max(1, angriff - (reichweite ? fernruestung : nahruestung) + bonus auf eine
  klasse)`. **Gebaeude tragen jetzt auch Ruestung**: in `daten.js` bekommt jedes
  per Schleife `nahruestung: 0`, `fernruestung: 7`, `klassen: ['gebaeude']`.
- **Schlaege werden am Ende des Takts abgerechnet** (`this.schlaege`,
  `schlaegeAbrechnen()` nach der Einheitenschleife). Nur so sterben zwei
  Einheiten, die einander den letzten Schlag versetzen, beide.
- **Tod:** `einheitSterben()` setzt `tot = true` **und** `gefallen = takt` -
  ein Takt allein taugt nicht als Schalter, Takt 0 ist falsy. Ein Toter zaehlt
  nicht zur Bevoelkerung, nicht als untaetig, nicht als Ziel; nach
  `TOT_SEKUNDEN` (2) nimmt ihn `einheitTakten` aus der Karte. Im Zustand
  `s: 1`; der Browser legt ihn um (`rotate(-1.45)`, Alpha 0,65), nimmt ihn aus
  der Auswahl und zeichnet ihn unter den Lebenden.
- **Ein Gebaeude mit 0 Leben** wird geloescht, `freigeben()` gibt die Felder
  frei, `gebaeudeGeaendert` schickt `{ weg: true }`.
- **Neuer Pruefgriff:** `zeitraffer(page, code, 0)` **haelt die Welt an** (der
  Zustand geht weiter). Damit laesst sich ein Augenblick festhalten, der im
  Spiel zwei Sekunden dauert.

## Was B5 noch gebracht hat (kampf AC-2, AC-3, AC-5, einheiten AC-25)

- **Die Wache** (`wacheTakten()`, aufgerufen in `takten()` alle `WACHE_TAKTE`
  = 5 Takte, also zweimal je Sekunde): jede Einheit **ohne Auftrag und ohne
  Weg**, deren Daten `wacht: true` sagen, greift den naechsten Feind in ihrer
  `sicht` an. Gesucht wird ueber `einheitenRaster()` (Zellen zu
  `RASTER_FELDER` = 8, eigene Zelle plus acht Nachbarn) - nicht ueber alle
  Einheiten, sonst waere es Einheiten mal Einheiten.
- **`wacht` steht in den Daten**, nicht in der Simulation: `daten.js` setzt es
  am Ende der Tabelle per Schleife auf `angriff > 0`, der Dorfbewohner hat
  ausdruecklich `wacht: false`. Eine neue Kampfeinheit braucht keinen Eintrag.
- **Gegenwehr:** `schlaegeAbrechnen()` ruft fuer jedes **ueberlebende** Opfer
  `wehren(ziel, angreifer)`. Wer nicht wacht (der Dorfbewohner) bekommt dadurch
  einen Angriffsauftrag auf seinen Angreifer. Deshalb traegt jeder Schlag jetzt
  auch den `angreifer`.
- **Verfolgungsgrenze:** Ein Auftrag, den niemand befohlen hat, traegt
  `heimat` (das Feld, auf dem die Einheit stand). `angriffTakten` bricht ab,
  sobald die Einheit weiter als `VERFOLGUNG_FELDER` = 5 davon entfernt ist, und
  laeuft zurueck. **Ein Rechtsklick setzt kein `heimat`** - ein befohlener
  Angriff folgt beliebig weit.
- **Der Platz am Ziel wandert mit:** Der Auftrag merkt sich `platz` als
  **Versatz** `{dx, dy}` zum Zielfeld, nicht als Feld. `angriffsplatz()` nimmt
  ihn beim Neusuchen wieder - aber nur im Ring 1 (|dx|,|dy| <= 1), sonst wie
  bisher `nachbarfeld`. Ohne das stehen zwei Angreifer eines laufenden Ziels
  wieder auf einem Fleck.
- **`auftrag.angekommen`:** Die Regel aus Runde 63 (ein Nahkaempfer geht seinen
  Platz zu Ende) gilt nur beim **ersten** Hinlaufen. Wer einmal in Reichweite
  war, schlaegt zu, sobald er wieder nah genug ist - sonst laufen zwei, die
  einander jagen, ewig aneinander vorbei.
- **Gemessen:** Takt mit 832 Milizen 0,11 ms in Ruhe, 0,53 ms, wenn acht Heere
  auf einem Haufen kaempfen (Grenze 10 ms, `tests/strategie-tempo.test.mjs`).
  Pruefstand unveraendert: 22 Dorfbewohner, 0,008 ms je Takt.

## Was als Naechstes kommt

Der Rest von B5 ist **kampf AC-4**: der Angriffslauf - ein Befehl auf ein
leeres Feld, bei dem unterwegs alles angegriffen wird, was im Weg steht. Er
braucht eine zweite Betriebsart im Browser (Taste, dann Klick) - das erste Mal,
dass ein Befehl nicht aus dem geklickten Feld gelesen werden kann. Das Zeichen
am Ziel steht schon (bedienung AC-34, Runde 66) und sollte den Angriffslauf
mitnehmen: `zielzeichenSetzen` kennt bisher nur das, was unter dem Klick
steht.

Offen daneben und in der Rueckschau nach Runde 65 **gemessen**: **einheiten
AC-29** (keine zwei Einheiten uebereinander). Zwei von drei Angreifern standen
0,27 bis 0,39 Felder auseinander - die Verteilung um das Ziel aus Runde 63 haelt
nicht mehr, seit sich Verteidiger von selbst bewegen, und `nachbarfeld` fragt
nur die Karte, nicht die Einheiten. `figurenFrei(page)` aus
`e2e/helpers/strategie.mjs` misst es; die Pruefung steht in
`e2e/tests/strategie-kampf.spec.mjs` bei `kampf AC-1` auskommentiert bereit und
wird scharf, sobald AC-29 gebaut ist.

Danach: **B6** Verbesserungen (bauen AC-25, AC-26, ki AC-9) · **B7**
Gleichgewicht messen (fahrplan AC-8 bis AC-10).

## Die Regeln, die ich am ehesten vergesse

1. **`fertig` verlangt dreierlei:** gebaut, ein **Testname** mit `<kuerzel>
   AC-<n>`, und **ein Bild oder eine Begruendung** in `qa/ohne-bild.json`. Eine
   Begruendung nennt, *was* das Kriterium ist und *warum* ein Bildschirm es
   nicht zeigen kann — „nicht sichtbar" ist keine.
2. **Ein Test, der zwei Kriterien belegt, braucht zwei Bildnachweise** (oder je
   eine Begruendung), sonst beanstandet das Board.
3. **Nummern werden nie neu vergeben und nie umsortiert.**
4. **Bildschirmtexte mit echten Umlauten**, Bezeichner und Testnamen ohne
   (`Raeume`, `zurueck`).
5. **Befehle nie mit `;` verketten** — erst „fail 0" lesen, dann committen.
6. **Commit-Text endet mit** `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.
7. **Jede Abschlussnachricht verlinkt zwei bis drei Bilder** aus
   `qa/bildnachweise/…` (stehender Wunsch des Benutzers).
8. **Kein Material aus dem Original, kein „Age of Empires" im Spiel**
   (ADR-0012). Das Vorlagenbild des Benutzers ist Massstab, nicht Vorlage zum
   Abzeichnen, und wird nie eingecheckt.
9. **Vor jedem Vorschlag, der Umfang hinzufuegt:** in die Tabelle „Wird nicht
   gebaut" in ADR-0012 sehen.

## Fallen, die schon einmal Zeit gekostet haben

- **Zeitmessungen reissen unter Last.** `karte AC-15` und `karriere AC-7`
  messen deshalb den schnellsten von mehreren Durchgaengen. Wer eine neue
  Zeitmessung schreibt, macht es genauso — und senkt nie die Schwelle.
- **Wachsende Listen nicht auf Gleichheit pruefen**, sondern auf „enthaelt"
  (bedienung AC-24 riss daran).
- **`sicht --messen` misst nur JavaScript-Zeit, nicht die Bildrate.** Fuer die
  Bildrate `tests/strategie-tempo.test.mjs` bzw. den Browsertest.
- **Feste Bedienteile koennen sich ueberdecken** (Auswahlleiste unter der
  Uebersichtskarte, eine Runde unbemerkt). `bedienteileFrei(page)` in
  `e2e/helpers/strategie.mjs` prueft das.
- **Bildunterschriften luegen leicht** („alle drei im Wald", wenn zwei zu sehen
  sind). Jedes Bild ansehen, bevor es als Nachweis gilt.
- **Ersetzungen per Skript treffen mehr als gedacht** (gleicher Codeabschnitt
  in zwei Figuren). Auf den Funktionsausschnitt begrenzen.
- **Doppelte Deklaration beim Destrukturieren** in `ansicht.js` (`holz` gab es
  schon) — die Rohstoff-Zaehler heissen deshalb `amHolz`, `anNahrung`,
  `amGold`, `amStein`.
- **Einen Dorfbewohner im Zeitraffer anklicken geht schief** (Runde 58): das
  Ziel laeuft zwischen Messen und Klick weg, und wer hinter einem Gebaeude
  steht, ist seit B1 nur ein Umriss — der Klick trifft das Gebaeude.
  `dorfbewohnerAnklicken(page, { ohne, code, raffer })` loest beides; mit
  `code` haelt es die Zeit an. Nie ohne `code` im Zeitraffer aufrufen.
- **Der Browserlauf lief in die Ratengrenze von Better Auth** („Too many
  requests"), als er laenger wurde. Der Testserver (`e2e/server.mjs`) setzt sie
  jetzt weit, wie schon `schutz`; die echten Werte prueft
  `tests/konten.test.mjs`. Wer den Lauf stark verlaengert, prueft das erneut.
- **Bildnachweise werden nur geschrieben, wenn sie fehlen** (ADR-0011). Ein
  bestehendes Bild erneuert nur `QA_NACHWEIS=1 npx playwright test …`. Wer ein
  Aussehen aendert und dann das alte Bild ansieht, sucht lange (Runde 59).
- **Ein neues Gebaeude oder eine neue Figur misst sich gegen alle alten:**
  `npm run tafel -- "t.unterschiede('gebaeude')"` bzw. `('figur')`, jedes Paar
  ueber einem Drittel (darstellung AC-14). Und `t.anmutung(...)`: **„fast
  schwarz" heisst hoechster Kanal unter 50** und trifft auch das dunkle Ende
  eines Verlaufs - hoechstens 3 % (darstellung AC-13). `t.gebaeudeMaske(...)`
  gibt `oben`, das unter 60 liegen muss (darstellung AC-4): ein Gebaeude hat
  einen Koerper, nur die Farm nicht.
- **Ein neues Feld in `EINHEITEN` oder `GEBAEUDE` reisst jeden Test, der die
  Werte auf Gleichheit prueft** (Runde 60: `bedienung AC-29` und
  `einheiten AC-19`). Die Regel „wachsende Listen auf enthaelt pruefen" gilt
  genauso fuer wachsende **Objekte**.
- **Eine Regel an einem Datenfeld wirkt nur, wenn das Feld beim Browser
  ankommt.** `zeitalter: 1` stand in `daten.js`, fehlte aber in
  `welt.aufbau()` - der Server wies den Speerkaempfer in der Dunklen Zeit ab,
  das Menue bot ihn trotzdem an (Runde 60).
- **`ansicht.ausgewaehlt` haelt den Schluessel der Map `nachher`**, nicht
  `einheit.id`. Wer im Test eine Auswahl von Hand setzt, nimmt
  `[...a.nachher.entries()]` - mit `e.id` waehlt man nichts aus.
- **Die Messung findet keine Peinlichkeit, nur das Auge** (Runde 60): alle
  Paare lagen ueber einem Drittel, waehrend der Plaenkler seinen Speer quer
  durchs Gesicht warf. Fuer das Hinsehen
  `npm run sicht -- --ausschnitt x,y,b,h --lupe 3` - 92 Bildpunkte je Figur
  auf der ganzen Schautafel reichen nicht.
- **Was fuer genau eine Sache fest verdrahtet ist, faellt beim zweiten auf**
  (Runde 61): jede Verbesserung bekam das Bild des Webstuhls, weil es nur
  eine gab. Beim Hinzufuegen der zweiten erst im Bild gesehen.
- **Eine schraege Waffe in einem eigenen, gedrehten Rahmen zeichnen**
  (`stift.save(); translate(fuss); rotate(winkel);` dann Stiel und Blatt
  senkrecht, `restore()`). Punkte auf einer schraegen Linie von Hand zu
  rechnen ging in Runde 61 schief - das Axtblatt hing neben dem Stiel.
- **Ein Takt als Schalter ist im ersten Takt falsch** (Runde 63):
  `einheit.tot = this.takt` war `0` und damit falsy. Schalter und Zeitpunkt
  trennen.
- **Wer in einer Schleife ueber Einheiten sofort Schaden verrechnet, gibt dem
  Ersten den Vorrang** (Runde 63). Wirkungen eines Takts sammeln und am Ende
  abrechnen.
- **Ein Auftrag ist auch eine wachsende Liste** (Runde 64): das
  `deepEqual(auftrag, { art, ziel, gebaeude })` in kampf AC-1 brach, sobald
  `platz` dazukam - dieselbe Falle wie `GEBAEUDE.farm` in Runde 63. Auftraege
  Feld um Feld pruefen.
- **Wer Einheiten von selbst handeln laesst, bricht Tests, deren Aufbau ein
  stillhaltendes Ziel annahm** (Runde 64): mit der Wache wehrt sich das Ziel,
  laeuft los, und `warte, bis alle ihren Weg zu Ende haben` trifft einen
  Augenblick, in dem niemand da ist. Auf den **Zustand** warten (alle stehen
  *und* sind in Reichweite), nicht auf das Ende einer Bewegung.
- **Alte Bildschirmtexte des Strategiespiels haben keine Umlaute**
  („Bevoelkerung voll", „Das ist nicht dein Gebaeude."), obwohl CLAUDE.md sie
  verlangt. Neue Texte werden richtig geschrieben; die alten aufzuraeumen ist
  ein offener Faden (es haengen Testtexte daran).

## Werkzeuge, die ich brauche

```bash
npm run check                  # ohne Browser: Specs, Belege, Bericht, Tests
npm run check:alles            # erst Browserlauf, dann check - bei Oberflaechenarbeit
npm run specs:board            # Board neu rechnen
npm run pruefstand:strategie   # KI gegen KI ohne Browser, jeder Takt geprueft
npm run pruefstand:vergleich -- --minuten 90 --saetze 2   # Arbeitsstand neben HEAD - gleich nach dem ersten Entwurf
npm run pruefstand:verlauf -- --startwert 11 --minuten 70 # eine Partie Minute fuer Minute
npm run gegenprobe -- <datei> "<neu>" "<alt>" -- <befehl> # Gegenprobe, schreibt immer zurueck
npm run sicht -- --spiel --zoom 2   # eine laufende Partie als Wegwerfbild
npm run tafel -- "t.anmutung('gebaeude','haus')"   # auf der Schautafel messen
npm run e2e:laufzeiten -- strategie                # langsamste Browserfaelle
npx playwright test --config e2e/playwright.config.mjs e2e/tests/<datei>
node --test "tests/<datei>.test.mjs"               # Node 24 braucht ein Muster
```

## Offene Fragen an den Benutzer

- **Der Name des Spiels** ist nicht entschieden. Im Gespraech waren „Rise to
  Hegemony" (mit „Enough diplomacy. Rise to Hegemony." als Motto), „Rise of
  Empires", „Empires Arise", „Lead & Grow", „Rise to Victory", „Nations of
  Power". Sobald entschieden: Vorraum, Seitentitel, Spec, und diese Frage
  streichen.
- **Berechtigungen fuer die Schleife:** `.claude/settings.json` traegt nur der
  Benutzer ein. Nicht umgehen.
- **Mailversand** (konten AC-4, AC-5) und **mehrere Menschen in einer
  Manager-Liga** ruhen mit dem Managerspiel.
