# Ausbau

**Bereich:** Manager
**Kuerzel:** ausbau
**Stand:** 0/1 fertig · 1 offen

## Zweck

Der Ausbau des Managerspiels geht in Stufen M1 bis M7
(→ [Plan](../../docs/manager/plan.md), [ADR-0018](../../docs/adr/0018-manager-ausbau.md)).
Diese Spec hält die Bauabfolge je Stufe und je Stufe ein Kriterium „am Stück
im Browser" — wie fahrplan AC-3 im Strategiespiel. Die einzelnen Kriterien
stehen in den Specs, zu denen sie gehören.

Eine Stufe ist erreicht, wenn ihr Kriterium hier `fertig` ist. Danach folgt
eine Rückschau, die Lücken als neue Kriterien anlegt.

## Stufe M1 — Der Spieltag ist ein Ereignis

Das eigene Spiel läuft, man sieht, was passiert, und kann eingreifen. Wer
nicht will, spult vor und hat, was es heute gibt.

| Schritt | Was | Kriterien |
| ------- | --- | --------- |
| M1.1 | Szenen und Sätze auf dem Server, ohne ein Ergebnis zu ändern | spieltag AC-27, AC-28, AC-29 |
| M1.2 | Das eigene Spiel wartet angehalten im Spielstand; der Browser fragt Stück für Stück | karriere AC-30, AC-31, AC-32 |
| M1.3 | Anzeigetafel, Ticker, Verlaufsband, Tempo; die Vereinsfarben | bedienung AC-19, AC-22 |
| M1.4 | Eingreifen im Bild, Halbzeit und Kabine, das System im Spiel | bedienung AC-20, AC-21; spieltag AC-30, AC-32 |
| M1.5 | Die Vereine des Servers stellen um — ändert die Welt, eigene Runde mit Messung | spieltag AC-31 |
| M1.6 | Was Eingreifen bringt, gegen die Automatik gemessen | spieltag AC-33 |
| M1.7 | Am Stück im Browser, danach Rückschau | ausbau AC-1 |

Abgelöst wird bedienung AC-4 („Ticker läuft, Ergebnis steht"), sobald
bedienung AC-19 steht — nicht vorher.

## Abnahmekriterien

- **AC-1** `offen` **Stufe M1 am Stück** — Ein Browsertest spielt ein
  eigenes Spiel live: anpfeifen, Szenen im Ticker und Tore im Band sehen, zur
  Halbzeit eine Ansprache halten und wechseln, die zweite Hälfte schnell und
  den Rest sofort, Abpfiff, Bericht. Danach spult er bis zur Winterpause vor,
  ohne dass ein Spiel anhält.
