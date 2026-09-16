---
name: strategie-weiterbauen
description: Eine Arbeitsrunde am Strategiespiel (Klon von Age of Empires II) - das naechste Kriterium aus dem Fahrplan nehmen, bauen, per Test belegen, im Browser nachweisen, pruefen, committen und aufschreiben, was gelernt wurde. Gedacht fuer /loop, also ohne Rueckfragen lauffaehig. Verwenden, wenn am Strategiespiel eigenstaendig weitergearbeitet werden soll.
---

# Eine Runde am Strategiespiel

Du arbeitest allein. Niemand schaut zu, niemand beantwortet Fragen während der
Runde. Deshalb gilt: **lieber ein kleines Kriterium sauber auf `fertig` als drei
halb.** Die Regeln aus `CLAUDE.md` gelten ohne Abstrich — vor allem, was
`fertig` heißt.

## 0. Orientieren (immer)

1. `git status` und `git branch --show-current`. Gearbeitet wird auf
   **`strategie`**. Ist der Baum nicht sauber, prüfe, ob das die Reste einer
   abgebrochenen Runde sind. Wenn ja: zu Ende bringen oder verwerfen, was
   nicht grün wird (`git stash`, mit Vermerk in den Erkenntnissen). Fremde
   Änderungen, die du nicht einordnen kannst, fasst du nicht an — Frage
   aufschreiben, Runde beenden.
2. Lies [`docs/strategie/erkenntnisse.md`](../../../docs/strategie/erkenntnisse.md):
   **Fragen an den Benutzer** und **Offene Fäden** ganz, von **Runden** die
   letzten fünf Zeilen.
3. Lies [`specs/10-strategie/fahrplan.md`](../../../specs/10-strategie/fahrplan.md)
   und bestimme die **aktuelle Stufe**: die erste mit einem Kriterium, das
   nicht `fertig` ist.
4. Zähle die Runden. Ist die neue Rundennummer durch fünf teilbar, oder wurde
   in der letzten Runde eine Stufe erreicht: **Rückschau** (Abschnitt 8) statt
   Bauen.

## 1. Arbeit wählen

In dieser Reihenfolge, das Erste, was zutrifft:

1. **`npm run check` ist rot** → das reparieren. Nichts anderes.
2. Ein Kriterium steht auf **`in-arbeit`** → weiterführen.
3. Ein Kriterium der aktuellen Stufe (oder eines, das sie voraussetzt) steht auf
   **`in-qa`** → fehlenden Beleg oder Nachweis liefern.
4. **Die Stufe hat noch keine Fach-Kriterien** → **Spec-Runde**: aus der
   [Vorlage](../../../docs/strategie/vorlage-aoe2.md) die Kriterien der Stufe in
   die Fach-Specs schreiben (Abschnitt 2). Nur Specs, kein Code.
5. Sonst das **nächste `offen`-Kriterium der aktuellen Stufe**, das nichts
   Ungebautes voraussetzt. Bei Wahl: das, welches am frühesten etwas im
   Browser Spielbares ergibt.

**Zuschnitt:** Eine Runde ist ein Kriterium, oder zwei bis drei, die nur
zusammen Sinn ergeben. Merkst du beim Bauen, dass es größer ist: Kriterium
teilen (neue Nummern), das erste Stück fertigmachen.

Setze die gewählten Kriterien auf `in-arbeit`.

## 2. Spec-Runde (wenn eine Stufe beginnt)

- Lies die Fach-Specs, die die Stufe betrifft, und die Vorlage.
- **Offene Kriterien**, die nicht mehr passen: neuer Text, **gleiche Nummer**.
- **Fertige Kriterien**, die nicht mehr gelten: **in der Spec-Runde nicht
  anfassen.** Sie bleiben `fertig`, bis ihr Nachfolger gebaut ist, und stehen
  im Fahrplan unter „Was Stufe X ablöst". Die Runde, die den Nachfolger baut,
  setzt sie auf `zurueckgestellt (abgelöst durch <kuerzel> AC-n)` und passt im
  selben Commit Test, Bild und Eintrag in `qa/ohne-bild.json` an. So ist jeder
  Zwischenstand prüfbar. (Runde 7.)
- **Zu jeder Stufe eine Bauabfolge** im Fahrplan: Schritte von einer bis drei
  Runden, jeder mit etwas im Browser Sichtbarem am Ende. Die Arbeitswahl
  (Abschnitt 1, Punkt 5) folgt dieser Abfolge.
- Neue Kriterien bekommen die nächste freie Nummer. Kurztitel höchstens fünf
  Wörter. Ein Kriterium ist **prüfbar**: eine Zahl, ein Verhalten, ein Bild.
- Zahlen aus der Vorlage übernehmen. Abweichen nur mit einem Satz Begründung
  im Kriterium.
- `npm run specs:board`, `npm run check`, Commit `Spec: Stufe X - …`.

## 3. Bauen

- **Der Server rechnet** (ADR-0001). Der Browser zeigt an und schickt Absichten.
- **Werte sind Daten.** Einheiten, Gebäude, Verbesserungen, Völker stehen in
  Tabellen unter `server/spiele/strategie/`, nicht als Verzweigungen in der
  Simulation. Ein `if (volk === 'franken')` ist ein Fehler.
- **Deterministisch.** Kein `Math.random()` in der Simulation; Zufall nur aus
  dem Startwert der Partie. Das ist die Voraussetzung für den Prüfstand.
- Deutsche Bezeichner, Umlaute umschrieben. Stil wie im umliegenden Code.
- Die Darstellung ist isometrisch und in Code gezeichnet. **Kein** Material aus
  dem Original, auch nicht vorübergehend. Kein „Age of Empires" in der
  Oberfläche.
- Nichts Strategiespezifisches in `raeume.js`, `schutz.js`, `index.js`
  (ADR-0006). Die Schnittstelle der Spiele liegt zwischen diesen und
  `server/spiele/<art>/`.
- Das Managerspiel ruht. Anfassen nur, wenn eine gemeinsame Stelle (Vorraum,
  Spielauswahl) es verlangt, und dann muss sein Browserlauf grün bleiben.
- **Werkzeug:** neue Dateien mit Write, Änderungen mit Edit. Keine langen
  Inhalte als Heredoc in der Shell, und nie zwei Heredocs in einem Aufruf —
  Anführungszeichen im Inhalt brechen das Kommando mittendrin ab (Runde 4).
- Ein Import darf nicht heißen wie ein Parameter der umgebenden Funktion
  (`starten(hafen, einstellungen)` hat einen Import `einstellungen`
  überdeckt, Runde 2) — der Fehler zeigt sich erst zur Laufzeit.

## 4. Belegen

- Testname `<kuerzel> AC-<n>: <was gilt>`.
- Regeln der Simulation direkt gegen die Rechenteile (`tests/regeln.test.mjs`
  oder eine neue `tests/strategie-*.test.mjs`); alles, was über das Netz geht,
  über WebSocket gegen den laufenden Server (ADR-0004).
- **Messbare Stellvertreter für Aussehen oder Zeit** (Bildpunkte, Überdeckung,
  Taktzahl): Die Schwelle kommt aus der Eigenschaft, die das Kriterium
  verlangt, nicht aus dem ersten Messwert. Scheitert der Test, zuerst fragen:
  Ist das Produkt falsch oder meine Annahme darüber, wie es sich zeigt? Die
  Antwort steht als Kommentar am Test. Echte Uhren in Tests nur, wenn die Zeit
  selbst geprüft wird; sonst `t.mock.timers` (Runden 8 und 9: dreimal war die
  Annahme falsch, nie das Produkt).
- **Nie** einen Test überspringen, eine Schwelle senken oder eine Zusicherung
  lockern, um grün zu werden. Ist eine Schwelle wirklich falsch, ändere das
  Kriterium in der Spec, mit Begründung im Commit und einer Zeile in den
  Erkenntnissen.

## 5. Nachweisen und selbst hinsehen

- Hat das Kriterium einen Bildschirm: Browsertest unter `e2e/tests/` mit
  `nachweis()` ([`qa/README.md`](../../../qa/README.md)). Das Spielbild bekommt
  eigene Dateien (`strategie-*.spec.mjs`). Braucht der Test einen Zustand, der
  im Spiel Minuten dauert, dafür einen **Prüfgriff** in `e2e/server.mjs`, nie
  eine Abkürzung im Produktcode.
- **Was die Bildunterschrift behauptet, sichert der Test vor `nachweis()`
  mit `toBeInViewport()`** — die Meldung, der Knopf, das Feld. Ein Screenshot
  zeigt nur den sichtbaren Ausschnitt; was darunter liegt, ist für das Bild
  nicht da. (Runde 2: die Absage stand unter dem Rand.) Wo nötig, ein höheres
  Fenster für diesen einen Test.
- **Sieh dir jedes neue Bild mit dem Read-Werkzeug an.** Frage: Zeigt es, was
  die Bildunterschrift behauptet — für jemanden, der das Spiel nicht kennt? Ist
  die Einheit erkennbar, der Text lesbar, nichts abgeschnitten, nichts
  überdeckt? Wenn nicht: verbessern, nicht einchecken. Auf der Leinwand hilft
  kein `toBeInViewport` — dort ist das Ansehen die einzige Prüfung. (Runde 4:
  der Ladungspunkt lag unter dem Auswahlring.)
- **Beim Zeichnen zuerst ansehen, dann testen:** `npm run sicht --
  schautafel.html` (Seite ohne führenden Schrägstrich) schreibt ein Wegwerfbild
  in den Temp-Ordner und nennt den Pfad. Erst wenn es gut aussieht, kommt der
  Browsertest mit `nachweis()`.
- **Spielgröße ansehen, nicht nur herangezoomt.** Jede Figur und jedes Gebäude
  wird auch bei Zoom 1 beurteilt — dort spielt man. Die Schautafel zeigt
  beides nebeneinander.
- **Eine geänderte Seite heißt: alle Bilder dieser Seite neu.** Der gewöhnliche
  Lauf schreibt nur fehlende Bilder, alte zeigen dann den alten Stand.

  | Geändert                               | Neu erzeugen                                             |
  | -------------------------------------- | -------------------------------------------------------- |
  | `public/index.html`, `app.js`, `stil.css` | `npm run qa:nachweis -- vorraum spielauswahl strategie` |
  | `public/ansicht.js`                    | `npm run qa:nachweis -- strategie`                       |
  | `public/manager.*`                     | `npm run qa:nachweis -- manager`                         |
- Kein Bildschirm: Eintrag in `qa/ohne-bild.json`, der sagt, **was** das
  Kriterium ist und **warum** ein Bild es nicht zeigen kann.

## 6. Prüfen und festhalten

1. Status auf `fertig`, `npm run specs:board`.
2. Oberfläche angefasst → `npm run check:alles`, sonst `npm run check`.
3. Regeln oder Werte geändert und der Prüfstand existiert (fahrplan AC-4) →
   `npm run pruefstand:strategie`, Zahlen unter **Messwerte**.
4. Rot → beheben. Geht es nach ernsthaftem Versuch nicht: Kriterium zurück auf
   `in-arbeit` oder `in-qa`, die Ursache als offenen Faden aufschreiben,
   **nicht** committen, was rot ist.
5. Grün → eine Zeile unter **Runden** in den Erkenntnissen, offene Fäden
   aktualisieren (erledigte streichen). Dann **ein Commit** auf `strategie`,
   deutscher Text, Betreff sagt, was jetzt geht. **Kein Push, kein Deploy.**
6. Ist mit dem Commit eine Stufe erreicht: Zeile „Stand" in `CLAUDE.md`
   nachziehen.
7. **Zwischenstand in der Abschlussnachricht:** Der Benutzer will den
   Fortschritt sehen, nicht nur lesen. Nenne am Ende jeder Runde zwei bis drei
   Bilder dieser Runde als Markdown-Link auf die Datei unter
   `qa/bildnachweise/…` — das aussagekräftigste zuerst, je mit einem halben
   Satz, was darauf zu sehen ist. Hatte die Runde keinen Bildschirm (Rechenteil,
   Rückschau), das aktuellste Bild des Spielbilds.

## 7. Wann du anhältst

Schreibe die Frage unter **Fragen an den Benutzer** und arbeite an etwas
anderem weiter — oder beende die Runde, wenn nichts anderes geht:

- Etwas würde eine Zeile aus „Wird nicht gebaut" (ADR-0012) hereinholen, ein
  entschiedenes ADR aufrollen oder die Regel „Eröffnen verlangt ein Konto,
  Mitspielen nicht" berühren.
- Name des Spiels, Sonderregeln, Auswahl der Völker nach Beginn von Stufe E.
- Push, Deploy, Zugang zum VPS, Löschen von Daten außerhalb des Repositorys.
- Neue Abhängigkeit in `package.json` (außer für Tests). Begründen, fragen.
- Dreimal hintereinander am selben Fehler gescheitert.

## 8. Rückschau (jede fünfte Runde, und am Ende jeder Stufe)

Nicht bauen. Stattdessen:

1. Lies alle Runden seit der letzten Rückschau. Was hat wiederholt Zeit
   gekostet? Welche Fehler kamen zweimal?
2. Leite **höchstens drei** Verbesserungen ab und setze sie um: eine Hilfe für
   Tests, ein Prüfgriff, eine Regel in dieser Anweisung, ein Satz in `CLAUDE.md`.
   Diese Anweisung darfst du ändern; die Regeln unter „Wann du anhältst" und
   die Bedeutung von `fertig` nicht.
3. **Am Ende einer Stufe zusätzlich:** Starte eine Partie im Browser, mache ein
   Bild vom Spielbild nach einigen Minuten und sieh es an. Vergleiche ehrlich
   mit dem, was ein Spieler von AoE II erwartet: Was sind die **drei größten
   Lücken** in Lesbarkeit und Aussehen? Lege sie als `offen`-Kriterien in
   `bedienung.md` an.
4. Miss, was sich messen lässt (Tests, Laufzeit des Browserlaufs, Takt), und
   trage es unter **Messwerte** ein. **Vorher prüfen, ob die Maschine ruhig
   ist** — hier laufen oft Tests anderer Projekte mit:
   `Get-Process node, chrome | Group-Object ProcessName` in PowerShell. Sind
   fremde `vitest`-/`playwright`-Prozesse da, die Zeit nicht eintragen oder als
   „nicht vergleichbar" kennzeichnen (Runde 3: 52 s wurden 2,2 min).
5. Eintrag unter **Rückschauen**, Commit `Rueckschau nach Runde n`.
