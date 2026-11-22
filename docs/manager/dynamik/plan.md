# Managerspiel: Plan zur Spieldynamik (2026-11-22)

Grundlage: [`durchsicht.md`](durchsicht.md) (Fable, nur gemessen). Plan von
Opus, **vom Benutzer freigegeben** am 2026-11-22 abends: „ja, es geht los -
wir gehen das jetzt an, du darfst auch starten mit den schritten - und gerne
auch subagenten triggern."

Zweig `manager-dynamik` (ab `manager-m1` `b45d20a`), Arbeitsbaum
`C:/Users/danie/OnlineGames-dynamik`, Browser falls nötig `E2E_HAFEN=4279`.
Die Managersitzung arbeitet weiter in `manager-m1` (nur `public/manager/*`,
`e2e/tests/manager-*`, Bilder, `bedienung.md`, ihr Steuerstand, Hafen 4278)
und fasst `server/spiele/manager/*` und den Fingerabdruck nicht an.
**Zusammengeführt wird `manager-m1` in diesen Zweig, nicht umgekehrt.**

## Die Bänder (Benutzer: „die Bänder passen, es sollte kein absichtlich hartes Pflaster sein")

Über 20 Saisons ohne Menschen, mehrere Startwerte:

1. In jeder Saison höchstens **zwei Vereine je Liga unter −3 Mio**
   (verschärft finanzen AC-7, das nur drei Saisons misst).
2. **Konto-Median je Liga über null** in jeder Saison.
3. **Jahresgehalt eines 24- bis 28-Jährigen = 15 bis 25 % seines
   Marktwerts** (heute 47 bis 54 %).
4. **Spieler ab Stärke 85 in Liga 1** ab Saison 5 zwischen rund 3 und 8
   (heute 19 in Saison 8, dann 2 bis 3,5).
5. **Durchschnittsalter 23 bis 25** ab Saison 2 (kader AC-24). Bis
   2026-11-22 abends stand hier 25,5 bis 27; geändert auf die Empfehlung
   hin (Benutzer: „ja, bitte fortfahren"): je Saison kommen rund 72
   Siebzehnjährige in die Kader, rund 40 % der Spieler sind 20 oder jünger,
   und keine Variante der Gegenproben kam über 25,1, ohne Niveau zu
   verlieren. Die erste Saison zählt nicht (Startwelt 18 bis 33, im Mittel
   25,5 bis 26).

Vier weitere, seit dem 2026-11-22 abends (Benutzer: „ja, bitte
fortfahren"), mit der Ausgangszahl auf Schritt 2 (`7d9f9ff`, Startwerte
4711, 20260910, 77, 1234):

6. **Kein Geburtstag als Klippe** (transfer AC-27): bei gleicher Stärke
   und gleichem Talent kostet ein Jahr höchstens 15 % des Marktwerts,
   geprüft an der Formel für jedes Alter 17 bis 36 und Stärke 45, 60, 75,
   90. Schritt 2: 23 → 24 −15 %, 28 → 29 −35 %, 31 → 32 −54 %.
7. **Reichtum hat eine Grenze** (finanzen AC-19): das größte Konto der
   Liga 1 am Saisonende unter dem Vierfachen der Einnahmen dieses Vereins
   in der Saison (ohne Ablösen). Schritt 2: reißt ab Saison 13 / 13 / 16 /
   10, in Saison 20 4,7- / 5,1- / 5,0- / 8,1-fach (242 / 146 / 155 / 339
   Mio). Schritt 6.
8. **Die Jugend kommt an** (kader AC-25): ab Saison 2 liegen die
   Siebzehnjährigen aus dem eigenen Nachwuchs im Mittel höchstens 15 unter
   dem Niveau ihres Vereins, und die Zwanzigjährigen spielen im Mittel
   mindestens 30 % der Pflichtspielminuten (gezählt, wo es mindestens 30
   gibt — in Saison 4 ist die Startwelt schon 21 und die erste Jugend erst
   19). Schritt 2: Abstand −21,5 bis −23,8 in jeder Saison, reißt; die
   Spielzeit mit 20 hält (39 bis 78 %). Gemessen über die Saisons 6 bis 20,
   Spielanteil nach Alter: 17 9–10 %, 18 23–25 %, 19 39–42 %, 20 52 %, 21
   61–63 %, 22 65–67 % — beim eigenen Nachwuchs gleich. Die 30 % mit 20
   sind also kein Hebel, sondern ein Riegel: Schritt 4 darf die Jugend
   nicht auf die Bank schieben.
9. **Wer spielt, entwickelt sich** (kader AC-26): wer mit 25 bis 30 ein
   Jahr später noch im Verein steht, nach Spielanteil gedrittelt — das
   obere Drittel legt im Mittel mindestens einen Punkt mehr zu als das
   untere. Schritt 2: −0,6 bis +0,5 je Saison, Mittel rund −0,1 — die
   Spielzeit wirkt in `kader.entwickeln` nur bis 24. Schritt 5.

Gemessen werden alle in `scripts/manager-dynamik-messung.mjs`
(`GRENZEN`, `baenderPruefen`), die Tests in
`tests/manager-welt-baender.test.mjs` (Startwert 20260910).

Und wie immer: Tore, Heimsiege, Unentschieden bleiben (`npm run
manager:messen`, zuletzt 3,20 Tore), jede Änderung bekommt einen neuen
Fingerabdruck (`npm run manager:gleichstand`, spielziel AC-17).

## Schritte

0. **Messwerkzeug**: `dynamik.cjs` als `npm run manager:dynamik`, Wechsel
   aus `spieler.laufbahn.wechsel` zählen, Jugend nach Jahrgang. Die Bänder
   als Kriterien `offen` in den Specs, die Tests dazu in `manager-welt`.
1. **Gegenproben je eine Größe**, nur gemessen: (a) Liga 2 startet auf
   ihrem Gleichgewichtsniveau, (b) Gehaltsgrenze der KI allein, (c)
   Starttalent wie die Jugend verteilt, (d) Gehalt/Marktwert umgewichtet.
2. **Haushalt der KI**: Gehaltssumme höchstens rund 85 % der erwarteten
   Einnahmen — darüber nicht verlängern, billiger ersetzen, Lücken im
   Budget stopfen.
3. **Preisgefüge**: Marktwert steiler (Exponent 5, normiert bei 65), Gehalt
   flacher; Altersfaktor linear zwischen Stützpunkten; Handgeld für
   Vereinslose gegen den Händler-Hebel; KI-Budget (70 % Konto) prüfen.
   Achtung (Widerspruch zu Fable): ein flacheres Gehalt allein macht
   Liga 2 *teurer* relativ zu ihren Einnahmen — zusammen mit Schritt 2.
4. **Starttalent angleichen** (nur neue Karrieren), Abbau ab 29 halbieren
   und streuen, Karriereende ein Jahr später.
5. **Entwicklung mit Leistung und Neigungen** (siehe unten).
6. **Reichtum**: nach Schritt 2 neu messen; bleibt es, Unterhalt des
   Stadions je Platz.

## Stand

**Schritt 2 steht** (finanzen AC-17, AC-18 `fertig`). `HAUSHALT` in
`transfer.js`, `finanzen.erwarteteEinnahmen()` und `sponsorBasis()`:

- Gehaltsgrenze der KI = `0,85 × erwartete Einnahmen + max(0, Konto −
  0,5 × erwartete Einnahmen) / 2` — über einer halben Jahreseinnahme als
  Rücklage darf das Überschüssige in zwei Jahren in Gehälter gehen
  (`anteil` 0,85 aus der Durchsicht gesetzt; `ruecklage` 0,5 und
  `abbauJahre` 2 über einen Vergleich gewählt, siehe unten).
- Verpflichten und Verlängern achten auf die Grenze (aus Gegenprobe b);
  ein Loch wird weiter mit einem Billigen gestopft (`lochGehalt` 400, alt).
- `kiTransfers` probiert jede Position mit Loch, nicht nur die erste;
  unter `MINDESTBESTAND` greift als Notnagel der billigste Vereinslose.

Gemessen mit `npm run manager:dynamik -- --saisons 20 --startwerte
4711,20260910,77,1234`:

| | HEAD `05b39b2` | Schritt 2 |
| --- | --- | --- |
| finanzen AC-17 (≤ 2 je Liga unter −3 Mio) | reißt an allen vier | hält an allen vier (4711: L1 genau 2) |
| finanzen AC-18 (Konto-Median > 0) | reißt an allen vier | hält an allen vier |
| Konto-Median L1 / L2, Saison 20 | 8,5 / −10,9 Mio | 44,9–56,1 / 7,8–8,2 Mio |
| Niveau L1 / L2, Saison 20 | ~69,4–70 / 57,8 | 69,2–69,7 / 57,3–57,8 |
| kleinster Kader | 13 | 14 |
| Tore / Heimsiege / Unentschieden | 3,20 / 47,1 % / 22,0 % | 3,16 / 48,5 % / 20,6 % |

Konto-Median Liga 1 in Saison 5 / 10 / 20: 4711 28,0 / 50,1 / 44,9 ·
20260910 19,0 / 32,6 / 48,7 · 77 34,0 / 43,6 / 56,1 · 1234 23,1 / 32,4 /
48,7 — rund zwei Jahreseinnahmen (L1 in Saison 20 26–29 Mio; 77 liegt
beim 2,1-fachen). Das größte Konto
in Saison 20 liegt bei 145 bis 339 Mio: **Reichtum einzelner bleibt**
(Schritt 6). Verworfen, L1-Median Saison 20: ohne Abbau über der Rücklage
40–70 (L2 nur 3–4), Stufe Rücklage 1 × / Anteil 1,0 74–90, Abbau in 5 Jahren
53–58, in 10 Jahren 65–79, Rücklage 1 × / 3 Jahre 41–67; eine Stufenregel
ließ den reichen Verein in transfer AC-16 nichts kaufen. Reiche Vereine
sparen auch ohne Grenze (Gehalt zu Einnahmen rund 0,9) — ihre Nachfrage
begrenzt der Kader, nicht das Geld.

Weiter rot: transfer AC-26 (Gehalt zu Marktwert, Saison 1 44 %), kader
AC-23 (Spieler ab 85), kader AC-24 (Alter: 24,6–25,0 ist nur Saison 2, ab
Saison 6 sind es 22,7–23,3 — reißt also auch das Band 23 bis 25 unten) —
Schritte 3 und 4.
Tore und Unentschieden bewegen sich um rund einen Standardfehler.

**Schritt 3 steht, anders als oben geplant** (transfer AC-26, AC-27
`fertig`). Gebaut ist die Gegenprobe **m3**, nicht „Exponent 5, Gehalt
flacher“: das Gehalt bleibt, wie es ist (Vorgabe der Freigabe), nur der
Marktwert steigt. In `kader.js`:

- `WERT_JE_GEHALT = 2,3` — der Marktwert ist das 2,3-Fache von vorher, bei
  gleichem Gehalt. **Gesetzt**, aus der Gegenprobe m3 (19–20 % in beiden
  Ligen), nicht weiter abgestimmt.
- `ALTERSPUNKTE` — der Altersfaktor linear zwischen Stützpunkten (21: 1,35,
  26: 1,15, 30: 0,75, dann 31 bis 35 je Jahr 0,65 / 0,56 / 0,48 / 0,41 /
  0,35; ab 35 bleibt er stehen). Die Stützpunkte ab 31 sind **gesetzt**, so
  dicht, dass kein Jahr mehr als 15 % kostet: größter Verlust 34 auf 35
  mit 14,7 %, 28 auf 29 jetzt 11,8 % statt 35 %. Dass 35 und 36 gleich viel
  wert sind, ist eine Folge, keine Absicht — mit 36 hört fast jeder auf.
- `STARTKONTO` ×2,3 (Liga 1 `g · 110 · 2,3`, Liga 2 `g · 60 · 2,3`). **Nicht
  geplant, nötig:** mit doppelten Werten und altem Startkonto bekam ein
  Verein der ersten Liga im ersten Fenster in 30 Startwerten 27-mal kein
  einziges Angebot statt 9-mal, denn ein Gebot darf höchstens 70 % des
  Kontos sein (transfer AC-11) — transfer AC-11 und AC-20 fielen. Der
  Faktor ist **gesetzt** (derselbe wie beim Wert), nicht abgestimmt.

Gemessen mit `npm run manager:dynamik -- --saisons 20 --startwerte
4711,20260910,77,1234`, Schritt 2 (`6196e2b`) gegen Schritt 3:

| Band | Schritt 2 | Schritt 3 |
| --- | --- | --- |
| finanzen AC-17 | hält an allen vier | hält, an allen vier nie einer unter −3 Mio |
| finanzen AC-18 | hält; Median S20 L1 44,9–56,1, L2 7,8–8,2 Mio | hält; L1 20,0–46,1, L2 5,3–6,7 Mio |
| transfer AC-26 | reißt (Saison 1 44 %) | **hält**, jede Saison 18–21 % |
| transfer AC-27 | reißt (−15 / −35 / −54 %) | **hält**, höchstens 14,7 % |
| kader AC-23 | reißt | reißt (S5–20: 1 bis 21 ab Stärke 85) |
| kader AC-24 | reißt unten (S20 23,1–23,2) | reißt unten (Minimum 22,78–22,89; S20 23,0–23,3) |
| finanzen AC-19 | reißt ab S10–16; S20 4,7–8,1-fach | **reißt früher**, ab S5–7; S20 4,9–8,3-fach, größtes Konto 190–321 Mio |
| kader AC-25, AC-26 | reißen | reißen (Jugend rund 21 bis 24 unter dem Niveau) |

`npm run manager:messen`, HEAD → m3 ohne Startkonto → Schritt 3, über 3 / 9
Startwerte: Tore 3,16 → 3,21 → 3,23 / 3,16 → 3,19 → 3,20; Heimsiege 48,5
→ 47,3 → 47,7 / 46,2 → 46,9 → 46,9 %; Unentschieden 20,6 → 22,2 → 20,6 /
22,4 → 22,1 → 22,2 %; Favorit 52,0 → 51,1 → 52,5 / 51,3 → 51,5 → 50,5 % —
innerhalb der Streuung. Stärke L1 68,0 → 69,2 / 68,5 → 69,7, kleinster
Kader 16,3 → 17,7 / 16,6 → 17,6, Konto L1 14,6 → 27,4 / 14,8 → 26,5 Mio
(das Startkonto). **Nicht erklärt:** Einwechslungen je Spiel 3,17 → 2,91 /
3,18 → 2,79 (mit m3 allein 3,42 / 3,40; kein Test sieht sie, spieltag
AC-12 nennt 1,7 bis 2,0 je Mannschaft und lag schon vorher daneben), und
die Rechenzeit 190 → 227 / 154 → 240 ms je Saison (Spielstand 403 → 411 /
407 → 416 KB).

**Was es mit dem Markt macht** (eigene Messung, Scratchpad): Angebote an
einen menschlichen Verein je Lauf 58–117 vorher, 27–68 mit m3 allein,
32–49 mit Schritt 3 — sie bleiben im Lauf **rund halbiert**, denn die
70-%-Grenze am Konto wächst nicht mit, sobald die Konten im Gleichgewicht
sind. Gebot zu Marktwert 0,96–0,97. Der **Händler-Hebel** (ein Mensch, der
nur kauft und verkauft) je Saison, vorher → m3 → Schritt 3: Liga 1 Mitte
18,6 → 23,5 → 18,1 Mio, Liga 1 Bester 16,1 → 19,4 → 15,9, **Liga 2 Mitte
8,8 → 18,1 → 15,2 Mio — fast doppelt**; geholt/verkauft je Saison 5,5/3,3,
4,5/3,1, 4,6/3,1. Ein Handgeld für Vereinslose ist **nicht gebaut**.
`besterZugang` wiegt den Preis weiter mit `preis / 1500` gegen die Stärke —
bei doppelten Preisen heißt das: die KI scheut teure Spieler doppelt so
stark. **Nicht geprüft**, ob das so bleiben soll.

**spieltag AC-33 als Messung umgestellt** (`tests/manager-eingriff.test.mjs`):
über 20 Startwerte war „mild“ schon auf Schritt 2 nur +0,5 (±0,6), mit
Schritt 3 −0,4 — der Test hing am Zufall. Jetzt 40 Startwerte (mild +2,0
±0,5, hart +2,2 ±0,6), verlangt wird mild > 0, hart > 0 und hart ≤ 5;
„hart mehr als mild“ steht nicht im Kriterium und hält über 60 Saisons nur
mit 1,1 (±0,7) — gestrichen, nicht gelockert. Der Test dauert 19 statt 9,5 s.

Weiter rot: kader AC-23 bis AC-26 (Schritte 4 und 5), finanzen AC-19
(Schritt 6 — der Reichtum ist mit Schritt 3 **schlimmer** geworden).

**Schritt 4 steht** (kader AC-24, AC-25 `fertig`; AC-23 bleibt `offen`,
knapp). Gehalt und Marktwert sind unverändert. Alle Werte unten sind
**gesetzt** und nur gegen die Bänder gemessen, nicht aus einer Vorlage:

- **Startwelt** (`STARTWELT` in `kader.js`): Alter 17 bis 32 statt 18 bis
  33 (sonst liegt Saison 2 über 25). Das Talent der Vereinsspieler hängt zu
  55 % am Ruf des Vereins (wie das der Jugend) und nur zu 45 % an der Güte
  der Startelf, Streuung 9,6 — sonst bringt die Startgeneration eine Welle
  von Sternen (bis 18 ab Stärke 85), die mit ihr ausstirbt (danach 2 bis 3).
- **Jugend** (`JUGEND`): kommt 5 bis 17 statt 18 bis 32 unter ihrem Talent
  an; damit sie dafür nicht zum Stern wird, liegt die Mitte des Talents 3
  tiefer und streut weiter (15 statt 12), Grenzen 50 bis 97. Hat der Kader
  nur für einen Platz, kommt der Stärkere.
- **Abbau ab 29 halbiert** und stetig: 29 bis 31 im Mittel −1 statt −2, ab 32
  −2 statt −3,5.
- **Karriereende sanfter davor**: mit 33 / 34 / 35 hören 8 / 20 / 35 % auf
  statt 15 / 35 / 60 %, mit 36 jeder. **Ein Jahr später** (Schluss mit 37)
  hielt das Alter besser, bricht aber kader AC-17 („mit 36 ist Schluss“) —
  nicht gebaut, braucht sein Wort. Vereinslose bleiben bis 35 statt 34.
- **Die KI hält an Älteren fester** (`ALTERSBLICK` in `transfer.js`):
  Vereinslose bis 34 statt 32, Spieler anderer Vereine bis 32 statt 30;
  beim Holen kostet jedes Jahr über 28 einen halben Punkt statt eines
  ganzen, beim Verlängern einen statt zwei; verlängert wird bis 35 statt
  33, wer höchstens 6 unter dem Niveau liegt (statt 2 darüber). Seit die
  Jugend stärker ankommt, verdrängt sie die Älteren — ohne das fiel das
  Alter unter 23.

**Die Schuldenspirale und ihre zwei Riegel.** Mit `ALTERSBLICK` allein
rutschte ein armer Verein der Liga 2 ins Bodenlose (4711: −35 Mio nach 20
Saisons, 2026: −16; vorher nie unter −1,7): die Älteren füllten die
Gehaltsgrenze, die Jugend kam außerhalb dazu, die Zinsen taten den Rest.
Zwei Regeln:

- `aelterRuecklage` 0,25 — Ältere als 30 verlängert nur, wer ein Viertel
  der erwarteten Jahreseinnahmen auf dem Konto hat (0,5 hielt auch, kostete
  aber kader AC-23).
- **Loch beim Verlängern** (`kiVertraege`): fiele eine Position unter den
  Mindestbestand, wird ein Billiger (≤ `lochGehalt` 400) auch über der
  Grenze verlängert — wie `besterZugang` ein Loch stopft. Sonst ging der
  Jugendspieler für 100 und kam ein Vereinsloser für 800 als Notnagel.

Über acht Startwerte mit beiden nie unter −2,8 Mio; ohne die Rücklage
(Startwert 2026) −9,2, ohne das Loch −24,1.

Gemessen mit `scripts/manager-dynamik-messung.mjs` über acht Startwerte
(4711, 20260910, 77, 1234, 5, 99, 31337, 2026), Anzahl der Startwerte, an
denen das Band in jeder Saison hält:

| Band | Schritt 3 (vier Startwerte) | Schritt 4 (acht) |
| --- | --- | --- |
| kader AC-23 (3–8 ab 85, ab S5) | 0 von 4, je 10–15 von 20 Saisons daneben | 2 von 8, je Saison 0–12 (20260910: nur S5 mit 2; 77: 7 Saisons) |
| kader AC-24 (Alter 23–25, ab S2) | 0 von 4, je 4–6 Saisons unten | **6 von 8**, 22,9–24,8 (1234: 3 Saisons 23,0; 99: 22,9) |
| kader AC-25 (Jugend) | 0 von 4, 19 von 20 Saisons | **8 von 8**: Abstand −14,8 bis −10,6, Spielzeit mit 20 32–70 % |
| finanzen AC-17, AC-18, transfer AC-26, AC-27 | halten | halten an allen acht |
| finanzen AC-19 (Reichtum) | ab S5–7 gerissen, 11–14 Saisons | nur 20260910 S11 (4,6-fach) |
| kader AC-26 (Entwicklung ab 25) | reißt, −0,01 bis −0,28 | reißt **stärker**, −0,17 bis −0,34 (Schritt 5) |

Liga 1 / Liga 2 in Saison 20 (`npm run manager:dynamik`, vier
Startwerte): Niveau 70,2 / 57,4; Alter L1 23,6 statt 23,5, L2 23,1 statt
22,7; Spieler ab 85 in L1 2,3–6,3 statt einer Welle bis 18 und danach 2–3;
Konto-Median L1 19–22 statt 22–39 Mio, L2 7–8,5 statt rund 6; größtes Konto
68–148 statt bis 321 Mio, der reichste Verein in S20 88–140 statt 190–277;
kleinstes Konto L2 −0,4 statt −1,7; Gehalt zu Einnahmen L1 0,95–1,03 statt
0,87–0,99; kleinster Kader 14.

**Nebenwirkungen, nicht beabsichtigt und nicht geprüft:**

- **Der Markt halbiert sich**: Wechsel je Verein und Saison L1 1,4–2,6
  statt 3,1–5,1, L2 0,3–1,4 statt 1,0–2,5; eingenommene Ablösen L1 12–26
  statt 40–70 Mio. Vermutlich hält die KI ihre Älteren und braucht weniger.
- **Mehr starke Vereinslose**: ab Stärke 65 41–53 statt 27 (zusammen 80
  statt 75).
- **Der Händler-Hebel wächst** (`haendler-m`, acht Saisons, Gewinn je
  Saison 4711 / 77): Liga 1 Mitte 16,4 / 18,4 → **35,1** / 22,9 Mio,
  Liga 1 Bester 14,6 / 9,1 → 20,7 / 26,0, Liga 2 Mitte 13,2 / 15,1 → 20,6 /
  20,0. Vermutet: die starken Vereinslosen. Gehört zu Schritt 6.

`npm run manager:messen` (3 / 9 Startwerte, Schritt 3 → Schritt 4): Tore
3,23 → 3,18 / 3,19; Heimsiege 47,7 → 47,3 / 47,3 %; Unentschieden 20,6 →
21,5 / 21,8 %; Favorit 52,5 → 51,6 / 51,1 %; Einwechslungen 2,91 → 2,81 /
2,86; Stärke L1 69,2 → 69,6 / 69,7; Vereinslose 65 → 79 / 77; Konto L1
27,4 → 24,9 / 24,4 Mio; Rechenzeit 202 / 182 ms je Saison, Spielstand 434 /
432 KB.

**Tests, die mit der neuen Welt rissen** (keiner gelockert, jeder an seine
Aussage gebunden):

- **kader AC-5** (`tests/manager.test.mjs`): „alt“ war ab 33 — die
  Startwelt reicht nur bis 32. Jetzt 31 und 32, die Jahre mit
  Altersabzug, und jede Gruppe muss über 20 Spieler haben.
- **spieltag AC-6**: verglichen werden Tore **je Einsatz** statt in Summe.
  Im 4-4-2 stehen doppelt so viele im Mittelfeld wie im Sturm; die Summe
  kippte schon vor Schritt 4 an Startwert 1234 (Mittelfeld 429, Sturm 390 —
  je Einsatz 0,17 gegen 0,38). **Eine Auslegung des Kriteriums**
  („Stürmer treffen am häufigsten“) — der Benutzer mag widersprechen.
- **liga AC-7** (`tests/manager-spiel.test.mjs`): der Test nimmt den besten
  Torschützen eines fremden Vereins, gibt ihm Stärke 99 und erwartet Tore.
  An 4711 war das seit Schritt 4 ein Mittelfeldspieler, der 20 Spiele ohne
  Tor blieb; jetzt der beste **Stürmer**.
- **vertraege AC-8**: bei 5 Mio und bei −5 Mio verlängerten beide dieselben
  zehn — die Gehaltsgrenze (23 314) bindet in beiden, nicht die Regel für
  das Minus (Verlängerte je Konto −5 / 5 / 10 / 20 / 40 Mio: 10, 10, 10, 11,
  18; auf Schritt 3 10, 11, 11, 13, 18). Jetzt im Plus mit 40 Mio, und
  geprüft wird dazu, was „im Minus nur die Besten“ sagt: der Schwächste,
  der im Minus verlängert wird, liegt höchstens 4 unter dem Niveau, im Plus
  darunter.
- **spieltag AC-30** (`tests/manager-eingriff.test.mjs`): 4000 statt 1500
  Spiele je Lage. Die Wirkung von „laut“ bei Rückstand und starker Moral ist
  rund +0,018 Punkte (6000 je Lage, auf Schritt 3 und 4 gleich); mit 1500
  streute sie auf +0,003, verlangt sind 0,01. Der Test dauert 17 statt 6 s.
- **Fingerabdruck** (`tests/manager-gleichstand.json`) neu geschrieben.

**Nicht geprüft:** Partien mit Menschen; ob AC-23 mit Rauschen besser als
mit „jede Saison“ gemessen wäre (das Band nicht gelockert, die Frage gehört
dem Benutzer); warum AC-24 an 1234 und 99 knapp reißt.

Weiter rot: kader AC-23 (knapp), kader AC-26 (Schritt 5), finanzen AC-19
(Schritt 6, viel besser).

## Wovon Auf- und Abwertung heute abhängt (`kader.entwickeln`)

Zweimal je Saison (Winter × 0,4 ohne Altern, Sommer × 0,6 mit Altern),
gerundet:

- **Alter** (Stufe ≤ 20, ≤ 24, ≤ 28, ≤ 31, darüber),
- **Luft** = Talent − Stärke (Talent ist feste Obergrenze),
- **Spielanteil** = Minuten / (Spiele × 90 × 0,6) — nur bis 24,
- **Technikregler** des Trainings im Mittel der Saison — bis 24, mit 25
  bis 28 nur +1 über 0,6,
- **ganzzahliger Zufall**, gleich verteilt: −1..2 (≤ 20), −1..1 (bis 28),
  −1..−3 (29 bis 31), −2..−5 (ab 32).

**Wirkt nicht:** Tore, Vorlagen, Noten (werden gezählt, `notenSumme`),
Moral, Kondition, Verletzungen, Liga, Gegner, Heim/Auswärts, Charakter.
Ab 29 fällt jeder gleich, egal wie viel er spielt. Im Winter ist der
Schritt für 25- bis 28-Jährige meist 0 (× 0,4 gerundet).

## Wunsch des Benutzers: Spieler individueller (2026-11-22)

> „die einzelnen Spieler müssten glaub noch etwas individueller werden …
> manche sind Geldgeier, manche sind fleißiger und steigen schneller auf,
> manche spielen lieber zuhause und sind dort besser, egal was … aber auch
> dies Faktoren sollten nicht zu schwarz weiß sein, sondern einfach den
> randomfaktor ein bissl beeinflussen."

Dazu: „da is vmtl noch bissl potential nen bessren randomfaktor
reinzubringen" (zur Entwicklung).

Vorschlag für Schritt 5 (noch nicht gebaut, ergänzt M2 „Spieler mit
Gesicht" in [`../plan.md`](../plan.md)): **stufenlose Neigungen statt eines
einzigen Charakters** — je Spieler wenige Werte um 0 (etwa `fleiss`,
`geldgier`, `heimliebe`, `nerven`), einmal aus dem Startwert gezogen,
meist nahe 0, selten deutlich. Sie **verschieben die Zufallsverteilung**,
statt Regeln zu schalten: `fleiss` verschiebt den Mittelwert der
Entwicklung um Bruchteile eines Punkts, `geldgier` die Gehaltsforderung
und die Wechselbereitschaft um wenige Prozent, `heimliebe` die Tagesform
daheim gegen auswärts um höchstens rund ±3 %. Dazu für alle:

- Zufall der Entwicklung **stetig** (Summe zweier Würfel oder
  normalverteilt) statt gleich verteilt und ganzzahlig; Bruchteile über
  den Winter hinweg mitführen statt runden.
- **Leistung zählt**: der Notenschnitt der Halbserie verschiebt die
  Entwicklung leicht (gute Noten mehr Zuwachs, auch noch mit 25 bis 30).
- **Spielanteil auch ab 25**: wer spielt, hält länger; wer sitzt, baut ab.

Was die Charaktere aus M2 (Profi, Heißsporn …) vorhatten, ließe sich als
Lage im Raum dieser Neigungen beschreiben — der Name ist dann ein Etikett
für den Bildschirm, keine Schaltung. Entscheiden, bevor M2 gebaut wird.
