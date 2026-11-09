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
  t.mock.timers.enable({ apis: ['setInterval', 'Date'] });
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
  assert.equal(strategie.takte({}), 10, 'ohne Einstellungen zehn Takte je Sekunde');
  // Beim Ausliefern an den Browser bleibt die Funktion auf dem Server.
  assert.equal(JSON.parse(JSON.stringify(strategie)).erzeugen, undefined);
});

test('raeume AC-16 / spielziel AC-5: sagt die Welt "vorbei", haelt der Raum seine Uhr an', (t) => {
  // Geprueft am erfundenen Spiel, nicht am Strategiespiel: dass eine Partie
  // enden kann, gehoert zur Form einer Welt - was sie beendet, weiss nur das
  // Spiel (ADR-0006). Der letzte Zustand geht noch raus, danach keiner mehr.
  t.mock.timers.enable({ apis: ['setInterval', 'Date'] });
  const stand = { takte: 0, vorbei: false };
  const puzzle = {
    art: 'puzzle',
    takte: 10,
    erzeugen() {
      return {
        aufbau: () => ({ typ: 'aufbau' }),
        takten: () => { stand.takte += 1; if (stand.takte === 3) stand.vorbei = true; },
        zustand: () => ({ typ: 'zustand', takt: stand.takte }),
        get vorbei() { return stand.vorbei; },
      };
    },
  };
  const raeume = new Raeume();
  try {
    const raum = raeume.anlegen(puzzle);
    const anna = draht();
    raum.beitreten('Anna', anna);
    raum.beitreten('Bert', draht());
    assert.deepEqual(raum.starten(7), {});

    t.mock.timers.tick(300); // drei Takte: beim dritten ist die Partie aus
    assert.equal(stand.takte, 3);
    assert.equal(anna.eingang.at(-1).takt, 3, 'der letzte Zustand traegt das Ergebnis');
    assert.equal(raum.uhr, null, 'die Uhr steht');

    const danach = anna.eingang.length;
    t.mock.timers.tick(2000);
    assert.equal(stand.takte, 3, 'es wird nicht weitergerechnet');
    assert.equal(anna.eingang.length, danach, 'und nichts mehr geschickt');
  } finally {
    raeume.halt();
  }
});

test('raeume AC-16 / spielziel AC-9: nach dem Ende startet derselbe Raum eine zweite Partie - vorher nicht', (t) => {
  // Die Revanche ist ein **zweiter Start desselben Raums**, nichts
  // Spielspezifisches: deshalb am erfundenen Spiel geprueft. Der Raum weiss
  // nur, dass die Welt `vorbei` sagt (ADR-0006) - und dass er dann noch einmal
  // erzeugen darf.
  t.mock.timers.enable({ apis: ['setInterval', 'Date'] });
  const partien = [];
  const puzzle = {
    art: 'puzzle',
    takte: 10,
    erzeugen(spieler, einstellungen) {
      const nummer = partien.length;
      const partie = {
        nummer,
        namen: spieler.map((s) => s.name),
        startwert: einstellungen.startwert,
        takte: 0,
        vorbei: false,
        aufbau: () => ({ typ: 'aufbau', nummer }),
        takten() { this.takte += 1; if (this.takte === 3) this.vorbei = true; },
        zustand() { return { typ: 'zustand', nummer, takt: this.takte }; },
      };
      partien.push(partie);
      return partie;
    },
  };
  const raeume = new Raeume();
  try {
    const raum = raeume.anlegen(puzzle);
    const anna = draht();
    const bert = draht();
    const cem = draht();
    raum.beitreten('Anna', anna);
    raum.beitreten('Bert', bert);
    raum.beitreten('Cem', cem);
    assert.deepEqual(raum.starten(7), {});
    assert.equal(partien.length, 1);

    // Solange die Partie laeuft, ist ein zweiter Start keine Revanche, sondern
    // ein Weg, eine verlorene Stellung wegzuwerfen.
    assert.match(raum.starten(8).fehler, /läuft schon/);
    assert.equal(partien.length, 1, 'und es wurde nichts erzeugt');

    t.mock.timers.tick(300); // drei Takte, beim dritten ist sie aus
    assert.equal(partien[0].vorbei, true);
    assert.equal(raum.uhr, null, 'die Uhr steht');

    // Cem hat in der Partie die Verbindung verloren. Sein Platz bleibt stehen,
    // solange sie laeuft - zurueckkehren koennen gehoert zum Raum (raeume
    // AC-12). Die Revanche spielt er nicht mit.
    raum.verlassen(cem);
    assert.equal(raum.spieler.length, 3, 'in der beendeten Partie steht sein Platz noch');

    assert.deepEqual(raum.starten(8), {});
    assert.equal(partien.length, 2, 'eine zweite Partie');
    assert.deepEqual(partien[1].namen, ['Anna', 'Bert'], 'ohne den, der weg ist');
    assert.equal(raum.spieler.length, 2);
    assert.equal(partien[1].startwert, 8, 'mit dem neuen Startwert');
    assert.deepEqual(anna.eingang.at(-1), { typ: 'aufbau', nummer: 1 }, 'alle bekommen den neuen Aufbau');
    assert.deepEqual(bert.eingang.at(-1), { typ: 'aufbau', nummer: 1 });
    assert.ok(raum.uhr, 'und die Uhr laeuft wieder');

    t.mock.timers.tick(200);
    assert.equal(partien[1].takte, 2, 'die neue Partie taktet');
    assert.equal(partien[0].takte, 3, 'die alte nicht mehr');
    assert.equal(anna.eingang.at(-1).nummer, 1, 'die Zustaende kommen aus der neuen Partie');

    // Zu wenige fuer eine dritte: wer allein uebrig ist, bekommt dieselbe
    // Absage wie beim ersten Start.
    raum.verlassen(bert);
    assert.match(raum.starten(9).fehler, /läuft schon/, 'die zweite Partie laeuft noch');
    t.mock.timers.tick(100); // der dritte Takt: auch sie ist aus
    assert.equal(partien[1].vorbei, true);
    assert.match(raum.starten(9).fehler, /Mitspieler/);
    assert.equal(partien.length, 2);
  } finally {
    raeume.halt();
  }
});

test('auswahl AC-22: der Raum traegt die Wahl je Platz weiter, ohne sie zu deuten', () => {
  // Ein erfundenes Spiel mit einer Farbe je Platz statt eines Teams: der Raum
  // prueft sie wie eine Einstellung und reicht sie beim Start durch - er weiss
  // nicht, was "Farbe" ist, und nicht, was "Team" ist (ADR-0006).
  const aufrufe = { einstellungen: null };
  const puzzle = {
    art: 'puzzle',
    takte: 20,
    plaetze: () => 1,
    platzname: (n) => `Roboter ${n}`,
    jePlatz: [{
      schluessel: 'farbe', name: 'Farbe', art: 'wahl', vorgabe: 'rot',
      werte: [{ wert: 'rot', name: 'rot' }, { wert: 'gelb', name: 'gelb' }],
    }],
    erzeugen(spieler, einstellungen) {
      aufrufe.einstellungen = einstellungen;
      return { aufbau: () => ({ typ: 'aufbau' }), takten() {}, zustand: () => ({ typ: 'zustand' }) };
    },
  };
  const raeume = new Raeume();
  try {
    const raum = raeume.anlegen(puzzle);
    const { spieler: anna } = raum.beitreten('Anna', draht());
    const { spieler: bert } = raum.beitreten('Bert', draht());
    assert.deepEqual(raum.vorraum().plaetze.map((p) => [p.name, p.platz]),
      [['Anna', anna.id], ['Bert', bert.id], ['Roboter 1', 'platz1']]);
    assert.deepEqual(raum.waehlen(bert, bert.id, { farbe: 'gelb' }), {});
    assert.deepEqual(raum.waehlen(anna, 'platz1', { farbe: 'gelb' }), {});
    assert.match(raum.waehlen(anna, anna.id, { farbe: 'blau' }).fehler, /^Farbe: erlaubt ist rot, gelb/);
    assert.match(raum.waehlen(anna, anna.id, { team: 1 }).fehler, /gibt es nicht: team/);
    assert.deepEqual(raum.starten(7), {});
    raum.beenden();
    assert.deepEqual(aufrufe.einstellungen.jePlatz, {
      [anna.id]: { farbe: 'rot' }, [bert.id]: { farbe: 'gelb' }, platz1: { farbe: 'gelb' },
    });
  } finally {
    raeume.halt();
  }
  // Und im Raum steht kein Wort vom Team.
  const quelle = readFileSync(join(import.meta.dirname, '..', 'server', 'raeume.js'), 'utf8')
    .replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(quelle, /team/i);
});

test('auswahl AC-22: ein Spiel ohne Wahl je Platz bekommt keine', () => {
  const raeume = new Raeume();
  try {
    const raum = raeume.anlegen({ art: 'puzzle', takte: 20, erzeugen: () => ({}) });
    const { spieler: anna } = raum.beitreten('Anna', draht());
    assert.deepEqual(raum.vorraum().jePlatz, []);
    assert.match(raum.waehlen(anna, anna.id, { farbe: 'rot' }).fehler, /nichts zu wählen/);
  } finally {
    raeume.halt();
  }
});

// ---- Die Spielgeschwindigkeit (spielziel AC-23, Runde 159) -----------------
//
// Der Raum erfaehrt die Zahl der Takte je echte Sekunde vom Steckbrief -
// als Zahl oder als Funktion der Einstellungen. Geprueft am erfundenen
// Spiel: was "schneller" heisst, weiss nur das Spiel (ADR-0006).

function tempoSpiel(stand) {
  return {
    art: 'puzzle',
    takte: (einstellungen) => (einstellungen.schnell ? 15 : 10),
    erzeugen() {
      return {
        aufbau: () => ({ typ: 'aufbau' }),
        takten: () => { stand.takte += 1; },
        zustand: () => ({ typ: 'zustand', takt: stand.takte }),
      };
    },
  };
}

test('spielziel AC-23: bei 15 Takten je Sekunde rechnet der Raum in zehn Sekunden 150 Takte', (t) => {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'] });
  for (const [einstellungen, erwartet] of [[{ schnell: true }, 150], [{}, 100]]) {
    const stand = { takte: 0 };
    const raeume = new Raeume();
    try {
      const raum = raeume.anlegen(tempoSpiel(stand));
      raum.einstellungen = einstellungen;
      raum.beitreten('Anna', draht());
      raum.beitreten('Bert', draht());
      assert.deepEqual(raum.starten(7), {});
      // In Schritten von 10 ms, wie eine Uhr, die ab und zu nachsieht:
      // 66,7 ms je Schlag gehen nicht in ganzen Millisekunden auf.
      for (let ms = 0; ms < 10_000; ms += 10) t.mock.timers.tick(10);
      assert.ok(Math.abs(stand.takte - erwartet) <= 1, `${stand.takte} Takte statt ${erwartet}`);
    } finally {
      raeume.halt();
    }
  }
});

test('spielziel AC-23: kommt ein Schlag zu spaet, holt der naechste nach - hoechstens eine Sekunde', (t) => {
  // `setInterval` kommt in Wirklichkeit nie puenktlich. Hier wird die Uhr
  // vorgestellt, ohne dass ein Schlag faellt (`setTime`): der naechste
  // rechnet, was bis dahin faellig war. Gegenprobe: ein Raum, der je
  // Schlag einen Takt rechnet, faellt hier zurueck (Runde 159).
  t.mock.timers.enable({ apis: ['setInterval', 'Date'], now: 0 });
  const stand = { takte: 0 };
  const raeume = new Raeume();
  try {
    const raum = raeume.anlegen(tempoSpiel(stand));
    raum.einstellungen = { schnell: true };
    raum.beitreten('Anna', draht());
    raum.beitreten('Bert', draht());
    assert.deepEqual(raum.starten(7), {});
    t.mock.timers.tick(1000);
    assert.equal(stand.takte, 15, 'eine Sekunde: fuenfzehn Takte');
    // 400 ms gestockt, dann ein Schlag: sechs Takte zu den fuenfzehn.
    t.mock.timers.setTime(Date.now() + 400);
    t.mock.timers.tick(67);
    assert.equal(stand.takte, Math.floor(((1000 + 400 + 67) * 15) / 1000), 'nachgeholt');
    // Zehn Sekunden gestockt: nachgeholt wird eine Sekunde, nicht zehn -
    // sonst rennt die Welt danach davon.
    const vorher = stand.takte;
    t.mock.timers.setTime(Date.now() + 10_000);
    t.mock.timers.tick(67);
    assert.ok(stand.takte - vorher <= 16, `${stand.takte - vorher} Takte auf einmal`);
    assert.ok(stand.takte - vorher >= 15, 'aber die eine Sekunde schon');
  } finally {
    raeume.halt();
  }
});

test('spielziel AC-23: der Raum kennt keine Spielgeschwindigkeit, nur takte des Steckbriefs', () => {
  const quelle = readFileSync(join(import.meta.dirname, '..', 'server', 'raeume.js'), 'utf8')
    .replace(/\/\/.*$/gm, '');
  assert.doesNotMatch(quelle, /tempo|geschwindigkeit/i);
  assert.match(quelle, /spiel\.takte\(einstellungen\)/);
});
