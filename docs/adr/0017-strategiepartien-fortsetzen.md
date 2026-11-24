# ADR-0017: Eine Strategiepartie lässt sich fortsetzen

**Status:** entschieden (Benutzer, 2026-11-13: „Ja die adr zum speichern und
fortsetzen passt"). Gebaut ist noch nichts davon; gemessen ist, dass es geht
(unten).
**Datum:** 2026-11-13
**Ändert:** [ADR-0012](0012-aoe2-als-vorlage.md), Tabelle „Wird nicht gebaut",
letzte Zeile („Partie am Stück | Speicherstände für Strategiepartien") — die
Zeile wandert von rechts nach links. [ADR-0007](0007-zwei-arten-von-partien.md)
bleibt: der Raum ist flüchtig, der Spielstand dauerhaft; die Strategiepartie
bekommt jetzt einen.

## Frage

Der Benutzer nach zwei Partien am 2026-11-12:

> es muss einen Pauseknopf geben - und ich möchte das Spiel wieder fortsetzen
> können. Also speichern / und laden und pause sollten möglich sein

> Man sollte da irgendwo die Liste der offenen Spiele sehen, und dann auch
> wieder reingehen können, wenns mehrere Live Spieler gibt, gibts nochmal nen
> startklick, bis ausreichend Spieler drinnen sind

Die Pause steht (speichern AC-19 bis AC-21). Offen ist das Fortsetzen — und
das hat ADR-0012 ausdrücklich ausgeschlossen. Der Grund damals: eine Partie
dauert fünfzehn Minuten, und ein Spielstand ist eine Woche Arbeit. Beides
stimmt nicht mehr. Eine Partie gegen die KI dauert 25 bis 55 Spielminuten,
mit Menschen und ohne Zeitgrenze länger (ADR-0013); und was ein Spielstand
kostet, ist unten gemessen.

Es gibt einen zweiten Grund, der mit dem Wunsch nichts zu tun hat: **jedes
Ausrollen beendet heute jede laufende Partie.** Der Server hält sie nur im
Arbeitsspeicher.

## Entscheidung

**1. Fortsetzen, nicht zurückspringen.** Eine Partie hat genau einen Stand:
den letzten. Es gibt kein „Laden" eines früheren Zeitpunkts und keine Liste
von Ständen je Partie. Damit ist ein Spielstand kein Werkzeug, eine verlorene
Schlacht zurückzuholen — auch nicht zu mehreren —, und die Regel „ein Stand
läuft nur einmal" (speichern AC-11) reicht als Schutz.

**2. Gesichert wird von selbst.** Jede laufende Partie, die ein Konto eröffnet
hat, wird einmal je Minute abgelegt, dazu beim Anhalten, wenn der letzte
Mensch geht, und beim geordneten Herunterfahren des Servers. Einen Knopf
„Speichern" gibt es nicht — er verspräche, was Punkt 1 nicht hält. Was es
gibt, ist **„Aufhören und später weiterspielen"** neben Pause und Aufgeben.

**3. Der Stand gehört dem Gastgeber** (speichern AC-23), höchstens fünf je
Konto wie im Managerspiel (ADR-0005). Mitspieler brauchen weiterhin kein
Konto. Eine beendete Partie nimmt ihren Stand mit.

**4. Die Liste steht im Vorraum.** „Deine Partien": was am eigenen Konto
liegt, mit Karte, Spielzeit, Beteiligten und Zeitpunkt. Ein Klick setzt fort.

**5. Fortsetzen öffnet einen neuen Raum** mit neuem Code (ADR-0007).
- **Allein gegen die KI** steht man sofort wieder im Spiel, angehalten, bis
  man „Weiter" drückt.
- **Zu mehreren** öffnet sich der Warteraum mit den Plätzen von damals. Wer
  mit dem Namen von damals beitritt, bekommt seinen Platz zurück. **Der
  Gastgeber drückt Start, sobald genug da sind** — das ist der Startklick aus
  dem Wunsch. Ein Platz, dessen Mensch fehlt, bleibt stehen (speichern
  AC-25); sobald es den Statthalter gibt (ADR-0015), übernimmt der.

**6. „Aufhören" zu mehreren verlangt Einigkeit** (speichern AC-22): alle
Verbundenen stimmen zu, sonst läuft die Partie weiter. Wer einfach geht, ist
gegangen wie bisher; die Partie läuft ohne ihn, und gesichert wird sie
trotzdem.

**7. Ein Stand gilt für die Fassung, die ihn geschrieben hat.** Er trägt eine
Fassungsnummer; eine andere wird abgelehnt, mit einem Satz, der es sagt
(speichern AC-16, AC-17). ~~Hochgezogen wird nicht (AC-18): die Regeln der
Partie ändern sich mit jeder Runde, und eine Partie lebt Tage, nicht Monate.~~
Ein Wächter vergleicht die Form des Stands mit einem eingecheckten Abbild und
verlangt eine neue Nummer, wenn ein Feld dazukommt oder wegfällt.

**Nachtrag 2026-11-24 — ältere Stände werden hochgezogen (AC-18).** Der
Benutzer hat gefragt, ob sich ein Stand nach drei Tagen noch öffnen lässt,
wenn dazwischen ausgerollt wurde; nach Punkt 7 nicht, sobald eine Runde ein
Feld anlegt — und das tut fast jede. Auf den Vorschlag, AC-18 zu bauen:
„Gibts grade noch was zu tun? Dann gerne angehen." Seitdem gilt: zu jeder
alten Fassung n steht in `SCHRITTE[n]` (`server/spiele/strategie/stand.js`)
eine Funktion, die den entpackten Inhalt an Ort und Stelle zur Fassung
n + 1 macht — meist ein neues Feld mit dem Wert, den eine neue Partie
hätte. Lässt sich ein Schritt fachlich nicht gehen (eine Regel, die eine
laufende Partie nicht nachträglich bekommen kann), steht dort ein Satz mit
der ADR, die das entscheidet, und der Stand wird abgelehnt wie bisher. Der
Wächter verlangt zu jeder alten Fassung einen Eintrag und zu jeder Fassung
einen Probestand unter `tests/staende/`, geschrieben vom Code jener Fassung
und nie neu; `tests/strategie-hochziehen.test.mjs` lädt jeden, prüft die
Form und lässt ihn fünf Minuten weiterlaufen. Wer ein Feld anlegt, schreibt
also: `FASSUNG + 1`, `SCHRITTE[alt]`, `npm run stand:abbild -- --schreiben`
— in dieser Reihenfolge, denn der Probestand der alten Fassung muss vor der
Änderung des Codes liegen; für Fassung 1 liegt er.

## Wie die Welt ein Wert wird

Geprüft an einer laufenden Partie (`probe-sichern.cjs`, 2026-11-13, nicht
eingecheckt): **in der Welt und in der KI steht schon heute nichts als
Werte** — Zahlen, Texte, Listen, `Map`, `Set`, Felder aus Bytes. Keine
Klasse, keine Funktion, mit zwei Ausnahmen: der Zufall der Welt und der
Zufall der KI sind Funktionen, die ihren Stand verbergen
(`karten.zufallAus`). Sie bekommen einen Stand, der ein Feld ist.

Daraus folgt die Form:

- **`welt.sichern()` liefert alle eigenen Felder der Welt, `Welt.laden()`
  setzt sie wieder ein.** Abgelegt mit `node:v8` (`serialize`), nicht als
  JSON: das Format kennt `Map`, `Set` und Bytefelder und erhält, dass zwei
  Stellen auf dasselbe Ding zeigen — Verbündete teilen sich ein Sichtfeld
  (`welt.sichten`). Mit JSON müsste jedes der 36 Felder der Welt und der 30
  der KI von Hand hin- und zurückgewandelt werden, und ein vergessenes Feld
  fiele erst auf, wenn eine Partie nach dem Laden anders weiterläuft.
- **Was nur gemerkt ist, wird nicht gesichert:** `werteGemerkt`,
  `wirkungenGemerkt`. Es entsteht beim ersten Lesen neu.
- **Die KI gehört zum Stand.** Der Steckbrief hängt sie an die Welt
  (`mitKi`); er sichert und lädt sie mit. Ohne ihr Gedächtnis (`gesehen`,
  `feindOrt`, `heer`) finge sie nach dem Laden bei null an.
- **Der Raum weiß davon nichts** (ADR-0006): er fragt, ob die Welt
  `sichern` kann und der Steckbrief `laden`, und reicht den Wert an die
  Ablage. Die Ablage ist eine Tabelle in derselben SQLite-Datei wie Konten
  und Managerstände: Kennung, Konto, Spielart, Fassung, Beteiligte,
  Einstellungen, Zeitpunkt, Wert.
- **Die Kamera merkt sich der Browser** je Stand (speichern AC-10), nicht
  der Server.

## Gemessen

Drei Partien KI gegen KI, im Nebel, gesichert mitten im Spiel, geladen, und
dann Original und Kopie je 3000 Takte (fünf Spielminuten) weitergerechnet:

| Startwert | KIs | gesichert bei | Einheiten | Gebäude | roh | gepackt | Sichern | Laden | gleich nach dem Laden | gleich nach 3000 Takten |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 5 | 2 | Minute 10 | 66 | 52 | 227 KB | 17 KB | 0,8 ms | 0,7 ms | ja | ja |
| 7 | 2 | Minute 25 | 97 | 79 | 297 KB | 28 KB | 17 ms | 2 ms | ja | ja |
| 11 | 4 | Minute 20 | 170 | 152 | 687 KB | 51 KB | 4 ms | 3 ms | ja | ja |

„Gleich" heißt: jedes Feld der Welt und jeder KI, verglichen Wert für Wert,
ohne die zwei gemerkten Tabellen. Ein Stand bleibt damit unter 1 MB
(speichern AC-5), gepackt weit darunter, und das Sichern einmal je Minute
kostet weniger als ein Takt.

**Nicht gemessen:** eine Partie mit Menschen (dort hängt nichts anderes an
der Welt, aber es ist nicht geprüft); die größte Karte mit sechs Spielern
spät im Spiel; ob ein Stand einen Wechsel der Node-Fassung übersteht — `v8`
liest ältere Fassungen seines Formats, zugesichert ist es über große Sprünge
nicht. Node 24 ist ohnehin festgelegt (ADR-0003); ein Wechsel wäre ein Grund,
die Fassungsnummer zu erhöhen.

## Was dagegen spricht

- **Das Format ist nicht lesbar.** Ein kaputter Stand lässt sich nicht mit
  dem Auge prüfen. Dafür gibt es den Vergleich Wert für Wert als Test, und
  der vorige Stand bleibt liegen, bis der neue geschrieben ist (speichern
  AC-6).
- **Jede Runde, die ein Feld der Welt ändert, macht alte Stände unladbar.**
  Das ist Punkt 7 und so gewollt; es heißt aber: ein Ausrollen mit neuer
  Fassung beendet die offenen Partien weiterhin. Ein Ausrollen ohne
  Änderung am Stand nicht mehr.
- **Mehr Umfang.** Vier Schritte, geschätzt je eine bis zwei Runden. Ohne
  den vierten ist der häufigste Fall — allein gegen die KI, morgen weiter —
  schon bedient.

## Bauabfolge

| | Was | Kriterien in [Anhalten und Fortsetzen](../../specs/00-plattform/speichern.md) |
| --- | --- | --- |
| S1 | Welt und KI als Wert, Fassung, Wächter über die Form; Test: gleich nach dem Laden, gleich nach 3000 Takten über zwanzig Startwerte | AC-1, AC-2, AC-5, AC-16, AC-17 |
| S2 | Ablage am Konto, von selbst je Minute, beim Anhalten und Herunterfahren; ein kaputter Stand nimmt den vorigen nicht mit | AC-3, AC-4, AC-6, AC-12, AC-13 |
| S3 | „Deine Partien" im Vorraum, Fortsetzen allein gegen die KI, „Aufhören und später weiterspielen" | AC-7 bis AC-11 |
| S4 | Zu mehreren: Warteraum mit den Plätzen von damals, Startklick, stillgelegter Platz, Einigkeit beim Aufhören | AC-14, AC-22 bis AC-26 |

~~AC-18 (ältere Fassungen hochziehen) wird für das Strategiespiel mit einer
Begründung geschlossen, nicht gebaut.~~ AC-18 ist gebaut (Nachtrag zu Punkt
7, 2026-11-24). AC-15 hängt an den Konten.

## Dem Benutzer vorgelegt und so angenommen

1. **Fortsetzen statt zurückspringen** (Punkt 1) — „speichern und laden"
   lässt sich auch als „an einen früheren Punkt zurück" lesen. Entschieden
   ist das Fortsetzen allein; ein Zurück allein gegen die KI ließe sich später
   danebenstellen, zu mehreren nicht.
2. **Kein Knopf „Speichern"** (Punkt 2), dafür „Aufhören und später
   weiterspielen" und das Sichern von selbst.
