# Spielziel und Partieverlauf

**Bereich:** Strategie
**Kuerzel:** spielziel
**Stand:** 18 offen

## Zweck

Was für ein Spiel das hier werden soll — und woran man merkt, dass es fertig
ist. Diese Spec ist die Klammer über [Bauen](bauen.md), [Kampf](kampf.md),
[Einheiten](einheiten-und-befehle.md) und [Karte](karte-und-vorraete.md).

## Die Idee in drei Sätzen

Fünf Freunde spielen fünfzehn Minuten auf einer Karte. Jeder baut aus zwei
Rohstoffen eine kleine Wirtschaft auf, bildet Truppen aus und versucht, die
Basen der anderen niederzureißen. Wer als Letzter eine Basis hat, gewinnt.

## Was es ausdrücklich **nicht** wird

Ein vollstaendiger Nachbau von Age of Empires 2. Vierzig Voelker, hundert
Einheitentypen mit Animationen aus acht Richtungen, Kampagnen und Zeitalter
sind Mannjahre an **Inhalt** — kein Code hilft dabei. Der Reiz eines
Strategiespiels steckt in der Entscheidung „noch ein Sammler oder schon
Soldaten?", nicht in der Anzahl der Einheitentypen.

| Wird gebaut                     | Wird nicht gebaut                   |
| ------------------------------- | ----------------------------------- |
| 2 Rohstoffe                     | 4 Rohstoffe, Handel, Markt          |
| 4 Einheitentypen                | Belagerung, Schiffe, Helden         |
| 3 Gebäudetypen                  | Mauern, Türme, Wunder               |
| 3 Völker zu Beginn, später 5–10 | 40 Völker mit eigenem Technikbaum   |
| 1 Karte je Partie, zufällig     | Karteneditor, Kampagnen, Szenarien  |
| Formen und Farben               | Sprites, Animationen, Sprachausgabe |
| 15 Minuten                      | 90 Minuten, Speicherstände          |

Diese Tabelle ist die wichtigste in diesem Projekt. Jede Zeile rechts ist
eine Woche, die wir nicht ausgeben.

## Zu den Völkern

Namen wie Teutonen, Franken oder Byzantiner sind historisch und frei
verwendbar — es sind reale Voelker, so wie Trebuchet, Paladin und Chevalier
reale Waffen und Raenge sind. Was ein Volk kostet, haengt allein daran, wie
viel **eigenes** daran haengt:

| Ein Volk als …                                | Kostet        |
| --------------------------------------------- | ------------- |
| Name, Farbe und **ein** Zahlenunterschied     | einen Nachmittag |
| dazu eine eigene Sonderregel                  | einen Tag     |
| eigener Technikbaum und eigene Einheitentypen | Wochen        |

Deshalb: 5 bis 10 Voelker der ersten beiden Sorten sind ein realistisches
Ziel. Ein eigener Technikbaum je Volk ist es nicht.

## Abnahmekriterien

### Partieverlauf

- **AC-1** `offen` **Eine Partie hat drei Abschnitte** — Aufbau (nur sammeln, ~4 min), Ausbau
  (bauen und ausbilden, ~6 min), Entscheidung (Kampf, ~5 min). Nicht als
  Regel erzwungen, sondern über Kosten und Bauzeiten so bemessen.
- **AC-2** `offen` **Eine Partie dauert 12 bis 20 Minuten** — Gemessen über zehn Partien mit
  echten Spielern. Dauert sie regelmäßig länger, sind die Kosten falsch.
- **AC-3** `offen` **Niemand ist nach drei Minuten raus** — Ein Angriff in den ersten fünf Minuten
  darf einen Spieler nicht ausschalten. Wer früh verliert, sitzt zwölf
  Minuten daneben — das killt den Abend.
- **AC-4** `offen` **Aufholen ist möglich** — Ein Spieler mit halb so vielen Einheiten muss noch
  gewinnen können, wenn er besser spielt. Ohne das gibt es keinen Grund,
  weiterzuspielen.

### Sieg und Ende

- **AC-5** `offen` **Sieg durch letzte Basis** — Wer als Einziger noch ein Zentrum hat, gewinnt.
  Die Partie endet sofort und zeigt allen das Ergebnis.
- **AC-6** `offen` **Aufgeben ist möglich** — Ein Spieler kann aufgeben. Seine Einheiten
  verschwinden, die Partie läuft für die anderen weiter.
- **AC-7** `offen` **Verlierer bleiben Zuschauer** — Wer ausgeschieden ist, sieht die Partie
  weiterlaufen, statt auf einen leeren Bildschirm zu schauen.
- **AC-8** `offen` **Abschlussbild mit Zahlen** — Am Ende sehen alle: gesammelte Rohstoffe,
  gebaute Einheiten, Verluste, Dauer. Der Stoff, aus dem Revanchen entstehen.
- **AC-9** `offen` **Revanche mit einem Klick** — Vom Abschlussbild aus startet dieselbe Runde neu,
  ohne dass jemand einen Code neu eintippen muss.

### Gleichgewicht

- **AC-10** `offen` **Kein Zug ist immer richtig** — Es gibt keine Eröffnung, die gegen alles
  funktioniert. Belegt durch Partien, nicht durch Behauptung.
- **AC-11** `offen` **Rein sammeln verliert** — Wer nur Wirtschaft baut und keine Truppen, verliert
  gegen einen frühen Angriff. Sonst gibt es keine Spannung.
- **AC-12** `offen` **Rein angreifen verliert auch** — Wer sofort alles auf Truppen setzt, verliert
  gegen einen, der aufbaut, falls der Angriff nicht durchkommt.

### Zu mehreren

- **AC-13** `offen` **Zwei bis sechs Spieler** — Die Partie funktioniert mit jeder Zahl zwischen
  zwei und sechs, ohne dass Werte von Hand angepasst werden.
- **AC-16** `offen` **Drei Völker zum Start** — Jedes mit genau einem spürbaren Unterschied, etwa
  zähere Gebäude, billigere Reiter oder ein stärkerer Konter. Nicht mehr:
  drei Unterschiede lassen sich noch ausbalancieren, dreißig nicht.
- **AC-17** `offen` **Ein Volk ist Daten, kein Code** — Ein neues Volk entsteht durch einen Eintrag
  in einer Tabelle, nicht durch eine Verzweigung in der Simulation. Sonst
  wird das fünfte Volk teurer als das erste statt billiger.
- **AC-18** `offen` **Kein Volk gewinnt gegen alle** — Über zwanzig Partien liegt keines dauerhaft
  vorn. Belegt durch Partien, nicht durch Behauptung.
- **AC-14** `offen` **Bündnisse sind nicht vorgesehen** — Jeder gegen jeden. Absprachen finden am
  Tisch statt, nicht im Spiel — das spart eine ganze Mechanik.
- **AC-15** `offen` **Ein Aussteiger blockiert nicht** — Verlässt jemand die Partie endgültig,
  verfallen seine Gebäude nach zwei Minuten, damit die Runde ein Ende findet.

## Der Prüfstein

Diese Spec gilt als erfüllt, wenn **fünf Menschen an einem Abend drei Partien
hintereinander spielen und danach eine vierte wollen.** Alles andere hier
sind Hilfsmittel für dieses eine Ergebnis.

Das lässt sich nicht testen, nur feststellen — und zwar nur an einem echten
Abend. Deshalb bleibt es das einzige Kriterium ohne AC-Nummer.
