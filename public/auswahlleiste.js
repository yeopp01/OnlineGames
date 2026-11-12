// Unten im Spielbild: was ausgewaehlt ist und was es kann.
// - ein eigenes Gebaeude: Name, Leben, ein Knopf je Einheit mit Bild und
//   Kosten, darunter die Warteschlange; der laufende Auftrag zeigt seinen
//   Fortschritt, ein Klick auf einen Eintrag bricht ihn ab
//   (→ specs/10-strategie/bedienung.md AC-26, bauen AC-10, AC-11)
// - eine Einheit: Bild, Name, Leben und beim Dorfbewohner, was er traegt (AC-29)
// - Dorfbewohner in der Auswahl: das Baumenue mit Bild und Kosten; was nicht
//   bezahlbar ist, ist ausgegraut und sagt, was fehlt (AC-25)
// - eine eigene Baustelle: Fortschritt und Abriss (bauen AC-6)
// Rechnen tut hier nichts: die Leiste zeigt den Zustand und schickt Absichten.
// Werte wie Leben und Kosten kommen vom Server mit dem Aufbau (ansicht.werte).
import { BAUTASTEN } from './tasten.js';
import { FIGUREN, WAREN, figurZeichnen } from './figuren.js';
import { GEBAEUDE, gebaeudeZeichnen } from './gebaeude.js';

const ROHSTOFF_NAMEN = { holz: 'Holz', nahrung: 'Nahrung', gold: 'Gold', stein: 'Stein' };

function bildchen(art, groesse, farbe, lage = {}) {
  const leinwand = document.createElement('canvas');
  const dichte = window.devicePixelRatio || 1;
  leinwand.width = groesse * dichte;
  leinwand.height = groesse * dichte;
  leinwand.style.width = `${groesse}px`;
  leinwand.style.height = `${groesse}px`;
  const stift = leinwand.getContext('2d');
  stift.scale(dichte, dichte);
  figurZeichnen(stift, art, groesse / 2, groesse * 0.95, groesse * 0.95, farbe, lage);
  return leinwand;
}

// Der Aufstieg als Bild: ein Torbogen mit Zinnen, davor eine Fahne in der
// Volksfarbe - das naechste Zeitalter oeffnet sich (bauen AC-23).
function aufstiegBildchen(groesse, farbe) {
  const leinwand = document.createElement('canvas');
  const dichte = window.devicePixelRatio || 1;
  leinwand.width = groesse * dichte;
  leinwand.height = groesse * dichte;
  leinwand.style.width = `${groesse}px`;
  leinwand.style.height = `${groesse}px`;
  const s = leinwand.getContext('2d');
  s.scale(dichte, dichte);
  const g = groesse;
  // Zwei Tuerme und der Riegel darueber, aus warmem Stein.
  const stein = s.createLinearGradient(0, 0.2 * g, 0, 0.9 * g);
  stein.addColorStop(0, '#b9a98c');
  stein.addColorStop(1, '#7d705a');
  s.fillStyle = stein;
  s.fillRect(0.12 * g, 0.3 * g, 0.2 * g, 0.6 * g);
  s.fillRect(0.68 * g, 0.3 * g, 0.2 * g, 0.6 * g);
  s.fillRect(0.12 * g, 0.3 * g, 0.76 * g, 0.16 * g);
  // Zinnen auf beiden Tuermen.
  for (const x of [0.12, 0.23, 0.68, 0.79]) s.fillRect(x * g, 0.2 * g, 0.09 * g, 0.12 * g);
  // Die Durchfahrt: dunkel, oben rund.
  s.fillStyle = '#2b2219';
  s.beginPath();
  s.moveTo(0.36 * g, 0.9 * g);
  s.lineTo(0.36 * g, 0.66 * g);
  s.arc(0.5 * g, 0.66 * g, 0.14 * g, Math.PI, 0);
  s.lineTo(0.64 * g, 0.9 * g);
  s.closePath();
  s.fill();
  // Die Fahne am Riegel, in der Volksfarbe.
  s.fillStyle = farbe;
  s.beginPath();
  s.moveTo(0.5 * g, 0.46 * g);
  s.lineTo(0.5 * g, 0.12 * g);
  s.lineTo(0.78 * g, 0.19 * g);
  s.lineTo(0.5 * g, 0.26 * g);
  s.closePath();
  s.fill();
  s.strokeStyle = 'rgba(46, 34, 24, 0.6)';
  s.lineWidth = g * 0.03;
  s.beginPath();
  s.moveTo(0.5 * g, 0.46 * g);
  s.lineTo(0.5 * g, 0.1 * g);
  s.stroke();
  return leinwand;
}

// Ein kleiner Webstuhl als Bild fuer den Knopf: Rahmen, Kettfaeden, ein Stueck Tuch.
function webstuhlBildchen(groesse, farbe) {
  const leinwand = document.createElement('canvas');
  const dichte = window.devicePixelRatio || 1;
  leinwand.width = groesse * dichte;
  leinwand.height = groesse * dichte;
  leinwand.style.width = `${groesse}px`;
  leinwand.style.height = `${groesse}px`;
  const s = leinwand.getContext('2d');
  s.scale(dichte, dichte);
  const g = groesse;
  s.lineCap = 'round';
  s.strokeStyle = '#6b4a2b';
  s.lineWidth = g * 0.07;
  for (const [x0, y0, x1, y1] of [[0.2, 0.9, 0.2, 0.15], [0.8, 0.9, 0.8, 0.15], [0.15, 0.22, 0.85, 0.22], [0.15, 0.75, 0.85, 0.75]]) {
    s.beginPath();
    s.moveTo(x0 * g, y0 * g);
    s.lineTo(x1 * g, y1 * g);
    s.stroke();
  }
  s.strokeStyle = 'rgba(240, 230, 200, 0.85)';
  s.lineWidth = g * 0.015;
  for (let i = 0; i < 8; i++) {
    const x = (0.27 + i * 0.066) * g;
    s.beginPath();
    s.moveTo(x, 0.24 * g);
    s.lineTo(x, 0.73 * g);
    s.stroke();
  }
  const tuch = s.createLinearGradient(0, 0.5 * g, 0, 0.73 * g);
  tuch.addColorStop(0, farbe);
  tuch.addColorStop(1, 'rgba(0,0,0,0.5)');
  s.fillStyle = tuch;
  s.fillRect(0.26 * g, 0.5 * g, 0.48 * g, 0.23 * g);
  s.strokeStyle = 'rgba(255,255,255,0.35)';
  s.lineWidth = g * 0.012;
  for (let i = 0; i < 4; i++) {
    s.beginPath();
    s.moveTo(0.26 * g, (0.54 + i * 0.05) * g);
    s.lineTo(0.74 * g, (0.54 + i * 0.05) * g);
    s.stroke();
  }
  return leinwand;
}

/**
 * Eine leere Leinwand in Knopfgroesse, mit dem Stift schon auf die
 * Bildschirmdichte gestellt - jedes Bildchen faengt damit an.
 */
function knopfleinwand(groesse) {
  const leinwand = document.createElement('canvas');
  const dichte = window.devicePixelRatio || 1;
  leinwand.width = groesse * dichte;
  leinwand.height = groesse * dichte;
  leinwand.style.width = `${groesse}px`;
  leinwand.style.height = `${groesse}px`;
  const stift = leinwand.getContext('2d');
  stift.scale(dichte, dichte);
  return { leinwand, stift };
}

/**
 * Die Bildchen der Verbesserungen der Feudalzeit (bauen AC-25, AC-26). Jede
 * braucht ein eigenes, sonst stehen vier gleiche Knoepfe nebeneinander
 * (darstellung AC-14). Welches gezeichnet wird, steht als `zeichen` in den
 * Daten - nicht als Verzweigung nach dem Namen der Verbesserung.
 */
const ZEICHEN = {
  // Schmiedeangriff: ein Amboss, darauf ein Schwert, darueber Funken.
  amboss(s, g, farbe) {
    s.fillStyle = '#4a4440';
    s.beginPath();
    s.moveTo(0.16 * g, 0.56 * g);
    s.lineTo(0.78 * g, 0.56 * g);
    s.lineTo(0.86 * g, 0.64 * g);
    s.lineTo(0.68 * g, 0.66 * g);
    s.lineTo(0.62 * g, 0.74 * g);
    s.lineTo(0.72 * g, 0.86 * g);
    s.lineTo(0.26 * g, 0.86 * g);
    s.lineTo(0.36 * g, 0.74 * g);
    s.lineTo(0.3 * g, 0.66 * g);
    s.lineTo(0.16 * g, 0.64 * g);
    s.closePath();
    s.fill();
    s.fillStyle = 'rgba(255,255,255,0.18)';
    s.fillRect(0.18 * g, 0.56 * g, 0.6 * g, 0.03 * g);
    // Die Klinge auf dem Amboss, der Griff in der Volksfarbe.
    s.strokeStyle = '#cfd6dd';
    s.lineWidth = g * 0.09;
    s.lineCap = 'butt';
    s.beginPath();
    s.moveTo(0.28 * g, 0.47 * g);
    s.lineTo(0.66 * g, 0.34 * g);
    s.stroke();
    s.strokeStyle = farbe;
    s.lineWidth = g * 0.11;
    s.beginPath();
    s.moveTo(0.68 * g, 0.33 * g);
    s.lineTo(0.82 * g, 0.28 * g);
    s.stroke();
    s.strokeStyle = '#f6c667';
    s.lineWidth = g * 0.045;
    s.lineCap = 'round';
    for (const [x, y, l] of [[0.4, 0.26, 0.09], [0.52, 0.18, 0.12], [0.63, 0.22, 0.07]]) {
      s.beginPath();
      s.moveTo(x * g, y * g);
      s.lineTo((x + l * 0.4) * g, (y - l) * g);
      s.stroke();
    }
  },
  // Befiederte Pfeile: ein Pfeil nach oben rechts, mit Feder am Schaft.
  pfeil(s, g, farbe) {
    s.strokeStyle = '#8a6a44';
    s.lineWidth = g * 0.075;
    s.lineCap = 'round';
    s.beginPath();
    s.moveTo(0.18 * g, 0.84 * g);
    s.lineTo(0.74 * g, 0.28 * g);
    s.stroke();
    s.fillStyle = '#cfd6dd';
    s.beginPath();
    s.moveTo(0.88 * g, 0.14 * g);
    s.lineTo(0.84 * g, 0.44 * g);
    s.lineTo(0.58 * g, 0.4 * g);
    s.closePath();
    s.fill();
    // Drei Federn am hinteren Ende, in der Volksfarbe.
    s.fillStyle = farbe;
    for (let i = 0; i < 3; i++) {
      const x = (0.2 + i * 0.1) * g;
      const y = (0.82 - i * 0.1) * g;
      s.beginPath();
      s.moveTo(x, y);
      s.lineTo(x - 0.14 * g, y - 0.04 * g);
      s.lineTo(x - 0.04 * g, y - 0.16 * g);
      s.closePath();
      s.fill();
    }
  },
  // Doppelaxt: ein Stiel mit zwei Blaettern, dazu ein Stueck Holz.
  axt(s, g, farbe) {
    s.strokeStyle = '#8a6a44';
    s.lineWidth = g * 0.09;
    s.lineCap = 'round';
    s.beginPath();
    s.moveTo(0.5 * g, 0.9 * g);
    s.lineTo(0.5 * g, 0.16 * g);
    s.stroke();
    s.fillStyle = '#b9c2cb';
    for (const seite of [-1, 1]) {
      s.beginPath();
      s.moveTo(0.5 * g, 0.2 * g);
      s.quadraticCurveTo((0.5 + seite * 0.42) * g, 0.24 * g, (0.5 + seite * 0.34) * g, 0.52 * g);
      s.quadraticCurveTo((0.5 + seite * 0.2) * g, 0.44 * g, 0.5 * g, 0.46 * g);
      s.closePath();
      s.fill();
    }
    s.fillStyle = farbe;
    s.fillRect(0.44 * g, 0.2 * g, 0.12 * g, 0.26 * g);
  },
  // Stadtwache: die Laterne des Nachtwaechters, an einem Haken, mit Schein.
  laterne(s, g, farbe) {
    // Der Schein hinter der Laterne.
    const schein = s.createRadialGradient(0.5 * g, 0.58 * g, 0.05 * g, 0.5 * g, 0.58 * g, 0.46 * g);
    schein.addColorStop(0, 'rgba(255,214,120,0.75)');
    schein.addColorStop(1, 'rgba(255,214,120,0)');
    s.fillStyle = schein;
    s.fillRect(0, 0.1 * g, g, 0.9 * g);
    // Haken und Ring.
    s.strokeStyle = '#4a4440';
    s.lineWidth = g * 0.06;
    s.lineCap = 'round';
    s.beginPath();
    s.moveTo(0.5 * g, 0.06 * g);
    s.lineTo(0.5 * g, 0.2 * g);
    s.stroke();
    s.beginPath();
    s.arc(0.5 * g, 0.24 * g, 0.06 * g, 0, Math.PI * 2);
    s.stroke();
    // Dach in der Volksfarbe.
    s.fillStyle = farbe;
    s.beginPath();
    s.moveTo(0.3 * g, 0.38 * g);
    s.lineTo(0.5 * g, 0.28 * g);
    s.lineTo(0.7 * g, 0.38 * g);
    s.closePath();
    s.fill();
    // Das Glas mit dem Licht, gerahmt.
    s.fillStyle = '#ffd36a';
    s.fillRect(0.35 * g, 0.38 * g, 0.3 * g, 0.36 * g);
    s.strokeStyle = '#3a3430';
    s.lineWidth = g * 0.05;
    s.strokeRect(0.35 * g, 0.38 * g, 0.3 * g, 0.36 * g);
    s.beginPath();
    s.moveTo(0.5 * g, 0.38 * g);
    s.lineTo(0.5 * g, 0.74 * g);
    s.stroke();
    // Der Fuss.
    s.fillStyle = '#3a3430';
    s.fillRect(0.31 * g, 0.74 * g, 0.38 * g, 0.07 * g);
  },
  // Eisenguss: eine Giesskelle, aus der gluehendes Eisen in eine Form laeuft.
  giesskelle(s, g, farbe) {
    // Die Form unten, dunkles Eisen, darin der gluehende Guss.
    s.fillStyle = '#4a4440';
    s.fillRect(0.14 * g, 0.7 * g, 0.62 * g, 0.18 * g);
    s.fillStyle = '#ff8a2a';
    s.fillRect(0.2 * g, 0.72 * g, 0.5 * g, 0.07 * g);
    // Der Strahl aus der Kelle.
    s.strokeStyle = '#ffb347';
    s.lineWidth = g * 0.07;
    s.lineCap = 'round';
    s.beginPath();
    s.moveTo(0.42 * g, 0.44 * g);
    s.quadraticCurveTo(0.38 * g, 0.58 * g, 0.4 * g, 0.72 * g);
    s.stroke();
    // Die Kelle, schraeg gekippt: Schale und Stiel in der Volksfarbe.
    s.fillStyle = '#6b625a';
    s.beginPath();
    s.ellipse(0.5 * g, 0.36 * g, 0.17 * g, 0.11 * g, -0.5, 0, Math.PI * 2);
    s.fill();
    s.fillStyle = '#ffcf6b';
    s.beginPath();
    s.ellipse(0.5 * g, 0.33 * g, 0.12 * g, 0.05 * g, -0.5, 0, Math.PI * 2);
    s.fill();
    s.strokeStyle = farbe;
    s.lineWidth = g * 0.09;
    s.beginPath();
    s.moveTo(0.64 * g, 0.28 * g);
    s.lineTo(0.9 * g, 0.12 * g);
    s.stroke();
  },
  // Bodkinpfeil: zwei Pfeile mit langer, schmaler Spitze, die Ruestung
  // durchschlaegt - gekreuzt, damit sie nicht wie die Befiederten Pfeile
  // aussehen.
  bodkin(s, g, farbe) {
    for (const [x0, y0, x1, y1] of [[0.14, 0.86, 0.8, 0.2], [0.86, 0.86, 0.2, 0.2]]) {
      s.strokeStyle = '#8a6a44';
      s.lineWidth = g * 0.065;
      s.lineCap = 'round';
      s.beginPath();
      s.moveTo(x0 * g, y0 * g);
      s.lineTo(x1 * g, y1 * g);
      s.stroke();
      // Die lange Nadelspitze.
      const dx = x1 - x0;
      const dy = y1 - y0;
      const l = Math.hypot(dx, dy);
      const ux = dx / l;
      const uy = dy / l;
      s.strokeStyle = '#dfe5ea';
      s.lineWidth = g * 0.05;
      s.beginPath();
      s.moveTo(x1 * g, y1 * g);
      s.lineTo((x1 + ux * 0.14) * g, (y1 + uy * 0.14) * g);
      s.stroke();
      // Federn am Ende, in der Volksfarbe.
      s.strokeStyle = farbe;
      s.lineWidth = g * 0.11;
      s.lineCap = 'butt';
      s.beginPath();
      s.moveTo(x0 * g, y0 * g);
      s.lineTo((x0 + ux * 0.16) * g, (y0 + uy * 0.16) * g);
      s.stroke();
    }
  },
  // Mauerwerk: eine Ziegelmauer, davor die Maurerkelle.
  kelle(s, g, farbe) {
    const reihen = 4;
    const h = 0.13;
    for (let r = 0; r < reihen; r++) {
      const y = (0.36 + r * h) * g;
      const versatz = r % 2 ? 0.1 : 0;
      for (let i = -1; i < 4; i++) {
        const x0 = Math.max(0.12, 0.12 + versatz + i * 0.2);
        const x1 = Math.min(0.88, 0.12 + versatz + i * 0.2 + 0.18);
        if (x1 <= x0) continue;
        s.fillStyle = (r + i) % 2 ? '#a9704e' : '#b98260';
        s.fillRect(x0 * g, y, (x1 - x0) * g, (h - 0.025) * g);
      }
    }
    // Die Kelle schraeg darueber: Blatt silbern, Griff in der Volksfarbe.
    s.fillStyle = '#cfd6dd';
    s.beginPath();
    s.moveTo(0.3 * g, 0.34 * g);
    s.lineTo(0.62 * g, 0.12 * g);
    s.lineTo(0.66 * g, 0.3 * g);
    s.closePath();
    s.fill();
    s.strokeStyle = '#6b625a';
    s.lineWidth = g * 0.04;
    s.beginPath();
    s.moveTo(0.64 * g, 0.2 * g);
    s.lineTo(0.74 * g, 0.12 * g);
    s.stroke();
    s.strokeStyle = farbe;
    s.lineWidth = g * 0.09;
    s.lineCap = 'round';
    s.beginPath();
    s.moveTo(0.74 * g, 0.12 * g);
    s.lineTo(0.88 * g, 0.04 * g);
    s.stroke();
  },
  // Stadtpatrouille: das Horn der Wache, mit Schall - die Stadtwache hat die
  // Laterne, die Patrouille ruft.
  horn(s, g, farbe) {
    // Der Schall: drei Boegen vor der Oeffnung.
    s.strokeStyle = '#f6c667';
    s.lineWidth = g * 0.045;
    s.lineCap = 'round';
    for (const r of [0.12, 0.2, 0.28]) {
      s.beginPath();
      s.arc(0.66 * g, 0.36 * g, r * g, -1.1, 0.3);
      s.stroke();
    }
    // Das Horn: gebogen, von schmal unten links zur weiten Oeffnung.
    s.fillStyle = '#c9a46a';
    s.beginPath();
    s.moveTo(0.12 * g, 0.82 * g);
    s.quadraticCurveTo(0.28 * g, 0.5 * g, 0.58 * g, 0.3 * g);
    s.lineTo(0.72 * g, 0.48 * g);
    s.quadraticCurveTo(0.4 * g, 0.62 * g, 0.2 * g, 0.88 * g);
    s.closePath();
    s.fill();
    s.fillStyle = '#e8d3a8';
    s.beginPath();
    s.ellipse(0.65 * g, 0.39 * g, 0.06 * g, 0.12 * g, -0.65, 0, Math.PI * 2);
    s.fill();
    // Zwei Baender in der Volksfarbe.
    s.strokeStyle = farbe;
    s.lineWidth = g * 0.06;
    s.lineCap = 'butt';
    for (const [x0, y0, x1, y1] of [[0.25, 0.58, 0.36, 0.7], [0.4, 0.44, 0.52, 0.56]]) {
      s.beginPath();
      s.moveTo(x0 * g, y0 * g);
      s.lineTo(x1 * g, y1 * g);
      s.stroke();
    }
  },
  // Pferdekummet: das Halsjoch des Zugpferdes, davor eine Aehre.
  kummet(s, g, farbe) {
    s.strokeStyle = '#7a4f2c';
    s.lineWidth = g * 0.13;
    s.beginPath();
    s.ellipse(0.42 * g, 0.52 * g, 0.26 * g, 0.34 * g, 0, 0, Math.PI * 2);
    s.stroke();
    s.strokeStyle = farbe;
    s.lineWidth = g * 0.05;
    s.beginPath();
    s.ellipse(0.42 * g, 0.52 * g, 0.26 * g, 0.34 * g, 0, 0, Math.PI * 2);
    s.stroke();
    s.strokeStyle = '#d8b25a';
    s.lineWidth = g * 0.055;
    s.lineCap = 'round';
    s.beginPath();
    s.moveTo(0.82 * g, 0.9 * g);
    s.lineTo(0.82 * g, 0.3 * g);
    s.stroke();
    s.fillStyle = '#e8c972';
    for (let i = 0; i < 4; i++) {
      const y = (0.3 + i * 0.13) * g;
      for (const seite of [-1, 1]) {
        s.beginPath();
        s.ellipse((0.82 + seite * 0.07) * g, y, 0.05 * g, 0.075 * g, seite * 0.5, 0, Math.PI * 2);
        s.fill();
      }
    }
  },
};

function zeichenBildchen(zeichen, groesse, farbe) {
  const { leinwand, stift } = knopfleinwand(groesse);
  ZEICHEN[zeichen](stift, groesse, farbe);
  return leinwand;
}

function gebaeudeBildchen(art, groesse, farbe, n) {
  const leinwand = document.createElement('canvas');
  const dichte = window.devicePixelRatio || 1;
  leinwand.width = groesse * dichte;
  leinwand.height = groesse * dichte;
  leinwand.style.width = `${groesse}px`;
  leinwand.style.height = `${groesse}px`;
  const stift = leinwand.getContext('2d');
  stift.scale(dichte, dichte);
  // Jedes Gebaeude gleich breit im Knopf, egal wie gross es im Spiel ist -
  // ausser es ist hoch und schmal: der Aussenposten ragte gleich breit
  // gezeichnet oben aus dem Knopf, man sah nur seine Beine (Runde 109). Dann
  // passt es nach der Hoehe. Die Grenze von einem Zehntel laesst Dachspitzen
  // der anderen Gebaeude, die knapp an den Rand reichen, wie sie sind.
  const breit = groesse / (2.3 * n);
  const g = GEBAEUDE[art];
  const hoch = g ? (groesse * 0.74) / (g.trefferOben * ((n * 0.95) / g.halbeBreite)) : breit;
  gebaeudeZeichnen(stift, art, groesse / 2, groesse * 0.74, hoch < breit * 0.9 ? hoch : breit, farbe, n);
  return leinwand;
}

function element(name, klasse, text) {
  const e = document.createElement(name);
  if (klasse) e.className = klasse;
  if (text !== undefined) e.textContent = text;
  return e;
}

/** Name und Lebensbalken, fuer Einheit und Gebaeude gleich. */
function kopf(name, leben, voll) {
  const k = element('div', 'auswahl-kopf');
  k.append(element('strong', null, name));
  const zeile = element('div', 'leben');
  zeile.dataset.leben = `${leben}/${voll}`;
  const balken = element('div', 'lebensbalken');
  const fuellung = element('span');
  fuellung.style.width = `${Math.round((leben / voll) * 100)}%`;
  balken.append(fuellung);
  zeile.append(balken, element('span', 'lebenszahl', `${leben} / ${voll}`));
  k.append(zeile);
  return k;
}

export class Auswahlleiste {
  constructor(wurzel, ansicht, senden) {
    this.wurzel = wurzel;
    this.ansicht = ansicht;
    this.senden = senden;
    this.gezeigt = null; // Schluessel des zuletzt gebauten Inhalts
  }

  aktualisieren() {
    const a = this.ansicht;
    const gebaeude = a.gewaehltesGebaeude ? a.gebaeude.get(a.gewaehltesGebaeude) : null;
    const farbe = a.spieler.get(a.ich)?.farbe || '#888888';

    if (gebaeude && gebaeude.b === a.ich && gebaeude.u !== undefined) {
      const schluessel = `b${gebaeude.i}:${gebaeude.u}:${gebaeude.h}:${this.ansicht.gebaeudeLebenVoll(gebaeude)}`;
      if (schluessel !== this.gezeigt) {
        this.baustelleBauen(gebaeude, farbe);
        this.gezeigt = schluessel;
      }
      this.wurzel.hidden = false;
      return;
    }

    if (gebaeude && gebaeude.b === a.ich) {
      const angebot = this.angebot(gebaeude);
      // Neu gebaut wird nur, wenn sich etwas Sichtbares aendert - sonst nur
      // der Balken. So flackert nichts unter dem Zeiger.
      const bezahlbar = angebot.map((e) => this.fehlt(e.kosten)).join('|');
      // Am Markt aendern ein Handel die Preise und jeder Vorrat, ob er geht.
      const handel = a.werte.gebaeude[gebaeude.art]?.handel
        ? `${JSON.stringify(a.handelspreise)}:${this.handelGesperrt().join(',')}` : '';
      const schluessel = `g${gebaeude.i}:${gebaeude.h}:${gebaeude.n}:${gebaeude.s.join(',')}:${gebaeude.w}:${bezahlbar}:${a.verbesserungen.join(',')}:${a.zeitalter}:${handel}`;
      if (schluessel !== this.gezeigt) {
        this.gebaeudeBauen(gebaeude, angebot, farbe);
        this.gezeigt = schluessel;
      }
      const balken = this.wurzel.querySelector('.fortschritt > span');
      if (balken) balken.style.width = `${Math.round(gebaeude.f * 100)}%`;
      this.wurzel.hidden = false;
      return;
    }

    const auswahl = [...a.ausgewaehlt].map((id) => a.nachher.get(id)).filter(Boolean);
    const schafe = [...a.ausgewaehlt].map((id) => a.tiere.get(id)).filter(Boolean);
    if (!auswahl.length && schafe.length) {
      const schluessel = `t${schafe.map((t) => t.i).join(',')}`;
      if (schluessel !== this.gezeigt) {
        this.wurzel.replaceChildren();
        const bild = element('div', 'auswahl-bild');
        bild.append(bildchen('schaf', 58, farbe));
        const k = element('div', 'auswahl-kopf');
        k.append(element('strong', null, schafe.length === 1 ? 'Schaf' : `${schafe.length} Schafe`));
        const nahrung = schafe.reduce((s, t) => s + (t.n ?? 0), 0);
        const zeile = element('div', 'ladung');
        zeile.id = 'schafnahrung';
        zeile.append(element('span', 'ware ware-n'), element('span', null, `${nahrung} Nahrung`), element('span', 'leise', ' - Rechtsklick treibt'));
        this.wurzel.append(bild, k, zeile);
        this.gezeigt = schluessel;
      }
      this.wurzel.hidden = false;
      return;
    }
    if (auswahl.length) {
      const bauplan = this.bauplan(auswahl);
      const bezahlbar = bauplan.map((e) => this.fehlt(e.kosten)).join('|');
      const einzeln = auswahl.length === 1 ? auswahl[0] : null;
      const schluessel = einzeln
        ? `e${einzeln.i}:${einzeln.h}:${einzeln.l}:${einzeln.a}:${einzeln.hd}:${bezahlbar}:${a.platzieren?.art}:${a.verbesserungen.length}`
        : `m${auswahl.map((e) => e.i).join(',')}:${bezahlbar}:${a.platzieren?.art}`;
      if (schluessel !== this.gezeigt) {
        this.wurzel.replaceChildren();
        if (einzeln) this.einheitBauen(einzeln, farbe);
        else this.gruppeBauen(auswahl, farbe);
        if (bauplan.length) this.baumenueBauen(bauplan, farbe);
        this.gezeigt = schluessel;
      }
      this.wurzel.hidden = false;
      return;
    }

    this.wurzel.hidden = true;
    this.gezeigt = null;
  }

  // Was ein Gebaeude ausbildet, mit den Kosten aus den Werten des Servers.
  // Das Bild einer Verbesserung. Wer eine Einheit austauscht, zeigt die neue
  // Einheit - der Webstuhl bleibt der Webstuhl (einheiten AC-24). Vorher
  // bekam jede Verbesserung den Webstuhl, auch die Soldatenstufe.
  verbesserungBildchen(art, mass, farbe) {
    const w = this.ansicht.werte.verbesserungen?.[art] || {};
    const wandelt = Object.values(w.wandelt || {})[0];
    if (wandelt) return bildchen(wandelt, mass, farbe);
    // Die Verbesserungen der Feudalzeit bringen ihr Zeichen als Wert mit
    // (bauen AC-25, AC-26); der Webstuhl bleibt der Webstuhl.
    if (w.zeichen && ZEICHEN[w.zeichen]) return zeichenBildchen(w.zeichen, mass, farbe);
    return webstuhlBildchen(mass, farbe);
  }

  angebot(gebaeude) {
    const werte = this.ansicht.werte;
    const aufstiege = werte.aufstiege || {};
    return (werte.gebaeude[gebaeude.art]?.bildetAus || [])
      // Eine erforschte Verbesserung verschwindet aus dem Angebot (bauen AC-21).
      .filter((art) => !this.ansicht.verbesserungen.includes(art))
      // Von den Zeitaltern steht nur das naechste zur Wahl (bauen AC-23) -
      // alle drei auf einmal waeren drei Knoepfe, von denen zwei absagen.
      .filter((art) => !aufstiege[art] || aufstiege[art].stufe === this.ansicht.zeitalter + 1)
      // Eine Einheit kann ein spaeteres Zeitalter verlangen als ihr Gebaeude
      // (einheiten AC-23): die Kaserne steht schon in der Dunklen Zeit, den
      // Speerkaempfer bildet sie erst ab der Feudalzeit aus.
      .filter((art) => ((werte.einheiten[art] || werte.verbesserungen?.[art])?.zeitalter || 0) <= this.ansicht.zeitalter)
      // Eine Verbesserung mit Vorstufe erscheint erst, wenn die Vorstufe
      // erforscht ist (bauen AC-34) - Eisenguss nach dem Schmiedeangriff.
      .filter((art) => {
        const vorstufe = werte.verbesserungen?.[art]?.vorstufe;
        return !vorstufe || this.ansicht.verbesserungen.includes(vorstufe);
      })
      // Die zweite Stufe ersetzt die erste: nach der Verbesserung bildet die
      // Kaserne Soldaten aus, nicht mehr Milizen (einheiten AC-24).
      .map((art) => {
        for (const v of this.ansicht.verbesserungen) {
          const nach = werte.verbesserungen?.[v]?.wandelt?.[art];
          if (nach) return nach;
        }
        return art;
      })
      .map((art) => ({
        art,
        name: aufstiege[art]?.name || werte.verbesserungen?.[art]?.name || FIGUREN[art]?.name || art,
        kosten: werte.einheiten[art]?.kosten || werte.verbesserungen?.[art]?.kosten || aufstiege[art]?.kosten || {},
        verbesserung: Boolean(werte.verbesserungen?.[art]),
        aufstieg: Boolean(aufstiege[art]),
        // „Aufstieg zum Lehen" - die Form steht in den Daten (bedienung AC-45).
        titel: aufstiege[art]?.titel,
      }));
  }

  // Was die Auswahl bauen kann: jedes Gebaeude, das mindestens einer baut -
  // und das im erreichten Zeitalter schon zu haben ist (bauen AC-24). Was
  // spaeter kommt, steht gar nicht erst im Menue.
  bauplan(auswahl) {
    const werte = this.ansicht.werte;
    const arten = new Set();
    for (const e of auswahl) {
      if (e.b !== this.ansicht.ich) continue;
      for (const art of werte.einheiten[this.ansicht.arten[e.k]]?.baut || []) {
        if ((werte.gebaeude[art]?.zeitalter || 0) <= this.ansicht.zeitalter) arten.add(art);
      }
    }
    return [...arten].map((art) => ({
      art,
      name: GEBAEUDE[art]?.name || art,
      kosten: werte.gebaeude[art]?.kosten || {},
      groesse: werte.gebaeude[art]?.groesse || 1,
    }));
  }

  gruppeBauen(auswahl, farbe) {
    const zaehlung = new Map();
    for (const e of auswahl) {
      const art = this.ansicht.arten[e.k] || 'dorfbewohner';
      zaehlung.set(art, (zaehlung.get(art) || 0) + 1);
    }
    const gruppe = element('div', 'gruppe');
    for (const [art, anzahl] of zaehlung) {
      const eintrag = element('div', 'gruppe-eintrag');
      eintrag.append(bildchen(art, 40, farbe), element('span', null, `${anzahl}`));
      eintrag.title = `${anzahl} ${FIGUREN[art]?.name || art}`;
      gruppe.append(eintrag);
    }
    // Kopf und Gruppe als ein Block mit Hoechstbreite, in dem die Gruppe
    // umbricht (bedienung AC-23): nebeneinander drueckten vierzehn Arten das
    // Baumenue auf eine Spalte, und die Leiste ragte oben aus dem Fenster.
    const block = element('div', 'gruppenblock');
    block.append(element('div', 'auswahl-kopf', `${auswahl.length} ausgewählt`), gruppe);
    this.wurzel.append(block);
  }

  // Das Baumenue (bedienung AC-25): ein Knopf je Gebaeude, ein Klick beginnt
  // das Platzieren (bauen AC-4).
  baumenueBauen(bauplan, farbe) {
    const menue = element('div', 'baumenue');
    menue.id = 'baumenue';
    if (this.ansicht.bautasten) menue.classList.add('tasten');
    for (const eintrag of bauplan) {
      const knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.dataset.bauen = eintrag.art;
      const fehlt = this.fehlt(eintrag.kosten);
      // Nicht `disabled`: ein gesperrter Knopf soll beim Ueberfahren noch sagen,
      // was fehlt - das tut er in Chrome nur, wenn er Zeigerereignisse bekommt.
      knopf.setAttribute('aria-disabled', fehlt ? 'true' : 'false');
      if (fehlt) knopf.dataset.fehlt = fehlt;
      const kosten = Object.entries(eintrag.kosten).map(([r, m]) => `${m} ${ROHSTOFF_NAMEN[r]}`).join(', ');
      knopf.title = fehlt ? `${eintrag.name} - zu wenig ${fehlt}` : `${eintrag.name} bauen (${kosten})`;
      if (this.ansicht.platzieren?.art === eintrag.art) knopf.classList.add('aktiv');
      const preis = element('span', 'preis');
      for (const [r, m] of Object.entries(eintrag.kosten)) preis.append(element('span', `ware ware-${r[0]}`), element('span', null, String(m)));
      knopf.append(gebaeudeBildchen(eintrag.art, 52, farbe, eintrag.groesse), element('span', 'bauname', eintrag.name), preis);
      // Die Taste nach B (bedienung AC-27), in der Reihenfolge des Menues.
      const nummer = bauplan.indexOf(eintrag);
      if (nummer < BAUTASTEN.length) knopf.append(element('kbd', 'taste', BAUTASTEN[nummer].toUpperCase()));
      knopf.addEventListener('click', () => {
        // Gesperrt sagt der Klick, warum (bedienung AC-18).
        if (fehlt) this.ansicht.melden(`Zu wenig ${fehlt}.`);
        else this.ansicht.platzierenBeginnen(eintrag.art);
      });
      menue.append(knopf);
    }
    this.wurzel.append(menue);
  }

  baustelleBauen(gebaeude, farbe) {
    const w = this.wurzel;
    w.replaceChildren();
    const name = GEBAEUDE[gebaeude.art]?.name || gebaeude.art;
    const bild = element('div', 'auswahl-bild');
    bild.append(gebaeudeBildchen(gebaeude.art, 58, farbe, 2));
    const kopfteil = element('div', 'auswahl-kopf');
    kopfteil.append(element('strong', null, `${name} im Bau`));
    const stand = element('div', 'leben');
    stand.id = 'baufortschritt';
    stand.dataset.bau = String(gebaeude.u);
    const balken = element('div', 'lebensbalken baubalken');
    const fuellung = element('span');
    fuellung.style.width = `${Math.round(gebaeude.u * 100)}%`;
    balken.append(fuellung);
    stand.append(balken, element('span', 'lebenszahl', `${Math.round(gebaeude.u * 100)} %`));
    kopfteil.append(stand);
    // Eine Baustelle hat erst so viel Leben, wie gebaut ist (bauen AC-7) -
    // gezeigt gegen das volle Leben, das sie fertig traegt.
    const voll = this.ansicht.gebaeudeLebenVoll(gebaeude) ?? gebaeude.h;
    const leben = element('div', 'leben');
    leben.id = 'baustellenleben';
    leben.dataset.leben = `${gebaeude.h}/${voll}`;
    const lebensbalken = element('div', 'lebensbalken');
    const lebensfuellung = element('span');
    lebensfuellung.style.width = `${Math.round((gebaeude.h / voll) * 100)}%`;
    lebensbalken.append(lebensfuellung);
    leben.append(lebensbalken, element('span', 'lebenszahl', `${gebaeude.h} / ${voll}`));
    leben.title = 'Leben - wächst mit dem Bau';
    kopfteil.append(leben);
    const abriss = document.createElement('button');
    abriss.type = 'button';
    abriss.dataset.abreissen = String(gebaeude.i);
    abriss.className = 'abriss';
    abriss.textContent = 'Abreissen';
    abriss.title = 'Was noch nicht verbaut ist, kommt zurück';
    abriss.addEventListener('click', () => this.senden({ auftrag: 'abreissen', gebaeude: gebaeude.i }));
    w.append(bild, kopfteil, abriss);
  }

  // Welche Handelsknoepfe gerade nicht gehen, als "kaufen:holz" - fuer den
  // Schluessel der Leiste und fuer die Knoepfe selbst.
  handelGesperrt() {
    const a = this.ansicht;
    const menge = a.werte.handel?.menge || 100;
    const gesperrt = [];
    for (const ware of a.werte.handel?.waren || []) {
      const [kauf] = a.handelspreise?.[ware] || [];
      if (!(a.vorraete.gold >= kauf)) gesperrt.push(`kaufen:${ware}`);
      if (!(a.vorraete[ware] >= menge)) gesperrt.push(`verkaufen:${ware}`);
    }
    return gesperrt;
  }

  // Der Markt (bauen AC-33): je Ware eine Spalte mit Kaufen und Verkaufen,
  // auf jedem Knopf der Preis in Gold, wie ihn der Server rechnet.
  handelBauen(gebaeude) {
    const a = this.ansicht;
    const menge = a.werte.handel?.menge || 100;
    const gesperrt = new Set(this.handelGesperrt());
    const handel = element('div', 'handel');
    handel.id = 'handel';
    for (const ware of a.werte.handel?.waren || []) {
      const [kauf, verkauf] = a.handelspreise?.[ware] || [];
      const spalte = element('div', 'handel-ware');
      spalte.dataset.ware = ware;
      const kopfzeile = element('div', 'handel-kopf');
      kopfzeile.append(element('span', `ware ware-${ware[0]}`), element('span', null, `${menge} ${ROHSTOFF_NAMEN[ware]}`));
      spalte.append(kopfzeile);
      for (const [richtung, gold, wort] of [['kaufen', kauf, 'Kaufen'], ['verkaufen', verkauf, 'Verkaufen']]) {
        const knopf = document.createElement('button');
        knopf.type = 'button';
        knopf.dataset.handel = richtung;
        knopf.dataset.ware = ware;
        knopf.dataset.gold = String(gold);
        const zu = gesperrt.has(`${richtung}:${ware}`);
        knopf.setAttribute('aria-disabled', zu ? 'true' : 'false');
        const grund = richtung === 'kaufen' ? 'Gold' : ROHSTOFF_NAMEN[ware];
        knopf.title = zu
          ? `${wort} - zu wenig ${grund}`
          : `${menge} ${ROHSTOFF_NAMEN[ware]} ${richtung} für ${gold} Gold`;
        const preis = element('span', 'preis');
        preis.append(element('span', 'ware ware-g'), element('span', null, String(gold)));
        knopf.append(element('span', 'handel-wort', wort), preis);
        knopf.addEventListener('click', () => {
          if (zu) this.ansicht.melden(`Zu wenig ${grund}.`);
          else this.senden({ auftrag: 'handeln', gebaeude: gebaeude.i, ware, richtung });
        });
        spalte.append(knopf);
      }
      handel.append(spalte);
    }
    return handel;
  }

  fehlt(kosten) {
    const vorraete = this.ansicht.vorraete;
    return Object.entries(kosten)
      .filter(([rohstoff, menge]) => vorraete[rohstoff] < menge)
      .map(([rohstoff]) => ROHSTOFF_NAMEN[rohstoff])
      .join(', ');
  }

  einheitBauen(einheit, farbe) {
    const w = this.wurzel;
    const werte = this.ansicht.werte.einheiten;
    const art = this.ansicht.arten[einheit.k] || 'dorfbewohner';
    const voll = this.ansicht.lebenVoll(einheit);
    const leben = einheit.h ?? voll;

    const bild = element('div', 'auswahl-bild');
    bild.append(bildchen(art, 58, farbe, { ladung: einheit.l > 0 ? einheit.a : null }));
    const kopfteil = kopf(FIGUREN[art]?.name || art, leben, voll);
    kopfteil.append(this.kampfwerteZeile(einheit, art));
    w.append(bild, kopfteil);

    // Nur wer tragen kann, zeigt, was er traegt.
    const tragkraft = werte[art]?.tragkraft || 0;
    if (tragkraft > 0) {
      const ladung = element('div', 'ladung');
      ladung.id = 'ladung';
      if (einheit.l > 0) {
        ladung.dataset.ware = einheit.a;
        ladung.append(element('span', `ware ware-${einheit.a}`), element('span', null, `trägt ${einheit.l} ${WAREN[einheit.a]?.name || ''}`));
        ladung.append(element('span', 'leise', ` von ${tragkraft}`));
      } else {
        ladung.append(element('span', 'leise', 'trägt nichts'));
      }
      w.append(ladung);
    }
    // Wer handelt, zeigt seine Strecke (einheiten AC-40).
    if (werte[art]?.handelt) w.append(this.streckeZeile(einheit));
  }

  /**
   * Die Strecke eines Karrens (einheiten AC-40): mit wessen Markt er handelt,
   * wie viel Gold eine Fahrt bringt und ob er es gerade heimbringt. Ohne
   * Strecke sagt sie, wie man eine bekommt - der Handel hat keinen Knopf.
   */
  streckeZeile(einheit) {
    const a = this.ansicht;
    const zeile = element('div', 'ladung');
    zeile.id = 'strecke';
    if (!einheit.hd) {
      zeile.append(element('span', 'leise', 'Handelt nicht – Rechtsklick auf einen anderen Markt'));
      return zeile;
    }
    const [, zielId, gold] = einheit.hd;
    const ziel = a.gebaeude.get(zielId);
    const wohin = !ziel || ziel.b === einheit.b
      ? 'Handelt zwischen zwei eigenen Märkten'
      : `Handelt mit dem Markt von ${a.spieler.get(ziel.b)?.name || 'einem Verbündeten'}`;
    zeile.dataset.gold = String(gold);
    zeile.append(element('span', `ware ware-g`), element('span', null, wohin));
    zeile.append(element('span', 'leise', einheit.l > 0 ? ` · bringt ${einheit.l} Gold heim` : ` · ${gold} Gold je Fahrt`));
    return zeile;
  }

  /**
   * Die Kampfwerte unter dem Namen (bedienung AC-35): Angriff, Ruestung nah
   * und fern, Reichweite - und der Bonus mit seinem Ziel ("+15 gegen
   * Kavallerie"). Ohne sie ist der Konterkreis der Stufe B fuer den Spieler
   * unsichtbar: er sieht, dass der Speerkaempfer den Reiter faellt, aber
   * nicht, warum.
   *
   * Die Zahlen kommen aus der Tafel, die der Server je Spieler schickt
   * (`welt.einheitenwert`), nicht aus den Grunddaten - sonst stuende hier 3
   * Angriff, wo der Schmiedeangriff 4 macht.
   */
  kampfwerteZeile(einheit, art, lesen = (feld) => this.ansicht.einheitenwert(einheit, feld)) {
    const a = this.ansicht;
    const zeile = element('div', 'kampfwerte');
    zeile.id = 'kampfwerte';
    const angriff = lesen('angriff');
    const nah = lesen('nahruestung');
    const fern = lesen('fernruestung');
    const reichweite = lesen('reichweite');
    Object.assign(zeile.dataset, {
      angriff: String(angriff), nahruestung: String(nah), fernruestung: String(fern), reichweite: String(reichweite),
    });
    const wert = (name, zahl, titel) => {
      const e = element('span', 'wert');
      if (name) e.append(element('span', 'leise', name));
      e.append(element('b', null, zahl));
      e.title = titel;
      return e;
    };
    // Wer nicht angreift (der Moench, einheiten AC-37), bekommt keinen
    // "Angriff 0 - Nahkampf", sondern das, was er stattdessen tut.
    const heilen = a.werte.einheiten[art]?.heilen;
    if (angriff > 0) {
      zeile.append(
        wert('Angriff', String(angriff), 'Schaden je Schlag, bevor die Rüstung des Ziels abgeht'),
        wert('Rüstung', `${nah} / ${fern}`, 'Rüstung gegen Nahkampf / gegen Fernkampf'),
        reichweite > 0
          ? wert('Reichweite', `${reichweite}`, 'Schussweite in Feldern')
          : wert(null, 'Nahkampf', 'Trifft nur, wer daneben steht'),
      );
    } else {
      zeile.append(
        wert(null, 'Greift nicht an', 'Ein Rechtsklick auf einen Gegner ist nur ein Gang dorthin'),
        wert('Rüstung', `${nah} / ${fern}`, 'Rüstung gegen Nahkampf / gegen Fernkampf'),
      );
    }
    const bekehren = a.werte.einheiten[art]?.bekehren;
    if (bekehren) {
      const e = wert('Bekehrt', `${bekehren.reichweite} Felder`, 'Rechtsklick auf eine fremde Einheit: nach ein paar Sekunden gehört sie dir – keine Gebäude, keine Belagerung, keine Mönche. Danach ruht er eine Weile.');
      zeile.dataset.bekehren = String(bekehren.reichweite);
      zeile.append(e);
    }
    if (heilen) {
      const e = wert('Heilt', `${heilen.je} Leben/s`, `Eigene Verletzte bis ${heilen.reichweite} Felder, einen nach dem anderen – nicht wer kämpft, keine Belagerung, keine Gebäude`);
      e.classList.add('heilt');
      zeile.dataset.heilen = String(heilen.je);
      zeile.append(e);
    }
    // Der Bonus steht in einer eigenen Zeile - er ist der Grund, warum eine
    // Einheit gegen eine andere taugt.
    const bonus = a.werte.einheiten[art]?.bonus;
    if (bonus) {
      const text = Object.entries(bonus)
        .map(([klasse, zuschlag]) => `+${zuschlag} gegen ${a.werte.klassen?.[klasse]?.name || klasse}`)
        .join(', ');
      const e = element('span', 'bonus', text);
      e.title = 'Zuschlag auf den Angriff gegen diese Einheiten';
      zeile.append(e);
    }
    return zeile;
  }

  gebaeudeBauen(gebaeude, angebot, farbe) {
    const w = this.wurzel;
    w.replaceChildren();
    const voll = this.ansicht.gebaeudeLebenVoll(gebaeude) ?? gebaeude.h;
    w.append(kopf(GEBAEUDE[gebaeude.art]?.name || gebaeude.art, gebaeude.h ?? voll, voll));
    // Ein Gebaeude, das schiesst, zeigt seine Kampfwerte wie eine Einheit
    // (bauen AC-29, bedienung AC-35) - aus der Tafel seines Besitzers.
    const a = this.ansicht;
    const gebaeudewert = (feld) => a.einheitenwerte.get(gebaeude.b)?.[gebaeude.art]?.[feld] ?? a.werte.gebaeude[gebaeude.art]?.[feld] ?? 0;
    if (gebaeudewert('angriff') > 0) w.append(this.kampfwerteZeile(gebaeude, gebaeude.art, gebaeudewert));
    // Eine Farm zeigt, wie viel Nahrung sie noch traegt (einheiten AC-18).
    const vorrat = this.ansicht.farmVoll(gebaeude);
    if (vorrat && gebaeude.n !== undefined) {
      const zeile = element('div', 'ladung');
      zeile.id = 'farmvorrat';
      zeile.append(element('span', 'ware ware-n'), element('span', null, `noch ${gebaeude.n} Nahrung`), element('span', 'leise', ` von ${vorrat}`));
      w.append(zeile);
    }

    // Am Markt wird getauscht (bauen AC-33).
    if (a.werte.gebaeude[gebaeude.art]?.handel) w.append(this.handelBauen(gebaeude));

    // Was nichts ausbildet, zeigt weder Knoepfe noch eine leere Schlange.
    if (!angebot.length && !gebaeude.s.length) return;
    const knoepfe = element('div', 'ausbilden');
    for (const eintrag of angebot) {
      const knopf = document.createElement('button');
      knopf.type = 'button';
      knopf.dataset.ausbilden = eintrag.art;
      const fehlt = this.fehlt(eintrag.kosten);
      // Wie im Baumenue: gesperrt, aber noch ansprechbar - er sagt, was fehlt.
      knopf.setAttribute('aria-disabled', fehlt ? 'true' : 'false');
      if (fehlt) knopf.dataset.fehlt = fehlt;
      const kosten = Object.entries(eintrag.kosten).map(([r, m]) => `${m} ${ROHSTOFF_NAMEN[r]}`).join(', ');
      if (eintrag.aufstieg) {
        knopf.dataset.aufstieg = eintrag.art;
        knopf.title = fehlt
          ? `${eintrag.titel} - zu wenig ${fehlt}`
          : `${eintrag.titel} (${kosten})`;
      } else {
        // Eine Verbesserung wird erforscht, keine Einheit ausgebildet.
        const tun = eintrag.verbesserung ? 'erforschen' : 'ausbilden';
        knopf.title = fehlt ? `${eintrag.name} - zu wenig ${fehlt}` : `${eintrag.name} ${tun} (${kosten})`;
      }
      const preis = element('span', 'preis');
      for (const [r, m] of Object.entries(eintrag.kosten)) preis.append(element('span', `ware ware-${r[0]}`), element('span', null, String(m)));
      if (eintrag.aufstieg) knopf.append(aufstiegBildchen(58, farbe));
      else if (eintrag.verbesserung) knopf.append(this.verbesserungBildchen(eintrag.art, 58, farbe));
      else knopf.append(bildchen(eintrag.art, 58, farbe));
      knopf.append(preis);
      knopf.addEventListener('click', () => {
        if (fehlt) this.ansicht.melden(`Zu wenig ${fehlt}.`);
        else this.senden({ auftrag: 'ausbilden', gebaeude: gebaeude.i, einheit: eintrag.art });
      });
      knoepfe.append(knopf);
    }
    w.append(knoepfe);

    const schlange = element('div', 'schlange');
    gebaeude.s.forEach((art, platz) => {
      const eintrag = document.createElement('button');
      eintrag.type = 'button';
      eintrag.dataset.abbrechen = String(platz);
      eintrag.title = 'Abbrechen - die Kosten kommen voll zurück';
      const mass = platz === 0 ? 50 : 38;
      const verbesserung = Boolean(this.ansicht.werte.verbesserungen?.[art]);
      const aufstieg = Boolean(this.ansicht.werte.aufstiege?.[art]);
      if (aufstieg) {
        eintrag.append(aufstiegBildchen(mass, farbe));
        eintrag.dataset.laufenderAufstieg = art;
      } else if (verbesserung) {
        eintrag.append(this.verbesserungBildchen(art, mass, farbe));
      } else {
        eintrag.append(bildchen(art, mass, farbe));
      }
      if (platz === 0) {
        eintrag.classList.add('laufend');
        const balken = element('div', 'fortschritt');
        balken.append(element('span'));
        eintrag.append(balken);
      }
      eintrag.addEventListener('click', () => {
        this.senden({ auftrag: 'abbrechen', gebaeude: gebaeude.i, platz });
      });
      schlange.append(eintrag);
    });
    w.append(schlange);

    // Warum nichts vorangeht (bauen AC-15).
    if (gebaeude.w) {
      const hinweis = element('p', 'wartegrund', 'Bevölkerung voll — Haus bauen');
      hinweis.id = 'wartegrund';
      w.append(hinweis);
    }
  }
}
