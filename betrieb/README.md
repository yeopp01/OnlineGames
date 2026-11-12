# Betrieb

Wie OnlineGames auf einem Server läuft und wie ein neuer Stand dorthin kommt.
Was gelten muss, steht in [`specs/20-betrieb`](../specs/20-betrieb/betrieb.md);
hier steht, wie es gemacht ist.

**Zugangsdaten und Adressen stehen nicht im Repository.** Welcher Rechner und
welche Adresse, steht örtlich in `.env.betrieb` neben `package.json` (von Git
ausgeschlossen); das Geheimnis der Sitzungen liegt nur auf dem Server.

## Ein Befehl

```bash
npm run ausrollen                 # HEAD
npm run ausrollen -- <commit>     # ein bestimmter Stand - auch ein älterer, das ist der Weg zurück
npm run ausrollen -- --sofort     # nicht auf leere Räume warten
npm run ausrollen -- --stand      # nur zeigen, was dort läuft
```

`.env.betrieb`:

```
AUSROLLEN_ZIEL=<Name des Rechners wie in ~/.ssh/config>
AUSROLLEN_ADRESSE=https://<Name, unter dem das Spiel erreichbar ist>
```

Dazu nach Bedarf `AUSROLLEN_ORDNER` (Vorgabe `/opt/onlinegames`),
`AUSROLLEN_CADDY` (Vorgabe `/opt/caddy/conf.d`; leer heißt: den Proxy nicht
anfassen) und `AUSROLLEN_WARTEN` (Minuten Geduld mit laufenden Partien,
Vorgabe 30).

Ausgerollt wird **ein Commit**, nicht das Arbeitsverzeichnis: was nicht
committet ist, geht nicht mit.

## Was dabei geschieht

1. `git archive` schickt `server/`, `public/`, das `Dockerfile`, die
   Paketdateien, `betrieb/` und das Skript für die Einladungscodes hinüber —
   keine Tests, keine Specs, keine Bildnachweise.
2. Auf dem Server wird das Abbild gebaut (`onlinegames:<commit>` und
   `onlinegames:aktuell`), ohne Entwicklungsabhängigkeiten. Der laufende
   Dienst merkt davon nichts.
3. Beim ersten Mal: ein Geheimnis für die Sitzungen wird erzeugt und in `.env`
   abgelegt, und der Proxy bekommt eine eigene Datei `onlinegames.caddy`. Sie
   wird erst geprüft (`caddy validate`), dann geladen; nimmt Caddy sie nicht
   an, wird sie zurückgenommen und nichts neu geladen.
4. **Gewartet wird, bis keine Partie mehr läuft** (betrieb AC-6) — laufende
   Partien liegen im Arbeitsspeicher, ein Neustart beendet sie. Nach Ablauf
   der Frist bricht das Skript ab, ohne etwas neu zu starten.
5. Der Dienst hält an, **die Konten werden gesichert** (`sicherung/<Zeit>/`,
   die letzten zehn bleiben), der Dienst startet mit dem neuen Abbild.
6. Geprüft wird zweimal: im Container, ob er antwortet, und von außen, ob die
   Seite über HTTPS kommt und eine Spielverbindung über `wss` zustande kommt.

Die Ausfallzeit ist Schritt 5: Anhalten, Kopieren, Starten.

## Auf dem Server

```
/opt/onlinegames/
  docker-compose.yml   aus betrieb/ des ausgerollten Stands
  .env                 KONTEN_GEHEIMNIS, OEFFENTLICHE_ADRESSE - nur dort
  daten/               konten.sqlite: Konten, Sitzungen, Einladungen, Spielstände
  sicherung/<Zeit>/    Kopien von daten/ vor jedem Neustart
  quelle/              der ausgerollte Stand
  STAND                dessen Commit
```

Der Dienst läuft als ein Container `onlinegames` im Netz des Proxys, ohne
eigenen Hafen nach außen: das Zertifikat hat der Proxy, drinnen gibt es nur
HTTP (betrieb AC-1). Er darf 1 GB Arbeitsspeicher und zwei Kerne nehmen — die
Maschine teilt er sich mit anderen Anwendungen. Nach einem Absturz und nach
einem Neustart der Maschine startet Docker ihn von selbst
(`restart: unless-stopped`, betrieb AC-3).

Was der Server aus seiner Umgebung liest:

| | |
| --- | --- |
| `PORT` | der Hafen (betrieb AC-4) |
| `HINTER_PROXY=1` | die Adresse des Fragenden steht in `X-Forwarded-For` — ohne das gälten die Grenzen des Schutzes für alle gemeinsam (betrieb AC-2) |
| `OEFFENTLICHE_ADRESSE` | unter der das Spiel erreichbar ist; nur von dort wird angemeldet, und die Sitzung gilt nur über HTTPS |
| `KONTEN_DATEI` | wo die SQLite-Datei liegt — außerhalb des Programmordners (betrieb AC-7) |
| `KONTEN_GEHEIMNIS` | unterschreibt die Sitzungen; wechselt es, sind alle abgemeldet |

## Einladungscodes

Registrieren geht nur mit Einladungscode (ADR-0003). Auf dem Server:

```bash
docker exec onlinegames node scripts/einladung.mjs neu "für wen"   # gilt 14 Tage, eine Registrierung
docker exec onlinegames node scripts/einladung.mjs                 # die Liste
docker exec onlinegames node scripts/einladung.mjs weg ABCD-EFGH   # zurücknehmen
```

## Nachsehen

`npm run ausrollen -- --stand` zeigt den ausgerollten Commit, ob der Dienst
läuft, die Zahlen (Räume, laufende Partien, Verbindungen), Speicher und
Rechenzeit und die Zahl der Sicherungen. Die Zahlen gibt es nur vom Rechner
selbst: `/betrieb/zahlen` antwortet nicht, wenn die Anfrage über den Proxy
kommt (betrieb AC-8). Das Protokoll: `docker logs onlinegames`.

## Zurück

Ein älterer Stand ist derselbe Befehl mit dessen Commit. Die Konten davor
liegen unter `sicherung/`; zurückgespielt werden sie von Hand, bei
angehaltenem Dienst.

## Nicht gebaut

- Eine Ankündigung im Spiel vor dem Neustart (betrieb AC-5) — bisher wird nur
  gewartet.
- Ausgelöste Grenzen in den Zahlen (der Rest von betrieb AC-8).
- Sicherungen außerhalb der Maschine.
