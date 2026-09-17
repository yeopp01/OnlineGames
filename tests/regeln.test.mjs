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
const { EINHEITEN, SAMMELN } = require('../server/spiele/strategie/daten.js');

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
  assert.deepEqual(Object.keys(mittel.zustand().spieler[0]).sort(), ['gold', 'holz', 'id', 'nahrung', 'stein']);
  assert.equal(mittel.zustand().spieler[0].stein, 500);
});

test('karte AC-9: ein erschoepftes Feld wird Gras und wird gemeldet', () => {
  const welt = new Welt(ZWEI, 7);
  const index = [...welt.karte.vorrat.keys()].find((i) => welt.karte.felder[i] === karten.WALD);
  const g = welt.karte.groesse;
  const feld = { x: index % g, y: (index / g) | 0 };
  welt.karte.vorrat.set(index, 5); // fast leer

  const einheit = [...welt.einheiten.values()][0];
  einheit.x = feld.x + 1;
  einheit.y = feld.y;
  einheit.auftrag = { art: 'sammeln', feld };
  einheit.weg = [];
  welt.feldAenderungen = [];

  // Fuenf Einheiten Holz bei der Rate aus den Daten, und zwei Takte Spiel.
  const takte = Math.ceil(5 / (SAMMELN[karten.WALD].rate / TAKTE_PRO_SEKUNDE)) + 2;
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
  const messen = (lauf, wiederholungen) => {
    lauf(); // warmlaufen
    const start = process.hrtime.bigint();
    for (let i = 0; i < wiederholungen; i++) lauf();
    return Number(process.hrtime.bigint() - start) / 1e6 / wiederholungen;
  };

  let weg = [];
  const eckeZuEcke = messen(() => { weg = suchen(karte, oben, unten); }, 20);
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
      // Naeher am Zentrum als Beeren (7), Gold (10) und Stein (11).
      const abstand = Math.hypot(schaf.x - spieler.basis.x, schaf.y - spieler.basis.y);
      assert.ok(abstand >= 3 && abstand <= 5, `Abstand ${abstand}`);
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

test('einheiten AC-15: hoechstens zehn tragen, dann zur Basis', () => {
  const welt = new Welt(ZWEI, 7);
  const { einheit } = amVorrat(welt, karten.GOLD);
  for (let i = 0; i < 60 * TAKTE_PRO_SEKUNDE && einheit.ladung < 10; i++) welt.einheitTakten(einheit);
  assert.equal(einheit.ladung, EINHEITEN.dorfbewohner.tragkraft);
  assert.equal(einheit.sammelt, false, 'voll hoert er auf');
  const ziel = einheit.weg.at(-1);
  const basis = welt.spielerVon('a').basis;
  assert.ok(Math.hypot(ziel.x - basis.x, ziel.y - basis.y) <= 2.5, 'der Weg endet an der Basis');

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
  assert.deepEqual(EINHEITEN, {
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
