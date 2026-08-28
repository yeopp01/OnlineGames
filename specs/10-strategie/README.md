# Strategie

Das Spiel selbst. [Spielziel](spielziel.md) ist die Klammer - dort steht auch,
was ausdruecklich **nicht** gebaut wird.

| Spezifikation                                    | Beantwortet                                  |
| ------------------------------------------------ | -------------------------------------------- |
| [Spielziel und Partieverlauf](spielziel.md)      | Was fuer ein Spiel wird das, und wann endet es? |
| [Karte und Vorraete](karte-und-vorraete.md)      | Worauf wird gespielt?                        |
| [Einheiten und Befehle](einheiten-und-befehle.md) | Was tun Einheiten, wenn ein Befehl ankommt? |
| [Bauen und Ausbilden](bauen.md)                  | Wie wird aus Rohstoffen Wirtschaft und Heer? |
| [Kampf](kampf.md)                                | Wie wird gekaempft?                          |
| [Bedienung](bedienung.md)                        | Wie schnell kommt eine Absicht zum Befehl?   |

## Reihenfolge

Gebaut ist der Unterbau: Karte, Bewegung, Sammeln. Der naechste Brocken ist
[Bauen](bauen.md) - ohne etwas zu bauen gibt es keine Entscheidung, und ohne
Entscheidung kein Spiel. Danach [Kampf](kampf.md), dann das Ende der Partie
aus [Spielziel](spielziel.md).

[Bedienung](bedienung.md) laeuft nebenher mit: jeder Brocken bringt seine
eigenen Bedienkriterien mit, und die wandern in diese eine Spec.
