// @ts-check
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

// Seen ohne Loecher und ohne Spritzer: Land, das fast ganz von Wasser umgeben
// ist, wird Wasser; einzelne Wasserfelder an Land werden Gras. Sonst zeigte das
// weiche Ufer (darstellung AC-2) mitten im See kleine Sandinseln.
function seenGlaetten(felder, groesse) {
  const nachbarn = (x, y) => {
    let wasser = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < groesse && ny < groesse && felder[ny * groesse + nx] === WASSER) wasser++;
      }
    }
    return wasser;
  };
  const neu = felder.slice();
  for (let y = 0; y < groesse; y++) {
    for (let x = 0; x < groesse; x++) {
      const i = y * groesse + x;
      const wasser = nachbarn(x, y);
      if (felder[i] !== WASSER && wasser >= 6) neu[i] = WASSER;
      else if (felder[i] === WASSER && wasser <= 2) neu[i] = GRAS;
    }
  }
  felder.set(neu);
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
const SCHAFE_JE_BASIS = 8;
// Ausserhalb des Dorfzentrums (4 x 4 Felder, bauen AC-3), sonst verdeckt es sie.
const SCHAF_ABSTAND = 5;
const SCHAF_NAHRUNG = 100;

// Zwei Waeldchen in verschiedenen Richtungen, je ein voller Kreis.
const WAELDCHEN = [
  { abstand: 12, winkel: 0, radius: 3 },
  { abstand: 11, winkel: -(5 * Math.PI) / 6, radius: 3 },
];

// Weitere Vorkommen ausserhalb des freigeraeumten Dorfs (AC-18, Benutzer
// 2026-11-17: "nur die Standard Gold und Stein Abbaumoeglichkeiten, da muss
// noch bissl mehr rein"). Je Basis zwei kleine Goldfelder seitlich und ein
// Steinfeld zur Kartenmitte hin - nach aussen liegt der Kartenrand zu nah.
// Sie liegen im Zufallsgelaende: gesucht wird der naechste Platz, an dem das
// Feld samt einem Ring Gras Platz hat und den man vom Dorf aus zu Fuss
// erreicht (`freierPlatz`).
const BLOCK = [[0, 0], [1, 0], [0, 1], [1, 1]];
const FERNE = [
  { art: GOLD, abstand: 19, winkel: (23 * Math.PI) / 36, form: BLOCK },
  { art: GOLD, abstand: 22, winkel: -(11 * Math.PI) / 18, form: BLOCK },
  { art: STEIN, abstand: 20, winkel: Math.PI, form: BLOCK },
];
// Und zwischen je zwei Nachbarn ein umkaempftes Vorkommen: Gold und daneben
// Stein, auf dem Winkel genau zwischen beiden, naeher an der Mitte als die
// Doerfer (`ring`: Anteil am Radius des Basenkreises) - von beiden gleich weit.
const GRENZE = { ring: 0.6, gold: BLOCK, stein: [[0, 0], [1, 0], [0, 1]], versatz: 4 };

// Wie viel Gold und Stein auf der Karte liegt (AC-19), eine Einstellung beim
// Eroeffnen: wenig ist das Dorf allein (je Spieler 7 Felder Gold, 5 Stein),
// mittel dazu das umkaempfte Vorkommen zwischen den Nachbarn (11 und 8), viel
// dazu die eigenen ausserhalb des Dorfs (19 und 12).
const VORKOMMEN = {
  wenig: { ferne: false, grenze: false },
  mittel: { ferne: false, grenze: true },
  viel: { ferne: true, grenze: true },
};
const VORKOMMEN_VORGABE = 'mittel';

/** Welche Felder man von (x, y) aus ueber Gras erreicht. */
function erreichbarVon(felder, groesse, x, y) {
  const erreicht = new Uint8Array(groesse * groesse);
  const reihe = [y * groesse + x];
  erreicht[reihe[0]] = 1;
  for (let i = 0; i < reihe.length; i++) {
    const fx = reihe[i] % groesse;
    const fy = (reihe[i] / groesse) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = fx + dx;
      const ny = fy + dy;
      if (nx < 0 || ny < 0 || nx >= groesse || ny >= groesse) continue;
      const n = ny * groesse + nx;
      if (erreicht[n] || felder[n] !== GRAS) continue;
      erreicht[n] = 1;
      reihe.push(n);
    }
  }
  return erreicht;
}

/** Passt die Form bei (x, y) samt einem Ring Gras, drei Felder vom Rand und zu Fuss erreichbar? */
function passt(felder, groesse, erreichbar, form, x, y) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [dx, dy] of form) {
    x0 = Math.min(x0, x + dx);
    x1 = Math.max(x1, x + dx);
    y0 = Math.min(y0, y + dy);
    y1 = Math.max(y1, y + dy);
  }
  if (x0 < 3 || y0 < 3 || x1 >= groesse - 3 || y1 >= groesse - 3) return false;
  let zuFuss = false;
  for (let fy = y0 - 1; fy <= y1 + 1; fy++) {
    for (let fx = x0 - 1; fx <= x1 + 1; fx++) {
      if (felder[fy * groesse + fx] !== GRAS) return false;
      if (erreichbar[fy * groesse + fx]) zuFuss = true;
    }
  }
  return zuFuss;
}

// Wie oft der Notbehelf gerodet hat - nur fuer Messungen.
const ZAEHLER = { notbehelf: 0 };

/**
 * Der erste der Plaetze, an dem die Form liegen kann - sonst der erste, dann
 * freigeraeumt. Die Plaetze kommen in der Reihenfolge, in der sie recht sind.
 */
function freierPlatz(felder, groesse, erreichbar, form, plaetze) {
  for (const platz of plaetze) {
    if (passt(felder, groesse, erreichbar, form, platz.x, platz.y)) return platz;
  }
  // Nirgends: dann wird am ersten Platz freigeraeumt, weit genug fuer den
  // Ring. Das kann eine Lichtung im Wald sein, zu der man sich durchschlaegt.
  const [erster] = plaetze;
  const x = Math.max(5, Math.min(groesse - 7, erster.x));
  const y = Math.max(5, Math.min(groesse - 7, erster.y));
  freiraeumen(felder, groesse, x, y, 3);
  ZAEHLER.notbehelf += 1;
  return { x, y };
}

/**
 * Die Plaetze um einen Punkt: zuerst die, die von beiden Nachbarn gleich weit
 * liegen (in Schritten von zwei Feldern), darunter von innen nach aussen.
 */
function umkreis(x, y, radius, a, b) {
  const plaetze = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (Math.hypot(dx, dy) > radius) continue;
      const ungleich = Math.abs(Math.hypot(x + dx - a.x, y + dy - a.y) - Math.hypot(x + dx - b.x, y + dy - b.y));
      plaetze.push({ x: x + dx, y: y + dy, weit: Math.hypot(dx, dy), ungleich: Math.floor(ungleich / 2) });
    }
  }
  return plaetze.sort((p, q) => p.ungleich - q.ungleich || p.weit - q.weit || p.y - q.y || p.x - q.x);
}

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
 * @param {{kartengroesse?: string, vorkommen?: string}} [einstellungen]
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
  seenGlaetten(felder, groesse);
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

  // Die weiteren Vorkommen (AC-18) - erst wenn jedes Dorf steht, und ohne
  // den Zufall anzufassen: der Rest der Karte bleibt, wie er war.
  const zuFuss = basen.map((basis) => erreichbarVon(felder, groesse, basis.x, basis.y));
  // Wo sie liegen und wem sie zugedacht sind - fuer Tests und Messungen, es
  // geht nicht ueber die Leitung.
  const fundorte = [];
  const legen = (art, form, platz, wem) => {
    for (const [dx, dy] of form) setzen(felder, groesse, platz.x + dx, platz.y + dy, art);
    fundorte.push({ art, x: platz.x, y: platz.y, felder: form.length, ...wem });
  };
  const stufe = VORKOMMEN[einstellungen.vorkommen] || VORKOMMEN[VORKOMMEN_VORGABE];
  if (stufe.ferne) basen.forEach((basis, i) => {
    for (const eintrag of FERNE) {
      // Erst derselbe Abstand mit etwas anderem Winkel, dann weiter weg -
      // naeher nie, sonst laege es im Dorf.
      const plaetze = [];
      for (const mehr of [0, 1, 2, 3, 4, 5, 6]) {
        for (const dreh of [0, 0.12, -0.12, 0.24, -0.24, 0.36, -0.36, 0.48, -0.48]) {
          plaetze.push(vorkommen(basis, { abstand: eintrag.abstand + mehr, winkel: eintrag.winkel + dreh }));
        }
      }
      legen(eintrag.art, eintrag.form, freierPlatz(felder, groesse, zuFuss[i], eintrag.form, plaetze), { basis: i });
    }
  });
  const ring = groesse * 0.36 * GRENZE.ring;
  if (stufe.grenze) basen.forEach((basis, i) => {
    const winkel = basis.winkel + Math.PI / basen.length;
    const mx = Math.round(groesse / 2 + Math.cos(winkel) * ring);
    const my = Math.round(groesse / 2 + Math.sin(winkel) * ring);
    const nachbar = basen[(i + 1) % basen.length];
    const gold = freierPlatz(felder, groesse, zuFuss[i], GRENZE.gold, umkreis(mx, my, 8, basis, nachbar));
    const nachbarn = { zwischen: [i, (i + 1) % basen.length] };
    legen(GOLD, GRENZE.gold, gold, nachbarn);
    // Der Stein daneben, zur Mitte hin - quer dazu laege er einem der zwei
    // Nachbarn naeher.
    const sx = Math.round(gold.x - Math.cos(winkel) * GRENZE.versatz);
    const sy = Math.round(gold.y - Math.sin(winkel) * GRENZE.versatz);
    legen(STEIN, GRENZE.stein, freierPlatz(felder, groesse, zuFuss[i], GRENZE.stein, umkreis(sx, sy, 8, basis, nachbar)), nachbarn);
  });

  const vorrat = new Map();
  for (let i = 0; i < felder.length; i++) {
    if (VORRAT[felder[i]]) vorrat.set(i, VORRAT[felder[i]]);
  }

  // Acht Schafe je Basis im Kreis naeher am Zentrum als alles andere (AC-14,
  // AC-16). Sie stehen auf Gras und sperren kein Feld - Tiere sind keine
  // Vorraete auf dem Raster, sondern gehoeren dem Spieler.
  const schafe = [];
  basen.forEach((basis, spieler) => {
    for (let i = 0; i < SCHAFE_JE_BASIS; i++) {
      const stelle = vorkommen(basis, { abstand: SCHAF_ABSTAND, winkel: Math.PI / 4 + (i * 2 * Math.PI) / SCHAFE_JE_BASIS });
      schafe.push({ spieler, x: stelle.x, y: stelle.y });
    }
  });

  return { groesse, felder, basen: basen.map(({ x, y }) => ({ x, y })), vorrat, schafe, fundorte };
}

// Ein Gebaeude belegt seine Grundflaeche mit dieser Feldart. Die Wegsuche geht
// nur ueber Gras und weicht damit von selbst aus (bauen AC-3).
const BEBAUT = 6;

function begehbar(karte, x, y) {
  if (x < 0 || y < 0 || x >= karte.groesse || y >= karte.groesse) return false;
  return karte.felder[y * karte.groesse + x] === GRAS;
}

module.exports = {
  GRAS, WALD, BEERE, WASSER, GOLD, STEIN, BEBAUT, VORRAT, AUSSTATTUNG, WAELDCHEN, FERNE, GRENZE, VORKOMMEN, VORKOMMEN_VORGABE, ZAEHLER, freierPlatz,
  SCHAFE_JE_BASIS, SCHAF_NAHRUNG,
  erzeugen, begehbar, zufallAus, kartengroesse, GROESSE_MAX,
};
