# Karte und Vorraete

**Bereich:** Strategie
**Kuerzel:** karte
**Stand:** 9/17 fertig · 5 offen · 3 zurueckgestellt

## Zweck

Ein Spielfeld, das in jeder Partie neu ist, aber niemanden benachteiligt.

> **Stufe A löst ab.** AC-2 (vier Feldarten), AC-3 (64 × 64) und AC-8 (Wald
> 120, Beeren 80) beschreiben die kleine Fassung vor
> [ADR-0012](../../docs/adr/0012-aoe2-als-vorlage.md). Sie gelten, bis AC-11
> bis AC-15 gebaut sind; die Runde, die das tut, stellt sie auf
> `zurueckgestellt (abgelöst durch karte AC-…)` und passt ihre Tests an.

## Abgrenzung

| Gehoert dazu                    | Gehoert nicht dazu                              |
| ------------------------------- | ----------------------------------------------- |
| Erzeugung, Feldarten, Vorraete  | Sammeln → [Einheiten](einheiten-und-befehle.md) |
| Gleiche Startlage fuer alle     | Darstellung im Browser                          |

## Abnahmekriterien

### Erzeugung

- **AC-1** `fertig` **Gleiche Zahl, gleiche Karte** — Derselbe Startwert erzeugt dieselbe Karte.
  Ein Fehler laesst sich damit wiederholen, statt ihn zu suchen.
- **AC-2** `zurueckgestellt` (abgeloest durch karte AC-13) **Vier Feldarten** — Gras ist begehbar; Wald, Beeren und Wasser sind es nicht.
- **AC-3** `zurueckgestellt` (abgeloest durch karte AC-11) **Karte ist 64 x 64** — Gross genug fuer sechs Spieler, klein genug, um sie in
  einer Nachricht zu verschicken.

### Gleiche Startlage

- **AC-4** `fertig` **Basen liegen auf einem Kreis** — Alle Basen liegen gleichmaessig auf einem
  Kreis um die Kartenmitte. Niemand hat einen kuerzeren Weg zur Mitte.
- **AC-5** `fertig` **Platz um die Basis** — Im Umkreis von zwei Feldern um jede Basis ist alles
  begehbar, damit Einheiten nicht eingemauert starten.
- **AC-6** `fertig` **Holz und Nahrung in Reichweite** — Jede Basis hat Wald und Beeren in
  Sichtweite, in gleicher Menge wie alle anderen.
- **AC-7** `offen` **Kein Spieler ist abgeschnitten** — Von jeder Basis fuehrt ein begehbarer Weg zu
  jeder anderen. _(Heute nicht geprueft: Wasser koennte theoretisch eine Basis
  einschliessen. Bei den aktuellen Werten ist es nicht aufgetreten, aber
  „nicht aufgetreten" ist keine Zusicherung.)_

### Vorraete

- **AC-8** `zurueckgestellt` (abgeloest durch karte AC-13) **Wald traegt mehr als Beeren** — Ein Waldfeld hat 120 Einheiten Holz, ein
  Beerenfeld 80 Nahrung.
- **AC-9** `fertig` **Erschoepftes Feld wird Gras** — Ist ein Vorrat aufgebraucht, wird das Feld zu
  Gras und damit begehbar. Alle Spieler erfahren die Aenderung.
- **AC-10** `offen` **Vorraete sind endlich und knapp** — Die Gesamtmenge auf der Karte muss so
  bemessen sein, dass sie in einer Partie zum Streitpunkt wird. _(Heute
  reichlich vorhanden — Balance kommt, wenn es etwas zu bauen gibt.)_

### Stufe A — Karte nach der Vorlage

- **AC-11** `fertig` **Die Karte wächst mit** — Zwei Spieler 120 × 120 Felder, je weiterer
  Spieler mehr, bis 200 × 200 bei acht. Einstellung „Kartengröße" klein,
  normal, groß (→ [Spielauswahl](../00-plattform/spielauswahl.md) AC-6).
  _(Das Original geht bis 220; 200 hält die Aufbaunachricht und die
  Wegsuche bezahlbar — gemessen wird das mit AC-15.)_
- **AC-12** `fertig` **Vier Rohstoffe, Startvorrat** — Holz, Nahrung, Gold, Stein. Jeder Spieler
  beginnt mit 200 Holz, 200 Nahrung, 100 Gold, 200 Stein. Einstellung
  „Startvorrat" wenig (Vorlage), mittel (je 500), viel (je 1000).
- **AC-13** `fertig` **Vorräte sind einzelne Dinge** — Ein Baum trägt 100 Holz, ein Beerenstrauch
  125 Nahrung, ein Goldfeld 800, ein Steinfeld 350. Jedes belegt ein Feld und
  ist unbegehbar, bis es leer ist; dann verschwindet es. Wald ist eine Gruppe
  von Bäumen.
- **AC-14** `fertig` **Jede Basis gleich ausgestattet** — Um jedes Dorfzentrum in 5 bis 12
  Feldern: 6 Beerensträucher, ein Goldfeld aus 7 Feldern, ein Steinfeld aus 5,
  8 Schafe näher am Zentrum, Wald in mindestens zwei Richtungen. Gleiche
  Mengen und gleiche Abstände für alle, nur gedreht.
- **AC-15** `offen` **Wegsuche bleibt bezahlbar** — Auf der größten Karte kostet eine Suche von
  Ecke zu Ecke unter 5 ms, im Mittel über hundert zufällige Suchen unter 1 ms
  (→ [Einheiten](einheiten-und-befehle.md) AC-8).
- **AC-16** `offen` **Schafe gehören dem Spieler** — Die acht Schafe zu Beginn tragen die
  Farbe des Spielers und je 100 Nahrung. Sie stehen still, bis ein Dorfbewohner
  sie nutzt (→ [Einheiten](einheiten-und-befehle.md) AC-17).
- **AC-17** `offen` **Karte in einer Nachricht** — Der Aufbau einer Karte von
  200 × 200 mit allen Vorräten ist gepackt unter 200 KB groß.

## Grenzfaelle

- Zwei Spieler koennen dasselbe Feld abernten. Wer zuerst da ist, bekommt die
  Ladung; das ist so gewollt.
- Bei sechs Spielern liegen die Basen enger beieinander als bei zweien. Der
  Kreisradius bleibt gleich — das macht volle Partien absichtlich haerter.
