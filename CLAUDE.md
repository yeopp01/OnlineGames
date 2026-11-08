# OnlineGames

Spiele für mehrere über einen Raumcode. Erstes Spiel: **Fading Allies**, ein
Echtzeit-Strategiespiel nach den Regeln von Age of Empires II, gebaut in Stufen bis zu fünf Völkern auf
einem eigenen Server ([ADR-0012](docs/adr/0012-aoe2-als-vorlage.md)). Zweites
Spiel: ein Fußballmanager im Geist von Anstoss 3 — **die Arbeit daran ruht.**

Schwesterprojekt von [LocalGames](../LocalGames/) — dort liegen die Partien im
Gerät und verlassen es nicht. Hier gibt es einen Server, weil ein gemeinsames
Spiel ohne ihn nicht geht. Anderes Versprechen, deshalb anderes Projekt.

## Sprache

**Alles auf Deutsch** — Bezeichner im Code, Kommentare, Specs, Commit-Texte,
Testnamen. `einheit`, `vorrat`, `wegZurBasis`, nicht `unit`, `resource`,
`pathToBase`. In `.md`-Dateien sind Umlaute erwünscht, in Bezeichnern,
Dateinamen und Testnamen werden sie umschrieben (`Raeume`, `zurueck`), damit
nichts an Kodierungen hängt. **Texte, die auf dem Bildschirm stehen, bekommen
echte Umlaute** („Eröffnen", nicht „Eroeffnen") — das setzt
`tests/waechter-umlaute.test.mjs` durch (spielauswahl AC-21). Bildunterschriften
der Bildnachweise zählen nicht dazu.

## Arbeitsweise

```bash
npm run check        # Specs, Belege, Nachweise, Bericht, Tests - ohne Browser, auch in der CI
npm run check:alles  # erst der Browserlauf, dann npm run check - vor jedem Abschluss an der Oberfläche
npm run check:kurz        # dasselbe leise: nur Zahlen und Fehler, alles in qa/letzter-lauf.log
npm run check:alles:kurz  # dasselbe mit Browserlauf
npm run check:alles:neu:kurz  # ein Browserlauf, der ALLE Bilder neu schreibt, dann check
npm run qa:abweichung  # welche Bildnachweise haben sich geändert - und wie stark?
npm run qa:report    # die Übersicht als Seite: qa/report/index.html
npm start            # http://localhost:4180/
npm run dev          # dasselbe mit --watch
npm run sicht -- schautafel.html  # eine Seite als Wegwerfbild ansehen, ohne Testlauf
npm run sicht -- --spiel --zoom 2 --ziel wald  # dasselbe fuer eine laufende Partie
npm run sicht -- --spiel --waehlen speerkaempfer --zeitalter 1  # die Auswahlleiste im breitesten Zustand
npm run tafel -- "t.anmutung('gebaeude', 'haus')"  # auf der Schautafel messen, Ergebnis als JSON
npm run e2e:laufzeiten -- strategie   # Dauer des Browserlaufs je Datei, die langsamsten Faelle
npm run pruefstand:vergleich          # KI gegen KI: Arbeitsstand neben HEAD, dieselben Partien (--saetze 2: 1-20 und 21-40)
npm run pruefstand:verlauf -- --startwert 5  # eine Partie KI gegen KI Minute fuer Minute
```

**Am Strategiespiel wird in Runden gearbeitet:** `/strategie-weiterbauen`
([Anweisung](.claude/skills/strategie-weiterbauen/SKILL.md)), eigenständig mit
`/loop /strategie-weiterbauen`. Gearbeitet wird auf dem Branch `strategie`; was
dabei gelernt wird, steht in [`docs/strategie/erkenntnisse.md`](docs/strategie/erkenntnisse.md),
die Werte des Originals in [`docs/strategie/vorlage-aoe2.md`](docs/strategie/vorlage-aoe2.md).

**`npm run check` muss vor jedem Abschluss grün sein.** Er prüft:

1. die Specs sind lesbar (Status, Kurztitel, Nummern), `specs/BOARD.md` und
   die Stand-Zeilen passen
2. jedes Kriterium auf `fertig` wird von einem **Testnamen** genannt
3. jedes Kriterium auf `fertig` hat **ein Bild oder eine Begründung**, und
   jeder Bildnachweis passt zu Spec, Kriterium und erzeugendem Test
4. `qa/report/index.html` ist neu erzeugt
5. alle Tests ohne Browser laufen

**Wer die Oberfläche anfasst, fährt `npm run check:alles`.** Der Browserlauf
(Playwright) gehört nicht in die CI; er läuft örtlich und schreibt die Bilder,
die `npm run check` danach ohne Browser prüft.

**Hat sich das Aussehen geändert, ist es `npm run check:alles:neu`** — ein
Browserlauf schreibt jedes Bild neu _und_ prüft. Nicht erst `qa:nachweis` und
dann `check:alles`: das sind zwei Browserläufe und neun Minuten umsonst
(Rückschau nach Runde 78). **Danach `npm run qa:abweichung`** — ein solcher
Lauf ändert achtzig Bilder, an den meisten nur den zufälligen Raumcode. Die
Liste sortiert nach Anteil geänderter Bildpunkte; was über 1 % steht, wird
angesehen, bevor etwas eingecheckt wird.

### Die wichtigste Regel

**`fertig` heißt: gebaut, von einem Test belegt, dessen Name das Kriterium mit
Kürzel und Nummer nennt — etwa `raeume AC-7: nur der Gastgeber startet` —,
_und_ nachgewiesen:** mit einem Bild aus dem Browserlauf, oder mit einer
Begründung in [`qa/ohne-bild.json`](qa/ohne-bild.json), warum es kein Aussehen
hat (→ [ADR-0011](docs/adr/0011-bildnachweise.md)).

Gebaut, aber nicht so belegt, ist `in-qa`. Diese Unterscheidung nicht
aufweichen: sie ist der einzige Grund, warum die Zahlen im Board etwas wert
sind. Eine Begründung, die nur „nicht sichtbar" sagt, ist keine — sie nennt,
**was** das Kriterium ist und **warum** ein Bildschirm es nicht zeigen kann.

### Beim Bauen einer neuen Funktion

1. Kriterium in der passenden Spec unter `specs/` anlegen oder finden —
   Kurztitel höchstens fünf Wörter
2. bauen
3. Test schreiben, dessen Name `<kuerzel> AC-<n>` enthält
4. Hat es einen Bildschirm: Browsertest unter `e2e/tests/` mit `nachweis()`
   ([`qa/README.md`](qa/README.md)). Hat es keinen: Eintrag mit Begründung in
   `qa/ohne-bild.json`
5. Status auf `fertig`, `npm run specs:board`, `npm run check:alles`

Neue Kriterien bekommen die nächste freie Nummer. **Nummern werden nie neu
vergeben und nie umsortiert** — an ihnen hängen Test und Bildnachweis.

## Aufbau

```
server/  raeume.js   Räume, Beitritt, Rückkehr nach Abbruch
         schutz.js   Grenzen je Adresse und je Server (tropfende Eimer)
         konten.js   Better Auth in SQLite, Sitzungen, Einladungscodes
         index.js    HTTP für die Dateien, WebSocket für das Spiel
   spiele/strategie/  karte.js Kartenerzeugung · wege.js A* auf dem Raster
                      welt.js  die Simulation: Einheiten, Aufträge, Vorräte
                      ki.js    Computerspieler, nur über welt.nachricht
                      pruefstand.js  KI gegen KI ohne Browser, jeder Takt geprüft
   spiele/manager/    kader.js Welt, Spieler, Aufstellung, Training, Entwicklung
                      spieltag.js die Begegnung in Fünf-Minuten-Abschnitten, Taktik
                      liga.js Spielplan, Tabelle · pokal.js · kalender.js 42 Termine
                      finanzen.js · vertraege.js · vorstand.js · transfer.js Markt, KI-Handel
                      karriere.js Saison um Saison · spielstaende.js SQLite am Konto
                      netz.js der Anfrageweg (nur mit Anmeldung)
public/  app.js      Verbindung, Vorraum, Warteraum
         ansicht.js  zeichnet die Welt, nimmt Maus und Tastatur
         manager.js  das Managerspiel (/manager.html), acht Blätter
specs/   was das Produkt ist, mit Abnahmekriterien
docs/adr/ warum es so gebaut ist
qa/      bildnachweise/ Bilder je Kriterium (eingecheckt) · ohne-bild.json Begründungen
         report/ der erzeugte Bericht (nicht eingecheckt)
scripts/ specs-lesen.mjs ist die eine Quelle; Board, Belege und Bericht hängen daran
         qa-nachweis.mjs legt Bildnachweise ab · qa-report.mjs prüft und schreibt den Bericht
tests/   waechter-*: Regeln, die ein Test durchsetzt statt Fettdruck
         Anfrageweg: netz, schutz, konten, manager-netz · Rechenteile: regeln, manager, manager-spiel
         manager-welt: sechs Saisons ohne Menschen, jedes Spiel auf Widersprüche geprüft
e2e/     Playwright: tests/ im Browser; server.mjs startet den Server samt Prüfgriffen
         (eigener Hafen, nur im Test); anmeldung.setup.mjs meldet einmal je Lauf an
```

## Entschieden (nicht neu aufrollen)

| | |
| --- | --- |
| [ADR-0001](docs/adr/0001-server-rechnet.md) | **Der Server rechnet**, der Browser malt. Kein Lockstep — damit kein Abgleichproblem, kein Schummeln, Rückkehr nach Absturz geschenkt. |
| [ADR-0002](docs/adr/0002-raumcode.md) | **Sechsstelliger Raumcode**, angezeigt als `KRN-4TZ`. 481.890.304 Möglichkeiten. |
| [ADR-0003](docs/adr/0003-anmeldung.md) | **Better Auth** im Spielserver mit `node:sqlite`, dafür Node 24. Kein Keycloak, kein zweiter Dienst. Registrieren **nur mit Einladungscode**. |
| [ADR-0004](docs/adr/0004-teststrategie.md) | Pflichttests laufen **über WebSocket gegen den laufenden Server**, nicht gegen die Klassen. Reine Rechenteile dürfen direkt geprüft werden. |
| [ADR-0005](docs/adr/0005-grenzen-statt-vertrauen.md) | **Grenzen greifen vor der Anmeldung.** Ein Angreifer will kein Konto — er kostet trotzdem. |
| [ADR-0006](docs/adr/0006-mehrere-spiele.md) | **Mehrere Spiele, aber die Schnittstelle erst, wenn es zwei gibt.** Nichts Spielspezifisches in `raeume.js`, `schutz.js`, `index.js`. |
| [ADR-0007](docs/adr/0007-zwei-arten-von-partien.md) | **Der Raum ist flüchtig, der Spielstand ist dauerhaft.** Sitzungsspiel gegen fortlaufendes Spiel; `server/spiele/<art>/`. |
| [ADR-0008](docs/adr/0008-zweites-spiel-manager.md) | **Das zweite Spiel ist ein Fußballmanager**, nicht der Hausbau. Rundenbasiert, deshalb billig — und ohne die Netzfragen des Strategiespiels. |
| [ADR-0009](docs/adr/0009-oberflaeche-im-browser.md) | **Die Oberfläche wird in einem echten Browser geprüft.** Jedes Spiel bringt sein eigenes Stylesheet mit — keine geteilte Kaskade. |
| [ADR-0010](docs/adr/0010-playwright.md) | **Playwright** statt eigener Fernsteuerung: warten auf Zustände statt nach der Uhr. **Nur örtlich**, nicht in der CI. |
| [ADR-0011](docs/adr/0011-bildnachweise.md) | **Bildnachweise gehören an das Abnahmekriterium.** `fertig` = Testname **und** (Bild **oder** Begründung). Bilder eingecheckt, Bericht erzeugt. |
| [ADR-0012](docs/adr/0012-aoe2-als-vorlage.md) | **AoE II ist die Vorlage, gebaut wird in Stufen A–G.** Keine Schiffe, kein Karrenhandel, keine Kampagnen, kein Material aus dem Original, kein „Age of Empires" im Spiel. Völker sind Daten. |

**Eröffnen verlangt ein Konto, Mitspielen nicht.** Wer eine Partie eröffnet,
belegt Rechenzeit — dort leistet ein Konto etwas. Wer mitspielt, tippt Code
und Namen. Diese Regel ist der Kern des Projekts, sie wird nicht verwässert.

Und die Tabelle „Wird nicht gebaut" in [ADR-0012](docs/adr/0012-aoe2-als-vorlage.md)
ist die wichtigste im Projekt: jede Zeile rechts ist eine Woche, die wir nicht
ausgeben. Vor jedem Vorschlag, der
Umfang hinzufügt, dort nachsehen.

## Stand

**403 von 526 Kriterien fertig.** 483 Tests ohne Browser, 170 im Browser. Die
Übersicht ist der Bericht: `npm run qa:report`.

Gebaut ist der Unterbau: Räume, Übertragung, Karte, Wegfindung, Sammeln,
Rückkehr nach Abbruch, Schutzschicht und die Anmeldung — dazu das
**[Managerspiel](specs/15-manager/) als Karriere über viele Saisons**: zwei
Ligen mit Auf- und Abstieg, Pokal, Kalender mit Transferfenstern, Taktik mit
Ausrichtung und Einspielen, zwölf Positionen mit Abzug auf fremden Plätzen
(Ziehen im Mannschaftsblatt), Vorschau auf den Gegner, Entwicklungsberichte,
eine Akte je Spieler, Karriereende mit Ankündigung zur Winterpause,
Trainingsschwerpunkt, Verträge, Jugend,
Karriereende, Finanzen mit Sponsor und Stadion, Vorstand mit Entlassung —
und 35 Vereine, die nach denselben Regeln spielen und handeln. Der Spielstand
liegt in SQLite am Konto; ohne Anmeldung geht im Managerspiel nichts.

Gemessen: **3,10 Tore je Spiel, 48 % Heimsiege, 21 % Unentschieden**
(Bundesliga: 3,1 / 44 % / 24 %); der Favorit gewinnt 64 %. Über sechs Saisons
ohne Menschen null Widersprüche in den Spielen, Kader, Stärke und Markt
stabil. Eine Saison rechnet in rund 400 ms, ein Spielstand ist nach zwei
Saisons unter 1 MB. Der Browserlauf dauert rund 8 bis 11
Minuten für 166 Fälle (`npm run e2e:laufzeiten` zeigt, wo; die langsamsten
Fälle sind `fahrplan AC-8` mit 78 s, die Feudalzeit am Stück, und `ki AC-9`
mit 45 s, weil die KI zwölf Spielminuten lang zusieht).

**Stellschrauben des Managerspiels** stehen gesammelt in `WIRKUNG` in
`server/spiele/manager/spieltag.js`. Wer daran dreht, misst danach: keine
Einstellung darf für alle die beste sein (manager AC-15, spieltag AC-23 bis
AC-25).

**Node 24 ist Pflicht** (`node:sqlite`). `fnm` schaltet über `.node-version`
automatisch um. `npm test` braucht in Node 24 ein Muster statt eines Ordners.
Den Browser für Playwright holt einmal `npm run e2e:browser`.

**Im Browser gesehen** sind die Manager-Oberfläche, der Vorraum mit
Spielauswahl und Einstellungen und das **Strategiespiel bis Schritt A6b**:
Rahmen, Klick, Zoom, Tasten, Sammeln von vier Rohstoffen mit Ladung und
Lagern, Rohstoffleiste, Ausbilden am Dorfzentrum mit Schlange, Bauen mit
Baumenü und grün/roter Vorschau, Baustellen, Schafe schlachten, Absagen im
Bild (`e2e/tests/strategie-*.spec.mjs`). Isometrisch und gezeichnet statt
flach: Figuren, Gebäude, Wald, Vorräte und Gras mit Licht, Schatten und
Oberflächen (`public/figuren.js`, `public/gebaeude.js`, `public/gelaende.js`,
Schautafel unter `/schautafel.html`). Werte der Einheiten und Gebäude stehen
als Daten in `server/spiele/strategie/daten.js`.

### Offen, in dieser Reihenfolge

Der [Fahrplan](specs/10-strategie/fahrplan.md) ist die Reihenfolge:

Einstieg (Spielauswahl, Einstellungen, Warteraum) und Spielbild im Browser
sind erreicht (fahrplan AC-1, AC-2); in Stufe A sind die Schritte A1 bis A6b
gebaut, aus A6c das naturalistische Aussehen (darstellung AC-13: keine
schwarzen Umrisse, erdige Farben, Proportionen, Boden als Textur mit Wasser,
Schlagschatten; AC-14: alles unterscheidbar) und A7 ganz: Schafe, Farm,
Kaserne mit Miliz, Webstuhl, Sammelpunkt, Lebensbalken im Bild. A8 ist fertig:
der Prüfstand (`npm run pruefstand:strategie`) spielt KI gegen KI, die
Wirtschafts-KI hat nach zehn Minuten 22 Dorfbewohner und 500 Nahrung. Aus A9
stehen untätige Dorfbewohner (Knopf und Taste `.`), die Übersichtskarte,
Tastenkürzel mit Übersicht (`?`), Auswahlliste, Aufstellung einer Gruppe am
Ziel und die Schautafel als Nachweis, ein Takt mit 800 Einheiten unter 1 ms,
60 Bilder je Sekunde mit 100 Einheiten und 30 Gebäuden. **Stufe A ist
erreicht**: die Dunkle Zeit ist am Stück im Browser spielbar (fahrplan AC-3).
Die Rückschau zur Stufe hat drei Lücken angelegt (bedienung AC-30 bis AC-32:
verdeckte Einheiten, sichtbare Arbeit, Arbeiter je Rohstoff). Stufe B ist
spezifiziert (Bauabfolge B1 bis B7). **B1 bis B3 sind fertig**: verdeckte
Einheiten als Umriss, sichtbare Arbeit, Arbeiter je Rohstoff in der Leiste;
der **Zeitalterwechsel** (vier Zeitalter als Daten, der Aufstieg als Auftrag
im Dorfzentrum — 500 Nahrung, 130 Sekunden, zwei fertige Gebäude der laufenden
Zeit außer Häusern —, das Zeitalter oben in der Leiste, der Wechsel einmal im
Bild gemeldet); die **drei Gebäude der Feudalzeit**: Schießanlage mit
Zielscheibe, Stall mit Koppel (bildet den Späherreiter aus), Schmiede mit
Schornstein, alle erst ab der Feudalzeit im Baumenü; und **B4 ganz**: die drei neuen Einheiten
— Speerkämpfer (Kaserne), Bogenschütze und Plänkler (Schießanlage), jede mit
eigener Figur, Angriff, Rüstung und Bonus als Daten und gesperrt bis zum
Aufstieg — und die Verbesserung **Soldat**, die jede Miliz austauscht statt
sie aufzuwerten. **Aus B5 steht der Kampf**: Ein Rechtsklick auf eine fremde
Einheit oder ein fremdes Gebäude greift an — kein eigener Knopf, der Server
liest es aus dem geklickten Feld; mehrere Angreifer verteilen sich um das
Ziel. Der Schaden ist `max(1, Angriff − Rüstung + Bonus)` ohne Ausnahme und
ohne Zufall, jede Einheit hat ihre Nachladezeit, Gebäude tragen 0/7 Rüstung
und fallen samt ihrem Platz. Wer stirbt, liegt zwei Sekunden am Boden.
**Kampfeinheiten wehren sich von selbst**: was in die Sichtweite einer
stehenden Einheit kommt, wird ohne Befehl angegriffen (wer wacht, steht als
Wert in den Daten); ein Dorfbewohner arbeitet weiter, bis ihn ein Schlag
trifft. Eine Verfolgung, die niemand befohlen hat, endet fünf Felder vom
Ausgangsplatz, ein befohlener Angriff nicht. Fernkämpfer halten ihre vier
Felder, Nahkämpfer gehen bis ans Ziel. **B5 ist fertig**: dazu das rote
Zeichen am Ziel und der **Angriffslauf** — `G` schaltet ihn ein, der nächste
Rechtsklick schickt die Auswahl los und sie greift unterwegs an, was ihr in
Sichtweite kommt, bis sie am Marschziel steht. Aus **B6** stehen die vier
**Verbesserungen der Feudalzeit**: Schmiedeangriff und Befiederte Pfeile in der
Schmiede, Doppelaxt im Holzfällerlager, Pferdekummet in der Mühle — jede mit
eigenem Bild im Menü. Getroffen wird über die **Klasse** einer Einheit, nicht
über ihre Art; `welt.einheitenwert()` ist die eine Stelle, die Werte mit
Verbesserungen liest. **B6 ist fertig**: die Wirtschafts-KI steigt von selbst
auf — 22 Dorfbewohner, freies Dorfzentrum, 500 Nahrung und zwei Gebäude der
Dunklen Zeit, dann der Aufstieg, danach eine Schießanlage (oder ein Stall, je
nach Gold) und ohne Pause Kampfeinheiten daraus. Welche, liest sie aus den
Daten des Gebäudes. Im Prüfstand steht die Feudalzeit über zwanzig Startwerte
nach 11,1 bis 11,9 Spielminuten; die Vorgabe von `npm run pruefstand:strategie`
ist deshalb 16 Minuten. **Stufe B ist erreicht** (fahrplan AC-8): ein Browsertest spielt die
Feudalzeit am Stück — Aufstieg im Dorfzentrum bestellt, Schießanlage, Stall und
Schmiede mit Taste und Klick gebaut, Speerkämpfer, Bogenschütze, Plänkler und
Späherreiter ausgebildet, der Schmiedeangriff erforscht, und zwei Schläge
gemessen: Speer gegen Reiter 19, Bogen gegen denselben Reiter 2. **Aus B7 die Messungen**: der
**Gefechtsstand** (`npm run konterkreis:strategie`) stellt zwei Heere gleicher
Kosten gegenüber — 600 Rohstoffe, also zehn Speerkämpfer gegen sieben Reiter —
und lässt sie aufeinander laufen. Der **Konterkreis hält in beiden
Richtungen**: Speer gegen Reiter, Plänkler gegen Bogen, Bogen gegen Speer,
Reiter gegen Bogen gewinnen je 20 von 20 Startwerten, umgekehrt 0 von 20.
Dasselbe Gefecht zweimal gerechnet verläuft Takt für Takt gleich, ein anderer
Startwert anders. 160 Gefechte kosten 0,2 s; wer an Angriff, Rüstung, Bonus
oder Nachladezeit dreht, fährt ihn danach. Die **Rückschau zur Stufe B** hat
drei Lücken angelegt, alle in der Lesbarkeit (bedienung AC-35 bis AC-37):
Kampfwerte an der Auswahl, Militär bei Zoom 1 vom Dorfbewohner unterscheidbar,
Spielzeit im Bild. **Stufe C ist spezifiziert** (Bauabfolge C1 bis C6), und
**C1 und C2 sind fertig**. C1: die drei Lücken stehen. **C2 — das Partieende**:
ausgeschieden ist, wer weder Einheit noch Gebäude außer Farmen hat; bleibt
einer übrig, endet die Partie in demselben Takt, in dem der letzte Verlust
abgerechnet wird; nach 90 Spielminuten endet sie unentschieden; Aufgeben ist
der schnelle Weg dorthin. Entschieden wird in der **Welt**, der **Raum** fragt
nur `welt.vorbei` und hält daran seine Uhr an (ADR-0006). Im Bild steht eine
Meldung, die stehen bleibt. **Aufgeben ist ein Knopf oben rechts** — dort, wo
im Spiel nichts geklickt wird — und er fragt genau einmal zurück; Esc und
„Weiterspielen" sind die zwei Auswege, der gefährliche Knopf ist nicht der
größte. **C3 ist fertig**: wer ausgeschieden ist, bekommt
weiter jeden Zustand, über dem Bild steht, dass er draußen ist, und die Kamera
springt zu einem, der noch spielt — sonst sähe er auf den leeren Platz, wo
eben sein Dorf stand. Am Ende sehen alle **dieselbe Tafel**: je Spieler
Zeitalter, gesammelte Rohstoffe, ausgebildete Einheiten und Verluste, darunter
die Dauer der Partie. Gezählt wird während der Partie — beim Abladen, beim
Fertigwerden eines Auftrags, beim Sterben —, damit die Zahlen auch für einen
stimmen, von dem am Ende nichts mehr auf der Karte steht. Unter der Tafel steht
die **Revanche**: ein Klick des Gastgebers startet dieselbe Runde neu —
dieselben Leute, dieselben Einstellungen, niemand tippt einen Code. Für den
Server ist das ein **zweiter Start desselben Raums**, erlaubt, sobald
`welt.vorbei` es sagt; wer die Verbindung verloren hat, spielt nicht mit.
**C4 hat begonnen: die KI greift an.** Sobald zehn Kampfeinheiten bereitstehen,
schickt sie acht davon im Angriffslauf zum nächsten Gegner — Marschziel ist ein
freies Feld vier Felder vor dessen Dorfzentrum, denn ein Befehl auf ein fremdes
Gebäude wäre ein Angriff auf genau dieses Gebäude und kein Angriffslauf —, und
am Ziel setzt sie auf das Dorfzentrum nach. Die zwei, die dem eigenen Dorf am
nächsten stehen, bleiben als Wache. Über zwanzig Startwerte bricht jede KI auf,
die erste zwischen Spielminute 17,5 und 19,8; die Vorgabe von
`npm run pruefstand:strategie` steht deshalb auf 22 Minuten. **Die KI
verteidigt daheim** (ki AC-14): verliert ein Gebäude oder ein Dorfbewohner
Leben, zieht die Wache im Angriffslauf hin, und der Getroffene flieht zum
Dorfzentrum. Eine Meldung bekommt sie nicht — sie sieht nur fehlendes Leben.
Ihre Ziele wählt `Ki.freiesFeldUm()` mit Abstand von Feinden und von allem,
was sie selbst eben vergeben hat; über zwanzig Startwerte greifen jetzt alle
vierzig KIs an. **Stehende treten auseinander** (einheiten AC-29,
`welt.ausweichen()`): wer näher als ein halbes Feld bei einem anderen steht,
geht auf ein freies Nachbarfeld, auf dem er seine Arbeit behält — Sammler
und Kämpfende noch nicht (AC-30 kostet die KI Zeit, AC-31 hängt am
Konterkreis). **Nachschub** (ki AC-12): nach dem Aufstieg verteilt die KI
ihre Sammler nach Überfluss und Mangel um, baut bis zu drei Militärgebäude
und greift in dreißig Minuten vier- bis neunmal an. **Auch spät steht
niemand herum** (ki AC-10): bis Minute 30 höchstens 12,9 Sekunden. **C4 ist
fertig: KI gegen KI endet** (fahrplan AC-11) über zwanzig Startwerte mit einem
Sieger, jede Partie vor Minute 60 (24,8 bis 53,3, Median 33,8). Dazu nimmt am
Ziel jeder sein nächstes Ziel (ki AC-16), die Kaserne bildet Nahkämpfer aus
(ki AC-17), überlegen zieht alles bis auf die Wache los (ki AC-18), und wer
nie wieder etwas tun kann — keine Einheit, nichts in der Schlange, nichts
bezahlbar —, **gibt auf** wie der Computergegner im Original (ki AC-19). **C5
ist fertig: allein gegen die KI** — beim Eröffnen die Zahl der KI-Gegner
einstellen (spielauswahl AC-18), allein starten (AC-19), und eine ganze
Partie läuft im Browser bis zur Tafel „KI 1 hat gewonnen" (fahrplan AC-12).
Der Raum erfährt vom Steckbrief nur `plaetze(einstellungen)`. Es folgt
**zuletzt der Nebel** (C6), weil er die Zustandsnachricht umbaut.

1. **Stufe A** Dunkle Zeit mit Wirtschafts-KI und Prüfstand · **B** Feudalzeit
   · **C** Partieende und KI-Gegner · **D** Ritterzeit · **E** fünf Völker ·
   **F** Imperialzeit · **G** Betrieb auf dem Hetzner-VPS.

Außerhalb der Reihe, aber nicht vergessen: Mailversand (konten AC-4, AC-5) und
mehrere Menschen in einer Manager-Liga — beides ruht mit dem Managerspiel.

Der ehrlichste Prüfstein bleibt keiner am Rechner: einmal zu fünft spielen und
sehen, ob es trägt.

## Ton

Der Benutzer schätzt begründete Empfehlungen statt Auswahllisten, und
Widerspruch, wo er berechtigt ist. Zahlen belegen statt behaupten — messen,
dann sagen. Wenn etwas nicht geprüft ist, wird das ausdrücklich gesagt.
