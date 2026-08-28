# ADR-0003: Anmeldung ohne eigenen Identitaetsserver

**Status:** entschieden
**Datum:** 2026-08-28

## Frage

Es soll Konten geben: registrieren, anmelden, Profil, spaeter Ranglisten.
Keycloak faellt aus — es bringt eine JVM mit und belegt im Leerlauf 700 MB bis
1 GB. Was tritt an seine Stelle?

## Anforderungen

1. **Klein.** Deutlich unter 100 MB im Leerlauf, damit es neben dem Spielserver
   auf einer kleinen Maschine laeuft.
2. **Vollstaendig konfigurierbar.** Kennwortregeln, Mailversand,
   Sitzungsdauer, Sperrfristen — nicht ein Kasten, den man hinnimmt.
3. **Deckt die Pflicht ab:** Argon2, Mailbestaetigung, Kennwort vergessen,
   Bremse gegen Rateversuche (→ [Konten](../../specs/00-plattform/konten.md)).
4. **Kein Bruch mit dem Bestehenden.** Der Spielserver ist einfaches Node ohne
   Bauschritt.

## Betrachtete Moeglichkeiten

| Loesung          | Art                       | Speicher   | Bewertung                                                        |
| ---------------- | ------------------------- | ---------- | ---------------------------------------------------------------- |
| **Keycloak**     | Java, eigener Server      | ~800 MB    | Ausgeschlossen. Kann alles, kostet alles.                        |
| **Authentik**    | Python + Redis + Postgres | ~1 GB      | Noch schwerer als Keycloak. Fuer ein Spiel absurd.               |
| **Zitadel**      | Go + Postgres             | ~300 MB    | Sauber, echtes OIDC, aber Postgres und Verwaltung als Beigabe.   |
| **Logto**        | Node + Postgres           | ~200 MB    | Gute Verwaltungsoberflaeche. Postgres bleibt Pflicht.            |
| **Ory Kratos**   | Go, ohne Oberflaeche      | ~50 MB     | Sehr konfigurierbar, aber die gesamte Oberflaeche baut man selbst. |
| **PocketBase**   | eine Go-Datei + SQLite    | ~30 MB     | Verwaltungsoberflaeche, Mailversand, OAuth — alles dabei.        |
| **Better Auth**  | Bibliothek im Spielserver | 0 MB extra | Kein zweiter Dienst. Braucht SQLite im Node-Prozess.             |

## Vorschlag

**Better Auth als Bibliothek im Spielserver, Daten in SQLite.**

Der entscheidende Punkt: Wir brauchen keinen zweiten Dienst. Ein eigener
Identitaetsserver lohnt sich, wenn mehrere Anwendungen dieselben Konten teilen
sollen. Wir haben eine Anwendung. Alles, was ein Keycloak zusaetzlich koennte —
foederierte Anmeldung, SAML, Mandanten, Rollenmodelle — braucht dieses Projekt
nicht und wird es absehbar nicht brauchen.

Better Auth liegt als Bibliothek im laufenden Node-Prozess. Damit:

- **kein zweiter Dienst, kein zusaetzlicher Speicher, kein zweites Deployment;**
- Argon2id, Mailbestaetigung, Ruecksetzlinks, Sitzungsverwaltung und Bremsen
  gegen Rateversuche sind eingebaut und ueber Werte konfigurierbar, nicht ueber
  eine fremde Oberflaeche;
- die WebSocket-Verbindung erkennt die bestehende Sitzung direkt aus dem
  Cookie — kein zweiter Anmeldeschritt (→ Konten AC-9);
- Erweiterungen wie Passkeys, Zwei-Faktor oder Google-Anmeldung sind Zusatz-
  Bausteine, kein Umbau.

**Bedingung:** SQLite im Node-Prozess. Node 20 hat das nicht eingebaut, und
`better-sqlite3` muss auf Windows uebersetzt werden. Deshalb geht dieser Weg
zusammen mit einem Sprung auf **Node 24**, wo `node:sqlite` fest dabei ist.

### Wenn das nicht gewollt ist: PocketBase

Eine einzelne 15-MB-Datei, kein Uebersetzen, keine Node-Version noetig.
Startet mit eigener Verwaltungsoberflaeche, SQLite, Mailversand,
Kennwort-Ruecksetzung und OAuth-Anbindung — und belegt rund 30 MB. Der
Spielserver pruefte dann nur noch die von PocketBase ausgestellten Token.

Preis: ein zweiter Prozess, ein zweites Datenmodell, und die Spielerbilanz
liegt woanders als die Partien.

## Entscheidung

**Better Auth im Spielserver, SQLite ueber `node:sqlite`, dafuer Sprung auf
Node 24.** Entschieden am 2026-08-28.

Dazu zwei Festlegungen, die daran haengen:

1. **Eroeffnen verlangt ein Konto, Mitspielen nicht.** Wer eine Partie
   eroeffnet, belegt Rechenzeit — dort leistet ein Konto etwas. Wer mitspielt,
   tippt Code und Namen (→ [Konten](../../specs/00-plattform/konten.md) AC-1
   und AC-16).
2. **Registrieren geht nur mit Einladungscode.** Die Codes erzeugt der
   Betreiber. Damit steht fest, wer Partien eroeffnen kann, ohne dass fuer
   jeden neuen Mitspieler jemand von Hand ein Konto anlegen muss.

Nicht entschieden ist damit die Frage der **Last**: ein Fremder, der
Raumcodes durchprobiert, will gar kein Konto. Das regelt
[ADR-0005](0005-grenzen-statt-vertrauen.md).

## Nicht Teil dieser Entscheidung

- **Der Raumcode bleibt der schnelle Weg hinein.** Was
  [ADR-0002](0002-raumcode.md) festhaelt, gilt weiter — fuer alle ausser dem
  Gastgeber. Vier von fuenf Leuten am Abend richten nichts ein.
- Ranglisten und Freundeslisten bekommen eine eigene Spec, wenn Konten stehen.
