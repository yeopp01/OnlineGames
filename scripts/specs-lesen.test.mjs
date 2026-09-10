// Der gemeinsame Leser entscheidet ueber gruen und rot von Board, Belegen und
// Bericht. Faellt eine Regel darin still weg, meldet kein Waechter mehr
// "kaputt", sondern "alles in Ordnung" - deshalb hat er eigene Tests.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { belegeFuer, literale, specLesen, standzeile, zaehlen } from './specs-lesen.mjs';

const kopf = '# Beispiel\n\n**Bereich:** Test\n**Kuerzel:** beispiel\n**Stand:** alt\n\n## Abnahmekriterien\n\n';

test('ein Kriterium traegt Status, Kurztitel, Text und Gruppe', () => {
  const spec = specLesen(`${kopf}### Zugang\n\n- **AC-1** \`fertig\` **Kurzer Titel** — Der Text,\n  ueber zwei Zeilen.\n`);
  assert.deepEqual(spec.fehler, []);
  assert.equal(spec.kuerzel, 'beispiel');
  assert.deepEqual(spec.kriterien, [{
    id: 'AC-1', zahl: 1, status: 'fertig', grund: '', titel: 'Kurzer Titel', text: 'Der Text, ueber zwei Zeilen.', gruppe: 'Zugang',
  }]);
});

test('zurueckgestellt braucht einen Grund in Klammern', () => {
  const mit = specLesen(`${kopf}- **AC-1** \`zurueckgestellt\` (erst mit Mailversand) **Titel** — Text.\n`);
  assert.deepEqual(mit.fehler, []);
  assert.equal(mit.kriterien[0].grund, 'erst mit Mailversand');

  const ohne = specLesen(`${kopf}- **AC-1** \`zurueckgestellt\` **Titel** — Text.\n`);
  assert.match(ohne.fehler.join(), /ohne Grund/);
});

test('unbekannter Status, fehlender Status und alte Schreibweise fallen auf', () => {
  assert.match(specLesen(`${kopf}- **AC-1** \`erledigt\` **Titel** — Text.\n`).fehler.join(), /unbekannter Status "erledigt"/);
  assert.match(specLesen(`${kopf}- **AC-1** **Titel** — Text.\n`).fehler.join(), /ohne Status/);
  assert.match(specLesen(`${kopf}- **AC-1** \`in qa\` **Titel** — Text.\n`).fehler.join(), /unbekannter Status "in qa"/);
});

test('nachsichtig liest die alte Schreibweise fuer die Historie', () => {
  const spec = specLesen(`${kopf}- **AC-1** \`in qa\` **Titel** — Text.\n`, 'alt', { nachsichtig: true });
  assert.equal(spec.kriterien[0].status, 'in-qa');
});

test('der Kurztitel hat hoechstens fuenf Woerter und 44 Zeichen', () => {
  assert.match(specLesen(`${kopf}- **AC-1** \`offen\` **Eins zwei drei vier fuenf sechs** — Text.\n`).fehler.join(), /zu lang/);
  assert.match(specLesen(`${kopf}- **AC-1** \`offen\` **Unaussprechlichkeitsbeschwerdefuehrungskommission** — Text.\n`).fehler.join(), /zu lang/);
  assert.match(specLesen(`${kopf}- **AC-1** \`offen\` Nur Text ohne Titel.\n`).fehler.join(), /ohne Kurztitel/);
  assert.deepEqual(specLesen(`${kopf}- **AC-1** \`offen\` **Eins zwei drei vier fuenf** — Text.\n`).fehler, []);
});

test('eine doppelte Nummer und ein fehlendes Kuerzel fallen auf', () => {
  assert.match(specLesen(`${kopf}- **AC-1** \`offen\` **A** — x\n- **AC-1** \`offen\` **B** — y\n`).fehler.join(), /zweimal/);
  assert.match(specLesen('# Ohne\n\n- **AC-1** `offen` **A** — x\n').fehler.join(), /Kuerzel/);
});

test('ein Testname belegt AC-7, aber nicht AC-70', () => {
  const namen = [
    { datei: 'a', name: 'beispiel AC-70: etwas anderes' },
    { datei: 'b', name: 'transfer AC-7 und beispiel AC-7: beides' },
    { datei: 'c', name: 'anderes AC-7: fremdes Kuerzel' },
  ];
  assert.deepEqual(belegeFuer(namen, 'beispiel', 'AC-7').map((n) => n.datei), ['b']);
  assert.deepEqual(belegeFuer(namen, 'beispiel', 'AC-70').map((n) => n.datei), ['a']);
  assert.deepEqual(belegeFuer(namen, null, 'AC-7'), []);
});

test('der Stand zaehlt fertig gegen alle', () => {
  const spec = specLesen(`${kopf}- **AC-1** \`fertig\` **A** — x\n- **AC-2** \`in-qa\` **B** — y\n- **AC-3** \`offen\` **C** — z\n`);
  assert.equal(standzeile(zaehlen(spec.kriterien)), '1/3 fertig · 1 in QA · 1 offen');
  assert.equal(standzeile(zaehlen([])), 'noch keine Kriterien');
});

test('Literale finden ganze Zeichenketten, keine Schablonen', () => {
  const gefunden = literale("test('ein Name', () => {}); const x = `mit ${y}`; const z = \"doppelt\";");
  assert.ok(gefunden.has('ein Name'));
  assert.ok(gefunden.has('doppelt'));
  assert.ok(![...gefunden].some((s) => s.includes('${')));
});
