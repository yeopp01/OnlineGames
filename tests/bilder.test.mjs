// Die gerenderten Bilder (→ specs/10-strategie/darstellung.md AC-17, ADR-0014).
//
// Ohne Blender und ohne Browser pruefbar ist, ob das, was eingecheckt ist,
// zusammenpasst: jede Tafel so gross, wie ihre Beschreibung sagt, die Maske
// deckungsgleich, und zu jedem Bild ein Modell als Skript.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const ordner = new URL('../public/bilder/', import.meta.url);
const grafik = new URL('../grafik/', import.meta.url);

/** Breite und Hoehe aus dem Kopf einer PNG-Datei. */
function masse(datei) {
  const kopf = readFileSync(new URL(datei, ordner));
  assert.equal(kopf.toString('latin1', 1, 4), 'PNG', `${datei} ist keine PNG-Datei`);
  return { breite: kopf.readUInt32BE(16), hoehe: kopf.readUInt32BE(20), farbart: kopf[25] };
}

const beschreibungen = readdirSync(ordner).filter((n) => n.endsWith('.json'))
  .map((n) => ({ name: n.replace(/\.json$/, ''), ...JSON.parse(readFileSync(new URL(n, ordner), 'utf8')) }));

test('darstellung AC-17: Dorfbewohner, Haus und Baum liegen als gerenderte Tafeln vor', () => {
  const namen = beschreibungen.map((b) => b.name);
  for (const name of ['dorfbewohner', 'haus', 'baum']) assert.ok(namen.includes(name), `${name} fehlt unter public/bilder/`);
});

test('darstellung AC-17: jede Tafel ist so gross, wie ihre Beschreibung sagt, und hat Durchsicht', () => {
  for (const b of beschreibungen) {
    const bild = masse(b.bild);
    assert.equal(bild.breite, b.zelle[0] * b.spalten, `${b.bild}: Breite`);
    assert.equal(bild.hoehe, b.zelle[1] * b.zeilen, `${b.bild}: Hoehe`);
    // Farbart 6 ist RGB mit Durchsicht - ohne sie staende jedes Stueck in einem Kasten.
    assert.equal(bild.farbart, 6, `${b.bild}: keine Durchsicht`);
    assert.ok(b.fuss[0] > 0 && b.fuss[0] < b.zelle[0] && b.fuss[1] > 0 && b.fuss[1] <= b.zelle[1], `${b.name}: Fusspunkt ausserhalb der Zelle`);
    if (b.maske) {
      const maske = masse(b.maske);
      assert.deepEqual([maske.breite, maske.hoehe], [bild.breite, bild.hoehe], `${b.maske} deckt sich nicht mit ${b.bild}`);
    }
  }
});

test('darstellung AC-17: der Dorfbewohner steht und geht in acht Blickrichtungen', () => {
  const figur = beschreibungen.find((b) => b.name === 'dorfbewohner');
  assert.equal(figur.richtungen, 8);
  assert.equal(figur.zeilen, 8, 'eine Zeile je Blickrichtung');
  assert.equal(figur.ablaeufe.stehen.bilder, 1);
  assert.ok(figur.ablaeufe.gehen.bilder >= 8, 'Gehen ist ein Ablauf aus mindestens acht Bildern');
  assert.equal(figur.spalten, figur.ablaeufe.stehen.bilder + figur.ablaeufe.gehen.bilder);
  assert.ok(figur.maske, 'die Spielerfarbe kommt als Maske');
});

test('darstellung AC-17: zu jedem Bild gibt es das Modell als Skript', () => {
  const kette = readFileSync(new URL('bilder.py', grafik), 'utf8');
  for (const b of beschreibungen) {
    assert.ok(existsSync(new URL(`${b.name}.py`, grafik)), `grafik/${b.name}.py fehlt`);
    assert.ok(kette.includes(`'${b.name}'`), `grafik/bilder.py kennt ${b.name} nicht`);
  }
  // Und umgekehrt keine Rastergrafik ohne Beschreibung.
  const bekannt = new Set(beschreibungen.flatMap((b) => [b.bild, b.maske].filter(Boolean)));
  for (const datei of readdirSync(ordner).filter((n) => n.endsWith('.png'))) {
    assert.ok(bekannt.has(datei), `public/bilder/${datei} hat keine Beschreibung`);
  }
});
