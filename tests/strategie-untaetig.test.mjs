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

test('einheiten AC-20: viele zum selben Punkt stellen sich nebeneinander, viele Sammler verteilen sich auf den Vorrat', () => {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('a').basis;
  for (let i = 0; i < 4; i++) welt.einheitAnlegen('a', basis.x + 3, basis.y + 3 + (i % 2));
  const leute = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a');
  // Ein freier Punkt ein Stueck vor der Basis.
  let ziel = null;
  for (let r = 8; r < 30 && !ziel; r++) {
    const x = basis.x + r;
    const y = basis.y + r;
    let frei = true;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (!karten.begehbar(welt.karte, x + dx, y + dy)) frei = false;
    if (frei) ziel = { x, y };
  }
  assert.ok(ziel);
  welt.befehl('a', leute.map((e) => e.id), ziel);
  sekunden(welt, 40);
  const plaetze = leute.map((e) => `${Math.round(e.x)},${Math.round(e.y)}`);
  assert.equal(new Set(plaetze).size, leute.length, `jeder auf eigenem Feld: ${plaetze.join(' ')}`);
  for (const e of leute) {
    assert.ok(Math.hypot(e.x - ziel.x, e.y - ziel.y) <= 2, `nah am Ziel: ${e.x},${e.y}`);
    assert.equal(e.weg.length, 0, 'angekommen');
  }

  // Einer allein geht genau dorthin.
  const einzeln = leute[0];
  welt.befehl('a', [einzeln.id], { x: ziel.x - 1, y: ziel.y });
  sekunden(welt, 10);
  assert.deepEqual({ x: einzeln.x, y: einzeln.y }, { x: ziel.x - 1, y: ziel.y });

  // Vier Sammler auf einen Baum: vier verschiedene Baeume, alle nah am geklickten.
  const dorfbewohner = leute.filter((e) => e.art === 'dorfbewohner').slice(0, 4);
  const g = welt.karte.groesse;
  const baum = welt.karte.felder.findIndex((f, i) => f === karten.WALD
    && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => welt.karte.felder[i + dx + dy * g] === karten.WALD));
  const geklickt = { x: baum % g, y: Math.floor(baum / g) };
  welt.befehl('a', dorfbewohner.map((e) => e.id), geklickt);
  const felder = dorfbewohner.map((e) => e.auftrag.feld);
  assert.equal(new Set(felder.map((f) => `${f.x},${f.y}`)).size, 4, `vier Baeume: ${JSON.stringify(felder)}`);
  assert.deepEqual(felder[0], geklickt, 'der erste an den geklickten');
  for (const f of felder) {
    assert.equal(welt.karte.felder[f.y * g + f.x], karten.WALD);
    assert.ok(Math.hypot(f.x - geklickt.x, f.y - geklickt.y) <= 3);
  }
});
