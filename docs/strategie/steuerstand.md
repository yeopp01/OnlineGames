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

**2026-11-24, Abend — alles nach main** (Benutzer: „wir haben nur main auf
github, alle andren branches nur lokal, deshalb müssen wir alles nach main
mergen, und dann pushen“). `f6da5fd` (Vorgabe 1,5) nach `main` gepusht —
**nicht ausgerollt**. Danach `manager-zusammen` (`6a6ac25`, mit
manager, manager-dynamik, manager-m1) echt gemergt als `27ad41f` (28
Managerbilder von der Managerseite), check:kurz grün (1222 Tests, 2 todo
im Manager, 37 Partien), gepusht: **origin/main = main = strategie =
`27ad41f` = Server** (ausgerollt auf sein Wort „ja pls deploy“, Konten
gesichert nach `sicherung/20261124-170135`, von außen erreichbar, wss
steht). Laufen als Agenten: KI-Runde (a3e32aa7f88464c7c,
`OnlineGames-kirunde`, `strategie-ki-runde`, Hafen 4421, Fassung 3) und
Glocke/Haltungen (a884146e4d0f2d010, `OnlineGames-glocke`,
`strategie-glocke`, Hafen 4431, Fassung beim Mergen auf 4 umnummerieren).
Nach beiden: ganzer Browserlauf allein, qa:abweichung, pushen.
**KI-Runde gemergt** als `3eb0302` (check:kurz grün, 1241 Tests, 39
Partien; gepusht `27ad41f..3eb0302`, nicht ausgerollt): ki AC-29 fertig
(Nebel mit Drache 109/120, Median 38,2; ohne 106), ki AC-28 `in-qa`
(Burgeinheiten frei, Söldner/Eiben-/Pavesenschütze in `NOCH_NICHT`),
Häuser 71/65/53/34/25 % — spielziel AC-18 reißt; Vorschläge des Agenten
(Eschenbruch Holz 0 oder Reichweite ab Krone, Silberfurt Gold +20 %) beim
Benutzer. einheiten AC-52 gepaart belegt nichts (1 Ruf in 120).
**Glocke gemergt** (Merge in Arbeit, Agent mit API-Fehler beendet nach
seinem Bericht): `9b541da`, bauen AC-58 bis AC-61, kampf AC-28 bis AC-31;
**Fassung 4** mit leerem `SCHRITTE[3]`, `strategie-3.fast` bleibt der der
KI-Runde, `strategie-4.fast` neu. Board 682/766. Der Agent hatte nach
seiner letzten Korrektur kein ganzes check gefahren. Fragen an den
Benutzer: Dorfzentrum leer schießt nicht, Wehrstein +1 auch am besetzten
Dorfzentrum, „hinein“ nur aus 1,2 Feldern (umstellt = niemand hinein).
**Nicht nach main:** `strategie-ki-antwort` („nicht wirksam“) und
`strategie-mauerring` („reißt die Grenzen“) — geparkt, ein Merge bräche
den Nebeltest.

**Strategie, 2026-11-24 — speichern AC-18 gebaut** (Benutzer, auf die
Frage, ob AC-18 vor dem Regelpaket kommt: „Gibts grade noch was zu tun?
Dann gerne angehen.“ — gelesen als Zustimmung, ADR-0017 Punkt 7 zu ändern;
Nachtrag mit seinem Wortlaut in der ADR). Anlass war seine Frage, ob ein
Stand nach drei Tagen noch aufgeht, wenn dazwischen ausgerollt wurde —
vorher nicht, sobald eine Runde ein Feld anlegt. Jetzt: `SCHRITTE[n]` in
`stand.js`, Probestand je Fassung unter `tests/staende/` (nie neu
schreiben), `tests/strategie-hochziehen.test.mjs`, Wächter verlangt
Schritt und Probestand. Dabei gefunden: das Abbild der Fassung 1 kannte
`einheit.nachladen` und `einheit.hungert` nicht (erst beim ersten Schlag
bzw. am Drachen gesetzt) — nachgetragen, die Probepartie gehört jetzt zur
Formermittlung. **Für das Regelpaket heißt das: jedes neue Feld braucht
`FASSUNG = 2` und `SCHRITTE[1]`**, der Probestand 1 liegt schon.
Nachricht der Sitzung onlinegames-d5 (wollte manager-m1 erreichen)
beantwortet: „nicht ich“. **Vorfall:** `KONTEN_GEHEIMNIS` des Servers
stand einmal im Protokoll einer Sitzung — nie wieder Umgebungen oder
`.env` des Servers ausgeben; ob es getauscht werden soll, entscheidet der
Benutzer (gesagt). AC-18 committet als `07136e5`, nicht gepusht.
**Regelpaket läuft als Agent** (ae25eb22bd1ec8f04) in `OnlineGames-regeln`,
Zweig `strategie-regelpaket`: Patch `e0a6155`, Merge von `strategie`
`ee0a396`; uncommittet `FASSUNG = 2`, `SCHRITTE[1]` (`reihenZufall`,
`reihe`, `pfeileImFlug`, je Einheit `reihe`, `taktX`, `taktY`), Probestand
`strategie-2.fast`. **Fertig gemeldet: `299b62b`** (+ `748e5c0`
Erkenntnisse), Board 631/718, check:kurz des Agenten grün (1148, 37).
Nebel 107/120, Median 38,5, 0 ohne Sieger. Remis im Gefechtsstand
nachgemessen: alle beidseitiger Untergang, keines auf Zeit. **Abweichung
von Entscheidung 1:** ki AC-25 nimmt nur eigene Dorfbewohner aus (mit
allen eigenen Einheiten fiel Startwert 10), Gegenprobe dazu bleibt grün
= nicht belegt — Frage an den Benutzer. Noch offen: ganzer Browserlauf
allein (wartet auf den S4-Agenten), Merge und Ausrollen nur auf sein Wort.
**S4 fertig gemeldet** (`OnlineGames-s4`, Zweig `strategie-speichern-s4`,
`dc7118c`): AC-14, AC-22 bis AC-26 `fertig`, 77/77 betroffene
Browserfälle, sieben Gegenproben fallen; acht gesetzte Entscheidungen
(Einladung im Vorraum statt Mail, Stilllegen ohne KI, ein Nein verwirft,
fortgesetzt zu mehreren beginnt angehalten …) als Fragen an den Benutzer.
**Prüfzweig `strategie-zusammen`** (`edd0203`, im Arbeitsbaum
`OnlineGames-regeln`) = Regelpaket + S4, Board 637/718. **Browserlauf
dort 359 grün, rot nur darstellung AC-10** (47,5 Bilder/s, Grenze 50) —
fällt einzeln auch auf `strategie` (37,2 und 47,0), Rechnerstreuung, nicht
gelockert. `qa:abweichung` 33 über 1 %, die meisten angesehen (Laufregel
verschiebt Figuren), alle stimmig. `check:kurz` grün (1154 Tests, 37
Partien). Bilder committet als `ace9811`. **Auf sein Wort** („ja bitte
weitermachen“, auf „Sag ja, dann mache ich das“): `strategie` und `main`
vorgespult auf `ace9811`, gepusht (`7a0bf0a..ace9811`), ausgerollt.
ki AC-25 bleibt bei Dorfbewohnern, die S4-Entscheidungen gelten — kein
Einwand. Jetzt: Spielgeschwindigkeit 1,5, dann die KI-Runde als Agent.

**Managerspiel, zusammengeführt nach `main` (2026-11-24, auf sein Wort
„ja bitte mal alles zum manager zusammenführen nach main“):** Arbeitsbaum
`C:/Users/danie/OnlineGames-zusammen`, Zweig `manager-zusammen` von
`ace9811`: `4020a4b` (M1), `39b125c` (Spieldynamik), `531e932`
(Managerbilder neu), `6a6ac25` (Board 673/758). `main` lokal darauf
vorgespult, **nicht gepusht, nicht ausgerollt**. `strategie` (`f6da5fd`,
Spielgeschwindigkeit 1,5) zieht nicht mit — vor dem nächsten Zusammenführen
`main` in `strategie` mergen. Geprüft: check:kurz grün (1222 Tests, 37
Partien), Managerbrowserlauf 55/55, Gleichstand „gleich“. Offen beim
Benutzer: transfer AC-31 (Empfehlung 3 je Fenster), kader AC-24 (`in-qa`
oder Jugend 75 %); Bildunterschrift karriere AC-09 verspricht mehr, als der
Ausschnitt zeigt (schon in M1). Arbeitsbäume `-dynamik`, `-zusammen` und
`manager*` können weg — nur auf sein Wort; in `manager-m1` liegen 61
uncommittete Bildnachweis-JSON, nicht mitgenommen.

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

---

## Stand

- **Zweig `strategie` = `main` = `origin/main` = Server auf `ace9811`**
  (Regelpaket, speichern AC-18 und S4, ausgerollt 2026-11-24 auf sein
  Wort „ja bitte weitermachen“). In der Konten-SQLite des Servers steht
  die Tabelle `partiestand`. **Nicht geprüft:** eine echte Partie auf dem
  Server sichern und öffnen (braucht ein Konto dort — kein Testkonto
  ungefragt angelegt) und wie stark gepackt wird. 637 von 718 Kriterien
  fertig, 1154 Tests ohne Browser, 37 ganze Partien, 363 im Browser
  (Zahlen in `CLAUDE.md`, Board `specs/BOARD.md`).
- **Arbeitsbäume neben dem Hauptordner:** `-regeln` (`strategie-regeln` `d87d84f`, Doku des
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
   Tests, 37 Partien); Bilder `55bbb31`. **Ausgerollt** mit `ab49274`
   (Benutzer: „ja, bitte ausrollen. gerne die anderen sachen noch
   mitfixen“ — gegen die gesetzten Entscheidungen nichts eingewandt).
   Die zwei Fixes: oben verschwindet der Pausenknopf, solange das Feld
   in der Mitte steht (Klasse `imPausefeld`, nicht `hidden` — daran
   hängt das Menü; F3 bleibt); der Browser merkt sich mit dem Platz,
   wie lange die Partie wartet (`wartet`: allein mit Sichern 2 min,
   sonst 30), und bietet danach keine Rückkehr mehr an — belegt in
   speichern AC-8, Gegenprobe fällt. Pause, Fortsetzen und
   Rückmeldungen im Browser 35 grün, `check:kurz` grün (1126, 37).
3b. ~~speichern AC-18~~ gebaut 2026-11-24 (siehe oben), nicht gepusht,
   nicht ausgerollt — ohne Browser belegt, kein Oberflächenteil berührt.
4. ~~Regelpaket und S4~~ zusammengeführt, gepusht, ausgerollt (`ace9811`).
5. ~~Vorgabe Spielgeschwindigkeit 1,5~~ gebaut (ADR-0013 Nachtrag,
   spielziel AC-23): `vorgabe: 1.5`, Werte ohne „(normal)“, `partieMit`
   wählt ohne Angabe 1,0. Browserlauf 359 grün, 2 übersprungen, rot nur
   darstellung AC-10 (49,4 Bilder/s, Grenze 50 — Streuung, nicht
   gelockert), 55,5 min. `qa:abweichung` 264 Bilder, 24 über 1 % —
   angesehen (darstellung AC-07, bedienung AC-07, fahrplan AC-12,
   spielauswahl AC-05): Zeitpunkte und Lagen verschoben, weil die von Hand
   eröffneten Partien jetzt auf 1,5 laufen; stimmig. `check:kurz` grün
   (1154 Tests, 37 Partien). Committet auf `strategie`, **nicht gepusht,
   nicht ausgerollt** (sein Wort fehlt dafür). Die KI-Runde läuft danach als
   Agent (Auftrag `scratchpad/auftrag-ki-runde.md`, Arbeitsbaum
   `OnlineGames-kirunde`, Zweig `strategie-ki-runde`, Hafen 4421).
6. Danach als Agent: Häuser-Balance (spielziel AC-18), ki AC-28, Drache
   Variante A (`scratchpad/ki-krone/ac29/`), einheiten AC-52 gepaart
   (höchstens 20 %); `trifft()` in `ki.forschenPruefen` zählt den
   Reiterschützen noch als Kavallerie.
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
- **Spielgeschwindigkeit Vorgabe 1,5** (Entscheidung 4 vom 2026-11-22;
  ADR-0013 und spielziel AC-23 nachgezogen), Wahl 1,0 / 1,5 / 2,0 bleibt.
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
