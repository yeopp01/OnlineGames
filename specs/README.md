# Spezifikationen

Hier steht, **was das Produkt ist** — nicht, was gerade kaputt ist, und nicht,
wie es gebaut wird.

| Gehoert hierher                          | Gehoert woanders hin                                    |
| ---------------------------------------- | ------------------------------------------------------- |
| Erwuenschtes Verhalten, Abnahmekriterien | Fehlermeldungen → Issues                                |
| Fachliche Abgrenzung, Grenzfaelle        | Entwurfsentscheidungen → [`../docs/adr/`](../docs/adr/) |
| Sicherheitsanforderungen einer Funktion  | Umsetzungsstand → Pull Request                          |

## Was ist gerade zu tun

[**BOARD.md**](BOARD.md) — eine Zeile je Abnahmekriterium, nach Status
sortiert. Erzeugt, nicht von Hand gepflegt:

```bash
npm run specs:board          # Board und Stand-Zeilen neu schreiben
npm run specs:board -- --check   # nur pruefen (laeuft in npm run check mit)
```

## Bereiche

| Bereich                       | Inhalt                                                  |
| ----------------------------- | ------------------------------------------------------- |
| [00-plattform](00-plattform/) | Raeume, Uebertragung, Konten, Schutz                    |
| [10-strategie](10-strategie/) | Spielziel, Karte, Einheiten, Bauen, Kampf, Bedienung    |
| [20-betrieb](20-betrieb/)     | Erreichbarkeit, Neustart, Sichtbarkeit, Kosten          |

Jeder Bereich fuehrt eine `README.md` als Inhaltsverzeichnis. Jede Spec traegt
ein **Kuerzel** - darueber ordnet `npm run specs:belege` die Tests den
Kriterien zu.

## Regeln fuer die Ablage

1. **Der Pfad ist die Identitaet.** `00-plattform/raeume.md` — keine
   fortlaufenden Nummern; der Zahlenpraefix sortiert nur die Bereiche.
2. **Ein Thema, eine Datei.** Nachtraege werden eingearbeitet, nicht
   danebengelegt.
3. **Kurz halten.** Zweck, Abgrenzung, Abnahmekriterien, Grenzfaelle. Mehr
   nicht.

## Status eines Abnahmekriteriums

| Status            | Bedeutung                                                  |
| ----------------- | ---------------------------------------------------------- |
| `offen`           | beschrieben, nicht eingeplant                              |
| `geplant`         | fuer die naechste Runde vorgesehen                         |
| `in arbeit`       | jemand baut gerade daran                                   |
| `in qa`           | gebaut, aber noch nicht durch einen Test belegt            |
| `fertig`          | gebaut **und** durch einen Test belegt, der den Namen nennt |
| `zurueckgestellt` | bewusst nicht gebaut, mit Begruendung in der Spec          |

`fertig` heisst: es gibt einen Test, der das Kriterium mit seiner Nummer
nennt. Ohne Test hoechstens `in qa` — sonst ist die Zahl im Board eine
Behauptung.

## Schreibweise

```markdown
- **AC-1** `fertig` **Kurztitel** — Was gelten muss, in einem Satz.
```

Der Kurztitel taucht so im Board auf. Er soll ohne die Spec verstaendlich
sein.
