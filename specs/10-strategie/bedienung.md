# Bedienung

**Bereich:** Strategie
**Kuerzel:** bedienung
**Stand:** 20/34 fertig · 14 offen

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
- **AC-6** `fertig` **Ausgewählte sind aufgelistet** — Am unteren Rand mit Anzahl je Typ.

### Kamera

- **AC-7** `fertig` **Schieben mit Tasten** — `W A S D` und die Pfeiltasten.
- **AC-8** `fertig` **Zoom mit dem Rad** — Der Punkt unter dem Zeiger bleibt dabei stehen.
- **AC-9** `offen` **Schieben am Bildschirmrand** — Mit der Maus am Rand, abschaltbar.
- **AC-10** `offen` **Leertaste springt zur Basis** — Und ein zweites Mal zurück.
- **AC-11** `fertig` **Übersichtskarte unten rechts** — Gelände, eigene und fremde Einheiten als
  Punkte, der Bildausschnitt als Rahmen. Klick springt hin.

### Befehle

- **AC-12** `fertig` **Rechtsklick befiehlt** — Laufen, sammeln oder angreifen, je nach Ziel. Kein
  Umschalten der Betriebsart.
- **AC-13** `offen` **Der Befehl ist sofort sichtbar** — Ein Kringel am Zielpunkt, ohne auf die
  Antwort des Servers zu warten. Zehn Takte je Sekunde heißt bis zu 100 ms
  Verzögerung — ohne Rückmeldung fühlt sich das kaputt an.
- **AC-14** `offen` **Warteschlange mit Umschalt** — Mehrere Ziele hintereinander abarbeiten.
- **AC-15** `fertig` **Abbrechen mit Esc** — Hebt Auswahl und angefangene Platzierung auf.

### Rückmeldung

- **AC-16** `fertig` **Ladung ist sichtbar** — Ein beladener Dorfbewohner trägt seine Ware
  sichtbar auf dem Rücken: Holzbündel, Beerenkorb, Gold- oder Steinbrocken
  (→ [Darstellung](darstellung.md) AC-6).
- **AC-17** `fertig` **Rohstoffe zählen sichtbar hoch** — Nicht springen. Man muss sehen, dass die
  Wirtschaft läuft.
- **AC-18** `fertig` **Abgelehnte Befehle sagen warum** — „Zu wenig Holz", „Bevölkerung voll" — kurz
  eingeblendet, nicht als Fenster mit Knopf.
- **AC-19** `offen` **Verbindungsverlust ist sichtbar** — Ein Hinweis im Bild, nicht erst
  stehenbleibende Einheiten (→ [Übertragung](../00-plattform/uebertragung.md) AC-9).
- **AC-20** `offen` **Spielstand aller Spieler einsehbar** — Auf Tastendruck: Bevölkerung und
  Rohstoffe aller Mitspieler. Wer vorne liegt, gehört zur Spannung.

### Erster Eindruck

- **AC-21** `offen` **Die erste Partie erklärt sich** — Beim ersten Start eine kurze Einblendung:
  ziehen, rechtsklicken, sammeln. Drei Sätze, wegklickbar.
- **AC-22** `fertig` **Tastenübersicht** — Auf `?` oder `F1`.
- **AC-23** `offen` **Läuft auf einem Laptop-Bildschirm** — 1366 × 768 ohne Abschneiden. Die
  Bedienung auf dem Handy ist ausdrücklich **kein** Ziel — ein Strategiespiel
  mit Rahmenauswahl braucht eine Maus.

### Stufe A — Wirtschaft bedienen

- **AC-24** `fertig` **Leiste mit vier Rohstoffen** — Oben Holz, Nahrung, Gold, Stein und die
  Bevölkerung als „7/10". Die Zahlen zählen hoch statt zu springen (AC-17).
  Bis Häuser gebaut werden (A6), gibt allein das Dorfzentrum Wohnraum 5.
- **AC-25** `fertig` **Baumenü am Dorfbewohner** — Ist ein Dorfbewohner ausgewählt, zeigt der
  untere Rand die baubaren Gebäude mit Bild und Kosten. Was nicht bezahlbar
  ist, ist ausgegraut und nennt beim Überfahren, was fehlt. Ein Klick beginnt
  das Platzieren (→ [Bauen](bauen.md) AC-4).
- **AC-26** `fertig` **Gebäude zeigt Ausbildung** — Ein ausgewähltes eigenes Gebäude zeigt seine
  Einheiten und Verbesserungen mit Kosten und die Warteschlange mit
  Fortschrittsbalken; ein Klick auf einen Eintrag der Schlange bricht ihn ab.
- **AC-27** `fertig` **Tastenkürzel für Häufiges** — `H` wählt das Dorfzentrum, im
  Dorfzentrum bildet `Q` einen Dorfbewohner aus; mit ausgewähltem
  Dorfbewohner öffnet `B` das Baumenü und je ein Buchstabe wählt das Gebäude.
  Die Belegung steht in der Tastenübersicht (AC-22).
- **AC-28** `fertig` **Untätige Dorfbewohner finden** — Ein Knopf unten zeigt die Zahl der
  untätigen Dorfbewohner; er und die Taste `.` wählen den nächsten und holen
  ihn ins Bild.
- **AC-29** `fertig` **Ausgewähltes zeigt Werte** — Eine ausgewählte Einheit oder ein Gebäude
  zeigt unten Name, Leben und — beim Dorfbewohner — was er trägt.

### Nach Stufe A — Lücken aus der Rückschau

Eine Partie mit Wirtschafts-KI auf beiden Seiten, zehn Spielminuten, im
Browser angesehen (Rückschau nach Runde 54) und ehrlich mit dem Original
verglichen: die drei größten Lücken in Lesbarkeit und Aussehen.

- **AC-30** `fertig` **Verdeckte Einheiten als Umriss** — Steht eine Einheit hinter einem
  Gebäude, ist sie als Umriss in Spielerfarbe durch das Gebäude sichtbar. Im
  Dorf nach zehn Minuten verschwanden Dorfbewohner hinter Häusern und Lagern
  ganz.
- **AC-31** `fertig` **Arbeit ist zu sehen** — Wer sammelt, baut oder eine Farm bestellt,
  bewegt sich dabei sichtbar (Schlag, Bücken); wer untätig steht, steht still.
  Heute sehen Arbeitende und Wartende gleich aus.
- **AC-32** `offen` **Arbeiter je Rohstoff** — Die Rohstoffleiste zeigt neben jedem Vorrat,
  wie viele Dorfbewohner gerade daran arbeiten. Ohne diese Zahl lässt sich ein
  Wirtschaftsplan nicht steuern.

### Stufe B — Zeitalter und Kampf bedienen

- **AC-33** `offen` **Zeitalter steht im Bild** — Oben steht, in welchem Zeitalter man ist;
  während eines Aufstiegs zeigt das Dorfzentrum den Fortschritt, und der
  Wechsel wird einmal im Bild gemeldet.
- **AC-34** `offen` **Angriffsbefehl ist erkennbar** — Ein Rechtsklick auf Feindliches zeigt
  kurz ein rotes Zeichen am Ziel, ein Befehl auf freies Gelände ein weißes
  (→ [Kampf](kampf.md) AC-1).

Aus den offenen Kriterien oben gehören zu Stufe A: AC-6 (Auswahl
aufgelistet), AC-11 (Übersichtskarte — auf 120 × 120 unverzichtbar), AC-15
(Esc), AC-17 (Zahlen zählen hoch), AC-18 (Absagen sagen warum).

## Grenzfaelle

- Bei starkem Zoom heraus werden Einheiten kleiner als drei Bildpunkte. Dann
  wird eine Mindestgröße gezeichnet, sonst verschwindet das Heer.
- Ein Rechtsklick, während nichts ausgewählt ist, tut nichts — und darf keine
  Meldung erzeugen. Das passiert ständig und ist kein Fehler.
