# Bauen und Ausbilden

**Bereich:** Strategie
**Kuerzel:** bauen
**Stand:** 18/22 fertig · 4 offen

## Zweck

Aus Rohstoffen wird Wirtschaft und Heer. Das ist die Schleife, in der die
eigentliche Entscheidung eines Strategiespiels steckt: **noch ein
Dorfbewohner oder schon ein Soldat?**

Werte nach der [Vorlage](../../docs/strategie/vorlage-aoe2.md)
([ADR-0012](../../docs/adr/0012-aoe2-als-vorlage.md)). Die Kriterien bis AC-19
wurden für Stufe A neu gefasst; die Nummern sind geblieben.

## Abgrenzung

| Gehoert dazu                     | Gehoert nicht dazu                          |
| -------------------------------- | ------------------------------------------- |
| Gebäude, Kosten, Bauzeiten       | Sammeln → [Einheiten](einheiten-und-befehle.md) |
| Bevölkerungsgrenze               | Kampfwerte → [Kampf](kampf.md)              |
| Ausbilden, Verbesserungen        | Siegbedingung → [Spielziel](spielziel.md)   |
| Knöpfe und Vorschau              | wie es aussieht → [Darstellung](darstellung.md) |

## Die Gebäude der Dunklen Zeit (Stufe A)

| Gebäude             | Größe | Kosten              | Bauzeit | Leben | Leistet |
| ------------------- | ----- | ------------------- | ------- | ----- | ------- |
| **Dorfzentrum**     | 4×4   | 275 Holz, 100 Stein | 150 s   | 2400  | Abgabe aller Rohstoffe, Dorfbewohner, Webstuhl, +5 Bevölkerung |
| **Haus**            | 2×2   | 25 Holz             | 25 s    | 550   | +5 Bevölkerung |
| **Mühle**           | 2×2   | 100 Holz            | 35 s    | 1000  | Abgabe Nahrung |
| **Holzfällerlager** | 2×2   | 100 Holz            | 35 s    | 1000  | Abgabe Holz |
| **Bergbaulager**    | 2×2   | 100 Holz            | 35 s    | 1000  | Abgabe Gold und Stein |
| **Farm**            | 3×3   | 60 Holz             | 15 s    | 480   | 175 Nahrung, begehbar |
| **Kaserne**         | 3×3   | 175 Holz            | 50 s    | 1200  | Miliz |

Größen in Feldern, wie im Original. Jedes Gebäude trägt eine eigene
Entscheidung: Haus heißt wachsen, Lager heißt Wege kürzen, Farm heißt
Nahrung ohne Ende, Kaserne heißt kämpfen, ein zweites Dorfzentrum heißt
ausbreiten.

| Einheit / Verbesserung | Ort          | Kosten           | Zeit |
| ---------------------- | ------------ | ---------------- | ---- |
| Dorfbewohner           | Dorfzentrum  | 50 Nahrung       | 25 s |
| Miliz                  | Kaserne      | 60 Nahrung, 20 Gold | 21 s |
| Webstuhl               | Dorfzentrum  | 50 Gold          | 25 s |

Der Späherreiter steht nur zu Beginn auf der Karte; ausgebildet wird er ab
Stufe B im Stall.

## Abnahmekriterien

### Bauen

- **AC-1** `fertig` **Dorfbewohner bauen Gebäude** — Ein ausgewählter Dorfbewohner bekommt einen
  Bauauftrag für einen Platz; er läuft hin und baut. Während er baut, sammelt
  er nicht. Nach dem Bau eines Lagers oder einer Mühle sammelt er am nächsten
  passenden Vorrat, nach einer Farm bestellt er sie.
- **AC-2** `fertig` **Mehrere bauen schneller** — n Dorfbewohner brauchen `3·t / (n + 2)`: einer
  die volle Zeit, zwei drei Viertel, drei drei Fünftel. Mehr hilft, aber
  immer weniger — wie im Original.
- **AC-3** `fertig` **Bauplatz muss frei sein** — Alle Felder der Grundfläche sind begehbar und
  von keinem Gebäude, Baum, Vorrat oder Schaf belegt. Einheiten auf dem Platz
  gehen beiseite.
- **AC-4** `fertig` **Bauplatz wird vorher gezeigt** — Beim Platzieren folgt die Grundfläche dem
  Zeiger, grün wenn der Platz taugt, rot wenn nicht — vor dem Klick. Esc
  bricht das Platzieren ab.
- **AC-5** `fertig` **Kosten beim Baubeginn abgezogen** — Nicht bei Fertigstellung. Reicht der
  Vorrat nicht, entsteht keine Baustelle.
- **AC-6** `fertig` **Abbruch erstattet den Rest** — Eine Baustelle lässt sich abreißen. Erstattet
  wird der Anteil der Kosten, der noch nicht verbaut ist.
- **AC-7** `offen` **Gebäude im Bau angreifbar** — Mit Leben im Verhältnis zum Baufortschritt.
  _(Stufe B, mit dem Kampf.)_
- **AC-20** `fertig` **Die Gebäude der Dunklen Zeit** — Dorfzentrum, Haus, Mühle,
  Holzfällerlager, Bergbaulager, Farm und Kaserne lassen sich mit Kosten,
  Bauzeit, Größe und Leben aus der Tabelle oben bauen. Die Werte stehen als
  Daten an einer Stelle, nicht in der Simulation verteilt. _(Runde 22
  bis 32 gebaut; das Dorfzentrum als Bauauftrag erst in Stufe D, wie in der
  Vorlage.)_

### Ausbilden

- **AC-8** `fertig` **Dorfzentrum bildet Dorfbewohner aus** — 50 Nahrung, 25 Sekunden. Jeder
  Spieler beginnt mit einem Dorfzentrum an seiner Basis. _(Die Startaufstellung
  steht seit Runde 18 in AC-22.)_
- **AC-9** `fertig` **Kaserne bildet Miliz aus** — 60 Nahrung, 20 Gold, 21 Sekunden. Kämpfen kann
  sie ab Stufe B; in Stufe A läuft sie und nimmt Bevölkerung.
- **AC-10** `fertig` **Warteschlange je Gebäude** — Bis zu 15 Aufträge; bezahlt wird beim
  Einreihen. Der laufende Auftrag zeigt seinen Fortschritt.
- **AC-11** `fertig` **Abbruch erstattet vollständig** — Ein Auftrag aus der Warteschlange, auch
  der laufende, erstattet beim Abbruch die vollen Kosten.
- **AC-12** `fertig` **Neue Einheiten erscheinen nebenan** — Auf einem freien Feld am Rand des
  Gebäudes, nicht in einem Hindernis, nicht in einem anderen Gebäude.
- **AC-13** `fertig` **Sammelpunkt je Gebäude** — Rechtsklick mit ausgewähltem Gebäude setzt ihn;
  zeigt er auf einen Vorrat, gehen neue Dorfbewohner dort gleich sammeln.
- **AC-21** `fertig` **Webstuhl stärkt Dorfbewohner** — 50 Gold, 25 s im Dorfzentrum: alle
  Dorfbewohner des Spielers +15 Leben, +1 Nah- und +2 Fernrüstung. Einmal je
  Partie.
- **AC-22** `fertig` **Startaufstellung nach der Vorlage** — Zu Beginn: ein Dorfzentrum, drei
  Dorfbewohner, ein Späherreiter, alle vor dem Dorfzentrum (dahinter verdeckte
  es sie). Bevölkerung 4/5 — ein Platz ist frei zum Ausbilden.

### Bevölkerung

- **AC-14** `fertig` **Bevölkerung ist begrenzt** — Dorfzentrum und Häuser geben je fünf Plätze,
  höchstens 200. Jede Einheit belegt einen.
- **AC-15** `fertig` **Volle Bevölkerung sperrt Ausbildung** — Der Auftrag bleibt in der Schlange
  und wartet, und die Oberfläche sagt, warum: „Bevölkerung voll — Haus bauen".
- **AC-16** `fertig` **Verlorene Einheiten geben Plätze frei** — Sofort, nicht erst beim nächsten Bau.

### Zerstörung

- **AC-17** `offen` **Gebäude haben Leben** — Werte aus der Tabelle oben. _(Wirkung ab Stufe B.)_
- **AC-18** `offen` **Zerstörte Gebäude nehmen Plätze mit** — Fällt ein Haus, sinkt die Grenze.
  Einheiten über der Grenze sterben nicht, es kommen nur keine neuen dazu.
  _(Stufe B.)_
- **AC-19** `offen` **Eroberung entscheidet** — Die Siegbedingung steht in
  [Spielziel](spielziel.md) AC-5. _(Stufe C.)_

## Grenzfaelle

- Ein Dorfbewohner, der beim Bauen stirbt, hinterlässt eine Baustelle, an der
  ein anderer weiterbauen kann. Die Rohstoffe sind nicht verloren.
- Zwei Spieler beanspruchen denselben Platz: wer zuerst den Baubeginn absetzt,
  bekommt ihn; der andere bekommt eine Absage und behält seine Rohstoffe.
- Eine Farm ist begehbar. Sie sperrt den Platz für Gebäude, nicht für Einheiten.
- Ist die Farm leer, bleibt sie als leerer Acker stehen; neu anlegen kostet
  wieder 60 Holz.
