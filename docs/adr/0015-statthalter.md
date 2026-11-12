# ADR-0015: Der Statthalter — Teile des eigenen Reichs der KI übergeben, mit Knöpfen

**Status:** entschieden im Grundsatz (Statthalter ja, Knöpfe statt
Sprachmodell, nach Stufe E, Übernahme bei Verbindungsabbruch nach zehn
Sekunden); der Zuschnitt der Bereiche und die Regeln unter „Vorschlag" sind
Startpunkte für die Spec-Runde
**Ändert:** [Räume](../../specs/00-plattform/raeume.md) AC-9 („bleiben seine
Einheiten stehen") — der Text wird in der Spec-Runde nachgezogen
**Datum:** 2026-11-10

## Frage

Kann man im Spiel sagen „greif Thomas an" oder „sorg dafür, dass unsere
Wirtschaft besser läuft", und ein Assistent kümmert sich darum — etwa ein
Sprachmodell (Claude Haiku), das die Ansage versteht?

Geprüft wurde beides, das Sprachmodell und was dahinter stehen müsste:

- **Ein Sprachmodell könnte nur übersetzen, nicht spielen.** Zehn Takte je
  Sekunde bedient kein Modell. Es machte aus einem Satz einen Auftrag
  („Angriff auf Thomas"), und ausführen müsste ihn die KI, die es gibt. Besser
  als sie spielte es nicht.
- **Billig wäre es.** Haiku 5.5 kostet 0,10 $ je Million Tokens hinein und
  0,50 $ heraus (Preisliste vom 2026-10-06). Eine Ansage mit Lagebild und
  Werkzeugliste, geschätzt 3.000 Tokens hinein und 200 heraus, sind rund 0,04
  Cent, hundert Ansagen je Partie etwa 4 Cent. Gerechnet, nicht gemessen; die
  Wartezeit je Ansage ist ebenfalls nicht gemessen.
- **Der schwere Teil ist nicht die Sprache.** Die KI führt heute einen Platz
  ganz oder gar nicht: `Ki.entscheiden()` bildet aus, baut, steigt auf,
  verteilt Sammler, schickt das Heer und verteidigt in einem Zug, und sie
  sitzt nur auf eigenen Plätzen (`mitKi` in `steckbrief.js`). Dass sie für
  einen Menschen einen **Teil** übernimmt, während er selbst klickt, gibt es
  nicht — und das bräuchte das Sprachmodell genauso wie ein Knopf.

Der Benutzer, 2026-11-10: „die Knöpfe reichen vermutlich auch langfristig."

## Entscheidung

**1. Es gibt einen Statthalter: die vorhandene KI, auf dem Platz eines
Menschen, für die Bereiche, die er ihr übergibt.** Keine zweite KI und keine
eigene Logik — was der Statthalter kann, kann er, weil die KI es kann. Wird
die KI besser, wird er es mit.

**2. Bedient wird er mit Knöpfen, nicht mit Sprache.** Ein Sprachmodell wird
nicht gebaut. Es brächte einen fremden Dienst in eine Partie, die heute ohne
einen auskommt — Schlüssel auf dem Server, eine Kostengrenze je Raum, ein
Spiel, das auch ohne Antwort weiterlaufen muss —, und es könnte nichts
ausdrücken, was ein Knopf nicht ausdrückt, weil am Ende derselbe Auftrag
steht. Die Tür bleibt trotzdem offen, ohne dass dafür etwas gebaut wird: weil
die Übergabe eine gewöhnliche Nachricht ist (Punkt 4), wäre eine Sprachschicht
später ein Übersetzer davor und sonst nichts. Sie zu holen ist ein neues ADR.

**3. Er hat genau die Rechte des Spielers.** Die KI handelt heute schon nur
über `welt.nachricht(spielerId, …)` (`Ki.senden`, ki AC-1); der Statthalter
tut dasselbe unter der Id des Menschen. Er bezahlt aus dessen Vorrat, braucht
dessen Wohnraum, und der Server weist ihm ab, was er dem Menschen abweist.

**4. Die Übergabe ist eine Nachricht an die Welt**, kein Zustand im Browser
und nichts, wovon der Raum weiß (ADR-0006). Damit bleibt die Welt aus
Startwert und Nachrichten nachrechenbar, und der Prüfstand kann den
Statthalter ohne Browser prüfen. Der Zustand trägt, was übergeben ist; nach
einer Rückkehr nach Abbruch stehen die Knöpfe so, wie sie standen.

**5. Der Statthalter gibt nie auf und kündigt nie**, solange sein Mensch da
ist. Die KI gibt auf, wenn nichts mehr geht (`aussichtslos`, ki AC-19). Für
einen Menschen entscheidet das der Mensch. Dasselbe gilt für das Lösen eines
Bündnisses.

**6. Er weiß nur, was sein Spieler sieht.** Heute liest die KI die Welt
(`welt.einheiten`), nicht ihr Sichtfeld — bei einem Computergegner ist das
eine bekannte Lücke (ki AC-13, AC-20), bei einem Statthalter wäre es
Schummeln für einen Menschen: sein Heer liefe zum Dorf eines Gegners, den er
nie gesehen hat. **Voraussetzung ist deshalb ki AC-13**, oder der Statthalter
ist bis dahin nur in Partien mit aufgedeckter Sicht erlaubt.

**7. Wer die Verbindung verliert, wird nach zehn Sekunden von der KI
vertreten, bis er zurück ist** (Benutzer, 2026-11-10). Heute bleiben seine
Einheiten stehen und sein Platz erhalten (Räume AC-9) — ein Dorf, das sich
nicht wehrt. Künftig übernimmt der Statthalter den **ganzen** Platz, auch den
Aufstieg: es ist niemand da, der ihn entscheiden könnte. Kehrt der Mensch mit
seinem Token zurück (Räume AC-10), endet die Vertretung im selben Takt; was
unterwegs ist, behält seinen Auftrag, und seine Schalter stehen wie vor dem
Abbruch.

Die zehn Sekunden sind dafür da, dass ein neu geladenes Fenster oder ein
kurzer Aussetzer nichts auslöst. **Es sind echte Sekunden, keine
Spielsekunden** (Benutzer, 2026-11-10): bei Spielgeschwindigkeit 2,0 also
zwanzig Spielsekunden — ein Fenster lädt nicht schneller, weil die Partie
schneller läuft. Gezählt wird trotzdem in der Welt und in Takten nach ihrer
Geschwindigkeit (100, 150 oder 200), damit die Partie nachrechenbar bleibt;
der Raum meldet den Abbruch sofort.

**Der Raum meldet nur „weg" und „wieder da".** Dass daraufhin eine KI spielt
und nach welcher Frist, weiß das Spiel, nicht der Raum (ADR-0006) — so wie er
heute nur fragt, ob es `welt.zustandJeSpieler` gibt. Der verwaiste Raum
schließt weiter nach einer Minute (Räume AC-12): eine KI, die für jemanden
spielt, hält keinen Raum offen, in dem kein Mensch mehr ist.

**8. Gebaut wird nach Stufe E.** Stufe D läuft, E (Häuser, ADR-0014) kommt
davor. Der Statthalter ist neuer Umfang: in der Tabelle von ADR-0012 steht er
in keiner Spalte, dieses ADR holt ihn herein.

**Die Vertretung ist der erste Bauschritt, nicht der letzte.** Sie braucht
weder die zerlegte KI noch die Regel „von Hand" — der Mensch ist weg, es gibt
niemanden, dem der Statthalter in die Quere käme. Es ist die KI, wie sie ist,
auf einem Platz mit einer Id aus acht Hexziffern statt `ki1`, an- und
abgeschaltet von einer Meldung des Raums. Vorgezogen wird sie deshalb nicht
(Benutzer, 2026-11-10): gespielt wird mit Freunden erst, wenn fertig gebaut
ist.

## Vorschlag für die Spec-Runde

Nicht vom Benutzer entschieden — das ist, womit die Spec-Runde anfängt.

**Bereiche.** Drei Schalter und ein Befehl, geschnitten entlang dessen, was
`entscheiden()` heute nacheinander tut:

| | Was der Statthalter dann tut | Heute in der KI |
| --- | --- | --- |
| **Wirtschaft** (Schalter) | Dorfbewohner ausbilden, Häuser, Lager, Farmen, Sammler verteilen, Untätige schicken, Markt und Karren | Wohnraum, Ausbilden, `umverteilen`, `lagerPruefen`, `farmenPruefen`, `handelPruefen` |
| **Ausbildung** (Schalter) | Militärgebäude bauen und ohne Pause Kampfeinheiten daraus | `militaerPruefen` |
| **Verteidigung** (Schalter) | die Wache zieht hin, wo etwas Leben verliert; Getroffene fliehen | `verteidigenPruefen` |
| **Angriff auf …** (Befehl) | das Heer zieht einmal im Angriffslauf zum gewählten Gegner | `heerPruefen` mit festem Ziel |

Der **Aufstieg** bleibt beim Menschen. Er ist die teuerste einzelne
Entscheidung der Partie; ihn nebenbei abzugeben, hieße das Spiel abgeben.

**Was der Mensch von Hand schickt, gehört ihm, bis es fertig ist.** Sonst
schickt der Statthalter den Dorfbewohner, den man eben an die Mauer gestellt
hat, im nächsten Takt zurück ans Holz. Eine Einheit mit einem Auftrag des
Menschen fasst der Statthalter nicht an; steht sie wieder ohne Auftrag da,
nimmt er sie zurück. Wo die Welt vermerkt, von wem ein Auftrag kam, ist offen
— heute kommen beide über dieselbe Tür.

**Der Vorrat ist die zweite Stelle, an der sich beide in die Quere kommen.**
Wer 800 Nahrung für die Ritterzeit spart, will nicht, dass die Wirtschaft sie
in Dorfbewohner steckt. Die KI kennt dafür schon eine Rücklage (`ruecklage`,
`ruecklageRitterzeit`); ob der Mensch sie einstellt oder der Statthalter sie
aus dem nächsten Aufstieg liest, ist offen.

**Für alle gleich, und abschaltbar.** Eine Einstellung beim Eröffnen —
Statthalter erlaubt oder nicht —, damit eine Runde, die ohne spielen will, es
kann. Im Bild sieht man am Knopf, was übergeben ist; ob die anderen es sehen,
ist offen.

**Zur Vertretung (Punkt 7) drei offene Stellen:**

- **Die Sicht.** Punkt 6 gälte streng auch hier: die Vertretung sieht heute
  mehr als der, den sie vertritt. Vorschlag: für die Vertretung hinnehmen,
  bis ki AC-13 steht — sie weiß dann genau so viel wie jeder Computergegner
  in derselben Partie, und sonst wartet der einfachste Bauschritt auf den
  schwersten.

- **Aufgeben für einen, der weg ist.** `aussichtslos` heißt: keine Einheit,
  nichts in der Schlange, nichts bezahlbar. In dieser Lage könnte auch der
  Zurückgekehrte nichts mehr tun, und ohne Aufgeben schleift der Sieger
  minutenlang Häuser eines Abwesenden. Vorschlag: für einen Abwesenden gibt
  die Vertretung in genau diesem Fall auf, für einen Anwesenden nie.
- **Ein gezogener Stecker ist ein Schalter.** Wer absichtlich die Verbindung
  trennt, bekommt die schwere KI für den ganzen Platz — auch in einer Runde,
  die den Statthalter beim Eröffnen abgeschaltet hat. Unter fünf Bekannten
  ist das kein Schaden. Damit es wenigstens niemand heimlich tut, müssen die
  anderen im Spielbild sehen, wer vertreten wird (Räume AC-11, heute offen).

**Woran gemessen wird**, bevor etwas `fertig` heißt:

1. **Alles übergeben ist die KI.** Ein Platz mit allen Schaltern an spielt im
   Prüfstand wie ein KI-Platz mit demselben Startwert — bis auf Aufstieg und
   Aufgeben, die er nicht hat. Das ist der Beweis für Punkt 1: kein eigener
   Code, der anders entscheidet.
2. **Nur Wirtschaft:** nach zehn Minuten so viele Dorfbewohner wie die KI
   (22), ohne dass ein Mensch etwas tut.
3. **Von Hand bleibt von Hand:** eine Einheit mit Auftrag des Menschen
   bekommt in keinem Takt einen vom Statthalter.
4. **Nichts übergeben ist nichts:** dieselbe Partie ohne Schalter verläuft
   Takt für Takt wie heute.
5. **Vertretung:** über WebSocket gegen den laufenden Server (ADR-0004) —
   Verbindung trennen, nach der Frist arbeitet der Platz weiter; vor der Frist
   zurück, und kein Auftrag kam von der KI; nach der Rückkehr kommt keiner
   mehr.

## Was dieses ADR nicht hereinholt

| Wird gebaut | Wird nicht gebaut |
| --- | --- |
| Statthalter: die KI für übergebene Bereiche des eigenen Platzes | ein Sprachmodell im Spiel, Ansagen als Text oder Sprache |
| Schalter je Bereich, ein Befehl „Angriff auf …" | frei einstellbare Regeln („wenn Gold unter 100, dann …") |
| Einstellung beim Eröffnen: erlaubt oder nicht | ein Statthalter, der besser spielt als die KI oder anders als sie |
| Vertretung des ganzen Platzes nach zehn Sekunden ohne Verbindung | Aufstieg und Kündigen durch den Statthalter, solange der Mensch da ist |
| | ein Platz, den ein anderer Mensch übernimmt |
| | Partien, die ohne jeden Menschen zu Ende laufen |

## Folgen

- **Wer alles übergibt, spielt so stark wie die schwere KI.** Für eine Runde
  aus fünf Leuten mit verschiedener Übung ist das der Zweck. Für eine Runde,
  die sich messen will, ist es der Grund für die Einstellung.
- **Die KI wird in Teile zerlegt, die einzeln abschaltbar sind.** Das trifft
  `entscheiden()` und alles, was dort über Zustand zusammenhängt (`heer`,
  Rollen, Rücklage). KI gegen KI muss danach verlaufen wie davor
  (`npm run pruefstand:vergleich`).
- **Die Stufen der KI** (schwer, mittel, leicht) sind noch nicht alle gebaut.
  Ob der Statthalter eine Stufe hat, entscheidet sich, wenn es sie gibt.
- ki AC-13 bekommt einen zweiten Grund neben dem ersten.

## Was die Spec-Runde daraus macht

Dieses ADR ändert selbst keine Spec; im selben Arbeitsbaum läuft die
Weiterbau-Schleife an Stufe D.

- **Fahrplan:** ein Abschnitt nach Stufe E mit eigener Bauabfolge — erst die
  Vertretung bei Abbruch, dann die KI zerlegen, dann die Übergabe als
  Nachricht, dann „von Hand", dann die Knöpfe im Bild.
- **Räume:** AC-9 bekommt unter seiner Nummer den neuen Text; dazu ein
  Kriterium für die Meldung „weg" und „wieder da" an das Spiel. AC-11
  (Abwesenheit sichtbar) wird Voraussetzung.
- **KI, Bedienung, Spielauswahl:** Kriterien mit neuen Nummern für Bereiche,
  die Regel „von Hand", die Knöpfe und die Einstellung beim Eröffnen.
- **`CLAUDE.md`:** die Tabelle „Entschieden" bekommt die Zeile für 0015. Im
  Verzeichnis `docs/adr/README.md` steht sie schon.
