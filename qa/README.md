# Bildnachweise und Bericht

Hier liegen die Bilder, die zeigen, **wie ein Abnahmekriterium aussieht** —
und die Liste der Kriterien, die kein Aussehen haben. Begruendung:
[ADR-0011](../docs/adr/0011-bildnachweise.md).

## Bericht ansehen

```bash
npm run qa:report          # schreibt qa/report/index.html
```

Die Seite ist die **Uebersicht**: welche Specs es gibt, welche
Abnahmekriterien, was davon umgesetzt ist. Je Spec eine Zeile je Kriterium
mit Status, dem Test, der es nennt, dem Bild oder der Begruendung — oder als
offene Luecke. Oben wird nach Status und Nachweis gefiltert und durchsucht
(Taste `/`), links steht das Inhaltsverzeichnis mit einem Balken je Spec.

Ganz oben steht, wohin sich die Zahlen bewegen: Zeilen je Klasse und
Kriterien je Status zu Stichtagen, gelesen aus der Git-Historie
([`scripts/fortschritt.mjs`](../scripts/fortschritt.mjs)). Ist der Arbeitsbaum
nicht sauber, kommt ein Punkt „jetzt" dazu. Darunter der Bestand an
Pruefungen je Art.

Der Bericht ist erzeugt und nicht eingecheckt. Die Bilder sind es.

## Beleg aus einem Test schreiben

```js
import { nachweis } from '../../scripts/qa-nachweis.mjs';
import { expect, test } from '../helpers/seite.mjs';

test('karriere AC-1: der Mensch waehlt seinen Verein', async ({ page }, info) => {
  await page.goto('/manager.html');
  await expect(page.locator('.vereinskarte')).toHaveCount(18);
  await nachweis(page, {
    spec: '15-manager/karriere.md',
    ac: 'AC-1',
    titel: 'Die Vereinswahl zeigt alle achtzehn Vereine mit Staerke, Konto und Kaderwert',
    test: info,
  });
});
```

Daraus entsteht:

```
qa/bildnachweise/15-manager/karriere/
  AC-01--die-vereinswahl-zeigt-alle-achtzehn-vereine-mit-staerke-ko.png
  AC-01--die-vereinswahl-zeigt-alle-achtzehn-vereine-mit-staerke-ko.json
```

Beides gehoert in den Commit. Drei Regeln dazu:

- Der **Testname** nennt das Kriterium (`karriere AC-1`) — daran haengt
  `npm run specs:belege`.
- Die **Bildunterschrift** steht als ganze Zeichenkette im Test, nicht
  zusammengesetzt. Daran prueft der Bericht, ob der Nachweis noch einen
  Erzeuger hat.
- Nennt die Spec das Kriterium nicht, scheitert schon der Test.

## Wann ein Bild neu entsteht

Der gewoehnliche Lauf schreibt nur Bilder, die **fehlen** — ein neues
Kriterium, eine geaenderte Bildunterschrift. Alle neu:

```bash
npm run qa:nachweis                # alle Bilder neu
npm run qa:nachweis -- transfer    # nur aus passenden Testdateien
```

Das gehoert hinter eine Aenderung an der Oberflaeche und vor das Einchecken,
nicht in jeden Lauf. Sonst waere jeder Lauf ein Bilddiff, der nur aus einer
anderen Rechendauer in der Kopfzeile besteht.

Mehrere Bilder je Kriterium sind erlaubt; sie unterscheiden sich im Titel.

## Kein Bild noetig

Eine Rechenregel, eine Grenze auf dem Server, ein Protokoll haben kein
Aussehen. Solche Kriterien stehen mit Begruendung in
[`ohne-bild.json`](ohne-bild.json):

```json
{
  "spec": "15-manager/spieltag.md",
  "ac": "AC-5",
  "begruendung": "Eine Messung ueber tausend Begegnungen. Ein Bild zeigt ein Ergebnis, keinen Schnitt."
}
```

Eine gute Begruendung sagt, **was** das Kriterium ist und **warum** ein
Bildschirm es nicht zeigen kann. „Nicht sichtbar" allein ist keine.

Liegt trotzdem ein Bild vor, wird es angezeigt. Die Liste sagt „wird nicht
verlangt", nicht „darf nicht".

## Was `npm run check` bricht

- Bild ohne Bezugsdatei, Bezugsdatei ohne Bild,
- Bezug auf eine Spec oder ein Kriterium, das es nicht gibt,
- ein Nachweis ohne Erzeuger: Testdatei, Testname oder Bildunterschrift
  stehen nicht mehr im Test,
- ein doppelter, verwaister oder unbegruendeter Eintrag in `ohne-bild.json`,
- ein Kriterium auf `fertig` ohne Bild und ohne Begruendung,
- ein Bild an einem Kriterium, das `offen`, `geplant` oder `zurueckgestellt`
  ist.

Ein Kriterium **ohne Nachweis**, das nicht `fertig` ist, bricht nichts — es
steht im Bericht. `npm run qa:report -- --streng` macht auch das zum
Fehlschlag.

Was die Pruefung ausdruecklich **nicht** beweist: dass ein Bild noch zeigt,
was es behauptet. Sie beweist, dass es noch einen Test gibt, der es erneuern
koennte.
