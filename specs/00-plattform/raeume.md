# Raeume und Partien

**Bereich:** Plattform
**Kuerzel:** raeume
**Stand:** 10/15 fertig · 2 in QA · 3 offen

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
  mehr verbunden ist, wird geschlossen und seine Uhr angehalten.
- **AC-13** `in-qa` **Leerlauf endet nach 30 Minuten** — Ein Raum ohne jeden Befehl wird nach 30
  Minuten geschlossen.

### Robustheit

- **AC-14** `fertig` **Unsinn bringt Server nicht um** — Kein JSON, unbekannte Nachrichtentypen,
  falsche Datentypen und Ziele ausserhalb der Karte lassen den Server
  weiterlaufen und andere Raeume unberuehrt.

## Grenzfaelle

- Zwei Spieler mit demselben Namen sind erlaubt — unterschieden wird ueber die
  Kennung, nicht ueber den Namen.
- Ein leerer Name wird zu `Namenlos`, statt den Beitritt zu verweigern.
- Der Gastgeber ist der erste in der Liste. Verlaesst er den Raum **vor** dem
  Start, rueckt der naechste nach. Das ist noch nicht belegt → AC-7 deckt nur
  den Normalfall.
