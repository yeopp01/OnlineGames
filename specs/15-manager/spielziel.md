# Spielziel und Abgrenzung

**Bereich:** Manager
**Kuerzel:** manager
**Stand:** 13/15 fertig · 2 offen

## Zweck

Ein Mensch führt einen Verein durch Saison um Saison: zwei Ligen, ein Pokal,
Verträge, Jugend, Vorstand, Stadion. Die übrigen 35 Vereine spielt der
Server — nach denselben Regeln, mit denselben Grenzen. Später führen mehrere
Menschen je einen Verein derselben Welt.

Das Vorbild ist Anstoss 3, ohne Videosequenzen — und schneller: eine ganze
Saison mit 643 Pflichtspielen rechnet in rund 400 ms.

## Abgrenzung

| Gehört dazu                                      | Gehört nicht dazu                                  |
| ------------------------------------------------ | -------------------------------------------------- |
| Zwei Ligen, ein Pokal, Saison um Saison          | Europapokal, Nationalmannschaft, dritte Liga       |
| Aufstellung, Taktik, Training, Wechselregel      | Anweisungen je Spieler, Standards, Laufwege        |
| Transfer, Verträge, Jugend, Karriereende         | Berater, Handgeld, Vertragspoker über Runden       |
| Zuschauer, Fernsehen, Sponsor, Stadion, Zinsen   | Fanartikel, Catering, Bierpreis                    |
| Vorstand mit Saisonziel und Entlassung           | Presse, Interviews, Fanmeinung                     |
| Ergebnis als Ticker, Aufstellung mit Noten       | Spielverlauf in 2D, Videosequenzen, Kommentar      |
| Erfundene Vereine und Spieler                    | Echte Lizenzdaten                                  |

## Was es ausdrücklich **nicht** wird

Jede Zeile rechts ist eine Woche, die wir nicht ausgeben.

| Statt dessen                              | Was wir uns sparen                                     |
| ----------------------------------------- | ------------------------------------------------------ |
| Zwei Ligen zu je 18 Vereinen, ein Pokal   | Europapokal, Länderspiele, Ligensystem mit fünf Stufen |
| Vier Taktikregler und eine Wechselregel   | Manndeckung je Spieler, Standardsituationen, Laufwege  |
| Ergebnis, Ticker und Noten in Textform    | Spielverlauf zum Zusehen                               |
| Ein Angebot, eine Antwort                 | Berater, Vertragspoker über Runden, Handgeld           |
| Training als Regler und Schwerpunkt       | Trainerstab, Einheiten je Spieler, Wochenplan          |
| Zuschauer, Fernsehen, Sponsor, Stadion    | Fanartikel, Catering, Parkplätze, Bierpreis            |
| Ein Vorstand mit Ziel und Vertrauen       | Präsidentenwahl, Aufsichtsrat, Mitgliederversammlung   |
| Kein Presseteil                           | Interviews, Schlagzeilen, Fanmeinung                   |

## Abnahmekriterien

### Die Partie

- **AC-1** `offen` **Mehrere Manager, eine Welt** — Zwei bis sechs Menschen
  übernehmen je einen Verein derselben Welt. Die übrigen Vereine spielt der
  Server.
- **AC-2** `offen` **Der Termin wartet auf alle** — Ein Termin wird erst
  gerechnet, wenn jeder Mensch bereit ist oder seine Frist abgelaufen ist.
- **AC-3** `fertig` **Wer nichts abgibt, spielt trotzdem** — Ohne Aufstellung
  stellt der Server vor jedem Spiel die beste Elf. Abwesenheit kostet
  Leistung, nicht das Spiel.
- **AC-4** `fertig` **Eine Saison endet vollständig** — Nach dem Saisonende
  stehen die Meister beider Ligen, der Pokalsieger, Auf- und Absteiger und die
  Bilanz des eigenen Vereins fest — und bleiben in der Chronik.
- **AC-5** `fertig` **Die Karriere überlebt den Neustart** — Browser zu,
  Server neu gestartet: der Spielstand liegt am Konto in SQLite
  (→ [Karriere](karriere.md) AC-14).

### Was ein Manager entscheidet

- **AC-6** `fertig` **Aufstellung** — Elf aus dem Kader nach einem der fünf
  Systeme, gemerkt bis zum Widerruf.
- **AC-7** `fertig` **Taktik** — System, Ausrichtung, Härte und Pressing, je
  ein Wert von eins bis fünf.
- **AC-8** `fertig` **Transfer** — Ein Angebot, eine Antwort. Dazu
  verlängern, freistellen, auf die Transferliste setzen.
- **AC-9** `fertig` **Training** — Ein Regler zwischen Kondition und
  Entwicklung, dazu ein Schwerpunkt, der eingeübt wird.
- **AC-10** `fertig` **Die Kasse begrenzt alles** — Mit leerem Konto
  unterschreibt niemand; wer tief ins Minus rutscht, verliert Punkte.
- **AC-15** `fertig` **Keine Einstellung ist immer richtig** — Was dem Favoriten
  hilft, schadet dem Außenseiter; Pressing bringt heute und kostet morgen;
  Härte bringt Abwehr und kostet Sperren; ein neues System muss sich erst
  einspielen (→ [Spieltag](spieltag.md) AC-23 bis AC-25).

### Die Welt

- **AC-11** `fertig` **Saison um Saison** — Nach dem Saisonende beginnt die
  nächste, ohne Ende. Spieler altern, entwickeln sich, hören auf; die Jugend
  rückt nach.
- **AC-12** `fertig` **Zwei Ligen und ein Pokal** — Achtzehn Vereine je Liga,
  drei steigen auf und ab; dazwischen ein Pokal über fünf Runden
  (→ [Liga](liga.md), [Pokal](pokal.md)).
- **AC-13** `fertig` **Gleiche Regeln für alle** — Die Vereine des Servers
  trainieren, verlängern Verträge, kaufen und verkaufen nach denselben Regeln
  wie der Mensch. Er hat keine Sonderrechte und keine heimlichen Nachteile.
- **AC-14** `fertig` **Die Welt trägt über Jahre** — Über sechs Saisons ohne
  Menschen bleiben die Stärke der ersten Liga, die Kadergrößen und der Markt
  der Vereinslosen in ihren Bahnen, und kein Spiel widerspricht sich.
  _(Gemessen über zehn Saisons und drei Startwerte: Schnitt der ersten Liga
  zwischen 68 und 71, Kader 12 bis 23 Spieler, 45 bis 90 Vereinslose, null
  Widersprüche in 19.000 Spielen.)_
