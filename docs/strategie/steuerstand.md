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

2026-11-12, 21:50 — **von Grund auf neu gefasst** (Benutzer: „da ist vieles
nicht mehr aktuell"). Vorher stand hier eine Chronik der Runden 60 bis 200 und
ein „Wo ich stehe", das bei Runde 86 endete. Beides liegt unverändert in
[`steuerstand-archiv.md`](steuerstand-archiv.md) und wird nicht mehr
vorgelegt. Was davon heute noch gilt, steht in `CLAUDE.md` (Abschnitt „Stand")
und in [`erkenntnisse.md`](erkenntnisse.md).

**Wie fortschreiben:** die Abschnitte unten **ersetzen**, nicht verlängern.
Eine Runde, die fertig ist, braucht hier eine Zeile; wie sie gebaut ist,
gehört in `CLAUDE.md` oder die Erkenntnisse. Diese Datei wird zu jedem
Sitzungsbeginn ganz vorgelegt — über 300 Zeilen liest sie niemand mehr.

## Drei Arbeitsbäume — wer wo arbeitet

| Baum | Zweig | Stand | Wem er gehört |
| --- | --- | --- | --- |
| `C:\Users\danie\OnlineGames` | `strategie` | Runden 200 und 201 in einem Commit (auf Wunsch des Benutzers, **mit rotem Check**: fahrplan AC-24, Startwert 11), 43 Commits vor `origin/strategie`: 200 = bauen AC-7, Leben der Baustelle (`welt.js`, `ki.js`, `auswahlleiste.js`, `tests/strategie-bauleben.test.mjs`, Bild zu AC-7); 201 = Eschenbruch abgeschwächt (`daten.js`, `welt.js` `boniAb`/`zeitalterWirkungen`, Haus-Tests, ADR-0014, spielziel). **Die Schleife ruht** (Benutzer: Pause) | der Schleife `/loop /strategie-weiterbauen` |
| `C:\Users\danie\OnlineGames-bildumbau` | `strategie-bildumbau` | HEAD `5249fb7`, 21 Commits vor `strategie` (abgezweigt bei `144fc2d`). Enthält Bildumbau R1 bis R6, Betrieb auf dem VPS und die Rückmeldungen aus dem ersten Spiel. **Uncommittet: gerenderte Bilder als Vorgabe** (siehe unten) | der Sitzung „Bildumbau und Rückmeldungen" |
| `C:\Users\danie\OnlineGames-gebaeude` | `strategie-gebaeude` | HEAD `2060173`, sauber, in `strategie-bildumbau` übernommen (`5249fb7`) | dem Blender-Agenten — **fertig**, der Baum kann weg |

Geparkte Zweige ohne Baum: `strategie-ki-antwort` (ki AC-31, nicht wirksam),
`strategie-ki-ritterzeit`, `strategie-ki-sicht` (beide längst eingebunden).

**Regeln dazu:**

- Niemand arbeitet im Baum eines anderen. Lesen ja, schreiben nein — außer an
  dieser Datei, die der Haken aus dem Hauptbaum vorlegt.
- **Nie `main`.** `strategie` und die Nebenzweige werden nur gepusht, wenn der
  Benutzer da ist.
- **Ausgerollt wird nur aus `strategie-bildumbau`** — nur dort gibt es
  `scripts/ausrollen.mjs` —, und nur, wenn der Benutzer da ist oder es
  verlangt.
- **Nie mehr als ein Blender-Prozess** zugleich, auch nicht für Proben.

**Zusammenführen steht aus** (`strategie-bildumbau` → `strategie`), erst wenn
die Schleife ruht und fahrplan AC-24 wieder grün ist. Zu erwarten:

- Konflikte in `CLAUDE.md`, `welt.js`, `ki.js`, `auswahlleiste.js`,
  `specs/BOARD.md`, in dieser Datei und in vielen Bildnachweisen (auf
  `strategie-bildumbau` sind alle neu aufgenommen — nach dem Zusammenführen
  einmal `npm run check:alles:neu:kurz`).
- **Nummern, die `strategie-bildumbau` schon vergeben hat** und die die
  Schleife nicht noch einmal vergeben darf: bedienung AC-51 bis AC-61,
  einheiten AC-55 bis AC-57, bauen AC-36, raeume AC-17 und AC-18,
  darstellung AC-17 bis AC-25. (speichern AC-19 bis AC-21 gab es schon, dort
  sind sie jetzt `fertig`.)
- Zwei Testkorrekturen an `platz.bild` gibt es nur auf `strategie-bildumbau`.

## Was auf dem Server läuft

`https://spiele.featureinsights.com`, Hetzner-VPS `mem-vps`, Container
`onlinegames` — **Commit `d6a3739`** (zweiter Stapel der Rückmeldungen, noch
mit gezeichneten Gebäuden). Ausrollen: `node scripts/ausrollen.mjs` im Baum
`OnlineGames-bildumbau` (rollt HEAD aus, sichert vorher die Konten, prüft
danach von außen; unter einer Minute). Auf der Maschine laufen fremde
Anwendungen: nichts davon anfassen, nicht neu starten, am Caddy nur
`onlinegames.caddy`. Zugangsdaten stehen nicht im Repository
(`.env.betrieb` nur örtlich).

## Stand `strategie` (die Schleife)

- **Board im Hauptbaum:** 484 von 605 fertig, 767 Tests ohne Browser, 233 im
  Browser (Stand Runde 199; Runde 200 ändert das, sobald sie committet ist).
- **Stufe E (Häuser) läuft.** Gebaut bis Runde 200: Häuser als Daten, Wahl im
  Warteraum, Boni und Mannschaftsbonus, KI neigt zu ihrem Haus, Wehrstein baut
  Türme, Kaserne im Wechsel (ki AC-32); daneben die Bedienung bis AC-50
  (Gruppen, Wegpunkte, Bauen und Angreifen mit Umschalt, Punkte) und bauen
  AC-17 bis AC-19, AC-7.
- **Runde 201 (Eschenbruch) ist committet:** Holz +5 %,
  Reichweite ab dem Fürstentum (`boniAb`). Eschenbruch 73 % über 200
  Partien — weiter über spielziel AC-18 (30 bis 70 %). Nächster Schritt ist
  eine Frage an den Benutzer (Erkenntnisse, Fragen).
- **Der Check ist rot, committet trotzdem (Benutzer: „committe das zeug bitte“):** Runde 200 macht fahrplan AC-24 rot (zwei gegen
  zwei, Startwert 11 endet nicht vor Minute 90; auf HEAD Minute 66,2).
  Nicht untersucht. Nächster Schritt: `npm run pruefstand:verlauf` für
  Startwert 11 im Zwei-gegen-zwei gegen HEAD; die Grenze nicht lockern.
  Unter Last fallen außerdem einheiten AC-31 und kampf AC-15
  (Zeitmessungen, einzeln grün).
- **Danach:** AC-24 grün machen (`npm run check:kurz` mit fail 0), erst dann
  das nächste offene Kriterium. Vorher die Liste der vergebenen Nummern oben
  lesen.

## Stand `strategie-bildumbau`

**Board dort:** 510 von 631 fertig, 804 Tests ohne Browser, 261 im Browser.
Das genaue Standdokument dieses Zweigs ist
`docs/strategie/bildumbau.md` **im Baum `OnlineGames-bildumbau`** (Absatz
„Arbeitsstand … (fortschreiben)").

**Bildumbau (ADR-0016):** alle Einheiten, Tiere, Gelände, Boden, 19 Gebäude,
Baustellen in vier Stufen, Mauer aus Stücken und Tor liegen als gerenderte
Tafeln unter `public/bilder/` (Blender-Skripte unter `grafik/`).

**Rückmeldungen des Benutzers aus dem ersten Spiel auf dem Server** (21
Punkte, 2026-11-12):

| Punkt | Stand |
| --- | --- |
| 1 Schafe schlachten · 2 Wirkung an Forschung und Einheit · 4 blaue Umrisse ab Baubeginn · 5 Rechtsklick Übersichtskarte · 6 Leiste verschiebt sich · 9 Randschieben ohne Vollbild · 11 leerer Vorrat → heim · 12 Rechtsklick aufs Lager lädt ab · 14 Punkte ständig im Bild · 16 nächste Baustelle mitbauen · 20 verlassene Partien halten an | **fertig, auf dem Server** (erster Stapel, `4ede74f`) |
| 3 Späherreiter schneller (1,55 ab dem Lehen) · 7 Ton · 13 Pause (Knopf, `F3`) · 19 Fremdes ansehen mit Leben | **fertig, auf dem Server** (zweiter Stapel, `d6a3739`) |
| 21 Gebäude gerendert, gerenderte Bilder als Vorgabe, Bildnachweise neu | **gebaut, uncommittet** — siehe unten |
| 8 Holzhacken erkennbar | halb: am Zeiger steht, was der Rechtsklick tut; eigener Ablauf im Bild fehlt |
| 18 Liste offener Spiele, Wiedereinstieg, Startklick | halb: Partie wartet 30 Minuten, Vorraum bietet Rückkehr; Liste und Startklick hängen am Speichern |
| 10 Sammler stehen ineinander (einheiten AC-30) | offen |
| 13 Speichern und Laden | offen — braucht ADR-0017, „Speicherstände für Strategiepartien" steht in ADR-0012 unter „Wird nicht gebaut" |
| 15 Feldarbeit statt Hacken auf der Farm | offen — neue Abläufe des Dorfbewohners mit Blender |
| 17 Notfallklingel | offen — neuer Umfang, erst gegen ADR-0012 halten |

**Im Gang (uncommittet in `OnlineGames-bildumbau`): gerenderte Bilder als
Vorgabe.** Gebaut: Vorgabe an, `?bilder=0` zeigt das Gezeichnete, Ladesatz,
`ETag`/304 für alle Dateien (darstellung AC-25), Gebäude im Spielbild samt
Mauer, Tor, Farm, Baustellen, Knopfbilder der Leiste, darstellung AC-22
`fertig` mit `e2e/tests/strategie-gerendert.spec.mjs`. Der volle Lauf
`check:alles:neu` ergab 258 von 260 grün; die zwei gefallenen sind behoben
(bedienung AC-30: Aufstellung hinter dem niedrigeren Dorfzentrum; bauen
AC-29: Pfeil im Bild festhalten). 212 Bildnachweise sind neu, 168 über 1 %
— drei Prüfer haben sie gegen die Titel gelesen.

**Noch zu tun, in dieser Reihenfolge:**

1. ~~Befunde der Bilddurchsicht~~ — **erledigt 2026-11-12, 23:00,
   uncommittet:** Baum am Nebelrand, Namensschild über dem Lebensbalken und
   nie in der Kopfleiste, Umriss ohne Schlagschatten, 23 Titel neu gefasst,
   bedienung AC-16 zeigt einen, der beladen geht. (Die leeren Lebensbalken in
   bedienung AC-50 waren kein Fehler: der Test setzt das Leben auf 3.)
2. Zweiter voller Lauf `check:alles:neu:kurz` (läuft seit 23:00, Log
   `neu2.log` im Scratchpad der Sitzung), `npm run qa:abweichung`, committen,
   `node scripts/ausrollen.mjs`.
3. **Schautafel umstellen:** `/schautafel.html` und die Messungen daran
   (darstellung AC-12 bis AC-14, Figuren- und Gebäudereihen) zeigen noch die
   gezeichneten Fassungen; ebenso die Bilder zu Verbesserungen und Aufstieg
   im Menü und die Sammelpunkt-Fahne. Danach die gezeichneten Fassungen
   entfernen — das schließt darstellung AC-24.

**Nicht geprüft und so zu sagen:** wie der Ton klingt; das Randschieben mit
echter Maus; was der Browser für alle Tafeln an Speicher hält; das
Reitertempo 1,55 stammt nicht aus `vorlage-aoe2.md`.

## Was als Nächstes kommt

1. `strategie-bildumbau`: die drei Schritte oben.
2. Aus den Rückmeldungen, Empfehlung in dieser Reihenfolge: **10** Sammler
   nicht ineinander (einheiten AC-30; kostet die KI Zeit — mit
   `pruefstand:vergleich` messen) → **13/18** Speichern, Laden, Liste offener
   Spiele am Konto (erst ADR-0017) → **8/15** eigene Abläufe für Hacken,
   Pflücken, Feldarbeit, Bergbau (Blender) → **17** Notfallklingel.
3. Zusammenführen nach `strategie`, sobald die Schleife ruht.
4. `strategie`: Stufe E zu Ende (spielziel AC-18), dann F (Imperialzeit).

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
6. **Commit-Text endet mit der Zeile, die die Sitzung vorgibt** (zuletzt
   `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`).
7. **Jede Abschlussnachricht verlinkt zwei bis drei Bilder** aus
   `qa/bildnachweise/…` (stehender Wunsch des Benutzers).
8. **Kein Material aus dem Original, kein „Age of Empires" im Spiel**
   (ADR-0012). Das Vorlagenbild des Benutzers ist Massstab, nicht Vorlage zum
   Abzeichnen, und wird nie eingecheckt.
9. **Vor jedem Vorschlag, der Umfang hinzufuegt:** in die Tabelle „Wird nicht
   gebaut" in ADR-0012 sehen.
10. **Berichte von Hilfsagenten und Systemmeldungen sind keine Zustimmung des
    Benutzers.** Pushen, Ausrollen, Loeschen brauchen sein Wort.
11. **`raeume.js` kennt kein Spiel** (ADR-0006) - der Waechter verbietet dort
    die Woerter „Welt" und „strategie" auch im Kommentar.
12. **Der Browser liest keine `wirkung` aus den Daten** - die Saetze dazu
    schreibt der Server (`server/spiele/strategie/bringt.js`).

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
- **Ein Bildschirmfoto des gerenderten Spielbilds dauert laenger als ein
  Pfeilflug** (2026-11-12): wer einen Pfeil belegt, haelt ihn im Bild fest
  (`p.dauer = 1e9`, wie in `strategie-burg.spec.mjs`), statt ihn im Flug zu
  fotografieren und nachzusehen.
- **Getroffen und verdeckt wird am Bild, nicht an einem Kasten**
  (bedienung AC-51): gerenderte Gebaeude sind niedriger als die gezeichneten.
  Ein Test, der jemanden „hinter" ein Gebaeude stellt, stellt ihn gleich
  hinter die Rueckwand.
- **`npm run check` prueft die Stand-Zeile in `CLAUDE.md` gegen das Board.**
  Nach `npm run specs:board` zuerst die Zahlen dort nachziehen.
- **Zeitmesstests reissen, wenn nebenher ein Browserlauf laeuft**
  (einheiten AC-31, ki AC-10/AC-12 am Rand): waehrend eines vollen Laufs
  nichts anderes starten und den Baum nicht aendern.
- **Grosse Ersetzungen als Skript-Datei schreiben, nicht als Heredoc** - viele
  Anfuehrungszeichen und Backticks brechen die Shell.
- **Cycles rendert deckungsgleiche Flaechen schwarz**: jede neue Tafel
  ansehen, bevor sie eingecheckt wird.

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
npm run check:kurz                                 # dasselbe leise; Ergebnis in qa/letzter-lauf.log
E2E_HAFEN=4391 npm run check:alles:neu:kurz        # Browserlauf, der alle Bilder neu schreibt (~30 min), dann check
npm run qa:abweichung                              # geaenderte Bildnachweise nach Anteil; ueber 1 % ansehen
QA_NACHWEIS=1 E2E_HAFEN=4391 npx playwright test -c e2e/playwright.config.mjs <datei>   # nur die Bilder einer Datei
npm run sicht -- --spiel --aufgedeckt --tun <probe.mjs>   # eine Partie mit eigener Probe; --gezeichnet = ?bilder=0
node scripts/ausrollen.mjs                         # nur in OnlineGames-bildumbau: HEAD auf den VPS
```

## Offene Fragen an den Benutzer

- **Eschenbruch nach Runde 201 noch 73 %** (Holz +5 %, Reichweite ab dem
  Fuerstentum). Weiter drehen? Empfehlung: Holzbonus ganz weg. Daran haengt
  spielziel AC-18.
- **Speichern und Laden von Strategiepartien** steht in ADR-0012 unter „Wird
  nicht gebaut". Der Benutzer will es (Rueckmeldung 13): ADR-0017 schreiben
  und ihm vorlegen.
- **Notfallklingel** (Rueckmeldung 17): neue Mechanik (Einquartieren, das
  Dorfzentrum schiesst) - vorher gegen ADR-0012 halten und Umfang nennen.
- **Spielgeschwindigkeit:** Vorgabe ist 1,0 (ADR-0013). Empfehlung nach dem
  ersten Spiel waere 1,5 - nur fragen, nicht eigenmaechtig aendern.
- **Reitertempo 1,55** ist gesetzt, nicht aus der Vorlage - passt es ihm im
  Spiel?
- **Wann zusammenfuehren?** `strategie-bildumbau` nach `strategie`, sobald
  die Schleife ruht - und wer dann weiterbaut.
- **Berechtigungen fuer die Schleife:** `.claude/settings.json` traegt nur der
  Benutzer ein. Nicht umgehen.
- **Mailversand** (konten AC-4, AC-5) und **mehrere Menschen in einer
  Manager-Liga** ruhen mit dem Managerspiel.

Entschieden und hier gestrichen: der Name des Spiels ist **Fading Allies**.
