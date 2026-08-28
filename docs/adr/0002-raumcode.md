# ADR-0002: Raumcode statt Konto fuer den Zutritt

**Status:** entschieden
**Datum:** 2026-08-28

## Frage

Wie kommen fuenf Freunde in dieselbe Partie?

## Entscheidung

Ein sechsstelliger Raumcode und ein frei gewaehlter Name. Kein Konto, kein
Kennwort, keine Datenbank. Ein Konto kommt spaeter dazu (→
[ADR-0003](0003-anmeldung.md)), aber nie als Voraussetzung zum Mitspielen.

## Begruendung

Eine Anmeldung schuetzt davor, dass Fremde ein Konto uebernehmen. Es gibt kein
Konto. Das Geheimnis ist der Code, und er lebt so lange wie die Partie.

Betrug verhindert nicht die Anmeldung, sondern
[ADR-0001](0001-server-rechnet.md): der Server prueft jeden Befehl gegen den
Absender. Ein angemeldeter Spieler koennte genau so wenig fremde Einheiten
bewegen wie ein anonymer.

Der Code nutzt 28 Zeichen ohne Vokale und ohne `0`/`O`, `1`/`I` - er wird
vorgelesen und abgetippt, angezeigt in zwei Dreiergruppen (`KRN-4TZ`). Sechs
Zeichen ergeben 481.890.304 Kombinationen.

Vier Zeichen waeren mit der Bremse aus
[ADR-0005](0005-grenzen-statt-vertrauen.md) ebenfalls sicher gewesen. Aber
zwei zusaetzliche Zeichen kosten beim Vorlesen fast nichts und machen den
Riegel unabhaengig davon, ob die Bremse richtig arbeitet.

## Folgen

- Der Server haelt eine laufende Partie im Arbeitsspeicher. Ein Neustart
  beendet sie. Das ist bei Partien von 15 Minuten vertretbar - fuer
  fortlaufende Spiele ausdruecklich nicht mehr, siehe
  [ADR-0007](0007-zwei-arten-von-partien.md).
- Ohne Konto gibt es keine Wiedererkennung ueber Partien hinweg - genau das
  loest ADR-0003.
- Fuer die Rueckkehr nach einem Absturz braucht es doch eine Kennung: ein
  Zufalls-Token je Platz, das im Browser liegt und mit der Partie stirbt.
