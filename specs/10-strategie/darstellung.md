# Darstellung

**Bereich:** Strategie
**Kuerzel:** darstellung
**Stand:** 27/33 fertig · 1 in Arbeit · 1 in QA · 4 offen

## Zweck

Wie das Spiel aussieht. Das Ziel ist ein Bild, bei dem jemand, der Age of
Empires II kennt, sofort weiß, was er vor sich hat — **ohne** Grafik, Klänge
oder Oberfläche des Originals zu verwenden
([ADR-0012](../../docs/adr/0012-aoe2-als-vorlage.md), Punkt 4).

Bis Runde 158 wurde alles in Code gezeichnet: Formen, Verläufe, Schattierung.
Seit [ADR-0016](../../docs/adr/0016-gerenderte-bilder.md) entstehen Einheiten,
Gebäude, Vorräte und Bäume als **eigene 3D-Modelle**, die vor dem Spiel zu
Bildern gerendert werden — Art für Art, hinter derselben Stelle im Code; was
noch kein gerendertes Bild hat, wird weiter gezeichnet. Keine Bilddateien aus
fremder Quelle.

## Abgrenzung

| Gehoert dazu                               | Gehoert nicht dazu |
| ------------------------------------------ | ------------------ |
| Blickwinkel, Gelände, Gebäude, Einheiten   | was ein Klick tut → [Bedienung](bedienung.md) |
| Reihenfolge, Auswahl, Balken               | was der Server schickt → [Übertragung](../00-plattform/uebertragung.md) |
| Bildrate im Browser                        | Rechenzeit auf dem Server → [Fahrplan](fahrplan.md) AC-6 |

## Abnahmekriterien

### Blick und Gelände (Stufe A)

- **AC-1** `fertig` **Isometrischer Blick** — Die Karte liegt als Raute: ein Feld ist doppelt so
  breit wie hoch. Rahmen, Klick und Rechtsklick treffen im neuen Blick
  dieselben Felder wie vorher (die Umrechnung ist geprüft, nicht geschätzt).
- **AC-2** `fertig` **Gelände lebt** — Gras ist nicht einfarbig: leichte Tönung je Feld aus dem
  Startwert, weiche Kanten zu Wasser. Wasser ist als Wasser erkennbar.
- **AC-3** `fertig` **Bäume, Sträucher, Felsen** — Ein Baum hat Stamm und Krone, ein
  Beerenstrauch rote Punkte, Gold glänzt gelb, Stein ist grau und kantig.
  Leert sich ein Vorrat, wird er sichtbar kleiner (ein Baum liegt
  stattdessen, AC-31). **Gemessen seit dem
  Bildumbau am Farbton** statt am Farbwert (ein gerendertes Bild hat Licht
  und Schatten): Wald 86 % grün, Stein 100 % grau, Beere 74 % grün und
  11,6 % rot, Gold 79 % Ocker bis Gelb, davon 5,7 % helles Gold — und 20 %
  grauer Fels, wie AC-23 es will („ohne gelb zu leuchten"). Die alte Grenze
  „im Gold höchstens 2 % Grau" beschrieb den gezeichneten Goldhaufen; an
  ihrer Stelle steht: der Stein trägt keinen Goldton, helles Gold hat nur das
  Gold, und je zwei Vorräte unterscheiden sich nach dem Maß aus AC-14 auf
  mindestens einem Drittel der Fläche (Gold gegen Stein 0,70).

### Gebäude und Einheiten (Stufe A)

- **AC-4** `fertig` **Gebäude haben Körper** — Jedes Gebäude hat Grundfläche, Wände und Dach mit
  Licht von links oben. Die Spielerfarbe steht an einer festen Stelle (Banner,
  Dachkante), nicht als ganze Fläche.
- **AC-5** `fertig` **Baustelle sichtbar** — Eine Baustelle zeigt Gerüst und Fundament und
  wächst mit dem Fortschritt.
- **AC-6** `in-qa` **Einheiten sind Figuren** — Dorfbewohner, Miliz und Späherreiter sind an der
  Gestalt zu unterscheiden (Werkzeug, Schwert und Schild, Pferd), mit
  Spielerfarbe am Körper. Ein Dorfbewohner zeigt, was er trägt. **Seit dem
  Bildumbau nicht mehr ganz belegt** (2026-11-13): gerendert decken sich
  Dorfbewohner und Miliz zu 0,793, die Grenze ist 0,75 — beide stehen auf
  demselben Körper, Schwert und Schild liegen vor dem Rumpf. Alles andere
  hält (gegen den Späherreiter 0,287 und 0,295; Spielerfarbe 0,155 bis
  0,207; mit Holz 0,74, mit Nahrung 0,77). Der Test zu dem einen Paar steht
  als erwartet rot; die Abhilfe ist am Modell, zusammen mit
  [Bedienung](bedienung.md) AC-36.
- **AC-7** `fertig` **Vorn verdeckt hinten** — Was weiter unten im Bild steht, wird später
  gezeichnet. Eine Einheit hinter einem Haus ist verdeckt; eine ausgewählte
  bleibt als Umriss erkennbar.
- **AC-8** `fertig` **Auswahl und Leben am Boden** — Ausgewähltes trägt eine Ellipse am Boden,
  darüber einen Lebensbalken. Gebäude zeigen ihren Balken, wenn sie
  ausgewählt oder beschädigt sind.

### Nebel (Stufe C)

- **AC-15** `fertig` **Nebel in drei Stufen** — Das Bild unterscheidet drei
  Zustände: **nie gesehen** (schwarz, nichts darin), **gesehen, aber jetzt
  unbeobachtet** (gedämpft, mit erinnertem Gelände und erinnerten Gebäuden,
  ohne fremde Einheiten) und **beobachtet** (voll). Die Übersichtskarte zeigt
  dieselben drei Zustände. Bildnachweis: ein Spielbild mit allen drei
  nebeneinander (→ [Kampf](kampf.md) AC-11, AC-12).

### Prüfbar machen

- **AC-9** `fertig` **Eine Schautafel** — Eine Seite zeigt jedes Gebäude und jede Einheit der
  aktuellen Stufe nebeneinander, in zwei Spielerfarben, mit Namen darunter.
  Sie ist der Bildnachweis zu [Fahrplan](fahrplan.md) AC-7 und wird mit jeder
  Stufe länger.
- **AC-10** `fertig` **Flüssig im Browser** — Mit 100 Einheiten und 30 Gebäuden im Bild zeichnet
  der Browser im Browserlauf mindestens 50 Bilder je Sekunde.
- **AC-11** `offen` **Nur eigenes Material** — Kein Bild, kein Klang, keine Schrift aus dem
  Original; kein „Age of Empires" im Spiel. Geprüft: `public/` enthält keine
  Rastergrafik außer selbst erzeugten, und die Oberfläche nennt die Marke nicht.
- **AC-12** `fertig` **Gezeichnet statt flach** — Wunsch des Benutzers (Runde 26):
  „je gezeichneter es wirkt, umso besser". Jede Figur, jedes Gebäude und jeder
  Vorrat hat Licht und Schatten in mindestens drei Tonstufen je Hauptfläche,
  eine Oberfläche (Holzmaserung, Dachziegel oder Stroh, Wolle, Blattwerk,
  Steinfugen) und Konturen, die nicht überall gleich dick sind. Das Gras hat
  Büschel statt nur Tönung. Geprüft bei Zoom 1 im Spielbild und auf der
  Schautafel, mit einem Vorher-Nachher-Bild. **Seit dem Bildumbau** ist
  nichts mehr gezeichnet: Licht, Schatten und Oberfläche kommen aus dem
  Rendern, Konturen gibt es keine. Gemessen bleiben die Tonstufen, an den
  gerenderten Bildern: Figuren 18 bis 37, Gebäude 17 bis 32, Vorräte 17 bis
  25 (Schwellen unverändert 20, 19 und 12 für die geprüften Stücke).
- **AC-13** `fertig` **Naturalistisch statt Comic** — Wunsch des Benutzers (Runde 35),
  mit einem Bild des Originals als Maßstab für die Anmutung, nicht als Vorlage
  zum Abzeichnen. Messbar: (1) keine schwarzen Umrisse — in keiner Figur und
  keinem Gebäude ist mehr als ein Viertel des **Randes der Gestalt** fast
  schwarz (bis zum Bildumbau: höchstens 3 % aller Bildpunkte; das traf an
  einer Zeichnung den Umriss, an einem gerenderten Bild die tiefen Schatten
  — die offene Werkstatt hat 12,7 %, und keinen Umriss. Am Rand gemessen: 0
  bis 9 %, ein gezeichneter Umriss läge bei 100 %); (2) gedämpfte,
  erdige Farben — Gebäude und Vorräte im Mittel weniger gesättigt als vor
  A6c, der Boden im Farbton zwischen Braun und Oliv (25° bis 100°) statt
  Grün; die Spielerfarbe bleibt kräftig, damit man Besitz erkennt. (Bis Runde
  39 hieß es „mittlere Sättigung des Spielbilds unter der heutigen" — das
  maß das Falsche: erdiges Oliv hat in HSL mehr Sättigung als das frühere
  graublaue Grün, 0,32 gegen 0,25, sieht aber natürlicher aus.);
  (3) Proportionen statt Kindchenschema — der Kopf höchstens ein Sechstel der
  Figur, ein Dorfbewohner bei Zoom 1 höchstens halb so hoch wie ein Haus
  (gerendert: Gesicht 20 von 166 Zeilen, Dorfbewohner 32 und Haus 87
  Bildpunkte; das Gesicht wird an der Hautfarbe erkannt, eine Zeichnung ließ
  sich dafür umfärben);
  (4) der Boden zeigt kein Rautenraster, sondern Gras, Erde und Flecken, die
  über Feldgrenzen hinweglaufen; (5) Gebäude und Bäume werfen Schlagschatten
  in eine Richtung (gezählt neben der Grundfläche, seit dem Bildumbau
  außerhalb der Raute statt jenseits ihrer rechten Ecke: der gerenderte
  Schatten eines niedrigen Baus erreicht die Ecke nicht). Vorher-Nachher-Bild
  bei Zoom 1.
- **AC-14** `fertig` **Alles auf einen Blick unterscheidbar** — Wunsch des Benutzers
  (Runde 35). Je zwei Einheiten und je zwei Gebäude unterscheiden sich auf der
  Schautafel in mindestens einem Drittel ihrer Fläche (Umriss oder Farbe); bei
  Zoom 1 im Spielbild trägt jedes Gebäude ein eigenes Merkmal, das man ohne
  Auswahl erkennt (Flügel, Stapel, Karre, Zinnen, Acker, Stroh, Fahne; ab der
  Feudalzeit Zielscheibe, Koppel, Schornstein). Gilt für jede Stufe neu: ein
  neues Gebäude wird gegen alle vorhandenen gemessen.
- **AC-16** `fertig` **Spielgröße wie im Original** — Zum Start der Partie
  ist ein Dorfbewohner mindestens 40 Bildpunkte hoch; im Original sind es
  rund 45 bei 1080 Zeilen, ein Feld ist dort 96 Bildpunkte breit. Bis Runde 99
  begann jede Partie bei Zoom 1 — ein Feld 44 breit, ein Dorfbewohner 28,6 hoch,
  das ganze Bild kaum halb so groß, die Figuren Striche (Rückschau nach Runde
  88). Jetzt beginnt sie bei Zoom 1,5 (42,9 Bildpunkte). Zoom 1 bleibt der
  feste Maßstab, an dem AC-13, AC-14 und [Bedienung](bedienung.md) AC-36
  gemessen werden — wer dort besteht, besteht beim Start erst recht. Das Rad
  holt weiter bis 0,4 heraus.

### Gerenderte Bilder (Bildumbau, ADR-0016)

Wunsch des Benutzers vom 2026-11-09: „viel detaillierter, bildlicher … und
nicht so kindlich gemalt". Die Bauabfolge R1 bis R6 steht im
[Fahrplan](fahrplan.md).

- **AC-17** `fertig` **Probe: drei gerenderte Stücke** — Ein Dorfbewohner, ein
  Haus und ein Laubbaum laufen einmal durch die ganze Kette: Modell als
  Skript unter `grafik/`, mit Blender ohne Oberfläche gerendert, als Bild
  unter `public/bilder/`, im Browser gezeichnet. Die Seite `/bildprobe.html`
  zeigt jedes der drei **neben seinem gezeichneten Vorgänger**, groß und in
  Spielgröße, in zwei Spielerfarben, dazu beides als kleine Szene; der
  Dorfbewohner steht in acht Blickrichtungen und geht. (Eine eigene Seite
  statt der Schautafel: an deren Aufteilung hängen die Messungen zu AC-12
  bis AC-14.) Im Spielbild sind die gerenderten Stücke abgeschaltet, bis der
  Benutzer entschieden hat; `?bilder=1` in der Adresse schaltet sie ein. Das
  Bild ist die Vorlage für diese Entscheidung — mehr belegt es nicht.
  Gemessen wird dabei die Größe der Bilddateien
  ([Stand des Umbaus](../../docs/strategie/bildumbau.md)).
- **AC-18** `fertig` **Bilder aus eigenen Skripten** — Zu jeder Rastergrafik
  unter `public/bilder/` steht im Verzeichnis der Kette
  (`grafik/verzeichnis.json`), welches Skript sie erzeugt; `npm run bilder`
  schreibt sie neu und rendert genau das, was dort steht. `npm run check`
  läuft ohne Blender und beanstandet ein Bild ohne Eintrag ebenso wie einen
  Eintrag ohne Bild. Fremdes Material steht mit Herkunft und Lizenz (nur CC0)
  in `grafik/QUELLEN.md`; eine Datei unter `grafik/`, die kein eigenes Skript
  ist und dort fehlt, wird beanstandet. Die Tafeln liegen als WebP vor
  (gemessen: ein Drittel der Größe von PNG, am Bild nicht zu unterscheiden).
  Löst den prüfbaren Teil von AC-11 ein.
- **AC-19** `offen` **Acht Blickrichtungen** — Eine Einheit schaut dorthin,
  wohin sie geht oder schlägt, in acht Richtungen statt zwei. Wer steht,
  behält die letzte. Geprüft: acht Marschziele rund um eine Einheit ergeben
  acht verschiedene Bilder.
- **AC-20** `offen` **Bewegung statt Verschieben** — Gehen, Arbeiten
  (Hacken, Bauen, Sammeln), Angreifen und Sterben sind Abläufe aus mindestens
  acht Bildern je Richtung; ein Dorfbewohner trägt sichtbar, was er geladen
  hat. Der Ablauf hängt an dem, was die Einheit tut, nicht an der Uhr allein:
  der Schlag fällt im Bild, wenn der Server ihn rechnet (→
  [Bedienung](bedienung.md) AC-39).
- **AC-21** `offen` **Spielerfarbe als Akzent** — Die Farbe des Spielers steht
  an festen Stücken (Wappenrock, Schild, Fahne, Dachkante), als Maske über
  einem Bild für alle Farben. Sie bedeckt bei keiner Einheit mehr als ein
  Drittel der Figur und bei keiner weniger, als man bei Zoom 1 erkennt — die
  untere Grenze misst die Runde, bevor sie dasteht ([Bedienung](bedienung.md)
  AC-36 gilt weiter).
- **AC-22** `fertig` **Gebäude gerendert** — Jedes Gebäude der Daten samt
  Baustelle in ihren Stufen kommt aus der Kette, mit Material (Holz, Putz,
  Stein, Stroh, Ziegel) und einem Schattenwurf aus derselben Sonne. Jedes
  behält sein Merkmal aus AC-14. **Gemessen:** zu jedem Gebäude der Daten
  gibt es eine Tafel mit Maske für die Spielerfarbe, und im Spiel wird es aus
  ihr gezeichnet; je Größe eine Baustelle in vier Stufen; die Mauer setzt
  sich aus Pfeiler, Armen und Läufen zusammen (ein Arm je Nachbar, zwei
  gegenüber ergeben einen Lauf), das Tor steht in zwei Richtungen zu und
  offen, die Farm leert sich in vier Stufen. **Am Bild zu sehen, nicht
  gemessen:** Material, Schattenwurf und Merkmal. **Bekannte Schwächen:**
  die Baustelle ist immer ein Holzgerüst, auch bei Burg, Turm und Mauer;
  Mühle, Bergbaulager, Schmiede und Stall wirken kleiner als gezeichnet; die
  Vorschau beim Ziehen einer Mauer zeigt jeden Pfeiler ohne seine Nachbarn.
- **AC-23** `fertig` **Gelände und Vorräte gerendert** — Boden, Bäume in
  mindestens vier Arten, Beeren, Gold, Stein und das Ufer. Vorräte sind nicht
  greller als ihre Umgebung: ein Beerenstrauch ist höchstens doppelt so hoch
  wie ein Schaf, Gold glänzt, ohne gelb zu leuchten. Leert sich ein
  Vorrat, wird er sichtbar kleiner (AC-3 gilt weiter).
- **AC-24** `in-arbeit` **Alle Einheiten gerendert** — Jede Einheit und jedes Tier
  der Daten kommt aus der Kette, nach AC-19 bis AC-21. Die gezeichneten
  Fassungen sind entfernt. Mit 100 Einheiten und 30 Gebäuden bleibt das Bild
  bei mindestens 50 Bildern je Sekunde (AC-10), und die Partie zeichnet erst,
  wenn ihre Bilder geladen sind. **Seit 2026-11-12 sind die gerenderten
  Bilder die Vorgabe** (Benutzer: „die Optik ist schon wichtig"); `?bilder=0`
  zeigt das gezeichnete Aussehen, solange es die Fassungen noch gibt. Bis
  die Tafeln da sind, steht „Bilder werden geladen …" im Bild; fehlt eine
  Tafel, wird nur dieses Stück gezeichnet. **Seit 2026-11-13 zeigt und
  misst auch die Schautafel die gerenderten Bilder** — über dieselben
  Funktionen wie das Spielbild, alle in einem Maßstab. **Offen:** die
  gezeichneten Fassungen stehen noch im Code (entfernt werden sie auf das
  Wort des Benutzers), AC-19 bis AC-21 sind nicht belegt, und was der
  Browser an Speicher für alle Tafeln hält, ist nicht gemessen.
- **AC-25** `fertig` **Bilder nur einmal übertragen** — Jede Datei des
  Spiels trägt eine Marke aus ihrem Inhalt (`ETag`), und der Browser fragt
  bei jedem Aufruf nach (`Cache-Control: no-cache`): was er schon hat,
  beantwortet der Server mit „unverändert" ohne Inhalt. Die Bildtafeln sind
  über 20 MB — ohne Marke kämen sie bei jedem Seitenaufruf neu. Nach einem
  Ausrollen kommt nur, was sich geändert hat. **Messbar:** dieselbe Anfrage
  mit der Marke ergibt 304 und null Byte, mit einer alten die ganze Datei.
- **AC-26** `fertig` **Trümmer nach dem Einsturz** — Ein Gebäude, das
  zerstört wird, verschwindet nicht einfach: zwanzig Spielsekunden liegen
  seine Trümmer im Bild — verbrannter Boden auf der Grundfläche, ringsum
  die gebrochenen Reste der Mauern, dazwischen Schutt und verkohlte Balken,
  für jedes Gebäude dieselbe Zeichnung in seiner Größe —, dann verblassen
  sie. Die Trümmer sind nur ein Bild: der Platz ist im selben Takt frei,
  begehbar und bebaubar, ein Klick trifft dort nichts, und wer darüber geht,
  steht davor. Das gilt auch für alles, was ein Spieler beim Aufgeben
  verliert; endet die Partie damit, bleiben die Trümmer im stehenden Bild
  ([Spielziel](spielziel.md) AC-28). Keine Trümmer hinterlässt, was nicht
  einstürzt: ein abgesagter Bau, eine abgeerntete Farm, die Mauer unter
  einem neuen Tor. Der Server sagt mit dem Verschwinden, wie lange die
  Trümmer noch liegen (`z` in Takten) — wer den Einsturz erst später
  bemerkt, sieht sie kürzer oder gar nicht. **Rückmeldung des Benutzers:**
  „kaputte gebäude sollten nicht nur verschwinden, sondern kurz zur ruine
  werden, aber man kann trotzdem drüberreiten/gehen" und „nach dem sieg
  sollten die gebäude des gegners der aufgegeben hat, automatisch ne ruine
  werden".
- **AC-27** `fertig` **Zoomen ohne Stocken** — Das Mausrad geht in dreizehn
  festen Stufen von 0,4 bis 3,6 (jede rund das 1,2-fache der vorigen, Zoom 1
  ist eine davon; 3 und 3,6 seit dem 2026-11-24 — Benutzer: „und wäre es
  denkbar, dass man noch näher ranzoomen kann?" —, ab 3 liegt der Boden in
  seiner gerenderten Auflösung); nach einem Anschlag am Rand liegt der Zoom wieder auf
  denselben Werten. Figuren, Gebäude, Vorräte und Bodenkacheln liegen je
  Stufe als fertige Bilder im Speicher, gezählt nach Bildpunkten, und hinaus
  geht, was am längsten nicht gebraucht wurde: wer durch alle Stufen und
  zurück dreht, bekommt auf dem Rückweg kein Stück neu gezeichnet. Wechselt
  der Zoom die Auflösung des Bodens, entsteht keine Kachel, solange gedreht
  wird — die von eben liegen vergrößert da —, und danach höchstens eine je
  Bild; dasselbe gilt für die Kacheln um ein Feld, das sich ändert (der Baum
  fällt). Nach einem Dreh darf ein Bild fünf Millisekunden an neuen Stücken
  zeichnen, was dann noch fehlt, steht für dieses Bild in der Größe von eben
  da. Ohne Dreh am Rad zeichnet das Bild wie bisher alles sofort. Gemessen
  mit hundert Einheiten und dreißig Gebäuden im Browserlauf, vorher: jeder
  Dreh ein Bild von 43 bis 107 ms, auch beim zehnten Mal, der Wechsel der
  Bodenauflösung eines von 274 bis 368 ms. **Rückmeldung des Benutzers:**
  „jetzt ruckelts langsam schon relativ stark" — „v.a. wenn ich rein und
  rauszoome, ansonsten nicht". Nicht gemessen ist der Rechner des Benutzers:
  der Browserlauf zeichnet ohne Grafikkarte.
- **AC-28** `fertig` **Geschosse sind gerendert** — Der Pfeil und der Stein
  des Mangonels kommen aus einer eigenen Tafel (`geschoss`, Skript unter
  `grafik/`): der Pfeil mit Schaft, Eisenspitze und heller Fiederung, in die
  Flugrichtung gedreht; der Stein als kantiger Brocken, der sich im Flug
  überschlägt, mit einem Fleck Schatten am Boden unter sich. Der Pfeil ist
  drei Viertel so groß, wie der Maßstab des Feldes ihn gäbe (`PFEIL_MASS`):
  bei Zoom 1,5 rund 17 Bildpunkte lang, zwei Fünftel der Höhe einer Figur —
  vorher 22 und gut die Hälfte. Er wird nie kleiner gezeichnet als mit dem
  Maßstab 0,3 — darunter wäre der Schaft kaum einen Bildpunkt breit; der
  Stein bleibt, wie er war. Ohne Tafel (`?bilder=0`) bleibt es bei Strich
  und Kreis. **Rückmeldung des Benutzers:** „Pfeile sind noch nicht
  gerendert, da brauchen wir noch was" und, zur Größe: „ich glaube der Pfeil
  is zu groß".
- **AC-29** `fertig` **Nebel reicht über die Kante** — Was an der Kante der
  Karte steht, ragt mit Krone oder Dach über sie hinaus. Der Nebel reicht
  deshalb sechs Felder weiter als die Karte (`NEBELRAND` in
  `public/nebel.js`) und trägt dort den Stand des nächsten Felds der Kante:
  ein Baum am Rand ist im Erkundeten bis in die Spitze gedämpft und im
  Beobachteten ganz hell, nie halb. Vorher deckte das Nebelbild die Karte und
  ein Feld Rand; die Krone darüber blieb hell. Gemessen im Browserlauf an
  einem Baum an der Kante, mit und ohne Nebel gelesen: jeder Bildpunkt der
  Krone jenseits des alten Rands ist gedämpft. **Rückmeldung des Benutzers
  (2026-11-15, mit Bild):** „der baum ist lustigerweise draussen und hell".
- **AC-30** `fertig` **Gefecht ohne Hänger** — Treffen zwei Heere zwischen
  Häusern aufeinander, bleibt kein Bild hängen. Drei Dinge sorgen dafür.
  **Verkleinerte Tafeln:** eine Figur wird im Spiel nicht mehr aus der großen
  Tafel geschnitten, sondern aus einer Fassung, die der Browser abseits des
  Bildaufbaus auf die Größe der Zoomstufe verkleinert hat
  (`createImageBitmap`, `atlasHolen` in `public/bilder.js`); bis sie da ist,
  steht die Figur in der Größe von eben oder in ihrer Ruhestellung, und das
  Bild gilt so lange nicht als scharf. Gehalten werden höchstens 80 Millionen
  Bildpunkte, hinaus geht, was am längsten nicht gebraucht wurde; kann ein
  Browser nicht verkleinern, schaltet sich der Weg ab und es wird gezeichnet
  wie vorher. **Umrisse auf einem Blatt:** jede verdeckte Einheit
  ([Bedienung](bedienung.md) AC-30) hat ihr Feld auf einem gemeinsamen Blatt,
  aus dem erst gelesen wird, wenn alles darauf steht. **Eine Frist für neue
  Haltungen:** hat ein Bild des Spiels acht Millisekunden lang neue
  Figurenbilder gezeichnet, bleibt jede weitere Figur für dieses eine Bild in
  ihrer Haltung von eben (`haltungsfrist` in `public/bildspeicher.js`); wer
  noch nie zu sehen war, wird gezeichnet. **Gemessen im Chrome
  mit Grafikkarte** (1920 × 1080, Partie bei Minute 25, dazu je Seite 40
  Kampfeinheiten im Dorf; `npm run tempo:partie`), vorher → nachher:
  im Gefecht 34 → 60 Bilder je Sekunde, `zeichnen()` 24,4 → 4,0 ms je Bild,
  Bilder über 50 ms 14 → 0 in acht Sekunden (längstes 40 ms); mit 60
  ausgewählten Einheiten 22 → 60 Bilder je Sekunde, 36,5 → 3,8 ms; nah
  herangezoomt (Zoom 1,8) vorher Bilder bis 435 ms, jetzt 60 Bilder je
  Sekunde und in sechzehn Sekunden zwei Bilder über 50 ms (92 ms, gleich
  nach dem Zoomwechsel). Der Server braucht in derselben Partie je Takt
  höchstens 5 ms. **Gemessen im Browserlauf** (ohne Grafikkarte, 150 Einheiten im
  Bild, 35 verdeckt, 33 bis 44 im Kampf, zehn Sekunden vom ersten Schlag
  an): vorher 57 Bilder je Sekunde mit sieben Bildern über 50 ms und einem
  von 199 ms, jetzt 58 bis 59 mit einem oder zwei über 50 ms; `zeichnen()`
  braucht 4,2 bis 4,8 ms je Bild und höchstens 20 bis 24 ms, die Umrisse
  0,9 ms. Der Test verlangt höchstens sechs Bilder über 50 ms; ohne die
  verkleinerten Tafeln sind es neun bis zehn, und `zeichnen()` braucht bis
  76 ms. Ohne die Frist für Haltungen braucht es bis 43 ms und drei- bis
  siebenmal über 20 statt höchstens zweimal - das fällt an keiner Grenze
  des Tests, es ist nur gemessen. Die Abstände zwischen zwei Bildern
  streuen im Browserlauf auch ohne das Spiel: einzelne von 50 bis 130 ms
  liegen nicht in `zeichnen()`. Die Ursache der Hänger: der
  Browser entpackt jede Tafel beim ersten Zeichnen auf dem Hauptfaden, im
  Mittel 25 ms, und ein Gefecht braucht zwanzig auf einmal (Angreifen und
  Sterben je Art, je mit Maske). **Nicht gemessen:** die Rechner der Spieler,
  eine Bildpunktdichte über 1, andere Browser als Chrome; die Frist für
  Haltungen mit Grafikkarte. Der erste Auftritt
  einer Einheitenart entpackt ihre Tafel weiter einmal auf dem Hauptfaden;
  Gebäude und Gelände kommen wie bisher aus den großen Tafeln.
  **Rückmeldung des Benutzers (2026-11-17):** „die Performance, wenn da ein
  paar mehr Einheiten aufm Spielfeld sind, oder wenn sie kämpfen, die muss
  unbedingt verbessert werden - erheblich".
- **AC-31** `fertig` **Gefällter Baum liegt** — Mit dem ersten Stück Holz,
  das ein Dorfbewohner nimmt, ist der Baum gefällt: statt Stamm und Krone
  liegt auf dem Feld ein Stumpf mit heller Schnittfläche und daneben der
  Stamm. Er wird mit dem Vorrat weniger, in den vier Vierteln, die der
  Server kennt: eben gefällt der ganze Stamm mit Aststummeln und einem Rest
  der Krone, dann der Stamm kürzer und Rollen daneben, zuletzt Stumpf,
  Scheite und Späne. Das Feld bleibt Wald, bis es leer ist — es sperrt den
  Weg wie vorher, und gesammelt wird daran wie vorher. Die Bilder kommen aus
  einer eigenen gerenderten Tafel (`grafik/baumstumpf.py`, Tafel
  `baumstumpf`): Zeilen sind die vier Baumarten in der Reihenfolge der
  stehenden — eine gefällte Birke hat Birkenrinde —, Spalten die vier Stufen
  mit je drei Gestalten. Fehlt die Tafel oder ist `?bilder=0` gesetzt, wird
  der Liegende gezeichnet; weit herausgezoomt ist er ein brauner Fleck statt
  eines grünen. **Der Server meldet dafür das erste Stück** als
  Feldänderung mit dem vollen Viertel (`v: 4`); vorher meldete er einen
  Vorrat erst, wenn ein Viertel fehlte, und ein Baum sah 25 Stück Holz lang
  aus wie unberührt. Eine Nachricht je Stück gibt es weiter nicht. **Der
  Aufbau bringt mit, was angebrochen ist** (`karte.fuellung`, jeder Vorrat
  unter seinem vollen Wert mit seinem Viertel): wer zurückkehrt, sieht den
  Baum liegen und den halben Goldhaufen halb — vorher stand nach einer
  Rückkehr alles wieder voll da, bis das nächste Viertel fiel. **Getroffen
  wird der Liegende flach** (ein halbes Feld hoch statt gut zwei): ein Klick
  dorthin, wo die Krone war, trifft, was dahinter steht. Angesehen
  ([Bedienung](bedienung.md) AC-63) heißt er „Gefällter Baum“. **Entschieden
  ohne Rückfrage:** wie im Original fällt der Baum mit dem ersten Hieb, nicht
  nach einer Zahl von Schlägen; und der Aufbau schickt die Füllung wie die
  Karte selbst auch für Felder im Nebel. **Nicht gebaut:** ein Fallen als
  Bewegung — der Baum liegt von einem Bild zum nächsten; die Schautafel
  zeigt die Liegenden nicht. **Rückmeldung des Benutzers (2026-11-17):**
  „angehakte Holzbäume gibts nicht,".

**Was der Bildumbau ablöst.** AC-12 („gezeichnet statt flach") und die
Messungen 1 und 3 aus AC-13 beschreiben eine Zeichnung. Sie bleiben `fertig`,
bis AC-22 bis AC-24 gebaut sind; die Runde, die den Nachfolger baut, passt
Text, Test und Bild an. AC-14 (unterscheidbar) und AC-16 (Spielgröße) gelten
für gerenderte Bilder unverändert. **Stand 2026-11-13:** im Spielbild ist
alles gerendert, und die Schautafel (`/schautafel.html`) zeigt und misst
dieselben Bilder. Dabei ist jede Messung, die an ihr hängt, neu gelesen
worden. **Angepasst, weil sie eine Zeichnung beschrieb:** AC-13 (1) am Rand
der Gestalt statt über alle Bildpunkte, AC-13 (3) über die Hautfarbe, AC-13
(5) und [Bauen](bauen.md) AC-20 in der Geometrie (Raute statt Ecke, Höhe in
eigenen Feldern), AC-3 am Farbton, AC-2 an einem See aus neun Feldern, die
Spielerfarbe als das, was sich mit dem Spieler ändert. **Am Bild
nachgebessert** (neu gerendert): die Schmiede trug die Spielerfarbe nur am
Wimpel (jetzt ein Banner im Hof), der Markt auf 18 % seiner Fläche (jetzt
nur der mittlere Stand, 7,7 %), der Wachturm auf 10,0 % (jetzt 8,7 %).
**Nicht bestanden und so geführt:** AC-6 (Dorfbewohner gegen Miliz) und
[Bedienung](bedienung.md) AC-36 (Umriss der Fußtruppen bei Zoom 1) stehen
auf `in-qa`, bis die Modelle Schild und Waffe neben dem Körper tragen.

### Stufe F — die Krone (Spec-Runde 2026-11-18)

- **AC-32** `fertig` **Figuren der Krone** — Jede Stufe der Krone aus
  [Einheiten](einheiten-und-befehle.md) AC-66 bis AC-68 — Zweihandkämpfer,
  Hellebardier, Husar, Kavalier, Paladin, Langbogenschütze, schwere
  Armbrust, Belagerungsramme, Onager — hat eine eigene gerenderte Figur mit allen
  Abläufen (ADR-0016), die sich bei Zoom 1 von ihrer Vorstufe
  unterscheiden lässt (Schautafel, wie AC-14). Die fünf Elitestufen
  (AC-69) behalten die Figur ihrer Einheit, wie in der Vorlage. Bergfried
  und Wunder haben eigene Bilder ([Bauen](bauen.md) AC-50, AC-51), der
  Drache und sein Ei ebenso (einheiten AC-51, AC-52).

- **AC-33** `fertig` **Besatzung am Gebäude** — Ein Gebäude mit
  Besatzung trägt im Spielbild über dem Dach ein Schild mit der Zahl der
  Insassen, für jeden, der das Gebäude sieht (`bs`, [Bauen](bauen.md)
  AC-58) — in der Vorlage weht dort eine Fahne. Ohne Besatzung steht
  nichts da.

## Grenzfaelle

- Weit herausgezoomt werden Figuren zu Punkten in Spielerfarbe, Gebäude zu
  Flächen — lesbar bleibt, wer wo steht.
- Das Spielbild muss auch ohne Grafikkarte flüssig laufen; zeichnen,
  was im Bild ist, nicht die ganze Karte.
