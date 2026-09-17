// Die Schautafel (→ specs/10-strategie/darstellung.md AC-6, AC-9): jede Figur
// der aktuellen Stufe nebeneinander, gross und in Spielgroesse, in zwei
// Spielerfarben. Sie ist Bildnachweis und Pruefstueck zugleich - der
// Browserlauf liest `window.schautafel`.
import { FIGUREN, figurZeichnen } from './figuren.js';

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
];

const leinwand = document.getElementById('tafel');
const stift = leinwand.getContext('2d');
const dichte = window.devicePixelRatio || 1;
const BREITE = 1100;
const HOEHE = 500;
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

window.schautafel = { zellen, maske, arten: Object.keys(FIGUREN) };
