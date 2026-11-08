# Darstellung

**Bereich:** Strategie
**Kuerzel:** darstellung
**Stand:** 15/16 fertig · 1 offen

## Zweck

Wie das Spiel aussieht. Das Ziel ist ein Bild, bei dem jemand, der Age of
Empires II kennt, sofort weiß, was er vor sich hat — **ohne** Grafik, Klänge
oder Oberfläche des Originals zu verwenden
([ADR-0012](../../docs/adr/0012-aoe2-als-vorlage.md), Punkt 4).

Alles wird in Code gezeichnet: Formen, Verläufe, Schattierung, in den Farben
der Spieler. Keine Bilddateien aus fremder Quelle.

## Abgrenzung

| Gehoert dazu                               | Gehoert nicht dazu |
| ------------------------------------------ | ------------------ |
| Blickwinkel, Gelände, Gebäude, Einheiten   | was ein Klick tut → [Bedienung](bedienung.md) |
| Reihenfolge, Auswahl, Balken               | was der Server schickt → [Übertragung](../00-plattform/uebertragung.md) |
| Bildrate im Browser                        | Rechenzeit auf dem Server → [Fahrplan](fahrplan.md) AC-6 |

## Abnahmekriterien

### Blick und Gelände (Stufe A)

- **AC-1** `fertig` **Isometrischer Blick** — Die Karte liegt als Raute: ein Feld ist doppelt so
  breit wie hoch. Rahmen, Klick und Rechtsklick treffen im neuen Blick
  dieselben Felder wie vorher (die Umrechnung ist geprüft, nicht geschätzt).
- **AC-2** `fertig` **Gelände lebt** — Gras ist nicht einfarbig: leichte Tönung je Feld aus dem
  Startwert, weiche Kanten zu Wasser. Wasser ist als Wasser erkennbar.
- **AC-3** `fertig` **Bäume, Sträucher, Felsen** — Ein Baum hat Stamm und Krone, ein
  Beerenstrauch rote Punkte, Gold glänzt gelb, Stein ist grau und kantig.
  Leert sich ein Vorrat, wird er sichtbar kleiner.

### Gebäude und Einheiten (Stufe A)

- **AC-4** `fertig` **Gebäude haben Körper** — Jedes Gebäude hat Grundfläche, Wände und Dach mit
  Licht von links oben. Die Spielerfarbe steht an einer festen Stelle (Banner,
  Dachkante), nicht als ganze Fläche.
- **AC-5** `fertig` **Baustelle sichtbar** — Eine Baustelle zeigt Gerüst und Fundament und
  wächst mit dem Fortschritt.
- **AC-6** `fertig` **Einheiten sind Figuren** — Dorfbewohner, Miliz und Späherreiter sind an der
  Gestalt zu unterscheiden (Werkzeug, Schwert und Schild, Pferd), mit
  Spielerfarbe am Körper. Ein Dorfbewohner zeigt, was er trägt.
- **AC-7** `fertig` **Vorn verdeckt hinten** — Was weiter unten im Bild steht, wird später
  gezeichnet. Eine Einheit hinter einem Haus ist verdeckt; eine ausgewählte
  bleibt als Umriss erkennbar.
- **AC-8** `fertig` **Auswahl und Leben am Boden** — Ausgewähltes trägt eine Ellipse am Boden,
  darüber einen Lebensbalken. Gebäude zeigen ihren Balken, wenn sie
  ausgewählt oder beschädigt sind.

### Nebel (Stufe C)

- **AC-15** `fertig` **Nebel in drei Stufen** — Das Bild unterscheidet drei
  Zustände: **nie gesehen** (schwarz, nichts darin), **gesehen, aber jetzt
  unbeobachtet** (gedämpft, mit erinnertem Gelände und erinnerten Gebäuden,
  ohne fremde Einheiten) und **beobachtet** (voll). Die Übersichtskarte zeigt
  dieselben drei Zustände. Bildnachweis: ein Spielbild mit allen drei
  nebeneinander (→ [Kampf](kampf.md) AC-11, AC-12).

### Prüfbar machen

- **AC-9** `fertig` **Eine Schautafel** — Eine Seite zeigt jedes Gebäude und jede Einheit der
  aktuellen Stufe nebeneinander, in zwei Spielerfarben, mit Namen darunter.
  Sie ist der Bildnachweis zu [Fahrplan](fahrplan.md) AC-7 und wird mit jeder
  Stufe länger.
- **AC-10** `fertig` **Flüssig im Browser** — Mit 100 Einheiten und 30 Gebäuden im Bild zeichnet
  der Browser im Browserlauf mindestens 50 Bilder je Sekunde.
- **AC-11** `offen` **Nur eigenes Material** — Kein Bild, kein Klang, keine Schrift aus dem
  Original; kein „Age of Empires" im Spiel. Geprüft: `public/` enthält keine
  Rastergrafik außer selbst erzeugten, und die Oberfläche nennt die Marke nicht.
- **AC-12** `fertig` **Gezeichnet statt flach** — Wunsch des Benutzers (Runde 26):
  „je gezeichneter es wirkt, umso besser". Jede Figur, jedes Gebäude und jeder
  Vorrat hat Licht und Schatten in mindestens drei Tonstufen je Hauptfläche,
  eine Oberfläche (Holzmaserung, Dachziegel oder Stroh, Wolle, Blattwerk,
  Steinfugen) und Konturen, die nicht überall gleich dick sind. Das Gras hat
  Büschel statt nur Tönung. Geprüft bei Zoom 1 im Spielbild und auf der
  Schautafel, mit einem Vorher-Nachher-Bild.
- **AC-13** `fertig` **Naturalistisch statt Comic** — Wunsch des Benutzers (Runde 35),
  mit einem Bild des Originals als Maßstab für die Anmutung, nicht als Vorlage
  zum Abzeichnen. Messbar: (1) keine schwarzen Umrisse — in keiner Figur und
  keinem Gebäude mehr als 3 % fast schwarze Bildpunkte; (2) gedämpfte,
  erdige Farben — Gebäude und Vorräte im Mittel weniger gesättigt als vor
  A6c, der Boden im Farbton zwischen Braun und Oliv (25° bis 100°) statt
  Grün; die Spielerfarbe bleibt kräftig, damit man Besitz erkennt. (Bis Runde
  39 hieß es „mittlere Sättigung des Spielbilds unter der heutigen" — das
  maß das Falsche: erdiges Oliv hat in HSL mehr Sättigung als das frühere
  graublaue Grün, 0,32 gegen 0,25, sieht aber natürlicher aus.);
  (3) Proportionen statt Kindchenschema — der Kopf höchstens ein Sechstel der
  Figur, ein Dorfbewohner bei Zoom 1 höchstens halb so hoch wie ein Haus;
  (4) der Boden zeigt kein Rautenraster, sondern Gras, Erde und Flecken, die
  über Feldgrenzen hinweglaufen; (5) Gebäude und Bäume werfen Schlagschatten
  in eine Richtung. Vorher-Nachher-Bild bei Zoom 1.
- **AC-14** `fertig` **Alles auf einen Blick unterscheidbar** — Wunsch des Benutzers
  (Runde 35). Je zwei Einheiten und je zwei Gebäude unterscheiden sich auf der
  Schautafel in mindestens einem Drittel ihrer Fläche (Umriss oder Farbe); bei
  Zoom 1 im Spielbild trägt jedes Gebäude ein eigenes Merkmal, das man ohne
  Auswahl erkennt (Flügel, Stapel, Karre, Zinnen, Acker, Stroh, Fahne; ab der
  Feudalzeit Zielscheibe, Koppel, Schornstein). Gilt für jede Stufe neu: ein
  neues Gebäude wird gegen alle vorhandenen gemessen.
- **AC-16** `fertig` **Spielgröße wie im Original** — Zum Start der Partie
  ist ein Dorfbewohner mindestens 40 Bildpunkte hoch; im Original sind es
  rund 45 bei 1080 Zeilen, ein Feld ist dort 96 Bildpunkte breit. Bis Runde 99
  begann jede Partie bei Zoom 1 — ein Feld 44 breit, ein Dorfbewohner 28,6 hoch,
  das ganze Bild kaum halb so groß, die Figuren Striche (Rückschau nach Runde
  88). Jetzt beginnt sie bei Zoom 1,5 (42,9 Bildpunkte). Zoom 1 bleibt der
  feste Maßstab, an dem AC-13, AC-14 und [Bedienung](bedienung.md) AC-36
  gemessen werden — wer dort besteht, besteht beim Start erst recht. Das Rad
  holt weiter bis 0,4 heraus.

## Grenzfaelle

- Weit herausgezoomt werden Figuren zu Punkten in Spielerfarbe, Gebäude zu
  Flächen — lesbar bleibt, wer wo steht.
- Das Spielbild muss auch ohne Grafikkarte flüssig laufen; zeichnen,
  was im Bild ist, nicht die ganze Karte.
