#!/usr/bin/env node
// Eine Seite ansehen, ohne einen Testlauf: Server im Prozess starten, Seite
// im Browser oeffnen, Bild in den Temp-Ordner schreiben, Pfad ausgeben.
//
//   npm run sicht -- schautafel.html
//   npm run sicht -- schautafel.html --breite 1600 --hoehe 900 --name tafel
//   npm run sicht -- --spiel --zoom 2 --ziel wald --warten 5
//   npm run sicht -- --spiel --zoom 1 --messen   (Zeichenzeit je Bild)
//   npm run sicht -- --spiel --waehlen speerkaempfer   (Einheit anlegen und
//       anwaehlen - fuer die Auswahlleiste, die ohne Auswahl nicht da ist)
//
// Fuer das schnelle Hinsehen beim Zeichnen (Rueckschau nach Runde 10). Die
// Bilder sind Wegwerfbilder und gehoeren nicht ins Repository - belegt wird
// weiter mit nachweis() im Browserlauf (ADR-0011).
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { starten } = require('../server/index.js');

const argumente = process.argv.slice(2);
const wert = (name, vorgabe) => {
  const i = argumente.indexOf(`--${name}`);
  return i >= 0 ? argumente[i + 1] : vorgabe;
};
// Die Seite ist das erste Argument, das kein Schalter und kein Schalterwert
// ist - mit oder ohne fuehrenden Schraegstrich. Ohne ist sicherer: die
// Git-Bash unter Windows macht aus `/seite.html` still einen Dateipfad.
const schalterwerte = new Set(argumente.flatMap((a, i) => (a.startsWith('--') ? [i + 1] : [])));
const roh = argumente.find((a, i) => !a.startsWith('--') && !schalterwerte.has(i)) || '';
const seite = `/${roh.replace(/\\/g, '/').replace(/^.*?\/Git\//i, '').replace(/^\/+/, '')}`;
const breite = Number(wert('breite', 1400));
const hoehe = Number(wert('hoehe', 950));
const name = wert('name', argumente.includes('--spiel') ? 'spiel' : seite.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'start');
const HAFEN = Number(wert('hafen', 4296));

const ordner = join(tmpdir(), 'onlinegames-sicht');
mkdirSync(ordner, { recursive: true });
const ziel = join(ordner, `${name}.png`);

const laufend = await starten(HAFEN, { konten: { datei: ':memory:', geheimnis: 's'.repeat(48) } });
const browser = await chromium.launch();
const fehler = [];
const beobachten = (blatt) => {
  blatt.on('pageerror', (e) => fehler.push(e.message));
  blatt.on('console', (m) => { if (m.type() === 'error') fehler.push(m.text()); });
};

// --spiel: eine laufende Partie zu zweit, fotografiert aus Annas Fenster.
//   --startwert 4711   dieselbe Karte wie im Browserlauf
//   --zoom 2           Vergroesserung
//   --ziel basis|wald|gold|stein|beere|wasser   wohin die Kamera schaut
//   --warten 5         Sekunden, die das Spiel vorher laeuft
async function spielbild() {
  const base = `http://localhost:${HAFEN}`;
  // Ein Konto wie in tests/hilfe.mjs: Einladungscode, Registrieren, Keks behalten.
  const antwort = await fetch(`${base}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base },
    body: JSON.stringify({ email: 'anna@sicht.test', password: 'einLangesKennwort', name: 'Anna', einladung: laufend.zugang.einladungen.anlegen('sicht') }),
  });
  const kekse = (antwort.headers.getSetCookie?.() || []).map((k) => {
    const [paar] = k.split(';');
    const [kname, ...rest] = paar.split('=');
    return { name: kname, value: rest.join('='), domain: 'localhost', path: '/' };
  });
  const annasFenster = await browser.newContext({ viewport: { width: breite, height: hoehe } });
  await annasFenster.addCookies(kekse);
  const anna = await annasFenster.newPage();
  const bert = await (await browser.newContext({ viewport: { width: breite, height: hoehe } })).newPage();
  beobachten(anna);
  beobachten(bert);

  await anna.goto(base);
  await anna.locator('[data-oeffnen="strategie"]').click();
  await anna.locator('[data-einstellung="startwert"]').fill(String(wert('startwert', '4711')));
  await anna.locator('[data-eroeffnen="strategie"]').click();
  await anna.locator('#raumcode').filter({ hasText: /^[A-Z0-9]{3}-[A-Z0-9]{3}$/ }).waitFor();
  const code = (await anna.locator('#raumcode').textContent()).trim();
  await bert.goto(base);
  await bert.locator('#name').fill('Bert');
  await bert.locator('#code').fill(code);
  await bert.locator('#beitreten').click();
  await anna.locator('#spielerliste li').nth(1).waitFor();
  await anna.locator('#starten').click();
  await anna.waitForFunction(() => window.ansicht && window.ansicht.nachher.size > 0);
  await anna.waitForTimeout(Number(wert('warten', 1)) * 1000);

  // --waehlen <art>: eine Einheit dieser Art neben der Basis anlegen und
  // anwaehlen. Ohne Auswahl ist die Leiste unten gar nicht da, und genau sie
  // will man ansehen, wenn man an ihr baut (bedienung AC-35).
  const waehlen = wert('waehlen', null);
  // --zeitalter 1: Anna steht in der Feudalzeit. Dann hat ihr Baumenue alle
  // neun Knoepfe - der breiteste Zustand der Leiste, an dem sich zeigt, ob
  // etwas unter die Uebersichtskarte rutscht.
  const stufe = Number(wert('zeitalter', 0));
  if (stufe > 0) {
    const welt = laufend.raeume.finden(code)?.welt;
    welt.spieler.find((sp) => sp.name === 'Anna').zeitalter = stufe;
  }
  if (waehlen) {
    // Mehrere Arten durch Komma: "--waehlen dorfbewohner,miliz,bogenschuetze"
    // stellt sie nebeneinander - so sieht man bei Zoom 1, ob man sie
    // auseinanderhalten kann (bedienung AC-36).
    const arten = waehlen.split(',').map((a) => a.trim()).filter(Boolean);
    const welt = laufend.raeume.finden(code)?.welt;
    const spieler = welt.spieler.find((sp) => sp.name === 'Anna');
    const belegt = new Set([...welt.einheiten.values()].map((e) => `${Math.round(e.x)},${Math.round(e.y)}`));
    const angelegt = [];
    // In einer Reihe mit zwei Feldern Abstand, acht Felder vor der Basis -
    // so verdeckt keine die andere und nichts steht hinter dem Dorfzentrum.
    arten.forEach((art, i) => {
      let einheit = null;
      for (let versatz = 0; versatz < 12 && !einheit; versatz++) {
        const x = spieler.basis.x - arten.length + i * 2;
        const y = spieler.basis.y + 8 + versatz;
        if (belegt.has(`${x},${y}`) || welt.karte.felder[y * welt.karte.groesse + x] !== 0 || welt.gebaeudeAn(x, y)) continue;
        belegt.add(`${x},${y}`);
        einheit = welt.einheitAnlegen(spieler.id, x, y, art);
      }
      if (!einheit) throw new Error(`kein Platz fuer ${art}`);
      angelegt.push(einheit.id);
    });
    await anna.waitForFunction((ids) => ids.every((id) => window.ansicht.nachher.has(id)), angelegt);
    await anna.evaluate((ids) => {
      const a = window.ansicht;
      a.ausgewaehlt = new Set([ids[0]]);
      a.gewaehltesGebaeude = null;
      a.beiAuswahl();
      a.blickAuf(a.nachher.get(ids[Math.floor(ids.length / 2)]).x, a.nachher.get(ids[0]).y);
    }, angelegt);
  }

  await anna.evaluate(({ zoom, ziel: art }) => {
    const a = window.ansicht;
    const g = a.karte.groesse;
    const basis = a.spieler.get(a.ich).basis;
    const arten = { wald: 1, beere: 2, wasser: 3, gold: 4, stein: 5 };
    let blick = basis;
    // --ziel auswahl: auf die Einheiten aus --waehlen schauen.
    if (art === 'auswahl' && a.ausgewaehlt.size) {
      const meine = [...a.nachher.values()].filter((e) => e.b === a.ich);
      const neu = meine.slice(-6);
      blick = { x: neu.reduce((m, e) => m + e.x, 0) / neu.length, y: neu.reduce((m, e) => m + e.y, 0) / neu.length };
    } else if (arten[art] !== undefined) {
      let bester = Infinity;
      for (let i = 0; i < a.karte.felder.length; i++) {
        if (a.karte.felder[i] !== arten[art]) continue;
        const x = i % g;
        const y = (i / g) | 0;
        const d = Math.hypot(x - basis.x, y - basis.y);
        if (d < bester) { bester = d; blick = { x, y }; }
      }
    }
    a.kamera.zoom = zoom;
    a.blickAuf(blick.x, blick.y);
  }, { zoom: Number(wert('zoom', 1)), ziel: wert('ziel', 'basis') });
  await anna.waitForTimeout(300);
  // --messen: wie lange ein Bild im Mittel braucht, ueber 40 Bilder
  // (Rueckschau-Werkzeug, Runde 29: detaillierte Zeichnung kostet Zeit).
  if (argumente.includes('--messen')) {
    const ms = await anna.evaluate(() => {
      const a = window.ansicht;
      a.zeichnen(performance.now());
      const start = performance.now();
      for (let i = 0; i < 40; i++) a.zeichnen(performance.now());
      return ((performance.now() - start) / 40).toFixed(1);
    });
    console.log(`Zeichnen je Bild: ${ms} ms (Zoom ${wert('zoom', 1)})`);
  }
  await anna.screenshot({ path: ziel });
}

try {
  if (argumente.includes('--spiel')) {
    await spielbild();
  } else {
    // --ausschnitt x,y,b,h schneidet ein Stueck heraus und zeichnet es mit
    // --lupe <faktor> vergroessert. Dafuer gibt es einen Grund: ein Blick auf
    // die ganze Schautafel zeigt jede Figur 92 Bildpunkte breit - zu wenig,
    // um zu beurteilen, ob eine Hand am Griff sitzt.
    const lupe = Number(wert('lupe', 1));
    const roh = wert('ausschnitt', null);
    const blatt = await browser.newPage({
      viewport: { width: breite, height: hoehe },
      deviceScaleFactor: lupe,
    });
    beobachten(blatt);
    await blatt.goto(`http://localhost:${HAFEN}${seite}`, { waitUntil: 'networkidle' });
    if (roh) {
      const [x, y, b, h] = roh.split(',').map(Number);
      await blatt.screenshot({ path: ziel, clip: { x, y, width: b, height: h } });
    } else {
      await blatt.screenshot({ path: ziel });
    }
  }
  console.log(ziel);
  if (fehler.length) console.log(`Die Seite hat Fehler gemeldet:\n  ${fehler.join('\n  ')}`);
} finally {
  await browser.close();
  laufend.wss.close();
  laufend.server.closeAllConnections();
  laufend.server.close();
  laufend.raeume.halt();
  laufend.schutz.halt();
  laufend.manager?.halt();
  laufend.zugang.schliessen();
}
process.exit(fehler.length ? 1 : 0);
