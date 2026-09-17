// Die KI und der Pruefstand (→ specs/10-strategie/ki.md, fahrplan AC-4) -
// Rechenteile, direkt geprueft (→ docs/adr/0004-teststrategie.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const karten = require('../server/spiele/strategie/karte.js');
const { Welt } = require('../server/spiele/strategie/welt.js');
const { Ki } = require('../server/spiele/strategie/ki.js');
const { partieSpielen, pruefen, Widerspruch } = require('../server/spiele/strategie/pruefstand.js');

const ZWEI = [{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }];

// Was sich in der Welt aendern kann, als Text - zum Vergleichen.
const abbild = (welt) => JSON.stringify({
  takt: welt.takt,
  spieler: welt.spieler,
  einheiten: [...welt.einheiten.values()],
  gebaeude: [...welt.gebaeude.values()],
  tiere: [...welt.tiere.values()],
  felder: Array.from(welt.karte.felder),
});

test('ki AC-1: die KI aendert die Welt nie selbst, nur ueber Nachrichten wie der Browser', () => {
  const welt = new Welt(ZWEI, 7);
  const ki = new Ki(welt, 'a');
  const echt = welt.nachricht.bind(welt);
  const gesendet = [];
  for (let runde = 0; runde < 40; runde++) {
    // Waehrend die KI entscheidet, kommen Nachrichten nur an und wirken nicht.
    welt.nachricht = (spielerId, nachricht) => { gesendet.push({ spielerId, nachricht }); return {}; };
    const vorher = abbild(welt);
    ki.entscheiden();
    assert.equal(abbild(welt), vorher, `Runde ${runde}: die KI hat die Welt ohne Nachricht veraendert`);
    // Dann wirken sie, und die Welt laeuft weiter.
    welt.nachricht = echt;
    for (const { nachricht } of gesendet.splice(0)) welt.nachricht('a', nachricht);
    for (let t = 0; t < 5; t++) welt.takten();
  }
  assert.ok(welt.einheiten.size > 0);
  // Sie hat tatsaechlich etwas gewollt - sonst waere die Pruefung leer.
  assert.ok([...welt.einheiten.values()].some((e) => e.besitzer === 'a' && (e.auftrag || e.sammelt)), 'die KI hat Dorfbewohner losgeschickt');
});

test('ki AC-1: was einem Menschen abgewiesen wird, wird der KI genauso abgewiesen', () => {
  const welt = new Welt(ZWEI, 7);
  const ki = new Ki(welt, 'a');
  const bauer = [...welt.einheiten.values()].find((e) => e.besitzer === 'a' && e.art === 'dorfbewohner');
  const zentrum = [...welt.gebaeude.values()].find((g) => g.besitzer === 'a');
  const fremdes = [...welt.gebaeude.values()].find((g) => g.besitzer === 'b');
  const befehle = [
    // Auf das eigene Dorfzentrum bauen.
    { auftrag: 'bauen', einheiten: [bauer.id], art: 'haus', ziel: { x: zentrum.x, y: zentrum.y } },
    // Im fremden Dorfzentrum ausbilden.
    { auftrag: 'ausbilden', gebaeude: fremdes.id, einheit: 'dorfbewohner' },
    // Eine Burg, die es nicht gibt.
    { auftrag: 'bauen', einheiten: [bauer.id], art: 'burg', ziel: { x: 1, y: 1 } },
  ];
  for (const befehl of befehle) {
    const mensch = new Welt(ZWEI, 7).nachricht('a', befehl);
    const vorher = abbild(welt);
    const antwort = ki.senden(befehl);
    assert.ok(antwort.fehler, `abgewiesen: ${JSON.stringify(befehl)}`);
    assert.equal(antwort.fehler, mensch.fehler, 'mit derselben Absage wie fuer einen Menschen');
    assert.equal(abbild(welt), vorher, 'und ohne Wirkung');
  }
  assert.equal(ki.abgewiesen, befehle.length, 'die KI zaehlt ihre Absagen');
});

test('ki AC-2: zwei Partien KI gegen KI mit demselben Startwert enden gleich, ein anderer Startwert anders', () => {
  const a = partieSpielen({ startwert: 31, minuten: 3 });
  const b = partieSpielen({ startwert: 31, minuten: 3 });
  const c = partieSpielen({ startwert: 32, minuten: 3 });
  assert.equal(abbild(a.welt), abbild(b.welt), 'Takt fuer Takt gleich - am Ende derselbe Zustand');
  assert.deepEqual(a.spieler, b.spieler);
  assert.notEqual(abbild(a.welt), abbild(c.welt), 'ein anderer Startwert gibt eine andere Partie');
});

test('ki AC-7: npm run pruefstand:strategie spielt Partien ohne Server und Browser und schreibt Kennzahlen', () => {
  const skript = fileURLToPath(new URL('../scripts/pruefstand-strategie.mjs', import.meta.url));
  const ausgabe = execFileSync(process.execPath, [skript, '--partien', '2', '--minuten', '1', '--startwert', '5'], { encoding: 'utf8' });
  // Je Partie Startwert und Dauer, je Spieler Kennzahlen.
  assert.match(ausgabe, /^Startwert 5 · \d+ ms · 600 Takte$/m);
  assert.match(ausgabe, /^Startwert 6 · \d+ ms · 600 Takte$/m);
  const zeilen = ausgabe.split('\n').filter((z) => /^ {2}KI \d: \d+ Dorfbewohner/.test(z));
  assert.equal(zeilen.length, 4, 'zwei Partien mal zwei Spieler');
  for (const zeile of zeilen) assert.match(zeile, /Holz \d+, Nahrung \d+, Gold \d+, Stein \d+/);
  assert.match(ausgabe, /keine Widersprueche/);
});

test('ki AC-8 / fahrplan AC-4: der Pruefstand prueft jeden Takt und bricht mit Startwert und Takt ab', () => {
  // Ein negativer Vorrat mitten in der Partie.
  assert.throws(
    () => partieSpielen({ startwert: 9, minuten: 1, eingriff: (welt, takt) => { if (takt === 37) welt.spieler[1].holz = -5; } }),
    (fehler) => fehler instanceof Widerspruch && fehler.startwert === 9 && fehler.takt === 37 && /KI 2: holz ist -5/.test(fehler.message),
  );

  // Jede Art von Widerspruch wird erkannt.
  const welt = new Welt(ZWEI, 7);
  assert.deepEqual(pruefen(welt), [], 'eine frische Welt ist in Ordnung');
  const einheit = [...welt.einheiten.values()][0];
  const g = welt.karte.groesse;
  const baum = welt.karte.felder.findIndex((f) => f === karten.WALD);
  einheit.x = baum % g;
  einheit.y = Math.floor(baum / g);
  assert.match(pruefen(welt).join(), /in einem Hindernis/);
  einheit.x = welt.spielerVon('a').basis.x + 3;
  einheit.y = welt.spielerVon('a').basis.y + 3;

  const zentrum = [...welt.gebaeude.values()].find((x) => x.besitzer === 'a');
  welt.gebaeude.set(9999, { ...zentrum, id: 9999, x: zentrum.x + 1 });
  assert.match(pruefen(welt).join(), /ueberlappen/);
  welt.gebaeude.delete(9999);

  for (let i = 0; i < 201; i++) welt.einheiten.set(10000 + i, { ...einheit, id: 10000 + i });
  assert.match(pruefen(welt).join(), /Bevoelkerung 20\d ueber 200/);
});

test('fahrplan AC-4: zehn Spielminuten KI gegen KI ohne Widerspruch, ueber mehrere Startwerte', () => {
  for (const startwert of [1, 4711, 20260917]) {
    const ergebnis = partieSpielen({ startwert, minuten: 10 });
    assert.equal(ergebnis.takte, 6000);
    for (const spieler of ergebnis.spieler) assert.ok(spieler.dorfbewohner > 3, `${startwert}: ${spieler.name} hat ausgebildet`);
  }
});
