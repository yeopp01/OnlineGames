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
