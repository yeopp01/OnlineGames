// Die Einheiten als Figuren (→ specs/10-strategie/darstellung.md AC-6, AC-12).
//
// Alles in Code gezeichnet, kein Bild aus fremder Quelle. Aufrecht in
// Dreiviertelansicht, wie man es aus dem Genre kennt.
//
// Eine Figur steht mit den Fuessen auf (x, y) und ist `hoehe` Bildpunkte hoch.
// Gezeichnet wird in einem Raster von 24 Einheiten Hoehe, das auf `hoehe`
// skaliert wird; `blick` -1 schaut nach links, 1 nach rechts.
//
// Gezeichnet statt flach (AC-12, Runde 27): jede grosse Flaeche bekommt Licht
// von links oben als Verlauf ueber drei Toene, dazu Falten, Maserung, Kette
// oder Wolle; der Umriss ist kraeftiger als die Linien innen. Unter
// Spielgroesse fallen die feinsten Striche weg (`fein`), sonst verschwimmen sie.
//
// Naturalistisch statt Comic (AC-13, Runde 38): der Kopf ist hoechstens ein
// Sechstel der Figur (KOPF_MASS), die Beine laenger, der Rumpf darueber um
// RUMPF_HEBEN hoeher; kein schwarzer Umriss, sondern eine zarte dunkelbraune
// Kante, und nichts Dunkles mehr fast schwarz - Stiefel, Hufe, Schafskoepfe
// sind dunkles Braun.

const HAUT = '#e2b48c';
const HAAR = '#5b3a24';
const LEDER = '#6b4a2e';
const HOSE = '#5c5246';
const STIEFEL = '#54402e';
const EISEN = '#b9c0c8';
const EISEN_DUNKEL = '#7d858e';
const HOLZ = '#8a5a2b';
const STROH = '#d8b978';
const KONTUR = 'rgba(46, 34, 24, 0.5)';
const AUGE = '#3a3028';
// Kopf auf gut die Haelfte der Comic-Groesse; Beine 1,3-mal so lang, der
// Rumpf sitzt entsprechend hoeher.
const KOPF_MASS = 0.6;
const BEIN_MASS = 1.3;
const RUMPF_HEBEN = 2.1;
const RUMPF_BREITE = 0.82;
const FEIN = 'rgba(20, 16, 12, 0.45)';

const WAREN = {
  h: { name: 'Holz' },
  n: { name: 'Nahrung' },
  g: { name: 'Gold' },
  s: { name: 'Stein' },
};

function kanaele(farbe) {
  if (farbe.startsWith('#')) {
    const zahl = parseInt(farbe.slice(1), 16);
    return [(zahl >> 16) & 255, (zahl >> 8) & 255, zahl & 255];
  }
  const m = farbe.match(/\d+/g);
  return m ? m.slice(0, 3).map(Number) : [128, 128, 128];
}

/** Farbe aufhellen (anteil > 0) oder abdunkeln (anteil < 0). Nimmt #rrggbb und rgb(). */
export function toenen(farbe, anteil) {
  const ziel = anteil < 0 ? 0 : 255;
  const a = Math.abs(anteil);
  const [r, g, b] = kanaele(farbe).map((wert) => Math.round(wert + (ziel - wert) * a));
  return `rgb(${r}, ${g}, ${b})`;
}

// Licht von links oben: hell - Farbe - dunkel, ueber die Flaeche von (x0, y0)
// nach (x1, y1).
function licht(stift, farbe, x0, y0, x1, y1, hell = 0.16, dunkel = -0.22) {
  const verlauf = stift.createLinearGradient(x0, y0, x1, y1);
  verlauf.addColorStop(0, toenen(farbe, hell));
  verlauf.addColorStop(0.5, farbe);
  verlauf.addColorStop(1, toenen(farbe, dunkel));
  return verlauf;
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

// Eine weiche Form: durch die Mitten der Kanten, die Ecken als Kontrollpunkte.
function rund(stift, punkte, fuellung, kontur = true) {
  const n = punkte.length;
  const mitte = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  stift.beginPath();
  const start = mitte(punkte[n - 1], punkte[0]);
  stift.moveTo(start[0], start[1]);
  for (let i = 0; i < n; i++) {
    const p = punkte[i];
    const q = mitte(p, punkte[(i + 1) % n]);
    stift.quadraticCurveTo(p[0], p[1], q[0], q[1]);
  }
  stift.closePath();
  stift.fillStyle = fuellung;
  stift.fill();
  if (kontur) stift.stroke();
}

// Ein feiner Strich fuer Falten, Maserung und Naehte.
function strich(stift, punkte, farbe = FEIN, breite = 0.45) {
  stift.save();
  stift.beginPath();
  stift.moveTo(punkte[0][0], punkte[0][1]);
  for (const [x, y] of punkte.slice(1)) stift.lineTo(x, y);
  stift.strokeStyle = farbe;
  stift.lineWidth = breite;
  stift.lineCap = 'round';
  stift.stroke();
  stift.restore();
}

function glanz(stift, x, y, rx, ry, staerke = 0.55) {
  stift.save();
  stift.globalAlpha = staerke;
  ellipse(stift, x, y, rx, ry, '#ffffff', false);
  stift.restore();
}

function schatten(stift, breite) {
  stift.save();
  const weich = stift.createRadialGradient(0, 0, 0, 0, 0, breite);
  weich.addColorStop(0, 'rgba(0, 0, 0, 0.38)');
  weich.addColorStop(1, 'rgba(0, 0, 0, 0)');
  stift.fillStyle = weich;
  stift.scale(1, 0.38);
  stift.beginPath();
  stift.arc(0, 0, breite, 0, Math.PI * 2);
  stift.fill();
  stift.restore();
}

// Der Umriss kraeftiger als die Linien innen: dieselbe Form noch einmal mit
// dickerem Strich unter die Fuellung legen.
function umriss(stift, zeichnen) {
  stift.save();
  const breite = stift.lineWidth;
  stift.lineWidth = breite * 1.4;
  stift.strokeStyle = KONTUR;
  zeichnen();
  stift.restore();
}

// Beine im Schritt: `schritt` ist eine Phase in Bogenmass, 0 heisst Stillstand.
function beine(stift, schritt, farbe = HOSE, fein = true) {
  stift.save();
  stift.scale(1, BEIN_MASS);
  beineZeichnen(stift, schritt, farbe, fein);
  stift.restore();
}

function beineZeichnen(stift, schritt, farbe, fein) {
  const aus = Math.sin(schritt) * 2.2;
  // Hinteres Bein dunkler, vorderes im Licht; Stiefel mit hellem Rand.
  const hinten = [[0.4 - aus, 0], [2.7 - aus, 0], [2.9, -7], [0.3, -7]];
  const vorn = [[-2.7 + aus, 0], [-0.3 + aus, 0], [-0.2, -7], [-2.9, -7]];
  vieleck(stift, hinten, licht(stift, toenen(farbe, -0.22), 0, -7, 3, 0));
  vieleck(stift, vorn, licht(stift, farbe, -3, -7, 0, 0));
  for (const [x, dunkel] of [[1.55 - aus, -0.3], [-1.5 + aus, 0]]) {
    rund(stift, [[x - 1.6, 0.3], [x + 1.9, 0.3], [x + 1.7, -1.9], [x - 1.4, -2.1]], toenen(STIEFEL, dunkel));
    if (fein) strich(stift, [[x - 1.2, -1.7], [x + 1.4, -1.6]], 'rgba(255,230,200,0.25)', 0.4);
  }
  if (fein) {
    strich(stift, [[-1.6 + aus * 0.5, -6.5], [-1.4 + aus * 0.7, -3]]);
    strich(stift, [[1.6 - aus * 0.5, -6.5], [1.5 - aus * 0.7, -3]], 'rgba(0,0,0,0.3)');
  }
}

function kopf(stift, y, { hut = null, helm = false, kappe = null, topfhelm = false, fein = true, haut = HAUT } = {}) {
  // Um die Mitte des Gesichts verkleinert; der Kopf sitzt mit dem Kinn auf den
  // Schultern (RUMPF_HEBEN).
  stift.save();
  stift.translate(0.6, y + 3.3);
  stift.scale(KOPF_MASS, KOPF_MASS);
  stift.translate(-0.6, -y - 3.3);
  kopfZeichnen(stift, y, { hut, helm, kappe, topfhelm, fein, haut });
  stift.restore();
}

function kopfZeichnen(stift, y, { hut, helm, kappe, topfhelm, fein, haut }) {
  const HAUT = haut;
  // Ohr hinten, dann das Gesicht mit Licht von links oben.
  ellipse(stift, -2.1, y + 0.2, 0.9, 1.2, toenen(HAUT, -0.15));
  umriss(stift, () => { stift.beginPath(); stift.ellipse(0.6, y, 3.1, 3.3, 0, 0, Math.PI * 2); stift.stroke(); });
  ellipse(stift, 0.6, y, 3.1, 3.3, licht(stift, HAUT, -2, y - 3, 3, y + 3, 0.18, -0.18), false);
  // Nase und Wange.
  vieleck(stift, [[3.4, y - 0.4], [4.35, y + 1], [3.4, y + 1.3]], toenen(HAUT, -0.12), false);
  if (fein) {
    stift.save();
    stift.globalAlpha = 0.28;
    ellipse(stift, 2.1, y + 1.4, 0.9, 0.6, '#d0685a', false);
    stift.restore();
  }
  if (helm) {
    const form = [[-3.5, y - 0.3], [3.9, y - 0.3], [3.2, y - 3.7], [0.3, y - 5.1], [-2.8, y - 3.7]];
    rund(stift, form, licht(stift, EISEN, -3, y - 5, 4, y), true);
    // Nasenschutz, Nieten, ein Lichtstreif.
    vieleck(stift, [[2.4, y - 0.4], [3.1, y - 0.4], [2.9, y + 2.2], [2.5, y + 2.2]], EISEN_DUNKEL, false);
    if (fein) {
      for (const nx of [-2.2, 0.2, 2.6]) ellipse(stift, nx, y - 1.1, 0.32, 0.32, '#5c636b', false);
      strich(stift, [[-1.4, y - 4], [0.6, y - 4.7]], 'rgba(255,255,255,0.6)', 0.6);
    }
  } else if (topfhelm) {
    // Nur die Kettenhaube um das Gesicht; der Helm kommt ganz zuletzt, weil
    // er das Gesicht zudeckt (einheiten AC-24).
    ellipse(stift, 0.3, y + 0.4, 4.3, 4.5, licht(stift, EISEN_DUNKEL, -4, y - 4, 4.6, y + 4.9, 0.2, -0.22), false);
  } else if (kappe) {
    // Eine schlichte Kappe ohne Krempe: anliegend, mit Stirnband - so sieht
    // man auf einen Blick, dass es kein Strohhut und kein Helm ist.
    ellipse(stift, 0.2, y - 2.1, 3.1, 1.7, HAAR, false);
    rund(stift, [[-3.2, y - 1], [3.7, y - 1], [3.2, y - 4.2], [0.3, y - 5.1], [-2.6, y - 4.2]],
      licht(stift, kappe, -3.2, y - 5.1, 3.7, y - 1, 0.22, -0.26), true);
    if (fein) {
      strich(stift, [[-3.1, y - 1.4], [3.5, y - 1.4]], 'rgba(40,30,18,0.45)', 0.6);
      strich(stift, [[-1.6, y - 4.3], [1, y - 4.8]], 'rgba(255,255,255,0.3)', 0.5);
    }
  } else if (hut) {
    // Haar lugt unter dem Hut hervor.
    ellipse(stift, -1.2, y - 1.3, 2.2, 1.3, HAAR, false);
    ellipse(stift, 0.4, y - 2.3, 4.8, 1.35, licht(stift, hut, -4, y - 3, 5, y - 1), true);
    rund(stift, [[-2.3, y - 2.4], [3, y - 2.4], [2.6, y - 5.2], [-1.8, y - 5.2]], licht(stift, toenen(hut, -0.05), -2, y - 5, 3, y - 2), true);
    // Hutband und Strohgeflecht.
    vieleck(stift, [[-2.3, y - 2.5], [3, y - 2.5], [2.95, y - 3.2], [-2.25, y - 3.2]], '#7a4e2a', false);
    if (fein) {
      for (const sx of [-3.4, -1.6, 0.4, 2.4, 4.1]) strich(stift, [[sx, y - 2.8], [sx + 0.5, y - 1.4]], 'rgba(90,60,20,0.45)', 0.35);
    }
  } else {
    ellipse(stift, 0.2, y - 2.1, 3.1, 1.8, HAAR, false);
  }
  // Der Topfhelm deckt das Gesicht zu - dann gibt es auch kein Auge.
  if (topfhelm) {
    const form = [[-3.5, y - 5.4], [4.2, y - 5.4], [4, y + 2.4], [0.4, y + 3.4], [-3.2, y + 2.4]];
    umriss(stift, () => vieleck(stift, form, 'rgba(0,0,0,0)', true));
    vieleck(stift, form, licht(stift, EISEN, -3.5, y - 5.4, 4.2, y + 3.4, 0.3, -0.3), false);
    // Sehschlitz, Mittelband und Luftloecher.
    vieleck(stift, [[-3.3, y - 1.9], [4.1, y - 1.9], [4.1, y - 0.7], [-3.3, y - 0.7]], '#464d56', false);
    vieleck(stift, [[1.2, y - 5.3], [2.3, y - 5.3], [2.25, y + 3], [1.15, y + 3]], toenen(EISEN, 0.12), false);
    if (fein) {
      for (const hy of [y + 0.7, y + 1.8]) for (const hx of [2.9, 3.5]) ellipse(stift, hx, hy, 0.25, 0.25, '#5c636b', false);
      strich(stift, [[-3.1, y - 4.9], [3.8, y - 4.9]], 'rgba(255,255,255,0.5)', 0.6);
      strich(stift, [[-2.8, y - 5.2], [-2.6, y + 2]], 'rgba(70,78,88,0.5)', 0.5);
    }
    return;
  }
  // Das Auge in Blickrichtung, mit Braue und Lichtpunkt.
  ellipse(stift, 2.55, y - 0.15, 0.62, 0.72, '#f4efe6', false);
  ellipse(stift, 2.8, y - 0.1, 0.42, 0.5, AUGE, false);
  if (fein) {
    glanz(stift, 2.95, y - 0.35, 0.14, 0.14, 0.9);
    strich(stift, [[1.8, y - 1.2], [3.2, y - 1.35]], 'rgba(60,40,25,0.8)', 0.45);
  }
}

function holzscheit(stift, laenge, fein) {
  vieleck(stift, [[-laenge / 2, -1.1], [laenge / 2, -1.1], [laenge / 2, 1.1], [-laenge / 2, 1.1]], licht(stift, HOLZ, 0, -1.1, 0, 1.1, 0.2, -0.3));
  if (fein) strich(stift, [[-laenge / 2 + 1, -0.2], [laenge / 2 - 1.5, 0.1]], 'rgba(40,20,5,0.5)', 0.35);
  ellipse(stift, laenge / 2, 0, 0.95, 1.1, '#d9b27a');
  if (fein) ellipse(stift, laenge / 2, 0, 0.45, 0.55, 'rgba(150,100,50,0.7)', false);
}

function ladungZeichnen(stift, ware, fein) {
  if (ware === 'h') {
    // Ein Buendel Holz auf dem Ruecken, verschnuert.
    for (const [dy, laenge] of [[-15.5, 8], [-13, 7.5], [-10.5, 8.5]]) {
      stift.save();
      stift.translate(-5.2, dy);
      stift.rotate(-0.35);
      holzscheit(stift, laenge, fein);
      stift.restore();
    }
    strich(stift, [[-7.2, -16.4], [-6, -9.4]], '#5a4030', 0.7);
  } else if (ware === 'n') {
    // Ein geflochtener Korb mit Beeren.
    const korb = [[-9, -13.5], [-2.5, -13.5], [-3.3, -8.5], [-8.2, -8.5]];
    vieleck(stift, korb, licht(stift, '#b48a4e', -9, -13.5, -3, -8.5));
    if (fein) {
      for (const ky of [-12.2, -10.8, -9.5]) strich(stift, [[-8.7, ky], [-2.9, ky]], 'rgba(90,60,25,0.55)', 0.4);
      for (const kx of [-7.2, -5.7, -4.2]) strich(stift, [[kx, -13.3], [kx + 0.2, -8.7]], 'rgba(90,60,25,0.4)', 0.35);
    }
    for (const [bx, by] of [[-7.6, -14.2], [-5.7, -15], [-3.9, -14.2], [-6.6, -12.8], [-4.6, -12.8]]) {
      ellipse(stift, bx, by, 1.15, 1.15, licht(stift, '#c8324a', bx - 1, by - 1, bx + 1, by + 1, 0.25, -0.3), false);
      if (fein) glanz(stift, bx - 0.35, by - 0.4, 0.3, 0.25, 0.7);
    }
  } else if (ware === 'g' || ware === 's') {
    vieleck(stift, [[-9, -13.5], [-2.5, -13.5], [-3.3, -8.5], [-8.2, -8.5]], licht(stift, LEDER, -9, -13.5, -3, -8.5));
    const brocken = ware === 'g' ? '#e8c14a' : '#9aa0a6';
    for (const [bx, by] of [[-7.2, -14.3], [-5, -14.8], [-4.4, -13]]) {
      vieleck(stift, [[bx - 1.3, by + 0.8], [bx, by - 1.2], [bx + 1.4, by + 0.6]], licht(stift, brocken, bx - 1, by - 1, bx + 1, by + 1, 0.3, -0.3));
      if (fein) glanz(stift, bx - 0.2, by - 0.4, 0.3, 0.2, 0.8);
    }
  }
}

function dorfbewohner(stift, farbe, { ladung = null, schritt = 0, fein = true, haut = HAUT, arbeit = 0 }) {
  schatten(stift, 5.5);
  stift.save();
  stift.translate(0, -RUMPF_HEBEN);
  ladungZeichnen(stift, ladung, fein);
  stift.restore();
  beine(stift, schritt, HOSE, fein);
  stift.save();
  // Beim Arbeiten beugt sich der Oberkoerper vor und zurueck.
  stift.translate(arbeit ? Math.sin(arbeit) * 0.7 : 0, -RUMPF_HEBEN + (arbeit ? Math.abs(Math.sin(arbeit)) * 0.5 : 0));
  // Schmaler: Schultern etwa zwei Kopfbreiten, nicht vier.
  stift.scale(RUMPF_BREITE, 1);
  // Hinterer Arm im Schatten.
  rund(stift, [[-4.2, -15.8], [-2.8, -15.8], [-3.2, -10.6], [-4.6, -10.8]], toenen(farbe, -0.3));
  // Kittel in Spielerfarbe, weich geschnitten, mit Licht und Falten.
  const kittel = [[-4.4, -6.3], [4.6, -6.3], [3.9, -15.6], [3, -17.2], [-2.4, -17.2], [-3.6, -15.6]];
  umriss(stift, () => rund(stift, kittel, 'rgba(0,0,0,0)', true));
  rund(stift, kittel, licht(stift, farbe, -4, -17, 4, -6), false);
  if (fein) {
    strich(stift, [[-1.2, -9], [-1.8, -6.6]]);
    strich(stift, [[1.8, -9], [2.4, -6.6]]);
    strich(stift, [[-0.2, -16.2], [0.4, -13.2]], 'rgba(0,0,0,0.25)');
    // Saum etwas dunkler.
    strich(stift, [[-4.4, -6.9], [4.6, -6.9]], toenen(farbe, -0.35), 0.7);
  }
  // Guertel mit Messingschnalle.
  vieleck(stift, [[-4, -10.3], [4.2, -10.3], [4.1, -9], [-4.1, -9]], licht(stift, LEDER, 0, -10.3, 0, -9), false);
  vieleck(stift, [[0.6, -10.5], [1.9, -10.5], [1.9, -8.8], [0.6, -8.8]], '#c9a24a', false);
  kopf(stift, -19.6, { hut: STROH, fein, haut });
  // Werkzeug: ohne Ladung haelt er die Axt gesenkt in der vorderen Hand,
  // das Blatt vor den Beinen - nie vor dem Gesicht.
  if (!ladung) {
    stift.save();
    stift.translate(4.2, -11.4);
    // Beim Arbeiten holt er aus und schlaegt zu (bedienung AC-31); sonst haengt
    // die Axt nur leicht mit dem Schritt.
    stift.rotate(arbeit ? 2.0 + Math.sin(arbeit) * 0.85 : 2.55 + Math.sin(schritt) * 0.12);
    vieleck(stift, [[-0.6, 1.5], [0.6, 1.5], [0.6, -10], [-0.6, -10]], licht(stift, HOLZ, -0.6, 0, 0.6, 0, 0.25, -0.3));
    if (fein) strich(stift, [[0, 0.5], [0.1, -9]], 'rgba(50,25,5,0.45)', 0.3);
    vieleck(stift, [[0.4, -10.4], [4, -11.6], [4.4, -7.4], [0.4, -8]], licht(stift, EISEN, 0.4, -11.6, 4.4, -7.4, 0.25, -0.35));
    if (fein) strich(stift, [[3.9, -11.2], [4.2, -7.8]], 'rgba(255,255,255,0.8)', 0.45);
    stift.restore();
  }
  // Vorderer Arm und Hand.
  rund(stift, [[2.4, -16.2], [4.2, -15.6], [4.9, -11.6], [3.3, -11.2]], licht(stift, farbe, 2, -16, 5, -11, 0.2, -0.15));
  ellipse(stift, 4, -11.2, 1.1, 1.2, licht(stift, haut, 3, -12.5, 5, -10, 0.15, -0.2));
  stift.restore();
}

// Kettenhemd: kleine Boegen in Reihen.
function kette(stift, x0, x1, y0, y1) {
  stift.save();
  stift.strokeStyle = 'rgba(40,45,50,0.55)';
  stift.lineWidth = 0.3;
  for (let y = y0; y <= y1; y += 0.9) {
    const versatz = Math.round((y - y0) / 0.9) % 2 ? 0.5 : 0;
    for (let x = x0 + versatz; x <= x1; x += 1) {
      stift.beginPath();
      stift.arc(x, y, 0.45, 0, Math.PI);
      stift.stroke();
    }
  }
  stift.restore();
}

function miliz(stift, farbe, { schritt = 0, fein = true, haut = HAUT }) {
  schatten(stift, 6);
  beine(stift, schritt, HOSE, fein);
  stift.save();
  stift.translate(0, -RUMPF_HEBEN);
  // Schmaler: Schultern etwa zwei Kopfbreiten, nicht vier.
  stift.scale(RUMPF_BREITE, 1);
  // Schwert erhoben hinter dem Koerper: Klinge mit Hohlkehle, Parierstange, Knauf.
  stift.save();
  stift.translate(4.4, -12.5);
  stift.rotate(0.35);
  vieleck(stift, [[-0.85, 0], [0.85, 0], [0.55, -11.5], [0, -13.2], [-0.55, -11.5]], licht(stift, EISEN, -0.8, 0, 0.8, 0, 0.35, -0.3));
  if (fein) strich(stift, [[0, -0.6], [0, -11]], 'rgba(70,78,88,0.8)', 0.3);
  vieleck(stift, [[-2.5, 0.3], [2.5, 0.3], [2.5, 1.3], [-2.5, 1.3]], licht(stift, '#8a7432', 0, 0.3, 0, 1.3));
  vieleck(stift, [[-0.5, 1.3], [0.5, 1.3], [0.5, 3.4], [-0.5, 3.4]], LEDER, false);
  ellipse(stift, 0, 3.8, 0.7, 0.7, '#c9a24a');
  stift.restore();
  // Kettenhemd unter dem Waffenrock in Spielerfarbe.
  const hemd = [[-4.9, -6.4], [5.1, -6.4], [4.1, -17.2], [0.2, -17.8], [-3.9, -17.2]];
  umriss(stift, () => rund(stift, hemd, 'rgba(0,0,0,0)', true));
  rund(stift, hemd, licht(stift, EISEN_DUNKEL, -4, -17, 5, -6, 0.25, -0.25), false);
  if (fein) kette(stift, -4.4, 4.6, -16.4, -7);
  const rock = [[-3.8, -6.8], [4, -6.8], [3.2, -16.5], [-2.8, -16.5]];
  vieleck(stift, rock, licht(stift, farbe, -3, -16.5, 4, -7), true);
  if (fein) {
    // Saum und ein aufgenaehtes Kreuz in hellerem Ton.
    strich(stift, [[-3.5, -7.4], [3.8, -7.4]], toenen(farbe, 0.45), 0.6);
    strich(stift, [[0.4, -15.3], [0.4, -11.3]], toenen(farbe, 0.4), 0.7);
    strich(stift, [[-1.2, -14], [2, -14]], toenen(farbe, 0.4), 0.7);
  }
  vieleck(stift, [[-4.2, -10.4], [4.4, -10.4], [4.3, -9.2], [-4.3, -9.2]], licht(stift, LEDER, 0, -10.4, 0, -9.2), false);
  kopf(stift, -19.8, { helm: true, fein, haut });
  ellipse(stift, 4.4, -12.4, 1.1, 1.2, licht(stift, haut, 3.4, -13.5, 5.4, -11, 0.15, -0.2));
  // Schild vorn: Holz mit Beschlag, in Spielerfarbe bemalt, heller Rand, Buckel.
  const schild = [[-6.8, -15.5], [-0.4, -15.5], [-0.6, -9.5], [-3.6, -6.6], [-6.6, -9.5]];
  umriss(stift, () => vieleck(stift, schild, 'rgba(0,0,0,0)', true));
  vieleck(stift, schild, licht(stift, toenen(farbe, 0.05), -6.8, -15.5, -0.4, -7, 0.22, -0.28), false);
  stift.save();
  stift.strokeStyle = toenen(farbe, 0.55);
  stift.lineWidth = 0.8;
  vieleck(stift, [[-6, -14.8], [-1.2, -14.8], [-1.3, -9.8], [-3.6, -7.6], [-5.9, -9.8]], 'rgba(0,0,0,0)');
  stift.restore();
  ellipse(stift, -3.6, -11.8, 1.15, 1.15, licht(stift, EISEN, -4.6, -12.8, -2.6, -10.8, 0.4, -0.3));
  if (fein) {
    glanz(stift, -4, -12.3, 0.35, 0.3, 0.9);
    for (const [nx, ny] of [[-6, -14.6], [-1.2, -14.6], [-3.6, -7.8]]) ellipse(stift, nx, ny, 0.3, 0.3, '#5c636b', false);
  }
  stift.restore();
}

// Der Soldat: die zweite Stufe der Miliz (einheiten AC-24). Er muss sich von
// ihr auf einem Drittel der Flaeche unterscheiden, deshalb drei Aenderungen
// auf einmal statt einer Kleinigkeit: kein Schild, dafuer eine zweihaendige
// Streitaxt quer vor dem Koerper, ein Kettenhemd ueber den ganzen Rumpf mit
// nur noch kurzem Waffenrock in Spielerfarbe, und der Eisenhut statt des
// anliegenden Helms.
function soldat(stift, farbe, { schritt = 0, fein = true, haut = HAUT }) {
  schatten(stift, 6);
  beine(stift, schritt, HOSE, fein);
  stift.save();
  stift.translate(0, -RUMPF_HEBEN);
  stift.scale(RUMPF_BREITE, 1);
  // Die Axt in einem eigenen, gedrehten Rahmen: so sitzt das Blatt sicher am
  // Stiel. Beim ersten Versuch stand es daneben in der Luft (Runde 61).
  stift.save();
  stift.translate(-5.5, -4.1);
  stift.rotate(0.648); // dieselbe Neigung wie der Stiel vor dem Koerper
  const stiel = [[-0.55, 0.9], [0.55, 0.9], [0.55, -20.6], [-0.55, -20.6]];
  umriss(stift, () => vieleck(stift, stiel, 'rgba(0,0,0,0)', true));
  vieleck(stift, stiel, licht(stift, LEDER, -0.6, -20, 0.6, 0, 0.25, -0.25), false);
  const blatt = [[0.2, -15.8], [0.7, -20.2], [3.5, -21.1], [4.9, -18.4], [3.3, -14.6]];
  umriss(stift, () => vieleck(stift, blatt, 'rgba(0,0,0,0)', true));
  vieleck(stift, blatt, licht(stift, EISEN, 0.2, -21, 4.9, -14.6, 0.35, -0.3), false);
  if (fein) {
    strich(stift, [[3.6, -20.8], [4.7, -18.5]], 'rgba(255,255,255,0.65)', 0.7);
    strich(stift, [[1.3, -16], [1.6, -19.6]], 'rgba(70,78,88,0.6)', 0.4);
  }
  // Spitze ueber dem Blatt.
  vieleck(stift, [[-0.5, -20.3], [0.6, -20.5], [0.1, -23.4]], licht(stift, EISEN, 0, -23, 0.6, -20.3), false);
  stift.restore();
  // Kettenhemd ueber den ganzen Rumpf, bis auf die Schenkel.
  const hemd = [[-5.1, -5.2], [5.3, -5.2], [4.1, -17.2], [0.2, -17.8], [-3.9, -17.2]];
  umriss(stift, () => rund(stift, hemd, 'rgba(0,0,0,0)', true));
  rund(stift, hemd, licht(stift, EISEN_DUNKEL, -4.4, -17, 5.3, -5, 0.25, -0.25), false);
  if (fein) kette(stift, -4.6, 4.8, -16.4, -5.8);
  // Kurzer Waffenrock: nur ein Band in Spielerfarbe, damit man die Seite
  // trotz des Kettenhemds sofort sieht.
  const rock = [[-4.6, -6.2], [4.8, -6.2], [4.2, -11.6], [-4, -11.6]];
  vieleck(stift, rock, licht(stift, farbe, -4, -11.6, 4.8, -6.2), true);
  if (fein) {
    strich(stift, [[-4.4, -6.8], [4.6, -6.8]], toenen(farbe, 0.45), 0.6);
    strich(stift, [[0.3, -10.9], [0.3, -7.6]], toenen(farbe, 0.4), 0.7);
  }
  // Breiter Guertel mit Schnalle.
  vieleck(stift, [[-4.8, -12.8], [5, -12.8], [4.9, -11.2], [-4.7, -11.2]], licht(stift, LEDER, 0, -12.8, 0, -11.2), false);
  ellipse(stift, -2.6, -12, 0.85, 0.85, '#c9a24a', false);
  kopf(stift, -19.8, { topfhelm: true, fein, haut });
  // Der Stiel noch einmal vor dem Koerper, zwischen den Haenden - sonst
  // greifen sie ins Leere (Runde 61 beim Ansehen gefunden).
  const vorn = [[-5.5, -4.1], [-4.6, -4.9], [3.4, -15.7], [2.5, -14.9]];
  umriss(stift, () => vieleck(stift, vorn, 'rgba(0,0,0,0)', true));
  vieleck(stift, vorn, licht(stift, LEDER, -5, -4, 3.4, -15.7, 0.3, -0.2), false);
  // Beide Haende am Stiel - eine Zweihandwaffe haelt man nicht einarmig.
  for (const [hx, hy] of [[-2.4, -8.1], [1.9, -13.9]]) {
    ellipse(stift, hx, hy, 1.1, 1.15, licht(stift, haut, hx - 1, hy - 1.1, hx + 1, hy + 1.1, 0.15, -0.2));
  }
  stift.restore();
}

function spaeherreiter(stift, farbe, { schritt = 0, fein = true, haut = HAUT }) {
  schatten(stift, 10);
  const PFERD = '#8b5a33';
  const MAEHNE = '#56402c';
  const aus = Math.sin(schritt) * 1.8;
  // Hintere Beine (dunkler), dann Schweif, Rumpf, vordere Beine.
  for (const [x, phase] of [[-5.2, -aus], [5.6, aus]]) {
    vieleck(stift, [[x - 1 + phase, 0], [x + 0.9 + phase, 0], [x + 1.2, -7], [x - 1.2, -7]], licht(stift, toenen(PFERD, -0.35), x - 1, -7, x + 1, 0));
    vieleck(stift, [[x - 1.1 + phase, 0], [x + 1 + phase, 0], [x + 0.9 + phase, -1.1], [x - 1 + phase, -1.1]], '#4a3e34', false);
  }
  // Schweif aus Straehnen.
  rund(stift, [[-8.6, -11.2], [-12.2, -6], [-11.4, -3.6], [-9.4, -4.6], [-7.4, -9.2]], licht(stift, MAEHNE, -12, -11, -7, -4, 0.2, -0.2));
  if (fein) {
    strich(stift, [[-8.8, -10.2], [-11.2, -5]], 'rgba(120,85,55,0.55)', 0.35);
    strich(stift, [[-8.2, -9.6], [-10.2, -4.4]], 'rgba(120,85,55,0.45)', 0.35);
  }
  // Rumpf: rund, vorn die Brust hoeher, Licht von oben.
  const rumpf = [[-9.2, -10.2], [-7.8, -13.6], [4.6, -14.2], [8.8, -12.4], [9.2, -8.4], [6.4, -6.4], [-7, -6.6]];
  umriss(stift, () => rund(stift, rumpf, 'rgba(0,0,0,0)', true));
  rund(stift, rumpf, licht(stift, PFERD, 0, -14, 2, -6, 0.22, -0.3), false);
  if (fein) {
    // Muskel an Schulter und Keule, Glanz auf dem Ruecken.
    strich(stift, [[5.2, -12.4], [6.4, -8.8], [5.4, -7]], 'rgba(40,20,5,0.4)', 0.45);
    strich(stift, [[-5.6, -12.6], [-6.8, -9], [-5.8, -7]], 'rgba(40,20,5,0.4)', 0.45);
    glanz(stift, -1, -12.9, 4.2, 0.55, 0.22);
  }
  for (const [x, phase] of [[-7, aus], [7.4, -aus]]) {
    vieleck(stift, [[x - 1 + phase, 0], [x + 1 + phase, 0], [x + 1.2, -7.4], [x - 1.2, -7.4]], licht(stift, toenen(PFERD, -0.12), x - 1, -7, x + 1, 0));
    vieleck(stift, [[x - 1.1 + phase, 0], [x + 1.1 + phase, 0], [x + 1 + phase, -1.2], [x - 1 + phase, -1.2]], '#4e4238', false);
  }
  // Hals und Kopf mit Maehne, Ohr, Auge, Nuestern und Zaumzeug.
  rund(stift, [[4.8, -12.4], [7.8, -19.8], [11.8, -19.8], [10.8, -10.4]], licht(stift, PFERD, 6, -20, 11, -11, 0.2, -0.25));
  rund(stift, [[8.2, -21.2], [15.8, -18.4], [15.6, -15.2], [10, -15.4]], licht(stift, PFERD, 9, -21, 15, -15, 0.22, -0.2));
  vieleck(stift, [[8.8, -20.6], [9.4, -23.4], [10.9, -20.8]], toenen(PFERD, -0.2));
  rund(stift, [[4.6, -12.8], [7.4, -20.8], [9.4, -21], [6.8, -12.2]], licht(stift, MAEHNE, 5, -21, 9, -12, 0.2, -0.2), false);
  if (fein) {
    for (const t of [0.25, 0.5, 0.75]) strich(stift, [[5.2 + t * 2.4, -13.4 - t * 6.6], [6.2 + t * 2.6, -13 - t * 6.8]], 'rgba(120,85,55,0.5)', 0.3);
  }
  ellipse(stift, 12.6, -18.7, 0.55, 0.6, AUGE, false);
  if (fein) glanz(stift, 12.75, -18.9, 0.15, 0.15, 0.9);
  ellipse(stift, 15, -16.1, 0.45, 0.35, '#4a3426', false);
  // Zaumzeug in Spielerfarbe.
  strich(stift, [[10.2, -20], [14.8, -17.6], [14.6, -15.6]], toenen(farbe, -0.1), 0.65);
  // Sattel mit Decke in Spielerfarbe, Decke mit hellem Rand.
  vieleck(stift, [[-4.8, -14.4], [3.6, -14.4], [4, -8.6], [-5.2, -8.6]], licht(stift, farbe, -5, -14.4, 4, -8.6), true);
  if (fein) strich(stift, [[-4.9, -9.3], [3.9, -9.3]], toenen(farbe, 0.5), 0.6);
  vieleck(stift, [[-3.2, -15.2], [2.6, -15.2], [2.4, -13.6], [-3, -13.6]], licht(stift, LEDER, 0, -15.2, 0, -13.6), false);
  // Reiter sitzt: Bein am Pferd mit Stiefel, Oberkoerper aufrecht.
  vieleck(stift, [[-0.6, -14.4], [2.2, -14.4], [2.8, -8.2], [0.8, -8.2]], licht(stift, HOSE, -0.6, -14, 2.8, -8));
  rund(stift, [[0.6, -9], [3.4, -9], [3.4, -7], [0.4, -7.2]], STIEFEL);
  const rumpfReiter = [[-2.6, -14.4], [2.8, -14.4], [2.2, -22.4], [-1.9, -22.4]];
  vieleck(stift, rumpfReiter, licht(stift, farbe, -2.6, -22.4, 2.8, -14.4), true);
  if (fein) strich(stift, [[0.2, -21.6], [0.5, -15.2]], 'rgba(0,0,0,0.22)', 0.4);
  ellipse(stift, 3.2, -18.6, 1.1, 1.2, licht(stift, haut, 2, -20, 4.5, -17, 0.15, -0.2));
  kopf(stift, -25.7, { helm: true, fein, haut });
}

// Wolle aus vielen Kringeln, oben im Licht, unten im Schatten.
function wolle(stift, buckel, fein) {
  for (const [x, y, r] of buckel) {
    ellipse(stift, x, y, r, r * 0.88, licht(stift, '#ece6d8', x - r, y - r, x + r, y + r, 0.3, -0.2), false);
    if (fein) {
      stift.save();
      stift.strokeStyle = 'rgba(150,140,120,0.45)';
      stift.lineWidth = 0.3;
      stift.beginPath();
      stift.arc(x + r * 0.15, y + r * 0.1, r * 0.45, 0.3, Math.PI * 1.3);
      stift.stroke();
      stift.restore();
    }
  }
}

// Ein Schaf: helle Wolle aus Buckeln, dunkler Kopf und Beine, das Halsband in
// Spielerfarbe zeigt, wem es gehoert (karte AC-16). Kleiner als ein Mensch.
function schaf(stift, farbe, { schritt = 0, liegt = false, rest = 1, fein = true }) {
  if (liegt) {
    kadaver(stift, farbe, rest, fein);
    return;
  }
  schatten(stift, 7);
  const KOPF = '#524840';
  const aus = Math.sin(schritt) * 1.2;
  for (const [x, phase, dunkel] of [[-4.2, aus, -0.2], [-2, -aus, 0], [2.2, -aus, -0.2], [4.2, aus, 0]]) {
    vieleck(stift, [[x - 0.7 + phase, 0], [x + 0.7 + phase, 0], [x + 0.7, -4.5], [x - 0.7, -4.5]], toenen(KOPF, dunkel), false);
    ellipse(stift, x + phase, -0.1, 0.8, 0.4, '#42382f', false);
  }
  // Wolle als Wolke aus Buckeln, unten etwas dunkler.
  umriss(stift, () => { stift.beginPath(); stift.ellipse(0, -8.2, 7.4, 4.8, 0, 0, Math.PI * 2); stift.stroke(); });
  ellipse(stift, 0, -7.6, 7, 4.2, '#cfc7b5', false);
  wolle(stift, [[-4.4, -8.2, 2.8], [-1.4, -10.4, 3.2], [2.2, -10.2, 3], [4.6, -8, 2.6], [0.6, -7.2, 3.4], [-2.8, -6.6, 2.4], [3.2, -6.6, 2.2]], fein);
  // Halsband in Spielerfarbe, dann der Kopf nach vorn mit Ohr und Auge.
  vieleck(stift, [[5, -10.6], [7, -11.4], [7.6, -8.6], [5.6, -7.8]], licht(stift, farbe, 5, -11.4, 7.6, -7.8, 0.2, -0.2));
  rund(stift, [[6.6, -12.2], [11, -10.8], [10.8, -7.6], [7.2, -7.4]], licht(stift, KOPF, 7, -12, 11, -7.5, 0.25, -0.1));
  ellipse(stift, 7.2, -12.3, 1.5, 0.75, toenen(KOPF, 0.1), false);
  ellipse(stift, 9.2, -10.2, 0.5, 0.5, '#f2f2f2', false);
  ellipse(stift, 9.35, -10.15, 0.25, 0.28, AUGE, false);
  if (fein) strich(stift, [[10.3, -8.6], [10.8, -8.3]], 'rgba(255,255,255,0.3)', 0.3);
}

// Ein geschlachtetes Schaf (einheiten AC-17): liegt auf der Seite, die Beine
// steif nach oben, eine rote Stelle waechst, und das Ganze wird mit der Nahrung
// kleiner. Das Halsband bleibt - man sieht, wessen Nahrung da liegt.
function kadaver(stift, farbe, rest, fein = true) {
  const voll = Math.max(0, Math.min(1, rest));
  const m = 0.55 + 0.45 * voll;
  stift.save();
  stift.scale(m, m);
  schatten(stift, 9);
  const KOPF = '#524840';
  for (const [x, neigung] of [[1.2, 0.2], [3, 0.5], [4.6, 0.1], [6, 0.45]]) {
    const fuss = [x + 2.2 + neigung * 3, -10.5 + neigung * 2];
    vieleck(stift, [[x - 0.6, -4.5], [x + 0.6, -4.5], [fuss[0] + 0.6, fuss[1]], [fuss[0] - 0.6, fuss[1]]], licht(stift, KOPF, x, -10, x + 2, -4, 0.25, -0.1), false);
    ellipse(stift, fuss[0], fuss[1], 0.75, 0.45, '#42382f', false);
  }
  umriss(stift, () => { stift.beginPath(); stift.ellipse(0, -3.6, 8.6, 4, 0, 0, Math.PI * 2); stift.stroke(); });
  ellipse(stift, 0, -3.4, 8.2, 3.6, '#cfc7b5', false);
  wolle(stift, [[-5, -4, 2.4], [-2, -5, 2.8], [1.4, -5.2, 2.6], [4.4, -4.4, 2.3], [-0.4, -3, 2.2]], fein);
  // Wo schon Nahrung genommen wurde, ist es rot - je weniger uebrig, desto mehr.
  const schnitt = 1.2 + (1 - voll) * 3.2;
  ellipse(stift, 0.5, -2.6, schnitt, schnitt * 0.5, licht(stift, '#b8434a', -schnitt, -3.5, schnitt, -1.5, 0.2, -0.3));
  if (fein) glanz(stift, 0, -2.9, schnitt * 0.4, schnitt * 0.15, 0.35);
  vieleck(stift, [[-8.4, -4.4], [-6.8, -4.6], [-6.6, -2.2], [-8.2, -2]], licht(stift, farbe, -8.4, -4.6, -6.6, -2, 0.2, -0.2));
  rund(stift, [[-12.4, -3.4], [-8.2, -5], [-8, -1.6], [-12, -0.8]], licht(stift, KOPF, -12, -5, -8, -1, 0.25, -0.1));
  stift.restore();
}

// --- Die drei Einheiten der Feudalzeit (einheiten AC-23) --------------------
// Jede muss sich von jeder anderen auf einem Drittel der Flaeche unterscheiden
// (darstellung AC-14). Das leistet nicht die Ausruestung im Kleinen, sondern
// der Umriss: der Speer steht senkrecht ueber dem Kopf, der Bogen woelbt sich
// nach vorn, der Wurfspiess liegt waagerecht ueber der Schulter.
const LEINEN = '#cfc0a4';
const FELL = '#7a6243';

function speerkaempfer(stift, farbe, { schritt = 0, fein = true, haut = HAUT }) {
  schatten(stift, 6);
  beine(stift, schritt, HOSE, fein);
  stift.save();
  stift.translate(0, -RUMPF_HEBEN);
  stift.scale(RUMPF_BREITE, 1);
  // Der Speer macht den Umriss: Schaft von der Hand weit ueber den Kopf,
  // Blattspitze aus Eisen, Lederwicklung am Griff.
  stift.save();
  stift.translate(4.6, -13);
  stift.rotate(0.1);
  vieleck(stift, [[-0.6, 5.2], [0.6, 5.2], [0.6, -13.5], [-0.6, -13.5]], licht(stift, HOLZ, -0.7, 0, 0.7, 0, 0.32, -0.3));
  vieleck(stift, [[-1.5, -13.3], [1.5, -13.3], [0.95, -15.6], [0, -17.6], [-0.95, -15.6]], licht(stift, EISEN, -1.5, -17, 1.5, -13, 0.4, -0.3));
  if (fein) {
    strich(stift, [[0, -13.9], [0, -16.8]], 'rgba(70,78,88,0.75)', 0.3);
    for (const wy of [1.3, 2.8]) strich(stift, [[-0.7, wy], [0.7, wy]], 'rgba(60,40,24,0.8)', 0.5);
  }
  stift.restore();
  // Gesteppter Waffenrock aus Leinen - heller als alles andere im Spiel -,
  // darueber ein Wappenstreifen in Spielerfarbe.
  const rock = [[-4.6, -6.4], [4.8, -6.4], [4, -17.2], [0.2, -17.9], [-3.7, -17.2]];
  umriss(stift, () => rund(stift, rock, 'rgba(0,0,0,0)', true));
  rund(stift, rock, licht(stift, LEINEN, -4, -17, 5, -6, 0.2, -0.24), false);
  if (fein) for (const sy of [-8.4, -10.8, -13.2, -15.6]) strich(stift, [[-4.2, sy], [4.4, sy]], 'rgba(120,100,70,0.45)', 0.4);
  vieleck(stift, [[-1.7, -6.8], [1.9, -6.8], [1.6, -17.6], [-1.4, -17.6]], licht(stift, farbe, -1.7, -17, 2, -7), false);
  vieleck(stift, [[-4.4, -10.2], [4.6, -10.2], [4.5, -8.9], [-4.3, -8.9]], licht(stift, LEDER, 0, -10.2, 0, -8.9), false);
  kopf(stift, -19.8, { kappe: '#9a8c6a', fein, haut });
  ellipse(stift, 4.5, -12.9, 1.1, 1.2, licht(stift, haut, 3.5, -14, 5.5, -11.5, 0.15, -0.2));
  // Kleiner Rundschild am linken Arm, viel kleiner als der Schild der Miliz.
  umriss(stift, () => { stift.beginPath(); stift.ellipse(-5.2, -12.2, 3.1, 3.3, 0, 0, Math.PI * 2); stift.stroke(); });
  ellipse(stift, -5.2, -12.2, 3.1, 3.3, licht(stift, HOLZ, -8.3, -15.5, -2.1, -8.9, 0.25, -0.3), false);
  ellipse(stift, -5.2, -12.2, 1.1, 1.1, licht(stift, EISEN, -6.3, -13.3, -4.1, -11.1, 0.4, -0.3));
  if (fein) {
    strich(stift, [[-7.9, -13.6], [-2.5, -13.6]], 'rgba(60,40,24,0.5)', 0.4);
    glanz(stift, -5.6, -12.7, 0.35, 0.3, 0.9);
  }
  stift.restore();
}

function bogenschuetze(stift, farbe, { schritt = 0, fein = true, haut = HAUT }) {
  schatten(stift, 6);
  beine(stift, schritt, '#4a4336', fein);
  stift.save();
  stift.translate(0, -RUMPF_HEBEN);
  stift.scale(RUMPF_BREITE, 1);
  // Koecher auf dem Ruecken; die Pfeilfedern ragen ueber die Schulter.
  vieleck(stift, [[-6.4, -8.2], [-3.4, -8.8], [-2.6, -15.4], [-5.6, -15]], licht(stift, LEDER, -6.4, -15.4, -2.6, -8.2, 0.22, -0.26), true);
  for (const [px, ph] of [[-5.4, -19.6], [-4.2, -20.6], [-3, -19.4]]) {
    strich(stift, [[px - 0.4, -15.2], [px, ph]], '#b59a6a', 0.7);
    vieleck(stift, [[px - 0.95, ph], [px + 0.95, ph], [px + 0.5, ph + 2.3], [px - 0.6, ph + 2.3]], '#ded2b8', false);
  }
  // Schmales Wams in Spielerfarbe mit Guertel - kein Schild, keine Ruestung.
  const wams = [[-4, -6.4], [4.2, -6.4], [3.6, -17], [0.2, -17.7], [-3.3, -17]];
  umriss(stift, () => rund(stift, wams, 'rgba(0,0,0,0)', true));
  rund(stift, wams, licht(stift, farbe, -4, -17, 4.2, -6.4, 0.22, -0.26), false);
  if (fein) strich(stift, [[-3.5, -12.2], [3.7, -12.2]], toenen(farbe, 0.4), 0.5);
  vieleck(stift, [[-3.8, -10], [4, -10], [3.9, -8.8], [-3.7, -8.8]], licht(stift, LEDER, 0, -10, 0, -8.8), false);
  // Die Kapuze liegt **hinter** dem Kopf und geht in einen Schulterkragen
  // ueber - sonst klebt sie als Scheibe am Hinterkopf.
  rund(stift, [[-4.6, -15.6], [-4, -19.6], [-1.6, -21.8], [1.8, -21], [1.4, -18.6], [-1.4, -16.4]],
    licht(stift, '#6a6a52', -4.6, -21.8, 1.8, -15.6, 0.2, -0.26), true);
  kopf(stift, -19.8, { fein, haut });
  rund(stift, [[-4.8, -15.2], [-1.4, -16.4], [1.6, -15.8], [1.2, -14], [-4.4, -13.6]],
    licht(stift, toenen('#6a6a52', -0.12), -4.8, -16.4, 1.6, -13.6, 0.2, -0.26), true);
  // Der Bogen vorn: Holzbogen, gespannte Sehne nach hinten gezogen, Pfeil auf.
  stift.save();
  stift.lineCap = 'round';
  stift.strokeStyle = licht(stift, HOLZ, 5, -20, 12, -7, 0.3, -0.3);
  stift.lineWidth = 1.2;
  stift.beginPath();
  stift.moveTo(5.2, -20.6);
  stift.quadraticCurveTo(11.8, -13.4, 5.2, -6.2);
  stift.stroke();
  stift.strokeStyle = 'rgba(246,242,228,0.95)';
  stift.lineWidth = 0.25;
  stift.beginPath();
  stift.moveTo(5.2, -20.6);
  stift.lineTo(2.6, -13.4);
  stift.lineTo(5.2, -6.2);
  stift.stroke();
  stift.restore();
  // Pfeil auf der Sehne, waagerecht nach vorn.
  strich(stift, [[2.6, -13.4], [10.6, -13.4]], '#9a7a4a', 0.6);
  vieleck(stift, [[10.4, -14.1], [12.2, -13.4], [10.4, -12.7]], EISEN, false);
  // Beide Arme greifen von der Schulter aus - ohne sie haengen die Haende in
  // der Luft -, die Haende selbst klein.
  vieleck(stift, [[3.4, -15.6], [4.4, -15.9], [8.6, -13], [7.6, -12.2]], licht(stift, haut, 3.4, -15.9, 8.6, -12.2, 0.16, -0.2), false);
  vieleck(stift, [[3.2, -15.4], [4, -15.7], [3.4, -12.8], [2.5, -12.8]], licht(stift, haut, 2.5, -15.7, 4, -12.8, 0.16, -0.2), false);
  ellipse(stift, 8.3, -13.3, 0.85, 0.95, licht(stift, haut, 7.5, -14.3, 9.2, -12.4, 0.15, -0.2));
  ellipse(stift, 2.9, -13.3, 0.8, 0.9, licht(stift, haut, 2.1, -14.2, 3.7, -12.4, 0.15, -0.2));
  stift.restore();
}

function plaenkler(stift, farbe, { schritt = 0, fein = true, haut = HAUT }) {
  schatten(stift, 6);
  beine(stift, schritt, '#5a4a36', fein);
  stift.save();
  stift.translate(0, -RUMPF_HEBEN);
  stift.scale(RUMPF_BREITE, 1);
  // Wams in Spielerfarbe, darueber eine Fellweste - der groesste
  // Farbunterschied zum Bogenschuetzen, der nur Stoff traegt.
  const wams = [[-4.3, -6.4], [4.5, -6.4], [3.8, -17.1], [0.2, -17.8], [-3.5, -17.1]];
  umriss(stift, () => rund(stift, wams, 'rgba(0,0,0,0)', true));
  rund(stift, wams, licht(stift, farbe, -4.3, -17.1, 4.5, -6.4, 0.22, -0.26), false);
  const weste = [[-4.1, -8.6], [-1.2, -9.2], [1.6, -9.2], [4.3, -8.6], [3.6, -16.8], [0.2, -17.5], [-3.4, -16.8]];
  rund(stift, weste, licht(stift, FELL, -4.1, -17.5, 4.3, -8.6, 0.24, -0.28), true);
  if (fein) {
    for (const fy of [-10.4, -12.4, -14.4, -16]) {
      strich(stift, [[-3.6, fy], [-1.4, fy + 0.5]], 'rgba(60,46,28,0.5)', 0.5);
      strich(stift, [[1.4, fy + 0.3], [3.6, fy - 0.2]], 'rgba(60,46,28,0.5)', 0.5);
    }
  }
  vieleck(stift, [[-4.1, -9.6], [4.3, -9.6], [4.2, -8.4], [-4, -8.4]], licht(stift, LEDER, 0, -9.6, 0, -8.4), false);
  // Der Wurfarm geht von der Schulter nach hinten oben, nicht ueber das
  // Gesicht. Schmaler als ein Rumpf, sonst sieht er aus wie ein Balken.
  vieleck(stift, [[-1.6, -16.2], [-0.2, -16.6], [-2.4, -21.4], [-3.6, -21]],
    licht(stift, haut, -3.6, -21.4, -0.2, -16.2, 0.16, -0.2), false);
  kopf(stift, -19.8, { kappe: '#6b5a3c', fein, haut });
  // Drei Wurfspiesse im Buendel vor dem Koerper, kurz und mit kleiner Spitze -
  // so sieht man, dass er wirft und nicht sticht. Sie stehen **vor** der
  // Weste, sonst verschwinden sie darin.
  for (const [vx, vy, dreh] of [[-5, -11.4, 0.1], [-6, -11, 0.24], [-4.1, -11.6, -0.04]]) {
    stift.save();
    stift.translate(vx, vy);
    stift.rotate(dreh);
    vieleck(stift, [[-0.4, 4.6], [0.4, 4.6], [0.4, -4.6], [-0.4, -4.6]], licht(stift, toenen(HOLZ, -0.1), -0.5, 0, 0.5, 0, 0.26, -0.26));
    vieleck(stift, [[-0.85, -4.4], [0.85, -4.4], [0, -6.4]], licht(stift, EISEN_DUNKEL, -0.9, -6.4, 0.9, -4.4, 0.38, -0.3), false);
    stift.restore();
  }
  // Die Faust haelt das Buendel in der Mitte - klein, sonst deckt sie es zu.
  vieleck(stift, [[-3.9, -12.6], [-3, -12.9], [-4.3, -10.4], [-5.2, -10.6]], licht(stift, haut, -5.2, -12.9, -3, -10.4, 0.16, -0.2), false);
  ellipse(stift, -4.9, -10.9, 0.9, 0.95, licht(stift, haut, -5.8, -11.8, -4, -10, 0.15, -0.2));
  // Der geworfene Spiess hoch und weit nach vorn: ein schraeger Balken ueber
  // allem, wo keine andere Figur etwas hat.
  stift.save();
  stift.translate(-2.6, -22.2);
  stift.rotate(-0.28);
  vieleck(stift, [[-4.2, -0.5], [12.6, -0.5], [12.6, 0.5], [-4.2, 0.5]], licht(stift, HOLZ, -4.2, 0, 12.6, 0, 0.3, -0.3));
  vieleck(stift, [[12.4, -1.25], [15.4, 0], [12.4, 1.25]], licht(stift, EISEN, 12.4, -1.25, 15.4, 1.25, 0.4, -0.3), false);
  if (fein) strich(stift, [[1.4, -0.1], [3, -0.1]], 'rgba(60,40,24,0.8)', 0.5);
  stift.restore();
  ellipse(stift, -2.5, -21.6, 0.95, 1, licht(stift, haut, -3.5, -22.6, -1.5, -20.6, 0.15, -0.2));
  stift.restore();
}

export const FIGUREN = {
  dorfbewohner: { name: 'Dorfbewohner', zeichnen: dorfbewohner, breite: 1 },
  schaf: { name: 'Schaf', zeichnen: schaf, breite: 1.1 },
  miliz: { name: 'Miliz', zeichnen: miliz, breite: 1 },
  // Der Reiter ragt ueber die Figurenhoehe hinaus - `oben` sagt, wie weit (Lebensbalken).
  spaeherreiter: { name: 'Spaeherreiter', zeichnen: spaeherreiter, breite: 1.6, oben: 1.15 },
  // Feudalzeit (einheiten AC-23). Speer und Wurfspiess ragen nach oben hinaus,
  // der Bogen nach vorn - daher `oben` und `breite`.
  soldat: { name: 'Soldat', zeichnen: soldat, breite: 1.3, oben: 1.2 },
  speerkaempfer: { name: 'Speerkämpfer', zeichnen: speerkaempfer, breite: 1.1, oben: 1.2 },
  bogenschuetze: { name: 'Bogenschütze', zeichnen: bogenschuetze, breite: 1.3 },
  plaenkler: { name: 'Plänkler', zeichnen: plaenkler, breite: 1.3, oben: 1.05 },
};

export { WAREN };

/**
 * Eine Figur zeichnen.
 * @param {CanvasRenderingContext2D} stift
 * @param {string} art dorfbewohner | miliz | spaeherreiter | schaf
 * @param {number} x Fusspunkt
 * @param {number} y Fusspunkt
 * @param {number} hoehe Bildpunkte vom Fuss bis zum Scheitel
 * @param {string} farbe Spielerfarbe als #rrggbb
 * @param {{blick?: number, ladung?: string|null, schritt?: number, liegt?: boolean, rest?: number}} [lage]
 */
export function figurZeichnen(stift, art, x, y, hoehe, farbe, lage = {}) {
  const figur = FIGUREN[art] || FIGUREN.dorfbewohner;
  const massstab = hoehe / 24;
  stift.save();
  stift.translate(x, y);
  stift.scale(massstab * (lage.blick === -1 ? -1 : 1), massstab);
  stift.lineWidth = Math.max(0.5, 0.9 / massstab);
  stift.lineJoin = 'round';
  stift.strokeStyle = KONTUR;
  // Unter rund 20 Bildpunkten Hoehe verschwimmen feine Striche zu Grau.
  figur.zeichnen(stift, farbe, { ...lage, fein: hoehe >= 20 });
  stift.restore();
}

// Gezeichnet kostet eine Figur viele Verlaeufe; 100 davon drueckten das
// Spielbild auf 24 Bilder je Sekunde (darstellung AC-10, Runde 52). Im Spielbild
// wird deshalb jede Gestalt einmal in ein kleines Bild gezeichnet und danach
// kopiert - wie Gebaeude und Vorraete. Der Schritt geht dafuer in acht Stufen.
const SCHRITT_STUFEN = 8;
const ZWISCHENSPEICHER = new Map();
const SPEICHER_MAX = 400;

export function figurBildZeichnen(stift, art, x, y, hoehe, farbe, lage = {}, umriss = false) {
  if (typeof document === 'undefined') {
    figurZeichnen(stift, art, x, y, hoehe, farbe, lage);
    return;
  }
  const figur = FIGUREN[art] || FIGUREN.dorfbewohner;
  const dichte = window.devicePixelRatio || 1;
  const h = Math.round(hoehe * 2) / 2;
  const stufe = lage.schritt ? Math.round(((lage.schritt % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2) * SCHRITT_STUFEN) % SCHRITT_STUFEN : -1;
  const schritt = stufe < 0 ? 0 : ((stufe || SCHRITT_STUFEN) / SCHRITT_STUFEN) * Math.PI * 2;
  const rest = lage.rest === undefined ? 1 : Math.round(lage.rest * 10) / 10;
  const arbeitStufe = lage.arbeit ? Math.round(((lage.arbeit % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2) * SCHRITT_STUFEN) % SCHRITT_STUFEN : -1;
  const arbeit = arbeitStufe < 0 ? 0 : ((arbeitStufe || SCHRITT_STUFEN) / SCHRITT_STUFEN) * Math.PI * 2;
  const schluessel = `${art}|${farbe}|${h}|${lage.blick === -1 ? -1 : 1}|${lage.ladung || ''}|${stufe}|${arbeitStufe}|${lage.liegt ? 1 : 0}|${rest}|${umriss ? 'u' : ''}|${dichte}`;
  // Platz fuer Reiter, Ladung auf dem Ruecken und Schatten.
  const breite = h * 2.2 * (figur.breite || 1);
  const oben = h * 1.3;
  const unten = h * 0.35;
  let bild = ZWISCHENSPEICHER.get(schluessel);
  if (!bild) {
    bild = document.createElement('canvas');
    bild.width = Math.ceil(breite * dichte);
    bild.height = Math.ceil((oben + unten) * dichte);
    const s = bild.getContext('2d');
    s.scale(dichte, dichte);
    figurZeichnen(s, art, breite / 2, oben, h, farbe, { ...lage, schritt, arbeit, rest });
    if (umriss) {
      // Der Umriss (bedienung AC-30): dieselbe Gestalt, ganz in Spielerfarbe -
      // so sieht man durch ein Gebaeude hindurch, wer dahinter steht.
      s.globalCompositeOperation = 'source-in';
      s.fillStyle = farbe;
      s.fillRect(0, 0, breite, oben + unten);
      s.globalCompositeOperation = 'source-over';
    }
    ZWISCHENSPEICHER.set(schluessel, bild);
    if (ZWISCHENSPEICHER.size > SPEICHER_MAX) ZWISCHENSPEICHER.delete(ZWISCHENSPEICHER.keys().next().value);
  }
  // Auf ganze Bildpunkte und in Originalgroesse: sonst glaettet der Browser bei
  // jedem Kopieren, und das kostete mit 100 Figuren und 30 Gebaeuden ein
  // Drittel der Bilder je Sekunde (darstellung AC-10, Runde 52).
  stift.drawImage(bild, Math.round((x - breite / 2) * dichte) / dichte, Math.round((y - oben) * dichte) / dichte, bild.width / dichte, bild.height / dichte);
}
