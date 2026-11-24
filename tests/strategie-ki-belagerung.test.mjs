// Die KI belagert und befestigt (ki AC-23, ki AC-33): Werkstatt und Rammen
// nach dem ersten Aufbruch, gegen eine Befestigung nicht ohne sie, die Rammen
// voraus und erst mit dem Heer hinein - und im Fuerstentum eine Burg zum
// Gegner hin. Alles ueber `welt.nachricht`, wie ein Mensch.
//
// Gebaute Lagen; was das ueber ganze Partien ausmacht, zaehlt
// `tests/partien/ki-im-nebel.test.mjs`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { EINHEITEN, GEBAEUDE } = require('../server/spiele/strategie/daten.js');
const karten = require('../server/spiele/strategie/karte.js');
const {
  Ki, HEER, WACHE, WERKSTATT, RAMME, RAMMEN, RAMMEN_MIT, HEER_BEFESTIGT, SAMMEL_ABSTAND, RAMME_WARTEN_SEKUNDEN,
  FESTUNG, BURGEN_JE_ZEITALTER, BURG_VOR, BURG_BAUER, BURG_ABSTAND_SEKUNDEN, HANDEL_VOR,
} = require('../server/spiele/strategie/ki.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

const eigene = (welt, id) => [...welt.einheiten.values()].filter((e) => e.besitzer === id && !e.tot);
const gebaeudeVon = (welt, id) => [...welt.gebaeude.values()].filter((g) => g.besitzer === id);
const dorf = (welt, id) => eigene(welt, id).filter((e) => e.art === 'dorfbewohner');
const weit = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);

/** Anna im Fuerstentum, mit Vorrat, ihre KI nach dem ersten Aufbruch, und was die KI sendet. */
function lage({ aufbruch = true, zeitalter = 2 } = {}) {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  for (const s of welt.spieler) s.zeitalter = zeitalter;
  const a = welt.spielerVon('a');
  const b = welt.spielerVon('b');
  Object.assign(a, { holz: 2000, nahrung: 2000, gold: 1000, stein: 1000 });
  const ki = new Ki(welt, 'a');
  if (aufbruch) ki.angriffTakt = 1;
  const gesendet = [];
  const senden = ki.senden.bind(ki);
  ki.senden = (n) => { gesendet.push(n); return senden(n); };
  return { welt, a, b, ki, gesendet };
}

/** Ein fertiges Gebaeude fuer `wer`, der erste freie Platz etwa `d` Felder von `um` - von `von` aus gesehen dahinter. */
function bauBei(welt, wer, art, um, d, von = null) {
  const S = welt.karte.groesse;
  const w0 = von ? Math.atan2(um.y - von.y, um.x - von.x) : 0;
  for (const dw of [0, 15, -15, 30, -30, 45, -45, 60, -60, 90, -90, 120, -120, 150, -150, 180]) {
    const x = Math.round(um.x + d * Math.cos(w0 + (dw * Math.PI) / 180));
    const y = Math.round(um.y + d * Math.sin(w0 + (dw * Math.PI) / 180));
    if (x > 4 && y > 4 && x < S - 5 && y < S - 5 && welt.platzPruefen(art, x, y)) return welt.gebaeudeAnlegen(wer, art, x, y);
  }
  throw new Error(`kein Platz fuer ${art} ${d} Felder entfernt`);
}

/** `n` Einheiten der Art fuer Anna, in Reihen neben ihrem Dorf. */
function aufstellen(welt, a, art, n, dy = 5) {
  const neu = [];
  for (let i = 0; i < n; i++) neu.push(welt.einheitAnlegen('a', a.basis.x + 3 + (i % 6), a.basis.y + dy + Math.floor(i / 6), art));
  return neu;
}

const laeufe = (gesendet) => gesendet.filter((n) => n.auftrag === 'befehl' && n.angriffslauf);
const ausbilden = (gesendet, einheit) => gesendet.filter((n) => n.auftrag === 'ausbilden' && n.einheit === einheit);
const bauten = (gesendet, art) => gesendet.filter((n) => n.auftrag === 'bauen' && n.art === art);

test('ki AC-23: Werkstatt und Ramme liest sie aus den Daten - das Gebaeude, das ausbildet, was nur Gebaeude angreift', () => {
  assert.ok(EINHEITEN[RAMME].nurGebaeude, `${RAMME} greift nur Gebaeude an`);
  assert.ok(GEBAEUDE[WERKSTATT].bildetAus.includes(RAMME), `${WERKSTATT} bildet sie aus`);
});

test('ki AC-23: nach dem ersten Aufbruch baut sie eine Werkstatt - davor nicht, und nicht vor deren Zeitalter', () => {
  const vorher = lage({ aufbruch: false });
  vorher.ki.belagerungPruefen(eigene(vorher.welt, 'a'), gebaeudeVon(vorher.welt, 'a'), dorf(vorher.welt, 'a'));
  assert.equal(bauten(vorher.gesendet, WERKSTATT).length, 0, 'vor dem ersten Aufbruch keine Werkstatt');

  const frueh = lage({ zeitalter: GEBAEUDE[WERKSTATT].zeitalter - 1 });
  frueh.ki.belagerungPruefen(eigene(frueh.welt, 'a'), gebaeudeVon(frueh.welt, 'a'), dorf(frueh.welt, 'a'));
  assert.equal(bauten(frueh.gesendet, WERKSTATT).length, 0, 'ein Zeitalter zu frueh keine Werkstatt');

  const { welt, a, ki, gesendet } = lage();
  ki.belagerungPruefen(eigene(welt, 'a'), gebaeudeVon(welt, 'a'), dorf(welt, 'a'));
  const bau = bauten(gesendet, WERKSTATT);
  assert.equal(bau.length, 1, `nach dem Aufbruch eine Werkstatt: ${JSON.stringify(gesendet)}`);
  assert.ok(weit(bau[0].ziel, a.basis) < 20, 'am Dorf');
});

test('ki AC-23: aus der Werkstatt bildet sie Rammen aus, bis so viele stehen, wie sie haelt', () => {
  const eine = (stehen) => {
    const { welt, a, ki, gesendet } = lage();
    bauBei(welt, 'a', WERKSTATT, a.basis, 8);
    aufstellen(welt, a, RAMME, stehen);
    ki.belagerungPruefen(eigene(welt, 'a'), gebaeudeVon(welt, 'a'), dorf(welt, 'a'));
    return ausbilden(gesendet, RAMME).length;
  };
  assert.equal(eine(0), 1, 'ohne Ramme eine in Auftrag');
  assert.equal(eine(RAMMEN - 1), 1, 'fehlt eine, eine in Auftrag');
  assert.equal(eine(RAMMEN), 0, 'stehen alle, keine mehr');

  // Eine nach der anderen: was in der Schlange steht, zaehlt mit.
  const { welt, a, ki, gesendet } = lage();
  bauBei(welt, 'a', WERKSTATT, a.basis, 8);
  aufstellen(welt, a, RAMME, RAMMEN - 1);
  for (let i = 0; i < 3; i++) ki.belagerungPruefen(eigene(welt, 'a'), gebaeudeVon(welt, 'a'), dorf(welt, 'a'));
  assert.equal(ausbilden(gesendet, RAMME).length, 1, 'die letzte nur einmal bestellt');
});

test('ki AC-23: auch die Rammen der Krone zaehlen - stehen genug Belagerungsrammen, bestellt sie keine und nichts liegt zurueck', () => {
  // Nach der `rammenstufe` heisst keine Ramme mehr so: zaehlte sie nur
  // `ramme`, fehlten immer alle, und die Ausbildung ruhte bis zum Ende (zwei
  // gegen zwei, Startwert 17, bis 2026-11-24).
  const { welt, a, b, ki, gesendet } = lage({ zeitalter: 3 });
  const stufe = Object.keys(EINHEITEN).find((e) => EINHEITEN[e].nurGebaeude && EINHEITEN[e].stufeVon === RAMME);
  assert.ok(stufe, 'die Krone hat eine Stufe der Ramme');
  bauBei(welt, 'a', WERKSTATT, a.basis, 8);
  bauBei(welt, 'b', FESTUNG, b.basis, 7, a.basis);
  welt.takt += 1;
  aufstellen(welt, a, stufe, RAMMEN);
  ki.belagerungPruefen(eigene(welt, 'a'), gebaeudeVon(welt, 'a'), dorf(welt, 'a'));
  assert.equal(ausbilden(gesendet, RAMME).length, 0, 'keine weitere Ramme');
  assert.equal(ki.belagerungFehlt, null, 'nichts liegt fuer Rammen zurueck');
});

test('ki AC-23: eine Ramme ist keine Kampfeinheit - sie zaehlt nicht zum Heer und steht nicht Wache', () => {
  const { welt, a, ki } = lage();
  const [ramme] = aufstellen(welt, a, RAMME, 1);
  const [ritter] = aufstellen(welt, a, 'ritter', 1, 8);
  assert.equal(ki.kaempft(ramme), false);
  assert.equal(ki.belagert(ramme), true);
  assert.equal(ki.kaempft(ritter), true);
  assert.equal(ki.belagert(ritter), false);
  const vorher = ki.kampfeinheitenVon('a');
  aufstellen(welt, a, RAMME, 6, 10);
  assert.equal(ki.kampfeinheitenVon('a'), vorher, 'sechs Rammen mehr, keine Kampfeinheit mehr');
});

test('ki AC-23: gegen eine Befestigung bricht das Heer nicht ohne Rammen auf - ohne Befestigung schon', () => {
  // Gegenprobe zuerst: dasselbe Heer, Bert ohne Burg.
  const frei = lage();
  aufstellen(frei.welt, frei.a, 'speerkaempfer', HEER_BEFESTIGT + WACHE);
  frei.ki.heerPruefen(eigene(frei.welt, 'a'));
  assert.equal(laeufe(frei.gesendet).length, 1, 'ohne Befestigung bricht es auf');

  const { welt, a, b, ki, gesendet } = lage();
  bauBei(welt, 'b', FESTUNG, b.basis, 7, a.basis);
  aufstellen(welt, a, 'speerkaempfer', HEER_BEFESTIGT + WACHE);
  ki.heerPruefen(eigene(welt, 'a'));
  assert.equal(laeufe(gesendet).length, 0, `vor der Burg kein Aufbruch ohne Rammen: ${JSON.stringify(laeufe(gesendet))}`);
  assert.notEqual(ki.rammeWartet, null, 'das Heer wartet auf Rammen');

  // Auch mit einer Ramme zu wenig nicht.
  aufstellen(welt, a, RAMME, RAMMEN_MIT - 1, 9);
  ki.heerPruefen(eigene(welt, 'a'));
  assert.equal(laeufe(gesendet).length, 0, 'eine Ramme zu wenig');

  // Kommt keine, geht es nach der Wartezeit doch - sonst stuende es fuer immer.
  welt.takt += RAMME_WARTEN_SEKUNDEN * TAKTE_PRO_SEKUNDE;
  for (const e of eigene(welt, 'a')) if (e.art === RAMME) welt.einheiten.delete(e.id);
  ki.heerPruefen(eigene(welt, 'a'));
  assert.equal(laeufe(gesendet).length, 1, 'nach der Wartezeit auch ohne');
});

test('ki AC-23: gegen eine Befestigung reicht das kleine Heer nicht - sie sammelt das groessere', () => {
  assert.ok(HEER_BEFESTIGT > HEER, `${HEER_BEFESTIGT} gegen ${HEER}`);
  const { welt, a, b, ki, gesendet } = lage();
  bauBei(welt, 'b', FESTUNG, b.basis, 7, a.basis);
  aufstellen(welt, a, RAMME, RAMMEN_MIT, 9);
  // Der Spaeherreiter vom Start zaehlt mit: einer weniger als noetig.
  const schon = eigene(welt, 'a').filter((e) => ki.kaempft(e)).length;
  aufstellen(welt, a, 'speerkaempfer', HEER_BEFESTIGT + WACHE - 1 - schon);
  ki.heerPruefen(eigene(welt, 'a'));
  assert.equal(gesendet.filter((n) => n.auftrag === 'befehl').length, 0, 'einer zu wenig: niemand geht, auch keine Ramme');
  aufstellen(welt, a, 'speerkaempfer', 1, 12);
  ki.heerPruefen(eigene(welt, 'a'));
  assert.equal(gesendet.filter((n) => n.auftrag === 'befehl').length, 1, 'mit dem letzten geht der Zug los');
});

test('ki AC-23: die Rammen gehen voraus zum Sammelplatz, das Heer folgt, wenn sie dort sind - und erst mit ihm gehen sie hinein', () => {
  const { welt, a, b, ki, gesendet } = lage();
  // Die Burg hinter Berts Dorfzentrum: von Anna aus liegt das Zentrum naeher.
  const burg = bauBei(welt, 'b', FESTUNG, b.basis, 7, a.basis);
  const heer = aufstellen(welt, a, 'speerkaempfer', HEER_BEFESTIGT + WACHE);
  const rammen = aufstellen(welt, a, RAMME, RAMMEN_MIT, 9);
  const ids = (liste) => liste.map((e) => e.id).sort((x, y) => x - y);

  ki.heerPruefen(eigene(welt, 'a'));
  const erster = gesendet.filter((n) => n.auftrag === 'befehl');
  assert.equal(erster.length, 1, `ein Befehl: ${JSON.stringify(erster)}`);
  assert.deepEqual([...erster[0].einheiten].sort((x, y) => x - y), ids(rammen), 'nur die Rammen');
  assert.ok(!erster[0].angriffslauf, 'ein Gang, kein Angriffslauf');
  assert.ok(ki.zug, 'der Zug laeuft');
  const { feld, sammel } = ki.zug;
  assert.ok(Math.abs(weit(sammel, feld) - SAMMEL_ABSTAND) <= 4, `der Sammelplatz liegt ${weit(sammel, feld).toFixed(1)} Felder vor dem Marschziel`);
  assert.ok(weit(sammel, a.basis) < weit(feld, a.basis), 'auf dem Weg von daheim');
  assert.ok(weit(sammel, burg) > GEBAEUDE[FESTUNG].reichweite + 2, 'ausserhalb der Burg');

  // Solange die Rammen unterwegs sind, wartet das Heer.
  ki.heerPruefen(eigene(welt, 'a'));
  assert.equal(laeufe(gesendet).length, 0, 'das Heer wartet');

  // Sind sie am Sammelplatz, bricht es auf - ohne die Rammen.
  for (const r of rammen) Object.assign(r, { x: sammel.x, y: sammel.y, weg: [], auftrag: null });
  ki.heerPruefen(eigene(welt, 'a'));
  const lauf = laeufe(gesendet);
  assert.equal(lauf.length, 1, 'jetzt der Angriffslauf');
  assert.ok(!lauf[0].einheiten.some((id) => rammen.some((r) => r.id === id)), 'die Rammen laufen nicht mit');
  assert.ok(lauf[0].einheiten.length >= HEER_BEFESTIGT, `das ganze Heer bis auf die Wache: ${lauf[0].einheiten.length}`);
  assert.equal(ki.zug, null);
  assert.equal(ki.angriffe, 1);

  // Das Heer ist noch daheim: die Rammen warten am Sammelplatz.
  const vorher = gesendet.length;
  for (const r of rammen) Object.assign(r, { weg: [], auftrag: null });
  ki.heerPruefen(eigene(welt, 'a'));
  const anRammen = (ab) => gesendet.slice(ab).filter((n) => n.auftrag === 'befehl' && n.einheiten.some((id) => rammen.some((r) => r.id === id)));
  assert.equal(anRammen(vorher).length, 0, 'allein gehen sie nicht hinein');

  // Steht einer vom Heer an der Burg, gehen sie hinein - auf die Burg, nicht
  // auf das naehere Dorfzentrum.
  Object.assign(heer[heer.length - 1], { x: burg.x + 3, y: burg.y + 3 });
  const dann = gesendet.length;
  ki.heerPruefen(eigene(welt, 'a'));
  const hinein = anRammen(dann);
  assert.equal(hinein.length, rammen.length, `jede Ramme bekommt ihr Ziel: ${JSON.stringify(hinein)}`);
  const zentrum = gebaeudeVon(welt, 'b').find((g) => g.art === 'dorfzentrum');
  assert.ok(weit(zentrum, sammel) < weit(burg, sammel), 'Messaufbau: das Dorfzentrum liegt naeher');
  for (const n of hinein) assert.deepEqual(n.ziel, { x: Math.round(burg.x), y: Math.round(burg.y) }, 'zuerst, was schiesst');

  // Ist vom Heer niemand mehr draussen, kehren sie um.
  for (const r of rammen) Object.assign(r, { weg: [], auftrag: null });
  const zuletzt = gesendet.length;
  ki.rammenFuehren(rammen, [], ki.naechsterGegner());
  const heim = anRammen(zuletzt);
  assert.equal(heim.length, 1, 'ein Befehl an alle');
  assert.ok(weit(heim[0].ziel, a.basis) < 12, `nach Hause: ${JSON.stringify(heim[0].ziel)}`);
  assert.ok(!rammen.some((r) => ki.heer.has(r.id)), 'und sie gehoeren nicht mehr zum Heer draussen');
});

test('ki AC-23: hat der Gegner etwas, das schiesst, ruht die Ausbildung und liegt zurueck, was die naechste Ramme kostet', () => {
  const { welt, a, b, ki, gesendet } = lage();
  bauBei(welt, 'a', WERKSTATT, a.basis, 8);
  bauBei(welt, 'a', 'schiessanlage', a.basis, 11);
  const pruefen = () => {
    ki.belagerungPruefen(eigene(welt, 'a'), gebaeudeVon(welt, 'a'), dorf(welt, 'a'));
    ki.militaerPruefen(gebaeudeVon(welt, 'a'), dorf(welt, 'a'));
  };
  // Gegen ein offenes Dorf bildet die Schiessanlage aus, und nichts liegt
  // zurueck - die Rammen kommen nebenher.
  pruefen();
  assert.ok(gesendet.some((n) => n.auftrag === 'ausbilden' && n.einheit !== RAMME), 'die Schiessanlage bildet aus');
  assert.deepEqual(ki.ruecklage(), {}, 'nichts liegt zurueck');

  // Der Gegner hat eine Burg, und sie hat sie gesehen: von da an die Rammen
  // zuerst - nicht erst, wenn das Heer schon wartet. Beim Startwert 14 nahm
  // das Militaer sonst dreissig Minuten lang jedes Gold, und es stand nie
  // eine Ramme vor der Burg (gemessen 2026-11-13).
  bauBei(welt, 'b', FESTUNG, b.basis, 7, a.basis);
  // Hingesehen wird einmal je Takt (`wahrnehmen`) - also im naechsten.
  welt.takt += 1;
  assert.equal(ki.rammeWartet, null, 'kein Heer wartet');
  for (const g of gebaeudeVon(welt, 'a')) g.schlange.length = 0;
  const ab = gesendet.length;
  pruefen();
  const neu = gesendet.slice(ab).filter((n) => n.auftrag === 'ausbilden');
  assert.deepEqual(neu.map((n) => n.einheit), [RAMME], 'nur die Ramme wird bestellt');
  assert.deepEqual(ki.ruecklage(), EINHEITEN[RAMME].kosten, 'ihre Kosten liegen zurueck');

  // Stehen die Rammen, bildet die Schiessanlage wieder aus.
  for (let i = 0; i < RAMMEN; i++) welt.einheitAnlegen('a', a.basis.x + 3 + i, a.basis.y + 9, RAMME);
  for (const g of gebaeudeVon(welt, 'a')) g.schlange.length = 0;
  const danach = gesendet.length;
  pruefen();
  assert.ok(gesendet.slice(danach).some((n) => n.auftrag === 'ausbilden' && n.einheit !== RAMME), 'mit allen Rammen wieder Kampfeinheiten');
  assert.deepEqual(ki.ruecklage(), {}, 'und nichts liegt mehr zurueck');
});

test('ki AC-33: im Fuerstentum baut sie nach dem ersten Aufbruch eine Burg, zum Gegner hin - davor nicht', () => {
  assert.equal(BURGEN_JE_ZEITALTER[GEBAEUDE[FESTUNG].zeitalter], 1, 'eine im Zeitalter der Burg');
  const pruefen = (l) => l.ki.bauwerkePruefen(gebaeudeVon(l.welt, 'a'), dorf(l.welt, 'a'));

  const vorher = lage({ aufbruch: false });
  bauBei(vorher.welt, 'a', 'schiessanlage', vorher.a.basis, 9);
  pruefen(vorher);
  assert.equal(bauten(vorher.gesendet, FESTUNG).length, 0, 'vor dem ersten Aufbruch keine Burg');

  const frueh = lage({ zeitalter: GEBAEUDE[FESTUNG].zeitalter - 1 });
  bauBei(frueh.welt, 'a', 'schiessanlage', frueh.a.basis, 9);
  pruefen(frueh);
  assert.equal(bauten(frueh.gesendet, FESTUNG).length, 0, 'ein Zeitalter zu frueh keine Burg');

  const l = lage();
  bauBei(l.welt, 'a', 'schiessanlage', l.a.basis, 9);
  // Sie muss wissen, wo der Gegner wohnt (ki AC-13).
  l.ki.wahrnehmen();
  pruefen(l);
  const bau = bauten(l.gesendet, FESTUNG);
  assert.equal(bau.length, 1, `eine Burg: ${JSON.stringify(l.gesendet)}`);
  const { a, b } = l;
  const zum = (p) => (p.x - a.basis.x) * (b.basis.x - a.basis.x) + (p.y - a.basis.y) * (b.basis.y - a.basis.y);
  assert.ok(zum(bau[0].ziel) > 0, `auf der Seite des Gegners: ${JSON.stringify(bau[0].ziel)} von ${JSON.stringify(a.basis)}`);
  assert.ok(weit(bau[0].ziel, a.basis) <= BURG_VOR + 12, 'am Dorf');
  assert.equal(bau[0].einheiten.length, Math.min(BURG_BAUER, dorf(l.welt, 'a').length), 'mit mehreren Bauern');
});

test('ki AC-33: steht ihre Burg, baut sie im Fuerstentum keine zweite - in der Krone nach einer Weile bis zu drei', () => {
  const pruefen = (l) => l.ki.bauwerkePruefen(gebaeudeVon(l.welt, 'a'), dorf(l.welt, 'a'));
  const mitBurg = (zeitalter) => {
    const l = lage({ zeitalter });
    bauBei(l.welt, 'a', 'schiessanlage', l.a.basis, 9);
    bauBei(l.welt, 'a', FESTUNG, l.a.basis, 10);
    l.ki.wahrnehmen();
    return l;
  };
  const fuerst = mitBurg(2);
  pruefen(fuerst);
  fuerst.welt.takt += 3 * BURG_ABSTAND_SEKUNDEN * TAKTE_PRO_SEKUNDE;
  pruefen(fuerst);
  assert.equal(bauten(fuerst.gesendet, FESTUNG).length, 0, 'im Fuerstentum bleibt es bei einer');

  assert.equal(BURGEN_JE_ZEITALTER[3], 3, 'in der Krone bis zu drei');
  const krone = mitBurg(3);
  pruefen(krone);
  assert.equal(bauten(krone.gesendet, FESTUNG).length, 0, 'die zweite nicht sofort');
  krone.welt.takt += BURG_ABSTAND_SEKUNDEN * TAKTE_PRO_SEKUNDE;
  pruefen(krone);
  assert.equal(bauten(krone.gesendet, FESTUNG).length, 1, 'nach der Frist die zweite');
});

test('ki AC-33: ist das Gold knapp und faehrt noch kein Handel, wartet die Burg - der Stein kauft den ersten Karren', () => {
  const pruefen = (l) => l.ki.bauwerkePruefen(gebaeudeVon(l.welt, 'a'), dorf(l.welt, 'a'));
  // Jedes Goldfeld der Karte traegt nur noch 1 Gold: jetzt ist es knapp.
  const goldLeeren = (welt) => {
    for (const [i] of welt.karte.vorrat) if (welt.karte.felder[i] === karten.GOLD) welt.karte.vorrat.set(i, 1);
  };
  const stellen = () => {
    const l = lage();
    bauBei(l.welt, 'a', 'schiessanlage', l.a.basis, 9);
    l.ki.wahrnehmen();
    l.ki.handelSeit = 1;
    return l;
  };
  // Gegenprobe: wer handelt, obwohl noch Gold in Reichweite liegt (die Neigung
  // seines Hauses), wartet mit der Burg nicht auf die Karren.
  const neigung = stellen();
  pruefen(neigung);
  assert.equal(bauten(neigung.gesendet, FESTUNG).length, 1, 'Handel aus Neigung haelt die Burg nicht auf');

  const l = stellen();
  goldLeeren(l.welt);
  pruefen(l);
  assert.equal(bauten(l.gesendet, FESTUNG).length, 0, 'ohne Karren keine Burg');
  aufstellen(l.welt, l.a, 'marktkarren', HANDEL_VOR);
  pruefen(l);
  assert.equal(bauten(l.gesendet, FESTUNG).length, 1, 'faehrt der Handel, die Burg');
});
