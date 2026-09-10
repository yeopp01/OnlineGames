# ADR-0009: Die Oberflaeche wird in einem echten Browser geprueft

**Status:** teilweise abgeloest durch [ADR-0010](0010-playwright.md) — das
Werkzeug (`tests/browser.mjs`) ist Playwright gewichen. Dass die Oberflaeche im
Browser geprueft wird und jedes Spiel sein eigenes Stylesheet mitbringt, gilt
weiter.
**Datum:** 2026-09-06
**Ergaenzt:** [ADR-0004](0004-teststrategie.md) — dort steht, wie die
Serverseite geprueft wird. Fuer alles Sichtbare stand dort nichts.

## Frage

Das Managerspiel war ueber den Anfrageweg vollstaendig belegt: 137 Tests, jeder
Zug geprueft, alle Zahlen gemessen. Trotzdem war die Seite **unbenutzbar** —
sie liess sich nicht scrollen. Der erste Blick eines Menschen fand in zehn
Sekunden, was kein Test gefunden hatte.

Wie kommt so etwas kuenftig vor der Auslieferung heraus?

## Entscheidung

**Ein echter Browser gehoert in den Testlauf.** Chrome oder Edge laeuft ohne
Fenster, ferngesteuert ueber das DevTools-Protokoll; `tests/browser.mjs` ist
die Fernsteuerung, `tests/oberflaeche.test.mjs` prueft damit die
Bedienkriterien.

Keine neue Abhaengigkeit: `ws` liegt fuer den Spielserver ohnehin im Projekt,
und ein Browser ist auf jedem Rechner da, der diese Seiten anzeigen soll.
Kein Playwright, kein Selenium, kein Treiber-Download.

## Begruendung

Der Fehler war nicht subtil, aber unsichtbar fuer alles, was wir hatten:

```css
/* stil.css - fuer das Strategiespiel richtig */
#spiel { position: fixed; inset: 0; }
```

Das Managerspiel hatte seinen Spielbereich ebenfalls `#spiel` genannt und
`stil.css` mitgeladen. Ergebnis: ein fixierter Kasten in Fenstergroesse, der
nicht scrollt. Die Marktliste war 7.325 px hoch, der Body 80 px.

Drei Dinge daran sind lehrreich:

1. **Kein Servertest haette es gefunden.** Die API lieferte 370 Spieler,
   korrekt und schnell. Sichtbar war nichts davon.
2. **Nachdenken hat es auch nicht gefunden.** Zwei Anlaeufe gingen daneben —
   erst wurde am `overflow` von `body` geschraubt, dann an der Hoehe. Beides
   plausibel, beides falsch. Die Kaskade zweier Stylesheets im Kopf zu
   simulieren funktioniert nicht.
3. **Der Browser hat es in zwei Sekunden gesagt:** `body.scrollHeight` 80,
   `#inhalt` 7.325. Danach war die Ursache in einer Minute gefunden.

Der erste Lauf des neuen Tests fand gleich zwei weitere echte Fehler: die
Leertaste warf `e.target.matches is not a function`, wenn der Fokus nirgends
lag, und der Ticker schrieb nach einem Blattwechsel in ein Element, das es
nicht mehr gab.

## Folgen

- **`in qa` wird fuer Oberflaechenkriterien die Ausnahme statt die Regel.**
  Die zehn Kriterien in
  [specs/15-manager/bedienung.md](../../specs/15-manager/bedienung.md) stehen
  auf `fertig`, weil ein Browser sie belegt.
- **Der Testlauf dauert laenger.** Vorher acht Sekunden, jetzt rund fuenfzig.
  Der Browser startet einmal fuer alle Tests der Datei; das ist der Preis,
  und er ist billiger als eine ausgelieferte Seite, die nicht scrollt.
- **Ohne Browser wird uebersprungen, nicht rot.** Auf einem Rechner ohne
  Chrome und ohne Edge laeuft `npm run check` weiter durch. Die Belegpruefung
  merkt das nicht — wer die Kriterien wirklich pruefen will, braucht einen
  Browser. Das ist eine bewusste Luecke zugunsten der Bedienbarkeit.
- **Zwei Spiele, zwei Stylesheets.** `manager.html` laedt `stil.css` nicht
  mehr; die Manageroberflaeche bringt ihre Farben und Grundformen selbst mit.
  Geteilte Kaskade heisst geteilte Ueberraschungen, und die Namen `#spiel`
  und `.kopfzeile` waren schon kollidiert. Lieber ein paar Zeilen doppelt.
- **Fuer das Strategiespiel gilt dasselbe, sobald es dran ist.** Leinwand,
  Auswahlrahmen und Rechtsklick stehen weiterhin auf `in qa` — dort ist noch
  kein Browser gelaufen.
