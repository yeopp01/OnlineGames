# Einheiten und Befehle

**Bereich:** Strategie
**Kuerzel:** einheiten
**Stand:** 9/17 fertig · 8 offen

## Zweck

Was ein Spieler tun kann, und was daraufhin passiert.

> **Stufe A löst ab.** AC-11 (zwei Sekunden, zehn Einheiten) beschreibt das
> Sammeln der kleinen Fassung. Es gilt, bis AC-15 gebaut ist; die Runde, die
> das tut, stellt AC-11 auf `zurueckgestellt (abgelöst durch einheiten AC-15)`
> und passt den Test an.

## Abgrenzung

| Gehoert dazu                       | Gehoert nicht dazu                            |
| ---------------------------------- | --------------------------------------------- |
| Auswahl, Bewegung, Sammeln         | Feldarten → [Karte](karte-und-vorraete.md)    |
| Wegfindung                         | Bauen → [Bauen](bauen.md), Kampf → [Kampf](kampf.md) |

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

### Stufe A — Dorfbewohner und Späher nach der Vorlage

| Einheit      | Leben | Tempo (Felder/s) | Sicht | Tragkraft |
| ------------ | ----- | ---------------- | ----- | --------- |
| Dorfbewohner | 25    | 0,8              | 4     | 10        |
| Späherreiter | 45    | 1,2              | 4     | –         |
| Miliz        | 40    | 0,9              | 4     | –         |

| Tätigkeit     | je Sekunde | Abgabe an |
| ------------- | ---------- | --------- |
| Holz fällen   | 0,39       | Dorfzentrum, Holzfällerlager |
| Schafe hüten  | 0,33       | Dorfzentrum, Mühle |
| Beeren        | 0,31       | Dorfzentrum, Mühle |
| Farm          | 0,32       | Dorfzentrum, Mühle |
| Gold          | 0,38       | Dorfzentrum, Bergbaulager |
| Stein         | 0,36       | Dorfzentrum, Bergbaulager |

- **AC-15** `offen` **Vier Rohstoffe sammeln** — Rechtsklick eines Dorfbewohners auf Baum,
  Beerenstrauch, Gold- oder Steinfeld: er sammelt mit der Rate aus der Tabelle,
  trägt bis zu zehn und bringt sie weg. Wechselt er den Rohstoff, verfällt die
  alte Ladung.
- **AC-16** `offen` **Abgabe am nächsten Lager** — Ein voller Dorfbewohner bringt seine Ladung zum
  nächsten fertigen Gebäude, das diesen Rohstoff annimmt, und kehrt zum selben
  Vorrat zurück.
- **AC-17** `offen` **Schafe schlachten und hüten** — Rechtsklick eines Dorfbewohners auf ein
  eigenes Schaf: er schlachtet es und nimmt Nahrung vom Kadaver. Ein Kadaver
  verliert je 4 Sekunden eine Nahrung, solange niemand an ihm arbeitet — wie
  im Original, damit man nicht alle Schafe zugleich schlachtet.
- **AC-18** `offen` **Farm bestellen** — Ein Dorfbewohner auf einer fertigen Farm sammelt dort
  Nahrung, bis die Farm leer ist. Auf einer Farm arbeitet höchstens einer.
- **AC-19** `offen` **Werte nach der Vorlage** — Dorfbewohner, Späherreiter und
  Miliz haben die Werte aus der Tabelle; der Späher ist anderthalbmal so
  schnell wie ein Dorfbewohner.
- **AC-20** `offen` **Ein Befehl für viele** — Mehrere ausgewählte Einheiten, zum selben Punkt
  geschickt, stellen sich dort nebeneinander auf, statt auf einem Feld zu
  stehen. Mehrere Sammler auf einem Vorrat verteilen sich auf die Nachbarn
  derselben Art.
- **AC-21** `offen` **Untätig ist erkennbar** — Die Welt weiß je Spieler, welche Dorfbewohner
  nichts tun. Die Oberfläche zeigt die Zahl und springt zum nächsten
  (→ [Bedienung](bedienung.md) AC-28).

## Grenzfaelle

- Ein Sammelbefehl auf ein bereits leeres Feld greift sofort auf AC-13 zurueck.
- Wird ein Sammler mitten im Tragen umbefohlen, verfaellt seine Ladung. Das ist
  bewusst so — ein Zwischenlager waere eine eigene Mechanik.
