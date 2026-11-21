# Steuerstand

**Wofür:** In langen Arbeitsschleifen wird der Gesprächsverlauf irgendwann
zusammengefasst, und dabei gehen Einzelheiten verloren. Diese Datei ist der
Stand, nach dem weitergearbeitet wird — genauer als jede Zusammenfassung. Der
Haken `.claude/hooks/steuerstand.mjs` legt sie zu jedem Sitzungsbeginn und
genau einmal nach jeder Zusammenfassung vor.

**Pflicht:** Nach jeder Runde fortschreiben, bevor die nächste beginnt.
**Wie:** Abschnitte ersetzen, nicht verlängern. Was erledigt ist, wandert nach
[`steuerstand-archiv.md`](steuerstand-archiv.md) (dort wird nichts
fortgeschrieben, der Haken legt es nicht vor). Was schon in `CLAUDE.md` oder
[`erkenntnisse.md`](erkenntnisse.md) steht, bekommt hier nur einen Verweis.
**Grenze: 40 KB.** Claude Code nimmt je Haken höchstens 10 000 Zeichen in
den Kontext (darüber nur einen Dateipfad und 2000 Zeichen Vorschau) — der
Haken legt die Datei deshalb in bis zu fünf Teilen vor, geschnitten an den
`##`-Abschnitten. Das Wichtigste steht vorn: Stand, nächste Schritte, offene
Fragen. Ein einzelner Abschnitt bleibt unter 9000 Zeichen.

Am 2026-11-22 gekürzt von 323 KB auf diese Fassung: der ganze alte Text steht
unverändert im Archiv unter „Ausgelagert am 2026-11-22“ — jede Rückmeldung
im Wortlaut, jede Übergabe, jeder Zwischenstand. Wer eine Einzelheit zu einem
Punkt unten sucht, sucht dort nach „Punkt <n> (Benutzer“.

---

## Zuletzt fortgeschrieben

**2026-11-22:** F6 bis F11 nach `main` gepusht und ausgerollt (Benutzer hat
es heute freigegeben: ‚gut, dann ausrollen - und anschließend deine anderen
Punkte eigenständig angehen'). Er will Hilfsagenten statt langer eigener
Verläufe (‚nutze lieber subagenten, die verlieren den kontext nicht durch
compacten'). Er bestätigt die Laufregel (9 % zu langsam, ‚das passt nicht
ganz') und meldet: ‚die einheiten sind auch immer alle relativ schnell
kaputt, das hat bei AoE teilweise ziemlich lange gedauert'. Laufen in
Hilfsagenten: (a) Laufregel, Kampfdauer gegen die Vorlage, Pfeile treffen
beim Ankommen (Punkt 25), Seitengleichheit des Gefechtsstands; (b) dieser
Umbau des Steuerstands; (c) der Technologiebaum. Danach: F12 als eigener
KI-Block mit neuer Messung (ki AC-35, ki AC-28, einheiten AC-52,
pruefstand:haeuser, Test zu spielziel AC-18), dann F13, dann zweites
Dorfzentrum (Punkt 39), Speichern (ADR-0017), Notfallklingel (erst gegen
ADR-0012 halten).

**2026-11-21, 02:55 (Opus):** F6 bis F11 gebaut und committet (`bba1e2b`,
`7013cf0`, Bilder `b45fbd8`, Steuerstand `9194fe7`), `npm run check` grün
(1063 Tests, 14 Partien). Ganze Partien unverändert: Nebel 120 — 111 vor
Minute 60, Median 39,4, keine ohne Sieger; zwei gegen zwei alle vor Minute
90. Was F6 bis F11 sind und welche Werte gesetzt statt aus der Vorlage
stammen: `CLAUDE.md` („F6 bis F11 stehen“).

---

## Stand

- **Zweig `strategie`, HEAD `9194fe7`** = `main` = `origin/main` = Server
  (`npm run ausrollen -- --stand` zeigt es). 598 von 706 Kriterien fertig,
  1063 Tests ohne Browser, 14 ganze Partien, 341 im Browser (Zahlen in
  `CLAUDE.md`, Board `specs/BOARD.md`).
- **Arbeitsbäume:** Hauptordner `OnlineGames` (`strategie`);
  `OnlineGames-techbaum` (`strategie-techbaum`, Hilfsagent c, Technologiebaum);
  `OnlineGames-bildumbau` (`strategie-bildumbau`, steht alt auf `a9a4d9a`,
  wird nicht mehr gebraucht — Entfernen nur auf Wort des Benutzers). Eine
  Probekopie `basis` im Scratchpad (losgelöst auf `9194fe7`) gehört einem
  Hilfsagenten.
- **Parallel:** eine andere Sitzung arbeitet an `server/`, `tests/`,
  `specs/`, `public/` (am 2026-11-22 uncommittet: `server/spiele/strategie/welt.js`,
  dazu der Managerausbau `docs/adr/0018-manager-ausbau.md`, `docs/manager/`,
  `.claude/skills/manager-weiterbauen/`). Nicht anfassen, was einem anderen
  gehört.
- **Stufe F:** F1 bis F11 stehen. Offen: **F12** (die KI in der Krone) und
  **F13** (die Krone am Stück im Browser).

### Was nicht `fertig` ist (Spec-Stand 2026-11-22)

| Spec | Kriterien |
| --- | --- |
| bedienung | AC-36 `in-qa` (Militär bei Spielgröße erkennbar), AC-73 `in-qa` (Vollbild gibt `Strg`+Ziffer — der Benutzer muss es selbst probieren), AC-42, AC-44, AC-46 `offen` |
| darstellung | AC-6 `in-qa`, AC-24 `in-arbeit`, AC-11, AC-19, AC-20, AC-21 `offen` |
| einheiten | AC-52 `in-qa` (Drache gewinnt KI gegen KI höchstens 60 % — misst erst F12), AC-10, AC-32 `offen` |
| fahrplan | AC-21, AC-22 `in-qa`; AC-16, AC-18, AC-19, AC-20 `offen` |
| karte | AC-7, AC-10 `offen` |
| ki | AC-20, AC-28 (Spezialeinheit), AC-29 (Drache rufen), AC-31 (antwortet auf das Heer), AC-35 (forscht), AC-39 (Krone), AC-40 (Wunder) `offen` |
| spielziel | AC-1 `in-arbeit`; AC-2, AC-3, AC-4, AC-10 bis AC-13, AC-15, AC-16, AC-18 `offen` (AC-18: Häuser 30 bis 70 %, Test in `npm run check` fehlt) |

---

## Nächste Schritte, in dieser Reihenfolge

1. **Hilfsagenten abwarten und ihre Berichte einarbeiten:** (a) Laufregel,
   Kampfdauer, Pfeile beim Ankommen (Punkt 25), Seitengleichheit;
   (b) dieser Umbau; (c) Technologiebaum. Nichts davon doppelt anfangen.
2. **F12 — die KI in der Krone, als eigener KI-Block mit neuer Messung:**
   ki AC-35 (forscht), ki AC-28 (Spezialeinheit, `NOCH_NICHT` auflösen),
   ki AC-39 (Krone), dazu ki AC-29 (Drache) und ki AC-40 (Wunder) prüfen;
   einheiten AC-52 messen; `npm run pruefstand:haeuser` neu; der Test zu
   spielziel AC-18 in `npm run check`. Mit hinein, wenn die Grenzen es
   tragen: ki AC-31 (Punkt 35), Punkte 19, 22, 24, Bauplatz nur auf
   Gesehenem. Danach Nebeltest (120), zu viert, Teams.
3. **F13** — die Krone am Stück im Browser.
4. **Zweites Dorfzentrum** (Punkt 39): Kriterium anlegen, Daten.
5. **Speichern** nach ADR-0017 (S1 bis S4), danach Liste offener Spiele
   (Punkt 18 der ersten Liste).
6. **Notfallklingel** (Punkt 17 der ersten Liste) — erst gegen ADR-0012
   halten, Umfang nennen, sein Wort abwarten.
7. Danach, ohne feste Reihenfolge: Haltungen (15b), dichter stehen (18),
   Gebäude angreifen ohne Einheiten (40), Abläufe für Holzhacken und
   Feldarbeit (Blender), alte Texte mit Umlauten.

---

## Offene Fragen an den Benutzer

- **Punkt 10:** soll die KI mit stehendem Dorfzentrum überhaupt aufgeben?
- **Punkt 17 (Nachfrage):** welches Lager, wie weit, mit Umschalt, trug der
  Bauer etwas?
- **Punkt 23:** wie klingt der Ton?
- **Reitertempo 1,55** (Späherreiter ab dem Lehen) ist gesetzt, nicht aus
  der Vorlage — passt es ihm im Spiel?
- **Spielgeschwindigkeit 1,5 als Vorgabe?** Nur fragen.
- **Notfallklingel:** Umfang nennen, sobald gegen ADR-0012 gehalten.
- **Arbeitsbaum `OnlineGames-bildumbau` und alte Zweige** (`strategie-bildumbau`,
  `strategie-ki-antwort`, `strategie-mauerring`) — entfernen? Nur auf sein Wort.
- **Berechtigungen für die Schleife:** `.claude/settings.json` trägt nur der
  Benutzer ein (die Haken darin sind Teil des Projekts). Nicht umgehen.
- Ruhen mit dem Managerspiel: **Mailversand** (konten AC-4, AC-5), **mehrere
  Menschen in einer Manager-Liga**.

---

## Offene Rückmeldungen des Benutzers

Nummern wie in den Listen, aus denen sie stammen; der volle Wortlaut steht im
Archiv. Alles hier Fehlende aus diesen Listen ist gebaut (Liste unten).

### Aus dem ersten Spiel (2026-11-12)

| Punkt | Wortlaut kurz | Vereinbarte Lösung / Stand |
| --- | --- | --- |
| 8 | Holzhacken erkennbar | halb: am Zeiger steht, was der Rechtsklick tut (bedienung AC-52). **Eigener Ablauf im Bild fehlt** — Blender, ein Prozess |
| 13 | Speichern und Laden | **ADR-0017 entschieden** (Benutzer 2026-11-13: „Ja die adr zum speichern und fortsetzen passt"), gebaut in S1 bis S4; Probe `v8.serialize` 1 bis 17 ms. `quer` gehört in die gespeicherte Form |
| 15 | Feldarbeit statt Hacken auf der Farm | offen — neue Abläufe des Dorfbewohners mit Blender |
| 17 | Notfallklingel | offen — neue Mechanik (Einquartieren, das Dorfzentrum schießt mit Besatzung): **erst gegen ADR-0012 halten und Umfang nennen**. Der Unterschlupf (mehr Pfeile mit Besatzung) käme damit |
| 18 | Liste offener Spiele, Wiedereinstieg, Startklick | halb: die Partie wartet 30 Minuten, der Vorraum bietet die Rückkehr (raeume AC-17, AC-18); Liste und Startklick hängen am Speichern |
| 23 | Ton „sehr langweilig" | gebaut (Musik als Stück, Klänge am Ort), **gemessen, nicht gehört** — das Urteil des Benutzers steht aus |

### Aus dem zweiten Spiel (2026-11-13/14, Punkte 1 bis 41)

| Punkt | Wortlaut kurz | Vereinbarte Lösung / Stand |
| --- | --- | --- |
| 3 (Nebenpunkt) | Bauplatz nur auf gesehenen Feldern | nicht gebaut — verschöbe die KI; mit dem nächsten KI-Block |
| 6 | `Strg`+Ziffer im Vollbild | bedienung AC-73 `in-qa`: der Benutzer muss es selbst probieren, Chrome lässt sich dafür nicht fernsteuern |
| 8 | „bogenschützen scheinen im early verdammt effektiv zu sein, angriff vll um eins senken" | gemessen (Angriff 3 kostet nur die Miliz), **Empfehlung: nicht senken** — die Stärke kommt vermutlich daher, dass die KI nicht kontert (ki AC-31). Nach einer Testpartie neu urteilen |
| 10 | Sieg, obwohl das Dorfzentrum stand | gebaut: der Grund steht im Bild (spielziel AC-27). **Offene Frage an ihn:** soll die KI mit stehendem Dorfzentrum überhaupt aufgeben? |
| 15b | „da sollte es irgendwie nen modus geben, wie angreifen, stand halten, etwas defensiv" | **Haltungen**, vier wie in der Vorlage: *Angriff* (verfolgt bis zum Fall oder aus der Sicht), *Verteidigung* (heutiges Verhalten, bleibt Vorgabe — sonst kippt jede KI-Messung), *Stellung halten*, *Nicht angreifen*. `einheit.haltung`, Nachricht `haltung`, vier Knöpfe mit Tafel und Taste, am Zustand ein Buchstabe. Benutzer: „ja, die haltungen reichen nach unserer testpartie". Noch kein Kriterium (Nummer beim Bauen prüfen) |
| 17 (Nachfrage) | Lager neben Vorrat — Bauer sammelt danach | gebaut als bauen AC-40. In seinem Spiel nicht nachzustellen; **ihn fragen:** welches Lager, wie weit weg, mit Umschalt gebaut, trug der Bauer etwas? |
| 18 | „einheiten müssten glaub näher aneinanderstehen (nicht übreinander)" | Größe bleibt (zurückgenommen). **Dichter stehen:** Plätze 0,6 bis 0,7 Feld statt 1 in `welt.aufstellungUm` und `welt.ausweichen` — greift in jede KI-Messung: `pruefstand:vergleich` und ein Vergleichsbild heute / 0,7 / 0,6 |
| 19 | „die bogenschützen haben sich nicht gewehrt … aber trotzdem muss es möglich sein als spieler einer einheit ein explizites Ziel zu geben" | die Regel der Welt bleibt (ein befohlenes Ziel gilt). **Die KI merkt es selbst:** wird ihr Heer auf dem Marsch oder beim Angriff auf ein Gebäude von Einheiten getroffen (fehlendes Leben wie ki AC-14), greift sie die Angreifer an und kehrt dann zurück. Neues Kriterium in ki.md, Test mit gebauter Lage, danach Nebeltest und zu viert. KI-Block |
| 22 | „die KI greift halt immer von vorne an, das macht das verteidigen recht einfach" | **Anmarschseite wechselt:** je Angriff ein Winkel um das Ziel (0°, ±60°, ±120° zur direkten Linie) aus `welt.zufall`, weg von dem, was schießt, hin zu Sammlern; Sammelplatz und Marschziel auf dieser Seite. Messung: über 20 Startwerte Angriffe aus mindestens zwei Sektoren; Nebeltest, zu viert, Teams müssen halten. KI-Block |
| 24 | „die einheiten der KI kommen in abhängigkeit der geschwindigkeit der einheiten unterschiedlich" | **das ganze Heer sammelt sich** am Sammelplatz (`ki.zug`) und geht erst hinein, wenn etwa 80 % da sind oder eine Höchstwartezeit um ist. Erst in der KI, nicht als Regel der Welt. Messung: Abstand zwischen erster und letzter Ankunft. KI-Block |
| 25 | „die Pfeile der Burg kommt irgendwie SOFORT beim opfer an" | **der Pfeil trifft, wenn er ankommt:** der Schlag eines Fernkämpfers oder Turms wird mit Ankunftstakt (`weite / geschoss`) eingereiht und dann abgerechnet, trifft sicher; fällt das Ziel vorher, verpuffen die Pfeile im Flug. Kampfregel → alles neu messen. **Läuft im Hilfsagenten (a)** |
| 35 | „wenn ich mit 15 rittern angreife, sollte sie speerkämpfer und keine soldaten bauen" | = ki AC-31. Zwischenstand auf `strategie-ki-antwort` `9c69b75`, „nicht wirksam" KI gegen KI (beide antworten), gegen einen Menschen nie gemessen. Lösung: Klassen des gesehenen Heers zählen, die Einheit wählen, deren `bonus` die häufigste trifft, nur für einen Teil der Ausbildung (sonst fällt ki AC-27). Teil von F12 |
| 39 | „ich glaube es macht sinn, dass man im Kronezeitalter noch EIN zweites dorfzentrum bauen kann" | **entschieden:** genau eines zusätzlich ab der Krone, als Daten (`hoechstens: 2` ab Zeitalter 3). Noch kein Kriterium. Nach F13 |
| 40 | „wenn es keine normalen einheiten gibt, sollten die soldaten automatisch gebäude angreifen (felder mit niedrigster prio)" | sieht eine wachende Kampfeinheit keinen Gegner, nimmt sie das nächste fremde Gebäude in Sicht: was schießt, Militär, Rest, Farmen zuletzt; Mauern und Tore nie von selbst; **nicht im laufenden Angriffslauf**. Kampfregel: Konterkreis, Nebeltest, Teams messen; hält es nicht, mit den Haltungen (15b) |
| — | alte Bildschirmtexte ohne Umlaute („Bevoelkerung voll") | offener Faden; es hängen Testtexte daran |

### Aus den späteren Meldungen (Punkte 45 bis 58, 2026-11-15 bis 11-18)

| Punkt | Stand |
| --- | --- |
| 48 | Handy-Bedienung — mittelfristig, hinten angestellt; wenn, dann das Handy als Maß, nicht das Tablet (Gedächtnis `handy-bedienung.md`). Bis dahin gilt bedienung AC-23 |
| Technologiebaum | Wunsch (2026-11-18, ~21:50): „was noch nett wäre, wenn man so ne übersicht anklicken könnte, was es alles an einheiten und weiterentwicklungen, etc. gibt - ggf. pro Haus". **Läuft im Hilfsagenten (c)**, Zweig `strategie-techbaum` |
| 2026-11-22 | „die einheiten sind auch immer alle relativ schnell kaputt, das hat bei AoE teilweise ziemlich lange gedauert" — **Kampfdauer gegen die Vorlage messen, läuft im Hilfsagenten (a)**, zusammen mit der Laufregel (siehe „Nicht gemessen") |

### Gebaut aus diesen Listen (zur Orientierung, Einzelheiten im Archiv)

2026-11-12: 1 bis 7, 9 bis 12, 13 (nur die Pause), 14, 16, 19 bis 22
(10 = einheiten AC-30, Standplätze, `04fbb80`). 2026-11-13/14: 1 bauen AC-40 · 2 bedienung AC-63 ·
3 kampf AC-24 · 4 AC-64 · 5 AC-80 · 7 darstellung AC-28 · 9 ki AC-37 ·
11 AC-66 · 12 AC-67 · 13 ki AC-36 · 14 AC-63 · 15a kampf AC-25 · 16 AC-69 ·
20 „wird schon erforscht" · 21 bauen AC-43/44 · 23 bauen AC-41/42 · 26 AC-74 ·
27 einheiten AC-40 (fremder Markt +20 %) · 28 Umschalt bildet fünf aus ·
29 darstellung AC-27 · 30, 31 AC-68 · 32 AC-70 · 33 ki AC-33 · 34 ki AC-37/38 ·
36 AC-72 · 37 darstellung AC-26 · 38 AC-75 · 41 spielziel AC-28 und
`aufgeben()`. 45 bis 47, 49 bis 58: siehe `CLAUDE.md` („Rückmeldungen vom
2026-11-17“ und „vom 2026-11-18“).

---

## Geltende Entscheidungen

- **Ersatzgrenze im Nebel** (2026-11-10, 11-13, 11-15): mindestens 105 von
  120 vor Minute 60, Median unter 45, höchstens eine ohne Sieger — die
  Grenzen nicht lockern. Steht in `CLAUDE.md`.
- **ki AC-27 und AC-30 halten knapp. „Wenn sie fallen, sind 1,4 und 1,75
  freigegeben"** (2026-11-13); 1,4 für ki AC-27 ist seitdem angewandt, ki
  AC-30 bleibt bei zwei.
- **Zwei Schützenlinien** nebeneinander, Bogen und Armbrust (2026-11-13).
- **Eibenschütze:** „der eibenschütze darf gerne 1 mehr reichweite als die
  burg haben - bzw. der elite eibenschütze" (2026-11-13; einheiten AC-42).
- **Ritter → Kavalier → Paladin, kein Champion** (2026-11-18).
- **Figuren schreibt und rendert die Sitzung selbst**, kein Hilfsagent mit
  kleinerem Modell (2026-11-18; Gedächtnis `fable-fuer-figuren.md`).
  **Blender nie parallel**, auch nicht für Proben (`ein-renderprozess.md`).
- **Gold und Stein als Einstellung** wenig / mittel / viel, Vorgabe mittel
  (2026-11-18; karte AC-18, AC-19).
- **Burgen der KI:** zweite und dritte erst in der Krone
  (`BURGEN_JE_ZEITALTER = [0, 0, 1, 3]`).
- **Fremder Markt +20 %** („nimm 20% mehr", einheiten AC-40).
- **Marktkarren ab dem Fürstentum** (ADR-0013) — ändern nur auf sein Wort.
- **Mauerring geparkt** auf `strategie-mauerring` `bf1ff0a`, bis es
  weitreichende Belagerung gibt.
- **Spielgeschwindigkeit Vorgabe 1,0** (ADR-0013). Empfehlung nach dem
  ersten Spiel wäre 1,5 — nur fragen, nicht eigenmächtig ändern.
- **Gebäude je Zeitalter:** gefragt, nicht bestellt. Empfohlen zwei
  Fassungen (Holz bis Lehen, Stein ab Fürstentum) für Dorfzentrum, Haus,
  Kaserne, Schießanlage, Stall — im nächsten Blender-Block.
- **Hilfsagenten statt langer eigener Verläufe** (2026-11-22, siehe oben).
- **Pushen und Ausrollen nur auf sein Wort**, auf GitHub ist `main` der eine
  Ort (Gedächtnis `pushen-wenn-da.md`); ausgerollt wird mit
  `npm run ausrollen`, nie `--sofort`.

---

## Nicht gemessen (ausdrücklich)

- **Laufregel:** `welt.laufen()` rastet an jedem Wegpunkt ein und verliert
  den Rest des Takts — Tempo 1,0 braucht 11 Takte je gerades Feld statt 10,
  jede Einheit ist rund 9 % langsamer als ihr Nennwert (gemessen mit
  `tests/gang-messen.mjs` in einer Probekopie; Ritter 8 statt 7,4 Takte je
  Feld). Der Benutzer bestätigt, dass es nicht passt — **Hilfsagent (a)**.
  Beheben verschiebt alle KI-Messungen.
- **Kampfdauer gegen die Vorlage** und **Gefechtsstand nicht seitengleich**
  (bei gleichen Heeren gewinnt die rechte Seite 32 von 40) — Hilfsagent (a).
- **Die KI auf „viel"** Gold und Stein (gemessen nur auf „mittel").
- **`pruefstand:haeuser` seit den Hauseinheiten** — zuletzt Eschenbruch 65,
  Rappenstein 60, Distelhag 54, Silberfurt 36, Wehrstein 30 % (vor den
  Hauseinheiten und vor F1 bis F11). Teil von F12.
- **einheiten AC-52** (der Drache gewinnt KI gegen KI höchstens 60 %) —
  wartet auf F12.
- **Die KI bildet keine Hauseinheit aus** (`NOCH_NICHT` in `ki.js`): mit dem
  Söldner fiel der Nebeltest auf 97, mit den zwei Schützen auf 102 von 120.
  ki AC-28 ist Teil von F12.
- **Wiedergänger mit Distelhags Bonus:** schlägt den Bogenschützen des
  Fürstentums 40 von 40, die Armbrust 22 von 40 — „verliert gegen Schützen"
  (einheiten AC-49) gilt nur ohne Haus. Reiterschütze bei Rappenstein 75
  statt 60 Leben. Dem Benutzer gesagt, nicht geändert.
- **KI und Kartografie:** erforscht ein verbündeter Mensch die Kartografie,
  gilt für die KI im selben Sichtteam alles als erkundet — ihr Späher findet
  kein Ziel mehr (`welt.erkundet` in `ki.js`). Ungeprüft.
- **ki AC-34** gegen einen Menschen, der mauert; **ki AC-36** gegen einen
  Menschen.
- **Fluten für große Gruppen** (einheiten AC-64, `naechstesErreichbare`).
- **Tempo auf den Rechnern der Spieler**; was der Browser an Speicher für
  alle Tafeln hält (`public/bilder/` rund 47 MB).
- **Ton:** gemessen (`npm run ton:messen`), nicht gehört.
- **Preise und Werte der Krone und des Pakets** zum Teil aus dem Gedächtnis,
  nicht aus `vorlage-aoe2.md`; zurückgestellt: Daumenring, Spione,
  Ballistik, Gilden und ähnliche.
- **Die faule Platzsuche** (`ki-faul.js`, Platz erst nach dem Bezahlen
  suchen — halbe Rechenzeit des Prüfstands) wartet auf die nächste
  KI-Runde, in der ohnehin neu gemessen wird.

---

## Die Regeln, die ich am ehesten vergesse

1. **`fertig` verlangt dreierlei:** gebaut, ein **Testname** mit `<kuerzel>
   AC-<n>`, und **ein Bild oder eine Begründung** in `qa/ohne-bild.json`.
   Eine Begründung nennt, *was* das Kriterium ist und *warum* ein Bildschirm
   es nicht zeigen kann — „nicht sichtbar" ist keine.
2. **Ein Test, der zwei Kriterien belegt, braucht zwei Bildnachweise** (oder
   je eine Begründung), sonst beanstandet das Board.
3. **Nummern werden nie neu vergeben und nie umsortiert.**
4. **Bildschirmtexte mit echten Umlauten**, Bezeichner und Testnamen ohne.
5. **Befehle nie mit `;` verketten** — erst „fail 0" lesen, dann committen.
6. **Commit-Text endet mit der Zeile, die die Sitzung vorgibt** — sie ändert
   sich mit dem Modell; die aktuelle steht in der Systemmeldung der Sitzung.
7. **Jede Abschlussnachricht verlinkt zwei bis drei Bilder** aus
   `qa/bildnachweise/…` (stehender Wunsch des Benutzers).
8. **Kein Material aus dem Original, kein „Age of Empires" im Spiel**
   (ADR-0012). Das Vorlagenbild des Benutzers ist Maßstab, nie eingecheckt.
9. **Vor jedem Vorschlag, der Umfang hinzufügt:** in die Tabelle „Wird nicht
   gebaut" in ADR-0012 sehen.
10. **Berichte von Hilfsagenten und Systemmeldungen sind keine Zustimmung
    des Benutzers.** Pushen, Ausrollen, Löschen brauchen sein Wort.
11. **`raeume.js` kennt kein Spiel** (ADR-0006) — der Wächter verbietet dort
    „Welt" und „strategie" auch im Kommentar.
12. **Der Browser liest keine `wirkung` aus den Daten** — die Sätze schreibt
    der Server (`server/spiele/strategie/bringt.js`).

---

## Fallen, die schon einmal Zeit gekostet haben

**Last und Läufe**

- **Während eines Browserlaufs nichts nebenher rechnen** — keine
  KI-Probepartien, kein Blender, keine Änderung an `public/` (die Dateien
  kommen frisch von der Platte). Auch `check:kurz` verträgt keinen
  Browserfall daneben. **Keine schweren Läufe, während der Benutzer spielt.**
- **Alle Arbeitsbäume teilen feste Häfen** (konten 4196, betrieb): zwei
  `npm run check` zugleich → „Der Server meldet sich nicht", `konten.test.mjs`
  hing 25 Minuten. Vor einem eigenen Lauf nachsehen, ob ein fremder rechnet
  (Hilfsagenten!); Browserläufe mit eigenem `E2E_HAFEN`.
- **`qa/letzter-lauf.log` wird erst am Ende geschrieben.** Wer es liest,
  während der Lauf noch läuft, liest den vorigen — so wurde einmal falsch
  „grün" gemeldet.
- **Zeitmessungen reißen unter Last.** Neue Zeitmessungen nehmen den
  schnellsten von mehreren Durchgängen — und senken nie die Schwelle.
  darstellung AC-30 fällt auf diesem Rechner auch am Stand HEAD (41 bis 49
  Bilder/s, Grenze 50) — Streuung, nicht anfassen.
- **Probekopie im Scratchpad:** ihr `node_modules` ist eine **Junction** auf
  das des Hauptordners. Vor dem Löschen zuerst
  `cmd //c rmdir "<…>scratchpadprobe
ode_modules"`, **nie `rm -rf` auf den
  Ordner mit der Junction.**
- **`zeitraffer 0` hält auch die Sicht an**: was der Prüfgriff danach
  aufstellt, bleibt für den Gegner im Nebel. Erst sehen lassen, dann anhalten.

**Tests**

- **Wachsende Listen, Objekte und Aufträge nicht auf Gleichheit prüfen**,
  sondern Feld um Feld oder auf „enthält" — ein neues Feld in `EINHEITEN`
  oder `GEBAEUDE` reißt sonst jeden solchen Test.
- **Wer Einheiten von selbst handeln lässt, bricht Tests mit stillhaltendem
  Ziel:** auf den Zustand warten (alle stehen *und* sind in Reichweite),
  nicht auf das Ende einer Bewegung.
- **Einen Dorfbewohner im Zeitraffer anklicken:**
  `dorfbewohnerAnklicken(page, { ohne, code, raffer })`, nie ohne `code`.
- **`ansicht.ausgewaehlt` hält den Schlüssel der Map `nachher`**, nicht
  `einheit.id`.
- **Getroffen und verdeckt wird am Bild** (bedienung AC-51): wer jemanden
  „hinter" ein Gebäude stellt, stellt ihn gleich hinter die Rückwand.
- **Ein Bildschirmfoto des gerenderten Spielbilds dauert länger als ein
  Pfeilflug:** den Pfeil festhalten (`p.dauer = 1e9`).
- **Bildnachweise werden nur geschrieben, wenn sie fehlen** — erneuern mit
  `QA_NACHWEIS=1`. **Bildunterschriften lügen leicht**: jedes Bild ansehen.
- **`npm run check` prüft die Stand-Zeile in `CLAUDE.md` gegen das Board** —
  nach `npm run specs:board` zuerst die Zahlen dort nachziehen.
- **Better Auth hat eine Ratengrenze**; der Testserver setzt sie weit. Wer
  den Browserlauf stark verlängert, prüft das erneut.
- **Feste Bedienteile können sich überdecken:** `bedienteileFrei(page)`.

**Code und Bilder**

- **Eine Regel an einem Datenfeld wirkt nur, wenn das Feld beim Browser
  ankommt** (`welt.aufbau()`).
- **Ein Takt als Schalter ist im ersten Takt falsch** (`0` ist falsy).
- **Wirkungen eines Takts sammeln und am Ende abrechnen** — sonst hat der
  Erste in der Schleife Vorrang.
- **Was für genau eine Sache fest verdrahtet ist, fällt beim zweiten auf.**
- **Ersetzungen per Skript treffen mehr als gedacht** — auf den
  Funktionsausschnitt begrenzen. Große Ersetzungen als Skriptdatei, nicht als
  Heredoc.
- **Doppelte Deklaration beim Destrukturieren** in `ansicht.js` — die
  Rohstoffzähler heißen `amHolz`, `anNahrung`, `amGold`, `amStein`.
- **Eine schräge Waffe in einem eigenen, gedrehten Rahmen zeichnen.**
- **Ein neues Gebäude oder eine neue Figur misst sich gegen alle alten**
  (`npm run tafel -- "t.unterschiede('figur')"`, jedes Paar über einem
  Drittel; Spielerfarbe über 0,1; über 250 Bildpunkte). Vorher proben:
  `BILDER_PROBE=2 npm run bilder -- <name>`. **Die Messung findet keine
  Peinlichkeit, nur das Auge** (`npm run sicht -- --ausschnitt x,y,b,h --lupe 3`).
- **Cycles rendert deckungsgleiche Flächen schwarz**; die Ansicht „Standard"
  kappt jeden Kanal bei 1 (Flammen dafür mit Hülle und Glut). Jede neue
  Tafel ansehen, bevor sie eingecheckt wird.
- **Wer aus einer Leinwand liest, nachdem er sie geändert hat, kopiert sie
  ohne Grafikkarte ganz** — erst alles schreiben, dann lesen.
- **`sicht --messen` misst nur JavaScript-Zeit**, nicht die Bildrate.
- **Die Grenzen der KI halten an diesen Startwerten, nicht aus Abstand** —
  eine Probe, die nur die Zufallsfolge verschiebt, kann sie reißen.

---

## Werkzeuge

Die Befehle stehen in `CLAUDE.md` („Arbeitsweise"). Zusätzlich oft gebraucht:

```bash
npm run pruefstand:vergleich -- --minuten 90 --saetze 2   # Arbeitsstand neben HEAD - gleich nach dem ersten Entwurf
npm run pruefstand:verlauf -- --startwert 11 --minuten 70 # eine Partie Minute fuer Minute
node --test "tests/partien/ki-im-nebel.test.mjs"          # Nebel 120 Startwerte, rund sechs Minuten
npm run konterkreis:strategie                             # Gefechtsstand, nach jeder Aenderung an Kampfwerten
E2E_HAFEN=4391 npm run check:alles:neu:kurz               # Browserlauf, der alle Bilder neu schreibt, dann check
npm run sicht -- --spiel --aufgedeckt --tun <probe.mjs>   # eine Partie mit eigener Probe; --gezeichnet = ?bilder=0
npm run ausrollen                                          # im Hauptordner: geprueften Commit auf den VPS; -- --stand zeigt den Stand
```
