// Tempo mit vielen Einheiten (fahrplan AC-6) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt } = require('../server/spiele/strategie/welt.js');

// Acht Spieler auf der groessten Karte, je 100 Dorfbewohner bei der Arbeit:
// ein Drittel ins Holz, ein Drittel quer ueber die Karte, ein Drittel an Gold
// oder Beeren - so, wie eine volle Partie rechnet.
function volleKarte() {
  const spieler = Array.from({ length: 8 }, (_, i) => ({ id: `s${i}`, name: `S${i}` }));
  const welt = new Welt(spieler, 4711, { kartengroesse: 'gross' });
  const g = welt.karte.groesse;
  for (const s of welt.spieler) {
    let zahl = [...welt.einheiten.values()].filter((e) => e.besitzer === s.id).length;
    for (let r = 3; zahl < 100 && r < 20; r++) {
      for (let dy = -r; dy <= r && zahl < 100; dy++) {
        for (let dx = -r; dx <= r && zahl < 100; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (!karten.begehbar(welt.karte, s.basis.x + dx, s.basis.y + dy)) continue;
          welt.einheitAnlegen(s.id, s.basis.x + dx, s.basis.y + dy, 'dorfbewohner');
          zahl += 1;
        }
      }
    }
    const leute = [...welt.einheiten.values()].filter((e) => e.besitzer === s.id);
    leute.forEach((e, i) => {
      const basis = { x: s.basis.x, y: s.basis.y };
      if (i % 3 === 0) welt.befehl(s.id, [e.id], welt.naechsterVorrat(basis, karten.WALD) || basis);
      else if (i % 3 === 1) welt.befehl(s.id, [e.id], { x: (s.basis.x + 40 + i) % g, y: (s.basis.y + 30) % g });
      else {
        const f = welt.naechsterVorrat(basis, karten.GOLD) || welt.naechsterVorrat(basis, karten.BEERE);
        if (f) welt.befehl(s.id, [e.id], f);
      }
    });
  }
  return welt;
}

test('fahrplan AC-6: acht Spieler mit je 100 Einheiten - ein Takt rechnet im Mittel unter 10 ms', () => {
  const welt = volleKarte();
  assert.ok(welt.einheiten.size >= 800, `${welt.einheiten.size} Einheiten`);
  // Gemessen Runde 51: vorher 58 ms je Takt (gescheiterte Wegsuchen in jedem
  // Takt), nachher rund 0,5 ms. Eine Minute Spielzeit, der schnellste von drei
  // Abschnitten zu je 200 Takten - fremde Last soll nicht zaehlen.
  let schnellster = Infinity;
  for (let abschnitt = 0; abschnitt < 3; abschnitt++) {
    const beginn = process.hrtime.bigint();
    for (let t = 0; t < 200; t++) welt.takten();
    schnellster = Math.min(schnellster, Number(process.hrtime.bigint() - beginn) / 1e6 / 200);
  }
  assert.ok(schnellster < 10, `im Mittel ${schnellster.toFixed(2)} ms je Takt`);
  // Und die Einheiten arbeiten wirklich - sonst waere der Takt billig, weil nichts passiert.
  const arbeiten = [...welt.einheiten.values()].filter((e) => e.sammelt || e.weg.length).length;
  assert.ok(arbeiten > 400, `${arbeiten} arbeiten oder laufen`);
});

test('einheiten AC-9: ein unerreichbarer Vorrat wird nicht in jedem Takt neu gesucht - Ersatz oder Stehenbleiben', () => {
  const welt = new Welt([{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }], 7);
  const g = welt.karte.groesse;
  const basis = welt.spielerVon('a').basis;
  const [sammler] = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  // Ein Baum auf freiem Feld, rundum Wasser in zwei Ringen - erreichbar ist er nicht.
  let mitte = null;
  for (let y = 5; y < g - 5 && !mitte; y++) {
    for (let x = 5; x < g - 5 && !mitte; x++) {
      if (Math.hypot(x - basis.x, y - basis.y) < 10) continue;
      let frei = true;
      for (let dy = -3; dy <= 3 && frei; dy++) for (let dx = -3; dx <= 3; dx++) if (!karten.begehbar(welt.karte, x + dx, y + dy)) { frei = false; break; }
      if (frei) mitte = { x, y };
    }
  }
  assert.ok(mitte);
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) welt.karte.felder[(mitte.y + dy) * g + mitte.x + dx] = karten.WASSER;
  }
  const index = mitte.y * g + mitte.x;
  welt.karte.felder[index] = karten.WALD;
  welt.karte.vorrat.set(index, 100);

  welt.befehl('a', [sammler.id], mitte);
  for (let t = 0; t < 30; t++) welt.takten();
  // Nach wenigen Takten: aufgegeben oder an einem anderen Vorrat - nie weiter am unerreichbaren.
  const ziel = sammler.auftrag?.feld;
  assert.ok(!ziel || ziel.x !== mitte.x || ziel.y !== mitte.y, `sucht nicht mehr den unerreichbaren Baum: ${JSON.stringify(sammler.auftrag)}`);
  // Und kostet dabei nichts: 300 weitere Takte bleiben billig.
  const beginn = process.hrtime.bigint();
  for (let t = 0; t < 300; t++) welt.takten();
  const jeTakt = Number(process.hrtime.bigint() - beginn) / 1e6 / 300;
  assert.ok(jeTakt < 2, `${jeTakt.toFixed(2)} ms je Takt`);
});

// Acht Heere auf einem Haufen: die schlimmste Lage fuer die Wache (kampf
// AC-2). Jede stehende Kampfeinheit sieht sich zweimal je Sekunde um, und hier
// hat jede hunderte Nachbarn in Sichtweite - dichter wird es in einer Partie
// nicht.
function einHaufen() {
  const spieler = Array.from({ length: 8 }, (_, i) => ({ id: `s${i}`, name: `S${i}` }));
  const welt = new Welt(spieler, 4711, { kartengroesse: 'gross' });
  const mitte = welt.spieler[0].basis;
  for (const s of welt.spieler) {
    let zahl = 0;
    for (let r = 0; zahl < 100 && r < 30; r++) {
      for (let dy = -r; dy <= r && zahl < 100; dy++) {
        for (let dx = -r; dx <= r && zahl < 100; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          if (!karten.begehbar(welt.karte, mitte.x + dx, mitte.y + dy)) continue;
          welt.einheitAnlegen(s.id, mitte.x + dx, mitte.y + dy, 'miliz');
          zahl += 1;
        }
      }
    }
  }
  return welt;
}

test('fahrplan AC-6: acht Heere mit je 100 Milizen im Kampf - ein Takt bleibt unter 10 ms', () => {
  const welt = einHaufen();
  assert.ok(welt.einheiten.size >= 800, `${welt.einheiten.size} Einheiten`);
  // Gemessen Runde 64: 0,53 ms je Takt im teuersten Abschnitt (zum Vergleich:
  // 0,11 ms, wenn dieselben 800 Milizen bei ihren eigenen Basen stehen und
  // niemand einen Feind sieht). Gemessen wird der **teuerste** Abschnitt, nicht
  // der schnellste: hier soll die Spitze unter der Grenze liegen.
  let teuerster = 0;
  for (let abschnitt = 0; abschnitt < 3; abschnitt++) {
    const beginn = process.hrtime.bigint();
    for (let t = 0; t < 100; t++) welt.takten();
    teuerster = Math.max(teuerster, Number(process.hrtime.bigint() - beginn) / 1e6 / 100);
  }
  assert.ok(teuerster < 10, `teuerster Abschnitt ${teuerster.toFixed(2)} ms je Takt`);
  // Und es wurde wirklich gekaempft - sonst waere der Takt billig, weil nichts
  // passiert: von 832 Milizen leben nach 300 Takten weniger als die Haelfte.
  const lebend = [...welt.einheiten.values()].filter((e) => !e.tot).length;
  assert.ok(lebend < 500, `${lebend} leben noch`);
});
