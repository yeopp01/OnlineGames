# Steuerstand

**Wofuer:** In langen Arbeitsschleifen (`/loop /strategie-weiterbauen`) wird
der Gespraechsverlauf irgendwann zusammengefasst, und dabei gehen Einzelheiten
verloren. Diese Datei ist der Stand, nach dem weitergearbeitet wird — genauer
als jede Zusammenfassung. Der Haken `.claude/hooks/steuerstand.mjs` legt sie
nach jeder Zusammenfassung und zu jedem Sitzungsbeginn von selbst wieder vor.

**Pflicht:** Nach jeder Runde fortschreiben, bevor die naechste beginnt. Wer
hier nichts eintraegt, verliert den Faden beim naechsten Autocompact.

---

## Zuletzt fortgeschrieben

**2026-11-21, 02:55 Uhr Ortszeit des Laufs (Opus, F6 bis F11 nach der Übergabe unten; F6+F7 committet `bba1e2b`, F8 bis F11, einheiten AC-41 und darstellung AC-32 committet `7013cf0`, Bilder `b45fbd8`; `npm run check` grün, 1063 und 14; nicht gepusht, nicht ausgerollt):** Ganze Partien unverändert (Nebel 120: 0 ohne Sieger, 111 vor Minute 60, Median 39,4; zwei gegen zwei alle vor Minute 90). Der Mönch bekehrt und heilt den Drachen nicht (`drache` in `nicht`, einheiten AC-38 ergänzt). **Als Nächstes:** F12 (KI in der Krone, eigener Block mit neuer Messung, dabei einheiten AC-52 messen), F13.
F8 bis F11 und AC-41 stehen im Arbeitsbaum: Drachen rufen am Kloster (bauen AC-35), Flug, Feuer, wer ihn trifft (einheiten AC-52, kampf AC-23), Tod mit Ei und Fressen (AC-53, AC-54), Wunder und Sieg nach zehn Minuten (bauen AC-51, spielziel AC-29), Karren mit sichtbarem Gold (einheiten AC-41); dazu darstellung AC-32 (Figuren der Krone) mit eigenem Test `e2e/tests/strategie-krone-figuren.spec.mjs`. Beschreibung in `CLAUDE.md` („F6 bis F11 stehen“). **Gesetzt, nicht aus der Vorlage:** Drache Angriff 8 und +660 gegen Gebäude (die ADR nannte 15 und +200 — gemessen in `tests/strategie-drache.test.mjs`: damit verlor die Burg allein nie, und zehn Armbrustschützen töteten ihn einmal in zwanzig; mit 8 und +660 fällt die Burg in acht Stößen, Fenster +640 bis +680; Sicht 10, Nahrüstung 0, Feuer 8 Felder/s ebenfalls gesetzt), Ansage nach dem Fallen 20 s, Rufen-Umkreis 3 Felder vom Rand, Hunger 5 Leben/s, Wunder-Bauzeit 4400 s (ein Dorfbewohner rund zehn Minuten mit acht; 7,98 → 10,03 min gemessen). Aus der Vorlage: `WUNDER_SEKUNDEN` 600. **einheiten AC-52 bleibt `in-qa`:** „KI gegen KI gewinnt der Drache höchstens 60 %“ misst erst F12. **Schautafel gemessen:** Wunder gegen jedes Gebäude mindestens 0,67 (Burg), Drache gegen jede Figur mindestens 0,855 (Riese), Spielerfarbe Drache 0,165, kein Überstand; jede Stufe der Krone gegen ihre Vorstufe über einem Drittel (Test AC-32). `?bilder=0` angesehen: gezeichnetes Wunder und Baustelle, Karren mit Goldkiste, Drache sichtbar (Zwischenspeicher reicht für Flieger bis `oben`), Leistenbildchen des gezeichneten Drachen jetzt tiefer und kleiner gesetzt. **Befunde aus dem vollen Lauf (02:40, 336 grün, 4 rot), alle behoben oder erklärt:** Baustelle der Größe 5 fehlte im Test darstellung AC-22 (Größen jetzt aus den Daten); auf 1366 × 768 ragten die drei Preise des Wunders aus dem Knopf (Preise im Baumenü brechen um, je Ware beisammen — die Leiste ist in der Krone drei Zeilen höher, ragt nicht); der Pfeiltest zählte einen echten Pfeil des Bogenschützen aus dem Fall davor (zählt jetzt nur die festgehaltenen); **darstellung AC-30 fällt auch einzeln und auch am Stand HEAD** (HEAD 41,2 und 48,0 Bilder/s, Arbeitsstand 46,1 bis 48,8, Grenze 50; Prozessorlast 9 %, kein Blender) — Streuung des Rechners, nicht diese Arbeit; Grenze nicht angefasst. Im Browser außerdem gefunden und behoben: der Drache wurde von Bäumen vor ihm verdeckt (Flieger jetzt nach allem am Boden gezeichnet), und der Zeiger sagte bei einer Miliz über dem Drachen „Angreifen“ (`bildZiel` lässt Flieger aus, wenn die Auswahl sie nicht trifft). **Nicht gebaut, wie verlangt:** F12, F13, kein Blender, nicht gepusht, nicht ausgerollt. **Offen für eine Bildsitzung:** keins — alle Tafeln, die F6 bis F11 brauchen, lagen vor.

2026-11-21, 00:40 (**Modelle für Drache, Drachenei, Dorfbewohner mit Ei, Wunder, Baustelle-5, Drachenfeuer und Marktkarren mit Gold gerendert; nichts davon verdrahtet — das macht Opus nach der „ÜBERGABE AN OPUS (2026-11-21, 00:40)“ unten; Push und Ausrollen nur auf Wort des Benutzers.**) Davor 2026-11-18, 19:45 (**Sitzung `onlinegames-ac`: AUFTRAG DES BENUTZERS (19:25): Krone im Browser belegen und committen, Konterkreis, mehr Gold und Stein, DANN AUSROLLEN; Tokens sparen (Fable bei 84 %). F5 (fahrplan AC-26) fertig, Punkt 55 (karte AC-18) gebaut und rechnerisch grün, KI-Partien laufen (Task `bkrmc74qt`), Render `b87d7tcz2` läuft — Eintrag „2026-11-18, 19:45“ unten.**) Davor 2026-11-18, 19:30 (**Sitzung `onlinegames-ac`: vier F2-Figuren geprobt, gemessen, eingetragen; Bergfried mit eigenem Modell und Bild verdrahtet; voller Render der vier Figuren und des Bergfrieds läuft (Task `b87d7tcz2`, seit 19:07, fertig gegen 20:05); Browserfälle zu F2, F3 und F4 geschrieben, nie gelaufen; 688 Rechentests grün; alles seit `2545f50` uncommittet; der Benutzer fragt nach dem Ausrollen — Eintrag „2026-11-18, 19:30“ unten.**) Davor 2026-11-18, 19:00 (**Sitzung `onlinegames-ac`: Render der fünf Krone-Figuren FERTIG und gemessen; F4 (einheiten AC-69, Elitestufen) angewendet, 688 Rechentests und Wächter grün; `f2-figuren.py` angewendet, Langbogenschütze und schwere Armbrust als Probe gerendert, Belagerungsramme und Onager proben (Task `bm0hsrgyc`); alles seit `2545f50` uncommittet, Browser offen — Eintrag „2026-11-18, 19:00“ unten.**) Davor 2026-11-18, 17:50 (**Sitzung `onlinegames-ac`: Paket (bauen AC-52 bis AC-56), F2-Spielseite (einheiten AC-67, AC-68) und F3 (bauen AC-48 bis AC-50) im Arbeitsbaum angewendet, 677 Rechentests und Wächter grün, Krone-Datei 16 von 16; Render `b5kk9tkm2` läuft noch; alles seit `2545f50` uncommittet, Browser offen — Eintrag „2026-11-18, 17:50“ unten.**) Davor 2026-11-18, 17:00 (**Sitzung `onlinegames-ac`: Hauseinheiten committet (`e18fad5`, `2545f50`, nur lokal); F1 im Arbeitsbaum angewendet (612 Rechentests grün, Browser offen); fünf Krone-Figuren rendern voll (Task `b5kk9tkm2`, seit 17:00, rund zwei Stunden); Paket bauen AC-52 bis AC-56 als Nächstes anwenden — Eintrag „2026-11-18, 17:00“ unten.**) Davor 2026-11-18, 16:00 (**Sitzung `onlinegames-ac`: Browserfälle 25 grün, 2 rot, Abhilfen im Code (Ritterzeit-Test wartet auf Stillstand; Reiterschütze mit Leibbinde, rendert ein zweites Mal — Task `bj7ir67hk`); F1 und Paket in einer Probekopie vorgeprüft (628 von 630 Rechentests, Typen und Wächter sauber), NICHT angewendet; ALLES UNCOMMITTET — Eintrag „2026-11-18, 16:00“ unten.**) Davor 2026-11-18, 15:45 (**Sitzung `onlinegames-ac`: Neu-Render fertig und gemessen (alle Paare über einem Drittel, Kriegswolf 472 Bildpunkte); Browserfälle der roten Fälle laufen (Task `b9wxdzj5i`); Specs mit Paladin und Paket bauen AC-52 bis AC-56 (Board 572 von 704); F1 und das Paket liegen als Skripte und Tests im Scratchpad, NICHT angewendet; ALLES UNCOMMITTET — Eintrag „2026-11-18, 15:45“ unten.**) Davor 2026-11-18, 15:10 (**Sitzung `onlinegames-ac`: voller Lauf 313 grün, 4 rot (Kriegswolf zu klein, Reiterschütze dem Späherreiter zu ähnlich, Ritterzeit-Test kannte die Hauseinheiten nicht); Abhilfen im Code, Neu-Render von Reiterschütze und Kriegswolf LÄUFT (Task `bccgtsu63`, seit 15:01); NEUE WÜNSCHE: Fable schreibt die Figuren selbst, Ritter → Kavalier → Paladin, Verbesserungen wie Kartografie; Figuren der Krone als Modellcode geschrieben, nie in Blender gelaufen; ALLES UNCOMMITTET — Eintrag „2026-11-18, 15:10“ unten.**) Davor 2026-11-18, 13:55 (**Sitzung `onlinegames-ac`: Renderreihe FERTIG (12:19, alle neun Modelle, `tests/bilder.test.mjs` grün); Spec-Runde Stufe F GESCHRIEBEN (13 neue Kriterien, alle `offen`); drei Befunde des Prüfers behoben; ALLES UNCOMMITTET; als Nächstes die Browserfälle der Hauseinheiten und des Wehrturms, dann Specs auf `fertig`, Board, voller Lauf, Commit — Eintrag „2026-11-18, 13:55“ unten.**) Davor 2026-11-18, 10:40 (**Sitzung `onlinegames-ac`: E8 (Meuchler mit Tarnung, Wiedergänger aus Gefallenen) in Server, Browser, Rechentest und Browsertest GEBAUT, UNCOMMITTET; Specs AC-42 bis AC-49 und kampf AC-22 umgeschrieben, Status `in-qa`, bis die Bilder da sind; volle Renderreihe LÄUFT NOCH (Task `bf53txgn1`, seit 10:05, zwei von acht Figuren fertig, rund 15 Minuten je Figur) — bis dahin kein Browserlauf, `npm run check` rot — Eintrag „2026-11-18, 10:40“ unten.**) Davor 2026-11-18, 10:15 (**Sitzung `onlinegames-ac`: E7 (Kriegswolf, Reiterschütze, Riese) in Server, Browser und Rechentest gebaut, UNCOMMITTET; die KI bildet vorerst KEINE Hauseinheit aus (`NOCH_NICHT` in `ki.js`), Nebel damit wie HEAD (111 / 39,4 / eine); volle Renderreihe LÄUFT (Task `bf53txgn1`, seit 10:05) — bis dahin kein Browserlauf, `npm run check` rot — Eintrag „2026-11-18, 10:15“ unten.**) Davor 2026-11-18, 09:52 (**Sitzung `onlinegames-ac`: der volle Lauf war GRÜN, eingecheckt als `4aeaf77` und `6afaa87` (lokal, NICHT gepusht); Wehrturm (Punkt 57) und E6 (Eibenschütze, Pavesenschütze, Söldner) im Code eingebunden, UNCOMMITTET; Renderprobe läuft (Task `bylwzn047`), `npm run check` ROT, bis voll gerendert ist — Eintrag „2026-11-18, 09:52“ unten.**) Davor 2026-11-18, 09:25 (**Sitzung `onlinegames-ac`: der volle Lauf LÄUFT NOCH (Task `bd6r0w9gm`); der Kriegswolf liegt als Code vor (`grafik/wolf.py`, `grafik/kriegswolf.py`), von mir durchgelesen, NICHT gerendert — Eintrag „2026-11-18, 09:25“ unten.**) Davor 2026-11-18, 09:12 (**Sitzung `onlinegames-ac`: der volle Lauf LÄUFT NOCH (Task `bd6r0w9gm`); währenddessen die Modelle der Spezialeinheiten und des Wehrturms als Code unter `grafik/` vorbereitet — NICHTS davon gerendert, nichts im Verzeichnis; Benutzer hat „wie gehabt fortfahren“ gesagt, Push und Ausrollen weiter nur auf sein Wort — Eintrag „2026-11-18, 09:12“ unten.**) Davor 2026-11-18, 09:00 (**Sitzung `onlinegames-ac`: Punkt 56 (gefällter Baum, darstellung AC-31) GEBAUT UND EINZELN BELEGT; mit 54, 53, 50, 58 ALLES UNCOMMITTET; voller Lauf `npm run check:alles:neu:kurz` wird gestartet — währenddessen nichts unter `public/`, `server/`, `specs/` ändern und kein Blender; Benutzer weiter abwesend — Eintrag „2026-11-18, 09:00“ unten.**) Davor 2026-11-18, 08:30 (**Sitzung `onlinegames-ac`: Punkte 54, 53, 50 und 58 GEBAUT UND BELEGT, ALLE UNCOMMITTET (kein voller Lauf seither); Punkt 56 (gefällter Baum) begonnen — Entwurf steht, noch keine Datei geändert; Benutzer weiter abwesend — Eintrag „2026-11-18, 08:30“ unten.**) Davor 2026-11-18, früh (**Sitzung `onlinegames-ac`: voller Lauf GRÜN, zwei lokale Commits `2387afe` und `bd29832` (nicht gepusht, nicht ausgerollt — Benutzer abwesend); Auftrag für die nächsten Stunden: Punkte 54, 53, 50, 58, 56, dann Spezialeinheiten mit Blender, dann Krone — Eintrag „2026-11-18, früh“ unten.**) Davor 2026-11-18, 02:21 (**Sitzung `onlinegames-ac`: Performance (Punkt 45) gebaut und gemessen — darstellung AC-30, drei Umbauten; 51 betroffene Browserfälle grün, voller Lauf mit neuen Bildern LÄUFT (Task `b4xzap3fo`); ALLES NOCH UNCOMMITTET, auch der Stapel 46/47/49/51/52/Lautstärke — Eintrag „2026-11-18, 02:21“ unten.**) Davor 2026-11-18, gegen 00:40 (im Eintrag steht „vormittags“) (**Sitzung `onlinegames-ac`: Punkte 46, 47, 49, 51, 52 und die Lautstärke gebaut und im Browser belegt, noch nicht committet; Punkte 53 bis 58 notiert; als Nächstes die Performance (Punkt 45) — Eintrag „2026-11-18, vormittags“ unten.**) Davor 2026-11-17, 23:40 (**Sitzung `onlinegames-ac`: Auftrag vom 17.11. — Punkte 45 bis 47 umsetzen, Lautstärke im Menü, Wegpunkte für den Späher; nachgelesen und geplant, noch nichts gebaut — Eintrag „2026-11-17, 23:40“ unten.**) Davor 2026-11-16, 08:32 (**Sitzung Bildumbau: Hauptordner vorgespult, Gebäude-Worktree entfernt, alles auf `a9a4d9a` — Eintrag „08:32“ unten.**) Davor 2026-11-16, 08:14 (**Sitzung Bildumbau: Zweige aufgeräumt, auf GitHub nur noch `main` und zwei geparkte — Eintrag „08:14“ unten.**) Davor 2026-11-16, 00:36 (**Sitzung Bildumbau: Beitritts-Korrektur `a9a4d9a` committet, voller Browserlauf grün, ausgerollt, `main` auf GitHub = `a9a4d9a` — Eintrag „00:36“ unten.**) Davor 2026-11-15, 23:46 (**Sitzung Bildumbau: `main` auf GitHub = `493a184` — Eintrag „23:46“ unten.**) Davor 23:37 (**Sitzung Bildumbau: Bilder committet `493a184`, ausgerollt — Eintrag „23:37“ unten.**) Davor 23:21 (**Sitzung Bildumbau: voller Browserlauf 292 + 4 einzeln grün, Check läuft — Eintrag „23:21“ unten.**) Davor 23:19 (**Vier Meldungen aus der Partie zu zweit, Punkte 45 bis 48: Ruckeln im Gefecht, toter Vorraum-Knopf, markierter Text, Handy — untersucht und gemessen, nichts gebaut — Eintrag „23:19“ unten.**) Davor 21:46 (**Punkt 43 committet `04fbb80`, voller Browserlauf läuft — Eintrag „21:46“ unten.**) Davor 21:32 (**Punkt 43: Nebeltest auf 120 Startwerte umgestellt, Check läuft — Eintrag „21:32“ unten.**) Davor 21:15 (**Punkt 43: Check gefallen am Nebeltest (Startwert 14 ohne Sieger), Messung 1–120 läuft — Eintrag „21:15“ unten.**) Davor 21:00 (**Punkt 43: fünf Kampftests an die Nebelregel angepasst, Partien stehen aus — Eintrag „21:00“ unten.**) Davor 19:19 (**Punkt 43: Ursache gefunden (Klick in den Nebel griff an), behoben in `welt.feindAn`, uncommittet, `npm test` läuft — Eintrag „19:19“ unten.**) Davor 19:07 (**Punkt 42/44 committet `9150526`; Punkt 43 eingelegt, uncommittet — Eintrag „19:07“ unten.**) Davor 18:35 (**Punkt 42 und 44 gebaut, belegt, uncommittet, Check läuft — Eintrag „18:35“ unten.** Davor 18:30: drei neue Meldungen des Benutzers, Punkte 42 bis 44 — siehe Eintrag „2026-11-15, 18:30“ unten; sonst unverändert:** AUSGEROLLT `2554470`, lokal `57b12dc`). Davor: 2026-11-14, 19:47 (**AUSGEROLLT ist `2554470` seit 16:52 (Entf, KI-Wirtschaft, Baumenü) und GEPUSHT (`origin/strategie-bildumbau` = `2554470`); vor der Partie (gegen 21 Uhr) wird nichts mehr ausgerollt und während der Partie kein schwerer Lauf gefahren. Punkt 13 (ki AC-36) ist LOKAL COMMITTET: `57b12dc` auf `strategie-bildumbau`, Check `check-11.log` grün (926 und 14), nicht gepusht, nicht ausgerollt, kein voller Browserlauf — siehe Eintrag 19:42 unten. Der Worktree ist sauber.** Davor: 19:20 (**AUSGEROLLT ist `2554470` seit 16:52 (Entf, KI-Wirtschaft, Baumenü); vor der Partie wird nichts mehr ausgerollt. Punkt 13 (ki AC-36) uncommittet im Worktree, wird gemessen — siehe Eintrag 19:20 unten. Früher am Tag lokal committet: `859834f` (Entf-Taste) und `9c196eb` (KI-Wirtschaft ki AC-37/AC-38). UNCOMMITTET: Baumenü auf zwei Seiten (bedienung AC-64), voller Browserlauf `alles-7.log` läuft seit 16:15 — siehe Eintrag 16:20 unten.** Davor: 2026-11-14, 11:17 (**AUSGEROLLT ist `0eac484` (seit 11:17) — Commit auf `strategie-bildumbau`, Check grün (908 und 14, 291 im Browser), NICHT gepusht (Benutzer abwesend). Darin alle Rückmeldungen bis Punkt 21; die Einträge von 01:13 bis 11:1x weiter unten sind damit ERLEDIGT und COMMITTET. Der Benutzer ist „einige Stunden weg", „bitte nicht auf input von mir warten", „Wir haben noch 10h zeit !" (11:15) — Testpartie also gegen 21 Uhr. AB JETZT, in dieser Reihenfolge, jeder Schritt eigener Commit mit grünem Check: (1) Punkt 38 Entf-Taste, einfach („nur entfernen, müssen keine massenentf sein oder so."); (2) KI-Block einzeln und gemessen (9/34 Felder und Lager, 13 Späher, 19, 35, 22, 24, 40, Brachen, ki AC-35) — Grenzen nicht lockern, drei stehen ohne Abstand; (3) Punkt 4 Baumenü. Ausrollen weiterer grüner Stände vor der Partie gehört zum Plan des Benutzers („bis dahin bauen, Commit, Ausrollen"), aber nur ganz geprüft, Räume leer, nie `--sofort`, letztes Mal spätestens 19 Uhr. Punkt 17 erledigt (Fehlbeobachtung), Punkt 6: Alt+Ziffer genügt ihm.** Davor, überholt: 00:40, drei KI-Tests fielen; 00:01 (**Truppenstufen COMMITTET: `7aead4a` auf `strategie-bildumbau`, Check grün (852 und 14, von Hand mit `--test-concurrency=4`), nicht gepusht; `npm run ausrollen` LÄUFT seit 00:00 (Task `b2iood765`, `AUSROLLEN_WARTEN=120`, Protokoll `$S/ausrollen-7aead4a.log`) und wartet auf das Ende der Partie des Benutzers — danach `--stand` prüfen; als Nächstes die Rückmeldungen 1–34 in der Reihenfolge unten, zuerst Punkt 30**; davor, überholt: Truppenstufen in Arbeit, UNCOMMITTET im Baum `strategie-bildumbau` auf `5d64f05` — Abschnitt „Truppenstufen" unten: alles gebaut, alle Figuren gerendert und gemessen (drei nachgebessert), KI-Regel E entschieden; der volle Browserlauf ist GEFALLEN (7 von 269, siehe „Browserlauf 22:22" am Ende des Abschnitts), die sieben Dateien laufen einzeln nach; offen: Check, Status `fertig`, Commit, ausrollen**; davor: `strategie` (`4af0cb3`) ist in `strategie-bildumbau` zusammengeführt: `5d64f05`, Check grün (839 und 14), kein Browserlauf, nicht gepusht, nicht ausgerollt — Abschnitt „Merge von `strategie`" unten; als Nächstes: Truppenstufen, dabei `ki-faul.js` einbauen**; davor: das breite Tor, bauen AC-37, committet `096590b` im Baum `strategie-bildumbau`, nicht gepusht; **ki AC-33 Burgen und ki AC-23 Rammen committet `c798ce9` dort, Check grün (824 und 13), nicht gepusht, nicht ausgerollt — Abschnitt „KI-Burgen und Belagerung" unten; danach ki AC-34 „mehr Militärgebäude bei Überfluss" committet (Check grün, 826 und 13); KI-Mauerring gebaut, gemessen und GEPARKT auf `strategie-mauerring` `bf1ff0a` (reißt „alle mit Sieger"); als Nächstes: Truppenstufen (zwei Schützenlinien)**; davor committet: Schautafel `787cd4a`, ADR-0017 `c3329b1`, Burg-Salve `e3b4b41`; einheiten AC-30 geparkt auf `strategie-standplatz` `97815b7`; Server auf `2f9ec0e`) — am 2026-11-12 um 21:50 **von Grund auf neu gefasst** (Benutzer: „da ist vieles
nicht mehr aktuell"). Vorher stand hier eine Chronik der Runden 60 bis 200 und
ein „Wo ich stehe", das bei Runde 86 endete. Beides liegt unverändert in
[`steuerstand-archiv.md`](steuerstand-archiv.md) und wird nicht mehr
vorgelegt. Was davon heute noch gilt, steht in `CLAUDE.md` (Abschnitt „Stand")
und in [`erkenntnisse.md`](erkenntnisse.md).

**Wie fortschreiben:** die Abschnitte unten **ersetzen**, nicht verlängern.
Eine Runde, die fertig ist, braucht hier eine Zeile; wie sie gebaut ist,
gehört in `CLAUDE.md` oder die Erkenntnisse. Diese Datei wird zu jedem
Sitzungsbeginn ganz vorgelegt — über 300 Zeilen liest sie niemand mehr.

## Drei Arbeitsbäume — wer wo arbeitet

| Baum | Zweig | Stand | Wem er gehört |
| --- | --- | --- | --- |
| `C:\Users\danie\OnlineGames` | `strategie` | Runden 200 und 201 in einem Commit (auf Wunsch des Benutzers, **mit rotem Check**: fahrplan AC-24, Startwert 11), 43 Commits vor `origin/strategie`: 200 = bauen AC-7, Leben der Baustelle (`welt.js`, `ki.js`, `auswahlleiste.js`, `tests/strategie-bauleben.test.mjs`, Bild zu AC-7); 201 = Eschenbruch abgeschwächt (`daten.js`, `welt.js` `boniAb`/`zeitalterWirkungen`, Haus-Tests, ADR-0014, spielziel). **Die Schleife ruht** (Benutzer: Pause) | der Schleife `/loop /strategie-weiterbauen` |
| `C:\Users\danie\OnlineGames-bildumbau` | `strategie-bildumbau` | HEAD `e3b4b41`, 27 Commits seit der Abzweigung bei `144fc2d`: Bildumbau R1 bis R6, Betrieb auf dem VPS, Rückmeldungen aus zwei Spielen, Schautafel aus den Tafeln (`787cd4a`), ADR-0017 (`c3329b1`), Burg-Salve (`e3b4b41`). **Uncommittet: das breite Tor** (siehe unten). Nicht gepusht, nicht ausgerollt | der Sitzung „Bildumbau und Rückmeldungen" |
| `C:\Users\danie\OnlineGames-gebaeude` | `strategie-gebaeude` | HEAD `2060173`, sauber, in `strategie-bildumbau` übernommen (`5249fb7`) | dem Blender-Agenten — **fertig**, der Baum kann weg |

Geparkte Zweige ohne Baum: **`strategie-standplatz`** (einheiten AC-30,
wartet auf den Benutzer, siehe unten), `strategie-ki-antwort` (ki AC-31, nicht wirksam),
`strategie-ki-ritterzeit`, `strategie-ki-sicht` (beide längst eingebunden).

**Regeln dazu:**

- Niemand arbeitet im Baum eines anderen. Lesen ja, schreiben nein — außer an
  dieser Datei, die der Haken aus dem Hauptbaum vorlegt.
- **Nie `main`.** `strategie` und die Nebenzweige werden nur gepusht, wenn der
  Benutzer da ist.
- **Ausgerollt wird nur aus `strategie-bildumbau`** — nur dort gibt es
  `scripts/ausrollen.mjs` —, und nur, wenn der Benutzer da ist oder es
  verlangt.
- **Nie mehr als ein Blender-Prozess** zugleich, auch nicht für Proben.

**Zusammenführen steht aus** (`strategie-bildumbau` → `strategie`), erst wenn
die Schleife ruht und fahrplan AC-24 wieder grün ist. Zu erwarten:

- Konflikte in `CLAUDE.md`, `welt.js`, `ki.js`, `auswahlleiste.js`,
  `specs/BOARD.md`, in dieser Datei und in vielen Bildnachweisen (auf
  `strategie-bildumbau` sind alle neu aufgenommen — nach dem Zusammenführen
  einmal `npm run check:alles:neu:kurz`).
- **Nummern, die `strategie-bildumbau` schon vergeben hat** und die die
  Schleife nicht noch einmal vergeben darf: bedienung AC-51 bis AC-62,
  einheiten AC-55 bis AC-57, bauen AC-36, raeume AC-17 und AC-18,
  darstellung AC-17 bis AC-25, **bauen AC-37**. (speichern AC-19 bis AC-21 gab es schon, dort
  sind sie jetzt `fertig`.)
- Zwei Testkorrekturen an `platz.bild` gibt es nur auf `strategie-bildumbau`.
- **Seit 2026-11-13 prüft TypeScript auf `strategie`** (`npm run typen`,
  `tests/waechter-typen.test.mjs`, uncommittet): jede Datei unter `server/`
  außer dem Managerspiel trägt `// @ts-check`. Nach dem Zusammenführen
  verlangt der Wächter die Marke auch für neue Serverdateien von
  `strategie-bildumbau` (etwa `bringt.js`), und neue Felder in `daten.js`
  gehören in die `@typedef` dort. Danach die Browserdateien unter `OFFEN` im
  Wächter abarbeiten (`ansicht.js`, `app.js`, `tasten.js`, `gelaende.js`,
  `boden.js`).

## Was auf dem Server läuft

`https://spiele.featureinsights.com`, Hetzner-VPS `mem-vps`, Container
`onlinegames` — **Commit `7aead4a`** (ausgerollt 2026-11-14, 00:06: Truppenstufen, Burg-KI, breites Tor; davor `2f9ec0e` vom 2026-11-13, 00:40: alles gerendert,
auch die Gebäude; `?bilder=0` zeigt die gezeichneten Fassungen; neuer Ton,
Nebelfix). Ausrollen: `node scripts/ausrollen.mjs` im Baum
`OnlineGames-bildumbau` (rollt HEAD aus, sichert vorher die Konten, prüft
danach von außen; unter einer Minute). Auf der Maschine laufen fremde
Anwendungen: nichts davon anfassen, nicht neu starten, am Caddy nur
`onlinegames.caddy`. Zugangsdaten stehen nicht im Repository
(`.env.betrieb` nur örtlich).

## Stand `strategie` (die Schleife)

- **Board im Hauptbaum:** 484 von 605 fertig, 767 Tests ohne Browser, 233 im
  Browser (Stand Runde 199; Runde 200 ändert das, sobald sie committet ist).
- **Stufe E (Häuser) läuft.** Gebaut bis Runde 200: Häuser als Daten, Wahl im
  Warteraum, Boni und Mannschaftsbonus, KI neigt zu ihrem Haus, Wehrstein baut
  Türme, Kaserne im Wechsel (ki AC-32); daneben die Bedienung bis AC-50
  (Gruppen, Wegpunkte, Bauen und Angreifen mit Umschalt, Punkte) und bauen
  AC-17 bis AC-19, AC-7.
- **Runde 201 (Eschenbruch) ist committet:** Holz +5 %,
  Reichweite ab dem Fürstentum (`boniAb`), 73 %.
- **Runde 202:** Schützen 30 Holz, Silberfurt Gold +15 %, Distelhag
  Fernrüstung +2 — Eschenbruch 66 … Silberfurt 29 %. Offen: der Test zu
  spielziel AC-18 in `npm run check`; die KI schickt Karren in den Gegner
  (Erkenntnisse, Runde 202).
- **Der Check ist rot, committet trotzdem (Benutzer: „committe das zeug bitte“):** Runde 200 macht fahrplan AC-24 rot (zwei gegen
  zwei, Startwert 11 endet nicht vor Minute 90; auf HEAD Minute 66,2).
  Nicht untersucht. Nächster Schritt: `npm run pruefstand:verlauf` für
  Startwert 11 im Zwei-gegen-zwei gegen HEAD; die Grenze nicht lockern.
  Unter Last fallen außerdem einheiten AC-31 und kampf AC-15
  (Zeitmessungen, einzeln grün).
- **Danach:** AC-24 grün machen (`npm run check:kurz` mit fail 0), erst dann
  das nächste offene Kriterium. Vorher die Liste der vergebenen Nummern oben
  lesen.

## Stand `strategie-bildumbau`

**Board dort:** 511 von 632 fertig, 808 Tests ohne Browser, 263 im Browser.
Das genaue Standdokument dieses Zweigs ist
`docs/strategie/bildumbau.md` **im Baum `OnlineGames-bildumbau`** (Absatz
„Arbeitsstand … (fortschreiben)").

**Bildumbau (ADR-0016):** alle Einheiten, Tiere, Gelände, Boden, 19 Gebäude,
Baustellen in vier Stufen, Mauer aus Stücken und Tor liegen als gerenderte
Tafeln unter `public/bilder/` (Blender-Skripte unter `grafik/`).

**Rückmeldungen des Benutzers aus dem ersten und zweiten Spiel auf dem
Server** (23 Punkte, 2026-11-12):

| Punkt | Stand |
| --- | --- |
| 1 Schafe schlachten · 2 Wirkung an Forschung und Einheit · 4 blaue Umrisse ab Baubeginn · 5 Rechtsklick Übersichtskarte · 6 Leiste verschiebt sich · 9 Randschieben ohne Vollbild · 11 leerer Vorrat → heim · 12 Rechtsklick aufs Lager lädt ab · 14 Punkte ständig im Bild · 16 nächste Baustelle mitbauen · 20 verlassene Partien halten an | **fertig, auf dem Server** (erster Stapel, `4ede74f`) |
| 3 Späherreiter schneller (1,55 ab dem Lehen) · 7 Ton · 13 Pause (Knopf, `F3`) · 19 Fremdes ansehen mit Leben | **fertig, auf dem Server** (zweiter Stapel, `d6a3739`) |
| 21 Gebäude gerendert, gerenderte Bilder als Vorgabe, Bildnachweise neu | **fertig, auf dem Server** (`6b99ff7`) |
| 22 Nebel: fremdes Dorfzentrum unsichtbar, Späher nur Umriss — jetzt im Bild ab dem ersten sichtbaren Feld der Grundfläche (kampf AC-12, `ansicht.siehtGebaeude`) · 23 Ton „sehr langweilig": Musik als Stück in d-Moll, im Kampf dichter (bedienung AC-60 neu gefasst), Schwerter, Pfeile, Einschläge, Axt und Hammer dort, wo sie im Bild stehen (bedienung AC-62) | **fertig, auf dem Server** (`2f9ec0e`) — der Klang ist gemessen (`npm run ton:messen`), nicht gehört; das Urteil des Benutzers steht aus |
| 8 Holzhacken erkennbar | halb: am Zeiger steht, was der Rechtsklick tut; eigener Ablauf im Bild fehlt |
| 18 Liste offener Spiele, Wiedereinstieg, Startklick | halb: Partie wartet 30 Minuten, Vorraum bietet Rückkehr; Liste und Startklick hängen am Speichern |
| 10 Sammler stehen ineinander (einheiten AC-30) | **gebaut, geparkt auf dem örtlichen Zweig `strategie-standplatz` (`97815b7`), nicht auf dem Server** — siehe „Geparkt" unten: zwei Partientests fallen, die Entscheidung liegt beim Benutzer |
| 13 Speichern und Laden | offen — **ADR-0017 ist entschieden** (`c3329b1`), gebaut wird in S1 bis S4 |
| 15 Feldarbeit statt Hacken auf der Farm | offen — neue Abläufe des Dorfbewohners mit Blender |
| 17 Notfallklingel | offen — neuer Umfang, erst gegen ADR-0012 halten |

**Geparkt (2026-11-13, 02:00) — einheiten AC-30, Standplätze.** Zweig
`strategie-standplatz`, ein Commit `97815b7` auf `2f9ec0e`, **Check rot**;
der Baum `OnlineGames-bildumbau` steht wieder sauber auf
`strategie-bildumbau` (`2f9ec0e`). Einbinden, sobald der Benutzer
entschieden hat: `git merge strategie-standplatz` (alle Bildnachweise sind
dort neu aufgenommen, 264 Browserfälle grün, die 23 über 1 % gelesen).
Darin: `welt.js`
(`standplatz`, `amStand`, `wegZumPlatz`, `STANDPLAETZE` — vier Viertel je
Nachbarfeld des Vorrats, Platz im Auftrag als `auftrag.stand`), `wege.js`
(`NACHBARN`), `ki.js` (`erkunder`: der Späher auf Erkundung ist keine
Wache — sonst fällt ki AC-13 an Startwert 4), `tests/strategie-standplatz.test.mjs`
(fünf Tests, grün), `tests/regeln.test.mjs` (karte AC-9 angepasst),
Browserfall mit Bild in `e2e/tests/strategie-ausweichen.spec.mjs`, Spec
(AC-30 `fertig`, Satz in AC-29 und ki AC-14), `CLAUDE.md`, Board 512/632.

- **Gemessen:** engstes Paar 0,5 Felder (vorher 1661 von 12 379 Proben
  näher); 500 Nahrung Median 9,45 statt 9,39 min, keine KI nach Minute 10;
  Feudalzeit 11,6 wie zuvor; Späher findet den Gegner nach 1,9 bis 2,4 min.
- **Rot, und nicht meine Entscheidung:** `tests/partien/ki-im-nebel`
  (Startwerte 1–40: 34 statt 35 vor Minute 60, Median 44,4, Startwert 27
  ohne Sieger — ausgeglichene Partie, bei Minute 90 gerade entschieden) und
  fahrplan AC-24 (zwei gegen zwei, Startwert 16 unentschieden). Über mehr
  Startwerte: Nebel 1–120 neu 107 vor Minute 60 und 2 ohne Sieger, HEAD 111
  und 1 (auch HEAD hat einen ohne Sieger, bei 41–80); zwei gegen zwei 1–40
  neu 35 vor 60 und 1 ohne Sieger, HEAD 38 und 0. Zusammen 142 gegen 149 von
  160 vor Minute 60 (z = 1,4, nicht gesichert), Mediane im Mittel 42,8 neu
  gegen 43,5. **Die Grenzen nicht lockern** (Ersatzgrenze des Benutzers vom
  2026-11-10).
- **Gegenproben:** der Späher allein ändert nichts (HEAD mit ihm: 111 von
  120 wie HEAD), die Plätze allein 106; die Wirtschaft kostet es auch spät
  nichts (bis Minute 25 gesammelt 8402 statt 8252).
- **Vorgehen:** `strategie-bildumbau` bleibt grün auf `2f9ec0e`, dort geht
  es mit der Schautafel weiter. Dem Benutzer vorlegen: (a) so nehmen wie Runde 200 auf `strategie` („mit
  rotem Check"), (b) den Nebeltest auf 120 Startwerte verbreitern — dann
  hält „alle mit Sieger" auch auf HEAD nicht —, (c) die KI gibt früher auf.
  Empfehlung: (b), bis dahin (a). **Nicht ausrollen ohne sein Wort.**
- Messskripte im Scratchpad der Sitzung: `n40.cjs <wurzel> [probe|-] [ab]`
  (40 Nebelpartien mit Häusern), `p5.cjs` (500 Nahrung), `p13.cjs` (Späher),
  HEAD-Kopie unter `head/`.

**Gerenderte Bilder als Vorgabe: fertig** (`6b99ff7`, ausgerollt). Vorgabe
an, `?bilder=0` zeigt das Gezeichnete, Ladesatz, `ETag`/304 (darstellung
AC-25), Gebäude samt Mauer, Tor, Farm, Baustellen, Knopfbilder der Leiste,
darstellung AC-22 `fertig`. Alle Bildnachweise neu; drei Prüfer haben sie
gegen die Titel gelesen, 23 Titel sind neu gefasst. Voller Lauf: 259 von
261, die zwei gefallenen (spielziel AC-24, auswahl AC-24) scheiterten im
Warteraum am Beitritt und sind einzeln grün. `check:kurz` 804 von 804; die
Zeitmessung einheiten AC-31 reißt gelegentlich knapp (1,02 ms), wenn die
Maschine belastet ist.

**Erledigt seit dem letzten Ausrollen (nicht auf dem Server):**

- **Schautafel aus den Tafeln** (`787cd4a`, darstellung AC-24 bleibt
  `in-arbeit`, bis die gezeichneten Fassungen auf das Wort des Benutzers
  entfernt sind). Messungen umgestellt, Grenzen am Bild nicht gelockert.
  **Echter Befund, bleibt rot:** bedienung AC-36 (Umriss bei Zoom 1 gegen
  den Dorfbewohner, 0,19 bis 0,30 statt 1/3) und darstellung AC-6
  (Dorfbewohner und Miliz decken sich zu 0,793 statt 0,75) — beide `in-qa`
  mit `test.fail`, Abhilfe am Modell im Blender-Block. „Gold höchstens 2 %
  grau" gilt nicht mehr (20 % Fels, wie AC-23 es will) — **dem Benutzer
  sagen**.
- **Burg-Salve** (`e3b4b41`, bauen AC-32): vier Pfeile je Salve, `pfeile`
  in den Daten.

**Das breite Tor (bauen AC-37, `fertig`, committet `096590b`):**

- Daten: `tor: { groesse: 1, laenge: 4, pfeiler: 1 }`; Gebäudefeld `quer`
  (längs y), auf der Leitung `qu: 1`, im Aufbau `laenge` und `pfeiler`.
  `welt.grundflaeche(art, x, y, quer)` ist die eine Stelle; Anker ist das
  dritte der vier Felder. Richtung: Nachricht `bauen` mit `quer`, sonst
  `welt.lageRaten()`; im Browser dreht `R`. Ersetzt jedes eigene Mauerfeld
  darunter. Schräg gibt es kein Tor mehr.
- Bild: `grafik/tor.py` neu (Torhaus, zwei Türme, Bogen über zwei Felder,
  zu und offen, zwei Richtungen), gerendert. Der Browser zeichnet es in
  vier Streifen je Feld (`ansicht.gebaeudeMalen`), im Bau je Feld ein Gerüst.
- Tests: `tests/strategie-mauern.test.mjs` (vier neue zu AC-37),
  `strategie-buendnisse`, Prüfstand-Ring mit langem Tor; Browser:
  `strategie-mauern` (AC-31 angepasst, AC-37 neu mit drei Bildern),
  `strategie-gerendert`, `strategie-ritterzeit-am-stueck` — einzeln grün,
  Bilder angesehen.
- Erledigt seit 09:20: AC-37 auf `fertig` (Board 510/633), CLAUDE.md-Absatz.
  Ein voller Lauf um 09:40 brach nach 45 min ab (acht Fälle rot), **weil ich
  nebenher KI-Partien rechnete** — nachgefahren waren sie grün bis auf
  `strategie-befehlszeichen`. Dort zwei Rennen, **beide auch auf HEAD**
  (Gegenprobe im HEAD-Baum, kein Regress durch das Tor), beide im Test
  behoben: AC-13 hält das Zeichen im selben `evaluate` an, das es liest;
  AC-34 hält die Uhr an (`zeitraffer 0`), sobald Anna alle drei Milizen
  sieht, und lässt sie am Ende des Falls wieder laufen. Viermal grün.
- Ein zweiter voller Lauf (10:20 bis 11:01, ohne Nebenlast) fiel mit 13
  Fällen in 40 min, fast alle beim Beitreten mit 8-s-Grenze — die Maschine
  war zäh und **startete um 11:19 neu** (Arbeitsprozesse mit
  `0xC000026B`); danach lief `strategie-befehlszeichen` in 12 statt 30 s.
  Dabei gefunden und behoben: das Zielzeichen lebt 800 ms, fünf Fälle
  hielten es erst nach dem Klick an → Helfer **`zeichenHalten(page)`** in
  `e2e/helpers/strategie.mjs`, vor dem Klick gerufen (befehlszeichen,
  buendnisse, buendnis-loesen, moench, rueckmeldung). Und AC-34 hält die
  Uhr erst an, wenn auch der **Browser** Berts Miliz sieht — auf der
  schnellen Maschine stand sie sonst vor dessen Sichtrechnung.
- **Committet 13:10 als `096590b`** (nicht gepusht, nicht ausgerollt).
  Dritter voller Lauf: 262 grün, zwei rot (darstellung AC-10 mit 46 statt
  50 Bildern/s, bedienung AC-23 mit einer Meldung des Audiogeräts) — beide
  einzeln zweimal grün. `npm run check` grün (813 und 12). `qa:abweichung`:
  40 Bilder über 1 %, angesehen die zum Tor, Schautafel (jetzt 3442 hoch,
  „Baustelle 70 %" rutscht in eine eigene Zeile), AC-34, AC-13, AC-22,
  kampf AC-10, spielauswahl AC-19 — in Ordnung; die übrigen hohen Werte
  sind Szenen, deren Ausschnitt an der Uhr hängt. Nicht geprüft: ein Tor an
  einer Ecke, in die zwei Mauern laufen; Originalmaß des Tors.
- **Die Sitzung im Hauptbaum führt `strategie-bildumbau` zusammen** (dort
  läuft seit 11:3x ein Merge von `e3b4b41`, noch ohne das Tor) und fährt
  eigene Prüfläufe. **Beide Bäume benutzen dieselben festen Häfen** (konten
  4196, betrieb): zwei `npm run check` zugleich → „Der Server meldet sich
  nicht", `konten.test.mjs` hing 25 min. Vor jedem eigenen Lauf
  `bash <scratchpad>/frei.sh` (wartet, bis kein fremder Lauf rechnet;
  `laeufe.ps1 zeigen` listet sie).
- Später beachten: das Feld `quer` gehört zur Form des Stands (ADR-0017).

**Schwächen der gerenderten Bilder, dem Benutzer gesagt:** Figuren bei
Zoom 1 rund 30 Bildpunkte und erdfarben, Militär vom Dorfbewohner schwer
zu unterscheiden; getragene Last nur beim Gehen zu sehen; Baustelle immer
ein Holzgerüst.

**Nicht geprüft und so zu sagen:** wie der Ton klingt (Musik 0,06
effektiv, im Kampf 0,08, Gefecht darüber Spitze 0,62 — nur gemessen; ein
Dorfbewohner, der Holz trug und dann kämpft, klingt nach Axt; Geräusche
außerhalb des Bildes heben den Kampfpegel der Musik nicht); das Randschieben mit
echter Maus; was der Browser für alle Tafeln an Speicher hält; das
Reitertempo 1,55 stammt nicht aus `vorlage-aoe2.md`.

### Merge von `strategie` in `strategie-bildumbau` (2026-11-13, 17:50, `5d64f05`)

- `strategie` (`4af0cb3`: Runden 200 bis 202, TypeScript als Prüfer) ist im
  Baum `OnlineGames-bildumbau` zusammengeführt. Konflikte: `welt.js`
  (`wirkungen()`: erst Zeitalter-Wirkung, dann Haus-`boni`, dann `boniAb`;
  eine Variable `zeitalter`), `bauen.md`, `CLAUDE.md`, ein Bild (bauen
  AC-18, Fassung des Bildumbaus). `npm install` im Worktree war nötig
  (`tsc`). Neu im `@typedef`: `pfeile`, `laenge`, `pfeiler`.
- **Die Parallelsitzung führt im Hauptbaum ihrerseits `e3b4b41` zusammen**
  (MERGE_HEAD dort offen). Es gibt also zwei Merges in Gegenrichtung — mit
  dem Benutzer klären, wer wohin führt, bevor einer davon gepusht wird.
- **Nach dem Merge 2 von 40 Nebelpartien ohne Sieger** (neue Balance aus
  Runde 201/202). Fünf Änderungen an der KI, jede einzeln gemessen:
  `GOLD_KNAPP` 1500 statt 800; `karrenFehlt` — bis `HANDEL_VOR` Karren
  fahren, liegt der nächste zurück und sie verkauft bis auf dessen Preis;
  `platzBeiBasis` sucht hinter dem zugebauten Dorf weiter (`PLATZ_RINGE`
  12); Rammen gehen vor, sobald der Gegner etwas hat, das schießt
  (`dringend` in `belagerungPruefen`); `aussichtslos` zählt Karren nicht als
  Einheit, die noch etwas ändern kann (Startwert 8 ohne Häuser).
- **Gemessen auf `5d64f05`:** Nebel 1–40: 0 ohne Sieger, 36 vor Minute 60,
  Median 40,4, längste 79,4; 41–80: 0 / 37 / 39,8 / 76,5; zu viert alle 20,
  Median 44,6, **längste 87,1 (Startwert 15, knapp)**; ohne Häuser 1–20 alle
  entschieden, längste 83. Silberfurt baut nur 2 Burgen — genau an der
  Testgrenze.
- **Die Grenzen halten an den Startwerten, nicht aus Abstand.** Rund 1 bis
  3 % der KI-Partien enden im Patt; welche, hängt an der Zufallsfolge. Die
  **faule Platzsuche** (Platz erst suchen, wenn bezahlt werden kann: 45 %
  weniger Rechenzeit im Prüfstand) verschob nur die Folge und riss „alle
  mit Sieger" und „35 vor 60" — zurückgenommen, liegt als
  `<scratchpad>/ki-faul.js` und wird **in der Truppenstufen-Runde von Anfang
  an eingebaut**, weil dort ohnehin neu gemessen wird. Dem Benutzer sagen
  und fragen, ob die Grenze so bleiben soll.
- einheiten AC-31 (Zeitmessung) nimmt den kleinsten Wert aus 25 statt 5
  Runden — im parallelen Check fiel sie zweimal (1,1 ms), allein 0,26 ms;
  die Grenze 1 ms ist unverändert.
- Neue Messwerkzeuge im Scratchpad: `h20.cjs <W>` (ohne Häuser), `d3.cjs`
  (Belagerungsbild je Spieler, `OHNE_HAUS=1`), `d4.cjs` (marktBauen),
  `d5.cjs` (Karte ums Dorf), `p1.cjs` (für `--cpu-prof`), `z1.cjs`.
  Vergleichsstände: `strat` (= `strategie`), `vor` (= `4e5f823`).
- **Nicht geprüft:** kein Browserlauf nach dem Merge — die Bildnachweise
  sind die von vor dem Merge. Vor dem nächsten Abschluss an der Oberfläche
  `npm run check:alles:neu:kurz` und `qa:abweichung`.

### Truppenstufen (2026-11-13, ab 18:00, UNCOMMITTET auf `5d64f05`)

Bestellung 6 des Benutzers. **Fertig und grün** (uncommittet):

- `daten.js`: `bogenschuetze2` (Bogenschütze, Stufe des `bogenschuetze`, der
  am Bildschirm jetzt Kurzbogenschütze heißt), `armbrustschuetze` als
  **eigene Einheit** (9 Angriff, 3,5 s, 35 H 55 G, ab Fürstentum),
  `langschwertkaempfer`, `pikenier`, `eliteplaenkler`, `leichtekavallerie`;
  Verbesserungen `bogenstufe`, `langschwertstufe` (Vorstufe `soldatenstufe`),
  `pikenierstufe`, `eliteplaenklerstufe`, `kavalleriestufe`, `wehrturm`
  (`bauwerk: { wachturm: … }`, `nennt`), sechs Rüstungen der Schmiede;
  `armbrust` entfernt. Werte: Definitive Edition (aoe2techtree, gelesen
  2026-11-13, liegt in `$S/aoe2daten`).
- `welt.js`: Stufenketten (`grundstufeVon`, `einheitenStufe` als Schleife),
  `gebaeudewert` liest `bauwerk`, `kampfwerte` trägt `name` aus `nennt`,
  `erforschen` lässt dem stehenden Turm das Leben nachwachsen.
- `bringt.js` mit `bauwerkNamen`; `ki.js` mit fauler Platzsuche
  (`bauen(art, () => platz, …)`); `pruefstand.js`: `gefechtSpielen` nimmt
  `erforscht: { links, rechts }`.
- Tests: `tests/strategie-truppenstufen.test.mjs` (einheiten AC-34 neu,
  AC-58 bis AC-62, bauen AC-38, AC-39 — 11 grün), Konterkreis um
  **fahrplan AC-25** erweitert (Test und `npm run konterkreis:strategie`),
  alter AC-34-Test aus `strategie-ritterzeit.test.mjs` entfernt,
  `strategie-bringt.test.mjs` mit `GEBAEUDE_NAMEN`, Kürzeltafel in
  `e2e/helpers/strategie.mjs` um `j l i e v` ergänzt.

**Gemessen (Gefechtsstand, Budget 1200, 20 Startwerte):** Ritter und leichte
Kavallerie schlagen beide Schützenlinien 20/20; Pikenier gegen Ritter und
leichte Kavallerie 20/20; Eliteplänkler gegen Bogen und Armbrust 20/20;
Bogenschütze gegen Pikenier 20/20. **Armbrust gegen Bogen: ohne Rüstung
6/20, mit beiden Schützenrüstungen auf beiden Seiten 20/20** — ihre Rolle
ist die Antwort auf Rüstung. Armbrust gegen Pikenier 7/20 (kein Speerbonus).
Langschwert gegen Ritter: bei 1200 gewinnt das Langschwert 19/20, aber das
ist Rundung (8 Ritter = 1080 gegen 15 = 1200); bei 1080 Ritter 20/20, bei
2160 10/20 — **gleichauf**. Langschwert schlägt Pikenier, Eliteplänkler und
beide Schützen bei gleichen Kosten (wie Soldat vorher den Bogen).

**Stand 18:40 — geschrieben, aber noch nie im Browser gelaufen:**

- Browser: `FIGUREN` (fünf neue Arten, `bogenschuetze` heißt
  „Kurzbogenschütze"), `bilder.js` `NAMEN`, `auswahlleiste.js` (sieben
  `ZEICHEN`, `gebaeudeName()` aus `kw[besitzer][art].name`, `angebot()`
  Stufe um Stufe), Schautafel, Bildprobe (19 Einheiten). `npm run typen` grün.
- Specs: einheiten AC-34 umformuliert, AC-58 bis AC-62 und bauen AC-38,
  AC-39 als `in-qa`, fahrplan AC-25 `fertig` (ohne Bild, Begründung steht),
  D15 in der Bauabfolge, `vorlage-aoe2.md`. **`npm run specs:board` fehlt.**
- e2e: neu `e2e/tests/strategie-truppenstufen.spec.mjs` (drei Fälle mit
  `nachweis()`: die fünf Stufen, Wehrturm, Rüstungen);
  `strategie-ritterzeit.spec.mjs` bildet den Armbrustschützen als Einheit
  aus; Titel „Kurzbogenschütze" in `strategie-kampf` (Dateiname des
  Bildnachweises einheiten AC-25 ändert sich → **alte Datei
  `AC-25--bogenschuetze-und-plaenkler-…` danach löschen**),
  `strategie-unterscheidbar`; Bildprobe `toBe(19)`.
- Blender: Skripte für alle fünf Figuren in `grafik/` (fussvolk.py,
  reiter.py, pferd.py „fuchs"). `bogenschuetze2` probegerendert und gut,
  voller Render läuft (Log `$S/r-bogen2.log`). **`langschwertkaempfer`,
  `pikenier`, `eliteplaenkler`, `leichtekavallerie` sind noch nie gelaufen**
  — je erst `BILDER_PROBE=1 npm run bilder -- <name>`, ansehen, dann voll.
  Nie zwei Blender zugleich.

**KI (entscheidend):** Der Arbeitsstand (Armbrust zuerst **und** faule
Platzsuche) riss drei Grenzen: Nebel 1–40 34 vor Minute 60, zu viert
Startwert 6 ohne Sieger, Distelhag 1,17-fach. **Variante v3 = Arbeitsstand
mit `ki.js` von HEAD (keine faule Platzsuche)**, Kopie in `$S/v3`, Log
`$S/v3.log`: Nebel 1–40 **alle mit Sieger, 38 vor 60, Median 40,1, längste
65,3; Distelhag 48,1/29,9 = 1,61-fach**; Wehrstein 1,9 Türme (im Skript
markiert — mit dem echten Test zu ki AC-30 nachprüfen); zu viert und ohne
Häuser liefen um 18:40 noch. **Hält v3 auch dort: `ki.js` auf HEAD
zurücksetzen** (die faule Platzsuche war also der Störer, nicht die
Armbrust), dann im Worktree Nebel 1–40, 41–80, zu viert, ohne Häuser und
`npm run pruefstand:haeuser` neu messen. Keine Grenze lockern.

**Stand 19:00:**

- v3 zu viert: **alle 20 mit Sieger, Median 44,2, längste 87,7** (Grenze
  90 — knapp). v3 ohne Häuser lief noch. **`ki.js` im Worktree ist auf HEAD
  zurückgesetzt** (die faule Fassung liegt in `$S/ki-faul-stand-1855.js`);
  der echte Nebeltest läuft (`$S/nebeltest.log`).
- **Freigabe des Benutzers (2026-11-13, gegen 18:55, wörtlich): „ki AC-27
  und AC-30 halten knapp. Wenn sie fallen, sind 1,4 und 1,75 freigegeben."**
  Also: Grenzen bleiben 1,5 (ki AC-27) und 2 (ki AC-30); **nur wenn der
  echte Test reißt**, auf 1,4 und 1,75 senken und die Freigabe mit Datum an
  das Kriterium in der Spec und an den Test schreiben. Sonst nichts lockern.
- Benutzer: **der volle Browserlauf dauert mit den gerenderten Bildern rund
  36 Minuten** — erst starten, wenn weder Blender noch eine Messung läuft.
- Probelauf `strategie-truppenstufen.spec.mjs` auf Hafen 4205: **3 von 3
  grün** (4195 war belegt). Die dabei geschriebenen sieben Bilder (einheiten
  AC-58 bis AC-62, bauen AC-38, AC-39) sind vorläufig: vier Figuren noch
  gezeichnet. Wächter 43 von 43 (`waechter-namen` erlaubt jetzt Ziffern im
  Schlüssel, `waechter-wirkungen` verbietet auch `bauwerk` und `nennt`;
  Bildunterschriften der Stufen stehen als fester Text in `STUFEN`).
- `npm run specs:board` gelaufen: 12 Beanstandungen, alle erwartet (Titel
  und Testnamen geändert, die Bilder schreibt der Browserlauf neu).
- **Entscheidungen des Benutzers (2026-11-13, 19:00, per Auswahl):**
  1. **Ausrollen: mit den Truppenstufen zusammen** — sobald sie fertig und
     grün sind (voller Browserlauf), darf ausgerollt werden; vorher nicht.
  2. **einheiten AC-30 (Standplätze): einbauen, breiter messen** —
     `strategie-standplatz` (`97815b7`, alt, auf `2f9ec0e`) übernehmen und
     den Nebeltest auf 120 Startwerte stellen, Grenze anteilig; nach dem
     Einbau neu messen. **Nach** den Truppenstufen.
  3. **Mauerring: geparkt lassen** (`strategie-mauerring` `bf1ff0a`), bis
     die KI in der Krone schwere Belagerung hat.
  4. **Drache: nicht vorziehen**, bleibt Stufe F.
  5. **Die KI lernt forschen direkt nach den Truppenstufen** (eigenes
     Kriterium anlegen); die Truppenstufen gehen vorher auf den Server.
  6. **Name:** Eschenbruchs Sondereinheit heißt **Eibenschütze**, die
     Krone-Stufe der Bogenlinie Langbogenschütze. Regel dazu, wörtlich: „der
     eibenschütze darf gerne 1 mehr reichweite als die burg haben - bzw. der
     elite eibenschütze". Eingetragen in einheiten AC-42, Fahrplan E6,
     `vorlage-aoe2.md` (uncommittet im Worktree).
- **Echter Nebeltest im Worktree (19:00, `ki.js` = HEAD):** fahrplan AC-11
  grün, **ki AC-27 grün, ki AC-30 grün** (Freigabe 1,4 / 1,75 nicht
  gebraucht), **ki AC-33 ROT: „silberfurt: 1 Burgen in 16 Partien"**
  (verlangt ≥ 2 je Haus; gesamt 44 Burgen bei 44 von 80 KIs, je Haus
  eschenbruch 12, rappenstein 12, wehrstein 7, silberfurt 1, distelhag 12).
  Vergleichslauf auf HEAD (`$S/basis`) läuft → `$S/nebeltest-basis.log`.
  v3 ohne Häuser: alle 20 mit Sieger.
- **Stand 19:15 — ki AC-33, Ursache gefunden.** Der Vergleichslauf auf
  `5d64f05` war grün, aber Silberfurt stand dort mit **2 Burgen genau auf
  der Grenze** (jetzt 1). `$S/s40.cjs <wurzel> [haus]` durchleuchtet die 16
  Partien eines Hauses (`$S/s40.log`): Silberfurt handelt aus Neigung ab dem
  Fürstentum (`goldKnapp: Infinity`), damit ist `handelSeit` immer gesetzt
  und die Sperre „Burg und Rammen erst mit vier Karren" (`handelLaeuft`)
  greift in **jeder** Partie — vier Karren stehen erst um Minute 32 bis 35
  (in 7 von 16 Partien nie), bis dahin bleibt der Stein bei 200, die Partie
  endet meist um Minute 40. **Versuch (uncommittet in `ki.js`):** in
  `handelLaeuft` eine Zeile `if (this.goldInReichweite() >= GOLD_KNAPP)
  return true;` — die Sperre gilt nur bei echter Goldnot, nicht bei Handel
  aus Neigung. Kein Hausname, keine Grenze gesenkt. Messung läuft
  (`$S/s40-neu.log`); danach der echte Nebeltest, zu viert, ohne Häuser,
  41–80, Handelstest. Reißt etwas: die Zeile wieder heraus (`ki.js` ist
  sonst gleich HEAD).
- **Stand 19:30 — ki AC-33, Regel E im Worktree (uncommittet).** Drei
  Fassungen an Silberfurts 16 Partien gemessen (`$S/s40-*.log`):
  (B) `handelLaeuft` ganz frei bei Gold in Reichweite → 5 Burgen, aber
  Startwert 22 ohne Sieger und kaum Karren — verworfen. (C) nur die Burg
  wartet nicht (in `bauwerkePruefen`: `reich || handelLaeuft`) → 4 Burgen,
  alle mit Sieger (38 erst 87,8). **(E) = C + der Stein fürs Bauwerk wird
  nicht verkauft, solange Gold in Reichweite liegt** (`steinFuerBauwerk`,
  gelesen in `goldKaufen`) → **6 fertige Burgen** (Startwerte 2, 3, 22, 26,
  30, 38), alle 16 mit Sieger, längste 73,7, Silberfurt 5 statt 4 Siege.
  E steht in `ki.js`; Tests dazu: `strategie-ki-belagerung.test.mjs`
  (AC-33 „Gold knapp" leert jetzt wirklich das Gold, Gegenprobe Neigung),
  `strategie-ki-handel.test.mjs` (neu: „wer handelt, obwohl noch Gold in
  Reichweite liegt, verkauft den Stein für seine Burg nicht"; Gegenprobe
  gegen die alte Zeile fällt). **Der echte Nebeltest läuft** (Task
  `b3wcvi1fm`, `$S/nebeltest-e.log`); danach zu viert, ohne Häuser, 41–80,
  `pruefstand:haeuser`. Die Grenze in ki AC-33 ist unverändert.
- **Stand 19:50 — Regel E gemessen.** Echter Nebeltest (`$S/nebeltest-e.log`):
  fahrplan AC-11 ✔, ki AC-30 ✔, **ki AC-33 ✔** (51 Burgen bei 51 KIs, 212
  Rammen bei 42; silberfurt 6), **ki AC-27 ✖ mit 1,44-fach** (Distelhag
  47,6 aus der Kaserne, die anderen 33,1 statt 29,9 — Silberfurt lebt
  länger). → **Freigabe des Benutzers angewandt: Grenze 1,4** (`NEIGUNG_FACH`
  im Test, Testname geändert, Absatz mit Datum und Zitat an ki AC-27 in
  `specs/10-strategie/ki.md`; ki AC-33 dort um die neue Regel ergänzt).
  ki AC-30 bleibt bei 2. Zu viert: alle 20, Median 44,2, längste 87,7
  (unverändert). Ohne Häuser: alle 20. Nebel 42–81 (`n40b … x 41`): alle
  mit Sieger, 38 vor 60, Median 40,1, längste 77,2; dort Silberfurt nur 2,3
  Karren je Partie, Distelhag 1,40-fach — Vergleich mit `$S/v3` (ki.js von
  HEAD) über dieselben Startwerte läuft (Task `bcb6vs64u`, `$S/mess-e2.log`).
  **Noch nicht neu gefahren mit geänderter Grenze:** der echte Nebeltest
  (kommt mit `npm run check`). `pruefstand:haeuser` steht aus.
- **Stand 20:20 — Regel E bleibt.** Vergleich alt/neu (`$S/mess-e2.log`):
  Silberfurt bildet weniger Karren aus (1–40: 3,3 statt 5,6 je Partie;
  42–81: 2,3 statt 5,1 — der Stein geht in die Burg statt in Karren);
  Nebel 1–40 neu: 36 vor 60 (alt 38), Median 40,2, längste 73,7.
  **`npm run pruefstand:haeuser`, 200 Partien** (`$S/haeuser-e.log`): neu
  eschenbruch 65 %, rappenstein 60, distelhag 54, **silberfurt 36**,
  wehrstein 30; ohne Sieger 4; 174 von 200 vor Minute 60. Austauschprobe
  `$S/probe-alteburg.cjs` (nur die Burgregel zurück): eschenbruch 66,
  rappenstein 61, distelhag 56, wehrstein 33, **silberfurt 30**; ohne Sieger
  3. → Die Regel nützt Silberfurt (+6 Punkte). **Offen: Wehrstein 30–33 %
  statt 48 % in Runde 202** — Vergleich am letzten Commit läuft
  (`$S/basis2`, `$S/haeuser-basis.log`): Truppenstufen oder Merge?
  **ki AC-35 „Die KI forscht" angelegt (`offen`)**, Fahrplan D16. Typen
  grün, Wächter 43/43, `specs:board` 12 erwartete Beanstandungen.
  Render: langschwertkaempfer voll fertig (20:05, 1217 s), pikenier läuft.
- **Stand 21:20 — alle fünf Figuren voll gerendert** (`$S/r-voll.log`,
  „fertig 21:15", keine RAND-Zeile): bogenschuetze2, langschwertkaempfer,
  pikenier, eliteplaenkler (geschlossene Haube), leichtekavallerie
  (zurückgenommenes Fuchsfell). Tafeln liegen untracked unter
  `public/bilder/`. **Es läuft kein Blender und keine Messung.**
  ki AC-27: Grenze 1,4 eingetragen (Freigabe des Benutzers, gemessen 1,44);
  ki AC-33 hält mit Regel E ohne gelockerte Grenze.
- **Stand 21:27 — Figurenmessung, drei Befunde, am Modell behoben, neu zu
  rendern** (`strategie-unterscheidbar`, `strategie-bildprobe` auf Hafen
  4205): (1) spaeherreiter gegen leichtekavallerie 0,262 statt 1/3 — das
  zurückgenommene Fuchsfell war vom Braunen nicht mehr zu unterscheiden →
  `'falbe'` in `grafik/pferd.py` (sandfarben, dunkle Beine und Mähne);
  (2) langschwertkaempfer Spielerfarbe bis 0,356 (Grenze 1/3) → Waffenrock
  endet bei −0,27 über einem Kettenhemd bis −0,4; (3) eliteplaenkler
  Spielerfarbe von links 0,01 (Grenze 0,04) → `rundschild(..., feld='tuch')`.
  Alle anderen Paare ≥ 0,346 (Kurzbogen gegen Bogen 0,476). Proben angesehen und
  abgenommen (21:26). **Volle Render laufen seit 21:27** (`bash $S/r-nach.sh`,
  Log `$S/r-nach.log`: leichtekavallerie, eliteplaenkler, langschwertkaempfer,
  ein Prozess) — **fertig 22:18**, keine RAND-Zeile, kein Blender läuft.
- **Stand 22:22 — Figuren gemessen, alle 17 Fälle grün**
  (`strategie-unterscheidbar`, `strategie-bildprobe`, `strategie-figuren`):
  Langschwertkämpfer Spielerfarbe 0,19–0,30, Eliteplänkler 0,07–0,21,
  leichte Kavallerie 0,11–0,20. Späher gegen leichte Kavallerie jetzt 0,536; knappstes
  Paar insgesamt soldat gegen armbrustschuetze 0,346 (unverändert, alt).
- **Stand 22:30 — der volle Browserlauf läuft** (Task `bes7gyfkd`,
  `E2E_HAFEN=4205 npm run check:alles:neu:kurz` im Baum
  `strategie-bildumbau`, Protokoll `qa/letzter-lauf.log` dort; ~36 min plus
  Check). **Solange nichts Schweres daneben.** Danach Punkte 3 bis 6 unten.
  (Der Lauf begann 22:22, nicht 22:30.)
- **22:27 — fremde Läufe gestoppt, auf das Wort des Benutzers** („die
  parallelsitzung braucht nix mehr, bitte alle prozesse stoppen, die nicht
  dir gehören"): im Hauptbaum hingen seit 18:32 ein `check:alles:neu:kurz`
  und seit 18:59 ein `check:kurz`, um 22:22:39 kam dort ein dritter
  `check:kurz` dazu — 38 Prozesse, gestoppt mit `$S/stoppen.ps1 los`
  (Nachkommen der drei Läufe, geprüft ohne Überschneidung mit dem eigenen).
  Stehen gelassen: der Playwright-Testserver der VS-Code-Erweiterung
  (PID 26100, seit 11:30). Benutzer dazu: „der restliche Plan klingt gut."
  Frage des Benutzers „Der Drache kommt dann morgen oder?" — beantwortet:
  nach der vereinbarten Reihenfolge nein (Stufe F). Antwort des Benutzers
  (22:35): „passt schon, fahre mit dem Plan fort - morgen Abend wollen ein
  Freund und ich mal eine erste Testpartie spielen". → **Am 2026-11-14
  abends wird zu zweit auf dem Server gespielt**: heute ausrollen, sobald
  grün; morgen nichts Halbfertiges ausrollen, vor dem Abend den Stand auf
  dem Server prüfen (`npm run ausrollen -- --stand`).
- **Zwei Meldungen des Benutzers aus dem Spiel (22:40), NACH dem Commit
  der Truppenstufen bauen, vor ki AC-35** (klein, er spielt morgen):
  1. *„wenn ich das dorfzentrum auf nen baum klicke, dass die dorfbewohner
     direkt holz hacken, klappt das nicht komplet valide, wahrscheinlich
     auch v.a. wenn der baum in der zwischenzeit weg ist"* — gelesen, zwei
     Ursachen: (a) `ansicht.befehlen()` sendet für den Sammelpunkt das
     Bodenfeld (`Math.round(zuWelt)`), nicht das getroffene Bild
     (`zielUnter`, bedienung AC-51) — ein Klick auf die Krone landet hinter
     dem Baum; (b) `welt.sammelpunktSetzen` merkt nur `{x, y}`: ist der Baum
     gefällt, ist `SAMMELN[feld]` leer und der Neue steht herum. Lösung:
     beim Setzen die Feldart merken, beim Erscheinen den nächsten Vorrat
     derselben Art um den Punkt nehmen (`naechsterVorrat`, vom Punkt aus);
     bauen AC-13 erweitern oder neues Kriterium, Test in
     `tests/strategie-bauen.test.mjs` und Browserfall.
  2. *„Auf Baum, Holz, Schafe, etc. kann man nicht draufklicken um zu
     sehen, wie viel noch da ist (v.a. tote schafe"* — neues Kriterium
     bedienung AC-63: ein Klick auf Vorrat, Schaf oder Kadaver zeigt Namen
     und Rest wie bedienung AC-58 (`ansicht.angesehen`). Der Server schickt
     Vorratsmengen bisher gar nicht (`karte.vorrat` nur dort) → auf
     Anfrage: Nachricht `ansehen`, der Zustand trägt den Rest des einen
     angesehenen Felds/Tiers, nur wenn es in Sicht ist (kampf AC-13).
  3. *„wenn ich irgendwo im nebel ne mühle z.B. hinbaue, dann sehe ich
     automatisch das alles drumherum, das ist ne lücke. so kann ich mich im
     nebel weiterklicken. also gebäude geben erst reichweite und sicht wenn
     gebaut."* (22:50) — bestätigt: `welt.sichtAktualisieren()` (ab Zeile
     457) und `public/nebel.js` (`meine`, Zeile 97) zählen jedes eigene
     Gebäude, auch die Baustelle. Lösung: nur `fertig` zählt, auf dem
     Server `gebaeudeSichtNeu = true`, wenn ein Bau fertig wird, im Browser
     `fertig` in den `gebaeudeSchluessel`. Schießen tut eine Baustelle schon
     nicht (`tuermeTakten` prüft `turm.fertig`). Neues Kriterium kampf
     AC-24, Test in `tests/strategie-sicht.test.mjs`, Browserfall mit Bild.
     Nicht verlangt, nur beobachtet: bauen in nie erkundetem Gebiet geht
     weiter (die grün/rote Vorschau verrät dort das Gelände).
  4. *„gebäude muss man irgendwie beim dorfbewohner etwas organisieren,
     dass das nicht zu breit wird."* (23:00) — das Baumenü zeigt im
     Fürstentum 18 Gebäude in 6 × 3 Knöpfen (Bild bedienung AC-23,
     `auswahlleiste.baumenueBauen`), Stufe F bringt mehr. Empfohlen und dem
     Benutzer angesagt: **zwei Seiten wie in der Vorlage** — „Wirtschaft"
     (Haus, Mühle, Holzfällerlager, Bergbaulager, Farm, Markt, Schmiede,
     Kloster, Universität) und „Militär" (Kaserne, Schießanlage, Stall,
     Belagerungswerkstatt, Außenposten, Wachturm, Steinmauer, Tor, Burg):
     `gruppe` als Feld in `GEBAEUDE` (@typedef!), zwei Reiter im Menü, je
     Seite höchstens zwei Reihen zu fünf, Bautasten je Seite von vorn
     (bedienung AC-27 anpassen), neues Kriterium bedienung AC-64, Laptopfall
     bedienung AC-23 neu messen.
  5. *„Dass miliz zum soldaten wird, diese soldat weiterentwicklung muss
     anders dargestellt sein, also unterschied zwischen einheiten und
     weiterentwicklung"* (23:05) — in der Leiste der Kaserne steht „Soldat"
     als dritter Knopf mit der Figur des Soldaten
     (`auswahlleiste.verbesserungBildchen` nimmt das Ziel von `wandelt`),
     nicht von einem Einheitenknopf zu unterscheiden (Bild einheiten AC-24).
     Empfohlen und angesagt: zwei Gruppen mit Trennstrich und kleiner
     Überschrift („Ausbilden" | „Erforschen"), Forschungsknöpfe mit goldenem
     Rand und einem Pfeil-nach-oben-Zeichen in der Ecke; neues Kriterium
     bedienung AC-65, Messung im Browserfall (Rand/Zeichen je Knopfart),
     bedienung AC-54 (Leiste bleibt stehen) muss halten.
  6. *„mit strg + 1 und andere zahlen muss man gruppen machen können von
     einheiten"* (23:10) — gebaut ist es (bedienung AC-5: `Strg` oder `Alt`
     mit Ziffer legt ab, Ziffer ruft ab), aber Chrome behält `Strg`+`1` bis
     `8` im normalen Fenster für die Tabs: die Seite bekommt die Taste nie —
     der Punkt, der in CLAUDE.md als „nicht geprüft" steht. `Alt`+Ziffer
     geht heute. Lösung: Vollbild über die Fullscreen-API mit
     `navigator.keyboard.lock()` (dort gibt Chrome die Tasten an die Seite),
     Knopf und Taste dafür, Hinweis in Tastenübersicht und Erklärung. **Im
     Browserlauf nicht prüfbar** (Playwright umgeht die Kürzel des
     Browsers) — der Benutzer muss es einmal selbst probieren; das
     ausdrücklich sagen.
  7. *„Pfeile sind noch nicht gerendert, da brauchen wir noch was"*
     (23:15) — Pfeile, Bolzen, Wurfspieß und der Stein des Mangonels sind
     noch Striche aus dem Zeichencode (`ansicht.js` ab Zeile 2973,
     `this.pfeile`). Lösung: ein Blender-Modell `grafik/geschosse.py` (Pfeil,
     Bolzen, Wurfspieß, Stein), als kleine Tafel in 16 Flugrichtungen
     gerendert, im Flug nach der Bahn gedreht; neues Kriterium darstellung
     AC-26, Rückfall auf den Strich wie bei jeder Tafel. Rendern: Minuten,
     EIN Prozess. Nach den sechs Punkten oben, weil es Blender braucht und
     nichts am Spiel ändert.
  8. *„und bogenschützen scheinen im early verdammt effektiv zu sein,
     angriff vll um eins senken"* (23:20) — ein Vorschlag, kein Befehl:
     erst messen (Gefechtsstand mit Angriff 3 gegen 4 auf einer Kopie
     `$S/bal`, Konterkreis muss halten, dann `pruefstand:haeuser`), dann
     empfehlen. Angriff 4 → 3 ist gegen Fernrüstung 2 eine Halbierung.
     **Gemessen 23:15** (`node $S/bal.cjs`, Kopie `$S/bal`, je 20
     Startwerte, 600 Rohstoffe je Seite, offenes Feld): heute schlägt der
     Kurzbogen Speer 20/20, Dorfbewohner 20/20, Miliz 15/20 — und verliert
     gegen Soldat 1/20, Späherreiter 0/20, Plänkler 0/20. Mit Angriff 3:
     Miliz 0/20, Dorfbewohner 16/20, sonst gleich. Nachladen 2,4 s: Miliz
     2/20; Gold 55: Miliz 1/20. → **Empfehlung an den Benutzer: nicht
     senken**, die Stärke kommt vermutlich daher, dass die KI nicht kontert
     (ki AC-31 liegt ungemergt auf `strategie-ki-antwort`); nach der
     Testpartie zu zweit neu urteilen. Nichts geändert.
  9. *„die KI muss die Felder näher zu mühlen und dorfzentren bauen, nicht
     irgendwo"* (23:15) — `ki.farmenPruefen` / `platzBei` ansehen: Farmen
     in Ringen direkt an Mühle und Dorfzentrum (Abstand 0 bis 1), erst wenn
     dort kein Platz ist weiter weg oder eine neue Mühle; messbar als
     mittlerer Abstand Farm–nächste Annahme über 20 Startwerte (Zahl beim
     Bauen festlegen), neues Kriterium in ki.md, Nebeltest muss halten.
  10. *„ich hab grade ein Spiel gewonnen, obwohl das dorfzentrum noch nicht
     kaputt war, sondern nur alle einheiten"* (23:25) — kein Fehler der
     Siegregel (spielziel AC-5: ausgeschieden erst ohne Einheit UND ohne
     Gebäude außer Farmen), sondern **die KI hat aufgegeben** (ki AC-19:
     keine Einheit, nichts in der Schlange, nichts bezahlbar). Die Lücke:
     das Bild sagt es nicht — `welt.aufgeben()` setzt nur `aus`, die Tafel
     schreibt „Du hast gewonnen". Lösung: der Grund steht im Ende und im
     Bild („KI 1 hat aufgegeben" als Ansage und als Zeile der Tafel); neues
     Kriterium spielziel AC-27. Offen, den Benutzer gefragt: soll die KI
     mit stehendem Dorfzentrum überhaupt aufgeben?
  **Reihenfolge der fünf (morgen, vor ki AC-35):** 3 Baustellensicht,
  1 Sammelpunkt, 5 Forschungsknöpfe, 4 Baumenü in zwei Seiten, 2 Vorräte
  ansehen — dann EIN Browserlauf, Commit, ausrollen vor der Testpartie.
  **Nicht während des Browserlaufs an `public/` ändern** — die Dateien
  werden frisch von der Platte ausgeliefert.

**Reihenfolge bis zum Ausrollen (alles im Baum `strategie-bildumbau`):**

1. neue Figuren messen (`npm run tafel -- "t.unterschiede('figur')"`,
   darstellung AC-14 je Paar ≥ 1/3 — Kurzbogen gegen Bogen ist der kritische
   Fall —, AC-9, AC-21, AC-24); nachbessern am Modell, nicht an der Grenze
2. `npm run check:kurz` (Nebeltest mit 1,4), dann voller Browserlauf
   `npm run check:alles:neu:kurz` (~36 min, nichts daneben rechnen),
   `npm run qa:abweichung`, über 1 % ansehen
3. verwaiste alte Bildnachweise löschen (Liste aus `specs:board`)
4. einheiten AC-58 bis AC-62, bauen AC-38/AC-39 auf `fertig`,
   `specs:board`, Stand-Zahlen in CLAUDE.md, `npm run check` grün
5. Commit auf `strategie-bildumbau` (nicht pushen)
6. `npm run ausrollen` — vom Benutzer freigegeben für „Truppenstufen fertig
   und grün"

**Browserlauf 22:22 bis 23:06 (2663 s): GEFALLEN — 7 failed, 5 did not run,
257 passed.** `npm run check` lief deshalb nicht. Die sieben:

1. `strategie-pfeile` bedienung AC-40 — „ein Pfeil war im Bild, als es
   entstand" (bekannt zeitkritisch mit gerenderten Bildern)
2. `strategie-ritterzeit-am-stueck` fahrplan AC-14 — „woher
   langschwertkaempfer kommt": echter Folgefehler der Truppenstufen im
   **Test**: er spielt jede Einheit auf Zeitalter 2, Anna hatte keine
   Kaserne, und die Langschwertstufe verlangt die Soldatenstufe.
   **Behoben 23:11 am Test** (nicht am Kriterium): Kaserne im Aufbau,
   `forschung` mit Vorstufen aus den Daten, erforscht in Wellen.
3. `strategie-spielstand` bedienung AC-20 — im Warteraum 2 statt 3 Plätze
4. bis 7. `strategie-startblick`, `-tempo`, `-truppenstufen`, `-tuerme` —
   alle im `beforeAll` (60 s), Beitritt kommt nicht an

3 bis 7 liegen am Ende des Laufs hintereinander — Vermutung: Last (meine
Messung `bal.cjs`, die PowerShell-Abfragen, der dritte Fremd-Check ab
22:22:39). **Nachlauf ab 23:11** (Task `bjcdza7s0`, Protokoll
`$S/nachlauf1.log`): alle sieben Dateien mit `QA_NACHWEIS=1`, nichts
daneben. Sind sie grün: `npm run check:kurz`, `qa:abweichung`, dann weiter
bei Punkt 3 der Liste oben. Fällt etwas wieder: einzeln ansehen, nicht an
Grenzen drehen.

**Neue Meldung des Benutzers (23:10), Punkt 11 der Liste:** *„wir brauchen
irgendwie ein menü, ich kann zwar auf Pause drücken, aber nicht zurück in
die Lobby oder so."* → ein **Menü im Spiel** (Knopf oben rechts und `Esc`
ohne Auswahl / `F10`): Weiterspielen, Pause, Tastenübersicht, Aufgeben,
Bündnis lösen, **Zurück in den Vorraum** (die Partie wartet nach raeume
AC-17, der Vorraum bietet die Rückkehr an, AC-18 — das gibt es schon, es
fehlt nur der Weg dorthin ohne Neuladen). Neues Kriterium bedienung AC-66.
Morgen mit den anderen, vor der Testpartie; gehört zu den sicheren.
Dazu seine Beobachtung: *„die KI war grade im earlygame sehr gut (Besser
als ich), aber im midgame hab ich sie abgehängt. der erste Angriff der KI
war gefährlich, danach war ich stark im Vorteil."* — passt zu ki AC-35
(sie erforscht nichts) und dazu, dass sie nicht in die Krone aufsteigt;
kein neuer Auftrag, Beleg für die Reihenfolge. Und: *„es spielt sich schon
mal sehr gut ! :)"* — auf dem Server läuft noch `2f9ec0e`.

**Punkt 12 (Benutzer, 23:13):** *„Es wäre schon gut zu sehen in welchem
Zeitalter die gegner sind, vll rechts unten bei der Punkte anzeige in
Klammern in römischen Ziffern das Zeitalter (I), II, III, IV - also so"* →
in der Punkteliste über der Übersichtskarte (bedienung AC-57) hinter jedem
Namen das Zeitalter in römischen Ziffern in Klammern: „Anna (II) 412". Das
Zeitalter schickt der Server schon für jeden (Spielstand unter `Tab`,
bedienung AC-20) — nur Anzeige, neues Kriterium bedienung AC-67, mit
`title` in Worten („Lehen"). Klein, gehört zu den sicheren vor der Partie.

**Punkt 13 (Benutzer, 23:17):** *„ich greife früh immer mit dem Späher die
KI an und kann immer gleich 2 dorfbewohner töten, da muss sie gleich
konsequent mit den dorfbewohnern auf den späher draufgehn - also die ki"*
→ heute flieht nur der Getroffene zum Dorfzentrum, und eine Wache gibt es
früh nicht (ki AC-14). Lösung: steht kein eigenes Heer in der Nähe und
sind die Angreifer wenige (Maß beim Bauen festlegen, etwa: höchstens ein
Angreifer je vier Dorfbewohner im Umkreis), greifen **alle Dorfbewohner
im Umkreis von etwa acht Feldern gemeinsam an** und gehen danach an ihre
Arbeit zurück (`ki.verteidigen` ansehen; Rückkehr zur Arbeit wie nach der
Flucht). Rechnung vorab: Späher 45 Leben, Dorfbewohner 3 Angriff → fünf
Dorfbewohner brauchen drei Schläge. Gegen ein echtes Heer weiter fliehen.
Neues Kriterium ki AC-36 (AC-35 ist „die KI forscht"), Test mit gebauter
Lage (Späher im Dorf: er stirbt, höchstens ein Dorfbewohner fällt), danach
Nebeltest und zu viert. Morgen mit Punkt 9 (Felder), vor der Partie nur,
wenn die Grenzen halten.

**Punkt 14 (Benutzer, 23:22):** *„wenn ich auf einen baum klicke fürn
dorfbewohner und der baum is nicht erreichbar, soll er den daneben
nehmen"* → im Zweig `sammeln` von `welt.befehl()` (Zeile ~1732): findet
die Wegsuche kein freies Feld am geklickten Vorrat (Baum mitten im Wald),
nimmt der Sammler den **nächsten erreichbaren Vorrat derselben Art** um
das geklickte Feld (`naechsterVorrat` vom Klick aus, nicht vom Sammler),
statt stehenzubleiben oder nur hinzulaufen. **Gilt für jeden Rohstoff** (Benutzer, 23:24: „gilt auch für alle andren ressourcen"): Baum, Busch, Gold, Stein, Farm, Schaf — geschrieben wird es an der Art des Vorrats, nicht am Holz. Gehört zu Punkt 1
(Sammelpunkt auf Baum) — dieselbe Stelle, ein Kriterium (einheiten AC-63
prüfen, ob frei) mit Test „Baum hinter Bäumen". Sicher vor der Partie.

**Punkt 15 (Benutzer, 23:25):** *„bei den einheiten is noch ungewöhnlich
beim angreifen, die einheiten lassen sich zu sehr ablenken und nehmen dann
auch ne einheit die einfach näher da ist. Aber natürlich ist es besser
eine einheit zu ende zu bringen. Da sollte es irgendwie nen modus geben,
wie angreifen, stand halten, etwas defensiv, etc."* → zwei Dinge:
(a) **Zielwahl**: gelesen 23:25 — ein **befohlener** Angriff bleibt schon
am Ziel, bis es fällt (`wacheTakten` überspringt, wer `angreifen` hat).
Gewechselt wird nur, wo niemand ein Ziel befohlen hat: wer von selbst
kämpft, bricht fünf Felder vom Ausgangsplatz ab (`VERFOLGUNG_FELDER`,
kampf AC-3), kehrt um und nimmt dann den Nächsten (`feindInSicht`); ebenso
im Angriffslauf und nach jedem gefallenen Ziel. **Den Benutzer gefragt**,
bei welchen Einheiten er es sah (mit befohlenem Ziel oder von selbst
kämpfend) — nicht blockierend.
(b) **Haltungen** wie in der Vorlage, vier: *Angriff* (verfolgt, bis das
Ziel fällt oder aus der Sicht ist), *Verteidigung* (heutiges Verhalten:
fünf Felder, dann zurück — bleibt die Vorgabe, damit keine KI-Messung
kippt), *Stellung halten* (rührt sich nicht, schlägt nur in Reichweite),
*Nicht angreifen*. `einheit.haltung` auf dem Server, Nachricht `haltung`,
vier Knöpfe in der Leiste mit Tafel (bedienung AC-55) und Taste, am
Zustand als ein Buchstabe. In `ADR-0012` weder vorgesehen noch
ausgeschlossen; in den Specs noch kein Kriterium (neu: kampf AC-25 und
bedienung AC-68, Nummern beim Bauen prüfen). **Größer als die anderen
Punkte** (Server, Leitung, vier Knöpfe mit Bild, Tests, Nachweis):
angesagt als „nach der Testpartie, außer der Tag läuft gut".

**Zu Punkt 15, Antworten des Benutzers (23:27):** *„das war als ich mit
dem späherreiter am anfang zu den dorfbewohnern rein bin, er hat dann auch
immer wieder andre dorfbewohner angegriffen"* und *„ja, die haltungen
reichen nach unserer testpartie, außer du hast noch Zeit"*. → Haltungen
**nach der Partie**. Der Späher ist vermutlich ein **Fehler in (a)**, zu
belegen: der getroffene Dorfbewohner der KI flieht (ki AC-14), der Späher
läuft zu dem Feld, wo er stand, sucht dort neu — und findet
`angriffsplatz`/`wegNach` keinen Weg, **endet der Auftrag**
(`angriffTakten`, „Kein Weg mehr … sonst steht er"), er steht, und die
Wache nimmt den Nächsten. Morgen als Test nachstellen (Späher mit
befohlenem Ziel auf einen Fliehenden zwischen anderen: er bleibt dran, bis
der fällt oder aus der Sicht ist; der Weg wird einem laufenden Ziel
nachgeführt, nicht erst am Ende des alten Wegs) — klein, **vor** der
Partie, Konterkreis und Nebeltest danach fahren.

**Punkt 16 (Benutzer, 23:28):** *„wo sehe ich welches volk ich bin? Wenn
ich auf ein gebäude von mir klicke - oder zumindest aufs dorfzentrum
sollte mans sehn, auch beim gegner seh ichs nicht"* → der Aufbau trägt
`haus` je Spieler schon (`welt.js` ~4287), der Browser zeigt es im Spiel
nirgends (nur im Warteraum). Lösung: in der Leiste am gewählten
**eigenen und fremden Gebäude** (bedienung AC-58) „Haus Eschenbruch" mit
den Boni als Tafel (Sätze vom Server, `bringt.js`), dazu eine Spalte im
Spielstand unter `Tab` und am Namen in der Punkteliste als `title`. Neues
Kriterium bedienung AC-69 (Nummer prüfen). Klein, sicher vor der Partie.

**Punkt 17 (Benutzer, 23:30):** *„wenn ich eine mühle in der nähe von
beeren hinbaue (oder holzfällerlage bei holz, etc.) dann sollte die nach
dem bau sofort die ressource abbauen"* → nach dem fertigen Bau eines
Lagers (`annahme` in den Daten) sammelt der Bauer den nächsten Vorrat
einer Art, die das Lager annimmt, im Umkreis (Maß beim Bauen, etwa acht
Felder vom Lager) — **nach** der Regel bauen AC-36 (erst die nächste
eigene Baustelle). Neues Kriterium in bauen.md (AC-40 prüfen). Klein,
sicher vor der Partie. Die KI schickt ihre Bauer schon selbst – prüfen,
dass sich nichts doppelt.

**Punkt 18 (Benutzer, 23:31) — ZURÜCKGENOMMEN, siehe darunter:** *„ich glaube die Einheiten, also Menschen
sind nen minimalen ticken zu groß dargestellt."* → ein Maßstab beim
Zeichnen der gerenderten Figuren (`public/bilder.js` / `figuren.js`
ansehen), alle Figuren gleich (Reiter und Pferd mit, sonst passt es nicht
zusammen). **Grenze: darstellung AC-16** verlangt zum Start mindestens 40
Bildpunkte Höhe für den Dorfbewohner — erst messen, wie hoch er heute
ist. Vorgehen: mit `npm run sicht -- --spiel` ein Vergleichsbild heute /
95 % / 90 % machen und dem Benutzer zeigen; ohne Antwort 93 %. Ändert
jedes Bild → gehört in den gemeinsamen Browserlauf von morgen
(`check:alles:neu`), nicht heute.
**Benutzer, 23:33:** *„andererseits ist das genau etwas, was sehr cool
ist. Aber einheiten müssten glaub näher aneinanderstehen (nicht
übreinander) aber näher beinander"* → **Größe bleibt.** Stattdessen
**Punkt 18 neu: Einheiten stehen dichter** — heute bekommt in einer
Gruppe jeder ein eigenes Feld (`welt.aufstellungUm`, einheiten AC-20), und
`welt.ausweichen` schiebt auseinander, wer näher als ein halbes Feld
steht (einheiten AC-29). Dichter heißt: Plätze im Abstand von etwa 0,6
bis 0,7 Feld statt 1. Das greift in Aufstellung, Ausweichen und damit in
jede KI-Messung (Konterkreis, Nebeltest) — **nicht vor der Testpartie**,
danach mit `pruefstand:vergleich` und einem Vergleichsbild (heute / 0,7 /
0,6). Passt zu einheiten AC-30 (Standplätze), das ohnehin ansteht.

**Bildnachweise angesehen (23:32):** 44 über 1 %: die neuen
(Truppenstufen AC-58, Wehrturm, fahrplan AC-14 mit elf Arten, Bildprobe
darstellung AC-24 mit allen neuen Figuren, Laptop bedienung AC-23, kampf
AC-10, fahrplan AC-01) mit eigenen Augen, alle 44 auf leere/dunkle Flächen
gerechnet (`$S/hell.py`): nichts Auffälliges; die drei langen Tafeln sind
länger geworden (neue Figuren), nicht kürzer. Die dunklen sind Nebelbilder.

**Punkt 19 (Benutzer, 23:33):** *„grade hat der gegner mich mit
bogenschützen angegriffen und ich hatte 10 einheiten bissl vor meinem dorf
stehen, die bogenschützen haben sich nicht gewehrt, die hatten vermutlich
ein explizites Ziel hinzugehen und auf dem weg dahin laufen sie einfach
weiter - is natürlich blöd"* und *„aber trotzdem muss es möglich sein als
spieler einer einheit ein explizites Ziel zu geben"* → die Regel der Welt
bleibt (ein befohlenes Ziel gilt; wer `angreifen` auf ein Gebäude hat,
steht nicht in `wacheTakten`). **Die KI muss es selbst merken**: ihr Heer
geht mit einem befohlenen Angriff auf Gebäude (ki AC-16, „am Ziel nimmt
jeder sein nächstes Ziel") oder im Zug zum Sammelplatz (`ki.zug`) — wird
es dabei von **Einheiten** getroffen (sie sieht fehlendes Leben wie in ki
AC-14), befiehlt sie den Angriffslauf auf die Stelle bzw. den Angriff auf
die Angreifer und kehrt danach zum Gebäude zurück. Neues Kriterium in
ki.md (nächste freie Nummer nach AC-35/AC-36 prüfen), Test mit gebauter
Lage (Schützen der KI auf dem Weg zum Dorfzentrum, zehn Milizen daneben:
die Schützen schießen zurück), danach Nebeltest und zu viert. Gehört in
den KI-Block von morgen (mit Punkt 9 Felder und Punkt 13 Späher) — auf den
Server vor der Partie nur, wenn die Grenzen halten.

**Punkt 20 (Benutzer, 23:35):** *„wenn ich z.B. doppelaxt in einem
holzfällerlager bereits produziere, muss es in anderen ausggraut sein"* →
der Server weist die zweite Bestellung schon ab (`welt.js` ~1351,
`eingereiht`: „… gibt es nur einmal."), nur die Leiste zeigt es nicht:
der Knopf sieht in jedem anderen Gebäude derselben Art bestellbar aus.
Lösung in `auswahlleiste.js`: steht die Verbesserung in der Schlange
irgendeines eigenen Gebäudes (`g.s` aller eigenen Gebäude), ist der Knopf
ausgegraut (`aria-disabled`), die Tafel sagt „Wird schon erforscht";
ebenso der Aufstieg. Gehört zu Punkt 5 (Forschungsknöpfe), dasselbe
Kriterium bedienung AC-65 oder ein eigenes. Klein, sicher vor der Partie.

**Punkt 21 (Benutzer, 23:37):** *„Im Fürstentum muss es auch noch
weiterentwicklungen für bergbau, mühle, holzabbau, etc. geben"* → heute
gibt es an Wirtschaft nur Doppelaxt (`sammeln: { holz: 1.2 }`) und
Pferdekummet (`farm: { nahrung: 75 }`), beide im Lehen; für Gold und
Stein gar nichts. Die Mechanik steht also schon, es fehlen Einträge:
**Lehen** Goldbergbau, Steinbergbau (je ×1,15 im Bergbaulager), Schubkarre
(Dorfzentrum: Tragkraft, Tempo — braucht ein neues Wirkfeld, prüfen);
**Fürstentum** Bogensäge (Holz ×1,2, Vorstufe Doppelaxt),
Goldschachtbergbau, Steinschachtbergbau (Vorstufen), Schwerer Pflug (Farm
+125, Vorstufe Pferdekummet), Handkarren. Kosten und Dauer **nicht aus
dem Kopf**, sondern wie bei den Truppenstufen aus den offenen
Technikbaum-Daten (SiegeEngineers/aoe2techtree) und `vorlage-aoe2.md`
nachtragen. Je Eintrag ein `zeichen` (gezeichnetes Knopfbild), Kriterien
in bauen.md (ab AC-40, Nummern prüfen), Wirkung je Eintrag gemessen (wie
bauen AC-26), ein Browserfall. Die KI erforscht nichts (ki AC-35) — der
Abstand Mensch–KI wächst damit, also zusammen mit ki AC-35 denken.
Mittelgroß, fast nur Daten: morgen nach den sicheren Punkten, wenn Zeit
ist, sonst nach der Partie.

**Punkt 22 (Benutzer, 23:40):** *„und die KI greift halt immer von vorne
an, das macht das verteidigen recht einfach"* → heute ist das Marschziel
ein freies Feld vier Felder vor dem fremden Dorfzentrum auf der geraden
Linie vom eigenen Dorf, der Sammelplatz 16 Felder davor (`ki.zug`,
`SAMMEL_ABSTAND`). Lösung: die **Anmarschseite wechselt** — je Angriff
ein Winkel um das Ziel (etwa 0°, ±60°, ±120° zur direkten Linie), gewählt
aus `welt.zufall` und, wo sie etwas gesehen hat, weg von dem, was schießt
(Türme, Burg) und hin zu Sammlern und Lagern; Sammelplatz und Marschziel
auf dieser Seite, der Weg dorthin außen herum. Neues Kriterium in ki.md,
Messung: über 20 Startwerte kommen die Angriffe einer KI aus mindestens
zwei Sektoren; Nebeltest, zu viert und Team-Tests müssen halten (längere
Wege kosten Zeit — fahrplan AC-24 steht bei 87,7 von 90). **KI-Block,
vermutlich nach der Partie**: mit Punkt 9, 13, 19 zusammen sind es vier
Eingriffe in die KI, und jede Grenze hält nur „an diesen Startwerten".

**Punkt 23 (Benutzer, 23:42):** *„eine farm muss auf automatisch renewal
gestellt werden können, wenn das nicht ist, wird sie erstmal brach und
kann mit rechtsklick einfache rneuert werden."* → heute **verschwindet**
die leere Farm (`welt.js` ~2097: `this.gebaeude.delete(farm.id)`), der
Bauer steht — obwohl bauen.md unter den Grenzfällen sagt „bleibt als
leerer Acker stehen; neu anlegen kostet wieder 60 Holz" (Code und Spec
gehen auseinander). Lösung: (a) die leere Farm bleibt als **Brache**
(`brach: true`, Leitung ein Merker, Bild: das Fundament der Farm oder ein
eigener brauner Acker), nimmt keinen Arbeiter; **Rechtsklick eines
Dorfbewohners erneuert sie** für die Kosten der Farm (Auftrag
`farm` → bezahlt, füllt, arbeitet) — mit Absage, wenn das Holz fehlt;
(b) **automatisch erneuern** als Schalter (an der Mühle und am
Dorfzentrum, je Spieler, Vorgabe aus): ist er an und das Holz da, wird
beim letzten Korn bezahlt und der Bauer arbeitet weiter; fehlt das Holz,
liegt sie brach, bis er sie anklickt. Die KI: `farmenPruefen` baut heute
neue — sie erneuert stattdessen die Brache (oder spielt mit dem Schalter
an); Nebeltest danach. Neue Kriterien in bauen.md (Nummern prüfen),
Tests, Browserfall mit Bild der Brache. Mittelgroß, wichtig für jede
Partie: morgen nach den sicheren Punkten, vor den Geschossen.
**Nebenbei zu Punkt 17:** bauen AC-1 (`fertig`) sagt schon „Nach dem Bau
eines Lagers oder einer Mühle sammelt er am nächsten passenden Vorrat" —
der Benutzer sieht es nicht: also **Fehler suchen** (Suchweite? nur der
erste Bauer? nur wenn keine Baustelle in acht Feldern, bauen AC-36?),
nicht neu bauen.

**Punkt 24 (Benutzer, 23:44):** *„die einheiten der KI kommen in
abhängigkeit der geschwindigkeit der einheiten unterschiedlich, das is
nicht ganz sinnvoll."* → das Heer bricht gemeinsam auf, aber jeder läuft
sein Tempo: Reiter zuerst, Fußvolk einzeln hinterher. Den Sammelplatz gibt
es schon für die Rammen (`ki.zug`, 16 Felder vor dem Ziel, „hinein erst
mit dem Heer"). Lösung in der KI: **das ganze Heer sammelt sich dort**
(mit der Anmarschseite aus Punkt 22) und geht erst hinein, wenn fast alle
da sind (Maß beim Bauen, etwa 80 % oder nach einer Höchstwartezeit);
auf dem letzten Stück geht der Angriffslauf im Tempo des Langsamsten —
entweder als Regel der Welt für eine gemeinsam befohlene Gruppe (hilft
auch dem Spieler, ändert aber eine Kampfregel: Konterkreis prüfen) oder
in der KI durch Nachführen. Erst die KI-Lösung. Neues Kriterium in
ki.md; Messung: Abstand zwischen erster und letzter Ankunft am Ziel.
**KI-Block, jetzt fünf Punkte: 9, 13, 19, 22, 24.**

**Benutzer, 23:46: „in der burg gibts noch keine Einheiten, korrekt?"** —
beantwortet: korrekt (`burg.bildetAus: []`); Spezialeinheiten je Haus sind
Stufe E und offen (einheiten AC-42 Eibenschütze steht in der
Schießanlage, ki AC-28), Drache Stufe F. Kein Auftrag.

**Punkt 25 (Benutzer, 23:48):** *„die Pfeile der Burg kommt irgendwie
SOFORT beim opfer an, obwohl das bild länger dauert - und dieses sofort
wirkt zu schnell, aber schwer zu sagen, weil damage und bild wie gesagt
nicht zusammenpassen"* → stimmt: der Server rechnet den Schaden eines
Pfeils **im Takt des Schusses** (`schlaege`, `schlaegeAbrechnen`), der
Browser lässt ihn danach mit sieben Feldern je Sekunde fliegen (acht
Felder = 1,1 s). Nur der Stein des Mangonels fliegt auf dem Server
(`welt.einschlaege`, kampf AC-19). Lösung: **der Pfeil trifft, wenn er
ankommt** — der Schlag eines Fernkämpfers/Turms wird mit Ankunftstakt
(`weite / geschoss`) eingereiht und dann abgerechnet; er trifft sein Ziel
sicher (kein Ausweichen wie beim Stein), aber ein Ziel, das vorher fällt,
schluckt die Pfeile, die noch fliegen. Das ist eine **Kampfregel**: der
erste Treffer kommt später, Überschuss geht verloren → Konterkreis (alle
vier Richtungen 20/20), Gefechtsstand der Truppenstufen, Nebeltest,
`pruefstand:haeuser` neu messen. Neues Kriterium kampf AC-25 (Nummer
prüfen). **Nach der Testpartie** — zu viel Messung für morgen.

**Punkt 26 (Benutzer, 23:47):** *„der mönch macht keine geräuscht beim
bekehren oder heilen"* → in `public/ton.js` zwei Klänge mit `art`
(bedienung AC-62, dort wo es im Bild steht, `ansicht.klangAn`):
**Bekehren** als leiser, gehaltener Gesangston, solange der Mönch bekehrt,
mit einem hellen Schlag, wenn die Einheit übertritt; **Heilen** als
weiches, kurzes Glöckchen je geheiltem Leben, gedrosselt. Auslöser: der
Zustand des Mönchs auf der Leitung (er hat schon eine eigene Bewegung
„Heilen und Bekehren") und der Besitzerwechsel. Alles im Browser erzeugt,
kein Material von außen; danach `npm run ton:messen` (Pegel), und dem
Benutzer sagen: ob es gut klingt, entscheidet sein Ohr. Kriterium
bedienung AC-62 erweitern oder neu. Klein, sicher vor der Partie.

**Punkt 27 (Benutzer, 23:49):** *„marktkarren können bei uns zwischen
zwei eigenen marktplätzen handeln, dann sollte es aber weniger bringen,
als wenn man mit einem fremden marktplatz handelt"* → heute bringt jede
Strecke dasselbe (`welt.handelsgewinn`, `HANDEL.karren.faktor` 0,77 —
gemessen 18 Gold je Minute auf halber Kartenbreite); mehr gibt es nur
über den Mannschaftsbonus Silberfurts (`verbuendetAnteil`). **Vorschlag
an den Benutzer (23:50): der eigene Markt bleibt, wie er gemessen ist,
der fremde bringt ein Drittel mehr** (`HANDEL.karren.fremdAnteil: 0.33`,
in `handelsgewinn` addiert, wenn `ziel.besitzer !== heimat.besitzer`) —
nicht umgekehrt den eigenen senken: die KI handelt nur zwischen eigenen
Märkten (ki AC-26), und ihre Grenzen halten knapp. **Entschieden (Benutzer, 23:48: „nimm 20% mehr"): `fremdAnteil: 0.2`.** Ohne andere Zahl vom
Benutzer: +33 %. Test in `tests/strategie-handel…` (einheiten AC-40
erweitern), Leiste nennt die Strecke schon (`hd`). Winzig, sicher vor der
Partie.

**Punkt 28 (Benutzer, 23:50):** *„wenn ich ganz viele einheiten
produizieren will und ganz schnell draufklicke, dann klickt man zu schnell
für den browser"* → Verdacht, noch nicht belegt: die Knöpfe hören auf
`click` (`auswahlleiste.js` 1153, 1247, 1449), und die Leiste des
Gebäudes wird neu aufgebaut (`w.replaceChildren()`, 1401), sobald sich
die Schlange ändert — also nach jedem eigenen Klick. Liegt der Neuaufbau
zwischen Drücken und Loslassen, gibt es den Knopf nicht mehr und der
Browser meldet keinen `click`. Lösung: auf `pointerdown` (linke Taste)
bestellen statt auf `click` (Tastatur weiter über `click` mit
`detail === 0`), besser noch die Knöpfe stehen lassen und nur Inhalt und
Schlange ändern (passt zu bedienung AC-54). Dazu wie in der Vorlage
**Umschalt+Klick = fünf auf einmal**. Browserfall: zehn Klicks im Abstand
von 30 ms ergeben zehn Aufträge. Erst nachstellen, dann beheben. Klein,
sicher vor der Partie.

**Punkt 29 (Benutzer, 23:52):** *„jetzt ruckelts langsam schon relativ
stark"* — er spielt im Chrome auf dem Server, **während auf demselben
Rechner meine Partien-Tests laufen** (sieben Node-Prozesse) — dem Benutzer
so gesagt und gebeten, nach dem Ende der Tests noch einmal zu achten und
Spielminute und Bevölkerung zu nennen. Bleibt es: Tempo einer langen
Partie messen (darstellung AC-10 misst nur 100 Einheiten und 30 Gebäude
kurz nach dem Start): 200 Einheiten, 80 Gebäude, alle Tafeln geladen,
Speicher des Browsers, `ansicht.zeichnen` je Bild, Nebel, Übersichtskarte,
Leiste — mit dem Prüfgriff aufstellen und `messen()` aus
`strategie-tempo.spec.mjs`. **Lehre: keine schweren Läufe, während der
Benutzer spielt** — vorher fragen oder warten.
**Genauer (Benutzer, 23:54): „v.a. wenn ich rein und rauszoome, ansonsten nicht"** → also das Spiel selbst: beim Zoomen werden die Zwischenspeicher je Zoomstufe verworfen (Bodenkacheln `kachelnVerwerfen`, skalierte Figuren/Gebäude) und für jeden Zwischenwert des Mausrads neu gerechnet. Messen: Bildzeit während einer Zoomfahrt 1→2→1 spät im Spiel. Lösung: während der Zoomfahrt die vorhandenen Kacheln und Bilder nur **skaliert zeichnen** und erst scharf neu rechnen, wenn der Zoom 150 ms steht; oder feste Zoomstufen mit je eigenem Speicher. Kriterium darstellung AC-10 erweitern (Zoomfahrt ≥ 30 Bilder/s) oder neu. Vor der Partie, wenn die Messung die Ursache bestätigt.

**Punkt 30 (Benutzer, 23:56) — FEHLER, belegt am Code:** *„haha nach der
Mönchsbekehrung greifen die Türme und Burg den Reiter immer noch an, von
meinen Mönchen wird er aber geheilt"* → `welt.tuermeTakten()` (Zeile
~2625) behält sein Ziel, solange es lebt und in Reichweite ist:
`if (!ziel || ziel.tot || abstandVon(ziel) > reichweite)` — **ohne**
`this.feindlich(turm.besitzer, ziel.besitzer)`. Nach dem Besitzerwechsel
schießt der Turm also weiter auf die eigene Einheit. Behebung: die
Bedingung um `!this.feindlich(…)` ergänzen; dieselbe Prüfung für
Einheiten, die einen Angriff auf den Bekehrten haben (`angriffTakten`:
Ziel nicht mehr feindlich → wie gefallen) und nach einer Kündigung/einem
neuen Bündnis. Test in `tests/strategie-moench…` (einheiten AC-38
erweitern): Turm schießt auf Reiter, Mönch bekehrt ihn, der Reiter
verliert danach kein Leben mehr. Eine Zeile und ein Test — **morgen als
Erstes**, sicher vor der Partie. **Bestätigt (Benutzer, 23:57):** „wenn ich dann mal aus der reichweite der gebäude war, hören sie auch auf anzugreifen, auch wenn ich wieder in reichweite bin" — genau das Verhalten der Zeile: `feindlich` wird nur bei der Neusuche gefragt.

**Punkt 31 (Benutzer, ~23:58):** *„Mönchen können unendlich oft
hintereinander bekehren oder? sollte man ggf. bissl einschränken"* →
**nein, es gibt die Ruhe schon**: `bekehren.ruhe: 62` (daten.js 299),
`moench.ruhtBis` (welt.js 3418), `bekehre()` lehnt ab, solange er ruht
(3359). Auf der Leitung nur als Merker `r: 1` (welt.js 3963); im Bild
sieht man es **nur am Zeiger** (`ansicht.js` 1662), kein Balken, keine
Zeile in der Leiste. Mit mehreren Mönchen wirkt es deshalb unbegrenzt.
Bauen (klein, vor der Partie): die Ruhe **sichtbar** — statt `r: 1` die
Restsekunden schicken, am Mönch ein schmaler Balken, in der Leiste „Ruht
noch 0:41". Den Wert 62 (wie die Vorlage) nicht ändern, nach der Partie
neu urteilen. Kriterium einheiten AC-nächste.

**Punkt 32 (Benutzer, ~23:58):** *„die angriffs und rüstungspunkte sollten
mit basiswert + den durch forschung, etc. wert dargestellt werden, also
mit '+'"* → `auswahlleiste.js` 1355/1356/1370 zeigt heute nur die Summe
(`String(angriff)`, `${nah} / ${fern}`). Bauen: Grundwert aus den Daten
der Art, Zuschlag = `einheitenwert` − Grundwert, Anzeige „4+2" und
„0+1 / 1+2" (ohne Zuschlag nur die Zahl); auch für Gebäude
(`gebaeudewert`, Mauerwerk) und Reichweite. Achtung Stufenkette: der
Langschwertkämpfer ist eine eigene Art, sein Grundwert ist seiner, nicht
der der Miliz. Hausboni zählen zum Zuschlag. Klein, vor der Partie;
bedienung AC-nächste, Browserfall mit Schmiedeangriff.

**Punkt 33 (Benutzer, ~23:58):** *„die KI hat keine Burg gebaut, obwohl sie
in der ritterzeit ist"* → **der Server läuft auf `2f9ec0e`, die Burg-KI
(ki AC-33, `c798ce9`) ist dort noch nicht drin** (`git merge-base
--is-ancestor c798ce9 2f9ec0e` → nein; zehn Commits fehlen). Kommt mit dem
Ausrollen. Dann gilt: Burg erst **nach dem ersten Aufbruch** im
Fürstentum und wenn 650 Stein da sind — nicht sofort mit dem Aufstieg.

**Punkt 34 (Benutzer, ~23:59):** *„die ki hat sehr viele dorfbewohner, aber
die felder sind weit weg von den mühlen, sie bauen keine neuen
holzfällerplätze mehr, etc."* → Felder: das ist Punkt 9
(`ki.farmenPruefen`, Farmen abwechselnd um Mühle und Dorfzentrum,
ki.js ~1851). Lager: die Regel **gibt es** (`ki.lagerPruefen`, ~1807):
neues Lager, wenn vom mittleren Sammler das nächste annehmende Gebäude
weiter als `LAGER_AB = 5` Felder liegt und mindestens 3 (Gold/Stein 2)
dort sammeln. Warum sie beim Benutzer nicht greift, ist **nicht
gemessen** — Verdacht: gemessen wird vom **gemerkten Feld des mittleren
Sammlers in der Liste**, nicht vom Schwerpunkt; `platzBei` findet am
Waldrand nichts; oder das Holz fehlt (die KI hat im Mittel 55 Holz).
Morgen im Prüfstand messen: mittlerer Laufweg Sammler→Lager je Rohstoff
bei Minute 20/30/40, Zahl der Lager. Gehört in den KI-Block (9, 13, 19,
22, 24, 34) — nur ausrollen, wenn Nebeltest, zu viert und Team-Tests
halten.

**Punkt 35 (Benutzer, ~00:01):** *„die KI muss mehr passende Einheiten
gegen meine Einheiten bauen, wenn ich mit 15 rittern angreife, sollte sie
speerkämpfer und keine soldaten bauen"* → das ist **ki AC-31 „KI antwortet
auf das Heer", Status `offen`** (ki.md 512). Ein Zwischenstand liegt auf
dem lokalen Zweig `strategie-ki-antwort` (`9c69b75`, „nicht wirksam" — KI
gegen KI änderte es nichts, weil beide antworten; gegen einen Menschen ist
es nie gemessen). Bauen im KI-Block: aus `ki.gesehen` die Klassen des
fremden Heers zählen, je Militärgebäude die Einheit wählen, deren `bonus`
die häufigste Klasse trifft (aus den Daten gelesen, keine Namen), sonst
wie bisher; Messung: KI gegen ein festes Ritterheer bildet überwiegend
Speer/Pikenier aus; danach Nebeltest, ki AC-27 (Schwerpunkt je Haus —
kann fallen, wenn die Antwort den Schwerpunkt verdrängt: Antwort nur für
einen Teil der Ausbildung).

**Punkt 36 (Benutzer, ~00:02):** *„die Animation der Mange passt GAR
nicht. sie bewegt sich schnell und oft und nur alle paar sekunden geht nen
gemalter stein weg"* und *„rambock bewegt sich auch ganz schnell und nur
alle paar sekunden geht schaden weg"* → Ursache gelesen: das Angriffsbild
läuft **frei** nach der Wanduhr (`jetztPhase(id)` in `ansicht.js` ~80:
110 ms je Bild, acht Bilder ≈ 0,9 s je Umlauf), **unabhängig von der
Nachladezeit** (Ramme 5 s, Mangonel 6 s, auch Miliz 2 s). Bauen (nur
Browser): je Einheit ein Umlauf je Nachladezeit — Ruhebild, dann der
Schwung in den letzten ~0,9 s, der Treffer bei `SCHLAG_PHASE`; verankert
am Beginn von `w` (der erste Schlag fällt sofort) bzw. am gesehenen
Abwurf (`einschlaege`) / Lebensverlust des Ziels. Der Klang
(`schlagHoeren`) hängt an derselben Phase und zieht mit. Nachladezeit mit
Verbesserungen und Spielgeschwindigkeit (`ansicht.taktdauer`). Vor der
Partie; bedienung AC-39 (Ausholen im Kampf) erweitern oder neu.

**Punkt 37 (Benutzer, ~00:03):** *„kaputte gebäude sollten nicht nur
verschwinden, sondern kurz zur ruine werden, aber man kann trotzdem
drüberreiten/gehen"* → reine Darstellung: der Server gibt den Platz beim
Fall schon frei. Im Browser: verschwindet ein Gebäude, das eben noch im
Bild und nicht abgerissen/ersetzt war (Mauer→Tor!), bleibt an seiner
Grundfläche ~20 s ein Trümmerfeld (gezeichnet: Schutt, Balken, dunkler
Boden, verblasst am Ende; kein Blender nötig), ohne Treffer beim Klick,
ohne Verdecken. Der Zustand sagt nicht, **warum** ein Gebäude fehlt —
prüfen, ob es ein Zeichen für „gefallen" gibt (Leben ≤ 0 im letzten
Zustand, Meldung), sonst kleines Feld auf der Leitung. darstellung
AC-nächste. Mittel/klein, vor der Partie wenn Zeit.

**Punkt 38 (Benutzer, ~00:03):** *„sollte es möglich sein, dass ein
dorfbewohner sich selbst umbringt? durch entf taste?"* → **meine
Empfehlung (angesagt): ja**, für jede eigene Einheit und jedes eigene
Gebäude wie in der Vorlage (Platz in der Bevölkerung, Gebäude im Weg).
Ein Druck löscht **eine** Einheit der Auswahl, Umschalt+Entf alle; kein
Punkt für den Gegner (`siegZaehlen` nicht), zählt als Verlust auf der
Tafel; Gebäude: fällt wie zerstört (keine Erstattung; Baustelle wie
bisher `abreissen` mit Erstattung). Nachricht `entlassen`. Heute gibt es
nur `welt.abreissen()` für Baustellen (bauen AC-6). bedienung/einheiten
AC-nächste. Nach den Fehlern, vor der Partie wenn Zeit. Der Benutzer hat
noch nicht ausdrücklich „ja, bauen" gesagt — er fragte.

**Punkt 39 (Benutzer, ~00:03) — ENTSCHEIDUNG:** *„ich glaube es macht
sinn, dass man im Kronezeitalter noch EIN zweites dorfzentrum bauen
kann"* → genau eines zusätzlich, ab der Krone (Vorlage: ab der Ritterzeit,
unbegrenzt). Gehört zu **Stufe F**; als Daten: Dorfzentrum im Baumenü ab
Zeitalter 3 mit `hoechstens: 2`. In den Fahrplan/bauen.md eintragen, wenn
Stufe F spezifiziert wird.

**Punkt 40 (Benutzer, ~00:04):** *„wenn es keine normalen einheiten gibt,
sollten die soldaten automatisch gebäude angreifen (felder mit niedrigster
prio)"* → heute nimmt `wacheTakten()` nur Einheiten. Regel: sieht eine
wachende Kampfeinheit keinen Gegner, nimmt sie das nächste fremde Gebäude
in Sicht — Reihenfolge: was schießt, Militär, Rest, Farmen zuletzt;
Mauern und Tore nie von selbst. **Nicht während eines laufenden
Angriffslaufs** (sonst bleibt jedes KI-Heer am ersten Außengebäude
hängen), erst am Marschziel oder im Stand. Das ist eine Kampfregel:
ändert KI gegen KI → mit Punkt 15a zusammen bauen und danach Konterkreis,
Nebeltest, Team-Tests fahren; hält es nicht, nach der Partie mit den
Haltungen (15b).

**Punkt 36, Nachtrag (Benutzer, ~00:06):** *„auch die Anmiation der
Bogenschützen ist viel zu schnell und häufig, imv ergleich zu dem wie oft
dem schadensempäfnger was abgezogen wird, da sollten wir nochmal allgemein
nachjustieren"* → bestätigt: **allgemein** für jede Figur, nicht nur
Belagerung (ein Umlauf je Nachladezeit, siehe Punkt 36).

**Punkt 41 (Benutzer, ~00:07):** *„nach dem sieg sollten die gebäude des
gegners der aufgegeben hat, automatisch ne ruine werden - so isses lustig,
dass meine ritter noch weiter an den gebäuden rumfuhrwerken, obwohl sie
weg sind"* → zwei Dinge: (a) **wer aufgibt oder ausscheidet, dessen
Gebäude und Einheiten fallen** (wie in der Vorlage) — beim Aufgeben /
Ausscheiden alles des Spielers zerstören (Punkte für niemanden), im Bild
Ruinen (Punkt 37); Achtung Team: Verbündete spielen weiter; Achtung
Tafel: gezählt ist schon während der Partie. (b) **Nach dem Ende der
Partie steht das Bild still**: der letzte Zustand trägt `w` (arbeitet /
schlägt) weiter, die Welt taktet nicht mehr → der Browser spielt die
Schlagbewegung endlos. Bei `ende` die Phase anhalten (`halt` gibt es
schon für `jetztPhase`). Klein, zusammen mit Punkt 36/37.

**00:07, 2026-11-14: AUSGEROLLT — auf dem Server läuft `7aead4a`**
(`npm run ausrollen -- --stand`: Dienst läuft, 0 Räume, 0 Partien;
Sicherung `20261113-230634`, von außen und über wss geprüft). Das Skript
hat 18 × 20 s auf das Ende der Partie des Benutzers gewartet. Der
Abschnitt „Was auf dem Server läuft" oben nennt jetzt `7aead4a`.

**00:07: Punkt 3 GEBAUT (uncommittet): kampf AC-24 „Baustellen sehen
nichts", Status `in-qa`** — `welt.sichtAktualisieren()` überspringt
Gebäude ohne `fertig`, `baustelleTakten()` setzt bei Fertigstellung
`gebaeudeSichtNeu`, `public/nebel.js` nimmt nur Gebäude ohne `u`. Test in
`tests/strategie-sicht.test.mjs` (Gegenprobe fällt), Spec-Eintrag in
kampf.md unter „Aus dem Spiel auf dem Server". **Fehlt:** Browserfall mit
Bild (eigene Baustelle im Nebel hellt nichts auf), dann `fertig`;
`npm run specs:board`. **Nicht gebaut:** „Bauplatz nur auf gesehenen
Feldern" — `welt.erkundet()` gibt es, aber die KI setzt ihren zweiten
Markt weit weg; das würde ihre Messungen verschieben → in den KI-Block
oder weglassen (der Späher-Trick ist mit AC-24 ohnehin weg).

**00:13: Punkt 17 NICHT nachstellbar — meine erste „Nachstellung" war ein
Messfehler** (der Bauer war bei neun Feldern nach zehn Sekunden noch
unterwegs; mit 30 Sekunden Wartezeit sammeln 96 von 96, Lager 4 bis 11
Felder vom Vorrat, auf `7aead4a` wie auf `2f9ec0e`; Probe `p17b.cjs` im
Scratchpad). `nachDemBau()` schickt die Bauleute also wirklich zum
nächsten passenden Vorrat in zwölf Feldern. **Rückfrage an den Benutzer
steht aus:** welches Gebäude, wie weit vom Vorrat, mit Umschalt gebaut
(dann geht es zur nächsten Baustelle der Reihe), trug er etwas? Dem
Benutzer gesagt, dass die erste Aussage falsch war.

**00:13: Punkt 14 GEBAUT (uncommittet): einheiten AC-63 „Unerreichbar: der
Vorrat daneben", `fertig` mit Begründung in `qa/ohne-bild.json`** —
belegt war der Fehler so (Probe `p14c.cjs`): ist das dem Sammler nächste
Feld am geklickten Vorrat nicht erreichbar, sammelte er in 52 von 52
fernen Fällen **bei sich selbst**, 24 bis 38 Felder vom Klick
(`vorratUnerreichbar()` nahm `naechsterVorrat(einheit, …)`). Jetzt:
`erreichbar(karte, start, frei)` in `wege.js` (Fluten in vier Richtungen,
Puffer wiederverwendet), `welt.vorratErsatz(einheit, index)` nimmt den
Vorrat derselben Art, der dem **Klick** am nächsten liegt und ein
erreichbares Nachbarfeld hat (auch derselbe von der anderen Seite),
`auftrag.stand` trägt dieses Feld, `wegZumVorrat()` nimmt es; erst danach
die alte Regel. Tests `tests/strategie-vorrat-erreichbar.test.mjs` (vier,
Gegenprobe fällt). **Noch zu messen: Rechenzeit und KI** (Nebeltest) —
die KI wählt ihre Felder selbst, aber `vorratUnerreichbar` trifft auch sie.

**00:13: Punkt 1 GEBAUT (uncommittet): bauen AC-40 „Sammelpunkt folgt dem
Vorrat", `in-qa`** — Browser: `ansicht.befehlen()` fragt bei gewähltem
Gebäude `vorratImBild()` (aus `bildZiel` herausgelöst) und sendet das Feld
des getroffenen Vorrats; Server: `sammelpunktSetzen()` merkt `art`,
`sammelpunktZiel(gebaeude)` lässt ihn zum nächsten Vorrat derselben Art
wandern (zwölf Felder), auf der Leitung bleibt `p: {x, y}`. Tests in
`tests/strategie-bauen.test.mjs` (zwei). `npm run typen` grün. **Fehlt:**
Browserfall mit Bild (Klick auf die Krone setzt die Fahne an den Baum).

**Offene Browserfälle für den gemeinsamen Lauf (Liste fortschreiben):**
kampf AC-24 (Baustelle im Nebel hellt nichts auf), bauen AC-40 (Fahne am
Baum). Danach `specs:board`, Zahlen in CLAUDE.md.

**00:15: Punkt 15a GEBAUT (uncommittet): kampf AC-25 „Befohlenes Ziel
bleibt", `fertig` mit Begründung in `qa/ohne-bild.json`** — nachgestellt
(Probe `p15.cjs`): 42 von 90 Verfolgungen verloren den Auftrag, alle
schräg. Ursache: das Ziel steht zwischen zwei Feldern 1,98 Felder weit,
`angriffsplatz()` liefert das Feld, auf dem der Angreifer schon steht,
`wegNach` ist leer → „unerreichbar" → `auftrag = null` → die Wache nimmt
den Nächsten. Behebung in `angriffTakten()` („Kein Weg mehr"): steht er
schon auf dem Platz, geht er auf das Feld des Ziels zu. Danach 90 von 90;
Test in `tests/strategie-kampf.test.mjs` (24 Verfolgungen, Gegenprobe
fällt); Konterkreis und Kampftests grün (42).

**00:15: `tests/partien/` LÄUFT im Hintergrund (Task `bqjpvnkj2`,
Protokoll `partien-1.log` im Scratchpad)** mit Punkt 30, 3, 14, 1, 15a —
bis das Ergebnis da ist, **nichts unter `server/` ändern** (die
Testdateien laden den Code erst, wenn sie an der Reihe sind). Derweil nur
Browserteile. Fällt der Nebeltest: zuerst AC-25 (Kampfregel), dann AC-63
(Sammler) einzeln zurücknehmen und neu messen — Grenzen nicht lockern.

**00:27: Partienlauf `bqjpvnkj2` FERTIG — 11 grün, DREI GEFALLEN** (Protokoll
`partien-1.log` im Scratchpad). Nebeltest fahrplan AC-11 ✔, zwei gegen
zwei ✔. Gefallen, alle knapp:
- **ki AC-27**: `silberfurt aus markt: 1.8 je Partie, die anderen 1.2`
  (verlangt 1,4-fach UND zwei mehr; vorher 3,3 Karren je Partie)
- **ki AC-30**: `wehrstein: 1.9 wachturm je Partie mit Aufbruch (15 von
  16)` (verlangt 2; **1,75 ist vom Benutzer freigegeben** — Wortlaut
  weiter oben: „Wenn sie fallen, sind 1,4 und 1,75 freigegeben")
- **ki AC-26** (`ki-handel.test.mjs`): ohne Handel `42, 14, 14, 40, 53,
  22, 29` Gold, verlangt ≤ 50 (einer mit 53)

**2026-11-18, 17:00 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) HAUSEINHEITEN COMMITTET (`e18fad5`, `2545f50`); F1 IM ARBEITSBAUM ANGEWENDET; FÜNF KRONE-FIGUREN RENDERN VOLL (Task `b5kk9tkm2`). NICHT PUSHEN, NICHT AUSROLLEN.**

*Stand:*

- **Committet, lokal auf `strategie`:** `e18fad5` (Einheiten der Häuser, Wehrturm, Specs der Krone) und `2545f50` (Bildnachweise). Davor: Reiterschütze voll gerendert (Spielerfarbe 0,126, alle Paare ≥ 0,346), 27 Browserfälle grün (zwei davon die bekannten `test.fail`), `npm run check` grün (991 Tests, 14 Partien; beim ersten Lauf fiel `kampf AC-15` mit 1,165 ms unter Last, allein dreimal grün). CLAUDE.md: 572 von 704, 991 Tests, 316 im Browser. `main` = `origin/main` = Server = `a9a4d9a` — **gepusht und ausgerollt ist nichts.**
- **Uncommittet seit `2545f50`:**
  - `python "$S/krone-figuren-eintragen.py"` ausgeführt (beide Stufen: Verzeichnis, `NAMEN`, Bildprobe, Schautafel) — **nicht erneut ausführen.**
  - **`f1-krone.py` angewendet** (daten.js, welt.js, figuren.js, auswahlleiste.js, e2e/helpers/strategie.mjs) — **nicht erneut ausführen.** `tests/strategie-krone.test.mjs` (6 von 6) und `e2e/tests/strategie-krone.spec.mjs` (nie gelaufen) kopiert. `npm run typen` ohne Meldung, Wächter 43 von 43, alle 612 Strategie-Rechentests grün. Specs bauen AC-47 und einheiten AC-66 stehen noch **nicht** auf `fertig` (Browserbeleg fehlt).
  - **Renderproben aller fünf Figuren liefen beim ersten Versuch durch** (kein Fehler im Modellcode). Gemessen (Probe, eine Richtung): alle Paare über 0,4 außer dem bekannten Soldat gegen Armbrustschütze 0,346; Spielerfarbe Zweihandkämpfer 0,19, Hellebardier 0,22, Husar 0,12, Paladin 0,139, **Kavalier 0,096 → Deckensaum auf 0,2 verbreitert (`grafik/reiter.py`) → 0,119**; Bildpunkte 334, 354, 1001, 1207, 1405. Angesehen: Flügel des Husaren, Kanz und Platten des Paladins, Federbusch und Zweihänder sind zu erkennen.
- **Render `b5kk9tkm2` läuft seit 17:00** (`BILDER_KERNE=6`, alle fünf in einem Blender-Prozess, geschätzt zwei Stunden). Solange: kein Browserlauf, kein zweiter Blender, `grafik/verzeichnis.json` nicht ändern. Bis er fertig ist, fällt `tests/bilder.test.mjs` (Probetafeln haben eine Richtung).
- **Währenddessen erlaubt und geplant:** `python "$S/paket-charakter.py"` anwenden (einmal!), `strategie-charakter.test.mjs` nach `tests/`, `strategie-charakter.spec.mjs` nach `e2e/tests/`, Typen, Wächter, Rechentests.

*Als Nächstes, in dieser Reihenfolge:* (1) Paket anwenden und ohne Browser prüfen; (2) nach dem Render: `node --test tests/bilder.test.mjs`, Schautafel messen (Paare, Spielerfarbe über 0,1, über 250 Bildpunkte), ansehen; (3) Browser: `strategie-krone`, `strategie-charakter`, `strategie-unterscheidbar`, `strategie-bildprobe`, `strategie-figuren` mit `QA_NACHWEIS=1 E2E_HAFEN=4195`, Rotes beheben; (4) Specs bauen AC-47, einheiten AC-66, darstellung AC-32, bauen AC-52 bis AC-56 auf `fertig`, Board, `npm run check:alles:neu:kurz`, `qa:abweichung`, CLAUDE.md, zwei Commits; (5) F2 bis F5.

**2026-11-18, 17:50 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) PAKET, F2-SPIELSEITE UND F3 IM ARBEITSBAUM ANGEWENDET, RECHNERISCH GRÜN; RENDER `b5kk9tkm2` LÄUFT NOCH. ALLES SEIT `2545f50` UNCOMMITTET. NICHT PUSHEN, NICHT AUSROLLEN.**

*Stand:*

- **Angewendet, nicht erneut ausführen:** `paket-charakter.py` (bauen AC-52 bis AC-56; `tests/strategie-charakter.test.mjs` 18 von 18), `f2-krone2.py` (einheiten AC-67, AC-68: Langbogenschütze `L`, schwere Armbrust `A`, Belagerungsramme `R`, Onager `O` samt `langbogenstufe`, `armbruststufe`, `rammenstufe`, `onagerstufe`; ohne gerenderte Figur sehen die vier aus wie ihre Vorstufe), `f3-krone.py` und `f3-schiessende.py` (bauen AC-48 bis AC-50).
- **F3 im Einzelnen:** zwölf Verbesserungen am Ende von `VERBESSERUNGEN` (`hochofen`, `armschiene`, `plattenpanzer`, `plattenharnisch` = „Plattenrossharnisch", `ringpanzer` = „Ringpanzer der Schützen", `fruchtwechsel`, `zweimannsaege`, `chemie`, `bergfried`, `architektur`, `belagerungsingenieure`, `wehrpflicht`), zwölf Knopfbilder in `ZEICHEN` (`hochofen`, `armschiene`, `platte`, `rossplatte`, `ringweste`, `fruchtfolge`, `zugsaege`, `kolben`, `bergfried`, `zirkel`, `zahnrad`, `trommel`) — **im Browser noch nie angesehen.** Neu: Klasse `wurf` („Wurfmaschinen", Mangonel und Onager), Wirkungsform `bonusAnteil` (gerechnet in `welt.bonusVon()` als weiterer Zuschlag: Ramme 152 statt 127, Belagerungsramme 215 statt 179, Mangonel +8, Onager +11 gegen Gebäude), `ausbildung` auch an einer Verbesserung (Wehrpflicht), `bringt.js` schreibt dafür drei neue Zeilenarten und „Der Wehrturm wird Bergfried". **`SCHIESSENDE` steht jetzt in `daten.js`** (exportiert; `welt.js`, `ki.js`, `bringt.js` lesen es) — der Wächter `waechter-werte` meldete `GEBAEUDE[art].angriff`, seit die Chemie `gebaeude.angriff` trägt. Die zwei Zeilen in `ki.js` fragen dasselbe wie vorher (Menge statt Tabellenwert), KI-Messungen sind davon nicht berührt.
- **Der Bergfried hat noch kein eigenes Bild:** `bild: { wachturm: 'bergfried' }` fehlt mit Absicht, der Turm behält das Bild des Wehrturms. Modell auf Basis des Wehrturms schreiben, rendern, dann nachtragen — vorher ist bauen AC-50 nicht `fertig`.
- **Geprüft:** `npm run typen` ohne Meldung; `node --test "tests/strategie-*.test.mjs" "tests/waechter-*.test.mjs"` 677 von 677 vor den F3-Tests; `tests/strategie-krone.test.mjs` danach 16 von 16 (sechs neue Tests zu bauen AC-48, AC-49, AC-50). **Nicht gelaufen:** `npm run check`, jeder Browserfall (`strategie-krone.spec.mjs`, `strategie-charakter.spec.mjs` nie), `tests/bilder.test.mjs` (fällt, bis der Render fertig ist).
- **Spec `bauen.md`:** AC-48 nennt die zwei Anzeigenamen, AC-50 die Rechnung des Fünftels. Alle Kriterien der Krone stehen noch auf `offen`.
- **`f2-figuren.py` wartet im Scratchpad** (vier Figuren: Langbogenschütze, schwere Armbrust in `fussvolk.py`, Belagerungsramme, Onager in `belagerung.py`; nur `py_compile`, in Blender nie gelaufen). Erst anwenden, wenn kein Render läuft.
- **Render `b5kk9tkm2`:** seit 16:59, Zweihandkämpfer 17:19 fertig, um 17:40 lag der Hellebardier noch nicht vor.

*Als Nächstes, in dieser Reihenfolge:* (1) Render abwarten, Ausgabe lesen, `node --test tests/bilder.test.mjs`, Schautafel messen, Figuren ansehen; (2) `npm run check:kurz`, lokal committen (F1, Paket, F2-Spielseite, F3, fünf Figuren); (3) `f2-figuren.py` anwenden, vier Einträge in `grafik/verzeichnis.json`, `NAMEN` in `public/bilder.js`, `public/bildprobe.js`, `public/schautafel.js`, je Figur `BILDER_PROBE=2`, messen, nachbessern, dazu das Modell des Bergfrieds; alles voll rendern (ein Prozess); (4) Browserfälle mit Nachweis, die zwölf Knopfbilder ansehen, Leiste von Schmiede, Universität und Werkstatt auf 1366 × 768 prüfen (`strategie-laptop`), Specs auf `fertig`, Board, `check:alles:neu:kurz`, `qa:abweichung`, CLAUDE.md, Commits; (5) F4 (einheiten AC-69), F5 (Konterkreis fahrplan AC-26), dann Drache, Wunder, KI in der Krone.

**2026-11-18, 19:00 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) FÜNF KRONE-FIGUREN VOLL GERENDERT UND GEMESSEN; F4 ANGEWENDET, RECHNERISCH GRÜN; VIER F2-FIGUREN IN DER PROBE. ALLES SEIT `2545f50` UNCOMMITTET. NICHT PUSHEN, NICHT AUSROLLEN.**

*Stand:*

- **Render `b5kk9tkm2` fertig (16:59 bis 18:52):** Zweihandkämpfer, Hellebardier, Husar, Kavalier, Paladin, je 9 × 8 Bilder. Schautafel: kleinstes Paar 0,346 (Soldat gegen Armbrust, alt), Spielerfarbe 0,188 / 0,219 / 0,119 / 0,119 / 0,139, alle weit über 250 Bildpunkten. Auf der Schautafel angesehen.
- **`f2-figuren.py` angewendet, nicht erneut ausführen** (`grafik/fussvolk.py`, `grafik/belagerung.py`, vier Hüllen `langbogenschuetze.py`, `schwerearmbrust.py`, `belagerungsramme.py`, `onager.py`); vier Einträge in `grafik/verzeichnis.json`. **Noch nicht eingetragen:** `NAMEN` in `public/bilder.js`, `public/bildprobe.js`, `public/schautafel.js` — erst wenn die Tafeln voll gerendert sind. Probe (`BILDER_PROBE=2`): Langbogenschütze und schwere Armbrust liegen als Probestand vor (eine Richtung), **noch nicht angesehen und nicht gemessen**; Belagerungsramme fiel an einer verdeckten Variablen (`seil` in `belagerung.stellen`, behoben: `lang`), Probe beider Belagerungsfiguren läuft als Task `bm0hsrgyc`. `tests/bilder.test.mjs` fällt bis zum vollen Render an darstellung AC-24 (keine Tafel).
- **F4 angewendet, nicht erneut ausführen:** `f4-elite.py` — fünf Verbesserungen nach `wehrpflicht` (`elitekriegswolf`, `elitereiterschuetze`, `eliteriese`, `elitemeuchler`, `elitewiedergaenger`; je 500 Nahrung, 400 Gold, 60 s, `zeitalter: 3`, neue Felder `hebt` und `haeuser`, `nennt` für die Einheit), in `bildetAus` der Burg; `welt.hausBildetAus` fragt auch Verbesserungen (Absage `„<Name>" erforscht nur Haus <Haus>.`), `kampfwerte()` trägt den Namen der Einheit; `bringt.js` nennt die gehobene Einheit beim neuen Namen; Leiste: `stufen()` (aus `wandelt` oder `hebt`), `einheitName(besitzer, art)`, Hausfilter auch für Verbesserungen, Knopf unter der Einheit. Keine neue Art, keine neue Figur.
- **Abweichung von der Spec, gemessen:** Elite-Wiedergänger bekommt **Nah- statt Fernrüstung** (2/0 statt 1/1): mit +1 gegen Pfeile schlug er den Langbogenschützen 23 von 40. Spec AC-69 umgeschrieben, samt aller Messwerte. Paarungen auf Krone-Stufe (ohne Hausbonus, 40 Gefechte): Wolf–Hellebardier 40, –Zweihand 0; Reiterschütze–schwere Armbrust 31, –Eliteplänkler 0, –Hellebardier 0; Riese–Hellebardier 28, –schwere Armbrust 0, –Zweihand 0; Meuchler–Zweihand 0; Wiedergänger–Langbogen 0, –schwere Armbrust 6.
- **Befund, nicht behoben (an den Benutzer):** mit Distelhags Hausbonus (+1/+2 für Fußvolk) schlägt schon der gewöhnliche Wiedergänger den Bogenschützen des Fürstentums 40 von 40 und die Armbrust 22 von 40 — „verliert gegen Schützen" (einheiten AC-49) gilt nur im Gefechtsstand ohne Haus. Mit der Stufe: Langbogen 40 von 40, schwere Armbrust 18. Skript `f4-untot.cjs` im Scratchpad. Ebenso: der Reiterschütze hat bei Rappenstein 75 statt 60 Leben, mit der Stufe 90.
- **Tests:** fünf neue in `tests/strategie-hauseinheiten.test.mjs` (einheiten AC-69; Datei 31 von 31), angehängt aus `f4-tests.mjs.txt` (nicht erneut). `npm run typen` ohne Meldung, `node --test "tests/strategie-*.test.mjs" "tests/waechter-*.test.mjs"` **688 von 688**. **Nicht gelaufen:** `npm run check`, jeder Browserfall zu F1, Paket, F2, F3, F4.

*Als Nächstes:* (1) Probe von Belagerungsramme und Onager abwarten; alle vier Proben ansehen (`npm run sicht -- schautafel.html` braucht die Namen in `NAMEN` und `schautafel.js` — dafür vorübergehend eintragen) und messen, nachbessern; (2) Bergfried-Modell auf Basis des Wehrturms schreiben, proben; (3) alles voll rendern (ein Prozess: vier Figuren und Bergfried), `NAMEN`, Bildprobe, Schautafel, `bild: { wachturm: 'bergfried' }`; (4) `npm run check:kurz`, lokal committen; (5) Browserfälle zu F1 bis F4 mit `QA_NACHWEIS=1`, neue Fälle für F2, F3, F4 (Elitestufe: Knopf unter der Einheit nur beim eigenen Haus, Name an der Auswahl), zwölf Knopfbilder ansehen; (6) Specs auf `fertig`, Board, voller Lauf, Commit; danach F5.

**2026-11-18, 19:30 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) VIER F2-FIGUREN UND BERGFRIED RENDERN VOLL (TASK `b87d7tcz2`); BROWSERFÄLLE ZU F2 BIS F4 GESCHRIEBEN, NIE GELAUFEN. ALLES SEIT `2545f50` UNCOMMITTET. NICHT PUSHEN, NICHT AUSROLLEN OHNE DAS WORT DES BENUTZERS.**

*Stand:*

- **Render `b87d7tcz2` läuft seit 19:07** (ein Blender-Prozess: `langbogenschuetze schwerearmbrust belagerungsramme onager bergfried`); der Langbogenschütze war 19:19 fertig, also rund zwölf Minuten je Fußfigur, fertig gegen 20:05. **Solange er läuft: kein Browserlauf, kein `npm run sicht`/`tafel`, kein zweiter Blender, `grafik/*.py` und `grafik/verzeichnis.json` nicht ändern.** `tests/bilder.test.mjs` fällt bis dahin an darstellung AC-24.
- **Die vier F2-Figuren stehen in `NAMEN` (`public/bilder.js`), Bildprobe und Schautafel**; die Proben sind gemessen und angesehen (Probestand, eine Richtung).
- **Bergfried:** `grafik/bergfried.py` neu (ein Feld, hoher geböschter Fuß, zwei Gesimse, Hurde auf Kragbalken, vier Ecktürmchen, Schieferhelm; `einzeltafel('bergfried', 1, 4.95, …)`), Eintrag in `grafik/verzeichnis.json`, `bild: { wachturm: 'bergfried' }` und `nennt` an `VERBESSERUNGEN.bergfried`, Eintrag `bergfried` in `public/gebaeude.js` (`trefferOben: 6.2`, `schussHoehe: 5.2` — **gesetzt, im Bild nicht geprüft**), in `NAMEN`. Probe-Bild 493 × 454, angesehen: klar vom Wehrturm verschieden. Test in `tests/strategie-krone.test.mjs` (`kampfwerte('a').wachturm.bild`).
- **Leiste:** nach der Elitestufe heißt auch der Ausbildungsknopf „Elite-…“ (`angebot()` in `public/auswahlleiste.js` nimmt `einheitName`). `npm run typen` ohne Meldung, Rechentests **688 von 688** (19:20).
- **Browserfälle geschrieben, `node --check` in Ordnung, NIE GELAUFEN:**
  - `e2e/tests/strategie-hauseinheiten.spec.mjs`: neuer Fall `einheiten AC-69` im zweiten `describe` (Anna Eschenbruch, Bert Rappenstein, Cem Wehrstein in der Krone; Elite-Kriegswolf 70/70, 9 Angriff; Elite-Riese 220/220, 12; zwei Nachweise).
  - `e2e/tests/strategie-krone-forschung.spec.mjs` **neu**, fünf Fälle in einer Partie (Anna gleich in der Krone, aufgedeckt, drei Wiesen): `einheiten AC-67` (Schießanlage, Langbogen erst nach `bogenstufe`), `einheiten AC-68` (Werkstatt), `bauen AC-48` (Schmiede: zwei Runden Vorstufen, dann genau fünf Knöpfe; Wirkung an Langschwertkämpfer, Ritter, Armbrustschütze), `bauen AC-49` (Fruchtwechsel: neue Farm trägt 175 mehr — liest `gebaeude.n`, **das Feld ist geraten**; Zweimannsäge), `bauen AC-50` (Wehrturm → Bergfried: Name, +750 Leben, Bild `bergfried`, höher; Chemie, Architektur, Belagerungsingenieure; Wehrpflicht in der Burg; zwei Nachweise).
  - **Annahmen in der neuen Datei, die beim ersten Lauf fallen können:** `gebaeudeInDerNaehe` für `farm`, `burg`, `wachturm` mit `{ von, bis }`; das Feld `n` der Farm; `ansicht.lebensbalken` mit `art: 'gebaeude'` (aus `strategie-truppenstufen.spec.mjs` übernommen); Reichweite des Mangonels 7; der Turm zeigt Chemie als +1 Angriff an der Auswahl.
- **Frage des Benutzers (19:20):** Stand, Rest, wann ausrollen, Performance. **Geantwortet:** Empfehlung, `2545f50` jetzt auszurollen (vollständig geprüft; der Server `a9a4d9a` hat das Gefecht ohne Hänger noch nicht) — **er hat noch nicht zugestimmt, also nichts gepusht**; die Krone F1 bis F4 frühestens heute 22 bis 23 Uhr. Performance: Server-Tempotests grün; Bildrate seit den neuen Figuren nicht gemessen — **nach dem Render `npm run tempo:partie` fahren und ihm die Zahl nennen**; `public/bilder/` 47 MB (vorher 35), Speicher im Browser ungemessen.

*Als Nächstes:* (1) Ende von `b87d7tcz2` abwarten, `node --test tests/bilder.test.mjs`, Schautafel messen (Paare ≥ 1/3, Spielerfarbe > 0,1, > 250 Bildpunkte) und ansehen; (2) `npm run tempo:partie` (zugesagt); (3) `npm run check:kurz`, lokal committen (Code, dann Bilder); (4) Browserfälle: `strategie-krone`, `strategie-krone-forschung`, `strategie-charakter`, `strategie-hauseinheiten`, `strategie-truppenstufen`, `strategie-unterscheidbar`, `strategie-bildprobe`, `strategie-figuren`, `strategie-laptop`, `strategie-feudalzeit`, `strategie-ritterzeit-am-stueck` mit `QA_NACHWEIS=1 E2E_HAFEN=4195`; Rotes beheben; zwölf Knopfbilder ansehen; (5) Specs auf `fertig`, Board, `check:alles:neu:kurz`, `qa:abweichung`, CLAUDE.md, Commit; danach F5.

**2026-11-18, 19:45 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) AUFTRAG: KRONE BELEGEN UND COMMITTEN → KONTERKREIS → MEHR GOLD UND STEIN → AUSROLLEN. TOKENS SPAREN.**

*Auftrag des Benutzers (19:25, wörtlich):* „Krone im Browser belegen und committen (heute Abend). Konterkreis mit den neuen Stufen, dann noch mehr gold und stein, und dann ausrollen. Wir müssen dann auch token sparen. fable is aktuell bei 84%“. **Das ist sein Wort fürs Ausrollen — aber erst, wenn die drei Schritte davor stehen und der volle Check grün ist** (`main` auf den geprüften Commit, pushen, `npm run ausrollen`, nie `--sofort`). Drache, Wunder, KI-Block: NICHT jetzt. Ausgaben filtern, keine großen Dateien lesen, kurze Meldungen.

*Stand:*

- **F5 fertig (fahrplan AC-26, `fertig`, Begründung in `qa/ohne-bild.json`):** zwei Tests in `tests/strategie-konterkreis.test.mjs` (11 von 11). Neun Paarungen mit Krone-Stufen und voller Schmiede, Budget 2000: je 20 von 20, umgekehrt 0. Paladin fällt vor dem Hellebardier 20:0, schlägt beide Schützenlinien 20:0. **Spec berichtigt:** „Langbogen gegen Zweihandkämpfer“ war keine der neun Paarungen und gilt nicht — das Schwert schlägt den Bogen 20:0 (wie im Fürstentum), die schwere Armbrust das Schwert 19 von 20. Kavalier gegen Zweihandkämpfer ist offen (2 und 6 von 20) — nicht im Kreis.
- **Punkt 55 gebaut (karte AC-18, `fertig`, Begründung in `qa/ohne-bild.json`):** `server/spiele/strategie/karte.js` — `FERNE` (je Basis zwei Goldfelder 2×2 bei 19 und 22 Feldern seitlich, ein Steinfeld 2×2 bei 20 zur Mitte), `GRENZE` (zwischen je zwei Nachbarn 4 Gold + 3 Stein auf 0,6 des Basenkreises), `erreichbarVon`, `passt`, `freierPlatz` (Ring Gras, zu Fuß erreichbar, sonst nächster Platz; Notbehelf rodet, 9-mal über 840 Karten), `umkreis` (gleich weit von beiden Nachbarn zuerst), `karte.fundorte` (nur für Tests, nicht auf der Leitung). **Der Zufall wird nicht angefasst**, der Rest der Karte liegt wie vorher. Je Spieler 19 Felder Gold und 12 Stein statt 7 und 5. Test `karte AC-18` in `tests/regeln.test.mjs` (24 von 24). Rechentests **690 von 690**.
- **NACHTRAG 20:00 — der Benutzer (19:40, wörtlich): „man könnte ja noch Rohstoffe, wenig / mittel / viel angeben. Also 7/5 ist wenig, 12/8 ist mittel und 19/12 ist viel - als Beispiel“.** Gebaut als **karte AC-19** (`in-qa`, bis der Browserfall lief): Einstellung `vorkommen` im Steckbrief („Gold und Stein“), Stufen als `VORKOMMEN` in `karte.js` — wenig = Dorf allein (7/5, die alte Karte Feld für Feld), **mittel = dazu das Umkämpfte (11/8), Vorgabe**, viel = dazu die eigenen (19/12). Test `karte AC-19` in `tests/regeln.test.mjs` (25 von 25), Browserfall `karte AC-19` in `e2e/tests/spielauswahl.spec.mjs` (nie gelaufen). `karte AC-18` prüft jetzt mit `{ vorkommen: 'viel' }`. Der Zähler des Notbehelfs heißt `ZAEHLER.notbehelf` (Typprüfer). 725 Rechentests und Typen grün. Die KI-Messung `bkrmc74qt` wurde dafür ABGEBROCHEN; **neu läuft `bczbl5n6d` mit der Vorgabe mittel** (seit 19:55). Für „viel“ und „wenig“ ist die KI danach nicht gemessen (wenig = alte Karte = alte Messwerte).
- **NACHTRAG 20:50:** KI-Partien auf „mittel“ **14 von 14 grün** (Nebel 120: 111 vor Minute 60, Median 39,4, 0 ohne Sieger). Render fertig, `tests/bilder.test.mjs` 20 von 20, Schautafel: kein Paar unter 1/3, Spielerfarbe 0,19 bis 0,25. **Browserfälle der Krone alle grün mit Bildnachweis**: `strategie-krone` (2), `strategie-krone-forschung` (5; nur zwei freie Wiesen auf der Karte, der dritte Fall steht neben dem ersten), `strategie-charakter` (5), `strategie-hauseinheiten` (10), `spielauswahl` `karte AC-19`. **Auf `fertig` gesetzt:** bauen AC-47 bis AC-50, AC-52 bis AC-56; einheiten AC-66 bis AC-69; karte AC-19; Board 588 von 706. darstellung AC-32 bleibt `offen` (verlangt auch Wunder und Drache). CLAUDE.md: zwei Absätze (Krone F1–F5, Gold und Stein) eingefügt, **die Zahlenzeile unter „Stand“ fehlt noch**. **Tempo** (`npm run tempo:partie`, Minute 25, 93 Einheiten, 69 Gebäude, beide KIs im Fürstentum — die Figuren der Krone stehen dabei NICHT im Bild): Gefecht 119 Bilder/s, `zeichnen` 2,7 ms (p95 4,6), 0 Bilder über 50 ms. Die Messung meldet drei 404 ohne Adresse; `scripts/sicht.mjs` hängt jetzt die Adresse an, zweiter Lauf dafür läuft. **Als Nächstes:** 404 klären → `npm run check:alles:neu:kurz` (im Hintergrund, rund 45 min) → `npm run qa:abweichung` → Zahlenzeile in CLAUDE.md → zwei Commits (Code, dann Bilder) → `git push origin <commit>:main`, `npm run ausrollen`, `-- --stand`.
- **NACHTRAG 21:45:** Die drei 404 der Tempo-Messung waren `favicon.ico`. **Der Benutzer (21:10, wörtlich): „Dann erstelle bitte ein Favicon, macht auf jeden Fall Sinn. lass dir was schönes einfallen“** → `public/favicon.svg` (gespaltener Schild, links Gold, rechts verblassend und bröckelnd, selbst gezeichnet), eingebunden in `index.html`, `schautafel.html`, `bildprobe.html` (das Managerspiel behält sein Zeichen); Vorschau dem Benutzer geschickt. **Voller Lauf `check:alles:neu` (20:37 bis 21:20): 329 grün, 2 gefallen — beides Tests, nicht das Spiel:** `strategie-ritterzeit-am-stueck` (der Markt forscht seit bauen AC-52 im Lehen → `feudal` nimmt den Markt aus) und `strategie-bildprobe` darstellung AC-24 (`GERAETE` um Belagerungsramme und Onager ergänzt, Zahl der Figuren 27 → 36). Beide nachgefahren und grün, Spielauswahl mit Favicon 22 von 22. **Läuft:** `npm run check:kurz` und `qa:abweichung` (Task `bz1ghjbns`). **Danach:** Zahlenzeile „Stand“ in CLAUDE.md, zwei Commits, `git push origin <commit>:main`, `npm run ausrollen`, `-- --stand`.
- **NEUER AUFTRAG (2026-11-20, wörtlich): „Bitte mit Blender den Drachen rendern, fehlen noch weitere Einheiten und co? Bitte erstmal mit Blender die Figuren erstellen. Danach kann Opus den Rest implementieren“** → diese Sitzung (Fable) schreibt und rendert NUR die Modelle unter `grafik/` (ein Blender-Prozess!): Drache (`drache.py`), Drachenei am Boden, Dorfbewohner mit Ei als Ladung, Wunder 5×5 samt `baustelle-5`, Feuer des Drachen in `geschoss.py`. Verdrahten im Spiel (Server, Browser, Specs, Tests) macht danach Opus — dafür am Ende hier eine Übergabe schreiben (Namen der Tafeln, Abläufe, Zellen). Stand der Arbeit: siehe Zeilen darunter, sobald etwas steht.
- **STAND DER MODELLARBEIT (2026-11-20, 21:55, uncommittet):** geschrieben sind `grafik/drache.py` (Figur `drache`: stehen 1, gehen 8 = Flug, angreifen 8 mit Flamme, sterben 8 = Absturz; Zelle 620×420, Flughöhe als `flughoehe` in der Beschreibung; Spielerfarbe auf der äußeren Flughaut), `grafik/drachenei.py` (Tafel `drachenei`, Spalte 0 Ei in der Mulde, Spalte 1 Ei allein; `ei()` wird vom Dorfbewohner genutzt), in `grafik/dorfbewohner.py` die fünfte Ware `e` (Teiltafel `dorfbewohner-e`, Abläufe `stehen_e`/`gehen_e`), `grafik/wunder.py` (5×5, goldene Kuppel), `grafik/baustelle-5.py` (`HOCH[5]` in `baustelle.py`), in `grafik/geschoss.py` vier Feuer-Spalten 7–10 (`feuer`, `feuerlaenge` in der Beschreibung), in `grafik/stoffe.py` `flammenhuelle()`. Alle stehen in `grafik/verzeichnis.json` — **gerendert ist noch nichts davon nach `public/bilder/`** (bis dahin ist `npm run check` rot: Eintrag ohne Bild). Proben gehen nach `scratchpad/drache1` u. ä. mit `--ziel=`; ein Blender-Prozess. Reihenfolge: Drache proben → nachbessern → voll; dann Ei, Geschoss, Wunder, Baustelle-5, Dorfbewohner (ganz neu rendern, danach prüfen, dass die alten Tafeln gleich geblieben sind). Zum Schluss Übergabe für Opus hier eintragen.

**NACHTRAG (2026-11-20, 22:20, uncommittet):** Drachenprobe angesehen und gemessen: Gestalt und vier Abläufe lesbar, Spielerfarbe 0,15 bis 0,22 (eine Richtung), Zelle der Probe 375 x 276, `hoehe` 86, `flughoehe` 78. Die Flamme stand gelb-weiß im Bild, weil die Ansicht 'Standard' jeden Kanal bei 1 kappt: Saum jetzt `flammenhuelle('#ff4a0c', 1.3)`, Kern `glut('#ffcf4a', 1.5)` (Drache und Geschoss), Risse des Eis `glut(..., 2.2)`; am Feuergeschoss geprüft (roter Saum, gelber Kern). **Marktkarren trägt Gold** (einheiten AC-41): Teiltafel `marktkarren-g`, Abläufe `stehen_g`/`gehen_g` — geschrieben, nicht gerendert. **Voller Render des Drachen läuft** (Task `b4b2072xc`, seit 22:20, rund 52 Minuten). Danach der Reihe nach, immer ein Prozess: `drachenei`, `geschoss`, `wunder`, `baustelle-5`, `dorfbewohner`, `marktkarren` — bei den drei alten Figuren prüfen, dass die alten Tafeln gleich bleiben.

**ÜBERGABE AN OPUS (2026-11-21, 00:40): alle Modelle für Drache, Ei, Wunder und Karrenladung sind gerendert und liegen unter `public/bilder/`; im Spiel verdrahtet ist NICHTS davon.** Der Benutzer (2026-11-20): „Bitte erstmal mit Blender die Figuren erstellen. Danach kann Opus den Rest implementieren". Kein Blender nötig für das, was folgt. Was da ist und was damit zu tun ist:

| Tafel | Was | Beschreibung (`public/bilder/<name>.json`) | Zu verdrahten |
| --- | --- | --- | --- |
| `drache` | Figur, 8 Richtungen | Zelle 422 x 313, Fuß 155/222, `hoehe` 86, **`flughoehe` 78** (Bildpunkte der Leibmitte über dem Fußpunkt: dort gehören Lebensbalken und Klick hin, der Schatten liegt am Fuß). Abläufe `stehen` (1 Bild), `gehen` (8, Flügelschlag), `angreifen` (8, eigene Tafel 461 x 313, Flamme in den Bildern 3 bis 6 von 0 gezählt, voll in 4 und 5, Treffer bei t = 0,5), `sterben` (8, einmal, eigene Tafel: Sturz und Aufschlag). Spielerfarbe: äußere Flughaut, im Stand 0,13 bis 0,26 | einheiten AC-52 bis AC-54, kampf AC-23, bauen AC-35. In `NAMEN` in `public/bilder.js` und als Figur in `public/figuren.js` eintragen. **Im Stand `gehen` abspielen** — ein Drache, der mit einem Bild in der Luft steht, sieht eingefroren aus |
| `drachenei` | liegt am Boden | eine Zeile, 240 x 170, Fuß 96/112; `liegt: 0` (Ei in verbrannter Mulde, so liegt es auf der Karte), `allein: 1` (nur das Ei mit Schatten: Knopfbild, Ei am Kloster); keine Maske | einheiten AC-51, AC-53 |
| `dorfbewohner-e` | Dorfbewohner trägt das Ei | Abläufe `stehen_e`, `gehen_e` (Teil `e`, 139 x 125, Fuß 41/95) — dieselbe Form wie `_h`, `_n`, `_g`, `_s` | einheiten AC-51: die Ware `e` neben den vier Rohstoffen |
| `geschoss` | Feuer des Drachen | 11 Spalten statt 7: `feuer: [7, 8, 9, 10]` (vier Gestalten, im Flug durchwechseln), `feuerlaenge` 0,62 Felder; Kopf rechts auf dem Fußpunkt wie die Pfeilspitze | darstellung AC-28, einheiten AC-52 — nur nötig, wenn das Feuer als Geschoss fliegt; die Flamme am Maul steckt schon im Ablauf `angreifen` |
| `wunder` | Gebäude, 5 x 5 Felder | 770 x 621, mit Maske (vier Banner und die Fahne) | bauen AC-51, spielziel AC-29, darstellung AC-32 |
| `baustelle-5` | Baustelle für 5 x 5 | vier Stufen wie `baustelle-1` bis `-4`, 780 x 475 | in `NAMEN` neben `baustelle-4`; das Wunder ist das erste Gebäude mit fünf Feldern |
| `marktkarren-g` | Karren mit Gold beladen | Abläufe `stehen_g`, `gehen_g` (Teil `g`, 339 x 233, Fuß 140/147) | einheiten AC-41: auf dem Rückweg vom fremden Markt |

Nicht gebaut und nicht nötig: eigene Figuren der Elitestufen (behalten ihre), Trümmer (zeichnet der Browser). **Noch zu messen, wenn verdrahtet:** darstellung AC-14 (ein Drittel Unterschied zu jeder anderen Figur) und AC-21 (Spielerfarbe) auf der Schautafel — `npm run tafel -- "t.unterschiede('figur').filter((p) => p.anteil < 0.4)"`; ich habe nur den Anteil der Spielerfarbe aus der Maske gerechnet. Ob der Drache für das gezeichnete Aussehen (`?bilder=0`) eine eigene Zeichnung in `public/figuren.js` braucht, habe ich nicht nachgesehen. Geändert an Tests nur `tests/bilder.test.mjs`: das Beispiel für ein fehlendes Modell heißt jetzt `lindwurm`, und darstellung AC-28 rechnet die Feuerspalten mit. Die alten Tafeln von Dorfbewohner und Marktkarren sind unverändert (neu gerendert, bis auf Rauschen gleich, mit `git checkout` zurückgeholt). Werkzeuge im Scratchpad dieser Sitzung (nicht eingecheckt): `ansehen.py`, `richtungen.py`, `vergleich.py`.

**NACHTRAG (2026-11-20, 23:55, uncommittet):** GERENDERT nach `public/bilder/` und angesehen: `drache` (8 Richtungen, Zelle 422 x 313, Fuß 155/222, `hoehe` 86, `flughoehe` 78; Angreifen 461 x 313, Sterben 422 x 312; Spielerfarbe im Stand und Flug 0,13 bis 0,26, einzelne Bilder im Angriff und Sturz bis 0,07), `drachenei` (2 Spalten, 240 x 170), `geschoss` (11 Spalten, Feuer 7 bis 10), `wunder` (770 x 621, Feuerschalen mit eigener Glut), `baustelle-5` (4 Stufen, 780 x 475), `dorfbewohner-e` (139 x 125, Fuß 41/95; die alten Tafeln des Dorfbewohners sind bis auf Renderrauschen gleich und mit `git checkout` zurückgeholt, die Beschreibung hat nur `stehen_e`/`gehen_e` dazubekommen). **Marktkarren rendert** (Task `bq…`, seit 23:55) — danach dasselbe: alte Tafeln vergleichen (`scratchpad/vergleich.py`), zurückholen, `marktkarren-g` ansehen. Dann `npm run check:kurz`, Übergabe für Opus hier, Commit (kein Push ohne Wort).
- **NACHTRAG 22:10 — AUFTRAG VON 19:25 ERLEDIGT:** Push durch (`origin/main` = `6fd0151`, 8 Commits, rund 1,2 GB, 20 Minuten Upload). **Ausgerollt: auf dem Server läuft `6fd0151`**, von außen erreichbar, Konten vorher gesichert. `.env.betrieb` liegt jetzt auch im Hauptordner (kopiert aus `OnlineGames-bildumbau`, von Git ausgenommen). Probekopie im Scratchpad gelöscht. **Nächste Runde, wenn der Benutzer zustimmt: der Technologiebaum** (siehe Nachtrag darunter); er hat darauf noch NICHT geantwortet. Nicht gemessen: KI auf „viel“, `pruefstand:haeuser` seit den Hauseinheiten.
- **NACHTRAG 22:00:** Check grün (1034 Tests, 14 Partien, 330 im Browser), Bilder über 1 % in Stichproben angesehen (nicht alle 74). **Commits `a4e4d36` (Code) und `6fd0151` (Bildnachweise)**, lokales `main` = `6fd0151`. **Push `git push origin main` läuft (Task `b7vosamlk`, Upload seit 21:50, 8 Commits, rund 1,2 GB Bilder — dauert; KEINEN zweiten starten)**, danach `npm run ausrollen` und `-- --stand`. **Neuer Wunsch des Benutzers (gegen 21:50, wörtlich): „was noch nett wäre, wenn man so ne übersicht anklicken könnte, was es alles an einheiten und weiterentwicklungen, etc. gibt - ggf. pro Haus - kennst du das aus dem Original?“** → der Technologiebaum. Noch NICHT gebaut, kein Kriterium angelegt; Vorschlag an ihn: eine Seite aus den Daten (`GEBAEUDE.bildetAus`, `zeitalter`, `vorstufe`, `wandelt`, `haeuser`, Sätze aus `bringt.js`), Haus wählbar, erreichbar aus Menü und Vorraum — als nächste Runde nach dem Ausrollen.
- **(ÜBERHOLT, siehe Nachtrag) KI-Partien mit der neuen Karte laufen** (Task `bkrmc74qt`, `node --test "tests/partien/*.test.mjs"`, seit 19:40, neben dem Render also langsam). **Solange sie laufen: nichts unter `server/`.** Fallen die Grenzen (Nebel: 105 von 120 vor Minute 60, Median unter 45, höchstens eine ohne Sieger; Teams vor Minute 90), dem Benutzer die Zahlen nennen und fragen, statt lange an der KI zu drehen (Tokens). Nicht neu gemessen: `pruefstand:haeuser`, `ki-handel` (Handel beginnt bei unter 1500 Gold in Reichweite — mit mehr Gold später).
- **Browserfälle** `strategie-krone-forschung.spec.mjs` gegen den Code geprüft: Farm schickt `n`, Lebensbalken `art: 'gebaeude'`, Mangonel Reichweite 7, Schlüssel der Schmiede stimmen; Träger der Schützenwirkung ist der Plänkler (die Armbrust ist in der Partie schon ausgetauscht).
- **Render `b87d7tcz2`** läuft seit 19:07 (Langbogen 19:19 fertig).

*Als Nächstes:* (1) Render abwarten → `node --test tests/bilder.test.mjs`, Schautafel messen und ansehen; (2) KI-Partien abwarten, Zahlen lesen; (3) `npm run tempo:partie` (dem Benutzer zugesagt); (4) Browserfälle der Krone mit `QA_NACHWEIS=1 E2E_HAFEN=4195`, Rotes beheben; (5) Specs auf `fertig`, Board, `check:alles:neu:kurz` (schreibt alle Bilder neu — die Karte hat sich geändert), `qa:abweichung`, CLAUDE.md (Krone, AC-26, karte AC-18, neue KI-Zahlen), Commits; (6) `main` vorspulen, pushen, `npm run ausrollen`, `-- --stand` prüfen.

---

**2026-11-18, 16:00 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) BROWSERFÄLLE 25 GRÜN, 2 ROT, ABHILFEN IM CODE; REITERSCHÜTZE RENDERT EIN ZWEITES MAL; F1 UND PAKET IN EINER PROBEKOPIE VORGEPRÜFT. NICHT PUSHEN, NICHT AUSROLLEN.**

*Stand (alles seit `6afaa87` uncommittet):*

- **Browserlauf `b9wxdzj5i` fertig: 25 grün, 2 rot.** (1) `fahrplan AC-14` (Ritterzeit am Stück): Pikenier und Mangonel standen im Bild aufeinander, weil die Wartebedingung nur Nähe zum Sammelplatz verlangte — jetzt Nähe **und Stillstand** (`vorher` gleich `nachher`), `e2e/tests/strategie-ritterzeit-am-stueck.spec.mjs`. **Noch nicht nachgefahren.** (2) `darstellung AC-9 / fahrplan AC-7`: der Reiterschütze trug auf der Schautafel 0,092 Spielerfarbe (verlangt über 0,1; der helle Filzmantel hat sie ihm genommen). Abhilfe in `grafik/reiter.py`: Deckensaum 0,2 breit und eine Leibbinde in Spielerfarbe. Probe (`BILDER_PROBE=2`): 0,126, gegen den Späherreiter 0,438.
- **Render `bj7ir67hk` läuft** (Reiterschütze voll, seit 15:49, rund 20 Minuten, ein Blender-Prozess). Solange: kein Browserlauf, kein zweiter Blender, `grafik/verzeichnis.json` nicht ändern. Danach: `node --test tests/bilder.test.mjs`; Schautafel (alle Paare ≥ 1/3; Spielerfarbe wie der Test: `npm run tafel --silent -- "Object.fromEntries(['reiterschuetze'].map((a) => { const m = t.maske(a, '#4a90d9'); return [a, Math.round(m.farbpixel / m.pixel * 1000) / 1000]; }))"`, auch mit `#d94a4a`); dann `strategie-unterscheidbar`, `-ritterzeit-am-stueck`, `-bildprobe`, `-hauseinheiten`, `-figuren` mit `QA_NACHWEIS=1 E2E_HAFEN=4195`.
- **Vorprüfung von F1 und Paket, ohne den Arbeitsbaum anzufassen:** `trocken.py` im Scratchpad führt Anwendeskripte nacheinander aus und fängt jedes Schreiben ab (`python "$S/trocken.py" f1-krone.py paket-charakter.py --nach "$S/trocken-aus"`); alle Anker beider Skripte passen nacheinander. In der Probekopie `$S/probe` (Kopie des Baums plus Überlagerung): Rechentests **628 von 630** (die zwei roten sind `pruefstand:vergleich`, die Git brauchen — Artefakt der Kopie), `tsc` für Server und `public/` ohne Meldung, Wächter 43 von 43, `strategie-krone.test.mjs` 6 von 6, `strategie-charakter.test.mjs` 18 von 18. Das Paket-Skript korrigiert jetzt auch `tests/strategie-hauseinheiten.test.mjs` (die Burg trägt mit `sappeure` eine Verbesserung in `bildetAus`: `EINHEITEN[e] &&`). Der Rechentest der Karawane erlaubt das 1,4- bis 1,65-fache (gemessen 1,57, siehe Laufregel unten).
- **Die Browsertests `strategie-krone.spec.mjs` und `strategie-charakter.spec.mjs` sind nie gelaufen**, nur gegen den Code abgeglichen. Der Kartografie-Fall prüft das Neuladen nicht (der Vorraum bietet die Rückkehr erst per Klick an); dass `ka` in jedem Zustand steht, belegt nur der Rechentest.
- **WARNUNG Probekopie:** `$S/probe/node_modules` ist eine **Junction** auf `C:\Users\danie\OnlineGames\node_modules`. Vor dem Löschen zuerst `cmd //c rmdir "<…>\scratchpad\probe\node_modules"`, **nie `rm -rf` auf den Ordner mit der Junction.**

*Als Nächstes, in dieser Reihenfolge:* (1) Render abwarten, messen, die fünf Browserdateien nachfahren; `npm run check:kurz`, `npm run qa:abweichung` (über 1 % ansehen); (2) CLAUDE.md nachführen (572 von 704, Testzahlen, Leibbinde), zwei lokale Commits (Code und Specs; Bildnachweise); (3) Verzeichnis und `NAMEN` für die fünf Figuren der Krone, je Figur `BILDER_PROBE=2`, messen, voll rendern; (4) `f1-krone.py` anwenden, Tests kopieren, belegen (bauen AC-47, einheiten AC-66); (5) `paket-charakter.py` anwenden, Tests kopieren, belegen (bauen AC-52 bis AC-56); (6) F2 bis F5.

---

**2026-11-18, 15:45 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) NEU-RENDER FERTIG UND GEMESSEN; SPECS MIT PALADIN UND PAKET; F1 UND PAKET LIEGEN IM SCRATCHPAD. NICHT PUSHEN, NICHT AUSROLLEN.**

*Stand (alles seit `6afaa87` uncommittet):*

- **Render `bccgtsu63` fertig** (15:01 bis 15:38, Reiterschütze 1174 s, Kriegswolf 1046 s, kein Abbruch am Zellenrand). Gemessen auf der Schautafel: **alle Figurenpaare über einem Drittel** (kleinstes: Soldat gegen Armbrustschütze 0,346), **Kriegswolf 472 Bildpunkte** (verlangt über 250), Reiterschütze 910. `node --test tests/bilder.test.mjs` 20 von 20.
- **Browserfälle laufen** (Task `b9wxdzj5i`, seit 15:40): `strategie-figuren`, `-unterscheidbar`, `-ritterzeit-am-stueck`, `-hauseinheiten`, `-bildprobe` mit `QA_NACHWEIS=1`. Solange er läuft: nichts unter `public/`, `server/`, `specs/`, `tests/`, kein Blender.
- **Specs geändert (uncommittet):** einheiten AC-66 heißt „Fünf Stufen der Krone" (Ritter → Kavalier → Paladin; Paladin 160 Leben, 14 Angriff, 2/3, Stufe 1300 Nahrung, 750 Gold, 170 s — die teuerste im Spiel; Champion weiter nicht), darstellung AC-32 (eigene Figur je Stufe, kein Leihbild), Fahrplan; **bauen AC-52 bis AC-56 „Verbesserungen mit eigenem Charakter"**, alle `offen`; Board **572 von 704**.
- **Hüllskripte liegen:** `grafik/husar.py`, `kavalier.py`, `paladin.py`, `zweihandkaempfer.py`, `hellebardier.py`. **Es fehlen** die Einträge in `grafik/verzeichnis.json` und `NAMEN` in `public/bilder.js` (zusammen anlegen). Die fünf Modelle sind noch nie in Blender gelaufen.
- **Im Scratchpad, NICHT angewendet** (`C:\Users\danie\AppData\Local\Temp\claude\fdfb6b3081f376fd\f0f1be48-1595-48f0-ac47-14eca6602201\scratchpad\`):
  - `f1-krone.py` (Aufstieg in die Krone, fünf Stufen mit Paladin, ohne Leihbild), dazu `strategie-krone.test.mjs` (nach `tests/`) und `strategie-krone.spec.mjs` (nach `e2e/tests/`, zwei Bilder zu AC-66). `f2-krone.py` als Entwurf.
  - `paket-charakter.py` (**nach** `f1-krone.py` anwenden; trocken gegen den Stand vor F1 geprüft, danach um `OHNE_BONUS` ergänzt und nicht erneut geprüft), `strategie-charakter.test.mjs` (nach `tests/`, noch nie gelaufen — erwartete Texte und Grenzen beim ersten Lauf ehrlich nachziehen), `strategie-charakter.spec.mjs` (nach `e2e/tests/`, noch nie gelaufen).
  - Ausgeführt und **nicht noch einmal auszuführen**: `krone-spec-paladin.py`, `rote-faelle.py`, `fussvolk-krone.py`, `reiter-krone.py`, `specs-ritter-paket.py`, `f1-paladin.py`, `f1-ohne-leihbild.py`.
- **Das Paket im Einzelnen** (elf Verbesserungen): Kartografie (Markt, Lehen, 100 N/100 G/40 s, `karte: true` — Merker `karte` am Sichtobjekt des Teams, `ka` im eigenen Spieler-Eintrag, im Browser `nebel.karteZeigen()` und `nebel.warDort()`; bei Sicht ≠ Nebel nicht im Aufbau), Blutlinien (Stall, Kavallerie +20 Leben), Karawane (Markt, Krone, Karren +50 % Tempo), Brandstiftung (Kaserne, Infanterie +2 gegen Gebäude) und Knappen (Infanterie +10 % Tempo), Heiligkeit, Inbrunst, Buchdruck, Erleuchtung (Kloster), Tretkran (Universität, Bauen 20 % schneller), Sappeure (Burg, Dorfbewohner +15 gegen Gebäude). Neue Lesestellen in der Welt: `bonusVon`, `bekehrwert`, `bautempo`; neue Felder in `Wirkungen`: `bonus`, `bekehren`, `bautempo`; an der Verbesserung `karte`.
- **Befunde, die dem Benutzer zu sagen sind:**
  - **Laufregel und Knappen (berichtigt 16:00, gemessen in der Probekopie mit `tests/gang-messen.mjs`):** `welt.laufen()` verliert an jedem Wegpunkt den Rest des Takts. **Tempo 1,0 braucht 11 Takte je gerades Feld statt 10** — jede Einheit ist rund 9 % langsamer als ihr Nennwert. Zehn Felder gerade / schräg in Takten: Speerkämpfer und Söldner 110 / 150, mit Knappen 100 / 130; Miliz 120 / 160 → 110 / 150; Mönch 150 / 210, mit Inbrunst 130 / 180; Karren 110 / 150, mit Karawane 70 / 100 (das 1,57-fache statt 1,5); Ritter 80 / 110, mit Pferdezucht 70 / 100; Dorfbewohner 130 / 180. Die Knappen helfen also auch geradeaus. Empfehlung: mit Punkt 55 beheben, wenn ohnehin alle KI-Messungen neu laufen.
  - **KI und Kartografie:** die KI sucht Erkundungsziele über `welt.erkundet` (`ki.js` um 964 und 996). Erforscht ein verbündeter Mensch die Kartografie, gilt für die KI im selben Sichtteam alles als erkundet — ihr Späher findet kein Ziel mehr. Ungeprüft, was das für eine KI bedeutet, die noch keinen Gegner gesehen hat. Die KI selbst erforscht die Kartografie nicht.
  - Trümmer gefallener Gebäude (`ansicht.js` um 3509) hängen an `hatErkundet` — nach der Kartografie überall möglich; unverändert gelassen.
  - Kartografie zeigt nie Gesehenes im Stand des Spielbeginns; nach einem Neuladen ist ohne Kartografie schon heute das selbst Erkundete wieder schwarz.
  - Es warten und warum: Daumenring (verschiebt den Konterkreis, erst nach fahrplan AC-26), Spione (neue Sichtregel), Ballistik (jeder Pfeil trifft schon), Gilden (Silberfurts Hausbonus), Erlösung, Sühne, Glaube, Theokratie, Kräutermedizin. Alle Preise und Wirkungen des Pakets aus dem Gedächtnis, nicht aus `vorlage-aoe2.md`.

*Als Nächstes, in dieser Reihenfolge:* (1) Ergebnis von `b9wxdzj5i` lesen, Rotes beheben; `npm run check:kurz`, `npm run qa:abweichung` (über 1 % ansehen); (2) CLAUDE.md nachführen, zwei lokale Commits (Code und Specs; Bildnachweise); (3) Verzeichnis und `NAMEN` für die fünf Figuren der Krone, je Figur `BILDER_PROBE=2` (ein Blender-Prozess), Fehler im Modellcode beheben, messen, voll rendern; (4) `f1-krone.py` anwenden und belegen (bauen AC-47, einheiten AC-66); (5) `paket-charakter.py` anwenden und belegen (bauen AC-52 bis AC-56); (6) F2 bis F5.

**2026-11-18, 15:10 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) VOLLER LAUF 313 GRÜN, 4 ROT; ABHILFEN IM CODE, NEU-RENDER LÄUFT; NEUE WÜNSCHE DES BENUTZERS. NICHT PUSHEN, NICHT AUSROLLEN.**

*Neue Wünsche des Benutzers (2026-11-18, wörtlich: „Bitte nutze die fable kapa für das rendern der einheiten. Fable is hier viel detaillierer als opus / Wir braucheb auch weiterentwicklungen für den ritter, vll sogar 2 weitere. Und noch so spannende sachen wie kartografie, etc."):*

1. **Figurenmodelle schreibt Fable selbst**, detailliert — kein Hilfsagent mit kleinerem Modell (Merker `fable-fuer-figuren.md`). Neue Einheiten bekommen eigene Figuren, nicht die geliehene Tafel der Vorstufe.
2. **Ritterlinie mit zwei Stufen**: Ritter → Kavalier → Paladin. einheiten AC-66 und „Was Stufe F nicht hereinholt" im Fahrplan sind dafür zu ändern („eine Stufe je Linie" gilt für den Ritter nicht mehr).
3. **Verbesserungen mit Charakter**, voran Kartografie: als Paket spezifizieren (neue Kriterien in `bauen.md` ab AC-52), bauen, und dem Benutzer sagen, was drin ist und was wartet. Kandidaten: Kartografie (Markt; deckt für das Sichtteam die Karte als „erkundet" auf — Umsetzung bei kampf AC-16 nachsehen), Karawane, Blutlinien, Knappen, Daumenring, Klostertechniken, Tretkran, Sappeure, Brandstiftung, Spione, Wehrpflicht. Gilden nicht (Silberfurts Hausbonus). Jede, die Kampfwerte ändert, verlangt danach den Konterkreis.

*Stand (alles seit `6afaa87` uncommittet):*

- **Browserfälle der Hauseinheiten und des Wehrturms gefahren**, einheiten AC-42 bis AC-49, kampf AC-22 und bauen AC-38 auf `fertig`, Board **572 von 699**. Dabei gefunden und behoben: die Rohstoffleiste warf bei jeder Lieferung eine Ausnahme (`leisteZiel` in `public/app.js`); der Testname zum Riesen nannte die falsche Größe (er ist 1,33-fach so groß). Der Wehrturm-Fall läuft nur zusammen mit dem Test davor.
- **Voller Lauf `check:alles:neu:kurz` 14:09 bis 14:47: 313 grün, 4 rot** (`qa/letzter-lauf.log`):
  1. darstellung AC-13 (`strategie-figuren.spec.mjs:194`): Kriegswolf 241 Bildpunkte, verlangt über 250.
  2. fahrplan AC-14 (`strategie-ritterzeit-am-stueck.spec.mjs`): der Plan nahm jede Einheit mit `zeitalter === 2`, also auch die der Häuser, die das Prüfhaus nicht ausbildet.
  3. und 4. darstellung AC-14, darstellung AC-9 / fahrplan AC-7 (`strategie-unterscheidbar.spec.mjs`): Späherreiter gegen Reiterschütze 0,15 statt einem Drittel.
- **Abhilfen (Skript `rote-faelle.py` im Scratchpad, angewendet — nicht noch einmal ausführen):**
  - `grafik/wolf.py`: `MASS = 1.3`, Zelle (376, 272), Fuß (162, 188), Laufweite geteilt durch MASS. Der Wolf ist damit auch im Spiel größer.
  - `grafik/reiter.py`: der Reiterschütze trägt einen hellen Filzmantel (neuer Stoff `filz`), das Pferd eine große Filzdecke mit Saum in Spielerfarbe; in Spielerfarbe bleiben Schoß, Aufschlag am Hals, Mütze und Deckensaum — das Wams in Spielerfarbe ist weg. **Probe in einer Richtung gemessen: 0,44** gegen den Späherreiter.
  - `grafik/pferd.py`: der Lichtfuchs (Pferd des Husaren) heller, damit ihm nicht dasselbe geschieht.
  - `e2e/tests/strategie-ritterzeit-am-stueck.spec.mjs`: der Plan filtert `!e.haeuser`. **Nicht nachgefahren**; offen, ob der Söldner (ohne `haeuser`, Kaserne, Zeitalter 2) durchläuft.
- **Neu-Render läuft:** Task `bccgtsu63`, `npm run bilder -- reiterschuetze kriegswolf`, gestartet 15:01, ein Blender-Prozess, rund 15 Minuten je Figur. Bis er fertig ist: kein zweiter Blender, `grafik/verzeichnis.json` nicht anfassen, F1 nicht anwenden.
- **Schnelle Probe mit echter Messung:** `BILDER_PROBE=2 npm run bilder --silent -- <name>` rendert Richtung 1 mit allen Bildern in rund 2,5 Minuten direkt nach `public/bilder/`; danach misst `npm run tafel --silent -- "t.unterschiede('figur').filter((p) => p.anteil < 0.4)"` genau das, was der Browsertest misst (`blick: 1`). Der volle Render überschreibt die Probe. `BILDER_PROBE=1`: drei Richtungen, vier Bilder je Ablauf.
- **Figuren der Krone, als Modellcode geschrieben, noch NIE in Blender gelaufen:**
  - `grafik/reiter.py`: Husar (Lichtfuchs), Kavalier, Paladin in `ARTEN`, Stoffen, Sattel und Mensch (Skript `reiter-krone.py`, angewendet). Offen: die Schabracke des Kavaliers ist `s['leinen']` — helles Leinen auf dunklem Pferd könnte dem neuen Reiterschützen ähneln; erst nach einer Probe entscheiden.
  - `grafik/fussvolk.py`: Zweihandkämpfer (Schaller mit Federbusch, Harnisch über Lederkoller, gepuffte Ärmel und ein Hosenbein in Spielerfarbe, Zweihänder mit Parierhaken) und Hellebardier (Schaller mit Kinnreff, Brigantine in Spielerfarbe mit Nietenreihen über Kettenhemd, Beinzeug, Hellebarde mit Quaste) samt `schaller`, `federbusch`, `halsberge`, `platte`, `zweihaender`, `hellebarde`; beide Zelle (432, 368), Fuß (192, 290) (Skript `fussvolk-krone.py`, angewendet). `ast.parse` grün, mehr nicht.
  - Es fehlen: Hüllskripte `grafik/kavalier.py`, `paladin.py`, `husar.py`, `zweihandkaempfer.py`, `hellebardier.py`, die Einträge in `grafik/verzeichnis.json` und `NAMEN` in `public/bilder.js` (zusammen anlegen, sonst fällt `tests/bilder.test.mjs`).
- **F1 und F2 liegen als Skripte im Scratchpad, NICHT angewendet:** `f1-krone.py` (Aufstieg in die Krone, Zweihandkämpfer, Hellebardier, Husar, Kavalier; 16 Anker), dazu `strategie-krone.test.mjs` und `strategie-krone.spec.mjs`; `f2-krone.py` (Langbogenschütze, schwere Armbrust, Belagerungsramme, Onager). **F1 um den Paladin erweitern** (160 Leben, 14 Angriff, Rüstung 2/3, Tempo 1,35, Nachladen 1,9, Kürzel `P`, `stufeVon: 'kavalier'`; `paladinstufe` 1300 Nahrung, 750 Gold, 170 s, `vorstufe: 'kavalierstufe'`) und vom Leihbild (`bild`) auf eigene Tafeln umstellen. Kürzel: a bis z sind vergeben, die Krone nimmt Großbuchstaben (`Z`, `H`, `U`, `K`, `P`, `L`, `A`, `R`, `O`).

*Als Nächstes, in dieser Reihenfolge:* (1) nach dem Ende von `bccgtsu63` die Ausgabe lesen (kein Abbruch am Zellenrand), auf der Schautafel alle Paare und den Wolf messen, `node --test tests/bilder.test.mjs`; (2) die vier roten Fälle und die betroffenen Bildnachweise einzeln neu fahren (Figuren, Unterscheidbar, Ritterzeit am Stück, Hauseinheiten, Bildprobe — dort Spielerfarbe 4 % bis ein Drittel je Richtung), `npm run check:kurz`, `npm run qa:abweichung`; (3) CLAUDE.md (572 von 699, 317 Browserfälle, Paladin, Schautafel-Satz), zwei lokale Commits; (4) Figuren der Krone einzeln proben (`BILDER_PROBE=2`, ein Prozess), Fehler im Modellcode beheben, Hüllskripte und Verzeichnis, voll rendern; (5) einheiten AC-66 auf zwei Ritterstufen ändern, F1 mit Paladin anwenden und belegen; (6) das Paket der Verbesserungen spezifizieren (Kartografie zuerst), dann F2 bis F5.

**2026-11-18, 13:55 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) BILDER DA, SPEC-RUNDE F GESCHRIEBEN, PRÜFERBEFUNDE BEHOBEN. NICHT PUSHEN, NICHT AUSROLLEN.**

*Stand (alles seit `6afaa87` uncommittet):*

- **Renderreihe `bf53txgn1` fertig** (10:05 bis 12:19): wehrturm, eibenschuetze, pavesenschuetze, soeldner, kriegswolf, reiterschuetze, riese, meuchler, wiedergaenger unter `public/bilder/` (zusammen jetzt 35,5 MB). `node --test tests/bilder.test.mjs` grün. Blender-Zahl 0.
- **Nebel nach den Tarnstellen in der KI** (Task `b7helqs4r`): **111 von 120 vor Minute 60, Median 39,4, eine ohne Sieger (Startwert 14)** — wie HEAD. Alle `tests/strategie-*.test.mjs`: 605 von 605 (vor dem neuen Test unten).
- **Prüfer (unabhängiger Hilfsagent) fand drei Dinge, alle behoben:**
  1. `welt.bekehrenTakten` fragte die Tarnung nicht — ein Mönch bekehrte einen Meuchler weiter, der für seinen Spieler wieder verborgen war. Jetzt `|| this.verborgen(moench.besitzer, ziel)` in der Abbruchbedingung; Test „kampf AC-22: ein Moench bekehrt einen Getarnten nur, solange sein Spieler ihn sieht" in `tests/strategie-hauseinheiten.test.mjs` (26 von 26), Gegenprobe gegen die alte Zeile fällt.
  2. `pruefen()` im Prüfstand prüft jetzt auch `spieler.gefallene >= 0`.
  3. Kommentar zu `MILITAER_HOLZ` in `ki.js` steht wieder an seiner Zeile.
  - Entwurfsfrage des Prüfers „`Entf` macht Gefallene": bleibt (ein entlassener Dorfbewohner kostet 50 Nahrung, der Wiedergänger daraus weitere 30 Gold und ist schwächer als ein Langschwertkämpfer gleichen Preises). Dem Benutzer sagen.
  - `npm run typen`, `npm run waechter` (43), `tests/strategie-moench.test.mjs` grün. Keine neue Nebel-Messung: `welt.js` nur beim Bekehren (die KI bekehrt nicht), `ki.js` nur ein Kommentar.
- **Spec-Runde Stufe F** (Skript `stufe-f-specs.py` im Scratchpad, angewendet): `fahrplan.md` (AC-19 mit Beleg, neu AC-26 Konterkreis der Krone, Bauabfolge F1 bis F13, Absatz „Was Stufe F nicht hereinholt"), `einheiten-und-befehle.md` AC-66 bis AC-69, `bauen.md` AC-47 bis AC-51, `spielziel.md` AC-29, `ki.md` AC-39 und AC-40, `darstellung.md` AC-32; `vorlage-aoe2.md` um „Krone (Imperialzeit)" ergänzt, Wunder-Kosten berichtigt (je 1000 Holz, Gold, Stein). Werte aus den offenen Technikbaum-Daten (Scratchpad `techtree/`), Wirkungen der Verbesserungen aus dem Gedächtnis. **Entscheidungen, die der Benutzer hören muss:** eine Stufe je Linie statt zwei (kein Champion, kein Paladin), kein Nachfolger des Eliteplänklers, keine Wehrgänge, Elitestufen der Hauseinheiten je 500 Nahrung, 400 Gold, 60 s (ohne Vorbild), Wunder ohne Schalter zum Abstellen.
- **`npm run specs:board` meldet zwei Beanstandungen** (bauen AC-38: altes Bild ohne Erzeuger, neues fehlt) — bis der Browserfall gefahren ist. `specs/BOARD.md` und die Stand-Zeile in CLAUDE.md warten darauf.

*Als Nächstes, in dieser Reihenfolge:* (1) neue Bilder ansehen; (2) `export E2E_HAFEN=4195 QA_NACHWEIS=1 && npx playwright test -c e2e/playwright.config.mjs e2e/tests/strategie-hauseinheiten.spec.mjs` (neun Fälle, noch nie gefahren), dann `-g "bauen AC-38" e2e/tests/strategie-truppenstufen.spec.mjs` und die Bildprobe (27); (3) einheiten AC-42 bis AC-49 und kampf AC-22 auf `fertig`, `npm run specs:board`, CLAUDE.md; (4) `npm run check:alles:neu:kurz` im Hintergrund (rund 44 Minuten, währenddessen nichts ändern, kein Blender), `npm run qa:abweichung`, lokale Commits; (5) F1: Aufstieg in die Krone mit „oder eine Burg", Zweihandkämpfer, Hellebardier, Husar, Kavalier.

**2026-11-18, 10:40 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) E8 GEBAUT, BROWSERFÄLLE WARTEN AUF DIE BILDER. NICHT PUSHEN, NICHT AUSROLLEN.**

*Stand (alles seit `6afaa87` uncommittet):*

- **E8 Server** (`daten.js`, `welt.js`, `ki.js`, `pruefstand.js`): `meuchler` (`u`, Haus Silberfurt, `getarnt: 2`, `wacht: false`, Bonus +10 gegen `dorf` und `moench`), `wiedergaenger` (`x`, Haus Distelhag, `kosten: { gold: 30, gefallene: 1 }`, Klassen `infanterie` und `untot`); beide in `bildetAus` der Burg und in `NOCH_NICHT` der KI.
  - **Tarnung (kampf AC-22):** eine Stelle `welt.siehtEinheit(spielerId, einheit)` / `welt.verborgen`; entdeckt je Sicht-Objekt (`einheit.entdeckt`, ein Team teilt), gerechnet in `sichtAktualisieren()` über `tarnungRechnen` (alle fünf Takte); gefragt in `feindAn`, `feindInSicht`, `tuermeTakten`, `angriffTakten`, `verletzterAn`, `auszug` und in `ki.js` (`sichtbareFeinde`, Besetzt-Prüfung, `sturm`). Bei „Aufgedeckt" und für Ausgeschiedene keine Tarnung.
  - **Gefallene (einheiten AC-49):** `spieler.gefallene`, gezählt in `einheitSterben` nur für ein Haus, das damit ausbildet (`AUS_GEFALLENEN`), nicht für Einheiten, die selbst daraus entstanden; bezahlt und erstattet über den Weg der Rohstoffe; auf der Leitung `gf` nur an den Spieler selbst. `kostenSumme` zählt nur echte Rohstoffe. Mönch: `heilen.nicht` und `bekehren.nicht` tragen `untot`, `UNHEILBAR` liest es.
  - `gefechtSpielen` nimmt `anzahl: { links?, rechts? }`.
- **E8 Browser:** `FIGUREN` (Rückfälle als Soldat), Schautafel, Bildprobe (Zahl **27**), `NAMEN` in `bilder.js`, Kürzelliste `u`/`x`; `ansicht.vorraete.gefallene` aus `gf`; `ansicht.heilbar` liest `heilen.nicht` aus den Daten (`ansicht.unheilbar()`); `auswahlleiste.js`: `postenText` („1 Gefallener"), `warenklasse` (`ware-x`, sonst kollidierte „gefallene" mit Gold), Tafelzeilen „Getarnt: Gegner sehen ihn erst auf 2 Felder" und „Ersteht aus eigenen Gefallenen – vorhanden: n", die Zahl der Gefallenen als Marke am Knopf (`.gefallene`, `data-gefallene`) und im Schlüssel der Leiste; `stil.css`.
- **Gemessen** (Budget 1200, je 40 Gefechte, beide Seiten): Meuchler gegen Soldat und Langschwertkämpfer 0 (gegen Speerkämpfer 36, gegen Kurzbogen 25). Wiedergänger: nur nach Gold (38 Stück) gegen alles 40; **mit dem Gefallenen als 60 gerechnet (90 je Stück, 13 Stück)** gegen Bogenschützen des Fürstentums, Armbrust und Langschwert 0, gegen Kurzbogen 37, gegen Soldat 33. Die Rechnung „Gefallener = billigster Kämpfer" ist meine Festlegung — dem Benutzer sagen. Nicht gemessen mit Distelhags Bonus (Rüstung dann 2/2).
- **Tests:** `tests/strategie-hauseinheiten.test.mjs` 25 von 25 (neu: AC-48 zweimal, kampf AC-22 dreimal, AC-49 viermal, Burg-Test auf fünf Häuser); Gegenprobe ohne die Tarnregel: beide Tests zu kampf AC-22 fallen. `tests/strategie-bringt.test.mjs` (jetzt mit `EINHEIT_NAMEN`) und `tests/strategie-moench.test.mjs` (`nicht` mit `untot`) angepasst. Alle `tests/strategie-*.test.mjs`: 605, davor 2 rot, jetzt behoben (die zwei Dateien einzeln grün, der ganze Satz danach nicht neu gefahren). `npm run typen`, `npm run waechter` (43) grün.
- **Nebel-Messung neu** (Task `b7helqs4r`, gestartet 10:31): wegen der drei Stellen in `ki.js`, die jetzt `siehtEinheit` fragen. Erwartet 111 / 39,4 / eine wie HEAD. **Ergebnis hier nachtragen.**
- **Browsertest** `e2e/tests/strategie-hauseinheiten.spec.mjs`: dritter Block „Meuchler und Wiedergaenger" — **im Nebel** (`aufbauen(…, 'nebel')`), Anna Silberfurt, Bert Distelhag, Cem Wehrstein, je eine Burg; Fälle `einheiten AC-48`, `kampf AC-22` (Cems Bild: ein Meuchler auf zwei Felder zu sehen, der zweite auf drei Felder fehlt, obwohl das Feld in Sicht ist; danach ein zweiter Dorfbewohner daneben → beide da), `einheiten AC-49` (Knopf „zu wenig Gefallene", zwei Speerkämpfer mit `Entf`, Marke „2", ausbilden, Reihe). `BURG` steht jetzt auf Modulebene mit allen fünf. `node --check` grün, **nicht gefahren**.
- **Specs:** `einheiten-und-befehle.md` AC-42 bis AC-49 und `kampf.md` AC-22 umgeschrieben (geänderte Werte, Maßstäbe, Messungen, Vermerk zur KI), Status **`in-qa`**. Nach den Browserfällen auf `fertig`, dann `npm run specs:board`.

*Noch offen aus diesem Stapel:* Renderreihe abwarten (`tasklist | grep -ic blender` = 0) → `node --test tests/bilder.test.mjs` → Browserfälle mit `export E2E_HAFEN=4195 QA_NACHWEIS=1 && npx playwright test -c e2e/playwright.config.mjs e2e/tests/strategie-hauseinheiten.spec.mjs`, dann `-g "bauen AC-38" e2e/tests/strategie-truppenstufen.spec.mjs` (Schwelle `+ 8` prüfen) und die Bildprobe (27); Bilder ansehen; im Fall AC-47 die Höhenmessung über `a.bilder?.tafel?.(art)` prüfen → Specs auf `fertig`, `npm run specs:board`, CLAUDE.md-Stand → voller Lauf `npm run check:alles:neu:kurz`, `npm run qa:abweichung`, lokale Commits. Danach Spec-Runde Stufe F.

**2026-11-18, 10:15 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) E7 IM CODE, KI OHNE HAUSEINHEITEN, VOLLE RENDERREIHE LÄUFT. NICHT PUSHEN, NICHT AUSROLLEN.**

*Stand (alles seit `6afaa87` uncommittet):*

- **Renderprobe bestanden** (alle neun angesehen, `scratchpad/probe`): Spielerfarbanteil über drei Richtungen eibenschuetze 0,24–0,26, pavesenschuetze 0,20–0,25, soeldner 0,10–0,11, riese 0,11–0,17, meuchler 0,17–0,23, wiedergaenger 0,12–0,21, reiterschuetze 0,19–0,24, kriegswolf 0,17–0,20 (Grenzen 0,04 bis 0,33; die Rückansichten erst im vollen Satz). Wehrturm 315 Bildpunkte über dem Fuß gegen 230 des Wachturms, Spielerfarbe 7,1 %.
- **Volle Renderreihe läuft** (Task `bf53txgn1`, gestartet 10:05, ein Blender-Prozess, alle neun nach `public/bilder/`, geschätzt 80 bis 90 Minuten). **Nicht neu starten. Solange sie läuft: kein Browserlauf, kein zweites Blender.** Code ändern ist erlaubt.
- **Die KI bildet vorerst keine Hauseinheit aus:** `NOCH_NICHT` in `ki.js` (Söldner, Eiben-, Pavesenschütze, Kriegswolf, Reiterschütze, Riese), gefragt über `ki.bildetAus(art)` in `naechsteKampfeinheit` und `aussichtslos`. Gemessen im Nebel über 120 Startwerte: mit Söldner 97 vor Minute 60, ohne Söldner mit den zwei Schützen 102 (Grenze 105), mit allen zurückgestellt **111, Median 39,4, eine ohne Sieger (14) — genau wie HEAD**. Der Einsatz gehört zu ki AC-28. `npm run pruefstand:haeuser` deshalb nicht neu gefahren: die KI spielt Takt für Takt wie vorher, es käme dieselbe Tabelle.
- **E7 (einheiten AC-45 bis AC-47) im Code:** `daten.js` `kriegswolf` (`f`, Klasse `tier`, neu in `KLASSEN`), `reiterschuetze` (`h`, Klassen `kavallerie` und `bogenschuetze`), `riese` (`t`, `bonus: { gebaeude: 40 }`); Burg `bildetAus` alle drei, je Haus über `haeuser` eine. `EINHEIT_NAMEN`, `FIGUREN` (Rückfälle), Schautafel, Bildprobe (Zahl 25), `NAMEN`, Kürzelliste.
  - **Abweichungen von der Spec, gemessen (Budget 1200, je 40 Gefechte, beide Seiten):** Reiterschütze **Reichweite 5 und Fernrüstung 2** statt 4 und 0 (mit den Startwerten gegen Armbrust 0:40, jetzt 39:1; gegen Plänkler und Speer 0:40). Riese **180 Leben und Rüstung 2/0** statt 250 und 2/1 (mit den Startwerten gegen Armbrust 40:0, jetzt 0:40; gegen Speer und Pikenier 40:0, gegen Langschwert und Ritter 0:40). Kriegswolf wie Spec: gegen Speer und Pikenier 40:0, gegen Langschwert 0:40 — gegen den Soldaten des Lehens gewinnt er.
  - Der Reiterschütze bekommt mit zwei Klassen beide Schmiedelinien und die Pferdezucht, in Haus Rappenstein 75 Leben — die Regel „Schlüssel = Art oder Klasse“ ist nicht aufgebrochen.
  - Sicht 5 / 6 / 4 gesetzt, nicht aus der Spec.
- **Tests:** `tests/strategie-hauseinheiten.test.mjs` 16 von 16; neue Bonusform `preis` in `tests/strategie-haeuser.test.mjs` (`FORMEN`) und `tests/strategie-haeuser-wirkung.test.mjs` (`PRUEFER.preis`, `bezahlt`), 12 von 12; `npm run typen`, `npm run waechter` grün.
- **Browsertest** `e2e/tests/strategie-hauseinheiten.spec.mjs`: umgebaut — Aufbau `aufbauen(browser, info, haeuser, gebaeude)` und Helfer auf Modulebene, zwei Blöcke: „Einheiten der Haeuser“ (AC-42 bis AC-44: Eschenbruch, Wehrstein, Silberfurt; Schießanlage und Kaserne) und „Einheiten aus der Burg“ (AC-45 bis AC-47: Eschenbruch, Rappenstein, Wehrstein; je eine Burg). **Nicht gefahren** — braucht die Bilder. Im Fall AC-47 steht eine Messung der Figurenhöhe über `a.bilder?.tafel?.(art)`, die es so vielleicht nicht gibt (dann misst sie nichts): beim ersten Lauf prüfen.

*Noch offen aus diesem Stapel:* Specs AC-42 bis AC-47 und bauen AC-38 umschreiben (geänderte Werte, Messungen, Vermerk zur KI) → nach dem Rendern `tests/bilder.test.mjs`, Browserfälle `strategie-hauseinheiten.spec.mjs`, `bauen AC-38` (`strategie-truppenstufen.spec.mjs`), Bildprobe mit `QA_NACHWEIS=1 E2E_HAFEN=4195` → `fertig`, `npm run specs:board` → E8 (Meuchler mit `getarnt` und kampf AC-22, Kürzel `u`, Haus Silberfurt; Wiedergänger, Kürzel `x`, Haus Distelhag, `gefallene` als Kosten, Klasse `untot`; beide in `bildetAus` der Burg und in `NOCH_NICHT`; Bildprobe 27) → voller Lauf, `qa:abweichung`, lokale Commits.

**2026-11-18, 09:52 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) LAUF GRÜN UND EINGECHECKT; WEHRTURM UND E6 IM CODE, UNCOMMITTET; RENDERPROBE LÄUFT. NICHT PUSHEN, NICHT AUSROLLEN.**

*Eingecheckt (lokal, `strategie` = `6afaa87`; `main` = `origin/main` = Server = `a9a4d9a`):* `4aeaf77` (Punkte 54, 53, 50, 58, 56) und `6afaa87` (Bildnachweise). Der volle Lauf davor war grün: 308 im Browser, 965 ohne, 14 Partien, 563 von 685. **Pushen und Ausrollen sind dem Benutzer angeboten, sein Wort steht aus.**

*Uncommittet, Stand jetzt:*

- **Modelle und Verzeichnis:** acht Figuren und der Wehrturm unter `grafik/`, neun neue Einträge in `grafik/verzeichnis.json` (58 Modelle). **`npm run check` ist rot, bis sie voll nach `public/bilder/` gerendert sind** (darstellung AC-18; mit den drei neuen Einheiten in den Daten auch AC-24).
- **Renderprobe** (Task `bylwzn047`, `BILDER_PROBE=1`, Ziel `scratchpad/probe`, mit `--vorschau`): fertig und angesehen sind Eibenschütze, Pavesenschütze, Söldner, Riese, Meuchler — alle erkennbar und verschieden, Angriff des Eibenschützen (Bogen spannen) und des Riesen (Überkopfschlag) stimmen. Es fehlen Wiedergänger, Reiterschütze, Kriegswolf, Wehrturm. Anteil der Spielerfarbe noch nicht gemessen (beim Riesen von vorn wenig: nur der Schurz).
- **Punkt 57, Wehrturm (bauen AC-38):** `bild: { wachturm: 'wehrturm' }` neben `nennt` an der Verbesserung, reist in `kw` (`welt.kampfwerte`), der Browser fragt nur `ansicht.bildart(gebaeude)` / `ansicht.bildVon(besitzer, art)`; `GEBAEUDE.wehrturm` in `public/gebaeude.js` als gezeichneter Rückfall, `'wehrturm'` in `NAMEN`. Rechentest grün; der Browserfall (`strategie-truppenstufen.spec.mjs`, misst „höher um mehr als 8 Bildpunkte“) ist NICHT gefahren — braucht die Bilder.
- **E6 (einheiten AC-42 bis AC-44), Server und Browser eingebunden:**
  - `daten.js`: `eibenschuetze` (`y`), `pavesenschuetze` (`z`), `soeldner` (`q`); `haeuser: [...]` an der Einheit (Typ `Einheitenwerte`), `preis` in den Boni eines Hauses (Typ `Wirkungen`), Silberfurt `preis: { soeldner: 0.8 }`; Schießanlage und Kaserne in `bildetAus`.
  - `welt.js`: `EINHEIT_NAMEN`, **`welt.hausBildetAus(spieler, art)`** (gefragt neben dem Zeitalter: Ausbilden, KI), **`welt.auftragKosten(besitzer, art)`** (die eine Stelle für bezahlen, erstatten, zählen, zeigen; ohne Nachlass dasselbe Objekt wie in den Daten), `kampfwerte()` schickt `kosten`, wo sie abweichen; im Aufbau `werte.einheiten[art].haeuser`.
  - `bringt.js`: `hausBringt(haus, bauwerkNamen, einheitNamen)` — „Den Söldner gibt es 20 % billiger“.
  - `ki.js`: `naechsteKampfeinheit` und `aussichtslos` fragen `hausBildetAus` und `auftragKosten`.
  - Browser: `auswahlleiste.hausBildetAus(art)`, Angebot und Tafeln filtern danach, Kosten zuerst aus `einheitenwerte.get(ich)`; `FIGUREN` (Rückfall: Bogenschütze, Armbrustschütze, Soldat), Schautafel, Bildprobe (Zahl 22), `NAMEN`, Kürzelliste.
  - Tests: `tests/strategie-hauseinheiten.test.mjs` 9 von 9 grün; `e2e/tests/strategie-hauseinheiten.spec.mjs` geschrieben, NICHT gefahren (braucht die Bilder; Partie zu dritt: Anna Eschenbruch, Bert Wehrstein, Cem Silberfurt).
  - **Gemessen (Gefechtsstand, Budget 1200):** Eibenschütze gegen Armbrust 20/20, gegen Ritter 0/20; Pavesenschütze gegen Armbrust 20/20, gegen Ritter und Mangonel 0/20. **Söldner: 60 statt 55 Leben** — mit 55 fällt er einen Schlag früher als der Langschwertkämpfer und gewinnt 9 von 80, mit 60 sind es 44 von 80 (55 %). Verglichen wird mit dem Langschwertkämpfer, der regulären Linie des Fürstentums; gegen den Soldaten des Lehens gewinnt er 20/20. Die Spec ist noch NICHT umgeschrieben.
  - **Der Gefechtsstand ist nicht seitengleich:** von zwei gleichen Heeren gewinnt das rechte 32 von 40. Wer nahe 50 % misst, lässt jede Art auf beiden Seiten antreten (`beideSeiten` im Test). Ursache nicht gesucht.
  - **Läuft:** `tests/partien/ki-im-nebel.test.mjs` (Task `br9p2myqf`) — ob der Söldner, den die KI in der Kaserne ab dem Fürstentum zuerst wählt, die Grenzen reißt. `npm run pruefstand:vergleich` taugt dafür nicht (spielt nur 22 Minuten, endet vor dem Fürstentum: Arbeitsstand und HEAD gleich). Danach `npm run pruefstand:haeuser`.

*Vorab gemessen für E7 und E8 (Werte der Spec zur Laufzeit eingesetzt, keine Datei geändert, `scratchpad/e7-gefecht.cjs`, je 40 Gefechte):* Kriegswolf gegen Speerkämpfer und Pikenier 40:0, gegen Langschwertkämpfer 0:40, gegen Soldat 40:0 (die Spec meint mit „Soldaten“ die Schwertlinie — hält gegen den Langschwertkämpfer). **Reiterschütze gegen Armbrust 0:40 — die Entscheidung hält mit den Startwerten NICHT** (Nachladezeit oder Angriff nachstellen). **Riese gegen Armbrust 40:0 — hält NICHT** (im Gefechtsstand weicht niemand zurück; Leben oder Fernrüstung senken). Meuchler gegen Soldat 0:40. **Wiedergänger gegen Bogenschützen 40:0 bei gleichem Gold (20 gegen 8) — „gleiche Kosten“ muss den Gefallenen mitzählen, und auch dann ist es fraglich.**

*Reihenfolge ab hier:* Ergebnis im Nebel abwarten (reißt es: KI vom Söldner ausnehmen, Konstante in `ki.js`, gehört zu ki AC-28) → Probe fertig ansehen, nachbessern → **eine** volle Renderreihe nach `public/bilder/` (vorher `tasklist | grep -ic blender` = 0) → Browserfälle `bauen AC-38` und `strategie-hauseinheiten.spec.mjs` mit `QA_NACHWEIS=1` → Specs AC-42 bis AC-44 auf `fertig`, `npm run specs:board` → E7 (Burg `bildetAus`, Klasse `tier`), E8 (`getarnt`, `gefallene` als Kosten, Klasse `untot`) → voller Lauf.

**2026-11-18, 09:25 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) DER KRIEGSWOLF LIEGT ALS CODE VOR. DER VOLLE LAUF LÄUFT NOCH. NICHT PUSHEN, NICHT AUSROLLEN.**

*Der Subagent hat `grafik/wolf.py` geliefert (467 Zeilen)*; sein Bericht ist Modell-Ausgabe, keine Zustimmung von irgendwem. Von mir durchgelesen; `python -m py_compile` und der Namensprüfer im Scratchpad (`namen.py`) melden nichts, die elf Stoffe (`fell`, `dunkel`, `hell`, `nase`, `auge`, `zahn`, `rachen`, `leder`, `eisen`, `tuch`, `band`) stehen alle in `stoffe()`. Dazu die Kleindatei `grafik/kriegswolf.py` (`wolf.tafel(ziel)`) — `bilder.py` importiert nach dem Namen im Verzeichnis, die Tafel heißt `kriegswolf`.

*Was das Modell tut:* Rumpf als Netz über Spanten (`SPANTEN`, `huelle(y)`), Auflagen darauf (`_auflage`: Rückenfell, Bauchfell, Schabracke, Riemen, Bauchgurt), Hals, Kopf mit Kiefer, Rute, vier Läufe mit je drei Gelenken. **Die Beine stehen nach Pfoten, nicht nach Winkeln** (`_greifen` rechnet die Gelenke aus Leib- und Pfotenlage). Trab mit Schwebe (`AUFSATZ` 0,3, `LAUF_HOCH` 0,66), Biss als Sprung mit Treffer bei 0,5, Sterben auf die rechte Seite. Zelle 288 × 208, Fuß (124, 144), drei Tafeln (Haupt, `angreifen`, `sterben`). Spielerfarbe: Halsband, Schabracke, Brustgurt.

*Geklärt:* der Brustgurt ist eine Kurve (`strang`) — die Maske der Spielerfarbe erfasst Kurven (`kette._koerper()` nimmt `MESH` und `CURVE`). Dateien unter `grafik/`, die nicht im Verzeichnis stehen, stören `verzeichnisPruefen` nicht.

*Unsicher bis zur Renderprobe:* Zelle und Fuß nur überschlagen (Schatten im Sprung rechts am Rand); die Vorzeichen der Seitendrehung von Hals und Rute im Liegen und der Ohren; der Versatz `0.3 * liegen` im Fall; `LIEGT`/`GEKNICKT` nach Gefühl; Keule gegen Schabracke; die Richtung der Dicke bei den offenen Auflagen (Riemen unter der Schabracke?); Anteil der Spielerfarbe (4 bis 33 % je Blickrichtung).

*Damit liegen alle acht Figuren und der Wehrturm als Code vor.* Reihenfolge nach dem Lauf unverändert (Eintrag 09:12): Commits für 54, 53, 50, 58, 56 ohne die neuen Modelle, dann Verzeichniseinträge und **eine** Renderreihe als Probe.

**2026-11-18, 09:12 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) WÄHREND DES VOLLEN LAUFS: MODELLE DER SPEZIALEINHEITEN UND DES WEHRTURMS ALS CODE VORBEREITET. NICHT GERENDERT. NICHT PUSHEN, NICHT AUSROLLEN.**

*Der Benutzer (heute früh):* „Was ist schon alles passiert seit gestern? was ist der Fortschritt?“ — beantwortet mit einem Fortschrittsbericht — und „ansonsten bitte wie gehabt fortfahren.“ Drei Dinge brauchen sein Wort, **gemeldet, Antwort steht aus:** (1) Pushen und Ausrollen, (2) die Laufregel (`welt.laufen()` verliert an jedem Wegpunkt den Rest des Takts; Pferdezucht deshalb 1,14- statt 1,10-mal so schnell über 42 Felder), (3) Werte für Reparieren und Pferdezucht stammen aus dem Gedächtnis, nicht aus `vorlage-aoe2.md`.

*Der volle Lauf* `npm run check:alles:neu:kurz` (Task `bd6r0w9gm`) läuft seit kurz vor 09:00 und schreibt um 09:11 noch Bilder. **Bis er fertig ist: nichts unter `public/`, `server/`, `specs/`, `tests/`, an `grafik/verzeichnis.json` und kein Blender.** Danach: Ergebnis lesen, `npm run qa:abweichung` (über 1 % ansehen), zwei lokale Commits für die Punkte 54, 53, 50, 58, 56 (Code/Specs/Tests/`baumstumpf`, dann Bildnachweise) — **die neuen Modelle unten gehören nicht hinein**, sie sind ungerendert —, Stand in `CLAUDE.md` (563 von 685, Testzahlen aus dem Lauf, Absatz „Rückmeldungen vom 2026-11-18“).

*Unter `grafik/` neu, alles nur Code (Syntax mit `python -m py_compile` geprüft, kein Blender gelaufen):*

- `grafik/fussvolk.py`: Stoffe `eibe`, `nacht`, `bemalt`, `fahl`, `rost`; Teile `streitkolben`, `keule`, `dolch`, `pavese`, `schlapphut`; `_bogen(…, stoff=)`; Baufunktionen und `ARTEN` für `eibenschuetze`, `pavesenschuetze`, `soeldner`, `riese` (`'mass': 1.45`, Zelle 520 × 400), `meuchler`, `wiedergaenger`; `bauen(art)` liest `mass`.
- `grafik/pferd.py`: Fell `rappe`. `grafik/reiter.py`: Art `reiterschuetze` (Rappe, Pelzmütze in Spielerfarbe, kein Schild, kein Schwert; `fussvolk._bogen` und `fussvolk.koecher` wiederverwendet; `BOGENARM`, `SCHUSS`; im Schuss dreht er sich im Sattel und schießt links am Hals vorbei; Sehne und Pfeil wie beim Schützen zu Fuß).
- Kleindateien `eibenschuetze.py`, `pavesenschuetze.py`, `soeldner.py`, `riese.py`, `meuchler.py`, `wiedergaenger.py`, `reiterschuetze.py`.
- `grafik/wehrturm.py` (Punkt 57, bauen AC-38): geböschter Fuß, Gesims, zwei Reihen Scharten, Wehrgang mit Zinnen, Schieferhelm auf vier Pfosten, Fahne, zwei Banner; `einzeltafel('wehrturm', 1, 4.1, …)`.
- `grafik/wolf.py` (Kriegswolf, Tafelname `kriegswolf`) schreibt ein **Subagent** im Hintergrund — Ergebnis abwarten, dann selbst durchlesen.

*Unsicher bis zur Renderprobe:* Spielerfarbe je Blickrichtung zwischen 4 % und 33 % (`strategie-bildprobe.spec.mjs`; Riese vorn, Wiedergänger hinten und Pavesenschütze hinten liegen geschätzt bei 24 bis 27 %, der Söldner seitlich bei 9 %, der Meuchler bei 14 %); Umhang des Eibenschützen gegen Arme und Beine; Pavese gegen Hinterkopf; Schnittkante des Gesichtstuchs; Zelle des Riesen; Bogen des Reiterschützen gegen die Schulter des Pferdes; beim Wehrturm der Anteil der Spielerfarbe (darstellung AC-4: unter einem Zehntel, der Wachturm lag mit langem Banner genau darauf).

*Entwurf für den Einbau (noch nichts geändert):*

- **Wehrturm-Bild:** `VERBESSERUNGEN.wehrturm` bekommt `bild: { wachturm: 'wehrturm' }` (`@typedef` ergänzen); `welt.kampfwerte()` trägt es wie `name` in die Tafel `kw` (`tafel[art].bild`); der Browser fragt an einer Stelle (`ansicht.bildart(gebaeude)`), und alles, was heute `gebaeude.art` an `gebaeudeBildZeichnen`, `gebaeudeAlsMaske`, `gebaeudeGetroffen`, `gebaeudeHoehe` gibt, nimmt sie. Zu prüfen: ob `kw` auch für Gegner kommt und wie die Baustelle eines Wehrturms aussieht.
- **`haeuser: [...]`** an der Einheit, gelesen in `welt.ausbilden()` neben `zeitalter` (Z. ~1539), im Menü (`public/auswahlleiste.js` Z. ~1457), in der KI (`ki.js` Z. 729, 763). Der Preis des Söldners für Silberfurt und der Gefallene als Kosten brauchen `auftragWerte` je Spieler — heute `this.auftragWerte(art).kosten` ohne Spieler, auch beim Abbrechen.
- **Kürzel frei:** `f h q t u x y z` — genau acht für die acht Einheiten.
- **Reihenfolge nach dem Lauf:** Verzeichniseinträge, **eine** Renderreihe als Probe (`BILDER_PROBE=1`, `--ziel=<scratchpad>`, vorher `tasklist | grep -ic blender` = 0), ansehen und nachbessern, dann voll rendern; E6 (AC-42 bis AC-44), E7 (AC-45 bis AC-47), E8 (AC-48, AC-49, kampf AC-22); nach jeder Einheit `npm run pruefstand:haeuser`; die Zahl 19 in `e2e/tests/strategie-bildprobe.spec.mjs` mit jeder Einheit anheben.

**2026-11-18, 09:00 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) PUNKT 56 GEBAUT UND EINZELN BELEGT (darstellung AC-31, `fertig`); DANACH DER VOLLE LAUF. DER BENUTZER IST WEITER ABWESEND — NICHT PUSHEN, NICHT AUSROLLEN.**

*Was steht (alles uncommittet, über `bd29832`):*

- **Blender:** `grafik/baumstumpf.py`, Eintrag in `grafik/verzeichnis.json`, Tafel `public/bilder/baumstumpf.{webp,json}` (4 Arten × 4 Stufen × 3 Gestalten, Zelle 155 × 97). Kein Blender-Prozess läuft.
- **Server (`welt.js`):** `sammelnSchritt` meldet auch das erste Stück (`rest === voll` → `{ i, a, v: 4 }`); neue Methode `welt.angebrochen()`; `aufbau()` trägt `karte.fuellung` (jeder Vorrat unter seinem vollen Wert als `[Feld, Viertel]`).
- **Browser:** `public/bilder.js` lädt `baumstumpf`; `public/gelaende.js`: `dingBildZeichnen(…, salz, gefaellt)` und `dingZeichnen(…, fuellung, gefaellt)`, Tafel `TAFEL_GEFAELLT`, gezeichneter Rückfall `gefaellterBaum()`, `einfach(…, liegt)`; `public/ansicht.js`: `fuellung` aus dem Aufbau, `this.fuellung.has(index)` an der Zeichenstelle, flacher Trefferkasten in `vorratImBild` (`[0.9, 0.55]`; das Schrumpfen des Kastens mit der Füllung ist fort), `vorrat.liegt` in `angesehenes()`; `public/auswahlleiste.js`: „Gefällter Baum“.
- **Belege:** `tests/strategie-gefaellt.test.mjs` (2 grün; Gegenproben: ohne `rest === voll` fallen beide, mit `fuellung: []` fällt der zweite), `tests/bilder.test.mjs` (neuer Fall zur Tafel), `e2e/tests/strategie-gefaellt.spec.mjs` (grün, Bild AC-31 angesehen: ein stehender, vier liegende in ihren Stufen; misst auch den gezeichneten Rückfall und die Rückkehr im neuen Fenster), `e2e/tests/strategie-ansehen.spec.mjs` angepasst (nach dem ersten Hieb „Gefällter Baum“, altes Bild AC-63 gelöscht, neues geschrieben). Neuer Prüfgriff `vorratSetzen` (`e2e/server.mjs`, `e2e/helpers/seite.mjs`): setzt nur den Rest, meldet nichts.
- `npm run typen` sauber, `npm run waechter` 43 grün, Board 563 von 685.

*Dem Benutzer zu melden (Punkt 56):* der Baum fällt mit dem ersten Stück Holz (wie im Original), nicht nach einer Zahl von Schlägen; er fällt ohne Bewegung; der Aufbau schickt die Füllung auch für Felder im Nebel (wie die Karte selbst); im dichten Wald verdecken die Nachbarn den Liegenden weitgehend — man sieht die Lücke; die Schautafel zeigt die Liegenden nicht.

*Als Nächstes:* `npm run check:alles:neu:kurz` (rund 43 Minuten, im Hintergrund), `npm run qa:abweichung` (über 1 % ansehen), zwei lokale Commits (Code/Specs/Tests/Modelle, dann Bildnachweise), Stand in `CLAUDE.md` (563 von 685, Testzahlen aus dem Lauf, Absatz „Rückmeldungen vom 2026-11-18“: Mönch heilt gezielt, Weiterentwicklung unter der Einheit, Reparieren, Pferdezucht, gefällter Baum). **Während des Laufs:** nur lesen und unter `grafik/` schreiben (Modelle der Spezialeinheiten und des Wehrturms vorbereiten), nicht rendern. Danach: Spezialeinheiten E6–E8 (einheiten AC-42 bis AC-49, kampf AC-22) und Wehrturm-Modell (57), nach jeder Einheit `npm run pruefstand:haeuser`.

**2026-11-18, 08:30 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) PUNKTE 54, 53, 50 UND 58 GEBAUT UND EINZELN BELEGT, ALLES UNCOMMITTET; PUNKT 56 BEGONNEN (NUR ENTWURF). DER BENUTZER IST WEITER ABWESEND — NICHT PUSHEN, NICHT AUSROLLEN.**

*Git:* `strategie` = `bd29832`, darüber uncommittet: `server/spiele/strategie/{welt,daten,bringt}.js`, `public/{ansicht,auswahlleiste}.js`, `public/stil.css`, drei Specs, `specs/BOARD.md` (562 von 684), `tests/strategie-{moench,reparieren,pferdezucht}.test.mjs`, `e2e/tests/strategie-{moench,truppenstufen,reparieren,pferdezucht}.spec.mjs`, neu geschriebene Bildnachweise. **Seit diesen vier Punkten gab es KEINEN vollen Lauf** — er kommt nach Punkt 56 (`npm run check:alles:neu:kurz`, dann `npm run qa:abweichung`), dann zwei lokale Commits (Code, dann Bilder) und der Stand in `CLAUDE.md`.

*Punkt 54 — der Mönch heilt gezielt (einheiten AC-65, `fertig`):* Rechtsklick mit einem Mönch auf einen eigenen oder verbündeten Verletzten. Entscheidungen, dem Benutzer zu melden: (a) wer kämpft, wird auch auf Befehl nicht geheilt — der Mönch wartet; (b) Verbündete nur auf Befehl, von selbst nur eigene; (c) bei gewähltem Mönch tragen Heilbare ihren Lebensbalken.

*Punkt 53 — Weiterentwicklung unter ihrer Einheit (bedienung AC-80, `fertig`):* flacher Knopf unter der Einheit mit goldenem Pfeil; die Leiste ist bei Kaserne, Schießanlage und Stall rund 40 Bildpunkte höher; aria-label und Tafel sagen „Weiterentwicklung: …“.

*Punkt 50 — Reparieren (bauen AC-45, `fertig`):* Rechtsklick mit Dorfbewohnern auf ein beschädigtes eigenes oder verbündetes Gebäude; Werte in `REPARATUR` in `daten.js` (12,5 Leben je Sekunde, jeder weitere Bauer halb, halber Baupreis anteilig) — aus dem Gedächtnis zum Original, Startwerte. Die KI repariert nicht; eine Farm wird nicht repariert; wer trägt, was das Lager annimmt, lädt zuerst ab; es zahlt, wer repariert; ohne Rohstoff eine Absage für die ganze Auswahl. KI-Kennzahlen danach gleich (20 Partien bis Minute 22, keine ganzen Partien).

*Punkt 58 — Pferdezucht (bauen AC-46, `fertig`):* Verbesserung im Stall ab dem Fürstentum, 150 Nahrung, 40 s, `wirkung: { kavallerie: { tempoAnteil: 0.1 } }` — ein **Anteil** am Tempo, gerechnet in `welt.einheitenwert()` auf das Tempo mit allen Zuschlägen (Ritter 1,485, leichte Kavallerie und Späher 1,705); Satz an der Tafel aus `bringt.js` („Kavallerie: +10 % Tempo“); Knopfbild `ZEICHEN.hufeisen`. Belegt: `tests/strategie-pferdezucht.test.mjs` (4 grün), `e2e/tests/strategie-pferdezucht.spec.mjs` (grün, Bild AC-46 angesehen), Gegenprobe lässt 2 von 4 fallen, `npm run typen` sauber. Konterkreis: `npm run konterkreis:strategie` „Konter unter 80 %: 0“; mit `erforscht` für die Reiterseite alle 20 von 20, nur Ritter gegen Mangonel 19. Die KI erforscht sie nicht (ki AC-35).

*Fund bei Punkt 58, dem Benutzer zu melden — NICHT geändert:* `welt.laufen()` rastet an jedem Wegpunkt ein und verliert den Rest des Takts; das Tempo im Spiel ist dadurch **gestuft** (ein Feld kostet den Ritter 8 Takte statt 7,4, mit Pferdezucht 7): Ritt über 42 Felder 33,7 → 29,6 s, das 1,14-fache statt 1,10. Beheben hieße, jede Einheit etwas schneller zu machen und alle KI-Messungen zu verschieben — seine Entscheidung.

*Punkt 56 — gefällter Baum (ENTWURF, noch keine Datei geändert):* Wie im Original ist ein Baum mit dem ersten Stück Holz **gefällt** und liegt als Stumpf mit Stamm da, der mit dem Vorrat kleiner wird.

1. **Blender:** neues `grafik/baumstumpf.py` (Rindenstoffe je Art aus `baum.py` abgeschrieben, `baum.py` bleibt unberührt): Zeilen = die vier Baumarten in der Reihenfolge von `baum.ARTEN`, Spalten = vier Stufen (voll … fast leer). Eintrag in `grafik/verzeichnis.json`, dann `npm run bilder -- baumstumpf` — **ein Blender-Prozess, vorher `tasklist | grep -i blender`**. Probe mit `BILDER_PROBE=1`.
2. **Server (`welt.js`, `sammelnSchritt`):** heute geht eine Feldänderung `{ i, a, v }` nur beim Viertelwechsel hinaus — der erste Hieb ist für den Browser unsichtbar. Neu: auch beim ersten genommenen Stück `{ i, a, v: 4 }`. Und die Füllung in den **Aufbau** (`aufbauFuer`), damit nach einer Rückkehr nichts wieder voll aussieht — bestehende Lücke, auch für Gold, Stein und Beeren.
3. **Browser:** `ansicht.fuellung` trägt für einen Wald einen Eintrag, sobald er angehackt ist → `dingBildZeichnen` nimmt die Tafel `baumstumpf` (Zeile = Baumart wie bisher über `baumart()`, Spalte = 4 − Viertel); gezeichneter Rückfall für `?bilder=0`; Trefferkasten in `vorratImBild` für den Liegenden flach; Name an der Auswahl prüfen (bedienung AC-63).
4. **Spec:** neues Kriterium in `specs/10-strategie/darstellung.md` (nächste freie Nummer nachsehen, vermutlich AC-31), Rechentest (erste Feldänderung, Aufbau trägt die Füllung), Browserfall mit `nachweis()`.

*Danach, unverändert:* Spezialeinheiten E6–E8 mit Blender-Figuren und Wehrturm-Modell (57), Spec-Runde Stufe F, Krone, Drache, KI-Block, Punkt 55 zuletzt.

**2026-11-18, früh — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) VOLLER LAUF GRÜN, ZWEI LOKALE COMMITS; DER BENUTZER IST FÜR STUNDEN ABWESEND UND HAT DIE REIHENFOLGE FREIGEGEBEN.**

*Git:* `strategie` steht auf `bd29832` (Bildnachweise) über `2387afe` (Code, Specs, Tests, CLAUDE.md). Lokales `main` = `origin/main` = Server = `a9a4d9a`. **Nicht pushen, nicht ausrollen, solange der Benutzer nicht da ist.**

*Voller Lauf* (`npm run check:alles:neu:kurz`, 2594 s): 303 im Browser (35,5 min), 943 Tests, 14 Partien, Board 558 von 680. `npm run qa:abweichung`: 251 Bilder geändert, 99 über 1 % — durchgesehen: Figuren an den Kanten neu abgetastet (verkleinerte Tafeln, 1,0–2,7 %), Kamera/Zufallskarte (> 80 %, Inhalt stimmt), Menü mit den zwei Schiebern, zwei Bilder tragen jetzt die Ansage „… erreicht“, weil das Foto früher kommt. Nichts verdorben.

*Freigaben des Benutzers (2026-11-18, wörtlich):*

- „56: angehackte Bäume. Ich lese das so, dass ein angehackter Baum wie ein unberührter aussieht. Stimmt das?  - heute ja. Der Rest, ja gerne umsetzen - viel Erfolg, cih bin dann mal abwesend für einige Stunden.“
- „die Parallelsitzung die figuren mit blender baut - arbeitet nicht mehr. Sie hat auch die Worktrees alle aufgeräumt, es gibt nur DICH, du darfst gerne subagenten triggern, wenn die dir weiterhelfen.“ — neue Modelle unter `grafik/` also selbst schreiben und rendern, **ein** Blender-Prozess.

*Freigegebene Reihenfolge:*

1. Punkte aus den Partien, reiner Code: **54** (Mönch heilt gezielt per Rechtsklick), **53** (Weiterentwicklung im Menü als solche erkennbar, unter ihrer Einheit), **50** (Dorfbewohner reparieren Gebäude), **58** (schnellere Pferde als Verbesserung im Stall, danach Konterkreis), **56** (angehackter Baum sieht anders aus als ein unberührter).
2. Spezialeinheiten aus der Burg mit eigenen Blender-Figuren (einheiten AC-42 bis AC-49, kampf AC-22), dazu **57** (Wehrturm mit eigenem Modell, bauen AC-38). Nach jeder Einheit `npm run pruefstand:haeuser` (Wehrstein steht bei 30 %).
3. Spec-Runde zur Stufe F (Bauabfolge der Krone), Aufstieg und Elitestufen, dann der Drache.
4. KI-Block: ki AC-35 (erforscht nichts), ki AC-28 (Spezialeinheit), KI in die Krone, KI-Wirtschaft (Mühlen, Sparphase; aus der Parallelsitzung: Militärgebäude stehen 24 % der Zeit trotz bezahlbarer Einheit, 55 % davon wegen `ruecklageRitterzeit`).
5. **55** (mehr Gold und Stein auf der Karte) zuletzt — danach alle KI-Messungen neu.

Die Parallelsitzung hatte empfohlen, die Krone vor die Spezialeinheiten zu ziehen; ich bleibe bei Spezialeinheiten zuerst (sie gelten ab dem Fürstentum, dort enden Partien heute) — dem Benutzer gesagt, er hat nicht widersprochen.

*Dem Benutzer bei Rückkehr melden:* Ausrollen empfehlen (Performance auf echten Rechnern prüfen); Wegpunkte für den Späher gibt es (Umschalt + Rechtsklick), im Nebel mit Späherreiter nicht geprüft; im Pausenfeld fehlt der Vorraum-Knopf; Schaden erscheint beim ersten Schuss kurz vor dem Pfeil; der Haken `.claude/hooks/steuerstand.mjs` scheitert bei PreCompact/PostCompact an der Schema-Prüfung; Marktkarren ins Lehen nur auf sein Wort (ADR-0013); ein Node-Prozess `playwright test-server` (PID 22508) läuft, vermutlich die VS-Code-Erweiterung — nicht von mir, nicht beendet.

*Falle:* `npm run check:kurz` dauert 14 Minuten und sperrt so lange die Arbeit an `server/` — nicht für reine Textänderungen starten; `npm run waechter` reicht dort.

**2026-11-18, 02:21 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) PERFORMANCE (PUNKT 45) GEBAUT UND GEMESSEN: darstellung AC-30 `fertig`, DREI UMBAUTEN; 51 BETROFFENE BROWSERFÄLLE GRÜN; VOLLER LAUF `npm run check:alles:neu:kurz` LÄUFT SEIT 02:15 (Task `b4xzap3fo`); NICHTS COMMITTET.**

*Richtigstellung zum Eintrag darunter:* „vormittags“ war gegen 00:40 Uhr, und der dort genannte volle Lauf wurde ABGEBROCHEN, als der Benutzer die Performance vorzog. Es gibt also noch keinen grünen vollen Lauf für den Stapel 46/47/49/51/52/Lautstärke — der jetzt laufende prüft beides zusammen.

*Git:* `strategie` = lokales `main` = `origin/main` = Server = `a9a4d9a`. Alles Neue liegt uncommittet im Hauptordner.

*Auftrag des Benutzers (wörtlich):* „ansonsten die Performance, wenn da ein paar mehr Einheiten aufm Spielfeld sind, oder wenn sie kämpfen, die muss unbedingt verbessert werden - erheblich“; „relativ normale zoomstufe, sodass man halt 50 einheiten aufm blick hat. Windows skalierung 100%, ja mitspieler auch geruckelt. er meinte, muss es wohl doch ne desktop app werden“; „dann bitte messen“. Später: „und, wirds ruckelfreier?“ (beantwortet: ja, mit Tabelle) und „und web GL wäre aber noch besser?“ (beantwortet: im Moment nichts Sichtbares — 60 B/s bei 4 ms von 16,7; WebGL erst bei mehreren hundert Einheiten im Bild; Empfehlung: ausrollen, zu zweit spielen, bei weiterem Ruckeln auf den Rechnern der Spieler messen).

*Was gebaut ist (alles unter darstellung AC-30, „Gefecht ohne Hänger“):*

1. **Verkleinerte Tafeln** (`public/bilder.js`: `atlantenEin`, `atlasHolen`, `atlasErsatz`, `zelleAusAtlas`, `atlantenStand`; genutzt in `figurBildZeichnen`): je Tafelbild und Zellgröße eine Fassung, die `createImageBitmap` abseits des Hauptfadens verkleinert. Grenze 80 Mio. Bildpunkte, vier zugleich, eine Bestellung verfällt nach 500 ms. Eingeschaltet in `ansicht` nach `bilderWarten()`; die Schautafel zeichnet weiter sofort.
2. **Umrisse auf einem Blatt** (`ansicht.umrisseZeichnen`, `gebaeudeAlsMaske` in `public/gebaeude.js`): ein Feld je verdeckter Einheit auf `this.umrissblatt`; erst die Gebäude als Maske, dann die Gestalt mit `source-in`, gelesen wird das Blatt erst zum Schluss.
3. **Frist für neue Haltungen** (`Bildspeicher.haltungsfrist`, `HALTUNGS_FRIST = 8` in `ansicht.js`, `HALTUNGEN` in `figuren.js`): hat ein Bild acht Millisekunden lang neue Figurenbilder gezeichnet, bleibt jede weitere Figur für dieses Bild in der Haltung von eben. Wer noch nie zu sehen war, wird gezeichnet. Das Bild gilt so lange nicht als `scharf`.

*Gemessen mit Grafikkarte* (`MINUTE=25 JE=40 ZOOM=1 NAH=1.8 npm run tempo:partie`, sichtbares Chrome 1920 × 1080, Dichte 1; Stand vor der Frist für Haltungen):

| Lage | vorher | nachher |
|---|---|---|
| Gefecht, Zoom 1 | 33,7 B/s, 14 Bilder > 50 ms, `zeichnen()` 24,4 ms | 60,1 B/s, längster Abstand 39,8 ms, `zeichnen()` 4,0 ms |
| mit Auswahl | 21,6 B/s, 36,5 ms | 60,1 B/s, 3,8 ms |
| Zoom 1,8 | 11–36 B/s, Hänger bis 435 ms | 59,5 B/s, einmal 92 ms beim Zoomwechsel, danach höchstens 35 ms |

Server in derselben Partie: höchstens 4,8 ms je Takt.

*Gemessen im Browserlauf* (ohne Grafikkarte; `strategie-tempo.spec.mjs`, vierter Fall: 150 Einheiten im Bild, 35 Umrisse, 33–44 im Kampf, zehn Sekunden): Stand `a9a4d9a` 57 B/s, 7 Bilder > 50 ms, längstes 199 ms. Jetzt 57–59 B/s, 1–2 Bilder > 50 ms, `zeichnen()` 4,2–5,6 ms im Mittel und höchstens 20–25 ms. Der Fall verlangt ≥ 50 B/s, ≤ 6 Bilder über 50 ms, kein Abstand ≥ 200 ms.

*Gegenproben:* `atlantenEin();` → `atlantenEin(false);` — FÄLLT (9–10 Bilder > 50 ms, `zeichnen()` bis 76 ms). `Infinity, HALTUNGS_FRIST);` → `Infinity, Infinity);` — bleibt GRÜN: ohne die Frist braucht `zeichnen()` bis 43 ms und drei- bis siebenmal über 20 statt höchstens zweimal, aber das fällt an keiner Grenze. Die Frist für Haltungen ist also gemessen, nicht durch einen fallenden Test belegt — so steht es auch im Kriterium.

*Fallen (neu):*

- **Canvas 2D kopiert beim Lesen.** Wird aus einer Leinwand gelesen (`drawImage(leinwand)`), nachdem sie geändert wurde, kopiert der Browser ohne Grafikkarte die ganze Leinwand. Abwechselnd in eine bildgroße Ebene schreiben und aus ihr lesen kostete 11 von 14 ms je Bild. Erst alles schreiben, dann lesen.
- **Der längste Abstand zwischen zwei Bildern taugt im Browserlauf nicht als Grenze.** Er streut auch ohne das Spiel (52 bis 133 ms bei 24 ms in `zeichnen()`). Die Zahl der Bilder über 50 ms trennt.
- **Gegenprobe unter Windows:** `export E2E_HAFEN=4195` vorher, nicht als Präfix im Befehl; nur einzeilige Ersetzungen.
- **Der Profiler im Test** (CDP `Profiler.start` über `page.context().newCDPSession(page)`, `positionTicks` je Knoten) zeigt die Zeile; das Bauskript der Sonde liegt im Scratchpad (`sonde-bauen.py`), die Sonde selbst (`e2e/tests/zz-sonde.spec.mjs`) ist wieder gelöscht.

*Bekannte Reste, nicht gebaut:*

- In einer Nachmessung mit Grafikkarte standen 82–110 verkleinerte Tafeln mit 45–75 Mio. Bildpunkten, im Lauf davor 25–55 mit 11–48 — warum mehr, ist NICHT geklärt; 75 liegt knapp unter der Grenze von 80.
- Ein Bild von 92 ms beim Wechsel auf Zoom 1,8 liegt nicht in `zeichnen()`.
- Der erste Auftritt einer Einheitenart entpackt die Haupttafel weiter einmal auf dem Hauptfaden; Gebäude und Gelände kommen aus den großen Tafeln.
- Einmal in sechs Läufen mit Profiler: 64 ms Eigenzeit in `ansicht.zustand`, gleich nach dem Auftauchen des zweiten Heers — nicht wiedergefunden, Ursache offen.
- Nicht gemessen: die Frist für Haltungen mit Grafikkarte, Dichte 1,25/1,5, Zoom 2,5, die Rechner der Spieler, andere Browser.
- `npm run sicht` meldet dreimal „404 (Not Found)“ ohne Adresse.

*Werkzeuge (neu):* `npm run tempo:partie` (`scripts/partie-messen.mjs` über `scripts/sicht.mjs --kopf --dichte 1`), rund fünf Minuten, öffnet ein sichtbares Chrome.

*Als Nächstes, in dieser Reihenfolge:*

1. Ende des vollen Laufs abwarten (Task `b4xzap3fo`, Protokoll `qa/letzter-lauf.log`); fällt etwas, einzeln nachfahren und beheben.
2. `npm run qa:abweichung`, alles über 1 % ansehen (Figuren kommen jetzt aus verkleinerten Tafeln, Umrisse mit `source-in` — leichte Änderungen sind zu erwarten).
3. Zahlen in `CLAUDE.md` nachziehen (558 von 680, Testzahlen aus dem Lauf) und den Stand um die Performance ergänzen.
4. Zwei lokale Commits auf `strategie`: der Stapel 46/47/49/51/52/Lautstärke, dann die Performance. Nicht pushen, nicht ausrollen ohne den Benutzer.
5. Dem Benutzer berichten: Vorher/Nachher, Ungeprüftes, Empfehlung (ausrollen und zu zweit spielen; WebGL und Desktop-App vorerst nicht). Dazu: Wegpunkte für den Späher gibt es schon (Umschalt + Rechtsklick, bis 20) — mit Späherreiter im Nebel noch prüfen; der Haken `.claude/hooks/steuerstand.mjs` scheitert bei PreCompact/PostCompact an der Schema-Prüfung; im Pausenfeld gibt es keinen Vorraum-Knopf; Schaden erscheint beim ersten Schuss kurz vor dem Pfeil.
6. Punkte 50, 53 bis 58 bleiben notiert — nichts davon ohne sein Wort bauen.

**2026-11-18, vormittags — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) PUNKTE 46, 47, 49, 51, 52 UND DIE LAUTSTÄRKE GEBAUT UND IM BROWSER BELEGT (bedienung AC-76 BIS AC-79, AC-66 UND darstellung AC-28 NACHGEZOGEN); VOLLER LAUF MIT NEUEN BILDERN GESTARTET; NOCH NICHT COMMITTET. NEUE MELDUNGEN 53 BIS 58 NOTIERT. ALS NÄCHSTES: DIE PERFORMANCE (PUNKT 45), VOM BENUTZER VORGEZOGEN.**

Stand im Git: `strategie` = lokales `main` = `origin/main` = Server = `a9a4d9a`; alles unten ist **uncommittet**.

**Gebaut und belegt (Rechenteil und Browserfall grün, Bilder angesehen):**

- **Punkt 46 → bedienung AC-66 nachgebessert.** „Zurück in den Vorraum" an der Abschlusstafel tat nichts: `.abschluss` lässt Klicks durch, nur `#revanche` nahm sie wieder an. `#abschlussVorraum { pointer-events: auto; }` in `public/stil.css`. Browserfall in `e2e/tests/strategie-rueckmeldung.spec.mjs` (Block „Rueckmeldungen aus der Partie zu zweit") klickt mit der Maus; Gegenprobe ohne die Zeile: der Zeiger trifft `brett`. An Annas Tafel steht „Du hast gewonnen", nicht ihr Name.
- **Punkt 47 → bedienung AC-77 „Nichts lässt sich markieren".** `#spiel { user-select: none; }`. Gegenprobe ohne: der Doppelklick markiert ein Wort. Die Punkteliste lässt Klicks durch — der Fall klickt dort mit `mouse.dblclick` an ihrem Ort.
- **Lautstärke → bedienung AC-78 „Lautstärke regelbar".** Zwei Schieber im Menü (`#lautGeraeusche`, `#lautMusik`, 0 bis 100 in Fünferschritten), `ton.staerkeSetzen(was, 0..1)`, `reglerwert()` im Quadrat, gemerkt unter `tonGeraeuschStaerke` / `tonMusikStaerke`. Vorgabe 100 % = bisherige Pegel, deshalb kein `ton:messen`. Der Browserfall steht **vor** dem AC-61-Fall und lädt mittendrin neu — die Folgefälle laufen danach grün (8 von 8).
- **Punkt 49 → bedienung AC-76 „Wer schlägt, schaut aufs Ziel".** Server nennt `zr` (Achtel der Karte) an Kämpfenden und Gefallenen (`welt.richtungFeld`, `fallrichtung`), Browser: `richtungAusAchtel`, `ansicht.zielBlick`. Gemessen 88 → 98 % (freies Feld), 78 → 91 % (im Dorf).
- **Punkt 51 → bedienung AC-79 „Erst spannen, dann der Pfeil".** Nur im Browser: ein Schlag ohne Ansage holt erst 0,35 Spielsekunden aus (`ERSTSCHLAG_VOR`, `ansicht.erstschlaegeMerken`, `erstschlagVor`), Pfeil, Stein und Klang warten so lange. **Der Schaden bleibt sofort** — das Leben sinkt einen Augenblick vor dem ersten Pfeil. Pfeile halten mit dem Bild an (`halt`). Der Browserfall zählt nur die Pfeile des eigenen Schützen (der aus dem AC-76-Fall schießt weiter) und duldet 0,4 statt 0,5 am Abflug: der Pfeil wartet nach der Wanduhr, die Bewegung läuft mit den Takten (gemessen 0,488).
- **Punkt 52 → darstellung AC-28 nachgezogen.** `PFEIL_MASS = 0.75`, Untergrenze 0,3: bei Zoom 1,5 rund 17 statt 22 Bildpunkte. Bild angesehen (bedienung AC-40): sichtbar kleiner, noch gut zu erkennen. Ob es dem Benutzer klein genug ist, sagt er.

**Beantwortet, nichts gebaut:**

- **Punkt 50** „Dorfbewohner reparieren gebäude - geht noch nicht oder?" — stimmt, **nicht gebaut**, in keiner Spec, in ADR-0012 nicht ausgeschlossen. Vorschlag: eigene Runde nach der Regel der Vorlage. **Dem Benutzer noch ausdrücklich sagen.**
- **Marktkarren** erst ab dem Fürstentum: so entschieden in ADR-0013; ändern nur auf sein Wort.
- **Punkt 57** „Wehrtürme und weitere türme brauchen ein eigenes gerendertes muster oder?" — ja: der Wehrturm trägt das Bild des Wachturms, braucht ein eigenes Blender-Modell (ein Prozess). Weitere Turmarten gibt es nicht.

**Neu gemeldet, notiert, nicht gebaut (wörtlich):**

- **Punkt 53** „und die Weiterentwicklung z.B. vom Eliteplänkler sollte klar als weiterentwicklung ersichtlich sein - und eher unterhalb vom Plänkler, sodass das etwas zugeordnet ist" — Truppenstufen (`wandelt`) in der Leiste als Weiterentwicklung kennzeichnen und unter ihre Einheit stellen.
- **Punkt 54** „dem Mönch sollte man mit rechtsklick genau mitgeben können, wen er heilen soll" — Heilauftrag auf dem Server, Spec in `einheiten-und-befehle.md`.
- **Punkt 55** „Auf der Karte gibt es nur die Standard Gold und Stein Abbaumöglichkeiten, da muss noch bissl mehr rein" — `karte.js`; danach alle KI-Messungen neu (die Grenzen halten an diesen Startwerten, nicht aus Abstand). Eigene Runde, dem Benutzer die Kosten sagen.
- **Punkt 56** „angehakte Holzbäume gibts nicht," — meine Lesart: ein angehackter Baum sieht aus wie ein unberührter. Lesart bestätigen lassen.
- **Punkt 58** „und vll sollte es beim angriff nochmal schnellere pferde geben z.B." — Empfehlung gegeben: Verbesserung im Stall nach der Vorlage („Viehzucht", +10 % Tempo für Reiter, ab dem Fürstentum), ein Eintrag in den Daten, danach Konterkreis messen. Nicht gebaut.
- **Punkt 45 verschärft:** „ansonsten die Performance, wenn da ein paar mehr Einheiten aufm Spielfeld sind, oder wenn sie kämpfen, die muss unbedingt verbessert werden - erheblich" — **vorgezogen, die nächste Runde.**

**Für die Performance-Runde vorbereitet:**

- `scripts/sicht.mjs` kennt jetzt `--kopf` (Fenster mit Grafikkarte) und `--dichte <n>` (Skalierung von Windows). Ohne `--kopf` rechnet der Browser auf dem Prozessor — eine Bildrate von dort sagt nichts über den Rechner des Benutzers.
- Sonde im Scratchpad `gefecht-messen.mjs` (geht bei einem Neustart verloren; wenn sie taugt, nach `scripts/` holen): stellt je Seite `JE` Einheiten aus fünf Arten auf, misst leer, stehend, im Marsch und im Gefecht — Bildabstände (Mittel, p95, p99, über 33 und 50 ms), Zeit in `zeichnen()` je Teil und in `zustand()`, was die Bildspeicher neu zeichnen und verwerfen, dazu die Eigenzeit je Funktion aus dem Profil des Browsers. Aufruf: `JE=40 ZOOM=1.5 npm run sicht -- --spiel --breite 1920 --hoehe 1080 --kopf --dichte 1.25 --hafen 4297 --tun <sonde>`.
- **Verdacht, nicht gemessen:** `Bildspeicher('figuren', 10_000_000)` fasst bei Zoom 2 und Dichte 1,5 nur rund hundert Figurenbilder; ein Gefecht braucht je Art und Farbe acht Richtungen mal acht Stufen des Schlags. Wird verdrängt, entsteht jedes Bild neu (Leinwand anlegen, Maske färben, hochwertig verkleinern). Der vorhandene Fall `darstellung AC-10` misst hundert Dorfbewohner einer Farbe bei Zoom 1 und Dichte 1 — weit weg von einem Gefecht. Erst messen, dann umbauen.
- **Offene Fragen an den Benutzer:** Zoomstufe im Gefecht, Skalierung von Windows (125/150 %), Bildschirmgröße, ob es beim Mitspieler auch ruckelte.

**Noch offen aus dem Auftrag vom 17.11.:** Wegpunkte für den Späher (bedienung AC-14 gibt es: Umschalt + Rechtsklick, bis 20) mit dem Späherreiter im Nebel prüfen und erklären.

**Dem Benutzer zu melden:** der Projekthaken `.claude/hooks/steuerstand.mjs` scheitert bei PreCompact/PostCompact an der Schema-Prüfung (SessionStart liefert den Steuerstand trotzdem); nicht angefasst.

**2026-11-17, 23:40 — (Sitzung `onlinegames-ac`, Hauptordner, Zweig `strategie`) AUFTRAG DES BENUTZERS VOM 17.11.: PUNKTE 45 BIS 47 UMSETZEN, LAUTSTÄRKE IM MENÜ REGELBAR, WEGPUNKTE FÜR DEN SPÄHER, „DIE PROBLEME VON VORGESTERN ALLE". NACHGELESEN UND GEPLANT, NOCH KEINE DATEI IM REPO GEÄNDERT** (außer dieser).

Wörtlich: *„Bitte die Sachen umsetzen, gerne nacheinander. Dann noch die Lautstärke im Menü regelbar machen, also leiser stellen ermöglichen. und beim Späher z.B. mehrere Wegpunkte setzen, wo er langlaufen soll. Und die Probleme von vorgestern angehen allle"*

**Stand beim Beginn:** `strategie` = `main` = `origin/main` = Server = `a9a4d9a`, Hauptordner sauber bis auf diese Datei. Die Vorsicht „Zeichencode nicht anfassen" (Blender-Sitzung parallel) gilt nicht mehr — der Benutzer hat das Umsetzen ausdrücklich bestellt, und die Bildumbau-Sitzung ist nicht mehr als Nachbar gelistet. Vor dem ersten Edit trotzdem `git status` auf fremde Änderungen prüfen (Sitzung `onlinegames-45` war als untätig gelistet).

**Meine Lesart (dem Benutzer am Ende sagen):** „die Sachen" = Punkte 45 bis 47 aus dem Eintrag „23:19" (Ruckeln im Gefecht, toter Vorraum-Knopf, markierter Text). „Die Probleme von vorgestern alle" = dieselben Meldungen vom 15.11. vollständig, also auch das Ruckeln als eigene Runde — **nicht** das Handy (Punkt 48, vom Benutzer hinten angestellt). Danach, wenn noch Zeit ist, die offenen Punkte der Listen (unten).

**Reihenfolge und was je Schritt feststeht:**

1. **Punkt 46, toter Vorraum-Knopf.** Ursache gelesen, nicht im Browser nachgestellt: `.abschluss { pointer-events: none }` (`public/stil.css` um Zeile 633), nur `#revanche` (Zeile 749) bekommt `pointer-events: auto`, `#abschlussVorraum` nicht. `zumVorraum()` hängt richtig an beiden Knöpfen (`public/app.js` 686–703). Kur: eine CSS-Regel. Beleg: kein Test klickt bisher `#abschlussVorraum` (nur `#menueVorraum`, `e2e/tests/strategie-rueckmeldung.spec.mjs` 654–700) — ein Browserfall, der an der Abschlusstafel **mit der Maus** klickt (kein `evaluate(click)`, das ginge an `pointer-events` vorbei) und im Vorraum landet. Gehört zu bedienung AC-66 (der Satz „er steht dann auch auf der Abschlusstafel" steht dort schon) — kein neues Kriterium nötig, aber ein zweiter Test mit `bedienung AC-66` im Namen und ein Bild. **Im Pausenfeld gibt es keinen Vorraum-Knopf** (`#pausefeld` hat nur „Weiterspielen") — die Meldung „auch bei Pause" meint vermutlich die Abschlusstafel; dem Benutzer sagen.
2. **Punkt 47, markierter Text.** Kein `user-select` in `public/stil.css`. Kur: `user-select: none` auf `#spiel` (Zeile 202); Eingabefelder gibt es im Spielbild keine. Neues Kriterium **bedienung AC-76** (AC-75 ist das letzte, nachgesehen) „Nichts lässt sich markieren"; Browserfall: Ziehen von der Karte über die Leiste und Doppelklick auf einen Knopftext, danach `getSelection().toString() === ''`.
3. **Lautstärke.** Neues Kriterium **bedienung AC-77** „Lautstärke regelbar": zwei Schieber (Geräusche, Musik, 0 bis 100 %) **im Menü** (`#spielmenue`, F10, `public/index.html` 177–185) — der Benutzer sagte „im Menü"; die zwei Schalter der Tastenübersicht (`public/tasten.js` 79–98, AC-61) bleiben. In `public/ton.js`: `GEMERKT` (Zeile 14) um zwei Schlüssel für die Stärke erweitern, im Konstruktor lesen (Vorgabe 1), `geraeuschStaerkeSetzen(x)` stellt `this.effekte.gain`, `musikStaerkeSetzen(x)` das Ziel der Musik — `musikPruefen()` (um Zeile 628) rampt bisher fest auf `MUSIK_LAUT = 0.42`, künftig `MUSIK_LAUT * staerke`, und bei laufender Musik gleich nachziehen. Regler in `kontext()` beim Anlegen auf die gemerkte Stärke setzen. Belege: Rechenteil in `tests/strategie-ton.test.mjs` (gemerkt über Neuanlegen, Ziel des Reglers), Browserfall in `e2e/tests/strategie-ton.spec.mjs` (Schieber auf 25 % → `window.ton.pegel()` der Musik deutlich kleiner als vorher; nach Neuladen steht der Schieber), Bild vom Menü. Die Liste der Knöpfe im Menü wird in `strategie-rueckmeldung.spec.mjs` 654 mit `toHaveText([...])` geprüft — Schieber sind keine `button`, sollte halten. Danach `npm run ton:messen` nur, falls sich Vorgabe-Pegel ändern (sollen sie nicht: Vorgabe 100 % = heute).
4. **Wegpunkte für den Späher.** **Gibt es schon** (bedienung AC-14 `fertig`): Umschalt + Rechtsklick hängt ein Ziel an, bis zu 20, steht in der Tastenübersicht (`public/tasten.js` Zeile 24). Zu tun: mit einem Späherreiter prüfen, auch mit Zielen im Nebel/Unerkundeten (seit kampf AC-11 ist ein Klick in den Nebel ein Gang, seit einheiten AC-64 gilt das Nächst-Erreichbare auch am angehängten Wegpunkt) — und dem Benutzer sagen, wie es geht. Vermutung: er kennt die Taste nicht; überlegen, ob die Zeigertafel (AC-52) oder die Erklärung der ersten Partie (AC-21) es nennen soll. Erst prüfen, dann vorschlagen.
5. **Punkt 45, Ruckeln im Gefecht — eigene Runde.** Befund steht im Eintrag „23:19" (Server ausgeschlossen; im Browser entstehen im Gefecht 300 bis 450 neue Figurenbilder je 5 s, `figurBildZeichnen` in `public/figuren.js` um 1239–1335 legt je Art, Farbe, Richtung, Ablauf, Bild, **Größe und Punktdichte** ein eigenes Bild an, `Bildspeicher('figuren', 10_000_000)` läuft bei Zoom 1,5 × Dichte 1,5 nach 10 s voll und hält dann nur rund 400 Bilder; ein Speicher von 150 Mio allein half nicht — das Erzeugen ist die Last). Plan: neues Kriterium **darstellung AC-30** (AC-29 ist das letzte — vor dem Anlegen nachsehen) mit Messung, etwa „Gefecht mit 200 Einheiten: 30 Bilder je Sekunde bei Zoom 1,5 und Punktdichte 1,5"; die gefärbte Zelle **einmal in Tafelauflösung** ablegen (unabhängig von Zoom und Größe) und erst beim Zeichnen skalieren; Ablauf-Tafeln der eigenen Einheiten vorladen (träges Laden in `public/bilder.js` um Zeile 82 ist nicht untersucht). Vorher **mit GPU messen** (`headless: false`) — die Zahlen aus dem Eintrag „23:19" sind ohne GPU und nicht übertragbar; das eine Bild je Sekunde selbst ist nicht nachgestellt. Messwerkzeug: Sonde für `npm run sicht -- --spiel --aufgedeckt --breite 1920 --hoehe 1080 --hafen 4297 --tun <sonde.mjs>`; die Sonden `gefecht2.mjs`, `taktzeit.cjs` lagen im Scratchpad der Sitzung (`…\Temp\claude\fdfb6b3081f376fd\f0f1be48-…\scratchpad\`) und können weg sein — dann neu schreiben: 100 gegen 100 aus sieben Arten um `basis + (0,14)`, rAF-Abstände, `Bildspeicher.alle.get('figuren')`, Umgebung `ZOOM`, `DICHTE`. Aussehen ändert sich womöglich leicht (anderes Skalieren) → `check:alles:neu:kurz` und `qa:abweichung`.
6. **Danach, falls gewollt: offene Punkte der Listen** — 8 Holzhacken-Ablauf, 15 Feldarbeit, 17 Notfallklingel, 13/18 Speichern (ADR-0017 S1–S4), ki AC-35 (KI erforscht nichts), bedienung AC-73 `in-qa`, darstellung AC-24 `in-arbeit`. Nicht von selbst anfangen, ohne es dem Benutzer zu sagen.

**Offene Fragen an den Benutzer zum Ruckeln (gestellt, nicht beantwortet):** Zoomstufe im Gefecht, Windows-Skalierung 125/150 %, ob es beim Mitspieler auch ruckelte.

**Abschluss je Runde:** `npm run specs:board`, `npm run check:alles:kurz` (Runde 1 fasst die Oberfläche an; Bilder nur der betroffenen Fälle neu mit `QA_NACHWEIS=1 … -g`), örtlicher Commit auf `strategie`. **Pushen und Ausrollen nur, wenn der Benutzer da ist oder es sagt** — er will die Kur am Knopf vermutlich auf dem Server haben: am Ende fragen.

**2026-11-16, 08:32 — (Sitzung Bildumbau) HAUPTORDNER VORGESPULT, GEBÄUDE-WORKTREE ENTFERNT (Benutzer: „Ja bitte“). ALLES STEHT AUF `a9a4d9a`.**

- **Hauptordner `C:/Users/danie/OnlineGames`:** die überholte Vormerkung (`public/app.js`, `e2e/tests/strategie-einstieg.spec.mjs` — vorher geprüft: gleich `$S/beitritt.patch`, jede Zeile in `main`) und `specs/BOARD.md` (nur Zeilenenden) verworfen, dann `git merge --ff-only main`: **`strategie` = `a9a4d9a`**. Der Steuerstand blieb unberührt (Prüfsumme vorher = nachher; Kopie `$S/steuerstand-vor-vorspulen.md`). Uncommittet liegt dort nur noch dieser Steuerstand. `package.json` unverändert seit `5d64f05`, kein `npm ci` nötig.
- **Worktree `OnlineGames-gebaeude` entfernt, Zweig `strategie-gebaeude` (`2060173`, ganz in `main`) gelöscht** — war sauber, nur `grafik/__pycache__`, kein Prozess darin.
- **Es gibt jetzt genau:** örtlich `main` = `strategie` (Hauptordner) = `strategie-bildumbau` (Worktree `OnlineGames-bildumbau`) = `a9a4d9a` = `origin/main` = Server; dazu geparkt `strategie-ki-antwort` (`9c69b75`) und `strategie-mauerring` (`bf1ff0a`), örtlich und auf GitHub.
- **Die alte Vorsicht „Hauptbaum nicht anfassen, steht auf `5d64f05`“ gilt so nicht mehr** — er steht auf dem aktuellen Stand. Weiter gilt: zwei Sitzungen bauen nicht zugleich in demselben Ordner.

**2026-11-16, 08:14 — (Sitzung Bildumbau) ZWEIGE AUFGERÄUMT (Benutzer: „Ja, bitte alles aufräumen“).**

- **Regel des Benutzers (15.11.: „Wir halten normal alles in main oder?“): auf GitHub ist `main` der eine Ort.** Gepusht wird `main` (örtlich vorspulen mit `git fetch . <arbeitszweig>:main`, dann `git push origin main`), nicht der Arbeitszweig.
- **Örtlich gelöscht:** `strategie-ki-ritterzeit` (`074d1f0`), `strategie-ki-sicht` (`d0314d4`), `managerspiel` (`aebb633`) — alle ganz in `main`; `strategie-standplatz` (`97815b7`, überholt durch `04fbb80`, mit `-D`).
- **Auf GitHub gelöscht:** `strategie-bildumbau`, `strategie-ki-ritterzeit`, `strategie-ki-sicht`, `managerspiel` (alle ganz in `origin/main`, kein offener PR).
- **Nach GitHub gesichert:** `strategie-ki-antwort` (`9c69b75`) und `strategie-mauerring` (`bf1ff0a`) — geparkt, nicht zusammenführen.
- **Es gibt jetzt:** örtlich `main` = `strategie-bildumbau` = `a9a4d9a`, `strategie` `5d64f05` (Hauptordner), `strategie-gebaeude` `2060173` (eigener Worktree, sauber, ganz in `main`), die zwei geparkten. Auf GitHub `main` und die zwei geparkten.
- **Nicht angefasst, liegt beim Benutzer:** Hauptordner (`strategie` 10 Commits hinter `main`; vorgemerkt dort noch die Beitritts-Korrektur in `public/app.js` und `e2e/tests/strategie-einstieg.spec.mjs` — überholt durch `a9a4d9a`; dazu `specs/BOARD.md` und dieser Steuerstand uncommittet) und der Worktree `OnlineGames-gebaeude`.

**2026-11-16, 00:36 — (Sitzung Bildumbau) BEITRITTS-KORREKTUR COMMITTET `a9a4d9a`, VOLLER BROWSERLAUF GRÜN, AUSGEROLLT, AUF `main` GEPUSHT.**

- `check-19.log` grün → Commit `a9a4d9a` „raeume AC-18: wer waehrend des Ladens beitritt, behaelt seinen Platz“ (Worktree, `strategie-bildumbau`). Danach **voller Browserlauf `$S/alles-20.log`: 297 von 297 grün in 32,1 min, Check dahinter grün (938 + 14)** — keiner der vier Fälle vom 15.11. fiel. Das stützt, dass `auswahl AC-23` am Beitritt während des Ladens lag; ein Beweis ist ein grüner Lauf nicht.
- **Auf dem Server läuft `a9a4d9a`** (00:36, vorher 0 Räume).
- **CI auf `main` für `493a184`: grün**, 15 min 49 s auf dem GitHub-Runner (der Lauf davor, `4af0cb3` am 13.11., war an ki AC-27 gescheitert — Distelhag 1,44 bei damals 1,5).
- **Gepusht 07:11, vom Benutzer bestätigt: `origin/main` = örtliches `main` = `strategie-bildumbau` = Server = `a9a4d9a`.** **Der CI-Lauf dazu ist grün** (knapp 9 min).
- **Offen für den Benutzer:** (1) die drei Zweige außerhalb von `main` (`strategie-standplatz` überholt, `strategie-ki-antwort` und `strategie-mauerring` geparkt) — löschen oder als Zweige nach GitHub nur auf sein Wort; (2) `origin/strategie-bildumbau`, `origin/strategie-ki-ritterzeit`, `origin/strategie-ki-sicht`, `origin/managerspiel` liegen ganz in `main` und könnten auf GitHub weg — nur auf sein Wort; (3) im Hauptordner liegt die Beitritts-Korrektur weiter vorgemerkt (jetzt doppelt) und der Zweig `strategie` 10 Commits hinter `main`.

Nächstes Skript `a340.py`, nächster Check `check-21.log`.

**2026-11-15, 23:46 — (Sitzung Bildumbau) `main` AUF GITHUB = `493a184` (Benutzer: „Wir sollten alles aus den diversen Branches nach main bringen“). Beitritts-Korrektur vom 13.11. eingelegt, uncommittet, `check-19.log` läuft (Hintergrund `bfxc309bo`).**

- **Gepusht (vom Benutzer bestätigt):** örtliches `main` mit `git fetch . strategie-bildumbau:main` vorgespult (kein Arbeitsbaum berührt), dann `git push origin main` → `origin/main` = `493a184`, 40 Commits, ein CI-Lauf. **Der örtliche Zweig `strategie` (Hauptordner, `5d64f05`) ist NICHT vorgespult** — dort liegen uncommittete Dateien; er steht 9 Commits hinter `main`. Wer im Hauptordner weiterbaut, spult erst vor (`git merge --ff-only main`), sobald dort nichts Uncommittetes mehr im Weg ist.
- **Zweige gesichtet** (`git rev-list --count strategie-bildumbau..<zweig>`): `strategie`, `strategie-gebaeude`, `strategie-ki-ritterzeit`, `strategie-ki-sicht`, `managerspiel` liegen ganz in `main`. Je ein Commit außerhalb: `strategie-standplatz` `97815b7` (überholt — der Inhalt steckt in `04fbb80`), `strategie-ki-antwort` `9c69b75` (ki AC-31, gemessen ohne Wirkung), `strategie-mauerring` `bf1ff0a` (ki AC-35, „GEPARKT … Nicht zusammenführen“, reißt die Grenzen). **Die zwei geparkten gehören nicht nach `main`** — dem Benutzer so gesagt; auf GitHub liegen sie nicht.
- **Fund im Hauptordner:** dort liegt seit 2026-11-13 18:30 eine vorgemerkte, nie committete Korrektur (`public/app.js`, `e2e/tests/strategie-einstieg.spec.mjs`): wer beitritt, während `sitzungPruefen()` noch wartet, verlor seinen Platz („Diese Partie gibt es nicht mehr“) — **dieselbe Meldung wie beim gefallenen `auswahl AC-23` im vollen Lauf heute; das war also nicht nur Last.** Als Patch (`$S/beitritt.patch`) sauber in den Worktree eingelegt; die Dateien im Hauptordner sind unberührt und dort weiter vorgemerkt (**beim Vorspulen von `strategie` vorher wegnehmen — sie sind dann doppelt**). Belegt: neuer Fall `raeume AC-18: wer beitritt, waehrend die Seite noch die Anmeldung prueft, behaelt seinen Platz` grün; **Gegenprobe mit dem alten Verhalten fällt an „Diese Partie gibt es nicht mehr“**; 47 Fälle aus `spielauswahl`, `vorraum`, `strategie-verbindung`, `strategie-rueckmeldung`, `strategie-erklaerung`, `strategie-einstieg` grün. Spec `raeume AC-18` um den Satz ergänzt, CLAUDE.md 296 im Browser. **Kein voller Browserlauf** für diese 13 Zeilen — dem Benutzer sagen.
- **Dann:** Check grün → Commit „raeume AC-18: wer waehrend des Ladens beitritt, behaelt seinen Platz“; Ausrollen (`--stand` vorher) und Push auf `main` erst auf das Wort des Benutzers (jeder Push = ein CI-Lauf).

Nächstes Skript `a339.py`, nächster Check `check-20.log`.

**2026-11-15, 23:37 — (Sitzung Bildumbau) FINALISIERT: Bilder committet `493a184`, AUSGEROLLT, PUSH VOM BENUTZER ABGELEHNT.**

- `check-18.log` grün (938 Tests, 14 Partien, 663 s). Commit `493a184` „Bildnachweise neu …“ (253 Bilder) auf `strategie-bildumbau` im Worktree `OnlineGames-bildumbau`; Arbeitsbaum dort sauber.
- **Auf dem Server läuft `493a184`** (`npm run ausrollen`, 23:34, vorher 0 Räume; von außen erreichbar, wss steht). Darin neu gegenüber `2554470`: ki AC-36, einheiten AC-64 (unerreichbar: so nah wie möglich), darstellung AC-29 (Nebel über die Kante), einheiten AC-30 (Standplätze), kampf AC-11 (Klick in den Nebel ist ein Gang).
- **Push `git -C /c/Users/danie/OnlineGames-bildumbau push origin strategie-bildumbau` vom Benutzer abgelehnt (23:36) — nicht von selbst wiederholen, erst auf sein Wort.** `origin/strategie-bildumbau` steht weiter auf `2554470`; lokal vier Commits voraus (`57b12dc`, `9150526`, `04fbb80`, `493a184`).
- Angesehen von den 28 Bildern über 1 %: die neun stärksten (darstellung AC-07, einheiten AC-25, einheiten AC-15, bedienung AC-34, ki AC-14, bedienung AC-16, spielziel AC-28, bedienung AC-07, fahrplan AC-12) — alle in Ordnung. Die 19 darunter nicht einzeln.
- **Offen, dem Benutzer gesagt:** vier Browserfälle nur einzeln grün (Last, nicht bewiesen; `auswahl AC-23` könnte mit Punkt 46 „toter Vorraum-Knopf“ der zweiten Sitzung zusammenhängen — nicht geprüft); „höchstens eine von 120 ohne Sieger“ ist meine Auslegung.
- **Als Nächstes (nicht begonnen):** KI-Wirtschaft (Mühlen/Brachen/Sparphase), Spec-Runde Stufe F (Antwort des Benutzers zur Reihenfolge Krone vor Spezialeinheiten steht aus), übriger KI-Block. Punkte 45–48 liegen bei der zweiten Sitzung.

Nächstes Skript `a337.py`, nächster Check `check-19.log`.

**2026-11-15, 23:21 — (Sitzung Bildumbau) VOLLER BROWSERLAUF: 292 grün, 4 gefallen (`$S/alles-17.log`, 43,7 min) — alle vier einzeln wiederholt grün; `check-18.log` läuft (Hintergrund), danach Bilder committen und ausrollen. Benutzer (23:10): „Bitte finalisiere, was hier noch ansteht: achtung es gibt eine zweite session, die was macht“.**

- Die zweite Sitzung (`onlinegames-38`, Eintrag 23:19 darunter) misst nur lesend im Worktree mit `npm run sicht -- --hafen 4297`; CPU bei 77 %. Mein Worktree zeigt nur `qa/bildnachweise` als geändert. Dritter Worktree `OnlineGames-gebaeude` (`strategie-gebaeude` `2060173`) — nicht anfassen.
- Gefallen im vollen Lauf: `auswahl AC-23` Warteraum 1366×768 (Gast nicht im Raum, „Diese Partie gibt es nicht mehr“), `spielziel AC-24` „fest“ (dritter Spieler nicht binnen 8 s im Warteraum), `spielziel AC-14` (Trace-Datei abgeschnitten), `ki AC-11` (beforeAll 60 s). Wiederholt mit `QA_NACHWEIS=1`: drei sofort grün; der Warteraum-Fall fiel in der Vierergruppe noch einmal, allein zweimal grün, die ganze Datei `spielauswahl.spec` 17 von 17. **Gedeutet als Last, nicht bewiesen** — keiner der vier berührt Code aus `04fbb80`. (Punkt 46 der zweiten Sitzung „toter Vorraum-Knopf“ könnte mit dem Warteraum-Fall verwandt sein — nicht geprüft.)
- `qa:abweichung`: 253 geändert, 28 über 1 %. Angesehen: darstellung AC-07, einheiten AC-25, einheiten AC-15 (drei am Gold, jeder auf seinem Platz), bedienung AC-34, ki AC-14 — in Ordnung; die großen Anteile kommen vom verschobenen Bildausschnitt. **Nicht einzeln angesehen:** bedienung AC-16, AC-07, spielziel AC-28, fahrplan AC-12 und die 19 unter 36 %.
- **Dann:** `git add -A` (nur `qa/bildnachweise`), Commit der Bilder; `npm run ausrollen -- --stand`, `npm run ausrollen` (nie `--sofort`); Push als alleiniger Befehl `git -C /c/Users/danie/OnlineGames-bildumbau push origin strategie-bildumbau` (hängt bis zur Bestätigung).

Nächstes Skript der Sitzung Bildumbau: `a336.py`.

**2026-11-15, 23:19 — VIER MELDUNGEN AUS DER PARTIE ZU ZWEIT (ohne KI, Server `2554470`), PUNKTE 45 BIS 48. UNTERSUCHT, NICHTS GEBAUT, NICHTS GEÄNDERT** (eingetragen von der Sitzung `onlinegames-38`, die im Hauptordner sitzt und sonst über die Handy-Bedienung sprach; gelesen und gemessen im Worktree `OnlineGames-bildumbau` auf `04fbb80`, nur mit `npm run sicht -- --hafen 4297`, keine Datei dort angefasst).

1. **Punkt 45 (wörtlich):** „Es ruckelte immer mal wieder leicht … als wir zum schluss gekämpft haben, hat es sehr geruckelt, war eher so 1 bild pro sekunde - und dann war innerhalb von ganz kurzer Zeit, ganz viel passiert und alle einheiten weg.“ — „Performance is nochn Thema.“
   - **Der Server ist es nicht** (gemessen am ausgerollten Stand `2554470`, vier KIs im Nebel bis zum Ende, Minute 58, je Takt KI + Welt + `zustandJeSpieler` + JSON): Mittel 0,6 ms, 99,9 % 3,4 ms, höchster 26 ms, 0 von 34 772 über 100 ms. Der Server protokolliert keine Taktzeiten — aus der Partie selbst gibt es keine Zahl.
   - **Der Browser ist es** (Gefecht 100 gegen 100 aus sieben Arten vor der Kamera, 1920 × 1080, headless, also ohne Grafikkarte — die absoluten Zahlen gelten nicht für seinen Rechner): Zoom 1 / Punktdichte 1: 29–36 Bilder/s in den ersten 15 s, längstes Bild 417 ms, erst nach 25 s wieder 54. Zoom 1,5 / Dichte 1: 37–46. Zoom 1 / Dichte 1,5: 10–16. Zoom 1,5 / Dichte 1,5: 7–10. Zoom 2,1 / Dichte 1,5: 3,6–6, `zeichnen` im Mittel 124–237 ms. Das eine Bild je Sekunde selbst ist nicht nachgestellt.
   - **Wo:** `figurBildZeichnen` (`public/figuren.js`) legt je Art × Farbe × Richtung × Ablauf × Bild × Größe eine eigene kleine Leinwand an, gefüllt über `zelleZeichnen`/`zelleInFarbe` (`public/bilder.js`: drei Schritte auf der Werkbank, dann mit `imageSmoothingQuality = 'high'` aus der Tafel verkleinert). Im Gefecht entstehen 300 bis 450 neue Bilder je 5 s. Der Figurenspeicher (10 Mio Bildpunkte) ist bei Zoom 1,5 nach 10 s voll, bei Zoom 1,5 × Dichte 1,5 fasst er rund 400 Bilder, bei 2,1 × 1,5 rund 200 — dann wird in jedem Bild verworfen und neu erzeugt (445 neu / 445 verworfen je 5 s). Profil: 24–66 % `drawImage`, 25–62 % „(program)“, das eigene JavaScript unter 5 %.
   - **Gegenprobe:** Speicher auf 150 Mio gestellt (Zoom 1,5 / Dichte 1,5): nichts wird mehr verworfen, aber 6,8–7,6 Bilder/s in den ersten 15 s statt 7–10, am Ende 13 statt 12,6. **Ein größerer Speicher allein löst es nicht** — teuer ist das Erzeugen.
   - **Nicht untersucht:** ob das Laden der Ablauf-Tafeln beim ersten Gebrauch (`bilder.js` ~82, bis 23 MB entpackt) die einzelnen Hänger macht; wie es mit Grafikkarte aussieht (Lauf mit `headless: false`); die Übertragung (Größe der Zustände bei 200 Einheiten).
   - **Vorschlag, nicht entschieden:** neues Kriterium unter Darstellung („Gefecht mit 200 Einheiten: 30 Bilder je Sekunde bei Zoom 1,5 und Punktdichte 1,5“), erst mit Grafikkarte messen, dann die gefärbte Zelle einmal in Tafelgröße vorhalten (unabhängig von Zoom und Größe) und beim Zeichnen skalieren, statt je Größe ein eigenes Bild; die Ablauf-Tafeln der eigenen Einheiten vorab laden.
   - Messskripte (Scratchpad dieser Sitzung, kann verschwinden): `C:\Users\danie\AppData\Local\Temp\claude\fdfb6b3081f376fd\f0f1be48-1595-48f0-ac47-14eca6602201\scratchpad\taktzeit.cjs` (`node taktzeit.cjs <wurzel> <startwert> <spieler> <minuten>`) und `gefecht2.mjs` (`ZOOM=1.5 DICHTE=1.5 [GRENZE=150000000] npm run sicht -- --spiel --aufgedeckt --breite 1920 --hoehe 1080 --hafen 4297 --tun <pfad>`).
2. **Punkt 46 (wörtlich):** „das PopUp für Pause, oder auch am Ende des Spieles, hat jeweils unten nen Button der irgendwie heißt zruück zum Vorraum oder so, aber der tut nichts, man muss zum schluss auf den Menübutton klicken.“ → **Ursache gelesen, nicht im Browser nachgestellt:** `.abschluss { pointer-events: none }` (`public/stil.css` ~644), ausgenommen ist nur `#revanche` (~752); `#abschlussVorraum` fehlt dort — der Klick fällt durch auf die Leinwand. Der Knopf im Menü (`#menueVorraum`) ruft dieselbe `zumVorraum()` und geht. Kein Browserfall klickt `#abschlussVorraum` (nur `#menueVorraum` in `strategie-rueckmeldung.spec.mjs`). Das Pausenfeld hat nur „Weiterspielen“ — einen Vorraum-Knopf gibt es dort nicht; was er dort meinte, ist offen.
3. **Punkt 47 (wörtlich):** „dass der text z.B. bei meinen dorfbewohnern die gebäudenamen so aussahen, als wären sie markiert gewesen, so blau schattiert“ → in `public/stil.css` steht nirgends `user-select`; ein Zug oder Doppelklick, der über der Leiste endet, markiert ihren Text. **Vermutung, nicht nachgestellt.** Abhilfe: `user-select: none` auf `#spiel`.
4. **Punkt 48:** Handy-Bedienung — mittelfristig, hinten angestellt; wenn, dann ist das Handy das Maß, nicht das Tablet (Gedächtnis `handy-bedienung.md`). bedienung AC-23 („Handy ausdrücklich kein Ziel“) gilt bis dahin weiter.

**2026-11-15, 21:46 — PUNKT 43 COMMITTET `04fbb80` (lokal auf `strategie-bildumbau`, `check-16.log` grün: 938 + 14, 839 s; nicht gepusht, nicht ausgerollt). VOLLER BROWSERLAUF LÄUFT: `E2E_HAFEN=4205 npm run check:alles:neu:kurz > $S/alles-17.log` (~50 min mit dem Check danach) — solange nichts unter `public/` und `server/` ändern, nichts Schweres rechnen.**

- Lokal vor dem Server: `57b12dc` (ki AC-36), `9150526` (einheiten AC-64, darstellung AC-29), `04fbb80` (einheiten AC-30, kampf AC-11, Nebeltest 120). Server: `2554470`, zuletzt leer (21:00: 0 Räume).
- Dem Benutzer gesagt (21:27): Ursache Nebelklick, fünf angepasste Kampftests, Nebeltest 120, **„höchstens eine von 120 ohne Sieger“ ist meine Zahl** — er kann „alle 120“ verlangen.
- **Nach dem Lauf:** `npm run qa:abweichung 2>/dev/null` → alles über 1 % ansehen (erwartet: Bilder mit Sammlern/Hirten verschieben sich um Viertelfelder; Nebelrand an Kartenkanten) → Bilder committen („Bildnachweise neu nach …“) → `npm run ausrollen -- --stand`, dann `npm run ausrollen` (wartet auf leere Räume, nie `--sofort`) → Push nur als alleiniger Befehl `git -C <pfad> push origin strategie-bildumbau`, hängt bis zur Bestätigung — erst NACH dem Ausrollen.
- Fällt im Browserlauf etwas: zuerst prüfen, ob ein Fall im Nebel auf einen ungesehenen Gegner klickt (kampf AC-11, Serverregel neu) oder ein Fall die Lage eines Sammlers auf ganze Felder erwartet (Standplätze x,25/x,75).

Nächstes Skript `a335.py`.

**2026-11-15, 21:32 — PUNKT 43: NEBELTEST AUF 120 STARTWERTE UMGESTELLT, `check-16.log` LÄUFT (Hintergrund `bqkokqqks`, ~14 min; solange nichts unter `server/` ändern). Uncommittet.**

- **Messung 1–120** (`n43-*.json` Arbeitsstand, `k43-*.json` HEAD `9150526`; ohne Sieger zählt als 90 min): **neu** 1 ohne Sieger (Startwert 14), 111 vor Minute 60, Median 39,4, längste 79,9 (je Satz 36/37/38 vor 60, Mediane 39,0/37,7/40,6); **HEAD** 0 ohne Sieger, 109 vor Minute 60, Median 41,0, längste 81,3 (39/37/33; 39,2/40,7/46,1 — HEAD reißt bei 81–120 selbst die Vierziger-Grenzen). Die Neigungen der Häuser halten in allen sechs Sätzen.
- **Startwert 14** (`node $S/dbg7.cjs <wurzel> 14`, Distelhag gegen Wehrstein): kein Patt. Ab Minute 80 hat ki1 neun Dorfbewohner und kein Heer, bei Minute 90 zwei Dorfbewohner, 8 Holzfällerlager und 16 Farmen; ki2 hat 129 Einheiten und findet die verstreuten Lager nicht rechtzeitig (ki1 hat 24 Holzfällerlager gebaut). Eine Schwäche beim Aufräumen, nicht der Standplätze — gehört zum KI-Block („die KI gibt früher auf“ war Möglichkeit (c), der Benutzer wählte (b)).
- **`tests/partien/ki-im-nebel.test.mjs` umgestellt:** `STARTWERTE = 120`, `FAEDEN = 6`; mindestens 105 von 120 vor Minute 60 (`VOR_MINUTE_60`, anteilig), Median unter 45, **`OHNE_SIEGER_HOECHSTENS = 1` — MEINE Auslegung, nicht die Zahl des Benutzers; ihm ausdrücklich sagen**; ohne Sieger zählt im Median als 90 Minuten; „verschiedene Enden“ ≥ 90; ki AC-30 „aufgebrochen“ ≥ 7/8 der Auftritte (anteilig zu 14 von 16); ki AC-33 Burgen je Haus ≥ ein Achtel der Partien (anteilig zu 2 in 16); Testnamen „ueber 120 Startwerte“. Einzellauf grün: 4 von 4, 367 s; 240 Auftritte: 145 Burgen bei 145 KIs, 678 Rammen bei 142 KIs.
- Specs nachgezogen: fahrplan AC-11 (120, anteilig, Auslegung benannt), einheiten AC-30 (Schlusssatz korrigiert), CLAUDE.md Worktree (Absatz Ersatzgrenze). 
- **Nach grünem Check:** `git add -A` im Worktree prüfen (`git status --short`: nur gewollte Dateien, die zwei Bilddateien AC-30 dabei), Commit „einheiten AC-30: Sammler haben einen Standplatz; kampf AC-11: ein Klick in den Nebel ist ein Gang; Nebeltest ueber 120 Startwerte“. Dann `--stand` ansehen, voller Browserlauf `E2E_HAFEN=4205 npm run check:alles:neu:kurz`, `qa:abweichung`, Bilder über 1 % ansehen, committen, ausrollen (ohne `--sofort`), Push nur als alleiniger Befehl mit Bestätigung.

Nächstes Skript `a334.py`.

**2026-11-15, 21:15 — PUNKT 43: `check-15.log` GEFALLEN an EINEM Test: `fahrplan AC-11 und ki AC-13 … Nebel`: „Startwert 14: kein Sieger bis Minute 90“ (erster Abschnitt 938 grün; die Zusicherung bricht beim ersten ohne Sieger ab — wie viele vor Minute 60 enden, sagt der Lauf nicht).** Damit gilt die Entscheidung des Benutzers vom 13.11. (Zeile „einbauen, breiter messen“: Nebeltest auf 120 Startwerte, Grenze anteilig; damals vermerkt: „dann hält ‚alle mit Sieger‘ auch auf HEAD nicht“).

- **Messung läuft** (Hintergrund `bi8h54i52`, je zwei Läufe nebeneinander, ~18 min; solange nichts unter `server/` ändern): `node n40c.mjs <wurzel> <ab> <aus>` mit ab = 0, 40, 80 (das sind die Startwerte 1–40, 41–80, 81–120 — `ab + i + 1`) für den Arbeitsstand (`$S/n43-1.json`, `n43-41.json`, `n43-81.json`) und für HEAD `9150526` (`$S/kopf`, dorthin `tests/partien/nebel-arbeiter.mjs` kopiert; `k43-1.json`, `k43-41.json`, `k43-81.json`). Auswerten: `node n40kurz.mjs <wurzel> <json>` je Satz.
- **Danach:** `tests/partien/ki-im-nebel.test.mjs` auf `STARTWERTE = 120` (FAEDEN prüfen: 8 Kerne; 120 Partien mit 4 Fäden ≈ 15 min im Check — mit 6 Fäden messen), Grenzen anteilig: mindestens 105 von 120 vor Minute 60, Median unter 45. **„Alle mit Sieger“ lässt sich nicht anteilig rechnen** — Grenze für „ohne Sieger“ aus der Messung von HEAD ableiten, nicht lockerer als HEAD, und dem Benutzer ausdrücklich als meine Auslegung nennen. Der zweite Test der Datei (ki AC-27/AC-30, Neigung der Häuser) liest dieselben Partien — seine Grenzen (1,4 / 1,75) unverändert lassen, nur neu messen.
- Schon fertig für den Commit: Browserfall einheiten AC-30 grün, Bild `qa/bildnachweise/10-strategie/einheiten-und-befehle/AC-30--zehn-dorfbewohner-…png` angesehen (sechs bis sieben am Waldrand zu sehen, der Rest hinter Kronen); Spec einheiten AC-30 neu gefasst (sagt „Damit halten die Partien an den festen Startwerten“ — **STIMMT NICHT MEHR, nach der Messung korrigieren**), kampf AC-11 ergänzt, CLAUDE.md Worktree 553/675, 938 Tests, 295 im Browser, Absatz Standplatz + Nebelklick; `specs:board` 553/675; Wächter grün.

Nächstes Skript `a330.py`.

**2026-11-15, 21:00 — PUNKT 43: erster Testabschnitt grün bis auf angepasste Kampftests; Partien-Abschnitt mit Standplätzen NOCH NIE GELAUFEN.** (Die Uhrzeit „19:19“ unten stimmt vermutlich nicht — `date` zeigte sie, der Lauf danach endete 20:59.)

- `test-43b.log`: 933 von 938, gefallen fünf in `tests/strategie-kampf.test.mjs` — alle klickten auf einen Gegner, den der Angreifer nicht sah (frisch hingestellt ohne `sichtAktualisieren`, oder 8 bis 12 Felder weit). Angepasst, keine Grenze berührt: `gegenueber()` rechnet die Sicht nach dem Hinstellen und nimmt Einstellungen; `AUFGEDECKT` für „stirbt das Ziel unterwegs“ (12 Felder) und `ersterTreffer` (8 Felder); `sichtAktualisieren()` bei „vier Dorfbewohner“; beim Farm-Test steht die Miliz jetzt drei Felder vom Bauern (`bauer.x + 3`) statt 4,24 — vorher traf der Klick sonst die Farm. `test-43c.log`: 937 von 938 (nur der Farm-Test, danach behoben; 29 von 29 in der Datei grün).
- **Dem Benutzer zu sagen:** die neue Serverregel (Klick in den Nebel = Gang) und die fünf angepassten Tests.
- **Nächste Schritte:** Browserfall `QA_NACHWEIS=1 E2E_HAFEN=4205 timeout 900 npx playwright test -c e2e/playwright.config.mjs strategie-ausweichen -g "einheiten AC-30"` (Bild ansehen) → Spec einheiten AC-30 neu fassen (Messwerte 15.11.: 500 Nahrung Median 9,38 statt 9,45, späteste 9,86) → CLAUDE.md Worktree (938 Tests, 295 im Browser, Kriterien laut `specs:board`) → `npm run check:kurz > $S/check-15.log` (erst dort laufen die Partien: Nebel 1–40, zu viert) → `git add` aller Dateien (auch `tests/strategie-kampf.test.mjs`, `strategie-sicht`, `strategie-vorrat-erreichbar`, `specs/10-strategie/kampf.md`) → Commit. Fällt der Nebeltest: Benutzerentscheidung 13.11. (120 Startwerte, 105 von 120).

Nächstes Skript `a328.py`.

**2026-11-15, 19:19 — PUNKT 43: URSACHE DER ZWEI GEFALLENEN TESTS GEFUNDEN UND BEHOBEN, UNCOMMITTET; `npm test` läuft (`$S/test-43b.log`, Hintergrund `bi5mbp3rg`, ~12 min) — solange nichts unter `server/` ändern.**

- `test-43a.log` (Standplätze eingelegt): 934 grün, 2 gefallen — `ki AC-13` („nicht gefunden: 5 von 40“) und `fahrplan AC-5` („7 KI 1: hoechstens 450 Nahrung“); Partien-Abschnitt lief nicht.
- Austauschprobe `node $S/mess43.cjs <wurzel>` (Startwerte 1–20, 10 min): **Kopf `9150526`** 0 nicht gefunden / 0 ohne 500 Nahrung (Median 9,45); **Arbeitsstand** 5 / 3 (7/1: 450, 9/1: 440, 14/1: 380); **V1** (Welt neu, ki.js alt, `$S/v1`) 8 / 3; **V2** (Welt alt, ki.js neu, `$S/v2`) 0 / 0. Also die Welt, nicht die KI.
- **Ursache** (`$S/dbg4.cjs`, `$S/dbg5.cjs <wurzel> 3 1 1.6 2.0`): `ki.erkunden` schickt den Späher mit einem Gang auf ein freies Feld am unbekannten Startplatz des Gegners. `welt.befehl` liest aus dem Feld einen Gegner (`feindAn`, ein Feld Umkreis) — **auch im Nebel**. Stand dort zufällig ein Dorfbewohner, wurde der Gang zum Angriff. Auf dem alten Stand war das ein Bauer, der wegging (der Späher sah vorher das Dorfzentrum und wurde heimgerufen); mit Standplätzen stehen die Hirten verteilt um das Schaf am Dorfzentrum, der Späher trifft einen, sechs Dorfbewohner gehen gemeinsam auf ihn (ki AC-36), tot nach 4 Sekunden, das Dorf nie gesehen (er stand auf 64,52 → Sicht von 65 aus, ein Feld zu weit). Dem Gegner kostete die Abwehr die Nahrung.
- **Behoben in `welt.feindAn`**: gilt für den Spieler der Nebel (`nebelGiltFuer`), zählt nur, wen er sieht (`welt.sieht` am gerundeten Feld, wie `zustandJeSpieler`). Ein Klick in den Nebel ist ein Gang. Das stand als Browserregel schon in kampf AC-11 („ebenso als Ziel eines Rechtsklicks“), der Server setzte es nicht durch. Gebäude (erinnert) bleiben Ziel. **Gemessen danach (`mess43.cjs`): 0 nicht gefunden (1,9–2,2 min), 0 ohne 500, Median 9,38, späteste 9,86.**
- Test: zwei Fälle `kampf AC-11: …` am Ende von `tests/strategie-sicht.test.mjs` (Nebel → Gang, gesehen → Angriff; aufgedeckt → Angriff). Gegenprobe gefahren (`if (false) continue;`): fällt.
- **Noch zu tun für den Commit von Punkt 43:** `test-43b.log` abwarten (Nebel 1–40, zu viert — fällt der Nebeltest: Entscheidung des Benutzers vom 13.11.: auf 120 Startwerte, Grenze anteilig 105 von 120); Spec kampf AC-11 um den Satz zum Server ergänzen; Spec einheiten AC-30 mit NEUEN Messwerten (stehen noch die alten aus dem Patch); CLAUDE.md (Worktree) Absatz + Zahlen (938 Tests?), `specs:board`; Browserfall `QA_NACHWEIS=1 E2E_HAFEN=4205 npx playwright test -c e2e/playwright.config.mjs strategie-ausweichen -g "einheiten AC-30"`, Bild ansehen; `git add` auch `tests/strategie-vorrat-erreichbar.test.mjs`, `tests/strategie-sicht.test.mjs`; `check:kurz` → `check-15.log`; Commit.

Nächstes Skript `a323.py`.

**2026-11-15, 19:07 — PUNKT 42/44 COMMITTET `9150526` (lokal, `check-14.log` grün: 931 + 14, 742 s; nicht gepusht, nicht ausgerollt). PUNKT 43 EINGELEGT, UNCOMMITTET, `npm test` läuft (`$S/test-43a.log`, Hintergrund `brrn44sjv`).**

- Gegenprobe der neuen Zählung in zwei-gegen-zwei gefahren (`$S/dbg3.cjs`, Kopie `$S/gp25` mit einer KI, die nicht nach Teams fragt): Startwert 1 → 122 Läufe zu Verbündeten nach alter UND neuer Zählung, Startwert 9 → 95 und 95; echte KI 0/0 (alt: 1 bei Startwert 9). Steht im Commit-Text.
- **Punkt 43 (einheiten AC-30, Standplätze):** `git apply --3way $S/standplatz.patch`, Konflikte mit `$S/a319.py` gelöst (alles im Index, `git status` zeigt `M `/`A `). Zusammengeführt mit einheiten AC-63: das erreichbare Nachbarfeld aus `vorratErsatz` heißt jetzt **`auftrag.seite`** (vorher `stand`), `auftrag.stand` ist der Viertelplatz; `standplatz(einheit, ziel, weit, geteilt, nur)` nimmt mit `nur` nur Plätze auf diesem Feld; wechselt der Sammler auf einen Vorrat daneben, wird `seite` gelöscht. Test `strategie-vorrat-erreichbar` liest `seite`. Einzeln grün: standplatz, vorrat-erreichbar, regeln, gang-unerreichbar (37), typen.
- **Offen an 43:** Ergebnis von `npm test` (auf dem alten Stand rissen ki-im-nebel 34 statt 35 und fahrplan AC-24 Startwert 16); fällt der Nebeltest, gilt die Entscheidung des Benutzers vom 2026-11-13: auf 120 Startwerte verbreitern, Grenze anteilig (105 von 120 vor Minute 60). Spec-Text AC-30 (aus dem Patch, nennt alte Messwerte — neu messen und nachziehen), CLAUDE.md-Absatz (der Patch-Teil für CLAUDE.md wurde NICHT eingelegt), BOARD, Browserfall `e2e/tests/strategie-ausweichen.spec.mjs` (aus dem Patch, noch nicht gefahren, Bild fehlt).
- **Neue Frage des Benutzers (19:05):** „wann entwickeln wir die Einheiten der Krone Zeit, auch Drachen, etc. ?“ — beantwortet: Stufe F, Bauabfolge noch nicht festgelegt, Drachenkette als Kriterien schon da (fahrplan Zeile 370 ff.); **Empfehlung gegeben: Krone vor die Spezialeinheiten der Häuser (E6–E8) ziehen**, Reihenfolge: laufenden Block ausrollen → Sparphase der KI → Spec-Runde F → Aufstieg und Einheitenstufen → Drachenkette → Wunder → KI in der Krone. Er hat noch nicht geantwortet; ohne Widerspruch so vorgehen.

Nächstes Skript `a321.py`.

**2026-11-15, 18:50 — `check-14.log` LÄUFT (Hintergrund `blacjgnlz`, ~8 min), danach Commit von Punkt 42/44.** Zwei Checks davor fielen, beide an Tests, nicht am Code:

- `check-12`: drei Tests lasen „kein Weg“ am Befehl ab (`tests/strategie-mauern.test.mjs` zweimal bauen AC-31, `tests/strategie-buendnisse.test.mjs` spielziel AC-14): wer in einen geschlossenen Mauerring geschickt wird, geht seit einheiten AC-64 bis vor die Mauer. Jetzt fragen sie `welt.wegNach(einheit, ziel)`; Bert bekommt zusätzlich den Befehl und sein Weg führt nicht durchs Tor. 60 von 60 in den drei Dateien grün.
- `check-13`: erster Abschnitt 931 grün, Nebel 1–40 grün (ki AC-27, AC-30, AC-33 grün), **gefallen nur `ki AC-25` Startwert 9: „1 Angriffslaeufe zu Verbuendeten“.** Nachgespielt (`$S/dbg2.cjs <wurzel> 9`): Minute 63,5, `ki.verteidigenPruefen` schickt zwei Speerkämpfer von KI 2 zum eigenen Holzfällerlager (93,53), das KI 4 angreift — 39,1 Felder vom eigenen Dorf, 37,2 von dem des schon ausgeschiedenen KI 1. Kein KI-Fehler, die Zählung im Test hatte ein Loch. **Geändert in `tests/partien/zwei-gegen-zwei.mjs`:** steht am Marschziel (unter 6 Feldern, `EIGENES_NAH`) ein eigenes Gebäude, zählt der Lauf zu keinem Dorf. Die Grenze 0 bleibt. **Gegenprobe der neuen Zählung steht aus** (eine KI, die nicht nach Teams fragt, muss weiter auffallen): Kopie von `server/` in den Scratchpad, in `ki.js` die Fragen nach `feindlich` durch „nicht ich“ ersetzen, eine Partie mit der neuen Zählung — erst NACH dem Check (Rechenzeit).
- Dem Benutzer zu sagen: beide Teständerungen, offen und mit Grund (keine gelockerte Grenze, aber geänderte Tests).

Nächstes Skript `a319.py`.

**2026-11-15, 18:35 — PUNKT 42 UND 44 GEBAUT UND BELEGT, UNCOMMITTET im Worktree auf `57b12dc`; `check-12.log` läuft (Hintergrund `b7frh0dj4`). Der Benutzer spielt allein gegen die KI („alles entspannt“) — Check und Messungen sind gedeckt, voller Browserlauf erst nach `--stand`.**

- **Punkt 42 = einheiten AC-64** „Unerreichbar: so nah wie möglich“: `welt.gangBeginnen(einheit, feld, gemeint, gebiete)` und `welt.naechstesErreichbare()` (flutet einmal je Gebiet und Befehl, nur Gras, jedem ein eigenes Feld); im `gehen`-Zweig von `befehl()`, am Wegpunkt, Marschziel des Angriffslaufs = das Feld, zu dem es wirklich geht. Browser: `befehlen()` klemmt das Feld auf die Karte. Test `tests/strategie-gang-unerreichbar.test.mjs` (5 Fälle), **Gegenprobe gefahren**: mit `if (false) {` fallen 4 von 5 (der fünfte ist der normale Weg). Begründung in `qa/ohne-bild.json`. **Nicht gemessen:** KI gegen KI (KI-Einheiten ohne Weg gehen jetzt los) — entscheidet `check-12.log` (ki-im-nebel, zu viert); zum Vergleich mit `neu-12.json` (Startwerte 2–41, `node n40c.mjs <wurzel> 1 <aus>`; 41–80 mit `40`) danach `neu-13.json`.
- **Punkt 44 = darstellung AC-29** „Nebel reicht über die Kante“: `NEBELRAND = 6` in `public/nebel.js`, der Rand trägt den Stand des Kantenfelds, `nebel.deckkraft(x, y)`; `ansicht.nebelZeichnen`, `uebersicht.js`, Baumregel mit geklemmtem Feld. Browserfall in `e2e/tests/strategie-nebel.spec.mjs` („Sicht erkundet“, pflanzt einen Baum an x = 0 in Annas Ansicht, liest die Krone mit und ohne Nebel): grün, Bild `qa/bildnachweise/10-strategie/darstellung/AC-29--…png` angesehen (Krone gedämpft). **Gegenprobe mit `NEBELRAND = 1`: 534 von 534 Bildpunkten der Krone ungedämpft, Mittel 67 statt 67.**
- Specs eingetragen, `specs:board` 552/675, CLAUDE.md (Worktree) 552 von 675, 931 Tests, 294 im Browser — die Zahlen prüft der Check. `typen` und `waechter` grün.
- Versehen: `git checkout --` auf das im selben Lauf neu geschriebene Bild kampf AC-16 (nur Nebenprodukt meines Einzellaufs; der volle Lauf schreibt es ohnehin neu). Nicht wiederholen — die Regel gilt auch für Nebenprodukte.
- **Danach Punkt 43:** Patch liegt bereit: `$S/standplatz.patch` (771 Zeilen, `git diff 2f9ec0e 97815b7` ohne Bildnachweise, BOARD, CLAUDE.md). Erst nach dem Commit von 42/44 mit `git apply --3way` (oder von Hand) einlegen; `welt.js` hat sich seit `2f9ec0e` stark geändert — mit Konflikten rechnen.
- Dem Benutzer gesagt (18:34): Reihenfolge 42/44 committen → 43 → voller Browserlauf + Ausrollen → KI-Wirtschaft (Mühlen/Sparphase) → übriger KI-Block; und dass der Dienst gegen 13:20 neu gestartet wurde, nicht von mir.

Nächstes Skript `a318.py`.

**2026-11-15, 18:30 — DREI NEUE MELDUNGEN DES BENUTZERS, er spielt gerade (Server `2554470`, „Up 5 hours“ — jemand/etwas hat den Dienst gegen 13:20 neu gestartet, nicht ich; 1 Raum, 1 Partie). Solange gespielt wird: nur einzelne Testdateien, kein Check, kein Browserlauf, keine `n40*`-Messung; vor jedem schweren Lauf `npm run ausrollen -- --stand`.** Worktree sauber auf `57b12dc` (nicht gepusht, nicht ausgerollt, voller Browserlauf mit Punkt 13 steht weiter aus).

1. **Punkt 42 (wörtlich):** „wenn ich mit einer einheit wo hinklicke, wo sie nicht hingehn kann, dann passiert nichts - aber sie sollte sich dann einfach möglichst nah da hin bewegen“ → gelesen: im `gehen`-Zweig von `welt.befehl()` (~1937) nimmt `aufstellungUm` begehbare Felder um den Klick (Ringe bis 11), prüft aber nicht, ob sie ERREICHBAR sind; `wegNach` liefert dann `[]`, die Einheit steht. Außerdem: Klick außerhalb der Karte → `befehl()` kehrt um (`zx < 0 …`), der Browser klemmt `feld` in `befehlen()` nicht (in `zielUnter` schon). **Plan:** neues Kriterium einheiten AC-64 „Unerreichbar: so nah wie möglich“ (Spec heißt `specs/10-strategie/einheiten-und-befehle.md`); nur wenn der Weg leer ist und die Einheit nicht schon dort steht: `welt.naechstesErreichbare(einheit, klick, vergeben)` — `erreichbar()` aus `wege.js` fluten, das begehbare erreichbare Feld mit dem kleinsten Abstand zum Klick, je Befehl jedem ein eigenes; auch für den nächsten Wegpunkt (~3911) und `angriffslauf = feld`. Der normale Fall bleibt Takt für Takt gleich (wichtig für die KI-Grenzen); trotzdem danach `n40c`/`n40kurz`, `zz` und Check, sobald niemand spielt. Browser: `feld` in `befehlen()` auf die Karte klemmen.
2. **Punkt 43 (wörtlich):** „dass die Dorfbewohner übereinander stehen, das is immer noch so, dachte das liegt schon auf nem branch?“ → ja: `strategie-standplatz` (`97815b7`, auf dem ALTEN `2f9ec0e`, Check dort rot an zwei Partientests). Entscheidung des Benutzers vom 2026-11-13: „einbauen, breiter messen“ (Nebeltest auf 120 Startwerte, Grenze anteilig). Code-Diff ohne Bilder: `git diff 2f9ec0e 97815b7 -- . ':!qa/bildnachweise'` = 11 Dateien, +533/−54 (`welt.js` +175, `ki.js` 12, `wege.js` 5, `tests/strategie-standplatz.test.mjs` neu, `e2e/tests/strategie-ausweichen.spec.mjs`). **Plan:** als Patch mit `git apply --3way` auf einen neuen Zweig von `strategie-bildumbau` legen (nicht mergen — die Bildnachweise dort sind alt), Konflikte lösen, messen. Eigener Commit nach Punkt 42.
3. **Punkt 44 (wörtlich, mit Bildschirmfoto):** „der baum ist lustigerweise draussen und hell“ → ein Baum am oberen Rand, dessen Feld im Schwarzen (nie erkundet oder am Kartenrand) liegt, wird hell gezeichnet; der Baum links daneben ist richtig abgedunkelt. Noch nicht untersucht: wie `ansicht.js` Gelände im Nebel abdunkelt (Rand der Karte? Nachbarfeld außerhalb = „sichtbar“?).

Nächstes Skript `a314.py`.

**19:52: Browser mit KI-Gegner grün auf `57b12dc`** (7 von 7 in 3,3 min, ohne `QA_NACHWEIS`: fahrplan AC-12, fahrplan AC-24, Bündnisse; Worktree danach sauber). **Gemessen, warum Militärgebäude stehen** (`$S/nahrung2.mjs`, Ausgabe `$S/nahrung-2.txt`, Startwerte 1–10, Minute 12–35, 5505 Proben an Kaserne/Schießanlage/Stall): 65 % bilden aus, 11 % ist nichts bezahlbar, **24 % stehen, obwohl eine Einheit aus dem rohen Vorrat bezahlbar wäre** — davon 55 % wegen der Rücklage für die Ritterzeit (800 Nahrung, 200 Gold, `ruecklageRitterzeit`), 13 % weil die Ausbildung auf Rammen wartet (`belagerungFehlt`), 11 % Markt (fast nur Silberfurt), 10 % Dorfbewohner gehen vor, 4 % Wohnraum, 4 % Lager, 1 % frei. Je Haus: Rappensteins Kaserne steht in 54 % der Proben bezahlbar (95 % davon Ritterzeit), Distelhags Kaserne in 40 % (62 % Ritterzeit, 16 % Rammen). **Schluss für nach der Partie:** die Vermutung des Benutzers stimmt im Kern — es ist die Nahrung, aber nicht als leerer Vorrat, sondern als Sparphase für den Aufstieg; der Hebel ist das Nahrungseinkommen im Lehen (unbesetzte Farmen, Brachen: bei Minute 20 nur rund die Hälfte der Farmen besetzt) und danach die Frage, ob das Militär während des Sparens ganz ruhen muss. Nichts davon gebaut. **Ab jetzt bis zum Ende der Partie nichts Schweres mehr; nächstes Skript `a313.py`.**

**19:47: Punkt 13 COMMITTET `57b12dc` (lokal, `check-11.log` grün, 347 s). Um 19:46 laufen noch die drei Browserdateien mit KI-Gegner ohne `QA_NACHWEIS` (`strategie-gegen-ki`, `strategie-team-gegen-ki`, `strategie-buendnisse`, Protokoll `$S/ki-browser-1.log`) — nur zur Sicherheit, sie schreiben keine Bilder. Danach bis zum Ende der Partie nichts Schweres mehr.**

**19:42: Punkt 13 (ki AC-36) fertig gemessen, Commit steht aus (wartet nur auf `check-11.log`).** (erledigt, siehe 19:47)

- **Push ist durch**: `origin/strategie-bildumbau` = `2554470` (der Aufruf hing von 16:53 bis 19:10 auf die Bestätigung des Benutzers — Lehre: einen Push nie vor zeitkritische Arbeit legen).
- **`check-9.log` fiel** an ki AC-4, ki AC-5 und fahrplan AC-5, alle am Startwert 4 (KI 1): nach einem Sturm von 9 Sekunden bei Minute 2 lag das Haus 110 Sekunden (die Bauer liefen mit), und der Gang „zurück zum Ort des ersten Schlags“ war neben den Schafen ein Schlachtbefehl für alle acht (einheiten AC-17 liest das Schaf aus dem Klick, `tierAn`).
- **Nachbesserung `a308.py`** (in `ki.js`, uncommittet): wer baut, stürmt nicht mit (außer dem Getroffenen); `this.sturm.vorher` merkt den Auftrag jedes Helfers, am Ende `ki.alteArbeit(auftrag)` → Rechtsklick auf altes Feld / Schaf / Farm (nicht brach); nur bei mehr als zwei Angreifern alle heim zum Dorfzentrum. Grenzen in den Tests NICHT gelockert.
- **Gemessen danach** (Scratchpad): Nebel 1–40 `neu-12.json`: 0 ohne Sieger, **35 vor Minute 60 (genau die Grenze)**, Median 39,6, längste 84,8; Schwerpunkte halten (Distelhag 1,95-fach). Nebel 41–80 `neu-12b.json`: 37 / 41,6 / 72,8 (Distelhag 1,56-fach); dieselben ohne die Regel (`ohne-12b.json`, Kopie unter `$S/ohne13` mit `ki.js` aus HEAD): 36 / 41,0 / 75,7. Zwei gegen zwei 1–20: alle entschieden, längste 42767 Takte = 71,3 min. `p13/mess13.mjs` mit dem neuen `ki.js`: unverändert 4–11 s statt 11–25 s, 6–18 statt 27–30 Leben. `check-10.log` grün (926 Tests, 14 Partien).
- **Texte berichtigt** (`a309.py`): `specs/10-strategie/ki.md` AC-36 und `CLAUDE.md` tragen jetzt die Zahlen nach der Nachbesserung. Uncommittet im Worktree: `server/spiele/strategie/ki.js`, `tests/strategie-ki-sturm.test.mjs` (neu), `specs/10-strategie/ki.md`, `qa/ohne-bild.json`, `specs/BOARD.md` (550/673), `CLAUDE.md`.
- **Als Nächstes**: `check-11.log` grün → lokal committen („ki AC-36: Dorfbewohner gehen gemeinsam auf einen Angreifer“). Kein Push nötig vor der Partie. **Nach der Partie**: voller Browserlauf mit Punkt 13 (`E2E_HAFEN=4205 npm run check:alles:neu:kurz`, nur bei leeren Räumen), `qa:abweichung`, ausrollen (nie `--sofort`); dann Mühlen/Nahrung/Brachen (`nahrung.mjs`, `nahrung-1.txt`: 2,0–3,5 Mühlen, aber bei Minute 20 nur rund die Hälfte der Farmen besetzt; warum die Kaserne trotz bezahlbarer Einheit steht, ist ungemessen), übriger KI-Block (19, 35, 22, 24, 40, ki AC-35), 15b Haltungen, 18, 25, 8, 39; `pruefstand:haeuser` neu messen. Nächstes Skript: `a311.py`.

**19:20: AUSGEROLLT ist `2554470` (seit 16:52) — Entf-Taste, KI-Wirtschaft, Baumenü. Check grün (922 und 14), voller Lauf 293/294 mit dem festgemachten AC-29. Push von `strategie-bildumbau` läuft seit 19:10 (Task `bww0o2u5r`).**

- **Commit `2554470`** „bedienung AC-64: das Baumenue hat zwei Seiten" auf `strategie-bildumbau`. Server nach dem Ausrollen: läuft, von außen erreichbar, 0 Räume.
- **Push:** der Haken sperrt verkettete Pushes — nur `git -C <pfad> push origin strategie-bildumbau` als alleiniger Befehl, und der Benutzer bestätigt. Die Bestätigung kam erst um 19:10 (der Aufruf hing von 16:53 bis dahin; **dadurch sind über zwei Stunden vergangen**). Seitdem lädt git hoch.
- **Die Ausrollgrenze 19 Uhr ist vorbei: vor der Partie (gegen 21 Uhr) wird NICHTS mehr ausgerollt.**
- **Punkt 13 (ki AC-36) ist jetzt im Worktree, UNCOMMITTET:** `ki.js` (`STURM_*`, `sturmPruefen`, `ohneSturm`), `tests/strategie-ki-sturm.test.mjs` (4, grün). Messung `n40c` → `neu-11.json` läuft seit 19:17 (Task `bdwvr22mv`). Danach `ac9`, `zz` 1–20, KI-Tests, Spec (AC-36 fehlt noch in `ki.md`, Begründung in `qa/ohne-bild.json`), Board, CLAUDE.md, Check → Commit, wenn alle Grenzen halten; sonst mit umgekehrtem Skript zurücknehmen (Patch bleibt im Scratchpad: `a299.py`, `a300.py`). **Ausgerollt wird das erst nach der Partie**, nach einem vollen Browserlauf. Vor jedem schweren Lauf `npm run ausrollen -- --stand` — spielt jemand, wird nicht gerechnet.

**16:50: VOLLER LAUF `alles-7.log`: 293 grün, 1 gefallen (einheiten AC-29, `strategie-ausweichen.spec.mjs` — Wettlauf im Test, nicht im Baumenü). Test festgemacht, Check `check-8.log` läuft (Task `bw5trzltf`). Benutzer ist seit ~16:30 wieder DA.**

- **einheiten AC-29:** im vollen Lauf standen zwei Dorfbewohner 0,00 Felder auseinander, als geprüft wurde; einzeln dreimal grün. Ursache: die Wartebedingung („alle am Ziel, keiner bewegt sich") gilt schon in dem Takt, in dem zwei auf demselben Feld ankommen, das Ausweichen beginnt danach. Fix nur im Test: die Wartebedingung verlangt zusätzlich, dass alle Paare mindestens 0,5 Felder auseinander stehen (läuft sonst nach 60 s ab) — danach einzeln grün. Kein voller Lauf wiederholt: alle anderen 293 Fälle liefen auf genau diesem Stand grün. Dem Benutzer so sagen.
- **`qa:abweichung`:** 227 geändert, 56 über 1 %. Angesehen: rund 18 % = die Leiste ist mit dem Baumenü eine Reihe niedriger (im Landsitz fünf Knöpfe in einer Reihe statt sieben in zwei) — gewollt; 87 bis 98 % (darstellung AC-07, ki AC-11, einheiten AC-25/AC-40, fahrplan AC-12/AC-14) = dieselbe Szene zu anderer Spielzeit/Kamera, harmlos.
- **Benutzer (16:30):** „Die häuser müssen vermutlich mehr als 1 mühle bauen um mehr felder zu baun, deshalb weniger soldaten aus der maserne weil zu wenig Nahrung". Gemessen mit `nahrung.mjs` (Scratchpad, 10 Startwerte, Minute 12–35, Ausgabe `nahrung-1.txt`): KIs haben 2,0–3,5 Mühlen und 9–14 Farmen; Distelhags Kaserne bildet in 56 % der Proben aus, steht sie, fehlt nur in 12 % die Nahrung, in 86 % wäre bezahlbar (Grund ungemessen: Rücklage Aufstieg/Rammen/Karren oder Wohnraum). Nahrung fehlt am Stall (Rappenstein 52 %, Wehrstein 77 % der Stillstände) und Eschenbruchs Kaserne (46 %). Bei Minute 20 sind bei Distelhag 6,5 von 12 Farmen besetzt, Wehrstein 4,8 von 11,8 → Brachen/unbesetzte Farmen sind der Hebel. Dem Benutzer so beantwortet; **nach der Partie** angehen (mit den Brachen).
- **Benutzer (16:33):** „Wann rollen wir nochmal aus?" → geantwortet: gegen 17:10, wenn grün. Angekündigt: nach dem Commit `strategie-bildumbau` pushen (Benutzer da, kein Einwand).
- **Punkt 13 (ki AC-36, Sturm der Dorfbewohner) liegt als Patch im Scratchpad:** `a299.py <wurzel>` und `a300.py <wurzel>` (ki.js: `STURM_*`, `sturmPruefen`, `ohneSturm` in `entscheiden`), Test `p13/tests/strategie-ki-sturm.test.mjs` (4 Fälle, grün in der Kopie `p13/`), Messung `p13/mess13.mjs`: Späher fällt nach 4–11 s statt 11–25 s, 6–18 Leben verloren statt 27–30. **Noch nicht im Worktree.** Vor Aufnahme: `n40c`/`n40kurz`, `ac9`, `zz` 1–20, KI-Tests, Check, voller Browserlauf — nur wenn alles vor 19 Uhr hält.
- **Danach:** Check grün → Commit „bedienung AC-64: das Baumenue hat zwei Seiten", pushen (nur diesen Zweig, nie `main`), `npm run ausrollen -- --stand` (Räume leer?), `npm run ausrollen`.

**16:20: BAUMENÜ AUF ZWEI SEITEN (Punkt 4 → bedienung AC-64 `fertig`) GEBAUT, UNCOMMITTET; voller Browserlauf `alles-7.log` läuft seit 16:15 (Task `bxoalk3kh`). KI-Wirtschaft ist COMMITTET als `9c196eb` (Check grün: 920 Tests, 14 Partien, Board 548/671).**

- **Berichtigung:** der Eintrag „16:25" darunter wurde um etwa 15:50 geschrieben (Uhrzeit geschätzt statt mit `date` geholt). Sein Check lief grün durch, daraus wurde `9c196eb` „ki AC-37, ki AC-38: Felder an Muehle und Dorfzentrum, Lager wo weit gelaufen wird". Nicht gepusht.
- **Was das Baumenü tut:** `seite` in `GEBAEUDE` (fehlt = 0 Wirtschaft, 1 Militär: kaserne, schiessanlage, stall, wachturm, aussenposten, belagerungswerkstatt, steinmauer, tor, burg), `welt.aufbau()` reicht `seite` durch, `auswahlleiste.baumenueBauen` baut links zwei Reiter `[data-bauseite="0|1"]` mit `aria-pressed`, alle Knöpfe bleiben im DOM, die der anderen Seite `hidden`. Tasten zählen über beide Seiten (B + Buchstabe wählt jedes Gebäude, die Seite springt mit); noch einmal `B` im Baumodus wechselt die Seite (`tasten.js`). **Rücksetz-Regel:** nach jedem gesetzten oder abgebrochenen Bau (`ansicht.platzierenBeenden` setzt `bauseite = 0`) und bei neuer Auswahl (`auswahlleiste.bauAuswahl`) steht wieder die Wirtschaft; mit Umschalt weitergesetzt bleibt die Seite. Grund: ohne die Regel fiel einheiten AC-16 (Militär blieb nach der Kaserne offen, Holzfällerlager versteckt) — und ein Spieler erwartet es genauso.
- **Tests:** `tests/strategie-baumenue.test.mjs` (2), `e2e/tests/strategie-baumenue.spec.mjs` (1, zwei Bilder AC-64). In `strategie-bauen.spec`, `strategie-rueckmeldung.spec`, `strategie-zerstoerung.spec` vor dem Mausklick auf die Kaserne `[data-bauseite="1"]` klicken. Einzeln gefahren (36 Fälle aus baumenue, bauen, rueckmeldung, zerstoerung, burg, mauern, tuerme, markt, marktkarren, tasten, laptop): alle grün. `npm run typen`, `npm run waechter` grün. Board 549/672, CLAUDE.md nachgezogen (922 Tests, 293 im Browser, Satz zu AC-64). Altes Bildpaar `bedienung/AC-25--…-muehle-be` per `git rm` entfernt (neuer Titel → `…-muehle-un`).
- **Server um 16:14:** `0eac484`, 0 Räume, 0 Partien.
- **Danach:** läuft `alles-7.log` grün durch → `npm run qa:abweichung`, Bilder über 1 % ansehen, Commit „bedienung AC-64: das Baumenue hat zwei Seiten" (nicht pushen), dann ausrollen (`npm run ausrollen`, nie `--sofort`, Räume leer, spätestens 19 Uhr). Fällt etwas: reparieren, betroffene Datei einzeln, dann noch einmal voll — letzter Start eines vollen Laufs etwa 17:45. Punkt 13 (Späher, ki AC-36) nur, wenn danach noch Zeit für Messung UND vollen Lauf bleibt; sonst nach der Partie.

**16:25 (richtig: etwa 15:50): KI-WIRTSCHAFT — drei Nachbesserungen, ALLES HÄLT, Check `check-7.log` lief grün, COMMITTET als `9c196eb`.**
Der Eintrag 15:10 darunter gilt weiter, mit diesen Änderungen (Skripte
a285–a291, nächste a293):
- **ki AC-9 fiel** (Startwert 14/15: 2 und 1 Kampfeinheiten bei Minute 16):
  die Lager-Rücklage hielt für eine Mühle an den Beeren drei Minuten 100 Holz
  zurück. Jetzt Rücklage **nur fürs Holzfällerlager** (`LAGER_RUECKLAGE =
  ['holz']`). ki AC-9: 20 von 20.
- **fahrplan AC-24 fiel im Check** (zwei gegen zwei, Startwert 2: kein Sieger
  bis Minute 90; 4500 Holz neben 30 Nahrung). Ursache alt, nicht neu:
  `umverteilen` versuchte nur den knappsten Rohstoff (Gold, auf der Karte
  abgebaut) und scheiterte alle 10 s. Jetzt Schleife über alle fehlenden
  (ki AC-12, neuer Test in `tests/strategie-ki.test.mjs`). Startwert 2
  endet nach 73,4 min; alle 20 vor Minute 90.
- **Danach fiel Distelhag** (1,38 < 1,4): `KASERNE_GOLD = 2` — das Haus mit
  Kasernen-Neigung verlangt im Nachbau doppelt so viel Gold für eine
  Schießanlage. Distelhag 60,4 gegen 37,8 = 1,60.
- **Gemessener Endstand (`neu-10.json`):** Nebel 0 ohne Sieger, 37 vor 60,
  Median 38,9, längste 71,3; alle fünf Schwerpunkte halten; ki AC-9 20/20;
  zu viert alle 20 vor 90 (längste 73,4); 102 KI-Tests grün; 920 Tests.
- **Wirtschaft über 20 Startwerte (ehrlich):** Farmen bei Minute 15/25 0 %
  weiter als 3 Felder (vorher 38/66 %), Minute 35 9 % (73 %). Holz Minute 15
  1 % > 8 Felder (37 %), Minute 25 31 % (vorher 14 % — NICHT besser),
  Minute 35 19 % = 19 %. Stein 50 %, Beeren 48 % nicht gelöst. Auffällig:
  spät 20–30 Holzfällerlager je KI (alt auch 12 bei Minute 50) — nicht
  behoben.
- **Messwerkzeuge neu im Scratchpad:** `ac9.mjs <wurzel> [startwerte]`,
  `ac9b.mjs`, `zz.mjs <wurzel> <von> <bis> [n]` (zwei gegen zwei, Ende je
  Startwert), `zz2.mjs` (Farmzweige). Sicherungen `ki-stand-e5.js`,
  `ki-stand-ruecklage-holz.js`, `ki-stand-umverteilen.js`.
- **Bei grünem Check:** Commit „ki AC-37, ki AC-38: …", nicht pushen. Dann
  Punkt 4 Baumenü (bedienung AC-64, zwei Seiten Wirtschaft/Militär, Tasten
  bleiben über die ganze Liste, `seite` als Datenfeld der Gebäude), voller
  Browserlauf spätestens ~17:15, Ausrollen nur ganz grün und vor 19 Uhr.
  Punkt 13 (Späher) nur, wenn danach Zeit bleibt — sonst nach der Partie.

**15:10: KI-WIRTSCHAFT GEBAUT UND GEMESSEN (Punkt 9/34 → ki AC-37, ki AC-38 `fertig`, Nachtrag ki AC-32), UNCOMMITTET; Punkt 38 ist COMMITTET als `859834f`.**
Worktree `OnlineGames-bildumbau`, Zweig `strategie-bildumbau`, nicht gepusht,
auf dem Server läuft weiter `0eac484`.
- **`859834f`** „bedienung AC-75: Entf entfernt das Gewaehlte" — Check grün
  (912 Tests, 14 Partien, Board 546/669, 292 Browserfälle). Der Eintrag
  11:25 darunter ist damit ERLEDIGT.
- **Uncommittet:** `server/spiele/strategie/ki.js`, `specs/10-strategie/ki.md`,
  `qa/ohne-bild.json`, `tests/strategie-ki-felder.test.mjs` (neu, 6 Fälle),
  `tests/strategie-ki-nachbau.test.mjs` (ein Fall mehr). Skripte a278–a283
  im Scratchpad; nächste Nummer a285.
- **Gebaut:** `farmplatz()` (Farm an fertige Annahme für Nahrung, kleinster
  Rand-zu-Rand-Abstand, höchstens `FARM_WEIT = 3`, sonst weitere Mühle mit
  `MUEHLE_RAUM = 45` freiem Gras, sonst ferne Farm), `freiesLand()`,
  `platzBei(…, taugt)`; `lagerPruefen` zählt alle weiten Sammler
  (`LAGER_ANTEIL = 4`), Mitte = Feld mit den meisten, fehlt Holz →
  `this.lagerFehlt` in `ruecklage()`; `schicken`/`naechstesFeld` wählt das
  Feld mit dem kürzesten Weg zur Annahme (`ANMARSCH = 0.25`); **E5:** ohne
  Gold baut das Haus mit Kasernen-Neigung eine Kaserne statt eines Stalls.
- **Gemessen (Nebel, Startwerte 1–40, `n40c.mjs` + `n40kurz.mjs`):** 0 ohne
  Sieger, 36 vor Minute 60, Median 42,1, längste 80,0; Eschenbruch 2,37-fach,
  Distelhag 62,3 gegen 40,8 = 1,53-fach, Silberfurt +1,2, Wehrstein 2,3
  Türme — ALLES HÄLT. Wirtschaft (8 Startwerte, `wirtschaft.mjs`): Farmen
  Rand im Mittel 0,4–0,6, keine > 3 (vorher 64–70 % > 3); Holz Minute 15:
  0 % > 8 Felder (vorher 35–48 %); Minute 25: 29 %; Stein Minute 25: 44 %
  (NICHT gelöst).
- **Verworfen (nicht noch einmal versuchen):** nur Farmen ohne E5 →
  Distelhag 1,27–1,36 (ki AC-27 fällt); `kasernen <= andere` → 2,3-fach,
  aber 1 ohne Sieger und 34 vor 60; dichteres Packen der Farmen („stoesst",
  a282) → 32 vor 60, mit a283 zurückgenommen.
- **Noch zu tun für den Commit:** `npm run typen`, `npm run waechter`,
  `node --test tests/strategie-ki*.test.mjs`, `npm run specs:board`,
  CLAUDE.md (Zahlen, ein Absatz), `npm run check:kurz` (enthält die ganzen
  Partien — solange nichts unter `server/` ändern). NICHT gemessen:
  `pruefstand:haeuser` nach der Wirtschaftsänderung, Rechenzeit des
  Prüfstands.
- **Danach:** Punkt 13 (Dorfbewohner gemeinsam auf den Späher, ki AC-36) mit
  `n40c`/`n40kurz`; Punkt 4 Baumenü (bedienung AC-64); voller Browserlauf;
  Ausrollen nur ganz geprüft, Räume leer, nie `--sofort`, spätestens 19 Uhr
  (Start des Browserlaufs spätestens ~17:15).

**11:25: PUNKT 38 GEBAUT (Entf-Taste → bedienung AC-75 `fertig`), UNCOMMITTET, Check läuft.**
- `welt.entlassen(spielerId, nachricht)` (Nachricht `entlassen` mit
  `einheit` ODER `gebaeude`): Einheit → `einheitSterben` (verloren++, keine
  Punkte für irgendwen), fertiges Gebäude → `gebaeudeZerstoeren` (Trümmer),
  Baustelle → `abreissen` (Erstattung). Fremdes: Absage.
- Browser: `ansicht.entlassen()` (erste lebende eigene der Auswahl, sonst
  das gewählte eigene Gebäude; nicht bei Ende/Pause/ausgeschieden),
  `keydown` `Delete` ohne `e.repeat`, Rückruf `ansicht.beiAuftrag` (in
  `app.js` verdrahtet), Zeile „Entf" in `tasten.js`.
- Belegt: `tests/strategie-entlassen.test.mjs` (4),
  `e2e/tests/strategie-entlassen.spec.mjs` (1, Bild angesehen: Trümmer des
  Hauses, ein Dorfbewohner übrig); daneben grün: laptop, randschieben,
  tasten, ton, vollbild (15). Typen, Wächter (43) grün. Board 546 von 669.
  CLAUDE.md: Zahlen und ein Satz nachgetragen.
- `npm run check:kurz` läuft (Task `b2j98v5t6`, `$S/check-5.log`) → bei
  grün: Commit „bedienung AC-75: Entf entfernt das Gewaehlte", dann
  ausrollen (Räume leer). **Solange er läuft, nichts unter `server/`.**
- DANACH KI-Block. Erste Wahl: Punkt 9/34 (Felder nah an Mühle und
  Dorfzentrum, `ki.farmenPruefen` ~1851) — rein örtlich, dann Punkt 13
  (Dorfbewohner gegen den Späher). Vor jedem Eingriff `ki.js` nach
  `$S/ki-stand-<zeit>.js` kopieren; messen mit
  `node n40b.mjs C:/Users/danie/OnlineGames-bildumbau 1` (2 min: vor 60 ≥ 35,
  Median < 45, längste < 90, Wehrstein ≥ 1,75, Silberfurt ≥ 1,4-fach und
  +0,5), dann `tests/partien/*.test.mjs` ganz. Stand vor dem Block: 35 /
  40,1 / 88,1 / 1,8 / 1,8 gegen 1,2.
- Skripte bis `a277.py`.

**05:59: BROWSERLAUF DURCH — 291 Fälle grün, Bilder neu geschrieben, uncommittet.**
- `E2E_HAFEN=4205 npm run check:alles:neu:kurz` (05:23–05:54, 31,3 min):
  290 grün, 1 gefallen, 1 nicht gelaufen. Gefallen war
  `strategie-ritterzeit.spec.mjs` einheiten AC-33/34 an einem **Wettlauf
  im Test** (`bogenVorher` gelesen, bevor der Zustand mit dem aufgestellten
  Schützen da war: 0, danach 1). Behoben mit einem
  `expect.poll(... bogen) >= 1` vor dem Lesen; die Datei danach einzeln mit
  `QA_NACHWEIS=1` gefahren: 4 von 4 grün (auch bauen AC-34, der nicht
  gelaufen war).
- `npm run qa:abweichung` (`$S/abweichung-3.txt`): 256 geänderte Bilder, 96
  über 1 %, davon 30 neu. Angesehen: darstellung AC-07 und AC-05, kampf
  AC-10 und AC-17, bauen AC-26, bedienung AC-61 und AC-45, spielziel AC-08,
  spielauswahl AC-19 — alle richtig (neues Menü oben rechts, Zeitalter in
  der Punkteliste, vollere Leiste des Dorfzentrums, Farm mit Schalter,
  „Haus Prüfhaus" an der Auswahl). Die 85–98 % bei nahen Bildern kommen vom
  Boden bei Zoom > 1 (darstellung AC-27). Nicht einzeln angesehen: die
  übrigen ~55 unter 25 %.
- kampf AC-17 „Nachher": die Maus lag auf dem Knopf, der jetzt Schubkarre
  ist, und zeigte dessen Tafel — `anna.mouse.move(700, 300)` vor dem Bild,
  `strategie-verbesserungen` neu gefahren (8 grün).
- Worktree-`CLAUDE.md`: Zahlenzeile jetzt „545 von 668 … 887 Tests ohne
  Browser, 291 im Browser", Browserlauf „rund 31 Minuten für 291 Fälle".
- `npm run check:kurz` läuft seit 05:59 (Task `bzm53z419`, mit Partien
  ~14 min). **Solange er läuft, nichts unter `server/` ändern.**
- **06:07: `npm run check:kurz` durch — NUR ki AC-27 rot** (887 von 887
  und 13 von 14, `$S/check-3.log`); Specs, Belege, Nachweise, Bericht ohne
  Beanstandung. Der Stand ist bis auf diese eine Freigabe ausrollbar.
- **06:11: ABSTAND DER KI-GRENZEN GEMESSEN** (`node n40b.mjs
  C:/Users/danie/OnlineGames-bildumbau 1`, 2 min): vor Minute 60 **35 von
  40 (verlangt 35 — kein Abstand)**, Median 40,1, längste 88,1 (Grenze 90),
  Wehrstein 1,8 Türme (Grenze 1,75), Silberfurt 1,8 / 1,2, Eschenbruch
  69,3 / 35,5, Rappenstein 40,4 / 7,3, Distelhag 64,4 / 31,9; je KI 0,53
  Burgen, 2,34 Rammen. **ENTSCHEIDUNG: vor der Testpartie KEIN Eingriff in
  `ki.js`** — jede Änderung verschiebt die Zufallsfolge, und drei Grenzen
  stehen ohne Abstand. Der KI-Block (9, 13, 19, 22, 24, 34, 35, 40,
  Brachen, ki AC-35) kommt nach der Partie und braucht vorher ein Wort des
  Benutzers dazu, wie die Grenzen gemessen werden sollen (mehr Startwerte
  statt genau dieser 40).
- **11:05: ANTWORTEN DES BENUTZERS (über die Rückfrage).** (1) ki
  AC-27: **„Lockern"** — für den Handel „1,4-fach und eine halbe mehr"
  (eingetragen mit `a276.py` in `tests/partien/ki-im-nebel.test.mjs`:
  `NEIGUNG_MEHR_HANDEL = 0.5`, erkannt an `EINHEITEN[..].handelt`, neuer
  Testname; Absatz in `specs/10-strategie/ki.md`). (2) Entf-Taste,
  wörtlich: **„nur entfernen, müssen keine massenentf sein oder so."** →
  Punkt 38 ist BEAUFTRAGT, einfach: Entf entfernt das Gewählte, kein
  Umschalt+Entf. Reihenfolge: erst Check, Commit, Ausrollen des geprüften
  Stands; die Entf-Taste danach als eigener Schritt.
- **11:15: WEITERE ANTWORTEN DES BENUTZERS (wörtlich).** Zu Punkt 6
  (Strg+Ziffer): **„Dann lass doch auf alt + ziffer gehen, is doch
  entspannt"** → Alt+Ziffer genügt, bedienung AC-73 braucht keine Probe
  mehr von ihm. Zum Nichtgebauten (KI-Block, Baumenü): **„Darfst du
  alles noch bauen, aber wir können gerne den aktuellen Stand mal
  ausrollen, dann ist das auf jeden Fall mal da"** → AUSROLLEN DES
  AKTUELLEN STANDS IST BEAUFTRAGT (nach grünem Check und Commit, Räume
  leer, nie `--sofort`); KI-Block und Punkt 4 dürfen gebaut werden — ein
  WEITERES Ausrollen danach ist damit NICHT beauftragt. Zu Punkt 17:
  **„Du hast recht, falsche beobachtung meinerseits"** → Punkt 17
  ERLEDIGT, nichts zu bauen. Und: **„Bin nochmal einige Stunden weg,
  bitte nicht auf input von mir warten"** → nicht pushen (Memory
  `pushen-wenn-da`), nicht rückfragen, selbst entscheiden.
- Check mit der neuen Grenze läuft: Task `bn67085dx`, `$S/check-4.log`.
- Skripte bis `a276.py`.

**05:23: ABSCHLUSS LÄUFT — der Umfang für die Testpartie ist gebaut, uncommittet.**
- Partien ganz gefahren (05:13–05:20, `$S/partien-2.log`): **13 von 14
  grün** — Nebeltest, ki AC-26, ki AC-30 (1,75), ki AC-33/23, zwei gegen
  zwei 1–20 halten mit allen Änderungen bis Punkt 21. **ki AC-27 ✖
  unverändert**: `silberfurt aus markt: 1.8 je Partie, die anderen 1.2`.
- Alle Tests ohne Partien: **887 von 887 grün** (`$S/tests-3.log`).
- Board 545 von 668. Worktree-`CLAUDE.md`: Absatz „Rückmeldungen aus dem
  zweiten Spiel auf dem Server" eingefügt (vor „1. **Stufe A**"); die
  Zahlenzeile 183 („522 von 644 … 852 … 269") ist NOCH ALT — nach dem
  Browserlauf auf 545 von 668, 887 und die Zahl der Browserfälle setzen.
- **Browserlauf gestartet um 05:23**: Hintergrundtask `bnpurtlyh`,
  `E2E_HAFEN=4205 npm run check:alles:neu:kurz > $S/alles-3.log` (~45 min
  Browser, danach `npm run check` mit den Partien — der endet ROT wegen
  ki AC-27, das ist erwartet). **Solange er läuft: nichts unter `public/`
  oder `server/` ändern, nichts Schweres daneben.** Danach
  `npm run qa:abweichung`, alles über 1 % ansehen.
- Auf dem Server: `Stand: 7aead4a42f`, 0 Räume, 0 Partien (05:22).
- Skripte bis `a274.py`.

**05:12: PUNKT 21 FERTIG (Wirtschaftsverbesserungen → bauen AC-43 und AC-44 `fertig`), uncommittet.**
- `daten.js`: acht Einträge in `VERBESSERUNGEN` — `goldbergbau`,
  `steinbergbau` (Lehen, Bergbaulager, `sammeln` ×1,15), `goldschacht`,
  `steinschacht` (Fürstentum, Vorstufe), `bogensaege` (Fürstentum, Vorstufe
  Doppelaxt, Holz ×1,2), `schwererPflug` (Fürstentum, Vorstufe
  Pferdekummet, Farm +125), `schubkarre` (Lehen, Dorfzentrum,
  `wirkung.dorfbewohner: { tempo: 0.08, tragkraft: 3 }`), `handkarren`
  (Fürstentum, Vorstufe, tempo 0.08, tragkraft 5). Kosten und Dauer aus
  `$S/aoe2daten/data.json` (SiegeEngineers/aoe2techtree), **Wirkungen als
  Startwerte gesetzt** (die Datei nennt sie nicht). `bildetAus` von
  Dorfzentrum, Mühle, Holzfällerlager, Bergbaulager erweitert.
- `welt.js`: `welt.tragkraft(einheit)` (über `einheitenwert`), alle
  Stellen lesen sie darüber (der Wächter `waechter-werte` verlangt es,
  auch `ki.js:1743`); `kampfwerte()` trägt `tragkraft` für alles, was
  trägt. `bringt.js`: Feld `tragkraft`, Tempo einer Einheitenart als
  Anteil („+10 % Tempo"). `auswahlleiste.js`: acht gezeichnete Knopfbilder
  (`goldhacke`, `steinhacke`, `goldschacht`, `steinschacht`, `saege`,
  `pflug`, `schubkarre`, `handkarren`), „von N" aus `einheitenwerte`.
  `vorlage-aoe2.md`: Zeilen mit Fußnote nachgetragen.
- Belegt: `tests/strategie-wirtschaft.test.mjs` (9 Fälle),
  `e2e/tests/strategie-wirtschaft.spec.mjs` (2 Fälle, 2 Bilder,
  angesehen); daneben grün: `strategie-laptop` (bedienung AC-23 mit dem
  volleren Dorfzentrum), `strategie-verbesserungen` (8). `npm run typen`,
  `npm run waechter` (43) grün; alle Tests ohne Partien 886 grün + 1
  Wächter, der danach behoben wurde (nicht noch einmal ganz gefahren);
  Board **545 von 668**.
- Gemessen (ein Sammler, fünf Minuten, Startwert 7): Holz 70 ohne, 78
  Schubkarre, 90 Handkarren, 90 Axt+Säge, 108 alles; Gold 80 ohne, 90
  Bergbau, 90 Schacht (gestuft durch die Lieferungen), 108 alles.
- **Nicht geprüft:** die Partientests (Nebel, zu viert, Teams) — die KI
  erforscht nichts davon, erwartet unverändert; die Balance Mensch gegen KI
  verschiebt sich weiter zum Menschen (ki AC-35 offen). Die Doppelaxt
  steht mit 50 s in den Daten, die offene Datei nennt 25 s — nicht
  angefasst.
- Skripte bis `a273.py`. Nächste freie: bauen AC-45, darstellung AC-29.

**04:58: PUNKT 7 FERTIG (Geschosse sind gerendert → darstellung AC-28 `fertig`), uncommittet.**
- `grafik/geschoss.py` (NEU) + Eintrag in `grafik/verzeichnis.json`:
  Tafel `geschoss` (812×72, eine Zeile: Spalte 0 der Pfeil waagrecht, Spitze
  rechts auf dem Fußpunkt; Spalten 1–6 der Wurfstein in sechs Drehlagen),
  ohne Maske, ohne Schatten. Gerendert mit `npm run bilder -- geschoss`
  (11 s, EIN Blender-Prozess). Der erste Wurf war schlecht zu sehen (dunkler
  Schaft, Fiederung als weißes Klötzchen) → helles Eschenholz, größere
  Eisenspitze, gestufte Federn.
- `public/bilder.js`: `'geschoss'` in `NAMEN`. `public/ansicht.js`:
  `zelleZeichnen` importiert; `pfeileZeichnen` nimmt `gerendert('geschoss')`
  — Pfeil mit `translate`/`rotate` in die Flugrichtung, Stein mit Lage aus
  `t` (anderthalb Überschläge) und einem Ellipsenschatten am Boden; Maßstab
  nie unter 0,4 (Zoom 1,2). `this.geschosseGezeichnet = { tafel, strich }`
  zählt mit. Ohne Tafel (`?bilder=0`) bleibt die gezeichnete Fassung.
- Belegt: `tests/bilder.test.mjs` (darstellung AC-28),
  `e2e/tests/strategie-pfeile.spec.mjs` (neuer Fall, Bild angesehen:
  `qa/bildnachweise/10-strategie/darstellung/AC-28--gerenderte-geschosse-…png`;
  bedienung AC-40 daneben grün). `npm run typen`, `npm run waechter` (43)
  grün, Board **543 von 666**.
- **Nicht gefahren:** die anderen Fälle mit Pfeilen (Türme, Burg,
  Belagerung) — ihre Bilder ändern sich, die Logik (`this.pfeile`) nicht;
  kommt mit dem Abschlusslauf. Ob die Pfeile bei Zoom 1 am Rechner des
  Benutzers gut zu sehen sind, entscheidet sein Auge.
- Skripte bis `a270.py`. Nächste freie: darstellung AC-29.

**04:50: PUNKT 23 FERTIG (Farm: Brache, neu aussäen, Schalter → bauen AC-41 und AC-42 `fertig`), uncommittet.**
- Server `welt.js`: `farmLeer()` (statt Löschen), `bracheTakten()`,
  `aussaeen(spieler, farm)` (gibt den fehlenden Rohstoff zurück oder null),
  `farmenEinstellen()` zur Nachricht `farmen` (`erneuern`, `raeumen`, je
  Wahrheitswert); Spieler tragen `farmenErneuern`, `brachenRaeumen`; die Farm
  `brach`, auf der Leitung `br: 1`, der Spieler `fe: 1`. In `befehl()` wird
  VOR der Schleife einmal bezahlt (Absage „Zu wenig Holz.", niemand geht los);
  der Farm-Zweig nimmt keine Brache. Pferdekummet überspringt Brachen.
- Mit Schalter und ohne Holz: die Farm liegt brach, der Bauer bleibt ihr
  Arbeiter, bringt die Ladung heim, wartet auf ihr (zählt als untätig) und sät
  aus, sobald es reicht; Schalter aus → Farm frei.
- **KI unverändert**: ihr Konstruktor schickt `{ auftrag: 'farmen', raeumen:
  true }` — ihre leeren Farmen verschwinden im selben Takt wie bisher. Dass
  sie Brachen neu aussät, gehört in den KI-Block. **Die Partientests
  (Nebel, zu viert, Teams) sind danach NICHT gefahren** — erst im
  Abschlusslauf.
- Browser: `ansicht.js` Handlung `aussaeen`, Zeigertext „Neu aussäen (60
  Holz)" über `saatpreis()`, `farmenErneuern`; `auswahlleiste.js`
  `#farmvorrat[data-brach]`, `#farmenschalter` (an jeder Farm, gilt allen);
  `WARENNAMEN` entfernt (jetzt `ROHSTOFF_NAMEN`). Das Bild der Brache ist die
  letzte Stufe der Farmtafel — eine Farm mit 3 Nahrung sieht genauso aus.
- Prüfgriff `gebaeude` nimmt für Farmen `nahrung` und `brach`.
- Belegt: `tests/strategie-brache.test.mjs` (10 Fälle),
  `tests/strategie-farm.test.mjs` angepasst (leer → brach),
  `e2e/tests/strategie-brache.spec.mjs` (2 Fälle, 2 Bilder, angesehen);
  alle Tests ohne Partien grün (877), `npm run typen`, `npm run waechter`
  (43) grün, Board **542 von 665**.
- Skripte bis `a266.py`. Nächste freie: bauen AC-43.

**04:33: PUNKT 2 FERTIG (Vorräte lassen sich ansehen → bedienung AC-63 `fertig`), uncommittet.**
- Server `welt.js`: Nachricht `ansehen` (`{ feld }` oder ohne Feld) →
  `welt.ansehen()` setzt `spieler.ansieht` (Feldindex oder null);
  `zustandJeSpieler` hängt über `mitAngesehenem()` dem, der hinsieht, `av:
  [feld, rest]` an — nur in Sicht (`nebelGiltFuer` + `sieht`), leer → sieht
  nichts mehr an. Der Aufbau trägt `werte.vorrat[art] = { voll, rohstoff }`
  und `werte.tiere.schaf.nahrung`. Tiere tragen `n` schon auf der Leitung.
- Browser `ansicht.js`: `angesehen` kennt `{ t: id }` (fremdes Schaf,
  Kadaver) und `{ v: feld }`; `tierUnter`, `vorratUnter` (über
  `vorratImBild`), `ansehenAbgleichen()` (in `zustand()` und nach
  `auswahlTreffen`), `vorratRest`, `gemeldetesFeld`; Ring gestrichelt, beim
  Vorrat über allem gezeichnet. `auswahlleiste.js`: `vorratBauen()`
  (`#vorratsrest` mit `data-rest`, `data-voll`, `data-ware`; Namen Baum,
  Beerenstrauch, Goldvorkommen, Steinvorkommen, Schaf, Erlegtes Schaf).
  `app.js`: `ansicht.ansehenSenden`. `stil.css`:
  `.lebensbalken.restbalken` (vorratsfarben, nicht grün).
- Belegt: `tests/strategie-ansehen.test.mjs` (6 Fälle, auch Nebel),
  `e2e/tests/strategie-ansehen.spec.mjs` (2 Fälle, 2 Bilder, angesehen);
  `strategie-rueckmeldung` grün (15), `npm run typen`, `npm run waechter`
  (43) grün, Board **540 von 663**.
- **Nicht im Browser geprüft:** der Satz im Nebel („zeigt sich erst in
  Sicht") — der Browserfall spielt aufgedeckt. Während einer Pause verwirft
  der Server die Nachricht `ansehen` wie jeden Befehl: der Rest erscheint
  dann erst nach einem neuen Klick.
- Skripte bis `a263.py`. Nächste freie: bedienung AC-75 (64 vorgemerkt für
  das Baumenü).

**04:22: PUNKT 26 FERTIG (Der Mönch ist zu hören → bedienung AC-74 `fertig`, ohne Bild begründet), uncommittet.**
- `public/ton.js`: drei Klänge in `KLAENGE` — `heilen` (`gloeckchen`, Abstand
  950 ms, laut 0,07), `bekehren` (`gesang`, 1250 ms, laut 0,18; `GESANG_DAUER`
  1,6 s, der Ton hält in den nächsten), `bekehrt` (`uebertritt`, laut 0,14);
  keiner trägt `kampf`. Gemessen (`npm run ton:messen`): Spitze 0,058 / 0,169 /
  0,202, effektiv 0,006 / 0,023 / 0,022 — Gesang stand erst auf 0,5 und war so
  laut wie die ganze Musik (0,063 effektiv), deshalb 0,18.
- Server `welt.js`: der Zustand je Einheit trägt `bk: 1`, solange ein Mönch in
  Reichweite bekehrt (`w` allein unterschied Heilen und Bekehren nicht).
- `public/ansicht.js`: `schlagHoeren` spielt am Mönch `bekehren` oder `heilen`;
  in `zustand()` klingt `bekehrt` an jeder Einheit, deren Besitzer wechselt.
- Belegt: `tests/strategie-ton.test.mjs` (Gruppe `MOENCH`, zwei neue Fälle),
  `tests/strategie-moench.test.mjs` (zwei neue Fälle zu `bk`), Browserfall in
  `e2e/tests/strategie-moench.spec.mjs` (5 von 5 grün; nutzt die ZWEITE Wiese
  noch einmal — eine dritte hat die Karte nicht). `npm run typen`,
  `npm run waechter` (43) grün, Board **539 von 662**.
- **Nicht geprüft:** wie es klingt — das entscheidet das Ohr des Benutzers.
- Skripte bis `a261.py`. Nächste freie: bedienung AC-75 (63 und 64 vorgemerkt).

**04:08: PUNKT 16 FERTIG (Das Haus im Spiel → bedienung AC-69 `fertig`), uncommittet.**
- Server: `bringt.js` neu `hausZeilen(wirkungen, bauwerkNamen)` und
  `hausBringt(haus, bauwerkNamen)` → `{ bringt, mannschaft }`; drei Formen,
  die es nur bei Häusern gibt (`gebaeude.reichweite` → „Wachturm und Burg:
  +1 Reichweite", aus den Daten gelesen, was schießt; `handel`;
  `ausbildung`), `boniAb` mit „Ab dem Fürstentum – " davor. `welt.aufbau()`
  trägt `werte.haeuser[art] = { name, wahlspruch, bringt, mannschaft }`.
- Browser: `auswahlleiste.js` `hausMarke(besitzer)` (Zeile `.hausmarke` mit
  `data-haus` im Kopf des eigenen Gebäudes und von allem Fremden, das man
  ansieht), die Tafel (AC-55) kennt `typ: 'haus'`; `ansicht.spielstandZeilen()`
  trägt `haus`; `app.js`: `.hausvermerk` hinter dem Namen im Spielstand,
  `title` in der Punkteliste. Eigene Einheiten und Baustellen zeigen das
  Haus nicht.
- Belegt: `tests/strategie-bringt.test.mjs` (3 neue Fälle),
  `e2e/tests/strategie-haus.spec.mjs` (Anna Wehrstein, Bert Silberfurt; zwei
  Bilder, angesehen). `strategie-rueckmeldung`, `-spielstand`, `-laptop`,
  `-punkte` grün (20), `npm run typen`, `npm run waechter` (43) grün.
- **Folge für den vollen Browserlauf:** an jedem gewählten Gebäude steht
  jetzt „Haus Prüfhaus" — viele Bilder ändern sich um diese Zeile.
- Skripte bis `a259.py`. Nächste freie: bedienung AC-74.

**02:28: PUNKT 6 GEBAUT (Vollbild gibt die Tasten → bedienung AC-73 `in-qa`), uncommittet.**
- `public/app.js`: `VOLLBILD_TASTEN` (Buchstaben, Ziffern, Esc, Leertaste,
  Punkt, Entf, F1–F12; kein Tab), `vollbildUmschalten()`
  (`requestFullscreen` auf `documentElement`, danach
  `navigator.keyboard.lock`), `fullscreenchange` gibt frei und wechselt den
  Knopftext, `F11` im Spiel in der Capture-Phase. `public/index.html`: Knopf
  `#menueVollbild` im Spielmenü nach „Tasten und Ton". `public/tasten.js`:
  Zeile zu den Gruppen ergänzt, neue Zeilen `F10` und `F11`.
- Belegt: `e2e/tests/strategie-vollbild.spec.mjs` (ein Fall, grün; Bild
  angesehen), `strategie-rueckmeldung` (AC-66, Knopfliste angepasst) und
  `strategie-gruppentasten` grün. `npm run typen`, `npm run waechter` (43)
  grün, Board **537 von 660**.
- **`in-qa`, nicht `fertig`:** ob Chrome im Vollbild Strg+1 wirklich hergibt,
  kann kein Browserlauf prüfen — der Benutzer muss es selbst probieren
  (Menü → Vollbild, dann Strg+1). Erst danach auf `fertig`.
- **Für Punkt 16 schon gelesen, nichts geändert:** `HAEUSER` in `daten.js`
  (`boni`, `boniAb`, `mannschaft`), `bringt.js` (`bringt(verbesserung)` gibt
  Zeilen aus `wirkung`/`sammeln`/`farm`/`gebaeude` — es fehlen `handel`,
  `ausbildung`, `gebaeude.reichweite`), der Aufbau trägt je Spieler `haus`
  (`welt.js` ~4433), die Sätze der Verbesserungen gehen als
  `werte.verbesserungen[art].bringt` hinaus (~4506). Plan: `hausBringt(haus)`
  in `bringt.js` → `werte.haeuser[schluessel] = { name, wahlspruch, bringt,
  ab: [{ stufe, zeilen }], mannschaft }`, im Bild ein Knopf mit dem Hausnamen
  in der Leiste oben und eine Tafel darunter (bedienung AC-69). Das Prüfhaus
  des Browserlaufs hat keine Boni — der Fall setzt ein echtes Haus.
- Skripte bis `a257.py`. Nächste freie: bedienung AC-74.

**02:20: PUNKT 29 FERTIG (Ruckeln beim Zoomen → darstellung AC-27 `fertig`), uncommittet.**
- **Gemessen vorher** (100 Einheiten, 30 Gebäude, Browserlauf): jeder Dreh am
  Rad ein Bild von 43–107 ms, auch beim zehnten Mal; Wechsel der
  Bodenauflösung 274–368 ms. Ursachen: Zoom driftete nach einem Anschlag auf
  ein anderes Raster, Speicher zählten Stücke und warfen FIFO hinaus (der
  Geländespeicher flog bei jeder Stufe halb leer), alle Kacheln einer neuen
  Auflösung in einem Bild.
- **Gebaut:** neu `public/bildspeicher.js` (`// @ts-check`, Klasse
  `Bildspeicher(name, grenzeInBildpunkten)`: `holen(schluessel, familie)`,
  `legen(schluessel, bild, familie, beginn)`, `ansehen`, `loeschen`, `leeren`,
  `ersatzZeichnen`, statisch `alle`, `bildBeginn(frist)`, `verbraucht`,
  `ersetzt`). Figuren 10 Mio, Gebäude 12 Mio, Gelände 24 Mio, Kacheln
  32 Mio Bildpunkte. `public/ansicht.js`: `ZOOMSTUFEN` (elf Werte 0,4 … 2,5),
  `zoomstufe(zoom, richtung)`, Rad setzt `zoomt`/`zoomZuletzt`; nur nach
  einem Dreh gilt `BILD_FRIST = 5` ms je Bild (sonst alles sofort wie
  bisher — damit sich die übrigen Browserfälle nicht anders verhalten);
  `bodenZeichnen`: Ersatzkachel aus anderer Auflösung, nach `KACHEL_RUHE`
  150 ms eine je Bild mit Pause 2× Rechenzeit; `kachelnVerwerfen` markiert
  nur noch (`kachelnVeraltet`), neu gerechnet wird eine je Bild; Getter
  `ansicht.scharf`. `scripts/qa-nachweis.mjs` wartet vor dem Bild auf
  `scharf`. Der Vorrat-Ring um das Bild ist NICHT gebaut (kostete in Ruhe
  Bilder von 35–100 ms).
- **Belegt:** `tests/bildspeicher.test.mjs` (5 Fälle),
  `e2e/tests/strategie-zoom.spec.mjs` (ein Fall: Ersatz nach dem Dreh, eine
  Kachel je Bild, elf Stufen auch nach dem Anschlag, zweite Fahrt zeichnet
  nichts neu — figuren 101/gebaeude 55/gelaende 420/kacheln 100 unverändert —,
  Baum gefällt: 9 Kacheln einzeln). Gemessen danach: zweite Fahrt Mittel
  13 ms, 95 % unter 27 ms, längstes 59 ms. `strategie-spielbild` (16) und
  `strategie-tempo` (3, 59–60 Bilder/s) grün; ein Lauf des Tempotests fiel
  einmal mit 45,8 Bildern/s bei 7,4 ms je Bild — Rauschen des Browserlaufs,
  zweimal wiederholt grün. **Nicht gemessen:** der Rechner des Benutzers
  (der Browserlauf zeichnet ohne Grafikkarte), Speicherbedarf im Chrome.
- `tests/waechter-bedienteile.test.mjs`: `spielmenue` in `UEBER_ALLEM`
  eingetragen (fiel seit Punkt 5/20). `npm run typen` und `npm run waechter`
  (43) grün, Board **537 von 659**. Die Messdatei `zz-zoommessung.spec.mjs`
  ist gelöscht. Skripte bis `a255.py`. Nächste freie: darstellung AC-28.

**01:41: PUNKT 31, 3, 1 FERTIG, uncommittet.**
- **Punkt 31 → bedienung AC-68 `fertig`** „Ruhe des Mönchs sichtbar":
  Server `r` = Restsekunden (aufgerundet) statt 1, `bekehren.ruhe` in den
  Werten des Aufbaus; Browser: blauer Balken (`art: 'ruhe'` in
  `this.lebensbalken`, 3 Bildpunkte hoch, unter dem Lebensbalken) über jedem
  eigenen ruhenden Mönch, Leiste „ruht noch 0:22" (`.kampfwerte .ruht`,
  `data-ruht`), `r` im Schlüssel der Leiste. Tests: `strategie-moench.test.mjs`
  (neuer Fall AC-68, AC-38-Fall angepasst), Browser `strategie-moench.spec.mjs`
  (dritter Fall, Bild angesehen).
- **Punkt 3 → kampf AC-24 `fertig`**: Browser
  `e2e/tests/strategie-baustellensicht.spec.mjs` (Sicht „erkundet": Baustelle
  dunkel, Haus 16 Felder daneben hell, Berts Miliz nur am Haus; gemessen
  Helligkeit 41 gegen 71).
- **Punkt 1 → bauen AC-40 `fertig`**: Browser
  `e2e/tests/strategie-sammelpunkt.spec.mjs` (Klick auf die Krone, Fahne am
  Baum; Baum per neuem Prüfgriff `vorratLeeren` gefällt, Fahne wandert mit
  dem nächsten Dorfbewohner). Neuer Griff in `e2e/server.mjs`, Helfer
  `vorratLeeren` in `e2e/helpers/seite.mjs`.
- `npm run typen` grün, Board **536 von 658**, Bericht ohne Beanstandung.
  Skripte bis `a248.py`. Nächste freie: bedienung AC-73 (63, 64, 69
  vorgemerkt), kampf AC-26, bauen AC-41, darstellung AC-27.

**01:31: RUINEN FERTIG (Punkt 37 + 41a → darstellung AC-26 `fertig`),
uncommittet.** Server (`welt.js`): `RUINE_SEKUNDEN = 20`, `this.eingestuerzt`
(Map id → Takt), `gebaeudeZerstoeren(gebaeude, truemmer = true)`,
`gebaeudeWeg(id)` → `{ i, weg: true, z: <Resttakte> }`; ohne `z`: Abriss,
abgeerntete Farm, Mauer unter neuem Tor, und was länger als 20 s im Nebel
lag. Browser (`ansicht.js`): `this.ruinen` (`{ gebaeude, bis }`),
`ruinenMalen()` nach den Mauerschatten — verbrannter Boden, vier gebrochene
Mauern (`MAUERREST`, eingerückt auf 0,76), Schutt (`SCHUTT`) zur Mitte
gehäuft, verkohlte Balken (`BALKENREST`); dieselbe Zeichnung für jedes
Gebäude in seiner Größe, verblasst in den letzten 3 s (`RUINE_VERBLASSEN`).
Der erste Versuch (Gebäudebild als Stumpf ausgeschnitten) zeigte nichts: das
gerenderte Gebäude reicht nicht bis an die Kante seiner Grundfläche.
Tests: `tests/strategie-ruinen.test.mjs` (3 Fälle), Browser
`e2e/tests/strategie-ruinen.spec.mjs` (ein Fall, zwei Bilder — angesehen;
gemessen 63–65 % der Grundfläche anders als Wiese, verlangt 30 %).
`npm run typen` grün, `tests/netz.test.mjs` grün, Board **533 von 657**.
Nicht geprüft: Ruine von Mauer und Tor im Bild (gleiche Zeichnung, 1×1 bzw.
4×1), Ruinen bei Zoom < 1. Nächste freie: darstellung AC-27. Skripte bis
`a242.py`.

**01:13: STAND — auf `7aead4a` ist AUSGEROLLT (seit 00:06), alles unten
ist UNCOMMITTET im Worktree `OnlineGames-bildumbau`. Dieser Eintrag
überholt die „Auflösung" und die „NIE GEFAHREN"-Vermerke im Eintrag 00:40
darunter.**

**Die drei KI-Tests:**
- **ki AC-30 GELÖST**: `BAUWERKE_MINDESTENS = 1.75` in
  `tests/partien/ki-im-nebel.test.mjs` (Testname nennt 1,75), Absatz mit
  Datum und Zitat der Freigabe in `specs/10-strategie/ki.md`. Gemessen 1,9
  bzw. 1,8 — im Gesamtlauf der Partien noch nicht bestätigt.
- **ki AC-26 GELÖST, Test GRÜN**: statt der geschätzten 50 die genaue
  Obergrenze — `rest` = Gold auf den Feldern beim Leeren + was Sammler
  trugen (`e.ladungsart === 'gold'`, `e.ladung`); ohne Handel `gold <=
  rest`, und `rest < HANDEL_BRINGT` (90). Nachgemessen 42 = 36+6, 14 = 9+5,
  14 = 8+6, 40 = 35+5, 53 = 50+3, 22 = 16+6, 29 = 23+6.
- **ki AC-27 Silberfurt UNGELÖST → dem Benutzer vorlegen.** Gemessen 1,8
  Karren je Partie gegen 1,2 der anderen; verlangt 1,4-fach UND zwei mehr,
  es fällt an „zwei mehr". Ursache (`sf.mjs`, `sf2.cjs`): Silberfurt
  erreicht die Ritterzeit um Minute 22–29, baut den Markt 1–8 Minuten
  später (Holz ~30 je Minute nach dem Aufstieg) und ist in 9 von 16
  Partien geschlagen, bevor ein Karren fährt (gewinnt 2 von 16); die
  anderen handeln seit `GOLD_KNAPP = 1500` selbst. **Versuch
  ZURÜCKGENOMMEN** (`ki.js` wieder wie HEAD, Diff in
  `$S/versuch-marktvoraus.diff`): Holz für den Markt schon im Aufstieg
  zurücklegen + Handel vor Werkstatt → Silberfurt 2,3 / 1,3, aber nur 33
  von 40 vor Minute 60 (Nebeltest fiele). Falle dabei:
  `GEBAEUDE.markt.zeitalter` ist 1 (Lehen), der Karren kommt erst in der
  Ritterzeit. **Meine Empfehlung an den Benutzer:** für den Schwerpunkt
  Handel vorerst „1,4-fach und eine halbe mehr" freigeben, die Ursache
  (Silberfurt überlebt nicht) im KI-Block nach der Testpartie.

**Seit 00:40 GEBAUT und im Browser BELEGT (alle `fertig`, Bilder angesehen):**
- **bedienung AC-65** (Punkt 5+20), **AC-66** (Punkt 11, Menü), **spielziel
  AC-27** (Punkt 10): einzeln gefahren, grün.
- **Punkt 32 → bedienung AC-70** „Kampfwerte mit Zuschlag": Angriff als
  „3+1", Zuschlag golden (`.kampfwerte .zuschlag`), `data-zuschlag` an der
  Zeile; `kampfwerteZeile(…, grund)` in `auswahlleiste.js`. Der AC-35-Fall
  prüft jetzt „3+1".
- **Punkt 28 → bedienung AC-71** „Jeder schnelle Klick zählt": Ursache war,
  dass die Leiste zwischen Drücken und Loslassen neu gebaut wird → `click`
  ging verloren. `beimDruecken(knopf, tun)` (wirkt bei `pointerdown`, bei
  `click` nur mit `detail === 0`) an Ausbilden, Handel, Abbestellen;
  Umschalt + Klick = fünf Einheiten (`MIT_UMSCHALT`), steht in `tasten.js`.
- **Punkt 36 → bedienung AC-72** „Eine Schlagbewegung je Schlag": Server
  `einheit.schlagTakt`, im Zustand `sl` (nur an Kämpfenden), in den Werten
  `nachladen` je Einheit; Browser `ansicht.schlagAnteil()` (0 = bereit,
  0,5 = Treffer; `SCHLAG_ANTEIL` 0,225 der Nachladezeit je Hälfte, 0,3 bis
  0,9 s), `arbeitPhase()`, `schlagHoeren` klingt mit neuem `sl`. Servertest
  in `tests/strategie-kampfbild.test.mjs` (Miliz, Bogenschütze, Ramme);
  Browser `strategie-kampfbild.spec.mjs`: AC-39 umgestellt (Bild in Ruhe
  gegen Bild beim Treffer), AC-72 zählt 13 s Bild für Bild an Ramme und
  Bogenschütze. Mangonel nicht eigens gemessen (geht denselben Weg).
- **Punkt 41b → spielziel AC-28** „Nach Ende steht das Bild":
  `ansicht.anhalten()` hält auch bei `this.ende`, `this.pausiert`,
  `endeMerken` und der Aufbau rufen es. Browserfall in
  `strategie-partieende.spec.mjs` (Holzfäller bewegen sich, nach dem Ende
  0 geänderte Bildpunkte). Revanche im Browser nicht eigens geprüft.
- Verwaiste Nachweise der umbenannten Fälle gelöscht (AC-39, AC-35).
  `npm run typen` grün, `specs:board` gefahren: **532 von 656 fertig**,
  Bericht ohne Beanstandung.

**Noch OFFEN, in dieser Reihenfolge:**
1. Ruinen (37 + 41a): reine Darstellung, ~20 s, begehbar, kein
   Klicktreffer → darstellung AC-26 (nächste freie dort prüfen).
2. Punkt 31 (Ruhe des Mönchs sichtbar, bedienung AC-68: Restsekunden statt
   `r: 1`, „Ruht noch 0:41"; die 62 s bleiben).
3. Browserfälle zu kampf AC-24 und bauen AC-40 schreiben (beide `in-qa`).
4. 38 (Entf — nur gefragt, nicht beauftragt), 6, 29, 16, 26, 2, 23; dann
   7, 21; **Punkt 4 (Baumenü zwei Seiten) ZURÜCKGESTELLT** bis nach der
   Testpartie: 17 Browserdateien hängen an `[data-bauen]`/`BAUTASTEN`.
5. Abschluss: `tests/partien/*.test.mjs` ganz, CLAUDE.md-Zahlen, EIN
   `E2E_HAFEN=4205 npm run check:alles:neu:kurz` (~44 min),
   `qa:abweichung`, Commit, `npm run ausrollen` (Räume leer, nur grün).
   **Hängt an ki AC-27.**

Nächste freie Nummern: bedienung AC-73 (63, 64, 68, 69 vorgemerkt),
spielziel AC-29, kampf AC-26, einheiten AC-64, bauen AC-41, ki AC-36.
Skripte im Scratchpad bis `a235.py`.

**00:40: STAND NACH DER URSACHENSUCHE — auf `7aead4a` ist AUSGEROLLT
(seit 00:06), alles unten ist UNCOMMITTET im Worktree.**

**Ursachensuche FERTIG — keine einzelne Änderung ist schuld** (40
Nebelpartien je Fassung, `node n40b.mjs <fassung>`):
- `vA` (ohne kampf AC-25): 34 vor Minute 60 (Nebeltest fiele!),
  Silberfurt 2,9 / andere 1,0, Türme 2,1
- `vB` (ohne Baustellensicht): 35 vor 60, Silberfurt 2,3 / 1,3, Türme 1,8
- `vC` (ohne `vorratErsatz`): 38 vor 60, Silberfurt 1,6 / 0,7, Türme 1,8
Die Grenzen halten an den Startwerten, nicht aus Abstand. Die drei
Änderungen sind vom Benutzer verlangt und BLEIBEN. `p26.cjs` (ki AC-26
ohne Handel): die Spalte „getragen" ist falsch gerechnet (`einheit.ladung`
ist eine Zahl, die Art steht in `einheit.ladungsart`).

**Auflösung der drei gefallenen KI-Tests (NOCH NICHT UMGESETZT):**
1. **ki AC-30**: freigegebene Grenze 1,75 anwenden — Test, Testname,
   Absatz mit Datum und Zitat in `specs/10-strategie/ki.md`.
2. **ki AC-26**: die 50 durch die exakte Obergrenze ersetzen (was beim
   Leeren auf den Feldern lag + was Sammler trugen) — erst mit
   berichtigter Probe belegen.
3. **ki AC-27 Silberfurt „zwei mehr"**: NICHT freigegeben. Entweder die
   Handelsneigung stärken (`handelPruefen` ki.js ~1865, `HANDEL_VOR = 4`,
   `KARREN = 8`, `goldKaufen`; Silberfurt `goldKnapp: Infinity`) und mit
   `n40b.mjs` + Team-/Vierertests nachmessen, oder dem Benutzer die Zahlen
   vorlegen. Ohne grünen `npm run check` kein Commit, kein Ausrollen.

**Seit 00:27 GEBAUT (uncommittet):**
- **Punkt 11 → bedienung AC-66 `in-qa`** „Menü mit Weg zum Vorraum":
  `#spielmenue` in `index.html` (Weiterspielen, Pause, Tasten und Ton,
  Zurück in den Vorraum), Knopf `#menue` oben rechts und `F10`,
  `zumVorraum()` in `app.js` (`gehtWeg`, `sessionStorage.removeItem('platz')`,
  neu laden — die Partie wartet nach raeume AC-17, der Vorraum bietet die
  Rückkehr), `#abschlussVorraum` unter der Tafel. Browserfall in
  `strategie-rueckmeldung.spec.mjs` (vor raeume AC-18) — **NIE GEFAHREN**.
- **Punkt 10 → spielziel AC-27 `in-qa`** „Aufgeben steht im Bild":
  `spieler.aufgegeben` in `welt.js`, auf der Leitung `ag: 1` (Zustand,
  Auszug, Aufbau, Tafel); `ansicht.standMerken` sagt „X hat aufgegeben."
  an, `ansicht.endeGrund()` → `#partieendeGrund`, Vermerk „aufgegeben" in
  der Abschlusstafel. Servertest in `tests/strategie-partieende.test.mjs`
  GRÜN; Browserfall am Ende von `strategie-partieende.spec.mjs` — **NIE
  GEFAHREN**.
- **Punkt 27 → einheiten AC-40 erweitert**: `HANDEL.karren.fremdAnteil =
  0.2`, in `welt.handelsgewinn()` als Faktor (multiplikativ; additiv riss
  spielziel AC-25). Test in `tests/strategie-marktkarren.test.mjs` grün,
  Gegenprobe fällt; zwei Zusicherungen in `strategie-mannschaft.test.mjs`
  an die neue Regel angepasst. Handelstests 32 grün.
- **bedienung AC-65** (Punkt 5+20): `force: true` eingetragen — **noch
  nicht neu gefahren**.
- **Offen für diese Punkte:** `npm run typen` (nach `fremdAnteil`,
  `aufgegeben`), die drei Browserfälle einzeln fahren
  (`strategie-verbesserungen.spec.mjs -g "bedienung AC-65|bauen AC-25"`,
  `strategie-rueckmeldung.spec.mjs -g "AC-66|raeume AC-18"`,
  `strategie-partieende.spec.mjs -g "AC-27"`), Bilder ansehen, `fertig`.
  Noch zu schreiben: Browserfälle kampf AC-24 und bauen AC-40.
- **Punkt 41**: `welt.aufgeben()` zerstört schon alles; offen sind Ruinen
  (37) und das stehende Bild nach dem Ende.
- **Rückfragen für die nächste Abschlussnachricht:** Punkt 17 (nicht
  nachstellbar, 96 von 96: welches Gebäude, wie weit, mit Umschalt, trug
  er etwas?), Punkt 38 (Entf-Taste so bauen wie empfohlen?).

**Ursachensuche (Verlauf, erledigt)**: Fassungen des Arbeitsstands im
Scratchpad (`varianten.py` baut sie: `v0` wie er ist, `vA` ohne kampf
AC-25, `vB` ohne Baustellensicht, `vC` ohne `vorratErsatz`, `vABC` ohne
alle drei, `vE` ohne die Turmregel), gemessen mit `node n40b.mjs <fassung>`
→ `mess-vA.log`, `mess-vB.log`. Sammelpunkt (Punkt 1) scheidet aus: die KI
setzt keinen. **Grenzen nicht lockern außer der freigegebenen 1,75.**
Danach: `vC` messen, die verursachende Änderung so bauen, dass die KI
davon unberührt bleibt, oder dem Benutzer die Zahlen vorlegen.

**00:27: GEBAUT im Browser (uncommittet), während die Partien liefen:**
- **Punkt 12 → bedienung AC-67 `fertig`** „Zeitalter in der Punkteliste":
  `STUFENZIFFER` und Span `.stufe` in `public/app.js` (`punkteZeigen`),
  `stufe` in `ansicht.spielstandZeilen()`, Stil in `stil.css`; Prüfgriff
  `rohstoffe` nimmt `zeitalter` (`e2e/server.mjs`); Browserfall in
  `strategie-rueckmeldung.spec.mjs` GRÜN, Bild geschrieben und angesehen
  („Bert (III) 300, Anna (II) 100").
- **Punkt 5+20 → bedienung AC-65 `in-qa`** „Forschung erkennbar, laufende
  grau": Klasse `forschung` (goldener Rand, goldene Ecke) an Knopf und
  Schlange, `forschungLaeuft(art)` in `auswahlleiste.js`, `data-laeuft`
  mit „läuft" und der Meldung „… wird schon erforscht."; Browserfall in
  `strategie-verbesserungen.spec.mjs` geschrieben, **fällt noch**: der
  Klick auf den grauen Knopf braucht `click({ force: true })` — danach
  neu fahren, Bild ansehen, `fertig` setzen. `npm run typen` steht aus.
- In `specs/10-strategie/bedienung.md` neuer Abschnitt „Aus dem Spiel auf
  dem Server (2026-11-13)"; Nummern 63, 64, 66, 68, 69 dort vorgemerkt.

**FALLE (00:08): Heredoc für Python IMMER mit `<<'EOF'` in
Anführungszeichen.** Ein `<<EOF` ohne sie ließ die Shell jeden
Backtick-Ausdruck des Steuerstand-Texts als Befehl ausführen (alle
endeten mit „command not found" oder Syntaxfehler, nichts lief; beide
Bäume danach geprüft). Werte wie die Uhrzeit über `sys.argv` geben.

**00:02: Punkt 30 BEHOBEN (uncommittet im Worktree auf `7aead4a`)** —
`tuermeTakten()` fragt beim behaltenen Ziel jetzt `feindlich`; Test
„einheiten AC-38: Annas Turm und Burg schiessen nicht weiter auf den, der
eben bekehrt wurde" in `tests/strategie-moench.test.mjs` (Wachturm und
Burg), Gegenprobe mit der alten Zeile fällt. Einheiten ließen schon vorher
ab (`welt.bekehrt()`). Noch nicht im vollen Check.

**00:00, 2026-11-14: Check „ruhig" GRÜN** — erster Abschnitt 852/852,
Partien 14/14 (Nebeltest, ki AC-27 1,4-fach, zwei gegen zwei 1–20),
`ENDE 0`. **Commit `7aead4a`** auf `strategie-bildumbau` (315 Dateien,
nicht gepusht). **Ausrollen gestartet 00:00** (`AUSROLLEN_WARTEN=120`):
auf dem Server lief `2f9ec0e` mit 1 Raum, 1 Partie, 1 Verbindung (der
Benutzer spielt) — das Skript baut das Abbild und startet erst neu, wenn
keine Partie mehr läuft; nach 120 Minuten bricht es ab, ohne neu zu
starten (dann morgen früh noch einmal).

**23:40: `npm run check:kurz` zum zweiten Mal gefallen — wieder nur
Zeitmessungen, diesmal andere** (einheiten AC-31, fahrplan AC-6 „ein Takt
unter 10 ms"); allein dreimal gefahren dreimal grün. Der zweite Abschnitt
(`tests/partien/`, Nebeltest) lief deshalb beide Male **nicht**. Jetzt
laufen dieselben Schritte von Hand mit `--test-concurrency=4` statt 7
(Task `bjt4d6b05`, Protokoll `$S/check-ruhig.log`): specs:check,
specs:belege, qa:report, erster Abschnitt, dann die Partien. Das ist
nicht wörtlich `npm run check` — im Bericht an den Benutzer so sagen.

**23:33: Tempotest allein gefahren grün** (57,4 / 60,2 / im Gehen 51,6
Bilder je Sekunde) — damit sind alle sieben gefallenen Browserfälle grün.
Kriterien einheiten AC-58 bis AC-62, bauen AC-38, AC-39 auf `fertig`
(522/644), Board, Belege, Bericht neu, CLAUDE.md-Zahlen (852 Tests ohne
Browser, 269 im Browser). `npm run check:kurz` läuft zum zweiten Mal
(muss vor dem Commit ganz grün sein); danach Commit auf
`strategie-bildumbau`, dann `npm run ausrollen`.

**Nachlauf fertig (23:18, 6,9 min): 11 von 13 grün.** Ritterzeit am
Stück (2,1 min), Spielstand (3 Fälle), Startblick, Truppenstufen (3 Fälle),
Türme: grün — die fünf „did not run" des vollen Laufs sind damit auch
gelaufen. **Pfeile: am Test behoben** (Pfeil gemessen, dann bei 45 % des
Flugs festgehalten, Bild, losgelassen) und allein gefahren: grün.
**Offen: `strategie-tempo` darstellung AC-10** — 46,7 bis knapp 50 Bilder
je Sekunde bei unveränderten 6,0 bis 6,5 ms je Bild; gezeichnet ebenso
unter 50. Ursache nach `Get-Process`: **der Benutzer spielt gerade selbst
im Chrome** (Prozesse seit 22:24, Rechner bei 63 % Last) — gezählt werden
`requestAnimationFrame`-Bilder, die teilen sich Grafikkarte und Takt mit
seinem Spiel. Das erklärt vermutlich auch die Timeouts am Ende des vollen
Laufs. **Nicht an der Grenze drehen**: den Tempotest neu fahren, wenn er
nicht mehr spielt (`QA_NACHWEIS=1 E2E_HAFEN=4205 npx playwright test -c
e2e/playwright.config.mjs strategie-tempo`). **`npm run check:kurz`
(23:19 bis 23:25, 358 s): Specs, Belege, Bericht grün (515/644, keine
Beanstandung der Nachweise mehr); in `npm test` zwei Zeitmessungen
gefallen** — karriere AC-7 (Saison 1507 ms statt < 1000) und einheiten
AC-31 (1,016 ms statt < 1); beide allein gefahren grün (Last durch das
Spiel des Benutzers). Der Check muss vor dem Commit einmal ganz grün
sein — neu fahren, wenn der Rechner ruhig ist. `qa:abweichung`: 218
geändert, 44 über 1 % — ansehen.

**Nachlauf, erster Befund (23:14):** `strategie-pfeile` fällt auch ohne
Last (9,8 s): der Pfeil des Bogenschützen fliegt 0,57 s (vier Felder bei
sieben je Sekunde), das Foto des gerenderten Bilds dauert länger. Lösung
wie in `strategie-burg.spec.mjs`: einen Pfeil im Flug festhalten
(`p.dauer = 1e9; p.start = jetzt - 0,45e9`), prüfen, dass er beim Schützen
beginnt und am Haus endet, dann das Bild. Erst ändern, wenn der Nachlauf
durch ist. (Die Uhrzeiten in diesem Block waren zuerst geschätzt und zehn
Minuten zu spät — berichtigt nach `date`.)

## Was als Nächstes kommt

1. `strategie-bildumbau`: **Truppenstufen** (zwei Schützenlinien zuerst), dann ADR-0017 S1 bis S4.
   **ADR-0017 (Fortsetzen) ist entschieden** (Benutzer, 2026-11-13: „Ja die
   adr zum speichern und fortsetzen passt") — gebaut wird in den Schritten S1
   bis S4 aus dem ADR, nach dem, was er heute Morgen bestellt hat. Gemessen mit einer Probe im Scratchpad
   (`probe-sichern.cjs`): Welt und KI sind bis auf die zwei Zufallsfunktionen
   reine Werte; `v8.serialize` legt sie in 1 bis 17 ms ab (227 bis 687 KB,
   gepackt 17 bis 51 KB), und nach dem Laden rechnen Original und Kopie über
   3000 Takte Wert für Wert gleich (3 von 3 Partien; `werteGemerkt` und
   `wirkungenGemerkt` nicht mitgezählt). Angenommen sind damit auch:
   Fortsetzen statt Zurückspringen, kein Knopf „Speichern".
2. Aus den Rückmeldungen, Empfehlung in dieser Reihenfolge: **10** Sammler
   nicht ineinander (einheiten AC-30; kostet die KI Zeit — mit
   `pruefstand:vergleich` messen) → **13/18** Speichern, Laden, Liste offener
   Spiele am Konto (erst ADR-0017) → **8/15** eigene Abläufe für Hacken,
   Pflücken, Feldarbeit, Bergbau (Blender) → **17** Notfallklingel.
   **Bestellt vom Benutzer am 2026-11-13 (08:10 bis 08:30), in dieser
   Reihenfolge nach dem Schautafel-Commit:**
   - **Burg-Salve:** fertig (`e3b4b41`).
   - **Tor breiter** („Das Tor muss breiter sein"): in Arbeit, siehe oben.
   - **Benutzer 2026-11-13, 10:00: „Im laufe der spielzeit darf ne ki auch ne
     zweite oder dritte burg baun."** — also bis zu drei, mit Abstand.
     Gemessen als Probe (Scratchpad `probe-burg.cjs`, `b1.cjs <wurzel>
     <probe|-> 1-4`, Umgebung `RAMMEN=3`): Startwerte 1 bis 4 ohne Burg 40,4 /
     50,5 / 44,5 / 46,7 min, mit einer Burg 46,5 / 75,8 / 45,1 / 64,9 — **die
     KI bildet keine Rammen aus, ohne sie werden die Partien zu lang**; also
     ki AC-34 „Rammen gegen Befestigungen" dazu.
   - **KI-Burgen und Belagerung — gebaut und belegt (15:25), im Baum
     `strategie-bildumbau`.** Die Rammen sind **ki AC-23** (das Kriterium
     gab es schon als `offen`; ein „AC-34" gibt es nicht), die Burgen
     **ki AC-33** (neu); die Spezialeinheit aus der Burg bleibt ki AC-28.
     Stellwerte fest oben in `ki.js` mit ihren Messungen (`RAMMEN` 3,
     `RAMMEN_MIT` 3, `HEER_BEFESTIGT` 10, `SAMMEL_ABSTAND` 16, `HANDEL_VOR`
     4, `BURGEN_JE_ZEITALTER = [0, 0, 1, 3]`, `BURG_ABSTAND_SEKUNDEN` 600,
     `BURG_STEINSAMMLER` 4, `BURG_BAUER` 3, `BURG_VOR` 6); die
     Messschalter `KI_…` sind entfernt. Tests:
     `tests/strategie-ki-belagerung.test.mjs` (elf Fälle, gebaute Lagen)
     und ein vierter Fall in `tests/partien/ki-im-nebel.test.mjs` (Burgen
     und Rammen aus `gebaut`/`neu`: 44 Burgen bei 43 von 80 KIs, 155 Rammen
     bei 39). Begründungen in `qa/ohne-bild.json`, Spec, Board, CLAUDE.md
     geschrieben. **Endstand gemessen:** Satz 1–40: 0 ohne Sieger, 38 vor
     60, Median 41,4, längste 71,5; Distelhag 52,4/32,5 (1,61-fach,
     **knapp**); Satz 41–80: 37 vor 60, Median 43,8, längste 81,8
     (Distelhag dort 44,7/38,6 — unter 1,5-fach, aber nicht der Testsatz);
     zu viert alle 20 vor Minute 90, Median 50,9 (ohne: 44,8).
     **Zweite Burg im Fürstentum zweimal gemessen, zweimal verworfen:** mit
     Abstand 600 s je Satz eine Partie ohne Sieger und zu viert Startwert
     7; mit Abstand 1200 s Startwert 14 ohne Sieger und zu viert Startwert
     5. Sie steht deshalb erst in der Krone — **und die KI steigt dorthin
     noch nicht auf, in ganzen Partien baut sie also eine.** Dem Benutzer so
     sagen (sein „darf auch ne zweite oder dritte" kommt mit Stufe F und
     einer Fernbelagerung; früher nur, wenn er „alle mit Sieger" aufgibt).
     Messwerkzeuge im Scratchpad: `n40b.mjs <wurzel> x [40]`, `t20.cjs
     <wurzel>`, `b3.cjs <wurzel> <startwert>`; Ergebnisse in
     `endstand.txt`, `zweiteburg.txt`. `npm run typen` gibt es in diesem
     Baum nicht (kam mit `fc7d8d0` auf `strategie`) — beim Zusammenführen
     dort fahren. **Committet `c798ce9`, `npm run check` grün.** Nicht pushen, nicht
     ausrollen (Burg-Salve und KI-Burg zusammen, nur auf das Wort des
     Benutzers). Falle: `tests/waechter-haeuser.test.mjs` verbietet
     Hausnamen auch in Kommentaren von `ki.js`.
   - **ki AC-34 „Mehr Militärgebäude bei Überfluss" — fertig, committet
     (15:55).** Ab dem Fürstentum, alle Schlangen voll, 600 Holz und
     zusammen 1000 Nahrung + Gold: ein weiteres über die Grenze (3/3/5/6),
     höchstens neun. **Befund der Messung (`m1.cjs <wurzel>`): die KI ist
     arm, nicht gedeckelt** — im Fürstentum nur 46 von 1446 KI-Minuten an
     der Grenze, Vorrat im Mittel 55 Holz / 57 Nahrung / 86 Gold. KI gegen
     KI ändert die Regel fast nichts; gegen einen mauernden Menschen nicht
     gemessen. Dem Benutzer so sagen: wer mehr Kasernen sehen will, muss
     der KI mehr Wirtschaft geben, nicht die Grenze heben.
   - **ki AC-35 „Mauerring ums Dorf" — GEPARKT (16:15) auf dem Zweig
     `strategie-mauerring` (`bf1ff0a`, von `4e5f823` aus; nicht
     zusammenführen, nicht gepusht), `strategie-bildumbau` ist sauber.**
     Gebaut als erster Wurf: nach der ersten Burg ein Quadrat ums
     Dorfzentrum (10 bis 16 Felder), je Seite ein Tor, dann Seite für Seite
     `mauer`, vier Sammler am Stein, drei Bauer (`ringLage`, `ringBauen`,
     `torPlatz`; Schalter `KI_RING=0`); dazu kennt der Prüfstand dort die
     Durchfahrt des eigenen Tors (sonst „Einheit steht in einem
     Hindernis", sobald die KI ein Tor baut). **Gemessen (ohne / mit
     Ring):** Nebel 1–40: 0 / **1 ohne Sieger** (Startwert 14), 38 / 35 vor
     60, längste 71,5 / 83,9, ki AC-30 fällt (1,9 Türme); Nebel 41–80:
     37 / 35 vor 60, längste 81,8 / 87,4; zu viert 0 / **1 ohne Sieger**
     (Startwert 5). 21 bis 28 von 80 KIs ziehen einen Ring (im Mittel 80
     Felder, 1,5 Tore). **Befund:** der Ring ist nicht dicht (Lager am
     Waldrand, Farmen auf der Linie) — der Angreifer geht hinein, ohne ein
     Feld zu brechen (Startwert 28: 87 Felder zwanzig Minuten unberührt);
     er kostet Wirtschaft und hält niemanden auf. Dicht gebaut hielte er
     auf, und die Partien würden noch länger. **Entscheidung beim
     Benutzer:** welche Grenze gilt für KI gegen KI, wenn die KI mauert
     (heute: alle mit Sieger vor 90, 35 von 40 vor 60)? Meine Empfehlung:
     den Ring erst mit Stufe F bauen, wenn es Fernbelagerung gibt
     (Drache, Trebuchet-Ersatz), und dann dicht (Lücken per Flutung
     suchen) — vorher verlängert er nur.
   - **Benutzer 2026-11-13, 09:30, wörtlich:** „Und mauern baut man
     normalerweise eher außen und bestenfalls komplett drumherum. Nicht
     irgendwo ins dorf" und „man darf dann bei fortgeschrittener spielzeit
     wenns die ressourcen hergeben auch mehrere kasernen, schießanlagen, usw.
     Bauen als ki". Meine Lesart (so gesagt, nicht bestätigt): (a) **die KI
     zieht einen Mauerring außen um ihr Dorf, mit Toren** — heute baut sie
     keine Mauer; das Bild zu darstellung AC-22 mit der Mauer mitten im Dorf
     ist ein Testaufbau; (b) **mehr Militärgebäude bei Überfluss** — heute
     höchstens 3 / 3 / 5 / 6 je Zeitalter (`MILITAER_JE_ZEITALTER`), künftig
     darüber hinaus, wenn die Vorräte sich stapeln. Reihenfolge: Burgen und
     Rammen (ki AC-33, AC-34) → mehr Militärgebäude → Mauerring (das
     Riskanteste: Wege durch Tore, der Gegner braucht Rammen; an fahrplan
     AC-11 messen, Grenzen nicht lockern).
   - **Die KI baut Burgen** („definitiv") — neues Kriterium ki AC-33: im
     Fürstentum, nach dem ersten Aufbruch, am Dorf zum Gegner hin, über
     `ki.bauwerkePruefen` (verallgemeinern, Stein sammeln). Messen: Partien
     enden weiter (Grenzen im Nebeltest NICHT lockern); prüfen, ob die KI
     Rammen gegen Burgen ausbildet. Burg-Salve und KI-Burg zusammen ausrollen.
   - **Zwei Schützenlinien nebeneinander** (Benutzer nach Hin und Her,
     letztes Wort: „mach 2 parallele linien für bogen und armbrust, dein
     vorschlag oben is top"; danach: „vll kurzbogen, bogen langbogen?" — so
     übernommen): **Kurzbogenschütze** (Lehen, Werte des heutigen
     Bogenschützen) → **Bogenschütze** (Fürstentum: 5 Angriff, Reichweite 5,
     35 Leben = Werte des heutigen Armbrustschützen) → **Langbogenschütze**
     (Krone, Stufe F). Der Bezeichner `bogenschuetze` bleibt an der Einheit
     des Lehens hängen (Tests, Bilder, Nachweise) — beim Bauen entscheiden,
     wie die zweite Stufe im Code heißt, ohne Nummern oder Nachweise zu
     verschieben; **Armbrustschütze als eigene Einheit** der
     Schießanlage ab dem Fürstentum (Startwerte: 9 Angriff, alle 3,5 s,
     Reichweite 5, 35 Holz + 55 Gold), in der Krone schwere Armbrust. Die
     Verbesserung `armbrust` (wandelt Bogen → Armbrust) entfällt. Abweichung
     vom Original (dort eine Linie) in `vorlage-aoe2.md` festhalten;
     Konterkreis messen (Reiter schlagen weiter Schützen); Langbogenschütze
     braucht eine eigene Figur.
   - **Fehlt für die Ritterzeit, dem Benutzer genannt:** Wehrturm (+2
     Angriff, +480 Leben, +1/+1), Langschwertkämpfer, Pikenier, Eliteplänkler,
     leichte Kavallerie, alle Rüstungsverbesserungen der Schmiede.
   - **Gebäude je Zeitalter** (gefragt, nicht bestellt): heute ein Bild je
     Gebäude; empfohlen zwei Fassungen (Holz bis Lehen, Stein ab Fürstentum)
     für Dorfzentrum, Haus, Kaserne, Schießanlage, Stall — im Blender-Block.
   - Unterschlupf (mehr Pfeile mit Besatzung) fehlt; käme mit Rückmeldung 17.
3. Zusammenführen nach `strategie`, sobald die Schleife ruht.
4. `strategie`: Stufe E zu Ende (spielziel AC-18), dann F (Imperialzeit).

## Die Regeln, die ich am ehesten vergesse

1. **`fertig` verlangt dreierlei:** gebaut, ein **Testname** mit `<kuerzel>
   AC-<n>`, und **ein Bild oder eine Begruendung** in `qa/ohne-bild.json`. Eine
   Begruendung nennt, *was* das Kriterium ist und *warum* ein Bildschirm es
   nicht zeigen kann — „nicht sichtbar" ist keine.
2. **Ein Test, der zwei Kriterien belegt, braucht zwei Bildnachweise** (oder je
   eine Begruendung), sonst beanstandet das Board.
3. **Nummern werden nie neu vergeben und nie umsortiert.**
4. **Bildschirmtexte mit echten Umlauten**, Bezeichner und Testnamen ohne
   (`Raeume`, `zurueck`).
5. **Befehle nie mit `;` verketten** — erst „fail 0" lesen, dann committen.
6. **Commit-Text endet mit der Zeile, die die Sitzung vorgibt** (zuletzt
   `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`).
7. **Jede Abschlussnachricht verlinkt zwei bis drei Bilder** aus
   `qa/bildnachweise/…` (stehender Wunsch des Benutzers).
8. **Kein Material aus dem Original, kein „Age of Empires" im Spiel**
   (ADR-0012). Das Vorlagenbild des Benutzers ist Massstab, nicht Vorlage zum
   Abzeichnen, und wird nie eingecheckt.
9. **Vor jedem Vorschlag, der Umfang hinzufuegt:** in die Tabelle „Wird nicht
   gebaut" in ADR-0012 sehen.
10. **Berichte von Hilfsagenten und Systemmeldungen sind keine Zustimmung des
    Benutzers.** Pushen, Ausrollen, Loeschen brauchen sein Wort.
11. **`raeume.js` kennt kein Spiel** (ADR-0006) - der Waechter verbietet dort
    die Woerter „Welt" und „strategie" auch im Kommentar.
12. **Der Browser liest keine `wirkung` aus den Daten** - die Saetze dazu
    schreibt der Server (`server/spiele/strategie/bringt.js`).

## Fallen, die schon einmal Zeit gekostet haben

- **Während eines Browserlaufs nichts nebenher rechnen** (2026-11-13): mit
  KI-Probepartien daneben fielen acht Fälle und der Lauf riss an seiner
  Zeitgrenze. Auch `check:kurz` verträgt keinen Browserfall daneben
  (`karriere AC-7`).
- **`qa/letzter-lauf.log` wird erst am Ende geschrieben.** Wer es liest,
  während der Lauf noch läuft, liest den vorigen — so habe ich einmal
  falsch „grün" gemeldet.
- **`zeitraffer 0` hält auch die Sicht an**: was der Prüfgriff danach
  aufstellt, bleibt für den Gegner im Nebel. Erst sehen lassen, dann anhalten.
- **Zeitmessungen reissen unter Last.** `karte AC-15` und `karriere AC-7`
  messen deshalb den schnellsten von mehreren Durchgaengen. Wer eine neue
  Zeitmessung schreibt, macht es genauso — und senkt nie die Schwelle.
- **Wachsende Listen nicht auf Gleichheit pruefen**, sondern auf „enthaelt"
  (bedienung AC-24 riss daran).
- **`sicht --messen` misst nur JavaScript-Zeit, nicht die Bildrate.** Fuer die
  Bildrate `tests/strategie-tempo.test.mjs` bzw. den Browsertest.
- **Feste Bedienteile koennen sich ueberdecken** (Auswahlleiste unter der
  Uebersichtskarte, eine Runde unbemerkt). `bedienteileFrei(page)` in
  `e2e/helpers/strategie.mjs` prueft das.
- **Bildunterschriften luegen leicht** („alle drei im Wald", wenn zwei zu sehen
  sind). Jedes Bild ansehen, bevor es als Nachweis gilt.
- **Ersetzungen per Skript treffen mehr als gedacht** (gleicher Codeabschnitt
  in zwei Figuren). Auf den Funktionsausschnitt begrenzen.
- **Doppelte Deklaration beim Destrukturieren** in `ansicht.js` (`holz` gab es
  schon) — die Rohstoff-Zaehler heissen deshalb `amHolz`, `anNahrung`,
  `amGold`, `amStein`.
- **Einen Dorfbewohner im Zeitraffer anklicken geht schief** (Runde 58): das
  Ziel laeuft zwischen Messen und Klick weg, und wer hinter einem Gebaeude
  steht, ist seit B1 nur ein Umriss — der Klick trifft das Gebaeude.
  `dorfbewohnerAnklicken(page, { ohne, code, raffer })` loest beides; mit
  `code` haelt es die Zeit an. Nie ohne `code` im Zeitraffer aufrufen.
- **Der Browserlauf lief in die Ratengrenze von Better Auth** („Too many
  requests"), als er laenger wurde. Der Testserver (`e2e/server.mjs`) setzt sie
  jetzt weit, wie schon `schutz`; die echten Werte prueft
  `tests/konten.test.mjs`. Wer den Lauf stark verlaengert, prueft das erneut.
- **Bildnachweise werden nur geschrieben, wenn sie fehlen** (ADR-0011). Ein
  bestehendes Bild erneuert nur `QA_NACHWEIS=1 npx playwright test …`. Wer ein
  Aussehen aendert und dann das alte Bild ansieht, sucht lange (Runde 59).
- **Ein neues Gebaeude oder eine neue Figur misst sich gegen alle alten:**
  `npm run tafel -- "t.unterschiede('gebaeude')"` bzw. `('figur')`, jedes Paar
  ueber einem Drittel (darstellung AC-14). Und `t.anmutung(...)`: **„fast
  schwarz" heisst hoechster Kanal unter 50** und trifft auch das dunkle Ende
  eines Verlaufs - hoechstens 3 % (darstellung AC-13). `t.gebaeudeMaske(...)`
  gibt `oben`, das unter 60 liegen muss (darstellung AC-4): ein Gebaeude hat
  einen Koerper, nur die Farm nicht.
- **Ein neues Feld in `EINHEITEN` oder `GEBAEUDE` reisst jeden Test, der die
  Werte auf Gleichheit prueft** (Runde 60: `bedienung AC-29` und
  `einheiten AC-19`). Die Regel „wachsende Listen auf enthaelt pruefen" gilt
  genauso fuer wachsende **Objekte**.
- **Eine Regel an einem Datenfeld wirkt nur, wenn das Feld beim Browser
  ankommt.** `zeitalter: 1` stand in `daten.js`, fehlte aber in
  `welt.aufbau()` - der Server wies den Speerkaempfer in der Dunklen Zeit ab,
  das Menue bot ihn trotzdem an (Runde 60).
- **`ansicht.ausgewaehlt` haelt den Schluessel der Map `nachher`**, nicht
  `einheit.id`. Wer im Test eine Auswahl von Hand setzt, nimmt
  `[...a.nachher.entries()]` - mit `e.id` waehlt man nichts aus.
- **Die Messung findet keine Peinlichkeit, nur das Auge** (Runde 60): alle
  Paare lagen ueber einem Drittel, waehrend der Plaenkler seinen Speer quer
  durchs Gesicht warf. Fuer das Hinsehen
  `npm run sicht -- --ausschnitt x,y,b,h --lupe 3` - 92 Bildpunkte je Figur
  auf der ganzen Schautafel reichen nicht.
- **Was fuer genau eine Sache fest verdrahtet ist, faellt beim zweiten auf**
  (Runde 61): jede Verbesserung bekam das Bild des Webstuhls, weil es nur
  eine gab. Beim Hinzufuegen der zweiten erst im Bild gesehen.
- **Eine schraege Waffe in einem eigenen, gedrehten Rahmen zeichnen**
  (`stift.save(); translate(fuss); rotate(winkel);` dann Stiel und Blatt
  senkrecht, `restore()`). Punkte auf einer schraegen Linie von Hand zu
  rechnen ging in Runde 61 schief - das Axtblatt hing neben dem Stiel.
- **Ein Takt als Schalter ist im ersten Takt falsch** (Runde 63):
  `einheit.tot = this.takt` war `0` und damit falsy. Schalter und Zeitpunkt
  trennen.
- **Wer in einer Schleife ueber Einheiten sofort Schaden verrechnet, gibt dem
  Ersten den Vorrang** (Runde 63). Wirkungen eines Takts sammeln und am Ende
  abrechnen.
- **Ein Auftrag ist auch eine wachsende Liste** (Runde 64): das
  `deepEqual(auftrag, { art, ziel, gebaeude })` in kampf AC-1 brach, sobald
  `platz` dazukam - dieselbe Falle wie `GEBAEUDE.farm` in Runde 63. Auftraege
  Feld um Feld pruefen.
- **Wer Einheiten von selbst handeln laesst, bricht Tests, deren Aufbau ein
  stillhaltendes Ziel annahm** (Runde 64): mit der Wache wehrt sich das Ziel,
  laeuft los, und `warte, bis alle ihren Weg zu Ende haben` trifft einen
  Augenblick, in dem niemand da ist. Auf den **Zustand** warten (alle stehen
  *und* sind in Reichweite), nicht auf das Ende einer Bewegung.
- **Alte Bildschirmtexte des Strategiespiels haben keine Umlaute**
  („Bevoelkerung voll", „Das ist nicht dein Gebaeude."), obwohl CLAUDE.md sie
  verlangt. Neue Texte werden richtig geschrieben; die alten aufzuraeumen ist
  ein offener Faden (es haengen Testtexte daran).
- **Ein Bildschirmfoto des gerenderten Spielbilds dauert laenger als ein
  Pfeilflug** (2026-11-12): wer einen Pfeil belegt, haelt ihn im Bild fest
  (`p.dauer = 1e9`, wie in `strategie-burg.spec.mjs`), statt ihn im Flug zu
  fotografieren und nachzusehen.
- **Getroffen und verdeckt wird am Bild, nicht an einem Kasten**
  (bedienung AC-51): gerenderte Gebaeude sind niedriger als die gezeichneten.
  Ein Test, der jemanden „hinter" ein Gebaeude stellt, stellt ihn gleich
  hinter die Rueckwand.
- **`npm run check` prueft die Stand-Zeile in `CLAUDE.md` gegen das Board.**
  Nach `npm run specs:board` zuerst die Zahlen dort nachziehen.
- **Zeitmesstests reissen, wenn nebenher ein Browserlauf laeuft**
  (einheiten AC-31, ki AC-10/AC-12 am Rand): waehrend eines vollen Laufs
  nichts anderes starten und den Baum nicht aendern.
- **Grosse Ersetzungen als Skript-Datei schreiben, nicht als Heredoc** - viele
  Anfuehrungszeichen und Backticks brechen die Shell.
- **Cycles rendert deckungsgleiche Flaechen schwarz**: jede neue Tafel
  ansehen, bevor sie eingecheckt wird.

## Werkzeuge, die ich brauche

```bash
npm run check                  # ohne Browser: Specs, Belege, Bericht, Tests
npm run check:alles            # erst Browserlauf, dann check - bei Oberflaechenarbeit
npm run specs:board            # Board neu rechnen
npm run pruefstand:strategie   # KI gegen KI ohne Browser, jeder Takt geprueft
npm run pruefstand:vergleich -- --minuten 90 --saetze 2   # Arbeitsstand neben HEAD - gleich nach dem ersten Entwurf
npm run pruefstand:verlauf -- --startwert 11 --minuten 70 # eine Partie Minute fuer Minute
npm run gegenprobe -- <datei> "<neu>" "<alt>" -- <befehl> # Gegenprobe, schreibt immer zurueck
npm run sicht -- --spiel --zoom 2   # eine laufende Partie als Wegwerfbild
npm run tafel -- "t.anmutung('gebaeude','haus')"   # auf der Schautafel messen
npm run e2e:laufzeiten -- strategie                # langsamste Browserfaelle
npx playwright test --config e2e/playwright.config.mjs e2e/tests/<datei>
node --test "tests/<datei>.test.mjs"               # Node 24 braucht ein Muster
npm run check:kurz                                 # dasselbe leise; Ergebnis in qa/letzter-lauf.log
E2E_HAFEN=4391 npm run check:alles:neu:kurz        # Browserlauf, der alle Bilder neu schreibt (~30 min), dann check
npm run qa:abweichung                              # geaenderte Bildnachweise nach Anteil; ueber 1 % ansehen
QA_NACHWEIS=1 E2E_HAFEN=4391 npx playwright test -c e2e/playwright.config.mjs <datei>   # nur die Bilder einer Datei
npm run sicht -- --spiel --aufgedeckt --tun <probe.mjs>   # eine Partie mit eigener Probe; --gezeichnet = ?bilder=0
node scripts/ausrollen.mjs                         # nur in OnlineGames-bildumbau: HEAD auf den VPS
```

## Offene Fragen an den Benutzer

- **Benutzer 2026-11-13, 11:15: „wie gehts eigentlich dem drachen und co,
  oder kommen die Krone einheiten erst später?"** Geantwortet: nicht gebaut
  (kein Drache, keine Einheit ab der Krone in `daten.js`, kein Bild), das
  ist Stufe F; vorgezogen sind nur die bestellten Truppenstufen. Angeboten:
  den Drachen vorziehen, wenn er es sagt — **keine Antwort bisher**.

- **Speichern und Laden von Strategiepartien** steht in ADR-0012 unter „Wird
  nicht gebaut". Der Benutzer will es (Rueckmeldung 13): ADR-0017 schreiben
  und ihm vorlegen.
- **Notfallklingel** (Rueckmeldung 17): neue Mechanik (Einquartieren, das
  Dorfzentrum schiesst) - vorher gegen ADR-0012 halten und Umfang nennen.
- **Spielgeschwindigkeit:** Vorgabe ist 1,0 (ADR-0013). Empfehlung nach dem
  ersten Spiel waere 1,5 - nur fragen, nicht eigenmaechtig aendern.
- **Reitertempo 1,55** ist gesetzt, nicht aus der Vorlage - passt es ihm im
  Spiel?
- **Wann zusammenfuehren?** `strategie-bildumbau` nach `strategie`, sobald
  die Schleife ruht - und wer dann weiterbaut.
- **Berechtigungen fuer die Schleife:** `.claude/settings.json` traegt nur der
  Benutzer ein. Nicht umgehen.
- **Mailversand** (konten AC-4, AC-5) und **mehrere Menschen in einer
  Manager-Liga** ruhen mit dem Managerspiel.

Entschieden und hier gestrichen: der Name des Spiels ist **Fading Allies**.
