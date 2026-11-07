# Kampf

**Bereich:** Strategie
**Kuerzel:** kampf
**Stand:** 8/14 fertig · 5 offen · 1 zurueckgestellt

## Zweck

Der Teil, der aus einer Wirtschaftssimulation ein Spiel macht. Drei
Kampfeinheiten, die sich gegenseitig schlagen — Stein, Schere, Papier mit
Laufwegen.

## Abgrenzung

| Gehoert dazu                  | Gehoert nicht dazu                        |
| ----------------------------- | ----------------------------------------- |
| Einheitentypen und ihre Werte | Ausbildung und Kosten → [Bauen](bauen.md) |
| Angriff, Schaden, Tod         | Bewegung → [Einheiten](einheiten-und-befehle.md) |
| Sichtweite                    | Siegbedingung → [Spielziel](spielziel.md) |

## Die Werte stehen in den Daten

Leben, Angriff, Rüstung, Reichweite, Tempo und Bonus jeder Einheit stehen in
`server/spiele/strategie/daten.js`, abgeschrieben aus der
[Vorlage](../../docs/strategie/vorlage-aoe2.md). Hier steht keine zweite
Tabelle — eine Tabelle, die neben den Daten herläuft, ist nach der dritten
Änderung falsch.

**Der Schaden** ist die eine Regel, die hierher gehört:

```
Schaden = max(1, Angriff − Rüstung des Ziels in dieser Art
                 + Bonus des Angreifers auf eine Klasse des Ziels)
```

`Art` ist **nah** oder **fern**: eine Einheit mit `reichweite: 0` trifft die
Nahrüstung, eine mit Reichweite die Fernrüstung. Der Bonus zielt auf eine
**Rüstungsklasse** (`kavallerie`, `infanterie`, `speer`, `bogenschuetze`),
nicht auf eine Einheitenart — so trifft derselbe Eintrag in Stufe D auch den
Ritter.

Der Kreis der Feudalzeit: **Speerkämpfer schlägt Reiter** (+15),
**Bogenschütze schlägt Speerkämpfer** (+3), **Plänkler schlägt
Bogenschützen** (+3). Damit ist keine Einheit immer richtig — die Bedingung
aus [Spielziel](spielziel.md) AC-10, gemessen in
[Fahrplan](fahrplan.md) AC-9.

## Abnahmekriterien

### Angreifen

- **AC-1** `fertig` **Rechtsklick auf Feindliches greift an** — Auf eine fremde Einheit oder ein
  fremdes Gebäude. Kein eigener Knopf, keine eigene Betriebsart. Die Einheit
  läuft hin, bis das Ziel in ihrer Reichweite ist, und schlägt dann zu.
  Mehrere Angreifer bekommen je ein eigenes Feld um das Ziel, wie beim Gehen
  ([Einheiten](einheiten-und-befehle.md) AC-20): sonst stehen drei dort, wo
  der erste gerade nah genug war, und im Bild übereinander.
- **AC-2** `fertig` **Kampfeinheiten wehren sich von selbst** — Was in die Sichtweite einer
  **stehenden** Kampfeinheit kommt, wird ohne Befehl angegriffen; wer einen
  Auftrag oder einen Weg hat, geht weiter. Ein Dorfbewohner tut das nicht: er
  arbeitet weiter, bis er selbst getroffen wird — dann lässt er die Arbeit
  liegen und schlägt zurück. Wer wacht, steht als Wert in den Daten, nicht als
  Frage nach der Einheitenart.
- **AC-3** `fertig` **Verfolgung endet** — Ein fliehendes Ziel wird höchstens fünf Felder weit vom
  Ausgangsplatz verfolgt, dann kehrt die Einheit dorthin zurück. Sonst zieht
  ein einzelner Reiter ein ganzes Heer quer über die Karte. Das gilt für die
  Verfolgung, die **niemand befohlen** hat — AC-2 und die Gegenwehr; ein
  ausdrücklicher Angriffsbefehl wird zu Ende gegangen, sonst ließe sich ein
  Fliehender nie stellen.
- **AC-4** `offen` **Angriffslauf** — Ein Befehl auf ein leeres Feld, bei dem unterwegs alles
  angegriffen wird, was im Weg steht.
- **AC-5** `fertig` **Dorfbewohner kämpfen schlecht** — Angriff 3, keine Boni, keine Rüstung:
  fünfzehn Schläge für einen Soldaten, während er nach fünf fällt. Ein
  früher Überfall auf die Basis geht nicht widerstandslos durch — wer sich
  wehrt, sammelt nicht, und das ist der eigentliche Preis.

### Schaden

- **AC-6** `fertig` **Schaden nach der Vorlage** — `max(1, Angriff − Rüstung + Bonus)`, nah gegen
  die Nahrüstung, fern gegen die Fernrüstung, der Bonus auf die
  Rüstungsklasse des Ziels. Keine Verdopplung, keine Ausnahme je Einheit —
  eine Formel für alle.
- **AC-7** `fertig` **Jede Einheit hat ihre Nachladezeit** — Nach der Vorlage: Miliz, Soldat,
  Späherreiter und Dorfbewohner 2,0 s, Bogenschütze 2,0 s, Speerkämpfer und
  Plänkler 3,0 s. Ein gemeinsamer Takt für alle wäre lesbarer, verfälscht
  aber den Kreis — der Plänkler ist langsam, dafür billig.
- **AC-8** `fertig` **Kein Zufall im Schaden** — Gleiche Lage, gleiches Ergebnis. Würfel machen
  Niederlagen unerklärlich, und erklärbare Niederlagen sind das, was zur
  nächsten Partie führt.
- **AC-9** `zurueckgestellt` (abgeloest durch darstellung AC-8) **Leben ist sichtbar** — Der Lebensbalken über Beschädigtem ist
  mit Stufe A gebaut, dort geprüft und dort bebildert.
- **AC-10** `fertig` **Tote verschwinden nach zwei Sekunden** — Lange genug, um zu sehen, was passiert
  ist: der Gefallene kippt um, liegt blass am Boden und zählt vom Schlag an
  nicht mehr — nicht zur Bevölkerung, nicht zur Auswahl, nicht als Ziel.

### Sicht

- **AC-11** `offen` **Sichtweite aus den Daten** — `sicht` je Einheit
  (vier bis sechs Felder), Gebäude acht. Was niemand sieht, wird nicht
  dargestellt.
- **AC-12** `offen` **Erkundetes bleibt erinnert** — Gelände bleibt sichtbar, fremde Einheiten
  nicht. Der klassische Nebel: man weiß, wo der Wald steht, aber nicht, wer
  gerade dort ist.
- **AC-13** `offen` **Kein Blick durch fremde Augen** — Der Server schickt einem Spieler nur, was
  seine Einheiten sehen. Sonst liest ein verändertes Programm die ganze Karte
  mit — die Zustandsnachricht enthält heute alles.
- **AC-14** `offen` **Angriff wird gemeldet** — Wer angegriffen wird, bekommt einen Hinweis und
  kann per Klick dorthin springen.

## Grenzfaelle

- Zwei Einheiten, die sich gegenseitig töten, sterben beide. Kein Vorrang für
  den, der zuerst dran war.
- Ein Gebäude im Bau, dessen Bauplatz von Feinden umstellt ist, wird trotzdem
  fertig — Bauen ist kein Kampf.
- Stirbt das Ziel, während der Angreifer noch hinläuft, bleibt er stehen und
  sucht sich nach AC-2 ein neues — er läuft nicht auf das leere Feld.
- Ein Ziel, das die Einheit nicht erreichen kann (eingemauert, auf der
  anderen Seite eines Gebäudes), lässt sie nach erfolgloser Wegsuche stehen;
  der Auftrag endet, statt endlos zu rechnen.
- Ein Gebäude ohne Leben verschwindet samt seinem Platz auf der Karte — über
  die Fläche lässt sich danach laufen und bauen. Trümmer gibt es nicht; die
  wären eine Entscheidung für Stufe C.
- Die Schläge eines Takts werden an seinem Ende zusammen abgerechnet. Nur
  deshalb sterben zwei Einheiten, die einander den letzten Schlag versetzen,
  beide.
- **Gebäude greift niemand von selbst an.** AC-2 gilt für Einheiten; sonst
  liefe jede Wache in das nächste fremde Dorfzentrum, statt zu Hause zu
  wachen.
- Vier Dorfbewohner **erschlagen** einen Soldaten (4 × 3 gegen 45 Leben sind
  vier Runden, er braucht für einen von ihnen fünf) — einer allein nie. Die
  frühere Fassung von AC-5 behauptete das Gegenteil; nach den Zahlen der
  Vorlage ist es falsch.
- Wer sich erst wehrt, **nachdem** er getroffen wurde, verliert eine Runde:
  im Zweikampf gegen einen Soldaten bringt ein Dorfbewohner deshalb 12 statt
  15 Schaden an.
- Ein Nahkämpfer geht beim ersten Hinlaufen seinen zugewiesenen Platz zu Ende
  (AC-1); war er einmal in Reichweite, schlägt er zu, sobald er wieder nah
  genug ist. Sonst laufen zwei, die einander jagen, aneinander vorbei, ohne je
  zu schlagen.

## Hinweis zu AC-13

Das ist der einzige Punkt hier, der die
[Übertragung](../00-plattform/uebertragung.md) verändert: Heute bekommt jeder
Spieler den vollständigen Zustand. Sichtbereiche bedeuten, dass der Server je
Spieler filtert — mehr Rechenzeit je Takt und größere Nachrichten in Summe.
Wenn das teuer wird, ist es eine Entscheidung für ein ADR, keine Kleinigkeit
im Kampf.
