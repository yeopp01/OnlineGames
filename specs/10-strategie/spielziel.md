# Spielziel und Partieverlauf

**Bereich:** Strategie
**Kuerzel:** spielziel
**Stand:** 0/18 fertig · 1 in Arbeit · 17 offen

## Zweck

Was für ein Spiel das hier werden soll — und woran man merkt, dass es fertig
ist. Diese Spec ist die Klammer über [Bauen](bauen.md), [Kampf](kampf.md),
[Einheiten](einheiten-und-befehle.md) und [Karte](karte-und-vorraete.md).

## Die Idee in drei Sätzen

Zwei bis acht Leute spielen eine Partie nach den Regeln von Age of Empires II:
Dorfbewohner sammeln vier Rohstoffe, die Siedlung steigt durch die Zeitalter
auf, jedes Volk hat seine Stärken. Wer die anderen erobert, gewinnt. Gebaut
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

## Zu den Völkern

Namen wie Teutonen, Franken oder Byzantiner sind historisch und frei
verwendbar. Was ein Volk kostet, hängt allein daran, wie viel **eigenes**
daran hängt:

| Ein Volk als …                                | Kostet        |
| --------------------------------------------- | ------------- |
| Name, Farbe und Boni als Zahlen               | einen Nachmittag |
| dazu eine Spezialeinheit aus vorhandenen Fähigkeiten | einen Tag |
| eigener Technikbaum und eigene Mechaniken     | Wochen        |

Deshalb bekommen die fünf Völker Boni und eine Spezialeinheit, aber keinen
eigenen Technikbaum ([Vorlage](../../docs/strategie/vorlage-aoe2.md)).

## Abnahmekriterien

### Partieverlauf

- **AC-1** `in-arbeit` **Zeitalter gliedern die Partie** — Dunkle Zeit, Feudal-, Ritter- und
  Imperialzeit. Jeder Aufstieg kostet und dauert, und er öffnet neue Gebäude und
  Einheiten. Wann man aufsteigt, ist eine Entscheidung, keine Pflicht.
  **Stand:** die vier Zeitalter und alle drei Aufstiege rechnen und sind im Bild
  zu bedienen ([Bauen](bauen.md) AC-23, [Bedienung](bedienung.md) AC-33), und
  der Aufstieg in die Feudalzeit öffnet drei Gebäude und mit dem Stall eine
  Einheit (AC-24). Noch nicht `fertig`, weil Ritter- und Imperialzeit nichts
  öffnen — das kommen Stufe D und F.
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

- **AC-5** `offen` **Sieg durch Eroberung** — Wer als Einziger noch Einheiten oder Gebäude
  außer Mauern, Toren und Farmen hat, gewinnt. Die Partie endet sofort und
  zeigt allen das Ergebnis.
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

- **AC-13** `offen` **Zwei bis acht Spieler** — Die Partie funktioniert mit jeder Zahl zwischen
  zwei und acht, ohne dass Werte von Hand angepasst werden; die Karte wächst
  mit.
- **AC-16** `offen` **Fünf Völker mit Profil** — Jedes mit zwei bis drei Boni, einer
  Spezialeinheit und einem Mannschaftsbonus, die einen eigenen Weg zum Sieg
  nahelegen (→ [Fahrplan](fahrplan.md) AC-16).
- **AC-17** `offen` **Ein Volk ist Daten** — Ein neues Volk entsteht durch einen Eintrag
  in einer Tabelle, nicht durch eine Verzweigung in der Simulation. Sonst
  wird das fünfte Volk teurer als das erste statt billiger.
- **AC-18** `offen` **Kein Volk gewinnt gegen alle** — Über zwanzig Partien liegt keines dauerhaft
  vorn. Belegt durch Partien, nicht durch Behauptung.
- **AC-14** `offen` **Bündnisse sind nicht vorgesehen** — Jeder gegen jeden. Absprachen finden am
  Tisch statt, nicht im Spiel — das spart eine ganze Mechanik.
- **AC-15** `offen` **Ein Aussteiger blockiert nicht** — Verlässt jemand die Partie endgültig,
  verfallen seine Gebäude nach zwei Minuten, damit die Runde ein Ende findet.

## Der Prüfstein

Diese Spec gilt als erfüllt, wenn **fünf Menschen an einem Abend zwei Partien
hintereinander spielen und danach eine dritte wollen.** Alles andere hier
sind Hilfsmittel für dieses eine Ergebnis.

Das lässt sich nicht testen, nur feststellen — und zwar nur an einem echten
Abend. Deshalb bleibt es das einzige Kriterium ohne AC-Nummer.
