// Der Spielstand einer Strategiepartie (speichern AC-1, AC-2, AC-5, AC-16,
// AC-17; ADR-0017, Schritt S1) - Rechenteile, direkt geprueft
// (→ docs/adr/0004-teststrategie.md). Dass eine geladene Partie ueber zwanzig
// Startwerte Takt fuer Takt wie die ununterbrochene weiterlaeuft, rechnet
// `tests/partien/speichern-gleichlauf.mjs`; dass kein Feld still aus der Form
// faellt, `tests/waechter-stand.test.mjs`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { unterschiede } from './gleichwertig.mjs';
import { quelltext } from './quelltext.mjs';

const require = createRequire(import.meta.url);
const steckbrief = require('../server/spiele/strategie/steckbrief.js');
const stand = require('../server/spiele/strategie/stand.js');
const karten = require('../server/spiele/strategie/karte.js');
const { Welt, TAKTE_PRO_SEKUNDE } = require('../server/spiele/strategie/welt.js');

const MB = 1024 * 1024;

function takten(welt, takte) {
  const ids = welt.spieler.map((s) => s.id);
  for (let i = 0; i < takte && !welt.ende; i++) {
    welt.takten();
    welt.zustandJeSpieler(ids);
  }
  return welt;
}

// Eine Partie KI gegen KI, zwoelf Spielminuten weit - das Lehen steht, das
// erste Heer ist unterwegs.
let partie;
const mitten = () => (partie ??= takten(steckbrief.erzeugen([], { ki: 2, startwert: 5 }), 12 * 60 * TAKTE_PRO_SEKUNDE));

test('speichern AC-1: sichern() liefert Bytes, laden() stellt daraus Welt und KIs wieder her', () => {
  const welt = mitten();
  const bytes = welt.sichern();
  assert.ok(bytes instanceof Uint8Array, 'ein Stand ist ein Wert aus Bytes, kein Dateiname');
  const geladen = steckbrief.laden(bytes);
  assert.ok(geladen instanceof Welt);
  assert.notEqual(geladen, welt);
  assert.equal(geladen.takt, welt.takt);
  assert.equal(geladen.einheiten.size, welt.einheiten.size);
  // Die KIs kommen mit: die geladene Welt sichert sie wieder mit.
  assert.equal(stand.lesen(geladen.sichern()).kis.length, 2);
  // Und sie spielt weiter - die KIs schicken Befehle an die geladene Welt.
  const vorher = geladen.takt;
  takten(geladen, 50);
  assert.equal(geladen.takt, vorher + 50);
});

test('speichern AC-1: auch eine Welt ohne KI sichert und laedt', () => {
  const welt = takten(new Welt([{ id: 'a', name: 'Anna' }, { id: 'b', name: 'Bert' }], 3), 200);
  const geladen = steckbrief.laden(welt.sichern());
  assert.deepEqual(unterschiede(stand.lesen(welt.sichern()), stand.lesen(geladen.sichern())), []);
  assert.deepEqual(stand.lesen(geladen.sichern()).kis, []);
});

test('speichern AC-1: im Spiel selbst greift nichts auf Dateien zu', () => {
  const quellen = ['stand.js', 'welt.js', 'ki.js', 'steckbrief.js', 'karte.js', 'wege.js'];
  for (const datei of quellen) {
    const text = quelltext(`server/spiele/strategie/${datei}`);
    assert.doesNotMatch(text, /require\(['"](node:)?fs(\/promises)?['"]\)/, `${datei} liest oder schreibt Dateien`);
  }
});

test('speichern AC-2: sichern, laden, sichern - der zweite Wert ist gleich dem ersten', () => {
  const welt = mitten();
  const erst = welt.sichern();
  const zweit = steckbrief.laden(erst).sichern();
  assert.deepEqual(unterschiede(stand.lesen(erst), stand.lesen(zweit)), []);
  // Byte fuer Byte gleich wird es ab dem zweiten Laden: V8 schreibt eine
  // Zahl, die es eben gelesen hat, so wie es sie gelesen hat
  // (tests/gleichwertig.mjs).
  const dritt = steckbrief.laden(zweit).sichern();
  assert.ok(dritt.equals(zweit), 'ein zweimal geladener Stand sichert sich Byte fuer Byte gleich');
});

test('speichern AC-2: Verbuendete teilen nach dem Laden wieder ein Sichtfeld', () => {
  const welt = takten(steckbrief.erzeugen([], { ki: 4, startwert: 8, teams: { ki1: 1, ki2: 1, ki3: 2, ki4: 2 } }), 600);
  assert.equal(welt.sichten.get('ki1'), welt.sichten.get('ki2'), 'Voraussetzung: vor dem Sichern geteilt');
  const geladen = steckbrief.laden(welt.sichern());
  assert.equal(geladen.sichten.get('ki1'), geladen.sichten.get('ki2'), 'ein Feld, nicht zwei gleiche');
  assert.notEqual(geladen.sichten.get('ki1'), geladen.sichten.get('ki3'));
});

test('speichern AC-2: der Zufall laeuft nach dem Laden dort weiter, wo er stand', () => {
  const zufall = karten.zufallAus(42);
  for (let i = 0; i < 17; i++) zufall();
  const weiter = karten.zufallAusStand(zufall.stand());
  for (let i = 0; i < 100; i++) assert.equal(weiter(), zufall());
});

test('speichern AC-2: der Vergleich findet, was abweicht', () => {
  assert.deepEqual(unterschiede({ a: 1, b: [1, 2] }, { a: 1, b: [1, 2] }), []);
  assert.deepEqual(unterschiede({ a: 1 }, { a: 2 }), ['a: 1 statt 2']);
  assert.equal(unterschiede(new Map([[1, 'x'], [2, 'y']]), new Map([[2, 'y'], [1, 'x']])).length, 1, 'Reihenfolge einer Map');
  assert.equal(unterschiede({ a: 1, b: 2 }, { b: 2, a: 1 }).length, 1, 'Reihenfolge der Felder');
  assert.equal(unterschiede([1, , 3], [1, undefined, 3]).length, 1, 'Luecke gegen undefined');
  const geteilt = { x: 1 };
  assert.equal(unterschiede([geteilt, geteilt], [{ x: 1 }, { x: 1 }]).length, 1, 'geteilt gegen zwei gleiche');
  assert.equal(unterschiede(new Uint8Array([1, 2]), new Uint8Array([1, 3])).length, 1);
  assert.equal(unterschiede(new Set([1]), new Set([1, 2])).length, 1);
  assert.equal(unterschiede(new Map(), {}).length, 1, 'Map gegen Objekt');
});

// Die groesste Partie, die das Spiel kennt (fahrplan AC-20): acht Spieler auf
// der grossen Karte im Nebel, je 200 Einheiten, die Haelfte an der Arbeit,
// die andere im Angriffslauf zur Mitte. Daran haengt die Grenze.
function grossePartie() {
  const spieler = Array.from({ length: 8 }, (_, i) => ({ id: `s${i}`, name: `S${i}` }));
  const welt = new Welt(spieler, 4711, { kartengroesse: 'gross', sicht: 'nebel' });
  const g = welt.karte.groesse;
  const mitte = { x: Math.round(g / 2), y: Math.round(g / 2) };
  const belegt = new Set([...welt.einheiten.values()].map((e) => Math.round(e.y) * g + Math.round(e.x)));
  for (const s of welt.spieler) {
    const neu = [];
    for (let r = 3; neu.length < 195 && r < 30; r++) {
      for (let dy = -r; dy <= r && neu.length < 195; dy++) {
        for (let dx = -r; dx <= r && neu.length < 195; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          const x = s.basis.x + dx;
          const y = s.basis.y + dy;
          if (belegt.has(y * g + x) || !karten.begehbar(welt.karte, x, y)) continue;
          belegt.add(y * g + x);
          neu.push(welt.einheitAnlegen(s.id, x, y, neu.length % 2 ? 'dorfbewohner' : 'speerkaempfer'));
        }
      }
    }
    for (const e of neu.filter((e) => e.art === 'dorfbewohner')) {
      const vorrat = welt.naechsterVorrat(s.basis, karten.WALD);
      if (vorrat) welt.befehl(s.id, [e.id], vorrat);
    }
    welt.befehl(s.id, neu.filter((e) => e.art !== 'dorfbewohner').map((e) => e.id), mitte, true);
  }
  return takten(welt, 600);
}

test('speichern AC-5: ein Stand bleibt unter 1 MB - auch acht Spieler mit je 200 Einheiten', (t) => {
  for (const [name, welt] of [['KI gegen KI, Minute 12', mitten()], ['acht Spieler je 200 Einheiten', grossePartie()]]) {
    const beginn = performance.now();
    const bytes = welt.sichern();
    const sichernMs = performance.now() - beginn;
    const danach = performance.now();
    steckbrief.laden(bytes);
    const ladenMs = performance.now() - danach;
    t.diagnostic(`${name}: ${welt.einheiten.size} Einheiten, ${welt.gebaeude.size} Gebaeude, Stand ${(bytes.length / 1024).toFixed(0)} KB, sichern ${sichernMs.toFixed(1)} ms, laden ${ladenMs.toFixed(1)} ms`);
    assert.ok(bytes.length < MB, `${name}: ${bytes.length} Bytes`);
  }
});

test('speichern AC-16: jeder Stand traegt vorn die Fassung, die ihn geschrieben hat', () => {
  const bytes = mitten().sichern();
  assert.equal(Buffer.from(bytes.subarray(0, 4)).toString('latin1'), 'FAST');
  assert.equal(stand.fassungVon(bytes), stand.FASSUNG);
  assert.ok(Number.isInteger(stand.FASSUNG) && stand.FASSUNG >= 1);
  assert.equal(stand.fassungVon(Buffer.from('kein Stand')), null);
});

/** Ein Stand mit anderer Fassung im Kopf - der Inhalt bleibt, wie er ist. */
function mitFassung(bytes, fassung) {
  const anders = Buffer.from(bytes);
  anders.writeUInt32BE(fassung, 4);
  return anders;
}

function abgelehnt(bytes, grund, satz) {
  assert.throws(
    () => steckbrief.laden(bytes),
    (fehler) => fehler instanceof stand.StandFehler && fehler.grund === grund && fehler.message === satz,
  );
}

test('speichern AC-17: ein Stand einer neueren Fassung wird abgelehnt, mit dem Satz dazu', () => {
  abgelehnt(mitFassung(mitten().sichern(), stand.FASSUNG + 1), 'neuer', 'Dieser Spielstand stammt aus einer neueren Fassung des Spiels.');
});

test('speichern AC-17: ein Stand einer aelteren Fassung ohne Weg dorthin wird abgelehnt, nicht halb geladen', () => {
  // Fassung 0 hat es nie gegeben - von ihr fuehrt kein Schritt weg. Die
  // Fassungen darueber haben seit AC-18 jede einen (SCHRITTE).
  abgelehnt(
    mitFassung(mitten().sichern(), 0),
    'aelter',
    'Dieser Spielstand stammt aus einer älteren Fassung des Spiels und lässt sich nicht mehr fortsetzen.',
  );
});

test('speichern AC-17: fremde und beschaedigte Bytes werden abgelehnt', () => {
  const bytes = mitten().sichern();
  abgelehnt(Buffer.from('{"welt":{}}'), 'fremd', 'Das ist kein Spielstand von Fading Allies.');
  abgelehnt(new Uint8Array(0), 'fremd', 'Das ist kein Spielstand von Fading Allies.');
  abgelehnt(bytes.subarray(0, bytes.length >> 1), 'kaputt', 'Der Spielstand ist beschädigt und lässt sich nicht laden.');
  const verdreht = Buffer.from(bytes);
  for (let i = 8; i < 40; i++) verdreht[i] ^= 0xff;
  abgelehnt(verdreht, 'kaputt', 'Der Spielstand ist beschädigt und lässt sich nicht laden.');
});
