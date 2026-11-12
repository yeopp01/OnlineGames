// Die Spielgeschwindigkeit (→ specs/10-strategie/spielziel.md AC-23,
// ADR-0013). Eine Spielsekunde bleibt zehn Takte; schneller heisst, der Raum
// rechnet mehr Takte je echte Sekunde. Die Zahl erfaehrt er vom Steckbrief
// (`takte(einstellungen)`), die Uhr des Raums ist in raeume-spiel.test.mjs
// geprueft. Hier: der Steckbrief, die Welt - und einmal der ganze Weg ueber
// das Netz, mit echter Uhr, denn hier wird die Zeit selbst geprueft.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { kunde as kundeMit, istTyp, konto, beenden, warte } from './hilfe.mjs';

const require = createRequire(import.meta.url);
const { Welt, TAKTE_PRO_SEKUNDE, GESCHWINDIGKEITEN } = require('../server/spiele/strategie/welt.js');
const STECKBRIEF = require('../server/spiele/strategie/steckbrief.js');
const verzeichnis = require('../server/spiele/verzeichnis.js');
const { starten } = require('../server/index.js');

const ZWEI = [{ id: 'a1', name: 'Anna' }, { id: 'b1', name: 'Bert' }];

test('spielziel AC-23: beim Eroeffnen 1,0, 1,5 oder 2,0, Vorgabe 1,0', () => {
  const e = STECKBRIEF.einstellungen.find((x) => x.schluessel === 'tempo');
  assert.ok(e, 'die Einstellung steht im Steckbrief');
  assert.equal(e.art, 'wahl');
  assert.equal(e.vorgabe, 1);
  // Was die Welt kennt, steht zur Wahl - und umgekehrt.
  assert.deepEqual(e.werte.map((w) => w.wert), GESCHWINDIGKEITEN);
  assert.deepEqual(GESCHWINDIGKEITEN, [1, 1.5, 2], 'die Werte aus ADR-0013');
  // Auf dem Bildschirm mit Komma (spielauswahl AC-21 gilt sinngemaess).
  assert.match(e.werte.find((w) => w.wert === 1.5).name, /^1,5/);
  assert.match(e.werte.find((w) => w.wert === 1).name, /normal/);
});

test('spielziel AC-23: der Steckbrief sagt dem Raum 10, 15 oder 20 Takte je echte Sekunde', () => {
  assert.equal(typeof STECKBRIEF.takte, 'function', 'eine Funktion der Einstellungen, wie plaetze');
  assert.equal(STECKBRIEF.takte({}), TAKTE_PRO_SEKUNDE, 'ohne Angabe: normal');
  assert.equal(STECKBRIEF.takte({ tempo: 1 }), 10);
  assert.equal(STECKBRIEF.takte({ tempo: 1.5 }), 15);
  assert.equal(STECKBRIEF.takte({ tempo: 2 }), 20);
  // Was die Liste nicht kennt, ist normal - auch wenn es sich als Zahl rechnen liesse.
  assert.equal(STECKBRIEF.takte({ tempo: 3 }), 10);
  assert.equal(STECKBRIEF.takte({ tempo: '2' }), 10);
});

test('spielziel AC-23: eine Spielsekunde bleibt zehn Takte - die Welt rechnet nicht anders', () => {
  // Gleicher Startwert, gleiche Spieler, drei Geschwindigkeiten: nach 600
  // Takten steht Takt fuer Takt dasselbe da. Schneller ist nur die Uhr des
  // Raums, nicht die Regel.
  const zustaende = GESCHWINDIGKEITEN.map((tempo) => {
    const w = new Welt(ZWEI, 4711, { sicht: 'aufgedeckt', tempo });
    assert.equal(w.tempo, tempo);
    for (let i = 0; i < 600; i++) w.takten();
    return JSON.stringify(w.zustand());
  });
  assert.equal(zustaende[1], zustaende[0]);
  assert.equal(zustaende[2], zustaende[0]);
  // Der Browser erfaehrt beides: Takte je Spielsekunde und die Geschwindigkeit.
  const aufbau = new Welt(ZWEI, 4711, { tempo: 1.5 }).aufbau();
  assert.deepEqual({ takte: aufbau.takte, tempo: aufbau.tempo }, { takte: 10, tempo: 1.5 });
  assert.equal(new Welt(ZWEI, 4711, { tempo: 7 }).tempo, 1, 'Unbekanntes heisst normal');
});

test('spielziel AC-23: takte als Funktion wird beim Start des Servers an den Vorgaben geprueft', () => {
  // Derselbe Weg wie beim Start: ein Ordner mit einem Steckbrief, `lesen()`.
  const ordner = mkdtempSync(join(tmpdir(), 'geschwindigkeit-steckbrief-'));
  const lesen = (takte) => {
    const wo = join(ordner, `puzzle${Math.round(performance.now() * 1000)}`);
    mkdirSync(wo);
    writeFileSync(join(wo, 'steckbrief.js'), `module.exports = {
      art: 'puzzle', name: 'Puzzle', beschreibung: 'x', spieler: { von: 2, bis: 4 }, stand: 'im-bau',
      einstieg: { art: 'raum' }, erzeugen: () => ({}), takte: ${takte},
      einstellungen: [{ schluessel: 'schnell', name: 'Schnell', art: 'wahl', vorgabe: 0,
        werte: [{ wert: 0, name: 'nein' }, { wert: 1, name: 'ja' }] }],
    };`);
    try {
      return verzeichnis.lesen(ordner);
    } finally {
      rmSync(wo, { recursive: true });
    }
  };
  try {
    const [puzzle] = lesen('(e) => (e.schnell ? 20 : 10)');
    assert.equal(puzzle.takte({ schnell: 1 }), 20, 'die Funktion kommt beim Raum an');
    assert.throws(() => lesen('(e) => (e.schnell ? 20 : 0.5)'), /takte/, 'an der Vorgabe keine ganze Zahl');
    assert.throws(() => lesen('() => 61'), /takte/);
    assert.throws(() => lesen('() => undefined'), /takte/);
  } finally {
    rmSync(ordner, { recursive: true, force: true });
  }
});

// ---- Ueber das Netz, mit echter Uhr -------------------------------------------

const HAFEN = 4197;
let laufend;
let kekse;

before(async () => {
  laufend = await starten(HAFEN, {
    schutz: { verbindungenJeAdresse: 50, verbindungenJeMinute: 100, raeumeGesamt: 20, raeumeJeAdresse: 10 },
    konten: { datei: ':memory:', geheimnis: 't'.repeat(48) },
  });
  kekse = (await konto(HAFEN, laufend, { name: 'Anna' })).kekse;
});

after(() => beenden(laufend));

// Eine Partie allein gegen eine KI; gemerkt wird je Zustand die Ankunft.
async function partie(tempo) {
  const anna = kundeMit(HAFEN, kekse);
  await anna.offen();
  const ankunft = [];
  anna.draht.on('message', (roh) => {
    const n = JSON.parse(roh.toString());
    if (n.typ === 'zustand') ankunft.push({ zeit: performance.now(), takt: n.t });
  });
  anna.senden({ typ: 'erstellen', name: 'Anna', einstellungen: { ki: 1, sicht: 'aufgedeckt', tempo } });
  await anna.warteAuf(istTyp('du'));
  anna.senden({ typ: 'start', startwert: 7 });
  const aufbau = await anna.warteAuf(istTyp('aufbau'));
  return { anna, ankunft, aufbau };
}

// Spielsekunden je echte Sekunde zwischen dem ersten Zustand nach einer
// halben Sekunde und dem letzten.
function rate(ankunft) {
  const anfang = ankunft.find((a) => a.zeit - ankunft[0].zeit >= 500);
  const ende = ankunft.at(-1);
  return {
    sekunden: (ende.zeit - anfang.zeit) / 1000,
    takte: ende.takt - anfang.takt,
  };
}

test('spielziel AC-23: bei 1,5 vergehen ueber das Netz in echter Zeit anderthalb Spielsekunden je Sekunde', async (t) => {
  // Beide Raeume zugleich, damit ein langsamer Rechner beide gleich trifft.
  const [schnell, normal] = await Promise.all([partie(1.5), partie(1)]);
  try {
    assert.deepEqual({ takte: schnell.aufbau.takte, tempo: schnell.aufbau.tempo }, { takte: 10, tempo: 1.5 });
    assert.equal(normal.aufbau.tempo, 1);
    await warte(5500);
    for (const [was, ankunft, jeSekunde] of [['1,5', schnell.ankunft, 15], ['1,0', normal.ankunft, 10]]) {
      const { sekunden, takte } = rate(ankunft);
      const erwartet = sekunden * jeSekunde;
      t.diagnostic(`${was}: ${takte} Takte in ${sekunden.toFixed(2)} s, erwartet ${erwartet.toFixed(1)}`);
      // Die Uhr des Raums selbst ist auf einen Takt genau (raeume-spiel,
      // spielziel AC-23 mit gestellter Uhr). Hier kommt die Ankunft der
      // Nachricht dazu: an jedem der beiden Enden bis zu einem Schlag
      // Verspaetung, also zwei Takte. Gemessen in Runde 159, drei Laeufe:
      // 1,5 -> 74/73/73 auf 73,4/72,9/72,3 erwartet, 1,0 -> 48 auf 48,1 bis 48,6.
      assert.ok(Math.abs(takte - erwartet) <= 2, `${was}: ${takte} Takte in ${sekunden.toFixed(2)} s, erwartet ${erwartet.toFixed(1)}`);
    }
  } finally {
    schnell.anna.zu();
    normal.anna.zu();
  }
});
