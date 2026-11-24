// Die KI und der Drache (ki AC-29): sie holt ein Ei, bringt es ins Kloster,
// stellt fuenf Moenche dazu und ruft - in der Krone, wenn sie nicht
// ueberlegen ist, im Fuerstentum nur, wenn sie unterlegen ist (Variante A,
// Benutzer 2026-11-22); ruft ein Gegner, geht ihr Heer auf sein Kloster,
// und droht ein Drache, bildet sie zuerst Schuetzen aus.
//
// Gebaute Lagen; ob sie in ganzen Partien ruft und wer dann gewinnt, zaehlt
// `tests/partien/ki-im-nebel.test.mjs` (einheiten AC-52).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { DRACHE, EINHEITEN } = require('../server/spiele/strategie/daten.js');
const { Ki, DRACHE_ZEITALTER, DRACHE_MOENCHE, DRACHE_FUTTER, EI_GESPERRT_SEKUNDEN, EI_WEG_SEKUNDEN, EI_SUCHE_GLEICH } = require('../server/spiele/strategie/ki.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

const gebaeudeVon = (welt, id) => [...welt.gebaeude.values()].filter((g) => g.besitzer === id);
const einheitenVon = (welt, id) => [...welt.einheiten.values()].filter((e) => e.besitzer === id && !e.tot);
const dorf = (welt, id) => einheitenVon(welt, id).filter((e) => e.art === 'dorfbewohner');

/** Ein fertiges Gebaeude, der erste freie Platz etwa `d` Felder vom Dorf des Spielers. */
function bauen(welt, id, art, d) {
  const s = welt.spielerVon(id);
  for (let r = d; r < d + 20; r++) {
    for (let w = 0; w < 360; w += 15) {
      const x = Math.round(s.basis.x + r * Math.cos((w * Math.PI) / 180));
      const y = Math.round(s.basis.y + r * Math.sin((w * Math.PI) / 180));
      if (welt.platzPruefen(art, x, y)) return welt.gebaeudeAnlegen(id, art, x, y, true);
    }
  }
  throw new Error(`kein Platz fuer ${art}`);
}

/** Anna in der Krone nach ihrem ersten Aufbruch, ihre KI und was sie sendet. */
function lage({ kloster = true, vorrat = 3000, aufbruch = true, einstellungen = {}, zeitalter = DRACHE_ZEITALTER } = {}) {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt', ...einstellungen });
  welt.takt = 30 * 600;
  for (const s of welt.spieler) s.zeitalter = zeitalter;
  const a = welt.spielerVon('a');
  Object.assign(a, { holz: vorrat, nahrung: vorrat, gold: vorrat, stein: vorrat });
  for (let i = 0; i < 4; i++) bauen(welt, 'a', 'haus', 12);
  const k = kloster ? bauen(welt, 'a', 'kloster', 6) : null;
  const ki = new Ki(welt, 'a');
  if (aufbruch) ki.angriffTakt = 1;
  const gesendet = [];
  const senden = ki.senden.bind(ki);
  ki.senden = (n) => { gesendet.push(n); return senden(n); };
  return { welt, a, ki, kloster: k, gesendet };
}

const pruefen = ({ welt, ki }) => {
  ki.wahrnehmen();
  ki.drachePruefen(einheitenVon(welt, 'a'), gebaeudeVon(welt, 'a'), dorf(welt, 'a'));
};

/** `n` Speerkaempfer fuer `id`, nahe dem Dorf von `bei` (Vorgabe: das eigene) - im Bild fuer jeden. */
function heerStellen(welt, id, n, bei = welt.spielerVon(id)) {
  for (let i = 0; i < n; i++) welt.einheitAnlegen(id, bei.basis.x + 5 + (i % 4), bei.basis.y + 5 + Math.floor(i / 4), 'speerkaempfer');
}

/** Das Ei auf ein freies Feld nahe Annas Dorf - im Spiel liegt es zwischen den Doerfern. */
function eiNahe(welt, a, d = 8) {
  const [ei] = welt.eier.values();
  for (let r = d; r < d + 10; r++) {
    const x = Math.round(a.basis.x - r);
    const y = Math.round(a.basis.y);
    if (welt.platzPruefen('haus', x, y)) return Object.assign(ei, { x, y });
  }
  throw new Error('kein Platz fuer das Ei');
}

/** Moenche um das Kloster stellen, jeder auf ein freies Randfeld. */
function moencheStellen(welt, kloster, anzahl) {
  const { x0, y0, x1, y1 } = welt.grundflaeche(kloster.art, kloster.x, kloster.y);
  const rand = [];
  for (let x = x0 - 1; x <= x1 + 1; x++) rand.push({ x, y: y0 - 1 }, { x, y: y1 + 1 });
  const felder = rand.filter((f) => karten.begehbar(welt.karte, f.x, f.y) && !welt.gebaeudeAn(f.x, f.y));
  assert.ok(felder.length >= anzahl, 'Platz fuer die Moenche');
  return felder.slice(0, anzahl).map((f) => welt.einheitAnlegen('a', f.x, f.y, 'moench'));
}

test('ki AC-29: kennt sie ein Ei und hat kein Kloster, baut sie eins - und mit Kloster schickt sie einen Dorfbewohner, der das Ei hineintraegt', () => {
  const ohne = lage({ kloster: false });
  eiNahe(ohne.welt, ohne.a);
  pruefen(ohne);
  const bau = ohne.gesendet.find((n) => n.auftrag === 'bauen');
  assert.equal(bau?.art, 'kloster', 'ohne Kloster baut sie eins');

  const l = lage();
  const ei = eiNahe(l.welt, l.a);
  pruefen(l);
  const holer = dorf(l.welt, 'a').find((e) => e.auftrag?.art === 'ei');
  assert.ok(holer, 'ein Dorfbewohner holt das Ei');
  // Die KI laeuft mit: der Traeger bringt das Ei ins Kloster.
  for (let t = 0; t < 120 * TAKTE_PRO_SEKUNDE && ei.kloster === null; t++) {
    l.welt.takten();
    if (t % 5 === 0) l.ki.entscheiden();
  }
  assert.equal(ei.kloster, l.kloster.id, 'das Ei liegt im Kloster');
});

test('ki AC-29: liegt das Ei im Kloster, bildet sie fuenf Moenche aus, stellt sie ans Kloster und ruft', () => {
  const l = lage();
  const [ei] = l.welt.eier.values();
  Object.assign(ei, { x: -1, y: -1, kloster: l.kloster.id });
  assert.equal(DRACHE_MOENCHE, DRACHE.rufen.moenche, 'so viele, wie das Rufen verlangt');
  pruefen(l);
  assert.ok(l.gesendet.some((n) => n.auftrag === 'ausbilden' && n.einheit === 'moench' && n.gebaeude === l.kloster.id), 'ein Moench bestellt');
  // Weiter, bis der Ruf laeuft - nur der Drache, sonst fuellte das Militaer
  // den Wohnraum.
  for (let t = 0; t < 600 * TAKTE_PRO_SEKUNDE && !l.welt.rufVon('a'); t++) {
    l.welt.takten();
    if (t % 5 === 0) pruefen(l);
  }
  assert.ok(l.welt.rufVon('a'), 'sie ruft');
  assert.ok(l.welt.moencheAm(l.kloster) >= DRACHE_MOENCHE, 'die Moenche stehen am Kloster');
});

test('ki AC-29: nicht vor dem ersten Aufbruch, nicht vor dem Fuerstentum, im Fuerstentum nur unterlegen, nicht ueberlegen, nicht mit abgeschaltetem Drachen', () => {
  assert.equal(DRACHE_ZEITALTER, 3, 'gerufen wird in der Krone');
  for (const [name, werte, zeitalter, vorbereiten] of [
    ['vor dem ersten Aufbruch', { aufbruch: false }, 3],
    ['im Lehen', {}, 1],
    ['im Fuerstentum, nicht unterlegen', {}, 2],
    ['in der Krone, ueberlegen', {}, 3, (l) => heerStellen(l.welt, 'a', 12)],
    ['Drache aus', { einstellungen: { drache: 'aus' } }, 3],
  ]) {
    const l = lage({ kloster: false, ...werte });
    l.a.zeitalter = zeitalter;
    vorbereiten?.(l);
    if (l.welt.eier.size) eiNahe(l.welt, l.a);
    pruefen(l);
    assert.deepEqual(l.gesendet, [], name);
  }
});

test('ki AC-29: im Fuerstentum ruft, wer unterlegen ist - sie sieht mehr fremde Kampfeinheiten, als sie hat', () => {
  const l = lage({ kloster: false, zeitalter: 2 });
  eiNahe(l.welt, l.a);
  heerStellen(l.welt, 'b', 6, l.a);
  pruefen(l);
  assert.ok(l.ki.unterlegen(), 'unterlegen');
  assert.equal(l.gesendet.find((n) => n.auftrag === 'bauen')?.art, 'kloster', 'sie baut ein Kloster fuer das Ei');
});

test('ki AC-29: stehen die Moenche und fehlt der Preis, liegt er zurueck - und solange ihr Drache lebt, eine Minute Futter', () => {
  const l = lage({ vorrat: 0 });
  const [ei] = l.welt.eier.values();
  Object.assign(ei, { x: -1, y: -1, kloster: l.kloster.id });
  moencheStellen(l.welt, l.kloster, DRACHE_MOENCHE);
  pruefen(l);
  assert.equal(l.welt.rufVon('a'), null, 'unbezahlt kein Ruf');
  const r = l.ki.ruecklage();
  assert.equal(r.nahrung, DRACHE.rufen.kosten.nahrung);
  assert.equal(r.gold, DRACHE.rufen.kosten.gold);

  const m = lage();
  m.welt.einheitAnlegen('a', m.a.basis.x + 4, m.a.basis.y + 4, 'drache');
  assert.equal(m.ki.ruecklage().nahrung, DRACHE_FUTTER, 'Futter fuer den Drachen');
  assert.equal(DRACHE_FUTTER, Math.ceil(DRACHE.fressen.nahrungJeSekunde * 60));
});

test('ki AC-29: ruft ein Gegner, ist sein Kloster das Ziel ihres Heers - und sie bildet zuerst aus, was einen Drachen trifft', () => {
  const l = lage();
  const bk = bauen(l.welt, 'b', 'kloster', 6);
  bk.ruf = { ei: 0, takte: 0, moenche: DRACHE_MOENCHE };
  const ziel = l.ki.fremdesWunder();
  assert.equal(ziel?.id, bk.id, 'das rufende Kloster ist das Vorrangziel');
  assert.ok(l.ki.dracheDroht(), 'ein Drache droht');
  // Kaserne und Schiessanlage, je eine: die Schiessanlage bekommt den Auftrag.
  bauen(l.welt, 'a', 'kaserne', 10);
  const schiess = bauen(l.welt, 'a', 'schiessanlage', 14);
  Object.assign(l.a, { holz: 60, nahrung: 60, gold: 60 });
  l.ki.militaerPruefen(gebaeudeVon(l.welt, 'a'), dorf(l.welt, 'a'));
  const erste = l.gesendet.find((n) => n.auftrag === 'ausbilden');
  assert.equal(erste?.gebaeude, schiess.id, 'zuerst die Schiessanlage');
  assert.ok(EINHEITEN[erste.einheit].klassen.some((k) => EINHEITEN.drache.fliegt.getroffenVon.includes(k)), `${erste.einheit} trifft den Drachen`);

  // Ohne Schiessanlage baut sie eine.
  const o = lage();
  bauen(o.welt, 'b', 'kloster', 6).ruf = { ei: 0, takte: 0, moenche: DRACHE_MOENCHE };
  bauen(o.welt, 'a', 'kaserne', 10);
  o.ki.militaerPruefen(gebaeudeVon(o.welt, 'a'), dorf(o.welt, 'a'));
  assert.ok(o.gesendet.some((n) => n.auftrag === 'bauen' && n.art === 'schiessanlage'), 'eine Schiessanlage gebaut');
});

test('ki AC-29: hat sie einen fremden Drachen gesehen, geht ihr Heer auf das Kloster seines Besitzers statt aufs Dorfzentrum', () => {
  const l = lage();
  const bk = bauen(l.welt, 'b', 'kloster', 6);
  const b = l.welt.spielerVon('b');
  l.ki.wahrnehmen();
  const vorher = l.ki.gegnerZiel(b);
  const zentrum = gebaeudeVon(l.welt, 'b').find((g) => g.art === 'dorfzentrum');
  assert.deepEqual(vorher, { x: zentrum.x, y: zentrum.y }, 'ohne Drachen das Dorfzentrum');
  l.welt.einheitAnlegen('b', b.basis.x + 3, b.basis.y + 3, 'drache');
  // Sie nimmt einmal je Takt wahr.
  l.welt.takt += 1;
  l.ki.wahrnehmen();
  assert.deepEqual(l.ki.gegnerZiel(b), { x: bk.x, y: bk.y }, 'mit Drachen das Kloster');
});

test('ki AC-29: kommt der Holer nicht ans Ei, steht dieses Ei eine Weile zurueck', () => {
  const l = lage();
  const ei = eiNahe(l.welt, l.a);
  pruefen(l);
  const holer = dorf(l.welt, 'a').find((e) => e.auftrag?.art === 'ei');
  assert.ok(holer);
  holer.auftrag = null;
  holer.weg = [];
  // Er hat seine Zeit gehabt.
  l.welt.takt += EI_WEG_SEKUNDEN * TAKTE_PRO_SEKUNDE + 1;
  pruefen(l);
  assert.ok(l.ki.eiGesperrt.get(ei.id) > l.welt.takt, 'gesperrt');
  assert.ok(l.ki.eiGesperrt.get(ei.id) <= l.welt.takt + EI_GESPERRT_SEKUNDEN * TAKTE_PRO_SEKUNDE);
  assert.ok(!dorf(l.welt, 'a').some((e) => e.auftrag?.art === 'ei'), 'niemand holt es gleich wieder');
});

test('ki AC-29: kennt sie die Gegner, aber kein Ei, reitet ihr Spaeher zwischen ihr Dorf und das fremde - und dort findet er es', () => {
  const welt = new Welt(ZWEI, 7, {});
  const ki = new Ki(welt, 'a');
  const a = welt.spielerVon('a');
  a.zeitalter = 2;
  const zentrumB = gebaeudeVon(welt, 'b').find((g) => g.art === 'dorfzentrum');
  // Gesehen hat sie das fremde Dorf, das Ei nicht.
  ki.gesehen.set(zentrumB.id, { id: zentrumB.id, art: zentrumB.art, x: zentrumB.x, y: zentrumB.y, besitzer: 'b' });
  const spaeher = einheitenVon(welt, 'a').find((e) => e.art === 'spaeherreiter');
  assert.ok(spaeher, 'sie hat einen Spaeher');
  const [ei] = welt.eier.values();
  welt.sichtAktualisieren();
  assert.ok(!welt.sieht('a', ei.x, ei.y), 'das Ei liegt im Nebel');
  ki.wahrnehmen();
  assert.equal(ki.eierBekannt.size, 0);
  ki.erkunden(einheitenVon(welt, 'a'));
  const punkt = ki.eiSuche;
  assert.ok(punkt, 'sie sucht');
  assert.equal(ki.eiSucher, spaeher.id, 'der Spaeher sucht');
  const eigen = Math.hypot(punkt.x - a.basis.x, punkt.y - a.basis.y);
  const fremd = Math.hypot(punkt.x - zentrumB.x, punkt.y - zentrumB.y);
  assert.ok(Math.abs(eigen - fremd) <= EI_SUCHE_GLEICH, `zwischen beiden Doerfern (${eigen.toFixed(1)} und ${fremd.toFixed(1)})`);
  assert.ok(spaeher.weg.length > 0, 'er reitet los');
  // Sie reitet Punkte ab, bis sie das Ei kennt.
  for (let t = 0; t < 20 * 60 * TAKTE_PRO_SEKUNDE && !ki.eierBekannt.size; t++) {
    welt.takten();
    if (t % 5 === 0) {
      ki.wahrnehmen();
      ki.erkunden(einheitenVon(welt, 'a'));
    }
  }
  assert.ok(ki.eierBekannt.has(ei.id), 'gefunden');
  welt.takt += 1;
  ki.wahrnehmen();
  ki.erkunden(einheitenVon(welt, 'a'));
  assert.equal(ki.eiSuche, null, 'danach sucht sie nicht mehr');
});

test('ki AC-29: vor dem Fuerstentum und wer ueberlegen ist, sucht ihr Spaeher kein Ei - sie riefe ihn nicht', () => {
  for (const [name, zeitalter, vorbereiten] of [
    ['im Lehen', 1, () => {}],
    ['im Fuerstentum, ueberlegen', 2, (ki) => { ki.ueberlegen = () => true; }],
    ['in der Krone, ueberlegen', DRACHE_ZEITALTER, (ki) => { ki.ueberlegen = () => true; }],
  ]) {
    const welt = new Welt(ZWEI, 7, {});
    const ki = new Ki(welt, 'a');
    welt.spielerVon('a').zeitalter = zeitalter;
    ki.angriffTakt = 1;
    vorbereiten(ki);
    const zentrumB = gebaeudeVon(welt, 'b').find((g) => g.art === 'dorfzentrum');
    ki.gesehen.set(zentrumB.id, { id: zentrumB.id, art: zentrumB.art, x: zentrumB.x, y: zentrumB.y, besitzer: 'b' });
    welt.sichtAktualisieren();
    ki.wahrnehmen();
    ki.erkunden(einheitenVon(welt, 'a'));
    assert.equal(ki.eiSuche, null, `${name}: keine Suche`);
  }
});

test('ki AC-29: liegt das Ei, das sie kennt, im Nebel, geht der Holer erst hin und hebt es auf, sobald er es sieht', () => {
  const l = lage({ einstellungen: { sicht: 'nebel' } });
  const ei = eiNahe(l.welt, l.a, 30);
  l.welt.sichtAktualisieren();
  assert.ok(!l.welt.sieht('a', ei.x, ei.y), 'das Ei liegt im Nebel');
  l.ki.eierBekannt.set(ei.id, { id: ei.id, x: ei.x, y: ei.y });
  pruefen(l);
  const holer = l.welt.einheiten.get(l.ki.eiHoler?.einheit);
  assert.ok(holer, 'einer geht hin');
  assert.notEqual(holer.auftrag?.art, 'ei', 'aufheben kann er es von daheim nicht');
  assert.ok(holer.weg.length > 0);
  for (let t = 0; t < EI_WEG_SEKUNDEN * TAKTE_PRO_SEKUNDE && ei.traeger !== holer.id; t++) {
    l.welt.takten();
    if (t % 5 === 0) pruefen(l);
  }
  assert.equal(ei.traeger, holer.id, 'er traegt es');
  assert.ok(!l.ki.eiGesperrt.has(ei.id), 'nicht gesperrt');
});
