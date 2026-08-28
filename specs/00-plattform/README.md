# Plattform

Alles, was traegt, aber nicht spielt: wie Leute zusammenkommen, was ueber die
Leitung geht, wer ein Konto bekommt und was den Server vor Fremdnutzung
schuetzt.

| Spezifikation                                     | Beantwortet                                  |
| ------------------------------------------------- | -------------------------------------------- |
| [Raeume und Partien](raeume.md)                   | Wie kommen fuenf Freunde in dieselbe Partie? |
| [Uebertragung](uebertragung.md)                   | Was fliesst zwischen Server und Browser?     |
| [Konten und Anmeldung](konten.md)                 | Wer darf eroeffnen, wer nur mitspielen?      |
| [Spielauswahl und Einstellungen](spielauswahl.md) | Welches Spiel, womit, mit wem?               |
| [Anhalten und Fortsetzen](speichern.md)           | Wie kommt man Wochen spaeter zurueck?        |
| [Schutz vor Fremdnutzung](schutz.md)              | Was haelt Fremde vom Server fern?            |

## Die zwei Saetze, die alles zusammenhalten

**Eroeffnen verlangt ein Konto, Mitspielen nicht.** Wer eine Partie eroeffnet,
belegt Rechenzeit - dort leistet ein Konto etwas. Wer mitspielt, tippt Code
und Namen. Die Schicht darunter ([Schutz](schutz.md)) greift ohne Ansehen der
Person, weil ein Angreifer gar kein Konto will.

**Der Raum ist fluechtig, der Spielstand ist dauerhaft.** Ein Code lebt so
lange wie die Sitzung; der Weg zurueck ins eigene Spiel fuehrt nie ueber einen
aufgeschriebenen Code, sondern ueber das Konto
(→ [ADR-0007](../../docs/adr/0007-zwei-arten-von-partien.md)).
