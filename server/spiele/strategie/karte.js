'use strict';

// Feldarten. Die Zahlen gehen genau so zum Browser, darum bleiben sie klein.
const GRAS = 0;
const WALD = 1;
const BEERE = 2;
const WASSER = 3;

const VORRAT = { [WALD]: 120, [BEERE]: 80 };

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

function klecks(felder, groesse, zufall, mx, my, radius, art) {
  for (let y = my - radius; y <= my + radius; y++) {
    for (let x = mx - radius; x <= mx + radius; x++) {
      if (x < 0 || y < 0 || x >= groesse || y >= groesse) continue;
      const abstand = Math.hypot(x - mx, y - my);
      if (abstand > radius) continue;
      if (zufall() < 1 - abstand / (radius + 1)) felder[y * groesse + x] = art;
    }
  }
}

// Die Basen liegen gleichmässig auf einem Kreis um die Kartenmitte, damit
// niemand einen kuerzeren Weg zur Mitte hat als die anderen.
function basisplaetze(groesse, anzahl) {
  const mitte = groesse / 2;
  const radius = groesse * 0.33;
  const plaetze = [];
  for (let i = 0; i < anzahl; i++) {
    const winkel = (i / anzahl) * Math.PI * 2 - Math.PI / 2;
    plaetze.push({
      x: Math.round(mitte + Math.cos(winkel) * radius),
      y: Math.round(mitte + Math.sin(winkel) * radius),
    });
  }
  return plaetze;
}

function freiraeumen(felder, groesse, x, y, radius) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= groesse || ny >= groesse) continue;
      if (Math.hypot(dx, dy) <= radius) felder[ny * groesse + nx] = GRAS;
    }
  }
}

function erzeugen(startwert, anzahlSpieler, groesse = 64) {
  const zufall = zufallAus(startwert);
  const felder = new Uint8Array(groesse * groesse).fill(GRAS);

  for (let i = 0; i < 5; i++) {
    klecks(felder, groesse, zufall,
      Math.floor(zufall() * groesse), Math.floor(zufall() * groesse),
      3 + Math.floor(zufall() * 4), WASSER);
  }
  for (let i = 0; i < 26; i++) {
    klecks(felder, groesse, zufall,
      Math.floor(zufall() * groesse), Math.floor(zufall() * groesse),
      2 + Math.floor(zufall() * 3), WALD);
  }
  for (let i = 0; i < 18; i++) {
    klecks(felder, groesse, zufall,
      Math.floor(zufall() * groesse), Math.floor(zufall() * groesse),
      1 + Math.floor(zufall() * 2), BEERE);
  }

  const basen = basisplaetze(groesse, anzahlSpieler);
  // Rund um jede Basis Platz schaffen und dann Vorraete in Reichweite legen,
  // damit alle Spieler denselben Start haben.
  for (const basis of basen) {
    freiraeumen(felder, groesse, basis.x, basis.y, 4);
    klecks(felder, groesse, zufall, basis.x + 6, basis.y, 2, WALD);
    klecks(felder, groesse, zufall, basis.x - 6, basis.y, 2, WALD);
    klecks(felder, groesse, zufall, basis.x, basis.y + 6, 2, BEERE);
    freiraeumen(felder, groesse, basis.x, basis.y, 2);
  }

  const vorrat = new Map();
  for (let i = 0; i < felder.length; i++) {
    if (VORRAT[felder[i]]) vorrat.set(i, VORRAT[felder[i]]);
  }

  return { groesse, felder, basen, vorrat };
}

function begehbar(karte, x, y) {
  if (x < 0 || y < 0 || x >= karte.groesse || y >= karte.groesse) return false;
  return karte.felder[y * karte.groesse + x] === GRAS;
}

module.exports = { GRAS, WALD, BEERE, WASSER, erzeugen, begehbar, zufallAus };
