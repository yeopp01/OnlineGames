// Gebaeude, in Code gezeichnet wie die Figuren (→ specs/10-strategie/darstellung.md).
// Kein Material aus dem Original. Der Fusspunkt ist die Mitte der Grundflaeche;
// e ist eine halbe Rautenbreite in Bildpunkten.

const KONTUR = '#1d1a17';

function flaeche(stift, punkte, farbe, rand = true) {
  stift.beginPath();
  stift.moveTo(punkte[0][0], punkte[0][1]);
  for (let i = 1; i < punkte.length; i++) stift.lineTo(punkte[i][0], punkte[i][1]);
  stift.closePath();
  stift.fillStyle = farbe;
  stift.fill();
  if (rand) stift.stroke();
}

function linie(stift, von, bis, farbe, breite) {
  stift.beginPath();
  stift.moveTo(von[0], von[1]);
  stift.lineTo(bis[0], bis[1]);
  stift.strokeStyle = farbe;
  stift.lineWidth = breite;
  stift.stroke();
}

// Zwischen zwei Punkten, Anteil t.
const zwischen = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const hoch = (p, z) => [p[0], p[1] - z];

// Ein Dorfzentrum: Steinsockel, Fachwerk, Walmdach, Tuer zur Bildseite und eine
// Fahne in Spielerfarbe - daran erkennt man, wem es gehoert.
function dorfzentrum(stift, e, farbe) {
  const W = 2.3 * e; // halbe Breite der Grundflaeche im Bild
  const H = W / 2;
  const L = [-W, 0];
  const B = [0, H];
  const R = [W, 0];
  const sockel = 0.28 * e;
  const wand = 1.25 * e;

  // Schatten auf dem Boden.
  stift.fillStyle = 'rgba(0,0,0,0.28)';
  stift.beginPath();
  stift.ellipse(0.3 * e, 0.15 * e, W * 1.12, H * 1.2, 0, 0, Math.PI * 2);
  stift.fill();

  stift.strokeStyle = KONTUR;
  stift.lineWidth = Math.max(1, e * 0.05);
  stift.lineJoin = 'round';

  // Sockel aus Stein.
  flaeche(stift, [L, B, hoch(B, sockel), hoch(L, sockel)], '#8d8a83');
  flaeche(stift, [B, R, hoch(R, sockel), hoch(B, sockel)], '#a9a59c');

  // Waende: links im Schatten, rechts im Licht.
  const L1 = hoch(L, sockel);
  const B1 = hoch(B, sockel);
  const R1 = hoch(R, sockel);
  flaeche(stift, [L1, B1, hoch(B1, wand), hoch(L1, wand)], '#b58d58');
  flaeche(stift, [B1, R1, hoch(R1, wand), hoch(B1, wand)], '#d4ab70');

  // Fachwerk: Balken als dunkle Streifen.
  const balken = '#5c3d22';
  const dicke = Math.max(1, e * 0.09);
  for (const [a, b] of [[L1, B1], [B1, R1]]) {
    for (const t of [0.02, 0.35, 0.65, 0.98]) {
      const unten = zwischen(a, b, t);
      linie(stift, unten, hoch(unten, wand), balken, dicke);
    }
    linie(stift, hoch(a, wand * 0.5), hoch(b, wand * 0.5), balken, dicke * 0.8);
    linie(stift, hoch(a, wand), hoch(b, wand), balken, dicke);
  }

  // Fenster links, Tuer rechts.
  for (const t of [0.18, 0.5, 0.82]) {
    const mitte = hoch(zwischen(L1, B1, t), wand * 0.72);
    flaeche(stift, [
      [mitte[0] - 0.14 * e, mitte[1] - 0.07 * e + 0.0],
      [mitte[0] + 0.14 * e, mitte[1] + 0.07 * e],
      [mitte[0] + 0.14 * e, mitte[1] + 0.07 * e + 0.2 * e],
      [mitte[0] - 0.14 * e, mitte[1] - 0.07 * e + 0.2 * e],
    ], '#2f2418', false);
  }
  const tuer = zwischen(B1, R1, 0.5);
  flaeche(stift, [
    [tuer[0] - 0.22 * e, tuer[1] + 0.11 * e],
    [tuer[0] + 0.22 * e, tuer[1] - 0.11 * e],
    [tuer[0] + 0.22 * e, tuer[1] - 0.11 * e - 0.62 * e],
    [tuer[0], tuer[1] - 0.8 * e],
    [tuer[0] - 0.22 * e, tuer[1] + 0.11 * e - 0.62 * e],
  ], '#3b2a1a');

  // Walmdach mit leichtem Ueberstand, oben ein kurzer First.
  const traufe = sockel + wand;
  const ueber = 1.12;
  const L2 = hoch([L[0] * ueber, 0], traufe);
  const B2 = hoch([0, H * ueber], traufe);
  const R2 = hoch([R[0] * ueber, 0], traufe);
  const T2 = hoch([0, -H * ueber], traufe);
  const first = 1.35 * e;
  const F1 = [-0.55 * e, -traufe - first + 0.1 * e];
  const F2 = [0.55 * e, -traufe - first - 0.1 * e];
  flaeche(stift, [L2, T2, F2, F1], '#6f2c20'); // hinten, nur als Rand sichtbar
  flaeche(stift, [L2, B2, F1], '#8a3526');
  flaeche(stift, [B2, R2, F2, F1], '#a8432f');
  flaeche(stift, [R2, T2, F2], '#7c3022');
  // Ziegelreihen auf der hellen Seite.
  for (const t of [0.3, 0.55, 0.8]) {
    linie(stift, zwischen(B2, F1, t), zwischen(R2, F2, t), '#7a2c1e', Math.max(0.8, e * 0.04));
  }

  // Fahnenstange am First, Fahne in Spielerfarbe.
  const fuss = F2;
  const spitze = [fuss[0], fuss[1] - 1.1 * e];
  linie(stift, fuss, spitze, '#3a2c1f', Math.max(1, e * 0.07));
  stift.strokeStyle = KONTUR;
  stift.lineWidth = Math.max(0.8, e * 0.04);
  flaeche(stift, [spitze, [spitze[0] + 0.75 * e, spitze[1] + 0.18 * e], [spitze[0], spitze[1] + 0.42 * e]], farbe);
}

export const GEBAEUDE = {
  dorfzentrum: {
    name: 'Dorfzentrum',
    zeichnen: dorfzentrum,
    // So viele halbe Rautenbreiten ist die Zeichnung halb breit - daraus wird
    // der Massstab fuer die echte Grundflaeche (groesse Felder).
    halbeBreite: 2.3,
    // Wo ein Klick das Gebaeude trifft, in halben Rautenbreiten um den Fusspunkt.
    trefferBreite: 2.4,
    trefferOben: 4.2,
    trefferUnten: 1.3,
  },
};

/**
 * @param {CanvasRenderingContext2D} stift
 * @param {string} art
 * @param {number} x Fusspunkt im Bild
 * @param {number} y Fusspunkt im Bild
 * @param {number} e halbe Rautenbreite in Bildpunkten
 * @param {string} farbe Spielerfarbe
 * @param {number} [groesse] Kantenlaenge der Grundflaeche in Feldern
 */
export function gebaeudeZeichnen(stift, art, x, y, e, farbe, groesse) {
  const gebaeude = GEBAEUDE[art];
  if (!gebaeude) return;
  stift.save();
  stift.translate(x, y);
  gebaeude.zeichnen(stift, e * massstab(gebaeude, groesse), farbe);
  stift.restore();
}

// Eine Grundflaeche aus n Feldern ist im Bild n halbe Rautenbreiten halb breit;
// das Gebaeude fuellt sie fast ganz aus.
function massstab(gebaeude, groesse) {
  return groesse ? (groesse * 0.95) / gebaeude.halbeBreite : 1;
}

/** Trifft ein Bildpunkt (relativ zum Fusspunkt) das Gebaeude? */
export function gebaeudeGetroffen(art, dx, dy, e, groesse) {
  const g = GEBAEUDE[art];
  if (!g) return false;
  const m = e * massstab(g, groesse);
  return Math.abs(dx) <= g.trefferBreite * m && dy >= -g.trefferOben * m && dy <= g.trefferUnten * m;
}
