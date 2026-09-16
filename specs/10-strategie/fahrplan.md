# Fahrplan zum Klon

**Bereich:** Strategie
**Kuerzel:** fahrplan
**Stand:** 2/22 fertig · 20 offen

## Zweck

Die Stufen von hier bis zu einem spielbaren Klon von Age of Empires II mit fünf
Völkern auf einem eigenen Server ([ADR-0012](../../docs/adr/0012-aoe2-als-vorlage.md)).
Jede Stufe endet mit einer Partie, die sich von vorn bis hinten spielen lässt.

Die Kriterien hier sind **Prüfsteine der Stufen**. Die einzelnen Regeln stehen
in den Fach-Specs ([Bauen](bauen.md), [Kampf](kampf.md), [Karte](karte-und-vorraete.md),
[Bedienung](bedienung.md), [Spielziel](spielziel.md)) und werden dort zu Beginn
der Stufe aus der [Vorlage](../../docs/strategie/vorlage-aoe2.md) geschrieben.

## Abgrenzung

| Gehoert dazu                          | Gehoert nicht dazu                                   |
| ------------------------------------- | ---------------------------------------------------- |
| Reihenfolge der Stufen, Prüfsteine    | einzelne Regeln → die Fach-Specs                     |
| Messungen über viele Partien          | Werte aus dem Original → [Vorlage](../../docs/strategie/vorlage-aoe2.md) |
| Sonderregeln, sobald entschieden      | Arbeitsweise → [Skill](../../.claude/skills/strategie-weiterbauen/SKILL.md) |

## Reihenfolge

```
Einstieg → Spielbild → A Dunkel → B Feudal → C Partieende + KI → D Ritter → E Völker → F Imperial → G Server
```

Eine Stufe beginnt erst, wenn die vorige erreicht ist. Die Ausnahme ist
**G**: HTTPS und Neustart lassen sich jederzeit vorziehen, wenn jemand von
außen mitspielen soll.

## Abnahmekriterien

### Vor den Stufen

- **AC-1** `fertig` **Einstieg führt zur Partie** — Nach dem Anmelden wählt man das Spiel,
  stellt die Partie ein, eröffnet, gibt den Code weiter und startet — in einem
  Browserlauf, ohne Umweg über eine Adresse. Belegt, wenn
  [Spielauswahl](../00-plattform/spielauswahl.md) AC-1 bis AC-11 und AC-13
  `fertig` sind. AC-12 und AC-14 ff. gelten fortlaufenden Spielen und
  Spielständen, nicht dem Strategiespiel.
- **AC-2** `fertig` **Spielbild im Browser gesehen** — Zwei Fenster, Partie gestartet, Einheiten mit
  Rahmen gewählt, per Rechtsklick zum Sammeln geschickt, der Vorrat steigt. Die
  sechs Bedienkriterien auf `in-qa` stehen danach auf `fertig`.

### Stufe A — Dunkle Zeit

- **AC-3** `offen` **Dunkle Zeit spielbar** — Vier Rohstoffe, Dorfzentrum, Haus, Mühle,
  Holzfäller- und Bergbaulager, Farm, Kaserne; Dorfbewohner, Miliz und
  Späherreiter; Schafe, Beeren, Bäume, Gold, Stein. Im Browser gebaut, gesammelt,
  ausgebildet.
- **AC-4** `offen` **Prüfstand ohne Menschen** — `npm run pruefstand:strategie` spielt Partien
  KI gegen KI ohne Browser und prüft jeden Takt auf Widersprüche: kein Vorrat
  unter null, keine Bevölkerung über der Grenze, keine Einheit in einem
  Hindernis, kein Gebäude auf einem anderen.
- **AC-5** `offen` **Die Wirtschaft trägt** — Die Wirtschafts-KI hat nach zehn Spielminuten
  20 bis 30 Dorfbewohner und genug Nahrung für die Feudalzeit. Gemessen über
  zwanzig Startwerte, wie im Original.
- **AC-6** `offen` **Der Takt bleibt billig** — Acht Spieler mit je 100 Einheiten: ein Takt
  rechnet im Mittel unter 10 ms.
- **AC-7** `offen` **Gebäude an Gestalt erkennbar** — Jedes Gebäude und jede Einheit der Stufe
  ist ohne Beschriftung von den anderen zu unterscheiden. Bildnachweis: eine
  Schautafel mit allen nebeneinander, in zwei Volksfarben.

### Stufe B — Feudalzeit

- **AC-8** `offen` **Feudalzeit spielbar** — Zeitalterwechsel mit Voraussetzung und Dauer;
  Schießanlage, Stall, Schmiede; Speer, Bogen, Plänkler; Rüstung nah und fern,
  Bonusschaden.
- **AC-9** `offen` **Der Konterkreis hält** — Im Prüfstand gewinnt bei gleichen Kosten der Konter
  in mindestens 80 % der Gefechte: Speer gegen Reiter, Plänkler gegen Bogen,
  Bogen gegen Speer, Reiter gegen Bogen.
- **AC-10** `offen` **Kein Schlachtenglück** — Gleiche Lage, gleiches Ergebnis: dasselbe Gefecht
  zweimal gerechnet endet Takt für Takt gleich.

### Stufe C — Partieende und KI

- **AC-11** `offen` **KI spielt ganze Partien** — KI gegen KI endet in zwanzig von zwanzig
  Partien mit einem Sieger, in unter 60 Spielminuten.
- **AC-12** `offen` **Mensch gegen KI spielbar** — Eine Partie allein gegen die KI lässt sich
  eröffnen, spielen und mit Abschlussbild beenden.
- **AC-13** `offen` **Nebel auf dem Server** — Ein Spieler erhält nur, was seine Einheiten und
  Gebäude sehen oder gesehen haben (→ [Kampf](kampf.md) AC-13).

### Stufe D — Ritterzeit

- **AC-14** `offen` **Ritterzeit spielbar** — Burg, Kloster, Universität, Belagerungswerkstatt;
  Ritter, Armbrust, Mönch, Ramme, Mangonel; Wachturm, Mauern, Tore, Markt.
- **AC-15** `offen` **Befestigung hält auf** — Im Prüfstand verzögert eine Steinmauer mit Tor
  einen Angriff aus Nahkämpfern messbar. Rammen brechen sie auf.

### Stufe E — Völker

- **AC-16** `offen` **Fünf Völker wählbar** — Franken, Briten, Teutonen, Mongolen, Byzantiner,
  je mit Boni, Spezialeinheit und Mannschaftsbonus, gewählt in den
  Einstellungen.
- **AC-17** `offen` **Ein Volk ist ein Eintrag** — Ein sechstes Volk entsteht im Test allein aus
  Daten und ist spielbar, ohne dass die Simulation eine Zeile dazubekommt.
- **AC-18** `offen` **Kein Volk vorn** — KI gegen KI, jede Paarung zwanzigmal: kein Volk
  gewinnt insgesamt mehr als 60 %.

### Stufe F — Imperialzeit

- **AC-19** `offen` **Imperialzeit spielbar** — Trebuchet, Wunder mit Siegbedingung, die
  Einheitenstufen und Verbesserungen der Vorlage.
- **AC-20** `offen` **Große Partie bleibt flüssig** — Acht Spieler mit je 200 Einheiten: ein Takt
  unter 30 ms im Mittel, je Spieler unter 50 KB Übertragung je Sekunde.

### Stufe G — Server

- **AC-21** `offen` **Läuft auf dem VPS** — Das Spiel ist über HTTPS auf dem Hetzner-VPS
  erreichbar und übersteht einen Neustart der Maschine
  ([Betrieb](../20-betrieb/betrieb.md) AC-1 bis AC-7).
- **AC-22** `offen` **Aktualisieren ist ein Befehl** — Ein Skript bringt den Stand eines Commits
  auf den Server, wartet auf leere Räume und meldet, ob der Dienst wieder läuft.

## Sonderregeln — Ideen, noch nicht entschieden

Hier sammeln sich Einfälle, die über das Original hinausgehen. Ein Einfall
wird zum Kriterium, wenn er entschieden ist und die Stufe, an der er hängt,
spielbar ist. Keine davon wird vorher gebaut.

- **Steigender Anspruch:** Mit jedem Zeitalter fassen Häuser weniger Leute,
  weil der Standard steigt. Folge: späte Wirtschaft braucht mehr Holz, und
  wer früh viele Häuser baut, verliert Platz beim Aufstieg.

## Der Prüfstein

Erreicht ist der Fahrplan, wenn **fünf Leute an einem Abend auf dem eigenen
Server zwei Partien mit verschiedenen Völkern spielen und danach eine dritte
wollen.** Das lässt sich nicht testen, nur an einem echten Abend feststellen —
deshalb hat es keine Nummer.
