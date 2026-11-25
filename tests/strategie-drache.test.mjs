// Der Drache (→ specs/10-strategie/bauen.md AC-35, einheiten-und-befehle.md
// AC-52 bis AC-54, kampf.md AC-23; ADR-0014): gerufen am Kloster mit einem
// Ei, fliegt ohne Wegsuche, brennt eine Flaeche, frisst Nahrung - und nur
// Schuetzen, Tuerme und Burgen treffen ihn. Faellt er, liegt dort sein Ei.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { DRACHE, EINHEITEN } = require('../server/spiele/strategie/daten.js');
const { pruefen } = require('../server/spiele/strategie/pruefstand.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];
const neueWelt = (einstellungen = {}, startwert = 7) => new Welt(ZWEI, startwert, { sicht: 'aufgedeckt', vorrat: 'viel', ...einstellungen });
const takten = (welt, sekunden) => {
  for (let t = 0; t < sekunden * TAKTE_PRO_SEKUNDE; t++) welt.takten();
};
const bis = (welt, bedingung, sekunden, wozu) => {
  for (let t = 0; t < sekunden * TAKTE_PRO_SEKUNDE; t++) {
    if (bedingung()) return;
    welt.takten();
  }
  assert.ok(bedingung(), `${wozu} - nicht nach ${sekunden} s`);
};

/** Ein freier Platz fuer ein Gebaeude um einen Punkt. */
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

/** Ein Kloster mit dem Ei darin, Anna im Fuerstentum, reich genug zum Rufen. */
function klosterMitEi(einstellungen = {}) {
  const welt = neueWelt(einstellungen);
  const [ei] = welt.eier.values();
  const basis = welt.spielerVon('a').basis;
  const p = platzUm(welt, 'kloster', basis, 6);
  const kloster = welt.gebaeudeAnlegen('a', 'kloster', p.x, p.y, true);
  // Mit der Einstellung "aus" liegt kein Ei auf der Karte (einheiten AC-52).
  if (ei) Object.assign(ei, { x: -1, y: -1, kloster: kloster.id });
  const anna = welt.spielerVon('a');
  anna.zeitalter = 2;
  Object.assign(anna, { nahrung: 5000, gold: 5000 });
  // Wohnraum fuer Moenche und Drachen: das Dorfzentrum allein gibt fuenf.
  for (let i = 0; i < 4; i++) {
    const h = platzUm(welt, 'haus', basis, 9);
    welt.gebaeudeAnlegen('a', 'haus', h.x, h.y, true);
  }
  return { welt, ei, kloster, anna };
}

/** Moenche rund um das Kloster - jeder auf einem freien Randfeld, ab dem `ab`-ten. */
function moencheStellen(welt, kloster, anzahl, ab = 0) {
  const { x0, y0, x1, y1 } = welt.grundflaeche(kloster.art, kloster.x, kloster.y);
  const rand = [];
  for (let x = x0 - 1; x <= x1 + 1; x++) rand.push({ x, y: y0 - 1 }, { x, y: y1 + 1 });
  const felder = rand.filter((f) => karten.begehbar(welt.karte, f.x, f.y) && !welt.gebaeudeAn(f.x, f.y));
  assert.ok(felder.length >= ab + anzahl, 'Platz fuer die Moenche');
  return felder.slice(ab, ab + anzahl).map((f) => welt.einheitAnlegen('a', f.x, f.y, 'moench'));
}

/** Der Drache steigt aus dem Kloster - schneller als 180 Sekunden: der Ruf wird vorgespult. */
function dracheRufen() {
  const lage = klosterMitEi();
  moencheStellen(lage.welt, lage.kloster, 5);
  assert.deepEqual(lage.welt.nachricht('a', { auftrag: 'rufen', gebaeude: lage.kloster.id }), {});
  lage.kloster.ruf.takte = DRACHE.rufen.sekunden * TAKTE_PRO_SEKUNDE - 1;
  takten(lage.welt, 1);
  const drache = lage.welt.dracheVon('a');
  assert.ok(drache, 'er ist da');
  return { ...lage, drache };
}

test('bauen AC-35: am Kloster mit Ei kostet der Ruf 400 Nahrung und 400 Gold beim Beginn - die Uhr laeuft nur, solange fuenf eigene Moenche dort stehen', () => {
  const { welt, ei, kloster, anna } = klosterMitEi();
  const moenche = moencheStellen(welt, kloster, 4);
  assert.deepEqual(welt.nachricht('a', { auftrag: 'rufen', gebaeude: kloster.id }), {});
  assert.equal(anna.nahrung, 5000 - DRACHE.rufen.kosten.nahrung);
  assert.equal(anna.gold, 5000 - DRACHE.rufen.kosten.gold);
  // Vier Moenche: die Uhr steht.
  takten(welt, 10);
  assert.equal(kloster.ruf.takte, 0, 'mit vier Moenchen steht sie');
  assert.deepEqual(welt.zustand().dr, [[...welt.zustand().dr[0].slice(0, 1), 180, 4, ...welt.zustand().dr[0].slice(3)]]);
  // Der fuenfte kommt: sie laeuft.
  moenche.push(...moencheStellen(welt, kloster, 1, 4));
  takten(welt, 10);
  assert.ok(kloster.ruf.takte >= 9 * TAKTE_PRO_SEKUNDE, `nach zehn Sekunden mit fuenf: ${kloster.ruf.takte} Takte`);
  // Geht einer, steht sie wieder.
  welt.befehl('a', [moenche[0].id], { x: moenche[0].x + 12, y: moenche[0].y });
  takten(welt, 1);
  const stand = kloster.ruf.takte;
  takten(welt, 5);
  assert.equal(kloster.ruf.takte, stand, 'mit vier steht sie');
  // Zurueck: sie laeuft weiter, bis der Drache steigt.
  welt.befehl('a', [moenche[0].id], { x: moenche[1].x, y: moenche[1].y - 0 });
  welt.einheiten.get(moenche[0].id).x = moenche[4].x;
  bis(welt, () => welt.dracheVon('a'), 200, 'der Drache steigt');
  assert.equal(ei.drache, welt.dracheVon('a').id, 'das Ei ist nun der Drache');
  assert.equal(ei.kloster, null);
  assert.equal(kloster.ruf, null);
  assert.equal(welt.zustand().dr, undefined, 'die Ansage ist fort');
});

test('bauen AC-35: alle sehen die Ansage mit der Uhr, auch im Nebel - hoechstens ein Drache je Spieler, ohne Ei und mit der Einstellung "aus" gibt es keinen Ruf', () => {
  const nebel = klosterMitEi({ sicht: 'nebel' });
  moencheStellen(nebel.welt, nebel.kloster, 5);
  nebel.welt.nachricht('a', { auftrag: 'rufen', gebaeude: nebel.kloster.id });
  takten(nebel.welt, 3);
  nebel.welt.sichtAktualisieren();
  const zustaende = nebel.welt.zustandJeSpieler(['a', 'b']);
  const [wer, rest, moenche] = zustaende.get('b').dr[0];
  assert.deepEqual([wer, moenche], ['a', 5], 'Bert sieht, dass Anna ruft');
  assert.ok(rest <= 178 && rest >= 176, `und wie lange noch: ${rest} s`);
  assert.match(nebel.welt.nachricht('a', { auftrag: 'rufen', gebaeude: nebel.kloster.id }).fehler, /schon/);

  const { welt, kloster, drache } = dracheRufen();
  assert.ok(drache);
  // Ein zweites Ei im selben Kloster: trotzdem kein zweiter Drache.
  welt.eier.set(99, { id: 99, x: -1, y: -1, traeger: null, kloster: kloster.id, drache: null, gefallen: false, nest: { x: 0, y: 0 } });
  assert.match(welt.nachricht('a', { auftrag: 'rufen', gebaeude: kloster.id }).fehler, /schon einen Drachen/);

  const ohne = klosterMitEi();
  for (const ei of ohne.welt.eier.values()) ei.kloster = null;
  assert.match(ohne.welt.nachricht('a', { auftrag: 'rufen', gebaeude: ohne.kloster.id }).fehler, /Drachenei/);

  const aus = klosterMitEi({ drache: 'aus' });
  assert.match(aus.welt.nachricht('a', { auftrag: 'rufen', gebaeude: aus.kloster.id }).fehler, /keinen Drachen/);
  assert.equal(aus.welt.aufbau().werte.drache, undefined, 'und die Leiste bekommt die Regel nicht');
});

test('einheiten AC-52: der Drache fliegt ohne Wegsuche geradeaus ueber Wasser, Wald und Mauern', () => {
  const { welt, drache } = dracheRufen();
  // Ein Feld Wasser oder Wald, das zu Fuss nicht zu erreichen ist.
  const g = welt.karte.groesse;
  let ziel = null;
  for (let r = 5; r < g && !ziel; r++) {
    for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) {
      const x = Math.round(drache.x) + dx;
      const y = Math.round(drache.y) + dy;
      if (x < 0 || y < 0 || x >= g || y >= g) continue;
      if (!karten.begehbar(welt.karte, x, y)) {
        ziel = { x, y };
        break;
      }
    }
  }
  assert.ok(ziel, 'ein Hindernis auf der Karte');
  welt.befehl('a', [drache.id], ziel);
  assert.deepEqual(drache.weg, [ziel], 'ein Weg aus einem Stueck');
  const weite = Math.hypot(ziel.x - drache.x, ziel.y - drache.y);
  for (let t = 0; t < (weite / EINHEITEN.drache.tempo + 2) * TAKTE_PRO_SEKUNDE; t++) {
    welt.takten();
    assert.deepEqual(pruefen(welt), []);
  }
  assert.deepEqual({ x: drache.x, y: drache.y }, ziel, `in ${Math.ceil(weite / EINHEITEN.drache.tempo)} s geradeaus dort`);
});

test('einheiten AC-52: sein Feuer brennt alles im Umkreis eines Feldes, eigene auch, und geht als Feuer in den Zustand', () => {
  const { welt, drache } = dracheRufen();
  const mitte = { x: Math.round(drache.x) + 6, y: Math.round(drache.y) };
  const opfer = [
    welt.einheitAnlegen('b', mitte.x, mitte.y, 'miliz'),
    welt.einheitAnlegen('b', mitte.x + 0.8, mitte.y, 'miliz'),
    welt.einheitAnlegen('a', mitte.x, mitte.y + 0.9, 'dorfbewohner'),
  ];
  // Sie steht still, und kein Spaeher steht neben ihr: als Wache liefe sie
  // auf den Dorfbewohner los, und Annas Spaeherreiter am Dorf schlug sie -
  // dann belegte sie nicht mehr, dass das Feuer drei Felder daneben nicht
  // brennt (aufgefallen mit einheiten AC-76, das seine Sicht vergroesserte).
  for (const e of [...welt.einheiten.values()]) if (e.art === 'spaeherreiter') welt.einheiten.delete(e.id);
  const fern = Object.assign(welt.einheitAnlegen('b', mitte.x + 3, mitte.y, 'miliz'), { haltung: 'passiv' });
  welt.befehl('a', [drache.id], { x: mitte.x, y: mitte.y });
  let feuer = null;
  for (let t = 0; t < 10 * TAKTE_PRO_SEKUNDE && !feuer; t++) {
    welt.takten();
    feuer = (welt.zustand().p || []).find((s) => s[4] === 2) || null;
  }
  assert.ok(feuer, 'ein Feuerstoss im Zustand (fuenfter Wert 2)');
  takten(welt, 2);
  for (const e of opfer) assert.ok(e.leben < EINHEITEN[e.art].leben, `${e.art} von ${e.besitzer} brennt`);
  assert.equal(fern.leben, EINHEITEN.miliz.leben, 'drei Felder daneben nicht');
});

test('kampf AC-23: Nahkaempfer, Ramme und Mangonel treffen den Drachen nicht - ein Rechtsklick ist ein Gang, wachende lassen ihn in Ruhe; Schuetzen und die Burg treffen ihn', () => {
  const { welt, drache } = dracheRufen();
  drache.x = Math.round(drache.x);
  drache.y = Math.round(drache.y);
  welt.befehl('a', [drache.id], { x: drache.x, y: drache.y });
  const um = (dx) => ({ x: drache.x + dx, y: drache.y + 2 });
  const miliz = welt.einheitAnlegen('b', um(-2).x, um(-2).y, 'miliz');
  const ramme = welt.einheitAnlegen('b', um(0).x, um(0).y, 'ramme');
  const mangonel = welt.einheitAnlegen('b', um(2).x + 3, um(2).y + 3, 'mangonel');
  const armbrust = welt.einheitAnlegen('b', um(4).x, um(4).y, 'armbrustschuetze');
  welt.sichtAktualisieren();
  for (const e of [miliz, ramme, mangonel]) {
    welt.befehl('b', [e.id], { x: drache.x, y: drache.y });
    assert.notEqual(e.auftrag?.art, 'angreifen', `${e.art}: ein Gang`);
    assert.equal(welt.kannTreffen(e, drache), false, e.art);
  }
  welt.befehl('b', [armbrust.id], { x: drache.x, y: drache.y });
  assert.equal(armbrust.auftrag?.art, 'angreifen', 'der Armbrustschuetze greift an');
  assert.equal(welt.aufbau().werte.einheiten.miliz.trifftFlieger, false);
  assert.equal(welt.aufbau().werte.einheiten.armbrustschuetze.trifftFlieger, true);

  // Eine wachende Miliz neben ihm laesst ihn in Ruhe.
  const wache = welt.einheitAnlegen('b', drache.x + 1, drache.y - 1, 'miliz');
  welt.takten();
  welt.takten();
  takten(welt, 1);
  assert.notEqual(wache.auftrag?.ziel, drache.id, 'die Wache greift ihn nicht an');

  // Der Stein eines Mangonels trifft den Drachen nicht, auch mitten hinein.
  const leben = drache.leben;
  welt.einschlaege.push({ x: drache.x, y: drache.y, takte: 1, angreifer: mangonel, gebaeude: null });
  welt.takten();
  assert.ok(drache.leben >= leben - 20, 'kein Stein (hoechstens Pfeile)');

  // Die Burg trifft ihn.
  const neu = dracheRufen();
  // Allein, sonst schiesst sie zuerst auf die Moenche daneben.
  for (const e of [...neu.welt.einheiten.values()]) if (e !== neu.drache) neu.welt.einheiten.delete(e.id);
  const p = platzUm(neu.welt, 'burg', neu.drache, 4);
  neu.welt.gebaeudeAnlegen('b', 'burg', p.x, p.y, true);
  const vorher = neu.drache.leben;
  takten(neu.welt, 3);
  assert.ok(neu.drache.leben < vorher, 'die Burg schiesst auf ihn');
});

/**
 * Ein Gefecht des Drachen (einheiten AC-52, die drei Ziele): Bert hat eine
 * Burg und/oder Armbrustschuetzen, Anna einen Drachen 14 Felder davor, aus
 * einer Richtung, die der Startwert zieht. Der Drache greift die Burg an,
 * ohne Burg den naechsten Schuetzen. Zurueck: wer steht.
 */
/** Das naechste begehbare Feld ohne Gebaeude um `mitte`. */
function freiesFeldUm(welt, mitte) {
  for (let r = 0; r < 12; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = mitte.x + dx;
        const y = mitte.y + dy;
        if (karten.begehbar(welt.karte, x, y) && !welt.gebaeudeAn(x, y)) return { x, y };
      }
    }
  }
  throw new Error('kein freies Feld');
}

function drachenGefecht(startwert, { burg = false, armbrust = 0 }) {
  const welt = new Welt(ZWEI, startwert, { sicht: 'aufgedeckt' });
  welt.einheiten.clear();
  welt.tiere.clear();
  const [a, b] = welt.spieler.map((s) => s.basis);
  const mitte = { x: Math.round((a.x + b.x) / 2), y: Math.round((a.y + b.y) / 2) };
  const p = platzUm(welt, 'burg', mitte, 0);
  const festung = burg ? welt.gebaeudeAnlegen('b', 'burg', p.x, p.y, true) : null;
  const { x0, y0, x1, y1 } = welt.grundflaeche('burg', p.x, p.y);
  const zentrum = { x: (x0 + x1) / 2, y: (y0 + y1) / 2 };
  const schuetzen = [];
  // An der Burg stehen sie rundum verteilt, wie eine Wache steht - sonst
  // stuende der Drache je nach Anflug ausser Reichweite aller fuenf.
  for (let i = 0; burg && i < armbrust; i++) {
    const w = (i / armbrust) * Math.PI * 2;
    const feld = freiesFeldUm(welt, { x: Math.round(zentrum.x + Math.cos(w) * 4), y: Math.round(zentrum.y + Math.sin(w) * 4) });
    schuetzen.push(welt.einheitAnlegen('b', feld.x, feld.y, 'armbrustschuetze'));
  }
  for (let r = 0; !burg && schuetzen.length < armbrust && r < 12; r++) {
    for (let dy = -r; dy <= r && schuetzen.length < armbrust; dy++) {
      for (let dx = -r; dx <= r && schuetzen.length < armbrust; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const x = Math.round(zentrum.x) + dx;
        const y = Math.round(zentrum.y) + dy;
        if (!karten.begehbar(welt.karte, x, y) || welt.gebaeudeAn(x, y)) continue;
        schuetzen.push(welt.einheitAnlegen('b', x, y, 'armbrustschuetze'));
      }
    }
  }
  const zufall = karten.zufallAus((startwert * 7919 + 29) >>> 0);
  const winkel = zufall() * Math.PI * 2;
  const drache = welt.einheitAnlegen('a', zentrum.x + Math.cos(winkel) * 14, zentrum.y + Math.sin(winkel) * 14, 'drache');
  const ziel = festung ? { x: festung.x, y: festung.y } : null;
  const anzahl = schuetzen.length;
  for (let t = 0; t < 5 * 60 * TAKTE_PRO_SEKUNDE; t++) {
    // Wer nichts mehr tut, bekommt den Befehl neu - wie im Gefechtsstand.
    if (t % (2 * TAKTE_PRO_SEKUNDE) === 0 && !drache.tot && !drache.auftrag) {
      const naechster = schuetzen.filter((s) => !s.tot).sort((s, u) => Math.hypot(s.x - drache.x, s.y - drache.y) - Math.hypot(u.x - drache.x, u.y - drache.y))[0];
      const wohin = festung && welt.gebaeude.has(festung.id) ? ziel : naechster;
      if (wohin) welt.befehl('a', [drache.id], { x: Math.round(wohin.x), y: Math.round(wohin.y) });
    }
    welt.takten();
    const befunde = pruefen(welt);
    assert.deepEqual(befunde, [], `Startwert ${startwert}, Takt ${welt.takt}`);
    const burgSteht = festung && welt.gebaeude.has(festung.id);
    const lebend = schuetzen.filter((s) => !s.tot).length;
    if (drache.tot || (!burgSteht && !lebend)) break;
  }
  return {
    drache: !drache.tot,
    leben: Math.max(0, drache.leben),
    burg: festung ? welt.gebaeude.has(festung.id) : null,
    burgLeben: festung ? Math.max(0, festung.leben) : null,
    verloren: anzahl - schuetzen.filter((s) => !s.tot).length,
  };
}

const STARTWERTE = Array.from({ length: 20 }, (_, i) => i + 1);

test('einheiten AC-52: Gefechtsstand - eine Burg allein verliert gegen den Drachen, ueber zwanzig Startwerte', () => {
  const ergebnisse = STARTWERTE.map((s) => drachenGefecht(s, { burg: true }));
  const siege = ergebnisse.filter((e) => e.drache && !e.burg).length;
  console.log(`Burg allein: der Drache gewinnt ${siege} von 20, Leben uebrig ${ergebnisse.map((e) => e.leben).join(' ')}`);
  assert.equal(siege, 20);
});

test('einheiten AC-52: Gefechtsstand - eine Burg mit fuenf Armbrustschuetzen gewinnt gegen den Drachen, ueber zwanzig Startwerte', () => {
  const ergebnisse = STARTWERTE.map((s) => drachenGefecht(s, { burg: true, armbrust: 5 }));
  const siege = ergebnisse.filter((e) => !e.drache && e.burg).length;
  console.log(`Burg und fuenf Armbrust: sie gewinnen ${siege} von 20, Burg uebrig ${ergebnisse.map((e) => e.burgLeben).join(' ')}, verloren ${ergebnisse.map((e) => e.verloren).join(' ')}`);
  assert.equal(siege, 20);
});

test('einheiten AC-52: Gefechtsstand - zehn Armbrustschuetzen toeten den Drachen und verlieren dabei hoechstens die Haelfte, ueber zwanzig Startwerte', () => {
  const ergebnisse = STARTWERTE.map((s) => drachenGefecht(s, { armbrust: 10 }));
  const siege = ergebnisse.filter((e) => !e.drache && e.verloren <= 5).length;
  console.log(`Zehn Armbrust: ${siege} von 20, verloren ${ergebnisse.map((e) => e.verloren).join(' ')}`);
  assert.equal(siege, 20);
});

test('einheiten AC-54: der Drache frisst 1,6 Nahrung je Sekunde - ohne Nahrung hungert er mit 5 Leben je Sekunde, bis er faellt, wo er ist', () => {
  const { welt, drache, anna } = dracheRufen();
  anna.nahrung = 1000;
  takten(welt, 60);
  assert.equal(1000 - anna.nahrung, 96, 'in einer Minute 96 Nahrung - fuenf Bauern');
  assert.equal(drache.leben, EINHEITEN.drache.leben, 'satt verliert er nichts');
  anna.nahrung = 0;
  takten(welt, 10);
  const verlust = EINHEITEN.drache.leben - drache.leben;
  assert.ok(verlust >= 48 && verlust <= 50, `zehn Sekunden Hunger: ${verlust} Leben`);
  assert.equal(anna.nahrung, 0);
  const wo = { x: Math.round(drache.x), y: Math.round(drache.y) };
  bis(welt, () => drache.tot, 120, 'er verhungert');
  assert.equal(anna.nahrung, 0, 'nie unter null');
  const [ei] = [...welt.eier.values()].filter((e) => e.gefallen);
  assert.ok(ei, 'sein Ei liegt');
  assert.ok(Math.hypot(ei.x - wo.x, ei.y - wo.y) <= 3, 'dort, wo er fiel');
  assert.equal(welt.spielerVon('b').besiegtWert, 0, 'Hunger bringt niemandem Punkte');
});

test('einheiten AC-53: faellt der Drache, liegt dort sein Ei - alle sehen Ansage und Ei, auch im Nebel; wer es heimtraegt, ruft neu und bezahlt neu', () => {
  const lage = klosterMitEi({ sicht: 'nebel' });
  const { welt, kloster, anna } = lage;
  const moenche = moencheStellen(welt, kloster, 5);
  welt.nachricht('a', { auftrag: 'rufen', gebaeude: kloster.id });
  kloster.ruf.takte = DRACHE.rufen.sekunden * TAKTE_PRO_SEKUNDE - 1;
  takten(welt, 1);
  const drache = welt.dracheVon('a');
  // Er fliegt weit weg, ueber das Dorf von Bert hinaus, und faellt dort.
  const bert = welt.spielerVon('b').basis;
  drache.x = bert.x - 8;
  drache.y = bert.y;
  welt.einheitSterben(drache);
  const [ei] = [...welt.eier.values()].filter((e) => e.gefallen);
  assert.ok(ei && Math.hypot(ei.x - drache.x, ei.y - drache.y) <= 3, 'das Ei liegt, wo er fiel');
  assert.ok(karten.begehbar(welt.karte, ei.x, ei.y), 'auf einem Feld, auf dem man es aufheben kann');
  welt.sichtAktualisieren();
  const zustaende = welt.zustandJeSpieler(['a', 'b']);
  for (const id of ['a', 'b']) {
    assert.deepEqual(zustaende.get(id).df?.[0]?.slice(0, 3), ['a', ei.x, ei.y], `${id} sieht die Ansage`);
    assert.deepEqual(zustaende.get(id).ei, [[ei.id, ei.x, ei.y, 0, 1]], `${id} sieht das Ei`);
  }
  takten(welt, DRACHE.gefallen.sekunden + 1);
  assert.equal(welt.zustand().df, undefined, 'die Ansage vergeht');

  // Der alte Besitzer holt es heim und ruft neu - und bezahlt neu.
  const traeger = welt.einheitAnlegen('a', ei.x - 1, ei.y, 'dorfbewohner');
  welt.befehl('a', [traeger.id], { x: ei.x, y: ei.y });
  bis(welt, () => ei.kloster === kloster.id, 400, 'er traegt es ins Kloster');
  assert.equal(ei.gefallen, false);
  const nahrung = anna.nahrung;
  assert.deepEqual(welt.nachricht('a', { auftrag: 'rufen', gebaeude: kloster.id }), {});
  assert.equal(anna.nahrung, nahrung - DRACHE.rufen.kosten.nahrung, 'neu bezahlt');
  assert.ok(moenche.length === 5);
});

test('einheiten AC-53: faellt das Kloster waehrend des Rufs, ist das Gold fort und das Ei liegt am Boden', () => {
  const { welt, ei, kloster } = klosterMitEi();
  moencheStellen(welt, kloster, 5);
  welt.nachricht('a', { auftrag: 'rufen', gebaeude: kloster.id });
  takten(welt, 5);
  welt.gebaeudeZerstoeren(kloster);
  assert.equal(welt.eiAmBoden(ei), true);
  assert.equal(welt.zustand().dr, undefined);
  takten(welt, 200);
  assert.equal(welt.dracheVon('a'), null);
});

test('einheiten AC-74: der Drache fliegt einem Fliehenden ohne Stocken nach und speit dabei weiter', () => {
  const welt = neueWelt();
  welt.spielerVon('a').zeitalter = 2;
  // Eine freie Reihe von zwanzig Feldern neben Berts Dorf.
  const b = welt.spielerVon('b').basis;
  let start = null;
  for (let r = 6; r < 40 && !start; r++) {
    for (let dx = -r; dx <= r && !start; dx++) {
      const x = Math.round(b.x) + dx;
      const y = Math.round(b.y) + r;
      let frei = true;
      for (let k = 0; k < 20; k++) if (!karten.begehbar(welt.karte, x + k, y) || welt.gebaeudeAn(x + k, y)) frei = false;
      if (frei) start = { x, y };
    }
  }
  assert.ok(start, 'freies Land');
  const drache = welt.einheitAnlegen('a', start.x, start.y, 'drache');
  const opfer = welt.einheitAnlegen('b', start.x + 4, start.y, 'dorfbewohner');
  drache.leben = 9999;
  opfer.leben = 9999;
  welt.befehl('a', [drache.id], { x: opfer.x, y: opfer.y });
  assert.equal(drache.auftrag?.art, 'angreifen');
  // Der Dorfbewohner flieht geradeaus, vom Drachen fort.
  welt.befehl('b', [opfer.id], { x: start.x + 19, y: start.y });
  let halte = 0;
  let flog = null;
  let inReichweite = 0;
  const reichweite = EINHEITEN.drache.reichweite;
  for (let t = 0; t < 15 * TAKTE_PRO_SEKUNDE; t++) {
    const x0 = drache.x;
    const y0 = drache.y;
    welt.takten();
    assert.deepEqual(pruefen(welt), []);
    const fliegt = Math.hypot(drache.x - x0, drache.y - y0) > 1e-6;
    if (flog === true && !fliegt) halte++;
    flog = fliegt;
    if (Math.hypot(opfer.x - drache.x, opfer.y - drache.y) <= reichweite) inReichweite++;
  }
  assert.ok(opfer.weg.length || opfer.x > start.x + 15, 'er flieht noch oder ist weit gelaufen');
  assert.ok(halte <= 1, `hoechstens ein Halt, solange er flieht - ${halte}`);
  assert.ok(inReichweite >= 12 * TAKTE_PRO_SEKUNDE, `meist in Reichweite - ${inReichweite} Takte`);
  assert.ok(opfer.leben < 9999 - 8 * 3, `er speit weiter - ${9999 - opfer.leben} Schaden`);
});
