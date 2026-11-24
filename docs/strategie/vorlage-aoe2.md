# Vorlage: Regeln und Zahlen aus Age of Empires II

Nachschlagewerk für das Strategiespiel ([ADR-0012](../adr/0012-aoe2-als-vorlage.md)).
Hier steht, **was das Original tut**. Was das Spiel tut, steht in den Specs
unter [`specs/10-strategie/`](../../specs/10-strategie/). Weicht eine Spec von
dieser Vorlage ab, nennt sie den Grund.

> **Herkunft der Zahlen:** aus dem Gedächtnis, Stand etwa Definitive Edition.
> Die Größenordnungen und Verhältnisse stimmen, einzelne Werte können um
> einige Prozent danebenliegen. Maßgeblich ist, ob das Spiel trägt. Eine Zahl
> hier ist ein Startwert, keine Zusage. Wird ein Wert gegen eine Quelle
> geprüft, wird das an der Zeile vermerkt.

## Einheiten des Spiels

| Größe | Original | Hier |
| --- | --- | --- |
| Zeit | Spielsekunde (normale Geschwindigkeit 1,7) | Spielsekunde, 10 Takte |
| Länge | Kachel | Feld |
| Tempo | Kacheln je Sekunde | Felder je Sekunde |

## Start (Standard)

| | |
| --- | --- |
| Rohstoffe | 200 Holz, 200 Nahrung, 100 Gold, 200 Stein |
| Einheiten | 3 Dorfbewohner, 1 Späherreiter |
| Gebäude | 1 Dorfzentrum |
| Bevölkerung | Dorfzentrum +5, Haus +5, höchstens 200 |
| Karte | 2 Spieler 120×120 Kacheln, 8 Spieler 220×220 |

Je Spieler in Reichweite des Dorfzentrums: 8 Schafe (je 100 Nahrung), 6
Beerensträucher (je 125), 2 Wildschweine (je 340), 7 Goldfelder (je 800),
5 Steinfelder (je 350), mehrere Waldstücke (Baum 100 Holz).

## Dorfbewohner

50 Nahrung, 25 s. Leben 25, Angriff 3, Rüstung 0/0, Tempo 0,8, Sicht 4,
Tragkraft 10.

| Tätigkeit | Rohstoff je Sekunde | Abgabe an |
| --- | --- | --- |
| Holz fällen | 0,39 | Dorfzentrum, Holzfällerlager |
| Schafe hüten | 0,33 | Dorfzentrum, Mühle |
| Jagen (Wildschwein, Hirsch) | 0,41 | Dorfzentrum, Mühle |
| Beeren sammeln | 0,31 | Dorfzentrum, Mühle |
| Farm bestellen | 0,32 | Dorfzentrum, Mühle |
| Gold schürfen | 0,38 | Dorfzentrum, Bergbaulager |
| Stein brechen | 0,36 | Dorfzentrum, Bergbaulager |

Nahrung verfällt: ein erlegtes Tier verliert langsam an Menge. Wildschweine
greifen an, wenn man sie reizt.

Bauen: ein Dorfbewohner braucht die volle Bauzeit. Mehrere bauen schneller,
aber nicht linear: n Dorfbewohner brauchen etwa `3·t / (n + 2)`.

## Gebäude

| Gebäude | Zeitalter | Kosten | Bauzeit | Leben | Leistet |
| --- | --- | --- | --- | --- | --- |
| Dorfzentrum | Dunkel | 275 Holz, 100 Stein | 150 s | 2400 | Abgabe aller Rohstoffe, Dorfbewohner, Zeitalter, +5 Bev., Unterschlupf für 15 |
| Haus | Dunkel | 25 Holz | 25 s | 550 | +5 Bevölkerung |
| Mühle | Dunkel | 100 Holz | 35 s | 1000 | Abgabe Nahrung, Farmverbesserungen |
| Holzfällerlager | Dunkel | 100 Holz | 35 s | 1000 | Abgabe Holz, Axtverbesserungen |
| Bergbaulager | Dunkel | 100 Holz | 35 s | 1000 | Abgabe Gold und Stein |
| Farm | Dunkel | 60 Holz | 15 s | 480 | 175 Nahrung, dann neu anlegen |
| Kaserne | Dunkel | 175 Holz | 50 s | 1200 | Miliz, Speer, Plänkler (Feudal: Speer) |
| Palisade | Dunkel | 2 Holz je Feld | 5 s | 250 | Sperre |
| Außenposten | Dunkel | 25 Holz, 25 Stein | 15 s | 500 | Sicht |
| Schießanlage | Feudal | 175 Holz | 50 s | 1000 | Bogen, Plänkler |
| Stall | Feudal | 175 Holz | 50 s | 1000 | Späherreiter |
| Schmiede | Feudal | 150 Holz | 40 s | 1200 | Angriff und Rüstung |
| Markt | Feudal | 175 Holz | 60 s | 1300 | Tausch der Rohstoffe |
| Wachturm | Feudal | 25 Holz, 125 Stein | 80 s | 1020 | schießt, Unterschlupf 5 |
| Steinmauer | Feudal | 5 Stein je Feld | 8 s | 1800 | Sperre |
| Tor | Feudal | 30 Stein | 70 s | 2750 | Sperre, lässt Eigene durch |
| Burg | Ritter | 650 Stein | 200 s | 4800 | Spezialeinheit, schießt, +20 Bev. |
| Kloster | Ritter | 175 Holz | 40 s | 2100 | Mönche |
| Universität | Ritter | 200 Holz | 60 s | 2100 | Bau- und Fernkampfverbesserungen |
| Belagerungswerkstatt | Ritter | 200 Holz | 40 s | 2100 | Ramme, Mangonel, Skorpion |
| Wunder | Imperial | je 1000 Holz, Gold, Stein | 3500 s | 4800 | Sieg nach Zeit |

Was schießt: der **Wachturm** 5 Angriff, Reichweite 8, ein Pfeil alle 2 s,
Rüstung 1/7, Sicht 9; die **Burg** 11 Angriff, Reichweite 8, eine Salve alle
2 s, Rüstung 8/11, Sicht 11, vier mal vier Felder. **Berichtigt am
2026-11-13:** hier stand „ein Pfeil alle 2 s" — eine leere Burg schießt im
Original eine Salve (das Wiki nennt fünf Pfeile, ein Beitrag zur Definitive
Edition vier zu zusammen 44); gebaut sind vier. Mit Besatzung schießen
beide mehr Pfeile — **gebaut seit dem 2026-11-24** (bauen AC-58 bis AC-61):
je Dorfbewohner, Fußsoldat oder Schütze darin ein Pfeil mehr, Reiter nur in
die Burg und ohne Pfeil; drinnen heilt jeder. Abweichung: das Dorfzentrum
schießt hier nur mit Besatzung (5 Angriff, Reichweite 6, alle 2 s, gesetzt),
damit KI gegen KI unverändert bleibt — im Original schießt es auch leer.

Der **Markt** tauscht je 100 Holz, Nahrung oder Stein gegen Gold. Grundpreis
100, Stein 130; Kauf zum Grundpreis plus 30 %, Verkauf minus 30 %. Jeder
Kauf hebt den Preis dieser Ware, jeder Verkauf senkt ihn; ganz unten ist
er nach 4000 verkauftem Holz oder Nahrung und nach 5500 Stein. Daraus
folgen 2 Gold je Tausch und ein Tiefstpreis von 20 — gerechnet, nicht im
Original abgelesen.

Der **Handelskarren** (in der Vorlage ab der Feudalzeit, am Markt): 100 Holz,
50 Gold, 70 Leben, Rüstung 0/0, Tempo 1,0. Er pendelt zu einem fremden
Markt und bringt bei jeder Rückkehr Gold, nachgemessen von Spielern
`0,46 · d · (d / S + 0,3)` je Fahrt (`d` Abstand der Märkte in Feldern, `S`
Kantenlänge der Karte). Quelle für die Werte ist das Fan-Wiki zur Einheit,
für die Formel ein Beitrag aus der Gemeinschaft. Beides ist **nicht
geprüft**. Hier kommt er erst mit der Ritterzeit und darf auch zum zweiten
eigenen Markt fahren ([ADR-0013](../adr/0013-buendnisse-karren-dauer.md)).
Ausbildungszeit und Sicht stehen in keiner Quelle, die hier vorlag; gesetzt
sind **51 Sekunden** und **Sicht 7** (Runde 160, aus dem Gedächtnis des
Fan-Wikis, **nicht geprüft** — eine Studie von 2003 nennt rund 29 Sekunden
nach einer Verbesserung). **Abweichung (Runde 161):** der Faktor ist hier
0,77 statt 0,46. Mit 0,46 brächte ein Karren auf halber Kartenbreite
10,7 Gold je Minute, ein Dorfbewohner am Gold bringt hier 20,0; die Spec
verlangt „etwas weniger" (einheiten AC-40) — mit 0,77 sind es 18,0. Die Form der Formel bleibt.

## Zeitalter

| Wechsel | Kosten | Dauer | Voraussetzung |
| --- | --- | --- | --- |
| Dunkel → Feudal | 500 Nahrung | 130 s | 2 Gebäude der dunklen Zeit |
| Feudal → Ritter | 800 Nahrung, 200 Gold | 160 s | 2 Gebäude der Feudalzeit |
| Ritter → Imperial | 1000 Nahrung, 800 Gold | 190 s | 2 Gebäude der Ritterzeit oder eine Burg |

Übliche Zeiten: Feudal nach 9 bis 11 Minuten mit 20 bis 24 Dorfbewohnern,
Ritterzeit nach 16 bis 20.

## Kampf

**Schaden** = `max(1, Angriff − Rüstung)` getrennt nach Nah und Fern, plus
Bonusschaden gegen Rüstungsklassen (Kavallerie, Infanterie, Bogenschütze,
Gebäude, Belagerung …), minus die Rüstung des Ziels in dieser Klasse.

**Nachladezeit**, die Pause zwischen zwei Schlägen: Miliz, Soldat,
Späherreiter, Dorfbewohner und Bogenschütze 2,0 s, Speerkämpfer und Plänkler
3,0 s. **Gebäude** tragen keine Nahrüstung, aber 7 Fernrüstung und zählen als
Rüstungsklasse „Gebäude" — Pfeile richten an Mauerwerk kaum etwas aus.

| Einheit | Zeitalter | Kosten | Zeit | Leben | Angriff | Rüstung Nah/Fern | Reichweite | Tempo | Bonus |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Miliz | Dunkel | 60 N, 20 G | 21 s | 40 | 4 | 0/1 | – | 0,9 | |
| Späherreiter | Dunkel | 80 N | 30 s | 45 | 3 | 0/2 | – | 1,2 | |
| Speerkämpfer | Feudal | 35 N, 25 H | 22 s | 45 | 3 | 0/0 | – | 1,0 | +15 gegen Kavallerie |
| Bogenschütze | Feudal | 25 H, 45 G | 35 s | 30 | 4 | 0/0 | 4 | 0,96 | +3 gegen Speer |
| Plänkler | Feudal | 25 N, 35 H | 22 s | 30 | 2 | 0/3 | 4 | 0,96 | +3 gegen Bogenschützen |
| Soldat (Miliz-Stufe 2) | Feudal | 60 N, 20 G | 21 s | 45 | 6 | 0/1 | – | 0,9 | |
| Ritter | Ritter | 60 N, 75 G | 30 s | 100 | 10 | 2/2 | – | 1,35 | |
| Armbrustschütze | Ritter | 25 H, 45 G | 27 s | 35 | 5 | 0/0 | 5 | 0,96 | |
| Langschwertkämpfer (Miliz-Stufe 3) | Ritter | 60 N, 20 G | 21 s | 60 | 9 | 1/1 | – | 0,9 | |
| Pikenier (Speer-Stufe 2) | Ritter | 35 N, 25 H | 22 s | 55 | 4 | 0/0 | – | 1,0 | +22 gegen Kavallerie |
| Eliteplänkler (Plänkler-Stufe 2) | Ritter | 25 N, 35 H | 22 s | 35 | 3 | 0/4 | 5 | 0,96 | +4 gegen Bogenschützen |
| Leichte Kavallerie (Späher-Stufe 2) | Ritter | 80 N | 30 s | 60 | 7 | 0/2 | – | 1,5 | |
| Kamelreiter | Ritter | 55 N, 60 G | 22 s | 100 | 6 | 0/0 | – | 1,45 | +9 gegen Kavallerie |
| Berittener Bogen | Ritter | 40 H, 70 G | 34 s | 50 | 6 | 0/0 | 4 | 1,4 | |
| Mönch | Ritter | 100 G | 51 s | 30 | – | 0/0 | 9 | 0,7 | bekehrt, heilt |
| Ramme | Ritter | 160 H, 75 G | 36 s | 175 | 2 | 0/180 | – | 0,5 | +125 gegen Gebäude |
| Mangonel | Ritter | 160 H, 135 G | 46 s | 50 | 40 | 0/6 | 7 | 0,6 | Flächenschaden |
| Trebuchet | Imperial | 200 H, 200 G | 50 s | 150 | 200 | 1/150 | 16 | 0,8 | aufbauen, gegen Gebäude |

Die vier Stufen der Ritterzeit, der Wehrturm und die Rüstungen der Schmiede
stammen aus den offenen Technikbaum-Daten zum Original
(SiegeEngineers/aoe2techtree, gelesen 2026-11-13) — Leben, Angriff, Rüstung,
Bonus, Kosten und Dauer der Verbesserungen. Nicht übernommen: Zuschläge gegen
Gebäude, Mönche und Sonderklassen, die es hier nicht gibt.

**Abweichung: zwei Schützenlinien** (Benutzer, 2026-11-13; einheiten AC-34,
AC-58). In der Vorlage wird der Bogenschütze durch eine Verbesserung zum
Armbrustschützen und später zum Arbalestenschützen — eine Linie. Hier sind es
zwei nebeneinander:

| Linie | Lehen | Fürstentum | Krone (Stufe F) |
| --- | --- | --- | --- |
| Bogen | Kurzbogenschütze (die Werte des Bogenschützen der Vorlage) | Bogenschütze (die Werte des Armbrustschützen der Vorlage: 35 Leben, 5 Angriff, Reichweite 5) | Langbogenschütze |
| Armbrust | – | Armbrustschütze, eine eigene Einheit: 35 H, 55 G, 9 Angriff alle 3,5 s, Reichweite 5 | schwere Armbrust |

Den Namen Langbogenschütze trägt damit die Krone-Stufe für alle Häuser;
Eschenbruchs eigene Einheit (in der Vorlage der Langbogenschütze der Briten)
heißt **Eibenschütze** (Benutzer, 2026-11-13; einheiten AC-42).

Die Werte des Armbrustschützen hier sind Startwerte ohne Vorbild. Seine Rolle
kommt ohne Sonderregel aus `Angriff − Rüstung`: gegen 2 Fernrüstung macht der
Bolzen 7 in 3,5 s, der Pfeil 3 in 2 s; gegen Ungerüstete liegen beide gleich,
und der Bogen ist billiger (gemessen: fahrplan AC-25).

Der Kreis, auf den es ankommt:

```
Speer  ──schlägt──▶  Reiter  ──schlägt──▶  Bogen  ──schlägt──▶  Speer/Infanterie
Plänkler ──schlägt──▶ Bogen          Mangonel ──schlägt──▶ Haufen von Fernkämpfern
Ramme ──schlägt──▶ Gebäude           Reiter ──schlägt──▶ Belagerung, Mönche
```

## Wichtige Verbesserungen (Auswahl)

(¹) Nachgetragen am 2026-11-14 (bauen AC-43, AC-44): Kosten und
Forschungsdauer aus den offenen Technikbaum-Daten zum Original
(SiegeEngineers/aoe2techtree); die Wirkung nennt die Datei nicht, sie ist im
Spiel als Startwert gesetzt. Der Radkarren heißt im Spiel „Schubkarre".

| Verbesserung | Ort | Zeitalter | Kosten | Wirkung |
| --- | --- | --- | --- | --- |
| Webstuhl | Dorfzentrum | Dunkel | 50 G | Dorfbewohner +15 Leben, +1/+2 Rüstung |
| Doppelaxt | Holzfällerlager | Feudal | 100 N, 50 H | Holz +20 % |
| Pferdekummet | Mühle | Feudal | 75 N, 75 H | Farmen +75 Nahrung |
| Radkarren | Dorfzentrum | Feudal | 175 N, 50 H | Dorfbewohner +10 % Tempo, +25 % Tragkraft |
| Goldbergbau, Steinbergbau | Bergbaulager | Feudal | je 100 N, 75 H | Gold bzw. Stein +15 % (¹) |
| Goldschacht, Steinschacht | Bergbaulager | Ritter | je 175 N, 75 H | noch einmal +15 % (¹) |
| Bogensäge | Holzfällerlager | Ritter | 150 N, 100 H | Holz noch einmal +20 % (¹) |
| Schwerer Pflug | Mühle | Ritter | 125 N, 125 H | Farmen +125 Nahrung (¹) |
| Handkarren | Dorfzentrum | Ritter | 300 N, 200 H | Dorfbewohner noch einmal +10 % Tempo, mehr Tragkraft (¹) |
| Stadtwache | Dorfzentrum | Feudal | 75 N | Gebäude +4 Sicht |
| Stadtpatrouille | Dorfzentrum | Ritter | 300 N, 100 G | Gebäude +4 Sicht |
| Schmiedeangriff Stufe 1 | Schmiede | Feudal | 100 N | Nah +1 Angriff |
| Schuppenpanzer / Kettenpanzer | Schmiede | Feudal / Ritter | 100 N / 200 N, 100 G | Infanterie +1/+1 Rüstung je Stufe |
| Schuppen- / Kettenrossharnisch | Schmiede | Feudal / Ritter | 150 N / 250 N, 150 G | Kavallerie +1/+1 Rüstung je Stufe |
| Gepolsterte / Lederne Schützenrüstung | Schmiede | Feudal / Ritter | 100 N / 150 N, 150 G | Schützen +1/+1 Rüstung je Stufe |
| Wehrturm | Universität | Ritter | 100 N, 250 H | Wachturm +480 Leben, +2 Angriff, +1/+1 Rüstung |
| Langschwertkämpfer, Pikenier, Eliteplänkler, Leichte Kavallerie | Kaserne, Schießanlage, Stall | Ritter | 150 N 65 G · 160 N 90 G · 230 H 130 G · 150 N 50 G | tauscht die Einheit gegen ihre nächste Stufe |
| Befiederte Pfeile | Schmiede | Feudal | 100 N, 50 G | Fern +1 Angriff, +1 Reichweite |
| Belagerung (Soldat → Wache) | Kaserne | Feudal/Ritter | … | Einheitenstufen |

## Krone (Imperialzeit)

Gelesen am 2026-11-18 aus den offenen Technikbaum-Daten zum Original
(SiegeEngineers/aoe2techtree, `data/data.json`) für die Spec-Runde zur
Stufe F. Die Datei nennt Werte, Kosten und Dauer; die **Wirkung** einer
Verbesserung nennt sie nicht — die steht hier aus dem Gedächtnis und ist im
Spiel ein Startwert. **Berichtigt:** das Wunder kostet dort je 1000 Holz,
Gold und Stein, keine Nahrung; Rüstung 3/10.

| Stufe | aus | Leben | Angriff | Rüstung | Sonst | Verbesserung |
| --- | --- | --- | --- | --- | --- | --- |
| Zweihänder | Langschwertkämpfer | 65 | 12 | 1/1 | | 200 N, 100 G, 45 s |
| Champion | Zweihänder | 70 | 14 | 1/1 | | 650 N, 350 G, 70 s |
| Hellebardier | Pikenier | 60 | 6 | 0/0 | +32 gegen Kavallerie | 300 N, 600 G, 50 s |
| Husar | Leichte Kavallerie | 75 | 7 | 0/2 | Nachladen 1,9 s | 500 N, 600 G, 50 s |
| Kavalier | Ritter | 120 | 12 | 2/2 | | 300 N, 300 G, 80 s |
| Paladin | Kavalier | 160 | 14 | 2/3 | Nachladen 1,9 s | 1300 N, 750 G, 170 s |
| Arbalestenschütze | Armbrustschütze | 40 | 6 | 0/0 | Reichweite 5 | 450 N, 350 G, 50 s |
| Sturmramme | Ramme | 200 | 3 | −2/190 | +160 gegen Gebäude (Ramme: +150) | 300 N, 50 s (Ritterzeit) |
| Belagerungsramme | Sturmramme | 270 | 4 | −1/195 | +200 gegen Gebäude | 1000 N, 75 s |
| Onager | Mangonel | 60 | 55 | 0/8 | Reichweite 8 | 800 N, 500 G, 75 s |
| Belagerungsonager | Onager | 70 | 75 | 0/8 | Reichweite 8 | 1450 N, 1000 G, 150 s |

Türme: Wachturm 850 Leben, 5 Angriff, 1/7; Wehrturm 1500, 7, 2/8;
**Bergfried** 2250, 8, 3/9 — die Verbesserung 500 N, 350 H, 75 s. (Der
Wachturm hat hier 1020 Leben aus einer älteren Fassung; die Schritte
zwischen den Stufen sind übernommen.)

| Verbesserung | Ort | Kosten | Dauer | Wirkung (aus dem Gedächtnis) |
| --- | --- | --- | --- | --- |
| Hochofen | Schmiede | 275 N, 225 G | 100 s | Nahkampf +2 Angriff |
| Armschiene | Schmiede | 300 N, 200 G | 40 s | Fern +1 Angriff, +1 Reichweite |
| Plattenpanzer | Schmiede | 300 N, 150 G | 70 s | Infanterie +1/+2 |
| Plattenrossharnisch | Schmiede | 350 N, 200 G | 75 s | Kavallerie +1/+2 |
| Ringpanzer der Schützen | Schmiede | 250 N, 250 G | 70 s | Schützen +1/+2 |
| Fruchtwechsel | Mühle | 250 N, 250 H | 70 s | Farmen +175 Nahrung |
| Zweimannsäge | Holzfällerlager | 300 N, 200 H | 100 s | Holz +10 % |
| Chemie | Universität | 300 N, 200 G | 100 s | Geschosse +1 Angriff |
| Architektur | Universität | 300 N, 200 H | 70 s | Gebäude +10 % Leben, +1/+1 |
| Belagerungsingenieure | Universität | 500 N, 600 H | 45 s | Belagerung +1 Reichweite, +20 % gegen Gebäude |
| Wehrpflicht | Burg | 150 N, 150 G | 60 s | Militärgebäude bilden 33 % schneller aus |
| Wehrgänge | Burg | 400 N, 400 H | 75 s | Burg +21 % Leben — nicht übernommen |
| Befestigte Mauer | Universität | 200 N, 100 H | 50 s | Mauer 3000 statt 1800 Leben — nicht übernommen |

Dazu das Paket vom 2026-11-18 (bauen AC-52 bis AC-56), Kosten und Dauer aus
denselben Daten, Wirkungen aus dem Gedächtnis:

| Verbesserung | Ort | Kosten | Dauer | Wirkung (aus dem Gedächtnis) |
| --- | --- | --- | --- | --- |
| Kartografie | Markt | heute geschenkt, früher 100 N, 100 G | 40 s (gesetzt) | Verbündete sehen gemeinsam — hier: die Karte gilt als erkundet |
| Blutlinien | Stall | 150 N, 100 G | 50 s | Berittene +20 Leben |
| Karawane | Markt | 200 N, 200 G | 40 s | Marktkarren +50 % Tempo |
| Brandstiftung | Kaserne | 75 N, 25 G | 25 s | Infanterie +2 gegen Gebäude |
| Knappen | Kaserne | 100 N | 40 s | Infanterie +10 % Tempo |
| Heiligkeit | Kloster | 175 G | 60 s | Mönch +50 % Leben |
| Inbrunst | Kloster | 140 G | 50 s | Mönch +15 % Tempo |
| Buchdruck | Kloster | 200 G | 55 s | Bekehren +3 Reichweite |
| Erleuchtung | Kloster | 120 G | 65 s | Glaube kehrt 50 % schneller zurück |
| Tretkran | Universität | 300 N, 200 H | 50 s | Dorfbewohner bauen 20 % schneller |
| Sappeure | Burg | 400 N, 200 H | 10 s | Dorfbewohner +15 gegen Gebäude |
| Daumenring | Schießanlage | 300 N, 250 H | 45 s | Schützen laden schneller — wartet |

**Abweichungen** (bauen AC-47 bis AC-51, einheiten AC-66 bis AC-69): eine
Stufe je Linie statt zwei, **außer beim Ritter** (Kavalier und Paladin,
Benutzer 2026-11-18) — der Zweihandkämpfer trägt die Werte des
Zweihänders, die Belagerungsramme ist die eine Stufe der Ramme, und ihr Stoß
steigt um 50 auf +175 (die Ramme hat hier +125 aus einer älteren Fassung).
Die Bogenlinie endet im Langbogenschützen mit den Werten des
Arbalestenschützen; die schwere Armbrust und die fünf Elitestufen der
Spezialeinheiten haben kein Vorbild.

## Völker: Vorschlag für die ersten fünf

Jedes Volk hat **zwei bis drei Boni, eine Spezialeinheit aus der Burg und einen
Mannschaftsbonus.** Das gehört nach [spielziel](../../specs/10-strategie/spielziel.md)
in die günstige Sorte: Daten, keine eigene Mechanik.

| Volk | Boni | Spezialeinheit | Mannschaft |
| --- | --- | --- | --- |
| **Franken** | Burgen 25 % billiger; Reiter +20 % Leben; Farmverbesserungen kostenlos | Wurfaxtkämpfer (Infanterie mit Fernwurf) | Ritter +2 Sicht |
| **Briten** | Dorfzentren ab Ritterzeit 50 % weniger Holz; Bogenschützen +1 Reichweite je Zeitalter ab Ritter; Schäfer +25 % | Langbogenschütze (große Reichweite) | Schießanlage bildet 10 % schneller aus |
| **Teutonen** | Farmen 40 % billiger; Türme doppelt so viel Unterschlupf; Nahkämpfer +1 Nahrüstung je Zeitalter ab Ritter | Deutschordensritter (langsam, schwer) | Einheiten widerstehen Bekehrung |
| **Mongolen** | Jäger +40 %; berittene Bogen schießen 25 % schneller; Späherreiter +30 % Leben | Mangudai (berittener Bogen, Bonus gegen Belagerung) | Späherreiter +2 Sicht |
| **Byzantiner** | Gebäude +10 % Leben je Zeitalter; Speer, Plänkler, Kamel 25 % billiger | Kataphrakt (Reiter mit Bonus gegen Infanterie) | Mönche heilen 50 % schneller |

Ausgewählt, weil jedes Volk einen anderen Weg zum Sieg nahelegt: Reiterei,
Fernkampf, Verteidigung, Beweglichkeit und Zähigkeit. Die Liste darf sich
noch ändern, bis Stufe E beginnt.

## Siegbedingungen

| Art | Bedingung |
| --- | --- |
| Eroberung (Standard) | Alle Einheiten und alle Gebäude außer Mauern, Toren und Farmen des Gegners sind zerstört |
| Wunder | Ein fertiges Wunder steht 200 Jahre Spielzeit (≈ 10 Minuten) |
| Aufgabe | Alle anderen haben aufgegeben |
