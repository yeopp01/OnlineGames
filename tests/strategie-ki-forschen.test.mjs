// Die KI erforscht (ki AC-35): Stufen fuer die Einheiten, die sie haelt,
// Verbesserungen fuer ihr Militaer und ihre Wirtschaft - gelesen aus den
// Daten der Verbesserung, nie nach dem Namen. Zuerst, was ihrem Schwerpunkt
// nuetzt; nichts, dessen Vorstufe fehlt; nichts, was sie nicht bezahlen kann.
// Alles ueber `welt.nachricht`, wie ein Mensch.
//
// Gebaute Lagen; was das ueber ganze Partien ausmacht, zaehlt
// `tests/partien/ki-im-nebel.test.mjs`.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');
const { GEBAEUDE, VERBESSERUNGEN, HAEUSER } = require('../server/spiele/strategie/daten.js');
const karten = require('../server/spiele/strategie/karte.js');
const { Ki, FORSCHEN_ZUGLEICH, FORSCHEN_PUFFER, FORSCHEN_WARTEN, GOLD_KNAPP } = require('../server/spiele/strategie/ki.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

const eigene = (welt, id) => [...welt.einheiten.values()].filter((e) => e.besitzer === id && !e.tot);
const gebaeudeVon = (welt, id) => [...welt.gebaeude.values()].filter((g) => g.besitzer === id);
const dorf = (welt, id) => eigene(welt, id).filter((e) => e.art === 'dorfbewohner');

/** Anna im Fuerstentum mit `haus`, ihre KI nach dem ersten Aufbruch, und was die KI sendet. */
function lage({ haus = 'distelhag', vorrat = 3000, aufbruch = true, zeitalter = 2 } = {}) {
  const welt = new Welt(ZWEI, 7, { sicht: 'aufgedeckt', haeuser: { a: haus, b: 'eschenbruch' } });
  for (const s of welt.spieler) s.zeitalter = zeitalter;
  const a = welt.spielerVon('a');
  Object.assign(a, { holz: vorrat, nahrung: vorrat, gold: vorrat, stein: vorrat });
  const ki = new Ki(welt, 'a');
  if (aufbruch) ki.angriffTakt = 1;
  const gesendet = [];
  const senden = ki.senden.bind(ki);
  ki.senden = (n) => { gesendet.push(n); return senden(n); };
  return { welt, a, ki, gesendet };
}

/** Ein fertiges Gebaeude fuer Anna, der erste freie Platz etwa `d` Felder von ihrem Dorf. */
function bauen(welt, a, art, d) {
  for (let w = 0; w < 360; w += 15) {
    const x = Math.round(a.basis.x + d * Math.cos((w * Math.PI) / 180));
    const y = Math.round(a.basis.y + d * Math.sin((w * Math.PI) / 180));
    if (welt.platzPruefen(art, x, y)) return welt.gebaeudeAnlegen('a', art, x, y);
  }
  throw new Error(`kein Platz fuer ${art}`);
}

/** `n` Einheiten der Art fuer Anna neben ihrem Dorf. */
function aufstellen(welt, a, art, n, dy = 6) {
  for (let i = 0; i < n; i++) welt.einheitAnlegen('a', a.basis.x - 3 + (i % 6), a.basis.y + dy + Math.floor(i / 6), art);
}

/** Kaserne, Schiessanlage, Stall und Schmiede, dazu ein gemischtes Heer. */
function heer(welt, a) {
  for (const [i, art] of ['kaserne', 'schiessanlage', 'stall', 'schmiede'].entries()) bauen(welt, a, art, 9 + 3 * i);
  aufstellen(welt, a, 'speerkaempfer', 2, 6);
  aufstellen(welt, a, 'bogenschuetze', 6, 7);
  aufstellen(welt, a, 'ritter', 4, 8);
}

const pruefen = ({ welt, ki }) => ki.forschenPruefen(eigene(welt, 'a'), gebaeudeVon(welt, 'a'), dorf(welt, 'a'));
const forschung = (gesendet) => gesendet.filter((n) => n.auftrag === 'ausbilden' && VERBESSERUNGEN[n.einheit]);

test('ki AC-35: zuerst die Stufe ihres Schwerpunkts - auch fuer weniger Einheiten, als die Schmiede trifft', () => {
  for (const haus of ['distelhag', 'rappenstein', 'eschenbruch']) {
    const l = lage({ haus });
    heer(l.welt, l.a);
    pruefen(l);
    const [erste] = forschung(l.gesendet);
    assert.ok(erste, `${haus}: eine Verbesserung bestellt`);
    const schwerpunkt = HAEUSER[haus].ki.schwerpunkt;
    const g = l.welt.gebaeude.get(erste.gebaeude);
    assert.equal(g.art, schwerpunkt, `${haus}: im Schwerpunkt ${schwerpunkt} bestellt, nicht ${g.art}`);
    assert.ok(VERBESSERUNGEN[erste.einheit].wandelt, `${haus}: ${erste.einheit} ist eine Stufe`);
  }
});

test('ki AC-35: Distelhag stuft ihre zwei Speerkaempfer zuerst - die Stufe aus den Daten, nicht nach dem Namen', () => {
  const l = lage({ haus: 'distelhag' });
  heer(l.welt, l.a);
  pruefen(l);
  const [erste] = forschung(l.gesendet);
  const v = VERBESSERUNGEN[erste.einheit];
  assert.ok(Object.keys(v.wandelt).includes('speerkaempfer'), `${erste.einheit} tauscht den Speerkaempfer aus`);
});

test('ki AC-35: nichts, dessen Vorstufe fehlt, nichts ueber ihrem Zeitalter, nichts eines fremden Hauses', () => {
  const l = lage({ haus: 'rappenstein' });
  heer(l.welt, l.a);
  for (const art of ['muehle', 'holzfaellerlager', 'bergbaulager', 'universitaet', 'kloster']) bauen(l.welt, l.a, art, 22);
  aufstellen(l.welt, l.a, 'miliz', 6, 9);
  const liste = l.ki.forschungen(eigene(l.welt, 'a'), gebaeudeVon(l.welt, 'a'), dorf(l.welt, 'a'));
  assert.ok(liste.length >= 5, `genug zur Wahl (${liste.length})`);
  for (const k of liste) {
    const v = VERBESSERUNGEN[k.name];
    if (v.vorstufe) assert.ok(l.a.verbesserungen.includes(v.vorstufe), `${k.name}: Vorstufe ${v.vorstufe} erforscht`);
    assert.ok((v.zeitalter || 0) <= l.a.zeitalter, `${k.name}: nicht ueber dem Zeitalter`);
    assert.ok(l.welt.hausBildetAus(l.a, k.name), `${k.name}: das Haus darf es`);
  }
  // Die Reihenfolge: Schwerpunkt, dann Militaer, dann Wirtschaft.
  for (let i = 1; i < liste.length; i++) assert.ok(liste[i - 1].gruppe <= liste[i].gruppe, 'nach Gruppe sortiert');
  // Mit erforschter Vorstufe kommt die naechste dazu.
  const ohne = liste.find((k) => k.name === 'langschwertstufe');
  assert.equal(ohne, undefined, 'die Stufe nach dem Soldaten erst nach dem Soldaten');
  l.a.verbesserungen.push('soldatenstufe');
  const danach = l.ki.forschungen(eigene(l.welt, 'a'), gebaeudeVon(l.welt, 'a'), dorf(l.welt, 'a'));
  assert.ok(danach.every((k) => k.name !== 'soldatenstufe'), 'was erforscht ist, nicht noch einmal');
});

test('ki AC-35: hoechstens zwei zugleich, je Gebaeude eine', () => {
  const l = lage({ haus: 'distelhag' });
  heer(l.welt, l.a);
  for (let i = 0; i < 6; i++) { pruefen(l); }
  const bestellt = forschung(l.gesendet);
  assert.equal(bestellt.length, FORSCHEN_ZUGLEICH, `${FORSCHEN_ZUGLEICH} bestellt`);
  assert.equal(new Set(bestellt.map((n) => n.gebaeude)).size, bestellt.length, 'in verschiedenen Gebaeuden');
});

test('ki AC-35: bei knappem Vorrat keine Verbesserung - fuer die erste legt sie zurueck, hoechstens neunzig Sekunden', () => {
  const l = lage({ haus: 'distelhag', vorrat: 40 });
  heer(l.welt, l.a);
  const [zuerst] = l.ki.forschungen(eigene(l.welt, 'a'), gebaeudeVon(l.welt, 'a'), dorf(l.welt, 'a'));
  pruefen(l);
  assert.equal(forschung(l.gesendet).length, 0, 'knapp: nichts bestellt');
  assert.deepEqual(l.ki.forschungFehlt, l.welt.auftragKosten('a', zuerst.name), `fuer ${zuerst.name} liegt der Preis zurueck`);
  for (const [r, n] of Object.entries(l.ki.forschungFehlt)) assert.ok(l.ki.ruecklage()[r] >= n, `die Ruecklage traegt ${r}`);
  // Nach Ablauf der Wartezeit steht diese Verbesserung zurueck.
  l.welt.takt += (FORSCHEN_WARTEN + 1) * TAKTE_PRO_SEKUNDE;
  pruefen(l);
  assert.ok(l.ki.forschungZurueck.get(zuerst.name) > l.welt.takt, `${zuerst.name} steht zurueck`);
  pruefen(l);
  assert.equal(forschung(l.gesendet).length, 0, 'auch danach nichts bestellt');
  assert.notEqual(l.ki.forschungWartet?.name, zuerst.name, 'gewartet wird auf eine andere');

  // Der Puffer: was genau die Kosten hat, bezahlt sie nicht ausser der ersten.
  const p = lage({ haus: 'distelhag', vorrat: 0 });
  heer(p.welt, p.a);
  const [erste, zweite] = p.ki.forschungen(eigene(p.welt, 'a'), gebaeudeVon(p.welt, 'a'), dorf(p.welt, 'a'));
  const k2 = p.welt.auftragKosten('a', zweite.name);
  Object.assign(p.a, { holz: 0, nahrung: 0, gold: 0, stein: 0 }, k2);
  assert.ok(Object.entries(p.welt.auftragKosten('a', erste.name)).some(([r, n]) => (k2[r] || 0) < n), 'die erste ist damit nicht bezahlt');
  pruefen(p);
  assert.equal(forschung(p.gesendet).filter((n) => n.einheit === zweite.name).length, 0,
    `ohne ${FORSCHEN_PUFFER} Puffer nicht die zweite`);
});

test('ki AC-35: vor dem ersten Aufbruch nichts, und nichts, solange das Heer auf Rammen oder der Handel auf Markt oder Karren wartet', () => {
  const vorher = lage({ aufbruch: false });
  heer(vorher.welt, vorher.a);
  pruefen(vorher);
  assert.equal(forschung(vorher.gesendet).length, 0, 'vor dem ersten Aufbruch');

  const rammen = lage();
  heer(rammen.welt, rammen.a);
  rammen.ki.belagerungFehlt = { holz: 160, gold: 75 };
  pruefen(rammen);
  assert.equal(forschung(rammen.gesendet).length, 0, 'solange Rammen fehlen');

  for (const fehlt of ['marktFehlt', 'karrenFehlt']) {
    const handel = lage();
    heer(handel.welt, handel.a);
    handel.ki[fehlt] = true;
    pruefen(handel);
    assert.equal(forschung(handel.gesendet).length, 0, `solange ${fehlt}`);
  }
  // Gegenprobe: dieselbe Lage ohne die Luecken forscht.
  const frei = lage();
  heer(frei.welt, frei.a);
  pruefen(frei);
  assert.ok(forschung(frei.gesendet).length > 0, 'ohne Luecke wird geforscht');
});

test('ki AC-35: ist das Gold in Reichweite knapp, forscht sie erst, wenn der Handel laeuft - wer aus Neigung handelt, forscht weiter', () => {
  const knapp = () => {
    const l = lage();
    heer(l.welt, l.a);
    const { karte } = l.welt;
    for (const index of [...karte.vorrat.keys()]) if (karte.felder[index] === karten.GOLD) karte.vorrat.set(index, 0);
    l.ki.goldfelder = null;
    assert.ok(l.ki.goldInReichweite() < GOLD_KNAPP, 'das Gold daheim ist leer');
    l.ki.handelSeit = 1;
    return l;
  };
  // Der Markt steht, aber noch keine vier Karren: sie forscht nicht.
  const warten = knapp();
  pruefen(warten);
  assert.equal(forschung(warten.gesendet).length, 0, 'ohne laufenden Handel nichts');
  // Mit vier Karren laeuft der Handel - sie forscht.
  const laeuft = knapp();
  aufstellen(laeuft.welt, laeuft.a, 'marktkarren', 4, 10);
  assert.ok(laeuft.ki.handelLaeuft(eigene(laeuft.welt, 'a')));
  pruefen(laeuft);
  assert.ok(forschung(laeuft.gesendet).length > 0, 'mit laufendem Handel wird geforscht');
  // Handelt sie aus Neigung bei vollem Gold, wartet sie nicht auf die Karren.
  const reich = lage();
  heer(reich.welt, reich.a);
  reich.ki.handelSeit = 1;
  assert.ok(reich.ki.goldInReichweite() >= GOLD_KNAPP);
  pruefen(reich);
  assert.ok(forschung(reich.gesendet).length > 0, 'bei vollem Gold wird geforscht, auch ohne Karren');
});

test('ki AC-35: das Dorfzentrum forscht erst, wenn ihre Dorfbewohner stehen - sonst stuende der Ersatz dahinter', () => {
  const l = lage({ haus: 'distelhag' });
  const zentrum = gebaeudeVon(l.welt, 'a').find((g) => g.art === 'dorfzentrum');
  const ausDemZentrum = () => l.ki.forschungen(eigene(l.welt, 'a'), gebaeudeVon(l.welt, 'a'), dorf(l.welt, 'a'))
    .filter((k) => k.gebaeude === zentrum);
  assert.equal(ausDemZentrum().length, 0, `mit ${dorf(l.welt, 'a').length} Dorfbewohnern nichts aus dem Dorfzentrum`);
  aufstellen(l.welt, l.a, 'dorfbewohner', 40, 6);
  const nachher = ausDemZentrum();
  assert.ok(nachher.length > 0, 'mit vollem Dorf forscht das Dorfzentrum');
  assert.ok(nachher.every((k) => GEBAEUDE.dorfzentrum.bildetAus.includes(k.name)), 'nur, was das Dorfzentrum hat');
  zentrum.schlange.push('dorfbewohner');
  assert.equal(ausDemZentrum().length, 0, 'nicht, solange es ausbildet');
});
