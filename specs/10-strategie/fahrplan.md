# Fahrplan zum Klon

**Bereich:** Strategie
**Kuerzel:** fahrplan
**Stand:** 18/24 fertig · 6 offen

## Zweck

Die Stufen von hier bis zu einem spielbaren Klon von Age of Empires II mit fünf
Häusern ([ADR-0014](../../docs/adr/0014-haeuser-statt-voelker.md)) auf einem eigenen Server ([ADR-0012](../../docs/adr/0012-aoe2-als-vorlage.md)).
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
Einstieg → Spielbild → A Dunkel → B Feudal → C Partieende + KI → D Ritter → E Häuser → F Imperial → G Server
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
  **Im Nebel gilt die Ersatzgrenze** (Benutzer, 2026-11-10): spielt die KI
  mit eigener Sicht ([KI](ki.md) AC-13), endet KI gegen KI über die
  Startwerte 1 bis 40 jedes Mal mit Sieger vor Minute 90, im Median vor
  Minute 45, und mindestens 35 von 40 vor Minute 60. Der Nebel kostet sie
  Zeit, weil das Heer suchen muss, was es nicht sieht — das ist der Preis
  der Ehrlichkeit, kein Fehler. Gemessen in Runde 165: 37 von 40, Median
  44,6, die längste 77,9 Minuten.
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
| C6f | Die KI sieht nur ihre Sicht und erkundet mit dem Späher — fertig in Runde 165: der Zweig `strategie-ki-sicht` zusammengeführt, im Nebel gilt die Ersatzgrenze von fahrplan AC-11 | ki AC-13 |
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
| D12 | Bündnis lösen, öffentlich und mit Frist; im Bild mit Knopf und Uhr — **fertig** (Runden 154, 155) | spielziel AC-21, AC-24 |
| D13 | Zeitgrenze und Spielgeschwindigkeit als Einstellung — **fertig** (Runde 159) | spielziel AC-22, AC-23 |
| D14 | Der Marktkarren und sein Handel; die KI handelt — der Karren steht (Runde 160), er handelt (Runde 161), die KI handelt (Runde 162); die sichtbare Ladung wartet auf die neuen Figuren | einheiten AC-39, AC-40, AC-41, ki AC-26 |

**Was ADR-0013 ablöst.** spielziel AC-5 (der Satz über die 90
Spielminuten, mit D13) und spielauswahl AC-20 (die Begründung des Namens
mit „Bündnisse nur am Tisch", mit D10). Beide bleiben `fertig`; die Runde,
die den Nachfolger baut, passt Text, Test und Bild an.

**Die Rückschau zur Stufe D** (Runde 142) hat drei Lücken angelegt, die
die Bauabfolge der Stufe E als ersten Schritt aufnimmt: das Zeitalter am
Dorf, voller Wohnraum oben, Spuren eines Gefechts ([Bedienung](bedienung.md)
AC-42 bis AC-44).

Aus Stufe C nachgeholt in Runde 165: die KI mit eigener Sicht (ki AC-13).
Seitdem misst jeder Schritt KI gegen KI mit ihr, im Nebel mit der
Ersatzgrenze von fahrplan AC-11.

### Stufe E — Häuser

Die Völker der Vorlage sind ersetzt durch fünf Häuser einer eigenen Welt
([ADR-0014](../../docs/adr/0014-haeuser-statt-voelker.md)): Eschenbruch, Rappenstein,
Wehrstein, Silberfurt, Distelhag. Die Technik bleibt die des Mittelalters.
Die vier Stufen heißen im Spiel **Landsitz, Lehen, Fürstentum und Krone**;
in den Specs behalten sie ihre Arbeitsnamen (Dunkle Zeit, Feudal-, Ritter-,
Imperialzeit), Bezeichner und Dateinamen bleiben. Boni, Spezialeinheiten
und Mannschaftsboni stehen in [Spielziel](spielziel.md), „Zu den Häusern".

- **AC-16** `offen` **Fünf Häuser wählbar** — Eschenbruch, Rappenstein,
  Wehrstein, Silberfurt und Distelhag, je mit Boni, einer Spezialeinheit
  aus der Burg und einem Mannschaftsbonus ([Spielziel](spielziel.md)
  AC-16), gewählt im Warteraum je Platz
  ([Spielauswahl](../00-plattform/spielauswahl.md) AC-24). Belegt wie AC-8
  und AC-14: ein Browsertest wählt ein Haus, spielt bis zur Burg, bildet
  dort die Spezialeinheit dieses Hauses aus und zeigt einen Bonus im Bild
  (etwa die Reichweite an der Auswahl).
- **AC-17** `fertig` **Ein Haus ist ein Eintrag** — Ein sechstes Haus entsteht im Test allein aus
  Daten und ist spielbar, ohne dass die Simulation eine Zeile dazubekommt.
  **Fertig in Runde 167:** der Test legt ein Haus „Probe" mit jeder
  Bonusform in `HAEUSER` an und lässt KI 1 es zwanzig Minuten gegen KI 2
  spielen, jeder Takt vom Prüfstand geprüft; Leben, Farmen und Holz zeigen
  den Bonus, und dieselbe Partie ohne Haus verläuft anders.
- **AC-18** `offen` **Kein Haus vorn** — KI gegen KI im Nebel
  (`npm run pruefstand:haeuser`), jede der zehn Paarungen zwanzigmal mit
  abwechselnden Seiten, also 200 Partien: kein Haus gewinnt mehr als 60 %
  seiner 80 Partien, und **keine Paarung endet 16 zu 4 oder weiter** — die
  Paarung zählt, nicht nur das Mittel, denn die Schwerpunkte sitzen auf den
  Ecken des Konterkreises (Schützen schlagen Infanterie, Reiter schlagen
  Schützen; ADR-0014 Punkt 8). Die KI spielt dabei ihr Haus samt
  Spezialeinheit ([KI](ki.md) AC-27, AC-28, AC-31).
  **Neu gefasst in Runde 176**, weil „höchstens 60 % je Paarung" über
  zwanzig Partien den Zufall misst: zwei gleich starke Häuser enden in
  einer von vier Paarungen 13 zu 7 oder weiter, alle zehn Paarungen
  bestünden in rund 5 % der Läufe. 16 zu 4 hat bei gleich starken Häusern
  rund 1 %; die Quote eines Hauses über 80 Partien streut um rund 6
  Punkte, über 60 % kommt ein gleich starkes in rund 3 % — wer die Grenze
  knapp verfehlt, rechnet einen zweiten Satz Startwerte (`--je 40`).
  **Gemessen in Runde 176**, ohne Spezialeinheiten: Eschenbruch 68 von 80
  (85 %), Wehrstein 54 %, Rappenstein 45 %, Silberfurt 34 %, Distelhag
  31 %; Distelhag gegen Eschenbruch 0 zu 20, Silberfurt gegen Eschenbruch
  1 zu 19. Die linke Seite gewinnt 56 bis 60 % — deshalb die abwechselnden
  Seiten. Was die Zahlen allein ändern, steht bei
  [Spielziel](spielziel.md) AC-18.

**Bauabfolge.** Zuerst, was ohne neue Figur geht. Die Figuren der
Spezialeinheiten und der hauseigenen Einheiten, die Wappen und die Spuren
eines Gefechts kommen aus der Blender-Sitzung (seit 2026-11-10); bis sie
eingebunden ist, bleibt `public/figuren.js` unberührt, und eine Einheit ohne
Figur bricht den Wächter „jede Einheit hat eine Zeichnung"
(`tests/waechter-namen.test.mjs`). E6 bis E9 warten deshalb auf die
Figuren, nicht auf die Regeln.

| Schritt | Was | Kriterien |
| --- | --- | --- |
| E1 | Die Stufen heißen nach dem Rang: Landsitz, Lehen, Fürstentum, Krone — alle Texte am Bildschirm, dazu die Tests und Bilder, die sie lesen (`npm run check:alles:neu`) — fertig in Runde 166 | bedienung AC-45 |
| E2 | Ein Haus ist Daten: `HAEUSER` mit Boni in der Form der Verbesserungen, gelesen in `einheitenwert`, beim Sammeln und in `gebaeudewert`; die Wahl im Warteraum (Name und Wahlspruch, noch ohne Wappen) — Daten fertig in Runde 167, die Wahl im Warteraum in Runde 169 — **fertig** | fahrplan AC-17, spielziel AC-17, spielauswahl AC-24 |
| E3 | Die Boni, die eine neue Lesestelle brauchen (Ausbildungszeit, Marktgebühr, Ertrag des Karrens, Reichweite nur für Turm und Burg); jeder Bonus gemessen; der Mannschaftsbonus endet mit dem Bündnis | spielziel AC-16, AC-25, AC-26 |
| E4 | Voller Wohnraum fällt auf (Lücke aus der Rückschau zur Stufe D) | bedienung AC-43 |
| E5 | Die KI neigt zu ihrem Haus | ki AC-27, AC-30 |
| E6 | Häuser schalten Einheiten frei: Langbogenschütze, Pavesenschütze, Söldner — wartet auf die Figuren | einheiten AC-42 bis AC-44 |
| E7 | Spezialeinheiten aus vorhandenen Fähigkeiten: Kriegswölfe, Reiterschütze, Riese — wartet auf die Figuren | einheiten AC-45 bis AC-47 |
| E8 | Der Meuchler mit Tarnung, der Wiedergänger aus Gefallenen — wartet auf die Figuren | einheiten AC-48, AC-49, kampf AC-22 |
| E9 | Wappen, Zeitalter am Dorf, Spuren eines Gefechts — wartet auf die Figuren | bedienung AC-42, AC-44, AC-46 |
| E5b | Die KI antwortet auf das Heer, das sie sieht; kein Haus gewinnt gegen alle (ohne Spezialeinheiten, im Test) — gemessen in Runde 176 mit `npm run pruefstand:haeuser` | ki AC-31, spielziel AC-18 |
| E10 | Die KI bildet ihre Spezialeinheit aus; kein Haus vorn im Prüfstand; die Häuser am Stück im Browser | ki AC-28, fahrplan AC-16, AC-18 |

**Was Stufe E ablöst.** spielauswahl AC-6 (der Satz „das Volk je Spieler
mit Stufe E" als Einstellung) — das Haus kommt je Platz in den Warteraum,
nicht in die Einstellungen; Nachfolger ist spielauswahl AC-24. Fertige
Kriterien und Bildunterschriften, die einen alten Namen der Stufen als
Text am Bildschirm zitieren, zieht die Runde zu E1 nach. Alle bleiben
`fertig`, bis ihr Nachfolger gebaut ist.

### Stufe F — Imperialzeit

- **AC-19** `offen` **Imperialzeit spielbar** — Die Krone (Imperialzeit) mit Wunder und
  Siegbedingung, den Einheitenstufen und Verbesserungen der Vorlage und
  den Elitestufen der fünf Spezialeinheiten (ADR-0014 Punkt 12: eine
  Verbesserung mit `wandelt` in der Burg, wie Soldat die Miliz). **Statt
  des Trebuchets kommt der Drache** (ADR-0014 Punkt 10): er bricht
  Befestigungen aus der Luft und ist eine Einstellung beim Eröffnen, die
  sich abschalten lässt — der Benutzer will ohne Trebuchet spielen können
  (2026-11-09).

**Die Kriterien des Drachen stehen schon** (aus ADR-0014, Spec-Runde zur
Stufe E); jeder Schritt ist für sich spielbar, die Reihenfolge ist die des
ADR. Die Spec-Runde zur Stufe F ordnet sie in ihre Bauabfolge ein.

| Schritt | Was | Kriterien |
| --- | --- | --- |
| Abrüsten | Infanterie, Schützen und Reiter werden Dorfbewohner (Sonderregel, entschieden) | einheiten AC-50 |
| Das Ei | liegt, wird getragen, fällt | einheiten AC-51 |
| Das Ritual | „Drachen rufen" am Kloster, mit Ansage für alle | bauen AC-35 |
| Der Drache | fliegt und brennt; wer ihn treffen kann | einheiten AC-52, kampf AC-23 |
| Tod und Ei | wo er fällt, liegt sein Ei | einheiten AC-53 |
| Fressen | er kostet laufend Nahrung | einheiten AC-54 |
| Die KI | holt Eier, schützt ihr Kloster, ruft, stellt Schützen dagegen | ki AC-29 |
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

- **Eigene Völker und Zeitalter statt der Vorlage** — der Umriss vom
  2026-11-09 (fünf Startvölker der Antike mit Nachfolgevölkern) ist
  **abgelöst durch [ADR-0014](../../docs/adr/0014-haeuser-statt-voelker.md)**: fünf Häuser
  einer eigenen Welt, die Stufen heißen Landsitz, Lehen, Fürstentum und
  Krone (Stufe E oben, Spec-Runde in Runde 164).
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
- **Abrüsten — entschieden** (ADR-0014, Benutzer 2026-11-10): jede Einheit
  aus Infanterie, Schützen und Reitern kann Dorfbewohner werden, nie
  umgekehrt — für 40 Nahrung und 20 Sekunden Lehrzeit, erstattet wird
  nichts. Kriterium: [Einheiten](einheiten-und-befehle.md) AC-50, gebaut
  mit dem Ei in Stufe F.
- **Der Winter — Einfall** (ADR-0014): Farmen bringen mit der Spielzeit
  weniger, das drängt zur Entscheidung. Nicht entschieden: er trifft die
  Wirtschaft der KI, und KI gegen KI muss weiter vor Minute 60 enden.

## Der Prüfstein

Erreicht ist der Fahrplan, wenn **fünf Leute an einem Abend auf dem eigenen
Server zwei Partien mit verschiedenen Häusern spielen und danach eine dritte
wollen.** Das lässt sich nicht testen, nur an einem echten Abend feststellen —
deshalb hat es keine Nummer.
