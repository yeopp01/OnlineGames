// Ton (bedienung AC-59 bis AC-62): Geraeusche zu dem, was im Spiel geschieht,
// Kampf und Arbeit dort, wo sie im Bild stehen, und Musik darunter.
//
// Alles wird hier im Browser erzeugt (WebAudio): Schwingungen, Rauschen,
// Huellkurven, ein gewuerfelter Hall. Es gibt keine Klangdatei - und damit
// kein Material aus dem Original und keins von sonstwo (darstellung AC-11,
// ADR-0012). Auch die Musik ist kein fremdes Stueck: Thema und Saetze stehen
// unten als Noten.
//
// Die Ansicht weiss nichts vom Ton: sie nennt Ereignisse beim Namen
// (`ansicht.beiEreignis`), app.js reicht sie hierher. Was ein Name klingt,
// steht als Daten in KLAENGE.

const GEMERKT = { geraeusche: 'tonGeraeusche', musik: 'tonMusik' };

// Halbtoene ueber dem Kammerton a' (440 Hz).
const frequenz = (halbton) => 440 * 2 ** (halbton / 12);

const STUFEN = { c: -9, d: -7, e: -5, f: -4, g: -2, a: 0, b: 2 };

/** Ein Notenname wird zum Halbton ueber a': `d4`, `bb3`, `c#5`. */
export function halbton(name) {
  const m = /^([a-g])([b#]?)(\d)$/.exec(name);
  if (!m) throw new Error(`Keine Note: ${name}`);
  return STUFEN[m[1]] + (m[2] === 'b' ? -1 : m[2] === '#' ? 1 : 0) + (Number(m[3]) - 4) * 12;
}

/**
 * Je Ereignis ein Klang. Zwei Sorten:
 *
 * - **Signale** haben `noten` mit Halbton `h`, Beginn `t` und Dauer `d` in
 *   Sekunden (`nach` fuer ein Gleiten), dazu `klopfen` fuer Hammerschlaege.
 *   `stimme: 'horn'` spielt sie mit dem Horn der Musik.
 * - **Geraeusche** haben eine `art`: sie werden jedes Mal neu gewuerfelt -
 *   kein Schwertschlag klingt wie der vorige. Sie kommen mit einem Ort im
 *   Bild (`spielen(name, { laut, seite })`).
 *
 * `abstand` ist die Zeit in Millisekunden, in der derselbe Klang nicht noch
 * einmal beginnt - zehn Dorfbewohner, die im selben Takt fertig werden, sind
 * ein Klang, ein Gefecht ist kein Dauerhorn, und vierzig Schwerter sind ein
 * Klirren, kein Rauschen. `kampf` hebt die Musik in den Kampf (AC-60).
 */
export const KLAENGE = {
  // Zwei helle Toene aufwaerts: da ist jemand.
  einheit: { abstand: 350, laut: 0.2, form: 'triangle', noten: [{ h: -2, t: 0, d: 0.18 }, { h: 5, t: 0.11, d: 0.32 }] },
  // Zwei Hammerschlaege, dann ein ruhiger Zweiklang: es steht.
  gebaeude: { abstand: 500, laut: 0.15, form: 'triangle', klopfen: [0, 0.16], noten: [{ h: -7, t: 0.3, d: 0.55 }, { h: 0, t: 0.3, d: 0.55 }] },
  // Drei Glockentoene aufwaerts.
  forschung: { abstand: 500, laut: 0.17, form: 'sine', noten: [{ h: 5, t: 0, d: 0.5 }, { h: 9, t: 0.12, d: 0.5 }, { h: 12, t: 0.24, d: 0.9 }] },
  // Eine Fanfare, die in einem Akkord stehen bleibt.
  zeitalter: {
    abstand: 3000, laut: 0.11, stimme: 'horn',
    noten: [
      { h: -7, t: 0, d: 0.3 }, { h: -7, t: 0.3, d: 0.15 }, { h: 0, t: 0.45, d: 0.4 },
      { h: -7, t: 0.9, d: 1.6 }, { h: 0, t: 0.9, d: 1.6 }, { h: 5, t: 0.9, d: 1.6 }, { h: 9, t: 0.9, d: 1.6 },
    ],
  },
  // Das Kriegshorn, zweimal - das eine Geraeusch, das stoeren soll.
  angriff: {
    abstand: 8000, laut: 0.15, stimme: 'horn', kampf: 0.6,
    noten: [{ h: -19, t: 0, d: 0.42 }, { h: -12, t: 0, d: 0.42 }, { h: -19, t: 0.52, d: 0.8 }, { h: -12, t: 0.52, d: 0.8 }],
  },
  // Ein Ton, der absinkt.
  gefallen: { abstand: 1500, laut: 0.18, form: 'sine', kampf: 0.15, noten: [{ h: -14, nach: -19, t: 0, d: 0.45 }] },
  // Kurz und dumpf: das ging nicht.
  absage: { abstand: 300, laut: 0.05, form: 'square', noten: [{ h: -19, t: 0, d: 0.14 }] },
  sieg: {
    abstand: 5000, laut: 0.13, stimme: 'horn',
    noten: [
      { h: -7, t: 0, d: 0.28 }, { h: -3, t: 0.2, d: 0.28 }, { h: 0, t: 0.4, d: 0.28 },
      { h: 5, t: 0.6, d: 2 }, { h: -3, t: 0.6, d: 2 }, { h: -7, t: 0.6, d: 2 },
    ],
  },
  niederlage: {
    abstand: 5000, laut: 0.16, form: 'sine',
    noten: [{ h: -7, t: 0, d: 0.6 }, { h: -9, t: 0.5, d: 0.6 }, { h: -11, t: 1.0, d: 0.6 }, { h: -12, t: 1.5, d: 1.8 }],
  },

  // ---- Kampf und Arbeit, dort wo sie im Bild stehen (AC-62) ----------------
  // Klinge auf Klinge: ein heller, unreiner Klang, der kurz nachsingt.
  schwert: { art: 'klirren', abstand: 140, laut: 0.16, kampf: 0.08 },
  // Ein Hieb, der kein Eisen trifft: die Klinge pfeift, dann ein dumpfer Schlag.
  hieb: { art: 'hieb', abstand: 140, laut: 0.14, kampf: 0.06 },
  // Die Sehne schnellt, der Pfeil zischt.
  pfeil: { art: 'pfeil', abstand: 90, laut: 0.3, kampf: 0.06 },
  // Der Wurfarm des Mangonels schlaegt an.
  wurf: { art: 'wurf', abstand: 300, laut: 0.45, kampf: 0.15 },
  // Der Stein kommt herunter.
  einschlag: { art: 'einschlag', abstand: 200, laut: 0.36, kampf: 0.2 },
  // Ein Schlag gegen Holz und Stein: die Ramme, oder ein Gebaeude wird getroffen.
  treffer: { art: 'dumpf', abstand: 160, laut: 0.3, kampf: 0.08 },
  // Ein Gebaeude bricht zusammen.
  einsturz: { art: 'einsturz', abstand: 600, laut: 0.28, kampf: 0.25 },
  // Die Axt im Stamm, die Hacke im Fels, der Hammer am Bau - leise. (Die
  // Zahl ist die Staerke vor dem Filter: ein schmaler Rauschstoss kommt mit
  // einem Zehntel davon an. Gemessen wird am Ausgang, im Browsertest.)
  hacken: { art: 'hacken', abstand: 110, laut: 0.16 },
  pickel: { art: 'pickel', abstand: 110, laut: 0.08 },
  hammer: { art: 'hammer', abstand: 110, laut: 0.22 },

  // ---- Der Moench (AC-74) ---------------------------------------------------
  // Heilen: ein Gloeckchen je geheiltem Leben - eines je Sekunde, auch wenn
  // drei Moenche nebeneinander heilen.
  heilen: { art: 'gloeckchen', abstand: 950, laut: 0.07 },
  // Bekehren: ein gehaltener Gesangston. Der naechste beginnt, bevor dieser
  // verklungen ist (`GESANG_DAUER`) - so singt er, solange er bekehrt.
  bekehren: { art: 'gesang', abstand: 1250, laut: 0.18 },
  // Der Uebertritt: ein heller Schlag, der nachklingt.
  bekehrt: { art: 'uebertritt', abstand: 400, laut: 0.14 },
};

/** Wie lange ein Ton des Gesangs klingt, in Sekunden - laenger als sein Abstand. */
export const GESANG_DAUER = 1.6;

// ---- Die Musik als Noten (bedienung AC-60) ---------------------------------
// d-Moll, vier Viertel, 96 Schlaege in der Minute. Ein Takt je Eintrag; die
// Stimme als `note:schlaege`, ein Strich ist eine Pause.

const TEMPO = 96;
const SCHLAG = 60 / TEMPO;
const TAKT = 4 * SCHLAG;

export const AKKORDE = {
  Dm: { bass: 'd2', toene: ['d3', 'a3', 'd4', 'f4'] },
  C: { bass: 'c2', toene: ['c3', 'g3', 'c4', 'e4'] },
  Bb: { bass: 'bb2', toene: ['bb2', 'f3', 'bb3', 'd4'] },
  F: { bass: 'f2', toene: ['f3', 'a3', 'c4', 'f4'] },
  Gm: { bass: 'g2', toene: ['g2', 'd3', 'g3', 'bb3'] },
  Am: { bass: 'a2', toene: ['a2', 'e3', 'a3', 'c4'] },
  A: { bass: 'a2', toene: ['a2', 'e3', 'a3', 'c#4'] },
};

export const SAETZE = {
  // Das Thema: dreimal derselbe Anlauf, jedes Mal eine Stufe hoeher.
  thema: {
    akkorde: ['Dm', 'Dm', 'C', 'C', 'Bb', 'C', 'Dm', 'Dm'],
    stimme: [
      'd4:1.5 f4:.5 a4:2', 'a4:1 g4:1 f4:1 e4:1',
      'e4:1.5 g4:.5 c5:2', 'c5:1 bb4:1 a4:1 g4:1',
      'f4:1.5 bb4:.5 d5:2', 'c5:1 bb4:1 a4:1 g4:1',
      'a4:1.5 f4:.5 e4:1 f4:1', 'd4:3 -:1',
    ],
  },
  // Dasselbe, aber es schliesst oben und ueber der Dominante.
  aufbruch: {
    akkorde: ['Dm', 'Dm', 'C', 'C', 'Bb', 'Gm', 'A', 'Dm'],
    stimme: [
      'd4:1.5 f4:.5 a4:2', 'a4:1 g4:1 f4:1 e4:1',
      'e4:1.5 g4:.5 c5:2', 'c5:1 bb4:1 a4:1 g4:1',
      'f4:1.5 bb4:.5 d5:2', 'd5:1 c5:1 bb4:1 a4:1',
      'a4:1.5 c#5:.5 e5:2', 'd5:3 -:1',
    ],
  },
  // Der helle Mittelteil in F-Dur, der zurueck nach d-Moll fuehrt.
  hoehe: {
    akkorde: ['F', 'C', 'Dm', 'Am', 'Bb', 'F', 'Gm', 'A'],
    stimme: [
      'a4:2 c5:1 f5:1', 'e5:1.5 d5:.5 c5:2',
      'a4:1 d5:1 f5:1 e5:1', 'e5:2 c5:1 a4:1',
      'bb4:2 d5:1 f5:1', 'f5:1.5 e5:.5 c5:2',
      'bb4:1 c5:1 d5:1 bb4:1', 'a4:1.5 c#5:.5 e5:2',
    ],
  },
  // Ruhe: Laute und Floete, jedes Mal neu gewuerfelt aus den Toenen des Akkords.
  ruhe: { akkorde: ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'C', 'Dm'], gewuerfelt: true },
};

/**
 * Trommeln je Takt in sechzehn Schritten: `p` die Pauke, `t` die Trommel,
 * je Schritt und Lautstaerke.
 */
const TROMMELN = {
  sacht: { p: [[0, 0.5], [8, 0.3]], t: [] },
  marsch: { p: [[0, 0.6], [8, 0.45], [10, 0.3]], t: [[4, 0.5], [12, 0.5], [14, 0.3], [15, 0.3]] },
  kampf: { p: [[0, 0.7], [3, 0.45], [6, 0.5], [8, 0.65], [11, 0.45], [14, 0.5]], t: [[2, 0.25], [4, 0.6], [10, 0.25], [12, 0.6]] },
  wirbel: { p: [[0, 0.7], [3, 0.45], [6, 0.5], [8, 0.65]], t: [[4, 0.6], [10, 0.3], [11, 0.35], [12, 0.45], [13, 0.5], [14, 0.6], [15, 0.7]] },
};

// So laut steht die Musik unter den Geraeuschen; ab diesem Kampfpegel wird
// sie zum Kampf, und so lange braucht ein voller Pegel, um zu verklingen.
const MUSIK_LAUT = 0.42;
const KAMPF_AB = 0.2;
const KAMPF_VERKLINGT = 25000;

function stimmeLesen(text) {
  let schlag = 0;
  const noten = [];
  for (const teil of text.split(' ')) {
    const [name, dauer] = teil.split(':');
    const d = Number(dauer);
    if (name !== '-') noten.push({ h: halbton(name), schlag, d });
    schlag += d;
  }
  return noten;
}

export class Ton {
  /**
   * @param {Storage} [speicher] wo die Wahl gemerkt wird; fehlt er, gilt sie bis zum Neuladen
   * @param {{ uhr?: () => number, zufall?: () => number }} [mit] fuer Tests
   */
  constructor(speicher, { uhr = () => Date.now(), zufall = Math.random } = {}) {
    this.speicher = speicher;
    this.uhr = uhr;
    this.zufall = zufall;
    this.geraeusche = this.gemerkt('geraeusche');
    this.musik = this.gemerkt('musik');
    this.zuletzt = new Map(); // Klang -> wann er zuletzt begann
    // Was geklungen hat, der Reihe nach - damit ein Test es lesen kann, auch
    // wo niemand zuhoert. Signale stehen im Protokoll; Kampf und Arbeit sind
    // zu viele dafuer und werden nur gezaehlt.
    this.protokoll = [];
    this.gezaehlt = new Map();
    this.ctx = null;
    this.partie = false; // laeuft eine Partie? Nur dann spielt die Musik.
    this.musikLaeuft = false;
    this.musikUhr = null;
    this.kampf = 0; // Kampfpegel, 0 bis 1, zum Zeitpunkt `kampfSeit`
    this.kampfSeit = 0;
    this.gespielt = []; // die Saetze der Musik, der Reihe nach - fuer Tests
  }

  gemerkt(was) {
    try {
      return this.speicher?.getItem(GEMERKT[was]) !== 'aus';
    } catch {
      return true;
    }
  }

  merken(was, an) {
    try {
      this.speicher?.setItem(GEMERKT[was], an ? 'an' : 'aus');
    } catch { /* dann gilt es bis zum Neuladen */ }
  }

  geraeuscheSetzen(an) {
    this.geraeusche = Boolean(an);
    this.merken('geraeusche', this.geraeusche);
  }

  musikSetzen(an) {
    this.musik = Boolean(an);
    this.merken('musik', this.musik);
    this.musikPruefen();
  }

  /**
   * Der Klangausgang - erst nach einer Handlung des Spielers, vorher laesst
   * der Browser keinen Ton zu. Ohne WebAudio (und im Test ohne Browser) null.
   *
   * Der Aufbau: Geraeusche und Musik haben je einen Regler; beide gehen
   * trocken zum Ausgang und zu einem Teil durch den Hall. Vor dem
   * Lautsprecher steht ein Begrenzer - ein Gefecht mit vierzig Schwertern
   * darf laut werden, aber nicht kratzen.
   */
  kontext() {
    if (this.ctx) return this.ctx;
    const Art = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Art) return null;
    try {
      const ctx = new Art();
      this.ausgang = ctx.createGain();
      this.ausgang.gain.value = 0.9;
      const begrenzer = ctx.createDynamicsCompressor();
      begrenzer.threshold.value = -16;
      begrenzer.knee.value = 10;
      begrenzer.ratio.value = 6;
      begrenzer.attack.value = 0.004;
      begrenzer.release.value = 0.25;
      this.messer = ctx.createAnalyser();
      this.messer.fftSize = 1024;
      this.ausgang.connect(begrenzer);
      begrenzer.connect(this.messer);
      this.messer.connect(ctx.destination);

      // Der Hall: zwei Sekunden Rauschen, das ausklingt - ein Raum aus Wuerfeln.
      const hall = ctx.createConvolver();
      const laenge = Math.floor(ctx.sampleRate * 2);
      const raum = ctx.createBuffer(2, laenge, ctx.sampleRate);
      for (let kanal = 0; kanal < 2; kanal++) {
        const daten = raum.getChannelData(kanal);
        for (let i = 0; i < laenge; i++) daten[i] = (this.zufall() * 2 - 1) * (1 - i / laenge) ** 3;
      }
      hall.buffer = raum;
      const hallZurueck = ctx.createGain();
      hallZurueck.gain.value = 0.5;
      hall.connect(hallZurueck);
      hallZurueck.connect(this.ausgang);

      // Geraeusche: trocken, mit wenig Raum.
      this.effekte = ctx.createGain();
      this.effekte.gain.value = 1;
      this.effekte.connect(this.ausgang);
      const effektHall = ctx.createGain();
      effektHall.gain.value = 0.18;
      this.effekte.connect(effektHall);
      effektHall.connect(hall);

      // Musik: ein eigener Regler, die Spitze abgenommen, mit mehr Raum.
      this.musikRegler = ctx.createGain();
      this.musikRegler.gain.value = 0;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 4200;
      this.musikRegler.connect(filter);
      filter.connect(this.ausgang);
      const musikHall = ctx.createGain();
      musikHall.gain.value = 0.45;
      filter.connect(musikHall);
      musikHall.connect(hall);
      this.ctx = ctx;
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  /** Nach dem ersten Klick oder Tastendruck: der Browser laesst jetzt Ton zu. */
  entsperren() {
    const ctx = this.kontext();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    this.entsperrt = true;
    this.musikPruefen();
  }

  /**
   * Ein Ereignis klingt. `false`, wenn es nichts zu hoeren gibt: Geraeusche
   * aus, der Name unbekannt, oder derselbe Klang lief eben erst an.
   *
   * @param {string} name
   * @param {{ laut?: number, seite?: number }} [wo] fuer Geraeusche mit einem
   *   Ort im Bild: `laut` von 0 bis 1 (am Bildrand und weit herausgezoomt
   *   leiser), `seite` von -1 (links) bis 1 (rechts)
   */
  spielen(name, wo = null) {
    const klang = KLAENGE[name];
    if (!klang) return false;
    // Die Musik hoert auch dann vom Kampf, wenn die Geraeusche aus sind.
    if (klang.kampf) this.kampfMelden(klang.kampf);
    if (!this.geraeusche) return false;
    const jetzt = this.uhr();
    const zuletzt = this.zuletzt.get(name);
    if (zuletzt !== undefined && jetzt - zuletzt < klang.abstand) return false;
    this.zuletzt.set(name, jetzt);
    this.gezaehlt.set(name, (this.gezaehlt.get(name) || 0) + 1);
    if (!klang.art) {
      this.protokoll.push({ name, zeit: jetzt });
      if (this.protokoll.length > 100) this.protokoll.shift();
    }
    const ctx = this.entsperrt ? this.kontext() : null;
    if (ctx) this.klingen(ctx, klang, wo);
    return true;
  }

  klingen(ctx, klang, wo = null) {
    const t0 = ctx.currentTime + 0.02;
    let ziel = this.effekte;
    // Ein Ort im Bild: leiser am Rand, und auf der Seite, auf der es geschieht.
    if (wo) {
      const regler = ctx.createGain();
      regler.gain.value = Math.max(0, Math.min(1, wo.laut ?? 1));
      if (ctx.createStereoPanner) {
        const seite = ctx.createStereoPanner();
        seite.pan.value = Math.max(-1, Math.min(1, wo.seite ?? 0));
        regler.connect(seite);
        seite.connect(this.effekte);
      } else {
        regler.connect(this.effekte);
      }
      ziel = regler;
    }
    if (klang.art) {
      this[klang.art](ctx, ziel, t0, klang.laut);
      return;
    }
    if (klang.stimme === 'horn') {
      for (const note of klang.noten) this.horn(ctx, ziel, t0 + note.t, note.h, note.d, klang.laut);
      return;
    }
    // Saegezahn und Rechteck sind roh zu scharf: ein Filter nimmt die Spitze.
    if (klang.form === 'sawtooth' || klang.form === 'square') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1700;
      filter.connect(ziel);
      ziel = filter;
    }
    for (const note of klang.noten || []) {
      this.stimme(ctx, ziel, { form: klang.form, f: frequenz(note.h), nach: note.nach === undefined ? null : frequenz(note.nach), t: t0 + note.t, d: note.d, laut: klang.laut });
    }
    for (const t of klang.klopfen || []) this.hammer(ctx, ziel, t0 + t, 0.3);
  }

  // ---- Bausteine -------------------------------------------------------------

  // Eine Stimme: schnell da, dann ausklingend.
  stimme(ctx, ziel, { form = 'sine', f, nach = null, t, d, laut, an = 0.015 }) {
    const schwinger = ctx.createOscillator();
    schwinger.type = form;
    schwinger.frequency.setValueAtTime(f, t);
    if (nach) schwinger.frequency.exponentialRampToValueAtTime(nach, t + d);
    const huelle = ctx.createGain();
    huelle.gain.setValueAtTime(0.0001, t);
    huelle.gain.linearRampToValueAtTime(laut, t + an);
    huelle.gain.exponentialRampToValueAtTime(0.0008, t + d);
    schwinger.connect(huelle);
    huelle.connect(ziel);
    schwinger.start(t);
    schwinger.stop(t + d + 0.05);
  }

  /** Rauschen fuer alle Stoesse: einmal gewuerfelt, eine Sekunde lang. */
  rauschen(ctx) {
    if (!this.rauschPuffer) {
      const laenge = ctx.sampleRate;
      const puffer = ctx.createBuffer(1, laenge, ctx.sampleRate);
      const daten = puffer.getChannelData(0);
      for (let i = 0; i < laenge; i++) daten[i] = this.zufall() * 2 - 1;
      this.rauschPuffer = puffer;
    }
    return this.rauschPuffer;
  }

  // Ein Stoss Rauschen durch einen Filter, der wandern kann.
  stoss(ctx, ziel, t, { art = 'bandpass', f, nach = null, q = 1, d, laut, an = 0.003 }) {
    const quelle = ctx.createBufferSource();
    quelle.buffer = this.rauschen(ctx);
    quelle.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = art;
    filter.frequency.setValueAtTime(f, t);
    if (nach) filter.frequency.exponentialRampToValueAtTime(nach, t + d);
    filter.Q.value = q;
    const huelle = ctx.createGain();
    huelle.gain.setValueAtTime(0.0001, t);
    huelle.gain.linearRampToValueAtTime(laut, t + an);
    huelle.gain.exponentialRampToValueAtTime(0.0005, t + d);
    quelle.connect(filter);
    filter.connect(huelle);
    huelle.connect(ziel);
    quelle.start(t, this.zufall() * 0.5);
    quelle.stop(t + d + 0.05);
  }

  // ---- Kampf und Arbeit (bedienung AC-62) -----------------------------------

  /**
   * Klinge auf Klinge. Metall klingt unrein: die Teiltoene stehen in keinem
   * ganzen Verhaeltnis, die hohen verklingen zuerst. Davor der Aufprall als
   * kurzer heller Stoss; und oft gleitet die Klinge ab - ein zweiter,
   * hoeherer Schlag gleich danach. Die Hoehe wird jedes Mal gewuerfelt.
   */
  klirren(ctx, ziel, t, laut) {
    const schlag = (wann, grund, staerke, dauer) => {
      [1, 1.51, 2.27, 2.94, 3.71].forEach((faktor, i) => {
        this.stimme(ctx, ziel, {
          form: i === 0 ? 'triangle' : 'sine',
          f: grund * faktor * (1 + (this.zufall() - 0.5) * 0.02),
          t: wann, d: dauer / (1 + i * 0.55), laut: staerke / (1 + i * 0.7), an: 0.002,
        });
      });
      this.stoss(ctx, ziel, wann, { art: 'highpass', f: 3500, q: 0.7, d: 0.045, laut: staerke * 1.5, an: 0.001 });
    };
    const grund = 1500 + this.zufall() * 1300;
    schlag(t, grund, laut, 0.42 + this.zufall() * 0.2);
    if (this.zufall() < 0.45) schlag(t + 0.06 + this.zufall() * 0.07, grund * (1.12 + this.zufall() * 0.2), laut * 0.6, 0.28);
  }

  // Die Klinge pfeift durch die Luft und trifft Schild, Leder oder Holz.
  hieb(ctx, ziel, t, laut) {
    this.stoss(ctx, ziel, t, { f: 700, nach: 2200, q: 1.6, d: 0.12, laut: laut * 0.5, an: 0.05 });
    const hoehe = 150 + this.zufall() * 60;
    this.stimme(ctx, ziel, { f: hoehe, nach: hoehe * 0.6, t: t + 0.09, d: 0.11, laut, an: 0.003 });
    this.stoss(ctx, ziel, t + 0.09, { f: 850 + this.zufall() * 300, q: 1, d: 0.06, laut: laut * 0.8 });
  }

  // Die Sehne schnellt, dann zischt der Pfeil davon.
  pfeil(ctx, ziel, t, laut) {
    const hoehe = 210 + this.zufall() * 70;
    this.stimme(ctx, ziel, { form: 'triangle', f: hoehe, nach: hoehe * 0.6, t, d: 0.08, laut: laut * 0.9, an: 0.002 });
    this.stoss(ctx, ziel, t + 0.01, { f: 900, nach: 3400, q: 1.4, d: 0.22, laut: laut * 0.7, an: 0.05 });
  }

  // Der Wurfarm schlaegt an den Balken, der Stein rauscht los.
  wurf(ctx, ziel, t, laut) {
    this.stoss(ctx, ziel, t, { art: 'lowpass', f: 520, d: 0.13, laut });
    this.stimme(ctx, ziel, { f: 120, nach: 60, t, d: 0.16, laut: laut * 0.8, an: 0.003 });
    this.stoss(ctx, ziel, t + 0.05, { f: 380, nach: 950, q: 1.2, d: 0.55, laut: laut * 0.35, an: 0.16 });
  }

  // Der Stein kommt herunter: tief, mit Erde und einem Krachen.
  einschlag(ctx, ziel, t, laut) {
    this.stimme(ctx, ziel, { f: 92, nach: 32, t, d: 0.6, laut, an: 0.004 });
    this.stoss(ctx, ziel, t, { art: 'lowpass', f: 900, nach: 150, d: 0.5, laut: laut * 0.9 });
    this.stoss(ctx, ziel, t, { f: 2400, q: 0.8, d: 0.08, laut: laut * 0.3, an: 0.001 });
  }

  // Ein Schlag gegen Holz und Stein.
  dumpf(ctx, ziel, t, laut) {
    const hoehe = 115 + this.zufall() * 40;
    this.stimme(ctx, ziel, { f: hoehe, nach: hoehe * 0.55, t, d: 0.16, laut, an: 0.003 });
    this.stoss(ctx, ziel, t, { f: 600 + this.zufall() * 250, q: 1, d: 0.09, laut: laut * 0.8 });
    this.stoss(ctx, ziel, t, { art: 'highpass', f: 2500, q: 0.7, d: 0.03, laut: laut * 0.35, an: 0.001 });
  }

  // Ein Gebaeude bricht zusammen: ein Grollen, in dem Balken und Steine fallen.
  einsturz(ctx, ziel, t, laut) {
    this.stoss(ctx, ziel, t, { art: 'lowpass', f: 750, nach: 110, d: 1.3, laut, an: 0.05 });
    for (let i = 0; i < 6; i++) this.dumpf(ctx, ziel, t + i * 0.13 + this.zufall() * 0.09, laut * (0.75 - i * 0.09));
  }

  // Die Axt im Stamm.
  hacken(ctx, ziel, t, laut) {
    const hoehe = 270 + this.zufall() * 70;
    this.stoss(ctx, ziel, t, { f: 1000 + this.zufall() * 300, q: 3, d: 0.055, laut: laut * 1.4, an: 0.001 });
    this.stimme(ctx, ziel, { form: 'triangle', f: hoehe, nach: hoehe * 0.65, t, d: 0.07, laut, an: 0.002 });
  }

  // Die Hacke im Fels: ein kurzes helles Ticken.
  pickel(ctx, ziel, t, laut) {
    const hoehe = 2100 + this.zufall() * 600;
    this.stimme(ctx, ziel, { f: hoehe, t, d: 0.09, laut, an: 0.001 });
    this.stimme(ctx, ziel, { f: hoehe * 1.52, t, d: 0.06, laut: laut * 0.5, an: 0.001 });
    this.stoss(ctx, ziel, t, { art: 'highpass', f: 4000, q: 0.7, d: 0.02, laut: laut * 0.8, an: 0.001 });
  }

  // Der Hammer am Bau.
  hammer(ctx, ziel, t, laut) {
    this.stoss(ctx, ziel, t, { f: 520, q: 1.2, d: 0.09, laut: laut * 1.3, an: 0.001 });
    this.stimme(ctx, ziel, { f: 210, nach: 160, t, d: 0.05, laut: laut * 0.6, an: 0.002 });
  }

  // ---- Der Moench (bedienung AC-74) ------------------------------------------

  /**
   * Heilen: ein kleines Gloeckchen, weich angeschlagen. Die Hoehe wandert
   * ueber fuenf Toene, die sich mit der Musik in d-Moll vertragen.
   */
  gloeckchen(ctx, ziel, t, laut) {
    const hoehen = ['d6', 'f6', 'g6', 'a6', 'c7'];
    const f = frequenz(halbton(hoehen[Math.floor(this.zufall() * hoehen.length)]));
    for (const [faktor, anteil, dauer] of [[1, 1, 0.55], [2.76, 0.35, 0.3], [5.4, 0.12, 0.16]]) {
      this.stimme(ctx, ziel, { f: f * faktor, t, d: dauer, laut: laut * anteil, an: 0.006 });
    }
  }

  /**
   * Bekehren: ein gesungener, gehaltener Ton - eine tiefe Stimme auf "o".
   * Zwei leicht verstimmte Saegezaehne durch zwei Formanten, langsam da und
   * langsam weg. Die Hoehe wandert ueber vier Toene aus d-Moll.
   */
  gesang(ctx, ziel, t, laut) {
    const hoehen = ['d3', 'f3', 'g3', 'a3'];
    const f = frequenz(halbton(hoehen[Math.floor(this.zufall() * hoehen.length)]));
    const d = GESANG_DAUER;
    const huelle = ctx.createGain();
    huelle.gain.setValueAtTime(0.0001, t);
    huelle.gain.linearRampToValueAtTime(laut, t + 0.3);
    huelle.gain.linearRampToValueAtTime(laut * 0.8, t + d * 0.7);
    huelle.gain.linearRampToValueAtTime(0.0001, t + d);
    huelle.connect(ziel);
    for (const [mitte, guete, anteil] of [[430, 4, 1], [820, 5, 0.5]]) {
      const formant = ctx.createBiquadFilter();
      formant.type = 'bandpass';
      formant.frequency.value = mitte;
      formant.Q.value = guete;
      const teil = ctx.createGain();
      teil.gain.value = anteil;
      formant.connect(teil);
      teil.connect(huelle);
      for (const verstimmt of [-6, 7]) {
        const schwinger = ctx.createOscillator();
        schwinger.type = 'sawtooth';
        schwinger.frequency.setValueAtTime(f, t);
        schwinger.detune.setValueAtTime(verstimmt, t);
        schwinger.connect(formant);
        schwinger.start(t);
        schwinger.stop(t + d + 0.05);
      }
    }
  }

  /**
   * Der Uebertritt: ein heller Schlag wie eine kleine Glocke - Grundton,
   * Quinte und Oktave, darueber die unreinen Teiltoene des Metalls.
   */
  uebertritt(ctx, ziel, t, laut) {
    const grund = frequenz(halbton('d5'));
    for (const [faktor, anteil, dauer] of [[1, 1, 1.3], [1.5, 0.6, 1.1], [2, 0.5, 0.9], [2.76, 0.22, 0.5], [5.4, 0.08, 0.25]]) {
      this.stimme(ctx, ziel, { f: grund * faktor * (1 + (this.zufall() - 0.5) * 0.004), t, d: dauer, laut: laut * anteil, an: 0.004 });
    }
    this.stoss(ctx, ziel, t, { art: 'highpass', f: 5000, q: 0.7, d: 0.03, laut: laut * 0.4, an: 0.001 });
  }

  // ---- Musik (bedienung AC-60) ----------------------------------------------
  // Ein Thema in d-Moll fuer Horn ueber Streichern, Bass und Trommeln, ein
  // heller Mittelteil, und dazwischen Ruhe: Laute und Floete, jedes Mal neu
  // gewuerfelt. Wird gekaempft, bleiben die Trommeln und werden dichter, der
  // Bass treibt, und die Ruhe faellt aus.

  /** Eine Partie beginnt oder ist verlassen. */
  partieSetzen(laeuft) {
    this.partie = Boolean(laeuft);
    if (!this.partie) this.kampf = 0;
    this.musikPruefen();
  }

  /** Im Hintergrund schweigt die Musik - die Geraeusche nicht, ein Angriff soll auch dort zu hoeren sein. */
  sichtbarSetzen(sichtbar) {
    this.verdeckt = !sichtbar;
    this.musikPruefen();
  }

  /** Es wird gekaempft: der Pegel steigt, und verklingt von selbst wieder. */
  kampfMelden(staerke = 0.1) {
    this.kampf = Math.min(1, this.kampfpegel() + staerke);
    this.kampfSeit = this.uhr();
  }

  kampfpegel() {
    return Math.max(0, this.kampf - (this.uhr() - this.kampfSeit) / KAMPF_VERKLINGT);
  }

  musikPruefen() {
    const soll = Boolean(this.musik && this.partie && this.entsperrt && !this.verdeckt);
    if (soll === this.musikLaeuft) return;
    const ctx = soll ? this.kontext() : this.ctx;
    if (!ctx) return;
    this.musikLaeuft = soll;
    const jetzt = ctx.currentTime;
    this.musikRegler.gain.cancelScheduledValues(jetzt);
    this.musikRegler.gain.setValueAtTime(this.musikRegler.gain.value, jetzt);
    clearTimeout(this.musikUhr);
    this.musikUhr = null;
    if (soll) {
      this.musikRegler.gain.linearRampToValueAtTime(MUSIK_LAUT, jetzt + 2);
      // Von vorn: ein neuer Satz, ab dem naechsten Augenblick.
      this.satz = null;
      this.naechsterTakt = jetzt + 0.3;
      this.planen();
    } else {
      // Was schon bestellt ist, klingt in den zugedrehten Regler.
      this.musikRegler.gain.linearRampToValueAtTime(0, jetzt + 0.8);
    }
  }

  /**
   * Die naechsten Takte bestellen - so weit voraus, dass ein stockender
   * Zeitgeber die Musik nicht stolpern laesst.
   */
  planen(voraus = 1.5) {
    if (!this.musikLaeuft || !this.ctx) return;
    const ctx = this.ctx;
    // Nach einem Stocken (Rechner im Schlaf) nicht nachholen.
    if (this.naechsterTakt < ctx.currentTime) this.naechsterTakt = ctx.currentTime + 0.1;
    while (this.naechsterTakt < ctx.currentTime + voraus) {
      this.taktSpielen(ctx, this.naechsterTakt);
      this.naechsterTakt += TAKT;
    }
    clearTimeout(this.musikUhr);
    this.musikUhr = setTimeout(() => this.planen(), 500);
  }

  /** Welcher Satz als naechster? Ruhe und Thema wechseln sich ab; im Kampf gibt es keine Ruhe. */
  naechsterSatz(kampf) {
    const zuletzt = this.gespielt.at(-1);
    let name;
    if (!zuletzt) name = 'thema';
    else if (kampf) name = zuletzt === 'thema' ? 'hoehe' : zuletzt === 'hoehe' ? 'aufbruch' : 'thema';
    else if (zuletzt === 'ruhe' || zuletzt === 'stille') {
      const davor = this.gespielt.filter((s) => s !== 'ruhe' && s !== 'stille').at(-1);
      name = davor === 'thema' ? 'hoehe' : davor === 'hoehe' ? 'aufbruch' : 'thema';
    } else name = this.zufall() < 0.3 ? 'stille' : 'ruhe';
    this.gespielt.push(name);
    if (this.gespielt.length > 60) this.gespielt.shift();
    // Wer das Thema traegt, wechselt: das Horn, die Floete eine Oktave
    // hoeher, oder beide.
    const wurf = this.zufall();
    return {
      name,
      takt: 0,
      // Stille: vier Takte nur die Streicher, kaum zu hoeren.
      takte: name === 'stille' ? 4 : 8,
      traeger: wurf < 0.45 ? 'horn' : wurf < 0.7 ? 'floete' : 'beide',
      trommeln: name === 'thema' && this.zufall() < 0.5 ? 'sacht' : 'marsch',
    };
  }

  taktSpielen(ctx, t) {
    const kampf = this.kampfpegel() >= KAMPF_AB;
    // Ein Kampf wartet nicht, bis die Laute ausgespielt hat.
    if (kampf && this.satz && (this.satz.name === 'ruhe' || this.satz.name === 'stille')) this.satz = null;
    if (!this.satz || this.satz.takt >= this.satz.takte) this.satz = this.naechsterSatz(kampf);
    const satz = this.satz;
    const i = satz.takt;
    satz.takt += 1;
    const ziel = this.musikRegler;
    const noten = SAETZE[satz.name] || SAETZE.ruhe;
    const akkord = AKKORDE[noten.akkorde[i % noten.akkorde.length]];
    const toene = akkord.toene.map(halbton);
    const grund = halbton(akkord.bass);

    if (satz.name === 'stille') {
      this.flaeche(ctx, ziel, t, toene, TAKT, 0.018);
      return;
    }
    this.flaeche(ctx, ziel, t, toene, TAKT, satz.name === 'ruhe' ? 0.022 : 0.03);

    if (satz.name === 'ruhe') {
      // Die Laute bricht den Akkord in Achteln, nicht jeden Schlag; die
      // Floete haelt lange Toene aus dem Akkord.
      for (let achtel = 0; achtel < 8; achtel++) {
        if (achtel > 0 && this.zufall() < 0.3) continue;
        const ton = achtel === 0 ? toene[0] : toene[Math.floor(this.zufall() * toene.length)] + (this.zufall() < 0.35 ? 12 : 0);
        this.zupfen(ctx, ziel, t + achtel * SCHLAG / 2, ton, 1.6, achtel === 0 ? 0.11 : 0.08);
      }
      if (this.zufall() < 0.75) {
        const erster = toene[1 + Math.floor(this.zufall() * 3)] + 12;
        if (this.zufall() < 0.5) this.floete(ctx, ziel, t, erster, TAKT * 0.95, 0.07);
        else {
          this.floete(ctx, ziel, t, erster, SCHLAG * 2, 0.07);
          this.floete(ctx, ziel, t + SCHLAG * 2, toene[1 + Math.floor(this.zufall() * 3)] + 12, SCHLAG * 1.9, 0.07);
        }
      }
      this.bass(ctx, ziel, t, grund, SCHLAG * 3.6, 0.1);
      return;
    }

    // Thema, Aufbruch, Hoehe: die Stimme, der Bass, die Trommeln.
    for (const note of stimmeLesen(noten.stimme[i])) {
      const wann = t + note.schlag * SCHLAG;
      const dauer = note.d * SCHLAG * 0.94;
      if (satz.traeger !== 'floete' || kampf) this.horn(ctx, ziel, wann, note.h, dauer, 0.085);
      if (satz.traeger !== 'horn') this.floete(ctx, ziel, wann, note.h + 12, dauer, satz.traeger === 'floete' && !kampf ? 0.09 : 0.045);
    }
    if (kampf) {
      // Der Bass treibt in Achteln, die Oktave auf drei und sieben.
      for (let achtel = 0; achtel < 8; achtel++) this.bass(ctx, ziel, t + achtel * SCHLAG / 2, grund + (achtel % 4 === 2 ? 12 : 0), SCHLAG * 0.42, 0.13);
    } else {
      this.bass(ctx, ziel, t, grund, SCHLAG * 1.8, 0.13);
      this.bass(ctx, ziel, t + SCHLAG * 2, grund, SCHLAG * 1.8, 0.1);
    }
    const muster = TROMMELN[kampf ? (i % 4 === 3 ? 'wirbel' : 'kampf') : satz.trommeln];
    for (const [schritt, laut] of muster.p) this.pauke(ctx, ziel, t + schritt * SCHLAG / 4, laut * 0.5);
    for (const [schritt, laut] of muster.t) this.trommel(ctx, ziel, t + schritt * SCHLAG / 4, laut * 0.24);
  }

  /**
   * Das Horn: zwei Saegezaehne, leicht gegeneinander verstimmt, durch einen
   * Filter, der sich beim Anblasen oeffnet - so beginnt der Ton weich und
   * wird hell.
   */
  horn(ctx, ziel, t, halbtonHoehe, d, laut) {
    const f = frequenz(halbtonHoehe);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.9;
    filter.frequency.setValueAtTime(f * 1.2, t);
    filter.frequency.linearRampToValueAtTime(f * 3.4, t + 0.09);
    filter.frequency.linearRampToValueAtTime(f * 2.3, t + Math.max(0.12, Math.min(d, 0.5)));
    const huelle = ctx.createGain();
    huelle.gain.setValueAtTime(0.0001, t);
    huelle.gain.linearRampToValueAtTime(laut, t + 0.06);
    huelle.gain.linearRampToValueAtTime(laut * 0.8, t + Math.max(0.08, d * 0.7));
    huelle.gain.linearRampToValueAtTime(0.0001, t + d + 0.12);
    filter.connect(huelle);
    huelle.connect(ziel);
    for (const verstimmt of [-5, 5]) {
      const schwinger = ctx.createOscillator();
      schwinger.type = 'sawtooth';
      schwinger.frequency.setValueAtTime(f, t);
      schwinger.detune.value = verstimmt;
      schwinger.connect(filter);
      schwinger.start(t);
      schwinger.stop(t + d + 0.2);
    }
  }

  // Die Floete: ein Grundton mit wenig Obertoenen und einem Hauch beim Anblasen.
  floete(ctx, ziel, t, halbtonHoehe, d, laut) {
    const f = frequenz(halbtonHoehe);
    const huelle = ctx.createGain();
    huelle.gain.setValueAtTime(0.0001, t);
    huelle.gain.linearRampToValueAtTime(laut, t + 0.09);
    huelle.gain.linearRampToValueAtTime(laut * 0.85, t + Math.max(0.1, d * 0.8));
    huelle.gain.linearRampToValueAtTime(0.0001, t + d + 0.18);
    huelle.connect(ziel);
    for (const [faktor, anteil] of [[1, 1], [2, 0.18], [3, 0.06]]) {
      const schwinger = ctx.createOscillator();
      schwinger.type = 'sine';
      schwinger.frequency.setValueAtTime(f * faktor, t);
      const teil = ctx.createGain();
      teil.gain.value = anteil;
      schwinger.connect(teil);
      teil.connect(huelle);
      schwinger.start(t);
      schwinger.stop(t + d + 0.25);
    }
    this.stoss(ctx, ziel, t, { f: f * 2, q: 2, d: 0.14, laut: laut * 0.12, an: 0.03 });
  }

  // Die Streicher: je Ton zwei verstimmte Saegezaehne, dunkel gefiltert, die
  // langsam kommen und in den naechsten Takt hinein ausklingen.
  flaeche(ctx, ziel, t, toene, d, laut) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1100;
    filter.Q.value = 0.5;
    const huelle = ctx.createGain();
    huelle.gain.setValueAtTime(0.0001, t);
    huelle.gain.linearRampToValueAtTime(laut, t + 0.6);
    huelle.gain.setValueAtTime(laut, t + d);
    huelle.gain.linearRampToValueAtTime(0.0001, t + d + 0.9);
    filter.connect(huelle);
    huelle.connect(ziel);
    for (const ton of toene) {
      for (const verstimmt of [-7, 7]) {
        const schwinger = ctx.createOscillator();
        schwinger.type = 'sawtooth';
        schwinger.frequency.setValueAtTime(frequenz(ton), t);
        schwinger.detune.value = verstimmt;
        schwinger.connect(filter);
        schwinger.start(t);
        schwinger.stop(t + d + 1);
      }
    }
  }

  // Der Bass: Saegezahn und Dreieck, tief gefiltert, mit der Oktave darueber,
  // damit er auch aus kleinen Lautsprechern kommt.
  bass(ctx, ziel, t, halbtonHoehe, d, laut) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    const huelle = ctx.createGain();
    huelle.gain.setValueAtTime(0.0001, t);
    huelle.gain.linearRampToValueAtTime(laut, t + 0.02);
    huelle.gain.linearRampToValueAtTime(laut * 0.7, t + Math.max(0.04, d * 0.5));
    huelle.gain.linearRampToValueAtTime(0.0001, t + d + 0.08);
    filter.connect(huelle);
    huelle.connect(ziel);
    for (const [form, oktave, anteil] of [['sawtooth', 0, 1], ['triangle', 12, 0.6]]) {
      const schwinger = ctx.createOscillator();
      schwinger.type = form;
      schwinger.frequency.setValueAtTime(frequenz(halbtonHoehe + oktave), t);
      const teil = ctx.createGain();
      teil.gain.value = anteil;
      schwinger.connect(teil);
      teil.connect(filter);
      schwinger.start(t);
      schwinger.stop(t + d + 0.15);
    }
  }

  // Die Laute: ein gezupfter Ton, Dreieck mit der Oktave darueber, lang ausklingend.
  zupfen(ctx, ziel, t, halbtonHoehe, dauer, laut) {
    for (const [faktor, anteil] of [[1, 1], [2, 0.25]]) {
      this.stimme(ctx, ziel, { form: faktor === 1 ? 'triangle' : 'sine', f: frequenz(halbtonHoehe) * faktor, t, d: dauer, laut: laut * anteil, an: 0.008 });
    }
  }

  // Die Pauke: ein tiefer Ton, der absinkt, und der Schlag des Schlegels.
  pauke(ctx, ziel, t, laut) {
    this.stimme(ctx, ziel, { f: 105, nach: 46, t, d: 0.55, laut, an: 0.004 });
    this.stoss(ctx, ziel, t, { art: 'lowpass', f: 260, d: 0.12, laut: laut * 0.8, an: 0.002 });
  }

  // Die Trommel: das Fell als Rauschen, darunter ein kurzer Ton.
  trommel(ctx, ziel, t, laut) {
    this.stoss(ctx, ziel, t, { f: 1500, q: 0.7, d: 0.12, laut, an: 0.002 });
    this.stimme(ctx, ziel, { form: 'triangle', f: 200, nach: 150, t, d: 0.09, laut: laut * 0.7, an: 0.002 });
  }

  /**
   * Wie laut es gerade ist: der Effektivwert am Ausgang, 0 bei Stille. Fuer
   * den Browsertest - er kann nicht hoeren, aber messen.
   */
  pegel() {
    if (!this.messer) return 0;
    const daten = new Float32Array(this.messer.fftSize);
    this.messer.getFloatTimeDomainData(daten);
    let summe = 0;
    for (const wert of daten) summe += wert * wert;
    return Math.sqrt(summe / daten.length);
  }
}
