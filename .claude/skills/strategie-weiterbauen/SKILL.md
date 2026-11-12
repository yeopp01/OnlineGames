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
   nicht grün wird (auf einen lokalen Zweig, mit Vermerk in den
   Erkenntnissen — siehe Abschnitt 6, Punkt 5). Fremde
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

1. **`npm run check` ist rot** → das reparieren. Nichts anderes. **Ebenso ein
   Browserfall, der in zwei vollen Läufen hintereinander fällt** — auch wenn
   er „bekannt wackelig" ist. ki AC-11 wackelte von Runde 110 bis 119 mit, bis
   er in jedem Lauf fiel und Runde 120 ganz kostete (Rückschau nach Runde
   121).
2. Ein Kriterium steht auf **`in-arbeit`** → weiterführen.
3. Ein Kriterium der aktuellen Stufe (oder eines, das sie voraussetzt) steht auf
   **`in-qa`** → fehlenden Beleg oder Nachweis liefern.
4. **Die Stufe hat noch keine Fach-Kriterien** → **Spec-Runde**: aus der
   [Vorlage](../../../docs/strategie/vorlage-aoe2.md) die Kriterien der Stufe in
   die Fach-Specs schreiben (Abschnitt 2). Nur Specs, kein Code.
5. Sonst das **nächste `offen`-Kriterium der aktuellen Stufe**, das nichts
   Ungebautes voraussetzt. Bei Wahl: das, welches am frühesten etwas im
   Browser Spielbares ergibt.
6. **Ist die aktuelle Stufe von außen gesperrt** — jedes offene Kriterium
   wartet auf eine Frage an den Benutzer oder auf eine fremde Sitzung —,
   dann ein `offen`-Kriterium einer **früheren** Stufe, das nichts
   Ungebautes voraussetzt; zuerst aus `bedienung.md`, weil dort Spielbares
   liegt, das jede Partie braucht. Die Rundenzeile sagt, dass und warum vom
   Fahrplan abgewichen wurde, und der Steuerstand nennt den Kandidaten der
   nächsten Runde. In Runde 180 stand dort nur „Arbeit wählen nach
   Abschnitt 1", und Abschnitt 1 hatte für diesen Fall keine Antwort; die
   Runden 181 und 182 bauten dann Gruppentasten, Umschalt und Doppelklick
   (Rückschau nach Runde 183).

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

**Ein Kriterium, das einen Mangel beheben soll, misst ihn zuerst — auf dem
Stand von heute.** Steht in seiner Begründung eine Beobachtung („die KI
sitzt ohne Gold fest", „der Karren bringt zu wenig"), ist sie oft viele
Runden alt. Bevor gebaut wird, dieselbe Messung noch einmal; gibt es den
Mangel nicht mehr, wird das Kriterium neu gefasst, bevor der erste Entwurf
steht. ki AC-26 kam aus einem Patt mit leerem Gold (Runden 114, 137, 144);
in Runde 162 lief das Gold über 88 KIs viermal aus, alle nach Minute 45 —
gemessen wurde dann an geleertem Gold. In Runde 161 ergab der Faktor der
Vorlage 10,7 Gold je Minute gegen 20 des Dorfbewohners; erst die Messung
zeigte, dass „wie im Original" hier „halb so viel" heißt (Rückschau nach
Runde 163).

**Und eine Ursache wird gemessen, bevor sie ein Kriterium wird.** „X
verliert, weil Y" ist eine Vermutung, bis Y **nur bei X** geändert wurde
und die Paarung gekippt ist: eine Austauschprobe (`--probe`), deren
ersetzte Methode nur für die KI des schwachen Hauses greift
(`this.neigung` sagt, welches). Eine Regel, die beide Seiten bekommen,
ändert eine Paarung nur, wenn sie der schwächeren mehr hilft. Und vor jeder
Vermutung über das „Was" die Zahlen über das „Wie viel":
`npm run pruefstand:haeuser` zählt je Haus Kampfeinheiten, Dorfbewohner und
Ausbildungsgebäude je Partie. In Runde 176 entstand ki AC-31 aus
„Distelhag antwortet nicht auf Schützen"; Runde 177 baute es, beide Seiten
antworteten, und Distelhag verlor weiter 0 zu 20 — über die Menge, 112
gegen 145 Kampfeinheiten aus 3,5 gegen 5 Gebäuden (Rückschau nach Runde
178).

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
  im Kriterium. **Eine Zahl im Kriterium, die aus anderen folgt (eine Dauer,
  eine Zahl von Treffern), wird aus den Werten gerechnet, bevor sie
  dasteht** — und spätestens beim Bauen nachgerechnet. „Eine Ramme bricht
  ein Feld Steinmauer in unter einer halben Minute" stand seit der
  Spec-Runde da; mit den Werten der Vorlage sind es 1800 / 127 = 15 Stöße
  zu fünf Sekunden, 70 Sekunden (Runde 139).
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
  **Vor einer neuen Datei `ls` auf den Namen**: Write überschreibt eine Datei,
  die früher in der Sitzung gelesen wurde, ohne Rückfrage — in Runde 159
  beinahe `tests/strategie-tempo.test.mjs` (fahrplan AC-6). Und kein `cat`
  ohne Datei in einer Kette: es wartet auf die Eingabe, der Befehl rutscht
  nach zwei Minuten in den Hintergrund (Runde 162).
  **Vor dem Abschlusslauf `npm run waechter`** — alle Wächter in Sekunden.
  In Runde 175 fiel der ganze Check nach sieben Minuten an einem Hausnamen
  in einem Kommentar (der Wächter dazu steht seitdem in
  `tests/waechter-haeuser.test.mjs`). **Und vor einer neuen Methode
  `grep -n "  <name>(" <datei>`**: in Runde 177 hieß eine neue Methode in
  `ki.js` wie eine vorhandene mit anderem Sinn; die spätere überschreibt
  die frühere still, und neun Tests fielen mit einer Meldung, die nach
  allem anderen aussah.
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
  **Seit den Häusern (Runde 167) laufen alle Wirkungen über
  `welt.wirkungen()`** — Haus zuerst, dann die Verbesserungen —, und der
  Browser rechnet keine selbst zusammen: was er braucht, nimmt
  `kampfwerte()` in die Tafel `kw` auf. `tests/waechter-wirkungen.test.mjs`
  sucht im Browser nach `verbesserungen[…].wirkung/sammeln/farm/gebaeude`
  (Rückschau nach Runde 168: `farmVoll` kannte das Haus nicht).
  **Wer `wirkungen()` eine neue Quelle gibt, sucht jede Stelle, die einen
  Erwartungswert selbst aus den Daten zusammensetzt** — in Tests ebenso wie
  im Browser: `grep -rn "HAEUSER\[\|\.boni\|VERBESSERUNGEN\[" tests/ e2e/ public/`.
  Zweimal hintereinander fand das erst ein roter Lauf: in Runde 167
  `farmVoll`, in Runde 171 die Messtests zu spielziel AC-17 und AC-26, die
  den Bonus eines Hauses aus `boni` erwarteten — der Mannschaftsbonus gilt
  aber auch dem Haus selbst (`mannschaftDazu`).
- **Ein neuer Eintrag in `daten.js` (Gebäude, Einheit, Verbesserung) fährt
  `npm run e2e:daten` vor dem vollen Lauf** — knapp fünf Minuten für die
  Browserfälle, die „alles, was die Daten für dieses Zeitalter sagen"
  aufstellen, seit der Rückschau nach Runde 130 auch die Spielerfarbe je
  Einheit und ob jede Figur in ihre Zelle der Schautafel passt
  (`strategie-unterscheidbar`). Eine neue breite Figur richtet man vorher
  mit `npm run tafel -- "t.ueberstand()"`. In den Runden 122 bis 125 fand dreimal erst der volle Lauf am
  Ende, dass so ein Fall am Neuen bricht (der Ritter in der Feudalzeit am
  Stück, der Wachturm, der den Reiter vor dem Speer traf, 13 Bautasten für 14
  Gebäude) — jedes Mal 13 Minuten und ein zweiter Lauf. **Handelt das Neue von
  selbst** (ein Turm schießt, ein Gebäude heilt), filtern diese Fälle es aus
  ihrer Aufstellung, sonst stört es ihre Messung. Namen, Zeichnung und Taste
  je Art prüft `tests/waechter-namen.test.mjs`, die Dateiliste von
  `e2e:daten` ebenso.
- **Eine neue Einstellung im Steckbrief fährt vor dem vollen Lauf
  `npx playwright test -c e2e/playwright.config.mjs spielauswahl
  strategie-einstieg`** (eine halbe Minute). Jede Einstellung verlängert
  zwei Formulare, den Vorraum und den Warteraum, und schiebt, was Tests
  sehen wollen, unter den Bildrand. Dreimal hintereinander fand das erst
  der volle Lauf oder die Bilddurchsicht danach: in Runde 155 das
  Hausbau-Formular und die Wartemeldung, in Runde 156 das Formular zu
  auswahl AC-4, in Runde 157 „Partie starten" im Warteraum — dort kostete
  es einen ganzen Lauf. Seit der Rückschau nach Runde 158 prüft
  auswahl AC-23 beide Formulare auf 1366 × 768 für **jede** Einstellung des
  Steckbriefs.
- **Ein Wert, der nicht in der Vorlage steht, wird nicht erinnert, sondern
  begründet** — und vorher nach Tests gesucht, die einen Wert über alle Arten
  vergleichen („sieht am weitesten", „das schnellste"): `grep -rn "sicht" tests/`.
  Die Sicht 10 des Wachturms „wie im Original" brach kampf AC-18 (Runde 125).
- **Wer ändert, was ein Rechtsklick tut, ändert drei Stellen zusammen**:
  `welt.befehl` (was der Server daraus macht), `ansicht.zielzeichenSetzen`
  (dieselbe Frage im Browser — rot oder weiß) und `kampfwerteZeile` in
  `public/auswahlleiste.js` (was die Leiste über die Einheit sagt). Ramme,
  Mönch und Bekehren haben je alle drei gebraucht; in Runde 134 fanden das
  rote Zeichen und „Angriff 0, Nahkampf" erst das Ansehen des Bildes. Und
  **ein neuer Merker, der `w` speist** (`sammelt`, `heilt`, `bekehrt`),
  wird in `befehl()` und `einheitSterben()` zurückgesetzt —
  `tests/waechter-merker.test.mjs` sucht danach (Rückschau nach Runde 135).
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
- **Ein Test, der nach einer festen Zahl Takte misst, fragt vorher, was in
  diesen Takten überhaupt rechnet.** Die Sicht rechnet alle `SICHT_TAKTE`,
  nicht jeden Takt (Runde 170: ein Takt nach dem Aufstellen sah nichts); eine
  Fahrt des Karrens dauert länger als die Frist einer Kündigung (Runde 171:
  96 gegen 60 Sekunden — nach der Frist sind beide Gegner und die Strecke
  endet); ein Fortschritt mit einem Tempo ist ein Bruch, und 175 · 1,2 ergibt
  209,99999 (Runde 171: ein Takt zu viel). Statt fester Takte: laufen, bis
  die Bedingung gilt, mit Obergrenze — und die Dauer, auf die es ankommt,
  vorher aus den Werten rechnen.
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
  **Bleibt eine Gegenprobe grün, tut eine zweite Stelle dasselbe.** Dann
  diese Stelle suchen, nicht die Gegenprobe wegwerfen, und fragen, was nur
  das Neue leistet — das wird die Zusicherung. In Runde 181 blieb die
  Gegenprobe zu „Gefallene fallen aus der Gruppe" grün: die Ansicht nimmt
  Gefallene mit jedem Zustand ohnehin aus der Auswahl. Was der neue Filter
  allein tut, ist die **Ablage** sauber halten; erst die Zusicherung darauf
  fiel ohne ihn. **Und ein Test sagt keine Wahl der Simulation voraus** —
  welches Ziel eine Einheit zuerst nimmt, wer zuerst fällt: er wartet auf
  *irgendeines* und rechnet mit dem, das es war. In Runde 181 nahm die Miliz
  den Gesunden zuerst, nicht den mit einem Leben.
  **Und dieselbe Messung einmal gegen den alten Stand, bevor ihre Zahl
  gilt** — `npm run pruefstand:vergleich -- --gegen HEAD` mit derselben
  Aufstellung (`--teams 1,1,2,2`, `--spieler`), beim Rechenteil
  `npm run gegenprobe`. Zeigt der alte Stand dieselbe Zahl, misst sie nicht
  die Änderung. Zweimal hintereinander wäre es sonst durchgerutscht: in
  Runde 150 ließ der Test am Ende nur Anna stehen, und „einer bleibt übrig"
  galt auch nach der alten Regel; in Runde 151 standen die Verbündeten über
  Eck, der nächste Nachbar war ohnehin ein Gegner, und die alte KI rechnete
  Takt für Takt dieselben Partien. Erst der Fall, in dem alt und neu
  **verschieden antworten** (der einzige Gegner fällt, die Verbündeten sind
  Nachbarn), belegt etwas. Zu viert liegen die Dörfer im Quadrat: KI 1 und 2
  sind Nachbarn, KI 1 und 3 über Eck (Rückschau nach Runde 152).
  **Und ein Sieg belegt nicht, warum.** Für jede Paarung fragen, welcher
  Wert sie tragen soll, ihn einzeln abschalten (`npm run gegenprobe` auf
  die Zeile in `daten.js`) und sehen, ob sie dann fällt. In Runde 138 gewann
  der Mangonel gegen Bogenschützen auch ohne Flächenschaden 20 von 20 — über
  seine Fernrüstung, nicht über den Haufen; erst eine dritte Zusicherung
  (Treffer je Stein) belegte die Fläche. In Runde 139 hielt die Gegenprobe
  mit Rammen ohne Gebäudebonus den Vergleich fest.
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
  (`tests/strategie-ki-ritterzeit.test.mjs`): `node --test` rechnet Dateien
  nebeneinander, Tests einer Datei nacheinander. Hinter den Messungen in
  `strategie-ki.test.mjs` verlängerte zwanzig Partien `npm run check` von 48
  auf 88 Sekunden (Runde 97). **Rechnet sie zu viert oder über eine Minute je
  Datei, kommt sie nach `tests/partien/`**: dieser Ordner läuft als zweiter
  Abschnitt von `npm test`, nach allen Zeitmessungen. Neben den vier Dateien
  zwei gegen zwei riss einheiten AC-31 (800 Angreifer unter 1 ms), und ein
  niedrigerer Vorrang half nicht (Rückschau nach Runde 152).
  `tests/waechter-testordner.test.mjs` hält beides fest. **Und `check:kurz`
  warnt** („WARNUNG: … s im ersten Abschnitt"), sobald ein Test dort über
  90 s rechnet (`scripts/lange-tests.mjs`): bis Runde 173 lag die
  Aufgeben-Messung mit 171 s im ersten Abschnitt und machte ihn allein
  205 s lang — die Regel stand da, die Dauer sah niemand.
  **Wer Bewegung oder Kampf ändert, vergleicht auf zwei Sätzen Startwerte**
  (`npm run pruefstand:vergleich -- --minuten 90 --saetze 2`): eine solche
  Änderung verschiebt jede Partie, und ein Satz allein zeigt Zufall als
  Wirkung. In Runde 100 sah erst der zweite Satz, dass die Partien
  systematisch länger wurden — und dass fahrplan AC-11 auch mit HEAD nur 19
  von 20 schafft.
  **Und zwar gleich nach dem ersten Entwurf — vor Tests, Spec und
  Durchsicht**, wenn Bewegung, Kampf oder das **Wissen der KI** sich ändern.
  Zweimal hintereinander kam der Vergleich zuletzt und warf die Runde um:
  in Runde 111 zog Abstand im Gehen das Heer zur Schlange, in Runde 112
  machte die eigene Sicht der KI die Partien sieben Minuten länger — beide
  Male stand alles andere schon. Verschiebt der Vergleich die Enden, zuerst
  mit `pruefstand:verlauf` zwei, drei der langen Startwerte ansehen, **wo**
  es fehlt (Mittelspiel? Abräumen?), dann eine Abhilfe bauen. Teile einzeln
  zurückzuschalten hilft wenig: die Partien sind chaotisch, jede Änderung
  verschiebt jeden Verlauf, und in Runde 112 erklärte jeder Teil „einen
  Teil".
  **Eine Frage der Art „liegt es an dieser Methode?" ist eine
  Austauschprobe**, kein Wegwerfskript: eine kleine CommonJS-Datei, die
  über `laden('ki.js')` eine Methode ersetzt, und `npm run
  pruefstand:vergleich -- --gegen HEAD --probe <datei> --saetze 3`. Die
  Probe greift nur im Arbeitsstand. **Zwei Varianten gegeneinander
  brauchen 60 Startwerte** (`--saetze 3`): auf 20 streut die Zahl der
  Partien vor Minute 60 um ±2. In Runde 144 lagen fünf Varianten zwischen
  36 und 39, und erst 60 Startwerte trennten eine davon (Rückschau nach
  Runde 147).
  **Eine Gegenprobe an einem einzelnen Startwert einer ganzen Partie ist
  brüchig**: jede fremde Änderung verschiebt den Verlauf. Die Gegenprobe zu
  ki AC-19 hing an Startwert 5 und brach in Runde 100, ohne dass das Aufgeben
  sich geändert hatte. Lieber eine gebaute Lage (`new Welt`, Einheiten
  setzen, eine Regel aufrufen); muss es eine ganze Partie sein, dann mit
  Abstand (die Wirkung mindestens fünf Minuten, nicht knapp über der Grenze)
  und mit der Messung über alle Startwerte im Kommentar.
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
  **Ein Prüfgriff, der eine Spielregel abschaltet, ist oft eine fehlende
  Einstellung.** Vor einem neuen Griff fragen: Würde ein Spieler das beim
  Eröffnen wählen wollen, wie im Original? Dann ist es eine Einstellung im
  Steckbrief, und der Test eröffnet damit — derselbe Weg wie ein Mensch. In
  Runde 105 hob der Griff `aufdecken` den Nebel auf; der Benutzer sah nach
  einer Runde, dass es die Einstellung „Sicht" sein muss (Runde 106).
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
- **Ein Kampfbild, das mit einem Befehl beginnt, stellt den Angreifer
  außer Sicht auf** und lässt ihn auf Befehl herankommen. Wer wacht, nimmt
  sich den Nächsten in Sicht von selbst: der Mangonel (Sicht 9) warf in
  Runde 130 auf den linken Speerkämpfer, bevor der Rechtsklick auf den
  mittleren ankam. Und **Lebensbalken stehen bei Einheiten nur an der
  Auswahl** — ein Bild von Treffern wählt die Getroffenen auf der Seite
  ihres Besitzers. `h` fehlt bei vollem Leben (Drahttafel oben in
  `e2e/helpers/strategie.mjs`): den Ausgangswert liest `lebenVoll(e)`.
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
  Spielbild-Dateien kopieren nichts davon. **Wer auf eigene Figuren
  klickt**, hält erst die Zeit an (`zeitraffer(page, code, 0)`) und nimmt
  die Punkte aus `eigeneImBild(page)`: je Einheit Fußpunkt (`x`, `y`),
  Klickpunkt an der Körpermitte (`klick`), Kürzel (`k`) und ob der Fußpunkt
  im Bild steht (`imBild`). So liefen in Runde 182 Umschalt-Klick, Rahmen
  und Doppelklick beim ersten Mal grün; vorher schrieb jede Datei ihre
  eigene Liste.
- **Warten auf Spielzeit** geht über den Zeitraffer (bis 20), nicht über die
  Uhr: wer länger als fünf Sekunden auf etwas wartet, das im Spiel dauert, dreht
  ihn hoch — und rechnet Abstandsgrenzen mit ein, denn ein Zustand fasst dann
  mehrere Takte. `npm run e2e:laufzeiten -- strategie` zeigt die Dauer je Datei
  und die langsamsten Fälle **aus dem letzten Browserlauf** (jeder Lauf legt
  `e2e/.ergebnisse/bericht.json` ab; bis Runde 140 fuhr das Skript selbst
  einen ganzen Lauf); nach einer Runde mit neuen Browsertests ansehen.
  **Einen Treffer misst `ersterTreffer(page, code, { einheit, ziel })`**
  aus derselben Hilfe — rotes Zeichen als Beleg für den Klick, vierfache
  Zeit, der erste Abfall gelesen, wenn er kommt. Die Feudalzeit und die
  Ritterzeit am Stück hatten das je selbst geschrieben, beide kostete es
  Läufe (Runden 99, 100, 140).
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
  **Die Wiederholung allein sieht nicht alles:** sie läuft ohne die Last des
  vollen Laufs. Ein Kampf, dessen Bild von einem Zeitfenster abhängt, braucht
  eine Szene, die stillhält — ein Gebäude als Ziel statt einer Einheit, die
  herankommt. Der Pfeiltest war allein zehnmal grün und fiel im vollen Lauf,
  weil Berts Miliz heranstürmte und alle Schüsse zu kurz wurden (Runde 119).
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
  **Wer etwas verbirgt — Nebel, Verdeckung, ein Filter —, bricht Bilder.**
  Die Tests prüfen die Daten (`ansicht.nachher`), nicht, was gezeichnet ist.
  Dann bei jedem Bild über der Grenze die eine Frage: Ist alles, was die
  Unterschrift nennt, noch zu sehen? In Runde 105 waren es sieben Bilder mit
  grünen Tests — das Heer der KI, der See, Berts Siedlung, alle im Nebel.
  Gezeichnet ist, was in `ansicht.reihenfolge` steht. **Verbirgt es der
  Server oder die KI, brechen auch Tests** — alle, die Fremdes lesen: in
  Runde 110 acht (fremde Vorräte, Berts Einheiten), in Runde 112 sechs (die
  KI sollte den Gegner kennen). Vorher in `tests/` und `e2e/` suchen, wer
  fremde Daten liest; **wer nicht vom Nebel handelt, eröffnet aufgedeckt**
  (`partieZuZweit(…, { sicht: 'aufgedeckt' })`, `new Welt(…, { sicht:
  'aufgedeckt' })`). Wer vom Nebel handelt, prüft das Verbergen selbst — wie
  der Test zu auswahl AC-19, der seit Runde 110 verlangt, dass von der KI
  nichts ankommt.
- Kein Bildschirm: Eintrag in `qa/ohne-bild.json`, der sagt, **was** das
  Kriterium ist und **warum** ein Bild es nicht zeigen kann.

## 6. Prüfen und festhalten

0. **Eine Durchsicht ohne deine Schlüsse**, bevor der Abschlusslauf beginnt,
   wenn die Runde Simulation, KI oder Kampf geändert hat: ein Subagent
   (`feature-dev:code-reviewer`, `model: sonnet`, nur lesend) bekommt den
   Unterschied der Produktdateien **als Datei**: `npm run durchsicht` schreibt
   alles Geänderte und Neue außer Dokumenten hinein (mit Pfaden nur diese)
   und nennt den Pfad — der gehört in den Auftrag. Der Prüfer hat keine Shell
   und las in Runde 97 die Dateien statt des Unterschieds; in den Runden 151
   bis 162 hieß der Auftrag trotz dieser Regel „führe `git diff` aus", und
   der neue Test der Runde stand ohnehin in keinem `git diff` (Rückschau nach
   Runde 163). Dazu eine Beschreibung des **Verhaltens**, nicht deines
   Urteils — und sucht Fehler, Randfälle, Determinismus, was die KI nicht
   sehen dürfte. Seine Befunde prüfst du am Code nach, bevor du handelst; jeder
   echte bekommt einen Test mit Gegenprobe — **gegen die alte Zeile**:
   `npm run gegenprobe -- <datei> "<neue Zeile>" "<alte Zeile>" -- node --test
   <testdatei>` ersetzt genau eine Stelle, lässt laufen und schreibt die Datei
   **immer** zurück, auch wenn der Befehl fällt oder abbricht; der Test muss
   fallen. Mit `--datei <ersatz>` statt der zwei Texte tauscht sie die ganze
   Datei (etwa gegen `git show HEAD:<datei>`). Nicht von Hand mit Kopie und
   `sed`: in Runde 112 schob ein Zeitlimit den Befehl in den Hintergrund,
   bevor das Zurückkopieren lief. Nicht `git stash`: das nimmt den neuen
   Test mit weg, und „grün" heißt dann nichts (Runde 97). Die Durchsicht traf
   in jeder der Runden 94 bis 97. In Runde 86 trafen zwei von fünf
   Befunden, einer davon ein Fehler, den die Runde eine Stunde vorher selbst
   eingebaut hatte — kein Test hatte ihn gesehen. Kosten: rund 90 Sekunden.
   Ebenso kann ein Subagent die Bilder über 1 % aus `qa:abweichung` gegen ihre
   Unterschriften lesen (Runde 87: dreizehn Bilder in 73 Sekunden); was er
   beanstandet, siehst du selbst an. **Hat die Runde Stylesheet oder
   Seitenaufbau geändert, ist diese Bilddurchsicht Pflicht**, nicht Wahl —
   und zwar mit der Frage „sieht etwas kaputt aus?" (abgeschnitten,
   überdeckt, schlecht verteilt), nicht nur „stimmt die Unterschrift?".
   In den Runden 155, 156 und 157 fand sie jedes Mal Fehler bei grünen
   Tests: zwei Bilder mit Inhalt unter dem Rand, eine schmale Karte allein
   in ihrer Zeile, eine Absage am falschen Ort, einen abgeschnittenen
   Startvorrat und Werte, die vor dem falschen Namen standen. Den
   Unterschied zur alten Fassung holt der Subagent mit `git show
   HEAD:<pfad>`.
1. Status auf `fertig`, `npm run specs:board`.
2. Oberfläche angefasst → `npm run check:alles:kurz`, sonst `npm run check:kurz`.
   **Hat sich das Aussehen geändert** (Figuren, Gebäude, Gelände, Leiste,
   Stylesheet), dann `npm run check:alles:neu:kurz`: derselbe Lauf, aber er
   schreibt jedes Bild neu. Ein Lauf statt zwei — danach
   `npm run qa:abweichung` und die Bilder über 1 % ansehen.
   **Das gilt auch, wenn sich nur das Verhalten geändert hat, das ein Bild
   zeigt** — die KI, die Wegsuche, der Kampf: die Bilder aus
   `strategie-ki`, `strategie-team-gegen-ki` und alle, die eine Partie
   laufen lassen, zeigen sonst den alten Verlauf, und die Tests sind grün.
   Runde 165 machte die KI blind für alles außerhalb ihrer Sicht und fuhr
   `check:alles`; erst Runde 166 schrieb die Bilder neu (ki AC-11 97 %,
   fahrplan AC-12 87 % geändert). Waisen nach geänderten Unterschriften
   räumt `qa:nachweis` vor dem Lauf selbst weg (`npm run qa:waisen` zeigt
   sie; Rückschau nach Runde 168).
   **In der Schleife immer die `:kurz`-Form**: sie zeigt die Zahlen und bei
   einem Fehler die Fehlerstelle, und spart je Lauf rund 8.000 Token an „ok"
   nach „ok" (Runde 60). Die ganze Ausgabe steht in `qa/letzter-lauf.log`,
   wenn mehr gebraucht wird.
3. Regeln oder Werte geändert und der Prüfstand existiert (fahrplan AC-4) →
   `npm run pruefstand:strategie`, Zahlen unter **Messwerte**. **Vorher und
   nachher in einem Befehl:** `npm run pruefstand:vergleich` (Arbeitsstand
   gegen HEAD; `--gegen HEAD~3 --minuten 30 --partien 20`). Nicht mehr mit
   `git stash` und Kopien des Ordners von Hand (Rückschau nach Runde 92).
   **Wer der Simulation je Takt Arbeit hinzufügt, liest dort die Zeile
   „ms je 1000 Takte"** — seit der Rückschau nach Runde 108 vergleichbar
   (aufgewärmt, abwechselnd gerechnet; Rauschen rund 4 %). Die Sicht machte
   eine Partie in ihrer ersten Fassung um 55 % langsamer, und erst ein
   Wegwerfskript zeigte es (Runde 104).
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
   **nicht** auf `strategie` committen, was rot ist. Die Arbeit kommt auf
   einen **lokalen Zweig** (`git checkout -b strategie-<thema>`, Commit dort
   mit „Zwischenstand, nicht grün" im Betreff, zurück auf `strategie`), und
   der Faden nennt Zweig und Commit — nicht `git stash`, das niemand
   wiederfindet (Runde 112: `strategie-ki-sicht`). Die nächste Runde, die es
   aufnimmt, holt den Zweig mit `git merge`.
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
