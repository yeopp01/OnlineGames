// Die Schautafel (→ specs/10-strategie/darstellung.md AC-6, AC-9): jede Figur
// der aktuellen Stufe nebeneinander, gross und in Spielgroesse, in zwei
// Spielerfarben. Sie ist Bildnachweis und Pruefstueck zugleich - der
// Browserlauf liest `window.schautafel`.
import { FIGUREN, figurZeichnen } from './figuren.js';
import { GEBAEUDE, gebaeudeZeichnen } from './gebaeude.js';
import { bodenAn } from './boden.js';
import {
  BEERE, GOLD, GRAS as BODEN_GRAS, STEIN, WALD, WASSER, dingZeichnen, gewaesserZeichnen, raute, wellenZeichnen,
} from './gelaende.js';

const FARBEN = ['#4a90d9', '#d94a4a'];
const GRAS = '#2f4636';

const EINTRAEGE = [
  { art: 'dorfbewohner', titel: 'Dorfbewohner', lage: {} },
  { art: 'dorfbewohner', titel: 'traegt Holz', lage: { ladung: 'h' } },
  { art: 'dorfbewohner', titel: 'traegt Nahrung', lage: { ladung: 'n' } },
  { art: 'dorfbewohner', titel: 'traegt Gold', lage: { ladung: 'g' } },
  { art: 'miliz', titel: 'Miliz', lage: {} },
  { art: 'spaeherreiter', titel: 'Spaeherreiter', lage: {} },
  { art: 'schaf', titel: 'Schaf', lage: {} },
  { art: 'schaf', titel: 'Kadaver, halb', lage: { liegt: true, rest: 0.5 } },
];

const leinwand = document.getElementById('tafel');
const stift = leinwand.getContext('2d');
const dichte = window.devicePixelRatio || 1;
const BREITE = 1100;
const HOEHE = 1180;
leinwand.width = BREITE * dichte;
leinwand.height = HOEHE * dichte;
stift.scale(dichte, dichte);

stift.fillStyle = '#1d222a';
stift.fillRect(0, 0, BREITE, HOEHE);

const spalte = BREITE / EINTRAEGE.length;
const zellen = [];

FARBEN.forEach((farbe, reihe) => {
  const oben = 20 + reihe * 250;
  EINTRAEGE.forEach((eintrag, i) => {
    const x = i * spalte;
    stift.fillStyle = GRAS;
    stift.fillRect(x + 8, oben, spalte - 16, 200);
    // Gross ...
    const fussX = x + spalte / 2 - (eintrag.art === 'spaeherreiter' ? 10 : 0);
    figurZeichnen(stift, eintrag.art, fussX, oben + 150, 120, farbe, { blick: 1, ...eintrag.lage });
    // ... und in Spielgroesse daneben, wie bei Zoom 1.
    figurZeichnen(stift, eintrag.art, x + spalte - 34, oben + 185, 24, farbe, { blick: 1, ...eintrag.lage });
    stift.fillStyle = '#e6e9ee';
    stift.font = '600 14px system-ui, sans-serif';
    stift.textAlign = 'center';
    stift.fillText(eintrag.titel, x + spalte / 2, oben + 222);
    zellen.push({ art: eintrag.art, titel: eintrag.titel, farbe, x: x + 8, y: oben, breite: spalte - 16, hoehe: 200 });
  });
});

// ---- Gelaende und Vorraete (darstellung AC-2, AC-3) -----------------------
// Je ein kleines Stueck Karte als Raute: voll, halb leer, und in Spielgroesse.

const DINGE = [
  { art: WALD, titel: 'Wald' },
  { art: BEERE, titel: 'Beerenstrauch' },
  { art: GOLD, titel: 'Gold' },
  { art: STEIN, titel: 'Stein' },
  { art: WASSER, titel: 'Wasser am Ufer' },
];

function flecken(mitteX, mitteY, e, art, fuellung) {
  // Ein 3 x 3-Stueck Boden, hinten beginnend, dann die Dinge nach Tiefe.
  const felder = [];
  for (let gy = 0; gy < 3; gy++) {
    for (let gx = 0; gx < 3; gx++) felder.push({ gx, gy });
  }
  felder.sort((a, b) => a.gx + a.gy - (b.gx + b.gy));
  for (const { gx, gy } of felder) {
    const x = mitteX + (gx - gy) * e;
    const y = mitteY + (gx + gy - 2) * e * 0.5;
    const hier = art === WALD ? WALD : BODEN_GRAS;
    raute(stift, x, y, e, e * 0.5);
    const farbe = bodenAn(gx * 2.3, gy * 2.3, hier, 4711);
    stift.fillStyle = `rgb(${farbe[0] | 0}, ${farbe[1] | 0}, ${farbe[2] | 0})`;
    stift.fill();
  }
  if (art === WASSER) {
    // Wie im Spiel: die Wasserfelder als weiche Flaeche mit Sandufer.
    const mitten = felder
      .filter(({ gx, gy }) => gx + gy >= 2)
      .map(({ gx, gy }) => ({ x: mitteX + (gx - gy) * e, y: mitteY + (gx + gy - 2) * e * 0.5, index: gx * 7 + gy * 13 }));
    gewaesserZeichnen(stift, mitten, e);
    for (const p of mitten) wellenZeichnen(stift, p.x, p.y, e, p.index);
    return;
  }
  for (const { gx, gy } of felder) {
    const mitte = gx === 1 && gy === 1;
    if (art !== WALD && !mitte) continue;
    const x = mitteX + (gx - gy) * e;
    const y = mitteY + (gx + gy - 2) * e * 0.5;
    dingZeichnen(stift, art, x, y, e, gx * 7 + gy * 13, fuellung);
  }
}

const gelaendeOben = 520;
stift.fillStyle = '#e6e9ee';
stift.font = '600 15px system-ui, sans-serif';
stift.textAlign = 'left';
stift.fillText('Gelaende und Vorraete - voll, fast leer, in Spielgroesse', 12, gelaendeOben - 6);
const dingSpalte = BREITE / DINGE.length;
DINGE.forEach((ding, i) => {
  const x = i * dingSpalte;
  stift.fillStyle = '#26303a';
  stift.fillRect(x + 8, gelaendeOben + 6, dingSpalte - 16, 230);
  // Gross links, fast leer rechts, in Spielgroesse unten - alles in der Zelle.
  flecken(x + dingSpalte * 0.36, gelaendeOben + 100, 30, ding.art, 1);
  flecken(x + dingSpalte * 0.78, gelaendeOben + 100, 16, ding.art, 0.25);
  flecken(x + dingSpalte * 0.5, gelaendeOben + 190, 22, ding.art, 1);
  stift.fillStyle = '#e6e9ee';
  stift.font = '600 14px system-ui, sans-serif';
  stift.textAlign = 'center';
  stift.fillText(ding.titel, x + dingSpalte / 2, gelaendeOben + 232);
});

// ---- Gebaeude und Baustellen (darstellung AC-4, AC-5) -----------------------
// Jedes Gebaeude der Stufe gross in beiden Spielerfarben, dazu die Baustelle
// in drei Staenden und alles noch einmal in Spielgroesse (Zoom 1).

const GEBAEUDE_REIHE = [
  { art: 'dorfzentrum', groesse: 4, titel: 'Dorfzentrum' },
  { art: 'haus', groesse: 2, titel: 'Haus' },
  { art: 'muehle', groesse: 2, titel: 'Muehle' },
  { art: 'holzfaellerlager', groesse: 2, titel: 'Holzfaellerlager' },
  { art: 'bergbaulager', groesse: 2, titel: 'Bergbaulager' },
  { art: 'kaserne', groesse: 3, titel: 'Kaserne' },
  { art: 'farm', groesse: 3, titel: 'Farm' },
  { art: 'haus', groesse: 2, titel: 'Baustelle 20 %', bau: 0.2 },
  { art: 'haus', groesse: 2, titel: 'Baustelle 70 %', bau: 0.7 },
];
const gebaeudeOben = 790;
stift.fillStyle = '#e6e9ee';
stift.font = '600 15px system-ui, sans-serif';
stift.textAlign = 'left';
stift.fillText('Gebaeude und Baustellen - in Spielgroesse (Zoom 1), das Dorfzentrum halb so gross, in zwei Spielerfarben', 12, gebaeudeOben - 6);
const gebaeudeSpalte = BREITE / GEBAEUDE_REIHE.length;
const gebaeudeZellen = [];
FARBEN.forEach((farbe, reihe) => {
  const oben = gebaeudeOben + 6 + reihe * 190;
  GEBAEUDE_REIHE.forEach((eintrag, i) => {
    const x = i * gebaeudeSpalte;
    stift.fillStyle = GRAS;
    stift.fillRect(x + 6, oben, gebaeudeSpalte - 12, 170);
    // In Spielgroesse (e = 22 wie bei Zoom 1); das Dorfzentrum halb so gross, sonst passt es nicht.
    const e = eintrag.groesse === 4 ? 11 : eintrag.groesse === 3 ? 15 : 22;
    gebaeudeZeichnen(stift, eintrag.art, x + gebaeudeSpalte / 2 - 8, oben + 120, e, farbe, eintrag.groesse, eintrag.bau ?? 1);
    if (reihe === 1) {
      stift.fillStyle = '#e6e9ee';
      stift.font = '600 13px system-ui, sans-serif';
      stift.textAlign = 'center';
      stift.fillText(eintrag.titel, x + gebaeudeSpalte / 2, oben + 164);
    }
    gebaeudeZellen.push({ art: eintrag.art, bau: eintrag.bau ?? 1, farbe, x: x + 6, y: oben, breite: gebaeudeSpalte - 12, hoehe: 170 });
  });
});

/**
 * Fuer den Browserlauf (darstellung AC-4): ein Gebaeude allein auf
 * durchsichtigem Grund - welche Bildpunkte es belegt und wie viele die
 * Spielerfarbe tragen.
 */
function gebaeudeMaske(art, farbe, bau = 1) {
  const groesse = 140;
  const blatt = document.createElement('canvas');
  blatt.width = groesse;
  blatt.height = groesse;
  const s = blatt.getContext('2d');
  gebaeudeZeichnen(s, art, groesse / 2, groesse * 0.72, 20, farbe, 2, bau);
  const { data } = s.getImageData(0, 0, groesse, groesse);
  const r = parseInt(farbe.slice(1, 3), 16);
  const g = parseInt(farbe.slice(3, 5), 16);
  const b = parseInt(farbe.slice(5, 7), 16);
  const belegt = [];
  const farben = [];
  let farbpixel = 0;
  let hoechster = groesse;
  for (let i = 0; i < data.length; i += 4) {
    const voll = data[i + 3] > 200;
    belegt.push(voll ? 1 : 0);
    farben.push(voll ? [data[i], data[i + 1], data[i + 2]] : null);
    if (voll) hoechster = Math.min(hoechster, Math.floor(i / 4 / groesse));
    if (voll && Math.abs(data[i] - r) < 30 && Math.abs(data[i + 1] - g) < 30 && Math.abs(data[i + 2] - b) < 30) farbpixel += 1;
  }
  return { belegt, farben, pixel: belegt.reduce((a, v) => a + v, 0), farbpixel, oben: hoechster };
}

/**
 * Fuer den Browserlauf: ein Vorrat allein auf durchsichtigem Grund, mit dem
 * Anteil der Bildpunkte in einer Farbfamilie (gelb, rot, grau, gruen).
 */
function dingMaske(art, fuellung = 1) {
  const groesse = 120;
  const blatt = document.createElement('canvas');
  blatt.width = groesse;
  blatt.height = groesse;
  const s = blatt.getContext('2d');
  dingZeichnen(s, art, groesse / 2, groesse * 0.8, 48, 17, fuellung);
  const { data } = s.getImageData(0, 0, groesse, groesse);
  const zaehler = { pixel: 0, gelb: 0, rot: 0, grau: 0, gruen: 0 };
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 200) continue;
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    zaehler.pixel += 1;
    if (r > 150 && g > 110 && b < 120 && r - b > 80) zaehler.gelb += 1;
    else if (r > 150 && g < 90 && b < 110) zaehler.rot += 1;
    else if (Math.abs(r - g) < 14 && Math.abs(g - b) < 14 && r > 80) zaehler.grau += 1;
    else if (g > r + 15 && g > b + 5) zaehler.gruen += 1;
  }
  return zaehler;
}

/**
 * Fuer den Browserlauf: eine Figur allein auf durchsichtigem Grund zeichnen und
 * zurueckgeben, welche Bildpunkte sie belegt und wie viele davon die
 * Spielerfarbe tragen.
 */
function maske(art, farbe, lage = {}) {
  const groesse = 96;
  const blatt = document.createElement('canvas');
  blatt.width = groesse;
  blatt.height = groesse;
  const s = blatt.getContext('2d');
  figurZeichnen(s, art, groesse / 2, groesse - 10, 72, farbe, { blick: 1, ...lage });
  const { data } = s.getImageData(0, 0, groesse, groesse);
  const r = parseInt(farbe.slice(1, 3), 16);
  const g = parseInt(farbe.slice(3, 5), 16);
  const b = parseInt(farbe.slice(5, 7), 16);
  const belegt = [];
  const farben = [];
  let farbpixel = 0;
  for (let i = 0; i < data.length; i += 4) {
    // Der Schatten ist halb durchsichtig und gehoert nicht zur Gestalt.
    const voll = data[i + 3] > 200;
    belegt.push(voll ? 1 : 0);
    farben.push(voll ? [data[i], data[i + 1], data[i + 2]] : null);
    if (voll && Math.abs(data[i] - r) < 40 && Math.abs(data[i + 1] - g) < 40 && Math.abs(data[i + 2] - b) < 40) farbpixel += 1;
  }
  return { belegt, farben, pixel: belegt.reduce((a, v) => a + v, 0), farbpixel };
}

/**
 * Fuer den Browserlauf (darstellung AC-2): wie viele Toenungen das Gras hat,
 * wie verschieden zwei Startwerte es toenen, und ob am Ufer Sand liegt.
 */
function bodenProbe() {
  const toene = new Set();
  let verschieden = 0;
  // Der Boden, wie ihn das Spielbild zeichnet (public/boden.js, darstellung AC-13).
  for (let i = 0; i < 1000; i++) {
    const x = (i % 40) * 1.7;
    const y = Math.floor(i / 40) * 1.7;
    const a = bodenAn(x, y, BODEN_GRAS, 4711);
    const b = bodenAn(x, y, BODEN_GRAS, 1234);
    toene.add(a.map((k) => Math.round(k) >> 3).join(','));
    if (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > 6) verschieden += 1;
  }
  const blatt = document.createElement('canvas');
  blatt.width = 80;
  blatt.height = 50;
  const s = blatt.getContext('2d');
  gewaesserZeichnen(s, [{ x: 40, y: 25 }], 22);
  const { data } = s.getImageData(0, 0, 80, 50);
  let sand = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 200 && data[i] > 150 && data[i + 1] > 140 && data[i + 2] < 140) sand += 1;
  }
  return { toene: toene.size, verschieden: verschieden / 1000, sand };
}

/**
 * Fuer den Browserlauf (darstellung AC-12): wie viele deutlich verschiedene
 * Farbtoene eine Zeichnung hat - Kanaele auf 16 Stufen gerundet, gezaehlt nur
 * Toene mit mindestens einem Hundertstel der Flaeche. Flach gezeichnet ist das
 * etwa eine Stufe je Flaeche, schattiert ein Mehrfaches.
 */
function tonstufen(welche, art) {
  const g = 160;
  const blatt = document.createElement('canvas');
  blatt.width = g;
  blatt.height = g;
  const s = blatt.getContext('2d');
  if (welche === 'figur') figurZeichnen(s, art, g / 2, g - 10, 130, '#4a90d9', {});
  else if (welche === 'gebaeude') gebaeudeZeichnen(s, art, g / 2, g * 0.72, 22, '#4a90d9', 2);
  else dingZeichnen(s, art, g / 2, g * 0.8, 50, 17, 1);
  const { data } = s.getImageData(0, 0, g, g);
  const zaehler = new Map();
  let pixel = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 250) continue;
    pixel += 1;
    const k = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    zaehler.set(k, (zaehler.get(k) || 0) + 1);
  }
  let deutlich = 0;
  for (const n of zaehler.values()) if (n >= pixel * 0.01) deutlich += 1;
  return deutlich;
}

/**
 * Fuer den Browserlauf (darstellung AC-13): wie comichaft eine Zeichnung ist.
 * `schwarz` ist der Anteil fast schwarzer Bildpunkte (kein Kanal ueber 50) -
 * das sind vor allem Umrisse; `saettigung` die mittlere Saettigung (HSL, 0..1).
 * Gezeichnet in Spielgroesse, gezaehlt nur deckende Punkte - der
 * Schlagschatten ist halb durchsichtig und zaehlt nicht.
 */
const GEBAEUDE_GROESSE = { dorfzentrum: 4, haus: 2, muehle: 2, holzfaellerlager: 2, bergbaulager: 2, kaserne: 3, farm: 3 };

function anmutung(welche, art) {
  const g = 260;
  const blatt = document.createElement('canvas');
  blatt.width = g;
  blatt.height = g;
  const s = blatt.getContext('2d');
  if (welche === 'figur') figurZeichnen(s, art, g / 2, g - 20, 40, '#4a90d9', {});
  else gebaeudeZeichnen(s, art, g / 2, g * 0.72, 22, '#4a90d9', GEBAEUDE_GROESSE[art] ?? 2);
  const { data } = s.getImageData(0, 0, g, g);
  let pixel = 0;
  let schwarz = 0;
  let saettigung = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 250) continue;
    const r = data[i] / 255;
    const gr = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    pixel += 1;
    const hoch = Math.max(r, gr, b);
    const tief = Math.min(r, gr, b);
    if (hoch * 255 <= 50) schwarz += 1;
    const l = (hoch + tief) / 2;
    if (hoch > tief) saettigung += (hoch - tief) / (1 - Math.abs(2 * l - 1));
  }
  return { pixel, schwarz: schwarz / pixel, saettigung: saettigung / pixel };
}

window.schautafel = {
  zellen, maske, dingMaske, bodenProbe, arten: Object.keys(FIGUREN), dinge: { WALD, BEERE, GOLD, STEIN },
  gebaeudeZellen, gebaeudeMaske, gebaeudeArten: Object.keys(GEBAEUDE), tonstufen, anmutung,
};
