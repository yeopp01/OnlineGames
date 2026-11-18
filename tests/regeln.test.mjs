// Reine Rechenteile - Kartenerzeugung, Wegfindung, Sammelschleife. Die haben
// keine Naht zum Browser und duerfen deshalb direkt geprueft werden
// (→ docs/adr/0004-teststrategie.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { suchen } = require('../server/spiele/strategie/wege.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, SAMMELN, GEBAEUDE } = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

test('karte AC-1: gleicher Startwert ergibt dieselbe Karte', () => {
  const eine = karten.erzeugen(4711, 4);
  const andere = karten.erzeugen(4711, 4);
  assert.deepEqual([...eine.felder], [...andere.felder]);
  assert.deepEqual(eine.basen, andere.basen);

  const dritte = karten.erzeugen(4712, 4);
  assert.notDeepEqual([...eine.felder], [...dritte.felder]);
});

test('karte AC-11: die Karte waechst mit der Zahl der Spieler und der Einstellung', () => {
  assert.equal(karten.erzeugen(7, 2).groesse, 120);
  assert.equal(karten.erzeugen(7, 8).groesse, 200);
  const groessen = [2, 3, 4, 5, 6, 7, 8].map((n) => karten.erzeugen(7, n).groesse);
  for (let i = 1; i < groessen.length; i++) assert.ok(groessen[i] > groessen[i - 1], `waechst: ${groessen}`);
  assert.ok(karten.erzeugen(7, 2, { kartengroesse: 'klein' }).groesse < 120);
  assert.ok(karten.erzeugen(7, 2, { kartengroesse: 'gross' }).groesse > 120);
  // Nie ueber 200, auch gross mit acht Spielern nicht.
  assert.equal(karten.erzeugen(7, 8, { kartengroesse: 'gross' }).groesse, 200);
  const karte = karten.erzeugen(7, 4);
  assert.equal(karte.felder.length, karte.groesse * karte.groesse);
});

test('karte AC-13: Vorraete sind einzelne Dinge mit den Mengen der Vorlage', () => {
  const karte = karten.erzeugen(7, 2);
  const erwartet = { [karten.WALD]: 100, [karten.BEERE]: 125, [karten.GOLD]: 800, [karten.STEIN]: 350 };
  const arten = new Set();
  for (let i = 0; i < karte.felder.length; i++) {
    const art = karte.felder[i];
    assert.ok(art <= karten.STEIN, `unbekannte Feldart ${art}`);
    if (art in erwartet) {
      arten.add(art);
      assert.equal(karte.vorrat.get(i), erwartet[art], `Feld ${i}`);
    } else {
      assert.equal(karte.vorrat.has(i), false, 'Gras und Wasser tragen nichts');
    }
    // Ein Vorrat belegt sein Feld: begehbar ist nur Gras.
    assert.equal(karten.begehbar(karte, i % karte.groesse, (i / karte.groesse) | 0), art === karten.GRAS);
  }
  assert.deepEqual([...arten].sort(), [karten.WALD, karten.BEERE, karten.GOLD, karten.STEIN].sort());
});

test('karte AC-4: alle Basen haben denselben Abstand zur Mitte', () => {
  for (const anzahl of [2, 3, 4, 5, 6]) {
    const karte = karten.erzeugen(99, anzahl);
    assert.equal(karte.basen.length, anzahl);
    const mitte = karte.groesse / 2;
    const abstaende = karte.basen.map((b) => Math.hypot(b.x - mitte, b.y - mitte));
    const kleinster = Math.min(...abstaende);
    const groesster = Math.max(...abstaende);
    assert.ok(groesster - kleinster < 1.5, `Abstaende ${kleinster} bis ${groesster}`);
  }
});

test('karte AC-5: um jede Basis sind zwei Felder frei', () => {
  const karte = karten.erzeugen(31, 6);
  for (const basis of karte.basen) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        if (Math.hypot(dx, dy) > 2) continue;
        assert.ok(
          karten.begehbar(karte, basis.x + dx, basis.y + dy),
          `Basis ${basis.x}/${basis.y} ist bei ${dx}/${dy} verbaut`,
        );
      }
    }
  }
});

test('karte AC-6: jede Basis hat Holz und Nahrung in Reichweite', () => {
  for (const startwert of [1, 2, 3, 42, 4711]) {
    const karte = karten.erzeugen(startwert, 5);
    for (const basis of karte.basen) {
      let holz = 0;
      let nahrung = 0;
      for (const index of karte.vorrat.keys()) {
        const x = index % karte.groesse;
        const y = (index / karte.groesse) | 0;
        if (Math.hypot(x - basis.x, y - basis.y) > 10) continue;
        if (karte.felder[index] === karten.WALD) holz++;
        if (karte.felder[index] === karten.BEERE) nahrung++;
      }
      assert.ok(holz > 0, `Basis ${basis.x}/${basis.y} ohne Wald in Reichweite`);
      assert.ok(nahrung > 0, `Basis ${basis.x}/${basis.y} ohne Beeren in Reichweite`);
    }
  }
});

test('karte AC-14: jede Basis ist gleich ausgestattet, nur gedreht', () => {
  // Gezaehlt wird im Umkreis von 16 Feldern: so weit ist vorher freigeraeumt,
  // Zufallswald steht dort nicht.
  const zaehlen = (karte, basis) => {
    const anzahl = { beeren: 0, gold: 0, stein: 0, baeume: 0 };
    const abstaende = { beeren: [], gold: [], stein: [] };
    for (const index of karte.vorrat.keys()) {
      const x = index % karte.groesse;
      const y = (index / karte.groesse) | 0;
      const abstand = Math.hypot(x - basis.x, y - basis.y);
      if (abstand > 16) continue;
      const art = karte.felder[index];
      if (art === karten.WALD) anzahl.baeume++;
      if (art === karten.BEERE) { anzahl.beeren++; abstaende.beeren.push(abstand); }
      if (art === karten.GOLD) { anzahl.gold++; abstaende.gold.push(abstand); }
      if (art === karten.STEIN) { anzahl.stein++; abstaende.stein.push(abstand); }
    }
    return { anzahl, abstaende };
  };
  const mittel = (liste) => liste.reduce((a, b) => a + b, 0) / liste.length;

  for (const [startwert, spieler] of [[1, 2], [42, 3], [4711, 5], [99, 8]]) {
    const karte = karten.erzeugen(startwert, spieler);
    const alle = karte.basen.map((b) => zaehlen(karte, b));
    for (const { anzahl, abstaende } of alle) {
      assert.deepEqual(
        { beeren: anzahl.beeren, gold: anzahl.gold, stein: anzahl.stein },
        { beeren: 6, gold: 7, stein: 5 },
        `Startwert ${startwert}, ${spieler} Spieler`,
      );
      assert.ok(anzahl.baeume >= 2 * 29, `zwei volle Waeldchen, gefunden ${anzahl.baeume} Baeume`);
      for (const art of ['beeren', 'gold', 'stein']) {
        assert.ok(Math.min(...abstaende[art]) >= 5 && Math.max(...abstaende[art]) <= 13, `${art} in 5 bis 12 Feldern`);
        // Gleicher Abstand fuer alle: die Mittel weichen hoechstens um ein Feld ab.
        const mittelwerte = alle.map((a) => mittel(a.abstaende[art]));
        assert.ok(Math.max(...mittelwerte) - Math.min(...mittelwerte) <= 1, `${art}: ${mittelwerte}`);
      }
    }
  }
});

test('karte AC-12: vier Rohstoffe mit Startvorrat nach Einstellung', () => {
  const wenig = new Welt(ZWEI, 7);
  for (const s of wenig.spieler) assert.deepEqual([s.holz, s.nahrung, s.gold, s.stein], [200, 200, 100, 200]);
  const viel = new Welt(ZWEI, 7, { vorrat: 'viel' });
  for (const s of viel.spieler) assert.deepEqual([s.holz, s.nahrung, s.gold, s.stein], [1000, 1000, 1000, 1000]);
  const mittel = new Welt(ZWEI, 7, { vorrat: 'mittel' });
  const gesendet = mittel.zustand().spieler[0];
  for (const rohstoff of ['holz', 'nahrung', 'gold', 'stein']) assert.equal(gesendet[rohstoff], 500);
  assert.equal(mittel.zustand().spieler[0].stein, 500);
});

test('karte AC-9: ein erschoepftes Feld wird Gras und wird gemeldet', () => {
  const welt = new Welt(ZWEI, 7);
  const g = welt.karte.groesse;
  // Ein Baum am Waldrand: rechts von ihm ist Gras, auf dem der Holzfaeller
  // steht. (Vorher der erste Baum der Karte, mitten im Wald - der Sammler
  // stand dort selbst in einem Baum; seit einheiten AC-30 braucht er einen
  // Platz auf begehbarem Boden.)
  const index = [...welt.karte.vorrat.keys()].find((i) => welt.karte.felder[i] === karten.WALD
    && karten.begehbar(welt.karte, (i % g) + 1, (i / g) | 0));
  const feld = { x: index % g, y: (index / g) | 0 };
  welt.karte.vorrat.set(index, 5); // fast leer

  const einheit = [...welt.einheiten.values()][0];
  einheit.x = feld.x + 1;
  einheit.y = feld.y;
  einheit.auftrag = { art: 'sammeln', feld };
  einheit.weg = [];
  welt.feldAenderungen = [];

  // Fuenf Einheiten Holz bei der Rate aus den Daten, zwei Takte Spiel - und
  // vorher der Schritt von der Feldmitte auf seinen Platz (einheiten AC-30).
  const takte = Math.ceil(5 / (SAMMELN[karten.WALD].rate / TAKTE_PRO_SEKUNDE)) + 2 + 10;
  welt.sammelnBeginnen(einheit);
  for (let i = 0; i < takte; i++) welt.einheitTakten(einheit);

  assert.equal(welt.karte.felder[index], karten.GRAS);
  assert.equal(welt.karte.vorrat.has(index), false);
  assert.ok(welt.feldAenderungen.some((a) => a.i === index), 'die Aenderung wird gemeldet');
  assert.ok(karten.begehbar(welt.karte, feld.x, feld.y), 'das Feld ist jetzt begehbar');
});

test('einheiten AC-6: der Weg fuehrt um Hindernisse herum', () => {
  const karte = karten.erzeugen(7, 2);
  const g = karte.groesse;
  // Eine Mauer aus Wald quer durch einen freien Bereich ziehen.
  for (let y = 10; y < 20; y++) karte.felder[y * g + 15] = karten.WALD;
  for (let y = 10; y < 20; y++) {
    for (const x of [14, 16]) karte.felder[y * g + x] = karten.GRAS;
  }

  const weg = suchen(karte, { x: 14, y: 15 }, { x: 16, y: 15 });
  assert.ok(weg.length > 2, 'ein gerader Durchmarsch waere zwei Felder');
  for (const feld of weg) {
    assert.ok(karten.begehbar(karte, feld.x, feld.y), 'kein Feld des Weges ist gesperrt');
  }
});

test('einheiten AC-7: keine Abkuerzung durch eine Ecke', () => {
  const karte = karten.erzeugen(7, 2);
  const g = karte.groesse;
  for (let y = 8; y <= 12; y++) {
    for (let x = 8; x <= 12; x++) karte.felder[y * g + x] = karten.GRAS;
  }
  // Eine Ecke aus zwei Sperren: von 10/10 nach 11/11 darf es nicht diagonal gehen.
  karte.felder[10 * g + 11] = karten.WASSER;
  karte.felder[11 * g + 10] = karten.WASSER;

  const weg = suchen(karte, { x: 10, y: 10 }, { x: 11, y: 11 });
  const direkt = weg.length === 1 && weg[0].x === 11 && weg[0].y === 11;
  assert.equal(direkt, false, 'die Einheit darf nicht durch die Ecke schluepfen');
});

test('einheiten AC-8: eine Wegsuche quer ueber die Karte bleibt unter 1 ms', () => {
  const karte = karten.erzeugen(7, 5);
  const von = karte.basen[0];
  const nach = karte.basen[2];
  suchen(karte, von, nach); // einmal warmlaufen

  const start = process.hrtime.bigint();
  const durchlaeufe = 200;
  for (let i = 0; i < durchlaeufe; i++) suchen(karte, von, nach);
  const je = Number(process.hrtime.bigint() - start) / 1e6 / durchlaeufe;
  assert.ok(je < 1, `eine Suche dauerte ${je.toFixed(2)} ms`);
});

test('einheiten AC-9: ein unerreichbares Ziel laesst die Einheit stehen', () => {
  const karte = karten.erzeugen(7, 2);
  const g = karte.groesse;
  for (let y = 20; y <= 24; y++) {
    for (let x = 20; x <= 24; x++) karte.felder[y * g + x] = karten.WASSER;
  }
  karte.felder[22 * g + 22] = karten.GRAS; // eine Insel

  const weg = suchen(karte, karte.basen[0], { x: 22, y: 22 });
  assert.deepEqual(weg, [], 'ohne Weg kommt eine leere Liste zurueck');
});

test('einheiten AC-13: bei Erschoepfung wird das naechste Feld gleicher Art gesucht', () => {
  const welt = new Welt(ZWEI, 7);
  const einheit = [...welt.einheiten.values()][0];

  // Ein leeres Waldfeld direkt neben einem vollen.
  const g = welt.karte.groesse;
  const voll = [...welt.karte.vorrat.keys()].find((i) => welt.karte.felder[i] === karten.WALD);
  const leer = [...welt.karte.vorrat.keys()].find(
    (i) => welt.karte.felder[i] === karten.WALD && i !== voll
      && Math.hypot((i % g) - (voll % g), ((i / g) | 0) - ((voll / g) | 0)) < 8,
  );
  assert.ok(leer !== undefined, 'zwei Waldfelder nebeneinander');

  welt.karte.vorrat.set(leer, 0);
  const leeresFeld = { x: leer % g, y: (leer / g) | 0 };
  einheit.x = leeresFeld.x + 1;
  einheit.y = leeresFeld.y;
  einheit.zuletztGesammelt = karten.WALD;
  einheit.auftrag = { art: 'sammeln', feld: leeresFeld };

  welt.sammelnBeginnen(einheit);
  assert.ok(einheit.auftrag, 'die Einheit bekommt einen Ersatzauftrag');
  assert.notDeepEqual(einheit.auftrag.feld, leeresFeld);
  const neu = einheit.auftrag.feld.y * g + einheit.auftrag.feld.x;
  assert.equal(welt.karte.felder[neu], karten.WALD, 'Ersatz ist wieder Wald');
});

test('einheiten AC-14: ohne Ersatz in Reichweite bleibt die Einheit stehen', () => {
  const welt = new Welt(ZWEI, 7);
  const einheit = [...welt.einheiten.values()][0];
  const feld = { x: 32, y: 32 };

  welt.karte.vorrat.clear(); // nichts mehr da
  einheit.auftrag = { art: 'sammeln', feld };
  einheit.x = feld.x;
  einheit.y = feld.y;

  welt.sammelnBeginnen(einheit);
  assert.equal(einheit.auftrag, null, 'kein Auftrag mehr');
  assert.deepEqual(einheit.weg, [], 'und kein Weg quer ueber die Karte');
});

test('karte AC-15: auf der groessten Karte bleibt die Wegsuche bezahlbar', () => {
  const karte = karten.erzeugen(99, 8, { kartengroesse: 'gross' });
  const g = karte.groesse;
  assert.equal(g, 200);
  // Das freie Feld, das einer Ecke am naechsten liegt.
  const frei = (x0, y0) => {
    for (let r = 0; r < g; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (karten.begehbar(karte, x0 + dx, y0 + dy)) return { x: x0 + dx, y: y0 + dy };
        }
      }
    }
    return null;
  };
  const oben = frei(0, 0);
  const unten = frei(g - 1, g - 1);
  // Der schnellste von fuenf Durchgaengen: er misst die Suche, nicht was die
  // Maschine nebenher tut. Unter fremder Last fiel der Mittelwert sonst durch.
  const messen = (lauf, wiederholungen) => {
    lauf(); // warmlaufen
    let bester = Infinity;
    for (let d = 0; d < 5; d++) {
      const start = process.hrtime.bigint();
      for (let i = 0; i < wiederholungen; i++) lauf();
      bester = Math.min(bester, Number(process.hrtime.bigint() - start) / 1e6 / wiederholungen);
    }
    return bester;
  };

  let weg = [];
  const eckeZuEcke = messen(() => { weg = suchen(karte, oben, unten); }, 4);
  assert.ok(weg.length > g, `ein Weg quer ueber die Karte, ${weg.length} Felder`);
  assert.ok(eckeZuEcke < 5, `Ecke zu Ecke ${eckeZuEcke.toFixed(2)} ms`);

  const zufall = karten.zufallAus(5);
  const paare = [];
  while (paare.length < 100) {
    const a = { x: Math.floor(zufall() * g), y: Math.floor(zufall() * g) };
    const b = { x: Math.floor(zufall() * g), y: Math.floor(zufall() * g) };
    if (karten.begehbar(karte, a.x, a.y) && karten.begehbar(karte, b.x, b.y)) paare.push([a, b]);
  }
  const zufaellig = messen(() => { for (const [a, b] of paare) suchen(karte, a, b); }, 1) / 100;
  assert.ok(zufaellig < 1, `im Mittel ${zufaellig.toFixed(2)} ms je Suche`);
});

test('karte AC-16: acht Schafe je Spieler, mit 100 Nahrung, sie stehen still', () => {
  const welt = new Welt(ZWEI, 7);
  const tiere = [...welt.tiere.values()];
  for (const spieler of welt.spieler) {
    const eigene = tiere.filter((t) => t.besitzer === spieler.id);
    assert.equal(eigene.length, 8);
    for (const schaf of eigene) {
      assert.equal(schaf.art, 'schaf');
      assert.equal(schaf.nahrung, 100);
      assert.ok(karten.begehbar(welt.karte, schaf.x, schaf.y), 'ein Schaf steht auf Gras');
      // Naeher am Zentrum als Beeren (7), Gold (10) und Stein (11), aber ausserhalb
      // seiner Grundflaeche von 4 x 4 Feldern - dort verdeckte es sie (Runde 22).
      const abstand = Math.hypot(schaf.x - spieler.basis.x, schaf.y - spieler.basis.y);
      assert.ok(abstand >= 4 && abstand < 7, `Abstand ${abstand}`);
      const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === spieler.id);
      assert.ok(welt.abstandZu(schaf, zentrum) >= 2, `nicht am Gebaeude: ${schaf.x}/${schaf.y}`);
    }
  }
  // Im Aufbau alle, mit Besitzer; danach stehen sie und kommen nicht wieder.
  const aufbau = welt.aufbau();
  assert.equal(aufbau.tiere.length, 16);
  assert.ok(aufbau.tiere.every((t) => t.art === 'schaf' && ZWEI.some((s) => s.id === t.b)));
  const vorher = tiere.map((t) => `${t.x}/${t.y}`);
  for (let i = 0; i < 50; i++) welt.takten();
  assert.deepEqual([...welt.tiere.values()].map((t) => `${t.x}/${t.y}`), vorher);
  assert.equal(welt.zustand().tiere, undefined, 'unveraenderte Tiere gehen nicht ueber die Leitung');
});

test('karte AC-17: der Aufbau der groessten Partie passt in eine Nachricht unter 200 KB', () => {
  const acht = Array.from({ length: 8 }, (_, i) => ({ id: `s${i}`, name: `Spieler ${i}` }));
  const welt = new Welt(acht, 99, { kartengroesse: 'gross' });
  const byte = Buffer.byteLength(JSON.stringify(welt.aufbau()));
  assert.equal(welt.karte.groesse, 200);
  assert.ok(byte < 200 * 1024, `Aufbau ${(byte / 1024).toFixed(1)} KB`);
});

test('karte AC-18: weitere Gold- und Steinvorkommen ausserhalb des Dorfs - je Spieler gleich viele, zu Fuss erreichbar, und zwischen den Nachbarn ein umkaempftes', () => {
  const zuFuss = (karte, von) => {
    const g = karte.groesse;
    const erreicht = new Uint8Array(g * g);
    const reihe = [von.y * g + von.x];
    erreicht[reihe[0]] = 1;
    for (let i = 0; i < reihe.length; i++) {
      const x = reihe[i] % g;
      const y = (reihe[i] / g) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = (y + dy) * g + x + dx;
        if (x + dx < 0 || y + dy < 0 || x + dx >= g || y + dy >= g || erreicht[n] || karte.felder[n] !== karten.GRAS) continue;
        erreicht[n] = 1;
        reihe.push(n);
      }
    }
    return erreicht;
  };
  for (const spieler of [2, 3, 4, 6, 8]) {
    for (let startwert = 1; startwert <= 30; startwert++) {
      const karte = karten.erzeugen(startwert, spieler, { vorkommen: 'viel' });
      const g = karte.groesse;
      const wo = `Startwert ${startwert}, ${spieler} Spieler`;
      const erreicht = karte.basen.map((b) => zuFuss(karte, b));
      // Je Basis zwei Goldfelder zu vier und ein Steinfeld zu vier, 17 bis 29 Felder vom Dorf ...
      for (const [i, basis] of karte.basen.entries()) {
        const eigene = karte.fundorte.filter((f) => f.basis === i);
        assert.deepEqual(eigene.map((f) => [f.art, f.felder]), [[karten.GOLD, 4], [karten.GOLD, 4], [karten.STEIN, 4]], `${wo}, Basis ${i}`);
        for (const f of eigene) {
          const weit = Math.hypot(f.x - basis.x, f.y - basis.y);
          assert.ok(weit >= 17.5 && weit <= 29, `${wo}, Basis ${i}: ein Vorkommen liegt ${weit.toFixed(1)} Felder weit`);
        }
      }
      // ... und zwischen je zwei Nachbarn ein umkaempftes: vier Gold, drei Stein, von beiden etwa gleich weit.
      const umkaempft = karte.fundorte.filter((f) => f.zwischen);
      assert.deepEqual(umkaempft.map((f) => [f.art, f.felder]), karte.basen.flatMap(() => [[karten.GOLD, 4], [karten.STEIN, 3]]), wo);
      for (const f of umkaempft) {
        const [a, b] = f.zwischen.map((i) => Math.hypot(f.x - karte.basen[i].x, f.y - karte.basen[i].y));
        assert.ok(Math.abs(a - b) <= 12, `${wo}: das umkaempfte Vorkommen liegt ${a.toFixed(1)} und ${b.toFixed(1)} von den Nachbarn`);
        assert.ok(Math.min(a, b) >= 28, `${wo}: das umkaempfte Vorkommen liegt nur ${Math.min(a, b).toFixed(1)} vom Dorf`);
      }
      // Jedes Feld Gold und Stein ausserhalb der Doerfer: mit Gras ringsum und zu Fuss erreichbar.
      let gold = 0;
      let stein = 0;
      for (let i = 0; i < karte.felder.length; i++) {
        const art = karte.felder[i];
        if (art !== karten.GOLD && art !== karten.STEIN) continue;
        if (art === karten.GOLD) gold += 1; else stein += 1;
        const x = i % g;
        const y = (i / g) | 0;
        const weiten = karte.basen.map((b) => Math.hypot(b.x - x, b.y - y));
        const nah = Math.min(...weiten);
        if (nah <= 16) continue;
        assert.ok(nah >= 17, `${wo}: ein fernes Vorkommen liegt ${nah.toFixed(1)} Felder vom Dorf - das ist im Dorf`);
        let ran = false;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
          const n = (y + dy) * g + x + dx;
          assert.ok(karte.felder[n] === karten.GRAS || karte.felder[n] === art, `${wo}: neben dem Vorkommen bei ${x}/${y} steht kein Gras`);
          if (erreicht[weiten.indexOf(nah)][n]) ran = true;
        }
        assert.ok(ran, `${wo}: das Vorkommen bei ${x}/${y} ist vom Dorf aus nicht zu Fuss erreichbar`);
        assert.equal(karte.vorrat.get(i), karten.VORRAT[art]);
      }
      assert.equal(gold, 19 * spieler, wo);
      assert.equal(stein, 12 * spieler, wo);
    }
  }
});

test('karte AC-19: Gold und Stein sind eine Einstellung - wenig ist das Dorf allein, mittel dazu das Umkaempfte, viel dazu die eigenen, und sonst liegt alles am selben Platz', () => {
  const steckbrief = require('../server/spiele/strategie/steckbrief.js');
  const wahl = steckbrief.einstellungen.find((e) => e.schluessel === 'vorkommen');
  assert.deepEqual(wahl.werte.map((w) => w.wert), ['wenig', 'mittel', 'viel']);
  assert.equal(wahl.vorgabe, 'mittel');
  const zaehlen = (karte, art) => karte.felder.reduce((n, feld) => n + (feld === art ? 1 : 0), 0);
  for (const spieler of [2, 3, 4, 6, 8]) {
    for (let startwert = 1; startwert <= 12; startwert++) {
      const wo = `Startwert ${startwert}, ${spieler} Spieler`;
      const je = Object.fromEntries(['wenig', 'mittel', 'viel'].map((stufe) => [stufe, karten.erzeugen(startwert, spieler, { vorkommen: stufe })]));
      for (const [stufe, gold, stein] of [['wenig', 7, 5], ['mittel', 11, 8], ['viel', 19, 12]]) {
        assert.equal(zaehlen(je[stufe], karten.GOLD), gold * spieler, `${wo}, ${stufe}: Gold`);
        assert.equal(zaehlen(je[stufe], karten.STEIN), stein * spieler, `${wo}, ${stufe}: Stein`);
      }
      // Wenig hat nichts ausserhalb, mittel nur Umkaempftes, viel beides.
      assert.equal(je.wenig.fundorte.length, 0, wo);
      assert.ok(je.mittel.fundorte.every((f) => f.zwischen), wo);
      assert.equal(je.mittel.fundorte.length, 2 * spieler, wo);
      assert.equal(je.viel.fundorte.filter((f) => f.basis !== undefined).length, 3 * spieler, wo);
      // Ohne Angabe und mit Unsinn gilt die Vorgabe.
      assert.deepEqual(karten.erzeugen(startwert, spieler).felder, je.mittel.felder, wo);
      assert.deepEqual(karten.erzeugen(startwert, spieler, { vorkommen: 'unendlich' }).felder, je.mittel.felder, wo);
      // Alles andere liegt am selben Platz: wo sich zwei Stufen unterscheiden, liegt in der reicheren Gold oder Stein
      // - oder Gras, wo der Notbehelf gerodet hat, hoechstens ein paar Felder.
      for (const [arm, reich] of [['wenig', 'mittel'], ['mittel', 'viel']]) {
        let gerodet = 0;
        for (let i = 0; i < je[arm].felder.length; i++) {
          if (je[arm].felder[i] === je[reich].felder[i]) continue;
          const neu = je[reich].felder[i];
          if (neu === karten.GRAS) gerodet += 1;
          else assert.ok(neu === karten.GOLD || neu === karten.STEIN, `${wo}: ${arm} und ${reich} unterscheiden sich bei Feld ${i} in etwas anderem als Gold und Stein`);
        }
        assert.ok(gerodet <= 60, `${wo}: ${gerodet} Felder gerodet`);
      }
      assert.deepEqual(je.wenig.basen, je.viel.basen, wo);
      assert.deepEqual(je.wenig.schafe, je.viel.schafe, wo);
    }
  }
  // Die Einstellung kommt in der Partie an.
  const welt = steckbrief.erzeugen(
    [{ id: 'aaaaaaaa', name: 'Anna' }, { id: 'bbbbbbbb', name: 'Bert' }],
    { startwert: 7, vorkommen: 'viel', sicht: 'aufgedeckt' },
  );
  assert.equal(zaehlen(welt.karte, karten.GOLD), 38);
});

// Ein Dorfbewohner, zum naechsten Vorrat einer Feldart geschickt und so lange
// getaktet, bis er dort arbeitet.
function amVorrat(welt, art) {
  const einheit = [...welt.einheiten.values()].find((e) => e.besitzer === 'a');
  const g = welt.karte.groesse;
  let bester = null;
  let abstand = Infinity;
  for (const i of welt.karte.vorrat.keys()) {
    if (welt.karte.felder[i] !== art) continue;
    const d = Math.hypot((i % g) - einheit.x, ((i / g) | 0) - einheit.y);
    if (d < abstand) { abstand = d; bester = { x: i % g, y: (i / g) | 0 }; }
  }
  welt.befehl('a', [einheit.id], bester);
  for (let i = 0; i < 3000 && !einheit.sammelt; i++) welt.einheitTakten(einheit);
  assert.ok(einheit.sammelt, `die Einheit arbeitet an Feldart ${art}`);
  return { einheit, feld: bester };
}

test('einheiten AC-15: vier Rohstoffe mit der Rate aus der Tabelle', () => {
  const erwartet = {
    [karten.WALD]: ['holz', 0.39],
    [karten.BEERE]: ['nahrung', 0.31],
    [karten.GOLD]: ['gold', 0.38],
    [karten.STEIN]: ['stein', 0.36],
  };
  for (const [art, [rohstoff, rate]] of Object.entries(erwartet)) {
    assert.deepEqual(SAMMELN[art], { rohstoff, rate });
    const welt = new Welt(ZWEI, 7);
    const { einheit, feld } = amVorrat(welt, Number(art));
    const index = feld.y * welt.karte.groesse + feld.x;
    const vorher = welt.karte.vorrat.get(index);

    // Zwanzig Sekunden Arbeit: die Ladung ist die Rate mal zwanzig, abgerundet,
    // und genau so viel fehlt dem Vorrat.
    for (let i = 0; i < 20 * TAKTE_PRO_SEKUNDE; i++) welt.einheitTakten(einheit);
    assert.equal(einheit.ladungsart, rohstoff);
    assert.equal(einheit.ladung, Math.floor(rate * 20), `${rohstoff} nach 20 s`);
    assert.equal(welt.karte.vorrat.get(index), vorher - einheit.ladung);
  }
});

test('einheiten AC-15: hoechstens zehn tragen, dann zum Dorfzentrum', () => {
  const welt = new Welt(ZWEI, 7);
  const { einheit } = amVorrat(welt, karten.GOLD);
  for (let i = 0; i < 60 * TAKTE_PRO_SEKUNDE && einheit.ladung < 10; i++) welt.einheitTakten(einheit);
  assert.equal(einheit.ladung, EINHEITEN.dorfbewohner.tragkraft);
  assert.equal(einheit.sammelt, false, 'voll hoert er auf');
  // Der Weg endet am Rand des Dorfzentrums - das Gebaeude selbst ist nicht begehbar.
  const ziel = einheit.weg.at(-1);
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a');
  assert.ok(welt.abstandZu(ziel, zentrum) <= 1, `der Weg endet am Dorfzentrum: ${ziel.x}/${ziel.y}`);

  // Zehn Sekunden weiter hat er nichts dazugenommen.
  for (let i = 0; i < 10 * TAKTE_PRO_SEKUNDE; i++) welt.einheitTakten(einheit);
  assert.ok(einheit.ladung <= 10);
});

test('einheiten AC-15: wer den Rohstoff wechselt, verliert die Ladung', () => {
  const welt = new Welt(ZWEI, 7);
  const { einheit } = amVorrat(welt, karten.WALD);
  for (let i = 0; i < 10 * TAKTE_PRO_SEKUNDE; i++) welt.einheitTakten(einheit);
  assert.ok(einheit.ladung > 0);

  // Derselbe Rohstoff an einem anderen Baum: die Ladung bleibt.
  const g = welt.karte.groesse;
  const andererBaum = [...welt.karte.vorrat.keys()].find((i) => welt.karte.felder[i] === karten.WALD);
  const getragen = einheit.ladung;
  welt.befehl('a', [einheit.id], { x: andererBaum % g, y: (andererBaum / g) | 0 });
  assert.equal(einheit.ladung, getragen);

  const stein = [...welt.karte.vorrat.keys()].find((i) => welt.karte.felder[i] === karten.STEIN);
  welt.befehl('a', [einheit.id], { x: stein % g, y: (stein / g) | 0 });
  assert.equal(einheit.ladung, 0);
  assert.equal(einheit.ladungsart, null);
});

test('einheiten AC-19: Leben und Tempo nach der Vorlage', () => {
  // Hier stehen die Einheiten der Dunklen Zeit; die der Feudalzeit prueft
  // einheiten AC-23 in tests/strategie-feudaleinheiten.test.mjs.
  const werte = Object.fromEntries(Object.entries(EINHEITEN)
    .filter(([, w]) => !w.zeitalter)
    .map(([art, w]) => [art, { leben: w.leben, tempo: w.tempo, sicht: w.sicht, tragkraft: w.tragkraft }]));
  assert.deepEqual(werte, {
    dorfbewohner: { leben: 25, tempo: 0.8, sicht: 4, tragkraft: 10 },
    spaeherreiter: { leben: 45, tempo: 1.2, sicht: 4, tragkraft: 0 },
    miliz: { leben: 40, tempo: 0.9, sicht: 4, tragkraft: 0 },
  });
  assert.ok(Math.abs(EINHEITEN.spaeherreiter.tempo / EINHEITEN.dorfbewohner.tempo - 1.5) < 1e-9);

  // Die Welt nimmt die Werte: zehn Sekunden geradeaus laufen.
  const welt = new Welt(ZWEI, 7);
  const strecke = {};
  for (const art of Object.keys(EINHEITEN)) {
    const einheit = welt.einheitAnlegen('a', 10, 10, art);
    assert.equal(einheit.leben, EINHEITEN[art].leben);
    einheit.weg = [{ x: 40, y: 10 }];
    for (let i = 0; i < 10 * TAKTE_PRO_SEKUNDE; i++) welt.einheitTakten(einheit);
    strecke[art] = einheit.x - 10;
  }
  assert.ok(Math.abs(strecke.dorfbewohner - 8) < 1e-6, `Dorfbewohner ${strecke.dorfbewohner}`);
  assert.ok(Math.abs(strecke.spaeherreiter - 12) < 1e-6, `Spaeher ${strecke.spaeherreiter}`);
  assert.ok(Math.abs(strecke.miliz - 9) < 1e-6, `Miliz ${strecke.miliz}`);
});

test('bedienung AC-24: der Zustand nennt je Spieler vier Rohstoffe und die Bevoelkerung', () => {
  const welt = new Welt(ZWEI, 7);
  const { spieler } = welt.zustand();
  assert.equal(spieler.length, 2);
  for (const s of spieler) {
    // Enthaelt - die Liste waechst mit den Stufen (seit Runde 46: u, die Untaetigen).
    for (const schluessel of ['bev', 'gold', 'holz', 'id', 'nahrung', 'raum', 'stein']) assert.ok(schluessel in s, schluessel);
    // Fuenf Dorfbewohner zu Beginn, Wohnraum aus dem Dorfzentrum.
    assert.equal(s.bev, [...welt.einheiten.values()].filter((e) => e.besitzer === s.id).length);
    assert.equal(s.raum, GEBAEUDE.dorfzentrum.wohnraum);
  }
});
