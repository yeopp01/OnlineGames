// Gebaeude, in Code gezeichnet wie die Figuren (→ specs/10-strategie/darstellung.md
// AC-4, AC-5, AC-12). Kein Material aus dem Original. Der Fusspunkt ist die
// Mitte der Grundflaeche; e ist eine halbe Rautenbreite in Bildpunkten. Licht
// kommt von links oben: die linke Wand liegt im Schatten, die rechte im Licht.
// Die Spielerfarbe steht an einer festen Stelle - Fahne, Tuer oder Wimpel -, nie
// als ganze Flaeche.
//
// Gezeichnet statt flach (AC-12, Runde 28): jede Wand und jede Dachflaeche hat
// einen Verlauf und eine Oberflaeche - Mauerwerk mit versetzten Fugen, Putz,
// Bretter, Ziegelreihen, Stroh, Schindeln -, auf die Flaeche zugeschnitten.
//
// Naturalistisch statt Comic (AC-13, Runde 37): keine schwarzen Umrisse mehr,
// sondern eine duenne, halb durchsichtige dunkelbraune Kante, und gedaempfte,
// erdige Farben fuer Daecher und Holz.

const KONTUR = 'rgba(48, 34, 22, 0.5)';

// ---- Werkzeug -------------------------------------------------------------------

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
  const [r, g, b] = kanaele(farbe).map((w) => Math.round(w + (ziel - w) * a));
  return `rgb(${r}, ${g}, ${b})`;
}

function verlauf(stift, farbe, von, bis, hell = 0.14, dunkel = -0.2) {
  const v = stift.createLinearGradient(von[0], von[1], bis[0], bis[1]);
  v.addColorStop(0, ton(farbe, hell));
  v.addColorStop(0.55, farbe);
  v.addColorStop(1, ton(farbe, dunkel));
  return v;
}

function pfad(stift, punkte) {
  stift.beginPath();
  stift.moveTo(punkte[0][0], punkte[0][1]);
  for (let i = 1; i < punkte.length; i++) stift.lineTo(punkte[i][0], punkte[i][1]);
  stift.closePath();
}

function flaeche(stift, punkte, farbe, rand = true) {
  pfad(stift, punkte);
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

// Immer gleiche "Zufallszahlen" aus einem Index - jedes Gebaeude sieht bei
// jedem Bild gleich aus.
const zufall = (i) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// Zeichnet nur innerhalb der Flaeche.
function innerhalb(stift, punkte, zeichnen) {
  stift.save();
  pfad(stift, punkte);
  stift.clip();
  zeichnen();
  stift.restore();
}

// Eine senkrechte Wandflaeche: unten von a nach b, h hoch. Punkt in der Flaeche
// aus u (entlang der Wand, 0..1) und v (nach oben, 0..1).
const wandpunkt = (a, b, h, u, v) => hoch(zwischen(a, b, u), h * v);

// Mauerwerk: Reihen mit versetzten Stossfugen, einzelne Steine heller oder dunkler.
function mauerwerk(stift, a, b, h, e, { reihen = 3, steine = 6, grund }) {
  const breite = stift.lineWidth;
  innerhalb(stift, [a, b, hoch(b, h), hoch(a, h)], () => {
    for (let r = 0; r < reihen; r++) {
      const versatz = r % 2 ? 0.5 / steine : 0;
      for (let s = -1; s < steine + 1; s++) {
        const u0 = s / steine + versatz;
        const u1 = u0 + 1 / steine;
        const v0 = r / reihen;
        const v1 = (r + 1) / reihen;
        const stein = [wandpunkt(a, b, h, u0, v0), wandpunkt(a, b, h, u1, v0), wandpunkt(a, b, h, u1, v1), wandpunkt(a, b, h, u0, v1)];
        const schwankung = (zufall(r * 31 + s * 7) - 0.5) * 0.16;
        pfad(stift, stein);
        stift.fillStyle = ton(grund, schwankung);
        stift.fill();
        stift.strokeStyle = 'rgba(40,35,30,0.55)';
        stift.lineWidth = Math.max(0.5, e * 0.03);
        stift.stroke();
      }
    }
  });
  stift.strokeStyle = KONTUR;
  stift.lineWidth = breite;
}

// Bretter: senkrecht (Wand) mit Fugen und Maserung.
function bretter(stift, a, b, h, e, anzahl, grund) {
  const breite = stift.lineWidth;
  innerhalb(stift, [a, b, hoch(b, h), hoch(a, h)], () => {
    for (let i = 0; i < anzahl; i++) {
      const u0 = i / anzahl;
      const u1 = (i + 1) / anzahl;
      pfad(stift, [wandpunkt(a, b, h, u0, 0), wandpunkt(a, b, h, u1, 0), wandpunkt(a, b, h, u1, 1), wandpunkt(a, b, h, u0, 1)]);
      stift.fillStyle = ton(grund, (zufall(i * 17) - 0.5) * 0.14);
      stift.fill();
      linie(stift, wandpunkt(a, b, h, u0, 0), wandpunkt(a, b, h, u0, 1), 'rgba(40,25,10,0.55)', Math.max(0.5, e * 0.03));
      const um = (u0 + u1) / 2 + (zufall(i * 5) - 0.5) * 0.03;
      linie(stift, wandpunkt(a, b, h, um, 0.15), wandpunkt(a, b, h, um + 0.01, 0.8), 'rgba(40,25,10,0.22)', Math.max(0.4, e * 0.02));
    }
  });
  stift.lineWidth = breite;
}

// Putz: helle und dunkle Tupfen, kaum sichtbar - die Wand wirkt nicht glatt.
function putz(stift, a, b, h, e) {
  innerhalb(stift, [a, b, hoch(b, h), hoch(a, h)], () => {
    for (let i = 0; i < 40; i++) {
      const p = wandpunkt(a, b, h, zufall(i * 3.1), zufall(i * 7.7));
      stift.fillStyle = zufall(i) > 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)';
      stift.beginPath();
      stift.arc(p[0], p[1], e * (0.03 + zufall(i * 2) * 0.05), 0, Math.PI * 2);
      stift.fill();
    }
    // Unten dunkler: Spritzwasser und Schatten am Boden.
    const unten = stift.createLinearGradient(0, a[1], 0, a[1] - h * 0.35);
    unten.addColorStop(0, 'rgba(40,30,20,0.28)');
    unten.addColorStop(1, 'rgba(40,30,20,0)');
    stift.fillStyle = unten;
    pfad(stift, [a, b, hoch(b, h), hoch(a, h)]);
    stift.fill();
  });
}

// Dachdeckung auf einer Dachflaeche: Traufe von p nach q, oben r nach s (bei
// einer Dreiecksflaeche r = s). Ziegel sind Reihen mit hellen Baeuchen, Stroh
// sind viele kurze Halme, Schindeln Reihen mit versetzten Kanten.
function deckung(stift, flaechenpunkte, p, q, r, s, e, art) {
  const breite = stift.lineWidth;
  innerhalb(stift, flaechenpunkte, () => {
    const reihen = art === 'stroh' ? 7 : 6;
    for (let k = 0; k <= reihen; k++) {
      const t = k / reihen;
      const A = zwischen(p, r, t);
      const B = zwischen(q, s, t);
      if (art === 'stroh') {
        const halme = 16;
        for (let i = 0; i < halme; i++) {
          const u = (i + zufall(k * 13 + i)) / halme;
          const fuss = zwischen(A, B, u);
          const kopf = zwischen(zwischen(p, r, Math.min(1, t + 0.2)), zwischen(q, s, Math.min(1, t + 0.2)), u);
          linie(stift, fuss, zwischen(fuss, kopf, 0.8), zufall(i + k) > 0.5 ? 'rgba(120,85,30,0.55)' : 'rgba(255,235,170,0.35)', Math.max(0.4, e * 0.025));
        }
      } else {
        linie(stift, A, B, 'rgba(40,15,10,0.5)', Math.max(0.5, e * 0.03));
        const stuecke = 8;
        const tu = Math.max(0, t - 1 / reihen);
        const Au = zwischen(p, r, tu);
        const Bu = zwischen(q, s, tu);
        for (let i = 0; i < stuecke; i++) {
          const u = (i + (k % 2 ? 0.5 : 0)) / stuecke;
          const oben = zwischen(A, B, u);
          const unten = zwischen(Au, Bu, u);
          linie(stift, oben, zwischen(oben, unten, 0.85), 'rgba(40,15,10,0.32)', Math.max(0.4, e * 0.02));
          if (art === 'ziegel') {
            const mitte = zwischen(zwischen(A, B, u + 0.5 / stuecke), zwischen(Au, Bu, u + 0.5 / stuecke), 0.45);
            stift.fillStyle = `rgba(255,190,150,${0.08 + zufall(i * 3 + k) * 0.14})`;
            stift.beginPath();
            stift.arc(mitte[0], mitte[1], e * 0.09, 0, Math.PI * 2);
            stift.fill();
          }
        }
      }
    }
    // Licht zum First hin, Schatten zur Traufe.
    const m0 = zwischen(p, q, 0.5);
    const m1 = zwischen(r, s, 0.5);
    const lichtverlauf = stift.createLinearGradient(m0[0], m0[1], m1[0], m1[1]);
    lichtverlauf.addColorStop(0, 'rgba(0,0,0,0.18)');
    lichtverlauf.addColorStop(1, 'rgba(255,255,255,0.1)');
    stift.fillStyle = lichtverlauf;
    pfad(stift, flaechenpunkte);
    stift.fill();
  });
  stift.strokeStyle = KONTUR;
  stift.lineWidth = breite;
}

// Ein Fenster in einer Wand: dunkle Oeffnung, heller Rahmen, Sprossen, ein Glanz.
function fenster(stift, a, b, h, u, v, e, breite = 0.12, hoehe = 0.28) {
  const alt = stift.lineWidth;
  const ecken = [
    wandpunkt(a, b, h, u - breite / 2, v - hoehe / 2), wandpunkt(a, b, h, u + breite / 2, v - hoehe / 2),
    wandpunkt(a, b, h, u + breite / 2, v + hoehe / 2), wandpunkt(a, b, h, u - breite / 2, v + hoehe / 2),
  ];
  flaeche(stift, ecken, '#463a2c', false);
  stift.strokeStyle = '#d9c7a4';
  stift.lineWidth = Math.max(0.6, e * 0.05);
  pfad(stift, ecken);
  stift.stroke();
  linie(stift, wandpunkt(a, b, h, u, v - hoehe / 2), wandpunkt(a, b, h, u, v + hoehe / 2), '#d9c7a4', Math.max(0.5, e * 0.035));
  linie(stift, wandpunkt(a, b, h, u - breite / 2, v), wandpunkt(a, b, h, u + breite / 2, v), '#d9c7a4', Math.max(0.5, e * 0.035));
  linie(stift, wandpunkt(a, b, h, u - breite * 0.35, v + hoehe * 0.35), wandpunkt(a, b, h, u - breite * 0.08, v + hoehe * 0.08), 'rgba(200,220,255,0.5)', Math.max(0.5, e * 0.04));
  stift.strokeStyle = KONTUR;
  stift.lineWidth = alt;
}

// Eine Tuer aus Brettern mit Beschlaegen und Griff.
function tuerZeichnen(stift, a, b, h, u, e, farbe, breite = 0.2, hoehe = 0.62) {
  const alt = stift.lineWidth;
  const ecken = [
    wandpunkt(a, b, h, u - breite / 2, 0), wandpunkt(a, b, h, u + breite / 2, 0),
    wandpunkt(a, b, h, u + breite / 2, hoehe), wandpunkt(a, b, h, u - breite / 2, hoehe),
  ];
  flaeche(stift, ecken, verlauf(stift, farbe, ecken[3], ecken[1], 0.12, -0.3));
  for (const t of [0.33, 0.66]) {
    linie(stift, wandpunkt(a, b, h, u - breite / 2 + breite * t, 0.03), wandpunkt(a, b, h, u - breite / 2 + breite * t, hoehe - 0.03), 'rgba(0,0,0,0.35)', Math.max(0.4, e * 0.025));
  }
  for (const v of [0.18, 0.46]) {
    linie(stift, wandpunkt(a, b, h, u - breite / 2 + 0.01, v), wandpunkt(a, b, h, u + breite * 0.15, v), '#5a5048', Math.max(0.6, e * 0.05));
  }
  const griff = wandpunkt(a, b, h, u + breite * 0.3, hoehe * 0.45);
  kreis(stift, griff[0], griff[1], Math.max(0.6, e * 0.035), '#c9a24a', false);
  stift.lineWidth = alt;
}

function vorbereiten(stift, e, W, H) {
  // Schlagschatten (darstellung AC-13): Licht von links oben, der Schatten
  // faellt nach rechts unten auf den Boden - die Grundflaeche, weich zu einer
  // um die Gebaeudehoehe verschobenen Grundflaeche gezogen.
  const lang = [W * 0.95, W * 0.2];
  const L = [-W, 0];
  const B = [0, H];
  const R = [W, 0];
  const T = [0, -H];
  const plus = (p) => [p[0] + lang[0], p[1] + lang[1]];
  stift.save();
  stift.filter = `blur(${Math.max(1, e * 0.12)}px)`;
  stift.fillStyle = 'rgba(20, 16, 8, 0.38)';
  stift.beginPath();
  for (const [i, p] of [L, T, plus(T), plus(R), plus(B), B].entries()) {
    if (i === 0) stift.moveTo(p[0], p[1]);
    else stift.lineTo(p[0], p[1]);
  }
  stift.closePath();
  stift.fill();
  stift.restore();
  const schatten = stift.createRadialGradient(0.25 * e, 0.12 * e, 0, 0.25 * e, 0.12 * e, W * 1.2);
  schatten.addColorStop(0, 'rgba(0,0,0,0.36)');
  schatten.addColorStop(0.7, 'rgba(0,0,0,0.22)');
  schatten.addColorStop(1, 'rgba(0,0,0,0)');
  stift.fillStyle = schatten;
  stift.save();
  stift.translate(0.25 * e, 0.12 * e);
  stift.scale(1, (H * 1.3) / (W * 1.2));
  stift.beginPath();
  stift.arc(0, 0, W * 1.2, 0, Math.PI * 2);
  stift.restore();
  stift.fill();
  stift.strokeStyle = KONTUR;
  stift.lineWidth = Math.max(0.7, e * 0.035);
  stift.lineJoin = 'round';
}

// Sockel und zwei sichtbare Waende einer Raute mit halber Breite W. Gibt die
// Ecken unten und die Hoehe der Traufe zurueck. `wandMuster`: putz, stein, keins.
function kasten(stift, W, sockel, wand, e, { sockelL, sockelR, wandL, wandR, wandMuster = 'putz' }) {
  const L = [-W, 0];
  const B = [0, W / 2];
  const R = [W, 0];
  flaeche(stift, [L, B, hoch(B, sockel), hoch(L, sockel)], sockelL);
  flaeche(stift, [B, R, hoch(R, sockel), hoch(B, sockel)], sockelR);
  mauerwerk(stift, L, B, sockel, e, { reihen: 2, steine: 7, grund: sockelL });
  mauerwerk(stift, B, R, sockel, e, { reihen: 2, steine: 7, grund: sockelR });
  const L1 = hoch(L, sockel);
  const B1 = hoch(B, sockel);
  const R1 = hoch(R, sockel);
  const links = [L1, B1, hoch(B1, wand), hoch(L1, wand)];
  const rechts = [B1, R1, hoch(R1, wand), hoch(B1, wand)];
  flaeche(stift, links, verlauf(stift, wandL, hoch(L1, wand), B1, 0.1, -0.22), false);
  flaeche(stift, rechts, verlauf(stift, wandR, hoch(B1, wand), R1, 0.14, -0.12), false);
  if (wandMuster === 'stein') {
    mauerwerk(stift, L1, B1, wand, e, { reihen: 6, steine: 6, grund: wandL });
    mauerwerk(stift, B1, R1, wand, e, { reihen: 6, steine: 6, grund: wandR });
  } else if (wandMuster === 'putz') {
    putz(stift, L1, B1, wand, e);
    putz(stift, B1, R1, wand, e);
  }
  // Umriss der Sockel und Waende, ueber den Oberflaechen.
  for (const f of [[L, B, hoch(B, sockel), hoch(L, sockel)], [B, R, hoch(R, sockel), hoch(B, sockel)], links, rechts]) {
    pfad(stift, f);
    stift.stroke();
  }
  return { L, B, R, L1, B1, R1, traufe: sockel + wand };
}

// Walmdach ueber einer Raute: vier Flaechen, oben ein kurzer First, gedeckt.
function walmdach(stift, W, traufe, first, e, { hinten, links, rechts, seite }, art = 'ziegel', ueber = 1.12) {
  const H = W / 2;
  const L2 = hoch([-W * ueber, 0], traufe);
  const B2 = hoch([0, H * ueber], traufe);
  const R2 = hoch([W * ueber, 0], traufe);
  const T2 = hoch([0, -H * ueber], traufe);
  const F1 = [-0.24 * W, -traufe - first + 0.04 * W];
  const F2 = [0.24 * W, -traufe - first - 0.04 * W];
  flaeche(stift, [L2, T2, F2, F1], hinten);
  const linksFlaeche = [L2, B2, F1];
  const rechtsFlaeche = [B2, R2, F2, F1];
  const seiteFlaeche = [R2, T2, F2];
  flaeche(stift, linksFlaeche, verlauf(stift, links, F1, B2, 0.1, -0.2), false);
  deckung(stift, linksFlaeche, L2, B2, F1, F1, e, art);
  flaeche(stift, rechtsFlaeche, verlauf(stift, rechts, F1, R2, 0.16, -0.14), false);
  deckung(stift, rechtsFlaeche, B2, R2, F1, F2, e, art);
  flaeche(stift, seiteFlaeche, verlauf(stift, seite, F2, R2, 0.08, -0.2), false);
  for (const f of [linksFlaeche, rechtsFlaeche, seiteFlaeche]) {
    pfad(stift, f);
    stift.stroke();
  }
  // Firstkappe und ein Lichtsaum an der Traufe.
  const alt = stift.lineWidth;
  linie(stift, F1, F2, ton(rechts, -0.35), Math.max(1.2, e * 0.12));
  linie(stift, zwischen(B2, R2, 0.02), zwischen(B2, R2, 0.98), 'rgba(255,255,255,0.18)', Math.max(0.6, e * 0.04));
  stift.lineWidth = alt;
  return { L2, B2, R2, T2, F1, F2 };
}

function fahne(stift, fuss, e, farbe, hoehe = 1.1) {
  const spitze = [fuss[0], fuss[1] - hoehe * e];
  linie(stift, fuss, spitze, '#3a2c1f', Math.max(1, e * 0.07));
  kreis(stift, spitze[0], spitze[1] - e * 0.04, Math.max(0.6, e * 0.06), '#c9a24a', false);
  stift.lineWidth = Math.max(0.8, e * 0.04);
  // Die Fahne leicht gewellt, mit hellerer und dunklerer Bahn.
  stift.beginPath();
  stift.moveTo(spitze[0], spitze[1]);
  stift.quadraticCurveTo(spitze[0] + 0.4 * e, spitze[1] - 0.05 * e, spitze[0] + 0.78 * e, spitze[1] + 0.2 * e);
  stift.quadraticCurveTo(spitze[0] + 0.4 * e, spitze[1] + 0.3 * e, spitze[0], spitze[1] + 0.44 * e);
  stift.closePath();
  stift.fillStyle = verlauf(stift, farbe, spitze, [spitze[0] + 0.78 * e, spitze[1] + 0.44 * e], 0.2, -0.25);
  stift.fill();
  stift.stroke();
}

// ---- Dorfzentrum ------------------------------------------------------------

// Steinsockel, Fachwerk mit Putzfeldern, Ziegel-Walmdach, Tuer zur Bildseite und
// eine Fahne in Spielerfarbe - daran erkennt man, wem es gehoert.
function dorfzentrum(stift, e, farbe) {
  const W = 2.3 * e;
  vorbereiten(stift, e, W, W / 2);
  const wand = 1.25 * e;
  const { L1, B1, R1, traufe } = kasten(stift, W, 0.28 * e, wand, e, {
    sockelL: '#86817a', sockelR: '#a09a90', wandL: '#b9a483', wandR: '#d2bf98',
  });

  // Fachwerk: Balken mit Lichtkante, Riegel und Streben.
  const balken = '#5a4230';
  const dicke = Math.max(1, e * 0.1);
  for (const [a, b] of [[L1, B1], [B1, R1]]) {
    for (const t of [0.02, 0.35, 0.65, 0.98]) {
      const unten = zwischen(a, b, t);
      linie(stift, unten, hoch(unten, wand), balken, dicke);
      linie(stift, [unten[0] - dicke * 0.3, unten[1]], [unten[0] - dicke * 0.3, unten[1] - wand], 'rgba(255,220,170,0.25)', dicke * 0.25);
    }
    linie(stift, hoch(a, wand * 0.5), hoch(b, wand * 0.5), balken, dicke * 0.8);
    linie(stift, hoch(a, wand), hoch(b, wand), balken, dicke);
    linie(stift, hoch(zwischen(a, b, 0.35), wand * 0.5), hoch(zwischen(a, b, 0.65), wand), balken, dicke * 0.7);
    linie(stift, hoch(zwischen(a, b, 0.65), wand * 0.5), hoch(zwischen(a, b, 0.98), wand), balken, dicke * 0.7);
  }
  stift.lineWidth = Math.max(0.7, e * 0.035);

  // Fenster links, Tuer rechts.
  for (const u of [0.18, 0.5, 0.82]) fenster(stift, L1, B1, wand, u, 0.25, e, 0.1, 0.22);
  tuerZeichnen(stift, B1, R1, wand, 0.5, e, '#5b3a22', 0.2, 0.6);

  const dach = walmdach(stift, W, traufe, 1.35 * e, e, {
    hinten: '#66392c', links: '#7d4634', rechts: '#955640', seite: '#70402f',
  }, 'ziegel');
  fahne(stift, dach.F2, e, farbe);
}

// ---- Haus -------------------------------------------------------------------

// Klein und hell: weisser Putz mit Balken, steiles Strohdach, Schornstein.
// Die Tuer traegt die Spielerfarbe.
function haus(stift, e, farbe) {
  const W = 1.8 * e;
  vorbereiten(stift, e, W, W / 2);
  const wand = 0.85 * e;
  const { L1, B1, R1, traufe } = kasten(stift, W, 0.14 * e, wand, e, {
    sockelL: '#86817a', sockelR: '#a09a90', wandL: '#c8bca2', wandR: '#ddd2ba',
  });
  const balken = '#5e4632';
  const dicke = Math.max(1, e * 0.09);
  for (const [a, b] of [[L1, B1], [B1, R1]]) {
    for (const t of [0.03, 0.97]) {
      const unten = zwischen(a, b, t);
      linie(stift, unten, hoch(unten, wand), balken, dicke);
    }
    linie(stift, hoch(a, wand), hoch(b, wand), balken, dicke);
    // Ein schraeger Balken macht das Fachwerk.
    linie(stift, zwischen(a, b, 0.08), hoch(zwischen(a, b, 0.4), wand), balken, dicke * 0.8);
  }
  stift.lineWidth = Math.max(0.7, e * 0.035);
  fenster(stift, L1, B1, wand, 0.6, 0.5, e, 0.18, 0.38);
  // Tuer rechts, in Spielerfarbe.
  tuerZeichnen(stift, B1, R1, wand, 0.45, e, farbe, 0.24, 0.68);

  walmdach(stift, W, traufe, 1.25 * e, e, {
    hinten: '#7a6840', links: '#9c8656', rechts: '#b8a270', seite: '#8a7649',
  }, 'stroh', 1.18);
  // Schornstein aus Ziegeln mit Abdeckung.
  const schlot = [0.55 * W, -traufe - 0.75 * e];
  const schlotFlaeche = [
    [schlot[0] - 0.14 * e, schlot[1]],
    [schlot[0] + 0.14 * e, schlot[1] - 0.07 * e],
    [schlot[0] + 0.14 * e, schlot[1] - 0.6 * e],
    [schlot[0] - 0.14 * e, schlot[1] - 0.53 * e],
  ];
  flaeche(stift, schlotFlaeche, verlauf(stift, '#8a6a5a', schlotFlaeche[3], schlotFlaeche[1]));
  mauerwerk(stift, schlotFlaeche[0], schlotFlaeche[1], 0.53 * e, e, { reihen: 4, steine: 2, grund: '#8a6a5a' });
  flaeche(stift, [
    [schlot[0] - 0.18 * e, schlot[1] - 0.53 * e], [schlot[0] + 0.18 * e, schlot[1] - 0.62 * e],
    [schlot[0] + 0.18 * e, schlot[1] - 0.7 * e], [schlot[0] - 0.18 * e, schlot[1] - 0.61 * e],
  ], '#6f5a50');
}

// ---- Muehle -----------------------------------------------------------------

// Steinhaus mit Schindeldach und vier grossen Fluegeln vorn - die Fluegel
// unterscheiden sie von allem anderen. Ein Wimpel in Spielerfarbe am First.
function muehle(stift, e, farbe) {
  const W = 1.8 * e;
  vorbereiten(stift, e, W, W / 2);
  const wand = 1.2 * e;
  const { B1, R1, traufe } = kasten(stift, W, 0.12 * e, wand, e, {
    sockelL: '#7f7a70', sockelR: '#9a948a', wandL: '#a8a092', wandR: '#c8c0b0', wandMuster: 'stein',
  });
  tuerZeichnen(stift, B1, R1, wand, 0.62, e, '#4a3320', 0.18, 0.5);
  const dach = walmdach(stift, W, traufe, 1.1 * e, e, {
    hinten: '#4d3a28', links: '#6b5139', rechts: '#8a6a4a', seite: '#5c4631',
  }, 'schindel');
  fahne(stift, dach.F2, e, farbe, 0.8);

  // Fluegel: vor der linken Wand, um eine Nabe gedreht, mit Tuch und Latten.
  const nabe = hoch(zwischen([-W, 0], [0, W / 2], 0.5), traufe * 0.85);
  const laenge = 1.7 * e;
  for (let i = 0; i < 4; i++) {
    const w = Math.PI / 4 + (i * Math.PI) / 2;
    const ende = [nabe[0] + Math.cos(w) * laenge, nabe[1] + Math.sin(w) * laenge * 0.9];
    const quer = [-Math.sin(w) * 0.3 * e, Math.cos(w) * 0.3 * e];
    const anfang = zwischen(nabe, ende, 0.25);
    const tuch = [anfang, ende, [ende[0] + quer[0], ende[1] + quer[1]], [anfang[0] + quer[0], anfang[1] + quer[1]]];
    stift.lineWidth = Math.max(0.7, e * 0.035);
    flaeche(stift, tuch, verlauf(stift, '#ddd4c0', anfang, tuch[2], 0.1, -0.15));
    for (const t of [0.25, 0.5, 0.75]) {
      const a = zwischen(anfang, ende, t);
      linie(stift, a, [a[0] + quer[0], a[1] + quer[1]], '#6b4f35', Math.max(0.5, e * 0.03));
    }
    linie(stift, tuch[3], tuch[2], '#6b4f35', Math.max(0.5, e * 0.03));
    linie(stift, nabe, ende, '#5e4632', Math.max(1, e * 0.08));
  }
  stift.lineWidth = Math.max(0.7, e * 0.035);
  kreis(stift, nabe[0], nabe[1], 0.14 * e, '#5a4634');
  kreis(stift, nabe[0] - 0.04 * e, nabe[1] - 0.04 * e, 0.05 * e, 'rgba(255,255,255,0.35)', false);
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
  // Boden aus Brettern, quer gelegt.
  flaeche(stift, [L, B, R, T], verlauf(stift, '#6e5a44', T, B, 0.1, -0.15));
  innerhalb(stift, [L, B, R, T], () => {
    for (let i = 0; i < 9; i++) {
      // Jedes Brett etwas anders getoent - verwittertes Holz ist nie einfarbig.
      const brett = [zwischen(L, T, i / 9), zwischen(L, T, (i + 1) / 9), zwischen(B, R, (i + 1) / 9), zwischen(B, R, i / 9)];
      pfad(stift, brett);
      stift.fillStyle = `rgba(${zufall(i * 11) > 0.5 ? '230,210,180' : '30,20,10'},${0.06 + zufall(i * 4) * 0.12})`;
      stift.fill();
      if (i > 0) linie(stift, zwischen(L, T, i / 9), zwischen(B, R, i / 9), 'rgba(40,25,10,0.45)', Math.max(0.5, e * 0.03));
    }
  });
  stift.lineWidth = Math.max(0.7, e * 0.035);
  // Hoch genug, dass man unter das Dach sieht.
  const hinten = 1.9 * e;
  const vorn = 1.45 * e;
  const mitte = (hinten + vorn) / 2;
  const pfosten = (p, h) => {
    linie(stift, p, hoch(p, h), '#5e4632', Math.max(1.4, e * 0.14));
    linie(stift, [p[0] - e * 0.03, p[1]], [p[0] - e * 0.03, p[1] - h], 'rgba(255,220,170,0.3)', Math.max(0.4, e * 0.04));
  };
  if (dachFarben.form === 'sattel') {
    satteldach(stift, e, W, H, pfosten, dachFarben);
  } else {
    pultdach(stift, e, W, H, { hinten, vorn, mitte, pfosten, dachFarben, L, T, R, B });
  }
  // Die Ware steht vorn unter dem Dach und ist das, woran man das Lager erkennt.
  stift.save();
  stift.translate(0, 0.3 * e);
  ware(stift, e, W);
  stift.restore();
  // Wimpel in Spielerfarbe am vorderen Pfosten.
  fahne(stift, hoch(B, dachFarben.form === 'sattel' ? SATTEL_FIRST * e : vorn), e, farbe, 0.7);
}

// Pultdach mit Schindeln, hinten hoeher - das Holzfaellerlager.
function pultdach(stift, e, W, H, { hinten, vorn, mitte, pfosten, dachFarben, L, T, R, B }) {
  pfosten(L, mitte);
  pfosten(T, hinten);
  pfosten(R, mitte);
  pfosten(B, vorn);
  stift.lineWidth = Math.max(0.7, e * 0.035);
  const dach = [hoch([-W * 1.1, 0], mitte), hoch([0, -H * 1.1], hinten), hoch([W * 1.1, 0], mitte), hoch([0, H * 1.1], vorn)];
  flaeche(stift, dach, verlauf(stift, dachFarben.oben, dach[1], dach[3], dachFarben.hell ?? 0.14, dachFarben.dunkel ?? -0.2), false);
  deckung(stift, dach, dach[3], dach[2], dach[0], dach[1], e, 'schindel');
  pfad(stift, dach);
  stift.stroke();
  flaeche(stift, [dach[0], dach[3], hoch(dach[3], 0.14 * e), hoch(dach[0], 0.14 * e)], dachFarben.kante);
  flaeche(stift, [dach[3], dach[2], hoch(dach[2], 0.14 * e), hoch(dach[3], 0.14 * e)], dachFarben.kanteHell);
}

// Satteldach aus Schiefer, der First laeuft von hinten nach vorn - das
// Bergbaulager (darstellung AC-14, Runde 41: mit demselben Pultdach wie das
// Holzfaellerlager unterschieden sich die beiden nur auf 29 % der Flaeche).
const SATTEL_TRAUFE = 1.2;
const SATTEL_FIRST = 2.25;

function satteldach(stift, e, W, H, pfosten, dachFarben) {
  const traufe = SATTEL_TRAUFE * e;
  const first = SATTEL_FIRST * e;
  pfosten([-W, 0], traufe);
  pfosten([0, -H], first);
  pfosten([W, 0], traufe);
  pfosten([0, H], first);
  stift.lineWidth = Math.max(0.7, e * 0.035);
  const links = hoch([-W * 1.18, 0], traufe - 0.12 * e);
  const rechts = hoch([W * 1.18, 0], traufe - 0.12 * e);
  const firstHinten = hoch([0, -H * 1.12], first);
  const firstVorn = hoch([0, H * 1.12], first);
  const linkeFlaeche = [links, firstHinten, firstVorn];
  const rechteFlaeche = [rechts, firstHinten, firstVorn];
  flaeche(stift, linkeFlaeche, verlauf(stift, ton(dachFarben.oben, -0.18), firstHinten, links, 0.1, -0.25), false);
  deckung(stift, linkeFlaeche, links, links, firstHinten, firstVorn, e, 'schindel');
  flaeche(stift, rechteFlaeche, verlauf(stift, dachFarben.oben, firstVorn, rechts, 0.2, -0.2), false);
  deckung(stift, rechteFlaeche, rechts, rechts, firstHinten, firstVorn, e, 'schindel');
  for (const f of [linkeFlaeche, rechteFlaeche]) {
    pfad(stift, f);
    stift.stroke();
  }
  // Firstbalken und die Kante zur Bildseite.
  linie(stift, firstHinten, firstVorn, dachFarben.kante, Math.max(1.2, e * 0.12));
  linie(stift, links, firstVorn, dachFarben.kante, Math.max(0.8, e * 0.06));
  linie(stift, firstVorn, rechts, dachFarben.kanteHell, Math.max(0.8, e * 0.06));
  stift.lineWidth = Math.max(0.7, e * 0.035);
}

const STIRNHOLZ = ['#c2a680', '#b09070', '#cdb38e'];

function stamm(stift, x, y, r, n = 0) {
  kreis(stift, x, y, r, verlauf(stift, STIRNHOLZ[n % STIRNHOLZ.length], [x - r, y - r], [x + r, y + r], 0.15, -0.2));
  const alt = stift.lineWidth;
  stift.strokeStyle = 'rgba(140,95,50,0.6)';
  stift.lineWidth = Math.max(0.4, r * 0.12);
  for (const f of [0.35, 0.65]) {
    stift.beginPath();
    stift.arc(x, y, r * f, 0, Math.PI * 2);
    stift.stroke();
  }
  // Rinde als dunkler Ring statt eines schwarzen Umrisses.
  stift.strokeStyle = '#6a5440';
  stift.lineWidth = Math.max(0.8, r * 0.22);
  stift.beginPath();
  stift.arc(x, y, r * 0.9, 0, Math.PI * 2);
  stift.stroke();
  stift.strokeStyle = KONTUR;
  stift.lineWidth = alt;
  kreis(stift, x, y, r * 0.12, '#8a5a2b', false);
}

function holzfaellerlager(stift, e, farbe) {
  // Warmes braunes Holzdach - das Bergbaulager hat Schiefer (Runde 28: sonst
  // unterschieden sich die beiden Lager nur noch an der Ware).
  unterstand(stift, e, farbe, { oben: '#8a6440', kante: '#5a4029', kanteHell: '#a07a52', hell: 0.22, dunkel: -0.3 }, (s, e2, W) => {
    // Gestapelte Staemme mit Jahresringen, rechts ein Hackklotz mit Axt.
    for (let reihe = 0; reihe < 3; reihe++) {
      for (let i = 0; i < 3 - reihe; i++) {
        stamm(s, -0.55 * W + i * 0.36 * e2 + reihe * 0.18 * e2, 0.05 * e2 - reihe * 0.3 * e2, 0.17 * e2, reihe * 2 + i);
      }
    }
    const klotz = [[0.35 * W, 0.1 * e2], [0.62 * W, 0.1 * e2], [0.62 * W, -0.25 * e2], [0.35 * W, -0.25 * e2]];
    flaeche(s, klotz, verlauf(s, '#7a6048', klotz[3], klotz[1]));
    s.beginPath();
    s.ellipse(0.485 * W, -0.25 * e2, 0.135 * W, 0.06 * e2, 0, 0, Math.PI * 2);
    s.fillStyle = '#b49c78';
    s.fill();
    s.stroke();
    linie(s, [0.48 * W, -0.25 * e2], [0.62 * W, -0.75 * e2], '#5b3d22', Math.max(1, e2 * 0.07));
    s.lineWidth = Math.max(0.7, e2 * 0.035);
    flaeche(s, [[0.58 * W, -0.72 * e2], [0.8 * W, -0.72 * e2], [0.72 * W, -0.52 * e2]], verlauf(s, '#b7bcc2', [0.58 * W, -0.72 * e2], [0.8 * W, -0.52 * e2], 0.3, -0.25));
    linie(s, [0.79 * W, -0.71 * e2], [0.72 * W, -0.53 * e2], 'rgba(255,255,255,0.7)', Math.max(0.4, e2 * 0.03));
  });
}

function bergbaulager(stift, e, farbe) {
  unterstand(stift, e, farbe, { oben: '#56657a', kante: '#3a4452', kanteHell: '#74849a', form: 'sattel' }, (s, e2, W) => {
    // Links ein Haufen Stein, rechts eine Karre voll Gold.
    s.lineWidth = Math.max(0.7, e2 * 0.035);
    for (const [x, y, r] of [[-0.62, 0, 0.3], [-0.35, 0.02, 0.26], [-0.5, -0.28, 0.24]]) {
      const brocken = [
        [x * W - r * e2, y * e2], [x * W - r * 0.4 * e2, y * e2 - r * e2],
        [x * W + r * 0.8 * e2, y * e2 - r * 0.7 * e2], [x * W + r * e2, y * e2],
      ];
      flaeche(s, brocken, verlauf(s, '#a3a8ad', brocken[1], brocken[3], 0.25, -0.3));
      linie(s, brocken[1], [x * W + r * 0.1 * e2, y * e2 - r * 0.2 * e2], 'rgba(255,255,255,0.35)', Math.max(0.4, e2 * 0.03));
      s.lineWidth = Math.max(0.7, e2 * 0.035);
    }
    const karre = [0.25 * W, -0.05 * e2];
    const wanne = [
      [karre[0] - 0.45 * e2, karre[1] - 0.35 * e2], [karre[0] + 0.45 * e2, karre[1] - 0.35 * e2],
      [karre[0] + 0.35 * e2, karre[1]], [karre[0] - 0.35 * e2, karre[1]],
    ];
    flaeche(s, wanne, verlauf(s, '#6b4a2b', wanne[0], wanne[2]));
    linie(s, zwischen(wanne[0], wanne[3], 0.5), zwischen(wanne[1], wanne[2], 0.5), 'rgba(0,0,0,0.3)', Math.max(0.4, e2 * 0.025));
    s.lineWidth = Math.max(0.7, e2 * 0.035);
    for (const [dx, dy] of [[-0.25, -0.42], [0, -0.5], [0.22, -0.42], [-0.1, -0.62], [0.12, -0.6]]) {
      const x = karre[0] + dx * e2;
      const y = karre[1] + dy * e2;
      kreis(s, x, y, 0.12 * e2, verlauf(s, '#cfab4a', [x - 0.12 * e2, y - 0.12 * e2], [x + 0.12 * e2, y + 0.12 * e2], 0.35, -0.3));
      kreis(s, x - 0.04 * e2, y - 0.05 * e2, 0.03 * e2, 'rgba(255,255,255,0.8)', false);
    }
    for (const dx of [-0.25, 0.25]) {
      kreis(s, karre[0] + dx * e2, karre[1] + 0.05 * e2, 0.14 * e2, '#5a4634');
      kreis(s, karre[0] + dx * e2, karre[1] + 0.05 * e2, 0.04 * e2, '#8a7a60', false);
    }
  });
}

// ---- Kaserne --------------------------------------------------------------------

// Wehrhaft: Mauern aus Stein, ein Obergeschoss aus dunklem Holz, flaches
// Schindeldach mit Zinnenkranz, davor ein Waffenstaender mit Speeren und
// Schilden. Das Banner an der Front traegt die Spielerfarbe.
function kaserne(stift, e, farbe) {
  const W = 2.2 * e;
  vorbereiten(stift, e, W, W / 2);
  const wand = 1.1 * e;
  const { L1, B1, R1, traufe } = kasten(stift, W, 0.22 * e, wand, e, {
    sockelL: '#6f6b64', sockelR: '#8a857c', wandL: '#8f8a80', wandR: '#aba59a', wandMuster: 'stein',
  });
  // Schiessscharten links, Tor rechts.
  for (const u of [0.25, 0.55, 0.85]) fenster(stift, L1, B1, wand, u, 0.62, e, 0.05, 0.3);
  const torBreite = 0.3;
  const tor = [
    wandpunkt(B1, R1, wand, 0.5 - torBreite / 2, 0), wandpunkt(B1, R1, wand, 0.5 + torBreite / 2, 0),
    wandpunkt(B1, R1, wand, 0.5 + torBreite / 2, 0.55), wandpunkt(B1, R1, wand, 0.5, 0.72),
    wandpunkt(B1, R1, wand, 0.5 - torBreite / 2, 0.55),
  ];
  flaeche(stift, tor, verlauf(stift, '#5e4630', tor[4], tor[1], 0.1, -0.2));
  for (const t of [0.25, 0.5, 0.75]) {
    linie(stift, zwischen(tor[0], tor[1], t), zwischen(tor[4], tor[2], t), 'rgba(0,0,0,0.35)', Math.max(0.4, e * 0.025));
  }
  linie(stift, zwischen(tor[0], tor[4], 0.4), zwischen(tor[1], tor[2], 0.4), '#55493e', Math.max(0.8, e * 0.05));
  stift.lineWidth = Math.max(0.7, e * 0.035);
  // Obergeschoss aus Holz, leicht vorkragend.
  const og = 0.55 * e;
  const L2 = hoch([-W * 1.04, 0], traufe);
  const B2 = hoch([0, (W / 2) * 1.04], traufe);
  const R2 = hoch([W * 1.04, 0], traufe);
  flaeche(stift, [L2, B2, hoch(B2, og), hoch(L2, og)], verlauf(stift, '#5a3d24', hoch(L2, og), B2, 0.1, -0.2), false);
  flaeche(stift, [B2, R2, hoch(R2, og), hoch(B2, og)], verlauf(stift, '#76512f', hoch(B2, og), R2, 0.14, -0.14), false);
  bretter(stift, L2, B2, og, e, 9, '#5a3d24');
  bretter(stift, B2, R2, og, e, 9, '#76512f');
  pfad(stift, [L2, B2, hoch(B2, og), hoch(L2, og)]);
  stift.stroke();
  pfad(stift, [B2, R2, hoch(R2, og), hoch(B2, og)]);
  stift.stroke();
  // Flaches Dach mit Zinnen.
  const oben = traufe + og;
  const H = (W / 2) * 1.04;
  const dach = [hoch([-W * 1.04, 0], oben), hoch([0, -H], oben), hoch([W * 1.04, 0], oben), hoch([0, H], oben)];
  flaeche(stift, dach, verlauf(stift, '#5b554e', dach[1], dach[3], 0.12, -0.2), false);
  deckung(stift, dach, dach[3], dach[2], dach[0], dach[1], e, 'schindel');
  pfad(stift, dach);
  stift.stroke();
  for (const [a, b] of [[dach[0], dach[3]], [dach[3], dach[2]]]) {
    for (let k = 0; k < 6; k++) {
      const p0 = zwischen(a, b, k / 6 + 0.02);
      const p1 = zwischen(a, b, k / 6 + 0.1);
      flaeche(stift, [p0, p1, hoch(p1, 0.2 * e), hoch(p0, 0.2 * e)], k % 2 ? '#8a857c' : '#a39d93');
    }
  }
  // Banner in Spielerfarbe an der Front, mit gekreuzten Schwertern.
  const oberkante = hoch(zwischen(B2, R2, 0.5), og * 0.95);
  const banner = [
    [oberkante[0] - 0.22 * e, oberkante[1] + 0.11 * e], [oberkante[0] + 0.22 * e, oberkante[1] - 0.11 * e],
    [oberkante[0] + 0.22 * e, oberkante[1] + 0.55 * e], [oberkante[0], oberkante[1] + 0.75 * e],
    [oberkante[0] - 0.22 * e, oberkante[1] + 0.77 * e],
  ];
  flaeche(stift, banner, verlauf(stift, farbe, banner[0], banner[3], 0.2, -0.3));
  linie(stift, [oberkante[0] - 0.12 * e, oberkante[1] + 0.2 * e], [oberkante[0] + 0.12 * e, oberkante[1] + 0.55 * e], '#e8e4da', Math.max(0.6, e * 0.04));
  linie(stift, [oberkante[0] + 0.12 * e, oberkante[1] + 0.12 * e], [oberkante[0] - 0.12 * e, oberkante[1] + 0.6 * e], '#e8e4da', Math.max(0.6, e * 0.04));
  // Waffenstaender vorn links: Querholz mit Speeren und zwei Schilden.
  const staender = zwischen([-W, 0], [0, W / 2], 0.78);
  // Dicht an der Wand, innerhalb der Grundflaeche.
  const s0 = [staender[0] - 0.45 * e, staender[1] + 0.02 * e];
  const s1 = [staender[0] + 0.25 * e, staender[1] + 0.32 * e];
  for (const t of [0.1, 0.35, 0.6, 0.85]) {
    const fuss = zwischen(s0, s1, t);
    linie(stift, fuss, [fuss[0] - 0.05 * e, fuss[1] - 0.9 * e], '#6b4a2b', Math.max(0.7, e * 0.04));
    flaeche(stift, [[fuss[0] - 0.1 * e, fuss[1] - 0.9 * e], [fuss[0], fuss[1] - 1.05 * e], [fuss[0] + 0.04 * e, fuss[1] - 0.88 * e]], '#c9ced4');
  }
  linie(stift, hoch(s0, 0.55 * e), hoch(s1, 0.55 * e), '#5b3d22', Math.max(0.8, e * 0.06));
  for (const t of [0.25, 0.7]) {
    const mitte = hoch(zwischen(s0, s1, t), 0.2 * e);
    stift.beginPath();
    stift.ellipse(mitte[0], mitte[1], 0.16 * e, 0.2 * e, -0.4, 0, Math.PI * 2);
    stift.fillStyle = verlauf(stift, '#7a6048', [mitte[0] - 0.16 * e, mitte[1] - 0.2 * e], [mitte[0] + 0.16 * e, mitte[1] + 0.2 * e], 0.2, -0.3);
    stift.fill();
    stift.stroke();
    kreis(stift, mitte[0], mitte[1], 0.05 * e, '#c9ced4', false);
  }
}

// ---- Farm -----------------------------------------------------------------------

// Flach und begehbar (einheiten AC-18): ein Acker mit Furchen, darauf Getreide,
// das mit der Nahrung weniger wird, ein niedriger Zaun vorn und eine
// Vogelscheuche, deren Hemd die Spielerfarbe traegt.
function farm(stift, e, farbe, { rest = 1 } = {}) {
  const W = 2.9 * e;
  const H = W / 2;
  const L = [-W, 0];
  const B = [0, H];
  const R = [W, 0];
  const T = [0, -H];
  // Acker: Erde mit Licht von hinten links.
  flaeche(stift, [L, B, R, T], verlauf(stift, '#6c5840', T, B, 0.12, -0.18), false);
  const reihen = 8;
  innerhalb(stift, [L, B, R, T], () => {
    for (let i = 0; i <= reihen; i++) {
      const t = (i + 0.5) / (reihen + 1);
      const a = zwischen(L, T, t);
      const b = zwischen(B, R, t);
      // Furche: dunkler Graben, heller Wall daneben.
      linie(stift, a, b, 'rgba(45, 30, 15, 0.55)', Math.max(0.8, e * 0.08));
      linie(stift, [a[0], a[1] - e * 0.06], [b[0], b[1] - e * 0.06], 'rgba(170, 130, 85, 0.35)', Math.max(0.5, e * 0.04));
      // Getreide auf dem Wall: Anzahl und Hoehe mit dem Rest.
      const halme = Math.round(10 * Math.max(0, Math.min(1, rest)));
      for (let k = 0; k < halme; k++) {
        const u = (k + 0.5 + (zufall(i * 7 + k) - 0.5) * 0.4) / 10;
        const fuss = zwischen([a[0], a[1] - e * 0.06], [b[0], b[1] - e * 0.06], u);
        const hoehe = e * (0.28 + zufall(i * 3 + k) * 0.12) * (0.6 + 0.4 * rest);
        linie(stift, fuss, [fuss[0] + e * 0.03, fuss[1] - hoehe], 'rgba(122, 128, 72, 0.9)', Math.max(0.6, e * 0.04));
        kreis(stift, fuss[0] + e * 0.035, fuss[1] - hoehe, Math.max(0.8, e * 0.06), 'rgba(196, 176, 112, 0.95)', false);
      }
    }
  });
  stift.lineWidth = Math.max(0.7, e * 0.035);
  pfad(stift, [L, B, R, T]);
  stift.strokeStyle = 'rgba(40, 28, 16, 0.6)';
  stift.stroke();
  stift.strokeStyle = KONTUR;
  // Zaun an den beiden vorderen Kanten: Pfosten und zwei Latten.
  for (const [a, b] of [[L, B], [B, R]]) {
    for (let k = 0; k <= 6; k++) {
      const p = zwischen(a, b, k / 6);
      linie(stift, p, hoch(p, 0.42 * e), '#5b3d22', Math.max(1, e * 0.07));
    }
    for (const h of [0.18, 0.36]) linie(stift, hoch(a, h * e), hoch(b, h * e), '#7a6048', Math.max(0.8, e * 0.05));
  }
  // Vogelscheuche in der hinteren Ecke - in der Mitte arbeitet der Bauer und
  // verdeckte sie (Runde 31).
  const fuss = zwischen(T, B, 0.1);
  linie(stift, fuss, hoch(fuss, 1.2 * e), '#5b3d22', Math.max(1, e * 0.07));
  linie(stift, hoch([fuss[0] - 0.45 * e, fuss[1]], 0.85 * e), hoch([fuss[0] + 0.45 * e, fuss[1]], 0.85 * e), '#5b3d22', Math.max(1, e * 0.06));
  stift.lineWidth = Math.max(0.8, e * 0.04);
  flaeche(stift, [
    hoch([fuss[0] - 0.3 * e, fuss[1]], 0.95 * e), hoch([fuss[0] + 0.3 * e, fuss[1]], 0.95 * e),
    hoch([fuss[0] + 0.24 * e, fuss[1]], 0.45 * e), hoch([fuss[0] - 0.24 * e, fuss[1]], 0.45 * e),
  ], verlauf(stift, farbe, hoch(fuss, 0.95 * e), hoch(fuss, 0.45 * e), 0.2, -0.25));
  kreis(stift, fuss[0], fuss[1] - 1.08 * e, 0.14 * e, '#d8c49a');
  stift.beginPath();
  stift.ellipse(fuss[0], fuss[1] - 1.18 * e, 0.24 * e, 0.07 * e, 0, 0, Math.PI * 2);
  stift.fillStyle = '#c4ad80';
  stift.fill();
  stift.stroke();
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
  // Fundament: festgetretene Erde mit Steinen.
  flaeche(stift, [L, B, R, T], verlauf(stift, '#7b6a55', T, B, 0.1, -0.15));
  innerhalb(stift, [L, B, R, T], () => {
    for (let i = 0; i < 14; i++) {
      const p = zwischen(zwischen(L, T, zufall(i * 3)), zwischen(B, R, zufall(i * 3)), zufall(i * 5));
      kreis(stift, p[0], p[1], e * (0.05 + zufall(i) * 0.05), 'rgba(160,150,135,0.8)', false);
    }
  });
  flaeche(stift, [L, B, hoch(B, 0.15 * e), hoch(L, 0.15 * e)], '#8d8a83');
  flaeche(stift, [B, R, hoch(R, 0.15 * e), hoch(B, 0.15 * e)], '#a9a59c');
  mauerwerk(stift, L, B, 0.15 * e, e, { reihen: 1, steine: 6, grund: '#8d8a83' });
  mauerwerk(stift, B, R, 0.15 * e, e, { reihen: 1, steine: 6, grund: '#a9a59c' });
  // Waende, so weit gebaut - aus Brettern.
  const wand = Math.max(0.05, anteil) * 1.1 * e;
  const L1 = hoch(L, 0.15 * e);
  const B1 = hoch(B, 0.15 * e);
  const R1 = hoch(R, 0.15 * e);
  flaeche(stift, [L1, B1, hoch(B1, wand), hoch(L1, wand)], '#a88f6c', false);
  flaeche(stift, [B1, R1, hoch(R1, wand), hoch(B1, wand)], '#c0a882', false);
  bretter(stift, L1, B1, wand, e, 7, '#a88f6c');
  bretter(stift, B1, R1, wand, e, 7, '#c0a882');
  pfad(stift, [L1, B1, hoch(B1, wand), hoch(L1, wand)]);
  stift.stroke();
  pfad(stift, [B1, R1, hoch(R1, wand), hoch(B1, wand)]);
  stift.stroke();
  // Geruest: Stangen an den Ecken, immer etwas hoeher als die Wand, dazu Laufbretter.
  const stange = wand + 0.5 * e;
  for (const p of [L, B, R]) {
    linie(stift, hoch(p, 0.15 * e), hoch(p, 0.15 * e + stange), '#5b3d22', Math.max(1, e * 0.07));
    linie(stift, [p[0] - e * 0.02, p[1] - 0.15 * e], [p[0] - e * 0.02, p[1] - 0.15 * e - stange], 'rgba(255,220,170,0.3)', Math.max(0.3, e * 0.02));
  }
  for (const z of [0.5, 1]) {
    const h = 0.15 * e + stange * z;
    linie(stift, hoch(L, h), hoch(B, h), '#907a5a', Math.max(1.2, e * 0.1));
    linie(stift, hoch(B, h), hoch(R, h), '#a48c68', Math.max(1.2, e * 0.1));
  }
  // Querstreben am Geruest.
  linie(stift, hoch(L, 0.15 * e), hoch(B, 0.15 * e + stange * 0.5), 'rgba(90,60,30,0.8)', Math.max(0.6, e * 0.04));
  linie(stift, hoch(B, 0.15 * e), hoch(R, 0.15 * e + stange * 0.5), 'rgba(90,60,30,0.8)', Math.max(0.6, e * 0.04));
  // Ein Stapel Bretter vorn - mit duenner Kontur, sonst wird er ein Klecks.
  stift.lineWidth = Math.max(0.8, e * 0.035);
  for (let i = 0; i < 3; i++) {
    const y = H * 0.55 - i * 0.12 * e;
    const brett = [[-0.5 * e, y], [0.4 * e, y + 0.2 * e], [0.5 * e, y + 0.12 * e], [-0.4 * e, y - 0.08 * e]];
    flaeche(stift, brett, verlauf(stift, '#b49c78', brett[3], brett[1], 0.15, -0.15));
  }
}

// ---- Verzeichnis ----------------------------------------------------------------

// ---- Gebaeude der Feudalzeit (bauen AC-24) --------------------------------

// Schiessanlage: ein weiter, niedriger Unterstand auf Pfosten ueber gestampftem
// Sand, vorn rechts die Zielscheibe mit roten Ringen, links ein Bogenstaender.
// Das Merkmal ist die Scheibe - und dass das Dach flach und breit liegt, wo
// alle anderen hoch bauen (darstellung AC-14).
function schiessanlage(stift, e, farbe) {
  const W = 2.5 * e;
  const H = W / 2;
  vorbereiten(stift, e, W, H);
  const L = [-W, 0];
  const B = [0, H];
  const R = [W, 0];
  const T = [0, -H];
  // Gestampfter Sand mit Spuren.
  flaeche(stift, [L, B, R, T], verlauf(stift, '#b5a075', T, B, 0.1, -0.18));
  innerhalb(stift, [L, B, R, T], () => {
    for (let i = 1; i < 8; i++) {
      linie(stift, zwischen(L, T, i / 8), zwischen(B, R, i / 8), 'rgba(90,70,40,0.22)', Math.max(0.4, e * 0.03));
    }
  });
  stift.lineWidth = Math.max(0.7, e * 0.035);
  const pfosten = (q, h) => {
    linie(stift, q, hoch(q, h), '#5e4632', Math.max(1.3, e * 0.12));
    linie(stift, [q[0] - e * 0.03, q[1]], [q[0] - e * 0.03, q[1] - h], 'rgba(255,220,170,0.28)', Math.max(0.4, e * 0.04));
  };
  const hinten = 1.65 * e;
  const vorn = 1.35 * e;
  const mitte = (hinten + vorn) / 2;
  for (const [q, h] of [[L, mitte], [T, hinten], [R, mitte], [B, vorn]]) pfosten(q, h);
  // Flaches Segeltuchdach, gespannt statt gedeckt - eine eigene Oberflaeche.
  const dach = [hoch([-W * 1.12, 0], mitte), hoch([0, -H * 1.12], hinten), hoch([W * 1.12, 0], mitte), hoch([0, H * 1.12], vorn)];
  flaeche(stift, dach, verlauf(stift, '#5c6b4a', dach[1], dach[3], 0.14, -0.22), false);
  innerhalb(stift, dach, () => {
    for (let i = 1; i < 7; i++) {
      linie(stift, zwischen(dach[0], dach[1], i / 7), zwischen(dach[3], dach[2], i / 7), 'rgba(30,40,20,0.3)', Math.max(0.5, e * 0.04));
    }
  });
  pfad(stift, dach);
  stift.stroke();
  // Zielscheibe vorn rechts: Strohscheibe auf einem Bock, rote Ringe.
  const fuss = zwischen(B, R, 0.52);
  for (const q of [[fuss[0] - 0.5 * e, fuss[1] + 0.12 * e], [fuss[0] + 0.5 * e, fuss[1] + 0.12 * e]]) {
    linie(stift, q, hoch(q, 0.45 * e), '#6b4a2b', Math.max(1, e * 0.07));
  }
  const m = hoch(fuss, 1.0 * e);
  for (const [r, f] of [[0.52, '#d9cba0'], [0.36, '#c23a2e'], [0.2, '#e8e2d2'], [0.08, '#c23a2e']]) {
    stift.beginPath();
    stift.ellipse(m[0], m[1], r * e, r * e * 1.02, 0, 0, Math.PI * 2);
    stift.fillStyle = f;
    stift.fill();
    stift.stroke();
  }
  // Ein Pfeil steckt im zweiten Ring.
  linie(stift, [m[0] + 0.1 * e, m[1] - 0.26 * e], [m[0] + 0.52 * e, m[1] - 0.62 * e], '#7a5a33', Math.max(0.6, e * 0.04));
  flaeche(stift, [[m[0] + 0.46 * e, m[1] - 0.52 * e], [m[0] + 0.56 * e, m[1] - 0.68 * e], [m[0] + 0.6 * e, m[1] - 0.5 * e]], '#e8e4da');
  // Bogenstaender links unter dem Dach.
  const st = zwischen(L, B, 0.55);
  const s0 = [st[0] - 0.3 * e, st[1] - 0.1 * e];
  const s1 = [st[0] + 0.35 * e, st[1] + 0.18 * e];
  linie(stift, s0, s1, '#5b3d22', Math.max(0.9, e * 0.06));
  for (const t of [0.15, 0.45, 0.75]) {
    const q = zwischen(s0, s1, t);
    stift.beginPath();
    stift.moveTo(q[0], q[1]);
    stift.quadraticCurveTo(q[0] - 0.3 * e, q[1] - 0.45 * e, q[0], q[1] - 0.85 * e);
    stift.strokeStyle = '#6b4a2b';
    stift.lineWidth = Math.max(0.6, e * 0.045);
    stift.stroke();
    linie(stift, q, hoch(q, 0.85 * e), 'rgba(235,230,210,0.8)', Math.max(0.4, e * 0.025));
    stift.strokeStyle = KONTUR;
    stift.lineWidth = Math.max(0.7, e * 0.035);
  }
  // Wimpel in Spielerfarbe am vorderen Pfosten.
  fahne(stift, hoch(B, vorn), e, farbe, 0.65);
}

// Stall: eine Scheune aus Brettern mit weitem Tor, davor eine Koppel aus
// Querlatten mit Heu und Trog. Das Merkmal ist der Zaun - kein anderes
// Gebaeude hat eine Einfriedung (darstellung AC-14).
function stall(stift, e, farbe) {
  const W = 2.2 * e;
  const H = W / 2;
  vorbereiten(stift, e, W, H);
  const wand = 1.05 * e;
  const { L1, B1, R1, traufe } = kasten(stift, W, 0.18 * e, wand, e, {
    sockelL: '#6a6158', sockelR: '#847a6d', wandL: '#6d4e30', wandR: '#8d6a44', wandMuster: 'keins',
  });
  bretter(stift, L1, B1, wand, e, 10, '#6d4e30');
  bretter(stift, B1, R1, wand, e, 10, '#8d6a44');
  // Weites Tor, oben und unten geteilt - die obere Haelfte steht offen.
  const breit = 0.42;
  const tor = [
    wandpunkt(B1, R1, wand, 0.5 - breit / 2, 0), wandpunkt(B1, R1, wand, 0.5 + breit / 2, 0),
    wandpunkt(B1, R1, wand, 0.5 + breit / 2, 0.78), wandpunkt(B1, R1, wand, 0.5 - breit / 2, 0.78),
  ];
  flaeche(stift, tor, '#3f3528');
  const halb = [zwischen(tor[0], tor[3], 0.45), zwischen(tor[1], tor[2], 0.45)];
  flaeche(stift, [tor[0], tor[1], halb[1], halb[0]], verlauf(stift, '#5e4630', tor[0], halb[1], 0.12, -0.2));
  for (const t of [0.3, 0.7]) linie(stift, zwischen(tor[0], tor[1], t), zwischen(halb[0], halb[1], t), 'rgba(0,0,0,0.35)', Math.max(0.4, e * 0.025));
  linie(stift, halb[0], halb[1], '#4a3a28', Math.max(0.8, e * 0.05));
  // Hufeisen ueber dem Tor, in Spielerfarbe.
  const ueber = zwischen(tor[3], tor[2], 0.5);
  stift.beginPath();
  stift.arc(ueber[0], ueber[1] - 0.18 * e, 0.17 * e, Math.PI * 0.15, Math.PI * 0.85, true);
  stift.strokeStyle = farbe;
  stift.lineWidth = Math.max(1, e * 0.08);
  stift.stroke();
  stift.strokeStyle = KONTUR;
  stift.lineWidth = Math.max(0.7, e * 0.035);
  // Dach aus dunklem Schiefer, flach und weit ueberstehend - zusammen mit dem
  // Heuschober darueber die Gestalt einer Scheune.
  const { F1, F2, B2, R2 } = walmdach(stift, W, traufe, 0.52 * e, e, {
    hinten: '#3f4a44', links: '#4a564f', rechts: '#64736a', seite: '#44504a',
  }, 'schindel', 1.2);
  // Heuschober auf dem First: ein kleiner Giebel mit offener Luke und Balken,
  // an dem eine Garbe haengt - das sieht man auch bei Zoom 1.
  const sMitte = zwischen(F1, F2, 0.5);
  const sch = [[sMitte[0] - 0.42 * e, sMitte[1] + 0.1 * e], [sMitte[0] + 0.42 * e, sMitte[1] + 0.1 * e],
    [sMitte[0] + 0.42 * e, sMitte[1] - 0.46 * e], [sMitte[0] - 0.42 * e, sMitte[1] - 0.46 * e]];
  flaeche(stift, sch, verlauf(stift, '#7b5a36', sch[3], sch[1], 0.16, -0.24));
  bretter(stift, sch[0], sch[1], 0.56 * e, e, 5, '#7b5a36');
  flaeche(stift, [[sMitte[0] - 0.5 * e, sMitte[1] - 0.44 * e], [sMitte[0] + 0.5 * e, sMitte[1] - 0.44 * e],
    [sMitte[0], sMitte[1] - 0.82 * e]], '#3f4a44');
  flaeche(stift, [[sMitte[0] - 0.16 * e, sMitte[1] + 0.08 * e], [sMitte[0] + 0.16 * e, sMitte[1] + 0.08 * e],
    [sMitte[0] + 0.16 * e, sMitte[1] - 0.3 * e], [sMitte[0] - 0.16 * e, sMitte[1] - 0.3 * e]], '#3b3024');
  linie(stift, [sMitte[0], sMitte[1] - 0.46 * e], [sMitte[0], sMitte[1] - 0.72 * e], '#5b3d22', Math.max(0.7, e * 0.05));
  linie(stift, [sMitte[0] - 0.08 * e, sMitte[1] - 0.6 * e], [sMitte[0] + 0.34 * e, sMitte[1] - 0.6 * e], '#5b3d22', Math.max(0.7, e * 0.05));
  for (let i = 0; i < 4; i++) {
    const q = [sMitte[0] + (0.18 + i * 0.05) * e, sMitte[1] - 0.58 * e];
    linie(stift, q, [q[0] + 0.06 * e, q[1] + 0.3 * e], '#cdb259', Math.max(0.5, e * 0.035));
  }
  void B2;
  void R2;
  // Koppel vorn links, das Merkmal des Stalls: vier helle Pfosten mit zwei
  // Querlatten, dahinter ein Heuballen und der Trog. Hell und hoch genug, dass
  // der Zaun bei Zoom 1 noch zu sehen ist (darstellung AC-14).
  const z0 = [-W * 1.12, 0.1 * e];
  const z1 = [-0.06 * W, H * 1.06];
  const zaun = 0.85 * e;
  for (const t of [0, 0.34, 0.67, 1]) {
    const q = zwischen(z0, z1, t);
    linie(stift, q, hoch(q, zaun), '#9b7a4a', Math.max(1.2, e * 0.085));
    linie(stift, [q[0] - e * 0.03, q[1]], [q[0] - e * 0.03, q[1] - zaun], 'rgba(255,230,190,0.35)', Math.max(0.4, e * 0.04));
  }
  for (const h of [0.38, 0.72]) {
    linie(stift, hoch(z0, h * e), hoch(z1, h * e), '#b08c54', Math.max(1, e * 0.062));
  }
  // Ein Heuballen hinter dem Zaun, als Block mit Halmen - kein Haufen Striche.
  const heu = zwischen(z0, z1, 0.6);
  const hb = [[heu[0] - 0.3 * e, heu[1] - 0.12 * e], [heu[0] + 0.26 * e, heu[1] + 0.06 * e],
    [heu[0] + 0.26 * e, heu[1] - 0.44 * e], [heu[0] - 0.3 * e, heu[1] - 0.62 * e]];
  flaeche(stift, hb, verlauf(stift, '#cdb259', hb[3], hb[1], 0.16, -0.26));
  for (let i = 1; i < 4; i++) {
    linie(stift, zwischen(hb[0], hb[3], i / 4), zwischen(hb[1], hb[2], i / 4), 'rgba(120,95,30,0.45)', Math.max(0.4, e * 0.03));
  }
  const trog = zwischen(z0, z1, 0.2);
  flaeche(stift, [[trog[0] - 0.02 * e, trog[1]], [trog[0] + 0.46 * e, trog[1] + 0.18 * e],
    [trog[0] + 0.46 * e, trog[1] - 0.1 * e], [trog[0] - 0.02 * e, trog[1] - 0.28 * e]], '#7a5f3c');
  fahne(stift, hoch([0, H], traufe + 0.1 * e), e, farbe, 0.8);
}

// Schmiede: ein gedrungener Steinbau mit hohem Schornstein und Rauch, die
// Esse glueht orange durch die Oeffnung, davor der Amboss. Das Merkmal ist der
// Schornstein - sonst hat keines einen (darstellung AC-14).
function schmiede(stift, e, farbe) {
  const W = 2.0 * e;
  const H = W / 2;
  vorbereiten(stift, e, W, H);
  const wand = 0.74 * e;
  const { L1, B1, R1, traufe } = kasten(stift, W, 0.3 * e, wand, e, {
    sockelL: '#5c564e', sockelR: '#6f685d', wandL: '#7b736a', wandR: '#968c80', wandMuster: 'stein',
  });
  // Die Esse: eine breite Oeffnung rechts, in der es glueht.
  const o = [
    wandpunkt(B1, R1, wand, 0.34, 0.12), wandpunkt(B1, R1, wand, 0.72, 0.12),
    wandpunkt(B1, R1, wand, 0.72, 0.72), wandpunkt(B1, R1, wand, 0.34, 0.72),
  ];
  flaeche(stift, o, '#3a2c22');
  const mx = (o[0][0] + o[2][0]) / 2;
  const my = (o[0][1] + o[2][1]) / 2;
  const glut = stift.createRadialGradient(mx, my, 0, mx, my, 0.42 * e);
  glut.addColorStop(0, '#ffd27a');
  glut.addColorStop(0.45, '#e8732a');
  glut.addColorStop(1, 'rgba(120,30,0,0)');
  stift.save();
  pfad(stift, o);
  stift.clip();
  stift.fillStyle = glut;
  stift.fillRect(mx - 1.5 * e, my - 1.5 * e, 3 * e, 3 * e);
  stift.restore();
  pfad(stift, o);
  stift.stroke();
  // Kleines Fenster links, vergittert.
  fenster(stift, L1, B1, wand, 0.4, 0.6, e, 0.12, 0.3);
  // Flaches, fast schwarzes Pultdach - kein Walmdach wie die Wohnbauten.
  const dach = [hoch([-W * 1.1, 0], traufe + 0.2 * e), hoch([0, -H * 1.1], traufe + 0.45 * e),
    hoch([W * 1.1, 0], traufe + 0.2 * e), hoch([0, H * 1.1], traufe)];
  flaeche(stift, dach, verlauf(stift, '#5f4a33', dach[1], dach[3], 0.14, -0.18), false);
  deckung(stift, dach, dach[3], dach[2], dach[0], dach[1], e, 'schindel');
  pfad(stift, dach);
  stift.stroke();
  // Der Schornstein, hinten links, aus Backstein - und Rauch darueber.
  const sFuss = hoch([-0.52 * W, -0.16 * H], traufe + 0.3 * e);
  const sB = 0.3 * e;
  const sH = 1.5 * e;
  const sch = [[sFuss[0] - sB, sFuss[1]], [sFuss[0] + sB, sFuss[1] - 0.1 * e],
    [sFuss[0] + sB, sFuss[1] - sH], [sFuss[0] - sB, sFuss[1] - sH + 0.1 * e]];
  flaeche(stift, sch, verlauf(stift, '#8a4a33', sch[3], sch[1], 0.14, -0.28));
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    linie(stift, zwischen(sch[0], sch[3], t), zwischen(sch[1], sch[2], t), 'rgba(40,20,10,0.4)', Math.max(0.4, e * 0.025));
  }
  flaeche(stift, [[sFuss[0] - sB * 1.3, sFuss[1] - sH + 0.12 * e], [sFuss[0] + sB * 1.3, sFuss[1] - sH + 0.02 * e],
    [sFuss[0] + sB * 1.3, sFuss[1] - sH - 0.14 * e], [sFuss[0] - sB * 1.3, sFuss[1] - sH - 0.04 * e]], '#5e4034');
  for (const [i, r] of [0.26, 0.34, 0.42].entries()) {
    kreis(stift, sFuss[0] + (i - 0.3) * 0.22 * e, sFuss[1] - sH - (0.3 + i * 0.5) * e, r * e, 'rgba(205,200,190,' + (0.5 - i * 0.12) + ')', false);
  }
  // Der Amboss vorn, auf einem Klotz, daneben ein Hammer.
  const a = zwischen(B1, R1, 0.12);
  const klotz = [[a[0] - 0.3 * e, a[1] + 0.3 * e], [a[0] + 0.3 * e, a[1] + 0.44 * e],
    [a[0] + 0.3 * e, a[1] + 0.1 * e], [a[0] - 0.3 * e, a[1] - 0.04 * e]];
  flaeche(stift, klotz, verlauf(stift, '#6b4a2b', klotz[3], klotz[1], 0.14, -0.24));
  const ao = klotz.map((q) => hoch(q, 0.3 * e));
  flaeche(stift, [[ao[3][0] + 0.04 * e, ao[3][1]], [ao[2][0] - 0.04 * e, ao[2][1]],
    [ao[2][0] - 0.16 * e, ao[2][1] + 0.16 * e], [ao[3][0] + 0.16 * e, ao[3][1] + 0.16 * e]], '#4a4e52');
  flaeche(stift, [[ao[3][0] - 0.12 * e, ao[3][1] - 0.1 * e], [ao[2][0] + 0.12 * e, ao[2][1] - 0.04 * e],
    [ao[2][0], ao[2][1] + 0.06 * e], [ao[3][0], ao[3][1]]], '#6a7076');
  linie(stift, [a[0] + 0.36 * e, a[1] + 0.3 * e], [a[0] + 0.52 * e, a[1] - 0.2 * e], '#7a5a33', Math.max(0.7, e * 0.05));
  flaeche(stift, [[a[0] + 0.44 * e, a[1] - 0.2 * e], [a[0] + 0.64 * e, a[1] - 0.26 * e],
    [a[0] + 0.62 * e, a[1] - 0.42 * e], [a[0] + 0.42 * e, a[1] - 0.36 * e]], '#55595e');
  // Wimpel in Spielerfarbe am First.
  fahne(stift, hoch([0, H * 0.2], traufe + 0.5 * e), e, farbe, 0.75);
}

// ---- Aussenposten ------------------------------------------------------------

// Ein hoelzerner Wachturm auf einem Feld (kampf AC-18): vier Pfosten mit
// Streben, oben eine Plattform mit Bretterwand und Licht, darueber ein spitzes
// Dach mit Wimpel in Spielerfarbe. Hoch und schmal - kein anderes Gebaeude hat
// diese Silhouette (darstellung AC-14).
function aussenposten(stift, e, farbe) {
  const W = 0.9 * e;
  vorbereiten(stift, e, W, W / 2);
  const L = [-W, 0];
  const B = [0, W / 2];
  const R = [W, 0];
  const T = [0, -W / 2];
  const holz = '#6b4f33';
  const dunkel = '#4e3a26';
  const dicke = Math.max(1, e * 0.11);
  const plattform = 3.0 * e;
  // Oben ruecken die Pfosten etwas zusammen - der Turm verjuengt sich.
  const oben = (p) => hoch([p[0] * 0.82, p[1] * 0.82], plattform);
  // Erst die hinteren Pfosten, dann die vorderen.
  for (const p of [T, L, R]) linie(stift, p, oben(p), dunkel, dicke);
  // Kreuzstreben auf den beiden sichtbaren Seiten.
  for (const [a, b] of [[L, B], [B, R]]) {
    linie(stift, hoch(a, 0.3 * e), oben(b), dunkel, dicke * 0.6);
    linie(stift, hoch(b, 0.3 * e), oben(a), dunkel, dicke * 0.6);
  }
  linie(stift, B, oben(B), holz, dicke);
  // Die Plattform: Boden und zwei sichtbare Bretterwaende.
  const hoeheWand = 0.6 * e;
  const [pl, pb, pr, pt] = [L, B, R, T].map((p) => hoch([p[0] * 1.02, p[1] * 1.02], plattform));
  flaeche(stift, [pl, pb, pr, pt], '#5a4430');
  flaeche(stift, [pl, pb, hoch(pb, hoeheWand), hoch(pl, hoeheWand)], verlauf(stift, '#8a6a44', hoch(pl, hoeheWand), pb, 0.1, -0.2));
  bretter(stift, pl, pb, hoeheWand, e, 3, '#8a6a44');
  flaeche(stift, [pb, pr, hoch(pr, hoeheWand), hoch(pb, hoeheWand)], verlauf(stift, '#9c7a4e', hoch(pb, hoeheWand), pr, 0.14, -0.12));
  bretter(stift, pb, pr, hoeheWand, e, 3, '#9c7a4e');
  // Ein Licht in der rechten Wand - der Waechter wacht.
  const licht = [zwischen(pb, pr, 0.38), zwischen(pb, pr, 0.62)];
  flaeche(stift, [hoch(licht[0], 0.18 * e), hoch(licht[1], 0.18 * e), hoch(licht[1], 0.44 * e), hoch(licht[0], 0.44 * e)], '#ffd36a', false);
  // Das Dach: eine flache Pyramide mit Ueberstand, die Spitze hoch.
  const traufe = plattform + hoeheWand + 0.1 * e;
  const [dl, db, dr] = [L, B, R].map((p) => hoch([p[0] * 1.25, p[1] * 1.25], traufe));
  const spitze = hoch([0, 0], traufe + 1.1 * e);
  flaeche(stift, [dl, db, spitze], verlauf(stift, '#6a5236', spitze, db, 0.08, -0.22));
  flaeche(stift, [db, dr, spitze], verlauf(stift, '#7e6440', spitze, dr, 0.14, -0.1));
  linie(stift, db, spitze, ton('#6a5236', -0.3), Math.max(0.8, e * 0.06));
  fahne(stift, spitze, e, farbe, 0.7);
}

// ---- Wachturm ----------------------------------------------------------------

// Ein steinerner Turm auf einem Feld (bauen AC-29): ein gerader Schaft aus
// grauem Haustein mit Schiessscharten und Tuer, oben ein Wehrgang, der ueber
// den Schaft vorkragt, mit Zinnen - und darueber die Fahne. Neben dem
// hoelzernen Aussenposten mit seinem Spitzdach steht er wie ein Klotz: Stein
// statt Pfosten, Zinnen statt Dach (darstellung AC-14). Das Banner an der
// rechten Wand traegt die Spielerfarbe auch von weitem.
function wachturm(stift, e, farbe) {
  const W = 0.72 * e;
  vorbereiten(stift, e, W, W / 2);
  const L = [-W, 0];
  const B = [0, W / 2];
  const R = [W, 0];
  const links = '#958e80';
  const rechts = '#b7b0a0';
  const schaft = 3.5 * e;
  // Der Schaft: zwei sichtbare Waende mit Mauerwerk.
  flaeche(stift, [L, B, hoch(B, schaft), hoch(L, schaft)], verlauf(stift, links, hoch(L, schaft), B, 0.06, -0.26));
  mauerwerk(stift, L, B, schaft, e, { reihen: 10, steine: 2, grund: links });
  flaeche(stift, [B, R, hoch(R, schaft), hoch(B, schaft)], verlauf(stift, rechts, hoch(B, schaft), R, 0.12, -0.14));
  mauerwerk(stift, B, R, schaft, e, { reihen: 10, steine: 2, grund: rechts });
  // Die Tuer unten links, mit rundem Sturz.
  const t0 = wandpunkt(L, B, schaft, 0.32, 0);
  const t1 = wandpunkt(L, B, schaft, 0.68, 0);
  const tuer = [t0, t1, hoch(t1, 0.62 * e), zwischen(hoch(t0, 0.8 * e), hoch(t1, 0.8 * e), 0.5), hoch(t0, 0.62 * e)];
  flaeche(stift, tuer, '#3a2a1c');
  // Je Wand zwei Schiessscharten - schmal und dunkel, uebereinander.
  // Rechts ruecken sie neben das Banner.
  for (const [a, b, u] of [[L, B, 0.5], [B, R, 0.74]]) {
    for (const [v0, v1] of [[0.4, 0.52], [0.6, 0.72]]) {
      flaeche(stift, [wandpunkt(a, b, schaft, u - 0.04, v0), wandpunkt(a, b, schaft, u + 0.04, v0),
        wandpunkt(a, b, schaft, u + 0.04, v1), wandpunkt(a, b, schaft, u - 0.04, v1)], '#2a2420', false);
    }
  }
  // Das Banner in Spielerfarbe an der rechten Wand, unter dem Wehrgang.
  const b0 = wandpunkt(B, R, schaft, 0.2, 0.9);
  const b1 = wandpunkt(B, R, schaft, 0.5, 0.9);
  const banner = [b0, b1, hoch(b1, -0.95 * e), zwischen(hoch(b0, -1.1 * e), hoch(b1, -1.1 * e), 0.5), hoch(b0, -0.95 * e)];
  flaeche(stift, banner, verlauf(stift, farbe, b0, hoch(b1, -1 * e), 0.1, -0.25));
  // Der Wehrgang kragt vor: erst sein Schatten auf dem Schaft, dann der
  // Boden von oben, die hinteren Zinnen, die vorderen Brustwehren.
  const k = 1.3;
  const fuss = schaft - 0.05 * e;
  const [gl, gb, gr, gt] = [L, B, R, [0, -W / 2]].map((p) => hoch([p[0] * k, p[1] * k], fuss));
  const brust = 0.42 * e;
  flaeche(stift, [hoch(L, schaft - 0.32 * e), hoch(B, schaft - 0.32 * e), hoch(R, schaft - 0.32 * e), gr, gb, gl], 'rgba(30,26,22,0.45)', false);
  flaeche(stift, [gl, gb, gr, gt].map((p) => hoch(p, brust * 0.15)), '#5b554c');
  const zinne = 0.24 * e;
  const zinnen = (a, b, grund, n) => {
    for (let i = 0; i < n; i += 2) {
      const u0 = i / n;
      const u1 = (i + 1) / n;
      const z = [wandpunkt(a, b, brust, u0, 1), wandpunkt(a, b, brust, u1, 1)];
      flaeche(stift, [z[0], z[1], hoch(z[1], zinne), hoch(z[0], zinne)], grund);
    }
  };
  // Hinten sieht man die Innenseite der Brustwehr, im Schatten, mit Zinnen.
  for (const [a, b] of [[gl, gt], [gt, gr]]) {
    flaeche(stift, [a, b, hoch(b, brust), hoch(a, brust)], '#7a7468');
    zinnen(a, b, '#8a8376', 5);
  }
  flaeche(stift, [gl, gb, hoch(gb, brust), hoch(gl, brust)], verlauf(stift, links, hoch(gl, brust), gb, 0.08, -0.22));
  mauerwerk(stift, gl, gb, brust, e, { reihen: 2, steine: 3, grund: links });
  flaeche(stift, [gb, gr, hoch(gr, brust), hoch(gb, brust)], verlauf(stift, rechts, hoch(gb, brust), gr, 0.12, -0.12));
  mauerwerk(stift, gb, gr, brust, e, { reihen: 2, steine: 3, grund: rechts });
  zinnen(gl, gb, links, 5);
  zinnen(gb, gr, rechts, 5);
  // Die Fahne in der Mitte des Wehrgangs.
  fahne(stift, hoch([0, 0], fuss + brust * 0.15), e, farbe, 1.3);
}

// ---- Kloster -----------------------------------------------------------------

// Ein Schiff aus hellem Haustein mit steilem Schieferdach und Rundbogenfenstern,
// dahinter links ein hoher Glockenturm mit Pyramidendach - der Turm ueberragt
// alles im Dorf und gibt dem Kloster seine Silhouette (bauen AC-28,
// darstellung AC-14).
function kloster(stift, e, farbe) {
  const W = 2.1 * e;
  const H = W / 2;
  vorbereiten(stift, e, W, H);
  // Der Turm zuerst: er steht hinten, das Schiff davor.
  const tx = -0.5 * W;
  const ty = -0.3 * H;
  const tb = 0.42 * e;
  const th = 3.0 * e;
  const turmL = [[tx - tb, ty], [tx, ty + tb / 2], [tx, ty + tb / 2 - th], [tx - tb, ty - th]];
  const turmR = [[tx, ty + tb / 2], [tx + tb, ty], [tx + tb, ty - th], [tx, ty + tb / 2 - th]];
  flaeche(stift, turmL, verlauf(stift, '#bba57c', turmL[3], turmL[1], 0.08, -0.24));
  flaeche(stift, turmR, verlauf(stift, '#d6c39b', turmR[3], turmR[1], 0.14, -0.12));
  mauerwerk(stift, turmL[0], turmL[1], th, e, { reihen: 9, steine: 2, grund: '#bba57c' });
  mauerwerk(stift, turmR[0], turmR[1], th, e, { reihen: 9, steine: 2, grund: '#d6c39b' });
  // Die Schalloeffnung oben, dunkel, mit der Glocke darin.
  const so = [wandpunkt(turmR[0], turmR[1], th, 0.25, 0.72), wandpunkt(turmR[0], turmR[1], th, 0.75, 0.72),
    wandpunkt(turmR[0], turmR[1], th, 0.75, 0.9), wandpunkt(turmR[0], turmR[1], th, 0.25, 0.9)];
  flaeche(stift, so, '#2e261e');
  const glocke = zwischen(so[0], so[2], 0.5);
  kreis(stift, glocke[0], glocke[1] + 0.04 * e, 0.09 * e, '#c9a24a', false);
  // Pyramidendach aus Schiefer.
  const spitze = [tx, ty - th - 1.2 * e];
  const dl = [tx - tb * 1.15, ty - th + 0.02 * e];
  const db = [tx, ty + tb * 0.6 - th];
  const dr = [tx + tb * 1.15, ty - th + 0.02 * e];
  flaeche(stift, [dl, db, spitze], verlauf(stift, '#4a4f58', spitze, db, 0.1, -0.22));
  flaeche(stift, [db, dr, spitze], verlauf(stift, '#5d636e', spitze, dr, 0.16, -0.12));
  linie(stift, spitze, [spitze[0], spitze[1] - 0.35 * e], '#3a2c1f', Math.max(0.8, e * 0.05));
  linie(stift, [spitze[0] - 0.12 * e, spitze[1] - 0.25 * e], [spitze[0] + 0.12 * e, spitze[1] - 0.25 * e], '#3a2c1f', Math.max(0.8, e * 0.05));
  // Das Schiff.
  const wand = 0.92 * e;
  const { L1, B1, R1, traufe } = kasten(stift, W, 0.26 * e, wand, e, {
    sockelL: '#6a6256', sockelR: '#7d7466', wandL: '#c3ad84', wandR: '#d9c69f', wandMuster: 'stein',
  });
  // Rundbogenfenster: schmal und hoch, oben ein Bogen.
  const bogenfenster = (a, b, u) => {
    const unten = [wandpunkt(a, b, wand, u - 0.045, 0.3), wandpunkt(a, b, wand, u + 0.045, 0.3)];
    const oben = [wandpunkt(a, b, wand, u + 0.045, 0.72), wandpunkt(a, b, wand, u - 0.045, 0.72)];
    const scheitel = wandpunkt(a, b, wand, u, 0.82);
    stift.beginPath();
    stift.moveTo(unten[0][0], unten[0][1]);
    stift.lineTo(unten[1][0], unten[1][1]);
    stift.lineTo(oben[0][0], oben[0][1]);
    stift.quadraticCurveTo(scheitel[0] + 0.02 * e, scheitel[1] - 0.04 * e, oben[1][0], oben[1][1]);
    stift.closePath();
    stift.fillStyle = '#3b3328';
    stift.fill();
    stift.stroke();
  };
  for (const u of [0.18, 0.82]) bogenfenster(B1, R1, u);
  for (const u of [0.3, 0.7]) bogenfenster(L1, B1, u);
  tuerZeichnen(stift, B1, R1, wand, 0.5, e, '#6b4a2b', 0.16, 0.62);
  // Steiles Schieferdach - steiler als jedes Wohnhaus.
  walmdach(stift, W, traufe, 1.5 * e, e, { hinten: '#454a53', links: '#50565f', rechts: '#626873', seite: '#4b5059' }, 'schindel');
  fahne(stift, hoch([0.24 * W, 0], traufe + 1.45 * e), e, farbe, 0.75);
}

// ---- Universitaet ---------------------------------------------------------------

// Ein breiter Bau aus hellem Putz mit einer Saeulenreihe an der Front und einer
// gruenen Kupferkuppel - kein anderes Gebaeude traegt eine Kuppel (bauen AC-28).
function universitaet(stift, e, farbe) {
  const W = 2.2 * e;
  const H = W / 2;
  vorbereiten(stift, e, W, H);
  const wand = 0.95 * e;
  const { L1, B1, R1, traufe } = kasten(stift, W, 0.3 * e, wand, e, {
    sockelL: '#7a7264', sockelR: '#8c8474', wandL: '#d3c9b6', wandR: '#e6ddcb', wandMuster: 'putz',
  });
  // Saeulen an der Front, mit Schattenseite; dazwischen die Tuer.
  for (const u of [0.1, 0.26, 0.74, 0.9]) {
    linie(stift, wandpunkt(B1, R1, wand, u + 0.018, 0.02), wandpunkt(B1, R1, wand, u + 0.018, 0.94), 'rgba(90,80,60,0.45)', Math.max(0.8, e * 0.07));
    linie(stift, wandpunkt(B1, R1, wand, u, 0.02), wandpunkt(B1, R1, wand, u, 0.94), '#f6f1e6', Math.max(0.9, e * 0.09));
  }
  tuerZeichnen(stift, B1, R1, wand, 0.5, e, '#5e4630', 0.2, 0.66);
  for (const u of [0.28, 0.72]) fenster(stift, L1, B1, wand, u, 0.55, e, 0.12, 0.3);
  // Gesims und flaches Dach.
  const dach = [hoch([-W * 1.06, 0], traufe), hoch([0, -H * 1.06], traufe), hoch([W * 1.06, 0], traufe), hoch([0, H * 1.06], traufe)];
  flaeche(stift, dach, verlauf(stift, '#a49a88', dach[1], dach[3], 0.12, -0.18));
  flaeche(stift, [dach[0], dach[3], hoch(dach[3], 0.14 * e), hoch(dach[0], 0.14 * e)], '#cfc5b1');
  flaeche(stift, [dach[3], dach[2], hoch(dach[2], 0.14 * e), hoch(dach[3], 0.14 * e)], '#ece4d2');
  // Tambour und Kuppel.
  const mitte = hoch([0, 0], traufe + 0.14 * e);
  const r = 0.78 * e;
  const tambour = 0.36 * e;
  const ring = [[mitte[0] - r, mitte[1]], [mitte[0] + r, mitte[1]], [mitte[0] + r, mitte[1] - tambour], [mitte[0] - r, mitte[1] - tambour]];
  flaeche(stift, ring, verlauf(stift, '#ddd3bf', ring[3], ring[1], 0.16, -0.22));
  for (const t of [0.2, 0.4, 0.6, 0.8]) {
    const x = mitte[0] - r + 2 * r * t;
    linie(stift, [x, mitte[1] - 0.05 * e], [x, mitte[1] - tambour + 0.05 * e], 'rgba(80,70,50,0.35)', Math.max(0.5, e * 0.04));
  }
  const fuss = mitte[1] - tambour;
  const kuppel = stift.createLinearGradient(mitte[0] - r, fuss - r, mitte[0] + r, fuss);
  kuppel.addColorStop(0, '#8fbfae');
  kuppel.addColorStop(0.55, '#5f8f7e');
  kuppel.addColorStop(1, '#3f6457');
  stift.beginPath();
  stift.moveTo(mitte[0] - r, fuss);
  stift.bezierCurveTo(mitte[0] - r, fuss - r * 1.15, mitte[0] + r, fuss - r * 1.15, mitte[0] + r, fuss);
  stift.closePath();
  stift.fillStyle = kuppel;
  stift.fill();
  stift.stroke();
  for (const t of [-0.5, 0, 0.5]) {
    linie(stift, [mitte[0] + t * r, fuss], [mitte[0] + t * 0.3 * r, fuss - r * 0.82], 'rgba(30,60,50,0.35)', Math.max(0.5, e * 0.04));
  }
  // Laterne oben, mit Wimpel.
  const laterne = [mitte[0], fuss - r * 0.86];
  flaeche(stift, [[laterne[0] - 0.12 * e, laterne[1]], [laterne[0] + 0.12 * e, laterne[1]],
    [laterne[0] + 0.12 * e, laterne[1] - 0.24 * e], [laterne[0] - 0.12 * e, laterne[1] - 0.24 * e]], '#e6ddcb');
  fahne(stift, [laterne[0], laterne[1] - 0.24 * e], e, farbe, 0.7);
}

// ---- Belagerungswerkstatt ------------------------------------------------------

// Eine offene Halle aus Balken mit Schindeldach, davor auf gestampftem Boden ein
// grosses Holzrad und ein Rammbalken auf Boecken - hier wird gebaut, nicht
// gewohnt (bauen AC-28).
function belagerungswerkstatt(stift, e, farbe) {
  const W = 2.2 * e;
  const H = W / 2;
  vorbereiten(stift, e, W, H);
  const L = [-W, 0];
  const B = [0, H];
  const R = [W, 0];
  const T = [0, -H];
  flaeche(stift, [L, B, R, T], verlauf(stift, '#7a6448', T, B, 0.08, -0.16));
  // Die Halle hinten: Pfosten und ein Satteldach.
  const pfosten = (p, h) => {
    linie(stift, p, hoch(p, h), '#5e4632', Math.max(1.4, e * 0.15));
    linie(stift, [p[0] - e * 0.03, p[1]], [p[0] - e * 0.03, p[1] - h], 'rgba(255,220,170,0.3)', Math.max(0.4, e * 0.04));
  };
  stift.save();
  stift.translate(0, -0.32 * H);
  satteldach(stift, e, W * 0.82, H * 0.82, pfosten, { oben: '#6f5638', kante: '#3d2c1c', kanteHell: '#8f7048' });
  stift.restore();
  // Vorn links der Rammbalken auf zwei Boecken, mit eisernem Kopf.
  const bock = (p) => {
    linie(stift, [p[0] - 0.16 * e, p[1]], [p[0], p[1] - 0.42 * e], '#5a4028', Math.max(1, e * 0.08));
    linie(stift, [p[0] + 0.16 * e, p[1]], [p[0], p[1] - 0.42 * e], '#5a4028', Math.max(1, e * 0.08));
  };
  const b1 = zwischen(L, B, 0.35);
  const b2 = zwischen(L, B, 0.75);
  bock(b1);
  bock(b2);
  const hinten = [b1[0] - 0.3 * e, b1[1] - 0.48 * e];
  const vorn = [b2[0] + 0.32 * e, b2[1] - 0.36 * e];
  linie(stift, hinten, vorn, '#3d2c1c', Math.max(2.6, e * 0.26));
  linie(stift, hinten, vorn, '#7a5a38', Math.max(2, e * 0.2));
  kreis(stift, vorn[0], vorn[1], Math.max(1.4, e * 0.15), '#4c5157');
  // Vorn rechts ein grosses Rad, aufrecht, mit Speichen und Nabe.
  const rad = hoch(zwischen(B, R, 0.42), 0.52 * e);
  const rr = 0.48 * e;
  stift.save();
  stift.strokeStyle = '#3d2c1c';
  stift.lineWidth = Math.max(2, e * 0.13);
  stift.beginPath();
  stift.ellipse(rad[0], rad[1], rr * 0.8, rr, 0, 0, Math.PI * 2);
  stift.stroke();
  stift.strokeStyle = '#8a6a44';
  stift.lineWidth = Math.max(1.2, e * 0.08);
  stift.stroke();
  for (let i = 0; i < 6; i++) {
    const w = (i / 6) * Math.PI;
    linie(stift, [rad[0] - Math.cos(w) * rr * 0.8, rad[1] - Math.sin(w) * rr], [rad[0] + Math.cos(w) * rr * 0.8, rad[1] + Math.sin(w) * rr], '#6e5236', Math.max(0.7, e * 0.05));
  }
  stift.restore();
  kreis(stift, rad[0], rad[1], Math.max(1, e * 0.09), '#4c5157');
  fahne(stift, hoch([0, -0.32 * H + H * 0.82], SATTEL_FIRST * e), e, farbe, 0.7);
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
  haus: { name: 'Haus', zeichnen: haus, halbeBreite: 1.8, trefferBreite: 1.9, trefferOben: 3.2, trefferUnten: 1 },
  muehle: { name: 'Mühle', zeichnen: muehle, halbeBreite: 1.8, trefferBreite: 1.9, trefferOben: 3.4, trefferUnten: 1 },
  holzfaellerlager: {
    name: 'Holzfällerlager', zeichnen: holzfaellerlager, halbeBreite: 1.8, trefferBreite: 1.9, trefferOben: 2.4, trefferUnten: 1,
  },
  bergbaulager: {
    name: 'Bergbaulager', zeichnen: bergbaulager, halbeBreite: 1.8, trefferBreite: 1.9, trefferOben: 2.4, trefferUnten: 1,
  },
  kaserne: { name: 'Kaserne', zeichnen: kaserne, halbeBreite: 2.2, trefferBreite: 2.3, trefferOben: 3.3, trefferUnten: 1.2 },
  farm: { name: 'Farm', zeichnen: farm, halbeBreite: 2.9, trefferBreite: 2.9, trefferOben: 1.6, trefferUnten: 1.4, flach: true },
  // Gebaeude der Feudalzeit (bauen AC-24).
  schiessanlage: {
    name: 'Schießanlage', zeichnen: schiessanlage, halbeBreite: 2.5, trefferBreite: 2.6, trefferOben: 2.2, trefferUnten: 1.3,
  },
  stall: { name: 'Stall', zeichnen: stall, halbeBreite: 2.2, trefferBreite: 2.4, trefferOben: 3.0, trefferUnten: 1.2 },
  schmiede: { name: 'Schmiede', zeichnen: schmiede, halbeBreite: 2.0, trefferBreite: 2.2, trefferOben: 3.6, trefferUnten: 1.2 },
  // Ein Feld, aber hoch: der Turm (kampf AC-18).
  aussenposten: { name: 'Außenposten', zeichnen: aussenposten, halbeBreite: 1.0, trefferBreite: 1.1, trefferOben: 5.0, trefferUnten: 0.8 },
  // Gebaeude der Ritterzeit (bauen AC-28).
  kloster: { name: 'Kloster', zeichnen: kloster, halbeBreite: 2.2, trefferBreite: 2.3, trefferOben: 4.8, trefferUnten: 1.2 },
  universitaet: { name: 'Universität', zeichnen: universitaet, halbeBreite: 2.4, trefferBreite: 2.5, trefferOben: 3.6, trefferUnten: 1.3 },
  belagerungswerkstatt: {
    name: 'Belagerungswerkstatt', zeichnen: belagerungswerkstatt, halbeBreite: 2.3, trefferBreite: 2.4, trefferOben: 2.8, trefferUnten: 1.3,
  },
  // Ein Feld wie der Aussenposten, aus Stein und mit Zinnen (bauen AC-29).
  // `schussHoehe`: dort oben, auf dem Wehrgang, beginnt ein Pfeil - in
  // halben Rautenbreiten wie die Zeichnung (bedienung AC-40).
  wachturm: {
    name: 'Wachturm', zeichnen: wachturm, halbeBreite: 1.0, trefferBreite: 1.1, trefferOben: 5.2, trefferUnten: 0.8, schussHoehe: 3.6,
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
 * @param {number} [rest] bei einer Farm: Anteil der Nahrung, die noch da ist
 */
export function gebaeudeZeichnen(stift, art, x, y, e, farbe, groesse, bau = 1, rest = 1) {
  const gebaeude = GEBAEUDE[art];
  if (!gebaeude) return;
  const m = e * massstab(gebaeude, groesse);
  stift.save();
  stift.translate(x, y);
  if (bau < 1) baustelle(stift, m, gebaeude.halbeBreite * m, bau);
  else gebaeude.zeichnen(stift, m, farbe, { rest });
  stift.restore();
}

// Gezeichnet werden Gebaeude jetzt mit Hunderten Strichen (AC-12). Im Spielbild
// wird deshalb jedes einmal in ein kleines Bild gezeichnet und danach nur
// kopiert - neu erst, wenn sich Zoom, Farbe oder Baufortschritt aendern.
const ZWISCHENSPEICHER = new Map();
const SPEICHER_MAX = 64;

export function gebaeudeBildZeichnen(stift, art, x, y, e, farbe, groesse, bau = 1, rest = 1) {
  const gebaeude = GEBAEUDE[art];
  if (!gebaeude || typeof document === 'undefined') {
    gebaeudeZeichnen(stift, art, x, y, e, farbe, groesse, bau, rest);
    return;
  }
  const restStufe = Math.ceil(Math.max(0, Math.min(1, rest)) * 10) / 10;
  const m = e * massstab(gebaeude, groesse);
  const dichte = window.devicePixelRatio || 1;
  // Baufortschritt in Zwanzigsteln: die Baustelle waechst sichtbar, der
  // Speicher bleibt klein.
  const stufe = bau < 1 ? Math.floor(bau * 20) / 20 : 1;
  const schluessel = `${art}|${farbe}|${m.toFixed(2)}|${stufe}|${restStufe}|${dichte}`;
  let bild = ZWISCHENSPEICHER.get(schluessel);
  // Breit genug fuer den Schlagschatten nach rechts.
  const breite = 10 * m;
  const oben = 6.4 * m;
  const unten = 2.6 * m;
  if (!bild) {
    bild = document.createElement('canvas');
    bild.width = Math.ceil(breite * dichte);
    bild.height = Math.ceil((oben + unten) * dichte);
    const s = bild.getContext('2d');
    s.scale(dichte, dichte);
    gebaeudeZeichnen(s, art, breite / 2, oben, e, farbe, groesse, stufe, restStufe);
    ZWISCHENSPEICHER.set(schluessel, bild);
    if (ZWISCHENSPEICHER.size > SPEICHER_MAX) ZWISCHENSPEICHER.delete(ZWISCHENSPEICHER.keys().next().value);
  } else {
    // Zuletzt benutzt nach hinten, damit das Aelteste zuerst geht.
    ZWISCHENSPEICHER.delete(schluessel);
    ZWISCHENSPEICHER.set(schluessel, bild);
  }
  // Auf ganze Bildpunkte und in Originalgroesse: sonst glaettet der Browser bei
  // jedem Kopieren, und das kostete mit 100 Figuren und 30 Gebaeuden ein
  // Drittel der Bilder je Sekunde (darstellung AC-10, Runde 52).
  stift.drawImage(bild, Math.round((x - breite / 2) * dichte) / dichte, Math.round((y - oben) * dichte) / dichte, bild.width / dichte, bild.height / dichte);
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
