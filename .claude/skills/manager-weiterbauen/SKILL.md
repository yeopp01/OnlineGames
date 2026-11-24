---
name: manager-weiterbauen
description: Eine Arbeitsrunde am Managerspiel (Fussballmanager) - den naechsten Schritt aus dem Ausbauplan nehmen, bauen, per Test belegen, im Browser nachweisen, messen, pruefen, committen und den Steuerstand fortschreiben. Gedacht fuer /loop, also ohne Rueckfragen lauffaehig. Verwenden, wenn am Managerspiel eigenstaendig weitergearbeitet werden soll.
---

# Eine Runde am Managerspiel

Du arbeitest allein. Niemand beantwortet Fragen während der Runde. **Lieber
ein kleiner Schritt sauber auf `fertig` als drei halb.** `CLAUDE.md` gilt
ohne Abstrich — vor allem, was `fertig` heißt. Was am Strategiespiel über
Runden gelernt wurde, steht in
[`strategie-weiterbauen`](../strategie-weiterbauen/SKILL.md); die Abschnitte
4 (Belegen) und folgende dort gelten hier genauso und werden hier nicht
wiederholt.

## 0. Orientieren (immer)

1. `git status`, `git branch --show-current`. Gearbeitet wird auf dem lokalen
   Zweig **`manager`** (abgezweigt von `strategie`; gibt es ihn nicht, lege
   ihn an). Auf GitHub gibt es nur `main` — gepusht wird nicht, außer der
   Benutzer ist da und sagt es.
2. Lies [`docs/manager/steuerstand.md`](../../../docs/manager/steuerstand.md)
   ganz. Dort steht, welcher Schritt der nächste ist und welche Fragen an den
   Benutzer offen sind. Der Haken zum Sitzungsbeginn legt nur den Steuerstand
   des Strategiespiels vor — den liest du **nicht** als Auftrag.
3. Lies im [Plan](../../../docs/manager/plan.md) den Abschnitt der laufenden
   Stufe.
4. **Ist die Stufe freigegeben?** M0 immer. M1 und alles danach nur, wenn im
   Steuerstand unter „Entschieden" die Antwort des Benutzers auf die Fragen
   steht, an denen die Stufe hängt (Plan, Abschnitt 6, Spalte „Hängt an").
   Fehlt sie: M0 zu Ende bauen; ist M0 fertig, Frage im Steuerstand lassen und
   die Runde beenden. **Keine Zeile aus „Was es ausdrücklich nicht wird" fällt
   ohne den Benutzer.**

## 1. Arbeit wählen

Das Erste, was zutrifft:

1. `npm run check` ist rot → reparieren, nichts anderes.
2. Die Gleichstandsprobe (`tests/manager-gleichstand.test.mjs`) ist rot und
   niemand hat das Verhalten mit Absicht geändert → die Ursache finden.
3. Ein Kriterium steht auf `in-arbeit` → weiterführen.
4. Ein Kriterium der Stufe steht auf `in-qa` → Beleg oder Nachweis liefern.
5. Die Stufe hat noch keine Kriterien in den Specs → **Spec-Runde**: die
   Kandidaten aus dem Plan in die Specs unter `specs/15-manager/` schreiben
   (nächste freie Nummer, Kurztitel höchstens fünf Wörter, prüfbar), die
   Bauabfolge in `specs/15-manager/ausbau.md`. Nur Specs, kein Code.
   `npm run specs:board`, `npm run check`, Commit `Spec: Manager M<n> - …`.
6. Sonst der nächste Schritt der Bauabfolge.

**Zuschnitt:** ein Kriterium, oder zwei bis drei, die nur zusammen Sinn
ergeben. In M0 ist ein Schritt (M0.1 bis M0.7) eine Runde oder zwei.

## 2. Regeln, die nur hier gelten

- **Messen vor und nach.** Wer an der Rechnung dreht — Spiel, Entwicklung,
  Markt, Kasse —, fährt `npm run manager:messen` vorher und nachher und
  schreibt beide Zeilen in die Commit-Nachricht. Eine Zahl in einer Spec
  kommt aus diesem Lauf, nicht aus der Erinnerung.
- **Die Gleichstandsprobe.** In M0 fällt sie nie. Ab M1: ändert die Runde das
  Verhalten mit Absicht, erneuert sie den Fingerabdruck im selben Commit
  (`npm run manager:gleichstand -- --neu`) und sagt, was sich geändert hat.
- **Inhalt ist Daten.** Fähigkeit, Charakter, Ereignis, Gebäude, Satz: eine
  Zeile in einer Tabelle unter `server/spiele/manager/`, die Form als
  `@typedef` in `daten.js`. Wirkungen haben eine Form und werden an einer
  Stelle gelesen (`wirkungen()`); kein `if (faehigkeit === 'kopfball')`
  irgendwo sonst.
- **Für mehrere gebaut.** Jeder Zug nimmt eine `managerId`, nichts am
  Spielstand gehört „dem Menschen". Der Wächter
  `tests/waechter-manager-mehrzahl.test.mjs` setzt es durch.
- **Der Server schreibt die Sätze und behält die Geheimnisse.** Der Browser
  rechnet nichts. Keine Antwort enthält das wahre Talent, eine Szene nach der
  gefragten Minute oder etwas vom Verein eines anderen Menschen.
- **Alles hat eine Vorgabe.** Was neu eine Entscheidung verlangt, entscheidet
  ohne den Menschen sinnvoll — „Weiter", „Sofort" und Vorspulen halten nie an
  einer neuen Frage. Die Vereine des Servers spielen nach derselben Regel
  (manager AC-13).
- **Keine Wahl ist immer richtig** (manager AC-15). Zu jeder neuen Wahl gibt
  es eine Messung, die zeigt, wann sie schadet.
- **Spielstände werden angehoben, nicht verworfen.** Ein neues Feld am
  Spieler, Verein oder Manager heißt: neue Fassung, `anheben()`, ein Test, der
  einen alten Stand lädt. Was `anheben()` würfelt, kommt aus der Kennung —
  derselbe alte Stand ergibt immer dasselbe.
- **Texte:** auf dem Bildschirm echte Umlaute, eigene Sätze, kein Satz und
  kein Name aus einem Vorbild. Namen von Vereinen und Spielern bleiben
  erfunden (kader AC-7).
- **Tests:** Pflichttests über den Anfrageweg gegen den laufenden Server
  (ADR-0004); Rechenteile (`spieltag`, `kader`, `ereignisse`) direkt.
- **Oberfläche:** die Marken in `public/manager.css` und der
  [Entwurf](../../../docs/manager/entwurf/spieltag.html) sind das Maß. Wer ein
  Blatt anfasst, sieht es an (`npm run sicht -- manager.html` zeigt die
  Anmeldung; ein Blatt mit Spielstand über einen Browserfall mit
  `nachweis()`), bevor er es einen Nachweis nennt.

## 3. Abschließen

1. `npm run waechter`, dann `npm run check:kurz`; hat sich etwas im Browser
   geändert: `npm run check:alles:kurz`, bei geändertem Aussehen
   `npm run check:alles:neu:kurz` und danach `npm run qa:abweichung`.
2. Commit auf `manager`, deutsch, mit dem Kriterium im Text.
3. **Steuerstand fortschreiben** — „Zuletzt", „Als Nächstes", neue Fragen an
   den Benutzer. Ersetzen, nicht verlängern.
4. Wird eine Stufe erreicht: Rückschau als Abschnitt im Steuerstand (was hat
   getragen, was hat gekostet, welche drei Lücken sieht man im Browser) und
   die Zeilen zum Managerspiel in `CLAUDE.md` unter „Stand" anpassen.
