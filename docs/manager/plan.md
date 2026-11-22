# Das Managerspiel: Befund und Ausbauplan

**Stand:** 2026-11-22 · **Status:** Vorschlag, vom Benutzer noch nicht
freigegeben · **Geschrieben für:** die Sitzung, die es umsetzt (Opus in
Claude Code, in diesem Repository, Runde für Runde nach
[`/manager-weiterbauen`](../../.claude/skills/manager-weiterbauen/SKILL.md)).

Dazu gehören: der Vorschlag [ADR-0018](../adr/0018-manager-ausbau.md) (welche
Zeilen aus „Was es ausdrücklich nicht wird" fallen), der
[Steuerstand](steuerstand.md) (wo die Arbeit steht) und der
[Entwurf des Spieltags](entwurf/spieltag.html) (wie es aussehen soll).

**Wie diese Datei gelesen wird:** Abschnitt 1 sagt, was fehlt und woran man es
sieht. Abschnitt 3 nennt, was der Benutzer entscheiden muss — **ohne diese
Entscheidungen wird nur Stufe M0 gebaut**, sie ändert kein Verhalten und
keinen Umfang. Abschnitt 4 ist M0. Abschnitt 5 sind die Stufen M1 bis M7 mit
Modell, Kriterien und Messung. Die Kriterien hier sind **Kandidaten**: in die
Specs kommen sie erst in der Spec-Runde ihrer Stufe, mit der dann nächsten
freien Nummer.

---

## 1. Befund

Das Managerspiel ist **vollständig und richtig, aber es ist eine
Tabellenkalkulation mit einem Weiter-Knopf**. 150 von 156 Kriterien sind
fertig, die Zahlen stimmen (3,10 Tore je Spiel, 48 % Heimsiege, 21 %
Unentschieden, null Widersprüche über sechs Saisons), eine Saison rechnet in
400 ms. Was fehlt, ist kein Kriterium, das auf `offen` steht — es ist das,
weswegen man das Vorbild gespielt hat.

| # | Was fehlt | Woran man es sieht |
| - | --------- | ------------------ |
| 1 | **Der Spieler ist eine Zahl.** | `kader.js`: Stärke, Talent, Kondition, Moral, Alter, Position. Kein Merkmal, das zwei Stürmer mit 74 unterscheidet. Das Talent steht offen in jeder Liste — der Markt ist ein Sortieren nach `talent − staerke`, Sichten gibt es nicht. |
| 2 | **Das Spiel ist ein Ergebnis, kein Ereignis.** | `begegnung()` rechnet 90 Minuten in einem Aufruf; der Ticker (oberflaeche AC-4) spielt ab, was feststeht, und zeigt nur Tore, Karten, Wechsel. Der Mensch kann nichts tun, während es läuft — die Wechselregel entscheidet für ihn. |
| 3 | **Die Woche hat keine Entscheidung.** | Zwischen zwei Spielen gibt es genau einen Knopf. Training ist ein Regler und ein Schwerpunkt; das Postfach berichtet, es fragt nie. |
| 4 | **Der Verein hat kein Gesicht.** | Keine Farben, kein Wappen, kein Rivale, keine Fans, keine Zeitung. Name und Zahlen — ein Verein ist vom anderen nur durch die Stärke zu unterscheiden. Teils mit Absicht gestrichen (`spielziel.md`, „Kein Presseteil"). |
| 5 | **Die Oberfläche ist ein dunkles Formular.** | Acht Blätter aus `innerHTML`, überall dieselbe Tabelle (`qa/bildnachweise/15-manager/`). Auf dem Bildschirm steht „Verlaengern" und „fuer dich" — die Regel aus `CLAUDE.md` gilt hier nicht, weil `tests/waechter-umlaute.test.mjs` das Managerspiel ausnimmt („ruht"). |
| 6 | **Mehrere Menschen — der Grund, warum es in diesem Projekt liegt — sind nicht gebaut.** | manager AC-1, AC-2, karriere AC-16 `offen`. [ADR-0008](../adr/0008-zweites-spiel-manager.md) nennt genau das als das Neue. |
| 7 | **Über Jahre trägt nur der Vorstand.** | Keine Rekorde, keine Auszeichnungen, keine Laufbahn des Managers; Stadion in drei Schritten. Nach der dritten Saison wiederholt sich alles. |
| 8 | **Der Bau lässt 1 bis 7 nicht zu.** | `karriere.js` (1474 Zeilen) hält den einen Menschen als Felder des Spielstands (`vereinId`, `vorstand`, `nachrichten`, `angebote`, `buch`, …). Das Spiel lässt sich nicht anhalten. Ein Kauf wirkt sofort — zwei Menschen können nicht auf denselben Spieler bieten. `public/manager.js` (1523 Zeilen) rechnet `form()` und `eignung()` ein zweites Mal im Browser. Kein `// @ts-check`. |

**Was daran gut ist und bleibt:** die Rechnung des Spiels (Mittelfeld teilt
die Chancen, Angriff gegen Abwehr entscheidet), `WIRKUNG` als eine Stelle für
die Stellschrauben, der Zufall aus `quelle(startwert, saison, termin, zweck)`,
„gleiche Regeln für alle" (manager AC-13), der Spielstand als Datenwert, und
die Geschwindigkeit. **Nichts davon wird neu geschrieben.**

**Nicht geprüft:** Ich habe das Spiel nicht gespielt, sondern Specs,
Quelltext und die Bildnachweise gelesen. Ob es sich so dünn anfühlt, wie es
sich liest, weiß nur, wer drei Saisons durchklickt — der Befund 1 bis 4 und 7
ist ein Urteil aus dem, was es nicht gibt, keine Messung.

## 2. Richtung

> **Aus jeder Zahl wird jemand, aus jedem Termin eine Entscheidung, aus jedem
> Spiel neunzig Minuten, die man verlieren kann — und am Ende sitzen fünf an
> einem Abend in derselben Liga.**

Fünf Leitsätze, an denen jeder Vorschlag in dieser Datei gemessen ist:

1. **Schnell bleibt schnell.** „Sofort" und Vorspulen bleiben. Alles Neue hat
   eine Vorgabe, die ohne den Menschen entschieden wird (manager AC-3). Wer
   will, spielt eine Saison weiter in zehn Minuten.
2. **Inhalt ist Daten.** Fähigkeiten, Charaktere, Ereignisse, Texte, Gebäude
   stehen als Tabellen da — wie `HAEUSER` im Strategiespiel. Ein neues
   Ereignis ist eine Zeile, kein Zweig im Code. Wirkungen haben **eine** Form
   und werden an **einer** Stelle gelesen.
3. **Der Server schreibt die Sätze und kennt die Geheimnisse.** Der Browser
   rechnet nichts und bekommt nichts, was der Manager nicht wissen soll
   (wahres Talent, Kasse des anderen) — dieselbe Regel wie kampf AC-13.
4. **Keine Einstellung ist immer richtig** (manager AC-15) gilt für alles
   Neue: jede Wahl in einem Ereignis, jede Ansprache, jede Fähigkeit hat einen
   Preis, und er wird gemessen.
5. **Wenig Umfang, viel Wechselwirkung.** Sechzehn Fähigkeiten, die im Spiel
   wirken, statt sechzig Werte je Spieler. Fünf Gebäude statt eines
   Trainerstabs. Die Tabelle „wird nicht" schrumpft um sieben halbe Zeilen,
   nicht um alle.

## 3. Was der Benutzer entscheidet

Bis zur Antwort gilt je Zeile die Empfehlung **als Annahme für die
Reihenfolge, nicht als Freigabe zum Bauen**. Gebaut wird ohne Antwort nur M0.

| # | Frage | Empfehlung | Warum |
| - | ----- | ---------- | ----- |
| E1 | Wird das Managerspiel wieder aufgenommen, und wann? `CLAUDE.md` sagt „ruht"; am Strategiespiel stehen F12, F13 und Stufe G aus. | Ja. M0 sofort auf einem eigenen lokalen Zweig `manager` (berührt nur Dateien des Managerspiels), M1 nach F13. | Zwei Schleifen im selben Zweig stoßen an `CLAUDE.md`, `specs/BOARD.md` und dem Browserlauf zusammen. |
| E2 | Fallen die sieben halben Zeilen aus „Was es ausdrücklich nicht wird"? Einzeln in [ADR-0018](../adr/0018-manager-ausbau.md). | Ja, in der dort genannten schmalen Form. | Genau diese Zeilen sind Befund 2, 3 und 4. Was gestrichen bleibt, steht in Abschnitt 7. |
| E3 | Reihenfolge: mehrere Menschen als **dritte** Stufe (nach Spieltag und Spielern) oder erst am Ende? | Als dritte. | Der ehrlichste Prüfstein ist der Abend zu fünft. Er soll kommen, sobald ein Spiel und ein Kader sich lohnen — und sagen, was von M4 bis M7 wirklich fehlt. |
| E4 | Wie kehrt ein Mitspieler **ohne Konto** an seinen Verein zurück? | Ein **Platzwort**: beim ersten Platznehmen vom Server gewürfelt, im Browser gemerkt, als Rückkehrlink einmal gezeigt. Verloren: der Gastgeber gibt den Platz frei. Wer ein Konto hat, dessen Platz hängt am Konto. | Hält „Eröffnen verlangt ein Konto, Mitspielen nicht". Ein Raumcode ist kein Ausweis ([ADR-0007](../adr/0007-zwei-arten-von-partien.md)), ein Platzwort je Sitz ist einer. |
| E5 | Das Aussehen: der [Entwurf](entwurf/spieltag.html) ist hell, mit den Vereinsfarben als einziger kräftiger Farbe. Alle 141 Bildnachweise ändern sich. | Ja, einmal, in M1. | Sie ändern sich ohnehin (Umlaute, M0). Das dunkle Formular ist Befund 5. |
| E6 | Tonfall: dürfen Ereignisse und Ticker trockenen Witz haben? | Ja — eigene Texte, kein Satz aus einem Vorbild. | Ohne Ton bleibt es eine Tabelle mit Sätzen. |
| E7 | Gesichter und Wappen als **SVG aus Teilen**, im Browser aus der Kennung zusammengesetzt, statt gerendert? [ADR-0016](../adr/0016-gerenderte-bilder.md) verlangt Rendern — für das Strategiespiel. | Ja, SVG. | Sechshundert Spieler, jedes Jahr neue: das ist kein Fall für Blender. Kein Bildgenerator, kein fremdes Material — das bleibt. |

## 4. Was anders gebaut wird — Stufe M0, das Fundament

**Regel der Stufe: kein Verhalten ändert sich.** Dieselben Startwerte ergeben
dieselben Welten, Spiele und Spielstände. Dafür gibt es die Gleichstandsprobe
(M0.2); jeder Schritt danach ist erst fertig, wenn sie hält. Jeder Schritt ist
eine Runde, außer wo es dasteht.

### M0.1 — Die Wächter sehen das Managerspiel

- `public/manager.js`, `public/manager.html` und `server/spiele/manager/*.js`
  in `DATEIEN` von `tests/waechter-umlaute.test.mjs`; den Satz „Das
  Managerspiel ruht" dort streichen. Jeden gemeldeten Text richten
  („Verlängern", „gültiges Gebot", „für dich").
- Tests, die einen Satz des Servers wörtlich prüfen, ziehen mit. Die
  Namenslisten (`ORTE`, `ZUSAETZE`, Spielernamen) **nicht** anfassen — sonst
  heißt dieselbe Welt anders und die Gleichstandsprobe fällt.
- Danach `npm run check:alles:neu` und `npm run qa:abweichung`: jedes Bild des
  Managerspiels ändert sich, und zwar nur in Buchstaben.

### M0.2 — Messstand und Gleichstandsprobe

- `scripts/manager-messen.mjs`, `npm run manager:messen`: N Saisons ohne
  Menschen über K Startwerte (Vorgabe 6 und 3), Ausgabe als Tabelle und mit
  `--json`: Tore je Spiel, Heimsiege, Unentschieden, Favoritenquote, Karten
  und Platzverweise je Spiel, Wechsel, Verletzungen, Stärke der ersten Liga,
  Kadergrößen, Vereinslose, Konten (kleinstes, mittleres, größtes),
  Rechenzeit je Saison, Größe des Spielstands. Das sind die Zahlen, die heute
  als Kursivsatz in zwölf Specs stehen — **ab jetzt kommt jede von dort**.
- `tests/manager-gleichstand.test.mjs`: der Fingerabdruck (SHA-256 über
  `sichern()`, Schlüssel sortiert) nach zwei Saisons ohne Menschen und nach
  einer halben mit einem Menschen, der nichts tut, für drei Startwerte; die
  Werte stehen in der Testdatei. `npm run manager:gleichstand -- --neu`
  schreibt sie neu.
- **Ab M1 gilt:** ändert eine Runde das Verhalten mit Absicht, erneuert sie
  den Fingerabdruck im selben Commit und nennt in der Commit-Nachricht, was
  sich geändert hat und was `manager:messen` vorher und nachher sagt. Fällt
  er ohne Absicht, ist das der Fehler der Runde.

### M0.3 — `karriere.js` in vier Dateien (reines Verschieben)

| Datei | Inhalt (heute alles in `karriere.js`) |
| ----- | ------------------------------------- |
| `welt.js` | der Zustand, `neu()`, `sichern()`, `laden()`, `anheben()`, `buchen()`, `melden()` |
| `ablauf.js` | `weiter()`, `vorspulen()`, `vorbereitung()`, `winterpause()`, `ligaspieltag()`, `pokalrunde()`, `spielen()`, `kiTaktik()`, `saisonWechsel()` |
| `zuege.js` | alles, was ein Manager befiehlt: `taktikSetzen`, `aufstellen`, `kaufen`, `verlaengern`, … |
| `sicht.js` | was ein Manager sieht: `zustand()`, `vorschau()`, `spielerZeigen()`, `vereinAnsicht()` |

`karriere.js` bleibt als dünne Klasse, die die vier zusammensetzt — Tests und
`netz.js` holen weiter `Karriere`. Keine Zeile Logik ändert sich; die
Gleichstandsprobe hält.

### M0.4 — Die Welt und ihre Manager (Fassung 4) · zwei Runden

Heute gehört der eine Mensch zum Spielstand. Danach:

```js
// Fassung 4 - die Welt gehoert niemandem, die Manager sind eine Liste
{
  fassung: 4, startwert, saison, termin, termine, vereine, freie, ligen, pokal,
  chronik, ticker,
  manager: [
    { id: 'm1', name, kontoId,          // kontoId null: Mitspieler ohne Konto (M3)
      vereinId, status, vorstand, stellen,
      nachrichten, angebote, sponsorAngebote,
      buch, kasse, vorjahr, entwicklungen, zuletzt,
      bereit: false },
  ],
}
```

- `anheben()` hebt Fassung 3: die Felder des einen Menschen wandern in
  `manager[0]`. `LADBARE_FASSUNGEN = [2, 3, 4]`.
- **Jeder Zug nimmt eine `managerId`**, `zustand(managerId)` ist die Sicht
  dieses Managers, `melden()` und `buchen()` gehen an den Manager des
  betroffenen Vereins, `kiAngebote()` läuft über alle Manager.
- `netz.js` reicht `manager[0].id` durch — nach außen ändert sich nichts.
- Neuer Wächter `tests/waechter-manager-mehrzahl.test.mjs`: unter
  `server/spiele/manager/` gibt es kein `this.vereinId`, kein `welt.mensch`
  und kein Feld des Spielstands, das nur einem Menschen gehört. **Damit ist
  alles, was ab M1 gebaut wird, für mehrere Menschen gebaut**, auch wenn erst
  M3 sie hereinlässt.
- Die Gleichstandsprobe vergleicht ab hier Fassung 4; gezeigt wird einmal,
  dass ein angehobener Stand der Fassung 3 dieselbe Fortsetzung ergibt wie
  vorher (wie karriere AC-28).

### M0.5 — Das Spiel lässt sich anhalten

```js
const spiel = anpfiff(heim, gast, zufall, einstellungen); // ein Datenwert, nichts gerechnet
spielen(spiel, bisMinute);        // rechnet die Abschnitte bis dahin, haengt Ereignisse an
eingreifen(spiel, seite, { wechsel, taktik });   // wirkt ab dem naechsten Abschnitt
const ergebnis = abpfiff(spiel);  // dieselbe Form wie heute von begegnung()

// und begegnung() bleibt, was sie ist:
const begegnung = (h, g, z, e) => abpfiff(spielen(anpfiff(h, g, z, e), 90));
```

- Der Zufall wird ein Wert mit sichtbarem Stand (`{ a }` statt der
  Abschlussvariablen in `zufallAus`), damit ein laufendes Spiel in den
  Spielstand passt und einen Neustart überlebt. **Dieselbe Folge** — die
  Gleichstandsprobe hält.
- spieltag AC-16 bleibt wahr: `anpfiff`, `spielen`, `abpfiff` lesen die
  Vereine nur. Verlängerung und Elfmeterschießen (Pokal) hängen an `spielen`.
- `eingreifen` gibt es in M0 nur als Funktion mit Test; eine Bedienung
  bekommt es in M1.

### M0.6 — Typen und Daten

- `server/spiele/manager/daten.js`: die Formen als `@typedef` (`Spieler`,
  `Verein`, `Manager`, `Taktik`, `Spiel`, `Szene`) und jede **neue** Tabelle
  ab M1. Bestehende Tabellen bleiben, wo sie sind (`WIRKUNG` in `spieltag.js`
  — `CLAUDE.md` verweist darauf).
- `// @ts-check` Datei für Datei; in `tests/waechter-typen.test.mjs` fällt die
  Ausnahme für `server/spiele/manager/`, was noch fehlt, steht mit Grund unter
  `OFFEN`. Reihenfolge: `zufall`, `kalender`, `liga`, `pokal`, `spieltag`,
  `kader`, dann der Rest.

### M0.7 — Der Browser zeigt, er rechnet nicht · zwei Runden

- `public/manager.js` wird `public/manager/`: `kern.js` (Zustand, Anfragen,
  Blattwechsel, Tasten), `teile.js` (Spielerzeile, Betrag, Balken, Tabelle),
  je Blatt ein Modul. Eingebunden wie `app.js`: `<script type="module">`.
- `form()` und `eignung()` im Browser fallen weg: der Server schickt, was
  gezeigt wird (`sicht.js`). Gemessen wird dabei, wie groß die Antwort eines
  Zugs ist — heute der ganze Zustand samt Eignungstabelle nach jedem Klick.
- `// @ts-check` in den neuen Modulen, `manager.js` fällt aus `OFFEN`.
- Das Aussehen bleibt in M0, wie es ist. Der Umbau der Oberfläche ist M1.

**M0 ist erreicht**, wenn: Gleichstandsprobe grün, `npm run check:alles`
grün, kein Wächter nimmt das Managerspiel mehr aus, und `npm run
manager:messen` gibt die Zahlen der Specs wieder.

---

## 5. Was gebaut wird

Jede Stufe beginnt mit einer **Spec-Runde** (nur Specs: Kriterien, Bauabfolge
in `specs/15-manager/ausbau.md`, Kürzel `ausbau`) und endet mit einem
Kriterium „am Stück im Browser" wie fahrplan AC-3 und einer **Rückschau**.
Die Tabellen nennen Kandidaten: Spec, Kurztitel (höchstens fünf Wörter), was
verlangt ist. „Bild" heißt Browsertest mit `nachweis()`, „ohne" ein Eintrag
in `qa/ohne-bild.json`.

### M1 — Der Spieltag ist ein Ereignis

**Ziel:** Das eigene Spiel läuft, man sieht, was passiert, und kann
eingreifen. Wer nicht will, drückt „Sofort" und hat, was er heute hat.

**Modell.**

- **Szenen.** Jede Chance, die `abschnitt()` heute nur zählt, wird eine Szene:

  ```js
  { minute: 58, seite: 'heim', art: 'konter', zone: 3,
    beteiligte: { abschluss: 412, vorlage: 398, torwart: 77 },
    ausgang: 'gehalten',            // tor · gehalten · vorbei · pfosten · geblockt · abseits
    satz: 'Brandt läuft allein auf Okafor zu — und schiebt ihm den Ball in die Arme.' }
  ```

  Arten: `konter`, `flanke`, `steilpass`, `fernschuss`, `ecke`, `freistoss`,
  `elfmeter`, `einzelaktion`, `abstauber`. Dazu Szenen ohne Chance (Foul,
  Karte, Verletzung, Wechsel), die es als Ereignis schon gibt.
- **In M1 ist die Szene Kleidung, keine Rechnung.** Tor oder nicht
  entscheidet die Rechnung von heute; Art, Zone, Ausgang des Fehlschusses und
  Satz werden **danach** aus einer eigenen Quelle gezogen
  (`quelle(…, 'szenen')`). Damit ändert M1 kein Ergebnis — der Fingerabdruck
  der Ergebnisse hält, solange niemand eingreift. Erst M2 lässt Fähigkeiten an
  den Gewichten drehen.
- **Texte.** `server/spiele/manager/texte.js`: je Paar aus Art und Ausgang
  mindestens sechs Sätze mit Platzhaltern (`{abschluss}`, `{vorlage}`,
  `{torwart}`, `{verein}`), der Server setzt ein. Kein Satz zweimal in einem
  Spiel. Eigene Texte (E6).
- **Ablauf.** Steht ein eigenes Spiel an, rechnet „Weiter" alle anderen
  Spiele des Termins und pfeift das eigene nur an; es liegt als `spiel` beim
  Manager im Spielstand. Der Browser fragt Stück für Stück:
  `POST …/spiel { bis, eingriff? }` — der Server rechnet bis dorthin und
  schickt die neuen Szenen. Das Tempo bestimmt die Stückgröße: „Normal" und
  „Schnell" fragen in Abschnitten von fünf Minuten und spielen sie in vier
  oder einer Sekunde ab, „Sofort" fragt bis 90. **Der Browser kennt nie mehr
  als das, was er zeigt** — auch nicht im Netzwerkprotokoll.
- **Eingreifen** wirkt ab dem nächsten Abschnitt, und das steht da („wirkt ab
  Minute 60"): drei Wechsel (spieltag AC-12), die vier Regler, das System
  (kostet Eingespieltheit wie immer). „Automatik" lässt die Wechselregel
  wechseln wie heute — Vorgabe an, wer selbst wechselt, schaltet sie ab.
- **Halbzeit** hält an. Die Kabine: eine von drei Ansprachen (ruhig bleiben,
  aufbauen, laut werden), deren Wirkung vom Spielstand und von der Moral
  abhängt — laut bei Rückstand hebt, laut bei Führung drückt; aufbauen hilft
  einer Elf mit schwacher Moral und verpufft bei starker. Stellwerte in
  `WIRKUNG.ansprache`.
- **Die anderen greifen auch ein** (manager AC-13): ab Minute 60 stellt ein
  Verein des Servers bei Rückstand offensiver, bei knapper Führung defensiver.
  Das ändert die Welt — eigene Runde, mit Messung.
- **Im Bild** ([Entwurf](entwurf/spieltag.html)): oben die Anzeigetafel in
  den Farben der zwei Vereine, darunter der Spielverlauf als Band aus 18
  Abschnitten (wem der Abschnitt gehörte — der Mittelfeldanteil, den die
  Rechnung ohnehin hat), links der Ticker als Hauptsache, rechts das
  Spielfeld als Schema mit der Zone der laufenden Szene und die Bank. **Kein
  2D-Spiel**, keine laufenden Figuren.
- **Die Oberfläche bekommt hier ihr neues Kleid** (E5): Farbwerte und Schrift
  als Marken in `manager.css`, die Vereinsfarben als `--verein-1`,
  `--verein-2` (bis M5 aus der Vereinskennung gewürfelt). Erst der Spieltag,
  dann je Runde ein bis zwei Blätter.

| Spec | Kurztitel | Verlangt | Nachweis |
| ---- | --------- | -------- | -------- |
| spieltag | Jede Chance ist eine Szene | Art, Zone, Beteiligte, Ausgang; Beteiligte standen auf dem Platz (wie AC-17) | ohne |
| spieltag | Szenen ändern kein Ergebnis | Mit und ohne Szenen dasselbe Ergebnis über 2.000 Spiele | ohne |
| spieltag | Der Server schreibt die Sätze | Je Art und Ausgang sechs Sätze, kein Platzhalter bleibt stehen, keiner doppelt im Spiel | ohne |
| spieltag | Ein Spiel hält an | `spielen(spiel, 45)` und später bis 90 ergibt dasselbe wie am Stück; überlebt `sichern()` und `laden()` | ohne |
| spieltag | Eingreifen wirkt ab dann | Wechsel und Regler gelten ab dem nächsten Abschnitt, nie rückwirkend; mehr als drei Wechsel weist der Server ab | ohne |
| spieltag | Die Kabine wirkt verschieden | Keine Ansprache ist in jeder Lage die beste (gemessen je Lage über 1.500 Spiele) | ohne |
| spieltag | Auch die anderen stellen um | Vereine des Servers reagieren ab Minute 60 auf den Spielstand; Tore je Spiel bleiben zwischen 2,7 und 3,5 | ohne |
| karriere | Das eigene Spiel wartet | „Weiter" vor einem eigenen Spiel pfeift es an; die übrigen Ergebnisse stehen | Bild |
| karriere | Vorspulen spielt mit Automatik | Vorgespult ist dasselbe wie heute; Fingerabdruck hält | ohne |
| karriere | Der Browser weiß nichts voraus | Keine Antwort enthält eine Szene nach der gefragten Minute | ohne |
| oberflaeche | Das Spiel läuft im Bild | Anzeigetafel, Uhr, Ticker mit Szenen, Verlaufsband; Tempo Normal, Schnell, Sofort, Pause | Bild |
| oberflaeche | Wechseln im laufenden Spiel | Ein Klick auf Bank und Platz, mit „wirkt ab Minute …" | Bild |
| oberflaeche | Die Halbzeit hält an | Kabine mit drei Ansprachen und der Statistik der ersten Hälfte | Bild |
| oberflaeche | Der Verein färbt die Seite | Kopf und Betonung in den Farben des eigenen Vereins, lesbar bei jeder Farbe (Kontrast gemessen) | Bild |
| ausbau | Stufe M1 am Stück | Ein Spiel im Browser: anpfeifen, zur Halbzeit wechseln und ansprechen, Abpfiff, Bericht | Bild |

**Messen:** Ergebnisse ohne Eingriff unverändert. Ein Spiel dauert bei
„Normal" rund 90 Sekunden, bei „Schnell" rund 25. Was ein Eingriff bringt:
bei 0:1 in Minute 60 auf Offensiv — Anteil Ausgleich und Anteil 0:2, gegen
nichts tun. **Ein Mensch, der gut eingreift, darf über eine Saison höchstens
drei bis fünf Punkte mehr holen als die Automatik** — sonst ist „Sofort"
eine Strafe, und Leitsatz 1 fällt.

**Ablösen:** oberflaeche AC-4 (Ticker läuft, Ergebnis steht) wird
`zurueckgestellt (abgelöst durch …)`, sobald der Nachfolger steht — nicht in
der Spec-Runde.

### M2 — Spieler mit Gesicht

**Ziel:** Zwei Spieler mit derselben Stärke sind verschieden, und wer sie
kauft, weiß nicht alles.

**Modell.**

- **Die Stärke bleibt die eine Zahl.** Dazu je Spieler:

  ```js
  faehigkeiten: ['kopfball', 'freistoss'],   // 0 bis 2, selten 3
  charakter: 'heisssporn',                   // genau einer
  form: 1,                                   // -3 bis +3, aus den letzten Noten
  ```

- `FAEHIGKEITEN` in `daten.js`, sechzehn zu Beginn: Kopfballstark,
  Freistoßschütze, Elfmeterschütze, Elfmetertöter, Dribbler, Spielmacher,
  Zweikämpfer, Schnell, Ausdauernd, Führungsspieler, Joker, Distanzschütze,
  Flankengeber, Abstauber, Strafraumbeherrscher, Vielseitig. Jede ist eine
  Zeile mit Wirkungen in einer Form:

  ```js
  kopfball: { name: 'Kopfballstark', fuer: ['IV', 'ST'],
    wirkung: [{ wann: { szene: 'ecke' }, wert: 'abschluss', mal: 1.3 },
              { wann: { szene: 'flanke' }, wert: 'abschluss', mal: 1.2 }] },
  joker:    { name: 'Joker',
    wirkung: [{ wann: { eingewechselt: true }, wert: 'tagesform', mal: 1.08 }] },
  ```

  Gelesen nur über `wirkungen(spieler, lage)` in einer Datei — der Wächter
  `tests/waechter-manager-wirkungen.test.mjs` verbietet jeden Vergleich mit
  dem Namen einer Fähigkeit außerhalb davon (wie `waechter-feindlich`).
- **Jetzt rechnen die Szenen mit:** die Art der Szene wird **vor** dem
  Ausgang gezogen, gewichtet nach Taktik und nach den Fähigkeiten auf dem
  Platz; der Abschluss rechnet mit der Wirkung. Die Summe bleibt: `verwertung`
  in `WIRKUNG` wird so nachgestellt, dass Tore je Spiel und Favoritenquote
  stehen bleiben.
- `CHARAKTERE`, acht: Profi, Heißsporn, Sensibel, Söldner, Vereinstreu,
  Anführer, Trainingsfleißig, Lebemann. Wirken auf Moralschwankung, Karten,
  Gehaltsforderung und Wechselbereitschaft, Entwicklung, und (M4) auf
  Ereignisse.
- **Form:** aus den Noten der letzten fünf Spiele, je Stufe ein Prozent
  Tagesform. Klein mit Absicht — sie soll in der Aufstellung eine Frage
  stellen, nicht die Stärke ersetzen.
- **Das Talent ist verdeckt.** Der Browser bekommt `talent: [von, bis]`. Die
  Breite hängt daran, wie gut der Manager den Spieler kennt: eigener Spieler
  nach einer Saison ±1, neu im Verein ±4, fremd ±10, gesichtet schmaler (M6).
  Der Charakter eines Fremden ist verdeckt, seine Fähigkeiten sind sichtbar
  (man sieht sie im Spiel). Die Kenntnis steht je Manager
  (`manager.kenntnis[spielerId]`), der wahre Wert verlässt den Server nie.
- **Schützen bestimmen:** Elfmeter, Freistoß, Ecken, Kapitän — vier Plätze in
  der Aufstellung, Vorgabe der Server (der Beste dafür). Keine
  Standardvarianten.
- **Gesicht:** ein Bild aus Teilen (Kopfform, Haar, Bart, Hautton, Trikot in
  Vereinsfarben), aus der Spielerkennung bestimmt, als SVG im Browser
  zusammengesetzt (E7). Altert mit: graues Haar ab 33.
- **Marktwert und Gehalt** rechnen Fähigkeiten ein; die Vereine des Servers
  stellen nach Fähigkeiten auf und kaufen danach.
- Fassung 5: `anheben()` zieht Fähigkeiten und Charakter aus der Kennung des
  Spielers — derselbe alte Stand ergibt immer dieselben.

| Spec | Kurztitel | Verlangt | Nachweis |
| ---- | --------- | -------- | -------- |
| kader | Spieler haben Fähigkeiten | Null bis zwei je Spieler, passend zur Position, aus dem Startwert | ohne |
| kader | Jede Fähigkeit wirkt messbar | Je Fähigkeit eine Messung mit und ohne (wie spielziel AC-26 im Strategiespiel) | ohne |
| kader | Fähigkeiten nur über Wirkungen | Wächter: kein Vergleich mit einem Fähigkeitsnamen außerhalb von `wirkungen()` | ohne |
| kader | Jeder hat einen Charakter | Acht Charaktere, jeder mit gemessener Wirkung | ohne |
| kader | Die Form schwankt | Aus den letzten fünf Noten, höchstens ±3 % Tagesform | ohne |
| kader | Das Talent ist verdeckt | Keine Antwort an den Browser enthält das wahre Talent; die Spanne enthält es immer | ohne |
| kader | Wer kennt, sieht genauer | Die Spanne schrumpft mit Saisons im eigenen Verein | Bild |
| spieltag | Fähigkeiten formen die Szenen | Kopfballstarke treffen nach Ecken öfter, Freistoßschützen aus Freistößen; Tore je Spiel bleiben 2,7 bis 3,5 | ohne |
| aufstellung | Schützen lassen sich bestimmen | Elfmeter, Freistoß, Ecken, Kapitän; ohne Wahl der Beste | Bild |
| transfer | Fähigkeiten haben einen Preis | Marktwert und Forderung steigen mit Fähigkeiten; die Vereine des Servers zahlen ihn | ohne |
| oberflaeche | Ein Gesicht je Spieler | Aus der Kennung, überall dasselbe, zwei beliebige Spieler unterscheidbar | Bild |
| oberflaeche | Die Akte zeigt den Menschen | Gesicht, Fähigkeiten, Charakter (wenn bekannt), Formkurve, Laufbahn | Bild |
| karriere | Fassung 4 wird angehoben | Ein alter Stand lädt, jeder Spieler bekommt seine Merkmale, immer dieselben | ohne |
| ausbau | Stufe M2 am Stück | Im Browser: zwei gleich starke Stürmer vergleichen, einen wegen seiner Fähigkeit aufstellen, er trifft nach einer Ecke | Bild |

**Messen:** `manager:messen` vor und nach jeder Runde. Über 2.000 Spiele:
eine Elf mit elf passenden Fähigkeiten schlägt dieselbe Elf ohne in höchstens
58 % — eine Fähigkeit ist rund zwei Punkte Stärke wert, nicht zehn.

### M3 — Mehrere Manager, eine Welt

**Ziel:** manager AC-1, AC-2, karriere AC-16. Zwei bis sechs Menschen, eine
Saison an einem Abend.

**Vorher ein ADR** (0019, in der Spec-Runde): der Weg der Nachrichten.
Empfehlung: **das Managerspiel zieht ganz auf den Weg der Räume** — ein
Spielstand wird für eine Sitzung in einen Raum geladen
([ADR-0007](../adr/0007-zwei-arten-von-partien.md) sagt genau das), allein
ist ein Raum mit einem. Ein Weg zu prüfen statt zwei; die Schnittstelle aus
ADR-0006 (`aufbau`, `befehl`, `zustand`, `sichern`, `laden`) wird dabei zum
ersten Mal von zwei Spielen getragen. Der Steckbrief sagt
`spieler: { von: 1, bis: 6 }`.

**Modell.**

- **Die Liga gehört dem, der sie eröffnet** (Konto). Für eine Sitzung öffnet
  er sie; die anderen kommen mit Raumcode und Namen. Wer zum ersten Mal kommt,
  nimmt einen freien Verein und bekommt sein Platzwort (E4); wer wiederkommt,
  sitzt wieder auf seinem Platz.
- **Der Termin wartet auf alle:** jeder meldet „bereit"; sind alle bereit
  oder ist die Frist um (Einstellung: 60, 90, 120 Sekunden oder keine), wird
  gerechnet. Wer nichts tut, spielt mit Vorgaben (manager AC-3).
- **Die Spiele laufen für alle zugleich**, auf der Uhr des Servers, im Tempo
  der Einstellung. Oben die Konferenz: die Stände der anderen Menschen.
  Eingreifen wie in M1; spielen zwei Menschen gegeneinander, greifen beide
  ein. Die Halbzeit dauert für alle gleich lang (30 Sekunden, oder bis alle
  bereit sind).
- **Jeder sieht nur das Seine:** Kasse, Postfach, Talentspannen, Angebote —
  `zustand(managerId)`, geprüft wie kampf AC-13.
- **Transfers lösen am Termin auf.** Ein Gebot ist ab hier eine Absicht, kein
  Vollzug: der Server sammelt bis zum Termin und entscheidet dann — bieten
  zwei auf denselben Spieler, wählt der Spieler (Gehalt, Liga, Ruf des
  Vereins). Ein Gebot an einen Menschen liegt in dessen Postfach und gilt zwei
  Termine. Vereinslose ebenso. Das ist ein Umbau von `kaufen` für alle, auch
  allein — **die erste Runde der Stufe**.
- **Wer fehlt:** der Gastgeber sagt beim Öffnen, wer dabei ist. Der Verein
  eines Fehlenden spielt mit Vorgaben, gibt niemanden ab und nimmt kein
  Angebot an.
- **Aussteigen und Entlassung:** wer entlassen wird, wählt eine Stelle wie
  heute; ein verlassener Verein fällt an den Server.

| Spec | Kurztitel | Verlangt | Nachweis |
| ---- | --------- | -------- | -------- |
| transfer | Gebote lösen am Termin auf | Kein Wechsel zwischen zwei Terminen; die Reihenfolge der Gebote entscheidet nichts | ohne |
| transfer | Zwei bieten, einer bekommt | Der Spieler wählt nach Gehalt, Liga und Ruf; der andere erfährt es im Postfach | Bild |
| manager | Mehrere Manager, eine Welt (AC-1) | Zwei bis sechs Menschen, je ein Verein | Bild |
| manager | Der Termin wartet auf alle (AC-2) | Gerechnet wird, wenn alle bereit sind oder die Frist um ist | Bild |
| manager | Jeder sieht nur das Seine | Kein Zustand an A enthält Kasse, Postfach oder Spannen von B | ohne |
| manager | Wer fehlt, verliert nichts | Der Verein eines Fehlenden spielt mit Vorgaben und gibt niemanden ab | ohne |
| karriere | Mehrere Menschen in einer Welt (AC-16) | Wie oben, über den Weg der Räume | ohne |
| karriere | Mitspieler kehrt ohne Konto zurück | Das Platzwort führt an denselben Verein; ohne es nicht | Bild |
| karriere | Der Gastgeber gibt Plätze frei | Ein verlorener Platz wird frei, sein Verein bleibt, wie er war | Bild |
| spieltag | Zwei Menschen, ein Spiel | Beide greifen ein, beide sehen dieselben Szenen zur selben Minute | Bild |
| oberflaeche | Die Konferenz steht oben | Die Stände der anderen Menschen während des eigenen Spiels | Bild |
| oberflaeche | Wer bereit ist, steht da | Je Mensch bereit oder nicht, dazu die Uhr der Frist | Bild |
| ausbau | Stufe M3 am Stück | Drei Fenster, drei Vereine, ein Spieltag mit einem Spiel gegeneinander und einem doppelten Gebot | Bild |

**Messen:** Eine Saison zu fünft dauert mit Frist 90 Sekunden und Tempo
„Schnell" unter zweieinhalb Stunden (42 Termine, davon 39 mit Spiel). Der
Server hält fünf Ligen zu je fünf Menschen ohne spürbare Last —
`manager:messen` bekommt dafür eine Zeile. Und dann **der Abend zu fünft**:
was dort fehlt, ordnet M4 bis M7 neu.

### M4 — Die Woche hat Entscheidungen

**Ziel:** Zwischen zwei Spielen fragt das Spiel etwas — selten genug, dass
es nicht aufhält.

**Modell.**

- `EREIGNISSE` in `ereignisse.js`, vierzig zu Beginn, in fünf Gruppen
  (Kabine, Privatleben, Fans und Zeitung, Geld, Vorstand und Stadt):

  ```js
  { id: 'disco', gruppe: 'privat', gewicht: 2,
    wenn: { charakter: 'lebemann', phase: 'saison', vorSpiel: true },
    titel: 'Nachts um drei',
    text: '{spieler} wurde vor dem Spiel gegen {gegner} im „Kakadu“ gesehen. Die Zeitung fragt schon.',
    wahl: [
      { text: 'Geldstrafe und auf die Bank', vorgabe: true,
        wirkung: [{ wer: 'spieler', wert: 'moral', plus: -12 }, { wer: 'kader', wert: 'moral', plus: 2 },
                  { wer: 'spieler', sperreIntern: 1 }] },
      { text: 'Unter vier Augen klären',
        wirkung: [{ wer: 'spieler', wert: 'moral', plus: 4 }, { wer: 'kader', wert: 'moral', plus: -3 }] },
      { text: 'Lachen und aufstellen',
        wirkung: [{ wer: 'spieler', wert: 'kondition', plus: -15 }, { wert: 'vertrauen', plus: -2 }] },
    ] }
  ```

  Bedingungen und Wirkungen sind Daten in je einer Form, gelesen an je einer
  Stelle. Ein Ereignis ist eine Zeile; der Test liest die ganze Tabelle.
- **Höchstens eines je Termin, im Schnitt alle zweieinhalb Termine.** Es
  liegt im Postfach und hält „Weiter" nicht auf: wer weiterklickt, nimmt die
  Vorgabe. Beim Vorspulen und für Fehlende ebenso.
- **Gleiche Regeln für alle:** die Vereine des Servers ziehen dieselben
  Ereignisse und nehmen die Vorgabe. Der Erwartungswert der Vorgabe ist null.
- **Sondertraining:** bis zu drei Spieler bekommen ein Ziel — eine Fähigkeit
  lernen (zwölf Wochen, gelingt nach Alter und Talent), eine zweite Position,
  oder Kondition. Der Regler und der Schwerpunkt bleiben.
- **Trainingslager** in Vorbereitung und Winterpause: eines von dreien
  (Kondition, Einspielen, Zusammenhalt), gegen Geld.

| Spec | Kurztitel | Verlangt | Nachweis |
| ---- | --------- | -------- | -------- |
| ereignisse | Ein Ereignis ist Daten | Jede Zeile hat Bedingung, Text, zwei bis drei Wahlen, genau eine Vorgabe; die Tabelle lädt | ohne |
| ereignisse | Keine Wahl ist geschenkt | Jede Wahl hat einen Gewinn und einen Preis, oder das Ereignis ist als reiner Text markiert | ohne |
| ereignisse | Höchstens eines je Termin | Im Schnitt alle zwei bis drei Termine, nie zwei, keines zweimal in einer Saison | ohne |
| ereignisse | Wer nicht antwortet, nimmt die Vorgabe | „Weiter" und Vorspulen halten nicht an | ohne |
| ereignisse | Die Vorgabe ist neutral | Über sechs Saisons ändern Ereignisse die Punkte eines Vereins im Mittel um weniger als einen | ohne |
| ereignisse | Der Charakter zieht Ereignisse an | Ein Lebemann erlebt andere als ein Profi (gemessen) | ohne |
| oberflaeche | Das Postfach fragt | Ein Ereignis mit Gesicht des Spielers, Text und Wahlen; die Folge steht danach als Satz da | Bild |
| kader | Sondertraining für drei | Ziel je Spieler, Fortschritt sichtbar, gelingt nicht immer | Bild |
| kader | Trainingslager zur Wahl | Eines von dreien, jedes mit gemessener Wirkung und Preis | Bild |
| ausbau | Stufe M4 am Stück | Eine Hinrunde im Browser mit mindestens fünf beantworteten Ereignissen | Bild |

Neue Spec `specs/15-manager/ereignisse.md`, Kürzel `ereignisse`.

### M5 — Der Verein hat ein Gesicht

- **Farben und Wappen:** je Verein zwei Farben und ein Wappen aus Form,
  Muster und Zeichen (SVG aus der Kennung); der Mensch darf beim Übernehmen
  ändern. Stadionname.
- **Der Rivale:** je Verein einer, bei der Erzeugung zugewiesen (gleiche
  Liga zu Beginn, benachbart in `ORTE`). Das Derby: mehr Zuschauer, doppelte
  Moralwirkung, eigene Sätze, der Vorstand merkt es sich.
- **Der Anhang:** Größe (wächst mit Erfolg, träge) und Stimmung; die Stimmung
  bewegt Zuschauer und ein wenig den Heimvorteil.
- **Das Vereinsgelände** statt eines Trainerstabs: fünf Gebäude mit je fünf
  Stufen, Baupreis und Unterhalt — Trainingsplatz (Entwicklung, Einspielen),
  Jugendhaus (Güte der Jugend), Arztzimmer (Dauer der Verletzungen),
  Sichtung (Talentspannen, M6), Geschäftsstelle (Sponsoren). `GELAENDE` in
  `daten.js`, Wirkungen in derselben Form wie überall.
- **Die Zeitung:** je Termin ein Blatt aus Bausteinen — Schlagzeile zum Spiel
  des Tages, das eigene Spiel, Elf des Tages, Gerüchte vom Markt (auch
  falsche), Stimme des Anhangs. Der Server schreibt sie aus `texte.js`. Keine
  Interviews.

| Spec | Kurztitel | Verlangt | Nachweis |
| ---- | --------- | -------- | -------- |
| verein | Farben und Wappen | Aus der Kennung, je zwei Vereine einer Liga unterscheidbar; der Mensch darf ändern | Bild |
| verein | Jeder hat einen Rivalen | Gegenseitig, bleibt über Auf- und Abstieg | ohne |
| verein | Das Derby zählt doppelt | Zuschauer, Moral und Vorstand gemessen gegen ein gewöhnliches Spiel | Bild |
| verein | Der Anhang wächst träge | Größe folgt dem Erfolg über Jahre, Stimmung über Wochen | ohne |
| verein | Fünf Gebäude, fünf Stufen | Jede Stufe mit gemessener Wirkung; keine rechnet sich in unter zwei Saisons | Bild |
| verein | Die Vereine des Servers bauen | Nach denselben Preisen; nach sechs Saisons bleibt die Welt in ihren Bahnen (manager AC-14) | ohne |
| verein | Die Zeitung zum Termin | Aus Bausteinen, keine Schlagzeile zweimal in einer Saison, nichts Falsches außer als Gerücht markiert | Bild |
| ausbau | Stufe M5 am Stück | Im Browser: Verein übernehmen, Farben wählen, ein Gebäude bauen, das Derby spielen, die Zeitung lesen | Bild |

Neue Spec `specs/15-manager/verein.md`, Kürzel `verein`.

### M6 — Der Markt hat Spannung

- **Sichten:** ein Auftrag je Stufe der Sichtung, auf einen Spieler oder auf
  „ein Talent für diese Position bis zu diesem Preis"; nach zwei bis vier
  Terminen ist die Spanne schmal und der Charakter bekannt.
- **Eine Gegenforderung:** der abgebende Verein nimmt an, lehnt ab oder nennt
  **einmal** seinen Preis. Der Spieler nennt Gehalt und Laufzeit und darf
  einen Stammplatz verlangen — die Zusage wird gehalten oder kostet Moral.
- **Leihe** über eine Saison, mit oder ohne Kaufpreis; die Vereine des
  Servers verleihen ihre Jungen.
- **Mitbieter:** auf einen begehrten Spieler bieten Vereine des Servers mit;
  aufgelöst wird am Termin (seit M3).
- **Der letzte Tag** eines Fensters ist lauter: mehr Angebote, mehr Wechsel.

| Spec | Kurztitel | Verlangt | Nachweis |
| ---- | --------- | -------- | -------- |
| transfer | Sichten schärft den Blick | Spanne und Charakter nach dem Auftrag; die Zahl der Aufträge hängt an der Stufe | Bild |
| transfer | Eine Gegenforderung, nicht mehr | Annehmen, ablehnen oder einmal ein Preis; danach ja oder nein | Bild |
| transfer | Zusagen werden gemerkt | Ein versprochener Stammplatz, der nicht kommt, kostet Moral und Verlängerung | ohne |
| transfer | Leihe über eine Saison | Rückkehr zum Saisonende, Gehalt beim Leihenden, Kaufpreis wählbar | Bild |
| transfer | Die anderen bieten mit | Auf Begehrte bieten Vereine des Servers; der Markt bleibt in seinen Bahnen | ohne |
| ausbau | Stufe M6 am Stück | Im Browser: sichten, bieten, Gegenforderung annehmen, einen Jungen verleihen | Bild |

### M7 — Die Jahre zählen

- **Die Laufbahn des Managers:** Stationen, Titel, Siegquote, Ruf. Mit dem
  Ruf kommen Angebote besserer Vereine — nicht erst nach der Entlassung.
- **Die Ruhmeshalle der Welt:** Rekorde (Torjäger aller Zeiten, höchster
  Sieg, längste Serie), je Saison Torschützenkönig, Spieler und Elf der
  Saison, Trainer der Saison; die ewige Tabelle; Legenden je Verein (ab 200
  Spielen).
- **Das Stadion** in fünf Stufen mit Namen statt in drei.

| Spec | Kurztitel | Verlangt | Nachweis |
| ---- | --------- | -------- | -------- |
| karriere | Der Manager hat eine Laufbahn | Stationen, Titel, Quote, Ruf — über Vereinswechsel hinweg | Bild |
| vorstand | Erfolg bringt Angebote | Ab einem Ruf fragen bessere Vereine an; annehmen wechselt den Verein | Bild |
| liga | Auszeichnungen je Saison | Torschützenkönig, Spieler, Elf und Trainer der Saison, nach genannten Regeln | Bild |
| liga | Rekorde und ewige Tabelle | Stehen in der Chronik, der Spielstand bleibt unter 1 MB (karriere AC-12) | Bild |
| kader | Legenden bleiben | Wer 200 Spiele für einen Verein hat, steht nach dem Karriereende in dessen Halle | Bild |
| ausbau | Stufe M7 am Stück | Zehn Saisons vorgespult: Halle, Rekorde und Laufbahn stimmen mit der Chronik überein | Bild |

---

## 6. Reihenfolge und Größe

```
M0 Fundament ──► M1 Spieltag ──► M2 Spieler ──► M3 Mehrere Manager ──► der Abend zu fünft
                                                        │
                                                        └──► M4 Woche · M5 Verein · M6 Markt · M7 Jahre
                                                             (Reihenfolge nach dem Abend neu ansehen)
```

| Stufe | Runden (geschätzt) | Hängt an |
| ----- | ------------------ | -------- |
| M0 Fundament | 9 | nichts — ohne Entscheidung baubar |
| M1 Spieltag | 10 bis 12 | M0.5, E2, E5, E6 |
| M2 Spieler | 9 bis 11 | M1 (Szenen), E7 |
| M3 Mehrere Manager | 10 bis 13 | M0.4, M1, E3, E4, ADR-0019 |
| M4 Woche | 7 bis 9 | M2 (Charakter) |
| M5 Verein | 7 bis 9 | M2 (Wirkungen), E7 |
| M6 Markt | 6 bis 8 | M3 (Auflösung am Termin), M5 (Sichtung) |
| M7 Jahre | 4 bis 6 | nichts Neues |

Die Rundenzahlen sind **geschätzt, nicht gemessen** — aus der Größe
vergleichbarer Schritte am Strategiespiel. Die Stufe mit dem größten Wagnis
ist M3 (neuer Nachrichtenweg, Zeit, mehrere Fenster im Browserlauf); die mit
dem größten Wagnis für die Zahlen ist M2 (jede Fähigkeit dreht an der
Rechnung).

## 7. Was weiter nicht gebaut wird

Jede Zeile bleibt eine Woche, die nicht ausgegeben wird:

| Bleibt gestrichen | Statt dessen |
| ----------------- | ------------ |
| Europapokal, Nationalmannschaft, dritte Liga | zwei Ligen, ein Pokal |
| Spielverlauf in 2D, Videosequenzen, Sprecher | Text, Verlaufsband, Spielfeld als Schema |
| Manndeckung, Laufwege, Standardvarianten | vier Regler und vier Schützen |
| Berater, Handgeld, Poker über Runden | ein Gebot, eine Gegenforderung |
| Trainerstab mit Namen und Werten, Wochenplan | fünf Gebäude, Sondertraining für drei |
| Fanartikel, Verpflegung, Bierpreis, Parkplätze | Anhang als zwei Zahlen |
| Präsidentenwahl, Aufsichtsrat | ein Vorstand |
| Interviews, Pressekonferenzen | eine Zeitung aus Bausteinen |
| Echte Namen, Wappen, Lizenzen; Sätze oder Bilder aus einem Vorbild | alles erfunden und selbst geschrieben |
| Bedienung am Handy | der PC, ab 1366 × 768 |

## 8. Was an diesem Plan nicht geprüft ist

- Das Spiel wurde für den Befund **nicht gespielt** (Abschnitt 1).
- Dass die Szenen in M1 kein Ergebnis ändern, ist ein Entwurf — ob sich die
  eigene Quelle sauber von der Rechnung trennen lässt, zeigt erst
  `abschnitt()` beim Umbau.
- Die Zielzahlen (drei bis fünf Punkte durch Eingreifen, 58 % für elf
  Fähigkeiten, zweieinhalb Stunden je Saison zu fünft) sind **gesetzt, nicht
  gemessen**. Jede steht im Kriterium, bis die erste Messung sie bestätigt
  oder das Kriterium mit einem Satz Begründung neu gefasst wird.
- Die Zugbremse lässt 240 Züge je Minute durch (`zuegeJeMinute` in
  `server/schutz.js`) — achtzehn Anfragen je Spiel passen. Nicht geprüft ist,
  ob das mit fünf Menschen hinter einem Anschluss reicht (M3).
- Die Kürzel `ausbau`, `verein` und `ereignisse` sind in `specs/` frei
  (nachgesehen am 2026-11-22).
- Der Haken `.claude/hooks/steuerstand.mjs` legt nur den Steuerstand des
  Strategiespiels vor. Den des Managerspiels liest die Runde selbst
  (Abschnitt 0 der Arbeitsanweisung), bis jemand den Haken erweitert.
- Der Entwurf des Spieltags ist ein stehendes Bild mit erfundenen Namen. Er
  zeigt Aufteilung, Farben und Schrift, keine Bedienung.
