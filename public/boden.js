// Der Boden als durchgehende Textur (→ specs/10-strategie/darstellung.md AC-13).
//
// Nicht Raute fuer Raute in einer Farbe - das zeigte ein Raster wie ein
// Schachbrett -, sondern Farben aus einem glatten Rauschen ueber die ganze
// Karte: Gras in erdigen Toenen, trockene Stellen, Erdflecken, die ueber
// Feldgrenzen hinweglaufen, dazu Sprenkel. Jedes Feld wird in seiner Farbe
// gefuellt und mit einem weichen Fleck in dieselbe Farbe ueberdeckt, der in die
// Nachbarn hineinreicht; so verschwimmen die Grenzen.
//
// Das kostet je Feld viele Striche. Deshalb wird der Boden in Kacheln von
// KACHEL x KACHEL Bildpunkten (bei Zoom 1) einmal gezeichnet und danach nur
// kopiert. Ein geaendertes Feld (Baum gefaellt, Gebaeude gebaut) verwirft die
// Kacheln darum herum.
//
// Wasser gehoert seit Runde 39 auch in die Textur (AC-13): aus dem Anteil der
// Wasserfelder um eine Stelle (bilinear zwischen den Feldmitten) wird ein
// weiches Ufer - Schlamm und Sand, flaches, dann tiefes Wasser -, statt
// Ellipsen mit Bogenrand, die wie eine Wolke aussahen.

const WALD = 1;
const WASSER = 3;
const BEBAUT = 6;

export const KACHEL = 528;

function hash2(x, y, salz) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(salz, 144665)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const glatt = (t) => t * t * (3 - 2 * t);

function rauschen(x, y, salz) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = glatt(x - xi);
  const yf = glatt(y - yi);
  const a = hash2(xi, yi, salz);
  const b = hash2(xi + 1, yi, salz);
  const c = hash2(xi, yi + 1, salz);
  const d = hash2(xi + 1, yi + 1, salz);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}

function wolken(x, y, salz) {
  return rauschen(x, y, salz) * 0.6 + rauschen(x * 2.3, y * 2.3, salz + 1) * 0.3 + rauschen(x * 5.1, y * 5.1, salz + 2) * 0.1;
}

const mische = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const klemme = (t) => Math.max(0, Math.min(1, t));
const rgb = ([r, g, b], a = 1) => (a === 1 ? `rgb(${r | 0}, ${g | 0}, ${b | 0})` : `rgba(${r | 0}, ${g | 0}, ${b | 0}, ${a})`);

// Erdige Farben, gemessen am Eindruck des Genres: Oliv statt Gruen, Braun statt Grau.
const GRAS_DUNKEL = [66, 88, 40];
const GRAS_HELL = [112, 126, 58];
const GRAS_TROCKEN = [138, 132, 74];
const ERDE = [124, 98, 64];
const ERDE_HELL = [150, 124, 84];
const WALDBODEN = [50, 60, 32];
const SAND = [186, 170, 124];
const SCHLAMM = [104, 92, 62];
const FLACH = [66, 98, 98];
const TIEF = [36, 62, 78];

const stufe = (a, b, t) => glatt(klemme((t - a) / (b - a)));

/**
 * Anteil Wasser an einer Stelle: 0 an Land, 1 mitten im See, um 0,5 am Ufer.
 * Ueber eine Nachbarschaft gemittelt, sonst zeichnet das Ufer die Treppe der
 * Felder nach (Runde 39 gesehen).
 */
export function wasserAnteil(karte, fx, fy) {
  let summe = 0;
  for (const dy of [-0.3, 0, 0.3]) {
    for (const dx of [-0.3, 0, 0.3]) summe += wasserPunkt(karte, fx + dx, fy + dy);
  }
  return summe / 9;
}

function wasserPunkt(karte, fx, fy) {
  const g = karte.groesse;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const w = (x, y) => (x >= 0 && y >= 0 && x < g && y < g && karte.felder[y * g + x] === WASSER ? 1 : 0);
  const tx = fx - x0;
  const ty = fy - y0;
  const oben = w(x0, y0) + (w(x0 + 1, y0) - w(x0, y0)) * tx;
  const unten = w(x0, y0 + 1) + (w(x0 + 1, y0 + 1) - w(x0, y0 + 1)) * tx;
  return oben + (unten - oben) * ty;
}

/** Die Farbe am Ufer und im Wasser - `land` ist die Bodenfarbe darunter. */
export function wasserFarbe(land, anteil, fx, fy, salz) {
  if (anteil <= 0.12) return land;
  const ton = wolken(fx / 2.4, fy / 2.4, salz + 61);
  // Das Ufer laeuft nicht gerade: ein wenig Rauschen verschiebt die Linie.
  anteil = klemme(anteil + (wolken(fx / 1.3, fy / 1.3, salz + 67) - 0.5) * 0.22);
  // Ein schmaler Saum: aussen heller Sand, zum Wasser hin nasser Schlamm.
  let farbe = mische(land, mische(SAND, SCHLAMM, stufe(0.4, 0.5, anteil)), stufe(0.2, 0.44, anteil) * 0.8);
  const wasser = mische(FLACH, TIEF, stufe(0.55, 0.95, anteil) * (0.75 + ton * 0.25));
  farbe = mische(farbe, wasser, stufe(0.47, 0.56, anteil));
  return farbe;
}

/** Die Farbe des Bodens an einer Stelle der Karte (in Feldern, gebrochen erlaubt). */
export function bodenAn(x, y, feld, salz) {
  const ton = wolken(x / 3.2, y / 3.2, salz + 5);
  const trocken = klemme((wolken(x / 11, y / 11, salz + 23) - 0.45) * 2.2);
  const erde = klemme((wolken(x / 6.5, y / 6.5, salz + 11) - 0.6) * 4.5);
  let farbe = mische(GRAS_DUNKEL, GRAS_HELL, ton);
  farbe = mische(farbe, GRAS_TROCKEN, trocken * 0.55);
  farbe = mische(farbe, mische(ERDE, ERDE_HELL, ton), erde);
  if (feld === WALD) farbe = mische(WALDBODEN, ERDE, erde * 0.5 + ton * 0.15);
  // Unter und um Gebaeude ist der Boden festgetreten.
  if (feld === BEBAUT) farbe = mische(ERDE, ERDE_HELL, ton * 0.6);
  return farbe;
}

/**
 * Eine Kachel zeichnen: `x0`, `y0` sind Bildpunkte der Raute bei Zoom 1
 * (wie ansicht.zuBild ohne Kamera), `massstab` die Aufloesung der Kachel.
 */
export function kachelZeichnen(karte, x0, y0, massstab, halbB, halbH, salz) {
  const leinwand = document.createElement('canvas');
  const groesse = Math.ceil(KACHEL * massstab);
  leinwand.width = groesse;
  leinwand.height = groesse;
  const s = leinwand.getContext('2d');
  s.scale(massstab, massstab);
  s.translate(-x0, -y0);
  const g = karte.groesse;
  const felder = [];
  // Felder, deren Raute die Kachel beruehrt, mit einem Rand fuer die Flecken.
  const u0 = Math.floor(x0 / halbB) - 3;
  const u1 = Math.ceil((x0 + KACHEL) / halbB) + 3;
  const v0 = Math.floor(y0 / halbH) - 3;
  const v1 = Math.ceil((y0 + KACHEL) / halbH) + 3;
  for (let v = v0; v <= v1; v++) {
    for (let u = u0; u <= u1; u++) {
      if ((u + v) & 1) continue;
      const x = (u + v) / 2;
      const y = (v - u) / 2;
      if (x < 0 || y < 0 || x >= g || y >= g) continue;
      const art = karte.felder[y * g + x];
      felder.push({ x, y, art, px: u * halbB, py: v * halbH, farbe: bodenAn(x, y, art === WASSER ? 0 : art, salz) });
    }
  }
  // 1. Die Farben in einem feinen Punktgitter (alle RASTER Bildpunkte), aus dem
  //    Rauschen an genau dieser Stelle der Karte - nicht je Feld. Vergroessert
  //    mit Glaettung laufen sie weich ineinander; ein Rautenraster bleibt nicht.
  const RASTER = 6;
  const breite = Math.ceil(KACHEL / RASTER) + 3;
  const klein = document.createElement('canvas');
  klein.width = breite;
  klein.height = breite;
  const k = klein.getContext('2d');
  const bild = k.createImageData(breite, breite);
  for (let j = 0; j < breite; j++) {
    for (let i = 0; i < breite; i++) {
      const px = x0 + (i - 1) * RASTER;
      const py = y0 + (j - 1) * RASTER;
      const fx = (px / halbB + py / halbH) / 2;
      const fy = (py / halbH - px / halbB) / 2;
      const x = Math.round(fx);
      const y = Math.round(fy);
      if (x < 0 || y < 0 || x >= g || y >= g) continue;
      const art = karte.felder[y * g + x];
      const land = bodenAn(fx, fy, art === WASSER ? 0 : art, salz);
      const farbe = wasserFarbe(land, wasserAnteil(karte, fx, fy), fx, fy, salz);
      const o = (j * breite + i) * 4;
      bild.data[o] = farbe[0];
      bild.data[o + 1] = farbe[1];
      bild.data[o + 2] = farbe[2];
      bild.data[o + 3] = 255;
    }
  }
  k.putImageData(bild, 0, 0);
  s.imageSmoothingEnabled = true;
  s.imageSmoothingQuality = 'high';
  s.drawImage(klein, x0 - RASTER * 1.5, y0 - RASTER * 1.5, breite * RASTER, breite * RASTER);

  // 3. Sprenkel: kleine hellere und dunklere Tupfen, auf Erde Kiesel.
  for (const f of felder) {
    if (f.art === WASSER) continue;
    const auf = hash2(f.x, f.y, salz + 91);
    const erde = f.art === BEBAUT || klemme((wolken(f.x / 6.5, f.y / 6.5, salz + 11) - 0.6) * 4.5) > 0.5;
    for (let i = 0; i < 7; i++) {
      const dx = (hash2(f.x * 7 + i, f.y, salz + 31) - 0.5) * halbB * 1.6;
      const dy = (hash2(f.x, f.y * 7 + i, salz + 37) - 0.5) * halbH * 1.6;
      const hell = hash2(f.x + i, f.y - i, salz + 41) > 0.5;
      const t = hash2(i, f.x + f.y, salz + 43);
      const farbe = hell ? mische(f.farbe, [200, 190, 130], 0.18 + t * 0.1) : mische(f.farbe, [20, 24, 10], 0.2 + t * 0.12);
      s.fillStyle = rgb(farbe, 0.8);
      s.beginPath();
      if (erde && i < 3) {
        s.ellipse(f.px + dx, f.py + dy, 1.4, 0.9, 0, 0, Math.PI * 2);
      } else {
        s.ellipse(f.px + dx, f.py + dy, 1 + auf, 0.55 + auf * 0.4, 0, 0, Math.PI * 2);
      }
      s.fill();
    }
  }
  return leinwand;
}

/** Stufe der Kachelaufloesung zu einem Zoom - nur drei, damit wenig neu entsteht. */
export function kachelMassstab(zoom) {
  if (zoom > 1.45) return 2;
  if (zoom < 0.7) return 0.5;
  return 1;
}
