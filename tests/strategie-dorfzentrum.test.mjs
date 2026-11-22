// Ein zweites Dorfzentrum in der Krone (bauen AC-57, Punkt 39 des Benutzers):
// `bauenAb: 3` und `hoechstens: 2` in den Daten, das erste zaehlt mit.
// Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, EINHEITEN } = require('../server/spiele/strategie/daten.js');
const { techbaum } = require('../server/spiele/strategie/techbaum.js');
const { Ki } = require('../server/spiele/strategie/ki.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

const takten = (welt, sekunden) => {
  for (let t = 0; t < sekunden * TAKTE_PRO_SEKUNDE; t++) welt.takten();
};

/** Ein freier Platz fuer `art`, ab `abstand` Feldern von `mitte` gesucht. */
function platzUm(welt, art, mitte, abstand = 3) {
  for (let r = abstand; r < 40; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = Math.round(mitte.x) + dx;
        const y = Math.round(mitte.y) + dy;
        if (welt.platzPruefen(art, x, y)) return { x, y };
      }
    }
  }
  throw new Error('kein Platz');
}

/** Anna im Zeitalter `stufe` mit genug fuer drei Dorfzentren. */
function lage(stufe = 3) {
  const welt = new Welt(ZWEI, 11, { sicht: 'aufgedeckt' });
  welt.tiere.clear();
  const anna = welt.spielerVon('a');
  anna.zeitalter = stufe;
  Object.assign(anna, { holz: 5000, nahrung: 5000, stein: 5000, gold: 5000 });
  const bauer = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner').map((e) => e.id);
  return { welt, anna, bauer };
}

const zentrenVon = (welt, id) => [...welt.gebaeude.values()].filter((g) => g.besitzer === id && g.art === 'dorfzentrum');
const bauen = (welt, bauer, ziel) => welt.nachricht('a', { auftrag: 'bauen', einheiten: bauer, art: 'dorfzentrum', ziel });

test('bauen AC-57: das Dorfzentrum ist erst in der Krone zu bauen, hoechstens zwei je Spieler - es gehoert weiter zum Landsitz', () => {
  const d = GEBAEUDE.dorfzentrum;
  assert.deepEqual([d.zeitalter || 0, d.bauenAb, d.hoechstens], [0, 3, 2]);
  assert.ok(EINHEITEN.dorfbewohner.baut.includes('dorfzentrum'), 'der Dorfbewohner baut es');
  assert.equal(EINHEITEN.dorfbewohner.baut.at(-1), 'dorfzentrum', 'zuletzt: keine Taste davor verschiebt sich');
  // Die Wirtschaft traegt in der Krone schon zehn (bedienung AC-64).
  assert.equal(d.seite, 1, 'im Baumenue beim Militaer');
  const { welt } = lage();
  assert.equal(welt.gebaeudeZeitalter('dorfzentrum'), 0, 'zum Aufstieg und im Technologiebaum zaehlt es zum Landsitz');
  assert.equal(welt.bauZeitalter('dorfzentrum'), 3);
  const w = welt.aufbau().werte.gebaeude.dorfzentrum;
  assert.deepEqual([w.zeitalter, w.bauenAb, w.hoechstens], [0, 3, 2], 'der Browser bekommt beides');
});

test('bauen AC-57: vor der Krone abgewiesen, nichts bezahlt - in der Krone gesetzt und bezahlt', () => {
  for (const stufe of [0, 1, 2]) {
    const { welt, anna, bauer } = lage(stufe);
    const p = platzUm(welt, 'dorfzentrum', anna.basis, 10);
    const antwort = bauen(welt, bauer, p);
    assert.match(antwort.fehler || '', /lässt sich erst .* bauen/, `Zeitalter ${stufe}`);
    assert.equal(anna.holz, 5000, `Zeitalter ${stufe}: nichts bezahlt`);
    assert.equal(zentrenVon(welt, 'a').length, 1);
  }
  const { welt, anna, bauer } = lage(3);
  const p = platzUm(welt, 'dorfzentrum', anna.basis, 10);
  assert.equal(bauen(welt, bauer, p).fehler, undefined);
  assert.deepEqual([anna.holz, anna.stein], [5000 - GEBAEUDE.dorfzentrum.kosten.holz, 5000 - (GEBAEUDE.dorfzentrum.kosten.stein || 0)]);
  assert.equal(zentrenVon(welt, 'a').length, 2, 'die Baustelle steht');
});

test('bauen AC-57: ein drittes wird abgewiesen - schon die Baustelle zaehlt, und Bert baut seines', () => {
  const { welt, anna, bauer } = lage(3);
  assert.equal(bauen(welt, bauer, platzUm(welt, 'dorfzentrum', anna.basis, 10)).fehler, undefined);
  const holz = anna.holz;
  const antwort = bauen(welt, bauer, platzUm(welt, 'dorfzentrum', anna.basis, 20));
  assert.match(antwort.fehler || '', /nur zweimal je Spieler/);
  assert.equal(anna.holz, holz, 'nichts bezahlt');
  assert.equal(zentrenVon(welt, 'a').length, 2);

  const bert = welt.spielerVon('b');
  Object.assign(bert, { zeitalter: 3, holz: 1000, stein: 1000 });
  const bertsBauer = [...welt.einheiten.values()].filter((e) => e.besitzer === 'b' && e.art === 'dorfbewohner').map((e) => e.id);
  const q = platzUm(welt, 'dorfzentrum', bert.basis, 10);
  assert.equal(welt.nachricht('b', { auftrag: 'bauen', einheiten: bertsBauer, art: 'dorfzentrum', ziel: q }).fehler, undefined,
    'die Grenze gilt je Spieler');
});

test('bauen AC-57: faellt das erste, sind wieder zwei moeglich', () => {
  const { welt, anna, bauer } = lage(3);
  const [erstes] = zentrenVon(welt, 'a');
  welt.gebaeudeZerstoeren(erstes);
  assert.equal(zentrenVon(welt, 'a').length, 0);
  assert.equal(bauen(welt, bauer, platzUm(welt, 'dorfzentrum', anna.basis, 10)).fehler, undefined);
  assert.equal(bauen(welt, bauer, platzUm(welt, 'dorfzentrum', anna.basis, 20)).fehler, undefined);
  assert.match(bauen(welt, bauer, platzUm(welt, 'dorfzentrum', anna.basis, 30)).fehler || '', /nur zweimal/);
});

test('bauen AC-57: das zweite bildet aus, nimmt jeden Rohstoff an und gibt Wohnraum wie das erste', () => {
  const { welt, anna, bauer } = lage(3);
  const vorher = welt.wohnraum(anna);
  const p = platzUm(welt, 'dorfzentrum', anna.basis, 14);
  // Als Baustelle gibt es noch keinen Wohnraum.
  assert.equal(bauen(welt, bauer, p).fehler, undefined);
  const zweites = zentrenVon(welt, 'a').find((g) => !g.fertig);
  assert.equal(welt.wohnraum(anna), vorher, 'die Baustelle gibt nichts');
  welt.gebaeudeZerstoeren(zweites, false);
  const fertig = welt.gebaeudeAnlegen('a', 'dorfzentrum', p.x, p.y, true);
  assert.equal(welt.wohnraum(anna), Math.min(200, vorher + GEBAEUDE.dorfzentrum.wohnraum), 'fertig gibt es Wohnraum');

  // Ausbilden: ein Dorfbewohner aus dem zweiten.
  const zahl = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner').length;
  assert.equal(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: fertig.id, einheit: 'dorfbewohner' }).fehler, undefined);
  takten(welt, EINHEITEN.dorfbewohner.zeit + 2);
  const neu = [...welt.einheiten.values()].filter((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  assert.equal(neu.length, zahl + 1, 'ein Dorfbewohner mehr');

  // Annehmen: ein Sammler neben dem zweiten gibt dort ab, nicht am fernen ersten.
  const sammler = welt.einheiten.get(bauer[0]);
  sammler.x = p.x + 3;
  sammler.y = p.y;
  for (const art of ['holz', 'nahrung', 'gold', 'stein']) {
    sammler.ladung = 5;
    sammler.ladungsart = art;
    assert.equal(welt.lagerFuer(sammler)?.id, fertig.id, `${art} am zweiten`);
  }
});

test('bauen AC-57: der Aufstieg laeuft nur einmal - auch mit zwei Dorfzentren', () => {
  // In der Krone gibt es keinen weiteren Aufstieg, auch nicht am zweiten.
  const krone = lage(3);
  const p = platzUm(krone.welt, 'dorfzentrum', krone.anna.basis, 14);
  const zweites = krone.welt.gebaeudeAnlegen('a', 'dorfzentrum', p.x, p.y, true);
  assert.match(krone.welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: zweites.id, einheit: 'imperialzeit' }).fehler || '', /schon erreicht/);

  // Und stuende ein zweites schon frueher (etwa aus einer Probe): bestellt ist
  // bestellt, das andere Dorfzentrum weist ab.
  const { welt, anna } = lage(2);
  for (const art of ['kloster', 'universitaet']) {
    const q = platzUm(welt, art, anna.basis, 12);
    welt.gebaeudeAnlegen('a', art, q.x, q.y, true);
  }
  const [erstes] = zentrenVon(welt, 'a');
  const r = platzUm(welt, 'dorfzentrum', anna.basis, 20);
  const zweitesFrueh = welt.gebaeudeAnlegen('a', 'dorfzentrum', r.x, r.y, true);
  assert.equal(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: erstes.id, einheit: 'imperialzeit' }).fehler, undefined);
  assert.match(welt.nachricht('a', { auftrag: 'ausbilden', gebaeude: zweitesFrueh.id, einheit: 'imperialzeit' }).fehler || '', /läuft schon/);
  assert.equal(zentrenVon(welt, 'a').filter((g) => g.schlange.includes('imperialzeit')).length, 1);
});

test('bauen AC-57: das Dorfzentrum zaehlt weiter zum Aufstieg aus dem Landsitz, und der Technologiebaum fuehrt es dort', () => {
  const { welt, anna } = lage(0);
  const ohne = welt.gebaeudeDerZeit(anna);
  const q = platzUm(welt, 'kaserne', anna.basis, 10);
  welt.gebaeudeAnlegen('a', 'kaserne', q.x, q.y, true);
  assert.equal(welt.gebaeudeDerZeit(anna), ohne + 1, 'eine Kaserne des Landsitzes zaehlt wie bisher');
  const gruppe = techbaum().seiten.flatMap((s) => s.gruppen).find((g) => g.gebaeude === 'dorfzentrum');
  assert.ok(gruppe, 'das Dorfzentrum hat seine Gruppe');
  assert.equal(gruppe.zeitalter, 0, 'in der Zeile des Landsitzes');
  assert.ok(techbaum().seiten[1].gruppen.some((g) => g.gebaeude === 'dorfzentrum'), 'auf der Seite Militaer wie im Baumenue (bedienung AC-81)');
});

test('bauen AC-57: die KI baut kein Dorfzentrum - auch reich in der Krone nicht', () => {
  // Jeder Bauauftrag der KI geht durch `Ki.bauen`; seine Art ist ein Wort
  // oder eine Liste ohne das Dorfzentrum. In ki.js steht es nur als Vergleich.
  const quelle = readFileSync(new URL('../server/spiele/strategie/ki.js', import.meta.url), 'utf8');
  const nennungen = [...quelle.matchAll(/[^\n]*'dorfzentrum'[^\n]*/g)].map((m) => m[0]);
  assert.ok(nennungen.length > 0);
  for (const zeile of nennungen) assert.match(zeile, /[!=]==\s*'dorfzentrum'/, zeile.trim());
  assert.doesNotMatch(quelle, /dorfbewohner\.baut/, 'sie geht nicht die Liste durch, aus der sie es nehmen koennte');

  // Und gespielt: Anna in der Krone, 50 Dorfbewohner, von allem 20 000, eine
  // Burg - fuenf Spielminuten lang bestellt die KI kein Dorfzentrum.
  const { welt, anna } = lage(3);
  Object.assign(anna, { holz: 20000, nahrung: 20000, stein: 20000, gold: 20000 });
  for (let i = 0; i < 46; i++) welt.einheitAnlegen('a', anna.basis.x - 5 + (i % 10), anna.basis.y + 5 + Math.floor(i / 10));
  const burg = platzUm(welt, 'burg', anna.basis, 10);
  welt.gebaeudeAnlegen('a', 'burg', burg.x, burg.y, true);
  const ki = new Ki(welt, 'a');
  ki.angriffTakt = 1;
  const arten = new Set();
  const senden = ki.senden.bind(ki);
  ki.senden = (n) => {
    if (n.auftrag === 'bauen') arten.add(n.art);
    return senden(n);
  };
  for (let t = 0; t < 5 * 60 * TAKTE_PRO_SEKUNDE; t++) {
    ki.takt();
    welt.takten();
  }
  assert.ok(arten.size > 0, 'die KI hat gebaut');
  assert.ok(!arten.has('dorfzentrum'), [...arten].join(', '));
  assert.equal(zentrenVon(welt, 'a').length, 1);
});
