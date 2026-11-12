# Raeume und Partien

**Bereich:** Plattform
**Kuerzel:** raeume
**Stand:** 13/18 fertig · 2 in QA · 3 offen

## Zweck

Ein paar Freunde sollen in unter einer Minute gemeinsam in einer Partie
stehen — ohne Konto, ohne Installation, ohne Absprache ausser einem
sechsstelligen Code.

```
Name eintragen → Partie eroeffnen → Code weitergeben
              → Mitspieler treten bei → Gastgeber startet
```

## Abgrenzung

| Gehoert dazu                        | Gehoert nicht dazu                                  |
| ----------------------------------- | --------------------------------------------------- |
| Raumcode, Beitritt, Start           | Regeln der Partie → [Strategie](../10-strategie/)   |
| Rueckkehr nach Verbindungsabbruch   | Dauerhafte Konten → [Konten](konten.md)             |
| Wer darf starten                    | Uebertragungsformat → [Uebertragung](uebertragung.md) |

## Abnahmekriterien

### Beitritt

- **AC-1** `fertig` **Raum eroeffnen liefert einen Code** — Wer eine Partie eroeffnet, bekommt einen
  sechsstelligen Code aus Zeichen, die man vorlesen kann: keine Vokale, keine
  `0`/`O`, keine `1`/`I`. Angezeigt wird er in zwei Dreiergruppen: `KRN-4TZ`.
- **AC-15** `fertig` **Code wird nachsichtig gelesen** — Bindestriche, Leerzeichen und
  Kleinschreibung beim Eintippen sind erlaubt. Wer `krn 4tz` eingibt, kommt
  in denselben Raum.
- **AC-2** `fertig` **Beitritt ueber den Code** — Mit Code und Namen tritt ein zweiter Spieler bei;
  beide sehen danach dieselbe Spielerliste.
- **AC-3** `fertig` **Unbekannter Code wird abgewiesen** — Ein Code, den es nicht gibt, fuehrt zu einer
  Meldung, nicht zu einem leeren Raum.
- **AC-4** `offen` **Voller Raum weist ab** — Ab dem siebten Spieler wird der Beitritt mit Begruendung
  abgelehnt.
- **AC-5** `offen` **Kein Beitritt in laufende Partie** — Wer nach dem Start beitreten will, bekommt
  eine Meldung. Ein Nachruecken gibt es nicht.

### Start

- **AC-6** `fertig` **Allein startet niemand** — Unter zwei Spielern laesst sich nicht starten.
- **AC-7** `fertig` **Nur der Gastgeber startet** — Nur wer den Raum eroeffnet hat, kann die Partie
  starten. Ein Startbefehl von anderen wird abgelehnt, nicht ignoriert.
- **AC-8** `fertig` **Start verteilt denselben Aufbau** — Beim Start bekommen alle Spieler dieselbe
  Karte und dieselbe Spielerliste, jeder mit eigener Farbe und Basis.

### Rueckkehr

- **AC-9** `fertig` **Platz ueberlebt den Abbruch** — Faellt ein Spieler heraus, bleiben seine
  Einheiten stehen und sein Platz erhalten. Die Partie laeuft weiter.
- **AC-10** `fertig` **Rueckkehr mit Token** — Mit seinem Token kehrt derselbe Spieler auf seinen
  Platz zurueck und bekommt Aufbau und Zustand erneut geschickt.
- **AC-11** `offen` **Abwesenheit ist sichtbar** — Die Mitspieler sehen in der Liste, wer gerade nicht
  verbunden ist. _(Server und Liste koennen es bereits; im Spielbild fehlt die
  Anzeige noch.)_

### Aufraeumen

- **AC-12** `in-qa` **Verwaister Raum wird geschlossen** — Ein Raum, in dem nach einer Minute niemand
  mehr verbunden ist, wird geschlossen und seine Uhr angehalten. Das gilt dem
  Warteraum und der entschiedenen Partie; eine **laufende** Partie wartet
  laenger (AC-17).
- **AC-13** `in-qa` **Leerlauf endet nach 30 Minuten** — Ein Raum ohne jeden Befehl wird nach 30
  Minuten geschlossen.

- **AC-17** `fertig` **Laufende Partie wartet** — Gehen alle aus einer
  laufenden Partie, bleibt der Raum stehen und seine **Uhr haelt an**: wer
  allein gegen den Computer spielte und neu lud, fand vorher keinen Raum mehr
  ("Diesen Raumcode gibt es nicht", das erste Spiel auf dem Server,
  2026-11-12). Kehrt einer zurueck (AC-10), geht sie weiter, wo sie stand —
  nachgeholt wird nichts. Nach 30 Minuten ohne jeden am Tisch wird sie
  geschlossen (wie AC-13). Sie **sperrt niemanden aus**: steht eine Grenze
  des Schutzes dem Eroeffnen im Weg, weicht die am laengsten verlassene
  Partie — zuerst eine desselben Anschlusses. Fuer den Betreiber zaehlt sie
  nicht als laufend; ein Ausrollen wartet nicht auf sie. Ein Raum vor dem
  Start schliesst weiter mit dem Letzten, der geht.
- **AC-18** `fertig` **Der Vorraum bietet die Rueckkehr** — Der Browser merkt
  sich die laufende Partie ueber das Schliessen des Fensters hinweg. Wer die
  Seite wieder oeffnet, sieht im Vorraum "Du warst in der Partie KRN-4TZ" mit
  "Zurueckkehren" und "verwerfen" — niemand muss Code oder Token kennen. Von
  selbst geht es nur nach einem Neuladen im selben Fenster zurueck (AC-10);
  ein zweites Fenster naehme sonst dem ersten den Platz. Gibt es Partie oder
  Platz nicht mehr, sagt der Server das **einmal** ("Diese Partie gibt es
  nicht mehr", mit `platzWeg`), und der Browser vergisst den Platz — die
  Absage kam vorher bei jedem Neuladen wieder. Eine entschiedene Partie wird
  nicht angeboten, eine aeltere als 30 Minuten auch nicht, und keine, aus der
  man ausgeschieden ist - sie laeuft vielleicht weiter, aber nicht mehr fuer
  einen selbst. Die Liste aller
  eigenen offenen Partien am Konto und das Fortsetzen nach einem Neustart des
  Servers gehoeren zum Speichern (eigene Spec, noch nicht gebaut).

### Robustheit

- **AC-14** `fertig` **Unsinn bringt Server nicht um** — Kein JSON, unbekannte Nachrichtentypen,
  falsche Datentypen und Ziele ausserhalb der Karte lassen den Server
  weiterlaufen und andere Raeume unberuehrt.

### Mehrere Spiele

- **AC-16** `fertig` **Der Raum kennt kein Spiel** — Der Raum erzeugt die Welt ueber den
  Steckbrief des gewaehlten Spiels (`erzeugen(spieler, einstellungen)`,
  `takte` je Sekunde, seit Runde 159 auch als Funktion der Einstellungen —
  spielziel AC-23) und spricht mit ihr nur ueber `aufbau`, `takten`,
  `zustand` und `befehl` ([ADR-0006](../../docs/adr/0006-mehrere-spiele.md)).
  `raeume.js` laedt kein Spiel selbst; ein zweites Spiel mit Raum braucht dort
  keine Zeile.

## Grenzfaelle

- Zwei Spieler mit demselben Namen sind erlaubt — unterschieden wird ueber die
  Kennung, nicht ueber den Namen.
- Ein leerer Name wird zu `Namenlos`, statt den Beitritt zu verweigern.
- Der Gastgeber ist der erste in der Liste. Verlaesst er den Raum **vor** dem
  Start, rueckt der naechste nach. Das ist noch nicht belegt → AC-7 deckt nur
  den Normalfall.
