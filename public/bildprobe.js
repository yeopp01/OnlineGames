// Die Bildprobe (→ specs/10-strategie/darstellung.md AC-17, ADR-0014): drei
// gerenderte Stuecke neben ihren gezeichneten Vorgaengern. An diesem Bild
// entscheidet der Benutzer, ob der Umbau weitergeht.
//
// Die Seite bewegt sich: die Figuren gehen. Mit `?still=1` steht die Zeit -
// so nimmt der Browserlauf ein Bild auf, das sich nicht von Lauf zu Lauf
// aendert.

import { figurZeichnen } from './figuren.js';
import { gebaeudeZeichnen } from './gebaeude.js';
import { WALD, dingZeichnen } from './gelaende.js';
import { bilderEin, figurZelle, gerendert, richtungAus, zelleZeichnen } from './bilder.js';

const HALB_B = 22;          // halbe Rautenbreite bei Zoom 1, wie im Spielbild
const FIGUR_HOEHE = 1.3;
const STARTZOOM = 1.5;
const BLAU = '#4a90d9';
const ROT = '#d94a4a';
const GRAS = '#56622f';
const SCHRIFT = '600 13px system-ui, sans-serif';
const STILL = new URLSearchParams(location.search).has('still');

const figurHoehe = (zoom) => HALB_B * FIGUR_HOEHE * zoom;
const zeit = () => (STILL ? 1.3 : performance.now() / 1000);
// Derselbe Takt wie im Spielbild: ein Doppelschritt in rund 0,7 Sekunden.
const phase = (versatz = 0) => zeit() * 1000 / 110 + versatz;
const stufe = (p) => Math.floor(((p % (Math.PI * 2)) / (Math.PI * 2)) * 8) % 8;

function blatt(id) {
  const leinwand = document.getElementById(id);
  const dichte = window.devicePixelRatio || 1;
  const breite = leinwand.width;
  const hoehe = leinwand.height;
  leinwand.width = breite * dichte;
  leinwand.height = hoehe * dichte;
  const stift = leinwand.getContext('2d');
  stift.scale(dichte, dichte);
  return { stift, breite, hoehe };
}

function grund(b) {
  b.stift.fillStyle = GRAS;
  b.stift.fillRect(0, 0, b.breite, b.hoehe);
}

function schrift(stift, text, x, y, hell = 0.92) {
  stift.font = SCHRIFT;
  stift.fillStyle = `rgba(255, 255, 255, ${hell})`;
  stift.fillText(text, x, y);
}

function trennung(b, x) {
  b.stift.fillStyle = 'rgba(0, 0, 0, 0.28)';
  b.stift.fillRect(x - 1, 0, 2, b.hoehe);
}

function gerenderteFigur(stift, x, y, zoom, farbe, richtung, schritt) {
  const tafel = gerendert('dorfbewohner');
  if (!tafel) return;
  const zelle = figurZelle(tafel, richtung, schritt, 8);
  zelleZeichnen(stift, tafel, zelle.zeile, zelle.spalte, x, y, figurHoehe(zoom) / tafel.hoehe, farbe);
}

function gerendertesHaus(stift, x, y, zoom, farbe) {
  const tafel = gerendert('haus');
  if (tafel) zelleZeichnen(stift, tafel, 0, 0, x, y, (2 * HALB_B * zoom) / tafel.feldbreite, farbe);
}

function gerenderterBaum(stift, x, y, zoom, gestalt) {
  const tafel = gerendert('baum');
  if (tafel) zelleZeichnen(stift, tafel, 0, gestalt % tafel.gestalten, x, y, (2 * HALB_B * zoom) / tafel.feldbreite, null);
}

function gerenderterKarren(stift, x, y, zoom, farbe, richtung, schritt) {
  const tafel = gerendert('marktkarren');
  if (!tafel) return;
  const zelle = figurZelle(tafel, richtung, schritt, 8);
  zelleZeichnen(stift, tafel, zelle.zeile, zelle.spalte, x, y, (2 * HALB_B * zoom) / tafel.feldbreite, farbe);
}

const blaetter = {
  figur: blatt('probe-figur'),
  haus: blatt('probe-haus'),
  baum: blatt('probe-baum'),
  szene: blatt('probe-szene'),
  karren: blatt('probe-karren'),
};

function figurMalen(b) {
  const s = b.stift;
  grund(b);
  trennung(b, 340);
  schrift(s, 'gezeichnet (bisher) – zwei Blickrichtungen, gespiegelt', 16, 24);
  schrift(s, 'gerendert (neu) – acht Blickrichtungen, im Gehen', 360, 24);
  schrift(s, 'Zoom 3', 16, 48, 0.6);
  schrift(s, 'Spielgröße beim Start', 16, 228, 0.6);
  const p = phase();
  [[70, 1, BLAU], [165, -1, BLAU], [260, 1, ROT]].forEach(([x, blick, farbe]) => {
    figurZeichnen(s, 'dorfbewohner', x, 170, figurHoehe(3), farbe, { blick, schritt: p });
    figurZeichnen(s, 'dorfbewohner', x, 296, figurHoehe(STARTZOOM), farbe, { blick, schritt: p });
  });
  for (let richtung = 0; richtung < 8; richtung += 1) {
    const x = 410 + richtung * 94;
    gerenderteFigur(s, x, 170, 3, richtung < 5 ? BLAU : ROT, richtung, stufe(p));
    gerenderteFigur(s, x, 296, STARTZOOM, richtung < 5 ? BLAU : ROT, richtung, stufe(p));
  }
}

function hausMalen(b) {
  const s = b.stift;
  grund(b);
  trennung(b, 580);
  schrift(s, 'gezeichnet (bisher)', 16, 24);
  schrift(s, 'gerendert (neu)', 600, 24);
  gebaeudeZeichnen(s, 'haus', 190, 290, HALB_B * 3, BLAU, 2);
  gebaeudeZeichnen(s, 'haus', 460, 220, HALB_B * STARTZOOM, ROT, 2);
  gerendertesHaus(s, 760, 290, 3, BLAU);
  gerendertesHaus(s, 1030, 220, STARTZOOM, ROT);
  schrift(s, 'Zoom 3', 16, 48, 0.6);
  schrift(s, 'Spielgröße beim Start', 400, 120, 0.6);
  schrift(s, 'Spielgröße beim Start', 965, 120, 0.6);
}

function baumMalen(b) {
  const s = b.stift;
  grund(b);
  trennung(b, 580);
  schrift(s, 'gezeichnet (bisher)', 16, 24);
  schrift(s, 'gerendert (neu) – vier Gestalten', 600, 24);
  for (let i = 0; i < 4; i += 1) {
    dingZeichnen(s, WALD, 80 + i * 130, 250, HALB_B * 2, i * 7 + 3, 1);
    gerenderterBaum(s, 660 + i * 125, 250, 2, i);
  }
}

// Eine kleine Szene in Spielgroesse, zweimal dieselbe: links gezeichnet,
// rechts gerendert. Vier Dorfbewohner gehen im Kreis um das Haus.
const BAEUME = [[70, 150, 0], [125, 118, 1], [185, 92, 2], [250, 70, 3], [105, 205, 2], [40, 230, 1], [500, 120, 0], [545, 165, 3]];

function szeneMalen(b) {
  const s = b.stift;
  grund(b);
  const zoom = STARTZOOM;
  const t = zeit();
  for (const seite of [0, 1]) {
    const x0 = seite * 580;
    s.save();
    s.beginPath();
    s.rect(x0, 0, 580, b.hoehe);
    s.clip();
    const dinge = [];
    for (const [x, y, gestalt] of BAEUME) {
      dinge.push({ y, malen: () => (seite ? gerenderterBaum(s, x0 + x, y, zoom, gestalt) : dingZeichnen(s, WALD, x0 + x, y, HALB_B * zoom, gestalt * 7 + 3, 1)) });
    }
    dinge.push({ y: 245, malen: () => (seite ? gerendertesHaus(s, x0 + 320, 245, zoom, BLAU) : gebaeudeZeichnen(s, 'haus', x0 + 320, 245, HALB_B * zoom, BLAU, 2)) });
    for (let i = 0; i < 4; i += 1) {
      const w = t * 0.35 + i * Math.PI / 2;
      const x = 320 + Math.cos(w) * 190;
      const y = 275 + Math.sin(w) * 95;
      const dx = -Math.sin(w) * 190;
      const dy = Math.cos(w) * 95;
      const p = phase(i * 1.7);
      const farbe = i === 3 ? ROT : BLAU;
      dinge.push({
        y,
        malen: () => (seite
          ? gerenderteFigur(s, x0 + x, y, zoom, farbe, richtungAus(dx, dy), stufe(p))
          : figurZeichnen(s, 'dorfbewohner', x0 + x, y, figurHoehe(zoom), farbe, { blick: dx < 0 ? -1 : 1, schritt: p })),
      });
    }
    dinge.sort((a, c) => a.y - c.y).forEach((d) => d.malen());
    s.restore();
    schrift(s, seite ? 'gerendert (neu)' : 'gezeichnet (bisher)', x0 + 16, 24);
  }
  trennung(b, 580);
}

// Der Marktkarren: acht Blickrichtungen im Gehen, gross und in Spielgroesse;
// ein Dorfbewohner steht daneben, damit man das Verhaeltnis sieht.
function karrenMalen(b) {
  const s = b.stift;
  grund(b);
  schrift(s, 'gerendert (neu) – acht Blickrichtungen, im Gehen', 16, 24);
  schrift(s, 'Zoom 2,5', 16, 48, 0.6);
  schrift(s, 'Spielgröße beim Start', 16, 498, 0.6);
  const p = phase();
  for (let richtung = 0; richtung < 8; richtung += 1) {
    const farbe = richtung < 5 ? BLAU : ROT;
    gerenderterKarren(s, 150 + (richtung % 4) * 285, richtung < 4 ? 185 : 385, 2.5, farbe, richtung, stufe(p));
    gerenderterKarren(s, 100 + richtung * 132, 585, STARTZOOM, farbe, richtung, stufe(p));
  }
  // Ein Dorfbewohner daneben als Massstab - neben dem letzten Karren, nicht davor.
  gerenderteFigur(s, 1118, 600, STARTZOOM, BLAU, 1, -1);
  gerenderteFigur(s, 1095, 305, 2.5, BLAU, 1, -1);
}

function malen() {
  figurMalen(blaetter.figur);
  hausMalen(blaetter.haus);
  baumMalen(blaetter.baum);
  szeneMalen(blaetter.szene);
  karrenMalen(blaetter.karren);
  if (!STILL) requestAnimationFrame(malen);
}

bilderEin().then(() => {
  malen();
  // Fuer den Browserlauf: die Seite sagt, wann ihre Bilder gemalt sind.
  window.bildprobe = { fertig: true, tafeln: ['dorfbewohner', 'haus', 'baum'].map((name) => {
    const tafel = gerendert(name);
    return { name, zelle: tafel.zelle, zeilen: tafel.zeilen, spalten: tafel.spalten };
  }) };
});
