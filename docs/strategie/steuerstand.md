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

2026-11-06, waehrend Runde 57 (noch nicht committet).

## Wo ich stehe

- **Branch:** `strategie`. Nie auf `main` arbeiten, **nie pushen, nie deployen.**
- **Board:** 354 von 503 Kriterien fertig (vor dem Commit von Runde 57).
- **Stufe A ist erreicht** (fahrplan AC-3 bis AC-7). Die Dunkle Zeit ist am
  Stueck im Browser spielbar.
- **Stufe B (Feudalzeit) ist spezifiziert**, Bauabfolge B1 bis B7 steht im
  [Fahrplan](fahrplan.md).
- **B1 ist gebaut** (verdeckte Einheiten als Umriss, sichtbare Arbeit, Arbeiter
  je Rohstoff) — siehe „Offener Rest von Runde 57".

## Offener Rest von Runde 57

Im Arbeitsbaum liegt uncommittet:

- `bedienung AC-32` (Arbeiter je Rohstoff in der Leiste) — gebaut, Test
  `tests/strategie-untaetig.test.mjs` („bedienung AC-32: die Welt zaehlt je
  Rohstoff, wer daran arbeitet") und Browsertest in
  `e2e/tests/strategie-arbeit.spec.mjs`, Bildnachweis liegt als neue Datei
  unter `qa/bildnachweise/10-strategie/bedienung/AC-32--…png` (noch nicht
  eingecheckt).
- `welt.js`: `arbeiterVon(spielerId)`, im Zustand je Spieler `a: [holz,
  nahrung, gold, stein]`.
- `public/ansicht.js`: `this.arbeiter`, Anzeige mit `data-arbeiter="<rohstoff>"`
  und Klasse `keiner` bei null.
- **Noch zu tun vor dem Commit:** `npm run check` gruen lesen, Notiz zu Runde
  57 in [erkenntnisse.md](erkenntnisse.md), Stand in `CLAUDE.md` aktualisieren,
  dann committen (Betreff etwa „Arbeiter je Rohstoff in der Leiste: Schritt B1
  fertig").

## Was als Naechstes kommt: Schritt B2, der Zeitalterwechsel

Drei Kriterien, alle noch `offen`:

- **bauen AC-23 — Aufstieg in die Feudalzeit.** Das Dorfzentrum bietet den
  Aufstieg an: **500 Nahrung, 130 Sekunden.** Voraussetzung: **zwei fertige
  Gebaeude der Dunklen Zeit ausser Haeusern.** Waehrend der Aufstieg laeuft,
  bildet das Dorfzentrum nichts anderes aus; ein Abbruch erstattet die Nahrung.
- **bedienung AC-33 — Zeitalter steht im Bild.** Oben steht das Zeitalter;
  waehrend des Aufstiegs zeigt das Dorfzentrum den Fortschritt, der Wechsel
  wird einmal im Bild gemeldet.
- **spielziel AC-1 — Zeitalter gliedern die Partie.** Dunkle, Feudal-, Ritter-
  und Imperialzeit; jeder Aufstieg kostet und dauert und oeffnet Neues. Fuer
  B2 reicht der Weg Dunkel → Feudal, die Namen der spaeteren Zeitalter gehoeren
  als Daten dazu.

Danach: **B3** die drei Gebaeude der Feudalzeit (bauen AC-24, darstellung
AC-14 erweitert) · **B4** die neuen Einheiten (einheiten AC-23, AC-24) ·
**B5** Kampf (kampf AC-1 bis AC-10, bedienung AC-34, einheiten AC-25) ·
**B6** Verbesserungen (bauen AC-25, AC-26, ki AC-9) · **B7** Gleichgewicht
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
