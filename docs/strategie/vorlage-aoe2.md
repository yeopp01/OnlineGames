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
| Wunder | Imperial | je 1000 Holz, Nahrung, Gold, Stein | 3500 s | 4800 | Sieg nach Zeit |

Was schießt: der **Wachturm** 5 Angriff, Reichweite 8, ein Pfeil alle 2 s,
Rüstung 1/7, Sicht 9; die **Burg** 11 Angriff, Reichweite 8, ein Pfeil alle
2 s, Rüstung 8/11, Sicht 11, vier mal vier Felder. Mit Besatzung schießen
beide mehr Pfeile — der Unterschlupf ist hier nicht gebaut.

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
nach einer Verbesserung).

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
| Kamelreiter | Ritter | 55 N, 60 G | 22 s | 100 | 6 | 0/0 | – | 1,45 | +9 gegen Kavallerie |
| Berittener Bogen | Ritter | 40 H, 70 G | 34 s | 50 | 6 | 0/0 | 4 | 1,4 | |
| Mönch | Ritter | 100 G | 51 s | 30 | – | 0/0 | 9 | 0,7 | bekehrt, heilt |
| Ramme | Ritter | 160 H, 75 G | 36 s | 175 | 2 | 0/180 | – | 0,5 | +125 gegen Gebäude |
| Mangonel | Ritter | 160 H, 135 G | 46 s | 50 | 40 | 0/6 | 7 | 0,6 | Flächenschaden |
| Trebuchet | Imperial | 200 H, 200 G | 50 s | 150 | 200 | 1/150 | 16 | 0,8 | aufbauen, gegen Gebäude |

Der Kreis, auf den es ankommt:

```
Speer  ──schlägt──▶  Reiter  ──schlägt──▶  Bogen  ──schlägt──▶  Speer/Infanterie
Plänkler ──schlägt──▶ Bogen          Mangonel ──schlägt──▶ Haufen von Fernkämpfern
Ramme ──schlägt──▶ Gebäude           Reiter ──schlägt──▶ Belagerung, Mönche
```

## Wichtige Verbesserungen (Auswahl)

| Verbesserung | Ort | Zeitalter | Kosten | Wirkung |
| --- | --- | --- | --- | --- |
| Webstuhl | Dorfzentrum | Dunkel | 50 G | Dorfbewohner +15 Leben, +1/+2 Rüstung |
| Doppelaxt | Holzfällerlager | Feudal | 100 N, 50 H | Holz +20 % |
| Pferdekummet | Mühle | Feudal | 75 N, 75 H | Farmen +75 Nahrung |
| Radkarren | Dorfzentrum | Feudal | 175 N, 50 H | Dorfbewohner +10 % Tempo, +25 % Tragkraft |
| Stadtwache | Dorfzentrum | Feudal | 75 N | Gebäude +4 Sicht |
| Stadtpatrouille | Dorfzentrum | Ritter | 300 N, 100 G | Gebäude +4 Sicht |
| Schmiedeangriff Stufe 1 | Schmiede | Feudal | 100 N | Nah +1 Angriff |
| Befiederte Pfeile | Schmiede | Feudal | 100 N, 50 G | Fern +1 Angriff, +1 Reichweite |
| Belagerung (Soldat → Wache) | Kaserne | Feudal/Ritter | … | Einheitenstufen |

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
