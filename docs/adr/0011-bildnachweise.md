# ADR-0011: Bildnachweise gehoeren an das Abnahmekriterium

**Status:** entschieden
**Datum:** 2026-09-10
**Vorbild:** ADR-0012 in Conjola, angepasst an dieses Projekt.

## Frage

Das Board sagt, welche Kriterien `fertig` sind, und `check-belege` sagt, dass
ein Test sie nennt. Beides beantwortet nicht, **wie es aussieht** — und beides
ist eine Textdatei, in der man sich nicht umsehen kann.

Gebraucht wird eine Uebersicht: welche Specs gibt es, welche Kriterien, was
davon ist umgesetzt — und fuer alles mit Bildschirm ein Bild neben dem Satz
aus der Spec.

## Entscheidung

### 1. Der Bezug ist Spec und Abnahmekriterium

`nachweis()` aus [`scripts/qa-nachweis.mjs`](../../scripts/qa-nachweis.mjs)
legt im Playwright-Test ein Bild und daneben eine Bezugsdatei ab:

```
qa/bildnachweise/15-manager/karriere/AC-01--die-vereinswahl-zeigt-alle-achtzehn-vereine.png
qa/bildnachweise/15-manager/karriere/AC-01--die-vereinswahl-zeigt-alle-achtzehn-vereine.json
```

Die Bezugsdatei traegt Spec, Kriterium, Bildunterschrift und die Herkunft:
Testdatei und Titelpfad. Nennt die Spec das Kriterium nicht, scheitert schon
der Test.

**Bilder werden eingecheckt, der Bericht nicht.** Im Pull Request ist eine
Aenderung an der Oberflaeche dann als Bild zu sehen; der Bericht
`qa/report/index.html` entsteht bei jedem `npm run qa:report` neu.

### 2. Drei Zustaende je Kriterium

| Zustand              | Bedeutung |
| -------------------- | --------- |
| **mit Bild**         | mindestens ein Bildnachweis |
| **kein Bild noetig** | steht mit Begruendung in [`qa/ohne-bild.json`](../../qa/ohne-bild.json) |
| **ohne Nachweis**    | weder noch — sichtbar im Bericht |

Eine Rechenregel, eine Grenze auf dem Server, ein Protokoll haben kein
Aussehen. Sie stehen mit Begruendung in der Ausnahmeliste. Schweigen ist keine
Antwort.

### 3. `fertig` heisst: Test **und** Nachweis

Hier weicht das Projekt von Conjola ab, und zwar nach oben. Die bestehende
Regel bleibt — ein Test, dessen **Name** das Kriterium mit Kuerzel und Nummer
nennt. Dazu kommt Bild oder Begruendung:

```
fertig  =  Testname nennt "<kuerzel> AC-<n>"
        und (Bildnachweis oder Eintrag in qa/ohne-bild.json)
```

Der Test sagt, dass es gilt. Das Bild zeigt, wie es aussieht — oder die
Begruendung sagt, warum es kein Aussehen hat. Gebaut, aber nicht so belegt,
heisst `in-qa`.

Gezaehlt werden dabei nur noch **Testnamen**, nicht mehr jede Stelle im
Quelltext. Ein Kommentar, der ein Kriterium erwaehnt, belegte vorher mit.

### 4. Was bricht - und was nicht

`npm run check` bricht bei einer falschen **Zuordnung**:

- Bild ohne Bezugsdatei oder Bezugsdatei ohne Bild,
- Bezug auf eine Spec oder ein Kriterium, das es nicht gibt,
- ein Nachweis, dessen Testdatei, Testname oder Bildunterschrift nicht mehr
  im Test steht — er hat keinen Erzeuger mehr und zeigt womoeglich eine
  Oberflaeche, die es nicht mehr gibt,
- ein doppelter, verwaister oder unbegruendeter Eintrag in der Ausnahmeliste,
- `fertig` ohne Nachweis, und ein Bild an einem Kriterium, das `offen`,
  `geplant` oder `zurueckgestellt` ist.

Ein Kriterium **ohne Nachweis** bricht nichts, solange es nicht `fertig` ist —
es steht im Bericht. `npm run qa:report -- --streng` macht es zum Fehlschlag.

### 5. Ein Bild entsteht, wenn es fehlt

Nicht bei jedem Lauf. Sonst entstuende bei jedem Lauf ein Bilddiff, der aus
nichts besteht als einer anderen Millisekundenzahl in der Kopfzeile.
Ausdruecklich alle neu: `npm run qa:nachweis`.

### 6. Die Specs folgen demselben Format

- Status mit Bindestrich: `offen` · `geplant` · `in-arbeit` · `in-qa` ·
  `fertig` · `zurueckgestellt` (Letzteres mit Grund in Klammern).
- **Kurztitel hoechstens fuenf Woerter und 44 Zeichen** — er ist die Zeile im
  Board und im Bericht. 80 Titel waren laenger und wurden gekuerzt.
- Eine Nummer steht in einer Spec genau einmal.

Alle Bezeichner deutsch (`nachweis()`, `qa/bildnachweise/`,
`qa/ohne-bild.json`, `begruendung`), weil das Projekt es so haelt.

## Nicht uebernommen

| Aus Conjola | Warum hier nicht |
| --- | --- |
| Waechter fuer zitierte Zustaende in Begruendungen | Bei rund hundert Eintraegen findet man den ueberholten Satz noch beim Lesen des Berichts. Der Grund, ihn in Conjola zu bauen, waren 235. |
| Waechter fuer tote Verweise, Leerlauf, Skip-Bericht | `forbidOnly` und `retries: 0` im Browserlauf decken das Wesentliche. Der Rest lohnt sich ab einer Groesse, die das Projekt nicht hat. |
| Erzeugte Stand-Tabellen in den Bereichs-READMEs | Die Uebersicht ist der Bericht. Zwei erzeugte Uebersichten waeren eine zu viel. |

## Folgen

- Der Vorraum war damit zum ersten Mal in einem Browser: Anmeldung,
  Registrierung, Eroeffnen, Beitreten, Code, Spielerliste, Absagen. Das
  **Spielbild** des Strategiespiels nicht — die Leinwand steht weiter auf
  `in-qa` (specs/10-strategie/bedienung.md).
- Binaerzuwachs im Repository, begrenzt durch die Bindung an Kriterien: ein
  Bild je Zusage, nicht je Lauf.
- Wird ein Test umbenannt, meldet die Herkunftspruefung den Nachweis als
  verwaist. `npm run qa:nachweis -- <datei>` fuehrt ihn nach; ist die
  Oberflaeche weg, gehen Bild und Bezugsdatei mit.

## Verworfene Alternativen

| Alternative | Warum verworfen |
| --- | --- |
| Screenshots als Anhang eines Testberichts | Verfallen, sind keinem Kriterium zugeordnet, kein Diff im Pull Request |
| Jedes Kriterium braucht ein Bild | Erzwingt nichtssagende Bilder fuer Zusagen ohne Bildschirm — gemacht, um gruen zu werden |
| Bild statt Testname als Beleg fuer `fertig` | Ein Bild beweist nicht, dass es gilt, nur wie es an einem Tag aussah |
| Bericht einchecken | Sofort veraltet, und der Diff bestuende aus Markup |
