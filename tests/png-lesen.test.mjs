// Der eigene PNG-Leser (scripts/png-lesen.mjs).
//
// Er ist von Hand geschrieben - Kopf, inflate, die fuenf Filter der Norm -,
// und `npm run qa:abweichung` haengt daran. Ein stiller Fehler darin wuerde
// als "dieses Bild hat sich kaum geaendert" durchgehen, also wird er gegen
// eingecheckte Bildnachweise geprueft.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { bildAbweichung, pngLesen } from '../scripts/png-lesen.mjs';
import { WURZEL } from '../scripts/specs-lesen.mjs';

const BILD = join(
  WURZEL, 'qa', 'bildnachweise', '00-plattform', 'raeume',
  'AC-01--der-warteraum-zeigt-den-code-in-zwei-dreiergruppen.png',
);
const ANDERES = join(
  WURZEL, 'qa', 'bildnachweise', '00-plattform', 'raeume',
  'AC-02--annas-warteraum-zeigt-bert-sobald-er-beigetreten-ist.png',
);

test('png-lesen: Kopf und Bildpunkte eines eingecheckten Nachweises', () => {
  const bild = pngLesen(BILD);
  assert.ok(bild.breite > 100 && bild.hoehe > 100, `${bild.breite}x${bild.hoehe}`);
  assert.ok([1, 2, 3, 4].includes(bild.kanaele));
  assert.equal(bild.daten.length, bild.breite * bild.hoehe * bild.kanaele);
  // Ein Bildschirmbild ist nirgends durchsichtig und nicht ueberall gleich:
  // beides faellt auf, wenn das Entfiltern danebengeht.
  const farben = new Set();
  for (let p = 0; p < bild.breite * bild.hoehe; p += 97) {
    farben.add(bild.daten.readUIntBE(p * bild.kanaele, 3));
  }
  assert.ok(farben.size > 20, `nur ${farben.size} verschiedene Farben`);
});

test('png-lesen: aus einem Puffer gelesen kommt dasselbe heraus wie aus der Datei', () => {
  const ausDatei = pngLesen(BILD);
  const ausPuffer = pngLesen(readFileSync(BILD));
  assert.deepEqual(
    [ausPuffer.breite, ausPuffer.hoehe, ausPuffer.kanaele],
    [ausDatei.breite, ausDatei.hoehe, ausDatei.kanaele],
  );
  assert.ok(ausPuffer.daten.equals(ausDatei.daten));
});

test('png-lesen: ein Bild mit sich selbst ist 0, mit einem anderen deutlich mehr', () => {
  assert.equal(bildAbweichung(BILD, BILD), 0);
  const anders = bildAbweichung(BILD, ANDERES);
  assert.ok(anders > 0.001, `zwei verschiedene Warteraeume: ${anders}`);
});

test('png-lesen: was er nicht kann, sagt er', () => {
  assert.throws(() => pngLesen(Buffer.from('kein Bild')), /kein PNG/);
});
