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
- **R1 (2026-11-09): die Probe steht** (darstellung AC-17). Dorfbewohner,
  Haus und Laubbaum laufen durch die ganze Kette; `/bildprobe.html` zeigt sie
  neben den gezeichneten. Im Spielbild sind sie abgeschaltet, `?bilder=1`
  schaltet sie ein (`npm run sicht -- --spiel --bilder`).
- **Der Benutzer hat am Bild entschieden** (2026-11-09): „ja, sieht viel viel
  besser aus." Das ist das Ja für R2. Seine drei Fragen dazu und die
  Antworten stehen unter „Nach der Probe gefragt".
- **Als Nächstes:** R1 committen, sobald `check:alles` grün ist, dann R2 —
  zuerst die Messungen (Größe, Speicher, Bildrate), dann der Rest der Kette.
- **Blender 5.2.3** liegt unter
  `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` (per winget,
  nicht im PATH). `npm run bilder` findet es dort.

## Die Kette

```
grafik/kette.py         Szene, Kamera, Sonne, die drei Durchgänge, die Tafel
grafik/stoffe.py        Oberflächen als Knotennetze (Rauschen, Relief, Fugen)
grafik/formen.py        Quader, Drehkörper, Glied, Kugel, Prisma, Netz, Strang
grafik/haus.py          ein Modell = ein Skript mit bauen() und tafel(ziel)
grafik/baum.py
grafik/dorfbewohner.py
grafik/bilder.py        Einstieg: blender -b -P grafik/bilder.py -- haus
scripts/bilder.mjs      npm run bilder [-- haus baum]
public/bilder/          <name>.png, <name>-maske.png, <name>.json (eingecheckt)
public/bilder.js        lädt die Tafeln, färbt die Maske ein, zeichnet eine Zelle
public/bildprobe.html   die Probe: gerendert neben gezeichnet
```

- **Kamera** orthografisch, gedreht (60°, 0°, 45°): 30° über dem Boden, ein
  Feld wird zur Raute 2 : 1. `FELD_BREITE = 132` Bildpunkte je Feldbreite —
  das ist Zoom 3; das Rad geht bis 2,5, der Browser verkleinert also immer.
- **Achsen:** Spiel `x` = Blender `+X`, Spiel `y` = Blender `−Y`. Im Bild
  sieht man von einem Quader die Seiten `−Y` (links, im Licht) und `+X`
  (rechts, im eigenen Schatten).
- **Sonne:** läuft am Boden in Richtung 65° von `+X`, steht 50° hoch, 6° weit
  (weicher Rand). Himmel 0,8, Sonne 3,8.
- **Drei Durchgänge je Bild:** das Bild mit Schattenfänger; die **Deckung**
  (alles leuchtet, ohne Boden — wo ein Körper steht); die **Maske** (nur
  Spielerfarbe leuchtet, alles andere ist ein Loch und verdeckt). Aus Bild
  und Deckung trennt `_schatten_daempfen` den Schatten ab: Stärke 0,6, und
  was unter 5 % liegt, fällt weg.
- **Spielerfarbe:** der Stoff ist hell und unbunt (`#7e7e7e` bis `#b4b4b4`)
  und trägt `spielerfarbe`. Der Browser nimmt ihn mit der Farbe mal
  (`multiply`), begrenzt auf die Maske. Heller Stoff ergibt die reine Farbe
  ohne Falten — deshalb nicht heller.
- **Blickrichtung:** Zeile 0 schaut zum Betrachter, dann gegen den
  Uhrzeigersinn von oben: 2 nach rechts, 4 weg, 6 nach links.
  `richtungAus(dx, dy)` in `public/bilder.js` rechnet sie aus der Bewegung im
  Bild; `ansicht.richtungen` merkt sie je Einheit.
- **Ansehen beim Bauen:** `blender -b -P grafik/bilder.py -- haus --vorschau
  --ziel=<ordner>` schreibt `<name>-vorschau.png` (auf Gras, Maske blau, daneben
  halb so groß). `BILDER_PROBE=1` rendert vom Dorfbewohner nur drei Spalten.

## Was die Probe gezeigt hat

- **Gebäude und Bäume sind sicher.** Das Haus stand beim zweiten Wurf.
- **Die Figur geht** — als Gliedermann aus gerundeten Stücken an Gelenken,
  ohne fremden Körper und ohne fremde Bewegungsdaten. Das Becken wird je Bild
  so hoch gesetzt, dass das tiefere Bein den Boden berührt.
- **Was der Figur fehlt** (ehrlich): ein Gesicht, das man erkennt; Hände;
  Falten im Stoff, die sich mitbewegen; Arbeiten, Tragen, Angreifen, Sterben.
  Die Gelenke sind Kugeln ohne Haut darüber — groß sieht man es, in
  Spielgröße nicht.
- **Blätter als kleine Rauten** statt Kugeln: einige zehntausend je Baum.
  Erst Rechtecke von 5 bis 8 cm — das waren Papierschnipsel.
- **Der Schattenfänger nimmt das Himmelslicht mit** und legt einen Schleier
  über die ganze Zelle; im Spiel stand jedes Stück in einem Kasten. Deshalb
  der Durchgang „Deckung".
- **Der Schatten, voll gerendert, ist fast schwarz** — auf Gras zu schwer.

## Gemessen

| Tafel | Zellen | Zelle | Tafel | Maske | Rechenzeit |
| --- | --- | --- | --- | --- | --- |
| haus | 1 | 400 × 330 | 130 KB | 31 KB | 12 s |
| baum | 4 Gestalten | 300 × 240 | 246 KB | – | 21 s |
| dorfbewohner | 8 Richtungen × 9 Bilder | 144 × 128 | 724 KB | 340 KB | 81 s |

Zusammen 1,5 MB für drei Stücke, PNG ohne Nachverdichtung. Rechenzeit auf
diesem Rechner mit der CPU, 96 Proben je Bild, drei Durchgänge je Bild.
**Hochgerechnet, nicht gemessen:** eine Einheit mit fünf Abläufen zu acht
Bildern hat rund 41 Bilder je Richtung statt 9 — etwa 5 MB und sechs
Minuten je Einheit in dieser Form. Zwanzig Einheiten wären 100 MB; so bleibt
es nicht (siehe „Offen": zuschneiden, WebP, weniger Rauschen).

Im Browser (darstellung AC-17, `strategie-bildprobe`): das ähnlichste Paar
zweier Blickrichtungen unterscheidet sich in 19 % der Figur; die
Spielerfarbe bedeckt 27 % der stehenden Figur.

## Nach der Probe gefragt (2026-11-09)

- **Ist die Bildrate in Gefahr?** Nicht erwartet, aber **nicht gemessen**:
  eine Zelle aus der Tafel landet in demselben Zwischenspeicher wie bisher
  die Zeichnung, je Bild ist es dasselbe `drawImage`. Die Gefahr liegt bei
  **Ladegröße und Speicher**. Gemessen mit Pillow, `method=6`:

  | Tafel | PNG | WebP 90 | WebP 80 | WebP verlustfrei |
  | --- | --- | --- | --- | --- |
  | haus + Maske | 160 KB | 25 KB | 19 KB | 73 KB |
  | baum | 245 KB | 69 KB | 59 KB | 146 KB |
  | dorfbewohner + Maske | 1063 KB | 257 KB | 222 KB | 452 KB |

  WebP 90 ist ein Viertel der PNG-Größe (351 statt 1472 KB). **Am Bild noch
  nicht angesehen**, ob 90 reicht. Entpackt belegt die Tafel des
  Dorfbewohners 5,3 MB je Farbe; von der Zelle 144 × 128 belegt der Körper
  höchstens 56 × 99, mit Schatten 126 × 116 — der Schatten macht die Zelle
  groß, nicht die Figur.
- **Umschalten zwischen beiden Aussehen?** Nein, nicht auf Dauer. Der
  Schalter `?bilder=1` bleibt für den Umbau; AC-24 sagt schon: am Ende sind
  die gezeichneten Fassungen entfernt. Sonst würde jede neue Einheit zweimal
  gebaut und zweimal nachgewiesen — für ein Aussehen, das dreimal beanstandet
  wurde.
- **Könnte ein kleineres Modell dieselbe Qualität?** Nicht gemessen. Die
  Kette (`kette.py`, `stoffe.py`, `formen.py`) und ein Muster je Art (Haus,
  Baum, Figur) stehen; ein Gebäude nach Muster ist die leichtere Aufgabe,
  Figur und Bewegung die schwere. Prüfbar an einem Stück: ein Gebäude bauen
  lassen und auf der Bildprobe daneben stellen.

## Offen, wenn es weitergeht (R2 und danach)

- **Größe der Tafeln.** PNG ohne Nachverdichtung. Rauschen in den Schatten
  und im Laub verdichtet schlecht. Hebel: weniger Proben mit Entrauschen,
  WebP, Zellen auf den belegten Ausschnitt zuschneiden.
- **Eine Tafel je Farbe im Speicher.** `inFarbe` färbt die ganze Tafel einmal
  je Spielerfarbe ein (Dorfbewohner: 1296 × 1024 × 4 Byte, rund 5 MB je
  Farbe). Bei acht Farben und zwanzig Einheiten zu viel — dann je Zelle
  einfärben, beim Füllen des Zwischenspeichers.
- **Laden vor der Partie** (AC-24): heute zeichnet das Spiel, bis die Tafeln
  da sind, die alten Figuren.
- **Bildrate** mit 100 gerenderten Einheiten ist nicht gemessen
  (`strategie-tempo`).
- **Der Gefallene** wird wie bisher als gedrehtes Bild gezeichnet — mit
  gerenderter Figur dreht sich der Schatten mit.
- **Wer arbeitet oder trägt,** zeigt mit `?bilder=1` nur Stehen und Gehen.
- **Baustelle, Farm, Tor:** nur das fertige Haus kommt aus der Tafel.

## Für die Erkenntnisse (beim Einbinden übertragen)

- **Spec-Runde Bildumbau, ADR-0014** (2026-11-09, Wunsch des Benutzers: „viel
  detaillierter, bildlicher … nicht so kindlich gemalt" — zum dritten Mal
  nach Runde 26 und 35). **Erkenntnis:** zweimal im selben Verfahren
  nachzubessern hat die Beanstandung nicht beendet — beim dritten Mal ist die
  Frage das Verfahren, nicht die Sorgfalt. Befund am Bild: zwei
  Blickrichtungen (gespiegelt), Laufen als verschobene Vielecke, kein
  Material, Spielerfarbe als ganze Fläche. Die Gebäude sind am weitesten.
- **R1, die Probe** (2026-11-09, darstellung AC-17 fertig): siehe „Was die
  Probe gezeigt hat". **Erkenntnis:** die Vorschau auf Gras gehört in die
  Kette, nicht in den Browser — auf Weiß sah das erste Haus gut aus und die
  Maske leer; erst auf Gras, eingefärbt und in halber Größe sah man Kasten,
  Schatten und Farbe.
- **Zwei Sitzungen in einem Arbeitsbaum** (2026-11-09): während der
  Spec-Runde arbeitete die Schleife an spielziel AC-23 im selben Verzeichnis.
  Bemerkt erst an `git status`. Seitdem: Arbeit neben der Schleife bekommt
  ein eigenes Arbeitsverzeichnis (`git worktree add`), bevor die erste Datei
  geändert wird. Der Browserlauf dort braucht einen eigenen Hafen
  (`E2E_HAFEN=4391`).
