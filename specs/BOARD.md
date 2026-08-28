<!-- Erzeugt von scripts/spec-board.mjs. Nicht von Hand aendern --
     der Status steht am Abnahmekriterium in der jeweiligen Spec. -->

# Arbeitsvorrat

Eine Zeile je Abnahmekriterium. Gepflegt wird der Status in der Spec selbst,
hier steht er zusammengefasst. Erzeugt mit `npm run specs:board`, als Seite
zum Filtern und Suchen mit `npm run qa:report`.

**Gesamt:** 10 in qa · 18 geplant · 92 offen · 40 fertig

## Nach Spezifikation

| Spezifikation                                                  | In Arbeit | In QA | Geplant | Offen | Zurueckgestellt | Fertig |
| -------------------------------------------------------------- | --------- | ----- | ------- | ----- | --------------- | ------ |
| [Konten und Anmeldung](00-plattform/konten.md)                 | -         | -     | 16      | 4     | -               | -      |
| [Raeume und Partien](00-plattform/raeume.md)                   | -         | 2     | -       | 3     | -               | 10     |
| [Schutz vor Fremdnutzung](00-plattform/schutz.md)              | -         | 1     | -       | 4     | -               | 7      |
| [Uebertragung](00-plattform/uebertragung.md)                   | -         | 1     | 2       | 1     | -               | 6      |
| [Bauen und Ausbilden](10-strategie/bauen.md)                   | -         | -     | -       | 19    | -               | -      |
| [Bedienung](10-strategie/bedienung.md)                         | -         | 6     | -       | 17    | -               | -      |
| [Einheiten und Befehle](10-strategie/einheiten-und-befehle.md) | -         | -     | -       | 1     | -               | 9      |
| [Kampf](10-strategie/kampf.md)                                 | -         | -     | -       | 14    | -               | -      |
| [Karte und Vorraete](10-strategie/karte-und-vorraete.md)       | -         | -     | -       | 2     | -               | 8      |
| [Spielziel und Partieverlauf](10-strategie/spielziel.md)       | -         | -     | -       | 15    | -               | -      |
| [Betrieb](20-betrieb/betrieb.md)                               | -         | -     | -       | 12    | -               | -      |

## In QA (10)

- **Verwaister Raum wird geschlossen** — [Raeume und Partien](00-plattform/raeume.md) AC-12
- **Leerlauf endet nach 30 Minuten** — [Raeume und Partien](00-plattform/raeume.md) AC-13
- **Nachrichtenflut trennt die Verbindung** — [Schutz vor Fremdnutzung](00-plattform/schutz.md) AC-7
- **Weiches Bild trotz zehn Takten** — [Uebertragung](00-plattform/uebertragung.md) AC-8
- **Rahmen wählt aus** — [Bedienung](10-strategie/bedienung.md) AC-1
- **Klick wählt eine** — [Bedienung](10-strategie/bedienung.md) AC-2
- **Schieben mit Tasten** — [Bedienung](10-strategie/bedienung.md) AC-7
- **Zoom mit dem Rad** — [Bedienung](10-strategie/bedienung.md) AC-8
- **Rechtsklick befiehlt** — [Bedienung](10-strategie/bedienung.md) AC-12
- **Ladung ist sichtbar** — [Bedienung](10-strategie/bedienung.md) AC-16

## Geplant (18)

- **Beitreten ohne Konto** — [Konten und Anmeldung](00-plattform/konten.md) AC-1
- **Eroeffnen verlangt ein Konto** — [Konten und Anmeldung](00-plattform/konten.md) AC-16
- **Anzeigename kommt aus dem Konto** — [Konten und Anmeldung](00-plattform/konten.md) AC-17
- **Registrieren nur mit Einladungscode** — [Konten und Anmeldung](00-plattform/konten.md) AC-18
- **Einladungscodes sind einmalig und verfallen** — [Konten und Anmeldung](00-plattform/konten.md) AC-19
- **Registrieren mit Mail und Kennwort** — [Konten und Anmeldung](00-plattform/konten.md) AC-2
- **Kennwort nie im Klartext** — [Konten und Anmeldung](00-plattform/konten.md) AC-3
- **Mailadresse wird bestaetigt** — [Konten und Anmeldung](00-plattform/konten.md) AC-4
- **Kennwort vergessen** — [Konten und Anmeldung](00-plattform/konten.md) AC-5
- **Sitzung ueberlebt das Neuladen** — [Konten und Anmeldung](00-plattform/konten.md) AC-7
- **Sitzungscookie ist abgesichert** — [Konten und Anmeldung](00-plattform/konten.md) AC-8
- **WebSocket erbt die Anmeldung** — [Konten und Anmeldung](00-plattform/konten.md) AC-9
- **Abmelden beendet ueberall** — [Konten und Anmeldung](00-plattform/konten.md) AC-10
- **Anmeldeversuche sind begrenzt** — [Konten und Anmeldung](00-plattform/konten.md) AC-11
- **Keine Kontoauskunft** — [Konten und Anmeldung](00-plattform/konten.md) AC-12
- **Anzeigename ist kein Ausweis** — [Konten und Anmeldung](00-plattform/konten.md) AC-13
- **Abbruch ist sichtbar** — [Uebertragung](00-plattform/uebertragung.md) AC-9
- **Automatischer Wiederaufbau** — [Uebertragung](00-plattform/uebertragung.md) AC-10

## Offen (92)

- **Einladungscodes lassen sich erzeugen und zuruecknehmen** — [Konten und Anmeldung](00-plattform/konten.md) AC-20
- **Anmeldung ueber Google/GitHub** — [Konten und Anmeldung](00-plattform/konten.md) AC-6
- **Bilanz je Konto** — [Konten und Anmeldung](00-plattform/konten.md) AC-14
- **Konto loeschen** — [Konten und Anmeldung](00-plattform/konten.md) AC-15
- **Voller Raum weist ab** — [Raeume und Partien](00-plattform/raeume.md) AC-4
- **Kein Beitritt in laufende Partie** — [Raeume und Partien](00-plattform/raeume.md) AC-5
- **Abwesenheit ist sichtbar** — [Raeume und Partien](00-plattform/raeume.md) AC-11
- **Nachricht bleibt klein** — [Schutz vor Fremdnutzung](00-plattform/schutz.md) AC-9
- **Partien haben eine Höchstdauer** — [Schutz vor Fremdnutzung](00-plattform/schutz.md) AC-10
- **Statische Dateien haben eine eigene Bremse** — [Schutz vor Fremdnutzung](00-plattform/schutz.md) AC-11
- **Auffälligkeiten sind sichtbar** — [Schutz vor Fremdnutzung](00-plattform/schutz.md) AC-12
- **Befehlsflut wird gebremst** — [Uebertragung](00-plattform/uebertragung.md) AC-4
- **Sammler bauen Gebäude** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-1
- **Mehrere Sammler bauen schneller** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-2
- **Bauplatz muss frei sein** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-3
- **Bauplatz wird vorher gezeigt** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-4
- **Rohstoffe werden beim Baubeginn abgezogen** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-5
- **Abbruch gibt die Hälfte zurück** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-6
- **Gebäude im Bau sind angreifbar** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-7
- **Zentrum bildet Sammler aus** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-8
- **Kaserne bildet Kämpfer aus** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-9
- **Warteschlange je Gebäude** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-10
- **Abbruch erstattet vollständig** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-11
- **Neue Einheiten treten neben das Gebäude** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-12
- **Sammelpunkt je Gebäude** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-13
- **Bevölkerung ist begrenzt** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-14
- **Volle Bevölkerung sperrt Ausbildung** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-15
- **Verlorene Einheiten geben Plätze frei** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-16
- **Gebäude haben Widerstand** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-17
- **Zerstörte Gebäude nehmen Plätze mit** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-18
- **Letztes Zentrum entscheidet** — [Bauen und Ausbilden](10-strategie/bauen.md) AC-19
- **Umschalt erweitert** — [Bedienung](10-strategie/bedienung.md) AC-3
- **Doppelklick wählt den Typ** — [Bedienung](10-strategie/bedienung.md) AC-4
- **Auswahl merken** — [Bedienung](10-strategie/bedienung.md) AC-5
- **Ausgewählte sind aufgelistet** — [Bedienung](10-strategie/bedienung.md) AC-6
- **Schieben am Bildschirmrand** — [Bedienung](10-strategie/bedienung.md) AC-9
- **Leertaste springt zur Basis** — [Bedienung](10-strategie/bedienung.md) AC-10
- **Übersichtskarte unten rechts** — [Bedienung](10-strategie/bedienung.md) AC-11
- **Der Befehl ist sofort sichtbar** — [Bedienung](10-strategie/bedienung.md) AC-13
- **Warteschlange mit Umschalt** — [Bedienung](10-strategie/bedienung.md) AC-14
- **Abbrechen mit Esc** — [Bedienung](10-strategie/bedienung.md) AC-15
- **Rohstoffe zählen sichtbar hoch** — [Bedienung](10-strategie/bedienung.md) AC-17
- **Abgelehnte Befehle sagen warum** — [Bedienung](10-strategie/bedienung.md) AC-18
- **Verbindungsverlust ist sichtbar** — [Bedienung](10-strategie/bedienung.md) AC-19
- **Spielstand aller Spieler einsehbar** — [Bedienung](10-strategie/bedienung.md) AC-20
- **Die erste Partie erklärt sich** — [Bedienung](10-strategie/bedienung.md) AC-21
- **Tastenübersicht** — [Bedienung](10-strategie/bedienung.md) AC-22
- **Läuft auf einem Laptop-Bildschirm** — [Bedienung](10-strategie/bedienung.md) AC-23
- **Einheiten stehen sich nicht im Weg** — [Einheiten und Befehle](10-strategie/einheiten-und-befehle.md) AC-10
- **Rechtsklick auf Feindliches greift an** — [Kampf](10-strategie/kampf.md) AC-1
- **Einheiten wehren sich von selbst** — [Kampf](10-strategie/kampf.md) AC-2
- **Verfolgung endet** — [Kampf](10-strategie/kampf.md) AC-3
- **Angriffslauf** — [Kampf](10-strategie/kampf.md) AC-4
- **Sammler kämpfen schlecht, aber sie kämpfen** — [Kampf](10-strategie/kampf.md) AC-5
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
- **Eine Partie hat drei Abschnitte** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-1
- **Eine Partie dauert 12 bis 20 Minuten** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-2
- **Niemand ist nach drei Minuten raus** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-3
- **Aufholen ist möglich** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-4
- **Sieg durch letzte Basis** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-5
- **Aufgeben ist möglich** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-6
- **Verlierer bleiben Zuschauer** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-7
- **Abschlussbild mit Zahlen** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-8
- **Revanche mit einem Klick** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-9
- **Kein Zug ist immer richtig** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-10
- **Rein sammeln verliert** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-11
- **Rein angreifen verliert auch** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-12
- **Zwei bis sechs Spieler** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-13
- **Bündnisse sind nicht vorgesehen** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-14
- **Ein Aussteiger blockiert nicht** — [Spielziel und Partieverlauf](10-strategie/spielziel.md) AC-15
- **Nur über HTTPS** — [Betrieb](20-betrieb/betrieb.md) AC-1
- **Proxy-Adresse ist eingeschaltet** — [Betrieb](20-betrieb/betrieb.md) AC-2
- **Der Dienst startet von selbst neu** — [Betrieb](20-betrieb/betrieb.md) AC-3
- **Der Hafen ist einstellbar** — [Betrieb](20-betrieb/betrieb.md) AC-4
- **Laufende Partien überleben einen Neustart nicht — und das ist gesagt** — [Betrieb](20-betrieb/betrieb.md) AC-5
- **Aktualisierung wartet auf leere Räume** — [Betrieb](20-betrieb/betrieb.md) AC-6
- **Konten überleben jede Aktualisierung** — [Betrieb](20-betrieb/betrieb.md) AC-7
- **Zahlen sind abrufbar** — [Betrieb](20-betrieb/betrieb.md) AC-8
- **Fehler landen im Protokoll, Geheimnisse nie** — [Betrieb](20-betrieb/betrieb.md) AC-9
- **Ein Absturz nimmt nicht alle Partien mit** — [Betrieb](20-betrieb/betrieb.md) AC-10
- **Eine kleine Maschine reicht** — [Betrieb](20-betrieb/betrieb.md) AC-11
- **Bekannte Grenze** — [Betrieb](20-betrieb/betrieb.md) AC-12
