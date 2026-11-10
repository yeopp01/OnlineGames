# Bildumbau — Stand

Der Arbeitsstand zum Umbau auf gerenderte Bilder
([ADR-0016](../adr/0016-gerenderte-bilder.md), Schritte R1 bis R6 im
[Fahrplan](../../specs/10-strategie/fahrplan.md)).

**Warum eine eigene Datei:** der Umbau läuft auf dem Zweig
`strategie-bildumbau` in einem eigenen Arbeitsverzeichnis
(`../OnlineGames-bildumbau`), **neben** der Schleife auf `strategie`. Stünden
diese Notizen im Steuerstand und in den Erkenntnissen, stieße jede
Zusammenführung an denselben Zeilen an. Wer den Zweig einbindet, überträgt
die Zeilen unter „Für die Erkenntnisse" dorthin und erzeugt das Board neu
(`npm run specs:board`).

## Wo es steht

- **R0 (2026-11-09):** ADR-0016 geschrieben, darstellung AC-17 bis AC-24
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
- **R2 (2026-11-10): die Kette ist prüfbar** (darstellung AC-18 fertig).
  `grafik/verzeichnis.json` ist die eine Liste der Modelle — `npm run bilder`
  rendert daraus, `npm run check` prüft daran. Davor die drei Messungen, die
  seit der Probe offen waren (Größe, Speicher, Bildrate), siehe „R2: gemessen
  und entschieden". Daraus: die Tafeln sind jetzt **WebP**, gefärbt wird
  **je Zelle**.
- **Als Nächstes:** R3 — Gelände und Vorräte (darstellung AC-23).
- **Der ADR heißt jetzt 0016** (umbenannt am 2026-11-10, vorher 0014): auf
  `strategie` sind die Nummern 0014 (Häuser statt Völker) und 0015
  (Statthalter) inzwischen vergeben. Beim Einbinden bleibt nur
  `docs/adr/README.md` von Hand zusammenzuführen.
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
grafik/verzeichnis.json welches Skript erzeugt welche Bilder (AC-18)
grafik/QUELLEN.md       fremdes Material mit Herkunft, nur CC0 — bisher keines
scripts/bilder.mjs      npm run bilder [-- haus baum], prüft danach das Verzeichnis
scripts/bilder-verzeichnis.mjs  die Prüfung ohne Blender, auch für npm run check
public/bilder/          <name>.webp, <name>-maske.webp, <name>.json (eingecheckt)
public/bilder.js        lädt die Tafeln, färbt eine Zelle ein, zeichnet sie
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

| Tafel | Zellen | Zelle | Tafel (WebP) | Maske | Rechenzeit allein | als PNG (bis R1) |
| --- | --- | --- | --- | --- | --- | --- |
| haus | 1 | 400 × 330 | 27 KB | 1 KB | 9,5 s | 126 + 4 KB |
| baum | 4 Gestalten | 300 × 240 | 73 KB | – | 19,5 s | 230 KB |
| dorfbewohner | 8 Richtungen × 9 Bilder | 144 × 128 | 245 KB | 28 KB | 73 s | 703 + 79 KB |
| marktkarren | 8 Richtungen × 9 Bilder | 384 × 252 | 942 KB | 46 KB | 383 s | 2637 + 211 KB |

Zusammen 1,36 MB für vier Stücke (als PNG waren es 4,0 MB); der Marktkarren
allein ist 1,0 MB, weil seine Zelle fünfmal so groß ist wie die des
Dorfbewohners. Rechenzeit auf diesem Rechner mit der CPU, 96 Proben je Bild,
gemessen im Lauf vom 2026-11-10 abends, ohne Browserlauf daneben. Frühere
Messungen allein: Haus 6,4 s, Baum 17 s, Dorfbewohner 55 s — die Zeiten
schwanken auch ohne erkennbare Last um ein Drittel.

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
Einheiten wären 70 MB und mehr (als PNG gerechnet; als WebP ein Drittel
davon). Schwerer wiegt der Speicher nach dem Entpacken — siehe „R2: gemessen
und entschieden".

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
  und Kopf wirken in manchen Richtungen steif, Muskeln hat es keine.
- **Berichtigt in R2:** hier stand, die Spielerfarbe werde auf der
  Schattenseite mit Rot fast schwarz. **Nachgemessen stimmt das nicht** —
  siehe „R2: gemessen und entschieden". Der Eindruck stammte vermutlich aus
  der ersten, fehlerhaften Tafel, in der die Decke zu den schwarzen Stoffen
  gehörte.

## R2: gemessen und entschieden (2026-11-10)

Die drei Fragen, die seit der Probe offen waren. Gemessen an den vier Tafeln
des Zweigs; Wegwerfskripte, nicht eingecheckt.

**Größe — die Tafeln sind jetzt WebP mit Güte 90.**

| alle vier Tafeln samt Masken | Größe |
| --- | --- |
| PNG, wie Blender es schrieb | 3990 KB |
| PNG, nachverdichtet | 3194 KB |
| WebP verlustfrei | 2320 KB |
| **WebP 90** | **1361 KB** |
| WebP 80 | 1183 KB |

- Am Bild, sechsfach vergrößert neben dem PNG: 90 ist nicht zu
  unterscheiden (mittlere Abweichung je Kanal 0,25 bis 0,83 von 255), 80
  etwas weicher, bei 60 verliert die Figur ihr Gesicht. Die **Deckung bleibt
  exakt** — der Rand der Figur wandert nicht.
- Blender schreibt WebP selbst (`bild.file_format = 'WEBP'`,
  `save(quality=90)`), es braucht kein zweites Werkzeug.
- **WebP fasst höchstens 16383 Bildpunkte je Seite.** `kette.py` bricht
  vorher ab. Ein Gespann mit 41 Spalten zu 384 wäre 15744 breit — knapp
  darunter.
- Der Server kannte `.webp` nicht und hätte die Tafeln als
  `application/octet-stream` geschickt; der Typ steht jetzt in
  `server/index.js`, die Bildprobe prüft ihn.

**Speicher — gefärbt wird je Zelle, nicht je Tafel.**

- Bis R1 legte `inFarbe` je Spielerfarbe eine Kopie der ganzen Tafel an:
  zwei Farben Dorfbewohner und ein Haus waren **11,1 MB** an eigenen
  Leinwänden — für drei Zellen, die gebraucht wurden. Jetzt färbt
  `zelleInFarbe` die eine Zelle auf einer Werkbank (Maske, Farbe, Bild mal
  Farbe) und der Zwischenspeicher der Figuren hebt sie auf: **0,53 MB**.
  Gerechnet aus den Leinwandgrößen (`leinwandSpeicher()`), **nicht im
  Prozess gemessen**.
- Entpackt belegen die vier Tafeln samt Masken 68,6 MB (4 Byte je
  Bildpunkt, gerechnet). Der Marktkarren allein 55,8 MB.
- **Hochgerechnet für R5:** eine Fußeinheit mit 41 Spalten wäre 5904 × 1024,
  also 24 MB je Tafel und noch einmal so viel für die Maske; zwanzig
  Einheiten rund 1 GB, wenn alles zugleich entpackt ist. **So bleibt es
  nicht.** Für R5: eine Tafel je Ablauf statt je Einheit, nur laden, was die
  Partie braucht, die Maske als ein Kanal statt als zweites Bild.
- Zuschneiden bringt weniger als gedacht: mit Schatten belegt eine Zelle
  78 % (Baum), 69 % (Dorfbewohner), 91 % (Haus), 45 % (Marktkarren) ihrer
  Fläche, wenn jede einzeln zugeschnitten würde. Nicht gebaut.

**Bildrate — nicht in Gefahr.** `strategie-tempo` hat jetzt einen zweiten
Fall: dieselbe Szene (100 Einheiten, 29 Häuser und Dorfzentren, Zoom 1) aus
den Tafeln.

| | Bilder je Sekunde | Rechenzeit je Bild |
| --- | --- | --- |
| gezeichnet, stehend | 60,2 bis 60,3 | 1,2 bis 2,0 ms |
| gerendert, stehend | 60,1 bis 60,4 | 1,3 bis 2,1 ms |
| gezeichnet, gehend | 60,2 bis 60,3 | 1,6 bis 2,2 ms |
| gerendert, gehend | 60,3 bis 60,5 | 1,7 bis 2,4 ms |

Die Spannen sind fünf Läufe an einem Abend; innerhalb eines Laufs liegen
gerendert und gezeichnet nie mehr als 0,2 ms auseinander. Die 60 sind der
Takt des Bildschirms, nicht die Grenze des Zeichnens — die steht in der
rechten Spalte: rund 2 ms von 16,7. Im Gehen kamen 67 verschiedene Zellen
aus der Tafel.

**Spielerfarbe im Schatten — kein Mangel.** Mit Rot und Blau gefärbt haben
höchstens 0,1 % der Bildpunkte in Spielerfarbe einen hellsten Kanal unter 50
(schlimmste Zelle 1 %). Das Einfärben bleibt, wie es ist.

**Rechenzeit, allein gemessen:** Haus 9,5 s, Baum 19,5 s,
Dorfbewohner 73 s, Marktkarren 383 s — alle vier in 8 min 15 s. Der
Marktkarren ist damit zum ersten Mal allein gemessen: 5,3 s je Bild, fünfmal
so lang wie der Dorfbewohner bei fünffacher Zelle.

**Was die Prüfung fängt** (`scripts/bilder-verzeichnis.mjs`, belegt in
`tests/bilder.test.mjs` am echten und an gestelltem Bestand): Bild ohne
Eintrag, Eintrag ohne Bild, Eintrag ohne Skript, ein Bild bei zwei
Skripten, Beschreibung und Verzeichnis nennen verschiedene Bilder, eine
Tafel, die kein WebP ist, ein Name in `public/bilder.js`, den das
Verzeichnis nicht kennt, fremde Datei unter `grafik/` ohne Zeile in
`QUELLEN.md`, eine Lizenz, die nicht CC0 ist. **Was sie nicht fängt:** ob
ein Bild zu seinem Skript noch passt — wer das Skript ändert und nicht
rendert, hat ein altes Bild, und kein Test merkt es. Das ginge nur mit
einem Fingerabdruck des Skripts in der Beschreibung; nicht gebaut, weil
jede Änderung an `kette.py` dann alle Bilder für veraltet erklärte.

## Nach der Probe gefragt (2026-11-09)

- **Ist die Bildrate in Gefahr?** (Stand der Antwort vom 2026-11-09; in R2
  gemessen, siehe oben.) Nicht erwartet, aber **nicht gemessen**:
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

## Offen, wenn es weitergeht (R3 und danach)

- **Speicher bei vielen Einheiten** — siehe die Hochrechnung in R2. Vor R5
  entscheiden: eine Tafel je Ablauf, Laden nach Bedarf.
- **Der Server schickt keinen Cache-Kopf.** Jeder Seitenaufruf lädt die
  Tafeln neu. Heute 1,4 MB, mit allen Einheiten ein Vielfaches. Gehört zu
  Stufe G (Betrieb), braucht dann einen Dateinamen oder eine Marke, die sich
  mit dem Inhalt ändert.
- **Laden vor der Partie** (AC-24): heute zeichnet das Spiel, bis die Tafeln
  da sind, die alten Figuren.
- **Der Gefallene** wird wie bisher als gedrehtes Bild gezeichnet — mit
  gerenderter Figur dreht sich der Schatten mit.
- **Wer arbeitet oder trägt,** zeigt mit `?bilder=1` nur Stehen und Gehen.
- **Baustelle, Farm, Tor:** nur das fertige Haus kommt aus der Tafel.
- **Ein altes Bild zu einem geänderten Skript** fällt nicht auf (siehe R2).
- **Eine Ausnahme im Spielbild, einmal gesehen, nicht erklärt** (2026-11-10,
  ganzer Browserlauf zu R2: 205 von 206 grün, 22 min): `einheiten AC-29`
  (`strategie-ausweichen`) meldete „drawImage … canvas element with a width
  or height of 0". Derselbe Fall viermal einzeln danach: viermal grün. Der
  Fall schaltet die gerenderten Bilder nicht ein — von den Änderungen aus R2
  läuft in seinem Zeichenweg keine Zeile. **Ursache nicht gefunden**; die
  Aufzeichnung hat der Wiederholungslauf überschrieben. Wo eine Leinwand
  ohne Fläche entstehen kann: `uebersicht.js` (Größe aus `clientWidth`),
  der Zwischenspeicher in `figuren.js` (ein `NaN` als Breite wird 0).
  Seitdem nennt `fehlerSammeln` in `e2e/helpers/seite.mjs` zur Ausnahme die
  Stelle — beim nächsten Mal steht da, wo.

## Für die Erkenntnisse (beim Einbinden übertragen)

- **Spec-Runde Bildumbau, ADR-0016** (2026-11-09, Wunsch des Benutzers: „viel
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
- **R2, die Kette prüfbar** (2026-11-10, darstellung AC-18 fertig): siehe
  „R2: gemessen und entschieden". **Erkenntnis:** zwei Befürchtungen aus der
  Probe waren am Bild entstanden und hielten der Messung nicht stand — die
  Bildrate war nie in Gefahr, und die „fast schwarze" Spielerfarbe im
  Schatten gab es nur in einer fehlerhaften Tafel. Die dritte, über die
  niemand gesprochen hatte, war echt: eine Kopie der ganzen Tafel je Farbe.
  Was nach einem Blick als Mangel im Stand steht, wird gemessen, bevor
  jemand daran baut. Und: eine Liste, aus der gerendert **und** geprüft
  wird, kann nicht neben dem Bestand herlaufen — vorher stand dieselbe
  Liste in `bilder.py` und in `bilder.js`.
- **Zwei Sitzungen in einem Arbeitsbaum** (2026-11-09): während der
  Spec-Runde arbeitete die Schleife an spielziel AC-23 im selben Verzeichnis.
  Bemerkt erst an `git status`. Seitdem: Arbeit neben der Schleife bekommt
  ein eigenes Arbeitsverzeichnis (`git worktree add`), bevor die erste Datei
  geändert wird. Der Browserlauf dort braucht einen eigenen Hafen
  (`E2E_HAFEN=4391`).
