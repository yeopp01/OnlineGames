# Strategie

Ein spielbarer Klon von Age of Empires II mit fünf Völkern, gebaut in Stufen
([ADR-0012](../../docs/adr/0012-aoe2-als-vorlage.md)). Der [Fahrplan](fahrplan.md)
sagt, was als Nächstes kommt; [Spielziel](spielziel.md) sagt, was für ein
Spiel es wird.

| Spezifikation                                    | Beantwortet                                  |
| ------------------------------------------------ | -------------------------------------------- |
| [Fahrplan zum Klon](fahrplan.md)                 | In welcher Reihenfolge, und woran merkt man, dass eine Stufe steht? |
| [Spielziel und Partieverlauf](spielziel.md)      | Was fuer ein Spiel wird das, und wann endet es? |
| [Karte und Vorraete](karte-und-vorraete.md)      | Worauf wird gespielt?                        |
| [Einheiten und Befehle](einheiten-und-befehle.md) | Was tun Einheiten, wenn ein Befehl ankommt? |
| [Bauen und Ausbilden](bauen.md)                  | Wie wird aus Rohstoffen Wirtschaft und Heer? |
| [Kampf](kampf.md)                                | Wie wird gekaempft?                          |
| [Bedienung](bedienung.md)                        | Wie schnell kommt eine Absicht zum Befehl?   |
| [Darstellung](darstellung.md)                    | Wie sieht es aus, ohne das Original zu kopieren? |
| [KI-Spieler](ki.md)                              | Wer spielt, wenn kein Mensch da ist — und wie misst man damit? |

Regeln und Zahlen des Originals stehen in der
[Vorlage](../../docs/strategie/vorlage-aoe2.md) — dort, was AoE II tut; hier,
was dieses Spiel tut.

## Reihenfolge

Gebaut ist der Unterbau: Karte, Bewegung, Sammeln. Es folgen der Einstieg
(Spielauswahl) und das Spielbild im Browser, dann die Stufen A bis G aus dem
[Fahrplan](fahrplan.md). Die Fach-Specs werden zu Beginn der Stufe, die sie
betrifft, auf die Vorlage umgeschrieben.

[Bedienung](bedienung.md) laeuft nebenher mit: jeder Brocken bringt seine
eigenen Bedienkriterien mit, und die wandern in diese eine Spec.
