# Steuerstand des Managerspiels

**Wofür:** der Stand, nach dem am Managerspiel weitergearbeitet wird —
genauer als jede Zusammenfassung eines Gesprächs. Nach jeder Runde
**ersetzen**, nicht verlängern; über hundert Zeilen liest ihn niemand.
Der [Plan](plan.md) sagt, was gebaut wird, die
[Arbeitsanweisung](../../.claude/skills/manager-weiterbauen/SKILL.md), wie.

## Wo

Arbeitsbaum `.claude/worktrees/manager` (in `.git/info/exclude`, nur
örtlich), Zweig `manager`, abgezweigt von `strategie` bei `4910410`.
`node_modules` ist eine Junction auf das des Hauptordners — **nie
`rm -rf` auf den Arbeitsbaum**, erst `cmd //c rmdir` auf die Junction.
Browserläufe mit eigenem Hafen (`E2E_HAFEN=4277`). Nichts gepusht.

## Zuletzt

**2026-11-22:** M0.1 (`d3432a9`, Umlaute, spielziel AC-16) und M0.8
vorgezogen (`f08206d`, hell nach dem Entwurf, oberflaeche AC-18: jeder Text
auf acht Blättern hält 4,5 : 1, gemessen im Browser) sind committet.
**M0.2 gebaut** (spielziel AC-17): `npm run manager:messen` (Kennzahlen
über drei Startwerte, zwei Saisons) und die **Gleichstandsprobe**
`tests/manager-gleichstand.test.mjs` — je Startwert zwei Läufe, je Lauf ein
SHA-256 über Welt und Mensch (`teile()` liest Fassung 3 und 4). Gemessen
vor dem Umbau: 3,07 Tore, 46,4 % Heimsiege, 22,0 % Remis, Favorit (Niveau
+0,5, jede Paarung) 51,7 %, ohne Remis 66,2 %; Konto 1. Liga 14,2 Mio im
Mittel; 182 ms je Saison, Spielstand 420 KB. Konten rechnen in Tausend.

## Als Nächstes

1. M0.2 committen, sobald `npm run check` grün ist.
2. **M0.3** `karriere.js` teilen (welt / ablauf / zuege / sicht) — nach
   jedem Schritt `node --test tests/manager-gleichstand.test.mjs`.
3. M0.4 bis M0.7, dann M1 (Spieltag live; Halbzeit bei 1366 × 768 ganz
   sichtbar, Tore im Verlaufsband lesbar, Halbzeitzeile leiser,
   Vereinsfarben als Akzent).

## Entschieden

- **2026-11-22, Freigabe des Plans:** „Bitte baue die Vorschläge von fable,
  gerne auf nem eigenen branch oder worktree, losgelöst von den fading
  allies änderungen". **Ausgelegt** als Zustimmung zu den Empfehlungen E1
  bis E7 im Plan, Abschnitt 3 — dem Benutzer als Auslegung genannt; ohne
  Widerspruch gilt sie.
- **2026-11-22, ein Aussehen:** auf „Es braucht ein Aussehen für alles":
  „korrekt - und da finde ich die Farben aus dem ENtwurf von Fable
  ehrlicherweise sehr gut." → das ganze Managerspiel wird hell nach dem
  Entwurf, nicht der Entwurf dunkel.
- **2026-11-22, Überspringen bleibt:** „aber, dass man ganze spiele
  einfach überskippen/simulieren kann, is echt nice, sowas sollten wir
  beibehalten, aber wenn man will, sollte es eben auch einzelspiele geben
  zum spielen." → M1: „bis zur Winterpause" und „bis vor das Saisonende"
  bleiben, der Ticker „sofort" auch; live gespielt wird ein Spiel nur,
  wenn man es will. Dann: „ich lass dich mal alleine" — eigenständig
  weiter, kein Push und kein Ausrollen ohne ihn.

## Fragen an den Benutzer

Keine offen.

## Bekannte Fallen

- Der Haken zum Sitzungsbeginn legt den Steuerstand des **Strategiespiels**
  vor. Für eine Runde am Managerspiel gilt diese Datei.
- `CLAUDE.md` sagt noch „die Arbeit daran ruht" — ändern, sobald M0 steht.
- Die Namenslisten in `kader.js` nicht anfassen, solange die
  Gleichstandsprobe gelten soll.
- Ersetzungen per Skript: ein einzelnes Wort als Text trifft auch
  gleichlautende Schlüssel (`verlaengern`) — danach den Diff auf
  `data-`, `dataset.` und `zug('` durchsehen.
- Unter fremder Last reißen Zeitmessungen des Strategiespiels in
  `npm run check`; allein wiederholen, bevor etwas geändert wird.
