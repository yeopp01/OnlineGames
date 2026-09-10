# Einheiten und Befehle

**Bereich:** Strategie
**Kuerzel:** einheiten
**Stand:** 9/10 fertig · 1 offen

## Zweck

Was ein Spieler tun kann, und was daraufhin passiert.

## Abgrenzung

| Gehoert dazu                       | Gehoert nicht dazu                            |
| ---------------------------------- | --------------------------------------------- |
| Auswahl, Bewegung, Sammeln         | Feldarten → [Karte](karte-und-vorraete.md)    |
| Wegfindung                         | Kampf und Bauen (spaetere Spec)               |

## Abnahmekriterien

### Auswahl und Befehl

Auswahlrahmen, Klick, Rechtsklick und Tastenkuerzel stehen in
[Bedienung](bedienung.md) - hier geht es nur darum, was ein angekommener
Befehl bewirkt.

- **AC-4** `fertig` **Nur eigene Einheiten gehorchen** — Belegt ueber den echten Anfrageweg, siehe
  [Uebertragung](../00-plattform/uebertragung.md) AC-2.

### Bewegung

- **AC-6** `fertig` **Weg um Hindernisse** — Einheiten laufen um Wald, Beeren und Wasser herum, in
  acht Richtungen.
- **AC-7** `fertig` **Keine Abkuerzung durch Ecken** — Diagonal nur, wenn beide angrenzenden Felder
  frei sind. Sonst laufen Einheiten durch Hausecken.
- **AC-8** `fertig` **Wegsuche bleibt bezahlbar** — Eine Suche quer ueber die Karte kostet unter
  1 ms, damit auch 120 Einheiten in einem Takt neu planen koennen.
- **AC-9** `fertig` **Unerreichbares Ziel laesst stehen** — Fuehrt kein Weg zum Ziel, bleibt die
  Einheit stehen, statt sich zu verhaken.
- **AC-10** `offen` **Einheiten blockieren sich nicht** — Heute laufen sie durcheinander hindurch.
  _(Bewusst so: Ausweichverhalten ist aufwendig und faellt erst bei vielen
  Einheiten auf.)_

### Sammeln

- **AC-11** `fertig` **Vollstaendige Sammelschleife** — Ein Sammler laeuft zum Vorrat, sammelt zwei
  Sekunden, traegt zehn Einheiten zur Basis und kehrt von selbst zurueck.
- **AC-12** `fertig` **Ablieferung erhoeht den Vorrat** — Erst an der Basis steigt der Vorrat des
  Spielers, nicht schon beim Sammeln.
- **AC-13** `fertig` **Ersatzfeld bei Erschoepfung** — Ist ein Feld leer, sucht der Sammler
  selbstaendig das naechste gleicher Art im Umkreis von zwoelf Feldern.
- **AC-14** `fertig` **Ohne Ersatz wird gewartet** — Findet er keines, bleibt er stehen, statt quer
  ueber die Karte zu laufen.

## Grenzfaelle

- Ein Sammelbefehl auf ein bereits leeres Feld greift sofort auf AC-13 zurueck.
- Wird ein Sammler mitten im Tragen umbefohlen, verfaellt seine Ladung. Das ist
  bewusst so — ein Zwischenlager waere eine eigene Mechanik.
