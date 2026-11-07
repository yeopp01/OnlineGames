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

2026-11-07, nach Runde 64 (kampf AC-2, AC-3, AC-5 und einheiten AC-25 fertig - **von B5 fehlen nur noch der Angriffslauf und das rote Zeichen**).

## Wo ich stehe

- **Branch:** `strategie`. Nie auf `main` arbeiten, **nie pushen, nie deployen.**
- **Board:** 368 von 504 Kriterien fertig · 1 in Arbeit · 5 in QA · 4 geplant ·
  118 offen · 8 zurueckgestellt. 372 Tests ohne Browser, 141 im Browser.
- **Stufe A ist erreicht** (fahrplan AC-3 bis AC-7).
- **Stufe B:** Bauabfolge B1 bis B7 im [Fahrplan](fahrplan.md). **B1 bis B4
  sind fertig, aus B5 alles ausser dem Angriffslauf (kampf AC-4) und dem roten
  Zeichen (bedienung AC-34).** Der Arbeitsbaum ist sauber.
- **Runde 65 ist eine Rueckschau** (jede fuenfte Runde, Abschnitt 8 der
  Anweisung) - nicht bauen.

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

**Runde 65 ist eine Rueckschau.** Danach der Rest von B5: **kampf AC-4**
(Angriffslauf - ein Befehl auf ein leeres Feld, bei dem unterwegs alles
angegriffen wird) und **bedienung AC-34** (ein rotes Zeichen am Ziel beim
Angriffsbefehl, ein weisses bei einem Befehl auf freies Gelaende). AC-34 ist
reine Oberflaeche und gibt ein gutes Bild; AC-4 braucht eine zweite Betriebsart
im Browser (Taste, dann Klick) - das erste Mal, dass ein Befehl nicht aus dem
Feld gelesen werden kann.

Offen daneben, in Runde 64 gesehen: **einheiten AC-29** (Fernkaempfer stehen
uebereinander, weil sie keinen Schussring haben).

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
