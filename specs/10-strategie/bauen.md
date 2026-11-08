# Bauen und Ausbilden

**Bereich:** Strategie
**Kuerzel:** bauen
**Stand:** 27/34 fertig · 7 offen

## Zweck

Aus Rohstoffen wird Wirtschaft und Heer. Das ist die Schleife, in der die
eigentliche Entscheidung eines Strategiespiels steckt: **noch ein
Dorfbewohner oder schon ein Soldat?**

Werte nach der [Vorlage](../../docs/strategie/vorlage-aoe2.md)
([ADR-0012](../../docs/adr/0012-aoe2-als-vorlage.md)). Die Kriterien bis AC-19
wurden für Stufe A neu gefasst; die Nummern sind geblieben.

## Abgrenzung

| Gehoert dazu                     | Gehoert nicht dazu                          |
| -------------------------------- | ------------------------------------------- |
| Gebäude, Kosten, Bauzeiten       | Sammeln → [Einheiten](einheiten-und-befehle.md) |
| Bevölkerungsgrenze               | Kampfwerte → [Kampf](kampf.md)              |
| Ausbilden, Verbesserungen        | Siegbedingung → [Spielziel](spielziel.md)   |
| Knöpfe und Vorschau              | wie es aussieht → [Darstellung](darstellung.md) |

## Die Gebäude der Dunklen Zeit (Stufe A)

| Gebäude             | Größe | Kosten              | Bauzeit | Leben | Leistet |
| ------------------- | ----- | ------------------- | ------- | ----- | ------- |
| **Dorfzentrum**     | 4×4   | 275 Holz, 100 Stein | 150 s   | 2400  | Abgabe aller Rohstoffe, Dorfbewohner, Webstuhl, +5 Bevölkerung |
| **Haus**            | 2×2   | 25 Holz             | 25 s    | 550   | +5 Bevölkerung |
| **Mühle**           | 2×2   | 100 Holz            | 35 s    | 1000  | Abgabe Nahrung |
| **Holzfällerlager** | 2×2   | 100 Holz            | 35 s    | 1000  | Abgabe Holz |
| **Bergbaulager**    | 2×2   | 100 Holz            | 35 s    | 1000  | Abgabe Gold und Stein |
| **Farm**            | 3×3   | 60 Holz             | 15 s    | 480   | 175 Nahrung, begehbar |
| **Kaserne**         | 3×3   | 175 Holz            | 50 s    | 1200  | Miliz |

Größen in Feldern, wie im Original. Jedes Gebäude trägt eine eigene
Entscheidung: Haus heißt wachsen, Lager heißt Wege kürzen, Farm heißt
Nahrung ohne Ende, Kaserne heißt kämpfen, ein zweites Dorfzentrum heißt
ausbreiten.

| Einheit / Verbesserung | Ort          | Kosten           | Zeit |
| ---------------------- | ------------ | ---------------- | ---- |
| Dorfbewohner           | Dorfzentrum  | 50 Nahrung       | 25 s |
| Miliz                  | Kaserne      | 60 Nahrung, 20 Gold | 21 s |
| Webstuhl               | Dorfzentrum  | 50 Gold          | 25 s |

Der Späherreiter steht nur zu Beginn auf der Karte; ausgebildet wird er ab
Stufe B im Stall.

## Die Gebäude der Feudalzeit (Stufe B)

| Gebäude           | Größe | Kosten    | Bauzeit | Leben | Leistet |
| ----------------- | ----- | --------- | ------- | ----- | ------- |
| **Schießanlage**  | 3×3   | 175 Holz  | 50 s    | 1000  | Bogenschütze, Plänkler |
| **Stall**         | 3×3   | 175 Holz  | 50 s    | 1000  | Späherreiter |
| **Schmiede**      | 2×2   | 150 Holz  | 40 s    | 1200  | Angriff und Rüstung, nah und fern |

Markt, Wachturm, Mauer und Tor stehen in der Vorlage ebenfalls in der
Feudalzeit; sie kommen mit Stufe D (Befestigung, Handel) und nicht hier — Stufe
B ist der Kampf der drei Einheiten gegeneinander.

## Die Gebäude der Ritterzeit (Stufe D)

Werte aus der [Vorlage](../../docs/strategie/vorlage-aoe2.md). Wachturm,
Steinmauer, Tor und Markt stehen im Original schon in der Feudalzeit; gebaut
werden sie mit den anderen Befestigungen in Stufe D, verfügbar ab der
Feudalzeit wie dort.

| Gebäude | Zeitalter | Kosten | Bauzeit | Leben | Leistet |
| --- | --- | --- | --- | --- | --- |
| Wachturm | Feudal | 25 Holz, 125 Stein | 80 s | 1020 | schießt (5 Angriff, Reichweite 8) |
| Steinmauer | Feudal | 5 Stein je Feld | 8 s | 1800 | Sperre |
| Tor | Feudal | 30 Stein | 70 s | 2750 | Sperre, lässt Eigene durch |
| Markt | Feudal | 175 Holz | 60 s | 1300 | Tausch der Rohstoffe gegen Gold |
| Kloster | Ritter | 175 Holz | 40 s | 2100 | Mönch |
| Universität | Ritter | 200 Holz | 60 s | 2100 | Mauerwerk |
| Belagerungswerkstatt | Ritter | 200 Holz | 40 s | 2100 | Ramme, Mangonel |
| Burg | Ritter | 650 Stein | 200 s | 4800 | schießt (11 Angriff, Reichweite 8), +20 Bevölkerung |

**Nicht in Stufe D:** Unterschlupf (Einheiten in Gebäuden bergen), die
Spezialeinheit der Burg (kommt mit den Völkern, Stufe E), Palisade.

## Abnahmekriterien

### Bauen

- **AC-1** `fertig` **Dorfbewohner bauen Gebäude** — Ein ausgewählter Dorfbewohner bekommt einen
  Bauauftrag für einen Platz; er läuft hin und baut. Während er baut, sammelt
  er nicht. Nach dem Bau eines Lagers oder einer Mühle sammelt er am nächsten
  passenden Vorrat, nach einer Farm bestellt er sie.
- **AC-2** `fertig` **Mehrere bauen schneller** — n Dorfbewohner brauchen `3·t / (n + 2)`: einer
  die volle Zeit, zwei drei Viertel, drei drei Fünftel. Mehr hilft, aber
  immer weniger — wie im Original.
- **AC-3** `fertig` **Bauplatz muss frei sein** — Alle Felder der Grundfläche sind begehbar und
  von keinem Gebäude, Baum, Vorrat oder Schaf belegt. Einheiten auf dem Platz
  gehen beiseite.
- **AC-4** `fertig` **Bauplatz wird vorher gezeigt** — Beim Platzieren folgt die Grundfläche dem
  Zeiger, grün wenn der Platz taugt, rot wenn nicht — vor dem Klick. Esc
  bricht das Platzieren ab.
- **AC-5** `fertig` **Kosten beim Baubeginn abgezogen** — Nicht bei Fertigstellung. Reicht der
  Vorrat nicht, entsteht keine Baustelle.
- **AC-6** `fertig` **Abbruch erstattet den Rest** — Eine Baustelle lässt sich abreißen. Erstattet
  wird der Anteil der Kosten, der noch nicht verbaut ist.
- **AC-7** `offen` **Gebäude im Bau angreifbar** — Mit Leben im Verhältnis zum Baufortschritt.
  _(Stufe B, mit dem Kampf.)_
- **AC-20** `fertig` **Die Gebäude der Dunklen Zeit** — Dorfzentrum, Haus, Mühle,
  Holzfällerlager, Bergbaulager, Farm und Kaserne lassen sich mit Kosten,
  Bauzeit, Größe und Leben aus der Tabelle oben bauen. Die Werte stehen als
  Daten an einer Stelle, nicht in der Simulation verteilt. _(Runde 22
  bis 32 gebaut; das Dorfzentrum als Bauauftrag erst in Stufe D, wie in der
  Vorlage.)_

### Ausbilden

- **AC-8** `fertig` **Dorfzentrum bildet Dorfbewohner aus** — 50 Nahrung, 25 Sekunden. Jeder
  Spieler beginnt mit einem Dorfzentrum an seiner Basis. _(Die Startaufstellung
  steht seit Runde 18 in AC-22.)_
- **AC-9** `fertig` **Kaserne bildet Miliz aus** — 60 Nahrung, 20 Gold, 21 Sekunden. Kämpfen kann
  sie ab Stufe B; in Stufe A läuft sie und nimmt Bevölkerung.
- **AC-10** `fertig` **Warteschlange je Gebäude** — Bis zu 15 Aufträge; bezahlt wird beim
  Einreihen. Der laufende Auftrag zeigt seinen Fortschritt.
- **AC-11** `fertig` **Abbruch erstattet vollständig** — Ein Auftrag aus der Warteschlange, auch
  der laufende, erstattet beim Abbruch die vollen Kosten.
- **AC-12** `fertig` **Neue Einheiten erscheinen nebenan** — Auf einem freien Feld am Rand des
  Gebäudes, nicht in einem Hindernis, nicht in einem anderen Gebäude.
- **AC-13** `fertig` **Sammelpunkt je Gebäude** — Rechtsklick mit ausgewähltem Gebäude setzt ihn;
  zeigt er auf einen Vorrat, gehen neue Dorfbewohner dort gleich sammeln.
- **AC-21** `fertig` **Webstuhl stärkt Dorfbewohner** — 50 Gold, 25 s im Dorfzentrum: alle
  Dorfbewohner des Spielers +15 Leben, +1 Nah- und +2 Fernrüstung. Einmal je
  Partie.
- **AC-22** `fertig` **Startaufstellung nach der Vorlage** — Zu Beginn: ein Dorfzentrum, drei
  Dorfbewohner, ein Späherreiter, alle vor dem Dorfzentrum (dahinter verdeckte
  es sie). Bevölkerung 4/5 — ein Platz ist frei zum Ausbilden.

### Bevölkerung

- **AC-14** `fertig` **Bevölkerung ist begrenzt** — Dorfzentrum und Häuser geben je fünf Plätze,
  höchstens 200. Jede Einheit belegt einen.
- **AC-15** `fertig` **Volle Bevölkerung sperrt Ausbildung** — Der Auftrag bleibt in der Schlange
  und wartet, und die Oberfläche sagt, warum: „Bevölkerung voll — Haus bauen".
- **AC-16** `fertig` **Verlorene Einheiten geben Plätze frei** — Sofort, nicht erst beim nächsten Bau.

### Feudalzeit (Stufe B)

- **AC-23** `fertig` **Aufstieg in die Feudalzeit** — Das Dorfzentrum bietet den Aufstieg an:
  500 Nahrung, 130 Sekunden. Voraussetzung sind zwei fertige Gebäude der
  Dunklen Zeit außer Häusern, wie im Original — **das Dorfzentrum zählt mit**,
  es fehlt also ein gebautes. Während der Aufstieg läuft, bildet das Dorfzentrum
  nichts anderes aus; ein Abbruch erstattet die Nahrung. Zur Wahl steht nur das
  nächste Zeitalter.
- **AC-24** `fertig` **Gebäude der Feudalzeit** — Schießanlage, Stall und
  Schmiede lassen sich erst bauen, wenn die Feudalzeit erreicht ist; vorher
  stehen sie nicht im Baumenü, und der Server weist sie auch dann ab, wenn
  jemand es trotzdem versucht. Werte nach der Tabelle oben. Der Stall bildet
  den Späherreiter aus (80 Nahrung, 30 Sekunden); was Schießanlage und
  Schmiede anbieten, kommt mit den Einheiten und Verbesserungen (AC-25, AC-26,
  [Einheiten](einheiten-und-befehle.md) AC-23).
- **AC-25** `fertig` **Die Schmiede verbessert den Angriff** — Die Schmiede erforscht
  Schmiedeangriff (100 Nahrung, 50 s, +1 Nahangriff) und Befiederte Pfeile
  (100 Nahrung, 50 Gold, 30 s, +1 Fernangriff und +1 Reichweite). Die Wirkung
  gilt sofort für alle eigenen Einheiten der Art, auch für die schon gebauten.
  Getroffen wird über die **Klasse**, nicht über die Einheitenart: „Nah“ sind
  Infanterie und Kavallerie, „Fern“ sind die Bogenschützen — der Dorfbewohner
  trägt die Klasse `dorf` und bleibt wie im Original außen vor. Die Vorlage
  nennt keine Forschungsdauer; die Zeiten sind die des Originals.
- **AC-26** `fertig` **Verbesserungen der Wirtschaft** — Doppelaxt im Holzfällerlager
  (100 Nahrung, 50 Holz, 50 s, +20 % Holz) und Pferdekummet in der Mühle
  (75 Nahrung, 75 Holz, 20 s, +75 Nahrung je Farm) sind ab der Feudalzeit
  erforschbar und wirken auf alle vorhandenen Sammler und Farmen — auch auf
  die Farm, die schon steht. +20 % gilt der **Rate am Baum**, nicht dem Holz
  je Minute: das Hin- und Herlaufen wird nicht schneller.

### Zerstörung

- **AC-17** `offen` **Gebäude haben Leben** — Werte aus der Tabelle oben. _(Wirkung ab Stufe B.)_
- **AC-18** `offen` **Zerstörte Gebäude nehmen Plätze mit** — Fällt ein Haus, sinkt die Grenze.
  Einheiten über der Grenze sterben nicht, es kommen nur keine neuen dazu.
  _(Stufe B.)_
- **AC-19** `offen` **Eroberung entscheidet** — Die Siegbedingung steht in
  [Spielziel](spielziel.md) AC-5. _(Stufe C.)_

### Stufe D — Ritterzeit

- **AC-27** `fertig` **Aufstieg in die Ritterzeit** — Im Dorfzentrum, wie der
  in die Feudalzeit (AC-23): 800 Nahrung und 200 Gold, 160 Sekunden, und zwei
  fertige Gebäude der Feudalzeit außer Häusern. Danach stehen die Gebäude und
  Einheiten der Ritterzeit im Menü.
- **AC-28** `fertig` **Kloster, Universität, Werkstatt** — Die drei Gebäude der
  Ritterzeit mit den Werten aus der Tabelle, erst ab dem Aufstieg im
  Baumenü, jedes gezeichnet und von allen anderen unterscheidbar
  (darstellung AC-14).
- **AC-29** `fertig` **Türme schießen** — Wachturm und Burg greifen von selbst
  an, was in ihre Reichweite kommt, wie eine wachende Einheit (kampf AC-2),
  mit Angriff, Reichweite und Nachladezeit aus den Daten. Ein Gebäude ohne
  Angriff schießt nicht. Gebaut in Runde 125 für den Wachturm (Sicht 9, ein
  Feld über die Reichweite; der Außenposten bleibt mit 10 das Gebäude zum
  Sehen, kampf AC-18) (die Burg
  bekommt ihre Werte mit D7): `angriff`, `reichweite`, `nachladen` in
  `GEBAEUDE`, `welt.tuermeTakten()` schießt in jedem Takt, die Werte liest
  `welt.gebaeudewert()`. Der Turm nimmt die nächste fremde Einheit, gemessen
  vom Rand der Grundfläche als Luftlinie, und bleibt bei ihr, solange sie in
  Reichweite lebt. Gebäude beschießt er nicht, wie in der Vorlage. Wer von
  ihm getroffen wird, schlägt nicht von selbst zurück — ein Dorfbewohner mit
  der Axt gegen 1020 Leben Stein stürbe nur schneller. **Abweichung:** die
  Mindestreichweite der Vorlage (1 Feld, bis Mörderlöcher) fehlt; sie kommt,
  wenn es Mörderlöcher gibt. Im Baumenü als letzter, gezeichnet aus grauem
  Haustein mit Zinnen und Banner; an der Auswahl stehen seine Kampfwerte wie
  bei einer Einheit, und sein Pfeil beginnt oben auf dem Wehrgang.
- **AC-30** `fertig` **Mauern ziehen** — Eine Steinmauer wird gezogen: Taste,
  dann Ziehen von Feld zu Feld legt eine Linie von Baustellen, bezahlt je Feld.
  Was nicht frei ist, wird übersprungen, und die Vorschau zeigt es rot.
  Gebaut in Runde 127: Werte aus der Vorlage (5 Stein je Feld, 8 Sekunden,
  1800 Leben, ab der Feudalzeit), `gezogen` in den Daten. Die Linie
  (`mauerLinie`, höchstens 60 Felder) geht von Feld zu Nachbarfeld, auch
  schräg — schräg sperrt sie, weil die Wegsuche keine Ecke schneidet. Reicht
  der Stein nicht, endet die Linie dort, und die Vorschau zeigt auch diese
  Felder rot. Die Bauleute gehen von Feld zu Feld (`auftrag.folge`). Eine
  Mauer hält niemanden im Spiel und zählt nicht zum Aufstieg — wie Häuser,
  Außenposten und Türme (`zumAufstieg: false`, Vorlage). Sicht 2 statt 8:
  eine lange Mauer wäre sonst ein Band aus Außenposten. Gezeichnet als Block
  aus Haustein über die ganze Raute, mit Zinnen und einem Band in
  Spielerfarbe; gerade Nachbarn werden zur Wand.
- **AC-31** `offen` **Tor lässt Eigene durch** — Ein Tor in einer Mauer ist
  für die eigenen Einheiten begehbar, für fremde eine Sperre. Die Wegsuche
  kennt den Unterschied.
- **AC-32** `offen` **Burg** — 650 Stein, 200 Sekunden, 4800 Leben, +20
  Bevölkerung; schießt (AC-29). Erst ab der Ritterzeit.
- **AC-33** `offen` **Markt tauscht** — Am Markt kauft man 100 Holz, Nahrung
  oder Stein für Gold und verkauft sie gegen Gold. Jeder Kauf macht diesen
  Rohstoff teurer, jeder Verkauf billiger; zwischen Kauf- und Verkaufspreis
  liegt eine Gebühr von 30 %. Werte aus der Vorlage, als Daten. Ein Markt
  je Spieler genügt; Handel zwischen Märkten ist ausgeschlossen (ADR-0012).
- **AC-34** `fertig` **Verbesserungen der Ritterzeit** — Eisenguss (Schmiede,
  220 Nahrung, 120 Gold: Nahkämpfer +1 Angriff), Bodkinpfeil (Schmiede, 200
  Nahrung, 100 Gold: Fernkämpfer +1 Angriff, +1 Reichweite), Mauerwerk
  (Universität, 175 Holz, 150 Stein: Gebäude +10 % Leben, +1/+1 Rüstung),
  Stadtpatrouille (Dorfzentrum, 300 Nahrung, 100 Gold: Gebäude +4 Sicht) —
  jede erst nach ihrer Vorstufe, wo es eine gibt, und mit eigenem Bild im
  Menü. Gebaut in Runde 124: `vorstufe` als Wert der Verbesserung (Eisenguss
  nach Schmiedeangriff, Bodkinpfeil nach Befiederten Pfeilen,
  Stadtpatrouille nach Stadtwache) - erforscht muss sie sein, eingereiht
  reicht nicht; im Menü erscheint der Knopf erst danach. Mauerwerk wirkt
  über `gebaeude` wie die Sicht der Stadtwache, `welt.gebaeudewert()` ist
  die eine Stelle für Leben, Rüstung und Sicht eines Gebäudes, und das volle
  Leben reist in der Tafel `kw` zum Browser (für den Lebensbalken). Die
  Forschungsdauern nennt die Spec nicht; genommen sind die des Originals
  (75, 35, 50, 50 s).

## Grenzfaelle

- Eine Verbesserung gilt **einem Spieler**, nicht einem Gebäude: wer die
  Schmiede verliert, behält den Schmiedeangriff. Und wer sie erforscht hat,
  sieht den Knopf nicht mehr.
- Das Pferdekummet legt auf **jede** Farm nach, auch auf eine fast abgeerntete.
  Sie trägt danach mehr, als in der Tabelle steht — die Leiste nennt deshalb
  den Vorrat dieses Spielers, nicht den der Tabelle.
- Ein Dorfbewohner, der beim Bauen stirbt, hinterlässt eine Baustelle, an der
  ein anderer weiterbauen kann. Die Rohstoffe sind nicht verloren.
- Zwei Spieler beanspruchen denselben Platz: wer zuerst den Baubeginn absetzt,
  bekommt ihn; der andere bekommt eine Absage und behält seine Rohstoffe.
- Eine Farm ist begehbar. Sie sperrt den Platz für Gebäude, nicht für Einheiten.
- Ist die Farm leer, bleibt sie als leerer Acker stehen; neu anlegen kostet
  wieder 60 Holz.
