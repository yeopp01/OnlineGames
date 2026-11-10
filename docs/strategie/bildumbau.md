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
- **R1 ist committet** (9b72a0b, 2026-11-09). Der volle Lauf hatte zwei
  Zeitmessungen gerissen, während nebenher gerechnet wurde (`bedienung AC-33`
  im Browser, `einheiten AC-31` ohne) — beide einzeln und im zweiten Lauf
  grün.
- **Der Marktkarren** (2026-11-10, Wunsch des Benutzers: „kannst du mal nen
  Marktkarren mit Blender basteln?"): `grafik/marktkarren.py`, ein Zugpferd
  vor einem zweirädrigen Karren, acht Richtungen, Stehen und Gehen. Er steht
  als fünftes Blatt auf `/bildprobe.html`. Die Einheit selbst ist auf
  `strategie` inzwischen gebaut (Runde 160, einheiten AC-39, dort
  gezeichnet); auf diesem Zweig gibt es sie noch nicht, die Tafel hängt
  deshalb nur an der Bildprobe. Ob `figuren.js` sie beim Einbinden mit
  `?bilder=1` ohne Weiteres nimmt (Zelle und Fußpunkt eines Gespanns statt
  einer Fußfigur), ist **nicht geprüft**.
- **Die Kette rendert seit 2026-11-10 in einem Durchgang** — Anlass waren
  schwarze Stoffe in der ersten Tafel des Marktkarrens, siehe unten. Alle
  vier Tafeln sind damit neu geschrieben.
- **Als Nächstes:** R2 — zuerst die Messungen (Größe, Speicher, Bildrate),
  dann der Rest der Kette.
- **Blender 5.2.3** liegt unter
  `C:\Program Files\Blender Foundation\Blender 5.2\blender.exe` (per winget,
  nicht im PATH). `npm run bilder` findet es dort.

## Die Kette

```
grafik/kette.py         Szene, Kamera, Sonne, die Nebenkanäle, die Tafel
grafik/stoffe.py        Oberflächen als Knotennetze (Rauschen, Relief, Fugen)
grafik/formen.py        Quader, Drehkörper, Glied, Kugel, Prisma, Netz, Strang
grafik/haus.py          ein Modell = ein Skript mit bauen() und tafel(ziel)
grafik/baum.py
grafik/dorfbewohner.py
grafik/marktkarren.py
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
- **Ein Durchgang je Bild, zwei Nebenkanäle** (seit 2026-11-10): jeder Stoff
  schreibt neben dem Bild die **Deckung** (1, wo ein Körper steht) und die
  **Spielerfarbe** (1, wo der Stoff `spielerfarbe` trägt) als eigene Kanäle
  (AOV). Gerendert wird nach EXR mit allen Kanälen, gelesen mit
  `OpenImageIO` aus Blenders eigenem Python — Blender 5.2 legt das Bild und
  jeden Nebenkanal in einen eigenen Teil der Datei. Aus Bild und Deckung
  trennt `_schatten_daempfen` den Schatten ab: Stärke 0,6, und was unter
  5 % liegt, fällt weg. Bis R1 waren es drei Durchgänge mit getauschten
  Stoffen — siehe „Der Marktkarren und die schwarzen Stoffe".
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

| Tafel | Zellen | Zelle | Tafel | Maske | Rechenzeit allein | drei Durchgänge (R1) |
| --- | --- | --- | --- | --- | --- | --- |
| haus | 1 | 400 × 330 | 126 KB | 4 KB | 6,4 s | 12 s |
| baum | 4 Gestalten | 300 × 240 | 230 KB | – | 17 s | 21 s |
| dorfbewohner | 8 Richtungen × 9 Bilder | 144 × 128 | 703 KB | 79 KB | 55 s | 81 s |
| marktkarren | 8 Richtungen × 9 Bilder | 384 × 252 | 2637 KB | 211 KB | nicht allein gemessen | – |

Zusammen 4,0 MB für vier Stücke, PNG ohne Nachverdichtung; der Marktkarren
allein ist 2,8 MB, weil seine Zelle fünfmal so groß ist wie die des
Dorfbewohners. Die Masken sind mit dem Nebenkanal auf ein Viertel und
weniger geschrumpft (vermutlich, weil kein Rauschen mehr darin steht).
Rechenzeit auf diesem Rechner mit
der CPU, 96 Proben je Bild.

**Die Rechenzeit schwankt stark, wenn nebenher gerechnet wird.** Der Lauf,
der die eingecheckten Tafeln geschrieben hat, brauchte 21 min 48 s (Haus
7,5 s, Baum 320 s, Dorfbewohner 559 s, Marktkarren 419 s) — der Baum also
neunzehnmal so lang wie allein. Ein zweiter Lauf über drei Modelle gleich
danach: 20 s, 28 s, 90 s. Vermutet, nicht belegt: die Schleife auf
`strategie` fuhr währenddessen ihren Browserlauf. Wer Rechenzeiten
vergleicht, misst allein und zweimal.

**Hochgerechnet, nicht gemessen:** eine Einheit mit fünf Abläufen zu acht
Bildern hat rund 41 Bilder je Richtung statt 9 — etwa 3,5 MB und vier
Minuten je Fußeinheit in dieser Form, ein Gespann ein Mehrfaches. Zwanzig
Einheiten wären 70 MB und mehr; so bleibt es nicht (siehe „Offen":
zuschneiden, WebP, weniger Rauschen).

Im Browser (darstellung AC-17, `strategie-bildprobe`): das ähnlichste Paar
zweier Blickrichtungen unterscheidet sich in 19 % der Figur; die
Spielerfarbe bedeckt 27 % der stehenden Figur.

## Der Marktkarren und die schwarzen Stoffe (2026-11-10)

- **Das Modell:** Pferd als Gliedertier (Gelenke als leere Achsen, Leib aus
  Drehkörpern), Schritt als Viertakt (hinten links 0, vorn links ¼, hinten
  rechts ½, vorn rechts ¾), der Leib so hoch, dass das tiefste Bein den
  Boden berührt. Karren mit Gabeldeichsel, Fass, Säcken, Kiste und einer
  Plane als Netz. Spielerfarbe: Plane und Decke des Pferds, 18 bis 34 % des
  Körpers je Bild.
- **Die Räder drehen sich:** acht Speichen, drei Speichenabstände je Ablauf
  (17° je Bild). Ein ganzer Abstand je Bild sähe aus wie Stillstand, mehr
  als ein halber wie rückwärts. **Nicht abgeglichen** ist, ob das Rad so
  weit rollt, wie der Karren im Spiel je Ablauf fährt.
- **Die Zelle** musste zweimal wachsen (384 × 252, Fuß 160/162): ein Gespann
  ist in acht Richtungen einmal lang und einmal hoch. Kleinster Rand mit
  Schatten 22/17/27/6, der Körper 32/19/96/51.
- **Schwarze Stoffe:** in der ersten vollen Tafel standen in 27 von 72
  Bildern ganze Stoffe schwarz (Fass, Unterbeine, Decke — bis 28 % des
  Körpers). Die Tafel des Dorfbewohners aus derselben Kette war sauber.
  **Ursache, sehr wahrscheinlich, nicht bewiesen:** `use_persistent_data`
  zusammen mit dem Stofftausch je Durchgang — der Renderer bekam den
  Rücktausch nicht immer mit, und im Bild stand das Loch aus dem
  Masken-Durchgang. **Behoben** durch Weglassen des Tauschs: ein Durchgang,
  Deckung und Spielerfarbe als Nebenkanäle. Nachgemessen: in allen vier
  Tafeln kein Bild mit mehr als 0,5 % rein schwarzem Körper. Haus und
  Dorfbewohner decken sich mit den Tafeln aus R1 (mittlere Abweichung je
  Kanal unter 1 von 255).
- **Der Wächter dazu sitzt in der Kette:** `Tafel.bild` bricht ab, wenn mehr
  als 2 % des Körpers rein schwarz sind (`_schwarz_anteil`). Geprobt an
  einem gestellten Feld (0 / 0,3 / 0 für sauber, drei Zeilen schwarz,
  schwarz nur im Schatten), nicht am echten Fehler.
- **Was dem Karren fehlt** (ehrlich): das Pferd ist ein Gliedertier — Hals
  und Kopf wirken in manchen Richtungen steif, Muskeln hat es keine. Die
  Spielerfarbe wird auf der Schattenseite mit Rot fast schwarz: ein dunkles
  Grau mal Rot. Das trifft auch die Gugel und ist eine Eigenschaft des
  Verfahrens — in R2 ansehen (Maske aufhellen oder `multiply` mit Boden).

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
- **Marktkarren und Kettenumbau** (2026-11-10): siehe „Der Marktkarren und
  die schwarzen Stoffe". **Erkenntnis:** ein Fehler der Kette zeigte sich
  erst am vierten Modell und erst in der Vergrößerung — in Spielgröße sah
  die Tafel richtig aus. Was am Bild nur der sieht, der hineinzoomt, gehört
  als Messung in die Kette (schwarzer Anteil je Bild), nicht ins Ansehen.
  Und: Zustand zwischen Durchgängen umzuschalten ist die Fehlerquelle, nicht
  das Rendern — ein Durchgang mit Nebenkanälen hat nichts umzuschalten.
- **Zwei Sitzungen in einem Arbeitsbaum** (2026-11-09): während der
  Spec-Runde arbeitete die Schleife an spielziel AC-23 im selben Verzeichnis.
  Bemerkt erst an `git status`. Seitdem: Arbeit neben der Schleife bekommt
  ein eigenes Arbeitsverzeichnis (`git worktree add`), bevor die erste Datei
  geändert wird. Der Browserlauf dort braucht einen eigenen Hafen
  (`E2E_HAFEN=4391`).
