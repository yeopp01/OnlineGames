// Eine grosse Partie bleibt fluessig (fahrplan AC-20) - Rechenteile, direkt
// geprueft (→ docs/adr/0004-teststrategie.md). Dass der Server die Zustaende
// wirklich gepackt schickt, prueft tests/netz.test.mjs ueber den echten Weg.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { deflateRawSync } from 'node:zlib';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');

// Die Heere mischen alle Linien des Lehens und des Fuerstentums: Nahkampf,
// Fernkampf, Reiter - damit Wache, Verfolgung und Pfeile rechnen.
const HEER = ['speerkaempfer', 'bogenschuetze', 'ritter', 'miliz', 'plaenkler', 'armbrustschuetze'];

// `anzahl` Einheiten ringweise um `um`, nur auf freien, begehbaren Feldern.
function aufstellen(welt, spielerId, um, anzahl, artFuer) {
  const g = welt.karte.groesse;
  const belegt = new Set([...welt.einheiten.values()].map((e) => Math.round(e.y) * g + Math.round(e.x)));
  const ids = [];
  for (let r = 0; ids.length < anzahl && r < 30; r++) {
    for (let dy = -r; dy <= r && ids.length < anzahl; dy++) {
      for (let dx = -r; dx <= r && ids.length < anzahl; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = um.x + dx;
        const y = um.y + dy;
        if (belegt.has(y * g + x) || !karten.begehbar(welt.karte, x, y)) continue;
        belegt.add(y * g + x);
        ids.push(welt.einheitAnlegen(spielerId, x, y, artFuer(ids.length)).id);
      }
    }
  }
  return ids;
}

// Acht Spieler auf der groessten Karte im Nebel, je 200 Einheiten: 80
// Dorfbewohner an Holz, Gold und Stein, ein Heer von 60 vor der Kartenmitte im
// Angriffslauf hinein - dort treffen sich alle acht -, und ein zweites von 60
// auf halbem Weg zum Nachbarn, im Angriffslauf auf dessen Dorf.
function grossePartie() {
  const spieler = Array.from({ length: 8 }, (_, i) => ({ id: `s${i}`, name: `S${i}` }));
  const welt = new Welt(spieler, 4711, { kartengroesse: 'gross', sicht: 'nebel' });
  const g = welt.karte.groesse;
  const mitte = { x: Math.round(g / 2), y: Math.round(g / 2) };
  welt.spieler.forEach((s, n) => {
    const basis = { x: s.basis.x, y: s.basis.y };
    const schon = [...welt.einheiten.values()].filter((e) => e.besitzer === s.id).length;
    aufstellen(welt, s.id, { x: basis.x, y: basis.y + 4 }, 80 - schon, () => 'dorfbewohner');
    const leute = [...welt.einheiten.values()].filter((e) => e.besitzer === s.id);
    leute.forEach((e, i) => {
      const art = [karten.WALD, karten.GOLD, karten.STEIN][i % 3];
      const vorrat = welt.naechsterVorrat(basis, art) || welt.naechsterVorrat(basis, karten.BEERE);
      if (vorrat) welt.befehl(s.id, [e.id], vorrat);
    });
    const winkel = Math.atan2(basis.y - mitte.y, basis.x - mitte.x);
    const vorn = { x: Math.round(mitte.x + Math.cos(winkel) * 16), y: Math.round(mitte.y + Math.sin(winkel) * 16) };
    welt.befehl(s.id, aufstellen(welt, s.id, vorn, 60, (i) => HEER[i % HEER.length]), mitte, true);
    const nachbar = welt.spieler[(n + 1) % welt.spieler.length].basis;
    const halb = { x: Math.round((basis.x * 2 + nachbar.x) / 3), y: Math.round((basis.y * 2 + nachbar.y) / 3) };
    welt.befehl(s.id, aufstellen(welt, s.id, halb, 60, (i) => HEER[(i + 3) % HEER.length]), { x: nachbar.x, y: nachbar.y + 5 }, true);
  });
  return welt;
}

test('fahrplan AC-20: acht Spieler mit je 200 Einheiten im Nebel - ein Takt unter 30 ms, je Spieler unter 50 KB je Sekunde', () => {
  const welt = grossePartie();
  const ids = welt.spieler.map((s) => s.id);
  for (const id of ids) {
    const eigene = [...welt.einheiten.values()].filter((e) => e.besitzer === id).length;
    assert.equal(eigene, 200, `${id} hat ${eigene} Einheiten`);
  }
  assert.equal(welt.sichtArt, 'nebel');
  // Der Aufbau geht einmal hinaus wie beim Start; danach nur Zustaende.
  for (const id of ids) welt.aufbauFuer(id);

  // Ein Takt ist, was der Raum je Schlag tut: die Welt takten, jedem Spieler
  // seinen Auszug rechnen, als JSON schreiben und packen - wie `ws` mit
  // permessage-deflate (server/index.js). Gepackt wird hier jeder Zustand fuer
  // sich; der Server packt mit dem vorigen als Woerterbuch und kommt damit
  // kleiner an (gemessen rund 10 statt 26 KB je Sekunde) - die Zahl hier ist
  // die obere Grenze.
  //
  // Gemessen 2026-11-22 (F13): im schnellsten Abschnitt 5,5 bis 5,8 ms je
  // Takt (takten 1,5, Auszuege 2,8, packen 1,7); je Spieler als JSON 160 bis
  // 182 KB je Sekunde, gepackt hoechstens 30,5. Ungepackt riss die Grenze
  // mehr als dreifach. Bei "Aufgedeckt" bekommt jeder alle 1600 Einheiten:
  // rund 1000 KB je Sekunde, gepackt 147 - diese Grenze gilt im Nebel.
  //
  // Die Zeit: der schnellste von drei Abschnitten zu je 100 Takten - fremde
  // Last soll nicht zaehlen. Die Bytes haengen an keiner Uhr: dort zaehlt der
  // groesste Wert, ueber jeden Abschnitt und jeden Spieler.
  const ABSCHNITT = 100;
  let schnellster = Infinity;
  let meisteBytes = 0;
  let ungepackt = 0;
  let lage = null;
  for (let abschnitt = 0; abschnitt < 3; abschnitt++) {
    const gepackt = new Map(ids.map((id) => [id, 0]));
    let zeit = 0n;
    for (let t = 0; t < ABSCHNITT; t++) {
      const beginn = process.hrtime.bigint();
      welt.takten();
      const texte = [...welt.zustandJeSpieler(ids)].map(([id, zustand]) => [id, JSON.stringify(zustand)]);
      const groessen = texte.map(([id, text]) => [id, deflateRawSync(text).length, Buffer.byteLength(text)]);
      zeit += process.hrtime.bigint() - beginn;
      for (const [id, klein, gross] of groessen) {
        gepackt.set(id, gepackt.get(id) + klein);
        ungepackt = Math.max(ungepackt, gross);
      }
    }
    schnellster = Math.min(schnellster, Number(zeit) / 1e6 / ABSCHNITT);
    const sekunden = ABSCHNITT / TAKTE_PRO_SEKUNDE;
    meisteBytes = Math.max(meisteBytes, ...[...gepackt.values()].map((b) => b / sekunden));
    if (abschnitt === 0) {
      const lebend = [...welt.einheiten.values()].filter((e) => !e.tot);
      lage = {
        kaempfen: lebend.filter((e) => e.auftrag?.art === 'angreifen').length,
        sammeln: lebend.filter((e) => e.sammelt).length,
        laufen: lebend.filter((e) => e.weg.length).length,
      };
    }
  }
  assert.ok(schnellster < 30, `im Mittel ${schnellster.toFixed(2)} ms je Takt`);
  assert.ok(meisteBytes < 50 * 1024, `${(meisteBytes / 1024).toFixed(1)} KB je Sekunde und Spieler`);
  // Und die Lage ist eine Partie, kein Standbild: nach zehn Sekunden kaempfen,
  // sammeln und laufen jeweils Hunderte - sonst waere alles billig, weil
  // nichts geschieht. Und die Zustaende sind gross genug, dass Packen zaehlt.
  assert.ok(lage.kaempfen > 200, `${lage.kaempfen} kaempfen`);
  assert.ok(lage.sammeln > 100, `${lage.sammeln} sammeln`);
  assert.ok(lage.laufen > 500, `${lage.laufen} laufen`);
  assert.ok(ungepackt > 10 * 1024, `groesster Zustand ${ungepackt} Byte`);
});
