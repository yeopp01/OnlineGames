---
name: strategie-weiterbauen
description: Eine Arbeitsrunde am Strategiespiel (Klon von Age of Empires II) - das naechste Kriterium aus dem Fahrplan nehmen, bauen, per Test belegen, im Browser nachweisen, pruefen, committen und aufschreiben, was gelernt wurde. Gedacht fuer /loop, also ohne Rueckfragen lauffaehig. Verwenden, wenn am Strategiespiel eigenstaendig weitergearbeitet werden soll.
---

# Eine Runde am Strategiespiel

Du arbeitest allein. Niemand schaut zu, niemand beantwortet Fragen während der
Runde. Deshalb gilt: **lieber ein kleines Kriterium sauber auf `fertig` als drei
halb.** Die Regeln aus `CLAUDE.md` gelten ohne Abstrich — vor allem, was
`fertig` heißt.

## 0. Orientieren (immer)

1. `git status` und `git branch --show-current`. Gearbeitet wird auf
   **`strategie`**. Ist der Baum nicht sauber, prüfe, ob das die Reste einer
   abgebrochenen Runde sind. Wenn ja: zu Ende bringen oder verwerfen, was
   nicht grün wird (`git stash`, mit Vermerk in den Erkenntnissen). Fremde
   Änderungen, die du nicht einordnen kannst, fasst du nicht an — Frage
   aufschreiben, Runde beenden.
2. Lies [`docs/strategie/erkenntnisse.md`](../../../docs/strategie/erkenntnisse.md):
   **Fragen an den Benutzer** und **Offene Fäden** ganz, von **Runden** die
   letzten fünf Zeilen.
3. Lies [`specs/10-strategie/fahrplan.md`](../../../specs/10-strategie/fahrplan.md)
   und bestimme die **aktuelle Stufe**: die erste mit einem Kriterium, das
   nicht `fertig` ist.
4. **Im [Steuerstand](../../../docs/strategie/steuerstand.md) steht unter „Wo
   ich stehe", welche Runde die nächste Rückschau ist.** Ist es diese, oder
   wurde in der letzten Runde eine Stufe erreicht: **Rückschau** (Abschnitt 8)
   statt Bauen. Nicht nachzählen — die Rückschauen 55 und 60 sind ausgefallen,
   weil nach der Rückschau zur Stufe A niemand mehr gezählt hat (Rückschau nach
   Runde 65). Steht dort keine Zahl, gilt wieder „durch fünf teilbar", und die
   Runde trägt sie ein.

## 1. Arbeit wählen

In dieser Reihenfolge, das Erste, was zutrifft:

1. **`npm run check` ist rot** → das reparieren. Nichts anderes.
2. Ein Kriterium steht auf **`in-arbeit`** → weiterführen.
3. Ein Kriterium der aktuellen Stufe (oder eines, das sie voraussetzt) steht auf
   **`in-qa`** → fehlenden Beleg oder Nachweis liefern.
4. **Die Stufe hat noch keine Fach-Kriterien** → **Spec-Runde**: aus der
   [Vorlage](../../../docs/strategie/vorlage-aoe2.md) die Kriterien der Stufe in
   die Fach-Specs schreiben (Abschnitt 2). Nur Specs, kein Code.
5. Sonst das **nächste `offen`-Kriterium der aktuellen Stufe**, das nichts
   Ungebautes voraussetzt. Bei Wahl: das, welches am frühesten etwas im
   Browser Spielbares ergibt.

**Einen offenen Produktfehler umschiffst du höchstens einmal.** Scheitert ein
Bild oder Test an einem Fehler, der schon als `offen`-Kriterium dasteht, darf
diese Runde einmal ausweichen (andere Szene, andere Aufstellung) — beim
zweiten Mal wird der Fehler die **nächste** Runde, vor allem anderen außer
rotem `check`. `einheiten AC-29` (Einheiten stehen übereinander) wurde in den
Runden 56, 61, 63, 64, 78, 85 und 86 je einzeln umschifft; in Runde 86 kostete
das vier Fassungen eines Bildes (Rückschau nach Runde 88).

**Zuschnitt:** Eine Runde ist ein Kriterium, oder zwei bis drei, die nur
zusammen Sinn ergeben. Merkst du beim Bauen, dass es größer ist: Kriterium
teilen (neue Nummern), das erste Stück fertigmachen.

Setze die gewählten Kriterien auf `in-arbeit`.

## 2. Spec-Runde (wenn eine Stufe beginnt)

- Lies die Fach-Specs, die die Stufe betrifft, und die Vorlage.
- **Offene Kriterien**, die nicht mehr passen: neuer Text, **gleiche Nummer**.
- **Fertige Kriterien**, die nicht mehr gelten: **in der Spec-Runde nicht
  anfassen.** Sie bleiben `fertig`, bis ihr Nachfolger gebaut ist, und stehen
  im Fahrplan unter „Was Stufe X ablöst". Die Runde, die den Nachfolger baut,
  setzt sie auf `zurueckgestellt (abgelöst durch <kuerzel> AC-n)` und passt im
  selben Commit Test, Bild und Eintrag in `qa/ohne-bild.json` an. So ist jeder
  Zwischenstand prüfbar. (Runde 7.)
- **Zu jeder Stufe eine Bauabfolge** im Fahrplan: Schritte von einer bis drei
  Runden, jeder mit etwas im Browser Sichtbarem am Ende. Die Arbeitswahl
  (Abschnitt 1, Punkt 5) folgt dieser Abfolge.
- Neue Kriterien bekommen die nächste freie Nummer. Kurztitel höchstens fünf
  Wörter. Ein Kriterium ist **prüfbar**: eine Zahl, ein Verhalten, ein Bild.
- Zahlen aus der Vorlage übernehmen. Abweichen nur mit einem Satz Begründung
  im Kriterium.
- `npm run specs:board`, `npm run check`, Commit `Spec: Stufe X - …`.

## 3. Bauen

- **Der Server rechnet** (ADR-0001). Der Browser zeigt an und schickt Absichten.
- **Werte sind Daten.** Einheiten, Gebäude, Verbesserungen, Völker stehen in
  Tabellen unter `server/spiele/strategie/`, nicht als Verzweigungen in der
  Simulation. Ein `if (volk === 'franken')` ist ein Fehler.
- **Deterministisch.** Kein `Math.random()` in der Simulation; Zufall nur aus
  dem Startwert der Partie. Das ist die Voraussetzung für den Prüfstand.
- Deutsche Bezeichner, Umlaute umschrieben. Stil wie im umliegenden Code.
- Die Darstellung ist isometrisch und in Code gezeichnet. **Kein** Material aus
  dem Original, auch nicht vorübergehend. Kein „Age of Empires" in der
  Oberfläche.
- Nichts Strategiespezifisches in `raeume.js`, `schutz.js`, `index.js`
  (ADR-0006). Die Schnittstelle der Spiele liegt zwischen diesen und
  `server/spiele/<art>/`.
- Das Managerspiel ruht. Anfassen nur, wenn eine gemeinsame Stelle (Vorraum,
  Spielauswahl) es verlangt, und dann muss sein Browserlauf grün bleiben.
- **Prüfen und committen nur mit `&&` verketten**, nie mit `;` — sonst läuft
  der Commit auch, wenn `npm run check` rot ist (Runde 10 passiert). Am
  sichersten: Prüfung und Commit als zwei getrennte Aufrufe, der Commit erst
  nach gelesenem „fail 0".
- **Werkzeug:** neue Dateien mit Write, Änderungen mit Edit. **Kein Heredoc
  mit Quelltext** — sobald Backticks, `${…}`, Backslashes oder Anführungszeichen
  darin stehen (also bei jedem Test), bricht die Shell mittendrin ab oder
  verändert den Inhalt still (Runden 4, 11, 22, 25). Viele Änderungen auf
  einmal: das Skript mit Write in den Temp-Ordner legen und dann mit
  `python "$(cygpath -w …)"` ausführen; anzuhängender Testtext ebenso als Datei.
- **Listen, die mit den Stufen wachsen, prüft ein Test nie auf Gleichheit.**
  Was ein Dorfbewohner baut, was ein Gebäude anbietet, wie viele Knöpfe ein
  Menü hat: „enthält" oder aus den Werten zählen (`werte.einheiten…baut.length`).
  Und als Beispiel für „gibt es nicht" ein erfundener Name, nie ein Gebäude
  späterer Stufen (Runden 31–34: fünfmal gebrochen). Browsertests fragen nach
  freien Plätzen `window.ansicht.platzTaugt`, nicht eine eigene Regel.
  **Drei Wächter suchen das jetzt** (`tests/waechter-*.test.mjs`): Gleichheit
  auf wachsenden Listen, verbesserbare Werte an `welt.einheitenwert()` vorbei,
  und Bildunterschriften, die erst beim Lauf zusammengesetzt werden. Wer eine
  neue Regel dieser Art aufstellt, legt einen Wächter dazu statt Fettdruck.
  **Das sucht jetzt ein Wächter:** `tests/waechter-gleichheit.test.mjs` liest
  `tests/` und `e2e/` und beanstandet Gleichheit auf einem ganzen `auftrag`,
  `bildetAus`, `baut` oder einem Eintrag aus `EINHEITEN`, `GEBAEUDE`,
  `VERBESSERUNGEN`, `TIERE`, `ZEITALTER`, `AUFSTIEGE`. Wer eine neue wachsende
  Liste anlegt, trägt sie dort ein. Ein Blatt (`…miliz.kosten`) bleibt erlaubt.
- **„Ausgebildet", „gebaut", „gesammelt" misst den Unterschied, nicht den
  Bestand.** `einheitenJeArt(page)` zählt vorher, danach wird **mehr**
  verlangt. Der Browsertest, der Stufe B beglaubigt, verlangte „mindestens
  einen Späherreiter" — den hat jeder zum Start (Rückschau nach Runde 83):
  drei Zusicherungen, alle drei schon vor der Handlung grün.
- **Eine Liste von Namen im Testkopf ist derselbe Fehler wie eine
  Gleichheitszusicherung.** Was geprüft wird, kommt aus den Daten
  (`Object.keys(EINHEITEN)`), nicht aus dem Gedächtnis. Die Spielerfarbe wurde
  eine Stufe lang an drei aufgezählten Einheiten gemessen; der Plänkler trug
  3,9 % und niemand sah es (Rückschau nach Runde 83).
- **Wer Werte ändert, sucht Tests, die an den alten hängen.** Startvorrat,
  Kartengröße, Mengen, Raten: vorher nach der alten Zahl und nach Mustern wie
  `[1-9]` oder `> 0` in `tests/` und `e2e/` suchen. Ein Test, der nach der
  Änderung schon vor der Handlung grün ist, prüft nichts mehr (Runde 11:
  „Holz steigt" traf den Startvorrat).
- **Werte einer Einheit nur über `welt.einheitenwert(besitzer, art, feld)`.**
  Angriff, Leben, Rüstung, Reichweite, Sicht, Tempo, Nachladezeit stehen in der
  Tabelle, aber Verbesserungen ändern sie. Wer `EINHEITEN[art].angriff` direkt
  liest, sieht sie nicht — genau so war die Rüstung aus dem Webstuhl eine Stufe
  lang wirkungslos (Runde 68). `tests/waechter-werte.test.mjs` sucht danach.
- **Die kurzen Namen aus der Übertragung** (`h`, `u`, `k`, `art`, `f`) stehen
  als Tafel oben in `e2e/helpers/strategie.mjs` — dort nachsehen statt in
  `welt.js` suchen.
- Ein Import darf nicht heißen wie ein Parameter der umgebenden Funktion
  (`starten(hafen, einstellungen)` hat einen Import `einstellungen`
  überdeckt, Runde 2) — der Fehler zeigt sich erst zur Laufzeit.

## 4. Belegen

- Testname `<kuerzel> AC-<n>: <was gilt>`.
- Regeln der Simulation direkt gegen die Rechenteile (`tests/regeln.test.mjs`
  oder eine neue `tests/strategie-*.test.mjs`); alles, was über das Netz geht,
  über WebSocket gegen den laufenden Server (ADR-0004).
- **Messbare Stellvertreter für Aussehen oder Zeit** (Bildpunkte, Überdeckung,
  Taktzahl): Die Schwelle kommt aus der Eigenschaft, die das Kriterium
  verlangt, nicht aus dem ersten Messwert. Scheitert der Test, zuerst fragen:
  Ist das Produkt falsch oder meine Annahme darüber, wie es sich zeigt? Die
  Antwort steht als Kommentar am Test. Echte Uhren in Tests nur, wenn die Zeit
  selbst geprüft wird; sonst `t.mock.timers` (Runden 8 und 9: dreimal war die
  Annahme falsch, nie das Produkt).
- **Einen Stellvertreter fürs Aussehen erst festschreiben, wenn er gemessen
  ist:** den Wert vorher und an einem schnellen Entwurf nachher
  (`npm run tafel -- "<Ausdruck>"`, Spielbild mit `npm run sicht`). Wird das
  Bild besser und die Zahl schlechter, misst die Zahl das Falsche (Runde 39:
  „Sättigung des ganzen Bildes" stieg, weil erdiges Oliv in HSL gesättigter
  ist als Graugrün). Dann das Kriterium neu fassen, bevor gebaut wird.
- **Jeder Messaufbau über viele Läufe braucht eine Gegenprobe.** Ein Test, der
  zwanzigmal dasselbe misst, ist nicht zwanzig Messungen — und ein Test, der
  „A schlägt B" zeigt, zeigt vielleicht nur „die linke Seite gewinnt". Deshalb
  zwei Fragen, bevor die Zahl gilt: **Ist jeder Lauf ein anderer?** (Runde 71:
  alle zwanzig Startwerte endeten Takt für Takt gleich, weil die Heere auf
  freiem Grund standen — das Gelände war die einzige Abwechslung gewesen.) Und
  **wäre der Test auch grün, wenn die Ursache eine andere wäre?** (Runde 71:
  ohne die umgekehrte Richtung hätte der Konterkreis auch gehalten, wenn
  schlicht immer links gewinnt.) Beides als eigene Zusicherung schreiben, nicht
  nur prüfen und wegwerfen.
- **Was im Browser steht, wird im Browser gelesen — nicht aus dem Kopf.**
  Kürzel, Zeitalter, Werte: `window.ansicht.werte` fragen oder `daten.js` in
  Node importieren. In Runde 72 kosteten drei Annahmen je einen Lauf (`p` ist
  der Speerkämpfer, nicht der Plänkler; der Späherreiter steht auf Zeitalter 0;
  `klassen` und `bonus` bekommt der Browser gar nicht). Die Tafel oben in
  `e2e/helpers/strategie.mjs` sagt, was ankommt und was nicht —
  `tests/waechter-drahttafel.test.mjs` hält sie richtig.
- **Tests über ganze Partien** (Prüfstand, KI): erst messen, dann die Grenze
  setzen. Die Werte über alle Startwerte ausgeben (`npm run
  pruefstand:strategie` oder ein kurzer `eingriff`), die Grenze aus dem
  Kriterium oder dem Plan ableiten und die gemessenen Werte als Kommentar an
  den Test schreiben (Runde 44: „mindestens 5 im Holz" und „30 s Warten" waren
  geschätzt, das erste falsch, das zweite zu lasch).
  **Warum eine Partie so lange dauert, zeigt `npm run pruefstand:verlauf --
  --startwert n`** (je Minute Dorfbewohner, Heer daheim und draußen, worauf es
  einschlägt, Gebäude mit Leben, Vorrat); welche Startwerte die langen sind,
  sagt `pruefstand:vergleich` in der Zeile „Enden" (`62.0@5`). In den Runden 94
  bis 97 schrieb jede Runde dafür ein eigenes Wegwerfskript.
  **Ein Messtest über viele ganze Partien bekommt eine eigene Datei**
  (`tests/strategie-partien.test.mjs`): `node --test` rechnet Dateien
  nebeneinander, Tests einer Datei nacheinander. Hinter den Messungen in
  `strategie-ki.test.mjs` verlängerte zwanzig Partien `npm run check` von 48
  auf 88 Sekunden (Runde 97).
- **Was gemessen nichts bringt, bleibt nicht im Code.** Jede Abhilfe einzeln
  messen (`npm run pruefstand:vergleich`), und zurücknehmen, was die Zahl
  nicht bewegt — auch wenn sie „richtig" aussieht. In den Runden 89 bis 92
  waren es sechs: drei Abhilfen für die Beeren, eine größere Rücklage und zwei
  Hebel für fahrplan AC-11. Bleiben darf eine Regel ohne Wirkung auf die
  Messung nur, wenn sie einen eigenen Fall mit eigenem Test hat.
- **Grenzen und Fenster in Messtests: erst die Verteilung ausgeben, dann die
  Grenze aus dem Kriterium begründen** — nie umgekehrt. Zweimal trotz dieser
  Anweisung geraten: „höchstens sechs Ausnahmen" (es waren acht, und die
  Regel war falsch herum; Runde 90) und „drei Minuten" (zu kurz; begründet
  sind fünf, die Zeit, in der ein Dorfzentrum zwölf Dorfbewohner ersetzt;
  Runde 91). Steht im Kommentar keine Messung neben der Grenze, ist sie
  geraten.
- **Nie** einen Test überspringen, eine Schwelle senken oder eine Zusicherung
  lockern, um grün zu werden. Ist eine Schwelle wirklich falsch, ändere das
  Kriterium in der Spec, mit Begründung im Commit und einer Zeile in den
  Erkenntnissen.

## 5. Nachweisen und selbst hinsehen

- Hat das Kriterium einen Bildschirm: Browsertest unter `e2e/tests/` mit
  `nachweis()` ([`qa/README.md`](../../../qa/README.md)). Das Spielbild bekommt
  eigene Dateien (`strategie-*.spec.mjs`). Braucht der Test einen Zustand, der
  im Spiel Minuten dauert, dafür einen **Prüfgriff** in `e2e/server.mjs`, nie
  eine Abkürzung im Produktcode.
- **Die Unterschrift beschreibt, was das Bild zeigt — nicht, was der Test
  weiß.** Der Test kennt jede Zahl, jeden Namen, jede Dauer; das Bild kennt
  nur seinen Ausschnitt. Deshalb gehört nichts in die Unterschrift, was ein
  Standbild nicht tragen kann: keine Dauer („zwei Sekunden lang"), keine
  Bewegung („und unterwegs"), keine Veränderung („der Vorrat steigt") und
  kein Name, der bloß im `title` hängt (die Auswahlleiste zeigt bei einer
  Gruppe **Bild und Anzahl**, den Namen nur als Tooltip). Für eine
  Veränderung braucht es ein Paar aus Vorher und Nachher, wie bedienung AC-1.
  In Runde 83 waren elf von 96 Unterschriften aus diesem Grund falsch.
- **Die Unterschrift steht als fester Text im Test**, nie aus Werten
  zusammengesetzt: `npm run check` sucht sie wörtlich und findet sonst keinen
  Erzeuger. Was sich von Lauf zu Lauf ändert, wird mit `expect()` gesichert und
  in der Unterschrift nicht beziffert. (`tests/waechter-nachweis.test.mjs`.)
- **Was die Bildunterschrift behauptet, sichert der Test vor `nachweis()`
  mit `toBeInViewport()`** — die Meldung, der Knopf, das Feld. Ein Screenshot
  zeigt nur den sichtbaren Ausschnitt; was darunter liegt, ist für das Bild
  nicht da. (Runde 2: die Absage stand unter dem Rand.) Wo nötig, ein höheres
  Fenster für diesen einen Test.
- **Sieh dir jedes neue Bild mit dem Read-Werkzeug an.** Frage: Zeigt es, was
  die Bildunterschrift behauptet — für jemanden, der das Spiel nicht kennt? Ist
  die Einheit erkennbar, der Text lesbar, nichts abgeschnitten, nichts
  überdeckt? Wenn nicht: verbessern, nicht einchecken. Auf der Leinwand hilft
  kein `toBeInViewport` — dort ist das Ansehen die einzige Prüfung. (Runde 4:
  der Ladungspunkt lag unter dem Auswahlring.)
- **Ein neues festes Bedienteil über dem Spielfeld** (Leiste, Knopf, Karte,
  Fenster) prüft `bedienteileFrei(page)` aus `e2e/helpers/strategie.mjs` im
  breitesten Zustand — dort, wo die Auswahlleiste am längsten ist (ein
  Dorfbewohner mit Baumenü). Nachsehen allein hat die Überdeckung in Runde 47
  erst eine Runde später gefunden. Neue Teile in die Liste der Hilfe
  aufnehmen.
- **Stehen auf dem Bild mehrere Figuren, prüft `figurenFrei(page)`** aus
  derselben Hilfe, dass keine zwei näher als ein halbes Feld beieinander
  stehen. Vier Bilder in zehn Runden zeigten „eine Figur mit drei Schwertern"
  oder „zwei Bögen" (Runden 56, 61, 63, 64) — jedes Mal hat es erst das Auge am
  fertigen Bild gefunden. Gefallene sind ausgenommen, Gebäude vor Figuren prüft
  es nicht.
- **Behauptet die Unterschrift einen Zustand, wartet der Test darauf** —
  „angekommen", „im Wald", „mit Namen": erst `waitForFunction` auf genau
  diesen Zustand, dann `nachweis()` (Runde 46: zweimal zu früh). Nennt ein Test
  zwei Kriterien, legt er das Bild für beide ab (Schleife über
  `[[SPEC, 'AC-n'], …]`), sonst beanstandet das Board.
- **Jede Zahl und jedes „sichtbar" in einer Bildunterschrift sichert der Test
  vorher ab** — gezählt aus `window.ansicht`, nicht geschätzt („vier
  Dorfbewohner und ein Reiter" statt „fünf Dorfbewohner"), und ein Balken oder
  eine Ladung erst ab einer Größe, die man im Bild sieht (Runde 19: zweimal
  falsch). Beim Ansehen auch fragen: **Verdeckt das Neue etwas, oder wird es
  verdeckt?** Gebäude standen zweimal vor Figuren.
- **Eine Partie zu zweit** startet `partieZuZweit(browser, info)` aus
  `e2e/helpers/strategie.mjs`, beendet wird sie mit `partieBeenden`. Dort
  liegen auch `dorfbewohnerAnklicken` und `platzImBild` (ein freier Bauplatz
  **vorn** oder **seitlich**, damit Gebäude nichts verdecken). Neue
  Spielbild-Dateien kopieren nichts davon.
- **Warten auf Spielzeit** geht über den Zeitraffer (bis 20), nicht über die
  Uhr: wer länger als fünf Sekunden auf etwas wartet, das im Spiel dauert, dreht
  ihn hoch — und rechnet Abstandsgrenzen mit ein, denn ein Zustand fasst dann
  mehrere Takte. `npm run e2e:laufzeiten -- strategie` zeigt die Dauer je Datei
  und die langsamsten Fälle; nach einer Runde mit neuen Browsertests ansehen.
- **Beim Zeichnen zuerst ansehen, dann testen:** `npm run sicht --
  schautafel.html` (Seite ohne führenden Schrägstrich) schreibt ein Wegwerfbild
  in den Temp-Ordner und nennt den Pfad. **Und immer auch im Spielbild:**
  `npm run sicht -- --spiel --zoom 2 --ziel wald --warten 5` (Ziele: basis,
  wald, gold, stein, beere, wasser). Die Schautafel sah in den Runden 12–14
  jedes Mal gut aus, das Spielbild nicht. Erst wenn beides gut aussieht, kommt
  der Browsertest mit `nachweis()`.
- **Wer mehr zeichnet, misst die Zeit** (Runden 27–29): vorher und nachher
  `npm run sicht -- --spiel --zoom 1 --messen` und dasselbe bei Zoom 0,5 und 2.
  Wird es bei Zoom 1 mehr als ein Fünftel teurer, hilft eines von zwei Dingen,
  die gemessen gewirkt haben: **Zwischenspeicher** (einmal in ein kleines Bild
  zeichnen, dann kopieren - `gebaeudeBildZeichnen`, `dingBildZeichnen`) für
  Dinge, die gleich aussehen, oder **Sammeln** gleichfarbiger Striche in einen
  Pfad (`grasSammeln`) für viele kleine. Kacheln für den Boden waren in Runde 13
  langsamer - nicht ohne Messung wieder versuchen.
- **Wer Farben oder Formen ändert, fährt zuerst die Darstellungstests**, nicht
  erst beim Neuerzeugen aller Bilder: `npx playwright test --config
  e2e/playwright.config.mjs strategie-figuren strategie-tiere strategie-bauen`
  (gut zwei Minuten). Gedämpfte Farben kosteten Tonstufen (darstellung AC-12)
  und die Unterscheidbarkeit der Lager (bauen AC-20) — beides fiel in Runde 37
  erst im Lauf über alle Bilder auf.
- **`sicht --messen` misst nur die JavaScript-Zeit von `zeichnen`**, nicht die
  Bildrate: Canvas-Befehle werden beim Darstellen gerastert. Wer Zeichnung,
  Zwischenspeicher oder Kopien ändert, fährt `strategie-tempo` (Bilder je
  Sekunde mit 100 Einheiten und 30 Gebäuden). In Runde 52 sagte `zeichnen`
  1,4 ms, das Bild lief mit 38 je Sekunde.
- **Spielgröße ansehen, nicht nur herangezoomt.** Jede Figur und jedes Gebäude
  wird auch bei Zoom 1 beurteilt — dort spielt man. Die Schautafel zeigt
  beides nebeneinander.
- **Eine geänderte Seite heißt: alle Bilder dieser Seite neu.** Der gewöhnliche
  Lauf schreibt nur fehlende Bilder, alte zeigen dann den alten Stand. Auch
  ein Test, der sein Bild nur anders aufstellt, schreibt es im gewöhnlichen
  Lauf nicht neu (Runde 41: das alte Bild mit der verdeckten Karre blieb
  liegen).

  **Hat sich das Aussehen geändert, ist der Abschlusslauf
  `npm run check:alles:neu:kurz`** — ein Browserlauf, der jedes Bild neu
  schreibt, danach `npm run check` ohne Browser. **Nicht** erst
  `npm run qa:nachweis -- <muster>` und dann `npm run check:alles`: das sind
  zwei Browserläufe hintereinander und kostet neun Minuten umsonst. In den
  Runden 76 und 77 ging so jedes Mal die Hälfte der Rundenzeit weg
  (Rückschau nach Runde 78).

  `npm run qa:nachweis -- <muster>` bleibt für das Zwischendurch, wenn man
  **ein** Bild ansehen will, ohne alles zu fahren:

  | Gemeint                                | Muster                                      |
  | -------------------------------------- | ------------------------------------------- |
  | ein einzelner Test                     | `npm run qa:nachweis -- <datei ohne .spec.mjs>` |
  | nur das Strategiespiel                 | `npm run qa:nachweis -- strategie`          |
  | nur das Managerspiel                   | `npm run qa:nachweis -- manager`            |
- **Ein neuer Browserfall mit KI, Kampf oder Zeitraffer läuft vor dem
  Abschlusslauf zehnmal:** `npx playwright test --config
  e2e/playwright.config.mjs <datei> --grep "<kuerzel> AC-n" --repeat-each 10`.
  Was dort von der Zeit abhängt, fällt nicht in jedem Lauf. In Runde 86 war
  der Bildnachweis zu ki AC-14 dreimal einzeln grün und fiel dann im großen
  Lauf; mit `--repeat-each 6` fielen vier von sechs. Ein Lauf kostet so
  Sekunden statt der zehn Minuten eines roten Abschlusslaufs.
- **Nach einem Lauf, der alle Bilder neu schreibt, erst `npm run qa:abweichung`,
  dann `git add`.** Ein solcher Lauf ändert leicht 80 Bilder, die meisten nur
  um den zufälligen Raumcode oder die laufende Uhr. Die Ausgabe sortiert nach
  Anteil geänderter Bildpunkte und trennt bei 1 % — gemessen liegt zwischen
  0,6 % und 60 % **nichts**: darunter sind es Beschriftungen, darüber hängt
  die Kamera an laufenden Positionen, und dort kann eine Aufstellung kippen.
  **Jedes Bild über der Grenze wird
  angesehen**, bevor irgendetwas eingecheckt wird. In der Rückschau nach
  Runde 78 stand dort ein Rückschritt, den sonst niemand gefunden hätte: zwei
  Milizen übereinander statt drei nebeneinander.
- Kein Bildschirm: Eintrag in `qa/ohne-bild.json`, der sagt, **was** das
  Kriterium ist und **warum** ein Bild es nicht zeigen kann.

## 6. Prüfen und festhalten

0. **Eine Durchsicht ohne deine Schlüsse**, bevor der Abschlusslauf beginnt,
   wenn die Runde Simulation, KI oder Kampf geändert hat: ein Subagent
   (`feature-dev:code-reviewer`, `model: sonnet`, nur lesend) bekommt `git diff`
   der Produktdateien **als Datei**: `git diff -- <dateien> > <scratchpad>/durchsicht.diff`
   und der Pfad in den Auftrag — der Prüfer hat keine Shell und las in Runde 97
   die Dateien statt des Unterschieds. Dazu eine Beschreibung des **Verhaltens**, nicht deines
   Urteils — und sucht Fehler, Randfälle, Determinismus, was die KI nicht
   sehen dürfte. Seine Befunde prüfst du am Code nach, bevor du handelst; jeder
   echte bekommt einen Test mit Gegenprobe — **gegen die alte Zeile**: nur
   die Produktzeile zurücksetzen (Kopie der Datei, `sed`, zurückkopieren), den
   Test laufen lassen, er muss fallen. Nicht `git stash`: das nimmt den neuen
   Test mit weg, und „grün" heißt dann nichts (Runde 97). Die Durchsicht traf
   in jeder der Runden 94 bis 97. In Runde 86 trafen zwei von fünf
   Befunden, einer davon ein Fehler, den die Runde eine Stunde vorher selbst
   eingebaut hatte — kein Test hatte ihn gesehen. Kosten: rund 90 Sekunden.
   Ebenso kann ein Subagent die Bilder über 1 % aus `qa:abweichung` gegen ihre
   Unterschriften lesen (Runde 87: dreizehn Bilder in 73 Sekunden); was er
   beanstandet, siehst du selbst an.
1. Status auf `fertig`, `npm run specs:board`.
2. Oberfläche angefasst → `npm run check:alles:kurz`, sonst `npm run check:kurz`.
   **Hat sich das Aussehen geändert** (Figuren, Gebäude, Gelände, Leiste,
   Stylesheet), dann `npm run check:alles:neu:kurz`: derselbe Lauf, aber er
   schreibt jedes Bild neu. Ein Lauf statt zwei — danach
   `npm run qa:abweichung` und die Bilder über 1 % ansehen.
   **In der Schleife immer die `:kurz`-Form**: sie zeigt die Zahlen und bei
   einem Fehler die Fehlerstelle, und spart je Lauf rund 8.000 Token an „ok"
   nach „ok" (Runde 60). Die ganze Ausgabe steht in `qa/letzter-lauf.log`,
   wenn mehr gebraucht wird.
3. Regeln oder Werte geändert und der Prüfstand existiert (fahrplan AC-4) →
   `npm run pruefstand:strategie`, Zahlen unter **Messwerte**. **Vorher und
   nachher in einem Befehl:** `npm run pruefstand:vergleich` (Arbeitsstand
   gegen HEAD; `--gegen HEAD~3 --minuten 30 --partien 20`). Nicht mehr mit
   `git stash` und Kopien des Ordners von Hand (Rückschau nach Runde 92).
4. **Rot nur durch eine Zeitmessung** — `karriere AC-7` (Saison unter 1 s),
   `einheiten AC-8` (Wegsuche unter 1 ms), `karte AC-15` (Wegsuche auf der
   größten Karte): das ist fast immer fremde Last oder der parallele Lauf
   (Runden 10, 19, 26). Nachsehen
   (`Get-CimInstance Win32_Process -Filter "Name='node.exe'"`), den Test
   allein laufen lassen (`node --test --test-name-pattern="<kuerzel> AC-n"
   <datei>`), dann `npm run check` einmal wiederholen. Committet wird erst bei
   „fail 0". Grenzen und Testaufruf bleiben, bis der Benutzer die offene Frage
   beantwortet. `karte AC-15` misst seit Runde 36 den schnellsten von fünf
   Durchgängen, `karriere AC-7` seit Runde 45 die schnellste von bis zu drei
   gleichen Saisons (nur wenn die erste über der Grenze liegt); ein weiterer
   Zeittest, der wiederholt reißt, bekommt dieselbe Messweise (Grenze
   unverändert).
5. Rot → beheben. Geht es nach ernsthaftem Versuch nicht: Kriterium zurück auf
   `in-arbeit` oder `in-qa`, die Ursache als offenen Faden aufschreiben,
   **nicht** committen, was rot ist.
6. Grün → eine Zeile unter **Runden** in den Erkenntnissen, offene Fäden
   aktualisieren (erledigte streichen). Dann **ein Commit** auf `strategie`,
   deutscher Text, Betreff sagt, was jetzt geht. **Kein Push, kein Deploy.**
7. Ist mit dem Commit eine Stufe erreicht: Zeile „Stand" in `CLAUDE.md`
   nachziehen.
8. **Zwischenstand in der Abschlussnachricht:** Der Benutzer will den
   Fortschritt sehen, nicht nur lesen. Nenne am Ende jeder Runde zwei bis drei
   Bilder dieser Runde als Markdown-Link auf die Datei unter
   `qa/bildnachweise/…` — das aussagekräftigste zuerst, je mit einem halben
   Satz, was darauf zu sehen ist. Hatte die Runde keinen Bildschirm (Rechenteil,
   Rückschau), das aktuellste Bild des Spielbilds.

## 7. Wann du anhältst

Schreibe die Frage unter **Fragen an den Benutzer** und arbeite an etwas
anderem weiter — oder beende die Runde, wenn nichts anderes geht:

- Etwas würde eine Zeile aus „Wird nicht gebaut" (ADR-0012) hereinholen, ein
  entschiedenes ADR aufrollen oder die Regel „Eröffnen verlangt ein Konto,
  Mitspielen nicht" berühren.
- Name des Spiels, Sonderregeln, Auswahl der Völker nach Beginn von Stufe E.
- Push, Deploy, Zugang zum VPS, Löschen von Daten außerhalb des Repositorys.
- Neue Abhängigkeit in `package.json` (außer für Tests). Begründen, fragen.
- Dreimal hintereinander am selben Fehler gescheitert.

## 8. Rückschau (jede fünfte Runde, und am Ende jeder Stufe)

Nicht bauen. Stattdessen:

1. Lies alle Runden seit der letzten Rückschau. Was hat wiederholt Zeit
   gekostet? Welche Fehler kamen zweimal?
2. Leite **höchstens drei** Verbesserungen ab und setze sie um: eine Hilfe für
   Tests, ein Prüfgriff, eine Regel in dieser Anweisung, ein Satz in `CLAUDE.md`.
   Diese Anweisung darfst du ändern; die Regeln unter „Wann du anhältst" und
   die Bedeutung von `fertig` nicht.
3. **Am Ende einer Stufe zusätzlich:** Starte eine Partie im Browser, mache ein
   Bild vom Spielbild nach einigen Minuten und sieh es an. Damit dort etwas
   passiert, spielt der Prüfgriff `ki` (`e2e/server.mjs`, Befehl `ki` mit
   `name`) die Wirtschafts-KI für beide Seiten; mit Zeitraffer 20 sind zehn
   Spielminuten eine halbe Minute (Rückschau nach Runde 54). Vergleiche ehrlich
   mit dem, was ein Spieler von AoE II erwartet: Was sind die **drei größten
   Lücken** in Lesbarkeit und Aussehen? Lege sie als `offen`-Kriterien in
   `bedienung.md` an.
4. Miss, was sich messen lässt (Tests, Laufzeit des Browserlaufs, Takt), und
   trage es unter **Messwerte** ein. **Vorher prüfen, ob die Maschine ruhig
   ist** — hier laufen oft Tests anderer Projekte mit:
   `Get-Process node, chrome | Group-Object ProcessName` in PowerShell. Sind
   fremde `vitest`-/`playwright`-Prozesse da, die Zeit nicht eintragen oder als
   „nicht vergleichbar" kennzeichnen (Runde 3: 52 s wurden 2,2 min).
5. Eintrag unter **Rückschauen**, und im Steuerstand die **nächste** Rückschau
   eintragen (diese Nummer plus fünf). Commit `Rueckschau nach Runde n`.
