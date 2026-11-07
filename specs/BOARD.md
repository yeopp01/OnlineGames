<!-- Erzeugt von scripts/spec-board.mjs. Nicht von Hand aendern --
     der Status steht am Abnahmekriterium in der jeweiligen Spec. -->

# Arbeitsvorrat

Eine Zeile je Abnahmekriterium. Gepflegt wird der Status in der Spec selbst,
hier steht er zusammengefasst. Erzeugt mit `npm run specs:board`; als Seite
mit Bildnachweisen, Filter und Suche mit `npm run qa:report`.

**Gesamt:** 358/503 fertig · 1 in Arbeit · 5 in QA · 4 geplant · 128 offen · 7 zurueckgestellt

**Nachweise:** 140 Kriterien mit Bild · 222 ohne Bild, begruendet in `qa/ohne-bild.json`

## Nach Spezifikation

| Spezifikation                                                  | In Arbeit | In QA | Geplant | Offen | Zurueckgestellt | Fertig |
| -------------------------------------------------------------- | --------- | ----- | ------- | ----- | --------------- | ------ |
| [Konten und Anmeldung](00-plattform/konten.md)                 | -         | 1     | 2       | 3     | -               | 14     |
| [Raeume und Partien](00-plattform/raeume.md)                   | -         | 2     | -       | 3     | -               | 11     |
| [Schutz vor Fremdnutzung](00-plattform/schutz.md)              | -         | 1     | -       | 4     | -               | 7      |
| [Anhalten und Fortsetzen](00-plattform/speichern.md)           | -         | -     | -       | 26    | -               | -      |
| [Spielauswahl und Einstellungen](00-plattform/spielauswahl.md) | -         | -     | -       | 5     | -               | 12     |
| [Uebertragung](00-plattform/uebertragung.md)                   | -         | -     | 2       | 1     | -               | 7      |
| [Bauen und Ausbilden](10-strategie/bauen.md)                   | -         | -     | -       | 6     | -               | 20     |
| [Bedienung](10-strategie/bedienung.md)                         | -         | -     | -       | 12    | -               | 22     |
| [Darstellung](10-strategie/darstellung.md)                     | -         | -     | -       | 1     | -               | 13     |
| [Einheiten und Befehle](10-strategie/einheiten-und-befehle.md) | -         | -     | -       | 3     | 1               | 17     |
| [Fahrplan zum Klon](10-strategie/fahrplan.md)                  | -         | -     | -       | 15    | -               | 7      |
| [Kampf](10-strategie/kampf.md)                                 | -         | -     | -       | 14    | -               | -      |
| [Karte und Vorraete](10-strategie/karte-und-vorraete.md)       | -         | -     | -       | 2     | 3               | 12     |
| [KI-Spieler](10-strategie/ki.md)                               | -         | -     | -       | 1     | -               | 8      |
| [Spielziel und Partieverlauf](10-strategie/spielziel.md)       | 1         | -     | -       | 17    | -               | -      |
| [Aufstellung, Taktik und Training](15-manager/aufstellung.md)  | -         | -     | -       | -     | 2               | 23     |
| [Bedienung des Managerspiels](15-manager/bedienung.md)         | -         | -     | -       | -     | -               | 15     |
| [Finanzen](15-manager/finanzen.md)                             | -         | -     | -       | -     | -               | 16     |
| [Kader und Spieler](15-manager/kader.md)                       | -         | 1     | -       | -     | -               | 21     |
| [Karriere: Saison um Saison](15-manager/karriere.md)           | -         | -     | -       | 1     | -               | 25     |
| [Liga und Saison](15-manager/liga.md)                          | -         | -     | -       | -     | -               | 18     |
| [Pokal](15-manager/pokal.md)                                   | -         | -     | -       | -     | -               | 8      |
| [Prüfstand](15-manager/pruefstand.md)                          | -         | -     | -       | -     | -               | 1      |
| [Spieltag](15-manager/spieltag.md)                             | -         | -     | -       | -     | -               | 23     |
| [Spielziel und Abgrenzung](15-manager/spielziel.md)            | -         | -     | -       | 2     | -               | 13     |
| [Transfermarkt](15-manager/transfer.md)                        | -         | -     | -       | -     | 1               | 24     |
| [Verträge](15-manager/vertraege.md)                            | -         | -     | -       | -     | -               | 11     |
| [Vorstand](15-manager/vorstand.md)                             | -         | -     | -       | -     | -               | 10     |
| [Betrieb](20-betrieb/betrieb.md)                               | -         | -     | -       | 12    | -               | -      |

## In Arbeit (1)

- **Zeitalter gliedern die Partie** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-1

## In QA (5)

- **Einladungscodes erzeugen und zuruecknehmen** — [Konten und Anmeldung](00-plattform/konten.md) AC-20
- **Verwaister Raum wird geschlossen** — [Raeume und Partien](00-plattform/raeume.md) AC-12
- **Leerlauf endet nach 30 Minuten** — [Raeume und Partien](00-plattform/raeume.md) AC-13
- **Nachrichtenflut trennt die Verbindung** — [Schutz vor Fremdnutzung](00-plattform/schutz.md) AC-7
- **Alle Namen sind erfunden** — [Kader und Spieler](15-manager/kader.md) AC-7

## Geplant (4)

- **Mailadresse wird bestaetigt** — [Konten und Anmeldung](00-plattform/konten.md) AC-4
- **Kennwort vergessen** — [Konten und Anmeldung](00-plattform/konten.md) AC-5
- **Abbruch ist sichtbar** — [Uebertragung](00-plattform/uebertragung.md) AC-9
- **Automatischer Wiederaufbau** — [Uebertragung](00-plattform/uebertragung.md) AC-10

## Offen (128)

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
- **Ein Spielstand ist ein Datenwert** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-1
- **Laden ergibt exakt dieselbe Welt** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-2
- **Selbsttätig jede Minute** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-3
- **Gesichert wird auch beim Anhalten** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-4
- **Ein Spielstand bleibt klein** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-5
- **Kaputter Spielstand nimmt nichts mit** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-6
- **Anhalten ist jederzeit möglich** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-7
- **Wegklicken ist dasselbe wie Anhalten** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-8
- **Fortsetzen öffnet einen neuen Raum** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-9
- **Fortsetzen, wo aufgehört wurde** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-10
- **Ein Spielstand läuft nur einmal** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-11
- **Ein Spielstand gehört einem Konto** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-12
- **Nur Eigentümer öffnet, benennt, löscht** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-13
- **Mitspieler dürfen mitbauen, nicht besitzen** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-14
- **Gelöschtes Konto nimmt Spielstände mit** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-15
- **Jeder Spielstand trägt eine Fassungsnummer** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-16
- **Unbekannte Fassung wird abgelehnt** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-17
- **Ältere Fassungen werden hochgezogen** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-18
- **Pause hält die Uhr an** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-19
- **Anhalten ist begrenzt** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-20
- **Fortsetzen kann jeder** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-21
- **Sichern verlangt Einigkeit** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-22
- **Der Gastgeber besitzt den Stand** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-23
- **Fortsetzen wartet auf dieselben Plätze** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-24
- **Fehlender Spieler blockiert nicht ewig** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-25
- **Beteiligte stehen im Spielstand** — [Anhalten und Fortsetzen](00-plattform/speichern.md) AC-26
- **Fortlaufend auch allein spielbar** — [Spielauswahl und Einstellungen](00-plattform/spielauswahl.md) AC-12
- **Liste der eigenen Spielstaende** — [Spielauswahl und Einstellungen](00-plattform/spielauswahl.md) AC-14
- **Fortsetzen ist ein Klick** — [Spielauswahl und Einstellungen](00-plattform/spielauswahl.md) AC-15
- **Umbenennen und Loeschen** — [Spielauswahl und Einstellungen](00-plattform/spielauswahl.md) AC-16
- **Sitzungsspiele erscheinen dort nicht** — [Spielauswahl und Einstellungen](00-plattform/spielauswahl.md) AC-17
- **Befehlsflut wird gebremst** — [Uebertragung](00-plattform/uebertragung.md) AC-4
- **Gebäude im Bau angreifbar** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-7
- **Schmiede verbessert Angriff und Rüstung** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-25
- **Verbesserungen der Wirtschaft** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-26
- **Gebäude haben Leben** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-17
- **Zerstörte Gebäude nehmen Plätze mit** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-18
- **Eroberung entscheidet** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-19
- **Umschalt erweitert** — [Bedienung](10-strategie/bedienung.md) AC-3
- **Doppelklick wählt den Typ** — [Bedienung](10-strategie/bedienung.md) AC-4
- **Auswahl merken** — [Bedienung](10-strategie/bedienung.md) AC-5
- **Schieben am Bildschirmrand** — [Bedienung](10-strategie/bedienung.md) AC-9
- **Leertaste springt zur Basis** — [Bedienung](10-strategie/bedienung.md) AC-10
- **Der Befehl ist sofort sichtbar** — [Bedienung](10-strategie/bedienung.md) AC-13
- **Warteschlange mit Umschalt** — [Bedienung](10-strategie/bedienung.md) AC-14
- **Verbindungsverlust ist sichtbar** — [Bedienung](10-strategie/bedienung.md) AC-19
- **Spielstand aller Spieler einsehbar** — [Bedienung](10-strategie/bedienung.md) AC-20
- **Die erste Partie erklärt sich** — [Bedienung](10-strategie/bedienung.md) AC-21
- **Läuft auf einem Laptop-Bildschirm** — [Bedienung](10-strategie/bedienung.md) AC-23
- **Angriffsbefehl ist erkennbar** — [Bedienung](10-strategie/bedienung.md) AC-34
- **Nur eigenes Material** — [Darstellung](10-strategie/darstellung.md) AC-11
- **Einheiten blockieren sich nicht** — [Einheiten und Befehle](10-strategie/einheiten-und-befehle.md) AC-10
- **Miliz wird Soldat** — [Einheiten und Befehle](10-strategie/einheiten-und-befehle.md) AC-24
- **Fernkämpfer halten Abstand** — [Einheiten und Befehle](10-strategie/einheiten-und-befehle.md) AC-25
- **Feudalzeit spielbar** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-8
- **Der Konterkreis hält** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-9
- **Kein Schlachtenglück** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-10
- **KI spielt ganze Partien** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-11
- **Mensch gegen KI spielbar** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-12
- **Nebel auf dem Server** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-13
- **Ritterzeit spielbar** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-14
- **Befestigung hält auf** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-15
- **Fünf Völker wählbar** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-16
- **Ein Volk ist ein Eintrag** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-17
- **Kein Volk vorn** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-18
- **Imperialzeit spielbar** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-19
- **Große Partie bleibt flüssig** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-20
- **Läuft auf dem VPS** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-21
- **Aktualisieren ist ein Befehl** — [Fahrplan zum Klon](10-strategie/fahrplan.md) AC-22
- **Rechtsklick auf Feindliches greift an** — [Kampf](10-strategie/kampf.md) AC-1
- **Einheiten wehren sich von selbst** — [Kampf](10-strategie/kampf.md) AC-2
- **Verfolgung endet** — [Kampf](10-strategie/kampf.md) AC-3
- **Angriffslauf** — [Kampf](10-strategie/kampf.md) AC-4
- **Sammler kämpfen schlecht** — [Kampf](10-strategie/kampf.md) AC-5
- **Bonus gegen die schwache Seite** — [Kampf](10-strategie/kampf.md) AC-6
- **Ein Schlag je Sekunde** — [Kampf](10-strategie/kampf.md) AC-7
- **Kein Zufall im Schaden** — [Kampf](10-strategie/kampf.md) AC-8
- **Leben ist sichtbar** — [Kampf](10-strategie/kampf.md) AC-9
- **Tote verschwinden nach zwei Sekunden** — [Kampf](10-strategie/kampf.md) AC-10
- **Einheiten sehen fünf Felder weit** — [Kampf](10-strategie/kampf.md) AC-11
- **Erkundetes bleibt erinnert** — [Kampf](10-strategie/kampf.md) AC-12
- **Kein Blick durch fremde Augen** — [Kampf](10-strategie/kampf.md) AC-13
- **Angriff wird gemeldet** — [Kampf](10-strategie/kampf.md) AC-14
- **Kein Spieler ist abgeschnitten** — [Karte und Vorraete](10-strategie/karte-und-vorraete.md) AC-7
- **Vorraete sind endlich und knapp** — [Karte und Vorraete](10-strategie/karte-und-vorraete.md) AC-10
- **Die KI steigt auf** — [KI-Spieler](10-strategie/ki.md) AC-9
- **Partiedauer 25 bis 45 Minuten** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-2
- **Kein Aus nach drei Minuten** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-3
- **Aufholen ist möglich** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-4
- **Sieg durch Eroberung** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-5
- **Aufgeben ist möglich** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-6
- **Verlierer bleiben Zuschauer** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-7
- **Abschlussbild mit Zahlen** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-8
- **Revanche mit einem Klick** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-9
- **Kein Zug ist immer richtig** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-10
- **Rein sammeln verliert** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-11
- **Rein angreifen verliert auch** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-12
- **Zwei bis acht Spieler** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-13
- **Fünf Völker mit Profil** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-16
- **Ein Volk ist Daten** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-17
- **Kein Volk gewinnt gegen alle** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-18
- **Bündnisse sind nicht vorgesehen** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-14
- **Ein Aussteiger blockiert nicht** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-15
- **Mehrere Menschen in einer Welt** — [Karriere: Saison um Saison](15-manager/karriere.md) AC-16
- **Mehrere Manager, eine Welt** — [Spielziel und Abgrenzung](15-manager/spielziel.md) AC-1
- **Der Termin wartet auf alle** — [Spielziel und Abgrenzung](15-manager/spielziel.md) AC-2
- **Nur über HTTPS** — [Betrieb](20-betrieb/betrieb.md) AC-1
- **Proxy-Adresse ist eingeschaltet** — [Betrieb](20-betrieb/betrieb.md) AC-2
- **Dienst startet selbst neu** — [Betrieb](20-betrieb/betrieb.md) AC-3
- **Der Hafen ist einstellbar** — [Betrieb](20-betrieb/betrieb.md) AC-4
- **Neustart beendet Partien, angekündigt** — [Betrieb](20-betrieb/betrieb.md) AC-5
- **Aktualisierung wartet auf leere Räume** — [Betrieb](20-betrieb/betrieb.md) AC-6
- **Konten überleben jede Aktualisierung** — [Betrieb](20-betrieb/betrieb.md) AC-7
- **Zahlen sind abrufbar** — [Betrieb](20-betrieb/betrieb.md) AC-8
- **Fehler ins Protokoll, Geheimnisse nie** — [Betrieb](20-betrieb/betrieb.md) AC-9
- **Absturz trifft nicht alle Partien** — [Betrieb](20-betrieb/betrieb.md) AC-10
- **Eine kleine Maschine reicht** — [Betrieb](20-betrieb/betrieb.md) AC-11
- **Bekannte Grenze** — [Betrieb](20-betrieb/betrieb.md) AC-12

## Zurueckgestellt (7)

- **Vollstaendige Sammelschleife** — [Einheiten und Befehle](10-strategie/einheiten-und-befehle.md) AC-11
- **Vier Feldarten** — [Karte und Vorraete](10-strategie/karte-und-vorraete.md) AC-2
- **Karte ist 64 x 64** — [Karte und Vorraete](10-strategie/karte-und-vorraete.md) AC-3
- **Wald traegt mehr als Beeren** — [Karte und Vorraete](10-strategie/karte-und-vorraete.md) AC-8
- **Wechsel vorher festlegen** — [Aufstellung, Taktik und Training](15-manager/aufstellung.md) AC-13
- **Anweisung je Spieler** — [Aufstellung, Taktik und Training](15-manager/aufstellung.md) AC-15
- **Gehaltsverhandlung** — [Transfermarkt](15-manager/transfer.md) AC-17
