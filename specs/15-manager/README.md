# Managerspiel

Das zweite Spiel: ein Fußballmanager im Geist von Anstoss 3 — zwei Ligen, ein
Pokal, Kader, Verträge, Transfers, Geld, Vorstand, Saison um Saison.
Rundenbasiert, deshalb billig für den Server und ohne die Netzfragen des
Strategiespiels (→ [ADR-0008](../../docs/adr/0008-zweites-spiel-manager.md)).

| Spezifikation                                     | Beantwortet                                        |
| ------------------------------------------------- | -------------------------------------------------- |
| [Spielziel](spielziel.md)                         | Was für ein Spiel wird das, und was **nicht**?     |
| [Kader und Spieler](kader.md)                     | Woher kommen Spieler, was können sie, wie altern sie? |
| [Aufstellung, Taktik, Training](aufstellung.md)   | Was entscheidet ein Manager vor dem Spiel?         |
| [Spieltag](spieltag.md)                           | Wie entsteht aus zwei Mannschaften ein Ergebnis?   |
| [Liga und Saison](liga.md)                        | Zwei Ligen, Kalender, Tabelle, Auf- und Abstieg    |
| [Pokal](pokal.md)                                 | 32 Vereine, K.-o., Verlängerung, Elfmeter          |
| [Transfermarkt](transfer.md)                      | Was kostet ein Spieler, und wer gibt ihn her?      |
| [Verträge](vertraege.md)                          | Wer bleibt, wer geht, was kostet das?              |
| [Finanzen](finanzen.md)                           | Woran endet jede Entscheidung?                     |
| [Vorstand](vorstand.md)                           | Was war eine Saison wert?                          |
| [Karriere](karriere.md)                           | Der Ablauf, Zug für Zug, und der Spielstand        |
| [Bedienung](bedienung.md)                         | Wie schnell kommt eine Absicht zum Klick?          |
| [Prüfstand](pruefstand.md)                        | Ein Werkzeug, das verschwunden ist                 |

## Spielbar unter `/manager.html`

Anmelden, Verein wählen, Termin für Termin. Eine Saison rechnet in unter
200 ms; der Spielstand liegt am Konto in SQLite und überlebt jeden Neustart.

## Was fehlt

**Mehrere Menschen in einer Welt** ([Spielziel](spielziel.md) AC-1, AC-2) —
der Grund, warum das Spiel hier liegt und nicht in LocalGames. Die Welt ist
dafür gebaut: 35 Vereine spielen schon nach denselben Regeln wie der eine
Mensch.

Die Oberfläche wird in einem echten Browser geprüft und hat je Kriterium einen
Bildnachweis — zu sehen im Bericht (`npm run qa:report`).
