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
- **R3 (2026-11-10): Gelände und Vorräte** (darstellung AC-23 fertig) —
  Boden in fünf Texturen, Ufer, vier Baumarten, Beeren, Gold und Stein in
  vier Füllstufen. Siehe „R3: Gelände und Vorräte".
- **Als Nächstes laut Fahrplan:** R4 — Gebäude samt Baustellen (darstellung
  AC-22). **Vorgezogen auf Wunsch des Benutzers: die Einheiten** — siehe
  „Der Nachtauftrag".
- **Der Nachtauftrag (2026-11-10, abends).** Der Benutzer, nach R3: „mach
  einfach die Reiter", und dann: „ich werde jetzt dann ins Bett gehn, du
  kannst ja über Nacht weiterbauen, und wenn wir dann alle Einheiten haben,
  mergen wir nach main." Das heißt: **alle Einheiten rendern, ohne
  Rückfrage, Gruppe für Gruppe committen** (auf `strategie-bildumbau`, mit
  grünem `npm run check`). **Kein Push, kein Merge** — das Zusammenführen
  macht der Benutzer mit („mergen wir"). Reihenfolge:
  1. **Reiter**: Späherreiter und Ritter. Das Pferd steckt seit dem
     Marktkarren in der Kette; es zieht nach `grafik/pferd.py` um, der Karren
     benutzt es von dort (danach neu rendern und mit dem alten Bild
     vergleichen). Reiter und Sattelzeug in `grafik/reiter.py`, die zwei
     Modelle `spaeherreiter.py` und `ritter.py`. Abläufe: Stehen, Traben
     (als `gehen`), Angreifen, Sterben — je acht Bilder, acht Richtungen.
     **Eine Tafel je Ablauf** (`ritter-angreifen.webp`), der Browser lädt
     Angreifen und Sterben erst, wenn er sie braucht — die Entscheidung, die
     vor R5 anstand.
  2. **Fußkämpfer und Schützen** auf dem Skelett des Dorfbewohners: Miliz,
     Soldat, Speerkämpfer, Bogenschütze, Plänkler, Armbrustschütze, Mönch.
  3. **Belagerung**: Ramme, Mangonel (starr wie der Karren).
  4. **Das Schaf.**
  5. **Der Dorfbewohner ganz** (Arbeiten, Tragen, Angreifen, Sterben) — R5.

  `fertig` wird dabei nur, was ganz belegt ist: AC-24 („alle Einheiten")
  erst, wenn wirklich alle stehen und die gezeichneten Fassungen weg sind —
  das Entfernen wartet auf das Ja des Benutzers zum Umschalten.

  **Stand in der Nacht (fortgeschrieben, damit nach einer Zusammenfassung
  weitergearbeitet werden kann):**
  - Gebaut, noch nicht committet: `grafik/pferd.py` (Abläufe `stehen`,
    `gehen`, `traben`, `kampf`, `sterben`), `grafik/reiter.py` (Sattelzeug,
    Mensch im Sattel, `tafel(ziel, art)`; Zelle und Fuß je Art in `ARTEN`),
    `spaeherreiter.py`, `ritter.py`, beide im Verzeichnis. `kette.py` kennt
    `blatt.bild(zeile, spalte, teil='angreifen')` — eine eigene Tafel je
    Ablauf, die Beschreibung nennt sie am Ablauf (`bild`, `maske`).
    `formen.py`: `tiefster_punkt`, `aufsetzen` (für alles, was fällt).
  - Browser: `bilder.js` mit `ablaufZelle(tafel, richtung, ablauf, anteil)`
    und `ablaeufeLaden(name)`; die Tafel eines Ablaufs wird beim ersten
    Gebrauch geholt, bis dahin steht die Figur. `figurBildZeichnen` wählt
    sterben / angreifen / gehen / stehen; `lage.sterben` (0 bis 1) ist neu.
    `ansicht.js`: Gefallene mit gerendertem Sterben werden nicht gedreht,
    sondern spielen den Ablauf einmal (`this.gefallen`, `STERBEN_MS`); wer
    schlägt, dreht sich zum nächsten Gegner (`schlagRichtung`, alle 300 ms).
  - Bildprobe: Blatt „Einheiten" (`EINHEITEN` in `bildprobe.js`, je Einheit
    ein Band) — jede neue Einheit bekommt dort eine Zeile.
  - Proberender: `BILDER_PROBE=1 npm run bilder -- <name> --ziel=<ordner>`
    (drei Richtungen, vier Bilder je Ablauf), ansehen mit dem Wegwerfskript
    `ansehen.py` im Scratchpad. Späherreiter stand beim ersten Versuch; der
    Ritter stieß mit der Lanze an den Zellenrand (deshalb 352 × 304).
  - Stand 2026-11-11, 00:30: Späherreiter voll gerendert (unter
    `public/bilder/`, angesehen, Spielerfarbe 0,11 bis 0,27 des Körpers);
    Ritter-Probe gut (Lanze waagerecht, Schabracke ruhig), voller Render und
    Marktkarren laufen. Offen in dieser Gruppe: Marktkarren mit
    `scratchpad/alt/marktkarren.webp` vergleichen, Bildprobe und Spielbild im
    Browser ansehen, Browsertest zum Blatt, `npm run check:alles`, Commit.
  - **Fußvolk angefangen** (`grafik/fussvolk.py`, dünne Module `miliz.py`,
    `soldat.py`, `speerkaempfer.py`, `bogenschuetze.py`, `plaenkler.py`,
    `armbrustschuetze.py`, `moench.py`, alle im Verzeichnis): derselbe
    Gliedermann wie der Dorfbewohner, Kleider aus `rock`/`bahn`/`band`,
    Haltungen als Wörterbuch je Gelenk, der Angriff als Stationen
    (`ARTEN[art]['angriff']`), `waffe` ist die Neigung der Waffe an der Figur.
    Die Miliz stand beim ersten Proberender; ihr Wappenrock war mit 0,38 zu
    blau und ist jetzt zwei Bahnen. Zwei Wegwerfskripte im Scratchpad:
    `masse.py` (misst ohne Rendern, wie viel Platz Körper und Schatten in der
    Zelle brauchen — danach Zelle und Fuß je Art setzen, vor dem vollen
    Render) und `anteil.py <ordner> <name>` (Anteil der Spielerfarbe je
    Zelle; Grenze ein Drittel, darstellung AC-21).
  - `npm run bilder` prüft am Ende das ganze Verzeichnis: stehen dort schon
    Einträge ohne Bild, endet der Lauf mit Fehler, obwohl gerendert ist —
    Läufe deshalb mit `;` verketten, nicht mit `&&`.
  - **Stand 2026-11-11, 20:50** (die Sitzung stand von 00:47 bis 20:45 —
    über Nacht ist nichts weiter gerendert worden): voll gerendert liegen
    unter `public/bilder/` Späherreiter, Ritter (1690 s) und der Marktkarren
    neu (351 s, jetzt mit `hoehe` in der Beschreibung). Noch nichts davon ist
    committet, nichts war in einem Browser oder Testlauf.
  - **Die Tafeln werden knapp geschnitten** (`Tafel(..., knapp=True)` in
    `kette.py`): gerendert wird in einer Zelle, in die Hieb und Sturz passen,
    geschrieben wird jede Tafel so klein, wie ihre Bilder es erlauben; ein
    Ablauf mit eigener Tafel nennt dann `zelle` und `fuss` selbst
    (`bilder.js` `teilHolen`, `figuren.js` misst an `zelle.quelle`,
    `tests/bilder.test.mjs` prüft je Ablauf). Miliz-Probe: Haupttafel
    156 × 133 statt 304 × 224 je Zelle. Fußvolk rendert deshalb für alle
    sieben in `ZELLE = (304, 224)`, `FUSS = (130, 160)` — `masse.py` sagt,
    alle passen; Zelle je Art von Hand setzen entfällt.
  - **Ein Teil darf mehreren Abläufen gehören** (`'teil': 'h'` am Ablauf):
    der Dorfbewohner hat je Ware eine Tafel mit Stehen und Gehen
    (`stehen_h`, `gehen_h`, … `_n`, `_g`, `_s`); der Browser merkt sich
    Tafeln je Bilddatei.
  - **Fußvolk**: alle sieben als Probe angesehen und gut (Spielerfarbe
    Miliz 0,05–0,26, Soldat 0,08–0,25, Speer 0,06–0,23, Bogen 0,09–0,27,
    Plänkler 0,14–0,30, Mönch 0,10–0,29). Der Armbrustschütze lag bei
    0,28–0,36 und hielt die Armbrust zu tief: Kragen aus Kette und Anschlag
    an der Wange sind geändert, **noch nicht nachgesehen**. Voll gerendert
    werden gerade Soldat, Speerkämpfer, Bogenschütze, Plänkler, Mönch
    (Hintergrundlauf); Miliz und Armbrustschütze danach.
  - **Dorfbewohner ganz** (`grafik/dorfbewohner.py` umgebaut, gebaut und
    vermessen, **noch nie gerendert**): Gelenk `koerper`, Abläufe `arbeiten`
    (Axthieb, eigene Tafel), `sterben` (eigene Tafel), `stellen(g, ablauf, t,
    ladung=None)` mit vier Ladungen auf dem Rücken, Zelle (224, 176), knapp.
    Im Verzeichnis stehen seine 14 Bilder.
  - **Belagerung und Schaf** (`belagerung.py`, `ramme.py`, `mangonel.py`,
    `schaf.py`): geschrieben und vermessen, **noch nie gerendert**. Zu
    prüfen: dreht sich das Scheibenrad sichtbar (sonst sind die acht Bilder
    des Gehens gleich)? Das Schaf hat `kadaver` (vier Stufen) statt Sterben.
  - **Browser, noch in keinem Browser gewesen**: `NAMEN` in `bilder.js`
    nennt alle 20 Tafeln (ohne Bild schlägt `bilderLaden` fehl — erst
    einschalten, wenn alles gerendert ist); `figurBildZeichnen` nimmt
    `arbeiten` statt `angreifen`, wo es das gibt, `stehen_<ware>`/
    `gehen_<ware>` bei Ladung und `kadaver` (Anteil `1 - rest`) für ein
    geschlachtetes Tier; `ansicht.js` gibt Tieren eine Blickrichtung aus
    ihrer Bewegung (`tier.richtung`) und lässt sie nach dem letzten Schritt
    stehen (vorher lief ein Schaf nach dem letzten Schritt auf der Stelle
    weiter, weil Tiere nur bei Änderung gemeldet werden).
  - **Offen**: Blatt „Einheiten" der Bildprobe um alle Einheiten erweitern
    (`EINHEITEN` in `bildprobe.js`), der Browsertest AC-24 misst in der Zelle
    der Haupttafel — er braucht eine Leinwand, in die jede Tafel passt, und
    je Einheit die Abläufe, die sie hat (Dorfbewohner `arbeiten`, Schaf
    `kadaver`); Marktkarren hat kein `sterben`. Wegwerfskripte im
    Scratchpad: `schau.py <ordner> <name> [faktor]` (alle Tafeln als Blatt
    unter `scratchpad/blaetter/`, dazu Zelle, Größe und Spielerfarbe),
    `masse.py -- <modul>` (Platz ohne Rendern; `dorf_m` ist die Hülle für
    den Dorfbewohner).
  - **Stand 2026-11-11, 21:35**: Proben angesehen und abgenommen:
    Armbrustschütze (0,14–0,24, Anschlag an der Wange), Ramme (0,09–0,28),
    Mangonel (0,20–0,31), Dorfbewohner (Hieb, Sturz, vier Ladungen
    unterscheidbar; Spielerfarbe nach `schau.py` 0,29–0,37 — der Browsertest
    misst anders, dort **noch nicht gelaufen**). Schaf lebend gut; am Kadaver
    standen die Rippen wie Latten ab — jetzt Bögen (`strang`) auf dem
    Fleisch, **Probe läuft**. **Marktkarren hat `sterben`** (Pferd fällt,
    Karren kippt um die Achse auf die Deichsel, `KIPPEN`), eigene Tafel, im
    Verzeichnis eingetragen, **Probe läuft**. Reiter und Marktkarren sind
    auf `knapp=True` gestellt und werden neu gerendert (Ritter lag entpackt
    bei 30,8 + 27,4 + 27,4 MB, Späherreiter bei 19,9 + 17,7 + 17,7 MB,
    Marktkarren 27,9 MB).
  - **Laufende volle Render** (zwei Reihen nebeneinander): Soldat,
    Speerkämpfer, Bogenschütze, Plänkler, Mönch · Miliz, Armbrustschütze,
    Ramme, Mangonel, Dorfbewohner, Späherreiter, Ritter. Danach noch Schaf
    und Marktkarren voll, sobald ihre Proben abgenommen sind.
  - **Bildprobe und Browsertest AC-24 sind umgeschrieben, nicht gelaufen**:
    `EINHEITEN` in `bildprobe.js` nennt 13 Einträge; der Test misst auf
    einer Leinwand, in die jede Tafel der Einheit passt, und nennt in
    `ERWARTET`, welche Abläufe eine Einheit hat (Dorfbewohner `gehen`,
    `arbeiten`, `sterben`, `gehen_<ware>`; Schaf nur `gehen`, dazu `kadaver`
    in vier verschiedenen Stufen; alle anderen `gehen`, `angreifen`,
    `sterben`), verlangt genau 13 Einheiten.
  - **Rechenzeit, gemessen 21:25**: drei Blender nebeneinander lasten je
    1,5 bis 1,9 von 8 Kernen aus, die Maschine steht bei 100 %. Je Bild gut
    3 s, obwohl das Bild winzig ist — das Drumherum (stellen, Szene
    übergeben, schreiben, lesen) kostet, nicht die Strahlen. Die Arc 140V
    steht Cycles über oneAPI zur Verfügung, **nicht ausprobiert**. Für R6:
    messen, wo die 3 s bleiben.
  - **Nur noch ein Renderprozess** (Benutzer, 2026-11-11 abends: „kannst du
    bitte auf einen render prozess reduzieren"): seitdem läuft immer nur ein
    Blender, auch für Proben. Einmal lief es dagegen — die Miliz renderte von
    22:48 bis 23:14 neben dem Armbrustschützen, weil eine Warteschleife auf
    eine Datumszeile wartete, die schon in der Ausgabe stand. Beim Verketten
    auf eine **eindeutige Marke** warten. Nach `TaskStop` laufen Blender
    weiter: mit `Get-CimInstance Win32_Process` suchen, mit `taskkill /T`
    beenden.
  - **Stand 2026-11-12, 01:00: alles einmal voll gerendert.** Zeiten je
    Einheit allein: Plänkler 843 s, Mönch 846 s (je 200 Bilder, 4,2 s je
    Bild), Mangonel 788 s, Späherreiter 798 s, Marktkarren 986 s (136
    Bilder), Dorfbewohner 1020 s (488 Bilder, 2,1 s je Bild), Ritter 1351 s,
    Ramme 1402 s; zu zweit nebeneinander Soldat 1489 s, Miliz 1561 s,
    Armbrustschütze 1511 s, Bogenschütze 1862 s, Speerkämpfer 2018 s —
    zwei Prozesse bringen 20 bis 35 %, nicht das Doppelte. Mit `knapp`
    entpackt je Tafel: Fußvolk 6 bis 10 MB, Späherreiter 12,9 / 12,4 / 12,6
    (vorher 19,9 / 17,7 / 17,7), Ritter 20,8 / 20,0 / 21,7 (vorher 30,8 /
    27,4 / 27,4), Ramme 19,1 / 17,8 / 17,7, Mangonel 10,8 / 12,0 / 9,6,
    Marktkarren 22,7 / 20,1, Dorfbewohner 5 bis 7,5 je Tafel (sieben Tafeln).
  - **Der Browsertest AC-24 lief zum ersten Mal (01:05) und fand echte
    Mängel** — an fast jeder Einheit:
    1. **Doppelte Bilder.** Beim Sterben lag die Figur in den letzten zwei
       Bildern schon still (der Fall endete bei t = 0,8), der Axthieb des
       Dorfbewohners, der Anschlag des Armbrustschützen und der gespannte Arm
       des Mangonels standen zwei bis vier Bilder lang. Ein Bild, das doppelt
       auf der Tafel steht, kostet Speicher und zeigt nichts. Geändert: der
       Fall reicht in jedem Modell bis zum letzten Bild (das Spielbild spielt
       ihn weiter in `STERBEN_MS` = 850 ms ab und lässt das letzte Bild
       liegen); `NACHGESETZT` nach dem Hieb; die Armbrust hebt, legt an,
       schießt, setzt ab; der Mangonel ist ein Kreis ohne Stillstand (winden,
       laden, werfen, winden).
    2. **Der Mönch ging, ohne dass man es sah**: unter der Kutte sind der
       linke und der rechte Schritt dasselbe Bild (10 Bildpunkte Unterschied).
       Jetzt setzt er den Stab einmal je Doppelschritt vor (`'stab'` in
       `ARTEN`). Sein Heilen war hin und zurück derselbe Weg — vier Stationen
       statt zwei.
    3. **Zu viel Spielerfarbe** (darstellung AC-21, Grenze ein Drittel):
       Dorfbewohner 0,355 von hinten (Kragen der Gugel gekürzt), Marktkarren
       0,341 (Plane kürzer und schmaler), Mönch 0,33 (Skapulier schmaler).
    4. **Die Ramme sah von links aus wie von rechts** (ähnlichstes Paar der
       Blickrichtungen 0,05, verlangt 0,1): das Tuch liegt jetzt über der
       vorderen Hälfte und hängt im vorderen Giebel.
  - **Am Test geändert, weil die Messung nicht passte, nicht das Bild:**
    „keine zwei Bilder eines Ablaufs gleich" misst jetzt **mindestens 60
    Bildpunkte** statt 2 % des Körpers — 60 sind 2 % eines Fußkämpfers, und
    an einer Ramme bewegt sich mit Rädern und Bock ein kleiner Teil eines
    großen Bildes (Gehen 271, Stoßen 160 Bildpunkte; ein doppeltes Bild misst
    0). Was Räder hat, legt sich nicht hin: Ramme, Mangonel und Marktkarren
    müssen am Ende zu mehr als einem Viertel ein anderes Bild sein statt 20
    Bildpunkte niedriger. Der Marktkarren wird mitgemessen (14 Einheiten),
    und der Test prüft weich (`expect.soft`), damit ein Lauf jede Einheit
    nennt und nicht nur die erste.
  - **Stand 2026-11-12, 01:22**: Proben der geänderten Modelle angesehen und
    gut (Mönch setzt den Stab, Mangonel windet, Ramme zeigt mit dem Tuch nach
    vorn, Dorfbewohner 0,20–0,29 Spielerfarbe nach `schau.py` statt
    0,29–0,37). Der Marktkarren und die fünf übrigen Fußkämpfer gingen ohne
    Probe in den vollen Render.
  - **Neu gerendert in einer Reihe, ein Prozess, 01:23 bis 03:50** (2 h
    27 min für elf Einheiten): Dorfbewohner 1138 s, Mönch 617 s,
    Armbrustschütze 619 s, Ramme 1105 s, Mangonel 670 s, Marktkarren 829 s,
    Miliz 742 s, Soldat 863 s, Speerkämpfer 831 s, Bogenschütze 759 s,
    Plänkler 616 s. Allein rendert ein Fußkämpfer also in 10 bis 14 Minuten;
    die 25 bis 34 Minuten vom Abend waren die zwei Prozesse nebeneinander.
  - **Der Test AC-24 ist für alle 14 Einheiten grün** (03:51, mit
    Bildnachweis). Gemessen, je Einheit das ähnlichste Paar der acht
    Blickrichtungen (verlangt > 0,1), das ähnlichste Bildpaar je Ablauf in
    Bildpunkten (verlangt ≥ 60) und die Spielerfarbe (verlangt 0,04 bis 1/3):

    | Einheit | Richtungen | Gehen | Angriff | Sterben | Spielerfarbe |
    | --- | --- | --- | --- | --- | --- |
    | Dorfbewohner | 0,20 | 492 | 451 (Arbeiten) | 907 | 0,18–0,28 |
    | Miliz | 0,44 | 528 | 332 | 1107 | 0,11–0,28 |
    | Soldat | 0,35 | 497 | 408 | 1042 | 0,10–0,26 |
    | Speerkämpfer | 0,46 | 499 | 135 | 1214 | 0,08–0,21 |
    | Bogenschütze | 0,27 | 527 | **79** | 1056 | 0,13–0,24 |
    | Plänkler | 0,41 | 505 | 586 | 1011 | 0,15–0,24 |
    | Armbrustschütze | 0,35 | 516 | 391 | 1082 | 0,12–0,22 |
    | Späherreiter | 0,61 | 917 | 481 | 347 | 0,14–0,24 |
    | Ritter | 0,70 | 798 | 813 | 458 | 0,14–0,21 |
    | Mönch | 0,29 | 372 | 591 | 1375 | 0,09–0,28 |
    | Ramme | 0,30 | 272 | 162 | 2359 | 0,15–0,25 |
    | Mangonel | 0,51 | 244 | 346 | 2132 | 0,20–0,26 |
    | Schaf | 0,51 | 174 | – | Kadaver 0,24 | 0,11–0,20 |
    | Marktkarren | 0,82 | 1563 | – | 341 | 0,17–**0,30** |

    Knapp sind zwei: der **Bogenschütze im Angriff** (79 Bildpunkte — zwei
    Bilder des gespannten Bogens sind sich sehr ähnlich, nicht gleich) und
    der **Marktkarren von der Seite** (0,30 Spielerfarbe bei Grenze 0,333).
    Der Dorfbewohner trägt in den vier Ladungen wenigstens 0,04 Unterschied
    (verlangt 0,02) — die Ladung ist klein am Körper.
  - **Im Spielbild gesehen** (`sicht --spiel --bilder --waehlen` mit zwölf
    Arten, Zoom 1 und 2): alle zwölf Einheiten der Daten stehen gerendert da,
    in richtiger Größe zueinander. **Nicht gesehen:** Kampf, Tragen, Kadaver
    und Sterben im Spielbild — `sicht` stellt nur hin, es lässt nichts
    kämpfen. Der **Marktkarren** steht auf diesem Zweig nicht in den Daten
    (D14 kam auf `strategie` danach) — er ist nur in der Bildprobe gesehen
    und gemessen, im Spiel erst nach dem Zusammenführen.
  - **Speicher, gemessen an den fertigen Tafeln**: die Farbtafeln aller
    Einheiten, Gelände und Vorräte sind entpackt **469 MB** (als Dateien
    20,2 MB, 115 Dateien), dazu dieselbe Fläche noch einmal als Masken. Je
    Einheit alle Abläufe zusammen: Fußkämpfer 21 bis 28 MB, Dorfbewohner 40
    (sieben Tafeln), Späherreiter 38, Marktkarren 43, Mangonel 33, Ramme 55,
    Ritter 63. Geladen wird je Ablauf erst, wenn er gebraucht wird — in
    einer Schlacht mit allen Arten ist das aber alles. **Das ist die Frage
    für R6, bevor umgeschaltet wird**: Masken kleiner ablegen (ein Kanal
    statt vier), Tafeln in halber Auflösung für Zoom 1, oder wieder
    freigeben, was eine Weile nicht gezeichnet wurde. Nicht gemessen ist,
    was der Browser davon wirklich hält.
  - In der Bildprobe stehen Ramme und Mangonel mit `zoom: 1.35`, `weit: 108`
    und `luft: 44` vor der Spielgröße — bei Zoom 2 liefen sie aus dem Band,
    und die Trümmer des letzten Sterbebilds lagen auf der Spielgröße.
  - **Committet als `b2145ea`** (2026-11-12, 04:25) auf `strategie-bildumbau`,
    nicht gepusht, nicht zusammengeführt. Davor grün: Browserlauf 210 von
    210 in 21,4 min, `npm run check` mit 680 + 8 Tests. darstellung AC-24
    steht auf `in-arbeit` — `offen` mit Bildnachweis lässt `specs:check`
    nicht durch, und `fertig` ist es nicht: die Zeichnungen stehen noch, die
    Bilder sind abgeschaltet, 50 Bilder je Sekunde mit gerenderten Einheiten
    und das Laden vor der Partie sind nicht gebaut. **Als Nächstes, mit dem
    Benutzer:** ansehen, dann zusammenführen nach `strategie` (dort kommt
    der Marktkarren in die Daten und ins Spielbild), dann R6.
- **`strategie` ist eingebunden** (2026-11-12, Commits `e2def68` und
  `81b5e0b`): die Runden 159 bis 189 liegen jetzt neben dem Bildumbau auf
  `strategie-bildumbau`. Von Hand zusammengeführt: `CLAUDE.md`, ADR-0012,
  `docs/adr/README.md`, der Fahrplan. Danach Browserlauf 226 von 226,
  `npm run check` grün. **Der Zweig `strategie` selbst ist nicht
  vorgespult** — er ist im Hauptbaum ausgecheckt, und dort arbeitet die
  Parallelschleife. Zusammengeführt wird dort, wenn sie ruht:
  `git merge strategie-bildumbau` im Hauptbaum (vorspulen geht nur, solange
  `strategie` nicht weitergelaufen ist).
  - **Zwei Fehler dabei, beide meine**: `git checkout strategie -- …` nahm
    den Zweig, wie er in dem Augenblick stand, nicht wie er beim
    Zusammenführen stand — die Schleife hatte inzwischen eine Runde
    weitergebaut. Immer einen festen Commit nennen. Und
    `pruefung | tail && git commit` committet auch nach einer gescheiterten
    Prüfung: `&&` hängt am Ende der Röhre, nicht an der Prüfung.
  - **Befund für die Schleife, hier nicht behoben:** schreibt ein Browserlauf
    alle Bilder neu, zeigen bauen AC-24, AC-27, AC-28, bedienung AC-07 und
    andere den Kartenrand statt der Gebäude. Ursache ist das Randschieben
    aus Runde 184 (der Mauszeiger des Tests steht am Bildrand), nicht der
    Bildumbau; die eingecheckten Bilder stammen aus Runde 169 und sind
    unverändert übernommen.
  - **Zwei Prüfläufe zugleich stören sich vermutlich**: die Tests ohne
    Browser nehmen feste Häfen (4193 bis 4199), der Hauptbaum und dieser
    Arbeitsbaum dieselben. Am 2026-11-12 hing `tests/konten.test.mjs` hier
    zwei Stunden ohne Ausgabe; allein läuft er in 2,5 s. Die Ursache ist
    nicht nachgestellt — dass nebenan die Schleife lief, ist die Vermutung.
    Deshalb `timeout 840 npm run check:kurz`: ein Lauf, der hängt, fällt
    dann auf, statt zwei Stunden zu kosten.
- **Der Betrieb ist vorgezogen** (2026-11-12, Commit `af28899` und
  Nachfolger): der Benutzer wollte den Stand auf dem VPS ansehen. Gebaut:
  `Dockerfile`, `betrieb/docker-compose.yml`, `npm run ausrollen`
  (`scripts/ausrollen.mjs`), `/betrieb/zahlen`, `OEFFENTLICHE_ADRESSE` und
  `KONTEN_DATEI` aus der Umgebung. Wie es gemacht ist, steht in
  [`betrieb/README.md`](../../betrieb/README.md); Rechner und Adresse
  stehen nur in `.env.betrieb` (nicht eingecheckt).
  - **Gemessen beim ersten Ausrollen:** 32 Sekunden vom Befehl bis „läuft",
    das Zertifikat kam rund zehn Sekunden danach (deshalb wartet der Blick
    von außen jetzt bis zu 90 s). Der Dienst nimmt im Leerlauf 70 MB. Nach
    einem abgeschossenen Prozess antwortet er nach 1,4 s wieder. Von außen:
    `http` wird nach `https` umgeleitet, `wss` steht, `/betrieb/zahlen` gibt
    404, eine fremde Herkunft wird beim Anmelden mit 403 abgewiesen.
  - **Nicht geprüft:** ein Neustart der Maschine (dort laufen andere
    Anwendungen, er wird nicht ausprobiert), das Warten auf leere Räume mit
    einer wirklich laufenden Partie, eine Registrierung auf dem Server.
  - **Stand der Kriterien:** betrieb AC-2 und AC-4 fertig; AC-1, AC-3, AC-6,
    AC-7 und fahrplan AC-21, AC-22 in QA; AC-8 in Arbeit (ausgelöste
    Grenzen fehlen). Bevor andere eingeladen werden: betrieb AC-5
    (Vorwarnung), AC-10 (Absturz einer Partie), AC-11 und AC-12 (Grenze
    gemessen).
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
grafik/baum.py          vier Arten, je vier Gestalten
grafik/beere.py · gold.py · stein.py   Vorräte in vier Füllstufen (fels.py: die Brocken)
grafik/boden.py         fünf Bodentexturen, die sich ohne Naht wiederholen
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

## R3: Gelände und Vorräte (2026-11-10)

darstellung AC-23 ist fertig. Im Spiel mit `?bilder=1` kommen Boden, Ufer,
Wald und alle drei Vorräte aus der Kette; gezeichnet bleiben bis R4 bis R6
die Gebäude außer dem Haus, die Figuren außer dem Dorfbewohner und die
Schafe.

**Die Modelle**

- **Vier Baumarten** (`baum.py`): Eiche, Birke, Fichte, Kiefer, je vier
  Gestalten — eine Zeile je Art. Welche Art auf einem Feld steht, entscheidet
  der Browser (der Server kennt nur „Baum"): `baumart()` in `gelaende.js`
  liest ein Rauschen über sieben Felder, so steht Laub bei Laub und Nadel bei
  Nadel. Gemessen auf 60 × 60 Feldern: 31 % Eiche, 14 % Birke, 36 % Fichte,
  19 % Kiefer; 86 % der Nachbarn sind beide Laub oder beide Nadel (gewürfelt
  wären es 50 %).
- **Beere, Gold, Stein** (`beere.py`, `gold.py`, `stein.py`, die Brocken aus
  `fels.py`): je drei Gestalten in **vier Füllstufen als Zeilen** — der
  Server kennt Viertel, die Tafel hat sie. Der halbleere Busch ist derselbe
  wie der volle, nur abgeerntet; vom Gestein fehlen Brocken.
- **Der Boden** (`boden.py`): fünf Texturen, die sich ohne Naht wiederholen —
  Gras, Erde, Waldboden, Sand, Wasser. Eine Kachel ist 1056 × 528 Bildpunkte,
  acht Felder. Halme, Kiesel und Laubstreu sind Geometrie, die am Rand
  wiederholt wird; das Rauschen der Stoffe läuft über einen Torus (vier
  Koordinaten aus Kosinus und Sinus der beiden Achsen), sonst hätte es am
  Rand einen Sprung.

**Im Browser** (`boden.js`, `kachelAusTexturen`): eine Bodenkachel entsteht
in Schichten. Jede Textur liegt als Muster fest an der Karte und wird mit
einer Maske aus der Karte beschnitten: Gras, darauf Waldboden, Erde, am Ufer
Sand, ein dunkler nasser Saum, flaches Wasser, das den Grund durchlässt,
tiefes, das ihn verdeckt. Hell und dunkel, saftig und trocken legt weiter
das Rauschen über die ganze Karte darüber — es nimmt das Gras mal.

**Gemessen**

| Tafel | Zellen | Zelle | Tafel (WebP) | Rechenzeit |
| --- | --- | --- | --- | --- |
| baum | 4 Arten × 4 Gestalten | 350 × 292 | 270 KB | 74 s |
| beere | 4 Stufen × 3 Gestalten | 220 × 150 | 49 KB | 18 s |
| gold | 4 Stufen × 3 Gestalten | 220 × 170 | 42 KB | 18 s |
| stein | 4 Stufen × 3 Gestalten | 220 × 170 | 38 KB | 20 s |
| boden | 5 Kacheln | 1056 × 528 und 16 Saum | 677 KB | 125 bis 242 s |

Alle Bilder zusammen 2366 KB (nach R2: 1361 KB).

| Was das Kriterium verlangt | gemessen (`strategie-bildprobe`) |
| --- | --- |
| mindestens vier Baumarten, die man auseinanderhält | das ähnlichste Paar unterscheidet sich in 85 % der Fläche; die Birke ist mehr als 1,3-mal so hell wie die Fichte |
| Beerenstrauch höchstens doppelt so hoch wie ein Schaf | 58 bis 63 Bildpunkte gegen 34 (Zoom 3) |
| Vorräte nicht greller als ihre Umgebung | Buntheit Beere 35, Gold 27, Stein 6 — das Gras hat 48 |
| Gold glänzt, ohne gelb zu leuchten | 4 % der Fläche sind warmes, helles Metall (Stein 0 %), kein Bildpunkt in Warnschild-Gelb |
| leert sich ein Vorrat, wird er kleiner | Fläche je Stufe: Beere 3252 > 2864 > 2456 > 2098, Gold 4286 > 3856 > 2927 > 2009, Stein 4740 > 4221 > 3240 > 2256 |
| der Boden ohne Naht | Rand gegen Rand 1,11- bis 1,33-mal so verschieden wie zwei Nachbarn — zwei Bildpunkte im Abstand 2 sind es 1,3- bis 1,6-mal |

**Eine Bodenkachel kostet mehr als gezeichnet** (Median über 24 Kacheln
einer dichten Probekarte, zweimal gemessen, Chromium ohne Fenster):

| Maßstab der Kachel | gezeichnet | aus Texturen, erster Wurf | aus Texturen, jetzt |
| --- | --- | --- | --- |
| 0,5 (Zoom unter 0,7) | 10 ms | 12 ms | 6 ms |
| 1 | 13 ms | 38 ms | 15 ms |
| 2 (Zoom über 1,45) | 22 bis 24 ms | 135 ms | 46 ms |

Drei Dinge haben es gebracht: Schichten, die in der Kachel nirgends liegen,
werden nicht gezeichnet; die Masken werden mit einfacher Glättung
vergrößert; und das Gras braucht mitten auf der Karte keine Maske. Im
größten Maßstab bleibt es doppelt so teuer wie gezeichnet — beim Wechsel
über Zoom 1,45 entstehen vier bis sechs Kacheln auf einmal. **Nicht
gemessen** ist dasselbe in einem Browser mit Fenster und Grafikkarte.

Die Bildrate ist davon unberührt (`strategie-tempo`, eine Messung):
60,1 Bilder je Sekunde bei 1,8 ms je Bild stehend, 59,5 bei 2,3 ms im Gehen.

Speicher, gerechnet aus den Leinwandgrößen: die entpackte Bodentafel
11,8 MB, die verkleinerten Texturen für alle drei Maßstäbe 6,5 MB
(`texturSpeicher()`).

**Fehler, die erst am Bild oder an der Messung auffielen**

- **Die Naht kam aus der Bildkodierung, nicht aus dem Render.** Die Kette maß
  vor dem Schreiben 0,87 bis 1,11; im Browser waren es bis 1,76. WebP glättet
  über die Grenze zur Nachbarkachel in der Tafel — die erste Zeile Sand trug
  einen Hauch Waldboden. Jede Kachel bekommt deshalb oben und unten einen
  Saum von 16 Bildpunkten aus ihrer eigenen Wiederholung (`Tafel(saum=…)`,
  in der Beschreibung `kachel` und `saum`). Links und rechts **bringt ein
  Saum nichts** — probiert, quer 1,10 bis 1,35 mit wie ohne. Der Rest steckt
  im Render: zwei Nachbarn teilen sich Proben des Bildfilters, das Paar über
  den Rand nicht.
- **`hard-light` nimmt nicht mal.** Der Ton des Grases lag erst als
  `hard-light` über allem: Erde wurde rosa, Waldboden violett, trockenes
  Gras grauviolett. Über 1 legt `hard-light` Licht dazu, unabhängig vom
  Grund. Jetzt liegt die Grastextur einmal aufgehellt vor (`color-dodge` mit
  s = 1 − 1/k ist mal k), und jede Kachel dunkelt mit `multiply` herunter —
  eine echte Malnahme je Kanal. Der Ton gilt dem Gras allein.
- **Der Waldboden zeichnete die Treppe der Felder nach.** Er wird jetzt
  gemittelt wie das Ufer und vom Rauschen verschoben.
- **Gezeichnete Wellenstriche auf gerendertem Wasser** sahen aus wie Kreide —
  mit Bodentextur entfallen sie.
- **Der Beerenstrauch war zu hoch** (68 bis 76 Bildpunkte gegen 34 beim
  Schaf); der Test, der vor dem ersten Lauf geschrieben war, fiel durch. Der
  volle Busch steht jetzt bei 85 %.
- **Der Stein war heller als alles um ihn** (hellster Bildpunkt 214, jetzt
  181) — nicht gemessen als Fehler, am Bild gesehen.
- **Die Zelle des Baums musste wachsen** (350 × 292): der Schatten der
  Fichte war am Rand abgeschnitten, die Kette hat es gemeldet (`RAND`).
- **`public/*.js` lädt Node in diesem Projekt nicht** (`"type": "commonjs"`
  im Paket): der Fall zur Baumart läuft deshalb im Browser, nicht in
  `tests/bilder.test.mjs`.

**Offen aus R3**

- **Die Kachelzeit im größten Maßstab** (46 ms) — siehe oben. Weiter ginge
  es mit einer Maske je Kachel statt je Schicht; nicht gebaut.
- **Wiederholung der Textur:** bei Zoom 0,6, 1 und 2 am Bild nicht zu sehen
  (Karte 4711, vier Stellen). Die Textur wiederholt sich alle acht Felder;
  auf einer großen, leeren Grasfläche ist es **nicht geprüft**.
- **Schafe, Dorfzentrum und alle übrigen Gebäude** stehen gezeichnet auf
  gerendertem Boden — das sieht man. R4 und R6.
- **Die Übersichtskarte** rechnet ihre Farben weiter aus `bodenAn`; sie ist
  etwas heller als der gerenderte Boden.
- **Das Gras ist dunkler als das gezeichnete** (Mittel der Textur 75/90/42,
  die gezeichnete Mitte 89/107/49). Gewollt gelassen, weil es zu den Bäumen
  passt; ob Gebäude und Figuren darauf richtig stehen, zeigt R4.
- **Ein Fall im ganzen Browserlauf gefallen, nicht erklärt** (208 von 209
  grün, 24 min): `bedienung AC-39` (`strategie-kampfbild`) — zwei
  Augenblicke desselben Gefechts waren Bildpunkt für Bildpunkt gleich, das
  Bild stand also eine Drittelsekunde still. Einzeln danach: erst 2 von 4
  gefallen (je 3,7 s statt 2,3 s), dann 4 von 4 und 10 von 10 grün; auf dem
  Stand von R2 dazwischen 6 von 6 grün. Der Fall schaltet die gerenderten
  Bilder nicht ein, und im gezeichneten Bild ändert R3 keine Zeile, die
  läuft. **Vermutet, nicht belegt:** Last auf dem Rechner (die Schleife auf
  `strategie` fährt ihre Browserläufe nebenher) — der Fall wartet 345 ms
  nach der Uhr und vergleicht dann. Fällt er wieder, zuerst dort nachsehen.

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

## Offen, wenn es weitergeht (R4 und danach)

- **Speicher bei vielen Einheiten** — siehe die Hochrechnung in R2. Vor R5
  entscheiden: eine Tafel je Ablauf, Laden nach Bedarf.
- **Der Server schickt keinen Cache-Kopf.** Jeder Seitenaufruf lädt die
  Tafeln neu. Heute 2,4 MB, mit allen Einheiten ein Vielfaches. Gehört zu
  Stufe G (Betrieb), braucht dann einen Dateinamen oder eine Marke, die sich
  mit dem Inhalt ändert.
- **Laden vor der Partie** (AC-24): heute zeichnet das Spiel, bis die Tafeln
  da sind, die alten Figuren.
- ~~Der Gefallene als gedrehtes Bild~~ — erledigt (2026-11-12): jede Einheit
  hat einen Sterbeablauf aus acht Bildern, das Spielbild spielt ihn in
  `STERBEN_MS` ab.
- ~~Wer arbeitet oder trägt, zeigt nur Stehen und Gehen~~ — erledigt: der
  Dorfbewohner hat `arbeiten` und vier Tafeln mit Ladung. **Offen daran:** er
  schwingt die Axt auch an Beeren und auf der Farm, und der Schlag einer
  Kampfeinheit läuft nach der Uhr des Browsers (`jetztPhase`), nicht nach dem
  Schlag des Servers — Treffer und Bild können eine halbe Sekunde auseinander
  liegen.
- **Speicher** (2026-11-12): 469 MB Farbtafeln entpackt und dieselbe Fläche
  als Masken, siehe „Wo es steht". Vor dem Umschalten entscheiden (R6).
- **Im Spielbild nicht gesehen**: Kampf, Tragen, Kadaver, Sterben mit
  gerenderten Bildern — nur in der Bildprobe. Und der Marktkarren gar nicht,
  solange dieser Zweig ihn nicht in den Daten hat.
- **Wo die 2 bis 4 s je Bild bleiben**, ist nicht gemessen; die Arc 140V
  (Cycles über oneAPI) nicht ausprobiert.
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
- **R3, Gelände und Vorräte** (2026-11-10, darstellung AC-23 fertig): siehe
  „R3: Gelände und Vorräte". **Erkenntnis:** gemessen wird am Bild, wie es
  im Browser ankommt, nicht an dem, was die Kette vor dem Schreiben über sich
  sagt — die Naht der Bodenkacheln entstand erst in der Bildkodierung, und
  die Kette hielt sie für sauber. Und: ein Test, der vor dem ersten Lauf
  geschrieben war, hat zwei Dinge gefangen, die am Bild niemand beanstandet
  hätte (Strauch zu hoch, Naht) — die Fehler, die er nicht fangen konnte
  (Rosa, Violett, Kreidestriche), fielen erst im Spielbild auf, nicht auf
  der Bildprobe. Beides ansehen, bevor etwas fertig heißt.
- **Zwei Sitzungen in einem Arbeitsbaum** (2026-11-09): während der
  Spec-Runde arbeitete die Schleife an spielziel AC-23 im selben Verzeichnis.
  Bemerkt erst an `git status`. Seitdem: Arbeit neben der Schleife bekommt
  ein eigenes Arbeitsverzeichnis (`git worktree add`), bevor die erste Datei
  geändert wird. Der Browserlauf dort braucht einen eigenen Hafen
  (`E2E_HAFEN=4391`).

## R4: Gebäude

Stand 2026-11-12, Zweig `strategie-gebaeude` (Arbeitsbaum `OnlineGames-gebaeude`).
**Alle neunzehn Arten aus `GEBAEUDE` haben eine gerenderte Tafel**, dazu vier
Baustellen-Tafeln. Eingebunden ins Spielbild ist davon nichts: `public/bilder.js`
kennt in `NAMEN` nur das Haus, und Baustelle, Farm, Tor und Mauer zeichnet
weiter `public/gebaeude.js`. Zu sehen sind die neuen Tafeln auf
`/bildprobe.html` (Abschnitte „Gebäude", „Mauer und Tor", „Baustellen") —
die Seite lädt sie dafür selbst.

### Was es gibt

Gemessen an den Dateien unter `public/bilder/` (KB), Zelle und Fuß in
Bildpunkten der Tafel:

| Tafel | Felder | Spalten × Zeilen | Zelle | Fuß | Bild | Maske | Schatten |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `dorfzentrum` | 4 | 1 × 1 | 675 × 523 | 283, 367 | 74,6 | 1,8 | – |
| `haus` | 2 | 1 × 1 | 400 × 330 | 170, 215 | 26,9 | 0,8 | – |
| `aussenposten` | 1 | 1 × 1 | 332 × 302 | 88, 245 | 22,6 | 1,0 | – |
| `muehle` | 2 | 1 × 1 | 325 × 291 | 109, 209 | 18,5 | 0,8 | – |
| `holzfaellerlager` | 2 | 1 × 1 | 375 × 261 | 131, 183 | 21,8 | 0,9 | – |
| `bergbaulager` | 2 | 1 × 1 | 299 × 231 | 127, 155 | 16,6 | 0,8 | – |
| `farm` | 3 | 1 × 4 | 402 × 246 | 190, 149 | 99,4 | 2,4 | – |
| `kaserne` | 3 | 1 × 1 | 540 × 454 | 216, 331 | 50,0 | 2,7 | – |
| `schiessanlage` | 3 | 1 × 1 | 470 × 277 | 180, 185 | 28,9 | 1,1 | – |
| `stall` | 3 | 1 × 1 | 412 × 321 | 201, 217 | 33,5 | 1,1 | – |
| `schmiede` | 3 | 1 × 1 | 434 × 344 | 179, 229 | 28,5 | 0,7 | – |
| `kloster` | 3 | 1 × 1 | 486 × 490 | 192, 369 | 40,6 | 1,3 | – |
| `universitaet` | 3 | 1 × 1 | 482 × 397 | 201, 279 | 38,8 | 1,6 | – |
| `belagerungswerkstatt` | 3 | 1 × 1 | 551 × 340 | 198, 224 | 39,6 | 1,1 | – |
| `wachturm` | 1 | 1 × 1 | 332 × 290 | 77, 233 | 18,2 | 1,1 | – |
| `tor` | 1 | 2 × 2 | 118 × 215 | 59, 185 | 34,2 | 1,6 | 15,7 |
| `steinmauer` | 1 | 13 × 1 | 138 × 160 | 69, 124 | 36,0 | 1,2 | 48,1 |
| `burg` | 4 | 1 × 1 | 665 × 518 | 275, 362 | 71,0 | 2,7 | – |
| `markt` | 4 | 1 × 1 | 584 × 382 | 253, 256 | 53,1 | 8,0 | – |
| `baustelle-1` | 1 | 4 × 1 | 217 × 179 | 75, 122 | 32,4 | 1,1 | – |
| `baustelle-2` | 2 | 4 × 1 | 332 × 239 | 138, 149 | 64,0 | 1,7 | – |
| `baustelle-3` | 3 | 4 × 1 | 482 × 318 | 206, 195 | 116,1 | 2,5 | – |
| `baustelle-4` | 4 | 4 × 1 | 640 × 396 | 283, 240 | 179,2 | 3,6 | – |

Zusammen 1250 KB. Das Haus stammt aus R1 und ist unverändert.

Commits: `160a22a` (Dorfzentrum, Mühle, Holzfällerlager, Bergbaulager, Farm),
`eb64718` (Kaserne, Schießanlage, Stall, Schmiede, Außenposten), `c3c7738`
(Markt, Kloster, Universität, Belagerungswerkstatt), `cf26053` (Wachturm,
Burg, Steinmauer, Tor); die Baustellen, die Bildprobe, die neu gerenderte
Kaserne und dieser Abschnitt stehen im Commit danach.

### Die Beschreibung neben der Tafel

Jede `<name>.json` hat die Felder des Hauses:

- `bild`, `maske` — Dateien in `public/bilder/`. Die Maske deckt, wo
  Spielerfarbe hingehört (heller unbunter Stoff, eingefärbt wie bei den Figuren:
  Maske, Farbe hinein, Bild malgenommen darüber).
- `zelle` `[Breite, Höhe]` — eine Zelle der Tafel; `zeilen`, `spalten`.
- `fuss` `[x, y]` — **die Mitte der Grundfläche am Boden**, in der Zelle. Das
  gilt für jede Größe, auch 1 × 1, auch für Mauerteile und Baustellen.
- `feldbreite` 132 — so breit ist die Raute eines Feldes in der Tafel. Der
  Maßstab im Spiel ist `2 · halbe Rautenbreite / 132`; bei Zoom 1,5 genau 0,5.
- `art: "gebaeude"`, `felder` — Kantenlänge der Grundfläche, gleich `groesse`
  in den Daten.

Die Zellen sind knapp geschnitten (wie bei den Figuren seit R2): `zelle` und
`fuss` sind je Tafel verschieden, niemand darf sie raten. Der Schlagschatten
liegt im Bild, mit 0,6 gedämpft, nach rechts hinten — er ragt über die
Grundfläche hinaus (bei der Burg bis 390 Bildpunkte rechts vom Fuß, 126 mehr
als die Raute).

Dazu je nach Art:

- **`farm`**: `stufen: 4` als **Zeilen** — Zeile 0 voll bestellt, Zeile 3
  abgeerntet; gedacht als `zeile = min(3, floor((1 − rest) · 4))`.
  `flach: true`: nichts steht darauf, Einheiten gehören immer darüber.
- **`baustelle-1` … `baustelle-4`** (nach Kantenlänge): `stufen: 4` als
  **Spalten** — 0 abgesteckt, 1 Fundament und Ständer, 2 Gebälk und halbe
  Wände, 3 Wände und offene Sparren; gedacht als
  `spalte = min(3, floor(bau · 4))`. Die Baustelle ist für alle Gebäude einer
  Größe dieselbe, auch für Mauer, Tor und Turm (1 × 1).
- **`tor`**: Zeilen sind `ausrichtungen` (`"x"`: die Mauer läuft längs x des
  Spiels, die Durchfahrt längs y; `"y"` umgekehrt), Spalten sind `zustaende`
  (`"zu"`, `"offen"`). Welche Ausrichtung ein Tor hat, steht nicht in der
  Tafel — das muss das Spielbild aus den Nachbarn lesen (Mauer oder Tor links
  und rechts längs x → `"x"`).
- **`steinmauer`**: `teile` nennt die Spalten — `pfeiler` (0), `arme` (acht,
  je `dx`, `dy`, `spalte`) und `laeufe` (vier, je `dx`, `dy`, `spalte`; ein
  Lauf geht zu `(dx, dy)` und zum Nachbarn gegenüber).
- **`steinmauer` und `tor`**: der Schlagschatten steht nicht im Bild, sondern
  in einer eigenen Tafel — `ablaeufe.schatten` mit `bild`, eigener `zelle` und
  eigenem `fuss`, dieselben Spalten (beim Tor eine Spalte je Zeile: der
  Schatten ist zu und offen derselbe). Er ist voll gedeckt geschrieben;
  `schattenDeckung` (0,6) sagt, wie stark er stehen soll. Der Weg über
  `ablaeufe` ist gewählt, weil die Verzeichnisprüfung so ohne Änderung auch
  die dritte Datei kennt.

### Die Mauer zusammensetzen

So macht es die Bildprobe (das Skript unten in `public/bildprobe.html` ist die
Regel als Code):

1. **Nachbarn** eines Mauerfeldes sind die Felder ringsum, auf denen Mauer oder
   Tor steht. Ein Tor zählt nur längs seiner Achse. Ein schräger Nachbar zählt
   nur, wenn keines der zwei Felder dazwischen Mauer oder Tor ist — sonst
   entstünde an jeder Ecke ein dritter Arm.
2. Genau zwei Nachbarn, die sich gegenüberliegen: **ein Lauf**, sonst nichts.
3. Sonst: **der Pfeiler, danach ein Arm je Nachbar**, in beliebiger Folge. Die
   Arme sind mit dem Pfeiler als Aussparung gerendert — wo er sie verdeckt,
   haben sie ein Loch. Deshalb braucht es innerhalb des Feldes keine
   Tiefensortierung.
4. **Schatten zuerst, in eine eigene Schicht**: alle Schattenzellen aller
   Mauer- und Torfelder auf eine leere Leinwand, diese einmal mit
   `schattenDeckung` auflegen, dann die Körper von hinten nach vorn. Einzeln
   mit 0,6 gezeichnet würde es doppelt dunkel, wo sich zwei Schatten decken.
   Liegt der Schatten nicht unter allen Körpern, fällt er auf die Mauer
   dahinter.

Arme und Läufe enden an der Feldgrenze stumpf und passen dort aneinander; die
Zinnen stehen in einem Takt, der an der Grenze aufgeht. Das Torhaus füllt sein
Feld längs der Mauer ganz.

### Was an der Kette geändert ist

- `scripts/bilder.mjs`: Blender läuft mit `-t 4`; `BILDER_KERNE` ändert das.
- `grafik/kette.py`: `BILDER_PROBEN` (Vorgabe 96) für schnelle Vorschauen;
  `Tafel.bild(…, schatten='mit' | 'ohne' | 'nur')` — `'ohne'` nur der Körper,
  `'nur'` nur der Schlagschatten, voll gedeckt; eine Maske je Raster nur, wenn
  eines seiner Bilder eine hat. Die Vorgabe ist das bisherige Verhalten;
  **keine der Tafeln aus R1 bis R3 ist neu gerendert oder betroffen.**
- `grafik/stoffe.py`: neu `gefugt()` (Mauerwerk, Ziegel, Schindeln aus der
  Brick-Textur) und `glut()`. Bestehende Stoffe unverändert.
- `grafik/bauteile.py` (neu): woraus die Gebäude gesetzt sind — Palette
  `stoffe()`, Wände, Dächer in Lagen, Zinnen, Fahnen, Banner, Wimpel, Fässer,
  Stapel, Zäune; `einzeltafel()` und `reihentafel()`; `kasten()`,
  `aussparen()`.
- `formen.py`, `haus.py` und alle Figuren: unverändert.

### Gemessen

96 Proben, vier Threads, je Tafel einmal gerendert, **neben anderen
Sitzungen auf demselben Rechner** — die Zeiten schwanken mit deren Last
(der Wachturm brauchte als Vorschau mit 24 Proben 13 s, voll 129 s; nur ein
Teil davon ist die Güte):

| Tafel | Sekunden |
| --- | --- |
| Dorfzentrum | 75,8 |
| Mühle | 24,8 |
| Holzfällerlager | 16,1 |
| Bergbaulager | 15,1 |
| Farm (4 Bilder) | 82,8 |
| Kaserne | 82,6 (neu nach der Korrektur an `zinnen()`: 57,2) |
| Schießanlage | 52,8 |
| Stall | 45,3 |
| Schmiede | 32,8 |
| Außenposten | 12,7 |
| Markt | 28,8 |
| Kloster | 44,6 |
| Universität | 34,4 |
| Belagerungswerkstatt | 64,3 |
| Wachturm | 129,2 |
| Burg | 84,1 |
| Steinmauer (26 Bilder) | 145,3 |
| Tor (6 Bilder) | 45,1 |
| Baustelle 1 × 1 (4 Bilder) | 26,5 |
| Baustelle 2 × 2 (4 Bilder) | 56,5 |
| Baustelle 3 × 3 (4 Bilder) | 97,3 |
| Baustelle 4 × 4 (4 Bilder) | 173,7 |

### Gelernt

- **Deckungsgleiche Flächen rendert Cycles nach Laune schwarz.** Zwei Kästen,
  deren Deckflächen auf derselben Höhe liegen, oder zwei Eckzinnen, die
  ineinanderstecken: mal sauber, mal ein schwarzer Fleck — am Wachturm nichts,
  am Bergfried mit demselben Aufruf drei schwarze Ecken. Die Schwarz-Grenze
  der Kette (2 %) hat es beim Mauerpfeiler und beim Tor gefangen, bei der
  Burg nicht (unter 2 %); dort hat es nur das Ansehen der Vorschau gefunden.
  Seitdem: was aufeinandersteht, endet unter dem, was darauf liegt.
- **Ein offenes Profil ist ein Loch.** Die runde Brustwehr war ein
  Drehkörper ohne Innenwand; von oben sah man hinein, als schwarzen Ring.
- **Teile, die aneinandergesetzt werden, brauchen den Schatten getrennt** —
  und das Verdecken untereinander schon im Bild (Aussparung), sonst braucht
  das Spiel eine Tiefensortierung innerhalb eines Feldes.

### Nicht geprüft

- **Im Spielbild steht keines der Gebäude.** Ob Größe und Fußpunkt neben
  Einheiten, Bäumen und dem Raster des Spiels stimmen, ist nur an der
  Bildprobe und an den Vorschauen der Kette gesehen (Grundfläche gefüllt,
  nichts ragt mit dem Körper darüber hinaus — Dachüberstände, Fahnen und der
  Kran der Belagerungswerkstatt ausgenommen), nicht in einer Partie.
- **Kein Test ist gelaufen** außer `node scripts/bilder-verzeichnis.mjs`
  (Exit 0). `npm run check`, `npm test` und der Browserlauf waren dieser
  Sitzung untersagt (Häfen). Insbesondere: `tests/bilder.test.mjs` und
  `e2e/tests/strategie-bildprobe.spec.mjs` sind gegen die neuen Tafeln und die
  längere Bildprobe nicht gelaufen. Die neuen Abschnitte der Bildprobe laden
  nach `window.bildprobe.fertig`; sie melden sich mit
  `document.body.dataset.gebaeude` (`fertig` oder `fehler`).
- **Die Mauer ist nur an einer Probekarte gesehen** (gerade, schräg, Ecke,
  Kreuz, T, zwei Tore). Nicht gesehen: Mauer neben einem Gebäude, eine Einheit
  hinter und vor einer Mauer, ein Tor ohne Mauer daneben.
- **Zerstörte oder brennende Gebäude gibt es nicht**, ebenso keine Stufen je
  Zeitalter und keine Unterschiede je Haus.
- **Speicher und Bildrate** mit allen Tafeln zugleich sind nicht gemessen.
- **Die Renderzeiten** sind je einmal und unter fremder Last gemessen.

### Was noch nicht gefällt

- **Neben den Zeichnungen wirken die gerenderten Gebäude kleiner.** Sie bleiben
  mit Hof und Beiwerk in ihrer Grundfläche, die Zeichnungen füllen die Raute
  mit dem Baukörper und ragen darüber. Am deutlichsten bei Mühle,
  Bergbaulager, Schmiede und Stall. Ob das im Spielbild stört, zeigt erst das
  Einbinden; größer bauen hieße, Dach und Wände über die Grundfläche zu
  ziehen.
- **Die Mühle** ist ein runder Turm mit kurzen Flügeln — in Spielgröße sind
  die Flügel das Erste, was verschwindet.
- **Der Stall**: das offene Tor ist eine glatte schwarze Fläche.
- **Die Mauer läuft schräg auf die Kamera zu** (Nachbar bei +1, +1) als
  schmaler Streifen, an dem man fast nur die Krone sieht — richtig gerechnet,
  aber unruhig. Und an einer Ecke, deren Arme beide zur Kamera zeigen, bleibt
  vom Pfeiler nur die Krone.
- **Die Baustelle ist immer ein Holzbau**, auch unter Mauer, Tor, Turm und
  Burg; der Wimpel steht ab Stufe 2 vor der Wand statt frei.
- **Offen und zu unterscheiden sich am Tor nur im Bogen** (dunkle Durchfahrt
  statt Torblatt); das hochgezogene Gitter sieht man in Spielgröße nicht.

### Offen

- Die drei zusätzlichen Dorfbewohner-Tafeln (Feld, Pflücken, Bergbau) sind
  **nicht gebaut**.
- Die Tafel der Kaserne ist nach der Korrektur an `zinnen()` neu gerendert
  (am Eckturm standen drei Eckzinnen schwarz). Die übrigen Tafeln aus den
  Gruppen 1 bis 3 benutzen `zinnen()` nicht.
