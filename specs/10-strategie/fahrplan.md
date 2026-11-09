# Fahrplan zum Klon

**Bereich:** Strategie
**Kuerzel:** fahrplan
**Stand:** 17/24 fertig · 7 offen

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

- **AC-3** `fertig` **Dunkle Zeit spielbar** — Vier Rohstoffe, Dorfzentrum, Haus, Mühle,
  Holzfäller- und Bergbaulager, Farm, Kaserne; Dorfbewohner, Miliz und
  Späherreiter; Schafe, Beeren, Bäume, Gold, Stein. Im Browser gebaut, gesammelt,
  ausgebildet.
- **AC-4** `fertig` **Prüfstand ohne Menschen** — `npm run pruefstand:strategie` spielt Partien
  KI gegen KI ohne Browser und prüft jeden Takt auf Widersprüche: kein Vorrat
  unter null, keine Bevölkerung über der Grenze, keine Einheit in einem
  Hindernis, kein Gebäude auf einem anderen.
- **AC-5** `fertig` **Die Wirtschaft trägt** — Die Wirtschafts-KI hat nach zehn Spielminuten
  20 bis 30 Dorfbewohner und genug Nahrung für die Feudalzeit. Gemessen über
  zwanzig Startwerte, wie im Original.
- **AC-6** `fertig` **Der Takt bleibt billig** — Acht Spieler mit je 100 Einheiten: ein Takt
  rechnet im Mittel unter 10 ms.
- **AC-7** `fertig` **Gebäude an Gestalt erkennbar** — Jedes Gebäude und jede Einheit der Stufe
  ist ohne Beschriftung von den anderen zu unterscheiden. Bildnachweis: eine
  Schautafel mit allen nebeneinander, in zwei Volksfarben.

**Bauabfolge der Stufe A.** Jeder Schritt ist eine bis drei Runden und endet
mit etwas, das im Browser zu sehen ist.

| Schritt | Inhalt | Kriterien |
| --- | --- | --- |
| A1 | Das Spiel erzeugt seine Welt selbst (Schnittstelle aus ADR-0006) | raeume AC-16 |
| A1b | **Figuren statt Punkte** — auf Wunsch des Benutzers vorgezogen: Dorfbewohner, Miliz, Späher als gezeichnete Figuren mit Werkzeug und Ladung, Schautafel | darstellung AC-6, AC-9 (Anfang) |
| A2 | Karte nach Vorlage: Größe, Einzelvorräte, Startausstattung, Schafe, Wegsuche | karte AC-11 bis AC-17, auswahl AC-6 |
| A3 | Isometrischer Blick, Gelände, Vorräte als Dinge | darstellung AC-1 bis AC-3, AC-7 |
| A4 | Vier Rohstoffe sammeln, Abgabe, Werte der Einheiten, Leiste | einheiten AC-15, AC-16, AC-19, bedienung AC-24, AC-17 |
| A5 | Dorfbewohner ausbilden, Bevölkerung, Gebäude zeigt Ausbildung, Startaufstellung | bauen AC-8, AC-10 bis AC-12, AC-14 bis AC-16, AC-22, bedienung AC-26, AC-29 |
| A6 | Bauen: Haus, Lager, Mühle; Platz, Vorschau, mehrere Bauer | bauen AC-1 bis AC-6, bedienung AC-25, AC-15, AC-18, darstellung AC-4, AC-5 |
| A6b | **Gezeichnet statt flach** — auf Wunsch des Benutzers vorgezogen: Figuren, Gebäude, Vorräte und Gras detaillierter, mit Schattierung und Oberflächen | darstellung AC-12 |
| A6c | **Naturalistisch statt Comic** — auf Wunsch des Benutzers vor A8: erst Boden und Schatten, dann Gebäude, dann Figuren mit echten Proportionen; alles unterscheidbar | darstellung AC-13, AC-14 |
| A7 | Schafe, Farm, Kaserne, Miliz, Webstuhl, Sammelpunkt | einheiten AC-17, AC-18, bauen AC-9, AC-13, AC-21, darstellung AC-6, AC-8 |
| A8 | Wirtschafts-KI und Prüfstand | ki AC-1 bis AC-8, fahrplan AC-4, AC-5 |
| A9 | Übersicht und Tempo: Übersichtskarte, Untätige, Tasten, Auswahlliste, viele Einheiten | bedienung AC-6, AC-11, AC-27, AC-28, einheiten AC-20, AC-21, darstellung AC-9, AC-10, fahrplan AC-6, AC-7 |
| A10 | Stufe A am Stück im Browser | fahrplan AC-3 |

**Bauabfolge Stufe B.** Jeder Schritt endet mit etwas im Browser Sichtbarem.

| Schritt | Was | Kriterien |
| --- | --- | --- |
| B1 | **Lücken aus der Rückschau zu Stufe A** schließen: verdeckte Einheiten als Umriss, sichtbare Arbeit, Arbeiter je Rohstoff in der Leiste | bedienung AC-30 bis AC-32 |
| B2 | Zeitalter: Aufstieg im Dorfzentrum mit Kosten, Dauer, Voraussetzung; Anzeige und Meldung | bauen AC-23, bedienung AC-33, spielziel AC-1 |
| B3 | Die drei Gebäude der Feudalzeit: Schießanlage, Stall, Schmiede — gezeichnet und unterscheidbar | bauen AC-24, darstellung AC-14 (erweitert) |
| B4 | Die neuen Einheiten: Speerkämpfer, Bogenschütze, Plänkler, Späherreiter aus dem Stall; Miliz wird Soldat — **fertig** | einheiten AC-23, AC-24 |
| B5 | Kampf: Angreifen, sich wehren, Schaden mit Rüstung und Bonus, Tote, Lebensbalken, Angriffslauf — **fertig** | kampf AC-1 bis AC-10, bedienung AC-34, einheiten AC-25 |
| B6 | Verbesserungen: Schmiede, Doppelaxt, Pferdekummet; die KI steigt auf und baut Militaer — **fertig** | bauen AC-25, AC-26, ki AC-9 |
| B7 | Gleichgewicht messen: Konterkreis im Prüfstand, kein Schlachtenglück; die Feudalzeit am Stück im Browser — **fertig** | fahrplan AC-8 bis AC-10 |

**Was Stufe A ablöst.** Fertige Kriterien der kleinen Fassung bleiben
`fertig`, bis ihr Nachfolger gebaut ist; die Runde, die ihn baut, setzt sie auf
`zurueckgestellt (abgelöst durch …)` und passt Test und Begründung an:
karte AC-2, AC-3, AC-8 (→ karte AC-11, AC-13), einheiten AC-11 (→ einheiten
AC-15). Die bestehenden Tests zu Wegsuche, Sammelschleife und Ersatzfeld
(einheiten AC-6 bis AC-9, AC-12 bis AC-14) gelten weiter und müssen auf der
neuen Karte grün bleiben.

### Stufe B — Feudalzeit

- **AC-8** `fertig` **Feudalzeit spielbar** — Zeitalterwechsel mit Voraussetzung und Dauer;
  Schießanlage, Stall, Schmiede; Speer, Bogen, Plänkler; Rüstung nah und fern,
  Bonusschaden.
- **AC-9** `fertig` **Der Konterkreis hält** — Im Prüfstand gewinnt bei gleichen Kosten der Konter
  in mindestens 80 % der Gefechte: Speer gegen Reiter, Plänkler gegen Bogen,
  Bogen gegen Speer, Reiter gegen Bogen.
- **AC-10** `fertig` **Kein Schlachtenglück** — Gleiche Lage, gleiches Ergebnis: dasselbe Gefecht
  zweimal gerechnet endet Takt für Takt gleich.

### Stufe C — Partieende und KI

- **AC-11** `fertig` **KI spielt ganze Partien** — KI gegen KI endet in zwanzig von zwanzig
  Partien mit einem Sieger, in unter 60 Spielminuten. Gemessen in Runde 97
  über die Startwerte 1 bis 20: alle mit Sieger, nach 24,8 bis 53,3 Minuten,
  Median 33,8 (Runde 92: 4 von 20 vor Minute 60). Getragen von
  [KI](ki.md) AC-16 bis AC-19; die letzte Partie über 60 Minuten war ein
  Verlierer ohne jede Einheit, dessen Gebäude achteinhalb Minuten lang
  geschleift wurden — jetzt gibt er auf. Nach einheiten AC-31 (Runde 100):
  25,7 bis 53,1 Minuten, Median 36,4. **Auf den Startwerten 21 bis 40 sind es
  19 von 20** — vorher wie nachher; die Auswahl der ersten zwanzig trägt mit.
- **AC-12** `fertig` **Mensch gegen KI spielbar** — Eine Partie allein gegen die KI lässt sich
  eröffnen, spielen und mit Abschlussbild beenden. Im Browser gespielt (Runde
  102): mit einem KI-Gegner eröffnet, allein gestartet, Holz gesammelt, und
  die KI gewinnt gegen einen Spieler, der nicht baut, nach rund 22
  Spielminuten (21,1 bis 22,1 auf vier Startwerten); die Tafel nennt sie als
  Sieger. Zehnmal hintereinander grün.
- **AC-13** `fertig` **Nebel auf dem Server** — Ein Spieler erhält nur, was seine Einheiten und
  Gebäude sehen oder gesehen haben (→ [Kampf](kampf.md) AC-13).

**Bauabfolge Stufe C.** Jeder Schritt endet mit etwas im Browser Sichtbarem.

| Schritt | Was | Kriterien |
| --- | --- | --- |
| C1 | **Lücken aus der Rückschau zu Stufe B** schließen: Kampfwerte an der Auswahl, Militär bei Zoom 1 erkennbar, Spielzeit im Bild | bedienung AC-35 bis AC-37 |
| C2 | Partieende rechnet: ausgeschieden, Sieger, Aufgeben, unentschieden nach 90 Spielminuten; der Prüfstand zählt Sieger statt Takte | spielziel AC-5, AC-6, bedienung AC-38 |
| C3 | Abschlussbild mit Zahlen, Zuschauen nach dem Ausscheiden, Revanche aus dem Abschlussbild | spielziel AC-7 bis AC-9 |
| C4 | Die KI kämpft: Heer sammeln, angreifen, zu Hause verteidigen, Nachschub — und auch spät steht niemand herum | ki AC-10 bis AC-12, AC-14, fahrplan AC-11 |
| C5 | Mensch gegen KI: KI-Gegner einstellen, allein eröffnen, eine Partie bis zum Abschlussbild spielen — **fertig** (Runden 101, 102) | spielauswahl AC-18, AC-19, fahrplan AC-12 |
| C6 | Nebel: Sichtweite aus den Daten, Erkundetes bleibt erinnert, der Server schickt nur Sichtbares, Meldung bei Angriff, drei Zustände im Bild, die KI sieht nur ihre Sicht | kampf AC-11 bis AC-14, darstellung AC-15, ki AC-13, fahrplan AC-13 |

**Reihenfolge begründet:** C2 und C3 vor der kämpfenden KI, weil eine Partie
erst enden können muss, bevor jemand sie gewinnt — ohne das Ende misst der
Prüfstand nur Takte. C4 vor C5, weil ein Mensch gegen eine KI, die nicht
angreift, nichts zu tun hat. **C6 (Nebel) zuletzt**, weil er die
Zustandsnachricht umbaut und damit jeden Browsertest berührt: was dort heute
„alles" ist, wird dann „was ich sehe".

**Bauabfolge C6 (Runde 104).** Der Nebel ist mehr als ein Schritt:

| Schritt | Was | Kriterien |
| --- | --- | --- |
| C6a | Die Sicht je Spieler auf dem Server rechnen: jetzt gesehen, je gesehen — **fertig** | kampf AC-15 |
| C6b | Der Nebel im Bild: die eigene Sicht im Browser rechnen, drei Stufen zeichnen, auch auf der Übersichtskarte — **fertig** (Runde 105) | kampf AC-11, AC-12, darstellung AC-15 |
| C6c | Die Sicht als Einstellung beim Eröffnen: Nebel, Erkundet, Aufgedeckt — ersetzt den Prüfgriff `aufdecken` (Wunsch des Benutzers, vorgezogen) — **fertig** (Runde 106) | kampf AC-16 |
| C6d | Die Sicht wächst: Stadtwache im Dorfzentrum, der Außenposten — **fertig** (Runden 107, 109) | kampf AC-17, AC-18 |
| C6e | Nur Sichtbares schicken: eine Zustandsnachricht je Spieler, erinnerte Gebäude — **fertig** (Runde 110) | kampf AC-13, fahrplan AC-13 |
| C6f | Die KI sieht nur ihre Sicht und erkundet mit dem Späher — ruht: gebaut auf dem Zweig `strategie-ki-sicht`, KI gegen KI zu lang, Frage an den Benutzer (Runden 112, 114, 144) | ki AC-13 |
| C6g | Angriff wird gemeldet, ein Klick springt hin — **fertig** (Runde 115) | kampf AC-14 |

### Stufe D — Ritterzeit

- **AC-14** `fertig` **Ritterzeit spielbar** — Burg, Kloster, Universität, Belagerungswerkstatt;
  Ritter, Armbrust, Mönch, Ramme, Mangonel; Wachturm, Mauern, Tore, Markt.
  Belegt wie die Feudalzeit (AC-8): ein Browsertest spielt den Aufstieg, baut
  jedes neue Gebäude, bildet jede neue Einheit aus und misst einen Schlag.
  Gebaut in Runde 140 (`e2e/tests/strategie-ritterzeit-am-stueck.spec.mjs`):
  Gebäude und Einheiten kommen aus den Daten — jedes Gebäude der Ritterzeit
  und aus der Feudalzeit, was AC-8 auslässt, weil es nicht ausbildet; jede
  Einheit auf Zeitalter 2, der Armbrustschütze über die Verbesserung, die
  ihn eintauscht. Die Mauer wird gezogen, das Tor auf sie gesetzt. Der
  Schlag: eine Ramme auf ein fremdes Haus, 127 Leben.
- **AC-15** `fertig` **Befestigung hält auf** — Im Prüfstand verzögert eine Steinmauer mit Tor
  einen Angriff aus Nahkämpfern messbar. Rammen brechen sie auf. Gemessen
  in der Belagerung (`belagerungSpielen`, Runde 139): zehn Soldaten nehmen
  ein freies Dorfzentrum in 88 bis 98 Sekunden, hinter einem Ring zwei
  Felder vor dem Rand erst in 178 bis 263 — verlangt ist je Startwert
  mindestens eine Minute. Zehn Soldaten mit zwei Rammen schaffen es in
  jedem Startwert vor sechzehn Soldaten, die dasselbe kosten.
- **AC-23** `fertig` **Der Konterkreis der Ritterzeit** — Im Gefechtsstand bei
  gleichen Kosten, je zwanzig Startwerte, in beiden Richtungen: Speer gegen
  Ritter, Mangonel gegen einen Haufen Bogenschützen, Ritter gegen Mangonel
  gewinnen in mindestens 80 %, umgekehrt so gut wie nie (wie AC-9). Das
  Budget ist 1200 statt 600, weil der Mangonel 295 kostet und zwei Steine
  gegen acht Bogenschützen kein Haufen sind. Der Haufen zählt: ein Stein
  trifft im Mittel mehr als einen Gegner — sonst gewönne der Mangonel nur
  über seine Fernrüstung.
- **AC-24** `fertig` **Zwei gegen zwei zu Ende** — Im Browser: ein
  Mensch und eine KI gegen zwei KIs, eröffnet mit Teams, gespielt bis zur
  Tafel, die das siegreiche Team nennt (wie AC-12). Im Prüfstand endet KI
  gegen KI zu zweit gegen zwei über zwanzig Startwerte mit einem Sieger,
  jede Partie vor Minute 90. Das ist die Dauer, die der Benutzer für eine
  Partie nennt; die Grenze für Tests legt die Schleife fest
  ([ADR-0013](../../docs/adr/0013-buendnisse-karren-dauer.md)).
  Der Prüfstand steht seit Runde 151 (`tests/partien/strategie-team-*.test.mjs`):
  20 von 20 entschieden, Minute 35,4 bis 52,4, Median 39,6, beide Teams
  gewinnen. Der Browserfall steht seit Runde 153
  (`e2e/tests/strategie-team-gegen-ki.spec.mjs`): Anna und KI 1 gegen KI 2
  und KI 3, Startwert 4711, Team 2 gewinnt nach 32,5 Spielminuten — ohne
  Browser auf neun Startwerten jedes Mal Team 2, nach 28,6 bis 33,9
  Minuten. Mit der KI von vor ki AC-25 endet dieselbe Partie nicht vor
  Minute 90.

**Bauabfolge Stufe D.** Jeder Schritt endet mit etwas im Browser Sichtbarem.

| Schritt | Was | Kriterien |
| --- | --- | --- |
| D1 | **Lücken aus der Rückschau zu Stufe C**: wer kämpft, holt aus; Pfeile fliegen sichtbar; Ansagen nicht auf der Mitte — **fertig** (Runden 118, 119) | bedienung AC-39 bis AC-41 |
| D2 | Aufstieg in die Ritterzeit; Kloster, Universität, Werkstatt gezeichnet und im Menü — **fertig** (Runde 122) | bauen AC-27, AC-28 |
| D3 | Ritter und Armbrust; die Verbesserungen der Ritterzeit — **fertig** (Runden 123, 124) | einheiten AC-33, AC-34, bauen AC-34 |
| D4 | Wachturm und schießende Gebäude — **fertig** (Runde 125) | bauen AC-29, kampf AC-20 |
| D5 | Steinmauer ziehen (**fertig**, Runde 127), Tor für Eigene (**fertig**, Runde 128); Mauern halten auf (**fertig**, Runde 139) | bauen AC-30, AC-31, kampf AC-21 |
| D6 | Belagerung: Ramme gegen Gebäude (**fertig**, Runde 129), Mangonel mit Flächenschaden (**fertig**, Runde 130) | einheiten AC-35, AC-36, kampf AC-19 |
| D7 | Burg (**fertig**, Runde 132) und Markt (**fertig**, Runde 133) | bauen AC-32, AC-33 |
| D8 | Mönch: heilen (**fertig**, Runde 134), bekehren (**fertig**, Runde 135) | einheiten AC-37, AC-38 |
| D9 | Die KI in der Ritterzeit; Konterkreis (**fertig**, Runde 138) und Befestigung (**fertig**, Runde 139) im Prüfstand; die Ritterzeit am Stück im Browser (**fertig**, Runde 140) | ki AC-21, AC-22, fahrplan AC-14, AC-15, AC-23 |

**Bündnisse, Karren, Dauer** ([ADR-0013](../../docs/adr/0013-buendnisse-karren-dauer.md),
Runde 145) kommen noch in Stufe D. Sie stehen vor den Völkern, weil jede
Regel danach schon „Gegner oder nicht" fragen soll statt „mir oder nicht
mir":

| Schritt | Was | Kriterien |
| --- | --- | --- |
| D10 | Teams im Warteraum, Verbündete kämpfen nicht, gemeinsame Sicht — **fertig** (Runde 149) | spielauswahl AC-22, spielziel AC-14, AC-19 |
| D11 | Ein Team gewinnt; die KI im Team; zwei gegen zwei im Prüfstand und im Browser — **fertig** (Runde 153) | spielziel AC-20, ki AC-25, fahrplan AC-24 |
| D12 | Bündnis lösen, öffentlich und mit Frist | spielziel AC-21 |
| D13 | Zeitgrenze und Spielgeschwindigkeit als Einstellung | spielziel AC-22, AC-23 |
| D14 | Der Marktkarren und sein Handel; die KI handelt | einheiten AC-39, AC-40, ki AC-26 |

**Was ADR-0013 ablöst.** spielziel AC-5 (der Satz über die 90
Spielminuten, mit D13) und spielauswahl AC-20 (die Begründung des Namens
mit „Bündnisse nur am Tisch", mit D10). Beide bleiben `fertig`; die Runde,
die den Nachfolger baut, passt Text, Test und Bild an.

**Die Rückschau zur Stufe D** (Runde 142) hat drei Lücken angelegt, die
die Bauabfolge der Stufe E als ersten Schritt aufnimmt: das Zeitalter am
Dorf, voller Wohnraum oben, Spuren eines Gefechts ([Bedienung](bedienung.md)
AC-42 bis AC-44).

Offen aus Stufe C und gebaut auf dem Zweig `strategie-ki-sicht`: die KI mit
eigener Sicht (ki AC-13) — wartet auf die Antwort zu fahrplan AC-11. Wird sie
eingebunden, misst jeder Schritt ab D9 KI gegen KI mit ihr.

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
  Einheitenstufen und Verbesserungen der Vorlage. **Das Trebuchet ist eine
  Einstellung beim Eröffnen und lässt sich abschalten** — der Benutzer will
  ohne es spielen können (2026-11-09).
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
  wer früh viele Häuser baut, verliert Platz beim Aufstieg. **Ergänzt
  (Benutzer, 2026-11-09):** ein Haus lässt sich ausbauen und fasst danach
  wieder mehr — der Ausbau ist ein Auftrag am Haus, sofort bezahlt.

Vom Benutzer am 2026-11-09 eingebracht, alle noch offen:

- **Eigene Völker und Zeitalter statt der Vorlage — entschieden, Umriss.**
  Fünf Startvölker der Antike (etwa Römer, Ägypter, Germanen, Griechen,
  ein asiatisches Volk), die sich mit den Zeitaltern zu **echten
  Nachfolgevölkern** weiterentwickeln. Die Nachfolger eines Volkes sind eng
  verwandt: Unterschiede vor allem über **Boni**, nur **ganz wenige
  Spezialeinheiten**; ein Nachfolger kann in der Imperialzeit anderes bauen
  oder eine Einheit einmal öfter verbessern. Stärkere Startboni. Die
  Zeitalter heißen eigen, etwa Antike, Blütezeit, Kriegszeit,
  Herrschaftszeit. Ersetzt die fünf Völker der Vorlage in AC-16 — kommt mit
  einem neuen ADR und der Spec-Runde zu Stufe E.
- **Bauen ohne Bauer zu wählen:** ein Gebäude setzen (oder einen Ausbau
  bestellen) und bezahlen; der nächste freie Dorfbewohner in der Nähe kommt
  und baut. Selbst Bauer schicken geht weiter.
- **Eine Übersicht der Wirtschaft:** wer wo sammelt, wer frei ist, wer baut.
- **Die Bevölkerungsgrenze beweglich statt starr 200:** getrennter Wohnraum
  für Dorfbewohner und Soldaten (etwa ein Haus mit drei Plätzen für
  Bewohner und zwei für Soldaten, ein anderes nur für Soldaten); oder eine
  Grenze, die alle zehn Minuten sinkt und sich mit Gold wieder anheben lässt.
  **Favorit des Benutzers (2026-11-09): Sold in Nahrung** — jede
  Kampfeinheit kostet laufend Nahrung, die Wirtschaft begrenzt das Heer.
  Vorschlag der Schleife zum leeren Vorrat: nur Kampfeinheiten zahlen,
  Dorfbewohner nie (sonst verhungert die Wirtschaft, die das Essen
  liefert, und wer zurückliegt, kommt nie wieder hoch — spielziel AC-4);
  ist die Nahrung bei null, **hungert das Heer**: jede Kampfeinheit
  verliert langsam Leben, heilt nicht, und oben steht es rot; sobald
  wieder Nahrung da ist, hört es auf. Die Höhe des Solds wird gemessen,
  nicht geschätzt (wie viele Soldaten trägt ein Bauer?).
- **Bündnisse, die sich lösen lassen — entschieden in
  [ADR-0013](../../docs/adr/0013-buendnisse-karren-dauer.md) (Runde 145).**
  Dazu Marktkarren ab der Ritterzeit, Zeitgrenze und Spielgeschwindigkeit
  als Einstellung. Bauabfolge D10 bis D14 oben in Stufe D.

## Der Prüfstein

Erreicht ist der Fahrplan, wenn **fünf Leute an einem Abend auf dem eigenen
Server zwei Partien mit verschiedenen Völkern spielen und danach eine dritte
wollen.** Das lässt sich nicht testen, nur an einem echten Abend feststellen —
deshalb hat es keine Nummer.
