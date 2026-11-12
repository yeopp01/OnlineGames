// Die Ladung abgeben (einheiten AC-55, AC-56) und nach dem Bau weiterbauen
// (bauen AC-36) - Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md).
//
// Alle drei kommen aus dem ersten Spiel auf dem Server (2026-11-12): ein
// Dorfbewohner blieb mit acht Beeren stehen, als der Strauch leer war; ein
// Rechtsklick auf das Dorfzentrum lud nichts ab; und wer zwei Haeuser
// nebeneinander setzte, bekam eines gebaut.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const dorfbewohner = (welt, spieler = 'a') => [...welt.einheiten.values()].filter((e) => e.besitzer === spieler && e.art === 'dorfbewohner');
const neueWelt = () => new Welt(ZWEI, 7, { vorrat: 'viel' });
const bis = (welt, bedingung, sekunden, wozu) => {
  for (let i = 0; i < sekunden * TAKTE_PRO_SEKUNDE && !bedingung(); i++) welt.takten();
  assert.ok(bedingung(), wozu);
};

// Das naechste Feld einer Art an der Basis.
function naechstesFeld(welt, art) {
  const basis = welt.spielerVon('a').basis;
  const g = welt.karte.groesse;
  let bestes = null;
  let abstand = Infinity;
  for (const index of welt.karte.vorrat.keys()) {
    if (welt.karte.felder[index] !== art) continue;
    const feld = { x: index % g, y: (index / g) | 0, index };
    const d = Math.hypot(feld.x - basis.x, feld.y - basis.y);
    if (d < abstand) {
      abstand = d;
      bestes = feld;
    }
  }
  return bestes;
}

function freierPlatz(welt, art, abstand, ausser = []) {
  const basis = welt.spielerVon('a').basis;
  for (let r = abstand; r < 40; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const platz = { x: Math.round(basis.x) + dx, y: Math.round(basis.y) + dy };
        if (ausser.some((p) => Math.abs(p.x - platz.x) < 4 && Math.abs(p.y - platz.y) < 4)) continue;
        if (welt.platzPruefen(art, platz.x, platz.y)) return platz;
      }
    }
  }
  throw new Error('kein Platz');
}

test('einheiten AC-55: ist der letzte Strauch leer, bringt der Sammler heim, was er traegt - und steht dann bereit', () => {
  const welt = neueWelt();
  const anna = welt.spielerVon('a');
  const strauch = naechstesFeld(welt, karten.BEERE);
  // Nur dieser eine Strauch traegt noch, und nur drei Beeren.
  for (const index of [...welt.karte.vorrat.keys()]) {
    if (welt.karte.felder[index] === karten.BEERE && index !== strauch.index) welt.karte.vorrat.delete(index);
  }
  welt.karte.vorrat.set(strauch.index, 3);
  const [sammler] = dorfbewohner(welt);
  const vorher = anna.nahrung;
  welt.befehl('a', [sammler.id], { x: strauch.x, y: strauch.y });
  assert.equal(sammler.auftrag.art, 'sammeln');

  // Leer gepflueckt: er geht mit seinen drei Beeren los, statt stehenzubleiben.
  bis(welt, () => sammler.auftrag?.art === 'abgeben', 120, 'er bringt die Ladung heim');
  assert.equal(sammler.ladung, 3, 'mit allem, was der Strauch noch hatte');
  assert.ok(sammler.weg.length > 0, 'und ist unterwegs zum Lager');
  assert.equal(welt.untaetig(sammler), false, 'unterwegs zaehlt er nicht als untaetig');

  bis(welt, () => sammler.ladung === 0, 120, 'er laedt ab');
  assert.equal(anna.nahrung, vorher + 3, 'die drei Beeren sind im Vorrat');
  assert.equal(anna.gesammelt.nahrung, 3, 'und als gesammelt gezaehlt');
  assert.equal(sammler.auftrag, null, 'danach hat er keinen Auftrag mehr');
  assert.equal(welt.untaetig(sammler), true, 'und steht bei den Untaetigen');
});

test('einheiten AC-55: ohne Ladung bleibt er einfach stehen - es gibt nichts heimzubringen', () => {
  const welt = neueWelt();
  const strauch = naechstesFeld(welt, karten.BEERE);
  for (const index of [...welt.karte.vorrat.keys()]) {
    if (welt.karte.felder[index] === karten.BEERE) welt.karte.vorrat.delete(index);
  }
  const [sammler] = dorfbewohner(welt);
  // Er hat zuletzt Beeren gesammelt und schon abgeladen - sonst naehme er den
  // naechsten Vorrat gleich welcher Art (einheiten AC-15).
  sammler.zuletztGesammelt = karten.BEERE;
  welt.befehl('a', [sammler.id], { x: strauch.x, y: strauch.y });
  bis(welt, () => sammler.auftrag === null, 120, 'am leeren Strauch endet der Auftrag');
  assert.equal(sammler.ladung, 0);
});

test('einheiten AC-56: ein Rechtsklick auf das Dorfzentrum laedt ab, danach geht es zurueck an denselben Baum', () => {
  const welt = neueWelt();
  const anna = welt.spielerVon('a');
  const baum = naechstesFeld(welt, karten.WALD);
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === 'dorfzentrum');
  const [holzfaeller] = dorfbewohner(welt);
  welt.befehl('a', [holzfaeller.id], { x: baum.x, y: baum.y });
  bis(welt, () => holzfaeller.ladung >= 4, 200, 'er hat Holz geschlagen');
  const ladung = holzfaeller.ladung;
  const feld = { ...holzfaeller.auftrag.feld };
  const vorher = anna.holz;

  welt.befehl('a', [holzfaeller.id], { x: zentrum.x, y: zentrum.y });
  assert.equal(holzfaeller.auftrag.art, 'abgeben', 'der Befehl ist ein Abladen, kein Gang');
  assert.equal(holzfaeller.auftrag.gebaeude, zentrum.id, 'an genau diesem Gebaeude');
  assert.equal(holzfaeller.ladung, ladung, 'die Ladung bleibt dabei erhalten');

  bis(welt, () => holzfaeller.ladung === 0, 200, 'er laedt ab');
  assert.equal(anna.holz, vorher + ladung, 'das Holz ist im Vorrat');
  assert.equal(holzfaeller.auftrag?.art, 'sammeln', 'und er arbeitet weiter');
  assert.deepEqual(holzfaeller.auftrag.feld, feld, 'am selben Baum');
  bis(welt, () => holzfaeller.sammelt, 200, 'er schlaegt wieder');
});

test('einheiten AC-56: abgeladen wird am gewaehlten Lager, nicht am naechsten', () => {
  const welt = neueWelt();
  const anna = welt.spielerVon('a');
  const baum = naechstesFeld(welt, karten.WALD);
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === 'dorfzentrum');
  const [holzfaeller] = dorfbewohner(welt);
  welt.befehl('a', [holzfaeller.id], { x: baum.x, y: baum.y });
  bis(welt, () => holzfaeller.ladung >= 4, 200, 'er hat Holz geschlagen');
  // Ein Holzfaellerlager gleich neben ihm - naeher als das Dorfzentrum.
  const platz = freierPlatz(welt, 'holzfaellerlager', 2);
  const lager = welt.gebaeudeAnlegen('a', 'holzfaellerlager', platz.x, platz.y, true);
  holzfaeller.x = platz.x - 2;
  holzfaeller.y = platz.y;
  assert.ok(welt.abstandZu(holzfaeller, lager) < welt.abstandZu(holzfaeller, zentrum), 'das Lager ist naeher');
  const vorher = anna.holz;
  const ladung = holzfaeller.ladung;
  welt.befehl('a', [holzfaeller.id], { x: zentrum.x, y: zentrum.y });
  let amZentrum = false;
  for (let i = 0; i < 300 * TAKTE_PRO_SEKUNDE && holzfaeller.ladung > 0; i++) {
    welt.takten();
    if (holzfaeller.ladung === 0) amZentrum = welt.abstandZu(holzfaeller, zentrum) <= 1.2;
  }
  assert.equal(anna.holz, vorher + ladung);
  assert.ok(amZentrum, 'er stand dabei am Dorfzentrum');
});

test('einheiten AC-56: nimmt das Gebaeude die Ladung nicht an oder traegt er nichts, bleibt es ein Gang', () => {
  const welt = neueWelt();
  const baum = naechstesFeld(welt, karten.WALD);
  const [holzfaeller, leer] = dorfbewohner(welt);
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === 'dorfzentrum');
  welt.befehl('a', [holzfaeller.id], { x: baum.x, y: baum.y });
  bis(welt, () => holzfaeller.ladung >= 2, 200, 'er hat Holz geschlagen');
  // Eine Muehle nimmt nur Nahrung.
  assert.deepEqual(GEBAEUDE.muehle.annahme, ['nahrung']);
  const platz = freierPlatz(welt, 'muehle', 5);
  const muehle = welt.gebaeudeAnlegen('a', 'muehle', platz.x, platz.y, true);
  welt.befehl('a', [holzfaeller.id], { x: muehle.x, y: muehle.y });
  assert.equal(holzfaeller.auftrag.art, 'gehen', 'Holz an der Muehle: ein Gang');
  welt.befehl('a', [leer.id], { x: zentrum.x, y: zentrum.y });
  assert.equal(leer.auftrag.art, 'gehen', 'ohne Ladung: ein Gang');
});

test('einheiten AC-56: von der Farm zum Abladen geschickt, bestellt er danach dieselbe Farm weiter', () => {
  const welt = neueWelt();
  const platz = freierPlatz(welt, 'farm', 6);
  const farm = welt.gebaeudeAnlegen('a', 'farm', platz.x, platz.y, true);
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a' && g.art === 'dorfzentrum');
  const [bauer] = dorfbewohner(welt);
  welt.befehl('a', [bauer.id], { x: farm.x, y: farm.y });
  bis(welt, () => bauer.ladung >= 3, 300, 'er hat geerntet');
  welt.befehl('a', [bauer.id], { x: zentrum.x, y: zentrum.y });
  assert.equal(bauer.auftrag.art, 'abgeben');
  bis(welt, () => bauer.ladung === 0, 300, 'er laedt ab');
  assert.equal(bauer.auftrag?.art, 'farm', 'der Auftrag ist wieder die Farm');
  assert.equal(farm.arbeiter, bauer.id, 'und sie gehoert wieder ihm');
  bis(welt, () => bauer.sammelt, 300, 'er bestellt sie weiter');
});

test('bauen AC-36: zwei Haeuser nebeneinander gesetzt - nach dem einen baut er von selbst das andere', () => {
  const welt = neueWelt();
  welt.spielerVon('a').holz = 1000;
  const [bauer] = dorfbewohner(welt);
  const erster = freierPlatz(welt, 'haus', 5);
  const a = welt.bauen('a', [bauer.id], 'haus', erster);
  assert.ok(a.gebaeude, a.fehler);
  const zweiter = { x: erster.x + 3, y: erster.y };
  assert.ok(welt.platzPruefen('haus', zweiter.x, zweiter.y), 'daneben ist Platz');
  // Ohne Umschalt: der zweite Auftrag loest den ersten ab, wie bisher.
  const b = welt.bauen('a', [bauer.id], 'haus', zweiter);
  assert.ok(b.gebaeude, b.fehler);
  assert.equal(bauer.auftrag.gebaeude, b.gebaeude, 'er geht zum zuletzt gesetzten');
  assert.equal(bauer.auftrag.folge, undefined, 'eine Reihe hat er nicht');

  const haeuser = [welt.gebaeude.get(a.gebaeude), welt.gebaeude.get(b.gebaeude)];
  bis(welt, () => haeuser[1].fertig, GEBAEUDE.haus.bauzeit + 60, 'das zweite Haus steht');
  assert.equal(bauer.auftrag?.art, 'bauen', 'er baut weiter');
  assert.equal(bauer.auftrag.gebaeude, a.gebaeude, 'am ersten, das noch Baustelle ist');
  bis(welt, () => haeuser[0].fertig, GEBAEUDE.haus.bauzeit + 60, 'auch das erste Haus steht - ohne einen weiteren Befehl');
  assert.equal(bauer.auftrag, null, 'danach steht er bereit');
});

test('bauen AC-36: eine Baustelle weit weg holt ihn nicht - nach dem Haus steht er bereit', () => {
  const welt = neueWelt();
  welt.spielerVon('a').holz = 1000;
  const [bauer, anderer] = dorfbewohner(welt);
  const nah = freierPlatz(welt, 'haus', 5);
  const fern = freierPlatz(welt, 'haus', 22, [nah]);
  const weit = welt.bauen('a', [anderer.id], 'haus', fern);
  assert.ok(weit.gebaeude, weit.fehler);
  // Der andere geht gleich wieder weg: die ferne Baustelle bleibt liegen.
  welt.befehl('a', [anderer.id], { x: Math.round(anderer.x), y: Math.round(anderer.y) });
  const hier = welt.bauen('a', [bauer.id], 'haus', nah);
  assert.ok(hier.gebaeude, hier.fehler);
  const haus = welt.gebaeude.get(hier.gebaeude);
  bis(welt, () => haus.fertig, GEBAEUDE.haus.bauzeit + 60, 'das Haus steht');
  assert.ok(Math.hypot(fern.x - bauer.x, fern.y - bauer.y) > 8, 'die andere Baustelle liegt weiter als acht Felder');
  assert.equal(bauer.auftrag, null, 'er geht nicht hin');
  assert.equal(welt.gebaeude.get(weit.gebaeude).fertig, false);
});

test('bauen AC-36: nach einem Lager geht das Sammeln vor - die Baustelle daneben wartet', () => {
  const welt = neueWelt();
  welt.spielerVon('a').holz = 1000;
  const [bauer, anderer] = dorfbewohner(welt);
  const baum = naechstesFeld(welt, karten.WALD);
  // Ein Lager am Wald und ein Haus in der Naehe.
  let platz = null;
  for (let r = 2; r < 8 && !platz; r++) {
    for (let dy = -r; dy <= r && !platz; dy++) {
      for (let dx = -r; dx <= r && !platz; dx++) {
        if (welt.platzPruefen('holzfaellerlager', baum.x + dx, baum.y + dy)) platz = { x: baum.x + dx, y: baum.y + dy };
      }
    }
  }
  assert.ok(platz, 'Platz fuer ein Lager am Wald');
  const lager = welt.bauen('a', [bauer.id], 'holzfaellerlager', platz);
  assert.ok(lager.gebaeude, lager.fehler);
  let hausPlatz = null;
  for (let r = 3; r < 7 && !hausPlatz; r++) {
    for (let dy = -r; dy <= r && !hausPlatz; dy++) {
      for (let dx = -r; dx <= r && !hausPlatz; dx++) {
        if (welt.platzPruefen('haus', platz.x + dx, platz.y + dy)) hausPlatz = { x: platz.x + dx, y: platz.y + dy };
      }
    }
  }
  assert.ok(hausPlatz, 'Platz fuer ein Haus daneben');
  const haus = welt.bauen('a', [anderer.id], 'haus', hausPlatz);
  assert.ok(haus.gebaeude, haus.fehler);
  welt.befehl('a', [anderer.id], { x: Math.round(anderer.x), y: Math.round(anderer.y) });
  bis(welt, () => welt.gebaeude.get(lager.gebaeude).fertig, GEBAEUDE.holzfaellerlager.bauzeit + 90, 'das Lager steht');
  assert.equal(bauer.auftrag?.art, 'sammeln', 'er schlaegt Holz (bauen AC-1), statt zur Baustelle zu gehen');
});
