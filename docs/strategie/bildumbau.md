# Bildumbau — Stand

Der Arbeitsstand zum Umbau auf gerenderte Bilder
([ADR-0014](../adr/0014-gerenderte-bilder.md), Schritte R1 bis R6 im
[Fahrplan](../../specs/10-strategie/fahrplan.md)).

**Warum eine eigene Datei:** der Umbau läuft auf dem Zweig
`strategie-bildumbau` in einem eigenen Arbeitsverzeichnis
(`../OnlineGames-bildumbau`), **neben** der Schleife auf `strategie`. Stünden
diese Notizen im Steuerstand und in den Erkenntnissen, stieße jede
Zusammenführung an denselben Zeilen an. Wer den Zweig einbindet, überträgt
die Zeilen unter „Für die Erkenntnisse" dorthin und erzeugt das Board neu
(`npm run specs:board`).

## Wo es steht

- **R0 (2026-11-09):** ADR-0014 geschrieben, darstellung AC-17 bis AC-24
  angelegt, Bauabfolge R1 bis R6 im Fahrplan vor Stufe E. Der Benutzer hat
  zugestimmt: „Blender installieren und mit dem Plan starten."
- **Blender 5.2.3** liegt unter
  `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` (per winget,
  nicht im PATH).
- **Als Nächstes R1, die Probe** (darstellung AC-17): Dorfbewohner, Haus,
  Laubbaum. **Nach R1 anhalten** — der Benutzer entscheidet am Bild, ob R2
  beginnt.

## Festlegungen der Kette

- Kamera orthografisch, 45° gedreht, 30° über dem Boden: ein Feld wird zur
  Raute 2 : 1 wie im Spielbild (`HALB_B = 22`, `HALB_H = 11` bei Zoom 1; die
  Partie beginnt bei Zoom 1,5).
- Eine Sonne von links oben, wie die gezeichneten Stücke sie behaupten.
- Spielerfarbe als zweites Bild (Maske), eingefärbt im Browser.
- Getauscht wird hinter `figurBildZeichnen` (`public/figuren.js`),
  `gebaeudeBildZeichnen` (`public/gebaeude.js`) und `dingBildZeichnen`
  (`public/gelaende.js`).

## Für die Erkenntnisse (beim Einbinden übertragen)

- **Spec-Runde Bildumbau, ADR-0014** (2026-11-09, Wunsch des Benutzers: „viel
  detaillierter, bildlicher … nicht so kindlich gemalt" — zum dritten Mal
  nach Runde 26 und 35). **Erkenntnis:** zweimal im selben Verfahren
  nachzubessern hat die Beanstandung nicht beendet — beim dritten Mal ist die
  Frage das Verfahren, nicht die Sorgfalt. Befund am Bild: zwei
  Blickrichtungen (gespiegelt), Laufen als verschobene Vielecke, kein
  Material, Spielerfarbe als ganze Fläche. Die Gebäude sind am weitesten.
  **Nicht belegt:** ob die Kette Figuren hergibt, die überzeugen.
- **Zwei Sitzungen in einem Arbeitsbaum** (2026-11-09): während der
  Spec-Runde arbeitete die Schleife an spielziel AC-23 im selben Verzeichnis.
  Bemerkt erst an `git status`. Seitdem: Arbeit neben der Schleife bekommt
  ein eigenes Arbeitsverzeichnis (`git worktree add`), bevor die erste Datei
  geändert wird.
