<!-- Erzeugt von scripts/spec-board.mjs. Nicht von Hand aendern --
     der Status steht am Abnahmekriterium in der jeweiligen Spec. -->

# Arbeitsvorrat

Eine Zeile je Abnahmekriterium. Gepflegt wird der Status in der Spec selbst,
hier steht er zusammengefasst. Erzeugt mit `npm run specs:board`; als Seite
mit Bildnachweisen, Filter und Suche mit `npm run qa:report`.

**Gesamt:** 691/775 fertig · 3 in Arbeit · 19 in QA · 3 geplant · 51 offen · 8 zurueckgestellt

**Nachweise:** 361 Kriterien mit Bild · 340 ohne Bild, begruendet in `qa/ohne-bild.json`

## Nach Spezifikation

| Spezifikation                                                  | In Arbeit | In QA | Geplant | Offen | Zurueckgestellt | Fertig |
| -------------------------------------------------------------- | --------- | ----- | ------- | ----- | --------------- | ------ |
| [Konten und Anmeldung](00-plattform/konten.md)                 | -         | 1     | 2       | 3     | -               | 14     |
| [Raeume und Partien](00-plattform/raeume.md)                   | -         | 2     | -       | 3     | -               | 13     |
| [Schutz vor Fremdnutzung](00-plattform/schutz.md)              | -         | 1     | -       | 4     | -               | 7      |
| [Anhalten und Fortsetzen](00-plattform/speichern.md)           | -         | -     | -       | 1     | -               | 26     |
| [Spielauswahl und Einstellungen](00-plattform/spielauswahl.md) | -         | -     | -       | 5     | -               | 19     |
| [Uebertragung](00-plattform/uebertragung.md)                   | -         | -     | 1       | 1     | -               | 8      |
| [Bauen und Ausbilden](10-strategie/bauen.md)                   | -         | -     | -       | -     | -               | 62     |
| [Bedienung](10-strategie/bedienung.md)                         | -         | 2     | -       | 3     | -               | 84     |
| [Darstellung](10-strategie/darstellung.md)                     | 1         | 1     | -       | 4     | -               | 27     |
| [Einheiten und Befehle](10-strategie/einheiten-und-befehle.md) | -         | 1     | -       | 2     | 1               | 63     |
| [Fahrplan zum Klon](10-strategie/fahrplan.md)                  | -         | 2     | -       | 2     | -               | 22     |
| [Kampf](10-strategie/kampf.md)                                 | -         | -     | -       | -     | 1               | 31     |
| [Karte und Vorraete](10-strategie/karte-und-vorraete.md)       | -         | -     | -       | 2     | 3               | 14     |
| [KI-Spieler](10-strategie/ki.md)                               | -         | 1     | -       | 2     | -               | 37     |
| [Spielziel und Partieverlauf](10-strategie/spielziel.md)       | 1         | -     | -       | 10    | -               | 18     |
| [Aufstellung, Taktik und Training](15-manager/aufstellung.md)  | -         | -     | -       | -     | 2               | 23     |
| [Ausbau](15-manager/ausbau.md)                                 | -         | -     | -       | -     | -               | 1      |
| [Bedienung des Managerspiels](15-manager/bedienung.md)         | -         | -     | -       | -     | -               | 20     |
| [Finanzen](15-manager/finanzen.md)                             | -         | -     | -       | -     | -               | 19     |
| [Kader und Spieler](15-manager/kader.md)                       | -         | 3     | -       | 1     | -               | 29     |
| [Karriere: Saison um Saison](15-manager/karriere.md)           | -         | -     | -       | 1     | -               | 29     |
| [Liga und Saison](15-manager/liga.md)                          | -         | -     | -       | -     | -               | 18     |
| [Pokal](15-manager/pokal.md)                                   | -         | -     | -       | -     | -               | 8      |
| [Prüfstand](15-manager/pruefstand.md)                          | -         | -     | -       | -     | -               | 1      |
| [Spieltag](15-manager/spieltag.md)                             | -         | -     | -       | -     | -               | 31     |
| [Spielziel und Abgrenzung](15-manager/spielziel.md)            | -         | -     | -       | 2     | -               | 15     |
| [Transfermarkt](15-manager/transfer.md)                        | -         | 1     | -       | -     | 1               | 29     |
| [Verträge](15-manager/vertraege.md)                            | -         | -     | -       | -     | -               | 11     |
| [Vorstand](15-manager/vorstand.md)                             | -         | -     | -       | -     | -               | 10     |
| [Betrieb](20-betrieb/betrieb.md)                               | 1         | 4     | -       | 5     | -               | 2      |

## In Arbeit (3)

- **Alle Einheiten gerendert** — [Darstellung](10-strategie/darstellung.md) AC-24
- **Zeitalter gliedern die Partie** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-1
- **Zahlen sind abrufbar** — [Betrieb](20-betrieb/betrieb.md) AC-8

## In QA (19)

- **Einladungscodes erzeugen und zuruecknehmen** — [Konten und Anmeldung](00-plattform/konten.md) AC-20
- **Verwaister Raum wird geschlossen** — [Raeume und Partien](00-plattform/raeume.md) AC-12
- **Leerlauf endet nach 30 Minuten** — [Raeume und Partien](00-plattform/raeume.md) AC-13
- **Nachrichtenflut trennt die Verbindung** — [Schutz vor Fremdnutzung](00-plattform/schutz.md) AC-7
- **Militär bei Spielgröße erkennbar** — [Bedienung](10-strategie/bedienung.md) AC-36
- **Vollbild gibt die Tasten** — [Bedienung](10-strategie/bedienung.md) AC-73
- **Einheiten sind Figuren** — [Darstellung](10-strategie/darstellung.md) AC-6
- **Der Drache fliegt und brennt** — [Einheiten und Befehle](10-strategie/einheiten-und-befehle.md) AC-52
- **Läuft auf dem VPS** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-21
- **Aktualisieren ist ein Befehl** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-22
- **KI bildet Spezialeinheit aus** — [KI-Spieler](10-strategie/ki.md) AC-28
- **Alle Namen sind erfunden** — [Kader und Spieler](15-manager/kader.md) AC-7
- **Durchschnittsalter bleibt im Band** — [Kader und Spieler](15-manager/kader.md) AC-24
- **Wer spielt, entwickelt sich** — [Kader und Spieler](15-manager/kader.md) AC-26
- **Wer satt ist, verkauft nicht** — [Transfermarkt](15-manager/transfer.md) AC-30
- **Nur über HTTPS** — [Betrieb](20-betrieb/betrieb.md) AC-1
- **Dienst startet selbst neu** — [Betrieb](20-betrieb/betrieb.md) AC-3
- **Aktualisierung wartet auf leere Räume** — [Betrieb](20-betrieb/betrieb.md) AC-6
- **Konten überleben jede Aktualisierung** — [Betrieb](20-betrieb/betrieb.md) AC-7

## Geplant (3)

- **Mailadresse wird bestaetigt** — [Konten und Anmeldung](00-plattform/konten.md) AC-4
- **Kennwort vergessen** — [Konten und Anmeldung](00-plattform/konten.md) AC-5
- **Automatischer Wiederaufbau** — [Uebertragung](00-plattform/uebertragung.md) AC-10

## Offen (51)

- **Anmeldung ueber Google/GitHub** — [Konten und Anmeldung](00-plattform/konten.md) AC-6
- **Bilanz je Konto** — [Konten und Anmeldung](00-plattform/konten.md) AC-14
- **Konto loeschen** — [Konten und Anmeldung](00-plattform/konten.md) AC-15
- **Voller Raum weist ab** — [Raeume und Partien](00-plattform/raeume.md) AC-4
- **Kein Beitritt in laufende Partie** — [Raeume und Partien](00-plattform/raeume.md) AC-5
- **Abwesenheit ist sichtbar** — [Raeume und Partien](00-plattform/raeume.md) AC-11
- **Nachricht bleibt klein** — [Schutz vor Fremdnutzung](00-plattform/schutz.md) AC-9
- **Partien haben eine Höchstdauer** — [Schutz vor Fremdnutzung](00-plattform/schutz.md) AC-10
- **Statische Dateien haben eigene Bremse** — [Schutz vor Fremdnutzung](00-plattform/schutz.md) AC-11
- **Auffälligkeiten sind sichtbar** — [Schutz vor Fremdnutzung](00-plattform/schutz.md) AC-12
- **Gelöschtes Konto nimmt Spielstände mit** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-15
- **Fortlaufend auch allein spielbar** — [Spielauswahl und Einstellungen](00-plattform/spielauswahl.md) AC-12
- **Liste der eigenen Spielstaende** — [Spielauswahl und Einstellungen](00-plattform/spielauswahl.md) AC-14
- **Fortsetzen ist ein Klick** — [Spielauswahl und Einstellungen](00-plattform/spielauswahl.md) AC-15
- **Umbenennen und Loeschen** — [Spielauswahl und Einstellungen](00-plattform/spielauswahl.md) AC-16
- **Sitzungsspiele erscheinen dort nicht** — [Spielauswahl und Einstellungen](00-plattform/spielauswahl.md) AC-17
- **Befehlsflut wird gebremst** — [Uebertragung](00-plattform/uebertragung.md) AC-4
- **Das Zeitalter steht am Dorf** — [Bedienung](10-strategie/bedienung.md) AC-42
- **Ein Gefecht hinterlässt Spuren** — [Bedienung](10-strategie/bedienung.md) AC-44
- **Das Wappen zeigt das Haus** — [Bedienung](10-strategie/bedienung.md) AC-46
- **Nur eigenes Material** — [Darstellung](10-strategie/darstellung.md) AC-11
- **Acht Blickrichtungen** — [Darstellung](10-strategie/darstellung.md) AC-19
- **Bewegung statt Verschieben** — [Darstellung](10-strategie/darstellung.md) AC-20
- **Spielerfarbe als Akzent** — [Darstellung](10-strategie/darstellung.md) AC-21
- **Einheiten blockieren sich nicht** — [Einheiten und Befehle](10-strategie/einheiten-und-befehle.md) AC-10
- **Marschierende laufen nicht aufeinander** — [Einheiten und Befehle](10-strategie/einheiten-und-befehle.md) AC-32
- **Fünf Häuser wählbar** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-16
- **Kein Haus vorn** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-18
- **Kein Spieler ist abgeschnitten** — [Karte und Vorraete](10-strategie/karte-und-vorraete.md) AC-7
- **Vorraete sind endlich und knapp** — [Karte und Vorraete](10-strategie/karte-und-vorraete.md) AC-10
- **KI liest die Zustandsnachricht** — [KI-Spieler](10-strategie/ki.md) AC-20
- **KI antwortet auf das Heer** — [KI-Spieler](10-strategie/ki.md) AC-31
- **Partiedauer 25 bis 45 Minuten** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-2
- **Kein Aus nach drei Minuten** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-3
- **Aufholen ist möglich** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-4
- **Kein Zug ist immer richtig** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-10
- **Rein sammeln verliert** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-11
- **Rein angreifen verliert auch** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-12
- **Zwei bis acht Spieler** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-13
- **Fünf Häuser mit Profil** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-16
- **Kein Haus gewinnt gegen alle** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-18
- **Ein Aussteiger blockiert nicht** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-15
- **Sterne in einem Band** — [Kader und Spieler](15-manager/kader.md) AC-23
- **Mehrere Menschen in einer Welt** — [Karriere: Saison um Saison](15-manager/karriere.md) AC-16
- **Mehrere Manager, eine Welt** — [Spielziel und Abgrenzung](15-manager/spielziel.md) AC-1
- **Der Termin wartet auf alle** — [Spielziel und Abgrenzung](15-manager/spielziel.md) AC-2
- **Neustart beendet Partien, angekündigt** — [Betrieb](20-betrieb/betrieb.md) AC-5
- **Fehler ins Protokoll, Geheimnisse nie** — [Betrieb](20-betrieb/betrieb.md) AC-9
- **Absturz trifft nicht alle Partien** — [Betrieb](20-betrieb/betrieb.md) AC-10
- **Eine kleine Maschine reicht** — [Betrieb](20-betrieb/betrieb.md) AC-11
- **Bekannte Grenze** — [Betrieb](20-betrieb/betrieb.md) AC-12

## Zurueckgestellt (8)

- **Vollstaendige Sammelschleife** — [Einheiten und Befehle](10-strategie/einheiten-und-befehle.md) AC-11
- **Leben ist sichtbar** — [Kampf](10-strategie/kampf.md) AC-9
- **Vier Feldarten** — [Karte und Vorraete](10-strategie/karte-und-vorraete.md) AC-2
- **Karte ist 64 x 64** — [Karte und Vorraete](10-strategie/karte-und-vorraete.md) AC-3
- **Wald traegt mehr als Beeren** — [Karte und Vorraete](10-strategie/karte-und-vorraete.md) AC-8
- **Wechsel vorher festlegen** — [Aufstellung, Taktik und Training](15-manager/aufstellung.md) AC-13
- **Anweisung je Spieler** — [Aufstellung, Taktik und Training](15-manager/aufstellung.md) AC-15
- **Gehaltsverhandlung** — [Transfermarkt](15-manager/transfer.md) AC-17
