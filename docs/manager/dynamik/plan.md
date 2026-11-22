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
5. **Durchschnittsalter 25,5 bis 27** (heute fällt es auf 23,2 bis 24).

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
