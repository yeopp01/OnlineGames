// Die Regeln hinter nachweis(), ohne Browser geprueft.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { herkunft, kurzform, nachweis, sollBildSchreiben } from './qa-nachweis.mjs';

test('ein Bild entsteht, wenn es fehlt - sonst nur auf Ansage', () => {
  assert.equal(sollBildSchreiben(false, {}), true);
  assert.equal(sollBildSchreiben(true, {}), false);
  assert.equal(sollBildSchreiben(true, { QA_NACHWEIS: '1' }), true);
  assert.equal(sollBildSchreiben(true, { QA_NACHWEIS: '0' }), false);
});

test('der Dateiname kommt aus dem Titel, mit umschriebenen Umlauten', () => {
  assert.equal(kurzform('Größe über Maß - ein Titel!'), 'groesse-ueber-mass-ein-titel');
  assert.ok(kurzform('x'.repeat(100)).length <= 60);
  assert.ok(!kurzform(`${'wort '.repeat(20)}`).endsWith('-'));
});

test('die Herkunft laesst den Dateinamen am Anfang des Titelpfads weg', () => {
  const info = {
    file: `${process.cwd()}/e2e/tests/beispiel.spec.mjs`,
    titlePath: ['beispiel.spec.mjs', 'Eine Gruppe', 'kader AC-1: ein Test'],
  };
  assert.deepEqual(herkunft(info).pfad, ['Eine Gruppe', 'kader AC-1: ein Test']);
  assert.throws(() => herkunft(undefined), /TestInfo/);
});

test('eine unbekannte Spec oder ein unbekanntes Kriterium laesst den Test sofort scheitern', async () => {
  const ziel = { screenshot: () => assert.fail('ohne gueltigen Bezug darf kein Bild entstehen') };
  const info = { file: `${process.cwd()}/e2e/tests/x.spec.mjs`, titlePath: ['x.spec.mjs', 'y'] };
  await assert.rejects(nachweis(ziel, { spec: '15-manager/gibt-es-nicht.md', ac: 'AC-1', titel: 'x', test: info }), /gibt es nicht/);
  await assert.rejects(nachweis(ziel, { spec: '15-manager/karriere.md', ac: 'AC-999', titel: 'x', test: info }), /nennt kein AC-999/);
  await assert.rejects(nachweis(ziel, { spec: '15-manager/karriere.md', ac: 'AC-1', titel: ' ', test: info }), /titel/);
  await assert.rejects(nachweis(ziel, { spec: '15-manager/karriere.md', ac: 'sieben', titel: 'x', test: info }), /AC-7/);
});
