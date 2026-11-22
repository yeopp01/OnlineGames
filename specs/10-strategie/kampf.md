# Kampf

**Bereich:** Strategie
**Kuerzel:** kampf
**Stand:** 24/27 fertig · 2 offen · 1 zurueckgestellt

## Zweck

Der Teil, der aus einer Wirtschaftssimulation ein Spiel macht. Drei
Kampfeinheiten, die sich gegenseitig schlagen — Stein, Schere, Papier mit
Laufwegen.

## Abgrenzung

| Gehoert dazu                  | Gehoert nicht dazu                        |
| ----------------------------- | ----------------------------------------- |
| Einheitentypen und ihre Werte | Ausbildung und Kosten → [Bauen](bauen.md) |
| Angriff, Schaden, Tod         | Bewegung → [Einheiten](einheiten-und-befehle.md) |
| Sichtweite                    | Siegbedingung → [Spielziel](spielziel.md) |

## Die Werte stehen in den Daten

Leben, Angriff, Rüstung, Reichweite, Tempo und Bonus jeder Einheit stehen in
`server/spiele/strategie/daten.js`, abgeschrieben aus der
[Vorlage](../../docs/strategie/vorlage-aoe2.md). Hier steht keine zweite
Tabelle — eine Tabelle, die neben den Daten herläuft, ist nach der dritten
Änderung falsch.

**Der Schaden** ist die eine Regel, die hierher gehört:

```
Schaden = max(1, Angriff − Rüstung des Ziels in dieser Art
                 + Bonus des Angreifers auf eine Klasse des Ziels)
```

`Art` ist **nah** oder **fern**: eine Einheit mit `reichweite: 0` trifft die
Nahrüstung, eine mit Reichweite die Fernrüstung. Der Bonus zielt auf eine
**Rüstungsklasse** (`kavallerie`, `infanterie`, `speer`, `bogenschuetze`),
nicht auf eine Einheitenart — so trifft derselbe Eintrag in Stufe D auch den
Ritter.

Der Kreis der Feudalzeit: **Speerkämpfer schlägt Reiter** (+15),
**Bogenschütze schlägt Speerkämpfer** (+3), **Plänkler schlägt
Bogenschützen** (+3). Damit ist keine Einheit immer richtig — die Bedingung
aus [Spielziel](spielziel.md) AC-10, gemessen in
[Fahrplan](fahrplan.md) AC-9.

## Abnahmekriterien

### Angreifen

- **AC-1** `fertig` **Rechtsklick auf Feindliches greift an** — Auf eine fremde Einheit oder ein
  fremdes Gebäude. Kein eigener Knopf, keine eigene Betriebsart. Die Einheit
  läuft hin, bis das Ziel in ihrer Reichweite ist, und schlägt dann zu.
  Mehrere Angreifer bekommen je ein eigenes Feld um das Ziel, wie beim Gehen
  ([Einheiten](einheiten-und-befehle.md) AC-20): sonst stehen drei dort, wo
  der erste gerade nah genug war, und im Bild übereinander.
- **AC-2** `fertig` **Kampfeinheiten wehren sich von selbst** — Was in die Sichtweite einer
  **stehenden** Kampfeinheit kommt, wird ohne Befehl angegriffen; wer einen
  Auftrag oder einen Weg hat, geht weiter. Ein Dorfbewohner tut das nicht: er
  arbeitet weiter, bis er selbst getroffen wird — dann lässt er die Arbeit
  liegen und schlägt zurück. Wer wacht, steht als Wert in den Daten, nicht als
  Frage nach der Einheitenart.
- **AC-3** `fertig` **Verfolgung endet** — Ein fliehendes Ziel wird höchstens fünf Felder weit vom
  Ausgangsplatz verfolgt, dann kehrt die Einheit dorthin zurück. Sonst zieht
  ein einzelner Reiter ein ganzes Heer quer über die Karte. Das gilt für die
  Verfolgung, die **niemand befohlen** hat — AC-2 und die Gegenwehr; ein
  ausdrücklicher Angriffsbefehl wird zu Ende gegangen, sonst ließe sich ein
  Fliehender nie stellen.
- **AC-4** `fertig` **Angriffslauf** — Ein Befehl auf ein leeres Feld, bei dem unterwegs alles
  angegriffen wird, was im Weg steht. Eingeschaltet mit `G`, ausgeführt vom
  nächsten Rechtsklick; danach ist die Betriebsart wieder aus. Das Marschziel
  bleibt gemerkt: nach jedem Gefecht geht der Marsch weiter, erst am Ziel ist
  der Lauf zu Ende. Nur Einheiten mit Angriff laufen an — ein Dorfbewohner
  geht einfach.
- **AC-5** `fertig` **Dorfbewohner kämpfen schlecht** — Angriff 3, keine Boni, keine Rüstung:
  fünfzehn Schläge für einen Soldaten, während er nach fünf fällt. Ein
  früher Überfall auf die Basis geht nicht widerstandslos durch — wer sich
  wehrt, sammelt nicht, und das ist der eigentliche Preis.

### Schaden

- **AC-6** `fertig` **Schaden nach der Vorlage** — `max(1, Angriff − Rüstung + Bonus)`, nah gegen
  die Nahrüstung, fern gegen die Fernrüstung, der Bonus auf die
  Rüstungsklasse des Ziels. Keine Verdopplung, keine Ausnahme je Einheit —
  eine Formel für alle.
- **AC-7** `fertig` **Jede Einheit hat ihre Nachladezeit** — Nach der Vorlage: Miliz, Soldat,
  Späherreiter und Dorfbewohner 2,0 s, Bogenschütze 2,0 s, Speerkämpfer und
  Plänkler 3,0 s. Ein gemeinsamer Takt für alle wäre lesbarer, verfälscht
  aber den Kreis — der Plänkler ist langsam, dafür billig.
- **AC-8** `fertig` **Kein Zufall im Schaden** — Gleiche Lage, gleiches Ergebnis. Würfel machen
  Niederlagen unerklärlich, und erklärbare Niederlagen sind das, was zur
  nächsten Partie führt.
- **AC-9** `zurueckgestellt` (abgeloest durch darstellung AC-8) **Leben ist sichtbar** — Der Lebensbalken über Beschädigtem ist
  mit Stufe A gebaut, dort geprüft und dort bebildert.
- **AC-10** `fertig` **Tote verschwinden nach zwei Sekunden** — Lange genug, um zu sehen, was passiert
  ist: der Gefallene kippt um, liegt blass am Boden und zählt vom Schlag an
  nicht mehr — nicht zur Bevölkerung, nicht zur Auswahl, nicht als Ziel.

### Sicht

- **AC-11** `fertig` **Sichtweite aus den Daten** — `sicht` je Einheit
  (vier bis sechs Felder), Gebäude acht. Was niemand sieht, wird nicht
  dargestellt. Seit Runde 105 rechnet der Browser die eigene Sicht nach
  derselben Regel wie der Server (AC-15) und lässt fremde Einheiten und Tiere
  außerhalb davon weg, ebenso als Ziel eines Rechtsklicks. Seit AC-13 schickt
  der Server sie gar nicht erst. **Seit dem 2026-11-15 liest auch der Server
  keinen Gegner aus einem Feld, das der Spieler nicht sieht**
  (`welt.feindAn`): ein Befehl in den Nebel ist ein Gang dorthin, auch wenn
  dort jemand steht. Vorher wurde daraus ein Angriff auf den, der zufällig
  auf dem Feld stand — der Befehl verriet, was die Leitung verschweigt, und
  der Späher der KI, ins unbekannte Dorf geschickt, griff den Hirten am
  Dorfzentrum an und fiel, bevor er das Dorf gesehen hatte (ki AC-13: mit
  den Standplätzen aus einheiten AC-30 fanden 5 von 40 den Gegner nicht).
  Erinnerte Gebäude bleiben ein Ziel.
- **AC-12** `fertig` **Erkundetes bleibt erinnert** — Gelände bleibt sichtbar, fremde Einheiten
  nicht. Der klassische Nebel: man weiß, wo der Wald steht, aber nicht, wer
  gerade dort ist. Fremde Gebäude stehen im Nebel so da, wie man sie zuletzt
  gesehen hat — auch wenn sie inzwischen gefallen sind; im Nebel gebaute
  kennt man nicht (Runde 105).
- **AC-13** `fertig` **Kein Blick durch fremde Augen** — Der Server schickt einem Spieler nur, was
  seine Einheiten sehen. Sonst liest ein verändertes Programm die ganze Karte
  mit. Je Spieler eine Zustandsnachricht: eigene Einheiten immer, fremde nur
  auf gesehenen Feldern; von den anderen Spielern nur Zeitalter, Kampfwerte und
  ob sie draußen sind, nicht ihre Vorräte (Verbündete, mit denen er die Sicht
  teilt, ausgenommen: bedienung AC-20); ein fremdes Gebäude, wenn man es
  sieht, und was ihm im Nebel geschieht, erst beim nächsten Hinsehen; ebenso
  Feldänderungen (ein gefällter Baum, ein neuer Bauplatz). Wer ausscheidet oder
  wenn alles aufgedeckt ist, bekommt alles (Runde 110).
- **AC-14** `fertig` **Angriff wird gemeldet** — Wer angegriffen wird, bekommt einen Hinweis und
  kann per Klick dorthin springen. Gebaut in Runde 115: jeder Treffer auf
  eine eigene Einheit oder ein eigenes Gebäude meldet dem Besitzer den Ort
  im nächsten Zustand, in seinem eigenen Spielereintrag — im Nebel sieht ihn
  sonst niemand (AC-13). Ein Gefecht an derselben Stelle (unter 15 Feldern)
  meldet sich einmal, solange keine 20 Sekunden ohne Treffer vergehen; jeder
  Treffer beginnt die Pause neu. Im Bild ein roter Knopf oben in der Mitte,
  zehn Sekunden lang; ein Klick setzt die Kamera auf den Ort.
- **AC-15** `fertig` **Sicht je Spieler berechnet** — Der Server rechnet je
  Spieler zweimal je Sekunde, welche Felder er **jetzt sieht** und welche er
  **je gesehen hat**. Eine Einheit sieht ihre Sichtweite aus den Daten, mit
  Verbesserungen (Dorfbewohner, Miliz, Speerkämpfer, Späher 4, Bogen und
  Plänkler 6); ein Gebäude acht Felder über den Rand seiner Grundfläche.
  Grundlage für AC-11 bis AC-13 und darstellung AC-15 — abgeteilt in Runde
  104, weil der Nebel mehr als eine Runde ist. Acht Spieler mit 800 Einheiten
  kosten je Rechnung unter 1 ms; eine ganze Partie rechnet damit rund 16 %
  länger — die Sicht der Gebäude wird nur neu gerechnet, wenn eines entsteht
  oder fällt (sonst 55 %). Außerhalb der Karte sieht niemand.
- **AC-16** `fertig` **Sicht beim Eröffnen einstellen** — Wunsch des Benutzers
  (2026-11-08). Eine Einstellung der Partie mit drei Werten: **Nebel**
  (Vorgabe — nur Gesehenes, wie AC-11 bis AC-13), **Erkundet** (die Karte ist
  von Anfang an bekannt, fremde Einheiten nur in Sicht) und **Aufgedeckt**
  (alles sichtbar). Sie steht im Warteraum wie jede Einstellung. Damit ersetzt
  sie den Prüfgriff `aufdecken`: Browsertests, die nicht vom Nebel handeln,
  eröffnen „Aufgedeckt". Gebaut in Runde 106: der Server kennt die Einstellung
  (`welt.sichtArt`, bei „Erkundet" ist alles erkundet, bei „Aufgedeckt" sieht
  jeder alles) und schickt sie mit dem Aufbau; der Browser zeichnet danach.
- **AC-17** `fertig` **Stadtwache weitet die Sicht** — Wunsch des Benutzers:
  Forschung verändert die Fläche des Nebels. Die Verbesserung Stadtwache im
  Dorfzentrum ab der Feudalzeit, 75 Nahrung, gibt allen eigenen Gebäuden +4
  Sicht (Vorlage). Als Wert in den Daten wie jede Verbesserung; Server und
  Browser rechnen die Sicht mit ihr. Die Stadtpatrouille (+4, Ritterzeit)
  folgt mit Stufe D. Gebaut in Runde 107: ein neuer Schlüssel `gebaeude` in
  den Daten einer Verbesserung (wie `farm`), `welt.gebaeudeSicht()` rechnet
  ihn ein, und nach dem Erforschen wird die Sicht der Gebäude neu gerechnet.
  Im Menü ein eigenes Bild, die Laterne des Nachtwächters.
- **AC-18** `fertig` **Außenposten sieht weit** — Ein Gebäude der Dunklen
  Zeit nur zum Sehen: 25 Holz, 25 Stein, 15 s, 500 Leben (Vorlage), Sicht 10.
  Gezeichnet und unterscheidbar wie jedes Gebäude (darstellung AC-14).
  Gebaut in Runde 109: ein hölzerner Wachturm auf einem Feld — vier Pfosten
  mit Streben, Plattform mit Licht, spitzes Dach, Wimpel in Spielerfarbe —,
  im Baumenü als letzter; seine Taste folgt wie bei jedem Gebäude der Stelle
  im Menü (Dunkle Zeit U, Feudalzeit P).

### Stufe D — Ritterzeit

- **AC-19** `fertig` **Flächenschaden** — Ein Schuss des Mangonels trifft alle
  Einheiten im Umkreis eines Feldes um den Einschlag, auch eigene, mit
  vollem Schaden in der Mitte und weniger am Rand. Der Einschlag ist dort,
  wo das Ziel beim Abschuss stand — wer läuft, kann ausweichen.
  _Gebaut in Runde 130: Der Stein ist ein Geschoss auf dem Server
  (`welt.steinWerfen`, `welt.einschlaegeTakten`), sieben Felder je Sekunde —
  so schnell, wie der Browser einen Pfeil zeichnet. Er trifft gleichmäßig
  abnehmend: in der Mitte voll, am Rand des Feldes die Hälfte. Ein Gebäude
  als Ziel bekommt den vollen Schaden. Wer vom eigenen Stein getroffen wird,
  wehrt sich nicht gegen den eigenen Werfer. Abgerechnet wird mit allen
  Schlägen des Taktes (AC-10)._
- **AC-20** `fertig` **Gebäude schießen zurück** — Was ein Gebäude mit Angriff
  angreift, bekommt Schaden nach derselben Formel wie von Einheiten
  (`max(1, Angriff − Rüstung + Bonus)`), mit Pfeilen als Fernkampf. Pfeile
  treffen Mauerwerk kaum (Gebäude 0/7, AC-5). Gebaut in Runde 125:
  `welt.schaden()` kennt ein Gebäude als Angreifer und liest dessen Werte
  über `gebaeudewert()`; ein Turm trifft den Dorfbewohner mit 5, die Miliz
  mit 4, den Plänkler mit 2, ein Gebäude mit 1. Der Pfeil geht wie der eines
  Schützen in den Zustand (bedienung AC-40), von der Mitte des Turms aus.
- **AC-21** `fertig` **Mauern halten auf** — Wer zu einem Ziel hinter einer
  Mauer will, geht außen herum, wenn es einen Weg gibt; gibt es keinen,
  greift er die erste fremde Mauer oder das erste fremde Tor auf seinem Weg
  an und nach ihrem Fall das Ziel dahinter. Fällt anderswo ein Mauerfeld
  und liegt das Ziel damit offen, geht er dorthin. Eigene Mauern bricht
  niemand. Eine Ramme bricht ein Feld Steinmauer mit fünfzehn Stößen (1800
  Leben, 127 je Stoß alle fünf Sekunden, Werte der Vorlage — 70 Sekunden),
  drei Rammen in unter einer halben Minute. Bis Runde 139 stand hier „eine
  Ramme in unter einer halben Minute"; das passt nicht zu den Werten der
  Vorlage. Gebaut in Runde 139: `welt.mauerImWeg()` sucht ein zweites Mal
  mit fremden Mauern als begehbar, auch schräg an einer Ecke vorbei.

### Aus dem Spiel auf dem Server

- **AC-24** `fertig` **Baustellen sehen nichts** — Ein Gebäude gibt Sicht
  erst, wenn es fertig ist. Eine Baustelle deckt nichts auf und erkundet
  nichts, auch ihren eigenen Grund nicht — sonst wäre ein Fundament in der
  Ferne ein Späher für ein paar Holz. Wer daran baut, sieht mit seiner
  eigenen Sichtweite. Mit dem letzten Schlag des Bauers sieht das Gebäude
  wie jedes andere (AC-15). Der Browser rechnet dieselbe Regel
  (`public/nebel.js`): eine eigene Baustelle im Nebel steht im Bild, hellt
  aber nichts auf.

- **AC-25** `fertig` **Befohlenes Ziel bleibt** — Wer auf Befehl eine
  Einheit angreift, bleibt an ihr, bis sie fällt, bekehrt ist oder
  wirklich kein Weg mehr zu ihr führt — auch wenn sie flieht und andere
  Gegner näher stehen. Die Wache wählt nur für den, der keinen Befehl hat
  (AC-2). **Aus dem Spiel auf dem Server (2026-11-13):** der Späher ließ
  den fliehenden Dorfbewohner laufen und schlug einen anderen — lief das
  Ziel schräg davon, galt es für einen Takt als unerreichbar (42 von 90
  gemessenen Verfolgungen).

- **AC-26** `offen` **Gleiche Heere, gleiche Chancen** — Stehen sich zwei
  gleiche Heere gegenüber, gewinnt jede Seite gleich oft: über 200
  Startwerte je Einheitenart liegt der Abstand zwischen links und rechts
  innerhalb des Dreifachen der Streuung eines Münzwurfs. Die Welt bleibt
  dabei bestimmt — dieselbe Partie zweimal gerechnet verläuft Takt für Takt
  gleich. Heute gewinnt bei gleichen Heeren meist eine Seite: über 200
  Startwerte Miliz 116 zu 84, Bogen 21 zu 179, Ritter 80 zu 120. **Was
  fehlt:** gebaut ist es als Patch (2026-11-22, nicht eingecheckt:
  Reihenfolge je Takt gemischt, Reichweite gegen die Lage zu Beginn des
  Takts, Gleichstände ohne Himmelsrichtung), aber damit reißen Grenzen, die
  nur der Benutzer lockert — mit den Gleichständen in der Wegsuche fahrplan
  AC-15, ohne sie die 200 Startwerte selbst, dazu ki AC-4.

- **AC-27** `offen` **Pfeile treffen beim Ankommen** — Der Schuss eines
  Fernkämpfers oder eines Turms trifft nicht im Takt des Abschusses,
  sondern wenn der Pfeil ankommt: so viele Takte später, wie er mit sieben
  Feldern je Sekunde für die Strecke braucht, mindestens einen. Der
  Schaden wird beim Abschuss gerechnet und beim Ankommen abgerechnet. Ein
  Pfeil trifft sicher — auch ein Ziel, das inzwischen weitergelaufen ist,
  und auch, wenn der Schütze inzwischen fiel. Fällt das Ziel vorher,
  verpufft er. Nahkampf trifft im Takt des Schlags, der Stein des Mangonels
  fliegt wie bisher (AC-19). **Aus dem Spiel auf dem Server (2026-11-13,
  Punkt 25):** „die Pfeile der Burg kommt irgendwie SOFORT beim opfer an" —
  der Schaden fällt im Takt des Schusses, der Pfeil im Bild fliegt danach
  noch eine halbe Sekunde. **Was fehlt:** gebaut ist es als Patch
  (2026-11-22, nicht eingecheckt), aber damit reißt ki AC-25 (zwei gegen
  zwei, Startwert 8: zwei Angriffsläufe, die der Test zum Verbündeten
  zählt — die Wache von KI 4 verteidigt dort einen eigenen Dorfbewohner am
  Platz des ausgeschiedenen Verbündeten), und der Nebeltest steht genau an
  seiner Grenze (105 von 120 vor Minute 60). Ob der Test die Verteidigung
  eigener Einheiten ausnehmen darf wie die eigener Gebäude, entscheidet der
  Benutzer.

### Stufe E und F — Häuser und Drache

- **AC-22** `fertig` **Getarnte sieht man spät** — Eine Einheit mit `getarnt` in
  den Daten (der Meuchler, einheiten AC-48; der Wert ist die Zahl der
  Felder, 2) zählt für einen Gegner erst als gesehen, wenn eine seiner
  Einheiten oder eines seiner fertigen Gebäude höchstens so viele Felder
  entfernt steht — bei einem Gebäude vom Rand der Grundfläche gemessen —,
  nicht schon in dessen Sicht. Was nicht gesehen ist, schickt der Server
  ihm nicht (AC-13), ein Klick auf das Feld ist ein Gang (AC-11), und seine
  Wache, seine Türme und sein Angriffslauf greifen es nicht an; ein
  laufender Angriff endet, sobald das Ziel wieder verborgen ist. Wer
  zuschlägt, steht ohnehin näher: im Nahkampf ist der Meuchler gesehen.
  Verbündete sehen ihn wie jede Einheit — entdeckt ist er für alle, die
  die Sicht teilen —, und bei der Sicht „Aufgedeckt" gibt es keine Tarnung
  (AC-16). Die Welt fragt an einer Stelle (`welt.siehtEinheit`,
  `welt.verborgen`), nicht jede Regel einzeln; auch die KI fragt dort.
  Gerechnet wird mit der Sicht, zweimal je Sekunde — so lange kann ein
  Meuchler, der wegläuft, noch gesehen sein.
- **AC-23** `fertig` **Den Drachen treffen nur Schützen** — Den fliegenden
  Drachen (einheiten AC-52) treffen nur Fernkämpfer mit Pfeilen, Türme und
  Burgen — kein Nahkämpfer, keine Ramme, kein Mangonel. Ein Rechtsklick
  eines Nahkämpfers auf ihn ist ein Gang dorthin, und wachende Nahkämpfer
  lassen ihn in Ruhe. Gefragt wird an derselben Stelle wie bei der Ramme
  (`nurGebaeude`): eine Regel in den Daten, kein Sonderfall je Einheit.
  Gebaut als `fliegt: { getroffenVon: ['bogenschuetze'] }` am Drachen und
  `welt.kannTreffen()` — die eine Stelle für Befehl, Wache und Gegenwehr;
  wer ein `geschoss` wirft (Mangonel, Onager), trifft ihn nicht, auch nicht
  mit der Fläche. Der Browser bekommt je Art `trifftFlieger` und zeigt am
  Zeiger nur dann „Angreifen“.

## Grenzfaelle

- Zwei Einheiten, die sich gegenseitig töten, sterben beide. Kein Vorrang für
  den, der zuerst dran war.
- Ein Gebäude im Bau, dessen Bauplatz von Feinden umstellt ist, wird trotzdem
  fertig — Bauen ist kein Kampf.
- Stirbt das Ziel, während der Angreifer noch hinläuft, bleibt er stehen und
  sucht sich nach AC-2 ein neues — er läuft nicht auf das leere Feld.
- Ein Ziel, das die Einheit nicht erreichen kann (auf der anderen Seite
  eines Gebäudes, das keine Mauer ist), lässt sie nach erfolgloser Wegsuche
  stehen; der Auftrag endet, statt endlos zu rechnen. Hinter einer fremden
  Mauer gilt AC-21. Ein **Angriffslauf** auf ein Feld hinter einer Mauer
  bricht nicht durch — er gilt einem Ort, nicht einem Ziel.
- Ein Gebäude ohne Leben verschwindet samt seinem Platz auf der Karte — über
  die Fläche lässt sich danach laufen und bauen. Trümmer gibt es nicht; die
  wären eine Entscheidung für Stufe C.
- Die Schläge eines Takts werden an seinem Ende zusammen abgerechnet. Nur
  deshalb sterben zwei Einheiten, die einander den letzten Schlag versetzen,
  beide.
- **Gebäude greift niemand von selbst an.** AC-2 gilt für Einheiten; sonst
  liefe jede Wache in das nächste fremde Dorfzentrum, statt zu Hause zu
  wachen.
- Vier Dorfbewohner **erschlagen** einen Soldaten (4 × 3 gegen 45 Leben sind
  vier Runden, er braucht für einen von ihnen fünf) — einer allein nie. Die
  frühere Fassung von AC-5 behauptete das Gegenteil; nach den Zahlen der
  Vorlage ist es falsch.
- Wer sich erst wehrt, **nachdem** er getroffen wurde, verliert eine Runde:
  im Zweikampf gegen einen Soldaten bringt ein Dorfbewohner deshalb 12 statt
  15 Schaden an.
- Ein Nahkämpfer geht beim ersten Hinlaufen seinen zugewiesenen Platz zu Ende
  (AC-1); war er einmal in Reichweite, schlägt er zu, sobald er wieder nah
  genug ist. Sonst laufen zwei, die einander jagen, aneinander vorbei, ohne je
  zu schlagen.
- **Im Angriffslauf werden nur Einheiten angegriffen, keine Gebäude** (AC-4
  nutzt dieselbe Wache wie AC-2). Sonst bliebe ein Marsch an der ersten
  fremden Mauer hängen, statt vorbeizugehen.
- Ein Angriffslauf **sammelt nicht und baut nicht**: derselbe Rechtsklick, der
  sonst einen Baum abholzt, ist im Angriffslauf ein Marsch dorthin.
- Die **Verfolgungsgrenze von fünf Feldern** (AC-3) gilt auch im Angriffslauf;
  am Ende der Verfolgung geht es aber nicht zum Ausgangsplatz zurück, sondern
  weiter zum Marschziel.
- Mehrere Wächter desselben Ziels **verteilen sich darum**, so wie beim
  befohlenen Angriff. Ohne das standen zwei zusammen losgeschickte Milizen auf
  demselben Punkt: die Platzsuche fragte die Karte, nicht die Einheiten.

## Hinweis zu AC-13

Das ist der einzige Punkt hier, der die
[Übertragung](../00-plattform/uebertragung.md) verändert: Heute bekommt jeder
Spieler den vollständigen Zustand. Sichtbereiche bedeuten, dass der Server je
Spieler filtert — mehr Rechenzeit je Takt und größere Nachrichten in Summe.
Wenn das teuer wird, ist es eine Entscheidung für ein ADR, keine Kleinigkeit
im Kampf.

Gemessen in Runde 110 (Startwert 3, 25 Spielminuten, KI gegen KI): zu zweit
0,050 → 0,079 ms je Takt für Zustand und Text, zu viert 0,121 → 0,272 ms — bei
100 ms je Takt kein Posten. Die Nachrichten werden kleiner: zu zweit 7,1 → 3,9
KB je Takt in Summe, zu viert 28,0 → 8,5 KB. Kein ADR nötig.

Noch offen (Fäden in den Erkenntnissen): Schafe gehen ungefiltert; der Aufbau
nennt die Startplätze aller und, bei der Rückkehr nach Abbruch, die Karte von
heute.
