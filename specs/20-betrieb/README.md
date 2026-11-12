# Betrieb

Was gelten muss, damit der Server im Netz stehen kann.

| Spezifikation       | Beantwortet                                  |
| ------------------- | -------------------------------------------- |
| [Betrieb](betrieb.md) | Erreichbarkeit, Neustart, Sichtbarkeit, Kosten |

Seit dem 2026-11-12 laeuft der Server auf dem VPS - hinter dem Proxy, ueber
HTTPS, ausgerollt mit `npm run ausrollen`. Wie das gemacht ist, steht in
[`betrieb/README.md`](../../betrieb/README.md). Eingeladen ist bisher nur der
Betreiber selbst: was hier noch `offen` oder `in-qa` steht, muss abgearbeitet
sein, **bevor** andere dazukommen - vor allem die Vorwarnung vor dem Neustart
(AC-5), der Absturz einer einzelnen Partie (AC-10) und die gemessene Grenze
(AC-11, AC-12).
