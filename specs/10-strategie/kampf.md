# Kampf

**Bereich:** Strategie
**Kuerzel:** kampf
**Stand:** 0/14 fertig · 13 offen · 1 zurueckgestellt

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

- **AC-1** `offen` **Rechtsklick auf Feindliches greift an** — Auf eine fremde Einheit oder ein
  fremdes Gebäude. Kein eigener Knopf, keine eigene Betriebsart. Die Einheit
  läuft hin, bis das Ziel in ihrer Reichweite ist, und schlägt dann zu.
- **AC-2** `offen` **Kampfeinheiten wehren sich von selbst** — Was in die Sichtweite einer
  stehenden Kampfeinheit kommt, wird ohne Befehl angegriffen. Ein
  Dorfbewohner tut das nicht: er arbeitet weiter, bis er selbst getroffen
  wird.
- **AC-3** `offen` **Verfolgung endet** — Ein fliehendes Ziel wird höchstens fünf Felder weit vom
  Ausgangsplatz verfolgt, dann kehrt die Einheit dorthin zurück. Sonst zieht
  ein einzelner Reiter ein ganzes Heer quer über die Karte.
- **AC-4** `offen` **Angriffslauf** — Ein Befehl auf ein leeres Feld, bei dem unterwegs alles
  angegriffen wird, was im Weg steht.
- **AC-5** `offen` **Dorfbewohner kämpfen schlecht** — Angriff 3, keine Boni, keine Rüstung: ein
  früher Überfall auf die Basis geht nicht widerstandslos durch, aber vier
  Dorfbewohner halten auch keinen Soldaten auf.

### Schaden

- **AC-6** `offen` **Schaden nach der Vorlage** — `max(1, Angriff − Rüstung + Bonus)`, nah gegen
  die Nahrüstung, fern gegen die Fernrüstung, der Bonus auf die
  Rüstungsklasse des Ziels. Keine Verdopplung, keine Ausnahme je Einheit —
  eine Formel für alle.
- **AC-7** `offen` **Jede Einheit hat ihre Nachladezeit** — Nach der Vorlage: Miliz, Soldat,
  Späherreiter und Dorfbewohner 2,0 s, Bogenschütze 2,0 s, Speerkämpfer und
  Plänkler 3,0 s. Ein gemeinsamer Takt für alle wäre lesbarer, verfälscht
  aber den Kreis — der Plänkler ist langsam, dafür billig.
- **AC-8** `offen` **Kein Zufall im Schaden** — Gleiche Lage, gleiches Ergebnis. Würfel machen
  Niederlagen unerklärlich, und erklärbare Niederlagen sind das, was zur
  nächsten Partie führt.
- **AC-9** `zurueckgestellt` (abgeloest durch darstellung AC-8) **Leben ist sichtbar** — Der Lebensbalken über Beschädigtem ist
  mit Stufe A gebaut, dort geprüft und dort bebildert.
- **AC-10** `offen` **Tote verschwinden nach zwei Sekunden** — Lange genug, um zu sehen, was passiert
  ist.

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

## Hinweis zu AC-13

Das ist der einzige Punkt hier, der die
[Übertragung](../00-plattform/uebertragung.md) verändert: Heute bekommt jeder
Spieler den vollständigen Zustand. Sichtbereiche bedeuten, dass der Server je
Spieler filtert — mehr Rechenzeit je Takt und größere Nachrichten in Summe.
Wenn das teuer wird, ist es eine Entscheidung für ein ADR, keine Kleinigkeit
im Kampf.
