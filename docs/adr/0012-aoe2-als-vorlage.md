# ADR-0012: Age of Empires II ist die Vorlage, gebaut wird in Stufen

**Status:** entschieden; die Zeile „Handelskarren" in „Wird nicht gebaut" ist abgelöst durch [ADR-0013](0013-buendnisse-karren-dauer.md); Stufe E („Fünf Völker als Daten") ist abgelöst durch [ADR-0014](0014-haeuser-statt-voelker.md)
**Datum:** 2026-09-16
**Löst ab:** die Tabelle „Was es ausdrücklich **nicht** wird" in
[`specs/10-strategie/spielziel.md`](../../specs/10-strategie/spielziel.md)
in ihrer Fassung vom 2026-08-28 (2 Rohstoffe, 4 Einheiten, 3 Gebäude).

## Frage

Das Strategiespiel war bewusst klein geschnitten: zwei Rohstoffe, vier
Einheiten, drei Gebäude, fünfzehn Minuten. Das Ziel ist jetzt ein anderes —
ein spielfähiger Klon von Age of Empires II mit vier bis fünf Völkern, auf
einem eigenen Server. Wie groß wird das, und wie kommt man dahin, ohne sich zu
verlaufen?

## Entscheidung

**1. Die Regeln von AoE II sind die Vorlage.** Vier Rohstoffe, Dorfbewohner,
Zeitalter, Rüstungsklassen und Bonusschaden, Gebäude mit
Bevölkerungsplätzen. Wo es eine Frage zu Regeln oder Zahlen gibt, gilt zuerst,
was AoE II tut ([`docs/strategie/vorlage-aoe2.md`](../strategie/vorlage-aoe2.md)).
Abgewichen wird **bewusst und aufgeschrieben**, nie aus Versehen.

**2. Gebaut wird in sieben Stufen.** Jede endet mit einer Partie, die sich von
vorn bis hinten spielen lässt. Eine Stufe gilt erst dann als erreicht, wenn
ihre Stufenkriterien in
[`specs/10-strategie/fahrplan.md`](../../specs/10-strategie/fahrplan.md) auf
`fertig` stehen.

| Stufe | Inhalt |
| --- | --- |
| **A** | Dunkle Zeit: 4 Rohstoffe, Dorfzentrum, Haus, Mühle, Holzfäller- und Bergbaulager, Farm, Schafe und Beeren, Späher, Miliz. Einfache Wirtschafts-KI. |
| **B** | Feudalzeit: Zeitalterwechsel, Kaserne, Schießanlage, Stall, Schmiede, Speer, Bogen, Plänkler, Späherreiter, Rüstung und Bonusschaden |
| **C** | Das Ende einer Partie: Sieg, Aufgeben, Abschlussbild, Nebel des Krieges, **KI-Gegner**, der eine ganze Partie spielt |
| **D** | Ritterzeit: Burg, Ritter, Armbrust, Türme, Palisaden- und Steinmauern, Tore, Markt (nur Tausch) |
| **E** | Fünf Völker als Daten: Boni, eine Spezialeinheit je Volk, ein Mannschaftsbonus |
| **F** | Imperialzeit: Belagerungswerkstatt, Kloster und Mönche, Wunder, die restlichen Verbesserungen |
| **G** | Betrieb auf dem Hetzner-VPS: HTTPS, Neustart, Sicherung ([`specs/20-betrieb/betrieb.md`](../../specs/20-betrieb/betrieb.md)) |

Davor stehen zwei Schritte ohne eigenen Buchstaben, weil beide Stufen tragen:
**der Einstieg** (Spielauswahl und Einstellungen,
[`specs/00-plattform/spielauswahl.md`](../../specs/00-plattform/spielauswahl.md))
und **das Spielbild im Browser** (bisher von keinem Browser gesehen).

**3. Was weiterhin nicht gebaut wird.**

| Wird gebaut | Wird nicht gebaut |
| --- | --- |
| 4 Rohstoffe, Markt zum Tauschen | Handelskarren, Handel über Wasser |
| Land: Infanterie, Fernkampf, Reiter, Belagerung, Mönche | Schiffe, Häfen, Wasserkarten |
| Türme, Mauern, Tore, Burg, Wunder | Helden, Reliquien als Siegbedingung |
| 5 Völker, später mehr; Völker sind Daten | 40 Völker mit je eigenem Technikbaum |
| Zufallskarten mit Startwert, 2 bis 3 Kartentypen | Karteneditor, Kampagnen, Szenarien |
| eigene isometrische Darstellung | Material aus dem Original, Sprachausgabe |
| KI-Gegner in einer Stufe | mehrere KI-Persönlichkeiten |
| Partie am Stück | Speicherstände für Strategiepartien |

Eine Zeile von rechts nach links zu holen ist ein neues ADR.

**4. Eigenes Aussehen, eigener Name.** Grafik, Klänge und Oberfläche des
Originals sind geschützt und werden nicht verwendet, auch nicht „nur zum
Testen". Namen von Völkern, Einheiten und Gebäuden sind historisch und frei
(Franken, Paladin, Trebuchet). „Age of Empires" ist eine Marke und erscheint
nirgends im Spiel. Das Spiel bekommt einen eigenen Namen.

Die Darstellung ist isometrisch und in Code gezeichnet: Gebäude und Einheiten
als Formen mit Schattierung in Volksfarben, erkennbar an ihrer Gestalt. Das
sieht nach einem Spiel aus, aber nicht nach AoE II. Gezeichnete Sprites in der
Qualität des Originals sind nicht das Ziel.

## Was aus der alten Fassung bleibt

- **Der Server rechnet** ([ADR-0001](0001-server-rechnet.md)). Auch mit 200
  Einheiten je Spieler: gebündelte Änderungen statt Vollzustand, Nebel als
  Filter je Spieler. Ob das reicht, wird gemessen, bevor es umgebaut wird.
- **Ein Volk ist Daten** ([spielziel](../../specs/10-strategie/spielziel.md)
  AC-17). Das fünfte Volk kostet weniger als das erste.
- **Kein Zufall im Schaden** ([kampf](../../specs/10-strategie/kampf.md) AC-8).
  AoE II würfelt beim Fernkampf. Hier trifft ein Schuss, wenn das Ziel beim
  Aufprall noch in der Flugbahn steht. Das ist nachvollziehbar und fühlt sich
  trotzdem an wie im Original.
- **Keine Zeile zählt, die nicht gemessen ist.** Gleichgewicht wird über
  Partien ohne Menschen belegt (KI gegen KI im Prüfstand), nicht behauptet.

## Wie gearbeitet wird

Große Teile baut Claude eigenständig in einer Schleife. Die Anweisung dazu
steht in [`.claude/skills/strategie-weiterbauen/`](../../.claude/skills/strategie-weiterbauen/SKILL.md),
was dabei gelernt wird in [`docs/strategie/erkenntnisse.md`](../strategie/erkenntnisse.md).
Die Schleife ändert nichts an der Regel, was `fertig` heißt
([ADR-0011](0011-bildnachweise.md)). Sie pusht nicht und deployt nicht.

## Folgen

- Die Kriterien in `bauen.md`, `kampf.md`, `karte-und-vorraete.md` und
  `spielziel.md` wurden für drei Gebäude und zwei Rohstoffe geschrieben. Sie
  werden **zu Beginn der jeweiligen Stufe** auf die Vorlage umgeschrieben.
  Offene Kriterien bekommen einen neuen Text unter derselben Nummer. Fertige,
  die nicht mehr gelten, werden `zurueckgestellt (abgelöst durch …)`, ihre Tests
  werden angepasst. Nummern werden nie neu vergeben.
- Eine Partie dauert länger: 25 bis 45 Minuten statt 15. Für einen Abend mit
  Freunden heißt das: zwei Partien statt drei. Einstellungen wie
  „Startzeitalter" und „Startrohstoffe" gleichen das aus.
- Sonderregeln, die über AoE II hinausgehen (etwa: im späteren Zeitalter
  fassen Häuser weniger Leute, weil der Anspruch steigt), sind erwünscht. Jede
  wird aber als Kriterium in `fahrplan.md` festgehalten und erst dann gebaut,
  wenn die Stufe, an der sie hängt, spielbar ist.
