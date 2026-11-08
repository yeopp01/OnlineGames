// Keine zwei Einheiten uebereinander (→ specs/10-strategie/einheiten-und-befehle.md
// AC-29) - Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md).
//
// Der Server laesst Stehende auseinandertreten: wer naeher als ein halbes Feld
// bei einem anderen steht, geht auf ein freies Nachbarfeld, auf dem er seine
// Arbeit behaelt. Vorher wurde das an jeder Stelle einzeln verhindert, die ein
// Ziel vergibt - siebenmal, und jedes Mal fand sich ein neuer Weg (Runde 89).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const abstand = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const takten = (welt, n) => { for (let t = 0; t < n; t++) welt.takten(); };

// Ein freies Grasfeld mit freiem Umkreis, rechts der Basis von Anna.
function freiesFeld(welt, r = 2) {
  const a = welt.spielerVon('a');
  for (let d = 6; d < 30; d++) {
    for (const [dx, dy] of [[d, 0], [0, d], [d, d], [-d, d]]) {
      const x = a.basis.x + dx;
      const y = a.basis.y + dy;
      let frei = true;
      for (let oy = -r; oy <= r && frei; oy++) {
        for (let ox = -r; ox <= r && frei; ox++) {
          if (!karten.begehbar(welt.karte, x + ox, y + oy) || welt.gebaeudeAn(x + ox, y + oy)) frei = false;
        }
      }
      if (frei) return { x, y };
    }
  }
  throw new Error('kein freies Feld');
}

test('einheiten AC-29: zwei, die nacheinander auf dasselbe Feld geschickt werden, stehen danach nebeneinander', () => {
  const lauf = (ausweichen) => {
    const welt = new Welt(ZWEI, 4711);
    if (!ausweichen) welt.ausweichen = () => {};
    const ziel = freiesFeld(welt);
    const erste = welt.einheitAnlegen('a', ziel.x - 3, ziel.y, 'miliz');
    const zweite = welt.einheitAnlegen('a', ziel.x + 3, ziel.y, 'miliz');
    // Zwei getrennte Befehle - jeder fuer sich auf genau dieses Feld.
    welt.nachricht('a', { auftrag: 'befehl', einheiten: [erste.id], ziel });
    welt.nachricht('a', { auftrag: 'befehl', einheiten: [zweite.id], ziel });
    takten(welt, 10 * TAKTE_PRO_SEKUNDE);
    return { erste, zweite, ziel };
  };
  // Gegenprobe: ohne Ausweichen stehen sie aufeinander.
  const ohne = lauf(false);
  assert.ok(abstand(ohne.erste, ohne.zweite) < 0.5, `ohne Ausweichen ${abstand(ohne.erste, ohne.zweite).toFixed(2)} Felder`);
  const mit = lauf(true);
  const d = abstand(mit.erste, mit.zweite);
  assert.ok(d >= 0.9, `mit Ausweichen ${d.toFixed(2)} Felder auseinander`);
  assert.ok(abstand(mit.erste, mit.ziel) <= 1.5 && abstand(mit.zweite, mit.ziel) <= 1.5, 'und beide am Ziel');
});

test('einheiten AC-29: wer ausweicht, baut weiter', () => {
  const welt = new Welt(ZWEI, 4711);
  const platz = freiesFeld(welt, 3);
  const haus = welt.gebaeudeAnlegen('a', 'haus', platz.x, platz.y, false);
  // Zwei Bauleute auf demselben Feld am Rand der Baustelle.
  const rand = welt.randfeld(haus, { x: platz.x + 5, y: platz.y });
  const bauer = [0, 1].map(() => welt.einheitAnlegen('a', rand.x, rand.y, 'dorfbewohner'));
  for (const e of bauer) welt.nachricht('a', { auftrag: 'befehl', einheiten: [e.id], ziel: { x: haus.x, y: haus.y } });
  takten(welt, 3 * TAKTE_PRO_SEKUNDE);
  assert.ok(abstand(bauer[0], bauer[1]) >= 0.9, `auseinander: ${abstand(bauer[0], bauer[1]).toFixed(2)} Felder`);
  assert.ok(bauer.every((e) => e.baut), 'und beide bauen');
});

test('einheiten AC-29: Sammler, Kaempfer und der Bauer auf der Farm bleiben, der andere weicht', () => {
  const welt = new Welt(ZWEI, 4711);
  const ziel = freiesFeld(welt);
  for (const auftrag of [{ art: 'sammeln', feld: { x: ziel.x + 1, y: ziel.y } }, { art: 'angreifen', ziel: 'nirgends' }, { art: 'farm', gebaeude: 'nirgends' }]) {
    for (const e of [...welt.einheiten.values()]) if (e.besitzer === 'a' && Math.abs(e.x - ziel.x) < 3) welt.einheiten.delete(e.id);
    // Wer arbeitet, hat die hoehere Nummer - er waere sonst der, der weicht.
    const untaetig = welt.einheitAnlegen('a', ziel.x, ziel.y, 'dorfbewohner');
    const arbeitet = welt.einheitAnlegen('a', ziel.x, ziel.y, 'dorfbewohner');
    arbeitet.auftrag = auftrag;
    welt.ausweichen();
    assert.equal(arbeitet.weg.length, 0, `${auftrag.art}: bleibt stehen`);
    assert.equal(untaetig.weg.length, 1, `${auftrag.art}: der Untaetige tritt beiseite`);
  }
});

test('einheiten AC-29: schraeg nur, wenn beide Ecken frei sind', () => {
  // Auf halbem Weg rundet die Lage auf ein gerades Nachbarfeld - war das Wald,
  // stand die Einheit im Hindernis (Gefechtsstand, Startwert 8, Takt 109).
  const welt = new Welt(ZWEI, 4711);
  const g = welt.karte.groesse;
  const ziel = freiesFeld(welt);
  // Alle geraden Nachbarn zu Wald machen: dann bleibt nur schraeg, und schraeg
  // geht nicht.
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) welt.karte.felder[(ziel.y + dy) * g + ziel.x + dx] = karten.WALD;
  const a = welt.einheitAnlegen('a', ziel.x, ziel.y, 'miliz');
  const b = welt.einheitAnlegen('a', ziel.x, ziel.y, 'miliz');
  welt.ausweichen();
  assert.equal(a.weg.length + b.weg.length, 0, 'keiner schneidet eine Waldecke');
  // Gegenprobe: ist eine gerade Seite frei, weicht einer dorthin.
  welt.karte.felder[ziel.y * g + ziel.x + 1] = 0;
  welt.ausweichen();
  assert.deepEqual(b.weg, [{ x: ziel.x + 1, y: ziel.y }], 'mit freier Seite weicht er gerade aus');
});

test('einheiten AC-29: findet der mit der hoeheren Nummer keinen Platz, weicht der andere', () => {
  // Durchsicht der Runde 89: vorher wurde nur der mit der hoeheren Nummer
  // versucht. Ein Bauer an einer voll besetzten Baustelle blieb so auf einem
  // Untaetigen stehen, obwohl der Platz gehabt haette.
  const welt = new Welt(ZWEI, 4711);
  const platz = freiesFeld(welt, 4);
  const haus = welt.gebaeudeAnlegen('a', 'haus', platz.x, platz.y, false);
  const { x0, y0, x1, y1 } = welt.grundflaeche('haus', haus.x, haus.y);
  // Jedes Feld am Rand der Baustelle ist von einem Kaempfer besetzt - die
  // weichen nicht (einheiten AC-31).
  const rand = [];
  for (let y = Math.floor(y0) - 1; y <= Math.ceil(y1); y++) {
    for (let x = Math.floor(x0) - 1; x <= Math.ceil(x1); x++) {
      if (welt.gebaeudeAn(x, y) || !karten.begehbar(welt.karte, x, y)) continue;
      if (welt.abstandZu({ x, y }, haus) <= 1.2) rand.push({ x, y });
    }
  }
  const [hier, ...rest] = rand;
  for (const f of rest) {
    const k = welt.einheitAnlegen('b', f.x, f.y, 'miliz');
    k.auftrag = { art: 'angreifen', ziel: 'nirgends' };
  }
  const untaetig = welt.einheitAnlegen('a', hier.x, hier.y, 'dorfbewohner');
  const bauer = welt.einheitAnlegen('a', hier.x, hier.y, 'dorfbewohner');
  bauer.auftrag = { art: 'bauen', gebaeude: haus.id };
  assert.ok(bauer.id > untaetig.id, 'der Bauer hat die hoehere Nummer');
  welt.ausweichen();
  assert.equal(bauer.weg.length, 0, 'der Bauer findet keinen Platz an der Baustelle');
  assert.equal(untaetig.weg.length, 1, 'also tritt der Untaetige beiseite');
});

test('einheiten AC-29: 800 Angreifer auf drei Feldern kosten unter 1 ms je Durchgang', () => {
  // Durchsicht der Runde 89: in der ersten Fassung 7,6 ms je Durchgang -
  // alle fuenf Takte, also mehr als das Budget eines Taktes (einheiten AC-21).
  // Gemessen nach der Korrektur: 0,09 ms. Die Grenze kommt aus dem Budget,
  // nicht aus der Messung.
  const welt = new Welt(ZWEI, 4711);
  const ziel = freiesFeld(welt);
  for (let i = 0; i < 800; i++) {
    const e = welt.einheitAnlegen('a', ziel.x + (i % 3) - 1, ziel.y, 'miliz');
    e.auftrag = { art: 'angreifen', ziel: 'nirgends' };
  }
  for (let n = 0; n < 50; n++) welt.ausweichen();
  let bestes = Infinity;
  for (let durchgang = 0; durchgang < 5; durchgang++) {
    const t0 = performance.now();
    for (let n = 0; n < 20; n++) welt.ausweichen();
    bestes = Math.min(bestes, (performance.now() - t0) / 20);
  }
  assert.ok(bestes < 1, `${bestes.toFixed(3)} ms je Durchgang`);
});
