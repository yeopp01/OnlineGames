# OnlineGames

Spiele für mehrere über einen Raumcode. Erstes Spiel: **Fading Allies**, ein
Echtzeit-Strategiespiel nach den Regeln von Age of Empires II, gebaut in Stufen bis zu fünf Häusern einer eigenen Welt auf
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
QA_NACHWEIS=1 E2E_HAFEN=4195 npx playwright test -c e2e/playwright.config.mjs <datei> -g "AC-22"  # nur die Bilder der gewählten Fälle neu, die übrigen der Datei bleiben
npm run qa:report    # die Übersicht als Seite: qa/report/index.html
npm start            # http://localhost:4180/
npm run dev          # dasselbe mit --watch
npm run sicht -- schautafel.html  # eine Seite als Wegwerfbild ansehen, ohne Testlauf
npm run sicht -- --spiel --zoom 2 --ziel wald  # dasselbe fuer eine laufende Partie
npm run sicht -- --spiel --waehlen speerkaempfer --zeitalter 1  # die Auswahlleiste im breitesten Zustand
npm run tafel -- "t.anmutung('gebaeude', 'haus')"  # auf der Schautafel messen, Ergebnis als JSON
npm run ton:messen   # den Ton offline rechnen: Pegel je Klang und der Musik, dazu zwei WAV zum Anhoeren
npm run e2e:laufzeiten -- strategie   # Dauer je Datei aus dem letzten Browserlauf, die langsamsten Faelle (--neu faehrt erst einen)
npm run tempo:partie  # Tempo im Gefecht messen: KI-Partie bis Minute 25, sichtbares Chrome mit Grafikkarte, rund fuenf Minuten (MINUTE, JE, ZOOM, NAH)
npm run e2e:daten     # nur die Browserfaelle, die "alles aus den Daten" aufstellen - nach jedem neuen Eintrag in daten.js
npm run pruefstand:vergleich          # KI gegen KI: Arbeitsstand neben HEAD, dieselben Partien (--saetze 2: 1-20 und 21-40)
npm run pruefstand:vergleich -- --probe probe.cjs --saetze 3  # Austauschprobe: eine Methode nur im Arbeitsstand ersetzt, 60 Startwerte
npm run pruefstand:verlauf -- --startwert 5  # eine Partie KI gegen KI Minute fuer Minute
npm run pruefstand:haeuser   # jede Paarung der Haeuser 20-mal, Seiten abwechselnd, mit Herstellung je Haus (--nur, --probe, --je)
npm run waechter     # alle Waechter in Sekunden - vor dem Abschlusslauf
npm run typen        # TypeScript prueft jede Datei mit // @ts-check - gebaut wird nichts, die Dateien bleiben JavaScript
npm run gegenprobe -- <datei> "<neu>" "<alt>" -- <befehl>  # Gegenprobe gegen die alte Zeile, schreibt die Datei immer zurueck
npm run durchsicht   # Geaendertes und Neues als eine Datei fuer den Pruefer, der keine Shell hat - nennt den Pfad
npm run ausrollen    # den Stand eines Commits auf den Server bringen (betrieb/README.md); -- --stand zeigt, was dort laeuft
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

**TypeScript ist der Prüfer, nicht die Sprache** (`npm run typen`, als
Wächter in `npm test`). Geprüft wird, was in der ersten Zeile `// @ts-check`
trägt: der Server ohne das Managerspiel, im Browser bisher `nebel.js`,
`uebersicht.js` und `auswahlleiste.js`. Die Formen der Tabellen stehen als
`@typedef` oben in `server/spiele/strategie/daten.js` — **ein neues Feld wird
dort eingetragen**, sonst meldet der Prüfer es. Welche Dateien noch fehlen und
warum, steht unter `OFFEN` in `tests/waechter-typen.test.mjs`.

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
         partien/: ganze Partien zu viert, als zweiter Abschnitt von npm test
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
| [ADR-0012](docs/adr/0012-aoe2-als-vorlage.md) | **AoE II ist die Vorlage, gebaut wird in Stufen A–G.** Keine Schiffe, kein Handel über Wasser, keine Kampagnen, kein Material aus dem Original, kein „Age of Empires" im Spiel. Völker sind Daten. |
| [ADR-0013](docs/adr/0013-buendnisse-karren-dauer.md) | **Bündnisse, die sich lösen lassen**: Teams im Warteraum, fest oder lösbar; Lösen öffentlich mit 60 Sekunden Frist; ein Team gewinnt. **Marktkarren ab der Ritterzeit**, auch zum zweiten eigenen Markt. **Zeitgrenze und Spielgeschwindigkeit sind Einstellungen** (Vorgabe: keine Grenze, 1,0). |
| [ADR-0014](docs/adr/0014-haeuser-statt-voelker.md) | **Fünf Häuser einer eigenen Welt statt historischer Völker**: Eschenbruch, Rappenstein, Wehrstein, Silberfurt, Distelhag; die Stufen heißen im Spiel Landsitz, Lehen, Fürstentum, Krone. **Der Drache statt des Trebuchets**, abschaltbar. Abrüsten: 40 Nahrung, 20 s. Alle Zahlen Startwerte. |
| [ADR-0015](docs/adr/0015-statthalter.md) | **Der Statthalter**: Teile des eigenen Reichs der KI übergeben, mit Knöpfen statt Sprachmodell, nach Stufe E; Übernahme bei Verbindungsabbruch nach zehn Sekunden. |
| [ADR-0016](docs/adr/0016-gerenderte-bilder.md) | **Bilder werden gerendert, nicht gezeichnet**: eigene 3D-Modelle als Blender-Skripte unter `grafik/`, vor dem Spiel zu Bildern unter `public/bilder/` gerendert und eingecheckt. Blender nur örtlich, nicht in der CI. Fremdes nur CC0, keine Bildgeneratoren. Umbau R1 bis R6, **nach der Probe R1 entscheidet der Benutzer**. |

**Eröffnen verlangt ein Konto, Mitspielen nicht.** Wer eine Partie eröffnet,
belegt Rechenzeit — dort leistet ein Konto etwas. Wer mitspielt, tippt Code
und Namen. Diese Regel ist der Kern des Projekts, sie wird nicht verwässert.

Und die Tabelle „Wird nicht gebaut" in [ADR-0012](docs/adr/0012-aoe2-als-vorlage.md)
ist die wichtigste im Projekt: jede Zeile rechts ist eine Woche, die wir nicht
ausgeben. Vor jedem Vorschlag, der
Umfang hinzufügt, dort nachsehen.

## Stand

**605 von 712 Kriterien fertig.** 1079 Tests ohne Browser und 15 ganze Partien, 348 im Browser. Die
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
Saisons unter 1 MB. Der Browserlauf dauert rund 36
Minuten für 308 Fälle (inzwischen 316, rund 42 Minuten) (`npm run e2e:laufzeiten` zeigt, wo; die langsamsten
Fälle sind `fahrplan AC-24` mit 108 s, zwei gegen zwei bis zur Tafel,
`fahrplan AC-14` mit 90 s, die Ritterzeit am Stück, und `fahrplan AC-12`
mit 84 s, eine ganze Partie gegen die KI).

**Stellschrauben des Managerspiels** stehen gesammelt in `WIRKUNG` in
`server/spiele/manager/spieltag.js`. Wer daran dreht, misst danach: keine
Einstellung darf für alle die beste sein (manager AC-15, spieltag AC-23 bis
AC-25).

**Node 24 ist Pflicht** (`node:sqlite`). `fnm` schaltet über `.node-version`
automatisch um. `npm test` braucht in Node 24 ein Muster statt eines Ordners.
Den Browser für Playwright holt einmal `npm run e2e:browser`.

**Gespielt wird am PC** (spielauswahl AC-23): der Vorraum steht ab 900
Bildpunkten nebeneinander und passt auf 1366 × 768 ohne Rollen; im
Warteraum stehen die Einstellungen in drei Spalten. **Das Spielbild passt
auch** (bedienung AC-23, `e2e/tests/strategie-laptop.spec.mjs`): auf 1366 × 768
in jedem Zeitalter, mit Baumenü, Dorfzentrum und einer Gruppe aus jeder Art,
ragt nichts aus dem Fenster, und kein Text ist halb zu sehen — der Hinweis
oben steht ganz oder fehlt, lange Namen im Baumenü trennen nach Silben. Alle
anderen Browserfälle laufen auf 1400 × 950.

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
und fallen samt ihrem Platz; eine Baustelle hat erst so viel Leben, wie
gebaut ist (bauen AC-7, `welt.bauleben`). Wer stirbt, liegt zwei Sekunden am Boden.
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
Der Raum erfährt vom Steckbrief nur `plaetze(einstellungen)`. **Der
Nebel (C6) hat begonnen:** der Server rechnet die Sicht je Spieler (kampf
AC-15), und das Bild zeigt sie in drei Stufen, auch auf der Übersichtskarte
(kampf AC-11, AC-12, darstellung AC-15) — der Browser rechnet die eigene Sicht
in `public/nebel.js`, fremde Gebäude im Nebel aus der Erinnerung. **Der
Server schickt jedem nur, was er sieht** (kampf AC-13): `welt.zustandJeSpieler`
und `welt.aufbauFuer`, der Raum fragt nur, ob es sie gibt. **Ein Angriff wird
gemeldet** (kampf AC-14): roter Knopf oben, ein Klick springt hin. **Die KI
sieht nur ihr Sichtfeld** (ki AC-13, Runde 165): fremde Gebäude, sobald sie
sie gesehen hat, fremde Einheiten, solange sie sie sieht, gesucht wird mit
dem Späher (`ki.wahrnehmen()`, `feindOrt`, `gesehen`). Im Nebel gilt für KI
gegen KI die **Ersatzgrenze** (Benutzer, 2026-11-10): alle mit Sieger vor
Minute 90, Median unter 45, mindestens 35 von 40 vor Minute 60 —
gemessen 37 von 40, Median 44,6 (`tests/partien/ki-im-nebel.test.mjs`).
**Seit dem 2026-11-15 über 120 Startwerte, anteilig** (Benutzer,
2026-11-13): mindestens 105 von 120 vor Minute 60, Median unter 45,
höchstens eine ohne Sieger — gemessen 111, 39,4 und eine (Startwert 14).
Die Datei rechnet allein rund sechs Minuten.
**Stufe C ist erreicht** (fahrplan
AC-11 bis AC-13); die Rückschau dazu hat drei Lücken angelegt (bedienung
AC-39 bis AC-41: Ausholen im Kampf, sichtbare Pfeile, Ansagen nicht auf der
Mitte). **Stufe D ist spezifiziert** (Bauabfolge D1 bis D9: die drei Lücken,
Aufstieg und Gebäude der Ritterzeit, Ritter und Armbrust, Türme, Mauern und
Tore, Belagerung, Burg und Markt, Mönch, die KI in der Ritterzeit). **D1 bis
D3 sind fertig**: Aufstieg in die Ritterzeit, Kloster, Universität und
Werkstatt, Ritter und Armbrust, und die Verbesserungen der Ritterzeit — eine
Verbesserung kann eine `vorstufe` verlangen, und Werte eines Gebäudes liest
nur `welt.gebaeudewert()` (Mauerwerk: +10 % Leben, +1/+1 Rüstung). **D4 ist
fertig: der Wachturm schießt** — 5 Angriff, Reichweite 8, alle zwei Sekunden
ein Pfeil auf die nächste fremde Einheit, von selbst und nach derselben
Formel wie eine Einheit (`welt.tuermeTakten()`); ein Gebäude ohne `angriff`
in den Daten schießt nicht. **Aus D5 steht die Steinmauer**: gezogen statt
geklickt (`gezogen: true` in den Daten, `welt.mauerZiehen()`), je freies Feld
eine Baustelle, belegte übersprungen, und die Bauer gehen die Felder der
Reihe nach ab. **Das Tor** lässt die eigenen Einheiten durch und sperrt
alle anderen: die Wegsuche bekommt die Tore des Besitzers als Felder, die
nur für ihn frei sind (`welt.toreVon`); auf die eigene Mauer gesetzt,
ersetzt es sie. **Es ist vier Felder lang** (bauen AC-37, Benutzer: „Das
Tor muss breiter sein"): `laenge: 4, pfeiler: 1` in den Daten — zwei Türme
an den Enden, für niemanden begehbar, dazwischen zwei Felder Durchfahrt.
`welt.grundflaeche(art, x, y, quer)` ist die eine Stelle, die Rechtecke
kennt; ein Gebäude längs y trägt `quer` (Leitung `qu: 1`). Die Richtung
sagt der Auftrag (`quer`), sonst rät sie der Server aus der Mauer darunter;
im Browser dreht `R` das Tor in der Hand. Gezeichnet wird es in vier
Streifen, je Feld einem (`ansicht.gebaeudeMalen`). Schräg gibt es kein Tor
mehr. **D6 ist fertig.** Die Ramme (einheiten AC-35): 127 je
Stoß gegen jedes Gebäude, Pfeile ritzen sie mit 1; `nurGebaeude` in den
Daten — ein Befehl auf eine Einheit ist ein Gang dorthin, sie wacht nicht,
schlägt nicht zurück und lässt im Angriffslauf jede Einheit stehen. Der
**Mangonel** (einheiten AC-36, kampf AC-19) wirft einen Stein, der als
Geschoss auf dem Server fliegt (`welt.einschlaege`) und dort einschlägt, wo
das Ziel beim Abwurf stand: alles im Umkreis eines Feldes, eigene auch, in
der Mitte voll, am Rand die Hälfte — wer läuft, weicht aus. Näher als drei
Felder wirft er nicht. **Aus D7 steht die Burg** (bauen AC-32): vier mal vier
Felder, 650 Stein, +20 Wohnraum, schießt nach der Regel des Wachturms mit 11
auf acht Felder vom Rand — ein Eintrag in den Daten, kein neuer Code in der
Welt. **D7 ist fertig: der Markt** (bauen AC-33) tauscht je 100 Holz,
Nahrung oder Stein gegen Gold, jeder Kauf macht die Ware teurer, jeder
Verkauf billiger, 30 % Gebühr; die Preise gehören dem Spieler und stehen als
`HANDEL` in den Daten, gerechnet nur auf dem Server. **Aus D8 heilt der
Mönch** (einheiten AC-37): wer steht, gibt dem nächsten eigenen Verletzten
in vier Feldern ein Leben je Sekunde — nicht wer kämpft, keine Belagerung,
keine Gebäude; er selbst greift nie an. **D8 ist fertig: der Mönch
bekehrt** (einheiten AC-38) — ein Rechtsklick auf eine fremde Einheit in
neun Feldern, nach vier bis zehn Sekunden gehört sie ihm, danach ruht er
62 Sekunden; keine Gebäude, keine Belagerung, keine Mönche. Die Dauer kommt
aus `welt.zufall`, einem eigenen Zufall aus dem Startwert. **Die KI wächst mit den Zeitaltern** (ki AC-24): 22, 32, 42 und 50 Dorfbewohner, ab der Ritterzeit bis zu fünf Militärgebäude; sie steigt in die Ritterzeit auf und bildet Ritter aus (ki AC-21, AC-22). KI gegen KI endet über vierzig Startwerte jedes Mal vor Minute 60, am Ende mit im Median 42 Dorfbewohnern — das ist die schwere Stufe; mittel (25) und leicht (15) folgen. **Die KI baut
Burgen und belagert** (ki AC-33, ki AC-23, 2026-11-13): nach ihrem ersten
Aufbruch im Fürstentum eine Burg sechs Felder vor dem Dorf zum Gegner hin
(vier Sammler am Stein, drei Bauer), eine zweite und dritte erst in der
Krone (`BURGEN_JE_ZEITALTER`) — die KI steigt dorthin noch nicht auf, in
ganzen Partien steht also eine. Dazu eine Werkstatt und drei Rammen
(beides aus den Daten gelesen: was `nurGebaeude` trägt). Hat der Gegner
etwas, das schießt, bricht sie mit zehn statt acht und nicht ohne drei
Rammen auf; solange das Heer darauf wartet, ruht die Ausbildung
(`ki.belagerungFehlt`). Die Rammen gehen voraus zum Sammelplatz 16 Felder
vor dem Ziel (`ki.zug`), hinein erst mit dem Heer, zuerst auf das, was
schießt. Ist das Gold knapp, geht der Handel vor (`ki.handelLaeuft`).
Gemessen im Nebel: 38 von 40 vor Minute 60, Median 41,4; zu viert Median
50,9 statt 44,8. ki AC-27 verlangt seit dem 2026-11-13 das 1,4-fache
(Freigabe des Benutzers, siehe Truppenstufen unten; Distelhag 1,44-fach);
zwei Burgen und Türme nebeneinander knackt die KI nicht. Die
Stellwerte stehen mit ihren Messungen oben in `ki.js` — wer daran dreht,
fährt `tests/partien/ki-im-nebel.test.mjs` und die Team-Tests. **Die KI
legt Farmen an Mühle und Dorfzentrum** (ki AC-37, 2026-11-14,
`ki.farmplatz`): kleinster Abstand von Rand zu Rand, höchstens drei Felder,
sonst eine weitere Mühle — bei Minute 25 lag vorher 66 % der Farmen weiter
weg, jetzt keine. **Sammler gehen an das Feld beim Lager** (ki AC-38,
`naechstesFeld` mit `ANMARSCH`), ein Lager kommt, wo ein Viertel weit
läuft, und für das Holzfällerlager liegt der Preis zurück
(`LAGER_RUECKLAGE` — für Mühle und Bergbaulager nicht, sonst fällt ki
AC-9): bei Minute 15 läuft 1 % der Holzfäller weiter als acht Felder
statt 37 %; ab Minute 25 ist es nicht besser, Stein und Beeren sind nicht
gelöst. Das Haus mit Neigung zur Kaserne baut ohne Gold eine Kaserne
statt eines Stalls und verlangt für eine Schießanlage doppelt so viel Gold
(ki AC-32, `KASERNE_GOLD`) — sonst trug die Neigung mit der besseren
Wirtschaft nicht mehr. **Die Umverteilung versucht den nächsten fehlenden
Rohstoff**, wenn sich der knappste nicht holen lässt (ki AC-12): sonst
scheiterte sie spät alle zehn Sekunden am abgebauten Gold, und neben 4500
Holz fehlte die Nahrung (zwei gegen zwei, Startwert 2: kein Sieger bis
Minute 90). Gemessen danach: im Nebel 37 von 40 vor Minute 60, Median
38,9, längste 71,3; zu viert alle zwanzig vor Minute 90, längste 73,4;
die Häuser gegeneinander sind danach nicht neu gemessen. **Dorfbewohner
gehen gemeinsam auf einen Angreifer** (ki AC-36, `ki.sturmPruefen`,
`STURM_*`): höchstens zwei Angreifer, bis zu acht Dorfbewohner aus acht
Feldern, nur wenn sie in zehn Sekunden fertig wären (gegen einen Ritter
bleibt es bei der Flucht), und nicht weiter als zehn Felder vom ersten
Schlag; wer baut, baut weiter, und danach geht jeder an seine alte Arbeit
zurück (`ki.alteArbeit`). Ein Späherreiter im Dorf fällt nach 4 bis 11
statt 11 bis 25 Sekunden; im Nebel danach **35 von 40 vor Minute 60 —
genau die Grenze**, Median 39,6, längste 84,8 (Startwerte 41 bis 80: 37,
41,6 und 72,8, ohne die Regel 36), zu viert längste 71,3. Gegen einen
Menschen nicht geprüft. **Bei
Überfluss baut sie über ihre Grenze hinaus** (ki AC-34): ab dem Fürstentum,
alle Schlangen voll, 600 Holz und zusammen 1000 Nahrung und Gold im Vorrat
— ein weiteres Militärgebäude, höchstens neun. KI gegen KI greift das fast
nie (sie ist arm, nicht gedeckelt: im Mittel 55 Holz im Vorrat); gegen
einen Menschen, der mauert, ist es nicht gemessen. **Seit dem
Zusammenführen mit der neuen Balance (2026-11-13)** hielt „alle mit
Sieger" nicht mehr (2 von 40); vier Regeln bringen es zurück: der Handel
beginnt bei 1500 statt 800 Gold in Reichweite, bis vier Karren fahren,
liegt der nächste zurück (`karrenFehlt`), ist das Dorf zugebaut, sucht sie
den Bauplatz dahinter (`platzBeiBasis`), und sobald der Gegner etwas hat,
das schießt, gehen die Rammen vor der Ausbildung (ki AC-26, ki AC-23);
wer nur noch Marktkarren hat, gibt auf (ki AC-19). Gemessen: Nebel 1–40
und 41–80 alle mit Sieger, 36 und 37 vor Minute 60, zu viert längste 87,1.
**Die Grenzen halten an diesen Startwerten, nicht aus Abstand** — eine
Probe, die nur die Zufallsfolge verschob, riss sie wieder. Der Platz für
ein Gebäude wird gesucht, bevor es bezahlt ist: das ist die halbe
Rechenzeit des Prüfstands und wartet auf die nächste Runde, in der die KI
ohnehin neu gemessen wird.
**Truppenstufen (D15, 2026-11-13, Benutzer):** jede Einheit des Lehens
bekommt im Fürstentum ihre Stufe, als Verbesserung mit `wandelt` — sie
tauscht aus, was schon steht (einheiten AC-58 bis AC-62): Kurzbogenschütze
→ Bogenschütze (`bogenstufe`, Schlüssel `bogenschuetze2`), Soldat →
Langschwertkämpfer (verlangt die `soldatenstufe`), Speerkämpfer → Pikenier,
Plänkler → Eliteplänkler, Späherreiter → leichte Kavallerie. **Bogen und
Armbrust sind zwei Linien nebeneinander**: der Armbrustschütze ist eine
eigene Einheit der Schießanlage ab dem Fürstentum (35 Holz, 55 Gold, 9
Angriff alle 3,5 s, Reichweite 5), keine Verbesserung des Bogens mehr
(einheiten AC-34); der Langbogenschütze ist die Krone-Stufe der Bogenlinie
für alle, Eschenbruchs eigene Einheit heißt deshalb **Eibenschütze**
(einheiten AC-42: voll erforscht höchstens ein Feld weiter als die Burg).
Der **Wehrturm** (bauen AC-38) ist eine Verbesserung der Universität, die
jeden eigenen Wachturm umbenennt und stärkt (`bauwerk`, `nennt` — den Namen
schickt der Server in `kw`); er behält vorerst das Bild des Wachturms. Die
**Schmiede rüstet** (bauen AC-39): je zwei Stufen für Fußvolk, Reiter und
Schützen, jede +1/+1. **Der Konterkreis hält auch damit** (fahrplan AC-25,
Budget 1200): neun Paarungen 20 von 20, umgekehrt 0 — auch Reiter gegen
beide Schützenlinien. Die Armbrust verliert ohne Rüstungen gegen den Bogen
(6 von 20) und gewinnt mit den Schützenrüstungen (20 von 20). **Die KI
forscht** (ki AC-35, 2026-11-22, `ki.forschenPruefen`): zuerst die Stufe
ihrer Schwerpunkt-Einheit, dann jede Stufe und jede Wirkung auf eine Art
oder Klasse, von der sie mindestens drei hält, dann die Wirtschaft ab vier
Arbeitern; höchstens zwei zugleich, die erste des Militärs liegt in der
Rücklage (`FORSCHEN_*`, alle sechs Zahlen gesetzt). Sie forscht nicht,
solange ein Markt oder der nächste Karren fehlt oder das Gold knapp ist
und keine vier Karren fahren — sonst riss ki AC-26. Dazu steht ihr erster
Markt auf der vom Gegner abgewandten Seite (`ki.marktplatzDaheim`), und ein
Karren, dessen nächstes Randfeld hinter Wald liegt, fährt ein anderes an
(einheiten AC-40, Regel der Welt in `welt.handelTakten`). Gemessen im
Nebel über 120: 112 vor Minute 60, Median 38,4, alle mit Sieger; je KI im
Fürstentum 14,9 Verbesserungen, 3,5 Truppenstufen. **Die Burg wartet auf den Handel nur bei echter
Goldnot** (ki AC-33): wer aus Neigung handelt, baut sie gleich und verkauft
den Stein dafür nicht (`ki.steinFuerBauwerk`) — Silberfurt baute sonst in 16
Partien eine Burg, jetzt sechs, und gewinnt 36 statt 30 %. Dabei fiel ki
AC-27 auf das 1,44-fache; die Grenze steht mit Freigabe des Benutzers
(2026-11-13) bei 1,4, ki AC-30 bleibt bei zwei. Gemessen: Nebel 1–40 und
42–81 alle mit Sieger, 36 und 38 vor Minute 60, zu viert längste 87,7.
`npm run pruefstand:haeuser` danach: Eschenbruch 65, Rappenstein 60,
Distelhag 54, Silberfurt 36, Wehrstein 30 % — am Commit davor 53, 63, 63,
35, 35: **die Truppenstufen nützen Eschenbruch** und kosten Distelhag —
vermutet, nicht gemessen: die KI bildet im Fürstentum Armbrustschützen
aus, deren 9 Angriff Distelhags Fernrüstung entwertet. Wehrstein steht am
unteren Rand von spielziel AC-18.
Die **Sicht ist eine Einstellung beim Eröffnen** (kampf AC-16):
Nebel, Erkundet oder Aufgedeckt — Tests, die nicht vom Nebel handeln,
eröffnen aufgedeckt (`partieZuZweit(…, { sicht: 'aufgedeckt' })`).
**Bündnisse (D10, ADR-0013) haben begonnen:** `welt.feindlich(a, b)` ist die
eine Stelle für „Gegner oder nicht", Teams kommen als Einstellung
(`teams: { <spielerId>: 1..4 }`); Verbündete greifen sich nicht an, Türme
schießen nicht auf sie, ihre Tore öffnen sich (spielziel AC-14). **Teams
im Warteraum** (auswahl AC-22): jeder Platz hat ein Team, die KIs
eingeschlossen; der Steckbrief beschreibt die Wahl unter `jePlatz`, der
Raum prüft und reicht sie durch, ohne „Team" zu kennen; Browsertests
setzen sie mit `partieZuDritt(…, { teams: [1, 2, 1] })`. **Verbündete
sehen gemeinsam** (spielziel AC-19): ein Team hat auf dem Server einen
Satz Sichtfelder (`welt.sichten` zeigt für jedes Mitglied auf dasselbe
Objekt), im Browser zählt `public/nebel.js` alles mit, was nicht
`ansicht.feindlich` ist. **Ein Team gewinnt** (spielziel AC-20): das Ende
trägt `gewinner` (alle des Teams, auch Ausgeschiedene) und `team`; `sieger`
steht nur bei genau einem Gewinner. `tests/waechter-feindlich.test.mjs` verbietet in den
Kampfregeln jeden Vergleich mit dem Besitzer. **Die KI im Team** (ki AC-25): sie fragt `welt.feindlich`,
wen sie angreift; zwei gegen zwei endet im Prüfstand über zwanzig
Startwerte jedes Mal vor Minute 90 mit einem Team als Sieger
(`tests/partien/zwei-gegen-zwei.mjs`, Verbündete als Nachbarn). **D11 ist
fertig: zwei gegen zwei im Browser** (fahrplan AC-24) — Anna und KI 1
gegen KI 2 und KI 3, Teams im Warteraum gesetzt, bis zur Tafel „Team 2 hat
gewonnen — KI 2 und KI 3"; mit der KI von vor ki AC-25 endete dieselbe
Partie nicht vor Minute 90. **Ein Bündnis lösen** (spielziel AC-21, D12):
die Nachricht `kuendigen` tritt aus dem Team aus, gegenüber allen
Verbündeten zugleich; die gemeinsame Sicht endet sofort, Gegner sind sie
nach 60 Sekunden (`KUENDIGUNG_SEKUNDEN`, als Takte), bei „fest" weist der
Server ab. **„Feindlich" und „sieht gemeinsam" sind zwei Fragen**: was der
Server einem schickt, fragt `welt.teiltSicht`, die Kampfregeln
`welt.feindlich`. Solange eine Frist läuft, endet die Partie nicht als
Teamsieg. Jeder Zustand trägt die Kündigungen als `bu`. **D12 ist fertig:
im Bild** (spielziel AC-24) „Bündnis lösen" neben Aufgeben mit einer
Rückfrage, bei „fest" ohne Knopf, und oben rechts für alle die Ansage mit
der Uhr der Frist; der Browser stellt dieselben zwei Fragen
(`ansicht.feindlich`, `ansicht.teiltSicht`). **Die Zeitgrenze ist eine
Einstellung** (spielziel AC-22, D13): keine, 90 oder 120 Spielminuten,
Vorgabe keine; steht sie, zeigt die Uhr sie dahinter („89:45 / 90:00").
Wer im Test das Unentschieden nach Ablauf braucht, gibt `zeitgrenze: 90`
mit; im Browser stellt der Prüfgriff `uhrStellen` die Uhr vor. **D13 ist
fertig: die Spielgeschwindigkeit** (spielziel AC-23) — 1,0, 1,5 oder 2,0.
Eine Spielsekunde bleibt zehn Takte; der Steckbrief sagt dem Raum
`takte(einstellungen)` (10, 15, 20), und der Raum rechnet nach der
Wanduhr, nicht nach der Zahl der Schläge — nach einem Stocken holt er
höchstens eine Sekunde nach. Der Zeitraffer der Tests multipliziert
darauf. Im Browser streckt `ansicht.taktdauer` die Bewegung, die Uhr
zählt Spielzeit. **Aus D14 steht der Marktkarren** (einheiten AC-39): am
Markt ab der Ritterzeit, 100 Holz und 50 Gold, 70 Leben, eigene Figur
(Pony vor dem Planwagen); Ausbildungszeit 51 s und Sicht 7 gesetzt, nicht
geprüft. Er ist reine Daten — `angriff: 0` ergibt Gang statt Angriff,
keine Wache, weißes Zeichen und „Greift nicht an". **Er handelt**
(AC-40): ein Rechtsklick auf einen anderen Markt, der keinem Gegner gehört,
ist der Auftrag `handel` — geladen am Ziel, gutgeschrieben daheim, Gold je
Fahrt `faktor · d · (d / S + sockel)` aus `HANDEL.karren`. Der Faktor ist
gemessen (0,77 statt 0,46 der Vorlage): auf halber Kartenbreite bringt ein
Karren 18 Gold je Minute, etwas weniger als ein Dorfbewohner am Gold (20). Fällt ein Markt oder
wird das Ziel feindlich, steht er im selben Takt. Die Leiste nennt die
Strecke (`hd` am Karren). Die sichtbare Ladung (AC-41) wartet auf die neuen
Figuren. **Die KI handelt** (ki AC-26): wird das Gold in Reichweite knapp
(unter 800), baut sie einen Markt am Dorf und einen zweiten weit davon und
vom Gegner weg, bildet bis zu acht Karren aus und verkauft Stein, wenn ihr
das Gold für einen fehlt. Ein Karren ist für sie keine Kampfeinheit
(`ki.kaempft()` fragt den Angriff). Das Patt mit leerem Gold, das es
seltener machen sollte, gibt es auf diesem Zweig nicht — gemessen wird
deshalb mit geleertem Gold (`tests/strategie-ki-handel.test.mjs`).
**Stufe E hat begonnen** (Häuser, ADR-0014): **am Bildschirm heißen die
Zeitalter Landsitz, Lehen, Fürstentum, Krone** (bedienung AC-45). Die
gebeugten Formen stehen in `ZEITALTER` (`artikel`, `genitiv`, `ab`, `zum`),
nie zusammengesetzt; `tests/waechter-zeitalter.test.mjs` findet die alten
Namen in jedem Bildschirmtext. In Bezeichnern, Specs, Testnamen und
Bildunterschriften bleiben die alten Namen die Arbeitsnamen der Stufen.
**Ein Haus ist Daten** (spielziel AC-17, fahrplan AC-17): `HAEUSER` in
`daten.js`, Boni in der Form der Verbesserungen, gelesen nur über
`welt.wirkungen()`; das Haus je Spieler ist die Einstellung
`haeuser: { <spielerId>: <haus> }`. **Gewählt wird es im Warteraum** je
Platz wie das Team (spielauswahl AC-24), Vorgabe Zufall — gezogen aus dem
Startwert im Steckbrief. Browsertests, die nicht von Häusern handeln, spielen
das Haus ohne Boni (`partieMit` setzt es, `haeuserSetzen`) — das
**Prüfhaus**, das nur der Browserlauf anlegt (`e2e/helpers/pruefhaus.mjs`).
**Jeder Bonus wirkt** (spielziel AC-26): je Bonus eine Messung im Spiel mit
und ohne Haus (`tests/strategie-haeuser-wirkung.test.mjs`); Wehrsteins Turm
und Burg reichen weiter (Angriff, Reichweite und Nachladezeit eines
Gebäudes nur, wenn es schießt), Silberfurt handelt mit 15 % Gebühr und
+20 % Gold je Fahrt (`handel` in den Boni, `welt.handelswert`).
**Der Mannschaftsbonus gilt nur im Bündnis** (spielziel AC-25):
`mannschaft` neben `boni` in `HAEUSER`, gelesen in `welt.wirkungen()` für
das Haus selbst und jeden, mit dem es die Sicht teilt (`teiltSicht`), je
Haus einmal; die Kündigung nimmt ihn im selben Takt (`buendnisStand`).
Schießanlage und Kaserne bilden 20 % schneller aus
(`welt.ausbildungstempo`, nur Einheiten), Karren zwischen Verbündeten
bringen 20 % mehr (`handel.verbuendetAnteil`). Kein Mannschaftsbonus trägt
Leben oder Nahrung (`tests/strategie-mannschaft.test.mjs`).
**Die KI neigt zu ihrem Haus** (ki AC-27): `ki: { schwerpunkt, goldKnapp }`
in `HAEUSER` — ein Militärgebäude als Schwerpunkt baut sie zuerst, baut es
nach und bedient es zuerst, Silberfurt handelt ab der Ritterzeit. Der
Nebeltest zu fahrplan AC-11 spielt seitdem mit zwei Häusern je Partie
(`tests/partien/ki-im-nebel.test.mjs`). **Wehrstein baut Türme** (ki
AC-30): ein Schwerpunkt, der nichts ausbildet, ist ein Bauwerk
(`ki.bauwerkePruefen`) — zwei Wachtürme am Dorf, drei Sammler am Stein,
erst nach dem ersten Aufbruch, sonst kostet der Stein den ersten Angriff.
Der Nebeltest steht damit bei 36 von 40 vor Minute 60, Median 44,9 —
knapp unter der Grenze. **Die Häuser gegeneinander** misst `npm run pruefstand:haeuser`
(Runde 176, 200 Partien): Eschenbruch gewinnt 85 %, Distelhag 31 % und
gegen Eschenbruch 0 von 20 — auch nach jeder Gegenprobe an den Boni. Die
Ursache ist nicht, dass die KI nie auf das gesehene Heer antwortet: das
das Antworten, gebaut als ki AC-31 (Runde 177, lokaler Zweig
`strategie-ki-antwort`), änderte nichts, denn beide antworten. **Gemessen
in Runde 179** (zehn Austauschproben): Eschenbruchs Vorsprung ist die Summe
aus Holzbonus und Reichweite (ganz leer 51 %), Distelhag kostet seine
Neigung zur Kaserne 15 bis 20 Punkte. **Wer zur Kaserne neigt, baut im
Wechsel nach** (ki AC-32, Runde 180): eine weitere Kaserne nur, solange es
weniger Kasernen als andere Militärgebäude gibt — Distelhag 47 statt 26 %
über 160 Partien. **Eschenbruch abgeschwächt** (Runde 201, Benutzer):
Holz +5 % statt +15 %, Schützen +1 Reichweite erst ab dem Fürstentum —
ein Bonus ab einem Zeitalter steht als `boniAb` in `HAEUSER` und kommt mit
dem Aufstieg (`welt.zeitalterWirkungen`). Gemessen 73 % statt 85 %.
**Die anderen gestärkt** (Runde 202, Benutzer): Bogen- und
Armbrustschütze 30 statt 25 Holz, Silberfurt Gold +15 %, Distelhag
Fernrüstung +2. Über 200 Partien jetzt Eschenbruch 66, Distelhag 58,
Rappenstein 50, Wehrstein 48, Silberfurt 29 % — Silberfurt einen Punkt
unter spielziel AC-18 (30 bis 70 %), innerhalb der Streuung; der Test dazu
in `npm run check` fehlt.
**Voller Wohnraum fällt auf** (bedienung AC-43): wartet ein eigener
Auftrag, steht die Bevölkerung oben rot umrandet, auch ohne Auswahl
(`ansicht.wartetEtwas()`). **Gruppentasten** (bedienung AC-5): `Strg`
oder `Alt` mit einer Ziffer legt die Auswahl ab, die Ziffer holt sie
zurück, ohne Gefallene und Bekehrte (`ansicht.gruppeAblegen`,
`gruppeAbrufen`; gelesen über `e.code`). Ob Chrome `Strg`+`1` bis `8` für
die Tabs behält, ist nicht geprüft — deshalb `Alt` daneben. **Mit
Umschalt** kommen Klick und Rahmen zur Auswahl hinzu (bedienung AC-3), ein
**Doppelklick** wählt alle eigenen Einheiten der Art im Bild (AC-4,
`ansicht.typWaehlen`). **Umschalt mit Rechtsklick** hängt ein Ziel an die
Reihe (AC-14, `einheit.wegpunkte`, höchstens 20): wer geht, geht sie der
Reihe nach ab, wer steht, sofort; ein Befehl ohne Umschalt oder eine
Unterbrechung verwirft sie; auf einen Gegner gesetzt, hängt es einen
Angriff an (AC-50, `einheit.angriffe`, `welt.naechsterAngriff()`).
**Mit Umschalt gebaut** (AC-48) bleibt der
Bauplatz in der Hand, und wer schon baut, baut die neue Baustelle danach
(`auftrag.folge`, wie bei der Mauer). Der Server schickt nur die Zahl `q`, die Linie
mit Ringen zeichnet der Browser aus den eigenen Klicks. **Die erste Partie
erklärt sich** (AC-21): drei Sätze links unter der Leiste, bis „Verstanden“;
der Browser merkt es sich (`erklaerungGesehen`). Im Browserlauf gilt sie als
gesehen — `e2e/helpers/seite.mjs` setzt den Merker in jedem Fenster, außer
`erklaerungPruefen` steht im Sitzungsspeicher. **Die Maus am Bildschirmrand schiebt die Karte**
(AC-9, die äußersten 12 Bildpunkte), abschaltbar in der Tastenübersicht;
die Wahl merkt sich der Browser. **Die Leertaste** springt zum Dorfzentrum
und ein zweites Mal zurück (AC-10, `ansicht.basisSprung`). **Reißt die
Verbindung**, steht ein Hinweis mitten im Bild mit „Neu laden und
zurückkehren" (AC-19, uebertragung AC-9; im Browsertest kappt der
Prüfgriff `trennen` sie vom Server aus). **`Tab` gehalten** zeigt den
Spielstand (AC-20): je Spieler Zeitalter, und Vorräte mit Bevölkerung von
einem selbst und den Verbündeten — Gegnern schickt der Server sie im Nebel
nicht (kampf AC-13), dort steht ein Strich. **Punkte sieht jeder**
(AC-47): ein Punkt je 10 gesammelte Rohstoffe und je 10, die ausgebildete
Einheiten gekostet haben, je 5 für Verbesserungen und Aufstiege
(`welt.punkte()`, auf der Leitung `pk`, auch an Gegner im Nebel); je 5
für das, was vernichtete Gegner gekostet haben (AC-49, `welt.siegZaehlen()`
in `schlaegeAbrechnen()`, nur bei `feindlich`).

**Rückmeldungen aus dem ersten Spiel auf dem Server** (2026-11-12, Zweig
`strategie-bildumbau`): **Der Klick trifft das Bild** (bedienung AC-51) — den
Körper des Schafs, die Baumkrone, das Dach des Lagers, nicht das Bodenfeld
dahinter —, und **am Zeiger steht vorher, was der Rechtsklick täte** (AC-52,
`ansicht.zeigerZiel`). Ein **Rechtsklick auf die Übersichtskarte** schickt die
Auswahl (AC-53). **Die Leiste bleibt stehen** (AC-54): die Schlange hat ihren
eigenen Platz, kein Knopf wandert. **Über jedem Knopf steht eine Tafel** mit
Preis, Wirkung in Zahlen und Dauer (AC-55) — die Sätze schreibt der Server
(`server/spiele/strategie/bringt.js`), der Browser liest keine Wirkung aus
den Daten. **Geschoben wird auch, wenn die Maus das Fenster verlässt**
(AC-56), und **die Punkte stehen ständig über der Übersichtskarte** (AC-57).
Als Umriss erscheint nur, wer hinter einem Gebäude steht, das schon Wände
hat (AC-30) — ein Fundament verdeckt niemanden. **Ist ein Vorrat leer** und
kein gleicher in der Nähe, bringt der Sammler heim, was er trägt
(einheiten AC-55); ein **Rechtsklick auf ein Lager lädt ab** und führt zur
alten Arbeit zurück (AC-56, Auftrag `abgeben`); nach einem fertigen Bau baut
der Bauer **an der nächsten eigenen Baustelle** in acht Feldern weiter (bauen
AC-36). **Eine laufende Partie wartet** (raeume AC-17): gehen alle, hält ihre
Uhr an, dreißig Minuten lang, und sie sperrt beim Eröffnen niemanden aus;
**der Vorraum bietet die Rückkehr an** (AC-18). **Die KI mauert niemanden
ein** (ki AC-10, `ki.sperrtEin`): ein Bauplatz, der weniger als 40 Felder
Land abschneidet, wird verworfen. **Zweiter Stapel:** **Pause** (speichern
AC-19 bis AC-21) — Knopf oben und `F3`: die Uhr steht, Befehle werden
verworfen, alle sehen, wer angehalten hat; fortsetzen kann jeder. Mit
mehreren Menschen höchstens fünf Minuten und zweimal je Spieler, allein ohne
Grenze. Die Pause gehört dem **Raum** (`raum.anhalten`, `fortsetzen`,
`pausenstand`), die Welt wird nur nicht getaktet (ADR-0006). **Fremdes
ansehen** (bedienung AC-58): ein Klick auf eine fremde Einheit oder ein
fremdes Gebäude zeigt Namen, Besitzer und Leben, gestrichelt umrandet, ohne
Befehle (`ansicht.angesehen`). **Der Späherreiter ist ab der Feudalzeit
schneller** (einheiten AC-57): `ZEITALTER[1].wirkung`, 1,2 → 1,55 Felder je
Sekunde, gelesen wie jede Wirkung über `welt.wirkungen()`; der Wert stammt
nicht aus `vorlage-aoe2.md`. **Ton** (bedienung AC-59 bis AC-62,
`public/ton.js`): Signale zu Ereignissen (`KLAENGE` mit `noten`), **Kampf
und Arbeit dort, wo sie im Bild stehen** (`KLAENGE` mit `art`, jedes Mal
neu gewürfelt; `ansicht.klangAn` gibt Lautstärke und Seite aus der Lage im
Bild, außerhalb ist es still; Schläge klingen im Takt der Figur,
`ansicht.schlagHoeren`) und **Musik als Stück** — Thema, Höhe und Aufbruch
in d-Moll als Noten (`SAETZE`, `AKKORDE`), dazwischen gewürfelte Ruhe; im
Kampf (`ton.kampfMelden`, verklingt in 25 s) dichtere Trommeln und keine
Ruhe. Alles im Browser erzeugt (kein Material von außen), zwei Schalter in
der Tastenübersicht. Wer an den Lautstärken dreht, misst offline nach
(`npm run ton:messen`, schreibt auch WAV; zuletzt Musik 0,06 effektiv, im Gefecht
keine Spitze über 0,65). Gemessen ist, dass und wann etwas klingt — wie es
klingt, entscheidet ein Ohr. **Ein fremdes Gebäude steht im Bild, sobald
ein Feld seiner Grundfläche in Sicht ist** (kampf AC-12,
`ansicht.siehtGebaeude`) — dieselbe Regel wie `welt.siehtGebaeude`; nur was
im Bild steht, verdeckt eine Einheit zum Umriss.
**Die gerenderten Bilder sind die Vorgabe** (darstellung AC-22, AC-24,
ADR-0016, 2026-11-12): Figuren, Gelände und jedes Gebäude samt Baustelle
kommen aus den Tafeln unter `public/bilder/`, auch die Knopfbilder der
Leiste; `?bilder=0` zeigt das gezeichnete Aussehen, das als Rückfall im Code
bleibt (`npm run sicht -- --gezeichnet`). Die Partie zeichnet erst, wenn die
Tafeln geladen sind (`bilderWarten()`, bis dahin „Bilder werden geladen …");
fehlt eine Tafel, wird nur dieses Stück gezeichnet. Mauer und Tor setzen sich
aus Stücken zusammen (`mauerZellen`, `ansicht.gebaeudeLage`), ihre Schatten
liegen in einer eigenen Schicht. Getroffen und verdeckt wird am Bild
(`zelleGetroffen`): das gerenderte Dorfzentrum ist niedriger als das
gezeichnete. Jede Datei trägt ein `ETag` — die Tafeln (über 20 MB) kommen
nur einmal (darstellung AC-25). Die Schautafel zeigt und misst, was das Spiel
zeigt — die gerenderten Bilder; was der Browser für alle Tafeln an Speicher
hält, ist nicht gemessen. Ein Bildschirmfoto des gerenderten Spielbilds dauert länger als
ein Pfeilflug: wer einen Pfeil belegt, hält ihn im Bild fest
(`strategie-burg.spec.mjs`, `strategie-tuerme.spec.mjs`).

**Rückmeldungen aus dem zweiten Spiel auf dem Server** (2026-11-13/14, 41
Punkte; welche gebaut sind und welche warten, steht im Steuerstand).
**Wirtschaft:** das Bergbaulager forscht Gold- und Steinbergbau, im
Fürstentum folgen Schächte, Bogensäge und Schwerer Pflug (bauen AC-43), das
Dorfzentrum gibt Schubkarre und Handkarren (AC-44) — `tragkraft` ist seitdem
ein verbesserbarer Wert und wird nur über `welt.tragkraft()` gelesen. **Eine
leere Farm liegt brach** statt zu verschwinden (AC-41): ein Rechtsklick mit
einem Dorfbewohner sät für 60 Holz neu aus, ein Schalter an der Farm lässt
das von selbst geschehen (AC-42, Nachricht `farmen`); die KI räumt ihre
Brachen wie bisher. Ein Lager neben einem Vorrat schickt seine Bauleute
dorthin (AC-40), und wer einen unerreichbaren Vorrat angewiesen bekommt,
nimmt den daneben (einheiten AC-63). **Führt zum geklickten Feld kein
Weg**, geht die Einheit so nah heran, wie es geht (einheiten AC-64,
`welt.gangBeginnen`, `welt.naechstesErreichbare`) — auch am angehängten
Wegpunkt und als Marschziel des Angriffslaufs; nicht gemessen ist, was das
Fluten bei großen Gruppen kostet. **Der Nebel reicht sechs Felder über die
Kartenkante** (darstellung AC-29, `NEBELRAND` in `public/nebel.js`): ein
Baum an der Kante ist bis in die Krone gedämpft. **Sammler haben einen
Standplatz** (einheiten AC-30, `welt.standplatz`, `STANDPLAETZE`): jedes
Nachbarfeld eines Vorrats hat vier Plätze, seine Viertel; der Platz steht
als `auftrag.stand` und bleibt über das Abladen vergeben, sind alle
vergeben, geht es an den Vorrat daneben. Das erreichbare Nachbarfeld aus
AC-63 heißt `auftrag.seite`. Einheiten stehen damit auch auf gebrochenen
Koordinaten — wer ein Feld braucht, rundet. **Ein Klick in den Nebel ist
ein Gang** (kampf AC-11, `welt.feindAn`): der Server liest nur einen
Gegner aus dem Feld, den der Spieler sieht. Rechenteil-Tests, die einen
Angriff befehlen, rechnen nach dem Hinstellen die Sicht
(`welt.sichtAktualisieren()`) oder spielen aufgedeckt. **Kampf:** Baustellen sehen und
schießen nicht (kampf AC-24), ein befohlenes Ziel bleibt das Ziel (AC-25),
ein Karren zwischen zwei eigenen Märkten bringt weniger als zu einem fremden
(einheiten AC-40). **Im Bild:** ein Menü mit dem Weg zurück in den Vorraum
(bedienung AC-66), das Zeitalter der anderen in der Punkteliste (AC-67), das
eigene und fremde Haus an der Auswahl (AC-69), Kampfwerte als „3+1"
(AC-70), Vorräte und erlegte Schafe lassen sich ansehen (AC-63), eine
Schlagbewegung je Schlag (AC-72), der Mönch ist zu hören und seine Ruhe zu
sehen (AC-74, AC-68). **`Entf` entfernt das Gewählte** (AC-75,
Nachricht `entlassen`): eine Einheit oder ein Gebäude je Druck, ohne
Punkte für den Gegner. **Das Baumenü hat zwei Seiten** (AC-64): Wirtschaft
und Militär, `seite` in `GEBAEUDE`, Reiter links oder noch einmal `B`; die
Tasten zählen über beide Seiten, und nach jedem gesetzten oder
abgebrochenen Bau und jeder neuen Auswahl steht wieder die Wirtschaft
(`ansicht.bauseite`). Browsertests, die ein Militärgebäude mit der Maus
wählen, klicken vorher `[data-bauseite="1"]`. Ein gefallenes Gebäude liegt kurz als Trümmer da
(darstellung AC-26), nach dem Ende steht das Bild (spielziel AC-28), Zoomen
stockt nicht mehr (darstellung AC-27), und **Pfeil und Wurfstein kommen aus
einer gerenderten Tafel** (`geschoss`, darstellung AC-28) — der gezeichnete
Strich bleibt der Rückfall. **Offen:** ob Chrome im Vollbild `Strg`+Ziffer
hergibt (bedienung AC-73, `in-qa`), das Baumenü auf zwei Seiten (AC-64) und
alles an der KI.

**Rückmeldungen vom 2026-11-17** (Punkte 45 bis 58; welche warten, steht im
Steuerstand). **Ein Gefecht stockt nicht mehr** (darstellung AC-30): die
Figuren kommen aus **verkleinerten Tafeln** — je Tafelbild und Zellgröße
eine Fassung, die `createImageBitmap` abseits des Hauptfadens verkleinert
(`public/bilder.js`: `atlantenEin`, `atlasHolen`; Grenze 80 Mio. Bildpunkte)
—, die **Umrisse** Verdeckter entstehen auf einem Blatt
(`ansicht.umrisseZeichnen`, `gebaeudeAlsMaske`), und hat ein Bild acht
Millisekunden lang neue Figurenbilder gezeichnet, bleibt jede weitere Figur
für dieses Bild in der **Haltung von eben** (`Bildspeicher.haltungsfrist`).
Gemessen mit Grafikkarte (`npm run tempo:partie`): im Gefecht 60 statt 34
Bilder je Sekunde, `zeichnen()` 4,0 statt 24,4 ms; im Browserlauf ein bis
zwei Bilder über 50 ms in zehn Sekunden statt sieben. Auf den Rechnern der
Spieler ist es nicht gemessen. **Wer aus einer Leinwand liest, nachdem er
sie geändert hat, kopiert sie ohne Grafikkarte ganz** — erst alles
schreiben, dann lesen. Im Browserlauf trennt die Zahl der Bilder über
50 ms, nicht der längste Abstand. **Wer schlägt, schaut aufs Ziel, und wer
fällt, fällt vom Schlag weg** (bedienung AC-76; die Richtung schickt der
Server als `zr`); **der Pfeil kommt erst nach dem Spannen** und ist kleiner
(AC-79, `ERSTSCHLAG_VOR`, `PFEIL_MASS`); **im Spielbild lässt sich kein Text
markieren** (AC-77); **Geräusche und Musik haben je einen Schieber im
Menü** (AC-78), und an der Abschlusstafel steht der Weg in den Vorraum
(AC-66).

**Rückmeldungen vom 2026-11-18** (Punkte 50, 53, 54, 56, 58). **Der Mönch
heilt, wen man ihm zeigt** (einheiten AC-65): ein Rechtsklick auf einen
eigenen oder verbündeten Verletzten ist der Auftrag `heilen` — er geht hin
und bleibt dabei, bis der andere heil ist; wer kämpft, wird auch auf Befehl
nicht geheilt, der Mönch wartet. **Eine Weiterentwicklung steht unter ihrer
Einheit** (bedienung AC-80): ein flacher Knopf mit goldenem Pfeil unter dem
Knopf der Einheit, die sie austauscht — die Leiste von Kaserne, Schießanlage
und Stall ist dafür rund 40 Bildpunkte höher. **Dorfbewohner reparieren**
(bauen AC-45): ein Rechtsklick auf ein beschädigtes eigenes Gebäude ist der
Auftrag `reparieren`; `REPARATUR` in den Daten (12,5 Leben je Sekunde, jeder
weitere die Hälfte, das ganze Leben kostet den halben Baupreis, bezahlt
Punkt für Punkt, und es zahlt, wer repariert). Die KI repariert nicht, eine
Farm wird nicht repariert. **Pferdezucht** (bauen AC-46): im Stall ab dem
Fürstentum, alles Berittene 10 % schneller — ein Anteil am Tempo steht als
`tempoAnteil` in der Wirkung und rechnet in `welt.einheitenwert()` auf
alles davor. Die Werte beider stammen nicht aus `vorlage-aoe2.md`; die KI
erforscht die Pferdezucht nicht. **Ein gefällter Baum liegt** (darstellung
AC-31): mit dem ersten Stück Holz fällt er, ohne Bewegung, und wird beim
Abbau kürzer — der Server schickt, welche Vorräte angebrochen sind
(`welt.angebrochen()`, im Aufbau `karte.fuellung`), der Browser zeichnet
sie aus der Tafel `baumstumpf` (je Baumart eine Zeile, je Stufe mehrere
Gestalten). Browsertests setzen einen Vorrat mit dem Prüfgriff
`vorratSetzen`. Die Schautafel zeigt die Liegenden nicht.

**Die Einheiten der Häuser** (E6 bis E8, 2026-11-18, einheiten AC-42 bis
AC-49). Drei aus gewöhnlichen Gebäuden: **Eibenschütze** (Eschenbruch,
Schießanlage), **Pavesenschütze** (Wehrstein, Schießanlage, Rüstung 1/4),
**Söldner** (Kaserne, jedes Haus, Silberfurt billiger). Fünf aus der Burg,
je Haus eine: **Kriegswolf** (Eschenbruch), **Reiterschütze** (Rappenstein),
**Riese** (Wehrstein), **Meuchler** (Silberfurt), **Wiedergänger**
(Distelhag). Wer sie ausbildet, steht als `haeuser` an der Einheit
(`welt.hausBildetAus`). **Der Meuchler ist getarnt** (kampf AC-22,
`getarnt: 2`): ein Gegner sieht ihn erst auf zwei Felder —
`welt.siehtEinheit` und `welt.verborgen(spielerId, einheit)` sind die eine
Stelle, nicht jede Regel einzeln; bei „Aufgedeckt" gibt es keine Tarnung.
**Der Wiedergänger kostet Gefallene**: `spieler.gefallene` zählt die eigenen
Toten (auch Entlassene), auf der Leitung `gf`, im Browser
`ansicht.vorraete.gefallene` — sie stehen am Knopf und in der Tafel, nicht
in der Rohstoffleiste. Jede der acht hat ihre gerenderte Figur, der
Wehrturm sein eigenes Bild (bauen AC-38). **Abweichungen von der ersten
Fassung der Spec**, nach dem Gefechtsstand gesetzt: Reiterschütze
Reichweite 5 und Fernrüstung 2, Riese 180 Leben und Rüstung 2/0, Söldner
60 Leben. **Die KI bildet vorerst keine Hauseinheit aus** (`NOCH_NICHT` in
`ki.js`): mit dem Söldner fiel der Nebeltest auf 97, mit den zwei Schützen
auf 102 von 120 (Grenze 105); `npm run pruefstand:haeuser` ist damit nicht
neu gemessen. Der Gefechtsstand ist nicht seitengleich — bei gleichen
Heeren gewinnt die rechte Seite 32 von 40 —, nicht untersucht.
**Je zwei Figuren unterscheiden sich um ein Drittel** (darstellung AC-14),
auch die neuen: der Reiterschütze trägt deshalb einen hellen Filzmantel
statt des Wamses in Spielerfarbe (gegen den Späherreiter vorher 0,15) —
und, weil ihm damit die Spielerfarbe fehlte (0,092, verlangt über 0,1),
eine Leibbinde und einen breiten Deckensaum darin —, der
Kriegswolf ist 1,3-fach so groß wie zuerst (`MASS` in `grafik/wolf.py`,
472 statt 241 Bildpunkte bei Höhe 40). Wer eine Figur ändert, probt mit
`BILDER_PROBE=2 npm run bilder -- <name>` (eine Richtung, rund 2,5 Minuten)
und misst mit `npm run tafel -- "t.unterschiede('figur').filter((p) => p.anteil < 0.4)"`,
bevor er zwanzig Minuten voll rendert.
**Stufe F ist spezifiziert** (Bauabfolge F1 bis F13 im Fahrplan): Aufstieg
in die Krone, je Linie eine Stufe — **der Ritter zwei: Kavalier und
Paladin** (Benutzer, 2026-11-18; kein Champion) —, jede mit eigener
gerenderter Figur, Verbesserungen, Elitestufen der Spezialeinheiten,
Drache, Wunder, die KI in der Krone. Dazu **elf Verbesserungen mit eigenem
Charakter** (bauen AC-52 bis AC-56): Kartografie, Blutlinien,
Karawane, Brandstiftung, Knappen, vier Lehren des Klosters, Tretkran,
Sappeure. **Die Figuren der Einheiten schreibt und rendert die Sitzung
selbst** — kein Hilfsagent mit kleinerem Modell (Benutzer, 2026-11-18).

**Aus Stufe F stehen F1 bis F5** (2026-11-18): der **Aufstieg in die
Krone** (bauen AC-47: zwei Gebäude des Fürstentums oder eine Burg allein),
die **Stufen der Krone** — Zweihandkämpfer, Hellebardier, Husar, Kavalier
und danach Paladin (einheiten AC-66), Langbogenschütze und schwere Armbrust
(AC-67), Belagerungsramme und Onager (AC-68), jede mit eigener gerenderter
Figur —, die **Elitestufen** der fünf Burgeinheiten (AC-69, sie behalten
ihre Figur), die **Schmiede der Krone** (bauen AC-48), Fruchtwechsel und
Zweimannsäge (AC-49), der **Bergfried** mit eigenem Bild, dazu Chemie,
Architektur, Belagerungsingenieure und Wehrpflicht (AC-50), und die **elf
Verbesserungen mit eigenem Charakter** (bauen AC-52 bis AC-56). **Der
Konterkreis hält in der Krone** (fahrplan AC-26, Budget 2000, volle
Schmiede): neun Paarungen 20 von 20, umgekehrt 0; der Paladin fällt vor dem
Hellebardier und schlägt beide Schützenlinien; gegen das Schwert hilft die
schwere Armbrust (19 von 20), nicht der Bogen (0 von 20). **Die KI steigt
nicht in die Krone auf und erforscht nichts davon** (F12, offen), ebenso
offen: die Krone am Stück (F13). Die gesetzten Werte der Krone
stammen nicht alle aus `vorlage-aoe2.md`.

**F6 bis F11 stehen** (2026-11-21, Opus): **Abrüsten** (einheiten AC-50,
`ABRUESTEN`, Nachricht `abruesten`): Fußvolk, Schützen und Reiter legen
in 20 s für 40 Nahrung die Waffen ab und werden Dorfbewohner. **Der Drache** statt des
Trebuchets (`DRACHE` in den Daten, Einstellung `drache`): ein **Ei** liegt
zwischen je zwei Nachbarn (`eierPlaetze` in `karte.js`), ein Dorfbewohner
trägt es ins eigene Kloster (AC-51, Auftrag `ei`); dort **ruft** ein Knopf
ihn für 400 Nahrung und 400 Gold in drei Minuten, wenn fünf Mönche höchstens drei Felder vom Rand stehen,
und alle sehen die Uhr (bauen AC-35, `gerufen` an der Einheit). Er **fliegt**
geradeaus über alles (`fliegt` an der Einheit, keine Wegsuche) und speit
Feuer auf ein Feld Umkreis (Geschoss mit fünftem Wert 2); treffen kann ihn
nur, wer `trifftFlieger` trägt (kampf AC-23, `welt.kannTreffen`) — im
Browser fragt dasselbe `ansicht.feindlichAn` und `bildZiel`, und Flieger
werden nach allem am Boden gezeichnet. **Fällt er, liegt sein Ei** dort,
mit Ansage für alle und Ring auf der Übersichtskarte (AC-53); er **frisst**
Nahrung, ohne Nahrung hungert er (AC-54, `DRACHE.fressen`). **Das Wunder**
(bauen AC-51, `wunder` in `GEBAEUDE`, `hoechstens: 1`): steht es zehn
Minuten (`WUNDER_SEKUNDEN`), gewinnt sein Team (spielziel AC-29); die Uhr
sieht jeder, auch im Nebel. **Der Marktkarren trägt sichtbar Gold**
(einheiten AC-41, `ladung` am Karren). Gesetzt, nicht aus der Vorlage:
Drache Angriff 8 und +660 gegen Gebäude, Ansage 20 s, Hunger 5 Leben je
Sekunde, Wunder 4400 s Bauzeit. einheiten AC-52 bleibt `in-qa`: ob der
Drache KI gegen KI höchstens 60 % gewinnt, misst erst die KI der Krone (F12).

**Der Technologiebaum** (bedienung AC-81 bis AC-86, 2026-11-22): eine
Ebene über dem Spiel, aus dem Menü und im Warteraum neben „Partie starten",
zwei Seiten wie das Baumenü, Zeilen je Zeitalter, Spalten je Gebäude,
goldener Pfeil für Stufen, grauer für Vorstufen; je Haus blass, golden und
mit ▲, was es stärkt; an jedem Eintrag die Tafel der Leiste. Gerechnet auf
dem Server (`server/spiele/strategie/techbaum.js`, Werte je Haus aus
`welt.kampfwerte()`), geholt über `GET /api/spiele/<art>/nachschlagen` —
der Steckbrief trägt `nachschlagen`, `index.js` kennt kein Spiel. Im
Browserlauf steht dort auch das Prüfhaus.

**Gold und Stein sind eine Einstellung beim Eröffnen** (karte AC-18, AC-19,
Benutzer, 2026-11-18; `vorkommen` im Steckbrief, `VORKOMMEN` in
`karte.js`): **wenig** ist das Dorf allein (je Spieler 7 Felder Gold und 5
Stein — die Karte von vorher, Feld für Feld), **mittel** dazu ein
umkämpftes Vorkommen zwischen je zwei Nachbarn (11 und 8, die Vorgabe),
**viel** dazu eigene Vorkommen 17 bis 29 Felder vor dem Dorf (19 und 12).
Jedes hat einen Ring Gras und ist zu Fuß erreichbar; der Zufall der Karte
wird dafür nicht angefasst. Die KI ist auf „mittel“ gemessen (Nebel über
120 Startwerte: 111 vor Minute 60, Median 39,4, keine ohne Sieger; zu
viert jede vor Minute 90), auf „viel“ nicht. `karte.fundorte` sagt Tests,
was wo liegt; es geht nicht über die Leitung.

1. **Stufe A** Dunkle Zeit mit Wirtschafts-KI und Prüfstand · **B** Feudalzeit
   · **C** Partieende und KI-Gegner · **D** Ritterzeit · **E** fünf Häuser ·
   **F** Imperialzeit · **G** Betrieb auf dem Hetzner-VPS.

Außerhalb der Reihe, aber nicht vergessen: Mailversand (konten AC-4, AC-5) und
mehrere Menschen in einer Manager-Liga — beides ruht mit dem Managerspiel.

Der ehrlichste Prüfstein bleibt keiner am Rechner: einmal zu fünft spielen und
sehen, ob es trägt.

## Ton

Der Benutzer schätzt begründete Empfehlungen statt Auswahllisten, und
Widerspruch, wo er berechtigt ist. Zahlen belegen statt behaupten — messen,
dann sagen. Wenn etwas nicht geprüft ist, wird das ausdrücklich gesagt.
