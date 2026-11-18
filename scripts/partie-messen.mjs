// Das Tempo einer ausgebauten Partie messen (darstellung AC-30): beide Seiten
// spielt die KI im Zeitraffer bis MINUTE, dann stehen je Seite JE
// Kampfeinheiten im Dorf des ersten Spielers, und es wird in Echtzeit
// gemessen - im Browser (Bilder je Sekunde, laengstes Bild, lange Aufgaben,
// zeichnen() nach Teilen, neue Figurenbilder, verkleinerte Tafeln) und auf
// dem Server (Rechenzeit je Takt samt KI, je Zustand, Groesse der Nachricht).
// Vier Lagen: Dorf, Gefecht, Gefecht mit Auswahl, und mit NAH dasselbe nah
// herangezoomt.
//
//   npm run tempo:partie
//   MINUTE=25 JE=40 ZOOM=1 NAH=1.8 npm run tempo:partie
//
// Der Befehl oeffnet ein sichtbares Chrome-Fenster (`--kopf`): nur so
// zeichnet der Browser mit der Grafikkarte, wie bei einem Spieler. Solange
// gemessen wird, nicht hineinklicken und das Fenster nicht verdecken - ein
// verdecktes Fenster zeichnet nicht. Dauer rund fuenf Minuten.
//
// Weitere Stellgroessen: SEKUNDEN je Lage (8), RAFFER bis zur Minute (10),
// GRENZE des Figurenspeichers in Millionen Bildpunkten (0: wie im Spiel).
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(pathToFileURL(`${process.cwd()}/`).href);
const { Ki } = require('./server/spiele/strategie/ki.js');

const MINUTE = Number(process.env.MINUTE || 25);
const JE = Number(process.env.JE || 40);
const ZOOM = Number(process.env.ZOOM || 1);
const SEKUNDEN = Number(process.env.SEKUNDEN || 8);
const RAFFER = Number(process.env.RAFFER || 10);
const GRENZE = Number(process.env.GRENZE || 0);
const NAH = Number(process.env.NAH || 0);
const ANTEILE = { soldat: 0.35, speerkaempfer: 0.15, bogenschuetze: 0.25, plaenkler: 0.1, spaeherreiter: 0.15 };

const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;
const sortiert = (l) => [...l].sort((x, y) => x - y);
const q = (l, p) => { const s = sortiert(l); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; };
const mittel = (l) => (l.length ? l.reduce((m, v) => m + v, 0) / l.length : 0);

const messen = (seite, sekunden) => seite.evaluate((dauer) => new Promise((fertig) => {
  const a = window.ansicht;
  const teile = ['bodenZeichnen', 'gebaeudeBild', 'einheitZeichnen', 'nebelZeichnen', 'pfeileZeichnen', 'lebensbalkenZeichnen', 'umrisseZeichnen', 'mauerschatten', 'gezeigteGebaeude', 'namenZeichnen', 'ruinenMalen'];
  const zeit = Object.fromEntries(teile.map((t) => [t, 0]));
  const alt = {};
  for (const t of teile) {
    if (typeof a[t] !== 'function') continue;
    alt[t] = a[t];
    a[t] = function (...werte) {
      const s = performance.now();
      try { return alt[t].apply(this, werte); } finally { zeit[t] += performance.now() - s; }
    };
  }
  const zeichnenAlt = a.zeichnen;
  const zustandAlt = a.zustand;
  const jeBild = [];
  const jeZustand = [];
  const ankunft = [];
  a.zeichnen = function (jetzt) {
    const s = performance.now();
    zeichnenAlt.call(this, jetzt);
    jeBild.push(performance.now() - s);
  };
  a.zustand = function (nachricht) {
    const s = performance.now();
    ankunft.push(s);
    const r = zustandAlt.call(this, nachricht);
    jeZustand.push(performance.now() - s);
    return r;
  };
  const lang = [];
  let beobachter = null;
  try {
    beobachter = new PerformanceObserver((liste) => { for (const e of liste.getEntries()) lang.push(e.duration); });
    beobachter.observe({ entryTypes: ['longtask'] });
  } catch { /* dann ohne */ }
  import('/bildspeicher.js').then(({ Bildspeicher }) => {
    const stand = () => Object.fromEntries([...Bildspeicher.alle.entries()].map(([n, s]) => [n, { abgelegt: s.abgelegt, verworfen: s.verworfen, zahl: s.zahl, mp: s.punkte / 1e6 }]));
    const vorher = stand();
    const figuren = Bildspeicher.alle.get('figuren');
    const legenAlt = figuren.legen;
    const erzeugt = [];
    figuren.legen = function (schluessel, b, familie, beginn) {
      if (beginn !== undefined) erzeugt.push(performance.now() - beginn);
      return legenAlt.call(this, schluessel, b, familie, beginn);
    };
    const abstaende = [];
    let zuletzt = performance.now();
    const beginn = zuletzt;
    const bild = () => {
      const jetzt = performance.now();
      abstaende.push(jetzt - zuletzt);
      zuletzt = jetzt;
      if (jetzt - beginn < dauer * 1000) { requestAnimationFrame(bild); return; }
      a.zeichnen = zeichnenAlt;
      a.zustand = zustandAlt;
      for (const t of Object.keys(alt)) a[t] = alt[t];
      beobachter?.disconnect();
      delete figuren.legen;
      const sort = (l) => [...l].sort((x, y) => x - y);
      const qq = (l, p) => { const s = sort(l); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0; };
      const mi = (l) => (l.length ? l.reduce((m, v) => m + v, 0) / l.length : 0);
      const r = (v) => Math.round(v * 10) / 10;
      const nachher = stand();
      const speicher = {};
      for (const [n, s] of Object.entries(nachher)) {
        speicher[n] = { neu: s.abgelegt - (vorher[n]?.abgelegt || 0), verworfen: s.verworfen - (vorher[n]?.verworfen || 0), zahl: s.zahl, mp: r(s.mp) };
      }
      const sek = (jetzt - beginn) / 1000;
      const lebend = [...a.nachher.values()].filter((e) => !e.s);
      const zwischen = ankunft.slice(1).map((t, i) => t - ankunft[i]);
      fertig({
        bilderJeSekunde: r(abstaende.length / sek),
        abstand: { mittel: r(mi(abstaende)), p95: r(qq(abstaende, 0.95)), p99: r(qq(abstaende, 0.99)), max: r(Math.max(...abstaende)), ueber33: abstaende.filter((v) => v > 33).length, ueber50: abstaende.filter((v) => v > 50).length },
        zeichnen: { mittel: r(mi(jeBild)), p95: r(qq(jeBild, 0.95)), max: r(Math.max(0, ...jeBild)) },
        zustand: { mittel: r(mi(jeZustand)), p95: r(qq(jeZustand, 0.95)), max: r(Math.max(0, ...jeZustand)), zahl: jeZustand.length },
        ankunft: { mittel: r(mi(zwischen)), p95: r(qq(zwischen, 0.95)), max: r(Math.max(0, ...zwischen)), ueber150: zwischen.filter((v) => v > 150).length },
        langeAufgaben: { zahl: lang.length, summe: r(lang.reduce((m, v) => m + v, 0)), max: r(Math.max(0, ...lang)) },
        teileMsJeBild: Object.fromEntries(Object.entries(zeit).filter(([, v]) => v > 0).map(([n, v]) => [n, r(v / Math.max(1, jeBild.length))])),
        speicher,
        erzeugt: { zahl: erzeugt.length, summe: r(erzeugt.reduce((m, v) => m + v, 0)), mittel: Math.round(mi(erzeugt) * 100) / 100, p95: r(qq(erzeugt, 0.95)), max: r(Math.max(0, ...erzeugt)), ueber5: erzeugt.filter((v) => v > 5).length },
        zoom: a.kamera.zoom,
        dichte: window.devicePixelRatio,
        grenze: figuren.grenze / 1e6,
        einheiten: lebend.length,
        gebaeude: a.gebaeude.size,
        kaempfend: lebend.filter((e) => e.sl !== undefined).length,
        gewaehlt: a.ausgewaehlt.size,
      });
    };
    requestAnimationFrame(bild);
  });
}), sekunden);

async function mitProfil(seite, tun) {
  const cdp = await seite.context().newCDPSession(seite);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
  await cdp.send('Profiler.start');
  const ergebnis = await tun();
  const { profile } = await cdp.send('Profiler.stop');
  const knoten = new Map(profile.nodes.map((n) => [n.id, n]));
  const eigen = new Map();
  let gesamt = 0;
  profile.samples.forEach((id, i) => {
    const n = knoten.get(id);
    const ms = (profile.timeDeltas[i] || 0) / 1000;
    gesamt += ms;
    const f = n.callFrame;
    const datei = (f.url || '').split('/').pop();
    const name = `${f.functionName || '(anonym)'}${datei ? ` ${datei}:${f.lineNumber + 1}` : ''}`;
    eigen.set(name, (eigen.get(name) || 0) + ms);
  });
  const oben = [...eigen.entries()].sort((x, y) => y[1] - x[1]).slice(0, 26).map(([n, ms]) => `${(ms / gesamt * 100).toFixed(1).padStart(5)} %  ${Math.round(ms).toString().padStart(5)} ms  ${n}`);
  await cdp.detach();
  return { ergebnis, oben };
}

export default async ({ anna, bert, welt, laufend, code, bild }) => {
  const raum = laufend.raeume.finden(code);
  const [a, b] = welt.spieler;
  const g = welt.karte.groesse;
  await bert.goto('about:blank');
  await anna.evaluate(() => { document.querySelector('#erklaerung button, [data-verstanden]')?.click(); });

  // Beide Seiten spielt die KI - wie im Steckbrief vor jedem Takt.
  const lenker = [new Ki(welt, a.id), new Ki(welt, b.id)];
  const taktenAlt = welt.takten.bind(welt);
  const server = { ki: [], takt: [], zustand: [], zeichen: [] };
  let aufzeichnen = false;
  welt.takten = () => {
    const s0 = performance.now();
    for (const ki of lenker) ki.takt();
    const s1 = performance.now();
    taktenAlt();
    if (aufzeichnen) { server.ki.push(s1 - s0); server.takt.push(performance.now() - s1); }
  };
  const jeAlt = welt.zustandJeSpieler.bind(welt);
  welt.zustandJeSpieler = (ids) => {
    const s = performance.now();
    const je = jeAlt(ids);
    const t = performance.now() - s;
    if (aufzeichnen) {
      const s2 = performance.now();
      const laenge = JSON.stringify(je.get(a.id)).length;
      server.zustand.push(t + (performance.now() - s2) * ids.length);
      server.zeichen.push(laenge);
    }
    return je;
  };
  const serverBeginnen = () => { for (const k of Object.keys(server)) server[k] = []; aufzeichnen = true; };
  const serverLesen = () => {
    aufzeichnen = false;
    const gesamt = server.takt.map((t, i) => t + server.ki[i]);
    return `Server: KI ${r2(mittel(server.ki))} (max ${r1(Math.max(0, ...server.ki))}) ms, Welt ${r2(mittel(server.takt))} (p95 ${r2(q(server.takt, 0.95))}, max ${r1(Math.max(0, ...server.takt))}) ms, zusammen max ${r1(Math.max(0, ...gesamt))} ms, Takte ueber 20 ms: ${gesamt.filter((v) => v > 20).length} von ${gesamt.length} | Zustand samt Verpacken ${r2(mittel(server.zustand))} (max ${r1(Math.max(0, ...server.zustand))}) ms, ${Math.round(mittel(server.zeichen) / 1000)} kB je Zustand (max ${Math.round(Math.max(0, ...server.zeichen) / 1000)} kB)`;
  };

  // Im Zeitraffer bis MINUTE. Niemand soll vorher gewinnen: wer am Boden
  // liegt, bekommt sein Dorfzentrum zurueck auf volles Leben.
  raum.zeitraffer = RAFFER;
  const zielTakt = MINUTE * 600;
  const start = Date.now();
  while (welt.takt < zielTakt && !welt.vorbei) {
    await anna.waitForTimeout(2000);
    for (const geb of welt.gebaeude.values()) if (geb.art === 'dorfzentrum' && geb.fertig !== false) geb.leben = Math.max(geb.leben, 1500);
  }
  raum.zeitraffer = 1;
  console.log(`Minute ${r1(welt.takt / 600)} nach ${Math.round((Date.now() - start) / 1000)} s${welt.vorbei ? ' - VORBEI' : ''}`);
  const zaehlen = (id) => ({ einheiten: [...welt.einheiten.values()].filter((e) => e.besitzer === id).length, gebaeude: [...welt.gebaeude.values()].filter((x) => x.besitzer === id).length, zeitalter: welt.spieler.find((s) => s.id === id).zeitalter });
  console.log(`Anna ${JSON.stringify(zaehlen(a.id))}, Bert ${JSON.stringify(zaehlen(b.id))}, Einheiten gesamt ${welt.einheiten.size}, Gebaeude gesamt ${welt.gebaeude.size}`);

  const zeile = (name, m) => console.log(`${name.padEnd(12)} ${String(m.bilderJeSekunde).padStart(5)} Bilder/s | Abstand mittel ${m.abstand.mittel} p95 ${m.abstand.p95} p99 ${m.abstand.p99} max ${m.abstand.max} ms, ueber 33 ms: ${m.abstand.ueber33}, ueber 50 ms: ${m.abstand.ueber50} | zeichnen ${m.zeichnen.mittel} (p95 ${m.zeichnen.p95}, max ${m.zeichnen.max}) ms | zustand ${m.zustand.mittel} (p95 ${m.zustand.p95}, max ${m.zustand.max}) ms | Ankunft mittel ${m.ankunft.mittel} p95 ${m.ankunft.p95} max ${m.ankunft.max} ms, ueber 150 ms: ${m.ankunft.ueber150} | lange Aufgaben ${m.langeAufgaben.zahl} (${m.langeAufgaben.summe} ms) | im Bild bekannt: ${m.einheiten} Einheiten, ${m.gebaeude} Gebaeude, kaempfend ${m.kaempfend}, gewaehlt ${m.gewaehlt}\n             Teile: ${JSON.stringify(m.teileMsJeBild)}\n             Speicher: ${JSON.stringify(m.speicher)}\n             Neue Figurenbilder: ${JSON.stringify(m.erzeugt)} | Zoom ${m.zoom}, Dichte ${m.dichte}, Grenze ${m.grenze} MP`);
  const phase = async (name, sekunden, profil = false, zoom = ZOOM) => {
    await anna.evaluate(({ x, y, zoom, grenze }) => import('/bildspeicher.js').then(({ Bildspeicher }) => {
      if (grenze) Bildspeicher.alle.get('figuren').grenze = grenze * 1e6;
      window.ansicht.kamera.zoom = zoom;
      window.ansicht.blickAuf(x, y);
    }), { x: a.basis.x + 1, y: a.basis.y + 6, zoom, grenze: GRENZE });
    await anna.waitForTimeout(1500);
    serverBeginnen();
    let m;
    let oben = null;
    if (profil) ({ ergebnis: m, oben } = await mitProfil(anna, () => messen(anna, sekunden)));
    else m = await messen(anna, sekunden);
    const s = serverLesen();
    zeile(name, m);
    console.log(`             ${s}`);
    console.log(`             Verkleinerte Tafeln: ${JSON.stringify(await anna.evaluate(async () => (await import('/bilder.js')).atlantenStand?.()))}`);
    if (oben) console.log(`Eigenzeit ${name}:\n${oben.join('\n')}`);
    return m;
  };

  // 1. Das eigene Dorf, wie es dasteht.
  await anna.evaluate(({ x, y, zoom }) => { window.ansicht.kamera.zoom = zoom; window.ansicht.blickAuf(x, y); }, { x: a.basis.x, y: a.basis.y, zoom: ZOOM });
  await anna.waitForTimeout(2500);
  await phase('Dorf', 5);
  await bild('partie-dorf');

  // 2. Ein Gefecht im Dorf: je Seite JE dazu, mitten zwischen den Haeusern.
  const belegt = new Set([...welt.einheiten.values()].map((e) => `${Math.round(e.x)},${Math.round(e.y)}`));
  const stellen = (spieler, mx, my) => {
    const ids = [];
    const felder = [];
    for (let r = 0; r < 16; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = mx + dx;
      const y = my + dy;
      if (x < 1 || y < 1 || x >= g - 1 || y >= g - 1) continue;
      if (belegt.has(`${x},${y}`) || welt.karte.felder[y * g + x] !== 0 || welt.gebaeudeAn(x, y)) continue;
      felder.push({ x, y });
    }
    let i = 0;
    for (const [art, anteil] of Object.entries(ANTEILE)) {
      for (let k = 0; k < Math.round(JE * anteil); k++) {
        const f = felder[i++];
        if (!f) return ids;
        belegt.add(`${f.x},${f.y}`);
        ids.push(welt.einheitAnlegen(spieler.id, f.x, f.y, art).id);
      }
    }
    return ids;
  };
  const meine = stellen(a, a.basis.x - 5, a.basis.y + 6);
  const seine = stellen(b, a.basis.x + 7, a.basis.y + 6);
  welt.befehl(a.id, meine, { x: a.basis.x + 7, y: a.basis.y + 6 }, true, false);
  welt.befehl(b.id, seine, { x: a.basis.x - 5, y: a.basis.y + 6 }, true, false);
  await anna.waitForFunction(() => [...window.ansicht.nachher.values()].filter((e) => e.sl !== undefined).length >= 6, null, { timeout: 30_000 });
  await phase('Gefecht', SEKUNDEN, true);
  await bild('partie-gefecht');

  // 3. Dasselbe mit allem Eigenen ausgewaehlt: die Leiste arbeitet mit.
  const dritte = stellen(a, a.basis.x - 5, a.basis.y + 6);
  const vierte = stellen(b, a.basis.x + 7, a.basis.y + 6);
  welt.befehl(a.id, dritte, { x: a.basis.x + 7, y: a.basis.y + 6 }, true, false);
  welt.befehl(b.id, vierte, { x: a.basis.x - 5, y: a.basis.y + 6 }, true, false);
  await anna.waitForFunction((ids) => ids.some((id) => window.ansicht.nachher.has(id)), dritte);
  await anna.evaluate((ids) => {
    const an = window.ansicht;
    an.ausgewaehlt = new Set(ids.filter((id) => an.nachher.has(id)));
    an.gewaehltesGebaeude = null;
    an.beiAuswahl();
  }, [...meine, ...dritte]);
  await anna.waitForTimeout(1500);
  await phase('mit Auswahl', SEKUNDEN, true);
  await bild('partie-auswahl');
  if (NAH) {
    await phase(`Zoom ${NAH}`, SEKUNDEN, true, NAH);
    await bild('partie-nah');
    await phase(`Zoom ${NAH} noch`, SEKUNDEN, false, NAH);
  }
};
