// Waechter: die Welt des Managerspiels gehoert niemandem - was einem
// Menschen gehoert, steht in seinem Eintrag in `manager[]`
// (→ specs/15-manager/karriere.md AC-29, docs/manager/plan.md M0.4).
//
// Warum es diesen Waechter gibt: bis Fassung 3 standen Verein, Post, Buch
// und Vorstand des einen Menschen als Felder des Spielstands, und jede Regel
// las `this.vereinId`. Mit zwei Menschen ist jede dieser Stellen falsch, und
// eine vergessene faellt erst auf, wenn der zweite die Post des ersten
// bekommt. Seit Fassung 4 fragt der Server `managerVon(vereinId)`,
// `menschFuehrt(vereinId)` oder nimmt den Manager als Argument. Damit ist
// alles, was danach gebaut wird, fuer mehrere Menschen gebaut - auch bevor
// sie hereinduerfen (M3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { quelltext } from './quelltext.mjs';

const require = createRequire(import.meta.url);
const { MENSCHENFELDER } = require('../server/spiele/manager/welt.js');

const ORDNER = 'server/spiele/manager';
const DATEIEN = readdirSync(new URL(`../${ORDNER}/`, import.meta.url)).filter((d) => d.endsWith('.js'));

// `this.vereinId`, `welt.nachrichten`, `karriere.verein` - die Karriere selbst
// traegt keines dieser Felder mehr, und keinen Getter fuer den einen Verein.
const VERBOTEN = new RegExp(`\\b(this|welt|karriere)\\.(${[...MENSCHENFELDER, 'verein', 'mensch'].join('|')})\\b`);

test('karriere AC-29: der Waechter erkennt ein Feld des einen Menschen', () => {
  // Gegenprobe: die Zeilen von Fassung 3 waeren aufgefallen.
  assert.ok(VERBOTEN.test('if (verein.id === this.vereinId) continue;'));
  assert.ok(VERBOTEN.test('this.nachrichten.push(nachricht);'));
  assert.ok(VERBOTEN.test('const eigener = karriere.verein;'));
  assert.ok(VERBOTEN.test('if (welt.status === "entlassen") return;'));
  assert.ok(VERBOTEN.test('const halt = this.mensch();'));
  // Was bleiben darf: die Vereine der Welt, Lesen ueber den Verein, Felder am Manager.
  assert.ok(!VERBOTEN.test('const v = this.vereinVon(manager.vereinId);'));
  assert.ok(!VERBOTEN.test('for (const verein of this.vereine) {}'));
  assert.ok(!VERBOTEN.test('manager.vorstand.vertrauen += 1;'));
  assert.ok(!VERBOTEN.test('if (this.menschFuehrt(verein.id)) continue;'));
});

test('karriere AC-29: kein Feld des einen Menschen im Server des Managerspiels', () => {
  assert.ok(DATEIEN.length >= 15, `nur ${DATEIEN.length} Dateien gefunden`);
  const funde = [];
  for (const datei of DATEIEN) {
    quelltext(`${ORDNER}/${datei}`).split('\n').forEach((zeile, i) => {
      const treffer = zeile.match(VERBOTEN);
      if (treffer) funde.push(`${datei}:${i + 1} ${treffer[0]}`);
    });
  }
  assert.deepEqual(funde, [], 'ein Feld des einen Menschen - ueber managerVon(), menschFuehrt() oder den Manager lesen');
});
