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

2026-11-07, nach Runde 59 (Schritt B3 fertig und committet).

## Wo ich stehe

- **Branch:** `strategie`. Nie auf `main` arbeiten, **nie pushen, nie deployen.**
- **Board:** 357 von 503 Kriterien fertig · 1 in Arbeit · 5 in QA · 4 geplant ·
  129 offen · 7 zurueckgestellt. 336 Tests ohne Browser, 133 im Browser.
- **Stufe A ist erreicht** (fahrplan AC-3 bis AC-7).
- **Stufe B:** Bauabfolge B1 bis B7 im [Fahrplan](fahrplan.md). **B1, B2 und B3
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

## Was als Naechstes kommt: Schritt B4

Die Einheiten der Feudalzeit, **einheiten AC-23 und AC-24**: Speerkaempfer
(35 N, 25 H, 22 s) und Plaenkler (25 N, 35 H, 22 s) aus der Kaserne,
Bogenschuetze (25 H, 45 G, 35 s) und Plaenkler aus der Schiessanlage, der
Spaeherreiter aus dem Stall (steht schon), und die **Miliz wird zum Soldaten**
(60 N, 20 G, 21 s). Werte in [vorlage-aoe2.md](vorlage-aoe2.md). Jede neue
Einheit braucht eine Figur in `public/figuren.js`, einen Platz auf der
Schautafel (`public/schautafel.js`) und muss sich von allen anderen auf einem
Drittel der Flaeche unterscheiden - **vorher und nachher messen** mit
`npm run tafel -- "t.unterschiede('figur')"`.

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
