# OnlineGames

Spiele für mehrere, über einen Raumcode. Einer eröffnet eine Partie, gibt vier
Zeichen weiter, die anderen treten bei — kein Konto, keine Installation.

Das erste Spiel ist ein Echtzeit-Strategiespiel im Geist von *Age of Empires*,
bewusst klein geschnitten: eine Karte, zwei Rohstoffe, ein Einheitentyp.
Gewachsen wird nach [Spezifikation](specs/), nicht nach Laune.

> **Abgrenzung zu [LocalGames](../LocalGames/):** Dort liegen die Partien im
> Gerät und verlassen es nicht. Hier gibt es einen Server, weil ein
> gemeinsames Spiel ohne ihn nicht geht. Das ist ein anderes Versprechen —
> deshalb ein anderes Projekt.

## Ausprobieren

```bash
npm install
npm start
```

Braucht **Node 24** (wegen `node:sqlite`). Mit `fnm` schaltet die `.node-version`
im Ordner automatisch um.

Dann `http://localhost:4180/` aufrufen.

**Mitspielen** geht sofort: Code und Name eintippen. **Eroeffnen** verlangt ein
Konto, und ein Konto verlangt einen Einladungscode:

```bash
npm run einladung -- neu "fuer Bert"    # legt einen Code an, gilt 14 Tage
npm run einladung                        # zeigt alle, mit Stand
npm run einladung -- weg ABCD-EFGH       # nimmt einen unbenutzten zurueck
```

Im Betrieb gehoert `KONTEN_GEHEIMNIS` gesetzt — sonst macht jeder Neustart
alle Sitzungen ungueltig. Für einen Test allein: zwei
Browserfenster nebeneinander, im ersten eröffnen, im zweiten mit dem Code
beitreten.

| Eingabe               | Wirkung                          |
| --------------------- | -------------------------------- |
| Ziehen mit links      | Einheiten auswählen              |
| Klick mit links       | eine Einheit auswählen           |
| Klick mit rechts      | laufen, auf Wald/Beeren: sammeln |
| `W A S D` oder Pfeile | Karte verschieben                |
| Mausrad               | näher heran, weiter weg          |

## Stand

Der Arbeitsvorrat steht in [`specs/BOARD.md`](specs/BOARD.md) und wird erzeugt,
nicht gepflegt. Ein Abnahmekriterium gilt erst als `fertig`, wenn ein Test es
mit seiner Nummer nennt — das prüft `npm run specs:belege`.

```bash
npm run check          # Board aktuell? Belege vollständig? Report? Tests grün?
npm test               # nur die Tests (rund 10 Sekunden)
npm run specs:board    # Board und Stand-Zeilen neu schreiben
npm run qa:report      # qa/report/index.html erzeugen und im Browser öffnen
```

`qa/report/index.html` ist dieselbe Übersicht als Seite: Fortschrittsbalken,
Filter nach Status und Bereich, Volltextsuche, und an jedem fertigen Kriterium
die Marke **belegt** oder **ohne Beleg**.

## Aufbau

```
server/     karte.js    Kartenerzeugung, wiederholbar über einen Startwert
            wege.js     A* auf dem Raster, acht Richtungen
            welt.js     die Simulation: Einheiten, Aufträge, Vorräte
            raeume.js   Räume, Beitritt, Rückkehr nach Abbruch
            schutz.js   Grenzen je Adresse und je Server
            konten.js   Better Auth, Sitzungen, Einladungscodes
            index.js    HTTP für die Dateien, WebSocket für das Spiel
public/     app.js      Verbindung, Vorraum, Warteraum
            ansicht.js  zeichnet die Welt, nimmt Maus und Tastatur
specs/      was das Produkt ist, mit Abnahmekriterien
docs/adr/   warum es so gebaut ist
scripts/    Board, Belegprüfung, QA-Report
qa/report/  die Übersicht als Seite (erzeugt)
daten/      konten.sqlite - Konten und Einladungen (nicht im Repo)
tests/      netz, konten, schutz: über den echten Anfrageweg · regeln: direkt
```

Der Server rechnet, der Browser malt — warum, steht in
[ADR-0001](docs/adr/0001-server-rechnet.md). Damit gibt es kein
Abgleichproblem, kein Schummeln und eine Rückkehr nach dem Absturz geschenkt.

## Zahlen

| | |
| --- | --- |
| Takt | 10 Zustände je Sekunde, dazwischen rechnet der Browser weiter |
| Ein Zustand | 607 Byte bei zehn Einheiten |
| 60 Sekunden Spiel | in 15 ms gerechnet |
| Wegsuche quer über die Karte | 0,2 ms |
| Spieler je Partie | 2 bis 6 |
| Kennwoerter | Argon2id, mindestens 10 Zeichen |
| Sitzung | 30 Tage, HttpOnly-Keks, SameSite=Lax |

## Was als Nächstes kommt

Das Fundament steht: gemeinsame Welt, Befehle, Wegfindung, Sammeln, Rückkehr
nach Abbruch, Schutzschicht und Anmeldung. Was fehlt, ist das Spiel — Bauen,
Einheiten ausbilden, Kampf, ein Ende mit Sieger.

Der ehrlichste nächste Schritt ist aber keiner am Rechner: einmal zu fünft
spielen und sehen, ob die Grundschleife trägt.
