# Spielauswahl und Einstellungen

**Bereich:** Plattform
**Kuerzel:** auswahl
**Stand:** 16/21 fertig · 5 offen

## Zweck

Der Weg vom Anmelden bis zum ersten Zug. Welches Spiel, mit welchen
Einstellungen, mit wem — und bei fortlaufenden Spielen: an welchem
Spielstand weiter.

## Abgrenzung

| Gehoert dazu                        | Gehoert nicht dazu                                    |
| ----------------------------------- | ----------------------------------------------------- |
| Auswahl, Einstellungen, Eroeffnen   | Anmelden selbst → [Konten](konten.md)                 |
| Liste der eigenen Spielstaende      | Anhalten und Fortsetzen → [Speichern](speichern.md)   |
| Warteraum bis zum Start             | Bedienung im Spiel → [Bedienung](../10-strategie/bedienung.md) |

## Der Weg

```
Anmelden → Spiel waehlen → Einstellungen → eroeffnen → Code weitergeben
                        ↘ oder: eigenen Spielstand fortsetzen
```

Wer nur mitspielt, ueberspringt alles: Code eingeben, Namen eingeben, drin
(→ [Konten](konten.md) AC-1).

## Abnahmekriterien

### Auswahl

- **AC-1** `fertig` **Spiele stehen zur Wahl** — Nach dem Anmelden zeigt eine Uebersicht alle
  verfuegbaren Spiele mit Namen, einem Satz Beschreibung und der Spielerzahl,
  fuer die sie gedacht sind.
- **AC-2** `fertig` **Ein Spiel ist ein Eintrag** — Ein neues Spiel taucht in der
  Uebersicht auf, ohne dass jemand die Uebersicht anfasst.
- **AC-3** `fertig` **Unfertige Spiele sind gekennzeichnet** — Ein Spiel im Bau
  steht mit Kennzeichen in der Uebersicht, statt zu fehlen, und laesst sich
  schon eroeffnen. Ein Spiel, das noch gar nicht spielbar ist, steht dort
  sichtbar gesperrt.

### Einstellungen

- **AC-4** `fertig` **Spiel bringt Einstellungen mit** — Die Plattform kennt sie nicht,
  sie zeigt nur an, was das Spiel als Liste liefert: Name, Art, Vorgabe,
  Grenzen.
- **AC-5** `fertig` **Vorgaben ergeben spielbare Partie** — Wer nichts anfasst und sofort
  eroeffnet, bekommt eine sinnvolle Runde. Einstellungen sind zum Abweichen
  da, nicht zum Ausfuellen.
- **AC-6** `fertig` **Einstellungen des Strategiespiels** — Kartengroesse, Spielerzahl, Startwert
  der Karte, Vorratsmenge. _(Spielerzahl und Startwert stehen schon; Karte und
  Vorrat kommen mit dem Kartenumbau in Stufe A, das Volk je Spieler mit
  Stufe E → [Fahrplan](../10-strategie/fahrplan.md) AC-16.)_
- **AC-7** `fertig` **Startwert sichtbar und eingebbar** — Wer eine gute Karte hatte, kann
  sie wieder spielen; wer einen Fehler gefunden hat, kann ihn wiederholen.
- **AC-8** `fertig` **Ungueltige Werte werden abgewiesen** — Geprueft wird auf
  dem Server, nicht nur im Browser.
- **AC-9** `fertig` **Einstellungen stehen im Warteraum** — Die Mitspieler sehen vor dem Start, worauf
  sie sich einlassen.
- **AC-10** `fertig` **Nur der Gastgeber aendert sie** — Und Aenderungen sind bis zum Start moeglich.

### Eroeffnen

- **AC-11** `fertig` **Eroeffnen verlangt ein Konto** — Deckungsgleich mit
  [Konten](konten.md) AC-16; hier ist der Bildschirm, an dem es auffaellt.
- **AC-12** `offen` **Fortlaufend auch allein spielbar** — Ein Hausbau startet
  allein. Die Untergrenze von zwei Spielern gilt nur fuer Sitzungsspiele.
- **AC-13** `fertig` **Der Code erscheint sofort** — Zum Weitergeben, mit einem Knopf zum Kopieren.
- **AC-18** `fertig` **KI-Gegner einstellen** — Beim Eroeffnen einer
  Strategiepartie wird die **Zahl** der KI-Gegner eingestellt (0 bis 5). Sie
  steht im Warteraum (AC-9), damit niemand ueberrascht wird, und sie belegt
  Plaetze: bei hoechstens drei Spielern und zwei KIs ist der Raum mit einem
  Menschen voll. Es bleibt eine Einstellung des Spiels, nicht der Plattform
  (AC-4) — der Raum erfaehrt vom Steckbrief nur, wie viele Plaetze das Spiel
  selbst besetzt (`plaetze`). Statt „je Platz Mensch oder KI" eine Zahl, weil
  die Plaetze der Menschen erst beim Beitreten feststehen (Runde 101).
- **AC-19** `fertig` **Allein gegen die KI eroeffnen** — Mit mindestens einem
  KI-Gegner startet eine Sitzungspartie auch mit einem einzigen Menschen. Die
  Untergrenze von zwei Spielern gilt fuer **Plaetze**, nicht fuer Menschen —
  sonst ist das Strategiespiel allein nicht spielbar, und genau das ist der
  haeufigste Fall beim Ausprobieren.

### Name und Sprache

- **AC-20** `fertig` **Das Strategiespiel heißt Fading Allies** — So steht es
  auf seiner Karte in der Übersicht und im Titel der Schautafel; „Strategie"
  bleibt nur der Bezeichner (`art: 'strategie'`, Ordner, Testnamen).
  Entschieden vom Benutzer am 2026-11-08 — [ADR-0012](../../docs/adr/0012-aoe2-als-vorlage.md)
  Punkt 4 verlangt einen eigenen Namen. Der Name erzählt die Regel aus
  [Spielziel](../10-strategie/spielziel.md) AC-14: Bündnisse gibt es nur am
  Tisch, und keins hält länger als bis zum ersten Angriff.
- **AC-21** `fertig` **Echte Umlaute auf dem Bildschirm** — Was in Übersicht,
  Vorraum, Warteraum und Spielbild steht — Knöpfe, Einstellungen, Absagen,
  Namen von Gebäuden —, schreibt „Eröffnen", „Kartengröße", „Schießanlage",
  nicht „Eroeffnen". Bezeichner, Schlüssel und Werte auf dem Draht bleiben
  umschrieben (`kartengroesse`, `gross`). Die Regel stand von Anfang an in
  CLAUDE.md; bis Runde 87 standen trotzdem rund vierzig Texte umschrieben im
  Bild. Durchgesetzt von `tests/waechter-umlaute.test.mjs`; das ruhende
  Managerspiel liest der Wächter erst, wenn dort wieder gearbeitet wird.

### Eigene Spielstaende

- **AC-14** `offen` **Liste der eigenen Spielstaende** — Mit Spielart, selbst vergebenem Namen,
  Zeitpunkt der letzten Sitzung und einem Vorschaubild oder Kennwert.
- **AC-15** `offen` **Fortsetzen ist ein Klick** — Kein Code, keine Suche. Der Spielstand kommt in
  einen neuen Raum mit neuem Code (→ [ADR-0007](../../docs/adr/0007-zwei-arten-von-partien.md)).
- **AC-16** `offen` **Umbenennen und Loeschen** — Beides direkt aus der Liste, Loeschen mit
  Rueckfrage.
- **AC-17** `offen` **Sitzungsspiele erscheinen dort nicht** — Eine beendete Strategiepartie
  hinterlaesst hoechstens einen Eintrag in der Bilanz, keinen Spielstand.

## Grenzfaelle

- Ein Spielstand, dessen Spielart es nicht mehr gibt, wird als „nicht mehr
  spielbar" gezeigt und laesst sich noch loeschen — aber nicht mehr oeffnen.
- Aendert sich ein Spiel so, dass alte Spielstaende nicht mehr passen, ist das
  eine Entscheidung fuer ein ADR und nicht etwas, das stillschweigend beim
  Laden schiefgeht.
