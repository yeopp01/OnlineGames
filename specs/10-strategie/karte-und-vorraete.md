# Karte und Vorraete

**Bereich:** Strategie
**Kuerzel:** karte
**Stand:** 8/10 fertig · 2 offen

## Zweck

Ein Spielfeld, das in jeder Partie neu ist, aber niemanden benachteiligt.

## Abgrenzung

| Gehoert dazu                    | Gehoert nicht dazu                              |
| ------------------------------- | ----------------------------------------------- |
| Erzeugung, Feldarten, Vorraete  | Sammeln → [Einheiten](einheiten-und-befehle.md) |
| Gleiche Startlage fuer alle     | Darstellung im Browser                          |

## Abnahmekriterien

### Erzeugung

- **AC-1** `fertig` **Gleiche Zahl, gleiche Karte** — Derselbe Startwert erzeugt dieselbe Karte.
  Ein Fehler laesst sich damit wiederholen, statt ihn zu suchen.
- **AC-2** `fertig` **Vier Feldarten** — Gras ist begehbar; Wald, Beeren und Wasser sind es nicht.
- **AC-3** `fertig` **Karte ist 64 x 64** — Gross genug fuer sechs Spieler, klein genug, um sie in
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

- **AC-8** `fertig` **Wald traegt mehr als Beeren** — Ein Waldfeld hat 120 Einheiten Holz, ein
  Beerenfeld 80 Nahrung.
- **AC-9** `fertig` **Erschoepftes Feld wird Gras** — Ist ein Vorrat aufgebraucht, wird das Feld zu
  Gras und damit begehbar. Alle Spieler erfahren die Aenderung.
- **AC-10** `offen` **Vorraete sind endlich und knapp** — Die Gesamtmenge auf der Karte muss so
  bemessen sein, dass sie in einer Partie zum Streitpunkt wird. _(Heute
  reichlich vorhanden — Balance kommt, wenn es etwas zu bauen gibt.)_

## Grenzfaelle

- Zwei Spieler koennen dasselbe Feld abernten. Wer zuerst da ist, bekommt die
  Ladung; das ist so gewollt.
- Bei sechs Spielern liegen die Basen enger beieinander als bei zweien. Der
  Kreisradius bleibt gleich — das macht volle Partien absichtlich haerter.
