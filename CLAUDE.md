# OnlineGames

Spiele für mehrere über einen Raumcode. Erstes Spiel: ein bewusst klein
geschnittenes Echtzeit-Strategiespiel im Geist von Age of Empires.

Schwesterprojekt von [LocalGames](../LocalGames/) — dort liegen die Partien im
Gerät und verlassen es nicht. Hier gibt es einen Server, weil ein gemeinsames
Spiel ohne ihn nicht geht. Anderes Versprechen, deshalb anderes Projekt.

## Sprache

**Alles auf Deutsch** — Bezeichner im Code, Kommentare, Specs, Commit-Texte,
Testnamen. `einheit`, `vorrat`, `wegZurBasis`, nicht `unit`, `resource`,
`pathToBase`. In `.md`-Dateien sind Umlaute erwünscht, in Quelltext und
Testnamen werden sie umschrieben (`Raeume`, `zurueck`), damit nichts an
Kodierungen hängt.

## Arbeitsweise

```bash
npm run check        # Board aktuell? Belege vollständig? Report? Tests grün?
npm start            # http://localhost:4180/
npm run dev          # dasselbe mit --watch
```

**`npm run check` muss vor jedem Abschluss grün sein.** Er prüft vier Dinge:

1. `specs/BOARD.md` und die Stand-Zeilen passen zu den Specs
2. jedes Kriterium auf `fertig` wird von einem Test genannt
3. `qa/report/index.html` ist neu erzeugt
4. alle Tests laufen

### Die wichtigste Regel

**`fertig` heißt: gebaut _und_ von einem Test belegt, dessen Name das
Kriterium mit Kürzel und Nummer nennt** — etwa `raeume AC-7: nur der Gastgeber
startet`. Das erzwingt `scripts/check-belege.mjs`.

Gebaut, aber unbelegt, ist `in qa`. Diese Unterscheidung nicht aufweichen: sie
ist der einzige Grund, warum die Zahlen im Board etwas wert sind.

### Beim Bauen einer neuen Funktion

1. Kriterium in der passenden Spec unter `specs/` anlegen oder finden
2. bauen
3. Test schreiben, dessen Name `<kuerzel> AC-<n>` enthält
4. Status auf `fertig` setzen, `npm run specs:board`, `npm run check`

Neue Kriterien bekommen die nächste freie Nummer. **Nummern werden nie neu
vergeben und nie umsortiert** — sie sind die Identität, die Reihenfolge in der
Datei ist es nicht.

## Aufbau

```
server/  karte.js    Kartenerzeugung, wiederholbar über einen Startwert
         wege.js     A* auf dem Raster, acht Richtungen
         welt.js     die Simulation: Einheiten, Aufträge, Vorräte
         raeume.js   Räume, Beitritt, Rückkehr nach Abbruch
         schutz.js   Grenzen je Adresse und je Server (tropfende Eimer)
         index.js    HTTP für die Dateien, WebSocket für das Spiel
public/  app.js      Verbindung, Vorraum, Warteraum
         ansicht.js  zeichnet die Welt, nimmt Maus und Tastatur
specs/   was das Produkt ist, mit Abnahmekriterien
docs/adr/ warum es so gebaut ist
scripts/ specs-lesen.mjs ist die eine Quelle; Board, Belege und Report hängen daran
tests/   netz + schutz: über den echten Anfrageweg · regeln: reine Rechenteile
```

## Entschieden (nicht neu aufrollen)

| | |
| --- | --- |
| [ADR-0001](docs/adr/0001-server-rechnet.md) | **Der Server rechnet**, der Browser malt. Kein Lockstep — damit kein Abgleichproblem, kein Schummeln, Rückkehr nach Absturz geschenkt. |
| [ADR-0002](docs/adr/0002-raumcode.md) | **Sechsstelliger Raumcode**, angezeigt als `KRN-4TZ`. 481.890.304 Möglichkeiten. |
| [ADR-0003](docs/adr/0003-anmeldung.md) | **Better Auth** im Spielserver mit `node:sqlite`, dafür Node 24. Kein Keycloak, kein zweiter Dienst. Registrieren **nur mit Einladungscode**. |
| [ADR-0004](docs/adr/0004-teststrategie.md) | Pflichttests laufen **über WebSocket gegen den laufenden Server**, nicht gegen die Klassen. Reine Rechenteile dürfen direkt geprüft werden. |
| [ADR-0005](docs/adr/0005-grenzen-statt-vertrauen.md) | **Grenzen greifen vor der Anmeldung.** Ein Angreifer will kein Konto — er kostet trotzdem. |

**Eröffnen verlangt ein Konto, Mitspielen nicht.** Wer eine Partie eröffnet,
belegt Rechenzeit — dort leistet ein Konto etwas. Wer mitspielt, tippt Code
und Namen. Diese Regel ist der Kern des Projekts, sie wird nicht verwässert.

Und die Tabelle in [`specs/10-strategie/spielziel.md`](specs/10-strategie/spielziel.md)
unter „Was es ausdrücklich **nicht** wird" ist die wichtigste im Projekt: jede
Zeile rechts ist eine Woche, die wir nicht ausgeben. Vor jedem Vorschlag, der
Umfang hinzufügt, dort nachsehen.

## Stand

40 von 160 Kriterien fertig, 31 Tests grün. Gebaut ist der Unterbau: Räume,
Übertragung, Karte, Wegfindung, Sammeln, Rückkehr nach Abbruch, Schutzschicht.

**Nie in einem echten Browser geprüft.** Server, Simulation und Protokoll sind
über echte Verbindungen belegt; die Leinwand-Darstellung, der Auswahlrahmen
und der Rechtsklick sind geschrieben, aber nie laufend gesehen. Deshalb stehen
die Bedienkriterien auf `in qa`, nicht auf `fertig`.

### Offen, in dieser Reihenfolge

1. **Einmal im Browser ansehen** — zwei Fenster, eröffnen, beitreten, spielen.
   Der billigste Erkenntnisgewinn, der noch aussteht.
2. **[Bauen](specs/10-strategie/bauen.md)** — ohne etwas zu bauen gibt es keine
   Entscheidung, und ohne Entscheidung kein Spiel.
3. **[Kampf](specs/10-strategie/kampf.md)** und das Ende der Partie
   ([Spielziel](specs/10-strategie/spielziel.md)).
4. **Anmeldung** — braucht vorher `fnm` und Node 24 auf dem Rechner. Bis
   dahin steht `.node-version` bewusst auf `20.19.5`, weil das der Wahrheit
   entspricht.

Der ehrlichste nächste Schritt ist aber keiner am Rechner: einmal zu fünft
spielen und sehen, ob die Grundschleife trägt.

## Ton

Der Benutzer schätzt begründete Empfehlungen statt Auswahllisten, und
Widerspruch, wo er berechtigt ist. Zahlen belegen statt behaupten — messen,
dann sagen. Wenn etwas nicht geprüft ist, wird das ausdrücklich gesagt.
