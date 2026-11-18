// Ton (→ specs/10-strategie/bedienung.md AC-59 bis AC-62): Geraeusche zu
// Ereignissen, Kampf und Arbeit dort, wo sie im Bild stehen, Musik darunter,
// alles abschaltbar. Das Modul laeuft im Browser; hier wird geprueft, was sich
// ohne Lautsprecher pruefen laesst: welches Ereignis welchen Klang hat, dass
// derselbe nicht doppelt beginnt, wann die Musik spielt, dass ihre Stimme zu
// ihren Akkorden passt, was sie im Kampf anders macht, und dass die Wahl
// gemerkt wird. Dass am Ausgang wirklich etwas ankommt, misst
// e2e/tests/strategie-ton.spec.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const lesen = (pfad) => readFileSync(new URL(`../${pfad}`, import.meta.url), 'utf8');
// public/ton.js ist ein Modul fuer den Browser; Node hielte die Endung .js
// hier fuer CommonJS. Es bindet nichts ein, also laesst es sich als Text laden.
const { AKKORDE, GESANG_DAUER, KLAENGE, SAETZE, Ton, halbton, reglerwert } = await import(`data:text/javascript;base64,${Buffer.from(lesen('public/ton.js')).toString('base64')}`);

const SIGNALE = ['absage', 'angriff', 'einheit', 'forschung', 'gebaeude', 'gefallen', 'niederlage', 'sieg', 'zeitalter'];
const GERAEUSCHE = ['einschlag', 'einsturz', 'hacken', 'hammer', 'hieb', 'pfeil', 'pickel', 'schwert', 'treffer', 'wurf'];
// Der Moench (bedienung AC-74): eigene Abstaende - ein Gloeckchen je Sekunde,
// ein Gesang, der haelt.
const MOENCH = ['bekehren', 'bekehrt', 'heilen'];

function speicher(anfang = {}) {
  const werte = new Map(Object.entries(anfang));
  return { getItem: (k) => (werte.has(k) ? werte.get(k) : null), setItem: (k, v) => werte.set(k, String(v)), werte };
}

// Ein Zufall mit Startwert: zwei Laeufe rechnen dasselbe.
function zufallMit(start) {
  let s = start;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// Ein Klangausgang, der nur aufschreibt: welche Schwinger mit welcher
// Frequenz, wie viele Rauschstoesse, welche Orte - und wohin der Regler der
// Musik laeuft.
function ausgangAufschreiben() {
  const schwinger = [];
  const stoesse = [];
  const orte = [];
  const wert = (v = 0) => ({
    value: v,
    erst: null,
    setValueAtTime(x) { this.erst ??= x; this.value = x; },
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
    createDynamicsCompressor() { return knoten({ threshold: wert(), knee: wert(), ratio: wert(), attack: wert(), release: wert() }); }
    createConvolver() { return knoten({ buffer: null }); }
    createStereoPanner() {
      const ort = knoten({ pan: wert() });
      orte.push(ort);
      return ort;
    }
    createOscillator() {
      const s = knoten({ frequency: wert(), detune: wert(), type: 'sine', start() {}, stop() { this.aus = true; } });
      schwinger.push(s);
      return s;
    }
    createBuffer(kanaele, laenge) { return { getChannelData: () => new Float32Array(laenge) }; }
    createBufferSource() {
      const s = knoten({ start() {}, stop() { this.aus = true; } });
      stoesse.push(s);
      return s;
    }
    resume() { return Promise.resolve(); }
  }
  return { Ausgang, schwinger, stoesse, orte };
}

test('bedienung AC-59: jedes Ereignis hat seinen Klang - und was im Spiel gemeldet wird, hat einen', () => {
  assert.deepEqual(Object.keys(KLAENGE).sort(), [...SIGNALE, ...GERAEUSCHE, ...MOENCH].sort());
  const gleich = new Set();
  for (const name of SIGNALE) {
    const klang = KLAENGE[name];
    assert.ok(klang.noten.length > 0, `${name} hat Toene`);
    assert.ok(klang.abstand >= 300, `${name}: ein Mindestabstand`);
    assert.ok(klang.laut > 0 && klang.laut <= 0.25, `${name}: leise genug, dass nichts uebersteuert`);
    for (const note of klang.noten) {
      assert.ok(Number.isFinite(note.h) && note.t >= 0 && note.d > 0, `${name}: ${JSON.stringify(note)}`);
    }
    // Kein Klang gleicht einem anderen - sonst hoerte man nicht, was war.
    const bild = JSON.stringify([klang.form, klang.stimme, klang.noten, klang.klopfen]);
    assert.ok(!gleich.has(bild), `${name} klingt wie ein anderer`);
    gleich.add(bild);
    // Kurz: nur Aufstieg, Sieg und Niederlage duerfen ueber anderthalb Sekunden dauern.
    const ende = Math.max(...klang.noten.map((n) => n.t + n.d));
    if (!['zeitalter', 'sieg', 'niederlage'].includes(name)) assert.ok(ende <= 1.4, `${name} dauert ${ende} s`);
  }
  // Der Angriff darf nicht zum Dauerhorn werden.
  assert.ok(KLAENGE.angriff.abstand >= 5000);

  // Was Ansicht und app.js beim Namen nennen, gibt es - und jeder Klang wird
  // irgendwo gemeldet.
  const genannt = [
    ...lesen('public/ansicht.js').matchAll(/this\.(?:ereignis|geraeusch|klangAn)\('([a-z]+)'/g),
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
    assert.equal(ton.spielen('forschung'), false, 'eben erst');
    assert.equal(ton.spielen('einheit'), true);
    assert.equal(schwinger.length, KLAENGE.einheit.noten.length);
    // a' ist 440 Hz, das g' darunter 392.
    assert.ok(Math.abs(schwinger[0].frequency.value - 392) < 0.01, String(schwinger[0].frequency.value));
    // Die Fanfare zum Aufstieg blaest das Horn der Musik: je Ton zwei
    // Schwinger, leicht gegeneinander verstimmt.
    schwinger.length = 0;
    assert.equal(ton.spielen('zeitalter'), true);
    assert.equal(schwinger.length, KLAENGE.zeitalter.noten.length * 2);
    assert.ok(Math.abs(schwinger[0].frequency.value - 293.66) < 0.01, String(schwinger[0].frequency.value));
    assert.notEqual(schwinger[0].detune.value, schwinger[1].detune.value);
    assert.ok(schwinger.every((s) => s.aus), 'jede Stimme hat ein Ende');
  } finally {
    delete globalThis.AudioContext;
  }
});

test('bedienung AC-60: die Musik ist ein Stueck - jede Stimme fuellt ihre Takte und beginnt jeden Takt auf einem Ton des Akkords', () => {
  // d-Moll, mit dem cis der Dominante.
  const leiter = new Set(['d', 'e', 'f', 'g', 'a', 'bb', 'c', 'c#']);
  const komponiert = Object.entries(SAETZE).filter(([, satz]) => !satz.gewuerfelt);
  assert.deepEqual(komponiert.map(([name]) => name).sort(), ['aufbruch', 'hoehe', 'thema']);
  for (const [name, satz] of Object.entries(SAETZE)) {
    assert.equal(satz.akkorde.length, 8, `${name}: acht Takte`);
    for (const akkord of satz.akkorde) assert.ok(AKKORDE[akkord], `${name}: ${akkord} gibt es`);
  }
  for (const [name, satz] of komponiert) {
    assert.equal(satz.stimme.length, 8, `${name}: acht Takte Stimme`);
    satz.stimme.forEach((takt, i) => {
      const noten = takt.split(' ').map((teil) => teil.split(':'));
      const schlaege = noten.reduce((summe, [, dauer]) => summe + Number(dauer), 0);
      assert.equal(schlaege, 4, `${name}, Takt ${i + 1}: vier Schlaege`);
      for (const [note] of noten) {
        if (note === '-') continue;
        assert.ok(leiter.has(note.slice(0, -1)), `${name}, Takt ${i + 1}: ${note} liegt nicht auf der Leiter`);
        // Zwischen d' und f'': ein Horn, kein Brummen und kein Pfeifen.
        assert.ok(halbton(note) >= halbton('d4') && halbton(note) <= halbton('f5'), `${name}: ${note}`);
      }
      // Der erste Ton des Takts gehoert zum Akkord - sonst reibt es auf der Eins.
      const akkord = AKKORDE[satz.akkorde[i]];
      const klassen = new Set(akkord.toene.map((t) => ((halbton(t) % 12) + 12) % 12));
      assert.ok(klassen.has(((halbton(noten[0][0]) % 12) + 12) % 12), `${name}, Takt ${i + 1}: ${noten[0][0]} ueber ${satz.akkorde[i]}`);
    });
  }
  // Thema und Aufbruch beginnen gleich und schliessen verschieden; der
  // Aufbruch schliesst ueber der Dominante.
  assert.deepEqual(SAETZE.thema.stimme.slice(0, 5), SAETZE.aufbruch.stimme.slice(0, 5));
  assert.notDeepEqual(SAETZE.thema.stimme.slice(5), SAETZE.aufbruch.stimme.slice(5));
  assert.deepEqual(SAETZE.aufbruch.akkorde.slice(-2), ['A', 'Dm']);
  assert.equal(halbton('a4'), 0);
  assert.equal(halbton('bb3'), -11);
  assert.equal(halbton('c#5'), 4);
  assert.throws(() => halbton('h4'));
});

test('bedienung AC-60: die Musik spielt nur in der Partie, nach der ersten Handlung und im sichtbaren Fenster - im Kampf treibt sie, danach kommt die Ruhe zurueck', () => {
  const { Ausgang, schwinger, stoesse } = ausgangAufschreiben();
  globalThis.AudioContext = Ausgang;
  let jetzt = 0;
  const ton = new Ton(speicher(), { uhr: () => jetzt, zufall: zufallMit(5) });
  try {
    ton.partieSetzen(true);
    assert.equal(ton.musikLaeuft, false, 'vor dem ersten Klick nicht');
    ton.entsperren();
    assert.equal(ton.musikLaeuft, true);
    assert.ok(ton.musikUhr, 'die naechsten Takte sind bestellt');
    assert.deepEqual(ton.gespielt, ['thema'], 'sie beginnt mit dem Thema');
    assert.ok(schwinger.length > 10, 'der erste Takt ist bestellt');
    // Unter den Geraeuschen: der Regler der Musik steht unter der Haelfte.
    assert.ok(ton.musikRegler.gain.value > 0 && ton.musikRegler.gain.value <= 0.5);

    // Zweihundert Takte in Ruhe: Thema, Hoehe und Aufbruch wechseln mit
    // Ruhe und Stille - nie zwei Themen hintereinander, nie zweimal Ruhe.
    clearTimeout(ton.musikUhr);
    const takte = (anzahl) => {
      const vorher = { schwinger: schwinger.length, stoesse: stoesse.length };
      for (let i = 0; i < anzahl; i++) ton.taktSpielen(ton.ctx, 10 + i * 2.5);
      return { schwinger: schwinger.length - vorher.schwinger, stoesse: stoesse.length - vorher.stoesse };
    };
    const ruhig = takte(200);
    const laut = (name) => ['thema', 'hoehe', 'aufbruch'].includes(name);
    for (const name of ['thema', 'hoehe', 'aufbruch', 'ruhe', 'stille']) assert.ok(ton.gespielt.includes(name), `${name} kommt vor`);
    for (let i = 1; i < ton.gespielt.length; i++) {
      assert.notEqual(laut(ton.gespielt[i]), laut(ton.gespielt[i - 1]), `${ton.gespielt[i - 1]} dann ${ton.gespielt[i]}`);
    }
    for (const s of schwinger) {
      const f = s.frequency.erst ?? s.frequency.value;
      assert.ok(f >= 40 && f <= 4500, `${f} Hz: weder Brummen noch Pfeifen`);
    }

    // Es wird gekaempft: keine Ruhe mehr, und die Trommeln werden dichter.
    ton.kampfMelden(1);
    const ab = ton.gespielt.length;
    const kampf = takte(200);
    const imKampf = ton.gespielt.slice(ab);
    assert.ok(imKampf.length >= 24, String(imKampf.length));
    assert.ok(imKampf.every(laut), `im Kampf: ${imKampf.join(' ')}`);
    assert.ok(kampf.stoesse > ruhig.stoesse * 1.5, `Schlaege: ${ruhig.stoesse} in Ruhe, ${kampf.stoesse} im Kampf`);
    assert.ok(kampf.schwinger > ruhig.schwinger, 'der Bass treibt');

    // Der Kampf verklingt von selbst - eine halbe Minute spaeter ist Ruhe.
    jetzt += 30_000;
    assert.equal(ton.kampfpegel(), 0);
    const danach = ton.gespielt.length;
    takte(40);
    assert.ok(ton.gespielt.slice(danach).some((name) => !laut(name)), 'die Ruhe ist zurueck');

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

test('bedienung AC-60: wer mitten in der Ruhe angegriffen wird, wartet nicht auf die Laute - der naechste Takt ist das Thema', () => {
  const { Ausgang } = ausgangAufschreiben();
  globalThis.AudioContext = Ausgang;
  let jetzt = 0;
  const ton = new Ton(speicher(), { uhr: () => jetzt, zufall: zufallMit(9) });
  try {
    ton.partieSetzen(true);
    ton.entsperren();
    clearTimeout(ton.musikUhr);
    // Bis die Ruhe begonnen hat.
    let t = 10;
    while (ton.satz.name !== 'ruhe' || ton.satz.takt < 2) ton.taktSpielen(ton.ctx, (t += 2.5));
    // Das Horn zum Angriff hebt den Kampfpegel ueber die Schwelle.
    assert.equal(ton.spielen('angriff'), true);
    assert.ok(ton.kampfpegel() >= 0.5);
    ton.taktSpielen(ton.ctx, (t += 2.5));
    assert.notEqual(ton.satz.name, 'ruhe');
    assert.equal(ton.satz.takt, 1, 'ein neuer Satz hat begonnen');
    // Arbeit ist kein Kampf, ein Schwert schon - auch wenn die Geraeusche aus sind.
    jetzt += 60_000;
    ton.spielen('hacken');
    ton.spielen('hammer');
    assert.equal(ton.kampfpegel(), 0);
    ton.geraeuscheSetzen(false);
    assert.equal(ton.spielen('schwert'), false, 'zu hoeren ist nichts');
    assert.ok(ton.kampfpegel() > 0, 'aber die Musik weiss davon');
    // Und mit der Partie ist der Kampf vorbei.
    ton.partieSetzen(false);
    assert.equal(ton.kampfpegel(), 0);
  } finally {
    clearTimeout(ton.musikUhr);
    delete globalThis.AudioContext;
  }
});

test('bedienung AC-62: Kampf und Arbeit klingen jedes Mal anders, an ihrem Ort im Bild - und vierzig Schwerter sind ein Klirren, kein Rauschen', () => {
  const { Ausgang, schwinger, stoesse, orte } = ausgangAufschreiben();
  globalThis.AudioContext = Ausgang;
  let jetzt = 0;
  const ton = new Ton(speicher(), { uhr: () => jetzt, zufall: zufallMit(2) });
  try {
    ton.entsperren();
    // Jedes Geraeusch hat eine Art, die das Modul spielen kann, und einen
    // kurzen Mindestabstand: es soll oft kommen duerfen, aber nicht zugleich.
    for (const name of GERAEUSCHE) {
      const klang = KLAENGE[name];
      assert.equal(typeof ton[klang.art], 'function', `${name}: ${klang.art}`);
      assert.ok(klang.abstand >= 80 && klang.abstand <= 600, `${name}: ${klang.abstand} ms`);
      assert.ok(klang.laut > 0 && klang.laut <= 0.5, `${name}: ${klang.laut}`);
      const vorher = schwinger.length + stoesse.length;
      jetzt += 1000;
      assert.equal(ton.spielen(name, { laut: 0.5, seite: 0 }), true, name);
      assert.ok(schwinger.length + stoesse.length > vorher, `${name} wird zu Schall`);
    }
    // Was kaempft, hebt die Musik in den Kampf; was arbeitet, nicht.
    for (const name of ['schwert', 'hieb', 'pfeil', 'wurf', 'einschlag', 'treffer', 'einsturz']) assert.ok(KLAENGE[name].kampf > 0, name);
    for (const name of ['hacken', 'pickel', 'hammer']) assert.equal(KLAENGE[name].kampf, undefined, name);
    // Im Protokoll stehen nur die Signale; Kampf und Arbeit werden gezaehlt.
    assert.deepEqual(ton.protokoll, []);
    assert.equal(ton.gezaehlt.get('schwert'), 1);

    // Der Ort: links im Bild klingt links, und am Rand leiser.
    jetzt += 1000;
    orte.length = 0;
    ton.spielen('schwert', { laut: 0.4, seite: -0.8 });
    assert.equal(orte.length, 1);
    assert.equal(orte[0].pan.value, -0.8);
    // Kein Schlag klingt wie der vorige: die Hoehe wird gewuerfelt.
    const hoehen = [];
    for (let i = 0; i < 12; i++) {
      jetzt += 1000;
      schwinger.length = 0;
      ton.spielen('schwert', { laut: 1, seite: 0 });
      hoehen.push(Math.round(schwinger[0].frequency.value));
    }
    assert.ok(new Set(hoehen).size >= 10, hoehen.join(' '));
    assert.ok(hoehen.every((f) => f >= 1400 && f <= 2900), 'hell, aber kein Pfeifen');

    // Vierzig Kaempfer schlagen eine Sekunde lang, alle 25 Millisekunden
    // einer: zu hoeren sind hoechstens acht Schlaege.
    jetzt += 1000;
    const vorher = ton.gezaehlt.get('schwert');
    for (let i = 0; i < 40; i++) {
      ton.spielen('schwert', { laut: 1, seite: 0 });
      jetzt += 25;
    }
    const gehoert = ton.gezaehlt.get('schwert') - vorher;
    assert.ok(gehoert >= 5 && gehoert <= 8, String(gehoert));
  } finally {
    delete globalThis.AudioContext;
  }
});

test('bedienung AC-62: das Spielbild nennt, was zu hoeren ist - Schlaege im Takt der Figur, Pfeil, Wurf, Einschlag, Treffer, Einsturz', () => {
  const ansicht = lesen('public/ansicht.js');
  const genannt = new Set([...ansicht.matchAll(/this\.(?:geraeusch|klangAn)\('([a-z]+)'/g)].map((m) => m[1]));
  assert.deepEqual([...genannt].sort(), [...GERAEUSCHE, ...MOENCH].sort());
  // Zu hoeren ist nur, was im Bild steht: jeder Weg fuehrt durch klangAn.
  assert.match(ansicht, /geraeusch\(name, wx, wy\) \{\s+this\.klangAn\(name, this\.zuBild\(wx, wy\)\);/);
  // Und app.js reicht den Ort weiter.
  assert.match(lesen('public/app.js'), /ansicht\.beiEreignis = \(name, wo\) => ton\.spielen\(name, wo\);/);
});

test('bedienung AC-61: Geraeusche und Musik sind einzeln abschaltbar, und der Browser merkt sich die Wahl', () => {
  const ort = speicher();
  const ton = new Ton(ort);
  assert.equal(ton.geraeusche, true, 'Vorgabe: an');
  assert.equal(ton.musik, true, 'Vorgabe: an');

  ton.geraeuscheSetzen(false);
  assert.equal(ton.spielen('einheit'), false, 'abgeschaltet klingt nichts');
  assert.equal(ton.spielen('schwert', { laut: 1, seite: 0 }), false, 'auch kein Schwert');
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

test('bedienung AC-78: die Lautstaerke von Geraeuschen und Musik laesst sich einzeln stellen - sofort, im Quadrat, und der Browser merkt sie sich', () => {
  const { Ausgang } = ausgangAufschreiben();
  globalThis.AudioContext = Ausgang;
  try {
    const ort = speicher();
    const ton = new Ton(ort);
    assert.equal(ton.geraeuschStaerke, 1, 'Vorgabe: voll - so laut wie bisher');
    assert.equal(ton.musikStaerke, 1);
    ton.partieSetzen(true);
    ton.entsperren();
    clearTimeout(ton.musikUhr);
    const voll = ton.musikRegler.gain.value;
    assert.ok(voll > 0, 'die Musik spielt');
    assert.equal(ton.effekte.gain.value, 1);

    // Halb gestellt ist ein Viertel am Regler: das Ohr hoert Verhaeltnisse.
    assert.equal(reglerwert(0.5), 0.25);
    ton.staerkeSetzen('musik', 0.5);
    assert.ok(Math.abs(ton.musikRegler.gain.value - voll * 0.25) < 1e-9, 'die laufende Musik wird sofort leiser');
    assert.equal(ton.effekte.gain.value, 1, 'die Geraeusche sind davon nicht betroffen');
    ton.staerkeSetzen('geraeusche', 0.2);
    assert.ok(Math.abs(ton.effekte.gain.value - 0.04) < 1e-9);
    assert.ok(Math.abs(ton.musikRegler.gain.value - voll * 0.25) < 1e-9, 'und die Musik nicht von den Geraeuschen');
    // Die Schalter (AC-61) bleiben, was sie sind: leise ist nicht aus.
    assert.equal(ton.geraeusche, true);
    assert.equal(ton.musik, true);
    assert.equal(ton.spielen('einheit'), true, 'leise klingt es weiter');

    // Aus und wieder an: die Musik kommt mit der gestellten Staerke zurueck.
    ton.musikSetzen(false);
    assert.equal(ton.musikRegler.gain.value, 0);
    ton.staerkeSetzen('musik', 0.8);
    assert.equal(ton.musikRegler.gain.value, 0, 'eine abgeschaltete Musik weckt der Schieber nicht');
    ton.musikSetzen(true);
    clearTimeout(ton.musikUhr);
    assert.ok(Math.abs(ton.musikRegler.gain.value - voll * 0.64) < 1e-9);

    // Ganz zu ist still, und was ausserhalb liegt, wird begrenzt.
    ton.staerkeSetzen('geraeusche', 0);
    assert.equal(ton.effekte.gain.value, 0);
    ton.staerkeSetzen('geraeusche', 7);
    assert.equal(ton.geraeuschStaerke, 1);
    ton.staerkeSetzen('geraeusche', -1);
    assert.equal(ton.geraeuschStaerke, 0);
    ton.staerkeSetzen('geraeusche', 0.35);

    // Ein neues Fenster liest die Wahl - und legt seinen Ausgang damit an.
    const zweites = new Ton(ort);
    assert.equal(zweites.geraeuschStaerke, 0.35);
    assert.equal(zweites.musikStaerke, 0.8);
    zweites.partieSetzen(true);
    zweites.entsperren();
    clearTimeout(zweites.musikUhr);
    assert.ok(Math.abs(zweites.effekte.gain.value - 0.35 * 0.35) < 1e-9);
    assert.ok(Math.abs(zweites.musikRegler.gain.value - voll * 0.64) < 1e-9);
  } finally {
    delete globalThis.AudioContext;
  }

  // Unsinn im Speicher oder ein gesperrter Speicher: die Vorgabe, und nichts wirft.
  assert.equal(new Ton(speicher({ tonMusikStaerke: 'laut' })).musikStaerke, 1);
  assert.equal(new Ton(speicher({ tonMusikStaerke: '3' })).musikStaerke, 1);
  const gesperrt = { getItem() { throw new Error('gesperrt'); }, setItem() { throw new Error('gesperrt'); } };
  const ohne = new Ton(gesperrt);
  assert.equal(ohne.musikStaerke, 1);
  ohne.staerkeSetzen('musik', 0.5);
  assert.equal(ohne.musikStaerke, 0.5, 'dann gilt es bis zum Neuladen');
});

test('bedienung AC-74: der Moench hat drei Klaenge - ein Gloeckchen je Sekunde, ein Gesang, der bis in den naechsten Ton haelt, und ein Schlag zum Uebertritt', () => {
  const { Ausgang, schwinger, stoesse } = ausgangAufschreiben();
  globalThis.AudioContext = Ausgang;
  let jetzt = 0;
  const ton = new Ton(speicher(), { uhr: () => jetzt, zufall: zufallMit(4) });
  try {
    ton.entsperren();
    const arten = new Set();
    for (const name of MOENCH) {
      const klang = KLAENGE[name];
      assert.equal(typeof ton[klang.art], 'function', `${name}: ${klang.art}`);
      arten.add(klang.art);
      assert.ok(klang.laut > 0 && klang.laut <= 0.5, `${name}: ${klang.laut}`);
      // Heilen und Bekehren sind kein Gefecht: die Musik bleibt ruhig.
      assert.equal(klang.kampf, undefined, name);
      const vorher = schwinger.length + stoesse.length;
      jetzt += 5000;
      assert.equal(ton.spielen(name, { laut: 0.5, seite: 0 }), true, name);
      assert.ok(schwinger.length + stoesse.length > vorher, `${name} wird zu Schall`);
    }
    assert.equal(arten.size, 3, 'drei verschiedene Klaenge');
    assert.deepEqual(ton.protokoll, [], 'gezaehlt, nicht protokolliert - wie Kampf und Arbeit');

    // Ein Leben je Sekunde: drei Moenche heilen nebeneinander, in jedem Bild
    // meldet sich jeder - zu hoeren ist ein Gloeckchen je Sekunde.
    jetzt += 5000;
    let gloeckchen = 0;
    for (let ms = 0; ms < 5000; ms += 16) {
      for (let m = 0; m < 3; m++) if (ton.spielen('heilen', { laut: 1, seite: 0 })) gloeckchen += 1;
      jetzt += 16;
    }
    assert.ok(gloeckchen >= 5 && gloeckchen <= 6, String(gloeckchen));

    // Der Gesang ist gehalten: ein Ton klingt noch, wenn der naechste beginnt.
    assert.ok(GESANG_DAUER * 1000 >= KLAENGE.bekehren.abstand + 250, `${GESANG_DAUER} s bei ${KLAENGE.bekehren.abstand} ms Abstand`);
    // Tief gesungen, und nicht immer derselbe Ton.
    const toene = [];
    for (let i = 0; i < 12; i++) {
      jetzt += 2000;
      schwinger.length = 0;
      ton.spielen('bekehren', { laut: 1, seite: 0 });
      toene.push(Math.round(schwinger[0].frequency.value));
    }
    assert.ok(new Set(toene).size >= 3, toene.join(' '));
    assert.ok(toene.every((f) => f >= 140 && f <= 230), toene.join(' '));
    // Das Gloeckchen ist hoch.
    jetzt += 2000;
    schwinger.length = 0;
    ton.spielen('heilen', { laut: 1, seite: 0 });
    assert.ok(schwinger[0].frequency.value >= 1100 && schwinger[0].frequency.value <= 2200);
  } finally {
    delete globalThis.AudioContext;
  }
});

test('bedienung AC-74: das Spielbild nennt die Klaenge des Moenchs - Heilen und Bekehren am Moench, der Uebertritt an der Einheit', () => {
  const ansicht = lesen('public/ansicht.js');
  assert.match(ansicht, /einheit\.bk\) this\.klangAn\('bekehren', punkt\)/);
  assert.match(ansicht, /else this\.klangAn\('heilen', punkt\)/);
  assert.match(ansicht, /frueher\.b !== einheit\.b && !einheit\.s\) this\.geraeusch\('bekehrt', einheit\.x, einheit\.y\)/);
});
