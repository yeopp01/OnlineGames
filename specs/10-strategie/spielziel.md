# Spielziel und Partieverlauf

**Bereich:** Strategie
**Kuerzel:** spielziel
**Stand:** 13/26 fertig · 1 in Arbeit · 12 offen

## Zweck

Was für ein Spiel das hier werden soll — und woran man merkt, dass es fertig
ist. Diese Spec ist die Klammer über [Bauen](bauen.md), [Kampf](kampf.md),
[Einheiten](einheiten-und-befehle.md) und [Karte](karte-und-vorraete.md).

## Die Idee in drei Sätzen

Zwei bis acht Leute spielen eine Partie nach den Regeln von Age of Empires II:
Dorfbewohner sammeln vier Rohstoffe, die Siedlung steigt durch die Zeitalter
auf, jedes Haus hat seine Stärken. Wer die anderen erobert, gewinnt. Gebaut
wird in Stufen ([Fahrplan](fahrplan.md)), jede endet mit einer spielbaren
Partie.

## Was ausdrücklich **nicht** gebaut wird

Die Tabelle steht in [ADR-0012](../../docs/adr/0012-aoe2-als-vorlage.md) und
löst die frühere Fassung (2 Rohstoffe, 4 Einheiten, 3 Gebäude, 15 Minuten) ab.
Das Wichtigste daraus: **keine Schiffe, kein Handel über Karren, keine
Kampagnen, kein Karteneditor, kein Material aus dem Original, keine 40 Völker.**
Eine Zeile von dort hierher zu holen ist ein neues ADR.

Der Reiz eines Strategiespiels steckt weiterhin in der Entscheidung „noch ein
Dorfbewohner oder schon Soldaten?" — nicht in der Anzahl der Einheitentypen.
Jede Stufe wird daran gemessen, ob sie neue Entscheidungen bringt.

## Zu den Häusern

Statt historischer Völker streiten fünf Häuser einer eigenen Welt um die
Krone ([ADR-0014](../../docs/adr/0014-haeuser-statt-voelker.md)). Was ein Haus kostet,
hängt allein daran, wie viel **eigenes** daran hängt:

| Ein Haus als …                                | Kostet        |
| --------------------------------------------- | ------------- |
| Name, Wappen, Wahlspruch und Boni als Zahlen  | einen Nachmittag |
| dazu eine Spezialeinheit aus vorhandenen Fähigkeiten | einen Tag und eine Figur |
| eigener Technikbaum und eigene Mechaniken     | Wochen        |

Deshalb bekommen die fünf Häuser Boni und eine Spezialeinheit, aber keinen
eigenen Technikbaum. Jedes Haus kann alles bauen, was es gibt; nur ein paar
Einheiten bildet nicht jedes Haus aus ([Einheiten](einheiten-und-befehle.md)
AC-42 bis AC-44).

| Haus | Sitz | Wappen | Wahlspruch |
| --- | --- | --- | --- |
| **Eschenbruch** | Waldland | Esche | „Weit sehen, weit treffen." |
| **Rappenstein** | Grasland | Hengst | „Zuerst am Ziel." |
| **Wehrstein** | Gebirge | Turm | „Stein vergisst nicht." |
| **Silberfurt** | Flussstadt | Waage | „Alles hat seinen Preis." |
| **Distelhag** | Heide | drei Disteln | „Wer uns greift, blutet." |

| Haus | Schwerpunkt | Boni | Spezialeinheit (Burg) | Mannschaftsbonus |
| --- | --- | --- | --- | --- |
| Eschenbruch | Fernkampf, Holz | Holz +15 %; Schützen +1 Reichweite | Kriegswölfe | Schießanlagen der Verbündeten bilden 20 % schneller aus |
| Rappenstein | Reiterei, Tempo | Reiter +15 Leben; Reiter sehen 2 Felder weiter | Reiterschütze | Reiter der Verbündeten sehen 2 Felder weiter |
| Wehrstein | Befestigung, Stein | Stein +15 %; Gebäude +10 % Leben; Turm und Burg +1 Reichweite | Riese | Gebäude der Verbündeten sehen 2 Felder weiter |
| Silberfurt | Handel, Gold | Marktgebühr 15 % statt 30 %; Karren +20 % Gold | Meuchler | Karren zwischen Verbündeten bringen 20 % mehr |
| Distelhag | Infanterie | Infanterie +1 Rüstung gegen Hieb und Pfeil; Farmen +45 Nahrung | Wiedergänger | Kasernen der Verbündeten bilden 20 % schneller aus |

Alle Zahlen sind **Startwerte** (ADR-0014) und werden im Prüfstand
eingestellt wie der Faktor des Marktkarrens. Das Wappen ist ein Zeichen,
keine Farbe: die Farbe gehört dem Platz, und zwei Spieler dürfen dasselbe
Haus wählen. Kein Haus für den Glauben — fünf waren gewollt, und den Mönch
spielt die KI am schlechtesten.

## Abnahmekriterien

### Partieverlauf

- **AC-1** `in-arbeit` **Zeitalter gliedern die Partie** — (Im Spiel: Landsitz, Lehen, Fürstentum, Krone.) Dunkle Zeit, Feudal-, Ritter- und
  Imperialzeit. Jeder Aufstieg kostet und dauert, und er öffnet neue Gebäude und
  Einheiten. Wann man aufsteigt, ist eine Entscheidung, keine Pflicht.
  **Stand:** die vier Zeitalter und alle drei Aufstiege rechnen und sind im Bild
  zu bedienen ([Bauen](bauen.md) AC-23, [Bedienung](bedienung.md) AC-33), und
  der Aufstieg in die Feudalzeit öffnet drei Gebäude und mit dem Stall eine
  Einheit (AC-24). Noch nicht `fertig`, weil Ritter- und Imperialzeit nichts
  öffnen — das kommen Stufe D und F. **Die Arbeitswahl nimmt es nicht auf:** es
  wird mit D und F fertig, nicht in einer eigenen Runde; `in-arbeit` steht hier
  für „über Stufen hinweg im Bau".
- **AC-2** `offen` **Partiedauer 25 bis 45 Minuten** — Mit Standardeinstellungen, gemessen
  über zehn Partien mit echten Spielern. Einstellungen wie Startzeitalter und
  Startrohstoffe verkürzen sie für einen Abend mit mehreren Partien.
- **AC-3** `offen` **Kein Aus nach drei Minuten** — Ein Angriff in den ersten fünf Minuten
  darf einen Spieler nicht ausschalten. Wer früh verliert, sitzt zwölf
  Minuten daneben — das killt den Abend.
- **AC-4** `offen` **Aufholen ist möglich** — Ein Spieler mit halb so vielen Einheiten muss noch
  gewinnen können, wenn er besser spielt. Ohne das gibt es keinen Grund,
  weiterzuspielen.

### Sieg und Ende

- **AC-5** `fertig` **Sieg durch Eroberung** — **Ausgeschieden** ist, wer keine
  Einheit und kein Gebäude außer Mauern, Toren und Farmen mehr hat. Bleibt
  einer übrig, endet die Partie sofort und alle bekommen dasselbe Ergebnis.
  Entschieden wird das auf dem **Server**, in demselben Takt, in dem der letzte
  Verlust abgerechnet wird — nicht im Browser. Steht nach **90 Spielminuten**
  noch keine Entscheidung, endet die Partie unentschieden; der Prüfstand zählt
  das als eigenen Ausgang (→ [KI](ki.md), Grenzfälle).
- **AC-6** `fertig` **Aufgeben ist möglich** — Ein Spieler kann aufgeben: seine
  Einheiten und Gebäude fallen, er gilt als ausgeschieden (AC-5), und die
  Partie läuft für die anderen weiter. Gibt der Vorletzte auf, gewinnt der
  Letzte — Aufgeben ist kein eigener Ausgang, sondern ein schneller Weg in
  AC-5. Der Bildschirm dazu ist [Bedienung](bedienung.md) AC-38.
- **AC-7** `fertig` **Verlierer bleiben Zuschauer** — Wer ausgeschieden ist,
  sieht die Partie weiterlaufen, statt auf einen leeren Bildschirm zu schauen.
  Er bekommt weiter jeden Zustand, im Bild steht, dass er ausgeschieden ist,
  und die Kamera springt zu einem, der noch spielt — sonst sähe er auf den
  leeren Platz, wo eben sein Dorf stand.
- **AC-8** `fertig` **Abschlussbild mit Zahlen** — Am Ende sehen alle dieselbe
  Tafel: je Spieler gesammelte Rohstoffe, ausgebildete Einheiten, Verluste,
  erreichtes Zeitalter, dazu Sieger und Dauer der Partie. Der Stoff, aus dem
  Revanchen entstehen. Die Zahlen zählt der Server über die ganze Partie mit,
  damit sie auch für einen stimmen, der früh ausgeschieden ist.
- **AC-9** `fertig` **Revanche mit einem Klick** — Vom Abschlussbild aus startet dieselbe Runde neu,
  ohne dass jemand einen Code neu eintippen muss. Die Revanche ist **ein
  zweiter Start desselben Raums**: dieselben Leute, dieselben Einstellungen,
  eine neue Welt. Sie liegt am **Raum**, nicht am Spiel — der Raum weiß nur,
  dass die Welt `vorbei` sagt (ADR-0006). Der Startwert der Karte ist eine
  Einstellung wie jede andere: steht er auf „zufällig", ist die Karte neu;
  steht eine Zahl, spielen alle dieselbe Karte noch einmal. Wer in der letzten
  Partie die Verbindung verloren hat, spielt nicht mit — ein Platz, an dem
  niemand sitzt, wäre ein Gegner, der nichts tut.

### Gleichgewicht

- **AC-10** `offen` **Kein Zug ist immer richtig** — Es gibt keine Eröffnung, die gegen alles
  funktioniert. Belegt durch Partien, nicht durch Behauptung.
- **AC-11** `offen` **Rein sammeln verliert** — Wer nur Wirtschaft baut und keine Truppen, verliert
  gegen einen frühen Angriff. Sonst gibt es keine Spannung.
- **AC-12** `offen` **Rein angreifen verliert auch** — Wer sofort alles auf Truppen setzt, verliert
  gegen einen, der aufbaut, falls der Angriff nicht durchkommt.

### Zu mehreren

- **AC-13** `offen` **Zwei bis acht Spieler** — Die Partie funktioniert mit jeder Zahl zwischen
  zwei und acht, ohne dass Werte von Hand angepasst werden; die Karte wächst
  mit.
- **AC-16** `offen` **Fünf Häuser mit Profil** — Jedes mit den Boni, der
  Spezialeinheit und dem Mannschaftsbonus aus „Zu den Häusern", die einen
  eigenen Weg zum Sieg nahelegen (→ [Fahrplan](fahrplan.md) AC-16). Die
  Boni bleiben klein, 10 bis 20 %, damit nicht die Hauswahl die Partie
  entscheidet (ADR-0014 Punkt 8).
- **AC-17** `fertig` **Ein Haus ist Daten** — Ein neues Haus entsteht durch einen Eintrag
  in einer Tabelle, nicht durch eine Verzweigung in der Simulation. Ein
  Bonus hat die Form, die eine Verbesserung schon hat (`wirkung` je Klasse,
  `sammeln` als Faktor, `gebaeude`), und gilt von Beginn an; gelesen wird er
  dort, wo die Verbesserungen gelesen werden (`welt.einheitenwert`,
  `welt.gebaeudewert`). Sonst wird das fünfte Haus teurer als das erste
  statt billiger.
  **Fertig in Runde 167:** `HAEUSER` in `daten.js`, das Haus je Spieler als
  Einstellung `haeuser: { <spielerId>: <haus> }` (wie `teams`), und eine
  Stelle `welt.wirkungen()`, die die Boni des Hauses vor die erforschten
  Verbesserungen stellt; `einheitenwert`, `gebaeudewert`, `sammelrate` und
  `farmNahrung` lesen nur noch sie. Silberfurt hat bis E3 keinen Bonus —
  seine beiden brauchen eine neue Lesestelle (AC-26). Belegt in
  `tests/strategie-haeuser.test.mjs`, der jeden Bonus aus den Daten liest.
- **AC-18** `offen` **Kein Haus gewinnt gegen alle** — Über zwanzig Partien je Paarung liegt
  keines dauerhaft vorn (→ Fahrplan AC-18). Belegt durch Partien, nicht
  durch Behauptung.
- **AC-25** `offen` **Mannschaftsbonus nur im Bündnis** — Der Mannschaftsbonus
  eines Hauses gilt für es selbst und für alle, mit denen es die Sicht
  teilt (`welt.teiltSicht`) — zwei Verbündete desselben Hauses bekommen ihn
  einmal, nicht doppelt. Wer kündigt, verliert mit der gemeinsamen Sicht im
  selben Takt den Bonus seiner Verbündeten, und sie den seinen: in der
  Frist ist man kein Gegner, aber auch kein Verbündeter mehr (ADR-0014
  Punkt 6). Belegt an einer Schießanlage, die nach der Kündigung im
  nächsten Auftrag wieder langsamer ausbildet.
- **AC-26** `offen` **Jeder Bonus wirkt** — Für jeden Bonus jedes Hauses gibt es
  eine Messung gegen ein Haus ohne ihn: dieselbe Lage, ein Wert verschieden
  (Holz je Minute, Reichweite, Leben, Sicht, Ausbildungszeit, Gebühr, Gold
  je Fahrt, Nahrung je Farm). Der Test liest die Boni aus den Daten, keine
  Liste im Testkopf. Eine neue Lesestelle brauchen Ausbildungszeit,
  Marktgebühr, Ertrag des Karrens und die Reichweite nur für Turm und Burg
  (ADR-0014 Punkt 4); ob `gebaeudewert` einen Bonus je Gebäudeart trägt,
  ist dabei zu prüfen.
- **AC-14** `fertig` **Verbündete kämpfen nicht** — Spieler desselben Teams
  ([Spielauswahl](../00-plattform/spielauswahl.md) AC-22) sind Verbündete.
  Ein Rechtsklick auf einen Verbündeten ist ein Gang dorthin. Wachende
  Einheiten und schießende Gebäude lassen ihn in Ruhe, Tore öffnen sich für
  ihn. Flächenschaden trifft ihn wie die eigenen Einheiten ([Kampf](kampf.md) AC-19).
  Gefragt wird an **einer** Stelle der Welt (`welt.feindlich(a, b)`), nicht
  in jeder Regel einzeln; heute fragt jede Regel nur „mir oder nicht mir".
  **Stand Runde 146:** gebaut in der Welt, belegt im Rechenteil
  (`tests/strategie-buendnisse.test.mjs`, Teams als Einstellung
  `teams: { <spielerId>: 1..4 }`); der Browser fragt dieselbe Frage mit
  dem Team aus dem Aufbau. **Runde 148:** die Teams kommen aus dem
  Warteraum (spielauswahl AC-22), und das Bild zeigt den Rechtsklick auf
  einen Verbündeten mit weißem Zeichen (`e2e/tests/strategie-buendnisse.spec.mjs`).
  Ein Wächter (`tests/waechter-feindlich.test.mjs`)
  verbietet in den Kampfregeln jeden Vergleich mit dem Besitzer.
  Bis Runde 144 hieß AC-14 „Bündnisse sind nicht vorgesehen". Der Benutzer
  spielt aber meist zwei gegen zwei ([ADR-0013](../../docs/adr/0013-buendnisse-karren-dauer.md)).
- **AC-15** `offen` **Ein Aussteiger blockiert nicht** — Verlässt jemand die Partie endgültig,
  verfallen seine Gebäude nach zwei Minuten, damit die Runde ein Ende findet.
- **AC-19** `fertig` **Verbündete sehen gemeinsam** — Was einer sieht, sehen
  alle seines Teams: im Bild, auf der Übersichtskarte und in dem, was der
  Server schickt (kampf AC-13). Das gilt ohne Forschung; in der Vorlage
  kostete es die Forschung „Kartographie".
  **Runde 149:** ein Team hat auf dem Server **einen** Satz Sichtfelder
  (`welt.sichten` zeigt für jedes Mitglied auf dasselbe Objekt), deshalb
  gilt jede Frage nach der Sicht von selbst fürs Team, und die Rechnung
  kostet nicht mehr (KI gegen KI Takt für Takt gleich, 83 statt 84 ms je
  1000 Takte). Einheiten und Gebäude der Verbündeten gehen immer über die
  Leitung, auch ihr Verschwinden. Der Browser zählt sie in `public/nebel.js`
  mit, mit der Sicht aus den Werten ihres Besitzers.
- **AC-20** `fertig` **Ein Team gewinnt** — Die Partie endet, sobald nur noch
  Verbündete übrig sind. Gewonnen haben alle Spieler dieses Teams, auch die
  schon ausgeschiedenen. Die Tafel (AC-8) nennt das Team und seine Spieler.
  Wer sein Bündnis gelöst hat (AC-21), gehört keinem Team mehr an.
  **Runde 150:** `welt.endePruefen` fragt `feindlich` statt „einer bleibt
  übrig"; das Ende trägt `gewinner` (alle des Teams), `team` und — nur bei
  genau einem Gewinner — `sieger` wie bisher. Über dem Bild steht für das
  Team „Ihr habt gewonnen — Team 1: Anna und Cem", für die anderen „Team 1
  hat gewonnen — Anna und Cem"; die Tafel hebt jede Zeile der Gewinner
  hervor. Stehen alle in einem Team, entscheidet keine Eroberung — sonst
  endete die Partie im ersten Takt (`welt.mitGegnern`).
- **AC-21** `fertig` **Bündnis lösen mit Frist** — Nur bei „lösbar"
  (spielauswahl AC-22): ein Spieler kündigt sein Bündnis. Er tritt damit
  aus seinem Team aus — gegenüber allen Verbündeten zugleich, denn „wer sein
  Bündnis gelöst hat, gehört danach keinem Team mehr an" (ADR-0013, Punkt
  4); zu zweit im Team ist das dasselbe wie einem Verbündeten zu kündigen.
  Die gemeinsame Sicht endet sofort, gekämpft werden darf erst nach Ablauf
  der Frist von 60 Sekunden. Gekündigt wird in beide Richtungen,
  zurücknehmen lässt es sich nicht. Die Kündigung ist öffentlich: jeder
  Spieler bekommt sie mit ihrem Ende. Solange eine Frist läuft, endet die
  Partie nicht als Sieg eines Teams — sonst gewänne, wer gekündigt hat, mit
  dem Team, das er verlassen hat. Bei „fest" weist der Server die
  Nachricht ab. Die Frist gibt es, damit das Lösen kein Überfall aus dem
  Hinterhalt wird. Das Bild dazu ist AC-24 (Runde 154 geteilt).

### Dauer

- **AC-22** `fertig` **Zeitgrenze ist eine Einstellung** — Beim Eröffnen:
  keine, 90 oder 120 Spielminuten, Vorgabe **keine**. Fällt nach Ablauf der
  Grenze keine Entscheidung, endet die Partie unentschieden, wie heute nach
  90 Minuten (AC-5). Prüfstand, Tests und KI gegen KI geben ihre Grenze
  ausdrücklich mit. Der Benutzer: „wenn ich mit echten spiele, dann soll das
  auch länger dauern dürfen" ([ADR-0013](../../docs/adr/0013-buendnisse-karren-dauer.md)).
  **Stand Runde 157:** die Einstellung `zeitgrenze` im Steckbrief, in der
  Welt `welt.zeitgrenze` (nur 90 oder 120, alles andere heißt keine;
  `ZEITGRENZEN` in `welt.js`). Mit dem Aufbau geht sie an den Browser; oben
  steht sie hinter der Uhr („89:45 / 90:00"), am Ende „Unentschieden — 90
  Minuten sind um". Der Prüfstand hatte seine Grenze schon immer als
  `minuten` und bricht dort selbst ab; die Tests zu AC-5 und AC-20 geben
  `zeitgrenze: 90` mit. Belegt in `tests/strategie-partieende.test.mjs`, im
  Bild `e2e/tests/strategie-zeitgrenze.spec.mjs` (die Uhr stellt der
  Prüfgriff `uhr` vor).
- **AC-23** `fertig` **Spielgeschwindigkeit ist eine Einstellung** — 1,0, 1,5
  oder 2,0, Vorgabe 1,0. Eine Spielsekunde bleibt zehn Takte; schneller
  heißt, der Raum rechnet mehr Takte je echte Sekunde. Die Zahl erfährt er
  vom Steckbrief (`takte(einstellungen)`), nicht aus einer Verzweigung
  (ADR-0006). Prüfbar: bei 1,5 vergehen in zehn echten Sekunden fünfzehn
  Spielsekunden, höchstens einen Takt daneben. Die Uhr im Bild zeigt
  Spielzeit (bedienung AC-37).
  **Gebaut in Runde 159:** `takte` im Steckbrief darf eine Funktion der
  Einstellungen sein (geprüft beim Start des Servers an den Vorgaben), beim
  Strategiespiel 10, 15 oder 20. Der Raum rechnet nach der Wanduhr statt
  nach der Zahl der Schläge — `setInterval` mit 66,7 ms kommt jedes Mal
  etwas spät — und holt nach einem Stocken höchstens eine Sekunde nach. Die
  Welt rechnet bei jeder Geschwindigkeit Takt für Takt dasselbe; sie schickt
  `tempo` im Aufbau, damit der Browser die Bewegung zwischen zwei Zuständen
  auf `1000 / (takte × tempo)` ms streckt. Über das Netz gemessen: 73 bis 74
  Takte, wo 72,3 bis 73,4 erwartet waren.

### Bündnisse im Bild

- **AC-24** `fertig` **Kündigung im Bild** — Bei „lösbar" steht im Spiel ein
  Knopf „Bündnis lösen", der einmal zurückfragt (wie Aufgeben, bedienung
  AC-38); bei „fest" und ohne Team fehlt er. Nach der Kündigung sehen
  **alle** oben eine Ansage, wer sein Bündnis gelöst hat, mit einer Uhr, die
  die 60 Sekunden herunterzählt; danach eine Meldung, dass sie jetzt Gegner
  sind. Ein Rechtsklick auf den früheren Verbündeten ist ab dann ein
  Angriff (rotes Zeichen), und der Nebel zeigt seine Einheiten nur noch in
  Sicht. Aus AC-21 geteilt (Runde 154): der Server kündigt, das Bild sagt es.

## Der Prüfstein

Diese Spec gilt als erfüllt, wenn **fünf Menschen an einem Abend zwei Partien
hintereinander spielen und danach eine dritte wollen.** Alles andere hier
sind Hilfsmittel für dieses eine Ergebnis.

Das lässt sich nicht testen, nur feststellen — und zwar nur an einem echten
Abend. Deshalb bleibt es das einzige Kriterium ohne AC-Nummer.
