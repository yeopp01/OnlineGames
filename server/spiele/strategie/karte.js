'use strict';

// Die Karte nach der Vorlage (→ specs/10-strategie/karte-und-vorraete.md).
//
// Jedes Feld hat eine Art. Vorraete sind einzelne Dinge auf je einem Feld:
// ein Baum, ein Beerenstrauch, ein Stueck Gold- oder Steinfeld. Sie sind
// unbegehbar, bis sie leer sind (AC-13).

// Feldarten. Die Zahlen gehen genau so zum Browser, darum bleiben sie klein.
const GRAS = 0;
const WALD = 1; // ein Baum
const BEERE = 2;
const WASSER = 3;
const GOLD = 4;
const STEIN = 5;

// Was ein Vorrat traegt (Vorlage: docs/strategie/vorlage-aoe2.md).
const VORRAT = { [WALD]: 100, [BEERE]: 125, [GOLD]: 800, [STEIN]: 350 };

// Kartengroesse je Spielerzahl (AC-11): zwei Spieler 120, acht 200, dazwischen
// gleichmaessig. Die Einstellung staucht oder streckt, hoechstens 200.
const GROESSE_ZWEI = 120;
const GROESSE_ACHT = 200;
const GROESSE_MAX = 200;
const FAKTOR = { klein: 0.8, normal: 1, gross: 1.2 };

function kartengroesse(anzahlSpieler, einstellung = 'normal') {
  const n = Math.max(2, Math.min(8, anzahlSpieler));
  const grund = GROESSE_ZWEI + ((GROESSE_ACHT - GROESSE_ZWEI) * (n - 2)) / 6;
  return Math.min(GROESSE_MAX, Math.round(grund * (FAKTOR[einstellung] || 1)));
}

// Zufall mit Startwert: dieselbe Zahl ergibt dieselbe Karte. Praktisch, um
// einen Fehler noch einmal genauso hervorzurufen.
function zufallAus(startwert) {
  let a = startwert >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function setzen(felder, groesse, x, y, art) {
  if (x < 0 || y < 0 || x >= groesse || y >= groesse) return;
  felder[y * groesse + x] = art;
}

function klecks(felder, groesse, zufall, mx, my, radius, art) {
  for (let y = my - radius; y <= my + radius; y++) {
    for (let x = mx - radius; x <= mx + radius; x++) {
      const abstand = Math.hypot(x - mx, y - my);
      if (abstand > radius) continue;
      if (zufall() < 1 - abstand / (radius + 1)) setzen(felder, groesse, x, y, art);
    }
  }
}

// Die Basen liegen gleichmaessig auf einem Kreis um die Kartenmitte, damit
// niemand einen kuerzeren Weg zur Mitte hat als die anderen.
function basisplaetze(groesse, anzahl) {
  const mitte = groesse / 2;
  const radius = groesse * 0.36;
  const plaetze = [];
  for (let i = 0; i < anzahl; i++) {
    const winkel = (i / anzahl) * Math.PI * 2 - Math.PI / 2;
    plaetze.push({
      x: Math.round(mitte + Math.cos(winkel) * radius),
      y: Math.round(mitte + Math.sin(winkel) * radius),
      winkel,
    });
  }
  return plaetze;
}

function freiraeumen(felder, groesse, x, y, radius) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (Math.hypot(dx, dy) <= radius) setzen(felder, groesse, x + dx, y + dy, GRAS);
    }
  }
}

// Die Ausstattung jeder Basis (AC-14). Die Lage eines Vorkommens dreht mit
// der Basis, seine Form nicht - so hat jeder Spieler exakt gleich viele Felder
// in exakt gleichem Abstand, egal wie schief die Basis zur Mitte liegt.
// Winkel relativ zur Richtung "von der Kartenmitte nach aussen".
// Jede Form liegt rund um ihren Mittelpunkt: eine laengliche Form laege je
// nach Drehung der Basis mal laengs, mal quer - und im Mittel mal naeher, mal
// weiter (in Runde 11 gemessen: ein 3x2-Block Beeren streute 6,8 bis 7,8).
const AUSSTATTUNG = [
  { art: BEERE, abstand: 7, winkel: Math.PI / 2, form: [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1]] },
  { art: GOLD, abstand: 10, winkel: -Math.PI / 3, form: [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]] },
  { art: STEIN, abstand: 11, winkel: (5 * Math.PI) / 6, form: [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] },
];
// Zwei Waeldchen in verschiedenen Richtungen, je ein voller Kreis.
const WAELDCHEN = [
  { abstand: 12, winkel: 0, radius: 3 },
  { abstand: 11, winkel: -(5 * Math.PI) / 6, radius: 3 },
];

// Auf dem Raster laesst sich nicht jede Drehung genau treffen. Von den vier
// Feldern um die gedrehte Lage gilt das, dessen Abstand zur Basis dem
// Sollabstand am naechsten kommt - sonst lagen in Runde 11 die Steine mal
// 10,6 und mal 11,7 Felder entfernt.
function vorkommen(basis, eintrag) {
  const richtung = basis.winkel + eintrag.winkel;
  const x = basis.x + Math.cos(richtung) * eintrag.abstand;
  const y = basis.y + Math.sin(richtung) * eintrag.abstand;
  let bestes = null;
  let besteAbweichung = Infinity;
  for (const kx of [Math.floor(x), Math.ceil(x)]) {
    for (const ky of [Math.floor(y), Math.ceil(y)]) {
      const abweichung = Math.abs(Math.hypot(kx - basis.x, ky - basis.y) - eintrag.abstand)
        + Math.hypot(kx - x, ky - y) * 0.01; // bei Gleichstand das naechstgelegene
      if (abweichung < besteAbweichung) {
        besteAbweichung = abweichung;
        bestes = { x: kx, y: ky };
      }
    }
  }
  return bestes;
}

/**
 * @param {number} startwert
 * @param {number} anzahlSpieler
 * @param {{kartengroesse?: string}} [einstellungen]
 */
function erzeugen(startwert, anzahlSpieler, einstellungen = {}) {
  const zufall = zufallAus(startwert);
  const groesse = kartengroesse(anzahlSpieler, einstellungen.kartengroesse);
  const felder = new Uint8Array(groesse * groesse).fill(GRAS);
  const flaeche = (groesse * groesse) / (64 * 64);

  // Hintergrund: Seen, Waelder, verstreute Beeren - mit der Flaeche mehr.
  const zufallsZahl = (von, bis) => von + Math.floor(zufall() * (bis - von + 1));
  for (let i = 0; i < Math.round(4 * flaeche); i++) {
    klecks(felder, groesse, zufall, zufallsZahl(0, groesse - 1), zufallsZahl(0, groesse - 1), zufallsZahl(3, 6), WASSER);
  }
  for (let i = 0; i < Math.round(22 * flaeche); i++) {
    klecks(felder, groesse, zufall, zufallsZahl(0, groesse - 1), zufallsZahl(0, groesse - 1), zufallsZahl(2, 5), WALD);
  }
  for (let i = 0; i < Math.round(4 * flaeche); i++) {
    klecks(felder, groesse, zufall, zufallsZahl(0, groesse - 1), zufallsZahl(0, groesse - 1), 1, BEERE);
  }

  const basen = basisplaetze(groesse, anzahlSpieler);
  // Erst alle Basen freiraeumen, dann alle ausstatten - sonst loescht das
  // Freiraeumen einer Basis die Ausstattung einer benachbarten.
  for (const basis of basen) freiraeumen(felder, groesse, basis.x, basis.y, 16);
  for (const basis of basen) {
    for (const eintrag of AUSSTATTUNG) {
      const mitte = vorkommen(basis, eintrag);
      for (const [dx, dy] of eintrag.form) setzen(felder, groesse, mitte.x + dx, mitte.y + dy, eintrag.art);
    }
    for (const w of WAELDCHEN) {
      const mitte = vorkommen(basis, w);
      for (let dy = -w.radius; dy <= w.radius; dy++) {
        for (let dx = -w.radius; dx <= w.radius; dx++) {
          if (Math.hypot(dx, dy) <= w.radius) setzen(felder, groesse, mitte.x + dx, mitte.y + dy, WALD);
        }
      }
    }
  }

  const vorrat = new Map();
  for (let i = 0; i < felder.length; i++) {
    if (VORRAT[felder[i]]) vorrat.set(i, VORRAT[felder[i]]);
  }

  return { groesse, felder, basen: basen.map(({ x, y }) => ({ x, y })), vorrat };
}

function begehbar(karte, x, y) {
  if (x < 0 || y < 0 || x >= karte.groesse || y >= karte.groesse) return false;
  return karte.felder[y * karte.groesse + x] === GRAS;
}

module.exports = {
  GRAS, WALD, BEERE, WASSER, GOLD, STEIN, VORRAT, AUSSTATTUNG, WAELDCHEN,
  erzeugen, begehbar, zufallAus, kartengroesse, GROESSE_MAX,
};
