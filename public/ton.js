// Ton (bedienung AC-59 bis AC-61): Geraeusche zu dem, was im Spiel geschieht,
// und leise Musik darunter.
//
// Alles wird hier im Browser erzeugt (WebAudio): Schwingungen, Rauschen,
// Huellkurven. Es gibt keine Klangdatei - und damit kein Material aus dem
// Original und keins von sonstwo (darstellung AC-11, ADR-0012).
//
// Die Ansicht weiss nichts vom Ton: sie nennt Ereignisse beim Namen
// (`ansicht.beiEreignis`), app.js reicht sie hierher. Was ein Name klingt,
// steht als Daten in KLAENGE.

const GEMERKT = { geraeusche: 'tonGeraeusche', musik: 'tonMusik' };

// Halbtoene ueber dem Kammerton a' (440 Hz).
const frequenz = (halbton) => 440 * 2 ** (halbton / 12);

/**
 * Je Ereignis ein Klang: `noten` mit Halbton `h`, Beginn `t` und Dauer `d` in
 * Sekunden, `nach` fuer ein Gleiten zum zweiten Halbton; `klopfen` sind
 * Schlaege aus gefiltertem Rauschen. `abstand` ist die Zeit in
 * Millisekunden, in der derselbe Klang nicht noch einmal beginnt - zehn
 * Dorfbewohner, die im selben Takt fertig werden, sind ein Klang, und ein
 * Gefecht ist kein Dauerhorn.
 */
export const KLAENGE = {
  // Zwei helle Toene aufwaerts: da ist jemand.
  einheit: { abstand: 350, laut: 0.2, form: 'triangle', noten: [{ h: -2, t: 0, d: 0.18 }, { h: 5, t: 0.11, d: 0.32 }] },
  // Zwei Hammerschlaege, dann ein ruhiger Zweiklang: es steht.
  gebaeude: { abstand: 500, laut: 0.15, form: 'triangle', klopfen: [0, 0.16], noten: [{ h: -7, t: 0.3, d: 0.55 }, { h: 0, t: 0.3, d: 0.55 }] },
  // Drei Glockentoene aufwaerts.
  forschung: { abstand: 500, laut: 0.17, form: 'sine', noten: [{ h: 5, t: 0, d: 0.5 }, { h: 9, t: 0.12, d: 0.5 }, { h: 12, t: 0.24, d: 0.9 }] },
  // Ein Signal, das in einem Akkord stehen bleibt.
  zeitalter: {
    abstand: 3000, laut: 0.1, form: 'sawtooth',
    noten: [
      { h: -7, t: 0, d: 0.35 }, { h: 0, t: 0.3, d: 0.35 },
      { h: -7, t: 0.6, d: 1.5 }, { h: 0, t: 0.6, d: 1.5 }, { h: 5, t: 0.6, d: 1.5 }, { h: 9, t: 0.6, d: 1.5 },
    ],
  },
  // Ein tiefes Horn, zweimal - das eine Geraeusch, das stoeren soll.
  angriff: {
    abstand: 8000, laut: 0.12, form: 'sawtooth',
    noten: [{ h: -12, t: 0, d: 0.38 }, { h: -5, t: 0, d: 0.38 }, { h: -12, t: 0.48, d: 0.65 }, { h: -5, t: 0.48, d: 0.65 }],
  },
  // Ein Ton, der absinkt.
  gefallen: { abstand: 1500, laut: 0.18, form: 'sine', noten: [{ h: -14, nach: -19, t: 0, d: 0.45 }] },
  // Kurz und dumpf: das ging nicht.
  absage: { abstand: 300, laut: 0.05, form: 'square', noten: [{ h: -19, t: 0, d: 0.14 }] },
  sieg: {
    abstand: 5000, laut: 0.16, form: 'triangle',
    noten: [
      { h: -7, t: 0, d: 0.3 }, { h: -3, t: 0.18, d: 0.3 }, { h: 0, t: 0.36, d: 0.3 },
      { h: 5, t: 0.54, d: 1.8 }, { h: -3, t: 0.54, d: 1.8 }, { h: -7, t: 0.54, d: 1.8 },
    ],
  },
  niederlage: {
    abstand: 5000, laut: 0.16, form: 'sine',
    noten: [{ h: -7, t: 0, d: 0.6 }, { h: -9, t: 0.5, d: 0.6 }, { h: -11, t: 1.0, d: 0.6 }, { h: -12, t: 1.5, d: 1.8 }],
  },
};

// Die Musik spielt auf fuenf Toenen - d, e, g, a, c - ueber zwei Oktaven.
// Ohne Halbtonschritte klingt jede Folge daraus ruhig, was auch gewuerfelt wird.
const LEITER = [-19, -17, -14, -12, -9, -7, -5, -2, 0, 3, 5];
const SCHRITTE = [-2, -1, -1, 1, 1, 2];
const LAENGEN = [0.9, 1.2, 1.8];
const MUSIK_LAUT = 0.13;

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
    // wo niemand zuhoert.
    this.protokoll = [];
    this.ctx = null;
    this.partie = false; // laeuft eine Partie? Nur dann spielt die Musik.
    this.musikLaeuft = false;
    this.musikUhr = null;
    this.stufe = 5;
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
   */
  kontext() {
    if (this.ctx) return this.ctx;
    const Art = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Art) return null;
    try {
      const ctx = new Art();
      this.ausgang = ctx.createGain();
      this.ausgang.gain.value = 0.9;
      this.messer = ctx.createAnalyser();
      this.messer.fftSize = 1024;
      this.ausgang.connect(this.messer);
      this.messer.connect(ctx.destination);
      // Die Musik hat ihren eigenen Regler, einen weichen Filter und ein
      // leises Echo - das gibt den wenigen Toenen Raum.
      this.musikRegler = ctx.createGain();
      this.musikRegler.gain.value = 0;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2200;
      const echo = ctx.createDelay(1);
      echo.delayTime.value = 0.42;
      const zurueck = ctx.createGain();
      zurueck.gain.value = 0.28;
      const anteil = ctx.createGain();
      anteil.gain.value = 0.3;
      this.musikRegler.connect(filter);
      filter.connect(this.ausgang);
      filter.connect(echo);
      echo.connect(zurueck);
      zurueck.connect(echo);
      echo.connect(anteil);
      anteil.connect(this.ausgang);
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
   */
  spielen(name) {
    const klang = KLAENGE[name];
    if (!klang || !this.geraeusche) return false;
    const jetzt = this.uhr();
    const zuletzt = this.zuletzt.get(name);
    if (zuletzt !== undefined && jetzt - zuletzt < klang.abstand) return false;
    this.zuletzt.set(name, jetzt);
    this.protokoll.push({ name, zeit: jetzt });
    if (this.protokoll.length > 100) this.protokoll.shift();
    const ctx = this.entsperrt ? this.kontext() : null;
    if (ctx) this.klingen(ctx, klang);
    return true;
  }

  klingen(ctx, klang) {
    const t0 = ctx.currentTime + 0.02;
    let ziel = this.ausgang;
    // Saegezahn und Rechteck sind roh zu scharf: ein Filter nimmt die Spitze.
    if (klang.form === 'sawtooth' || klang.form === 'square') {
      ziel = ctx.createBiquadFilter();
      ziel.type = 'lowpass';
      ziel.frequency.value = 1700;
      ziel.connect(this.ausgang);
    }
    for (const note of klang.noten || []) {
      this.stimme(ctx, ziel, { form: klang.form, f: frequenz(note.h), nach: note.nach === undefined ? null : frequenz(note.nach), t: t0 + note.t, d: note.d, laut: klang.laut });
    }
    for (const t of klang.klopfen || []) this.schlag(ctx, this.ausgang, t0 + t);
  }

  // Eine Stimme: schnell da, dann ausklingend.
  stimme(ctx, ziel, { form, f, nach, t, d, laut }) {
    const schwinger = ctx.createOscillator();
    schwinger.type = form;
    schwinger.frequency.setValueAtTime(f, t);
    if (nach) schwinger.frequency.exponentialRampToValueAtTime(nach, t + d);
    const huelle = ctx.createGain();
    huelle.gain.setValueAtTime(0.0001, t);
    huelle.gain.linearRampToValueAtTime(laut, t + 0.015);
    huelle.gain.exponentialRampToValueAtTime(0.0008, t + d);
    schwinger.connect(huelle);
    huelle.connect(ziel);
    schwinger.start(t);
    schwinger.stop(t + d + 0.05);
  }

  // Ein Hammerschlag: ein Stoss Rauschen durch einen engen Filter.
  schlag(ctx, ziel, t) {
    const laenge = Math.floor(ctx.sampleRate * 0.09);
    const puffer = ctx.createBuffer(1, laenge, ctx.sampleRate);
    const daten = puffer.getChannelData(0);
    for (let i = 0; i < laenge; i++) daten[i] = (this.zufall() * 2 - 1) * (1 - i / laenge);
    const quelle = ctx.createBufferSource();
    quelle.buffer = puffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 520;
    filter.Q.value = 1.2;
    const huelle = ctx.createGain();
    huelle.gain.setValueAtTime(0.4, t);
    huelle.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    quelle.connect(filter);
    filter.connect(huelle);
    huelle.connect(ziel);
    quelle.start(t);
  }

  // ---- Musik (bedienung AC-60) ----------------------------------------------
  // Keine Aufnahme, kein Stueck: kurze gezupfte Folgen auf fuenf Toenen, dazu
  // ein leiser Liegeklang, mit Pausen dazwischen. Sie soll da sein, ohne dass
  // man ihr zuhoeren muss.

  /** Eine Partie beginnt oder ist verlassen. */
  partieSetzen(laeuft) {
    this.partie = Boolean(laeuft);
    this.musikPruefen();
  }

  /** Im Hintergrund schweigt die Musik - die Geraeusche nicht, ein Angriff soll auch dort zu hoeren sein. */
  sichtbarSetzen(sichtbar) {
    this.verdeckt = !sichtbar;
    this.musikPruefen();
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
    if (soll) {
      this.musikRegler.gain.linearRampToValueAtTime(MUSIK_LAUT, jetzt + 3);
      this.liegeklang(ctx, true);
      this.phrase();
    } else {
      this.musikRegler.gain.linearRampToValueAtTime(0, jetzt + 0.8);
      this.liegeklang(ctx, false);
      clearTimeout(this.musikUhr);
      this.musikUhr = null;
    }
  }

  // Grundton und Quinte, kaum zu hoeren - der Boden unter den gezupften Toenen.
  liegeklang(ctx, an) {
    const jetzt = ctx.currentTime;
    if (!an) {
      for (const { schwinger, huelle } of this.liegend || []) {
        huelle.gain.cancelScheduledValues(jetzt);
        huelle.gain.setValueAtTime(huelle.gain.value, jetzt);
        huelle.gain.linearRampToValueAtTime(0, jetzt + 0.8);
        schwinger.stop(jetzt + 1);
      }
      this.liegend = null;
      return;
    }
    this.liegend = [-19, -12].map((halbton) => {
      const schwinger = ctx.createOscillator();
      schwinger.type = 'sine';
      schwinger.frequency.value = frequenz(halbton);
      const huelle = ctx.createGain();
      huelle.gain.setValueAtTime(0, jetzt);
      huelle.gain.linearRampToValueAtTime(0.16, jetzt + 5);
      schwinger.connect(huelle);
      huelle.connect(this.musikRegler);
      schwinger.start(jetzt);
      return { schwinger, huelle };
    });
  }

  // Eine Folge von drei bis sechs Toenen, in kleinen Schritten durch die
  // Leiter; danach Stille, dann die naechste.
  phrase() {
    if (!this.musikLaeuft || !this.ctx) return;
    const ctx = this.ctx;
    const beginn = ctx.currentTime + 0.1;
    let wann = beginn;
    const anzahl = 3 + Math.floor(this.zufall() * 4);
    for (let i = 0; i < anzahl; i++) {
      const schritt = SCHRITTE[Math.floor(this.zufall() * SCHRITTE.length)];
      this.stufe = Math.max(0, Math.min(LEITER.length - 1, this.stufe + schritt));
      const letzter = i === anzahl - 1;
      this.zupfen(ctx, wann, LEITER[this.stufe], letzter ? 4.5 : 3, 0.5);
      wann += LAENGEN[Math.floor(this.zufall() * LAENGEN.length)];
    }
    // Hin und wieder ein tiefer Ton darunter.
    if (this.zufall() < 0.6) this.zupfen(ctx, beginn, this.zufall() < 0.5 ? -31 : -24, 6, 0.4);
    const pause = 2.5 + this.zufall() * 4;
    this.musikUhr = setTimeout(() => this.phrase(), (wann - beginn + pause) * 1000);
  }

  // Ein gezupfter Ton: Dreieck mit der Oktave darueber, lang ausklingend.
  zupfen(ctx, t, halbton, dauer, laut) {
    for (const [faktor, anteil] of [[1, 1], [2, 0.25]]) {
      const schwinger = ctx.createOscillator();
      schwinger.type = faktor === 1 ? 'triangle' : 'sine';
      schwinger.frequency.value = frequenz(halbton) * faktor;
      const huelle = ctx.createGain();
      huelle.gain.setValueAtTime(0.0001, t);
      huelle.gain.linearRampToValueAtTime(laut * anteil, t + 0.02);
      huelle.gain.exponentialRampToValueAtTime(0.0005, t + dauer);
      schwinger.connect(huelle);
      huelle.connect(this.musikRegler);
      schwinger.start(t);
      schwinger.stop(t + dauer + 0.05);
    }
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
