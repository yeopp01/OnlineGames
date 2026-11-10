# ADR-0016: Gerenderte Bilder aus eigenen Modellen statt gezeichnetem Code

**Status:** entschieden; gebaut wird in Schritten, der erste ist eine Probe
**Datum:** 2026-11-09
**Löst ab:** in [ADR-0012](0012-aoe2-als-vorlage.md), Punkt 4, den zweiten
Absatz („Die Darstellung ist isometrisch und in Code gezeichnet … Gezeichnete
Sprites in der Qualität des Originals sind nicht das Ziel"). Der erste Absatz
— eigenes Aussehen, eigener Name, kein Material aus dem Original — gilt
unverändert.

## Frage

Der Benutzer hat das Aussehen dreimal beanstandet, jedes Mal in dieselbe
Richtung:

- Runde 26: „je gezeichneter es wirkt, umso besser" → darstellung AC-12.
- Runde 35: „noch sehr cartoonmäßig, das muss noch bissl realistischer
  werden" → darstellung AC-13, AC-14.
- 2026-11-09: „viel detaillierter, bildlicher … und nicht so kindlich gemalt".

Zweimal wurde im selben Verfahren nachgebessert: Vielecke und Verläufe auf der
Leinwand, von Hand in JavaScript gesetzt (`public/figuren.js`,
`public/gebaeude.js`, `public/gelaende.js`, zusammen rund 3.600 Zeilen). Was
dieses Verfahren nicht hergibt, zeigt das Bild von heute:

- **Figuren sind Papierpuppen.** Jede steht frontal. Es gibt zwei
  Blickrichtungen, die zweite ist die gespiegelte erste. Laufen heißt, dass
  sich zwei Vielecke verschieben.
- **Es gibt kein Material.** Jede Fläche ist ein glatter Verlauf — kein Stoff,
  kein Holz, kein Stein. Das ist der Grund für „kindlich", nicht die Farbwahl.
- **Licht und Schatten sind behauptet.** Jede Zeichnung setzt ihr eigenes
  Licht von links oben; ein Schatten ist eine Ellipse.
- **Jedes neue Stück kostet gleich viel.** Stufe E verlangt Gebäudesätze je
  Volk. In gezeichnetem Code wäre das fünfmal `gebaeude.js`.

Mehr Sorgfalt im selben Verfahren ändert daran nichts. Die Frage ist das
Verfahren.

## Entscheidung

**1. Bilder werden gerendert, nicht gezeichnet.** Einheiten, Gebäude, Vorräte
und Bäume entstehen als **3D-Modelle** und werden **vor** dem Spiel zu
Bildtafeln gerendert. Der Browser kopiert Bilder. So ist auch die Vorlage
entstanden; das Verfahren ist frei, nur ihr Material nicht.

**2. Die Modelle sind eigenes Material und entstehen aus Skripten.** Ein
Modell ist eine Python-Datei für Blender unter `grafik/`, kein von Hand
gespeicherter Stand. Wer das Repository hat und Blender, erzeugt jedes Bild
neu (`npm run bilder`). Das hält darstellung AC-11 prüfbar: zu jeder
Rastergrafik unter `public/` gibt es ein Skript, das sie erzeugt.

**3. Fremdes nur gemeinfrei, und aufgeschrieben.** Oberflächen (Holz, Stein,
Stoff), ein Grundkörper oder Bewegungsdaten für Menschen dürfen aus Quellen
unter **CC0** kommen. Jede steht mit Herkunft und Lizenz in
`grafik/QUELLEN.md`. Nichts aus dem Original, auch nicht als Vorlage zum
Nachbauen. **Keine Bilder aus Bildgeneratoren**: eine Figur in acht
Richtungen mal zwanzig Bewegungsbildern bleibt dort nicht dieselbe Figur, und
die Herkunft ihres Materials lässt sich nicht aufschreiben.

**4. Eine Kamera, ein Licht, für alles.** Orthografisch, 45° gedreht, 30°
über dem Boden — das ergibt die Raute 2 : 1, die das Spielbild hat
(darstellung AC-1). Eine Sonne von links oben, ein Schattenwurf. Dadurch
passt jedes Stück zu jedem anderen, ohne dass jemand darauf achtet.

**5. Figuren in acht Richtungen, mit Bewegungsabläufen.** Stehen, Gehen,
Arbeiten, Angreifen, Sterben; bei Dorfbewohnern dazu das Tragen. Welche
Richtungen gerendert und welche gespiegelt werden, entscheidet die Probe.

**6. Die Spielerfarbe ist eine Maske.** Zu jedem Bild rendert die Kette eine
zweite Fassung, die nur die Flächen in Spielerfarbe zeigt; der Browser färbt
diese Stellen ein. Die Farbe steht an Wappenrock, Schild, Fahne, Dachkante —
nicht mehr als ganze Fläche. Acht Farben kosten ein Bild, nicht acht.

**7. Blender ist ein Werkzeug auf dem Rechner, keine Abhängigkeit.** Wie der
Browser für Playwright ([ADR-0010](0010-playwright.md)): nicht in
`package.json`, nicht in der CI. **Die gerenderten Bilder werden
eingecheckt**, wie die Bildnachweise ([ADR-0011](0011-bildnachweise.md)).
`npm run check` läuft ohne Blender; es prüft, dass zu jedem Bild ein Eintrag
im Verzeichnis der Kette steht.

**8. Umgestellt wird hinter der vorhandenen Naht.** `figurBildZeichnen`,
`gebaeudeBildZeichnen` und `dingBildZeichnen` zeichnen heute schon einmal in
ein Zwischenbild und kopieren danach. Getauscht wird die Quelle dieses
Bildes, Art für Art. Was noch kein gerendertes Bild hat, wird weiter
gezeichnet — jeder Zwischenstand ist spielbar und prüfbar. Server, Regeln
und Übertragung bleiben unberührt ([ADR-0001](0001-server-rechnet.md)).

## Erst eine Probe

Ob die Kette Figuren hergibt, die überzeugen, ist **nicht belegt**. Gebäude
sind unbewegt und aus einer Ansicht — dort ist das Verfahren sicher. Eine
Figur braucht einen Körper mit Gelenken und Bewegungen, die nach einem
Menschen aussehen; das ist der unsichere Teil.

Deshalb beginnt der Umbau mit **einem Dorfbewohner, einem Haus und einem
Baum** durch die ganze Kette, auf der Schautafel neben ihren gezeichneten
Vorgängern ([Darstellung](../../specs/10-strategie/darstellung.md) AC-17).
Der Benutzer sieht die Bilder und entscheidet. Überzeugt die Figur nicht,
fällt nur die Probe weg; Gebäude und Gelände können trotzdem gerendert
werden, und für Figuren wird neu gefragt.

## Was es kostet

- **Ein Werkzeug mehr**, das nur örtlich läuft. Wer ein Modell ändert,
  braucht Blender.
- **Bilddateien im Repository.** Geschätzt, nicht gemessen: eine Figur mit
  acht Richtungen und fünf Abläufen sind einige hundert Einzelbilder, als
  Tafel einige hundert Kilobyte; alle Einheiten zusammen einige Megabyte.
  Die Probe misst es.
- **Ladezeit.** Die Bilder müssen im Browser sein, bevor die Partie zeichnet.
  Heute gibt es nichts zu laden.
- **Alle Bildnachweise des Spielbilds werden neu geschrieben**, schrittweise
  mit jeder umgestellten Art.
- **Die Messungen der Darstellung hängen am Verfahren.** darstellung AC-12
  („gezeichnet statt flach") zählt Tonstufen und Konturen einer Zeichnung.
  Die Kriterien bleiben `fertig`, bis ihr Nachfolger gebaut ist, und werden
  dann abgelöst — nicht vorher.

## Was verworfen wurde

- **Weiter zeichnen, nur sorgfältiger.** Zweimal versucht (Runden 26 bis 29,
  35 bis 41). Es wurde jedes Mal besser und blieb eine Zeichnung.
- **Bildgeneratoren.** Siehe Punkt 3.
- **Gekaufte oder freie Grafikpakete.** In dieser Ansicht und dieser Art gibt
  es kaum etwas Vollständiges; gemischte Herkunft sieht schlechter aus als
  ein einheitlich schlichtes Bild, und Völker mit eigenen Gebäuden (Stufe E)
  gibt kein Paket her.
- **3D im Browser (WebGL).** Würde dasselbe Aussehen liefern und Drehen
  erlauben, das niemand braucht — gegen einen neuen Zeichenweg, Modelle über
  die Leitung und die Regel, dass das Spielbild ohne Grafikkarte läuft
  (Darstellung, Grenzfälle).
