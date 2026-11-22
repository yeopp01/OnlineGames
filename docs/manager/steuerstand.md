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

**2026-11-22:** M0.1 (`d3432a9`), M0.8 (`f08206d`, hell nach dem Entwurf),
M0.2 (`75e7c52`, Gleichstandsprobe, spielziel AC-17) und M0.3 (`0f77b48`,
`karriere.js` geteilt in welt / ablauf / zuege / sicht) sind committet.
Gemessen vor dem Umbau: 3,07 Tore, 46,4 % Heimsiege, 22,0 % Remis, Favorit
(Niveau +0,5, jede Paarung) 51,7 %, ohne Remis 66,2 %; Konto 1. Liga
14,2 Mio; 182 ms je Saison, Spielstand 420 KB. Konten rechnen in Tausend.

**M0.4 gebaut** (karriere AC-29, Fassung 4): `manager[]` mit `managerId`
(nicht `id` wie im Plan-Entwurf; `kontoId` und `bereit` kommen erst mit
M3), jeder Zug `(managerId, …)` über `amZug()`, Ansichten
`zustand/markt/vorschau/vereinAnsicht(managerId, …)`, Lesen über
`managerMit`, `managerVon`, `menschFuehrt`, `wartetAufStelle`. `netz.js`
und `spielstaende.js` nehmen `manager[0]` — nach außen gleich. Wächter
`tests/waechter-manager-mehrzahl.test.mjs` (Gegenprobe fällt).
**Gleichstand:** Welt in allen sechs Läufen gleich, Mensch in den drei mit
Menschen gleich; nur die drei ohne Menschen haben neu einen leeren Abdruck
(es gibt dort keinen Manager mehr) — neu geschrieben. Einmalig gegen den
Code von `0f77b48`: ein Stand der Fassung 3, mit altem und neuem Code
fortgesetzt, 9 von 9 gleich (Probe im Scratchpad, nicht eingecheckt).

## Als Nächstes

1. M0.4 committen, sobald `npm run check` grün ist; Managerfälle im
   Browser (`E2E_HAFEN=4277`), weil `netz.js` betroffen ist.
2. **M0.5** die Begegnung anhaltbar: `anpfiff/spielen/eingreifen/abpfiff`,
   der Zufall als Wert (`{a}`) — Gleichstandsprobe nach jedem Schritt.
3. M0.6 (`// @ts-check`, typedefs), M0.7 (`public/manager.js` in Module),
   dann M1 (Spieltag live; Halbzeit bei 1366 × 768 ganz sichtbar, Tore im
   Verlaufsband lesbar, Halbzeitzeile leiser, Vereinsfarben als Akzent).

## Für M3 vorgemerkt

- **Ein Entlassener behält `vereinId`**: sein alter Verein bekommt bis zur
  neuen Stelle keine KI-Taktik und keinen KI-Stadionausbau
  (`managerVon` findet ihn). So rechnete schon Fassung 3; für die
  Gleichstandsprobe erhalten. Ändern als bewusste Änderung mit neuen
  Abdrücken.
- `weiter()` zieht für alle Manager dieselbe Zufallsquelle (Angebote,
  Entlassung) — mit zwei Menschen je Manager eine eigene.
- `bericht.eigenes` und `saisonende.eigener` tragen nur einen Manager.

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
- Markdown mit Backticks nie in `node -e "…"` schreiben — die Shell führt
  sie aus. Mit dem Edit-Werkzeug oder einer Skriptdatei.
- Unter fremder Last reißen Zeitmessungen des Strategiespiels in
  `npm run check`; allein wiederholen, bevor etwas geändert wird.
