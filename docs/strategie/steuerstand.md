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

**2026-11-22, Mittag (Benutzer einige Stunden offline):** **Dorfzentrum
zusammengeführt** (`180df88`, bauen AC-57, F14, bedienung AC-64 auf elf;
Board 610/716). Der ganze Browserlauf wartet auf ein fremdes `check:kurz`
(Managersitzung); danach `E2E_HAFEN=4391 npm run check:alles:neu:kurz`,
`qa:abweichung`, bei Grün pushen und ausrollen (Punkt 12 unten), sonst
Gründe aufschreiben. Erst danach `strategie-speichern` zusammenführen.
**Lauf 1 (12:05, 1,2 h statt 50 min):** 344 grün, 3 rot — spielziel
AC-20 und einheiten AC-42 nur am Aufräumen („trace recording“ 60 s,
Zip abgeschnitten), darstellung AC-10 39,9 Bilder/s. Die drei Dateien
laufen einzeln mit `QA_NACHWEIS=1` nach. **Ergebnis:** mit Aufzeichnung
fallen dort fünf Fälle am Zip („file data stream has unexpected number
of bytes“), einer an „AudioContext … audio device“; **mit `--trace off`
15 von 15 grün**, Bilder so geschrieben. Ursache die Umgebung: Sitzung
„WinDisc“ (kein Bildschirm), alle Audiogeräte „Unknown“ (Dock ab?).
darstellung AC-10 39,9 Bilder/s — rot, nicht gelockert. `qa:abweichung`
34 über 1 %, angesehen: Kamera/Ablauf, neu nur Taste L und Dorfzentrum
in der Wirtschaft. `npm run check` grün. Bilder committet, **nicht
gepusht, nicht ausgerollt** — der Lauf war nicht grün; der Benutzer
entscheidet, ob AC-10 auf diesem Rechner das Ausrollen aufhält, oder es
läuft einmal neu, wenn Bildschirm und Ton wieder dran sind.

**2026-11-22, Nachmittag — Entscheidungen des Benutzers (durchgeklickt):**
1. **Regelpaket übernehmen, Lücken schließen:** Laufregel, Seitengleichheit,
   Pfeilflug (Patches `scratchpad/uebergabe2/`, `uebergabe3/`, Zweig
   `strategie-regeln`). ki AC-25: die Wache nimmt auch eigene Einheiten aus
   (wie heute Gebäude, `EIGENES_NAH`). **Angepasst werden dürfen nur
   fahrplan AC-15 (A*-Gleichstände) und die eine Konterkreis-Paarung
   (Hellebardier gegen Langbogen, fahrplan AC-26)**; der Nebeltest (105 von
   120) bleibt hart.
2. **Kampfdauer:** erst Pfeilflug, dann nach einer Testpartie urteilen —
   keine Trefferchance, kein ×0,8 jetzt.
3. **Häuser-Balance (spielziel AC-18) nach dem Regelpaket.**
4. **Spielgeschwindigkeit: Vorgabe 1,5** (ADR-0013 und spielziel AC-23
   nachziehen; die Wahl 1,0/1,5/2,0 bleibt).
5. **Drache der KI: nur Krone, Variante A** (`scratchpad/ki-krone/ac29/`).
6. **einheiten AC-52 gepaart messen:** „der Drache tauscht den Sieger
   gegenüber derselben Partie ohne ihn in höchstens 20 %“.
7. **ki AC-28 (Hauseinheiten der KI) nach dem Regelpaket neu messen.**
8. **Reiterschütze nur Schützenlinie der Schmiede** (wie die Vorlage).
9. **Notfallklingel bauen, wie die Vorlage** (mehr Pfeile je Besatzung,
   drinnen heilen, beim Fall heraus). **Hinein über einen Knopf
   „Einquartieren“ in der Leiste der Einheit, dann das Gebäude anklicken**
   (Benutzer: „nen button bei den aktionen der einheiten, der iwie
   einquartieren heißt, da draufdrücken, und dann das gebäude wo sie rein
   sollen“). Die KI nutzt es zuerst nicht.
10. **Punkt 10:** die KI gibt weiter auf, auch mit stehendem Dorfzentrum.
11. **Aufgeräumt:** Arbeitsbäume `-techbaum`, `-bildumbau`, `-krone` samt
    Zweigen gelöscht; `-kikrone`, `-regeln` bleiben bis zum Regelpaket,
    `strategie-mauerring` und `-ki-antwort` geparkt.
12. **Ausrollen nach Dorfzentrum + ganzem Browserlauf:** pushen nach `main`,
    `npm run ausrollen`, danach eine Partie auf dem Server und das Packen
    (permessageDeflate hinter dem Proxy) prüfen. Das Regelpaket später.
13. **Reitertempo 1,55 passt.** Ton: noch nicht gehört.
Altes Bild AC-57 (Militärseite) darf weg (Benutzer: „Ja, entfernen“).

**2026-11-22, später Nachmittag:** **Speichern S1 und S2 fertig, NICHT
zusammengeführt** — `strategie-speichern` `da39f1e` (S1: `welt.sichern()`,
`steckbrief.laden()`, „FAST“ + Fassung + deflateRaw(v8.serialize), über 20
Startwerte Takt für Takt gleich) und `6f955c2` (S2: `server/partiestaende.js`
in der Konten-SQLite, `wert`/`vorher`, höchstens 5 je Konto,
`/api/partien`, Sichern je Spielminute, beim Leeren und Anhalten,
SIGTERM/SIGINT → `allesSichern()`); check:kurz grün, 1110 Tests, 37
Partien; Board dort 618/715. speichern AC-6 `in-arbeit` (Meldung im Bild
kommt mit S3). Gesetzt vom Agenten: bei 5 Ständen wird die neue Partie
nicht gesichert (noch ohne Meldung), Stand 18–121 KB, Sichern 2–20 ms,
geschätzt 40 ms einmal je Minute in einer großen Partie (nicht gemessen),
kein WAL. **Erst nach dem Ausrollen zusammenführen** (der Benutzer hat das
Ausrollen von Dorfzentrum + Browserlauf freigegeben, nicht das Speichern),
dann S3 (Oberfläche, Browser mit eigenem Hafen).

**2026-11-22, Nachmittag:** **Speichern S1 (dann S2) läuft als Agent** im
Arbeitsbaum `../OnlineGames-speichern` (Zweig `strategie-speichern`,
`E2E_HAFEN=4394`): speichern AC-1, AC-2, AC-5, AC-16, AC-17 — Welt und KI
als Wert, gleicher Lauf nach dem Laden über zwanzig Startwerte. Nichts
doppelt anfangen. Notfallklingel gegen ADR-0012 gehalten (offene Fragen).
**bedienung AC-64 entschieden** (Benutzer: „Ac 64 passt seine
Empfehlung"): Wirtschaft höchstens elf, Militär nach „Kampfeinheiten“,
das Dorfzentrum unter Wirtschaft. Ein Agent zieht das im Arbeitsbaum
`../OnlineGames-dorfzentrum` nach (`E2E_HAFEN=4395`); danach führe ich
zusammen, dann `check:alles:neu:kurz` und `qa:abweichung` — erst, wenn
kein anderer Lauf rechnet.

**2026-11-22, Mittag:** **Zweites Dorfzentrum (Punkt 39) gebaut, NICHT
zusammengeführt** — Zweig `strategie-dorfzentrum` `8e0986d`, Arbeitsbaum
`../OnlineGames-dorfzentrum`; bauen AC-57 und F14 `in-arbeit`. Daten:
`bauenAb: 3, hoechstens: 2` am Dorfzentrum (nicht `zeitalter: 3`, sonst
kippt der Aufstieg), `welt.bauZeitalter()`, KI baut keines; 1094 Tests grün.
**Klemmt an drei bestehenden Kriterien:** bedienung AC-64 (höchstens zehn
je Seite — die Wirtschaft hat in der Krone schon zehn; Militärseite für
alles, was Einheiten mit Angriff ausbildet, und der Dorfbewohner hat 3),
AC-81 (Technologiebaum gleiche Seite wie das Baumenü), AC-86 (auf
1366 × 768 ragt nichts heraus — mit der Spalte auf der Militärseite ragen
Außenposten, Wachturm, Tor, Mauer heraus, Browserfall rot). **Frage an den
Benutzer**, Empfehlung: AC-64 auf elf Gebäude der Wirtschaft und „Kampf-
einheiten“ ändern, dann steht das Dorfzentrum unter Wirtschaft.

**2026-11-22, Vormittag:** **F13 fertig und zusammengeführt** (`4910410`,
Zweig `strategie-krone-am-stueck`, Arbeitsbaum `../OnlineGames-krone`):
fahrplan AC-19 (`e2e/tests/strategie-krone-am-stueck.spec.mjs`, zwei
Fälle: Krone mit Stufen, Elite-Kriegswolf, Wunder bis zum Sieg; Drache
reißt ein Mauerstück) und AC-20 (`tests/strategie-grosse-partie.test.mjs`:
acht Spieler je 200 im Nebel, Takt 5,5 ms, gepackt ≤ 30,5 KB/s je Spieler,
wie `ws` packt rund 10; **ungepackt 160–182, bei „Aufgedeckt“ gepackt
147 — die Grenze hält nur im Nebel**). Mittel: `perMessageDeflate:
{ threshold: 1024 }` in `server/index.js` — **auf dem VPS nicht geprüft**
(Proxy, Speicher je Verbindung). Board 609/715. Browserlauf danach 348/350:
darstellung AC-10 „gerendert“ 44,9 Bilder/s (AC-30 übersprungen, hängt
daran). **Gegenprobe mit/ohne Packen unentschieden:** erst schien ohne
Packen besser (gerendert 58–59 gegen 52–58, im Gehen 54–56 gegen 43–55),
dann fiel alles auf 25–45, auch ohne — eine Managersitzung fuhr zugleich
Browsertests (`.claude/worktrees/manager`), danach ein fremdes `check:kurz`.
**Auf dem freien Rechner (Last ~20 %) nachgemessen:** mit Packen 44,5 und
33,2, ohne 34,7 und 35,6 Bilder/s — gleich schlecht, das Packen erklärt es
nicht; die Bildrate des Rechners ist heute insgesamt gesunken (früh 55).
**Packen bleibt.** Die Tempofälle (darstellung AC-10, AC-30) hängen am
Rechner; nicht gelockert.

**2026-11-22, Morgen:** **F12 teilweise zusammengeführt** (`c3f7173`,
Bilder `568f82d`): ki AC-35 (forscht), AC-39 (Krone), AC-40 (Wunder);
`npm run check` grün (1084 Tests, 17 Partien), Browserlauf 347/348
(darstellung AC-30 47,7 Bilder/s — bekannte Streuung, Stand ändert nichts
im Browser), `qa:abweichung` 24 über 1 %, angesehen, nur Kamera/Uhr. Board
607/715. **Nicht fertig aus F12:** ki AC-29 / einheiten AC-52 (Drache) —
Patch `scratchpad/ki-krone/ac29/` (Variante A: Nebel 107, aber nur 6 Rufe
in 120 Partien; Variante „ab Fürstentum“: 83 % Erstrufer gewinnt, Nebel
101). **Gepaarte Messung:** derselbe Startwert ohne Drache — der Erstrufer
gewinnt 39 von 48 auch ohne ihn; die 60-%-Grenze misst den Vorsprung, nicht
den Drachen → **Frage an den Benutzer**: AC-52 gepaart messen („Drache
tauscht den Sieger in höchstens X %“)? ki AC-28 v2 (Hauseinheiten) Patch
`scratchpad/ki-krone/ac28-v2/` — Nebel 105, eine ohne Sieger, 16 KIs ohne
Burgeinheit. **spielziel AC-18 fällt:** Eschenbruch 78, Rappenstein 64,
Distelhag 54, Wehrstein 29, Silberfurt 26 % (200 Partien auf `2cefbd5`) —
Ausgleich gegen Eschenbruch wäre die nächste Balance-Runde, Benutzer
fragen. Arbeitsbäume `OnlineGames-kikrone` (ungesicherter Drachenpatch),
`OnlineGames-regeln`, `OnlineGames-techbaum` — löschen nur auf sein Wort.

**2026-11-22, früher Morgen:** **Agent (d) fertig, nichts committet** —
Arbeitsbaum `../OnlineGames-regeln` ungesichert, Patch
`scratchpad/uebergabe2/alles.patch` (+ `LIESMICH.txt`). Gebaut: einheiten
AC-70 (Laufregel, 10 Felder = 100 Takte), kampf AC-26 (Seitengleichheit:
Reihenfolge je Takt gemischt `welt.reihe`, `taktX/taktY`, Gleichstände in
A*, `nachbarfeld`, Spirale), kampf AC-27 (Pfeil trifft beim Ankommen,
`welt.pfeileImFlug`, `PFEIL_TEMPO` 7 gesetzt); Werte gesetzt: Söldner Tempo
0,95, schwere Armbrust 13, Elite-Wiedergänger +10 Leben, Elite-Reiterschütze
+20; `ki.farmbauer`. **Rot, nur der Benutzer lockert:** fahrplan AC-15
(57,2 statt ≥60 s, Ursache neue A*-Gleichstände), fahrplan AC-26
Hellebardier gegen Langbogen umgekehrt 1/20, Nebel 103 statt ≥105 (HEAD
111; ohne Pfeilflug 106, mit altem A* 109). **spielziel AC-18 reißt schon
an HEAD** (Rappenstein 78, Eschenbruch 61, Distelhag 63, Wehrstein 28,
Silberfurt 20 %). **Agent (e): keine Teilmenge ist grün** — committet auf
`strategie-regeln` nur die Doku (`88bf6d8`, `d87d84f`: einheiten AC-70,
kampf AC-26, AC-27 als `offen`). Code als Patch unter
`scratchpad/uebergabe3/` (`pfeilflug-und-werte-code.patch` gilt auf
8915326). Laufregel reißt den Konterkreis; A*-Gleichstände reißen fahrplan
AC-15, ohne sie hält die Seitengleichheit nicht (ki AC-4 auch); Pfeilflug
reißt ki AC-25 (zwei gegen zwei, Startwert 8: die Wache verteidigt einen
eigenen Dorfbewohner am Platz des toten Verbündeten — `EIGENES_NAH` nimmt
nur Gebäude aus) und steht im Nebel genau auf 105. **Seitenfehler an HEAD
über 200 Startwerte: Bogen 21:179**, Ritter 80:120. Fragen an den
Benutzer: darf ki AC-25 auch eigene Einheiten ausnehmen? Konterkreis für
die Laufregel lockern? fahrplan AC-15 für A* lockern?

---

## Stand

- **Zweig `strategie` = `main` = `origin/main` = Server auf `b90686f`**
  (Dorfzentrum, ausgerollt 2026-11-22 14:15 mit Freigabe trotz rotem
  Lauf). Von außen geprüft: `/api/spiele` 200, wss steht, der Proxy
  handelt `permessage-deflate` aus. **Nicht geprüft:** eine echte Partie
  auf dem Server (Eröffnen braucht ein Konto) und wie stark dort gepackt
  wird.
  610 von 716 Kriterien fertig, 1095 Tests ohne Browser, 17 ganze Partien,
  351 im Browser (Zahlen in `CLAUDE.md`, Board `specs/BOARD.md`).
- **Arbeitsbäume neben dem Hauptordner:** `-speichern`
  (`strategie-speichern` `6f955c2`, S1+S2, nach dem Ausrollen
  zusammenführen); `-regeln` (`strategie-regeln` `d87d84f`, Doku des
  Regelpakets, Code als Patch im Scratchpad); `-kikrone`
  (`strategie-ki-krone` `2cefbd5`, Drachenpatch ungesichert); `-dorfzentrum`
  (gemergt, kann weg — nur auf sein Wort). Geparkt ohne Arbeitsbaum:
  `strategie-mauerring`, `strategie-ki-antwort`. Unter
  `.claude/worktrees/manager*` arbeitet die Managersitzung — nicht anfassen.
- **Stufe F:** F1 bis F14 stehen bis auf ki AC-28, ki AC-29, einheiten AC-52.

### Was nicht `fertig` ist (Spec-Stand 2026-11-22 mittags)

| Spec | Kriterien |
| --- | --- |
| bedienung | AC-36, AC-73 `in-qa` (AC-73: Vollbild gibt `Strg`+Ziffer — probiert der Benutzer selbst); AC-42, AC-44, AC-46 `offen` |
| darstellung | AC-6 `in-qa`, AC-24 `in-arbeit`; AC-11, AC-19, AC-20, AC-21 `offen` |
| einheiten | AC-52 `in-qa` (Drache, gepaart messen); AC-10, AC-32, AC-70 (Laufregel) `offen` |
| fahrplan | AC-21, AC-22 `in-qa`; AC-16, AC-18 `offen` |
| kampf | AC-26 (Seitengleichheit), AC-27 (Pfeilflug) `offen` — Regelpaket |
| karte | AC-7, AC-10 `offen` |
| ki | AC-20, AC-28 (Hauseinheiten), AC-29 (Drache), AC-31 (antwortet auf das Heer) `offen` |
| spielziel | AC-1 `in-arbeit`; AC-2 bis AC-4, AC-10 bis AC-13, AC-15, AC-16, AC-18 `offen` (AC-18: Häuser 30 bis 70 %) |

---

## Nächste Schritte, in dieser Reihenfolge

1. ~~Browserlauf, Ausrollen~~ erledigt (`b90686f` auf dem Server).
2. ~~`strategie-speichern` zusammenführen~~ erledigt (`05effa1`,
   check:kurz grün: 1119 Tests, 37 Partien; Board 619/716). **Speichern
   wird erst nach S3 ausgerollt** (Benutzer, 2026-11-22).
3. **S3 fertig und zusammengeführt** (`01b51ec`, Merge `6a934a4`; Board
   626/717, check:kurz des Agenten grün: 1126 Tests, 37 Partien):
   speichern AC-6 bis AC-11 und neu AC-27 (fünf Stände: Hinweis, kein
   sechster) — `e2e/tests/strategie-fortsetzen.spec.mjs`,
   `tests/speichern-fortsetzen.test.mjs`. Nebenbei: `raum.zustandSenden()`
   (angehaltene Partie schickt einen Zustand, auch bei der Pause).
   **Gesetzt, Fragen an den Benutzer:** Aufhören/Fortsetzen und die
   Zwei-Minuten-Frist nur allein gegen die KI (zu mehreren 30 min wie
   bisher); „Später weiterspielen“ ohne Rückfrage; bei AC-11 sichert die
   alte Sitzung zuerst; nie still verdrängen; Löschen mit zweitem Klick;
   Kamera je Stand im Browser; neuer Raumcode im angehaltenen Bild;
   raeume AC-18 kann einen schon geschlossenen Einzelraum anbieten
   („Diesen Raumcode gibt es nicht“). Im Bild AC-9 doppelt „Weiter“ oben
   und „Weiterspielen“ in der Mitte. **Browserlauf danach** (51,7 min):
   357 grün, rot nur darstellung AC-30 mit 49,4 Bildern/s (Grenze 50,
   Streuung, nicht gelockert), keine Zip-Fehler; `qa:abweichung` 31 über
   1 %, angesehen (Kamera, Ablauf, Zufall); `check:kurz` grün (1126
   Tests, 37 Partien); Bilder lokal committet `55bbb31`. **Nicht
   gepusht, nicht ausgerollt** — das Ausrollen des Speicherns braucht
   sein Wort, dazu die Fragen oben.
4. **Regelpaket** als Agent (Entscheidung 1 oben): Laufregel,
   Seitengleichheit, Pfeilflug; ki AC-25 mit eigenen Einheiten; Reiterschütze
   nur Schützenlinie; `ki.farmbauer` klären. Nur fahrplan AC-15 und die
   Paarung Hellebardier gegen Langbogen dürfen angepasst werden.
5. Danach: Häuser-Balance (spielziel AC-18), ki AC-28, Drache Variante A
   (`scratchpad/ki-krone/ac29/`), einheiten AC-52 gepaart (höchstens 20 %).
6. Vorgabe Spielgeschwindigkeit 1,5 (ADR-0013, spielziel AC-23).
7. Notfallklingel mit Knopf „Einquartieren“ (Entscheidung 9).
8. Ohne feste Reihenfolge: Haltungen (15b), dichter stehen (18), Gebäude
   angreifen ohne Einheiten (40), Abläufe Holzhacken und Feldarbeit
   (Blender), alte Texte mit Umlauten.

---

## Offene Fragen an den Benutzer

Beantwortet am 2026-11-22 nachmittags (Punkt 10, Reitertempo,
Spielgeschwindigkeit, Notfallklingel, Arbeitsbäume): siehe „Zuletzt
fortgeschrieben“.

- **Punkt 17 (Nachfrage):** welches Lager, wie weit, mit Umschalt, trug der
  Bauer etwas?
- **Punkt 23:** wie klingt der Ton? (noch nicht gehört)
- Beantwortet 2026-11-22, 14 Uhr: **ausrollen trotz rotem Lauf** („Ja,
  du darfst“); **Überflüssiges entfernen** — `-dorfzentrum` und `-regeln`
  samt Zweigen weg, `-kikrone` bleibt (ungesicherter Drachenpatch);
  **Speichern erst nach S3 ausrollen**.
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
  **Dasselbe gilt für Arbeitsbäume:** `git worktree remove --force` auf
  einen Arbeitsbaum mit dieser Junction leerte am 2026-11-22 das
  `node_modules` des Hauptordners (auch das der Managersitzung) — zuerst
  die Junction mit `cmd //c rmdir` lösen, dann entfernen; sonst `npm ci`.
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
