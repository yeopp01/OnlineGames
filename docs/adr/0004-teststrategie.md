# ADR-0004: Tests laufen ueber den echten Anfrageweg

**Status:** entschieden
**Datum:** 2026-08-28

## Frage

Woran wird belegt, dass ein Abnahmekriterium erfuellt ist?

## Entscheidung

Die Pflichttests sprechen ueber **WebSocket mit dem laufenden Server**, nicht
mit den Klassen dahinter. Ein Kriterium gilt erst als `fertig`, wenn ein Test
es mit seiner Nummer nennt.

## Begruendung

Die interessanten Fehler dieses Projekts liegen nicht in der Simulation,
sondern an den Naehten: Ein Befehl wird angenommen, obwohl er von einem
fremden Spieler kommt. Ein Raum startet ohne Mitspieler. Eine kaputte
Nachricht bringt den Prozess um. Nichts davon faellt auf, wenn man
`welt.befehl()` direkt aufruft — genau das tut der Browser naemlich nie.

Der Test fuer AC-8 laeuft deshalb ueber vier Sekunden echte Spielzeit: Befehl
absetzen, Sammler laufen sehen, warten, bis der Vorrat steigt. Langsam, aber
er belegt die ganze Kette.

Reine Rechenteile — Wegfindung, Kartenerzeugung — duerfen direkt geprueft
werden. Sie haben keine Naht.

## Folgen

- `npm test` braucht keine Datenbank und kein Docker, aber einen freien Hafen
  (4199). Der Durchlauf dauert rund acht Sekunden.
- `npm run check` prueft zusaetzlich, ob das Board zu den Specs passt. Ein
  Status, den niemand gepflegt hat, bricht den Lauf.
- Ein Kriterium auf `fertig` zu setzen, ohne einen Test zu schreiben, ist der
  einzige Weg, diese Regel zu brechen. Er faellt in der Durchsicht auf, weil
  die Nummer im Testnamen fehlt.
