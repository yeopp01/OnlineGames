# Managerspiel: Durchsicht der Spieldynamik (2026-11-22)

Auftrag des Benutzers: „Kannst du vom Fussballmanagerspiel nochmal die
Spieldynamiken dir angucken, ob die passen/sinnvoll sind, etc. - also was
Spieler kosten, wie sie sich entwickeln, etc."

**Nur gelesen und gemessen, nichts am Spiel geändert.** Gemessen am Stand
`manager-m1` (`b45d20a`, Arbeitsbaum `.claude/worktrees/manager-m1` — dort
arbeitet die Managersitzung, nicht anfassen). Änderungen gehören in den
Managerzweig und verlangen dort einen neuen Fingerabdruck (spielziel AC-17).

Messskripte (laden den Managerstand dieses Arbeitsbaums, schreiben nichts):

```bash
node docs/manager/dynamik/dynamik.cjs 20 4711,20260910,77,1234   # Welt ohne Menschen, 20 Saisons
node docs/manager/dynamik/haendler.cjs 8 4711,20260910,77,1234   # Mensch als Händler gegen Verwalter
```

Bekannter Fehler in `dynamik.cjs`: die Zeile „Wechsel je Verein" zeigt 0 (das
Umwickeln von `transfer.wechseln` greift nicht, `kiTransfers` ruft
modulintern) — stattdessen `spieler.laufbahn.wechsel` oder `welt.ticker`
lesen. Die Geldposten `transfersEin/Aus` stimmen. Die Jugendtabelle ist nicht
nach Jahrgang bereinigt (Anteile sind Untergrenzen).

## Was trägt

- **Wettbewerb:** 8 bis 11 verschiedene Meister in 20 Saisons,
  Rangkorrelation Saison zu Saison 0,46.
- **Entwicklungskurve** (Stärke im Mittel, Zuwachs zum nächsten Jahr):
  17: 39,8 (+6,6) · 18: 46,5 (+5,3) · 19: 51,8 (+4,3) · 20: 58,3 (+3,4) ·
  21 bis 24: +1,4 bis +1,0 · 25 bis 28: ±0 · 29 bis 31: −2,0 · ab 32: −3,5.
  Die Form ist glaubwürdig.
- **Liga 1 trägt sich knapp:** Einnahmen rund 26,5 Mio je Verein, Gehälter
  22,4 bis 27,0 Mio; Ergebnis +2 bis +4 Mio in Saison 1 bis 4, danach um 0.
- **Kein großer Geldhebel für Menschen** (gemessen, 8 Saisons, 4 Startwerte,
  3 Vereine): Vereinslose ablösefrei holen, auf die Liste setzen, an die KI
  verkaufen bringt im Mittel 270 bis 610 T je Saison, im besten Lauf 1,4 Mio
  je Saison. Die KI bietet 0,94 bis 0,99 × Marktwert, aber selten (0,2 bis
  0,4 Verkäufe je Saison — kurzes Fenster, 14 % je Verein und Termin, und
  jeder Verein will nur den stärksten Gelisteten).

## Was nicht trägt (nach Gewicht)

1. **Liga 2 ist strukturell pleite.** Einnahmen rund 11,3 Mio, Gehälter 8,8
   (Saison 1) → 12,7 (Saison 5) → rund 11,3 Mio; ab Saison 4 dauerhaft −1 bis
   −2,1 Mio je Saison. Konto Median 3,2 → −10,8 Mio, kleinstes −165,7 Mio.
   **Ab Saison 7 sind 13 bis 17 von 18 Vereinen im Minus, 10 bis 12,5 unter
   −3 Mio** — die Mehrheit bekommt zweimal je Saison sechs Punkte Abzug.
   Zinsen wachsen auf 2,2 Mio je Saison. finanzen AC-7 misst nur drei
   Saisons, spielziel AC-14 zehn Saisons ohne Konten — beide sehen es nicht.
   Ursache: Liga 2 wird stärker, als sie bezahlen kann (Niveau 52,9 → ~58),
   weil `kiTransfers` Löcher auch mit leerem Konto stopft und `kiVertraege`
   zum Gehaltswunsch verlängert, ohne auf die Einnahmen zu sehen.
   *Empfehlung:* eine Gehaltsgrenze für die KI (Gehaltssumme höchstens rund
   85 % der erwarteten Einnahmen; darüber nicht verlängern und nur billiger
   ersetzen) — und finanzen AC-7 auf 15 Saisons und „höchstens zwei Vereine
   je Liga unter der Abzugsgrenze" verschärfen. Nicht die Einnahmen der
   Liga 2 anheben: das Gehalt wüchse mit.
2. **Auch in Liga 1 kippen Vereine:** ab Saison 9 sind 3 bis 6,5 von 18
   zeitweise im Minus, 1 bis 3 unter −3 Mio, kleinstes Konto −34,5 Mio.
   Dieselbe Ursache, dieselbe Abhilfe. Im Händler-Lauf rutschte der beste
   Verein der Liga unter einem Menschen, der nur verlängert, in vier Saisons
   von 2,5 auf −17 Mio — ein Mensch, der nichts falsch macht, wird so
   entlassen (bis zu fünfmal in acht Saisons). Der Bot ist grob (verlängert
   alle bis 31); als Zahl nicht belastbar, als Hinweis ernst.
3. **Reichtum ohne Abfluss:** ein Verein häuft 302 Mio an (Stadion 73.000,
   Ruf 100). Für reiche KI-Vereine gibt es nach dem Stadion nichts mehr.
   *Empfehlung:* erst Punkt 1 lösen, dann neu messen; wenn es bleibt,
   Unterhalt des Stadions je Platz oder steigende Gehaltswünsche bei Ruf.
4. **Sternenwelle statt Gleichgewicht:** Spieler ab Stärke 85 in Liga 1:
   1,5 → 19,0 (Saison 8) → 2 bis 3,5 (ab Saison 16); ab 90: 0 → 6,3 → 0 bis
   0,5; stärkster Spieler 88 → 97 → 88 bis 90. Das Transfervolumen folgt:
   8 → 58 → 12 bis 17 Mio je Verein. Vermutet, nicht per Gegenprobe belegt:
   die Startgeneration hat mehr Talent (`guete + (27 − Alter) × 1,4`), als
   die Jugend nachliefert (`45 + Ruf × 0,4`, Mittel 63,9). *Empfehlung:*
   Starttalent und Jugendtalent auf dieselbe Verteilung bringen (das
   Starttalent senken, nicht die Jugend heben), Gegenprobe: Zahl der Spieler
   ab 85 bleibt über 20 Saisons in einem Band.
5. **Die Welt wird jung:** Durchschnittsalter 25,8 → 23,2 bis 24,0 (Liga 2:
   22,8); mit 33 sind noch 1211 da, mit 34 nur 23. Ab 29 fällt jeder gleich
   (−1 bis −3, ab 32 −2 bis −5 je Jahr), unabhängig von Spielzeit und
   Training; dazu `hoertAuf` ab 33. *Empfehlung:* Abbau ab 29 halbieren und
   streuen (einzelne halten bis 34), Karriereende ein Jahr später.
6. **Gehalt und Marktwert haben denselben Exponenten (4)** — der Kommentar
   „wächst steiler als das Gehalt" stimmt nicht. Jahresgehalt = 47 bis 54 %
   des Grundmarktwerts, **154 % ab 32**: eine Ablöse entspricht zwei
   Jahresgehältern (Stärke 82: Gehalt 2,7 Mio, Wert 5,8 Mio; Stärke 90: 3,9
   und 8,4 Mio). Deshalb ist Kaufen billig und Halten teuer — und deshalb
   fressen die Gehälter die Ligen auf. *Empfehlung:* Gehalt mit Exponent 3
   (oder Faktor 0,35 statt 0,6) und Marktwert mit 5; Ziel: Jahresgehalt
   15 bis 25 % des Marktwerts in den besten Jahren. Das ist der eine Hebel,
   der Punkt 1, 2 und 6 zugleich bewegt — zuerst probieren.
7. **Wertklippen am Geburtstag:** 23 → 24: −15 %, 28 → 29: −35 %,
   31 → 32: −53 %. *Empfehlung:* den Altersfaktor zwischen Stützpunkten
   linear rechnen statt in vier Stufen.
8. **Jugend spielt kaum und kommt zu schwach:** mit 17 Stärke 39,8 — 23,4
   unter dem Niveau des eigenen Vereins; Spielanteil mit 17 bis 19: 13 bis
   17 %. Von den Talenten 50 bis 59 ist mit 24 höchstens ein Sechstel noch
   in einem Verein. Zwei je Verein und Jahr sind 72 Zugänge gegen wenige
   Plätze: der Ausschuss füllt die Vereinslosen (57 bis 87, Stärke 51,8 →
   60). Kein Fehler, aber für den Menschen fühlt sich die Jugend nutzlos an,
   solange ein Siebzehnjähriger drei Jahre nichts beiträgt.
9. **Ab 25 hat weder Spielzeit noch Training Einfluss** (nur +1 bei Technik
   über 0,6 und Luft); der Winterschritt (× 0,4, gerundet) ist für 25- bis
   28-Jährige fast wirkungslos. Für eine Entscheidung des Spielers gibt es
   in dem Alter nichts zu tun.

## Nicht gemessen

- Der Hebel „junge Talente früh mit Vier-Jahres-Vertrag zum Gehalt der
  jetzigen Stärke binden" (gerechnet plausibel, nicht gemessen).
- Jede der Empfehlungen oben — keine ist ausprobiert.
- Ein Mensch, der gut spielt (kauft, aufstellt, Eintritt setzt): die Bots
  sind passiv.

## Reihenfolge, wenn gebaut wird

Erst Punkt 6 (Gehalt gegen Marktwert) als Probe mit `dynamik.cjs` über 20
Saisons, dann Punkt 1 (Gehaltsgrenze der KI) und das verschärfte Kriterium,
dann Punkt 4 und 5. Jede Änderung: `npm run manager:messen`, neuer
Fingerabdruck (`npm run manager:gleichstand`), Tore und Heimsiege dürfen
sich nicht bewegen (3,10 / 48 % / 21 %).
