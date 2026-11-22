# ADR-0018: Das Managerspiel wird ausgebaut — und sieben Zeilen fallen halb

**Status:** vorgeschlagen (2026-11-22). **Nicht entschieden** — der Benutzer
hat keine der Fragen unten beantwortet. Bis dahin wird nur gebaut, was kein
Verhalten und keinen Umfang ändert (Stufe M0 im
[Plan](../manager/plan.md)).
**Datum:** 2026-11-22
**Ändert, wenn entschieden:** [ADR-0008](0008-zweites-spiel-manager.md)
(„Keine Videosequenzen, kein Livespiel" — das Livespiel fällt, als Text);
`specs/15-manager/spielziel.md`, Tabellen „Abgrenzung" und „Was es
ausdrücklich nicht wird"; `CLAUDE.md` („die Arbeit daran ruht").
[ADR-0016](0016-gerenderte-bilder.md) bleibt für das Strategiespiel und
bekommt eine Ausnahme (unten, Frage 7).

## Frage

Das Managerspiel ist fertig im Sinn seiner Specs — 150 von 156 Kriterien —
und es fehlt ihm, weswegen man so ein Spiel spielt. Der Befund steht im
[Plan](../manager/plan.md), Abschnitt 1: der Spieler ist eine Zahl, das Spiel
ein Ergebnis, die Woche ein Knopf, der Verein ein Name. Ein Teil davon war
Absicht: `spielziel.md` hat gestrichen, was Wochen kostet.

Die Streichliste war richtig für ein Spiel, das billig sein sollte, während
das Strategiespiel gebaut wird. Sie ist falsch für ein Spiel, das jemand an
einem Abend zu fünft spielen will. Was davon fällt?

## Vorschlag

**Sieben Zeilen fallen — jede nur zur Hälfte.** Links, was gebaut wird;
rechts, was aus derselben Zeile gestrichen bleibt.

| Zeile in `spielziel.md` | Wird gebaut | Bleibt gestrichen |
| ----------------------- | ----------- | ----------------- |
| Spielverlauf zum Zusehen | Das eigene Spiel läuft als Text mit Uhr, Szenen, Verlaufsband und Spielfeld als Schema; man greift ein | 2D, Videosequenzen, Sprecher |
| Standardsituationen | Vier Schützen bestimmen (Elfmeter, Freistoß, Ecken, Kapitän) | Standardvarianten, Manndeckung, Laufwege |
| Kein Presseteil | Eine Zeitung je Termin aus Bausteinen; Ereignisse, die eine Antwort wollen | Interviews, Pressekonferenzen |
| Trainerstab | Fünf Gebäude mit fünf Stufen, die tun, was ein Stab täte | Mitarbeiter mit Namen, Werten und Markt |
| Einheiten je Spieler, Wochenplan | Sondertraining für bis zu drei Spieler, Trainingslager | Wochenplan, Einheiten für jeden |
| Vertragspoker über Runden | Eine Gegenforderung; Zusagen, die gemerkt werden; Leihe | Berater, Handgeld, mehr als eine Runde |
| Fanmeinung | Der Anhang als Größe und Stimmung, ein Rivale | Fanartikel, Verpflegung, Bierpreis |

Dazu, ohne dass eine Zeile fallen muss: Fähigkeiten und Charakter je Spieler,
verdecktes Talent, Farben und Wappen, Laufbahn und Ruhmeshalle — und das, was
seit ADR-0008 offen ist: **mehrere Menschen in einer Welt**.

Ganz gestrichen bleiben: Europapokal, Nationalmannschaft, dritte Liga,
Präsidentenwahl, echte Namen und Lizenzen, das Handy.

## Begründung

1. **Die Streichliste hat an der falschen Stelle gespart.** Sie hat Umfang
   gestrichen (richtig) und dabei jede Stelle mitgenommen, an der der Mensch
   etwas entscheidet oder etwas erlebt. Was fällt, sind genau die Hälften, die
   eine Entscheidung tragen — nicht die, die nur Umfang sind.
2. **Der Preis ist kleiner als damals.** Jede Zeile war „eine Woche". Seither
   ist am Strategiespiel gebaut, was das billig macht: Inhalt als Daten mit
   einer Stelle, die Wirkungen liest (`HAEUSER`, `welt.wirkungen()`); der
   Server, der die Sätze schreibt (`bringt.js`); Sicht je Spieler (kampf
   AC-13); der Prüfstand, der jede Stellschraube misst.
3. **Die Geschwindigkeit bleibt.** Jede neue Stelle hat eine Vorgabe, die ohne
   den Menschen entscheidet. „Sofort" und Vorspulen bleiben, was sie sind.
4. **Mehrere Menschen sind der Grund, warum dieses Spiel hier liegt**
   (ADR-0008, Begründung 1) — und sie verlangen den Umbau ohnehin: Zustand je
   Manager, ein Spiel, das anhält, Gebote, die am Termin aufgelöst werden.

## Die sieben Fragen

Sie stehen mit Empfehlung im [Plan](../manager/plan.md), Abschnitt 3 (E1 bis
E7): Wiederaufnahme und Zweig, diese Tabelle, die Reihenfolge, die Rückkehr
eines Mitspielers ohne Konto, das Aussehen, der Ton, und:

**Frage 7 — Gesichter und Wappen.** ADR-0016 sagt: Bilder werden gerendert,
nicht gezeichnet. Für das Managerspiel wird vorgeschlagen, Gesichter und
Wappen als SVG aus Teilen im Browser zusammenzusetzen, bestimmt durch die
Kennung. Sechshundert Spieler, jedes Jahr neue, sind kein Fall für Blender.
Was aus ADR-0016 bleibt: kein Bildgenerator, kein fremdes Material außer
CC0.

## Was das kostet

Acht Stufen, geschätzt 62 bis 77 Runden (Plan, Abschnitt 6) — geschätzt,
nicht gemessen. Alle 141 Bildnachweise des Managerspiels ändern sich einmal.
Spielstände der Fassungen 2 und 3 werden angehoben, nicht verworfen.

## Was dagegen spricht

- Das Strategiespiel ist nicht fertig (F12, F13, Stufe G). Zwei Spiele
  zugleich sind zwei Schleifen, die an `CLAUDE.md`, am Board und am
  Browserlauf zusammenstoßen. Deshalb ein eigener Zweig und M1 erst nach F13.
- Jede Fähigkeit und jedes Ereignis dreht an Zahlen, die heute stimmen. Die
  Gleichstandsprobe und `npm run manager:messen` (M0.2) sind die Antwort
  darauf, keine Gewähr.
- Niemand hat das Spiel zu fünft gespielt. Vielleicht fehlt dort etwas ganz
  anderes. Deshalb kommt der Abend nach M3 und nicht nach M7.
