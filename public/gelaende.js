// Gelaende und Vorraete als Dinge (→ specs/10-strategie/darstellung.md AC-2, AC-3).
//
// Wie die Figuren: in Code gezeichnet, kein Bild aus fremder Quelle. Der Boden
// ist eine Raute (isometrisch, doppelt so breit wie hoch); Baeume, Straeucher,
// Gold und Stein stehen mit ihrem Fuss in der Mitte ihrer Raute und werden
// nach der Tiefe gezeichnet, zusammen mit den Figuren.

export const GRAS = 0;
export const WALD = 1;
export const BEERE = 2;
export const WASSER = 3;
export const GOLD = 4;
export const STEIN = 5;

// Ein fester Zufall je Feld: gleiche Karte, gleiches Bild.
export function streuung(index, salz = 0) {
  let h = (index * 2654435761 + salz * 40503) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519) >>> 0;
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

function rgb(r, g, b) {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

// Vier Toenungen je Bodenart reichen fuers Auge - und erlauben, alle Rauten
// gleicher Farbe in einem Zug zu fuellen statt jede einzeln (darstellung AC-10).
export const TOENUNGEN = 4;

// `salz` kommt aus dem Startwert der Partie: jede Karte hat ihr eigenes
// Muster, dieselbe Karte immer dasselbe (darstellung AC-2).
export function bodenTon(index, salz = 0) {
  return Math.min(TOENUNGEN - 1, Math.floor(streuung(index, salz) * TOENUNGEN));
}

/** Boden eines Feldes: Gras leicht getoent, Wasser blau, unter Wald dunkler. */
export function bodenFarbe(art, index, salz = 0) {
  const s = (bodenTon(index, salz) + 0.5) / TOENUNGEN;
  if (art === WASSER) return rgb(34 + s * 6, 70 + s * 8, 104 + s * 10);
  if (art === WALD) return rgb(40 + s * 6, 64 + s * 8, 42 + s * 5);
  // Nur leicht getoent - staerker wirkt es wie ein Schachbrett.
  return rgb(60 + s * 4, 91 + s * 5, 56 + s * 3);
}

export function raute(stift, x, y, hb, hh) {
  stift.beginPath();
  stift.moveTo(x, y - hh);
  stift.lineTo(x + hb, y);
  stift.lineTo(x, y + hh);
  stift.lineTo(x - hb, y);
  stift.closePath();
}

/**
 * Wasser mit weichem Ufer (darstellung AC-2). Nicht als Rauten - deren Treppe
 * sah in Runde 14 aus wie ein geflieste Becken -, sondern als Vereinigung von
 * Ellipsen, eine je Wasserfeld: ueberlappend ergeben sie von selbst runde
 * Uferlinien. Darunter dieselben Ellipsen groesser in Sand: das Ufer.
 * `mitten` sind die Bildpunkte der Wasserfelder, `e` die halbe Rautenbreite.
 */
export function gewaesserZeichnen(stift, mitten, e) {
  if (!mitten.length) return;
  const flaeche = (faktor, farbe) => {
    stift.beginPath();
    for (const p of mitten) {
      stift.moveTo(p.x + e * faktor, p.y);
      stift.ellipse(p.x, p.y, e * faktor, e * 0.5 * faktor, 0, 0, Math.PI * 2);
    }
    stift.fillStyle = farbe;
    stift.fill();
  };
  // Jede Schicht muss die Rautenecke (Faktor 1 auf der Achse) sicher decken,
  // sonst schimmert zwischen vier Wasserfeldern die Schicht darunter durch.
  flaeche(1.42, 'rgba(176, 160, 112, 0.9)'); // Sand
  flaeche(1.24, 'rgb(58, 104, 128)'); // flaches Wasser am Rand
  flaeche(1.1, 'rgb(38, 76, 110)'); // tiefes Wasser
}

/** Kleine helle Wellen auf offenem Wasser, nicht auf jedem Feld. */
export function wellenZeichnen(stift, x, y, e, index, salz = 0) {
  if (e < 12 || streuung(index, salz + 7) < 0.55) return;
  const dx = (streuung(index, salz + 8) - 0.5) * e * 0.6;
  const dy = (streuung(index, salz + 9) - 0.5) * e * 0.3;
  stift.save();
  stift.strokeStyle = 'rgba(190, 225, 240, 0.35)';
  stift.lineWidth = Math.max(1, e * 0.06);
  stift.lineCap = 'round';
  stift.beginPath();
  stift.moveTo(x + dx - e * 0.3, y + dy);
  stift.quadraticCurveTo(x + dx - e * 0.15, y + dy - e * 0.1, x + dx, y + dy);
  stift.quadraticCurveTo(x + dx + e * 0.15, y + dy + e * 0.1, x + dx + e * 0.3, y + dy);
  stift.stroke();
  stift.restore();
}

function kreis(stift, x, y, r, farbe) {
  stift.beginPath();
  stift.arc(x, y, r, 0, Math.PI * 2);
  stift.fillStyle = farbe;
  stift.fill();
}

function schatten(stift, x, y, rx) {
  stift.beginPath();
  stift.ellipse(x, y, rx, rx * 0.45, 0, 0, Math.PI * 2);
  stift.fillStyle = 'rgba(0, 0, 0, 0.25)';
  stift.fill();
}

// Ein Baum: Stamm und eine Krone aus drei Ballen, je Feld etwas anders.
function baum(stift, x, y, e, index) {
  const s = streuung(index, 1);
  const hoehe = e * (1.5 + s * 0.5);
  const breite = e * (0.62 + streuung(index, 2) * 0.2);
  schatten(stift, x, y, breite * 0.8);
  stift.fillStyle = '#5a3d23';
  stift.fillRect(x - e * 0.07, y - hoehe * 0.42, e * 0.14, hoehe * 0.42);
  const gruen = [[30, 72, 38], [40, 92, 46], [58, 116, 58]];
  const ton = streuung(index, 3) * 14;
  const ballen = [
    [-breite * 0.32, -hoehe * 0.55, breite * 0.48, gruen[0]],
    [breite * 0.3, -hoehe * 0.6, breite * 0.44, gruen[0]],
    [0, -hoehe * 0.72, breite * 0.56, gruen[1]],
    [-breite * 0.12, -hoehe * 0.9, breite * 0.38, gruen[2]],
  ];
  for (const [dx, dy, r, [cr, cg, cb]] of ballen) kreis(stift, x + dx, y + dy, r, rgb(cr + ton, cg + ton, cb));
  // Licht von links oben.
  kreis(stift, x - breite * 0.25, y - hoehe * 0.95, breite * 0.14, 'rgba(255, 255, 220, 0.18)');
}

function beerenstrauch(stift, x, y, e, index) {
  const b = e * 0.85;
  schatten(stift, x, y, b * 0.9);
  kreis(stift, x - b * 0.42, y - b * 0.42, b * 0.5, '#2c5a31');
  kreis(stift, x + b * 0.44, y - b * 0.4, b * 0.48, '#2c5a31');
  kreis(stift, x, y - b * 0.72, b * 0.6, '#3b7440');
  kreis(stift, x - b * 0.18, y - b * 0.9, b * 0.28, '#4a8a4c');
  // Die Beeren sind das, woran man ihn erkennt: viele, hell, mit Glanzpunkt.
  const beere = Math.max(1.6, b * 0.12);
  for (let i = 0; i < 11; i++) {
    const w = streuung(index, 10 + i) * Math.PI * 2;
    const r = (0.25 + streuung(index, 20 + i) * 0.75) * b * 0.62;
    const bx = x + Math.cos(w) * r;
    const by = y - b * 0.6 + Math.sin(w) * r * 0.62;
    kreis(stift, bx, by, beere, '#d8354f');
    kreis(stift, bx - beere * 0.35, by - beere * 0.35, beere * 0.35, 'rgba(255, 220, 225, 0.8)');
  }
}

// Gold und Stein: kantige Brocken mit heller Oberseite und dunkler Flanke.
function brocken(stift, x, y, e, index, hell, mittel, dunkel, glanz) {
  // Ein Haufen, der sein Feld fuellt - Gold und Stein liegen im Genre gross da.
  const b = e * 0.95;
  schatten(stift, x, y, b);
  const teile = [[-0.5, -0.05, 0.5], [0.48, 0, 0.46], [-0.12, -0.3, 0.6], [0.28, -0.55, 0.42]];
  teile.forEach(([dx, dy, g], i) => {
    const k = b * g * (0.85 + streuung(index, 30 + i) * 0.3);
    const cx = x + dx * b;
    const cy = y + dy * b;
    stift.beginPath();
    stift.moveTo(cx - k, cy);
    stift.lineTo(cx - k * 0.45, cy - k * 0.85);
    stift.lineTo(cx + k * 0.55, cy - k * 0.7);
    stift.lineTo(cx + k, cy - k * 0.05);
    stift.lineTo(cx + k * 0.3, cy + k * 0.35);
    stift.lineTo(cx - k * 0.6, cy + k * 0.3);
    stift.closePath();
    stift.fillStyle = mittel;
    stift.fill();
    stift.beginPath();
    stift.moveTo(cx - k * 0.45, cy - k * 0.85);
    stift.lineTo(cx + k * 0.55, cy - k * 0.7);
    stift.lineTo(cx + k * 0.15, cy - k * 0.2);
    stift.lineTo(cx - k * 0.7, cy - k * 0.25);
    stift.closePath();
    stift.fillStyle = hell;
    stift.fill();
    stift.beginPath();
    stift.moveTo(cx + k * 0.15, cy - k * 0.2);
    stift.lineTo(cx + k, cy - k * 0.05);
    stift.lineTo(cx + k * 0.3, cy + k * 0.35);
    stift.closePath();
    stift.fillStyle = dunkel;
    stift.fill();
  });
  if (glanz) {
    for (let i = 0; i < 3; i++) {
      kreis(stift, x + (streuung(index, 40 + i) - 0.5) * b, y - b * (0.3 + streuung(index, 50 + i) * 0.5), Math.max(1, b * 0.07), glanz);
    }
  }
}

/**
 * Ein Vorrat als Ding. `e` ist die Bildgroesse eines Feldes (Rautenbreite / 2),
 * `fuellung` 1 heisst voll; ein leerer werdender Vorrat wird kleiner.
 */
export function dingZeichnen(stift, art, x, y, e, index, fuellung = 1) {
  const g = e * (0.6 + 0.4 * Math.max(0, Math.min(1, fuellung)));
  // Weit herausgezoomt sind Einzelheiten nicht zu sehen, kosten aber Zeit:
  // dann eine einfache Form in derselben Farbe.
  if (e < 12) {
    einfach(stift, art, x, y, g);
    return;
  }
  if (art === WALD) baum(stift, x, y, g, index);
  else if (art === BEERE) beerenstrauch(stift, x, y, g, index);
  else if (art === GOLD) brocken(stift, x, y, g, index, '#f3d36a', '#d6a93a', '#8f6b1f', '#fff6c8');
  else if (art === STEIN) brocken(stift, x, y, g, index, '#c3c7cc', '#9aa0a7', '#62686f', null);
}

function einfach(stift, art, x, y, g) {
  if (art === WALD) {
    kreis(stift, x, y - g * 1.1, g * 0.6, '#2f6a3a');
  } else if (art === BEERE) {
    kreis(stift, x, y - g * 0.5, g * 0.6, '#3b7440');
    kreis(stift, x, y - g * 0.55, g * 0.25, '#d8354f');
  } else {
    kreis(stift, x, y - g * 0.4, g * 0.7, art === GOLD ? '#e0b64a' : '#a2a8ae');
  }
}

export const DINGE = [WALD, BEERE, GOLD, STEIN];
