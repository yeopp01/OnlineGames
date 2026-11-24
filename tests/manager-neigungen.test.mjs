// Neigungen der Spieler (kader AC-27, AC-29 bis AC-33): was einen Spieler
// neben Staerke und Talent ausmacht, abgeleitet aus Kennung und Startwert.
// Reine Rechenteile, deshalb direkt geprueft (→ docs/adr/0004-teststrategie.md);
// dass keine Neigung den Server verlaesst (kader AC-28), prueft der
// Anfrageweg in manager-netz.test.mjs. Die Wirkung in der Welt misst
// docs/manager/dynamik/neigungen.cjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const kader = require('../server/spiele/manager/kader.js');
const vertraege = require('../server/spiele/manager/vertraege.js');
const neigungen = require('../server/spiele/manager/neigungen.js');
const { anpfiff, begegnung } = require('../server/spiele/manager/spieltag.js');
const { Karriere } = require('../server/spiele/manager/karriere.js');
const { zufallAus } = require('../server/spiele/manager/zufall.js');

const STARTWERTE = [4711, 20260910, 77, 1234, 5, 99, 31337, 2026];
const START = 4711;
const welt = kader.weltErzeugen(START);
const alleSpieler = [...welt.vereine.flatMap((v) => v.spieler), ...(welt.freie || [])];

/** Der Spieler mit der staerksten Neigung einer Achse in eine Richtung. */
const extrem = (achse, richtung) => alleSpieler.reduce((a, b) => (neigungen.neigung(START, b.id, achse) * richtung > neigungen.neigung(START, a.id, achse) * richtung ? b : a));

const mittel = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;
const streuung = (xs) => { const m = mittel(xs); return Math.sqrt(xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1)); };

/** Mit einer Einstellung der Tabelle rechnen und sie danach zuruecksetzen. */
function mit(achse, feld, wert, tun) {
  const vorher = neigungen.NEIGUNGEN.wirkung[achse][feld];
  neigungen.NEIGUNGEN.wirkung[achse][feld] = wert;
  try {
    return tun();
  } finally {
    neigungen.NEIGUNGEN.wirkung[achse][feld] = vorher;
  }
}

test('kader AC-27: jeder Spieler hat Neigungen, abgeleitet statt gespeichert', () => {
  const s = alleSpieler[0];
  // Dieselbe Kennung, derselbe Startwert: dieselben Neigungen; ein anderer Startwert: andere.
  assert.deepEqual(neigungen.neigungenVon(START, s.id), neigungen.neigungenVon(START, s.id));
  assert.notDeepEqual(neigungen.neigungenVon(START, s.id), neigungen.neigungenVon(START + 1, s.id));
  // Ohne Startwert neutral - so rechnen Vorschau und Tests ohne Karriere wie vorher.
  assert.ok(Object.values(neigungen.neigungenVon(null, s.id)).every((x) => x === 0));

  const verteilung = {};
  let n = 0;
  for (const startwert of STARTWERTE) {
    const w = startwert === START ? welt : kader.weltErzeugen(startwert);
    for (const sp of [...w.vereine.flatMap((v) => v.spieler), ...(w.freie || [])]) {
      const werte = Object.values(neigungen.neigungenVon(startwert, sp.id));
      assert.ok(werte.every((x) => x >= -1 && x <= 1));
      const name = neigungen.charakter(sp, startwert);
      verteilung[name] = (verteilung[name] || 0) + 1;
      n++;
    }
  }
  // Je Achse um null, Streuung 0,35 (gemessen ueber eine Welt, 7 Achsen).
  for (const achse of neigungen.ACHSEN) {
    const werte = alleSpieler.map((sp) => neigungen.neigung(START, sp.id, achse));
    assert.ok(Math.abs(mittel(werte)) < 0.04, `${achse}: Mitte ${mittel(werte)}`);
    assert.ok(Math.abs(streuung(werte) - 0.35) < 0.04, `${achse}: Streuung ${streuung(werte)}`);
  }
  // Gut die Haelfte ist ausgeglichen, jeder der acht Namen traegt vier bis acht Prozent.
  const anteil = (name) => (verteilung[name] || 0) / n;
  assert.ok(anteil(neigungen.AUSGEGLICHEN) > 0.48 && anteil(neigungen.AUSGEGLICHEN) < 0.57, JSON.stringify(verteilung));
  for (const [, , name] of neigungen.NAMEN) assert.ok(anteil(name) > 0.04 && anteil(name) < 0.08, `${name}: ${anteil(name)}`);
  assert.equal(Object.keys(verteilung).length, 9);

  // Kein Feld am Spieler, nichts im Spielstand.
  const k = Karriere.neu({ startwert: START, vereinId: 'v5' });
  assert.ok(!/neigung|charakter/i.test(JSON.stringify(k.sichern())));
});

/** Ein Spieler mit 26, der eine volle Saison spielte, `wiederholungen`-mal entwickelt: der Schnitt des Zugewinns. */
function zugewinn(id, { noten = 0, notenSchnitt = 3.5, startwert = START, wiederholungen = 3000 } = {}) {
  const vorlage = welt.vereine[0].spieler[0];
  let summe = 0;
  for (let i = 0; i < wiederholungen; i++) {
    const spieler = {
      ...vorlage, id, alter: 26, staerke: 60, talent: 99, karriereende: null,
      saison: { ...vorlage.saison, minuten: 34 * 90, noten, notenSumme: noten * notenSchnitt },
    };
    const verein = { ...welt.vereine[0], spieler: [spieler], trainingswochen: 0, technikSumme: 0 };
    kader.entwickeln(verein, zufallAus(1000 + i), 34, { anteil: 1, altern: false, startwert });
    summe += spieler.staerke - 60;
  }
  return summe / wiederholungen;
}

test('kader AC-29: Fleiss verschiebt die Entwicklung', () => {
  const fleissig = extrem('entwicklung', 1);
  const lebemann = extrem('entwicklung', -1);
  const nf = neigungen.neigung(START, fleissig.id, 'entwicklung');
  const nl = neigungen.neigung(START, lebemann.id, 'entwicklung');
  assert.equal(neigungen.charakter(fleissig, START), 'Trainingsfleißig');
  assert.equal(neigungen.charakter(lebemann, START), 'Lebemann');
  // Derselbe Spieler in allem ausser der Kennung: der Unterschied ist der Fleiss, 0,5 Punkte je Einheit Neigung.
  const unterschied = zugewinn(fleissig.id) - zugewinn(lebemann.id);
  const erwartet = neigungen.NEIGUNGEN.wirkung.entwicklung.punkte * (nf - nl);
  assert.ok(Math.abs(unterschied - erwartet) < 0.1, `Unterschied ${unterschied}, erwartet ${erwartet}`);
  assert.ok(erwartet > 0.5);
  // Ohne Startwert entwickeln sich beide gleich.
  assert.ok(Math.abs(zugewinn(fleissig.id, { startwert: null }) - zugewinn(lebemann.id, { startwert: null })) < 0.1);
});

test('kader AC-30: gute Noten foerdern die Entwicklung', () => {
  const id = extrem('entwicklung', 1).id;
  // Schnitt 2,0 gegen 5,0: 0,6 Punkte je Notenstufe, also rund 1,8.
  const gut = zugewinn(id, { noten: 20, notenSchnitt: 2 });
  const schlecht = zugewinn(id, { noten: 20, notenSchnitt: 5 });
  assert.ok(Math.abs(gut - schlecht - 1.8) < 0.12, `${gut} gegen ${schlecht}`);
  // Unter fuenf Noten zaehlt die Leistung nicht.
  const wenig = zugewinn(id, { noten: 4, notenSchnitt: 2 });
  const ohne = zugewinn(id);
  assert.ok(Math.abs(wenig - ohne) < 0.08, `${wenig} gegen ${ohne}`);
});

const aufstellung = (verein) => {
  const elf = kader.elfStellen(verein, verein.taktik.system);
  return { elf, bank: kader.bankStellen(verein, elf), system: verein.taktik.system };
};

test('kader AC-31: Heimliebe wirkt daheim, die Heimquote bleibt', () => {
  // Der Verein, dessen Elf die staerkste Heimliebe traegt, und ein Gegner.
  const heimstark = (v) => Math.max(...aufstellung(v).elf.map((s) => neigungen.neigung(START, s.id, 'heim')));
  const [heim, gast] = [...welt.vereine].sort((a, b) => heimstark(b) - heimstark(a));
  const einstellungen = { aufstellungen: { heim: aufstellung(heim), gast: aufstellung(gast) }, startwert: START };
  const formen = (spiel, i) => new Map(spiel.seiten[i].auf.map((p) => [p.id, p.form ?? 1]));
  const daheim = formen(anpfiff(heim, gast, zufallAus(1), einstellungen), 0);
  const auswaerts = formen(anpfiff(gast, heim, zufallAus(1), { ...einstellungen, aufstellungen: { heim: einstellungen.aufstellungen.gast, gast: einstellungen.aufstellungen.heim } }), 1);
  const neutral = formen(anpfiff(heim, gast, zufallAus(1), { ...einstellungen, neutral: true }), 0);
  for (const s of einstellungen.aufstellungen.heim.elf) {
    const n = neigungen.neigung(START, s.id, 'heim');
    assert.ok(Math.abs(daheim.get(s.id) - (1 + 0.03 * n)) < 1e-12, s.name);
    assert.ok(Math.abs(auswaerts.get(s.id) - (1 - 0.03 * n)) < 1e-12, s.name);
    assert.equal(neutral.get(s.id), 1);
  }
  assert.ok(Math.max(...daheim.values()) > 1.015, 'niemand in der Elf liebt das eigene Stadion');
  // Die Heimquote verschiebt sich nicht, weil die Neigung um null liegt: im Schnitt aller
  // Spieler weniger als 0,03 % Tagesform (gemessen: 47,56 % Heimsiege mit, 47,71 % ohne).
  for (const startwert of STARTWERTE) {
    const w = startwert === START ? welt : kader.weltErzeugen(startwert);
    const werte = w.vereine.flatMap((v) => v.spieler).map((s) => neigungen.neigung(startwert, s.id, 'heim'));
    assert.ok(Math.abs(mittel(werte) * neigungen.NEIGUNGEN.wirkung.heim.form) < 0.0003 * 3, `${startwert}: ${mittel(werte)}`);
  }
  // Ohne Startwert traegt niemand eine Form.
  const ohne = anpfiff(heim, gast, zufallAus(1), { ...einstellungen, startwert: null });
  assert.ok(ohne.seiten.every((seite) => seite.auf.every((p) => p.form === undefined)));
});

test('kader AC-32: Soeldner fordern beim Verlaengern mehr, der Markt rechnet ohne', () => {
  const soeldner = extrem('wechsel', 1);
  const treu = extrem('wechsel', -1);
  assert.equal(neigungen.charakter(soeldner, START), 'Söldner');
  assert.equal(neigungen.charakter(treu, START), 'Vereinstreu');
  for (const s of [soeldner, treu]) {
    const n = neigungen.neigung(START, s.id, 'wechsel');
    const ohne = vertraege.gehaltswunsch(s, null);
    assert.ok(Math.abs(vertraege.gehaltswunsch(s, START) / ohne - (1 + 0.06 * n)) < 0.01, s.name);
    // Ein Neuzugang bekommt, was der Markt zahlt - ohne Neigung.
    assert.equal(vertraege.neuerVertrag(s, 2, 1).gehalt, ohne);
  }
  assert.ok(vertraege.gehaltswunsch(soeldner, START) / vertraege.gehaltswunsch(soeldner, null) > 1.035);
  assert.ok(vertraege.gehaltswunsch(treu, START) / vertraege.gehaltswunsch(treu, null) < 0.965);

  // Verlaengert ueber die Karriere: derselbe Spieler, dieselbe Lage, mit und ohne Neigung.
  const k = Karriere.neu({ startwert: START, vereinId: 'v5' });
  const verein = k.vereinVon('v5');
  const s = verein.spieler.reduce((a, b) => (Math.abs(neigungen.neigung(START, b.id, 'wechsel')) > Math.abs(neigungen.neigung(START, a.id, 'wechsel')) ? b : a));
  s.vertrag.bis = k.saison;
  s.karriereende = null;
  const kopie = JSON.parse(JSON.stringify(s));
  const r = k.verlaengern('m1', s.id, 1);
  assert.ok(r.ok, r.fehler);
  assert.equal(r.gehalt, vertraege.gehaltswunsch(kopie, START));
  assert.notEqual(r.gehalt, vertraege.gehaltswunsch(kopie, null));

  // Und er geht zu einem schwaecheren Verein, den der Treue ablehnt - 2 Punkte Abstand je Einheit Neigung.
  const ziel = { ...welt.vereine.find((v) => v.liga === 2), reputation: 40 };
  const abstand = (spieler) => 14 + neigungen.abstandMehr(START, spieler.id);
  const stellen = (spieler, ueber) => ({ ...spieler, staerke: Math.round(kader.niveau(ziel) + ueber) });
  assert.ok(abstand(soeldner) > 15 && abstand(treu) < 13);
  assert.equal(vertraege.wechselbereit(stellen(soeldner, 14.5), ziel, START).ok, true);
  assert.equal(vertraege.wechselbereit(stellen(soeldner, 14.5), ziel, null).ok, false);
  assert.equal(vertraege.wechselbereit(stellen(treu, 13.5), ziel, START).ok, false);
  assert.equal(vertraege.wechselbereit(stellen(treu, 13.5), ziel, null).ok, true);
});

test('kader AC-33: ruhige Nerven, ruhige Noten - am Ergebnis aendert das nichts', () => {
  // Dieselben Spiele zweimal, einmal ohne die Achse nerven; heim ist in beiden aus, damit nur die Note sich unterscheidet.
  const paare = [[0, 1], [2, 3], [4, 5], [6, 7]].map(([a, b]) => [welt.vereine[a], welt.vereine[b]]);
  const noten = { mit: new Map(), ohne: new Map() };
  for (const [fall, wert] of [['mit', neigungen.NEIGUNGEN.wirkung.nerven.note], ['ohne', 0]]) {
    mit('heim', 'form', 0, () => mit('nerven', 'note', wert, () => {
      for (const [heim, gast] of paare) {
        const einstellungen = { aufstellungen: { heim: aufstellung(heim), gast: aufstellung(gast) }, startwert: START };
        for (let i = 0; i < 150; i++) {
          const e = begegnung(heim, gast, zufallAus(500 + i), einstellungen);
          noten[fall].set(`${heim.id}-${i}`, e.tore.join(':'));
          for (const [id, note] of Object.entries(e.noten)) {
            if (!noten[fall].has(id)) noten[fall].set(id, []);
            noten[fall].get(id).push(note);
          }
        }
      }
    }));
  }
  // Jedes Spiel endet gleich.
  for (const [schluessel, wert] of noten.mit) if (typeof wert === 'string') assert.equal(noten.ohne.get(schluessel), wert, schluessel);
  // Je Spieler die Streuung seiner Noten mit gegen ohne Nerven.
  const ruhig = []; const fahrig = [];
  for (const [id, liste] of noten.mit) {
    if (typeof liste === 'string' || liste.length < 100) continue;
    const n = neigungen.neigung(START, id, 'nerven');
    const verhaeltnis = streuung(liste) / streuung(noten.ohne.get(id));
    if (n > 0.3) ruhig.push(verhaeltnis);
    if (n < -0.3) fahrig.push(verhaeltnis);
  }
  assert.ok(ruhig.length >= 3 && fahrig.length >= 3, `${ruhig.length} ruhige, ${fahrig.length} fahrige`);
  assert.ok(mittel(ruhig) < 0.96, `ruhige ${mittel(ruhig)}`);
  assert.ok(mittel(fahrig) > 1.04, `fahrige ${mittel(fahrig)}`);
  // Ein Profi heisst, wer die ruhigsten Nerven hat.
  assert.equal(neigungen.charakter(extrem('nerven', 1), START), 'Profi');
});
