# ADR-0010: Playwright statt eigener Fernsteuerung

**Status:** entschieden
**Datum:** 2026-09-10
**Loest ab:** den Werkzeugteil von [ADR-0009](0009-oberflaeche-im-browser.md).
Dass die Oberflaeche im Browser geprueft wird und jedes Spiel sein eigenes
Stylesheet mitbringt, gilt weiter.

## Frage

ADR-0009 hat einen Browser in den Testlauf geholt — ueber eine selbst
geschriebene Fernsteuerung, die Chrome per DevTools-Protokoll anspricht
(`tests/browser.mjs`). Das hat den Scroll-Fehler gefunden und zwei weitere.
Traegt das auch fuer die Bildnachweise aus
[ADR-0011](0011-bildnachweise.md), und fuer dreissig Tests statt zehn?

## Entscheidung

**Playwright** (`@playwright/test`, Version exakt gepinnt). Die Tests liegen
unter `e2e/tests/*.spec.mjs`, in JavaScript wie der Rest des Projekts.

```bash
npm run e2e:browser     # einmal: Chromium holen (liegt meist schon im Cache)
npm run test:e2e        # nur der Browser
npm run check:alles     # Browser, danach alles aus npm run check
```

Der Browserlauf gehoert **nicht** in die CI. `npm run check` kommt ohne
Browser aus; die Bilder, die der Browserlauf schreibt, liegen eingecheckt und
werden dort ohne Browser geprueft.

## Begruendung

Die eigene Fernsteuerung hatte eine Schwaeche, die mit jedem Test waechst:
sie wartete **nach der Uhr**. `klicken()` hiess „klicken, dann 350 ms
schlafen", `laden()` fragte `readyState` im Takt ab. Das hielt bei zehn Tests;
bei dreissig wird ein Test rot, weil ein Rechner gerade langsamer ist, und ein
Test, der ohne Codeaenderung mal gruen und mal rot ist, ist schlimmer als
keiner. 36 Sekunden des Laufs waren Schlafzeit.

Playwright wartet **auf Zustaende**: `expect(locator).toHaveText(...)` fragt
so lange nach, bis es stimmt oder die Frist ablaeuft. Dazu kommen, was eine
eigene Fernsteuerung nie bekommen haette — Spuren bei Fehlschlag, Klicks, die
vorher pruefen, ob das Element ueberhaupt klickbar ist, und das Scrollen mit
dem Rad statt `scrollTo()`.

Der Preis ist gering: eine Entwicklungsabhaengigkeit, und der Browser liegt
auf diesem Rechner schon im gemeinsamen Cache von Playwright, weil ein anderes
Projekt dieselbe Version benutzt. Kein Download.

## Was von Conjola uebernommen ist - und was nicht

| Uebernommen | Nicht uebernommen, und warum |
| --- | --- |
| `forbidOnly: true`, `retries: 0` | TypeScript fuer die Tests — das Projekt hat keines |
| Bilder nur ueber `nachweis()`, `screenshot: 'off'` | eigenes Paket `e2e/` mit Arbeitsbereich — ein Ordner reicht |
| Spur nur bei Fehlschlag | kein `webServer` — dort laufen Datenbank, Keycloak und Oberflaeche in Docker. Hier gibt es genau einen `starten()`-Aufruf, und `e2e/server.mjs` nimmt denselben wie die Tests unter `tests/` |
| E2E nur oertlich | vier Worker mit eigenem Mandanten je Worker — jede Karriere ist ohnehin eine eigene |

## Folgen

- `tests/browser.mjs` und `tests/oberflaeche.test.mjs` sind weg; ihre Faelle
  stehen als Playwright-Tests unter `e2e/tests/`.
- Der Browserlauf legt ein Konto im Arbeitsspeicher an und meldet sich damit
  **einmal** an. Der Server laesst fuenf Anmeldungen je Stunde zu
  (konten AC-11); wer weitere Tests mit Anmeldung schreibt, haengt sie an den
  bestehenden Ablauf in `e2e/tests/vorraum.spec.mjs`, statt neu anzumelden.
- Jede Seite sammelt ihre eigenen Fehler (`e2e/helpers/seite.mjs`). Ein Test
  ist nicht gruen, waehrend in der Seite Ausnahmen fliegen.
- Wer ohne Browser arbeitet, merkt davon nichts, solange er die Oberflaeche
  nicht anfasst. Wer sie anfasst, faehrt `npm run check:alles`.
