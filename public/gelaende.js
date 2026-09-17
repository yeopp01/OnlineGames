// Gelaende und Vorraete als Dinge (→ specs/10-strategie/darstellung.md AC-2, AC-3, AC-12).
//
// Wie die Figuren: in Code gezeichnet, kein Bild aus fremder Quelle. Der Boden
// ist eine Raute (isometrisch, doppelt so breit wie hoch); Baeume, Straeucher,
// Gold und Stein stehen mit ihrem Fuss in der Mitte ihrer Raute und werden
// nach der Tiefe gezeichnet, zusammen mit den Figuren.
//
// Gezeichnet statt flach (AC-12, Runde 29): Kronen aus vielen Blattballen mit
// Licht von links oben, Stamm mit Rinde, zwei Baumarten, Straeucher aus
// Blaettern, Brocken mit Kanten, Rissen und Glanz, Grasbueschel und Blumen auf
// dem Boden. Weil davon Hunderte im Bild stehen, wird jedes Ding einmal in ein
// kleines Bild gezeichnet und danach kopiert (dingBildZeichnen).

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

function kanaele(farbe) {
  if (farbe.startsWith('#')) {
    const zahl = parseInt(farbe.slice(1), 16);
    return [(zahl >> 16) & 255, (zahl >> 8) & 255, zahl & 255];
  }
  const m = farbe.match(/\d+/g);
  return m ? m.slice(0, 3).map(Number) : [128, 128, 128];
}

function ton(farbe, anteil) {
  const ziel = anteil < 0 ? 0 : 255;
  const a = Math.abs(anteil);
  const [r, g, b] = kanaele(farbe).map((w) => w + (ziel - w) * a);
  return rgb(r, g, b);
}

// Vier Toenungen je Bodenart reichen fuers Auge.
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
 * Grasbueschel und ab und zu eine Blume auf den Grasfeldern (AC-12). Nicht auf
 * jedem Feld - sonst wird es Rauschen -, und nur, wo man sie sieht.
 *
 * Gemessen (Runde 29, ohne Grafikkarte): jeder Halm als eigener Strich kostete
 * bei Zoom 1 knapp 28 ms je Bild. Deshalb sammelt `grasSammeln` alle Halme in
 * zwei Pfaden (dunkel, hell), und `grasZeichnen` strichelt jeden einmal.
 */
export function grasBeginnen() {
  return { dunkel: [], hell: [], blumen: [] };
}

export function grasSammeln(gras, x, y, e, index, salz = 0) {
  const wahl = streuung(index, salz + 21);
  if (wahl > 0.45) return;
  const anzahl = 1 + Math.floor(streuung(index, salz + 22) * 2);
  for (let b = 0; b < anzahl; b++) {
    const bx = x + (streuung(index, salz + 30 + b) - 0.5) * e * 1.1;
    const by = y + (streuung(index, salz + 40 + b) - 0.5) * e * 0.5;
    const h = e * (0.16 + streuung(index, salz + 50 + b) * 0.12);
    for (let i = -2; i <= 2; i++) {
      (i === 0 ? gras.hell : gras.dunkel).push(bx + i * e * 0.03, by, bx + i * e * 0.06, by - h * 0.6, bx + i * e * 0.1, by - h * (1 - Math.abs(i) * 0.15));
    }
  }
  if (wahl < 0.04) {
    gras.blumen.push(
      x + (streuung(index, salz + 60) - 0.5) * e * 0.8,
      y + (streuung(index, salz + 61) - 0.5) * e * 0.4 - e * 0.12,
      streuung(index, salz + 62) > 0.5 ? 1 : 0,
    );
  }
}

export function grasZeichnen(stift, gras, e) {
  stift.save();
  stift.lineCap = 'round';
  stift.lineWidth = Math.max(0.8, e * 0.035);
  for (const [liste, farbe] of [[gras.dunkel, 'rgba(38, 66, 36, 0.7)'], [gras.hell, 'rgba(150, 190, 110, 0.75)']]) {
    if (!liste.length) continue;
    stift.beginPath();
    for (let k = 0; k < liste.length; k += 6) {
      stift.moveTo(liste[k], liste[k + 1]);
      stift.quadraticCurveTo(liste[k + 2], liste[k + 3], liste[k + 4], liste[k + 5]);
    }
    stift.strokeStyle = farbe;
    stift.stroke();
  }
  for (let k = 0; k < gras.blumen.length; k += 3) {
    const fx = gras.blumen[k];
    const fy = gras.blumen[k + 1];
    stift.fillStyle = gras.blumen[k + 2] ? '#f2e6a0' : '#f4f4f0';
    stift.beginPath();
    for (let i = 0; i < 5; i++) {
      const w = (i / 5) * Math.PI * 2;
      stift.moveTo(fx + Math.cos(w) * e * 0.035 + e * 0.028, fy + Math.sin(w) * e * 0.02);
      stift.arc(fx + Math.cos(w) * e * 0.035, fy + Math.sin(w) * e * 0.02, e * 0.028, 0, Math.PI * 2);
    }
    stift.fill();
    stift.fillStyle = '#d9a23a';
    stift.beginPath();
    stift.arc(fx, fy, e * 0.02, 0, Math.PI * 2);
    stift.fill();
  }
  stift.restore();
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
  flaeche(1.3, 'rgba(206, 192, 140, 0.55)'); // heller, nasser Sandsaum
  flaeche(1.24, 'rgb(58, 104, 128)'); // flaches Wasser am Rand
  flaeche(1.1, 'rgb(38, 76, 110)'); // tiefes Wasser
  flaeche(0.8, 'rgba(24, 56, 90, 0.45)'); // tiefer in der Mitte
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
  // Ein Glitzern daneben.
  stift.fillStyle = 'rgba(230, 245, 255, 0.35)';
  stift.beginPath();
  stift.arc(x + dx + e * 0.38, y + dy - e * 0.08, Math.max(0.6, e * 0.03), 0, Math.PI * 2);
  stift.fill();
  stift.restore();
}

function kreis(stift, x, y, r, farbe) {
  stift.beginPath();
  stift.arc(x, y, r, 0, Math.PI * 2);
  stift.fillStyle = farbe;
  stift.fill();
}

// Ein Ballen mit Licht von links oben: hell - Farbe - dunkel.
function ballen(stift, x, y, r, farbe, hell = 0.22, dunkel = -0.35) {
  const v = stift.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  v.addColorStop(0, ton(farbe, hell));
  v.addColorStop(0.6, farbe);
  v.addColorStop(1, ton(farbe, dunkel));
  kreis(stift, x, y, r, v);
}

function schatten(stift, x, y, rx) {
  stift.save();
  stift.translate(x, y);
  stift.scale(1, 0.45);
  const v = stift.createRadialGradient(0, 0, 0, 0, 0, rx);
  v.addColorStop(0, 'rgba(0, 0, 0, 0.34)');
  v.addColorStop(1, 'rgba(0, 0, 0, 0)');
  stift.fillStyle = v;
  stift.beginPath();
  stift.arc(0, 0, rx, 0, Math.PI * 2);
  stift.fill();
  stift.restore();
}

function stammZeichnen(stift, x, y, e, hoehe, breite) {
  const b = breite;
  const v = stift.createLinearGradient(x - b, 0, x + b, 0);
  v.addColorStop(0, '#7a5534');
  v.addColorStop(0.45, '#5a3d23');
  v.addColorStop(1, '#3a2615');
  stift.fillStyle = v;
  stift.beginPath();
  // Unten breiter, Wurzeln seitlich.
  stift.moveTo(x - b * 1.8, y);
  stift.quadraticCurveTo(x - b, y - hoehe * 0.1, x - b * 0.8, y - hoehe);
  stift.lineTo(x + b * 0.8, y - hoehe);
  stift.quadraticCurveTo(x + b, y - hoehe * 0.1, x + b * 1.8, y);
  stift.closePath();
  stift.fill();
  // Rinde: ein paar dunkle Striche.
  stift.strokeStyle = 'rgba(25, 15, 8, 0.5)';
  stift.lineWidth = Math.max(0.5, e * 0.02);
  for (const f of [-0.35, 0.25]) {
    stift.beginPath();
    stift.moveTo(x + b * f, y - hoehe * 0.15);
    stift.lineTo(x + b * f * 1.1, y - hoehe * 0.8);
    stift.stroke();
  }
}

// Ein Laubbaum: Stamm mit Rinde, Krone aus vielen Blattballen, hinten dunkel,
// vorn und oben links im Licht, dazu helle Blattflecken.
function laubbaum(stift, x, y, e, variante) {
  const s = streuung(variante, 1);
  const hoehe = e * (1.5 + s * 0.5);
  const breite = e * (0.72 + streuung(variante, 2) * 0.2);
  schatten(stift, x + e * 0.1, y, breite * 1.05);
  // Kurzer Stamm, die Krone traegt das Bild (Runde 29: lange Staemme mit
  // kleiner Krone sahen aus wie Luftballons).
  stammZeichnen(stift, x, y, e, hoehe * 0.38, e * 0.085);
  const gruen = ['#1c4225', '#25552e', '#2f6838', '#3f7e45'];
  const verschiebung = streuung(variante, 3) * 0.1 - 0.05;
  // Hinten und unten die dunklen Ballen, vorn oben die hellen.
  const ballenListe = [];
  for (let i = 0; i < 11; i++) {
    const w = streuung(variante, 100 + i) * Math.PI * 2;
    const r = 0.25 + streuung(variante, 120 + i) * 0.5;
    const dx = Math.cos(w) * r * breite;
    const dy = -hoehe * 0.7 + Math.sin(w) * r * breite * 0.75;
    const groesse = breite * (0.36 + streuung(variante, 140 + i) * 0.2);
    ballenListe.push({ dx, dy, groesse, hell: -dy / hoehe - dx / (breite * 4) });
  }
  ballenListe.sort((a, b) => a.hell - b.hell);
  ballenListe.forEach((b, i) => {
    const stufe = Math.min(gruen.length - 1, Math.floor((i / ballenListe.length) * gruen.length));
    ballen(stift, x + b.dx, y + b.dy, b.groesse, ton(gruen[stufe], verschiebung), 0.14, -0.35);
  });
  // Helle Blattflecken im Licht.
  for (let i = 0; i < 7; i++) {
    const fx = x - breite * 0.35 + streuung(variante, 160 + i) * breite * 0.7;
    const fy = y - hoehe * (0.78 + streuung(variante, 170 + i) * 0.22);
    kreis(stift, fx, fy, breite * 0.05, 'rgba(140, 190, 105, 0.35)');
  }
}

// Eine Tanne: Stufen aus Zweigen, jede Stufe mit Licht links und Schatten rechts.
function tanne(stift, x, y, e, variante) {
  const hoehe = e * (1.7 + streuung(variante, 1) * 0.5);
  const breite = e * (0.55 + streuung(variante, 2) * 0.15);
  schatten(stift, x + e * 0.1, y, breite * 1.05);
  stammZeichnen(stift, x, y, e, hoehe * 0.28, e * 0.06);
  const stufen = 4;
  for (let i = 0; i < stufen; i++) {
    const unten = y - hoehe * (0.18 + i * 0.19);
    const oben = unten - hoehe * 0.36;
    const b = breite * (1 - i * 0.2);
    const v = stift.createLinearGradient(x - b, oben, x + b, unten);
    v.addColorStop(0, '#3f7a47');
    v.addColorStop(0.5, '#2a5a32');
    v.addColorStop(1, '#173a20');
    stift.fillStyle = v;
    stift.beginPath();
    stift.moveTo(x, oben);
    stift.quadraticCurveTo(x - b * 0.5, unten - hoehe * 0.12, x - b, unten);
    // Gezackte Unterkante: Zweigspitzen.
    for (let z = 1; z <= 4; z++) {
      stift.lineTo(x - b + (z - 0.5) * (b / 2), unten - hoehe * 0.035);
      stift.lineTo(x - b + z * (b / 2), unten);
    }
    stift.quadraticCurveTo(x + b * 0.5, unten - hoehe * 0.12, x, oben);
    stift.closePath();
    stift.fill();
    stift.strokeStyle = 'rgba(12, 30, 16, 0.5)';
    stift.lineWidth = Math.max(0.5, e * 0.02);
    stift.stroke();
  }
}

function baum(stift, x, y, e, variante) {
  if (streuung(variante, 9) < 0.3) tanne(stift, x, y, e, variante);
  else laubbaum(stift, x, y, e, variante);
}

// Ein Strauch aus Blattballen, darauf rote Beeren mit Glanz.
function beerenstrauch(stift, x, y, e, variante) {
  const b = e * 0.85;
  schatten(stift, x + e * 0.05, y, b * 1.05);
  const ballenListe = [
    [-0.42, -0.4, 0.5, '#24502b'], [0.44, -0.38, 0.48, '#24502b'], [0, -0.3, 0.46, '#2c5a31'],
    [-0.2, -0.72, 0.5, '#336b38'], [0.26, -0.7, 0.46, '#3b7440'], [-0.05, -0.95, 0.34, '#4a8a4c'],
  ];
  for (const [dx, dy, r, farbe] of ballenListe) ballen(stift, x + dx * b, y + dy * b, r * b, farbe, 0.2, -0.3);
  // Einzelne Blattspitzen am Rand.
  stift.fillStyle = 'rgba(90, 150, 85, 0.6)';
  for (let i = 0; i < 6; i++) {
    const w = streuung(variante, 200 + i) * Math.PI * 2;
    kreis(stift, x + Math.cos(w) * b * 0.7, y - b * 0.55 + Math.sin(w) * b * 0.45, b * 0.07, 'rgba(90, 150, 85, 0.6)');
  }
  // Die Beeren sind das, woran man ihn erkennt: viele, hell, mit Glanzpunkt.
  const beere = Math.max(1.6, b * 0.12);
  for (let i = 0; i < 12; i++) {
    const w = streuung(variante, 10 + i) * Math.PI * 2;
    const r = (0.25 + streuung(variante, 20 + i) * 0.75) * b * 0.62;
    const bx = x + Math.cos(w) * r;
    const by = y - b * 0.6 + Math.sin(w) * r * 0.62;
    ballen(stift, bx, by, beere, '#d8354f', 0.25, -0.35);
    kreis(stift, bx - beere * 0.35, by - beere * 0.35, beere * 0.3, 'rgba(255, 225, 230, 0.85)');
  }
}

// Gold und Stein: kantige Brocken mit heller Oberseite, Verlauf auf der
// Flanke, Rissen und - beim Gold - Funkeln.
function brocken(stift, x, y, e, variante, hell, mittel, dunkel, glanz) {
  // Ein Haufen, der sein Feld fuellt - Gold und Stein liegen im Genre gross da.
  const b = e * 0.95;
  schatten(stift, x + e * 0.05, y + e * 0.05, b * 1.15);
  const teile = [[-0.5, -0.05, 0.5], [0.48, 0, 0.46], [-0.12, -0.3, 0.6], [0.28, -0.55, 0.42]];
  teile.forEach(([dx, dy, g], i) => {
    const k = b * g * (0.85 + streuung(variante, 30 + i) * 0.3);
    const cx = x + dx * b;
    const cy = y + dy * b;
    const umriss = [[cx - k, cy], [cx - k * 0.45, cy - k * 0.85], [cx + k * 0.55, cy - k * 0.7], [cx + k, cy - k * 0.05], [cx + k * 0.3, cy + k * 0.35], [cx - k * 0.6, cy + k * 0.3]];
    const flanke = stift.createLinearGradient(cx - k, cy - k, cx + k, cy + k * 0.4);
    flanke.addColorStop(0, hell);
    flanke.addColorStop(0.5, mittel);
    flanke.addColorStop(1, dunkel);
    stift.beginPath();
    stift.moveTo(umriss[0][0], umriss[0][1]);
    for (const [px, py] of umriss.slice(1)) stift.lineTo(px, py);
    stift.closePath();
    stift.fillStyle = flanke;
    stift.fill();
    stift.strokeStyle = 'rgba(20, 16, 12, 0.45)';
    stift.lineWidth = Math.max(0.5, e * 0.025);
    stift.stroke();
    // Oberseite im Licht.
    stift.beginPath();
    stift.moveTo(cx - k * 0.45, cy - k * 0.85);
    stift.lineTo(cx + k * 0.55, cy - k * 0.7);
    stift.lineTo(cx + k * 0.15, cy - k * 0.2);
    stift.lineTo(cx - k * 0.7, cy - k * 0.25);
    stift.closePath();
    stift.fillStyle = hell;
    stift.fill();
    // Schattenseite rechts unten.
    stift.beginPath();
    stift.moveTo(cx + k * 0.15, cy - k * 0.2);
    stift.lineTo(cx + k, cy - k * 0.05);
    stift.lineTo(cx + k * 0.3, cy + k * 0.35);
    stift.closePath();
    stift.fillStyle = dunkel;
    stift.fill();
    // Ein Riss und eine helle Kante.
    stift.strokeStyle = 'rgba(30, 24, 16, 0.45)';
    stift.lineWidth = Math.max(0.5, e * 0.02);
    stift.beginPath();
    stift.moveTo(cx - k * 0.2, cy - k * 0.5);
    stift.lineTo(cx + k * 0.05, cy - k * 0.1);
    stift.lineTo(cx - k * 0.1, cy + k * 0.2);
    stift.stroke();
    stift.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    stift.beginPath();
    stift.moveTo(cx - k * 0.45, cy - k * 0.85);
    stift.lineTo(cx + k * 0.55, cy - k * 0.7);
    stift.stroke();
  });
  if (glanz) {
    for (let i = 0; i < 2; i++) {
      const gx = x + (streuung(variante, 40 + i) - 0.5) * b;
      const gy = y - b * (0.3 + streuung(variante, 50 + i) * 0.5);
      const r = Math.max(1, b * 0.08);
      // Ein Funkeln als kleiner Stern.
      stift.strokeStyle = glanz;
      stift.lineWidth = Math.max(0.6, e * 0.025);
      stift.beginPath();
      stift.moveTo(gx - r, gy);
      stift.lineTo(gx + r, gy);
      stift.moveTo(gx, gy - r);
      stift.lineTo(gx, gy + r);
      stift.stroke();
      kreis(stift, gx, gy, r * 0.4, glanz);
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
  const variante = VARIANTE(index);
  if (art === WALD) baum(stift, x, y, g, variante);
  else if (art === BEERE) beerenstrauch(stift, x, y, g, variante);
  else if (art === GOLD) brocken(stift, x, y, g, variante, '#f6dc7a', '#d6a93a', '#9a7422', '#fffbe0');
  else if (art === STEIN) brocken(stift, x, y, g, variante, '#cdd1d6', '#9aa0a7', '#6a7077', null);
}

// Acht Gestalten je Art: genug Abwechslung, und das Bild jeder Gestalt laesst
// sich zwischenspeichern.
const VARIANTEN = 8;
const VARIANTE = (index) => Math.floor(streuung(index, 77) * VARIANTEN) * 131 + 17;

const ZWISCHENSPEICHER = new Map();
const SPEICHER_MAX = 400;

/**
 * Wie dingZeichnen, aber ueber einen Zwischenspeicher: jede Gestalt wird je
 * Zoomstufe und Fuellung (in Vierteln) einmal gezeichnet und dann kopiert.
 */
export function dingBildZeichnen(stift, art, x, y, e, index, fuellung = 1) {
  if (e < 12 || typeof document === 'undefined') {
    dingZeichnen(stift, art, x, y, e, index, fuellung);
    return;
  }
  const dichte = window.devicePixelRatio || 1;
  const viertel = Math.max(1, Math.round(fuellung * 4)) / 4;
  const variante = Math.floor(streuung(index, 77) * VARIANTEN);
  const schluessel = `${art}|${variante}|${e.toFixed(2)}|${viertel}|${dichte}`;
  const breite = 3.2 * e;
  const oben = 3 * e;
  const unten = 0.8 * e;
  let bild = ZWISCHENSPEICHER.get(schluessel);
  if (!bild) {
    bild = document.createElement('canvas');
    bild.width = Math.ceil(breite * dichte);
    bild.height = Math.ceil((oben + unten) * dichte);
    const s = bild.getContext('2d');
    s.scale(dichte, dichte);
    dingZeichnen(s, art, breite / 2, oben, e, index, viertel);
    ZWISCHENSPEICHER.set(schluessel, bild);
    if (ZWISCHENSPEICHER.size > SPEICHER_MAX) ZWISCHENSPEICHER.delete(ZWISCHENSPEICHER.keys().next().value);
  }
  stift.drawImage(bild, x - breite / 2, y - oben, breite, oben + unten);
}

function einfach(stift, art, x, y, g) {
  if (art === WALD) {
    kreis(stift, x, y - g * 1.1, g * 0.6, '#2f6a3a');
    kreis(stift, x - g * 0.2, y - g * 1.3, g * 0.25, '#3f7f46');
  } else if (art === BEERE) {
    kreis(stift, x, y - g * 0.5, g * 0.6, '#3b7440');
    kreis(stift, x, y - g * 0.55, g * 0.25, '#d8354f');
  } else {
    kreis(stift, x, y - g * 0.4, g * 0.7, art === GOLD ? '#e0b64a' : '#a2a8ae');
    kreis(stift, x - g * 0.2, y - g * 0.6, g * 0.25, art === GOLD ? '#f3d36a' : '#c3c7cc');
  }
}

export const DINGE = [WALD, BEERE, GOLD, STEIN];
