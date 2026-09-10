# Betrieb

**Bereich:** Betrieb
**Kuerzel:** betrieb
**Stand:** 0/12 fertig · 12 offen

## Zweck

Was gelten muss, damit der Server im Netz stehen kann, ohne dass jemand
nachts wach liegt.

## Abgrenzung

| Gehoert dazu                   | Gehoert nicht dazu                          |
| ------------------------------ | ------------------------------------------- |
| Erreichbarkeit, Verschlüsselung | Grenzen gegen Missbrauch → [Schutz](../00-plattform/schutz.md) |
| Neustart, Aktualisierung       | Konten → [Konten](../00-plattform/konten.md) |
| Sichtbarkeit im Betrieb        | Spielregeln → [Strategie](../10-strategie/) |

## Abnahmekriterien

### Erreichbarkeit

- **AC-1** `offen` **Nur über HTTPS** — Der Server steht hinter einem Reverse Proxy mit
  gültigem Zertifikat. `ws://` gibt es im Netz nicht, nur `wss://`.
- **AC-2** `offen` **Proxy-Adresse ist eingeschaltet** — Steht ein Proxy davor, ist
  `HINTER_PROXY=1` gesetzt. Sonst greift jede Grenze aus
  [Schutz](../00-plattform/schutz.md) für alle Spieler gemeinsam.
- **AC-3** `offen` **Dienst startet selbst neu** — Nach Absturz und nach Neustart der
  Maschine, ohne dass jemand sich anmeldet.
- **AC-4** `offen` **Der Hafen ist einstellbar** — Über `PORT`, ohne Änderung am Code.

### Neustart und Aktualisierung

- **AC-5** `offen` **Neustart beendet Partien, angekündigt** — Alles
  liegt im Arbeitsspeicher. Vor einer Aktualisierung sehen die Spieler eine
  Vorwarnung im Bild.
- **AC-6** `offen` **Aktualisierung wartet auf leere Räume** — Wenn möglich wird gewartet, bis die
  letzte Partie zu Ende ist, statt sie abzuschneiden.
- **AC-7** `offen` **Konten überleben jede Aktualisierung** — Die SQLite-Datei liegt außerhalb des
  Programmordners und wird gesichert.

### Sichtbarkeit

- **AC-8** `offen` **Zahlen sind abrufbar** — Laufende Partien, verbundene Spieler, ausgelöste
  Grenzen. Über einen Weg, den nur der Betreiber erreicht.
- **AC-9** `offen` **Fehler ins Protokoll, Geheimnisse nie** — Keine Kennwörter, keine
  Sitzungstoken, keine Raumcodes laufender Partien.
- **AC-10** `offen` **Absturz trifft nicht alle Partien** — Ein Fehler in einer Partie darf
  den Prozess nicht beenden. Heute nicht abgesichert: eine Ausnahme im Takt
  einer Partie beendet den Server für alle.

### Kosten

- **AC-11** `offen` **Eine kleine Maschine reicht** — Der Betrieb bleibt bei zehn gleichzeitigen
  Partien unter 512 MB Arbeitsspeicher und einem Kern.
- **AC-12** `offen` **Bekannte Grenze** — Ab welcher Zahl gleichzeitiger Partien es eng wird, ist
  gemessen und steht im README — nicht geschätzt.

## Grenzfaelle

- Fällt der Server mitten in einer Partie aus, ist sie weg. Bei fünfzehn
  Minuten Spieldauer ist das tragbar; ein Wiederaufsetzen mitten in der Partie
  wäre eine eigene Mechanik und steht nicht zur Debatte.
