// Was eine Verbesserung bringt, steht am Knopf (bedienung AC-55). Den Satz
// schreibt der Server aus denselben Daten, mit denen er rechnet - der Browser
// liest keine Wirkungen (tests/waechter-wirkungen.test.mjs).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { bringt, hausBringt } = require('../server/spiele/strategie/bringt.js');
const { VERBESSERUNGEN, EINHEITEN, HAEUSER, HANDEL, ZEITALTER } = require('../server/spiele/strategie/daten.js');
const { Welt, GEBAEUDE_NAMEN, EINHEIT_NAMEN } = require('../server/spiele/strategie/welt.js');

test('bedienung AC-55: jede Verbesserung sagt, was sie bringt - oder tauscht eine Einheit aus', () => {
  for (const [art, verbesserung] of Object.entries(VERBESSERUNGEN)) {
    const zeilen = bringt(verbesserung);
    assert.ok(Array.isArray(zeilen), art);
    // Wer nur austauscht (Soldat, Armbrust), dessen Zeile schreibt der
    // Browser aus den Namen der Einheiten.
    assert.ok(zeilen.length > 0 || verbesserung.wandelt, `${art} sagt nichts und tauscht nichts`);
    for (const zeile of zeilen) {
      assert.equal(typeof zeile, 'string');
      assert.doesNotMatch(zeile, /undefined|NaN|\[object/, `${art}: ${zeile}`);
    }
  }
});

test('bedienung AC-55: die Saetze nennen die Zahlen der Daten, nicht eigene', () => {
  const webstuhl = bringt(VERBESSERUNGEN.webstuhl).join(' | ');
  const leben = Object.values(VERBESSERUNGEN.webstuhl.wirkung).map((w) => w.leben).find(Boolean);
  assert.ok(leben > 0, 'der Webstuhl gibt Leben');
  assert.match(webstuhl, new RegExp(`\\+${leben} Leben`));
  assert.match(webstuhl, /Dorfbewohner/);

  // Ein anderer Wert in den Daten ergibt einen anderen Satz.
  const mehr = structuredClone(VERBESSERUNGEN.webstuhl);
  for (const w of Object.values(mehr.wirkung)) if (w.leben) w.leben += 7;
  assert.match(bringt(mehr).join(' | '), new RegExp(`\\+${leben + 7} Leben`));

  assert.match(bringt(VERBESSERUNGEN.doppelaxt).join(' | '), /Holz/);
  assert.match(bringt(VERBESSERUNGEN.pferdekummet).join(' | '), /Farm/);
  assert.match(bringt(VERBESSERUNGEN.mauerwerk).join(' | '), /Gebäude/);
});

test('bedienung AC-55: der Aufbau traegt die Saetze und das Tempo jeder Einheit', () => {
  const spieler = [
    { id: 's1', name: 'Anna', farbe: '#4f8cff' },
    { id: 's2', name: 'Bert', farbe: '#ff5d5d' },
  ];
  const welt = new Welt(spieler, 7);
  const aufbau = welt.aufbau();
  for (const [art, verbesserung] of Object.entries(aufbau.werte.verbesserungen)) {
    assert.deepEqual(verbesserung.bringt, bringt(VERBESSERUNGEN[art], GEBAEUDE_NAMEN), art);
  }
  for (const [art, einheit] of Object.entries(aufbau.werte.einheiten)) {
    assert.equal(einheit.tempo, EINHEITEN[art].tempo || 0, `Tempo von ${art}`);
  }
});

// ---- Das Haus im Spiel (bedienung AC-69) ----------------------------------
const FUENF = ['eschenbruch', 'rappenstein', 'wehrstein', 'silberfurt', 'distelhag'];

test('bedienung AC-69: jedes Haus sagt, was es bringt - jede Form seiner Boni mit einer Zeile', () => {
  // So viele Zeilen wie Eintraege: nichts, was in den Daten steht, bleibt stumm.
  const eintraege = (wirkungen) => Object.values(wirkungen || {})
    .reduce((summe, teil) => summe + Object.keys(teil).length, 0);
  for (const art of FUENF) {
    const haus = HAEUSER[art];
    const { bringt: zeilen, mannschaft } = hausBringt(haus, GEBAEUDE_NAMEN);
    assert.ok(zeilen.length > 0, `${art} sagt nichts`);
    assert.ok(mannschaft.length > 0, `${art}: der Mannschaftsbonus sagt nichts`);
    for (const zeile of [...zeilen, ...mannschaft]) {
      assert.doesNotMatch(zeile, /undefined|NaN|\[object/, `${art}: ${zeile}`);
    }
    const spaeter = Object.values(haus.boniAb || {}).reduce((summe, boni) => summe + eintraege(boni), 0);
    // Zuschlaege einer Klasse stehen in einer Zeile, deshalb "mindestens".
    assert.ok(zeilen.length >= Object.keys(haus.boni).length + (spaeter ? 1 : 0),
      `${art}: ${zeilen.length} Zeilen fuer ${JSON.stringify(haus.boni)}`);
    assert.ok(mannschaft.length >= Object.keys(haus.mannschaft).length, `${art}: ${mannschaft.join(' | ')}`);
  }
});

test('bedienung AC-69: die Saetze der Haeuser nennen die Zahlen der Daten, nicht eigene', () => {
  const satz = (art) => hausBringt(HAEUSER[art], GEBAEUDE_NAMEN);
  const prozent = (anteil) => `${Math.round(anteil * 100)} %`;

  // Eschenbruch: Holz von Beginn, die Reichweite mit ihrem Zeitalter davor.
  const esche = satz('eschenbruch');
  assert.match(esche.bringt.join(' | '), new RegExp(`Holz wird ${prozent(HAEUSER.eschenbruch.boni.sammeln.holz - 1)} schneller`));
  const [stufe] = Object.keys(HAEUSER.eschenbruch.boniAb);
  const ab = ZEITALTER[stufe].ab;
  const spaeter = esche.bringt.find((zeile) => zeile.includes('Reichweite'));
  assert.ok(spaeter, 'die Reichweite fehlt');
  assert.ok(spaeter.startsWith(`${ab.charAt(0).toUpperCase()}${ab.slice(1)} – `), spaeter);
  assert.match(esche.mannschaft.join(' | '), /Die Schießanlage bildet 20 % schneller aus/);

  // Wehrstein: die Reichweite gilt nur dem, was schiesst - nicht "Gebaeude".
  const wehr = satz('wehrstein').bringt;
  assert.ok(wehr.includes('Wachturm und Burg: +1 Reichweite'), wehr.join(' | '));
  assert.ok(wehr.includes('Gebäude: +10 % Leben'), wehr.join(' | '));
  assert.deepEqual(satz('wehrstein').mannschaft, ['Gebäude sehen 2 Felder weiter']);

  // Silberfurt: die Gebuehr als das, was am Markt steht.
  const silber = satz('silberfurt');
  const gebuehr = HANDEL.gebuehr + HAEUSER.silberfurt.boni.handel.gebuehr;
  assert.ok(silber.bringt.includes(`Am Markt ${prozent(gebuehr)} Gebühr statt ${prozent(HANDEL.gebuehr)}`), silber.bringt.join(' | '));
  assert.ok(silber.bringt.includes('Marktkarren bringen 20 % mehr Gold je Fahrt'));
  assert.deepEqual(silber.mannschaft, ['Marktkarren zwischen Verbündeten bringen 20 % mehr Gold je Fahrt']);

  assert.ok(satz('rappenstein').bringt.includes('Kavallerie: +15 Leben, +2 Sicht'), satz('rappenstein').bringt.join(' | '));
  const distel = satz('distelhag').bringt;
  assert.ok(distel.includes('Infanterie: +1 / +2 Rüstung'), distel.join(' | '));
  assert.ok(distel.includes('Jede neue Farm trägt 45 Nahrung mehr'), distel.join(' | '));

  // Ein anderer Wert in den Daten ergibt einen anderen Satz.
  const mehr = structuredClone(HAEUSER.rappenstein);
  mehr.boni.wirkung.kavallerie.leben += 5;
  assert.ok(hausBringt(mehr, GEBAEUDE_NAMEN).bringt.includes('Kavallerie: +20 Leben, +2 Sicht'));
});

test('bedienung AC-69: der Aufbau traegt die Saetze jedes Hauses und das Haus jedes Spielers', () => {
  const spieler = [
    { id: 's1', name: 'Anna', farbe: '#4f8cff' },
    { id: 's2', name: 'Bert', farbe: '#ff5d5d' },
  ];
  const welt = new Welt(spieler, 7, { haeuser: { s1: 'wehrstein', s2: 'silberfurt' } });
  const aufbau = welt.aufbau();
  for (const art of FUENF) {
    assert.deepEqual(aufbau.werte.haeuser[art], {
      name: HAEUSER[art].name, wahlspruch: HAEUSER[art].wahlspruch, ...hausBringt(HAEUSER[art], GEBAEUDE_NAMEN, EINHEIT_NAMEN),
    }, art);
  }
  // Was die KI mit dem Haus vorhat, geht den Browser nichts an.
  assert.doesNotMatch(JSON.stringify(aufbau.werte.haeuser), /schwerpunkt|goldKnapp/);
  assert.deepEqual(aufbau.spieler.map((s) => s.haus), ['wehrstein', 'silberfurt']);
});
