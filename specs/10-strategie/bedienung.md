# Bedienung

**Bereich:** Strategie
**Kuerzel:** bedienung
**Stand:** 6/23 fertig · 17 offen

## Zweck

Ein Echtzeitspiel wird nicht daran gemessen, was es kann, sondern daran, wie
schnell man es tun kann. Diese Spec sammelt alles, was zwischen Absicht und
Befehl steht.

## Abgrenzung

| Gehoert dazu                        | Gehoert nicht dazu                          |
| ----------------------------------- | ------------------------------------------- |
| Auswahl, Kamera, Tasten, Rückmeldung | Was ein Befehl bewirkt → [Einheiten](einheiten-und-befehle.md) |
| Übersichtskarte, Anzeigen           | Vorraum und Beitritt → [Räume](../00-plattform/raeume.md) |
| Was ein Spieler sieht               | Was der Server schickt → [Übertragung](../00-plattform/uebertragung.md) |

## Abnahmekriterien

### Auswahl

- **AC-1** `fertig` **Rahmen wählt aus** — Ein aufgezogener Rahmen wählt alle eigenen Einheiten
  darin.
- **AC-2** `fertig` **Klick wählt eine** — Ein Klick ohne Rahmen wählt die nächste eigene Einheit in
  Reichweite.
- **AC-3** `offen` **Umschalt erweitert** — Mit gedrückter Umschalttaste kommt zur Auswahl hinzu,
  statt sie zu ersetzen.
- **AC-4** `offen` **Doppelklick wählt den Typ** — Alle sichtbaren Einheiten desselben Typs.
- **AC-5** `offen` **Auswahl merken** — `Strg`+`1` bis `9` legt eine Auswahl ab, die Zifferntaste
  ruft sie zurück. Ohne das ist ein Echtzeitspiel nicht spielbar.
- **AC-6** `offen` **Ausgewählte sind aufgelistet** — Am unteren Rand mit Anzahl je Typ.

### Kamera

- **AC-7** `fertig` **Schieben mit Tasten** — `W A S D` und die Pfeiltasten.
- **AC-8** `fertig` **Zoom mit dem Rad** — Der Punkt unter dem Zeiger bleibt dabei stehen.
- **AC-9** `offen` **Schieben am Bildschirmrand** — Mit der Maus am Rand, abschaltbar.
- **AC-10** `offen` **Leertaste springt zur Basis** — Und ein zweites Mal zurück.
- **AC-11** `offen` **Übersichtskarte unten rechts** — Gelände, eigene und fremde Einheiten als
  Punkte, der Bildausschnitt als Rahmen. Klick springt hin.

### Befehle

- **AC-12** `fertig` **Rechtsklick befiehlt** — Laufen, sammeln oder angreifen, je nach Ziel. Kein
  Umschalten der Betriebsart.
- **AC-13** `offen` **Der Befehl ist sofort sichtbar** — Ein Kringel am Zielpunkt, ohne auf die
  Antwort des Servers zu warten. Zehn Takte je Sekunde heißt bis zu 100 ms
  Verzögerung — ohne Rückmeldung fühlt sich das kaputt an.
- **AC-14** `offen` **Warteschlange mit Umschalt** — Mehrere Ziele hintereinander abarbeiten.
- **AC-15** `offen` **Abbrechen mit Esc** — Hebt Auswahl und angefangene Platzierung auf.

### Rückmeldung

- **AC-16** `fertig` **Ladung ist sichtbar** — Ein beladener Sammler trägt einen Punkt in der Farbe
  seiner Ware.
- **AC-17** `offen` **Rohstoffe zählen sichtbar hoch** — Nicht springen. Man muss sehen, dass die
  Wirtschaft läuft.
- **AC-18** `offen` **Abgelehnte Befehle sagen warum** — „Zu wenig Holz", „Bevölkerung voll" — kurz
  eingeblendet, nicht als Fenster mit Knopf.
- **AC-19** `offen` **Verbindungsverlust ist sichtbar** — Ein Hinweis im Bild, nicht erst
  stehenbleibende Einheiten (→ [Übertragung](../00-plattform/uebertragung.md) AC-9).
- **AC-20** `offen` **Spielstand aller Spieler einsehbar** — Auf Tastendruck: Bevölkerung und
  Rohstoffe aller Mitspieler. Wer vorne liegt, gehört zur Spannung.

### Erster Eindruck

- **AC-21** `offen` **Die erste Partie erklärt sich** — Beim ersten Start eine kurze Einblendung:
  ziehen, rechtsklicken, sammeln. Drei Sätze, wegklickbar.
- **AC-22** `offen` **Tastenübersicht** — Auf `?` oder `F1`.
- **AC-23** `offen` **Läuft auf einem Laptop-Bildschirm** — 1366 × 768 ohne Abschneiden. Die
  Bedienung auf dem Handy ist ausdrücklich **kein** Ziel — ein Strategiespiel
  mit Rahmenauswahl braucht eine Maus.

## Grenzfaelle

- Bei starkem Zoom heraus werden Einheiten kleiner als drei Bildpunkte. Dann
  wird eine Mindestgröße gezeichnet, sonst verschwindet das Heer.
- Ein Rechtsklick, während nichts ausgewählt ist, tut nichts — und darf keine
  Meldung erzeugen. Das passiert ständig und ist kein Fehler.
