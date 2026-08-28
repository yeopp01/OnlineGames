'use strict';

const { begehbar } = require('./karte');

// A* auf dem Raster, acht Richtungen. Diagonal nur, wenn beide angrenzenden
// Felder frei sind - sonst laufen Einheiten durch Hausecken.
const RICHTUNGEN = [
  [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
  [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2],
];

// Kleiner Vorrang-Haufen. Reicht fuer 64 x 64 locker.
class Haufen {
  constructor() { this.liste = []; }
  get laenge() { return this.liste.length; }
  rein(wert, rang) {
    this.liste.push({ wert, rang });
    let i = this.liste.length - 1;
    while (i > 0) {
      const eltern = (i - 1) >> 1;
      if (this.liste[eltern].rang <= this.liste[i].rang) break;
      [this.liste[eltern], this.liste[i]] = [this.liste[i], this.liste[eltern]];
      i = eltern;
    }
  }
  raus() {
    const oben = this.liste[0];
    const letzte = this.liste.pop();
    if (this.liste.length) {
      this.liste[0] = letzte;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = 2 * i + 2;
        let klein = i;
        if (l < this.liste.length && this.liste[l].rang < this.liste[klein].rang) klein = l;
        if (r < this.liste.length && this.liste[r].rang < this.liste[klein].rang) klein = r;
        if (klein === i) break;
        [this.liste[klein], this.liste[i]] = [this.liste[i], this.liste[klein]];
        i = klein;
      }
    }
    return oben.wert;
  }
}

function schaetzung(x1, y1, x2, y2) {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
}

function diagonalErlaubt(karte, x, y, dx, dy) {
  if (dx === 0 || dy === 0) return true;
  return begehbar(karte, x + dx, y) && begehbar(karte, x, y + dy);
}

// Gibt eine Liste von Feldern zurueck, ohne das Startfeld. Leer heisst:
// kein Weg gefunden.
function suchen(karte, start, ziel) {
  const g = karte.groesse;
  const startIndex = start.y * g + start.x;
  const zielIndex = ziel.y * g + ziel.x;
  if (startIndex === zielIndex) return [];
  if (!begehbar(karte, ziel.x, ziel.y)) return [];

  const kosten = new Float32Array(g * g).fill(Infinity);
  const woher = new Int32Array(g * g).fill(-1);
  const fertig = new Uint8Array(g * g);
  const offen = new Haufen();

  kosten[startIndex] = 0;
  offen.rein(startIndex, schaetzung(start.x, start.y, ziel.x, ziel.y));

  while (offen.laenge) {
    const jetzt = offen.raus();
    if (fertig[jetzt]) continue;
    fertig[jetzt] = 1;
    if (jetzt === zielIndex) break;

    const x = jetzt % g;
    const y = (jetzt / g) | 0;
    for (const [dx, dy, preis] of RICHTUNGEN) {
      const nx = x + dx;
      const ny = y + dy;
      if (!begehbar(karte, nx, ny)) continue;
      if (!diagonalErlaubt(karte, x, y, dx, dy)) continue;
      const nachbar = ny * g + nx;
      const neu = kosten[jetzt] + preis;
      if (neu >= kosten[nachbar]) continue;
      kosten[nachbar] = neu;
      woher[nachbar] = jetzt;
      offen.rein(nachbar, neu + schaetzung(nx, ny, ziel.x, ziel.y));
    }
  }

  if (woher[zielIndex] === -1) return [];
  const weg = [];
  let lauf = zielIndex;
  while (lauf !== startIndex) {
    weg.push({ x: lauf % g, y: (lauf / g) | 0 });
    lauf = woher[lauf];
  }
  weg.reverse();
  return weg;
}

// Vorrat steht auf einem Feld, das man nicht betreten kann. Gesucht ist also
// das begehbare Nachbarfeld, das am naechsten am Sammler liegt.
function nachbarfeld(karte, feld, von) {
  let bestes = null;
  let besterAbstand = Infinity;
  for (const [dx, dy] of RICHTUNGEN) {
    const nx = feld.x + dx;
    const ny = feld.y + dy;
    if (!begehbar(karte, nx, ny)) continue;
    const abstand = Math.hypot(nx - von.x, ny - von.y);
    if (abstand < besterAbstand) {
      besterAbstand = abstand;
      bestes = { x: nx, y: ny };
    }
  }
  return bestes;
}

module.exports = { suchen, nachbarfeld };
