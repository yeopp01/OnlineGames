# Uebertragung

**Bereich:** Plattform
**Kuerzel:** uebertragung
**Stand:** 1 in qa · 2 geplant · 1 offen · 6 fertig

## Zweck

Der Server rechnet, der Browser malt. Was zwischen beiden fliesst, steht hier —
und warum es so wenig ist.

## Abgrenzung

| Gehoert dazu                       | Gehoert nicht dazu                            |
| ---------------------------------- | --------------------------------------------- |
| Nachrichtentypen, Zustandsgroesse  | Raumverwaltung → [Raeume](raeume.md)          |
| Wer wem was glauben darf           | Spielregeln → [Strategie](../10-strategie/)   |
| Weiches Bild trotz zehn Takten     | Wahl der Bauweise → [ADR-0001](../../docs/adr/0001-server-rechnet.md) |

## Abnahmekriterien

### Richtung und Vertrauen

- **AC-1** `fertig` **Der Server ist die Wahrheit** — Der Browser schickt ausschliesslich Absichten
  (`befehl`). Er rechnet nichts aus, was den Spielstand betrifft.
- **AC-2** `fertig` **Nur eigene Einheiten gehorchen** — Ein Befehl wirkt nur auf Einheiten des
  absendenden Spielers. Fremde Einheiten bewegen sich nicht, und es gibt keine
  Fehlermeldung, die verraet, dass es sie gibt.
- **AC-3** `fertig` **Ziele ausserhalb der Karte verpuffen** — Ein Ziel ausserhalb der Karte oder mit
  falschem Datentyp wird verworfen, ohne die Partie zu stoeren.
- **AC-4** `offen` **Befehlsflut wird gebremst** — Mehr als 20 Befehle je Sekunde und Spieler werden
  verworfen. _(Heute unbegrenzt — bei fuenf Freunden kein Problem, im offenen
  Netz schon.)_

### Takt und Zustand

- **AC-5** `fertig` **Zehn Zustaende je Sekunde** — Der Server schickt zehnmal je Sekunde den
  vollstaendigen Zustand: Vorraete je Spieler und alle Einheiten mit Ort und
  Ladung.
- **AC-6** `fertig` **Aufbau nur einmal** — Die Karte geht einmal beim Start als Base64 ueber die
  Leitung, danach nur noch einzelne geaenderte Felder.
- **AC-7** `fertig` **Ein Zustand bleibt klein** — Bei zehn Einheiten liegt ein Zustand unter 1 kB.
  Bei sechs Spielern zu je zwanzig Einheiten muss er unter 8 kB bleiben.
- **AC-8** `in qa` **Weiches Bild trotz zehn Takten** — Der Browser rechnet zwischen zwei Zustaenden
  linear weiter, damit Bewegung bei 60 Bildern je Sekunde nicht ruckelt.

### Verbindung

- **AC-9** `geplant` **Abbruch ist sichtbar** — Reisst die Verbindung, sieht der Spieler das im Bild
  und nicht erst an stehenden Einheiten.
- **AC-10** `geplant` **Automatischer Wiederaufbau** — Der Browser verbindet sich nach einem Abbruch
  von selbst neu und kehrt mit dem Token auf seinen Platz zurueck, ohne dass
  jemand die Seite neu laedt.

## Grenzfaelle

- Ein Spieler mit langsamer Leitung bekommt Zustaende verspaetet, nie in
  falscher Reihenfolge — die Taktnummer `t` steigt streng.
- Feldaenderungen (`felder`) kommen genau einmal. Das ist tragbar, weil der
  `aufbau` die Karte in ihrem **aktuellen** Stand schickt, nicht in ihrem
  urspruenglichen: wer neu verbindet, sieht abgeerntete Waelder korrekt als
  Gras. Ein Spieler, der eine einzelne Nachricht verliert, ohne die Verbindung
  zu verlieren, sieht bis zum naechsten `aufbau` einen Baum zu viel — nur ein
  Schoenheitsfehler, denn begehbar ist das Feld fuer alle gleich, der Server
  entscheidet.
