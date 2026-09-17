// Ausbilden und Bevoelkerung - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md). Der Weg ueber das Netz steht in
// tests/netz.test.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const {
  EINHEITEN, GEBAEUDE, SCHLANGE_MAX, BEVOELKERUNG_MAX, STARTAUFSTELLUNG,
} = require('../server/spiele/strategie/daten.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

const dorfzentrum = (welt, spieler = 'a') =>
  [...welt.gebaeude.values()].find((g) => g.besitzer === spieler && g.art === 'dorfzentrum');
const eigene = (welt, spieler = 'a') => [...welt.einheiten.values()].filter((e) => e.besitzer === spieler);

// Zu Beginn sind vier von fuenf Plaetzen belegt (bauen AC-22).
const mitPlatz = (einstellungen = {}) => new Welt(ZWEI, 7, einstellungen);

// Mit einem fuenften Dorfbewohner ist der Wohnraum voll.
function voll() {
  const welt = new Welt(ZWEI, 7);
  const basis = welt.spielerVon('a').basis;
  welt.einheitAnlegen('a', basis.x + 3, basis.y);
  return welt;
}

test('bauen AC-22: zu Beginn ein Dorfzentrum, drei Dorfbewohner und ein Spaeherreiter', () => {
  assert.deepEqual(STARTAUFSTELLUNG, ['dorfbewohner', 'dorfbewohner', 'dorfbewohner', 'spaeherreiter']);
  const welt = new Welt(ZWEI, 7);
  for (const spieler of ['a', 'b']) {
    const arten = eigene(welt, spieler).map((e) => e.art).sort();
    assert.deepEqual(arten, ['dorfbewohner', 'dorfbewohner', 'dorfbewohner', 'spaeherreiter']);
    assert.equal([...welt.gebaeude.values()].filter((g) => g.besitzer === spieler).length, 1);
    for (const e of eigene(welt, spieler)) {
      assert.ok(karten.begehbar(welt.karte, Math.round(e.x), Math.round(e.y)), 'niemand steht in einem Hindernis');
    }
  }
  // Die Art geht ueber die Leitung, damit der Browser den Reiter als Reiter zeichnet.
  const gesendet = welt.zustand().einheiten.filter((e) => e.b === 'a').map((e) => e.k).sort();
  assert.deepEqual(gesendet, ['d', 'd', 'd', 's'], 'als Kuerzel, damit der Zustand klein bleibt');
  const anna = welt.zustand().spieler.find((s) => s.id === 'a');
  assert.deepEqual({ bev: anna.bev, raum: anna.raum }, { bev: 4, raum: 5 }, 'ein Platz ist frei zum Ausbilden');
});

const sekunden = (welt, s) => { for (let i = 0; i < s * TAKTE_PRO_SEKUNDE; i++) welt.takten(); };

test('bauen AC-8: das Dorfzentrum bildet fuer 50 Nahrung in 25 Sekunden einen Dorfbewohner aus', () => {
  assert.deepEqual(EINHEITEN.dorfbewohner.kosten, { nahrung: 50 });
  assert.equal(EINHEITEN.dorfbewohner.zeit, 25);
  const welt = mitPlatz();
  const anna = welt.spielerVon('a');
  const zentrum = dorfzentrum(welt);
  assert.ok(zentrum, 'jeder Spieler beginnt mit einem Dorfzentrum an seiner Basis');
  assert.deepEqual({ x: zentrum.x, y: zentrum.y }, anna.basis);

  const vorher = eigene(welt).length;
  assert.deepEqual(welt.ausbilden('a', zentrum.id, 'dorfbewohner'), {});
  assert.equal(anna.nahrung, 150);

  // Einen Takt vor Ablauf ist noch niemand da, mit dem letzten Takt schon.
  for (let i = 0; i < 25 * TAKTE_PRO_SEKUNDE - 1; i++) welt.takten();
  assert.equal(eigene(welt).length, vorher);
  welt.takten();
  assert.equal(eigene(welt).length, vorher + 1);
  const neu = eigene(welt).at(-1);
  assert.equal(neu.art, 'dorfbewohner');
  assert.equal(neu.leben, EINHEITEN.dorfbewohner.leben);
  assert.deepEqual(zentrum.schlange, []);
});

test('bauen AC-8: nur eigene Gebaeude, nur was sie ausbilden, nur mit genug Nahrung', () => {
  const welt = mitPlatz();
  const zentrum = dorfzentrum(welt);
  assert.match(welt.ausbilden('b', zentrum.id, 'dorfbewohner').fehler, /nicht dein/);
  assert.match(welt.ausbilden('a', zentrum.id, 'miliz').fehler, /bildet dieses Gebaeude nicht aus/);
  assert.match(welt.ausbilden('a', 99999, 'dorfbewohner').fehler, /nicht dein/);
  welt.spielerVon('a').nahrung = 49;
  assert.equal(welt.ausbilden('a', zentrum.id, 'dorfbewohner').fehler, 'Zu wenig Nahrung.');
  assert.equal(welt.spielerVon('a').nahrung, 49, 'eine Absage kostet nichts');
  assert.deepEqual(zentrum.schlange, []);
});

test('bauen AC-10: bis zu 15 Auftraege, bezahlt beim Einreihen, der erste zeigt Fortschritt', () => {
  const welt = mitPlatz({ vorrat: 'viel' });
  const zentrum = dorfzentrum(welt);
  const anna = welt.spielerVon('a');
  for (let i = 0; i < SCHLANGE_MAX; i++) assert.deepEqual(welt.ausbilden('a', zentrum.id, 'dorfbewohner'), {});
  assert.equal(SCHLANGE_MAX, 15);
  assert.equal(anna.nahrung, 1000 - 15 * 50, 'alle fuenfzehn sind sofort bezahlt');
  assert.equal(welt.ausbilden('a', zentrum.id, 'dorfbewohner').fehler, 'Die Warteschlange ist voll.');
  assert.equal(anna.nahrung, 250);

  sekunden(welt, 10);
  // Waehrend ausgebildet wird, geht das Gebaeude in jedem Zustand mit.
  const gesendet = welt.zustand().gebaeude.find((g) => g.i === zentrum.id);
  assert.equal(gesendet.s.length, 15);
  assert.equal(gesendet.f, 0.4, 'zehn von 25 Sekunden');
  assert.equal(gesendet.w, false);
});

test('bauen AC-11: ein Abbruch erstattet die vollen Kosten, auch fuer den laufenden Auftrag', () => {
  const welt = mitPlatz();
  const zentrum = dorfzentrum(welt);
  const anna = welt.spielerVon('a');
  const vorher = anna.nahrung;
  for (let i = 0; i < 3; i++) welt.ausbilden('a', zentrum.id, 'dorfbewohner');
  assert.equal(anna.nahrung, vorher - 150);

  sekunden(welt, 20); // der erste ist zu vier Fuenfteln fertig
  assert.deepEqual(welt.abbrechen('a', zentrum.id, 0), {});
  assert.equal(anna.nahrung, vorher - 100, 'voll erstattet, nicht anteilig');
  assert.equal(zentrum.fortschritt, 0, 'der naechste beginnt von vorn');
  assert.deepEqual(welt.abbrechen('a', zentrum.id, 1), {});
  assert.equal(anna.nahrung, vorher - 50);
  assert.deepEqual(zentrum.schlange, ['dorfbewohner']);

  assert.match(welt.abbrechen('a', zentrum.id, 5).fehler, /gibt es nicht/);
  assert.match(welt.abbrechen('b', zentrum.id, 0).fehler, /nicht dein/);
  assert.equal(anna.nahrung, vorher - 50);
});

test('bauen AC-12: neue Einheiten erscheinen auf einem freien, begehbaren Feld neben dem Dorfzentrum', () => {
  const welt = mitPlatz({ vorrat: 'viel' });
  const zentrum = dorfzentrum(welt);
  // Alle vier freien Plaetze fuellen: jeder Neue steht woanders.
  for (let i = 0; i < 20; i++) welt.einheiten.delete(eigene(welt)[0]?.id);
  for (let i = 0; i < 5; i++) welt.ausbilden('a', zentrum.id, 'dorfbewohner');
  sekunden(welt, 5 * 25);
  const neue = eigene(welt);
  assert.equal(neue.length, 5);
  const felder = new Set();
  for (const e of neue) {
    assert.ok(karten.begehbar(welt.karte, e.x, e.y), `begehbar: ${e.x}/${e.y}`);
    const abstand = Math.max(Math.abs(e.x - zentrum.x), Math.abs(e.y - zentrum.y));
    assert.ok(abstand >= 2 && abstand <= 3, `am Rand, nicht im Gebaeude: Abstand ${abstand}`);
    felder.add(`${e.x},${e.y}`);
  }
  assert.equal(felder.size, 5, 'keiner auf dem Feld eines anderen');
  // Vor dem Gebaeude, nicht dahinter, wo es sie im Bild verdeckte.
  for (const e of neue) assert.ok(e.x + e.y > zentrum.x + zentrum.y, `vorn: ${e.x}/${e.y}`);
});

test('bauen AC-14: Wohnraum fuenf je Dorfzentrum, hoechstens 200, jede Einheit belegt einen Platz', () => {
  assert.equal(GEBAEUDE.dorfzentrum.wohnraum, 5);
  assert.equal(BEVOELKERUNG_MAX, 200);
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  assert.equal(welt.wohnraum(anna), 5);
  assert.equal(welt.bevoelkerung().get('a'), 4);
  welt.gebaeudeAnlegen('a', 'dorfzentrum', 10, 10);
  assert.equal(welt.wohnraum(anna), 10);
  for (let i = 0; i < 50; i++) welt.gebaeudeAnlegen('a', 'dorfzentrum', 10, 10);
  assert.equal(welt.wohnraum(anna), 200, 'mehr zaehlt nicht');
  assert.equal(welt.wohnraum(welt.spielerVon('b')), 5, 'fremde Gebaeude zaehlen nicht');
});

test('bauen AC-14: bei voller Bevoelkerung faengt der Auftrag nicht an', () => {
  const welt = voll();
  const zentrum = dorfzentrum(welt);
  assert.deepEqual(welt.ausbilden('a', zentrum.id, 'dorfbewohner'), {}, 'einreihen geht');
  sekunden(welt, 60);
  assert.equal(eigene(welt).length, 5, 'niemand ueber den Wohnraum hinaus');
  assert.equal(zentrum.fortschritt, 0);
  assert.equal(welt.gebaeudeFuerDraht(zentrum.id).w, true, 'der Zustand sagt, dass er wartet');
});

test('bauen AC-16: eine verlorene Einheit gibt ihren Platz sofort frei', () => {
  const welt = voll();
  const zentrum = dorfzentrum(welt);
  welt.ausbilden('a', zentrum.id, 'dorfbewohner');
  welt.takten();
  assert.equal(zentrum.wartet, true);

  welt.einheiten.delete(eigene(welt)[0].id);
  assert.equal(welt.zustand().spieler.find((s) => s.id === 'a').bev, 4, 'gleich im naechsten Zustand');
  welt.takten();
  assert.equal(zentrum.wartet, false, 'und der Auftrag laeuft im naechsten Takt');
  assert.equal(zentrum.fortschritt, 1);
});

test('bedienung AC-29: der Aufbau nennt die Werte je Art, der Zustand das Leben erst, wenn es fehlt', () => {
  const welt = new Welt(ZWEI, 7);
  const { werte } = welt.aufbau();
  assert.deepEqual(werte.einheiten.dorfbewohner, {
    kuerzel: 'd', leben: 25, tragkraft: 10, kosten: { nahrung: 50 }, zeit: 25,
    baut: ['haus', 'muehle', 'holzfaellerlager', 'bergbaulager', 'farm', 'kaserne'],
  });
  assert.deepEqual(werte.einheiten.spaeherreiter, { kuerzel: 's', leben: 45, tragkraft: 0, kosten: null, zeit: null, baut: [] });
  assert.equal(werte.gebaeude.dorfzentrum.leben, 2400);
  // Was ein Gebaeude anbietet, waechst mit den Stufen: enthalten, nicht gleich.
  for (const art of ['dorfbewohner', 'webstuhl']) assert.ok(werte.gebaeude.dorfzentrum.bildetAus.includes(art), art);

  // Unverletzt geht kein Leben ueber die Leitung, verletzt schon.
  const einheit = eigene(welt)[0];
  assert.equal(welt.zustand().einheiten.find((e) => e.i === einheit.id).h, undefined);
  einheit.leben = 17;
  assert.equal(welt.zustand().einheiten.find((e) => e.i === einheit.id).h, 17);
  assert.equal(welt.gebaeudeFuerDraht(dorfzentrum(welt).id).h, 2400);
});

// ---- Bauen (Schritt A6) -----------------------------------------------------

// Ein freier Platz fuer ein Gebaeude, ringweise um die eigene Basis gesucht.
function freierPlatz(welt, art, abstand = 5, spieler = 'a') {
  const basis = welt.spielerVon(spieler).basis;
  for (let r = abstand; r < 30; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (welt.platzPruefen(art, basis.x + dx, basis.y + dy)) return { x: basis.x + dx, y: basis.y + dy };
      }
    }
  }
  throw new Error('kein Platz');
}
const dorfbewohner = (welt, spieler = 'a') => eigene(welt, spieler).filter((e) => e.art === 'dorfbewohner');

test('bauen AC-20: die Gebaeude der Dunklen Zeit mit den Werten der Tabelle', () => {
  const tabelle = {
    dorfzentrum: [4, { holz: 275, stein: 100 }, 150, 2400],
    haus: [2, { holz: 25 }, 25, 550],
    muehle: [2, { holz: 100 }, 35, 1000],
    holzfaellerlager: [2, { holz: 100 }, 35, 1000],
    bergbaulager: [2, { holz: 100 }, 35, 1000],
    farm: [3, { holz: 60 }, 15, 480],
    kaserne: [3, { holz: 175 }, 50, 1200],
  };
  for (const [art, [groesse, kosten, bauzeit, leben]] of Object.entries(tabelle)) {
    assert.deepEqual(
      { groesse: GEBAEUDE[art].groesse, kosten: GEBAEUDE[art].kosten, bauzeit: GEBAEUDE[art].bauzeit, leben: GEBAEUDE[art].leben },
      { groesse, kosten, bauzeit, leben },
      art,
    );
  }
  assert.deepEqual(GEBAEUDE.muehle.annahme, ['nahrung']);
  assert.deepEqual(GEBAEUDE.holzfaellerlager.annahme, ['holz']);
  assert.deepEqual(GEBAEUDE.bergbaulager.annahme, ['gold', 'stein']);
  assert.equal(GEBAEUDE.haus.wohnraum, 5);
});

test('bauen AC-3: das Dorfzentrum belegt 4 x 4 Felder, dort geht niemand durch und baut niemand', () => {
  const welt = new Welt(ZWEI, 7);
  const zentrum = dorfzentrum(welt);
  const { x0, y0, x1, y1 } = welt.grundflaeche('dorfzentrum', zentrum.x, zentrum.y);
  assert.deepEqual([x1 - x0 + 1, y1 - y0 + 1], [4, 4]);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) assert.equal(karten.begehbar(welt.karte, x, y), false, `${x}/${y} ist bebaut`);
  }
  assert.equal(welt.platzPruefen('haus', zentrum.x, zentrum.y), false, 'nicht auf ein Gebaeude');
});

test('bauen AC-3: kein Bau auf Baeumen, Wasser, Vorraeten, Schafen oder ueber den Kartenrand', () => {
  const welt = new Welt(ZWEI, 7);
  const g = welt.karte.groesse;
  const baum = [...welt.karte.vorrat.keys()].find((i) => welt.karte.felder[i] === karten.WALD);
  assert.equal(welt.platzPruefen('haus', baum % g, (baum / g) | 0), false, 'Baum');
  const gold = [...welt.karte.vorrat.keys()].find((i) => welt.karte.felder[i] === karten.GOLD);
  assert.equal(welt.platzPruefen('haus', gold % g, (gold / g) | 0), false, 'Gold');
  const wasser = welt.karte.felder.indexOf(karten.WASSER);
  if (wasser >= 0) assert.equal(welt.platzPruefen('haus', wasser % g, (wasser / g) | 0), false, 'Wasser');
  const schaf = [...welt.tiere.values()][0];
  assert.equal(welt.platzPruefen('haus', Math.round(schaf.x), Math.round(schaf.y)), false, 'Schaf');
  assert.equal(welt.platzPruefen('haus', 0, 0), false, 'ueber den Rand');
  assert.equal(welt.platzPruefen('haus', 1.5, 3), false, 'nur ganze Felder');

  // Ein Dorfbewohner auf dem Platz geht beiseite, statt den Bau zu verhindern.
  const platz = freierPlatz(welt, 'haus');
  const [bauer, zuschauer] = dorfbewohner(welt);
  zuschauer.x = platz.x;
  zuschauer.y = platz.y;
  assert.equal(welt.platzPruefen('haus', platz.x, platz.y), true);
  assert.ok(welt.bauen('a', [bauer.id], 'haus', platz).gebaeude);
  assert.ok(karten.begehbar(welt.karte, zuschauer.x, zuschauer.y), `beiseite: ${zuschauer.x}/${zuschauer.y}`);
});

test('bauen AC-5: die Kosten gehen bei Baubeginn ab, ohne genug Holz entsteht keine Baustelle', () => {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  const [bauer] = dorfbewohner(welt);
  const platz = freierPlatz(welt, 'muehle');
  anna.holz = 99;
  assert.deepEqual(welt.bauen('a', [bauer.id], 'muehle', platz), { fehler: 'Zu wenig Holz.' });
  assert.equal(welt.gebaeude.size, 2, 'keine Baustelle');
  assert.equal(anna.holz, 99);
  assert.equal(karten.begehbar(welt.karte, platz.x, platz.y), true);

  anna.holz = 100;
  const { gebaeude } = welt.bauen('a', [bauer.id], 'muehle', platz);
  assert.equal(anna.holz, 0, 'sofort bezahlt, nicht erst am Ende');
  assert.equal(welt.gebaeude.get(gebaeude).fertig, false);

  assert.match(welt.bauen('a', [bauer.id], 'burg', freierPlatz(welt, 'haus')).fehler, /laesst sich nicht bauen/);
  const reiter = eigene(welt).find((e) => e.art === 'spaeherreiter');
  assert.match(welt.bauen('a', [reiter.id], 'haus', freierPlatz(welt, 'haus')).fehler, /Niemand/);
  assert.match(welt.bauen('b', [bauer.id], 'haus', freierPlatz(welt, 'haus')).fehler, /Niemand/, 'fremde Dorfbewohner bauen nicht');
});

test('bauen AC-1: ein Dorfbewohner geht hin, baut ein Haus in 25 Sekunden, und das Haus gibt Wohnraum', () => {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  const [bauer] = dorfbewohner(welt);
  const { gebaeude: id } = welt.bauen('a', [bauer.id], 'haus', freierPlatz(welt, 'haus', 6));
  const haus = welt.gebaeude.get(id);
  assert.equal(bauer.auftrag.art, 'bauen');

  // Erst laufen: ohne Bauleute am Platz waechst nichts.
  let takte = 0;
  while (!bauer.baut && takte < 600) { welt.takten(); takte++; }
  assert.ok(bauer.baut, 'er ist angekommen und baut');
  assert.ok(welt.abstandZu(bauer, haus) <= 1.2);
  assert.equal(haus.bau, 0, 'unterwegs waechst nichts');
  assert.equal(welt.wohnraum(anna), 5, 'die Baustelle gibt noch keinen Wohnraum');

  // Die Bauzeit zaehlt ab dem ersten Takt am Platz: 25 Sekunden fuer einen.
  for (let i = 0; i < 25 * TAKTE_PRO_SEKUNDE - 1; i++) welt.takten();
  assert.equal(haus.fertig, false, `einen Takt vorher noch nicht (bau ${haus.bau})`);
  welt.takten();
  assert.equal(haus.fertig, true);
  assert.equal(welt.wohnraum(anna), 10, 'fertig: fuenf Plaetze mehr');
  assert.equal(bauer.auftrag, null, 'nach einem Haus steht er bereit');
  assert.equal(bauer.sammelt, false, 'waehrend er baute, sammelte er nicht');
});

test('bauen AC-1: nach dem Holzfaellerlager geht der Bauer gleich Holz sammeln', () => {
  const welt = new Welt(ZWEI, 7, { vorrat: 'viel' });
  const [bauer] = dorfbewohner(welt);
  const g = welt.karte.groesse;
  // Ein Platz nahe am naechsten Waldstueck.
  const basis = welt.spielerVon('a').basis;
  const baeume = [...welt.karte.vorrat.keys()].filter((i) => welt.karte.felder[i] === karten.WALD)
    .map((i) => ({ x: i % g, y: (i / g) | 0 }))
    .sort((a, b) => Math.hypot(a.x - basis.x, a.y - basis.y) - Math.hypot(b.x - basis.x, b.y - basis.y));
  let platz = null;
  for (const baum of baeume) {
    for (const [dx, dy] of [[3, 0], [-3, 0], [0, 3], [0, -3], [3, 3], [-3, -3]]) {
      if (welt.platzPruefen('holzfaellerlager', baum.x + dx, baum.y + dy)) { platz = { x: baum.x + dx, y: baum.y + dy }; break; }
    }
    if (platz) break;
  }
  const { gebaeude: id } = welt.bauen('a', [bauer.id], 'holzfaellerlager', platz);
  for (let i = 0; i < 120 * TAKTE_PRO_SEKUNDE && !welt.gebaeude.get(id).fertig; i++) welt.takten();
  assert.equal(welt.gebaeude.get(id).fertig, true);
  assert.equal(bauer.auftrag?.art, 'sammeln');
  assert.equal(welt.karte.felder[bauer.auftrag.feld.y * g + bauer.auftrag.feld.x], karten.WALD);
});

test('bauen AC-2: n Bauleute brauchen 3 t / (n + 2)', () => {
  // Gezaehlt wird ab dem Takt, in dem alle am Platz arbeiten.
  const dauer = (anzahl) => {
    const welt = new Welt(ZWEI, 7);
    const platz = freierPlatz(welt, 'muehle', 6);
    const muehleFlaeche = welt.grundflaeche('muehle', platz.x, platz.y);
    // Alle stellen sich gleich an den Rand, damit niemand spaeter ankommt.
    const bauleute = [];
    for (let i = 0; i < anzahl; i++) bauleute.push(welt.einheitAnlegen('a', muehleFlaeche.x1 + 1, muehleFlaeche.y0 + i));
    const { gebaeude: id } = welt.bauen('a', bauleute.map((e) => e.id), 'muehle', platz);
    const muehle = welt.gebaeude.get(id);
    let takte = 0;
    while (!muehle.fertig && takte < 1000) { welt.takten(); takte++; }
    return takte / TAKTE_PRO_SEKUNDE;
  };
  // Muehle: 35 Sekunden. Einer 35 s, zwei 26,25 s, drei 21 s. Ein Takt kommt
  // dazu: im ersten merken die Bauleute, dass sie angekommen sind.
  for (const [anzahl, erwartet] of [[1, 35], [2, 26.25], [3, 21]]) {
    const gemessen = dauer(anzahl);
    assert.ok(Math.abs(gemessen - erwartet) <= 0.2, `${anzahl} Bauleute: ${gemessen} s statt ${erwartet} s`);
  }
});

test('bauen AC-2: Rechtsklick auf die eigene Baustelle - der Zweite baut mit', () => {
  const welt = new Welt(ZWEI, 7);
  const [erster, zweiter] = dorfbewohner(welt);
  const platz = freierPlatz(welt, 'haus', 6);
  const { gebaeude: id } = welt.bauen('a', [erster.id], 'haus', platz);
  welt.befehl('a', [zweiter.id], platz);
  assert.deepEqual(zweiter.auftrag, { art: 'bauen', gebaeude: id });
  // Bert kann Annas Baustelle nicht mitbauen.
  const fremder = dorfbewohner(welt, 'b')[0];
  welt.befehl('b', [fremder.id], platz);
  assert.notEqual(fremder.auftrag?.art, 'bauen');
});

test('bauen AC-6: eine Baustelle abreissen erstattet, was noch nicht verbaut ist', () => {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  const [bauer] = dorfbewohner(welt);
  const platz = freierPlatz(welt, 'muehle', 6);
  const { gebaeude: id } = welt.bauen('a', [bauer.id], 'muehle', platz);
  assert.equal(anna.holz, 100);
  const muehle = welt.gebaeude.get(id);
  muehle.bau = 0.4; // vier Zehntel verbaut
  welt.zustand(); // Aenderungen bis hier abholen
  assert.match(welt.abreissen('b', id).fehler, /nicht dein/);
  assert.deepEqual(welt.abreissen('a', id), {});
  assert.equal(anna.holz, 160, 'sechzig von hundert zurueck');
  assert.equal(welt.gebaeude.has(id), false);
  assert.equal(karten.begehbar(welt.karte, platz.x, platz.y), true, 'der Platz ist wieder frei');
  assert.equal(bauer.auftrag, null);
  assert.ok(welt.zustand().gebaeude.some((g) => g.i === id && g.weg), 'der Browser erfaehrt es');
  assert.match(welt.abreissen('a', dorfzentrum(welt).id).fehler, /Nur Baustellen/);
});

test('einheiten AC-16: abgegeben wird am naechsten fertigen Gebaeude, das den Rohstoff annimmt', () => {
  const welt = new Welt(ZWEI, 7);
  const anna = welt.spielerVon('a');
  const zentrum = dorfzentrum(welt);
  const [sammler] = dorfbewohner(welt);
  const basis = anna.basis;
  // Ein fertiges Holzfaellerlager weit weg vom Dorfzentrum, der Sammler steht daneben.
  const platz = freierPlatz(welt, 'holzfaellerlager', 12);
  const lager = welt.gebaeudeAnlegen('a', 'holzfaellerlager', platz.x, platz.y, true);
  const stand = welt.randfeld(lager, basis);
  sammler.x = stand.x;
  sammler.y = stand.y;

  // Mit Holz: das Lager ist naeher.
  sammler.ladung = 10;
  sammler.ladungsart = 'holz';
  assert.equal(welt.lagerFuer(sammler), lager);
  // Mit Gold: das Lager nimmt kein Gold, also das Dorfzentrum.
  sammler.ladungsart = 'gold';
  assert.equal(welt.lagerFuer(sammler), zentrum);
  // Eine Baustelle nimmt nichts an.
  lager.fertig = false;
  sammler.ladungsart = 'holz';
  assert.equal(welt.lagerFuer(sammler), zentrum);
  lager.fertig = true;

  // Die Abgabe am Lager zaehlt, und danach geht er zurueck zum selben Vorrat.
  const g = welt.karte.groesse;
  const baum = [...welt.karte.vorrat.keys()].find((i) => welt.karte.felder[i] === karten.WALD);
  sammler.auftrag = { art: 'sammeln', feld: { x: baum % g, y: (baum / g) | 0 } };
  const holz = anna.holz;
  welt.abladen(sammler);
  assert.equal(anna.holz, holz + 10);
  assert.equal(sammler.ladung, 0);
  assert.ok(sammler.weg.length > 0, 'er geht zurueck zum selben Baum');
  assert.deepEqual(sammler.auftrag.feld, { x: baum % g, y: (baum / g) | 0 });
});

// ---- Kaserne und Miliz (bauen AC-9) ---------------------------------------------

test('bauen AC-20: alle sieben Gebaeude der Dunklen Zeit sind da, Dorfbewohner bauen sechs davon', () => {
  for (const art of ['bergbaulager', 'dorfzentrum', 'farm', 'haus', 'holzfaellerlager', 'kaserne', 'muehle']) assert.ok(GEBAEUDE[art], art);
  // Das Dorfzentrum erst ab der Ritterzeit (Stufe D), wie in der Vorlage.
  // Ab Stufe B kommen Gebaeude dazu: die sechs der Dunklen Zeit muessen dabei sein.
  for (const art of ['bergbaulager', 'farm', 'haus', 'holzfaellerlager', 'kaserne', 'muehle']) {
    assert.ok(EINHEITEN.dorfbewohner.baut.includes(art), art);
  }
});

test('bauen AC-9: die Kaserne bildet Miliz fuer 60 Nahrung und 20 Gold in 21 Sekunden aus', () => {
  assert.deepEqual(EINHEITEN.miliz.kosten, { nahrung: 60, gold: 20 });
  assert.equal(EINHEITEN.miliz.zeit, 21);
  assert.deepEqual(GEBAEUDE.kaserne.bildetAus, ['miliz']);
  const welt = new Welt(ZWEI, 7, { vorrat: 'viel' });
  const anna = welt.spielerVon('a');
  const platz = freierPlatz(welt, 'kaserne', 6);
  const kaserne = welt.gebaeudeAnlegen('a', 'kaserne', platz.x, platz.y, true);

  assert.match(welt.ausbilden('a', kaserne.id, 'dorfbewohner').fehler, /bildet dieses Gebaeude nicht aus/);
  assert.match(welt.ausbilden('a', dorfzentrum(welt).id, 'miliz').fehler, /bildet dieses Gebaeude nicht aus/);
  anna.gold = 19;
  assert.equal(welt.ausbilden('a', kaserne.id, 'miliz').fehler, 'Zu wenig Gold.');
  anna.gold = 1000;

  assert.deepEqual(welt.ausbilden('a', kaserne.id, 'miliz'), {});
  assert.deepEqual([anna.nahrung, anna.gold], [940, 980]);
  const vorher = eigene(welt).length;
  for (let i = 0; i < 21 * TAKTE_PRO_SEKUNDE - 1; i++) welt.takten();
  assert.equal(eigene(welt).length, vorher);
  welt.takten();
  const miliz = eigene(welt).at(-1);
  assert.equal(miliz.art, 'miliz');
  assert.equal(miliz.leben, 40);
  assert.equal(welt.bevoelkerung().get('a'), vorher + 1, 'sie nimmt einen Platz');
  assert.ok(welt.abstandZu(miliz, kaserne) <= 1.5, 'neben der Kaserne');

  // In Stufe A laeuft sie - sie sammelt nicht und baut nicht.
  const g = welt.karte.groesse;
  const baum = [...welt.karte.vorrat.keys()].find((i) => welt.karte.felder[i] === karten.WALD);
  welt.befehl('a', [miliz.id], { x: baum % g, y: (baum / g) | 0 });
  assert.equal(miliz.auftrag.art, 'gehen');
  assert.match(welt.bauen('a', [miliz.id], 'haus', freierPlatz(welt, 'haus')).fehler, /Niemand/);
});

// ---- Webstuhl und Sammelpunkt (bauen AC-21, AC-13) ---------------------------------

test('bauen AC-21: der Webstuhl - 50 Gold, 25 s, alle Dorfbewohner +15 Leben, einmal je Partie', () => {
  const { VERBESSERUNGEN } = require('../server/spiele/strategie/daten.js');
  assert.deepEqual(VERBESSERUNGEN.webstuhl.kosten, { gold: 50 });
  assert.equal(VERBESSERUNGEN.webstuhl.zeit, 25);
  assert.deepEqual(VERBESSERUNGEN.webstuhl.wirkung.dorfbewohner, { leben: 15, nahruestung: 1, fernruestung: 2 });

  const welt = voll(); // Bevoelkerung voll: eine Verbesserung braucht keinen Platz
  const zentrum = dorfzentrum(welt);
  const anna = welt.spielerVon('a');
  const vorhanden = eigene(welt).filter((e) => e.art === 'dorfbewohner');
  const reiter = eigene(welt).find((e) => e.art === 'spaeherreiter');
  assert.deepEqual(welt.ausbilden('a', zentrum.id, 'webstuhl'), {});
  assert.equal(anna.gold, 50);
  assert.match(welt.ausbilden('a', zentrum.id, 'webstuhl').fehler, /nur einmal/, 'nicht zweimal eingereiht');

  for (let i = 0; i < 25 * TAKTE_PRO_SEKUNDE - 1; i++) welt.takten();
  assert.equal(vorhanden[0].leben, 25, 'kurz vorher noch nicht');
  welt.takten();
  assert.deepEqual(anna.verbesserungen, ['webstuhl']);
  for (const e of vorhanden) assert.equal(e.leben, 40, 'alle vorhandenen Dorfbewohner');
  assert.equal(reiter.leben, 45, 'der Reiter nicht');
  assert.equal(welt.zustand().einheiten.find((e) => e.i === vorhanden[0].id).h, undefined, 'volles Leben geht nicht ueber die Leitung');
  assert.deepEqual(welt.zustand().spieler.find((s) => s.id === 'a').v, ['webstuhl']);

  // Neue Dorfbewohner kommen mit 40 Leben.
  welt.einheiten.delete(reiter.id);
  anna.nahrung = 500;
  welt.ausbilden('a', zentrum.id, 'dorfbewohner');
  for (let i = 0; i < 25 * TAKTE_PRO_SEKUNDE; i++) welt.takten();
  assert.equal(eigene(welt).at(-1).leben, 40);
  assert.match(welt.ausbilden('a', zentrum.id, 'webstuhl').fehler, /nur einmal/, 'erforscht ist erforscht');
});

test('bauen AC-21: ein abgebrochener Webstuhl erstattet voll und laesst sich wieder einreihen', () => {
  const welt = new Welt(ZWEI, 7);
  const zentrum = dorfzentrum(welt);
  const anna = welt.spielerVon('a');
  welt.ausbilden('a', zentrum.id, 'webstuhl');
  sekunden(welt, 10);
  assert.deepEqual(welt.abbrechen('a', zentrum.id, 0), {});
  assert.equal(anna.gold, 100);
  assert.deepEqual(welt.ausbilden('a', zentrum.id, 'webstuhl'), {});
});

test('bauen AC-13: ein Sammelpunkt schickt neue Einheiten hin, auf einem Vorrat sammeln sie gleich', () => {
  const welt = new Welt(ZWEI, 7, { vorrat: 'viel' });
  const zentrum = dorfzentrum(welt);
  const g = welt.karte.groesse;
  assert.match(welt.sammelpunktSetzen('b', zentrum.id, { x: 1, y: 1 }).fehler, /nicht dein/);
  assert.match(welt.sammelpunktSetzen('a', zentrum.id, { x: -5, y: 1 }).fehler, /kein Sammelpunkt/);

  // Auf Gras: der Neue geht dorthin.
  const gras = freierPlatz(welt, 'haus', 8);
  assert.deepEqual(welt.sammelpunktSetzen('a', zentrum.id, gras), {});
  assert.deepEqual(welt.gebaeudeFuerDraht(zentrum.id).p, gras);
  welt.ausbilden('a', zentrum.id, 'dorfbewohner');
  sekunden(welt, 25);
  const erster = eigene(welt).at(-1);
  assert.equal(erster.auftrag?.art, 'gehen');
  assert.deepEqual(erster.auftrag.feld, gras);

  // Auf einem Baum: der Neue sammelt dort Holz.
  const basis = welt.spielerVon('a').basis;
  const baum = [...welt.karte.vorrat.keys()].filter((i) => welt.karte.felder[i] === karten.WALD)
    .sort((a, b) => Math.hypot(a % g - basis.x, ((a / g) | 0) - basis.y) - Math.hypot(b % g - basis.x, ((b / g) | 0) - basis.y))[0];
  welt.sammelpunktSetzen('a', zentrum.id, { x: baum % g, y: (baum / g) | 0 });
  welt.einheiten.delete(erster.id);
  welt.ausbilden('a', zentrum.id, 'dorfbewohner');
  sekunden(welt, 25);
  const zweiter = eigene(welt).at(-1);
  assert.equal(zweiter.auftrag?.art, 'sammeln');
  assert.deepEqual(zweiter.auftrag.feld, { x: baum % g, y: (baum / g) | 0 });
});
