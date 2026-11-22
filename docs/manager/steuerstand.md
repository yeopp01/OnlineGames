# Steuerstand des Managerspiels

**Wofür:** der Stand, nach dem am Managerspiel weitergearbeitet wird —
genauer als jede Zusammenfassung eines Gesprächs. Nach jeder Runde
**ersetzen**, nicht verlängern; über hundert Zeilen liest ihn niemand.
Der [Plan](plan.md) sagt, was gebaut wird, die
[Arbeitsanweisung](../../.claude/skills/manager-weiterbauen/SKILL.md), wie.

## Wo

Zwei Arbeitsbäume (in `.git/info/exclude`, nur örtlich), beide mit
`node_modules` als **Junction** auf das des Hauptordners — **nie `rm -rf`
auf einen Arbeitsbaum**, erst `cmd //c rmdir` auf die Junction.

- `.claude/worktrees/manager`, Zweig `manager`: Stufe M0 (M0.1 bis M0.8),
  zuletzt der Hilfsagent M0.7 (`107844e` Module, `88e734c` Tagesform und
  Eignung auf dem Server, `5f07a80` sein Steuerstand — Einzelheiten dort
  und in den Commit-Texten). Module haben keine globalen Namen: der
  Browserlauf greift über `window.managerspiel`. `kader.eignungstabelle()`
  hat keinen Leser mehr.
- `.claude/worktrees/manager-m1`, Zweig `manager-m1`: **Stufe M1**, aus
  `manager` gemergt bei `b6a5a96`. Browserläufe mit eigenem Hafen
  (`E2E_HAFEN=4277`), nur wenn kein anderer Lauf rechnet.

Nichts gepusht, nichts ausgerollt — beides nur auf sein Wort.

## Entscheidungen des Benutzers

- Das helle Kleid aus Fables Entwurf (`docs/manager/entwurf/`) gilt.
- Überspringen und Vorspulen bleiben; **einzelne Spiele lassen sich live
  spielen**, wer will.

## Stand M1 (2026-11-22)

| Schritt | Commit | Was |
| --- | --- | --- |
| Specs | `eaa8e97` | M1-Kriterien in spieltag, karriere, bedienung, ausbau |
| M1.1 | `7313891` | Szenen auf dem Server (spieltag AC-27 bis AC-29) |
| M1.2 | `932237f` | live: anpfeifen, spielen, abpfeifen (karriere AC-30 bis AC-32) |
| AC-32 + AC-30 | `4bc9f59` | System wechseln im Spiel, Ansprache zur Halbzeit |
| AC-31 | `173c4e3` | Vereine des Servers stellen ab Minute 60 um |
| AC-33 | `ba685fd` | eingreifen lohnt, aber nicht grenzenlos |

**AC-31 verschiebt die Welt:** 3,20 Tore je Spiel statt 3,06 (sechs
Startwerte zu zwei Saisons), Gleichstand neu geschrieben.

**M1.3, M1.4 und M1.7 — die Oberfläche (oberflaeche AC-19 bis AC-22,
ausbau AC-1), Commit folgt nach grünem check:** `public/manager/live.js`
(Tafel, Band, Ticker, Tempo, Eingreifen mit „wirkt ab Minute", Kabine),
Knopf „Live spielen" neben Weiter, CSS unter `.live`. Browsertests
`e2e/tests/manager-live.spec.mjs` (AC-19 bis AC-22) und
`manager-m1-am-stueck.spec.mjs` (ausbau AC-1), sechs von sechs grün auf
Hafen 4278, alle Bilder angesehen. **Stufe M1 ist damit erreicht.**

- **Vereinsfarben** (`server/spiele/manager/farben.js`): 36 Paare, je
  Verein aus Startwert und Vereinsnummer gezogen — nicht im Spielstand,
  also Gleichstand unverändert und alte Stände bekommen Farben ohne neue
  Fassung. Erste Farbe dunkel mit weißer Schrift, zweite hell mit Tinte;
  sind sich die ersten Farben einer Begegnung näher als ΔE 30 (CIE76),
  trägt der Gast sein Ausweichtrikot. Gemessen: 228 von 1260 Begegnungen
  mit Ausweichtrikot, knappstes Paar 30,6.
- **Das Band zeigt, wer drückt:** Chancen (½) und Tore (+½) je Abschnitt,
  der Spielanteil nur als Grundlinie — der Anteil allein war flach
  (|Anteil − 50| im Median 4, höchstens 16, im Spiel fast unbewegt).
- Gefunden und behoben: die globale Klasse `.verlauf` (Akte) drückte das
  Band auf 60 px → `.spielverlauf`; nach einer abgewiesenen Auswechslung
  blieb der Spieler gewählt; der Rand ragte auf 1366 × 768 5 px heraus.

## Als Nächstes

1. M1 ist `c3ce667` (check grün, 1128 Tests, 17 Partien); `manager`
   ist ganz gemergt (`c1408fe`). Alle 54 Managerfälle im Browser grün,
   nachdem oberflaeche AC-18 den Kopf gegen `--verein-1` prüft statt
   gegen das alte feste Blau (`e8352b8`). Die übrigen Managerbilder
   zeigen noch das Blau — die Bildunterschriften stimmen trotzdem.
2. Ein ganzer Browserlauf ohne fremde Last (M0.7 sah sechs rote Fälle des
   Strategiespiels unter Last — nicht unsere). **`node_modules` dieses
   Arbeitsbaums ist seit 2026-11-22 14:20 eine eigene Installation**, keine
   Junction mehr: das `node_modules` des Hauptordners war um 14:12 leer
   (vermutlich eine gelöschte Probekopie mit Junction) — nicht von hier
   repariert.
3. Rückschau M1 (Lücken als Kriterien), ADR-0018 nachziehen, in
   `CLAUDE.md` „die Arbeit daran ruht" anpassen — mit dem Benutzer.

## Nicht geprüft

- Nachwirkung nach einem Systemwechsel (Spielpraxis im neuen System).
- Die KI hält keine Ansprache.
- Keine Konferenz anderer Spiele während des eigenen (karriere AC-32).
- Die Live-Ansicht in anderen Browsern als Chrome, kleiner als 1366 × 768.
- Das Ausweichtrikot ist gerechnet und im Knotentest geprüft, im Browser
  nie gesehen (die Testbegegnung braucht es nicht).
- Auf der Bank steht die Gruppe (TOR, ABW …), auf dem Platz die Position
  (TW, IV …) — zwei Kürzel für den Torwart, nicht vereinheitlicht.

## Für M3 vorgemerkt

- **Ein Entlassener behält `vereinId`**: sein alter Verein bekommt bis zur
  neuen Stelle keine KI-Taktik und keinen KI-Stadionausbau
  (`managerVon` findet ihn). Ändern als bewusste Änderung mit neuen
  Abdrücken.
- `weiter()` zieht für alle Manager dieselbe Zufallsquelle (Angebote,
  Entlassung) — mit zwei Menschen je Manager eine eigene.
- `bericht.eigenes` und `saisonende.eigener` tragen nur einen Manager.
