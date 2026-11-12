# ADR-0014: Eine eigene Welt aus Häusern statt historischer Völker

**Status:** entschieden — alle Zahlen darin sind Startwerte und werden beim
Bauen gemessen („können wir später immer noch justieren")
**Datum:** 2026-11-10
**Löst ab:** in [ADR-0012](0012-aoe2-als-vorlage.md) die
Zeile der Stufe E („Fünf Völker als Daten") und aus Punkt 4 den Satz über
historische Namen; im [Fahrplan](../../specs/10-strategie/fahrplan.md) den
Text von AC-16 (Franken, Briten, Teutonen, Mongolen, Byzantiner) und unter
„Sonderregeln" den Umriss vom 2026-11-09 („fünf Startvölker der Antike mit
Nachfolgevölkern").

## Frage

Das Spiel soll ein eigenes Gesicht haben statt einer Kopie der Vorlage. Am
2026-11-09 hieß die Antwort: fünf Völker der Antike, die mit den Zeitaltern
zu Nachfolgevölkern werden. Am 2026-11-10 kamen zwei andere Einfälle des
Benutzers: das ganze Spiel in die Antike legen — oder „im Stil von Game of
Thrones", weil das „wirklich neue Themen" bringt.

Geprüft wurde beides:

- **Die Antike geht**, vier Stufen und passende Einheiten gibt es (Hoplit
  statt Speerkämpfer, Kataphrakt statt Ritter, Onager statt Mangonel,
  Priester statt Mönch). Sie tauscht aber nur das Kostüm: keine Regel wird
  anders, und die Begriffe des Mittelalters stehen heute 1057-mal in 66
  Dateien, dazu in mindestens 19 Bildnachweisen.
- **Die Welt der verfeindeten Häuser** ist technisch Mittelalter. Ritter,
  Armbrust, Burg, Mönch und Mauern bleiben, wie sie gebaut sind. Ihr Thema —
  Verbündete, die einander verlassen — ist das, was dieses Spiel schon von
  der Vorlage unterscheidet: Bündnisse mit Kündigung und Frist
  ([ADR-0013](0013-buendnisse-karren-dauer.md)), und der Name *Fading Allies*.

## Entscheidung

**1. Das Spiel spielt in einer eigenen Welt, in der Häuser um die Krone
streiten.** Die Technik ist die des Mittelalters, wie gebaut. Keine Einheit,
kein Gebäude und keine Verbesserung wird umbenannt. Die Nachfolgevölker vom
2026-11-09 entfallen: ein Haus bleibt über alle vier Stufen dasselbe.

**2. Nichts aus fremden Werken.** „Game of Thrones", Westeros, Stark,
Lannister und alle Figuren, Orte, Wappen und Wahlsprüche daraus sind
geschützt und erscheinen nirgends, so wie „Age of Empires" nirgends erscheint
(ADR-0012 Punkt 4). Frei ist, was niemandem gehört: dass Adelshäuser sich
bekriegen, dass eines reich ist und eines im Gebirge sitzt, dass Bündnisse
brechen. Die Namen unten sind erfunden und gegen die Hauptnamen der Vorlage
abgeglichen, so weit bekannt — eine Markenrecherche ist das nicht.

**3. Fünf Häuser, jedes mit einem Schwerpunkt.**

| Haus | Sitz | Wappen | Wahlspruch |
| --- | --- | --- | --- |
| **Eschenbruch** | Waldland | Esche | „Weit sehen, weit treffen." |
| **Rappenstein** | Grasland | Hengst | „Zuerst am Ziel." |
| **Wehrstein** | Gebirge | Turm | „Stein vergisst nicht." |
| **Silberfurt** | Flussstadt | Waage | „Alles hat seinen Preis." |
| **Distelhag** | Heide | drei Disteln | „Wer uns greift, blutet." |

Das Wappen ist ein **Zeichen, keine Farbe**: die Farbe gehört dem Platz, und
zwei Spieler dürfen dasselbe Haus wählen.

| Haus | Schwerpunkt | Boni | Spezialeinheit | Mannschaftsbonus |
| --- | --- | --- | --- | --- |
| Eschenbruch | Fernkampf, Holz | Holz +15 %; Schützen +1 Reichweite | **Kriegswölfe**: schnell wie ein Reiter, aber kein Reiter — der Speer hat keinen Bonus gegen sie | Schießanlagen der Verbündeten bilden 20 % schneller aus |
| Rappenstein | Reiterei, Tempo | Reiter +15 Leben; Reiter sehen 2 Felder weiter | **Reiterschütze**: schießt vom Pferd; getroffen als Reiter *und* als Schütze | Reiter der Verbündeten sehen 2 Felder weiter |
| Wehrstein | Befestigung, Stein | Stein +15 %; Gebäude +10 % Leben; Turm und Burg +1 Reichweite | **Riese**: viel Leben, langsam, großer Bonus gegen Gebäude | Gebäude der Verbündeten sehen 2 Felder weiter |
| Silberfurt | Handel, Gold | Marktgebühr 15 % statt 30 %; Karren +20 % Gold | **Meuchler**: getarnt — Gegner sehen ihn erst aus zwei Feldern; hoher Bonus gegen Dorfbewohner und Mönche, wenig Leben | Karren zwischen Verbündeten bringen 20 % mehr |
| Distelhag | Infanterie | Infanterie +1 Rüstung gegen Hieb und Pfeil; Farmen +45 Nahrung | **Wiedergänger**: Untote — kosten keine Nahrung, lassen sich nicht bekehren und nicht heilen, langsam | Kasernen der Verbündeten bilden 20 % schneller aus |

**Alle Zahlen sind Startwerte und nicht gemessen.** Sie werden im Prüfstand
eingestellt wie der Faktor des Marktkarrens.

Ein sechster Schwerpunkt — der Glaube, also Mönch und Kloster — bekommt kein
eigenes Haus. Fünf waren gewollt, und der Mönch ist die Einheit, die die KI
am schlechtesten spielt.

**4. Ein Haus ist Daten** (spielziel AC-17, fahrplan AC-17 bleiben). Jedes
Haus kann alles bauen, was es heute gibt — kein eigener Technikbaum
([Spielziel](../../specs/10-strategie/spielziel.md), „Zu den Völkern": der
kostet Wochen). Ein Bonus hat die Form, die eine Verbesserung schon hat —
`wirkung` je Klasse, `sammeln` als Faktor, `gebaeude` —, und gilt von Beginn
an. `welt.einheitenwert()` liest heute die Verbesserungen des Spielers in
einer Schleife; das Haus kommt dort dazu.

Was diese Form **heute trägt** (gelesen in `daten.js` und am Kopf von
`einheitenwert`): Angriff, Rüstung, Reichweite, Leben und Sicht je Klasse,
Sammelrate je Rohstoff, Leben und Sicht aller Gebäude, Nahrung je Farm. Was
**eine neue Lesestelle braucht**: Ausbildungszeit, Marktgebühr, Ertrag des
Karrens, Reichweite nur für Turm und Burg. Ob `gebaeudewert()` einen Bonus
je Gebäudeart trägt, ist nicht geprüft.

**5. Die Spezialeinheit kommt aus der Burg** wie in der Vorlage, also ab der
dritten Stufe. **Sie kommt aus dieser Welt, nicht aus der Vorlage** (Benutzer,
2026-11-10: „Assassinen, Drachen, Untote"). Der erste Entwurf hatte
Langbogen, Pavese und Söldner — das wären Einheiten der Vorlage unter neuem
Namen gewesen, und genau das eigene Gesicht hätte gefehlt.

Vier der fünf entstehen trotzdem **aus Fähigkeiten, die es gibt**: Klassen,
Bonus, Rüstung, Kosten, Tempo. Kriegswölfe sind eine schnelle Nahkampfeinheit
mit eigener Klasse; der Riese trägt den Bonus der Ramme auf zwei Beinen; den
Wiedergänger nimmt die Klasse `untot` in der Liste `nicht` des Mönchs vom
Bekehren aus. Ob das Heilen dieselbe Liste liest, ist nicht geprüft.

**Was der Wiedergänger kostet — Vorschlag: Gold und einen Gefallenen.**
Jede eigene Einheit, die stirbt, zählt für Haus Distelhag als ein
Gefallener; gezählt wird beim Sterben schon heute, für die Tafel am Ende.
Ein Wiedergänger kostet etwa 30 Gold und einen Gefallenen und steht nach
zehn Sekunden. Damit kann das Haus nie mehr Wiedergänger rufen, als es
verloren hat, und ein gefallener Wiedergänger zählt nicht noch einmal. Die
Welt bezahlt Kosten über jeden Schlüssel, den der Spieler als Zahl trägt
(`Object.entries(kosten)`), ein Zähler `gefallene` ginge also denselben Weg
wie Holz. Das ist ein Zurückkommen für den, der eine Schlacht verloren hat
(spielziel AC-4), mit einer Decke, die sich messen lässt.

**Er steht an der Burg auf, nicht dort, wo jemand fiel.** Die Gefallenen
sind eine Zahl, kein Ort. Stünden sie auf dem Schlachtfeld auf, käme der
Nachschub ohne Weg mitten ins fremde Dorf — der Weg dorthin ist aber der
Vorteil des Verteidigers. Billig ist der Wiedergänger trotzdem nur
scheinbar: bezahlt wurde schon der, der gefallen ist.

**Wie stark er ist — Startwerte, gerechnet, nicht gemessen:** 60 Leben,
Angriff 6, Rüstung 1 gegen Hieb und 0 gegen Pfeile, Tempo 0,7 (so langsam
wie der Mönch; Soldat 0,9). Er zählt als Infanterie, bekommt also die
Verbesserungen der Schmiede und den Bonus des Hauses. Im Zweikampf schlägt
er einen Soldaten (45 Leben, Angriff 6) mit etwa einem Drittel seines
Lebens und verliert klar gegen einen Ritter; vier Wiedergänger schlagen
einen Ritter. **Seine Antwort sind Schützen:** ohne Rüstung gegen Pfeile
und langsamer als jeder Bogenschütze (0,96) holt er sie nie ein. Und weil
ihn kein Mönch heilt, bleibt jeder Treffer.

**Der Meuchler braucht eine neue Regel: Tarnung.** Der Server schickt jedem
schon heute nur, was er sieht (kampf AC-13); eine getarnte Einheit zählt
dort erst aus zwei Feldern als gesehen, und Wache und Türme greifen nur an,
was gesehen ist. Das ist eine Stelle, aber sie ist neu und wird gemessen.

Namen aus fremden Werken bleiben draußen (Punkt 2): Meuchler, Wiedergänger,
Riese und Drache gehören niemandem, einzelne Figuren und Orden schon.

**6. Der Mannschaftsbonus gilt, solange das Bündnis hält.** Wer kündigt,
verliert mit der gemeinsamen Sicht sofort auch den Bonus seiner Verbündeten,
und sie den seinen. Damit hat der Verrat einen Preis, der sich aus dem Haus
des Verlassenen ergibt, und es braucht dafür keine eigene Sonderregel zu
Bündnissen (ADR-0013, „Was dieses ADR nicht hereinholt"). Gefragt wird
`welt.teiltSicht`, nicht `welt.feindlich` — in der Frist ist man kein Gegner,
aber auch kein Verbündeter mehr.

**7. Gewählt wird das Haus im Warteraum, je Platz**, wie das Team (auswahl
AC-22): der Steckbrief beschreibt die Wahl unter `jePlatz`, der Raum reicht
sie durch und kennt kein „Haus" (ADR-0006). Der Gastgeber wählt für die KIs.

**8. Die KI spielt ihr Haus.** Sie baut die Spezialeinheit und neigt zu
ihrem Schwerpunkt; welche Einheit sie ausbildet, liest sie schon heute aus
den Daten des Gebäudes. Ohne das misst fahrplan AC-18 („kein Volk gewinnt
mehr als 60 %") nichts. **Die Gefahr:** die Schwerpunkte sitzen auf den Ecken
des Konterkreises — Schützen schlagen Infanterie, Reiter schlagen Schützen.
Wären die Boni groß, entschiede die Hauswahl die Partie. Deshalb bleiben sie
klein (10 bis 20 %), und AC-18 wird je Paarung gemessen, nicht nur im Mittel.

**9. Die vier Stufen werden umbenannt** (Benutzer, 2026-11-10: „das hebt uns
ein bisschen vom Original ab"). Sie heißen nach dem Rang des Hauses:

| Bisher | Im Spiel |
| --- | --- |
| Dunkle Zeit | Landsitz |
| Feudalzeit | Lehen |
| Ritterzeit | Fürstentum |
| Imperialzeit | Krone |

Die vier Namen hat der Benutzer bestätigt. **Dorfbewohner bleiben
Dorfbewohner.**

Das ist der einzige Punkt, der Fertiges anfasst: die alten Namen stehen
324-mal in 55 Dateien unter `server/`, `public/`, `tests/`, `e2e/` und
`scripts/`. Geändert werden die **Texte am Bildschirm** (in `ZEITALTER` und
`AUFSTIEGE`) und die Tests und Bildnachweise, die diese Texte lesen.
Bezeichner wie `feudalzeit`, Dateinamen und die Buchstaben des Fahrplans
bleiben, und die Specs behalten die alten Namen als Arbeitsnamen der Stufen;
die Tabelle oben ist ihr Wörterbuch. Wie viele Tests das trifft, ist nicht
gezählt. Es ist eine eigene Runde mit `npm run check:alles:neu`, weil sich
jedes Bild mit dem Namen in der Leiste ändert.

**10. Der Drache gehört keinem Haus — er kommt in Stufe F an die Stelle des
Trebuchets.** Das Trebuchet will der Benutzer nicht (fahrplan AC-19); seine
Aufgabe, Befestigungen aus der Ferne zu brechen, bleibt aber. Der Drache
übernimmt sie: höchstens einer je Spieler, und nie mehr Drachen, als es
Eier gibt (unten). Er fliegt über Mauern, sein Feuer ist Flächenschaden
wie der Stein des Mangonels (`flaeche`, `welt.einschlaege`), und treffen
können ihn nur Schützen, Türme und Burgen. Abschaltbar als Einstellung
beim Eröffnen, wie es für das Trebuchet vorgesehen war.

Er ist **das eine teure Stück** dieses ADR, weil Fliegen vier Dinge neu
regelt: die Bewegung ohne Wegsuche (samt Auseinandertreten), wer ihn
angreifen darf (Befehl, Wache, Angriffslauf), das Zeichnen in der Höhe über
Gebäuden, und eine KI, die Schützen dagegen stellt. Der Aufwand ist nicht
geschätzt. Der Konterkreis wird danach neu gemessen
(`npm run konterkreis:strategie`).

**Wie stark er ist — Startwerte, gerechnet, nicht gemessen.** Der Benutzer:
„Sollten jetzt nicht komplett imbalanced sein."

| | Wert | Zum Vergleich |
| --- | --- | --- |
| Leben | 500 | Ritter 100, Ramme 175 |
| Tempo | 1,5 | Ritter 1,35 |
| Rüstung gegen Pfeile | 2 | Ritter 2 |
| Feuer | Reichweite 3, alle 3 Sekunden, Umkreis ein Feld | Mangonel: Reichweite 7, alle 6 Sekunden, derselbe Umkreis |
| Schaden an Einheiten | 15 | Mangonel 40 |
| Bonus gegen Gebäude | +200 | Ramme +125 alle 5 Sekunden |

Nach der einen Schadensformel (`max(1, Angriff − Rüstung + Bonus)`) heißt
das: rund 68 Schaden je Sekunde an Gebäuden, knapp drei Rammen. Eine Burg
fällt in etwa 71 Sekunden, ein Dorfzentrum in 35, ein Wachturm in 15, ein
Feld Steinmauer in 26. Umgekehrt nimmt er je Pfeil den Angriff minus zwei:
zehn Armbrustschützen mit Bodkinpfeil töten ihn in 20 Sekunden, ohne
Verbesserung in 33; eine Burg allein bräuchte 111 Sekunden und fällt
vorher, ein Wachturm kratzt nur.

Drei Ziele, an denen die Werte im Gefechtsstand eingestellt werden:

1. Eine Burg allein verliert gegen ihn, eine Burg mit fünf
   Armbrustschützen gewinnt.
2. Zehn Armbrustschützen töten ihn und verlieren dabei höchstens die Hälfte.
3. KI gegen KI: wer zuerst ruft, gewinnt nicht öfter als 60 %.

**Die eigentliche Gefahr ist nicht die Burg, sondern das Holzfällerlager.**
Dorfbewohner stehen dicht, tragen 25 bis 40 Leben, und das Dorfzentrum
schießt nicht. In der Mitte des Feuers fällt ein Dorfbewohner nach zwei
Stößen (sechs Sekunden), mit Webstuhl nach vier (zwölf) — und es trifft
alle im Umkreis zugleich. Ob dagegen Schützen und Türme reichen oder das Feuer gegen
Dorfbewohner schwächer sein muss, zeigt erst die Messung.

**Gerufen wird er, nicht ausgebildet — Vorschlag: ein Ritual am Kloster.**
Der Auftrag „Drachen rufen" kostet viel und läuft nur, solange **fünf eigene
Mönche am Kloster stehen**; fällt einer, steht die Uhr. **Alle** Spieler
sehen die Ansage mit der Uhr, wie bei der Kündigung eines Bündnisses
(spielziel AC-24) und wie beim Wunder der Vorlage. Der Grund ist derselbe
wie bei der Frist in ADR-0013: der Mauerbrecher soll eine Entscheidung
sein, auf die der andere antworten kann — Mönche erschlagen, das Kloster
einreißen, Schützen ausbilden —, kein Überfall. Und der Mönch bekommt eine
dritte Aufgabe neben Heilen und Bekehren.

**Dauer und Preis — Startwerte:** 180 Sekunden, etwa ein Aufstieg (160 bis
190). In der Zeit schafft der Gegner sechs Armbrustschützen je Schießanlage
(27 Sekunden das Stück) oder zwei Wachtürme (80 Sekunden). Das Ritual
kostet 400 Nahrung und 400 Gold, bezahlt beim Beginn; die fünf Mönche (je
100 Gold) bleiben danach erhalten.

**Der Drache kommt aus einem Ei und wird wieder eines** (Benutzer,
2026-11-10: „sehr witzige Idee, analog der Reliquien"; „wenn er stirbt,
kann ihn ein anderer sich holen").

- **Eier liegen auf der Karte, weniger als Spieler** — Vorschlag: eines je
  zwei Spieler, fern von jedem Start. Nur wer ein Ei im Kloster hat, kann
  rufen.
- **Das Ei trägt ein Dorfbewohner, als Ladung wie Holz** — nicht der Mönch
  (Benutzer: das Tragen durch Mönche war bei den Reliquien „eher mühsam").
  Der Träger ist damit von selbst langsam und wehrlos und braucht Geleit;
  eine eigene Regel „wer trägt, kämpft nicht" entfällt. Stirbt er, liegt das
  Ei dort.
- **Ein Soldat, der das Ei aufhebt, legt dafür die Waffen ab** und ist
  danach ein Dorfbewohner (Einfall des Benutzers, 2026-11-10). Das ist kein
  Sonderfall des Eis, sondern die Sonderregel **Abrüsten** — jede Einheit
  aus Infanterie, Schützen und Reitern kann Dorfbewohner werden, nie
  umgekehrt. Sie gehört unter „Sonderregeln" in den Fahrplan und braucht
  eine Bremse, denn Dorfbewohner kommen heute nur aus dem einen
  Dorfzentrum, und ein Speerkämpfer kostet weniger Nahrung als einer (35
  gegen 50). **Entschieden vom Benutzer: 40 Nahrung und 20 Sekunden**,
  erstattet wird nichts. Erzählt wird es als **Lehrzeit**: wer die Waffen
  ablegt, muss ein Handwerk erst lernen und isst so lange, ohne zu arbeiten.
  Billiger und schneller als ein neuer Dorfbewohner (50 Nahrung, 25
  Sekunden) ist es, weil der Mann schon da ist. Über die Kaserne kostet ein
  Dorfbewohner damit 75 Nahrung und 25 Holz in 42 Sekunden (Speerkämpfer, ab
  der Feudalzeit) oder 100 Nahrung und 20 Gold in 41 Sekunden (Miliz). Der
  Benutzer erwartet den Nutzen im Mittelspiel — nach Verlusten, oder für
  Einheiten, die man loswerden will, viele auf einmal —, nicht am Anfang. **Zu
  messen**, bevor es `fertig` heißt: eine KI, die ihre Dorfbewohner über
  Kasernen holt, darf gegen die heutige nicht mehr als 60 % gewinnen
  (`npm run pruefstand:vergleich -- --probe`); sonst steigt der Preis.
- **Ein Ei ist immer an genau einem Ort:** am Boden, bei einem Träger oder in
  einem Kloster. Fällt das Kloster, liegt es am Boden.
- **Stirbt der Drache, liegt dort sein Ei.** Alle sehen die Ansage, und die
  Übersichtskarte zeigt die Stelle. Wer es heimträgt — auch der alte
  Besitzer —, kann neu rufen und bezahlt neu. Ein eigenes „Wiederbeleben"
  gibt es nicht; das Ei ist die Regel.
- **Der Drache frisst.** Er kostet laufend Nahrung — Vorschlag als Maß: so
  viel, wie fünf Bauern ernten, bei 0,32 je Sekunde und Bauer rund 100 je
  Minute. Ist die Nahrung bei null, hungert er und verliert Leben, bis er
  fällt — wo er dann gerade ist. Das ist der erste Fall für den „Sold in
  Nahrung", den der Benutzer unter den Sonderregeln bevorzugt.
- **Deshalb kein Zeitalter als Sperre.** Rufen kann, wer Kloster, Ei und
  fünf Mönche hat, also ab der Ritterzeit. Die Bremse ist das Fressen: früh
  ist es ein großer Teil der Wirtschaft, spät ein kleiner — und wer früh
  ruft und den Drachen verliert, hat ihn für einen anderen bezahlt
  (Benutzer, 2026-11-10). Ob ein Drache in der Ritterzeit zu stark ist,
  misst der Prüfstand.

Das Ei ist **keine Siegbedingung**; die Zeile „Reliquien als Siegbedingung"
in ADR-0012 bleibt, wo sie steht.

**Das ist jetzt mehr als ein Ersatz für das Trebuchet.** Neu sind: Fliegen
(vier Regeln, oben), das Ritual, das Ei als Kartenobjekt mit Tragen und
Fallenlassen, das Fressen, und eine KI, die Eier holt, ihr Kloster schützt
und ruft. Gebaut wird in Schritten, die jeder für sich spielbar sind: erst
das Ei (liegen, tragen, fallen), dann das Ritual mit Ansage, dann der Drache
selbst, dann Tod und Ei, dann das Fressen, zuletzt die KI.

**11. Häuser schalten auch gewöhnliche Einheiten frei.** Kaserne, Stall und
Schießanlage dürfen Einheiten tragen, die nur einzelne Häuser ausbilden
(Benutzer, 2026-11-10: „das sehe ich nicht kritisch"). Die drei aus dem
ersten Entwurf wandern dorthin: **Langbogenschütze** (Schießanlage, nur
Eschenbruch), **Pavesenschütze** (Schießanlage, nur Wehrstein), **Söldner**
(Kaserne, alle Häuser, nur Gold, für Silberfurt billiger). In den Daten ist
das eine Zeile an der Einheit, `haeuser: [...]`, gelesen dort, wo heute
`zeitalter` gelesen wird. Das ist kein eigener Technikbaum (Punkt 4): die
Regel bleibt eine, die Liste ist kurz.

Welche Einheiten darüber hinaus dazukommen, legt die Spec-Runde zur Stufe E
fest. Jede kostet eine Figur, eine Zeile im Gefechtsstand und eine
Entscheidung der KI; aufgenommen wird, was eine **neue Entscheidung**
bringt (Spielziel: „nicht die Anzahl der Einheitentypen").

**12. Elitestufen der Spezialeinheiten kommen mit Stufe F, nicht mit E.**
Die Spezialeinheit lässt sich in der Burg einmal weiterentwickeln, so wie
die Miliz zum Soldaten wird: eine Verbesserung mit `wandelt`, die Einheit
mit `stufeVon`. Den Weg gibt es, es sind fünf Einträge in den Daten. Sie
gehören zu den „Einheitenstufen der Vorlage", die fahrplan AC-19 für die
letzte Stufe ohnehin vorsieht. **Warum nicht früher:** Stufe E misst erst,
ob kein Haus vorn liegt (fahrplan AC-18) — mit einer Stufe je
Spezialeinheit sind das fünf Unbekannte, mit zweien zehn.

## Was dieses ADR nicht hereinholt

| Wird gebaut | Wird nicht gebaut |
| --- | --- |
| Fünf Häuser mit Wappen, Wahlspruch, Boni | Helden und benannte Figuren (bleibt in ADR-0012) |
| Eine Spezialeinheit je Haus: Wölfe, Reiterschütze, Riese, Meuchler, Wiedergänger | Zauber mit eigenem Vorrat (Mana) |
| Ein Drache je Spieler in Stufe F statt des Trebuchets | weitere fliegende Einheiten, Luftkampf |
| Mannschaftsbonus, der mit dem Bündnis endet | eine neutrale dritte Macht mit eigener KI (ein Heer der Toten, das alle bedroht) |
| Wappen als Zeichen am Banner und im Warteraum | eigenes Aussehen der Gebäude je Haus |
| | Namen, Orte, Wappen, Sprüche aus fremden Werken |

**Der Winter** — Farmen bringen mit der Spielzeit weniger, das drängt zur
Entscheidung — ist ein Einfall, der zu dieser Welt passt. Er gehört unter
„Sonderregeln" in den Fahrplan und wird dort entschieden, nicht hier: er
trifft die Wirtschaft der KI, und KI gegen KI muss weiter vor Minute 60
enden.

## Folgen

- **Die Blender-Figuren bleiben gültig.** Dazu kommen fünf Figuren für die
  Spezialeinheiten, der Drache und fünf Wappen. In der Antike wäre jede
  Ritterfigur und jedes Kloster neu zu bauen gewesen.
- Stufe E heißt „Häuser". fahrplan AC-16 bekommt unter derselben Nummer den
  neuen Text; AC-17 und AC-18 lesen „Haus" statt „Volk". spielziel AC-16
  und AC-17 ebenso.
- Der Prüfstein des Fahrplans bleibt: fünf Leute, zwei Partien mit
  verschiedenen Häusern, und danach eine dritte.
- `docs/strategie/vorlage-aoe2.md` bleibt die Quelle für Regeln und Zahlen.
  Die Häuser sind eine bewusste, hier aufgeschriebene Abweichung.

## Was die Spec-Runde zur Stufe E daraus macht

Dieses ADR ändert selbst keine Spec. Geschrieben wurde es, während die
Weiterbau-Schleife im selben Arbeitsbaum an Stufe D saß; die folgenden
Änderungen gehören deshalb in ihre Spec-Runde:

- **Fahrplan:** Stufe E heißt „Häuser"; AC-16 bis AC-18 bekommen unter
  ihren Nummern den neuen Text. AC-19: der Drache statt des Trebuchets,
  dazu die Elitestufen (Punkt 12). Die Bauabfolge des Drachen (Ei, Ritual,
  Drache, Tod und Ei, Fressen, KI) bekommt eigene Kriterien mit neuen
  Nummern. Unter „Sonderregeln": der Umriss vom 2026-11-09 ist abgelöst;
  neu das **Abrüsten** (entschieden, Punkt 10) und der **Winter** (Einfall).
- **Spielziel:** AC-16 bis AC-18 und der Abschnitt „Zu den Völkern".
- **Einheiten, Bauen, KI:** Kriterien für die fünf Spezialeinheiten, die
  Tarnung, die hauseigenen Einheiten, das Ei als Ladung.
- **ADR-0012:** Statuszeile und Zeile im Verzeichnis („Völker → 0014"); die
  Tabelle „Entschieden" in `CLAUDE.md` bekommt die Zeile für 0014.

## Entschieden am 2026-11-10

Die fünf Häuser mit Namen, Wappen und Wahlspruch; der Mannschaftsbonus endet
mit dem Bündnis; kein Haus für den Glauben; die Stufen werden umbenannt.

Am 2026-11-10 angenommen, als Startwerte („können wir später immer noch
justieren"): der Wiedergänger für Gold und einen Gefallenen, das Ritual mit
fünf Mönchen über 180 Sekunden, die Werte und Kosten des Drachen, ein Ei je
zwei Spieler, Rufen ab der Ritterzeit.
