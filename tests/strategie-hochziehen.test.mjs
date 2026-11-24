// Aeltere Spielstaende werden hochgezogen (speichern AC-18; ADR-0017 Punkt 7
// mit Nachtrag vom 2026-11-24) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md).
//
// Je Fassung liegt unter `tests/staende/` ein Probestand, geschrieben vom
// Code jener Fassung (`npm run stand:abbild -- --schreiben`). Jeder wird hier
// geladen: nach dem Hochziehen traegt jedes Ding jedes Feld, das im Probestand
// der laufenden Fassung jedes Ding seiner Art traegt, keines, das die
// laufende Form nicht kennt, und die Partie laeuft fuenf Minuten weiter. Der
// Probestand der laufenden Fassung prueft dabei nur sich selbst - die
// Schritte prueft er erst, sobald es eine zweite Fassung gibt. Den Weg ueber
// `SCHRITTE` pruefen deshalb eingeschleuste Schritte.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { abbildLesen, probestandPfad } from '../scripts/stand-abbild.mjs';

const require = createRequire(import.meta.url);
const steckbrief = require('../server/spiele/strategie/steckbrief.js');
const stand = require('../server/spiele/strategie/stand.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');

const ALT = 'Dieser Spielstand stammt aus einer älteren Fassung des Spiels und lässt sich nicht mehr fortsetzen.';
const KAPUTT = 'Der Spielstand ist beschädigt und lässt sich nicht laden.';

/** Je Art die Dinge eines entpackten Stands - wie `formErmitteln` sie liest. */
function dinge({ welt, kis }) {
  return {
    welt: [welt],
    karte: [welt.karte],
    spieler: welt.spieler,
    einheit: [...welt.einheiten.values()],
    gebaeude: [...welt.gebaeude.values()],
    tier: [...welt.tiere.values()],
    ei: [...(welt.eier?.values() || [])],
    sicht: [...welt.sichten.values()],
    ki: kis,
  };
}

/** Je Art die Felder, die jedes Ding dieser Art traegt. */
function immerGetragen(inhalt) {
  const raus = {};
  for (const [art, liste] of Object.entries(dinge(inhalt))) {
    if (!liste.length) continue;
    let felder = new Set(Object.keys(liste[0]));
    for (const ding of liste.slice(1)) felder = new Set([...felder].filter((f) => f in ding));
    raus[art] = felder;
  }
  return raus;
}

const probestand = (fassung) => readFileSync(probestandPfad(fassung));
const laufend = stand.lesen(probestand(stand.FASSUNG));
const pflicht = immerGetragen(laufend);
const form = abbildLesen()[stand.FASSUNG];

const fassungen = Array.from({ length: stand.FASSUNG }, (_, i) => i + 1);

for (const fassung of fassungen) {
  test(`speichern AC-18: ein Stand der Fassung ${fassung} wird hochgezogen, traegt die Form der laufenden und laeuft fuenf Minuten weiter`, () => {
    const bytes = probestand(fassung);
    assert.equal(stand.fassungVon(bytes), fassung, `tests/staende/strategie-${fassung}.fast traegt eine andere Fassung im Kopf`);

    const inhalt = stand.lesen(bytes);
    for (const [art, liste] of Object.entries(dinge(inhalt))) {
      const erlaubt = new Set(form[art]);
      for (const ding of liste) {
        for (const feld of pflicht[art] || []) assert.ok(feld in ding, `${art}.${feld} fehlt nach dem Hochziehen aus Fassung ${fassung}`);
        for (const feld of Object.keys(ding)) assert.ok(erlaubt.has(feld), `${art}.${feld} kennt die Fassung ${stand.FASSUNG} nicht`);
      }
    }

    const welt = steckbrief.laden(bytes);
    assert.ok(welt instanceof Welt);
    const ids = welt.spieler.map((s) => s.id);
    const vorher = welt.takt;
    for (let i = 0; i < 5 * 60 * TAKTE_PRO_SEKUNDE && !welt.ende; i++) {
      welt.takten();
      welt.zustandJeSpieler(ids);
    }
    assert.ok(welt.takt > vorher, 'die geladene Partie rechnet weiter');
    // Weiter sichern und wieder oeffnen laesst sich, was hochgezogen wurde -
    // jetzt in der laufenden Fassung.
    const neu = welt.sichern();
    assert.equal(stand.fassungVon(neu), stand.FASSUNG);
    assert.ok(steckbrief.laden(neu) instanceof Welt);
  });
}

test('speichern AC-18: der Probestand der laufenden Fassung traegt jede Art von Ding, an der ein Schritt etwas aendern muss', () => {
  // Sonst prueft der Test oben die Schnittmenge ueber nichts.
  const liste = dinge(laufend);
  for (const art of ['welt', 'karte', 'spieler', 'einheit', 'gebaeude', 'tier', 'sicht', 'ki']) {
    assert.ok(liste[art].length > 0, `kein Ding der Art ${art} im Probestand`);
  }
  const arten = new Set(liste.gebaeude.map((g) => g.art));
  assert.ok(arten.size >= 20, `nur ${arten.size} Arten von Gebaeuden im Probestand`);
  assert.ok(liste.gebaeude.some((g) => g.quer), 'ein Tor steht quer');
});

/** Ein Stand mit anderer Fassung im Kopf - der Inhalt bleibt, wie er ist. */
function mitFassung(bytes, fassung) {
  const anders = Buffer.from(bytes);
  anders.writeUInt32BE(fassung, 4);
  return anders;
}

function abgelehnt(fn, grund, satz) {
  assert.throws(fn, (fehler) => fehler instanceof stand.StandFehler && fehler.grund === grund && fehler.message === satz);
}

test('speichern AC-18: ein alter Stand geht jeden Schritt bis zur laufenden Fassung, der Reihe nach', () => {
  // lesen() geht den Schritt, wenn der Kopf eine aeltere Fassung nennt.
  const alt = stand.FASSUNG - 1;
  const gelesen = stand.lesen(mitFassung(probestand(stand.FASSUNG), alt), {
    [alt]: (inhalt) => {
      inhalt.welt.probeFeld = 'hochgezogen';
    },
  });
  assert.equal(gelesen.welt.probeFeld, 'hochgezogen');

  // Zwei Schritte hintereinander: eingeschleust als Fassung FASSUNG + 7 nach
  // FASSUNG + 9, weil es diese Fassungen noch nicht gibt.
  const gegangen = [];
  const von = stand.FASSUNG + 7;
  const schritte = {
    [von]: (inhalt) => {
      gegangen.push(von);
      inhalt.welt.probeFeld = 1;
    },
    [von + 1]: (inhalt) => {
      gegangen.push(von + 1);
      inhalt.welt.probeFeld += 1;
      for (const e of inhalt.welt.einheiten.values()) e.probeFeld = inhalt.welt.probeFeld;
    },
  };
  const inhalt = stand.hochziehen(stand.lesen(probestand(stand.FASSUNG)), von, von + 2, schritte);
  assert.deepEqual(gegangen, [von, von + 1]);
  assert.equal(inhalt.welt.probeFeld, 2);
  assert.ok([...inhalt.welt.einheiten.values()].every((e) => e.probeFeld === 2));
});

test('speichern AC-18: ohne Weg - ein Schritt fehlt oder ist ein Satz statt einer Funktion - wird abgelehnt, ein Schritt, der wirft, macht den Stand kaputt', () => {
  const inhalt = () => stand.lesen(probestand(stand.FASSUNG));
  abgelehnt(() => stand.hochziehen(inhalt(), 1, 3, { 1: () => {} }), 'aelter', ALT);
  abgelehnt(() => stand.hochziehen(inhalt(), 1, 3, { 1: () => {}, 2: 'Nicht hochziehbar, siehe ADR-0017.' }), 'aelter', ALT);
  abgelehnt(
    () =>
      stand.hochziehen(inhalt(), 1, 2, {
        1: () => {
          throw new Error('kein Feld da');
        },
      }),
    'kaputt',
    KAPUTT,
  );
  // Ein Stand der Fassung 0 hat keinen Weg und wird abgelehnt, bevor entpackt wird.
  abgelehnt(() => stand.lesen(mitFassung(Buffer.from('FAST\0\0\0\0kein Inhalt'), 0)), 'aelter', ALT);
});
