// Gebaeude, in Code gezeichnet wie die Figuren (→ specs/10-strategie/darstellung.md
// AC-4, AC-5). Kein Material aus dem Original. Der Fusspunkt ist die Mitte der
// Grundflaeche; e ist eine halbe Rautenbreite in Bildpunkten. Licht kommt von
// links oben: die linke Wand liegt im Schatten, die rechte im Licht. Die
// Spielerfarbe steht an einer festen Stelle - Fahne, Tuer oder Wimpel -, nie
// als ganze Flaeche.

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
  stift.strokeStyle = KONTUR;
}

function kreis(stift, x, y, r, farbe, rand = true) {
  stift.beginPath();
  stift.arc(x, y, r, 0, Math.PI * 2);
  stift.fillStyle = farbe;
  stift.fill();
  if (rand) stift.stroke();
}

// Zwischen zwei Punkten, Anteil t.
const zwischen = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const hoch = (p, z) => [p[0], p[1] - z];

function vorbereiten(stift, e, W, H) {
  stift.fillStyle = 'rgba(0,0,0,0.28)';
  stift.beginPath();
  stift.ellipse(0.25 * e, 0.12 * e, W * 1.12, H * 1.2, 0, 0, Math.PI * 2);
  stift.fill();
  stift.strokeStyle = KONTUR;
  stift.lineWidth = Math.max(1, e * 0.05);
  stift.lineJoin = 'round';
}

// Sockel und zwei sichtbare Waende einer Raute mit halber Breite W. Gibt die
// Ecken unten und die Hoehe der Traufe zurueck.
function kasten(stift, W, sockel, wand, { sockelL, sockelR, wandL, wandR }) {
  const L = [-W, 0];
  const B = [0, W / 2];
  const R = [W, 0];
  flaeche(stift, [L, B, hoch(B, sockel), hoch(L, sockel)], sockelL);
  flaeche(stift, [B, R, hoch(R, sockel), hoch(B, sockel)], sockelR);
  const L1 = hoch(L, sockel);
  const B1 = hoch(B, sockel);
  const R1 = hoch(R, sockel);
  flaeche(stift, [L1, B1, hoch(B1, wand), hoch(L1, wand)], wandL);
  flaeche(stift, [B1, R1, hoch(R1, wand), hoch(B1, wand)], wandR);
  return { L, B, R, L1, B1, R1, traufe: sockel + wand };
}

// Walmdach ueber einer Raute: vier Flaechen, oben ein kurzer First.
function walmdach(stift, W, traufe, first, { hinten, links, rechts, seite }, ueber = 1.12) {
  const H = W / 2;
  const L2 = hoch([-W * ueber, 0], traufe);
  const B2 = hoch([0, H * ueber], traufe);
  const R2 = hoch([W * ueber, 0], traufe);
  const T2 = hoch([0, -H * ueber], traufe);
  const F1 = [-0.24 * W, -traufe - first + 0.04 * W];
  const F2 = [0.24 * W, -traufe - first - 0.04 * W];
  flaeche(stift, [L2, T2, F2, F1], hinten);
  flaeche(stift, [L2, B2, F1], links);
  flaeche(stift, [B2, R2, F2, F1], rechts);
  flaeche(stift, [R2, T2, F2], seite);
  return { L2, B2, R2, T2, F1, F2 };
}

function fahne(stift, fuss, e, farbe, hoehe = 1.1) {
  const spitze = [fuss[0], fuss[1] - hoehe * e];
  linie(stift, fuss, spitze, '#3a2c1f', Math.max(1, e * 0.07));
  stift.lineWidth = Math.max(0.8, e * 0.04);
  flaeche(stift, [spitze, [spitze[0] + 0.75 * e, spitze[1] + 0.18 * e], [spitze[0], spitze[1] + 0.42 * e]], farbe);
}

// ---- Dorfzentrum ------------------------------------------------------------

// Steinsockel, Fachwerk, Walmdach, Tuer zur Bildseite und eine Fahne in
// Spielerfarbe - daran erkennt man, wem es gehoert.
function dorfzentrum(stift, e, farbe) {
  const W = 2.3 * e;
  vorbereiten(stift, e, W, W / 2);
  const { L1, B1, R1, traufe } = kasten(stift, W, 0.28 * e, 1.25 * e, {
    sockelL: '#8d8a83', sockelR: '#a9a59c', wandL: '#b58d58', wandR: '#d4ab70',
  });
  const wand = 1.25 * e;

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
      [mitte[0] - 0.14 * e, mitte[1] - 0.07 * e],
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

  const dach = walmdach(stift, W, traufe, 1.35 * e, {
    hinten: '#6f2c20', links: '#8a3526', rechts: '#a8432f', seite: '#7c3022',
  });
  for (const t of [0.3, 0.55, 0.8]) {
    linie(stift, zwischen(dach.B2, dach.F1, t), zwischen(dach.R2, dach.F2, t), '#7a2c1e', Math.max(0.8, e * 0.04));
  }
  fahne(stift, dach.F2, e, farbe);
}

// ---- Haus -------------------------------------------------------------------

// Klein und hell: weisser Putz mit Balken, steiles Strohdach, Schornstein.
// Die Tuer traegt die Spielerfarbe.
function haus(stift, e, farbe) {
  const W = 1.8 * e;
  vorbereiten(stift, e, W, W / 2);
  const wand = 0.85 * e;
  const { L1, B1, R1, traufe } = kasten(stift, W, 0.14 * e, wand, {
    sockelL: '#8d8a83', sockelR: '#a9a59c', wandL: '#d9ccb0', wandR: '#efe4cc',
  });
  const balken = '#6b4a2b';
  const dicke = Math.max(1, e * 0.08);
  for (const [a, b] of [[L1, B1], [B1, R1]]) {
    for (const t of [0.03, 0.97]) {
      const unten = zwischen(a, b, t);
      linie(stift, unten, hoch(unten, wand), balken, dicke);
    }
    linie(stift, hoch(a, wand), hoch(b, wand), balken, dicke);
    // Ein schraeger Balken macht das Fachwerk.
    linie(stift, zwischen(a, b, 0.08), hoch(zwischen(a, b, 0.4), wand), balken, dicke * 0.8);
  }
  // Fenster links.
  const fenster = hoch(zwischen(L1, B1, 0.55), wand * 0.62);
  flaeche(stift, [
    [fenster[0] - 0.16 * e, fenster[1] - 0.08 * e],
    [fenster[0] + 0.16 * e, fenster[1] + 0.08 * e],
    [fenster[0] + 0.16 * e, fenster[1] + 0.3 * e],
    [fenster[0] - 0.16 * e, fenster[1] + 0.14 * e],
  ], '#3a2e22');
  // Tuer rechts, in Spielerfarbe.
  const tuer = zwischen(B1, R1, 0.45);
  flaeche(stift, [
    [tuer[0] - 0.2 * e, tuer[1] + 0.1 * e],
    [tuer[0] + 0.2 * e, tuer[1] - 0.1 * e],
    [tuer[0] + 0.2 * e, tuer[1] - 0.1 * e - 0.58 * e],
    [tuer[0] - 0.2 * e, tuer[1] + 0.1 * e - 0.58 * e],
  ], farbe);

  // Schornstein hinten rechts, vor dem Dach gezeichnet waere er vorn - also zuerst.
  const dach = walmdach(stift, W, traufe, 1.25 * e, {
    hinten: '#8a6a30', links: '#b38a3f', rechts: '#d6ad5c', seite: '#a07b37',
  }, 1.18);
  // Strohbuendel als helle Striche.
  for (const t of [0.25, 0.5, 0.75]) {
    linie(stift, zwischen(dach.B2, dach.F1, t), zwischen(dach.R2, dach.F2, t), '#9c7a35', Math.max(0.8, e * 0.05));
  }
  const schlot = [0.55 * W, -traufe - 0.75 * e];
  flaeche(stift, [
    [schlot[0] - 0.14 * e, schlot[1]],
    [schlot[0] + 0.14 * e, schlot[1] - 0.07 * e],
    [schlot[0] + 0.14 * e, schlot[1] - 0.6 * e],
    [schlot[0] - 0.14 * e, schlot[1] - 0.53 * e],
  ], '#8c7f73');
}

// ---- Muehle -----------------------------------------------------------------

// Steinhaus mit Holzdach und vier grossen Fluegeln vorn - die Fluegel
// unterscheiden sie von allem anderen. Ein Wimpel in Spielerfarbe am First.
function muehle(stift, e, farbe) {
  const W = 1.8 * e;
  vorbereiten(stift, e, W, W / 2);
  const wand = 1.2 * e;
  const { B1, R1, traufe } = kasten(stift, W, 0.12 * e, wand, {
    sockelL: '#7f7a70', sockelR: '#9a948a', wandL: '#a8a092', wandR: '#c8c0b0',
  });
  // Steinfugen.
  for (const z of [0.35, 0.7]) linie(stift, hoch(B1, wand * z), hoch(R1, wand * z), '#8f887c', Math.max(0.8, e * 0.035));
  const tuer = zwischen(B1, R1, 0.62);
  flaeche(stift, [
    [tuer[0] - 0.17 * e, tuer[1] + 0.08 * e],
    [tuer[0] + 0.17 * e, tuer[1] - 0.08 * e],
    [tuer[0] + 0.17 * e, tuer[1] - 0.6 * e],
    [tuer[0] - 0.17 * e, tuer[1] - 0.45 * e],
  ], '#3b2a1a');
  const dach = walmdach(stift, W, traufe, 1.1 * e, {
    hinten: '#4d3a28', links: '#6b5139', rechts: '#8a6a4a', seite: '#5c4631',
  });
  fahne(stift, dach.F2, e, farbe, 0.8);

  // Fluegel: vor der linken Wand, um eine Nabe gedreht.
  const nabe = hoch(zwischen([-W, 0], [0, W / 2], 0.5), traufe * 0.85);
  const laenge = 1.7 * e;
  for (let i = 0; i < 4; i++) {
    const w = Math.PI / 4 + (i * Math.PI) / 2;
    const ende = [nabe[0] + Math.cos(w) * laenge, nabe[1] + Math.sin(w) * laenge * 0.9];
    const quer = [-Math.sin(w) * 0.28 * e, Math.cos(w) * 0.28 * e];
    linie(stift, nabe, ende, '#4a3522', Math.max(1, e * 0.08));
    flaeche(stift, [
      zwischen(nabe, ende, 0.25),
      ende,
      [ende[0] + quer[0], ende[1] + quer[1]],
      [zwischen(nabe, ende, 0.25)[0] + quer[0], zwischen(nabe, ende, 0.25)[1] + quer[1]],
    ], '#efe8d6');
  }
  kreis(stift, nabe[0], nabe[1], 0.12 * e, '#3a2c1f');
}

// ---- Lager ------------------------------------------------------------------

// Ein offener Unterstand: vier Pfosten, Pultdach, darunter die Ware. Gemeinsam
// fuer Holzfaeller- und Bergbaulager; was darunter liegt, unterscheidet sie.
function unterstand(stift, e, farbe, dachFarben, ware) {
  const W = 1.8 * e;
  vorbereiten(stift, e, W, W / 2);
  const H = W / 2;
  const L = [-W, 0];
  const B = [0, H];
  const R = [W, 0];
  const T = [0, -H];
  // Boden aus Brettern.
  flaeche(stift, [L, B, R, T], '#7a5a38');
  // Hoch genug, dass man unter das Dach sieht.
  const hinten = 1.9 * e;
  const vorn = 1.45 * e;
  // Hintere Pfosten zuerst.
  for (const p of [L, T, R]) linie(stift, p, hoch(p, p === T ? hinten : (hinten + vorn) / 2), '#4a3522', Math.max(1.2, e * 0.12));
  linie(stift, B, hoch(B, vorn), '#4a3522', Math.max(1.2, e * 0.12));
  // Pultdach, hinten hoeher.
  flaeche(stift, [
    hoch([-W * 1.1, 0], (hinten + vorn) / 2),
    hoch([0, -H * 1.1], hinten),
    hoch([W * 1.1, 0], (hinten + vorn) / 2),
    hoch([0, H * 1.1], vorn),
  ], dachFarben.oben);
  flaeche(stift, [
    hoch([-W * 1.1, 0], (hinten + vorn) / 2),
    hoch([0, H * 1.1], vorn),
    hoch([0, H * 1.1], vorn - 0.14 * e),
    hoch([-W * 1.1, 0], (hinten + vorn) / 2 - 0.14 * e),
  ], dachFarben.kante);
  flaeche(stift, [
    hoch([0, H * 1.1], vorn),
    hoch([W * 1.1, 0], (hinten + vorn) / 2),
    hoch([W * 1.1, 0], (hinten + vorn) / 2 - 0.14 * e),
    hoch([0, H * 1.1], vorn - 0.14 * e),
  ], dachFarben.kanteHell);
  // Die Ware steht vorn unter dem Dach und ist das, woran man das Lager erkennt.
  stift.save();
  stift.translate(0, 0.3 * e);
  ware(stift, e, W);
  stift.restore();
  // Wimpel in Spielerfarbe am vorderen Pfosten.
  fahne(stift, hoch(B, vorn), e, farbe, 0.7);
}

function holzfaellerlager(stift, e, farbe) {
  unterstand(stift, e, farbe, { oben: '#6b5139', kante: '#4d3a28', kanteHell: '#8a6a4a' }, (s, e2, W) => {
    // Gestapelte Staemme mit hellen Schnittflaechen, rechts ein Hackklotz mit Axt.
    for (let reihe = 0; reihe < 3; reihe++) {
      for (let i = 0; i < 3 - reihe; i++) {
        const x = -0.55 * W + i * 0.36 * e2 + reihe * 0.18 * e2;
        const y = 0.05 * e2 - reihe * 0.3 * e2;
        kreis(s, x, y, 0.17 * e2, '#d9b27a');
        kreis(s, x, y, 0.07 * e2, '#a57a44', false);
      }
    }
    flaeche(s, [[0.35 * W, 0.1 * e2], [0.62 * W, 0.1 * e2], [0.62 * W, -0.25 * e2], [0.35 * W, -0.25 * e2]], '#8a6238');
    linie(s, [0.48 * W, -0.25 * e2], [0.62 * W, -0.75 * e2], '#5b3d22', Math.max(1, e2 * 0.07));
    flaeche(s, [[0.58 * W, -0.72 * e2], [0.8 * W, -0.72 * e2], [0.72 * W, -0.52 * e2]], '#b7bcc2');
  });
}

function bergbaulager(stift, e, farbe) {
  unterstand(stift, e, farbe, { oben: '#6f747a', kante: '#4d5157', kanteHell: '#8b9096' }, (s, e2, W) => {
    // Links ein Haufen Stein, rechts eine Karre voll Gold.
    for (const [x, y, r] of [[-0.62, 0, 0.3], [-0.35, 0.02, 0.26], [-0.5, -0.28, 0.24]]) {
      flaeche(s, [
        [x * W - r * e2, y * e2], [x * W - r * 0.4 * e2, y * e2 - r * e2],
        [x * W + r * 0.8 * e2, y * e2 - r * 0.7 * e2], [x * W + r * e2, y * e2],
      ], '#a3a8ad');
    }
    const karre = [0.25 * W, -0.05 * e2];
    flaeche(s, [
      [karre[0] - 0.45 * e2, karre[1] - 0.35 * e2], [karre[0] + 0.45 * e2, karre[1] - 0.35 * e2],
      [karre[0] + 0.35 * e2, karre[1]], [karre[0] - 0.35 * e2, karre[1]],
    ], '#6b4a2b');
    for (const [dx, dy] of [[-0.25, -0.42], [0, -0.5], [0.22, -0.42], [-0.1, -0.62], [0.12, -0.6]]) {
      kreis(s, karre[0] + dx * e2, karre[1] + dy * e2, 0.12 * e2, '#e0b43a');
    }
    kreis(s, karre[0] - 0.25 * e2, karre[1] + 0.05 * e2, 0.14 * e2, '#3a2c1f');
    kreis(s, karre[0] + 0.25 * e2, karre[1] + 0.05 * e2, 0.14 * e2, '#3a2c1f');
  });
}

// ---- Baustelle ----------------------------------------------------------------

// Fundament, Geruest und Bretter, die mit dem Fortschritt hoeher werden
// (darstellung AC-5). W ist die halbe Breite des fertigen Gebaeudes.
function baustelle(stift, e, W, anteil) {
  const H = W / 2;
  vorbereiten(stift, e, W * 0.9, H * 0.9);
  const L = [-W, 0];
  const B = [0, H];
  const R = [W, 0];
  const T = [0, -H];
  // Fundament: Steine auf Erde.
  flaeche(stift, [L, B, R, T], '#7b6a55');
  flaeche(stift, [L, B, hoch(B, 0.15 * e), hoch(L, 0.15 * e)], '#8d8a83');
  flaeche(stift, [B, R, hoch(R, 0.15 * e), hoch(B, 0.15 * e)], '#a9a59c');
  // Waende, so weit gebaut.
  const wand = Math.max(0.05, anteil) * 1.1 * e;
  const L1 = hoch(L, 0.15 * e);
  const B1 = hoch(B, 0.15 * e);
  const R1 = hoch(R, 0.15 * e);
  flaeche(stift, [L1, B1, hoch(B1, wand), hoch(L1, wand)], '#b99562');
  flaeche(stift, [B1, R1, hoch(R1, wand), hoch(B1, wand)], '#d4ae78');
  // Geruest: Stangen an den Ecken, immer etwas hoeher als die Wand, dazu Laufbretter.
  const stange = wand + 0.5 * e;
  const holz = '#5b3d22';
  for (const p of [L, B, R]) linie(stift, hoch(p, 0.15 * e), hoch(p, 0.15 * e + stange), holz, Math.max(1, e * 0.07));
  for (const z of [0.5, 1]) {
    const h = 0.15 * e + stange * z;
    linie(stift, hoch(L, h), hoch(B, h), '#a07a4a', Math.max(1.2, e * 0.1));
    linie(stift, hoch(B, h), hoch(R, h), '#b58d58', Math.max(1.2, e * 0.1));
  }
  // Ein Stapel Bretter vorn - mit duenner Kontur, sonst wird er ein Klecks.
  stift.lineWidth = Math.max(0.8, e * 0.035);
  for (let i = 0; i < 3; i++) {
    const y = H * 0.55 - i * 0.12 * e;
    flaeche(stift, [[-0.5 * e, y], [0.4 * e, y + 0.2 * e], [0.5 * e, y + 0.12 * e], [-0.4 * e, y - 0.08 * e]], '#c8a06a');
  }
}

// ---- Verzeichnis ----------------------------------------------------------------

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
  haus: { name: 'Haus', zeichnen: haus, halbeBreite: 1.8, trefferBreite: 1.9, trefferOben: 3.2, trefferUnten: 1 },
  muehle: { name: 'Muehle', zeichnen: muehle, halbeBreite: 1.8, trefferBreite: 1.9, trefferOben: 3.4, trefferUnten: 1 },
  holzfaellerlager: {
    name: 'Holzfaellerlager', zeichnen: holzfaellerlager, halbeBreite: 1.8, trefferBreite: 1.9, trefferOben: 2.4, trefferUnten: 1,
  },
  bergbaulager: {
    name: 'Bergbaulager', zeichnen: bergbaulager, halbeBreite: 1.8, trefferBreite: 1.9, trefferOben: 2.4, trefferUnten: 1,
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
 * @param {number} [bau] Baufortschritt 0 bis 1; darunter eine Baustelle
 */
export function gebaeudeZeichnen(stift, art, x, y, e, farbe, groesse, bau = 1) {
  const gebaeude = GEBAEUDE[art];
  if (!gebaeude) return;
  const m = e * massstab(gebaeude, groesse);
  stift.save();
  stift.translate(x, y);
  if (bau < 1) baustelle(stift, m, gebaeude.halbeBreite * m, bau);
  else gebaeude.zeichnen(stift, m, farbe);
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
