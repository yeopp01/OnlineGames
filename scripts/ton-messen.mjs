// Den Ton offline rechnen und messen (bedienung AC-59 bis AC-62): Spitze und
// Effektivwert je Klang und fuer die Musik - ruhig, im Kampf, mit einem
// Gefecht darueber. Ein Test kann nicht hoeren; wer an Lautstaerken oder
// Instrumenten dreht, sieht hier, ob etwas uebersteuert oder untergeht, und
// bekommt zwei WAV-Dateien zum Anhoeren.
//
//   npm run ton:messen            schreibt nach %TEMP%/onlinegames-ton
//   npm run ton:messen -- <ordner>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from 'playwright';

const ziel = process.argv[2] || join(tmpdir(), 'onlinegames-ton');
mkdirSync(ziel, { recursive: true });

// public/ton.js ist ein Modul; als gewoehnliches Skript geladen, stehen seine
// Teile der Seite offen.
const quelle = readFileSync(new URL('../public/ton.js', import.meta.url), 'utf8').replace(/^export /gm, '') + '\n;window.T = { Ton, KLAENGE, SAETZE, halbton, TAKT };';

const browser = await chromium.launch();
const seite = await browser.newPage();
await seite.addScriptTag({ content: quelle });

const ergebnis = await seite.evaluate(async () => {
  const { Ton, KLAENGE, TAKT } = window.T;
  const RATE = 44100;
  // Ein Zufall mit Startwert, damit zwei Messungen dasselbe rechnen.
  const zufallMit = (start) => {
    let s = start;
    return () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  };
  const aufbauen = (sekunden, start = 7) => {
    const ctx = new OfflineAudioContext(2, Math.ceil(sekunden * RATE), RATE);
    const vorher = globalThis.AudioContext;
    globalThis.AudioContext = function Schein() { return ctx; };
    const ton = new Ton(null, { uhr: () => 0, zufall: zufallMit(start) });
    ton.kontext();
    globalThis.AudioContext = vorher;
    return { ctx, ton };
  };
  const messen = (puffer, von = 0, bis = puffer.duration) => {
    let spitze = 0;
    let summe = 0;
    let n = 0;
    for (let k = 0; k < puffer.numberOfChannels; k++) {
      const d = puffer.getChannelData(k);
      for (let i = Math.floor(von * RATE); i < Math.min(d.length, Math.floor(bis * RATE)); i++) {
        const w = Math.abs(d[i]);
        if (w > spitze) spitze = w;
        summe += d[i] * d[i];
        n++;
      }
    }
    return { spitze: Number(spitze.toFixed(4)), effektiv: Number(Math.sqrt(summe / n).toFixed(4)) };
  };
  const wav = (puffer) => {
    const n = puffer.length;
    const kanaele = puffer.numberOfChannels;
    const bytes = new Uint8Array(44 + n * kanaele * 2);
    const v = new DataView(bytes.buffer);
    const text = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    text(0, 'RIFF'); v.setUint32(4, 36 + n * kanaele * 2, true); text(8, 'WAVEfmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, kanaele, true);
    v.setUint32(24, RATE, true); v.setUint32(28, RATE * kanaele * 2, true); v.setUint16(32, kanaele * 2, true);
    v.setUint16(34, 16, true); text(36, 'data'); v.setUint32(40, n * kanaele * 2, true);
    const daten = [...Array(kanaele)].map((_, k) => puffer.getChannelData(k));
    let o = 44;
    for (let i = 0; i < n; i++) for (let k = 0; k < kanaele; k++) {
      v.setInt16(o, Math.max(-1, Math.min(1, daten[k][i])) * 32767, true);
      o += 2;
    }
    let roh = '';
    for (let i = 0; i < bytes.length; i += 32768) roh += String.fromCharCode(...bytes.subarray(i, i + 32768));
    return btoa(roh);
  };

  const raus = { klaenge: {}, dateien: {} };

  // 1) Jeder Klang einzeln, in voller Lautstaerke (mitten im Bild, nah).
  for (const [name, klang] of Object.entries(KLAENGE)) {
    const { ctx, ton } = aufbauen(4);
    ton.klingen(ctx, klang, klang.art ? { laut: 1, seite: 0 } : null);
    raus.klaenge[name] = messen(await ctx.startRendering());
  }

  // 2) Alle Klaenge hintereinander, zum Anhoeren.
  {
    const namen = Object.keys(KLAENGE);
    const { ctx, ton } = aufbauen(namen.length * 2.6 + 6);
    namen.forEach((name, i) => {
      const klang = KLAENGE[name];
      const t = 0.2 + i * 2.6;
      // Geraeusche dreimal - jedes ist anders gewuerfelt.
      if (klang.art) for (let k = 0; k < 3; k++) ton[klang.art](ctx, ton.effekte, t + k * 0.7, klang.laut);
      else if (klang.stimme === 'horn') for (const n of klang.noten) ton.horn(ctx, ton.effekte, t + n.t, n.h, n.d, klang.laut);
      else {
        for (const n of klang.noten) ton.stimme(ctx, ton.effekte, { form: klang.form, f: 440 * 2 ** (n.h / 12), nach: n.nach === undefined ? null : 440 * 2 ** (n.nach / 12), t: t + n.t, d: n.d, laut: klang.laut });
        for (const k of klang.klopfen || []) ton.hammer(ctx, ton.effekte, t + k, 0.3);
      }
    });
    raus.dateien.klaenge = wav(await ctx.startRendering());
  }

  // 3) Die Musik: 34 Takte ruhig, dann 16 Takte Kampf mit einem Gefecht darueber.
  {
    const ruhig = 34;
    const kampf = 16;
    const { ctx, ton } = aufbauen((ruhig + kampf) * TAKT + 4, 11);
    ton.musikRegler.gain.value = 0.42;
    ton.musikLaeuft = true;
    for (let i = 0; i < ruhig; i++) ton.taktSpielen(ctx, 0.3 + i * TAKT);
    const saetzeRuhig = [...ton.gespielt];
    ton.kampf = 1;
    const ab = 0.3 + ruhig * TAKT;
    for (let i = 0; i < kampf; i++) ton.taktSpielen(ctx, ab + i * TAKT);
    // Das Gefecht: zwanzig Kaempfer, sieben Schlaege je Sekunde, dazu Pfeile,
    // ein Stein und ein Einsturz - so dicht, wie die Sperre es zulaesst.
    const z = zufallMit(3);
    for (let t = ab + 2; t < ab + kampf * TAKT - 2; t += 0.145) {
      const wo = ctx.createStereoPanner();
      wo.pan.value = z() * 1.6 - 0.8;
      const regler = ctx.createGain();
      regler.gain.value = 0.55 + z() * 0.4;
      regler.connect(wo);
      wo.connect(ton.effekte);
      const wurf = z();
      if (wurf < 0.55) ton.klirren(ctx, regler, t, KLAENGE.schwert.laut);
      else if (wurf < 0.8) ton.hieb(ctx, regler, t, KLAENGE.hieb.laut);
      else ton.pfeil(ctx, regler, t, KLAENGE.pfeil.laut);
    }
    ton.wurf(ctx, ton.effekte, ab + 12, KLAENGE.wurf.laut);
    ton.einschlag(ctx, ton.effekte, ab + 13, KLAENGE.einschlag.laut);
    ton.einsturz(ctx, ton.effekte, ab + 20, KLAENGE.einsturz.laut);
    const puffer = await ctx.startRendering();
    raus.saetze = { ruhig: saetzeRuhig, kampf: ton.gespielt.slice(saetzeRuhig.length) };
    raus.musik = {
      ruhigGanz: messen(puffer, 0, ab),
      // je Satz, soweit er ruhig gespielt wurde
      jeSatz: (() => {
        const liste = [];
        let t = 0.3;
        for (const name of saetzeRuhig) {
          const takte = name === 'stille' ? 4 : 8;
          const bis = Math.min(ab, t + takte * TAKT);
          if (bis > t) liste.push({ name, ...messen(puffer, t, bis) });
          t += takte * TAKT;
        }
        return liste;
      })(),
      kampfNurMusik: messen(puffer, ab, ab + 2),
      kampfMitGefecht: messen(puffer, ab + 2, ab + kampf * TAKT - 2),
    };
    raus.dateien.musik = wav(puffer);
  }
  return raus;
});
await browser.close();

for (const [name, daten] of Object.entries(ergebnis.dateien)) {
  const datei = join(ziel, `ton-${name}.wav`);
  writeFileSync(datei, Buffer.from(daten, 'base64'));
  console.error(`geschrieben: ${datei}`);
}
delete ergebnis.dateien;
console.log(JSON.stringify(ergebnis, null, 1));
