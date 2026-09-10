# Transfermarkt

**Bereich:** Manager
**Kuerzel:** transfer
**Stand:** 24/25 fertig · 1 zurueckgestellt

## Zweck

Einen Kader verändern, statt ihn zu verwalten. Ein Angebot, eine Antwort —
und die anderen Vereine handeln nach denselben Regeln, auch untereinander.

## Abgrenzung

| Gehört dazu                                    | Gehört nicht dazu                              |
| ---------------------------------------------- | ---------------------------------------------- |
| Marktwert, Forderung, Kauf, Verkauf, Fenster   | Berater, Vertragspoker, Handgeld               |
| Angebote der anderen, Handel untereinander     | Leihgeschäfte, Ausstiegsklauseln               |
| Transferliste, Freistellen                     | Verträge selbst → [Verträge](vertraege.md)     |

## Abnahmekriterien

### Was ein Spieler wert ist

- **AC-1** `fertig` **Marktwert wächst steiler als Stärke** — Ein
  Spitzenspieler ist nicht doppelt so viel wert wie ein guter, sondern ein
  Vielfaches.
- **AC-2** `fertig` **Alter drückt den Wert** — Ein 33-Jähriger kostet einen
  Bruchteil dessen, was derselbe Spieler mit 25 gekostet hätte.
- **AC-3** `fertig` **Ungenutztes Talent hebt ihn** — Wer sein Talent noch
  nicht erreicht hat, ist teurer als einer, der es ausgeschöpft hat.
- **AC-4** `fertig` **Forderung über dem Marktwert** — Ein Verein verkauft
  nicht gern, und einen Stammspieler noch weniger gern als den vierten Torwart.
  Billiger wird es nur auf der Transferliste und im letzten Vertragsjahr.

### Kaufen

- **AC-5** `fertig` **Absage nennt den Preis** — Die Absage nennt die
  Forderung, statt den Manager raten zu lassen.
- **AC-6** `fertig` **Gebot nur bis zum Kontostand** — Geprüft wird auf dem
  Server; mit leerem Konto unterschreibt auch kein Vereinsloser.
- **AC-7** `fertig` **Der Kader hat eine Obergrenze** — Bei 26 Spielern ist
  Schluss.
- **AC-8** `fertig` **Letzter Torwart bleibt** — Unter dem Mindestbestand je
  Position steht niemand zum Verkauf; solche Spieler tauchen erst gar nicht in
  der Liste auf.
- **AC-9** `fertig` **Vereinslose kosten keine Ablöse** — Nur Gehalt. Sie sind
  der Ausweg für einen dünnen Kader mit wenig Geld.
- **AC-10** `fertig` **Wechsel verschiebt Geld und Spieler** — Beim Verkäufer
  steigt das Konto um genau das, was beim Käufer abgeht.
- **AC-15** `fertig` **Transferfenster** — Spieler anderer Vereine wechseln nur
  von der Vorbereitung bis zum 3. Spieltag und von der Winterpause bis zum 18.
  Spieltag. Vereinslose gehen immer.
- **AC-19** `fertig` **Nicht jeder will kommen** — Wer deutlich besser ist als
  der Verein, geht nicht in die zweite Liga und nicht zu einem Verein ohne
  Ruf. Die Absage sagt es.
- **AC-21** `fertig` **Ein Spieler bleibt derselbe** — Er behält seine Nummer,
  seine Werte und seine Statistik über jeden Wechsel; neu sind nur Verein und
  Vertrag.
- **AC-22** `fertig` **Der Markt lässt sich filtern** — Nach Position, Liga
  oder vereinslos, Höchstalter, Mindeststärke und Höchstpreis, sortiert nach
  Stärke, Preis, Alter oder Talent.

### Verkaufen

- **AC-11** `fertig` **Andere Vereine bieten selbst** — Während das Fenster
  offen ist, können nach jedem Termin Angebote auf eigene Spieler eintreffen.
  Sie stehen im Postfach und gelten zwei Termine.
- **AC-12** `fertig` **Gebote nur auf Verstärkungen** — Ein Verein bietet auf
  niemanden, der schlechter ist als seine Stammelf auf der Position — außer auf
  einen, der auf der Transferliste steht.
- **AC-13** `fertig` **Mindestbestand gilt auch für dich** — Ein Angebot auf
  den letzten Torwart wird abgelehnt, nicht ausgeführt.
- **AC-14** `fertig` **Verkauf räumt die Aufstellung** — Sie wird verworfen,
  statt mit einer Lücke zu spielen.
- **AC-20** `fertig` **Transferliste** — Wer einen Spieler auf die Liste setzt,
  bekommt öfter Angebote für ihn, auch von Vereinen, die ihn sonst nicht
  wollten — für weniger Geld.
- **AC-23** `fertig` **Freistellen kostet Abfindung** — Ein Spieler lässt sich
  jederzeit freistellen; er geht zu den Vereinslosen, und die Hälfte seiner
  restlichen Gehälter wird fällig.

### Die anderen

- **AC-16** `fertig` **Die anderen handeln untereinander** — Im Fenster und im
  Sommer stopfen die Vereine des Servers Löcher im Kader und holen
  Verstärkungen, von Vereinslosen und voneinander. Wer über 23 Spieler wächst,
  gibt den Schwächsten ab.
- **AC-24** `fertig` **Wer im Minus steht, verkauft** — Ein Verein des Servers
  mit negativem Konto setzt seine zwei teuersten Spieler auf die
  Transferliste.
- **AC-25** `fertig` **Der Ticker zeigt jeden Wechsel** — Wer von wem zu wem
  für wie viel, auch zwischen den anderen Vereinen.

### Bewusst nicht

- **AC-17** `zurueckgestellt` (ein Angebot, eine Antwort — der Spieler nennt sein Gehalt, Verträge AC-2) **Gehaltsverhandlung** —
  Gebot und Gegengebot über mehrere Runden.
- **AC-18** `fertig` **Auslaufende Verträge** — Ein Vertrag, der ausläuft,
  macht den Spieler billiger und am Saisonende frei
  (→ [Verträge](vertraege.md) AC-6).
