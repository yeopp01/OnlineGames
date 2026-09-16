# Darstellung

**Bereich:** Strategie
**Kuerzel:** darstellung
**Stand:** 0/11 fertig · 11 offen

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

- **AC-1** `offen` **Isometrischer Blick** — Die Karte liegt als Raute: ein Feld ist doppelt so
  breit wie hoch. Rahmen, Klick und Rechtsklick treffen im neuen Blick
  dieselben Felder wie vorher (die Umrechnung ist geprüft, nicht geschätzt).
- **AC-2** `offen` **Gelände lebt** — Gras ist nicht einfarbig: leichte Tönung je Feld aus dem
  Startwert, weiche Kanten zu Wasser. Wasser ist als Wasser erkennbar.
- **AC-3** `offen` **Bäume, Sträucher, Felsen** — Ein Baum hat Stamm und Krone, ein
  Beerenstrauch rote Punkte, Gold glänzt gelb, Stein ist grau und kantig.
  Leert sich ein Vorrat, wird er sichtbar kleiner.

### Gebäude und Einheiten (Stufe A)

- **AC-4** `offen` **Gebäude haben Körper** — Jedes Gebäude hat Grundfläche, Wände und Dach mit
  Licht von links oben. Die Spielerfarbe steht an einer festen Stelle (Banner,
  Dachkante), nicht als ganze Fläche.
- **AC-5** `offen` **Baustelle sichtbar** — Eine Baustelle zeigt Gerüst und Fundament und
  wächst mit dem Fortschritt.
- **AC-6** `offen` **Einheiten sind Figuren** — Dorfbewohner, Miliz und Späherreiter sind an der
  Gestalt zu unterscheiden (Werkzeug, Schwert und Schild, Pferd), mit
  Spielerfarbe am Körper. Ein Dorfbewohner zeigt, was er trägt.
- **AC-7** `offen` **Vorn verdeckt hinten** — Was weiter unten im Bild steht, wird später
  gezeichnet. Eine Einheit hinter einem Haus ist verdeckt; eine ausgewählte
  bleibt als Umriss erkennbar.
- **AC-8** `offen` **Auswahl und Leben am Boden** — Ausgewähltes trägt eine Ellipse am Boden,
  darüber einen Lebensbalken. Gebäude zeigen ihren Balken, wenn sie
  ausgewählt oder beschädigt sind.

### Prüfbar machen

- **AC-9** `offen` **Eine Schautafel** — Eine Seite zeigt jedes Gebäude und jede Einheit der
  aktuellen Stufe nebeneinander, in zwei Spielerfarben, mit Namen darunter.
  Sie ist der Bildnachweis zu [Fahrplan](fahrplan.md) AC-7 und wird mit jeder
  Stufe länger.
- **AC-10** `offen` **Flüssig im Browser** — Mit 100 Einheiten und 30 Gebäuden im Bild zeichnet
  der Browser im Browserlauf mindestens 50 Bilder je Sekunde.
- **AC-11** `offen` **Nur eigenes Material** — Kein Bild, kein Klang, keine Schrift aus dem
  Original; kein „Age of Empires" im Spiel. Geprüft: `public/` enthält keine
  Rastergrafik außer selbst erzeugten, und die Oberfläche nennt die Marke nicht.

## Grenzfaelle

- Weit herausgezoomt werden Figuren zu Punkten in Spielerfarbe, Gebäude zu
  Flächen — lesbar bleibt, wer wo steht.
- Das Spielbild muss auch ohne Grafikkarte flüssig laufen; zeichnen,
  was im Bild ist, nicht die ganze Karte.
