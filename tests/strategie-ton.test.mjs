// Ton (→ specs/10-strategie/bedienung.md AC-59 bis AC-61): Geraeusche zu
// Ereignissen, leise Musik, beides abschaltbar. Das Modul laeuft im Browser;
// hier wird geprueft, was sich ohne Lautsprecher pruefen laesst: welches
// Ereignis welchen Klang hat, dass derselbe nicht doppelt beginnt, wann die
// Musik spielt und auf welchen Toenen, und dass die Wahl gemerkt wird. Dass
// am Ausgang wirklich etwas ankommt, misst e2e/tests/strategie-ton.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lesen = (pfad) => readFileSync(new URL(`../${pfad}`, import.meta.url), 'utf8');
// public/ton.js ist ein Modul fuer den Browser; Node hielte die Endung .js
// hier fuer CommonJS. Es bindet nichts ein, also laesst es sich als Text laden.
const { KLAENGE, Ton } = await import(`data:text/javascript;base64,${Buffer.from(lesen('public/ton.js')).toString('base64')}`);

function speicher(anfang = {}) {
  const werte = new Map(Object.entries(anfang));
  return { getItem: (k) => (werte.has(k) ? werte.get(k) : null), setItem: (k, v) => werte.set(k, String(v)), werte };
}

// Ein Klangausgang, der nur aufschreibt: welche Schwinger mit welcher
// Frequenz, und wohin der Regler der Musik laeuft.
function ausgangAufschreiben() {
  const schwinger = [];
  const wert = (v = 0) => ({
    value: v,
    setValueAtTime(x) { this.value = x; },
    linearRampToValueAtTime(x) { this.value = x; },
    exponentialRampToValueAtTime(x) { this.value = x; },
    cancelScheduledValues() {},
  });
  const knoten = (mehr = {}) => ({ connect() {}, ...mehr });
  class Ausgang {
    constructor() {
      this.currentTime = 0;
      this.sampleRate = 8000;
      this.state = 'running';
      this.destination = knoten();
    }
    createGain() { return knoten({ gain: wert(1) }); }
    createAnalyser() { return knoten({ fftSize: 0, getFloatTimeDomainData() {} }); }
    createBiquadFilter() { return knoten({ frequency: wert(), Q: wert() }); }
    createDelay() { return knoten({ delayTime: wert() }); }
    createOscillator() {
      const s = knoten({ frequency: wert(), type: 'sine', start() {}, stop() { this.aus = true; } });
      schwinger.push(s);
      return s;
    }
    createBuffer(kanaele, laenge) { return { getChannelData: () => new Float32Array(laenge) }; }
    createBufferSource() { return knoten({ start() {} }); }
    resume() { return Promise.resolve(); }
  }
  return { Ausgang, schwinger };
}

test('bedienung AC-59: jedes Ereignis hat seinen Klang - und was im Spiel gemeldet wird, hat einen', () => {
  assert.deepEqual(Object.keys(KLAENGE).sort(), ['absage', 'angriff', 'einheit', 'forschung', 'gebaeude', 'gefallen', 'niederlage', 'sieg', 'zeitalter']);
  const gleich = new Set();
  for (const [name, klang] of Object.entries(KLAENGE)) {
    assert.ok(klang.noten.length > 0, `${name} hat Toene`);
    assert.ok(klang.abstand >= 300, `${name}: ein Mindestabstand`);
    assert.ok(klang.laut > 0 && klang.laut <= 0.25, `${name}: leise genug, dass nichts uebersteuert`);
    for (const note of klang.noten) {
      assert.ok(Number.isFinite(note.h) && note.t >= 0 && note.d > 0, `${name}: ${JSON.stringify(note)}`);
    }
    // Kein Klang gleicht einem anderen - sonst hoerte man nicht, was war.
    const bild = JSON.stringify([klang.form, klang.noten, klang.klopfen]);
    assert.ok(!gleich.has(bild), `${name} klingt wie ein anderer`);
    gleich.add(bild);
    // Kurz: nur Aufstieg, Sieg und Niederlage duerfen ueber eine Sekunde dauern.
    const ende = Math.max(...klang.noten.map((n) => n.t + n.d));
    if (!['zeitalter', 'sieg', 'niederlage'].includes(name)) assert.ok(ende <= 1.2, `${name} dauert ${ende} s`);
  }
  // Der Angriff darf nicht zum Dauerhorn werden.
  assert.ok(KLAENGE.angriff.abstand >= 5000);

  // Was Ansicht und app.js beim Namen nennen, gibt es.
  const genannt = [
    ...lesen('public/ansicht.js').matchAll(/this\.ereignis\('([a-z]+)'\)/g),
    ...lesen('public/app.js').matchAll(/ton\.spielen\('([a-z]+)'/g),
  ].map((m) => m[1]);
  for (const name of genannt) assert.ok(KLAENGE[name], `${name} wird gemeldet, hat aber keinen Klang`);
  for (const name of Object.keys(KLAENGE)) assert.ok(genannt.includes(name), `${name} hat einen Klang, wird aber nie gemeldet`);
});

test('bedienung AC-59: derselbe Klang beginnt nicht zweimal im selben Augenblick - zehn fertige Dorfbewohner sind einer', () => {
  let jetzt = 1000;
  const ton = new Ton(speicher(), { uhr: () => jetzt });
  assert.equal(ton.spielen('einheit'), true);
  for (let i = 0; i < 9; i++) assert.equal(ton.spielen('einheit'), false, 'im selben Takt');
  // Ein anderer Klang ist davon nicht betroffen.
  assert.equal(ton.spielen('forschung'), true);
  jetzt += KLAENGE.einheit.abstand - 1;
  assert.equal(ton.spielen('einheit'), false);
  jetzt += 1;
  assert.equal(ton.spielen('einheit'), true);
  assert.deepEqual(ton.protokoll.map((p) => p.name), ['einheit', 'forschung', 'einheit']);
  // Der Angriff: einmal, dann acht Sekunden Ruhe.
  assert.equal(ton.spielen('angriff'), true);
  jetzt += 7999;
  assert.equal(ton.spielen('angriff'), false);
  jetzt += 1;
  assert.equal(ton.spielen('angriff'), true);
  assert.equal(ton.spielen('gibtesnicht'), false);
});

test('bedienung AC-59: ein Ereignis wird zu Schwingungen - erst nach der ersten Handlung des Spielers', () => {
  const { Ausgang, schwinger } = ausgangAufschreiben();
  globalThis.AudioContext = Ausgang;
  try {
    const ton = new Ton(speicher());
    // Vor dem ersten Klick laesst der Browser keinen Ton zu: es wird gar
    // kein Ausgang angelegt, sonst stuende eine Warnung in der Konsole.
    assert.equal(ton.spielen('forschung'), true, 'gezaehlt wird es');
    assert.equal(ton.ctx, null);
    assert.equal(schwinger.length, 0);
    ton.entsperren();
    assert.equal(ton.spielen('zeitalter'), true);
    assert.equal(schwinger.length, KLAENGE.zeitalter.noten.length);
    assert.ok(schwinger.every((s) => s.aus), 'jede Stimme hat ein Ende');
    // a' ist 440 Hz, das d' darunter 293,66.
    assert.ok(Math.abs(schwinger[0].frequency.value - 293.66) < 0.01, String(schwinger[0].frequency.value));
  } finally {
    delete globalThis.AudioContext;
  }
});

test('bedienung AC-60: die Musik spielt nur in der Partie, nach der ersten Handlung und im sichtbaren Fenster - auf fuenf Toenen', () => {
  const { Ausgang, schwinger } = ausgangAufschreiben();
  globalThis.AudioContext = Ausgang;
  const ton = new Ton(speicher());
  try {
    ton.partieSetzen(true);
    assert.equal(ton.musikLaeuft, false, 'vor dem ersten Klick nicht');
    ton.entsperren();
    assert.equal(ton.musikLaeuft, true);
    assert.ok(ton.musikUhr, 'die naechste Folge ist bestellt');
    // Viele Folgen: jeder Ton liegt auf d, e, g, a oder c.
    for (let i = 0; i < 200; i++) {
      clearTimeout(ton.musikUhr);
      ton.phrase();
    }
    const erlaubt = new Set([2, 4, 7, 9, 0]); // Halbtoene ueber c
    for (const s of schwinger) {
      const ueberC = Math.round(12 * Math.log2(s.frequency.value / 261.6256)) % 12;
      assert.ok(erlaubt.has((ueberC + 120) % 12), `${s.frequency.value} Hz liegt nicht auf der Leiter`);
      assert.ok(s.frequency.value >= 70 && s.frequency.value <= 1200, `${s.frequency.value} Hz: weder Brummen noch Pfeifen`);
    }
    assert.ok(schwinger.length > 1000);
    // Leise: der Regler der Musik steht weit unter dem der Geraeusche.
    assert.ok(ton.musikRegler.gain.value > 0 && ton.musikRegler.gain.value <= 0.15);

    // Im Hintergrund schweigt sie, und kommt zurueck.
    ton.sichtbarSetzen(false);
    assert.equal(ton.musikLaeuft, false);
    assert.equal(ton.musikUhr, null, 'es ist nichts mehr bestellt');
    assert.equal(ton.musikRegler.gain.value, 0);
    ton.sichtbarSetzen(true);
    assert.equal(ton.musikLaeuft, true);
    // Abgeschaltet schweigt sie, die Geraeusche bleiben.
    ton.musikSetzen(false);
    assert.equal(ton.musikLaeuft, false);
    assert.equal(ton.spielen('einheit'), true);
    ton.musikSetzen(true);
    assert.equal(ton.musikLaeuft, true);
    // Und mit der Partie endet sie.
    ton.partieSetzen(false);
    assert.equal(ton.musikLaeuft, false);
    assert.equal(ton.musikUhr, null);
  } finally {
    clearTimeout(ton.musikUhr);
    delete globalThis.AudioContext;
  }
});

test('bedienung AC-61: Geraeusche und Musik sind einzeln abschaltbar, und der Browser merkt sich die Wahl', () => {
  const ort = speicher();
  const ton = new Ton(ort);
  assert.equal(ton.geraeusche, true, 'Vorgabe: an');
  assert.equal(ton.musik, true, 'Vorgabe: an');

  ton.geraeuscheSetzen(false);
  assert.equal(ton.spielen('einheit'), false, 'abgeschaltet klingt nichts');
  assert.equal(ton.protokoll.length, 0);
  assert.equal(ton.musik, true, 'die Musik ist davon nicht betroffen');

  // Ein neues Fenster liest die Wahl.
  const zweites = new Ton(ort);
  assert.equal(zweites.geraeusche, false);
  assert.equal(zweites.musik, true);
  zweites.musikSetzen(false);
  zweites.geraeuscheSetzen(true);
  const drittes = new Ton(ort);
  assert.equal(drittes.geraeusche, true);
  assert.equal(drittes.musik, false);

  // Ohne Speicher - gesperrt oder gar nicht da - gilt die Vorgabe, und nichts wirft.
  const gesperrt = { getItem() { throw new Error('gesperrt'); }, setItem() { throw new Error('gesperrt'); } };
  const ohne = new Ton(gesperrt);
  assert.equal(ohne.geraeusche, true);
  ohne.musikSetzen(false);
  assert.equal(ohne.musik, false);
  assert.equal(new Ton().musik, true);
});
