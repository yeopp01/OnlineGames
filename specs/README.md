# Spezifikationen

Hier steht, **was das Produkt ist** — nicht, was gerade kaputt ist, und nicht,
wie es gebaut wird.

| Gehoert hierher                          | Gehoert woanders hin                                    |
| ---------------------------------------- | ------------------------------------------------------- |
| Erwuenschtes Verhalten, Abnahmekriterien | Fehlermeldungen → Issues                                |
| Fachliche Abgrenzung, Grenzfaelle        | Entwurfsentscheidungen → [`../docs/adr/`](../docs/adr/) |
| Sicherheitsanforderungen einer Funktion  | Umsetzungsstand → Pull Request                          |

## Was ist gerade zu tun

```bash
npm run qa:report        # die Uebersicht als Seite: qa/report/index.html
npm run specs:board      # dieselben Zahlen als Text: specs/BOARD.md
```

Der **Bericht** ist die Uebersicht: welche Specs es gibt, welche
Abnahmekriterien, was davon umgesetzt ist — mit Test, Bild oder Begruendung
je Kriterium, Filter nach Status und Suche. Wie er zustande kommt, steht in
[`../qa/README.md`](../qa/README.md).

[**BOARD.md**](BOARD.md) fuehrt denselben Stand als Text, fuer Diff und Pull
Request. Beides ist erzeugt; gepflegt wird an einer Stelle — am Status des
Kriteriums in der Spec.

## Bereiche

| Bereich                       | Inhalt                                                        |
| ----------------------------- | ------------------------------------------------------------- |
| [00-plattform](00-plattform/) | Raeume, Uebertragung, Konten, Schutz, Spielauswahl, Speichern |
| [10-strategie](10-strategie/) | Spielziel, Karte, Einheiten, Bauen, Kampf, Bedienung          |
| [15-manager](15-manager/)     | Kader, Spieltag, Liga, Transfer, Finanzen, Karriere           |
| [20-betrieb](20-betrieb/)     | Erreichbarkeit, Neustart, Sichtbarkeit, Kosten                |

## Regeln fuer die Ablage

1. **Der Pfad ist die Identitaet.** `00-plattform/raeume.md` — keine
   fortlaufenden Nummern; der Zahlenpraefix sortiert nur die Bereiche.
2. **Ein Thema, eine Datei.** Nachtraege werden eingearbeitet, nicht
   danebengelegt.
3. **Kurz halten.** Zweck, Abgrenzung, Abnahmekriterien, Grenzfaelle. Mehr
   nicht.
4. **Jeder Bereich fuehrt eine `README.md`** als Inhaltsverzeichnis.
5. **Jede Spec traegt ein Kuerzel** (`**Kuerzel:** raeume`). Darueber findet
   `npm run specs:belege` die Tests, deren Name ein Kriterium nennt.
6. **Der Status am Kriterium ist die einzige Stelle fuer den Stand.** Keine
   Tabelle „Stand der Umsetzung", kein Absatz „gebaut ist ..." — beides
   veraltet mit dem ersten Commit. Was noch zu tun ist, ist ein Kriterium
   mit `offen`.
7. **Der Stand ist erzeugt.** Die `**Stand:**`-Zeile im Kopf einer Spec und
   `BOARD.md` schreibt `npm run specs:board`. Von Hand geaenderte Werte
   werden ueberschrieben.
8. **Nummern werden nie neu vergeben und nie umsortiert.** An ihnen haengen
   Test und Bildnachweis. Faellt ein Kriterium weg, bleibt die Luecke.

## Status eines Abnahmekriteriums

| Status            | Bedeutung                                                     |
| ----------------- | ------------------------------------------------------------- |
| `offen`           | beschrieben, nicht eingeplant                                 |
| `geplant`         | fuer die naechste Runde vorgesehen                            |
| `in-arbeit`       | jemand baut gerade daran                                      |
| `in-qa`           | gebaut, aber noch nicht vollstaendig belegt                   |
| `fertig`          | gebaut, von einem Testnamen genannt **und** nachgewiesen      |
| `zurueckgestellt` | bewusst nicht gebaut — **mit Grund in Klammern** dahinter     |

`fertig` verlangt zweierlei (→ [ADR-0011](../docs/adr/0011-bildnachweise.md)):

1. **einen Test, dessen Name das Kriterium nennt** — `raeume AC-7: nur der
   Gastgeber startet`. Der Test sagt, dass es gilt.
2. **ein Bild oder eine Begruendung.** Was einen Bildschirm hat, bekommt einen
   Bildnachweis aus dem Browserlauf; was keinen hat, steht mit Begruendung in
   [`../qa/ohne-bild.json`](../qa/ohne-bild.json). Das Bild zeigt, wie es
   aussieht — die Begruendung sagt, warum es kein Aussehen hat.

Fehlt eines davon, hoechstens `in-qa`. Umgekehrt vertraegt sich ein
vorhandenes Bild nicht mit `offen`, `geplant` oder `zurueckgestellt`. Beides
setzt `npm run check` durch.

## Schreibweise

```markdown
- **AC-7** `fertig` **Nur der Gastgeber startet** — Nur wer den Raum eroeffnet
  hat, kann die Partie starten.
- **AC-8** `zurueckgestellt` (erst mit Mailversand) **Kennwort vergessen** —
  Ein Ruecksetzlink per Mail.
```

Der **Kurztitel hat hoechstens fuenf Woerter und 44 Zeichen** — er ist die
Zeile im Board und im Bericht und soll ohne die Spec verstaendlich sein. Der
Text dahinter ist die eigentliche Anforderung.
