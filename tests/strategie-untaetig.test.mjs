// Untaetige Dorfbewohner (einheiten AC-21) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md). Die Oberflaeche dazu: bedienung AC-28 in
// e2e/tests/strategie-untaetig.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const sekunden = (welt, s) => { for (let i = 0; i < s * TAKTE_PRO_SEKUNDE; i++) welt.takten(); };

test('einheiten AC-21: die Welt weiss je Spieler, welche Dorfbewohner nichts tun, und schickt es mit', () => {
  const welt = new Welt(ZWEI, 7);
  const dorfbewohner = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  const reiter = [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'spaeherreiter');

  // Zu Beginn stehen alle drei Dorfbewohner; der Reiter zaehlt nicht.
  assert.deepEqual(welt.untaetigeVon('a').sort(), dorfbewohner.map((e) => e.id).sort());
  assert.ok(!welt.untaetigeVon('a').includes(reiter.id));

  // Wer sammeln geht, ist unterwegs und dann am Arbeiten - nicht untaetig.
  const [sammler, laeufer] = dorfbewohner;
  const g = welt.karte.groesse;
  const baum = welt.karte.felder.reduce((bestes, f, i) => {
    if (f !== karten.WALD) return bestes;
    const d = Math.hypot((i % g) - sammler.x, Math.floor(i / g) - sammler.y);
    return !bestes || d < bestes.d ? { i, d } : bestes;
  }, null);
  welt.befehl('a', [sammler.id], { x: baum.i % g, y: Math.floor(baum.i / g) });
  const basis = welt.spielerVon('a').basis;
  welt.befehl('a', [laeufer.id], { x: basis.x + 6, y: basis.y + 6 });
  assert.ok(!welt.untaetigeVon('a').includes(sammler.id), 'unterwegs zum Wald');
  assert.ok(!welt.untaetigeVon('a').includes(laeufer.id), 'unterwegs');
  sekunden(welt, 30);
  assert.ok(sammler.sammelt || sammler.weg.length, 'der Sammler arbeitet');
  assert.ok(!welt.untaetigeVon('a').includes(sammler.id));
  // Wer nur hingegangen ist, steht danach wieder herum.
  assert.ok(welt.untaetigeVon('a').includes(laeufer.id), 'angekommen und untaetig');

  // Im Zustand fuer den Browser: je Spieler die Liste, nur wenn es welche gibt.
  const zustand = welt.zustand();
  const anna = zustand.spieler.find((s) => s.id === 'a');
  assert.deepEqual([...anna.u].sort(), welt.untaetigeVon('a').sort());
  for (const e of dorfbewohner) welt.befehl('a', [e.id], { x: baum.i % g, y: Math.floor(baum.i / g) });
  // Wer schon neben dem Baum steht, faengt im naechsten Takt an.
  welt.takten();
  assert.equal(welt.zustand().spieler.find((s) => s.id === 'a').u, undefined, 'niemand untaetig - kein Eintrag');
});
