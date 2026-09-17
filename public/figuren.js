// Die Einheiten als Figuren (→ specs/10-strategie/darstellung.md AC-6).
//
// Alles in Code gezeichnet, kein Bild aus fremder Quelle. Aufrecht in
// Dreiviertelansicht, wie man es aus dem Genre kennt - das passt auf die
// heutige Draufsicht und spaeter auf den isometrischen Blick.
//
// Eine Figur steht mit den Fuessen auf (x, y) und ist `hoehe` Bildpunkte hoch.
// Gezeichnet wird in einem Raster von 24 Einheiten Hoehe, das auf `hoehe`
// skaliert wird; `blick` -1 schaut nach links, 1 nach rechts.

const HAUT = '#e2b48c';
const HAAR = '#5b3a24';
const LEDER = '#6b4a2e';
const HOSE = '#3f3a33';
const EISEN = '#b9c0c8';
const EISEN_DUNKEL = '#7d858e';
const HOLZ = '#8a5a2b';
const KONTUR = 'rgba(15, 18, 22, 0.85)';

const WAREN = {
  h: { name: 'Holz' },
  n: { name: 'Nahrung' },
  g: { name: 'Gold' },
  s: { name: 'Stein' },
};

/** Farbe aufhellen (anteil > 0) oder abdunkeln (anteil < 0). */
export function toenen(hex, anteil) {
  const zahl = parseInt(hex.slice(1), 16);
  const ziel = anteil < 0 ? 0 : 255;
  const a = Math.abs(anteil);
  const kanal = (verschiebung) => {
    const wert = (zahl >> verschiebung) & 255;
    return Math.round(wert + (ziel - wert) * a);
  };
  return `rgb(${kanal(16)}, ${kanal(8)}, ${kanal(0)})`;
}

function ellipse(stift, x, y, rx, ry, fuellung, kontur = true) {
  stift.beginPath();
  stift.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  stift.fillStyle = fuellung;
  stift.fill();
  if (kontur) stift.stroke();
}

function vieleck(stift, punkte, fuellung, kontur = true) {
  stift.beginPath();
  stift.moveTo(punkte[0][0], punkte[0][1]);
  for (const [x, y] of punkte.slice(1)) stift.lineTo(x, y);
  stift.closePath();
  stift.fillStyle = fuellung;
  stift.fill();
  if (kontur) stift.stroke();
}

function schatten(stift, breite) {
  stift.save();
  stift.fillStyle = 'rgba(0, 0, 0, 0.28)';
  stift.beginPath();
  stift.ellipse(0, 0, breite, breite * 0.38, 0, 0, Math.PI * 2);
  stift.fill();
  stift.restore();
}

// Beine im Schritt: `schritt` ist eine Phase in Bogenmass, 0 heisst Stillstand.
function beine(stift, schritt, farbe = HOSE) {
  const aus = Math.sin(schritt) * 2.2;
  vieleck(stift, [[-2.6 + aus, 0], [-0.4 + aus, 0], [-0.3, -7], [-2.9, -7]], farbe);
  vieleck(stift, [[0.4 - aus, 0], [2.6 - aus, 0], [2.9, -7], [0.3, -7]], toenen(farbe.startsWith('#') ? farbe : '#3f3a33', -0.25));
}

function kopf(stift, y, { hut = null, helm = false } = {}) {
  ellipse(stift, 0.6, y, 3.1, 3.3, HAUT);
  if (helm) {
    vieleck(stift, [[-3.4, y - 0.4], [3.8, y - 0.4], [3.1, y - 3.6], [0.3, y - 4.9], [-2.7, y - 3.6]], EISEN);
    stift.beginPath();
    stift.moveTo(0.6, y - 0.4);
    stift.lineTo(0.6, y + 2.2);
    stift.strokeStyle = EISEN_DUNKEL;
    stift.stroke();
    stift.strokeStyle = KONTUR;
  } else if (hut) {
    ellipse(stift, 0.4, y - 2.2, 4.6, 1.3, hut);
    ellipse(stift, 0.4, y - 3.2, 2.6, 1.9, toenen('#c9a86a', -0.1));
  } else {
    ellipse(stift, 0.2, y - 2.1, 3.1, 1.8, HAAR, false);
  }
  // Das Auge in Blickrichtung - so ist erkennbar, wohin die Figur schaut.
  stift.fillStyle = '#1b1b1b';
  stift.fillRect(2.1, y - 0.6, 0.9, 0.9);
}

function ladungZeichnen(stift, ware) {
  if (ware === 'h') {
    // Ein Buendel Holz auf dem Ruecken.
    for (const [dy, laenge] of [[-15.5, 8], [-13, 7.5], [-10.5, 8.5]]) {
      stift.save();
      stift.translate(-5.2, dy);
      stift.rotate(-0.35);
      vieleck(stift, [[-laenge / 2, -1.1], [laenge / 2, -1.1], [laenge / 2, 1.1], [-laenge / 2, 1.1]], HOLZ);
      ellipse(stift, laenge / 2, 0, 0.9, 1.1, '#c49a62');
      stift.restore();
    }
  } else if (ware === 'n') {
    // Ein Korb mit Beeren.
    vieleck(stift, [[-9, -13.5], [-2.5, -13.5], [-3.3, -8.5], [-8.2, -8.5]], '#b48a4e');
    for (const [bx, by] of [[-7.6, -14.2], [-5.7, -15], [-3.9, -14.2], [-6.6, -12.8], [-4.6, -12.8]]) {
      ellipse(stift, bx, by, 1.15, 1.15, '#c8324a', false);
    }
  } else if (ware === 'g' || ware === 's') {
    vieleck(stift, [[-9, -13.5], [-2.5, -13.5], [-3.3, -8.5], [-8.2, -8.5]], LEDER);
    const brocken = ware === 'g' ? '#e8c14a' : '#9aa0a6';
    for (const [bx, by] of [[-7.2, -14.3], [-5, -14.8], [-4.4, -13]]) {
      vieleck(stift, [[bx - 1.3, by + 0.8], [bx, by - 1.2], [bx + 1.4, by + 0.6]], brocken);
    }
  }
}

function dorfbewohner(stift, farbe, { ladung = null, schritt = 0 }) {
  schatten(stift, 5);
  ladungZeichnen(stift, ladung);
  beine(stift, schritt);
  // Kittel in Spielerfarbe, die Rueckseite dunkler.
  vieleck(stift, [[-4.4, -6.5], [4.6, -6.5], [3.4, -16.5], [-3.2, -16.5]], farbe);
  vieleck(stift, [[-4.4, -6.5], [-1.6, -6.5], [-1.2, -16.5], [-3.2, -16.5]], toenen(farbe, -0.3), false);
  vieleck(stift, [[-4, -10.2], [4.2, -10.2], [4.1, -9], [-4.1, -9]], LEDER, false);
  kopf(stift, -19.4, { hut: '#d8b978' });
  // Werkzeug: ohne Ladung haelt er die Axt gesenkt in der vorderen Hand,
  // das Blatt vor den Beinen - nie vor dem Gesicht.
  if (!ladung) {
    stift.save();
    stift.translate(4.2, -11.4);
    stift.rotate(2.55 + Math.sin(schritt) * 0.12);
    vieleck(stift, [[-0.6, 1.5], [0.6, 1.5], [0.6, -10], [-0.6, -10]], HOLZ);
    vieleck(stift, [[0.4, -10.4], [4, -11.6], [4.4, -7.4], [0.4, -8]], EISEN);
    stift.restore();
  }
  ellipse(stift, 4, -11.4, 1.5, 1.5, HAUT);
}

function miliz(stift, farbe, { schritt = 0 }) {
  schatten(stift, 5.5);
  beine(stift, schritt, '#4a4036');
  // Schwert erhoben hinter dem Koerper.
  stift.save();
  stift.translate(4.4, -12.5);
  stift.rotate(0.35);
  vieleck(stift, [[-0.8, 0], [0.8, 0], [0.5, -11.5], [0, -13], [-0.5, -11.5]], EISEN);
  vieleck(stift, [[-2.4, 0.3], [2.4, 0.3], [2.4, 1.3], [-2.4, 1.3]], '#6b5a2a');
  stift.restore();
  // Waffenrock in Spielerfarbe ueber einem Kettenhemd.
  vieleck(stift, [[-4.8, -6.5], [5, -6.5], [4, -17], [-3.8, -17]], EISEN_DUNKEL);
  vieleck(stift, [[-3.8, -6.8], [4, -6.8], [3.2, -16.5], [-2.8, -16.5]], farbe);
  vieleck(stift, [[-4.2, -10.4], [4.4, -10.4], [4.3, -9.2], [-4.3, -9.2]], LEDER, false);
  kopf(stift, -19.6, { helm: true });
  ellipse(stift, 4.4, -12.4, 1.5, 1.5, HAUT);
  // Schild vorn: Spielerfarbe mit hellem Rand und Buckel.
  vieleck(stift, [[-6.8, -15.5], [-0.4, -15.5], [-0.6, -9.5], [-3.6, -6.6], [-6.6, -9.5]], toenen(farbe, 0.08));
  stift.save();
  stift.strokeStyle = toenen(farbe, 0.55);
  stift.lineWidth = 0.8;
  vieleck(stift, [[-6, -14.8], [-1.2, -14.8], [-1.3, -9.8], [-3.6, -7.6], [-5.9, -9.8]], 'rgba(0,0,0,0)');
  stift.restore();
  ellipse(stift, -3.6, -11.8, 1.1, 1.1, EISEN);
}

function spaeherreiter(stift, farbe, { schritt = 0 }) {
  schatten(stift, 9.5);
  const PFERD = '#8b5a33';
  const MAEHNE = '#3a2616';
  const aus = Math.sin(schritt) * 1.8;
  // Hintere Beine (dunkler), dann Schweif, Rumpf, vordere Beine.
  for (const [x, phase] of [[-5.2, -aus], [5.6, aus]]) {
    vieleck(stift, [[x - 1 + phase, 0], [x + 0.9 + phase, 0], [x + 1.2, -7], [x - 1.2, -7]], toenen(PFERD, -0.35));
  }
  vieleck(stift, [[-8.6, -11], [-11.6, -4.8], [-9.6, -4.4], [-7.6, -9.2]], MAEHNE);
  // Rumpf: rund, vorn die Brust hoeher.
  vieleck(stift, [[-9, -10.2], [-7.6, -13.2], [4.6, -13.8], [8.6, -12.2], [9, -8.6], [6.4, -6.6], [-6.8, -6.8]], PFERD);
  for (const [x, phase] of [[-7, aus], [7.4, -aus]]) {
    vieleck(stift, [[x - 1 + phase, 0], [x + 1 + phase, 0], [x + 1.2, -7.4], [x - 1.2, -7.4]], toenen(PFERD, -0.15));
    vieleck(stift, [[x - 1.1 + phase, 0], [x + 1.1 + phase, 0], [x + 1 + phase, -1.2], [x - 1 + phase, -1.2]], '#2a2320', false);
  }
  // Hals und Kopf mit Maehne, Ohr, Nuestern.
  vieleck(stift, [[5, -12.4], [8.2, -19.4], [11.6, -19.6], [10.6, -10.6]], PFERD);
  vieleck(stift, [[8.2, -21], [15.6, -18.2], [15.4, -15.4], [10.2, -15.6]], PFERD);
  vieleck(stift, [[8.8, -20.6], [9.4, -23.2], [10.8, -20.8]], toenen(PFERD, -0.2));
  vieleck(stift, [[4.8, -12.8], [7.6, -20.4], [9.2, -20.6], [6.6, -12.4]], MAEHNE, false);
  ellipse(stift, 14.6, -16.4, 0.6, 0.6, '#1b1b1b', false);
  // Sattel mit Decke in Spielerfarbe.
  vieleck(stift, [[-4.6, -14.2], [3.4, -14.2], [3.8, -8.8], [-5, -8.8]], farbe);
  vieleck(stift, [[-3.2, -15.2], [2.6, -15.2], [2.4, -13.6], [-3, -13.6]], LEDER, false);
  // Reiter sitzt: Bein am Pferd, Oberkoerper aufrecht, Kopf direkt darauf.
  vieleck(stift, [[-0.6, -14.4], [2.2, -14.4], [2.8, -8.2], [0.8, -8.2]], HOSE);
  vieleck(stift, [[-2.6, -14.4], [2.8, -14.4], [2.2, -22.4], [-1.9, -22.4]], farbe);
  vieleck(stift, [[-2.6, -14.4], [-0.6, -14.4], [-0.5, -22.4], [-1.9, -22.4]], toenen(farbe, -0.3), false);
  ellipse(stift, 3.2, -18.6, 1.4, 1.4, HAUT);
  kopf(stift, -25.2, { helm: true });
}

// Ein Schaf: helle Wolle aus Buckeln, dunkler Kopf und Beine, das Halsband in
// Spielerfarbe zeigt, wem es gehoert (karte AC-16). Kleiner als ein Mensch.
function schaf(stift, farbe, { schritt = 0 }) {
  schatten(stift, 6.5);
  const WOLLE = '#ece6d8';
  const WOLLE_SCHATTEN = '#cfc7b5';
  const KOPF = '#2e2a28';
  const aus = Math.sin(schritt) * 1.2;
  for (const [x, phase] of [[-4.2, aus], [-2, -aus], [2.2, -aus], [4.2, aus]]) {
    vieleck(stift, [[x - 0.7 + phase, 0], [x + 0.7 + phase, 0], [x + 0.7, -4.5], [x - 0.7, -4.5]], KOPF, false);
  }
  // Wolle als Wolke aus Buckeln, unten etwas dunkler.
  ellipse(stift, 0, -7.6, 7, 4.2, WOLLE_SCHATTEN);
  for (const [x, y, r] of [[-4.2, -8.4, 2.8], [-1.2, -10.4, 3.2], [2.2, -10, 3], [4.6, -8, 2.6], [0.6, -7.2, 3.4]]) {
    ellipse(stift, x, y, r, r * 0.9, WOLLE, false);
  }
  // Halsband in Spielerfarbe, dann der Kopf nach vorn.
  vieleck(stift, [[5, -10.6], [7, -11.4], [7.6, -8.6], [5.6, -7.8]], farbe);
  vieleck(stift, [[6.6, -12], [10.8, -10.6], [10.6, -7.8], [7.2, -7.6]], KOPF);
  ellipse(stift, 7, -12.2, 1.4, 0.7, KOPF, false);
  stift.fillStyle = '#f2f2f2';
  stift.fillRect(9, -10.4, 0.8, 0.8);
}

export const FIGUREN = {
  dorfbewohner: { name: 'Dorfbewohner', zeichnen: dorfbewohner, breite: 1 },
  schaf: { name: 'Schaf', zeichnen: schaf, breite: 1.1 },
  miliz: { name: 'Miliz', zeichnen: miliz, breite: 1 },
  spaeherreiter: { name: 'Spaeherreiter', zeichnen: spaeherreiter, breite: 1.6 },
};

export { WAREN };

/**
 * Eine Figur zeichnen.
 * @param {CanvasRenderingContext2D} stift
 * @param {string} art dorfbewohner | miliz | spaeherreiter
 * @param {number} x Fusspunkt
 * @param {number} y Fusspunkt
 * @param {number} hoehe Bildpunkte vom Fuss bis zum Scheitel
 * @param {string} farbe Spielerfarbe als #rrggbb
 * @param {{blick?: number, ladung?: string|null, schritt?: number}} [lage]
 */
export function figurZeichnen(stift, art, x, y, hoehe, farbe, lage = {}) {
  const figur = FIGUREN[art] || FIGUREN.dorfbewohner;
  const massstab = hoehe / 24;
  stift.save();
  stift.translate(x, y);
  stift.scale(massstab * (lage.blick === -1 ? -1 : 1), massstab);
  stift.lineWidth = Math.max(0.6, 1.1 / massstab);
  stift.lineJoin = 'round';
  stift.strokeStyle = KONTUR;
  figur.zeichnen(stift, farbe, lage);
  stift.restore();
}
