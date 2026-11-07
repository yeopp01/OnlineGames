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

2026-11-07, nach Runde 61 (einheiten AC-24 fertig, **Schritt B4 ist ganz durch**).

## Wo ich stehe

- **Branch:** `strategie`. Nie auf `main` arbeiten, **nie pushen, nie deployen.**
- **Board:** 359 von 503 Kriterien fertig · 1 in Arbeit · 5 in QA · 4 geplant ·
  127 offen · 7 zurueckgestellt. 348 Tests ohne Browser, 138 im Browser.
- **Stufe A ist erreicht** (fahrplan AC-3 bis AC-7).
- **Stufe B:** Bauabfolge B1 bis B7 im [Fahrplan](fahrplan.md). **B1 bis B4
  sind fertig.** Der Arbeitsbaum ist sauber.

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

## Was als Naechstes kommt: Schritt B5, der Kampf

**kampf AC-1 bis AC-10, bedienung AC-34, einheiten AC-25.** Die Werte stehen
schon alle in `daten.js`: `angriff`, `nahruestung`, `fernruestung`,
`reichweite`, `klassen`, `bonus` je Einheit. Zu bauen sind der Auftrag
„angreifen", der Schlagtakt, der Schaden mit Bonus auf die Ruestungsklasse,
Pfeile als Flugbahn, das Sterben, und dass Fernkaempfer Abstand halten
(einheiten AC-25). **Vorher die Spec kampf.md lesen** - sie ist seit der
Spec-Runde zu Stufe B geschrieben.

Danach: **B5** Kampf (kampf AC-1 bis AC-10, bedienung AC-34, einheiten AC-25)
· **B6** Verbesserungen (bauen AC-25, AC-26, ki AC-9) · **B7** Gleichgewicht
messen (fahrplan AC-8 bis AC-10).

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
