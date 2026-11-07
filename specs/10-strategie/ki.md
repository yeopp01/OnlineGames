# KI-Spieler

**Bereich:** Strategie
**Kuerzel:** ki
**Stand:** 10/14 fertig · 4 offen

## Zweck

Ein Computer, der nach denselben Regeln spielt wie ein Mensch. Er hat zwei
Aufgaben: **Gleichgewicht messbar machen** — der Prüfstand lässt KI gegen KI
Hunderte Partien spielen ([Fahrplan](fahrplan.md) AC-4, AC-5, AC-9, AC-18) —
und **allein spielbar machen** (Stufe C).

Die KI muss nicht gut sein, sondern **ehrlich**: Sie sieht nicht mehr, darf
nicht mehr und bekommt keinen Rabatt. Sonst messen die Partien die KI,
nicht die Regeln.

## Abgrenzung

| Gehoert dazu                               | Gehoert nicht dazu |
| ------------------------------------------ | ------------------ |
| Wie die KI entscheidet, was sie darf       | die Regeln selbst → [Bauen](bauen.md), [Einheiten](einheiten-und-befehle.md) |
| Prüfstand: Partien ohne Menschen, Messungen | Siegbedingung → [Spielziel](spielziel.md) |

## Abnahmekriterien

### Ehrlich (Stufe A)

- **AC-1** `fertig` **Befehle wie ein Mensch** — Die KI schickt dieselben Befehle über denselben
  Weg wie der Browser (`befehl`, `bauen`, `ausbilden`). Ein Befehl, der für
  einen Menschen abgewiesen würde, wird auch für sie abgewiesen.
- **AC-2** `fertig` **Gleicher Zufall, gleiche Partie** — Die KI zieht Zufall nur aus dem
  Startwert. Zwei Partien KI gegen KI mit demselben Startwert enden Takt für
  Takt gleich.
- **AC-3** `fertig` **KI kostet wenig** — Eine KI rechnet im Mittel unter 1 ms je Takt und
  entscheidet nicht in jedem Takt neu, sondern alle halbe Sekunde.

### Wirtschaft (Stufe A)

- **AC-4** `fertig` **Baut die Wirtschaft auf** — Bildet ohne Pause Dorfbewohner aus, baut ein
  Haus, bevor die Bevölkerung voll ist, und verteilt Dorfbewohner auf
  Nahrung, Holz und Gold nach einem festen Plan der Dunklen Zeit. Ist das
  Ziel von 22 Dorfbewohnern erreicht, spart sie für die Feudalzeit.
- **AC-5** `fertig` **Lager an die Vorräte** — Baut Holzfällerlager am nächsten Wald,
  Bergbaulager am Gold, Mühle an den Beeren, und Farmen, sobald Schafe und
  Beeren nicht mehr reichen: wenn der Plan mehr Dorfbewohner an der Nahrung
  will, als dort Platz haben (je sechs), spätestens wenn die Schafe
  aufgegessen sind.
- **AC-6** `fertig` **Niemand steht herum** — Kein Dorfbewohner der KI ist länger als 20 Sekunden
  untätig, außer alle Vorräte in Reichweite sind leer.

### Prüfstand (Stufe A)

- **AC-7** `fertig` **Partien ohne Browser** — `npm run pruefstand:strategie -- --partien 20`
  spielt KI gegen KI ohne Server und Browser, so schnell die Maschine kann,
  und schreibt je Partie Startwert, Dauer und Kennzahlen je Spieler.
- **AC-8** `fertig` **Jeder Takt wird geprüft** — Der Prüfstand bricht mit Startwert und Takt ab,
  wenn ein Vorrat negativ wird, die Bevölkerung die Grenze übersteigt, eine
  Einheit in einem Hindernis steht oder zwei Gebäude sich überlappen
  (→ [Fahrplan](fahrplan.md) AC-4).

### Feudalzeit (Stufe B)

- **AC-9** `fertig` **Die KI steigt auf** — Sobald 500 Nahrung und zwei Gebäude der Dunklen
  Zeit da sind, beginnt sie den Aufstieg, baut danach Schießanlage oder Stall
  und bildet Kampfeinheiten aus. Im Prüfstand erreicht sie die Feudalzeit über
  zwanzig Startwerte nach 11 bis 16 Spielminuten.
- **AC-10** `offen` **Auch spät steht niemand herum** — Auch nach zwanzig
  Spielminuten steht kein Dorfbewohner länger als 20 Sekunden still. Heute
  stehen einzelne bis zu acht Minuten: Wald und Gold im Umkreis von 30 Feldern
  um die Basis sind aufgebraucht, Farmen sind alle besetzt, und wer dann
  untätig wird, findet kein Ziel mehr. AC-6 misst dasselbe nach zehn Minuten.

### Kampf und Partieende (Stufe C)

- **AC-11** `fertig` **Die KI greift an** — Sobald **zehn** Kampfeinheiten
  bereitstehen, schickt sie **acht** davon zum nächsten Gegner: unterwegs
  greifen sie an, was ihnen in Sichtweite kommt (Angriffslauf,
  [Kampf](kampf.md) AC-8), am Ziel das Dorfzentrum. Die **zwei**, die dem
  eigenen Dorf am nächsten stehen, bleiben als Wache zu Hause. Acht, weil zehn
  Speerkämpfer im Gefechtsstand gegen sieben Reiter gewinnen
  ([Fahrplan](fahrplan.md) AC-9) — ein kleineres Heer verliert gegen jede
  Wache. Im Prüfstand greift sie über zwanzig Startwerte in jeder Partie
  mindestens einmal an.
- **AC-12** `offen` **Nachschub statt alles auf einmal** — Ist das Heer
  gefallen, bildet sie weiter aus und greift wieder an. Die Wirtschaft läuft
  dabei weiter: bei Spielminute 30 hat sie noch mindestens 20 Dorfbewohner.
  Ohne das endet jede Partie damit, dass beide Seiten einander zusehen.
- **AC-13** `offen` **KI sieht nur ihr Sichtfeld** — Mit dem Nebel (C6)
  entscheidet sie allein aus dem, was der Server ihr schickt: Sie kennt die
  Basis des Gegners erst, wenn eine ihrer Einheiten sie gesehen hat, und
  schickt dafür ihren Späherreiter los. Belegt dadurch, dass sie dieselbe
  Zustandsnachricht bekommt wie ein Browser — nicht die Welt.
- **AC-14** `offen` **Die KI verteidigt zu Hause** — Wird eines ihrer Gebäude
  oder ein Dorfbewohner angegriffen, zieht die Wache zum Angriffsort, und ein
  getroffener Dorfbewohner lässt die Arbeit und läuft zum Dorfzentrum
  ([Kampf](kampf.md) AC-5 gilt weiter: er wehrt sich nicht von selbst). Ohne
  das ist eine Partie gegen die KI ein Spaziergang.

## Grenzfaelle

- Der Aufstieg wird erst bestellt, wenn das Dorfzentrum frei ist: hinter einer
  Schlange stünde er still, während die 500 Nahrung schon bezahlt sind.
- Solange das Militärgebäude fehlt, hält die KI 175 Holz dafür zurück und baut
  keine weitere Farm. Ohne diese Regel stand beim Startwert 15 am Ende 640 Gold
  neben 150 Holz — für die Schießanlage reichte es nie (Runde 69).
- Welche Einheit ein Militärgebäude ausbildet, liest die KI aus seinen Daten:
  die erste, die ihr Zeitalter erreicht hat und bezahlt ist. Eine neue Einheit
  einer späteren Stufe bildet sie damit ohne Änderung am Code aus.
- Ab Stufe C sieht die KI nur, was ihre Einheiten sehen (Nebel). Bis dahin
  sieht sie die ganze Karte — wie jeder Mensch auch.
- Bleibt eine KI-Partie hängen (niemand gewinnt, nichts passiert), endet sie
  nach 90 Spielminuten als „unentschieden" und wird im Prüfstand gezählt.
