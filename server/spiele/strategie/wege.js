'use strict';

const { begehbar } = require('./karte');

// A* auf dem Raster, acht Richtungen. Diagonal nur, wenn beide angrenzenden
// Felder frei sind - sonst laufen Einheiten durch Hausecken.
//
// Auf Karten bis 200 × 200 wird viel gesucht (→ karte AC-15, einheiten AC-8).
// Deshalb ohne Objekte je Schritt: der Haufen liegt in zwei Zahlenfeldern, und
// die Puffer fuer Kosten und Herkunft werden von Suche zu Suche
// weiterverwendet. Welche Eintraege zur laufenden Suche gehoeren, sagt eine
// Suchnummer je Feld - so muss nichts neu gefuellt werden.
const DX = [1, -1, 0, 0, 1, 1, -1, -1];
const DY = [0, 0, 1, -1, 1, -1, 1, -1];
const PREIS = [1, 1, 1, 1, Math.SQRT2, Math.SQRT2, Math.SQRT2, Math.SQRT2];

const GRAS = 0;

let flaeche = 0;
let kosten = null;
let woher = null;
let besucht = null; // Suchnummer, in der das Feld Kosten bekam
let erledigt = null; // Suchnummer, in der das Feld fertig wurde
let suche = 0;
let haufenFeld = new Int32Array(1024);
let haufenRang = new Float64Array(1024);

function puffer(g) {
  if (g * g === flaeche) return;
  flaeche = g * g;
  kosten = new Float64Array(flaeche);
  woher = new Int32Array(flaeche);
  besucht = new Uint32Array(flaeche);
  erledigt = new Uint32Array(flaeche);
  suche = 0;
}

function schaetzung(x1, y1, x2, y2) {
  const dx = Math.abs(x1 - x2);
  const dy = Math.abs(y1 - y2);
  return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
}

// Gibt eine Liste von Feldern zurueck, ohne das Startfeld. Leer heisst:
// kein Weg gefunden.
//
// `frei`: Feldnummern, die nur fuer diesen Sucher begehbar sind - die Tore
// seines Besitzers (bauen AC-31). Fuer jeden anderen bleiben sie bebaut.
function suchen(karte, start, ziel, frei = null) {
  const g = karte.groesse;
  const felder = karte.felder;
  const startIndex = start.y * g + start.x;
  const zielIndex = ziel.y * g + ziel.x;
  if (startIndex === zielIndex) return [];
  if (!begehbar(karte, ziel.x, ziel.y) && !(frei && frei.has(zielIndex))) return [];

  puffer(g);
  suche += 1;
  if (suche === 0xffffffff) { // alle vier Milliarden Suchen neu anfangen
    besucht.fill(0);
    erledigt.fill(0);
    suche = 1;
  }

  let laenge = 0;
  const rein = (feld, rang) => {
    if (laenge === haufenFeld.length) {
      const f = new Int32Array(laenge * 2); f.set(haufenFeld); haufenFeld = f;
      const r = new Float64Array(laenge * 2); r.set(haufenRang); haufenRang = r;
    }
    let i = laenge++;
    while (i > 0) {
      const eltern = (i - 1) >> 1;
      if (haufenRang[eltern] <= rang) break;
      haufenFeld[i] = haufenFeld[eltern];
      haufenRang[i] = haufenRang[eltern];
      i = eltern;
    }
    haufenFeld[i] = feld;
    haufenRang[i] = rang;
  };
  const raus = () => {
    const oben = haufenFeld[0];
    laenge -= 1;
    if (laenge > 0) {
      const feld = haufenFeld[laenge];
      const rang = haufenRang[laenge];
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        if (l >= laenge) break;
        const r = l + 1;
        const klein = r < laenge && haufenRang[r] < haufenRang[l] ? r : l;
        if (haufenRang[klein] >= rang) break;
        haufenFeld[i] = haufenFeld[klein];
        haufenRang[i] = haufenRang[klein];
        i = klein;
      }
      haufenFeld[i] = feld;
      haufenRang[i] = rang;
    }
    return oben;
  };

  kosten[startIndex] = 0;
  besucht[startIndex] = suche;
  rein(startIndex, schaetzung(start.x, start.y, ziel.x, ziel.y));
  let gefunden = false;

  while (laenge) {
    const jetzt = raus();
    if (erledigt[jetzt] === suche) continue;
    erledigt[jetzt] = suche;
    if (jetzt === zielIndex) { gefunden = true; break; }

    const x = jetzt % g;
    const y = (jetzt / g) | 0;
    const hier = kosten[jetzt];
    for (let r = 0; r < 8; r++) {
      const nx = x + DX[r];
      const ny = y + DY[r];
      if (nx < 0 || ny < 0 || nx >= g || ny >= g) continue;
      const nachbar = ny * g + nx;
      if (felder[nachbar] !== GRAS && !(frei && frei.has(nachbar))) continue;
      // Diagonal nur, wenn beide Nachbarfelder frei sind.
      if (r >= 4) {
        const seite = y * g + nx;
        const andere = ny * g + x;
        if (felder[seite] !== GRAS && !(frei && frei.has(seite))) continue;
        if (felder[andere] !== GRAS && !(frei && frei.has(andere))) continue;
      }
      const neu = hier + PREIS[r];
      if (besucht[nachbar] === suche && neu >= kosten[nachbar]) continue;
      besucht[nachbar] = suche;
      kosten[nachbar] = neu;
      woher[nachbar] = jetzt;
      rein(nachbar, neu + schaetzung(nx, ny, ziel.x, ziel.y));
    }
  }

  if (!gefunden) return [];
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
  for (let r = 0; r < 8; r++) {
    const nx = feld.x + DX[r];
    const ny = feld.y + DY[r];
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
