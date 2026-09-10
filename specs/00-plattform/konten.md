# Konten und Anmeldung

**Bereich:** Plattform
**Kuerzel:** konten
**Stand:** 14/20 fertig · 1 in QA · 2 geplant · 3 offen

## Zweck

Ein wiedererkennbares Profil: derselbe Name ueber Partien hinweg, eine
Bilanz gespielter Spiele, spaeter Freundeslisten und Ranglisten. Ohne dass
der schnelle Einstieg ueber einen Raumcode verlorengeht.

Die Entscheidung, **womit** das gebaut wird, steht in
[ADR-0003](../../docs/adr/0003-anmeldung.md).

## Abgrenzung

| Gehoert dazu                          | Gehoert nicht dazu                                    |
| ------------------------------------- | ----------------------------------------------------- |
| Registrieren, Anmelden, Abmelden      | Raumcode und Beitritt → [Raeume](raeume.md)           |
| Einladungscodes                       | Grenzen gegen Last → [Schutz](schutz.md)              |
| Profil: Anzeigename, Bilanz           | Ranglisten und Freunde (spaetere Spec)                |
| Sitzungen, Kennwoerter, Mailversand   | Wahl des Werkzeugs → ADR-0003                         |

## Grundsatz

**Eroeffnen verlangt ein Konto, Mitspielen nicht.**

Wer eine Partie eroeffnet, belegt Rechenzeit auf unserem Server, solange sie
laeuft. Das ist die Stelle, an der ein Konto etwas leistet: Partien sind
zurechenbar, Missbrauch begrenzbar. Und es stoert dort niemanden — der
Gastgeber ist ohnehin derjenige, der das Spiel kennt und es den anderen
zeigt.

Wer nur mitspielt, gibt Code und Namen ein. Dass vier von fuenf Leuten am
Abend nichts einrichten muessen, ist der Einstieg, den dieses Projekt richtig
macht. Der bleibt.

## Abnahmekriterien

### Zugang

- **AC-1** `fertig` **Beitreten ohne Konto** — Mit Raumcode und Namen tritt jeder bei. Auf diesem
  Weg verlangt kein Bildschirm eine Anmeldung.
- **AC-16** `fertig` **Eroeffnen verlangt ein Konto** — Eine Partie eroeffnet nur, wer angemeldet
  ist. Der Versuch ohne Anmeldung fuehrt zur Anmeldemaske, nicht zu einer
  Fehlermeldung, und danach zurueck zum Eroeffnen.
- **AC-17** `fertig` **Anzeigename kommt aus dem Konto** — Beim Eroeffnen wird der Name nicht
  abgefragt; er steht im Profil. Aendern geht dort, nicht je Partie.
- **AC-18** `fertig` **Registrieren nur mit Einladungscode** — Ohne gueltigen Einladungscode
  entsteht kein Konto. Damit steht fest, wer Partien eroeffnen kann
  (→ [ADR-0003](../../docs/adr/0003-anmeldung.md)).
- **AC-19** `fertig` **Einladungscodes sind einmalig und verfallen** — Ein Code gilt fuer genau
  eine Registrierung und laeuft nach 14 Tagen ab.
- **AC-20** `in-qa` **Einladungscodes erzeugen und zuruecknehmen** — Ueber
  `npm run einladung`, also nur auf der Maschine selbst. Es gibt bewusst
  keinen Weg ueber das Netz.
- **AC-2** `fertig` **Registrieren mit Mail und Kennwort** — Registrierung mit Mailadresse,
  Kennwort und Anzeigename.
- **AC-3** `fertig` **Kennwort nie im Klartext** — Kennwoerter liegen ausschliesslich als
  Argon2id-Hash vor. Auch nicht im Protokoll, auch nicht in Fehlermeldungen.
- **AC-4** `geplant` **Mailadresse wird bestaetigt** — Ein Konto gilt erst nach Bestaetigung der
  Mailadresse als vollwertig; bis dahin ist es ein Gastkonto mit Namen.
- **AC-5** `geplant` **Kennwort vergessen** — Ein Ruecksetzlink per Mail, gueltig eine Stunde,
  genau einmal verwendbar.
- **AC-6** `offen` **Anmeldung ueber Google/GitHub** — Wahlweise statt Kennwort. _(Nicht zum Start:
  bindet uns an fremde Dienste, bevor klar ist, ob es jemand nutzt.)_

### Sitzung

- **AC-7** `fertig` **Sitzung ueberlebt das Neuladen** — Nach der Anmeldung bleibt der Spieler
  angemeldet, bis er abmeldet oder 30 Tage vergangen sind.
- **AC-8** `fertig` **Sitzungscookie ist abgesichert** — `HttpOnly`, `Secure`, `SameSite=Lax`.
  Kein Token im `localStorage`.
- **AC-9** `fertig` **WebSocket erbt die Anmeldung** — Die Spielverbindung erkennt das angemeldete
  Konto aus der bestehenden Sitzung. Kein zweiter Anmeldeschritt.
- **AC-10** `fertig` **Abmelden beendet ueberall** — Abmelden macht die Sitzung serverseitig
  ungueltig, nicht nur im Browser.

### Missbrauch

- **AC-11** `fertig` **Anmeldeversuche sind begrenzt** — Hoechstens fuenf Anmeldeversuche und
  zehn Registrierungen je Stunde und Adresse. Danach antwortet der Server mit
  429, ohne den Versuch noch zu pruefen.
- **AC-12** `fertig` **Keine Kontoauskunft** — „Mailadresse unbekannt" und „Kennwort falsch"
  ergeben dieselbe Antwort. Auch die Antwortzeit unterscheidet sich nicht.
- **AC-13** `fertig` **Anzeigename ist kein Ausweis** — Zwei Konten duerfen denselben Anzeigenamen
  fuehren. Eindeutig ist die Kennung, nicht der Name.

### Profil

- **AC-14** `offen` **Bilanz je Konto** — Gespielte Partien, gesammelte Vorraete, Siege.
- **AC-15** `offen` **Konto loeschen** — Der Spieler kann sein Konto samt Bilanz selbst loeschen;
  laufende Partien laufen anonymisiert weiter.

## Grenzfaelle

- Ein angemeldeter Spieler, der einer Partie beitritt, spielt trotzdem als
  normaler Teilnehmer — das Konto aendert an den Spielregeln nichts.
- Meldet sich jemand mitten in einer Partie ab, bleibt sein Platz bis zum Ende
  bestehen. Die Partie kennt nur Plaetze, keine Konten.
