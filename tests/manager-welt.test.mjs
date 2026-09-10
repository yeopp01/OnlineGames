// Die Welt ueber Jahre, ohne Menschen: sechs Saisons, rund 3.900 Spiele, jedes
// auf Widersprueche geprueft. Die Begegnung wird dafuer beobachtet, bevor die
// Karriere sie laedt - deshalb eine eigene Datei.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { schnitt, widersprueche } from './manager-hilfe.mjs';

const require = createRequire(import.meta.url);
const spieltag = require('../server/spiele/manager/spieltag.js');
const echt = spieltag.begegnung;
let beobachtet = [];
spieltag.begegnung = (...argumente) => {
  const ergebnis = echt(...argumente);
  beobachtet.push(ergebnis);
  return ergebnis;
};
const { Karriere } = require('../server/spiele/manager/karriere.js');
const kader = require('../server/spiele/manager/kader.js');

const SAISONS = 6;
const verlauf = [];

before(() => {
  const k = Karriere.neu({ startwert: 20260910, vereinId: null });
  const niveauAmAnfang = schnitt(k.vereine.filter((v) => v.liga === 1), kader.niveau);
  let posten = {};
  const echtBuchen = k.buchen.bind(k);
  k.buchen = (verein, kategorie, betrag, zweck) => {
    const liga = (posten[verein.liga] = posten[verein.liga] || {});
    liga[kategorie] = (liga[kategorie] || 0) + Math.round(betrag);
    return echtBuchen(verein, kategorie, betrag, zweck);
  };
  for (let saison = 1; saison <= SAISONS; saison++) {
    beobachtet = [];
    posten = {};
    while (k.saison === saison) assert.ok(k.weiter().ok);
    const liga = (nummer) => k.vereine.filter((v) => v.liga === nummer);
    verlauf.push({
      saison,
      niveauAmAnfang,
      spiele: beobachtet.length,
      widersprueche: beobachtet.flatMap(widersprueche),
      tore: schnitt(beobachtet, (e) => e.tore[0] + e.tore[1]),
      niveau: schnitt(liga(1), kader.niveau),
      kader: k.vereine.map((v) => v.spieler.length),
      freie: k.freie.length,
      konto: { 1: schnitt(liga(1), (v) => v.konto), 2: schnitt(liga(2), (v) => v.konto) },
      posten,
    });
  }
});

test('manager AC-14: die Welt traegt ueber sechs Saisons', () => {
  assert.equal(verlauf.length, SAISONS);
  for (const s of verlauf) {
    assert.equal(s.spiele, 643, `Saison ${s.saison}: ${s.spiele} Spiele`);
    assert.deepEqual(s.widersprueche, [], `Saison ${s.saison}`);
    assert.ok(s.tore > 2.7 && s.tore < 3.6, `Saison ${s.saison}: ${s.tore.toFixed(2)} Tore je Spiel`);
    assert.ok(Math.abs(s.niveau - s.niveauAmAnfang) < 4, `Saison ${s.saison}: erste Liga bei ${s.niveau.toFixed(1)}, anfangs ${s.niveauAmAnfang.toFixed(1)}`);
    assert.ok(Math.min(...s.kader) >= 11 && Math.max(...s.kader) <= 26, `Saison ${s.saison}: Kader ${Math.min(...s.kader)}-${Math.max(...s.kader)}`);
    assert.ok(s.freie >= 45 && s.freie <= 90, `Saison ${s.saison}: ${s.freie} Vereinslose`);
  }
});

test('finanzen AC-7: niemand geht grundlos pleite', () => {
  for (const s of verlauf.slice(0, 3)) {
    assert.ok(s.konto[1] > 0, `Saison ${s.saison}: erste Liga im Schnitt bei ${s.konto[1].toFixed(0)}`);
    assert.ok(s.konto[2] > 0, `Saison ${s.saison}: zweite Liga im Schnitt bei ${s.konto[2].toFixed(0)}`);
  }
});

test('finanzen AC-6: die Gehaelter fressen das meiste', () => {
  const { posten } = verlauf[0];
  for (const nummer of [1, 2]) {
    const p = posten[nummer];
    const gehaelter = -p.gehaelter;
    const laufend = p.zuschauer + p.fernsehen + p.sponsor + p.praemien;
    for (const [art, betrag] of Object.entries(p)) {
      if (art !== 'gehaelter' && betrag < 0) assert.ok(gehaelter > -betrag, `Liga ${nummer}: ${art} kostet mehr als die Gehaelter`);
    }
    for (const art of ['zuschauer', 'fernsehen', 'sponsor', 'praemien']) {
      assert.ok(gehaelter > p[art], `Liga ${nummer}: ${art} bringt mehr, als die Gehaelter kosten`);
    }
    assert.ok(gehaelter > laufend * 0.6, `Liga ${nummer}: Gehaelter ${gehaelter} bei laufenden Einnahmen ${laufend}`);
  }
});
