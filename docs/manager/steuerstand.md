# Steuerstand des Managerspiels

**Wofür:** der Stand, nach dem am Managerspiel weitergearbeitet wird —
genauer als jede Zusammenfassung eines Gesprächs. Nach jeder Runde
**ersetzen**, nicht verlängern; über hundert Zeilen liest ihn niemand.
Der [Plan](plan.md) sagt, was gebaut wird, die
[Arbeitsanweisung](../../.claude/skills/manager-weiterbauen/SKILL.md), wie.

## Zuletzt

**2026-11-22:** Plan, [ADR-0018](../adr/0018-manager-ausbau.md) (Vorschlag),
Arbeitsanweisung und [Entwurf des Spieltags](entwurf/spieltag.html)
geschrieben. **Kein Code geändert, keine Spec geändert, nichts committet.**
Der Zweig `manager` ist noch nicht angelegt.

## Als Nächstes

**M0.1** (Plan, Abschnitt 4): die Wächter für Umlaute sehen das Managerspiel.
Danach M0.2 bis M0.7 der Reihe nach. M0 braucht keine Antwort des Benutzers.

## Entschieden

Noch nichts.

## Fragen an den Benutzer

E1 bis E7 im [Plan](plan.md), Abschnitt 3 — jede mit Empfehlung. Ohne Antwort
wird nach M0 nicht weitergebaut. Wird eine beantwortet: hierher unter
„Entschieden" mit Datum und Wortlaut, und im ADR-0018 den Status anpassen.

## Bekannte Fallen

- Der Haken zum Sitzungsbeginn legt den Steuerstand des **Strategiespiels**
  vor. Für eine Runde am Managerspiel gilt diese Datei.
- `CLAUDE.md` sagt bis zur Antwort auf E1 „die Arbeit daran ruht".
- Die Namenslisten in `kader.js` nicht anfassen, solange die
  Gleichstandsprobe gelten soll.
