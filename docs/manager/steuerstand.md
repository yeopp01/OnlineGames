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

**2026-11-22:** **M0.1 fertig** (`d3432a9`): spielziel AC-16, der Wächter
liest das Managerspiel streng (jede Zeichenkette, Vorlagen, Text zwischen
Tags, Attribute), alle Bildschirmtexte mit echten Umlauten, Schlüssel
(`data-verlaengern`, `zug('verlaengern')`, Kategorie `gehaelter`)
umschrieben. 48 Browserfälle des Managers grün, Bilder neu, angesehen —
nur Texte. `npm run check` grün bis auf fahrplan AC-20 (Zeitmessung des
Strategiespiels, 36 statt 30 ms unter fremder Last; allein grün).

## Als Nächstes

1. **M0.8 Ein Aussehen** (vorgezogen, Entscheidung unten): `public/manager.css`
   auf die Farben und Schrift des [Entwurfs](entwurf/spieltag.html) — hell,
   Kreide, Tinte, Bahnschrift schmal für Überschriften und Zahlen. Kriterium
   in `specs/15-manager/oberflaeche.md`, alle Bilder des Managers neu,
   jedes über 1 % ansehen. Dabei den Entwurf selbst nachbessern: Halbzeit
   bei 1366 × 768 (Eingreifen ganz sichtbar), Tore im Verlaufsband lesbar,
   Halbzeitzeile im Ticker leiser, Vereinsfarben als Akzent statt Platte.
2. M0.2 Messen und Gleichstandsprobe, dann M0.3 bis M0.7.

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
