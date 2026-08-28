# Schutz vor Fremdnutzung

**Bereich:** Plattform
**Kuerzel:** schutz
**Stand:** 1 in qa · 4 offen · 7 fertig

## Zweck

Sobald der Server im Netz steht, ist er für jeden erreichbar. Konten regeln,
**wer eröffnen darf** — sie regeln nicht, **wer Last erzeugt**. Ein Fremder,
der Raumcodes durchprobiert, will gar kein Konto: er kostet Verbindungen,
Handshakes und Rechenzeit, bevor irgendeine Prüfung greift.

Diese Spec beschreibt die Schicht darunter: zählen, bremsen, zumachen.

## Abgrenzung

| Gehoert dazu                        | Gehoert nicht dazu                              |
| ----------------------------------- | ----------------------------------------------- |
| Grenzen je Adresse und je Verbindung | Wer ein Konto bekommt → [Konten](konten.md)    |
| Grenzen je Server                   | Spielregeln → [Strategie](../10-strategie/)     |
| Vertrauen in Adressangaben          | Verschluesselung → Reverse Proxy davor          |

## Zwei Riegel, nicht einer

**Der Code ist sechs Zeichen lang.** 28⁶ sind 481.890.304 Möglichkeiten. Bei
hundert laufenden Partien trifft im Mittel jeder 4,8-millionste Versuch — mit
hundert Versuchen je Sekunde wären das rund anderthalb Jahre für einen
einzigen Treffer.

**Und das Durchprobieren wird trotzdem gebremst** (AC-3): nach fünf falschen
Codes je Minute fliegt die Verbindung raus. Damit dauert derselbe Treffer
Jahrtausende.

Warum beides? Der Code allein ist eine Rechnung, die stimmt, solange niemand
etwas an den Werten dreht. Die Bremse allein hielte auch einen vierstelligen
Code sicher — aber sie ist Programmlogik, und Programmlogik hat Fehler. Zwei
Riegel, von denen jeder für sich reichen würde, kosten hier zusammen nichts.

Vier Zeichen wären es beinahe geworden. Zum Vergleich: 614.656 Möglichkeiten,
ein Treffer alle 6.150 Versuche, ohne Bremse **etwa jede Minute** einer.

## Abnahmekriterien

### Rechnung

- **AC-1** `fertig` **Tropfender Eimer** — Grenzen werden als tropfender Eimer gerechnet: kurze
  Spitzen sind erlaubt, Dauerlast nicht. Eine lange Pause füllt den Eimer
  höchstens bis zur Spitze, nie darüber hinaus.

### Grenzen je Adresse

- **AC-2** `fertig` **Gleichzeitige Verbindungen begrenzt** — Mehr als acht offene Verbindungen je
  Adresse werden mit 429 abgewiesen — **vor** dem Handshake, damit eine
  abgelehnte Verbindung billiger ist als eine angenommene.
- **AC-3** `fertig` **Durchprobieren trennt die Verbindung** — Nach fünf falschen Raumcodes je
  Minute wird die Verbindung getrennt. Die Meldung lautet immer gleich und
  verrät nie, ob es den Raum gibt.
- **AC-4** `fertig` **Offene Partien je Adresse begrenzt** — Eine Adresse hält höchstens drei
  Partien gleichzeitig offen. Endet eine, wird der Platz wieder frei.
- **AC-7** `in qa` **Nachrichtenflut trennt die Verbindung** — Mehr als 25 Nachrichten je Sekunde
  auf einer Verbindung führen zur Trennung. Jede Verbindung hat einen eigenen
  Eimer, damit eine laute die anderen derselben Adresse nicht mitreißt.

### Grenzen je Server

- **AC-5** `fertig` **Ausgelastet heisst ausgelastet** — Über 50 laufenden Partien nimmt der Server
  keine neuen an und sagt das auch. Ein überlasteter Server ist für alle
  kaputt, ein voller nur für den Nächsten.
- **AC-6** `fertig` **Die Adressliste waechst nicht unbegrenzt** — Adressen ohne offene Verbindung
  und ohne laufende Partie werden vergessen, sobald ihre Eimer wieder voll
  sind. Sonst ist die Bremse selbst das Leck.

### Vertrauen

- **AC-8** `fertig` **Weitergereichte Adresse nur hinter dem Proxy** — Der Kopf `X-Forwarded-For`
  wird nur geglaubt, wenn `HINTER_PROXY=1` gesetzt ist. Sonst darf jeder seine
  Adresse selbst behaupten und alle Grenzen umgehen.
- **AC-9** `offen` **Nachricht bleibt klein** — Über 8 kB je Nachricht wird die Verbindung
  getrennt. _(Die Grenze steht im Server, ein Test nennt sie noch nicht.)_

### Was noch fehlt

- **AC-10** `offen` **Partien haben eine Höchstdauer** — Eine Partie endet spätestens nach zwei
  Stunden, auch wenn ununterbrochen Befehle kommen.
- **AC-11** `offen` **Statische Dateien haben eine eigene Bremse** — Heute greift die Bremse nur
  auf der Spielverbindung. Wer nur `index.html` millionenfach abruft, wird
  nicht gebremst.
- **AC-12** `offen` **Auffälligkeiten sind sichtbar** — Ausgelöste Grenzen werden gezählt und sind
  abrufbar. Ohne Zahlen merkt niemand, dass gerade jemand klopft.

## Grenzfaelle

- Mehrere Freunde hinter demselben Anschluss teilen sich eine Adresse. Acht
  Verbindungen und drei Partien sind dafür bemessen — bei einer WG mit sechs
  Spielern an einem Anschluss wird es eng. Dann müssen die Werte hoch.
- Ohne Reverse Proxy sieht der Server die echten Adressen. Mit Proxy und ohne
  `HINTER_PROXY=1` sieht er **nur noch den Proxy** — dann greift jede Grenze
  für alle Spieler gemeinsam. Beides ist falsch konfiguriert schlimmer als gar
  nicht.
