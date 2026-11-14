// Wohin die KI ihre Farmen legt (ki AC-37) und wie sie ihre Sammler nah am
// Lager haelt (ki AC-38).
//
// Rueckmeldungen des Benutzers: "die KI muss die Felder näher zu mühlen und
// dorfzentren bauen, nicht irgendwo" und "die ki hat sehr viele dorfbewohner,
// aber die felder sind weit weg von den mühlen, sie bauen keine neuen
// holzfällerplätze mehr".
//
// Zwei Arten von Faellen: gebaute Lagen, an denen die Regel selbst geprueft
// wird, und vier ganze Partien KI gegen KI, an denen gemessen wird, was im
// Spiel daraus wird.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt } = require('../server/spiele/strategie/welt.js');
const { partieSpielen } = require('../server/spiele/strategie/pruefstand.js');
const { GEBAEUDE, HAEUSER, SAMMELN } = require('../server/spiele/strategie/daten.js');
const { Ki, FARM_WEIT, MUEHLE_RAUM, LAGER_AB, LAGER_ARBEITER } = require('../server/spiele/strategie/ki.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const gebaeudeVon = (welt, id) => [...welt.gebaeude.values()].filter((g) => g.besitzer === id);
const dorf = (welt, id) => [...welt.einheiten.values()].filter((e) => e.besitzer === id && !e.tot && e.art === 'dorfbewohner');

// Abstand von Rand zu Rand zweier Gebaeude: 0 heisst, sie beruehren sich.
function rand(welt, a, b) {
  const fa = welt.grundflaeche(a.art, a.x, a.y, a.quer);
  const fb = welt.grundflaeche(b.art, b.x, b.y, b.quer);
  return Math.max(0, fa.x0 - fb.x1 - 1, fb.x0 - fa.x1 - 1, fa.y0 - fb.y1 - 1, fb.y0 - fa.y1 - 1);
}
const ueberlappen = (welt, a, b) => {
  const fa = welt.grundflaeche(a.art, a.x, a.y, a.quer);
  const fb = welt.grundflaeche(b.art, b.x, b.y, b.quer);
  return fa.x0 <= fb.x1 && fb.x0 <= fa.x1 && fa.y0 <= fb.y1 && fb.y0 <= fa.y1;
};
const zurAnnahme = (welt, besitzer, farm) => Math.min(...gebaeudeVon(welt, besitzer)
  .filter((g) => g.fertig && GEBAEUDE[g.art].annahme.includes('nahrung')).map((g) => rand(welt, farm, g)));

test('ki AC-37: die KI legt Farmen an Muehle und Dorfzentrum - die ersten beruehren sie, keine liegt auf einer anderen, keine weiter als drei Felder', () => {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  const ki = new Ki(welt, 'a');
  const { basis } = welt.spielerVon('a');
  // Die Schafe sind geschlachtet, bevor die erste Farm steht - auf einem
  // Platz, auf dem ein Tier steht, baut niemand (bauen AC-3).
  welt.tiere.clear();
  // Eine Muehle dort, wo um sie Platz ist - gesucht, wie die KI sie sucht.
  const frei = (x, y) => ki.freiesLand('muehle', x, y, GEBAEUDE.farm.groesse) >= MUEHLE_RAUM;
  const platz = ki.platzBei('muehle', basis, 6, frei);
  assert.ok(platz, 'am Dorf ist Platz fuer eine Muehle mit Farmen');
  const muehle = welt.gebaeudeAnlegen('a', 'muehle', platz.x, platz.y, true);

  const farmen = [];
  for (let i = 0; i < 40; i++) {
    const ort = ki.farmplatz(gebaeudeVon(welt, 'a'));
    if (!ort) break;
    assert.ok(welt.platzPruefen('farm', ort.x, ort.y), `Farm ${i + 1} liegt auf freiem Land`);
    farmen.push(welt.gebaeudeAnlegen('a', 'farm', ort.x, ort.y, true));
  }
  assert.ok(farmen.length >= 12, `um Muehle und Dorfzentrum passen mindestens zwoelf Farmen, es sind ${farmen.length}`);
  assert.ok(farmen.length < 40, 'und irgendwann ist dort alles belegt - dann gibt es keinen Platz mehr');

  // Die ersten acht beruehren eine Annahme - um die Muehle wie ein Windrad,
  // soweit dort kein Wald steht, die anderen am Dorfzentrum.
  for (const farm of farmen.slice(0, 8)) assert.equal(zurAnnahme(welt, 'a', farm), 0, 'eine der ersten acht beruehrt Muehle oder Dorfzentrum');
  const anDerMuehle = farmen.filter((f) => rand(welt, f, muehle) === 0).length;
  assert.ok(anDerMuehle >= 3, `mindestens drei beruehren die Muehle, es sind ${anDerMuehle}`);
  // Keine weiter als FARM_WEIT, keine auf einer anderen.
  for (const farm of farmen) assert.ok(zurAnnahme(welt, 'a', farm) <= FARM_WEIT, 'keine Farm weiter als drei Felder vom Rand');
  for (let i = 0; i < farmen.length; i++) {
    for (let k = i + 1; k < farmen.length; k++) assert.equal(ueberlappen(welt, farmen[i], farmen[k]), false, 'keine Farm liegt auf einer anderen');
  }
  // Der kleinste Abstand zuerst: die Reihenfolge steigt nie um mehr als das,
  // was ein neu belegter Platz erklaert - hier genuegt: die erste Farm der
  // zweiten Reihe kommt nach der letzten, die noch beruehrt.
  const abstaende = farmen.map((f) => zurAnnahme(welt, 'a', f));
  assert.deepEqual(abstaende, [...abstaende].sort((x, y) => x - y), 'erst die nahen Plaetze, dann die fernen');
});

test('ki AC-37: ist an Muehle und Dorfzentrum alles belegt, baut die KI eine weitere Muehle statt einer fernen Farm', () => {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  const ki = new Ki(welt, 'a');
  const a = welt.spielerVon('a');
  // Alles voll: so viele Farmen, bis kein naher Platz mehr bleibt.
  for (let i = 0; i < 60; i++) {
    const ort = ki.farmplatz(gebaeudeVon(welt, 'a'));
    if (!ort) break;
    welt.gebaeudeAnlegen('a', 'farm', ort.x, ort.y, true);
  }
  assert.equal(ki.farmplatz(gebaeudeVon(welt, 'a')), null, 'kein naher Platz mehr');
  // Hunger und keine freie Farm: sie will eine weitere. Jede Farm hat einen
  // Bauern, damit keine als frei gilt.
  a.zeitalter = 1;
  Object.assign(a, { holz: 500, nahrung: 0 });
  const bauern = dorf(welt, 'a');
  let n = 0;
  for (const g of gebaeudeVon(welt, 'a')) {
    if (g.art !== 'farm') continue;
    g.arbeiter = bauern[n % bauern.length].id;
    n += 1;
  }
  // Ein Militaergebaeude, damit die Ruecklage dafuer nicht greift.
  const kaserne = ki.platzBeiBasis('kaserne');
  welt.gebaeudeAnlegen('a', 'kaserne', kaserne.x, kaserne.y, true);
  const gesendet = [];
  const senden = ki.senden.bind(ki);
  ki.senden = (nachricht) => { gesendet.push(nachricht); return senden(nachricht); };
  ki.farmenPruefen(ki.rollen(bauern), gebaeudeVon(welt, 'a'), bauern);
  const bau = gesendet.find((nachricht) => nachricht.auftrag === 'bauen');
  assert.ok(bau, 'sie baut etwas');
  assert.equal(bau.art, 'muehle', 'eine Muehle, keine ferne Farm');
  assert.ok(ki.freiesLand('muehle', bau.ziel.x, bau.ziel.y, GEBAEUDE.farm.groesse) >= MUEHLE_RAUM, 'dort, wo um sie Platz fuer Farmen ist');
});

// Ein Waldfeld mit einem Bauplatz fuer ein Lager daneben, mindestens `ab`
// Felder von `von` entfernt: { feld, lager }.
function waldMitLager(welt, ki, von, ab) {
  const { karte } = welt;
  const kandidaten = [];
  for (const index of karte.vorrat.keys()) {
    if (karte.felder[index] !== karten.WALD) continue;
    const x = index % karte.groesse;
    const y = (index / karte.groesse) | 0;
    const d = Math.hypot(x - von.x, y - von.y);
    if (d >= ab && d <= ab + 8) kandidaten.push({ x, y, d });
  }
  kandidaten.sort((p, q) => p.d - q.d);
  for (const feld of kandidaten) {
    const platz = ki.platzBei('holzfaellerlager', feld, 2);
    if (platz && Math.hypot(platz.x - feld.x, platz.y - feld.y) <= 3) return { feld, platz };
  }
  return null;
}

test('ki AC-38: die KI schickt den Holzfaeller an den Wald beim Lager, nicht an den naechsten Baum', () => {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
  const ki = new Ki(welt, 'a');
  const einer = dorf(welt, 'a')[0];
  const naechster = ki.naechstesFeld(einer, [karten.WALD]);
  assert.ok(naechster, 'es gibt Wald in Reichweite');
  // Ein Lager an einem Wald, der deutlich weiter weg liegt als der naechste Baum.
  const fern = waldMitLager(welt, ki, einer, Math.hypot(naechster.x - einer.x, naechster.y - einer.y) + 6);
  assert.ok(fern, 'ein fernerer Wald mit Platz fuer ein Lager');
  const lager = welt.gebaeudeAnlegen('a', 'holzfaellerlager', fern.platz.x, fern.platz.y, true);
  // Das Dorfzentrum nimmt auch Holz - damit es nicht mitspricht, zaehlt hier
  // nur das Lager.
  const feld = ki.naechstesFeld(einer, [karten.WALD], [lager]);
  assert.ok(Math.hypot(feld.x - lager.x, feld.y - lager.y) <= LAGER_AB, 'das gewaehlte Feld liegt am Lager');
  assert.notDeepEqual(feld, naechster, 'und ist nicht der naechste Baum');
  // Gegenprobe: ohne Annahme bleibt es der naechste Baum.
  assert.deepEqual(ki.naechstesFeld(einer, [karten.WALD]), naechster);
});

test('ki AC-38: laufen drei von vier Holzfaellern weit, baut die KI ein Lager bei ihnen - ohne Holz legt sie seinen Preis zurueck', () => {
  const lage = (holz) => {
    const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt' });
    const ki = new Ki(welt, 'a');
    const a = welt.spielerVon('a');
    const zentrum = gebaeudeVon(welt, 'a').find((g) => g.art === 'dorfzentrum');
    // Ein Wald, weiter als LAGER_AB vom Dorfzentrum - der einzigen Annahme.
    const fern = waldMitLager(welt, ki, zentrum, LAGER_AB + 4);
    assert.ok(fern, 'ein Wald fern vom Dorfzentrum');
    const nah = ki.naechstesFeld(zentrum, [karten.WALD]);
    while (dorf(welt, 'a').length < 4) welt.einheitAnlegen('a', a.basis.x + 3, a.basis.y + 3, 'dorfbewohner');
    const leute = dorf(welt, 'a').slice(0, 4);
    leute.forEach((e, i) => { e.auftrag = { art: 'sammeln', feld: i < 3 ? fern.feld : nah }; });
    a.holz = holz;
    const gesendet = [];
    const senden = ki.senden.bind(ki);
    ki.senden = (nachricht) => { gesendet.push(nachricht); return senden(nachricht); };
    ki.lagerFehlt = null;
    ki.lagerPruefen('holz', ki.rollen(leute), gebaeudeVon(welt, 'a'), leute);
    return { ki, fern, bau: gesendet.find((nachricht) => nachricht.auftrag === 'bauen') };
  };
  const mitHolz = lage(300);
  assert.ok(LAGER_ARBEITER.holz <= 3, 'drei genuegen fuer ein Lager');
  assert.equal(mitHolz.bau?.art, 'holzfaellerlager', 'sie baut ein Holzfaellerlager');
  assert.ok(Math.hypot(mitHolz.bau.ziel.x - mitHolz.fern.feld.x, mitHolz.bau.ziel.y - mitHolz.fern.feld.y) <= LAGER_AB,
    'dort, wo die drei arbeiten');
  assert.equal(mitHolz.ki.lagerFehlt, null, 'bezahlt - nichts liegt zurueck');

  const ohneHolz = lage(20);
  assert.equal(ohneHolz.bau, undefined, 'ohne Holz kein Bau');
  assert.deepEqual(ohneHolz.ki.lagerFehlt, GEBAEUDE.holzfaellerlager.kosten, 'sein Preis liegt zurueck');
  assert.equal(ohneHolz.ki.ruecklage().holz, GEBAEUDE.holzfaellerlager.kosten.holz, 'die Ausbildung nimmt ihn nicht');
});

// Vier ganze Partien KI gegen KI, einmal gerechnet: bei Minute 15 und 25 je
// KI die Farmen und die Felder der Holzfaeller.
const NAMEN = Object.keys(HAEUSER);
const STARTWERTE = [1, 2, 3, 4];
const MINUTEN = [15, 25];
let gemessen = null;
function messen() {
  if (gemessen) return gemessen;
  gemessen = { farmen: {}, holzwege: {} };
  for (const minute of MINUTEN) {
    gemessen.farmen[minute] = [];
    gemessen.holzwege[minute] = [];
  }
  for (const startwert of STARTWERTE) {
    const haeuser = { ki1: NAMEN[startwert % NAMEN.length], ki2: NAMEN[(startwert + 1) % NAMEN.length] };
    const eingriff = (welt, takt) => {
      const minute = takt / 600;
      if (!MINUTEN.includes(minute)) return;
      for (const s of welt.spieler) {
        const eigene = gebaeudeVon(welt, s.id).filter((g) => g.fertig);
        for (const farm of eigene.filter((g) => g.art === 'farm')) gemessen.farmen[minute].push(zurAnnahme(welt, s.id, farm));
        const lager = eigene.filter((g) => GEBAEUDE[g.art].annahme.includes('holz'));
        for (const e of dorf(welt, s.id)) {
          const feld = e.auftrag?.art === 'sammeln' && e.auftrag.feld;
          if (!feld || SAMMELN[welt.karte.felder[feld.y * welt.karte.groesse + feld.x]]?.rohstoff !== 'holz') continue;
          gemessen.holzwege[minute].push(Math.min(...lager.map((g) => Math.hypot(g.x - feld.x, g.y - feld.y))));
        }
      }
    };
    partieSpielen({ startwert, minuten: 25.1, einstellungen: { haeuser }, eingriff });
  }
  return gemessen;
}

test('ki AC-37: in vier ganzen Partien steht bei Minute 15 und bei Minute 25 keine Farm der KI weiter als drei Felder von Muehle oder Dorfzentrum', () => {
  const { farmen } = messen();
  for (const minute of MINUTEN) {
    const liste = farmen[minute];
    assert.ok(liste.length >= 8 * STARTWERTE.length, `bei Minute ${minute} stehen genug Farmen zum Messen: ${liste.length}`);
    assert.ok(Math.max(...liste) <= FARM_WEIT, `Minute ${minute}: die weiteste Farm liegt ${Math.max(...liste)} Felder vom Rand`);
    const mittel = liste.reduce((x, y) => x + y, 0) / liste.length;
    assert.ok(mittel <= 1, `Minute ${minute}: im Mittel ${mittel.toFixed(2)} Felder - die meisten beruehren`);
  }
});

test('ki AC-38: in vier ganzen Partien haben bei Minute 15 hoechstens 15 % der Holzfaeller ein Feld weiter als acht Felder vom Lager', () => {
  const wege = messen().holzwege[15];
  assert.ok(wege.length >= 8 * STARTWERTE.length, `genug Holzfaeller zum Messen: ${wege.length}`);
  const weit = wege.filter((d) => d > 8).length;
  // Gemessen 0 bis 5 %, im Mittel 3,8 bis 5,0 Felder - vor der Regel 35 bis
  // 48 % und 8,6 Felder.
  assert.ok(weit <= wege.length * 0.15, `${weit} von ${wege.length} laufen weiter als acht Felder`);
  const mittel = wege.reduce((x, y) => x + y, 0) / wege.length;
  assert.ok(mittel <= 6, `im Mittel ${mittel.toFixed(1)} Felder zum Lager`);
});
