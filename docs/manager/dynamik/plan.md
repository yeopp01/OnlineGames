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

**Schritt 6 steht** (transfer AC-28, AC-29, finanzen AC-19 `fertig`;
transfer AC-30 `in-qa`). Gehalt, Marktwert-Formel und Entwicklung sind
unverändert, die Regeln gelten für Mensch und KI gleich.

**Erst die Ursache gemessen** (Scratchpad, HEAD `4afef8e`):

- **Reichtum:** die Reichsten wurden reich aus dem Transferertrag — netto
  4 bis 9 Mio je Saison aus Ablösen, aufgefüllt mit Vereinslosen —, nicht
  aus dem Stadion. Wer reich ist, gibt seine Spieler trotzdem ab.
- **Der halbierte Markt:** die Gehaltsgrenze sperrte jede Verstärkung,
  solange der Schwächste noch im Kader stand — sein Gehalt zählte mit,
  obwohl er danach ginge. Schwache Saisons in der ersten Liga 0,4 bis 1,2
  Wechsel je Verein.
- **Der Händler-Hebel:** die Vereine kauften beim Menschen, was sie als
  Vereinslosen billiger hätten haben können.

**Gebaut** (`MARKT` in `transfer.js`, alle Werte **gesetzt**, kein Wert
aus Anstoss 3):

- `sattAb` 3 — ein Verein des Servers mit mehr als dem Dreifachen seiner
  erwarteten Jahreseinnahmen verkauft nur, wer auf seiner Liste steht —
  dem Menschen (`kaufPruefen`, Absage „… muss nicht verkaufen und gibt …
  nicht ab.“) und den anderen (`besterZugang`).
- `reichAb` 1 — wer mehr als eine Jahreseinnahme hat, sucht in jedem
  Fenster nach einer Verstärkung.
- `freiNaeher` 3 — ein Verein bietet nicht auf einen Spieler (auch nicht
  auf den des Menschen), wenn ein Vereinsloser derselben Position zu haben
  ist, der höchstens 3 schwächer ist und in seine Gehaltsgrenze passt.
- **Tausch:** bei einer Verstärkung zählt das Gehalt des Schwächsten als
  frei; steht der Verein danach über der Grenze, wird der Schwächste gegen
  Abfindung freigestellt (transfer AC-23). Auch `kiAngebote` prüft jetzt
  die Gehaltsgrenze.
- Ein Handgeld für Vereinslose ist **nicht gebaut** — mit `freiNaeher`
  nicht nötig.

Gemessen über acht Startwerte (4711, 20260910, 77, 1234, 5, 99, 31337,
2026), zwanzig Saisons:

| Band | HEAD `4afef8e` | Schritt 6 |
| --- | --- | --- |
| transfer AC-29 (L1 ≥ 1,5 Wechsel je Verein ab S2) | 0 von 8; Mittel 1,6–2,2, schwächste Saison 0,4–1,2 | **8 von 8**; Mittel 2,9–4,0, schwächste 2,0–3,1 |
| finanzen AC-19 (Reichster < 4× Einnahmen) | 7 von 8 (20260910 S11 4,6-fach) | **8 von 8**, höchstens 2,9- bis 3,7-fach |
| finanzen AC-17, AC-18, transfer AC-26, AC-27, kader AC-25 | halten | halten an allen acht (kader AC-25 knapp: −14,7 bei Grenze −15) |
| kader AC-24 | 6 von 8 | 6 von 8, dieselben (1234: 22,91; 99: 22,98) |
| kader AC-23 | 2 von 8 | 1 von 8, je Startwert 1 bis 3 Saisons daneben |
| kader AC-26 | reißt | reißt (Schritt 5) |

`npm run manager:dynamik` (vier Startwerte, Saison 20), Basis → Schritt 6:
Wechsel je Verein L1 1,95 → 3,19, L2 0,65 → 0,77 (vor Schritt 3: 3,68 und
1,36 — **die zweite Liga kommt nicht zurück**, dort ist das Geld knapp und
die meisten Zugänge sind Vereinslose); Anteil Vereinsloser an den Zugängen
L1 26 → 18 %; Konto-Median L1 22,3 → 20,9 Mio, L2 7,2 Mio (kleinstes
−3,3); größtes Konto L1 326,9 → 158,4 Mio (höchstens 165,4), L2 42,1
(höchstens 108,1); Ablöse je Wechsel L1 11,54 → 11,65 Mio, L2 3,22.

**Händler-Hebel** (`haendler.cjs`, zwanzig Saisons, Gewinn je Saison):
Liga 1 Mitte 22,9 → 0,4 Mio, Liga 1 Bester 16,1 → 0,1, Liga 2 Mitte
15,5 → −2,0. Angebote an den Händler in zwanzig Saisons 80 / 71 / 62 →
8 / 22 / 3. Belegt in `tests/manager-haendler.test.mjs` (zwölf Saisons,
drei Startwerte, Gewinn höchstens ein Zehntel der Einnahmen ohne
Ablösen): erste Liga 5,1 %, zweite −19 %; auf HEAD 126,7 % und 210,1 %
(Gegenprobe, die Testdatei gegen eine Kopie von HEAD).

`npm run manager:messen` (vor → nach): Tore 3,18 → 3,24, Heimsiege
47,3 %, Unentschieden 21,5 → 22,2 %, Favorit 51,6 → 52,3 %,
Einwechslungen 2,81 → 2,77, Stärke L1 69,6 → 69,8, Kader 18,3–23,0,
Vereinslose 79, Konto L1 24,9 → 24,6 Mio, Rechenzeit 312 → 220 ms je
Saison, Spielstand 434 → 427 KB. Fingerabdruck neu geschrieben.

**Nebenwirkungen, nicht geprüft:**

- **Angebote an einen Menschen rund zehnmal seltener** (beim Händler 80
  → 8 in zwanzig Saisons). Wer nicht handelt, sondern einen guten Spieler
  hat, bekommt vermutlich weiter Angebote — gemessen ist nur der Händler.
  *Nachgemessen: auch der Verwalter bekam kaum noch welche (L2 Mitte 0,25
  je Saison) — behoben mit transfer AC-31, siehe „Angebote an den
  Menschen" unten.*
- **Kein Mensch hat gegen die Regel „satt“ gespielt**; dass er bei satten
  Vereinen nur noch von der Liste kaufen kann, mag ihn überraschen.
- Die Grenze im Händler-Test zieht kein Handgeld ab — der Gewinn ist eher
  zu hoch gerechnet, der Test also eher zu streng.
- kader AC-23 reißt seit Schritt 6 öfter (1 statt 2 von 8).

**Für die Oberfläche** (`public/manager/*`, nicht in diesem Schritt):

- In der Marktliste ein Zeichen „verkauft nicht“ an jedem Spieler eines
  satten Vereins, der nicht auf der Liste steht — der Server muss es dafür
  mitschicken (`transfer.satt(verein)`).
- Die Absage „… muss nicht verkaufen und gibt … nicht ab.“ steht wie jede
  andere Absage; das reicht.
- transfer AC-30 wird `fertig` erst mit einem Bildnachweis davon.

### Angebote an den Menschen (transfer AC-31, 2026-11-23)

**Anlass:** nach Schritt 6 bekam ein Mensch kaum noch Angebote. Gemessen
mit einem Verwalter (`angebote.cjs`: verlängert, was im letzten
Vertragsjahr steht und höchstens 31 ist, setzt niemanden auf die Liste,
nimmt kein Angebot an — die Welt läuft also wie ohne Angebote), zehn
Saisons, acht Startwerte, neue Angebote je Saison:

| Verein | `4afef8e` (vor Schritt 6) | `f618ad4` (Schritt 6) |
| --- | --- | --- |
| L1 Bester | 2,95 (kleinster 2,4) | 1,44 (0,6) |
| L1 Mitte | 3,39 (2,1) | 0,91 (0,2) |
| L2 Mitte | 2,40 (1,5) | 0,25 (0,0) |

**Die Ursache, je Regel gezählt** (`f618ad4`, vier Startwerte, zehn
Saisons; ein Zähler ersetzt `kiAngebote` und spielt dieselben Würfe nach,
die Welt bleibt gleich). Je Saison, wie viele Gebote übrig blieben:

| Regel | L1 Bester | L1 Mitte | L2 Mitte |
| --- | --- | --- | --- |
| nur Konto (wie vor Schritt 6) | 3,20 | 3,58 | 2,25 |
| dazu nur `freiNaeher` | 3,15 (−2 %) | 3,33 (−7 %) | 2,13 (−5 %) |
| dazu nur die Gehaltsgrenze | 1,50 (−53 %) | 0,97 (−73 %) | 0,40 (−82 %) |
| beides (so gebaut) | 1,45 | 0,72 | 0,28 |
| beides, Gehalt des Schwächsten frei (Tausch) | 1,50 | 0,82 | 0,28 |
| beides, nächster Kandidat statt des ersten | 1,63 | 0,90 | 0,28 |
| Tausch und nächster Kandidat | 1,80 | 1,02 | 0,30 |

**Es ist die Gehaltsgrenze in `kiAngebote`**, nicht `freiNaeher` und nicht
der Überschuss an Vereinslosen: die Vereine stehen an Termin 5 und 25 im
Median bei 1,03 (erste Liga) und 1,05 (zweite) ihrer Grenze, 63 und 81 %
darüber. Tausch und nächster Kandidat helfen nicht. Austauschproben am
ganzen Ablauf (Angebote: acht Startwerte, zehn Saisons, Mittel; Händler
nach `tests/manager-haendler.test.mjs`, drei Startwerte, zwölf Saisons,
Gewinn als Anteil an den Einnahmen, Grenze 10 %):

| Probe | Angebote L1 Bester / L1 Mitte / L2 Mitte | Händler L1 Mitte / L2 Mitte |
| --- | --- | --- |
| `f618ad4` | 1,44 / 0,91 / 0,25 | 5,1 / −19,3 % |
| ohne Gehaltsprüfung beim Gebot | 2,98 / 3,13 / 1,95 | **87,7** / 136,1 % |
| dazu `freiNaeher` ohne Gehaltsgrenze (jeder Vereinslose zählt) | 2,50 / 2,24 / 0,44 | **20,9** / −10,6 % |
| Ziehen 0,20 statt 0,06, mit Liste 0,40 statt 0,14 | 4,56 / 3,33 / 0,71 | **13,3** / −12,8 % |
| Ziehen 0,30, mit Liste 0,60 | 6,89 / 4,72 / 1,09 | **13,8** / −9,2 % |
| getrennt: Liste 0,14, sonst 0,20 | 4,56 / 3,33 / 0,71 | −4,2 / −17,3 % |
| getrennt, sonst 0,30 | 6,89 / 4,72 / 1,09 | 5,4 / −11,6 % |
| getrennt, sonst 0,40 | 8,74 / 6,13 / 1,44 | −5,1 / −18,7 % |
| getrennt, sonst 0,50 | 10,59 / 7,33 / 1,75 | 8,7 / −15,8 % |
| getrennt, und wessen Angebot gilt, bietet nicht neu: 0,5 | 7,71 / 5,47 / 1,24 | 5,0 / −15,8 % |
| dasselbe mit 0,7 | 9,25 / 6,51 / 1,63 | nicht gemessen |
| **dasselbe mit 0,8 (gebaut)** | **9,81 / 7,34 / 1,71** | **−5,4 / −5,3 %** |
| dasselbe mit 0,9 | 10,36 / 7,69 / 1,80 | −4,8 / 0,3 % |
| dasselbe mit 1,0 | 10,84 / 8,05 / 1,91 | −8,8 / 0,3 % |

Die Gehaltsprüfung wegzunehmen öffnet den Händler wieder; öfter ziehen
für alles auch (ab 0,20 reißt transfer AC-28). Getrennt gezogen hält er:
wer auf der Liste steht, wird wie bisher mit 0,14 gezogen, der Händler
bekommt nur auf seine Stammspieler mehr Gebote. Ohne die Regel „wessen
Angebot gilt, bietet nicht neu" ersetzt ein Verein sein eigenes Angebot
Termin für Termin: bei 0,5 sind es 10,59 statt 7,71 Meldungen (L1
Bester) für fast dieselben Spieler (verschieden 0,78 und 0,72). 0,8 statt
0,5 oder 0,7, weil die zweite Liga sonst an einzelnen Startwerten unter 1
fällt — kleinster Wert mit 0,5: 0,8, mit 0,7: 1,0, mit 0,8: 1,3.

**Gebaut** (`ANGEBOTE` in `transfer.js`, beide Werte **gesetzt**, kein
Wert aus Anstoss 3): je Verein und Termin ein Wurf; bis 0,14 darf er auf
die Liste bieten (wie bisher), sonst bis 0,8 auf einen, der nicht auf der
Liste steht (vorher 0,06). Ein Verein, dessen Angebot noch gilt, bietet
nicht neu (`kiAngebote(…, wartet)`, aus `ablauf.js`) — sonst ersetzte er
sein eigenes Angebot jeden Termin, mit einer neuen Meldung. Konto,
Gehaltsgrenze und `freiNaeher` bleiben, für Mensch und KI gleich.

**Das Band** (transfer AC-31, Benutzer: „kein absichtlich hartes
Pflaster"): mindestens 2 je Saison in der ersten Liga (bester Verein und
Mitte), mindestens 1 in der Mitte der zweiten, Mittel der ersten zehn
Saisons an jedem der acht Startwerte — das hielt `4afef8e` an allen acht
(kleinster Wert 2,4 / 2,1 / 1,5), `f618ad4` an keinem in der zweiten Liga.
Zehn Saisons, weil es danach weniger wird: über zwanzig Saisons in der
zweiten Liga im Mittel 0,89 (0,70 bis 1,15) — der Kader eines Verwalters,
der nie kauft, wird schwächer, um ihn wirbt niemand mehr.

**Gemessen danach** (`node docs/manager/dynamik/angebote.cjs`, je
Startwert 4711, 20260910, 77, 1234, 5, 99, 31337, 2026):

| Verein | `f618ad4` | gebaut |
| --- | --- | --- |
| L1 Bester | 0,6 1,9 1,8 1,1 2,3 0,8 1,8 1,2 — Mittel 1,44 | 6,5 13,5 9,4 6,8 11,8 8,3 11,2 11,0 — Mittel 9,81 |
| L1 Mitte | 0,2 1,2 1,2 0,5 1,0 0,9 0,6 1,7 — Mittel 0,91 | 3,0 9,6 9,0 3,1 9,0 8,3 5,2 11,5 — Mittel 7,34 |
| L2 Mitte | 0,1 0,2 0,4 0,4 0,2 0,5 0,0 0,2 — Mittel 0,25 | 1,7 1,9 1,4 1,7 1,8 2,3 1,3 1,6 — Mittel 1,71 |

Verschiedene Spieler, auf die geboten wird, je Saison: 0,33 / 0,35 / 0,12
→ 0,89 / 0,95 / 0,28 (vor Schritt 6 1,00 / 1,09 / 0,65) — **die meisten
Angebote gelten denselben ein, zwei Spielern**, um die mehrere Vereine
nacheinander werben. In der ersten Liga sind es damit drei- bis viermal so
viele Meldungen wie vor Schritt 6; eine Obergrenze hat das Band nicht.

**Händler** (transfer AC-28, `tests/manager-haendler.test.mjs`, drei
Startwerte, zwölf Saisons): L1 Mitte 5,1 → −5,4 %, L2 Mitte −19,3 →
−5,3 % der Einnahmen. Über alle acht Startwerte (gleicher Bot): L1 Mitte
1,0 → −3,5 % (Gewinn je Saison 0,22 → −0,79 Mio), L1 Bester 1,5 → −2,3 %
(0,41 → −0,66 Mio), L2 Mitte −21,6 → −14,1 % (−2,11 → −1,42 Mio). Er
bekommt mehr Angebote, aber auf seine Stammspieler, nicht auf die Ware.
`haendler.cjs` (zwölf Saisons, acht Startwerte) Gewinn je Saison: 222 →
−794 T, 415 → −661 T, −2107 → −1422 T.

**Die Bänder ohne Menschen sind unverändert** — `npm run manager:dynamik
-- --saisons 20` an den acht Startwerten gibt Zeile für Zeile dieselbe
Ausgabe (nur die Rechenzeit nicht), denn ohne Menschen wird
`kiAngebote` nicht gerufen. `npm run manager:messen` ebenso: Tore 3,24,
Heimsiege 47,3 %, Unentschieden 22,2 %, vor und nach. Im Fingerabdruck
(`manager:gleichstand`) ändert sich nur der Teil „mensch" der Läufe mit
Mensch; er ist neu geschrieben.

**Nachbesserung (2026-11-24): Wiederholung und Obergrenze.** Anlass: am
besten Verein der ersten Liga 8,6 Angebote je Saison auf 0,95 verschiedene
Spieler — rund neun Meldungen je Spieler, vor Schritt 6 rund drei.
Verlangt war: ein Verein bietet je Fenster höchstens einmal auf denselben
Spieler, dann `ANGEBOTE.sonst` so tief wie möglich, und eine Obergrenze
von 5 je Saison in der ersten Liga an jedem Startwert.

*Die Regel* steht (`m.geboten` in `ablauf.js`, `kiAngebote(…, geboten)`),
**ändert aber nichts**: über vier Startwerte, zehn Saisons gab es kein
einziges zweites Gebot desselben Vereins auf denselben Spieler im selben
Fenster — die Fenster sind vier und zwei Termine lang, ein Angebot gilt
zwei, und wessen Angebot gilt, bietet nicht neu. Die Zahlen mit und ohne
Regel sind gleich, im Fingerabdruck ändert sich nur das neue Feld. Die
Regel hält es, wenn sich das ändert (Gegenprobe: ohne „bietet nicht neu“
42 zweite Gebote an 4711, mit der Regel null). Die Wiederholung kommt von
**verschiedenen Vereinen** auf dieselben ein, zwei Spieler: an 4711 je
Spieler und Fenster 2,0 Angebote, an 1234 2,6, an 77 3,2, an 31337 4,5.

*Untergrenze und Obergrenze halten nicht zugleich* (acht Startwerte,
zehn Saisons, Mittel je Saison, kleinster und größter Startwert):

| Hebel | L1 Bester (größter) | L1 Mitte (kleinster) | L2 Mitte (kleinster) |
| --- | --- | --- | --- |
| verlangt | ≤ 5 | ≥ 2 | ≥ 1 |
| `sonst` 0,2 | 3,86 (6,3) | 2,75 (1,0) | 0,64 (0,4) |
| `sonst` 0,3 | 5,58 (8,7) | 3,94 (1,4) | 0,89 (0,6) |
| `sonst` 0,5 | 7,71 (11,3) | 5,47 (2,0) | 1,24 (0,8) |
| `sonst` 0,6 | 8,40 (12,3) | 6,05 (2,6) | 1,41 (1,1) |
| `sonst` 0,8 (gebaut) | 9,81 (13,5) | 7,34 (3,0) | 1,71 (1,3) |
| je Spieler und Fenster ein Angebot, gleich von wem, 0,8 | 8,66 (14,3) | 4,80 (2,4) | 0,69 (0,5) |
| dasselbe, 1,0 | 9,46 (15,3) | 5,26 (2,7) | 0,71 (0,5) |
| höchstens 2 neue je Fenster, 0,8 | 3,90 (4,0) | 3,08 (1,6) | 0,55 (0,4) |
| höchstens 3 neue je Fenster, 0,8 | 5,71 (6,0) | 4,40 (2,0) | 0,74 (0,6) |

Die erste Liga ≤ 5 an jedem Startwert verlangt `sonst` um 0,2 (20260910
liegt immer am höchsten: 6,3 bei 0,2), die zweite ≥ 1 verlangt 0,6. Jeder
Hebel gegen die Wiederholung nimmt der zweiten Liga ihr Angebot: dort
werben in den wenigen Fenstern, in denen ein Spieler gefragt ist, mehrere
Vereine nacheinander um ihn — **das eine Angebot je Saison der zweiten
Liga ist selbst Wiederholung** (0,28 verschiedene Spieler je Saison bei
1,71 Angeboten). Mehr verschiedene Spieler gibt es dort nicht: je Spieler
eines, gleich von wem, bringt 0,35 verschiedene je Saison, auch mit 1,0.
Gezogen wird also weiter mit 0,8, eine Obergrenze steht nicht im
Kriterium; die Entscheidung — die Untergrenze der zweiten Liga anders
fassen (etwa verschiedene Spieler oder Fenster mit Angebot) oder die
Wiederholung hinnehmen — liegt beim Benutzer.

*kader AC-24* (Alter 23 bis 25) steht seitdem auf `in-qa`: es hält an
sechs von acht Startwerten, an 1234 und 99 liegt je eine Saison bei 22,9
bis 23,0. Der Test bleibt.

**Nicht geprüft:** wie es sich für einen Menschen anfühlt, der handelt
(kauft, die Liste nutzt, Angebote annimmt) — gemessen ist nur der
Verwalter und der Händler; ob die vielen Meldungen im Postfach der ersten
Liga stören; die Oberfläche (kein Browserlauf).

### Schritt 5: Neigungen und Entwicklung nach Einsatz (2026-11-24)

**Neigungen** (`server/spiele/manager/neigungen.js`, kader AC-27 bis
AC-33): sieben Achsen je Spieler, aus Kennung und Startwert über einen Hash
(FNV-Art, Box–Muller, Streuung 0,35, bei ±1 abgeschnitten). **Kein Feld am
Spieler, keine neue Fassung des Spielstands** — dieselbe Karriere hat
dieselben Neigungen, ohne Startwert ist jede null (Vorschau, Tests ohne
Karriere, der Markt).

| Achse | + | − | Wirkung bei 1 | gemessen je Einheit Neigung |
| --- | --- | --- | --- | --- |
| entwicklung | Trainingsfleißig | Lebemann | +0,5 Stärke je Saison | 0,509 ± 0,056 Punkte je Jahr (n = 15 620 Spielerjahre bis 28, nicht am Talent) |
| wechsel | Söldner | Vereinstreu | Gehaltswunsch beim Verlängern ×(1 + 0,06), Abstand nach unten 14 + 2 | 0,060 (so gebaut) |
| heim | — | — | Tagesform daheim +3 %, auswärts −3 % | Note auswärts − daheim 0,009 ± 0,007 — **nicht von null zu trennen** |
| nerven | Profi | — | Streuung der Note ×(1 − 0,4) | Streuung der Noten −0,063 ± 0,005 Notenstufen (n = 6025) |
| karten | Heißsporn | — | — (angelegt) | — |
| moral | Sensibel | — | — (angelegt) | — |
| mitspieler | Anführer | — | — (angelegt) | — |

`charakter(spieler, startwert)` gibt den Namen der stärksten benannten
Abweichung ab 0,5, sonst „Ausgeglichen". Über 6080 Spieler zu Beginn
(Vereine und Vereinslose, acht Startwerte): Ausgeglichen 52,2 %, Söldner
6,7, Anführer 6,4, Lebemann 6,1, Sensibel 6,0, Vereinstreu 5,9,
Trainingsfleißig 5,8, Heißsporn 5,8, Profi 5,2 % (gerechnet: 52,3 %
ausgeglichen, je Name 7,6 % vor Überlappung). **Profi** heißt, wer die
ruhigsten Nerven hat — wer Woche für Woche dieselbe Note liefert; das ist
die Achse, die im Spiel etwas Messbares tut und kein eigenes Gegenstück
braucht.

**Verdeckt** (kader AC-28): die rohen Werte verlassen den Server nie; der
Zustand trägt `charakter` und `gehaltswunsch` nur an den eigenen
Spielern. Der Wächter in `tests/manager-netz.test.mjs` geht jede Zahl in
Zustand, Markt (200 und Vereinslose), Vereinsansicht, zwei Akten und
Spielstandliste durch und vergleicht sie auf zwölf Stellen mit jeder
Neigung und jedem Faktor daraus; die Gegenprobe (ein Feld `fl` mit dem
Fleiß an den eigenen Spielern) fällt. **Restrisiko:** `startwert` steht im
Zustand, wer den Hash nachbaut, rechnet die Neigungen aus.

**Entwicklung** (`ENTWICKLUNG` in `kader.js`): der Zufall ist stetig
(Dreieck aus zwei Würfen, gleiche Varianz), gerundet wird zufällig
(`zufaelligGerundet`: im Mittel kommt an, was gerechnet wurde) statt einen
Rest am Spieler zu tragen; ab 25 zählt der Anteil an allen Minuten — 5,5
Punkte je Anteil unter 70 %, 1,5 darüber; der Notenschnitt zählt ab fünf
Noten mit 0,6 je Stufe um 3,5 (kader AC-30), dazu der Fleiß. Das Talent
bleibt die Obergrenze.

**Gemessen** (`npm run manager:dynamik -- --saisons 20`, acht Startwerte):

| Band | Schritt 4 (HEAD `7ec832e`) | Schritt 5 |
| --- | --- | --- |
| kader AC-23 Sterne 3 bis 8 | 1 von 8 (77) | 1 von 8 (4711); sonst zuerst S5 bis S9, 2 bis 10, 1 bis 14 von 20 Saisons |
| kader AC-24 Alter 23 bis 25 | 6 von 8 (1234, 99 rissen) | **0 von 8**: 22,7 bis 23,0 in 3 bis 8 von 20 Saisons, zuerst S7 bis S9 |
| kader AC-25 Jugend | 8 von 8 | 8 von 8 |
| kader AC-26 Einsatz ≥ 1 | 0 von 8 (−0,30 bis −0,08) | **5 von 8**; 4711 (S9 0,94, 2 von 19), 1234 (S9 0,88, 1), 99 (S10 0,96, 2) |
| finanzen AC-17, 18, 19 | 8 von 8 | 8 von 8 |
| transfer AC-26, 27, 29 | 8 von 8 | 8 von 8 |

Je Startwert, AC-23 (erster Riss, gerissene Saisons von 20): 4711 hält;
20260910 S5: 2 (1); 77 S9: 9 (6); 1234 S7: 9 (11); 5 S5: 2 (6); 99 S7: 10
(14); 31337 S8: 10 (7); 2026 S7: 9 (5). AC-24: 4711 S8: 23,0 (6);
20260910 S9: 22,9 (5); 77 S7: 23,0 (6); 1234 S9: 22,7 (7); 5 S9: 22,9 (3);
99 S8: 22,9 (7); 31337 S7: 22,9 (8); 2026 S7: 23,0 (5).

**`einsatz` gegen den Markt:** 5,5 hält alles in `npm test`; 6 reißt
transfer AC-28 (L1 10,5 %) und AC-31 (31337: 0,20); 6,5 AC-31 (0,80); 7
reißt AC-28 L1 (14 %), AC-28 L2 und AC-31 L2 an 31337 (0,70) — und ist die
einzige Einstellung, mit der AC-26 an allen acht hielt. Gewählt 5,5.

**Heimquote:** `docs/manager/dynamik/neigungen.cjs` (fünf Saisons, acht
Startwerte, rund 20 s) rechnet jede Welt mit und ohne `heim`: 47,56 %
Heimsiege von 25 680 mit, 47,71 % ohne — die Achse verschiebt die Quote
nicht, weil sie um null liegt.

**`npm run manager:messen`** vorher → nachher: Tore 3,24 → 3,24,
Heimsiege 48,0 → 48,0 %, Unentschieden 22,2 → 21,6 %, Favorit 52,3 %
(67,1 % ohne Remis) → 51,3 % (65,3 %), Gelb 3,04 → 3,02, Platzverweise
0,142 → 0,149, Wechsel 2,77 → 2,72, Verletzungen 0,260 → 0,256, Stärke
der ersten Liga 69,8 → 69,6, Konto 24,6 → 25,1 Mio.

**Nicht geprüft:** wie sich die Neigungen für einen Menschen anfühlen
(keine Oberfläche gebaut — `public/manager` gehört der Managersitzung);
die Bereitschaft im Markt hängt über `abstandMehr` an der Neigung, das
Gehalt dort nicht — nur der Abstand ist dort gemessen (transfer AC-31 an
acht); `heim` ist in den Noten nicht zu sehen; die Wirkung der Nerven ist
klein (eine Zehntelstufe Streuung zwischen −0,8 und +0,8). karten, moral
und mitspieler wirken nicht.

## Wovon Auf- und Abwertung vor Schritt 5 abhing (`kader.entwickeln`)

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

Vorschlag für Schritt 5 (gebaut am 2026-11-24, siehe Stand; Bruchteile werden zufällig gerundet statt mitgeführt — ergänzt M2 „Spieler mit
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
