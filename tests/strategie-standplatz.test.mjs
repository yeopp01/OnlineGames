// Sammler teilen keinen Platz (→ specs/10-strategie/einheiten-und-befehle.md
// AC-30) - Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md).
//
// Wer am Vorrat oder am Tier arbeitet, steht auf einem von vier Plaetzen
// seines Standfelds, ein halbes Feld vom naechsten. Vorher standen alle auf
// der Mitte des einen Feldes, das dem Lager am naechsten liegt - "zig
// Dorfbewohner komplett ineinander" (Benutzer, 2026-11-12). Die Gegenprobe
// stellt jedes Mal die alte Regel wieder her: ein Feld, seine Mitte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { nachbarfeld } = require('../server/spiele/strategie/wege.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const sekunden = (welt, s) => { for (let i = 0; i < s * TAKTE_PRO_SEKUNDE; i++) welt.takten(); };
const weit = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Die alte Regel: das Nachbarfeld, das dem Sammler am naechsten liegt, und
// dessen Mitte - fuer jeden dasselbe.
function wieFrueher(welt) {
  welt.standplatz = (einheit, ziel) => nachbarfeld(welt.karte, { x: Math.round(ziel.x), y: Math.round(ziel.y) }, einheit);
}

// Ein freies Grasfeld mit freiem Umkreis bei Annas Dorf.
function freiesFeld(welt, r = 3) {
  const a = welt.spielerVon('a');
  for (let d = 7; d < 30; d++) {
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

// Ein Goldvorkommen auf freier Wiese - von allen Seiten zu erreichen.
function goldAuf(welt, feld, menge = 800) {
  const index = feld.y * welt.karte.groesse + feld.x;
  welt.karte.felder[index] = karten.GOLD;
  welt.karte.vorrat.set(index, menge);
  return feld;
}

// Der kleinste Abstand zwischen zweien, die gerade arbeiten - ueber die ganze Zeit.
function engstesPaar(welt, leute, s) {
  let engstes = Infinity;
  let gemeinsam = 0;
  for (let t = 0; t < s * TAKTE_PRO_SEKUNDE; t++) {
    welt.takten();
    const amWerk = leute.filter((e) => e.sammelt && !e.weg.length);
    gemeinsam = Math.max(gemeinsam, amWerk.length);
    for (let i = 0; i < amWerk.length; i++) {
      for (let j = i + 1; j < amWerk.length; j++) engstes = Math.min(engstes, weit(amWerk[i], amWerk[j]));
    }
  }
  return { engstes, gemeinsam };
}

test('einheiten AC-30: zehn Holzfaeller an einem Baum stehen nie naeher als ein halbes Feld - Gegenprobe: frueher standen sie aufeinander', () => {
  const lauf = (frueher) => {
    const welt = new Welt(ZWEI, 4711);
    if (frueher) wieFrueher(welt);
    const a = welt.spielerVon('a');
    const g = welt.karte.groesse;
    let baum = null;
    for (const index of welt.karte.vorrat.keys()) {
      if (welt.karte.felder[index] !== karten.WALD) continue;
      const feld = { x: index % g, y: (index / g) | 0 };
      if (!baum || weit(feld, a.basis) < weit(baum, a.basis)) baum = feld;
    }
    const leute = [];
    for (let i = 0; i < 10; i++) leute.push(welt.einheitAnlegen('a', a.basis.x + 2 + (i % 3), a.basis.y + 3 + ((i / 3) | 0), 'dorfbewohner'));
    // Ein Befehl fuer alle, auf einen Baum - wie ein Rahmen und ein Rechtsklick.
    welt.nachricht('a', { auftrag: 'befehl', einheiten: leute.map((e) => e.id), ziel: baum });
    const holz = a.holz;
    const gemessen = engstesPaar(welt, leute, 240);
    return { ...gemessen, holz: a.holz - holz };
  };
  const frueher = lauf(true);
  assert.ok(frueher.engstes < 0.1, `Gegenprobe: frueher ${frueher.engstes.toFixed(2)} Felder`);
  const jetzt = lauf(false);
  assert.ok(jetzt.gemeinsam >= 8, `${jetzt.gemeinsam} arbeiten zugleich`);
  assert.ok(jetzt.engstes >= 0.5, `das engste Paar steht ${jetzt.engstes.toFixed(2)} Felder auseinander`);
  // Und es kostet nichts: die Plaetze zum Lager hin liegen naeher als die Feldmitte.
  assert.ok(jetzt.holz >= frueher.holz * 0.97, `${jetzt.holz} Holz in vier Minuten, frueher ${frueher.holz}`);
});

test('einheiten AC-30: jeder steht auf einem Viertel seines Standfelds, keine zwei auf demselben', () => {
  const welt = new Welt(ZWEI, 4711);
  const gold = goldAuf(welt, freiesFeld(welt));
  // Alle kommen von derselben Seite: frueher war das fuer jeden dasselbe Feld.
  const leute = [0, 1, 2, 3, 4].map(() => welt.einheitAnlegen('a', gold.x - 3, gold.y, 'dorfbewohner'));
  for (const e of leute) welt.nachricht('a', { auftrag: 'befehl', einheiten: [e.id], ziel: gold });
  sekunden(welt, 8);
  assert.ok(leute.every((e) => e.sammelt), 'alle fuenf arbeiten');
  const plaetze = leute.map((e) => `${e.x}/${e.y}`);
  assert.equal(new Set(plaetze).size, 5, `fuenf verschiedene Plaetze: ${plaetze.join(' ')}`);
  // Jeder nimmt den Platz, der ihm am naechsten liegt - das Feld zur Herkunft
  // hin zuerst, und zwar dessen aeussere Viertel.
  const felder = leute.map((e) => `${Math.round(e.x)}/${Math.round(e.y)}`);
  assert.equal(felder.filter((f) => f === `${gold.x - 1}/${gold.y}`).length >= 2, true, `das Feld zur Herkunft hin ist besetzt: ${felder.join(' ')}`);
  assert.equal(leute[0].x, gold.x - 1.25, 'der erste steht aussen, zur Herkunft hin');
  for (const e of leute) {
    // Ein Viertel: ein Viertelfeld neben der Feldmitte, in beiden Richtungen.
    assert.equal(Math.abs(e.x - Math.round(e.x)), 0.25, `${e.x}`);
    assert.equal(Math.abs(e.y - Math.round(e.y)), 0.25, `${e.y}`);
    assert.ok(weit(e, gold) <= 1.9, 'und jeder reicht an das Gold');
  }
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) assert.ok(weit(leute[i], leute[j]) >= 0.5);
});

test('einheiten AC-30: sind alle Plaetze am Vorrat vergeben, nimmt der Sammler den Vorrat daneben - erst ohne den teilt er einen Platz', () => {
  const aufbau = (zweites) => {
    const welt = new Welt(ZWEI, 4711);
    const g = welt.karte.groesse;
    const mitte = freiesFeld(welt, 4);
    const gold = goldAuf(welt, mitte);
    // Zugemauert bis auf ein Nachbarfeld: Wasser ringsum.
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if ((!dx && !dy) || (dx === -1 && dy === 0)) continue;
        welt.karte.felder[(mitte.y + dy) * g + mitte.x + dx] = karten.WASSER;
      }
    }
    const daneben = zweites ? goldAuf(welt, { x: mitte.x - 1, y: mitte.y + 3 }) : null;
    const leute = [0, 1, 2, 3, 4].map(() => welt.einheitAnlegen('a', mitte.x - 4, mitte.y, 'dorfbewohner'));
    for (const e of leute) welt.nachricht('a', { auftrag: 'befehl', einheiten: [e.id], ziel: gold });
    sekunden(welt, 12);
    return { welt, gold, daneben, leute };
  };
  const mit = aufbau(true);
  assert.ok(mit.leute.every((e) => e.sammelt), 'alle fuenf arbeiten');
  // Vier teilen das eine Feld, das es am ersten Vorrat gibt - auf seinen vier Vierteln.
  const amErsten = mit.leute.filter((e) => Math.round(e.x) === mit.gold.x - 1 && Math.round(e.y) === mit.gold.y);
  assert.equal(new Set(amErsten.map((e) => `${e.x}/${e.y}`)).size, 4, 'vier Plaetze auf einem Feld');
  const amZweiten = mit.leute.filter((e) => e.auftrag.feld.x === mit.daneben.x && e.auftrag.feld.y === mit.daneben.y);
  assert.equal(amZweiten.length, 1, 'der fuenfte arbeitet am Vorrat daneben');
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) assert.ok(weit(mit.leute[i], mit.leute[j]) >= 0.5, 'keiner auf einem anderen');

  // Kein zweiter Vorrat: lieber einen Platz teilen als gar nicht arbeiten.
  const ohne = aufbau(false);
  assert.ok(ohne.leute.every((e) => e.sammelt), 'ohne Ausweg arbeiten trotzdem alle fuenf');
  assert.equal(new Set(ohne.leute.map((e) => `${e.x}/${e.y}`)).size, 4, 'vier Plaetze fuer fuenf');
});

test('einheiten AC-30: am Schaf hat jeder Schlachter seinen Platz neben dem Kadaver', () => {
  const lauf = (frueher) => {
    const welt = new Welt(ZWEI, 7);
    if (frueher) wieFrueher(welt);
    const a = welt.spielerVon('a');
    const schaf = [...welt.tiere.values()].find((t) => t.besitzer === 'a');
    const leute = [0, 1, 2, 3].map(() => welt.einheitAnlegen('a', a.basis.x + 2, a.basis.y + 3, 'dorfbewohner'));
    welt.nachricht('a', { auftrag: 'befehl', einheiten: leute.map((e) => e.id), ziel: { x: schaf.x, y: schaf.y } });
    for (let t = 0; t < 60 * TAKTE_PRO_SEKUNDE && !leute.every((e) => e.sammelt); t++) welt.takten();
    return { leute, schaf };
  };
  const frueher = lauf(true);
  assert.ok(frueher.leute.every((e) => e.sammelt));
  assert.equal(new Set(frueher.leute.map((e) => `${e.x}/${e.y}`)).size, 1, 'Gegenprobe: frueher alle vier auf einem Punkt');
  const { leute, schaf } = lauf(false);
  assert.ok(leute.every((e) => e.sammelt && e.auftrag.art === 'tier'), 'alle vier schlachten');
  for (const e of leute) {
    assert.ok(weit(e, schaf) <= 1.5, `in Reichweite des Schafs: ${weit(e, schaf).toFixed(2)}`);
    assert.ok(weit(e, schaf) >= 0.7, 'und nicht auf dem Kadaver');
  }
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) assert.ok(weit(leute[i], leute[j]) >= 0.5, 'keiner auf einem anderen');
});

test('einheiten AC-30: der Platz haelt ueber das Abladen, und wer den Auftrag verliert, gibt ihn frei', () => {
  const welt = new Welt(ZWEI, 4711);
  const gold = goldAuf(welt, freiesFeld(welt));
  const [erster, zweiter] = [0, 1].map(() => welt.einheitAnlegen('a', gold.x - 3, gold.y, 'dorfbewohner'));
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [erster.id], ziel: gold });
  sekunden(welt, 6);
  const platz = { ...erster.auftrag.stand };
  assert.deepEqual({ x: erster.x, y: erster.y }, platz, 'er steht auf seinem Platz');
  // Unterwegs zum Lager bleibt der Platz seiner: der zweite bekommt einen anderen.
  erster.ladung = 10;
  erster.ladungsart = 'gold';
  sekunden(welt, 2);
  assert.ok(erster.weg.length > 0, 'der erste ist unterwegs zum Lager');
  assert.deepEqual({ ...erster.auftrag.stand }, platz, 'und traegt seinen Platz weiter');
  const andererPlatz = welt.standplatz(zweiter, gold, 1.9);
  assert.notDeepEqual(andererPlatz, platz, 'der zweite bekaeme einen anderen Platz');
  // Ein neuer Befehl nimmt ihm den Auftrag - der Platz ist wieder zu haben.
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [erster.id], ziel: { x: gold.x - 3, y: gold.y - 2 } });
  assert.deepEqual(welt.standplatz(zweiter, gold, 1.9), platz, 'jetzt bekommt ihn der zweite');
});
