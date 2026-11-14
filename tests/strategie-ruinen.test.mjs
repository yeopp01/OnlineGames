// Truemmer nach dem Einsturz (→ specs/10-strategie/darstellung.md AC-26) - der
// Teil auf dem Server: mit dem Verschwinden eines zerstoerten Gebaeudes steht,
// wie lange seine Truemmer noch im Bild liegen. Der Platz selbst ist sofort
// frei - die Truemmer sind nur ein Bild.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
// Zwanzig Spielsekunden (darstellung AC-26).
const RUINE_TAKTE = 20 * TAKTE_PRO_SEKUNDE;

const gemeldet = (zustand, id) => (zustand.gebaeude || []).find((g) => g.i === id);

test('darstellung AC-26: ein Gebaeude, das im Kampf faellt, meldet zwanzig Sekunden Truemmer - und sein Platz ist im selben Takt frei', () => {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  const basis = welt.spielerVon('b').basis;
  const haus = welt.gebaeudeAnlegen('b', 'haus', basis.x + 6, basis.y + 6);
  const soldat = welt.einheitAnlegen('a', basis.x + 6, basis.y + 9, 'soldat');
  haus.leben = 5;
  welt.zustand();
  welt.nachricht('a', { auftrag: 'befehl', einheiten: [soldat.id], ziel: { x: haus.x, y: haus.y } });
  let zustand = null;
  for (let t = 0; t < 30 * TAKTE_PRO_SEKUNDE && welt.gebaeude.has(haus.id); t++) {
    welt.takten();
    zustand = welt.zustand();
  }
  assert.equal(welt.gebaeude.has(haus.id), false, 'das Haus ist gefallen');
  assert.deepEqual(gemeldet(zustand, haus.id), { i: haus.id, weg: true, z: RUINE_TAKTE });
  const { x0, y0, x1, y1 } = welt.grundflaeche('haus', haus.x, haus.y);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) assert.equal(karten.begehbar(welt.karte, x, y), true, `${x}/${y} ist frei`);
  }
  // Und bebaubar: auf den Truemmern steht sofort eine neue Baustelle.
  const bauer = welt.einheitAnlegen('b', haus.x, haus.y + 3, 'dorfbewohner');
  welt.spielerVon('b').holz = 500;
  const antwort = welt.nachricht('b', { auftrag: 'bauen', einheiten: [bauer.id], art: 'haus', ziel: { x: haus.x, y: haus.y } });
  assert.equal(antwort.fehler, undefined, 'auf den Truemmern wird gebaut');
});

test('darstellung AC-26: wer aufgibt, hinterlaesst Truemmer - eine abgerissene Baustelle nicht', () => {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  const basis = welt.spielerVon('a').basis;
  // Abgerissen: kein Einsturz.
  const baustelle = welt.gebaeudeAnlegen('a', 'haus', basis.x + 6, basis.y + 6, false);
  welt.zustand();
  assert.equal(welt.abreissen('a', baustelle.id).fehler, undefined);
  assert.deepEqual(gemeldet(welt.zustand(), baustelle.id), { i: baustelle.id, weg: true });

  // Aufgegeben: alles faellt, alles hinterlaesst Truemmer.
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'b' && g.art === 'dorfzentrum');
  const turm = welt.gebaeudeAnlegen('b', 'wachturm', welt.spielerVon('b').basis.x + 7, welt.spielerVon('b').basis.y);
  welt.zustand();
  welt.aufgeben('b');
  const zustand = welt.zustand();
  assert.deepEqual(gemeldet(zustand, zentrum.id), { i: zentrum.id, weg: true, z: RUINE_TAKTE });
  assert.deepEqual(gemeldet(zustand, turm.id), { i: turm.id, weg: true, z: RUINE_TAKTE });
});

test('darstellung AC-26: wer den Einsturz erst spaeter bemerkt, sieht die Truemmer kuerzer - nach zwanzig Sekunden gar nicht', () => {
  // Mit Nebel: Anna kennt Berts Haeuser, sieht aber nicht hin, als sie fallen.
  const welt = new Welt(ZWEI, 7);
  const a = welt.spielerVon('a').basis;
  const fern = { x: a.x + 14, y: a.y + 14 };
  const frueh = welt.gebaeudeAnlegen('b', 'haus', fern.x, fern.y);
  const spaet = welt.gebaeudeAnlegen('b', 'haus', fern.x + 4, fern.y);
  const drittes = welt.gebaeudeAnlegen('b', 'haus', fern.x, fern.y + 4);
  const spaeher = welt.einheitAnlegen('a', fern.x + 2, fern.y + 2, 'spaeherreiter');
  // Die Sicht wird alle paar Takte neu gerechnet: so lange takten, bis Annas
  // Zustand etwas zu diesem Gebaeude sagt.
  const bisGemeldet = (id) => {
    for (let t = 0; t < 12; t++) {
      welt.takten();
      const eintrag = gemeldet(welt.zustandJeSpieler(['a']).get('a'), id);
      if (eintrag) return eintrag;
    }
    return null;
  };
  const takte = (sekunden) => {
    for (let t = 0; t < sekunden * TAKTE_PRO_SEKUNDE; t++) {
      welt.takten();
      welt.zustandJeSpieler(['a']);
    }
  };
  const hin = () => Object.assign(spaeher, { x: fern.x + 2, y: fern.y + 2 });
  const fort = () => {
    Object.assign(spaeher, { x: a.x, y: a.y + 5 });
    takte(1);
    assert.equal(welt.siehtGebaeude('a', frueh), false, 'jetzt sieht sie nicht hin');
  };
  // Sie sieht alle drei, dann geht der Spaeher.
  assert.ok(bisGemeldet(frueh.id), 'Anna kennt das erste Haus');
  takte(1);
  fort();

  // Das erste faellt im Nebel; acht Sekunden spaeter sieht sie wieder hin.
  welt.gebaeudeZerstoeren(frueh);
  const gefallen = welt.takt;
  takte(8);
  hin();
  const erstes = bisGemeldet(frueh.id);
  assert.deepEqual(erstes, { i: frueh.id, weg: true, z: RUINE_TAKTE - (welt.takt - gefallen) });
  assert.ok(erstes.z < RUINE_TAKTE - 8 * TAKTE_PRO_SEKUNDE + 1 && erstes.z > 0, `rund zwoelf Sekunden bleiben: ${erstes.z} Takte`);

  // Das zweite faellt vor ihren Augen: die volle Zeit.
  takte(1);
  welt.gebaeudeZerstoeren(spaet);
  const zweites = bisGemeldet(spaet.id);
  assert.deepEqual(zweites, { i: spaet.id, weg: true, z: RUINE_TAKTE - 1 });

  // Das dritte liegt laenger als zwanzig Sekunden im Nebel: nur noch weg.
  fort();
  welt.gebaeudeZerstoeren(drittes);
  takte(21);
  hin();
  assert.deepEqual(bisGemeldet(drittes.id), { i: drittes.id, weg: true });
});
