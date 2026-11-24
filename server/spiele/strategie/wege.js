// @ts-check
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
let haufenNeben = new Float64Array(1024);

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

  // Gleichstand im Rang entscheidet nicht die Lage im Haufen und nicht die
  // Reihenfolge der Richtungen, sondern die Lage des Feldes zur Linie von
  // Start zu Ziel: erst weiter vorn, dann links davon (kampf AC-26). Beides
  // bleibt gleich, wenn man Start und Ziel um einen Punkt dreht - zwei
  // gespiegelte Heere gehen gespiegelte Wege. Vorher hing an DX und DY, ob
  // ein Weg gleicher Laenge erst gerade oder erst schraeg ging, und die eine
  // Seite des Gefechtsstands kam damit anders an als die andere.
  const vx = ziel.x - start.x;
  const vy = ziel.y - start.y;
  const neben = (x, y) => {
    const rx = x - start.x;
    const ry = y - start.y;
    return -(rx * vx + ry * vy) * 262144 + (rx * vy - ry * vx);
  };
  const vor = (rangA, nebenA, rangB, nebenB) =>
    rangA < rangB || (rangA === rangB && nebenA < nebenB);
  let laenge = 0;
  const rein = (feld, rang, zweit) => {
    if (laenge === haufenFeld.length) {
      const f = new Int32Array(laenge * 2); f.set(haufenFeld); haufenFeld = f;
      const r = new Float64Array(laenge * 2); r.set(haufenRang); haufenRang = r;
      const n = new Float64Array(laenge * 2); n.set(haufenNeben); haufenNeben = n;
    }
    let i = laenge++;
    while (i > 0) {
      const eltern = (i - 1) >> 1;
      if (!vor(rang, zweit, haufenRang[eltern], haufenNeben[eltern])) break;
      haufenFeld[i] = haufenFeld[eltern];
      haufenRang[i] = haufenRang[eltern];
      haufenNeben[i] = haufenNeben[eltern];
      i = eltern;
    }
    haufenFeld[i] = feld;
    haufenRang[i] = rang;
    haufenNeben[i] = zweit;
  };
  const raus = () => {
    const oben = haufenFeld[0];
    laenge -= 1;
    if (laenge > 0) {
      const feld = haufenFeld[laenge];
      const rang = haufenRang[laenge];
      const zweit = haufenNeben[laenge];
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        if (l >= laenge) break;
        const r = l + 1;
        const klein = r < laenge && vor(haufenRang[r], haufenNeben[r], haufenRang[l], haufenNeben[l]) ? r : l;
        if (!vor(haufenRang[klein], haufenNeben[klein], rang, zweit)) break;
        haufenFeld[i] = haufenFeld[klein];
        haufenRang[i] = haufenRang[klein];
        haufenNeben[i] = haufenNeben[klein];
        i = klein;
      }
      haufenFeld[i] = feld;
      haufenRang[i] = rang;
      haufenNeben[i] = zweit;
    }
    return oben;
  };

  kosten[startIndex] = 0;
  besucht[startIndex] = suche;
  rein(startIndex, schaetzung(start.x, start.y, ziel.x, ziel.y), 0);
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
      rein(nachbar, neu + schaetzung(nx, ny, ziel.x, ziel.y), neben(nx, ny));
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

// Alle Felder, die von `start` aus zu Fuss erreichbar sind: 1 im Ergebnis.
// Geflutet wird in vier Richtungen - was so erreichbar ist, findet auch
// `suchen` mit seinen acht. Das Feld gehoert dem Aufrufer nur bis zum
// naechsten Aufruf: der Puffer wird wiederverwendet.
let flutFeld = new Uint8Array(0);
let flutReihe = new Int32Array(0);
function erreichbar(karte, start, frei = null) {
  const g = karte.groesse;
  if (flutFeld.length !== g * g) {
    flutFeld = new Uint8Array(g * g);
    flutReihe = new Int32Array(g * g);
  } else {
    flutFeld.fill(0);
  }
  const felder = karte.felder;
  let kopf = 0;
  let ende = 0;
  const s = start.y * g + start.x;
  flutFeld[s] = 1;
  flutReihe[ende++] = s;
  while (kopf < ende) {
    const i = flutReihe[kopf++];
    const x = i % g;
    const y = (i / g) | 0;
    for (let r = 0; r < 4; r++) {
      const nx = x + DX[r];
      const ny = y + DY[r];
      if (nx < 0 || ny < 0 || nx >= g || ny >= g) continue;
      const n = ny * g + nx;
      if (flutFeld[n] || (felder[n] !== GRAS && !(frei && frei.has(n)))) continue;
      flutFeld[n] = 1;
      flutReihe[ende++] = n;
    }
  }
  return flutFeld;
}

// Vorrat steht auf einem Feld, das man nicht betreten kann. Gesucht ist also
// das begehbare Nachbarfeld, das am naechsten am Sammler liegt. Zwei gleich
// nahe entscheidet die Seite der Linie vom Sammler zum Feld, nicht die
// Reihenfolge von DX und DY (kampf AC-26).
function nachbarfeld(karte, feld, von) {
  let bestes = null;
  let besterAbstand = Infinity;
  let besteSeite = 0;
  const lx = feld.x - von.x;
  const ly = feld.y - von.y;
  for (let r = 0; r < 8; r++) {
    const nx = feld.x + DX[r];
    const ny = feld.y + DY[r];
    if (!begehbar(karte, nx, ny)) continue;
    const abstand = Math.hypot(nx - von.x, ny - von.y);
    const seite = (nx - von.x) * ly - (ny - von.y) * lx;
    if (abstand < besterAbstand - 1e-9 || (abstand <= besterAbstand + 1e-9 && seite < besteSeite)) {
      besterAbstand = Math.min(abstand, besterAbstand);
      besteSeite = seite;
      bestes = { x: nx, y: ny };
    }
  }
  return bestes;
}

// Die acht Nachbarn eines Feldes als Versatz, gerade zuerst.
const NACHBARN = DX.map((dx, r) => [dx, DY[r]]);

module.exports = { suchen, nachbarfeld, erreichbar, NACHBARN };
