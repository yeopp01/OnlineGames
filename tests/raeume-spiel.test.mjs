// Der Raum und das Spiel darin (→ specs/00-plattform/raeume.md AC-16,
// docs/adr/0006-mehrere-spiele.md). Geprueft am Raum selbst: ein Spiel, das es
// nicht gibt, laesst sich nicht ueber den Server eroeffnen - der Weg ueber den
// Server ist mit dem Strategiespiel in netz.test.mjs belegt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { Raeume } = require('../server/raeume.js');
const verzeichnis = require('../server/spiele/verzeichnis.js');

// Ein Draht, der mitschreibt, was ankommt.
function draht() {
  const eingang = [];
  return { readyState: 1, eingang, send: (text) => eingang.push(JSON.parse(text)), close() {} };
}

test('raeume AC-16: raeume.js laedt kein Spiel', () => {
  const quelle = readFileSync(join(import.meta.dirname, '..', 'server', 'raeume.js'), 'utf8');
  const geladen = [...quelle.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
  assert.deepEqual(geladen.filter((pfad) => pfad.includes('spiele/') && !pfad.endsWith('spiele/einstellungen')), []);
  assert.doesNotMatch(quelle, /\bWelt\b|strategie/);
});

test('raeume AC-16: ein erfundenes Spiel laeuft durch den Raum, nur ueber seinen Steckbrief', (t) => {
  // Die Uhr laeuft von Hand: echte Zeitgeber schwanken unter Windows um
  // 15 ms und mehr, gezaehlt werden soll die Taktzahl des Steckbriefs.
  t.mock.timers.enable({ apis: ['setInterval'] });
  const aufrufe = { erzeugt: null, takte: 0 };
  const puzzle = {
    art: 'puzzle',
    takte: 20,
    erzeugen(spieler, einstellungen) {
      aufrufe.erzeugt = { spieler: spieler.map((s) => s.name), einstellungen };
      return {
        aufbau: () => ({ typ: 'aufbau', teile: 12 }),
        takten: () => { aufrufe.takte += 1; },
        zustand: () => ({ typ: 'zustand', takt: aufrufe.takte }),
        befehl: () => {},
      };
    },
  };
  const raeume = new Raeume();
  try {
    const raum = raeume.anlegen(puzzle);
    raum.einstellungen = { spieler: 4, farbe: 'blau' };
    const anna = draht();
    const bert = draht();
    raum.beitreten('Anna', anna);
    raum.beitreten('Bert', bert);

    assert.deepEqual(raum.starten(7), {});
    assert.deepEqual(aufrufe.erzeugt, { spieler: ['Anna', 'Bert'], einstellungen: { spieler: 4, farbe: 'blau', startwert: 7 } });
    assert.deepEqual(bert.eingang[0], { typ: 'aufbau', teile: 12 });

    // Zwanzig Takte je Sekunde, wie der Steckbrief sagt - nicht zehn wie das Strategiespiel.
    t.mock.timers.tick(500);
    assert.equal(aufrufe.takte, 10, 'eine halbe Sekunde bei 20 Takten');
    assert.equal(anna.eingang.at(-1).typ, 'zustand');
  } finally {
    raeume.halt();
  }
});

test('raeume AC-16: ein Raum-Spiel ohne erzeugen oder takte faellt beim Start des Servers auf', () => {
  const wurzel = join(import.meta.dirname, '..', 'server', 'spiele');
  const strategie = verzeichnis.lesen(wurzel).find((s) => s.art === 'strategie');
  assert.equal(typeof strategie.erzeugen, 'function');
  assert.equal(strategie.takte, 10);
  // Beim Ausliefern an den Browser bleibt die Funktion auf dem Server.
  assert.equal(JSON.parse(JSON.stringify(strategie)).erzeugen, undefined);
});
