# ADR-0006: OnlineGames traegt mehrere Spiele, aber erst wenn es zwei gibt

**Status:** entschieden
**Datum:** 2026-08-28

## Frage

Das Projekt heisst OnlineGames, nicht "Strategiespiel". Mittelfristig soll
mehr dazukommen - genannt wurde ein Aufbauspiel im Geist der Sims, also
Hausbau statt Heerfuehrung. Muss der Aufbau jetzt darauf vorbereitet werden?

## Entscheidung

**Nein - der Schnitt wird benannt, aber nicht gebaut.** Die Trennung besteht
bereits; sie wird erst dann zu einer Schnittstelle, wenn ein zweites Spiel
tatsaechlich entsteht.

## Begruendung

Der Schnitt liegt schon da, wo er hingehoert:

| Traegt jedes Spiel                                  | Gehoert nur dem Strategiespiel |
| --------------------------------------------------- | ------------------------------ |
| `index.js` — HTTP, WebSocket, Nachrichtentypen        | `welt.js` — Simulation         |
| `raeume.js` — Raumcode, Beitritt, Rueckkehr           | `karte.js` — Kartenerzeugung   |
| `schutz.js` — Grenzen je Adresse und je Server        | `wege.js` — Wegfindung         |
| spaeter: Konten, Einladungscodes                      | `ansicht.js` — Darstellung     |

Die linke Spalte weiss heute schon fast nichts vom Spiel. `raeume.js` kennt
genau drei Dinge davon: dass es eine `Welt` gibt, dass sie `takten()` kann und
dass sie einen `zustand()` liefert. Das sind die drei Methoden, aus denen
spaeter die Schnittstelle wird:

```
aufbau()   einmalig beim Start, geht an alle
takten()   ein Schritt, so oft wie das Spiel es braucht
zustand()  was die Browser danach zu sehen bekommen
befehl()   was ein Spieler will, geprueft gegen den Absender
```

Ein Aufbauspiel passt da hinein: andere Welt, andere Taktzahl - vermutlich
zwei statt zehn, weil ein Haus langsamer waechst als ein Reiter laeuft -,
dieselben Raeume, dieselbe Anmeldung, derselbe Schutz.

**Warum trotzdem jetzt nicht bauen:** Eine Schnittstelle, die aus einem
einzigen Anwendungsfall abgeleitet wird, ist geraten. Sie beschreibt nicht,
was zwei Spiele gemeinsam haben, sondern was das erste zufaellig tut. Beim
zweiten Spiel stellt sich dann heraus, dass die Haelfte nicht passt - und man
hat den Umbau doppelt.

Der Preis fuer das Warten ist gering: die Dateien in einen Ordner
`server/spiele/strategie/` zu schieben und vier Methoden zu benennen, ist
eine Stunde Arbeit. Diese Stunde ist besser bezahlt, wenn wir das zweite Spiel
schon kennen.

## Folgen

- Solange es ein Spiel gibt, liegen alle Serverdateien nebeneinander.
- Wer am Strategiespiel arbeitet, darf **nicht** in `raeume.js`, `schutz.js`
  oder `index.js` spielspezifisches unterbringen. Das ist die einzige Regel,
  die diese Entscheidung heute erzwingt - und die einzige, die den spaeteren
  Umbau billig haelt.
- Kommt das zweite Spiel, entsteht daraus ADR-0007 mit der tatsaechlichen
  Schnittstelle - aus zwei Beispielen abgeleitet statt aus einem.
- Die Raumverwaltung braucht dann eine Spielart je Raum, und der Vorraum eine
  Auswahl. Beides ist ohne Bruch nachruestbar.

## Was das fuer den Namen heisst

"OnlineGames" bleibt richtig, auch solange nur ein Spiel darin ist - so wie
LocalGames mit dem ersten Spiel auch schon LocalGames hiess. Der Name ist
zudem neutral: keine Marke, kein Bezug auf ein fremdes Werk.
