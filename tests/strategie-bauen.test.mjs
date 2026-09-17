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
  assert.deepEqual(werte.einheiten.dorfbewohner, { kuerzel: 'd', leben: 25, tragkraft: 10, kosten: { nahrung: 50 }, zeit: 25 });
  assert.deepEqual(werte.einheiten.spaeherreiter, { kuerzel: 's', leben: 45, tragkraft: 0, kosten: null, zeit: null });
  assert.deepEqual(werte.gebaeude.dorfzentrum, { leben: 2400, bildetAus: ['dorfbewohner'] });

  // Unverletzt geht kein Leben ueber die Leitung, verletzt schon.
  const einheit = eigene(welt)[0];
  assert.equal(welt.zustand().einheiten.find((e) => e.i === einheit.id).h, undefined);
  einheit.leben = 17;
  assert.equal(welt.zustand().einheiten.find((e) => e.i === einheit.id).h, 17);
  assert.equal(welt.gebaeudeFuerDraht(dorfzentrum(welt).id).h, 2400);
});
